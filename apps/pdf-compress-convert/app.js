/* PDF Compress & JPG to PDF: the four PDF jobs people search for most, in one page.
   (a) Compress a PDF under a portal size limit (100 KB, 200 KB ...): pages are drawn with pdf.js at a
       sharpness d (dpi), saved as JPEG at quality q and rebuilt with pdf-lib. d and q are searched on a few
       sample pages, then the real file is built and measured (and rebuilt smaller if it is still too big).
       "Light" mode only re-saves the file (object streams, unused objects dropped), so text stays text.
   (b) Photos (JPG/PNG) to PDF: A4 / Letter / photo-sized pages, margins, 2 photos per page (ID-card
       front + back, optionally at real card size), "scan look" filters, optional size limit.
   (c) PDF pages to JPG/PNG at 72-300 dpi, one file each or one ZIP (JSZip, loaded only when needed).
   (d) Unlock your own PDF: pdf.js asks for the password here, then an unlocked copy is saved.
   Every file is read in the browser and never uploaded. */
(function () {
  'use strict';
  var SLUG = 'pdf-compress-convert';
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$;

  /* ------------------------------------------------------------------ constants */
  var CDN = 'https://cdn.jsdelivr.net/npm/';
  var PDFJS = CDN + 'pdfjs-dist@3.11.174/';
  var LIB = {
    pdfLib: CDN + 'pdf-lib@1.17.1/dist/pdf-lib.min.js',
    pdfjs: PDFJS + 'build/pdf.min.js',
    worker: PDFJS + 'build/pdf.worker.min.js',
    cmaps: PDFJS + 'cmaps/',
    fonts: PDFJS + 'standard_fonts/',
    jszip: CDN + 'jszip@3.10.1/dist/jszip.min.js'
  };
  var MAX_PX = 16777216;            /* biggest canvas iPhones allow (4096 x 4096) */
  var MAX_SIDE = 16384;
  var MAX_IMG_SIDE = 3600;          /* photos are never stored bigger than this (long side, pixels) */
  var MAX_IMAGES = 300;
  var TABS = ['compress', 'img', 'jpg', 'unlock'];
  var KEY_OF = { compress: 'c', img: 'i', jpg: 'j', unlock: 'u' };
  var PANEL_OF = { c: 'compress', i: 'img', j: 'jpg', u: 'unlock' };
  var HASH = { compress: 'compress', img: 'jpg-to-pdf', jpg: 'pdf-to-jpg', unlock: 'unlock' };
  /* 1 KB = 1000 bytes here: a file "under 200 KB" then passes a portal that counts either 1000 or 1024. */
  var TARGETS = [100, 200, 500, 1000, 2000];
  var LIMITS = [0, 100, 200, 500, 1000, 2000, 5000];
  var MM = 72 / 25.4;
  var PAGE = { a4: [595.28, 841.89], letter: [612, 792] };
  var MARGIN = { none: 0, small: 6 * MM, large: 15 * MM };
  var CARD = [85.6 * MM, 53.98 * MM];   /* ID-1 card size: Aadhaar PVC, PAN, voter ID, bank cards */
  /* quality ladder: a JPEG quality is used only if the page can stay at least this sharp (dpi) */
  /* (small text stays readable longer with more dpi and a lower quality than the other way round) */
  var QL = [0.8, 0.7, 0.6, 0.5, 0.42, 0.34, 0.25, 0.18, 0.12];
  var MIN_D = [150, 125, 105, 90, 75, 66, 60, 54, 40];
  var D_FLOOR = 40, Q_FLOOR = 0.1, LOW_D = 75;
  /* Sharpness in the size search is "A4 dpi": a page bigger than A4 gets the same number of pixels as an A4
     page would. Many phone "image to PDF" apps make 3024 x 4032 pt pages (42 x 56 inches): at a real 40 dpi
     such a page is still 1680 x 2240 px, so a fixed dpi floor could never reach 200 KB. */
  var A4_AREA = 595.28 * 841.89;
  function sizeK(wPt, hPt) { return Math.min(1, Math.sqrt(A4_AREA / Math.max(1, wPt * hPt))); }
  var CANCEL = new Error('cancelled'), PW_CANCEL = new Error('password-cancelled'), LOCKED = new Error('locked');

  /* ------------------------------------------------------------------ settings + state */
  var DEF = {
    tab: 'compress', cTarget: 200, cCustom: 300, cMode: 'strong', cGray: false,
    iSize: 'a4', iOrient: 'auto', iMargin: 'small', iPer: 1, iCard: false, iLook: 'original', iLimit: 0,
    jFmt: 'jpg', jDpi: 150, uDpi: 150
  };
  var S = Object.assign({}, DEF, store.get('settings', null) || {});
  function oneOf(v, list, d) { return list.indexOf(v) >= 0 ? v : d; }
  function fixSettings() {
    S.tab = oneOf(S.tab, TABS, DEF.tab);
    S.cTarget = oneOf(S.cTarget, TARGETS.concat([0]), DEF.cTarget);
    S.cCustom = EDU.clamp(parseInt(S.cCustom, 10) || DEF.cCustom, 10, 100000);
    S.cMode = oneOf(S.cMode, ['strong', 'light'], DEF.cMode);
    S.cGray = !!S.cGray;
    S.iSize = oneOf(S.iSize, ['a4', 'letter', 'fit'], DEF.iSize);
    S.iOrient = oneOf(S.iOrient, ['auto', 'portrait', 'landscape'], DEF.iOrient);
    S.iMargin = oneOf(S.iMargin, ['none', 'small', 'large'], DEF.iMargin);
    S.iPer = oneOf(S.iPer, [1, 2], DEF.iPer);
    S.iCard = !!S.iCard;
    S.iLook = oneOf(S.iLook, ['original', 'scan', 'gray', 'bw'], DEF.iLook);
    S.iLimit = oneOf(S.iLimit, LIMITS, DEF.iLimit);
    S.jFmt = oneOf(S.jFmt, ['jpg', 'png'], DEF.jFmt);
    S.jDpi = oneOf(S.jDpi, [72, 150, 300], DEF.jDpi);
    S.uDpi = oneOf(S.uDpi, [150, 200, 300], DEF.uDpi);
  }
  fixSettings();
  function save() { store.set('settings', S); }

  var C = { file: null, result: null, err: null };                 /* compress */
  var I = { items: [], result: null, err: null, name: '' };          /* photos -> PDF */
  var J = { file: null, pdf: null, sel: [], outs: [], err: null, gen: 0 };   /* PDF -> images */
  var U = { file: null, kind: '', result: null, err: null };         /* unlock */
  var jobs = { c: null, i: null, j: null, u: null };
  var prog = { c: null, i: null, j: null, u: null };
  var urls = { c: [], i: [], j: [], u: [] };
  var uid = 0;

  /* ------------------------------------------------------------------ small helpers */
  function makeCanvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function free(c) { if (c && c.width) { c.width = 0; c.height = 0; } }
  function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }
  function encode(c, type, q) {
    return new Promise(function (resolve, reject) {
      c.toBlob(function (b) { if (b) resolve(b); else reject(new Error('encode failed')); }, type || 'image/jpeg', q);
    });
  }
  function readBytes(blob) {
    if (blob.arrayBuffer) return blob.arrayBuffer().then(function (ab) { return new Uint8Array(ab); });
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(new Uint8Array(r.result)); };
      r.onerror = reject;
      r.readAsArrayBuffer(blob);
    });
  }
  function keepUrl(k, blob) { var u = URL.createObjectURL(blob); urls[k].push(u); return u; }
  function dropUrls(k) { urls[k].forEach(function (u) { try { URL.revokeObjectURL(u); } catch (e) { } }); urls[k] = []; }
  function pdfBlob(bytes) { return new Blob([bytes], { type: 'application/pdf' }); }
  function baseName(name) { return String(name || 'document').replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').trim().slice(0, 80) || 'document'; }
  function cleanName(s) { return String(s || '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80); }
  function pad(n, len) { n = String(n); while (n.length < len) n = '0' + n; return n; }
  function looksPdf(bytes) {
    var n = Math.min(bytes.length - 4, 1024);
    for (var i = 0; i < n; i++) if (bytes[i] === 0x25 && bytes[i + 1] === 0x50 && bytes[i + 2] === 0x44 && bytes[i + 3] === 0x46) return true;
    return false;
  }
  /* "200 KB" inside Urdu (right-to-left) text would show as "KB 200": keep such runs left-to-right */
  function ltr(s) { return document.documentElement.dir === 'rtl' ? '\u2066' + s + '\u2069' : s; }
  /* sizes use 1000-based units, the same units as the targets above. Always rounded DOWN at the shown
     precision, so a file of 199,950 bytes reads "199.9 KB" (not "200 KB") next to "under 200 KB". */
  function fmtSize(b) {
    if (b < 1000) return ltr(EDU.fmt(b) + ' B');
    var kb = Math.floor(b / 100) / 10;
    if (kb < 1000) return ltr(EDU.fmt(kb, { maximumFractionDigits: 1 }) + ' KB');
    var mb = b < 1e7 ? Math.floor(b / 1e4) / 100 : Math.floor(b / 1e5) / 10;
    return ltr(EDU.fmt(mb, { maximumFractionDigits: 2 }) + ' MB');
  }
  function kbLabel(kb) { return ltr(kb >= 1000 ? EDU.fmt(kb / 1000, { maximumFractionDigits: 2 }) + ' MB' : EDU.fmt(kb) + ' KB'); }
  function pagesText(n) { return n === 1 ? t('page_1') : t('pages_n', { n: EDU.fmt(n) }); }
  function iconBtn(txt, key, fn) { return el('button', { class: 'edu-iconbtn', type: 'button', 'aria-label': t(key), title: t(key), text: txt, onclick: fn }); }
  function sampleIdx(n) { return n <= 3 ? Array.from({ length: n }, function (_, i) { return i + 1; }) : [1, Math.ceil(n / 2), n]; }
  function checkJob(job) { if (job && job.cancelled) throw CANCEL; }
  function errKey(e, fallback) {
    if (e === CANCEL) return 'stopped';
    if (e === PW_CANCEL) return 'pw_needed';
    if (e === LOCKED) return 'c_light_locked';
    if (e && e.engine) return 'engine_failed';
    if (e && /memory|allocation|Invalid array length/i.test(String(e.message || e))) return 'too_big';
    return fallback || 'bad_pdf';
  }

  /* ------------------------------------------------------------------ PDF engine (CDN, loaded once) */
  var engineState = 'idle', enginePromise = null, pdfWorker = null;
  function loadScript(src, name) {
    return new Promise(function (resolve, reject) {
      if (window[name]) return resolve(window[name]);
      var s = document.createElement('script');
      s.src = src; s.async = true; s.crossOrigin = 'anonymous';
      var timer = setTimeout(function () { s.remove(); reject(new Error('timeout')); }, 60000);
      s.onload = function () { clearTimeout(timer); if (window[name]) resolve(window[name]); else reject(new Error('missing ' + name)); };
      s.onerror = function () { clearTimeout(timer); s.remove(); reject(new Error('load failed')); };
      document.head.appendChild(s);
    });
  }
  function setEngine(st) { engineState = st; renderEngine(); }
  function renderEngine() {
    var b = $('#engineBadge');
    b.className = 'badge pc-engine' + (engineState === 'ready' ? ' ready' : engineState === 'failed' ? ' danger' : '');
    b.textContent = '';
    if (engineState === 'loading' || engineState === 'idle') b.appendChild(el('span', { class: 'pc-spin', 'aria-hidden': 'true' }));
    else b.appendChild(el('span', { 'aria-hidden': 'true', text: engineState === 'ready' ? '✓' : '⚠' }));
    b.appendChild(el('span', { text: t(engineState === 'ready' ? 'engine_ready' : engineState === 'failed' ? 'engine_off' : 'engine_loading') }));
    $('#engineFail').hidden = engineState !== 'failed';
    $('#app').setAttribute('data-engine', engineState);
  }
  function engine() {
    if (enginePromise) return enginePromise;
    setEngine('loading');
    enginePromise = Promise.all([loadScript(LIB.pdfLib, 'PDFLib'), loadScript(LIB.pdfjs, 'pdfjsLib')]).then(function () {
      /* pdf.js parses PDFs in a Web Worker. A page can't start a worker straight from another origin (the
         CDN), so pdf.js wraps this URL in a same-origin Blob (importScripts) itself; that also works from a
         downloaded ZIP (file://). If workers are blocked it falls back to the main thread. */
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = LIB.worker;
      setEngine('ready');
    }, function (e) {
      enginePromise = null;
      setEngine('failed');
      var err = new Error('engine: ' + (e && e.message)); err.engine = true;
      throw err;
    });
    return enginePromise;
  }
  function getWorker() {
    if (!pdfWorker || pdfWorker.destroyed) pdfWorker = new window.pdfjsLib.PDFWorker();
    return pdfWorker;
  }

  /* Opens a PDF with pdf.js. A locked file asks for its password here (never sent anywhere). */
  function openPdf(bytes, name, password) {
    return engine().then(function () {
      return new Promise(function (resolve, reject) {
        var lib = window.pdfjsLib, used = password || null, asked = false, over = false;
        var task = lib.getDocument({
          data: bytes.slice(),            /* pdf.js moves the buffer into its worker: give it a copy */
          password: password || undefined, worker: getWorker(),
          isEvalSupported: false,         /* never compile code from a PDF's fonts */
          cMapUrl: LIB.cmaps, cMapPacked: true, standardFontDataUrl: LIB.fonts
        });
        task.onPassword = function (update, reason) {
          asked = true;
          askPassword(name, reason === lib.PasswordResponses.INCORRECT_PASSWORD).then(function (pw) {
            if (pw === null) { over = true; task.destroy(); reject(PW_CANCEL); return; }
            used = pw; update(pw);
          });
        };
        task.promise.then(function (pdf) { if (!over) { over = true; resolve({ pdf: pdf, password: used, asked: asked }); } },
          function (e) { if (!over) { over = true; reject(e); } });
      });
    });
  }

  function askPassword(name, wrong) {
    return new Promise(function (resolve) {
      var done = false;
      var input = el('input', { type: 'password', id: 'pwInput', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-describedby': 'pwErr' });
      var show = el('input', { type: 'checkbox', id: 'pwShow' });
      var form = el('form', { class: 'stack pc-pw', id: 'pwForm' },
        el('p', { class: 'pc-fname no-i18n mb0', dir: 'auto', text: name }),
        el('p', { class: 'mb0', text: t('pw_body') }),
        el('label', { class: 'field' }, el('span', { text: t('pw_label') }), input),
        el('label', { class: 'check' }, show, el('span', { text: t('pw_show') })),
        el('p', { class: 'small bad mb0', id: 'pwErr', role: 'alert', text: wrong ? t('pw_wrong') : '' }),
        el('p', { class: 'callout small mb0', text: t('pw_hint') }),
        el('p', { class: 'small muted mb0', text: '🔒 ' + t('pw_own') }),
        el('div', { class: 'row' },
          el('button', { class: 'btn btn-primary', type: 'submit', id: 'pwOk', text: t('pw_unlock') }),
          el('button', { class: 'btn', type: 'button', text: t('cancel'), onclick: function () { close(); } })));
      show.addEventListener('change', function () { input.type = show.checked ? 'text' : 'password'; input.focus(); });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!input.value) { input.focus(); return; }
        done = true;
        var v = input.value;
        close();
        resolve(v);
      });
      var close = EDU.modal(form, { title: '🔒 ' + t('pw_title'), onClose: function () { if (!done) { done = true; resolve(null); } } });
      setTimeout(function () { input.focus(); }, 30);
    });
  }

  /* Draws one page on a white canvas. opt: { dpi }, { a4dpi } (see sizeK) or { width } (pixels). Capped for
     phones. Returns the real dpi and k (real dpi = A4 dpi x k). */
  async function renderPage(pdf, n, opt) {
    var page = await pdf.getPage(n);
    try {
      var v1 = page.getViewport({ scale: 1 }), k = sizeK(v1.width, v1.height);
      var s = opt.width ? opt.width / v1.width : (opt.a4dpi ? opt.a4dpi * k : opt.dpi) / 72;
      var area = v1.width * v1.height * s * s;
      if (area > MAX_PX) s *= Math.sqrt(MAX_PX / area);
      s = Math.min(s, MAX_SIDE / v1.width, MAX_SIDE / v1.height);
      var vp = page.getViewport({ scale: s });
      var c = makeCanvas(Math.max(1, Math.floor(vp.width)), Math.max(1, Math.floor(vp.height)));
      var ctx = c.getContext('2d', { alpha: false });
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      /* AnnotationMode.ENABLE draws filled form fields and stamps too, so the copy looks like the screen */
      await page.render({ canvasContext: ctx, viewport: vp, annotationMode: window.pdfjsLib.AnnotationMode.ENABLE }).promise;
      return { canvas: c, wPt: v1.width, hPt: v1.height, dpi: s * 72, k: k };
    } finally { page.cleanup(); }
  }

  /* Reads a picked File (or {name, bytes}) as a PDF: page count, password, page-1 preview. */
  async function preparePdf(src, keepOpen) {
    var bytes = src.u8 instanceof Uint8Array ? src.u8 : await readBytes(src);
    if (!looksPdf(bytes)) { var e = new Error('not a pdf'); e.notPdf = true; throw e; }
    var file = { name: src.name || 'document.pdf', size: bytes.length, bytes: bytes, pages: 0, password: null, locked: false, encrypted: false, thumbUrl: '' };
    var o = await openPdf(bytes, file.name);
    file.password = o.password; file.locked = o.asked; file.pages = o.pdf.numPages;
    try { var meta = await o.pdf.getMetadata(); file.encrypted = !!(meta && meta.info && meta.info.EncryptFilterName); } catch (x) { }
    try {
      var r = await renderPage(o.pdf, 1, { width: 360 });
      file.thumbUrl = r.canvas.toDataURL('image/jpeg', 0.85);
      free(r.canvas);
    } catch (x) { }
    if (keepOpen) file.pdf = o.pdf; else o.pdf.destroy();
    return file;
  }

  /* ------------------------------------------------------------------ pixels */
  function grayInPlace(c) {
    var ctx = c.getContext('2d'), d = ctx.getImageData(0, 0, c.width, c.height), p = d.data;
    for (var i = 0; i < p.length; i += 4) { var y = (p[i] * 77 + p[i + 1] * 150 + p[i + 2] * 29) >> 8; p[i] = p[i + 1] = p[i + 2] = y; }
    ctx.putImageData(d, 0, 0);
  }
  function scaledCopy(src, f) {
    f = Math.min(1, f);
    var w = Math.max(1, Math.round(src.width * f)), h = Math.max(1, Math.round(src.height * f));
    var c = makeCanvas(w, h), ctx = c.getContext('2d', { alpha: false });
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, 0, 0, w, h);
    return c;
  }
  /* Paper brightness around every pixel (a phone photo of a page is darker at the edges and in shadows):
     shrink the page to ~48 px, take the brightest nearby value (text is darker than paper), blur it. */
  function paperMap(lum, W, H) {
    var k = 48 / Math.max(W, H), w = Math.max(2, Math.round(W * k)), h = Math.max(2, Math.round(H * k));
    var small = new Float32Array(w * h), cnt = new Float32Array(w * h), x, y, i;
    for (y = 0; y < H; y += 2) {
      var sy = Math.min(h - 1, Math.floor(y * h / H));
      for (x = 0; x < W; x += 2) { i = sy * w + Math.min(w - 1, Math.floor(x * w / W)); small[i] += lum[y * W + x]; cnt[i]++; }
    }
    for (i = 0; i < small.length; i++) small[i] = cnt[i] ? small[i] / cnt[i] : 255;
    function pass(src, op) {
      var out = new Float32Array(w * h);
      for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < w; xx++) {
        var m = op === 'max' ? 0 : 0, n = 0;
        for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) {
          var X = xx + dx, Y = yy + dy;
          if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
          var v = src[Y * w + X];
          if (op === 'max') { if (v > m) m = v; } else { m += v; n++; }
        }
        out[yy * w + xx] = op === 'max' ? m : m / n;
      }
      return out;
    }
    var bg = pass(pass(small, 'max'), 'avg');
    return { w: w, h: h, v: bg };
  }
  function sampleMap(map, x, y, W, H) {
    var fx = (x + 0.5) * map.w / W - 0.5, fy = (y + 0.5) * map.h / H - 0.5;
    var x0 = Math.max(0, Math.min(map.w - 1, Math.floor(fx))), y0 = Math.max(0, Math.min(map.h - 1, Math.floor(fy)));
    var x1 = Math.min(map.w - 1, x0 + 1), y1 = Math.min(map.h - 1, y0 + 1);
    var ax = EDU.clamp(fx - x0, 0, 1), ay = EDU.clamp(fy - y0, 0, 1), v = map.v, w = map.w;
    return (v[y0 * w + x0] * (1 - ax) + v[y0 * w + x1] * ax) * (1 - ay) + (v[y1 * w + x0] * (1 - ax) + v[y1 * w + x1] * ax) * ay;
  }
  /* look: original | gray | scan (white paper, crisp colour) | bw (black text on white) */
  function applyLook(c, look) {
    if (!look || look === 'original' || !c.width) return;
    var W = c.width, H = c.height, ctx = c.getContext('2d'), d = ctx.getImageData(0, 0, W, H), p = d.data, n = W * H, i, x, y;
    if (look === 'gray') {
      for (i = 0; i < p.length; i += 4) { var g = (p[i] * 77 + p[i + 1] * 150 + p[i + 2] * 29) >> 8; p[i] = p[i + 1] = p[i + 2] = g; }
      ctx.putImageData(d, 0, 0);
      return;
    }
    var lum = new Float32Array(n);
    for (i = 0; i < n; i++) lum[i] = p[i * 4] * 0.299 + p[i * 4 + 1] * 0.587 + p[i * 4 + 2] * 0.114;
    var map = paperMap(lum, W, H);
    var gain = new Float32Array(n);
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) gain[y * W + x] = 255 / Math.max(48, sampleMap(map, x, y, W, H));
    if (look === 'scan') {
      /* divide by the paper brightness, then stretch: shadows go, paper turns white, ink gets darker */
      var LUT = new Uint8ClampedArray(512);
      for (i = 0; i < 512; i++) { var v = Math.min(1, i / 255); v = (v - 0.12) / (0.92 - 0.12); v = v < 0 ? 0 : v > 1 ? 1 : v; LUT[i] = Math.round(255 * Math.pow(v, 1.25)); }
      for (i = 0; i < n; i++) {
        var k = gain[i], j = i * 4;
        p[j] = LUT[Math.min(511, p[j] * k | 0)]; p[j + 1] = LUT[Math.min(511, p[j + 1] * k | 0)]; p[j + 2] = LUT[Math.min(511, p[j + 2] * k | 0)];
      }
    } else {
      /* black & white: even out the light, then Otsu's threshold on the result */
      var hist = new Float64Array(256), norm = new Uint8ClampedArray(n);
      for (i = 0; i < n; i++) { norm[i] = Math.min(255, lum[i] * gain[i]); hist[norm[i]]++; }
      var sum = 0; for (i = 0; i < 256; i++) sum += i * hist[i];
      var sumB = 0, wB = 0, best = 0, th = 180;
      for (i = 0; i < 256; i++) {
        wB += hist[i]; if (!wB) continue;
        var wF = n - wB; if (!wF) break;
        sumB += i * hist[i];
        var mB = sumB / wB, mF = (sum - sumB) / wF, between = wB * wF * (mB - mF) * (mB - mF);
        if (between > best) { best = between; th = i; }
      }
      th = EDU.clamp(th, 120, 215);
      for (i = 0; i < n; i++) { var o = norm[i] < th ? 0 : 255, q4 = i * 4; p[q4] = p[q4 + 1] = p[q4 + 2] = o; }
    }
    ctx.putImageData(d, 0, 0);
  }

  /* ------------------------------------------------------------------ size search (shared) */
  /* samples: [{canvas, dpi, k}] drawn at the highest sharpness (dpi = real dpi of the canvas, k = real dpi
     per A4 dpi); count: pages/photos in the whole file. d is in A4 dpi.
     Returns the best {d, q} whose estimated total stays inside budget. */
  async function searchSettings(samples, count, budget, dMax, job) {
    var cache = {};
    async function est(d, q) {
      var key = d.toFixed(1) + ':' + q;
      if (cache[key] !== undefined) return cache[key];
      var total = 0;
      for (var i = 0; i < samples.length; i++) {
        checkJob(job);
        var s = samples[i], c = scaledCopy(s.canvas, d * (s.k || 1) / s.dpi);
        var b = await encode(c, 'image/jpeg', q);
        total += b.size; free(c);
      }
      return (cache[key] = total / samples.length * count);
    }
    for (var i = 0; i < QL.length; i++) {
      var q = QL[i];
      if (await est(dMax, q) <= budget) return { d: dMax, q: q };
      var lo = Math.min(MIN_D[i], dMax);
      if (await est(lo, q) > budget) continue;
      var hi = dMax;
      for (var k = 0; k < 6; k++) {
        var mid = Math.sqrt(lo * hi);
        if (await est(mid, q) <= budget) lo = mid; else hi = mid;
      }
      return { d: lo, q: q };
    }
    return { d: D_FLOOR, q: QL[QL.length - 1], hard: true };
  }
  /* Builds, measures and (if still too big) rebuilds smaller, up to 4 times. */
  async function fitLoop(build, target, d, q) {
    var out;
    for (var pass = 1; pass <= 4; pass++) {
      out = await build(d, q, pass);
      if (!target || out.bytes.length < target) return out;
      /* a page can come out less sharp than asked (canvas size cap): shrink from what was really used,
         otherwise the next try would draw the same pixels again */
      if (out.dUsed && out.dUsed < d) d = Math.max(D_FLOOR, out.dUsed);
      if (d <= D_FLOOR + 0.5 && q <= Q_FLOOR + 0.001) break;
      var nd = d * Math.sqrt(target * 0.92 / out.bytes.length);
      if (nd < D_FLOOR) { nd = D_FLOOR; q = Math.max(Q_FLOOR, Math.round((q - 0.08) * 100) / 100); }
      d = nd;
    }
    out.over = true;
    return out;
  }
  function stamp(doc) {
    try { doc.setProducer('AI Pathshala PDF tools (apnipathshala.ai)'); doc.setCreator('AI Pathshala PDF tools'); } catch (e) { }
  }

  /* ------------------------------------------------------------------ (a) compress */
  /* d is in A4 dpi (see sizeK). Reports the sharpness really used: dUsed (highest A4 dpi, for the next try),
     dA4 (lowest A4 dpi, for the low-sharpness warning) and dReal (lowest real dpi, shown to the user). */
  async function rasterPdf(pdf, d, q, gray, job, pass) {
    var doc = await window.PDFLib.PDFDocument.create(), N = pdf.numPages, first = null, dUsed = 0, dA4 = Infinity, dReal = Infinity;
    for (var n = 1; n <= N; n++) {
      checkJob(job);
      setProg(job, 0.15 + 0.8 * (n - 1) / N, pass > 1 ? 'busy_try' : 'busy_page', { n: EDU.fmt(pass), p: EDU.fmt(n), total: EDU.fmt(N) });
      var r = await renderPage(pdf, n, { a4dpi: d });
      dUsed = Math.max(dUsed, r.dpi / r.k); dA4 = Math.min(dA4, r.dpi / r.k); dReal = Math.min(dReal, r.dpi);
      if (gray) grayInPlace(r.canvas);
      var blob = await encode(r.canvas, 'image/jpeg', q);
      free(r.canvas);
      if (n === 1) first = blob;
      var img = await doc.embedJpg(await readBytes(blob));
      doc.addPage([r.wPt, r.hPt]).drawImage(img, { x: 0, y: 0, width: r.wPt, height: r.hPt });
    }
    checkJob(job);
    setProg(job, 0.97, 'busy_save');
    stamp(doc);
    var bytes = await doc.save({ useObjectStreams: true });
    return { bytes: bytes, first: first, pages: N, d: d, q: q, dUsed: dUsed, dA4: dA4, dReal: dReal };
  }

  async function compressStrong(file, target, gray, job) {
    var o = await openPdf(file.bytes, file.name, file.password);
    var pdf = o.pdf;
    try {
      var N = pdf.numPages, dMax = 200;
      var budget = Math.max(target * 0.95 - (1500 + 420 * N), N * 500);
      var idx = sampleIdx(N), samples = [];
      setProg(job, 0.02, 'busy_search');
      try {
        for (var i = 0; i < idx.length; i++) {
          checkJob(job);
          var r = await renderPage(pdf, idx[i], { a4dpi: dMax });
          if (gray) grayInPlace(r.canvas);
          samples.push(r);
          setProg(job, 0.03 + 0.1 * (i + 1) / idx.length, 'busy_search');
        }
        var pick = await searchSettings(samples, N, budget, dMax, job);
      } finally { samples.forEach(function (s) { free(s.canvas); }); }
      var out = await fitLoop(function (d, q, pass) { return rasterPdf(pdf, d, q, gray, job, pass); }, target, pick.d, pick.q);
      /* page 1 "before" at normal screen sharpness, so the side-by-side shows what was lost */
      var r1 = await renderPage(pdf, 1, { a4dpi: Math.min(200, Math.max(out.dUsed || out.d, 150)) });
      out.before = await encode(r1.canvas, 'image/jpeg', 0.92);
      free(r1.canvas);
      return out;
    } finally { pdf.destroy(); }
  }

  async function compressLight(file) {
    await engine();
    var L = window.PDFLib, src;
    try { src = await L.PDFDocument.load(file.bytes, { updateMetadata: false }); }
    catch (e) { if (/encrypt/i.test(String(e && (e.name + ' ' + e.message)))) throw LOCKED; throw e; }
    var best = await src.save({ useObjectStreams: true });
    try {
      /* copying the pages into a fresh file drops objects nothing uses any more (old edits, unused fonts) */
      var fresh = await L.PDFDocument.create();
      var pages = await fresh.copyPages(src, src.getPageIndices());
      pages.forEach(function (p) { fresh.addPage(p); });
      var alt = await fresh.save({ useObjectStreams: true });
      if (alt.length < best.length * 0.9) best = alt;
    } catch (e) { }
    return { bytes: best, pages: src.getPageCount() };
  }

  function targetKb() { return S.cTarget || S.cCustom; }
  /* small page-1 picture of a re-saved (text kept) PDF */
  async function afterPreview(R, name) {
    try {
      var o = await openPdf(R.bytes, name);
      try {
        var r = await renderPage(o.pdf, 1, { width: 360 });
        R.afterUrl = r.canvas.toDataURL('image/jpeg', 0.85);
        free(r.canvas);
      } finally { o.pdf.destroy(); }
    } catch (e) { }
  }

  async function runCompress() {
    if (jobs.c || C.err === 'reading') return;
    if (!C.file) { $('#cFile').click(); return; }
    if (S.cTarget === 0) commitCustom();
    var kb = targetKb(), target = kb * 1000;
    C.err = null;
    dropUrls('c');
    C.result = null;
    if (C.file.size < target) { C.result = { kind: 'under', kb: kb }; renderCompress(); return; }
    var job = startJob('c');
    try {
      var file = C.file, R;
      if (S.cMode === 'light') {
        setProg(job, 0.3, 'busy_light');
        await tick();
        var lo = await compressLight(file);
        checkJob(job);
        R = { mode: 'light', bytes: lo.bytes, size: lo.bytes.length, pages: lo.pages, kb: kb };
        if (R.size >= file.size) R.kind = 'light_none';
        else R.kind = R.size < target ? 'light_ok' : 'light_over';
        if (R.kind !== 'light_none') await afterPreview(R, file.name);
      } else {
        /* First a lossless re-save: if that alone fits, the text stays text and nothing turns into pictures. */
        setProg(job, 0.01, 'busy_light');
        var quick = null;
        try { quick = await compressLight(file); } catch (e) { if (e && e.engine) throw e; }
        checkJob(job);
        if (quick && quick.bytes.length < target && quick.bytes.length < file.size) {
          R = { mode: 'light', auto: true, bytes: quick.bytes, size: quick.bytes.length, pages: quick.pages, kb: kb, kind: 'light_ok' };
          await afterPreview(R, file.name);
          R.url = keepUrl('c', pdfBlob(R.bytes));
          C.result = R;
          return;
        }
        var out = await compressStrong(file, target, S.cGray, job);
        R = { mode: 'strong', bytes: out.bytes, size: out.bytes.length, pages: out.pages, d: out.dReal, dA4: out.dA4, q: out.q, kb: kb, gray: S.cGray };
        if (R.size >= file.size) R.kind = 'bigger';
        else R.kind = R.size < target ? 'ok' : 'over';
        if (R.kind !== 'ok' && quick && quick.bytes.length < file.size && quick.bytes.length <= R.size) {
          /* the target can't be reached, and the lossless copy is smaller than the picture copy: give that
             one (smaller, and the text stays sharp and selectable) */
          R = { mode: 'light', bytes: quick.bytes, size: quick.bytes.length, pages: quick.pages, kb: kb, kind: 'over' };
          await afterPreview(R, file.name);
        } else {
          R.afterUrl = keepUrl('c', out.first);
          R.beforeUrl = keepUrl('c', out.before);
        }
      }
      if (R.kind !== 'bigger' && R.kind !== 'light_none') R.url = keepUrl('c', pdfBlob(R.bytes));
      C.result = R;
    } catch (e) {
      if (e !== CANCEL) console.warn('[pdf-compress] ', e);
      C.err = errKey(e);
    } finally { endJob(job); }
  }

  /* ------------------------------------------------------------------ (b) photos -> PDF */
  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        if (!img.naturalWidth || !img.naturalHeight) { URL.revokeObjectURL(url); reject(new Error('empty image')); return; }
        resolve({ img: img, url: url, w: img.naturalWidth, h: img.naturalHeight });
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('decode')); };
      img.src = url;   /* browsers apply the photo's EXIF rotation here */
    });
  }
  function effDims(item) { return item.rot % 180 ? { w: item.h, h: item.w } : { w: item.w, h: item.h }; }

  async function addImages(files) {
    if (jobs.i) return;
    var list = Array.prototype.filter.call(files || [], function (f) { return f && (/^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|bmp|jfif|heic|heif|avif)$/i.test(f.name || '')); });
    if (!list.length) { if (files && files.length) EDU.toast(t('i_not_img')); return; }
    var room = MAX_IMAGES - I.items.length;
    if (list.length > room) { EDU.toast(t('i_too_many', { n: EDU.fmt(MAX_IMAGES) })); list = list.slice(0, Math.max(0, room)); }
    I.result = null; I.err = null; dropUrls('i');
    var bad = [];
    for (var i = 0; i < list.length; i++) {
      var f = list[i];
      try {
        var L = await loadImage(f);
        var k = Math.min(1, 168 / Math.max(L.w, L.h));
        var th = makeCanvas(Math.max(1, Math.round(L.w * k)), Math.max(1, Math.round(L.h * k)));
        var ctx = th.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, th.width, th.height);
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(L.img, 0, 0, th.width, th.height);
        URL.revokeObjectURL(L.url);
        var item = { id: 'im' + (++uid), name: f.name || ('photo-' + (I.items.length + 1) + '.jpg'), file: f, w: L.w, h: L.h, rot: 0, thumb: th, view: null };
        makeView(item);
        I.items.push(item);
      } catch (e) { bad.push(f.name || '?'); }
    }
    if (bad.length) EDU.toast(t('i_bad_img', { name: bad.slice(0, 3).join(', ') }), 5000);
    if (!I.name && I.items.length) I.name = baseName(I.items[0].name);
    renderImgs();
  }
  /* the small preview: rotated and with the chosen look */
  function makeView(item) {
    var th = item.thumb, swap = item.rot % 180 !== 0;
    var v = makeCanvas(swap ? th.height : th.width, swap ? th.width : th.height), ctx = v.getContext('2d');
    ctx.translate(v.width / 2, v.height / 2);
    ctx.rotate(item.rot * Math.PI / 180);
    ctx.drawImage(th, -th.width / 2, -th.height / 2);
    applyLook(v, S.iLook);
    v.setAttribute('aria-hidden', 'true');
    item.view = v;
  }
  /* full-size picture for the PDF: rotated, never bigger than maxSide (or the photo itself), with the look */
  async function itemCanvas(item, maxSide, look) {
    var L = await loadImage(item.file);
    try {
      var w = L.w, h = L.h;
      var f = Math.min(1, maxSide / Math.max(w, h), Math.sqrt(MAX_PX / (w * h)));
      var sw = Math.max(1, Math.round(w * f)), sh = Math.max(1, Math.round(h * f));
      var swap = item.rot % 180 !== 0;
      var c = makeCanvas(swap ? sh : sw, swap ? sw : sh), ctx = c.getContext('2d', { alpha: false });
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.translate(c.width / 2, c.height / 2);
      ctx.rotate(item.rot * Math.PI / 180);
      ctx.drawImage(L.img, -sw / 2, -sh / 2, sw, sh);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      applyLook(c, look);
      return c;
    } finally { URL.revokeObjectURL(L.url); }
  }

  /* Page layout in PDF points (y measured from the top). Every slot keeps the photo's shape. */
  function fitBox(d, box, card) {
    var bw = box.w, bh = box.h;
    if (card) { var cw = CARD[0], ch = CARD[1]; if (d.h > d.w) { cw = CARD[1]; ch = CARD[0]; } bw = Math.min(bw, cw); bh = Math.min(bh, ch); }
    var s = Math.min(bw / d.w, bh / d.h), w = d.w * s, h = d.h * s;
    return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w: w, h: h };
  }
  function layoutPages(items) {
    var pages = [], m = MARGIN[S.iMargin], size = S.iSize;
    if (S.iPer === 2) {
      if (size === 'fit') size = 'a4';
      var gap = Math.max(m, 5 * MM), base = PAGE[size];
      for (var i = 0; i < items.length; i += 2) {
        var pair = items.slice(i, i + 2);
        var build = function (land) {
          var pw = land ? base[1] : base[0], ph = land ? base[0] : base[1], slots = [];
          var cw = pw - 2 * m, ch = ph - 2 * m;
          pair.forEach(function (it, j) {
            var box = land ? { x: m + j * (cw + gap) / 2, y: m, w: (cw - gap) / 2, h: ch } : { x: m, y: m + j * (ch + gap) / 2, w: cw, h: (ch - gap) / 2 };
            var s = fitBox(effDims(it), box, S.iCard);
            s.item = it; slots.push(s);
          });
          return { w: pw, h: ph, slots: slots };
        };
        var page, prev = pages[pages.length - 1];
        if (S.iOrient === 'portrait') page = build(false);
        else if (S.iOrient === 'landscape') page = build(true);
        else if (pair.length === 1 && prev) page = build(prev.w > prev.h);   /* a lone last photo keeps the pages alike */
        else {
          var a = build(false), b = build(true);
          var area = function (p) { return p.slots.reduce(function (s, x) { return s + x.w * x.h; }, 0); };
          page = area(b) > area(a) * 1.05 ? b : a;
        }
        pages.push(page);
      }
      return pages;
    }
    items.forEach(function (it) {
      var d = effDims(it), pw, ph;
      if (size === 'fit') {
        /* page has the photo's shape; its long side matches A4's long side (prints nicely) */
        var k = (PAGE.a4[1] - 2 * m) / Math.max(d.w, d.h);
        var iw = d.w * k, ih = d.h * k;
        pages.push({ w: iw + 2 * m, h: ih + 2 * m, slots: [{ x: m, y: m, w: iw, h: ih, item: it }] });
        return;
      }
      var base = PAGE[size], land = S.iOrient === 'landscape' || (S.iOrient === 'auto' && d.w > d.h);
      pw = land ? base[1] : base[0]; ph = land ? base[0] : base[1];
      var s = fitBox(d, { x: m, y: m, w: pw - 2 * m, h: ph - 2 * m }, false);
      s.item = it;
      pages.push({ w: pw, h: ph, slots: [s] });
    });
    return pages;
  }

  async function buildImagesPdf(pages, d, q, look, job, pass) {
    var doc = await window.PDFLib.PDFDocument.create(), total = 0, k = 0, dUsed = 0;
    pages.forEach(function (p) { total += p.slots.length; });
    for (var i = 0; i < pages.length; i++) {
      var p = pages[i], pg = doc.addPage([p.w, p.h]);
      for (var j = 0; j < p.slots.length; j++) {
        checkJob(job);
        var sl = p.slots[j];
        setProg(job, 0.15 + 0.8 * k / total, pass > 1 ? 'busy_try_img' : 'busy_img', { n: EDU.fmt(pass), p: EDU.fmt(k + 1), total: EDU.fmt(total) });
        var c = await itemCanvas(sl.item, Math.min(MAX_IMG_SIDE, Math.max(sl.w, sl.h) * d / 72), look);
        dUsed = Math.max(dUsed, Math.max(c.width, c.height) / Math.max(sl.w, sl.h) * 72);   /* small photos are never enlarged */
        var blob = await encode(c, 'image/jpeg', q);
        free(c);
        var img = await doc.embedJpg(await readBytes(blob));
        pg.drawImage(img, { x: sl.x, y: p.h - sl.y - sl.h, width: sl.w, height: sl.h });
        k++;
      }
    }
    checkJob(job);
    setProg(job, 0.97, 'busy_save');
    stamp(doc);
    return { bytes: await doc.save({ useObjectStreams: true }), pages: pages.length, d: d, q: q, dUsed: dUsed };
  }

  async function runImages() {
    if (jobs.i) return;
    if (!I.items.length) { $('#iFile').click(); return; }
    I.result = null; I.err = null; dropUrls('i');
    var job = startJob('i');
    try {
      await engine();
      var pages = layoutPages(I.items), look = S.iLook, slots = [];
      pages.forEach(function (p) { p.slots.forEach(function (s) { slots.push(s); }); });
      var target = S.iLimit * 1000, d = 250, q = 0.85;
      if (target) {
        setProg(job, 0.02, 'busy_search');
        var idx = sampleIdx(slots.length), samples = [];
        try {
          for (var i = 0; i < idx.length; i++) {
            checkJob(job);
            var sl = slots[idx[i] - 1];
            var c = await itemCanvas(sl.item, Math.min(MAX_IMG_SIDE, Math.max(sl.w, sl.h) * 250 / 72), look);
            samples.push({ canvas: c, dpi: Math.max(c.width, c.height) / Math.max(sl.w, sl.h) * 72 });
            setProg(job, 0.03 + 0.1 * (i + 1) / idx.length, 'busy_search');
          }
          var budget = Math.max(target * 0.95 - (1500 + 500 * slots.length), slots.length * 500);
          var pick = await searchSettings(samples, slots.length, budget, 250, job);
          d = pick.d; q = pick.q;
        } finally { samples.forEach(function (s) { free(s.canvas); }); }
      }
      var out = await fitLoop(function (dd, qq, pass) { return buildImagesPdf(pages, dd, qq, look, job, pass); }, target, d, q);
      I.result = { bytes: out.bytes, size: out.bytes.length, pages: out.pages, over: !!out.over, kb: S.iLimit, url: keepUrl('i', pdfBlob(out.bytes)), name: (cleanName(I.name) || 'photos') + '.pdf' };
    } catch (e) {
      if (e !== CANCEL) console.warn('[pdf-compress] ', e);
      I.err = errKey(e, 'i_failed');
    } finally { endJob(job); }
  }

  /* ------------------------------------------------------------------ (c) PDF -> images */
  /* digits typed on an Indian-language or Urdu keyboard (१-३, ۱-۳, ௧) count as 1-3 */
  var DIGIT0 = [0x660, 0x6F0, 0x966, 0x9E6, 0xA66, 0xAE6, 0xB66, 0xBE6, 0xC66, 0xCE6, 0xD66];
  function latinDigits(s) {
    return String(s).replace(/[٠-٩۰-۹०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯]/g, function (ch) {
      var c = ch.charCodeAt(0);
      for (var i = 0; i < DIGIT0.length; i++) if (c >= DIGIT0[i] && c <= DIGIT0[i] + 9) return String(c - DIGIT0[i]);
      return ch;
    });
  }
  function parseRange(text, N) {
    var s = latinDigits(text || '').replace(/[–—−]/g, '-').replace(/\s*-\s*/g, '-').trim();
    if (!s) return null;
    var sel = [], parts = s.split(/[,;\s\u060C]+/).filter(Boolean), i;   /* u060C = Urdu comma */
    for (i = 0; i < N; i++) sel.push(false);
    for (i = 0; i < parts.length; i++) {
      var m = /^(\d*)-(\d*)$/.exec(parts[i]), a, b;
      if (m) { a = m[1] ? +m[1] : 1; b = m[2] ? +m[2] : N; }
      else if (/^\d+$/.test(parts[i])) { a = b = +parts[i]; }
      else return null;
      if (a < 1 || b > N || a > b) return null;
      for (var k = a; k <= b; k++) sel[k - 1] = true;
    }
    return sel;
  }
  function rangeText(sel) {
    var out = [], i = 0, n = sel.length;
    while (i < n) {
      if (!sel[i]) { i++; continue; }
      var j = i; while (j + 1 < n && sel[j + 1]) j++;
      out.push(i === j ? String(i + 1) : (i + 1) + '-' + (j + 1));
      i = j + 1;
    }
    return out.join(', ');
  }

  /* The dpi chosen (72/150/300) is also written into each image file (JPEG JFIF density, PNG pHYs), so a
     300 dpi page prints at its real paper size instead of the 72/96 dpi that programs assume otherwise. */
  var CRC_T = null;
  function crc32(u8, a, b) {
    if (!CRC_T) {
      CRC_T = new Int32Array(256);
      for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC_T[n] = c; }
    }
    var crc = -1;
    for (var i = a; i < b; i++) crc = CRC_T[(crc ^ u8[i]) & 255] ^ (crc >>> 8);
    return (crc ^ -1) >>> 0;
  }
  async function withDpi(blob, dpi) {
    dpi = Math.max(1, Math.min(65535, Math.round(dpi)));
    try {
      var u8 = await readBytes(blob);
      /* JPEG: the JFIF header right after the start marker has units + x/y density */
      if (u8[0] === 0xFF && u8[1] === 0xD8 && u8[2] === 0xFF && u8[3] === 0xE0 && String.fromCharCode(u8[6], u8[7], u8[8], u8[9]) === 'JFIF' && u8[10] === 0) {
        u8[13] = 1; u8[14] = dpi >> 8; u8[15] = dpi & 255; u8[16] = dpi >> 8; u8[17] = dpi & 255;
        return new Blob([u8], { type: blob.type });
      }
      /* PNG: add a pHYs chunk (pixels per metre) right after IHDR, unless there is one */
      if (u8[0] === 0x89 && String.fromCharCode(u8[12], u8[13], u8[14], u8[15]) === 'IHDR') {
        for (var at = 8; at + 8 <= u8.length;) {
          var len = ((u8[at] << 24) | (u8[at + 1] << 16) | (u8[at + 2] << 8) | u8[at + 3]) >>> 0, type = String.fromCharCode(u8[at + 4], u8[at + 5], u8[at + 6], u8[at + 7]);
          if (type === 'pHYs') return blob;
          if (type === 'IDAT' || type === 'IEND') break;
          at += 12 + len;
        }
        var ppm = Math.round(dpi / 0.0254), ch = new Uint8Array(21), dv = new DataView(ch.buffer);
        dv.setUint32(0, 9); ch.set([0x70, 0x48, 0x59, 0x73], 4); dv.setUint32(8, ppm); dv.setUint32(12, ppm); ch[16] = 1;
        dv.setUint32(17, crc32(ch, 4, 17));
        return new Blob([u8.subarray(0, 33), ch, u8.subarray(33)], { type: blob.type });
      }
    } catch (e) { }
    return blob;
  }

  async function runJpg() {
    if (jobs.j) return;
    if (!J.file || !J.pdf) { $('#jFile').click(); return; }
    var pages = [];
    J.sel.forEach(function (on, i) { if (on) pages.push(i + 1); });
    if (!pages.length) { J.err = 'j_none_sel'; renderJpg(); return; }
    J.err = null; J.outs = []; dropUrls('j');
    var job = startJob('j');
    try {
      var fmt = S.jFmt, dpi = S.jDpi, base = baseName(J.file.name), digits = String(J.file.pages).length;
      for (var i = 0; i < pages.length; i++) {
        checkJob(job);
        setProg(job, i / pages.length, 'busy_page', { p: EDU.fmt(i + 1), total: EDU.fmt(pages.length) });
        var r = await renderPage(J.pdf, pages[i], { dpi: dpi });
        var blob = await withDpi(await encode(r.canvas, fmt === 'png' ? 'image/png' : 'image/jpeg', 0.92), r.dpi);
        J.outs.push({ n: pages[i], name: base + '-page-' + pad(pages[i], Math.max(2, digits)) + '.' + fmt, blob: blob, url: keepUrl('j', blob), w: r.canvas.width, h: r.canvas.height, size: blob.size });
        free(r.canvas);
      }
    } catch (e) {
      if (e !== CANCEL) console.warn('[pdf-compress] ', e);
      J.err = errKey(e);
      if (e !== CANCEL) { J.outs = []; dropUrls('j'); }
    } finally { endJob(job); }
  }

  async function downloadZip() {
    if (!J.outs.length) return;
    var btn = $('#jZip');
    if (btn) btn.disabled = true;
    try {
      var JSZip = await loadScript(LIB.jszip, 'JSZip');
      var zip = new JSZip();
      J.outs.forEach(function (o) { zip.file(o.name, o.blob, { binary: true }); });
      var blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      EDU.download(baseName(J.file ? J.file.name : 'pages') + '-' + J.outs[0].name.split('.').pop() + '.zip', blob);
    } catch (e) {
      EDU.toast(t('zip_failed'), 5000);
    } finally { if (btn) btn.disabled = false; }
  }
  function saveEach() {
    var list = J.outs.slice(), i = 0;
    (function next() {
      if (i >= list.length) return;
      EDU.download(list[i].name, list[i].blob);
      i++;
      setTimeout(next, 450);
    })();
  }

  /* ------------------------------------------------------------------ (d) unlock */
  async function runUnlock() {
    if (jobs.u) return;
    if (!U.file) { $('#uFile').click(); return; }
    U.err = null; U.result = null; dropUrls('u');
    var job = startJob('u');
    try {
      var o = await openPdf(U.file.bytes, U.file.name, U.file.password);
      try { var out = await rasterPdf(o.pdf, S.uDpi, 0.85, false, job, 1); }
      finally { o.pdf.destroy(); }
      U.result = { bytes: out.bytes, size: out.bytes.length, pages: out.pages, url: keepUrl('u', pdfBlob(out.bytes)), name: baseName(U.file.name) + '-unlocked.pdf' };
    } catch (e) {
      if (e !== CANCEL) console.warn('[pdf-compress] ', e);
      U.err = errKey(e);
    } finally { endJob(job); }
  }

  /* ------------------------------------------------------------------ loading files */
  /* a newer pick (or Reset) wins: a big file that finishes opening after it must not replace it */
  var loadGen = { c: 0, u: 0 };
  async function loadCompress(src) {
    if (jobs.c) return;
    var gen = ++loadGen.c;
    dropUrls('c');
    C.file = null; C.result = null; C.err = 'reading';
    renderCompress();
    var file = null, err = null;
    try { file = await preparePdf(src, false); }
    catch (e) { err = e && e.notPdf ? 'not_pdf' : errKey(e); }
    if (gen !== loadGen.c) return;
    C.file = file; C.err = err;
    renderCompress();
  }
  async function loadJpg(src) {
    if (jobs.j) return;
    closeJ();
    J.err = 'reading';
    renderJpg();
    var gen = J.gen;
    try {
      var file = await preparePdf(src, true);
      if (gen !== J.gen) { try { file.pdf.destroy(); } catch (x) { } return; }
      J.file = file;
      J.pdf = J.file.pdf; delete J.file.pdf;
      J.sel = []; for (var i = 0; i < J.file.pages; i++) J.sel.push(true);
      J.err = null;
      buildPageGrid();
    } catch (e) {
      if (gen !== J.gen) return;
      J.file = null; J.err = e && e.notPdf ? 'not_pdf' : errKey(e);
    }
    renderJpg();
  }
  function closeJ() {
    J.gen++;
    if (J.pdf) { try { J.pdf.destroy(); } catch (e) { } }
    J.pdf = null; J.file = null; J.sel = []; J.outs = []; J.err = null;
    dropUrls('j');
    $('#jPages').textContent = '';
  }
  async function loadUnlock(src) {
    if (jobs.u) return;
    var gen = ++loadGen.u;
    dropUrls('u');
    U.file = null; U.result = null; U.kind = ''; U.err = 'reading';
    renderUnlock();
    var file = null, err = null;
    try { file = await preparePdf(src, false); }
    catch (e) { err = e && e.notPdf ? 'not_pdf' : e === PW_CANCEL ? 'u_cancel_pw' : errKey(e); }
    if (gen !== loadGen.u) return;
    U.file = file; U.err = err;
    U.kind = file ? (file.locked ? 'user' : file.encrypted ? 'owner' : 'none') : '';
    renderUnlock();
  }
  function sendToCompress() {
    if (!U.result) return;
    selectTab('compress', true);
    loadCompress({ name: U.result.name, u8: U.result.bytes });
  }

  /* ------------------------------------------------------------------ jobs + progress UI */
  function startJob(k) {
    var j = { k: k, cancelled: false };
    jobs[k] = j;
    prog[k] = { frac: 0, key: 'loading', vars: null };
    renderTool(k);
    return j;
  }
  function endJob(j) {
    if (jobs[j.k] !== j) return;
    jobs[j.k] = null; prog[j.k] = null;
    renderTool(j.k);
  }
  function setProg(job, frac, key, vars) {
    if (!job) return;
    prog[job.k] = { frac: frac, key: key, vars: vars || null };
    paintProg(job.k);
  }
  function paintProg(k) {
    var P = prog[k], box = $('#' + k + 'Prog');
    box.hidden = !jobs[k];
    $('#' + k + 'Stop').hidden = !jobs[k];
    if (!P) return;
    $('#' + k + 'Bar').style.width = Math.round(EDU.clamp(P.frac, 0, 1) * 100) + '%';
    $('#' + k + 'ProgTxt').textContent = t(P.key, P.vars || undefined);
  }
  /* every control in a busy tool is disabled except its Stop button */
  function lockPanel(k) {
    if (!jobs[k]) return;
    $$('button, input, select', $('#p-' + PANEL_OF[k])).forEach(function (x) { if (x.id !== k + 'Stop') x.disabled = true; });
  }
  function renderTool(k) { ({ c: renderCompress, i: renderImgs, j: renderJpg, u: renderUnlock })[k](); }

  function syncSeg(id, val) {
    $$('#' + id + ' button[data-v]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === String(val))); });
  }
  function enableAll(panelId) { $$('button, input, select', $('#' + panelId)).forEach(function (x) { x.disabled = false; }); }

  function fileInfo(box, file, onChange, onRemove) {
    box.textContent = '';
    box.hidden = !file;
    if (!file) return;
    var meta = [];
    if (file.pages) meta.push(pagesText(file.pages));
    meta.push(fmtSize(file.size));
    box.appendChild(el('span', { class: 'pc-fic', 'aria-hidden': 'true', text: file.locked ? '🔐' : '📄' }));
    box.appendChild(el('div', { class: 'grow' },
      el('div', { class: 'pc-fname no-i18n', dir: 'auto', text: file.name }),
      el('div', { class: 'small muted pc-meta', text: meta.join(' · ') })));
    box.appendChild(el('div', { class: 'row' },
      el('button', { class: 'btn btn-sm', type: 'button', text: t('change_file'), onclick: onChange }),
      iconBtn('✕', 'remove', onRemove)));
  }
  function emptyBox(icon, key) { return el('div', { class: 'pc-empty' }, el('span', { class: 'pc-drop-ic', 'aria-hidden': 'true', text: icon }), el('span', { text: t(key) })); }
  function msgBox(kind, text, id, dataKind) { var p = el('p', { class: 'callout mb0 ' + kind, text: text }); if (id) p.id = id; if (dataKind) p.setAttribute('data-kind', dataKind); return p; }
  function readingBox() { return el('p', { class: 'muted mb0' }, el('span', { class: 'pc-spin', 'aria-hidden': 'true' }), ' ', t('reading')); }
  function figure(url, caption, onClick) {
    var img = el('img', { class: 'pc-pv', src: url, alt: caption });
    var inner = onClick ? el('button', { type: 'button', class: 'pc-pvbtn', 'aria-label': t('compare'), title: t('compare'), onclick: onClick }, img) : img;
    return el('figure', {}, inner, el('figcaption', { text: caption }));
  }
  function downloadBtn(url, name, key) { return el('a', { class: 'btn btn-primary btn-lg', href: url, download: name, id: null }, el('span', { 'aria-hidden': 'true', text: '⬇' }), ' ', el('span', { text: t(key || 'download_pdf') })); }
  function openBtn(url) { return el('a', { class: 'btn', href: url, target: '_blank', rel: 'noopener' }, el('span', { 'aria-hidden': 'true', text: '↗' }), ' ', el('span', { text: t('open_view') })); }

  /* ------------------------------------------------------------------ render: compress */
  function renderCompress() {
    var busy = !!jobs.c;
    enableAll('p-compress');
    $('#cDrop').hidden = !!C.file;
    fileInfo($('#cInfo'), C.file, function () { $('#cFile').click(); }, function () { dropUrls('c'); C.file = null; C.result = null; C.err = null; renderCompress(); });

    var chips = $('#cTargets');
    chips.textContent = '';
    TARGETS.concat([0]).forEach(function (kb) {
      chips.appendChild(el('button', {
        type: 'button', class: 'chip', id: 'cT-' + (kb || 'other'), 'aria-pressed': String(S.cTarget === kb),
        text: kb ? kbLabel(kb) : t('c_other'),
        onclick: function () { S.cTarget = kb; save(); if (C.result) { C.result = null; dropUrls('c'); } renderCompress(); if (!kb) $('#cCustom').focus(); }
      }));
    });
    $('#cCustomRow').hidden = S.cTarget !== 0;
    if (document.activeElement !== $('#cCustom')) $('#cCustom').value = S.cCustom;

    $('#cmStrong').checked = S.cMode === 'strong';
    $('#cmLight').checked = S.cMode === 'light';
    $('#cmStrongL').classList.toggle('on', S.cMode === 'strong');
    $('#cmLightL').classList.toggle('on', S.cMode === 'light');
    $('#cGray').checked = S.cGray;
    $('#cGrayRow').hidden = S.cMode !== 'strong';
    renderAim();
    renderCResult();
    lockPanel('c');
    paintProg('c');
  }
  function renderAim() {
    var box = $('#cAim');
    box.className = 'small mb0 pc-msg';
    box.textContent = '';
    if (!C.file) return;
    var kb = targetKb(), target = kb * 1000;
    if (C.file.size < target) { box.classList.add('ok'); box.textContent = '✓ ' + t('aim_under', { to: kbLabel(kb) }); return; }
    var pct = EDU.clamp(Math.round((1 - target / C.file.size) * 100), 1, 99);
    box.textContent = t('aim_now', { from: fmtSize(C.file.size), to: kbLabel(kb), pct: EDU.fmt(pct) });
    var per = target / (C.file.pages || 1) / 1000;
    if (S.cMode === 'strong' && per < 6) {
      box.appendChild(el('br'));
      box.appendChild(el('span', { class: 'bad', text: '⚠ ' + t('c_hard', { kb: EDU.fmt(Math.max(0.1, Math.round(per * 10) / 10)) }) }));
    }
  }
  function renderCResult() {
    var box = $('#cResult'), R = C.result;
    box.textContent = '';
    ['data-bytes', 'data-pages', 'data-kind'].forEach(function (a) { box.removeAttribute(a); });
    if (C.err === 'reading') { box.setAttribute('data-state', 'reading'); box.appendChild(readingBox()); return; }
    if (C.err) { box.setAttribute('data-state', 'error'); box.appendChild(msgBox(C.err === 'stopped' ? 'warning' : 'danger', t(C.err), 'cMsg', C.err)); }
    if (!C.file) { if (!C.err) { box.setAttribute('data-state', 'empty'); box.appendChild(emptyBox('📉', 'c_empty')); } return; }
    if (!R) {
      if (!C.err) box.setAttribute('data-state', jobs.c ? 'busy' : 'file');
      box.appendChild(el('div', { class: 'pc-ba', style: { gridTemplateColumns: 'minmax(0,1fr)' } }, C.file.thumbUrl ? figure(C.file.thumbUrl, t('page_n', { n: EDU.fmt(1) }) + ' · ' + fmtSize(C.file.size)) : null));
      if (!jobs.c && !C.err) box.appendChild(el('p', { class: 'small muted mb0 center', text: t('c_ready') }));
      return;
    }
    if (R.kind === 'under') {
      box.setAttribute('data-state', 'under');
      box.appendChild(msgBox('success', '✓ ' + t('c_already', { to: kbLabel(R.kb), size: fmtSize(C.file.size) }), 'cMsg', 'under'));
      if (C.file.thumbUrl) box.appendChild(el('div', { class: 'pc-ba', style: { gridTemplateColumns: 'minmax(0,1fr)' } }, figure(C.file.thumbUrl, t('page_n', { n: EDU.fmt(1) }))));
      return;
    }
    box.setAttribute('data-state', 'done');
    box.setAttribute('data-bytes', R.size);
    box.setAttribute('data-pages', R.pages);
    box.setAttribute('data-kind', R.kind);
    var fail = R.kind === 'bigger' || R.kind === 'light_none';
    if (!fail) {
      var pct = Math.max(0, Math.round((1 - R.size / C.file.size) * 100));
      box.appendChild(el('div', { class: 'pc-big' }, el('bdi', { text: fmtSize(C.file.size) }), el('span', { class: 'pc-arrow', 'aria-hidden': 'true', text: '→' }), el('bdi', { text: fmtSize(R.size) })));
      var badges = el('div', { class: 'row', style: { gap: '6px' } }, el('span', { class: 'badge success', text: t('c_saved', { pct: EDU.fmt(pct) }) }), el('span', { class: 'badge', text: pagesText(R.pages) }));
      if (R.mode === 'strong') badges.appendChild(el('span', { class: 'badge', text: t('c_settings', { dpi: EDU.fmt(Math.round(R.d)), q: EDU.fmt(Math.round(R.q * 100)) }) }));
      box.appendChild(badges);
    }
    var txt = {
      ok: ['success', '✓ ' + t('c_done_ok', { to: kbLabel(R.kb) })],
      over: ['warning', '⚠ ' + t('c_done_over', { size: fmtSize(R.size), to: kbLabel(R.kb) })],
      bigger: ['warning', t('c_bigger', { size: fmtSize(R.size) })],
      light_ok: ['success', '✓ ' + t('c_light_ok', { to: kbLabel(R.kb) })],
      light_over: ['warning', t('c_light_over', { to: kbLabel(R.kb) })],
      light_none: ['warning', t('c_light_none')]
    }[R.kind];
    box.appendChild(msgBox(txt[0], txt[1], 'cMsg', R.kind));
    if (R.auto) box.appendChild(el('p', { class: 'small mb0', id: 'cAuto', text: '✨ ' + t('c_auto') }));
    if (R.mode === 'strong' && !fail) {
      var cmp = function () { openCompare(R); };
      box.appendChild(el('div', { class: 'pc-ba' },
        figure(R.beforeUrl, t('c_before') + ' · ' + fmtSize(C.file.size), cmp),
        figure(R.afterUrl, t('c_after') + ' · ' + fmtSize(R.size), cmp)));
    } else if (R.mode === 'light' && !fail) {
      box.appendChild(el('div', { class: 'pc-ba' },
        C.file.thumbUrl ? figure(C.file.thumbUrl, t('c_before') + ' · ' + fmtSize(C.file.size)) : el('span'),
        R.afterUrl ? figure(R.afterUrl, t('c_after') + ' · ' + fmtSize(R.size)) : el('span')));
    }
    if (!fail) {
      var dl = downloadBtn(R.url, baseName(C.file.name) + '-compressed.pdf', 'download_pdf');
      dl.id = 'cDownload';
      var acts = el('div', { class: 'pc-actions' }, dl, openBtn(R.url));
      if (R.mode === 'strong') acts.appendChild(el('button', { class: 'btn', type: 'button', id: 'cCompare', onclick: function () { openCompare(R); } }, el('span', { 'aria-hidden': 'true', text: '🔍' }), ' ', el('span', { text: t('compare') })));
      box.appendChild(acts);
      if (R.mode === 'strong' && R.dA4 < LOW_D) box.appendChild(el('p', { class: 'small mb0 bad', id: 'cLowRes', text: '⚠ ' + t('c_low_res', { dpi: EDU.fmt(Math.round(R.d)) }) }));
      if (R.mode === 'strong') box.appendChild(el('p', { class: 'small muted mb0', text: 'ℹ️ ' + t('c_note_raster') }));
    }
  }
  function openCompare(R) {
    if (!R || !R.beforeUrl) return;
    var img = el('img', { alt: '' });
    var bB = el('button', { type: 'button', id: 'cmpBefore' }), bA = el('button', { type: 'button', id: 'cmpAfter' });
    function show(after) {
      img.src = after ? R.afterUrl : R.beforeUrl;
      img.alt = t(after ? 'c_after' : 'c_before');
      bA.setAttribute('aria-pressed', String(after)); bB.setAttribute('aria-pressed', String(!after));
    }
    bB.textContent = t('c_before') + ' · ' + fmtSize(C.file ? C.file.size : 0);
    bA.textContent = t('c_after') + ' · ' + fmtSize(R.size);
    bB.addEventListener('click', function () { show(false); });
    bA.addEventListener('click', function () { show(true); });
    var wrap = el('div', { class: 'pc-cmp stack' }, el('div', { class: 'seg', role: 'group' }, bB, bA), el('p', { class: 'small muted mb0', text: t('cmp_hint') }), img);
    wrap.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { show(img.src === R.beforeUrl); e.preventDefault(); } });
    show(true);
    EDU.modal(wrap, { title: t('compare') });
    setTimeout(function () { bA.focus(); }, 30);
  }

  /* ------------------------------------------------------------------ render: photos -> PDF */
  function renderImgs() {
    enableAll('p-img');
    var n = I.items.length;
    $('#iDrop').hidden = n > 0;
    $('#iListWrap').hidden = n === 0;
    $('#iCount').textContent = t('i_count', { n: EDU.fmt(n) });
    var list = $('#iList'), focusId = document.activeElement && document.activeElement.getAttribute('data-fid');
    list.textContent = '';
    I.items.forEach(function (item, i) { list.appendChild(tile(item, i, n)); });
    if (focusId) { var f = list.querySelector('[data-fid="' + focusId + '"]'); if (f && !f.disabled) f.focus(); }

    syncSeg('iSize', S.iSize); syncSeg('iOrient', S.iOrient); syncSeg('iMargin', S.iMargin);
    syncSeg('iPer', S.iPer); syncSeg('iLook', S.iLook);
    var fit1 = S.iSize === 'fit' && S.iPer === 1;
    $$('#iOrient button').forEach(function (b) { b.disabled = fit1; });
    $('#iCardRow').hidden = S.iPer !== 2;
    $('#iCard').checked = S.iCard;
    var note = S.iPer === 2 && S.iSize === 'fit' ? t('i_fit_2up') : fit1 ? t('i_fit_note') : '';
    $('#iFitNote').textContent = note;

    var sel = $('#iLimit');
    sel.textContent = '';
    LIMITS.forEach(function (kb) { sel.appendChild(el('option', { value: kb, text: kb ? t('limit_under', { x: kbLabel(kb) }) : t('no_limit') })); });
    sel.value = String(S.iLimit);
    if (document.activeElement !== $('#iName')) $('#iName').value = I.name;
    $('#iName').placeholder = t('i_name_ph');

    var pages = n ? layoutPages(I.items) : [];
    $('#iPagesBadge').textContent = n ? pagesText(pages.length) : '';
    drawLayout(pages);
    renderIResult();
    lockPanel('i');
    paintProg('i');
  }
  function tile(item, i, n) {
    var up = iconBtn('↑', 'i_up', function () { moveItem(i, i - 1); }); up.disabled = i === 0; up.setAttribute('data-fid', item.id + '-up');
    var dn = iconBtn('↓', 'i_down', function () { moveItem(i, i + 1); }); dn.disabled = i === n - 1; dn.setAttribute('data-fid', item.id + '-dn');
    var rot = iconBtn('⟳', 'i_rotate', function () { item.rot = (item.rot + 90) % 360; makeView(item); I.result = null; dropUrls('i'); renderImgs(); }); rot.setAttribute('data-fid', item.id + '-rot');
    var rm = iconBtn('✕', 'remove', function () { I.items.splice(i, 1); I.result = null; dropUrls('i'); if (!I.items.length) I.name = ''; renderImgs(); var nx = $('#iList [data-fid$="-rm"]'); if (nx) nx.focus(); });
    rm.setAttribute('data-fid', item.id + '-rm');
    var d = effDims(item);
    var box = el('div', { class: 'pc-tile', draggable: 'true', 'data-id': item.id },
      el('div', { class: 'pc-tthumb' }, item.view, el('span', { class: 'pc-num', 'aria-hidden': 'true', text: EDU.fmt(i + 1) })),
      el('div', { class: 'pc-tinfo' },
        el('div', { class: 'pc-tname no-i18n', dir: 'auto', title: item.name, text: item.name }),
        el('div', { class: 'tiny muted pc-meta', text: ltr(EDU.fmt(d.w) + ' × ' + EDU.fmt(d.h) + ' px') }),
        el('div', { class: 'pc-tbtns' }, up, dn, rot, rm)));
    box.addEventListener('dragstart', function (e) { if (jobs.i) { e.preventDefault(); return; } dragId = item.id; box.classList.add('drag'); try { e.dataTransfer.setData('text/plain', item.id); e.dataTransfer.effectAllowed = 'move'; } catch (x) { } });
    box.addEventListener('dragend', function () { dragId = null; box.classList.remove('drag'); $$('.pc-tile.dropto').forEach(function (x) { x.classList.remove('dropto'); }); });
    box.addEventListener('dragover', function (e) { if (dragId && dragId !== item.id) { e.preventDefault(); box.classList.add('dropto'); } });
    box.addEventListener('dragleave', function () { box.classList.remove('dropto'); });
    box.addEventListener('drop', function (e) {
      if (!dragId) return;
      e.preventDefault(); e.stopPropagation();
      var from = I.items.findIndex(function (x) { return x.id === dragId; }), to = I.items.indexOf(item);
      dragId = null;
      if (from >= 0 && to >= 0 && from !== to) moveItem(from, to);
    });
    return box;
  }
  var dragId = null;
  function moveItem(from, to) {
    if (to < 0 || to >= I.items.length) return;
    var it = I.items.splice(from, 1)[0];
    I.items.splice(to, 0, it);
    I.result = null; dropUrls('i');
    renderImgs();
  }
  function drawLayout(pages) {
    var cv = $('#iLayout');
    var cssW = Math.max(220, Math.round(cv.getBoundingClientRect().width || (cv.parentElement.clientWidth - 32) || 300));
    var cssH = Math.round(EDU.clamp(cssW * 0.55, 190, 300));
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
    cv.style.height = cssH + 'px';
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    var font = getComputedStyle(document.body).fontFamily || 'sans-serif';
    var muted = EDU.css('--muted') || '#666', border = EDU.css('--border') || '#ccc', primary = EDU.css('--primary') || '#0b4f5c';
    if (!pages.length) {
      var ph0 = cssH - 36, pw0 = ph0 / 1.414, x0 = (cssW - pw0) / 2, y0 = 14;
      ctx.setLineDash([6, 5]); ctx.strokeStyle = muted; ctx.lineWidth = 1.5; ctx.strokeRect(x0, y0, pw0, ph0); ctx.setLineDash([]);
      ctx.fillStyle = muted; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '600 13px ' + font;
      wrapText(ctx, t('i_empty'), cssW / 2, y0 + ph0 / 2, Math.max(80, pw0 - 14), 18);
      return;
    }
    var labelH = 22, maxH = cssH - labelH - 12, gap = 14;
    var tallest = Math.max.apply(null, pages.map(function (p) { return p.h; }));
    var k = maxH / tallest, shown = [], used = 0;
    for (var i = 0; i < pages.length; i++) {
      var w = pages[i].w * k;
      if (shown.length && used + gap + w > cssW - 50) break;
      used += (shown.length ? gap : 0) + w;
      shown.push(pages[i]);
    }
    var more = pages.length - shown.length;
    var x = Math.max(8, (cssW - used - (more ? 50 : 0)) / 2);
    if (document.documentElement.dir === 'rtl') { /* pages read right to left in Urdu */
      shown = shown.slice().reverse();
    }
    var startIdx = document.documentElement.dir === 'rtl' ? shown.length - 1 : 0;
    shown.forEach(function (p, j) {
      var pw = p.w * k, ph = p.h * k, y = 8 + (maxH - ph) / 2;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
      ctx.fillStyle = '#fff'; ctx.fillRect(x, y, pw, ph);
      ctx.restore();
      ctx.strokeStyle = border; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, pw - 1, ph - 1);
      p.slots.forEach(function (s) { if (s.item.view && s.item.view.width) ctx.drawImage(s.item.view, x + s.x * k, y + s.y * k, Math.max(1, s.w * k), Math.max(1, s.h * k)); });
      var num = document.documentElement.dir === 'rtl' ? startIdx - j + 1 : j + 1;
      ctx.fillStyle = muted; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.font = '700 12px system-ui, sans-serif';
      ctx.fillText(EDU.fmt(num), x + pw / 2, cssH - 8);
      x += pw + gap;
    });
    if (more) {
      ctx.fillStyle = primary; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '800 16px system-ui, sans-serif';
      var mx = document.documentElement.dir === 'rtl' ? 26 : Math.min(cssW - 26, x + 14);
      ctx.fillText('+' + EDU.fmt(more), mx, 8 + maxH / 2);
    }
  }
  function wrapText(ctx, text, cx, cy, maxW, lh) {
    var words = String(text).split(/\s+/), lines = [], line = '';
    words.forEach(function (w) { var test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test; });
    if (line) lines.push(line);
    var y = cy - (lines.length - 1) * lh / 2;
    lines.forEach(function (l, i) { ctx.fillText(l, cx, y + i * lh); });
  }
  function renderIResult() {
    var box = $('#iResult'), R = I.result;
    box.textContent = '';
    ['data-bytes', 'data-pages'].forEach(function (a) { box.removeAttribute(a); });
    box.hidden = !R && !I.err;
    if (I.err) { box.setAttribute('data-state', 'error'); box.appendChild(msgBox(I.err === 'stopped' ? 'warning' : 'danger', t(I.err), 'iMsg', I.err)); return; }
    if (!R) { box.setAttribute('data-state', 'empty'); return; }
    box.setAttribute('data-state', 'done');
    box.setAttribute('data-bytes', R.size);
    box.setAttribute('data-pages', R.pages);
    box.appendChild(el('div', { class: 'pc-big' }, el('span', { 'aria-hidden': 'true', text: '📄 ' }), el('bdi', { text: fmtSize(R.size) })));
    box.appendChild(el('div', { class: 'row', style: { gap: '6px' } }, el('span', { class: 'badge', text: pagesText(R.pages) }), el('span', { class: 'badge no-i18n', dir: 'auto', text: R.name })));
    box.appendChild(R.over
      ? msgBox('warning', '⚠ ' + t('i_over', { size: fmtSize(R.size), to: kbLabel(R.kb) }), 'iMsg', 'over')
      : msgBox('success', '✓ ' + t('i_done'), 'iMsg', 'ok'));
    var dl = downloadBtn(R.url, R.name, 'download_pdf');
    dl.id = 'iDownload';
    box.appendChild(el('div', { class: 'pc-actions' }, dl, openBtn(R.url)));
  }

  /* ------------------------------------------------------------------ render: PDF -> images */
  function buildPageGrid() {
    var grid = $('#jPages'), gen = J.gen;
    grid.textContent = '';
    if (pageObserver) pageObserver.disconnect();
    if (!J.file) return;
    pageObserver = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { pageObserver.unobserve(e.target); queueThumb(e.target, gen); } });
    }, { root: grid, rootMargin: '300px' }) : null;
    for (var n = 1; n <= J.file.pages; n++) {
      var b = el('button', { type: 'button', class: 'pc-page', 'data-n': n, 'aria-pressed': String(!!J.sel[n - 1]), 'aria-label': t('page_n', { n: EDU.fmt(n) }) },
        el('span', { class: 'pc-ph', 'aria-hidden': 'true' }),
        el('span', { class: 'pc-pn', 'aria-hidden': 'true', text: EDU.fmt(n) }),
        el('span', { class: 'pc-tick', 'aria-hidden': 'true', text: '✓' }));
      grid.appendChild(b);
      if (pageObserver) pageObserver.observe(b); else queueThumb(b, gen);
    }
  }
  var pageObserver = null, thumbQueue = [], thumbBusy = false;
  function queueThumb(btn, gen) { thumbQueue.push({ btn: btn, gen: gen }); pumpThumbs(); }
  async function pumpThumbs() {
    if (thumbBusy) return;
    thumbBusy = true;
    while (thumbQueue.length) {
      var it = thumbQueue.shift();
      if (it.gen !== J.gen || !J.pdf) continue;
      try {
        var r = await renderPage(J.pdf, +it.btn.getAttribute('data-n'), { width: 150 });
        var ph = it.btn.querySelector('.pc-ph');
        if (it.gen === J.gen && ph) { r.canvas.setAttribute('aria-hidden', 'true'); ph.replaceWith(r.canvas); } else free(r.canvas);
      } catch (e) { }
    }
    thumbBusy = false;
  }
  function syncPageGrid() {
    $$('#jPages .pc-page').forEach(function (b) {
      var n = +b.getAttribute('data-n');
      b.setAttribute('aria-pressed', String(!!J.sel[n - 1]));
      b.setAttribute('aria-label', t('page_n', { n: EDU.fmt(n) }));
    });
  }
  function renderJpg() {
    enableAll('p-jpg');
    $('#jDrop').hidden = !!J.file;
    fileInfo($('#jInfo'), J.file, function () { $('#jFile').click(); }, function () { closeJ(); renderJpg(); });
    syncSeg('jFmt', S.jFmt); syncSeg('jDpi', S.jDpi);
    var has = !!J.file;
    $('#jPagesEmpty').hidden = has;
    $('#jPages').hidden = !has;
    var cnt = J.sel.filter(Boolean).length;
    $('#jSelCount').textContent = has ? t('j_sel', { n: EDU.fmt(cnt), total: EDU.fmt(J.file.pages) }) : '';
    $('#jRange').disabled = $('#jAll').disabled = $('#jNone').disabled = !has;
    if (has && document.activeElement !== $('#jRange')) $('#jRange').value = rangeText(J.sel);
    if (!has) $('#jRange').value = '';
    syncPageGrid();
    renderJResult();
    lockPanel('j');
    paintProg('j');
  }
  function renderJResult() {
    var box = $('#jResult');
    box.textContent = '';
    box.removeAttribute('data-count');
    var err = J.err;
    box.hidden = !err && !J.outs.length;
    if (err === 'reading') { box.hidden = false; box.setAttribute('data-state', 'reading'); box.appendChild(readingBox()); return; }
    if (err) { box.setAttribute('data-state', 'error'); box.appendChild(msgBox(err === 'stopped' ? 'warning' : 'danger', t(err), 'jMsg', err)); }
    if (!J.outs.length) { if (!err) box.setAttribute('data-state', 'empty'); return; }
    if (!err) box.setAttribute('data-state', 'done');
    box.setAttribute('data-count', J.outs.length);
    var total = J.outs.reduce(function (s, o) { return s + o.size; }, 0);
    box.appendChild(el('div', { class: 'row spread' },
      el('h3', { class: 'mb0', text: '✓ ' + t('j_done', { n: EDU.fmt(J.outs.length), size: fmtSize(total) }) })));
    var acts = el('div', { class: 'pc-actions' });
    if (J.outs.length === 1) {
      var one = downloadBtn(J.outs[0].url, J.outs[0].name, 'download');
      one.id = 'jOne';
      acts.appendChild(one);
    } else {
      acts.appendChild(el('button', { class: 'btn btn-primary btn-lg', type: 'button', id: 'jZip', onclick: downloadZip }, el('span', { 'aria-hidden': 'true', text: '🗂️' }), ' ', el('span', { text: t('j_zip') })));
      acts.appendChild(el('button', { class: 'btn', type: 'button', id: 'jEach', onclick: saveEach }, el('span', { 'aria-hidden': 'true', text: '⬇' }), ' ', el('span', { text: t('j_each') })));
    }
    box.appendChild(acts);
    var grid = el('div', { class: 'pc-outs' });
    J.outs.forEach(function (o) {
      grid.appendChild(el('div', { class: 'pc-out', 'data-w': o.w, 'data-h': o.h, 'data-n': o.n },
        el('img', { src: o.url, alt: t('page_n', { n: EDU.fmt(o.n) }), loading: 'lazy' }),
        el('div', { class: 'small', style: { fontWeight: '700' }, text: t('page_n', { n: EDU.fmt(o.n) }) }),
        el('div', { class: 'tiny muted pc-meta', text: ltr(EDU.fmt(o.w) + ' × ' + EDU.fmt(o.h) + ' px') + ' · ' + fmtSize(o.size) }),
        el('a', { class: 'btn btn-sm', href: o.url, download: o.name }, el('span', { 'aria-hidden': 'true', text: '⬇ ' }), el('span', { text: t('download') }))));
    });
    box.appendChild(grid);
  }

  /* ------------------------------------------------------------------ render: unlock */
  function renderUnlock() {
    enableAll('p-unlock');
    $('#uDrop').hidden = !!U.file;
    fileInfo($('#uInfo'), U.file, function () { $('#uFile').click(); }, function () { dropUrls('u'); U.file = null; U.result = null; U.err = null; U.kind = ''; renderUnlock(); });
    var st = $('#uStatus');
    st.textContent = ''; st.className = 'mb0 pc-msg'; st.removeAttribute('data-kind');
    var status = U.err === 'reading' ? null : U.err ? [U.err === 'stopped' ? 'warning' : 'danger', U.err] : U.kind === 'user' ? ['success', 'u_unlocked'] : U.kind === 'owner' ? ['warning', 'u_owner'] : U.kind === 'none' ? ['', 'u_none'] : null;
    if (U.err === 'reading') st.appendChild(readingBox());
    if (status) {
      st.className = 'mb0 pc-msg callout ' + status[0];
      st.setAttribute('data-kind', U.err ? U.err : U.kind);
      st.textContent = (U.kind === 'user' && !U.err ? '🔓 ' : '') + t(status[1]);
    }
    syncSeg('uDpi', S.uDpi);
    $('#uSaveBox').hidden = !U.file || U.kind === 'none';
    var box = $('#uResult'), R = U.result;
    box.textContent = '';
    box.removeAttribute('data-bytes');
    if (R) {
      box.setAttribute('data-state', 'done');
      box.setAttribute('data-bytes', R.size);
      box.appendChild(el('div', { class: 'pc-big' }, el('span', { 'aria-hidden': 'true', text: '🔓 ' }), el('bdi', { text: fmtSize(R.size) })));
      box.appendChild(msgBox('success', '✓ ' + t('u_done', { pages: pagesText(R.pages) }), 'uMsg', 'done'));
      if (U.file && U.file.thumbUrl) box.appendChild(el('div', { class: 'pc-ba', style: { gridTemplateColumns: 'minmax(0,1fr)' } }, figure(U.file.thumbUrl, t('page_n', { n: EDU.fmt(1) }))));
      var dl = downloadBtn(R.url, R.name, 'download_pdf');
      dl.id = 'uDownload';
      box.appendChild(el('div', { class: 'pc-actions' }, dl, openBtn(R.url),
        el('button', { class: 'btn', type: 'button', id: 'uToCompress', onclick: sendToCompress }, el('span', { 'aria-hidden': 'true', text: '🗜️' }), ' ', el('span', { text: t('u_compress') }))));
      box.appendChild(el('p', { class: 'small muted mb0', text: 'ℹ️ ' + t('u_note') }));
    } else if (U.file && U.file.thumbUrl) {
      box.setAttribute('data-state', 'file');
      box.appendChild(el('div', { class: 'pc-ba', style: { gridTemplateColumns: 'minmax(0,1fr)' } }, figure(U.file.thumbUrl, t('page_n', { n: EDU.fmt(1) }) + ' · ' + pagesText(U.file.pages))));
    } else {
      box.setAttribute('data-state', 'empty');
      box.appendChild(emptyBox('🔓', 'u_empty'));
    }
    lockPanel('u');
    paintProg('u');
  }

  /* ------------------------------------------------------------------ tabs */
  function selectTab(name, focus) {
    S.tab = oneOf(name, TABS, 'compress');
    save();
    TABS.forEach(function (tb) {
      var b = $('#tab-' + tb), on = tb === S.tab;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
      $('#p-' + tb).hidden = !on;
    });
    if (focus) $('#tab-' + S.tab).focus();
    try { history.replaceState(history.state, '', location.pathname + location.search + '#' + HASH[S.tab]); } catch (e) { }
    if (S.tab === 'img') drawLayout(I.items.length ? layoutPages(I.items) : []);
  }
  $('#tabs').addEventListener('click', function (e) { var b = e.target.closest('[data-tab]'); if (b) selectTab(b.getAttribute('data-tab')); });
  $('#tabs').addEventListener('keydown', function (e) {
    var i = TABS.indexOf(S.tab), rtl = document.documentElement.dir === 'rtl', d = 0;
    if (e.key === 'ArrowRight') d = rtl ? -1 : 1;
    else if (e.key === 'ArrowLeft') d = rtl ? 1 : -1;
    else if (e.key === 'Home') { selectTab(TABS[0], true); e.preventDefault(); return; }
    else if (e.key === 'End') { selectTab(TABS[TABS.length - 1], true); e.preventDefault(); return; }
    if (!d) return;
    e.preventDefault();
    selectTab(TABS[(i + d + TABS.length) % TABS.length], true);
  });

  /* ------------------------------------------------------------------ events */
  function onPick(input, fn) {
    input.addEventListener('change', function () {
      var files = input.files;
      if (files && files.length) fn(files);
      input.value = '';
    });
  }
  $('#cPick').addEventListener('click', function () { $('#cFile').click(); });
  $('#iPick').addEventListener('click', function () { $('#iFile').click(); });
  $('#iMore').addEventListener('click', function () { $('#iFile').click(); });
  $('#jPick').addEventListener('click', function () { $('#jFile').click(); });
  $('#uPick').addEventListener('click', function () { $('#uFile').click(); });
  onPick($('#cFile'), function (f) { loadCompress(f[0]); });
  onPick($('#iFile'), function (f) { addImages(f); });
  onPick($('#jFile'), function (f) { loadJpg(f[0]); });
  onPick($('#uFile'), function (f) { loadUnlock(f[0]); });

  /* drag and drop files onto a tool */
  function hasFiles(e) { var ty = e.dataTransfer && e.dataTransfer.types; return !!ty && Array.prototype.indexOf.call(ty, 'Files') >= 0; }
  $$('.pc-panel').forEach(function (p) {
    p.addEventListener('dragover', function (e) { if (!hasFiles(e)) return; e.preventDefault(); p.classList.add('pc-over'); });
    p.addEventListener('dragleave', function (e) { if (!p.contains(e.relatedTarget)) p.classList.remove('pc-over'); });
    p.addEventListener('drop', function (e) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      p.classList.remove('pc-over');
      var files = e.dataTransfer.files;
      if (!files || !files.length) return;
      if (p.id === 'p-img') addImages(files);
      else if (p.id === 'p-compress') loadCompress(files[0]);
      else if (p.id === 'p-jpg') loadJpg(files[0]);
      else loadUnlock(files[0]);
    });
  });
  /* a file dropped next to a tool must not replace the page */
  window.addEventListener('dragover', function (e) { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener('drop', function (e) { if (hasFiles(e)) e.preventDefault(); });
  /* paste screenshots / copied photos straight into "JPG to PDF" */
  document.addEventListener('paste', function (e) {
    if (S.tab !== 'img' || !e.clipboardData) return;
    var files = [];
    Array.prototype.forEach.call(e.clipboardData.items || [], function (it) {
      if (it.kind === 'file' && /^image\//.test(it.type)) { var f = it.getAsFile(); if (f) files.push(new File([f], 'pasted-' + (I.items.length + files.length + 1) + '.' + (it.type.split('/')[1] || 'png').replace('jpeg', 'jpg'), { type: it.type })); }
    });
    if (files.length) { e.preventDefault(); addImages(files); }
  });

  /* compress */
  $('#cCustom').addEventListener('input', function () {
    var v = parseInt(this.value, 10);
    if (v >= 10 && v <= 100000) { S.cCustom = v; save(); if (C.result) { C.result = null; dropUrls('c'); renderCResult(); } renderAim(); }
  });
  /* a size outside 10-100000 KB (or an empty box) is corrected in the box itself, so the size shown is the
     size used (typing 5 used to keep the old 300 KB silently) */
  function commitCustom() {
    var box = $('#cCustom'), v = parseInt(box.value, 10);
    if (isNaN(v)) v = S.cCustom;
    v = EDU.clamp(v, 10, 100000);
    if (v !== S.cCustom) { S.cCustom = v; save(); if (C.result) { C.result = null; dropUrls('c'); renderCResult(); } }
    box.value = v;
    renderAim();
  }
  /* leaving the box by pressing Compress: correct it after the click, otherwise the changed hint above the
     button moves the button away from the pointer and the click is lost */
  var pointerIsDown = false;
  document.addEventListener('pointerdown', function () { pointerIsDown = true; }, true);
  ['pointerup', 'pointercancel'].forEach(function (ev) { document.addEventListener(ev, function () { pointerIsDown = false; }, true); });
  $('#cCustom').addEventListener('change', function () {
    if (!pointerIsDown) { commitCustom(); return; }
    var later = function () { document.removeEventListener('pointerup', later, true); document.removeEventListener('pointercancel', later, true); setTimeout(commitCustom, 0); };
    document.addEventListener('pointerup', later, true);
    document.addEventListener('pointercancel', later, true);
  });
  $('#cCustom').addEventListener('keydown', function (e) { if (e.key === 'Enter') { commitCustom(); runCompress(); } });
  $$('input[name="cMode"]').forEach(function (r) {
    r.addEventListener('change', function () { if (r.checked) { S.cMode = r.value; save(); renderCompress(); } });
  });
  $('#cGray').addEventListener('change', function () { S.cGray = this.checked; save(); });
  $('#cGo').addEventListener('click', runCompress);
  $('#cStop').addEventListener('click', function () { if (jobs.c) jobs.c.cancelled = true; });

  /* photos */
  function bindSeg(id, key, num) {
    $('#' + id).addEventListener('click', function (e) {
      var b = e.target.closest('button[data-v]');
      if (!b || b.disabled) return;
      var v = b.getAttribute('data-v');
      S[key] = num ? +v : v;
      save();
      if (key === 'iLook') I.items.forEach(makeView);
      if (key.charAt(0) === 'i') { I.result = null; dropUrls('i'); renderImgs(); }
      else if (key.charAt(0) === 'j') renderJpg();
      else renderUnlock();
    });
  }
  bindSeg('iSize', 'iSize'); bindSeg('iOrient', 'iOrient'); bindSeg('iMargin', 'iMargin');
  bindSeg('iPer', 'iPer', true); bindSeg('iLook', 'iLook');
  bindSeg('jFmt', 'jFmt'); bindSeg('jDpi', 'jDpi', true); bindSeg('uDpi', 'uDpi', true);
  $('#iCard').addEventListener('change', function () { S.iCard = this.checked; save(); I.result = null; dropUrls('i'); renderImgs(); });
  $('#iLimit').addEventListener('change', function () { S.iLimit = +this.value; save(); I.result = null; dropUrls('i'); renderIResult(); });
  $('#iName').addEventListener('input', function () { I.name = this.value; if (I.result) { I.result.name = (cleanName(I.name) || 'photos') + '.pdf'; renderIResult(); } });
  $('#iName').addEventListener('keydown', function (e) { if (e.key === 'Enter') runImages(); });
  $('#iSort').addEventListener('click', function () {
    I.items.sort(function (a, b) { return String(a.name).localeCompare(String(b.name), undefined, { numeric: true, sensitivity: 'base' }); });
    I.result = null; dropUrls('i'); renderImgs();
  });
  $('#iClear').addEventListener('click', function () {
    if (!I.items.length || !confirm(t('i_clear_q'))) return;
    I.items = []; I.result = null; I.err = null; I.name = ''; dropUrls('i'); renderImgs();
  });
  $('#iGo').addEventListener('click', runImages);
  $('#iStop').addEventListener('click', function () { if (jobs.i) jobs.i.cancelled = true; });

  /* pdf -> jpg */
  $('#jPages').addEventListener('click', function (e) {
    var b = e.target.closest('.pc-page');
    if (!b || jobs.j) return;
    var n = +b.getAttribute('data-n');
    J.sel[n - 1] = !J.sel[n - 1];
    $('#jRangeMsg').textContent = '';
    renderJpg();
  });
  $('#jRange').addEventListener('input', function () {
    if (!J.file) return;
    var sel = parseRange(this.value, J.file.pages);
    $('#jRangeMsg').textContent = sel || !this.value.trim() ? '' : t('j_range_bad', { n: EDU.fmt(J.file.pages) });
    if (sel) { J.sel = sel; renderJpg(); }
  });
  $('#jRange').addEventListener('keydown', function (e) { if (e.key === 'Enter') runJpg(); });
  $('#jAll').addEventListener('click', function () { J.sel = J.sel.map(function () { return true; }); $('#jRangeMsg').textContent = ''; renderJpg(); });
  $('#jNone').addEventListener('click', function () { J.sel = J.sel.map(function () { return false; }); $('#jRangeMsg').textContent = ''; renderJpg(); });
  $('#jGo').addEventListener('click', runJpg);
  $('#jStop').addEventListener('click', function () { if (jobs.j) jobs.j.cancelled = true; });

  /* unlock */
  $('#uGo').addEventListener('click', runUnlock);
  $('#uStop').addEventListener('click', function () { if (jobs.u) jobs.u.cancelled = true; });

  $('#engineRetry').addEventListener('click', function () { engine().catch(function () { }); });
  $('#resetAll').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    TABS.forEach(function (tb) { var k = KEY_OF[tb]; if (jobs[k]) jobs[k].cancelled = true; });
    loadGen.c++; loadGen.u++;
    S = Object.assign({}, DEF);
    save();
    dropUrls('c'); dropUrls('i'); dropUrls('u');
    C.file = null; C.result = null; C.err = null;
    I.items = []; I.result = null; I.err = null; I.name = '';
    closeJ();
    U.file = null; U.result = null; U.err = null; U.kind = '';
    renderAll();
    selectTab('compress');
  });

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { if (S.tab === 'img') drawLayout(I.items.length ? layoutPages(I.items) : []); }, 150);
  });
  EDU.onTheme(function () { if (S.tab === 'img') drawLayout(I.items.length ? layoutPages(I.items) : []); });

  /* ------------------------------------------------------------------ start */
  function renderAll() {
    renderEngine();
    renderCompress();
    renderImgs();
    renderJpg();
    renderUnlock();
  }
  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });
  EDU.onLang(renderAll);
  var fromHash = (location.hash || '').replace('#', '');
  TABS.forEach(function (tb) { if (HASH[tb] === fromHash) S.tab = tb; });
  renderAll();
  selectTab(S.tab);
  engine().catch(function () { });

  /* hooks for the automated test (read-only views of the current results) */
  window.PDFCC = {
    result: function (k) { return { c: C.result, i: I.result, u: U.result }[k] || null; },
    layout: function () { return layoutPages(I.items).map(function (p) { return { w: p.w, h: p.h, slots: p.slots.length }; }); }
  };
})();
