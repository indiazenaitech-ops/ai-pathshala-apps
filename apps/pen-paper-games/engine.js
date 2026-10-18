/* Tic-Tac-Toe & More: the rules of the four games and the computer players (pure logic, no DOM).
   The same function runs on the page (window.PPG) and inside a Web Worker built from its source text
   (window.PPG_SOURCE), so the computer can think for up to a second without freezing the screen.
   (Chrome blocks new Worker('file.js') on file://, a Blob worker works everywhere.) */
(function (root) {
  'use strict';

  function PPG_FACTORY() {
    'use strict';
    var now = (typeof performance !== 'undefined' && performance && performance.now)
      ? function () { return performance.now(); } : function () { return Date.now(); };
    var WIN = 1000000, NEAR = 999000;   /* a score >= NEAR means "a sure win was found", <= -NEAR "a sure loss" */

    /* ---------------------------------------------------------------- helpers */
    function rngFrom(seed) {               /* mulberry32 when a seed is given (tests), else Math.random */
      if (typeof seed !== 'number' || !isFinite(seed)) return Math.random;
      var a = seed >>> 0;
      return function () {
        a = (a + 0x6D2B79F5) | 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    function pick(arr, rng) { return arr[Math.floor(rng() * arr.length)]; }
    function topMoves(moves, scores) {
      var best = -Infinity, out = [];
      for (var i = 0; i < moves.length; i++) {
        var s = scores[i];
        if (s > best) { best = s; out = [moves[i]]; } else if (s === best) out.push(moves[i]);
      }
      return out;
    }
    function weighted(items, weights, rng) {
      var sum = 0, i;
      for (i = 0; i < weights.length; i++) sum += weights[i];
      var x = rng() * sum;
      for (i = 0; i < items.length; i++) { x -= weights[i]; if (x < 0) return items[i]; }
      return items[items.length - 1];
    }
    function zobrist(len, seed) {
      var r = rngFrom(seed), a = new Int32Array(len), b = new Int32Array(len);
      for (var i = 0; i < len; i++) { a[i] = (r() * 4294967296) | 0; b[i] = (r() * 4294967296) | 0; }
      return [a, b];
    }
    function hashKey(h1, h2) { return (h1 >>> 0) * 2097152 + ((h2 >>> 0) & 2097151); }   /* 53 bits, exact in a double */

    /* ================================================================ Tic-Tac-Toe: n × n board, k in a row
       board: array of n*n with 0 = empty, 1 = X (player 1), 2 = O (player 2); index = row * n + col */
    var geomCache = {};
    function tttGeom(n, k) {
      var key = n + 'x' + k;
      if (geomCache[key]) return geomCache[key];
      var lines = [], dirs = [[0, 1], [1, 0], [1, 1], [1, -1]], r, c, d, i, j;
      for (r = 0; r < n; r++) for (c = 0; c < n; c++) for (d = 0; d < 4; d++) {
        var dr = dirs[d][0], dc = dirs[d][1], er = r + dr * (k - 1), ec = c + dc * (k - 1);
        if (er < 0 || er >= n || ec < 0 || ec >= n) continue;
        var L = [];
        for (i = 0; i < k; i++) L.push((r + dr * i) * n + (c + dc * i));
        lines.push(L);
      }
      var N = n * n, cellLines = [];
      for (i = 0; i < N; i++) cellLines.push([]);
      for (i = 0; i < lines.length; i++) for (j = 0; j < k; j++) cellLines[lines[i][j]].push(i);
      var mid = (n - 1) / 2, order = [];
      for (i = 0; i < N; i++) order.push(i);
      var dist = function (x) { return Math.abs(Math.floor(x / n) - mid) + Math.abs(x % n - mid); };
      order.sort(function (a, b) { return (cellLines[b].length - cellLines[a].length) || (dist(a) - dist(b)) || (a - b); });
      return (geomCache[key] = { n: n, k: k, N: N, lines: lines, cellLines: cellLines, order: order });
    }

    /* { over, winner (0 = draw), line, full, blocked }: "blocked" = every line holds both marks, nobody can win */
    function tttStatus(board, n, k) {
      var g = tttGeom(n, k), i, j, L;
      for (i = 0; i < g.lines.length; i++) {
        L = g.lines[i];
        var p = board[L[0]];
        if (!p) continue;
        for (j = 1; j < k; j++) if (board[L[j]] !== p) break;
        if (j === k) return { over: true, winner: p, line: L.slice() };
      }
      var empty = 0;
      for (i = 0; i < board.length; i++) if (!board[i]) empty++;
      if (!empty) return { over: true, winner: 0, line: null, full: true };
      for (i = 0; i < g.lines.length; i++) {
        L = g.lines[i];
        var a = 0, b = 0;
        for (j = 0; j < k; j++) { if (board[L[j]] === 1) a = 1; else if (board[L[j]] === 2) b = 1; }
        if (!(a && b)) return { over: false };
      }
      return { over: true, winner: 0, line: null, blocked: true };
    }

    function tttCompletes(board, g, m, q) {
      var ls = g.cellLines[m];
      for (var x = 0; x < ls.length; x++) {
        var L = g.lines[ls[x]], ok = true;
        for (var y = 0; y < L.length; y++) if (L[y] !== m && board[L[y]] !== q) { ok = false; break; }
        if (ok) return true;
      }
      return false;
    }

    /* 3 × 3 only: exact minimax value of every empty square for player p, and how many complete games exist.
       Score from p's side: 100 - plies to a win, -(100 - plies) for a loss, 0 for a draw. */
    function tttExact(board, p) {
      var g = tttGeom(3, 3), b = board.slice(), memo = {}, positions = 0;
      function winsAt(i, q) {
        var ls = g.cellLines[i];
        for (var t = 0; t < ls.length; t++) {
          var L = g.lines[ls[t]];
          if (b[L[0]] === q && b[L[1]] === q && b[L[2]] === q) return true;
        }
        return false;
      }
      function child(i, q, empty) {          /* q has just played i: value for q, and games below */
        if (winsAt(i, q)) return { s: 99, games: 1 };
        if (empty === 1) return { s: 0, games: 1 };
        var r = solve(3 - q, empty - 1), sg = r.v > 0 ? 1 : r.v < 0 ? -1 : 0;
        return { s: sg - r.v, games: r.games };
      }
      function solve(q, empty) {
        var key = b.join('') + q, m = memo[key];
        if (m) return m;
        positions++;
        var best = -1000, games = 0;
        for (var i = 0; i < 9; i++) {
          if (b[i]) continue;
          b[i] = q;
          var c = child(i, q, empty);
          b[i] = 0;
          games += c.games;
          if (c.s > best) best = c.s;
        }
        return (memo[key] = { v: best, games: games });
      }
      var empty = 0, i;
      for (i = 0; i < 9; i++) if (!b[i]) empty++;
      var scores = [], games = 0;
      for (i = 0; i < 9; i++) {
        if (b[i]) { scores.push(null); continue; }
        b[i] = p;
        var c = child(i, p, empty);
        b[i] = 0;
        games += c.games;
        scores.push(c.s);
      }
      return { scores: scores, games: games, positions: positions + 1 };
    }

    /* Bigger boards: depth-limited negamax with alpha-beta, a transposition table, forced blocks and a time budget.
       Every root move gets a full-window search, so the scores of all empty squares are exact for that depth. */
    function tttSearch(board, n, k, p, opts) {
      var g = tttGeom(n, k), N = g.N, lines = g.lines, cellLines = g.cellLines, order = g.order;
      var nl = lines.length, b = board.slice(), cnt = new Int8Array(nl * 2), i, j;
      for (i = 0; i < nl; i++) for (j = 0; j < k; j++) { var v = b[lines[i][j]]; if (v) cnt[i * 2 + v - 1]++; }
      var WV = k >= 4 ? [0, 1, 5, 30, 0] : [0, 1, 6, 0];
      var z = zobrist(N * 2, 7919 + n * 31 + k), z1 = z[0], z2 = z[1];
      var h1 = 0, h2 = 0, empt = 0;
      for (i = 0; i < N; i++) { if (b[i]) { h1 ^= z1[i * 2 + b[i] - 1]; h2 ^= z2[i * 2 + b[i] - 1]; } else empt++; }
      var tt = new Map(), nodes = 0, stopped = false, deadline = opts.timeMs ? now() + opts.timeMs : Infinity;

      function wins(c, q) {
        var ls = cellLines[c], qi = q - 1, oi = 2 - q;
        for (var x = 0; x < ls.length; x++) { var base = ls[x] * 2; if (cnt[base + qi] === k - 1 && cnt[base + oi] === 0) return true; }
        return false;
      }
      function put(c, q) {
        b[c] = q; var zi = c * 2 + q - 1; h1 ^= z1[zi]; h2 ^= z2[zi];
        var ls = cellLines[c]; for (var x = 0; x < ls.length; x++) cnt[ls[x] * 2 + q - 1]++;
      }
      function take(c, q) {
        b[c] = 0; var zi = c * 2 + q - 1; h1 ^= z1[zi]; h2 ^= z2[zi];
        var ls = cellLines[c]; for (var x = 0; x < ls.length; x++) cnt[ls[x] * 2 + q - 1]--;
      }
      function evaluate(q) {
        var s = 0, qi = q - 1, oi = 2 - q;
        for (var x = 0; x < nl; x++) { var a = cnt[x * 2 + qi], o = cnt[x * 2 + oi]; if (a) { if (!o) s += WV[a]; } else if (o) s -= WV[o]; }
        return s;
      }
      function negamax(q, depth, alpha, beta, ply, left) {
        if ((++nodes & 2047) === 0 && now() > deadline) stopped = true;
        if (stopped) return 0;
        var o = 3 - q, x, c, s;
        for (x = 0; x < N; x++) { c = order[x]; if (!b[c] && wins(c, q)) return WIN - ply - 1; }
        if (left === 0) return 0;
        var forced = -1, threats = 0;
        for (x = 0; x < N; x++) { c = order[x]; if (!b[c] && wins(c, o)) { if (++threats > 1) return -(WIN - ply - 2); forced = c; } }
        if (depth <= 0) return evaluate(q);
        var key = hashKey(h1, h2), e = tt.get(key), first = -1, a0 = alpha;
        if (e) {
          first = e.m;
          if (e.d >= depth) {
            if (e.f === 0) return e.v;
            if (e.f === 1) { if (e.v > alpha) alpha = e.v; } else if (e.v < beta) beta = e.v;
            if (alpha >= beta) return e.v;
          }
        }
        var best = -Infinity, bestM = -1;
        if (forced >= 0) {
          put(forced, q); s = -negamax(o, depth - 1, -beta, -alpha, ply + 1, left - 1); take(forced, q);
          best = s; bestM = forced;
        } else {
          if (first >= 0 && !b[first]) {
            put(first, q); s = -negamax(o, depth - 1, -beta, -alpha, ply + 1, left - 1); take(first, q);
            if (stopped) return 0;
            best = s; bestM = first; if (s > alpha) alpha = s;
          }
          for (x = 0; x < N && alpha < beta; x++) {
            c = order[x];
            if (b[c] || c === first) continue;
            put(c, q); s = -negamax(o, depth - 1, -beta, -alpha, ply + 1, left - 1); take(c, q);
            if (stopped) return 0;
            if (s > best) { best = s; bestM = c; }
            if (s > alpha) alpha = s;
          }
        }
        if (stopped) return 0;
        tt.set(key, { v: best, d: depth, m: bestM, f: best <= a0 ? 2 : best >= beta ? 1 : 0 });
        return best;
      }

      var moves = [];
      for (i = 0; i < N; i++) if (!b[order[i]]) moves.push(order[i]);
      var maxDepth = Math.min(opts.maxDepth || 4, empt), done = null, doneDepth = 0;
      for (var d = 1; d <= maxDepth; d++) {
        var sc = [];
        for (i = 0; i < moves.length; i++) {
          var m = moves[i], s;
          if (wins(m, p)) s = WIN - 1;
          else { put(m, p); s = -negamax(3 - p, d - 1, -Infinity, Infinity, 1, empt - 1); take(m, p); }
          if (stopped) break;
          sc.push(s);
        }
        if (stopped) break;
        var idx = moves.map(function (mm, q) { return q; });
        idx.sort(function (a, b2) { return (sc[b2] - sc[a]) || (a - b2); });
        moves = idx.map(function (q) { return moves[q]; });
        done = idx.map(function (q) { return sc[q]; });
        doneDepth = d;
        if (done.every(function (val) { return val >= NEAR || val <= -NEAR; })) break;
      }
      if (!done) {
        done = moves.map(function (mm) {
          if (wins(mm, p)) return WIN - 1;
          put(mm, p); var val = -evaluate(3 - p); take(mm, p); return val;
        });
      }
      var scores = [];
      for (i = 0; i < N; i++) scores.push(null);
      for (i = 0; i < moves.length; i++) scores[moves[i]] = done[i];
      return { moves: moves, list: done, scores: scores, depth: doneDepth, nodes: nodes };
    }

    /* The computer's move. Easy: often takes a win, rarely blocks, else random. Medium: wins and blocks;
       on 3 × 3 plays perfectly half the time; bigger boards look 2 moves ahead. Hard: perfect on 3 × 3,
       alpha-beta with a time budget on bigger boards. */
    function tttMove(board, n, k, p, level, rng, timeMs) {
      var g = tttGeom(n, k), N = g.N, moves = [], i, o = 3 - p;
      for (i = 0; i < N; i++) if (!board[g.order[i]]) moves.push(g.order[i]);
      if (!moves.length) return { move: -1 };
      var winNow = moves.filter(function (m) { return tttCompletes(board, g, m, p); });
      var blocks = moves.filter(function (m) { return tttCompletes(board, g, m, o); });
      if (level === 'easy') {
        if (winNow.length && rng() < 0.7) return { move: pick(winNow, rng) };
        if (blocks.length && rng() < 0.3) return { move: pick(blocks, rng) };
        return { move: pick(moves, rng) };
      }
      if (winNow.length) return { move: pick(winNow, rng) };
      if (blocks.length) return { move: pick(blocks, rng) };
      if (n === 3) {
        if (level === 'hard' || rng() < 0.5) {
          var ex = tttExact(board, p);
          return { move: pick(topMoves(moves, moves.map(function (m) { return ex.scores[m]; })), rng) };
        }
        return { move: weighted(moves, moves.map(function (m) { return m === 4 ? 4 : m % 2 === 0 ? 2 : 1; }), rng) };
      }
      var res = tttSearch(board, n, k, p, level === 'hard' ? { maxDepth: 16, timeMs: timeMs || 700 } : { maxDepth: 2 });
      return { move: pick(topMoves(res.moves, res.list), rng), depth: res.depth, nodes: res.nodes };
    }

    /* "Show what the computer is thinking": a rating for every empty square, for player p. */
    function tttRate(board, n, k, p, timeMs) {
      var i, cats = [];
      if (n === 3) {
        var ex = tttExact(board, p);
        for (i = 0; i < 9; i++) cats.push(ex.scores[i] === null ? null : ex.scores[i] > 0 ? 'win' : ex.scores[i] < 0 ? 'lose' : 'draw');
        return { exact: true, cats: cats, scores: ex.scores, games: ex.games, positions: ex.positions };
      }
      /* not proven: rate each square against the best and worst unproven squares on this board */
      var res = tttSearch(board, n, k, p, { maxDepth: 6, timeMs: timeMs || 350 }), hi = -Infinity, lo = Infinity, s;
      for (i = 0; i < res.scores.length; i++) { s = res.scores[i]; if (s !== null && s < NEAR && s > -NEAR) { if (s > hi) hi = s; if (s < lo) lo = s; } }
      var range = hi - lo, goodAt = hi - Math.max(2, range * 0.25), badAt = hi - Math.max(10, range * 0.8);
      for (i = 0; i < res.scores.length; i++) {
        s = res.scores[i];
        cats.push(s === null ? null : s >= NEAR ? 'win' : s <= -NEAR ? 'lose' : s >= goodAt ? 'good' : s <= badAt ? 'bad' : 'even');
      }
      return { exact: false, cats: cats, scores: res.scores, depth: res.depth, nodes: res.nodes };
    }

    /* ================================================================ Four in a Row: 7 columns × 6 rows
       board: array of 42, index = col * 6 + row, row 0 is the bottom */
    var C4G = (function () {
      var wins = [], cellWins = [], i, j, dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
      for (i = 0; i < 42; i++) cellWins.push([]);
      for (var c = 0; c < 7; c++) for (var r = 0; r < 6; r++) for (var d = 0; d < 4; d++) {
        var dc = dirs[d][0], dr = dirs[d][1], ec = c + 3 * dc, er = r + 3 * dr;
        if (ec < 0 || ec > 6 || er < 0 || er > 5) continue;
        var w = [];
        for (j = 0; j < 4; j++) w.push((c + j * dc) * 6 + (r + j * dr));
        for (j = 0; j < 4; j++) cellWins[w[j]].push(wins.length);
        wins.push(w);
      }
      return { wins: wins, cellWins: cellWins, order: [3, 2, 4, 1, 5, 0, 6] };
    })();

    function c4Row(board, c) { for (var r = 0; r < 6; r++) if (!board[c * 6 + r]) return r; return -1; }
    function c4Status(board) {
      var w = C4G.wins, i;
      for (i = 0; i < w.length; i++) {
        var a = board[w[i][0]];
        if (a && board[w[i][1]] === a && board[w[i][2]] === a && board[w[i][3]] === a) return { over: true, winner: a, line: w[i].slice() };
      }
      for (i = 0; i < 42; i++) if (!board[i]) return { over: false };
      return { over: true, winner: 0, line: null };
    }
    function c4WouldWin(board, c, q) {
      var r = c4Row(board, c);
      if (r < 0) return false;
      var idx = c * 6 + r, ls = C4G.cellWins[idx];
      for (var x = 0; x < ls.length; x++) {
        var w = C4G.wins[ls[x]], ok = true;
        for (var y = 0; y < 4; y++) if (w[y] !== idx && board[w[y]] !== q) { ok = false; break; }
        if (ok) return true;
      }
      return false;
    }

    function c4Search(board, p, opts) {
      var W = C4G.wins, CW = C4G.cellWins, ORD = C4G.order, nw = W.length;
      var b = board.slice(), hgt = [0, 0, 0, 0, 0, 0, 0], cnt = new Int8Array(nw * 2), i, j, filled = 0;
      for (i = 0; i < 7; i++) { var r = c4Row(b, i); hgt[i] = r < 0 ? 6 : r; filled += hgt[i]; }
      for (i = 0; i < nw; i++) for (j = 0; j < 4; j++) { var v = b[W[i][j]]; if (v) cnt[i * 2 + v - 1]++; }
      var z = zobrist(84, 104729), z1 = z[0], z2 = z[1], h1 = 0, h2 = 0;
      for (i = 0; i < 42; i++) if (b[i]) { h1 ^= z1[i * 2 + b[i] - 1]; h2 ^= z2[i * 2 + b[i] - 1]; }
      var tt = new Map(), nodes = 0, stopped = false, deadline = opts.timeMs ? now() + opts.timeMs : Infinity;
      var WV = [0, 1, 5, 40];

      function canWin(c, q) {
        var rr = hgt[c];
        if (rr >= 6) return false;
        var ls = CW[c * 6 + rr], qi = q - 1, oi = 2 - q;
        for (var x = 0; x < ls.length; x++) { var base = ls[x] * 2; if (cnt[base + qi] === 3 && cnt[base + oi] === 0) return true; }
        return false;
      }
      function put(c, q) {
        var idx = c * 6 + hgt[c]; b[idx] = q; hgt[c]++;
        var zi = idx * 2 + q - 1; h1 ^= z1[zi]; h2 ^= z2[zi];
        var ls = CW[idx]; for (var x = 0; x < ls.length; x++) cnt[ls[x] * 2 + q - 1]++;
      }
      function take(c, q) {
        hgt[c]--; var idx = c * 6 + hgt[c]; b[idx] = 0;
        var zi = idx * 2 + q - 1; h1 ^= z1[zi]; h2 ^= z2[zi];
        var ls = CW[idx]; for (var x = 0; x < ls.length; x++) cnt[ls[x] * 2 + q - 1]--;
      }
      function evaluate(q) {
        var s = 0, qi = q - 1, oi = 2 - q, x;
        for (x = 0; x < nw; x++) { var a = cnt[x * 2 + qi], o = cnt[x * 2 + oi]; if (a) { if (!o) s += WV[a]; } else if (o) s -= WV[o]; }
        for (x = 18; x < 24; x++) { if (b[x] === q) s += 3; else if (b[x]) s -= 3; }
        return s;
      }
      function negamax(q, depth, alpha, beta, ply, fill) {
        if ((++nodes & 4095) === 0 && now() > deadline) stopped = true;
        if (stopped) return 0;
        var o = 3 - q, x, c, s;
        for (x = 0; x < 7; x++) if (canWin(ORD[x], q)) return WIN - ply - 1;
        if (fill >= 42) return 0;
        var forced = -1, threats = 0;
        for (x = 0; x < 7; x++) { c = ORD[x]; if (canWin(c, o)) { if (++threats > 1) return -(WIN - ply - 2); forced = c; } }
        if (depth <= 0) return evaluate(q);
        var key = hashKey(h1, h2), e = tt.get(key), first = -1, a0 = alpha;
        if (e) {
          first = e.m;
          if (e.d >= depth) {
            if (e.f === 0) return e.v;
            if (e.f === 1) { if (e.v > alpha) alpha = e.v; } else if (e.v < beta) beta = e.v;
            if (alpha >= beta) return e.v;
          }
        }
        var best = -Infinity, bestM = -1;
        if (forced >= 0) {
          put(forced, q); s = fill + 1 >= 42 ? 0 : -negamax(o, depth - 1, -beta, -alpha, ply + 1, fill + 1); take(forced, q);
          best = s; bestM = forced;
        } else {
          if (first >= 0 && hgt[first] < 6) {
            put(first, q); s = fill + 1 >= 42 ? 0 : -negamax(o, depth - 1, -beta, -alpha, ply + 1, fill + 1); take(first, q);
            if (stopped) return 0;
            best = s; bestM = first; if (s > alpha) alpha = s;
          }
          for (x = 0; x < 7 && alpha < beta; x++) {
            c = ORD[x];
            if (c === first || hgt[c] >= 6) continue;
            put(c, q); s = fill + 1 >= 42 ? 0 : -negamax(o, depth - 1, -beta, -alpha, ply + 1, fill + 1); take(c, q);
            if (stopped) return 0;
            if (s > best) { best = s; bestM = c; }
            if (s > alpha) alpha = s;
          }
        }
        if (stopped) return 0;
        tt.set(key, { v: best, d: depth, m: bestM, f: best <= a0 ? 2 : best >= beta ? 1 : 0 });
        return best;
      }

      var cols = [];
      for (i = 0; i < 7; i++) if (hgt[ORD[i]] < 6) cols.push(ORD[i]);
      if (!cols.length) return { move: -1, ties: [], depth: 0, nodes: 0 };
      for (i = 0; i < cols.length; i++) if (canWin(cols[i], p)) return { move: cols[i], ties: [cols[i]], depth: 1, nodes: 0, score: WIN - 1 };
      var opp = 3 - p, blocks = cols.filter(function (c) { return canWin(c, opp); });
      if (blocks.length) return { move: blocks[0], ties: blocks, depth: 1, nodes: 0, forced: true };
      var maxD = Math.min(opts.maxDepth || 4, 42 - filled), best = null, depthDone = 0, prev = -1;
      for (var d = 1; d <= maxD; d++) {
        var list = prev >= 0 ? [prev].concat(cols.filter(function (c) { return c !== prev; })) : cols;
        var bs = -Infinity, ties = [];
        for (i = 0; i < list.length; i++) {
          var c = list[i];
          put(c, p);
          var s = filled + 1 >= 42 ? 0 : -negamax(opp, d - 1, -Infinity, bs === -Infinity ? Infinity : 1 - bs, 1, filled + 1);
          take(c, p);
          if (stopped) break;
          if (s > bs) { bs = s; ties = [c]; } else if (s === bs) ties.push(c);
        }
        if (stopped) break;
        best = { ties: ties, score: bs }; depthDone = d; prev = ties[0];
        if (bs >= NEAR || bs <= -NEAR) break;
      }
      if (!best) {
        var sc = cols.map(function (c) { put(c, p); var val = -evaluate(opp); take(c, p); return val; });
        best = { ties: topMoves(cols, sc), score: 0 };
      }
      return { ties: best.ties, score: best.score, depth: depthDone, nodes: nodes };
    }

    /* Easy: takes most wins, blocks half the time, else a random column (the middle more often).
       Medium: looks 4 moves ahead. Hard: keeps looking deeper until its time is up. */
    function c4Move(board, p, level, rng, timeMs) {
      var cols = [], c;
      for (c = 0; c < 7; c++) if (c4Row(board, c) >= 0) cols.push(c);
      if (!cols.length) return { move: -1 };
      if (level === 'easy') {
        var wn = cols.filter(function (x) { return c4WouldWin(board, x, p); });
        var bl = cols.filter(function (x) { return c4WouldWin(board, x, 3 - p); });
        if (wn.length && rng() < 0.85) return { move: pick(wn, rng) };
        if (bl.length && rng() < 0.5) return { move: pick(bl, rng) };
        return { move: weighted(cols, cols.map(function (x) { return [1, 2, 3, 4, 3, 2, 1][x]; }), rng) };
      }
      var res = c4Search(board, p, level === 'hard' ? { maxDepth: 42, timeMs: timeMs || 900 } : { maxDepth: 4 });
      return { move: res.move >= 0 && res.move !== undefined ? res.move : pick(res.ties, rng), depth: res.depth, nodes: res.nodes, score: res.score };
    }

    /* ================================================================ Dots and Boxes: R × C boxes
       lines: horizontal first (r = 0..R, c = 0..C-1 → r*C + c), then vertical (r = 0..R-1, c = 0..C → H + r*(C+1) + c).
       lines[l] = 0 (not drawn) or the player who drew it; boxes[b] = 0 or the owner (b = r*C + c). */
    var dotsCache = {};
    function dotsGeom(R, C) {
      var key = R + 'x' + C;
      if (dotsCache[key]) return dotsCache[key];
      var H = (R + 1) * C, V = R * (C + 1), lineBoxes = [], boxLines = [], r, c;
      for (r = 0; r <= R; r++) for (c = 0; c < C; c++) {
        var bx = [];
        if (r > 0) bx.push((r - 1) * C + c);
        if (r < R) bx.push(r * C + c);
        lineBoxes.push(bx);
      }
      for (r = 0; r < R; r++) for (c = 0; c <= C; c++) {
        bx = [];
        if (c > 0) bx.push(r * C + c - 1);
        if (c < C) bx.push(r * C + c);
        lineBoxes.push(bx);
      }
      for (r = 0; r < R; r++) for (c = 0; c < C; c++) boxLines.push([r * C + c, (r + 1) * C + c, H + r * (C + 1) + c, H + r * (C + 1) + c + 1]);
      return (dotsCache[key] = { R: R, C: C, H: H, V: V, L: H + V, B: R * C, lineBoxes: lineBoxes, boxLines: boxLines });
    }
    /* Draw line l for player p (mutates lines/boxes). Returns the boxes it completed (0, 1 or 2). */
    function dotsPlay(g, lines, boxes, l, p) {
      lines[l] = p;
      var done = [], bx = g.lineBoxes[l];
      for (var i = 0; i < bx.length; i++) {
        var b = bx[i], bl = g.boxLines[b];
        if (!boxes[b] && lines[bl[0]] && lines[bl[1]] && lines[bl[2]] && lines[bl[3]]) { boxes[b] = p; done.push(b); }
      }
      return done;
    }

    function dotsMove(R, C, lines, boxes, p, level, rng) {
      var g = dotsGeom(R, C), L = g.L, B = g.B, l, b, x;
      var ln = new Uint8Array(L), sides = new Int8Array(B), free = [];
      for (l = 0; l < L; l++) { ln[l] = lines[l] ? 1 : 0; if (!ln[l]) free.push(l); }
      if (!free.length) return -1;
      for (b = 0; b < B; b++) { var bl = g.boxLines[b]; sides[b] = ln[bl[0]] + ln[bl[1]] + ln[bl[2]] + ln[bl[3]]; }
      function missing(bb, arr) { var q = g.boxLines[bb]; for (var y = 0; y < 4; y++) if (!arr[q[y]]) return q[y]; return -1; }
      function draw(arr, sd, li) { arr[li] = 1; var q = g.lineBoxes[li]; for (var y = 0; y < q.length; y++) sd[q[y]]++; }
      function safe(li, sd) { var q = g.lineBoxes[li]; for (var y = 0; y < q.length; y++) if (sd[q[y]] >= 2) return false; return true; }
      function greedy(arr, sd) {          /* the player to move takes every box on offer; returns how many (mutates) */
        var total = 0, again = true;
        while (again) {
          again = false;
          for (var bb = 0; bb < B; bb++) {
            if (sd[bb] !== 3) continue;
            var m = missing(bb, arr), q = g.lineBoxes[m];
            draw(arr, sd, m);
            for (var y = 0; y < q.length; y++) if (sd[q[y]] === 4) total++;
            again = true;
          }
        }
        return total;
      }
      function gift(li) { var a = Uint8Array.from(ln), s = Int8Array.from(sides); draw(a, s, li); return greedy(a, s); }
      function threeMade(li) { var q = g.lineBoxes[li], n = 0; for (var y = 0; y < q.length; y++) if (sides[q[y]] === 2) n++; return n; }
      /* Hard, near the end: leave the last 2 boxes of a chain ("double-dealing") so the other player must open the next long chain */
      function doubleDeal() {
        var a = Uint8Array.from(ln), s = Int8Array.from(sides), y;
        greedy(a, s);
        var rest = 0;
        for (y = 0; y < B; y++) if (s[y] < 4) rest++;
        if (!rest) return -1;
        for (y = 0; y < L; y++) if (!a[y] && safe(y, s)) return -1;
        var longLeft = false;
        for (y = 0; y < L && !longLeft; y++) {
          if (a[y]) continue;
          var a2 = Uint8Array.from(a), s2 = Int8Array.from(s);
          draw(a2, s2, y);
          if (greedy(a2, s2) >= 3) longLeft = true;
        }
        if (!longLeft) return -1;
        for (var A = 0; A < B; A++) {
          if (sides[A] !== 3) continue;
          var m = missing(A, ln), q = g.lineBoxes[m], Bb = -1;
          for (y = 0; y < q.length; y++) if (q[y] !== A) Bb = q[y];
          if (Bb < 0 || sides[Bb] !== 2) continue;
          var bl2 = g.boxLines[Bb], far = -1;
          for (y = 0; y < 4; y++) if (!ln[bl2[y]] && bl2[y] !== m) far = bl2[y];
          if (far < 0) continue;
          var a3 = Uint8Array.from(ln), s3 = Int8Array.from(sides), qq = g.lineBoxes[far], closes = false;
          draw(a3, s3, far);
          for (y = 0; y < qq.length; y++) if (s3[qq[y]] === 4) closes = true;
          if (closes) continue;
          if (greedy(a3, s3) === 2) return far;
        }
        return -1;
      }

      var capt = [];
      for (b = 0; b < B; b++) if (sides[b] === 3) capt.push(b);
      if (level === 'easy') {
        if (capt.length && rng() < 0.5) return missing(pick(capt, rng), ln);
        return pick(free, rng);
      }
      if (capt.length) {
        if (level === 'hard') { var dd = doubleDeal(); if (dd >= 0) return dd; }
        return missing(pick(capt, rng), ln);
      }
      var safeL = free.filter(function (li) { return safe(li, sides); });
      if (safeL.length) return pick(safeL, rng);
      var bestKey = Infinity, cands = [];
      for (x = 0; x < free.length; x++) {
        var k2 = gift(free[x]) * 10 - (level === 'hard' ? threeMade(free[x]) : 0);
        if (k2 < bestKey) { bestKey = k2; cands = [free[x]]; } else if (k2 === bestKey) cands.push(free[x]);
      }
      return pick(cands, rng);
    }

    /* ================================================================ Bulls and Cows
       numbers are strings of different digits, e.g. "0427"; bull = right digit, right place; cow = right digit, wrong place */
    var bcCache = {};
    function bcAll(len, zero) {
      var key = len + (zero ? 'z' : 'n');
      if (bcCache[key]) return bcCache[key];
      var out = [];
      (function rec(pre, used) {
        if (pre.length === len) { out.push(pre); return; }
        for (var d = 0; d < 10; d++) {
          if (used & (1 << d)) continue;
          if (d === 0 && !pre.length && !zero) continue;
          rec(pre + d, used | (1 << d));
        }
      })('', 0);
      return (bcCache[key] = out);
    }
    function bcScore(secret, guess) {
      var b = 0, c = 0;
      for (var i = 0; i < guess.length; i++) {
        var ch = guess.charAt(i);
        if (secret.charAt(i) === ch) b++; else if (secret.indexOf(ch) >= 0) c++;
      }
      return { b: b, c: c };
    }
    /* '' when ok, else 'len' | 'digits' | 'repeat' | 'zero' */
    function bcCheck(s, len, zero) {
      s = String(s || '');
      if (/[^0-9]/.test(s)) return 'digits';
      if (s.length !== len) return 'len';
      for (var i = 0; i < s.length; i++) if (s.indexOf(s.charAt(i)) !== i) return 'repeat';
      if (!zero && s.charAt(0) === '0') return 'zero';
      return '';
    }
    function bcFits(x, hist) {
      for (var i = 0; i < hist.length; i++) { var r = bcScore(x, hist[i].g); if (r.b !== hist[i].b || r.c !== hist[i].c) return false; }
      return true;
    }
    function bcCands(len, zero, hist) { return bcAll(len, zero).filter(function (x) { return bcFits(x, hist); }); }
    /* Easy remembers only the last 2 clues, Medium guesses any number that fits every clue,
       Hard picks the guess that splits the remaining numbers into the smallest groups. */
    function bcGuess(len, zero, hist, level, rng) {
      var all = bcAll(len, zero), tried = {}, i;
      for (i = 0; i < hist.length; i++) tried[hist[i].g] = 1;
      var fresh = function (x) { return !tried[x]; };
      if (level === 'easy') {
        var recent = hist.slice(-2), pool = all.filter(function (x) { return fresh(x) && bcFits(x, recent); });
        if (!pool.length) pool = all.filter(fresh);
        return pool.length ? pick(pool, rng) : all[0];
      }
      var cands = bcCands(len, zero, hist).filter(fresh);
      if (!cands.length) { var rest = all.filter(fresh); return rest.length ? pick(rest, rng) : all[0]; }
      if (level !== 'hard' || cands.length <= 2 || !hist.length) return pick(cands, rng);
      var G = cands;
      if (G.length > 400) { G = []; for (i = 0; i < 400; i++) G.push(pick(cands, rng)); }
      var best = Infinity, list = [], counts = new Int32Array(64);
      for (i = 0; i < G.length; i++) {
        counts.fill(0);
        for (var j = 0; j < cands.length; j++) { var r = bcScore(cands[j], G[i]); counts[r.b * 8 + r.c]++; }
        var m = 0;
        for (j = 0; j < 64; j++) m += counts[j] * counts[j];
        if (m < best) { best = m; list = [G[i]]; } else if (m === best && list.indexOf(G[i]) < 0) list.push(G[i]);
      }
      return pick(list, rng);
    }

    /* ---------------------------------------------------------------- one entry point for the worker */
    function ai(req) {
      var rng = rngFrom(req.seed);
      if (req.game === 'ttt') return req.rate ? tttRate(req.board, req.n, req.k, req.p, req.timeMs) : tttMove(req.board, req.n, req.k, req.p, req.level, rng, req.timeMs);
      if (req.game === 'c4') return c4Move(req.board, req.p, req.level, rng, req.timeMs);
      if (req.game === 'dots') return { move: dotsMove(req.R, req.C, req.lines, req.boxes, req.p, req.level, rng) };
      if (req.game === 'bulls') return { guess: bcGuess(req.len, req.zero, req.hist, req.level, rng) };
      return null;
    }

    return {
      WIN: WIN, NEAR: NEAR, rngFrom: rngFrom, ai: ai,
      ttt: { geom: tttGeom, status: tttStatus, exact: tttExact, search: tttSearch, move: tttMove, rate: tttRate },
      c4: { geom: C4G, row: c4Row, status: c4Status, wouldWin: c4WouldWin, search: c4Search, move: c4Move },
      dots: { geom: dotsGeom, play: dotsPlay, move: dotsMove },
      bc: { all: bcAll, score: bcScore, check: bcCheck, fits: bcFits, cands: bcCands, guess: bcGuess }
    };
  }

  root.PPG = PPG_FACTORY();
  root.PPG_SOURCE = '(' + PPG_FACTORY.toString() + ')()';
})(typeof window !== 'undefined' ? window : this);
