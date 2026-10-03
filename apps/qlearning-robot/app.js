/* Robot Learns by Reward: reinforcement learning (Q-learning) in a 7 x 7 grid world.
   Logic lives in ql.js (window.QL); this file is the UI: board, controls, chart, brain panel, quiz. */
(function () {
  'use strict';
  var SLUG = 'qlearning-robot';
  var N = QL.N, NS = QL.NS, A = QL.A;
  var EMPTY = QL.EMPTY, WALL = QL.WALL, PIT = QL.PIT, GOAL = QL.GOAL;
  var MAX_STEPS = 100, PLAY_MAX = 60, EPS_MIN = 0.01, DECAY = 0.99, HIST_MAX = 5000, AVG_W = 20;
  var ARROWS = ['↑', '→', '↓', '←'];
  var ACT_KEYS = ['act_up', 'act_right', 'act_down', 'act_left'];
  var SPEEDS = { slow: 600, normal: 260, fast: 70 };
  var DEF = { alpha: 0.5, gamma: 0.9, eps: 0.3, decay: true, cost: 0.1 };
  var PRESET_NAMES = ['simple', 'maze', 'cliff', 'empty'];
  var store = EDU.store(SLUG);
  var t = EDU.t, $ = EDU.$, $$ = EDU.$$, el = EDU.el;
  var rnd = Math.random;
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ------------------------------------------------------------ state */
  function fresh(preset) {
    var w = QL.parse(QL.PRESETS[preset] || QL.PRESETS.simple);
    return {
      grid: w.grid, start: w.start, preset: preset, Q: new Float64Array(NS * A),
      alpha: DEF.alpha, gamma: DEF.gamma, eps: DEF.eps, decay: DEF.decay, cost: DEF.cost, epsNow: DEF.eps,
      episodes: 0, hist: [], outc: '',
      view: { heat: true, arrows: true, q: false, nums: false },
      tool: 'cycle', speed: 'normal', look: w.start
    };
  }
  function numIn(v, lo, hi, d) { v = Number(v); return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; }
  function load() {
    var s = fresh('simple'), d = store.get('state', null);
    if (!d || typeof d !== 'object') return s;
    try {
      var g = QL.decode(d.grid);
      if (g) {
        s.grid = g;
        var st = Number(d.start);
        if (!(st >= 0 && st < NS && st === Math.floor(st))) st = s.start;
        s.grid[st] = EMPTY; s.start = st;
        s.preset = PRESET_NAMES.indexOf(d.preset) >= 0 ? d.preset : 'custom';
      }
      if (Array.isArray(d.Q) && d.Q.length === NS * A) for (var i = 0; i < NS * A; i++) s.Q[i] = numIn(d.Q[i], -1e6, 1e6, 0);
      s.alpha = numIn(d.alpha, 0.01, 1, DEF.alpha);
      s.gamma = numIn(d.gamma, 0, 0.99, DEF.gamma);
      s.eps = numIn(d.eps, 0, 1, DEF.eps);
      s.epsNow = numIn(d.epsNow, 0, 1, s.eps);
      s.cost = numIn(d.cost, 0, 2, DEF.cost);
      s.decay = d.decay === undefined ? DEF.decay : !!d.decay;
      s.episodes = Math.floor(numIn(d.episodes, 0, 1e9, 0));
      if (Array.isArray(d.hist)) s.hist = d.hist.map(function (x) { return numIn(x, -1e6, 1e6, 0); }).slice(-HIST_MAX);
      s.outc = typeof d.outc === 'string' ? d.outc.replace(/[^gpt]/g, '').slice(-s.hist.length) : '';
      if (s.outc.length !== s.hist.length) { s.hist = []; s.outc = ''; }
      if (s.episodes < s.hist.length) s.episodes = s.hist.length;
      if (d.view && typeof d.view === 'object') ['heat', 'arrows', 'q', 'nums'].forEach(function (k) { if (k in d.view) s.view[k] = !!d.view[k]; });
      if (['cycle', 'start', 'look'].indexOf(d.tool) >= 0) s.tool = d.tool;
      if (SPEEDS[d.speed]) s.speed = d.speed;
      var lk = Number(d.look); s.look = lk >= 0 && lk < NS ? Math.floor(lk) : s.start;
    } catch (e) { return fresh('simple'); }
    return s;
  }
  var S = load();

  var saveT = 0;
  function save() { clearTimeout(saveT); saveT = setTimeout(saveNow, 250); }
  function r4(v) { return Math.round(v * 10000) / 10000; }
  function saveNow() {
    store.set('state', {
      grid: QL.encode(S.grid), start: S.start, preset: S.preset, Q: Array.prototype.map.call(S.Q, r4),
      alpha: S.alpha, gamma: S.gamma, eps: S.eps, epsNow: r4(S.epsNow), cost: S.cost, decay: S.decay,
      episodes: S.episodes, hist: S.hist, outc: S.outc, view: S.view, tool: S.tool, speed: S.speed, look: S.look
    });
  }

  var run = { active: false, s: S.start, steps: 0, total: 0 };   // learning episode in progress
  var robotAt = S.start, trail = [], trailKind = 'learn';
  var busy = null, timer = 0;                                    // busy: 'episode' | 'play'
  var lastUpd = null, lastPlay = null, kcur = -1;
  var msgFn = null, msgCode = '';

  /* ------------------------------------------------------------ helpers */
  function nz(v, d) { var p = Math.pow(10, d); return (Math.round(v * p) / p) || 0; }
  function fD(v, d) { return EDU.fmt(nz(v, d), { minimumFractionDigits: d, maximumFractionDigits: d }); }
  var LRI = String.fromCharCode(0x2066), PDI = String.fromCharCode(0x2069);   /* Unicode left-to-right isolate */
  function iso(s) { return document.documentElement.dir === 'rtl' ? LRI + s + PDI : s; }   /* keep "-0.1" readable inside Urdu text */
  function f2(v) { return iso(fD(v, 2)); }
  function fr(v) { return iso(EDU.fmt(nz(v, 2), { maximumFractionDigits: 2 })); }
  function fp(v) { return v < 0 ? '(' + f2(v) + ')' : f2(v); }   /* number inside a formula */
  function cellName(i) { return t('cell_name', { r: EDU.fmt(Math.floor(i / N) + 1), c: EDU.fmt(i % N + 1) }); }
  function actName(a) { return t(ACT_KEYS[a]) + ' ' + ARROWS[a]; }
  function hasGoal() { for (var i = 0; i < NS; i++) if (S.grid[i] === GOAL) return true; return false; }
  function visited(i) { for (var a = 0; a < A; a++) if (S.Q[i * A + a] !== 0) return true; return false; }
  function W() { return { grid: S.grid, Q: S.Q, alpha: S.alpha, gamma: S.gamma, eps: S.epsNow, cost: S.cost }; }

  function setMsg(fn, code) { msgFn = fn; msgCode = code || ''; renderMsg(); }
  function renderMsg() { var m = $('#msg'); m.textContent = msgFn ? msgFn() : ''; m.setAttribute('data-code', msgCode); }

  /* ------------------------------------------------------------ learning */
  function finishEpisode(outcome, total) {
    run.active = false;
    S.episodes++;
    S.hist.push(nz(total, 2)); S.outc += outcome.charAt(0);
    if (S.hist.length > HIST_MAX) { var cut = S.hist.length - HIST_MAX; S.hist.splice(0, cut); S.outc = S.outc.slice(cut); }
    if (S.decay && S.epsNow > EPS_MIN) S.epsNow = Math.max(EPS_MIN, S.epsNow * DECAY);
  }

  function stepOnce() {
    if (!run.active) { run.active = true; run.s = S.start; run.steps = 0; run.total = 0; trail = [S.start]; trailKind = 'learn'; }
    var w = W(), info = QL.learnStep(w, run.s, rnd);
    info.alpha = w.alpha; info.gamma = w.gamma;
    run.steps++; run.total += info.r; run.s = info.s2; trail.push(info.s2);
    info.steps = run.steps; info.total = run.total;
    if (info.done || run.steps >= MAX_STEPS) {
      info.ended = info.outcome || 'timeout';
      finishEpisode(info.ended, run.total);
      info.episode = S.episodes;
    }
    lastUpd = info; S.look = info.s;
    return info;
  }

  function checkGoal() {
    if (hasGoal()) return true;
    setMsg(function () { return t('msg_no_goal'); }, 'warn');
    return false;
  }

  function stepMsg(info) {
    var s = t(info.explore ? 'msg_explore' : 'msg_exploit', { act: actName(info.a) });
    if (info.bump) s += ' ' + t('msg_bump');
    if (info.outcome === 'goal') s += ' ' + t('msg_goal');
    else if (info.outcome === 'pit') s += ' ' + t('msg_pit');
    else s += ' ' + t('msg_reward', { r: fr(info.r) });
    return s;
  }
  function endMsg(info) {
    var k = info.ended === 'goal' ? 'msg_end_goal' : info.ended === 'pit' ? 'msg_end_pit' : 'msg_end_timeout';
    return t(k, { n: EDU.fmt(info.episode), s: EDU.fmt(info.steps), r: fr(info.total) });
  }
  function showStep(info) {
    animate(info.s, info.s2, info.bump ? info.a : -1);
    setMsg(function () { return info.ended ? stepMsg(info) + ' ' + endMsg(info) : stepMsg(info); },
      info.ended ? (info.ended === 'goal' ? 'good' : 'bad') : 'step');
    renderStats(); renderBrain(); renderUpd();
    if (info.ended) drawChart();
  }

  function oneStep() {
    if (busy) stopBusy(true);
    if (!checkGoal()) return;
    showStep(stepOnce());
    save();
  }

  function startEpisode() {
    if (busy === 'episode') { stopBusy(); return; }
    if (busy) stopBusy(true);
    if (!checkGoal()) return;
    busy = 'episode'; updateButtons();
    tick();
  }
  function tick() {
    if (busy !== 'episode') return;
    var info = stepOnce();
    showStep(info);
    if (info.ended) { busy = null; updateButtons(); save(); return; }
    timer = setTimeout(tick, SPEEDS[S.speed]);
  }

  function fast(n) {
    if (busy) stopBusy(true);
    if (!checkGoal()) return;
    var counts = { goal: 0, pit: 0, timeout: 0 };
    for (var k = 0; k < n; k++) {
      var s = run.active ? run.s : S.start, total = run.active ? run.total : 0, steps = run.active ? run.steps : 0, out = 'timeout';
      var w = W();
      while (steps < MAX_STEPS) {
        var info = QL.learnStep(w, s, rnd);
        total += info.r; steps++; s = info.s2;
        if (info.done) { out = info.outcome; break; }
      }
      finishEpisode(out, total);
      counts[out]++;
    }
    trail = []; robotAt = S.start; lastUpd = null; lastPlay = null; tween = null;
    setMsg(function () { return t('msg_fast', { n: EDU.fmt(n), g: EDU.fmt(counts.goal), p: EDU.fmt(counts.pit), t: EDU.fmt(counts.timeout) }); }, 'good');
    renderStats(); renderBrain(); renderUpd(); draw(); drawChart(); save();
  }

  function startPlay() {
    if (busy === 'play') { stopBusy(); return; }
    if (busy) stopBusy(true);
    if (!checkGoal()) return;
    run.active = false;                                     /* an unfinished training episode is dropped */
    var res = QL.playPath(S.grid, S.Q, S.start, PLAY_MAX, rnd);
    var best = QL.shortest(S.grid, S.start), k = 0;
    busy = 'play'; updateButtons();
    trail = [S.start]; trailKind = 'play'; robotAt = S.start; tween = null; lastPlay = null;
    setMsg(function () { return t('msg_playing'); }, 'step');
    draw();
    (function next() {
      if (busy !== 'play') return;
      if (k >= res.path.length - 1) {
        busy = null; updateButtons();
        lastPlay = { outcome: res.outcome, steps: res.steps, best: best };
        if (res.outcome === 'goal') {
          setMsg(function () {
            var m = t('msg_play_goal', { s: EDU.fmt(res.steps), best: EDU.fmt(best) });
            return res.steps === best ? m + ' ' + t('msg_play_best') : m;
          }, 'good');
        } else setMsg(function () { return t(res.outcome === 'pit' ? 'msg_play_pit' : 'msg_play_lost'); }, 'bad');
        return;
      }
      var from = res.path[k], to = res.path[k + 1], a = res.acts[k];
      k++;
      trail.push(to);
      animate(from, to, from === to ? a : -1);
      timer = setTimeout(next, SPEEDS[S.speed]);
    })();
  }

  function stopBusy(silent) {
    clearTimeout(timer);
    var was = busy;
    busy = null; updateButtons();
    if (was && !silent) setMsg(function () { return t('msg_stopped'); }, '');
    save();
  }

  function resetLearning() {
    S.Q = new Float64Array(NS * A);
    S.episodes = 0; S.hist = []; S.outc = ''; S.epsNow = S.eps;
    run.active = false; trail = []; robotAt = S.start; lastUpd = null; lastPlay = null; tween = null;
  }

  function worldChanged() {
    run.active = false; trail = []; robotAt = S.start; lastPlay = null; tween = null;
    S.epsNow = S.eps;
    if (S.preset !== 'custom') { S.preset = 'custom'; renderPresets(); }
    if (!hasGoal()) setMsg(function () { return t('msg_no_goal'); }, 'warn');
    else if (QL.shortest(S.grid, S.start) < 0) setMsg(function () { return t('msg_unreachable'); }, 'warn');
    else setMsg(function () { return t('msg_world', { e: f2(S.eps) }); }, '');
    renderStats(); renderBrain(); draw(); drawChart(); save();
  }
  function zeroQ(i) { for (var a = 0; a < A; a++) S.Q[i * A + a] = 0; }

  function loadPreset(name) {
    if (busy) stopBusy(true);
    var w = QL.parse(QL.PRESETS[name]);
    S.grid = w.grid; S.start = w.start; S.preset = name; S.look = w.start;
    resetLearning();
    setMsg(function () { return t('msg_preset', { name: t('preset_' + name) }); }, '');
    renderPresets(); renderStats(); renderBrain(); renderUpd(); draw(); drawChart(); save();
  }

  /* ------------------------------------------------------------ editing the world */
  var paint = null;
  function applyTool(i, first) {
    if (S.tool === 'look') { S.look = i; renderBrain(); draw(); save(); return; }
    if (S.tool === 'start') {
      if (!first || i === S.start) return;
      if (busy) stopBusy(true);
      if (S.grid[i] !== EMPTY) { S.grid[i] = EMPTY; zeroQ(i); }
      S.start = i; worldChanged(); return;
    }
    if (i === S.start) { if (first) setMsg(function () { return t('msg_start_cell'); }, 'warn'); return; }
    if (first) paint = { type: (S.grid[i] + 1) % 4 };
    if (!paint || S.grid[i] === paint.type) return;
    if (busy) stopBusy(true);
    S.grid[i] = paint.type; zeroQ(i);
    worldChanged();
  }

  /* ------------------------------------------------------------ colours */
  var P = null;
  function rgb(c) {
    c = String(c || '').trim();
    var m = /^#([0-9a-f]{3})$/i.exec(c);
    if (m) return [0, 1, 2].map(function (k) { return parseInt(m[1][k] + m[1][k], 16); });
    m = /^#([0-9a-f]{6})/i.exec(c);
    if (m) return [0, 2, 4].map(function (k) { return parseInt(m[1].slice(k, k + 2), 16); });
    m = /rgba?\(([^)]+)\)/i.exec(c);
    if (m) { var p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat); return [p[0] || 0, p[1] || 0, p[2] || 0]; }
    return [128, 128, 128];
  }
  function mix(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
  function css(c, al) { var s = Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]); return al === undefined ? 'rgb(' + s + ')' : 'rgba(' + s + ',' + al + ')'; }
  function lum(c) { return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; }
  function ink(c) { return lum(c) > 0.55 ? '#111' : '#f4f4f4'; }

  var LIGHT = { '--surface': '#ffffff', '--surface-2': '#f2f2f2', '--text': '#000000', '--muted': '#444444', '--border': '#bbbbbb', '--primary': '#0b4f5c',
    '--accent': '#d9501c', '--success': '#15803d', '--danger': '#b42318', '--c6': '#b08900', '--c1': '#0b7285', '--success-soft': '#dcfce7', '--danger-soft': '#fee4e2' };
  function readPalette(print) {
    var get = function (k) { return print ? LIGHT[k] : (EDU.css(k) || LIGHT[k]); };
    P = {};
    ['--surface', '--surface-2', '--text', '--muted', '--border', '--primary', '--accent', '--success', '--danger', '--c6', '--c1', '--success-soft', '--danger-soft'].forEach(function (k) {
      P[k.slice(2)] = rgb(get(k));
    });
    P.wall = mix(P.surface, P.muted, 0.72);
    P.dark = lum(P.surface) < 0.4;
    P.font = getComputedStyle(document.body).fontFamily || 'sans-serif';
  }
  function heat(v) {
    var tt = Math.max(-1, Math.min(1, v / 10));
    if (Math.abs(tt) < 1e-9) return P.surface;
    var k = Math.min(0.9, Math.sqrt(Math.abs(tt)) * 0.82 + 0.06);
    return mix(P.surface, tt > 0 ? P.success : P.danger, k);
  }

  /* ------------------------------------------------------------ drawing */
  var board = $('#board'), chart = $('#chart');
  function sizeCanvas(cv) {
    var w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 3);
    if (!w || !h) return null;
    var Wd = Math.round(w * dpr), Hd = Math.round(h * dpr);
    if (cv.width !== Wd || cv.height !== Hd) { cv.width = Wd; cv.height = Hd; }
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function drawWall(ctx, x, y, cs) {
    ctx.fillStyle = css(P.wall); ctx.fillRect(x, y, cs, cs);
    ctx.strokeStyle = css(P.surface, 0.45); ctx.lineWidth = Math.max(1, cs * 0.03);
    ctx.beginPath();
    for (var k = 1; k < 3; k++) { ctx.moveTo(x, y + cs * k / 3); ctx.lineTo(x + cs, y + cs * k / 3); }
    for (var row = 0; row < 3; row++) {
      var off = row % 2 ? cs / 4 : cs / 2;
      for (var bx = off; bx < cs; bx += cs / 2) { ctx.moveTo(x + bx, y + cs * row / 3); ctx.lineTo(x + bx, y + cs * (row + 1) / 3); }
    }
    ctx.stroke();
  }
  function drawPit(ctx, x, y, cs, noLabel) {
    ctx.fillStyle = css(P['danger-soft']); ctx.fillRect(x, y, cs, cs);
    var cx = x + cs / 2, cy = y + cs * (noLabel ? 0.5 : 0.42);
    ctx.beginPath(); ctx.ellipse(cx, cy, cs * 0.34, cs * 0.24, 0, 0, Math.PI * 2);
    var gr = ctx.createRadialGradient(cx, cy, cs * 0.02, cx, cy, cs * 0.34);
    gr.addColorStop(0, '#000'); gr.addColorStop(1, '#3a3a3a');
    ctx.fillStyle = gr; ctx.fill();
    ctx.lineWidth = Math.max(1.5, cs * 0.05); ctx.strokeStyle = css(P.danger); ctx.stroke();
    if (!noLabel) cellLabel(ctx, '−10', cx, y + cs * 0.86, cs, P.danger);
  }
  function drawGoal(ctx, x, y, cs, noLabel) {
    ctx.fillStyle = css(P['success-soft']); ctx.fillRect(x, y, cs, cs);
    var cx = x + cs / 2, y0 = y + cs * (noLabel ? 0.24 : 0.14), s = cs;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.18, y0); ctx.lineTo(cx + s * 0.18, y0); ctx.lineTo(cx + s * 0.32, y0 + s * 0.13);
    ctx.lineTo(cx, y0 + s * 0.48); ctx.lineTo(cx - s * 0.32, y0 + s * 0.13); ctx.closePath();
    ctx.fillStyle = css(P.c6); ctx.fill();
    ctx.lineWidth = Math.max(1, cs * 0.03); ctx.strokeStyle = css(mix(P.c6, [0, 0, 0], 0.35)); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.32, y0 + s * 0.13); ctx.lineTo(cx + s * 0.32, y0 + s * 0.13);
    ctx.moveTo(cx - s * 0.08, y0); ctx.lineTo(cx - s * 0.12, y0 + s * 0.13); ctx.lineTo(cx, y0 + s * 0.48);
    ctx.moveTo(cx + s * 0.08, y0); ctx.lineTo(cx + s * 0.12, y0 + s * 0.13); ctx.lineTo(cx, y0 + s * 0.48);
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = Math.max(1, cs * 0.02); ctx.stroke();
    if (!noLabel) cellLabel(ctx, '+10', cx, y + cs * 0.86, cs, P.success);
  }
  function cellLabel(ctx, txt, x, y, cs, col) {
    ctx.font = '800 ' + Math.max(9, cs * 0.19) + 'px "Noto Sans", system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = css(col); ctx.fillText(txt, x, y);
  }
  function drawStartPad(ctx, x, y, cs) {
    ctx.save();
    ctx.setLineDash([Math.max(2, cs * 0.07), Math.max(2, cs * 0.05)]);
    ctx.lineWidth = Math.max(1.5, cs * 0.04); ctx.strokeStyle = css(P.primary, 0.75);
    ctx.beginPath(); ctx.arc(x + cs / 2, y + cs / 2, cs * 0.38, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  function drawRobot(ctx, px, py, cs) {
    var u = cs;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath(); ctx.ellipse(px, py + u * 0.33, u * 0.26, u * 0.06, 0, 0, Math.PI * 2); ctx.fill();
    // antenna
    ctx.strokeStyle = css(P.text); ctx.lineWidth = Math.max(1.2, u * 0.03);
    ctx.beginPath(); ctx.moveTo(px, py - u * 0.25); ctx.lineTo(px, py - u * 0.36); ctx.stroke();
    ctx.fillStyle = css(P.accent); ctx.beginPath(); ctx.arc(px, py - u * 0.38, u * 0.055, 0, Math.PI * 2); ctx.fill();
    // wheels
    ctx.fillStyle = css(P.text);
    rr(ctx, px - u * 0.22, py + u * 0.2, u * 0.13, u * 0.12, u * 0.04); ctx.fill();
    rr(ctx, px + u * 0.09, py + u * 0.2, u * 0.13, u * 0.12, u * 0.04); ctx.fill();
    // body + head
    ctx.fillStyle = css(P.primary);
    rr(ctx, px - u * 0.27, py - u * 0.26, u * 0.54, u * 0.48, u * 0.12); ctx.fill();
    ctx.lineWidth = Math.max(1.2, u * 0.025); ctx.strokeStyle = css(P.dark ? P.surface : mix(P.primary, [0, 0, 0], 0.4)); ctx.stroke();
    // face screen
    ctx.fillStyle = css(P.dark ? mix(P.primary, [0, 0, 0], 0.65) : P.surface);
    rr(ctx, px - u * 0.2, py - u * 0.18, u * 0.4, u * 0.24, u * 0.07); ctx.fill();
    ctx.fillStyle = css(P.dark ? P.primary : mix(P.primary, [0, 0, 0], 0.2));
    ctx.beginPath(); ctx.arc(px - u * 0.09, py - u * 0.07, u * 0.045, 0, Math.PI * 2); ctx.arc(px + u * 0.09, py - u * 0.07, u * 0.045, 0, Math.PI * 2); ctx.fill();
    // smile
    ctx.strokeStyle = css(P.accent); ctx.lineWidth = Math.max(1, u * 0.025);
    ctx.beginPath(); ctx.arc(px, py + u * 0.0, u * 0.07, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    ctx.restore();
  }
  function drawArrow(ctx, cx, cy, a, len, lw, centred) {
    var dx = QL.DC[a], dy = QL.DR[a];
    var x0 = centred ? cx - dx * len * 0.5 : cx + dx * len * 0.12, y0 = centred ? cy - dy * len * 0.5 : cy + dy * len * 0.12;
    var x1 = centred ? cx + dx * len * 0.5 : cx + dx * len, y1 = centred ? cy + dy * len * 0.5 : cy + dy * len;
    var hs = lw * 2.1, bx = x1 - dx * hs, by = y1 - dy * hs, px = -dy, py = dx;
    function path() {
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(bx, by); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(bx + px * hs * 0.85, by + py * hs * 0.85); ctx.lineTo(bx - px * hs * 0.85, by - py * hs * 0.85); ctx.closePath();
    }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = css(P.surface, 0.9); ctx.lineWidth = lw + 3; path(); ctx.stroke();
    ctx.strokeStyle = css(P.text); ctx.lineWidth = lw; ctx.fillStyle = css(P.text); path(); ctx.fill();
  }
  var TRI = [[0, 0, 1, 0], [1, 0, 1, 1], [1, 1, 0, 1], [0, 1, 0, 0]];   /* outer edge of each action's triangle */
  var TRI_TXT = [[0.5, 0.19], [0.8, 0.5], [0.5, 0.81], [0.2, 0.5]];
  function drawCell(ctx, i, cs) {
    var x = (i % N) * cs, y = Math.floor(i / N) * cs, tp = S.grid[i];
    if (tp === WALL) return drawWall(ctx, x, y, cs);
    if (tp === PIT) return drawPit(ctx, x, y, cs);
    if (tp === GOAL) return drawGoal(ctx, x, y, cs);
    var cx = x + cs / 2, cy = y + cs / 2, V = QL.maxQ(S.Q, i), vis = visited(i), a;
    if (S.view.q) {
      for (a = 0; a < A; a++) {
        var e = TRI[a];
        ctx.beginPath(); ctx.moveTo(x + e[0] * cs, y + e[1] * cs); ctx.lineTo(x + e[2] * cs, y + e[3] * cs); ctx.lineTo(cx, cy); ctx.closePath();
        ctx.fillStyle = css(S.view.heat ? heat(S.Q[i * A + a]) : P.surface); ctx.fill();
      }
      ctx.strokeStyle = css(P.border); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cs, y + cs); ctx.moveTo(x + cs, y); ctx.lineTo(x, y + cs); ctx.stroke();
    } else if (S.view.heat) { ctx.fillStyle = css(heat(V)); ctx.fillRect(x, y, cs, cs); }
    if (i === S.start) drawStartPad(ctx, x, y, cs);
    var numsBelow = S.view.nums && !S.view.q;
    if (S.view.arrows && vis) {
      var best = QL.bestActions(S.Q, i);
      if (best.length < A) {
        var acy = numsBelow ? cy - cs * 0.1 : cy, sc = S.view.q ? 0.55 : (numsBelow ? 0.8 : 1);
        var lw = Math.max(1.6, cs * 0.065 * sc);
        if (best.length === 1) drawArrow(ctx, cx, acy, best[0], cs * 0.52 * sc, lw, true);
        else best.forEach(function (b) { drawArrow(ctx, cx, acy, b, cs * 0.34 * sc, lw, false); });
      }
    }
    if (S.view.nums && vis) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (S.view.q) {
        var fs = cs * 0.15;
        if (fs >= 7.5) {
          ctx.font = '700 ' + fs + 'px "Noto Sans", system-ui, sans-serif';
          for (a = 0; a < A; a++) {
            var q = S.Q[i * A + a];
            ctx.fillStyle = ink(S.view.heat ? heat(q) : P.surface);
            ctx.fillText(fD(q, 1), x + TRI_TXT[a][0] * cs, y + TRI_TXT[a][1] * cs);
          }
        }
      } else {
        ctx.font = '700 ' + Math.max(8.5, cs * 0.19) + 'px "Noto Sans", system-ui, sans-serif';
        ctx.fillStyle = ink(S.view.heat ? heat(V) : P.surface);
        ctx.fillText(fD(V, 1), cx, cy + cs * 0.3);
      }
    }
  }

  var tween = null, raf = 0;
  function animate(from, to, bumpDir) {
    robotAt = to;
    var dur = reduceMotion ? 0 : Math.min(SPEEDS[S.speed] * 0.85, 320);
    tween = dur > 0 ? { from: from, to: to, dir: bumpDir, t0: performance.now(), dur: dur } : null;
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function frame(now) {
    raf = 0;
    if (tween && now - tween.t0 >= tween.dur) tween = null;
    drawBoard(now);
    if (tween) raf = requestAnimationFrame(frame);
  }
  function draw() { if (!raf) drawBoard(performance.now()); }
  function cellXY(i) { return [i % N + 0.5, Math.floor(i / N) + 0.5]; }
  function robotPos(now) {
    if (!tween) return cellXY(robotAt);
    var p = Math.max(0, Math.min(1, (now - tween.t0) / tween.dur)), a = cellXY(tween.from), b = cellXY(tween.to);
    if (tween.from === tween.to && tween.dir >= 0) {
      var o = Math.sin(p * Math.PI) * 0.22;
      return [a[0] + QL.DC[tween.dir] * o, a[1] + QL.DR[tween.dir] * o];
    }
    var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    return [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e];
  }

  function drawBoard(now) {
    if (!P) return;
    var g = sizeCanvas(board); if (!g) return;
    var ctx = g.ctx, Wd = g.w, cs = Wd / N, i;
    ctx.direction = 'ltr';                     /* board text is only numbers: keep +10 / −10 in this order in Urdu too */
    ctx.clearRect(0, 0, Wd, Wd);
    ctx.fillStyle = css(P.surface); ctx.fillRect(0, 0, Wd, Wd);
    for (i = 0; i < NS; i++) drawCell(ctx, i, cs);
    ctx.strokeStyle = css(P.border); ctx.lineWidth = 1;
    ctx.beginPath();
    for (var k = 0; k <= N; k++) {
      var p = Math.min(Wd - 0.5, Math.max(0.5, Math.round(k * cs) + 0.5));
      ctx.moveTo(p, 0); ctx.lineTo(p, Wd); ctx.moveTo(0, p); ctx.lineTo(Wd, p);
    }
    ctx.stroke();
    if (trail.length > 1) {
      ctx.save();
      ctx.strokeStyle = css(trailKind === 'play' ? P.primary : P.accent, 0.75);
      ctx.lineWidth = Math.max(2, cs * 0.06); ctx.setLineDash([cs * 0.1, cs * 0.08]); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      trail.forEach(function (c, n) { var q = cellXY(c); if (n) ctx.lineTo(q[0] * cs, q[1] * cs); else ctx.moveTo(q[0] * cs, q[1] * cs); });
      ctx.stroke(); ctx.restore();
    }
    if (S.tool === 'look' || (lastUpd && S.look === lastUpd.s && !busy)) {
      var lx = (S.look % N) * cs, ly = Math.floor(S.look / N) * cs;
      ctx.save(); ctx.setLineDash([5, 4]); ctx.lineWidth = 3; ctx.strokeStyle = css(P.accent);
      ctx.strokeRect(lx + 2.5, ly + 2.5, cs - 5, cs - 5); ctx.restore();
    }
    if (kcur >= 0) {
      ctx.lineWidth = 4; ctx.strokeStyle = css(P.accent);
      ctx.strokeRect((kcur % N) * cs + 2, Math.floor(kcur / N) * cs + 2, cs - 4, cs - 4);
    }
    var rp = robotPos(now);
    drawRobot(ctx, rp[0] * cs, rp[1] * cs, cs);
  }

  function niceStep(range, ticks) {
    var raw = range / ticks, steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];
    for (var i = 0; i < steps.length; i++) if (steps[i] >= raw) return steps[i];
    return steps[steps.length - 1];
  }
  function drawChart() {
    if (!P) return;
    var g = sizeCanvas(chart); if (!g) return;
    var ctx = g.ctx, Wd = g.w, H = g.h, n = S.hist.length, i;
    var dirDoc = document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr';
    ctx.direction = 'ltr';
    ctx.clearRect(0, 0, Wd, H);
    ctx.fillStyle = css(P.surface); ctx.fillRect(0, 0, Wd, H);
    var font = function (sz, w) { return (w || 400) + ' ' + sz + 'px ' + P.font; };
    var best = QL.bestTotal(S.grid, S.start, S.cost);
    var padL = 44, padR = 12, padT = 12, padB = 40, pw = Wd - padL - padR, ph = H - padT - padB;
    if (!n) {
      ctx.fillStyle = css(P.muted); ctx.font = font(14, 600); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = dirDoc;
      ctx.fillText(t('chart_empty'), Wd / 2, H / 2, Wd - 20);
      return;
    }
    var lo = 0, hi = 10;
    for (i = 0; i < n; i++) { if (S.hist[i] < lo) lo = S.hist[i]; if (S.hist[i] > hi) hi = S.hist[i]; }
    if (best !== null && best > hi) hi = best;
    var stp = niceStep(hi - lo, 5);
    lo = Math.floor(lo / stp) * stp; hi = Math.ceil(hi / stp) * stp; if (hi <= lo) hi = lo + stp;
    var X = function (j) { return padL + (n === 1 ? pw / 2 : j / (n - 1) * pw); };
    var Y = function (v) { return padT + (hi - v) / (hi - lo) * ph; };
    // grid + y labels
    ctx.font = font(11); ctx.textAlign = 'end'; ctx.textBaseline = 'middle';
    for (var v = lo; v <= hi + 1e-9; v += stp) {
      ctx.strokeStyle = css(P.border, v === 0 ? 1 : 0.55); ctx.lineWidth = v === 0 ? 1.5 : 1;
      ctx.beginPath(); ctx.moveTo(padL, Math.round(Y(v)) + 0.5); ctx.lineTo(Wd - padR, Math.round(Y(v)) + 0.5); ctx.stroke();
      ctx.fillStyle = css(P.muted); ctx.fillText(EDU.fmt(v), padL - 6, Y(v));
    }
    // x labels
    var off = S.episodes - n;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    var xs = niceStep(Math.max(1, n), 5);
    for (var e = Math.ceil((off + 1) / xs) * xs; e <= S.episodes; e += xs) ctx.fillText(EDU.fmt(e), X(e - off - 1), padT + ph + 4);
    ctx.font = font(12, 600); ctx.direction = dirDoc; ctx.fillText(t('chart_x'), padL + pw / 2, padT + ph + 21);
    ctx.save(); ctx.translate(12, padT + ph / 2); ctx.rotate(-Math.PI / 2); ctx.textBaseline = 'middle'; ctx.fillText(t('chart_y'), 0, 0, ph); ctx.restore();
    ctx.direction = 'ltr';
    // raw rewards
    ctx.strokeStyle = css(P.c1, 0.5); ctx.lineWidth = 1.3;
    ctx.beginPath();
    if (n <= pw) { for (i = 0; i < n; i++) { if (i) ctx.lineTo(X(i), Y(S.hist[i])); else ctx.moveTo(X(i), Y(S.hist[i])); } }
    else {
      for (var px = 0; px < pw; px++) {
        var a0 = Math.floor(px / pw * n), a1 = Math.max(a0 + 1, Math.floor((px + 1) / pw * n)), mn = Infinity, mx = -Infinity;
        for (i = a0; i < a1 && i < n; i++) { if (S.hist[i] < mn) mn = S.hist[i]; if (S.hist[i] > mx) mx = S.hist[i]; }
        ctx.moveTo(padL + px + 0.5, Y(mn)); ctx.lineTo(padL + px + 0.5, Y(mx) - 0.01);
      }
    }
    ctx.stroke();
    if (n === 1) { ctx.fillStyle = css(P.c1); ctx.beginPath(); ctx.arc(X(0), Y(S.hist[0]), 3.5, 0, Math.PI * 2); ctx.fill(); }
    // moving average
    if (n >= 2) {
      ctx.strokeStyle = css(P.accent); ctx.lineWidth = 2.6; ctx.lineJoin = 'round';
      ctx.beginPath();
      var sum = 0, stepPx = Math.max(1, Math.floor(n / pw));
      for (i = 0; i < n; i++) {
        sum += S.hist[i]; if (i >= AVG_W) sum -= S.hist[i - AVG_W];
        if (i % stepPx && i !== n - 1) continue;
        var avg = sum / Math.min(i + 1, AVG_W);
        if (i) ctx.lineTo(X(i), Y(avg)); else ctx.moveTo(X(i), Y(avg));
      }
      ctx.stroke();
    }
    // best possible
    if (best !== null) {
      ctx.save(); ctx.setLineDash([7, 5]); ctx.strokeStyle = css(P.success); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(padL, Y(best)); ctx.lineTo(Wd - padR, Y(best)); ctx.stroke(); ctx.restore();
    }
  }

  function drawThumbs() {
    $$('.pre-btn').forEach(function (b) {
      var cv = b.querySelector('canvas'), w = QL.parse(QL.PRESETS[b.getAttribute('data-preset')]);
      var ctx = cv.getContext('2d'), cs = cv.width / N;
      ctx.fillStyle = css(P['surface-2']); ctx.fillRect(0, 0, cv.width, cv.height);
      for (var i = 0; i < NS; i++) {
        var tp = w.grid[i], col = tp === WALL ? P.wall : tp === PIT ? P.danger : tp === GOAL ? P.c6 : null;
        if (i === w.start) col = P.primary;
        if (!col) continue;
        ctx.fillStyle = css(col);
        ctx.fillRect((i % N) * cs + 0.5, Math.floor(i / N) * cs + 0.5, cs - 1, cs - 1);
      }
    });
  }
  function drawLegend() {
    $$('.legend canvas').forEach(function (cv) {
      var ctx = cv.getContext('2d'), s = cv.width, k = cv.getAttribute('data-ico');
      ctx.clearRect(0, 0, s, s);
      ctx.fillStyle = css(P['surface-2']); ctx.fillRect(0, 0, s, s);
      if (k === 'robot') drawRobot(ctx, s / 2, s / 2, s);
      else if (k === 'goal') drawGoal(ctx, 0, 0, s, true);
      else if (k === 'pit') drawPit(ctx, 0, 0, s, true);
      else if (k === 'wall') drawWall(ctx, 0, 0, s);
      else if (k === 'start') drawStartPad(ctx, 0, 0, s);
    });
    $('#lg-raw').style.borderColor = css(P.c1);
    $('#lg-avg').style.borderColor = css(P.accent);
    $('#lg-best').style.borderColor = css(P.success);
  }
  function redrawAll() { draw(); drawChart(); drawThumbs(); drawLegend(); }

  /* ------------------------------------------------------------ panels */
  function renderStats() {
    $('#st-ep').textContent = EDU.fmt(S.episodes);
    $('#st-eps').textContent = f2(S.epsNow);
    var n = S.hist.length, last = $('#st-last'), succ = $('#st-succ');
    last.classList.remove('good', 'bad');
    if (n) {
      last.textContent = fr(S.hist[n - 1]);
      var o = S.outc.charAt(n - 1);
      if (o === 'g') last.classList.add('good'); else if (o === 'p') last.classList.add('bad');
      var m = Math.min(100, n), g = 0;
      for (var i = n - m; i < n; i++) if (S.outc.charAt(i) === 'g') g++;
      succ.textContent = EDU.fmt(g / m, { style: 'percent' });
    } else { last.textContent = '–'; succ.textContent = '–'; }
    $('#print-sum').textContent = t('print_sum', { n: EDU.fmt(S.episodes), a: f2(S.alpha), g: f2(S.gamma), e: f2(S.epsNow), c: f2(S.cost) });
  }

  function renderBrain() {
    var i = S.look >= 0 && S.look < NS ? S.look : S.start, tp = S.grid[i];
    $('#brain-cell').textContent = t('brain_cell', { cell: cellName(i) });
    var box = $('#compass'), note = $('#brain-note');
    box.textContent = '';
    if (tp === WALL || tp === PIT || tp === GOAL) {
      box.hidden = true;
      note.textContent = t(tp === WALL ? 'brain_wall' : 'brain_end');
      return;
    }
    box.hidden = false;
    var best = QL.bestActions(S.Q, i), tie = best.length === A;
    var slots = [-1, 0, -1, 3, 'mid', 1, -1, 2, -1];
    slots.forEach(function (sl) {
      if (sl === 'mid') { box.appendChild(el('div', { class: 'mid', 'aria-hidden': 'true', text: robotAt === i ? '🤖' : '📍' })); return; }
      if (sl < 0) { box.appendChild(el('div', { class: 'qbox empty', 'aria-hidden': 'true' })); return; }
      var q = S.Q[i * A + sl], bg = heat(q);
      box.appendChild(el('div', { class: 'qbox' + (!tie && best.indexOf(sl) >= 0 ? ' best' : ''), style: { background: css(bg), color: ink(bg) }, 'data-act': String(sl) },
        el('span', { class: 'an', text: actName(sl) }),
        el('span', { class: 'qv', text: f2(q) })));
    });
    note.textContent = tie ? t('brain_none') : t('brain_best', { act: best.map(actName).join(' / ') });
  }

  function renderUpd() {
    var box = $('#upd-box'), u = lastUpd;
    box.textContent = '';
    if (!u) { box.appendChild(el('p', { class: 'small muted', text: t('upd_none') })); return; }
    var why = t(u.explore ? 'upd_explore' : 'upd_exploit');
    box.appendChild(el('p', { class: 'small', text: t(u.bump ? 'upd_bump' : 'upd_move', { from: cellName(u.s), act: actName(u.a), why: why, to: cellName(u.s2), r: fr(u.r) }) }));
    box.appendChild(el('code', { class: 'formula', id: 'upd-formula',
      text: f2(u.newQ) + ' = ' + f2(u.old) + ' + ' + f2(u.alpha) + ' × (' + f2(u.r) + ' + ' + f2(u.gamma) + ' × ' + fp(u.future) + ' − ' + fp(u.old) + ')' }));
    if (u.done) box.appendChild(el('p', { class: 'small', text: t('upd_end') }));
    box.appendChild(el('p', { class: 'small mb0', text: t('upd_result', { act: actName(u.a), old: f2(u.old), new: f2(u.newQ) }) }));
  }

  function updateButtons() {
    var ep = busy === 'episode', pl = busy === 'play';
    $('#btn-episode').setAttribute('aria-pressed', String(ep));
    $('#ep-ico').textContent = ep ? '■' : '▶';
    $('#ep-txt').textContent = ep ? t('stop') : t('btn_episode');
    $('#btn-play').setAttribute('aria-pressed', String(pl));
    $('#play-ico').textContent = pl ? '■' : '🏁';
    $('#play-txt').textContent = pl ? t('stop') : t('btn_play');
    $('#fast100-txt').textContent = t('btn_fast', { n: EDU.fmt(100) });
    $('#fast1000-txt').textContent = t('btn_fast', { n: EDU.fmt(1000) });
  }

  function renderPresets() {
    $$('.pre-btn').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-preset') === S.preset)); });
    $('#preset-hint').textContent = t(S.preset === 'custom' ? 'hint_custom' : 'hint_' + S.preset);
  }
  function renderTools() {
    $$('#tools button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-tool') === S.tool)); });
    $('#tool-hint').textContent = t('hint_' + S.tool);
    board.style.cursor = S.tool === 'look' ? 'zoom-in' : 'pointer';
  }
  function renderSpeed() { $$('#speed button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-speed') === S.speed)); }); }

  var SL = { alpha: 'sl-alpha', gamma: 'sl-gamma', eps: 'sl-eps', cost: 'sl-cost' };
  function renderSettings() {
    Object.keys(SL).forEach(function (k) {
      $('#' + SL[k]).value = String(S[k]);
      $('#out-' + k).textContent = k === 'cost' ? f2(-S[k]) : f2(S[k]);
    });
    $('#chk-decay').checked = S.decay;
    $('#v-heat').checked = S.view.heat; $('#v-arrows').checked = S.view.arrows; $('#v-q').checked = S.view.q; $('#v-nums').checked = S.view.nums;
  }

  /* ------------------------------------------------------------ by-hand calculation */
  var calc = null;
  function newCalc() {
    var term = Math.random() < 0.25, pick = EDU.pick;
    var q = pick([0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, -0.5, -1]);
    var r = term ? pick([10, -10]) : pick([-0.1, -0.2, -0.5, -1]);
    var a = pick([0.1, 0.2, 0.5, 0.8, 1]), g = pick([0.5, 0.8, 0.9]);
    var m = term ? 0 : pick([0, 1, 2, 2.5, 4, 5, 6, 8]);
    var b = r + g * m - q;
    calc = { q: q, r: r, a: a, g: g, m: m, term: term, b: b, ans: q + a * b, fb: null };
  }
  function cnum(v) { return iso(EDU.fmt(nz(v, 2), { maximumFractionDigits: 2 })); }
  function renderCalc() {
    var box = $('#calc-given'); box.textContent = '';
    [['calc_oldq', calc.q], ['calc_reward', calc.r], ['alpha_label', calc.a], ['gamma_label', calc.g], ['calc_next', calc.m]].forEach(function (p) {
      box.appendChild(el('div', {}, el('span', { class: 'k', text: t(p[0]) }), el('span', { class: 'v', text: cnum(p[1]) })));
    });
    var fb = $('#calc-fb'); fb.textContent = '';
    if (calc.term) fb.appendChild(el('p', { class: 'small muted', text: t('calc_end') }));
    if (!calc.fb) return;
    if (calc.fb === 'right') fb.appendChild(el('p', { class: 'calc-fb ok', text: '✅ ' + t('calc_right', { v: f2(calc.ans) }) }));
    else if (calc.fb === 'wrong') fb.appendChild(el('p', { class: 'calc-fb bad', text: t('calc_wrong') }));
    else if (calc.fb === 'bad') fb.appendChild(el('p', { class: 'calc-fb bad', text: t('calc_bad') }));
    else if (calc.fb === 'show') {
      fb.appendChild(el('code', { class: 'formula', text: cnum(calc.r) + ' + ' + cnum(calc.g) + ' × ' + cnum(calc.m) + ' − ' + (calc.q < 0 ? '(' + cnum(calc.q) + ')' : cnum(calc.q)) + ' = ' + f2(calc.b) }));
      fb.appendChild(el('code', { class: 'formula', style: { marginTop: '6px' }, text: cnum(calc.q) + ' + ' + cnum(calc.a) + ' × ' + (calc.b < 0 ? '(' + f2(calc.b) + ')' : f2(calc.b)) + ' = ' + f2(calc.ans) }));
      fb.appendChild(el('p', { class: 'calc-fb', style: { marginTop: '6px' }, text: t('calc_answer', { v: f2(calc.ans) }) }));
    }
  }
  function checkCalc() {
    var raw = String($('#calc-input').value || '').trim().replace(/[−–—]/g, '-').replace(',', '.').replace(/\s+/g, '');
    var v = raw === '' ? NaN : Number(raw);
    calc.fb = !isFinite(v) ? 'bad' : (Math.abs(v - calc.ans) <= 0.011 ? 'right' : 'wrong');
    renderCalc();
  }

  /* ------------------------------------------------------------ quiz */
  var quizPicks = [];
  function quizData() { var Q = window.APP_CONTENT || {}; return ((Q[EDU.lang] || Q.en || {}).quiz) || []; }
  function renderQuiz() {
    var list = $('#quiz-list'), data = quizData(), right = 0, answered = 0;
    list.textContent = '';
    data.forEach(function (item, qi) {
      var picked = quizPicks[qi];
      var card = el('div', { class: 'quiz-q' }, el('div', { class: 'q', text: (qi + 1) + '. ' + item.q }));
      var opts = el('div', { class: 'opts', role: 'group' });
      item.a.forEach(function (txt, ai) {
        var cls = 'btn opt';
        if (picked !== undefined) { if (ai === item.ok) cls += ' right'; else if (ai === picked) cls += ' picked-wrong'; }
        opts.appendChild(el('button', { type: 'button', class: cls, text: txt, disabled: picked !== undefined, 'data-q': String(qi), 'data-a': String(ai),
          onclick: function () { quizPicks[qi] = ai; renderQuiz(); } }));
      });
      card.appendChild(opts);
      if (picked !== undefined) {
        answered++; if (picked === item.ok) right++;
        card.appendChild(el('p', { class: 'why' }, el('strong', { class: picked === item.ok ? 'ok' : 'bad', text: t(picked === item.ok ? 'correct' : 'wrong') + ' ' }), item.why));
      }
      list.appendChild(card);
    });
    $('#quiz-score').textContent = t('quiz_score', { n: EDU.fmt(right), total: EDU.fmt(data.length) });
    $('#quiz-again').hidden = !answered;
  }

  /* ------------------------------------------------------------ render all */
  function renderAll() {
    readPalette();
    board.setAttribute('aria-label', t('board_aria'));
    renderStats(); renderMsg(); renderBrain(); renderUpd(); updateButtons(); renderPresets(); renderTools(); renderSpeed(); renderSettings(); renderCalc(); renderQuiz();
    redrawAll();
  }

  /* ------------------------------------------------------------ events */
  function cellAt(e) {
    var r = board.getBoundingClientRect();
    var c = Math.floor((e.clientX - r.left) / r.width * N), rw = Math.floor((e.clientY - r.top) / r.height * N);
    return c >= 0 && c < N && rw >= 0 && rw < N ? rw * N + c : -1;
  }
  var lastPaint = -1;
  board.addEventListener('pointerdown', function (e) {
    if (e.button !== undefined && e.button > 0) return;
    var i = cellAt(e); if (i < 0) return;
    e.preventDefault();
    try { board.setPointerCapture(e.pointerId); } catch (x) { }
    if (kcur >= 0) kcur = -1;
    lastPaint = i; applyTool(i, true);
  });
  board.addEventListener('pointermove', function (e) {
    if (!paint || S.tool !== 'cycle') return;
    var i = cellAt(e); if (i < 0 || i === lastPaint) return;
    lastPaint = i; applyTool(i, false);
  });
  function endPaint() { paint = null; lastPaint = -1; }
  board.addEventListener('pointerup', endPaint);
  board.addEventListener('pointercancel', endPaint);
  board.addEventListener('keydown', function (e) {
    var k = e.key;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].indexOf(k) < 0) return;
    e.preventDefault();
    if (kcur < 0) { kcur = S.look >= 0 ? S.look : S.start; draw(); if (k === 'Enter' || k === ' ') return; }
    var r = Math.floor(kcur / N), c = kcur % N;
    if (k === 'ArrowUp') r--; else if (k === 'ArrowDown') r++; else if (k === 'ArrowLeft') c--; else if (k === 'ArrowRight') c++;
    else { applyTool(kcur, true); paint = null; return; }
    kcur = EDU.clamp(r, 0, N - 1) * N + EDU.clamp(c, 0, N - 1);
    if (S.tool === 'look') { S.look = kcur; renderBrain(); }
    draw();
  });
  board.addEventListener('blur', function () { if (kcur >= 0) { kcur = -1; draw(); } });

  $('#btn-step').addEventListener('click', oneStep);
  $('#btn-episode').addEventListener('click', startEpisode);
  $('#btn-fast100').addEventListener('click', function () { fast(100); });
  $('#btn-fast1000').addEventListener('click', function () { fast(1000); });
  $('#btn-play').addEventListener('click', startPlay);
  $('#btn-reset').addEventListener('click', function () {
    if (S.episodes > 0 && !confirm(t('reset_confirm'))) return;
    if (busy) stopBusy(true);
    resetLearning();
    setMsg(function () { return t('msg_reset'); }, '');
    renderStats(); renderBrain(); renderUpd(); draw(); drawChart(); save();
  });
  $$('.pre-btn').forEach(function (b) { b.addEventListener('click', function () { loadPreset(b.getAttribute('data-preset')); }); });
  $$('#tools button').forEach(function (b) { b.addEventListener('click', function () { S.tool = b.getAttribute('data-tool'); renderTools(); draw(); save(); }); });
  $$('#speed button').forEach(function (b) { b.addEventListener('click', function () { S.speed = b.getAttribute('data-speed'); renderSpeed(); save(); }); });

  Object.keys(SL).forEach(function (k) {
    $('#' + SL[k]).addEventListener('input', function (e) {
      var v = parseFloat(e.target.value);
      if (!isFinite(v)) return;
      S[k] = v;
      if (k === 'eps') S.epsNow = v;
      renderSettings(); renderStats();
      if (k === 'cost') drawChart();
      save();
    });
  });
  $('#chk-decay').addEventListener('change', function (e) { S.decay = e.target.checked; save(); });
  $('#btn-defaults').addEventListener('click', function () {
    S.alpha = DEF.alpha; S.gamma = DEF.gamma; S.eps = DEF.eps; S.epsNow = DEF.eps; S.cost = DEF.cost; S.decay = DEF.decay;
    renderSettings(); renderStats(); drawChart(); save();
  });
  [['v-heat', 'heat'], ['v-arrows', 'arrows'], ['v-q', 'q'], ['v-nums', 'nums']].forEach(function (p) {
    $('#' + p[0]).addEventListener('change', function (e) { S.view[p[1]] = e.target.checked; draw(); save(); });
  });
  $('#fs-btn').addEventListener('click', function () { EDU.fullscreen($('#ql')); });
  $('#print-btn').addEventListener('click', function () { window.print(); });
  window.addEventListener('beforeprint', function () { readPalette(true); drawBoard(performance.now()); drawChart(); });
  window.addEventListener('afterprint', function () { readPalette(); redrawAll(); });

  $('#calc-check').addEventListener('click', checkCalc);
  $('#calc-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') checkCalc(); });
  $('#calc-show').addEventListener('click', function () { calc.fb = 'show'; renderCalc(); });
  $('#calc-new').addEventListener('click', function () { newCalc(); $('#calc-input').value = ''; renderCalc(); });
  $('#quiz-again').addEventListener('click', function () { quizPicks = []; renderQuiz(); });

  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function () { draw(); drawChart(); });
    ro.observe(board); ro.observe(chart);
  } else window.addEventListener('resize', function () { draw(); drawChart(); });

  EDU.onTheme(function () { readPalette(); redrawAll(); renderBrain(); });
  EDU.onLang(function () { renderAll(); });

  /* ------------------------------------------------------------ start */
  newCalc();
  if (S.episodes > 0) setMsg(function () { return t('msg_back', { n: EDU.fmt(S.episodes) }); }, '');
  else setMsg(function () { return t('msg_ready'); }, '');
  renderAll();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { readPalette(); drawChart(); });

  /* hook for the automated test */
  window.QL_DEBUG = function () {
    return {
      grid: QL.encode(S.grid), start: S.start, Q: Array.prototype.slice.call(S.Q), episodes: S.episodes, hist: S.hist.slice(), outc: S.outc,
      epsNow: S.epsNow, alpha: S.alpha, gamma: S.gamma, eps: S.eps, cost: S.cost, busy: busy, run: { active: run.active, s: run.s, steps: run.steps },
      lastUpd: lastUpd, lastPlay: lastPlay, best: QL.shortest(S.grid, S.start), calc: calc, look: S.look, tool: S.tool, preset: S.preset, robotAt: robotAt
    };
  };
})();
