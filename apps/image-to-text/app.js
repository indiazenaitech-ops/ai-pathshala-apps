/* Image to Text (OCR): photos, screenshots and scanned PDFs → editable text, on the device.
   Engine: tesseract.js 5.1.1 (WebAssembly LSTM) + per-language "best_int" data from jsDelivr;
   PDF pages are drawn with pdf.js 3.11.174 (loaded only when a PDF is added).
   Nothing is uploaded: images never leave the browser. Only the engine and the language data are
   downloaded, once. The language data is put straight into tesseract.js's own IndexedDB cache
   ("keyval-store"), so we can show real download progress and it works offline afterwards. */
(function () {
  'use strict';
  var SLUG = 'image-to-text';
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$;
  var store = EDU.store(SLUG);

  /* ------------------------------------------------------------------ constants */
  var CDN = 'https://cdn.jsdelivr.net/npm/';
  var TESS_LIB = CDN + 'tesseract.js@5.1.1/dist/tesseract.min.js';
  var TESS_WORKER = CDN + 'tesseract.js@5.1.1/dist/worker.min.js';
  var TESS_CORE = CDN + 'tesseract.js-core@5.1.1/';
  var PDF_LIB = CDN + 'pdfjs-dist@3.11.174/build/pdf.min.js';
  var PDF_WORKER = CDN + 'pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  function langUrl(code) { return CDN + '@tesseract.js-data/' + code + '/4.0.0_best_int/' + code + '.traineddata.gz'; }
  var CORE_MB = 1.4, CORE_BYTES = 3938657, WORKER_BYTES = 123724;

  /* OCR languages: tesseract code, matching UI language, autonym, download size (MB) */
  var OCR = [
    { code: 'eng', ui: 'en', auto: 'English', mb: 2.9 },
    { code: 'hin', ui: 'hi', auto: 'हिन्दी', mb: 1.4 },
    { code: 'ben', ui: 'bn', auto: 'বাংলা', mb: 1.4 },
    { code: 'mar', ui: 'mr', auto: 'मराठी', mb: 2.0 },
    { code: 'guj', ui: 'gu', auto: 'ગુજરાતી', mb: 1.2 },
    { code: 'pan', ui: 'pa', auto: 'ਪੰਜਾਬੀ', mb: 1.4 },
    { code: 'ori', ui: 'or', auto: 'ଓଡ଼ିଆ', mb: 1.1 },
    { code: 'tam', ui: 'ta', auto: 'தமிழ்', mb: 1.4 },
    { code: 'tel', ui: 'te', auto: 'తెలుగు', mb: 1.7 },
    { code: 'kan', ui: 'kn', auto: 'ಕನ್ನಡ', mb: 1.9 },
    { code: 'mal', ui: 'ml', auto: 'മലയാളം', mb: 2.8 },
    { code: 'urd', ui: 'ur', auto: 'اردو', mb: 1.0 }
  ];
  var CODES = OCR.map(function (l) { return l.code; });
  /* page types → Tesseract page segmentation mode */
  var DOCS = [
    { id: 'auto', psm: '3' },
    { id: 'block', psm: '6' },
    { id: 'card', psm: '11' },
    { id: 'table', psm: '6', table: true },
    { id: 'line', psm: '7' }
  ];
  var MAX_PAGES = 100, MAX_SIDE = 2500, MAX_UP = 3500, PREVIEW_SIDE = 1400, LOW = 60, MAX_LANGS = 3, IDLE_MS = 90000;
  var MARKER_RE = /^---\s.+\s---$/;

  /* ------------------------------------------------------------------ settings */
  var DEF = { langs: null, doc: 'auto', join: false, marks: true, gray: false, levels: false, contrast: 0, bw: false, bwLevel: 0, up: false, deskew: true, unsure: true, keep: false };
  var S = Object.assign({}, DEF, store.get('settings', {}));
  (function sanitize() {
    if (!Array.isArray(S.langs)) S.langs = null;
    else {
      S.langs = S.langs.filter(function (c, i, a) { return CODES.indexOf(c) >= 0 && a.indexOf(c) === i; }).slice(0, MAX_LANGS);
      if (!S.langs.length) S.langs = null;
    }
    if (!DOCS.some(function (d) { return d.id === S.doc; })) S.doc = 'auto';
    S.contrast = EDU.clamp(+S.contrast || 0, -50, 100);
    S.bwLevel = EDU.clamp(+S.bwLevel || 0, -60, 60);
    ['join', 'marks', 'gray', 'levels', 'bw', 'up', 'deskew', 'unsure', 'keep'].forEach(function (k) { S[k] = !!S[k]; });
  })();
  function saveS() { store.set('settings', S); }

  function ocrInfo(code) { for (var i = 0; i < OCR.length; i++) if (OCR[i].code === code) return OCR[i]; return OCR[0]; }
  function langName(code) { return t('lang_' + code); }
  function uiOcr() { for (var i = 0; i < OCR.length; i++) if (OCR[i].ui === EDU.lang) return OCR[i].code; return 'eng'; }
  function defaultLangs() { var u = uiOcr(); return u === 'eng' ? ['eng'] : [u, 'eng']; }
  function langsNow() { return (S.langs && S.langs.length ? S.langs : defaultLangs()).slice(); }
  /* English first, then the Indian languages: tested on mixed Hindi/English notices and cards, this reads
     digits, phone numbers and English words much better and Indian-script words just as well.
     Urdu is the exception and goes first: with English as the main language, right-to-left Urdu words
     were read as Latin junk (e.g. "آج" → "gl"), which also flipped the line to left-to-right. */
  function orderLangs(a) {
    return (a.indexOf('urd') >= 0 ? ['urd'] : []).concat(a.indexOf('eng') >= 0 ? ['eng'] : [],
      a.filter(function (c) { return c !== 'eng' && c !== 'urd'; }));
  }
  function docDef(id) { for (var i = 0; i < DOCS.length; i++) if (DOCS[i].id === (id || S.doc)) return DOCS[i]; return DOCS[0]; }
  function mb(n) { return t('size_mb', { n: EDU.fmt(n, { maximumFractionDigits: 1 }) }); }

  /* ------------------------------------------------------------------ state */
  var pages = [], cur = -1, nextId = 1;
  var busy = false, cancelReq = false, cancelFns = [], abortCtl = null;
  var saved = {};                       // language code → true when its data is on this device
  var textDirty = false, curLc = null, pdfText = null;
  var lastStage = null, lastError = null, lastSuggest = null;
  var eng = { libP: null, coreP: null, urls: null, worker: null, wlangs: '', idle: 0 };

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  var resultEl = $('#result');
  try { resultEl.contentEditable = 'plaintext-only'; } catch (e) { /* older Firefox */ }
  if (resultEl.contentEditable !== 'plaintext-only') resultEl.contentEditable = 'true';

  /* ------------------------------------------------------------------ small helpers */
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function ctx2d(c) { return c.getContext('2d', { willReadFrequently: true }); }
  function show(node, on) { node.hidden = !on; }
  function baseName(name) { return String(name || '').replace(/\.[a-z0-9]{2,5}$/i, '').trim(); }
  function safeFile(s) { return String(s || '').replace(/[\\/:*?"<>|\s]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'text'; }
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
  function simd() {
    try { return WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11])); }
    catch (e) { return false; }
  }

  function loadScript(src, test) {
    return new Promise(function (resolve, reject) {
      if (test()) return resolve();
      var s = document.createElement('script');
      s.src = src; s.async = true; s.crossOrigin = 'anonymous';
      var timer = setTimeout(function () { s.remove(); reject(new Error('timeout: ' + src)); }, 60000);
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

  /* Rejects with {cancelled:true} when the user presses Stop. */
  function cancelable(p) {
    return new Promise(function (resolve, reject) {
      var done = false;
      cancelFns.push(function () { if (!done) { done = true; reject({ cancelled: true }); } });
      p.then(function (v) { if (!done) { done = true; resolve(v); } }, function (e) { if (!done) { done = true; reject(e); } });
    });
  }

  /* ------------------------------------------------------------------ IndexedDB (tesseract.js cache) */
  var IDB = 'keyval-store', IDB_STORE = 'keyval';
  function idbKey(code) { return './' + code + '.traineddata'; }
  function idb(mode, fn) {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) return reject(new Error('no IndexedDB'));
      var o;
      try { o = indexedDB.open(IDB); } catch (e) { return reject(e); }
      o.onupgradeneeded = function () { if (!o.result.objectStoreNames.contains(IDB_STORE)) o.result.createObjectStore(IDB_STORE); };
      o.onerror = function () { reject(o.error); };
      o.onblocked = function () { reject(new Error('blocked')); };
      o.onsuccess = function () {
        var db = o.result, tx, req;
        try { tx = db.transaction(IDB_STORE, mode); req = fn(tx.objectStore(IDB_STORE)); }
        catch (e) { db.close(); return reject(e); }
        tx.oncomplete = function () { db.close(); resolve(req ? req.result : undefined); };
        tx.onerror = tx.onabort = function () { db.close(); reject(tx.error || new Error('idb')); };
      };
    });
  }
  function refreshSaved() {
    return idb('readonly', function (s) { return s.getAllKeys(); }).then(function (keys) {
      saved = {};
      (keys || []).forEach(function (k) { var m = /^\.\/([a-z]{3})\.traineddata$/.exec(String(k)); if (m) saved[m[1]] = true; });
    }).catch(function () { saved = {}; }).then(function () { renderLangs(); renderStorage(); });
  }

  /* ------------------------------------------------------------------ status line */
  var stText = $('#stText'), stBar = $('#stBar'), stWrap = $('#stBarWrap');
  function stageText(s) {
    if (!s) return '';
    switch (s.kind) {
      case 'lib': return t('st_lib');
      case 'core': return t('st_core', { size: mb(CORE_MB) });
      case 'lang': return t('st_lang', { lang: langName(s.code), size: mb(ocrInfo(s.code).mb) });
      case 'init': return t('st_init');
      case 'pdf': return t('st_pdf');
      case 'page': return t('st_page', { n: EDU.fmt(s.n), total: EDU.fmt(s.total) });
      case 'done': return t('st_done', { s: EDU.fmt(s.secs, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) });
      case 'stopped': return t('st_stopped');
    }
    return '';
  }
  function stage(kind, frac, extra) {
    var s = Object.assign({ kind: kind, frac: frac }, extra || {});
    var txt = stageText(s);
    show($('#statusBox'), true);
    if (stText.textContent !== txt) stText.textContent = txt;
    var indet = frac === null || frac === undefined;
    stBar.classList.toggle('it-indet', indet);
    var pct = indet ? 100 : Math.round(EDU.clamp(frac, 0, 1) * 100);
    stBar.style.width = pct + '%';
    if (indet) stWrap.removeAttribute('aria-valuenow'); else stWrap.setAttribute('aria-valuenow', String(pct));
    lastStage = s;
  }
  function hideStage() { show($('#statusBox'), false); lastStage = null; }
  function showError(e) {
    var key = 'err_engine', vars = {};
    if (e && e.lang) { key = 'err_lang'; vars = { lang: e.lang }; }
    else if (e && e.pdf) key = e.pw ? 'err_pdf_pw' : 'err_pdf';
    lastError = { key: key, vars: vars, offline: navigator.onLine === false };
    renderError();
    if (e && e.cause) console.warn('[image-to-text]', e.cause);
    else if (e) console.warn('[image-to-text]', e);
  }
  function renderError() {
    var box = $('#errBox');
    if (!lastError) { show(box, false); return; }
    var v = Object.assign({}, lastError.vars);
    if (v.lang) v.lang = langName(v.lang);
    $('#errText').textContent = t(lastError.key, v) + (lastError.offline ? ' ' + t('err_offline') : '');
    show($('#retryBtn'), lastError.key === 'err_engine' || lastError.key === 'err_lang');
    show(box, true);
  }
  function clearError() { lastError = null; renderError(); }

  /* ------------------------------------------------------------------ OCR engine */
  function ensureLib() {
    if (window.Tesseract && window.Tesseract.createWorker) return Promise.resolve();
    if (!eng.libP) {
      eng.libP = loadScript(TESS_LIB, function () { return !!(window.Tesseract && window.Tesseract.createWorker); });
      eng.libP.catch(function () { eng.libP = null; });
    }
    return eng.libP;
  }
  function cdnUrls() { return { core: TESS_CORE + 'tesseract-core-' + (simd() ? 'simd-' : '') + 'lstm.wasm.js', worker: TESS_WORKER, blob: false }; }
  /* The core (1.4 MB) and worker script are fetched here (with progress, and through the site's
     offline cache) and handed to tesseract.js as blob: URLs. From a downloaded ZIP (file://) a blob
     worker cannot import blob: URLs, so the CDN addresses are used there. */
  function ensureCore() {
    if (eng.urls) return Promise.resolve(eng.urls);
    if (!eng.coreP) {
      var cdn = cdnUrls();
      if (location.protocol === 'file:') eng.coreP = Promise.resolve(cdn);
      else {
        eng.coreP = fetchProgress(cdn.core, CORE_BYTES, function (f) { if (busy && !cancelReq) stage('core', f * 0.94); })
          .then(function (core) {
            return fetchProgress(cdn.worker, WORKER_BYTES, function (f) { if (busy && !cancelReq) stage('core', 0.94 + f * 0.06); }).then(function (wk) {
              return {
                core: URL.createObjectURL(new Blob([core], { type: 'text/javascript' })) + '#.js',
                worker: URL.createObjectURL(new Blob([wk], { type: 'text/javascript' })),
                blob: true
              };
            });
          });
      }
      eng.coreP.then(function (u) { eng.urls = u; }, function () { eng.coreP = null; });
    }
    return eng.coreP;
  }
  function ensureLangs(codes, signal) {
    var chain = Promise.resolve();
    codes.forEach(function (code) {
      chain = chain.then(function () {
        if (cancelReq) throw { cancelled: true };
        return idb('readonly', function (s) { return s.count(idbKey(code)); }).catch(function () { return 0; }).then(function (n) {
          if (n > 0) { saved[code] = true; return; }
          stage('lang', 0, { code: code });
          return fetchProgress(langUrl(code), 0, function (f) { if (!cancelReq) stage('lang', f, { code: code }); }, signal)
            .catch(function (e) { if (cancelReq) throw { cancelled: true }; throw { lang: code, cause: e }; })
            .then(function (data) {
              /* tesseract.js reads "./<code>.traineddata" from this cache (gzip data is fine, it checks the header) */
              return idb('readwrite', function (s) { return s.put(data, idbKey(code)); })
                .then(function () { saved[code] = true; }, function () { /* private mode: tesseract.js fetches it again (from the browser cache) */ });
            });
        });
      });
    });
    return chain.then(function () { renderLangs(); renderStorage(); });
  }
  function killWorker() {
    clearTimeout(eng.idle);
    if (eng.worker) { try { eng.worker.terminate(); } catch (e) { } }
    eng.worker = null; eng.wlangs = '';
  }
  function scheduleIdle() { clearTimeout(eng.idle); eng.idle = setTimeout(killWorker, IDLE_MS); }
  var tessLogger = function (m) {
    if (m && m.status === 'recognizing text' && lastStage && lastStage.kind === 'page' && busy && !cancelReq) {
      stage('page', m.progress, { n: lastStage.n, total: lastStage.total });
    }
  };
  /* createWorker() never settles if a download inside the worker fails, so the raw Worker is caught
     (to stop it and to keep its error out of the console) and failures arrive through errorHandler. */
  function spawn(langStr, urls) {
    return new Promise(function (resolve, reject) {
      var Orig = window.Worker, raw = null, settled = false, timer = 0;
      function fail(e) {
        if (settled) return;
        settled = true; clearTimeout(timer);
        try { if (raw) raw.terminate(); } catch (x) { }
        reject({ cause: e });
      }
      function Capture(u, o) {
        raw = new Orig(u, o);
        raw.addEventListener('error', function (ev) { ev.preventDefault(); fail(new Error('worker: ' + (ev.message || 'error'))); });
        return raw;
      }
      Capture.prototype = Orig.prototype;
      var p;
      window.Worker = Capture;
      try {
        p = window.Tesseract.createWorker(langStr, 1, {
          workerPath: urls.worker, corePath: urls.core,
          logger: function (m) { tessLogger(m); },
          errorHandler: function (e) { fail(new Error(String(e))); }
        });
      } catch (e) { window.Worker = Orig; fail(e); return; }
      window.Worker = Orig;
      timer = setTimeout(function () { fail(new Error('timeout')); }, 180000);
      p.then(function (w) {
        clearTimeout(timer);
        if (settled) { try { w.terminate(); } catch (x) { } return; }
        settled = true; resolve(w);
      }, function (e) { fail(e); });
    });
  }
  function getWorker(langStr) {
    clearTimeout(eng.idle);
    if (eng.worker && eng.wlangs === langStr) return Promise.resolve(eng.worker);
    killWorker();
    stage('init', null);
    return ensureCore().then(function (urls) {
      return spawn(langStr, urls).catch(function (e) {
        if (!urls.blob || cancelReq) throw e;
        eng.urls = cdnUrls();            // this browser cannot use the blob: copies; use the CDN directly
        return spawn(langStr, eng.urls);
      });
    }).then(function (w) {
      if (cancelReq) { try { w.terminate(); } catch (x) { } throw { cancelled: true }; }
      eng.worker = w; eng.wlangs = langStr;
      return w;
    });
  }

  /* ------------------------------------------------------------------ images & PDFs */
  function decode(blob) {
    function viaImg() {
      return new Promise(function (resolve, reject) {
        var u = URL.createObjectURL(blob), im = new Image();
        im.onload = function () {
          if (!im.naturalWidth) { URL.revokeObjectURL(u); return reject(new Error('empty image')); }
          resolve({ img: im, w: im.naturalWidth, h: im.naturalHeight, close: function () { URL.revokeObjectURL(u); } });
        };
        im.onerror = function () { URL.revokeObjectURL(u); reject(new Error('decode')); };
        im.src = u;
      });
    }
    if (window.createImageBitmap) {
      return createImageBitmap(blob).then(function (b) {
        if (!b.width) throw new Error('empty');
        return { img: b, w: b.width, h: b.height, close: function () { if (b.close) b.close(); } };
      }).catch(viaImg);
    }
    return viaImg();
  }
  function isPdf(f) { return f.type === 'application/pdf' || /\.pdf$/i.test(f.name || ''); }
  function isHeic(f) { return /hei[cf]/i.test(f.type || '') || /\.hei[cf]$/i.test(f.name || ''); }
  function makeThumb(img, w, h) {
    var th = 188, tw = Math.max(40, Math.min(400, Math.round(w * th / h)));
    var c = canvas(tw, th), x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, tw, th);
    x.imageSmoothingQuality = 'high';
    x.drawImage(img, 0, 0, tw, th);
    return c;
  }
  function thumbUrl(pg) {
    var b = pg.thumbBase, rot = pg.rot;
    if (!rot) return b.toDataURL('image/jpeg', 0.8);
    var c = canvas(rot % 180 ? b.height : b.width, rot % 180 ? b.width : b.height), x = c.getContext('2d');
    x.translate(c.width / 2, c.height / 2); x.rotate(rot * Math.PI / 180); x.drawImage(b, -b.width / 2, -b.height / 2);
    return c.toDataURL('image/jpeg', 0.8);
  }

  var pdfLibP = null;
  function ensurePdfLib() {
    if (!pdfLibP) {
      pdfLibP = loadScript(PDF_LIB, function () { return !!window.pdfjsLib; }).then(function () {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER;
        return window.pdfjsLib;
      });
      pdfLibP.catch(function () { pdfLibP = null; });
    }
    return pdfLibP;
  }
  function renderPdfPage(doc, no, scale) {
    return doc.getPage(no).then(function (p) {
      var vp = p.getViewport({ scale: scale });
      var c = canvas(vp.width, vp.height);
      return p.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise.then(function () { return c; });
    });
  }

  /* decoded source of a page, at most MAX_SIDE px (two pages are kept decoded) */
  var srcCache = [], srcPending = {};
  function getSource(pg) {
    for (var i = 0; i < srcCache.length; i++) if (srcCache[i].id === pg.id) return Promise.resolve(srcCache[i].c);
    if (srcPending[pg.id]) return srcPending[pg.id];
    var p = pg.kind === 'pdf'
      ? renderPdfPage(pg.doc, pg.no, pg.scale)
      : decode(pg.file).then(function (b) {
        var c = canvas(pg.w, pg.h), x = c.getContext('2d');
        x.imageSmoothingQuality = 'high';
        x.drawImage(b.img, 0, 0, c.width, c.height);
        b.close();
        return c;
      });
    srcPending[pg.id] = p.then(function (c) {
      delete srcPending[pg.id];
      srcCache.push({ id: pg.id, c: c });
      while (srcCache.length > 2) { var old = srcCache.shift(); old.c.width = old.c.height = 0; }
      return c;
    }, function (e) { delete srcPending[pg.id]; throw e; });
    return srcPending[pg.id];
  }
  function dropSource(id) {
    srcCache = srcCache.filter(function (s) { if (s.id === id) { s.c.width = s.c.height = 0; return false; } return true; });
  }

  function addImage(file) {
    if (pages.length >= MAX_PAGES) { EDU.toast(t('pages_full', { n: MAX_PAGES })); return Promise.resolve(false); }
    return decode(file).then(function (b) {
      var sc = Math.min(1, MAX_SIDE / Math.max(b.w, b.h));
      var pg = { id: nextId++, kind: 'img', file: file, name: file.name || 'image.png', ow: b.w, oh: b.h, w: Math.round(b.w * sc), h: Math.round(b.h * sc), rot: 0, crop: null, result: null };
      pg.thumbBase = makeThumb(b.img, b.w, b.h);
      pg.thumb = thumbUrl(pg);
      b.close();
      pages.push(pg);
      return true;
    }, function () {
      EDU.toast(t(isHeic(file) ? 'err_heic' : 'err_file', { name: file.name || '' }), 5000);
      return false;
    });
  }
  function addPdf(file) {
    var wasBusy = busy;
    if (!wasBusy) stage('pdf', null);
    var name = baseName(file.name) || 'PDF';
    return ensurePdfLib().catch(function (e) { throw { cause: e }; }).then(function (lib) {
      return file.arrayBuffer().then(function (buf) {
        return lib.getDocument({ data: new Uint8Array(buf), isEvalSupported: false }).promise.catch(function (e) {
          throw { pdf: true, pw: !!(e && e.name === 'PasswordException'), cause: e };
        });
      });
    }).then(function (doc) {
      var room = MAX_PAGES - pages.length, take = Math.min(doc.numPages, room);
      if (take < doc.numPages) EDU.toast(t('pdf_many', { n: EDU.fmt(take) }), 5000);
      var added = 0, chars = 0;
      var chain = Promise.resolve();
      for (var i = 1; i <= take; i++) (function (no) {
        chain = chain.then(function () {
          return doc.getPage(no).then(function (p) {
            var vp = p.getViewport({ scale: 1 });
            var sc = Math.min(4, MAX_SIDE / Math.max(vp.width, vp.height));
            var pg = { id: nextId++, kind: 'pdf', doc: doc, no: no, scale: sc, name: name + ' · ' + no, ow: Math.round(vp.width * sc), oh: Math.round(vp.height * sc), rot: 0, crop: null, result: null };
            pg.w = pg.ow; pg.h = pg.oh;
            var tsc = 188 / vp.height;
            var textP = no <= 3 ? p.getTextContent().then(function (tc) { tc.items.forEach(function (it) { chars += String(it.str || '').trim().length; }); }).catch(function () { }) : null;
            return Promise.all([renderPdfPage(doc, no, tsc), textP]).then(function (r) {
              pg.thumbBase = r[0]; pg.thumb = thumbUrl(pg);
              pages.push(pg); added++;
              if (!wasBusy) stage('pdf', no / take);
            });
          });
        });
      })(i);
      return chain.then(function () {
        if (chars >= 40 * Math.min(3, take)) { pdfText = { doc: doc, name: file.name || name, n: take }; renderPdfNote(); }
        if (!wasBusy) hideStage();
        return added > 0;
      });
    }).catch(function (e) {
      if (!wasBusy) hideStage();
      showError(e && e.pdf ? e : { cause: e && e.cause || e });
      return false;
    });
  }
  function addFiles(list) {
    var files = Array.prototype.slice.call(list || []).filter(Boolean);
    if (!files.length) return Promise.resolve();
    if (files.length > 1) files.sort(function (a, b) { return String(a.name).localeCompare(String(b.name), undefined, { numeric: true }); });
    var first = pages.length, chain = Promise.resolve();
    clearError();
    files.forEach(function (f) {
      chain = chain.then(function () { return isPdf(f) ? addPdf(f) : addImage(f); });
    });
    return chain.then(function () {
      if (pages.length > first) {
        cur = first;
        renderPages(); renderPreview(); ui();
        ensureLib().then(ensureCore).catch(function () { });   // warm up the engine while the user checks the page
      }
    });
  }

  /* ------------------------------------------------------------------ image processing */
  /* Draw part of the (rotated) source into a new canvas. Region is in rotated-image pixels. */
  function drawRegion(src, rot, rx, ry, rw, rh, scale) {
    var W = src.width, H = src.height;
    var c = canvas(rw * scale, rh * scale), x = ctx2d(c);
    x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.setTransform(scale, 0, 0, scale, -rx * scale, -ry * scale);
    if (rot === 90) { x.translate(H, 0); x.rotate(Math.PI / 2); }
    else if (rot === 180) { x.translate(W, H); x.rotate(Math.PI); }
    else if (rot === 270) { x.translate(0, W); x.rotate(-Math.PI / 2); }
    x.drawImage(src, 0, 0);
    x.setTransform(1, 0, 0, 1, 0, 0);
    return c;
  }
  function processPage(pg, src, preview) {
    var rot = pg.rot, RW = rot % 180 ? src.height : src.width, RH = rot % 180 ? src.width : src.height;
    var cr = (!preview && pg.crop) || { x: 0, y: 0, w: 1, h: 1 };
    var rx = cr.x * RW, ry = cr.y * RH, rw = Math.max(8, cr.w * RW), rh = Math.max(8, cr.h * RH);
    var scale = preview ? Math.min(1, PREVIEW_SIDE / Math.max(rw, rh)) : (S.up ? Math.max(1, Math.min(2, MAX_UP / Math.max(rw, rh))) : 1);
    var c = drawRegion(src, rot, rx, ry, rw, rh, scale);
    var stats = applyFilters(c, preview && !pg.stats);   // brightness stats depend only on the photo: once per page
    return { canvas: c, rx: rx, ry: ry, scale: scale, rot: rot, stats: stats };
  }
  function otsu(h, n) {
    var sum = 0, i;
    for (i = 0; i < 256; i++) sum += i * h[i];
    var sumB = 0, wB = 0, best = -1, thr = 128;
    for (i = 0; i < 256; i++) {
      wB += h[i]; if (!wB) continue;
      var wF = n - wB; if (!wF) break;
      sumB += i * h[i];
      var d = sumB / wB - (sum - sumB) / wF, v = wB * wF * d * d;
      if (v > best) { best = v; thr = i + 1; }
    }
    return thr;
  }
  function lumHist(d, n) {
    var hist = new Uint32Array(256), lum = new Uint8Array(n), i, j;
    for (i = 0, j = 0; j < n; i += 4, j++) { var L = (d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8; lum[j] = L; hist[L]++; }
    return { lum: lum, hist: hist };
  }
  /* Paper brightness across the photo: the bright (90th percentile) level of each block, spread to the
     neighbouring blocks and smoothed. A shadow or a dark table edge shows up as darker blocks. */
  function bgMap(lum, w, h) {
    var bs = Math.max(12, Math.round(Math.max(w, h) / 40)), gw = Math.ceil(w / bs), gh = Math.ceil(h / bs), G = gw * gh;
    var hist = new Uint32Array(G * 256), cnt = new Uint32Array(G), x, y, b, k;
    for (y = 0; y < h; y++) {
      var row = ((y / bs) | 0) * gw, off = y * w;
      for (x = 0; x < w; x++) { b = row + ((x / bs) | 0); hist[b * 256 + lum[off + x]]++; cnt[b]++; }
    }
    /* Blocks with text also vote: dark text on light paper has its middle level near the bright end; light text
       on a dark background (dark-mode screenshot, blackboard) has it near the dark end. */
    var bg = new Float32Array(G), votes = 0, inv = 0;
    for (b = 0; b < G; b++) {
      var acc = 0, q10 = -1, q50 = -1, q90 = 255, base = b * 256;
      for (k = 0; k < 256; k++) {
        acc += hist[base + k];
        if (q10 < 0 && acc >= cnt[b] * 0.1) q10 = k;
        if (q50 < 0 && acc >= cnt[b] * 0.5) q50 = k;
        if (acc >= cnt[b] * 0.9) { q90 = k; break; }
      }
      bg[b] = q90;
      if (q90 - q10 > 60) { votes++; if (q50 - q10 < q90 - q50) inv++; }
    }
    function pass(src, useMax) {
      var o = new Float32Array(G);
      for (var gy = 0; gy < gh; gy++) for (var gx = 0; gx < gw; gx++) {
        var m = 0, s = 0, c = 0;
        for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
          var X = gx + dx, Y = gy + dy;
          if (X < 0 || Y < 0 || X >= gw || Y >= gh) continue;
          var v = src[Y * gw + X]; if (v > m) m = v; s += v; c++;
        }
        o[gy * gw + gx] = useMax ? m : s / c;
      }
      return o;
    }
    bg = pass(pass(bg, true), false);
    var sorted = Array.prototype.slice.call(bg).sort(function (p, q) { return p - q; }), top = sorted[Math.floor((G - 1) * 0.9)], dark = 0;
    for (b = 0; b < G; b++) if (bg[b] < top * 0.7) dark++;
    return { bs: bs, gw: gw, gh: gh, bg: bg, uneven: G ? dark / G : 0, inv: votes >= 4 ? inv / votes : 0 };
  }
  /* Divide every pixel by the paper brightness around it: shadows and dark corners turn white, the text
     stays dark. The gain is capped so noise in really dark areas is not blown up. */
  function flatten(d, w, h, m) {
    var bs = m.bs, gw = m.gw, gh = m.gh, bg = m.bg;
    for (var y = 0; y < h; y++) {
      var fy = (y + 0.5) / bs - 0.5, y0 = EDU.clamp(Math.floor(fy), 0, gh - 1), y1 = Math.min(gh - 1, y0 + 1), ty = EDU.clamp(fy - y0, 0, 1);
      for (var x = 0; x < w; x++) {
        var fx = (x + 0.5) / bs - 0.5, x0 = EDU.clamp(Math.floor(fx), 0, gw - 1), x1 = Math.min(gw - 1, x0 + 1), tx = EDU.clamp(fx - x0, 0, 1);
        var B = (bg[y0 * gw + x0] * (1 - tx) + bg[y0 * gw + x1] * tx) * (1 - ty) + (bg[y1 * gw + x0] * (1 - tx) + bg[y1 * gw + x1] * tx) * ty;
        var g = Math.min(4, 255 / Math.max(1, B)), p = (y * w + x) << 2;
        d[p] = d[p] * g; d[p + 1] = d[p + 1] * g; d[p + 2] = d[p + 2] * g;
      }
    }
  }
  /* Fix lighting (even out shadows + auto levels), contrast, grayscale, black & white. Returns brightness stats. */
  function applyFilters(c, wantStats) {
    var need = S.gray || S.levels || S.contrast || S.bw;
    if (!need && !wantStats) return null;
    var x = ctx2d(c), im = x.getImageData(0, 0, c.width, c.height), d = im.data, n = d.length >> 2, i, j, k;
    var LH = lumHist(d, n), lum = LH.lum, hist = LH.hist, stats = null, map = null;
    if (wantStats) {
      var mean = 0, sq = 0, acc = 0, pLow = 0, pHi = 255;
      for (k = 0; k < 256; k++) { mean += k * hist[k]; sq += k * k * hist[k]; }
      mean /= n;
      for (k = 0; k < 256; k++) { acc += hist[k]; if (acc >= n * 0.005) { pLow = k || 1; break; } }
      acc = 0;
      for (k = 255; k >= 0; k--) { acc += hist[k]; if (acc >= n * 0.01) { pHi = k; break; } }
      map = bgMap(lum, c.width, c.height);
      stats = { mean: mean, sd: Math.sqrt(Math.max(0, sq / n - mean * mean)), lo: pLow, hi: pHi, uneven: map.uneven, inv: map.inv > 0.5 };
    }
    if (!need) return stats;
    if (S.levels) {
      map = map || bgMap(lum, c.width, c.height);
      if (map.inv > 0.5) {
        /* light text on dark: turn it into dark text on light first, or the shadow fix would grey the background */
        for (i = 0; i < d.length; i += 4) { d[i] = 255 - d[i]; d[i + 1] = 255 - d[i + 1]; d[i + 2] = 255 - d[i + 2]; }
        map = bgMap(lumHist(d, n).lum, c.width, c.height);
      }
      flatten(d, c.width, c.height, map);
      LH = lumHist(d, n); lum = LH.lum; hist = LH.hist;
    }
    var p1 = 0, p99 = 255;
    acc = 0;
    for (k = 0; k < 256; k++) { acc += hist[k]; if (acc >= n * 0.01) { p1 = k; break; } }
    acc = 0;
    for (k = 255; k >= 0; k--) { acc += hist[k]; if (acc >= n * 0.01) { p99 = k; break; } }
    var lo = 0, hi = 255;
    if (S.levels && p99 - p1 >= 24) { lo = p1; hi = p99; }
    var C = S.contrast * 1.8, f = (259 * (C + 255)) / (255 * (259 - C));
    var lut = new Uint8ClampedArray(256);
    for (k = 0; k < 256; k++) lut[k] = f * ((k - lo) * 255 / (hi - lo) - 128) + 128;
    if (S.bw) {
      var h2 = new Uint32Array(256);
      for (j = 0; j < n; j++) h2[lut[lum[j]]]++;
      var thr = EDU.clamp(otsu(h2, n) + S.bwLevel, 1, 254);
      for (i = 0, j = 0; j < n; i += 4, j++) { var b = lut[lum[j]] < thr ? 0 : 255; d[i] = d[i + 1] = d[i + 2] = b; }
    } else if (S.gray) {
      for (i = 0, j = 0; j < n; i += 4, j++) { var g = lut[lum[j]]; d[i] = d[i + 1] = d[i + 2] = g; }
    } else {
      for (i = 0; i < d.length; i += 4) { d[i] = lut[d[i]]; d[i + 1] = lut[d[i + 1]]; d[i + 2] = lut[d[i + 2]]; }
    }
    x.putImageData(im, 0, 0);
    return stats;
  }
  /* Grayscale PGM: no PNG encoding needed, Tesseract reads it directly. */
  function toPGM(c) {
    var w = c.width, h = c.height, d = ctx2d(c).getImageData(0, 0, w, h).data;
    var head = 'P5\n' + w + ' ' + h + '\n255\n', out = new Uint8Array(head.length + w * h), i, k;
    for (i = 0; i < head.length; i++) out[i] = head.charCodeAt(i);
    for (i = 0, k = head.length; i < d.length; i += 4, k++) out[k] = (d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8;
    return out;
  }

  /* ------------------------------------------------------------------ preview + crop */
  var preview = $('#preview'), previewBase = null, previewSeq = 0, cropMode = false, dragStart = null, dragRect = null, previewRaf = 0;
  function renderPreview() {
    var pg = pages[cur];
    show($('#editCard'), !!pg);
    show($('#editEmpty'), !pg);
    if (!pg) { previewBase = null; return; }
    $('#pageBadge').textContent = t('page_of', { n: EDU.fmt(cur + 1), total: EDU.fmt(pages.length) });
    preview.setAttribute('aria-label', t('page_label', { n: EDU.fmt(cur + 1), name: pg.name }));
    $('#moveL').disabled = cur <= 0;
    $('#moveR').disabled = cur >= pages.length - 1;
    $('#cropClear').disabled = !pg.crop;
    renderInfo();
    var seq = ++previewSeq;
    getSource(pg).then(function (src) {
      if (seq !== previewSeq || pages[cur] !== pg) return;
      var p = processPage(pg, src, true);
      if (previewBase) previewBase.width = previewBase.height = 0;
      previewBase = p.canvas;
      if (p.stats) pg.stats = p.stats;
      drawPreview();
      renderHints();
    }, function () { EDU.toast(t('err_file', { name: pg.name })); });
  }
  function schedulePreview() {
    if (previewRaf) return;
    previewRaf = requestAnimationFrame(function () { previewRaf = 0; renderPreview(); });
  }
  function drawPreview() {
    var b = previewBase, pg = pages[cur];
    if (!b || !pg) return;
    if (preview.width !== b.width || preview.height !== b.height) { preview.width = b.width; preview.height = b.height; }
    var x = preview.getContext('2d');
    x.drawImage(b, 0, 0);
    var r = dragRect || pg.crop;
    if (r) {
      var W = b.width, H = b.height, rx = r.x * W, ry = r.y * H, rw = r.w * W, rh = r.h * H;
      x.fillStyle = 'rgba(8, 20, 26, 0.5)';
      x.fillRect(0, 0, W, ry); x.fillRect(0, ry + rh, W, H - ry - rh);
      x.fillRect(0, ry, rx, rh); x.fillRect(rx + rw, ry, W - rx - rw, rh);
      x.lineWidth = Math.max(2, W / 360);
      x.setLineDash([x.lineWidth * 4, x.lineWidth * 3]);
      x.strokeStyle = '#ff7a45';
      x.strokeRect(rx, ry, rw, rh);
      x.setLineDash([]);
    }
  }
  function renderInfo() {
    var pg = pages[cur];
    if (!pg) return;
    var info = pg.w !== pg.ow ? t('img_resized', { w: pg.w, h: pg.h, ow: pg.ow, oh: pg.oh }) : t('img_size', { w: pg.w, h: pg.h });
    $('#imgInfo').textContent = pg.name + ' · ' + info;
  }
  var HINTS = [
    /* not for light text on a dark background (dark-mode screenshots): those read fine as they are */
    { key: 'hint_dark', test: function (pg) { return pg.stats.mean < 95 && !pg.stats.inv && !S.levels; }, fix: function () { S.levels = true; }, btn: 'opt_levels' },
    /* a quarter or more of the photo is much darker than the paper: a shadow, a dark table edge or a bright lamp */
    { key: 'hint_shadow', test: function (pg) { return pg.stats.mean >= 95 && pg.stats.uneven >= 0.25 && !pg.stats.inv && !S.levels; }, fix: function () { S.levels = true; }, btn: 'opt_levels' },
    { key: 'hint_faded', test: function (pg) { var s = pg.stats; return s.mean >= 95 && s.uneven < 0.25 && !s.inv && (s.lo > 100 || s.hi - s.lo < 90) && !S.levels && S.contrast < 30 && !S.bw; }, fix: function () { S.levels = true; S.contrast = Math.max(S.contrast, 30); }, btn: 'opt_levels' },
    { key: 'hint_small', test: function (pg) { var cr = pg.crop || { w: 1, h: 1 }; return Math.max(pg.w * cr.w, pg.h * cr.h) < 1000 && !S.up; }, fix: function () { S.up = true; }, btn: 'opt_up' }
  ];
  function renderHints() {
    var box = $('#imgHints'), pg = pages[cur];
    box.innerHTML = '';
    if (!pg || !pg.stats) return;
    HINTS.forEach(function (h) {
      if (!h.test(pg)) return;
      box.appendChild(el('div', { class: 'callout warning small row spread', 'data-hint': h.key },
        el('span', { class: 'grow', text: t(h.key) }),
        el('button', { class: 'btn btn-sm', type: 'button', text: t(h.btn), onclick: function () { h.fix(); saveS(); syncAdjust(); schedulePreview(); } })));
    });
  }
  function setCropMode(on) {
    cropMode = on;
    $('#cropBtn').setAttribute('aria-pressed', on ? 'true' : 'false');
    preview.classList.toggle('crop', on);
    show($('#cropHint'), on);
  }
  function normPoint(e) {
    var r = preview.getBoundingClientRect();
    return { x: EDU.clamp((e.clientX - r.left) / r.width, 0, 1), y: EDU.clamp((e.clientY - r.top) / r.height, 0, 1) };
  }
  preview.addEventListener('pointerdown', function (e) {
    if (!cropMode || !pages[cur]) return;
    e.preventDefault();
    try { preview.setPointerCapture(e.pointerId); } catch (x) { }
    dragStart = normPoint(e);
    dragRect = { x: dragStart.x, y: dragStart.y, w: 0, h: 0 };
  });
  preview.addEventListener('pointermove', function (e) {
    if (!dragStart) return;
    var p = normPoint(e);
    dragRect = { x: Math.min(p.x, dragStart.x), y: Math.min(p.y, dragStart.y), w: Math.abs(p.x - dragStart.x), h: Math.abs(p.y - dragStart.y) };
    drawPreview();
  });
  function endDrag() {
    if (!dragStart) return;
    var pg = pages[cur];
    if (pg && dragRect && dragRect.w > 0.02 && dragRect.h > 0.02) {
      pg.crop = dragRect;
      setCropMode(false);
      $('#cropClear').disabled = false;
      renderHints();
    }
    dragStart = null; dragRect = null;
    drawPreview();
  }
  preview.addEventListener('pointerup', endDrag);
  preview.addEventListener('pointercancel', endDrag);

  function rotate(dir) {
    var pg = pages[cur]; if (!pg) return;
    var c = pg.crop;
    if (c) pg.crop = dir > 0 ? { x: 1 - c.y - c.h, y: c.x, w: c.h, h: c.w } : { x: c.y, y: 1 - c.x - c.w, w: c.h, h: c.w };
    pg.rot = (pg.rot + (dir > 0 ? 90 : 270)) % 360;
    pg.thumb = thumbUrl(pg);
    renderPages(); renderPreview();
  }
  function movePage(dir) {
    var j = cur + dir;
    if (cur < 0 || j < 0 || j >= pages.length) return;
    var p = pages[cur]; pages[cur] = pages[j]; pages[j] = p; cur = j;
    renderPages(); renderPreview();
    var btn = $(dir < 0 ? '#moveL' : '#moveR');
    if (btn.disabled) $(dir < 0 ? '#moveR' : '#moveL').focus();
  }
  function removePage(i) {
    var pg = pages[i]; if (!pg) return;
    pages.splice(i, 1);
    dropSource(pg.id);
    if (pdfText && !pages.some(function (p) { return p.doc === pdfText.doc; })) { pdfText = null; renderPdfNote(); }
    if (cur >= pages.length) cur = pages.length - 1;
    renderPages(); renderPreview(); ui();
  }

  /* ------------------------------------------------------------------ page strip */
  function renderPages() {
    var ul = $('#pages');
    var focusedId = document.activeElement && document.activeElement.closest && document.activeElement.closest('#pages') ? document.activeElement.getAttribute('data-id') : null;
    ul.innerHTML = '';
    show($('#pagesWrap'), pages.length > 0);
    $('#pagesHead').textContent = t('pages_count', { n: EDU.fmt(pages.length) });
    pages.forEach(function (pg, i) {
      var selBtn = el('button', {
        type: 'button', class: 'it-thumb-btn', 'data-id': 's' + pg.id, 'aria-current': i === cur ? 'true' : null,
        'aria-label': t('page_label', { n: EDU.fmt(i + 1), name: pg.name }),
        onclick: function () { cur = i; renderPages(); renderPreview(); }
      }, el('img', { src: pg.thumb, alt: '' }), el('span', { class: 'it-pno', 'aria-hidden': 'true', text: String(i + 1) }),
        pg.result ? el('span', { class: 'it-done-mark', 'aria-hidden': 'true', text: '✓' }) : null);
      var x = el('button', { type: 'button', class: 'it-thumb-x', 'data-id': 'x' + pg.id, 'aria-label': t('remove_page', { n: EDU.fmt(i + 1) }), title: t('remove_page', { n: EDU.fmt(i + 1) }), text: '✕', onclick: function () { removePage(i); } });
      ul.appendChild(el('li', { class: 'it-thumb' + (i === cur ? ' sel' : '') }, selBtn, x));
    });
    if (focusedId) { var f = ul.querySelector('[data-id="' + focusedId + '"]'); if (f) f.focus(); }
    var sel = ul.querySelector('.sel');
    if (sel && sel.scrollIntoView && ul.scrollWidth > ul.clientWidth) {
      var l = sel.offsetLeft, r = l + sel.offsetWidth;
      if (l < ul.scrollLeft || r > ul.scrollLeft + ul.clientWidth) ul.scrollLeft = l - 8;
    }
  }
  function renderPdfNote() {
    show($('#pdfTextNote'), !!pdfText);
    if (pdfText) $('#pdfTextMsg').textContent = t('pdf_has_text', { name: pdfText.name });
  }

  /* ------------------------------------------------------------------ languages + options */
  function renderLangs() {
    var box = $('#langs'), sel = langsNow();
    var focus = document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('it-lang') ? document.activeElement.getAttribute('data-code') : null;
    box.innerHTML = '';
    OCR.forEach(function (L) {
      var on = sel.indexOf(L.code) >= 0;
      var sub = el('span', { class: 'sub' });
      if (L.ui !== EDU.lang) sub.appendChild(el('span', { class: 'no-i18n', lang: L.ui, text: L.auto }));
      sub.appendChild(saved[L.code] ? el('span', { class: 'ok', text: '✓ ' + t('lang_saved') }) : el('span', { text: mb(L.mb) }));
      box.appendChild(el('button', {
        type: 'button', class: 'it-lang', 'data-code': L.code, 'aria-pressed': on ? 'true' : 'false',
        onclick: function () { toggleLang(L.code); }
      }, el('span', { class: 'nm', text: langName(L.code) }), sub));
    });
    if (focus) { var f = box.querySelector('[data-code="' + focus + '"]'); if (f) f.focus(); }
    show($('#urduNote'), sel.indexOf('urd') >= 0);
    show($('#firstTime'), sel.some(function (c) { return !saved[c]; }));
  }
  function toggleLang(code) {
    var sel = langsNow(), i = sel.indexOf(code);
    if (i >= 0) {
      if (sel.length === 1) { EDU.toast(t('lang_need')); return; }
      sel.splice(i, 1);
    } else {
      if (sel.length >= MAX_LANGS) { EDU.toast(t('lang_max')); return; }
      sel.push(code);
    }
    S.langs = orderLangs(sel); saveS(); renderLangs();
  }
  function renderDocSelect() {
    var s = $('#docType');
    s.innerHTML = '';
    DOCS.forEach(function (d) { s.appendChild(el('option', { value: d.id, text: t('doc_' + d.id) })); });
    s.value = S.doc;
  }
  function syncAdjust() {
    $('#optLevels').checked = S.levels; $('#optGray').checked = S.gray; $('#optBw').checked = S.bw; $('#optUp').checked = S.up;
    $('#optDeskew').checked = S.deskew; $('#optContrast').value = S.contrast; $('#optBwLevel').value = S.bwLevel;
    $('#optBwLevel').disabled = !S.bw;
    $('#bwLevelWrap').style.opacity = S.bw ? '1' : '.55';
    $('#optJoin').checked = S.join; $('#optMarks').checked = S.marks; $('#optUnsure').checked = S.unsure; $('#optKeep').checked = S.keep;
  }
  function ui() {
    $('#runBtn').disabled = busy || !pages.length;
    show($('#stopBtn'), busy);
    var rc = $('#runCount');
    show(rc, pages.length > 1);
    rc.textContent = EDU.fmt(pages.length);
    $('#sampleBtn').disabled = busy;
    $('#usePdfText').disabled = busy;
  }

  /* ------------------------------------------------------------------ OCR run */
  function settingsSig(langs) {
    return [langs.join('+'), S.doc, S.gray, S.levels, S.contrast, S.bw, S.bwLevel, S.up, S.deskew].join('|');
  }
  function ocrPage(pg, sig) {
    var doc = docDef();
    return getSource(pg).then(function (src) {
      var p = processPage(pg, src, false);
      var pgm = toPGM(p.canvas);
      p.canvas.width = p.canvas.height = 0;
      var w = eng.worker;
      return cancelable(w.setParameters({ tessedit_pageseg_mode: doc.psm, preserve_interword_spaces: doc.table ? '1' : '0' })).then(function () {
        return cancelable(w.recognize(pgm, { rotateAuto: !!S.deskew }, { text: true, blocks: true, hocr: false, tsv: false }));
      }).then(function (r) { return compact(r.data, p, sig, doc.id); });
    });
  }
  /* The Tamil model writes an invisible ZWNJ after every pulli (்), e.g. "வணக்கம்‌". It means nothing in
     Tamil but breaks copy, search and Excel matching, so it is removed. */
  function cleanWord(s) { return String(s || '').replace(/்‌/g, '்').replace(/​/g, '').trim(); }
  function compact(data, proc, sig, docId) {
    var paras = [], nW = 0, sumC = 0, nLow = 0;
    (data.blocks || []).forEach(function (b) {
      (b.paragraphs || []).forEach(function (p) {
        var lines = [];
        (p.lines || []).forEach(function (l) {
          var words = [];
          (l.words || []).forEach(function (w) {
            var tx = cleanWord(w.text);
            if (!tx) return;
            var c = Math.round(w.confidence || 0);
            words.push({ t: tx, c: c, b: [w.bbox.x0, w.bbox.y0, w.bbox.x1, w.bbox.y1] });
            nW++; sumC += c; if (c < LOW) nLow++;
          });
          if (words.length) lines.push({ h: Math.max(1, l.bbox.y1 - l.bbox.y0), w: words });
        });
        if (lines.length) paras.push(lines);
      });
    });
    return { sig: sig, doc: docId, paras: paras, words: nW, low: nLow, conf: nW ? Math.round(sumC / nW) : 0, rx: proc.rx, ry: proc.ry, scale: proc.scale, rot: proc.rot };
  }

  function run() {
    if (busy) return;
    if (!pages.length) { EDU.toast(t('nothing_to_read')); return; }
    var langs = orderLangs(langsNow());
    var hadResult = pages.some(function (p) { return p.result; });
    if (textDirty && hadResult && getText() && !confirm(t('confirm_rerender'))) return;
    busy = true; cancelReq = false; cancelFns = [];
    abortCtl = window.AbortController ? new AbortController() : null;
    clearError(); lastSuggest = null; renderSuggest();
    ui();
    var t0 = Date.now(), list = pages.slice(), failed = [];
    var sig0 = settingsSig(langs);
    stage('lib', null);
    cancelable(ensureLib())
      .then(function () { if (!eng.urls) stage('core', location.protocol === 'file:' ? null : 0); return cancelable(ensureCore()); })
      .then(function () { return ensureLangs(langs, abortCtl && abortCtl.signal); })
      .then(function () { return getWorker(langs.join('+')); })
      .then(function () {
        var chain = Promise.resolve();
        list.forEach(function (pg, i) {
          chain = chain.then(function () {
            if (cancelReq) throw { cancelled: true };
            var sig = sig0 + '|' + pg.rot + '|' + JSON.stringify(pg.crop);
            if (pg.result && pg.result.sig === sig) return;
            stage('page', 0, { n: i + 1, total: list.length });
            return ocrPage(pg, sig).then(function (r) { pg.result = r; }, function (e) {
              if (e && e.cancelled) throw e;
              pg.result = null; failed.push(i + 1);
              console.warn('[image-to-text] page ' + (i + 1), e);
            }).then(function () { renderPages(); });
          });
        });
        return chain;
      })
      .then(function () {
        busy = false;
        stage('done', 1, { secs: (Date.now() - t0) / 1000 });
        if (failed.length) EDU.toast(t('err_read', { n: failed.join(', ') }), 5000);
        renderResult(true);
        var rc = $('#resultCard');
        if (rc.getBoundingClientRect().top > window.innerHeight * 0.6) rc.scrollIntoView({ behavior: 'smooth', block: 'start' });
      })
      .catch(function (e) {
        if (cancelReq || (e && e.cancelled)) {
          stage('stopped', 0);
          if (pages.some(function (p) { return p.result; })) renderResult(true);
        } else {
          hideStage();
          showError(e);
        }
      })
      .then(function () {
        busy = false; cancelFns = []; abortCtl = null;
        ui(); renderLangs(); renderStorage();
        scheduleIdle();
      });
  }
  function stop() {
    if (!busy) return;
    cancelReq = true;
    if (abortCtl) { try { abortCtl.abort(); } catch (e) { } }
    cancelFns.splice(0).forEach(function (f) { f(); });
    killWorker();
  }

  /* ------------------------------------------------------------------ result */
  function lineParts(ln, table) {
    var ws = ln.w, thr = 0;
    if (table && ws.length > 1) {
      var wsum = 0, chars = 0;
      ws.forEach(function (w) { wsum += w.b[2] - w.b[0]; chars += w.t.length; });
      thr = Math.max(ln.h * 0.9, (wsum / Math.max(1, chars)) * 2.2);
    }
    var seps = [''];
    for (var i = 1; i < ws.length; i++) {
      var gap = Math.max(ws[i].b[0] - ws[i - 1].b[2], ws[i - 1].b[0] - ws[i].b[2]);
      seps.push(table && gap > thr ? '\t' : ' ');
    }
    return seps;
  }
  function wordHtml(w, pgId, text) {
    var e = EDU.esc(text);
    return w.c < LOW ? '<span class="lc" data-p="' + pgId + '" data-b="' + w.b.join(',') + '" data-c="' + w.c + '">' + e + '</span>' : e;
  }
  /* Table pages: split each line into cells at wide gaps, then line the cells up under the columns of
     the line with the most cells (by horizontal overlap), so an empty cell stays empty in Excel. */
  function tableHtml(r, pgId) {
    var lines = [];
    r.paras.forEach(function (ls) { ls.forEach(function (ln) { lines.push(ln); }); });
    var rows = lines.map(function (ln) {
      var seps = lineParts(ln, true), cells = [];
      ln.w.forEach(function (w, i) {
        if (i === 0 || seps[i] === '\t') cells.push({ x0: w.b[0], x1: w.b[2], ws: [] });
        var c = cells[cells.length - 1];
        c.x0 = Math.min(c.x0, w.b[0]); c.x1 = Math.max(c.x1, w.b[2]); c.ws.push(w);
      });
      return cells;
    });
    var rtl = lines.some(function (ln) { return ln.w.length > 1 && ln.w[1].b[0] < ln.w[0].b[0]; });
    var anchor = rows.reduce(function (best, r) { return r.length > best.length ? r : best; }, []);
    function cellHtml(c) { return c.ws.map(function (w) { return wordHtml(w, pgId, w.t); }).join(' '); }
    return rows.map(function (cells) {
      if (rtl || anchor.length < 2 || cells === anchor) return cells.map(cellHtml).join('\t');
      var cols = anchor.map(function () { return []; }), lastCol = -1;
      cells.forEach(function (c) {
        var best = -1, bestScore = -Infinity;
        anchor.forEach(function (a, j) {
          var overlap = Math.min(a.x1, c.x1) - Math.max(a.x0, c.x0);
          var score = overlap > 0 ? overlap : -Math.abs((a.x0 + a.x1) / 2 - (c.x0 + c.x1) / 2);
          if (score > bestScore) { bestScore = score; best = j; }
        });
        if (best <= lastCol) best = Math.min(anchor.length - 1, lastCol + 1);
        if (best <= lastCol) best = lastCol;           // more cells than columns: keep them in the last one
        cols[best].push(cellHtml(c));
        lastCol = best;
      });
      return cols.map(function (c) { return c.join(' '); }).join('\t').replace(/\t+$/, '');
    }).join('\n');
  }
  function buildHtml() {
    var out = [], multi = pages.length > 1;
    pages.forEach(function (pg, pi) {
      var r = pg.result;
      if (!r) return;
      var table = docDef(r.doc).table, paraSep = r.doc === 'card' ? '\n' : '\n\n';
      if (table) {
        var tb = tableHtml(r, pg.id);
        out.push((S.marks && multi ? EDU.esc(t('page_marker', { n: pi + 1 })) + '\n' : '') + tb);
        return;
      }
      var paras = r.paras.map(function (lines) {
        var s = '';
        lines.forEach(function (ln, li) {
          var seps = lineParts(ln, table), last = ln.w.length - 1;
          var next = lines[li + 1], joinNext = S.join && !table && next;
          ln.w.forEach(function (w, wi) {
            var text = w.t;
            var hyph = joinNext && wi === last && /[A-Za-z]-$/.test(text) && /^[a-z]/.test(next.w[0].t);
            if (hyph) text = text.slice(0, -1);
            s += seps[wi] + wordHtml(w, pg.id, text);
            if (wi === last && next) s += joinNext ? (hyph ? '' : ' ') : '\n';
          });
        });
        return s;
      });
      var body = paras.join(paraSep);
      if (S.marks && multi) body = EDU.esc(t('page_marker', { n: pi + 1 })) + '\n' + body;
      out.push(body);
    });
    return out.join('\n\n');
  }
  function getText() {
    return String(resultEl.innerText || resultEl.textContent || '').replace(/\u00a0/g, ' ').replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').replace(/^\n+|\s+$/g, '');
  }
  function resultStats() {
    var nW = 0, sum = 0, low = 0;
    pages.forEach(function (p) { if (p.result) { nW += p.result.words; sum += p.result.conf * p.result.words; low += p.result.low || 0; } });
    return { words: nW, conf: nW ? Math.round(sum / nW) : 0, lowFrac: nW ? low / nW : 0, any: pages.some(function (p) { return p.result; }) };
  }
  /* Tables read as tab-separated text: show them in a fixed-width font with tab stops wide enough
     for the longest cell, so the columns line up in the editor too. */
  function setTabular() {
    var tab = pages.some(function (p) { return p.result && docDef(p.result.doc).table; }), w = 8;
    if (tab) String(resultEl.textContent).split('\n').forEach(function (l) {
      var cells = l.split('\t');
      for (var i = 0; i < cells.length - 1; i++) w = Math.max(w, cells[i].length + 2);
    });
    resultEl.classList.toggle('tabular', tab);
    resultEl.style.tabSize = tab ? String(Math.min(w, 40)) : '';
    resultEl.style.MozTabSize = resultEl.style.tabSize;
  }
  function renderResult(fresh) {
    resultEl.innerHTML = buildHtml();
    setTabular();
    textDirty = false; curLc = null;
    show($('#wordCheck'), false);
    show($('#restoredNote'), false);
    show($('#resultCard'), true);
    if (fresh) suggest();
    afterTextChange();
  }
  function setPlainResult(text) {
    resultEl.textContent = text;
    resultEl.classList.remove('tabular'); resultEl.style.tabSize = '';
    textDirty = false; curLc = null;
    show($('#wordCheck'), false);
    show($('#resultCard'), true);
    afterTextChange();
  }
  function afterTextChange() {
    renderStats();
    if (S.keep) store.set('text', getText());
  }
  function renderStats() {
    var tx = getText(), st = resultStats();
    var box = $('#stats');
    box.innerHTML = '';
    box.appendChild(el('span', { class: 'badge', text: t('words_n', { n: EDU.fmt((tx.match(/\S+/g) || []).length) }) }));
    box.appendChild(el('span', { class: 'badge', text: t('chars_n', { n: EDU.fmt(tx.replace(/\n/g, '').length) }) }));
    if (st.any && st.words && !textDirty) {
      var cls = st.conf >= 85 ? 'success' : st.conf >= 60 ? 'primary' : 'danger';
      box.appendChild(el('span', { class: 'badge ' + cls, id: 'confBadge', title: t('conf_title'), text: t('conf_n', { n: EDU.fmt(st.conf) }) }));
    }
    var n = resultEl.querySelectorAll('.lc').length;
    $('#unsureLabel').textContent = t('unsure_toggle', { n: EDU.fmt(n) });
    show($('#unsureRow'), n > 0);
    $('#nextUnsure').disabled = !S.unsure;
    resultEl.classList.toggle('no-lc', !S.unsure);
    resultEl.setAttribute('data-empty', t('result_empty'));
  }
  function suggest() {
    var st = resultStats(), langs = orderLangs(langsNow());
    if (!st.any) { lastSuggest = null; renderSuggest(); return; }
    if (!st.words) { lastSuggest = { key: 'no_text', sets: [], fix: !S.levels }; renderSuggest(); return; }
    /* A page in the wrong language still gets a fair average (e.g. Hindi lines read as English: 56%, because
       the English lines are 95%), so also warn when more than a quarter of the words are unsure. */
    if (st.conf >= 55 && st.lowFrac <= 0.25) { lastSuggest = null; renderSuggest(); return; }
    var sets = [], cur = langs.join('+'), u = uiOcr();
    function add(set) { set = orderLangs(uniq(set)).slice(0, MAX_LANGS); var k = set.join('+'); if (k !== cur && !sets.some(function (s) { return s.join('+') === k; })) sets.push(set); }
    if (u !== 'eng' && langs.indexOf(u) < 0) add([u, 'eng']);
    if (langs.indexOf('eng') < 0) add(langs.concat('eng'));
    if (langs.indexOf('hin') < 0) add(['hin', 'eng']);
    if (cur !== 'eng') add(['eng']);
    /* offer "Fix lighting" only when the light looks like part of the problem (or there is nothing else to try) */
    var badLight = pages.some(function (p) { var s = p.result && p.stats; return s && !s.inv && (s.mean < 95 || s.uneven >= 0.25 || s.hi - s.lo < 90); });
    lastSuggest = { key: 'low_conf', hw: st.conf < 40, sets: sets.slice(0, 2), fix: !S.levels && (badLight || !sets.length) };
    renderSuggest();
  }
  function fixLighting() { S.levels = true; saveS(); syncAdjust(); schedulePreview(); }
  function renderSuggest() {
    var box = $('#suggestBox'), btns = $('#suggestBtns');
    btns.innerHTML = '';
    if (!lastSuggest) { show(box, false); return; }
    $('#suggestText').textContent = t(lastSuggest.key) + (lastSuggest.hw ? ' ' + t('low_conf_hw') : '');
    lastSuggest.sets.forEach(function (set) {
      btns.appendChild(el('button', {
        /* "Try Hindi + English": the page's own language first in the label (English is still read first) */
        class: 'btn btn-sm', type: 'button', text: t('try_langs', { langs: set.filter(function (c) { return c !== 'eng'; }).concat(set.indexOf('eng') >= 0 ? ['eng'] : []).map(langName).join(' + ') }),
        onclick: function () { S.langs = set.slice(); saveS(); renderLangs(); run(); }
      }));
    });
    /* shadows and dark corners are the other common cause: one tap turns on "Fix lighting" and reads again */
    if (lastSuggest.fix && !S.levels) {
      btns.appendChild(el('button', { class: 'btn btn-sm', type: 'button', id: 'suggestFix', text: t('opt_levels'), onclick: function () { fixLighting(); run(); } }));
    }
    show(btns, btns.children.length > 0);
    show(box, true);
  }

  /* unsure words: click one (or press "Next word to check") to see it in the photo */
  function focusLc(sp) {
    if (curLc && curLc !== sp) curLc.classList.remove('cur');
    curLc = sp;
    sp.classList.add('cur');
    try {
      resultEl.focus({ preventScroll: true });
      var r = document.createRange(); r.selectNodeContents(sp);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    } catch (e) { }
    var top = sp.offsetTop - resultEl.offsetTop;
    if (top < resultEl.scrollTop || top > resultEl.scrollTop + resultEl.clientHeight - 30) resultEl.scrollTop = Math.max(0, top - resultEl.clientHeight / 3);
    showWordCheck(sp);
  }
  function nextUnsure() {
    var all = $$('.lc', resultEl);
    if (!all.length) { EDU.toast(t('no_unsure')); return; }
    var i = curLc ? all.indexOf(curLc) : -1;
    focusLc(all[(i + 1) % all.length]);
  }
  function showWordCheck(sp) {
    var box = $('#wordCheck'), cv = $('#wcCanvas');
    $('#wcInfo').innerHTML = '';
    $('#wcInfo').appendChild(document.createTextNode(t('wc_read', { word: '\u2068' + sp.textContent + '\u2069', n: EDU.fmt(+sp.getAttribute('data-c') || 0) })));
    show(box, true);
    var id = +sp.getAttribute('data-p'), b = String(sp.getAttribute('data-b') || '').split(',').map(Number);
    var pg = pages.filter(function (p) { return p.id === id; })[0];
    if (!pg || !pg.result || b.length !== 4) { show(cv, false); return; }
    var r = pg.result, s = r.scale || 1;
    var x0 = r.rx + b[0] / s, y0 = r.ry + b[1] / s, w = (b[2] - b[0]) / s, h = (b[3] - b[1]) / s, pad = Math.max(4, h * 0.6);
    getSource(pg).then(function (src) {
      if (curLc !== sp) return;
      var rw = w + pad * 4, rh = h + pad * 2;
      var dpr = window.devicePixelRatio || 1, sc = Math.min(4, (72 * dpr) / rh);
      var c = drawRegion(src, r.rot, x0 - pad * 2, y0 - pad, rw, rh, sc);
      cv.width = c.width; cv.height = c.height;
      cv.getContext('2d').drawImage(c, 0, 0);
      cv.style.height = Math.round(c.height / dpr) + 'px';
      c.width = c.height = 0;
      show(cv, true);
    }, function () { show(cv, false); });
  }
  function wordOk() {
    if (!curLc) return;
    var sp = curLc, all = $$('.lc', resultEl), i = all.indexOf(sp);
    var nxt = all[i + 1] || null;
    sp.replaceWith(document.createTextNode(sp.textContent));
    resultEl.normalize();
    curLc = null;
    renderStats();
    if (nxt) focusLc(nxt); else { show($('#wordCheck'), false); EDU.toast(t('no_unsure')); }
  }

  /* ------------------------------------------------------------------ table → CSV */
  function tableRows(text) {
    return text.split('\n').filter(function (l) { return l.trim() && !MARKER_RE.test(l.trim()); })
      .map(function (l) {
        /* tabs come from table reading (empty cells kept); typed or pasted text uses 2+ spaces */
        var cells = (l.indexOf('\t') >= 0 ? l.split('\t') : l.trim().split(/ {2,}/)).map(function (c) { return c.trim(); });
        while (cells.length > 1 && !cells[cells.length - 1]) cells.pop();
        return cells;
      });
  }
  function openCsv() {
    var text = getText();
    if (!text) { EDU.toast(t('result_empty')); return; }
    var rows = tableRows(text), cols = rows.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
    rows = rows.map(function (r) { while (r.length < cols) r.push(''); return r; });
    var tbl = el('table', { class: 'table' });
    var tb = el('tbody');
    rows.slice(0, 60).forEach(function (r) { tb.appendChild(el('tr', null, r.map(function (c) { return el('td', { dir: 'auto', text: c }); }))); });
    tbl.appendChild(tb);
    var base = safeFile(baseName((pages[0] || {}).name) || t('app_title'));
    var body = el('div', { class: 'stack' },
      el('p', { class: 'small muted mb0', text: t('csv_help') }),
      cols < 2 ? el('p', { class: 'callout warning small mb0', text: t('csv_none') }) : null,
      el('p', { class: 'small mb0', style: { fontWeight: '700' }, text: t('csv_rows', { rows: EDU.fmt(rows.length), cols: EDU.fmt(cols) }) }),
      el('div', { class: 'it-csv no-i18n' }, tbl),
      el('div', { class: 'row' },
        el('button', { class: 'btn btn-primary', type: 'button', id: 'csvDl', text: t('csv_dl'), onclick: function () { EDU.download(base + '.csv', EDU.csv.stringify(rows), 'text/csv'); } }),
        el('button', { class: 'btn', type: 'button', id: 'csvCopy', text: t('csv_copy'), onclick: function () { EDU.copy(rows.map(function (r) { return r.join('\t'); }).join('\n')); } })));
    EDU.modal(body, { title: t('csv_title') });
  }

  /* ------------------------------------------------------------------ visiting card → contact (.vcf) */
  var TITLE_RE = /\b(proprietor|prop\.|owner|founder|co-?founder|director|manager|ceo|cto|cfo|coo|chairman|partner|executive|engineer|consultant|advocate|lawyer|doctor|dr\.|chartered accountant|accountant|sales|marketing|head|officer|president|secretary|principal|teacher|professor|designer|developer|architect|agent|representative|associate|analyst|specialist|coordinator|supervisor|incharge|in-charge)\b/i;
  var ORG_RE = /\b(traders?|trading|enterprises?|industries|pvt|private|ltd|limited|llp|inc|solutions|services|agency|agencies|stores?|mart|company|co\.|corporation|corp|associates|consultants|consultancy|group|hospital|clinic|school|academy|institute|foods|textiles|jewell?ers|electronics|motors|builders|infotech|technologies|tech|studio|labs?|exports?|imports?|distributors?|suppliers?|bank|pharma|medicals?)\b/i;
  var ADDR_RE = /(\b\d{6}\b|\b(road|rd\.?|street|st\.|nagar|marg|sector|floor|shop|plot|near|opp\.?|lane|chowk|bazaa?r|market|colony|society|building|bldg|complex|tower|block|phase|district|dist\.|city|india|house|flat|apartment|layout|cross|main|gali|mohalla|village|po|ps)\b)/i;
  var URL_RE = /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:com|in|co\.in|org|org\.in|net|net\.in|info|biz|io|co|shop|store|online|site|app|edu|ac\.in|gov\.in|ai|tech)(?:\/[^\s,;]*)?/gi;
  /* One phone number from a few digit groups, or ''. Indian numbers are +91 / 0091 / 091 / 0 + 10 digits:
     mobiles become "+91 98765 43210"; landlines keep their STD-code grouping ("0141-2234567" → "+91 141 2234567").
     1800/1860 toll-free numbers and other countries' numbers (+…) are kept as written. */
  function phoneOf(groups) {
    var plus = groups[0].charAt(0) === '+', d = groups.join('').replace(/\D/g, ''), pre = -1;
    if (!plus && /^(1800|1860)\d{6,7}$/.test(d)) return groups.join(' ');
    if (plus && /^91\d{10}$/.test(d)) pre = 2;
    else if (plus) return d.length >= 8 && d.length <= 15 && !/^91/.test(d) ? '+' + groups.join(' ').replace(/^\+/, '') : '';
    else if (/^0091\d{10}$/.test(d)) pre = 4;
    else if (/^091\d{10}$/.test(d)) pre = 3;
    else if (/^91[6-9]\d{9}$/.test(d)) pre = 2;              // "91 98765 43210" without the +
    else if (/^0\d{10}$/.test(d)) pre = 1;
    else if (/^[6-9]\d{9}$/.test(d)) pre = 0;
    if (pre < 0) return '';
    var n = d.slice(pre), rest = [], skip = pre;
    if (!/^[1-9]/.test(n)) return '';
    groups.forEach(function (g) {
      g = g.replace(/\D/g, '');
      if (skip >= g.length) { skip -= g.length; return; }
      rest.push(g.slice(skip)); skip = 0;
    });
    if (rest.length > 1 && rest[0].length >= 2 && rest[0].length <= 4) return '+91 ' + rest.join(' ');
    return /^[6-9]/.test(n) ? '+91 ' + n.slice(0, 5) + ' ' + n.slice(5) : '+91 ' + (rest.length > 1 ? rest.join(' ') : n);
  }
  /* All phone numbers in one line, and the line with them taken out (for the address). Digit groups are
     joined into the longest valid number, so "98765 43210 98111 22334" gives two numbers and a PIN code
     or date next to a number is left alone. */
  function scanPhones(line) {
    var phones = [];
    var text = line.replace(/\+?\s?\d[\d\s().-]*/g, function (run) {
      var gs = [], re = /\+?\s?\d+/g, m, cut = [];
      while ((m = re.exec(run))) gs.push({ s: m.index, e: m.index + m[0].length, v: m[0].replace(/\s/g, '') });
      for (var i = 0; i < gs.length;) {
        var best = '', bestJ = -1;
        for (var j = i + 1; j <= Math.min(gs.length, i + 6); j++) {
          var p = phoneOf(gs.slice(i, j).map(function (g) { return g.v; }));
          if (p) { best = p; bestJ = j; }
        }
        if (best) { phones.push(best); cut.push([gs[i].s, gs[bestJ - 1].e]); i = bestJ; } else i++;
      }
      for (var k = cut.length - 1; k >= 0; k--) run = run.slice(0, cut[k][0]) + ' ' + run.slice(cut[k][1]);
      return run;
    });
    return { phones: phones, text: text };
  }
  function extractContact(text) {
    var lines = text.split('\n').map(function (l) { return l.trim(); }).filter(function (l) { return l && !MARKER_RE.test(l); });
    var flat = lines.join('\n');
    var emails = uniq((flat.replace(/\s*@\s*/g, '@').match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g) || []).map(function (s) { return s.toLowerCase(); }));
    var gst = (flat.toUpperCase().replace(/\s+/g, ' ').match(/\b\d{2}[A-Z]{5}\d{4}[A-Z][0-9A-Z]Z[0-9A-Z]\b/) || [])[0] || '';
    var noMail = flat.replace(/[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9.-]+/g, ' ');
    var urls = uniq((noMail.match(URL_RE) || []).map(function (s) { return s.replace(/[.)]+$/, ''); }).filter(function (u) { return /^(https?:\/\/|www\.)/i.test(u) || u.split('.').length >= 2 && !/^\d/.test(u); }));
    var phones = [];
    flat.split('\n').forEach(function (line) {
      scanPhones(line).phones.forEach(function (p) { if (phones.indexOf(p) < 0) phones.push(p); });
    });
    function plain(l) { return !/\d/.test(l) && !/@/.test(l) && !l.match(URL_RE) && l.length >= 3 && l.length <= 48 && l.split(/\s+/).length <= 6; }
    var cands = lines.filter(plain);
    var title = (cands.filter(function (l) { return TITLE_RE.test(l); })[0]) || '';
    var rest = cands.filter(function (l) { return l !== title; });
    var org = rest.filter(function (l) { return ORG_RE.test(l); })[0] || rest.filter(function (l) { return /[A-Z]{3}/.test(l) && l === l.toUpperCase(); })[0] || '';
    rest = rest.filter(function (l) { return l !== org; });
    var person = rest.filter(function (l) { return /^((dr|mr|mrs|ms|shri|smt|er|ca|adv)\.?\s+)?([A-Z][a-z'.]+)(\s+[A-Z][a-z'.]*){1,3}$/.test(l); })[0] || '';
    if (!org) org = rest.filter(function (l) { return l !== person; })[0] || '';
    var addr = lines.filter(function (l) { return ADDR_RE.test(l) && !/@/.test(l); }).map(function (l) {
      return scanPhones(l.replace(/\bGSTIN?\b[:\s-]*[0-9A-Z]{15}/i, '').replace(gst || '\u0000', '').replace(URL_RE, '')).text
        /* "Mob:" / "Ph." / "Tel" labels left behind by a removed number */
        .replace(/(^|[\s|,;·•])(?:mob(?:ile)?|ph(?:one)?|tel(?:ephone)?|cell|whatsapp|fax|contact)\.?\s*(?:no\.?)?\s*[:.-]?\s*(?=$|[|,;·•])/gi, '$1')
        .replace(/[\s·•|,;:-]+$/, '').replace(/^[\s·•|,;:-]+/, '').trim();
    }).filter(Boolean).join(', ');
    return { name: person, org: org, title: title, phones: phones, emails: emails, urls: urls, addr: addr, note: gst ? 'GSTIN: ' + gst : '' };
  }
  function vcard(c) {
    function esc(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([,;])/g, '\\$1'); }
    var parts = (c.name || '').trim().split(/\s+/).filter(Boolean), fam = parts.length > 1 ? parts.pop() : '', given = parts.join(' ');
    var out = ['BEGIN:VCARD', 'VERSION:3.0', 'N:' + esc(fam) + ';' + esc(given) + ';;;', 'FN:' + esc(c.name || c.org || c.phones[0] || c.emails[0] || 'Contact')];
    if (c.org) out.push('ORG:' + esc(c.org));
    if (c.title) out.push('TITLE:' + esc(c.title));
    c.phones.forEach(function (p) { var d = p.replace(/[^\d+]/g, ''); out.push('TEL;TYPE=' + (/^\+91[6-9]\d{9}$/.test(d) ? 'CELL' : 'WORK') + ':' + d); });
    c.emails.forEach(function (e) { out.push('EMAIL;TYPE=INTERNET:' + e); });
    c.urls.forEach(function (u) { out.push('URL:' + (/^https?:\/\//i.test(u) ? u : 'https://' + u)); });
    if (c.addr) out.push('ADR;TYPE=WORK:;;' + esc(c.addr) + ';;;;');
    if (c.note) out.push('NOTE:' + esc(c.note));
    out.push('END:VCARD');
    return out.join('\r\n') + '\r\n';
  }
  function openContact() {
    var text = getText();
    if (!text) { EDU.toast(t('result_empty')); return; }
    var c = extractContact(text);
    function field(id, key, val, multi) {
      var input = multi ? el('textarea', { id: id, rows: 2, dir: 'auto' }) : el('input', { id: id, type: 'text', dir: 'auto' });
      input.value = val;
      return el('label', { class: 'field' + (multi ? ' full' : '') }, el('span', { text: t(key) }), input);
    }
    var found = c.phones.length || c.emails.length || c.urls.length;
    var body = el('div', { class: 'stack' },
      el('p', { class: 'small muted mb0', text: t('vcf_help') }),
      found ? null : el('p', { class: 'callout warning small mb0', text: t('vcf_none') }),
      el('div', { class: 'it-form no-i18n' },
        field('vcName', 'f_name', c.name), field('vcOrg', 'f_org', c.org), field('vcJob', 'f_job', c.title), field('vcEmail', 'f_email', c.emails.join(', ')),
        field('vcPhones', 'f_phones', c.phones.join('\n'), true), field('vcWeb', 'f_web', c.urls.join(', ')), field('vcNote', 'f_note', c.note),
        field('vcAddr', 'f_addr', c.addr, true)),
      el('div', { class: 'row' },
        el('button', {
          class: 'btn btn-primary', type: 'button', id: 'vcDl', text: t('vcf_dl'), onclick: function () {
            var v = function (id) { return $('#' + id).value.trim(); };
            var list = function (id, re) { return v(id).split(re).map(function (s) { return s.trim(); }).filter(Boolean); };
            var card = { name: v('vcName'), org: v('vcOrg'), title: v('vcJob'), phones: list('vcPhones', /\n|,/), emails: list('vcEmail', /[,\s]+/), urls: list('vcWeb', /[,\s]+/), addr: v('vcAddr').replace(/\n+/g, ', '), note: v('vcNote') };
            EDU.download(safeFile(card.name || card.org || 'contact') + '.vcf', vcard(card), 'text/vcard');
          }
        })));
    EDU.modal(body, { title: t('vcf_title') });
  }

  /* ------------------------------------------------------------------ exports */
  function textOrToast() { var tx = getText(); if (!tx) EDU.toast(t('result_empty')); return tx; }
  function outName() { return safeFile(baseName((pages[0] || {}).name) || t('app_title')); }
  $('#copyBtn').addEventListener('click', function () { var tx = textOrToast(); if (tx) EDU.copy(tx); });
  $('#dlTxt').addEventListener('click', function () { var tx = textOrToast(); if (tx) EDU.download(outName() + '.txt', '\uFEFF' + tx.replace(/\n/g, '\r\n'), 'text/plain'); });
  $('#waBtn').addEventListener('click', function (e) {
    var tx = getText();
    if (!tx) { e.preventDefault(); EDU.toast(t('result_empty')); return; }
    var max = 3000;
    if (tx.length > max) { tx = tx.slice(0, max) + '…'; EDU.toast(t('wa_long'), 5000); }
    this.href = EDU.waLink(tx);
  });
  $('#printBtn').addEventListener('click', function () {
    var tx = textOrToast(); if (!tx) return;
    var pa = $('#printArea');
    pa.innerHTML = '';
    pa.appendChild(el('h1', { text: ((pages[0] && pages[0].name) || t('app_title')) + ' · ' + new Date().toLocaleDateString(EDU.langInfo(EDU.lang).tag) }));
    pa.appendChild(el('div', { dir: 'auto', text: tx }));
    window.print();
  });
  $('#csvBtn').addEventListener('click', openCsv);
  $('#vcfBtn').addEventListener('click', openContact);
  $('#clearText').addEventListener('click', function () {
    if (getText() && !confirm(t('confirm_clear_text'))) return;
    resultEl.innerHTML = '';
    pages.forEach(function (p) { p.result = null; });
    lastSuggest = null; renderSuggest();
    store.remove('text');
    show($('#resultCard'), false);
    renderPages();
  });

  /* ------------------------------------------------------------------ PDF's own text */
  function usePdfText() {
    if (!pdfText || busy) return;
    var d = pdfText, parts = [], chain = Promise.resolve();
    for (var i = 1; i <= d.n; i++) (function (no) {
      chain = chain.then(function () {
        return d.doc.getPage(no).then(function (p) { return p.getTextContent(); }).then(function (tc) {
          var s = '';
          tc.items.forEach(function (it) { s += it.str || ''; if (it.hasEOL) s += '\n'; });
          s = s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
          parts.push((S.marks && d.n > 1 ? t('page_marker', { n: no }) + '\n' : '') + s);
        });
      });
    })(i);
    chain.then(function () {
      setPlainResult(parts.join('\n\n'));
      lastSuggest = null; renderSuggest();
      $('#resultCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, function (e) { showError({ pdf: true, cause: e }); });
  }

  /* ------------------------------------------------------------------ sample visiting card */
  function sampleCard() {
    var W = 1050, H = 600, c = canvas(W, H), x = c.getContext('2d');
    var F = '"Segoe UI", Roboto, "Noto Sans", "Nirmala UI", Arial, sans-serif';
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#0b4f5c'; x.fillRect(0, 0, 22, H);
    x.fillStyle = '#d9501c'; x.fillRect(70, 196, 140, 6);
    x.textBaseline = 'alphabetic';
    x.fillStyle = '#0b4f5c'; x.font = 'bold 64px ' + F; x.fillText('SHARMA TRADERS', 70, 112);
    var rtl = EDU.langInfo(EDU.lang).dir === 'rtl';
    x.fillStyle = '#333333'; x.font = '36px "Nirmala UI", "Noto Sans Devanagari", "Noto Sans", ' + F;
    if (rtl) { x.direction = 'rtl'; x.textAlign = 'right'; x.fillText(t('sample_tagline'), W - 70, 170); x.direction = 'ltr'; x.textAlign = 'left'; }
    else x.fillText(t('sample_tagline'), 70, 170);
    x.fillStyle = '#111111'; x.font = 'bold 46px ' + F; x.fillText('Priya Sharma', 70, 282);
    x.fillStyle = '#444444'; x.font = '34px ' + F; x.fillText('Proprietor', 70, 330);
    x.fillStyle = '#111111'; x.font = '36px ' + F;
    x.fillText('+91 98765 43210', 70, 408);
    x.fillText('priya@sharmatraders.in', 70, 458);
    x.fillText('www.sharmatraders.in', 70, 508);
    x.fillStyle = '#444444'; x.font = '30px ' + F;
    x.fillText('Shop 12, Khari Baoli, Delhi 110006', 70, 566);
    return new Promise(function (resolve) {
      c.toBlob(function (b) {
        var f;
        try { f = new File([b], 'visiting-card.png', { type: 'image/png' }); } catch (e) { f = b; f.name = 'visiting-card.png'; }
        resolve(f);
      }, 'image/png');
    });
  }

  /* ------------------------------------------------------------------ storage (help section) */
  function renderStorage() {
    var codes = CODES.filter(function (c) { return saved[c]; });
    $('#storageText').textContent = codes.length ? t('storage_list', { list: codes.map(langName).join(', ') }) : t('storage_none');
    show($('#storageClear'), codes.length > 0);
  }
  $('#storageClear').addEventListener('click', function () {
    if (!confirm(t('confirm_storage_clear'))) return;
    killWorker();
    var urls = CODES.map(langUrl);
    idb('readwrite', function (s) { CODES.forEach(function (c) { s.delete(idbKey(c)); }); return null; }).catch(function () { })
      .then(function () {
        if (!window.caches) return;
        return caches.keys().then(function (keys) {
          return Promise.all(keys.map(function (k) { return caches.open(k).then(function (ch) { return Promise.all(urls.map(function (u) { return ch.delete(u); })); }); }));
        }).catch(function () { });
      })
      .then(function () { saved = {}; renderLangs(); renderStorage(); EDU.toast(t('storage_cleared')); });
  });

  /* ------------------------------------------------------------------ events */
  var fileInput = $('#fileInput'), camInput = $('#camInput'), drop = $('#drop');
  function pick() { fileInput.click(); }
  $('#pickBtn').addEventListener('click', pick);
  $('#camBtn').addEventListener('click', function () { camInput.click(); });
  drop.addEventListener('click', pick);
  drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  fileInput.addEventListener('change', function () { var f = fileInput.files; addFiles(f).then(function () { fileInput.value = ''; }); });
  camInput.addEventListener('change', function () { var f = camInput.files; addFiles(f).then(function () { camInput.value = ''; }); });
  $('#sampleBtn').addEventListener('click', function () { sampleCard().then(function (f) { return addFiles([f]); }); });

  function hasFiles(e) { var d = e.dataTransfer; return d && Array.prototype.indexOf.call(d.types || [], 'Files') >= 0; }
  var dragDepth = 0;
  window.addEventListener('dragenter', function (e) { if (!hasFiles(e)) return; dragDepth++; drop.classList.add('over'); });
  window.addEventListener('dragleave', function () { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) drop.classList.remove('over'); });
  window.addEventListener('dragover', function (e) { if (hasFiles(e)) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } });
  window.addEventListener('drop', function (e) {
    if (!hasFiles(e)) return;
    e.preventDefault(); dragDepth = 0; drop.classList.remove('over');
    addFiles(e.dataTransfer.files);
  });
  document.addEventListener('paste', function (e) {
    var items = (e.clipboardData && e.clipboardData.items) || [], files = [];
    for (var i = 0; i < items.length; i++) if (items[i].kind === 'file' && /^image\/|pdf/.test(items[i].type)) { var f = items[i].getAsFile(); if (f) files.push(f); }
    if (!files.length) return;
    e.preventDefault();
    files.forEach(function (f, i) { if (!f.name || f.name === 'image.png') { try { files[i] = new File([f], 'pasted-' + (nextId + i) + '.png', { type: f.type }); } catch (x) { } } });
    addFiles(files);
  });
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); }
  });

  $('#clearPages').addEventListener('click', function () {
    if (!confirm(t('confirm_clear_pages'))) return;
    stop();                                   // reading the removed pages would end in "Done" with no text
    pages.forEach(function (p) { dropSource(p.id); });
    pages = []; cur = -1; pdfText = null;
    renderPdfNote(); renderPages(); renderPreview(); ui();
  });
  $('#rotL').addEventListener('click', function () { rotate(-1); });
  $('#rotR').addEventListener('click', function () { rotate(1); });
  $('#cropBtn').addEventListener('click', function () { setCropMode(!cropMode); });
  $('#cropClear').addEventListener('click', function () { var pg = pages[cur]; if (!pg) return; pg.crop = null; setCropMode(false); $('#cropClear').disabled = true; drawPreview(); renderHints(); });
  $('#moveL').addEventListener('click', function () { movePage(-1); });
  $('#moveR').addEventListener('click', function () { movePage(1); });
  $('#usePdfText').addEventListener('click', usePdfText);

  function bindCheck(id, key, after) {
    $(id).addEventListener('change', function () { S[key] = this.checked; saveS(); syncAdjust(); if (after) after(); });
  }
  bindCheck('#optLevels', 'levels', schedulePreview);
  bindCheck('#optGray', 'gray', schedulePreview);
  bindCheck('#optBw', 'bw', schedulePreview);
  bindCheck('#optUp', 'up', renderHints);
  bindCheck('#optDeskew', 'deskew');
  $('#optContrast').addEventListener('input', function () { S.contrast = +this.value; saveS(); schedulePreview(); });
  $('#optBwLevel').addEventListener('input', function () { S.bwLevel = +this.value; saveS(); schedulePreview(); });
  $('#resetAdjust').addEventListener('click', function () {
    ['gray', 'levels', 'contrast', 'bw', 'bwLevel', 'up', 'deskew'].forEach(function (k) { S[k] = DEF[k]; });
    saveS(); syncAdjust(); schedulePreview();
  });
  function reRender() {
    if (!pages.some(function (p) { return p.result; })) return;
    if (textDirty && getText() && !confirm(t('confirm_rerender'))) return;
    renderResult(false);
  }
  bindCheck('#optJoin', 'join', reRender);
  bindCheck('#optMarks', 'marks', reRender);
  bindCheck('#optUnsure', 'unsure', function () { renderStats(); if (!S.unsure) show($('#wordCheck'), false); });
  bindCheck('#optKeep', 'keep', function () { if (S.keep) store.set('text', getText()); else store.remove('text'); });
  $('#docType').addEventListener('change', function () { S.doc = this.value; saveS(); });
  $('#runBtn').addEventListener('click', run);
  $('#stopBtn').addEventListener('click', stop);
  $('#retryBtn').addEventListener('click', function () { clearError(); run(); });

  var saveTimer = 0;
  resultEl.addEventListener('input', function () {
    textDirty = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(afterTextChange, 200);
  });
  resultEl.addEventListener('paste', function (e) {
    if (resultEl.contentEditable === 'plaintext-only') return;
    var tx = e.clipboardData && e.clipboardData.getData('text/plain');
    if (tx === undefined || tx === null) return;
    e.preventDefault();
    document.execCommand('insertText', false, tx);
  });
  resultEl.addEventListener('click', function (e) {
    var sp = e.target && e.target.closest ? e.target.closest('.lc') : null;
    if (sp && S.unsure) { if (curLc && curLc !== sp) curLc.classList.remove('cur'); curLc = sp; sp.classList.add('cur'); showWordCheck(sp); }
  });
  $('#nextUnsure').addEventListener('click', nextUnsure);
  $('#wcOk').addEventListener('click', wordOk);
  $('#wcClose').addEventListener('click', function () { show($('#wordCheck'), false); if (curLc) curLc.classList.remove('cur'); curLc = null; });

  $('#resetAll').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    stop();
    store.remove('settings'); store.remove('text');
    S = Object.assign({}, DEF);
    pages.forEach(function (p) { dropSource(p.id); });
    pages = []; cur = -1; pdfText = null; lastSuggest = null;
    resultEl.innerHTML = '';
    show($('#resultCard'), false);
    hideStage(); clearError();
    syncAdjust(); renderDocSelect(); renderLangs(); renderPdfNote(); renderPages(); renderPreview(); renderSuggest(); ui();
  });

  /* ------------------------------------------------------------------ language change + start */
  EDU.onLang(function () {
    renderLangs(); renderDocSelect(); renderPages(); renderPdfNote(); renderStorage(); renderError(); renderSuggest();
    if (pages[cur]) { renderPreview(); }
    if (lastStage) { stText.textContent = stageText(lastStage); }
    if (!$('#resultCard').hidden) {
      if (!textDirty && pages.some(function (p) { return p.result; })) renderResult(false);
      else renderStats();
    }
  });

  syncAdjust(); renderDocSelect(); renderLangs(); renderPages(); renderStorage(); ui();
  var keptText = S.keep ? store.get('text', '') : '';
  if (keptText && typeof keptText === 'string') {
    setPlainResult(keptText);
    show($('#restoredNote'), true);
  }
  refreshSaved();
  $('#app').setAttribute('data-ready', '1');
})();
