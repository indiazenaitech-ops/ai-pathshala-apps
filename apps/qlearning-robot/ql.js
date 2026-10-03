/* Q-learning engine for "Robot Learns by Reward": pure logic, no DOM, no strings.
   Grid world 7 x 7. States = cells (0..48, row-major). Actions: 0 up, 1 right, 2 down, 3 left.
   Rewards: entering a treasure = +10 (episode ends), entering a pit = -10 (episode ends),
   any other move (also bumping into a wall or the edge) = -stepCost. */
(function () {
  'use strict';
  var N = 7, NS = N * N, A = 4;
  var DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1];
  var EMPTY = 0, WALL = 1, PIT = 2, GOAL = 3;
  var GOAL_R = 10, PIT_R = -10;
  var CH = { '.': EMPTY, 'S': EMPTY, '#': WALL, 'P': PIT, 'G': GOAL };

  /* Ready-made worlds. S = robot start, G = treasure, P = pit, # = wall. */
  var PRESETS = {
    simple: ['......G',
             '.##.P..',
             '....P..',
             '.#.....',
             '.#.P##.',
             '.......',
             'S...P..'],
    maze:   ['...#..G',
             '.#.#.#.',
             '.#...#.',
             '.###.#.',
             '...#...',
             '##.###.',
             'S....P.'],
    cliff:  ['.......',
             '.......',
             '.......',
             '.......',
             '.......',
             '.......',
             'SPPPPPG'],
    empty:  ['......G',
             '.......',
             '.......',
             '.......',
             '.......',
             '.......',
             'S......']
  };

  function parse(rows) {
    var grid = new Uint8Array(NS), start = NS - N;
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      var ch = (rows[r] || '')[c] || '.';
      grid[r * N + c] = CH[ch] === undefined ? EMPTY : CH[ch];
      if (ch === 'S') start = r * N + c;
    }
    grid[start] = EMPTY;
    return { grid: grid, start: start };
  }
  function encode(grid) { var s = ''; for (var i = 0; i < NS; i++) s += '.#PG'[grid[i]] || '.'; return s; }
  function decode(str) {
    if (typeof str !== 'string' || str.length !== NS) return null;
    var g = new Uint8Array(NS);
    for (var i = 0; i < NS; i++) { var k = '.#PG'.indexOf(str[i]); if (k < 0) return null; g[i] = k; }
    return g;
  }

  function move(grid, s, a) {
    var r = ((s / N) | 0) + DR[a], c = (s % N) + DC[a];
    if (r < 0 || r >= N || c < 0 || c >= N) return { s2: s, bump: true };
    var s2 = r * N + c;
    if (grid[s2] === WALL) return { s2: s, bump: true };
    return { s2: s2, bump: false };
  }
  function isEnd(grid, s) { return grid[s] === PIT || grid[s] === GOAL; }
  function maxQ(Q, s) { var b = s * A, m = Q[b]; for (var a = 1; a < A; a++) if (Q[b + a] > m) m = Q[b + a]; return m; }
  function bestActions(Q, s) {
    var m = maxQ(Q, s), out = [];
    for (var a = 0; a < A; a++) if (Q[s * A + a] >= m - 1e-9) out.push(a);
    return out;
  }
  function greedy(Q, s, rnd) { var b = bestActions(Q, s); return b.length === 1 ? b[0] : b[Math.floor(rnd() * b.length) % b.length]; }
  function choose(Q, s, eps, rnd) {
    if (eps > 0 && rnd() < eps) return { a: Math.floor(rnd() * A) % A, explore: true };
    return { a: greedy(Q, s, rnd), explore: false };
  }
  function rewardFor(grid, s2, cost) {
    var t = grid[s2];
    if (t === GOAL) return { r: GOAL_R, done: true, outcome: 'goal' };
    if (t === PIT) return { r: PIT_R, done: true, outcome: 'pit' };
    return { r: cost > 0 ? -cost : 0, done: false, outcome: null };
  }

  /* One Q-learning step from state s. W = { grid, Q, alpha, gamma, eps, cost }.
     Q(s,a) <- Q(s,a) + alpha * (r + gamma * max_a' Q(s',a') - Q(s,a)), future part = 0 at the end. */
  function learnStep(W, s, rnd) {
    var ch = choose(W.Q, s, W.eps, rnd), a = ch.a;
    var m = move(W.grid, s, a), rw = rewardFor(W.grid, m.s2, W.cost);
    var k = s * A + a, old = W.Q[k], future = rw.done ? 0 : maxQ(W.Q, m.s2);
    var nq = old + W.alpha * (rw.r + W.gamma * future - old);
    if (Math.abs(nq) < 1e-12) nq = 0;
    W.Q[k] = nq;
    return { s: s, a: a, s2: m.s2, r: rw.r, old: old, future: future, newQ: nq, explore: ch.explore, bump: m.bump, done: rw.done, outcome: rw.outcome };
  }

  /* A whole episode without drawing. Returns { total, steps, outcome: goal | pit | timeout }. */
  function episode(W, start, maxSteps, rnd) {
    var s = start, total = 0, steps = 0, info;
    while (steps < maxSteps) {
      info = learnStep(W, s, rnd);
      total += info.r; steps++; s = info.s2;
      if (info.done) return { total: total, steps: steps, outcome: info.outcome };
    }
    return { total: total, steps: steps, outcome: 'timeout' };
  }

  /* Follow the learned (greedy) policy, no learning. Returns the path and how it ended. */
  function playPath(grid, Q, start, maxSteps, rnd) {
    var s = start, path = [s], acts = [], visits = {}, steps = 0;
    visits[s] = 1;
    while (steps < maxSteps) {
      var a = greedy(Q, s, rnd), s2 = move(grid, s, a).s2;
      steps++; path.push(s2); acts.push(a); s = s2;
      if (grid[s] === GOAL) return { path: path, acts: acts, steps: steps, outcome: 'goal' };
      if (grid[s] === PIT) return { path: path, acts: acts, steps: steps, outcome: 'pit' };
      visits[s] = (visits[s] || 0) + 1;
      if (visits[s] > 3) return { path: path, acts: acts, steps: steps, outcome: 'lost' };
    }
    return { path: path, acts: acts, steps: steps, outcome: 'lost' };
  }

  /* Fewest moves from start to any treasure, avoiding walls and pits (-1 = cannot reach). */
  function shortest(grid, start) {
    if (grid[start] === GOAL) return 0;
    var dist = new Int16Array(NS).fill(-1), q = [start], h = 0;
    dist[start] = 0;
    while (h < q.length) {
      var s = q[h++];
      for (var a = 0; a < A; a++) {
        var s2 = move(grid, s, a).s2;
        if (dist[s2] >= 0 || grid[s2] === PIT) continue;
        dist[s2] = dist[s] + 1;
        if (grid[s2] === GOAL) return dist[s2];
        q.push(s2);
      }
    }
    return -1;
  }
  /* Best possible total (undiscounted) reward of one episode: +10 at the end, -cost for the other moves. */
  function bestTotal(grid, start, cost) {
    var d = shortest(grid, start);
    return d < 0 ? null : GOAL_R - (cost > 0 ? cost : 0) * (d - 1);
  }

  window.QL = {
    N: N, NS: NS, A: A, DR: DR, DC: DC, EMPTY: EMPTY, WALL: WALL, PIT: PIT, GOAL: GOAL, GOAL_R: GOAL_R, PIT_R: PIT_R,
    PRESETS: PRESETS, parse: parse, encode: encode, decode: decode,
    move: move, isEnd: isEnd, maxQ: maxQ, bestActions: bestActions, greedy: greedy, choose: choose,
    learnStep: learnStep, episode: episode, playPath: playPath, shortest: shortest, bestTotal: bestTotal
  };
})();
