/* Maze Solver (Search): BFS, DFS, Dijkstra, Greedy best-first and A* on a grid you draw.
   Moves are up / right / down / left. Entering a normal cell costs 1, entering mud costs 5. */
(function () {
  'use strict';
  var SLUG = 'pathfinding-visualizer';
  var store = EDU.store(SLUG);
  var ALGS = ['bfs', 'dfs', 'dij', 'greedy', 'astar'];
  /* [shortest path when there is no mud, cheapest path with mud] */
  var GUAR = { bfs: [1, 0], dfs: [0, 0], dij: [1, 1], greedy: [0, 0], astar: [1, 1] };
  var ACOL = { bfs: '--c7', dfs: '--c3', dij: '--c4', greedy: '--c6', astar: '--c2' };
  var MUD_COST = 5, EMPTY = 0, WALL = 1, MUD = 2;
  /* [cells explored per second, path cells per second] */
  var SPEEDS = { slow: [5, 8], normal: [28, 24], fast: [170, 80], instant: null };
  var SIZES = { s: 40, m: 28, l: 20 };

  function oneOf(v, list, d) { return list.indexOf(v) >= 0 ? v : d; }

  EDU.init({ slug: SLUG, title: 'app_title' });

  var $ = EDU.$, $$ = EDU.$$, t = EDU.t, fmt = EDU.fmt;
  var S = {
    alg: oneOf(store.get('alg', 'bfs'), ALGS, 'bfs'),
    speed: oneOf(store.get('speed', 'normal'), Object.keys(SPEEDS), 'normal'),
    size: oneOf(store.get('size', 'm'), ['s', 'm', 'l'], 'm'),
    tool: oneOf(store.get('tool', 'wall'), ['wall', 'mud', 'erase'], 'wall'),
    nums: store.get('nums', false) === true,
    loops: store.get('loops', true) !== false
  };
  function saveSettings() { ['alg', 'speed', 'size', 'tool', 'nums', 'loops'].forEach(function (k) { store.set(k, S[k]); }); }

  var canvas = $('#board'), ctx = canvas.getContext('2d');
  var G = null;            // grid { cols, rows, cells: Uint8Array, start, goal }
  var R = null;            // result of the current search (with recorded events)
  var V = null;            // what is shown of that search so far
  var CMP = null;          // compare-all results
  var mode = 'idle';       // idle | run | paused | done
  var raf = 0, lastT = 0, acc = 0;
  var msgFn = null;        // rebuilds the message text (so it can be re-translated)
  var cursor = -1, focused = false, drag = null;
  var pal = null, dpr = 1, lastWrapW = 0;

  /* ================================================================ grid */
  function blank(cols, rows) {
    return { cols: cols, rows: rows, cells: new Uint8Array(cols * rows), start: 0, goal: cols * rows - 1 };
  }
  function ix(r, c) { return r * G.cols + c; }
  function rowOf(i) { return Math.floor(i / G.cols); }
  function colOf(i) { return i % G.cols; }
  function odd(n) { return n % 2 ? n : n - 1; }

  function dimsFor(size) {
    var wrap = $('#board-wrap');
    var W = wrap.clientWidth || Math.min(window.innerWidth - 56, 760);
    var vh = window.innerHeight || 700;
    var cell = SIZES[size] || 28;
    var H = Math.min(vh * 0.58, W * (W < 600 ? 1.25 : 0.66));
    return { cols: odd(EDU.clamp(Math.floor(W / cell), 9, 61)), rows: odd(EDU.clamp(Math.floor(H / cell), 7, 41)) };
  }

  /* Starting board: a wall with two gaps. The straight gap is full of mud, the other one is a clean detour,
     so BFS (fewest steps) and Dijkstra / A* (cheapest) choose different paths. */
  function demoGrid(d) {
    var g = blank(d.cols, d.rows), cols = d.cols, rows = d.rows;
    var sr = Math.floor(rows / 2), sc = cols >= 15 ? 2 : 1, gc = cols - 1 - sc, mid = Math.floor(cols / 2);
    var gapTop = Math.max(0, sr - 4);
    g.start = sr * cols + sc; g.goal = sr * cols + gc;
    for (var r = 0; r < rows; r++) if (r !== gapTop && r !== sr) g.cells[r * cols + mid] = WALL;
    for (r = sr - 2; r <= sr + 2; r++) {
      for (var c = mid - 2; c <= mid + 2; c++) {
        if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
        var i = r * cols + c;
        if (g.cells[i] !== WALL && i !== g.start && i !== g.goal) g.cells[i] = MUD;
      }
    }
    return g;
  }

  function loadGrid() {
    var g = store.get('grid', null);
    if (!g || typeof g !== 'object') return null;
    var cols = g.cols | 0, rows = g.rows | 0, n = cols * rows;
    if (cols < 5 || rows < 5 || cols > 81 || rows > 61 || typeof g.cells !== 'string' || g.cells.length !== n) return null;
    var start = g.start | 0, goal = g.goal | 0;
    if (start < 0 || start >= n || goal < 0 || goal >= n || start === goal) return null;
    var out = blank(cols, rows);
    for (var i = 0; i < n; i++) { var v = g.cells.charCodeAt(i) - 48; out.cells[i] = (v === WALL || v === MUD) ? v : EMPTY; }
    out.start = start; out.goal = goal;
    if (out.cells[start] === WALL) out.cells[start] = EMPTY;
    if (out.cells[goal] === WALL) out.cells[goal] = EMPTY;
    return out;
  }
  function saveGrid() {
    var s = '';
    for (var i = 0; i < G.cells.length; i++) s += G.cells[i];
    store.set('grid', { cols: G.cols, rows: G.rows, cells: s, start: G.start, goal: G.goal });
  }

  /* ================================================================ search */
  function Heap() { this.a = []; }
  function less(x, y) { return x.k1 < y.k1 || (x.k1 === y.k1 && (x.k2 < y.k2 || (x.k2 === y.k2 && x.s < y.s))); }
  Heap.prototype.push = function (x) {
    var a = this.a, i = a.length; a.push(x);
    while (i > 0) { var p = (i - 1) >> 1; if (!less(a[i], a[p])) break; var tmp = a[i]; a[i] = a[p]; a[p] = tmp; i = p; }
  };
  Heap.prototype.pop = function () {
    var a = this.a, top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last; var i = 0, n = a.length;
      for (;;) {
        var l = 2 * i + 1, r = l + 1, m = i;
        if (l < n && less(a[l], a[m])) m = l;
        if (r < n && less(a[r], a[m])) m = r;
        if (m === i) break;
        var tmp = a[i]; a[i] = a[m]; a[m] = tmp; i = m;
      }
    }
    return top;
  };

  /* Runs one algorithm on grid g. With rec = true it records every expansion so it can be replayed:
     events[k] = { c: cell taken out, v: its number, a: [cell, number, ...] newly added, u: [...] improved } */
  function search(alg, g, rec) {
    var cols = g.cols, rows = g.rows, N = cols * rows, cells = g.cells, start = g.start, goal = g.goal;
    var parent = new Int32Array(N).fill(-1), closed = new Uint8Array(N), seen = new Uint8Array(N);
    var events = rec ? [] : null, explored = 0, open = 1, maxOpen = 1, found = false;
    var gr = Math.floor(goal / cols), gcol = goal % cols;
    var nb = [0, 0, 0, 0], nbN = 0, k, v, u, ev;
    function h(i) { return Math.abs(Math.floor(i / cols) - gr) + Math.abs(i % cols - gcol); }
    function cost(i) { return cells[i] === MUD ? MUD_COST : 1; }
    function nbrs(i) {                       // order: up, right, down, left
      var r = Math.floor(i / cols), c = i - r * cols; nbN = 0;
      if (r > 0 && cells[i - cols] !== WALL) nb[nbN++] = i - cols;
      if (c < cols - 1 && cells[i + 1] !== WALL) nb[nbN++] = i + 1;
      if (r < rows - 1 && cells[i + cols] !== WALL) nb[nbN++] = i + cols;
      if (c > 0 && cells[i - 1] !== WALL) nb[nbN++] = i - 1;
    }
    seen[start] = 1;
    var v0 = 0;

    if (alg === 'bfs') {
      var q = new Int32Array(N), head = 0, tail = 0, depth = new Int32Array(N);
      q[tail++] = start;
      while (head < tail) {
        u = q[head++]; closed[u] = 1; explored++; open--;
        ev = rec ? { c: u, v: depth[u], a: [] } : null;
        if (u === goal) { found = true; if (rec) events.push(ev); break; }
        nbrs(u);
        for (k = 0; k < nbN; k++) {
          v = nb[k];
          if (!seen[v]) { seen[v] = 1; parent[v] = u; depth[v] = depth[u] + 1; q[tail++] = v; open++; if (rec) ev.a.push(v, depth[v]); }
        }
        if (open > maxOpen) maxOpen = open;
        if (rec) events.push(ev);
      }
    } else if (alg === 'dfs') {
      var st = [start, -1, 0];
      while (st.length) {
        var d = st.pop(), p = st.pop(); u = st.pop();
        if (closed[u]) continue;
        closed[u] = 1; parent[u] = p; explored++; open--;
        ev = rec ? { c: u, v: d, a: [], u: [] } : null;
        if (u === goal) { found = true; if (rec) events.push(ev); break; }
        nbrs(u);
        for (k = nbN - 1; k >= 0; k--) {          // pushed in reverse, so "up" is tried first
          v = nb[k];
          if (closed[v]) continue;
          st.push(v, u, d + 1);
          if (!seen[v]) { seen[v] = 1; open++; if (rec) ev.a.push(v, d + 1); }
          else if (rec) ev.u.push(v, d + 1);
        }
        if (open > maxOpen) maxOpen = open;
        if (rec) events.push(ev);
      }
    } else {
      var gs = new Float64Array(N).fill(Infinity), heap = new Heap(), seq = 0;
      var key = function (i) {
        if (alg === 'dij') return { i: i, g: gs[i], k1: gs[i], k2: 0, s: seq++ };
        if (alg === 'greedy') return { i: i, g: gs[i], k1: h(i), k2: 0, s: seq++ };
        return { i: i, g: gs[i], k1: gs[i] + h(i), k2: h(i), s: seq++ };     // A*: ties go to the cell nearer the goal
      };
      var val = function (i) { return alg === 'dij' ? gs[i] : alg === 'greedy' ? h(i) : gs[i] + h(i); };
      gs[start] = 0; heap.push(key(start)); v0 = val(start);
      while (heap.a.length) {
        var e = heap.pop(); u = e.i;
        if (closed[u] || e.g !== gs[u]) continue;           // an old, out-of-date copy
        closed[u] = 1; explored++; open--;
        ev = rec ? { c: u, v: val(u), a: [], u: [] } : null;
        if (u === goal) { found = true; if (rec) events.push(ev); break; }
        nbrs(u);
        for (k = 0; k < nbN; k++) {
          v = nb[k];
          if (closed[v]) continue;
          var ng = gs[u] + cost(v);
          if (alg === 'greedy') {
            if (!seen[v]) { seen[v] = 1; gs[v] = ng; parent[v] = u; open++; heap.push(key(v)); if (rec) ev.a.push(v, val(v)); }
          } else if (ng < gs[v]) {
            var isNew = !seen[v];
            seen[v] = 1; gs[v] = ng; parent[v] = u; heap.push(key(v));
            if (isNew) { open++; if (rec) ev.a.push(v, val(v)); } else if (rec) ev.u.push(v, val(v));
          }
        }
        if (open > maxOpen) maxOpen = open;
        if (rec) events.push(ev);
      }
    }

    var path = [], pcost = 0;
    if (found) {
      for (var x = goal; x !== -1; x = parent[x]) { path.push(x); if (x === start) break; }
      path.reverse();
      for (k = 1; k < path.length; k++) pcost += cost(path[k]);
    }
    return { alg: alg, events: events, explored: explored, maxOpen: maxOpen, found: found, path: path,
      steps: found ? path.length - 1 : null, cost: found ? pcost : null, v0: v0 };
  }

  function now() { return window.performance && performance.now ? performance.now() : Date.now(); }
  /* average time of one run (repeats until the budget is used, so tiny times are still measurable) */
  function timeIt(alg, budget) {
    var n = 0, t0 = now(), t1;
    do { search(alg, G, false); n++; t1 = now(); } while (t1 - t0 < budget && n < 400);
    return (t1 - t0) / n;
  }
  function bestCost() { var d = search('dij', G, false); return d.found ? d.cost : null; }

  /* ================================================================ replay */
  function newView(res) {
    var N = G.cols * G.rows;
    var v = { st: new Uint8Array(N), num: new Float64Array(N).fill(NaN), evi: 0, pathN: 0, open: 1, explored: 0, cur: -1, last: null };
    v.st[G.start] = 1; v.num[G.start] = res.v0;
    return v;
  }
  function applyEvent(ev) {
    if (V.st[ev.c] === 1) V.open--;
    V.st[ev.c] = 2; V.num[ev.c] = ev.v; V.cur = ev.c; V.explored++;
    for (var k = 0; k < ev.a.length; k += 2) { var c = ev.a[k]; if (V.st[c] === 0) { V.st[c] = 1; V.open++; } V.num[c] = ev.a[k + 1]; }
    if (ev.u) for (k = 0; k < ev.u.length; k += 2) if (V.st[ev.u[k]] !== 2) V.num[ev.u[k]] = ev.u[k + 1];
    V.evi++; V.last = ev;
  }

  function stopLoop() { if (raf) cancelAnimationFrame(raf); raf = 0; lastT = 0; acc = 0; }
  function startSearch(budget) {
    stopLoop();
    R = search(S.alg, G, true);
    R.time = timeIt(S.alg, budget == null ? 6 : budget);
    R.best = (S.alg === 'dij' || S.alg === 'astar') ? R.cost : bestCost();
    V = newView(R);
  }
  function finishAll() {
    while (V.evi < R.events.length) applyEvent(R.events[V.evi]);
    V.pathN = R.found ? R.path.length : 0; V.cur = -1;
  }
  function clearSearch() { stopLoop(); R = null; V = null; mode = 'idle'; }

  function loop(ts) {
    raf = 0;
    if (mode !== 'run' || !R) return;
    var sp = SPEEDS[S.speed];
    if (!sp) { done(); return; }
    var dt = lastT ? Math.min(100, ts - lastT) : 16; lastT = ts;
    var n;
    if (V.evi < R.events.length) {
      acc += dt * sp[0] / 1000; n = Math.floor(acc); acc -= n;
      while (n-- > 0 && V.evi < R.events.length) applyEvent(R.events[V.evi]);
    } else if (R.found && V.pathN < R.path.length) {
      V.cur = -1;
      acc += dt * sp[1] / 1000; n = Math.floor(acc); acc -= n;
      V.pathN = Math.min(R.path.length, V.pathN + n);
    } else { done(); return; }
    draw(); renderStats();
    raf = requestAnimationFrame(loop);
  }
  function done() {
    stopLoop(); finishAll(); mode = 'done';
    draw(); renderStats(); renderRun(); showFinal();
  }

  function run() {
    if (mode === 'run') { mode = 'paused'; stopLoop(); renderRun(); setMsg(function () { return [t('msg_paused'), '']; }); return; }
    if (mode !== 'paused') startSearch();
    if (!SPEEDS[S.speed]) { done(); return; }
    mode = 'run'; renderRun();
    var res = R;
    setMsg(function () { return [t('msg_running', { alg: t('alg_' + res.alg) }), '']; });
    raf = requestAnimationFrame(loop);
  }
  function step() {
    if (mode === 'idle' || mode === 'done') startSearch();
    stopLoop(); mode = 'paused';
    if (V.evi < R.events.length) {
      applyEvent(R.events[V.evi]);
      if (V.evi === R.events.length && !R.found) { done(); return; }
      var ev = V.last, i = V.evi, k = ev.a.length / 2, r = rowOf(ev.c) + 1, c = colOf(ev.c) + 1, isGoal = ev.c === G.goal;
      setMsg(function () {
        var s = t('msg_step', { i: fmt(i), alg: t('alg_' + R.alg), r: fmt(r), c: fmt(c), k: fmt(k) });
        if (isGoal) s = t('msg_step_goal', { i: fmt(i), alg: t('alg_' + R.alg) });
        return [s, 'step'];
      });
      draw(); renderStats(); renderRun();
    } else { done(); }
  }

  /* ================================================================ messages */
  function setMsg(fn) { msgFn = fn; paintMsg(); }
  function paintMsg() {
    var m = $('#msg');
    if (!msgFn) { m.textContent = ''; m.dataset.kind = ''; return; }
    var out = msgFn(); m.textContent = out[0]; m.dataset.kind = out[1] || '';
  }
  function readyMsg() { setMsg(function () { return [t('msg_ready', { alg: t('alg_' + S.alg) }), '']; }); }
  function showFinal() {
    var res = R;
    setMsg(function () {
      var name = t('alg_' + res.alg);
      if (!res.found) return [t('msg_nopath', { alg: name, n: fmt(res.explored) }), 'bad'];
      var s = t('msg_found', { alg: name, steps: fmt(res.steps), cost: fmt(res.cost), n: fmt(res.explored) });
      var best = res.best != null && res.cost <= res.best;
      s += ' ' + (best ? t('msg_cheapest') : t('msg_not_cheapest', { best: fmt(res.best) }));
      return [s, best ? 'good' : 'warn'];
    });
  }

  /* ================================================================ drawing */
  function palette(forceLight) {
    var dark = !forceLight && EDU.theme() === 'dark';
    var surface = forceLight ? '#ffffff' : (EDU.css('--surface') || (dark ? '#15232a' : '#ffffff'));
    var LIGHT = { bfs: '#1971c2', dfs: '#5f3dc4', dij: '#2b8a3e', greedy: '#b08900', astar: '#e8590c' };
    var col = {};
    ALGS.forEach(function (a) { col[a] = (forceLight ? LIGHT[a] : EDU.css(ACOL[a])) || LIGHT[a]; });
    return {
      dark: dark, empty: surface,
      line: dark ? 'rgba(255,255,255,0.09)' : 'rgba(20,40,50,0.13)',
      wall: dark ? '#7f98a0' : '#26383f',
      mud: dark ? '#6f5034' : '#c99d6e', mudDot: dark ? '#4a331f' : '#8f653d',
      visited: dark ? 'rgba(77,171,247,0.30)' : 'rgba(25,113,194,0.20)',
      frontier: dark ? 'rgba(255,212,59,0.55)' : 'rgba(250,190,20,0.62)',
      pathFill: dark ? 'rgba(255,146,43,0.42)' : 'rgba(255,152,40,0.42)',
      path: dark ? '#ff922b' : '#d9501c',
      cur: dark ? '#f06595' : '#c2255c',
      start: dark ? '#4ade80' : '#15803d', goal: dark ? '#f87171' : '#b42318',
      ink: dark ? '#0e181c' : '#ffffff',
      text: dark ? '#e6eef0' : '#1b2a30',
      cursor: dark ? '#ffd43b' : '#5f3dc4',
      alg: col
    };
  }

  function fitCanvas(force) {
    var wrap = $('#board-wrap'), W = wrap.clientWidth;
    if (!W) return;
    if (!force && W === lastWrapW && canvas.width) return;
    lastWrapW = W;
    var fs = (document.fullscreenElement || document.webkitFullscreenElement) === $('#stage');
    var maxH = fs ? Math.max(200, window.innerHeight - 270) : Math.max(260, window.innerHeight * 0.8);
    var cssW = Math.min(W, maxH * G.cols / G.rows);
    var cssH = cssW * G.rows / G.cols;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px';
    canvas.width = Math.max(1, Math.round(cssW * dpr)); canvas.height = Math.max(1, Math.round(cssH * dpr));
  }

  function mudCell(c, x, y, w, h) {
    c.fillStyle = pal.mud; c.fillRect(x, y, w, h);
    if (w < 10) return;
    c.fillStyle = pal.mudDot; c.beginPath();
    var rr = Math.max(1, w * 0.075);
    [[0.3, 0.32], [0.7, 0.5], [0.36, 0.74]].forEach(function (p) { c.moveTo(x + w * p[0] + rr, y + h * p[1]); c.arc(x + w * p[0], y + h * p[1], rr, 0, Math.PI * 2); });
    c.fill();
  }
  function glyph(c, kind, cx, cy, s) {
    if (kind === 'start') {
      c.fillStyle = pal.start; c.beginPath(); c.arc(cx, cy, s * 0.4, 0, Math.PI * 2); c.fill();
      c.fillStyle = pal.ink; c.beginPath();
      c.moveTo(cx - s * 0.12, cy - s * 0.19); c.lineTo(cx + s * 0.2, cy); c.lineTo(cx - s * 0.12, cy + s * 0.19); c.closePath(); c.fill();
    } else {
      c.fillStyle = pal.goal; c.beginPath(); c.arc(cx, cy, s * 0.42, 0, Math.PI * 2); c.fill();
      c.fillStyle = pal.ink; c.beginPath(); c.arc(cx, cy, s * 0.27, 0, Math.PI * 2); c.fill();
      c.fillStyle = pal.goal; c.beginPath(); c.arc(cx, cy, s * 0.13, 0, Math.PI * 2); c.fill();
    }
  }

  function draw() {
    if (!G || !pal || !canvas.width) return;
    var cols = G.cols, rows = G.rows, W = canvas.width, H = canvas.height;
    var cw = W / cols, ch = H / rows, N = cols * rows, i, r, c, x, y, w, h;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = pal.empty; ctx.fillRect(0, 0, W, H);
    var onPath = null;
    if (V && V.pathN > 0) { onPath = new Uint8Array(N); for (i = 0; i < V.pathN; i++) onPath[R.path[i]] = 1; }
    for (i = 0; i < N; i++) {
      r = Math.floor(i / cols); c = i - r * cols;
      x = Math.round(c * cw); y = Math.round(r * ch); w = Math.round((c + 1) * cw) - x; h = Math.round((r + 1) * ch) - y;
      var cell = G.cells[i];
      if (cell === WALL) { ctx.fillStyle = pal.wall; ctx.fillRect(x, y, w, h); continue; }
      if (cell === MUD) mudCell(ctx, x, y, w, h);
      if (V) {
        if (V.st[i] === 2) { ctx.fillStyle = pal.visited; ctx.fillRect(x, y, w, h); }
        else if (V.st[i] === 1) { ctx.fillStyle = pal.frontier; ctx.fillRect(x, y, w, h); }
      }
      if (onPath && onPath[i]) { ctx.fillStyle = pal.pathFill; ctx.fillRect(x, y, w, h); }
    }
    // grid lines
    if (cw >= 6) {
      ctx.strokeStyle = pal.line; ctx.lineWidth = 1; ctx.beginPath();
      for (c = 1; c < cols; c++) { x = Math.round(c * cw) + 0.5; ctx.moveTo(x, 0); ctx.lineTo(x, H); }
      for (r = 1; r < rows; r++) { y = Math.round(r * ch) + 0.5; ctx.moveTo(0, y); ctx.lineTo(W, y); }
      ctx.stroke();
    }
    var cx = function (k) { return (colOf(k) + 0.5) * cw; }, cy = function (k) { return (rowOf(k) + 0.5) * ch; };
    // path line
    if (V && V.pathN > 1) {
      ctx.strokeStyle = pal.path; ctx.lineWidth = Math.max(2, cw * 0.2); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx(R.path[0]), cy(R.path[0]));
      for (i = 1; i < V.pathN; i++) ctx.lineTo(cx(R.path[i]), cy(R.path[i]));
      ctx.stroke();
    }
    // numbers
    if (S.nums && V && cw / dpr >= 15) {
      var big = R && R.alg !== 'bfs' && R.alg !== 'dfs';
      ctx.fillStyle = pal.text; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (i = 0; i < N; i++) {
        if (!V.st[i] || i === G.start || i === G.goal || isNaN(V.num[i])) continue;
        if (onPath && onPath[i] && V.pathN > 1) continue;
        var txt = String(Math.round(V.num[i]));
        var fsz = Math.min(cw * (txt.length > 2 ? 0.34 : 0.44), ch * 0.5);
        ctx.font = (big ? '700 ' : '600 ') + fsz + 'px "Noto Sans", system-ui, sans-serif';
        ctx.fillText(txt, cx(i), cy(i) + fsz * 0.04);
      }
    }
    // the cell being checked now
    if (V && V.cur >= 0 && mode !== 'done') {
      ctx.strokeStyle = pal.cur; ctx.lineWidth = Math.max(2, cw * 0.14);
      var lw = ctx.lineWidth / 2;
      ctx.strokeRect(colOf(V.cur) * cw + lw, rowOf(V.cur) * ch + lw, cw - 2 * lw, ch - 2 * lw);
    }
    glyph(ctx, 'start', cx(G.start), cy(G.start), Math.min(cw, ch));
    glyph(ctx, 'goal', cx(G.goal), cy(G.goal), Math.min(cw, ch));
    // keyboard cursor
    if (focused && cursor >= 0) {
      ctx.save(); ctx.strokeStyle = pal.cursor; ctx.lineWidth = Math.max(2, cw * 0.1); ctx.setLineDash([Math.max(3, cw * 0.18), Math.max(2, cw * 0.1)]);
      ctx.strokeRect(colOf(cursor) * cw + 2, rowOf(cursor) * ch + 2, cw - 4, ch - 4); ctx.restore();
    }
  }

  function drawLegend() {
    $$('#legend canvas').forEach(function (cv) {
      var c = cv.getContext('2d'), s = cv.width, k = cv.getAttribute('data-sw');
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, s, s);
      c.fillStyle = pal.empty; c.fillRect(0, 0, s, s);
      if (k === 'wall') { c.fillStyle = pal.wall; c.fillRect(0, 0, s, s); }
      else if (k === 'mud') mudCell(c, 0, 0, s, s);
      else if (k === 'frontier') { c.fillStyle = pal.frontier; c.fillRect(0, 0, s, s); }
      else if (k === 'visited') { c.fillStyle = pal.visited; c.fillRect(0, 0, s, s); }
      else if (k === 'current') { c.fillStyle = pal.visited; c.fillRect(0, 0, s, s); c.strokeStyle = pal.cur; c.lineWidth = 6; c.strokeRect(3, 3, s - 6, s - 6); }
      else if (k === 'path') { c.fillStyle = pal.pathFill; c.fillRect(0, 0, s, s); c.strokeStyle = pal.path; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath(); c.moveTo(4, s / 2); c.lineTo(s - 4, s / 2); c.stroke(); }
      else if (k === 'start' || k === 'goal') glyph(c, k, s / 2, s / 2, s);
      c.strokeStyle = pal.line; c.lineWidth = 2; c.strokeRect(1, 1, s - 2, s - 2);
    });
    ALGS.forEach(function (a) {
      $$('#alg-' + a + ' .alg-dot').forEach(function (d) { d.style.background = pal.alg[a]; });
    });
  }

  /* ================================================================ UI render */
  function fmtTime(ms) {
    if (ms == null || !isFinite(ms)) return '–';
    if (ms < 0.001) return '<' + fmt(0.001);
    return fmt(ms, { maximumSignificantDigits: 2 });
  }
  function setStat(sel, val, txt) {      // values are isolated as LTR so "0.03 ms" stays in order in Urdu
    var e = $(sel); e.dataset.value = val == null ? '' : String(val);
    e.textContent = '';
    e.appendChild(EDU.el('bdi', { dir: 'ltr', text: txt != null ? txt : (val == null ? '–' : fmt(val)) }));
  }
  function renderStats() {
    setStat('#st-explored', V ? V.explored : 0);
    setStat('#st-waiting', V ? V.open : 0);
    var fin = V && R && R.found && V.pathN >= R.path.length && mode === 'done';
    setStat('#st-steps', fin ? R.steps : null);
    setStat('#st-cost', fin ? R.cost : null);
    var tm = R ? R.time : null;
    setStat('#st-time', tm == null ? null : +tm.toFixed(4), tm == null ? '–' : t('ms', { n: fmtTime(tm) }));
  }
  function renderRun() {
    var b = $('#run');
    b.dataset.mode = mode;
    $('#run-ico').textContent = mode === 'run' ? '⏸' : '▶';
    $('#run-txt').textContent = mode === 'run' ? t('btn_pause') : mode === 'paused' ? t('btn_resume') : t('run');
  }
  function renderChoices() {
    $$('#algs [data-alg]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.alg === S.alg)); });
    $$('#tools [data-tool]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.tool === S.tool)); });
    $$('#speed [data-speed]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.speed === S.speed)); });
    $$('#size [data-size]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.size === S.size)); });
    $('#nums').checked = S.nums; $('#loops').checked = S.loops;
    var note = $('#nums-note'); note.hidden = !S.nums; note.textContent = t('nums_' + S.alg);
    $('#size-info').textContent = t('size_info', { cols: fmt(G.cols), rows: fmt(G.rows) }) + ' · ' + t('size_tip');
    canvas.setAttribute('aria-label', t('grid_aria', { cols: fmt(G.cols), rows: fmt(G.rows) }));
  }
  function yesNo(ok) {
    return EDU.el('span', { class: ok ? 'yes' : 'no' }, EDU.el('span', { 'aria-hidden': 'true', text: ok ? '✓ ' : '✗ ' }), EDU.el('span', { text: t(ok ? 'yes' : 'no') }));
  }
  function renderInfo() {
    var a = S.alg;
    $('#ai-dot').style.background = pal ? pal.alg[a] : '';
    $('#ai-name-txt').textContent = t('full_' + a);
    $('#ai-idea').textContent = t('idea_' + a);
    $('#ai-pick').textContent = t('pick_' + a);
    $('#ai-used').textContent = t('used_' + a);
    var bx = $('#ai-badges'); bx.innerHTML = '';
    [['g_plain', GUAR[a][0]], ['g_mud', GUAR[a][1]]].forEach(function (p) {
      bx.appendChild(EDU.el('span', { class: 'badge ' + (p[1] ? 'success' : 'danger') }, EDU.el('span', { 'aria-hidden': 'true', text: p[1] ? '✓' : '✗' }), ' ' + t(p[0]) + ': ' + t(p[1] ? 'yes' : 'no')));
    });
  }
  function algCell(a) {
    return EDU.el('span', { class: 'aname' }, EDU.el('span', { class: 'alg-dot', 'aria-hidden': 'true', style: { background: pal ? pal.alg[a] : '' } }), t('alg_' + a));
  }
  function renderGlance() {
    var body = $('#glance-body'); body.innerHTML = '';
    ALGS.forEach(function (a) {
      body.appendChild(EDU.el('tr', {}, EDU.el('td', {}, algCell(a), EDU.el('span', { class: 'full', text: t('full_' + a) })), EDU.el('td', { text: t('short_' + a) }), EDU.el('td', {}, yesNo(GUAR[a][0])), EDU.el('td', {}, yesNo(GUAR[a][1]))));
    });
  }

  function runCompare() {
    var res = ALGS.map(function (a) { var r = search(a, G, false); r.time = timeIt(a, 5); return r; });
    var best = null;
    res.forEach(function (r) { if (r.found && (best === null || r.cost < best)) best = r.cost; });
    CMP = { res: res, best: best };
    renderCompare();
  }
  function renderCompare() {
    var has = !!CMP;
    $('#cmp-wrap').hidden = !has; $('#cmp-empty').hidden = has; $('#cmp-ins-box').hidden = !has; $('#cmp-notes').hidden = !has;
    var body = $('#cmp-body'); body.innerHTML = '';
    if (!has) return;
    var maxE = 1, minE = Infinity;
    CMP.res.forEach(function (r) { maxE = Math.max(maxE, r.explored); minE = Math.min(minE, r.explored); });
    CMP.res.forEach(function (r) {
      var cheapest = r.found && r.cost === CMP.best;
      var bar = EDU.el('div', { class: 'bar', style: { width: Math.max(2, Math.round(100 * r.explored / maxE)) + '%', background: pal ? pal.alg[r.alg] : 'var(--primary)' } });
      var showBtn = EDU.el('button', { type: 'button', class: 'btn btn-sm show-btn', 'data-alg': r.alg, 'aria-label': t('cmp_show_aria', { alg: t('alg_' + r.alg) }), text: t('cmp_show') });
      showBtn.addEventListener('click', function () { showAlg(r.alg); });
      body.appendChild(EDU.el('tr', { id: 'cmp-row-' + r.alg, class: r.alg === S.alg ? 'cur' : '', 'data-explored': r.explored, 'data-steps': r.found ? r.steps : '', 'data-cost': r.found ? r.cost : '', 'data-cheapest': cheapest ? '1' : '0', 'data-mem': r.maxOpen },
        EDU.el('td', {}, algCell(r.alg)),
        EDU.el('td', { class: 'num' + (r.explored === minE ? ' best' : '') }, fmt(r.explored), bar),
        EDU.el('td', { class: 'num' }, r.found ? fmt(r.steps) : t('no_path')),
        EDU.el('td', { class: 'num' + (cheapest ? ' best' : '') }, r.found ? fmt(r.cost) : '–'),
        EDU.el('td', {}, r.found ? yesNo(cheapest) : '–'),
        EDU.el('td', { class: 'num' }, fmt(r.maxOpen)),
        EDU.el('td', { class: 'num' }, fmtTime(r.time)),
        EDU.el('td', { class: 'show-col' }, showBtn)));
    });
    var ul = $('#cmp-ins'); ul.innerHTML = '';
    insights().forEach(function (s) { ul.appendChild(EDU.el('li', { text: s })); });
  }
  function insights() {
    var by = {};
    CMP.res.forEach(function (r) { by[r.alg] = r; });
    if (CMP.best === null) return [t('ins_nopath')];
    var out = [t('ins_best', { cost: fmt(CMP.best), steps: fmt(by.dij.steps) })];
    var a = by.astar.explored, d = by.dij.explored, p = Math.round((1 - a / d) * 100);
    out.push(p >= 5 ? t('ins_astar', { a: fmt(a), d: fmt(d), p: fmt(p) }) : t('ins_astar_same'));
    out.push(by.bfs.cost > CMP.best ? t('ins_bfs_bad', { s: fmt(by.bfs.steps), c: fmt(by.bfs.cost) }) : t('ins_bfs_ok'));
    out.push(by.greedy.cost > CMP.best ? t('ins_greedy_bad', { g: fmt(by.greedy.explored), c: fmt(by.greedy.cost) }) : t('ins_greedy_ok', { g: fmt(by.greedy.explored) }));
    if (by.dfs.steps > by.bfs.steps) out.push(t('ins_dfs', { s: fmt(by.dfs.steps), b: fmt(by.bfs.steps) }));
    return out;
  }
  function showAlg(a) {
    selectAlg(a);
    run();
    var st = $('#stage');
    if (st.scrollIntoView) st.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function render() {
    renderChoices(); renderInfo(); renderGlance(); renderRun(); renderStats(); renderCompare(); paintMsg(); drawLegend();
  }

  /* ================================================================ editing */
  function afterGridChange(live) {
    if (mode === 'done' && live) { startSearch(1); finishAll(); mode = 'done'; showFinal(); }
    else if (mode !== 'idle') { clearSearch(); setMsg(function () { return [t('msg_edited'), 'warn']; }); }
    draw(); renderStats(); renderRun();
  }
  function endEdit() {
    saveGrid();
    if (mode === 'done' && R) { R.time = timeIt(R.alg, 6); renderStats(); }
    if (CMP) runCompare();
  }
  function setCell(i, v) {
    if (i === G.start || i === G.goal || G.cells[i] === v) return false;
    G.cells[i] = v; return true;
  }
  function cellAt(e) {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width) return -1;
    var c = Math.floor((e.clientX - rect.left) / rect.width * G.cols), r = Math.floor((e.clientY - rect.top) / rect.height * G.rows);
    if (c < 0 || r < 0 || c >= G.cols || r >= G.rows) return -1;
    return ix(r, c);
  }
  function paintLine(a, b, val) {           // fill every cell between two pointer positions (fast drags leave no gaps)
    var r0 = rowOf(a), c0 = colOf(a), r1 = rowOf(b), c1 = colOf(b), changed = false;
    var n = Math.max(Math.abs(r1 - r0), Math.abs(c1 - c0));
    for (var s = 0; s <= n; s++) {
      var r = Math.round(r0 + (r1 - r0) * (n ? s / n : 0)), c = Math.round(c0 + (c1 - c0) * (n ? s / n : 0));
      if (setCell(ix(r, c), val)) changed = true;
    }
    return changed;
  }
  function toolValue(i) {
    if (S.tool === 'wall') return G.cells[i] === WALL ? EMPTY : WALL;
    if (S.tool === 'mud') return G.cells[i] === MUD ? EMPTY : MUD;
    return EMPTY;
  }
  function moveEnd(kind, i) {
    var other = kind === 'start' ? G.goal : G.start;
    if (i < 0 || i === other || G.cells[i] === WALL || G[kind] === i) return false;
    G[kind] = i; return true;
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button > 0) return;
    var i = cellAt(e); if (i < 0) return;
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch (er) { }
    cursor = i;
    if (i === G.start) drag = { kind: 'start' };
    else if (i === G.goal) drag = { kind: 'goal' };
    else {
      drag = { kind: 'paint', val: toolValue(i), last: i };
      if (setCell(i, drag.val)) afterGridChange(true); else draw();
    }
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var i = cellAt(e); if (i < 0) return;
    if (drag.kind === 'paint') {
      if (i === drag.last) return;
      var ch = paintLine(drag.last, i, drag.val); drag.last = i;
      if (ch) afterGridChange(true);
    } else if (moveEnd(drag.kind, i)) { cursor = i; afterGridChange(true); }
  });
  function pointerEnd() { if (!drag) return; drag = null; endEdit(); }
  canvas.addEventListener('pointerup', pointerEnd);
  canvas.addEventListener('pointercancel', pointerEnd);
  canvas.addEventListener('lostpointercapture', pointerEnd);

  canvas.addEventListener('focus', function () { focused = true; if (cursor < 0) cursor = G.start; draw(); });
  canvas.addEventListener('blur', function () { focused = false; draw(); });
  canvas.addEventListener('keydown', function (e) {
    if (cursor < 0 || cursor >= G.cells.length) cursor = G.start;
    var r = rowOf(cursor), c = colOf(cursor), key = e.key, changed = false, moved = false;
    if (key === 'ArrowUp') { r--; moved = true; } else if (key === 'ArrowDown') { r++; moved = true; }
    else if (key === 'ArrowLeft') { c--; moved = true; } else if (key === 'ArrowRight') { c++; moved = true; }
    else if (key === ' ' || key === 'Enter') changed = setCell(cursor, toolValue(cursor));
    else if (key === 's' || key === 'S') changed = moveEnd('start', cursor);
    else if (key === 'g' || key === 'G') changed = moveEnd('goal', cursor);
    else return;
    e.preventDefault();
    if (moved) {
      cursor = ix(EDU.clamp(r, 0, G.rows - 1), EDU.clamp(c, 0, G.cols - 1));
      $('#kb-live').textContent = t('cell_pos', { r: fmt(rowOf(cursor) + 1), c: fmt(colOf(cursor) + 1) });
      draw();
    }
    if (changed) { afterGridChange(true); endEdit(); }
  });

  /* ================================================================ generators */
  function newGrid(g, msgKey) {
    G = g; cursor = -1;
    clearSearch(); fitCanvas(true); draw(); renderChoices(); renderStats(); renderRun();
    saveGrid();
    if (CMP) runCompare();
    if (msgKey) setMsg(function () { return [t(msgKey), '']; }); else readyMsg();
  }
  function makeMaze() {
    var g = blank(G.cols, G.rows), cols = g.cols, rows = g.rows;
    g.cells.fill(WALL);
    var at = function (r, c) { return r * cols + c; };
    var stack = [[1, 1]]; g.cells[at(1, 1)] = EMPTY;
    var dirs = [[-2, 0], [0, 2], [2, 0], [0, -2]];
    while (stack.length) {
      var top = stack[stack.length - 1], opts = [];
      for (var k = 0; k < 4; k++) {
        var nr = top[0] + dirs[k][0], nc = top[1] + dirs[k][1];
        if (nr >= 1 && nr <= rows - 2 && nc >= 1 && nc <= cols - 2 && g.cells[at(nr, nc)] === WALL) opts.push([nr, nc]);
      }
      if (!opts.length) { stack.pop(); continue; }
      var nx = EDU.pick(opts);
      g.cells[at((top[0] + nx[0]) / 2, (top[1] + nx[1]) / 2)] = EMPTY;
      g.cells[at(nx[0], nx[1])] = EMPTY;
      stack.push(nx);
    }
    if (S.loops) {   // knock down a few walls between two corridors so there is more than one route
      var cand = [];
      for (var r = 1; r < rows - 1; r++) for (var c = 1; c < cols - 1; c++) {
        if (g.cells[at(r, c)] !== WALL || (r % 2) === (c % 2)) continue;
        var vert = r % 2 === 0;   // wall between the cell above and below
        var a = vert ? at(r - 1, c) : at(r, c - 1), b = vert ? at(r + 1, c) : at(r, c + 1);
        if (g.cells[a] !== WALL && g.cells[b] !== WALL) cand.push(at(r, c));
      }
      EDU.shuffle(cand).slice(0, Math.round(cand.length * 0.12)).forEach(function (i) { g.cells[i] = EMPTY; });
    }
    g.start = at(1, 1); g.goal = at(rows - 2 - ((rows - 1) % 2 ? 1 : 0), cols - 2 - ((cols - 1) % 2 ? 1 : 0));
    if (g.cells[g.goal] === WALL) g.cells[g.goal] = EMPTY;
    newGrid(g, 'msg_maze');
  }
  function randomWalls() {
    var g = null;
    for (var tries = 0; tries < 30; tries++) {
      g = blank(G.cols, G.rows); g.start = G.start; g.goal = G.goal;
      for (var i = 0; i < g.cells.length; i++) if (i !== g.start && i !== g.goal && Math.random() < 0.3) g.cells[i] = WALL;
      if (search('bfs', g, false).found) break;
    }
    newGrid(g, 'msg_random');
  }
  function randomMud() {
    var g = blank(G.cols, G.rows), n = g.cells.length;
    g.start = G.start; g.goal = G.goal;
    for (var i = 0; i < n; i++) g.cells[i] = G.cells[i] === WALL ? WALL : EMPTY;
    var blobs = Math.max(3, Math.round(n / 45));
    for (var b = 0; b < blobs; b++) {
      var r = EDU.randInt(0, g.rows - 1), c = EDU.randInt(0, g.cols - 1), len = EDU.randInt(3, 9);
      for (var s = 0; s < len; s++) {
        var k = r * g.cols + c;
        if (g.cells[k] === EMPTY && k !== g.start && k !== g.goal) g.cells[k] = MUD;
        var d = EDU.randInt(0, 3);
        r = EDU.clamp(r + (d === 0 ? -1 : d === 2 ? 1 : 0), 0, g.rows - 1); c = EDU.clamp(c + (d === 1 ? 1 : d === 3 ? -1 : 0), 0, g.cols - 1);
      }
    }
    newGrid(g, 'msg_mud');
  }
  function clearAll() { var g = blank(G.cols, G.rows); g.start = G.start; g.goal = G.goal; newGrid(g, 'msg_cleared'); }

  function selectAlg(a) {
    if (a === S.alg && mode === 'idle') return;
    S.alg = a; saveSettings();
    clearSearch(); readyMsg();
    renderChoices(); renderInfo(); renderRun(); renderStats(); draw();
    $$('#cmp-body tr').forEach(function (tr) { tr.classList.toggle('cur', tr.id === 'cmp-row-' + a); });
  }

  /* ================================================================ wiring */
  $$('#algs [data-alg]').forEach(function (b) { b.addEventListener('click', function () { selectAlg(b.dataset.alg); }); });
  $$('#tools [data-tool]').forEach(function (b) { b.addEventListener('click', function () { S.tool = b.dataset.tool; saveSettings(); renderChoices(); }); });
  $$('#speed [data-speed]').forEach(function (b) {
    b.addEventListener('click', function () {
      S.speed = b.dataset.speed; saveSettings(); renderChoices();
      if (mode === 'run' && !SPEEDS[S.speed]) done();
    });
  });
  $$('#size [data-size]').forEach(function (b) {
    b.addEventListener('click', function () { S.size = b.dataset.size; saveSettings(); newGrid(demoGrid(dimsFor(S.size))); });
  });
  $('#nums').addEventListener('change', function () { S.nums = this.checked; saveSettings(); renderChoices(); draw(); });
  $('#loops').addEventListener('change', function () { S.loops = this.checked; saveSettings(); });
  $('#run').addEventListener('click', run);
  $('#step').addEventListener('click', step);
  $('#clear-path').addEventListener('click', function () { clearSearch(); readyMsg(); draw(); renderStats(); renderRun(); });
  $('#gen-maze').addEventListener('click', makeMaze);
  $('#gen-walls').addEventListener('click', randomWalls);
  $('#gen-mud').addEventListener('click', randomMud);
  $('#clear-all').addEventListener('click', clearAll);
  $('#cmp-btn').addEventListener('click', function () { runCompare(); });
  $('#print-btn').addEventListener('click', function () { if (!CMP) runCompare(); window.print(); });
  $('#fs-btn').addEventListener('click', function () { EDU.fullscreen($('#stage')); });
  $('#reset-all').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    ['grid', 'alg', 'speed', 'size', 'tool', 'nums', 'loops'].forEach(function (k) { store.remove(k); });
    S.alg = 'bfs'; S.speed = 'normal'; S.size = 'm'; S.tool = 'wall'; S.nums = false; S.loops = true;
    CMP = null; renderCompare();
    newGrid(demoGrid(dimsFor('m')));
    renderInfo();
  });

  function onResize() { var before = lastWrapW; fitCanvas(); if (lastWrapW !== before) draw(); }
  if (window.ResizeObserver) new ResizeObserver(onResize).observe($('#board-wrap'));
  window.addEventListener('resize', function () { fitCanvas(true); draw(); });
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) {
    document.addEventListener(ev, function () { setTimeout(function () { fitCanvas(true); draw(); }, 60); });
  });
  function repaintAll() { draw(); drawLegend(); renderInfo(); renderGlance(); renderCompare(); }
  window.addEventListener('beforeprint', function () { pal = palette(true); repaintAll(); });
  window.addEventListener('afterprint', function () { pal = palette(); repaintAll(); });
  EDU.onTheme(function () { pal = palette(); repaintAll(); });
  EDU.onLang(render);

  /* ================================================================ start */
  pal = palette();
  G = loadGrid() || demoGrid(dimsFor(S.size));
  fitCanvas(true);
  readyMsg();
  render();
  draw();

  /* for the automated test */
  window.PF_DEBUG = function () {
    return {
      cols: G.cols, rows: G.rows, start: G.start, goal: G.goal, cells: Array.prototype.slice.call(G.cells),
      alg: S.alg, mode: mode, tool: S.tool, speed: S.speed,
      evi: V ? V.evi : 0, events: R ? R.events.length : 0,
      result: R ? { alg: R.alg, found: R.found, steps: R.steps, cost: R.cost, explored: R.explored, path: R.path.slice(), best: R.best } : null,
      cmp: CMP ? CMP.res.map(function (r) { return { alg: r.alg, found: r.found, steps: r.steps, cost: r.cost, explored: r.explored, maxOpen: r.maxOpen }; }) : null
    };
  };
})();
