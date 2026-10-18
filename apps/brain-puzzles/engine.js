/* Brain Puzzles: pure game rules (no DOM). window.BP = { g2048, slide, lights, rng } */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------ 2048 */
  /* Tiles are {id, v, r, c}. dir: 'left' | 'right' | 'up' | 'down'.
     Each tile merges at most once per move, and merges happen toward the move direction
     (row [2,2,2,2] moved left gives [4,4,0,0]; [4,2,2,0] left gives [4,4,0,0], not [8,0,0,0]). */
  var g2048 = {
    slide: function (tiles, n, dir, nextId) {
      var grid = [], i, r, c;
      for (i = 0; i < n * n; i++) grid.push(null);
      tiles.forEach(function (t) { grid[t.r * n + t.c] = t; });
      var out = [], consumed = [], merged = [], gained = 0, moved = false;
      for (var line = 0; line < n; line++) {
        var cells = [];                         /* positions along the line, from the leading edge */
        for (var k = 0; k < n; k++) {
          if (dir === 'left') cells.push([line, k]);
          else if (dir === 'right') cells.push([line, n - 1 - k]);
          else if (dir === 'up') cells.push([k, line]);
          else cells.push([n - 1 - k, line]);
        }
        var placed = [];                        /* {tile, merged} in leading order */
        cells.forEach(function (p) {
          var t = grid[p[0] * n + p[1]];
          if (!t) return;
          var last = placed[placed.length - 1];
          if (last && !last.merged && last.tile.v === t.v) {
            var pos = cells[placed.length - 1];
            var nt = { id: nextId++, v: t.v * 2, r: pos[0], c: pos[1] };
            consumed.push({ id: last.tile.id, r: pos[0], c: pos[1] }, { id: t.id, r: pos[0], c: pos[1] });
            merged.push(nt.id);
            gained += nt.v;
            last.tile = nt; last.merged = true; moved = true;
          } else {
            placed.push({ tile: t, merged: false });
          }
        });
        placed.forEach(function (pl, idx) {
          var pos = cells[idx], t = pl.tile;
          if (pl.merged) { out.push(t); return; }
          if (t.r !== pos[0] || t.c !== pos[1]) moved = true;
          out.push({ id: t.id, v: t.v, r: pos[0], c: pos[1] });
        });
      }
      return { tiles: out, consumed: consumed, merged: merged, gained: gained, moved: moved, nextId: nextId };
    },
    toGrid: function (tiles, n) {
      var g = []; for (var i = 0; i < n * n; i++) g.push(0);
      tiles.forEach(function (t) { g[t.r * n + t.c] = t.v; });
      return g;
    },
    fromGrid: function (grid, n) {
      var tiles = [], id = 1;
      grid.forEach(function (v, i) { if (v) tiles.push({ id: id++, v: v, r: Math.floor(i / n), c: i % n }); });
      return tiles;
    },
    /* numeric helper used by tests: returns {grid, gained, moved} */
    moveGrid: function (grid, n, dir) {
      var tiles = g2048.fromGrid(grid, n), res = g2048.slide(tiles, n, dir, 1000);
      return { grid: g2048.toGrid(res.tiles, n), gained: res.gained, moved: res.moved };
    },
    empties: function (tiles, n) {
      var used = {}, e = [];
      tiles.forEach(function (t) { used[t.r * n + t.c] = 1; });
      for (var i = 0; i < n * n; i++) if (!used[i]) e.push(i);
      return e;
    },
    canMove: function (tiles, n) {
      if (tiles.length < n * n) return true;
      var g = g2048.toGrid(tiles, n);
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
        var v = g[r * n + c];
        if (c + 1 < n && g[r * n + c + 1] === v) return true;
        if (r + 1 < n && g[(r + 1) * n + c] === v) return true;
      }
      return false;
    },
    maxTile: function (tiles) { var m = 0; tiles.forEach(function (t) { if (t.v > m) m = t.v; }); return m; },
    target: function (n) { return n === 3 ? 256 : 2048; }
  };

  /* ------------------------------------------------------------ number slide (15-puzzle) */
  /* board: array of n*n numbers, 0 = the gap. Solved = 1..n*n-1 then 0. */
  var slide = {
    solved: function (n) { var b = []; for (var i = 1; i < n * n; i++) b.push(i); b.push(0); return b; },
    isSolved: function (b) { for (var i = 0; i < b.length - 1; i++) if (b[i] !== i + 1) return false; return b[b.length - 1] === 0; },
    inversions: function (b) {
      var a = b.filter(function (x) { return x; }), inv = 0;
      for (var i = 0; i < a.length; i++) for (var j = i + 1; j < a.length; j++) if (a[i] > a[j]) inv++;
      return inv;
    },
    /* Odd width: solvable when inversions are even.
       Even width: solvable when inversions + (gap row counted from the bottom, starting at 1) is odd. */
    solvable: function (b, n) {
      var inv = slide.inversions(b);
      if (n % 2) return inv % 2 === 0;
      var gapRowFromBottom = n - Math.floor(b.indexOf(0) / n);
      return (inv + gapRowFromBottom) % 2 === 1;
    },
    shuffle: function (n, rnd) {
      rnd = rnd || Math.random;
      for (var tries = 0; tries < 50; tries++) {
        var b = slide.solved(n);
        for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var tmp = b[i]; b[i] = b[j]; b[j] = tmp; }
        if (!slide.solvable(b, n)) {             /* swapping two numbered tiles flips the parity */
          var a = -1, c = -1;
          for (var k = 0; k < b.length && c < 0; k++) if (b[k]) { if (a < 0) a = k; else c = k; }
          var t2 = b[a]; b[a] = b[c]; b[c] = t2;
        }
        if (!slide.isSolved(b) && slide.misplaced(b) >= Math.min(n * n - 1, 4)) return b;
      }
      return slide.solved(n);
    },
    misplaced: function (b) { var m = 0; for (var i = 0; i < b.length; i++) if (b[i] && b[i] !== i + 1) m++; return m; },
    /* tap the tile at index i: every tile between it and the gap (same row or column) slides one step. */
    tap: function (b, n, i) {
      var g = b.indexOf(0), gr = Math.floor(g / n), gc = g % n, r = Math.floor(i / n), c = i % n, step;
      if (i === g || (r !== gr && c !== gc)) return null;
      var nb = b.slice(), count = 0;
      if (r === gr) { step = c < gc ? -1 : 1; for (var x = gc; x !== c; x += step) { nb[gr * n + x] = nb[gr * n + x + step]; count++; } }
      else { step = r < gr ? -1 : 1; for (var y = gr; y !== r; y += step) { nb[y * n + gc] = nb[(y + step) * n + gc]; count++; } }
      nb[i] = 0;
      return { board: nb, count: count };
    },
    /* arrow key: 'left' moves the tile on the right of the gap to the left, and so on. */
    arrow: function (b, n, dir) {
      var g = b.indexOf(0), gr = Math.floor(g / n), gc = g % n, r = gr, c = gc;
      if (dir === 'left') c = gc + 1; else if (dir === 'right') c = gc - 1; else if (dir === 'up') r = gr + 1; else r = gr - 1;
      if (r < 0 || c < 0 || r >= n || c >= n) return null;
      return slide.tap(b, n, r * n + c);
    }
  };

  /* ------------------------------------------------------------ lights out */
  /* board: array of n*n 0/1. Pressing a cell flips it and its 4 neighbours (a plus shape). */
  var lights = {
    press: function (b, n, i) {
      var nb = b.slice(), r = Math.floor(i / n), c = i % n;
      [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
        var rr = r + d[0], cc = c + d[1];
        if (rr >= 0 && cc >= 0 && rr < n && cc < n) nb[rr * n + cc] ^= 1;
      });
      return nb;
    },
    lit: function (b) { var k = 0; b.forEach(function (x) { k += x; }); return k; },
    /* Solve A·x = b over GF(2) (Gaussian elimination on bit masks); returns the fewest-press solution as
       an array of cell indexes, or null when the board cannot be solved. 5 × 5 has 2 free variables (4 solutions). */
    solve: function (b, n) {
      var N = n * n, rows = [], i, j;
      for (i = 0; i < N; i++) {
        var m = 0, nb = lights.press(new Array(N).fill(0), n, i);
        for (j = 0; j < N; j++) if (nb[j]) m |= (1 << j);
        rows.push(m);                            /* column i of A as a mask over equations; A is symmetric */
      }
      /* equation e: sum over presses p affecting e of x_p = b_e. A symmetric, so row e = rows[e]. */
      var eq = [];
      for (i = 0; i < N; i++) eq.push({ m: rows[i], v: b[i] ? 1 : 0 });
      var pivotOf = [], r = 0;
      for (var col = 0; col < N && r < N; col++) {
        var p = -1;
        for (i = r; i < N; i++) if (eq[i].m & (1 << col)) { p = i; break; }
        if (p < 0) continue;
        var t = eq[p]; eq[p] = eq[r]; eq[r] = t;
        for (i = 0; i < N; i++) if (i !== r && (eq[i].m & (1 << col))) { eq[i] = { m: eq[i].m ^ eq[r].m, v: eq[i].v ^ eq[r].v }; }
        pivotOf.push(col); r++;
      }
      for (i = r; i < N; i++) if (eq[i].v) return null;   /* 0 = 1: no solution */
      var isPivot = {}; pivotOf.forEach(function (c) { isPivot[c] = 1; });
      var free = []; for (i = 0; i < N; i++) if (!isPivot[i]) free.push(i);
      var best = null;
      for (var combo = 0; combo < (1 << free.length); combo++) {
        var x = 0;
        free.forEach(function (f, k) { if (combo & (1 << k)) x |= (1 << f); });
        for (i = 0; i < r; i++) {
          var c2 = pivotOf[i], others = eq[i].m & ~(1 << c2), s = eq[i].v;
          var o = others & x; while (o) { s ^= 1; o &= o - 1; }
          if (s) x |= (1 << c2);
        }
        var list = []; for (i = 0; i < N; i++) if (x & (1 << i)) list.push(i);
        if (!best || list.length < best.length) best = list;
      }
      return best;
    },
    /* start from the solved (all dark) board and press random cells: always solvable */
    generate: function (n, rnd) {
      rnd = rnd || Math.random;
      var N = n * n, minPress = n === 3 ? 3 : 7;
      for (var tries = 0; tries < 200; tries++) {
        var b = []; for (var i = 0; i < N; i++) b.push(0);
        var presses = 0;
        for (i = 0; i < N; i++) if (rnd() < 0.5) { b = lights.press(b, n, i); presses++; }
        if (!presses) continue;
        var sol = lights.solve(b, n);
        if (sol && sol.length >= minPress) return b;
      }
      return lights.press(lights.press(lights.press(new Array(N).fill(0), n, 0), n, N - 1), n, Math.floor(N / 2));
    }
  };

  /* ------------------------------------------------------------ seeded random (for repeatable tests) */
  function rng(seed) {
    var s = (seed >>> 0) || 1;
    return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s >>> 0) / 4294967296; };
  }

  root.BP = { g2048: g2048, slide: slide, lights: lights, rng: rng };
  if (typeof module !== 'undefined') module.exports = root.BP;
})(typeof window !== 'undefined' ? window : globalThis);
