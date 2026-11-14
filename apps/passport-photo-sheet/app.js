/* Passport Photo Sheet Maker: one photo -> a printable sheet of passport-size photos at 300 dpi.
   Everything happens in the browser; the photo is never uploaded. */
(function () {
  'use strict';
  var $ = EDU.$, $$ = EDU.$$, t = EDU.t;
  var store = EDU.store('passport-photo-sheet');
  var DPI = 300;
  var MARGIN_MM = 2, BORDER_MM = 1;
  var PRESETS = { '35x45': [35, 45], '51x51': [51, 51], '25x35': [25, 35] };
  var PAPERS = { '4x6': [101.6, 152.4], 'a4': [210, 297], '5x7': [127, 177.8] };
  var MAX_SIDE = 4000;

  function mmToPx(mm) { return Math.round(mm * DPI / 25.4); }

  /* How many photos fit. Tries the paper upright and sideways and keeps the better one. */
  function layout(paperWmm, paperHmm, photoWmm, photoHmm, border) {
    var pw = mmToPx(photoWmm), ph = mmToPx(photoHmm);
    var b = border ? mmToPx(BORDER_MM) : 0, m = mmToPx(MARGIN_MM);
    var cw = pw + 2 * b, chh = ph + 2 * b;
    function fit(W, H) {
      var cols = Math.max(0, Math.floor((W - 2 * m) / cw)), rows = Math.max(0, Math.floor((H - 2 * m) / chh));
      return { W: W, H: H, cols: cols, rows: rows, count: cols * rows };
    }
    var A = mmToPx(paperWmm), B = mmToPx(paperHmm);
    var p = fit(A, B), l = fit(B, A);
    var best = l.count > p.count ? l : p;
    best.pw = pw; best.ph = ph; best.b = b; best.cellW = cw; best.cellH = chh;
    best.x0 = Math.round((best.W - best.cols * cw) / 2);
    best.y0 = Math.round((best.H - best.rows * chh) / 2);
    return best;
  }

  var st = {
    size: store.get('size', '35x45'),
    cw: store.get('cw', 30), ch: store.get('ch', 40),
    paper: store.get('paper', '4x6'),
    border: store.get('border', true),
    cut: store.get('cut', true)
  };
  if (!PRESETS[st.size] && st.size !== 'custom') st.size = '35x45';
  if (!PAPERS[st.paper]) st.paper = '4x6';

  var src = null;        // canvas holding the photo (or the sample)
  var isSample = true;
  var view = { cx: 0, cy: 0, z: 1 };
  var photoCv = document.createElement('canvas');
  var lastLayout = null;

  EDU.init({ slug: 'passport-photo-sheet', title: 'app_title', waKey: 'shell_wa_tool' });

  function clampMm(v, d) { v = parseFloat(v); if (!isFinite(v)) return d; return Math.min(150, Math.max(10, Math.round(v * 10) / 10)); }
  function photoMm() {
    if (st.size === 'custom') return [clampMm(st.cw, 30), clampMm(st.ch, 40)];
    return PRESETS[st.size];
  }

  /* ---------- sample picture (a plain drawn figure, so the page is useful at once) ---------- */
  function makeSample() {
    var c = document.createElement('canvas'); c.width = 800; c.height = 1000;
    var g = c.getContext('2d');
    g.fillStyle = '#dfe9f3'; g.fillRect(0, 0, 800, 1000);
    g.fillStyle = '#5b7a99';
    g.beginPath(); g.ellipse(400, 1010, 330, 330, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#e9c9a8'; g.fillRect(350, 560, 100, 150);
    g.beginPath(); g.ellipse(400, 420, 165, 210, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#3a2f2a';
    g.beginPath(); g.ellipse(400, 290, 175, 120, 0, Math.PI, 0); g.fill();
    g.fillRect(225, 285, 350, 40);
    g.fillStyle = '#2b2b2b';
    g.beginPath(); g.arc(335, 420, 13, 0, Math.PI * 2); g.arc(465, 420, 13, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#8a5a44'; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.arc(400, 500, 55, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
    return c;
  }

  /* ---------- crop maths: cx, cy = centre of the frame in source pixels; z = zoom (1 = photo just covers the frame) ---------- */
  function frame() {
    var mm = photoMm(), asp = mm[0] / mm[1];
    var sw = Math.min(src.width, src.height * asp) / view.z, sh = sw / asp;
    return { sw: sw, sh: sh };
  }
  function clampView() {
    view.z = Math.min(4, Math.max(1, view.z));
    var f = frame();
    view.cx = Math.min(src.width - f.sw / 2, Math.max(f.sw / 2, view.cx));
    view.cy = Math.min(src.height - f.sh / 2, Math.max(f.sh / 2, view.cy));
  }
  function recenter() { view.z = 1; view.cx = src.width / 2; view.cy = src.height / 2; clampView(); }

  function drawCropTo(cv, guide) {
    var g = cv.getContext('2d'), f = frame();
    g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(src, view.cx - f.sw / 2, view.cy - f.sh / 2, f.sw, f.sh, 0, 0, cv.width, cv.height);
    if (!guide) return;
    var W = cv.width, H = cv.height;
    function stroke(color, width, dash) { g.strokeStyle = color; g.lineWidth = width; g.setLineDash(dash); g.stroke(); }
    g.beginPath(); g.ellipse(W / 2, H * 0.44, W * 0.29, H * 0.33, 0, 0, Math.PI * 2);
    stroke('rgba(0,0,0,.55)', Math.max(3, W / 110), []);
    stroke('#fff', Math.max(1.5, W / 220), [W / 30, W / 40]);
    g.beginPath(); g.moveTo(W / 2, H * 0.04); g.lineTo(W / 2, H * 0.96);
    stroke('rgba(255,255,255,.75)', Math.max(1, W / 300), [W / 60, W / 40]);
    g.setLineDash([]);
  }

  function renderSheet() {
    var mm = photoMm(), paper = PAPERS[st.paper];
    var L = layout(paper[0], paper[1], mm[0], mm[1], st.border);
    lastLayout = L;
    photoCv.width = L.pw; photoCv.height = L.ph;
    drawCropTo(photoCv, false);
    var cv = $('#sheet');
    cv.width = L.W; cv.height = L.H;
    var g = cv.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, L.W, L.H);
    for (var r = 0; r < L.rows; r++) for (var c = 0; c < L.cols; c++) {
      g.drawImage(photoCv, L.x0 + c * L.cellW + L.b, L.y0 + r * L.cellH + L.b);
    }
    if (st.cut && L.count) {
      g.strokeStyle = '#9a9a9a'; g.lineWidth = 1;
      g.beginPath();
      for (var i = 0; i <= L.cols; i++) { var x = L.x0 + i * L.cellW + 0.5; g.moveTo(x, 0); g.lineTo(x, L.H); }
      for (var j = 0; j <= L.rows; j++) { var y = L.y0 + j * L.cellH + 0.5; g.moveTo(0, y); g.lineTo(L.W, y); }
      if (!L.b) {      // no white border: keep the lines off the photos, only in the outer margin
        g.save(); g.beginPath();
        for (i = 0; i <= L.cols; i++) { x = L.x0 + i * L.cellW + 0.5; g.moveTo(x, 0); g.lineTo(x, L.y0); g.moveTo(x, L.y0 + L.rows * L.cellH); g.lineTo(x, L.H); }
        for (j = 0; j <= L.rows; j++) { y = L.y0 + j * L.cellH + 0.5; g.moveTo(0, y); g.lineTo(L.x0, y); g.moveTo(L.x0 + L.cols * L.cellW, y); g.lineTo(L.W, y); }
        g.stroke(); g.restore();
      } else g.stroke();
    }
    cv.dataset.count = String(L.count);
    cv.dataset.photoW = String(L.pw); cv.dataset.photoH = String(L.ph);
    renderText();
  }

  function mmLabel(v) { return EDU.fmt(v, { maximumFractionDigits: 1 }); }
  /* In Urdu (right to left) keep sizes like "35 × 45" reading left to right, so width never swaps with height. */
  function iso(s) {
    if (EDU.lang !== 'ur') return s;
    return s.replace(/\d+(?:[.,]\d+)?(?:\s*×\s*\d+(?:[.,]\d+)?)*/g, function (m) { return '⁦' + m + '⁩'; });
  }
  function isoStatic() {
    if (EDU.lang !== 'ur') return;
    $$('#sizeOpts .chip, #paperOpts .chip, [data-i18n="tip3"]').forEach(function (el) { el.textContent = iso(t(el.getAttribute('data-i18n'))); });
  }
  function renderText() {
    var L = lastLayout, mm = photoMm();
    if (!L) return;
    var ok = L.count > 0;
    $('#countText').textContent = iso(ok ? t('count_line', { n: EDU.fmt(L.count), w: mmLabel(mm[0]), h: mmLabel(mm[1]) }) : t('err_no_fit'));
    $('#pxLine').textContent = iso(t('px_line', { w: L.W, h: L.H, pw: L.pw, ph: L.ph }));
    ['#dlJpg', '#dlPng', '#printBtn'].forEach(function (s) { $(s).disabled = !ok; });
    $('#photoNote').textContent = isSample ? t('sample_note') : t('photo_ready');
    $('#choose').textContent = isSample ? t('choose_photo') : t('change_photo');
  }

  function renderControls() {
    $$('#sizeOpts .chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.size === st.size)); });
    $$('#paperOpts .chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.paper === st.paper)); });
    $('#customBox').hidden = st.size !== 'custom';
    if (document.activeElement !== $('#cw')) $('#cw').value = st.cw;
    if (document.activeElement !== $('#ch')) $('#ch').value = st.ch;
    $('#optBorder').checked = !!st.border; $('#optCut').checked = !!st.cut;
    $('#zoom').value = Math.round(view.z * 100);
  }

  var raf = 0;
  function refresh() {
    clampView();
    var mm = photoMm(), cv = $('#crop');
    var w = 420, h = Math.round(w * mm[1] / mm[0]);
    if (h > 560) { h = 560; w = Math.round(h * mm[0] / mm[1]); }
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    cv.style.width = Math.round(w * 2 / 3) + 'px';
    drawCropTo(cv, true);
    renderControls();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(renderSheet);
  }
  function save() { ['size', 'cw', 'ch', 'paper', 'border', 'cut'].forEach(function (k) { store.set(k, st[k]); }); }

  /* ---------- loading a photo ---------- */
  function loadFile(file) {
    if (!file) return;
    if (file.type && file.type.indexOf('image/') !== 0) { EDU.toast(t('err_not_image')); return; }
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function () {
      try {
        var w = img.naturalWidth, h = img.naturalHeight;
        if (!w || !h) throw new Error('empty');
        var k = Math.min(1, MAX_SIDE / Math.max(w, h));
        var c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
        var g = c.getContext('2d');
        g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
        g.imageSmoothingQuality = 'high';
        g.drawImage(img, 0, 0, c.width, c.height);
        src = c; isSample = false; recenter(); refresh();
      } catch (e) { EDU.toast(t('err_not_image')); }
      URL.revokeObjectURL(url);
    };
    img.onerror = function () { URL.revokeObjectURL(url); EDU.toast(t('err_not_image')); };
    img.src = url;
  }
  $('#choose').addEventListener('click', function () { $('#fileIn').click(); });
  $('#fileIn').addEventListener('change', function () { loadFile(this.files && this.files[0]); this.value = ''; });
  document.addEventListener('dragover', function (e) { e.preventDefault(); });
  document.addEventListener('drop', function (e) { e.preventDefault(); if (e.dataTransfer && e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); });

  /* ---------- pan and zoom ---------- */
  var crop = $('#crop'), pts = {}, pinch = 0;
  function zoomTo(z) { view.z = z; refresh(); }
  crop.addEventListener('pointerdown', function (e) {
    pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    try { crop.setPointerCapture(e.pointerId); } catch (x) { }
    pinch = 0;
  });
  crop.addEventListener('pointermove', function (e) {
    var p = pts[e.pointerId]; if (!p) return;
    var ids = Object.keys(pts), rect = crop.getBoundingClientRect(), f = frame();
    if (ids.length >= 2) {
      p.x = e.clientX; p.y = e.clientY;
      var a = pts[ids[0]], b = pts[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch && d) view.z *= d / pinch;
      pinch = d; refresh(); return;
    }
    var k = f.sw / (rect.width || 1);
    view.cx -= (e.clientX - p.x) * k; view.cy -= (e.clientY - p.y) * k;
    p.x = e.clientX; p.y = e.clientY;
    refresh();
  });
  function up(e) { delete pts[e.pointerId]; pinch = 0; }
  crop.addEventListener('pointerup', up); crop.addEventListener('pointercancel', up);
  crop.addEventListener('wheel', function (e) { e.preventDefault(); zoomTo(view.z * (e.deltaY < 0 ? 1.08 : 1 / 1.08)); }, { passive: false });
  /* arrow keys move the photo the same way dragging does (Left = photo goes left) */
  crop.addEventListener('keydown', function (e) {
    var f = frame(), s = f.sw / 25, k = e.key;
    if (k === 'ArrowLeft') view.cx += s; else if (k === 'ArrowRight') view.cx -= s;
    else if (k === 'ArrowUp') view.cy += s; else if (k === 'ArrowDown') view.cy -= s;
    else if (k === '+' || k === '=') view.z *= 1.08; else if (k === '-') view.z /= 1.08;
    else return;
    e.preventDefault(); refresh();
  });
  $('#zoom').addEventListener('input', function () { zoomTo(this.value / 100); });
  $('#zoomIn').addEventListener('click', function () { zoomTo(view.z * 1.1); });
  $('#zoomOut').addEventListener('click', function () { zoomTo(view.z / 1.1); });
  $('#recenter').addEventListener('click', function () { recenter(); refresh(); });

  /* ---------- options ---------- */
  $('#sizeOpts').addEventListener('click', function (e) { var b = e.target.closest('[data-size]'); if (!b) return; st.size = b.dataset.size; save(); refresh(); });
  $('#paperOpts').addEventListener('click', function (e) { var b = e.target.closest('[data-paper]'); if (!b) return; st.paper = b.dataset.paper; save(); refresh(); });
  ['cw', 'ch'].forEach(function (id) {
    $('#' + id).addEventListener('input', function () { var v = parseFloat(this.value); if (isFinite(v) && v >= 10 && v <= 150) { st[id] = v; save(); refresh(); } });
    $('#' + id).addEventListener('change', function () { st[id] = clampMm(this.value, id === 'cw' ? 30 : 40); this.value = st[id]; save(); refresh(); });
  });
  $('#optBorder').addEventListener('change', function () { st.border = this.checked; save(); refresh(); });
  $('#optCut').addEventListener('change', function () { st.cut = this.checked; save(); refresh(); });
  $('#resetBtn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    st = { size: '35x45', cw: 30, ch: 40, paper: '4x6', border: true, cut: true };
    src = makeSample(); isSample = true; save(); recenter(); refresh();
  });

  /* ---------- export ---------- */
  /* Canvas JPGs carry no print size. Writing 300 dpi into the JFIF header lets photo software print at the true size. */
  function withDpi(blob) {
    return blob.arrayBuffer().then(function (buf) {
      var u = new Uint8Array(buf);
      if (u.length > 18 && u[0] === 0xFF && u[1] === 0xD8 && u[2] === 0xFF && u[3] === 0xE0 && u[6] === 0x4A && u[7] === 0x46 && u[8] === 0x49 && u[9] === 0x46) {
        u[13] = 1; u[14] = DPI >> 8; u[15] = DPI & 255; u[16] = DPI >> 8; u[17] = DPI & 255;
      }
      return new Blob([u], { type: 'image/jpeg' });
    });
  }
  /* PNGs get a pHYs chunk (300 dpi = 11811 pixels per metre) right after IHDR, for the same reason. */
  var CRC = null;
  function crc32(u, from, to) {
    if (!CRC) { CRC = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } }
    var x = 0xFFFFFFFF;
    for (var i = from; i < to; i++) x = CRC[(x ^ u[i]) & 255] ^ (x >>> 8);
    return (x ^ 0xFFFFFFFF) >>> 0;
  }
  function withPngDpi(blob) {
    return blob.arrayBuffer().then(function (buf) {
      var u = new Uint8Array(buf);
      var isPng = u.length > 33 && u[0] === 0x89 && u[1] === 0x50 && u[12] === 0x49 && u[13] === 0x48 && u[14] === 0x44 && u[15] === 0x52;
      if (!isPng) return blob;
      var ppm = Math.round(DPI / 0.0254), ch = new Uint8Array(21), dv = new DataView(ch.buffer);
      dv.setUint32(0, 9); ch.set([0x70, 0x48, 0x59, 0x73], 4);      // length 9, "pHYs"
      dv.setUint32(8, ppm); dv.setUint32(12, ppm); ch[16] = 1;        // x, y, unit = metre
      dv.setUint32(17, crc32(ch, 4, 17));
      return new Blob([u.subarray(0, 33), ch, u.subarray(33)], { type: 'image/png' });
    });
  }
  function toBlob(cv, kind) {
    return new Promise(function (res, rej) {
      cv.toBlob(function (b) {
        if (!b) return rej(new Error('no blob'));
        (kind === 'jpg' ? withDpi(b) : withPngDpi(b)).then(res, function () { res(b); });
      }, kind === 'jpg' ? 'image/jpeg' : 'image/png', 0.95);
    });
  }
  function sizeTag() { var mm = photoMm(); return mm[0] + 'x' + mm[1] + 'mm'; }
  function dl(cv, name, kind) {
    toBlob(cv, kind).then(function (b) { EDU.download(name + '.' + kind, b); }, function () { EDU.toast(t('err_export')); });
  }
  $('#dlJpg').addEventListener('click', function () { renderSheet(); dl($('#sheet'), 'passport-photo-sheet-' + sizeTag() + '-' + st.paper, 'jpg'); });
  $('#dlPng').addEventListener('click', function () { renderSheet(); dl($('#sheet'), 'passport-photo-sheet-' + sizeTag() + '-' + st.paper, 'png'); });
  $('#dlOne').addEventListener('click', function () { renderSheet(); dl(photoCv, 'passport-photo-' + sizeTag(), 'jpg'); });

  var pageStyle = document.createElement('style'); document.head.appendChild(pageStyle);
  $('#printBtn').addEventListener('click', function () {
    renderSheet();
    var L = lastLayout, wmm = L.W * 25.4 / DPI, hmm = L.H * 25.4 / DPI;
    toBlob($('#sheet'), 'jpg').then(function (b) {
      var img = $('#printImg'), url = URL.createObjectURL(b);
      pageStyle.textContent = '@page { size: ' + wmm.toFixed(1) + 'mm ' + hmm.toFixed(1) + 'mm; margin: 0; }';
      img.style.width = wmm.toFixed(2) + 'mm'; img.style.height = hmm.toFixed(2) + 'mm';
      img.onload = function () { img.onload = null; window.print(); setTimeout(function () { URL.revokeObjectURL(url); }, 60000); };
      img.src = url;
    }, function () { EDU.toast(t('err_export')); });
  });

  /* for the interaction test */
  window.PPS = {
    mmToPx: mmToPx, layout: layout, PRESETS: PRESETS, PAPERS: PAPERS,
    state: function () { return { size: st.size, paper: st.paper, border: st.border, cut: st.cut, sample: isSample, z: view.z, cx: view.cx, cy: view.cy, srcW: src.width, srcH: src.height }; },
    photoSize: function () { return [photoCv.width, photoCv.height]; },
    jpgHead: function () { return toBlob($('#sheet'), 'jpg').then(function (b) { return b.arrayBuffer(); }).then(function (a) { return Array.prototype.slice.call(new Uint8Array(a, 0, 18)); }); },
    pngHead: function () { return toBlob($('#sheet'), 'png').then(function (b) { return b.arrayBuffer(); }).then(function (a) { return Array.prototype.slice.call(new Uint8Array(a, 0, 60)); }); }
  };

  src = makeSample();
  recenter();
  EDU.onLang(function () { isoStatic(); renderText(); });
  isoStatic();
  refresh();
})();
