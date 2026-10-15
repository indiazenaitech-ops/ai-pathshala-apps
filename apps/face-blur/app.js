/* Face Blur for Safe Sharing: find faces with on-device AI and hide them (blur, pixels, black box, emoji),
   cover number plates / names by hand, check the file for hidden GPS location, save a clean copy.
   Detector: SSD MobileNet v1 face detector from @vladmandic/face-api 1.7.15 (MIT licence, bundles TensorFlow.js 4.22),
   library and weights pinned on jsDelivr (~0.33 MB library + 5.6 MB weights, once; then from the browser / site cache).
   The photo is scanned whole and then in overlapping tiles (each tile is enlarged to the model's 512 px input),
   which is what makes small faces at the back of a group photo findable. Nothing is uploaded. */
(function () {
  'use strict';
  var SLUG = 'face-blur';
  var t = EDU.t, $ = EDU.$, el = EDU.el;
  var store = EDU.store(SLUG);

  /* ------------------------------------------------------------------ constants */
  var CDN = 'https://cdn.jsdelivr.net/npm/';
  var FA = CDN + '@vladmandic/face-api@1.7.15/';
  var FA_LIB = FA + 'dist/face-api.js';
  var FA_MANIFEST = FA + 'model/ssd_mobilenetv1_model-weights_manifest.json';
  var FA_BIN = FA + 'model/ssd_mobilenetv1_model.bin';
  var TF_WASM = CDN + '@tensorflow/tfjs-backend-wasm@4.22.0/dist/';
  var BIN_BYTES = 5616957, DL_MB = 6;
  var MAX_SIDE = 2560, MAX_FILE_MB = 60, MAX_TILES = 64;
  var CONF = 0.35, CONF_HARD = 0.25;
  var STYLES = [
    { id: 'blur', ic: '🌁' }, { id: 'pixel', ic: '▦' }, { id: 'bar', ic: '⬛' }, { id: 'emoji', ic: '🙂' }
  ];

  /* ------------------------------------------------------------------ settings */
  var DEF = { style: 'blur', strength: 7, numbers: true };
  var S = Object.assign({}, DEF, store.get('settings', {}));
  if (!STYLES.some(function (s) { return s.id === S.style; })) S.style = DEF.style;
  S.strength = EDU.clamp(Math.round(+S.strength) || DEF.strength, 1, 10);
  S.numbers = S.numbers !== false;
  function saveS() { store.set('settings', S); }

  /* ------------------------------------------------------------------ state */
  var photo = null;            // { canvas, w, h, name, meta }
  var boxes = [];              // { id, kind:'face'|'manual', x, y, w, h, s, hidden, no }
  var nextId = 1;
  var showOrig = false, drawMode = false;
  var busy = false, cancelReq = false, abortCtl = null, runToken = 0;
  var model = { ready: false, p: null, backend: '' };
  var status = null, lastError = null, lastSave = null;

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  var view = $('#view'), layer = $('#layer');

  /* ------------------------------------------------------------------ helpers */
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function show(node, on) { node.hidden = !on; }
  function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }
  function baseName(name) { return String(name || 'photo').replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[\\/:*?"<>|\s]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'photo'; }
  function fmt1(n) { return EDU.fmt(n, { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }

  function loadScript(src, test) {
    return new Promise(function (resolve, reject) {
      if (test()) return resolve();
      var s = document.createElement('script');
      s.src = src; s.async = true; s.crossOrigin = 'anonymous';
      var timer = setTimeout(function () { s.remove(); reject(new Error('timeout: ' + src)); }, 90000);
      s.onload = function () { clearTimeout(timer); if (test()) resolve(); else reject(new Error('not loaded: ' + src)); };
      s.onerror = function () { clearTimeout(timer); s.remove(); reject(new Error('failed: ' + src)); };
      document.head.appendChild(s);
    });
  }

  /* fetch with download progress (onProg gets 0..1); returns Uint8Array */
  function fetchProgress(url, expected, onProg, signal) {
    return fetch(url, { signal: signal || undefined, mode: 'cors', credentials: 'omit' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
      var total = expected || +r.headers.get('content-length') || 0;
      if (!r.body || !r.body.getReader) return r.arrayBuffer().then(function (b) { onProg(1); return new Uint8Array(b); });
      var reader = r.body.getReader(), chunks = [], got = 0;
      function pump() {
        return reader.read().then(function (x) {
          if (x.done) {
            var out = new Uint8Array(got), off = 0;
            chunks.forEach(function (c) { out.set(c, off); off += c.length; });
            onProg(1);
            return out;
          }
          chunks.push(x.value); got += x.value.length;
          if (total) onProg(Math.min(0.99, got / total));
          return pump();
        });
      }
      return pump();
    });
  }

  /* ------------------------------------------------------------------ hidden details (EXIF) reader
     Minimal reader for the TIFF/EXIF block found in JPEG (APP1 "Exif"), PNG (eXIf chunk) and WebP (EXIF chunk).
     Reads IFD0 (camera make/model/date/software), the Exif IFD (date taken) and the GPS IFD (latitude/longitude). */
  function readMeta(buf) {
    var res = { kind: '', exif: false, gps: null, gpsTags: false, make: '', model: '', date: '', software: '' };
    var dv;
    try { dv = new DataView(buf); } catch (e) { return res; }
    var n = dv.byteLength;
    try {
      if (n > 4 && dv.getUint16(0) === 0xFFD8) {
        res.kind = 'jpg';
        var o = 2;
        while (o + 4 <= n) {
          if (dv.getUint8(o) !== 0xFF) break;
          var m = dv.getUint8(o + 1);
          if (m === 0xFF) { o++; continue; }
          if (m === 0xD9 || m === 0xDA) break;                       // end of image / start of scan
          if ((m >= 0xD0 && m <= 0xD7) || m === 0x01) { o += 2; continue; }
          var len = dv.getUint16(o + 2);
          if (len < 2) break;
          if (m === 0xE1 && len >= 16 && o + 10 <= n && dv.getUint32(o + 4) === 0x45786966 && dv.getUint16(o + 8) === 0) {
            readTiff(dv, o + 10, Math.min(n, o + 2 + len), res);
          }
          o += 2 + len;
        }
      } else if (n > 16 && dv.getUint32(0) === 0x89504E47 && dv.getUint32(4) === 0x0D0A1A0A) {
        res.kind = 'png';
        var p = 8;
        while (p + 12 <= n) {
          var clen = dv.getUint32(p), type = dv.getUint32(p + 4);
          if (type === 0x65584966) readTiff(dv, p + 8, Math.min(n, p + 8 + clen), res);   // eXIf
          if (type === 0x49454E44) break;                                                  // IEND
          p += 12 + clen;
        }
      } else if (n > 20 && dv.getUint32(0) === 0x52494646 && dv.getUint32(8) === 0x57454250) {
        res.kind = 'webp';
        var q = 12;
        while (q + 8 <= n) {
          var four = dv.getUint32(q), size = dv.getUint32(q + 4, true);
          if (four === 0x45584946) {                                                       // EXIF
            var st = q + 8;
            if (st + 6 <= n && dv.getUint32(st) === 0x45786966) st += 6;                  // optional "Exif\0\0"
            readTiff(dv, st, Math.min(n, q + 8 + size), res);
          }
          q += 8 + size + (size & 1);
        }
      }
    } catch (e) { /* damaged file: report what we have */ }
    return res;
  }
  function readTiff(dv, s, end, res) {
    if (s + 8 > end) return;
    var bo = dv.getUint16(s);
    if (bo !== 0x4949 && bo !== 0x4D4D) return;
    var le = bo === 0x4949;
    function ok(off, size) { return off >= 0 && s + off + size <= end; }
    function u16(off) { return ok(off, 2) ? dv.getUint16(s + off, le) : 0; }
    function u32(off) { return ok(off, 4) ? dv.getUint32(s + off, le) : 0; }
    if (u16(2) !== 42) return;
    res.exif = true;
    function ifd(off) {
      var out = {};
      if (!off || !ok(off, 2)) return out;
      var cnt = u16(off);
      if (cnt > 600) return out;
      for (var i = 0; i < cnt; i++) {
        var e = off + 2 + i * 12;
        if (!ok(e, 12)) break;
        out[u16(e)] = { type: u16(e + 2), count: u32(e + 4), at: e + 8 };
      }
      return out;
    }
    function str(en) {
      if (!en || en.type !== 2) return '';
      var o = en.count <= 4 ? en.at : u32(en.at), r = '';
      for (var k = 0; k < Math.min(en.count, 120); k++) {
        if (!ok(o + k, 1)) break;
        var ch = dv.getUint8(s + o + k);
        if (!ch) break;
        r += String.fromCharCode(ch);
      }
      return r.replace(/[^\x20-\x7E]/g, '').trim();
    }
    function rats(en) {
      if (!en || (en.type !== 5 && en.type !== 10) || en.count < 1) return null;
      var o = u32(en.at), a = [];
      for (var k = 0; k < Math.min(en.count, 3); k++) {
        if (!ok(o + 8 * k, 8)) return null;
        var num = u32(o + 8 * k), den = u32(o + 8 * k + 4);
        a.push(den ? num / den : 0);
      }
      return a;
    }
    var i0 = ifd(u32(4));
    res.make = str(i0[0x010F]) || res.make;
    res.model = str(i0[0x0110]) || res.model;
    res.date = str(i0[0x0132]) || res.date;
    res.software = str(i0[0x0131]) || res.software;
    if (i0[0x8769]) {
      var ex = ifd(u32(i0[0x8769].at));
      var d = str(ex[0x9003]);
      if (d) res.date = d;
    }
    if (i0[0x8825]) {
      var g = ifd(u32(i0[0x8825].at));
      res.gpsTags = Object.keys(g).length > 0;
      var la = rats(g[2]), lo = rats(g[4]);
      if (la && lo) {
        var lat = la[0] + (la[1] || 0) / 60 + (la[2] || 0) / 3600;
        var lon = lo[0] + (lo[1] || 0) / 60 + (lo[2] || 0) / 3600;
        if (str(g[1]).toUpperCase() === 'S') lat = -lat;
        if (str(g[3]).toUpperCase() === 'W') lon = -lon;
        if (isFinite(lat) && isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 && !(lat === 0 && lon === 0)) res.gps = { lat: lat, lon: lon };
      }
    }
  }

  /* ------------------------------------------------------------------ status + errors */
  var stText = $('#stText'), stBar = $('#stBar'), stWrap = $('#stBarWrap');
  function setStatus(key, vars, frac) { status = { key: key, vars: vars || {}, frac: frac }; renderStatus(); }
  function clearStatus() { status = null; renderStatus(); }
  function renderStatus() {
    show($('#statusBox'), !!status);
    if (!status) return;
    var txt = t(status.key, status.vars);
    if (stText.textContent !== txt) stText.textContent = txt;
    var indet = status.frac === null || status.frac === undefined;
    stBar.classList.toggle('fb-indet', indet);
    var pct = indet ? 100 : Math.round(EDU.clamp(status.frac, 0, 1) * 100);
    stBar.style.width = pct + '%';
    if (indet) stWrap.removeAttribute('aria-valuenow'); else stWrap.setAttribute('aria-valuenow', String(pct));
    show(stWrap, status.frac !== 'none');
  }
  function showError(key, vars, opts) {
    lastError = { key: key, vars: vars || {}, offline: navigator.onLine === false, retry: !!(opts && opts.retry), manual: !!(opts && opts.manual) };
    renderError();
  }
  function clearError() { lastError = null; renderError(); }
  function renderError() {
    var box = $('#errBox');
    if (!lastError) { show(box, false); return; }
    var msg = t(lastError.key, lastError.vars);
    if (lastError.offline) msg += ' ' + t('err_offline');
    if (lastError.manual) msg += ' ' + t('err_manual');
    $('#errText').textContent = msg;
    show($('#retryBtn'), lastError.retry);
    show(box, true);
    if (!photo) { show($('#editor'), true); $('#grid').classList.add('active'); }
  }

  /* ------------------------------------------------------------------ AI model */
  function chooseBackend() {
    var tf = window.faceapi.tf;
    try { if (tf.setWasmPaths) tf.setWasmPaths(TF_WASM); } catch (e) { /* ignore */ }
    function tryB(name) {
      return Promise.resolve().then(function () { return tf.setBackend(name); }).then(function (ok) {
        if (ok === false) throw new Error('backend ' + name);
        return tf.ready();
      }).then(function () { return name; });
    }
    return tryB('webgl').catch(function () { return tryB('wasm'); }).catch(function () { return tryB('cpu'); });
  }
  function ensureModel() {
    if (model.ready) return Promise.resolve();
    if (model.p) return model.p;
    abortCtl = window.AbortController ? new AbortController() : null;
    var signal = abortCtl && abortCtl.signal;
    setStatus('st_lib', null, null);
    model.p = loadScript(FA_LIB, function () { return !!(window.faceapi && window.faceapi.nets && window.faceapi.tf); })
      .then(chooseBackend)
      .then(function (b) { model.backend = b; })
      .then(function () {
        return fetch(FA_MANIFEST, { signal: signal || undefined, mode: 'cors', credentials: 'omit' }).then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        });
      })
      .then(function (man) {
        setStatus('st_model', { pct: 0, mb: DL_MB }, 0);
        return fetchProgress(FA_BIN, BIN_BYTES, function (f) {
          if (!cancelReq) setStatus('st_model', { pct: Math.round(f * 100), mb: DL_MB }, f);
        }, signal).then(function (bytes) { return { man: man, bytes: bytes }; });
      })
      .then(function (x) {
        setStatus('st_init', null, null);
        var specs = [];
        x.man.forEach(function (g) { specs = specs.concat(g.weights); });
        var map = window.faceapi.tf.io.decodeWeights(x.bytes.buffer, specs);
        return window.faceapi.nets.ssdMobilenetv1.loadFromWeightMap(map);
      })
      .then(function () {
        /* the first WebGL run can return nothing while shaders compile: warm up on a blank canvas */
        return window.faceapi.detectAllFaces(canvas(64, 64), new window.faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }));
      })
      .then(function () { model.ready = true; store.set('modelOnce', true); renderTexts(); });
    model.p.catch(function () { model.p = null; });
    return model.p;
  }

  /* ------------------------------------------------------------------ face finding */
  function tilesFor(W, H, frac) {
    var ts = Math.round(Math.min(W, H) * frac);
    if (ts < 140) return [];
    var step = Math.round(ts * 0.7);
    function pos(L) {
      if (ts >= L) return [0];
      var a = [];
      for (var p = 0; p + ts < L; p += step) a.push(p);
      a.push(L - ts);
      return a.filter(function (v, i) { return a.indexOf(v) === i; });
    }
    var out = [];
    pos(H).forEach(function (y) { pos(W).forEach(function (x) { out.push({ x: x, y: y, w: Math.min(ts, W), h: Math.min(ts, H) }); }); });
    return out;
  }
  function overlapMin(a, b) {
    var x1 = Math.max(a.x, b.x), y1 = Math.max(a.y, b.y);
    var x2 = Math.min(a.x + a.w, b.x + b.w), y2 = Math.min(a.y + a.h, b.y + b.h);
    var i = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    return i / Math.max(1, Math.min(a.w * a.h, b.w * b.h));
  }
  /* join overlapping detections of the same face (from the whole photo and from neighbouring tiles) */
  function mergeBoxes(list) {
    list.sort(function (a, b) { return b.s - a.s; });
    var out = [];
    list.forEach(function (b) {
      var hit = null;
      for (var i = 0; i < out.length; i++) if (overlapMin(out[i], b) > 0.45) { hit = out[i]; break; }
      if (!hit) { out.push({ x: b.x, y: b.y, w: b.w, h: b.h, s: b.s }); return; }
      var ra = (b.w * b.h) / Math.max(1, hit.w * hit.h);
      if (ra > 2.5 || ra < 0.4) return;               // very different sizes: keep the more confident one
      var x1 = Math.min(hit.x, b.x), y1 = Math.min(hit.y, b.y);
      var x2 = Math.max(hit.x + hit.w, b.x + b.w), y2 = Math.max(hit.y + hit.h, b.y + b.h);
      hit.x = x1; hit.y = y1; hit.w = x2 - x1; hit.h = y2 - y1;
    });
    return out;
  }
  var currentRun = Promise.resolve();
  function findFaces(harder, auto) {
    if (!photo) return Promise.resolve();
    if (busy) {
      if (!auto) return currentRun;
      return currentRun.then(function () { return findFaces(harder, true); });   // a new photo: wait for the old run to stop
    }
    currentRun = runFind(harder);
    return currentRun;
  }
  /* unsure boxes far bigger or smaller than the sure faces in the same photo are usually not faces */
  function dropOdd(list, known) {
    var sure = list.concat(known).filter(function (b) { return b.s >= 0.8; }).map(function (b) { return b.w * b.h; }).sort(function (a, b) { return a - b; });
    if (sure.length < 3) return list;
    var med = sure[Math.floor(sure.length / 2)];
    return list.filter(function (b) { var a = b.w * b.h; return b.s >= 0.6 || (a < med * 4 && a > med / 12); });
  }
  async function runFind(harder) {
    var token = ++runToken;
    busy = true; cancelReq = false; clearError(); lastSave = null;
    renderButtons();
    var t0 = performance.now();
    try {
      await ensureModel();
      if (cancelReq || token !== runToken) throw { cancelled: true };
      var fa = window.faceapi, W = photo.w, H = photo.h;
      var conf = harder ? CONF_HARD : CONF;
      /* normal: whole photo + half-size tiles; harder: smaller tiles (more zoom) with a lower score limit */
      var jobs = harder ? tilesFor(W, H, 0.33) : [{ x: 0, y: 0, w: W, h: H, full: true }].concat(tilesFor(W, H, 0.5));
      if (!jobs.length) jobs = [{ x: 0, y: 0, w: W, h: H, full: true }];
      if (jobs.length > MAX_TILES) jobs = jobs.slice(0, MAX_TILES);
      var opts = new fa.SsdMobilenetv1Options({ minConfidence: conf, maxResults: 150 });
      var raw = [];
      for (var i = 0; i < jobs.length; i++) {
        if (cancelReq || token !== runToken) throw { cancelled: true };
        setStatus('st_scan', { n: EDU.fmt(i + 1), total: EDU.fmt(jobs.length) }, i / jobs.length);
        await tick();
        var j = jobs[i];
        var sc = Math.min(1, (j.full ? 1024 : 640) / Math.max(j.w, j.h));
        var c = canvas(j.w * sc, j.h * sc);
        var cx = c.getContext('2d');
        cx.imageSmoothingQuality = 'high';
        cx.fillStyle = '#fff'; cx.fillRect(0, 0, c.width, c.height);      // the AI sees see-through parts as white
        cx.drawImage(photo.canvas, j.x, j.y, j.w, j.h, 0, 0, c.width, c.height);
        var res = await fa.detectAllFaces(c, opts);
        res.forEach(function (d) {
          var b = { x: j.x + d.box.x / sc, y: j.y + d.box.y / sc, w: d.box.width / sc, h: d.box.height / sc, s: d.score };
          if (!j.full && (b.w > j.w * 0.55 || b.h > j.h * 0.55)) return;   // big faces come from the whole-photo pass
          if (b.w < 5 || b.h < 5) return;
          var ar = b.w / b.h;
          if (ar > 1.4 || ar < 0.45) return;                                 // not face-shaped
          raw.push(b);
        });
      }
      if (token !== runToken) throw { cancelled: true };
      var found = dropOdd(mergeBoxes(raw), boxes.filter(function (b) { return b.kind === 'face'; }));
      var added = 0;
      if (harder) {
        found.forEach(function (f) {
          if (boxes.some(function (b) { return overlapMin(b, f) > 0.3; })) return;
          boxes.push(newBox('face', f)); added++;
        });
      } else {
        boxes = boxes.filter(function (b) { return b.kind === 'manual'; });
        found.forEach(function (f) { boxes.push(newBox('face', f)); });
      }
      numberBoxes();
      var secs = (performance.now() - t0) / 1000;
      var faces = boxes.filter(function (b) { return b.kind === 'face'; }).length;
      if (harder) setStatus('st_harder', { n: EDU.fmt(added), s: fmt1(secs) }, 'none');
      else if (faces) setStatus('st_done', { n: EDU.fmt(faces), s: fmt1(secs) }, 'none');
      else setStatus('st_none', null, 'none');
    } catch (e) {
      if (token !== runToken) { /* replaced by a newer photo: say nothing */ }
      else if ((e && e.cancelled) || cancelReq) setStatus('st_stopped', null, 'none');
      else {
        clearStatus();
        showError(model.ready ? 'err_detect' : 'err_model', null, { retry: true, manual: true });
        console.warn('[face-blur]', e);
      }
    } finally {
      busy = false; cancelReq = false; abortCtl = null;
      renderAll();
    }
  }
  function newBox(kind, r) {
    return { id: nextId++, kind: kind, x: r.x, y: r.y, w: r.w, h: r.h, s: r.s || 1, hidden: true, no: 0 };
  }
  /* faces numbered in reading order (row by row), then the boxes drawn by hand */
  function numberBoxes() {
    var faces = boxes.filter(function (b) { return b.kind === 'face'; });
    faces.sort(function (a, b) { return (a.y + a.h / 2) - (b.y + b.h / 2); });
    var rows = [];
    faces.forEach(function (f) {
      var row = rows[rows.length - 1];
      if (row && Math.abs((f.y + f.h / 2) - row.cy) < Math.max(f.h, row.h) * 0.6) row.items.push(f);
      else rows.push({ cy: f.y + f.h / 2, h: f.h, items: [f] });
    });
    var n = 0;
    rows.forEach(function (r) { r.items.sort(function (a, b) { return a.x - b.x; }).forEach(function (f) { f.no = ++n; }); });
    var m = 0;
    boxes.filter(function (b) { return b.kind === 'manual'; }).forEach(function (b) { b.no = ++m; });
    boxes = boxes.filter(function (b) { return b.kind === 'face'; }).sort(function (a, b) { return a.no - b.no; })
      .concat(boxes.filter(function (b) { return b.kind === 'manual'; }));
  }

  /* ------------------------------------------------------------------ drawing the hidden areas */
  function clampBox(r) {
    if (!photo) return r;
    var x = Math.max(0, r.x), y = Math.max(0, r.y);
    var x2 = Math.min(photo.w, r.x + r.w), y2 = Math.min(photo.h, r.y + r.h);
    return { x: x, y: y, w: Math.max(1, x2 - x), h: Math.max(1, y2 - y) };
  }
  /* the detector's box is tight around eyes-nose-mouth: grow it to cover forehead, hair line, ears and chin */
  function coverBox(b) {
    var r = b;
    if (b.kind === 'face') {
      var px = b.w * 0.14, top = b.h * 0.24, bot = b.h * 0.12;
      r = { x: b.x - px, y: b.y - top, w: b.w + 2 * px, h: b.h + top + bot };
    }
    if (S.style === 'bar' || S.style === 'emoji') {
      var g = 0.92 + S.strength * 0.03;
      r = { x: r.x + r.w * (1 - g) / 2, y: r.y + r.h * (1 - g) / 2, w: r.w * g, h: r.h * g };
    }
    return clampBox(r);
  }
  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function smiley(ctx, cx, cy, rad) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD43B'; ctx.fill();
    ctx.lineWidth = Math.max(1.5, rad * 0.07); ctx.strokeStyle = '#B7791F'; ctx.stroke();
    ctx.fillStyle = '#3B2A12';
    ctx.beginPath(); ctx.ellipse(cx - rad * 0.33, cy - rad * 0.22, rad * 0.1, rad * 0.16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + rad * 0.33, cy - rad * 0.22, rad * 0.1, rad * 0.16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy + rad * 0.02, rad * 0.5, Math.PI * 0.18, Math.PI * 0.82);
    ctx.lineWidth = Math.max(1.5, rad * 0.1); ctx.lineCap = 'round'; ctx.strokeStyle = '#3B2A12'; ctx.stroke();
    ctx.restore();
  }
  var tmpA = canvas(1, 1), tmpB = canvas(1, 1);
  function hideArea(ctx, src, b) {
    var r = coverBox(b), k = S.strength;
    var rad = Math.min(r.w, r.h) * (b.kind === 'face' ? 0.3 : 0.12);
    if (S.style === 'bar') {
      ctx.save(); rr(ctx, r.x, r.y, r.w, r.h, Math.min(r.w, r.h) * 0.14); ctx.fillStyle = '#111'; ctx.fill(); ctx.restore();
      return;
    }
    if (S.style === 'emoji') {
      if (b.kind === 'face' || Math.max(r.w, r.h) / Math.min(r.w, r.h) < 1.4) {
        smiley(ctx, r.x + r.w / 2, r.y + r.h / 2, (r.w + r.h) / 4);
      } else {
        ctx.save(); rr(ctx, r.x, r.y, r.w, r.h, Math.min(r.w, r.h) * 0.25); ctx.fillStyle = '#FFD43B'; ctx.fill();
        ctx.lineWidth = Math.max(1.5, Math.min(r.w, r.h) * 0.05); ctx.strokeStyle = '#B7791F'; ctx.stroke(); ctx.restore();
        var d = Math.min(r.w, r.h) * 0.42;
        smiley(ctx, r.x + r.w / 2, r.y + r.h / 2, d);
      }
      return;
    }
    /* The strength is measured against the size of the area, not in pixels: the hidden area keeps only
       `across` blocks of detail along its longer side (8 at strength 1, 3 at strength 10), so a big face in a
       big photo is hidden as well as a small one. Fewer than about 10 blocks across a face is not enough to recognise it. */
    var across = EDU.clamp(Math.round(9 - k * 0.6), 3, 8), L = Math.max(r.w, r.h);
    if (S.style === 'pixel') {
      var pw = Math.max(2, Math.round(across * r.w / L)), ph = Math.max(2, Math.round(across * r.h / L));
      tmpA.width = pw; tmpA.height = ph;
      var a = tmpA.getContext('2d');
      a.imageSmoothingEnabled = true; a.imageSmoothingQuality = 'high';
      a.drawImage(src, r.x, r.y, r.w, r.h, 0, 0, pw, ph);
      ctx.save(); rr(ctx, r.x, r.y, r.w, r.h, rad * 0.4); ctx.clip();
      ctx.clearRect(r.x, r.y, r.w, r.h);              // see-through PNGs: nothing of the original may show through
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmpA, 0, 0, pw, ph, r.x, r.y, r.w, r.h);
      ctx.restore();
      return;
    }
    /* blur: shrink the area a lot (this throws the detail away for good), then enlarge it smoothly in two steps */
    var m = L * 0.12;
    var sx = Math.max(0, r.x - m), sy = Math.max(0, r.y - m);
    var sw = Math.min(src.width, r.x + r.w + m) - sx, sh = Math.min(src.height, r.y + r.h + m) - sy;
    var w1 = Math.max(2, Math.min(Math.round(sw / 2), Math.round(sw * across / L)));
    var h1 = Math.max(2, Math.min(Math.round(sh / 2), Math.round(sh * across / L)));
    tmpA.width = w1; tmpA.height = h1;
    var c1 = tmpA.getContext('2d');
    c1.imageSmoothingEnabled = true; c1.imageSmoothingQuality = 'high';
    c1.drawImage(src, sx, sy, sw, sh, 0, 0, w1, h1);
    var w2 = Math.max(4, Math.round(w1 * 3)), h2 = Math.max(4, Math.round(h1 * 3));
    tmpB.width = w2; tmpB.height = h2;
    var c2 = tmpB.getContext('2d');
    c2.imageSmoothingEnabled = true; c2.imageSmoothingQuality = 'high';
    c2.drawImage(tmpA, 0, 0, w1, h1, 0, 0, w2, h2);
    ctx.save(); rr(ctx, r.x, r.y, r.w, r.h, rad); ctx.clip();
    ctx.clearRect(sx, sy, sw, sh);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(tmpB, 0, 0, w2, h2, sx, sy, sw, sh);
    ctx.restore();
  }
  function paint(ctx, original) {
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0, 0, photo.w, photo.h);
    ctx.drawImage(photo.canvas, 0, 0);
    if (original) return;
    boxes.forEach(function (b) { if (b.hidden) hideArea(ctx, photo.canvas, b); });
  }
  function paintView() {
    if (!photo) return;
    if (view.width !== photo.w || view.height !== photo.h) { view.width = photo.w; view.height = photo.h; }
    paint(view.getContext('2d'), showOrig);
  }

  /* ------------------------------------------------------------------ box buttons over the photo */
  function boxName(b) { return t(b.kind === 'face' ? 'face_n' : 'mine_n', { n: EDU.fmt(b.no) }); }
  function renderBoxes() {
    layer.textContent = '';
    layer.classList.toggle('draw', drawMode);
    layer.classList.toggle('orig', showOrig);
    layer.classList.toggle('nolabels', !S.numbers);
    if (!photo) return;
    boxes.forEach(function (b) {
      var r = coverBox(b);
      var btn = el('button', {
        type: 'button', class: 'fb-box' + (b.kind === 'manual' ? ' manual' : ''),
        'aria-pressed': b.hidden ? 'true' : 'false',
        'aria-label': t('box_label', { name: boxName(b), state: t(b.hidden ? 'state_hidden' : 'state_shown') }),
        title: boxName(b),
        style: { left: (r.x / photo.w * 100) + '%', top: (r.y / photo.h * 100) + '%', width: (r.w / photo.w * 100) + '%', height: (r.h / photo.h * 100) + '%' },
        dataset: { id: String(b.id) }
      }, el('span', { class: 'no', 'aria-hidden': 'true', text: (b.kind === 'manual' ? '✏' : '') + EDU.fmt(b.no) }));
      layer.appendChild(btn);
    });
  }
  layer.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.fb-box');
    if (!btn || drawMode || showOrig) return;
    var id = +btn.dataset.id;
    var b = boxes.filter(function (x) { return x.id === id; })[0];
    if (!b) return;
    b.hidden = !b.hidden; lastSave = null;
    paintView(); renderBoxes(); renderCounts(); renderSave();
    var again = layer.querySelector('[data-id="' + id + '"]');
    if (again) again.focus();
  });

  /* drawing your own boxes */
  var drag = null;
  function ptFromEvent(e) {
    var r = layer.getBoundingClientRect();
    return {
      x: EDU.clamp((e.clientX - r.left) / r.width, 0, 1) * photo.w,
      y: EDU.clamp((e.clientY - r.top) / r.height, 0, 1) * photo.h
    };
  }
  function rubberStyle(a, b) {
    var x = Math.min(a.x, b.x), y = Math.min(a.y, b.y), w = Math.abs(a.x - b.x), h = Math.abs(a.y - b.y);
    return { x: x, y: y, w: w, h: h, css: { left: (x / photo.w * 100) + '%', top: (y / photo.h * 100) + '%', width: (w / photo.w * 100) + '%', height: (h / photo.h * 100) + '%' } };
  }
  layer.addEventListener('pointerdown', function (e) {
    if (!drawMode || !photo || e.button > 0) return;
    e.preventDefault();
    try { layer.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
    var p = ptFromEvent(e);
    drag = { a: p, b: p, el: el('div', { class: 'fb-rubber' }) };
    layer.appendChild(drag.el);
    Object.assign(drag.el.style, rubberStyle(p, p).css);
  });
  layer.addEventListener('pointermove', function (e) {
    if (!drag) return;
    drag.b = ptFromEvent(e);
    Object.assign(drag.el.style, rubberStyle(drag.a, drag.b).css);
  });
  function endDrag(e, cancel) {
    if (!drag) return;
    if (e && !cancel) drag.b = ptFromEvent(e);
    var r = rubberStyle(drag.a, drag.b);
    drag.el.remove(); drag = null;
    var min = Math.max(6, Math.min(photo.w, photo.h) * 0.012);
    if (cancel || r.w < min || r.h < min) return;
    boxes.push(newBox('manual', r));
    numberBoxes(); lastSave = null;
    renderAll();
  }
  layer.addEventListener('pointerup', function (e) { endDrag(e, false); });
  layer.addEventListener('pointercancel', function () { endDrag(null, true); });

  /* ------------------------------------------------------------------ texts */
  function renderCounts() {
    var box = $('#counts');
    box.textContent = '';
    if (!photo) return;
    var faces = boxes.filter(function (b) { return b.kind === 'face'; }).length;
    var mine = boxes.length - faces;
    var hidden = boxes.filter(function (b) { return b.hidden; }).length;
    var shown = boxes.length - hidden;
    box.appendChild(el('span', { class: 'badge primary', id: 'cntFaces', dataset: { n: String(faces) }, text: t('n_faces', { n: EDU.fmt(faces) }) }));
    box.appendChild(el('span', { class: 'badge success', id: 'cntHidden', dataset: { n: String(hidden) }, text: t('n_hidden', { n: EDU.fmt(hidden) }) }));
    if (shown) box.appendChild(el('span', { class: 'badge danger', id: 'cntShown', dataset: { n: String(shown) }, text: t('n_shown', { n: EDU.fmt(shown) }) }));
    if (mine) box.appendChild(el('span', { class: 'badge', id: 'cntMine', dataset: { n: String(mine) }, text: t('n_mine', { n: EDU.fmt(mine) }) }));
  }
  function renderStyles() {
    var wrap = $('#styles');
    wrap.textContent = '';
    STYLES.forEach(function (s) {
      wrap.appendChild(el('button', {
        type: 'button', class: 'chip', id: 'style-' + s.id, 'aria-pressed': S.style === s.id ? 'true' : 'false',
        onclick: function () { S.style = s.id; saveS(); lastSave = null; renderAll(); }
      }, el('span', { 'aria-hidden': 'true', text: s.ic }), ' ', el('span', { text: t('style_' + s.id) })));
    });
    $('#strength').value = String(S.strength);
    $('#strengthLabel').textContent = t(S.style === 'bar' || S.style === 'emoji' ? 'cover_size' : 'strength') + ': ' + EDU.fmt(S.strength);
    $('#optNumbers').checked = S.numbers;
  }
  function renderLoc() {
    var card = $('#locCard'), box = $('#locBox');
    show(card, !!photo);
    box.textContent = '';
    if (!photo) return;
    var m = photo.meta || {};
    if (m.gps) {
      var c = el('div', { class: 'callout danger stack', id: 'locGps' },
        el('p', { class: 'big' }, el('span', { 'aria-hidden': 'true', text: '📍 ' }), el('span', { text: t('loc_gps') })),
        el('p', {}, el('span', { class: 'fb-coords no-i18n', text: m.gps.lat.toFixed(5) + ', ' + m.gps.lon.toFixed(5) })));
      box.appendChild(c);
    } else {
      box.appendChild(el('p', { class: 'callout success', id: 'locNone' }, el('span', { 'aria-hidden': 'true', text: '✅ ' }), el('span', { text: t('loc_none') })));
    }
    var rows = [];
    var cam = [m.make, m.model].filter(Boolean).join(' ').replace(/^(\S+) \1 /i, '$1 ');
    if (cam) rows.push([t('loc_camera'), cam]);
    if (m.date) rows.push([t('loc_date'), m.date.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3').slice(0, 16)]);
    if (m.software) rows.push([t('loc_software'), m.software]);
    if (rows.length) {
      box.appendChild(el('p', { class: 'small' }, el('strong', { text: t('loc_other') })));
      var ul = el('ul', { class: 'fb-meta small', id: 'locMeta' });
      rows.forEach(function (r) { ul.appendChild(el('li', {}, el('span', { text: r[0] + ': ' }), el('span', { class: 'no-i18n', dir: 'auto', text: r[1] }))); });
      box.appendChild(ul);
    } else if (m.exif && !m.gps) {
      box.appendChild(el('p', { class: 'small', text: t('loc_some') }));
    }
    box.appendChild(el('p', { class: 'small muted', text: t('loc_clean') }));
  }
  function renderSave() {
    show($('#saveCard'), !!photo);
    var msg = $('#saveMsg');
    msg.textContent = '';
    if (!photo || !lastSave) return;
    if (lastSave.fail) { msg.appendChild(el('span', { class: 'callout danger', style: { display: 'block' }, text: t('save_fail') })); return; }
    var p = el('span', { class: 'callout success', style: { display: 'block' }, id: 'savedNote' });
    p.appendChild(el('span', { text: t(lastSave.clean ? 'saved_ok' : 'saved_plain', { file: lastSave.file }) }));
    if (lastSave.shown) p.appendChild(el('span', { text: ' ' + t('saved_shown', { n: EDU.fmt(lastSave.shown) }) }));
    msg.appendChild(p);
  }
  function renderButtons() {
    var has = !!photo;
    $('#findBtn').disabled = busy || !has;
    $('#harderBtn').disabled = busy || !has || !model.ready;
    show($('#stopBtn'), busy);
    var mine = boxes.some(function (b) { return b.kind === 'manual'; });
    $('#undoBtn').disabled = !mine;
    $('#clearMine').disabled = !mine;
    $('#hideAll').disabled = !boxes.length || boxes.every(function (b) { return b.hidden; });
    $('#showAll').disabled = !boxes.length || boxes.every(function (b) { return !b.hidden; });
    $('#drawBtn').setAttribute('aria-pressed', drawMode ? 'true' : 'false');
    $('#drawBtn').classList.toggle('btn-accent', drawMode);
    $('#origBtn').setAttribute('aria-pressed', showOrig ? 'true' : 'false');
    $('#origBtn').classList.toggle('btn-accent', showOrig);
  }
  function renderTexts() {
    $('#modelNote').textContent = model.ready ? t('model_ready') : t('model_note', { mb: EDU.fmt(DL_MB) });
    $('#hint').textContent = t(drawMode ? 'draw_hint' : (showOrig ? 'orig_hint' : 'tap_hint'));
    $('#insideBody').textContent = t('inside_body', { mb: EDU.fmt(DL_MB), engine: model.backend ? model.backend.toUpperCase() : '-' });
  }
  function renderAll() {
    show($('#emptyBox'), !photo);
    show($('#editor'), !!photo || !!lastError);
    $('#grid').classList.toggle('active', !!photo || !!lastError);
    renderTexts(); renderStyles(); renderCounts(); renderStatus(); renderError(); renderLoc(); renderSave(); renderButtons();
    paintView(); renderBoxes();
  }

  /* ------------------------------------------------------------------ loading photos */
  function decodeImage(blob) {
    function viaImg() {
      return new Promise(function (resolve, reject) {
        var u = URL.createObjectURL(blob), im = new Image();
        im.onload = function () { URL.revokeObjectURL(u); resolve({ src: im, w: im.naturalWidth, h: im.naturalHeight }); };
        im.onerror = function () { URL.revokeObjectURL(u); reject(new Error('decode')); };
        im.src = u;
      });
    }
    if (window.createImageBitmap) {
      return createImageBitmap(blob, { imageOrientation: 'from-image' }).then(function (bm) { return { src: bm, w: bm.width, h: bm.height }; }, viaImg);
    }
    return viaImg();
  }
  function setPhoto(img, name, meta) {
    if (!img.w || !img.h) throw new Error('empty image');
    var sc = Math.min(1, MAX_SIDE / Math.max(img.w, img.h));
    var c = canvas(img.w * sc, img.h * sc);
    var ctx = c.getContext('2d');                 // see-through PNGs stay see-through (white only in the JPG)
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img.src, 0, 0, c.width, c.height);
    if (img.src && img.src.close) { try { img.src.close(); } catch (e) { /* ignore */ } }
    runToken++;            // a running scan of the previous photo stops at its next step
    photo = { canvas: c, w: c.width, h: c.height, name: baseName(name), meta: meta || {} };
    boxes = []; nextId = 1; showOrig = false; drawMode = false; lastSave = null; status = null;
    clearError();
    renderAll();
    if (window.innerWidth <= 900) { try { $('#hEdit').scrollIntoView({ block: 'start' }); } catch (e) { /* ignore */ } }
    setTimeout(function () { findFaces(false, true); }, 30);
  }
  function loadFile(file) {
    if (!file) return;
    clearError();
    var looksImage = /^image\//.test(file.type || '') || /\.(jpe?g|png|webp|gif|bmp|avif|heic|heif)$/i.test(file.name || '');
    if (!looksImage) { showError('err_image'); return; }
    if (file.size > MAX_FILE_MB * 1024 * 1024) { showError('err_big', { mb: EDU.fmt(MAX_FILE_MB) }); return; }
    var readBuf = file.arrayBuffer ? file.arrayBuffer() : new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = rej; r.readAsArrayBuffer(file); });
    readBuf.then(function (buf) {
      var meta = readMeta(buf);
      return decodeImage(file).then(function (img) { setPhoto(img, file.name, meta); });
    }).catch(function (e) { console.warn('[face-blur]', e); showError('err_image'); });
  }
  function loadSample() {
    var url = window.FACE_BLUR_SAMPLE;
    if (!url) return;
    var bin = atob(url.split(',')[1]), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    var meta = readMeta(bytes.buffer);
    decodeImage(new Blob([bytes], { type: 'image/jpeg' })).then(function (img) { setPhoto(img, 'mysore-1895-sample', meta); })
      .catch(function (e) { console.warn('[face-blur]', e); showError('err_image'); });
  }

  /* ------------------------------------------------------------------ saving */
  function exportBlob(type) {
    return new Promise(function (resolve) {
      var c = canvas(photo.w, photo.h);
      paint(c.getContext('2d'), false);
      if (type !== 'png') {                         // JPG has no see-through parts: put the picture on white
        var j = canvas(photo.w, photo.h), jx = j.getContext('2d');
        jx.fillStyle = '#fff'; jx.fillRect(0, 0, j.width, j.height); jx.drawImage(c, 0, 0);
        c = j;
      }
      c.toBlob(function (b) { resolve(b); }, type === 'png' ? 'image/png' : 'image/jpeg', 0.92);
    });
  }
  function save(type) {
    if (!photo) return;
    var name = photo.name + '-safe.' + (type === 'png' ? 'png' : 'jpg');
    var shown = boxes.filter(function (b) { return !b.hidden; }).length;
    exportBlob(type).then(function (blob) {
      if (!blob) throw new Error('toBlob');
      EDU.download(name, blob);
      return blob.arrayBuffer().then(function (buf) {
        var m = readMeta(buf);
        lastSave = { file: name, clean: !m.exif, shown: shown };
        renderSave();
      });
    }).catch(function (e) { console.warn('[face-blur]', e); lastSave = { fail: true }; renderSave(); });
  }
  var canShareFiles = false;
  try {
    canShareFiles = !!(navigator.canShare && navigator.share && navigator.canShare({ files: [new File([new Blob(['x'], { type: 'image/jpeg' })], 'x.jpg', { type: 'image/jpeg' })] }));
  } catch (e) { canShareFiles = false; }
  show($('#shareBtn'), canShareFiles);

  /* ------------------------------------------------------------------ events */
  var fileInput = $('#fileInput');
  function pick() { fileInput.value = ''; fileInput.click(); }
  fileInput.addEventListener('change', function () { if (fileInput.files && fileInput.files[0]) loadFile(fileInput.files[0]); });
  $('#pickBtn').addEventListener('click', pick);
  $('#sampleBtn').addEventListener('click', loadSample);
  var drop = $('#drop');
  drop.addEventListener('click', pick);
  drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  [drop, $('#emptyBox')].forEach(function (z) {
    z.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('over'); });
    z.addEventListener('dragleave', function () { drop.classList.remove('over'); });
    z.addEventListener('drop', function (e) {
      e.preventDefault(); drop.classList.remove('over');
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) loadFile(f);
    });
  });
  document.addEventListener('paste', function (e) {
    var items = (e.clipboardData && e.clipboardData.files) || [];
    if (items.length && /^image\//.test(items[0].type)) { e.preventDefault(); loadFile(items[0]); }
  });

  $('#findBtn').addEventListener('click', function () { findFaces(false); });
  $('#harderBtn').addEventListener('click', function () { findFaces(true); });
  $('#retryBtn').addEventListener('click', function () { if (photo) findFaces(false); else clearError(); });
  $('#stopBtn').addEventListener('click', function () {
    if (!busy) return;
    cancelReq = true;
    if (abortCtl) { try { abortCtl.abort(); } catch (e) { /* ignore */ } }
  });
  $('#drawBtn').addEventListener('click', function () { drawMode = !drawMode; if (drawMode) showOrig = false; renderAll(); });
  $('#origBtn').addEventListener('click', function () { showOrig = !showOrig; if (showOrig) drawMode = false; renderAll(); });
  var fsOk = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  show($('#fsBtn'), fsOk);
  $('#fsBtn').addEventListener('click', function () { EDU.fullscreen($('#stage')); });
  $('#hideAll').addEventListener('click', function () { boxes.forEach(function (b) { b.hidden = true; }); lastSave = null; renderAll(); });
  $('#showAll').addEventListener('click', function () { boxes.forEach(function (b) { b.hidden = false; }); lastSave = null; renderAll(); });
  $('#undoBtn').addEventListener('click', function () {
    var last = null;
    boxes.forEach(function (b) { if (b.kind === 'manual' && (!last || b.id > last.id)) last = b; });
    if (!last) return;
    boxes = boxes.filter(function (b) { return b !== last; });
    numberBoxes(); lastSave = null; renderAll();
  });
  $('#clearMine').addEventListener('click', function () {
    boxes = boxes.filter(function (b) { return b.kind !== 'manual'; });
    lastSave = null; renderAll();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawMode) { if (drag) endDrag(null, true); drawMode = false; renderAll(); }
  });
  $('#strength').addEventListener('input', function () {
    S.strength = EDU.clamp(+this.value || DEF.strength, 1, 10); saveS(); lastSave = null;
    renderStyles(); paintView(); renderBoxes(); renderSave();
  });
  $('#optNumbers').addEventListener('change', function () { S.numbers = this.checked; saveS(); renderBoxes(); });
  $('#saveJpg').addEventListener('click', function () { save('jpg'); });
  $('#savePng').addEventListener('click', function () { save('png'); });
  $('#shareBtn').addEventListener('click', function () {
    if (!photo) return;
    exportBlob('jpg').then(function (blob) {
      if (!blob) throw new Error('toBlob');
      var f = new File([blob], photo.name + '-safe.jpg', { type: 'image/jpeg' });
      return navigator.share({ files: [f], title: t('app_title') });
    }).catch(function (e) { if (!e || e.name !== 'AbortError') console.warn('[face-blur]', e); });
  });
  $('#resetAll').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    runToken++;
    S = Object.assign({}, DEF); saveS();
    photo = null; boxes = []; showOrig = false; drawMode = false; status = null; lastError = null; lastSave = null;
    renderAll();
  });

  /* for the automated test (tools/tests/face-blur.test.js) */
  window.FACE_BLUR_TEST = { readMeta: readMeta, boxes: function () { return boxes.map(function (b) { return Object.assign({}, b); }); }, backend: function () { return model.backend; } };

  EDU.onLang(renderAll);
  renderAll();
})();
