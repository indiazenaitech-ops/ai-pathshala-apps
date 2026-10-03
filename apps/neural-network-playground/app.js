/* Neural Network Playground: a tiny neural network (nn.js) learns to separate
   orange and blue points. Everything runs on this device. */
(function () {
  'use strict';
  var SLUG = 'neural-network-playground';
  var store = EDU.store(SLUG);
  var $ = EDU.$, el = EDU.el, t = EDU.t;

  EDU.init({ slug: SLUG, title: 'app_title', wide: true });

  /* ------------------------------------------------------------ settings */
  var DATASETS = ['blobs', 'circle', 'xor', 'spiral', 'draw'];
  var ACTS = ['relu', 'tanh', 'sigmoid', 'linear'];
  var LRS = [0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1, 3];
  var SPEEDS = ['slow', 'normal', 'fast'];
  var TOOLS = ['orange', 'blue', 'erase'];
  var FEAT_IDS = NN.FEATURES.map(function (f) { return f.id; });
  var N_POINTS = 400, BATCH = 10, GRID = 50, MAX_DRAW = 300, MAX_LAYERS = 3, MAX_NEURONS = 8, R = NN.RANGE;
  var DEFAULTS = { ds: 'circle', noise: 0, split: 50, feats: ['x1', 'x2'], layers: [4, 2], act: 'tanh', lr: 0.03, speed: 'normal', showTest: false, sharp: false, seed: 1, tool: 'orange', draw: [] };
  /* the six guided challenges (texts live in content.js) */
  var PRESETS = [
    { ds: 'xor', layers: [], act: 'tanh', lr: 0.03, feats: ['x1', 'x2'], noise: 0, split: 50, speed: 'normal' },
    { ds: 'xor', layers: [4], act: 'tanh', lr: 0.03, feats: ['x1', 'x2'], noise: 0, split: 50, speed: 'normal' },
    { ds: 'circle', layers: [], act: 'tanh', lr: 0.03, feats: ['x1sq', 'x2sq'], noise: 0, split: 50, speed: 'normal' },
    { ds: 'spiral', layers: [8, 8, 8], act: 'relu', lr: 0.03, feats: ['x1', 'x2'], noise: 0, split: 50, speed: 'fast' },
    { ds: 'xor', layers: [8, 8, 8], act: 'relu', lr: 0.03, feats: ['x1', 'x2'], noise: 50, split: 10, speed: 'fast', showTest: true },
    { ds: 'circle', layers: [4, 2], act: 'tanh', lr: 3, feats: ['x1', 'x2'], noise: 0, split: 50, speed: 'normal' }
  ];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function num(v, d) { v = Number(v); return isFinite(v) ? v : d; }
  function sanitize(c) {
    c = (c && typeof c === 'object') ? c : {};
    var o = clone(DEFAULTS);
    if (DATASETS.indexOf(c.ds) >= 0) o.ds = c.ds;
    o.noise = Math.round(EDU.clamp(num(c.noise, 0), 0, 50) / 5) * 5;
    o.split = Math.round(EDU.clamp(num(c.split, 50), 10, 90) / 10) * 10;
    if (Array.isArray(c.feats)) {
      var f = FEAT_IDS.filter(function (id) { return c.feats.indexOf(id) >= 0; });
      if (f.length) o.feats = f;
    }
    if (Array.isArray(c.layers)) o.layers = c.layers.slice(0, MAX_LAYERS).map(function (n) { return Math.round(EDU.clamp(num(n, 4), 1, MAX_NEURONS)); });
    if (ACTS.indexOf(c.act) >= 0) o.act = c.act;
    if (c.lr !== undefined) {
      var lr = num(c.lr, 0.03), best = LRS[3];
      LRS.forEach(function (x) { if (Math.abs(Math.log(x / lr)) < Math.abs(Math.log(best / lr))) best = x; });
      o.lr = lr > 0 ? best : 0.03;
    }
    if (SPEEDS.indexOf(c.speed) >= 0) o.speed = c.speed;
    o.showTest = !!c.showTest; o.sharp = !!c.sharp;
    o.seed = Math.max(1, Math.round(num(c.seed, 1))) % 100000 || 1;
    if (TOOLS.indexOf(c.tool) >= 0) o.tool = c.tool;
    if (Array.isArray(c.draw)) {
      o.draw = c.draw.filter(function (p) {
        return Array.isArray(p) && p.length === 3 && isFinite(p[0]) && isFinite(p[1]) && Math.abs(p[0]) <= R && Math.abs(p[1]) <= R && (p[2] === 1 || p[2] === -1);
      }).slice(0, MAX_DRAW).map(function (p) { return [Number(p[0]), Number(p[1]), p[2]]; });
    }
    return o;
  }

  function loadCfg() {
    try {
      var u = new URL(location.href), s = u.searchParams.get('setup');
      if (s) {
        var shared = EDU.unpack(s);
        u.searchParams.delete('setup');
        history.replaceState(history.state, '', u.toString());
        if (shared) return sanitize(shared);
      }
    } catch (e) { /* ignore bad links */ }
    return sanitize(store.get('cfg', null));
  }
  var cfg = loadCfg();
  function save() { store.set('cfg', cfg); }

  /* ------------------------------------------------------------ model state */
  var D = { all: [], train: [], test: [], fns: [], Xtr: [], Ytr: [], Xte: [], Yte: [] };
  var net = null, epoch = 0, playing = false, broken = false, wseed = 1, trainRng = null;
  var ev = { tr: { loss: NaN, acc: NaN, n: 0 }, te: { loss: NaN, acc: NaN, n: 0 } };
  var hist = [], histStep = 1;
  var gridOut = new Float32Array(GRID * GRID), nodeGrids = [];
  var preview = null, hoverPreview = null;   // {l, i}
  var frameNo = 0, rafId = 0;

  function buildData() {
    if (cfg.ds === 'draw') {
      D.all = cfg.draw.map(function (p) { return { x: p[0], y: p[1], label: p[2] }; });
      D.train = D.all; D.test = [];
    } else {
      D.all = NN.genData(cfg.ds, N_POINTS, cfg.noise / 100, cfg.seed);
      var nTr = Math.round(D.all.length * cfg.split / 100);
      D.train = D.all.slice(0, nTr); D.test = D.all.slice(nTr);
    }
    buildFeatures();
  }
  function buildFeatures() {
    D.fns = NN.featureFns(cfg.feats);
    var mk = function (p) { return NN.makeInput(D.fns, p.x, p.y); }, lb = function (p) { return p.label; };
    D.Xtr = D.train.map(mk); D.Ytr = D.train.map(lb);
    D.Xte = D.test.map(mk); D.Yte = D.test.map(lb);
  }
  function evaluate() {
    ev.tr = net.evaluate(D.Xtr, D.Ytr);
    ev.te = net.evaluate(D.Xte, D.Yte);
    if (ev.tr.n && !isFinite(ev.tr.loss)) broken = true;
  }
  function pushHist() {
    hist.push([epoch, ev.tr.loss, ev.te.loss]);
    if (hist.length > 400) { hist = hist.filter(function (h, i) { return i % 2 === 0; }); histStep *= 2; }
  }
  function newNet() {
    net = new NN.Net([D.fns.length].concat(cfg.layers, [1]), cfg.act, wseed * 7919 + 13);
    trainRng = NN.rng(wseed * 31 + 5);
    epoch = 0; hist = []; histStep = 1; broken = false; preview = null; hoverPreview = null;
    evaluate(); pushHist();
  }
  function trainOne() {
    if (broken || !D.Xtr.length) return false;
    net.trainEpoch(D.Xtr, D.Ytr, cfg.lr, BATCH, trainRng);
    epoch++;
    if (net.isBroken()) broken = true;
    else evaluate();
    if (broken) { setPlaying(false); return false; }
    if (epoch % histStep === 0) pushHist();
    return true;
  }

  /* ------------------------------------------------------------ colours */
  var COL = {};
  function parseColor(s) {
    s = String(s || '').trim();
    var m;
    if (s[0] === '#') {
      if (s.length === 4) s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
      var n = parseInt(s.slice(1, 7), 16);
      if (isFinite(n)) return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    } else if ((m = s.match(/rgba?\(([^)]+)\)/))) {
      var p = m[1].split(/[ ,/]+/).map(Number);
      if (p.length >= 3) return [p[0], p[1], p[2]];
    }
    return [128, 128, 128];
  }
  function readColors() {
    ['--c2', '--c7', '--surface', '--surface-2', '--text', '--muted', '--border', '--c1', '--c5', '--accent'].forEach(function (k) { COL[k] = EDU.css(k) || '#888'; });
    COL.orange = parseColor(COL['--c2']); COL.blue = parseColor(COL['--c7']); COL.bg = parseColor(COL['--surface']);
    COL.k = EDU.theme() === 'dark' ? 0.85 : 0.72;          /* dark surfaces need stronger tints */
  }
  function rgb(c) { return 'rgb(' + c.join(',') + ')'; }

  /* value v in [-1, 1] → pixel (orange for negative, blue for positive) */
  function paint(img, vals, mul, add, norm, sharp) {
    var d = img.data, s = COL.bg, o = COL.orange, b = COL.blue;
    for (var k = 0; k < vals.length; k++) {
      var v = (vals[k] * mul + add) / norm;
      if (!(v === v)) v = 0;
      if (v > 1) v = 1; else if (v < -1) v = -1;
      var c = v < 0 ? o : b, a = sharp ? (v === 0 ? 0 : 0.6) : Math.abs(v) * COL.k;
      var q = k * 4;
      d[q] = s[0] + (c[0] - s[0]) * a; d[q + 1] = s[1] + (c[1] - s[1]) * a; d[q + 2] = s[2] + (c[2] - s[2]) * a; d[q + 3] = 255;
    }
  }

  /* ------------------------------------------------------------ grid of guesses */
  function computeGrid() {
    var sizes = net.sizes, L = sizes.length, l, j;
    if (nodeGrids.length !== L || nodeGrids.some(function (g, i) { return g.length !== sizes[i]; })) {
      nodeGrids = sizes.map(function (n) { var a = []; for (var i = 0; i < n; i++) a.push(new Float32Array(GRID * GRID)); return a; });
    }
    var inp = new Float64Array(D.fns.length), A = net.A;
    for (var gy = 0; gy < GRID; gy++) {
      var y = R - (gy + 0.5) * 2 * R / GRID;
      for (var gx = 0; gx < GRID; gx++) {
        var x = -R + (gx + 0.5) * 2 * R / GRID, k = gy * GRID + gx;
        NN.makeInput(D.fns, x, y, inp);
        gridOut[k] = net.forward(inp);
        for (l = 0; l < L; l++) { var row = A[l], g = nodeGrids[l]; for (j = 0; j < row.length; j++) g[j][k] = row[j]; }
      }
    }
  }
  /* how to colour one neuron's picture */
  function nodeView(l, i) {
    var vals = nodeGrids[l] && nodeGrids[l][i];
    if (!vals) return null;
    var last = l === net.sizes.length - 1;
    if (last || (l > 0 && net.act === 'tanh')) return { vals: vals, mul: 1, add: 0, norm: 1 };
    if (l > 0 && net.act === 'sigmoid') return { vals: vals, mul: 2, add: -1, norm: 1 };
    var m = 1e-9;
    for (var k = 0; k < vals.length; k++) { var a = Math.abs(vals[k]); if (a > m) m = a; }
    return { vals: vals, mul: 1, add: 0, norm: m };
  }

  /* ------------------------------------------------------------ output canvas */
  var outCv = $('#out'), outCtx = outCv.getContext('2d');
  var off = document.createElement('canvas'); off.width = off.height = GRID;
  var offCtx = off.getContext('2d'), offImg = offCtx.createImageData(GRID, GRID);
  function sx(x, px) { return (x + R) / (2 * R) * px; }
  function sy(y, px) { return (R - y) / (2 * R) * px; }

  function drawOutput() {
    var css = outCv.clientWidth || 400, dpr = Math.min(2, window.devicePixelRatio || 1), px = Math.max(100, Math.round(css * dpr));
    if (outCv.width !== px) { outCv.width = px; outCv.height = px; }
    var ctx = outCtx, p = hoverPreview || preview;
    if (p && p.l >= net.sizes.length - 1) p = null;
    var view = p ? nodeView(p.l, p.i) : null;
    if (!view) view = { vals: gridOut, mul: 1, add: 0, norm: 1 };
    paint(offImg, view.vals, view.mul, view.add, view.norm, cfg.sharp && !p);
    offCtx.putImageData(offImg, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, 0, 0, px, px);
    // axes
    ctx.strokeStyle = COL['--border']; ctx.lineWidth = Math.max(1, dpr);
    ctx.beginPath(); ctx.moveTo(px / 2, 0); ctx.lineTo(px / 2, px); ctx.moveTo(0, px / 2); ctx.lineTo(px, px / 2); ctx.stroke();
    ctx.fillStyle = COL['--muted']; ctx.font = (11 * dpr) + 'px system-ui, sans-serif';
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText('x₁', px - 4 * dpr, px / 2 - 2 * dpr);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('x₂', px / 2 + 4 * dpr, 4 * dpr);
    // points
    var r = Math.max(2.6, css / 110) * dpr;
    function dot(pt, hollow) {
      var X = sx(pt.x, px), Y = sy(pt.y, px);
      if (X < -r || Y < -r || X > px + r || Y > px + r) return;
      ctx.beginPath(); ctx.arc(X, Y, r, 0, Math.PI * 2);
      var c = rgb(pt.label > 0 ? COL.blue : COL.orange);
      if (hollow) { ctx.fillStyle = COL['--surface']; ctx.fill(); ctx.lineWidth = 1.6 * dpr; ctx.strokeStyle = c; ctx.stroke(); }
      else { ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 1 * dpr; ctx.strokeStyle = COL['--surface']; ctx.stroke(); }
    }
    D.train.forEach(function (pt) { dot(pt, false); });
    if (cfg.showTest) D.test.forEach(function (pt) { dot(pt, true); });
    if (cfg.ds === 'draw' && !D.train.length) {
      ctx.fillStyle = COL['--text']; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '600 ' + (16 * dpr) + 'px ' + getComputedStyle(document.body).fontFamily;
      ctx.fillText('✏ ' + t('canvas_empty'), px / 2, px / 2 - 24 * dpr);
    }
  }

  /* ------------------------------------------------------------ loss chart */
  var chartCv = $('#chart'), chartCtx = chartCv.getContext('2d');
  function niceMax(v) {
    var steps = [0.1, 0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.6, 2, 3, 4, 6, 10];
    for (var i = 0; i < steps.length; i++) if (v <= steps[i]) return steps[i];
    return Math.ceil(v);
  }
  function drawChart() {
    var css = chartCv.clientWidth || 300, H = 120, dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = Math.round(css * dpr), Hp = Math.round(H * dpr);
    if (chartCv.width !== W || chartCv.height !== Hp) { chartCv.width = W; chartCv.height = Hp; }
    var ctx = chartCtx; ctx.clearRect(0, 0, W, Hp);
    var pts = hist.slice();
    if (!pts.length || pts[pts.length - 1][0] !== epoch) pts.push([epoch, ev.tr.loss, ev.te.loss]);
    var maxL = 0.05;
    pts.forEach(function (h) { if (isFinite(h[1])) maxL = Math.max(maxL, h[1]); if (isFinite(h[2])) maxL = Math.max(maxL, h[2]); });
    var yMax = niceMax(maxL * 1.05), padL = 34 * dpr, padB = 16 * dpr, padT = 6 * dpr, padR = 6 * dpr;
    var gw = W - padL - padR, gh = Hp - padT - padB, maxE = Math.max(1, epoch);
    var X = function (e) { return padL + e / maxE * gw; }, Y = function (v) { return padT + gh - Math.min(v, yMax) / yMax * gh; };
    ctx.font = (10 * dpr) + 'px system-ui, sans-serif'; ctx.fillStyle = COL['--muted'];
    ctx.strokeStyle = COL['--border']; ctx.lineWidth = 1 * dpr;
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    [0, yMax / 2, yMax].forEach(function (v) {
      ctx.beginPath(); ctx.moveTo(padL, Y(v)); ctx.lineTo(W - padR, Y(v)); ctx.stroke();
      ctx.fillText(EDU.fmt(v, { maximumFractionDigits: 2 }), padL - 4 * dpr, Y(v));
    });
    ctx.textBaseline = 'bottom'; ctx.textAlign = 'left'; ctx.fillText('0', padL, Hp);
    ctx.textAlign = 'right'; ctx.fillText(EDU.fmt(epoch), W - padR, Hp);
    function line(idx, color, dash) {
      ctx.beginPath(); var started = false;
      pts.forEach(function (h) {
        if (!isFinite(h[idx])) { started = false; return; }
        if (!started) { ctx.moveTo(X(h[0]), Y(h[idx])); started = true; } else ctx.lineTo(X(h[0]), Y(h[idx]));
      });
      ctx.strokeStyle = color; ctx.lineWidth = 2.2 * dpr; ctx.setLineDash(dash ? [5 * dpr, 4 * dpr] : []); ctx.stroke(); ctx.setLineDash([]);
    }
    line(1, COL['--c1'], false);
    if (D.test.length) line(2, COL['--c5'], true);
  }

  /* ------------------------------------------------------------ network diagram */
  var netWrap = $('#net-wrap'), SVGNS = 'http://www.w3.org/2000/svg';
  var diag = { links: [], nodes: [], key: '' };
  function svgEl(tag, attrs, parent) {
    var e = document.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(e);
    return e;
  }
  function nodeLabel(l, i) {
    if (l === 0) return t('node_input', { name: D.fns[i].label });
    if (l === net.sizes.length - 1) return t('node_output');
    return t('node_hidden', { n: i + 1, l: l });
  }
  function buildDiagram() {
    var W = Math.round(netWrap.clientWidth || 400);
    var sizes = net.sizes, cols = sizes.length, maxN = Math.max.apply(null, sizes);
    var padL = 56, padR = 8, top = 34;
    var s = Math.round(EDU.clamp(Math.min(48, (W - padL - padR) / (cols * 1.55)), 24, 48));
    var gap = Math.max(8, Math.round(s * 0.3));
    var H = top + maxN * (s + gap) + 6;
    var span = W - padL - padR - s, xs = [];
    for (var c = 0; c < cols; c++) xs.push(padL + s / 2 + (cols > 1 ? c * span / (cols - 1) : 0));
    var pos = sizes.map(function (n, l) {
      var y0 = top + (maxN - n) * (s + gap) / 2;
      var a = []; for (var i = 0; i < n; i++) a.push({ x: xs[l], y: y0 + i * (s + gap) + s / 2 }); return a;
    });
    netWrap.innerHTML = '';
    netWrap.style.height = H + 'px';
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, 'aria-hidden': 'true' }, netWrap);
    var gLinks = svgEl('g', {}, svg);
    diag.links = [];
    for (var l = 1; l < cols; l++) {
      for (var j = 0; j < sizes[l]; j++) {
        for (var i = 0; i < sizes[l - 1]; i++) {
          var a = pos[l - 1][i], b = pos[l][j], x1 = a.x + s / 2, x2 = b.x - s / 2, mx = (x1 + x2) / 2;
          var p = svgEl('path', { d: 'M' + x1 + ' ' + a.y + ' C' + mx + ' ' + a.y + ' ' + mx + ' ' + b.y + ' ' + x2 + ' ' + b.y, class: 'link' }, gLinks);
          diag.links.push({ el: p, l: l, i: i, j: j });
        }
      }
    }
    // column titles, shrunk to fit
    var spacing = cols > 1 ? span / (cols - 1) : W;
    for (c = 0; c < cols; c++) {
      var label = c === 0 ? t('col_inputs') : c === cols - 1 ? t('col_output') : t('col_hidden', { n: c });
      var anchor = c === 0 ? 'start' : c === cols - 1 ? 'end' : 'middle';
      var tx = c === 0 ? 2 : c === cols - 1 ? W - 2 : xs[c];
      var room = c === 0 ? Math.min(spacing, xs[0] + s / 2 + spacing / 2) - 6 : c === cols - 1 ? Math.min(spacing, W - xs[c] + spacing / 2) - 6 : spacing - 6;
      var te = svgEl('text', { x: tx, y: 16, 'text-anchor': anchor, 'font-size': 13 }, svg);
      te.textContent = label;
      try {
        var len = te.getComputedTextLength();
        if (len > room && len > 0) te.setAttribute('font-size', Math.max(8, Math.floor(13 * room / len)));
      } catch (e) { /* not rendered yet */ }
    }
    // feature names next to the input squares
    pos[0].forEach(function (p, i) {
      var fl = svgEl('text', { x: p.x - s / 2 - 5, y: p.y + 4, 'text-anchor': 'end', 'font-size': 14, class: 'feat-lbl' }, svg);
      fl.textContent = D.fns[i].label;
    });
    // node squares: buttons with a tiny canvas (what that neuron "sees")
    diag.nodes = [];
    pos.forEach(function (col, l) {
      col.forEach(function (p, i) {
        var cv = el('canvas', { width: GRID, height: GRID });
        var btn = el('button', {
          class: 'nn-node' + (l === cols - 1 ? ' is-out' : ''), type: 'button', 'aria-label': nodeLabel(l, i), 'aria-pressed': 'false',
          dataset: { l: l, i: i },
          style: { left: (p.x - s / 2) + 'px', top: (p.y - s / 2) + 'px', width: s + 'px', height: s + 'px' }
        }, cv);
        btn.addEventListener('click', function () { togglePreview(l, i); });
        btn.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hoverPreview = { l: l, i: i }; drawOutput(); updatePreviewBar(); } });
        btn.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hoverPreview = null; drawOutput(); updatePreviewBar(); } });
        netWrap.appendChild(btn);
        diag.nodes.push({ btn: btn, ctx: cv.getContext('2d'), img: null, l: l, i: i });
      });
    });
    diag.key = W + '|' + sizes.join(',') + '|' + cfg.feats.join(',') + '|' + EDU.lang;
    updateLinks(); paintNodes(); markPreview();
  }
  function updateLinks() {
    for (var k = 0; k < diag.links.length; k++) {
      var L = diag.links[k], w = net.weight(L.l, L.i, L.j), a = Math.abs(w);
      if (!isFinite(a)) a = 0;
      L.el.setAttribute('class', 'link ' + (w >= 0 ? 'pos' : 'neg'));
      L.el.setAttribute('stroke-width', Math.min(8, 0.6 + a * 2.2).toFixed(2));
      L.el.setAttribute('stroke-opacity', Math.min(1, 0.25 + a * 0.6).toFixed(2));
    }
  }
  function paintNodes() {
    diag.nodes.forEach(function (n) {
      var v = nodeView(n.l, n.i);
      if (!v) return;
      if (!n.img) n.img = n.ctx.createImageData(GRID, GRID);
      paint(n.img, v.vals, v.mul, v.add, v.norm, false);
      n.ctx.putImageData(n.img, 0, 0);
    });
  }
  function markPreview() {
    diag.nodes.forEach(function (n) { n.btn.setAttribute('aria-pressed', preview && preview.l === n.l && preview.i === n.i ? 'true' : 'false'); });
  }
  function togglePreview(l, i) {
    var isOut = l === net.sizes.length - 1;
    preview = (isOut || (preview && preview.l === l && preview.i === i)) ? null : { l: l, i: i };
    markPreview(); drawOutput(); updatePreviewBar();
  }
  /* the formula of one neuron with its current weights and bias */
  var SUBS = '₀₁₂₃₄₅₆₇₈₉';
  function sub(n) { return String(n).split('').map(function (d) { return SUBS[d] || d; }).join(''); }
  function updateInspector() {
    if (!net) return;
    var last = net.sizes.length - 1, p = hoverPreview || preview || { l: last, i: 0 };
    if (p.l > last || p.i >= net.sizes[p.l]) p = { l: last, i: 0 };
    $('#ins-name').textContent = nodeLabel(p.l, p.i);
    if (p.l === 0) {
      $('#ins-formula').textContent = D.fns[p.i].label;
      $('#ins-hint').textContent = t('ins_input');
      return;
    }
    var fname = p.l === last ? 'tanh' : { relu: 'ReLU', tanh: 'tanh', sigmoid: 'sigmoid', linear: '' }[net.act];
    var parts = [], nIn = net.sizes[p.l - 1];
    for (var k = 0; k < nIn; k++) {
      var w = net.weight(p.l, k, p.i), name = p.l === 1 ? D.fns[k].label : 'h' + sub(k + 1);
      parts.push((parts.length ? (w < 0 ? ' − ' : ' + ') : (w < 0 ? '−' : '')) + Math.abs(w).toFixed(2) + '·' + name);
    }
    var b = net.B[p.l - 1][p.i];
    parts.push((b < 0 ? ' − ' : ' + ') + Math.abs(b).toFixed(2));
    var inner = parts.join('');
    $('#ins-formula').textContent = 'y = ' + (fname ? fname + '(' + inner + ')' : inner);
    $('#ins-hint').textContent = t('ins_hint') + (p.l > 1 ? ' ' + t('ins_prev') : '');
  }
  function updatePreviewBar() {
    updateInspector();
    var p = hoverPreview || preview, bar = $('#preview-bar');
    if (!p || !net || p.l >= net.sizes.length - 1) { bar.hidden = true; return; }
    $('#preview-txt').textContent = p.l === 0 ? t('preview_input', { name: D.fns[p.i] ? D.fns[p.i].label : '' }) : t('preview_hidden', { n: p.i + 1, l: p.l });
    bar.hidden = false;
    $('#preview-close').hidden = !preview;
  }
  $('#preview-close').addEventListener('click', function () { preview = null; hoverPreview = null; markPreview(); drawOutput(); updatePreviewBar(); });

  /* ------------------------------------------------------------ stats + coach */
  function fmtLoss(v) { return isFinite(v) ? EDU.fmt(v, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : '–'; }
  function fmtPct(v) { return isFinite(v) ? EDU.fmt(Math.round(v * 100)) + '%' : '–'; }
  function setStat(id, text, value) { var e = $(id); e.textContent = text; e.setAttribute('data-value', value); }
  function updateStats() {
    setStat('#epoch', EDU.fmt(epoch), epoch);
    setStat('#train-loss', fmtLoss(ev.tr.loss), isFinite(ev.tr.loss) ? ev.tr.loss.toFixed(5) : '');
    setStat('#test-loss', fmtLoss(ev.te.loss), isFinite(ev.te.loss) ? ev.te.loss.toFixed(5) : '');
    setStat('#train-acc', fmtPct(ev.tr.acc), isFinite(ev.tr.acc) ? ev.tr.acc.toFixed(4) : '');
    setStat('#test-acc', fmtPct(ev.te.acc), isFinite(ev.te.acc) ? ev.te.acc.toFixed(4) : '');
  }
  var COACH_ICON = { explode: '💥', need_points: '✏️', line: '📏', linear: '📏', overfit: '📚', great: '🎉', great_draw: '🎉', slow: '🐢', stuck: '🤔', training: '🧠', paused: '⏸', start: '💡' };
  function coachCode() {
    if (broken) return 'explode';
    if (cfg.ds === 'draw') {
      var hasO = D.train.some(function (p) { return p.label < 0; }), hasB = D.train.some(function (p) { return p.label > 0; });
      if (!hasO || !hasB) return 'need_points';
    }
    var hard = cfg.ds !== 'blobs';
    var onlyLinearInputs = cfg.feats.every(function (f) { return f === 'x1' || f === 'x2'; });
    if (hard && onlyLinearInputs && epoch >= 100 && ev.tr.acc < 0.9) {
      if (!cfg.layers.length) return 'line';
      if (cfg.act === 'linear') return 'linear';
    }
    if (D.test.length && epoch >= 100 && ev.tr.loss < 0.08 && ev.te.loss > ev.tr.loss + 0.12) return 'overfit';
    var acc = D.test.length ? ev.te.acc : ev.tr.acc;
    if (epoch > 0 && acc >= 0.97) return D.test.length ? 'great' : 'great_draw';
    if (cfg.lr <= 0.003 && epoch >= 150 && ev.tr.loss > 0.25) return 'slow';
    if (epoch >= 500 && ev.tr.acc < 0.8) return 'stuck';
    if (playing) return 'training';
    return epoch === 0 ? 'start' : 'paused';
  }
  var lastCoach = '';
  function updateCoach(force) {
    var code = coachCode(), acc = D.test.length ? ev.te.acc : ev.tr.acc;
    var text = t('coach_' + code, { acc: isFinite(acc) ? EDU.fmt(Math.round(acc * 100)) : '0' });
    var key = code + '|' + text;
    if (key === lastCoach && !force) return;
    lastCoach = key;
    var box = $('#coach');
    box.setAttribute('data-code', code);
    $('#coach-ico').textContent = COACH_ICON[code] || '💡';
    $('#coach-txt').textContent = text;
  }

  /* ------------------------------------------------------------ draw everything */
  function drawAll() {
    if (!net) return;
    computeGrid();
    drawOutput();
    var key = Math.round(netWrap.clientWidth || 400) + '|' + net.sizes.join(',') + '|' + cfg.feats.join(',') + '|' + EDU.lang;
    if (key !== diag.key) buildDiagram(); else { updateLinks(); paintNodes(); }
    drawChart(); updateStats(); updateCoach(); updatePreviewBar();
  }

  function loop() {
    rafId = 0;
    if (!playing) return;
    frameNo++;
    var trained = 0;
    if (cfg.speed === 'slow') { if (frameNo % 6 === 0 && trainOne()) trained = 1; }
    else if (cfg.speed === 'normal') { if (trainOne()) trained = 1; }
    else {
      var t0 = performance.now();
      while (trained < 60 && performance.now() - t0 < 12) { if (!trainOne()) break; trained++; }
    }
    if (trained || broken || frameNo % 15 === 0) {
      computeGrid(); drawOutput();
      if (!playing || frameNo % 2 === 0) updateLinks();
      if (!playing || frameNo % 3 === 0) { paintNodes(); updateInspector(); }
      drawChart(); updateStats(); updateCoach();
    }
    if (playing) rafId = requestAnimationFrame(loop);
  }
  function setPlaying(on) {
    playing = !!on && !broken;
    var b = $('#play');
    b.setAttribute('aria-pressed', playing ? 'true' : 'false');
    $('#play-ico').textContent = playing ? '⏸' : '▶';
    $('#play-lbl').textContent = playing ? t('pause') : t('train');
    if (playing && !rafId) rafId = requestAnimationFrame(loop);
    updateCoach();
  }

  /* ------------------------------------------------------------ controls */
  var dsGrid = $('#ds-grid'), thumbs = {};
  DATASETS.forEach(function (ds) {
    var pic;
    if (ds === 'draw') pic = el('span', { class: 'ds-ico', 'aria-hidden': 'true', text: '✏️' });
    else { pic = el('canvas', { width: 104, height: 104, 'aria-hidden': 'true' }); thumbs[ds] = pic; }
    var b = el('button', { class: 'ds-btn', type: 'button', id: 'ds-' + ds, 'aria-pressed': 'false', onclick: function () { chooseDataset(ds); } },
      pic, el('span', { i18n: 'ds_' + ds }));
    dsGrid.appendChild(b);
  });
  function drawThumbs() {
    Object.keys(thumbs).forEach(function (ds) {
      var cv = thumbs[ds], ctx = cv.getContext('2d'), W = cv.width;
      ctx.fillStyle = COL['--surface-2']; ctx.fillRect(0, 0, W, W);
      NN.genData(ds, 140, 0, 5).forEach(function (p) {
        ctx.beginPath(); ctx.arc(sx(p.x, W), sy(p.y, W), 3.4, 0, Math.PI * 2);
        ctx.fillStyle = rgb(p.label > 0 ? COL.blue : COL.orange); ctx.fill();
      });
    });
  }
  function chooseDataset(ds) {
    if (cfg.ds === ds) return;
    cfg.ds = ds; save();
    buildData(); newNet(); syncControls(); drawAll();
  }

  // input features
  var featBox = $('#feats');
  NN.FEATURES.forEach(function (f) {
    featBox.appendChild(el('button', { class: 'chip', type: 'button', id: 'feat-' + f.id, 'aria-pressed': 'false', text: f.label, onclick: function () { toggleFeat(f.id); } }));
  });
  function toggleFeat(id) {
    var on = cfg.feats.indexOf(id) >= 0;
    if (on && cfg.feats.length === 1) { EDU.toast(t('need_input')); return; }
    var next = FEAT_IDS.filter(function (x) { return x === id ? !on : cfg.feats.indexOf(x) >= 0; });
    cfg.feats = next; save();
    buildFeatures(); newNet(); syncControls(); drawAll();
  }

  // layers
  function changeArch() { save(); newNet(); syncControls(); drawAll(); }
  $('#layers-plus').addEventListener('click', function () { if (cfg.layers.length < MAX_LAYERS) { cfg.layers.push(4); changeArch(); } });
  $('#layers-minus').addEventListener('click', function () { if (cfg.layers.length) { cfg.layers.pop(); changeArch(); } });
  function renderLayerRows() {
    var box = $('#layer-rows');
    box.innerHTML = '';
    $('#layers-count').textContent = EDU.fmt(cfg.layers.length);
    $('#layers-minus').disabled = cfg.layers.length === 0;
    $('#layers-plus').disabled = cfg.layers.length >= MAX_LAYERS;
    if (!cfg.layers.length) { box.appendChild(el('p', { class: 'hint mt0', text: t('no_hidden') })); return; }
    cfg.layers.forEach(function (n, i) {
      box.appendChild(el('div', { class: 'layer-row' },
        el('span', { class: 'lname', text: t('layer_n', { n: i + 1 }) }),
        el('div', { class: 'stepper' },
          el('span', { class: 'unit', text: t('neurons') }),
          el('button', { class: 'btn', type: 'button', id: 'neurons-minus-' + i, 'aria-label': t('remove_neuron', { n: i + 1 }), disabled: n <= 1, text: '−', onclick: function () { if (cfg.layers[i] > 1) { cfg.layers[i]--; changeArch(); } } }),
          el('output', { id: 'neurons-' + i, text: EDU.fmt(n) }),
          el('button', { class: 'btn', type: 'button', id: 'neurons-plus-' + i, 'aria-label': t('add_neuron', { n: i + 1 }), disabled: n >= MAX_NEURONS, text: '+', onclick: function () { if (cfg.layers[i] < MAX_NEURONS) { cfg.layers[i]++; changeArch(); } } }))));
    });
  }

  // activation, learning rate, speed
  var lrSel = $('#lr');
  LRS.forEach(function (v) { lrSel.appendChild(el('option', { value: String(v), text: String(v) })); });
  $('#act').addEventListener('change', function () { cfg.act = this.value; changeArch(); });
  lrSel.addEventListener('change', function () {
    cfg.lr = Number(this.value); save();
    if (broken) { newNet(); }
    drawAll();
  });
  EDU.$$('#speed button').forEach(function (b) {
    b.addEventListener('click', function () { cfg.speed = b.getAttribute('data-speed'); save(); syncControls(); });
  });

  // data controls
  $('#noise').addEventListener('input', function () { cfg.noise = Number(this.value); save(); buildData(); newNet(); syncLabels(); drawAll(); });
  $('#split').addEventListener('input', function () { cfg.split = Number(this.value); save(); buildData(); newNet(); syncLabels(); drawAll(); });
  $('#new-data').addEventListener('click', function () { cfg.seed = (cfg.seed % 99999) + 1; save(); buildData(); newNet(); drawAll(); });
  $('#show-test').addEventListener('change', function () { cfg.showTest = this.checked; save(); drawOutput(); });
  $('#sharp').addEventListener('change', function () { cfg.sharp = this.checked; save(); drawOutput(); });
  EDU.$$('#tools button').forEach(function (b) {
    b.addEventListener('click', function () { cfg.tool = b.getAttribute('data-tool'); save(); syncControls(); });
  });
  $('#clear-points').addEventListener('click', function () {
    if (!cfg.draw.length) return;
    if (!confirm(t('confirm_clear'))) return;
    cfg.draw = []; save(); buildData(); evaluate(); syncLabels(); drawAll();
  });

  // drawing points on the output picture
  var drawing = false, lastPt = null;
  function dataPos(e) {
    var r = outCv.getBoundingClientRect();
    return { x: EDU.clamp(((e.clientX - r.left) / r.width) * 2 * R - R, -R, R), y: EDU.clamp(R - ((e.clientY - r.top) / r.height) * 2 * R, -R, R) };
  }
  function drawAt(e) {
    var p = dataPos(e), changed = false;
    if (cfg.tool === 'erase') {
      var before = cfg.draw.length;
      cfg.draw = cfg.draw.filter(function (q) { return (q[0] - p.x) * (q[0] - p.x) + (q[1] - p.y) * (q[1] - p.y) > 0.36; });
      changed = cfg.draw.length !== before;
    } else {
      if (lastPt && Math.pow(lastPt.x - p.x, 2) + Math.pow(lastPt.y - p.y, 2) < 0.3) return;
      if (cfg.draw.length >= MAX_DRAW) { if (!lastPt) EDU.toast(t('too_many', { n: MAX_DRAW })); return; }
      cfg.draw.push([Math.round(p.x * 100) / 100, Math.round(p.y * 100) / 100, cfg.tool === 'blue' ? 1 : -1]);
      lastPt = p; changed = true;
    }
    if (changed) { buildData(); evaluate(); syncLabels(); drawAll(); }
  }
  outCv.addEventListener('pointerdown', function (e) {
    if (cfg.ds !== 'draw') return;
    e.preventDefault();
    try { outCv.setPointerCapture(e.pointerId); } catch (err) { }
    drawing = true; lastPt = null; drawAt(e);
  });
  outCv.addEventListener('pointermove', function (e) { if (drawing) drawAt(e); });
  function endDraw() { if (drawing) { drawing = false; lastPt = null; save(); } }
  outCv.addEventListener('pointerup', endDraw);
  outCv.addEventListener('pointercancel', endDraw);

  // toolbar
  $('#play').addEventListener('click', function () { setPlaying(!playing); });
  $('#step').addEventListener('click', function () { setPlaying(false); trainOne(); drawAll(); });
  $('#reset').addEventListener('click', function () { wseed++; newNet(); drawAll(); });
  $('#fs').addEventListener('click', function () { EDU.fullscreen($('#playground')); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== ' ' || e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.target && e.target.closest && e.target.closest('button, input, select, textarea, summary, a, [contenteditable], .edu-modal-back')) return;
    e.preventDefault(); setPlaying(!playing);
  });
  $('#defaults').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    setPlaying(false);
    cfg = clone(DEFAULTS); wseed = 1; save();
    buildData(); newNet(); syncControls(); drawAll();
  });
  $('#share').addEventListener('click', function () {
    var c = clone(cfg); if (c.ds !== 'draw') delete c.draw;
    var u;
    try { u = new URL(location.href); u.searchParams.set('lang', EDU.lang); u.searchParams.set('setup', EDU.pack(c)); u = u.toString(); }
    catch (e) { u = location.href; }
    /* phones: native share sheet (WhatsApp etc.); laptops/smartboards: copy the link */
    var touch = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    if (touch && navigator.share) EDU.share(u, t('app_title')); else EDU.copy(u);
  });
  $('#print').addEventListener('click', function () { window.print(); });

  /* ------------------------------------------------------------ challenges + explanations */
  function content() { var C = window.APP_CONTENT || {}; return C[EDU.lang] || C.en || { challenges: [], explain: [] }; }
  function loadPreset(k) {
    var p = PRESETS[k];
    setPlaying(false);
    var keep = { draw: cfg.draw, tool: cfg.tool, seed: 1, sharp: cfg.sharp, showTest: !!p.showTest };
    cfg = sanitize(Object.assign({}, keep, p)); wseed = 1; save();
    buildData(); newNet(); syncControls(); drawAll();
    var pg = $('#playground');
    if (pg.scrollIntoView) pg.scrollIntoView({ behavior: 'smooth', block: 'start' });
    EDU.toast(t('loaded', { n: k + 1 }));
  }
  function renderLearning() {
    var C = content(), g = $('#ch-grid');
    g.innerHTML = '';
    (C.challenges || []).forEach(function (ch, k) {
      g.appendChild(el('article', { class: 'ch-card' },
        el('h3', {}, el('span', { class: 'ch-num', text: EDU.fmt(k + 1) }), el('span', { text: ch.title })),
        el('p', { text: ch.task }),
        el('details', {}, el('summary', { text: t('notice') }), el('p', { text: ch.notice })),
        el('div', { class: 'ws-lines' }, el('div', { text: t('ws_guess') }), el('div', { text: t('ws_saw') })),
        el('button', { class: 'btn btn-primary btn-sm', type: 'button', id: 'try-' + (k + 1), onclick: function () { loadPreset(k); } }, el('span', { 'aria-hidden': 'true', text: '▶ ' }), t('try_it'))));
    });
    var x = $('#ex-grid');
    x.innerHTML = '';
    (C.explain || []).forEach(function (ex, k) {
      x.appendChild(el('article', { class: 'ex-card' },
        el('h3', { text: ex.title }),
        el('p', { text: ex.body }),
        k === 0 ? el('div', { class: 'formula no-i18n', text: 'y = f(w₁·x₁ + w₂·x₂ + b)' }) : null));
    });
    $('#ws-title').textContent = t('ws_title') + ' · ' + t('app_title');
  }

  /* ------------------------------------------------------------ sync UI with cfg */
  function syncLabels() {
    $('#noise-lbl').textContent = t('noise', { n: EDU.fmt(cfg.noise) });
    $('#split-lbl').textContent = t('split', { n: EDU.fmt(cfg.split) });
    $('#split-hint').textContent = t('split_hint', { n: EDU.fmt(100 - cfg.split) });
    var pc = $('#point-count');
    pc.textContent = t('points_n', { n: EDU.fmt(cfg.draw.length) });
    pc.setAttribute('data-value', cfg.draw.length);
  }
  function syncControls() {
    DATASETS.forEach(function (ds) { $('#ds-' + ds).setAttribute('aria-pressed', cfg.ds === ds ? 'true' : 'false'); });
    var isDraw = cfg.ds === 'draw';
    $('#draw-box').hidden = !isDraw;
    $('#gen-box').hidden = isDraw;
    outCv.classList.toggle('drawing', isDraw);
    EDU.$$('#tools button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-tool') === cfg.tool ? 'true' : 'false'); });
    EDU.$$('#speed button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-speed') === cfg.speed ? 'true' : 'false'); });
    NN.FEATURES.forEach(function (f) { $('#feat-' + f.id).setAttribute('aria-pressed', cfg.feats.indexOf(f.id) >= 0 ? 'true' : 'false'); });
    $('#noise').value = cfg.noise; $('#split').value = cfg.split;
    $('#show-test').checked = cfg.showTest; $('#sharp').checked = cfg.sharp;
    $('#act').value = cfg.act; lrSel.value = String(cfg.lr);
    renderLayerRows(); syncLabels();
  }

  function render() {               // on every language change
    setPlaying(playing);
    syncControls();
    renderLearning();
    diag.key = '';
    drawAll();
    updateCoach(true);
  }

  /* ------------------------------------------------------------ start */
  readColors();
  drawThumbs();
  buildData();
  newNet();
  syncControls();
  renderLearning();
  setPlaying(false);
  drawAll();

  EDU.onLang(render);
  EDU.onTheme(function () { readColors(); drawThumbs(); diag.key = ''; drawAll(); });
  var resizeT = 0;
  function onResize() { clearTimeout(resizeT); resizeT = setTimeout(function () { if (!playing) drawAll(); else { drawOutput(); drawChart(); var k = Math.round(netWrap.clientWidth || 400); if (diag.key.split('|')[0] !== String(k)) buildDiagram(); } }, 60); }
  if (window.ResizeObserver) { var ro = new ResizeObserver(onResize); ro.observe(netWrap); ro.observe(outCv); ro.observe(chartCv); }
  else window.addEventListener('resize', onResize);
  window.addEventListener('beforeprint', function () { setPlaying(false); });
})();
