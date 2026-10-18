/* Sudoku engine (apps/sudoku): grid geometry for 4×4, 6×6 and 9×9, a fast solver (bitmasks, fewest choices
   first) that counts solutions, a human-style logic solver used to grade difficulty and to explain hints, and a
   seeded generator whose puzzles always have exactly one solution.
   No DOM and no outside variables: app.js also runs this same function inside a Blob worker. */
function SudokuEngineFactory() {
  'use strict';

  var BOX = { 4: [2, 2], 6: [2, 3], 9: [3, 3] };          /* [rows per box, columns per box] */
  var LEVELS = ['easy', 'medium', 'hard', 'expert'];
  var LEVELS_FOR = { 4: ['easy', 'medium'], 6: ['easy', 'medium', 'hard'], 9: LEVELS };
  /* Generator plan per size and level: [logic tier the puzzle must need, fewest clues, most clues, attempts].
     Tier 1 = singles, 2 = pointing / box-line / pairs, 3 = triples, quads, X-Wing, 4 = Y-Wing, XYZ-Wing, Swordfish.
     The clue range is where the generator stops removing numbers once the tier is reached. */
  var PLAN = {
    9: { easy: [1, 36, 40, 1], medium: [2, 29, 32, 40], hard: [3, 25, 28, 60], expert: [4, 22, 26, 120] },
    6: { easy: [1, 16, 18, 1], medium: [2, 11, 13, 60], hard: [3, 9, 11, 120] },
    4: { easy: [1, 8, 8, 1], medium: [1, 4, 6, 1] }
  };

  var POP = new Uint8Array(512), DIG = new Uint8Array(512);   /* bit count, and digit of the lowest set bit */
  for (var m0 = 1; m0 < 512; m0++) { POP[m0] = POP[m0 >> 1] + (m0 & 1); DIG[m0] = (m0 & 1) ? 1 : DIG[m0 >> 1] + 1; }
  function digitsOf(mask) { var out = []; for (var d = 1; mask; d++, mask >>= 1) if (mask & 1) out.push(d); return out; }

  /* ---------------------------------------------------------------- geometry */
  var GEO = {};
  function geo(n) {
    if (GEO[n]) return GEO[n];
    var br = BOX[n][0], bc = BOX[n][1], nn = n * n, across = n / bc, i, r, c, b, u;
    var row = new Int8Array(nn), col = new Int8Array(nn), box = new Int8Array(nn), units = [];
    for (u = 0; u < 3 * n; u++) units.push([]);
    for (i = 0; i < nn; i++) {
      r = (i / n) | 0; c = i % n; b = ((r / br) | 0) * across + ((c / bc) | 0);
      row[i] = r; col[i] = c; box[i] = b;
      units[r].push(i); units[n + c].push(i); units[2 * n + b].push(i);
    }
    var peers = [], seen = new Uint8Array(nn * nn);           /* seen[a*nn+b] = 1 when a and b share a row, column or box */
    for (i = 0; i < nn; i++) {
      var p = [], lists = [units[row[i]], units[n + col[i]], units[2 * n + box[i]]];
      for (var L = 0; L < 3; L++) for (var k = 0; k < n; k++) {
        var j = lists[L][k];
        if (j !== i && !seen[i * nn + j]) { seen[i * nn + j] = 1; p.push(j); }
      }
      peers.push(p);
    }
    var hiddenOrder = [];                                       /* boxes first: that is how people scan */
    for (u = 2 * n; u < 3 * n; u++) hiddenOrder.push(u);
    for (u = 0; u < 2 * n; u++) hiddenOrder.push(u);
    GEO[n] = { n: n, nn: nn, br: br, bc: bc, full: (1 << n) - 1, row: row, col: col, box: box, units: units, peers: peers, seen: seen, hiddenOrder: hiddenOrder };
    return GEO[n];
  }
  function validSize(n) { return n === 4 || n === 6 || n === 9; }

  /* ---------------------------------------------------------------- random numbers (same on every device) */
  function RNG(seed) {
    var a = (seed >>> 0) || 0x9E3779B9;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return h >>> 0;
  }
  function shuffle(a, rng) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; }
    return a;
  }

  /* ---------------------------------------------------------------- fast solver
     Depth-first search on bitmasks, always trying the empty cell with the fewest choices.
     Returns how many solutions it found, stopping at `limit`; the first one is copied into `out`. */
  function search(grid, n, limit, out, rng) {
    var G = geo(n), nn = G.nn, full = G.full, R = G.row, C = G.col, B = G.box;
    var rows = new Int32Array(n), cols = new Int32Array(n), boxes = new Int32Array(n);
    var cells = new Int8Array(nn), empties = new Int16Array(nn), left = 0, i, d, bit, found = 0;
    if (!grid || grid.length !== nn) return 0;
    for (i = 0; i < nn; i++) {
      d = +grid[i] || 0;
      if (d < 0 || d > n || d !== Math.floor(d)) return 0;
      cells[i] = d;
      if (!d) { empties[left++] = i; continue; }
      bit = 1 << (d - 1);
      if ((rows[R[i]] | cols[C[i]] | boxes[B[i]]) & bit) return 0;
      rows[R[i]] |= bit; cols[C[i]] |= bit; boxes[B[i]] |= bit;
    }
    var order = new Int8Array(9);
    function rec(k) {
      if (!k) {
        if (!found && out) for (var q = 0; q < nn; q++) out[q] = cells[q];
        found++;
        return found >= limit;
      }
      var best = 0, bestM = 0, bestP = 99, j, ii, mm, p;
      for (j = 0; j < k; j++) {
        ii = empties[j]; mm = full & ~(rows[R[ii]] | cols[C[ii]] | boxes[B[ii]]); p = POP[mm];
        if (p < bestP) { bestP = p; best = j; bestM = mm; if (p < 2) break; }
      }
      if (!bestP) return false;
      ii = empties[best]; empties[best] = empties[k - 1]; empties[k - 1] = ii;
      var r = R[ii], c = C[ii], b = B[ii], cnt = 0, x;
      for (mm = bestM; mm; mm &= mm - 1) order[cnt++] = DIG[mm & -mm];
      if (rng) for (x = cnt - 1; x > 0; x--) { var y = Math.floor(rng() * (x + 1)), tmp = order[x]; order[x] = order[y]; order[y] = tmp; }
      var mine = order.slice(0, cnt);
      for (x = 0; x < cnt; x++) {
        var bt = 1 << (mine[x] - 1);
        rows[r] |= bt; cols[c] |= bt; boxes[b] |= bt; cells[ii] = mine[x];
        if (rec(k - 1)) return true;
        rows[r] ^= bt; cols[c] ^= bt; boxes[b] ^= bt;
      }
      cells[ii] = 0;
      return false;
    }
    rec(left);
    return found;
  }
  /* How many solutions (0, 1 or 2 = "more than one"). */
  function countSolutions(grid, n, limit) { return validSize(n) ? search(grid, n, limit || 2, null, null) : 0; }
  function solve(grid, n) {
    if (!validSize(n)) return null;
    var out = new Array(n * n);
    return search(grid, n, 1, out, null) ? out : null;
  }
  function randomSolution(n, rng) {
    var out = new Array(n * n), empty = [];
    for (var i = 0; i < n * n; i++) empty.push(0);
    search(empty, n, 1, out, rng);
    return out;
  }

  /* ---------------------------------------------------------------- human-style logic solver
     state: v = placed digit (0 = empty), c = candidate bitmask (0 once placed), left = empty cells */
  function newState(grid, n) {
    var G = geo(n), st = { v: new Int8Array(G.nn), c: new Int16Array(G.nn), left: G.nn }, i, d;
    for (i = 0; i < G.nn; i++) st.c[i] = G.full;
    for (i = 0; i < G.nn; i++) {
      d = +grid[i] || 0;
      if (!d) continue;
      if (d < 1 || d > n || !(st.c[i] & (1 << (d - 1)))) return null;
      place(st, G, i, d);
    }
    for (i = 0; i < G.nn; i++) if (!st.v[i] && !st.c[i]) return null;
    return st;
  }
  function place(st, G, i, d) {
    var bit = 1 << (d - 1), P = G.peers[i];
    st.v[i] = d; st.c[i] = 0; st.left--;
    for (var k = 0; k < P.length; k++) st.c[P[k]] &= ~bit;
  }
  function combos(arr, k, fn) {          /* calls fn(list) for every k-element subset; stops when fn returns a value */
    var pick = [], res = null;
    (function go(start) {
      if (res) return;
      if (pick.length === k) { res = fn(pick); return; }
      for (var i = start; i <= arr.length - (k - pick.length) && !res; i++) { pick.push(arr[i]); go(i + 1); pick.pop(); }
    })(0);
    return res;
  }

  /* --- tier 1: singles --- */
  function fullHouse(st, G, u) {
    var cells = G.units[u], empty = -1, cnt = 0, have = 0;
    for (var k = 0; k < G.n; k++) { var i = cells[k]; if (st.v[i]) have |= 1 << (st.v[i] - 1); else { cnt++; empty = i; } }
    if (cnt !== 1) return null;
    var m = G.full & ~have;
    return (POP[m] === 1 && (st.c[empty] & m)) ? { t: 'full', tier: 1, cell: empty, d: DIG[m], unit: u } : null;
  }
  function hiddenIn(st, G, u, onlyCell) {
    var cells = G.units[u], once = 0, twice = 0, k, m;
    for (k = 0; k < G.n; k++) { m = st.c[cells[k]]; twice |= once & m; once |= m; }
    var single = once & ~twice;
    if (onlyCell >= 0) single &= st.c[onlyCell];
    if (!single) return null;
    var bit = single & -single;
    for (k = 0; k < G.n; k++) if (st.c[cells[k]] & bit) return { t: 'hidden', tier: 1, cell: cells[k], d: DIG[bit], unit: u };
    return null;
  }
  function findFull(st, G) {
    for (var u = 0; u < 3 * G.n; u++) { var s = fullHouse(st, G, u); if (s) return s; }
    return null;
  }
  function findHidden(st, G) {
    for (var k = 0; k < G.hiddenOrder.length; k++) { var s = hiddenIn(st, G, G.hiddenOrder[k], -1); if (s) return s; }
    return null;
  }
  function findNaked(st, G) {
    for (var i = 0; i < G.nn; i++) if (!st.v[i] && POP[st.c[i]] === 1) return { t: 'naked', tier: 1, cell: i, d: DIG[st.c[i]] };
    return null;
  }
  /* The simplest single for one particular cell (used when the player has selected a cell before asking for a hint). */
  function singleAt(st, G, i) {
    if (i < 0 || i >= G.nn || st.v[i]) return null;
    var n = G.n, us = [G.row[i], n + G.col[i], 2 * n + G.box[i]], s, k;
    for (k = 0; k < 3; k++) if ((s = fullHouse(st, G, us[k])) && s.cell === i) return s;
    for (k = 2; k >= 0; k--) if ((s = hiddenIn(st, G, us[k], i)) && s.cell === i) return s;
    if (POP[st.c[i]] === 1) return { t: 'naked', tier: 1, cell: i, d: DIG[st.c[i]] };
    return null;
  }

  /* --- tier 2: locked candidates and pairs; tier 3: triples, quads, X-Wing --- */
  function findPointing(st, G) {
    var n = G.n, U = G.units, c = st.c;
    for (var b = 0; b < n; b++) {
      var bu = 2 * n + b, cells = U[bu];
      for (var d = 1; d <= n; d++) {
        var bit = 1 << (d - 1), pat = [], sameR = true, sameC = true, k, i;
        for (k = 0; k < n; k++) {
          i = cells[k];
          if (!(c[i] & bit)) continue;
          if (pat.length) { if (G.row[i] !== G.row[pat[0]]) sameR = false; if (G.col[i] !== G.col[pat[0]]) sameC = false; }
          pat.push(i);
        }
        if (pat.length < 2) continue;
        for (var o = 0; o < 2; o++) {
          if (o === 0 ? !sameR : !sameC) continue;
          var line = o === 0 ? G.row[pat[0]] : n + G.col[pat[0]], el = [];
          for (k = 0; k < n; k++) { i = U[line][k]; if (G.box[i] !== b && (c[i] & bit)) el.push(i, bit); }
          if (el.length) return { t: 'pointing', tier: 2, d: d, unit: bu, unit2: line, cells: pat, elim: el };
        }
      }
    }
    return null;
  }
  function findClaiming(st, G) {
    var n = G.n, U = G.units, c = st.c;
    for (var u = 0; u < 2 * n; u++) {
      for (var d = 1; d <= n; d++) {
        var bit = 1 << (d - 1), pat = [], same = true, k, i;
        for (k = 0; k < n; k++) {
          i = U[u][k];
          if (!(c[i] & bit)) continue;
          if (pat.length && G.box[i] !== G.box[pat[0]]) same = false;
          pat.push(i);
        }
        if (pat.length < 2 || !same) continue;
        var bu = 2 * n + G.box[pat[0]], el = [];
        for (k = 0; k < n; k++) {
          i = U[bu][k];
          var inLine = u < n ? G.row[i] === u : G.col[i] === u - n;
          if (!inLine && (c[i] & bit)) el.push(i, bit);
        }
        if (el.length) return { t: 'claiming', tier: 2, d: d, unit: u, unit2: bu, cells: pat, elim: el };
      }
    }
    return null;
  }
  function findNakedSub(st, G, size) {
    var n = G.n, U = G.units, c = st.c;
    for (var u = 0; u < 3 * n; u++) {
      var cells = U[u], cand = [], empty = 0;
      for (var k = 0; k < n; k++) { var i = cells[k]; if (st.v[i]) continue; empty++; if (POP[c[i]] >= 2 && POP[c[i]] <= size) cand.push(i); }
      if (cand.length < size || empty <= size) continue;
      var s = combos(cand, size, function (pick) {
        var uni = 0, q;
        for (q = 0; q < size; q++) uni |= c[pick[q]];
        if (POP[uni] !== size) return null;
        var el = [];
        for (q = 0; q < n; q++) { var j = cells[q]; if (!st.v[j] && pick.indexOf(j) < 0 && (c[j] & uni)) el.push(j, c[j] & uni); }
        return el.length ? { t: 'nsub', tier: size === 2 ? 2 : 3, k: size, unit: u, cells: pick.slice(), digits: uni, elim: el } : null;
      });
      if (s) return s;
    }
    return null;
  }
  function findHiddenSub(st, G, size) {
    var n = G.n, U = G.units, c = st.c;
    for (var u = 0; u < 3 * n; u++) {
      var cells = U[u], digs = [], pos = [], d, k;
      for (d = 1; d <= n; d++) {
        var bit = 1 << (d - 1), pm = 0;
        for (k = 0; k < n; k++) if (c[cells[k]] & bit) pm |= 1 << k;
        pos[d] = pm;
        if (POP[pm] >= 2 && POP[pm] <= size) digs.push(d);
      }
      if (digs.length < size) continue;
      var s = combos(digs, size, function (pick) {
        var uni = 0, dm = 0, q;
        for (q = 0; q < size; q++) { uni |= pos[pick[q]]; dm |= 1 << (pick[q] - 1); }
        if (POP[uni] !== size) return null;
        var el = [], pc = [];
        for (q = 0; q < n; q++) if (uni & (1 << q)) { var j = cells[q], extra = c[j] & ~dm; pc.push(j); if (extra) el.push(j, extra); }
        return el.length ? { t: 'hsub', tier: size === 2 ? 2 : 3, k: size, unit: u, cells: pc, digits: dm, elim: el } : null;
      });
      if (s) return s;
    }
    return null;
  }
  function findFish(st, G, size) {
    var n = G.n, c = st.c;
    for (var d = 1; d <= n; d++) {
      var bit = 1 << (d - 1);
      for (var o = 0; o < 2; o++) {                 /* o = 0: base rows / cover columns; o = 1: the other way round */
        var lines = [], masks = [], L, j;
        for (L = 0; L < n; L++) {
          var pm = 0;
          for (j = 0; j < n; j++) if (c[o ? j * n + L : L * n + j] & bit) pm |= 1 << j;
          if (POP[pm] >= 2 && POP[pm] <= size) { lines.push(L); masks[L] = pm; }
        }
        if (lines.length < size) continue;
        var s = combos(lines, size, function (pick) {
          var uni = 0, q;
          for (q = 0; q < size; q++) uni |= masks[pick[q]];
          if (POP[uni] !== size) return null;
          var el = [], pat = [], cover = [];
          for (j = 0; j < n; j++) {
            if (!(uni & (1 << j))) continue;
            cover.push(o ? j : n + j);
            for (var x = 0; x < n; x++) {
              var cell = o ? j * n + x : x * n + j;
              if (!(c[cell] & bit)) continue;
              if (pick.indexOf(x) >= 0) pat.push(cell); else el.push(cell, bit);
            }
          }
          if (!el.length) return null;
          var base = pick.map(function (p) { return o ? n + p : p; });
          return { t: 'fish', tier: 3, k: size, d: d, base: base, cover: cover, cells: pat, elim: el };
        });
        if (s) return s;
      }
    }
    return null;
  }

  /* --- tier 4: wings --- */
  function findXYWing(st, G) {
    var nn = G.nn, c = st.c, S = G.seen;
    for (var p = 0; p < nn; p++) {
      var pm = c[p];
      if (POP[pm] !== 2) continue;
      var P = G.peers[p];
      for (var a = 0; a < P.length; a++) {
        var x = P[a], xm = c[x];
        if (POP[xm] !== 2 || xm === pm) continue;
        var common = xm & pm;
        if (POP[common] !== 1) continue;
        var z = xm & ~pm, want = (pm & ~common) | z;
        for (var b = 0; b < P.length; b++) {
          var y = P[b];
          if (y === x || c[y] !== want) continue;
          var el = [], XP = G.peers[x];
          for (var k = 0; k < XP.length; k++) { var i = XP[k]; if (i !== y && i !== p && (c[i] & z) && S[i * nn + y]) el.push(i, z); }
          if (el.length) return { t: 'xywing', tier: 3, cells: [p, x, y], d: DIG[z], a: DIG[common], b: DIG[pm & ~common], elim: el };
        }
      }
    }
    return null;
  }
  function findXYZWing(st, G) {
    var nn = G.nn, c = st.c, S = G.seen;
    for (var p = 0; p < nn; p++) {
      var pm = c[p];
      if (POP[pm] !== 3) continue;
      var P = G.peers[p];
      for (var a = 0; a < P.length; a++) {
        var x = P[a], xm = c[x];
        if (POP[xm] !== 2 || (xm & ~pm)) continue;
        for (var b = a + 1; b < P.length; b++) {
          var y = P[b], ym = c[y];
          if (POP[ym] !== 2 || (ym & ~pm) || ym === xm || (xm | ym) !== pm) continue;
          var z = xm & ym;
          if (POP[z] !== 1) continue;
          var el = [], PP = G.peers[p];
          for (var k = 0; k < PP.length; k++) { var i = PP[k]; if (i !== x && i !== y && (c[i] & z) && S[i * nn + x] && S[i * nn + y]) el.push(i, z); }
          if (el.length) return { t: 'xyzwing', tier: 3, cells: [p, x, y], d: DIG[z], elim: el };
        }
      }
    }
    return null;
  }

  /* --- tier 5: "try it and see" (a cell with two choices; one of them soon leads to a dead end) --- */
  function cloneState(st) { return { v: st.v.slice(), c: st.c.slice(), left: st.left }; }
  function deadEnd(st, G) {
    var n = G.n, i, u, k;
    for (i = 0; i < G.nn; i++) if (!st.v[i] && !st.c[i]) return { kind: 'cell', cell: i };
    for (u = 0; u < 3 * n; u++) {
      var have = 0, can = 0, cells = G.units[u];
      for (k = 0; k < n; k++) { i = cells[k]; if (st.v[i]) have |= 1 << (st.v[i] - 1); else can |= st.c[i]; }
      var lost = G.full & ~have & ~can;
      if (lost) return { kind: 'unit', unit: u, d: DIG[lost & -lost] };
    }
    return null;
  }
  /* Follow singles only (what anyone can do in their head) until a dead end or nothing more is found. */
  function followSingles(st, G, maxSteps) {
    for (var k = 0; k <= maxSteps; k++) {
      var bad = deadEnd(st, G);
      if (bad) { bad.steps = k; return bad; }
      var s = findFull(st, G) || findHidden(st, G) || findNaked(st, G);
      if (!s) return null;
      place(st, G, s.cell, s.d);
    }
    return null;
  }
  function findForcing(st, G, maxSteps) {
    var best = null;
    for (var i = 0; i < G.nn; i++) {
      if (st.v[i] || POP[st.c[i]] !== 2) continue;
      var ds = digitsOf(st.c[i]);
      for (var k = 0; k < 2; k++) {
        var cp = cloneState(st);
        place(cp, G, i, ds[k]);
        var bad = followSingles(cp, G, best ? best.why.steps - 1 : maxSteps);
        if (bad && (!best || bad.steps < best.why.steps)) {
          best = { t: 'forcing', tier: 4, cell: i, d: ds[1 - k], wrong: ds[k], why: bad };
          if (bad.steps <= 2) return best;
        }
      }
    }
    return best;
  }

  var FINDERS = [
    [1, findFull], [1, findHidden], [1, findNaked],
    [2, findPointing], [2, findClaiming],
    [2, function (s, g) { return findNakedSub(s, g, 2); }], [2, function (s, g) { return findHiddenSub(s, g, 2); }],
    [3, function (s, g) { return findNakedSub(s, g, 3); }], [3, function (s, g) { return findHiddenSub(s, g, 3); }],
    [3, function (s, g) { return findFish(s, g, 2); }],
    [3, function (s, g) { return findNakedSub(s, g, 4); }], [3, function (s, g) { return findHiddenSub(s, g, 4); }],
    [3, findXYWing], [3, findXYZWing],
    [3, function (s, g) { return findFish(s, g, 3); }], [3, function (s, g) { return findFish(s, g, 4); }],
    [4, function (s, g) { return findForcing(s, g, 60); }]
  ];
  function nextStep(st, G, maxTier, fromTier) {
    for (var f = 0; f < FINDERS.length; f++) {
      var F = FINDERS[f];
      if (F[0] > maxTier) break;
      if (fromTier && F[0] < fromTier) continue;
      var s = F[1](st, G);
      if (s) return s;
    }
    return null;
  }
  function applyStep(st, G, s) {
    if (s.elim) { for (var k = 0; k < s.elim.length; k += 2) st.c[s.elim[k]] &= ~s.elim[k + 1]; }
    else place(st, G, s.cell, s.d);
  }
  var SUB_NAMES = { 2: 'pair', 3: 'triple', 4: 'quad' }, FISH_NAMES = { 2: 'xwing', 3: 'swordfish', 4: 'jellyfish' };
  function techKey(s) {
    if (s.t === 'nsub') return 'n' + SUB_NAMES[s.k];
    if (s.t === 'hsub') return 'h' + SUB_NAMES[s.k];
    if (s.t === 'fish') return FISH_NAMES[s.k];
    return s.t;
  }

  /* Grade a puzzle by the hardest logic it needs. tier 5 = our logic gets stuck (it needs guessing or chains). */
  function rate(grid, n, maxTier) {
    if (!validSize(n)) return { ok: false };
    var G = geo(n), st = newState(grid, n);
    if (!st) return { ok: false };
    maxTier = maxTier || 4;
    var tier = 0, used = {}, guard = 0;
    while (st.left > 0 && guard++ < 5000) {
      var s = nextStep(st, G, maxTier, 0);
      if (!s) return { ok: true, solved: false, tier: maxTier + 1, used: used };
      if (s.tier > tier) tier = s.tier;
      var key = techKey(s);
      used[key] = (used[key] || 0) + 1;
      applyStep(st, G, s);
    }
    return { ok: true, solved: st.left === 0, tier: tier, used: used };
  }

  function clueCount(g) { var k = 0; for (var i = 0; i < g.length; i++) if (g[i]) k++; return k; }

  /* ---------------------------------------------------------------- generator
     1. a random full grid; 2. take numbers away in pairs (180° turn symmetry), keeping a removal only when the
     puzzle can still be solved with logic up to the level's tier (sound logic, so the answer stays unique);
     3. stop when the level's tier is needed and the clue count is in range. Everything depends only on the seed,
     so the same seed gives the same puzzle on every phone (the daily puzzle relies on this). */
  function generate(n, level, seed) {
    if (!validSize(n)) n = 9;
    if (LEVELS_FOR[n].indexOf(level) < 0) level = LEVELS_FOR[n][0];
    seed = (seed >>> 0) || 1;
    var G = geo(n), plan = PLAN[n][level], T = plan[0], rng = RNG(hash(n + ':' + level + ':' + seed)), best = null;
    for (var att = 0; att < plan[3]; att++) {
      var sol = randomSolution(n, rng), puz = sol.slice(), clues = G.nn, tier = 0;
      var target = plan[1] + Math.floor(rng() * (plan[2] - plan[1] + 1));
      var pairs = [];
      for (var i = 0; i < G.nn; i++) if (i <= G.nn - 1 - i) pairs.push(i);
      shuffle(pairs, rng);
      for (var k = 0; k < pairs.length; k++) {
        if (clues <= target && tier >= T) break;
        var a = pairs[k], b = G.nn - 1 - a, va = puz[a], vb = puz[b];
        puz[a] = 0; puz[b] = 0;
        var r = rate(puz, n, T);
        if (!r.solved) { puz[a] = va; puz[b] = vb; continue; }
        tier = r.tier; clues -= (a === b ? 1 : 2);
      }
      var cand = { givens: puz, solution: sol, tier: tier, clues: clues };
      if (tier === T) { best = cand; break; }
      if (!best || tier > best.tier || (tier === best.tier && clues < best.clues)) best = cand;
    }
    var info = rate(best.givens, n, 4);
    return {
      n: n, level: level, seed: seed, givens: best.givens, solution: best.solution, clues: clueCount(best.givens),
      tier: info.solved ? info.tier : 5, used: info.used || {}, unique: countSolutions(best.givens, n, 2) === 1
    };
  }

  /* ---------------------------------------------------------------- hints
     grid = givens plus the player's correct numbers. Finds the simplest way to fill one more cell: a single
     (preferring the selected cell), after as few crossing-out steps as needed. Returns
     { step, chain } or { stuck: true, chain } when only guessing would help. */
  function hint(grid, n, prefer) {
    if (!validSize(n)) return null;
    var G = geo(n), st = newState(grid, n);
    if (!st || !st.left) return null;
    var chain = [];
    for (var guard = 0; guard < 80; guard++) {
      var s = singleAt(st, G, prefer == null ? -1 : prefer) || findFull(st, G) || findHidden(st, G) || findNaked(st, G);
      if (s) {
        if (s.t === 'naked') {                     /* which numbers the cell's row, column and box already hold */
          var have = 0, P = G.peers[s.cell];
          for (var k = 0; k < P.length; k++) if (st.v[P[k]]) have |= 1 << (st.v[P[k]] - 1);
          s.have = digitsOf(have);
        }
        return { step: s, chain: chain, key: techKey(s) };
      }
      var e = nextStep(st, G, 4, 2);
      if (!e) return { stuck: true, chain: chain };
      if (!e.elim) return { step: e, chain: chain, key: techKey(e) };   /* "try it and see" fills the cell itself */
      e.key = techKey(e);
      chain.push(e);
      applyStep(st, G, e);
    }
    return { stuck: true, chain: chain };
  }

  /* Candidate masks for every empty cell from the numbers on the board (for "fill in all notes"). */
  function candidates(grid, n) {
    var G = geo(n), out = [], i, k;
    for (i = 0; i < G.nn; i++) {
      if (grid[i]) { out.push(0); continue; }
      var used = 0, P = G.peers[i];
      for (k = 0; k < P.length; k++) if (grid[P[k]]) used |= 1 << (grid[P[k]] - 1);
      out.push(G.full & ~used);
    }
    return out;
  }

  return {
    SIZES: [9, 6, 4], LEVELS: LEVELS, LEVELS_FOR: LEVELS_FOR, PLAN: PLAN, BOX: BOX,
    geo: geo, countSolutions: countSolutions, solve: solve, rate: rate, generate: generate, hint: hint, fullGrid: randomSolution,
    candidates: candidates, hash: hash, RNG: RNG, digitsOf: digitsOf, techKey: techKey, clueCount: clueCount
  };
}
if (typeof window !== 'undefined') window.SudokuEngine = SudokuEngineFactory();
if (typeof module !== 'undefined' && module.exports) module.exports = SudokuEngineFactory;
