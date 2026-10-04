/* Clustering Lab (k-means): tap to add points, step through Assign → Update, watch inertia fall,
   and use the elbow chart to choose k. All maths lives in kmeans.js (window.KM_CORE). */
(function () {
  'use strict';
  var SLUG = 'kmeans-clustering';
  var C = window.KM_CORE;
  var store = EDU.store(SLUG);
  var KMAX = 8, MAX_POINTS = 800, TRAIL_MAX = 80;
  var DS = ['blobs3', 'blobs5', 'ring', 'random', 'customers'];
  var SPEEDS = { slow: 1100, normal: 600, fast: 160 };
  var reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ---------------- state ---------------- */
  var S = defaults();
  function defaults() {
    return {
      points: [], labels: [], cents: [], trails: [], history: [], round: 0, next: 'assign', done: false,
      k: 3, init: 'pp', ds: 'blobs3', axis: 'plain', speed: 'normal', tool: 'add',
      opts: { regions: true, lines: true, trails: true },
      names: [], elbow: null, elbowK: 0, elbowStale: false, msg: { code: 'ready', vars: {} }
    };
  }
  var running = false, timer = null, anim = null, quizPicks = [];
  var presetCache = {};
  function preset(id) { if (!presetCache[id]) presetCache[id] = C.PRESETS[id](); return presetCache[id]; }
  function copyPts(a) { return a.map(function (p) { return { x: p.x, y: p.y }; }); }
  function num(v) { return typeof v === 'number' && isFinite(v); }
  function okPt(p) { return p && num(p.x) && num(p.y); }

  /* ---------------- persistence ---------------- */
  var saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(writeState, 200);
  }
  /* closing or reloading the tab right after a change must not lose it */
  function flushSave() { if (saveTimer) { clearTimeout(saveTimer); writeState(); } }
  function writeState() {
    saveTimer = null;
    store.set('state', {
        v: 1, k: S.k, init: S.init, ds: S.ds, axis: S.axis, speed: S.speed, tool: S.tool, opts: S.opts, names: S.names,
        points: S.points.map(function (p) { return [Math.round(p.x * 100) / 100, Math.round(p.y * 100) / 100]; }),
        labels: S.labels, cents: S.cents.map(function (c) { return [c.x, c.y]; }),
        trails: S.trails.map(function (tr) { return tr.map(function (c) { return [c.x, c.y]; }); }),
        history: S.history, round: S.round, next: S.next, done: S.done, msg: S.msg,
        elbow: S.elbow, elbowK: S.elbowK, elbowStale: S.elbowStale
    });
  }
  function load() {
    var s = store.get('state', null);
    if (!s || s.v !== 1 || !Array.isArray(s.points)) return false;
    try {
      var d = defaults();
      d.points = s.points.filter(function (a) { return Array.isArray(a) && num(a[0]) && num(a[1]); }).slice(0, MAX_POINTS)
        .map(function (a) { return { x: EDU.clamp(a[0], 0, 100), y: EDU.clamp(a[1], 0, 100) }; });
      d.k = EDU.clamp(Math.round(s.k) || 3, 1, KMAX);
      d.init = s.init === 'random' ? 'random' : 'pp';
      d.ds = DS.indexOf(s.ds) >= 0 ? s.ds : 'custom';
      d.axis = s.axis === 'customers' ? 'customers' : 'plain';
      d.speed = SPEEDS[s.speed] ? s.speed : 'normal';
      d.tool = s.tool === 'erase' ? 'erase' : 'add';
      if (s.opts) ['regions', 'lines', 'trails'].forEach(function (o) { if (typeof s.opts[o] === 'boolean') d.opts[o] = s.opts[o]; });
      d.names = Array.isArray(s.names) ? s.names.slice(0, KMAX).map(function (n) { return typeof n === 'string' ? n.slice(0, 40) : ''; }) : [];
      var cents = Array.isArray(s.cents) ? s.cents.filter(function (a) { return Array.isArray(a) && num(a[0]) && num(a[1]); }).map(function (a) { return { x: a[0], y: a[1] }; }) : [];
      var labels = Array.isArray(s.labels) ? s.labels : [];
      var labelsOk = labels.length === d.points.length && labels.every(function (l) { return l === -1 || (Number.isInteger(l) && l >= 0 && l < d.k); });
      if (cents.length === d.k && d.points.length >= d.k && labelsOk) {
        d.cents = cents; d.labels = labels.slice();
        d.trails = Array.isArray(s.trails) && s.trails.length === d.k ? s.trails.map(function (tr, j) {
          var pts = Array.isArray(tr) ? tr.filter(function (a) { return Array.isArray(a) && num(a[0]) && num(a[1]); }).map(function (a) { return { x: a[0], y: a[1] }; }) : [];
          return pts.length ? pts.slice(-TRAIL_MAX) : [{ x: cents[j].x, y: cents[j].y }];
        }) : cents.map(function (c) { return [{ x: c.x, y: c.y }]; });
        d.history = Array.isArray(s.history) ? s.history.filter(num) : [];
        d.round = Number.isInteger(s.round) && s.round >= 0 ? s.round : 0;
        d.next = s.next === 'update' && d.labels.some(function (l) { return l >= 0; }) ? 'update' : 'assign';
        d.done = !!s.done && d.labels.every(function (l) { return l >= 0; });
        if (d.done) d.next = 'done';
        d.msg = s.msg && typeof s.msg.code === 'string' && hasMsg(s.msg.code) ? { code: s.msg.code, vars: s.msg.vars && typeof s.msg.vars === 'object' ? s.msg.vars : {} } : { code: 'ready', vars: {} };
      } else {
        d.labels = d.points.map(function () { return -1; });
      }
      if (Array.isArray(s.elbow) && s.elbow.every(function (e) { return e && num(e.k) && num(e.inertia); })) {
        d.elbow = s.elbow; d.elbowK = Number.isInteger(s.elbowK) ? s.elbowK : 0; d.elbowStale = !!s.elbowStale;
      }
      S = d;
      if (!S.cents.length) newStart(true);
      return true;
    } catch (e) { return false; }
  }

  /* ---------------- messages (stored as code + numbers, translated when shown) ---------------- */
  function n0(v) { return num(v) ? v : 0; }
  var MSG = {
    ready: function (v) { return EDU.t('msg_ready', { k: EDU.fmt(S.k) }); },
    assign: function (v) { return EDU.t('msg_assign', { n: EDU.fmt(n0(v.n)), c: EDU.fmt(n0(v.c)) }); },
    update: function (v) {
      var s = EDU.t('msg_update', { n: EDU.fmt(n0(v.n)) });
      var empty = Array.isArray(v.empty) ? v.empty.filter(num) : [];
      if (empty.length) s += ' ' + EDU.t('msg_empty', { list: empty.map(function (x) { return EDU.fmt(x); }).join(', ') });
      return s;
    },
    done: function (v) { return EDU.t('msg_done', { n: EDU.fmt(n0(v.n)), v: fmtInertia(n0(v.v)) }); },
    need: function () { return EDU.t('msg_need', { k: EDU.fmt(S.k) }); },
    data: function () { return EDU.t('msg_data'); },
    drag: function () { return EDU.t('msg_drag'); }
  };
  function hasMsg(code) { return Object.prototype.hasOwnProperty.call(MSG, code); }
  function setMsg(code, vars) { S.msg = { code: code, vars: vars || {} }; }
  function fmtInertia(v) { return EDU.fmt(v, { maximumFractionDigits: v < 100 ? 1 : 0 }); }

  /* ---------------- k-means steps ---------------- */
  function hasLabels() { for (var i = 0; i < S.labels.length; i++) if (S.labels[i] >= 0) return true; return false; }
  function currentInertia() { return hasLabels() && S.cents.length ? C.inertia(S.points, S.labels, S.cents) : null; }

  function newStart(silent) {
    stopRun();
    anim = null;
    S.labels = S.points.map(function () { return -1; });
    S.history = []; S.round = 0; S.done = false; S.next = 'assign';
    if (S.points.length < S.k || C.distinctCount(S.points) < 1) {
      S.cents = []; S.trails = [];
      setMsg('need');
    } else {
      S.cents = C.init(S.points, S.k, S.init, Math.random);
      S.trails = S.cents.map(function (c) { return [{ x: c.x, y: c.y }]; });
      setMsg('ready');
    }
    if (!silent) { renderAll(); save(); }
  }

  /* One step. Returns false when nothing can be done. */
  function doStep() {
    if (S.done || !S.cents.length) return false;
    if (S.next === 'assign') {
      var a = C.assign(S.points, S.cents, S.labels);
      S.round++;
      S.labels = a.labels;
      S.history.push(a.inertia);
      if (a.changed === 0 && S.round > 1) {
        S.done = true; S.next = 'done';
        setMsg('done', { n: S.round, v: a.inertia });
      } else {
        S.next = 'update';
        setMsg('assign', { n: S.round, c: a.changed });
      }
    } else {
      var u = C.update(S.points, S.labels, S.cents);
      startAnim(S.cents, u.cents);
      S.cents = u.cents;
      S.trails.forEach(function (tr, j) {
        var last = tr[tr.length - 1];
        if (!last || C.d2(last, u.cents[j]) > 1e-9) tr.push({ x: u.cents[j].x, y: u.cents[j].y });
        if (tr.length > TRAIL_MAX) tr.splice(0, tr.length - TRAIL_MAX);
      });
      S.next = 'assign';
      setMsg('update', { n: S.round, empty: u.empty.map(function (j) { return j + 1; }) });
    }
    return true;
  }
  function step() {
    if (!S.cents.length) { setMsg('need'); renderAll(); return; }
    doStep(); renderAll(); save();
  }

  /* ---------------- run (animated) ---------------- */
  function startRun() {
    if (S.done || !S.cents.length) { renderAll(); return; }
    running = true; renderControls(); tick();
  }
  function stopRun() {
    running = false; clearTimeout(timer); timer = null;
    if (EDU.$('#run')) renderControls();
  }
  function tick() {
    if (!running) return;
    var ok = doStep();
    renderAll(); save();
    if (!ok || S.done) { stopRun(); return; }
    timer = setTimeout(tick, SPEEDS[S.speed] || 600);
  }

  /* smooth centre movement during Update */
  function startAnim(from, to) {
    var dur = reduceMotion ? 0 : Math.min(450, (SPEEDS[S.speed] || 600) * 0.7);
    if (!dur) { anim = null; return; }
    anim = { from: copyPts(from), to: copyPts(to), t0: performance.now(), dur: dur };
    requestAnimationFrame(animFrame);
  }
  function animFrame() {
    if (!anim) return;
    drawBoard();
    if (performance.now() - anim.t0 >= anim.dur) { anim = null; drawBoard(); return; }
    requestAnimationFrame(animFrame);
  }
  function shownCents() {
    if (!anim) return S.cents;
    var t = EDU.clamp((performance.now() - anim.t0) / anim.dur, 0, 1), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    if (anim.to.length !== S.cents.length) return S.cents;
    return anim.to.map(function (c, j) { var f = anim.from[j] || c; return { x: f.x + (c.x - f.x) * e, y: f.y + (c.y - f.y) * e }; });
  }

  /* ---------------- data changes ---------------- */
  function loadPreset(id) {
    stopRun();
    S.points = copyPts(preset(id));
    S.ds = id; S.axis = id === 'customers' ? 'customers' : 'plain';
    S.names = []; S.elbow = null; S.elbowK = 0; S.elbowStale = false;
    newStart(true);
    renderAll(); save();
  }
  function dataChanged() {
    S.ds = 'custom';
    if (S.elbow) S.elbowStale = true;
    S.labels = S.points.map(function () { return -1; });
    S.history = []; S.round = 0; S.done = false; S.next = 'assign';
    if (S.points.length < S.k) { S.cents = []; S.trails = []; setMsg('need'); }
    else if (S.cents.length !== S.k) { newStart(true); }
    else { S.trails = S.cents.map(function (c) { return [{ x: c.x, y: c.y }]; }); setMsg('data'); }
  }
  function setK(k) {
    k = EDU.clamp(k, 1, KMAX);
    if (k === S.k && S.cents.length === k) return;
    S.k = k; S.names = [];
    newStart(true);
    renderAll(); save();
  }

  /* ---------------- colours ---------------- */
  var pal = {};
  function readPalette() {
    ['text', 'muted', 'border', 'surface', 'surface-2', 'primary', 'accent', 'success', 'warning'].forEach(function (n) { pal[n] = EDU.css('--' + n) || '#888'; });
    pal.c = [];
    for (var i = 1; i <= KMAX; i++) pal.c.push(EDU.css('--c' + i) || '#888');
    pal.rgb = pal.c.map(toRGB);
    pal.dark = EDU.theme() === 'dark';
    pal.font = getComputedStyle(document.body).fontFamily || 'sans-serif';
  }
  function toRGB(s) {
    s = String(s).trim();
    var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
    if (m) {
      var h = m[1].length === 3 ? m[1].replace(/(.)/g, '$1$1') : m[1];
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(s);
    return m ? [+m[1], +m[2], +m[3]] : [128, 128, 128];
  }
  function alpha(hex, a) { var c = toRGB(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function font(px, w) { return (w || 600) + ' ' + px + 'px ' + pal.font; }

  /* ---------------- canvas helpers ---------------- */
  function fitCanvas(cv) {
    var w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    if (!w || !h) return null;
    var W = Math.round(w * dpr), H = Math.round(h * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.direction = document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr';
    return { ctx: ctx, w: w, h: h };
  }
  function haloText(ctx, txt, x, y, color) {
    ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = pal.surface; ctx.strokeText(txt, x, y);
    ctx.fillStyle = color || pal.text; ctx.fillText(txt, x, y);
  }

  /* axis ticks for the current dataset */
  function ticks() {
    if (S.axis === 'customers') {
      return {
        x: [20, 30, 40, 50, 60, 70].map(function (a) { return { v: C.ageToX(a), t: EDU.fmt(a) }; }),
        y: [0, 2000, 4000, 6000, 8000, 10000].map(function (r) { return { v: C.rupeesToY(r), t: '₹' + EDU.fmt(r) }; }),
        xt: EDU.t('axis_age'), yt: EDU.t('axis_spend')
      };
    }
    var t = [0, 20, 40, 60, 80, 100].map(function (v) { return { v: v, t: EDU.fmt(v) }; });
    return { x: t, y: t, xt: EDU.t('axis_f1'), yt: EDU.t('axis_f2') };
  }

  var geom = null;   // last board geometry (for pointer maths)
  function boardGeom(ctx, w, h, tk) {
    var tf = Math.max(11, Math.min(14, w / 40));
    ctx.font = font(tf, 500);
    var tw = 0; tk.y.forEach(function (o) { tw = Math.max(tw, ctx.measureText(o.t).width); });
    var tt = tf + 3;
    var padL = Math.ceil(tw) + 10 + tt + 8, padB = tf + 8 + tt + 8, padT = 12, padR = 14;
    var s = Math.max(60, Math.min(w - padL - padR, h - padT - padB));
    var x0 = padL + Math.max(0, (w - padL - padR - s) / 2), y0 = padT + Math.max(0, h - padT - padB - s);
    return { x0: x0, y0: y0, s: s, tf: tf, tt: tt, w: w, h: h, r: EDU.clamp(s / 115, 2.6, 6.5) };
  }
  function toPx(g, p) { return { x: g.x0 + p.x / 100 * g.s, y: g.y0 + (1 - p.y / 100) * g.s }; }
  function toData(g, px, py) { return { x: (px - g.x0) / g.s * 100, y: (1 - (py - g.y0) / g.s) * 100 }; }

  /* ---------------- the board ---------------- */
  var regionCanvas = document.createElement('canvas');
  function drawBoard() {
    var cv = EDU.$('#board'), f = fitCanvas(cv);
    if (!f) return;
    var ctx = f.ctx, tk = ticks(), g = boardGeom(ctx, f.w, f.h, tk);
    geom = g;
    var cents = shownCents(), k = cents.length, i, j;
    ctx.clearRect(0, 0, f.w, f.h);
    ctx.fillStyle = pal.surface; ctx.fillRect(0, 0, f.w, f.h);

    // regions: each pixel takes the faint colour of its nearest centre
    if (S.opts.regions && k) {
      var n = Math.max(40, Math.min(220, Math.round(g.s / 2.5)));
      regionCanvas.width = n; regionCanvas.height = n;
      var rc = regionCanvas.getContext('2d'), img = rc.createImageData(n, n), A = Math.round((pal.dark ? 0.2 : 0.13) * 255);
      for (var gy = 0; gy < n; gy++) for (var gx = 0; gx < n; gx++) {
        var q = { x: (gx + 0.5) / n * 100, y: (1 - (gy + 0.5) / n) * 100 }, best = 0, bd = Infinity;
        for (j = 0; j < k; j++) { var dx = q.x - cents[j].x, dy = q.y - cents[j].y, dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; best = j; } }
        var o = (gy * n + gx) * 4, c = pal.rgb[best];
        img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = A;
      }
      rc.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(regionCanvas, g.x0, g.y0, g.s, g.s);
    }

    // grid + axes
    ctx.strokeStyle = alpha(pal.border, 0.9); ctx.lineWidth = 1;
    for (i = 0; i <= 10; i++) {
      var gp = g.x0 + i / 10 * g.s, gq = g.y0 + i / 10 * g.s;
      ctx.beginPath(); ctx.moveTo(gp, g.y0); ctx.lineTo(gp, g.y0 + g.s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(g.x0, gq); ctx.lineTo(g.x0 + g.s, gq); ctx.stroke();
    }
    ctx.strokeStyle = pal.muted; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(g.x0, g.y0); ctx.lineTo(g.x0, g.y0 + g.s); ctx.lineTo(g.x0 + g.s, g.y0 + g.s); ctx.stroke();
    ctx.fillStyle = pal.muted; ctx.font = font(g.tf, 500);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    tk.x.forEach(function (o) { var p = toPx(g, { x: o.v, y: 0 }); ctx.fillText(o.t, p.x, g.y0 + g.s + 5); });
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    tk.y.forEach(function (o) { var p = toPx(g, { x: 0, y: o.v }); ctx.fillText(o.t, g.x0 - 6, p.y); });
    ctx.fillStyle = pal.text; ctx.font = font(g.tt, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(tk.xt, g.x0 + g.s / 2, f.h - 4);
    ctx.save(); ctx.translate(g.tt + 2, g.y0 + g.s / 2); ctx.rotate(-Math.PI / 2); ctx.textBaseline = 'middle'; ctx.fillText(tk.yt, 0, 0); ctx.restore();

    // clip drawing of data to the plot square
    ctx.save();
    ctx.beginPath(); ctx.rect(g.x0 - g.r - 2, g.y0 - g.r - 2, g.s + 2 * g.r + 4, g.s + 2 * g.r + 4); ctx.clip();

    var P = S.points.map(function (p) { return toPx(g, p); }), CP = cents.map(function (c) { return toPx(g, c); });

    // lines from each point to its centre
    if (S.opts.lines && k) {
      ctx.lineWidth = 1;
      for (j = 0; j < k; j++) {
        ctx.strokeStyle = alpha(pal.c[j], pal.dark ? 0.32 : 0.28);
        ctx.beginPath();
        for (i = 0; i < P.length; i++) if (S.labels[i] === j) { ctx.moveTo(P[i].x, P[i].y); ctx.lineTo(CP[j].x, CP[j].y); }
        ctx.stroke();
      }
    }

    // trails of the centres
    if (S.opts.trails && k) {
      for (j = 0; j < k; j++) {
        var tr = (S.trails[j] || []).map(function (c) { return toPx(g, c); });
        if (!tr.length) continue;
        ctx.strokeStyle = pal.c[j]; ctx.lineWidth = 2.2; ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.moveTo(tr[0].x, tr[0].y);
        for (i = 1; i < tr.length; i++) ctx.lineTo(tr[i].x, tr[i].y);
        ctx.lineTo(CP[j].x, CP[j].y); ctx.stroke(); ctx.setLineDash([]);
        for (i = 0; i < tr.length; i++) {
          ctx.beginPath(); ctx.arc(tr[i].x, tr[i].y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = pal.surface; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = pal.c[j]; ctx.stroke();
        }
      }
    }

    // points
    var r = g.r;
    for (i = 0; i < P.length; i++) {
      var l = S.labels[i];
      ctx.beginPath(); ctx.arc(P[i].x, P[i].y, r, 0, Math.PI * 2);
      if (l >= 0 && l < k) {
        ctx.fillStyle = pal.c[l]; ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = pal.surface; ctx.stroke();
      } else {
        ctx.fillStyle = pal.surface; ctx.fill();
        ctx.lineWidth = 1.6; ctx.strokeStyle = pal.muted; ctx.stroke();
      }
    }

    // centres: big crosses with their number (and the name you gave the group)
    var cs = Math.max(9, r * 2.6);
    for (j = 0; j < k; j++) {
      var cx = CP[j].x, cy = CP[j].y;
      ctx.lineCap = 'round';
      ctx.strokeStyle = pal.surface; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(cx - cs, cy - cs); ctx.lineTo(cx + cs, cy + cs); ctx.moveTo(cx + cs, cy - cs); ctx.lineTo(cx - cs, cy + cs); ctx.stroke();
      ctx.strokeStyle = pal.text; ctx.lineWidth = 6.5; ctx.stroke();
      ctx.strokeStyle = pal.c[j]; ctx.lineWidth = 4; ctx.stroke();
      ctx.lineCap = 'butt';
      var bx = cx + cs + 7, by = cy - cs - 3, br = Math.max(8, g.tf * 0.72);
      ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fillStyle = pal.c[j]; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = pal.surface; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = font(Math.round(br * 1.25), 800); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (pal.dark) ctx.fillStyle = '#0e181c';
      ctx.fillText(EDU.fmt(j + 1), bx, by + 0.5);
      if (S.names[j]) { ctx.font = font(g.tf + 1, 700); ctx.textBaseline = 'top'; haloText(ctx, S.names[j], cx, cy + cs + 5, pal.text); }
    }
    ctx.restore();

    if (!S.points.length) {
      ctx.font = font(Math.max(14, g.tf + 3), 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      haloText(ctx, EDU.t('canvas_empty'), g.x0 + g.s / 2, g.y0 + g.s / 2, pal.muted);
    }
    cv.setAttribute('aria-label', EDU.t('canvas_aria', { n: EDU.fmt(S.points.length), k: EDU.fmt(k) }));
  }

  /* ---------------- pointer: add / erase / drag a centre ---------------- */
  var drag = null;
  function evPos(e) { var r = EDU.$('#board').getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function inPlot(px) { return geom && px.x >= geom.x0 - 8 && px.x <= geom.x0 + geom.s + 8 && px.y >= geom.y0 - 8 && px.y <= geom.y0 + geom.s + 8; }
  function clampData(d) { return { x: EDU.clamp(d.x, 0, 100), y: EDU.clamp(d.y, 0, 100) }; }
  var maxWarned = false;
  function addPoint(d) {
    if (S.points.length >= MAX_POINTS) { if (!maxWarned) { maxWarned = true; EDU.toast(EDU.t('max_points', { n: EDU.fmt(MAX_POINTS) })); } return false; }
    S.points.push({ x: Math.round(d.x * 100) / 100, y: Math.round(d.y * 100) / 100 });
    return true;
  }
  function eraseAt(d) {
    var R2 = 4.5 * 4.5, before = S.points.length;
    S.points = S.points.filter(function (p) { return C.d2(p, d) > R2; });
    return S.points.length !== before;
  }
  function onDown(e) {
    if (!geom || (e.button !== undefined && e.button > 0)) return;
    var px = evPos(e);
    if (!inPlot(px)) return;
    stopRun(); anim = null;
    var cv = EDU.$('#board');
    try { cv.setPointerCapture(e.pointerId); } catch (x) { }
    e.preventDefault();
    // grab a centre? It only starts moving once the finger really moves, so a plain tap
    // on a cross does not throw away the rounds done so far.
    var hit = -1, hd = Math.max(20, geom.r * 4.5);
    S.cents.forEach(function (c, j) { var p = toPx(geom, c), d = Math.hypot(p.x - px.x, p.y - px.y); if (d < hd) { hd = d; hit = j; } });
    maxWarned = false;
    if (hit >= 0) { drag = { mode: 'grab', j: hit, start: px }; return; }
    toolDown(clampData(toData(geom, px.x, px.y)));
  }
  function toolDown(d) {
    if (S.tool === 'erase') {
      drag = { mode: 'erase' };
      if (eraseAt(d)) { dataChanged(); renderAll(); }
    } else {
      drag = { mode: 'add', last: d };
      if (addPoint(d)) { dataChanged(); renderAll(); }
    }
  }
  function onMove(e) {
    if (!drag || !geom) return;
    var px = evPos(e), d = clampData(toData(geom, px.x, px.y));
    if (drag.mode === 'grab') {
      if (Math.hypot(px.x - drag.start.x, px.y - drag.start.y) < 6) return;
      drag = { mode: 'centre', j: drag.j, moved: true };
      S.labels = S.points.map(function () { return -1; });
      S.history = []; S.round = 0; S.done = false; S.next = 'assign';
    }
    if (drag.mode === 'centre') {
      S.cents[drag.j] = d;
      drawBoard();
    } else if (drag.mode === 'erase') {
      if (eraseAt(d)) { dataChanged(); renderAll(); }
    } else {
      var gap = Math.sqrt(C.d2(d, drag.last));
      if (gap >= 2.4) {   // brush: one point every ~2.4 units, with a little scatter
        var jx = (Math.random() - 0.5) * 3, jy = (Math.random() - 0.5) * 3;
        if (addPoint(clampData({ x: d.x + jx, y: d.y + jy }))) { drag.last = d; dataChanged(); renderAll(); }
      }
    }
  }
  function onUp(e) {
    if (!drag) return;
    if (drag.mode === 'grab') {   // a tap on a cross without moving: just use the tool there
      var g = drag; drag = null;
      if (e && e.type === 'pointerup' && geom) { toolDown(clampData(toData(geom, g.start.x, g.start.y))); drag = null; save(); }
      return;
    }
    if (drag.mode === 'centre') {
      S.trails = S.cents.map(function (c) { return [{ x: c.x, y: c.y }]; });
      setMsg('drag');
      renderAll();
    }
    drag = null;
    save();
  }

  /* ---------------- side panel + stats ---------------- */
  function renderControls() {
    var stepBtn = EDU.$('#step');
    stepBtn.textContent = S.done ? EDU.t('step_done') : S.next === 'update' ? EDU.t('step_update') : EDU.t('step_assign');
    stepBtn.disabled = S.done || !S.cents.length || running;
    var runBtn = EDU.$('#run');
    runBtn.setAttribute('aria-pressed', running ? 'true' : 'false');
    EDU.$('#run-txt').textContent = running ? EDU.t('pause') : EDU.t('run');
    EDU.$('#run-ico').textContent = running ? '⏸' : '▶';
    runBtn.disabled = !running && (S.done || !S.cents.length);
    EDU.$('#new-start').disabled = S.points.length < S.k;
    EDU.$$('#speed button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.speed === S.speed ? 'true' : 'false'); });
  }
  function renderStats() {
    EDU.$('#round').textContent = EDU.fmt(S.round);
    EDU.$('#round').dataset.value = S.round;
    var I = currentInertia(), el = EDU.$('#inertia');
    el.textContent = I === null ? '–' : fmtInertia(I);
    el.dataset.value = I === null ? '' : String(I);
    EDU.$('#npoints').textContent = EDU.fmt(S.points.length);
    EDU.$('#npoints').dataset.value = S.points.length;
    var pa = EDU.$('#ph-assign'), pu = EDU.$('#ph-update');
    pa.className = 'phase' + (S.done ? ' done' : S.next === 'assign' && S.cents.length ? ' on' : '');
    pu.className = 'phase' + (S.done ? ' done' : S.next === 'update' ? ' on' : '');
    var m = EDU.$('#msg');
    var code = S.msg.code === 'need' || !S.cents.length ? 'need' : hasMsg(S.msg.code) ? S.msg.code : 'ready';
    m.dataset.code = code;
    m.textContent = MSG[code](S.msg.vars || {});
    EDU.$('#print-sum').textContent = EDU.t('print_sum', { k: EDU.fmt(S.k), v: I === null ? '–' : fmtInertia(I), n: EDU.fmt(S.round), p: EDU.fmt(S.points.length) });
  }
  function renderSide() {
    EDU.$$('.ds-btn').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.ds === S.ds ? 'true' : 'false'); });
    var note = EDU.$('#cust-note');
    note.hidden = S.axis !== 'customers' || !S.points.length;
    if (!note.hidden) note.textContent = EDU.t('customers_note', { n: EDU.fmt(S.points.length) });
    EDU.$$('#tools button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.tool === S.tool ? 'true' : 'false'); });
    EDU.$('#board').classList.toggle('erase', S.tool === 'erase');
    EDU.$('#count-line').textContent = EDU.t('points_count', { n: EDU.fmt(S.points.length) });
    EDU.$('#clear-pts').disabled = !S.points.length;
    EDU.$('#k-val').textContent = EDU.fmt(S.k);
    EDU.$('#k-val').dataset.value = S.k;
    EDU.$('#k-minus').disabled = S.k <= 1;
    EDU.$('#k-plus').disabled = S.k >= KMAX;
    var dots = EDU.$('#k-dots'); dots.innerHTML = '';
    for (var j = 0; j < S.k; j++) dots.appendChild(EDU.el('span', { style: { background: 'var(--c' + (j + 1) + ')' } }));
    EDU.$$('#init button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.init === S.init ? 'true' : 'false'); });
    EDU.$('#init-hint').textContent = EDU.t(S.init === 'random' ? 'init_hint_random' : 'init_hint_pp');
    EDU.$('#opt-regions').checked = S.opts.regions;
    EDU.$('#opt-lines').checked = S.opts.lines;
    EDU.$('#opt-trails').checked = S.opts.trails;
  }

  /* dataset thumbnails */
  function drawThumbs() {
    EDU.$$('.ds-btn').forEach(function (b) {
      var cv = b.querySelector('canvas'), ctx = cv.getContext('2d'), pts = preset(b.dataset.ds), W = cv.width;
      ctx.clearRect(0, 0, W, W);
      ctx.fillStyle = b.dataset.ds === 'customers' ? pal.c[1] : pal.primary;
      pts.forEach(function (p) { ctx.beginPath(); ctx.arc(6 + p.x / 100 * (W - 12), 6 + (1 - p.y / 100) * (W - 12), 2.6, 0, Math.PI * 2); ctx.fill(); });
    });
  }

  /* ---------------- groups table ---------------- */
  var groupsSig = '';
  function groupStats() {
    var k = S.cents.length, out = [], j;
    for (j = 0; j < k; j++) out.push({ n: 0, sx: 0, sy: 0 });
    S.points.forEach(function (p, i) { var l = S.labels[i]; if (l >= 0 && l < k) { out[l].n++; out[l].sx += p.x; out[l].sy += p.y; } });
    return out;
  }
  function renderGroups() {
    var tbl = EDU.$('#groups'), k = S.cents.length, assigned = hasLabels();
    EDU.$('#groups-empty').hidden = k > 0 && assigned;
    tbl.parentNode.hidden = !k;
    if (!k) { groupsSig = ''; return; }
    var cust = S.axis === 'customers';
    var sig = [k, S.axis, EDU.lang].join('|');
    if (sig !== groupsSig) {
      groupsSig = sig;
      tbl.innerHTML = '';
      tbl.classList.toggle('cust', cust);
      var head = EDU.el('tr', null,
        EDU.el('th', { text: EDU.t('col_group') }),
        EDU.el('th', { text: EDU.t('col_points') }),
        cust ? [EDU.el('th', { text: EDU.t('col_age') }), EDU.el('th', { text: EDU.t('col_spend') })] : EDU.el('th', { text: EDU.t('col_centre') }),
        EDU.el('th', { text: EDU.t('col_name') }));
      tbl.appendChild(EDU.el('thead', null, head));
      var body = EDU.el('tbody');
      for (var j = 0; j < k; j++) {
        (function (j) {
          var inp = EDU.el('input', { type: 'text', class: 'no-i18n', maxlength: '40', id: 'gname-' + (j + 1), placeholder: EDU.t('name_ph'), 'aria-label': EDU.t('col_name') + ' · ' + EDU.t('group_n', { n: EDU.fmt(j + 1) }) });
          inp.value = S.names[j] || '';
          inp.addEventListener('input', function () { S.names[j] = inp.value.slice(0, 40); drawBoard(); save(); });
          body.appendChild(EDU.el('tr', null,
            EDU.el('td', { class: 'gname' }, EDU.el('span', { class: 'sw', style: { background: 'var(--c' + (j + 1) + ')' } }),
              EDU.el('span', { class: 'g-long', text: EDU.t('group_n', { n: EDU.fmt(j + 1) }) }), EDU.el('span', { class: 'g-short', 'aria-hidden': 'true', text: EDU.fmt(j + 1) })),
            EDU.el('td', { class: 'num g-count' }),
            cust ? [EDU.el('td', { class: 'num g-a' }), EDU.el('td', { class: 'num g-b' })] : EDU.el('td', { class: 'num g-a' }),
            EDU.el('td', null, inp)));
        })(j);
      }
      tbl.appendChild(body);
    }
    var st = groupStats(), rows = EDU.$$('tbody tr', tbl);
    rows.forEach(function (tr, j) {
      var g = st[j], c = S.cents[j];
      tr.querySelector('.g-count').textContent = assigned ? EDU.fmt(g.n) : '–';
      if (cust) {
        var has = assigned && g.n > 0;
        tr.querySelector('.g-a').textContent = has ? EDU.fmt(C.xToAge(g.sx / g.n), { maximumFractionDigits: 0 }) : '–';
        tr.querySelector('.g-b').textContent = has ? '₹' + EDU.fmt(Math.round(C.yToRupees(g.sy / g.n) / 10) * 10) : '–';
      } else {
        tr.querySelector('.g-a').textContent = '\u2066(' + EDU.fmt(c.x, { maximumFractionDigits: 1 }) + ', ' + EDU.fmt(c.y, { maximumFractionDigits: 1 }) + ')\u2069';   // isolate: keeps (x, y) order in Urdu
      }
      var inp = tr.querySelector('input');
      if (document.activeElement !== inp && inp.value !== (S.names[j] || '')) inp.value = S.names[j] || '';
    });
  }

  /* ---------------- small line charts (history + elbow) ---------------- */
  function lineChart(cv, opts) {
    var f = fitCanvas(cv);
    if (!f) return null;
    var ctx = f.ctx, w = f.w, h = f.h, vals = opts.vals;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = pal.surface; ctx.fillRect(0, 0, w, h);
    var tf = 12;
    if (!vals.length) {
      ctx.fillStyle = pal.muted; ctx.font = font(14, 600); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      wrapText(ctx, opts.empty, w / 2, h / 2, w - 30, 20);
      return null;
    }
    var max = Math.max.apply(null, vals.map(function (v) { return v.y; })) || 1;
    var nice = niceMax(max), steps = 4;
    ctx.font = font(tf, 500);
    var lw = 0;
    for (var s = 0; s <= steps; s++) lw = Math.max(lw, ctx.measureText(EDU.fmt(nice * s / steps)).width);
    var padL = lw + 12, padR = 16, padT = 16, padB = 40;
    var pw = Math.max(20, w - padL - padR), ph = Math.max(20, h - padT - padB);
    var n = opts.xMax - opts.xMin;
    var X = function (x) { return padL + (n ? (x - opts.xMin) / n : 0.5) * pw; };
    var Y = function (y) { return padT + (1 - y / nice) * ph; };
    ctx.strokeStyle = pal.border; ctx.lineWidth = 1; ctx.fillStyle = pal.muted;
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (s = 0; s <= steps; s++) {
      var yy = Y(nice * s / steps);
      ctx.beginPath(); ctx.moveTo(padL, yy); ctx.lineTo(padL + pw, yy); ctx.stroke();
      ctx.fillText(EDU.fmt(nice * s / steps), padL - 6, yy);
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    var every = Math.max(1, Math.ceil((opts.xMax - opts.xMin + 1) / Math.max(2, Math.floor(pw / 34))));
    for (var x = opts.xMin; x <= opts.xMax; x++) if ((x - opts.xMin) % every === 0 || x === opts.xMax) ctx.fillText(EDU.fmt(x), X(x), padT + ph + 5);
    ctx.fillStyle = pal.text; ctx.font = font(12.5, 700); ctx.textBaseline = 'bottom';
    ctx.fillText(opts.xLabel, padL + pw / 2, h - 3);
    // line
    ctx.strokeStyle = pal.primary; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    ctx.beginPath();
    vals.forEach(function (v, i) { var px = X(v.x), py = Y(v.y); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
    ctx.stroke();
    var pts = vals.map(function (v) { return { x: X(v.x), y: Y(v.y), v: v }; });
    pts.forEach(function (p) {
      ctx.beginPath(); ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2); ctx.fillStyle = pal.primary; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = pal.surface; ctx.stroke();
    });
    if (opts.after) opts.after(ctx, pts, { padL: padL, padT: padT, pw: pw, ph: ph, X: X, Y: Y });
    return pts;
  }
  function niceMax(v) {
    var p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p;
    var nm = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10;
    return nm * p;
  }
  function wrapText(ctx, txt, x, y, maxW, lh) {
    var words = String(txt).split(/\s+/), lines = [], cur = '';
    words.forEach(function (wd) { var test = cur ? cur + ' ' + wd : wd; if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = test; });
    if (cur) lines.push(cur);
    var y0 = y - (lines.length - 1) * lh / 2;
    lines.forEach(function (l, i) { ctx.fillText(l, x, y0 + i * lh); });
  }

  function drawHistory() {
    var vals = S.history.map(function (v, i) { return { x: i + 1, y: v }; });
    EDU.$('#history-box').classList.toggle('print-empty', !vals.length);   // nothing to print yet
    lineChart(EDU.$('#history'), {
      vals: vals, xMin: 1, xMax: Math.max(2, vals.length), xLabel: EDU.t('axis_round'), empty: EDU.t('history_empty'),
      after: function (ctx, pts, g) {
        // label the latest value, kept inside the plot so it never covers the axis numbers
        var last = pts[pts.length - 1], label = fmtInertia(last.v.y);
        ctx.font = font(12.5, 700); ctx.textAlign = 'center';
        var half = ctx.measureText(label).width / 2 + 3;
        var x = Math.max(g.padL + half + 4, Math.min(last.x, g.padL + g.pw - half));
        var above = last.y - 7 - 14 >= 0;
        ctx.textBaseline = above ? 'bottom' : 'top';
        haloText(ctx, label, x, above ? last.y - 7 : last.y + 8, pal.primary);
      }
    });
  }

  var elbowPts = [];
  function drawElbow() {
    var vals = (S.elbow || []).map(function (e) { return { x: e.k, y: e.inertia }; });
    elbowPts = lineChart(EDU.$('#elbow'), {
      vals: vals, xMin: 1, xMax: Math.max(2, vals.length ? vals[vals.length - 1].x : 8), xLabel: EDU.t('axis_k'), empty: EDU.t('elbow_empty'),
      after: function (ctx, pts) {
        pts.forEach(function (p) {
          if (p.v.x === S.k) {
            ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2); ctx.lineWidth = 2.5; ctx.strokeStyle = pal.text; ctx.stroke();
          }
          if (p.v.x === S.elbowK) {
            ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fillStyle = pal.accent; ctx.fill();
            ctx.font = font(13, 800); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
            haloText(ctx, '↓ ' + EDU.t('elbow_tag'), p.x, p.y - 12, pal.accent);
          }
        });
      }
    }) || [];
  }
  function renderElbow() {
    var out = EDU.$('#elbow-out'), use = EDU.$('#use-k'), has = !!(S.elbow && S.elbow.length);
    EDU.$('#elbow-card').classList.toggle('print-empty', !has);
    out.dataset.stale = S.elbowStale ? 'true' : 'false';
    out.dataset.k = has ? String(S.elbowK) : '';
    if (!has) out.textContent = '';
    else if (S.elbowStale) out.textContent = EDU.t('elbow_stale');
    else out.textContent = S.elbowK ? EDU.t('elbow_found', { k: EDU.fmt(S.elbowK) }) : EDU.t('elbow_none');
    use.hidden = !has || S.elbowStale || !S.elbowK || S.elbowK === S.k;
    if (!use.hidden) use.textContent = EDU.t('use_k', { k: EDU.fmt(S.elbowK) });
    EDU.$('#elbow-tip').hidden = !has;
    EDU.$('#elbow-nums').hidden = !has;
    var tbl = EDU.$('#elbow-table');
    tbl.innerHTML = '';
    if (has) {
      tbl.appendChild(EDU.el('thead', null, EDU.el('tr', null, EDU.el('th', { text: EDU.t('col_k') }), EDU.el('th', { text: EDU.t('stat_inertia') }), EDU.el('th', { text: EDU.t('col_drop') }))));
      var body = EDU.el('tbody');
      S.elbow.forEach(function (e, i) {
        var drop = i ? S.elbow[i - 1].inertia - e.inertia : null;
        body.appendChild(EDU.el('tr', null, EDU.el('td', { text: EDU.fmt(e.k) }), EDU.el('td', { class: 'num', text: fmtInertia(e.inertia) }), EDU.el('td', { class: 'num', text: drop === null ? '–' : fmtInertia(drop) })));
      });
      tbl.appendChild(body);
    }
    drawElbow();
  }
  function computeElbow() {
    stopRun();
    if (S.points.length < 2 || C.distinctCount(S.points) < 2) { S.elbow = null; EDU.toast(EDU.t('msg_need', { k: EDU.fmt(2) })); renderElbow(); return; }
    S.elbow = C.elbow(S.points, KMAX, 10, Math.random);
    S.elbowK = C.suggestK(S.elbow);
    S.elbowStale = false;
    renderElbow(); save();
  }

  /* ---------------- quiz ---------------- */
  function quizData() { var Q = window.APP_CONTENT || {}; return ((Q[EDU.lang] || Q.en || {}).quiz) || []; }
  function renderQuiz() {
    var list = EDU.$('#quiz-list'), qs = quizData(), score = 0;
    list.innerHTML = '';
    qs.forEach(function (q, qi) {
      var picked = quizPicks[qi], answered = picked !== undefined && picked !== null;
      if (answered && picked === q.ok) score++;
      var box = EDU.el('div', { class: 'quiz-q', id: 'quiz-q' + (qi + 1) });
      box.appendChild(EDU.el('p', { class: 'q', text: EDU.fmt(qi + 1) + '. ' + q.q }));
      var opts = EDU.el('div', { class: 'opts', role: 'group' });
      q.a.forEach(function (ans, ai) {
        var cls = 'btn opt';
        if (answered && ai === q.ok) cls += ' right';
        else if (answered && ai === picked) cls += ' picked-wrong';
        opts.appendChild(EDU.el('button', {
          type: 'button', class: cls, text: ans, disabled: answered, 'data-i': String(ai),
          onclick: function () { quizPicks[qi] = ai; renderQuiz(); }
        }));
      });
      box.appendChild(opts);
      if (answered) {
        box.appendChild(EDU.el('p', { class: 'why ' + (picked === q.ok ? 'ok' : 'bad') },
          EDU.el('b', { text: picked === q.ok ? EDU.t('correct') : EDU.t('wrong') }), ' ', q.why));
      }
      list.appendChild(box);
    });
    var sc = EDU.$('#quiz-score');
    sc.textContent = EDU.t('quiz_score', { n: EDU.fmt(score), total: EDU.fmt(qs.length) });
    sc.dataset.value = score;
  }

  /* ---------------- render everything ---------------- */
  function renderAll() {
    renderControls(); renderStats(); renderSide(); renderGroups();
    drawBoard(); drawHistory(); renderElbow();
  }
  function redrawCanvases() { drawBoard(); drawHistory(); drawElbow(); drawThumbs(); }

  /* ---------------- wire up ---------------- */
  EDU.$('#step').addEventListener('click', function () { stopRun(); step(); });
  EDU.$('#run').addEventListener('click', function () { if (running) stopRun(); else startRun(); });
  EDU.$('#new-start').addEventListener('click', function () { newStart(); });
  EDU.$$('#speed button').forEach(function (b) { b.addEventListener('click', function () { S.speed = b.dataset.speed; renderControls(); save(); }); });
  EDU.$('#fs-btn').addEventListener('click', function () { EDU.fullscreen(EDU.$('#km')); });
  EDU.$('#print-btn').addEventListener('click', function () { window.print(); });
  EDU.$$('.ds-btn').forEach(function (b) { b.addEventListener('click', function () { loadPreset(b.dataset.ds); }); });
  EDU.$$('#tools button').forEach(function (b) { b.addEventListener('click', function () { S.tool = b.dataset.tool; renderSide(); save(); }); });
  EDU.$('#clear-pts').addEventListener('click', function () {
    stopRun(); S.points = []; S.names = []; dataChanged(); renderAll(); save();
  });
  EDU.$('#k-minus').addEventListener('click', function () { setK(S.k - 1); });
  EDU.$('#k-plus').addEventListener('click', function () { setK(S.k + 1); });
  EDU.$$('#init button').forEach(function (b) {
    b.addEventListener('click', function () { if (S.init === b.dataset.init) return; S.init = b.dataset.init; newStart(); });
  });
  ['regions', 'lines', 'trails'].forEach(function (o) {
    EDU.$('#opt-' + o).addEventListener('change', function (e) { S.opts[o] = e.target.checked; drawBoard(); save(); });
  });
  EDU.$('#reset-all').addEventListener('click', function () {
    if (!confirm(EDU.t('confirm_reset'))) return;
    stopRun(); store.remove('state'); S = defaults(); quizPicks = [];
    loadPreset('blobs3'); renderQuiz();
  });
  EDU.$('#elbow-btn').addEventListener('click', computeElbow);
  EDU.$('#use-k').addEventListener('click', function () { if (S.elbowK) setK(S.elbowK); });
  EDU.$('#elbow').addEventListener('click', function (e) {
    if (!elbowPts.length || S.elbowStale) return;
    var r = e.currentTarget.getBoundingClientRect(), x = e.clientX - r.left, best = null, bd = Infinity;
    elbowPts.forEach(function (p) { var d = Math.abs(p.x - x); if (d < bd) { bd = d; best = p; } });
    if (best && bd < 40) setK(best.v.x);
  });
  EDU.$('#quiz-again').addEventListener('click', function () { quizPicks = []; renderQuiz(); });

  window.addEventListener('pagehide', flushSave);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flushSave(); });

  var cv = EDU.$('#board');
  cv.addEventListener('pointerdown', onDown);
  cv.addEventListener('pointermove', onMove);
  cv.addEventListener('pointerup', onUp);
  cv.addEventListener('pointercancel', onUp);
  cv.addEventListener('lostpointercapture', onUp);

  // keep canvases sharp when their size changes (rotate phone, fullscreen, smartboard)
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function () { redrawCanvases(); });
    ['#board', '#history', '#elbow'].forEach(function (s) { ro.observe(EDU.$(s)); });
  } else window.addEventListener('resize', redrawCanvases);

  // print with light colours even in dark mode
  var themeBeforePrint = null;
  window.addEventListener('beforeprint', function () {
    themeBeforePrint = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'light');
    readPalette(); redrawCanvases();
  });
  window.addEventListener('afterprint', function () {
    if (themeBeforePrint) document.documentElement.setAttribute('data-theme', themeBeforePrint);
    else document.documentElement.removeAttribute('data-theme');
    readPalette(); redrawCanvases();
  });

  EDU.onTheme(function () { readPalette(); redrawCanvases(); });
  EDU.onLang(function () { readPalette(); groupsSig = ''; renderAll(); renderQuiz(); drawThumbs(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { readPalette(); redrawCanvases(); });

  // read-only peek for the automated test
  window.KM_DEBUG = function () {
    return JSON.parse(JSON.stringify({ points: S.points, labels: S.labels, cents: S.cents, history: S.history, k: S.k, round: S.round, done: S.done, next: S.next, ds: S.ds, elbow: S.elbow, elbowK: S.elbowK, msg: S.msg.code, names: S.names,
      geom: geom ? { x0: geom.x0, y0: geom.y0, s: geom.s } : null }));
  };

  /* ---------------- start ---------------- */
  readPalette();
  if (!load()) { S = defaults(); S.points = copyPts(preset('blobs3')); newStart(true); }
  renderAll();
  renderQuiz();
  drawThumbs();
})();
