/* PDF Merge, Split & Organise: an iLovePDF-style page organiser that never uploads anything.
   Add PDFs + JPG/PNG photos -> one thumbnail grid -> reorder (drag / keyboard / buttons), rotate,
   delete, duplicate, insert blank pages -> merge into one PDF or split (every page / ranges /
   every N pages / selected pages; many files come as one ZIP). Extras: page numbers, text or
   image watermark (incl. the Indian "Copy for KYC with <bank> only - DD-MM-YYYY" practice for
   Aadhaar / PAN copies), and strip / keep / set document metadata.
   Libraries (pinned, from jsDelivr): pdf-lib 1.17.1 (writes PDFs), pdf.js 3.11.174 (reads and
   draws thumbnails; v4+ is ES-module only), JSZip 3.10.1 (loaded only when a ZIP is needed).
   pdf-lib cannot shape Indic / Urdu text, so any non-ASCII stamp text is drawn on a canvas and
   embedded as a PNG. Files are never stored; only settings go to EDU.store. */
(function () {
  'use strict';
  var SLUG = 'pdf-merge-split';
  var CDN = 'https://cdn.jsdelivr.net/npm/';
  var LIB = {
    pdflib: CDN + 'pdf-lib@1.17.1/dist/pdf-lib.min.js',
    pdfjs: CDN + 'pdfjs-dist@3.11.174/build/pdf.min.js',
    worker: CDN + 'pdfjs-dist@3.11.174/build/pdf.worker.min.js',
    cmaps: CDN + 'pdfjs-dist@3.11.174/cmaps/',
    fonts: CDN + 'pdfjs-dist@3.11.174/standard_fonts/',
    jszip: CDN + 'jszip@3.10.1/dist/jszip.min.js'
  };
  var A4 = [595.28, 841.89];
  var BIG_PAGES = 200, BIG_BYTES = 100 * 1024 * 1024;
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$;

  /* ------------------------------------------------------------------ settings */
  var DEFAULTS = {
    tab: 'merge', splitMode: 'each', ranges: '1-2', everyN: 2, oneFile: false, selSeparate: false,
    num: { on: false, pos: 'bc', fmt: 'n', start: 1, skip: false, size: 11 },
    wm: { type: 'none', text: '', org: '', layout: 'center', angle: 'diag', color: 'grey', opacity: 30, size: 75 },
    meta: { mode: 'remove', title: '', author: '', subject: '', keywords: '' },
    img: 'a4', thumb: 150
  };
  function merge(def, val) {
    if (!val || typeof val !== 'object' || Array.isArray(val)) return JSON.parse(JSON.stringify(def));
    var out = {};
    Object.keys(def).forEach(function (k) {
      var d = def[k], v = val[k];
      if (d && typeof d === 'object') out[k] = merge(d, v);
      else out[k] = (v !== undefined && typeof v === typeof d) ? v : d;
    });
    return out;
  }
  var S = merge(DEFAULTS, store.get('settings', null));
  function save() { store.set('settings', S); }

  /* ------------------------------------------------------------------ state */
  var sources = new Map();     // id -> source
  var pages = [];              // ordered page items { id, src, kind, idx, base, rot, w, h }
  var byId = new Map();
  var selected = new Set();
  var cards = new Map();       // page id -> card element
  var thumbs = new Map();      // thumb key -> canvas
  var history = [], future = [];
  var focusId = null, anchorId = null;
  var pageSeq = 0, srcSeq = 0, colorSeq = 0;
  var engine = 'loading', engineWaiters = [], pdfWorker = null;
  var busy = false, cancelled = false, dirty = false;
  var lastResult = null;
  var msgs = [];               // { id, kind, key, vars }
  var msgSeq = 0;
  var wmImage = null;          // { bytes, type:'png'|'jpg', w, h, url }

  EDU.init({ slug: SLUG, title: 'app_title', wide: true, waKey: 'shell_wa_tool' });

  /* ------------------------------------------------------------------ helpers */
  function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }
  function norm(a) { a = Math.round(a / 90) * 90 % 360; return a < 0 ? a + 360 : a; }
  function fmtSize(b) {
    if (b < 1024 * 1024) return EDU.fmt(Math.max(1, Math.round(b / 1024))) + ' KB';
    return EDU.fmt(b / 1048576, { maximumFractionDigits: b < 10 * 1048576 ? 1 : 0 }) + ' MB';
  }
  function pagesTxt(n) { return n === 1 ? t('one_page') : t('n_pages', { n: EDU.fmt(n) }); }
  function announce(msg) { var l = $('#live'); l.textContent = ''; setTimeout(function () { l.textContent = msg; }, 30); }
  function isRTL() { return document.documentElement.dir === 'rtl'; }
  function code(c, extra) { var e = new Error(c); e.code = c; if (extra) e.detail = extra; return e; }
  function baseOf(name) { return String(name || '').replace(/\.(pdf|jpe?g|png|webp)$/i, ''); }
  function cleanName(s) {
    return String(s || '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_').replace(/\s+/g, ' ').trim()
      .replace(/\.(pdf|zip)$/i, '').slice(0, 80).replace(/^[.\s]+|[.\s]+$/g, '');
  }
  function today() {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getDate()) + '-' + p(d.getMonth() + 1) + '-' + d.getFullYear();
  }
  function isAscii(s) { return /^[\x20-\x7e]*$/.test(s); }

  /* ------------------------------------------------------------------ engine */
  function loadScript(src, ok) {
    return new Promise(function (resolve, reject) {
      if (ok()) return resolve();
      var s = document.createElement('script');
      s.src = src; s.async = true; s.crossOrigin = 'anonymous';
      var timer = setTimeout(function () { s.remove(); reject(new Error('timeout')); }, 60000);
      s.onload = function () { clearTimeout(timer); ok() ? resolve() : reject(new Error('missing')); };
      s.onerror = function () { clearTimeout(timer); s.remove(); reject(new Error('load failed')); };
      document.head.appendChild(s);
    });
  }
  function setEngine(state) {
    engine = state;
    var box = $('#engine');
    box.className = 'pm-engine small' + (state === 'ready' ? ' ok' : state === 'failed' ? ' callout danger' : '');
    $('#engSpin').hidden = state !== 'loading';
    $('#engRetry').hidden = state !== 'failed';
    renderEngineMsg();
    $('#app').setAttribute('data-engine', state);
    if (state !== 'loading') { var w = engineWaiters; engineWaiters = []; w.forEach(function (fn) { fn(state); }); }
    renderAll();
  }
  function renderEngineMsg() {
    var k = engine === 'ready' ? 'eng_ready' : engine === 'failed' ? 'eng_failed' : 'eng_loading';
    $('#engMsg').textContent = (engine === 'ready' ? '✓ ' : '') + t(k);
  }
  function engineReady() {
    if (engine === 'ready') return Promise.resolve();
    if (engine === 'failed') return Promise.reject(code('engine'));
    return new Promise(function (res, rej) { engineWaiters.push(function (s) { s === 'ready' ? res() : rej(code('engine')); }); });
  }
  function startEngine() {
    setEngine('loading');
    Promise.all([
      loadScript(LIB.pdflib, function () { return !!window.PDFLib; }),
      loadScript(LIB.pdfjs, function () { return !!window.pdfjsLib; })
    ]).then(function () {
      /* A Blob worker that imports the CDN worker: works on https and from a downloaded folder (file://). */
      if (!pdfWorker) {
        var blob = new Blob(["importScripts('" + LIB.worker + "');"], { type: 'application/javascript' });
        var url = URL.createObjectURL(blob);
        /* pdf.js's own fallback path wraps a cross-origin workerSrc in a Blob by itself, so give it the CDN URL. */
        pdfjsLib.GlobalWorkerOptions.workerSrc = LIB.worker;
        /* Start the Blob worker ourselves and hand it to pdf.js: pdf.js treats a file:// page as "no origin"
           and would wrap a Blob workerSrc once more, which a downloaded copy can't load. */
        var w = null;
        try { w = new Worker(url, { name: 'pm-worker' }); } catch (e) { w = null; }
        pdfWorker = w ? new pdfjsLib.PDFWorker({ port: w }) : new pdfjsLib.PDFWorker({ name: 'pm-worker' });
      }
      setEngine('ready');
      if (pendingFiles.length) { var later = pendingFiles; pendingFiles = []; addFiles(later); }
      warmOfflineCache();
    }).catch(function (e) {
      console.warn('[' + SLUG + '] engine failed to load:', e && e.message);
      setEngine('failed');
    });
  }
  /* the engine notice already explains what to do: bring it into view instead of repeating it */
  function showEngineProblem() {
    var box = $('#engine');
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    $('#engRetry').focus({ preventScroll: true });
  }
  function ensureZip() { return loadScript(LIB.jszip, function () { return !!window.JSZip; }).catch(function () { throw code('zip'); }); }
  /* The site's service worker keeps CDN files it sees, but on the very first visit these libraries load before
     it controls the page. Put them in its cache now so "works offline after the first visit" is really true. */
  function warmOfflineCache() {
    try {
      if (location.protocol !== 'https:' || !window.caches || !('serviceWorker' in navigator)) return;
      setTimeout(function () {
        caches.open('edu-apps-v1').then(function (c) {
          [LIB.pdflib, LIB.pdfjs, LIB.worker, LIB.jszip].forEach(function (u) {
            c.match(u).then(function (hit) { if (!hit) return c.add(u); }).catch(function () { });
          });
        }).catch(function () { });
      }, 5000);
    } catch (e) { }
  }

  /* ------------------------------------------------------------------ messages */
  function addMsg(kind, key, vars) {
    msgs.push({ id: ++msgSeq, kind: kind, key: key, vars: vars || {} });
    if (msgs.length > 8) msgs.shift();
    renderMsgs();
  }
  function renderMsgs() {
    var box = $('#msgs');
    box.textContent = '';
    msgs.forEach(function (m) {
      var body = el('p', { text: t(m.key, m.vars) });
      /* a locked PDF: offer the sister app that removes the password (also works from a downloaded copy) */
      if (m.key === 'err_locked' || m.key === 'err_owner') body = el('div', { style: { flex: '1 1 auto', minWidth: '0' } }, body,
        el('a', { class: 'btn btn-sm', style: { marginTop: '8px' }, href: '../pdf-compress-convert/index.html?lang=' + EDU.lang + '#unlock', text: '🔓 ' + t('open_unlock') }));
      box.appendChild(el('div', { class: 'callout pm-msg ' + m.kind, role: m.kind === 'danger' ? 'alert' : null },
        body,
        el('button', { class: 'x', type: 'button', 'aria-label': t('dismiss'), title: t('dismiss'), text: '✕', onclick: function () { msgs = msgs.filter(function (x) { return x.id !== m.id; }); renderMsgs(); } })));
    });
  }
  function setBusy(msg) {
    $('#busy').hidden = !msg;
    $('#busyMsg').textContent = msg || '';
  }

  /* ------------------------------------------------------------------ history */
  function snap() { return pages.map(function (p) { return Object.assign({}, p); }); }
  function pushHistory() { history.push(snap()); if (history.length > 60) history.shift(); future = []; dirty = true; lastResult = null; }
  function restore(list) {
    pages = list;
    rebuildIndex();
    selected.forEach(function (id) { if (!byId.has(id)) selected.delete(id); });
  }
  function undo() { if (!history.length) return; future.push(snap()); restore(history.pop()); renderAll(); announce(t('a_undo')); }
  function redo() { if (!future.length) return; history.push(snap()); restore(future.pop()); renderAll(); announce(t('a_redo')); }
  function rebuildIndex() { byId = new Map(); pages.forEach(function (p) { byId.set(p.id, p); }); }

  /* ------------------------------------------------------------------ adding files */
  var addChain = Promise.resolve();
  function addFiles(list) {
    var files = Array.prototype.slice.call(list || []);
    if (!files.length) return addChain;
    addChain = addChain.then(function () { return addFilesSeq(files); });
    return addChain;
  }
  var pendingFiles = [];       /* picked while the engine could not load: added after a successful Retry */
  async function addFilesSeq(files) {
    if (engine !== 'ready') setBusy(t('waiting_engine'));
    try { await engineReady(); } catch (e) { pendingFiles = pendingFiles.concat(files); showEngineProblem(); return; }
    var before = snap(), added = 0;
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      setBusy(t('reading', { name: f.name }));
      try { added += await addOne(f); }
      catch (e) {
        var c = e && e.code;
        var key = c === 'locked' ? 'err_locked' : c === 'empty' ? 'err_empty' : c === 'type' ? 'err_type' : c === 'image' ? 'err_image' : 'err_corrupt';
        if (c === 'owner') key = 'err_owner';
        if (!c) console.warn('[' + SLUG + ']', e);
        addMsg('danger', key, { name: f.name });
      }
      renderAll();
      await tick();
    }
    setBusy('');
    if (added) {
      history.push(before); if (history.length > 60) history.shift(); future = []; dirty = true;
      announce(t('a_added', { n: EDU.fmt(added) }));
      checkBig();
    }
    renderAll();
  }
  async function sniff(f) {
    var head = new Uint8Array(await f.slice(0, 1024).arrayBuffer());
    var s = ''; for (var i = 0; i < head.length; i++) s += String.fromCharCode(head[i]);
    if (s.indexOf('%PDF-') >= 0) return 'pdf';
    if (head[0] === 0xFF && head[1] === 0xD8 && head[2] === 0xFF) return 'jpg';
    if (head[0] === 0x89 && s.slice(1, 4) === 'PNG') return 'png';
    if (s.slice(0, 4) === 'RIFF' && s.slice(8, 12) === 'WEBP') return 'webp';
    if (/\.pdf$/i.test(f.name) || f.type === 'application/pdf') return 'badpdf';
    return '';
  }
  async function addOne(f) {
    if (!f.size) throw code('empty');
    var kind = await sniff(f);
    if (kind === 'pdf') return addPdf(f);
    if (kind === 'badpdf') throw code('corrupt');
    if (kind) return addImage(f, kind);
    throw code('type');
  }
  function newSource(o) {
    o.id = ++srcSeq;
    o.color = (colorSeq++ % 7) + 1;
    sources.set(o.id, o);
    return o;
  }
  async function addPdf(f) {
    var buf = new Uint8Array(await f.arrayBuffer());   /* pdf.js takes ownership of this copy */
    var doc;
    try {
      doc = await pdfjsLib.getDocument({
        data: buf, worker: pdfWorker, isEvalSupported: false, cMapUrl: LIB.cmaps, cMapPacked: true,
        standardFontDataUrl: LIB.fonts, disableAutoFetch: true
      }).promise;
    } catch (e) {
      if (e && e.name === 'PasswordException') throw code('locked');
      throw code('corrupt');
    }
    /* Encrypted with only an owner password (opens without a password, but pdf-lib can't copy encrypted pages). */
    var perms = await doc.getPermissions().catch(function () { return null; });
    if (perms) { doc.destroy(); throw code('owner'); }
    var n = doc.numPages;
    if (!n) { doc.destroy(); throw code('corrupt'); }
    var src = newSource({ kind: 'pdf', name: f.name, file: f, size: f.size, pdf: doc, count: n, lib: null });
    var list = [];
    for (var i = 1; i <= n; i++) {
      var pg;
      try { pg = await doc.getPage(i); } catch (e) { pg = null; }
      var vp = pg ? pg.getViewport({ scale: 1 }) : { width: A4[0], height: A4[1] };
      list.push({ id: ++pageSeq, src: src.id, kind: 'pdf', idx: i - 1, base: pg ? norm(pg.rotate) : 0, rot: 0, w: vp.width, h: vp.height });
      if (n > 30 && i % 25 === 0) { setBusy(t('reading_pages', { name: f.name, i: EDU.fmt(i), n: EDU.fmt(n) })); await tick(); }
    }
    list.forEach(function (p) { pages.push(p); byId.set(p.id, p); });
    return n;
  }

  /* JPEG EXIF orientation (1 = normal). Phone photos often carry 6 or 8. */
  function exifOrientation(b) {
    if (b[0] !== 0xFF || b[1] !== 0xD8) return 1;
    var i = 2;
    while (i + 4 < b.length) {
      if (b[i] !== 0xFF) return 1;
      var m = b[i + 1], len = (b[i + 2] << 8) | b[i + 3];
      if (m === 0xE1 && b[i + 4] === 0x45 && b[i + 5] === 0x78 && b[i + 6] === 0x69 && b[i + 7] === 0x66) {
        var o = i + 10, le = b[o] === 0x49;
        var r16 = function (p) { return le ? b[p] | (b[p + 1] << 8) : (b[p] << 8) | b[p + 1]; };
        var r32 = function (p) { return le ? (b[p] | (b[p + 1] << 8) | (b[p + 2] << 16)) + b[p + 3] * 16777216 : b[p] * 16777216 + ((b[p + 1] << 16) | (b[p + 2] << 8) | b[p + 3]); };
        var ifd = o + r32(o + 4), cnt = r16(ifd);
        for (var k = 0; k < cnt; k++) { var e = ifd + 2 + k * 12; if (e + 10 > b.length) break; if (r16(e) === 0x0112) return r16(e + 8) || 1; }
        return 1;
      }
      if (m === 0xDA || m === 0xD9) return 1;
      i += 2 + len;
    }
    return 1;
  }
  function loadImg(url) {
    return new Promise(function (res, rej) {
      var im = new Image();
      im.onload = function () { res(im); };
      im.onerror = function () { rej(code('image')); };
      im.src = url;
    });
  }
  function canvasBlob(cv, type, q) { return new Promise(function (res) { cv.toBlob(function (b) { res(b); }, type, q); }); }
  /* Re-encode an image through a canvas (applies EXIF rotation, converts WebP, limits huge photos). */
  async function reencode(im, keepAlpha) {
    var w = im.naturalWidth || im.width, h = im.naturalHeight || im.height, s = Math.min(1, 5000 / Math.max(w, h));
    var cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.round(w * s)); cv.height = Math.max(1, Math.round(h * s));
    var cx = cv.getContext('2d');
    if (!keepAlpha) { cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); }
    cx.drawImage(im, 0, 0, cv.width, cv.height);
    var b = await canvasBlob(cv, keepAlpha ? 'image/png' : 'image/jpeg', 0.92);
    if (!b) throw code('image');
    return { bytes: new Uint8Array(await b.arrayBuffer()), type: keepAlpha ? 'png' : 'jpg', w: cv.width, h: cv.height };
  }
  async function addImage(f, kind) {
    var bytes = new Uint8Array(await f.arrayBuffer());
    var mime = kind === 'png' ? 'image/png' : kind === 'webp' ? 'image/webp' : 'image/jpeg';
    var url = URL.createObjectURL(new Blob([bytes], { type: mime }));
    var im;
    try { im = await loadImg(url); } catch (e) { URL.revokeObjectURL(url); throw code('image'); }
    var info = { bytes: bytes, type: kind === 'png' ? 'png' : 'jpg', w: im.naturalWidth, h: im.naturalHeight };
    if (!info.w || !info.h) { URL.revokeObjectURL(url); throw code('image'); }
    if (kind === 'webp' || (kind === 'jpg' && exifOrientation(bytes) !== 1)) {
      info = await reencode(im, kind === 'webp');
      URL.revokeObjectURL(url);
      url = URL.createObjectURL(new Blob([info.bytes], { type: info.type === 'png' ? 'image/png' : 'image/jpeg' }));
    }
    var src = newSource({ kind: 'image', name: f.name, file: f, size: f.size, count: 1, img: info, url: url });
    var d = imagePage(src);
    var p = { id: ++pageSeq, src: src.id, kind: 'image', idx: 0, base: 0, rot: 0, w: d.w, h: d.h };
    pages.push(p); byId.set(p.id, p);
    return 1;
  }
  /* Page size + where the photo sits on it, for the chosen "photo pages" mode. */
  function imagePage(src) {
    var iw = src.img.w, ih = src.img.h, w, h, m;
    if (S.img === 'fit') {
      var s = 0.75; if (Math.max(iw, ih) * s > 1684) s = 1684 / Math.max(iw, ih);
      w = Math.max(72, iw * s); h = Math.max(72, ih * s);
      return { w: w, h: h, rect: { x: 0, y: 0, width: w, height: h } };
    }
    var land = S.img === 'a4' && iw > ih;
    w = land ? A4[1] : A4[0]; h = land ? A4[0] : A4[1]; m = 28;
    var k = Math.min((w - 2 * m) / iw, (h - 2 * m) / ih);
    var rw = iw * k, rh = ih * k;
    /* small photos (like an ID card) sit at the top, big ones are centred */
    var y = rh < h * 0.5 ? h - m - rh : (h - rh) / 2;
    return { w: w, h: h, rect: { x: (w - rw) / 2, y: y, width: rw, height: rh } };
  }
  function refreshImagePages() {
    pages.forEach(function (p) { if (p.kind === 'image') { var d = imagePage(sources.get(p.src)); p.w = d.w; p.h = d.h; } });
    history.forEach(function (list) { list.forEach(function (p) { if (p.kind === 'image' && sources.has(p.src)) { var d = imagePage(sources.get(p.src)); p.w = d.w; p.h = d.h; } }); });
  }
  function checkBig() {
    var bytes = 0, used = new Set();
    pages.forEach(function (p) { if (p.src) used.add(p.src); });
    used.forEach(function (id) { bytes += sources.get(id).size || 0; });
    if (pages.length > BIG_PAGES || bytes > BIG_BYTES) {
      msgs = msgs.filter(function (m) { return m.key !== 'warn_big'; });
      addMsg('warning', 'warn_big', { pages: EDU.fmt(pages.length), size: fmtSize(bytes) });
    }
  }

  function removeSource(id) {
    var src = sources.get(id); if (!src) return;
    pages = pages.filter(function (p) { return p.src !== id; });
    rebuildIndex();
    selected.forEach(function (pid) { if (!byId.has(pid)) selected.delete(pid); });
    history = []; future = [];     /* undo can't bring back a removed file */
    if (src.pdf) try { src.pdf.destroy(); } catch (e) { }
    if (src.url) URL.revokeObjectURL(src.url);
    src.lib = null;
    sources.delete(id);
    Array.from(thumbs.keys()).forEach(function (k) { if (k.indexOf('s' + id + ':') === 0) thumbs.delete(k); });
    renderAll();
  }
  function removeAll() {
    Array.from(sources.keys()).forEach(function (id) { var s = sources.get(id); if (s.pdf) try { s.pdf.destroy(); } catch (e) { } if (s.url) URL.revokeObjectURL(s.url); });
    sources.clear(); pages = []; byId.clear(); selected.clear(); history = []; future = []; thumbs.clear(); pendingFiles = [];
    msgs = msgs.filter(function (m) { return m.key !== 'warn_big'; });
    lastResult = null; dirty = false;
    if (engine !== 'ready') setBusy('');
    renderAll(); renderMsgs();
  }

  /* ------------------------------------------------------------------ samples (shapes only, no words) */
  async function makeSamples() {
    try { await engineReady(); } catch (e) { showEngineProblem(); return; }
    var L = PDFLib;
    async function sample(sizes, hue, startNo) {
      var d = await L.PDFDocument.create({ updateMetadata: false });
      var font = await d.embedFont(L.StandardFonts.HelveticaBold);
      var col = hue === 0 ? L.rgb(0.04, 0.31, 0.36) : L.rgb(0.85, 0.31, 0.11);
      var soft = hue === 0 ? L.rgb(0.86, 0.94, 0.94) : L.rgb(0.99, 0.9, 0.85);
      var grey = L.rgb(0.82, 0.82, 0.84);
      sizes.forEach(function (sz, i) {
        var p = d.addPage(sz), w = sz[0], h = sz[1];
        p.drawRectangle({ x: 0, y: h - 90, width: w, height: 90, color: col });
        p.drawCircle({ x: 60, y: h - 45, size: 24, color: L.rgb(1, 1, 1), opacity: 0.9 });
        p.drawRectangle({ x: 100, y: h - 52, width: 180, height: 14, color: L.rgb(1, 1, 1), opacity: 0.85 });
        for (var r = 0; r < 6; r++) p.drawRectangle({ x: 40, y: h - 140 - r * 22, width: (w - 80) * (r % 3 === 2 ? 0.6 : 0.95), height: 9, color: grey });
        var ty = h - 300, rows = 5, cols = 4, tw = w - 80, rh = 26;
        p.drawRectangle({ x: 40, y: ty - rows * rh, width: tw, height: rows * rh, color: soft, borderColor: col, borderWidth: 1 });
        for (var k = 1; k < rows; k++) p.drawLine({ start: { x: 40, y: ty - k * rh }, end: { x: 40 + tw, y: ty - k * rh }, thickness: 0.6, color: col });
        for (var c = 1; c < cols; c++) p.drawLine({ start: { x: 40 + c * tw / cols, y: ty }, end: { x: 40 + c * tw / cols, y: ty - rows * rh }, thickness: 0.6, color: col });
        var label = String(startNo + i), fs = Math.min(w, h) * 0.32;
        var tw2 = font.widthOfTextAtSize(label, fs);
        p.drawText(label, { x: (w - tw2) / 2, y: Math.max(40, ty - rows * rh - fs - 20), size: fs, font: font, color: col, opacity: 0.25 });
      });
      return d.save();
    }
    var A5 = [419.53, 595.28];
    var a = await sample([A4, A4], 0, 1);
    var b = await sample([A4, [A4[1], A4[0]], A5], 1, 1);
    var files = [
      new File([a], t('sample_name', { n: 'A' }) + '.pdf', { type: 'application/pdf' }),
      new File([b], t('sample_name', { n: 'B' }) + '.pdf', { type: 'application/pdf' })
    ];
    return addFiles(files);
  }

  /* ------------------------------------------------------------------ thumbnails */
  function thumbPx() {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var want = S.thumb * 1.18 * dpr;
    var buckets = [180, 260, 360, 520];
    for (var i = 0; i < buckets.length; i++) if (want <= buckets[i]) return buckets[i];
    return 520;
  }
  function thumbKey(p) {
    var px = thumbPx();
    if (p.kind === 'pdf') return 's' + p.src + ':' + p.idx + '@' + px;
    if (p.kind === 'image') return 's' + p.src + ':img:' + S.img + '@' + px;
    return 'blank:' + Math.round(p.w) + 'x' + Math.round(p.h) + '@' + px;
  }
  var wanted = new Set(), pumping = false;
  function want(p) { wanted.add(p.id); pump(); }
  async function pump() {
    if (pumping) return;
    pumping = true;
    try {
      while (wanted.size) {
        var id = wanted.values().next().value; wanted.delete(id);
        var p = byId.get(id); if (!p) continue;
        var key = thumbKey(p);
        if (!thumbs.has(key)) {
          var cv;
          try { cv = await renderBase(p, thumbPx()); } catch (e) { cv = errorThumb(p); }
          thumbs.set(key, cv);
          trimThumbs();
        }
        cards.forEach(function (c, cid) { var q = byId.get(cid); if (q && c._vis && thumbKey(q) === key) drawCard(c, q); });
        if (id === (pages[0] && pages[0].id)) drawStampPreview();
      }
    } finally { pumping = false; }
  }
  /* Draws a page (without the user's extra rotation) into a new canvas whose longer side is `px`. */
  async function renderBase(p, px) {
    var cv = document.createElement('canvas'), cx;
    if (p.kind === 'pdf') {
      var src = sources.get(p.src);
      var pg = await src.pdf.getPage(p.idx + 1);
      var v1 = pg.getViewport({ scale: 1 });
      var vp = pg.getViewport({ scale: px / Math.max(v1.width, v1.height) });
      cv.width = Math.max(1, Math.ceil(vp.width)); cv.height = Math.max(1, Math.ceil(vp.height));
      cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
      await pg.render({ canvasContext: cx, viewport: vp }).promise;
      pg.cleanup();
      return cv;
    }
    var s = px / Math.max(p.w, p.h);
    cv.width = Math.max(1, Math.round(p.w * s)); cv.height = Math.max(1, Math.round(p.h * s));
    cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
    if (p.kind === 'image') {
      var srcI = sources.get(p.src), d = imagePage(srcI), im = await loadImg(srcI.url);
      cx.drawImage(im, d.rect.x * s, (d.h - d.rect.y - d.rect.height) * s, d.rect.width * s, d.rect.height * s);
    }
    return cv;
  }
  function errorThumb(p) {
    var s = 180 / Math.max(p.w, p.h), cv = document.createElement('canvas');
    cv.width = Math.round(p.w * s); cv.height = Math.round(p.h * s);
    var cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
    cx.fillStyle = '#b42318'; cx.font = '40px sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.fillText('⚠', cv.width / 2, cv.height / 2);
    return cv;
  }
  /* Draw base canvas `b` into canvas `cv`, turned by `rot` degrees clockwise. */
  function drawRotated(cv, b, rot) {
    var sw = rot % 180 !== 0;
    cv.width = sw ? b.height : b.width; cv.height = sw ? b.width : b.height;
    var cx = cv.getContext('2d');
    cx.save(); cx.translate(cv.width / 2, cv.height / 2); cx.rotate(rot * Math.PI / 180);
    cx.drawImage(b, -b.width / 2, -b.height / 2); cx.restore();
  }
  function drawCard(c, p) {
    var cv = c._cv, key = thumbKey(p), b = thumbs.get(key), tag = key + '|' + p.rot;
    if (b) {
      c.classList.remove('loading');
      if (thumbs.size > THUMB_CAP / 2) { thumbs.delete(key); thumbs.set(key, b); }   /* mark as recently used */
      if (c._drawn === tag) return;
      drawRotated(cv, b, p.rot);
      c._drawn = tag;
    } else {
      var sw = p.rot % 180 !== 0, w = sw ? p.h : p.w, h = sw ? p.w : p.h, s = thumbPx() / Math.max(w, h);
      if (c._drawn !== 'ph' + w + 'x' + h) {
        cv.width = Math.max(1, Math.round(w * s)); cv.height = Math.max(1, Math.round(h * s));
        var cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
        c._drawn = 'ph' + w + 'x' + h;
      }
      c.classList.add('loading');
      want(p);
    }
  }
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var c = en.target; c._vis = en.isIntersecting;
      if (en.isIntersecting) { var p = byId.get(+c.dataset.id); if (p) drawCard(c, p); }
      else if (cards.size > 80) releaseCard(c);
    });
  }, { rootMargin: '400px 0px' }) : null;
  /* Long documents on a phone: free the pixels of cards far off screen (they are redrawn from the cache, or
     re-rendered, before they scroll back into view), and keep at most THUMB_CAP rendered pages in the cache. */
  var THUMB_CAP = 160;
  function releaseCard(c) {
    if (!c._drawn || !c._cv) return;
    c._cv.width = 1; c._cv.height = 1; c._drawn = null;
  }
  function trimThumbs() {
    if (thumbs.size <= THUMB_CAP) return;
    var keep = new Set();
    cards.forEach(function (c, id) { var q = byId.get(id); if (q && c._vis) keep.add(thumbKey(q)); });
    if (pages[0]) keep.add(thumbKey(pages[0]));      /* used by the stamp preview */
    var it = thumbs.keys(), k;
    while (thumbs.size > THUMB_CAP && !(k = it.next()).done) if (!keep.has(k.value)) thumbs.delete(k.value);
  }

  /* ------------------------------------------------------------------ grid */
  function makeCard(p) {
    var cv = el('canvas');
    var chk = el('input', { type: 'checkbox', tabindex: '-1' });
    var c = el('div', { class: 'pg', role: 'listitem', tabindex: '-1', dataset: { id: String(p.id) } },
      el('div', { class: 'pg-head' },
        el('label', { class: 'pg-check' }, chk),
        el('span', { class: 'pg-num' }),
        el('span', { class: 'pg-grip', 'aria-hidden': 'true', text: '⠿' })),
      el('div', { class: 'pg-thumb' }, cv, el('span', { class: 'pg-rot', hidden: true })),
      el('div', { class: 'pg-src' }, el('i', { class: 'dot', 'aria-hidden': 'true' }), el('span', { class: 'nm' })),
      el('div', { class: 'pg-act' },
        el('button', { class: 'pg-btn', type: 'button', tabindex: '-1', dataset: { act: 'rotL1' }, text: '⟲' }),
        el('button', { class: 'pg-btn', type: 'button', tabindex: '-1', dataset: { act: 'rotR1' }, text: '⟳' }),
        el('button', { class: 'pg-btn', type: 'button', tabindex: '-1', dataset: { act: 'view1' }, text: '🔍' }),
        el('button', { class: 'pg-btn danger', type: 'button', tabindex: '-1', dataset: { act: 'del1' }, text: '✕' })));
    c._cv = cv; c._chk = chk;
    cards.set(p.id, c);
    if (io) io.observe(c); else c._vis = true;
    return c;
  }
  function srcLabel(p) {
    if (p.kind === 'blank') return t('blank_page');
    var s = sources.get(p.src);
    return s ? s.name + (s.kind === 'pdf' && s.count > 1 ? ' · ' + (p.idx + 1) : '') : '';
  }
  function updateCard(c, p, i) {
    var s = p.src ? sources.get(p.src) : null;
    c.className = 'pg s' + (s ? s.color : 0) + (selected.has(p.id) ? ' sel' : '') + (c.classList.contains('loading') ? ' loading' : '');
    c.querySelector('.pg-num').textContent = EDU.fmt(i + 1);
    var nm = c.querySelector('.pg-src .nm');
    nm.textContent = srcLabel(p);
    nm.className = 'nm' + (p.kind === 'blank' ? '' : ' no-i18n');
    nm.title = srcLabel(p);
    var lab = t('card_label', { n: EDU.fmt(i + 1), file: p.kind === 'blank' ? t('blank_page') : (s ? s.name : ''), p: EDU.fmt(p.idx + 1) });
    c.setAttribute('aria-label', lab);
    c._chk.checked = selected.has(p.id);
    c._chk.setAttribute('aria-label', t('select_page', { n: EDU.fmt(i + 1) }));
    var rt = c.querySelector('.pg-rot'); rt.hidden = !p.rot; rt.textContent = p.rot ? p.rot + '°' : '';
    c.querySelector('.pg-grip').title = t('drag_hint');
    var bt = c.querySelectorAll('.pg-btn');
    [['rot_left'], ['rot_right'], ['preview'], ['delete']].forEach(function (k, j) { bt[j].setAttribute('aria-label', t(k[0])); bt[j].title = t(k[0]); });
    c.tabIndex = p.id === focusId ? 0 : -1;
    if (c._vis) drawCard(c, p);
  }
  function renderGrid() {
    var grid = $('#grid');
    var keep = new Set();
    if (focusId && !byId.has(focusId)) focusId = null;
    if (!focusId && pages.length) focusId = pages[0].id;
    var empty = $('#gridEmpty', grid);
    if (!pages.length) {
      if (!empty) { empty = el('div', { class: 'pm-empty', id: 'gridEmpty' }); grid.appendChild(empty); }
      empty.textContent = t('empty_grid');
    } else if (empty) empty.remove();
    pages.forEach(function (p, i) {
      var c = cards.get(p.id) || makeCard(p);
      keep.add(p.id);
      updateCard(c, p, i);
      if (grid.children[i] !== c) grid.insertBefore(c, grid.children[i] || null);
    });
    cards.forEach(function (c, id) {
      if (!keep.has(id)) { if (io) io.unobserve(c); c.remove(); cards.delete(id); }
    });
    grid.style.setProperty('--thumb', S.thumb + 'px');
    grid.hidden = !pages.length && !sources.size;
  }

  function renderFiles() {
    var box = $('#fileList');
    box.textContent = '';
    box.hidden = !sources.size;
    if (!sources.size) return;
    var used = {};
    pages.forEach(function (p) { if (p.src) used[p.src] = (used[p.src] || 0) + 1; });
    sources.forEach(function (s) {
      var n = used[s.id] || 0;
      box.appendChild(el('span', { class: 'pm-file s' + s.color + (n ? '' : ' unused') },
        el('button', { class: 'pm-file-name', type: 'button', title: t('sel_file'), onclick: function () { selectSource(s.id); } },
          el('i', { class: 'dot', 'aria-hidden': 'true' }),
          el('span', { class: 'nm no-i18n', text: s.name }),
          el('span', { class: 'inf', text: (n ? pagesTxt(n) : t('not_used')) + ' · ' + fmtSize(s.size) })),
        el('button', { class: 'x', type: 'button', 'aria-label': t('remove_file') + ': ' + s.name, title: t('remove_file'), text: '✕', disabled: busy, onclick: function () { removeSource(s.id); } })));
    });
    if (sources.size > 1) box.appendChild(el('button', { class: 'btn btn-sm btn-ghost', type: 'button', text: t('remove_all'), disabled: busy, onclick: function () { if (confirm(t('confirm_remove_all'))) removeAll(); } }));
  }
  function selectSource(id) {
    selected.clear();
    pages.forEach(function (p) { if (p.src === id) selected.add(p.id); });
    var first = pages.filter(function (p) { return p.src === id; })[0];
    if (first) { focusId = first.id; anchorId = first.id; }
    renderAll();
    if (first && cards.get(first.id)) cards.get(first.id).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function renderToolbar() {
    var has = pages.length > 0, n = selected.size;
    $('#toolbar').hidden = !has;
    $('#drop').classList.toggle('compact', has || sources.size > 0);
    document.body.classList.toggle('pm-has-pages', has);
    var txt = n ? t('count_sel', { n: EDU.fmt(n), total: EDU.fmt(pages.length) }) : t('count_none', { total: EDU.fmt(pages.length) });
    $('#countTxt').textContent = has ? txt : '';
    $$('[data-need="sel"]').forEach(function (b) { b.disabled = !n || busy; });
    $$('[data-act="rotL"],[data-act="rotR"],[data-act="blank"],[data-act="reverse"],[data-act="selAll"]').forEach(function (b) { b.disabled = !has || busy; });
    $$('[data-act="selNone"]').forEach(function (b) { b.disabled = !n; });
    $('#undoBtn').disabled = !history.length || busy;
    $('#redoBtn').disabled = !future.length || busy;
    $('#zoom').value = S.thumb;
    $('#mCount').textContent = n ? '✓ ' + EDU.fmt(n) : pagesTxt(pages.length);
    $('#mSelActs').hidden = !n;
    $('#mExport').hidden = !!n;
    $$('#mSelActs .tb').forEach(function (b) { b.disabled = busy; });
  }

  /* ------------------------------------------------------------------ selection + actions */
  function inOrderSelected() { return pages.filter(function (p) { return selected.has(p.id); }); }
  function toggleSel(id, on) {
    if (on === undefined) on = !selected.has(id);
    if (on) selected.add(id); else selected.delete(id);
  }
  function rangeSel(fromId, toId) {
    var a = pages.findIndex(function (p) { return p.id === fromId; }), b = pages.findIndex(function (p) { return p.id === toId; });
    if (a < 0 || b < 0) return;
    if (a > b) { var x = a; a = b; b = x; }
    for (var i = a; i <= b; i++) selected.add(pages[i].id);
  }
  function rotateIds(ids, by) {
    if (!ids.length) return;
    pushHistory();
    ids.forEach(function (id) { var p = byId.get(id); if (p) p.rot = norm(p.rot + by); });
    renderAll(); announce(t('a_rotated'));
  }
  function deleteIds(ids) {
    if (!ids.length) return;
    pushHistory();
    var set = new Set(ids);
    var firstIdx = pages.findIndex(function (p) { return set.has(p.id); });
    pages = pages.filter(function (p) { return !set.has(p.id); });
    rebuildIndex();
    ids.forEach(function (id) { selected.delete(id); });
    if (set.has(focusId)) focusId = pages.length ? pages[Math.min(firstIdx, pages.length - 1)].id : null;
    renderAll(); announce(t('a_deleted', { n: EDU.fmt(ids.length) }));
    focusCard();
  }
  function duplicateIds(ids) {
    if (!ids.length) return;
    pushHistory();
    var set = new Set(ids), out = [];
    pages.forEach(function (p) {
      out.push(p);
      if (set.has(p.id)) { var q = Object.assign({}, p, { id: ++pageSeq }); out.push(q); }
    });
    pages = out; rebuildIndex();
    renderAll(); announce(t('a_dup'));
  }
  function insertBlank() {
    var sel = inOrderSelected(), ref = sel.length ? sel[sel.length - 1] : (byId.get(focusId) || pages[pages.length - 1]);
    var w = A4[0], h = A4[1];
    if (ref) { var sw = ref.rot % 180 !== 0; w = sw ? ref.h : ref.w; h = sw ? ref.w : ref.h; }
    pushHistory();
    var p = { id: ++pageSeq, src: 0, kind: 'blank', idx: 0, base: 0, rot: 0, w: w, h: h };
    var at = sel.length ? pages.indexOf(ref) + 1 : pages.length;
    pages.splice(at, 0, p); byId.set(p.id, p);
    focusId = p.id;
    renderAll(); announce(t('a_moved', { n: EDU.fmt(at + 1) }));
    var c = cards.get(p.id); if (c) c.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function reverse() {
    if (pages.length < 2) return;
    pushHistory();
    var sel = inOrderSelected();
    if (sel.length >= 2) {
      var pos = []; pages.forEach(function (p, i) { if (selected.has(p.id)) pos.push(i); });
      var rev = sel.slice().reverse();
      pos.forEach(function (i, k) { pages[i] = rev[k]; });
    } else pages.reverse();
    rebuildIndex(); renderAll();
  }
  /* Move each selected block one step (dir -1 earlier, +1 later). */
  function stepMove(ids, dir) {
    var set = new Set(ids);
    if (!ids.length) return;
    pushHistory();
    var i, tmp;
    if (dir < 0) { for (i = 1; i < pages.length; i++) if (set.has(pages[i].id) && !set.has(pages[i - 1].id)) { tmp = pages[i]; pages[i] = pages[i - 1]; pages[i - 1] = tmp; } }
    else { for (i = pages.length - 2; i >= 0; i--) if (set.has(pages[i].id) && !set.has(pages[i + 1].id)) { tmp = pages[i]; pages[i] = pages[i + 1]; pages[i + 1] = tmp; } }
    renderAll();
    var at = pages.findIndex(function (p) { return set.has(p.id); });
    announce(t('a_moved', { n: EDU.fmt(at + 1) }));
  }
  /* Move ids (kept in their current order) so that they start at index `to` of the remaining list. */
  function moveTo(ids, to) {
    var set = new Set(ids);
    var moving = pages.filter(function (p) { return set.has(p.id); });
    var rest = pages.filter(function (p) { return !set.has(p.id); });
    to = EDU.clamp(to, 0, rest.length);
    var next = rest.slice(0, to).concat(moving, rest.slice(to));
    if (next.every(function (p, i) { return p === pages[i]; })) return false;
    pushHistory();
    pages = next;
    renderAll(); announce(t('a_moved', { n: EDU.fmt(to + 1) }));
    return true;
  }
  function targetIdsFor(card) {
    var id = +card.dataset.id;
    return selected.has(id) ? inOrderSelected().map(function (p) { return p.id; }) : [id];
  }
  function selOrAll() {
    var s = inOrderSelected();
    return (s.length ? s : pages).map(function (p) { return p.id; });
  }

  var ACTIONS = {
    add: function () { $('#fileInput').click(); },
    selAll: function () { pages.forEach(function (p) { selected.add(p.id); }); renderAll(); },
    selNone: function () { selected.clear(); renderAll(); },
    rotL: function () { if (!selected.size) EDU.toast(t('hint_rotate_all')); rotateIds(selOrAll(), -90); },
    rotR: function () { if (!selected.size) EDU.toast(t('hint_rotate_all')); rotateIds(selOrAll(), 90); },
    back: function () { stepMove(inOrderSelected().map(function (p) { return p.id; }), -1); },
    fwd: function () { stepMove(inOrderSelected().map(function (p) { return p.id; }), 1); },
    dup: function () { duplicateIds(inOrderSelected().map(function (p) { return p.id; })); },
    del: function () { deleteIds(inOrderSelected().map(function (p) { return p.id; })); },
    blank: insertBlank, reverse: reverse, undo: undo, redo: redo,
    toExport: function () { $('#exportCard').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b || b.disabled || busy) return;
    var act = b.dataset.act, card = b.closest('.pg');
    if (card) {
      var id = +card.dataset.id;
      focusId = id;
      if (act === 'rotL1') rotateIds([id], -90);
      else if (act === 'rotR1') rotateIds([id], 90);
      else if (act === 'del1') deleteIds([id]);
      else if (act === 'view1') openPreview(id);
      return;
    }
    if (ACTIONS[act]) ACTIONS[act]();
  });

  /* clicks on a card: select / range-select */
  var suppressClick = false;
  $('#grid').addEventListener('click', function (e) {
    if (suppressClick) { suppressClick = false; e.preventDefault(); return; }
    var c = e.target.closest('.pg');
    if (!c || e.target.closest('[data-act]') || busy) return;
    var id = +c.dataset.id;
    if (e.target.closest('label') && e.target.tagName !== 'INPUT') return;   /* the label forwards to its checkbox */
    if (e.target.tagName === 'INPUT') {
      if (e.shiftKey && anchorId) rangeSel(anchorId, id); else toggleSel(id, e.target.checked);
    } else if (e.shiftKey && anchorId) {
      rangeSel(anchorId, id);
    } else toggleSel(id);
    anchorId = id; focusId = id;
    renderAll();
  });
  $('#grid').addEventListener('dblclick', function (e) {
    var c = e.target.closest('.pg');
    if (c && !e.target.closest('button,label')) openPreview(+c.dataset.id);
  });

  /* ------------------------------------------------------------------ keyboard */
  function focusCard() {
    var c = focusId && cards.get(focusId);
    if (c) { c.tabIndex = 0; c.focus({ preventScroll: false }); c.scrollIntoView({ block: 'nearest' }); }
  }
  function columns() {
    var cs = $$('#grid .pg');
    if (cs.length < 2) return 1;
    var top = cs[0].offsetTop, n = 0;
    for (var i = 0; i < cs.length && cs[i].offsetTop === top; i++) n++;
    return Math.max(1, n);
  }
  $('#grid').addEventListener('focusin', function (e) {
    var c = e.target.closest('.pg'); if (!c) return;
    var id = +c.dataset.id;
    if (focusId !== id) { var old = cards.get(focusId); if (old) old.tabIndex = -1; focusId = id; c.tabIndex = 0; }
  });
  $('#grid').addEventListener('keydown', function (e) {
    var c = e.target.closest('.pg');
    if (!c || e.target !== c || busy) return;
    var id = +c.dataset.id, i = pages.findIndex(function (p) { return p.id === id; });
    if (i < 0) return;
    var k = e.key, ctrl = e.ctrlKey || e.metaKey, step = 0;
    var fwdKey = isRTL() ? 'ArrowLeft' : 'ArrowRight', backKey = isRTL() ? 'ArrowRight' : 'ArrowLeft';
    if (k === fwdKey) step = 1; else if (k === backKey) step = -1;
    else if (k === 'ArrowDown') step = columns(); else if (k === 'ArrowUp') step = -columns();
    if (step) {
      e.preventDefault();
      if (ctrl) {
        var ids = targetIdsFor(c);
        var rest = pages.filter(function (p) { return ids.indexOf(p.id) < 0; });
        var firstPos = pages.findIndex(function (p) { return ids.indexOf(p.id) >= 0; });
        moveTo(ids, EDU.clamp(firstPos + step, 0, rest.length));
        focusId = id; focusCard();
      } else {
        var j = EDU.clamp(i + step, 0, pages.length - 1);
        focusId = pages[j].id;
        if (e.shiftKey) { selected.add(id); selected.add(focusId); }
        renderToolbar(); updateTabStops(); focusCard();
        if (e.shiftKey) renderAll();
      }
      return;
    }
    if (k === 'Home' || k === 'End') {
      e.preventDefault();
      if (ctrl) { moveTo(targetIdsFor(c), k === 'Home' ? 0 : pages.length); focusId = id; }
      else focusId = pages[k === 'Home' ? 0 : pages.length - 1].id;
      updateTabStops(); focusCard(); return;
    }
    if (k === ' ' || k === 'Spacebar') { e.preventDefault(); toggleSel(id); anchorId = id; renderAll(); focusCard(); return; }
    if (k === 'Enter') { e.preventDefault(); openPreview(id); return; }
    if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); focusId = id; deleteIds(targetIdsFor(c)); return; }
    if (!ctrl && (k === 'r' || k === 'R')) { e.preventDefault(); rotateIds(targetIdsFor(c), e.shiftKey ? -90 : 90); focusCard(); return; }
    if (!ctrl && (k === 'd' || k === 'D')) { e.preventDefault(); duplicateIds(targetIdsFor(c)); focusCard(); return; }
    if (ctrl && (k === 'a' || k === 'A')) { e.preventDefault(); ACTIONS.selAll(); focusCard(); return; }
    if (k === 'Escape' && selected.size) { e.preventDefault(); ACTIONS.selNone(); focusCard(); }
  });
  function updateTabStops() { cards.forEach(function (c, id) { c.tabIndex = id === focusId ? 0 : -1; }); }
  document.addEventListener('keydown', function (e) {
    if (!(e.ctrlKey || e.metaKey) || busy) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
    if (document.querySelector('.edu-modal')) return;
    var k = e.key.toLowerCase();
    if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
  });

  /* ------------------------------------------------------------------ drag to reorder (pointer events) */
  var drag = null;
  $('#grid').addEventListener('pointerdown', function (e) {
    if (busy || e.button !== 0) return;
    var c = e.target.closest('.pg'); if (!c) return;
    var onGrip = !!e.target.closest('.pg-grip');
    if (e.target.closest('button,input,label')) return;
    if (e.pointerType !== 'mouse' && !onGrip) return;   /* touch: drag only by the ⠿ handle, so the page can scroll */
    drag = { id: +c.dataset.id, card: c, x: e.clientX, y: e.clientY, pid: e.pointerId, on: false, grip: onGrip };
    if (onGrip) e.preventDefault();
  });
  window.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.pid) return;
    if (!drag.on) {
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 7) return;
      startDrag(e);
    }
    e.preventDefault();
    drag.lx = e.clientX; drag.ly = e.clientY;
    drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px';
    findDrop(e.clientX, e.clientY);
  }, { passive: false });
  window.addEventListener('pointerup', function (e) { if (drag && e.pointerId === drag.pid) endDrag(true); });
  window.addEventListener('pointercancel', function (e) { if (drag && e.pointerId === drag.pid) endDrag(false); });
  window.addEventListener('keydown', function (e) { if (drag && drag.on && e.key === 'Escape') endDrag(false); });
  function startDrag(e) {
    drag.on = true;
    drag.ids = targetIdsFor(drag.card);
    drag.ids.forEach(function (id) { var c = cards.get(id); if (c) c.classList.add('ghosted'); });
    var src = drag.card._cv, g = el('canvas');
    g.width = src.width; g.height = src.height; g.getContext('2d').drawImage(src, 0, 0);
    drag.ghost = el('div', { class: 'pm-ghost', 'aria-hidden': 'true' }, g, drag.ids.length > 1 ? el('span', { class: 'n', text: EDU.fmt(drag.ids.length) }) : null);
    document.body.appendChild(drag.ghost);
    document.body.classList.add('pm-dragging');
    try { drag.card.setPointerCapture(drag.pid); } catch (x) { }
    autoScroll();
  }
  function clearDropMarks() { $$('.pg.drop-before, .pg.drop-after').forEach(function (c) { c.classList.remove('drop-before', 'drop-after'); }); }
  function findDrop(x, y) {
    var hit = document.elementFromPoint(x, y);
    var c = hit && hit.closest && hit.closest('#grid .pg');
    clearDropMarks();
    drag.target = null;
    if (!c) {
      var grid = $('#grid'), r = grid.getBoundingClientRect();
      var last = grid.querySelector('.pg:last-of-type');
      if (last && y > r.top && y < r.bottom + 40 && x > r.left && x < r.right) {
        var lr = last.getBoundingClientRect();
        if (y > lr.bottom || (y > lr.top && (isRTL() ? x < lr.left : x > lr.right))) { drag.target = { id: +last.dataset.id, before: false }; last.classList.add('drop-after'); }
      }
      return;
    }
    var id = +c.dataset.id;
    if (drag.ids.indexOf(id) >= 0) return;
    var rc = c.getBoundingClientRect(), mid = rc.left + rc.width / 2;
    var before = isRTL() ? x > mid : x < mid;
    drag.target = { id: id, before: before };
    c.classList.add(before ? 'drop-before' : 'drop-after');
  }
  function autoScroll() {
    if (!drag || !drag.on) return;
    var y = drag.ly, edge = 70, v = 0, top = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pm-top')) || 60);
    if (y !== undefined) {
      if (y < top + edge) v = -Math.ceil((top + edge - y) / 5);
      else if (y > innerHeight - edge) v = Math.ceil((y - innerHeight + edge) / 5);
    }
    if (v) { window.scrollBy(0, v); findDrop(drag.lx, drag.ly); }
    requestAnimationFrame(autoScroll);
  }
  function endDrag(commit) {
    var d = drag; drag = null;
    if (!d) return;
    if (!d.on) return;
    /* the click that ends a drag arrives in the same task as pointerup: swallow only that one */
    suppressClick = true; setTimeout(function () { suppressClick = false; }, 0);
    if (d.ghost) d.ghost.remove();
    document.body.classList.remove('pm-dragging');
    d.ids.forEach(function (id) { var c = cards.get(id); if (c) c.classList.remove('ghosted'); });
    clearDropMarks();
    if (commit && d.target) {
      var rest = pages.filter(function (p) { return d.ids.indexOf(p.id) < 0; });
      var ti = rest.findIndex(function (p) { return p.id === d.target.id; });
      if (ti >= 0) moveTo(d.ids, d.target.before ? ti : ti + 1);
    }
    focusId = d.id;
  }

  /* drop files from the computer */
  var dragDepth = 0, overlay = null;
  function hasFiles(e) { var ty = e.dataTransfer && e.dataTransfer.types; return ty && Array.prototype.indexOf.call(ty, 'Files') >= 0; }
  function showOverlay(on) {
    if (on && !overlay) { overlay = el('div', { class: 'pm-overlay' }, el('div', { text: '📄 ' + t('drop_now') })); document.body.appendChild(overlay); }
    if (!on && overlay) { overlay.remove(); overlay = null; }
  }
  window.addEventListener('dragenter', function (e) { if (!hasFiles(e)) return; e.preventDefault(); dragDepth++; showOverlay(true); });
  window.addEventListener('dragover', function (e) { if (!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
  window.addEventListener('dragleave', function (e) { if (!hasFiles(e)) return; dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) showOverlay(false); });
  window.addEventListener('drop', function (e) {
    if (!hasFiles(e)) return;
    e.preventDefault(); dragDepth = 0; showOverlay(false);
    if (!busy) addFiles(e.dataTransfer.files);
  });
  $('#fileInput').addEventListener('change', function () {
    var f = this.files; var copy = Array.prototype.slice.call(f || []);
    this.value = '';
    addFiles(copy);
  });
  $('#sampleBtn').addEventListener('click', function () { makeSamples(); });

  /* ------------------------------------------------------------------ preview modal */
  function openPreview(id) {
    var idx = pages.findIndex(function (p) { return p.id === id; });
    if (idx < 0) return;
    var stage = el('div', { class: 'pm-view-stage' });
    var head = el('p', { class: 'center small muted mb0' });
    var prev = el('button', { class: 'btn', type: 'button' }, el('span', { class: 'flipx', 'aria-hidden': 'true', text: '◀' }), ' ', el('span', { text: t('previous') }));
    var next = el('button', { class: 'btn', type: 'button' }, el('span', { text: t('next') }), ' ', el('span', { class: 'flipx', 'aria-hidden': 'true', text: '▶' }));
    var rot = el('button', { class: 'btn', type: 'button', 'aria-label': t('rot_right'), title: t('rot_right'), text: '⟳' });
    var box = el('div', { class: 'pm-view' }, stage, head, el('div', { class: 'row' }, prev, rot, next));
    var token = 0;
    async function show() {
      var p = pages[idx]; if (!p) return close();
      head.textContent = t('card_label', { n: EDU.fmt(idx + 1), file: p.kind === 'blank' ? t('blank_page') : (sources.get(p.src) || {}).name || '', p: EDU.fmt(p.idx + 1) });
      prev.disabled = idx === 0; next.disabled = idx === pages.length - 1;
      var my = ++token;
      var px = Math.min(1600, Math.round(Math.min(900, window.innerWidth - 60) * Math.min(2, window.devicePixelRatio || 1)));
      var b;
      try { b = await renderBase(p, px); } catch (e) { b = errorThumb(p); }
      if (my !== token) return;
      var cv = el('canvas'); drawRotated(cv, b, p.rot);
      stage.textContent = ''; stage.appendChild(cv);
    }
    prev.onclick = function () { if (idx > 0) { idx--; show(); } };
    next.onclick = function () { if (idx < pages.length - 1) { idx++; show(); } };
    rot.onclick = function () { var p = pages[idx]; rotateIds([p.id], 90); show(); };
    function onKey(e) {
      if (e.key === (isRTL() ? 'ArrowRight' : 'ArrowLeft')) prev.onclick();
      else if (e.key === (isRTL() ? 'ArrowLeft' : 'ArrowRight')) next.onclick();
      else if (e.key === 'r' || e.key === 'R') rot.onclick();
    }
    document.addEventListener('keydown', onKey);
    var close = EDU.modal(box, { title: t('preview'), onClose: function () { document.removeEventListener('keydown', onKey); focusId = (pages[idx] || {}).id || focusId; focusCard(); } });
    show();
  }

  /* ------------------------------------------------------------------ split plan */
  function listLabel(nums) {
    var out = [], i = 0;
    while (i < nums.length) {
      var j = i;
      while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++;
      out.push(j > i + 1 ? nums[i] + '–' + nums[j] : j === i + 1 ? nums[i] + ', ' + nums[j] : String(nums[i]));
      i = j + 1;
    }
    return out.join(', ');
  }
  /* Digits typed on an Indian-language or Urdu keyboard (१२३, ১২৩, ௧௨௩, ۱۲۳ …) -> 0-9. */
  var DIGIT_ZEROS = [0x966, 0x9E6, 0xA66, 0xAE6, 0xB66, 0xBE6, 0xC66, 0xCE6, 0xD66, 0x660, 0x6F0, 0xFF10];
  function latinDigits(s) {
    return String(s).replace(/[०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯٠-٩۰-۹０-９]/g, function (ch) {
      var c = ch.charCodeAt(0);
      for (var i = 0; i < DIGIT_ZEROS.length; i++) if (c >= DIGIT_ZEROS[i] && c <= DIGIT_ZEROS[i] + 9) return String(c - DIGIT_ZEROS[i]);
      return ch;
    });
  }
  function parseRanges(str, total) {
    /* "1-3, 5", "1–3، 5" (Urdu comma), "1 2 5" (spaces) and "-3" (= 1-3) all work; spaces never glue digits together */
    var s = latinDigits(str || '').replace(/[–—−‐‑‒﹣－]/g, '-').replace(/\s*-\s*/g, '-').trim();
    if (!s) return { error: t('err_range_empty') };
    var parts = s.split(/[\s,;،؛，、]+/), groups = [];
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      if (!part) continue;
      var m = /^(\d*)(?:-(\d*))?$/.exec(part);
      if (!m || (m[1] === '' && !m[2])) return { error: t('err_range_bad', { x: part }) };
      var a = m[1] === '' ? 1 : parseInt(m[1], 10), b = m[2] === undefined ? a : (m[2] === '' ? total : parseInt(m[2], 10));
      var bad = [a, b].filter(function (n) { return n < 1 || n > total; })[0];
      if (bad !== undefined) return { error: t('err_range_out', { n: EDU.fmt(bad), total: EDU.fmt(total) }) };
      var g = [];
      if (a <= b) for (var k = a; k <= b; k++) g.push(k); else for (var k2 = a; k2 >= b; k2--) g.push(k2);
      groups.push(g);
    }
    if (!groups.length) return { error: t('err_range_empty') };
    return { groups: groups };
  }
  function firstSourceBase() {
    for (var i = 0; i < pages.length; i++) { var s = sources.get(pages[i].src); if (s) return cleanName(baseOf(s.name)) || 'document'; }
    return 'document';
  }
  function defaultName() {
    var used = new Set(); pages.forEach(function (p) { if (p.src) used.add(p.src); });
    if (S.tab === 'merge') return used.size === 1 ? firstSourceBase() + '_edited' : 'merged';
    return firstSourceBase();
  }
  function makePlan() {
    var total = pages.length;
    if (!total) return { error: t('err_no_pages'), files: [] };
    var base = cleanName($('#outName').value) || defaultName();
    if (S.tab === 'merge') return { files: [{ name: base + '.pdf', nums: pages.map(function (p, i) { return i + 1; }) }] };
    var files = [], i;
    var mode = S.splitMode;
    if (mode === 'each') {
      for (i = 1; i <= total; i++) files.push({ name: base + '_p' + i + '.pdf', nums: [i] });
    } else if (mode === 'every') {
      if (everyBad) return { error: t('err_every'), files: [] };
      var n = Math.max(1, Math.min(999, parseInt(S.everyN, 10) || 1));
      for (i = 1; i <= total; i += n) {
        var g = []; for (var k = i; k < i + n && k <= total; k++) g.push(k);
        files.push({ name: base + '_p' + (g.length > 1 ? g[0] + '-' + g[g.length - 1] : g[0]) + '.pdf', nums: g });
      }
    } else if (mode === 'ranges') {
      var r = parseRanges(S.ranges, total);
      if (r.error) return { error: r.error, files: [] };
      if (S.oneFile) files.push({ name: base + '_pages.pdf', nums: [].concat.apply([], r.groups) });
      else r.groups.forEach(function (g) {
        var lbl = g.length > 1 ? g[0] + '-' + g[g.length - 1] : String(g[0]);
        files.push({ name: base + '_p' + lbl + '.pdf', nums: g });
      });
    } else {
      var nums = []; pages.forEach(function (p, j) { if (selected.has(p.id)) nums.push(j + 1); });
      if (!nums.length) return { error: t('nothing_sel'), files: [] };
      if (S.selSeparate) nums.forEach(function (x) { files.push({ name: base + '_p' + x + '.pdf', nums: [x] }); });
      else files.push({ name: base + '_selected.pdf', nums: nums });
    }
    /* unique names inside a ZIP */
    var seen = {};
    files.forEach(function (f) { var nm = f.name, c = 1; while (seen[nm]) nm = f.name.replace(/\.pdf$/, '') + '_' + (++c) + '.pdf'; seen[nm] = 1; f.name = nm; });
    return { files: files, base: base };
  }
  function renderPlan() {
    var plan = makePlan(), box = $('#plan'), err = $('#planErr');
    box.textContent = '';
    err.hidden = !plan.error || !pages.length;
    err.textContent = plan.error && pages.length ? plan.error : '';
    $('#goBtn').disabled = !!plan.error || busy || engine !== 'ready';
    $('#goTxt').textContent = t(S.tab === 'merge' ? 'go_merge' : 'go_split');
    $('#outName').placeholder = defaultName();
    if (plan.error) { if (!pages.length) box.appendChild(el('p', { class: 'muted small mb0', text: t('err_no_pages') })); return; }
    var fl = plan.files;
    box.appendChild(el('p', { class: 'mb0', style: { fontWeight: '700' }, text: fl.length === 1 ? t('plan_one') : t('plan_zip', { n: EDU.fmt(fl.length) }) }));
    var ul = el('ul');
    fl.slice(0, 5).forEach(function (f) {
      ul.appendChild(el('li', {}, el('bdi', { class: 'nm no-i18n', text: f.name }), ' — ',
        el('span', { text: t('plan_item', { list: '⁦' + listLabel(f.nums) + '⁩', count: pagesTxt(f.nums.length) }) })));
    });
    if (fl.length > 5) ul.appendChild(el('li', { class: 'muted', text: t('plan_more', { n: EDU.fmt(fl.length - 5) }) }));
    box.appendChild(ul);
  }

  /* ------------------------------------------------------------------ stamps: text images + layout */
  var SCRIPT_FONTS = [
    [/[ऀ-ॿ]/, 'Noto Sans Devanagari'], [/[ঀ-৿]/, 'Noto Sans Bengali'], [/[਀-੿]/, 'Noto Sans Gurmukhi'],
    [/[઀-૿]/, 'Noto Sans Gujarati'], [/[଀-୿]/, 'Noto Sans Oriya'], [/[஀-௿]/, 'Noto Sans Tamil'],
    [/[ఀ-౿]/, 'Noto Sans Telugu'], [/[ಀ-೿]/, 'Noto Sans Kannada'], [/[ഀ-ൿ]/, 'Noto Sans Malayalam'],
    [/[؀-ۿݐ-ݿ]/, 'Noto Naskh Arabic']
  ];
  var fontLinks = {};
  async function fontFor(text) {
    var fams = [];
    SCRIPT_FONTS.forEach(function (sf) { if (sf[0].test(text)) fams.push(sf[1]); });
    for (var i = 0; i < fams.length; i++) {
      var f = fams[i];
      if (!fontLinks[f]) {
        fontLinks[f] = 1;
        if (!(location.protocol === 'file:' && !navigator.onLine)) {
          document.head.appendChild(el('link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=' + f.replace(/ /g, '+') + ':wght@400;700&display=swap' }));
        }
      }
      try {
        await Promise.race([document.fonts.load('700 40px "' + f + '"', text), new Promise(function (r) { setTimeout(r, 2500); })]);
      } catch (e) { }
    }
    return fams.map(function (f) { return '"' + f + '"'; }).concat(['"Noto Sans"', '"Nirmala UI"', '"Segoe UI"', 'Arial', 'sans-serif']).join(', ');
  }
  var COLORS = { grey: [0.5, 0.5, 0.5], red: [0.8, 0.1, 0.1], blue: [0.1, 0.3, 0.8], black: [0, 0, 0], num: [0.18, 0.18, 0.2] };
  function cssColor(c) { return 'rgb(' + c.map(function (v) { return Math.round(v * 255); }).join(',') + ')'; }
  var PX = 4;   /* canvas pixels per PDF point for text images (about 288 dpi) */
  var textImgCache = new Map();
  /* Text drawn on a canvas -> { canvas, w, h } in points. Works for every script (Indic shaping, Urdu). */
  async function textImage(text, sizePt, color, bold) {
    var key = [text, sizePt, color.join(','), bold].join('|');
    if (textImgCache.has(key)) return textImgCache.get(key);
    var fam = await fontFor(text);
    var px = sizePt * PX, font = (bold ? '700 ' : '400 ') + px + 'px ' + fam;
    var cv = document.createElement('canvas'), cx = cv.getContext('2d');
    cx.font = font;
    var rtl = /[؀-ۿ]/.test(text);
    var m = cx.measureText(text);
    var asc = m.actualBoundingBoxAscent || px * 0.8, desc = m.actualBoundingBoxDescent || px * 0.25;
    var pad = Math.ceil(px * 0.12);
    var w = Math.ceil(Math.max(m.width, (m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || 0))) + pad * 2;
    var h = Math.ceil(asc + desc) + pad * 2;
    cv.width = Math.max(1, Math.min(w, 8000)); cv.height = Math.max(1, Math.min(h, 2000));
    cx = cv.getContext('2d');
    cx.font = font; cx.fillStyle = cssColor(color); cx.textBaseline = 'alphabetic';
    if (rtl) cx.direction = 'rtl';
    cx.textAlign = 'left';
    cx.fillText(text, pad + (m.actualBoundingBoxLeft || 0) * (rtl ? 0 : 1), pad + asc);
    var out = { canvas: cv, w: cv.width / PX, h: cv.height / PX };
    textImgCache.set(key, out);
    if (textImgCache.size > 400) textImgCache.delete(textImgCache.keys().next().value);
    return out;
  }
  function numberText(k, total) {
    var n = S.num;
    if (!n.on) return '';
    if (n.skip && k === 0) return '';
    var start = Math.max(0, parseInt(n.start, 10) || 0);
    var num = start + (n.skip ? k - 1 : k), last = start + (n.skip ? total - 2 : total - 1);
    if (n.fmt === 'nN') return num + ' / ' + last;
    if (n.fmt === 'page') return t('fmt_page', { n: num, total: last });
    return String(num);
  }
  function wmText() { return S.wm.type === 'text' ? String(S.wm.text || '').trim() : ''; }
  /* Layout in "visual" page space: origin bottom-left of the page as people see it, y up, angles counter-clockwise.
     Returns boxes { x, y, w, h, angle } where (x, y) is the box's bottom-left corner before turning. */
  function rot2(x, y, deg) { var a = deg * Math.PI / 180; return { x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a) }; }
  function numberBox(VW, VH, w, h) {
    var m = Math.max(16, Math.min(VW, VH) * 0.04), pos = S.num.pos;
    var x = pos[1] === 'l' ? m : pos[1] === 'r' ? VW - m - w : (VW - w) / 2;
    var y = pos[0] === 'b' ? m : VH - m - h;
    return { x: x, y: y, w: w, h: h, angle: 0 };
  }
  function wmBoxes(VW, VH, w, h) {
    var tile = S.wm.layout === 'tile';
    var ang = S.wm.angle === 'diag' ? (tile ? 30 : EDU.clamp(Math.atan2(VH, VW) * 180 / Math.PI, 25, 65)) : 0;
    var out = [];
    function at(cx, cy) { var o = rot2(w / 2, h / 2, ang); out.push({ x: cx - o.x, y: cy - o.y, w: w, h: h, angle: ang }); }
    if (!tile) { at(VW / 2, VH / 2); return out; }
    var gx = w + Math.max(h * 2.5, 40), gy = h * 4 + 30;
    var u = rot2(1, 0, ang), v = rot2(0, 1, ang), R = Math.hypot(VW, VH);
    var K = Math.ceil(R / Math.min(gx, gy)) + 1;
    for (var j = -K; j <= K; j++) for (var i = -K; i <= K; i++) {
      var di = i + (j % 2 ? 0.5 : 0);
      var cx = VW / 2 + di * gx * u.x + j * gy * v.x, cy = VH / 2 + di * gx * u.y + j * gy * v.y;
      if (cx < -w / 2 || cx > VW + w / 2 || cy < -w / 2 || cy > VH + w / 2) continue;
      at(cx, cy);
      if (out.length > 160) return out;
    }
    return out;
  }
  /* Size of the text watermark: S.wm.size is how much of the page the text spans
     (% of the diagonal for one big mark, % of the shorter side for repeated marks). */
  function wmFontSize(VW, VH, text, widthAt1) {
    var tile = S.wm.layout === 'tile';
    var span = tile ? Math.min(VW, VH) * 0.7 : (S.wm.angle === 'diag' ? Math.hypot(VW, VH) : VW);
    var maxW = tile ? Math.min(VW, VH) * 0.9 : span * 0.92;
    var target = Math.min(span * S.wm.size / 100, maxW);
    return EDU.clamp(target / Math.max(1, widthAt1), 8, 140);
  }
  function wmImageWidth(VW, VH) { return Math.min(VW, VH) * S.wm.size / 100 * (S.wm.layout === 'tile' ? 0.35 : 0.75); }

  /* ------------------------------------------------------------------ stamp preview */
  var prevToken = 0;
  async function drawStampPreview() {
    var box = $('#prevBox'), cv = $('#stampPrev');
    var on = S.num.on || (S.wm.type === 'text' && wmText()) || (S.wm.type === 'image' && wmImage);
    box.hidden = !on;
    if (!on) return;
    var my = ++prevToken;
    var p = pages[0], VW = A4[0], VH = A4[1], base = null;
    if (p) { var sw = p.rot % 180 !== 0; VW = sw ? p.h : p.w; VH = sw ? p.w : p.h; base = thumbs.get(thumbKey(p)); }
    var W = 320, s = W / VW, H = Math.round(VH * s);
    var tmp = document.createElement('canvas');
    tmp.width = W; tmp.height = H;
    var cx = tmp.getContext('2d');
    cx.fillStyle = '#fff'; cx.fillRect(0, 0, W, H);
    if (base) { var r = el('canvas'); drawRotated(r, base, p.rot); cx.drawImage(r, 0, 0, W, H); }
    else { cx.fillStyle = '#d9d9de'; for (var i = 0; i < 9; i++) cx.fillRect(W * 0.1, H * (0.12 + i * 0.07), W * (i % 3 === 2 ? 0.5 : 0.8), Math.max(2, H * 0.015)); }
    function put(img, b, alpha) {
      cx.save(); cx.globalAlpha = alpha;
      cx.translate(b.x * s, H - b.y * s); cx.rotate(-b.angle * Math.PI / 180);
      cx.drawImage(img, 0, -b.h * s, b.w * s, b.h * s);
      cx.restore();
    }
    var wt = wmText();
    if (S.wm.type === 'text' && wt) {
      var probe = await textImage(wt, 10, COLORS[S.wm.color] || COLORS.grey, true);
      var fs = wmFontSize(VW, VH, wt, probe.w / 10);
      var ti = await textImage(wt, Math.round(fs), COLORS[S.wm.color] || COLORS.grey, true);
      if (my !== prevToken) return;
      wmBoxes(VW, VH, ti.w, ti.h).forEach(function (b) { put(ti.canvas, b, S.wm.opacity / 100); });
    } else if (S.wm.type === 'image' && wmImage && wmImage.el) {
      var iw = wmImageWidth(VW, VH), ih = iw * wmImage.h / wmImage.w;
      wmBoxes(VW, VH, iw, ih).forEach(function (b) { put(wmImage.el, b, S.wm.opacity / 100); });
    }
    var nt = numberText(0, Math.max(1, pages.length));
    if (nt) {
      var ni = await textImage(nt, S.num.size, COLORS.num, false);
      if (my !== prevToken) return;
      put(ni.canvas, numberBox(VW, VH, ni.w, ni.h), 1);
    }
    if (my !== prevToken) return;
    cv.width = W; cv.height = H;
    cv.getContext('2d').drawImage(tmp, 0, 0);
  }

  /* ------------------------------------------------------------------ building PDFs */
  async function libDoc(src) {
    if (src.lib) return src.lib;
    var L = PDFLib, doc;
    var bytes = new Uint8Array(await src.file.arrayBuffer());
    try { doc = await L.PDFDocument.load(bytes, { updateMetadata: false }); }
    catch (e) {
      if ((L.EncryptedPDFError && e instanceof L.EncryptedPDFError) || /encrypt/i.test(e && e.message)) throw code('locked', src.name);
      throw code('corrupt', src.name);
    }
    stripInternalLinks(doc);
    src.lib = doc;
    return doc;
  }
  /* Links that jump to other pages would drag those pages (and their content) into every output file.
     They would point to the wrong place after reordering anyway, so drop them; web links stay. */
  function stripInternalLinks(doc) {
    try {
      var L = PDFLib, N = L.PDFName;
      doc.getPages().forEach(function (pg) {
        var annots = pg.node.Annots(); if (!annots) return;
        for (var i = 0; i < annots.size(); i++) {
          var d = annots.lookup(i);
          if (!(d instanceof L.PDFDict)) continue;
          d.delete(N.of('P'));
          if (d.get(N.of('Subtype')) !== N.of('Link')) continue;
          if (d.lookup(N.of('Dest')) instanceof L.PDFArray) d.delete(N.of('Dest'));
          var a = d.lookup(N.of('A'));
          if (a instanceof L.PDFDict && a.get(N.of('S')) === N.of('GoTo') && a.lookup(N.of('D')) instanceof L.PDFArray) d.delete(N.of('A'));
        }
      });
    } catch (e) { console.warn('[' + SLUG + '] link cleanup skipped', e); }
  }
  /* copyPages carries the form widgets; register them in the new file's form so fields stay fillable. */
  function linkFormFields(out) {
    try {
      var L = PDFLib, N = L.PDFName, tops = new Set();
      out.getPages().forEach(function (pg) {
        var annots = pg.node.Annots(); if (!annots) return;
        for (var i = 0; i < annots.size(); i++) {
          var ref = annots.get(i); if (!(ref instanceof L.PDFRef)) continue;
          var d = out.context.lookup(ref);
          if (!(d instanceof L.PDFDict) || d.get(N.of('Subtype')) !== N.of('Widget')) continue;
          var cur = ref, cd = d, guard = 0;
          while (cd && cd.get(N.of('Parent')) instanceof L.PDFRef && guard++ < 32) { cur = cd.get(N.of('Parent')); cd = out.context.lookup(cur); if (!(cd instanceof L.PDFDict)) break; }
          tops.add(cur);
        }
      });
      if (!tops.size) return;
      var af = out.catalog.getOrCreateAcroForm();
      tops.forEach(function (r) { af.addField(r); });
    } catch (e) { console.warn('[' + SLUG + '] form fields not linked', e); }
  }
  async function embedImageFor(out, src) {
    var im = src.img;
    try { return im.type === 'png' ? await out.embedPng(im.bytes) : await out.embedJpg(im.bytes); }
    catch (e) {
      /* unusual JPEG/PNG flavours: redraw through a canvas and try again */
      var re = await reencode(await loadImg(src.url), im.type === 'png');
      return re.type === 'png' ? out.embedPng(re.bytes) : out.embedJpg(re.bytes);
    }
  }
  function toUser(vx, vy, r, cb) {
    if (r === 90) return { x: cb.x + cb.width - vy, y: cb.y + vx };
    if (r === 180) return { x: cb.x + cb.width - vx, y: cb.y + cb.height - vy };
    if (r === 270) return { x: cb.x + vy, y: cb.y + cb.height - vx };
    return { x: cb.x + vx, y: cb.y + vy };
  }
  function checkCancel() { if (cancelled) throw code('cancelled'); }

  async function prepareStamps(out, total) {
    var L = PDFLib, st = { num: S.num.on, total: total, numImgs: new Map(), wm: null };
    if (st.num) st.font = await out.embedFont(L.StandardFonts.Helvetica);
    var wt = wmText();
    if (S.wm.type === 'text' && wt) {
      var col = COLORS[S.wm.color] || COLORS.grey;
      if (isAscii(wt)) {
        var bf = await out.embedFont(L.StandardFonts.HelveticaBold);
        st.wm = { kind: 'vec', text: wt, font: bf, w1: bf.widthOfTextAtSize(wt, 1), color: L.rgb(col[0], col[1], col[2]) };
      } else {
        var probe = await textImage(wt, 10, col, true);
        st.wm = { kind: 'txtimg', text: wt, w1: probe.w / 10, col: col, imgs: new Map() };
      }
    } else if (S.wm.type === 'image' && wmImage) {
      st.wm = { kind: 'img', img: wmImage.type === 'png' ? await out.embedPng(wmImage.bytes) : await out.embedJpg(wmImage.bytes), ar: wmImage.h / wmImage.w };
    }
    return st;
  }
  async function pngFor(out, cache, ti) {
    if (cache.has(ti.canvas)) return cache.get(ti.canvas);
    var b = await canvasBlob(ti.canvas, 'image/png');
    var img = await out.embedPng(new Uint8Array(await b.arrayBuffer()));
    cache.set(ti.canvas, img);
    return img;
  }
  async function applyStamps(out, page, k, st) {
    if (!st.num && !st.wm) return;
    var L = PDFLib;
    var r = norm(page.getRotation().angle);
    var cb = page.getCropBox ? page.getCropBox() : { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() };
    var VW = r % 180 ? cb.height : cb.width, VH = r % 180 ? cb.width : cb.height;
    var op = S.wm.opacity / 100;
    function anchor(b) { var u = toUser(b.x, b.y, r, cb); return { x: u.x, y: u.y, rotate: L.degrees(norm(r) + b.angle) }; }
    if (st.wm) {
      if (st.wm.kind === 'vec') {
        var fs = wmFontSize(VW, VH, st.wm.text, st.wm.w1), w = st.wm.w1 * fs, h = fs * 0.95;
        wmBoxes(VW, VH, w, h).forEach(function (b) {
          var base = rot2(0, fs * 0.22, b.angle), u = toUser(b.x + base.x, b.y + base.y, r, cb);
          page.drawText(st.wm.text, { x: u.x, y: u.y, size: fs, font: st.wm.font, color: st.wm.color, opacity: op, rotate: L.degrees(r + b.angle) });
        });
      } else if (st.wm.kind === 'txtimg') {
        var fs2 = Math.round(wmFontSize(VW, VH, st.wm.text, st.wm.w1));
        var ti = await textImage(st.wm.text, fs2, st.wm.col, true);
        var img = await pngFor(out, st.wm.imgs, ti);
        wmBoxes(VW, VH, ti.w, ti.h).forEach(function (b) { var a = anchor(b); page.drawImage(img, { x: a.x, y: a.y, width: b.w, height: b.h, rotate: a.rotate, opacity: op }); });
      } else {
        var iw = wmImageWidth(VW, VH), ih = iw * st.wm.ar;
        wmBoxes(VW, VH, iw, ih).forEach(function (b) { var a = anchor(b); page.drawImage(st.wm.img, { x: a.x, y: a.y, width: b.w, height: b.h, rotate: a.rotate, opacity: op }); });
      }
    }
    var nt = numberText(k, st.total);
    if (nt) {
      var size = EDU.clamp(parseInt(S.num.size, 10) || 11, 6, 36), col = COLORS.num;
      if (isAscii(nt)) {
        var tw = st.font.widthOfTextAtSize(nt, size), bx = numberBox(VW, VH, tw, size);
        var u2 = toUser(bx.x, bx.y + size * 0.2, r, cb);
        page.drawText(nt, { x: u2.x, y: u2.y, size: size, font: st.font, color: L.rgb(col[0], col[1], col[2]), rotate: L.degrees(r) });
      } else {
        var ni = await textImage(nt, size, col, false);
        var nimg = await pngFor(out, st.numImgs, ni);
        var nb = numberBox(VW, VH, ni.w, ni.h), a2 = anchor(nb);
        page.drawImage(nimg, { x: a2.x, y: a2.y, width: ni.w, height: ni.h, rotate: a2.rotate });
      }
    }
  }
  async function applyMeta(out, items) {
    var m = S.meta, N = PDFLib.PDFName;
    if (m.mode === 'remove') {
      out.getPages().forEach(function (pg) { pg.node.delete(N.of('Metadata')); pg.node.delete(N.of('PieceInfo')); });
      return;
    }
    var now = new Date();
    if (m.mode === 'set') {
      if (m.title.trim()) out.setTitle(m.title.trim(), { showInWindowTitleBar: true });
      if (m.author.trim()) out.setAuthor(m.author.trim());
      if (m.subject.trim()) out.setSubject(m.subject.trim());
      var kw = m.keywords.split(/[,;]+/).map(function (s) { return s.trim(); }).filter(Boolean);
      if (kw.length) out.setKeywords(kw);
      out.setCreationDate(now); out.setModificationDate(now);
      return;
    }
    var first = null;
    for (var i = 0; i < items.length; i++) { var s = sources.get(items[i].src); if (s && s.kind === 'pdf') { first = s; break; } }
    if (!first) return;
    var d = await libDoc(first);
    var copy = function (get, set) { try { var v = d[get](); if (v) out[set](v); } catch (e) { } };
    copy('getTitle', 'setTitle'); copy('getAuthor', 'setAuthor'); copy('getSubject', 'setSubject');
    copy('getCreator', 'setCreator'); copy('getProducer', 'setProducer'); copy('getCreationDate', 'setCreationDate');
    try { var k2 = d.getKeywords(); if (k2) out.setKeywords([k2]); } catch (e) { }
    out.setModificationDate(now);
  }
  async function buildPdf(items, onPage) {
    var L = PDFLib;
    var out = await L.PDFDocument.create({ updateMetadata: false });
    var copied = new Array(items.length), groups = new Map();
    items.forEach(function (p, k) { if (p.kind === 'pdf') { if (!groups.has(p.src)) groups.set(p.src, []); groups.get(p.src).push(k); } });
    var gs = Array.from(groups.keys());
    for (var g = 0; g < gs.length; g++) {
      checkCancel();
      var ks = groups.get(gs[g]), lib = await libDoc(sources.get(gs[g]));
      var cps = await out.copyPages(lib, ks.map(function (k) { return items[k].idx; }));
      ks.forEach(function (k, j) { copied[k] = cps[j]; });
      await tick();
    }
    var st = await prepareStamps(out, items.length);
    var imgCache = new Map();
    for (var k = 0; k < items.length; k++) {
      checkCancel();
      var p = items[k], page;
      if (copied[k]) {
        page = out.addPage(copied[k]);
        page.setRotation(L.degrees(norm(p.base + p.rot)));
      } else if (p.kind === 'image') {
        var src = sources.get(p.src), im = imgCache.get(src.id);
        if (!im) { im = await embedImageFor(out, src); imgCache.set(src.id, im); }
        var d = imagePage(src);
        page = out.addPage([d.w, d.h]);
        page.drawImage(im, d.rect);
        page.setRotation(L.degrees(norm(p.rot)));
      } else {
        page = out.addPage([p.w, p.h]);
        page.setRotation(L.degrees(norm(p.rot)));
      }
      await applyStamps(out, page, k, st);
      if (onPage && (k % 4 === 3 || k === items.length - 1)) { onPage(k + 1, items.length); await tick(); }
    }
    linkFormFields(out);
    await applyMeta(out, items);
    checkCancel();
    return out.save({ useObjectStreams: true, addDefaultPage: false, updateFieldAppearances: false });
  }

  function progress(frac, msg) {
    $('#progBar').style.width = Math.round(EDU.clamp(frac, 0, 1) * 100) + '%';
    if (msg) $('#progMsg').textContent = msg;
  }
  async function runExport() {
    if (busy || engine !== 'ready') return;
    var plan = makePlan();
    if (plan.error) { renderPlan(); return; }
    var snapshot = pages.map(function (p) { return Object.assign({}, p); });
    busy = true; cancelled = false;
    $('#result').hidden = true; $('#progBox').hidden = false;
    progress(0, t('working', { i: 0, n: EDU.fmt(snapshot.length) }));
    renderAll();
    var bigJob = snapshot.length > BIG_PAGES;
    try {
      var outs = [], nf = plan.files.length, totalPages = 0;
      for (var f = 0; f < nf; f++) {
        checkCancel();
        var file = plan.files[f], items = file.nums.map(function (n) { return snapshot[n - 1]; });
        var bytes = await buildPdf(items, function (i, n) {
          var frac = nf === 1 ? i / n : (f + i / n) / nf;
          progress(frac * (nf > 1 ? 0.92 : 1), nf === 1 ? t('working', { i: EDU.fmt(i), n: EDU.fmt(n) }) : t('working_file', { i: EDU.fmt(f + 1), n: EDU.fmt(nf) }));
        });
        outs.push({ name: file.name, bytes: bytes, pages: items.length });
        totalPages += items.length;
        if (nf > 1) { progress((f + 1) / nf * 0.92, t('working_file', { i: EDU.fmt(f + 1), n: EDU.fmt(nf) })); await tick(); }
      }
      var blob, name;
      if (outs.length === 1) { blob = new Blob([outs[0].bytes], { type: 'application/pdf' }); name = outs[0].name; }
      else {
        progress(0.93, t('zipping'));
        await ensureZip();
        var zip = new JSZip();
        outs.forEach(function (o) { zip.file(o.name, o.bytes); });
        blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' }, function (m) { progress(0.93 + m.percent / 100 * 0.07); });
        name = (plan.base || 'document') + '_split.zip';
      }
      outs = null;
      progress(1);
      lastResult = { blob: blob, name: name, pages: totalPages, files: plan.files.length };
      dirty = false;
      EDU.download(name, blob);
      showResult();
    } catch (e) {
      var c = e && e.code;
      if (c === 'cancelled') EDU.toast(t('stopped'));
      else if (c === 'locked') addMsg('danger', 'err_locked', { name: e.detail || '' });
      else if (c === 'corrupt') addMsg('danger', 'err_corrupt', { name: e.detail || '' });
      else if (c === 'engine') showEngineProblem();
      else if (c === 'zip') addMsg('danger', 'err_zip');
      else { console.warn('[' + SLUG + '] export failed', e); addMsg('danger', 'export_fail', { msg: String(e && e.message || e).slice(0, 160) }); }
    } finally {
      busy = false;
      $('#progBox').hidden = true;
      if (bigJob) sources.forEach(function (s) { s.lib = null; });   /* free memory after very big jobs */
      renderAll();
    }
  }
  function showResult() {
    var r = lastResult, box = $('#result');
    if (!r) { box.hidden = true; return; }
    box.hidden = false;
    $('#resultMsg').textContent = '✓ ' + t('done_msg', { name: r.name, pages: pagesTxt(r.pages), size: fmtSize(r.blob.size) });
    var canShare = false;
    try {
      var fileObj = new File([r.blob], r.name, { type: r.blob.type });
      canShare = !!(navigator.canShare && navigator.canShare({ files: [fileObj] }));
    } catch (e) { }
    $('#shareBtn').hidden = !canShare;
  }
  $('#goBtn').addEventListener('click', runExport);
  $('#stopBtn').addEventListener('click', function () { cancelled = true; });
  $('#againBtn').addEventListener('click', function () { if (lastResult) EDU.download(lastResult.name, lastResult.blob); });
  $('#shareBtn').addEventListener('click', function () {
    if (!lastResult) return;
    var f = new File([lastResult.blob], lastResult.name, { type: lastResult.blob.type });
    navigator.share({ files: [f], title: lastResult.name }).catch(function () { });
  });

  /* ------------------------------------------------------------------ settings UI */
  /* A setting that changes the output makes the last result card stale ("Download again" would give the old file). */
  function outputChanged() { lastResult = null; }
  var everyBad = false;        /* the "pages in each file" box holds something that is not a number of pages */
  function setSeg(seg, val) { $$('button', seg).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.val === val ? 'true' : 'false'); }); }
  function bindSeg(id, get, set) {
    var seg = $('#' + id);
    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-val]'); if (!b) return;
      if (b.dataset.val !== get()) outputChanged();
      set(b.dataset.val); save(); renderSettings(); showResult();
    });
    seg._get = get;
  }
  bindSeg('splitSeg', function () { return S.splitMode; }, function (v) { S.splitMode = v; });
  bindSeg('wmSeg', function () { return S.wm.type; }, function (v) { S.wm.type = v; if (v === 'image' && !wmImage) pickWmImage(); });
  bindSeg('wmLayoutSeg', function () { return S.wm.layout; }, function (v) { S.wm.layout = v; });
  bindSeg('wmAngleSeg', function () { return S.wm.angle; }, function (v) { S.wm.angle = v; });
  bindSeg('wmColors', function () { return S.wm.color; }, function (v) { S.wm.color = v; });
  bindSeg('metaSeg', function () { return S.meta.mode; }, function (v) { S.meta.mode = v; });
  $$('.pm-tabs button').forEach(function (b) { b.addEventListener('click', function () { if (S.tab !== b.dataset.tab) outputChanged(); S.tab = b.dataset.tab; save(); renderSettings(); showResult(); }); });
  $('.pm-tabs').addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    outputChanged();
    S.tab = S.tab === 'merge' ? 'split' : 'merge'; save(); renderSettings(); showResult(); $(S.tab === 'merge' ? '#tabMerge' : '#tabSplit').focus();
  });
  function bindInput(id, apply, evt) {
    $('#' + id).addEventListener(evt || 'input', function () { apply(this); outputChanged(); save(); renderSettings(true); showResult(); });
  }
  /* number boxes: when the user leaves the box, show the value that is really used */
  ['everyN', 'numStart', 'numSize'].forEach(function (id) { $('#' + id).addEventListener('change', function () { renderSettings(); }); });
  bindInput('ranges', function (i) { S.ranges = i.value; });
  bindInput('everyN', function (i) { var n = parseInt(latinDigits(i.value), 10); everyBad = !(n > 0); if (n > 0) S.everyN = Math.min(999, n); });
  bindInput('oneFile', function (i) { if (S.splitMode === 'selected') S.selSeparate = i.checked; else S.oneFile = i.checked; }, 'change');
  bindInput('outName', function () { });
  bindInput('numOn', function (i) { S.num.on = i.checked; }, 'change');
  bindInput('numPos', function (i) { S.num.pos = i.value; }, 'change');
  bindInput('numFmt', function (i) { S.num.fmt = i.value; }, 'change');
  bindInput('numStart', function (i) { var n = parseInt(i.value, 10); if (n >= 0) S.num.start = Math.min(99999, n); });
  bindInput('numSize', function (i) { var n = parseInt(i.value, 10); if (n >= 6 && n <= 36) S.num.size = n; });
  bindInput('numSkip', function (i) { S.num.skip = i.checked; }, 'change');
  bindInput('wmText', function (i) { S.wm.text = i.value; });
  bindInput('kycOrg', function (i) { S.wm.org = i.value; });
  bindInput('wmOpacity', function (i) { S.wm.opacity = +i.value; });
  bindInput('wmSize', function (i) { S.wm.size = +i.value; });
  bindInput('mTitle', function (i) { S.meta.title = i.value; });
  bindInput('mAuthor', function (i) { S.meta.author = i.value; });
  bindInput('mSubject', function (i) { S.meta.subject = i.value; });
  bindInput('mKeywords', function (i) { S.meta.keywords = i.value; });
  $('#imgMode').addEventListener('change', function () {
    S.img = this.value; save(); outputChanged();
    refreshImagePages();
    renderAll();
  });
  $('#numOn').addEventListener('change', function () { if (this.checked) $('#optNum').open = true; });
  $('#kycBtn').addEventListener('click', function () {
    var org = String(S.wm.org || '').trim();
    if (!org) { EDU.toast(t('kyc_need_org')); $('#kycOrg').focus(); return; }
    S.wm.type = 'text';
    /* keep DD-MM-YYYY left-to-right inside Urdu text (otherwise the bidi rules print it as YYYY-MM-DD) */
    var date = /[؀-ۿ]/.test(t('kyc_text')) ? '⁦' + today() + '⁩' : today();
    S.wm.text = t('kyc_text', { org: org, date: date });
    if (S.wm.opacity < 30) S.wm.opacity = 35;
    outputChanged(); save(); renderSettings(); showResult();
    EDU.toast('✓ ' + S.wm.text);
  });
  $('#zoom').addEventListener('input', function () {
    S.thumb = +this.value; save();
    $('#grid').style.setProperty('--thumb', S.thumb + 'px');
    cards.forEach(function (c, id) { var p = byId.get(id); if (p && c._vis) drawCard(c, p); });
  });
  async function pickWmImage() {
    var f = await EDU.pickFile('image/png,image/jpeg,image/webp');
    if (!f) { if (!wmImage) { S.wm.type = 'none'; save(); renderSettings(); } return; }
    try {
      var kind = await sniff(f);
      if (kind !== 'png' && kind !== 'jpg' && kind !== 'webp') throw code('image');
      var bytes = new Uint8Array(await f.arrayBuffer());
      var url = URL.createObjectURL(new Blob([bytes], { type: kind === 'png' ? 'image/png' : kind === 'webp' ? 'image/webp' : 'image/jpeg' }));
      var im = await loadImg(url);
      var info = { bytes: bytes, type: kind === 'png' ? 'png' : 'jpg', w: im.naturalWidth, h: im.naturalHeight };
      if (kind === 'webp' || (kind === 'jpg' && exifOrientation(bytes) !== 1)) info = await reencode(im, true);
      if (wmImage && wmImage.url) URL.revokeObjectURL(wmImage.url);
      wmImage = info; wmImage.url = url; wmImage.el = im;
      S.wm.type = 'image'; save(); outputChanged();
    } catch (e) { addMsg('danger', 'err_image', { name: f.name }); }
    renderSettings(); showResult();
  }
  $('#wmPick').addEventListener('click', pickWmImage);

  function renderSettings(fromInput) {
    $$('.pm-tabs button').forEach(function (b) { var on = b.dataset.tab === S.tab; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
    $('#pMerge').hidden = S.tab !== 'merge';
    $('#pSplit').hidden = S.tab !== 'split';
    ['splitSeg', 'wmSeg', 'wmLayoutSeg', 'wmAngleSeg', 'wmColors', 'metaSeg'].forEach(function (id) { var s = $('#' + id); setSeg(s, s._get()); });
    $('#rangesBox').hidden = S.splitMode !== 'ranges';
    $('#everyBox').hidden = S.splitMode !== 'every';
    $('#oneFileBox').hidden = !(S.splitMode === 'ranges' || S.splitMode === 'selected');
    $('#oneFileTxt').textContent = t(S.splitMode === 'selected' ? 'sel_separate' : 'one_file');
    $('#oneFile').checked = S.splitMode === 'selected' ? S.selSeparate : S.oneFile;
    var active = document.activeElement;
    function val(id, v) { var i = $('#' + id); if (!(fromInput && active === i)) i.value = v; }
    if (!(fromInput && active === $('#everyN'))) everyBad = false;
    val('ranges', S.ranges); val('everyN', S.everyN);
    $('#numOn').checked = S.num.on; $('#numSkip').checked = S.num.skip;
    $('#numPos').value = S.num.pos;
    var fsel = $('#numFmt'), fv = S.num.fmt;
    fsel.textContent = '';
    [['n', '1'], ['nN', '1 / 10'], ['page', t('fmt_page', { n: 1, total: 10 })]].forEach(function (o) { fsel.appendChild(el('option', { value: o[0], text: o[1] })); });
    fsel.value = fv;
    val('numStart', S.num.start); val('numSize', S.num.size);
    val('wmText', S.wm.text); val('kycOrg', S.wm.org);
    $('#wmOpacity').value = S.wm.opacity; $('#wmOpacityOut').textContent = S.wm.opacity + '%';
    $('#wmSize').value = S.wm.size; $('#wmSizeOut').textContent = S.wm.size + '%';
    $('#wmTextBox').hidden = S.wm.type !== 'text';
    $('#wmImgBox').hidden = S.wm.type !== 'image';
    $('#wmStyleBox').hidden = S.wm.type === 'none';
    $('#wmColorBox').hidden = S.wm.type !== 'text';
    var ip = $('#wmImgPrev'); ip.hidden = !wmImage; if (wmImage) ip.src = wmImage.url;
    val('mTitle', S.meta.title); val('mAuthor', S.meta.author); val('mSubject', S.meta.subject); val('mKeywords', S.meta.keywords);
    $('#metaFields').hidden = S.meta.mode !== 'set';
    $('#metaHelp').textContent = t(S.meta.mode === 'remove' ? 'meta_remove_help' : S.meta.mode === 'keep' ? 'meta_keep_help' : 'meta_set_help');
    $('#imgMode').value = S.img;
    var badge = function (id, on, txt) { var b = $('#' + id); b.className = 'badge' + (on ? ' success' : ''); b.textContent = txt || t(on ? 'on' : 'off'); };
    badge('bNum', S.num.on);
    badge('bWm', (S.wm.type === 'text' && !!wmText()) || (S.wm.type === 'image' && !!wmImage));
    badge('bMeta', S.meta.mode !== 'keep', t(S.meta.mode === 'remove' ? 'meta_remove' : S.meta.mode === 'keep' ? 'meta_keep' : 'meta_set'));
    renderPlan();
    drawStampPreview();
  }

  /* ------------------------------------------------------------------ top-level render */
  function renderAll() {
    renderGrid();
    renderFiles();
    renderToolbar();
    renderSettings(true);
    showResult();
  }
  function onLangChange() {
    renderEngineMsg();
    renderMsgs();
    textImgCache.clear();
    if (!busy) setBusy(pendingFiles.length ? t('waiting_engine') : '');
    renderAll();
  }

  /* keep the sticky toolbar / side panel just under the shell header */
  function measureTop() {
    var h = document.querySelector('.edu-top');
    document.documentElement.style.setProperty('--pm-top', (h ? h.getBoundingClientRect().height : 60) + 'px');
  }
  if ('ResizeObserver' in window && document.querySelector('.edu-top')) new ResizeObserver(measureTop).observe(document.querySelector('.edu-top'));
  measureTop();

  window.addEventListener('beforeunload', function (e) { if (dirty && pages.length) { e.preventDefault(); e.returnValue = ''; } });

  $('#engRetry').addEventListener('click', startEngine);
  $('#resetAll').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    removeAll();
    S = merge(DEFAULTS, null); save();
    wmImage = null;
    msgs = []; renderMsgs();
    renderAll();
  });

  EDU.onLang(onLangChange);
  renderAll();
  startEngine();
})();
