/* Projectile Motion Lab: UI, state, animation, target game. */
(function () {
  'use strict';
  var SLUG = 'projectile-motion';
  var P = window.PMPHYS;
  var store = EDU.store(SLUG);
  var MAXTR = 8;
  var GKEYS = ['earth', 'moon', 'mars', 'jupiter', 'custom'];
  var $ = EDU.$;

  EDU.init({ slug: SLUG, title: 'app_title', wide: true });

  /* ------------------------------------------------------------------ state */
  function num(v, lo, hi, d) { v = Number(v); if (!isFinite(v)) v = d; return Math.min(hi, Math.max(lo, v)); }
  function freshGame(level) { return { level: level || 'easy', target: null, attempts: 0, solved: false, hits: 0, sumAttempts: 0, trails: [], nextN: 1, judgedN: 0, msg: '', msgKind: '' }; }
  function defaults() {
    return { u: 20, a: 45, h: 0, gKey: 'earth', gCustom: 9.8, drag: false, vec: false, slow: false, mode: 'explore',
      trails: [{ n: 1, u: 20, a: 45, h: 0, gKey: 'earth', g: 9.8, drag: false }], nextN: 2, game: freshGame() };
  }
  function cleanTrail(t) {
    if (!t || typeof t !== 'object') return null;
    var gKey = GKEYS.indexOf(t.gKey) >= 0 ? t.gKey : 'earth';
    return { n: Math.round(num(t.n, 1, 9999, 1)), u: num(t.u, 0.1, 100, 20), a: num(t.a, 0, 90, 45), h: num(t.h, 0, 500, 0), gKey: gKey,
      g: num(t.g, 0.1, 100, 9.8), drag: !!t.drag };
  }
  function load() {
    var d = defaults(), s = store.get('state', null);
    if (!s || typeof s !== 'object') return d;
    var o = {
      u: num(s.u, 0.1, 100, d.u), a: num(s.a, 0, 90, d.a), h: num(s.h, 0, 500, d.h),
      gKey: GKEYS.indexOf(s.gKey) >= 0 ? s.gKey : 'earth', gCustom: num(s.gCustom, 0.1, 100, 9.8),
      drag: !!s.drag, vec: !!s.vec, slow: !!s.slow, mode: s.mode === 'game' ? 'game' : 'explore',
      trails: (Array.isArray(s.trails) ? s.trails : []).map(cleanTrail).filter(Boolean).slice(-MAXTR),
      nextN: Math.round(num(s.nextN, 1, 9999, 1)), game: freshGame()
    };
    var g = s.game;
    if (g && typeof g === 'object') {
      var G = o.game;
      G.level = g.level === 'hard' ? 'hard' : 'easy';
      if (g.target && typeof g.target === 'object') {
        var gk = GKEYS.indexOf(g.target.gKey) >= 0 && g.target.gKey !== 'custom' ? g.target.gKey : 'earth';
        G.target = { x: num(g.target.x, 2, 500, 30), w: num(g.target.w, 0.5, 10, 3), h: num(g.target.h, 0, 100, 0), gKey: gk, g: P.GRAV[gk] };
      }
      G.attempts = Math.round(num(g.attempts, 0, 99999, 0)); G.solved = !!g.solved;
      G.hits = Math.round(num(g.hits, 0, 99999, 0)); G.sumAttempts = Math.round(num(g.sumAttempts, 0, 9999999, 0));
      G.trails = (Array.isArray(g.trails) ? g.trails : []).map(cleanTrail).filter(Boolean).slice(-MAXTR);
      G.nextN = Math.round(num(g.nextN, 1, 9999, 1));
      G.judgedN = Math.round(num(g.judgedN, 0, 9999, 0));
      G.msg = typeof g.msg === 'string' ? g.msg : ''; G.msgKind = typeof g.msgKind === 'string' ? g.msgKind : '';
      G.msgVars = g.msgVars && typeof g.msgVars === 'object' ? g.msgVars : null;
    }
    return o;
  }
  var S = load();
  [S.trails, S.game.trails].forEach(function (L) { L.forEach(attachSim); });
  /* a game ball still in the air when the page was reloaded: its attempt was counted, so judge it now */
  (function () {
    var G = S.game, L = G.trails, n = G.judgedN;
    if (G.target && L.length) { judge(L[L.length - 1], true); if (G.judgedN !== n) save(); }
  })();

  function attachSim(tr) { tr.sim = P.simulate(tr); tr.prog = tr.sim.T; return tr; }
  function save() {
    var strip = function (L) { return L.map(function (t) { return { n: t.n, u: t.u, a: t.a, h: t.h, gKey: t.gKey, g: t.g, drag: t.drag }; }); };
    var G = S.game;
    store.set('state', {
      u: S.u, a: S.a, h: S.h, gKey: S.gKey, gCustom: S.gCustom, drag: S.drag, vec: S.vec, slow: S.slow, mode: S.mode,
      trails: strip(S.trails), nextN: S.nextN,
      game: { level: G.level, target: G.target, attempts: G.attempts, solved: G.solved, hits: G.hits, sumAttempts: G.sumAttempts,
        trails: strip(G.trails), nextN: G.nextN, judgedN: G.judgedN || 0, msg: G.msg, msgKind: G.msgKind, msgVars: G.msgVars || null }
    });
  }

  function airAllowed(k) { return k === 'earth' || k === 'custom'; }
  function gOf(k) { return k === 'custom' ? S.gCustom : P.GRAV[k]; }
  function inGame() { return S.mode === 'game' && !!S.game.target; }
  /* the settings that the next launch will use */
  function params(a) {
    if (inGame()) { var T = S.game.target; return { u: S.u, a: a === undefined ? S.a : a, h: T.h, g: T.g, gKey: T.gKey, drag: false }; }
    return { u: S.u, a: a === undefined ? S.a : a, h: S.h, g: gOf(S.gKey), gKey: S.gKey, drag: S.drag && airAllowed(S.gKey) };
  }
  function trails() { return S.mode === 'game' ? S.game.trails : S.trails; }
  function latest() { var L = trails(); return L.length ? L[L.length - 1] : null; }
  /* paper is white: print with the light-theme palette even from dark mode */
  var PRINT_C = ['#0b7285', '#e8590c', '#5f3dc4', '#2b8a3e', '#c2255c', '#b08900', '#1971c2', '#868e96'];
  function colorFor(n) { var i = ((n - 1) % 8 + 8) % 8; return printing ? PRINT_C[i] : (EDU.css('--c' + (i + 1)) || PRINT_C[i]); }

  /* ------------------------------------------------------------------ formatting */
  function f2(v) { return EDU.fmt(v, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function f1(v) { return EDU.fmt(v, { maximumFractionDigits: 1 }); }
  function fx(v, d) { var s = (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d); return s === '-0.00' || s === '-0.0' ? s.slice(1) : s; }
  function g2(v) { return String(Math.round(v * 100) / 100); }

  /* ------------------------------------------------------------------ canvas */
  var cv = $('#cv'), view = PMVIEW(cv), top = $('#pm-top');
  var printing = false;
  function colors() {
    if (printing) {
      return { surface: '#ffffff', text: '#000000', muted: '#444444', grid: '#c8c8c8', ground: '#eef3e6', grass: '#3f8a3a', tower: '#e2d6c4', towerEdge: '#8a7458',
        target: '#c2410c', targetSoft: 'rgba(194,65,12,.18)', stump: '#7a4a12', aim: '#000000', vx: '#1971c2', vy: '#d9480f', vv: '#000000' };
    }
    var dark = EDU.theme() === 'dark';
    return {
      surface: EDU.css('--surface'), text: EDU.css('--text'), muted: EDU.css('--muted'), grid: EDU.css('--border'),
      ground: dark ? '#1a2a22' : '#eef3e6', grass: dark ? '#4caf50' : '#3f8a3a',
      tower: dark ? '#3a3328' : '#e2d6c4', towerEdge: dark ? '#7d6a4f' : '#8a7458',
      target: EDU.css('--accent'), targetSoft: dark ? 'rgba(255,122,69,.25)' : 'rgba(217,80,28,.18)', stump: dark ? '#e0b070' : '#7a4a12',
      aim: EDU.css('--text'), vx: EDU.css('--c7'), vy: EDU.css('--c2'), vv: EDU.css('--text')
    };
  }
  function sizeCanvas() {
    var w = cv.parentNode.clientWidth || 600, h;
    var fsOn = document.fullscreenElement === top || document.webkitFullscreenElement === top;
    if (fsOn) { h = Math.max(240, window.innerHeight - 330); view.setAuto(null); }
    else {
      var mob = w < 560, lo = Math.round(w * (mob ? 0.6 : 0.42));
      var hi = Math.round(Math.min(w * (mob ? 1.05 : 0.62), Math.max(lo, (window.innerHeight || 800) * 0.75)));
      view.setAuto({ min: lo, max: Math.max(lo, hi) }); h = lo;
    }
    view.resize(w, h);
  }

  var flights = [], raf = 0, scrubActive = false;
  function scene(now) {
    var L = trails(), last = latest(), busy = flights.length > 0, balls = [], multi = [];
    var sc = {
      colors: colors(), font: getComputedStyle(document.body).fontFamily, labels: { x: EDU.t('ax_x'), y: EDU.t('ax_y') },
      trails: L.map(function (t) { return { n: t.n, color: colorFor(t.n), sim: t.sim, prog: t.prog, latest: t === last }; }),
      h: busy ? flights[flights.length - 1].tr.h : params().h,
      hMax: L.reduce(function (m, t) { return Math.max(m, t.h); }, 0), target: S.mode === 'game' ? S.game.target : null,
      vectors: S.vec, aim: null, balls: balls, multi: multi, clock: null, busy: busy
    };
    if (busy) {
      var tmax = 0, rate = 1;
      flights.forEach(function (f) {
        var st = P.stateAt(f.tr.sim, f.tr.prog);
        balls.push({ st: st, vmax: vmaxOf(f.tr) });
        tmax = Math.max(tmax, f.tr.prog); rate = f.rate;
      });
      sc.clock = { t: tmax, rate: rate };
    } else {
      var p = params();
      sc.aim = { u: p.u, a: p.a, h: p.h };
      if (last && scrubActive) balls.push({ st: scrubState(), vmax: vmaxOf(last), ghost: true });
      else if (last && S.vec && last.sim.T > 0) {
        for (var i = 1; i <= 4; i++) multi.push({ st: P.stateAt(last.sim, last.sim.T * i / 4), vmax: vmaxOf(last) });
      }
      balls.push({ st: { x: 0, y: p.h, vx: 0, vy: 0 }, vmax: p.u });
      if (S.vec) balls[balls.length - 1].st = { x: 0, y: p.h, vx: p.u * Math.cos(p.a * P.RAD), vy: p.u * Math.sin(p.a * P.RAD) };
    }
    return sc;
  }
  function vmaxOf(tr) { return Math.max(tr.u, tr.sim.vEnd || 0, 1); }
  function draw() {
    view.draw(scene());
    cv.setAttribute('data-busy', flights.length ? '1' : '0');
  }

  /* ------------------------------------------------------------------ launch + animation */
  function nextN() { if (S.mode === 'game') return S.game.nextN++; return S.nextN++; }
  function launch(list) {
    finishFlights();
    var L = trails(), now = performance.now();
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    list.forEach(function (p) {
      var tr = attachSim({ n: nextN(), u: p.u, a: p.a, h: p.h, gKey: p.gKey, g: p.g, drag: p.drag });
      L.push(tr);
      var rate = Math.max(1, tr.sim.T / 3.2);
      if (S.slow) rate *= 0.35;
      if (reduce) { tr.prog = tr.sim.T; return; }
      tr.prog = 0;
      flights.push({ tr: tr, t0: now, rate: rate });
    });
    /* all balls in one launch share the same clock */
    if (flights.length > 1) { var r = Math.max.apply(null, flights.map(function (f) { return f.rate; })); flights.forEach(function (f) { f.rate = r; }); }
    while (L.length > MAXTR) L.shift();
    scrubActive = false; $('#scrub').value = 1000;
    if (S.mode === 'game' && S.game.target && !S.game.solved) S.game.attempts++;
    save();
    renderGame();
    if (!flights.length) landed(); else tick();
  }
  function tick() {
    if (raf) return;
    raf = requestAnimationFrame(function step(now) {
      raf = 0;
      var done = true;
      flights.forEach(function (f) {
        f.tr.prog = Math.min(f.tr.sim.T, (now - f.t0) / 1000 * f.rate);
        if (f.tr.prog < f.tr.sim.T) done = false;
      });
      if (done) { flights = []; draw(); landed(); return; }
      draw();
      raf = requestAnimationFrame(step);
    });
  }
  function finishFlights() {
    if (!flights.length) return;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    flights.forEach(function (f) { f.tr.prog = f.tr.sim.T; });
    flights = [];
    landed(true);
  }
  var landedCount = 0;
  function landed(quiet) {
    var last = latest();
    cv.setAttribute('data-landed', String(++landedCount));
    if (S.mode === 'game' && last) judge(last, quiet);
    renderResults(); renderTrails(); renderReadout(); renderGame(); draw();
    save();
  }

  /* ------------------------------------------------------------------ target game */
  function newTarget() {
    var G = S.game, hard = G.level === 'hard';
    var gKey = hard ? EDU.pick(['earth', 'moon', 'mars', 'jupiter']) : 'earth';
    G.target = { x: hard ? EDU.randInt(20, 180) / 2 : EDU.randInt(30, 120) / 2, w: hard ? 2 : 3, h: hard ? EDU.randInt(0, 6) * 5 : 0, gKey: gKey, g: P.GRAV[gKey] };
    G.attempts = 0; G.solved = false; G.trails = []; G.nextN = 1; G.judgedN = 0; G.msg = 'game_start'; G.msgKind = ''; G.msgVars = null;
    scrubActive = false; $('#best-box').hidden = true;
    save();
  }
  function judge(tr, quiet) {
    var G = S.game, T = G.target;
    if (!T || G.solved || tr.judged || tr.n <= (G.judgedN || 0)) return;
    tr.judged = true; G.judgedN = tr.n;
    var d = tr.sim.R - T.x;
    if (Math.abs(d) <= T.w / 2) {
      G.solved = true; G.hits++; G.sumAttempts += G.attempts;
      G.msg = 'game_hit'; G.msgKind = 'hit'; G.msgVars = { n: G.attempts };
      if (!quiet) EDU.toast(EDU.t('game_hit', { n: EDU.fmt(G.attempts) }));
    } else {
      G.msg = d < 0 ? 'game_short' : 'game_long'; G.msgKind = 'miss'; G.msgVars = { d: Math.abs(d) };
    }
  }
  function renderGame() {
    var on = S.mode === 'game', G = S.game;
    $('#mode-explore').setAttribute('aria-pressed', String(!on));
    $('#mode-game').setAttribute('aria-pressed', String(on));
    $('#game-panel').hidden = !on;
    $('#game-locked').hidden = !on;
    $('#fixed-fs').disabled = on;
    if (!on || !G.target) return;
    var T = G.target;
    $('#lvl-easy').setAttribute('aria-pressed', String(G.level === 'easy'));
    $('#lvl-hard').setAttribute('aria-pressed', String(G.level === 'hard'));
    $('#target-info').textContent = EDU.t('target_info', { d: f1(T.x), w: f1(T.w), h: f1(T.h), g: f1(T.g), planet: EDU.t('g_' + T.gKey) });
    $('#g-attempts').textContent = EDU.t('attempts', { n: EDU.fmt(G.attempts) });
    $('#g-hits').textContent = EDU.t('hits', { n: EDU.fmt(G.hits) });
    $('#g-avg').textContent = EDU.t('avg', { n: G.hits ? f1(G.sumAttempts / G.hits) : '–' });
    $('#g-avg').hidden = !G.hits;
    var m = $('#game-msg'), v = G.msgVars || {};
    var txt = '';
    if (G.solved) txt = EDU.t('game_hit', { n: EDU.fmt(G.attempts) }) + ' ' + EDU.t('game_done');
    else if (G.msg === 'game_short' || G.msg === 'game_long') txt = EDU.t(G.msg, { d: f1(v.d || 0) });
    else txt = EDU.t('game_start');
    m.textContent = txt;
    m.className = 'pm-gmsg' + (G.solved ? ' hit' : G.msgKind === 'miss' ? ' miss' : '');
    m.setAttribute('data-state', G.solved ? 'hit' : G.msg === 'game_short' ? 'short' : G.msg === 'game_long' ? 'long' : 'ready');
    $('#game-tip').textContent = EDU.t(T.h > 0 ? 'game_tip_h' : 'game_tip');
    var p = $('#target-info');
    p.setAttribute('data-x', T.x); p.setAttribute('data-w', T.w); p.setAttribute('data-h', T.h); p.setAttribute('data-g', T.g);
    $('#g-attempts').setAttribute('data-n', G.attempts);
  }

  /* ------------------------------------------------------------------ settings UI */
  function syncControls() {
    var p = params();
    $('#speed').value = Math.min(60, S.u); $('#speed-num').value = g2(S.u);
    $('#angle').value = S.a; $('#angle-num').value = g2(S.a);
    $('#height').value = Math.min(100, p.h); $('#height-num').value = g2(p.h);
    $('#kmh').textContent = '≈ ' + EDU.fmt(Math.round(S.u * 3.6)) + ' km/h';
    var gk = p.gKey;
    GKEYS.forEach(function (k) { $('#g-' + k).setAttribute('aria-pressed', String(k === gk)); });
    $('#custom-row').hidden = gk !== 'custom';
    $('#g-custom-val').value = g2(S.gCustom);
    var ok = airAllowed(gk) && !inGame();
    $('#air').checked = S.drag && ok;
    $('#air').disabled = !airAllowed(gk) || inGame();
    $('#air-note').textContent = EDU.t(airAllowed(gk) ? 'air_note' : 'air_off_planet');
    $('#vectors').checked = S.vec; $('#slow').checked = S.slow;
  }
  function changed() { save(); syncControls(); $('#best-box').hidden = true; if (!flights.length) draw(); }
  function pair(rangeId, numId, key, lo, hi) {
    $(rangeId).addEventListener('input', function () { S[key] = num(this.value, lo, hi, S[key]); changed(); });
    $(numId).addEventListener('input', function () {
      if (this.value === '' || !isFinite(Number(this.value))) return;
      S[key] = num(this.value, lo, hi, S[key]);
      save(); $(rangeId).value = S[key]; $('#best-box').hidden = true;
      if (key === 'u') $('#kmh').textContent = '≈ ' + EDU.fmt(Math.round(S.u * 3.6)) + ' km/h';
      if (!flights.length) draw();
    });
    $(numId).addEventListener('change', function () { syncControls(); });
  }
  pair('#speed', '#speed-num', 'u', 0.1, 100);
  pair('#angle', '#angle-num', 'a', 0, 90);
  pair('#height', '#height-num', 'h', 0, 500);
  GKEYS.forEach(function (k) {
    $('#g-' + k).addEventListener('click', function () { if (inGame()) return; S.gKey = k; changed(); });
  });
  $('#g-custom-val').addEventListener('input', function () {
    if (this.value === '' || !isFinite(Number(this.value)) || Number(this.value) <= 0) return;
    S.gCustom = num(this.value, 0.1, 100, 9.8); save(); $('#best-box').hidden = true; if (!flights.length) draw();
  });
  $('#g-custom-val').addEventListener('change', syncControls);
  $('#air').addEventListener('change', function () { S.drag = this.checked; changed(); });
  $('#vectors').addEventListener('change', function () { S.vec = this.checked; save(); draw(); });
  $('#slow').addEventListener('change', function () { S.slow = this.checked; save(); });

  /* ------------------------------------------------------------------ results */
  function landedLatest() {
    var L = trails();
    for (var i = L.length - 1; i >= 0; i--) if (L[i].prog >= L[i].sim.T) return L[i];
    return null;
  }
  function renderResults() {
    var last = landedLatest(), none = !last;
    $('#res-none').hidden = !none; $('#res-wrap').hidden = none;
    ['T', 'R', 'H'].forEach(function (k) { $('#st-' + k).textContent = '–'; $('#st-' + k).removeAttribute('data-v'); });
    if (none) return;
    var s = last.sim, f = P.formula(last);
    var unit = { T: ' s', R: ' m', H: ' m', V: ' m/s' };
    $('#st-T').textContent = f2(s.T) + ' s'; $('#st-R').textContent = f2(s.R) + ' m'; $('#st-H').textContent = f2(s.H) + ' m';
    $('#st-T').setAttribute('data-v', s.T); $('#st-R').setAttribute('data-v', s.R); $('#st-H').setAttribute('data-v', s.H);
    var rows = [['T', 'r_time', s.T, f.T], ['R', 'r_range', s.R, f.R], ['H', 'r_height', s.H, f.H], ['V', 'r_vend', s.vEnd, f.vEnd]];
    var body = $('#res-body'); body.innerHTML = '';
    rows.forEach(function (r) {
      var diff = Math.abs(r[2] - r[3]) > 0.005 + 0.001 * Math.abs(r[3]);
      body.appendChild(EDU.el('tr', {},
        EDU.el('td', { text: EDU.t(r[1]) }),
        EDU.el('td', { class: 'num' + (diff ? ' diff' : ''), id: 'res-' + r[0] + '-sim', 'data-v': r[2], text: f2(r[2]) + unit[r[0]] }),
        EDU.el('td', { class: 'num', id: 'res-' + r[0] + '-f', 'data-v': r[3], text: f2(r[3]) + unit[r[0]] })));
    });
    var note = $('#res-note');
    if (last.drag) {
      var pc = f.R > 0 ? Math.round((1 - s.R / f.R) * 100) : 0;
      note.textContent = EDU.t('drag_note', { p: EDU.fmt(pc) }); note.className = 'callout warning pm-note small';
    } else { note.textContent = EDU.t('match_note'); note.className = 'callout success pm-note small'; }
    renderWork(last, f);
  }

  function renderWork(p, f) {
    var u = g2(p.u), a = g2(p.a), g = g2(p.g), h = g2(p.h), box = $('#work');
    box.innerHTML = '';
    var lines;
    if (p.h > 0) {
      $('#work-intro').textContent = EDU.t('w_height');
      var us = fx(p.u * Math.sin(p.a * P.RAD), 2), uc = fx(p.u * Math.cos(p.a * P.RAD), 2);
      lines = [
        ['r_time', 'T = [u sinθ + √(u² sin²θ + 2gh)] / g\n  = [' + u + ' × sin ' + a + '° + √(' + us + '² + 2 × ' + g + ' × ' + h + ')] / ' + g +
          '\n  = [' + us + ' + ' + fx(Math.sqrt(Math.pow(p.u * Math.sin(p.a * P.RAD), 2) + 2 * p.g * p.h), 2) + '] / ' + g + '\n  = ' + fx(f.T, 2) + ' s'],
        ['r_range', 'R = u cosθ × T\n  = ' + u + ' × cos ' + a + '° × ' + fx(f.T, 2) + '\n  = ' + uc + ' × ' + fx(f.T, 2) + '\n  = ' + fx(f.R, 2) + ' m'],
        ['r_height', 'H = h + u² sin²θ / 2g\n  = ' + h + ' + ' + us + '² / (2 × ' + g + ')\n  = ' + fx(f.H, 2) + ' m']
      ];
    } else {
      $('#work-intro').textContent = EDU.t('w_level');
      lines = [
        ['r_time', 'T = 2u sinθ / g\n  = 2 × ' + u + ' × sin ' + a + '° / ' + g + '\n  = 2 × ' + u + ' × ' + fx(Math.sin(p.a * P.RAD), 4) + ' / ' + g + '\n  = ' + fx(f.T, 2) + ' s'],
        ['r_range', 'R = u² sin 2θ / g\n  = ' + u + '² × sin ' + g2(2 * p.a) + '° / ' + g + '\n  = ' + fx(p.u * p.u, 2).replace(/\.00$/, '') + ' × ' + fx(Math.sin(2 * p.a * P.RAD), 4) + ' / ' + g + '\n  = ' + fx(f.R, 2) + ' m'],
        ['r_height', 'H = u² sin²θ / 2g\n  = ' + u + '² × (sin ' + a + '°)² / (2 × ' + g + ')\n  = ' + fx(p.u * p.u, 2).replace(/\.00$/, '') + ' × ' + fx(Math.pow(Math.sin(p.a * P.RAD), 2), 4) + ' / ' + g2(2 * p.g) + '\n  = ' + fx(f.H, 2) + ' m']
      ];
    }
    lines.forEach(function (l) {
      box.appendChild(EDU.el('div', {}, EDU.el('div', { class: 'pm-wlbl', text: EDU.t(l[0]) }), EDU.el('pre', { class: 'pm-eq no-i18n', dir: 'ltr', text: l[1] })));
    });
  }

  /* ------------------------------------------------------------------ trails list */
  /* [text, isLatin] pieces; each one is bidi-isolated so "20 m/s" etc. never get scrambled in Urdu (RTL) */
  function trailParts(t) {
    var parts = [['#' + t.n, 1], [g2(t.u) + ' m/s', 1], [g2(t.a) + '°', 1], ['h = ' + g2(t.h) + ' m', 1], [EDU.t('g_' + t.gKey), 0]];
    if (t.gKey === 'custom') parts.push(['g = ' + g2(t.g) + ' m/s²', 1]);
    if (t.drag) parts.push([EDU.t('with_air'), 0]);
    return parts;
  }
  function renderTrails() {
    var L = trails(), ol = $('#trails'), last = latest();
    ol.innerHTML = '';
    $('#trails-empty').hidden = L.length > 0;
    $('#trails-hint').textContent = EDU.t('trails_hint', { n: EDU.fmt(MAXTR) });
    L.slice().reverse().forEach(function (t) {
      var del = EDU.el('button', { type: 'button', class: 'btn btn-ghost btn-sm pm-del', 'aria-label': EDU.t('remove_trail', { n: t.n }), title: EDU.t('remove_trail', { n: t.n }), text: '✕',
        onclick: function () {
          var i = L.indexOf(t); if (i >= 0) L.splice(i, 1);
          finishFlights(); scrubActive = false; save(); renderResults(); renderTrails(); renderReadout(); draw();
        } });
      var tl = EDU.el('span', { class: 'pm-tl' });
      trailParts(t).forEach(function (p, i) {
        if (i) tl.appendChild(document.createTextNode(' · '));
        tl.appendChild(EDU.el('span', { class: 'pt' + (p[1] ? ' lat' : ''), text: p[0] }));
      });
      tl.appendChild(document.createTextNode(' · '));
      tl.appendChild(EDU.el('span', { class: 'pt lat r num', text: 'R = ' + f2(t.sim.R) + ' m' }));
      ol.appendChild(EDU.el('li', { class: t === last ? 'latest' : '', 'data-n': t.n, 'data-r': t.sim.R }, EDU.el('span', { class: 'pm-dot', style: { '--col': colorFor(t.n) }, 'aria-hidden': 'true', text: String(t.n) }), tl, del));
    });
  }

  /* ------------------------------------------------------------------ scrubber */
  function scrubState() {
    var last = latest(); if (!last) return { t: 0, x: 0, y: 0, vx: 0, vy: 0 };
    return P.stateAt(last.sim, last.sim.T * Number($('#scrub').value) / 1000);
  }
  function renderReadout() {
    var last = latest(), box = $('#readout');
    $('#scrub').disabled = !last;
    if (!last) { box.textContent = ''; return; }
    var st = scrubActive ? scrubState() : P.stateAt(last.sim, last.sim.T);
    var v = Math.sqrt(st.vx * st.vx + st.vy * st.vy);
    var items = [['t', fx(st.t, 2) + ' s'], ['x', fx(st.x, 2) + ' m'], ['y', fx(st.y, 2) + ' m'], ['vx', fx(st.vx, 2) + ' m/s'], ['vy', fx(st.vy, 2) + ' m/s'], ['v', fx(v, 2) + ' m/s']];
    box.innerHTML = '';
    items.forEach(function (it) { box.appendChild(EDU.el('span', {}, EDU.el('b', { text: it[0] }), ' = ' + it[1])); });
    box.setAttribute('data-vy', st.vy); box.setAttribute('data-vx', st.vx); box.setAttribute('data-t', st.t);
  }
  $('#scrub').addEventListener('input', function () { if (flights.length) finishFlights(); scrubActive = true; renderReadout(); draw(); });

  /* ------------------------------------------------------------------ buttons */
  $('#launch').addEventListener('click', function () {
    if (S.mode === 'game' && !S.game.target) newTarget();
    launch([params()]);
  });
  $('#clear').addEventListener('click', function () {
    finishFlights();
    trails().length = 0;
    if (S.mode === 'game') { S.game.nextN = 1; S.game.judgedN = 0; } else S.nextN = 1;
    scrubActive = false; save(); renderAll(); EDU.toast(EDU.t('cleared'));
  });
  function setMode(m) {
    finishFlights();
    S.mode = m; scrubActive = false; $('#best-box').hidden = true;  /* the best angle was for the other mode's settings */
    if (m === 'game' && !S.game.target) newTarget();
    save(); renderAll();
  }
  $('#mode-explore').addEventListener('click', function () { setMode('explore'); });
  $('#mode-game').addEventListener('click', function () { setMode('game'); });
  $('#new-target').addEventListener('click', function () { finishFlights(); newTarget(); renderAll(); });
  ['easy', 'hard'].forEach(function (lv) {
    $('#lvl-' + lv).addEventListener('click', function () {
      if (S.game.level === lv) return;
      finishFlights(); S.game.level = lv; newTarget(); renderAll();
    });
  });

  function demoSetup() {
    if (S.mode !== 'explore') { finishFlights(); S.mode = 'explore'; }
    finishFlights();
    S.trails.length = 0; S.nextN = 1; S.h = 0; S.drag = false;
    if (!(gOf(S.gKey) > 0)) S.gKey = 'earth';
    $('#best-box').hidden = true;
    syncControls();
    showStage();
  }
  /* the demo and best-angle buttons sit below the picture: bring the picture into view so the class sees the flight */
  function showStage() {
    var r = cv.getBoundingClientRect(), vh = window.innerHeight || document.documentElement.clientHeight || 800;
    if (r.top >= 0 && r.bottom <= vh) return;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    try { cv.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); } catch (e) { cv.scrollIntoView(); }
  }
  $('#demo-45').addEventListener('click', function () {
    demoSetup();
    launch([15, 30, 45, 60, 75].map(function (a) { return params(a); }));
    renderTrails(); renderResults();
    EDU.toast(EDU.t('demo_note'));
  });
  $('#demo-comp').addEventListener('click', function () {
    demoSetup();
    var a = Math.abs(S.a - 45) < 0.5 || S.a < 1 || S.a > 89 ? 30 : S.a;
    launch([params(a), params(90 - a)]);
    renderTrails(); renderResults();
    EDU.toast(EDU.t('demo_note'));
  });
  var best = null;
  $('#find-best').addEventListener('click', function () {
    best = P.bestAngle(params());
    var out = $('#best-out');
    out.textContent = EDU.t('best_out', { r: f2(best.R), a: EDU.fmt(best.a) });
    out.setAttribute('data-a', best.a); out.setAttribute('data-r', best.R);
    $('#best-box').hidden = false;
  });
  $('#use-best').addEventListener('click', function () {
    if (!best) return;
    S.a = best.a; syncControls(); showStage(); launch([params()]);
  });
  $('#reset').addEventListener('click', function () {
    if (!confirm(EDU.t('confirm_reset'))) return;
    finishFlights();
    S = defaults(); S.trails.forEach(attachSim); scrubActive = false; best = null; $('#best-box').hidden = true;
    save(); renderAll();
  });
  $('#save-png').addEventListener('click', function () { finishFlights(); draw(); EDU.downloadCanvas(cv, 'projectile-motion.png'); });
  $('#print').addEventListener('click', function () { finishFlights(); window.print(); });
  $('#fs').addEventListener('click', function () { EDU.fullscreen(top); });
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) {
    document.addEventListener(ev, function () { setTimeout(function () { sizeCanvas(); draw(); }, 60); });
  });
  window.addEventListener('beforeprint', function () { printing = true; finishFlights(); scrubActive = false; renderTrails(); renderReadout(); draw(); });
  window.addEventListener('afterprint', function () { printing = false; renderTrails(); sizeCanvas(); draw(); });

  /* keyboard: Enter/Space on the picture launches */
  cv.tabIndex = 0;
  cv.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#launch').click(); }
  });

  /* ------------------------------------------------------------------ render all */
  function renderAll(keepFlights) {
    if (!keepFlights && flights.length) finishFlights();
    syncControls(); renderGame(); renderResults(); renderTrails(); renderReadout();
    $('#best-box').hidden = $('#best-box').hidden || !best;
    if (best) $('#best-out').textContent = EDU.t('best_out', { r: f2(best.R), a: EDU.fmt(best.a) });
    draw();
  }
  EDU.onLang(function () { renderAll(true); });
  EDU.onTheme(function () { renderTrails(); draw(); });
  var rt = 0;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { sizeCanvas(); draw(); }, 80); });
  var lastW = 0;
  if (window.ResizeObserver) new ResizeObserver(function () {
    var w = cv.parentNode.clientWidth; if (Math.abs(w - lastW) < 2) return; lastW = w;
    clearTimeout(rt); rt = setTimeout(function () { sizeCanvas(); draw(); }, 50);
  }).observe(cv.parentNode);

  if (S.mode === 'game' && !S.game.target) newTarget();
  sizeCanvas();
  renderAll();
  /* small hook for tests and curious teachers */
  window.ProjectileLab = { state: function () { return S; }, view: view, physics: P };
})();
