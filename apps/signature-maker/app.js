/* Signature Maker: draw, take from a photo of paper, or type a name -> clean signature image.
   Everything runs on the device. The signature itself is never stored; only the settings are. */
(function () {
  'use strict';
  var $ = EDU.$, $$ = EDU.$$, t = EDU.t;
  var store = EDU.store('signature-maker');
  var app = $('#app');

  EDU.init({ slug: 'signature-maker', title: 'app_title', waKey: 'shell_wa_tool' });

  var INKS = { black: '#111111', blue: '#1d4ed8', dark: '#0b2a6b' };
  var FONTS = [
    { fam: '"Segoe Script", "Snell Roundhand", "Apple Chancery", "Dancing Script", cursive', style: 'normal', weight: '400' },
    { fam: '"Lucida Handwriting", "Bradley Hand", "Savoye LET", cursive', style: 'italic', weight: '400' },
    { fam: '"Brush Script MT", "Segoe Print", "Noteworthy", "Comic Sans MS", cursive', style: 'normal', weight: '700' },
    { fam: 'Georgia, "Times New Roman", "Noto Serif", serif', style: 'italic', weight: '400' }
  ];
  var PW = 1000, PH = 420;                    /* logical pad size; strokes are stored in these units */
  var DEF = { mode: 'draw', ink: 'black', bg: 'clear', pen: 9, font: 0, tw: '', th: '', kb: '' };
  var S = Object.assign({}, DEF, store.get('s', {}));
  if (!INKS[S.ink]) S.ink = 'black';
  if (['draw', 'photo', 'type'].indexOf(S.mode) < 0) S.mode = 'draw';
  if (!(S.font >= 0 && S.font < FONTS.length)) S.font = 0;

  var strokes = [];                           /* [{w, pts:[x,y,x,y...]}] */
  var cur = null, curId = null;
  var photo = null;                           /* {src:canvas, norm:Uint8Array, w, h, auto, thr, mask} */
  var photoErr = '';
  var out = { png: null, jpg: null };         /* {blob, w, h, state} */
  var token = 0, timer = 0;

  function save() { store.set('s', S); }
  function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function num(v, lo, hi) { var n = parseInt(v, 10); if (!isFinite(n) || n <= 0) return 0; return EDU.clamp(n, lo, hi); }

  /* ------------------------------------------------ drawing pad */
  var pad = $('#pad'), pctx = pad.getContext('2d');

  function paintStrokes(ctx, list, scale, ox, oy, color) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = color; ctx.fillStyle = color;
    list.forEach(function (s) {
      var p = s.pts, n = p.length / 2, i;
      var X = function (k) { return (p[k * 2] - ox) * scale; }, Y = function (k) { return (p[k * 2 + 1] - oy) * scale; };
      if (n === 1) { ctx.beginPath(); ctx.arc(X(0), Y(0), s.w * scale / 2, 0, Math.PI * 2); ctx.fill(); return; }
      ctx.lineWidth = s.w * scale;
      ctx.beginPath(); ctx.moveTo(X(0), Y(0));
      for (i = 1; i < n - 1; i++) ctx.quadraticCurveTo(X(i), Y(i), (X(i) + X(i + 1)) / 2, (Y(i) + Y(i + 1)) / 2);
      ctx.lineTo(X(n - 1), Y(n - 1));
      ctx.stroke();
    });
  }

  function drawPad() {
    var r = pad.getBoundingClientRect();
    if (!r.width) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    var w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (pad.width !== w || pad.height !== h) { pad.width = w; pad.height = h; }
    pctx.setTransform(1, 0, 0, 1, 0, 0);
    pctx.fillStyle = '#ffffff'; pctx.fillRect(0, 0, w, h);
    var v = view();
    pctx.strokeStyle = '#c9ced6'; pctx.lineWidth = Math.max(1, dpr); pctx.setLineDash([6 * dpr, 6 * dpr]);
    pctx.beginPath(); pctx.moveTo(w * 0.06, h * 0.74); pctx.lineTo(w * 0.94, h * 0.74); pctx.stroke(); pctx.setLineDash([]);
    var all = cur ? strokes.concat([cur]) : strokes;
    if (!all.length) {
      pctx.fillStyle = '#9aa1ad'; pctx.textAlign = 'center'; pctx.textBaseline = 'middle';
      var fam = 'px system-ui, "Segoe UI", "Nirmala UI", "Noto Sans", sans-serif', fs = Math.round(Math.min(h * 0.16, w * 0.07));
      var label = '✍ ' + t('sign_here');
      pctx.font = '600 ' + fs + fam;
      var tw = pctx.measureText(label).width;
      if (tw > w * 0.84) { fs = Math.max(9, Math.floor(fs * w * 0.84 / tw)); pctx.font = '600 ' + fs + fam; }
      pctx.fillText(label, w / 2, h * 0.45);
    }
    paintStrokes(pctx, all, v.s * dpr, -v.ox / v.s, -v.oy / v.s, INKS[S.ink]);
  }
  /* logical 1000 x 420 area is fitted (contain, centred) inside the visible pad, which is taller on phones */
  function view() {
    var r = pad.getBoundingClientRect();
    var s = Math.min(r.width / PW, r.height / PH) || 1;
    return { s: s, ox: (r.width - PW * s) / 2, oy: (r.height - PH * s) / 2, r: r };
  }
  function toLogical(e) {
    var v = view();
    return [(e.clientX - v.r.left - v.ox) / v.s, (e.clientY - v.r.top - v.oy) / v.s];
  }
  function addPoint(e) {
    var q = toLogical(e), p = cur.pts, n = p.length;
    var dx = q[0] - p[n - 2], dy = q[1] - p[n - 1];
    if (dx * dx + dy * dy < 2.5) return;
    p.push(Math.round(q[0] * 10) / 10, Math.round(q[1] * 10) / 10);
  }
  pad.addEventListener('pointerdown', function (e) {
    if (cur || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    try { pad.setPointerCapture(e.pointerId); } catch (x) { /* older browsers */ }
    var q = toLogical(e);
    curId = e.pointerId;
    cur = { w: S.pen, pts: [Math.round(q[0] * 10) / 10, Math.round(q[1] * 10) / 10] };
    drawPad();
  });
  pad.addEventListener('pointermove', function (e) {
    if (!cur || e.pointerId !== curId) return;
    e.preventDefault();
    var list = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
    if (list && list.length) list.forEach(addPoint); else addPoint(e);
    drawPad();
  });
  function endStroke(e) {
    if (!cur || e.pointerId !== curId) return;
    strokes.push(cur); cur = null; curId = null;
    drawPad(); refresh();
  }
  pad.addEventListener('pointerup', endStroke);
  pad.addEventListener('pointercancel', endStroke);
  pad.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  pad.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
  });
  function undo() { if (cur) return; strokes.pop(); drawPad(); refresh(); }
  $('#undo').addEventListener('click', undo);
  $('#clearPad').addEventListener('click', function () { strokes = []; cur = null; drawPad(); refresh(); });
  $('#pen').addEventListener('input', function () { S.pen = num(this.value, 3, 26) || 9; save(); });
  window.addEventListener('resize', drawPad);

  function maskFromStrokes() {
    if (!strokes.length) return null;
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    strokes.forEach(function (s) {
      for (var i = 0; i < s.pts.length; i += 2) {
        x0 = Math.min(x0, s.pts[i] - s.w / 2); x1 = Math.max(x1, s.pts[i] + s.w / 2);
        y0 = Math.min(y0, s.pts[i + 1] - s.w / 2); y1 = Math.max(y1, s.pts[i + 1] + s.w / 2);
      }
    });
    x0 -= 2; y0 -= 2; x1 += 2; y1 += 2;
    var sc = Math.min(2, 1600 / Math.max(x1 - x0, y1 - y0));
    var c = mk((x1 - x0) * sc, (y1 - y0) * sc);
    paintStrokes(c.getContext('2d'), strokes, sc, x0, y0, '#000');
    return c;
  }

  /* ------------------------------------------------ photo of a signature on paper */
  function decodeFile(file) {
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

  function setPhotoSource(img, w, h) {
    var k = Math.min(1, 1400 / Math.max(w, h));
    var c = mk(w * k, h * k), x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);          /* transparent PNGs become ink on white */
    x.imageSmoothingQuality = 'high';
    x.drawImage(img, 0, 0, c.width, c.height);
    if (img.close) img.close();
    photo = { src: c };
    analysePhoto();
  }

  /* Flatten paper shadows: divide each pixel by the local paper brightness, then find the ink level (Otsu). */
  function analysePhoto() {
    var c = photo.src, w = c.width, h = c.height;
    var d = c.getContext('2d').getImageData(0, 0, w, h).data;
    var n = w * h, lum = new Uint8Array(n), i, x, y;
    for (i = 0; i < n; i++) lum[i] = (d[i * 4] * 77 + d[i * 4 + 1] * 150 + d[i * 4 + 2] * 29) >> 8;
    var bs = Math.max(8, Math.round(Math.max(w, h) / 32));
    var gw = Math.ceil(w / bs), gh = Math.ceil(h / bs), grid = new Float32Array(gw * gh), hist = new Uint32Array(256);
    for (var gy = 0; gy < gh; gy++) for (var gx = 0; gx < gw; gx++) {
      hist.fill(0); var cnt = 0;
      var ye = Math.min(h, (gy + 1) * bs), xe = Math.min(w, (gx + 1) * bs);
      for (y = gy * bs; y < ye; y++) for (x = gx * bs; x < xe; x++) { hist[lum[y * w + x]]++; cnt++; }
      var need = cnt * 0.1, acc = 0, v = 255;
      for (; v > 0; v--) { acc += hist[v]; if (acc >= need) break; }
      grid[gy * gw + gx] = Math.max(v, 40);
    }
    var g2 = new Float32Array(gw * gh);       /* 3 x 3 max so a block full of thick ink still sees paper nearby */
    for (gy = 0; gy < gh; gy++) for (gx = 0; gx < gw; gx++) {
      var m = 0;
      for (var a = -1; a <= 1; a++) for (var b = -1; b <= 1; b++) {
        var yy = gy + a, xx = gx + b;
        if (yy >= 0 && yy < gh && xx >= 0 && xx < gw) m = Math.max(m, grid[yy * gw + xx]);
      }
      g2[gy * gw + gx] = m;
    }
    var norm = new Uint8Array(n);
    hist.fill(0);
    for (y = 0; y < h; y++) {
      var fy = (y + 0.5) / bs - 0.5, y0 = Math.max(0, Math.floor(fy)), y1 = Math.min(gh - 1, y0 + 1), ty = EDU.clamp(fy - y0, 0, 1);
      for (x = 0; x < w; x++) {
        var fx = (x + 0.5) / bs - 0.5, x0 = Math.max(0, Math.floor(fx)), x1 = Math.min(gw - 1, x0 + 1), tx = EDU.clamp(fx - x0, 0, 1);
        var bg = (g2[y0 * gw + x0] * (1 - tx) + g2[y0 * gw + x1] * tx) * (1 - ty) + (g2[y1 * gw + x0] * (1 - tx) + g2[y1 * gw + x1] * tx) * ty;
        var val = Math.min(255, Math.round(lum[y * w + x] * 255 / bg));
        norm[y * w + x] = val; hist[val]++;
      }
    }
    /* Otsu */
    var sum = 0, sumB = 0, wB = 0, best = 0, thr = 128, gap = 0, light = 255;
    for (i = 0; i < 256; i++) sum += i * hist[i];
    for (i = 0; i < 256; i++) {
      wB += hist[i]; if (!wB) continue;
      var wF = n - wB; if (!wF) break;
      sumB += i * hist[i];
      var mB = sumB / wB, mF = (sum - sumB) / wF, between = wB * wF * (mB - mF) * (mB - mF);
      if (between > best) { best = between; thr = i; gap = mF - mB; light = mF; }
    }
    if (gap < 45) thr = light - 80;           /* no clear ink: do not turn paper grain into "ink" */
    photo.norm = norm; photo.w = w; photo.h = h;
    photo.auto = EDU.clamp(Math.round(thr + 8), 20, 245);
    photo.thr = photo.auto;
    photo.mask = undefined;
  }

  function maskFromPhoto() {
    if (!photo) return null;
    if (photo.mask !== undefined) return photo.mask;
    var w = photo.w, h = photo.h, norm = photo.norm, thr = photo.thr;
    var id = new ImageData(w, h), d = id.data, rows = new Uint32Array(h), cols = new Uint32Array(w), x, y;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      var a = (thr - norm[y * w + x] + 12) / 24;
      if (a <= 0) continue;
      if (a > 1) a = 1;
      d[(y * w + x) * 4 + 3] = Math.round(a * 255);
      if (a > 0.5) { rows[y]++; cols[x]++; }
    }
    var x0 = 0, x1 = w - 1, y0 = 0, y1 = h - 1;
    while (x0 < w && cols[x0] < 2) x0++;
    while (x1 > x0 && cols[x1] < 2) x1--;
    while (y0 < h && rows[y0] < 2) y0++;
    while (y1 > y0 && rows[y1] < 2) y1--;
    if (x0 >= w || y0 >= h || x1 - x0 < 4 || y1 - y0 < 4) { photo.mask = null; return null; }
    x0 = Math.max(0, x0 - 2); y0 = Math.max(0, y0 - 2); x1 = Math.min(w - 1, x1 + 2); y1 = Math.min(h - 1, y1 + 2);
    var full = mk(w, h); full.getContext('2d').putImageData(id, 0, 0);
    var c = mk(x1 - x0 + 1, y1 - y0 + 1);
    c.getContext('2d').drawImage(full, -x0, -y0);
    photo.mask = c;
    return c;
  }

  function showPhotoUI() {
    $('#photoCtl').hidden = !photo;
    var msg = $('#photoMsg');
    msg.textContent = photoErr ? t(photoErr) : (photo ? '' : t('photo_none'));
    msg.className = 'small mb0' + (photoErr ? ' sm-err' : ' muted');
    msg.style.color = photoErr ? 'var(--danger)' : '';
    if (photo) {
      $('#thr').value = photo.thr;
      var th = $('#photoThumb'), k = Math.min(1, 300 / Math.max(photo.w, photo.h));
      th.width = Math.round(photo.w * k); th.height = Math.round(photo.h * k);
      th.getContext('2d').drawImage(photo.src, 0, 0, th.width, th.height);
    }
  }

  function loadPhoto(file) {
    if (!file) return;
    app.dataset.busy = '1';
    decodeFile(file).then(function (img) {
      var w = img.width || img.naturalWidth, h = img.height || img.naturalHeight;
      if (!w || !h) throw new Error('empty');
      photoErr = '';
      setPhotoSource(img, w, h);
    }).catch(function () {
      photoErr = 'err_notimg';
    }).then(function () { showPhotoUI(); refresh(); });
  }
  $('#pickPhoto').addEventListener('click', function () { $('#photoIn').click(); });
  $('#photoIn').addEventListener('change', function () { var f = this.files && this.files[0]; this.value = ''; loadPhoto(f); });
  $('#samplePhoto').addEventListener('click', function () {
    var c = samplePaper();
    photoErr = '';
    setPhotoSource(c, c.width, c.height);
    showPhotoUI(); refresh();
  });
  $('#thr').addEventListener('input', function () {
    if (!photo) return;
    photo.thr = num(this.value, 20, 245) || photo.auto; photo.mask = undefined; refresh();
  });
  $('#thrAuto').addEventListener('click', function () {
    if (!photo) return;
    photo.thr = photo.auto; photo.mask = undefined; $('#thr').value = photo.thr; refresh();
  });
  $('#rotate').addEventListener('click', function () {
    if (!photo) return;
    var s = photo.src, c = mk(s.height, s.width), x = c.getContext('2d');
    x.translate(c.width, 0); x.rotate(Math.PI / 2); x.drawImage(s, 0, 0);
    photo = { src: c }; analysePhoto(); showPhotoUI(); refresh();
  });

  /* a made-up "phone photo" of a signature: greyish paper, a shadow across it, blue-black pen strokes */
  function samplePaper() {
    var c = mk(900, 520), x = c.getContext('2d');
    var g = x.createLinearGradient(0, 0, 900, 520);
    g.addColorStop(0, '#e9e4d8'); g.addColorStop(0.55, '#d3cec2'); g.addColorStop(1, '#a9a498');
    x.fillStyle = g; x.fillRect(0, 0, 900, 520);
    x.strokeStyle = 'rgba(120,150,190,.25)'; x.lineWidth = 1;
    for (var y = 60; y < 520; y += 46) { x.beginPath(); x.moveTo(0, y); x.lineTo(900, y); x.stroke(); }
    x.strokeStyle = '#1b2a5c'; x.lineWidth = 7; x.lineCap = 'round'; x.lineJoin = 'round';
    x.beginPath(); x.moveTo(210, 300);
    x.bezierCurveTo(230, 150, 300, 150, 290, 290); x.bezierCurveTo(285, 350, 240, 330, 300, 250);
    x.bezierCurveTo(350, 190, 360, 330, 390, 270); x.bezierCurveTo(410, 230, 420, 320, 450, 270);
    x.bezierCurveTo(480, 220, 470, 330, 520, 260); x.bezierCurveTo(560, 200, 560, 330, 600, 270);
    x.bezierCurveTo(630, 230, 660, 290, 700, 240);
    x.stroke();
    x.lineWidth = 5; x.beginPath(); x.moveTo(230, 350); x.bezierCurveTo(380, 320, 560, 345, 690, 315); x.stroke();
    return c;
  }

  /* ------------------------------------------------ typed name */
  function fontCss(i, px) { var f = FONTS[i]; return f.style + ' ' + f.weight + ' ' + px + 'px ' + f.fam; }
  function alphaBox(c) {
    var w = c.width, h = c.height, d = c.getContext('2d').getImageData(0, 0, w, h).data;
    var x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }
  function maskFromText() {
    var name = $('#nameIn').value.replace(/\s+/g, ' ').trim();
    if (!name) return null;
    var px = 150, probe = mk(4, 4).getContext('2d');
    probe.font = fontCss(S.font, px);
    var mw = probe.measureText(name).width || 1;
    if (mw > 2200) { px = Math.max(24, Math.floor(px * 2200 / mw)); probe.font = fontCss(S.font, px); mw = probe.measureText(name).width; }
    var c = mk(mw + px * 1.6, px * 2.6), x = c.getContext('2d');
    x.font = fontCss(S.font, px); x.fillStyle = '#000'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(name, c.width / 2, c.height / 2);
    var b = alphaBox(c);
    if (!b) return null;
    var o = mk(b.w + 4, b.h + 4);
    o.getContext('2d').drawImage(c, -b.x + 2, -b.y + 2);
    return o;
  }
  function buildStyles() {
    var g = $('#styleGrid'); g.innerHTML = '';
    var name = $('#nameIn').value.trim() || t('sample_name');
    FONTS.forEach(function (f, i) {
      g.appendChild(EDU.el('button', {
        type: 'button', id: 'style-' + i, text: name, 'aria-pressed': String(S.font === i), 'aria-label': t('style_n', { n: i + 1 }),
        style: { fontFamily: f.fam, fontStyle: f.style, fontWeight: f.weight },
        onclick: function () { S.font = i; save(); buildStyles(); refresh(); }
      }));
    });
  }
  $('#nameIn').addEventListener('input', function () { buildStyles(); refresh(); });

  /* ------------------------------------------------ compose + export */
  function currentMask() {
    if (S.mode === 'draw') return maskFromStrokes();
    if (S.mode === 'photo') return maskFromPhoto();
    return maskFromText();
  }
  /* good-quality shrink: halve until close, then one final step */
  function shrink(src, w, h) {
    var c = src;
    while (c.width / 2 > w && c.height / 2 > h) {
      var n = mk(c.width / 2, c.height / 2), nx = n.getContext('2d');
      nx.imageSmoothingQuality = 'high'; nx.drawImage(c, 0, 0, n.width, n.height); c = n;
    }
    return c;
  }
  function targetSize(mask) {
    var tw = num(S.tw, 20, 4000), th = num(S.th, 20, 4000);
    var k = Math.min(1, 1000 / Math.max(mask.width, mask.height));
    var mw = mask.width * k, mh = mask.height * k, padN = Math.round(Math.max(mw, mh) * 0.05) + 2;
    var nw = Math.round(mw + padN * 2), nh = Math.round(mh + padN * 2);
    if (!tw && !th) return { w: nw, h: nh };
    if (tw && th) return { w: tw, h: th };
    if (tw) return { w: tw, h: Math.max(8, Math.round(tw * nh / nw)) };
    return { w: Math.max(8, Math.round(th * nw / nh)), h: th };
  }
  function compose(mask, w, h, white) {
    var tint = mk(mask.width, mask.height), tx = tint.getContext('2d');
    tx.drawImage(mask, 0, 0);
    tx.globalCompositeOperation = 'source-in'; tx.fillStyle = INKS[S.ink]; tx.fillRect(0, 0, tint.width, tint.height);
    var c = mk(w, h), x = c.getContext('2d');
    if (white) { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); }
    var k = Math.min(w * 0.92 / tint.width, h * 0.88 / tint.height);
    var dw = Math.max(1, tint.width * k), dh = Math.max(1, tint.height * k);
    var small = shrink(tint, dw, dh);
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.drawImage(small, (w - dw) / 2, (h - dh) / 2, dw, dh);
    return c;
  }
  function toBlob(c, type, q) { return new Promise(function (res) { c.toBlob(res, type, q); }); }

  /* PNG: shrink in steps until under the KB limit. JPG: lower the quality first, then shrink. */
  function encode(mask, fmt, size, my) {
    var kb = num(S.kb, 1, 5000), limit = kb * 1024;
    var white = fmt === 'jpg' || S.bg === 'white';
    var qs = fmt === 'jpg' ? (kb ? [0.92, 0.85, 0.75, 0.65, 0.5, 0.4] : [0.92]) : [undefined];
    var type = fmt === 'jpg' ? 'image/jpeg' : 'image/png';
    var scale = 1, last = null;
    function step() {
      if (my !== token) return Promise.resolve(null);
      var w = Math.max(8, Math.round(size.w * scale)), h = Math.max(8, Math.round(size.h * scale));
      var c = compose(mask, w, h, white), qi = 0;
      function tryQ() {
        return toBlob(c, type, qs[qi]).then(function (b) {
          if (!b) return last;
          last = { blob: b, w: w, h: h, state: !kb ? 'plain' : (b.size <= limit ? (scale < 1 ? 'shrunk' : 'ok') : 'fail') };
          if (!kb || b.size <= limit) return last;
          qi++;
          if (qi < qs.length) return tryQ();
          if (Math.min(w, h) <= 24 || scale < 0.05) return last;
          scale *= 0.85;
          return step();
        });
      }
      return tryQ();
    }
    return step();
  }

  function kbText(bytes) { return bytes < 10240 ? (Math.round(bytes / 102.4) / 10).toFixed(1) : String(Math.round(bytes / 1024)); }

  function renderLines() {
    var ul = $('#lines'); ul.innerHTML = '';
    var kb = num(S.kb, 1, 5000);
    ['png', 'jpg'].forEach(function (f) {
      var o = out[f]; if (!o) return;
      var li = EDU.el('li', { id: 'line-' + f, dataset: { bytes: o.blob.size, w: o.w, h: o.h, state: o.state } });
      li.appendChild(document.createTextNode(t('file_line', { fmt: f.toUpperCase(), dim: '\u2066' + o.w + ' × ' + o.h + '\u2069', size: '\u2066' + kbText(o.blob.size) + ' KB\u2069' })));
      if (o.state !== 'plain') {
        var key = o.state === 'ok' ? 'kb_ok' : o.state === 'shrunk' ? 'kb_shrunk' : 'kb_fail';
        li.appendChild(document.createTextNode(' '));
        li.appendChild(EDU.el('span', { class: o.state === 'fail' ? 'bad' : 'ok', text: t(key, { kb: kb }) }));
      }
      ul.appendChild(li);
    });
  }
  function renderEmpty() {
    var key = S.mode === 'draw' ? 'empty_draw' : S.mode === 'type' ? 'empty_type' : (photo ? 'err_noink' : 'empty_photo');
    $('#emptyMsg').textContent = t(key);
  }

  function refresh() {
    clearTimeout(timer);
    app.dataset.busy = '1';
    timer = setTimeout(run, 90);
  }
  function run() {
    var my = ++token;
    var mask = null;
    try { mask = currentMask(); } catch (e) { mask = null; }
    var has = !!mask;
    $('#out').hidden = !has; $('#emptyMsg').hidden = has;
    $('#dlPng').disabled = true; $('#dlJpg').disabled = true;
    $('#status').textContent = '';
    if (!has) {
      out = { png: null, jpg: null };
      renderEmpty(); renderLines();
      app.dataset.has = '0'; app.dataset.busy = '0';
      return;
    }
    var size = targetSize(mask);
    var pv = compose(mask, size.w, size.h, S.bg === 'white');
    var o = $('#out'); o.width = pv.width; o.height = pv.height; o.getContext('2d').drawImage(pv, 0, 0);
    encode(mask, 'png', size, my).then(function (p) {
      if (my !== token) return null;
      return encode(mask, 'jpg', size, my).then(function (j) {
        if (my !== token || !p || !j) return;
        out = { png: p, jpg: j };
        renderLines();
        $('#dlPng').disabled = false; $('#dlJpg').disabled = false;
        app.dataset.has = '1'; app.dataset.busy = '0';
      });
    }).catch(function () { if (my === token) { app.dataset.has = '0'; app.dataset.busy = '0'; } });
  }

  function dl(fmt) {
    var o = out[fmt]; if (!o) return;
    var name = 'signature.' + fmt;
    EDU.download(name, o.blob);
    $('#status').textContent = t('saved_msg', { name: name });
  }
  $('#dlPng').addEventListener('click', function () { dl('png'); });
  $('#dlJpg').addEventListener('click', function () { dl('jpg'); });

  /* ------------------------------------------------ controls */
  function syncControls() {
    $$('#modeSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === S.mode)); });
    ['draw', 'photo', 'type'].forEach(function (m) { $('#panel-' + m).hidden = m !== S.mode; });
    $$('#inkChips .chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.ink === S.ink)); });
    $$('#bgSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.bg === S.bg)); });
    $('#pen').value = S.pen;
    $('#tw').value = S.tw; $('#th').value = S.th; $('#kb').value = S.kb;
    if (S.tw || S.th || S.kb) $('#sizeBox').open = true;
  }
  $('#modeSeg').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    S.mode = b.dataset.mode; save(); syncControls();
    if (S.mode === 'draw') drawPad();
    if (S.mode === 'photo') showPhotoUI();
    if (S.mode === 'type') buildStyles();
    refresh();
  });
  $('#inkChips').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    S.ink = b.dataset.ink; save(); syncControls(); drawPad(); refresh();
  });
  $('#bgSeg').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    S.bg = b.dataset.bg; save(); syncControls(); refresh();
  });
  ['tw', 'th', 'kb'].forEach(function (id) {
    $('#' + id).addEventListener('input', function () {
      var n = parseInt(this.value, 10);
      S[id] = isFinite(n) && n > 0 ? String(n) : '';
      save(); refresh();
    });
  });
  $('#resetAll').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    S = Object.assign({}, DEF); save();
    strokes = []; cur = null; photo = null; photoErr = ''; $('#nameIn').value = '';
    $('#sizeBox').open = false;
    syncControls(); drawPad(); showPhotoUI(); buildStyles(); refresh();
  });

  function render() {
    drawPad(); showPhotoUI(); buildStyles(); renderEmpty(); renderLines();
  }
  EDU.onLang(render);
  syncControls();
  render();
  refresh();
  /* the pad has no size until fonts/layout settle on some phones */
  setTimeout(drawPad, 300);
})();
