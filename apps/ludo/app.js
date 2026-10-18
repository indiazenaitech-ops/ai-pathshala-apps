/* Ludo: classic 15 x 15 board, 2-4 seats (human or computer), common Indian house rules as switches.
   The rules live in engine.js (pure functions); this file draws the board, animates and runs turns. */
(function () {
  'use strict';
  var E = window.LudoEngine, SLUG = 'ludo', store = EDU.store(SLUG), $ = EDU.$, t = EDU.t, el = EDU.el;
  var CVAR = ['var(--ld-red)', 'var(--ld-green)', 'var(--ld-yellow)', 'var(--ld-blue)'];
  var SPOTS = [[2, 2], [4, 2], [2, 4], [4, 4]];
  var HOMEPOS = [[6.62, 7.5], [7.5, 6.62], [8.38, 7.5], [7.5, 8.38]];
  var MEDALS = ['🥇', '🥈', '🥉', '4'];
  var OPTS = ['off', 'human', 'cpu_easy', 'cpu_medium', 'cpu_hard'];

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'wa_game' });

  /* ---------------- settings + saved game ---------------- */
  var prefs = (function () {
    var p = store.get('prefs', null) || {};
    return { sound: p.sound === true, auto: p.auto !== false };
  })();
  function savePrefs() { store.set('prefs', prefs); }

  function defaultSetup() {
    return { seats: [{ on: true, type: 'human', level: 'medium', name: '' }, { on: false, type: 'human', level: 'medium', name: '' },
      { on: true, type: 'cpu', level: 'medium', name: '' }, { on: false, type: 'human', level: 'medium', name: '' }], rules: E.normRules(null) };
  }
  function normSetup(s) {
    var d = defaultSetup();
    if (!s || !Array.isArray(s.seats) || s.seats.length !== 4) return d;
    d.seats = s.seats.map(function (x) {
      x = x || {};
      return { on: !!x.on, type: x.type === 'cpu' ? 'cpu' : 'human', level: E.LEVELS.indexOf(x.level) >= 0 ? x.level : 'medium', name: String(x.name || '').slice(0, 20) };
    });
    d.rules = E.normRules(s.rules);
    if (d.seats.filter(function (x) { return x.on; }).length < 2) return defaultSetup();
    return d;
  }
  var setup = normSetup(store.get('setup', null));
  function gameCfg(su) {
    var seats = [];
    su.seats.forEach(function (x, c) { if (x.on) seats.push({ c: c, name: x.name.trim(), type: x.type, level: x.level }); });
    return { seats: seats, rules: su.rules };
  }

  var S = E.revive(store.get('game', null)) || E.newGame(gameCfg(setup));
  var busy = false, gen = 0, rollQueue = [], fast = false, subFn = null;
  function save() { store.set('game', S); }

  /* ---------------- helpers ---------------- */
  function reducedMotion() { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function noAnim() { return fast || reducedMotion(); }
  function wait(kind) {
    if (fast) return 15;
    var ms = { think: 700, pick: 480, auto: 260, results: 700 }[kind] || 400;
    return reducedMotion() ? Math.min(ms, 300) : ms;
  }
  function cur() { return S.players[S.turn]; }
  function pname(i) { var P = S.players[i]; return P ? (P.name || t('color_' + P.c)) : ''; }
  function placeText(n) { return t('place_' + Math.min(4, Math.max(1, n))); }
  function rollDie() {
    if (rollQueue.length) return rollQueue.shift();
    try {
      var a = new Uint8Array(1);
      do { crypto.getRandomValues(a); } while (a[0] >= 252);   /* 252 = 6 x 42: no bias */
      return a[0] % 6 + 1;
    } catch (e) { return 1 + Math.floor(Math.random() * 6); }
  }

  /* ---------------- sound (Web Audio beeps, off by default) ---------------- */
  var actx = null;
  function audio() {
    if (!prefs.sound) return null;
    try {
      if (!actx) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; actx = new AC(); }
      if (actx.state === 'suspended' && actx.resume) actx.resume();
      return actx;
    } catch (e) { return null; }
  }
  function beep(freq, delay, len, vol, type) {
    var a = audio(); if (!a) return;
    try {
      var t0 = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
      o.type = type || 'triangle';
      o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
      o.connect(g); g.connect(a.destination);
      o.start(t0); o.stop(t0 + len + 0.03);
    } catch (e) { /* sound is optional */ }
  }
  var SFX = {
    roll: function () { for (var i = 0; i < 5; i++) beep(260 + Math.random() * 380, i * 0.07, 0.04, 0.06, 'square'); },
    step: function () { beep(880, 0, 0.04, 0.05); },
    capture: function () { beep(330, 0, 0.12, 0.12, 'sawtooth'); beep(196, 0.1, 0.22, 0.12, 'sawtooth'); },
    home: function () { [659.25, 880, 1174.66].forEach(function (f, i) { beep(f, i * 0.08, 0.16, 0.1); }); },
    six: function () { beep(1046.5, 0, 0.12, 0.08); beep(1318.5, 0.08, 0.14, 0.08); },
    bad: function () { beep(220, 0, 0.25, 0.09, 'square'); },
    win: function () { [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { beep(f, i * 0.11, i === 3 ? 0.6 : 0.18, 0.12); }); }
  };
  function sfx(k) { if (prefs.sound && SFX[k]) SFX[k](); }

  /* ---------------- board ---------------- */
  var NUM = function (n) { return String(Math.round(n * 1000) / 1000); };
  function shape(c, x, y, s, cls) {
    var X = function (d) { return NUM(x + d * s); }, Y = function (d) { return NUM(y + d * s); };
    if (c === 0) return '<circle class="' + cls + '" cx="' + NUM(x) + '" cy="' + NUM(y) + '" r="' + NUM(s * 0.5) + '"/>';
    if (c === 1) return '<polygon class="' + cls + '" points="' + X(0) + ',' + Y(-0.62) + ' ' + X(0.62) + ',' + Y(0.45) + ' ' + X(-0.62) + ',' + Y(0.45) + '"/>';
    if (c === 2) return '<rect class="' + cls + '" x="' + X(-0.44) + '" y="' + Y(-0.44) + '" width="' + NUM(s * 0.88) + '" height="' + NUM(s * 0.88) + '"/>';
    return '<polygon class="' + cls + '" points="' + X(0) + ',' + Y(-0.66) + ' ' + X(0.66) + ',' + Y(0) + ' ' + X(0) + ',' + Y(0.66) + ' ' + X(-0.66) + ',' + Y(0) + '"/>';
  }
  function star(cx, cy, R, r) {
    var p = [];
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R;
      p.push(NUM(cx + rr * Math.cos(a)) + ',' + NUM(cy + rr * Math.sin(a)));
    }
    return '<polygon class="b-star" points="' + p.join(' ') + '"/>';
  }
  function cellOwner(abs) { return E.START.indexOf(abs); }
  function drawBoard() {
    var h = ['<rect class="b-bg" x="0" y="0" width="15" height="15"/>'];
    E.YARD.forEach(function (y, c) {
      h.push('<rect class="f' + c + '" x="' + y[0] + '" y="' + y[1] + '" width="6" height="6"/>');
      h.push('<rect class="b-yardin" x="' + (y[0] + 0.85) + '" y="' + (y[1] + 0.85) + '" width="4.3" height="4.3" rx=".4"/>');
      SPOTS.forEach(function (s) { h.push('<circle class="spot s' + c + '" cx="' + (y[0] + s[0]) + '" cy="' + (y[1] + s[1]) + '" r=".64"/>'); });
      h.push(shape(c, y[0] + 3, y[1] + 3, 0.62, 'f' + c + ' b-mark'));
    });
    E.TRACK.forEach(function (q, i) {
      var o = cellOwner(i);
      h.push('<rect class="cell' + (o >= 0 ? ' f' + o : '') + '" x="' + q[0] + '" y="' + q[1] + '" width="1" height="1"/>');
      if (o >= 0) h.push(shape(o, q[0] + 0.5, q[1] + 0.5, 0.5, 'ink' + o + ' b-mark'));
      if (E.STARS.indexOf(i) >= 0) h.push(star(q[0] + 0.5, q[1] + 0.5, 0.4, 0.17));
    });
    E.HOME_COL.forEach(function (col, c) {
      col.forEach(function (q) { h.push('<rect class="cell f' + c + '" x="' + q[0] + '" y="' + q[1] + '" width="1" height="1"/>'); });
    });
    var tri = [['6,6', '7.5,7.5', '6,9'], ['6,6', '9,6', '7.5,7.5'], ['9,6', '9,9', '7.5,7.5'], ['6,9', '7.5,7.5', '9,9']];
    tri.forEach(function (p, c) { h.push('<polygon class="b-tri f' + c + '" points="' + p.join(' ') + '"/>'); });
    h.push('<rect class="b-frame" x="0.04" y="0.04" width="14.92" height="14.92"/>');
    $('#bgLayer').innerHTML = h.join('');
  }
  function chip(c, sm) {
    var s = el('span', { class: 'ld-chip' + (sm ? ' sm' : ''), 'aria-hidden': 'true' });
    s.innerHTML = '<svg viewBox="-.5 -.5 1 1"><circle class="tok-out" r=".48"/><circle class="f' + c + '" r=".4"/>' + shape(c, 0, 0, 0.5, 'ink' + c) + '</svg>';
    return s;
  }

  /* ---------------- tokens ---------------- */
  function pos(c, p, tk) {
    var q;
    if (p < 0) return [E.YARD[c][0] + SPOTS[tk][0], E.YARD[c][1] + SPOTS[tk][1]];
    if (p <= E.LAST_TRACK) { q = E.TRACK[E.absOf(c, p)]; return [q[0] + 0.5, q[1] + 0.5]; }
    if (p < E.HOME) { q = E.HOME_COL[c][p - 51]; return [q[0] + 0.5, q[1] + 0.5]; }
    return HOMEPOS[c].slice();
  }
  var OFFS = { 2: [[-0.21, 0], [0.21, 0]], 3: [[-0.21, -0.19], [0.21, -0.19], [0, 0.21]], 4: [[-0.21, -0.21], [0.21, -0.21], [-0.21, 0.21], [0.21, 0.21]] };
  function tokEl(pl, tk) { return document.getElementById('tok-' + pl + '-' + tk); }
  function setT(g, x, y, s) {
    g._x = x; g._y = y;
    g.setAttribute('transform', 'translate(' + NUM(x) + ' ' + NUM(y) + ') scale(' + NUM(s) + ')');
  }
  function buildTokens() {
    var layer = $('#tokLayer');
    layer.innerHTML = '';
    S.players.forEach(function (P, i) {
      for (var k = 0; k < 4; k++) {
        var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'tok');
        g.setAttribute('id', 'tok-' + i + '-' + k);
        g.setAttribute('data-pl', i); g.setAttribute('data-t', k);
        g.innerHTML = '<circle class="tok-hit" r=".64"/><ellipse class="tok-sh" cx=".05" cy=".13" rx=".39" ry=".33"/>' +
          '<circle class="tok-out" r=".41"/><circle class="f' + P.c + '" r=".34"/>' + shape(P.c, 0, 0, 0.44, 'ink' + P.c) +
          '<circle class="tok-ring" r=".52"/>';
        layer.appendChild(g);
      }
    });
  }
  function placeTokens() {
    var groups = {}, list = [];
    S.players.forEach(function (P, i) {
      P.tokens.forEach(function (p, k) {
        var xy = pos(P.c, p, k), key = xy[0].toFixed(2) + ',' + xy[1].toFixed(2);
        var item = { pl: i, t: k, x: xy[0], y: xy[1] };
        (groups[key] = groups[key] || []).push(item);
        list.push(item);
      });
    });
    Object.keys(groups).forEach(function (key) {
      var g = groups[key], n = g.length;
      if (n === 1) { g[0].s = 1; return; }
      g.forEach(function (it, j) {
        var o = OFFS[n] ? OFFS[n][j] : [0.27 * Math.cos(j * 2 * Math.PI / n), 0.27 * Math.sin(j * 2 * Math.PI / n)];
        it.x += o[0]; it.y += o[1]; it.s = n > 4 ? 0.5 : 0.62;
      });
    });
    var layer = $('#tokLayer');
    list.forEach(function (it) { var g = tokEl(it.pl, it.t); if (g) setT(g, it.x, it.y, it.s); });
    /* the player whose turn it is sits on top of shared squares */
    for (var k = 0; k < 4; k++) { var g = tokEl(S.turn, k); if (g) layer.appendChild(g); }
  }
  /* move a token along points, one square at a time (a little hop each step) */
  function animate(g, pts, ms, onStep, cb) {
    var my = gen;
    if (!pts.length) { cb(); return; }
    if (noAnim()) { var L = pts[pts.length - 1]; setT(g, L[0], L[1], 1); cb(); return; }
    var from = [g._x, g._y], i = 0, t0 = null;
    function frame(ts) {
      if (my !== gen) return;
      if (t0 === null) t0 = ts;
      var k = (ts - t0) / ms;
      while (k >= 1 && i < pts.length) { from = pts[i]; i++; t0 += ms; k = (ts - t0) / ms; if (onStep) onStep(); }
      if (i >= pts.length) { setT(g, from[0], from[1], 1); cb(); return; }
      var to = pts[i], e = k < 0 ? 0 : k;
      setT(g, from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e - Math.sin(e * Math.PI) * 0.22, 1 + Math.sin(e * Math.PI) * 0.12);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------------- turns ---------------- */
  function doRoll() {
    if (busy || S.phase !== 'roll') return;
    busy = true;
    var my = gen, v = rollDie();
    subFn = null;
    render();
    sfx('roll');
    diceAnim(v, function () {
      if (my !== gen) return;
      var res = E.roll(S, v);
      S = res.state; save(); busy = false;
      handleEvents(res.events);
      render();
      schedule();
    });
  }
  function doMove(tk) {
    if (busy || S.phase !== 'move') return;
    var m = null;
    S.moves.forEach(function (x) { if (x.t === tk) m = x; });
    if (!m) return;
    busy = true;
    var my = gen, pl = S.turn, c = S.players[pl].c, res = E.move(S, tk), g = tokEl(pl, tk), pts = [];
    render();
    if (m.from === -1) pts.push(pos(c, 0, tk));
    else for (var p = m.from + 1; p <= m.to; p++) pts.push(pos(c, p, tk));
    g.parentNode.appendChild(g);
    animate(g, pts, 150, function () { sfx('step'); }, function () {
      if (my !== gen) return;
      var caps = res.events.filter(function (e) { return e.k === 'capture'; }), left = caps.length;
      if (!left) return finish();
      sfx('capture');
      caps.forEach(function (e) {
        var v = tokEl(e.victim, e.t);
        animate(v, [pos(S.players[e.victim].c, -1, e.t)], 380, null, function () { if (--left === 0) finish(); });
      });
    });
    function finish() {
      if (my !== gen) return;
      S = res.state; save(); busy = false;
      handleEvents(res.events);
      render();
      if (S.phase === 'over') { var mg = gen; setTimeout(function () { if (mg === gen) showResults(); }, wait('results')); }
      else schedule();
    }
  }
  function schedule() {
    if (S.phase === 'over') return;
    var P = cur(), my = gen;
    if (P.type === 'cpu') {
      setTimeout(function () {
        if (my !== gen || busy) return;
        if (S.phase === 'roll') doRoll();
        else if (S.phase === 'move') { var m = E.choose(S, cur().level); if (m) doMove(m.t); }
      }, wait(S.phase === 'roll' ? 'think' : 'pick'));
    } else if (S.phase === 'move' && prefs.auto) {
      var d = E.distinct(S.moves);
      if (d.length === 1) setTimeout(function () { if (my === gen && !busy && S.phase === 'move') doMove(d[0].t); }, wait('auto'));
    }
  }
  function humanRoll() { if (S.phase === 'roll' && cur().type === 'human') doRoll(); }
  function humanPick(tk) { if (!busy && S.phase === 'move' && cur().type === 'human') doMove(tk); }

  function handleEvents(evs) {
    var parts = [];
    evs.forEach(function (e) {
      if (e.k === 'three6') { parts.push(function () { return t('ev_three6', { name: pname(e.pl) }); }); sfx('bad'); }
      else if (e.k === 'nomove') parts.push(function () { return t('ev_nomove', { name: pname(e.pl), r: e.r }); });
      else if (e.k === 'capture') parts.push(function () { return t('ev_capture', { name: pname(e.pl), victim: pname(e.victim) }); });
      else if (e.k === 'home') { parts.push(function () { return t('ev_home', { name: pname(e.pl) }); }); sfx('home'); }
      else if (e.k === 'finish') parts.push(function () { return t('ev_finish', { name: pname(e.pl), place: placeText(e.place) }); });
      else if (e.k === 'again') { parts.push(function () { return t('ev_again'); }); if (e.why === 'six') sfx('six'); }
      else if (e.k === 'over') sfx('win');
    });
    subFn = parts.length ? function () { return parts.map(function (f) { return f(); }).join(' '); } : null;
  }

  /* ---------------- dice ---------------- */
  var FACES = { 1: ['c'], 2: ['tl', 'br'], 3: ['tl', 'c', 'br'], 4: ['tl', 'tr', 'bl', 'br'], 5: ['tl', 'tr', 'c', 'bl', 'br'], 6: ['tl', 'tr', 'ml', 'mr', 'bl', 'br'] };
  function showFace(v) {
    var on = FACES[v] || FACES[6];
    EDU.$$('#die .pip').forEach(function (p) { p.style.display = on.indexOf(p.getAttribute('data-pip')) >= 0 ? '' : 'none'; });
    $('#die').classList.toggle('red', v === 1 || v === 4);   /* Indian dice: red 1 and 4 */
    $('#rollBtn').setAttribute('data-value', v || '');
  }
  function diceAnim(v, cb) {
    var btn = $('#rollBtn');
    if (noAnim()) { showFace(v); cb(); return; }
    var my = gen, n = 0;
    btn.classList.remove('rolling'); void btn.offsetWidth; btn.classList.add('rolling');
    (function spin() {
      if (my !== gen) return;
      if (n++ < 7) { showFace(1 + Math.floor(Math.random() * 6)); setTimeout(spin, 62); return; }
      showFace(v); btn.classList.remove('rolling'); cb();
    })();
  }

  /* ---------------- rendering ---------------- */
  var RULE_ORDER = ['open1', 'six', 'three', 'capBonus', 'safe', 'exact', 'homeBonus', 'blocks', 'first'];
  function ruleLines(R) {
    var out = [];
    RULE_ORDER.forEach(function (k) {
      if (k === 'open1') out.push(t(R.open1 ? 'rk_open1' : 'r_need6'));
      else if (k === 'exact') out.push(t(R.exact ? 'rk_exact' : 'r_noexact'));
      else if (k === 'first') out.push(t(R.first ? 'rk_first' : 'r_playon'));
      else if (R[k]) out.push(t('rk_' + k));
    });
    return out;
  }
  function logText(e) {
    var v = { name: pname(e.pl), r: e.r, victim: pname(e.victim), place: e.place ? placeText(e.place) : '' };
    return t('log_' + e.k, v);
  }
  function render() {
    var game = $('#game'), P = cur(), over = S.phase === 'over';
    game.style.setProperty('--pc', CVAR[P.c]);
    game.setAttribute('data-phase', S.phase);
    game.setAttribute('data-turn', S.turn);
    var humanTurn = !over && P.type === 'human';
    var btn = $('#rollBtn'), canRoll = humanTurn && S.phase === 'roll' && !busy;
    btn.disabled = !canRoll;
    btn.classList.toggle('ready', canRoll);
    if (!busy) showFace(S.dice || 6);

    var main;
    if (over) main = t('msg_over', { name: pname(S.places[0]) });
    else if (P.type === 'cpu') main = t('msg_cpu', { name: pname(S.turn) });
    else if (S.phase === 'move' && !busy) main = t('msg_pick', { name: pname(S.turn), r: S.dice });
    else main = t('msg_roll', { name: pname(S.turn) });
    $('#msgMain').textContent = main;
    $('#msgSub').textContent = subFn ? subFn() : '';
    $('#rollHint').hidden = !canRoll;

    /* players */
    var ul = $('#players'); ul.innerHTML = '';
    S.players.forEach(function (Q, i) {
      var home = Q.tokens.filter(function (p) { return p === E.HOME; }).length;
      var li = el('li', { class: 'ld-p' + (i === S.turn && !over ? ' now' : '') + (Q.place ? ' done' : ''), style: { '--pc': CVAR[Q.c] }, id: 'pl-' + i },
        chip(Q.c),
        el('span', { class: 'ld-pinfo' },
          el('span', { class: 'ld-pn no-i18n', text: pname(i) }),
          el('span', { class: 'ld-pt', text: Q.type === 'cpu' ? t('type_cpu_' + Q.level) : t('type_human') })),
        Q.place ? el('span', { class: 'ld-place', text: (Q.place <= 3 ? MEDALS[Q.place - 1] + ' ' : '') + placeText(Q.place) })
          : el('span', { class: 'ld-ph', text: t('home_n', { n: home }) }),
        el('div', { class: 'progress', 'aria-hidden': 'true' }, el('span', { style: { width: Math.round(E.progressSum(Q) / (4 * 57) * 100) + '%' } })));
      if (i === S.turn && !over) li.setAttribute('aria-current', 'true');
      ul.appendChild(li);
    });

    /* movable tokens + where they would land */
    var can = {}, showMoves = humanTurn && S.phase === 'move' && !busy, hl = [];
    if (showMoves) {
      S.moves.forEach(function (m) { can[m.t] = 1; });
      E.distinct(S.moves).forEach(function (m) {
        var xy = pos(P.c, m.to, m.t);
        hl.push('<circle class="dest" cx="' + NUM(xy[0]) + '" cy="' + NUM(xy[1]) + '" r=".46"/>');
      });
    }
    $('#hlLayer').innerHTML = hl.join('');
    S.players.forEach(function (Q, i) {
      for (var k = 0; k < 4; k++) {
        var g = tokEl(i, k); if (!g) continue;
        var ok = showMoves && i === S.turn && can[k];
        g.classList.toggle('can', !!ok);
        if (ok) { g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button'); }
        else { g.removeAttribute('tabindex'); g.removeAttribute('role'); }
        g.setAttribute('aria-label', t('tok_label', { color: t('color_' + Q.c), n: k + 1 }));
      }
    });
    if (!busy) placeTokens();

    /* rules card, log, stats */
    var rl = $('#rulesList'); rl.innerHTML = '';
    ruleLines(S.rules).forEach(function (s) { rl.appendChild(el('li', { text: s })); });
    var lg = $('#log'); lg.innerHTML = '';
    var items = S.log.slice(-30).reverse();
    if (!items.length) lg.appendChild(el('li', { class: 'muted', text: t('log_empty') }));
    items.forEach(function (e) { lg.appendChild(el('li', null, chip(S.players[e.pl] ? S.players[e.pl].c : 0, true), el('span', { class: 'no-i18n-names', text: logText(e) }))); });
    drawBars($('#sideBars'), $('#sideStats'));
    $('#resultsBtn').hidden = !over;
    $('#soundBtn').setAttribute('aria-pressed', prefs.sound ? 'true' : 'false');
    $('#soundIc').textContent = prefs.sound ? '🔊' : '🔇';
    $('#autoBtn').setAttribute('aria-pressed', prefs.auto ? 'true' : 'false');
  }
  function drawBars(box, txt) {
    var st = S.stats, total = st.reduce(function (a, b) { return a + b; }, 0), max = Math.max.apply(null, st.concat([1]));
    box.innerHTML = '';
    st.forEach(function (n, i) {
      box.appendChild(el('div', { class: 'ld-bar' + (i === 5 ? ' six' : '') },
        el('b', { text: EDU.fmt(n) }), el('i', { style: { height: Math.round(n / max * 78) + '%' } }), el('span', { text: String(i + 1) })));
    });
    if (total) {
      var line = el('div', { class: 'ld-exp', 'aria-hidden': 'true' });
      line.style.bottom = 'calc(' + (total / 6 / max * 78) + '% * (100% - 40px) / 100% + 22px)';
      box.appendChild(line);
    }
    txt.textContent = total ? t('stats_text', { six: EDU.fmt(st[5]), total: EDU.fmt(total), pct: EDU.fmt(st[5] / total * 100, { maximumFractionDigits: 1 }) }) + ' ' + t('stats_expect')
      : t('stats_none');
  }

  /* ---------------- dialogs ---------------- */
  function openDlg(d) {
    if (typeof d.showModal === 'function') { if (!d.open) d.showModal(); }
    else { d.setAttribute('open', ''); d.classList.add('ld-fallback'); }
  }
  function closeDlg(d) {
    if (typeof d.close === 'function') { if (d.open) d.close(); }
    else { d.removeAttribute('open'); }
  }
  var draft = null;
  function seatValue(x) { return !x.on ? 'off' : x.type === 'human' ? 'human' : 'cpu_' + x.level; }
  function buildSetup() {
    var rows = $('#seatRows'); rows.innerHTML = '';
    draft.seats.forEach(function (x, c) {
      var sel = el('select', { id: 'seat-' + c, 'aria-label': t('seat_who', { color: t('color_' + c) }) });
      OPTS.forEach(function (o) { sel.appendChild(el('option', { value: o, text: t('opt_' + o) })); });
      sel.value = seatValue(x);
      var inp = el('input', { type: 'text', id: 'name-' + c, maxlength: '20', autocomplete: 'off', class: 'no-i18n',
        placeholder: t('color_' + c), 'aria-label': t('seat_name', { color: t('color_' + c) }) });
      inp.value = x.name;
      inp.disabled = !x.on;
      sel.addEventListener('change', function () {
        var v = sel.value;
        x.on = v !== 'off';
        if (v === 'human') x.type = 'human';
        else if (v !== 'off') { x.type = 'cpu'; x.level = v.slice(4); }
        inp.disabled = !x.on;
        row.classList.toggle('off', !x.on);
        seatInfo();
      });
      inp.addEventListener('input', function () { x.name = inp.value.slice(0, 20); });
      var row = el('div', { class: 'ld-seat' + (x.on ? '' : ' off') }, chip(c), sel, inp);
      rows.appendChild(row);
    });
    var rc = $('#ruleChecks'); rc.innerHTML = '';
    RULE_ORDER.forEach(function (k) {
      var cb = el('input', { type: 'checkbox', id: 'rule-' + k });
      cb.checked = !!draft.rules[k];
      cb.addEventListener('change', function () { draft.rules[k] = cb.checked; });
      rc.appendChild(el('label', { class: 'check', for: 'rule-' + k }, cb, el('span', { text: t('rk_' + k) })));
    });
    EDU.$$('#presets [data-preset]').forEach(function (b) {
      var p = b.getAttribute('data-preset');
      b.textContent = p === 'cpu' ? t('preset_cpu') : t('preset_n', { n: p });
    });
    seatInfo();
  }
  function seatInfo() {
    var n = draft.seats.filter(function (x) { return x.on; }).length;
    $('#seatInfo').textContent = n < 2 ? t('need_two') : t('seat_count', { n: n });
    $('#seatInfo').classList.toggle('bad', n < 2);
    $('#startBtn').disabled = n < 2;
  }
  function openSetup() {
    draft = JSON.parse(JSON.stringify(setup));
    buildSetup();
    openDlg($('#setupDlg'));
  }
  function startGame(su) {
    setup = normSetup(su);
    store.set('setup', setup);
    gen++; busy = false; rollQueue = rollQueue.slice(); subFn = null;
    S = E.newGame(gameCfg(setup));
    save();
    buildTokens();
    render();
    schedule();
  }
  function inProgress() {
    return S.phase !== 'over' && S.players.some(function (P) { return P.tokens.some(function (p) { return p >= 0; }); });
  }
  function showResults() {
    if (S.phase !== 'over') return;
    $('#resWin').textContent = '🏆 ' + t('win_text', { name: pname(S.places[0]) });
    var ol = $('#resPlaces'); ol.innerHTML = '';
    S.places.forEach(function (i, k) {
      var Q = S.players[i];
      ol.appendChild(el('li', null, el('span', { class: 'md', 'aria-hidden': 'true', text: MEDALS[k] }), chip(Q.c),
        el('span', { class: 'nm no-i18n', text: pname(i) }), el('span', { class: 'pl', text: placeText(k + 1) })));
    });
    drawBars($('#resBars'), $('#resStats'));
    openDlg($('#resultsDlg'));
  }

  /* ---------------- wiring ---------------- */
  $('#rollBtn').addEventListener('click', humanRoll);
  var layer = $('#tokLayer');
  layer.addEventListener('click', function (e) {
    var g = e.target.closest && e.target.closest('.tok.can');
    if (g) humanPick(+g.getAttribute('data-t'));
  });
  layer.addEventListener('keydown', function (e) {
    var g = e.target.closest && e.target.closest('.tok.can');
    if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); humanPick(+g.getAttribute('data-t')); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.querySelector('dialog[open]')) return;
    var tg = e.target, tag = tg && tg.tagName;
    if (/^(INPUT|SELECT|TEXTAREA|BUTTON|A|SUMMARY)$/.test(tag || '') || (tg.closest && tg.closest('.tok'))) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); humanRoll(); }
    else if (/^[1-4]$/.test(e.key)) humanPick(+e.key - 1);
  });
  $('#newBtn').addEventListener('click', function () {
    if (inProgress() && !confirm(t('confirm_new'))) return;
    openSetup();
  });
  $('#setupX').addEventListener('click', function () { closeDlg($('#setupDlg')); });
  $('#setupCancel').addEventListener('click', function () { closeDlg($('#setupDlg')); });
  $('#startBtn').addEventListener('click', function () {
    if (draft.seats.filter(function (x) { return x.on; }).length < 2) return;
    closeDlg($('#setupDlg'));
    startGame(draft);
  });
  $('#usualRules').addEventListener('click', function () { draft.rules = E.normRules(null); buildSetup(); });
  $('#presets').addEventListener('click', function (e) {
    var b = e.target.closest('[data-preset]'); if (!b) return;
    var p = b.getAttribute('data-preset');
    draft.seats.forEach(function (x, c) {
      if (p === 'cpu') { x.on = c === 0 || c === 2; x.type = c === 0 ? 'human' : 'cpu'; }
      else { var n = +p; x.on = n === 2 ? (c === 0 || c === 2) : c < n; x.type = 'human'; }
    });
    buildSetup();
  });
  $('#resultsBtn').addEventListener('click', showResults);
  $('#resX').addEventListener('click', function () { closeDlg($('#resultsDlg')); });
  $('#againBtn').addEventListener('click', function () { closeDlg($('#resultsDlg')); startGame(setup); });
  $('#resNew').addEventListener('click', function () { closeDlg($('#resultsDlg')); openSetup(); });
  $('#soundBtn').addEventListener('click', function () { prefs.sound = !prefs.sound; savePrefs(); render(); if (prefs.sound) sfx('step'); });
  $('#autoBtn').addEventListener('click', function () { prefs.auto = !prefs.auto; savePrefs(); render(); if (prefs.auto && !busy) schedule(); });
  $('#fsBtn').addEventListener('click', function () { EDU.fullscreen($('#game')); });

  EDU.onLang(function () {
    render();
    if ($('#setupDlg').open && draft) buildSetup();
    if ($('#resultsDlg').open) showResults();
  });

  /* Test hook (tools/tests/ludo.test.js): queue dice values, skip waits, load a position. Normal play never uses it. */
  window.__gameTest = {
    setRolls: function (a) { rollQueue = (a || []).map(Number).filter(function (v) { return v >= 1 && v <= 6; }); },
    fast: function (on) { fast = on !== false; },
    state: function () { return JSON.parse(JSON.stringify(S)); },
    load: function (s) {
      var R = E.revive(s); if (!R) return false;
      gen++; busy = false; subFn = null; S = R; save(); buildTokens(); render(); schedule(); return true;
    }
  };

  drawBoard();
  buildTokens();
  render();
  schedule();
})();
