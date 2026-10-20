/* Rules engines for Indian Board Games: pure functions, no DOM.
   IBG.hunt  : Aadu Puli Attam (23-point board) and Bagh-Chal (5x5)
   IBG.pal   : Pallanguzhi (2 x 7 pits)
   IBG.morris: Navakankari (Nine Men's Morris)
   IBG.search: alpha-beta negamax written as a generator, so the UI can run it in small time slices. */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------------ hunt games */
  function buildApl() {
    // apex (0); rows 1..3 = wingL, 4 line points, wingR (6 each); row 4 = 4 line points
    var pts = [], lineK = [-1.5, -0.5, 0.5, 1.5], apexY = 5, baseY = 95, half = 45, W = 46;
    var fr = [0, 0.35, 0.5667, 0.7833, 1];
    pts.push([50, apexY]);
    var rows = [[0]];
    for (var r = 1; r <= 4; r++) {
      var y = apexY + (baseY - apexY) * fr[r], row = [];
      if (r <= 3) { row.push(pts.length); pts.push([50 - W, y]); }
      for (var k = 0; k < 4; k++) { row.push(pts.length); pts.push([50 + lineK[k] * (half / 1.5) * fr[r], y]); }
      if (r <= 3) { row.push(pts.length); pts.push([50 + W, y]); }
      rows.push(row);
    }
    var lines = [];
    // horizontal rows 1..4
    for (r = 1; r <= 4; r++) lines.push(rows[r].slice());
    // descending lines from apex
    for (k = 0; k < 4; k++) {
      var ln = [0];
      for (r = 1; r <= 4; r++) ln.push(rows[r][r <= 3 ? k + 1 : k]);
      lines.push(ln);
    }
    // wing verticals
    lines.push([rows[1][0], rows[2][0], rows[3][0]]);
    lines.push([rows[1][5], rows[2][5], rows[3][5]]);
    return { id: 'apl', pts: pts, lines: lines, tigers: [0, rows[1][2], rows[1][3]], goats: 15, view: [0, 0, 100, 100] };
  }
  function buildBagh() {
    var pts = [], lines = [], r, c;
    for (r = 0; r < 5; r++) for (c = 0; c < 5; c++) pts.push([10 + c * 20, 10 + r * 20]);
    var id = function (r, c) { return r * 5 + c; };
    for (r = 0; r < 5; r++) { var a = [], b = []; for (c = 0; c < 5; c++) { a.push(id(r, c)); b.push(id(c, r)); } lines.push(a, b); }
    // diagonals through even points
    lines.push([0, 6, 12, 18, 24], [4, 8, 12, 16, 20], [2, 6, 10], [2, 8, 14], [10, 16, 22], [14, 18, 22]);
    return { id: 'bagh', pts: pts, lines: lines, tigers: [0, 4, 20, 24], goats: 20, view: [0, 0, 100, 100] };
  }
  function finishBoard(B) {
    var n = B.pts.length; B.adj = []; B.jumps = [];
    for (var i = 0; i < n; i++) { B.adj.push([]); B.jumps.push([]); }
    B.lines.forEach(function (ln) {
      for (var i = 0; i < ln.length; i++) {
        if (i + 1 < ln.length) { B.adj[ln[i]].push(ln[i + 1]); B.adj[ln[i + 1]].push(ln[i]); }
        if (i + 2 < ln.length) { B.jumps[ln[i]].push([ln[i + 1], ln[i + 2]]); B.jumps[ln[i + 2]].push([ln[i + 1], ln[i]]); }
      }
    });
    B.n = n;
    return B;
  }
  var HB = { apl: finishBoard(buildApl()), bagh: finishBoard(buildBagh()) };

  var hunt = {
    boards: HB,
    GOAT: 1, TIGER: 2,
    init: function (v, opts) {
      var B = HB[v] || HB.apl, b = [];
      for (var i = 0; i < B.n; i++) b.push(0);
      B.tigers.forEach(function (p) { b[p] = 2; });
      var target = opts && opts.target ? opts.target : (v === 'bagh' ? 5 : 6);
      return { g: 'hunt', v: B.id, b: b, turn: 1, hand: B.goats, cap: 0, target: Math.min(target, B.goats), quiet: 0, last: null };
    },
    side: function (s) { return s.turn; },
    moves: function (s) {
      var B = HB[s.v], b = s.b, out = [], i, j;
      if (s.turn === 1) {
        if (s.hand > 0) { for (i = 0; i < B.n; i++) if (!b[i]) out.push({ from: -1, to: i, over: -1 }); }
        else for (i = 0; i < B.n; i++) if (b[i] === 1) for (j = 0; j < B.adj[i].length; j++) if (!b[B.adj[i][j]]) out.push({ from: i, to: B.adj[i][j], over: -1 });
      } else {
        for (i = 0; i < B.n; i++) if (b[i] === 2) {
          for (j = 0; j < B.jumps[i].length; j++) { var J = B.jumps[i][j]; if (b[J[0]] === 1 && !b[J[1]]) out.push({ from: i, to: J[1], over: J[0] }); }
          for (j = 0; j < B.adj[i].length; j++) if (!b[B.adj[i][j]]) out.push({ from: i, to: B.adj[i][j], over: -1 });
        }
      }
      return out;
    },
    apply: function (s, m) {
      var b = s.b.slice(), n = { g: 'hunt', v: s.v, b: b, turn: 3 - s.turn, hand: s.hand, cap: s.cap, target: s.target, quiet: s.quiet + 1, last: m };
      if (s.turn === 1) { if (m.from < 0) { b[m.to] = 1; n.hand--; } else { b[m.from] = 0; b[m.to] = 1; } }
      else { b[m.from] = 0; b[m.to] = 2; if (m.over >= 0) { b[m.over] = 0; n.cap++; n.quiet = 0; } }
      if (n.hand > 0) n.quiet = 0; // the no-capture count starts after all goats are placed
      return n;
    },
    /* null while playing, else { winner: 1|2|0, reason } */
    status: function (s) {
      if (s.cap >= s.target) return { winner: 2, reason: 'cap' };
      if (!hunt.moves(s).length) return s.turn === 2 ? { winner: 1, reason: 'trapped' } : { winner: 2, reason: 'blocked' };
      return null;
    },
    key: function (s) { return s.v + s.turn + s.hand + ':' + s.b.join(''); },
    /* score from the point of view of the side to move */
    evaluate: function (s) {
      var B = HB[s.v], b = s.b, mob = 0, caps = 0, stuck = 0, i, j, safe = 0;
      for (i = 0; i < B.n; i++) if (b[i] === 2) {
        var m = 0;
        for (j = 0; j < B.adj[i].length; j++) if (!b[B.adj[i][j]]) m++;
        for (j = 0; j < B.jumps[i].length; j++) { var J = B.jumps[i][j]; if (b[J[0]] === 1 && !b[J[1]]) { caps++; m++; } }
        mob += m; if (!m) stuck++;
      }
      // goats next to each other along lines protect each other a little
      for (i = 0; i < B.n; i++) if (b[i] === 1) for (j = 0; j < B.adj[i].length; j++) if (b[B.adj[i][j]] === 1) safe++;
      var tigerScore = s.cap * 120 + mob * 4 + caps * (s.turn === 2 ? 40 : 18) - stuck * 25 - safe * 0.5;
      return s.turn === 2 ? tigerScore : -tigerScore;
    },
    order: function (s, ms) { return ms.sort(function (a, b) { return (b.over >= 0) - (a.over >= 0); }); }
  };

  /* ------------------------------------------------------------------ Navakankari (morris) */
  var MP = [[0, 0], [3, 0], [6, 0], [1, 1], [3, 1], [5, 1], [2, 2], [3, 2], [4, 2], [0, 3], [1, 3], [2, 3], [4, 3], [5, 3], [6, 3], [2, 4], [3, 4], [4, 4], [1, 5], [3, 5], [5, 5], [0, 6], [3, 6], [6, 6]];
  var MILLS = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11], [12, 13, 14], [15, 16, 17], [18, 19, 20], [21, 22, 23],
    [0, 9, 21], [3, 10, 18], [6, 11, 15], [1, 4, 7], [16, 19, 22], [8, 12, 17], [5, 13, 20], [2, 14, 23]];
  var MADJ = [], MOF = [];
  for (var q = 0; q < 24; q++) { MADJ.push([]); MOF.push([]); }
  MILLS.forEach(function (m, mi) {
    m.forEach(function (p) { MOF[p].push(mi); });
    MADJ[m[0]].push(m[1]); MADJ[m[1]].push(m[0]); MADJ[m[1]].push(m[2]); MADJ[m[2]].push(m[1]);
  });
  function inMill(b, p) {
    var c = b[p]; if (!c) return false;
    for (var i = 0; i < MOF[p].length; i++) { var m = MILLS[MOF[p][i]]; if (b[m[0]] === c && b[m[1]] === c && b[m[2]] === c) return true; }
    return false;
  }
  var morris = {
    pts: MP, mills: MILLS, adj: MADJ, inMill: inMill,
    init: function (opts) {
      var b = []; for (var i = 0; i < 24; i++) b.push(0);
      return { g: 'morris', b: b, turn: 1, hand: [0, 9, 9], fly: !(opts && opts.fly === false), quiet: 0, last: null };
    },
    side: function (s) { return s.turn; },
    count: function (s, p) { var c = 0; for (var i = 0; i < 24; i++) if (s.b[i] === p) c++; return c; },
    canFly: function (s, p) { return s.fly && s.hand[p] === 0 && morris.count(s, p) === 3; },
    /* moves without the removal step: {from,to} */
    baseMoves: function (s) {
      var p = s.turn, b = s.b, out = [], i, j;
      if (s.hand[p] > 0) { for (i = 0; i < 24; i++) if (!b[i]) out.push({ from: -1, to: i }); return out; }
      var fly = morris.canFly(s, p);
      for (i = 0; i < 24; i++) if (b[i] === p) {
        if (fly) { for (j = 0; j < 24; j++) if (!b[j]) out.push({ from: i, to: j }); }
        else for (j = 0; j < MADJ[i].length; j++) if (!b[MADJ[i][j]]) out.push({ from: i, to: MADJ[i][j] });
      }
      return out;
    },
    removable: function (b, opp) {
      var all = [], free = [];
      for (var i = 0; i < 24; i++) if (b[i] === opp) { all.push(i); if (!inMill(b, i)) free.push(i); }
      return free.length ? free : all;
    },
    moves: function (s) {
      var out = [], p = s.turn;
      morris.baseMoves(s).forEach(function (m) {
        var b = s.b.slice(); if (m.from >= 0) b[m.from] = 0; b[m.to] = p;
        if (inMill(b, m.to)) {
          var r = morris.removable(b, 3 - p);
          if (!r.length) out.push({ from: m.from, to: m.to, rem: -1 });
          r.forEach(function (x) { out.push({ from: m.from, to: m.to, rem: x }); });
        } else out.push({ from: m.from, to: m.to, rem: -1 });
      });
      return out;
    },
    formsMill: function (s, m) { var b = s.b.slice(); if (m.from >= 0) b[m.from] = 0; b[m.to] = s.turn; return inMill(b, m.to); },
    apply: function (s, m) {
      var p = s.turn, b = s.b.slice(), hand = s.hand.slice();
      if (m.from >= 0) b[m.from] = 0; else hand[p]--;
      b[m.to] = p;
      var quiet = s.quiet + 1;
      if (m.rem >= 0) { b[m.rem] = 0; quiet = 0; }
      if (hand[1] > 0 || hand[2] > 0) quiet = 0;
      return { g: 'morris', b: b, turn: 3 - p, hand: hand, fly: s.fly, quiet: quiet, last: m };
    },
    status: function (s) {
      var p = s.turn;
      if (morris.count(s, p) + s.hand[p] < 3) return { winner: 3 - p, reason: 'pieces' };
      if (!morris.baseMoves(s).length) return { winner: 3 - p, reason: 'blocked' };
      return null;
    },
    key: function (s) { return s.turn + ':' + s.hand[1] + ',' + s.hand[2] + ':' + s.b.join(''); },
    evaluate: function (s) {
      var p = s.turn, o = 3 - p, b = s.b, sc = 0, i, mi;
      sc += (morris.count(s, p) + s.hand[p] - morris.count(s, o) - s.hand[o]) * 100;
      for (mi = 0; mi < MILLS.length; mi++) {
        var m = MILLS[mi], cp = 0, co = 0, ce = 0;
        for (i = 0; i < 3; i++) { if (b[m[i]] === p) cp++; else if (b[m[i]] === o) co++; else ce++; }
        if (cp === 3) sc += 18; else if (co === 3) sc -= 18;
        if (cp === 2 && ce === 1) sc += 14; else if (co === 2 && ce === 1) sc -= 16;
      }
      if (!s.hand[p] && !s.hand[o]) {
        var mp = 0, mo = 0;
        for (i = 0; i < 24; i++) if (b[i]) for (var j = 0; j < MADJ[i].length; j++) if (!b[MADJ[i][j]]) { if (b[i] === p) mp++; else mo++; }
        sc += (mp - mo) * 3;
      }
      // central cross points are worth a little more while placing
      [4, 10, 13, 19].forEach(function (x) { if (b[x] === p) sc += 3; else if (b[x] === o) sc -= 3; });
      return sc;
    },
    order: function (s, ms) { return ms.sort(function (a, b) { return (b.rem >= 0) - (a.rem >= 0); }); }
  };

  /* ------------------------------------------------------------------ Pallanguzhi */
  // pits 0..6 = player 0 (bottom row, left to right), 7..13 = player 1 (top row, right to left on screen).
  // Increasing index = counter-clockwise sowing.
  var pal = {
    owner: function (i) { return i < 7 ? 0 : 1; },
    init: function (opts) {
      var S = (opts && opts.seeds) || 5, pits = [], blk = [];
      for (var i = 0; i < 14; i++) { pits.push(S); blk.push(false); }
      return { g: 'pal', pits: pits, blk: blk, st: [0, 0], turn: 0, round: 1, starter: 0, S: S, pasu: !(opts && opts.pasu === false),
        rounds: (opts && opts.rounds) || 3, turns: 0, roundOver: false, over: false, winner: -1, last: null };
    },
    side: function (s) { return s.turn; },
    next: function (s, i) { for (var k = 0; k < 14; k++) { i = (i + 1) % 14; if (!s.blk[i]) return i; } return i; },
    moves: function (s) {
      if (s.roundOver || s.over) return [];
      var out = [], a = s.turn * 7;
      for (var i = a; i < a + 7; i++) if (!s.blk[i] && s.pits[i] > 0) out.push(i);
      return out;
    },
    copy: function (s) {
      return { g: 'pal', pits: s.pits.slice(), blk: s.blk.slice(), st: s.st.slice(), turn: s.turn, round: s.round, starter: s.starter, S: s.S,
        pasu: s.pasu, rounds: s.rounds, turns: s.turns, roundOver: s.roundOver, over: s.over, winner: s.winner, last: s.last };
    },
    /* Sow from pit p. Returns { state, events } where events drive the animation:
       {t:'take',pit,n} {t:'drop',pit} {t:'pasu',pit,who} {t:'cap',pit,n,who} {t:'end'} {t:'round'} */
    sow: function (s0, p, wantEvents) {
      var s = pal.copy(s0), ev = wantEvents ? [] : null, me = s.turn, guard = 0;
      var hand = s.pits[p]; s.pits[p] = 0; var pos = p;
      if (ev) ev.push({ t: 'take', pit: p, n: hand });
      var capTotal = 0, pasuTotal = [0, 0];
      while (hand > 0 && guard++ < 5000) {
        pos = pal.next(s, pos); s.pits[pos]++; hand--;
        if (ev) ev.push({ t: 'drop', pit: pos });
        if (s.pasu && s.pits[pos] === 4) {
          var w = pal.owner(pos); s.st[w] += 4; s.pits[pos] = 0; pasuTotal[w] += 4;
          if (ev) ev.push({ t: 'pasu', pit: pos, who: w });
        }
        if (hand === 0) {
          var n1 = pal.next(s, pos);
          if (s.pits[n1] > 0) { hand = s.pits[n1]; s.pits[n1] = 0; pos = n1; if (ev) ev.push({ t: 'take', pit: n1, n: hand }); }
          else {
            var n2 = pal.next(s, n1);
            if (s.pits[n2] > 0) { var c = s.pits[n2]; s.st[me] += c; s.pits[n2] = 0; capTotal += c; if (ev) ev.push({ t: 'cap', pit: n2, n: c, who: me, empty: n1 }); }
            else if (ev) ev.push({ t: 'end', pit: n1 });
          }
        }
      }
      s.last = { pit: p, cap: capTotal, pasu: pasuTotal };
      s.turn = 1 - me; s.turns++;
      if (!pal.moves(s).length || s.turns >= 400) { pal.endRound(s); if (ev) ev.push({ t: 'round' }); }
      return { state: s, events: ev };
    },
    apply: function (s, p) { return pal.sow(s, p, false).state; },
    endRound: function (s) {
      for (var i = 0; i < 14; i++) { if (s.pits[i]) { s.st[pal.owner(i)] += s.pits[i]; s.pits[i] = 0; } }
      s.roundOver = true;
      if (s.round >= s.rounds || s.st[0] < s.S || s.st[1] < s.S) {
        s.over = true; s.winner = s.st[0] === s.st[1] ? 2 : (s.st[0] > s.st[1] ? 0 : 1);
      }
    },
    /* fill pits for the next round; unfilled pits are closed */
    newRound: function (s0) {
      var s = pal.copy(s0);
      for (var pl = 0; pl < 2; pl++) {
        for (var k = 0; k < 7; k++) {
          var i = pl * 7 + k;
          if (s.st[pl] >= s.S) { s.pits[i] = s.S; s.st[pl] -= s.S; s.blk[i] = false; } else { s.pits[i] = 0; s.blk[i] = true; }
        }
      }
      s.round++; s.starter = 1 - s.starter; s.turn = s.starter; s.turns = 0; s.roundOver = false; s.last = null;
      if (!pal.moves(s).length) { s.turn = 1 - s.turn; }
      return s;
    },
    total: function (s, pl) { var t = s.st[pl]; for (var k = 0; k < 7; k++) t += s.pits[pl * 7 + k]; return t; },
    status: function (s) {
      if (s.over) return { winner: s.winner === 2 ? 0 : s.winner + 1, reason: 'game' };
      return null;
    },
    key: function (s) { return s.turn + ':' + s.pits.join(','); },
    evaluate: function (s) {
      var p = s.turn, o = 1 - p;
      if (s.roundOver) return (s.st[p] - s.st[o]) * 10;
      var own = 0, opp = 0;
      for (var k = 0; k < 7; k++) { own += s.pits[p * 7 + k]; opp += s.pits[o * 7 + k]; }
      return (s.st[p] - s.st[o]) * 10 + (own - opp);
    },
    order: function (s, ms) { return ms; }
  };
  // terminal helper for search: round end counts as the end of the search tree
  pal.terminal = function (s) { return s.roundOver ? { winner: -1 } : null; };

  /* ------------------------------------------------------------------ search */
  var G = { hunt: hunt, morris: morris, pal: pal };
  var WIN = 100000;
  function terminalScore(E, s, ply) {
    if (E === pal) { if (s.roundOver) return E.evaluate(s) * 100; return null; }
    var st = E.status(s);
    if (!st) return null;
    if (st.winner === 0) return 0;
    return (st.winner === E.side(s) ? 1 : -1) * (WIN - ply);
  }
  function* negamax(E, s, depth, alpha, beta, ply, ctx) {
    if (++ctx.nodes % 300 === 0) { yield 0; if (ctx.deadline && Date.now() > ctx.deadline) ctx.stop = true; }
    if (ctx.stop) return 0;
    var t = terminalScore(E, s, ply);
    if (t !== null) return t;
    if (depth <= 0) return E.evaluate(s);
    var ms = E.order(s, E.moves(s)), best = -Infinity;
    for (var i = 0; i < ms.length; i++) {
      var c = E.apply(s, ms[i]);
      var v = -(yield* negamax(E, c, depth - 1, -beta, -alpha, ply + 1, ctx));
      if (ctx.stop) return best === -Infinity ? 0 : best;
      if (v > best) best = v;
      if (v > alpha) alpha = v;
      if (alpha >= beta) break;
    }
    return best;
  }
  /* opts: {maxDepth, timeMs, noise (0..1), rand} ; returns { move, score, depth } */
  function* bestMove(s, opts) {
    var E = G[s.g], rand = opts.rand || Math.random;
    var ms = E.order(s, E.moves(s));
    if (!ms.length) return null;
    if (ms.length === 1) return { move: ms[0], score: 0, depth: 0 };
    var ctx = { nodes: 0, stop: false, deadline: opts.timeMs ? Date.now() + opts.timeMs : 0 };
    var scored = null, depthDone = 0;
    for (var d = 1; d <= opts.maxDepth; d++) {
      var res = [], alpha = -Infinity, ok = true;
      // search the previous best first
      if (scored) ms = scored.slice().sort(function (a, b) { return b.v - a.v; }).map(function (x) { return x.m; });
      for (var i = 0; i < ms.length; i++) {
        var c = E.apply(s, ms[i]);
        // exact scores when we want to choose among several good moves; otherwise a window that keeps
        // weaker moves strictly below the best one
        var beta = (opts.noise || opts.margin) ? Infinity : -alpha + 0.5;
        var v = -(yield* negamax(E, c, d - 1, -Infinity, beta, 1, ctx));
        if (ctx.stop) { ok = false; break; }
        res.push({ m: ms[i], v: v });
        if (v > alpha) alpha = v;
      }
      if (!ok) break;
      scored = res; depthDone = d;
      if (alpha >= WIN - 50) break;
    }
    if (!scored) { scored = ms.map(function (m) { return { m: m, v: 0 }; }); }
    var top = -Infinity; scored.forEach(function (x) { if (x.v > top) top = x.v; });
    var pool = scored.filter(function (x) { return x.v >= top - (opts.margin || 0); });
    if (opts.noise && rand() < opts.noise) {
      var safe = scored.filter(function (x) { return x.v > -WIN + 100; });
      pool = safe.length ? safe : scored;
    }
    var pickOne = pool[Math.floor(rand() * pool.length)] || scored[0];
    return { move: pickOne.m, score: pickOne.v, depth: depthDone };
  }
  /* run a generator in ~12 ms slices; returns a cancel function */
  function runSliced(gen, done) {
    var cancelled = false;
    function step() {
      if (cancelled) return;
      var t0 = Date.now(), r;
      do { r = gen.next(); } while (!r.done && Date.now() - t0 < 12);
      if (cancelled) return;
      if (r.done) done(r.value); else setTimeout(step, 0);
    }
    setTimeout(step, 20);
    return function () { cancelled = true; };
  }
  function runSync(gen) { var r; do { r = gen.next(); } while (!r.done); return r.value; }

  root.IBG = { hunt: hunt, morris: morris, pal: pal, games: G, bestMove: bestMove, runSliced: runSliced, runSync: runSync };
})(typeof window !== 'undefined' ? window : globalThis);
