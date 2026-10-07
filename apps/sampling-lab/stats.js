/* Sampling Lab maths: seeded random numbers, the three populations, summary statistics and the t critical value.
   Classic script (window.SLSTATS) that also loads in Node (module.exports) for checks. */
(function (root) {
  'use strict';

  /* mulberry32: small, fast, seeded random numbers in [0, 1) */
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) { var u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }

  /* ---- the populations (always the same: fixed seeds) ---- */
  var N = 10000, cache = {};
  function population(kind) {
    if (cache[kind]) return cache[kind];
    var r = rng(kind === 'heights' ? 1101 : kind === 'income' ? 2202 : 3303), v = new Float64Array(N), extra = null, i;
    if (kind === 'heights') {
      /* class 9–10 students: half girls (mean 153 cm), half boys (mean 160 cm) */
      for (i = 0; i < N; i++) {
        var boy = i % 2 === 1, h = (boy ? 160 : 153) + gauss(r) * (boy ? 7.5 : 6.2);
        v[i] = Math.round(Math.min(184, Math.max(126, h)) * 10) / 10;
      }
    } else if (kind === 'income') {
      /* monthly income of 10,000 adults in a district: 30% in the big city, 30% in towns, 40% in villages; skewed to the right */
      extra = { place: new Uint8Array(N), online: new Uint8Array(N) };
      var med = [32000, 17000, 10500];
      for (i = 0; i < N; i++) {
        var pl = i < 3000 ? 0 : i < 6000 ? 1 : 2;
        var x = med[pl] * Math.exp(0.72 * gauss(r));
        x = Math.round(Math.min(400000, Math.max(2500, x)) / 100) * 100;
        v[i] = x;
        extra.place[i] = pl;
        /* richer people and city people are more likely to be online */
        var pOn = [0.75, 0.5, 0.25][pl] + 0.25 * Math.tanh((Math.log(x) - Math.log(med[pl])) * 1.2);
        extra.online[i] = r() < pOn ? 1 : 0;
      }
    } else {
      for (i = 0; i < N; i++) v[i] = 1 + Math.floor(r() * 6);
    }
    var s = summary(v);
    cache[kind] = { kind: kind, values: v, extra: extra, mu: s.mean, sigma: s.sdPop, median: s.median, min: s.min, max: s.max };
    return cache[kind];
  }

  function summary(a) {
    var n = a.length, sum = 0, i, mn = Infinity, mx = -Infinity;
    for (i = 0; i < n; i++) { sum += a[i]; if (a[i] < mn) mn = a[i]; if (a[i] > mx) mx = a[i]; }
    var mean = sum / n, ss = 0;
    for (i = 0; i < n; i++) ss += (a[i] - mean) * (a[i] - mean);
    return { n: n, mean: mean, sdPop: Math.sqrt(ss / n), sd: n > 1 ? Math.sqrt(ss / (n - 1)) : NaN, median: median(a), min: mn, max: mx };
  }
  function median(a) {
    var s = Array.prototype.slice.call(a).sort(function (x, y) { return x - y; }), n = s.length;
    if (!n) return NaN;
    return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  }

  /* simple random sample of size n (with replacement: every pick is from all 10,000) */
  function sample(pop, n, r, pool) {
    var out = new Array(n), m = pool ? pool.length : pop.values.length;
    for (var i = 0; i < n; i++) { var k = Math.floor(r() * m); out[i] = pop.values[pool ? pool[k] : k]; }
    return out;
  }

  /* ---- Student t critical value ---- */
  function lgamma(x) {
    var g = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
      12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
    x -= 1;
    var s = g[0], t = x + 7.5;
    for (var i = 1; i < 9; i++) s += g[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(s);
  }
  /* regularized incomplete beta I_x(a, b) (continued fraction, Numerical Recipes) */
  function betacf(a, b, x) {
    var qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < 1e-300) d = 1e-300;
    d = 1 / d;
    var h = d;
    for (var m = 1; m <= 300; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d;
      var del = d * c; h *= del;
      if (Math.abs(del - 1) < 1e-15) break;
    }
    return h;
  }
  function ibeta(x, a, b) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  }
  /* P(T ≤ t) for Student t with df degrees of freedom */
  function tcdf(t, df) {
    var p = 0.5 * ibeta(df / (df + t * t), df / 2, 0.5);
    return t > 0 ? 1 - p : p;
  }
  /* t such that P(−t < T < t) = conf */
  function tcrit(conf, df) {
    var target = 1 - (1 - conf) / 2, lo = 0, hi = 1000;
    for (var i = 0; i < 200; i++) { var mid = (lo + hi) / 2; if (tcdf(mid, df) < target) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }

  /* confidence interval for the mean from one sample: x̄ ± t·s/√n */
  function ci(xs, conf) {
    var s = summary(xs), t = tcrit(conf, xs.length - 1), m = t * s.sd / Math.sqrt(xs.length);
    return { mean: s.mean, sd: s.sd, t: t, lo: s.mean - m, hi: s.mean + m };
  }

  var api = { rng: rng, gauss: gauss, population: population, summary: summary, median: median, sample: sample,
    tcdf: tcdf, tcrit: tcrit, ci: ci, N: N };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SLSTATS = api;
})(typeof window !== 'undefined' ? window : this);
