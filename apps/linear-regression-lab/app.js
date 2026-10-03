/* Line of Best Fit: linear regression lab (manual fit, least squares, gradient descent, predict). */
(function () {
  'use strict';
  var SLUG = 'linear-regression-lab';
  var store = EDU.store(SLUG);
  var MAX_PTS = 80;
  var LRS = [0.001, 0.01, 0.03, 0.1, 0.3, 0.6, 1, 1.5];
  var LR_DESC = ['lr_tiny', 'lr_tiny', 'lr_small', 'lr_small', 'lr_good', 'lr_good', 'lr_big', 'lr_big'];
  var EPOCH_OPTS = [1, 10, 50, 100, 200, 500, 1000];
  var ORDER = ['study', 'house', 'ice', 'own'];
  var ICONS = ['📏', '🟥', '📉', '⛰️', '👣', '🎯', '🧮', '🤖'];

  /* Example data (numbers are language independent; names and units live in content.js). */
  var BASE = {
    study: { icon: '📚', ax: { xmin: 0, xmax: 20, ymin: 0, ymax: 100 }, rx: 0.5, ry: 1, predX: 12,
      pts: [[1, 30], [2, 38], [3, 35], [4, 45], [5, 48], [6, 55], [7, 50], [8, 60], [9, 66], [10, 61], [11, 70], [12, 74], [13, 69], [14, 80], [16, 82], [18, 91]] },
    house: { icon: '🏠', ax: { xmin: 0, xmax: 2500, ymin: 0, ymax: 120 }, rx: 10, ry: 0.5, predX: 1200,
      pts: [[450, 22], [550, 24], [600, 30], [700, 29], [800, 38], [850, 36], [950, 45], [1000, 41], [1100, 52], [1200, 50], [1300, 61], [1450, 58], [1500, 70], [1650, 68], [1800, 82], [2000, 84], [2200, 98]] },
    ice: { icon: '🍦', ax: { xmin: 0, xmax: 45, ymin: 0, ymax: 350 }, rx: 0.5, ry: 1, predX: 32,
      pts: [[14, 40], [16, 75], [18, 62], [20, 100], [22, 98], [24, 130], [25, 125], [27, 160], [28, 145], [30, 190], [31, 170], [33, 215], [35, 205], [36, 245], [38, 240], [40, 275], [42, 268], [44, 310]] },
    own: { icon: '✏️', ax: { xmin: 0, xmax: 10, ymin: 0, ymax: 10 }, rx: 0.1, ry: 0.1, predX: 5, pts: [] }
  };

  /* ------------------------------------------------------------ state */
  var saved = store.get('state', {}) || {};
  var S = {
    ds: ORDER.indexOf(saved.ds) >= 0 ? saved.ds : 'study',
    tab: ['manual', 'auto', 'predict'].indexOf(saved.tab) >= 0 ? saved.tab : 'manual',
    lr: isInt(saved.lr, 0, LRS.length - 1) ? saved.lr : 4,
    epochs: EPOCH_OPTS.indexOf(saved.epochs) >= 0 ? saved.epochs : 200,
    speed: ['slow', 'normal', 'fast'].indexOf(saved.speed) >= 0 ? saved.speed : 'normal',
    show: { res: true, sq: false, best: false },
    follow: false
  };
  if (saved.show && typeof saved.show === 'object') ['res', 'sq', 'best'].forEach(function (k) { if (typeof saved.show[k] === 'boolean') S.show[k] = saved.show[k]; });

  function isInt(v, a, b) { return typeof v === 'number' && v === Math.round(v) && v >= a && v <= b; }
  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function copyPts(p) { return p.map(function (q) { return [q[0], q[1]]; }); }
  function meanY(p) { if (!p.length) return null; var s = 0; p.forEach(function (q) { s += q[1]; }); return s / p.length; }

  var D = {};
  ORDER.forEach(function (id) {
    var b = BASE[id], sv = store.get('d_' + id, null) || {};
    var d = { pts: copyPts(b.pts), ax: Object.assign({}, b.ax), rx: b.rx, ry: b.ry, predX: b.predX, modified: false, names: { x: '', y: '' } };
    if (Array.isArray(sv.pts)) {
      var ok = sv.pts.filter(function (q) { return Array.isArray(q) && isNum(q[0]) && isNum(q[1]); }).slice(0, MAX_PTS);
      if (ok.length || id === 'own') { d.pts = copyPts(ok); d.modified = id !== 'own'; }
    }
    if (id === 'own') {
      if (sv.ax && isNum(sv.ax.xmin) && isNum(sv.ax.xmax) && isNum(sv.ax.ymin) && isNum(sv.ax.ymax) && sv.ax.xmax > sv.ax.xmin && sv.ax.ymax > sv.ax.ymin) d.ax = sv.ax;
      if (sv.names) { d.names.x = String(sv.names.x || '').slice(0, 40); d.names.y = String(sv.names.y || '').slice(0, 40); }
      setOwnSteps(d);
    }
    if (isNum(sv.predX)) d.predX = sv.predX;
    var my = meanY(d.pts);
    d.m = 0; d.c = my === null ? (d.ax.ymin + d.ax.ymax) / 2 : roundTo(my, d.ry);
    if (isNum(sv.m) && isNum(sv.c)) {
      var r = rangesFor(d);
      if (sv.m >= r.mMin * 4 && sv.m <= r.mMax * 4 && sv.c >= r.cLo - (r.cHi - r.cLo) && sv.c <= r.cHi + (r.cHi - r.cLo)) { d.m = sv.m; d.c = sv.c; }
    }
    D[id] = d;
  });

  /* gradient-descent state (not saved) */
  var G = { hist: [], epoch: 0, running: false, exploded: false, target: 0, raf: 0, frame: 0, code: 'idle', lastFinite: null };
  var ghost = null;           /* {m, c}: "before" line after the outlier experiment */
  var tween = null;
  var hx = [null, null];      /* x positions of the two line handles */
  var hover = -1, drag = null, lastTap = null, printing = false;
  var manualCode = '', expCode = '';

  function cur() { return D[S.ds]; }

  /* ------------------------------------------------------------ maths */
  function stats(p) {
    var n = p.length, mx = 0, my = 0, sxx = 0, sxy = 0;
    if (!n) return { n: 0 };
    p.forEach(function (q) { mx += q[0]; my += q[1]; });
    mx /= n; my /= n;
    p.forEach(function (q) { sxx += (q[0] - mx) * (q[0] - mx); sxy += (q[0] - mx) * (q[1] - my); });
    var o = { n: n, mx: mx, my: my, sxx: sxx, sxy: sxy, ok: n >= 2 && sxx > 1e-12 };
    if (o.ok) { o.m = sxy / sxx; o.c = my - o.m * mx; o.mse = mse(p, o.m, o.c); }
    else if (n === 1) { o.mse = 0; }
    return o;
  }
  function mse(p, m, c) {
    if (!p.length) return 0;
    var s = 0;
    for (var i = 0; i < p.length; i++) { var e = p[i][1] - (m * p[i][0] + c); s += e * e; }
    return s / p.length;
  }
  function rangesFor(d) {
    var a = d.ax, xR = a.xmax - a.xmin, yR = a.ymax - a.ymin;
    var mMax = 2.5 * yR / xR;
    var xAbs = Math.max(Math.abs(a.xmin), Math.abs(a.xmax));
    return { mMin: -mMax, mMax: mMax, cLo: a.ymin - mMax * xAbs, cHi: a.ymax + mMax * xAbs };
  }
  /* axes actually drawn: in Predict, widen them so a prediction outside the data stays visible */
  function viewAx() {
    var d = cur(), a = d.ax;
    if (S.tab !== 'predict' || !isNum(d.predX) || !isFinite(d.m) || !isFinite(d.c)) return a;
    var x = d.predX, y = d.m * x + d.c;
    if (!isFinite(y) || (x >= a.xmin && x <= a.xmax && y >= a.ymin && y <= a.ymax)) return a;
    var xR = a.xmax - a.xmin, yR = a.ymax - a.ymin;
    var o = { xmin: Math.min(a.xmin, x), xmax: Math.max(a.xmax, x), ymin: Math.min(a.ymin, y), ymax: Math.max(a.ymax, y) };
    if (o.xmax - o.xmin > 6 * xR || o.ymax - o.ymin > 6 * yR) return a;
    var sx = niceStep((o.xmax - o.xmin) / 10), sy = niceStep((o.ymax - o.ymin) / 10);
    if (o.xmin < a.xmin) o.xmin = Math.floor((o.xmin - sx * 0.5) / sx) * sx;
    if (o.xmax > a.xmax) o.xmax = Math.ceil((o.xmax + sx * 0.5) / sx) * sx;
    if (o.ymin < a.ymin) o.ymin = Math.floor((o.ymin - sy * 0.5) / sy) * sy;
    if (o.ymax > a.ymax) o.ymax = Math.ceil((o.ymax + sy * 0.5) / sy) * sy;
    o.wide = true;
    return o;
  }
  function roundTo(v, step) { if (!step) return v; var r = Math.round(v / step) * step; var dec = Math.max(0, -Math.floor(Math.log10(step) + 1e-9)); return Number(r.toFixed(Math.min(10, dec + 1))); }
  function niceStep(raw) {
    if (!(raw > 0)) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
  }
  function setOwnSteps(d) {
    var xR = d.ax.xmax - d.ax.xmin, yR = d.ax.ymax - d.ax.ymin;
    d.rx = niceStep(xR / 200); d.ry = niceStep(yR / 200);
    if (d.rx > 1 && d.rx !== Math.round(d.rx)) d.rx = Math.round(d.rx);
  }
  function decs(d) {
    d = d || cur();
    var a = d.ax, xR = a.xmax - a.xmin, yR = a.ymax - a.ymin;
    var ci = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };
    return {
      m: ci(2 - Math.floor(Math.log10(yR / xR)), 0, 6),
      c: ci(3 - Math.floor(Math.log10(yR)), 0, 5),
      x: ci(-Math.floor(Math.log10(d.rx) + 1e-9), 0, 5),
      y: ci(3 - Math.floor(Math.log10(yR)), 0, 5)
    };
  }

  /* ------------------------------------------------------------ formatting */
  function fmtFixed(v, d) { if (Math.abs(v) >= 1e9) return fmtSci(v); return EDU.fmt(v, { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function fmtMax(v, d) { if (Math.abs(v) >= 1e9) return fmtSci(v); return EDU.fmt(v, { maximumFractionDigits: d }); }
  function fmtSci(v) { return EDU.fmt(v, { notation: 'scientific', maximumFractionDigits: 2 }); }
  function fmtAuto(v) {
    var a = Math.abs(v);
    if (a >= 1e9) return fmtSci(v);
    var d = a >= 1000 ? 0 : a >= 100 ? 1 : a >= 1 ? 2 : a >= 0.01 ? 3 : 4;
    return EDU.fmt(v, { maximumFractionDigits: d });
  }
  function signed(v, d) { return (v >= 0 ? '+' : '−') + fmtFixed(Math.abs(v), d); }
  function C() { var A = window.APP_CONTENT || {}; return A[EDU.lang] || A.en; }
  function txt(id) {
    var c = C().datasets[id || S.ds], o = {};
    Object.keys(c).forEach(function (k) { o[k] = c[k]; });
    if ((id || S.ds) === 'own') {
      var nm = D.own.names;
      if (nm.x) { o.xname = nm.x; o.xs = nm.x; }
      if (nm.y) { o.yname = nm.y; o.ys = nm.y; }
    }
    return o;
  }
  function fill(tpl, vars) { return String(tpl).replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; }); }

  /* ------------------------------------------------------------ init + DOM */
  EDU.init({ slug: SLUG, title: 'app_title', wide: true });
  var $ = EDU.$;
  var plot = $('#plot'), lossCv = $('#loss-chart');

  var dsList = $('#ds-list');
  ORDER.forEach(function (id) {
    dsList.appendChild(EDU.el('button', { class: 'ds-btn', type: 'button', id: 'ds-' + id, 'aria-pressed': 'false', onclick: function () { selectDs(id); } },
      EDU.el('span', { class: 'ico', 'aria-hidden': 'true', text: BASE[id].icon }), EDU.el('span', { class: 'nm' })));
  });
  var epSel = $('#epochs');
  EPOCH_OPTS.forEach(function (n) { epSel.appendChild(EDU.el('option', { value: String(n), text: String(n) })); });

  /* ------------------------------------------------------------ saving */
  var saveT = 0;
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(function () {
      store.set('state', { ds: S.ds, tab: S.tab, lr: S.lr, epochs: S.epochs, speed: S.speed, show: S.show });
      var d = cur(), o = { m: isNum(d.m) ? d.m : 0, c: isNum(d.c) ? d.c : 0, predX: d.predX };
      if (d.modified || S.ds === 'own') o.pts = d.pts;
      if (S.ds === 'own') { o.ax = d.ax; o.names = d.names; }
      store.set('d_' + S.ds, o);
    }, 250);
  }

  /* ------------------------------------------------------------ line + points changes */
  function clampLine(m, c) {
    var r = rangesFor(cur());
    return { m: EDU.clamp(m, r.mMin, r.mMax), c: EDU.clamp(c, r.cLo, r.cHi) };
  }
  /* src: 'manual' | 'exact' | 'gd' | 'follow' | 'tween' */
  function setLine(m, c, src) {
    var d = cur();
    if (src === 'manual') { var k = clampLine(m, c); m = k.m; c = k.c; }
    d.m = m; d.c = c;
    if (src === 'manual') { stopTween(); setFollow(false); if (!G.running) resetGD(); else stopRun(); }
    if (src === 'gd') setFollow(false);
    save();
    refresh();
  }
  function setFollow(on) { S.follow = !!on; $('#follow').checked = S.follow; }

  function pointsChanged(structural) {
    var d = cur();
    if (S.ds !== 'own') d.modified = true;
    if (S.follow) { var st = stats(d.pts); if (st.ok) { d.m = st.m; d.c = st.c; } }
    if (!G.running) resetGD();
    save();
    if (structural) renderTable(); else updateTable();
    refresh();
  }

  /* ------------------------------------------------------------ gradient descent */
  function resetGD() {
    G.hist = []; G.epoch = 0; G.exploded = false; G.lastFinite = null;
    var d = cur();
    if (d.pts.length) G.hist.push(mse(d.pts, d.m, d.c));
  }
  /* one epoch of batch gradient descent on min-max scaled data (feature scaling) */
  function gdStep() {
    var d = cur(), p = d.pts, n = p.length;
    var st = stats(p);
    if (!st.ok || G.exploded) return false;
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, i;
    for (i = 0; i < n; i++) { x0 = Math.min(x0, p[i][0]); x1 = Math.max(x1, p[i][0]); y0 = Math.min(y0, p[i][1]); y1 = Math.max(y1, p[i][1]); }
    var sx = x1 - x0 || 1, sy = y1 - y0 || 1;
    var mp = d.m * sx / sy, cp = (d.m * x0 + d.c - y0) / sy, gm = 0, gc = 0;
    for (i = 0; i < n; i++) {
      var xp = (p[i][0] - x0) / sx, yp = (p[i][1] - y0) / sy, e = mp * xp + cp - yp;
      gm += e * xp; gc += e;
    }
    gm *= 2 / n; gc *= 2 / n;
    mp -= LRS[S.lr] * gm; cp -= LRS[S.lr] * gc;
    var m = mp * sy / sx, c = cp * sy + y0 - m * x0;
    if (!G.hist.length) G.hist.push(mse(p, d.m, d.c));
    if (!isFinite(m) || !isFinite(c)) { G.exploded = true; return false; }
    var L = mse(p, m, c);
    G.lastFinite = { m: d.m, c: d.c };
    d.m = m; d.c = c;
    G.epoch++;
    G.hist.push(isFinite(L) ? L : Number.MAX_VALUE);
    if (G.hist.length > 20000) G.hist.splice(1, 1);
    var ref = Math.max(G.hist[0], st.mse || 0, 1e-9);
    if (!isFinite(L) || L > 1e6 * ref) G.exploded = true;
    setFollow(false);
    return !G.exploded;
  }
  function gdGap() {
    var d = cur(), st = stats(d.pts);
    if (!st.ok) return Infinity;
    var L = mse(d.pts, d.m, d.c);
    return (L - st.mse) / Math.max(st.mse, 1e-9 * Math.max(1, Math.abs(st.my * st.my)));
  }
  function startRun() {
    if (G.running) return;
    var st = stats(cur().pts);
    if (!st.ok) { setAutoCode('need'); EDU.toast(EDU.t('need_points')); return; }
    if (G.exploded) { setAutoCode('explode'); return; }
    stopTween();
    G.running = true; G.target = G.epoch + S.epochs; G.frame = 0;
    setRunBtn();
    G.raf = requestAnimationFrame(loop);
  }
  function stopRun() {
    if (!G.running) return;
    G.running = false; cancelAnimationFrame(G.raf);
    setRunBtn();
    save();
    refresh();
  }
  function loop() {
    if (!G.running) return;
    G.frame++;
    var per = S.speed === 'slow' ? (G.frame % 6 === 0 ? 1 : 0) : S.speed === 'fast' ? 10 : 1;
    var stop = false;
    for (var k = 0; k < per; k++) {
      if (G.epoch >= G.target) { stop = true; break; }
      if (!gdStep()) { stop = true; break; }
      if (gdGap() < 0.002) { stop = true; break; }
    }
    if (G.epoch >= G.target) stop = true;
    if (stop) { G.running = false; setRunBtn(); save(); refresh(); return; }
    refresh();
    G.raf = requestAnimationFrame(loop);
  }
  function setRunBtn() {
    var b = $('#gd-run');
    b.setAttribute('aria-pressed', G.running ? 'true' : 'false');
    b.textContent = G.running ? '⏸ ' + EDU.t('pause') : '▶ ' + EDU.t('gd_run');
  }
  function restartFlat() {
    stopRun(); stopTween();
    var d = cur();
    var y0 = d.pts.length ? Math.min.apply(null, d.pts.map(function (q) { return q[1]; })) : (d.ax.ymin + d.ax.ymax) / 2;
    d.m = 0; d.c = y0;
    setFollow(false);
    resetGD();
    save();
    refresh();
  }
  function autoCode() {
    var d = cur(), st = stats(d.pts), h = G.hist, n = h.length;
    if (!st.ok) return 'need';
    if (G.exploded) return 'explode';
    if (n >= 3 && h[n - 1] > h[n - 2] && h[n - 2] > h[n - 3]) return 'up';
    if (G.epoch > 0 && gdGap() < 0.01) return 'done';
    if (G.running) return 'running';
    if (G.epoch === 0) return 'idle';
    if (LRS[S.lr] <= 0.03) return 'slow';
    return 'progress';
  }
  var AUTO_TONE = { need: 'warn', explode: 'bad', up: 'bad', done: 'good', running: '', idle: '', slow: 'warn', progress: '' };
  var AUTO_ICON = { need: '✋', explode: '💥', up: '📈', done: '🎉', running: '⏳', idle: '👉', slow: '🐢', progress: '👣' };
  function setAutoCode(code) {
    var el = $('#coach-auto');
    if (el.getAttribute('data-code') === code && G.code === code) return;
    G.code = code;
    el.setAttribute('data-code', code);
    el.setAttribute('data-tone', AUTO_TONE[code] || '');
    $('.ico', el).textContent = AUTO_ICON[code] || '';
    $('.txt', el).textContent = EDU.t('coach_gd_' + code);
  }

  /* ------------------------------------------------------------ exact fit */
  function stopTween() { if (tween) { cancelAnimationFrame(tween.raf); tween = null; } }
  function fitExact(animate) {
    var d = cur(), st = stats(d.pts);
    if (!st.ok) { EDU.toast(EDU.t(d.pts.length >= 2 ? 'same_x' : 'need_points')); return false; }
    stopRun(); stopTween();
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var m0 = d.m, c0 = d.c, t0 = performance.now(), dur = 550;
    var finish = function () { d.m = st.m; d.c = st.c; setFollow(true); resetGD(); save(); refresh(); };
    if (!animate || reduce || !isFinite(m0) || !isFinite(c0)) { finish(); return true; }
    tween = { raf: 0 };
    var stepT = function (now) {
      var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      if (k >= 1) { tween = null; finish(); return; }
      d.m = m0 + (st.m - m0) * e; d.c = c0 + (st.c - c0) * e;
      refresh();
      tween.raf = requestAnimationFrame(stepT);
    };
    tween.raf = requestAnimationFrame(stepT);
    return true;
  }

  /* ------------------------------------------------------------ canvas helpers */
  var COLORS = null;
  function readColors() {
    if (printing) return { text: '#000000', muted: '#444444', border: '#bbbbbb', surface: '#ffffff', surface2: '#f2f2f2', primary: '#0b4f5c', accent: '#d9501c', danger: '#b42318', success: '#15803d', c1: '#0b7285', c3: '#5f3dc4', c5: '#c2255c', warning: '#a15c07' };
    return { text: EDU.css('--text'), muted: EDU.css('--muted'), border: EDU.css('--border'), surface: EDU.css('--surface'), surface2: EDU.css('--surface-2'), primary: EDU.css('--primary'), accent: EDU.css('--accent'), danger: EDU.css('--danger'), success: EDU.css('--success'), c1: EDU.css('--c1'), c3: EDU.css('--c3'), c5: EDU.css('--c5'), warning: EDU.css('--warning') };
  }
  var FONT = '';
  function readFont() { try { FONT = getComputedStyle(document.body).fontFamily || 'sans-serif'; } catch (e) { FONT = 'sans-serif'; } }
  function fontPx(px, w) { return (w || 600) + ' ' + Math.round(px) + 'px ' + FONT; }
  function numFont(px, w) { return (w || 600) + ' ' + Math.round(px) + 'px "Noto Sans", system-ui, "Segoe UI", sans-serif'; }
  function prep(cv) {
    var dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    var w = cv.clientWidth || 600, h = cv.clientHeight || 400;
    var W = Math.round(w * dpr), H = Math.round(h * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx: ctx, w: w, h: h };
  }
  function alpha(color, a) {
    var c = String(color).trim();
    if (c[0] === '#') {
      if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
      var n = parseInt(c.slice(1, 7), 16);
      return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
    }
    var m = c.match(/rgba?\(([^)]+)\)/);
    if (m) { var p = m[1].split(',').map(function (s) { return s.trim(); }); return 'rgba(' + p[0] + ',' + p[1] + ',' + p[2] + ',' + a + ')'; }
    return c;
  }
  function ticks(min, max, count) {
    var step = niceStep((max - min) / Math.max(1, count)), out = [];
    var start = Math.ceil(min / step - 1e-9) * step;
    for (var v = start; v <= max + step * 1e-6; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
    return { list: out, step: step };
  }
  function tickFmt(v, step) { var d = Math.max(0, -Math.floor(Math.log10(step) + 1e-9)); return EDU.fmt(v, { maximumFractionDigits: d }); }
  function fitText(ctx, text, maxW, px, weight) {
    var size = px;
    ctx.font = fontPx(size, weight);
    while (size > 9 && ctx.measureText(text).width > maxW) { size -= 1; ctx.font = fontPx(size, weight); }
    return size;
  }

  /* plot geometry for the current canvas size */
  var GEO = null;
  function geom(w, h) {
    var fs = EDU.clamp(Math.round(w / 50), 12, 19);
    var g = { fs: fs, w: w, h: h, l: Math.round(fs * 4.3), r: w - Math.round(fs * 1.1), t: Math.round(fs * 1.1), b: h - Math.round(fs * 3.5) };
    var a = viewAx();
    g.X = function (x) { return g.l + (x - a.xmin) / (a.xmax - a.xmin) * (g.r - g.l); };
    g.Y = function (y) { return g.b - (y - a.ymin) / (a.ymax - a.ymin) * (g.b - g.t); };
    g.toX = function (px) { return a.xmin + (px - g.l) / (g.r - g.l) * (a.xmax - a.xmin); };
    g.toY = function (py) { return a.ymin + (g.b - py) / (g.b - g.t) * (a.ymax - a.ymin); };
    return g;
  }

  /* visible part of the line inside the axes box, in data x */
  function visibleSeg(d) {
    var a = d.ax, m = d.m, c = d.c, lo = a.xmin, hi = a.xmax;
    if (!isFinite(m) || !isFinite(c)) return null;
    if (Math.abs(m) < 1e-15) return (c >= a.ymin && c <= a.ymax) ? [lo, hi] : null;
    var x1 = (a.ymin - c) / m, x2 = (a.ymax - c) / m;
    lo = Math.max(lo, Math.min(x1, x2)); hi = Math.min(hi, Math.max(x1, x2));
    return hi - lo > (a.xmax - a.xmin) * 0.02 ? [lo, hi] : null;
  }
  function handles() {
    var d = cur(), seg = visibleSeg(d), a = d.ax;
    if (!seg) return [null, null];
    var span = seg[1] - seg[0], inset = span * 0.07;
    if (hx[0] === null || hx[1] === null || !drag || drag.kind !== 'handle') {
      if (hx[0] === null) hx[0] = a.xmin + (a.xmax - a.xmin) * 0.2;
      if (hx[1] === null) hx[1] = a.xmin + (a.xmax - a.xmin) * 0.8;
      for (var i = 0; i < 2; i++) hx[i] = EDU.clamp(hx[i], seg[0] + inset, seg[1] - inset);
      if (Math.abs(hx[1] - hx[0]) < span * 0.3) { hx[0] = seg[0] + span * 0.2; hx[1] = seg[1] - span * 0.2; }
    }
    return hx.map(function (x) { return { x: x, y: d.m * x + d.c }; });
  }

  /* ------------------------------------------------------------ draw the main plot */
  function draw() {
    if (!plot.clientWidth) return;
    var P = prep(plot), ctx = P.ctx, w = P.w, h = P.h, col = COLORS = readColors();
    var d = cur(), a = viewAx(), T = txt(), g = GEO = geom(w, h), fs = g.fs;
    var st = stats(d.pts);

    /* grid + ticks */
    var tx = ticks(a.xmin, a.xmax, Math.max(3, Math.round((g.r - g.l) / (fs * 6)))), ty = ticks(a.ymin, a.ymax, Math.max(3, Math.round((g.b - g.t) / (fs * 3.6))));
    ctx.lineWidth = 1;
    ctx.strokeStyle = alpha(col.border, 0.9);
    ctx.beginPath();
    tx.list.forEach(function (v) { var x = Math.round(g.X(v)) + 0.5; ctx.moveTo(x, g.t); ctx.lineTo(x, g.b); });
    ty.list.forEach(function (v) { var y = Math.round(g.Y(v)) + 0.5; ctx.moveTo(g.l, y); ctx.lineTo(g.r, y); });
    ctx.stroke();
    ctx.strokeStyle = col.muted; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(g.l, g.t); ctx.lineTo(g.l, g.b); ctx.lineTo(g.r, g.b); ctx.stroke();
    ctx.fillStyle = col.muted; ctx.font = numFont(fs * 0.86, 500);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    tx.list.forEach(function (v) { ctx.fillText(tickFmt(v, tx.step), g.X(v), g.b + fs * 0.35); });
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ty.list.forEach(function (v) { ctx.fillText(tickFmt(v, ty.step), g.l - fs * 0.4, g.Y(v)); });
    /* axis titles */
    ctx.fillStyle = col.text; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    fitText(ctx, T.xname, g.r - g.l, fs, 700);
    ctx.fillText(T.xname, (g.l + g.r) / 2, h - fs * 0.25);
    ctx.save();
    ctx.translate(fs * 0.25, (g.t + g.b) / 2); ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = 'top';
    fitText(ctx, T.yname, g.b - g.t, fs, 700);
    ctx.fillText(T.yname, 0, 0);
    ctx.restore();

    /* everything inside the axes box is clipped */
    ctx.save();
    ctx.beginPath(); ctx.rect(g.l, g.t, g.r - g.l, g.b - g.t); ctx.clip();
    /* widened view for a far prediction: shade the part outside the data's x range */
    if (a.wide && st.n >= 2) {
      var xsA = d.pts.map(function (q) { return q[0]; }), dlo = Math.min.apply(null, xsA), dhi = Math.max.apply(null, xsA);
      ctx.fillStyle = alpha(col.warning, 0.1);
      if (g.X(dlo) > g.l) ctx.fillRect(g.l, g.t, g.X(dlo) - g.l, g.b - g.t);
      if (g.X(dhi) < g.r) ctx.fillRect(g.X(dhi), g.t, g.r - g.X(dhi), g.b - g.t);
    }
    var lineOk = isFinite(d.m) && isFinite(d.c);

    /* squared errors as squares (area ∝ error²) */
    if (S.show.sq && lineOk) {
      d.pts.forEach(function (q) {
        var py = g.Y(q[1]), ph = g.Y(d.m * q[0] + d.c), s = Math.abs(py - ph);
        if (s < 0.5 || s > 5000) return;
        var x = g.X(q[0]), left = x + s > g.r && x - s >= g.l ? x - s : x;
        ctx.fillStyle = alpha(col.c5, 0.13); ctx.strokeStyle = alpha(col.c5, 0.6); ctx.lineWidth = 1.2;
        ctx.fillRect(left, Math.min(py, ph), s, s); ctx.strokeRect(left + 0.5, Math.min(py, ph) + 0.5, s - 1, s - 1);
      });
    }
    /* best line (dashed) and "before" ghost */
    function dashed(m, c, color, label) {
      ctx.save(); ctx.setLineDash([9, 7]); ctx.strokeStyle = color; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(g.X(a.xmin), g.Y(m * a.xmin + c)); ctx.lineTo(g.X(a.xmax), g.Y(m * a.xmax + c)); ctx.stroke();
      ctx.restore();
      var seg = visibleSeg({ ax: a, m: m, c: c });
      if (seg && label) {
        var lx = seg[0] + (seg[1] - seg[0]) * 0.93, ly = m * lx + c;
        ctx.font = fontPx(fs * 0.85, 700); ctx.fillStyle = color; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        ctx.fillText(label, g.X(lx), g.Y(ly) - 6);
      }
    }
    if (ghost) dashed(ghost.m, ghost.c, col.muted, EDU.t('before_label'));
    if (S.show.best && st.ok) dashed(st.m, st.c, col.success, EDU.t('best_label'));

    /* error lines */
    if (S.show.res && lineOk) {
      ctx.strokeStyle = col.danger; ctx.lineWidth = 2.5; ctx.beginPath();
      d.pts.forEach(function (q) { var x = g.X(q[0]); ctx.moveTo(x, g.Y(q[1])); ctx.lineTo(x, g.Y(d.m * q[0] + d.c)); });
      ctx.stroke();
    }
    /* the model line */
    if (lineOk) {
      ctx.strokeStyle = col.accent; ctx.lineWidth = Math.max(3, fs * 0.22); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(g.X(a.xmin), g.Y(d.m * a.xmin + d.c)); ctx.lineTo(g.X(a.xmax), g.Y(d.m * a.xmax + d.c)); ctx.stroke();
    }
    /* prediction guides */
    if (S.tab === 'predict' && lineOk && isNum(d.predX)) {
      var px = g.X(d.predX), yh = d.m * d.predX + d.c, py = g.Y(yh);
      ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = col.c3; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px, g.b); ctx.lineTo(px, py); ctx.lineTo(g.l, py); ctx.stroke(); ctx.restore();
      ctx.fillStyle = col.c3; ctx.strokeStyle = col.surface; ctx.lineWidth = 2;
      var r = fs * 0.62;
      ctx.beginPath(); ctx.moveTo(px, py - r); ctx.lineTo(px + r, py); ctx.lineTo(px, py + r); ctx.lineTo(px - r, py); ctx.closePath(); ctx.fill(); ctx.stroke();
      var lab = 'ŷ = ' + fmtMax(yh, decs().y);
      ctx.font = numFont(fs * 0.95, 800); ctx.textBaseline = 'bottom';
      var tw = ctx.measureText(lab).width, lx2 = px + r + 6;
      ctx.textAlign = lx2 + tw > g.r - 4 ? 'right' : 'left';
      if (ctx.textAlign === 'right') lx2 = px - r - 6;
      ctx.fillText(lab, lx2, py - 4);
    }
    /* dots */
    var pr = EDU.clamp(w / 105, 5, 9);
    d.pts.forEach(function (q, i) {
      var x = g.X(q[0]), y = g.Y(q[1]), big = (i === hover || (drag && drag.kind === 'point' && drag.idx === i));
      ctx.beginPath(); ctx.arc(x, y, big ? pr * 1.35 : pr, 0, Math.PI * 2);
      ctx.fillStyle = col.c1; ctx.fill();
      ctx.lineWidth = big ? 3 : 2; ctx.strokeStyle = big ? col.accent : col.surface; ctx.stroke();
    });
    /* handles */
    if (S.tab === 'manual' && lineOk) {
      handles().forEach(function (hp, i) {
        if (!hp) return;
        var x = g.X(hp.x), y = g.Y(hp.y), hr = EDU.clamp(fs * 0.75, 10, 14), act = drag && drag.kind === 'handle' && drag.idx === i;
        ctx.beginPath(); ctx.arc(x, y, act ? hr * 1.2 : hr, 0, Math.PI * 2);
        ctx.fillStyle = col.surface; ctx.fill();
        ctx.lineWidth = 3.5; ctx.strokeStyle = col.accent; ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, hr * 0.38, 0, Math.PI * 2); ctx.fillStyle = col.accent; ctx.fill();
      });
    }
    ctx.restore();

    /* tooltip for hovered / dragged dot */
    var ti = drag && drag.kind === 'point' ? drag.idx : hover;
    if (ti >= 0 && d.pts[ti] && lineOk) {
      var q = d.pts[ti], dc = decs(), err = q[1] - (d.m * q[0] + d.c);
      var label = '(' + fmtMax(q[0], dc.x) + ', ' + fmtMax(q[1], dc.y) + ')  ' + EDU.t('err_word') + ' ' + signed(err, dc.y);
      ctx.font = fontPx(fs * 0.85, 700);
      var bw = ctx.measureText(label).width + 14, bh = fs * 1.9, bx = g.X(q[0]) + 12, by = g.Y(q[1]) - bh - 10;
      if (bx + bw > w - 2) bx = g.X(q[0]) - bw - 12;
      if (by < 2) by = g.Y(q[1]) + 12;
      ctx.fillStyle = col.surface; ctx.strokeStyle = col.border; ctx.lineWidth = 1;
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 7); else ctx.rect(bx, by, bw, bh); ctx.fill(); ctx.stroke();
      ctx.fillStyle = col.text; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(label, bx + 7, by + bh / 2);
    }
    /* empty-state message */
    if (!d.pts.length) {
      ctx.fillStyle = col.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var msg = EDU.t('own_empty');
      fitText(ctx, msg, (g.r - g.l) * 0.9, fs * 1.15, 700);
      ctx.fillText(msg, (g.l + g.r) / 2, (g.t + g.b) / 2 - fs * 2);
    }
    plot.setAttribute('aria-label', EDU.t('graph_aria', { n: EDU.fmt(d.pts.length), x: T.xname, y: T.yname }));
  }

  /* ------------------------------------------------------------ loss chart */
  function drawLoss() {
    if (!lossCv.clientWidth) return;
    var P = prep(lossCv), ctx = P.ctx, w = P.w, h = P.h, col = COLORS || readColors();
    var fs = EDU.clamp(Math.round(w / 34), 11, 15);
    var st = stats(cur().pts), H = G.hist;
    var l = fs * 3.6, r = w - fs * 0.8, t = fs * 0.8, b = h - fs * 2.6;
    ctx.strokeStyle = col.muted; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(l, t); ctx.lineTo(l, b); ctx.lineTo(r, b); ctx.stroke();
    ctx.fillStyle = col.muted; ctx.font = fontPx(fs * 0.9, 600); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(EDU.t('epoch_label'), (l + r) / 2, h - 1);
    if (H.length < 2) {
      ctx.fillStyle = col.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var msg = EDU.t('chart_empty');
      fitText(ctx, msg, (r - l) * 0.94, fs, 600);
      ctx.fillText(msg, (l + r) / 2, (t + b) / 2);
      lossCv.setAttribute('aria-label', EDU.t('loss_chart'));
      return;
    }
    var n = H.length, xmax = Math.max(10, n - 1);
    var hmax = 0; for (var i = 0; i < n; i++) if (isFinite(H[i])) hmax = Math.max(hmax, H[i]);
    var ymax = Math.min(hmax, H[0] * 8) * 1.08;
    if (st.ok) ymax = Math.max(ymax, st.mse * 1.5);
    if (!(ymax > 0)) ymax = 1;
    var X = function (e) { return l + e / xmax * (r - l); }, Y = function (v) { return b - Math.min(v, ymax) / ymax * (b - t); };
    var tY = ticks(0, ymax, 3);
    ctx.font = numFont(fs * 0.82, 500); ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = alpha(col.border, 0.9); ctx.lineWidth = 1;
    tY.list.forEach(function (v) { var y = Math.round(Y(v)) + 0.5; ctx.beginPath(); ctx.moveTo(l, y); ctx.lineTo(r, y); ctx.stroke(); ctx.fillText(fmtAuto(v), l - 4, y); });
    var tX = ticks(0, xmax, 4);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    tX.list.forEach(function (v) { ctx.fillText(EDU.fmt(v), X(v), b + 3); });
    if (st.ok) {
      ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = col.success; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(l, Y(st.mse)); ctx.lineTo(r, Y(st.mse)); ctx.stroke(); ctx.restore();
      ctx.fillStyle = col.success; ctx.font = fontPx(fs * 0.85, 700); ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      ctx.fillText(EDU.t('best_possible'), r - 2, Y(st.mse) - 3);
    }
    var stride = Math.max(1, Math.floor(n / ((r - l) * 2)));
    ctx.strokeStyle = col.c3; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.beginPath();
    for (var e = 0; e < n; e += stride) { var v = isFinite(H[e]) ? H[e] : ymax * 2; if (e === 0) ctx.moveTo(X(e), Y(v)); else ctx.lineTo(X(e), Y(v)); }
    ctx.lineTo(X(n - 1), Y(isFinite(H[n - 1]) ? H[n - 1] : ymax * 2));
    ctx.stroke();
    var last = H[n - 1];
    ctx.beginPath(); ctx.arc(X(n - 1), Y(last), 4.5, 0, Math.PI * 2); ctx.fillStyle = last > ymax ? col.danger : col.c3; ctx.fill();
    if (last > ymax) { ctx.fillStyle = col.danger; ctx.font = fontPx(fs * 1.2, 800); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('↑', X(n - 1) - 10, t); }
    lossCv.setAttribute('aria-label', EDU.t('loss_chart') + ': ' + fmtAuto(H[0]) + ' → ' + fmtAuto(last));
  }

  /* ------------------------------------------------------------ pointer interaction */
  function evPos(e) { var r = plot.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function hitTest(pos, touch) {
    var g = GEO, d = cur(); if (!g) return { kind: 'none' };
    var k = touch ? 1.45 : 1, i, best = -1, bd = Infinity;
    if (S.tab === 'manual' && isFinite(d.m)) {
      var hs = handles();
      for (i = 0; i < 2; i++) if (hs[i]) {
        var dh = Math.hypot(g.X(hs[i].x) - pos.x, g.Y(hs[i].y) - pos.y);
        if (dh < 20 * k && dh < bd) { bd = dh; best = i; }
      }
      if (best >= 0) return { kind: 'handle', idx: best };
    }
    bd = Infinity;
    for (i = 0; i < d.pts.length; i++) {
      var dp = Math.hypot(g.X(d.pts[i][0]) - pos.x, g.Y(d.pts[i][1]) - pos.y);
      if (dp < 16 * k && dp < bd) { bd = dp; best = i; }
    }
    if (best >= 0) return { kind: 'point', idx: best };
    if (S.tab === 'manual' && isFinite(d.m) && isFinite(d.c)) {
      var a = d.ax, x1 = g.X(a.xmin), y1 = g.Y(d.m * a.xmin + d.c), x2 = g.X(a.xmax), y2 = g.Y(d.m * a.xmax + d.c);
      var dl = Math.abs((y2 - y1) * pos.x - (x2 - x1) * pos.y + x2 * y1 - y2 * x1) / Math.hypot(y2 - y1, x2 - x1);
      if (dl < 12 * k) return { kind: 'line' };
    }
    if (pos.x >= g.l && pos.x <= g.r && pos.y >= g.t && pos.y <= g.b) return { kind: 'empty' };
    return { kind: 'none' };
  }
  function clampToBox(x, y) { var a = cur().ax; return [EDU.clamp(x, a.xmin, a.xmax), EDU.clamp(y, a.ymin, a.ymax)]; }

  plot.addEventListener('pointerdown', function (e) {
    if (e.button !== undefined && e.button > 0) return;
    if (!GEO) draw();
    var pos = evPos(e), hit = hitTest(pos, e.pointerType === 'touch'), d = cur(), g = GEO;
    drag = { kind: hit.kind, idx: hit.idx, start: pos, moved: false, id: e.pointerId, m0: d.m, c0: d.c, y0: g.toY(pos.y) };
    if (hit.kind === 'handle') {
      var hs = handles(), o = hs[1 - hit.idx];
      drag.pivot = o || { x: (d.ax.xmin + d.ax.xmax) / 2, y: d.m * (d.ax.xmin + d.ax.xmax) / 2 + d.c };
    }
    if (hit.kind === 'handle' || hit.kind === 'point' || hit.kind === 'line') { stopTween(); }
    try { plot.setPointerCapture(e.pointerId); } catch (er) { }
    e.preventDefault();
    draw();
  });
  plot.addEventListener('pointermove', function (e) {
    var pos = evPos(e), d = cur(), g = GEO;
    if (!g) return;
    if (!drag) {
      var hit = hitTest(pos, e.pointerType === 'touch');
      var nh = hit.kind === 'point' ? hit.idx : -1;
      plot.style.cursor = hit.kind === 'handle' || hit.kind === 'point' ? 'grab' : hit.kind === 'line' ? 'ns-resize' : hit.kind === 'empty' ? 'crosshair' : 'default';
      if (nh !== hover) { hover = nh; draw(); }
      return;
    }
    if (drag.id !== e.pointerId) return;
    if (!drag.moved && Math.hypot(pos.x - drag.start.x, pos.y - drag.start.y) < 4) return;
    drag.moved = true;
    var x = g.toX(pos.x), y = g.toY(pos.y);
    if (drag.kind === 'point') {
      var q = clampToBox(x, y);
      d.pts[drag.idx] = [roundTo(q[0], d.rx), roundTo(q[1], d.ry)];
      pointsChanged(false);
    } else if (drag.kind === 'handle') {
      var q2 = clampToBox(x, y), pv = drag.pivot;
      if (Math.abs(q2[0] - pv.x) < (d.ax.xmax - d.ax.xmin) * 0.03) return;
      var m = (q2[1] - pv.y) / (q2[0] - pv.x), c = pv.y - m * pv.x;
      hx[drag.idx] = q2[0]; hx[1 - drag.idx] = pv.x;
      setLine(m, c, 'manual');
    } else if (drag.kind === 'line') {
      setLine(drag.m0, drag.c0 + (y - drag.y0), 'manual');
    }
  });
  function endDrag(e) {
    if (!drag || (e && drag.id !== e.pointerId)) return;
    var dr = drag; drag = null;
    if (!dr.moved && e && e.type === 'pointerup') {
      var d = cur(), g = GEO, now = Date.now();
      if (dr.kind === 'point') {
        if (lastTap && lastTap.idx === dr.idx && now - lastTap.t < 450) {
          d.pts.splice(dr.idx, 1); lastTap = null; hover = -1;
          pointsChanged(true);
          return;
        }
        lastTap = { idx: dr.idx, t: now };
      } else if (dr.kind === 'empty') {
        lastTap = null;
        var x = g.toX(dr.start.x), y = g.toY(dr.start.y);
        if (S.tab === 'predict') { setPredX(roundTo(x, d.rx)); }
        else if (d.pts.length >= MAX_PTS) { EDU.toast(EDU.t('max_points', { n: MAX_PTS })); }
        else { var q = clampToBox(x, y); d.pts.push([roundTo(q[0], d.rx), roundTo(q[1], d.ry)]); pointsChanged(true); }
      }
    }
    if (dr.kind === 'handle' || dr.kind === 'line') save();
    draw();
  }
  plot.addEventListener('pointerup', endDrag);
  plot.addEventListener('pointercancel', endDrag);
  plot.addEventListener('pointerleave', function () { if (!drag && hover !== -1) { hover = -1; draw(); } });

  /* ------------------------------------------------------------ sliders */
  var mR = $('#m-range'), mN = $('#m-num'), cR = $('#c-range'), cN = $('#c-num');
  function setupSliders() {
    var r = rangesFor(cur());
    mR.min = r.mMin; mR.max = r.mMax; mR.step = (r.mMax - r.mMin) / 1000;
    cR.min = r.cLo; cR.max = r.cHi; cR.step = (r.cHi - r.cLo) / 1000;
    var dc = decs();
    mN.step = Math.pow(10, -dc.m); cN.step = Math.pow(10, -dc.c);
  }
  function syncSliders() {
    var d = cur(), dc = decs();
    if (document.activeElement !== mR) mR.value = isFinite(d.m) ? d.m : 0;
    if (document.activeElement !== cR) cR.value = isFinite(d.c) ? d.c : 0;
    if (document.activeElement !== mN) mN.value = isFinite(d.m) ? Number(d.m.toFixed(dc.m)) : '';
    if (document.activeElement !== cN) cN.value = isFinite(d.c) ? Number(d.c.toFixed(dc.c)) : '';
  }
  mR.addEventListener('input', function () { setLine(Number(mR.value), cur().c, 'manual'); });
  cR.addEventListener('input', function () { setLine(cur().m, Number(cR.value), 'manual'); });
  mN.addEventListener('input', function () { var v = parseFloat(mN.value); if (isFinite(v)) setLine(v, cur().c, 'manual'); });
  cN.addEventListener('input', function () { var v = parseFloat(cN.value); if (isFinite(v)) setLine(cur().m, v, 'manual'); });
  [mN, cN].forEach(function (el) { el.addEventListener('blur', syncSliders); });
  $('#reset-line').addEventListener('click', function () {
    var d = cur(), my = meanY(d.pts);
    hx = [null, null];
    setLine(0, my === null ? (d.ax.ymin + d.ax.ymax) / 2 : roundTo(my, d.ry), 'manual');
  });

  /* ------------------------------------------------------------ show toggles */
  [['res', '#show-res'], ['sq', '#show-sq'], ['best', '#show-best']].forEach(function (p) {
    $(p[1]).addEventListener('click', function () { S.show[p[0]] = !S.show[p[0]]; save(); syncShow(); draw(); });
  });
  function syncShow() { $('#show-res').setAttribute('aria-pressed', String(S.show.res)); $('#show-sq').setAttribute('aria-pressed', String(S.show.sq)); $('#show-best').setAttribute('aria-pressed', String(S.show.best)); }

  /* ------------------------------------------------------------ tabs */
  function setTab(tab) {
    S.tab = tab;
    ['manual', 'auto', 'predict'].forEach(function (k) {
      $('#tab-' + k).setAttribute('aria-selected', String(k === tab));
      $('#tab-' + k).tabIndex = k === tab ? 0 : -1;
      $('#panel-' + k).hidden = k !== tab;
    });
    if (tab !== 'auto') stopRun();
    save();
    refresh();
    drawLoss();
  }
  ['manual', 'auto', 'predict'].forEach(function (k, i, arr) {
    var b = $('#tab-' + k);
    b.addEventListener('click', function () { setTab(k); });
    b.addEventListener('keydown', function (e) {
      var dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!dir) return;
      if (document.documentElement.dir === 'rtl') dir = -dir;
      var nk = arr[(i + dir + arr.length) % arr.length];
      setTab(nk); $('#tab-' + nk).focus(); e.preventDefault();
    });
  });

  /* ------------------------------------------------------------ auto tab controls */
  $('#fit-exact').addEventListener('click', function () { fitExact(true); });
  $('#follow').addEventListener('change', function () {
    S.follow = $('#follow').checked;
    if (S.follow) { if (!fitExact(true)) setFollow(false); }
  });
  var lrIn = $('#lr');
  lrIn.addEventListener('input', function () { S.lr = EDU.clamp(parseInt(lrIn.value, 10) || 0, 0, LRS.length - 1); save(); syncLr(); refresh(); });
  function syncLr() {
    lrIn.value = S.lr;
    $('#lr-out').textContent = EDU.fmt(LRS[S.lr]);
    lrIn.setAttribute('aria-valuetext', String(LRS[S.lr]));
    $('#lr-desc').textContent = EDU.t(LR_DESC[S.lr]);
  }
  epSel.addEventListener('change', function () { S.epochs = parseInt(epSel.value, 10) || 100; save(); });
  EDU.$$('#speed button').forEach(function (b) {
    b.addEventListener('click', function () { S.speed = b.getAttribute('data-speed'); save(); syncSpeed(); });
  });
  function syncSpeed() { EDU.$$('#speed button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-speed') === S.speed)); }); }
  $('#gd-step').addEventListener('click', function () {
    stopRun(); stopTween();
    var st = stats(cur().pts);
    if (!st.ok) { setAutoCode('need'); EDU.toast(EDU.t('need_points')); return; }
    gdStep(); save(); refresh();
  });
  $('#gd-run').addEventListener('click', function () { if (G.running) stopRun(); else startRun(); });
  $('#gd-restart').addEventListener('click', restartFlat);

  /* ------------------------------------------------------------ predict */
  var pX = $('#pred-x'), pR = $('#pred-range');
  function setPredX(v) {
    var d = cur();
    if (!isFinite(v)) return;
    d.predX = v; save();
    if (document.activeElement !== pX) pX.value = v;
    refresh();
  }
  pX.addEventListener('input', function () { var v = parseFloat(pX.value); if (isFinite(v) && Math.abs(v) < 1e9) setPredX(v); });
  pX.addEventListener('blur', function () { pX.value = cur().predX; });
  pR.addEventListener('input', function () { setPredX(roundTo(Number(pR.value), cur().rx)); pX.value = cur().predX; });

  /* ------------------------------------------------------------ dataset switching */
  function selectDs(id) {
    if (id === S.ds) return;
    stopRun(); stopTween();
    S.ds = id; ghost = null; hx = [null, null]; hover = -1; drag = null; lastTap = null;
    setFollow(false); hideExp();
    resetGD();
    save();
    renderDs();
  }
  function renderDs() {
    var d = cur();
    ORDER.forEach(function (id) {
      var b = $('#ds-' + id);
      b.setAttribute('aria-pressed', String(id === S.ds));
      $('.nm', b).textContent = C().datasets[id].name;
    });
    $('#ds-about').textContent = txt().about;
    $('#restore').hidden = S.ds === 'own' ? !d.pts.length : !d.modified;
    $('#restore').textContent = EDU.t(S.ds === 'own' ? 'clear_dots' : 'restore');
    setupSliders();
    pR.min = d.ax.xmin; pR.max = d.ax.xmax; pR.step = d.rx;
    pX.value = d.predX;
    renderTable();
    refresh();
    drawLoss();
  }
  $('#restore').addEventListener('click', function () {
    var d = cur();
    stopRun(); stopTween(); ghost = null; hideExp();
    if (S.ds === 'own') {
      if (!confirm(EDU.t('confirm_clear'))) return;
      d.pts = []; d.names = { x: '', y: '' }; d.ax = Object.assign({}, BASE.own.ax); setOwnSteps(d);
      d.m = 0; d.c = 5; d.predX = BASE.own.predX;
    } else {
      d.pts = copyPts(BASE[S.ds].pts); d.modified = false;
      EDU.toast(EDU.t('restored'));
    }
    hx = [null, null];
    if (S.follow) { var st = stats(d.pts); if (st.ok) { d.m = st.m; d.c = st.c; } }
    resetGD();
    store.remove('d_' + S.ds);
    save();
    renderDs();
  });

  /* ------------------------------------------------------------ data table */
  function renderTable() {
    var d = cur(), T = txt();
    var head = $('#t-head'), body = $('#t-body');
    head.innerHTML = ''; body.innerHTML = '';
    head.appendChild(EDU.el('tr', null,
      EDU.el('th', { text: '#' }),
      EDU.el('th', { class: 'no-i18n', text: T.xs }),
      EDU.el('th', { class: 'no-i18n', text: T.ys }),
      EDU.el('th', { text: EDU.t('col_pred') }),
      EDU.el('th', { text: EDU.t('col_err') }),
      EDU.el('th', { text: EDU.t('col_sq') }),
      EDU.el('th', { class: 'del-col' }, EDU.el('span', { class: 'tiny muted', text: '' }))));
    if (!d.pts.length) {
      body.appendChild(EDU.el('tr', null, EDU.el('td', { colspan: '7', class: 'muted', text: EDU.t('own_empty') })));
    }
    d.pts.forEach(function (q, i) {
      var ix = EDU.el('input', { type: 'number', step: 'any', class: 'cell-x', 'data-i': String(i), 'aria-label': T.xs + ' ' + (i + 1) });
      var iy = EDU.el('input', { type: 'number', step: 'any', class: 'cell-y', 'data-i': String(i), 'aria-label': T.ys + ' ' + (i + 1) });
      ix.value = q[0]; iy.value = q[1];
      ix.addEventListener('change', function () { cellEdit(i, 0, ix); });
      iy.addEventListener('change', function () { cellEdit(i, 1, iy); });
      var del = EDU.el('button', { type: 'button', class: 'btn btn-ghost btn-sm del', 'aria-label': EDU.t('del_row', { n: i + 1 }), title: EDU.t('del_row', { n: i + 1 }), text: '✕', onclick: function () {
        cur().pts.splice(i, 1); hover = -1; pointsChanged(true);
      } });
      body.appendChild(EDU.el('tr', { 'data-i': String(i) },
        EDU.el('td', { text: String(i + 1) }), EDU.el('td', null, ix), EDU.el('td', null, iy),
        EDU.el('td', { class: 'c-pred' }), EDU.el('td', { class: 'c-err' }), EDU.el('td', { class: 'c-sq' }),
        EDU.el('td', { class: 'del-col' }, del)));
    });
    $('#add-row').disabled = d.pts.length >= MAX_PTS;
    updateTable();
  }
  function cellEdit(i, k, input) {
    var d = cur(), v = parseFloat(input.value);
    if (!d.pts[i]) return;
    if (!isFinite(v) || Math.abs(v) > 1e9) { input.value = d.pts[i][k]; return; }
    d.pts[i][k] = v;
    var a = d.ax, out = d.pts[i][0] < a.xmin || d.pts[i][0] > a.xmax || d.pts[i][1] < a.ymin || d.pts[i][1] > a.ymax;
    if (out) {
      if (S.ds === 'own') { autoRange(d); setupSliders(); }
      else { d.pts[i] = clampToBox(d.pts[i][0], d.pts[i][1]); input.value = d.pts[i][k]; EDU.toast(EDU.t('kept_inside')); }
    }
    pointsChanged(false);
  }
  function updateTable() {
    var d = cur(), dc = decs(), lineOk = isFinite(d.m) && isFinite(d.c), sum = 0;
    EDU.$$('#t-body tr[data-i]').forEach(function (tr) {
      var i = Number(tr.getAttribute('data-i')), q = d.pts[i];
      if (!q) return;
      var ix = $('.cell-x', tr), iy = $('.cell-y', tr);
      if (document.activeElement !== ix && Number(ix.value) !== q[0]) ix.value = q[0];
      if (document.activeElement !== iy && Number(iy.value) !== q[1]) iy.value = q[1];
      if (!lineOk) return;
      var yh = d.m * q[0] + d.c, e = q[1] - yh;
      sum += e * e;
      $('.c-pred', tr).textContent = fmtFixed(yh, dc.y);
      var ce = $('.c-err', tr); ce.textContent = signed(e, dc.y); ce.className = 'c-err ' + (e >= 0 ? 'pos' : 'neg');
      $('.c-sq', tr).textContent = fmtAuto(e * e);
    });
    var n = d.pts.length;
    $('#mse-line').textContent = n && lineOk ? EDU.t('mse_line', { s: fmtAuto(sum), n: EDU.fmt(n), v: fmtAuto(sum / n) }) : '';
  }
  $('#add-row').addEventListener('click', function () {
    var d = cur(), a = d.ax;
    if (d.pts.length >= MAX_PTS) { EDU.toast(EDU.t('max_points', { n: MAX_PTS })); return; }
    var x = roundTo((a.xmin + a.xmax) / 2, d.rx), y = isFinite(d.m) ? d.m * x + d.c : (a.ymin + a.ymax) / 2;
    var q = clampToBox(x, roundTo(y, d.ry));
    d.pts.push(q);
    pointsChanged(true);
    var inputs = EDU.$$('#t-body .cell-x'); if (inputs.length) inputs[inputs.length - 1].focus();
  });
  $('#dl-csv').addEventListener('click', function () {
    var d = cur(), T = txt(), rows = [[T.xs, T.ys, EDU.t('col_pred'), EDU.t('col_err'), EDU.t('col_sq')]];
    d.pts.forEach(function (q) { var yh = d.m * q[0] + d.c, e = q[1] - yh; rows.push([q[0], q[1], Number(yh.toFixed(6)), Number(e.toFixed(6)), Number((e * e).toFixed(6))]); });
    EDU.download('line-of-best-fit-' + S.ds + '.csv', EDU.csv.stringify(rows), 'text/csv');
  });

  /* own data: fit the axes around the dots */
  function autoRange(d) {
    if (!d.pts.length) { d.ax = Object.assign({}, BASE.own.ax); setOwnSteps(d); return; }
    var xs = d.pts.map(function (q) { return q[0]; }), ys = d.pts.map(function (q) { return q[1]; });
    var nice = function (lo, hi) {
      if (hi - lo < 1e-9) { var pad = Math.abs(lo) * 0.1 || 1; lo -= pad; hi += pad; }
      var span = hi - lo, step = niceStep(span / 5);
      var a = Math.floor((lo - span * 0.08) / step) * step, b = Math.ceil((hi + span * 0.08) / step) * step;
      if (lo >= 0 && a < 0) a = 0;
      if (lo >= 0 && a > 0 && a < span * 0.6) a = 0;
      return [a, b];
    };
    var rx = nice(Math.min.apply(null, xs), Math.max.apply(null, xs)), ry = nice(Math.min.apply(null, ys), Math.max.apply(null, ys));
    d.ax = { xmin: rx[0], xmax: rx[1], ymin: ry[0], ymax: ry[1] };
    setOwnSteps(d);
  }

  /* ------------------------------------------------------------ paste your own data */
  $('#paste-btn').addEventListener('click', function () {
    var ta = EDU.el('textarea', { class: 'no-i18n', id: 'paste-text', rows: '8', 'aria-label': EDU.t('paste_title'), placeholder: '150, 152\n155, 157\n162, 160\n…' });
    var nx = EDU.el('input', { type: 'text', id: 'paste-x', class: 'no-i18n', maxlength: '40' });
    var ny = EDU.el('input', { type: 'text', id: 'paste-y', class: 'no-i18n', maxlength: '40' });
    nx.value = D.own.names.x; ny.value = D.own.names.y;
    var msg = EDU.el('p', { class: 'callout danger', hidden: true, role: 'alert' });
    var box = EDU.el('div', { class: 'stack paste-box' },
      EDU.el('p', { class: 'mt0', text: EDU.t('paste_hint') }),
      ta,
      EDU.el('div', { class: 'paste-names' },
        EDU.el('label', { class: 'field' }, EDU.el('span', { text: EDU.t('paste_xname') }), nx),
        EDU.el('label', { class: 'field' }, EDU.el('span', { text: EDU.t('paste_yname') }), ny)),
      msg,
      EDU.el('div', { class: 'row' }, EDU.el('button', { class: 'btn btn-primary', type: 'button', id: 'paste-go', text: EDU.t('paste_go'), onclick: go })));
    var close = EDU.modal(box, { title: EDU.t('paste_title') });
    setTimeout(function () { ta.focus(); }, 30);
    function go() {
      var rows = EDU.csv.parse(ta.value || ''), pts = [], hdr = null;
      var num = function (s) { s = String(s == null ? '' : s).trim().replace(/\s/g, ''); if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, ''); var v = Number(s); return s !== '' && isFinite(v) ? v : null; };
      rows.forEach(function (r) {
        var cells = r.length === 1 ? String(r[0]).trim().split(/\s+/) : r;
        var nums = cells.map(num).filter(function (v) { return v !== null; });
        if (nums.length >= 2) { if (pts.length < MAX_PTS) pts.push([nums[0], nums[1]]); }
        else if (!pts.length && !hdr && cells.length >= 2) hdr = cells;
      });
      if (!pts.length) { msg.textContent = EDU.t('paste_bad'); msg.hidden = false; return; }
      var d = D.own;
      d.pts = pts;
      d.names = { x: (nx.value.trim() || (hdr ? String(hdr[0]).trim() : '')).slice(0, 40), y: (ny.value.trim() || (hdr ? String(hdr[1]).trim() : '')).slice(0, 40) };
      autoRange(d);
      var my = meanY(d.pts); d.m = 0; d.c = roundTo(my, d.ry);
      d.predX = roundTo((d.ax.xmin + d.ax.xmax) / 2, d.rx);
      close();
      if (S.ds !== 'own') selectDs('own');
      else { stopRun(); ghost = null; hx = [null, null]; setFollow(false); resetGD(); renderDs(); }
      store.set('d_own', { pts: d.pts, ax: d.ax, names: d.names, m: d.m, c: d.c, predX: d.predX });
      EDU.toast(EDU.t('paste_ok', { n: pts.length }));
    }
  });

  /* ------------------------------------------------------------ experiments */
  function hideExp() { expCode = ''; $('#exp-msg').hidden = true; }
  function showExp(code) { expCode = code; var m = $('#exp-msg'); m.textContent = EDU.t('exp_' + code + '_msg'); m.hidden = false; }
  function toLab() { var lab = $('#lab'); if (lab.scrollIntoView) lab.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  $('#exp-outlier').addEventListener('click', function () {
    var d = cur(), st = stats(d.pts);
    if (!st.ok) { EDU.toast(EDU.t('need_points')); return; }
    if (d.pts.length >= MAX_PTS) { EDU.toast(EDU.t('max_points', { n: MAX_PTS })); return; }
    stopRun(); stopTween();
    ghost = { m: st.m, c: st.c };
    var xs = d.pts.map(function (q) { return q[0]; }), x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    var x = roundTo(x0 + (x1 - x0) * 0.85, d.rx), yh = st.m * x + st.c, a = d.ax, yR = a.ymax - a.ymin;
    var y = (yh - a.ymin) > (a.ymax - yh) ? a.ymin + yR * 0.04 : a.ymax - yR * 0.04;
    d.pts.push([x, roundTo(y, d.ry)]);
    setFollow(true);
    pointsChanged(true);
    $('#restore').hidden = false;
    showExp('outlier');
    toLab();
  });
  function lrExperiment(idx, code, epochs) {
    var st = stats(cur().pts);
    if (!st.ok) { EDU.toast(EDU.t('need_points')); return; }
    S.lr = idx; syncLr();
    S.epochs = epochs; epSel.value = String(epochs);
    if (S.speed === 'slow') { S.speed = 'normal'; syncSpeed(); }
    setTab('auto');
    restartFlat();
    showExp(code);
    toLab();
    startRun();
  }
  $('#exp-small').addEventListener('click', function () { lrExperiment(1, 'small', 200); });
  $('#exp-right').addEventListener('click', function () { lrExperiment(5, 'right', 200); });
  $('#exp-big').addEventListener('click', function () { lrExperiment(7, 'big', 50); });

  /* ------------------------------------------------------------ toolbar */
  $('#print-btn').addEventListener('click', function () { window.print(); });
  $('#fs-btn').addEventListener('click', function () { EDU.fullscreen($('#lab')); });
  $('#reset-all').addEventListener('click', function () {
    if (!confirm(EDU.t('confirm_reset'))) return;
    stopRun(); stopTween();
    ['state'].concat(ORDER.map(function (id) { return 'd_' + id; })).forEach(function (k) { store.remove(k); });
    clearTimeout(saveT);
    location.reload();
  });
  window.addEventListener('beforeprint', function () { printing = true; $('#print-title').textContent = EDU.t('app_title') + ': ' + C().datasets[S.ds].name; draw(); });
  window.addEventListener('afterprint', function () { printing = false; draw(); });

  /* ------------------------------------------------------------ refresh (numbers + text that change often) */
  function refresh() {
    var d = cur(), T = txt(), dc = decs(), st = stats(d.pts), lineOk = isFinite(d.m) && isFinite(d.c);
    var n = d.pts.length;
    /* equation */
    var eq = $('#equation');
    eq.setAttribute('data-m', String(d.m)); eq.setAttribute('data-c', String(d.c));
    var mS = lineOk ? (d.m < 0 ? '−' : '') + fmtFixed(Math.abs(d.m), dc.m) : '?';
    var cS = lineOk ? fmtFixed(Math.abs(d.c), dc.c) : '?';
    var op = d.c < 0 ? ' − ' : ' + ';
    eq.innerHTML = 'y = <span class="vm">' + EDU.esc(mS) + '</span>x' + op + '<span class="vc">' + EDU.esc(cS) + '</span>';
    $('#eq-words').textContent = T.ys + ' = ' + mS + ' × ' + T.xs + ' ' + op.trim() + ' ' + cS;
    /* loss */
    var L = n ? mse(d.pts, d.m, d.c) : 0;
    var mseEl = $('#mse');
    mseEl.setAttribute('data-value', String(L));
    mseEl.textContent = n ? fmtAuto(L) : '–';
    $('#miss').textContent = n ? EDU.t('miss', { v: fill(T.yv, { v: fmtMax(Math.sqrt(L), dc.y) }) }) : '';
    /* closeness */
    var pct = 0;
    if (st.ok) pct = L <= st.mse ? 100 : Math.max(0, Math.min(100, 100 * st.mse / L));
    if (st.ok && st.mse < 1e-12) pct = L < 1e-9 ? 100 : 0;
    var cl = $('#close');
    cl.setAttribute('data-value', String(pct));
    cl.textContent = st.ok ? EDU.fmt(Math.floor(pct)) + '%' : '–';
    $('#close-bar').style.width = (st.ok ? pct : 0) + '%';
    /* slope meaning */
    $('#slope-meaning').textContent = lineOk && n ? fill(T.slope, { m: signed(d.m, dc.m), m100: signed(d.m * 100, Math.max(0, dc.m - 2)), xs: T.xs, ys: T.ys }) : '';
    /* counts + hints */
    var pc = $('#pt-count'); pc.setAttribute('data-value', String(n)); pc.textContent = EDU.t('points_n', { n: EDU.fmt(n) });
    $('#restore').hidden = S.ds === 'own' ? !n : !d.modified;
    $('#canvas-hint').textContent = EDU.t('canvas_hint_' + S.tab);
    /* manual coach */
    var mc = !st.ok ? 'need' : pct >= 98 ? 'm3' : pct >= 80 ? 'm2' : pct >= 30 ? 'm1' : 'm0';
    if (mc !== manualCode) {
      manualCode = mc;
      var me = $('#coach-manual');
      me.setAttribute('data-code', mc);
      me.setAttribute('data-tone', mc === 'm3' ? 'good' : mc === 'need' ? 'warn' : '');
      $('.ico', me).textContent = { need: '✋', m0: '👉', m1: '👍', m2: '🔥', m3: '🎉' }[mc];
      $('.txt', me).textContent = EDU.t(mc === 'need' ? 'need_points' : 'coach_' + mc);
    }
    syncSliders();
    /* auto tab */
    var ep = $('#epoch'); ep.setAttribute('data-value', String(G.epoch)); ep.textContent = EDU.fmt(G.epoch);
    var gl = $('#gd-loss'); gl.setAttribute('data-value', String(L)); gl.textContent = n ? fmtAuto(L) : '–';
    var gb = $('#gd-best'); gb.setAttribute('data-value', st.ok ? String(st.mse) : ''); gb.textContent = st.ok ? fmtAuto(st.mse) : '–';
    setAutoCode(autoCode());
    $('#gd-step').disabled = G.exploded; $('#gd-run').disabled = G.exploded && !G.running;
    renderMath(st, dc);
    /* predict */
    $('#pred-x-label').textContent = T.xname;
    var px = d.predX, yh = d.m * px + d.c, py = $('#pred-y');
    py.setAttribute('data-value', String(yh));
    py.textContent = lineOk ? fill(T.yv, { v: fmtMax(yh, dc.y) }) : '–';
    if (document.activeElement !== pR) pR.value = px;
    $('#pred-sentence').textContent = lineOk ? fill(T.predict, { x: fmtMax(px, dc.x), y: fmtMax(yh, dc.y), xs: T.xs, ys: T.ys }) : '';
    var warn = [], xsArr = d.pts.map(function (q) { return q[0]; });
    if (n >= 2) {
      var lo = Math.min.apply(null, xsArr), hi = Math.max.apply(null, xsArr), pad = (hi - lo) * 0.05;
      if (px < lo - pad || px > hi + pad) warn.push(EDU.t('pred_outside', { a: fill(T.xv, { v: fmtMax(lo, dc.x) }), b: fill(T.xv, { v: fmtMax(hi, dc.x) }) }));
    }
    if (lineOk && yh < 0 && S.ds !== 'own') warn.push(EDU.t('pred_negative'));
    var pw = $('#pred-warn'); pw.hidden = !warn.length; pw.textContent = warn.join(' ');
    $('#pred-tip').hidden = !st.ok || pct >= 95;
    $('#ws-q3').textContent = EDU.t('ws_q3', { x: fmtMax(px, dc.x) });
    if (n) updateTable();
    draw();
    drawLoss();
  }
  function renderMath(st, dc) {
    var box = $('#math-body');
    if (!st.ok) { box.textContent = EDU.t('need_points'); return; }
    var f = function (v) { return fmtAuto(v); };
    var lines = [
      'n = ' + EDU.fmt(st.n),
      'x̄ = ' + f(st.mx) + '    ȳ = ' + f(st.my),
      'Σ(x − x̄)(y − ȳ) = ' + f(st.sxy),
      'Σ(x − x̄)² = ' + f(st.sxx),
      'm = ' + f(st.sxy) + ' ÷ ' + f(st.sxx) + ' = ' + fmtFixed(st.m, dc.m),
      'c = ȳ − m·x̄ = ' + f(st.my) + ' − ' + fmtFixed(st.m, dc.m) + ' × ' + f(st.mx) + ' = ' + fmtFixed(st.c, dc.c),
      'MSE = ' + f(st.mse)
    ];
    box.innerHTML = lines.map(function (s) { return '<div>' + EDU.esc(s) + '</div>'; }).join('');
  }

  /* ------------------------------------------------------------ language-dependent rendering */
  function renderConcepts() {
    var box = $('#concepts'); box.innerHTML = '';
    C().explain.forEach(function (c, i) {
      box.appendChild(EDU.el('div', { class: 'concept' },
        EDU.el('h3', null, EDU.el('span', { class: 'ico', 'aria-hidden': 'true', text: ICONS[i] || '•' }), EDU.el('span', { text: c.title })),
        EDU.el('p', { text: c.body })));
    });
  }
  function renderLang() {
    readFont();
    manualCode = ''; G.code = '';
    renderConcepts();
    syncLr(); setRunBtn();
    if (expCode) showExp(expCode);
    renderDs();
  }

  /* ------------------------------------------------------------ start */
  readFont();
  syncShow(); syncSpeed(); syncLr();
  epSel.value = String(S.epochs);
  setRunBtn();
  resetGD();
  renderConcepts();
  setTab(S.tab);
  renderDs();
  EDU.onLang(renderLang);
  EDU.onTheme(function () { draw(); drawLoss(); });
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function () { draw(); drawLoss(); });
    ro.observe(plot); ro.observe(lossCv);
  } else window.addEventListener('resize', function () { draw(); drawLoss(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { readFont(); draw(); drawLoss(); });
})();
