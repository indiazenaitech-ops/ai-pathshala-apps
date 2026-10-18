/* Ludo rules engine: pure functions, no DOM.  state + roll -> legal moves -> new state.
   Used by app.js in the browser (window.LudoEngine) and by node test scripts (module.exports).

   Board: the classic 15 x 15 cross. TRACK lists the 52 shared squares clockwise as [col, row]
   (row 0 = top), starting at Red's start square. Colours sit clockwise: red (top-left yard),
   green (top-right), yellow (bottom-right), blue (bottom-left). Each start square is 13 squares
   after the previous one; each star (safe) square is 8 squares after a start square.

   Token progress p: -1 = in its yard, 0..50 = on the shared track (0 = own start square),
   51..55 = the 5 squares of its own home column, 56 = home (the centre).

   Rules (common Indian rules; every house rule is a switch in state.rules):
     open1     a 1 also brings a token out (default off: only a 6)
     six       a 6 gives another roll
     three     a third 6 in a row is lost and the turn passes (moves already made stay)
     capBonus  capturing gives a bonus roll
     safe      start squares and star squares are safe (no captures there)
     exact     the exact number is needed to reach home
     homeBonus a token reaching home gives a bonus roll
     blocks    pair rule: two tokens of one colour on a normal square block other colours
     first     the game stops when the first player has all 4 tokens home
   One move earns at most one bonus roll, even if it was a 6 and also captured. */
(function (root) {
  'use strict';

  var COLORS = ['red', 'green', 'yellow', 'blue'];
  var LEVELS = ['easy', 'medium', 'hard'];
  var START = [0, 13, 26, 39];
  var STARS = [8, 21, 34, 47];
  var LAST_TRACK = 50, HOME = 56;
  var SAFE = {};
  START.concat(STARS).forEach(function (i) { SAFE[i] = true; });

  var TRACK = (function () {
    var t = [], c, r;
    for (c = 1; c <= 5; c++) t.push([c, 6]);
    for (r = 5; r >= 0; r--) t.push([6, r]);
    t.push([7, 0]);
    for (r = 0; r <= 5; r++) t.push([8, r]);
    for (c = 9; c <= 14; c++) t.push([c, 6]);
    t.push([14, 7]);
    for (c = 14; c >= 9; c--) t.push([c, 8]);
    for (r = 9; r <= 14; r++) t.push([8, r]);
    t.push([7, 14]);
    for (r = 14; r >= 9; r--) t.push([6, r]);
    for (c = 5; c >= 0; c--) t.push([c, 8]);
    t.push([0, 7]);
    t.push([0, 6]);
    return t;
  })();
  var HOME_COL = [
    [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
    [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
    [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
    [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]]
  ];
  var YARD = [[0, 0], [9, 0], [9, 9], [0, 9]];   /* top-left cell of each 6 x 6 yard */

  var DEFAULT_RULES = { open1: false, six: true, three: true, capBonus: true, safe: true, exact: true, homeBonus: true, blocks: false, first: false };
  var RULE_KEYS = Object.keys(DEFAULT_RULES);
  var LOG_MAX = 80;

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function normRules(r) {
    var o = {};
    RULE_KEYS.forEach(function (k) { o[k] = r && typeof r[k] === 'boolean' ? r[k] : DEFAULT_RULES[k]; });
    return o;
  }

  /* cfg = { seats: [{ c: 0..3, name, type: 'human'|'cpu', level: 'easy'|'medium'|'hard' }], rules: {...} } */
  function newGame(cfg) {
    cfg = cfg || {};
    var used = {}, seats = (cfg.seats || []).filter(function (s) {
      var ok = s && s.c >= 0 && s.c <= 3 && s.c === Math.floor(s.c) && !used[s.c];
      if (ok) used[s.c] = 1;
      return ok;
    }).sort(function (a, b) { return a.c - b.c; });
    if (seats.length < 2) seats = [{ c: 0 }, { c: 2 }];
    return {
      v: 1, rules: normRules(cfg.rules), turn: 0, phase: 'roll', dice: 0, sixes: 0, moves: [], places: [],
      stats: [0, 0, 0, 0, 0, 0], log: [], turnNo: 1,
      players: seats.map(function (s) {
        return { c: s.c, name: String(s.name || '').slice(0, 20), type: s.type === 'cpu' ? 'cpu' : 'human',
          level: LEVELS.indexOf(s.level) >= 0 ? s.level : 'medium', tokens: [-1, -1, -1, -1], place: 0 };
      })
    };
  }

  /* Accepts a saved state; returns a clean copy, or null if it is not a usable game. */
  function revive(s) {
    try {
      if (!s || s.v !== 1 || !Array.isArray(s.players) || s.players.length < 2 || s.players.length > 4) return null;
      var S = clone(s), seen = {};
      S.rules = normRules(S.rules);
      for (var i = 0; i < S.players.length; i++) {
        var P = S.players[i];
        if (!P || !(P.c >= 0 && P.c <= 3) || seen[P.c] || !Array.isArray(P.tokens) || P.tokens.length !== 4) return null;
        seen[P.c] = 1;
        for (var t = 0; t < 4; t++) { var p = P.tokens[t]; if (typeof p !== 'number' || p !== Math.floor(p) || p < -1 || p > HOME) return null; }
        P.type = P.type === 'cpu' ? 'cpu' : 'human';
        if (LEVELS.indexOf(P.level) < 0) P.level = 'medium';
        P.name = String(P.name || '').slice(0, 20);
        P.place = P.place > 0 ? P.place : 0;
      }
      if (['roll', 'move', 'over'].indexOf(S.phase) < 0) return null;
      if (!(S.turn >= 0 && S.turn < S.players.length)) return null;
      if (!Array.isArray(S.places)) S.places = [];
      if (!Array.isArray(S.stats) || S.stats.length !== 6) S.stats = [0, 0, 0, 0, 0, 0];
      if (!Array.isArray(S.log)) S.log = [];
      S.sixes = S.sixes > 0 ? S.sixes : 0;
      S.turnNo = S.turnNo > 0 ? S.turnNo : 1;
      if (S.phase === 'move') {
        if (!(S.dice >= 1 && S.dice <= 6)) return null;
        S.moves = legalMoves(S, S.turn, S.dice);
        if (!S.moves.length) S.phase = 'roll';
      } else S.moves = [];
      return S;
    } catch (e) { return null; }
  }

  /* ---------------- board helpers ---------------- */
  function absOf(c, p) { return (START[c] + p) % 52; }
  function onTrack(p) { return p >= 0 && p <= LAST_TRACK; }
  function isSafe(S, abs) { return !!(S.rules.safe && SAFE[abs]); }
  function occupants(S, abs) {
    var out = [];
    S.players.forEach(function (P, i) {
      P.tokens.forEach(function (p, t) { if (onTrack(p) && absOf(P.c, p) === abs) out.push({ pl: i, t: t, p: p }); });
    });
    return out;
  }
  /* an opponent pair (pair rule) on a normal square: nobody else may land on it or pass it */
  function hasBlock(S, abs, me) {
    if (!S.rules.blocks || isSafe(S, abs)) return false;
    var n = {};
    var occ = occupants(S, abs);
    for (var i = 0; i < occ.length; i++) {
      if (occ[i].pl === me) continue;
      n[occ[i].pl] = (n[occ[i].pl] || 0) + 1;
      if (n[occ[i].pl] >= 2) return true;
    }
    return false;
  }
  function capturesAt(S, me, to) {
    if (!onTrack(to)) return [];
    var abs = absOf(S.players[me].c, to);
    if (isSafe(S, abs)) return [];
    return occupants(S, abs).filter(function (o) { return o.pl !== me; });
  }
  function canOpen(S, r) { return r === 6 || (r === 1 && S.rules.open1); }

  /* All legal moves of player `pl` for roll r: [{ t, from, to, cap: [{pl,t,p}], home }] */
  function legalMoves(S, pl, r) {
    var P = S.players[pl], out = [];
    if (!P || P.place) return out;
    for (var t = 0; t < 4; t++) {
      var p = P.tokens[t], to;
      if (p === HOME) continue;
      if (p === -1) {
        if (!canOpen(S, r) || hasBlock(S, absOf(P.c, 0), pl)) continue;
        to = 0;
      } else {
        to = p + r;
        if (to > HOME) { if (S.rules.exact) continue; to = HOME; }
        var blocked = false;
        if (S.rules.blocks) for (var s = p + 1; s <= Math.min(to, LAST_TRACK); s++) if (hasBlock(S, absOf(P.c, s), pl)) { blocked = true; break; }
        if (blocked) continue;
      }
      out.push({ t: t, from: p, to: to, cap: capturesAt(S, pl, to), home: to === HOME });
    }
    return out;
  }
  /* Moves that do the same thing (two tokens stacked on one square, or tokens in the yard) count once. */
  function distinct(moves) {
    var seen = {}, out = [];
    (moves || []).forEach(function (m) { var k = m.from + '>' + m.to; if (!seen[k]) { seen[k] = 1; out.push(m); } });
    return out;
  }

  function pushLog(S, e) { S.log.push(e); if (S.log.length > LOG_MAX) S.log.splice(0, S.log.length - LOG_MAX); }

  function nextTurn(S, ev) {
    S.sixes = 0; S.moves = [];
    var n = S.players.length;
    for (var k = 1; k <= n; k++) {
      var i = (S.turn + k) % n;
      if (!S.players[i].place) { S.turn = i; break; }
    }
    S.phase = 'roll'; S.turnNo++;
    ev.push({ k: 'turn', pl: S.turn });
  }

  function progressSum(P) { return P.tokens.reduce(function (a, p) { return a + (p < 0 ? 0 : p + 1); }, 0); }

  function finishCheck(S, pl, ev) {
    var P = S.players[pl];
    if (!P.tokens.every(function (p) { return p === HOME; })) return false;
    S.places.push(pl); P.place = S.places.length;
    ev.push({ k: 'finish', pl: pl, place: P.place }); pushLog(S, { k: 'finish', pl: pl, place: P.place });
    var left = [];
    S.players.forEach(function (Q, i) { if (!Q.place) left.push(i); });
    if (left.length <= 1 || S.rules.first) {
      left.sort(function (a, b) { return progressSum(S.players[b]) - progressSum(S.players[a]) || a - b; });
      left.forEach(function (i) { S.places.push(i); S.players[i].place = S.places.length; });
      S.phase = 'over'; S.moves = [];
      ev.push({ k: 'over', places: S.places.slice() }); pushLog(S, { k: 'over' });
      return true;
    }
    return false;
  }

  /* ---------------- the two transitions ---------------- */
  /* roll(state, r): the current player rolled r (1..6). Returns { state, events } (input untouched). */
  function roll(state, r) {
    var S = clone(state), ev = [], pl = S.turn;
    r = Math.floor(Number(r));
    if (S.phase !== 'roll' || !(r >= 1 && r <= 6)) return { state: S, events: ev };
    S.dice = r; S.stats[r - 1]++;
    S.sixes = r === 6 ? S.sixes + 1 : 0;
    ev.push({ k: 'roll', pl: pl, r: r });
    if (r === 6 && S.rules.three && S.sixes >= 3) {
      ev.push({ k: 'three6', pl: pl }); pushLog(S, { k: 'three6', pl: pl });
      nextTurn(S, ev);
      return { state: S, events: ev };
    }
    var moves = legalMoves(S, pl, r);
    if (!moves.length) {
      ev.push({ k: 'nomove', pl: pl, r: r }); pushLog(S, { k: 'nomove', pl: pl, r: r });
      if (r === 6 && S.rules.six) { S.phase = 'roll'; ev.push({ k: 'again', pl: pl, why: 'six' }); }
      else nextTurn(S, ev);
      return { state: S, events: ev };
    }
    S.phase = 'move'; S.moves = moves;
    return { state: S, events: ev };
  }

  /* move(state, t): the current player moves token t with the rolled number. Returns { state, events }. */
  function move(state, t) {
    var S = clone(state), ev = [], pl = S.turn, P = S.players[pl];
    if (S.phase !== 'move') return { state: S, events: ev };
    var m = null;
    for (var i = 0; i < S.moves.length; i++) if (S.moves[i].t === t) { m = S.moves[i]; break; }
    if (!m) return { state: S, events: ev };
    var r = S.dice, caps = capturesAt(S, pl, m.to);
    P.tokens[t] = m.to;
    ev.push({ k: 'move', pl: pl, t: t, from: m.from, to: m.to, r: r });
    pushLog(S, { k: m.from === -1 ? 'out' : 'move', pl: pl, r: r });
    caps.forEach(function (o) {
      S.players[o.pl].tokens[o.t] = -1;
      ev.push({ k: 'capture', pl: pl, victim: o.pl, t: o.t, from: o.p });
      pushLog(S, { k: 'capture', pl: pl, victim: o.pl });
    });
    var home = m.to === HOME;
    if (home) { ev.push({ k: 'home', pl: pl, t: t }); pushLog(S, { k: 'home', pl: pl }); }
    S.moves = [];
    if (home && finishCheck(S, pl, ev)) return { state: S, events: ev };
    var why = '';
    if (r === 6 && S.rules.six) why = 'six';
    if (home && S.rules.homeBonus) why = 'home';
    if (caps.length && S.rules.capBonus) why = 'capture';
    if (why && !P.place) { S.phase = 'roll'; ev.push({ k: 'again', pl: pl, why: why }); }
    else nextTurn(S, ev);
    return { state: S, events: ev };
  }

  /* ---------------- computer players ---------------- */
  /* Chance (0..1) that a token of player `me` standing on track square `abs` is captured before
     `me` plays again: each opponent token 1-6 squares behind can hit it with one exact roll (1/6);
     7-12 behind needs a 6 first (1/36); a token still in a yard can come out and hit (1/36). */
  function risk(S, me, abs) {
    if (isSafe(S, abs)) return 0;
    if (S.rules.blocks) {
      var mine = 0;
      occupants(S, abs).forEach(function (o) { if (o.pl === me) mine++; });
      if (mine >= 2) return 0;
    }
    var chance = 0;
    S.players.forEach(function (Q, i) {
      if (i === me || Q.place) return;
      var yard = false;
      Q.tokens.forEach(function (q) {
        if (q === -1) { yard = true; return; }
        if (!onTrack(q)) return;
        var d = (abs - absOf(Q.c, q) + 52) % 52;
        if (d === 0 || q + d > LAST_TRACK) return;
        if (d <= 6) chance += 1 / 6;
        else if (d <= 12 && S.rules.six) chance += 1 / 36;
      });
      if (yard) {
        var ds = (abs - START[Q.c] + 52) % 52;
        if (ds >= 1 && ds <= 6 && S.rules.six) chance += 1 / 36;
      }
    });
    return Math.min(1, chance);
  }

  function scoreMove(S, m, level) {
    var pl = S.turn, P = S.players[pl], c = P.c, s = 0;
    var capValue = 0;
    m.cap.forEach(function (o) { capValue += o.p + 10; });
    if (level !== 'hard') {
      if (m.cap.length) s += 50 + capValue * 0.3;
      if (m.home) s += 40;
      if (m.from === -1) s += 30;
      if (m.to > LAST_TRACK && m.from <= LAST_TRACK) s += 20;
      if (onTrack(m.to) && isSafe(S, absOf(c, m.to))) s += 10;
      return s + m.to * 0.1;
    }
    /* hard: look at the board after the move */
    var after = clone(S);
    after.players[pl].tokens[m.t] = m.to;
    m.cap.forEach(function (o) { after.players[o.pl].tokens[o.t] = -1; });
    if (m.cap.length) s += 30 + capValue * 1.2;
    if (m.home) s += 55;
    else if (m.to > LAST_TRACK && m.from <= LAST_TRACK) s += 34;     /* into the home column: safe for good */
    if (m.from === -1) {
      var out = P.tokens.filter(function (p) { return p >= 0 && p < HOME; }).length;
      s += out === 0 ? 40 : 26 - out * 3;
    }
    if (onTrack(m.from)) s += risk(S, pl, absOf(c, m.from)) * (m.from + 12) * 1.1;   /* escape danger */
    if (onTrack(m.to)) {
      var abs = absOf(c, m.to);
      s -= risk(after, pl, abs) * (m.to + 12) * 1.4;                                  /* step into danger */
      if (isSafe(S, abs)) s += 6;
      /* a threat of our own: an opponent single token 1-6 squares ahead on a normal square */
      after.players.forEach(function (Q, i) {
        if (i === pl) return;
        Q.tokens.forEach(function (q) {
          if (!onTrack(q)) return;
          var b = absOf(Q.c, q), d = (b - abs + 52) % 52;
          if (d >= 1 && d <= 6 && m.to + d <= LAST_TRACK && !isSafe(S, b)) s += 3;
        });
      });
      if (S.rules.blocks) {
        var own = 0;
        P.tokens.forEach(function (p, t) { if (t !== m.t && onTrack(p) && absOf(c, p) === abs) own++; });
        if (own === 1 && !isSafe(S, abs)) s += 8;
      }
    }
    return s + (m.to - Math.max(m.from, 0)) * 0.4 + m.to * 0.05;
  }

  /* Pick a move for a computer player. rnd: () => [0,1). Returns a move from state.moves or null. */
  function choose(S, level, rnd) {
    rnd = rnd || Math.random;
    var moves = distinct(S.moves);
    if (!moves.length) return null;
    if (moves.length === 1) return moves[0];
    if (level === 'easy') {
      var caps = moves.filter(function (m) { return m.cap.length; });
      if (caps.length && rnd() < 0.4) return caps[Math.floor(rnd() * caps.length)];
      return moves[Math.floor(rnd() * moves.length)];
    }
    var best = null, bestScore = -Infinity;
    moves.forEach(function (m) {
      var sc = scoreMove(S, m, level) + rnd() * (level === 'medium' ? 8 : 0.5);
      if (sc > bestScore) { bestScore = sc; best = m; }
    });
    return best;
  }

  var API = {
    COLORS: COLORS, LEVELS: LEVELS, START: START, STARS: STARS, SAFE: SAFE, TRACK: TRACK, HOME_COL: HOME_COL, YARD: YARD,
    HOME: HOME, LAST_TRACK: LAST_TRACK, DEFAULT_RULES: DEFAULT_RULES, RULE_KEYS: RULE_KEYS,
    newGame: newGame, revive: revive, normRules: normRules, legalMoves: legalMoves, distinct: distinct,
    roll: roll, move: move, choose: choose, risk: risk, absOf: absOf, onTrack: onTrack, isSafe: isSafe, progressSum: progressSum
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.LudoEngine = API;
})(this);
