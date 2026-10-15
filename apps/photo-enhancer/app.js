/* AI Photo Enhancer: make small, blurry or old photos bigger and clearer, fully on the device.
   AI upscale: Swin2SR super-resolution models (Apache-2.0, from Hugging Face) run with Transformers.js 4.3.0
   (ONNX Runtime Web, WebAssembly; optional WebGPU). The photo is cut into overlapping tiles so memory stays low,
   and the overlaps are blended with feathered weights so no joins show.
     Best  = Xenova/swin2SR-realworld-sr-x4-64-bsrgan-psnr (×4, trained on real-world blur + JPEG noise).
             8-bit "uint8" weights on WebAssembly (19.0 MB; same speed and look as "q8", but the model gets ready
             in about 2.5 s instead of 12 s); full "fp32" weights on WebGPU (52.8 MB), because the fp16 / q4f16
             variants fail or give broken pictures on WebGPU (tested Oct 2026).
             For 2× the ×4 result of each tile is averaged down 2×2 (shrinking the photo first and then ×4 is
             4 times faster but clearly loses detail, so it is not used).
     Quick = Xenova/swin2SR-lightweight-x2-64 (×2, uint8, 5.5 MB). About 4 times faster, but keeps JPEG noise.
   Speed (Oct 2026 laptop): a static site cannot use multi-threaded WebAssembly, so up to 4 workers each
   enhance a different tile at the same time (about 2.6 times faster). Best on a 256 × 192 photo: 88 s → 22 s;
   512 × 384: 262 s → 75 s. The time is shown before starting, and for a big photo Quick is picked unless the
   user chose a model. WebGPU stays an option: on a laptop's built-in graphics it is only ~1.4 times faster
   than 4 workers but needs a 2.8 times bigger download.
   Quick fixes (no model): auto levels + white balance, gentle edge-keeping denoise, unsharp mask, old-photo
   fade fix, sepia / black & white. Nothing is uploaded: only the engine and the model are downloaded, once. */
(function () {
  'use strict';
  var SLUG = 'photo-enhancer';
  var t = EDU.t, $ = EDU.$;
  var store = EDU.store(SLUG);

  /* ------------------------------------------------------------------ constants */
  var TJS = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0/dist/transformers.min.js';
  var HF = 'https://huggingface.co/';
  var ENGINE_MB = 5.7;            // transformers.min.js (0.17 MB) + ONNX Runtime WebAssembly (5.5 MB, compressed)
  var MODELS = {
    best: { repo: 'Xenova/swin2SR-realworld-sr-x4-64-bsrgan-psnr', scale: 4,
      wasm: { dtype: 'uint8', file: 'onnx/model_uint8.onnx', mb: 19.0 },
      gpu: { dtype: 'fp32', file: 'onnx/model.onnx', mb: 52.8 } },
    quick: { repo: 'Xenova/swin2SR-lightweight-x2-64', scale: 2,
      wasm: { dtype: 'uint8', file: 'onnx/model_uint8.onnx', mb: 5.5 } }
  };
  var OVERLAP = 16;               // input pixels that neighbouring tiles share (blended, so no joins show)
  var WORKERS_MAX = 4;
  var OUT_MAX = 2048, PHONE_IN_MAX = 512, WORK_MAX = 3000;
  var CANCEL = { cancelled: true };

  var isPhone = (function () {
    try { return matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 820; } catch (e) { return false; }
  })();

  /* ------------------------------------------------------------------ settings */
  var DEF = { scale: 2, model: isPhone ? 'quick' : 'best', modelSet: false, gpu: false, auto: false, old: false, color: 'keep', fmt: 'jpg', size: 'enh' };
  var S = Object.assign({}, DEF, store.get('settings', {}));
  (function sanitize() {
    if (S.scale !== 2 && S.scale !== 4) S.scale = 2;
    if (!MODELS[S.model]) S.model = DEF.model;
    if (['keep', 'sepia', 'bw'].indexOf(S.color) < 0) S.color = 'keep';
    if (['jpg', 'png'].indexOf(S.fmt) < 0) S.fmt = 'jpg';
    if (['enh', 'orig'].indexOf(S.size) < 0) S.size = 'enh';
    ['gpu', 'auto', 'old', 'modelSet'].forEach(function (k) { S[k] = !!S[k]; });
  })();
  function saveS() { store.set('settings', S); }

  /* ------------------------------------------------------------------ state */
  var src = null;          // { name, canvas, w, h, natW, natH, sample }
  var ai = null;           // { canvas, scale, model, inW, inH }
  var busy = false, runToken = 0, lastStage = null, lastError = null, t0 = 0;
  var gpuOK = false, gpuBroken = false;
  var saved = {};          // "repo|file" -> true when the model is in the browser cache
  var engine = { libP: null, libTries: 0, pool: null, noWorker: false, lastRun: Promise.resolve(), onProg: null };

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  var cvAfter = $('#cvAfter'), cvBefore = $('#cvBefore'), cmp = $('#cmp'), cmpBox = $('#cmpBox');

  /* ------------------------------------------------------------------ helpers */
  function show(node, on) { node.hidden = !on; }
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function ctx2d(c) { return c.getContext('2d', { willReadFrequently: true }); }
  function dims(w, h) { return '\u2066' + EDU.fmt(w) + '\u00a0×\u00a0' + EDU.fmt(h) + '\u2069'; }   // isolated, so numbers stay left-to-right inside Urdu text
  function mbText(n) { return EDU.fmt(Math.round(n)); }
  function baseName(name) { return String(name || 'photo').replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[\\/:*?"<>|\s]+/g, '-').slice(0, 60) || 'photo'; }
  function variant(mk, dev) { var m = MODELS[mk]; return dev === 'webgpu' && m.gpu ? m.gpu : m.wasm; }
  function device(mk) { return S.gpu && gpuOK && !gpuBroken && MODELS[mk].gpu ? 'webgpu' : 'wasm'; }
  function curModel() { return S.scale === 4 ? 'best' : S.model; }
  function downloadMB(mk) { return variant(mk, device(mk)).mb + ENGINE_MB; }
  function isSaved(mk) { var v = variant(mk, device(mk)); return !!saved[MODELS[mk].repo + '|' + v.file]; }
  function nextFrame() { return new Promise(function (r) { setTimeout(r, 0); }); }

  /* Resize with good quality: halve step by step, then the last step. */
  function resized(c, w, h, keepAlpha) {
    w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
    var cur = c;
    while (cur.width / 2 >= w && cur.height / 2 >= h && cur.width > 2) {
      var half = canvas(cur.width / 2, cur.height / 2), hx = half.getContext('2d');
      hx.imageSmoothingEnabled = true; hx.imageSmoothingQuality = 'high';
      hx.drawImage(cur, 0, 0, half.width, half.height);
      cur = half;
    }
    var out = canvas(w, h), x = out.getContext('2d');
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    if (!keepAlpha) { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); }
    x.drawImage(cur, 0, 0, w, h);
    return out;
  }

  /* ------------------------------------------------------------------ AI input size
     If the user has not picked a model and "Best" would take more than about a minute and a quarter on this
     device (a big photo), "Quick" is used and the note says how long Best would take. */
  var AUTO_QUICK_SECS = 75;
  function sizedPlan(mk) {
    var scale = mk === 'quick' ? 2 : S.scale, long = Math.max(src.w, src.h);
    var maxIn = isPhone ? PHONE_IN_MAX : Math.floor(OUT_MAX / scale);
    var f = Math.min(1, maxIn / long);
    return { mk: mk, scale: scale, inW: Math.max(1, Math.round(src.w * f)), inH: Math.max(1, Math.round(src.h * f)), shrink: f < 1 };
  }
  function aiPlan() {
    if (!src) return null;
    if (Math.max(src.w, src.h) >= OUT_MAX) return { tooBig: true };
    var p = sizedPlan(curModel());
    if (!S.modelSet && !isPhone && p.mk === 'best' && S.scale === 2) {
      var secs = planSecs(p);
      if (secs > AUTO_QUICK_SECS) { var q = sizedPlan('quick'); q.auto = true; q.bestSecs = secs; return q; }
    }
    return p;
  }
  function effModel() { var p = aiPlan(); return p && p.mk ? p.mk : curModel(); }
  /* seconds for the whole job: getting the model ready (if it is not ready yet) plus all the tiles */
  var LOAD0 = { 'best|wasm': 5, 'best|webgpu': 5, 'quick|wasm': 3 };
  function planSecs(p) {
    var dev = device(p.mk), key = p.mk + '|' + dev, tp = planFor(p, dev);
    var n = engine.noWorker ? 1 : Math.min(tp.list.length, poolSize(dev));
    var ready = engine.pool && engine.pool.key === key;
    return estimateSecs(key, tp.work, n) + (ready ? 0 : LOAD0[key] * (isPhone ? 2 : 1));
  }

  /* ------------------------------------------------------------------ engine
     The model runs in a background thread (a Web Worker made from the text below), so the page never freezes
     and Cancel stops it at once. Browsers that cannot import() inside a worker run it in the page instead. */
  var WORKER_SRC = [
    'var T = null, models = {}, cur = null;',
    'function post(m, tr) { self.postMessage(m, tr || []); }',
    'function lib(url) {',
    '  if (T) return Promise.resolve(T);',
    '  return import("data:text/javascript,export default 1").then(function () {',
    '    return import(url).then(function (t) { T = t; T.env.allowLocalModels = false; return t; });',
    '  }, function () { throw { unsupported: true }; });',
    '}',
    'self.onmessage = function (e) {',
    '  var m = e.data;',
    '  if (m.type === "load") {',
    '    lib(m.tjs).then(function () {',
    '      var key = m.repo + "|" + m.dtype + "|" + m.device;',
    '      Object.keys(models).forEach(function (k) { if (k !== key) { models[k].then(function (x) { try { x.dispose(); } catch (er) { } }, function () { }); delete models[k]; } });',
    '      if (!models[key]) {',
    '        var files = {};',
    '        models[key] = T.AutoModel.from_pretrained(m.repo, { dtype: m.dtype, device: m.device, progress_callback: function (p) {',
    '          if (!p || !p.file) return;',
    '          if (p.status === "progress" && p.total) files[p.file] = { loaded: p.loaded || 0, total: p.total };',
    '          else if (p.status === "done" && files[p.file]) files[p.file].loaded = files[p.file].total;',
    '          var lo = 0, to = 0; for (var k in files) { lo += files[k].loaded; to += files[k].total; }',
    '          if (to > 1e6) post({ type: "progress", loaded: lo, total: to });',
    '        } });',
    '        models[key].catch(function () { delete models[key]; });',
    '      }',
    '      return models[key];',
    '    }).then(function (model) { cur = model; post({ type: "ok", id: m.id }); },',
    '      function (er) { post({ type: "error", id: m.id, unsupported: !!(er && er.unsupported), message: String(er && er.message || er) }); });',
    '  } else if (m.type === "run") {',
    '    cur({ pixel_values: new T.Tensor("float32", m.data, m.dims) }).then(function (o) {',
    '      var r = o.reconstruction, d = new Float32Array(r.data);',
    '      try { r.dispose(); } catch (er) { }',
    '      post({ type: "ok", id: m.id, data: d, dims: r.dims.slice() }, [d.buffer]);',
    '    }, function (er) { post({ type: "error", id: m.id, message: String(er && er.message || er) }); });',
    '  }',
    '};'
  ].join('\n');

  var live = [];            // every runner that is loading or loaded, so Cancel can stop them all
  function workerRunner() {
    var w, url;
    try {
      url = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }));
      w = new Worker(url);
    } catch (e) { return null; }
    var seq = 0, pending = {}, dead = false;
    function failAll(err) { Object.keys(pending).forEach(function (k) { pending[k].reject(err); delete pending[k]; }); }
    w.onmessage = function (e) {
      var m = e.data;
      if (m.type === 'progress') { if (engine.onProg) engine.onProg(m.loaded, m.total); return; }
      var p = pending[m.id]; if (!p) return;
      delete pending[m.id];
      if (m.type === 'error') p.reject({ unsupported: m.unsupported, message: m.message }); else p.resolve(m);
    };
    w.onerror = function (e) { if (e.preventDefault) e.preventDefault(); dead = true; failAll({ unsupported: true, message: 'worker: ' + (e.message || 'error') }); };
    function call(msg, transfer) {
      if (dead) return Promise.reject({ message: 'stopped' });
      return new Promise(function (resolve, reject) { msg.id = ++seq; pending[msg.id] = { resolve: resolve, reject: reject }; w.postMessage(msg, transfer || []); });
    }
    return {
      kind: 'worker',
      load: function (mk, dev) { var v = variant(mk, dev); return call({ type: 'load', tjs: TJS, repo: MODELS[mk].repo, dtype: v.dtype, device: dev }); },
      run: function (data, dims) { return call({ type: 'run', data: data, dims: dims }, [data.buffer]); },
      /* ending the worker frees the model's memory and also forgets a failed import(), so a retry starts clean */
      stop: function () { dead = true; try { w.terminate(); } catch (e) { } if (url) URL.revokeObjectURL(url); url = null; failAll(CANCEL); }
    };
  }

  /* fallback: the same work in the page itself (one tile at a time) */
  function loadLib() {
    if (!engine.libP) {
      var imp;
      try { imp = new Function('u', 'return import(u)'); } catch (e) { return Promise.reject({ old: true }); }
      /* the browser remembers a failed import() for that exact address, so a retry asks for a new one */
      engine.libP = imp(TJS + (engine.libTries ? '?retry=' + engine.libTries : '')).then(function (T) {
        T.env.allowLocalModels = false;          // never ask this website for model files
        return T;
      });
      engine.libP.catch(function () { engine.libP = null; engine.libTries = (engine.libTries || 0) + 1; });
    }
    return engine.libP;
  }
  function pageRunner() {
    var modelP = null, cur = null;
    return {
      kind: 'page',
      load: function (mk, dev) {
        var v = variant(mk, dev);
        return loadLib().then(function (T) {
          if (!modelP) {
            var files = {};
            modelP = T.AutoModel.from_pretrained(MODELS[mk].repo, {
              dtype: v.dtype, device: dev,
              progress_callback: function (e) {
                if (!e || !e.file) return;
                if (e.status === 'progress' && e.total) files[e.file] = { loaded: e.loaded || 0, total: e.total };
                else if (e.status === 'done' && files[e.file]) files[e.file].loaded = files[e.file].total;
                var lo = 0, to = 0;
                Object.keys(files).forEach(function (k) { lo += files[k].loaded; to += files[k].total; });
                if (engine.onProg && to > 1e6) engine.onProg(lo, to);
              }
            });
            modelP.catch(function () { modelP = null; });
          }
          return modelP;
        }).then(function (m) { cur = m; });
      },
      run: function (data, dims) {
        return loadLib().then(function (T) { return cur({ pixel_values: new T.Tensor('float32', data, dims) }); })
          .then(function (o) { var r = o.reconstruction; return { data: r.data, dims: r.dims }; });
      },
      stop: function () {                        // free the model's memory
        if (modelP) modelP.then(function (m) { try { m.dispose(); } catch (e) { } }, function () { });
        modelP = null; cur = null;
      }
    };
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function newRunner() { var r = (engine.noWorker ? null : workerRunner()) || pageRunner(); live.push(r); return r; }
  function dropRunner(r) { var i = live.indexOf(r); if (i >= 0) live.splice(i, 1); r.stop(); }
  function stopAll() { engine.pool = null; live.slice().forEach(dropRunner); }
  /* How many workers enhance tiles at the same time: about half the processor cores, fewer on phones and on
     devices with little memory. The graphics card (WebGPU) is one device, so it gets one worker. */
  function poolSize(dev) {
    if (dev === 'webgpu') return 1;
    var n = Math.floor((navigator.hardwareConcurrency || 2) / 2), mem = navigator.deviceMemory || 8;
    return Math.max(1, Math.min(n, isPhone ? 2 : WORKERS_MAX, mem < 4 ? 1 : mem < 8 ? 2 : WORKERS_MAX));
  }
  function modelURL(mk, d) { return HF + MODELS[mk].repo + '/resolve/main/' + MODELS[mk][d].file; }
  function inCache(mk, dev) {
    if (!window.caches) return Promise.resolve(false);
    return caches.open('transformers-cache').then(function (c) { return c.match(modelURL(mk, dev === 'webgpu' ? 'gpu' : 'wasm')); })
      .then(function (r) { return !!r; }, function () { return false; });
  }
  /* Load one runner. One quiet retry after a short wait, in a fresh worker: busy servers (HTTP 429) and flaky
     mobile data often work the second time. */
  function loadOne(mk, dev, token, retried) {
    var r = newRunner();
    return r.load(mk, dev).then(function () {
      if (token !== runToken) { dropRunner(r); throw CANCEL; }
      return r;
    }, function (e) {
      dropRunner(r);
      if (e === CANCEL || token !== runToken) throw CANCEL;
      if (e && e.unsupported && r.kind === 'worker') { engine.noWorker = true; return loadOne(mk, dev, token, retried); }
      if (retried) throw e;
      return wait(4000).then(function () { if (token !== runToken) throw CANCEL; return loadOne(mk, dev, token, true); });
    });
  }
  /* The pool of runners for this model. The work starts as soon as ONE runner has the model; the others join in
     when they are ready (want = how many the photo can use). Extra workers start only when the model is
     already in the browser's cache, so it is never downloaded twice. Switching model frees the old one. */
  function getPool(mk, dev, token, want) {
    var key = mk + '|' + dev, pool = engine.pool;
    if (pool && pool.key === key && pool.runners.length) { grow(pool, mk, dev, want); return Promise.resolve(pool); }
    stopAll();
    pool = engine.pool = { key: key, runners: [], loading: 0, join: null };
    return inCache(mk, dev).then(function (cached) {
      if (cached) grow(pool, mk, dev, want - 1);     // load the extra workers at the same time as the first
      return loadOne(mk, dev, token, false);
    }).then(function (first) {
      if (engine.pool !== pool) { dropRunner(first); throw CANCEL; }
      saved[MODELS[mk].repo + '|' + variant(mk, dev).file] = true;
      pool.runners.unshift(first);
      grow(pool, mk, dev, want);
      return pool;
    });
  }
  function grow(pool, mk, dev, want) {
    var add = Math.min(want, poolSize(dev)) - pool.runners.length - pool.loading;
    if (add < 1 || engine.noWorker) return;
    pool.loading += add;
    inCache(mk, dev).then(function (ok) {
      for (var i = 0; i < add; i++) {
        if (!ok || engine.pool !== pool || engine.noWorker) { pool.loading--; continue; }
        (function (r) {
          r.load(mk, dev).then(function () {
            pool.loading--;
            if (engine.pool !== pool) return dropRunner(r);
            pool.runners.push(r);
            if (pool.join) pool.join(r);
          }, function () { pool.loading--; dropRunner(r); });
        })(newRunner());
      }
    });
  }
  function refreshSaved() {
    if (!window.caches) return Promise.resolve();
    return caches.open('transformers-cache').then(function (c) {
      var jobs = [];
      Object.keys(MODELS).forEach(function (mk) {
        ['wasm', 'gpu'].forEach(function (d) {
          var v = MODELS[mk][d]; if (!v) return;
          jobs.push(c.match(modelURL(mk, d)).then(function (r) { if (r) saved[MODELS[mk].repo + '|' + v.file] = true; }));
        });
      });
      return Promise.all(jobs);
    }).catch(function () { }).then(renderAI);
  }

  /* Tiles: a grid of equal tiles, evenly spread, each overlapping its neighbours by at least OVERLAP pixels.
     Sizes are multiples of 8 (the Swin window), so no time is spent on padding. The grid is chosen for the
     number of workers n: the time is about (rounds of tiles) × (pixels in one tile), so 4 tiles for 4 workers
     beat 6 smaller ones (the last 2 would run alone). */
  function spans(len, k) {
    if (k <= 1) return [[0, len]];
    var size = Math.min(len, tileSide(len, k)), a = [];
    for (var i = 0; i < k; i++) a.push([Math.round(i * (len - size) / (k - 1)), size]);
    return a;
  }
  function tileSide(len, k) { return k <= 1 ? Math.ceil(len / 8) * 8 : Math.min(Math.ceil(len / 8) * 8, Math.ceil((len + (k - 1) * OVERLAP) / k / 8) * 8); }
  function tilePlan(W, H, n, maxT) {
    var best = null;
    for (var kx = 1; kx <= Math.ceil(W / 24); kx++) {
      var tw = tileSide(W, kx);
      if (tw > maxT || (kx > 1 && tw < 64)) continue;      // tiny tiles see too little of the photo
      for (var ky = 1; ky <= Math.ceil(H / 24); ky++) {
        var th = tileSide(H, ky);
        if (th > maxT || (ky > 1 && th < 64)) continue;
        var tiles = kx * ky, cost = Math.ceil(tiles / n) * (tw * th + 2000) + tiles * tw * th / 1000;
        if (!best || cost < best.cost) best = { kx: kx, ky: ky, cost: cost };
      }
    }
    var list = [], work = 0;
    spans(H, best.ky).forEach(function (y) { spans(W, best.kx).forEach(function (x) {
      list.push({ x: x[0], y: y[0], w: x[1], h: y[1] });
      work += Math.ceil(x[1] / 8) * 8 * Math.ceil(y[1] / 8) * 8;
    }); });
    return { list: list, work: work };
  }
  function tileMax(dev) { return dev === 'webgpu' ? 256 : isPhone ? 128 : 192; }
  function planFor(p, dev) {
    var n = engine.noWorker ? 1 : poolSize(dev);
    return tilePlan(p.inW, p.inH, n, tileMax(dev));
  }

  /* Run the model over overlapping tiles (several at once when there are several workers) and blend them.
     Returns a canvas of size (w*outScale, h*outScale). */
  function upscaleTiles(pool, inCanvas, modelScale, outScale, token, key, plan) {
    var W = inCanvas.width, H = inCanvas.height;
    var px = ctx2d(inCanvas).getImageData(0, 0, W, H).data;
    var OW = W * outScale, OH = H * outScale, f = modelScale / outScale;   // f = 1 or 2 (average 2×2)
    var acc = new Float32Array(OW * OH * 3), wsum = new Float32Array(OW * OH);
    var list = plan.list;
    var ov = OVERLAP * outScale, next = 0, done = 0;

    function blend(T, r) {
      var od = r.data, rw = r.dims[3], rp = r.dims[2] * rw;
      var tx = T.x, ty = T.y, bw = T.w * outScale, bh = T.h * outScale;
      for (var oy = 0; oy < bh; oy++) {
        var wy = 1;
        if (ty > 0) wy = Math.min(wy, (oy + 0.5) / ov);
        if (ty + T.h < H) wy = Math.min(wy, (bh - oy - 0.5) / ov);
        for (var ox = 0; ox < bw; ox++) {
          var wx = 1;
          if (tx > 0) wx = Math.min(wx, (ox + 0.5) / ov);
          if (tx + T.w < W) wx = Math.min(wx, (bw - ox - 0.5) / ov);
          var w = Math.max(1e-4, wx * wy), rr, gg, b2;
          if (f === 1) { var ri = oy * rw + ox; rr = od[ri]; gg = od[rp + ri]; b2 = od[2 * rp + ri]; }
          else {
            var r0 = (oy * 2) * rw + ox * 2, r1 = r0 + rw;
            rr = (od[r0] + od[r0 + 1] + od[r1] + od[r1 + 1]) / 4;
            gg = (od[rp + r0] + od[rp + r0 + 1] + od[rp + r1] + od[rp + r1 + 1]) / 4;
            b2 = (od[2 * rp + r0] + od[2 * rp + r0 + 1] + od[2 * rp + r1] + od[2 * rp + r1 + 1]) / 4;
          }
          var oi = (ty * outScale + oy) * OW + tx * outScale + ox;
          acc[oi * 3] += rr * w; acc[oi * 3 + 1] += gg * w; acc[oi * 3 + 2] += b2 * w; wsum[oi] += w;
        }
      }
    }
    var cost = [];                                 // ms per pixel of each tile (for the next time estimate)
    function lane(runner) {
      if (token !== runToken) return Promise.reject(CANCEL);
      if (next >= list.length) return Promise.resolve();
      var T = list[next++];
      var pw = Math.ceil(T.w / 8) * 8, ph = Math.ceil(T.h / 8) * 8, plane = pw * ph;
      var data = new Float32Array(3 * plane);
      for (var yy = 0; yy < ph; yy++) {
        var sy = T.y + Math.min(yy, T.h - 1);
        for (var xx = 0; xx < pw; xx++) {
          var si = (sy * W + T.x + Math.min(xx, T.w - 1)) * 4, di = yy * pw + xx;
          data[di] = px[si] / 255; data[plane + di] = px[si + 1] / 255; data[2 * plane + di] = px[si + 2] / 255;
        }
      }
      var t1 = Date.now(), lanes = pool.runners.length;
      return runner.run(data, [1, 3, ph, pw]).then(function (r) {
        if (token !== runToken) throw CANCEL;
        cost.push({ ms: (Date.now() - t1) / plane, n: lanes, tile: Date.now() - t1 });
        blend(T, r);
        done++;
        var per = 0; cost.forEach(function (c) { per += c.tile; }); per /= cost.length;   // one tile, one worker
        stage('tile', done / list.length, { n: Math.min(done + 1, list.length), total: list.length, left: per * (list.length - done) / Math.max(1, pool.runners.length) / 1000 });
        return nextFrame().then(function () { return lane(runner); });
      });
    }
    function compose() {
      learnSpeed(key, cost);
      var out = canvas(OW, OH), x = ctx2d(out), id = x.createImageData(OW, OH), d = id.data;
      for (var k = 0, n = OW * OH; k < n; k++) {
        var s = wsum[k] || 1;
        d[k * 4] = Math.round(Math.min(1, Math.max(0, acc[k * 3] / s)) * 255);
        d[k * 4 + 1] = Math.round(Math.min(1, Math.max(0, acc[k * 3 + 1] / s)) * 255);
        d[k * 4 + 2] = Math.round(Math.min(1, Math.max(0, acc[k * 3 + 2] / s)) * 255);
        d[k * 4 + 3] = 255;
      }
      x.putImageData(id, 0, 0);
      return out;
    }
    stage('tile', 0, { n: 1, total: list.length, left: estimateSecs(key, plan.work, Math.min(list.length, poolSize(key.split('|')[1]))) });
    return new Promise(function (resolve, reject) {
      var over = false;
      function start(r) {
        lane(r).then(function () {
          if (over || done < list.length) return;
          over = true; pool.join = null; resolve(compose());
        }, function (e) { if (!over) { over = true; pool.join = null; reject(e); } });
      }
      pool.join = function (r) { if (!over && next < list.length) start(r); };   // a worker that finished loading joins in
      pool.runners.forEach(start);
    });
  }

  /* ------------------------------------------------------------------ time estimate
     Milliseconds per input pixel for ONE worker working alone on a normal laptop (measured Oct 2026). When n
     workers run together each one is slower (they share the memory), about n^0.3 times; so n workers finish
     about n^0.7 times faster. After every run the number is replaced by what really happened on this device. */
  var SPEED0 = { 'best|wasm': 0.72, 'best|webgpu': 0.24, 'quick|wasm': 0.15 };
  var speed = store.get('speed', {});
  function soloMs(key) {
    var sp = speed[key];
    if (sp && sp.ms > 0 && sp.n >= 1) return sp.ms / Math.pow(sp.n, 0.3);
    return (SPEED0[key] || 1) * (isPhone ? 3 : 1);
  }
  function estimateSecs(key, work, n) {
    n = Math.max(1, n);
    return soloMs(key) * work / Math.pow(n, 0.7) / 1000;
  }
  function learnSpeed(key, cost) {
    if (!cost.length) return;
    var ms = 0, n = 0;
    cost.forEach(function (c) { ms += c.ms; n += c.n; });
    speed[key] = { ms: ms / cost.length, n: n / cost.length };   // ms per pixel for one worker, with n working
    store.set('speed', speed);
  }

  function enhance() {
    if (busy || !src) return;
    var plan = aiPlan();
    if (!plan || plan.tooBig) return;
    var mk = plan.mk, dev = device(mk), token = ++runToken;
    busy = true; lastError = null; renderError(); t0 = Date.now();
    $('#app').dataset.state = 'busy';
    renderAI();
    var inCanvas = plan.shrink ? resized(src.canvas, plan.inW, plan.inH) : resized(src.canvas, src.w, src.h);   // also flattens transparency on white
    stage('lib', null);
    engine.onProg = function (lo, to) {
      if (token !== runToken) return;
      if (lo >= to) stage('prep', null);
      else stage('model', lo / to, { done: lo / 1e6, total: to / 1e6 });
    };
    var phase = 'load';
    var run = engine.lastRun.catch(function () { }).then(function () {
      if (token !== runToken) throw CANCEL;
      return getPool(mk, dev, token, planFor(plan, dev).list.length);
    }).then(function (pool) {
      if (token !== runToken) throw CANCEL;
      phase = 'run'; engine.onProg = null;       // workers still loading in the background must not change the status
      return upscaleTiles(pool, inCanvas, MODELS[mk].scale, plan.scale, token, mk + '|' + dev, planFor(plan, dev));
    });
    engine.lastRun = run.catch(function () { });
    run.then(function (out) {
      if (token !== runToken) return;
      ai = { canvas: out, scale: plan.scale, model: mk, inW: plan.inW, inH: plan.inH, secs: (Date.now() - t0) / 1000 };
      busy = false;
      stage('done', 1, { secs: ai.secs });
      $('#app').dataset.state = 'done';
      renderAll();
    }, function (e) {
      if (e === CANCEL || token !== runToken) return;
      stopAll();                                   // next time starts fresh: new workers, a new download attempt
      busy = false;
      if (dev === 'webgpu' && !gpuBroken) {      // graphics card failed: try again the normal way
        gpuBroken = true;
        console.warn('[photo-enhancer] WebGPU failed, using WebAssembly', e);
        EDU.toast(t('gpu_fallback'));
        renderAI();
        return enhance();
      }
      console.warn('[photo-enhancer]', e);
      hideStage();
      lastError = { key: e && e.old ? 'err_browser' : (phase === 'run' ? 'err_run' : 'err_load'), offline: navigator.onLine === false };
      $('#app').dataset.state = 'error';
      renderError(); renderAI();
    });
  }
  function cancelRun() {
    if (!busy) return;
    runToken++; busy = false;
    if (!engine.noWorker) stopAll();             // workers stop at once (the page fallback finishes its tile)
    stage('stopped', null);
    $('#bar').parentNode.classList.remove('pe-indet');
    $('#bar').style.width = '0%';
    $('#app').dataset.state = ai ? 'done' : 'ready';
    renderAI();
  }

  /* ------------------------------------------------------------------ status line */
  function leftText(s) {
    if (s === undefined || s === null) return '';
    if (s < 60) return t('t_sec', { n: EDU.fmt(Math.max(1, Math.ceil(s / 5) * 5)) });
    return t('t_min', { n: EDU.fmt(Math.max(1, Math.round(s / 30) / 2)) });   // half minutes: 1.5 min
  }
  function stageText(s) {
    if (!s) return '';
    var one = { maximumFractionDigits: 1, minimumFractionDigits: 1 };
    switch (s.kind) {
      case 'lib': return t('st_lib');
      case 'model': return t('st_model', { done: EDU.fmt(s.done || 0, one), total: EDU.fmt(s.total || 0, one) });
      case 'prep': return t('st_prep');
      case 'tile': return s.left !== undefined ? t('st_tile_left', { n: EDU.fmt(s.n), total: EDU.fmt(s.total), left: leftText(s.left) }) : t('st_tile', { n: EDU.fmt(s.n), total: EDU.fmt(s.total) });
      case 'done': return t('st_done', { s: EDU.fmt(s.secs, one) });
      case 'stopped': return t('st_stopped');
    }
    return '';
  }
  function stage(kind, frac, extra) {
    lastStage = Object.assign({ kind: kind, frac: frac }, extra || {});
    show($('#statusBox'), true);
    var txt = stageText(lastStage), st = $('#statusText');
    if (st.textContent !== txt) st.textContent = txt;
    var wrap = $('#barWrap'), indet = frac === null || frac === undefined;
    wrap.classList.toggle('pe-indet', indet && kind !== 'stopped');
    var pct = indet ? 0 : Math.round(EDU.clamp(frac, 0, 1) * 100);
    $('#bar').style.width = (indet ? 35 : pct) + '%';
    if (indet) wrap.removeAttribute('aria-valuenow'); else wrap.setAttribute('aria-valuenow', String(pct));
    show($('#cancelBtn'), busy);
    show(wrap, kind !== 'stopped' && kind !== 'done');
  }
  function hideStage() { lastStage = null; show($('#statusBox'), false); }
  function renderError() {
    var box = $('#errBox');
    if (!lastError) { show(box, false); return; }
    $('#errText').textContent = t(lastError.key) + (lastError.offline ? ' ' + t('err_offline') : '');
    show($('#retryBtn'), lastError.key !== 'err_browser');
    show(box, true);
  }

  /* ------------------------------------------------------------------ quick fixes (no AI) */
  function levelsAndColour(d, strong, sat) {
    var n = d.length / 4, hr = new Uint32Array(256), hg = new Uint32Array(256), hb = new Uint32Array(256), hl = new Uint32Array(256), i;
    for (i = 0; i < d.length; i += 4) {
      hr[d[i]]++; hg[d[i + 1]]++; hb[d[i + 2]]++;
      hl[(d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8]++;
    }
    var clip = strong ? 0.01 : 0.004;
    function pct(h, p) { var target = n * p, s = 0; for (var v = 0; v < 256; v++) { s += h[v]; if (s > target) return v; } return 255; }
    var lum = [pct(hl, clip), pct(hl, 1 - clip)];
    var k = strong ? 1 : 0.6;                   // how much each colour is stretched on its own (= white balance)
    var luts = [hr, hg, hb].map(function (h) {
      var lo = lum[0] * (1 - k) + pct(h, clip) * k, hi = lum[1] * (1 - k) + pct(h, 1 - clip) * k;
      if (hi - lo < 96) { var c = (hi + lo) / 2; lo = Math.max(0, c - 48); hi = Math.min(255, c + 48); }
      return { lo: lo, hi: hi };
    });
    /* mean brightness after stretching → gentle gamma towards a middle grey */
    var sum = 0;
    for (var v = 0; v < 256; v++) sum += hl[v] * EDU.clamp((v - lum[0]) / Math.max(1, lum[1] - lum[0]), 0, 1);
    var mean = EDU.clamp(sum / n, 0.05, 0.95);
    var g = EDU.clamp(Math.log(0.5) / Math.log(mean), 0.7, 1.4);
    g = 1 + (g - 1) * (strong ? 0.7 : 0.5);
    var curve = strong ? 0.35 : 0.12;           // a little S-curve: more contrast for faded photos
    var tab = luts.map(function (L) {
      var a = new Uint8ClampedArray(256);
      for (var v = 0; v < 256; v++) {
        var x = EDU.clamp((v - L.lo) / Math.max(1, L.hi - L.lo), 0, 1);
        x = Math.pow(x, g);
        x = x * (1 - curve) + x * x * (3 - 2 * x) * curve;
        a[v] = Math.round(x * 255);
      }
      return a;
    });
    for (i = 0; i < d.length; i += 4) {
      var r = tab[0][d[i]], gg = tab[1][d[i + 1]], b = tab[2][d[i + 2]];
      if (sat !== 1) { var l = 0.299 * r + 0.587 * gg + 0.114 * b; r = l + (r - l) * sat; gg = l + (gg - l) * sat; b = l + (b - l) * sat; }
      d[i] = r; d[i + 1] = gg; d[i + 2] = b;
    }
  }
  /* edge-keeping smoothing: 3×3 neighbours, weighted by how similar their colour is */
  function denoise(im, sigma) {
    var w = im.width, h = im.height, d = im.data, s = new Uint8ClampedArray(d), rw = new Float32Array(766);
    for (var q = 0; q < 766; q++) rw[q] = Math.exp(-(q * q) / (2 * sigma * sigma * 9));
    var sp = [1, 2, 1, 2, 4, 2, 1, 2, 1];
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var c = (y * w + x) * 4, r0 = s[c], g0 = s[c + 1], b0 = s[c + 2], ar = 0, ag = 0, ab = 0, aw = 0, k = 0;
        for (var dy = -1; dy <= 1; dy++) {
          var yy = y + dy < 0 ? 0 : (y + dy >= h ? h - 1 : y + dy);
          for (var dx = -1; dx <= 1; dx++, k++) {
            var xx = x + dx < 0 ? 0 : (x + dx >= w ? w - 1 : x + dx);
            var p = (yy * w + xx) * 4, r = s[p], g = s[p + 1], b = s[p + 2];
            var wt = sp[k] * rw[Math.abs(r - r0) + Math.abs(g - g0) + Math.abs(b - b0)];
            ar += r * wt; ag += g * wt; ab += b * wt; aw += wt;
          }
        }
        d[c] = ar / aw; d[c + 1] = ag / aw; d[c + 2] = ab / aw;
      }
    }
  }
  /* unsharp mask with a small blur and a threshold, so flat areas (and noise) are left alone */
  function sharpen(im, amount) {
    var w = im.width, h = im.height, d = im.data, s = new Uint8ClampedArray(d), tmp = new Float32Array(w * h * 3);
    var x, y, c;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      var l = (y * w + (x > 0 ? x - 1 : 0)) * 4, m = (y * w + x) * 4, r = (y * w + (x < w - 1 ? x + 1 : x)) * 4, o = (y * w + x) * 3;
      for (c = 0; c < 3; c++) tmp[o + c] = (s[l + c] + 2 * s[m + c] + s[r + c]) / 4;
    }
    for (y = 0; y < h; y++) {
      var up = y > 0 ? y - 1 : 0, dn = y < h - 1 ? y + 1 : y;
      for (x = 0; x < w; x++) {
        var o2 = (y * w + x) * 3, a = (up * w + x) * 3, b = (dn * w + x) * 3, p = (y * w + x) * 4;
        for (c = 0; c < 3; c++) {
          var blur = (tmp[a + c] + 2 * tmp[o2 + c] + tmp[b + c]) / 4, diff = s[p + c] - blur;
          if (diff > 2 || diff < -2) d[p + c] = s[p + c] + diff * amount;
        }
      }
    }
  }
  function tone(d, mode) {
    for (var i = 0; i < d.length; i += 4) {
      var r = d[i], g = d[i + 1], b = d[i + 2];
      if (mode === 'bw') { var l = 0.299 * r + 0.587 * g + 0.114 * b; d[i] = d[i + 1] = d[i + 2] = l; }
      else {                                   // warm brown tint, strongest in the middle tones
        var y = 0.299 * r + 0.587 * g + 0.114 * b, k = 1 - Math.abs(y - 128) / 160;
        d[i] = y + 38 * k; d[i + 1] = y + 14 * k; d[i + 2] = y - 30 * k;
      }
    }
  }
  function applyFixes(base, dst) {
    var w = base.width, h = base.height;
    if (dst.width !== w) dst.width = w;
    if (dst.height !== h) dst.height = h;
    var x = ctx2d(dst);
    x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
    x.drawImage(base, 0, 0);
    if (!S.auto && !S.old && S.color === 'keep') return;
    var im = x.getImageData(0, 0, w, h);
    if (S.auto || S.old) {
      levelsAndColour(im.data, S.old, S.color === 'keep' ? (S.old ? 1.15 : 1.05) : 1);
      if (!(ai && ai.model === 'best')) denoise(im, S.old ? 16 : 9);     // the Best AI model already removed the noise
      sharpen(im, S.old ? 0.45 : 0.6);
    }
    if (S.color !== 'keep') tone(im.data, S.color);
    x.putImageData(im, 0, 0);
  }

  /* ------------------------------------------------------------------ render */
  var fixTimer = 0;
  function renderImage() {
    if (!src) return;
    var base = ai ? ai.canvas : src.canvas;
    applyFixes(base, cvAfter);
    if (src.alpha) {                             // put the see-through parts back
      var ax = cvAfter.getContext('2d');
      ax.save(); ax.globalCompositeOperation = 'destination-in'; ax.imageSmoothingEnabled = true; ax.imageSmoothingQuality = 'high';
      ax.drawImage(src.alpha, 0, 0, cvAfter.width, cvAfter.height); ax.restore();
    }
    if (cvBefore.width !== cvAfter.width || cvBefore.height !== cvAfter.height || cvBefore.dataset.key !== src.key) {
      cvBefore.width = cvAfter.width; cvBefore.height = cvAfter.height; cvBefore.dataset.key = src.key;
      var bx = cvBefore.getContext('2d');
      bx.imageSmoothingEnabled = true; bx.imageSmoothingQuality = 'high';
      bx.clearRect(0, 0, cvBefore.width, cvBefore.height);
      if (!src.alpha) { bx.fillStyle = '#fff'; bx.fillRect(0, 0, cvBefore.width, cvBefore.height); }
      bx.drawImage(src.alpha || src.canvas, 0, 0, cvBefore.width, cvBefore.height);
    }
    layoutCompare();
    $('#app').dataset.fixed = String(Date.now());
  }
  function scheduleFixes() {
    clearTimeout(fixTimer);
    fixTimer = setTimeout(renderImage, 30);
  }
  function layoutCompare() {
    var zoom = $('#zoom1').checked, ratio = cvAfter.width / cvAfter.height;
    cmp.classList.toggle('zoomed', zoom);
    cmpBox.classList.toggle('zoomed', zoom);
    cmp.style.width = zoom ? cvAfter.width + 'px' : 'min(100%, calc(66vh * ' + ratio.toFixed(4) + '))';
    setSplit(+$('#cmpRange').value);
  }
  function setSplit(p) {
    p = EDU.clamp(p, 0, 100);
    cvBefore.style.clipPath = 'inset(0 ' + (100 - p) + '% 0 0)';
    $('#cmpLine').style.left = p + '%';
    if (+$('#cmpRange').value !== Math.round(p)) $('#cmpRange').value = Math.round(p);
  }

  function renderSegs() {
    function press(sel, attr, val) { EDU.$$(sel + ' button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset[attr] === String(val))); }); }
    press('#scaleSeg', 'scale', S.scale);
    press('#modelSeg', 'model', effModel());
    press('#colorSeg', 'color', S.color);
    press('#fmtSeg', 'fmt', S.fmt);
    press('#sizeSeg', 'size', S.size);
    $('#scale-4').disabled = isPhone;
    $('#model-quick').disabled = S.scale === 4;
    $('#fixAuto').checked = S.auto; $('#fixOld').checked = S.old; $('#gpu').checked = S.gpu;
  }
  function renderAI() {
    var mk = effModel(), v = variant(mk, device(mk));
    $('#modelHint').textContent = mk === 'best' ? t('m_best_hint') : t('m_quick_hint');
    if (S.scale === 4) $('#modelHint').textContent += ' ' + t('x4_best_only');
    show($('#gpuRow'), gpuOK && !gpuBroken && !isPhone && mk === 'best');
    $('#gpuLabel').textContent = t('gpu_label', { mb: mbText(MODELS.best.gpu.mb + ENGINE_MB) });
    var plan = aiPlan(), notes = [];
    if (isPhone) notes.push(t('x4_phone'));
    if (plan && plan.tooBig) notes = [t('too_big', { dims: dims(src.natW, src.natH) })];
    else {
      notes.push(isSaved(mk) ? t('model_saved') : t('dl_note', { mb: mbText(v.mb + ENGINE_MB) }));
      if (plan && plan.shrink) notes.push(t('ai_shrink', { dims: dims(plan.inW, plan.inH) }));
      if (plan) {
        var secs = planSecs(plan);
        notes.push(t('ai_result', { dims: dims(plan.inW * plan.scale, plan.inH * plan.scale) }));
        notes.push(t('est_time', { t: leftText(secs) }));
        if (plan.auto) notes.push(t('auto_quick', { t: leftText(plan.bestSecs) }));
        if (secs > 60) notes.push(t('slow_note'));
      }
    }
    $('#aiNote').textContent = notes.join(' ');
    $('#aiNote').classList.toggle('warning', !!(plan && plan.tooBig));
    $('#enhanceBtn').disabled = busy || !src || !plan || !!plan.tooBig;
    $('#inside4').textContent = t('inside4', { best: mbText(MODELS.best.wasm.mb), gpu: mbText(MODELS.best.gpu.mb), quick: mbText(MODELS.quick.wasm.mb), engine: mbText(ENGINE_MB) });
  }
  function renderInfo() {
    show($('#viewer'), !!src); show($('#empty'), !src);
    $('#dlBtn').disabled = !src;
    if (!src) { $('#size-enh').textContent = t('s_enh_plain'); $('#size-orig').textContent = t('s_orig_plain'); return; }
    $('#fileName').textContent = src.sample ? t('sample_name') : src.name;
    $('#fileName').classList.toggle('no-i18n', !src.sample);
    var w = cvAfter.width, h = cvAfter.height;
    $('#sizeInfo').textContent = (w !== src.w || h !== src.h) ? t('size_change', { a: dims(src.w, src.h), b: dims(w, h) }) : t('size_info', { dims: dims(w, h) });
    $('#size-enh').textContent = t('s_enh', { dims: dims(w, h) });
    $('#size-orig').textContent = t('s_orig', { dims: dims(src.w, src.h) });
    $('#size-orig').disabled = w === src.w && h === src.h;
    var sn = $('#shrunkNote');
    show(sn, src.natW !== src.w);
    sn.textContent = t('work_shrink', { a: dims(src.natW, src.natH), b: dims(src.w, src.h) });
    var badges = $('#badges'); badges.textContent = '';
    if (ai) badges.appendChild(EDU.el('span', { class: 'badge success', text: t('b_ai', { n: ai.scale, model: t(ai.model === 'best' ? 'm_best' : 'm_quick') }) }));
    if (S.auto) badges.appendChild(EDU.el('span', { class: 'badge primary', text: t('fix_auto_short') }));
    if (S.old) badges.appendChild(EDU.el('span', { class: 'badge primary', text: t('fix_old_short') }));
    if (S.color !== 'keep') badges.appendChild(EDU.el('span', { class: 'badge', text: t('c_' + S.color) }));
  }
  function renderAll() {
    renderSegs(); renderAI();
    if (src) renderImage();
    renderInfo();
    if (lastStage) stage(lastStage.kind, lastStage.frac, lastStage);
    renderError();
  }

  /* ------------------------------------------------------------------ loading photos */
  function decode(blob) {
    function viaImg() {
      return new Promise(function (resolve, reject) {
        var u = typeof blob === 'string' ? blob : URL.createObjectURL(blob), im = new Image();
        im.onload = function () {
          if (typeof blob !== 'string') setTimeout(function () { URL.revokeObjectURL(u); }, 1000);
          if (!im.naturalWidth) return reject(new Error('empty'));
          resolve({ img: im, w: im.naturalWidth, h: im.naturalHeight });
        };
        im.onerror = function () { if (typeof blob !== 'string') URL.revokeObjectURL(u); reject(new Error('decode')); };
        im.src = u;
      });
    }
    if (typeof blob !== 'string' && window.createImageBitmap) {
      return createImageBitmap(blob).then(function (b) { if (!b.width) throw new Error('empty'); return { img: b, w: b.width, h: b.height }; }).catch(viaImg);
    }
    return viaImg();
  }
  var keyN = 0;
  function setPhoto(img, w, h, name, sample) {
    var f = Math.min(1, WORK_MAX / Math.max(w, h));
    var c = canvas(w * f, h * f), x = c.getContext('2d');
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
    x.drawImage(img, 0, 0, c.width, c.height);
    /* A PNG/WebP with see-through parts: the AI and the fixes work on the photo on white, and the see-through
       parts are put back on top at the end (kept in PNG downloads; JPG cannot keep them, so it gets white). */
    var a = canvas(c.width, c.height), ax = ctx2d(a), clear = false;
    ax.imageSmoothingEnabled = true; ax.imageSmoothingQuality = 'high';
    ax.drawImage(img, 0, 0, a.width, a.height);
    var ad = ax.getImageData(0, 0, a.width, a.height).data;
    for (var i = 3; i < ad.length; i += 4) if (ad[i] < 250) { clear = true; break; }
    if (img.close) { try { img.close(); } catch (e) { } }
    if (busy) cancelRun();
    src = { name: name || 'photo', canvas: c, alpha: clear ? a : null, w: c.width, h: c.height, natW: w, natH: h, sample: !!sample, key: 'k' + (++keyN) };
    ai = null; lastError = null; hideStage();
    show($('#fileErr'), false);
    $('#app').dataset.state = 'ready';
    $('#cmpRange').value = 50;
    renderAll();
  }
  function loadFile(file) {
    if (!file) return;
    if (file.type && !/^image\//.test(file.type)) return fileError();
    decode(file).then(function (r) { setPhoto(r.img, r.w, r.h, file.name, false); }, fileError);
  }
  function fileError() {
    var b = $('#fileErr'); b.textContent = t('err_file'); show(b, true);
  }
  function loadSample() {
    decode(window.PE_SAMPLE.src).then(function (r) { setPhoto(r.img, r.w, r.h, window.PE_SAMPLE.name, true); }, fileError);
  }

  /* ------------------------------------------------------------------ saving */
  function download() {
    if (!src) return;
    var c = cvAfter, png = S.fmt === 'png';
    if (S.size === 'orig' && (c.width !== src.w || c.height !== src.h)) c = resized(cvAfter, src.w, src.h, png);
    else if (!png && src.alpha) c = resized(cvAfter, c.width, c.height);   // JPG has no see-through: white
    var name = baseName(src.name) + '_enhanced' + (ai ? '_' + ai.scale + 'x' : '') + (S.size === 'orig' ? '_original-size' : '') + (png ? '.png' : '.jpg');
    c.toBlob(function (b) { if (b) { EDU.download(name, b); EDU.toast(t('saved_toast')); } }, png ? 'image/png' : 'image/jpeg', 0.92);
  }

  /* ------------------------------------------------------------------ events */
  var fileInput = $('#fileInput'), drop = $('#drop');
  function pick() { fileInput.value = ''; fileInput.click(); }
  $('#pickBtn').addEventListener('click', function (e) { e.stopPropagation(); pick(); });
  $('#sampleBtn').addEventListener('click', function (e) { e.stopPropagation(); loadSample(); });
  drop.addEventListener('click', pick);
  drop.addEventListener('keydown', function (e) { if (e.target === drop && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(); } });
  fileInput.addEventListener('change', function () { loadFile(fileInput.files && fileInput.files[0]); });
  function hasFiles(e) { return e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0; }
  var dragDepth = 0;
  window.addEventListener('dragenter', function (e) { if (!hasFiles(e)) return; dragDepth++; drop.classList.add('over'); });
  window.addEventListener('dragleave', function () { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) drop.classList.remove('over'); });
  window.addEventListener('dragover', function (e) { if (hasFiles(e)) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } });
  window.addEventListener('drop', function (e) {
    if (!hasFiles(e)) return;
    e.preventDefault(); dragDepth = 0; drop.classList.remove('over');
    loadFile(e.dataTransfer.files[0]);
  });
  document.addEventListener('paste', function (e) {
    var items = (e.clipboardData && e.clipboardData.items) || [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].kind === 'file' && /^image\//.test(items[i].type)) { e.preventDefault(); loadFile(items[i].getAsFile()); return; }
    }
  });

  $('#scaleSeg').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || b.disabled) return;
    S.scale = +b.dataset.scale; saveS(); renderSegs(); renderAI();
  });
  $('#modelSeg').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || b.disabled) return;
    S.model = b.dataset.model; S.modelSet = true; saveS(); renderSegs(); renderAI();
  });
  $('#gpu').addEventListener('change', function () { S.gpu = this.checked; saveS(); renderAI(); });
  $('#enhanceBtn').addEventListener('click', enhance);
  $('#retryBtn').addEventListener('click', enhance);
  $('#cancelBtn').addEventListener('click', cancelRun);
  function fixChanged() { saveS(); renderSegs(); scheduleFixes(); setTimeout(renderInfo, 40); }
  $('#fixAuto').addEventListener('change', function () { S.auto = this.checked; fixChanged(); });
  $('#fixOld').addEventListener('change', function () { S.old = this.checked; fixChanged(); });
  $('#colorSeg').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; S.color = b.dataset.color; fixChanged(); });
  $('#fmtSeg').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; S.fmt = b.dataset.fmt; saveS(); renderSegs(); });
  $('#sizeSeg').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b || b.disabled) return; S.size = b.dataset.size; saveS(); renderSegs(); });
  $('#dlBtn').addEventListener('click', download);
  $('#resetBtn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    S = Object.assign({}, DEF); saveS();
    renderAll();
  });
  $('#zoom1').addEventListener('change', layoutCompare);
  $('#cmpRange').addEventListener('input', function () { setSplit(+this.value); });
  (function dragCompare() {
    var dragging = false;
    function at(e) { var r = cmp.getBoundingClientRect(); setSplit((e.clientX - r.left) / r.width * 100); }
    cmp.addEventListener('pointerdown', function (e) {
      if (cmp.classList.contains('zoomed') && e.pointerType === 'touch') return;   // zoomed on a phone: the finger scrolls
      dragging = true; at(e);
      try { cmp.setPointerCapture(e.pointerId); } catch (x) { }
    });
    cmp.addEventListener('pointermove', function (e) { if (dragging) at(e); });
    ['pointerup', 'pointercancel'].forEach(function (n) { cmp.addEventListener(n, function () { dragging = false; }); });
  })();

  /* graphics card (WebGPU) available? */
  if (navigator.gpu && navigator.gpu.requestAdapter) {
    navigator.gpu.requestAdapter().then(function (a) {
      gpuOK = !!a && !(a.info && a.info.isFallbackAdapter) && !a.isFallbackAdapter;
      renderAI();
    }).catch(function () { });
  }

  EDU.onLang(renderAll);
  renderAll();
  refreshSaved();
  loadSample();          // something to look at (and try) within a second; no download until the user asks
})();
