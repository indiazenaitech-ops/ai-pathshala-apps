/* How Computers See: user interface. The image maths lives in engine.js (window.IPF). */
(function () {
  'use strict';
  var I = window.IPF, $ = EDU.$, t = EDU.t;
  EDU.init({ slug: 'image-pixels-filters', title: 'app_title', wide: true });
  var S = I.S();
  var SRC = I.SRC;

  /* ============================================================ picture source */
  function sourceChanged() { stopSlide(true); I.newSource(); renderAll(); }
  function setSample(name) {
    S.sample = name; S.sel = null; I.srcKind = 'sample';
    I.sctx.drawImage(I.sampleCanvas[name], 0, 0);
    I.save(); sourceChanged();
  }
  function coverDraw(el, w, h) {
    if (!w || !h) return false;
    var s = Math.min(w, h), c = I.sctx;
    c.save();
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, SRC, SRC);
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(el, (w - s) / 2, (h - s) / 2, s, s, 0, 0, SRC, SRC);
    c.restore();
    return true;
  }

  var samplesEl = $('#samples');
  I.SAMPLES.forEach(function (name) {
    var cv = EDU.el('canvas', { width: 104, height: 104, 'aria-hidden': 'true' });
    cv.getContext('2d').drawImage(I.sampleCanvas[name], 0, 0, 104, 104);
    samplesEl.appendChild(EDU.el('button', { class: 'sample-btn', type: 'button', id: 'sample-' + name, onclick: function () { setSample(name); } },
      cv, EDU.el('span', { i18n: 's_' + name })));
  });

  /* upload a photo (stays on this device) */
  var upIn = $('#upload-input');
  $('#upload-btn').addEventListener('click', function () { upIn.value = ''; upIn.click(); });
  upIn.addEventListener('change', function () { var f = upIn.files && upIn.files[0]; if (f) loadFile(f); });
  function loadFile(file) {
    if (!/^image\//.test(file.type || '') && !/\.(png|jpe?g|gif|webp|bmp|avif)$/i.test(file.name || '')) { EDU.toast(t('bad_file')); return; }
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function () {
      var ok = coverDraw(img, img.naturalWidth, img.naturalHeight);
      URL.revokeObjectURL(url);
      if (!ok) { EDU.toast(t('bad_file')); return; }
      I.srcKind = 'upload'; S.sel = null; sourceChanged();
    };
    img.onerror = function () { URL.revokeObjectURL(url); EDU.toast(t('bad_file')); };
    img.src = url;
  }

  /* webcam snapshot (optional; works without a camera too) */
  var stream = null, camKey = '', video = $('#cam-video'), camReq = 0, camPending = false;
  function camMsg(key, state) {
    camKey = key || '';
    var m = $('#cam-msg');
    m.textContent = camKey ? t(camKey) : '';
    m.setAttribute('data-state', state || '');
  }
  function stopTracks(s) { s.getTracks().forEach(function (tr) { try { tr.stop(); } catch (e) { } }); }
  function stopCam() {
    camReq++; camPending = false;      // a camera that answers after "Close" is switched off at once
    if (stream) { stopTracks(stream); stream = null; }
    video.srcObject = null;
    $('#cam-box').hidden = true; $('#cam-snap').disabled = true; camMsg('');
  }
  function openCam() {
    $('#cam-box').hidden = false;
    if (stream || camPending) return;  // already on (or still asking): never open a second camera
    $('#cam-snap').disabled = true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { camMsg('cam_none', 'error'); return; }
    camMsg('cam_starting', 'wait');
    var my = ++camReq; camPending = true;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false })
      .then(function (s) {
        if (my !== camReq) { stopTracks(s); return; }
        camPending = false;
        stream = s; video.srcObject = s;
        var p = video.play(); if (p && p.catch) p.catch(function () { });
      })
      .catch(function (e) {
        if (my !== camReq) return;
        camPending = false;
        var n = e && e.name;
        camMsg(n === 'NotAllowedError' || n === 'SecurityError' ? 'cam_denied' : n === 'NotFoundError' || n === 'OverconstrainedError' || n === 'NotReadableError' ? 'cam_none' : 'cam_error', 'error');
      });
  }
  video.addEventListener('loadeddata', function () { if (stream) { $('#cam-snap').disabled = false; camMsg('cam_ready', 'ready'); } });
  $('#cam-btn').addEventListener('click', openCam);
  $('#cam-close').addEventListener('click', stopCam);
  $('#cam-snap').addEventListener('click', function () {
    if (!stream || !video.videoWidth) return;
    if (!coverDraw(video, video.videoWidth, video.videoHeight)) return;
    stopCam();
    I.srcKind = 'camera'; S.sel = null; sourceChanged();
  });

  /* resolution slider */
  var resEl = $('#res');
  resEl.max = String(I.RES.length - 1);
  resEl.setAttribute('data-values', I.RES.join(','));
  resEl.value = String(S.resI);
  resEl.addEventListener('input', function () {
    S.resI = EDU.clamp(parseInt(resEl.value, 10) || 0, 0, I.RES.length - 1);
    I.save(); stopSlide(true); I.buildWork(); renderAll();
  });

  function renderSource() {
    var n = I.N;
    I.SAMPLES.forEach(function (name) { $('#sample-' + name).setAttribute('aria-pressed', String(I.srcKind === 'sample' && S.sample === name)); });
    var nm = I.srcKind === 'sample' ? t('s_' + S.sample) : t(I.srcKind === 'camera' ? 'src_camera' : 'src_your_photo');
    var sn = $('#src-name');
    sn.textContent = t('now_showing', { name: nm });
    sn.setAttribute('data-src', I.srcKind === 'sample' ? S.sample : I.srcKind);
    var ro = $('#res-out');
    ro.textContent = t('res_value', { n: n });
    ro.setAttribute('data-value', String(n));
    resEl.setAttribute('aria-valuetext', t('res_value', { n: n }));
    if (resEl.value !== String(S.resI)) resEl.value = String(S.resI);
  }

  /* ============================================================ tabs */
  function setTab(tab) { S.tab = tab; I.save(); stopSlide(true); renderTabs(); renderActive(); }
  function renderTabs() {
    I.TABS.forEach(function (id) {
      var b = $('#tab-' + id), on = id === S.tab;
      b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1;
      $('#panel-' + id).hidden = !on;
    });
  }
  I.TABS.forEach(function (id, i) {
    var b = $('#tab-' + id);
    b.addEventListener('click', function () { setTab(id); });
    b.addEventListener('keydown', function (e) {
      var rtl = document.documentElement.dir === 'rtl', j = -1;
      if (e.key === 'ArrowRight') j = rtl ? i - 1 : i + 1;
      else if (e.key === 'ArrowLeft') j = rtl ? i + 1 : i - 1;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = I.TABS.length - 1;
      else return;
      e.preventDefault();
      j = (j + I.TABS.length) % I.TABS.length;
      setTab(I.TABS[j]); $('#tab-' + I.TABS[j]).focus();
    });
  });
  $('#fs-btn').addEventListener('click', function () { EDU.fullscreen($('#workspace')); });

  /* ============================================================ choosing a pixel (tap, drag, arrow keys) */
  var queued = false;
  function schedule() { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; renderActive(); }); }
  function bindPick(cv) {
    var down = false;
    function pick(e) {
      var r = cv.getBoundingClientRect(); if (!r.width) return;
      I.setSel(Math.floor((e.clientX - r.left) / r.width * I.N), Math.floor((e.clientY - r.top) / r.height * I.N));
      schedule();
    }
    cv.addEventListener('pointerdown', function (e) { down = true; stopSlide(true); try { cv.setPointerCapture(e.pointerId); } catch (er) { } pick(e); });
    cv.addEventListener('pointermove', function (e) { if (down) pick(e); });
    cv.addEventListener('pointerup', function () { down = false; });
    cv.addEventListener('pointercancel', function () { down = false; });
    cv.addEventListener('keydown', function (e) {
      var d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (!d) return;
      e.preventDefault(); stopSlide(true);
      var p = I.sel(); I.setSel(p.x + d[0], p.y + d[1]); schedule();
    });
  }
  ['#px-canvas', '#in-canvas', '#out-canvas'].forEach(function (s) { bindPick($(s)); });

  /* ============================================================ panel 1: pixels are numbers */
  var nbGrid = $('#nb-grid'), nbCells = [];
  for (var q = 0; q < 49; q++) { var cell = EDU.el('span', { class: 'nb-cell' + (q === 24 ? ' center' : '') }); nbGrid.appendChild(cell); nbCells.push(cell); }

  $$('#ch-seg button').forEach(function (b) { b.addEventListener('click', function () { S.ch = b.getAttribute('data-ch'); I.save(); renderPixels(); }); });
  $('#opt-grid').addEventListener('change', function () { S.grid = this.checked; I.save(); renderPixels(); });
  $('#opt-nums').addEventListener('change', function () { S.nums = this.checked; I.save(); renderPixels(); });
  function $$(sel) { return EDU.$$(sel); }

  function chanArrays(ch) {
    var z = zeros();
    if (ch === 'grey') return [I.Yv, I.Yv, I.Yv];
    if (ch === 'r') return [I.Rv, z, z];
    if (ch === 'g') return [z, I.Gv, z];
    if (ch === 'b') return [z, z, I.Bv];
    return [I.Rv, I.Gv, I.Bv];
  }
  var zcache = null;
  function zeros() { if (!zcache || zcache.length !== I.N * I.N) zcache = new Uint8ClampedArray(I.N * I.N); return zcache; }
  function numberArray(ch) { return ch === 'r' ? I.Rv : ch === 'g' ? I.Gv : ch === 'b' ? I.Bv : I.Yv; }

  function renderPixels() {
    var n = I.N, p = I.sel(), i = p.y * n + p.x, ch = S.ch;
    var A = chanArrays(ch), nums = numberArray(ch);
    var cv = $('#px-canvas');
    var P = I.paint(cv, I.makeImg(n, A[0], A[1], A[2]), n, 560);
    var canNums = n <= 16;
    if (S.grid) I.gridLines(P);
    if (S.nums && canNums) {
      var c = P.c, x, y, j;
      c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = '700 ' + Math.floor(P.k * 0.36) + 'px ui-monospace, Consolas, monospace';   // "255" still fits in one cell
      for (y = 0; y < n; y++) for (x = 0; x < n; x++) {
        j = y * n + x;
        c.fillStyle = I.ink(I.grey(A[0][j], A[1][j], A[2][j]));
        c.fillText(String(nums[j]), (x + 0.5) * P.k, (y + 0.5) * P.k);
      }
      c.restore();
    }
    I.box(P, p.x - 3, p.y - 3, 7, 7, true);
    I.box(P, p.x, p.y, 1, 1, false);

    $('#opt-grid').checked = S.grid;
    var on = $('#opt-nums'); on.checked = S.nums && canNums; on.disabled = !canNums;
    $('#nums-hint').hidden = canNums;
    $$('#ch-seg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-ch') === ch)); });

    var r = I.Rv[i], g = I.Gv[i], b = I.Bv[i], yv = I.Yv[i];
    var pos = $('#sel-pos');
    pos.textContent = t('sel_pos', { r: p.y + 1, c: p.x + 1 });
    pos.setAttribute('data-x', String(p.x)); pos.setAttribute('data-y', String(p.y));
    $('#swatch').style.background = 'rgb(' + r + ',' + g + ',' + b + ')';
    [['r', r], ['g', g], ['b', b]].forEach(function (pair) {
      var el = $('#val-' + pair[0]);
      el.textContent = String(pair[1]); el.setAttribute('data-value', String(pair[1]));
      $('#bar-' + pair[0]).style.width = (pair[1] / 255 * 100).toFixed(1) + '%';
    });
    $('#hex').textContent = '#' + [r, g, b].map(function (v) { return (v < 16 ? '0' : '') + v.toString(16); }).join('').toUpperCase();
    var gEl = $('#val-grey');
    gEl.textContent = '0.299 × ' + r + ' + 0.587 × ' + g + ' + 0.114 × ' + b + ' = ' + yv;
    gEl.setAttribute('data-value', String(yv));

    var nb = I.neigh(nums, p.x, p.y, 3), nbR = I.neigh(A[0], p.x, p.y, 3), nbG = I.neigh(A[1], p.x, p.y, 3), nbB = I.neigh(A[2], p.x, p.y, 3);
    nb.forEach(function (v, k) {
      var el = nbCells[k];
      el.textContent = String(v);
      el.setAttribute('data-value', String(v));
      el.style.background = 'rgb(' + nbR[k] + ',' + nbG[k] + ',' + nbB[k] + ')';
      el.style.color = I.ink(I.grey(nbR[k], nbG[k], nbB[k]));
    });
    $('#nb-hint').textContent = ch === 'rgb' || ch === 'grey' ? t('nb_hint_grey') : t('nb_hint_ch', { ch: t('ch_' + ch) });

    var cl = $('#count-line');
    cl.textContent = t('count_line', { w: n, h: n, px: EDU.fmt(n * n), nums: EDU.fmt(n * n * 3) });
    cl.setAttribute('data-pixels', String(n * n)); cl.setAttribute('data-numbers', String(n * n * 3));
  }

  /* CSV of the numbers being shown: one table for Grey / Red / Green / Blue, three labelled tables for Colour */
  $('#dl-csv').addEventListener('click', function () {
    var n = I.N, chs = S.ch === 'rgb' ? ['r', 'g', 'b'] : [S.ch], rows = [];
    chs.forEach(function (ch, ci) {
      var arr = numberArray(ch), y, x, row;
      if (chs.length > 1) { if (ci) rows.push([]); rows.push([t('ch_' + ch)]); }
      for (y = 0; y < n; y++) { row = []; for (x = 0; x < n; x++) row.push(arr[y * n + x]); rows.push(row); }
    });
    EDU.download('pixels-' + S.ch + '-' + n + 'x' + n + '.csv', EDU.csv.stringify(rows), 'text/csv');
  });

  /* ============================================================ panel 2: filters */
  var chips = $('#f-chips');
  I.F_ORDER.forEach(function (id) {
    chips.appendChild(EDU.el('button', { class: 'chip', type: 'button', id: 'f-' + id.replace('_', '-'), 'data-f': id, i18n: 'f_' + id, onclick: function () { selectFilter(id); } }));
  });
  $$('#mode-seg button').forEach(function (b) {
    b.addEventListener('click', function () { S.mode = b.getAttribute('data-mode'); I.save(); stopSlide(true); renderFilters(); });
  });
  function selectFilter(id) { S.filter = id; I.save(); stopSlide(true); renderKernel(); renderFilters(); }

  function staticK(title, k) {
    var g = EDU.el('div', { class: 'kstatic' });
    k.forEach(function (v) { g.appendChild(EDU.el('span', { text: I.fn(v), class: v < 0 ? 'neg' : '', style: { color: v < 0 ? 'var(--accent)' : v > 0 ? 'var(--primary)' : '' } })); });
    return EDU.el('div', null, EDU.el('div', { class: 'ksub', text: title }), g);
  }
  function toCustom() {
    if (S.filter === 'custom') return;
    var f = I.FILTERS[S.filter];
    S.custom = { k: f.k.slice(), div: f.div, abs: f.post === 'abs' };
    S.filter = 'custom';
  }
  function kernelChanged() { I.save(); stopSlide(true); renderFilters(); }

  function renderKernel() {
    var area = $('#kernel-area'); area.innerHTML = '';
    if (S.filter === 'sobel') {
      area.appendChild(EDU.el('div', { class: 'kernel-wrap' }, staticK(t('gx'), I.GX), staticK(t('gy'), I.GY)));
      return;
    }
    var grid = EDU.el('div', { class: 'kgrid', id: 'kgrid' }), i;
    for (i = 0; i < 9; i++) {
      (function (i) {
        var inp = EDU.el('input', { type: 'number', id: 'k' + i, step: 'any', inputmode: 'decimal', min: '-999', max: '999', 'aria-label': t('kernel_cell', { r: Math.floor(i / 3) + 1, c: i % 3 + 1 }) });
        inp.addEventListener('input', function () {
          toCustom();
          var v = Number(inp.value);
          S.custom.k[i] = inp.value.trim() !== '' && isFinite(v) ? EDU.clamp(v, -999, 999) : 0;
          kernelChanged();
        });
        // when the student leaves the box, show the number really used (empty → 0, 5000 → 999)
        inp.addEventListener('change', function () { if (S.filter === 'custom') inp.value = String(S.custom.k[i]); });
        grid.appendChild(inp);
      })(i);
    }
    var div = EDU.el('input', { type: 'number', id: 'k-div', step: 'any', inputmode: 'decimal' });
    div.addEventListener('input', function () {
      toCustom();
      var v = Number(div.value);
      S.custom.div = div.value.trim() === '' || !isFinite(v) ? 1 : v;
      kernelChanged();
    });
    div.addEventListener('change', function () { if (S.filter === 'custom') div.value = String(S.custom.div); });
    var abs = EDU.el('input', { type: 'checkbox', id: 'k-abs' });
    abs.addEventListener('change', function () { toCustom(); S.custom.abs = abs.checked; kernelChanged(); });
    area.appendChild(EDU.el('div', { class: 'kernel-wrap' }, grid,
      EDU.el('div', { class: 'k-extra' },
        EDU.el('label', { class: 'field', for: 'k-div' }, EDU.el('span', { i18n: 'divisor' }), div),
        EDU.el('label', { class: 'check' }, abs, EDU.el('span', { i18n: 'abs_opt' })),
        EDU.el('p', { class: 'warn-txt mb0', id: 'k-warn', i18n: 'div_zero', hidden: true }))));
    area.appendChild(EDU.el('p', { class: 'hint', i18n: 'kernel_hint' }));
    fillKernel();
  }
  function fillKernel() {
    if (S.filter === 'sobel' || !$('#k0')) return;
    var f = I.spec(S.filter), act = document.activeElement, i;
    for (i = 0; i < 9; i++) {
      var inp = $('#k' + i), v = f.k[i];
      if (act !== inp) inp.value = String(v);
      inp.className = v < 0 ? 'neg' : v > 0 ? 'pos' : '';
    }
    var div = $('#k-div');
    if (act !== div) div.value = String(S.filter === 'custom' ? S.custom.div : f.div);
    $('#k-abs').checked = f.post === 'abs';
    $('#k-warn').hidden = !f.badDiv;
  }

  /* sliding-window animation */
  var slide = null;
  function renderSlideBtn() {
    var b = $('#slide-btn');
    b.setAttribute('aria-pressed', String(!!slide));
    b.firstElementChild.textContent = slide ? '■' : '▶';
    $('#slide-lbl').textContent = slide ? t('stop') : t('slide_btn');
  }
  /* The sliding window only borrows the selection (IPF.setSlidePos): the pixel the student chose is
     neither changed nor saved, so a reload mid-slide and the end of the slide both bring it back. */
  function startSlide() {
    var me = slide = { t0: performance.now(), idx: 0 };
    renderSlideBtn();
    requestAnimationFrame(function tick(now) {
      if (slide !== me || S.tab !== 'filters') return;   // stopped, or restarted: only one loop ever runs
      var n = I.N, pps = Math.max(6, n * n / 8);
      me.idx = Math.max(0, Math.floor((now - me.t0) / 1000 * pps));
      if (me.idx >= n * n) { stopSlide(false); return; }
      I.setSlidePos([me.idx % n, Math.floor(me.idx / n)]);
      renderFilterCanvases(); renderMath();
      requestAnimationFrame(tick);
    });
  }
  function stopSlide(quiet) {
    if (!slide) return;
    slide = null; I.setSlidePos(null);
    renderSlideBtn();
    if (!quiet && S.tab === 'filters') renderFilters();
  }
  $('#slide-btn').addEventListener('click', function () { if (slide) stopSlide(false); else startSlide(); });

  function renderFilterCanvases() {
    var n = I.N, p = I.sel(), out = I.filtered(S.filter, S.mode), rgb = S.mode === 'rgb';
    var a = I.paint($('#in-canvas'), rgb ? I.makeImg(n, I.Rv, I.Gv, I.Bv) : I.makeImg(n, I.Yv), n, 512);
    if (n <= 16) I.gridLines(a);
    I.box(a, p.x - 1, p.y - 1, 3, 3, false);
    var b = I.paint($('#out-canvas'), rgb ? I.makeImg(n, out[0], out[1], out[2]) : I.makeImg(n, out[0]), n, 512);
    if (slide) {
      var done = slide.idx + 1, row = Math.floor(done / n), col = done % n, c = b.c;
      c.fillStyle = EDU.css('--surface-2') || '#eee';
      if (row < n) {
        c.fillRect(col * b.k, row * b.k, (n - col) * b.k, b.k);
        c.fillRect(0, (row + 1) * b.k, b.size, b.size - (row + 1) * b.k);
      }
    }
    if (n <= 16) I.gridLines(b);
    I.box(b, p.x, p.y, 1, 1, false);
  }

  function mgrid(title, vals, id) {
    var g = EDU.el('div', { class: 'mgrid', id: id || null });
    vals.forEach(function (v) { g.appendChild(EDU.el('span', { class: 'mcell' + (v < 0 ? ' neg' : ''), text: I.fn(v), 'data-value': String(v) })); });
    return EDU.el('div', { class: 'mblock' }, EDU.el('span', { class: 'ttl', text: title }), g);
  }
  function op(s) { return EDU.el('span', { class: 'mop', 'aria-hidden': 'true', text: s }); }
  function step(label, val, final, id, dv) {
    return EDU.el('div', { class: 'step' + (final ? ' final' : '') },
      EDU.el('span', { class: 'lbl', text: label }),
      EDU.el('span', { class: 'val no-i18n', id: id || null, 'data-value': dv === undefined ? null : String(dv), text: val }));
  }
  function expr(arr) {
    return arr.map(function (v, i) { return i === 0 ? I.fn(v) : (v < 0 ? ' − ' + I.fn(-v) : ' + ' + I.fn(v)); }).join('');
  }
  function sq(v) { return (v < 0 ? '(' + I.fn(v) + ')' : I.fn(v)) + '²'; }
  function r2(v) { return Math.round(v * 100) / 100; }
  function approx(v) { return r2(v) === v ? ' = ' : ' ≈ '; }      // "=" when the answer is exact, "≈" only when rounded

  function renderMath() {
    var area = $('#math-area'); area.innerHTML = '';
    var p = I.sel(), f = I.spec(S.filter), rgb = S.mode === 'rgb', n = I.N, i = p.y * n + p.x;
    var v = I.neigh(rgb ? I.Rv : I.Yv, p.x, p.y, 1);
    var mp = $('#math-pos');
    mp.textContent = t('math_pos', { r: p.y + 1, c: p.x + 1 }) + ' · ' + t(rgb ? 'ch_r' : 'ch_grey');
    mp.setAttribute('data-x', String(p.x)); mp.setAttribute('data-y', String(p.y));
    var math = EDU.el('div', { class: 'math' }), steps = EDU.el('div', { class: 'steps' }), result;
    if (f.post === 'mag') {
      var px = v.map(function (a, j) { return a * I.GX[j]; }), py = v.map(function (a, j) { return a * I.GY[j]; });
      var sx = px.reduce(function (a, b) { return a + b; }, 0), sy = py.reduce(function (a, b) { return a + b; }, 0);
      var m = Math.sqrt(sx * sx + sy * sy);
      result = Math.min(255, Math.round(m));
      math.appendChild(mgrid(t('m_pixels'), v, 'm-pix'));
      math.appendChild(op('×'));
      math.appendChild(mgrid('Gx', I.GX, 'm-k'));
      math.appendChild(mgrid('Gy', I.GY));
      steps.appendChild(step('Gx =', expr(px) + ' = ' + I.fn(sx)));
      steps.appendChild(step('Gy =', expr(py) + ' = ' + I.fn(sy)));
      steps.appendChild(step(t('m_sobel'), '√(' + sq(sx) + ' + ' + sq(sy) + ')' + approx(m) + I.fn(r2(m))));
      steps.appendChild(step(t('m_round255'), I.fn(r2(m)) + ' → ' + result));
    } else {
      var pr = v.map(function (a, j) { return a * f.k[j]; });
      var s = pr.reduce(function (a, b) { return a + b; }, 0), qv = s / f.div;
      result = I.finish(qv, f.post);
      math.appendChild(mgrid(t('m_pixels'), v, 'm-pix'));
      math.appendChild(op('×'));
      math.appendChild(mgrid(t('m_filter'), f.k, 'm-k'));
      math.appendChild(op('='));
      math.appendChild(mgrid(t('m_products'), pr.map(r2), 'm-prod'));
      steps.appendChild(step(t('m_sum'), expr(pr.map(r2)) + ' = ' + I.fn(r2(s)), false, 'm-sum', s));
      if (f.div !== 1) steps.appendChild(step(t('m_div', { d: I.fn(f.div) }), I.fn(r2(s)) + ' ÷ ' + I.fn(f.div) + approx(qv) + I.fn(r2(qv))));
      steps.appendChild(step(t(f.post === 'abs' ? 'm_abs' : 'm_clamp'), I.fn(r2(qv)) + ' → ' + result));
    }
    steps.appendChild(step(t('m_result'), String(result), true, 'math-result', result));
    area.appendChild(math);
    area.appendChild(steps);
    if (rgb) {
      var out = I.filtered(S.filter, 'rgb');
      area.appendChild(EDU.el('p', { class: 'small muted', style: { marginTop: '8px' }, text: t('m_channel_note', { r: out[0][i], g: out[1][i], b: out[2][i] }) }));
    }
  }

  function renderFilters() {
    $$('#f-chips .chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-f') === S.filter)); });
    $$('#mode-seg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === S.mode)); });
    $('#f-desc').textContent = t('d_' + S.filter);
    if (S.filter === 'sobel' ? !!$('#k0') : !$('#k0')) renderKernel();
    fillKernel();
    renderSlideBtn();
    renderFilterCanvases();
    renderMath();
  }

  $('#dl-png').addEventListener('click', function () {
    var n = I.N, out = I.filtered(S.filter, S.mode), cv = document.createElement('canvas');
    I.paint(cv, S.mode === 'rgb' ? I.makeImg(n, out[0], out[1], out[2]) : I.makeImg(n, out[0]), n, 512);
    EDU.downloadCanvas(cv, 'filter-' + S.filter + '-' + n + 'x' + n + '.png');
  });

  /* printable "be the computer" worksheet */
  function td(text, cls) { return EDU.el('td', { class: cls || null, text: text }); }
  function table(cls, rows) {
    var tb = EDU.el('tbody');
    rows.forEach(function (r) { tb.appendChild(EDU.el('tr', null, r)); });
    return EDU.el('table', { class: cls }, tb);
  }
  function buildWorksheet() {
    var n = I.N, p = I.sel(), id = S.filter === 'sobel' ? 'edge_v' : S.filter, f = I.spec(id);
    var cx = EDU.clamp(p.x, 3, n - 4), cy = EDU.clamp(p.y, 3, n - 4);
    var vals = I.neigh(I.Yv, cx, cy, 3), rows = [], i, j;
    for (j = 0; j < 7; j++) { var r = []; for (i = 0; i < 7; i++) r.push(td(String(vals[j * 7 + i]), i === 0 || j === 0 || i === 6 || j === 6 ? 'edge' : '')); rows.push(r); }
    var krows = [];
    for (j = 0; j < 3; j++) { var kr = []; for (i = 0; i < 3; i++) kr.push(td(I.fn(f.k[j * 3 + i]))); krows.push(kr); }
    var orows = [], arows = [];
    for (j = 0; j < 5; j++) {
      var o = [], a = [];
      for (i = 0; i < 5; i++) {
        var x = cx - 2 + i, y = cy - 2 + j, s = 0, u, w;
        for (w = -1; w <= 1; w++) for (u = -1; u <= 1; u++) s += I.Yv[(y + w) * n + x + u] * f.k[(w + 1) * 3 + u + 1];
        o.push(td(''));
        a.push(td(String(I.finish(s / f.div, f.post))));
      }
      orows.push(o); arows.push(a);
    }
    var ws = $('#worksheet'); ws.innerHTML = '';
    ws.appendChild(EDU.el('h1', { text: t('ws_title') }));
    ws.appendChild(EDU.el('p', { class: 'small', text: t('brand') + ' · ' + t('app_title') }));
    ws.appendChild(EDU.el('p', { class: 'ws-name', text: t('ws_name') }));
    ws.appendChild(EDU.el('p', { text: t('ws_steps') }));
    ws.appendChild(EDU.el('div', { class: 'ws-row' },
      EDU.el('div', null, EDU.el('h2', { text: t('ws_input') }), table('t-in', rows)),
      EDU.el('div', null, EDU.el('h2', { text: t('ws_filter', { name: t('f_' + id) }) }), table('t-k', krows),
        f.div !== 1 ? EDU.el('p', { text: t('ws_div', { d: I.fn(f.div) }) }) : null,
        EDU.el('p', { class: 'small', text: t(f.post === 'abs' ? 'ws_rule_abs' : 'ws_rule_clamp') }))));
    ws.appendChild(EDU.el('div', { class: 'ws-row' }, EDU.el('div', null, EDU.el('h2', { text: t('ws_output') }), table('t-out', orows))));
    if ($('#ws-answers').checked) ws.appendChild(EDU.el('div', { class: 'ws-key' }, EDU.el('h2', { text: t('ws_key') }), table('t-key', arows)));
  }
  $('#print-btn').addEventListener('click', function () { stopSlide(true); buildWorksheet(); window.print(); });
  // Ctrl+P / the browser menu prints the worksheet too (it used to come out as an empty page)
  window.addEventListener('beforeprint', function () { stopSlide(true); buildWorksheet(); });

  /* ============================================================ panel 3: what a CNN sees */
  var fmGrid = $('#fm-grid');
  var mixOk = !!(window.CSS && CSS.supports && CSS.supports('color', 'color-mix(in srgb, red 50%, blue)'));   // older phones: plain colours
  I.FMAPS.forEach(function (m) {
    var foot;
    if (m.k) {
      var heat = EDU.el('div', { class: 'heat', 'aria-hidden': 'true' }), mx = Math.max.apply(null, m.k.map(Math.abs));
      m.k.forEach(function (v) {
        var pct = mixOk ? Math.round(20 + 80 * Math.abs(v) / mx) : 100, base = v > 0 ? 'var(--c7)' : 'var(--c2)';
        // strong colours get the surface colour as text (white on light, dark on dark theme) so the number stays readable
        heat.appendChild(EDU.el('span', { text: I.fn(v), style: { color: v && pct >= 80 ? 'var(--surface)' : '', background: !v ? 'var(--surface)' : pct >= 100 ? base : 'color-mix(in srgb, ' + base + ' ' + pct + '%, var(--surface))' } }));
      });
      foot = heat;
    } else foot = EDU.el('span', { class: 'fm-size', text: '√(Gx² + Gy²)' });
    fmGrid.appendChild(EDU.el('div', { class: 'fm-card' },
      EDU.el('h3', { i18n: 'fm_' + m.id }),
      EDU.el('canvas', { class: 'fm-canvas', id: 'fm-' + m.id, width: 256, height: 256, role: 'img', 'data-i18n-aria-label': 'fm_' + m.id, 'aria-label': t('fm_' + m.id) }),
      EDU.el('div', { class: 'fm-foot' }, foot, EDU.el('span', { class: 'fm-size no-i18n', id: 'fm-size-' + m.id }))));
  });
  $$('#act-seg button').forEach(function (b) { b.addEventListener('click', function () { S.act = b.getAttribute('data-act'); I.save(); renderCnn(); }); });
  $('#opt-pool').addEventListener('change', function () { S.pool = this.checked; I.save(); renderCnn(); });

  function renderCnn() {
    $$('#act-seg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-act') === S.act)); });
    $('#opt-pool').checked = S.pool;
    $('#act-hint').textContent = t(S.act === 'relu' ? 'relu_hint' : 'abs_hint');
    var n = I.N;
    I.FMAPS.forEach(function (m) {
      var raw = new Float64Array(n * n), k;
      if (m.k) {
        var c = I.conv(I.Yv, m.k);
        for (k = 0; k < raw.length; k++) raw[k] = S.act === 'relu' ? Math.max(0, c[k]) : Math.abs(c[k]);
      } else {
        var gx = I.conv(I.Yv, I.GX), gy = I.conv(I.Yv, I.GY);
        for (k = 0; k < raw.length; k++) raw[k] = Math.sqrt(gx[k] * gx[k] + gy[k] * gy[k]);
      }
      var m2 = n;
      if (S.pool) {
        m2 = Math.floor(n / 2);
        var pooled = new Float64Array(m2 * m2), x, y;
        for (y = 0; y < m2; y++) for (x = 0; x < m2; x++) {
          var a = 2 * y * n + 2 * x;
          pooled[y * m2 + x] = Math.max(raw[a], raw[a + 1], raw[a + n], raw[a + n + 1]);
        }
        raw = pooled;
      }
      var mx = 0;
      for (k = 0; k < raw.length; k++) if (raw[k] > mx) mx = raw[k];
      var scale = 255 / Math.max(mx, 128), g8 = new Uint8ClampedArray(m2 * m2);
      for (k = 0; k < raw.length; k++) g8[k] = Math.round(raw[k] * scale);
      var cv = $('#fm-' + m.id);
      I.paint(cv, I.makeImg(m2, g8), m2, 256);
      cv.setAttribute('data-n', String(m2));
      $('#fm-size-' + m.id).textContent = m2 + ' × ' + m2;
    });
  }

  /* ============================================================ panel 4: guess the filter */
  var G = { f: null, opts: [], picked: null, right: false, score: 0, total: 0 };
  /* Do two filters give exactly the same picture here? (On a flat photo every edge filter is all black.) */
  function sameOut(a, b) {
    if (a === b) return true;
    var p = I.filtered(a, 'grey')[0], q = I.filtered(b, 'grey')[0], i;
    for (i = 0; i < p.length; i++) if (p[i] !== q[i]) return false;
    return true;
  }
  function newRound() {
    var f, tries = 0;
    do { f = EDU.pick(I.G_POOL); tries++; } while (f === G.f && tries < 20);
    G.f = f;
    // wrong options should look different from the answer on this picture
    var others = EDU.shuffle(I.G_POOL.filter(function (x) { return x !== f; }));
    var fair = others.filter(function (x) { return !sameOut(x, f); });
    G.opts = EDU.shuffle(fair.concat(others.filter(function (x) { return fair.indexOf(x) < 0; })).slice(0, 3).concat([f]));
    G.picked = null; G.right = false;
  }
  function answer(id) {
    if (G.picked) return;
    G.picked = id; G.total++;
    G.right = sameOut(id, G.f);        // a filter that makes exactly the same picture also counts as right
    if (G.right) G.score++;
    renderGame();
  }
  function renderGame() {
    var n = I.N;
    I.paint($('#g-in'), I.makeImg(n, I.Yv), n, 512);
    I.paint($('#g-out'), I.makeImg(n, I.filtered(G.f, 'grey')[0]), n, 512);
    $('#g-card').setAttribute('data-answer', G.f);
    var box = $('#g-options'); box.innerHTML = '';
    G.opts.forEach(function (id) {
      var cls = 'btn';
      if (G.picked) cls += id === G.f || (id === G.picked && G.right) ? ' right' : id === G.picked ? ' wrongpick' : '';
      box.appendChild(EDU.el('button', { class: cls, type: 'button', 'data-f': id, disabled: !!G.picked, i18n: 'f_' + id, onclick: function () { answer(id); } }));
    });
    var sc = $('#g-score');
    sc.textContent = t('g_score', { s: G.score, n: G.total });
    sc.setAttribute('data-score', String(G.score)); sc.setAttribute('data-total', String(G.total));
    var fb = $('#g-feedback');
    if (G.picked) {
      fb.className = 'callout ' + (G.right ? 'success' : 'danger');
      fb.textContent = t(G.right ? 'g_right' : 'g_wrong', { name: t('f_' + G.f) }) + ' ' + t('d_' + G.f);
    } else { fb.className = 'callout'; fb.textContent = ''; }
  }
  $('#g-next').addEventListener('click', function () { newRound(); renderGame(); });

  /* ============================================================ render + reset */
  function renderActive() {
    if (S.tab === 'pixels') renderPixels();
    else if (S.tab === 'filters') renderFilters();
    else if (S.tab === 'cnn') renderCnn();
    else renderGame();
  }
  function renderAll() { renderSource(); renderTabs(); renderActive(); }

  $('#reset-btn').addEventListener('click', function () {
    if (!window.confirm(t('confirm_reset'))) return;
    stopCam(); stopSlide(true);
    S = I.defaults(); I.setState(S);
    EDU.store('image-pixels-filters').remove('state');
    G.score = 0; G.total = 0; newRound();
    resEl.value = String(S.resI);
    renderKernel();
    setSample(S.sample);
  });

  EDU.onLang(function () { renderKernel(); renderAll(); if (camKey) camMsg(camKey, $('#cam-msg').getAttribute('data-state')); });
  EDU.onTheme(function () { renderAll(); });

  /* start */
  I.sctx.drawImage(I.sampleCanvas[S.sample], 0, 0);
  I.newSource();
  newRound();
  renderKernel();
  renderAll();
})();
