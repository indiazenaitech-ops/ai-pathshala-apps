/* AI Background Remover: cut out a person or a product, fully on the device.
   Engine: Transformers.js 4.3.0 (ONNX Runtime Web: WebGPU when the browser has it, else WebAssembly),
   loaded from jsDelivr with a dynamic import() inside a Web Worker made from a blob: URL (so the page stays
   responsive and Stop really stops; this also works from a downloaded ZIP opened with file://).
   Models (Hugging Face, pinned to a commit):
     - "All-round": ISNet general-use, xrds/isnet-general-onnx-int8 (MIT; ISNet/DIS by Xuebin Qin et al., Apache-2.0),
       weight-only int8, 44.2 MB. People AND products.
     - "Quick": MODNet, Xenova/modnet (Apache-2.0), int8, 6.6 MB. Portraits of people only.
   The photo never leaves the browser: only the library and the model are downloaded, once. */
(function () {
  'use strict';
  var SLUG = 'background-remover';
  var t = EDU.t, $ = EDU.$, $$ = EDU.$$;
  var store = EDU.store(SLUG);

  /* ------------------------------------------------------------------ constants */
  var LIB = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0';
  var ENGINE_MB = 6;                       // transformers.js + ONNX Runtime WebAssembly, compressed
  var MODELS = {
    isnet: { repo: 'xrds/isnet-general-onnx-int8', rev: '71eff2372ec9c8edbc6ca637ded591423d23b65a', dtype: 'q8', file: 'onnx/model_quantized.onnx', mb: 44, gpu: true },
    modnet: { repo: 'Xenova/modnet', rev: 'fa2fa546052fba4c08921230a26cc69a333fca12', dtype: 'q8', file: 'onnx/model_quantized.onnx', mb: 6.6, gpu: false }
  };
  /* Transformers.js keeps downloaded models in its own default Cache Storage cache (env.cacheKey). We only read it to
     show which models are saved, and delete just this app's model files from it (other AI apps share that cache). */
  var TJS_CACHE = 'transformers-cache';
  var MAX_SIDE = 2560;                     // bigger photos are reduced (memory on phones)
  var WORK_SIDE = 1024;                    // what the AI looks at (the models work at 512-1024 px)
  var SWATCHES = ['#ffffff', '#f1f5f9', '#dbeafe', '#1d4ed8', '#fde68a', '#ff9933', '#fecdd3', '#bbf7d0', '#111827'];
  var SIZES = { dp: { n: 1080, fill: 0.86 }, product: { n: 1000, fill: 0.85 } };

  /* ------------------------------------------------------------------ settings */
  var DEF = { model: 'isnet', bg: 'none', color: '#ffffff', blur: 14, size: 'orig', brush: 24 };
  var S = Object.assign({}, DEF, store.get('settings', {}));
  (function sanitize() {
    if (!MODELS[S.model]) S.model = DEF.model;
    if (['none', 'white', 'color', 'blur', 'photo'].indexOf(S.bg) < 0) S.bg = DEF.bg;
    if (S.bg === 'photo') S.bg = 'none';   // the background photo itself is not saved
    if (!/^#[0-9a-f]{6}$/i.test(S.color)) S.color = DEF.color;
    S.blur = EDU.clamp(+S.blur || DEF.blur, 2, 40);
    if (['orig', 'dp', 'product'].indexOf(S.size) < 0) S.size = DEF.size;
    S.brush = EDU.clamp(+S.brush || DEF.brush, 4, 80);
  })();
  function saveS() { var c = Object.assign({}, S); store.set('settings', c); }

  /* ------------------------------------------------------------------ state */
  var src = null, srcName = 'photo', bigNote = null;  // src: the photo (canvas, ≤ MAX_SIDE)
  var baseMask = null, mask = null, cut = null;      // canvases at src size; alpha = "keep"
  var strokes = [], curStroke = null, bbox = null, fgShare = 0;
  var hasResult = false, tool = 'compare', split = 0.5;
  var bgImg = null, blurCache = null;
  var busy = false, lastStage = null, lastError = null, runStart = 0, ticker = 0, lastSecs = 0;
  var cached = { isnet: false, modnet: false };
  var eng = { port: null, seq: 0, req: null, loaded: null, device: null, lastLoad: null };

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ------------------------------------------------------------------ helpers */
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function show(node, on) { node.hidden = !on; }
  function baseName(name) { return String(name || '').replace(/\.[a-z0-9]{2,5}$/i, '').trim(); }
  function safeFile(s) { return String(s || '').replace(/[\\/:*?"<>|\s]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'photo'; }
  function mb(n) { return t('size_mb', { n: EDU.fmt(n, { maximumFractionDigits: n < 10 ? 1 : 0 }) }); }
  function totalMb(key) { return MODELS[key].mb + ENGINE_MB; }

  /* ================================================================== AI engine
     engineMain runs inside the Web Worker (scope = self). If this browser can't make the worker, it runs on the
     page itself (scope = a small stand-in object): slower to react while working, but it still works. */
  function engineMain(scope) {
    var T = null, M = null;
    function post(m, tr) { if (!scope.dead) scope.postMessage(m, tr || []); }
    async function drop() {
      var old = M; M = null;
      if (old) { try { await old.model.dispose(); } catch (x) { /* already gone */ } }
    }
    async function load(m, device) {
      var cb = function (p) {
        if (p.status === 'progress' && /\.onnx$/.test(p.file || '')) post({ type: 'progress', id: m.id, phase: 'model', loaded: p.loaded, total: p.total });
      };
      var opts = { revision: m.rev, progress_callback: cb };
      var proc = await T.AutoProcessor.from_pretrained(m.repo, opts);
      var model = await T.AutoModel.from_pretrained(m.repo, Object.assign({ dtype: m.dtype, device: device }, opts));
      return { model: model, proc: proc, device: device, msg: m };
    }
    async function run(m) {
      var img = new T.RawImage(new Uint8ClampedArray(m.data), m.w, m.h, 4);
      var inputs = await M.proc(img);
      var sess = M.model.sessions.model;
      var feed = {}; feed[sess.inputNames[0]] = inputs.pixel_values;
      var out = await M.model(feed);
      var ten = out[sess.outputNames[0]], d = ten.data, dims = ten.dims;
      var H = dims[dims.length - 2], W = dims[dims.length - 1], n = W * H, i, sig = false;
      for (i = 0; i < n; i++) if (d[i] < -1e-5 || d[i] > 1 + 1e-5) { sig = true; break; }
      var mask = new Uint8ClampedArray(n);
      for (i = 0; i < n; i++) { var v = d[i]; if (sig) v = 1 / (1 + Math.exp(-v)); mask[i] = v * 255 + 0.5; }
      return { w: W, h: H, mask: mask };
    }
    scope.onmessage = async function (e) {
      var m = e.data;
      try {
        if (m.type === 'load') {
          if (!T) {
            T = await import(m.lib);
            T.env.allowLocalModels = false;
          }
          var device = 'wasm';
          if (m.gpu && typeof navigator !== 'undefined' && navigator.gpu) {
            try { if (await navigator.gpu.requestAdapter()) device = 'webgpu'; } catch (x) { /* no GPU */ }
          }
          if (M && M.msg.repo === m.repo && M.device === device) { post({ type: 'loaded', id: m.id, device: device }); return; }
          await drop();                          // free the other model's memory before loading this one
          try { M = await load(m, device); }
          catch (x) { if (device !== 'webgpu') throw x; M = await load(m, 'wasm'); }
          post({ type: 'progress', id: m.id, phase: 'warm' });
          post({ type: 'loaded', id: m.id, device: M.device });
        } else if (m.type === 'run') {
          var r;
          try { r = await run(m); }
          catch (x) {
            if (!M || M.device !== 'webgpu') throw x;
            var again = M.msg;
            await drop();
            M = await load(again, 'wasm');       // a GPU that fails (memory, driver): retry on the processor
            r = await run(m);
          }
          post({ type: 'mask', id: m.id, w: r.w, h: r.h, device: M.device, mask: r.mask.buffer }, [r.mask.buffer]);
        }
      } catch (err) {
        post({ type: 'error', id: m.id, msg: String((err && err.message) || err).slice(0, 300) });
      }
    };
  }

  function startEngine(forceMain) {
    if (eng.port) return;
    if (!forceMain && typeof Worker !== 'undefined') {
      try {
        var url = URL.createObjectURL(new Blob(['(' + engineMain.toString() + ')(self);'], { type: 'text/javascript' }));
        var w = new Worker(url);
        var port = { worker: true, post: function (m, tr) { w.postMessage(m, tr || []); }, kill: function () { w.terminate(); } };
        w.onmessage = function (e) { if (eng.port === port) onEngineMsg(e.data); };
        w.onerror = function (ev) {
          if (ev && ev.preventDefault) ev.preventDefault();
          if (eng.port !== port) return;
          /* The worker itself could not run (an old browser without import() in workers): use the page instead. */
          port.kill(); eng.port = null; eng.loaded = null;
          var r = eng.req;
          if (r && r.msg.type === 'load' && !r.retried) {
            startEngine(true);
            r.retried = true;
            eng.port.post(r.msg);
          } else if (r) { eng.req = null; r.rej(new Error('worker failed')); }
        };
        eng.port = port;
        return;
      } catch (e) { /* fall through */ }
    }
    var scope = { dead: false, postMessage: function (m) { setTimeout(function () { if (eng.port === p2) onEngineMsg(m); }, 0); } };
    engineMain(scope);
    var p2 = { worker: false, post: function (m) { scope.onmessage({ data: m }); }, kill: function () { scope.dead = true; } };
    eng.port = p2;
  }
  function stopEngine() {
    if (eng.port) eng.port.kill();
    eng.port = null; eng.loaded = null; eng.device = null;
    var r = eng.req; eng.req = null;
    if (r) r.rej({ cancelled: true });
  }
  function call(msg, transfer, onProgress) {
    return new Promise(function (resolve, reject) {
      msg.id = ++eng.seq;
      eng.req = { id: msg.id, msg: msg, res: resolve, rej: reject, onProgress: onProgress };
      eng.port.post(msg, transfer);
    });
  }
  function onEngineMsg(m) {
    var r = eng.req;
    if (!r || !m || m.id !== r.id) return;
    if (m.type === 'progress') { if (r.onProgress) r.onProgress(m); return; }
    eng.req = null;
    if (m.type === 'error') r.rej(new Error(m.msg)); else r.res(m);
  }

  /* Which models are already saved on this device (Cache Storage of this site) */
  function cacheKeys() {
    if (typeof caches === 'undefined') return Promise.resolve([]);
    return caches.has(TJS_CACHE).then(function (has) { return has ? caches.open(TJS_CACHE).then(function (c) { return c.keys(); }) : []; }).then(function (ks) { return ks.map(function (r) { return r.url; }); }).catch(function () { return []; });
  }
  function modelPath(key, file) { var M = MODELS[key]; return '/' + M.repo + '/resolve/' + M.rev + '/' + (file || ''); }
  function refreshCached() {
    return cacheKeys().then(function (urls) {
      Object.keys(MODELS).forEach(function (k) {
        var p = modelPath(k, MODELS[k].file);
        cached[k] = urls.some(function (u) { return u.indexOf(p) >= 0; });
      });
    }).then(function () { renderModels(); renderStorage(); });
  }
  function clearCached() {
    if (typeof caches === 'undefined') return Promise.resolve();
    return caches.open(TJS_CACHE).then(function (c) {
      return c.keys().then(function (ks) {
        return Promise.all(ks.filter(function (r) {
          return Object.keys(MODELS).some(function (k) { return r.url.indexOf(modelPath(k)) >= 0; });
        }).map(function (r) { return c.delete(r); }));
      });
    }).catch(function () { });
  }

  /* ------------------------------------------------------------------ status line */
  var stText = $('#stText'), stBar = $('#stBar'), stWrap = $('#stBarWrap');
  function stageText(s) {
    if (!s) return '';
    switch (s.kind) {
      case 'engine': return t('st_engine');
      case 'model': return t('st_model', { done: mb(s.done), size: mb(s.size) });
      case 'warm': return t('st_prepare');
      case 'run': return t('st_run', { s: EDU.fmt(s.secs) });
      case 'done': return t('st_done', { s: EDU.fmt(s.secs, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) });
      case 'stopped': return t('st_stopped');
    }
    return '';
  }
  function stage(kind, frac, extra) {
    var s = Object.assign({ kind: kind, frac: frac }, extra || {});
    lastStage = s;
    renderStage();
  }
  function renderStage() {
    var s = lastStage;
    show($('#statusBox'), !!s);
    if (!s) return;
    var txt = stageText(s);
    if (stText.textContent !== txt) stText.textContent = txt;
    var indet = s.frac === null || s.frac === undefined;
    stBar.classList.toggle('br-indet', indet);
    var pct = indet ? 100 : Math.round(EDU.clamp(s.frac, 0, 1) * 100);
    stBar.style.width = pct + '%';
    if (indet) stWrap.removeAttribute('aria-valuenow'); else stWrap.setAttribute('aria-valuenow', String(pct));
    var note = '';
    if (s.kind === 'run' && eng.device !== 'webgpu' && S.model === 'isnet') note = t('st_phone');
    else if (s.kind === 'done' && eng.device) note = t(eng.device === 'webgpu' ? 'ran_gpu' : 'ran_cpu');
    $('#stNote').textContent = note;
    show($('#stNote'), !!note);
    var ov = $('#busyOverlay');
    show(ov, busy && !!src);
    $('#busyText').textContent = busy ? (s.kind === 'run' ? t('st_run', { s: EDU.fmt(s.secs) }) : t('working')) : '';
  }
  function hideStage() { lastStage = null; renderStage(); }
  function showError(key) {
    lastError = { key: key, offline: navigator.onLine === false };
    renderError();
  }
  function renderError() {
    var box = $('#errBox');
    if (!lastError) { show(box, false); return; }
    $('#errText').textContent = t(lastError.key) + (lastError.offline ? ' ' + t('err_offline') : '');
    show($('#retryBtn'), lastError.key !== 'err_image');
    show(box, true);
  }
  function clearError() { lastError = null; renderError(); }

  /* ================================================================== remove background */
  function removeBg() {
    if (!src || busy) return;
    busy = true; clearError(); renderButtons(); renderInfo();
    var key = S.model, M = MODELS[key];
    var failStage = 'load';
    startEngine();
    var p = Promise.resolve();
    if (eng.loaded !== key) {
      stage('engine', null);
      var msg = { type: 'load', lib: LIB, repo: M.repo, rev: M.rev, dtype: M.dtype, gpu: M.gpu };
      p = call(msg, null, function (m) {
        if (m.phase === 'model' && m.total) stage('model', m.loaded / m.total, { done: m.loaded / 1e6, size: m.total / 1e6 });
        else if (m.phase === 'warm') stage('warm', null);
      }).then(function (r) { eng.loaded = key; eng.device = r.device; cached[key] = true; renderModels(); });
    }
    p.then(function () {
      failStage = 'run';
      var k = Math.min(1, WORK_SIDE / Math.max(src.width, src.height));
      var wk = canvas(src.width * k, src.height * k), wx = wk.getContext('2d');
      wx.imageSmoothingQuality = 'high';
      wx.drawImage(src, 0, 0, wk.width, wk.height);
      var id = wx.getImageData(0, 0, wk.width, wk.height);
      runStart = performance.now();
      stage('run', null, { secs: 0 });
      clearInterval(ticker);
      ticker = setInterval(function () { if (lastStage && lastStage.kind === 'run') { lastStage.secs = Math.round((performance.now() - runStart) / 1000); renderStage(); } }, 1000);
      return call({ type: 'run', data: id.data.buffer, w: wk.width, h: wk.height }, [id.data.buffer]);
    }).then(function (r) {
      clearInterval(ticker);
      eng.device = r.device || eng.device;
      lastSecs = (performance.now() - runStart) / 1000;
      setMask(r);
      busy = false;
      stage('done', 1, { secs: lastSecs });
      renderAll();
      refreshCached();
    }).catch(function (e) {
      clearInterval(ticker);
      busy = false;
      if (e && e.cancelled) stage('stopped', 0);
      else {
        hideStage();
        if (e) console.warn('[' + SLUG + ']', e);
        showError(failStage === 'load' ? 'err_load' : 'err_run');
        /* start fresh next time: a new worker also forgets a failed import() of the library, which the browser
           would otherwise keep failing from memory even after the internet is back */
        stopEngine();
      }
      renderAll();
    });
  }

  /* model output (w×h, 0..255) → baseMask at photo size */
  function setMask(r) {
    var a = new Uint8Array(r.mask), mc = canvas(r.w, r.h), mx = mc.getContext('2d');
    var id = mx.createImageData(r.w, r.h), d = id.data;
    /* clean the ends: a faint haze (< 4 %) becomes fully transparent, near-certain pixels (> 96 %) fully solid */
    for (var i = 0, n = r.w * r.h; i < n; i++) {
      var j = i * 4, v = a[i];
      d[j] = d[j + 1] = d[j + 2] = 255;
      d[j + 3] = v <= 10 ? 0 : v >= 245 ? 255 : Math.round((v - 10) * 255 / 235);
    }
    mx.putImageData(id, 0, 0);
    baseMask = canvas(src.width, src.height);
    var bx = baseMask.getContext('2d');
    bx.imageSmoothingEnabled = true; bx.imageSmoothingQuality = 'high';
    bx.drawImage(mc, 0, 0, src.width, src.height);
    mask = canvas(src.width, src.height);
    cut = canvas(src.width, src.height);
    strokes = []; curStroke = null;
    hasResult = true; split = 0.5; tool = 'compare';
    rebuildMask();
  }
  function rebuildMask() {
    var mx = mask.getContext('2d');
    mx.globalCompositeOperation = 'copy';
    mx.drawImage(baseMask, 0, 0);
    mx.globalCompositeOperation = 'source-over';
    strokes.forEach(function (s) { drawStroke(mx, s, 0); });
    rebuildCut();
    measure();
  }
  function rebuildCut() {
    var cx = cut.getContext('2d');
    cx.globalCompositeOperation = 'copy';
    cx.drawImage(src, 0, 0);
    cx.globalCompositeOperation = 'destination-in';
    cx.drawImage(mask, 0, 0);
    cx.globalCompositeOperation = 'source-over';
  }
  /* subject box + share of the photo that is kept (on a small copy of the mask) */
  function measure() {
    var k = Math.min(1, 320 / Math.max(mask.width, mask.height));
    var w = Math.max(1, Math.round(mask.width * k)), h = Math.max(1, Math.round(mask.height * k));
    var c = canvas(w, h), x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(mask, 0, 0, w, h);
    var d = x.getImageData(0, 0, w, h).data, keep = 0, rows = new Uint16Array(h), cols = new Uint16Array(w);
    for (var y = 0; y < h; y++) for (var i = 0; i < w; i++) {
      if (d[(y * w + i) * 4 + 3] > 127) { keep++; rows[y]++; cols[i]++; }
    }
    /* subject box from solid pixels only; a row/column needs a few of them, so stray specks and
       faint shadows don't push the subject off-centre in the square presets */
    var minR = Math.max(1, Math.round(w * 0.006)), minC = Math.max(1, Math.round(h * 0.006));
    var y0 = 0, y1 = h - 1, x0 = 0, x1 = w - 1;
    while (y0 < h && rows[y0] < minR) y0++;
    while (y1 >= 0 && rows[y1] < minR) y1--;
    while (x0 < w && cols[x0] < minC) x0++;
    while (x1 >= 0 && cols[x1] < minC) x1--;
    fgShare = keep / (w * h);
    if (x1 < x0 || y1 < y0) bbox = null;
    else bbox = { x: x0 / k, y: y0 / k, w: (x1 - x0 + 1) / k, h: (y1 - y0 + 1) / k, bottom: y1 >= h - 2 };
  }

  /* ------------------------------------------------------------------ brush */
  function dab(ctx, x, y, r, erase) {
    var g = ctx.createRadialGradient(x, y, r * 0.55, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalCompositeOperation = erase ? 'destination-out' : 'source-over';
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  /* draws points from index `from` (pairs x,y) */
  function drawStroke(ctx, s, from) {
    var p = s.pts, erase = s.mode === 'erase', step = Math.max(1, s.r * 0.3);
    for (var i = Math.max(0, from); i < p.length; i += 2) {
      if (i === 0) { dab(ctx, p[0], p[1], s.r, erase); continue; }
      var x0 = p[i - 2], y0 = p[i - 1], x1 = p[i], y1 = p[i + 1];
      var dist = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(dist / step));
      for (var j = 1; j <= n; j++) dab(ctx, x0 + (x1 - x0) * j / n, y0 + (y1 - y0) * j / n, s.r, erase);
    }
  }

  /* ================================================================== layout + drawing */
  function layout() {
    var w = src.width, h = src.height;
    if (!hasResult || S.size === 'orig' || !SIZES[S.size]) return { W: w, H: h, s: 1, ox: 0, oy: 0 };
    var P = SIZES[S.size], N = P.n;
    var b = bbox || { x: 0, y: 0, w: w, h: h, bottom: true };
    var s = Math.min(N * P.fill / b.w, N * P.fill / b.h);
    var ox = N / 2 - (b.x + b.w / 2) * s, oy = N / 2 - (b.y + b.h / 2) * s;
    if (b.bottom) oy = N - (b.y + b.h) * s;   // a person cut off by the bottom edge sits on the bottom edge
    return { W: N, H: N, s: s, ox: ox, oy: oy };
  }
  function blurred() {
    if (blurCache && blurCache.src === src && blurCache.amt === S.blur) return blurCache.c;
    var k = Math.min(1, 640 / Math.max(src.width, src.height));
    var w = Math.round(src.width * k), h = Math.round(src.height * k), r = S.blur;
    var c = canvas(w, h), x = c.getContext('2d');
    if (typeof x.filter === 'string') {
      x.filter = 'blur(' + r + 'px)';
      x.drawImage(src, -2 * r, -2 * r, w + 4 * r, h + 4 * r);   // drawn a bit larger so the edges don't fade
      x.filter = 'none';
    } else {
      /* no canvas filter (older Safari): shrink and grow again */
      var f = Math.max(2, r / 2), sm = canvas(w / f, h / f);
      sm.getContext('2d').drawImage(src, 0, 0, sm.width, sm.height);
      x.imageSmoothingQuality = 'high';
      x.drawImage(sm, 0, 0, w, h);
    }
    blurCache = { src: src, amt: S.blur, c: c };
    return c;
  }
  function cover(ctx, img, W, H) {
    var s = Math.max(W / img.width, H / img.height), w = img.width * s, h = img.height * s;
    ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  }
  /* draws the finished picture (output coordinates) */
  function drawOutput(ctx, L, opts) {
    opts = opts || {};
    var bg = S.bg;
    if (opts.jpg && (bg === 'none' || (bg === 'photo' && !bgImg))) bg = 'white';
    if (bg === 'white' || bg === 'color') { ctx.fillStyle = bg === 'white' ? '#ffffff' : S.color; ctx.fillRect(0, 0, L.W, L.H); }
    else if (bg === 'blur') {
      var b = blurred();
      cover(ctx, b, L.W, L.H);
      ctx.drawImage(b, L.ox, L.oy, src.width * L.s, src.height * L.s);
    } else if (bg === 'photo' && bgImg) cover(ctx, bgImg, L.W, L.H);
    if (opts.ghost) {
      ctx.globalAlpha = 0.28;
      ctx.drawImage(src, L.ox, L.oy, src.width * L.s, src.height * L.s);
      ctx.globalAlpha = 1;
    }
    ctx.drawImage(cut, L.ox, L.oy, src.width * L.s, src.height * L.s);
  }

  /* ------------------------------------------------------------------ preview */
  var view = $('#view'), stageEl = $('#stage');
  var viewInfo = null, hover = null, rafId = 0;
  function render() {
    rafId = 0;
    show($('#emptyBox'), !src);
    show(view, !!src);
    if (!src) return;
    var L = layout();
    var maxW = Math.max(120, stageEl.clientWidth - 2);
    var wide = window.matchMedia && window.matchMedia('(min-width: 901px)').matches;
    /* desktop: the result card is sticky, so the picture + tools must fit under the header */
    var maxH = wide ? Math.max(260, Math.min(window.innerHeight - 330, 760)) : Math.max(240, Math.min(window.innerHeight * 0.68, 720));
    var cssW = Math.min(maxW, maxH * L.W / L.H), cssH = cssW * L.H / L.W;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var cw = Math.max(1, Math.round(cssW * dpr)), ch = Math.max(1, Math.round(cssH * dpr));
    if (view.width !== cw || view.height !== ch) { view.width = cw; view.height = ch; }
    view.style.width = Math.round(cssW) + 'px'; view.style.height = Math.round(cssH) + 'px';
    var k = cw / L.W;
    viewInfo = { L: L, k: k, cssW: cssW, cssH: cssH, dpr: dpr };
    var x = view.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.clearRect(0, 0, cw, ch);
    x.setTransform(k, 0, 0, k, 0, 0);
    x.imageSmoothingQuality = 'high';
    if (!hasResult) { x.drawImage(src, 0, 0); return; }
    var brushTool = tool !== 'compare';
    drawOutput(x, L, { ghost: tool === 'restore' });   // Restore: show the removed parts faintly
    if (!brushTool && split > 0) {
      var sx = split * L.W;
      x.save();
      x.beginPath(); x.rect(0, 0, sx, L.H); x.clip();
      x.clearRect(0, 0, sx, L.H);
      x.drawImage(src, L.ox, L.oy, src.width * L.s, src.height * L.s);
      x.restore();
      /* divider + handle */
      x.setTransform(1, 0, 0, 1, 0, 0);
      var px = Math.round(split * cw), pr = 15 * dpr;
      x.fillStyle = '#ffffff'; x.fillRect(px - dpr, 0, 2 * dpr, ch);
      x.beginPath(); x.arc(px, ch / 2, pr, 0, Math.PI * 2);
      x.fillStyle = EDU.css('--primary') || '#2563eb'; x.fill();
      x.lineWidth = 2 * dpr; x.strokeStyle = '#ffffff'; x.stroke();
      x.fillStyle = '#ffffff'; x.font = 'bold ' + Math.round(14 * dpr) + 'px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText('◀▶', px, ch / 2 + dpr);
    }
    if (brushTool && hover) {
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.beginPath(); x.arc(hover.x * dpr, hover.y * dpr, S.brush * dpr, 0, Math.PI * 2);
      x.lineWidth = 2 * dpr; x.strokeStyle = '#ffffff'; x.stroke();
      x.lineWidth = 1 * dpr; x.strokeStyle = tool === 'erase' ? '#dc2626' : '#16a34a'; x.stroke();
    }
  }
  function schedule() { if (!rafId) rafId = requestAnimationFrame(render); }

  /* pointer → photo coordinates */
  function toImg(ev) {
    var r = view.getBoundingClientRect(), V = viewInfo;
    var cx = ev.clientX - r.left, cy = ev.clientY - r.top;
    var ox = cx * V.L.W / r.width, oy = cy * V.L.H / r.height;
    return { cx: cx * V.cssW / r.width, cy: cy * V.cssH / r.height, x: (ox - V.L.ox) / V.L.s, y: (oy - V.L.oy) / V.L.s, fx: cx / r.width };
  }
  var drag = null;
  view.addEventListener('pointerdown', function (ev) {
    if (!hasResult || busy || !viewInfo) return;
    ev.preventDefault();
    try { view.setPointerCapture(ev.pointerId); } catch (e) { }
    var p = toImg(ev);
    if (tool === 'compare') { drag = 'split'; split = EDU.clamp(p.fx, 0, 1); syncCmp(); schedule(); return; }
    drag = 'brush';
    var r = view.getBoundingClientRect();
    var rImg = S.brush * (viewInfo.L.W / r.width) / viewInfo.L.s;
    curStroke = { mode: tool, r: Math.max(1, rImg), pts: [p.x, p.y] };
    drawStroke(mask.getContext('2d'), curStroke, 0);
    rebuildCut();
    hover = { x: p.cx, y: p.cy };
    schedule();
  });
  view.addEventListener('pointermove', function (ev) {
    if (!hasResult || !viewInfo) return;
    var p = toImg(ev);
    if (tool !== 'compare') { hover = { x: p.cx, y: p.cy }; if (!drag) schedule(); }
    if (drag === 'split') { split = EDU.clamp(p.fx, 0, 1); syncCmp(); schedule(); }
    else if (drag === 'brush' && curStroke) {
      var n = curStroke.pts.length;
      curStroke.pts.push(p.x, p.y);
      drawStroke(mask.getContext('2d'), curStroke, n);
      rebuildCut();
      schedule();
    }
  });
  function endDrag() {
    if (drag === 'brush' && curStroke) {
      strokes.push(curStroke); curStroke = null;
      measure(); renderTools(); renderInfo();
    }
    drag = null;
    schedule();
  }
  view.addEventListener('pointerup', endDrag);
  view.addEventListener('pointercancel', endDrag);
  view.addEventListener('pointerleave', function () { if (!drag) { hover = null; schedule(); } });

  /* ================================================================== photo in */
  function loadImageFile(file) {
    if (!file || busy) return;
    var okType = /^image\//.test(file.type || '') || /\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(file.name || '');
    if (!okType) { showError('err_image'); return; }
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function () { URL.revokeObjectURL(url); setSource(img, baseName(file.name) || 'photo'); };
    img.onerror = function () { URL.revokeObjectURL(url); showError('err_image'); };
    img.src = url;
  }
  function loadSample(kind) {
    if (busy || !window.BGR_SAMPLES) return;
    var img = new Image();
    img.onload = function () { setSource(img, kind === 'person' ? 'sample-person' : 'sample-product'); };
    img.src = window.BGR_SAMPLES[kind];
  }
  function setSource(img, name) {
    var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    if (!w || !h) { showError('err_image'); return; }
    var k = Math.min(1, MAX_SIDE / Math.max(w, h));
    src = canvas(w * k, h * k);
    var x = src.getContext('2d');
    x.imageSmoothingQuality = 'high';
    x.drawImage(img, 0, 0, src.width, src.height);
    srcName = name;
    bigNote = k < 1 ? { w: src.width, h: src.height } : null;
    hasResult = false; baseMask = mask = cut = null; strokes = []; bbox = null; blurCache = null;
    clearError(); hideStage();
    renderAll();
    var res = $('#resultCard');
    if (window.matchMedia && window.matchMedia('(max-width: 900px)').matches && res.scrollIntoView) res.scrollIntoView({ behavior: 'smooth', block: 'start' });
    /* model already on this device (or loaded): go straight away. Otherwise wait for the button (download size shown). */
    if (eng.loaded === S.model || cached[S.model]) removeBg();
  }

  var drop = $('#drop');
  function pick() { EDU.pickFile('image/*').then(function (f) { if (f) loadImageFile(f); }); }
  drop.addEventListener('click', pick);
  drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  $('#pickBtn').addEventListener('click', pick);
  $('#samplePerson').addEventListener('click', function () { loadSample('person'); });
  $('#sampleProduct').addEventListener('click', function () { loadSample('product'); });
  [drop, stageEl].forEach(function (zone) {
    zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('over'); });
    zone.addEventListener('dragleave', function () { zone.classList.remove('over'); });
    zone.addEventListener('drop', function (e) {
      e.preventDefault(); zone.classList.remove('over');
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) loadImageFile(f);
    });
  });
  document.addEventListener('paste', function (e) {
    var items = (e.clipboardData && e.clipboardData.items) || [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].kind === 'file' && /^image\//.test(items[i].type)) { var f = items[i].getAsFile(); if (f) { e.preventDefault(); loadImageFile(f); } return; }
    }
  });

  /* ================================================================== controls */
  $('#runBtn').addEventListener('click', removeBg);
  $('#retryBtn').addEventListener('click', function () { clearError(); removeBg(); });
  $('#stopBtn').addEventListener('click', function () { stopEngine(); });
  $$('input[name=model]').forEach(function (r) {
    r.addEventListener('change', function () { if (r.checked) { S.model = r.value; saveS(); renderModels(); renderButtons(); } });
  });

  $$('#toolChips .chip').forEach(function (b) {
    b.addEventListener('click', function () { tool = b.dataset.tool; hover = null; renderTools(); schedule(); });
  });
  var cmpRange = $('#cmpRange');
  function syncCmp() { cmpRange.value = String(Math.round(split * 100)); }
  cmpRange.addEventListener('input', function () { split = (+cmpRange.value || 0) / 100; schedule(); });
  var brushSize = $('#brushSize');
  brushSize.addEventListener('input', function () { S.brush = +brushSize.value; saveS(); });
  $('#undoBtn').addEventListener('click', undo);
  $('#undoAllBtn').addEventListener('click', function () { if (!strokes.length) return; strokes = []; rebuildMask(); renderTools(); renderInfo(); schedule(); });
  function undo() { if (!strokes.length || busy) return; strokes.pop(); rebuildMask(); renderTools(); renderInfo(); schedule(); }
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z') && hasResult && strokes.length) {
      var tg = e.target && e.target.tagName;
      if (tg === 'INPUT' || tg === 'TEXTAREA') return;
      e.preventDefault(); undo();
    }
  });

  $$('#bgChips .chip').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.dataset.bg;
      if (v === 'photo' && !bgImg) { pickBg(); return; }
      S.bg = v; saveS(); renderFinish(); schedule();
    });
  });
  function pickBg() {
    EDU.pickFile('image/*').then(function (f) {
      if (!f) return;
      var url = URL.createObjectURL(f), img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        var k = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
        bgImg = canvas(img.naturalWidth * k, img.naturalHeight * k);
        bgImg.getContext('2d').drawImage(img, 0, 0, bgImg.width, bgImg.height);
        S.bg = 'photo'; renderFinish(); schedule();
      };
      img.onerror = function () { URL.revokeObjectURL(url); EDU.toast(t('err_image')); };
      img.src = url;
    });
  }
  $('#bgPickBtn').addEventListener('click', pickBg);
  var sw = $('#swatches');
  SWATCHES.forEach(function (c) {
    sw.appendChild(EDU.el('button', { class: 'br-sw', type: 'button', style: { background: c }, title: c, 'aria-label': c, dataset: { color: c },
      onclick: function () { S.color = c; S.bg = 'color'; saveS(); renderFinish(); schedule(); } }));
  });
  var colorIn = EDU.el('input', { type: 'color', class: 'br-color', id: 'colorIn' });
  sw.appendChild(colorIn);
  colorIn.addEventListener('input', function () { S.color = colorIn.value; S.bg = 'color'; saveS(); renderFinish(); schedule(); });
  var blurAmt = $('#blurAmt');
  blurAmt.addEventListener('input', function () { S.blur = +blurAmt.value; saveS(); schedule(); });
  $$('#sizeChips .chip').forEach(function (b) {
    b.addEventListener('click', function () {
      S.size = b.dataset.size;
      if (S.size === 'product' && S.bg === 'none') S.bg = 'white';   // marketplaces want a white background
      saveS(); renderFinish(); renderInfo(); schedule();
    });
  });

  function exportBlob(jpg) {
    var L = layout(), c = canvas(L.W, L.H), x = c.getContext('2d');
    x.imageSmoothingQuality = 'high';
    drawOutput(x, L, { jpg: jpg });
    return new Promise(function (res) { c.toBlob(function (b) { res(b); }, jpg ? 'image/jpeg' : 'image/png', 0.92); });
  }
  function download(jpg) {
    if (!hasResult) return;
    var tag = S.size === 'dp' ? 'dp' : S.size === 'product' ? 'product' : 'no-bg';
    exportBlob(jpg).then(function (b) {
      if (!b) { EDU.toast(t('err_run')); return; }
      EDU.download(safeFile(srcName) + '-' + tag + (jpg ? '.jpg' : '.png'), b);
    });
  }
  $('#dlPng').addEventListener('click', function () { download(false); });
  $('#dlJpg').addEventListener('click', function () { download(true); });

  $('#storageClear').addEventListener('click', function () {
    if (!confirm(t('storage_confirm'))) return;
    stopEngine();
    clearCached().then(refreshCached).then(function () { EDU.toast(t('storage_cleared')); });
  });
  $('#resetAll').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    if (busy) stopEngine();
    S = Object.assign({}, DEF); saveS();
    src = null; hasResult = false; baseMask = mask = cut = null; strokes = []; bbox = null; bgImg = null; blurCache = null; bigNote = null;
    clearError(); hideStage(); renderAll();
  });

  /* ================================================================== render */
  function renderModels() {
    $('#mIsnet').checked = S.model === 'isnet';
    $('#mModnet').checked = S.model === 'modnet';
    function note(key) {
      return cached[key] ? '✓ ' + t('model_saved') : t('model_size', { size: mb(totalMb(key)) });
    }
    $('#noteIsnet').textContent = t('model_isnet_note') + ' ' + note('isnet');
    $('#noteModnet').textContent = t('model_modnet_note') + ' ' + note('modnet');
    var ready = cached[S.model] || eng.loaded === S.model;
    $('#firstTime').textContent = ready ? t('ready_offline') : t('first_time', { size: mb(totalMb(S.model)) });
  }
  function renderButtons() {
    $('#runBtn').disabled = !src || busy;
    show($('#stopBtn'), busy);
    ['#pickBtn', '#samplePerson', '#sampleProduct'].forEach(function (s) { $(s).disabled = busy; });
    $$('input[name=model]').forEach(function (r) { r.disabled = busy; });
  }
  function renderTools() {
    show($('#toolsBox'), hasResult);
    $$('#toolChips .chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.tool === tool)); });
    show($('#cmpRow'), tool === 'compare');
    show($('#brushRow'), tool !== 'compare');
    brushSize.value = String(S.brush);
    syncCmp();
    view.classList.toggle('brush', tool !== 'compare');
    $('#toolHint').textContent = t(tool === 'compare' ? 'hint_compare' : 'hint_brush');
    $('#undoBtn').disabled = !strokes.length;
    $('#undoAllBtn').disabled = !strokes.length;
  }
  function renderFinish() {
    show($('#finishCard'), hasResult);
    $$('#bgChips .chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.bg === S.bg)); });
    $$('#sizeChips .chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.size === S.size)); });
    show(sw, S.bg === 'color');
    $$('.br-sw', sw).forEach(function (b) { b.setAttribute('aria-pressed', String(S.bg === 'color' && b.dataset.color.toLowerCase() === S.color.toLowerCase())); });
    colorIn.value = S.color;
    colorIn.setAttribute('aria-label', t('pick_color'));
    colorIn.title = t('pick_color');
    show($('#blurRow'), S.bg === 'blur');
    blurAmt.value = String(S.blur);
    show($('#bgPhotoRow'), S.bg === 'photo');
    $('#sizeNote').textContent = t(S.size === 'dp' ? 'size_dp_note' : S.size === 'product' ? 'size_product_note' : 'size_orig_note');
  }
  function renderInfo() {
    var row = $('#infoRow'), card = $('#resultCard');
    row.textContent = '';
    card.dataset.state = busy ? 'busy' : hasResult ? 'done' : src ? 'photo' : 'empty';
    show($('#nothingNote'), hasResult && !busy && fgShare < 0.01);
    if (!src) { show(row, false); return; }
    show(row, true);
    var L = layout();
    card.dataset.out = L.W + 'x' + L.H;
    card.dataset.keep = hasResult ? String(Math.round(fgShare * 1000) / 10) : '';
    card.dataset.edits = String(strokes.length);
    row.appendChild(EDU.el('span', { class: 'badge', text: t('out_size', { w: EDU.fmt(L.W), h: EDU.fmt(L.H) }) }));
    if (hasResult) row.appendChild(EDU.el('span', { class: 'badge primary', text: t('kept_share', { p: EDU.fmt(Math.round(fgShare * 100)) }) }));
    if (bigNote) row.appendChild(EDU.el('span', { class: 'badge', text: t('big_photo', { w: EDU.fmt(bigNote.w), h: EDU.fmt(bigNote.h) }) }));
  }
  function renderStorage() {
    var names = Object.keys(MODELS).filter(function (k) { return cached[k]; }).map(function (k) { return t(k === 'isnet' ? 'model_isnet' : 'model_modnet') + ' (' + mb(MODELS[k].mb) + ')'; });
    $('#storageText').textContent = names.length ? t('storage_has', { list: names.join(', ') }) : t('storage_none');
    show($('#storageClear'), names.length > 0);
  }
  function renderAll() {
    renderModels(); renderButtons(); renderTools(); renderFinish(); renderInfo(); renderStage(); renderError(); renderStorage();
    schedule();
  }

  EDU.onLang(function () { renderAll(); });
  EDU.onTheme(schedule);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(schedule).observe(stageEl);
  else window.addEventListener('resize', schedule);

  renderAll();
  refreshCached();
})();
