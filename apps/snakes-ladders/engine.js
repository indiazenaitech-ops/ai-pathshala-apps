/* Snakes & Ladders: game engine (no DOM). Board geometry, the fixed boards, fair random boards and the rules.
   Loaded before app.js; app.js and the interaction test only talk to it through window.SL. */
(function () {
  'use strict';
  var CELL = 100;                 // one square = 100 SVG units; the board is 1000 x 1000 (+ a start strip below)

  /* ---------------- geometry: 1 at the bottom-left, zig-zag rows, 100 at the top-left ---------------- */
  function rowCol(n) {
    var i = n - 1, r = Math.floor(i / 10);
    return { r: r, c: r % 2 === 0 ? i % 10 : 9 - (i % 10) };
  }
  function xy(n) { var rc = rowCol(n); return { x: rc.c * CELL + CELL / 2, y: (9 - rc.r) * CELL + CELL / 2 }; }

  /* ---------------- the two fixed boards ([from, to] pairs) ----------------
     Both follow the same rules as the random boards (see check()): no snake head on 100, no ladder from 1,
     every square is used by at most one snake or ladder (so no chains or loops), and no ladders that cross.
     Moksha Patam: ladders[i] is virtue i and snakes[i] is vice i in content.js; like the old boards it has
     one snake more than ladders (the good path takes effort). */
  var BOARDS = {
    classic: {
      ladders: [[3, 22], [8, 26], [20, 41], [28, 55], [36, 57], [51, 72], [63, 82], [71, 91]],
      snakes: [[17, 4], [32, 10], [48, 27], [62, 39], [67, 45], [88, 66], [94, 73], [97, 78], [99, 80]]
    },
    moksha: {
      ladders: [[4, 25], [9, 31], [21, 42], [33, 52], [44, 63], [50, 69], [61, 82], [76, 95]],
      snakes: [[16, 6], [29, 12], [38, 18], [56, 35], [65, 47], [73, 53], [87, 68], [92, 74], [98, 79]]
    }
  };

  /* ---------------- seeded random numbers (same seed = same board) ---------------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function rint(rnd, a, b) { return a + Math.floor(rnd() * (b - a + 1)); }

  function jumps(layout) {
    var j = {};
    layout.ladders.forEach(function (p) { j[p[0]] = p[1]; });
    layout.snakes.forEach(function (p) { j[p[0]] = p[1]; });
    return j;
  }

  /* distance between two segments (for "do these ladders/snakes run into each other?") */
  function segDist(a, b, c, d) {
    function pd(p, s, e) {
      var vx = e.x - s.x, vy = e.y - s.y, L = vx * vx + vy * vy, k = L ? ((p.x - s.x) * vx + (p.y - s.y) * vy) / L : 0;
      k = Math.max(0, Math.min(1, k));
      var x = s.x + k * vx - p.x, y = s.y + k * vy - p.y;
      return Math.sqrt(x * x + y * y);
    }
    function cross(p, q, r) { return (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x); }
    var d1 = cross(a, b, c), d2 = cross(a, b, d), d3 = cross(c, d, a), d4 = cross(c, d, b);
    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return 0;
    return Math.min(pd(a, c, d), pd(b, c, d), pd(c, a, b), pd(d, a, b));
  }

  /* ---------------- the board rules (used for the random boards and to test the fixed ones) ---------------- */
  function check(layout) {
    var problems = [], used = {};
    function use(n, what) {
      if (!(n >= 1 && n <= 100 && n % 1 === 0)) problems.push(what + ': square ' + n + ' is not on the board');
      if (used[n]) problems.push(what + ': square ' + n + ' is already used (' + used[n] + ')');
      used[n] = what;
    }
    layout.ladders.forEach(function (p) {
      var w = 'ladder ' + p[0] + '-' + p[1];
      if (p[0] === 1) problems.push(w + ': no ladder from 1');
      if (!(p[1] > p[0])) problems.push(w + ': must go up');
      if (rowCol(p[1]).r === rowCol(p[0]).r) problems.push(w + ': must climb at least one row');
      use(p[0], w); use(p[1], w);
    });
    layout.snakes.forEach(function (p) {
      var w = 'snake ' + p[0] + '-' + p[1];
      if (p[0] === 100) problems.push(w + ': no snake head on 100');
      if (!(p[1] < p[0])) problems.push(w + ': must go down');
      if (rowCol(p[1]).r === rowCol(p[0]).r) problems.push(w + ': must drop at least one row');
      use(p[0], w); use(p[1], w);
    });
    if (used[1] || used[100]) problems.push('squares 1 and 100 must stay free');
    var L = layout.ladders;
    for (var i = 0; i < L.length; i++) for (var k = i + 1; k < L.length; k++) {
      if (segDist(xy(L[i][0]), xy(L[i][1]), xy(L[k][0]), xy(L[k][1])) < 60) problems.push('ladders ' + L[i].join('-') + ' and ' + L[k].join('-') + ' run into each other');
    }
    /* a run of 4 snake heads in 6 squares in a row would be a trap */
    var heads = {}; layout.snakes.forEach(function (p) { heads[p[0]] = 1; });
    for (var s = 1; s <= 94; s++) { var c = 0; for (var r = 1; r <= 6; r++) if (heads[s + r]) c++; if (c >= 4) problems.push('too many snakes after square ' + s); }
    return problems;
  }

  /* ---------------- how long is a game? exact expected number of rolls for one player ----------------
     A Markov chain over squares 0-99 (0 = not on the board yet): E[s] = 1 + 1/6 * sum E[next(s, r)], E[100] = 0.
     Follows the exact / bounce / start-on-6 rules (extra rolls on a 6 don't change the number of rolls). */
  function landing(s, r, rules) {
    if (s === 0 && rules.startSix) return r === 6 ? 1 : 0;
    var to = s + r;
    if (to <= 100) return to;
    if (!rules.exact) return 100;
    return rules.bounce ? 200 - to : s;
  }
  function expectedRolls(layout, rules) {
    rules = rules || DEFAULT_RULES;
    var j = jumps(layout), n = 100, A = [], i, k, r;
    for (i = 0; i < n; i++) { A.push(new Float64Array(n + 1)); A[i][i] += 1; A[i][n] = 1; }
    for (i = 0; i < n; i++) {
      for (r = 1; r <= 6; r++) {
        var to = landing(i, r, rules);
        if (to !== i && j[to]) to = j[to];
        if (to < 100) A[i][to] -= 1 / 6;
      }
    }
    for (k = 0; k < n; k++) {                    // Gaussian elimination with partial pivoting
      var piv = k;
      for (i = k + 1; i < n; i++) if (Math.abs(A[i][k]) > Math.abs(A[piv][k])) piv = i;
      var tmp = A[k]; A[k] = A[piv]; A[piv] = tmp;
      var d = A[k][k]; if (Math.abs(d) < 1e-12) return Infinity;
      for (i = k + 1; i < n; i++) {
        var f = A[i][k] / d; if (!f) continue;
        for (var c = k; c <= n; c++) A[i][c] -= f * A[k][c];
      }
    }
    var E = new Float64Array(n);
    for (i = n - 1; i >= 0; i--) {
      var sum = A[i][n];
      for (k = i + 1; k < n; k++) sum -= A[i][k] * E[k];
      E[i] = sum / A[i][i];
    }
    return E[0];
  }

  /* ---------------- how clean does a board look? (0 = perfect; used for the random boards) ----------------
     Snakes must not lie on top of each other, a snake head or a ladder foot/top must not hide under another
     piece, and snakes should cross as few ladders as possible. Returns { reject, penalty, crossings }. */
  function crosses(a, b, c, d) {
    function cr(p, q, r) { return (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x); }
    var d1 = cr(a, b, c), d2 = cr(a, b, d), d3 = cr(c, d, a), d4 = cr(c, d, b);
    return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
  }
  function quality(layout) {
    var S = layout.snakes, L = layout.ladders, i, k, reject = false, pen = 0, cross = 0;
    function seg(p) { return [xy(p[0]), xy(p[1])]; }
    for (i = 0; i < S.length; i++) for (k = i + 1; k < S.length; k++) {
      var a = seg(S[i]), b = seg(S[k]);
      if (segDist(a[0], a[1], b[0], b[1]) < 75) reject = true;
    }
    for (i = 0; i < S.length; i++) {
      var s = seg(S[i]);
      for (k = 0; k < L.length; k++) {
        var l = seg(L[k]);
        if (segDist(l[0], l[1], s[0], s[0]) < 58) reject = true;                      // snake head on a ladder
        if (segDist(s[0], s[1], l[0], l[0]) < 45 || segDist(s[0], s[1], l[1], l[1]) < 45) reject = true;   // ladder end under a snake
        if (segDist(l[0], l[1], s[1], s[1]) < 36) pen += 2;                           // tail touching a ladder
        if (crosses(s[0], s[1], l[0], l[1])) { cross++; pen += 4; }
        else if (segDist(s[0], s[1], l[0], l[1]) < 40) pen += 3;                      // snake lying along a ladder
      }
    }
    var rows = {};
    L.concat(S).forEach(function (p) { rows[rowCol(p[0]).r] = 1; rows[rowCol(p[1]).r] = 1; });
    for (i = 0; i < 10; i++) if (!rows[i]) pen += 3;
    return { reject: reject, penalty: pen, crossings: cross };
  }

  /* ---------------- fair random board ----------------
     8 ladders and 8 snakes (balanced counts), spread over the rows; ladders climb 1-4 rows, snakes drop 1-4 rows.
     Rejected unless: check() passes (no snake head on 100, no ladder from 1, no shared squares = no chains or
     loops, no crossing ladders), quality() is clean (at most 2 snakes over ladders), and a game takes a normal
     number of rolls (exact expected value, 25-42 rolls for one player; a board with nothing on it takes 33). */
  var RANDOM_N = 8, MIN_ROLLS = 25, MAX_ROLLS = 42;
  function cellAt(r, c) { return r % 2 === 0 ? r * 10 + c + 1 : r * 10 + (9 - c) + 1; }
  function shuffled(rnd, a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var k = Math.floor(rnd() * (i + 1)), x = a[i]; a[i] = a[k]; a[k] = x; } return a; }
  function tryBuild(rnd) {
    var used = { 1: 1, 100: 1 }, ladders = [], snakes = [];
    function free(n) { return n > 1 && n < 100 && !used[n]; }
    var lrows = shuffled(rnd, [0, 1, 2, 3, 4, 5, 6, 7]).slice(0, RANDOM_N);
    for (var i = 0; i < lrows.length; i++) {
      var ok = false;
      for (var tries = 0; tries < 40 && !ok; tries++) {
        var r0 = lrows[i], c0 = rint(rnd, 0, 9), up = rint(rnd, 1, Math.min(4, 9 - r0)), lean = Math.min(2, up);   // ladders stand at 45 degrees or steeper
        var c1 = Math.max(0, Math.min(9, c0 + rint(rnd, -lean, lean))), b = cellAt(r0, c0), top = cellAt(r0 + up, c1);
        if (!free(b) || !free(top) || top - b < 9 || top - b > 45) continue;
        var cand = ladders.concat([[b, top]]);
        if (check({ ladders: cand, snakes: [] }).length) continue;
        ladders.push([b, top]); used[b] = used[top] = 1; ok = true;
      }
      if (!ok) return null;
    }
    var srows = shuffled(rnd, [2, 3, 4, 5, 6, 7, 8, 9]).slice(0, RANDOM_N);
    for (i = 0; i < srows.length; i++) {
      ok = false;
      for (tries = 0; tries < 40 && !ok; tries++) {
        var h0 = srows[i], hc = rint(rnd, 0, 9), down = rint(rnd, 1, Math.min(4, h0)), sway = Math.min(3, 2 * down);
        var tc = Math.max(0, Math.min(9, hc + rint(rnd, -sway, sway))), h = cellAt(h0, hc), tl = cellAt(h0 - down, tc);
        if (!free(h) || !free(tl) || h - tl < 9 || h - tl > 50) continue;
        var q = quality({ ladders: ladders, snakes: snakes.concat([[h, tl]]) });
        if (q.reject || q.crossings > 2) continue;
        snakes.push([h, tl]); used[h] = used[tl] = 1; ok = true;
      }
      if (!ok) return null;
    }
    var L = { ladders: ladders.sort(function (a, b) { return a[0] - b[0]; }), snakes: snakes.sort(function (a, b) { return a[0] - b[0]; }) };
    return check(L).length ? null : L;
  }
  function randomBoard(seed) {
    var rnd = mulberry32((seed >>> 0) || 1);
    for (var attempt = 0; attempt < 400; attempt++) {
      var L = tryBuild(rnd);
      if (!L) continue;
      var e = expectedRolls(L);
      if (e >= MIN_ROLLS && e <= MAX_ROLLS) return L;
    }
    return copyLayout(BOARDS.classic);
  }
  function copyLayout(L) { return { ladders: L.ladders.map(function (p) { return p.slice(); }), snakes: L.snakes.map(function (p) { return p.slice(); }) }; }
  function layoutFor(kind, seed) {
    if (kind === 'random') return randomBoard(seed);
    return copyLayout(BOARDS[kind] || BOARDS.classic);
  }

  /* ---------------- rules ----------------
     Common Indian rules: one dice, move that many squares, climb up ladders, slide down snakes, first to 100 wins.
     House rules: exact (roll exactly what you need for 100, else stay; default on) + bounce (walk to 100 and back the
     extra squares), sixAgain (a 6 gives another roll), threeSixes (a third 6 in a row cancels the turn: back to where
     the turn began), startSix (a token comes on to square 1 only with a 6). */
  var DEFAULT_RULES = { exact: true, bounce: false, sixAgain: true, threeSixes: false, startSix: false };
  var MAX_HISTORY = 400;

  function newGame(players, layout, rules, board, seed) {
    var n = players.length, pos = [], rolls = [];
    for (var i = 0; i < n; i++) { pos.push(0); rolls.push(0); }
    return {
      v: 1, status: 'playing', board: board, seed: seed, layout: copyLayout(layout), rules: Object.assign({}, DEFAULT_RULES, rules || {}),
      players: players.map(function (p) { return Object.assign({}, p); }), pos: pos, rolls: rolls,
      turn: 0, sixes: 0, turnStart: 0, winner: -1, history: [], moves: 0
    };
  }

  function nextTurn(g) {
    g.turn = (g.turn + 1) % g.players.length;
    g.sixes = 0;
    g.turnStart = g.pos[g.turn];
  }

  /* Play one roll for the player whose turn it is. Changes g and returns what happened (for the animation and
     the move history): { player, roll, from, path: [squares walked], land, via: {type, idx, from, to} | null,
     to, kind: 'move' | 'bounce' | 'exact' | 'need6' | 'enter' | 'three', need, extra, won } */
  function applyRoll(g, roll) {
    var p = g.turn, from = g.pos[p], R = g.rules, path = [], land = from, kind = 'move', need = 0;
    var res = { player: p, roll: roll, from: from, path: path, land: from, via: null, to: from, kind: kind, need: 0, extra: false, won: false };
    g.rolls[p]++;
    g.moves++;
    var six = roll === 6 && R.sixAgain;
    if (six && R.threeSixes && g.sixes >= 2) {          // the third 6 in a row: the whole turn is cancelled
      res.kind = 'three';
      res.to = res.land = g.turnStart;
      g.pos[p] = g.turnStart;
      log(g, res);
      nextTurn(g);
      return res;
    }
    if (from === 0 && R.startSix) {
      if (roll !== 6) { kind = 'need6'; }
      else { kind = 'enter'; path.push(1); land = 1; }
    } else {
      var target = from + roll, s;
      if (target <= 100) { for (s = from + 1; s <= target; s++) path.push(s); land = target; }
      else if (!R.exact) { for (s = from + 1; s <= 100; s++) path.push(s); land = 100; }
      else if (R.bounce) {
        for (s = from + 1; s <= 100; s++) path.push(s);
        land = 200 - target;
        for (s = 99; s >= land; s--) path.push(s);
        kind = 'bounce';
      } else { kind = 'exact'; need = 100 - from; }
    }
    var to = land;
    if (path.length) {
      var L = g.layout, i;
      for (i = 0; i < L.ladders.length; i++) if (L.ladders[i][0] === land) { res.via = { type: 'ladder', idx: i, from: land, to: L.ladders[i][1] }; break; }
      if (!res.via) for (i = 0; i < L.snakes.length; i++) if (L.snakes[i][0] === land) { res.via = { type: 'snake', idx: i, from: land, to: L.snakes[i][1] }; break; }
      if (res.via) to = res.via.to;
    }
    res.kind = kind; res.land = land; res.to = to; res.need = need;
    g.pos[p] = to;
    if (to === 100) {
      res.won = true;
      g.status = 'won';
      g.winner = p;
      log(g, res);
      return res;
    }
    if (six) { g.sixes++; res.extra = true; }
    log(g, res);
    if (!six) nextTurn(g);
    return res;
  }

  function log(g, res) {
    g.history.push({ p: res.player, r: res.roll, f: res.from, l: res.land, t: res.to, k: res.kind, n: res.need, x: res.extra ? 1 : 0, w: res.won ? 1 : 0,
      v: res.via ? { y: res.via.type === 'ladder' ? 'L' : 'S', i: res.via.idx } : null });
    if (g.history.length > MAX_HISTORY) g.history.splice(0, g.history.length - MAX_HISTORY);
  }

  /* Is a saved game still usable? (old or broken data never crashes the app) */
  function validGame(g) {
    try {
      if (!g || g.v !== 1 || ['playing', 'won'].indexOf(g.status) < 0) return false;
      var n = g.players && g.players.length;
      if (!(n >= 2 && n <= 4) || g.pos.length !== n || g.rolls.length !== n) return false;
      if (!g.layout || !Array.isArray(g.layout.ladders) || !Array.isArray(g.layout.snakes) || check(g.layout).length) return false;
      if (!(g.turn >= 0 && g.turn < n)) return false;
      if (g.pos.some(function (x) { return !(x >= 0 && x <= 100 && x % 1 === 0); })) return false;
      if (!Array.isArray(g.history)) return false;
      if (g.status === 'won' && !(g.winner >= 0 && g.winner < n)) return false;
      return true;
    } catch (e) { return false; }
  }

  window.SL = {
    CELL: CELL, BOARDS: BOARDS, DEFAULT_RULES: DEFAULT_RULES,
    rowCol: rowCol, xy: xy, check: check, quality: quality, expectedRolls: expectedRolls, randomBoard: randomBoard, layoutFor: layoutFor,
    newGame: newGame, applyRoll: applyRoll, validGame: validGame, jumps: jumps, segDist: segDist
  };
})();
