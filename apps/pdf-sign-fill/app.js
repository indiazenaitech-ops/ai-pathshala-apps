/* Sign & Fill PDF: put a signature, initials, text, date, tick/cross, white-out box, stamp image or a
   "Self attested" set on any page of a PDF and fill its form fields, all on the device.
   Libraries (pinned, jsDelivr): pdf.js 3.11.174 draws pages (v4+ is ES-module only), pdf-lib 1.17.1
   writes the result. Coordinates: every item is stored in "viewport points" of the page as displayed
   (pdf.js viewport at scale 1, rotation = the page's /Rotate, origin top-left). On screen that is
   multiplied by the display scale; on save viewport.convertToPdfPoint() maps it to PDF user space and
   the item is drawn with rotate = /Rotate so it stays upright. pdf-lib cannot shape Indic / Urdu text,
   so non-ASCII text (and the handwriting font) is drawn on a canvas and embedded as PNG.
   Files are never stored. Only settings and the saved signature / initials go to EDU.store. */
(function () {
  'use strict';
  var SLUG = 'pdf-sign-fill';
  var CDN = 'https://cdn.jsdelivr.net/npm/';
  var LIB = {
    pdflib: CDN + 'pdf-lib@1.17.1/dist/pdf-lib.min.js',
    pdfjs: CDN + 'pdfjs-dist@3.11.174/build/pdf.min.js',
    worker: CDN + 'pdfjs-dist@3.11.174/build/pdf.worker.min.js',
    cmaps: CDN + 'pdfjs-dist@3.11.174/cmaps/',
    fonts: CDN + 'pdfjs-dist@3.11.174/standard_fonts/'
  };
  var A4 = [595.28, 841.89];
  var MAX_SAVED = 100 * 1024;           // data URL size kept in EDU.store
  var BIG_BYTES = 40 * 1024 * 1024;
  var HAND = '"Dancing Script", "Segoe Script", "Brush Script MT", "URW Chancery L", cursive';
  var SANS = 'Arial, Helvetica, "Nirmala UI", "Noto Sans", sans-serif';
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$;

  /* ------------------------------------------------------------------ settings */
  var DEFAULTS = { ink: '#1a3fb5', textSize: 14, dateSize: 12, font: 'sans', dateFmt: 'dmy-', sigMode: 'draw', tool: 'sign', flatten: true, selfText: '', selfTouched: false };
  var S = (function () {
    var v = store.get('settings', null), out = {};
    Object.keys(DEFAULTS).forEach(function (k) { out[k] = (v && typeof v[k] === typeof DEFAULTS[k]) ? v[k] : DEFAULTS[k]; });
    return out;
  })();
  function save() { store.set('settings', S); }
  var saved = { sig: store.get('sig', null), init: store.get('init', null) };   // { data, w, h }

  /* ------------------------------------------------------------------ state */
  var engine = 'loading', pdfWorker = null, pendingFile = null;
  var doc = null, origBytes = null, fileName = '', numPages = 0, cur = 0;
  var vps = [];                 // scale-1 viewports per page (lazy)
  var items = [];               // { id, page, type, x, y, w, h, ... }  type: image | text | tick | cross | white
  var assets = {};              // asset id -> { data, w, h }
  var seq = 0, assetSeq = 0;
  var history = [], future = [];
  var selected = null;
  var fields = [];              // { name, type: text|check|radio|select, value, options, multiline, rects: [{page, r:[x1,y1,x2,y2]}] }
  var hasForm = false, xfa = false;
  var scale = 1, dpr = 1, renderTask = null, renderSeq = 0;
  var busy = false, lastResult = null, msgs = [], msgSeq = 0, stamp = null;
  var pad = { strokes: [], cur: null, dirty: false };
  var photoSig = null;          // { data, w, h } from the photo tool

  EDU.init({ slug: SLUG, title: 'app_title', wide: true, waKey: 'shell_wa_tool' });

  /* ------------------------------------------------------------------ helpers */
  function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }
  function isAscii(s) { return /^[\x20-\x7e]*$/.test(s); }
  function isRTL() { return document.documentElement.dir === 'rtl'; }
  function code(c) { var e = new Error(c); e.code = c; return e; }
  function fmtSize(b) {
    if (b < 1024 * 1024) return EDU.fmt(Math.max(1, Math.round(b / 1024))) + ' KB';
    return EDU.fmt(b / 1048576, { maximumFractionDigits: b < 10 * 1048576 ? 1 : 0 }) + ' MB';
  }
  function cleanName(s) {
    return String(s || '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_').replace(/\s+/g, ' ').trim().replace(/\.pdf$/i, '').slice(0, 80).replace(/^[.\s]+|[.\s]+$/g, '');
  }
  function announce(msg) { var l = $('#live'); l.textContent = ''; setTimeout(function () { l.textContent = msg; }, 30); }
  function hexRgb(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmtDate(d, f) {
    var D = pad2(d.getDate()), M = pad2(d.getMonth() + 1), Y = d.getFullYear();
    if (f === 'dmy/') return D + '/' + M + '/' + Y;
    if (f === 'dmy.') return D + '.' + M + '.' + Y;
    if (f === 'ymd') return Y + '-' + M + '-' + D;
    if (f === 'dMy') {
      var mon;
      try { mon = new Intl.DateTimeFormat(EDU.lang + '-u-nu-latn', { month: 'short' }).format(d); } catch (e) { mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]; }
      return D + ' ' + mon + ' ' + Y;
    }
    return D + '-' + M + '-' + Y;
  }
  function pickedDate() {
    var v = $('#dateIn').value, m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date();
  }
  function measureCtx() { var c = measureCtx.c || (measureCtx.c = document.createElement('canvas').getContext('2d')); return c; }
  function textWidth(text, size, family) { var c = measureCtx(); c.font = size + 'px ' + family; return c.measureText(text).width; }
  function loadImg(src) {
    return new Promise(function (res, rej) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = function () { rej(code('img')); }; im.src = src; });
  }
  function dataUrlBytes(u) { var i = u.indexOf(','); var b = atob(u.slice(i + 1)); var a = new Uint8Array(b.length); for (var k = 0; k < b.length; k++) a[k] = b.charCodeAt(k); return a; }
  /* make sure the handwriting font is really there before drawing with it (falls back after 1.5 s) */
  function fontReady(spec) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.race([document.fonts.load(spec).catch(function () { }), new Promise(function (r) { setTimeout(r, 1500); })]);
  }

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
    box.className = 'sf-engine small' + (state === 'ready' ? ' ok' : state === 'failed' ? ' callout danger' : '');
    $('#engSpin').hidden = state !== 'loading';
    $('#engRetry').hidden = state !== 'failed';
    renderEngineMsg();
    $('#app').setAttribute('data-engine', state);
    updateButtons();
  }
  function renderEngineMsg() {
    var k = engine === 'ready' ? 'eng_ready' : engine === 'failed' ? 'eng_failed' : 'eng_loading';
    $('#engMsg').textContent = (engine === 'ready' ? '✓ ' : '') + t(k);
  }
  function startEngine() {
    setEngine('loading');
    Promise.all([
      loadScript(LIB.pdflib, function () { return !!window.PDFLib; }),
      loadScript(LIB.pdfjs, function () { return !!window.pdfjsLib; })
    ]).then(function () {
      if (!pdfWorker) {
        /* A Blob worker that imports the CDN worker works on https and from a downloaded folder (file://). */
        var blob = new Blob(["importScripts('" + LIB.worker + "');"], { type: 'application/javascript' });
        var url = URL.createObjectURL(blob);
        pdfjsLib.GlobalWorkerOptions.workerSrc = LIB.worker;
        var w = null;
        try { w = new Worker(url, { name: 'sf-worker' }); } catch (e) { w = null; }
        pdfWorker = w ? new pdfjsLib.PDFWorker({ port: w }) : new pdfjsLib.PDFWorker({ name: 'sf-worker' });
      }
      setEngine('ready');
      if (pendingFile) { var f = pendingFile; pendingFile = null; openFile(f); }
      warmOfflineCache();
    }).catch(function (e) {
      console.warn('[' + SLUG + '] engine failed to load:', e && e.message);
      setEngine('failed');
    });
  }
  function warmOfflineCache() {
    try {
      if (location.protocol !== 'https:' || !window.caches || !('serviceWorker' in navigator)) return;
      setTimeout(function () {
        caches.open('cdn-warm').then(function (c) {
          [LIB.pdflib, LIB.pdfjs, LIB.worker].forEach(function (u) { c.match(u).then(function (hit) { if (!hit) c.add(u).catch(function () { }); }); });
        }).catch(function () { });
      }, 2500);
    } catch (e) { /* ignore */ }
  }
  $('#engRetry').addEventListener('click', startEngine);

  /* ------------------------------------------------------------------ messages */
  function pushMsg(kind, key, vars, extra) {
    msgs.push({ id: ++msgSeq, kind: kind, key: key, vars: vars || {}, extra: extra });
    if (msgs.length > 6) msgs.shift();
    renderMsgs();
  }
  function renderMsgs() {
    var box = $('#msgs'); box.innerHTML = '';
    msgs.forEach(function (m) {
      var p = el('p', { text: t(m.key, m.vars) });
      var row = el('div', { class: 'callout sf-msg ' + m.kind }, p);
      if (m.extra === 'unlock') {
        row.appendChild(el('a', { class: 'btn btn-sm', href: '../pdf-compress-convert/index.html?lang=' + EDU.lang + '#unlock', text: t('unlock_btn') }));
      }
      row.appendChild(el('button', { class: 'x', type: 'button', 'aria-label': t('close'), text: '✕', onclick: function () { msgs = msgs.filter(function (x) { return x.id !== m.id; }); renderMsgs(); } }));
      box.appendChild(row);
    });
  }
  function setBusy(msg) { $('#busy').hidden = !msg; $('#busyMsg').textContent = msg || ''; }

  /* ------------------------------------------------------------------ open a PDF */
  function sniff(bytes) {
    var head = '';
    for (var i = 0; i < Math.min(1024, bytes.length); i++) head += String.fromCharCode(bytes[i]);
    return head.indexOf('%PDF') >= 0;
  }
  async function openFile(file) {
    if (!file) return;
    if (engine !== 'ready') {
      if (engine === 'failed') { $('#engine').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      pendingFile = file; setBusy(t('waiting_engine')); return;
    }
    var name = file.name || 'document.pdf';
    if (!/\.pdf$/i.test(name) && file.type !== 'application/pdf') { pushMsg('danger', 'err_type', { name: name }); return; }
    if (!file.size) { pushMsg('danger', 'err_corrupt', { name: name }); return; }
    setBusy(t('opening', { name: name }));
    try {
      var bytes = new Uint8Array(await file.arrayBuffer());
      if (!sniff(bytes)) throw code('corrupt');
      if (bytes.length > BIG_BYTES) pushMsg('warning', 'err_big', { name: name, size: fmtSize(bytes.length) });
      await openBytes(bytes, name);
    } catch (e) {
      console.warn('[' + SLUG + ']', e);
      var c = e && e.code;
      if (c === 'locked') pushMsg('danger', 'err_locked', { name: name }, 'unlock');
      else pushMsg('danger', 'err_corrupt', { name: name });
    }
    setBusy('');
  }
  async function openBytes(bytes, name) {
    var L = PDFLib, newDoc;
    try {
      newDoc = await pdfjsLib.getDocument({
        data: bytes.slice(0), worker: pdfWorker, isEvalSupported: false, cMapUrl: LIB.cmaps, cMapPacked: true,
        standardFontDataUrl: LIB.fonts, disableAutoFetch: true
      }).promise;
    } catch (e) {
      if (e && e.name === 'PasswordException') throw code('locked');
      throw code('corrupt');
    }
    if (!newDoc.numPages) { newDoc.destroy(); throw code('corrupt'); }
    /* pdf-lib must be able to open it too (it writes the result); owner-password PDFs open in pdf.js but not here */
    var lib;
    try { lib = await L.PDFDocument.load(bytes, { updateMetadata: false }); }
    catch (e) {
      newDoc.destroy();
      if (e && (e.constructor && /Encrypted/.test(e.constructor.name) || /encrypt/i.test(String(e && e.message)))) throw code('locked');
      throw code('corrupt');
    }
    /* swap in the new document */
    if (doc) { try { doc.destroy(); } catch (e) { /* ignore */ } }
    doc = newDoc; origBytes = bytes; fileName = name; numPages = doc.numPages; cur = 0;
    vps = new Array(numPages); items = []; assets = {}; history = []; future = []; selected = null; lastResult = null;
    readFields(lib);
    $('#outName').value = cleanName(name) + '-signed';
    $('#drop').classList.add('compact');
    $('#fnameTxt').textContent = name;
    $('#fnameInf').textContent = '· ' + (numPages === 1 ? t('one_page') : t('n_pages', { n: EDU.fmt(numPages) })) + ' · ' + fmtSize(bytes.length);
    $('#work').hidden = false;
    $('#pageNo').max = numPages;
    $('#result').hidden = true;
    $('#app').setAttribute('data-doc', 'loading');
    renderFormPanel();
    if (hasForm && S.tool !== 'form' && fields.length) { /* a fillable form: show its fields first */ setTool('form'); }
    await showPage(0);
    $('#app').setAttribute('data-doc', 'ready');
    announce(t('opened', { name: name, n: EDU.fmt(numPages) }));
  }

  /* form fields, read once with pdf-lib */
  function readFields(lib) {
    fields = []; hasForm = false; xfa = false;
    try {
      var N = PDFLib.PDFName, acro = lib.catalog.lookup(N.of('AcroForm'));
      if (!acro) return;
      hasForm = true;
      xfa = !!acro.lookup(N.of('XFA'));
      var pages = lib.getPages();
      var annotsOf = pages.map(function (p) { var a = p.node.Annots(); return a ? a.asArray().map(function (r) { return lib.context.lookup(r); }) : []; });
      lib.getForm().getFields().forEach(function (f) {
        var type = f instanceof PDFLib.PDFTextField ? 'text' : f instanceof PDFLib.PDFCheckBox ? 'check' : f instanceof PDFLib.PDFRadioGroup ? 'radio' : f instanceof PDFLib.PDFDropdown ? 'select' : f instanceof PDFLib.PDFOptionList ? 'select' : null;
        if (!type) return;
        var rects = [];
        f.acroField.getWidgets().forEach(function (w) {
          var pi = -1;
          for (var i = 0; i < annotsOf.length && pi < 0; i++) if (annotsOf[i].indexOf(w.dict) >= 0) pi = i;
          if (pi < 0) { var pr = w.P(); pi = pages.findIndex(function (p) { return p.ref === pr; }); }
          if (pi < 0) return;
          var r = w.getRectangle();
          rects.push({ page: pi, r: [r.x, r.y, r.x + r.width, r.y + r.height], onValue: null });
          if (type === 'radio') { try { var on = w.getOnValue(); rects[rects.length - 1].onValue = on ? on.decodeText ? on.decodeText() : String(on) : null; } catch (e) { /* ignore */ } }
        });
        var fld = { name: f.getName(), type: type, value: '', options: [], multiline: false, rects: rects, maxLen: 0 };
        try {
          if (type === 'text') { fld.value = f.getText() || ''; fld.multiline = f.isMultiline(); fld.maxLen = f.getMaxLength() || 0; }
          else if (type === 'check') fld.value = f.isChecked();
          else if (type === 'radio') { fld.options = f.getOptions(); fld.value = f.getSelected() || ''; }
          else if (type === 'select') { fld.options = f.getOptions(); var sel = f.getSelected(); fld.value = sel && sel.length ? sel[0] : ''; }
        } catch (e) { /* keep defaults */ }
        fields.push(fld);
      });
    } catch (e) { console.warn('[' + SLUG + '] form read failed', e); }
  }

  /* ------------------------------------------------------------------ pages */
  async function viewportOf(i) {
    if (vps[i]) return vps[i];
    var pg;
    try { pg = await doc.getPage(i + 1); } catch (e) { pg = null; }
    vps[i] = pg ? pg.getViewport({ scale: 1 }) : { width: A4[0], height: A4[1], convertToPdfPoint: function (x, y) { return [x, A4[1] - y]; }, convertToViewportRectangle: function (r) { return [r[0], A4[1] - r[1], r[2], A4[1] - r[3]]; }, rotation: 0 };
    vps[i].__page = pg;
    return vps[i];
  }
  function stageWidth() { var w = $('#stageWrap').clientWidth - 24; return Math.max(120, Math.min(w, 900)); }
  async function showPage(i, keepScroll) {
    if (!doc) return;
    i = EDU.clamp(i, 0, numPages - 1);
    cur = i; selected = null;
    $('#pageNo').value = i + 1;
    $('#pageTotal').textContent = '/ ' + EDU.fmt(numPages);
    var my = ++renderSeq;
    var vp = await viewportOf(i);
    if (my !== renderSeq) return;
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    scale = stageWidth() / vp.width;
    var cssW = Math.round(vp.width * scale), cssH = Math.round(vp.height * scale);
    /* keep the backing store sane on very big pages */
    while (cssW * dpr * cssH * dpr > 16e6 && dpr > 1) dpr = Math.max(1, dpr - 0.5);
    var cv = $('#pageCanvas');
    cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
    cv.style.width = cssW + 'px'; cv.style.height = cssH + 'px';
    var st = $('#stage'); st.style.width = cssW + 'px'; st.style.height = cssH + 'px';
    var ctx = cv.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
    renderFields(); renderItems(); updateButtons();
    if (renderTask) { try { renderTask.cancel(); } catch (e) { /* ignore */ } renderTask = null; }
    if (vp.__page) {
      var task = vp.__page.render({ canvasContext: ctx, viewport: vp.__page.getViewport({ scale: scale * dpr }), annotationMode: pdfjsLib.AnnotationMode ? pdfjsLib.AnnotationMode.ENABLE : 1 });
      renderTask = task;
      try { await task.promise; } catch (e) { if (!(e && e.name === 'RenderingCancelledException')) console.warn('[' + SLUG + '] render', e); }
      if (renderTask === task) renderTask = null;
    }
  }
  var resizeTimer = null, lastW = 0;
  new ResizeObserver(function () {
    if (!doc) return;
    var w = stageWidth();
    if (Math.abs(w - lastW) < 2) return;
    lastW = w;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { showPage(cur); }, 120);
  }).observe($('#stageWrap'));

  $('#prevBtn').addEventListener('click', function () { showPage(cur - 1); });
  $('#nextBtn').addEventListener('click', function () { showPage(cur + 1); });
  $('#pageNo').addEventListener('change', function () { var n = parseInt(this.value, 10); if (isFinite(n)) showPage(n - 1); else this.value = cur + 1; });

  /* field highlights on the page */
  function renderFields() {
    var layer = $('#fieldLayer'); layer.innerHTML = '';
    var vp = vps[cur]; if (!vp) return;
    fields.forEach(function (f, fi) {
      f.rects.forEach(function (rc) {
        if (rc.page !== cur) return;
        var v = vp.convertToViewportRectangle(rc.r);
        var x1 = Math.min(v[0], v[2]) * scale, y1 = Math.min(v[1], v[3]) * scale, w = Math.abs(v[2] - v[0]) * scale, h = Math.abs(v[3] - v[1]) * scale;
        var on = f.type === 'check' ? !!f.value : f.type === 'radio' ? (rc.onValue != null && f.value === rc.onValue) : null;
        var txt = f.type === 'text' || f.type === 'select' ? String(f.value || '') : on ? '✓' : '';
        var b = el('button', { type: 'button', class: 'sf-field' + ((f.type === 'check' || f.type === 'radio') ? ' cb' : '') + (txt ? ' filled' : ''), title: f.name, 'aria-label': t('field_aria', { name: f.name }), text: txt });
        b.style.left = x1 + 'px'; b.style.top = y1 + 'px'; b.style.width = Math.max(6, w) + 'px'; b.style.height = Math.max(6, h) + 'px';
        b.style.fontSize = Math.max(8, Math.min(h * 0.62, 11 * scale * 1.6)) + 'px';
        b.addEventListener('click', function () {
          setTool('form');
          var inp = $('#formList [data-fi="' + fi + '"]');
          if (inp) { inp.focus(); if (inp.type === 'checkbox' && f.type === 'check') { inp.checked = !inp.checked; inp.dispatchEvent(new Event('change')); } }
        });
        layer.appendChild(b);
      });
    });
  }

  /* ------------------------------------------------------------------ items */
  function snapshot() { history.push(JSON.stringify(items)); if (history.length > 60) history.shift(); future = []; }
  function restore(json) { items = JSON.parse(json); selected = null; renderItems(); updateButtons(); }
  function undo() { if (!history.length) return; future.push(JSON.stringify(items)); restore(history.pop()); }
  function redo() { if (!future.length) return; history.push(JSON.stringify(items)); restore(future.pop()); }
  function addAsset(data, w, h) { var id = 'a' + (++assetSeq); assets[id] = { data: data, w: w, h: h }; return id; }
  function pageOf(i) { return vps[i] || { width: A4[0], height: A4[1] }; }
  function clampItem(it) {
    var vp = pageOf(it.page);
    it.w = Math.min(it.w, vp.width); it.h = Math.min(it.h, vp.height);
    it.x = EDU.clamp(it.x, 0, vp.width - it.w); it.y = EDU.clamp(it.y, 0, vp.height - it.h);
  }
  /* add one item (coordinates in viewport points); fx/fy = where to put it as a fraction of the page */
  function addItem(spec, pageIdx, fx, fy, quiet) {
    var vp = pageOf(pageIdx);
    var it = Object.assign({ id: ++seq, page: pageIdx }, spec);
    var n = items.filter(function (x) { return x.page === pageIdx; }).length;
    if (it.x == null) it.x = vp.width * (fx == null ? 0.5 : fx) - it.w / 2 + (n % 5) * 6;
    if (it.y == null) it.y = vp.height * (fy == null ? 0.5 : fy) - it.h / 2 + (n % 5) * 6;
    clampItem(it);
    items.push(it);
    if (!quiet) { selected = it.id; renderItems(); updateButtons(); announce(t('added')); }
    return it;
  }
  function addToAllPages(spec, fx, fy) {
    snapshot();
    for (var p = 0; p < numPages; p++) addItem(Object.assign({}, spec), p, fx, fy, true);
    selected = null; renderItems(); updateButtons();
    announce(t('added_all', { n: EDU.fmt(numPages) }));
    EDU.toast(t('added_all', { n: EDU.fmt(numPages) }));
  }
  function byId(id) { for (var i = 0; i < items.length; i++) if (items[i].id === id) return items[i]; return null; }
  function removeItem(id) { snapshot(); items = items.filter(function (x) { return x.id !== id; }); if (selected === id) selected = null; renderItems(); updateButtons(); announce(t('removed')); }
  function select(id) { selected = id; $$('#overlay .sf-item').forEach(function (e) { e.classList.toggle('sel', +e.dataset.id === id); }); updateButtons(); }
  function itemLabel(it) { return t('item_' + (it.type === 'image' ? (it.kind || 'stamp') : it.type === 'text' ? (it.kind === 'date' ? 'date' : 'text') : it.type)); }

  function markSvg(type, w, h, color) {
    var sw = Math.max(1.5, Math.min(w, h) * 0.12);
    var d = type === 'tick'
      ? 'M ' + (0.14 * w) + ' ' + (0.55 * h) + ' L ' + (0.4 * w) + ' ' + (0.84 * h) + ' L ' + (0.88 * w) + ' ' + (0.16 * h)
      : 'M ' + (0.16 * w) + ' ' + (0.16 * h) + ' L ' + (0.84 * w) + ' ' + (0.84 * h) + ' M ' + (0.84 * w) + ' ' + (0.16 * h) + ' L ' + (0.16 * w) + ' ' + (0.84 * h);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none"><path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function renderItems() {
    var ov = $('#overlay'); ov.innerHTML = '';
    items.forEach(function (it) {
      if (it.page !== cur) return;
      var d = el('div', { class: 'sf-item ' + it.type + (it.font === 'hand' ? ' hand' : '') + (selected === it.id ? ' sel' : ''), tabindex: '0', role: 'group', 'aria-label': itemLabel(it), dataset: { id: it.id } });
      placeEl(d, it);
      if (it.type === 'image') { var a = assets[it.asset]; var im = el('img', { alt: '', draggable: 'false' }); im.src = a ? a.data : ''; d.appendChild(im); }
      else if (it.type === 'text') { var sp = el('span', { class: 'txt', text: it.text }); sp.style.fontSize = (it.size * scale) + 'px'; sp.style.color = it.color; sp.style.paddingLeft = (it.size * 0.15 * scale) + 'px'; d.appendChild(sp); }
      else if (it.type === 'tick' || it.type === 'cross') d.innerHTML = markSvg(it.type, it.w, it.h, it.color);
      d.appendChild(el('button', { class: 'sf-x', type: 'button', 'aria-label': t('it_delete'), text: '✕', tabindex: '-1' }));
      d.appendChild(el('span', { class: 'sf-h', 'aria-hidden': 'true' }));
      ov.appendChild(d);
    });
    var n = items.filter(function (x) { return x.page === cur; }).length;
    $('#countTxt').textContent = n ? t('items_on_page', { n: EDU.fmt(n) }) : '';
  }
  function placeEl(d, it) { d.style.left = (it.x * scale) + 'px'; d.style.top = (it.y * scale) + 'px'; d.style.width = (it.w * scale) + 'px'; d.style.height = (it.h * scale) + 'px'; }
  function resizeItem(it, nw) {
    var vp = pageOf(it.page), minW = 8;
    nw = EDU.clamp(nw, minW, vp.width - it.x);
    var f = nw / it.w;
    if (it.type === 'white') { it.w = nw; return; }
    if (it.type === 'text') { it.size = Math.max(4, it.size * f); }
    it.w = nw; it.h = it.h * f;
    if (it.y + it.h > vp.height) { var g = (vp.height - it.y) / it.h; it.h *= g; it.w *= g; if (it.type === 'text') it.size *= g; }
  }

  /* pointer: move and resize */
  var drag = null;
  var ov = $('#overlay');
  ov.addEventListener('pointerdown', function (e) {
    var itEl = e.target.closest('.sf-item');
    if (!itEl) { select(null); return; }
    var id = +itEl.dataset.id, it = byId(id);
    if (!it) return;
    if (e.target.closest('.sf-x')) { removeItem(id); return; }
    select(id);
    e.preventDefault();
    try { itEl.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    drag = { id: id, el: itEl, mode: e.target.closest('.sf-h') ? 'resize' : 'move', sx: e.clientX, sy: e.clientY, ox: it.x, oy: it.y, ow: it.w, oh: it.h, osz: it.size, moved: false, pid: e.pointerId };
    document.body.classList.add('sf-dragging');
  });
  ov.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.pid) return;
    var it = byId(drag.id); if (!it) return;
    var dx = (e.clientX - drag.sx) / scale, dy = (e.clientY - drag.sy) / scale;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 1.5) return;
    if (!drag.moved) { snapshot(); drag.moved = true; }
    if (drag.mode === 'move') { it.x = drag.ox + dx; it.y = drag.oy + dy; clampItem(it); }
    else {
      it.w = drag.ow; it.h = drag.oh; if (it.type === 'text') it.size = drag.osz;
      if (it.type === 'white') { it.w = Math.max(8, drag.ow + dx); it.h = Math.max(8, drag.oh + dy); clampItem(it); }
      else resizeItem(it, drag.ow + dx);
      if (it.type === 'text') { var sp = drag.el.querySelector('.txt'); if (sp) sp.style.fontSize = (it.size * scale) + 'px'; }
      if (it.type === 'tick' || it.type === 'cross') { var svg = drag.el.querySelector('svg'); if (svg) svg.outerHTML = markSvg(it.type, it.w, it.h, it.color); }
    }
    placeEl(drag.el, it);
  });
  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.pid)) return;
    document.body.classList.remove('sf-dragging');
    var d = drag; drag = null;
    if (d.moved) { renderItems(); updateButtons(); }
    else { var fe = ov.querySelector('.sf-item[data-id="' + d.id + '"]'); if (fe) fe.focus({ preventScroll: true }); }
  }
  ov.addEventListener('pointerup', endDrag);
  ov.addEventListener('pointercancel', endDrag);
  ov.addEventListener('lostpointercapture', function () { if (drag) endDrag({ pointerId: drag.pid }); });
  ov.addEventListener('focusin', function (e) { var itEl = e.target.closest('.sf-item'); if (itEl) select(+itEl.dataset.id); });
  ov.addEventListener('keydown', function (e) { var itEl = e.target.closest('.sf-item'); if (itEl) itemKey(e, itEl); });
  function itemKey(e, itEl) {
    var it = byId(+itEl.dataset.id); if (!it) return;
    var step = e.shiftKey ? 10 : 1, k = e.key, handled = true;
    if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown') {
      snapshot();
      if (k === 'ArrowLeft') it.x -= step; if (k === 'ArrowRight') it.x += step; if (k === 'ArrowUp') it.y -= step; if (k === 'ArrowDown') it.y += step;
      clampItem(it); placeEl(itEl, it);
    } else if (k === '+' || k === '=' || k === '-' || k === '_') {
      snapshot(); resizeItem(it, it.w * (k === '+' || k === '=' ? 1.1 : 1 / 1.1)); clampItem(it); renderItems();
      var fe = ov.querySelector('.sf-item[data-id="' + it.id + '"]'); if (fe) fe.focus({ preventScroll: true });
    } else if (k === 'Delete' || k === 'Backspace') { removeItem(it.id); }
    else if (k === 'Escape') { itEl.blur(); select(null); }
    else handled = false;
    if (handled) e.preventDefault();
  }
  document.addEventListener('keydown', function (e) {
    if (!doc) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    /* arrows / Delete act on the selected item even when focus is still on the tool button that added it */
    if (selected != null && !e.ctrlKey && !e.metaKey && !e.altKey && /^(Arrow(Left|Right|Up|Down)|Delete|Escape|\+|-|=)$/.test(e.key) && !(e.target.closest && e.target.closest('#overlay, .seg, [role="tablist"]'))) {
      var se = ov.querySelector('.sf-item[data-id="' + selected + '"]');
      if (se) { se.focus({ preventScroll: true }); itemKey(e, se); return; }
    }
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
    else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); redo(); }
  });

  $('#undoBtn').addEventListener('click', undo);
  $('#redoBtn').addEventListener('click', redo);
  $('#delBtn').addEventListener('click', function () { if (selected != null) removeItem(selected); });
  $('#clearPageBtn').addEventListener('click', function () {
    if (!items.some(function (x) { return x.page === cur; })) return;
    if (!confirm(t('confirm_clear_page'))) return;
    snapshot(); items = items.filter(function (x) { return x.page !== cur; }); selected = null; renderItems(); updateButtons();
  });
  function updateButtons() {
    var has = !!doc;
    $('#prevBtn').disabled = !has || cur === 0;
    $('#nextBtn').disabled = !has || cur >= numPages - 1;
    $('#undoBtn').disabled = !history.length;
    $('#redoBtn').disabled = !future.length;
    $('#delBtn').disabled = selected == null;
    $('#clearPageBtn').disabled = !items.some(function (x) { return x.page === cur; });
    $('#saveBtn').disabled = !has || busy || engine !== 'ready';
    $('#selfNeed').hidden = !!(saved.sig || padHasInk() || photoSig || $('#sigTypeText').value.trim());
  }

  /* ------------------------------------------------------------------ tools */
  function setTool(name) {
    S.tool = name; save();
    $$('.sf-tools button').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.tool === name ? 'true' : 'false'); });
    $$('.sf-panel').forEach(function (p) { p.hidden = p.id !== 'p' + name.charAt(0).toUpperCase() + name.slice(1); });
    if (name === 'sign') setTimeout(fitPad, 0);
  }
  $$('.sf-tools button').forEach(function (b) { b.addEventListener('click', function () { setTool(b.dataset.tool); }); });
  function segInit(id, get, set) {
    var seg = $(id);
    function paint() { $$('button', seg).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.val === get() ? 'true' : 'false'); }); }
    $$('button', seg).forEach(function (b) { b.addEventListener('click', function () { set(b.dataset.val); paint(); }); });
    paint();
  }
  segInit('#sigModeSeg', function () { return S.sigMode; }, function (v) { S.sigMode = v; save(); showSigMode(); });
  segInit('#fontSeg', function () { return S.font; }, function (v) { S.font = v; save(); });
  segInit('#inkColors', function () { return S.ink; }, function (v) { S.ink = v; save(); redrawPad(); renderTypePrev(); });
  function showSigMode() {
    $('#sigDrawBox').hidden = S.sigMode !== 'draw'; $('#sigTypeBox').hidden = S.sigMode !== 'type'; $('#sigPhotoBox').hidden = S.sigMode !== 'photo';
    if (S.sigMode === 'draw') setTimeout(fitPad, 0);
  }
  showSigMode();

  /* --- signature pad --- */
  var padCv = $('#sigPad'), padCtx = padCv.getContext('2d'), padW = 0, padH = 0;
  function fitPad() {
    var r = padCv.getBoundingClientRect();
    if (!r.width) return;
    var d = Math.min(window.devicePixelRatio || 1, 3);
    if (Math.round(r.width) === padW && Math.round(r.height) === padH && padCv.width === Math.round(r.width * d)) return;
    padW = Math.round(r.width); padH = Math.round(r.height);
    padCv.width = Math.round(padW * d); padCv.height = Math.round(padH * d);
    padCtx.setTransform(d, 0, 0, d, 0, 0);
    redrawPad();
  }
  function smoothPath(ctx, p) {
    var n = p.length / 2, i;
    ctx.beginPath(); ctx.moveTo(p[0], p[1]);
    if (n === 1) { ctx.lineTo(p[0] + 0.01, p[1]); return; }
    if (n === 2) { ctx.lineTo(p[2], p[3]); return; }
    for (i = 1; i < n - 1; i++) ctx.quadraticCurveTo(p[2 * i], p[2 * i + 1], (p[2 * i] + p[2 * i + 2]) / 2, (p[2 * i + 1] + p[2 * i + 3]) / 2);
    ctx.lineTo(p[2 * n - 2], p[2 * n - 1]);
  }
  function strokeAll(ctx, strokes, color, width) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = color; ctx.lineWidth = width;
    strokes.forEach(function (s) { smoothPath(ctx, s); ctx.stroke(); });
  }
  function redrawPad() {
    padCtx.save(); padCtx.setTransform(1, 0, 0, 1, 0, 0); padCtx.clearRect(0, 0, padCv.width, padCv.height); padCtx.restore();
    strokeAll(padCtx, pad.strokes.concat(pad.cur ? [pad.cur] : []), S.ink, 2.6);
  }
  function padHasInk() { return pad.strokes.length > 0; }
  padCv.addEventListener('pointerdown', function (e) {
    e.preventDefault(); fitPad();
    try { padCv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    var r = padCv.getBoundingClientRect();
    pad.cur = [e.clientX - r.left, e.clientY - r.top]; pad.pid = e.pointerId;
    redrawPad();
  });
  padCv.addEventListener('pointermove', function (e) {
    if (!pad.cur || e.pointerId !== pad.pid) return;
    var r = padCv.getBoundingClientRect();
    var evs = (e.getCoalescedEvents && e.getCoalescedEvents()) || [e];
    if (!evs.length) evs = [e];
    evs.forEach(function (ev) { pad.cur.push(ev.clientX - r.left, ev.clientY - r.top); });
    redrawPad();
  });
  function padEnd(e) {
    if (!pad.cur || (e && e.pointerId !== pad.pid)) return;
    pad.strokes.push(pad.cur); pad.cur = null; pad.dirty = true;
    redrawPad(); updateButtons();
  }
  padCv.addEventListener('pointerup', padEnd);
  padCv.addEventListener('pointercancel', padEnd);
  $('#sigClear').addEventListener('click', function () { pad.strokes = []; pad.cur = null; redrawPad(); updateButtons(); });
  window.addEventListener('resize', function () { if (!$('#pSign').hidden) fitPad(); });

  /* pad strokes -> cropped transparent PNG (2x) */
  function padToImage() {
    if (!pad.strokes.length) return null;
    var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    pad.strokes.forEach(function (s) { for (var i = 0; i < s.length; i += 2) { minX = Math.min(minX, s[i]); maxX = Math.max(maxX, s[i]); minY = Math.min(minY, s[i + 1]); maxY = Math.max(maxY, s[i + 1]); } });
    var m = 6, w = Math.max(10, maxX - minX + 2 * m), h = Math.max(10, maxY - minY + 2 * m), k = 2;
    var c = document.createElement('canvas'); c.width = Math.ceil(w * k); c.height = Math.ceil(h * k);
    var x = c.getContext('2d'); x.setTransform(k, 0, 0, k, (m - minX) * k, (m - minY) * k);
    strokeAll(x, pad.strokes, S.ink, 2.6);
    return { data: c.toDataURL('image/png'), w: w, h: h };
  }
  /* typed name in the handwriting font -> PNG */
  async function typedToImage(text) {
    await fontReady('600 48px "Dancing Script"');
    var size = 72, fam = HAND, padX = 14, padY = 10;
    var w = Math.ceil(textWidth(text, size, '600 ' + fam) + 2 * padX), h = Math.ceil(size * 1.3 + 2 * padY), k = 2;
    var c = document.createElement('canvas'); c.width = w * k; c.height = h * k;
    var x = c.getContext('2d'); x.scale(k, k);
    x.font = '600 ' + size + 'px ' + fam; x.fillStyle = S.ink; x.textBaseline = 'alphabetic'; x.direction = 'ltr';
    x.fillText(text, padX, padY + size * 0.95);
    return { data: c.toDataURL('image/png'), w: w, h: h };
  }
  function renderTypePrev() {
    var v = $('#sigTypeText').value.trim(), p = $('#sigTypePrev');
    p.classList.toggle('empty', !v);
    p.textContent = v || t('sig_type_prev_empty');
    p.style.color = v ? S.ink : '';
  }
  $('#sigTypeText').addEventListener('input', function () { renderTypePrev(); updateButtons(); });
  renderTypePrev();

  /* photo of a paper signature -> paper made transparent (Otsu threshold), ink recoloured, cropped */
  async function photoToImage(file) {
    var url = URL.createObjectURL(file), im;
    try { im = await loadImg(url); } finally { URL.revokeObjectURL(url); }
    var maxSide = 1200, sc = Math.min(1, maxSide / Math.max(im.naturalWidth, im.naturalHeight));
    var w = Math.max(1, Math.round(im.naturalWidth * sc)), h = Math.max(1, Math.round(im.naturalHeight * sc));
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var x = c.getContext('2d'); x.drawImage(im, 0, 0, w, h);
    var img = x.getImageData(0, 0, w, h), d = img.data, hist = new Array(256).fill(0), n = w * h, i, lum = new Uint8Array(n);
    for (i = 0; i < n; i++) { var l = (d[i * 4] * 299 + d[i * 4 + 1] * 587 + d[i * 4 + 2] * 114) / 1000 | 0; lum[i] = l; hist[l]++; }
    /* Otsu */
    var sum = 0, sumB = 0, wB = 0, best = 0, thr = 128;
    for (i = 0; i < 256; i++) sum += i * hist[i];
    for (i = 0; i < 256; i++) {
      wB += hist[i]; if (!wB) continue; var wF = n - wB; if (!wF) break;
      sumB += i * hist[i]; var mB = sumB / wB, mF = (sum - sumB) / wF, v = wB * wF * (mB - mF) * (mB - mF);
      if (v > best) { best = v; thr = i; }
    }
    var ink = hexRgb(S.ink), minX = w, minY = h, maxX = -1, maxY = -1, soft = 24;
    for (i = 0; i < n; i++) {
      var a = EDU.clamp((thr - lum[i]) / soft + 0.5, 0, 1);
      d[i * 4] = ink[0]; d[i * 4 + 1] = ink[1]; d[i * 4 + 2] = ink[2]; d[i * 4 + 3] = Math.round(a * 255);
      if (a > 0.5) { var px = i % w, py = (i / w) | 0; if (px < minX) minX = px; if (px > maxX) maxX = px; if (py < minY) minY = py; if (py > maxY) maxY = py; }
    }
    if (maxX < 0) throw code('blank');
    x.putImageData(img, 0, 0);
    var m = 8, cx = Math.max(0, minX - m), cy = Math.max(0, minY - m), cw = Math.min(w, maxX + m) - cx, ch = Math.min(h, maxY + m) - cy;
    var o = document.createElement('canvas'); o.width = cw; o.height = ch;
    o.getContext('2d').drawImage(c, cx, cy, cw, ch, 0, 0, cw, ch);
    return { data: o.toDataURL('image/png'), w: cw, h: ch };
  }
  $('#sigPhotoBtn').addEventListener('click', function () { $('#sigPhotoInput').click(); });
  $('#sigPhotoInput').addEventListener('change', async function () {
    var f = this.files && this.files[0]; this.value = '';
    if (!f) return;
    setBusy(t('working'));
    try { photoSig = await photoToImage(f); var pv = $('#sigPhotoPrev'); pv.src = photoSig.data; pv.hidden = false; updateButtons(); }
    catch (e) { pushMsg('danger', e && e.code === 'blank' ? 'err_blank' : 'err_img'); }
    setBusy('');
  });

  /* current signature source -> image */
  async function currentSigImage() {
    if (S.sigMode === 'draw') return padToImage();
    if (S.sigMode === 'type') { var v = $('#sigTypeText').value.trim(); return v ? typedToImage(v) : null; }
    return photoSig;
  }
  function placeImage(img, kind, pageIdx, fx, fy, widthPt) {
    var w = widthPt || (kind === 'init' ? 55 : kind === 'stamp' ? 110 : 150);
    var vp = pageOf(pageIdx); w = Math.min(w, vp.width * 0.8);
    var h = w * img.h / img.w;
    if (h > vp.height * 0.4) { h = vp.height * 0.4; w = h * img.w / img.h; }
    return { type: 'image', kind: kind, asset: addAsset(img.data, img.w, img.h), w: w, h: h, fx: fx, fy: fy };
  }
  function keep(slot, img) {
    if (img.data.length > MAX_SAVED) { EDU.toast(t('sig_too_big')); return; }
    saved[slot] = img; store.set(slot, img); renderSaved();
  }
  async function useSig(slot) {
    setBusy(t('working'));
    try {
      var img = await currentSigImage();
      if (!img) { EDU.toast(t('sig_empty')); setBusy(''); return; }
      keep(slot, img);
      snapshot();
      var spec = placeImage(img, slot, cur);
      addItem(spec, cur, slot === 'init' ? 0.86 : 0.68, slot === 'init' ? 0.92 : 0.78);
    } catch (e) { pushMsg('danger', 'err_img'); }
    setBusy('');
  }
  $('#sigUse').addEventListener('click', function () { useSig('sig'); });
  $('#sigUseInit').addEventListener('click', function () { useSig('init'); });
  function renderSaved() {
    var any = !!(saved.sig || saved.init);
    $('#savedBox').hidden = !any;
    $('#savedSig').hidden = !saved.sig; if (saved.sig) $('#savedSigImg').src = saved.sig.data;
    $('#savedInit').hidden = !saved.init; if (saved.init) $('#savedInitImg').src = saved.init.data;
    updateButtons();
  }
  $$('#savedBox button[data-slot]').forEach(function (b) {
    b.addEventListener('click', function () {
      var slot = b.dataset.slot, img = saved[slot], act = b.dataset.act;
      if (act === 'forget') { saved[slot] = null; store.remove(slot); renderSaved(); EDU.toast(t('forgotten')); return; }
      if (!img || !doc) return;
      var fx = slot === 'init' ? 0.86 : 0.68, fy = slot === 'init' ? 0.92 : 0.78;
      if (act === 'all') addToAllPages(placeImage(img, slot, cur), fx, fy);
      else { snapshot(); addItem(placeImage(img, slot, cur), cur, fx, fy); }
    });
  });
  renderSaved();

  /* --- text --- */
  function textSpec(text, size, font, color, kind) {
    var fam = font === 'hand' ? '600 ' + HAND : SANS;
    var w = textWidth(text, size, fam) + size * 0.3, h = size * 1.2;
    return { type: 'text', kind: kind || 'text', text: text, size: size, font: font, color: color, w: w, h: h };
  }
  $('#textAdd').addEventListener('click', async function () {
    var v = $('#textIn').value.trim(); if (!v || !doc) { if (!v) $('#textIn').focus(); return; }
    var size = EDU.clamp(parseInt($('#textSize').value, 10) || 14, 6, 72);
    S.textSize = size; save();
    if (S.font === 'hand') await fontReady('600 48px "Dancing Script"');
    snapshot(); addItem(textSpec(v, size, S.font, S.ink), cur, 0.5, 0.5);
  });
  $('#textIn').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); $('#textAdd').click(); } });

  /* --- date --- */
  function renderDateFmts() {
    var sel = $('#dateFmt'), d = pickedDate();
    sel.innerHTML = '';
    ['dmy-', 'dmy/', 'dmy.', 'dMy', 'ymd'].forEach(function (f) { sel.appendChild(el('option', { value: f, text: fmtDate(d, f) })); });
    sel.value = S.dateFmt;
  }
  (function () { var d = new Date(); $('#dateIn').value = d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); })();
  $('#dateIn').addEventListener('change', renderDateFmts);
  $('#dateFmt').addEventListener('change', function () { S.dateFmt = this.value; save(); });
  $('#dateAdd').addEventListener('click', function () {
    if (!doc) return;
    var size = EDU.clamp(parseInt($('#dateSize').value, 10) || 12, 6, 72);
    S.dateSize = size; save();
    snapshot(); addItem(textSpec(fmtDate(pickedDate(), S.dateFmt), size, 'sans', S.ink, 'date'), cur, 0.68, 0.86);
  });

  /* --- tick / cross / white-out --- */
  $('#tickAdd').addEventListener('click', function () { if (doc) { snapshot(); addItem({ type: 'tick', color: S.ink, w: 18, h: 18 }, cur, 0.5, 0.5); } });
  $('#crossAdd').addEventListener('click', function () { if (doc) { snapshot(); addItem({ type: 'cross', color: S.ink, w: 18, h: 18 }, cur, 0.5, 0.5); } });
  $('#hideAdd').addEventListener('click', function () { if (doc) { snapshot(); addItem({ type: 'white', w: 120, h: 24 }, cur, 0.5, 0.5); } });

  /* --- stamp --- */
  $('#stampBtn').addEventListener('click', function () { $('#stampInput').click(); });
  $('#stampInput').addEventListener('change', async function () {
    var f = this.files && this.files[0]; this.value = '';
    if (!f) return;
    setBusy(t('working'));
    try {
      var url = URL.createObjectURL(f), im;
      try { im = await loadImg(url); } finally { URL.revokeObjectURL(url); }
      var maxSide = 1000, sc = Math.min(1, maxSide / Math.max(im.naturalWidth, im.naturalHeight));
      var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.naturalWidth * sc)); c.height = Math.max(1, Math.round(im.naturalHeight * sc));
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      stamp = { data: c.toDataURL(/jpe?g$/i.test(f.type) || /\.jpe?g$/i.test(f.name) ? 'image/jpeg' : 'image/png', 0.92), w: c.width, h: c.height };
      $('#stampImg').src = stamp.data; $('#stampBox').hidden = false;
      if (doc) { snapshot(); addItem(placeImage(stamp, 'stamp', cur), cur, 0.5, 0.5); }
    } catch (e) { pushMsg('danger', 'err_img'); }
    setBusy('');
  });
  $('#stampAdd').addEventListener('click', function () { if (stamp && doc) { snapshot(); addItem(placeImage(stamp, 'stamp', cur), cur, 0.5, 0.5); } });
  $('#stampAddAll').addEventListener('click', function () { if (stamp && doc) addToAllPages(placeImage(stamp, 'stamp', cur), 0.5, 0.5); });

  /* --- self attested: text + signature + date, stacked --- */
  function selfDefault() { return S.selfTouched ? S.selfText : t('self_default'); }
  $('#selfText').value = selfDefault();
  $('#selfText').addEventListener('input', function () { S.selfText = this.value; S.selfTouched = true; save(); });
  async function selfSpecs() {
    var img = saved.sig || await currentSigImage();
    if (!img) { setTool('sign'); $('#selfNeed').hidden = false; EDU.toast(t('self_need_sig')); return null; }
    if (!saved.sig) keep('sig', img);
    var text = ($('#selfText').value.trim() || t('self_default'));
    var sig = placeImage(img, 'sig', cur, null, null, 120);
    var txt = textSpec(text, 12, 'sans', S.ink);
    var dt = textSpec(fmtDate(new Date(), S.dateFmt), 11, 'sans', S.ink, 'date');
    return [txt, sig, dt];
  }
  async function addSelf(all) {
    if (!doc) return;
    var specs = await selfSpecs(); if (!specs) return;
    snapshot();
    var pagesToDo = all ? items.length >= 0 && Array.from({ length: numPages }, function (_, i) { return i; }) : [cur];
    for (var k = 0; k < pagesToDo.length; k++) {
      var p = pagesToDo[k], vp = await viewportOf(p);
      var x = vp.width * 0.62, y = vp.height * 0.74, gap = 4;
      [specs[0], specs[1], specs[2]].forEach(function (sp) {
        var it = Object.assign({}, sp, { x: x, y: y });
        it = addItem(it, p, null, null, true);
        y = it.y + it.h + gap;
      });
    }
    selected = null; renderItems(); updateButtons();
    var msg = all ? t('added_all', { n: EDU.fmt(numPages) }) : t('added');
    announce(msg); if (all) EDU.toast(msg);
  }
  $('#selfAdd').addEventListener('click', function () { addSelf(false); });
  $('#selfAddAll').addEventListener('click', function () { addSelf(true); });

  /* --- form panel --- */
  function renderFormPanel() {
    var list = $('#formList'); list.innerHTML = '';
    var help = $('#formHelp');
    $('#flattenBox').hidden = !fields.length;
    $('#flatten').checked = S.flatten;
    if (!doc) { help.textContent = ''; return; }
    if (!hasForm || !fields.length) { help.textContent = xfa ? t('form_xfa') : t('form_none'); return; }
    help.textContent = (xfa ? t('form_xfa') + ' ' : '') + t('form_help', { n: EDU.fmt(fields.length) });
    fields.forEach(function (f, fi) {
      var lab = el('label', { class: f.type === 'check' ? 'check' : 'field' });
      var inp;
      if (f.type === 'text') {
        inp = el(f.multiline ? 'textarea' : 'input', f.multiline ? { rows: '3' } : { type: 'text', dir: 'auto' });
        if (f.maxLen) inp.maxLength = f.maxLen;
        inp.value = f.value;
        inp.addEventListener('input', function () { f.value = inp.value; renderFields(); });
      } else if (f.type === 'check') {
        inp = el('input', { type: 'checkbox' }); inp.checked = !!f.value;
        inp.addEventListener('change', function () { f.value = inp.checked; renderFields(); });
      } else {
        inp = el('select');
        inp.appendChild(el('option', { value: '', text: '—' }));
        f.options.forEach(function (o) { inp.appendChild(el('option', { value: o, text: o })); });
        inp.value = f.value;
        inp.addEventListener('change', function () { f.value = inp.value; renderFields(); });
      }
      inp.dataset.fi = fi;
      inp.addEventListener('focus', function () { $$('#fieldLayer .sf-field').forEach(function (b) { b.classList.toggle('hot', b.title === f.name); }); });
      inp.addEventListener('blur', function () { $$('#fieldLayer .sf-field.hot').forEach(function (b) { b.classList.remove('hot'); }); });
      var name = el('span', { text: f.name });
      if (f.type === 'check') { lab.appendChild(inp); lab.appendChild(name); }
      else { lab.appendChild(name); lab.appendChild(inp); }
      list.appendChild(lab);
    });
  }
  $('#flatten').addEventListener('change', function () { S.flatten = this.checked; save(); });

  /* ------------------------------------------------------------------ files in */
  $('#openBtn').addEventListener('click', function () { $('#fileInput').click(); });
  $('#fileInput').addEventListener('change', function () { var f = this.files && this.files[0]; this.value = ''; if (f) openFile(f); });
  ['dragenter', 'dragover'].forEach(function (ev) { document.addEventListener(ev, function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0) { e.preventDefault(); $('#drop').classList.add('over'); } }); });
  ['dragleave', 'drop'].forEach(function (ev) { document.addEventListener(ev, function (e) { if (ev === 'drop') e.preventDefault(); if (ev === 'dragleave' && e.relatedTarget) return; $('#drop').classList.remove('over'); }); });
  document.addEventListener('drop', function (e) { var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) openFile(f); });

  /* ------------------------------------------------------------------ sample PDF (one page, in the UI language, with 2 form fields) */
  function wrapText(ctx, text, maxW) {
    var words = String(text).split(/\s+/), lines = [], line = '';
    words.forEach(function (w) {
      var test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
    });
    if (line) lines.push(line);
    return lines;
  }
  async function makeSample() {
    var L = PDFLib, k = 2, W = A4[0], H = A4[1], rtl = isRTL();
    var c = document.createElement('canvas'); c.width = Math.round(W * k); c.height = Math.round(H * k);
    var x = c.getContext('2d'); x.scale(k, k);
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
    var fam = '"Noto Sans", "Nirmala UI", "Segoe UI", Arial, sans-serif', mL = 56, mR = W - 56, cw = mR - mL;
    x.direction = rtl ? 'rtl' : 'ltr'; x.textAlign = rtl ? 'right' : 'left'; x.textBaseline = 'alphabetic';
    var ax = rtl ? mR : mL, y = 70;
    function line(txt, size, weight, color, gap) {
      x.font = (weight || 400) + ' ' + size + 'px ' + fam; x.fillStyle = color || '#111';
      wrapText(x, txt, cw).forEach(function (ln) { x.fillText(ln, ax, y); y += size * 1.45; });
      y += gap || 0;
    }
    x.fillStyle = '#1a3fb5'; x.fillRect(mL, 44, cw, 3);
    line(t('sample_org'), 15, 700, '#1a3fb5', 2);
    line(t('sample_addr'), 10, 400, '#555', 18);
    x.textAlign = 'center'; x.font = '700 22px ' + fam; x.fillStyle = '#111'; x.fillText(t('sample_heading'), W / 2, y); y += 40;
    x.textAlign = rtl ? 'right' : 'left';
    line(fmtDate(new Date(), 'dMy'), 11, 400, '#333', 10);
    line(t('sample_p1'), 12, 600, '#111', 6);
    line(t('sample_p2'), 12, 400, '#111', 6);
    line(t('sample_p3'), 12, 400, '#111', 16);
    var boxes = {};
    function labelled(key, boxW, boxH, dotted) {
      x.font = '600 12px ' + fam; x.fillStyle = '#111';
      var lab = t(key), lw = x.measureText(lab).width;
      x.fillText(lab, ax, y);
      var bx = rtl ? ax - lw - 12 - boxW : ax + lw + 12;
      var by = y - boxH + 4;
      x.strokeStyle = '#9a9a9a'; x.lineWidth = 1; x.setLineDash(dotted ? [2, 3] : []);
      x.strokeRect(bx, by, boxW, boxH); x.setLineDash([]);
      boxes[key] = { x: bx, y: by, w: boxW, h: boxH };
      y += boxH + 18;
    }
    labelled('sample_name_lbl', Math.min(260, cw * 0.55), 22, false);
    /* checkbox + sentence */
    (function () {
      var s = 14, bx = rtl ? ax - s : ax, by = y - s + 3;
      x.strokeStyle = '#9a9a9a'; x.lineWidth = 1; x.strokeRect(bx, by, s, s);
      x.font = '400 12px ' + fam; x.fillStyle = '#111';
      x.fillText(t('sample_agree'), rtl ? ax - s - 10 : ax + s + 10, y);
      boxes.agree = { x: bx, y: by, w: s, h: s };
      y += 40;
    })();
    labelled('sample_sign_lbl', Math.min(200, cw * 0.45), 44, true);
    labelled('sample_date_lbl', 120, 22, true);
    y = H - 60;
    x.fillStyle = '#9a9a9a'; x.fillRect(mL, y - 18, cw, 1);
    x.font = '400 9px ' + fam; x.fillStyle = '#777';
    wrapText(x, t('sample_footer'), cw).forEach(function (ln) { x.fillText(ln, ax, y); y += 13; });

    var pdf = await L.PDFDocument.create();
    pdf.setTitle(t('sample_title'));
    var page = pdf.addPage([W, H]);
    var png = await pdf.embedPng(dataUrlBytes(c.toDataURL('image/png')));
    page.drawImage(png, { x: 0, y: 0, width: W, height: H });
    var form = pdf.getForm(), helv = await pdf.embedFont(L.StandardFonts.Helvetica);
    var nb = boxes.sample_name_lbl, ab = boxes.agree;
    var tf = form.createTextField('Name');
    tf.addToPage(page, { x: nb.x + 1, y: H - nb.y - nb.h + 1, width: nb.w - 2, height: nb.h - 2, borderWidth: 0, backgroundColor: L.rgb(1, 1, 1), font: helv });
    tf.setFontSize(11);
    var cb = form.createCheckBox('Accept');
    cb.addToPage(page, { x: ab.x + 1, y: H - ab.y - ab.h + 1, width: ab.w - 2, height: ab.h - 2, borderWidth: 0, backgroundColor: L.rgb(1, 1, 1) });
    form.updateFieldAppearances(helv);
    return pdf.save();
  }
  $('#sampleBtn').addEventListener('click', async function () {
    if (engine !== 'ready') { if (engine === 'failed') $('#engine').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    setBusy(t('working'));
    try { var bytes = await makeSample(); await openBytes(new Uint8Array(bytes), t('sample_file')); }
    catch (e) { console.warn('[' + SLUG + '] sample', e); pushMsg('danger', 'err_corrupt', { name: t('sample_file') }); }
    setBusy('');
  });

  /* ------------------------------------------------------------------ save */
  function textToPng(it) {
    var k = 3, fam = it.font === 'hand' ? '600 ' + HAND : SANS;
    var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(it.w * k)); c.height = Math.max(1, Math.ceil(it.h * k));
    var x = c.getContext('2d'); x.scale(k, k);
    x.font = (it.font === 'hand' ? '600 ' : '') + it.size + 'px ' + (it.font === 'hand' ? HAND : SANS);
    x.fillStyle = it.color; x.textBaseline = 'alphabetic'; x.direction = 'ltr'; x.textAlign = 'left';
    x.fillText(it.text, it.size * 0.15, it.size * 0.95);
    void fam;
    return dataUrlBytes(c.toDataURL('image/png'));
  }
  async function buildPdf() {
    var L = PDFLib, pdf = await L.PDFDocument.load(origBytes, { updateMetadata: false });
    var pages = pdf.getPages(), helv = null, imgCache = {};
    async function font() { return helv || (helv = await pdf.embedFont(L.StandardFonts.Helvetica)); }
    async function image(assetId) {
      if (imgCache[assetId]) return imgCache[assetId];
      var a = assets[assetId], bytes = dataUrlBytes(a.data);
      var im = /^data:image\/jpe?g/.test(a.data) ? await pdf.embedJpg(bytes) : await pdf.embedPng(bytes);
      imgCache[assetId] = im; return im;
    }
    function col(hex) { var c = hexRgb(hex); return L.rgb(c[0] / 255, c[1] / 255, c[2] / 255); }

    /* 1. form fields */
    if (fields.length) {
      var form = pdf.getForm(), all = form.getFields();
      for (var fi = 0; fi < fields.length; fi++) {
        var f = fields[fi], pf = null;
        for (var j = 0; j < all.length; j++) if (all[j].getName() === f.name) { pf = all[j]; break; }
        if (!pf) continue;
        try {
          if (f.type === 'text') {
            var v = String(f.value || '');
            if (isAscii(v)) pf.setText(v || undefined);
            else {
              pf.setText(undefined);
              /* Indic / Urdu text: draw an image into every widget box of this field */
              for (var r = 0; r < f.rects.length; r++) {
                var rc = f.rects[r], pg = pages[rc.page]; if (!pg) continue;
                var bw = rc.r[2] - rc.r[0], bh = rc.r[3] - rc.r[1], size = Math.min(bh * 0.7, 14);
                var fake = { text: v, size: size, font: 'sans', color: '#000000', w: Math.min(bw - 2, textWidth(v, size, SANS) + size * 0.3), h: size * 1.2 };
                var pngBytes = textToPng(fake), im = await pdf.embedPng(pngBytes);
                var rot = pg.getRotation().angle, vp = await viewportOf(rc.page);
                var vr = vp.convertToViewportRectangle(rc.r), vx = Math.min(vr[0], vr[2]), vy = Math.min(vr[1], vr[3]), vh = Math.abs(vr[3] - vr[1]);
                var anchor = vp.convertToPdfPoint(vx + 1, vy + (vh + fake.h) / 2);
                pg.drawImage(im, { x: anchor[0], y: anchor[1], width: fake.w, height: fake.h, rotate: L.degrees(rot) });
              }
            }
          } else if (f.type === 'check') { if (f.value) pf.check(); else pf.uncheck(); }
          else if (f.type === 'radio') { if (f.value) pf.select(f.value); }
          else if (f.type === 'select') { if (f.value) pf.select(f.value); else if (pf.clear) pf.clear(); }
        } catch (e) { console.warn('[' + SLUG + '] field', f.name, e); }
      }
      if (S.flatten) {
        try { form.flatten(); }
        catch (e) { console.warn('[' + SLUG + '] flatten failed, fields left fillable', e); try { form.updateFieldAppearances(await font()); } catch (e2) { /* ignore */ } }
      }
    }

    /* 2. items */
    for (var i = 0; i < items.length; i++) {
      var it = items[i], page = pages[it.page]; if (!page) continue;
      var vpp = await viewportOf(it.page), rotA = page.getRotation().angle, R = L.degrees(rotA);
      var bl = vpp.convertToPdfPoint(it.x, it.y + it.h);   // bottom-left of the item as seen on screen
      if (it.type === 'image') {
        var em = await image(it.asset);
        page.drawImage(em, { x: bl[0], y: bl[1], width: it.w, height: it.h, rotate: R });
      } else if (it.type === 'white') {
        page.drawRectangle({ x: bl[0], y: bl[1], width: it.w, height: it.h, color: L.rgb(1, 1, 1), borderWidth: 0, rotate: R });
      } else if (it.type === 'tick' || it.type === 'cross') {
        var pts = it.type === 'tick'
          ? [[0.14, 0.55, 0.4, 0.84], [0.4, 0.84, 0.88, 0.16]]
          : [[0.16, 0.16, 0.84, 0.84], [0.84, 0.16, 0.16, 0.84]];
        var th = Math.max(1.5, Math.min(it.w, it.h) * 0.12);
        for (var q = 0; q < pts.length; q++) {
          var a1 = vpp.convertToPdfPoint(it.x + pts[q][0] * it.w, it.y + pts[q][1] * it.h), a2 = vpp.convertToPdfPoint(it.x + pts[q][2] * it.w, it.y + pts[q][3] * it.h);
          page.drawLine({ start: { x: a1[0], y: a1[1] }, end: { x: a2[0], y: a2[1] }, thickness: th, color: col(it.color), lineCap: L.LineCapStyle.Round });
        }
      } else if (it.type === 'text') {
        if (it.font !== 'hand' && isAscii(it.text)) {
          var base = vpp.convertToPdfPoint(it.x + it.size * 0.15, it.y + it.size * 0.95);
          page.drawText(it.text, { x: base[0], y: base[1], size: it.size, font: await font(), color: col(it.color), rotate: R });
        } else {
          var tp = await pdf.embedPng(textToPng(it));
          page.drawImage(tp, { x: bl[0], y: bl[1], width: it.w, height: it.h, rotate: R });
        }
      }
      if (i % 20 === 19) await tick();
    }
    try { return await pdf.save(); }
    catch (e) { console.warn('[' + SLUG + '] save with appearances failed, retrying', e); return pdf.save({ updateFieldAppearances: false }); }
  }
  async function doSave() {
    if (!doc || busy || engine !== 'ready') return;
    var filled = fields.some(function (f) { return f.type === 'check' ? !!f.value : !!f.value; });
    if (!items.length && !filled) { EDU.toast(t('nothing_added')); return; }
    busy = true; updateButtons();
    $('#progBox').hidden = false; $('#progMsg').textContent = t('saving'); $('#result').hidden = true;
    await tick();
    try {
      var bytes = await buildPdf();
      var name = (cleanName($('#outName').value) || cleanName(fileName) + '-signed' || 'signed') + '.pdf';
      var blob = new Blob([bytes], { type: 'application/pdf' });
      lastResult = { blob: blob, name: name };
      EDU.download(name, blob, 'application/pdf');
      $('#resultMsg').textContent = t('result_msg', { name: name, size: fmtSize(blob.size) });
      $('#result').hidden = false;
    } catch (e) {
      console.warn('[' + SLUG + '] save failed', e);
      pushMsg('danger', 'err_save');
    }
    $('#progBox').hidden = true;
    busy = false; updateButtons();
  }
  $('#saveBtn').addEventListener('click', doSave);
  $('#againBtn').addEventListener('click', function () { if (lastResult) EDU.download(lastResult.name, lastResult.blob, 'application/pdf'); });
  $('#outName').addEventListener('input', function () { $('#result').hidden = true; });

  /* ------------------------------------------------------------------ reset */
  $('#resetAll').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    store.remove('settings'); store.remove('sig'); store.remove('init');
    saved = { sig: null, init: null };
    Object.keys(DEFAULTS).forEach(function (k) { S[k] = DEFAULTS[k]; });
    pad.strokes = []; photoSig = null; $('#sigPhotoPrev').hidden = true; $('#sigTypeText').value = ''; renderTypePrev();
    $('#selfText').value = selfDefault();
    $('#textSize').value = S.textSize; $('#dateSize').value = S.dateSize;
    renderSaved(); redrawPad(); renderDateFmts(); setTool('sign'); showSigMode();
    $$('.seg').forEach(function (seg) { $$('button', seg).forEach(function (b) { var v = seg.id === 'sigModeSeg' ? S.sigMode : seg.id === 'fontSeg' ? S.font : null; if (v !== null) b.setAttribute('aria-pressed', b.dataset.val === v ? 'true' : 'false'); }); });
    $$('#inkColors button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.val === S.ink ? 'true' : 'false'); });
    EDU.toast(t('reset_done'));
  });

  /* ------------------------------------------------------------------ language */
  function renderAll() {
    renderEngineMsg(); renderMsgs(); renderDateFmts(); renderTypePrev();
    if (!S.selfTouched) $('#selfText').value = t('self_default');
    $('#pageTotal').textContent = doc ? '/ ' + EDU.fmt(numPages) : '';
    if (doc) {
      $('#fnameInf').textContent = '· ' + (numPages === 1 ? t('one_page') : t('n_pages', { n: EDU.fmt(numPages) })) + ' · ' + fmtSize(origBytes.length);
      renderFormPanel(); renderFields(); renderItems();
    }
    if (lastResult) $('#resultMsg').textContent = t('result_msg', { name: lastResult.name, size: fmtSize(lastResult.blob.size) });
    updateButtons();
  }
  EDU.onLang(renderAll);

  /* ------------------------------------------------------------------ start */
  $('#textSize').value = S.textSize; $('#dateSize').value = S.dateSize;
  setTool(S.tool);
  renderDateFmts();
  updateButtons();
  startEngine();

  /* hooks for the automated test only */
  window.__sf = { items: function () { return JSON.parse(JSON.stringify(items)); }, viewport: viewportOf, worker: function () { return pdfWorker; }, scale: function () { return scale; } };
})();
