/* How Computers See: engine (sample pictures, pixel maths, 3 × 3 convolutions, painting helpers).
   Loaded before app.js; exposes window.IPF. Everything runs on the device. */
(function () {
  'use strict';
  var SLUG = 'image-pixels-filters';
  var store = EDU.store(SLUG);
  var $ = EDU.$, t = EDU.t;

  /* ------------------------------------------------------------ constants */
  var RES = [8, 12, 16, 24, 28, 32, 48, 64, 96, 128];
  var SRC = 256;                       // every source picture is a 256 × 256 square
  var SAMPLES = ['smiley', 'house', 'mango', 'shapes', 'flag', 'digit'];
  var SAMPLE_SEL = { smiley: [0.33, 0.41], house: [0.6, 0.47], mango: [0.2, 0.55], shapes: [0.44, 0.25], flag: [0.3, 0.39], digit: [0.5, 0.23] };
  var GX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];      // Sobel: change from left to right
  var GY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];      // Sobel: change from top to bottom
  var OUTLINE = [-1, -1, -1, -1, 8, -1, -1, -1, -1];
  var FILTERS = {
    identity: { k: [0, 0, 0, 0, 1, 0, 0, 0, 0], div: 1, post: 'clamp' },
    blur: { k: [1, 1, 1, 1, 1, 1, 1, 1, 1], div: 9, post: 'clamp' },
    sharpen: { k: [0, -1, 0, -1, 5, -1, 0, -1, 0], div: 1, post: 'clamp' },
    edge_h: { k: GY, div: 1, post: 'abs' },
    edge_v: { k: GX, div: 1, post: 'abs' },
    sobel: { k: null, div: 1, post: 'mag' },
    emboss: { k: [-2, -1, 0, -1, 1, 1, 0, 1, 2], div: 1, post: 'clamp' },
    outline: { k: OUTLINE, div: 1, post: 'clamp' }
  };
  var F_ORDER = ['identity', 'blur', 'sharpen', 'edge_h', 'edge_v', 'sobel', 'emboss', 'outline', 'custom'];
  var G_POOL = ['blur', 'sharpen', 'edge_h', 'edge_v', 'sobel', 'emboss', 'outline'];
  var FMAPS = [
    { id: 'v', k: GX }, { id: 'h', k: GY },
    { id: 'd1', k: [0, 1, 2, -1, 0, 1, -2, -1, 0] }, { id: 'd2', k: [2, 1, 0, 1, 0, -1, 0, -1, -2] },
    { id: 'spot', k: OUTLINE }, { id: 'all', k: null }
  ];
  var TABS = ['pixels', 'filters', 'cnn', 'game'];
  var CHS = ['rgb', 'grey', 'r', 'g', 'b'];

  /* ------------------------------------------------------------ state */
  function defaults() {
    return { sample: 'smiley', resI: 5, tab: 'pixels', ch: 'rgb', grid: false, nums: false, filter: 'edge_v', mode: 'grey',
      custom: { k: [0, 0, 0, 0, 1, 0, 0, 0, 0], div: 1, abs: false }, act: 'relu', pool: false, sel: null };
  }
  function load() {
    var d = defaults(), s = store.get('state', null);
    if (!s || typeof s !== 'object') return d;
    if (SAMPLES.indexOf(s.sample) >= 0) d.sample = s.sample;
    if (typeof s.resI === 'number' && s.resI >= 0 && s.resI < RES.length) d.resI = Math.floor(s.resI);
    if (TABS.indexOf(s.tab) >= 0) d.tab = s.tab;
    if (CHS.indexOf(s.ch) >= 0) d.ch = s.ch;
    d.grid = !!s.grid; d.nums = !!s.nums; d.pool = !!s.pool;
    if (F_ORDER.indexOf(s.filter) >= 0) d.filter = s.filter;
    if (s.mode === 'rgb' || s.mode === 'grey') d.mode = s.mode;
    if (s.act === 'relu' || s.act === 'abs') d.act = s.act;
    if (s.custom && Array.isArray(s.custom.k) && s.custom.k.length === 9) {
      d.custom.k = s.custom.k.map(function (v) { v = Number(v); return isFinite(v) ? EDU.clamp(v, -999, 999) : 0; });
      var dv = Number(s.custom.div); d.custom.div = isFinite(dv) && dv !== 0 ? dv : 1;
      d.custom.abs = !!s.custom.abs;
    }
    if (Array.isArray(s.sel) && s.sel.length === 2 && s.sel.every(function (v) { return typeof v === 'number' && v >= 0 && v < 1; })) d.sel = s.sel;
    return d;
  }
  var S = load();
  var saveTimer = 0;
  function save() { clearTimeout(saveTimer); saveTimer = setTimeout(function () { store.set('state', S); }, 150); }

  /* ------------------------------------------------------------ sample pictures (drawn, no files) */
  function circle(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); }
  var DRAW = {
    smiley: function (c) {
      c.fillStyle = '#bfe3f5'; c.fillRect(0, 0, SRC, SRC);
      circle(c, 128, 132, 98); c.fillStyle = '#ffd23f'; c.fill(); c.lineWidth = 8; c.strokeStyle = '#3b2a00'; c.stroke();
      c.fillStyle = '#3b2a00';
      c.beginPath(); c.ellipse(94, 104, 13, 20, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(162, 104, 13, 20, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(240, 90, 90, 0.45)'; circle(c, 74, 152, 14); c.fill(); circle(c, 182, 152, 14); c.fill();
      c.beginPath(); c.arc(128, 138, 56, 0.15 * Math.PI, 0.85 * Math.PI); c.lineWidth = 10; c.lineCap = 'round'; c.strokeStyle = '#3b2a00'; c.stroke();
    },
    house: function (c) {
      c.fillStyle = '#9fd3f0'; c.fillRect(0, 0, SRC, SRC);
      c.fillStyle = '#5aa845'; c.fillRect(0, 202, SRC, 54);
      circle(c, 214, 46, 24); c.fillStyle = '#ffcc33'; c.fill();
      c.fillStyle = '#c9a66b'; c.beginPath(); c.moveTo(112, 204); c.lineTo(144, 204); c.lineTo(162, 256); c.lineTo(94, 256); c.closePath(); c.fill();
      c.fillStyle = '#f3d9a4'; c.fillRect(58, 120, 140, 84); c.lineWidth = 4; c.strokeStyle = '#7a4b1e'; c.strokeRect(58, 120, 140, 84);
      c.beginPath(); c.moveTo(42, 124); c.lineTo(128, 52); c.lineTo(214, 124); c.closePath(); c.fillStyle = '#c0392b'; c.fill(); c.lineJoin = 'round'; c.strokeStyle = '#7a1f16'; c.stroke();
      c.fillStyle = '#7a4b1e'; c.fillRect(112, 152, 32, 52);
      circle(c, 138, 180, 3); c.fillStyle = '#ffcc33'; c.fill();
      [72, 156].forEach(function (x) {
        c.fillStyle = '#5dade2'; c.fillRect(x, 140, 28, 26);
        c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 14, 140); c.lineTo(x + 14, 166); c.moveTo(x, 153); c.lineTo(x + 28, 153); c.stroke();
        c.strokeStyle = '#7a4b1e'; c.lineWidth = 2; c.strokeRect(x, 140, 28, 26);
      });
    },
    mango: function (c) {
      c.fillStyle = '#fff6e0'; c.fillRect(0, 0, SRC, SRC);
      c.save(); c.translate(128, 142); c.rotate(0.5);
      var g = c.createRadialGradient(-22, -30, 8, 0, 0, 100);
      g.addColorStop(0, '#ffe066'); g.addColorStop(0.55, '#fab005'); g.addColorStop(1, '#e8590c');
      c.beginPath(); c.ellipse(0, 0, 72, 94, 0, 0, Math.PI * 2); c.fillStyle = g; c.fill();
      c.restore();
      c.strokeStyle = '#6b4423'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(170, 62); c.lineTo(178, 36); c.stroke();
      c.save(); c.translate(206, 42); c.rotate(-0.35);
      c.beginPath(); c.ellipse(0, 0, 34, 13, 0, 0, Math.PI * 2); c.fillStyle = '#2f9e44'; c.fill();
      c.strokeStyle = '#1b5e20'; c.lineWidth = 2; c.beginPath(); c.moveTo(-28, 0); c.lineTo(28, 0); c.stroke();
      c.restore();
    },
    shapes: function (c) {
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, SRC, SRC);
      c.fillStyle = '#111111'; c.fillRect(24, 24, 88, 88);
      circle(c, 186, 68, 46); c.fillStyle = '#e03131'; c.fill();
      c.beginPath(); c.moveTo(28, 230); c.lineTo(78, 138); c.lineTo(128, 230); c.closePath(); c.fillStyle = '#1971c2'; c.fill();
      c.save(); c.translate(190, 186); c.rotate(Math.PI / 4); c.fillStyle = '#2b8a3e'; c.fillRect(-36, -36, 72, 72); c.restore();
    },
    flag: function (c) {
      var h = 160 / 3, i, a;
      c.fillStyle = '#dfeaf2'; c.fillRect(0, 0, SRC, SRC);
      c.fillStyle = '#FF9933'; c.fillRect(8, 48, 240, h);
      c.fillStyle = '#FFFFFF'; c.fillRect(8, 48 + h, 240, h);
      c.fillStyle = '#138808'; c.fillRect(8, 48 + 2 * h, 240, h);
      c.strokeStyle = '#9aa7ad'; c.lineWidth = 1; c.strokeRect(8, 48, 240, 160);
      c.strokeStyle = '#000080'; c.fillStyle = '#000080';
      circle(c, 128, 128, 20); c.lineWidth = 2.5; c.stroke();
      circle(c, 128, 128, 3.5); c.fill();
      c.lineWidth = 1.2; c.beginPath();
      for (i = 0; i < 24; i++) { a = i * Math.PI / 12; c.moveTo(128, 128); c.lineTo(128 + 19 * Math.cos(a), 128 + 19 * Math.sin(a)); }
      c.stroke();
    },
    digit: function (c) {
      c.fillStyle = '#000000'; c.fillRect(0, 0, SRC, SRC);
      c.strokeStyle = '#ffffff'; c.lineWidth = 34; c.lineCap = 'round'; c.lineJoin = 'round';      // thick like MNIST digits
      c.beginPath(); c.moveTo(62, 62); c.lineTo(194, 56); c.quadraticCurveTo(150, 130, 120, 210); c.stroke();
    }
  };
  var sampleCanvas = {};
  SAMPLES.forEach(function (name) {
    var cv = document.createElement('canvas'); cv.width = cv.height = SRC;
    DRAW[name](cv.getContext('2d'));
    sampleCanvas[name] = cv;
  });

  /* ------------------------------------------------------------ the working image (N × N numbers) */
  var src = document.createElement('canvas'); src.width = src.height = SRC;
  var sctx = src.getContext('2d', { willReadFrequently: true });
  var srcKind = 'sample';              // sample | upload | camera
  var srcData = null, srcVersion = 0;
  var N = 0, Rv, Gv, Bv, Yv;

  function grey(r, g, b) { return Math.round(0.299 * r + 0.587 * g + 0.114 * b); }

  /* Shrink the 256 × 256 picture to N × N: each new pixel is the average of the block it covers. */
  function buildWork() {
    N = RES[S.resI];
    var d = srcData, n = N, edges = [], x, y, xx, yy, i;
    for (i = 0; i <= n; i++) edges.push(Math.round(i * SRC / n));
    Rv = new Uint8ClampedArray(n * n); Gv = new Uint8ClampedArray(n * n); Bv = new Uint8ClampedArray(n * n); Yv = new Uint8ClampedArray(n * n);
    for (y = 0; y < n; y++) {
      for (x = 0; x < n; x++) {
        var r = 0, g = 0, b = 0, cnt = 0;
        for (yy = edges[y]; yy < edges[y + 1]; yy++) {
          var row = yy * SRC;
          for (xx = edges[x]; xx < edges[x + 1]; xx++) {
            var p = (row + xx) * 4;
            r += d[p]; g += d[p + 1]; b += d[p + 2]; cnt++;
          }
        }
        i = y * n + x;
        Rv[i] = Math.round(r / cnt); Gv[i] = Math.round(g / cnt); Bv[i] = Math.round(b / cnt);
        Yv[i] = grey(Rv[i], Gv[i], Bv[i]);
      }
    }
    cache = {};
  }

  /* ------------------------------------------------------------ filters (3 × 3 convolution) */
  var cache = {};
  function idx(x, y) { return EDU.clamp(y, 0, N - 1) * N + EDU.clamp(x, 0, N - 1); }   // border: copy the nearest edge pixel
  function neigh(arr, x, y, r) {
    var out = [], i, j;
    for (j = -r; j <= r; j++) for (i = -r; i <= r; i++) out.push(arr[idx(x + i, y + j)]);
    return out;
  }
  function conv(arr, k) {
    var out = new Float64Array(N * N), x, y, i, j, s;
    for (y = 0; y < N; y++) {
      for (x = 0; x < N; x++) {
        s = 0;
        for (j = -1; j <= 1; j++) {
          var yy = EDU.clamp(y + j, 0, N - 1) * N;
          for (i = -1; i <= 1; i++) s += arr[yy + EDU.clamp(x + i, 0, N - 1)] * k[(j + 1) * 3 + i + 1];
        }
        out[y * N + x] = s;
      }
    }
    return out;
  }
  function finish(v, post) {
    if (post === 'abs') v = Math.abs(v);
    v = Math.round(v);
    return v < 0 ? 0 : v > 255 ? 255 : v;
  }
  function num(v) { v = Number(v); return isFinite(v) ? v : 0; }
  function spec(id) {
    if (id === 'custom') {
      var dv = num(S.custom.div);
      return { k: S.custom.k.map(num), div: dv === 0 ? 1 : dv, post: S.custom.abs ? 'abs' : 'clamp', badDiv: dv === 0 };
    }
    return FILTERS[id];
  }
  function applyFilter(id, arr) {
    var f = spec(id), o = new Uint8ClampedArray(N * N), i;
    if (f.post === 'mag') {
      var gx = conv(arr, GX), gy = conv(arr, GY);
      for (i = 0; i < o.length; i++) o[i] = Math.min(255, Math.round(Math.sqrt(gx[i] * gx[i] + gy[i] * gy[i])));
      return o;
    }
    var r = conv(arr, f.k);
    for (i = 0; i < o.length; i++) o[i] = finish(r[i] / f.div, f.post);
    return o;
  }
  /* Output arrays for a filter in the chosen mode: [grey] or [R, G, B]. */
  function filtered(id, mode) {
    var key = id + '|' + mode + '|' + N + '|' + srcVersion + (id === 'custom' ? '|' + JSON.stringify(S.custom) : '');
    if (!cache[key]) cache[key] = mode === 'rgb' ? [applyFilter(id, Rv), applyFilter(id, Gv), applyFilter(id, Bv)] : [applyFilter(id, Yv)];
    return cache[key];
  }

  /* ------------------------------------------------------------ painting helpers */
  var off = document.createElement('canvas');
  function makeImg(n, r, g, b) {
    var img = new ImageData(n, n), d = img.data, i, p;
    g = g || r; b = b || r;
    for (i = 0; i < n * n; i++) { p = i * 4; d[p] = r[i]; d[p + 1] = g[i]; d[p + 2] = b[i]; d[p + 3] = 255; }
    return img;
  }
  function paint(cv, img, n, target) {
    var k = Math.max(1, Math.ceil((target || 512) / n)), size = n * k;
    if (cv.width !== size) { cv.width = size; cv.height = size; }
    off.width = n; off.height = n; off.getContext('2d').putImageData(img, 0, 0);
    var c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, size, size);
    c.drawImage(off, 0, 0, size, size);
    var shown = cv.clientWidth || size;                 // backing pixels per CSS pixel, so lines stay crisp
    return { c: c, k: k, size: size, n: n, px: Math.max(1, size / shown) };
  }
  function gridLines(p) {
    if (p.k / p.px < 6) return;                        // cells under 6 CSS px: lines would hide the picture
    var c = p.c, i, lw = Math.max(1, Math.round(p.px));
    c.save(); c.strokeStyle = 'rgba(128, 128, 128, 0.55)'; c.lineWidth = lw; c.beginPath();
    for (i = 1; i < p.n; i++) { c.moveTo(i * p.k, 0); c.lineTo(i * p.k, p.size); c.moveTo(0, i * p.k); c.lineTo(p.size, i * p.k); }
    c.stroke(); c.restore();
  }
  function box(p, x, y, w, h, dashed) {
    var c = p.c, lw = Math.max(2 * p.px, Math.round(p.k * 0.12));
    c.save();
    if (dashed) c.setLineDash([Math.max(4, p.k * 0.4), Math.max(3, p.k * 0.25)]);
    c.lineWidth = lw + 2; c.strokeStyle = 'rgba(0, 0, 0, 0.7)'; c.strokeRect(x * p.k, y * p.k, w * p.k, h * p.k);
    c.lineWidth = lw; c.strokeStyle = EDU.css('--accent') || '#d9501c'; c.strokeRect(x * p.k, y * p.k, w * p.k, h * p.k);
    c.restore();
  }
  function ink(v) { return v > 140 ? '#000000' : '#ffffff'; }

  /* ------------------------------------------------------------ selection */
  function sel() {
    var f = S.sel || SAMPLE_SEL[S.sample] || [0.5, 0.5];
    if (srcKind !== 'sample' && !S.sel) f = [0.5, 0.5];
    return { x: Math.min(N - 1, Math.floor(f[0] * N)), y: Math.min(N - 1, Math.floor(f[1] * N)) };
  }
  function setSel(x, y, keep) {
    x = EDU.clamp(x, 0, N - 1); y = EDU.clamp(y, 0, N - 1);
    S.sel = [(x + 0.5) / N, (y + 0.5) / N];
    if (!keep) save();
  }

  /* number formatting for the maths (minus sign, at most 2 decimals) */
  function fn(v) {
    var s = Number.isInteger(v) ? String(Math.abs(v)) : Math.abs(v).toFixed(2).replace(/\.?0+$/, '');
    return (v < 0 && s !== '0' ? '−' : '') + s;
  }

  window.IPF = {
    RES: RES, FILTERS: FILTERS, GX: GX, GY: GY, DRAW: DRAW, sampleCanvas: sampleCanvas, src: src, sctx: sctx,
    S: function () { return S; }, save: save, defaults: defaults, load: load,
    buildWork: buildWork, conv: conv, finish: finish, spec: spec, applyFilter: applyFilter, filtered: filtered,
    makeImg: makeImg, paint: paint, gridLines: gridLines, box: box, ink: ink, sel: sel, setSel: setSel, fn: fn, neigh: neigh, grey: grey, num: num,
    get N() { return N; }, get Rv() { return Rv; }, get Gv() { return Gv; }, get Bv() { return Bv; }, get Yv() { return Yv; },
    get srcKind() { return srcKind; }, set srcKind(v) { srcKind = v; },
    newSource: function () { srcData = sctx.getImageData(0, 0, SRC, SRC).data; srcVersion++; buildWork(); },
    SAMPLES: SAMPLES, F_ORDER: F_ORDER, G_POOL: G_POOL, FMAPS: FMAPS, TABS: TABS, SRC: SRC,
    setState: function (s) { S = s; }
  };
})();
