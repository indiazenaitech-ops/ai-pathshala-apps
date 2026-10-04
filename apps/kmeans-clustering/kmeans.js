/* Clustering Lab: pure k-means maths + dataset presets (no DOM).
   Points live on a 0–100 × 0–100 board. Exposed as window.KM_CORE. */
(function (root) {
  'use strict';

  /* ---------- random numbers ---------- */
  function seeded(seed) {                       // mulberry32: same preset → same points on every device
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(rand) {                        // Box–Muller
    var u = 0, v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function clampBoard(v) { return Math.max(1, Math.min(99, v)); }
  function round2(v) { return Math.round(v * 100) / 100; }

  /* ---------- geometry ---------- */
  function d2(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; }
  function nearest(p, cents) {
    var best = -1, bd = Infinity;
    for (var j = 0; j < cents.length; j++) { var d = d2(p, cents[j]); if (d < bd) { bd = d; best = j; } }
    return { i: best, d: bd };
  }

  /* ① Assign: every point joins its nearest centre. */
  function assign(points, cents, labels) {
    var out = new Array(points.length), changed = 0, sse = 0;
    for (var i = 0; i < points.length; i++) {
      var n = nearest(points[i], cents);
      out[i] = n.i; sse += n.d;
      if (!labels || labels[i] !== n.i) changed++;
    }
    return { labels: out, changed: changed, inertia: sse };
  }

  /* ② Update: every centre moves to the mean of its points; an empty cluster keeps its centre. */
  function update(points, labels, cents) {
    var k = cents.length, sx = [], sy = [], n = [], j;
    for (j = 0; j < k; j++) { sx.push(0); sy.push(0); n.push(0); }
    for (var i = 0; i < points.length; i++) {
      var l = labels[i];
      if (l >= 0 && l < k) { sx[l] += points[i].x; sy[l] += points[i].y; n[l]++; }
    }
    var next = [], empty = [], moved = 0;
    for (j = 0; j < k; j++) {
      if (n[j]) next.push({ x: sx[j] / n[j], y: sy[j] / n[j] });
      else { next.push({ x: cents[j].x, y: cents[j].y }); empty.push(j); }
      moved = Math.max(moved, Math.sqrt(d2(next[j], cents[j])));
    }
    return { cents: next, empty: empty, moved: moved, counts: n };
  }

  function inertia(points, labels, cents) {
    var s = 0;
    for (var i = 0; i < points.length; i++) { var l = labels[i]; if (l >= 0 && l < cents.length) s += d2(points[i], cents[l]); }
    return s;
  }

  /* ---------- starting centres ---------- */
  function initRandom(points, k, rand) {        // "Forgy": k different data points chosen by chance
    var idx = [], i;
    for (i = 0; i < points.length; i++) idx.push(i);
    for (i = 0; i < k && i < idx.length; i++) {
      var j = i + Math.floor(rand() * (idx.length - i));
      var t = idx[i]; idx[i] = idx[j]; idx[j] = t;
    }
    return idx.slice(0, k).map(function (q) { return { x: points[q].x, y: points[q].y }; });
  }
  function initPlusPlus(points, k, rand) {      // k-means++ (Arthur & Vassilvitskii, 2007)
    if (!points.length) return [];
    var cents = [], first = points[Math.floor(rand() * points.length)];
    cents.push({ x: first.x, y: first.y });
    var dist = points.map(function (p) { return d2(p, first); });
    while (cents.length < k) {
      var total = 0, i;
      for (i = 0; i < dist.length; i++) total += dist[i];
      var pick = -1;
      if (total > 0) {
        var r = rand() * total, lastPos = -1;
        for (i = 0; i < dist.length; i++) {        // only points that are not already a centre can be picked
          if (!(dist[i] > 0)) continue;
          lastPos = i; r -= dist[i];
          if (r < 0) { pick = i; break; }
        }
        if (pick < 0) pick = lastPos;                // rounding left a tiny bit of r over
      } else pick = Math.floor(rand() * points.length);   // all points sit on centres already
      var c = { x: points[pick].x, y: points[pick].y };
      cents.push(c);
      for (i = 0; i < dist.length; i++) dist[i] = Math.min(dist[i], d2(points[i], c));
    }
    return cents;
  }
  function init(points, k, method, rand) {
    return method === 'random' ? initRandom(points, k, rand) : initPlusPlus(points, k, rand);
  }

  /* Full run (used by the elbow chart). */
  function run(points, k, method, rand, maxIter) {
    var cents = init(points, k, method, rand), labels = null, it = 0, a;
    maxIter = maxIter || 100;
    while (it < maxIter) {
      a = assign(points, cents, labels);
      it++;
      if (labels && a.changed === 0) break;
      labels = a.labels;
      cents = update(points, labels, cents).cents;
    }
    labels = a.labels;
    return { cents: cents, labels: labels, inertia: inertia(points, labels, cents), rounds: it };
  }
  function best(points, k, restarts, rand) {
    var b = null;
    for (var r = 0; r < restarts; r++) {
      var res = run(points, k, 'pp', rand, 100);
      if (!b || res.inertia < b.inertia) b = res;
    }
    return b;
  }
  function distinctCount(points) {
    var seen = {}, n = 0;
    for (var i = 0; i < points.length; i++) { var key = points[i].x + ',' + points[i].y; if (!seen[key]) { seen[key] = 1; n++; } }
    return n;
  }
  /* Elbow data: best-of-`restarts` inertia for k = 1..kmax. */
  function elbow(points, kmax, restarts, rand) {
    var out = [], lim = Math.min(kmax, distinctCount(points));
    for (var k = 1; k <= lim; k++) out.push({ k: k, inertia: best(points, k, restarts, rand).inertia });
    return out;
  }
  /* Where does the curve bend? The drop into k must be big (≥ 4 % of the k = 1 inertia)
     and much bigger (≥ 5×) than the drop after k. Returns 0 when there is no clear elbow. */
  function suggestK(vals) {
    if (!vals || vals.length < 3) return 0;
    var I = vals.map(function (v) { return v.inertia; }), base = I[0];
    if (!(base > 0)) return 0;
    var bestK = 0, bestScore = 0;
    for (var i = 1; i < I.length - 1; i++) {
      var before = I[i - 1] - I[i], after = I[i] - I[i + 1];
      if (before < 0.04 * base) continue;
      var score = before / Math.max(after, 0.004 * base);
      if (score > bestScore) { bestScore = score; bestK = vals[i].k; }
    }
    return bestScore >= 5 ? bestK : 0;
  }

  /* ---------- dataset presets (seeded, so every class sees the same picture) ---------- */
  function blobs(rand, specs) {
    var pts = [];
    specs.forEach(function (s) {
      for (var i = 0; i < s.n; i++) pts.push({ x: round2(clampBoard(s.x + gauss(rand) * s.sx)), y: round2(clampBoard(s.y + gauss(rand) * (s.sy || s.sx))) });
    });
    return pts;
  }
  /* Shop customers: x = age (15–75 years), y = monthly spending (₹0–₹10,000), both scaled to 0–100. */
  var AGE0 = 15, AGE_PER = 0.6, RUPEES_PER = 100;
  function ageToX(a) { return (a - AGE0) / AGE_PER; }
  function xToAge(x) { return AGE0 + x * AGE_PER; }
  function rupeesToY(r) { return r / RUPEES_PER; }
  function yToRupees(y) { return y * RUPEES_PER; }

  var PRESETS = {
    blobs3: function () {
      return blobs(seeded(31), [{ x: 26, y: 70, sx: 7, n: 50 }, { x: 74, y: 74, sx: 7, n: 50 }, { x: 50, y: 24, sx: 7, n: 50 }]);
    },
    blobs5: function () {
      return blobs(seeded(57), [{ x: 20, y: 80, sx: 5, n: 34 }, { x: 80, y: 82, sx: 5, n: 34 }, { x: 50, y: 50, sx: 5, n: 34 }, { x: 20, y: 20, sx: 5, n: 34 }, { x: 80, y: 18, sx: 5, n: 34 }]);
    },
    ring: function () {
      var rand = seeded(73), pts = blobs(rand, [{ x: 50, y: 50, sx: 5, n: 60 }]);
      for (var i = 0; i < 130; i++) {
        var a = rand() * Math.PI * 2, r = 37 + gauss(rand) * 2.2;
        pts.push({ x: round2(clampBoard(50 + r * Math.cos(a))), y: round2(clampBoard(50 + r * Math.sin(a))) });
      }
      return pts;
    },
    random: function () {
      var rand = seeded(91), pts = [];
      for (var i = 0; i < 160; i++) pts.push({ x: round2(4 + rand() * 92), y: round2(4 + rand() * 92) });
      return pts;
    },
    customers: function () {
      var rand = seeded(2024), pts = [];
      [
        { age: 20, sa: 1.8, spend: 1800, ss: 600, n: 40 },   // college students
        { age: 29, sa: 3, spend: 7400, ss: 900, n: 45 },     // young working people
        { age: 43, sa: 4, spend: 4800, ss: 750, n: 50 },     // families
        { age: 63, sa: 4.5, spend: 2600, ss: 650, n: 35 }    // retired people
      ].forEach(function (g) {
        for (var i = 0; i < g.n; i++) {
          pts.push({ x: round2(clampBoard(ageToX(g.age + gauss(rand) * g.sa))), y: round2(clampBoard(rupeesToY(g.spend + gauss(rand) * g.ss))) });
        }
      });
      return pts;
    }
  };

  root.KM_CORE = {
    seeded: seeded, d2: d2, nearest: nearest, assign: assign, update: update, inertia: inertia,
    init: init, initRandom: initRandom, initPlusPlus: initPlusPlus, run: run, best: best,
    elbow: elbow, suggestK: suggestK, distinctCount: distinctCount, PRESETS: PRESETS,
    xToAge: xToAge, yToRupees: yToRupees, ageToX: ageToX, rupeesToY: rupeesToY
  };
})(typeof window !== 'undefined' ? window : this);
