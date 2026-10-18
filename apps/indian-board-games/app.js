/* Indian Board Games: Aadu Puli Attam / Bagh-Chal, Pallanguzhi, Navakankari.
   Rules live in engine.js (pure functions); this file is the UI. */
(function () {
  'use strict';
  var SLUG = 'indian-board-games';
  var store = EDU.store(SLUG);
  var t = EDU.t;
  var IDS = ['apl', 'pal', 'nav'];
  var reduced = false;
  try { reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { }
  var testInstant = false;
  var rnd = Math.random;

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'wa_game' });

  /* ------------------------------------------------------------ settings */
  var LEVEL = {
    hunt: { easy: { maxDepth: 1, noise: 0.35 }, medium: { maxDepth: 3, timeMs: 600 }, hard: { maxDepth: 6, timeMs: 1300 } },
    morris: { easy: { maxDepth: 1, noise: 0.35 }, medium: { maxDepth: 3, timeMs: 600 }, hard: { maxDepth: 6, timeMs: 1500 } },
    pal: { easy: { maxDepth: 1, noise: 0.45 }, medium: { maxDepth: 3, timeMs: 600 }, hard: { maxDepth: 7, timeMs: 1300 } }
  };
  var QUIET = { apl: 60, nav: 100 }; // half-moves with no capture (after placing) before a draw
  var DEF = {
    apl: { mode: 'ai', level: 'medium', side: 1, board: 'apl', target: 6 },
    pal: { mode: 'ai', level: 'medium', side: 0, seeds: 5, pasu: 'on', rounds: 3 },
    nav: { mode: 'ai', level: 'medium', side: 1, fly: 'on' }
  };
  var isAI = function (g) { return g.set.mode === 'ai'; };
  var SETS = {
    apl: [
      { k: 'mode', label: 'set_mode', opts: [['2p', 'mode_2p'], ['ai', 'mode_ai']] },
      { k: 'level', label: 'set_level', opts: [['easy', 'lvl_easy'], ['medium', 'lvl_medium'], ['hard', 'lvl_hard']], show: isAI },
      { k: 'side', label: 'set_side', opts: [[1, 'side_goats'], [2, 'side_tigers']], show: isAI },
      { k: 'board', label: 'set_board', opts: [['apl', 'board_apl'], ['bagh', 'board_bagh']] },
      { k: 'target', label: 'set_target', opts: [[5, 'target_n', 5], [6, 'target_n', 6], [7, 'target_n', 7], [15, 'target_all']], show: function (g) { return g.set.board === 'apl'; } }
    ],
    pal: [
      { k: 'mode', label: 'set_mode', opts: [['2p', 'mode_2p'], ['ai', 'mode_ai']] },
      { k: 'level', label: 'set_level', opts: [['easy', 'lvl_easy'], ['medium', 'lvl_medium'], ['hard', 'lvl_hard']], show: isAI },
      { k: 'side', label: 'set_start', opts: [[0, 'start_bottom'], [1, 'start_top']] },
      { k: 'seeds', label: 'set_seeds', opts: [[5, 'n_seeds', 5], [6, 'n_seeds', 6]] },
      { k: 'pasu', label: 'set_pasu', opts: [['on', 'on'], ['off', 'off']] },
      { k: 'rounds', label: 'set_rounds', opts: [[1, 'rounds_1'], [3, 'rounds_n', 3], [5, 'rounds_n', 5]] }
    ],
    nav: [
      { k: 'mode', label: 'set_mode', opts: [['2p', 'mode_2p'], ['ai', 'mode_ai']] },
      { k: 'level', label: 'set_level', opts: [['easy', 'lvl_easy'], ['medium', 'lvl_medium'], ['hard', 'lvl_hard']], show: isAI },
      { k: 'side', label: 'set_side', opts: [[1, 'side_first'], [2, 'side_second']], show: isAI },
      { k: 'fly', label: 'set_fly', opts: [['on', 'on'], ['off', 'off']] }
    ]
  };

  /* ------------------------------------------------------------ game objects */
  function engineOf(id) { return id === 'apl' ? IBG.hunt : id === 'pal' ? IBG.pal : IBG.morris; }
  function freshState(id, set) {
    if (id === 'apl') return IBG.hunt.init(set.board, { target: set.board === 'bagh' ? 5 : set.target });
    if (id === 'nav') return IBG.morris.init({ fly: set.fly === 'on' });
    var s = IBG.pal.init({ seeds: set.seeds, pasu: set.pasu === 'on', rounds: set.rounds });
    if (set.side === 1) { s.turn = 1; s.starter = 1; }
    return s;
  }
  function validState(id, s) {
    if (!s || typeof s !== 'object' || !Array.isArray(s.b || s.pits)) return false;
    if (id === 'apl') return s.g === 'hunt' && IBG.hunt.boards[s.v] && s.b.length === IBG.hunt.boards[s.v].n;
    if (id === 'nav') return s.g === 'morris' && s.b.length === 24 && Array.isArray(s.hand);
    return s.g === 'pal' && s.pits.length === 14 && Array.isArray(s.blk) && Array.isArray(s.st);
  }
  var G = {};
  IDS.forEach(function (id) {
    var saved = store.get('g_' + id, null), set = {};
    Object.keys(DEF[id]).forEach(function (k) { set[k] = DEF[id][k]; });
    if (saved && saved.set) Object.keys(set).forEach(function (k) { if (saved.set[k] !== undefined) set[k] = saved.set[k]; });
    var g = { id: id, set: set, s: null, hist: [], keys: [], res: null, sel: null, pend: null, hint: null, note: '', busy: false, view: null, cancel: null };
    if (saved && validState(id, saved.s)) {
      g.s = saved.s; g.hist = Array.isArray(saved.hist) ? saved.hist.filter(function (x) { return validState(id, x); }) : [];
      g.keys = Array.isArray(saved.keys) ? saved.keys : []; g.res = saved.res || null; g.resumed = g.hist.length > 0;
    } else g.s = freshState(id, set);
    G[id] = g;
  });
  var cur = store.get('active', 'apl');
  if (IDS.indexOf(cur) < 0) cur = 'apl';

  function save(g) {
    var hist = g.hist.length > 300 ? g.hist.slice(g.hist.length - 300) : g.hist;
    store.set('g_' + g.id, { set: g.set, s: g.s, hist: hist, keys: g.keys.slice(-400), res: g.res });
  }
  function humanSide(g) { return g.id === 'pal' ? 0 : g.set.side; }
  function sideToMove(g) { return engineOf(g.id).side(g.s); }
  function humanTurn(g) { return !isAI(g) || sideToMove(g) === humanSide(g); }
  function canAct(g) { return !g.res && !g.busy && humanTurn(g) && !(g.id === 'pal' && g.s.roundOver); }

  function playerName(g, side) {
    if (g.id === 'apl') {
      var base = t(side === 1 ? 'goats' : 'tigers');
      if (isAI(g)) base += ' (' + t(side === humanSide(g) ? 'you' : 'computer') + ')';
      return base;
    }
    var human = g.id === 'pal' ? 0 : g.set.side;
    if (isAI(g)) return t(side === human ? 'you' : 'computer');
    var first = g.id === 'pal' ? 0 : 1;
    return t(side === first ? 'player1' : 'player2');
  }

  function computeResult(g) {
    var E = engineOf(g.id), st = E.status(g.s);
    if (st) return st;
    if (g.id === 'pal') return null;
    if (g.s.quiet >= QUIET[g.id]) return { winner: 0, reason: 'quiet' };
    var k = E.key(g.s), placing = g.id === 'apl' ? g.s.hand > 0 : (g.s.hand[1] > 0 || g.s.hand[2] > 0);
    if (!placing) { var c = 0; for (var i = 0; i < g.keys.length; i++) if (g.keys[i] === k) c++; if (c >= 3) return { winner: 0, reason: 'rep' }; }
    return null;
  }

  /* ------------------------------------------------------------ moves */
  function stopAI(g) { if (g.cancel) { g.cancel(); g.cancel = null; } if (g.busy && !g.view) g.busy = false; }

  function commit(g, newState, note) {
    g.hist.push(g.s);
    g.s = newState; g.sel = null; g.pend = null; g.hint = null; g.note = note || '';
    g.keys.push(engineOf(g.id).key(g.s));
    g.res = computeResult(g);
    save(g); render(); maybeAI(g);
  }

  function huntNote(g, m) { return m && m.over >= 0 ? t('ev_goat_cap') : ''; }
  function navNote(g, m, side) { return m && m.rem >= 0 ? t('ev_mill', { p: playerName(g, side) }) : ''; }

  function doMove(g, m) {
    if (g.res) return;
    if (g.id === 'apl') commit(g, IBG.hunt.apply(g.s, m), huntNote(g, m));
    else if (g.id === 'nav') { var side = g.s.turn; commit(g, IBG.morris.apply(g.s, m), navNote(g, m, side)); }
    else sowAnimated(g, m);
  }

  function palNote(g, ev, mover) {
    var parts = [];
    ev.forEach(function (e) {
      if (e.t === 'pasu') parts.push(t('ev_pasu', { p: playerName(g, e.who) }));
      if (e.t === 'cap') parts.push(t('ev_cap', { p: playerName(g, mover), n: EDU.fmt(e.n) }));
    });
    return parts.join(' ');
  }

  function sowAnimated(g, pit) {
    var mover = g.s.turn, r = IBG.pal.sow(g.s, pit, true), ev = r.events;
    var note = palNote(g, ev, mover);
    if (reduced || testInstant) { commit(g, r.state, note); return; }
    g.busy = true; g.sel = null; g.hint = null;
    var view = { pits: g.s.pits.slice(), st: g.s.st.slice(), hl: pit, hand: 0, flash: -1 };
    g.view = view;
    var i = 0, delay = Math.max(70, Math.min(260, Math.round(7000 / Math.max(1, ev.length))));
    var token = {};
    g.anim = token;
    function step() {
      if (g.anim !== token) return;
      if (i >= ev.length) { g.view = null; g.busy = false; commit(g, r.state, note); return; }
      var e = ev[i++], d = delay;
      view.flash = -1;
      if (e.t === 'take') { view.hand = view.pits[e.pit]; view.pits[e.pit] = 0; view.hl = e.pit; }
      else if (e.t === 'drop') { view.pits[e.pit]++; view.hand = Math.max(0, view.hand - 1); view.hl = e.pit; }
      else if (e.t === 'pasu') { view.st[e.who] += 4; view.pits[e.pit] = 0; view.flash = e.pit; d = delay + 350; }
      else if (e.t === 'cap') { view.st[e.who] += view.pits[e.pit]; view.pits[e.pit] = 0; view.flash = e.pit; d = delay + 350; }
      else d = 120;
      render();
      setTimeout(step, d);
    }
    render();
    setTimeout(step, 120);
  }

  function maybeAI(g) {
    if (g.res || !isAI(g) || humanTurn(g) || g.busy) return;
    if (g.id === 'pal' && g.s.roundOver) return;
    var E = engineOf(g.id), cfg = LEVEL[g.id === 'apl' ? 'hunt' : g.id === 'nav' ? 'morris' : 'pal'][g.set.level] || LEVEL.hunt.medium;
    var opts = {}; Object.keys(cfg).forEach(function (k) { opts[k] = cfg[k]; }); opts.rand = rnd;
    g.busy = true; render();
    var started = Date.now(), snapshot = g.s;
    g.cancel = IBG.runSliced(IBG.bestMove(g.s, opts), function (res) {
      g.cancel = null;
      var wait = Math.max(0, 350 - (Date.now() - started));
      setTimeout(function () {
        if (g.s !== snapshot) { g.busy = false; return; }
        g.busy = false;
        if (res && res.move !== undefined) doMove(g, res.move); else render();
      }, wait);
    });
    void E;
  }

  /* ------------------------------------------------------------ input */
  function onPoint(i) {
    var g = G[cur];
    if (!canAct(g)) { if (g.busy) EDU.toast(t('st_thinking')); return; }
    g.hint = null;
    if (g.id === 'pal') {
      if (IBG.pal.moves(g.s).indexOf(i) >= 0) doMove(g, i);
      else EDU.toast(t('pal_pick_own'));
      return;
    }
    var E = engineOf(g.id), legal = E.moves(g.s), b = g.s.b, me = g.s.turn, c;
    if (g.id === 'nav' && g.pend) {
      c = g.pend.filter(function (m) { return m.rem === i; });
      if (c.length) doMove(g, c[0]); else EDU.toast(t('st_nav_remove', { p: playerName(g, me) }));
      return;
    }
    // placing
    c = legal.filter(function (m) { return m.from < 0 && m.to === i; });
    if (!c.length && g.sel !== null) c = legal.filter(function (m) { return m.from === g.sel && m.to === i; });
    if (c.length) {
      if (g.id === 'nav' && c[0].rem >= 0) { g.pend = c; g.sel = null; render(); return; }
      doMove(g, c[0]); return;
    }
    if (b[i] === me && legal.some(function (m) { return m.from === i; })) { g.sel = (g.sel === i ? null : i); render(); return; }
    if (b[i] === me) { EDU.toast(t('no_moves_piece')); }
    g.sel = null; render();
  }

  function undo() {
    var g = G[cur];
    if (g.view) { g.anim = null; g.view = null; g.busy = false; }
    stopAI(g);
    if (g.pend) { g.pend = null; render(); return; }
    if (!g.hist.length) { EDU.toast(t('no_undo')); render(); return; }
    var popped = 0;
    do { g.s = g.hist.pop(); g.keys.pop(); popped++; } while (isAI(g) && g.hist.length && !humanTurn(g));
    g.res = null; g.sel = null; g.hint = null; g.note = ''; g.busy = false;
    save(g); render(); maybeAI(g);
  }

  function newGame(confirmFirst) {
    var g = G[cur];
    if (confirmFirst && g.hist.length && !g.res && !confirm(t('confirm_new'))) return false;
    if (g.view) { g.anim = null; g.view = null; }
    stopAI(g); g.busy = false;
    g.s = freshState(cur, g.set); g.hist = []; g.keys = []; g.res = null; g.sel = null; g.pend = null; g.hint = null; g.note = '';
    save(g); render(); maybeAI(g);
    return true;
  }

  function hint() {
    var g = G[cur];
    if (!canAct(g)) return;
    if (g.id === 'pal' && g.s.roundOver) return;
    var cfg = { maxDepth: g.id === 'pal' ? 5 : 4, timeMs: 700, rand: rnd };
    var btn = EDU.$('#hint'); btn.disabled = true;
    var snap = g.s;
    IBG.runSliced(IBG.bestMove(g.s, cfg), function (res) {
      btn.disabled = false;
      if (g.s !== snap || !res) return;
      g.hint = res.move; g.sel = null; g.pend = null; render();
      EDU.toast(t('hint_on'));
    });
  }

  function nextRound() {
    var g = G.pal;
    if (!g.s.roundOver || g.s.over) return;
    g.hist.push(g.s); g.s = IBG.pal.newRound(g.s); g.keys.push(IBG.pal.key(g.s)); g.note = '';
    save(g); render(); maybeAI(g);
  }

  /* ------------------------------------------------------------ SVG drawing */
  var DEFS = '<defs>' +
    '<g id="ibg-goat"><circle r="5" fill="#f8f9fa" stroke="#343a40" stroke-width=".7"/>' +
    '<path d="M-2.6 -1.6 Q-4.2 -3.6 -2.2 -4.4 M2.6 -1.6 Q4.2 -3.6 2.2 -4.4" fill="none" stroke="#6c5a3f" stroke-width=".9" stroke-linecap="round"/>' +
    '<path d="M-3.4 -.6 L-4.6 .2 M3.4 -.6 L4.6 .2" stroke="#868e96" stroke-width=".9" stroke-linecap="round"/>' +
    '<circle cx="-1.3" cy="-.3" r=".55" fill="#212529"/><circle cx="1.3" cy="-.3" r=".55" fill="#212529"/>' +
    '<ellipse cy="2.1" rx="1.4" ry=".9" fill="#ced4da"/></g>' +
    '<g id="ibg-tiger"><circle r="5" fill="#f59f00" stroke="#5c2b00" stroke-width=".7"/>' +
    '<path d="M-4.7 -1.2 L-2.6 -.7 M-4.6 1.2 L-2.7 .9 M4.7 -1.2 L2.6 -.7 M4.6 1.2 L2.7 .9 M-1 -4.7 L-.5 -2.9 M1 -4.7 L.5 -2.9 M0 -4.9 L0 -3.3" stroke="#1f1300" stroke-width=".75" stroke-linecap="round"/>' +
    '<circle cx="-1.4" cy="-.6" r=".6" fill="#1f1300"/><circle cx="1.4" cy="-.6" r=".6" fill="#1f1300"/>' +
    '<path d="M-.9 1.3 L.9 1.3 L0 2.3 Z" fill="#1f1300"/><ellipse cy="3" rx="2" ry="1.1" fill="#fff4e6" opacity=".85"/></g>' +
    '<g id="ibg-p1"><circle r="5" fill="#fff4e0" stroke="#7a4b00" stroke-width=".8"/><circle r="2.6" fill="none" stroke="#c99a52" stroke-width=".7"/></g>' +
    '<g id="ibg-p2"><circle r="5" fill="#25262b" stroke="#c1c2c5" stroke-width=".8"/><circle r="2.6" fill="none" stroke="#5c5f66" stroke-width=".7"/></g>' +
    '</defs>';
  function f(n) { return Math.round(n * 100) / 100; }
  function ptGroup(i, x, y, hitR, label, inner) {
    return '<g class="pt" data-pt="' + i + '" tabindex="0" role="button" aria-label="' + EDU.esc(label) + '">' +
      '<circle class="hit" cx="' + f(x) + '" cy="' + f(y) + '" r="' + hitR + '"/>' + inner + '</g>';
  }
  function useAt(id, x, y, r) { return '<use href="#' + id + '" transform="translate(' + f(x) + ' ' + f(y) + ') scale(' + f(r / 5) + ')"/>'; }
  function ring(cls, x, y, r) { return '<circle class="' + cls + '" cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(r) + '"/>'; }

  function drawHunt(g) {
    var s = g.s, B = IBG.hunt.boards[s.v], P = B.pts, apl = s.v === 'apl';
    var pr = apl ? 4.4 : 6.2, hitR = apl ? 5.2 : 9.5;
    var out = DEFS;
    if (apl) {
      out += '<polygon class="bd-fill" points="50,5 5,95 95,95"/>';
      out += '<rect class="bd-fill2" x="4" y="' + f(P[1][1]) + '" width="92" height="' + f(P[13][1] - P[1][1]) + '"/>';
    } else out += '<rect class="bd-fill" x="10" y="10" width="80" height="80"/>';
    B.lines.forEach(function (ln) { var a = P[ln[0]], z = P[ln[ln.length - 1]]; out += '<line class="ln" x1="' + f(a[0]) + '" y1="' + f(a[1]) + '" x2="' + f(z[0]) + '" y2="' + f(z[1]) + '"/>'; });
    var act = canAct(g), legal = act ? IBG.hunt.moves(s) : [], dest = {}, capDest = {};
    if (act && g.sel !== null) legal.forEach(function (m) { if (m.from === g.sel) { dest[m.to] = 1; if (m.over >= 0) capDest[m.to] = 1; } });
    var last = s.last, hm = g.hint;
    for (var i = 0; i < B.n; i++) {
      var x = P[i][0], y = P[i][1], v = s.b[i], inner = '';
      if (last && last.from === i && !v) inner += ring('lastf', x, y, pr * 0.55);
      if (last && last.over === i && !v) inner += '<path class="capx" d="M' + f(x - 2) + ' ' + f(y - 2) + 'l4 4m0 -4l-4 4"/>';
      if (v === 2) inner += useAt('ibg-tiger', x, y, pr);
      else if (v === 1) inner += useAt('ibg-goat', x, y, pr);
      else inner += ring('dot', x, y, apl ? 1.1 : 1.5);
      if (last && last.to === i) inner += ring('lastr', x, y, pr + 1);
      if (dest[i]) inner += capDest[i] ? ring('capr', x, y, pr * 0.65) : ring('dest', x, y, apl ? 1.9 : 2.6);
      if (g.sel === i) inner += ring('selr', x, y, pr + 1.2);
      if (hm && (hm.to === i || hm.from === i)) inner += ring('hintr', x, y, pr + 1.6);
      var lab = t(v === 2 ? 'pt_tiger' : v === 1 ? 'pt_goat' : 'pt_empty', { n: i + 1 });
      out += ptGroup(i, x, y, hitR, lab, inner);
    }
    return { view: '0 0 100 100', svg: out };
  }

  function drawMorris(g) {
    var s = g.s, P = IBG.morris.pts, S = 14, O = 8, X = function (c) { return O + c * S; };
    var view = s;
    if (g.pend) { view = { b: s.b.slice(), turn: s.turn, hand: s.hand, last: null }; var m0 = g.pend[0]; if (m0.from >= 0) view.b[m0.from] = 0; view.b[m0.to] = s.turn; }
    var out = DEFS + '<rect class="bd-fill" x="2" y="2" width="96" height="96" rx="4"/>';
    [0, 1, 2].forEach(function (k) { out += '<rect class="ln" x="' + X(k) + '" y="' + X(k) + '" width="' + (S * (6 - 2 * k)) + '" height="' + (S * (6 - 2 * k)) + '"/>'; });
    out += '<line class="ln" x1="' + X(3) + '" y1="' + X(0) + '" x2="' + X(3) + '" y2="' + X(2) + '"/><line class="ln" x1="' + X(3) + '" y1="' + X(4) + '" x2="' + X(3) + '" y2="' + X(6) + '"/>';
    out += '<line class="ln" x1="' + X(0) + '" y1="' + X(3) + '" x2="' + X(2) + '" y2="' + X(3) + '"/><line class="ln" x1="' + X(4) + '" y1="' + X(3) + '" x2="' + X(6) + '" y2="' + X(3) + '"/>';
    var act = canAct(g), legal = act && !g.pend ? IBG.morris.moves(s) : [], dest = {}, rem = {};
    if (act && g.sel !== null) legal.forEach(function (m) { if (m.from === g.sel) dest[m.to] = 1; });
    if (g.pend) g.pend.forEach(function (m) { if (m.rem >= 0) rem[m.rem] = 1; });
    var last = s.last, hm = g.hint, pr = 5.2;
    for (var i = 0; i < 24; i++) {
      var x = X(P[i][0]), y = X(P[i][1]), v = view.b[i], inner = '';
      if (!g.pend && last && last.from === i && !v) inner += ring('lastf', x, y, 2.6);
      if (!g.pend && last && last.rem === i && !v) inner += '<path class="capx" d="M' + f(x - 2.2) + ' ' + f(y - 2.2) + 'l4.4 4.4m0 -4.4l-4.4 4.4"/>';
      if (v) inner += useAt(v === 1 ? 'ibg-p1' : 'ibg-p2', x, y, pr);
      else inner += ring('dot', x, y, 1.5);
      if (v && IBG.morris.inMill(view.b, i)) inner += ring('millr', x, y, 2);
      if (!g.pend && last && last.to === i) inner += ring('lastr', x, y, pr + 1);
      if (dest[i]) inner += ring('dest', x, y, 2.4);
      if (rem[i]) inner += ring('remr', x, y, pr + 1.4);
      if (g.sel === i) inner += ring('selr', x, y, pr + 1.3);
      if (hm && (hm.to === i || hm.from === i || hm.rem === i)) inner += ring('hintr', x, y, pr + 1.8);
      var lab = v ? t('pt_piece', { n: i + 1, p: playerName(g, v) }) : t('pt_empty', { n: i + 1 });
      out += ptGroup(i, x, y, 7, lab, inner);
    }
    return { view: '0 0 100 100', svg: out };
  }

  var SEEDPOS = [];
  for (var j = 0; j < 22; j++) { var rr = 1.6 * Math.sqrt(j + 0.4), an = j * 2.39996; SEEDPOS.push([rr * Math.cos(an), rr * Math.sin(an)]); }
  function drawPal(g) {
    var s = g.s, v = g.view || { pits: s.pits, st: s.st, hl: -1, flash: -1 };
    var out = '<rect class="pal-wood" x="1" y="9" width="158" height="52" rx="10"/>';
    var act = canAct(g), legal = act ? IBG.pal.moves(s) : [], last = s.last;
    for (var i = 0; i < 14; i++) {
      var top = i >= 7, k = top ? 13 - i : i, x = 15 + k * 21.7, y = top ? 23 : 47, n = v.pits[i], inner = '';
      var closed = s.blk[i];
      inner += '<circle class="pal-pit' + (closed ? ' closed' : '') + '" cx="' + f(x) + '" cy="' + y + '" r="9"/>';
      if (closed) inner += '<path class="pal-x" d="M' + f(x - 4) + ' ' + (y - 4) + 'l8 8m0 -8l-8 8"/>';
      for (var q = 0; q < Math.min(n, SEEDPOS.length); q++) inner += '<circle class="seed" cx="' + f(x + SEEDPOS[q][0]) + '" cy="' + f(y + SEEDPOS[q][1]) + '" r="1.15"/>';
      if (legal.indexOf(i) >= 0) inner += ring('pal-can', x, y, 9.8);
      if (v.hl === i) inner += ring('selr', x, y, 10.2);
      if (v.flash === i) inner += ring('capr', x, y, 10.6);
      if (!g.view && last && last.pit === i) inner += ring('lastr', x, y, 10.4);
      if (g.hint === i) inner += ring('hintr', x, y, 11);
      var ty = top ? 6.4 : 68.6;
      inner += '<text class="pal-n' + (closed ? ' muted' : '') + '" x="' + f(x) + '" y="' + ty + '" text-anchor="middle">' + (closed ? '–' : EDU.fmt(n)) + '</text>';
      var lab = closed ? t('pit_closed', { n: k + 1 }) : t('pit_aria', { n: k + 1, c: EDU.fmt(n) });
      out += ptGroup(i, x, y, 10.5, lab, inner);
    }
    return { view: '0 0 160 72', svg: out };
  }

  /* ------------------------------------------------------------ text & panels */
  function statusText(g) {
    var s = g.s;
    if (g.res) {
      var r = g.res;
      if (g.id === 'apl') {
        if (r.winner === 0) return r.reason === 'rep' ? t('draw_rep') : t('draw_quiet', { n: QUIET.apl / 2 });
        if (r.winner === 2) return r.reason === 'cap' ? t('win_tigers_cap', { n: s.cap }) : t('win_tigers_block');
        return t('win_goats');
      }
      if (g.id === 'nav') {
        if (r.winner === 0) return r.reason === 'rep' ? t('draw_rep') : t('draw_quiet', { n: QUIET.nav / 2 });
        return t(r.reason === 'pieces' ? 'win_nav_pieces' : 'win_nav_blocked', { p: playerName(g, r.winner) });
      }
      var a = s.st[0], b = s.st[1];
      if (a === b) return t('pal_draw', { n: EDU.fmt(a) });
      return t('pal_win', { p: playerName(g, a > b ? 0 : 1), n: EDU.fmt(Math.max(a, b)) });
    }
    var who = playerName(g, sideToMove(g));
    var pre = g.note ? g.note + ' ' : '';
    if (g.view) return t('st_sowing', { n: EDU.fmt(g.view.hand) });
    if (g.busy) return pre + t('st_thinking');
    if (g.id === 'pal') {
      if (s.roundOver) return t('pal_round_over', { r: s.round, p1: playerName(g, 0), a: EDU.fmt(s.st[0]), p2: playerName(g, 1), b: EDU.fmt(s.st[1]) });
      return pre + t('st_pal', { p: who });
    }
    if (g.id === 'apl') {
      if (s.turn === 1) return pre + (s.hand > 0 ? t('st_goat_place', { p: who, n: s.hand }) : t('st_goat_move', { p: who }));
      return pre + t('st_tiger', { p: who });
    }
    if (g.pend) return t('st_nav_remove', { p: who });
    if (s.hand[s.turn] > 0) return pre + t('st_nav_place', { p: who, n: s.hand[s.turn] });
    if (IBG.morris.canFly(s, s.turn)) return pre + t('st_nav_fly', { p: who });
    return pre + t('st_nav_move', { p: who });
  }

  function scoreBox(name, color, nums, turn) {
    return '<div class="ibg-score' + (turn ? ' turn' : '') + '"><div class="who"><i style="background:' + color + '"></i><span>' + EDU.esc(name) + '</span></div><div class="nums">' + nums + '</div></div>';
  }
  function num(label, n) { return EDU.esc(label) + ': <b>' + EDU.fmt(n) + '</b>'; }
  function scoresHtml(g) {
    var s = g.s, active = !g.res, tm = sideToMove(g);
    if (g.id === 'apl') {
      var onb = s.b.filter(function (x) { return x === 1; }).length;
      return scoreBox(playerName(g, 1), '#f8f9fa', num(t('sc_to_place'), s.hand) + ' · ' + num(t('sc_on_board'), onb), active && tm === 1) +
        scoreBox(playerName(g, 2), '#f59f00', num(t('sc_captured'), s.cap) + ' / ' + EDU.fmt(s.target), active && tm === 2);
    }
    if (g.id === 'nav') {
      return [1, 2].map(function (p) {
        return scoreBox(playerName(g, p), p === 1 ? '#fff4e0' : '#25262b', num(t('sc_in_hand'), s.hand[p]) + ' · ' + num(t('sc_on_board'), IBG.morris.count(s, p)), active && tm === p);
      }).join('');
    }
    var st = g.view ? g.view.st : s.st;
    return [0, 1].map(function (p) {
      var row = 0; for (var k = 0; k < 7; k++) row += (g.view ? g.view.pits : s.pits)[p * 7 + k];
      return scoreBox(playerName(g, p) + ' · ' + t(p === 0 ? 'row_bottom' : 'row_top'), p === 0 ? '#e8590c' : '#1971c2', num(t('sc_seeds'), st[p]) + ' · ' + num(t('sc_in_row'), row), active && !s.roundOver && tm === p);
    }).join('') + '<div class="ibg-score" style="grid-column:1/-1"><div class="nums">' + EDU.esc(t('sc_round', { r: s.round, n: s.rounds })) + '</div></div>';
  }

  function rulesList(g) {
    var keys = [], vars = {};
    if (g.id === 'apl') {
      var bagh = g.s.v === 'bagh', B = IBG.hunt.boards[g.s.v];
      vars = { t: B.tigers.length, g: B.goats, n: g.s.target, m: QUIET.apl / 2, pts: B.n };
      keys = [bagh ? 'h_board_bagh' : 'h_board_apl', bagh ? 'h_start_bagh' : 'h_start_apl', 'h_r2', 'h_r3', 'h_r4', 'h_r5', g.s.target >= B.goats ? 'h_r6_all' : 'h_r6', 'h_r7', bagh ? 'h_note_bagh' : 'h_note_target'];
    } else if (g.id === 'pal') {
      vars = { s: g.s.S, r: g.s.rounds };
      keys = ['p_r1', 'p_r2', 'p_r3', 'p_r4', 'p_r5', g.s.pasu ? 'p_r6' : 'p_r6off', 'p_r7', 'p_r8', g.s.rounds === 1 ? 'p_r9_one' : 'p_r9'];
    } else {
      vars = { m: QUIET.nav / 2 };
      keys = ['n_r1', 'n_r2', 'n_r3', 'n_r4', g.s.fly ? 'n_r5' : 'n_r5off', 'n_r6', 'n_r7'];
    }
    return keys.map(function (k) { return '<li>' + EDU.esc(t(k, vars)) + '</li>'; }).join('');
  }

  function renderSettings(g) {
    var box = EDU.$('#sets'); box.innerHTML = '';
    SETS[g.id].forEach(function (d) {
      if (d.show && !d.show(g)) return;
      var seg = EDU.el('div', { class: 'seg', role: 'group', 'aria-label': t(d.label) });
      d.opts.forEach(function (o) {
        var txt = o[2] !== undefined ? t(o[1], { n: o[2] }) : t(o[1]);
        seg.appendChild(EDU.el('button', { type: 'button', text: txt, 'aria-pressed': String(g.set[d.k] === o[0]), dataset: { set: d.k, val: String(o[0]) },
          onclick: function () { changeSetting(d.k, o[0]); } }));
      });
      box.appendChild(EDU.el('div', { class: 'ibg-set' }, EDU.el('span', { text: t(d.label) }), seg));
    });
  }

  function changeSetting(k, v) {
    var g = G[cur];
    if (g.set[k] === v) return;
    var old = g.set[k];
    g.set[k] = v;
    var needsNew = !(k === 'level');
    if (needsNew) {
      if (!newGame(true)) { g.set[k] = old; render(); return; }
    } else { save(g); render(); maybeAI(g); }
  }

  var lastStatus = '';
  function render() {
    var g = G[cur];
    EDU.$$('.ibg-tab').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.game === cur)); b.tabIndex = b.dataset.game === cur ? 0 : -1; });
    var d = g.id === 'apl' ? drawHunt(g) : g.id === 'nav' ? drawMorris(g) : drawPal(g);
    var svg = EDU.$('#board');
    svg.setAttribute('viewBox', d.view);
    svg.setAttribute('class', 'game-' + g.id + (g.id === 'apl' ? ' v-' + g.s.v : ''));
    svg.innerHTML = d.svg;
    var st = statusText(g), el = EDU.$('#status');
    if (st !== lastStatus) { el.textContent = st; lastStatus = st; }
    el.classList.toggle('win', !!g.res);
    EDU.$('#scores').innerHTML = scoresHtml(g);
    EDU.$('#rules').innerHTML = rulesList(g);
    EDU.$('#history').textContent = t('hist_' + g.id);
    EDU.$('#undo').disabled = !g.hist.length && !g.pend;
    EDU.$('#hint').disabled = !canAct(g);
    var extra = EDU.$('#extra'); extra.innerHTML = '';
    if (g.id === 'pal' && g.s.roundOver && !g.s.over && !g.view) {
      extra.appendChild(EDU.el('button', { class: 'btn btn-accent btn-lg', id: 'nextRound', text: t('next_round'), onclick: nextRound }));
    }
    if (g.res) extra.appendChild(EDU.el('button', { class: 'btn btn-primary', id: 'playAgain', text: t('play_again'), onclick: function () { newGame(false); } }));
    if (EDU.$('#sets').dataset.for !== g.id + JSON.stringify(g.set) + EDU.lang) { renderSettings(g); EDU.$('#sets').dataset.for = g.id + JSON.stringify(g.set) + EDU.lang; }
  }

  function switchTo(id) {
    if (IDS.indexOf(id) < 0 || id === cur) return;
    var old = G[cur]; if (old.cancel) { stopAI(old); }
    cur = id; store.set('active', cur); render(); maybeAI(G[cur]);
  }

  /* ------------------------------------------------------------ wiring */
  EDU.$('#tabs').addEventListener('click', function (e) { var b = e.target.closest('.ibg-tab'); if (b) switchTo(b.dataset.game); });
  EDU.$('#tabs').addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var i = IDS.indexOf(cur), dir = (e.key === 'ArrowRight') !== (document.documentElement.dir === 'rtl') ? 1 : -1;
    switchTo(IDS[(i + dir + 3) % 3]); EDU.$('#tab-' + cur).focus();
  });
  var svgEl = EDU.$('#board');
  svgEl.addEventListener('click', function (e) { var p = e.target.closest('[data-pt]'); if (p) onPoint(+p.dataset.pt); });
  svgEl.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var p = e.target.closest('[data-pt]'); if (!p) return;
    e.preventDefault(); var idx = +p.dataset.pt; onPoint(idx);
    var again = EDU.$('#board [data-pt="' + idx + '"]'); if (again) again.focus();
  });
  EDU.$('#newGame').addEventListener('click', function () { newGame(true); });
  EDU.$('#undo').addEventListener('click', undo);
  EDU.$('#hint').addEventListener('click', hint);
  EDU.$('#fs').addEventListener('click', function () { EDU.fullscreen(EDU.$('#playCard')); });

  window.__gameTest = {
    instant: function (on) { testInstant = !!on; },
    setRandom: function (fn) { rnd = typeof fn === 'function' ? fn : Math.random; },
    /* load a position for pass-and-play: id = 'apl' | 'pal' | 'nav' */
    load: function (id, s, set) {
      var g = G[id]; if (!g) return false;
      if (g.view) { g.anim = null; g.view = null; }
      stopAI(g); g.busy = false;
      if (set) Object.keys(set).forEach(function (k) { g.set[k] = set[k]; });
      g.set.mode = '2p';
      if (id === 'apl' && s && s.v) g.set.board = s.v;
      g.s = JSON.parse(JSON.stringify(s)); g.hist = []; g.keys = []; g.res = null; g.sel = null; g.pend = null; g.hint = null; g.note = '';
      if (cur !== id) { cur = id; store.set('active', cur); }
      save(g); render(); return true;
    },
    state: function (id) { return JSON.parse(JSON.stringify(G[id || cur].s)); },
    result: function (id) { return G[id || cur].res; },
    engine: IBG
  };

  EDU.onLang(function () { lastStatus = ''; render(); });
  render();
  if (G[cur].resumed) EDU.toast(t('resumed'));
  maybeAI(G[cur]);
})();
