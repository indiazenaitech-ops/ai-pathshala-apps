/* Photo Watermark: text or logo watermark on one or many photos, all on the device.
   Photos are decoded one at a time (EXIF rotation applied by the browser), drawn on a canvas at full size and
   saved as new JPGs, so the saved files carry no EXIF / GPS data. */
(function () {
  'use strict';
  var $ = EDU.$, $$ = EDU.$$, t = EDU.t;
  var store = EDU.store('photo-watermark');
  var app = $('#app');

  EDU.init({ slug: 'photo-watermark', title: 'app_title', waKey: 'shell_wa_tool' });

  var MAX_PHOTOS = 100, MAX_AREA = 50.5e6, PREV_MAX = 1400;
  var POS = ['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br', 'tile'];
  var DEF = { type: 'text', text: null, pos: 'br', size: 30, opacity: 60, color: '#ffffff', margin: 3 };
  var S = Object.assign({}, DEF, store.get('s', {}));
  if (POS.indexOf(S.pos) < 0) S.pos = 'br';
  if (S.type !== 'logo') S.type = 'text';
  if (!/^#[0-9a-f]{6}$/i.test(S.color)) S.color = '#ffffff';
  S.type = 'text';                              /* the logo itself is never stored, so always start with text */

  var items = [];                               /* {file, name} or {sample:true, name} */
  var idx = 0;
  var sampleCanvas = null;
  var logo = null, logoErr = false;             /* canvas */
  var prevSrc = null, prevToken = 0, prevFail = false;
  var results = [];                             /* {name, blob, url, w, h, shrunk} or {name, fail:true} */
  var running = false, stopFlag = false, stale = false, skipped = 0, tooMany = false;

  function save() { store.set('s', S); }
  function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function wmText() { return (S.text === null ? t('wm_default') : S.text).replace(/\s+/g, ' ').trim(); }
  function hasMark() { return S.type === 'logo' ? !!logo : !!wmText(); }
  function sizeText(b) { return b < 1048576 ? Math.max(1, Math.round(b / 1024)) + ' KB' : (b / 1048576).toFixed(1) + ' MB'; }

  /* ------------------------------------------------ sample picture (drawn, no bundled photo) */
  function makeSample() {
    var W = 1600, H = 1067, c = mk(W, H), x = c.getContext('2d'), i;
    var sky = x.createLinearGradient(0, 0, 0, H * 0.62);
    sky.addColorStop(0, '#2f6fb5'); sky.addColorStop(0.6, '#f3b56b'); sky.addColorStop(1, '#fbe3a8');
    x.fillStyle = sky; x.fillRect(0, 0, W, H);
    x.fillStyle = '#fff3c4'; x.beginPath(); x.arc(1120, 520, 110, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(255,243,196,.25)'; x.beginPath(); x.arc(1120, 520, 190, 0, Math.PI * 2); x.fill();
    function hills(base, amp, col, seed) {
      x.fillStyle = col; x.beginPath(); x.moveTo(0, H);
      for (i = 0; i <= W; i += 20) x.lineTo(i, base - amp * (Math.sin(i / 170 + seed) * 0.6 + Math.sin(i / 67 + seed * 2) * 0.25 + Math.sin(i / 410 + seed * 3) * 0.9));
      x.lineTo(W, H); x.closePath(); x.fill();
    }
    hills(560, 120, '#6d7fa8', 1); hills(640, 90, '#4f6a7d', 2.2); hills(720, 60, '#3d6b4f', 4);
    var land = x.createLinearGradient(0, 720, 0, H);
    land.addColorStop(0, '#5c9a4a'); land.addColorStop(1, '#2f6a2c');
    x.fillStyle = land; x.fillRect(0, 760, W, H - 760);
    x.fillStyle = '#7fc3e8'; x.beginPath(); x.moveTo(700, 760);
    x.bezierCurveTo(820, 840, 520, 900, 760, 1067); x.lineTo(1120, 1067); x.bezierCurveTo(820, 920, 1000, 830, 800, 760); x.closePath(); x.fill();
    for (i = 0; i < 9; i++) {
      var tx = 90 + i * 175 + (i % 2) * 40, ty = 800 + (i % 3) * 70, s = 0.8 + (i % 3) * 0.35;
      if (tx > 560 && tx < 1150) continue;
      x.fillStyle = '#5a3d22'; x.fillRect(tx - 6 * s, ty, 12 * s, 70 * s);
      x.fillStyle = i % 2 ? '#2e7d32' : '#388e3c';
      x.beginPath(); x.arc(tx, ty - 10 * s, 48 * s, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.arc(tx - 30 * s, ty + 12 * s, 34 * s, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.arc(tx + 30 * s, ty + 12 * s, 34 * s, 0, Math.PI * 2); x.fill();
    }
    /* a kite */
    x.save(); x.translate(360, 250); x.rotate(-0.25);
    x.fillStyle = '#e53935'; x.beginPath(); x.moveTo(0, -70); x.lineTo(55, 0); x.lineTo(0, 80); x.lineTo(-55, 0); x.closePath(); x.fill();
    x.fillStyle = '#fdd835'; x.beginPath(); x.moveTo(0, -70); x.lineTo(55, 0); x.lineTo(0, 0); x.closePath(); x.fill();
    x.restore();
    x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 2; x.beginPath(); x.moveTo(378, 325); x.bezierCurveTo(420, 520, 300, 640, 250, 790); x.stroke();
    return c;
  }

  /* ------------------------------------------------ decoding */
  function decode(file) {
    var viaImg = function () {
      return new Promise(function (res, rej) {
        var url = URL.createObjectURL(file), im = new Image();
        im.onload = function () { URL.revokeObjectURL(url); if (!im.naturalWidth) rej(new Error('empty')); else res(im); };
        im.onerror = function () { URL.revokeObjectURL(url); rej(new Error('decode')); };
        im.src = url;
      });
    };
    if (!window.createImageBitmap) return viaImg();
    return createImageBitmap(file, { imageOrientation: 'from-image' }).catch(function () { return viaImg(); });
  }
  function dims(img) { return { w: img.naturalWidth || img.width, h: img.naturalHeight || img.height }; }
  function isPicture(f) { return /^image\//.test(f.type || '') || (!f.type && /\.(jpe?g|png|webp|gif|bmp|avif|heic|heif)$/i.test(f.name || '')); }

  /* ------------------------------------------------ the watermark */
  var FONT = '"Noto Sans", system-ui, -apple-system, "Segoe UI", "Nirmala UI", Roboto, sans-serif';
  function lum(hex) { var n = parseInt(hex.slice(1), 16); return (((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114) / 255; }

  /* one stamp (text or logo) about `sw` pixels wide; returns a canvas */
  function makeStamp(W, H) {
    var sw = Math.max(8, W * S.size / 100);
    if (S.type === 'logo') {
      if (!logo) return null;
      var k = Math.min(sw / logo.width, H * 0.6 / logo.height);
      var lw = Math.max(1, logo.width * k), lh = Math.max(1, logo.height * k);
      var src = logo;
      while (src.width / 2 > lw && src.height / 2 > lh) {                 /* smooth shrink for big logos */
        var n = mk(src.width / 2, src.height / 2), nx = n.getContext('2d');
        nx.imageSmoothingQuality = 'high'; nx.drawImage(src, 0, 0, n.width, n.height); src = n;
      }
      var lc = mk(lw, lh), lx = lc.getContext('2d');
      lx.imageSmoothingQuality = 'high'; lx.drawImage(src, 0, 0, lc.width, lc.height);
      return lc;
    }
    var text = wmText();
    if (!text) return null;
    var probe = mk(4, 4).getContext('2d');
    probe.font = '700 100px ' + FONT;
    var mw = probe.measureText(text).width || 1;
    var px = Math.max(6, Math.min(100 * sw / mw, H * 0.4));
    probe.font = '700 ' + px + 'px ' + FONT;
    var m = probe.measureText(text);
    var asc = m.actualBoundingBoxAscent || px * 0.8, desc = m.actualBoundingBoxDescent || px * 0.25;
    asc = Math.max(asc, px * 0.75); desc = Math.max(desc, px * 0.25);
    var pad = Math.ceil(px * 0.14) + 2;
    var c = mk(m.width + pad * 2, asc + desc + pad * 2), x = c.getContext('2d');
    x.font = '700 ' + px + 'px ' + FONT;
    x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    x.shadowColor = lum(S.color) > 0.5 ? 'rgba(0,0,0,.6)' : 'rgba(255,255,255,.6)';
    x.shadowBlur = px * 0.07; x.shadowOffsetY = px * 0.02;
    x.fillStyle = S.color;
    x.fillText(text, c.width / 2, pad + asc);
    return c;
  }

  function drawMark(ctx, W, H) {
    var st = makeStamp(W, H);
    if (!st) return;
    var sw = st.width, sh = st.height, m = Math.round(Math.min(W, H) * S.margin / 100);
    ctx.save();
    ctx.globalAlpha = EDU.clamp(S.opacity, 5, 100) / 100;
    if (S.pos === 'tile') {
      var diag = Math.sqrt(W * W + H * H);
      var stepX = sw + Math.max(sw * 0.35, m * 5), stepY = sh + Math.max(sh * 1.4, m * 5);
      ctx.translate(W / 2, H / 2); ctx.rotate(-Math.PI / 6);
      var row = 0;
      for (var y = -diag / 2 - sh; y < diag / 2 + sh; y += stepY, row++) {
        var off = (row % 2) * stepX / 2;
        for (var x = -diag / 2 - stepX + off; x < diag / 2 + sw; x += stepX) ctx.drawImage(st, x, y);
      }
    } else {
      var v = S.pos[0], h = S.pos[1];
      var px = h === 'l' ? m : h === 'r' ? W - sw - m : (W - sw) / 2;
      var py = v === 't' ? m : v === 'b' ? H - sh - m : (H - sh) / 2;
      ctx.drawImage(st, Math.round(px), Math.round(py));
    }
    ctx.restore();
  }

  /* ------------------------------------------------ preview */
  function loadPreview() {
    var my = ++prevToken, it = items[idx];
    prevFail = false;
    if (!it) return;
    if (it.sample) { prevSrc = sampleCanvas; drawPreview(); app.dataset.busy = running ? '1' : '0'; return; }
    app.dataset.busy = '1';
    decode(it.file).then(function (img) {
      if (my !== prevToken) { if (img.close) img.close(); return; }
      var d = dims(img), k = Math.min(1, PREV_MAX / Math.max(d.w, d.h));
      var c = mk(d.w * k, d.h * k), x = c.getContext('2d');
      x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
      x.imageSmoothingQuality = 'high';
      x.drawImage(img, 0, 0, c.width, c.height);
      if (img.close) img.close();
      prevSrc = c;
    }).catch(function () {
      if (my !== prevToken) return;
      prevSrc = null; prevFail = true;
    }).then(function () {
      if (my !== prevToken) return;
      drawPreview();
      app.dataset.busy = running ? '1' : '0';
    });
  }
  function drawPreview() {
    var c = $('#prev'), x = c.getContext('2d');
    $('#prevMsg').hidden = !prevFail;
    if (prevFail) $('#prevMsg').textContent = t('err_open');
    if (!prevSrc) { c.width = 16; c.height = 10; x.clearRect(0, 0, 16, 10); c.dataset.w = '0'; return; }
    c.width = prevSrc.width; c.height = prevSrc.height;
    x.drawImage(prevSrc, 0, 0);
    drawMark(x, c.width, c.height);
    c.dataset.w = c.width; c.dataset.h = c.height;
  }
  var rafPending = false;
  function previewSoon() {
    if (rafPending) return;
    rafPending = true;
    (window.requestAnimationFrame || setTimeout)(function () { rafPending = false; drawPreview(); });
  }

  /* ------------------------------------------------ photos list */
  function useSample() {
    items = [{ sample: true, name: 'sample.jpg' }]; idx = 0;
    app.dataset.sample = '1';
  }
  function addFiles(list) {
    var files = Array.prototype.slice.call(list || []);
    if (!files.length || running) return;
    var good = files.filter(isPicture);
    skipped = files.length - good.length; tooMany = false;
    if (good.length) {
      if (items.length === 1 && items[0].sample) { items = []; app.dataset.sample = '0'; }
      var first = items.length;
      good.forEach(function (f) {
        if (items.length >= MAX_PHOTOS) { tooMany = true; return; }
        items.push({ file: f, name: f.name || 'photo.jpg' });
      });
      idx = Math.min(first, items.length - 1);
      clearResults(false);
      loadPreview();
    }
    renderPhotos(); renderSave();
  }
  $('#pick').addEventListener('click', function () { $('#fileIn').click(); });
  $('#fileIn').addEventListener('change', function () { var f = this.files; addFiles(f); this.value = ''; });
  $('#clearPhotos').addEventListener('click', function () {
    if (running) return;
    skipped = 0; tooMany = false;
    useSample(); clearResults(false); loadPreview(); renderPhotos(); renderSave();
  });
  var card = $('#photosCard');
  ['dragenter', 'dragover'].forEach(function (ev) {
    document.addEventListener(ev, function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0) { e.preventDefault(); card.classList.add('over'); } });
  });
  ['dragleave', 'drop'].forEach(function (ev) { document.addEventListener(ev, function () { card.classList.remove('over'); }); });
  document.addEventListener('drop', function (e) {
    if (!e.dataTransfer || !e.dataTransfer.files || !e.dataTransfer.files.length) return;
    e.preventDefault(); addFiles(e.dataTransfer.files);
  });

  function renderPhotos() {
    var sample = items.length === 1 && items[0].sample;
    app.dataset.count = sample ? '0' : String(items.length);
    $('#countLine').textContent = sample ? t('sample_line') : t('count_line', { n: items.length });
    $('#countLine').className = 'small mb0' + (sample ? ' muted' : '');
    $('#clearPhotos').hidden = sample;
    var msgs = [];
    if (skipped) msgs.push(t('skipped', { n: skipped }));
    if (tooMany) msgs.push(t('too_many', { n: MAX_PHOTOS }));
    $('#pickMsg').hidden = !msgs.length; $('#pickMsg').textContent = msgs.join(' ');
    $('#navCount').textContent = (idx + 1) + ' / ' + items.length;
    $('#navName').textContent = sample ? '' : (items[idx] ? items[idx].name : '');
    $('#prevBtn').disabled = items.length < 2; $('#nextBtn').disabled = items.length < 2;
  }
  function go(d) {
    if (items.length < 2) return;
    idx = (idx + d + items.length) % items.length;
    renderPhotos(); loadPreview();
  }
  $('#prevBtn').addEventListener('click', function () { go(-1); });
  $('#nextBtn').addEventListener('click', function () { go(1); });

  /* ------------------------------------------------ watermark controls */
  function syncControls() {
    $$('#typeSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.type === S.type)); });
    $('#textField').hidden = S.type !== 'text'; $('#logoField').hidden = S.type !== 'logo'; $('#colorField').hidden = S.type !== 'text';
    $$('#posGrid button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.pos === S.pos)); });
    $('#posTile').setAttribute('aria-pressed', String(S.pos === 'tile'));
    $('#size').value = S.size; $('#opacity').value = S.opacity; $('#margin').value = S.margin;
    $('#sizeOut').textContent = S.size + '%'; $('#opacityOut').textContent = S.opacity + '%'; $('#marginOut').textContent = S.margin + '%';
    var preset = false;
    $$('#colorChips button').forEach(function (b) { var on = b.dataset.color.toLowerCase() === S.color.toLowerCase(); if (on) preset = true; b.setAttribute('aria-pressed', String(on)); });
    $('#colorOther').classList.toggle('active', !preset);
    if (!preset) $('#colorPick').value = S.color;
    if (document.activeElement !== $('#wmText')) $('#wmText').value = S.text === null ? t('wm_default') : S.text;
  }
  function renderLogo() {
    var c = $('#logoPrev'), x = c.getContext('2d');
    x.clearRect(0, 0, 56, 56);
    if (logo) { var k = Math.min(52 / logo.width, 52 / logo.height); x.drawImage(logo, (56 - logo.width * k) / 2, (56 - logo.height * k) / 2, logo.width * k, logo.height * k); }
    var m = $('#logoMsg');
    m.textContent = logoErr ? t('err_logo') : (logo ? t('logo_ok') : t('logo_none'));
    m.style.color = logoErr ? 'var(--danger)' : '';
    m.className = 'small mb0' + (logoErr ? '' : ' muted');
  }
  function changed() { save(); syncControls(); markStale(); previewSoon(); renderSave(); }

  $('#typeSeg').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; S.type = b.dataset.type; changed(); });
  $('#wmText').addEventListener('input', function () { S.text = this.value; changed(); });
  $('#posGrid').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; S.pos = b.dataset.pos; changed(); });
  $('#posTile').addEventListener('click', function () { S.pos = 'tile'; changed(); });
  [['size', 5, 90], ['opacity', 5, 100], ['margin', 0, 15]].forEach(function (r) {
    $('#' + r[0]).addEventListener('input', function () { var n = parseInt(this.value, 10); S[r[0]] = EDU.clamp(isFinite(n) ? n : DEF[r[0]], r[1], r[2]); changed(); });
  });
  $('#colorChips').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; S.color = b.dataset.color; changed(); });
  $('#colorPick').addEventListener('input', function () { S.color = this.value; changed(); });
  $('#colorPick').addEventListener('click', function () { S.color = this.value; changed(); });
  $('#pickLogo').addEventListener('click', function () { $('#logoIn').click(); });
  $('#logoIn').addEventListener('change', function () {
    var f = this.files && this.files[0]; this.value = '';
    if (!f) return;
    decode(f).then(function (img) {
      var d = dims(img); if (!d.w || !d.h) throw new Error('empty');
      var k = Math.min(1, 1600 / Math.max(d.w, d.h));
      var c = mk(d.w * k, d.h * k), x = c.getContext('2d');
      x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, c.width, c.height);
      if (img.close) img.close();
      logo = c; logoErr = false;
    }).catch(function () { logoErr = true; }).then(function () { renderLogo(); changed(); app.dataset.logo = logo ? '1' : '0'; });
  });

  /* ------------------------------------------------ process + download */
  function clearResults(markOld) {
    results.forEach(function (r) { if (r.url) URL.revokeObjectURL(r.url); });
    stale = !!markOld && results.length > 0;
    results = [];
    app.dataset.done = '0';
  }
  function markStale() { if (!running && results.length) { clearResults(true); } }
  function outName(name, used) {
    var base = String(name || 'photo').replace(/\.[^.]*$/, '').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 80) || 'photo';
    var n = base + '_watermark', k = 2, out = n;
    while (used[out.toLowerCase()]) out = n + '_' + (k++);
    used[out.toLowerCase()] = 1;
    return out + '.jpg';
  }
  function toBlob(c) { return new Promise(function (res) { try { c.toBlob(res, 'image/jpeg', 0.92); } catch (e) { res(null); } }); }
  function pause(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }

  function renderOne(it) {
    var get = it.sample ? Promise.resolve(sampleCanvas) : decode(it.file);
    return get.then(function (img) {
      var d = dims(img);
      var scale = Math.min(1, Math.sqrt(MAX_AREA / (d.w * d.h)));
      function attempt(sc, tries) {
        var W = Math.max(1, Math.round(d.w * sc)), H = Math.max(1, Math.round(d.h * sc));
        var c = mk(W, H), x = c.getContext('2d');
        if (!x) return tries > 0 ? attempt(sc * 0.7, tries - 1) : null;
        x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H);                /* transparent PNGs get a white background in JPG */
        x.imageSmoothingQuality = 'high';
        x.drawImage(img, 0, 0, W, H);
        drawMark(x, W, H);
        return toBlob(c).then(function (b) {
          c.width = c.height = 1;                                       /* free the big canvas early */
          if (!b || !b.size) return tries > 0 ? attempt(sc * 0.7, tries - 1) : null;
          return { blob: b, w: W, h: H, shrunk: sc < 1 };
        });
      }
      return Promise.resolve(attempt(scale, 3)).then(function (r) { if (img.close) img.close(); return r; });
    });
  }

  function processAll() {
    if (running || !hasMark()) return;
    clearResults(false);
    running = true; stopFlag = false; stale = false;
    app.dataset.busy = '1';
    var list = items.slice(), used = {}, i = 0;
    renderSave();
    function next() {
      if (stopFlag || i >= list.length) return Promise.resolve();
      var it = list[i];
      setProgress(i, list.length);
      return pause(30).then(function () { return renderOne(it); }).then(function (r) {
        if (!r) throw new Error('render');
        results.push({ name: outName(it.name, used), blob: r.blob, url: URL.createObjectURL(r.blob), w: r.w, h: r.h, shrunk: r.shrunk });
      }).catch(function () {
        results.push({ name: it.name, fail: true });
      }).then(function () {
        i++; app.dataset.done = String(results.length);
        renderResults();
        return next();
      });
    }
    next().then(function () {
      running = false;
      setProgress(list.length, list.length);
      app.dataset.stopped = stopFlag ? '1' : '0';
      app.dataset.busy = '0';
      renderSave();
    });
  }
  function setProgress(i, n) {
    var pct = n ? Math.round(i * 100 / n) : 0;
    $('#progFill').style.width = pct + '%';
    $('#progBar').setAttribute('aria-valuenow', String(pct));
    $('#progLine').textContent = t('progress_line', { i: Math.min(i + 1, n), n: n });
  }
  function okResults() { return results.filter(function (r) { return !r.fail; }); }

  function renderResults() {
    var ul = $('#results'); ul.innerHTML = '';
    results.forEach(function (r, k) {
      var li = EDU.el('li', { dataset: { k: k } });
      var nm = EDU.el('div', { class: 'nm' }, EDU.el('b', { class: 'no-i18n small', text: r.name }));
      if (r.fail) nm.appendChild(EDU.el('span', { class: 'tiny bad', text: t('row_fail') }));
      else {
        nm.appendChild(EDU.el('span', { class: 'tiny muted', text: t('row_info', { dim: '\u2066' + r.w + ' × ' + r.h + '\u2069', size: '\u2066' + sizeText(r.blob.size) + '\u2069' }) + (r.shrunk ? ' ' + t('row_shrunk') : '') }));
      }
      li.appendChild(nm);
      if (!r.fail) li.appendChild(EDU.el('button', { type: 'button', class: 'btn btn-sm', id: 'dl-' + k, text: t('download'), onclick: function () { EDU.download(r.name, r.blob); } }));
      ul.appendChild(li);
    });
  }
  function renderSave() {
    var n = items.length, ok = okResults().length;
    var btn = $('#process');
    btn.textContent = t('process_btn', { n: n });
    btn.disabled = running || !hasMark();
    btn.hidden = running;
    $('#progBox').hidden = !running;
    var line = '';
    if (!hasMark()) line = t('need_mark');
    else if (running) line = '';
    else if (stale) line = t('stale_note');
    else if (results.length) line = app.dataset.stopped === '1' ? t('stopped_line', { n: ok }) : t('done_line', { n: ok });
    $('#doneLine').textContent = line;
    $('#doneLine').hidden = !line;
    $('#dlAll').hidden = running || ok < 2;
    $('#dlAllHint').hidden = running || ok < 2;
    renderResults();
  }
  $('#process').addEventListener('click', processAll);
  $('#stopBtn').addEventListener('click', function () { stopFlag = true; });
  $('#dlAll').addEventListener('click', function () {
    var list = okResults(), btn = this, k = 0;
    btn.disabled = true;
    (function one() {
      if (k >= list.length) { btn.disabled = false; return; }
      EDU.download(list[k].name, list[k].blob); k++;
      setTimeout(one, 450);
    })();
  });
  $('#resetAll').addEventListener('click', function () {
    if (running || !confirm(t('confirm_reset'))) return;
    S = Object.assign({}, DEF); save();
    logo = null; logoErr = false; skipped = 0; tooMany = false; app.dataset.logo = '0';
    useSample(); clearResults(false);
    syncControls(); renderLogo(); renderPhotos(); loadPreview(); renderSave();
  });

  /* ------------------------------------------------ start */
  function render() { syncControls(); renderLogo(); renderPhotos(); drawPreview(); renderSave(); }
  EDU.onLang(render);
  sampleCanvas = makeSample();
  useSample();
  render();
  loadPreview();
})();
