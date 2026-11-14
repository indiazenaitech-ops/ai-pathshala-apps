/* Photo Collage Maker: 2 to 9 photos in grids, strips or 1 big + 2 small, for square / 4:5 / 9:16 / 16:9 / A4.
   Photos are read with FileReader-free object URLs, drawn on a canvas and never leave the device.
   Pan and zoom belong to the photo (focus point + zoom), so they survive a swap or a layout change. */
(function () {
  'use strict';
  var SLUG = 'photo-collage-maker';
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$;
  var MAX = 9, MAX_SIDE = 2000, MAX_ZOOM = 4;
  var LAYOUTS = ['2', '3', '4', '5', '6', '7', '8', '9', 'big2', 'cols', 'rows'];
  var SHAPES = { square: [1080, 1080], portrait: [1080, 1350], story: [1080, 1920], wide: [1920, 1080], a4: [1240, 1754] };
  var SWATCHES = ['#ffffff', '#111111', '#f6e7d8', '#ffd9e1', '#d9ecff', '#dff5e1', '#fff3c4', '#e8defa'];
  var DEF = { layout: '4', shape: 'square', strips: 3, gap: 16, round: 20, bg: '#ffffff', caption: '', size: 'large', mode: 'swap' };

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ---------------- settings (remembered) and photos (never stored) ---------------- */
  function cleanSet(o) {
    o = o && typeof o === 'object' ? o : {};
    var n = function (v, lo, hi, d) { v = Number(v); return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };
    return {
      layout: LAYOUTS.indexOf(o.layout) >= 0 ? o.layout : DEF.layout, shape: SHAPES[o.shape] ? o.shape : DEF.shape,
      strips: Math.round(n(o.strips, 2, 6, DEF.strips)), gap: n(o.gap, 0, 60, DEF.gap), round: n(o.round, 0, 100, DEF.round),
      bg: /^#[0-9a-f]{6}$/i.test(o.bg) ? o.bg.toLowerCase() : DEF.bg, caption: typeof o.caption === 'string' ? o.caption.slice(0, 80) : '',
      size: o.size === 'normal' ? 'normal' : 'large', mode: o.mode === 'move' ? 'move' : 'swap'
    };
  }
  var S = cleanSet(store.get('set', null));
  function saveSet() { store.set('set', S); }

  /* sample tiles: simple drawn scenes (sun, hills, birds), no real photos */
  var PAL = [['#ffd27a', '#ff8a5c', '#2f7d5b', '#1f5a47'], ['#9ad7ff', '#5aa9e6', '#5b8c3a', '#3c6b2a'], ['#ffc2d4', '#ff7aa2', '#7a4fa3', '#553377'],
    ['#fff0a8', '#ffb347', '#b5651d', '#7d4513'], ['#b8f1e0', '#49c5b6', '#1b6f8a', '#124a5e'], ['#d9c8ff', '#8f7ae6', '#3a3f8f', '#262a66'],
    ['#ffe0b8', '#f08a4b', '#9c3d54', '#6d2a3b'], ['#c9f2a8', '#7ccf5a', '#2f8f6b', '#1e6249'], ['#bfe3ff', '#f7a8c4', '#566f9e', '#374a70']];
  function makeSample(i) {
    var c = document.createElement('canvas'); c.width = c.height = 600;
    var x = c.getContext('2d'), p = PAL[i % PAL.length], g = x.createLinearGradient(0, 0, 0, 600);
    g.addColorStop(0, p[0]); g.addColorStop(1, p[1]); x.fillStyle = g; x.fillRect(0, 0, 600, 600);
    x.fillStyle = 'rgba(255,255,255,.85)'; x.beginPath(); x.arc(120 + (i * 97) % 360, 150 + (i * 41) % 90, 58, 0, 6.3); x.fill();
    x.fillStyle = p[2]; x.beginPath(); x.moveTo(0, 600); x.lineTo(0, 430);
    x.bezierCurveTo(150, 330 + (i % 3) * 30, 300, 470, 600, 380 - (i % 4) * 20); x.lineTo(600, 600); x.fill();
    x.fillStyle = p[3]; x.beginPath(); x.moveTo(0, 600); x.lineTo(0, 520);
    x.bezierCurveTo(200, 450, 380, 560 - (i % 2) * 40, 600, 480); x.lineTo(600, 600); x.fill();
    x.strokeStyle = 'rgba(40,40,60,.6)'; x.lineWidth = 5; x.lineCap = 'round';
    for (var b = 0; b < 3; b++) {
      var bx = 330 + b * 62 - (i % 3) * 60, by = 110 + b * 34 + (i % 2) * 40;
      x.beginPath(); x.moveTo(bx - 20, by); x.quadraticCurveTo(bx - 10, by - 14, bx, by); x.quadraticCurveTo(bx + 10, by - 14, bx + 20, by); x.stroke();
    }
    return { src: c, w: 600, h: 600, fx: 0.5, fy: 0.5, z: 1, sample: i + 1 };
  }
  var samples = [];
  for (var si = 0; si < MAX; si++) samples.push(makeSample(si));
  var slots = samples.slice();                 // 9 slots; cell i of the layout shows slots[i]
  var sel = -1, hover = -1;
  function userCount() { return slots.filter(function (p) { return !p.sample; }).length; }

  /* ---------------- geometry ---------------- */
  function unitRects(id, a, strips) {
    function rows(counts) {
      var out = [], n = counts.length;
      counts.forEach(function (c, r) { for (var i = 0; i < c; i++) out.push({ x: i / c, y: r / n, w: 1 / c, h: 1 / n }); });
      return out;
    }
    function ones(n) { var o = []; while (o.length < n) o.push(1); return o; }
    switch (id) {
      case '2': return a < 0.9 ? rows([1, 1]) : rows([2]);
      case '3': return a < 0.9 ? rows([1, 1, 1]) : a > 1.3 ? rows([3]) : rows([1, 2]);
      case '5': return rows([2, 3]);
      case '6': return a > 1.2 ? rows([3, 3]) : rows([2, 2, 2]);
      case '7': return rows([2, 3, 2]);
      case '8': return rows([3, 2, 3]);
      case '9': return rows([3, 3, 3]);
      case 'big2': return a >= 1 ? [{ x: 0, y: 0, w: 2 / 3, h: 1 }, { x: 2 / 3, y: 0, w: 1 / 3, h: 0.5 }, { x: 2 / 3, y: 0.5, w: 1 / 3, h: 0.5 }]
        : [{ x: 0, y: 0, w: 1, h: 2 / 3 }, { x: 0, y: 2 / 3, w: 0.5, h: 1 / 3 }, { x: 0.5, y: 2 / 3, w: 0.5, h: 1 / 3 }];
      case 'cols': return rows([strips]);
      case 'rows': return rows(ones(strips));
      default: return rows([2, 2]);
    }
  }
  function aspect() { var s = SHAPES[S.shape]; return s[0] / s[1]; }
  function hasCaption() { return !!S.caption.trim(); }
  /* cells in pixels for a W x H picture: the same gap between photos and around the edge */
  function pxRects(W, H) {
    var base = Math.min(W, H), g = base * S.gap / 1000, cap = hasCaption() ? Math.round(base * 0.09) : 0;
    var A = { x: g / 2, y: g / 2, w: W - g, h: H - g - cap };
    return unitRects(S.layout, aspect(), S.strips).map(function (r) {
      return { x: A.x + r.x * A.w + g / 2, y: A.y + r.y * A.h + g / 2, w: Math.max(1, r.w * A.w - g), h: Math.max(1, r.h * A.h - g) };
    });
  }
  function cellCount() { return unitRects(S.layout, aspect(), S.strips).length; }
  /* the part of the photo that shows in a cw x ch cell */
  function view(p, cw, ch) {
    var s = Math.max(cw / p.w, ch / p.h) * p.z, sw = cw / s, sh = ch / s;
    var sx = Math.min(p.w - sw, Math.max(0, p.fx * p.w - sw / 2)), sy = Math.min(p.h - sh, Math.max(0, p.fy * p.h - sh / 2));
    return { s: s, sx: sx, sy: sy, sw: sw, sh: sh };
  }
  function settle(p, cw, ch) {                   // keep the focus point where the photo still covers the cell
    var v = view(p, cw, ch);
    p.fx = (v.sx + v.sw / 2) / p.w; p.fy = (v.sy + v.sh / 2) / p.h;
  }

  /* ---------------- drawing ---------------- */
  function rr(x, X, Y, W, H, r) {
    r = Math.min(r, W / 2, H / 2);
    x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + W, Y, X + W, Y + H, r); x.arcTo(X + W, Y + H, X, Y + H, r);
    x.arcTo(X, Y + H, X, Y, r); x.arcTo(X, Y, X + W, Y, r); x.closePath();
  }
  function ink(hex) {
    var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#1b1b1b' : '#ffffff';
  }
  var FONT = 'system-ui, "Noto Sans", "Nirmala UI", sans-serif';
  function draw(x, W, H, forExport) {
    var base = Math.min(W, H), rad = base * S.round / 1000, rects = pxRects(W, H);
    x.save();
    x.fillStyle = S.bg; x.fillRect(0, 0, W, H);
    rects.forEach(function (c, i) {
      var p = slots[i], v = view(p, c.w, c.h);
      x.save(); rr(x, c.x, c.y, c.w, c.h, rad); x.clip();
      x.imageSmoothingQuality = 'high';
      x.drawImage(p.src, v.sx, v.sy, v.sw, v.sh, c.x, c.y, c.w, c.h);
      if (p.sample) {
        var fs = Math.max(10, Math.min(c.w, c.h) * 0.13), label = t('sample_n', { n: p.sample });
        x.font = '700 ' + fs + 'px ' + FONT; x.textAlign = 'center'; x.textBaseline = 'middle';
        var tw = Math.min(c.w * 0.9, x.measureText(label).width + fs);
        x.fillStyle = 'rgba(0,0,0,.45)'; rr(x, c.x + c.w / 2 - tw / 2, c.y + c.h / 2 - fs * 0.85, tw, fs * 1.7, fs * 0.85); x.fill();
        x.fillStyle = '#fff'; x.fillText(label, c.x + c.w / 2, c.y + c.h / 2, c.w * 0.85);
      }
      x.restore();
      if (!forExport && (i === sel || i === hover)) {
        var lw = Math.max(3, base * 0.008);
        x.save(); x.lineWidth = lw; x.strokeStyle = i === hover ? '#ff7a00' : '#0b7285';
        if (i === hover) x.setLineDash([lw * 3, lw * 2]);
        rr(x, c.x + lw / 2, c.y + lw / 2, c.w - lw, c.h - lw, Math.max(0, rad - lw / 2)); x.stroke();
        x.lineWidth = Math.max(1, lw / 3); x.strokeStyle = '#fff'; x.setLineDash([]);
        rr(x, c.x + lw * 1.2, c.y + lw * 1.2, c.w - lw * 2.4, c.h - lw * 2.4, Math.max(0, rad - lw * 1.2)); x.stroke();
        x.restore();
      }
    });
    if (hasCaption()) {
      var g = base * S.gap / 1000, cap = Math.round(base * 0.09), txt = S.caption.trim(), size = cap * 0.52, maxW = W - g - base * 0.06;
      x.fillStyle = ink(S.bg); x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = '700 ' + size + 'px ' + FONT;
      var wd = x.measureText(txt).width;
      if (wd > maxW) { size = Math.max(cap * 0.26, size * maxW / wd); x.font = '700 ' + size + 'px ' + FONT; }
      while (txt.length > 1 && x.measureText(txt).width > maxW) txt = txt.slice(0, -2).trim() + '…';
      x.fillText(txt, W / 2, H - g / 2 - cap / 2);
    }
    x.restore();
  }
  var cv = $('#cv'), ctx = cv.getContext('2d');
  function sizeCanvas() {
    var wrap = $('#stageWrap'), a = aspect();
    var availW = Math.max(120, wrap.clientWidth - 16), maxH = Math.max(260, Math.min(window.innerHeight * 0.72, 720));
    var w = Math.min(availW, 640, maxH * a), h = w / a;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.style.width = Math.round(w) + 'px'; cv.style.height = Math.round(h) + 'px';
    var pw = Math.round(w * dpr), ph = Math.round(h * dpr);
    if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
  }
  function paint() { sizeCanvas(); draw(ctx, cv.width, cv.height, false); }
  function exportSize() { var s = SHAPES[S.shape], k = S.size === 'large' ? 2 : 1; return [s[0] * k, s[1] * k]; }
  function exportCanvas(k) {
    var s = SHAPES[S.shape], c = document.createElement('canvas');
    c.width = s[0] * k; c.height = s[1] * k;
    var x = c.getContext('2d');
    if (!x) return null;
    draw(x, c.width, c.height, true);
    return c;
  }

  /* ---------------- interface ---------------- */
  function icon(id) {
    var a = aspect(), w = a >= 1 ? 30 : 30 * a, h = a >= 1 ? 30 / a : 30, ox = (30 - w) / 2, oy = (30 - h) / 2;
    var s = '<svg viewBox="0 0 30 30" aria-hidden="true">';
    unitRects(id, a, S.strips).forEach(function (r) {
      s += '<rect x="' + (ox + r.x * w + 0.8).toFixed(1) + '" y="' + (oy + r.y * h + 0.8).toFixed(1) + '" width="' + Math.max(1, r.w * w - 1.6).toFixed(1) +
        '" height="' + Math.max(1, r.h * h - 1.6).toFixed(1) + '" rx="1.2" fill="currentColor"/>';
    });
    return s + '</svg>';
  }
  function layName(id) { return id === 'big2' ? t('lay_big2') : id === 'cols' ? t('lay_cols') : id === 'rows' ? t('lay_rows') : t('lay_n', { n: id }); }
  function renderLayouts() {
    var box = $('#layouts'); box.innerHTML = '';
    LAYOUTS.forEach(function (id) {
      var short = /^\d$/.test(id) ? id : id === 'big2' ? '1+2' : '';
      var b = el('button', { type: 'button', class: 'lay-btn', 'aria-pressed': String(S.layout === id), 'aria-label': layName(id), title: layName(id), dataset: { layout: id },
        html: icon(id) + (short ? '<span aria-hidden="true">' + short + '</span>' : '') });
      b.addEventListener('click', function () { setLayout(id); });
      box.appendChild(b);
    });
    var strips = S.layout === 'cols' || S.layout === 'rows';
    $('#stripsWrap').hidden = !strips;
    var seg = $('#stripsSeg'); seg.innerHTML = '';
    [2, 3, 4, 5, 6].forEach(function (n) {
      var b = el('button', { type: 'button', 'aria-pressed': String(S.strips === n), text: String(n), dataset: { strips: n } });
      b.addEventListener('click', function () { S.strips = n; afterChange(); });
      seg.appendChild(b);
    });
  }
  function renderSwatches() {
    var box = $('#swatches'); box.innerHTML = '';
    SWATCHES.forEach(function (c, i) {
      var b = el('button', { type: 'button', class: 'sw', 'aria-pressed': String(S.bg === c), 'aria-label': t('color_n', { n: i + 1 }), title: t('color_n', { n: i + 1 }), style: { background: c }, dataset: { color: c } });
      b.addEventListener('click', function () { S.bg = c; saveSet(); renderSwatches(); paint(); });
      box.appendChild(b);
    });
    var inp = el('input', { type: 'color', id: 'bgPick', value: S.bg, 'aria-label': t('bg_pick'), title: t('bg_pick') });
    inp.addEventListener('input', function () { S.bg = inp.value.toLowerCase(); saveSet(); $$('#swatches .sw').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.color === S.bg)); }); paint(); });
    box.appendChild(inp);
  }
  function renderUI() {
    var n = userCount(), cells = cellCount();
    if (sel >= cells) sel = -1;
    $('#count').textContent = t('photos_n', { n: EDU.fmt(n), max: EDU.fmt(MAX) });
    $('#clearPhotos').disabled = !n;
    var note = $('#note'), showing = slots.slice(0, cells).some(function (p) { return p.sample; });
    note.hidden = !showing;
    note.textContent = !n ? t('sample_note') : t('fill_note');
    $$('#modeSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === S.mode)); });
    $$('#shapeSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.shape === S.shape)); });
    $$('#sizeSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.size === S.size)); });
    cv.classList.toggle('move', S.mode === 'move');
    $('#hint').textContent = t(S.mode === 'move' ? 'hint_move' : 'hint_swap');
    $('#selLabel').textContent = sel >= 0 ? t('sel_n', { n: EDU.fmt(sel + 1) }) : t('sel_none');
    var off = sel < 0;
    $('#selBox').dataset.off = off ? '1' : '0';
    $('#zoom').disabled = off; $('#replaceBtn').disabled = off; $('#fitBtn').disabled = off;
    $('#removeBtn').disabled = off || !!slots[sel].sample;
    $('#zoom').value = off ? 100 : Math.round(slots[sel].z * 100);
    var es = exportSize();
    $('#sizePx').textContent = t('size_px', { w: es[0], h: es[1] });
    $('#gap').value = S.gap; $('#round').value = S.round;
    if ($('#caption').value !== S.caption) $('#caption').value = S.caption;
  }
  function afterChange() { saveSet(); renderLayouts(); renderUI(); paint(); }
  function setLayout(id) { S.layout = id; sel = -1; afterChange(); var b = document.querySelector('#layouts [data-layout="' + id + '"]'); if (b) b.focus(); }

  /* ---------------- photos ---------------- */
  function loadPhoto(file) {
    return new Promise(function (resolve) {
      if (!file || (file.type && !/^image\//.test(file.type))) return resolve(null);
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight;
        if (!w || !h) { URL.revokeObjectURL(url); return resolve(null); }
        var k = Math.min(1, MAX_SIDE / Math.max(w, h));
        var c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
        try { c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); } catch (e) { URL.revokeObjectURL(url); return resolve(null); }
        URL.revokeObjectURL(url);
        resolve({ src: c, w: c.width, h: c.height, fx: 0.5, fy: 0.5, z: 1, sample: 0 });
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }
  function bestLayout(n) {
    if (S.layout === 'cols' || S.layout === 'rows') { if (n >= 2 && n <= 6) { S.strips = n; return; } }
    if (n >= 2 && n !== cellCount()) S.layout = String(Math.min(9, n));
  }
  function addFiles(files) {
    var list = Array.prototype.slice.call(files || []), bad = 0, over = 0;
    var chain = Promise.resolve();
    list.forEach(function (f) {
      chain = chain.then(function () {
        var at = -1;
        slots.forEach(function (p, i) { if (at < 0 && p.sample) at = i; });
        if (at < 0) { over++; return null; }
        return loadPhoto(f).then(function (p) { if (!p) { bad++; return; } slots[at] = p; });
      });
    });
    return chain.then(function () {
      if (over) EDU.toast(t('msg_max', { max: EDU.fmt(MAX) }));
      else if (bad) EDU.toast(t('msg_bad'));
      bestLayout(userCount()); sel = -1; afterChange();
    });
  }
  function freeSample() {
    for (var i = 0; i < samples.length; i++) if (slots.indexOf(samples[i]) < 0) return samples[i];
    return samples[0];
  }
  $('#file').addEventListener('change', function () { var f = this.files; addFiles(f).then(function () { $('#file').value = ''; }); });
  $('#fileOne').addEventListener('change', function () {
    var f = this.files && this.files[0], at = sel;
    this.value = '';
    if (!f || at < 0) return;
    loadPhoto(f).then(function (p) { if (!p) { EDU.toast(t('msg_bad')); return; } slots[at] = p; afterChange(); });
  });
  $('#replaceBtn').addEventListener('click', function () { if (sel >= 0) $('#fileOne').click(); });
  $('#removeBtn').addEventListener('click', function () {
    if (sel < 0 || slots[sel].sample) return;
    slots[sel] = freeSample();
    /* keep your photos first, sample tiles after them */
    var u = slots.filter(function (p) { return !p.sample; }), s = slots.filter(function (p) { return p.sample; });
    slots = u.concat(s); sel = -1; afterChange();
  });
  $('#fitBtn').addEventListener('click', function () { if (sel < 0) return; var p = slots[sel]; p.fx = p.fy = 0.5; p.z = 1; renderUI(); paint(); });
  $('#clearPhotos').addEventListener('click', function () { slots = samples.slice(); sel = -1; afterChange(); });
  $('#zoom').addEventListener('input', function () {
    if (sel < 0) return;
    var p = slots[sel], c = pxRects(cv.width, cv.height)[sel];
    p.z = Math.min(MAX_ZOOM, Math.max(1, Number(this.value) / 100)); settle(p, c.w, c.h); paint();
  });
  function swap(a, b) { var x = slots[a]; slots[a] = slots[b]; slots[b] = x; }

  /* ---------------- pointer: tap / drag to swap, drag / pinch to move ---------------- */
  var pts = {}, drag = null, pinch = null;
  function pos(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; }
  function cellAt(p) {
    var rects = pxRects(cv.width, cv.height);
    for (var i = 0; i < rects.length; i++) { var c = rects[i]; if (p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h) return i; }
    return -1;
  }
  function nPts() { return Object.keys(pts).length; }
  function dist() { var k = Object.keys(pts), a = pts[k[0]], b = pts[k[1]]; return Math.hypot(a.x - b.x, a.y - b.y) || 1; }
  cv.addEventListener('pointerdown', function (e) {
    if (e.button > 0) return;
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
    var p = pos(e); pts[e.pointerId] = p;
    if (nPts() === 1) {
      var hit = cellAt(p);
      drag = { cell: hit, sx: p.x, sy: p.y, lx: p.x, ly: p.y, moved: false };
      if (S.mode === 'move' && hit >= 0 && sel !== hit) { sel = hit; renderUI(); paint(); }
    } else if (nPts() === 2 && S.mode === 'move' && sel >= 0) {
      pinch = { d: dist(), z: slots[sel].z }; if (drag) drag.moved = true;
    }
  });
  cv.addEventListener('pointermove', function (e) {
    if (!pts[e.pointerId]) return;
    var p = pos(e); pts[e.pointerId] = p;
    if (pinch && nPts() >= 2 && sel >= 0) {
      var ph = slots[sel], c0 = pxRects(cv.width, cv.height)[sel];
      ph.z = Math.min(MAX_ZOOM, Math.max(1, pinch.z * dist() / pinch.d)); settle(ph, c0.w, c0.h);
      $('#zoom').value = Math.round(ph.z * 100); paint(); return;
    }
    if (!drag || drag.cell < 0) return;
    var slop = 6 * cv.width / (cv.getBoundingClientRect().width || 1);
    if (!drag.moved && Math.hypot(p.x - drag.sx, p.y - drag.sy) > slop) drag.moved = true;
    if (!drag.moved) return;
    if (S.mode === 'move') {
      var q = slots[drag.cell], c = pxRects(cv.width, cv.height)[drag.cell], v = view(q, c.w, c.h);
      q.fx -= (p.x - drag.lx) / (v.s * q.w); q.fy -= (p.y - drag.ly) / (v.s * q.h); settle(q, c.w, c.h);
      drag.lx = p.x; drag.ly = p.y; paint();
    } else {
      var h = cellAt(p); h = h === drag.cell ? -1 : h;
      if (h !== hover) { hover = h; paint(); }
    }
  });
  function endPointer(e, cancelled) {
    if (!pts[e.pointerId]) return;
    var p = pos(e); delete pts[e.pointerId];
    if (nPts() < 2) pinch = null;
    if (nPts() > 0 || !drag) return;
    var d = drag; drag = null; hover = -1;
    if (!cancelled && S.mode === 'swap' && d.cell >= 0) {
      var target = cellAt(p);
      if (d.moved) { if (target >= 0 && target !== d.cell) { swap(d.cell, target); sel = -1; } }
      else if (sel >= 0 && sel !== d.cell) { swap(sel, d.cell); sel = -1; }
      else sel = sel === d.cell ? -1 : d.cell;
    }
    renderUI(); paint();
  }
  cv.addEventListener('pointerup', function (e) { endPointer(e, false); });
  cv.addEventListener('pointercancel', function (e) { endPointer(e, true); });
  cv.addEventListener('wheel', function (e) {
    if (S.mode !== 'move') return;
    var hit = cellAt(pos(e)); if (hit < 0) return;
    e.preventDefault(); sel = hit;
    var p = slots[hit], c = pxRects(cv.width, cv.height)[hit];
    p.z = Math.min(MAX_ZOOM, Math.max(1, p.z * (e.deltaY < 0 ? 1.08 : 1 / 1.08))); settle(p, c.w, c.h); renderUI(); paint();
  }, { passive: false });
  cv.addEventListener('keydown', function (e) {
    var k = e.key, n = cellCount();
    if (k === 'Tab') return;
    if (sel < 0) { if (k === 'Enter' || k === ' ' || /^Arrow/.test(k)) { sel = 0; renderUI(); paint(); e.preventDefault(); } return; }
    var p = slots[sel], c = pxRects(cv.width, cv.height)[sel], used = true;
    if (k === 'ArrowLeft') p.fx -= 0.03 / p.z; else if (k === 'ArrowRight') p.fx += 0.03 / p.z;
    else if (k === 'ArrowUp') p.fy -= 0.03 / p.z; else if (k === 'ArrowDown') p.fy += 0.03 / p.z;
    else if (k === '+' || k === '=') p.z = Math.min(MAX_ZOOM, p.z * 1.1); else if (k === '-') p.z = Math.max(1, p.z / 1.1);
    else if (k === 'Enter' || k === ' ') sel = (sel + 1) % n;
    else if (k === 'Escape') sel = -1; else used = false;
    if (!used) return;
    e.preventDefault(); settle(p, c.w, c.h); renderUI(); paint();
  });

  /* ---------------- controls ---------------- */
  $('#modeSeg').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; S.mode = b.dataset.mode; saveSet(); renderUI(); paint(); });
  $('#shapeSeg').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; S.shape = b.dataset.shape; afterChange(); });
  $('#sizeSeg').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; S.size = b.dataset.size; saveSet(); renderUI(); });
  $('#gap').addEventListener('input', function () { S.gap = Number(this.value); saveSet(); paint(); });
  $('#round').addEventListener('input', function () { S.round = Number(this.value); saveSet(); paint(); });
  $('#caption').addEventListener('input', function () { S.caption = this.value.slice(0, 80); saveSet(); paint(); });
  $('#resetBtn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    S = cleanSet(null); samples.forEach(function (p) { p.fx = p.fy = 0.5; p.z = 1; });
    slots = samples.slice(); sel = -1; renderSwatches(); afterChange();
  });
  function stamp() { var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()); }
  function save(kind) {
    var mime = kind === 'jpg' ? 'image/jpeg' : 'image/png', name = 'collage-' + stamp() + '.' + kind;
    function attempt(k, fellBack) {
      var c = null;
      try { c = exportCanvas(k); } catch (e) { c = null; }
      var fail = function () { if (k > 1) attempt(1, true); else EDU.toast(t('msg_bad')); };
      if (!c) return fail();
      try {
        c.toBlob(function (b) {
          if (!b) return fail();
          EDU.download(name, b);
          if (fellBack) EDU.toast(t('msg_low_mem'));
        }, mime, 0.92);
      } catch (e) { fail(); }
    }
    attempt(S.size === 'large' ? 2 : 1, false);
  }
  $('#pngBtn').addEventListener('click', function () { save('png'); });
  $('#jpgBtn').addEventListener('click', function () { save('jpg'); });

  var rz = null;
  window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(paint, 80); });
  EDU.onLang(function () { renderLayouts(); renderSwatches(); renderUI(); paint(); });
  renderLayouts(); renderSwatches(); renderUI(); paint();

  window.PCM = {
    get set() { return S; }, get sel() { return sel; }, userCount: userCount, cellCount: cellCount, pxRects: pxRects, exportCanvas: exportCanvas, exportSize: exportSize,
    photo: function (i) { var p = slots[i]; return { sample: p.sample, w: p.w, h: p.h, fx: p.fx, fy: p.fy, z: p.z }; },
    /* centre of cell i in page coordinates, for tests */
    centre: function (i) { var r = cv.getBoundingClientRect(), c = pxRects(cv.width, cv.height)[i], k = r.width / cv.width; return { x: r.left + (c.x + c.w / 2) * k, y: r.top + (c.y + c.h / 2) * k }; }
  };
})();
