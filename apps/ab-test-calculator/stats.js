/* A/B test maths: no libraries. Works in the browser (window.ABSTATS) and in Node (module.exports) for checks. */
(function (root) {
  'use strict';

  /* Lower tail of the standard normal for x ≥ 0 written as Φ(−x), double precision
     (Hart 1968, as given by G. West, "Better approximations to cumulative normal functions", 2005). */
  function tail(x) {
    var a = Math.abs(x);
    if (a > 37) return 0;
    var e = Math.exp(-a * a / 2), b, c;
    if (a < 7.07106781186547) {
      b = 3.52624965998911e-02 * a + 0.700383064443688;
      b = b * a + 6.37396220353165; b = b * a + 33.912866078383; b = b * a + 112.079291497871;
      b = b * a + 221.213596169931; b = b * a + 220.206867912376;
      c = e * b;
      b = 8.83883476483184e-02 * a + 1.75566716318264;
      b = b * a + 16.064177579207; b = b * a + 86.7807322029461; b = b * a + 296.564248779674;
      b = b * a + 637.333633378831; b = b * a + 793.826512519948; b = b * a + 440.413735824752;
      return c / b;
    }
    b = a + 0.65; b = a + 4 / b; b = a + 3 / b; b = a + 2 / b; b = a + 1 / b;
    return e / b / 2.506628274631;
  }
  /* Φ(x): chance that a standard normal value is below x */
  function cdf(x) { if (isNaN(x)) return NaN; var c = tail(x); return x > 0 ? 1 - c : c; }

  /* inverse of Φ: Acklam's rational approximation + one Halley step (≈ 1e-15) */
  function inv(p) {
    if (!(p > 0 && p < 1)) return p === 0 ? -Infinity : p === 1 ? Infinity : NaN;
    var a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00],
      b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01],
      c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00],
      d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
    var q, r, x, pl = 0.02425;
    if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    else if (p <= 1 - pl) { q = p - 0.5; r = q * q; x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
    else { q = Math.sqrt(-2 * Math.log(1 - p)); x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    var err = cdf(x) - p, u = err * Math.sqrt(2 * Math.PI) * Math.exp(x * x / 2);
    return x - u / (1 + x * u / 2);
  }

  /* log Γ(x), Lanczos (g = 7, n = 9), x > 0 */
  var LG = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
    12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  function lgamma(x) {
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
    x -= 1;
    var s = LG[0], t = x + 7.5;
    for (var i = 1; i < 9; i++) s += LG[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(s);
  }
  function lbeta(a, b) { return lgamma(a) + lgamma(b) - lgamma(a + b); }

  /* Two-proportion z-test of B against A (pooled SE for the test, unpooled SE for the interval). */
  function compare(nA, cA, nB, cB, alpha) {
    var pA = cA / nA, pB = cB / nB, d = pB - pA;
    var pool = (cA + cB) / (nA + nB);
    var seP = Math.sqrt(pool * (1 - pool) * (1 / nA + 1 / nB));
    var z = seP > 0 ? d / seP : (d === 0 ? 0 : (d > 0 ? Infinity : -Infinity));
    var p = seP > 0 ? 2 * tail(z) : (d === 0 ? 1 : 0);
    if (p > 1) p = 1;
    var seU = Math.sqrt(pA * (1 - pA) / nA + pB * (1 - pB) / nB);
    var zc = inv(1 - alpha / 2);
    return { pA: pA, pB: pB, diff: d, uplift: pA > 0 ? d / pA : NaN, pool: pool, seP: seP, z: z, p: p,
      seU: seU, zc: zc, lo: d - zc * seU, hi: d + zc * seU, sig: p < alpha };
  }

  /* Chance that rate B is higher than rate A with flat Beta(1, 1) priors.
     Exact sum (Evan Miller) when B has up to 50,000 conversions, else a normal approximation. */
  function probBBeatsA(nA, cA, nB, cB) {
    var a1 = cA + 1, b1 = nA - cA + 1, a2 = cB + 1, b2 = nB - cB + 1;
    if (a2 - 1 <= 50000) {
      var tot = 0, k = -lbeta(a1, b1);
      for (var i = 0; i < a2; i++) tot += Math.exp(lbeta(a1 + i, b1 + b2) - Math.log(b2 + i) - lbeta(1 + i, b2) + k);
      return Math.min(1, Math.max(0, tot));
    }
    var m1 = a1 / (a1 + b1), m2 = a2 / (a2 + b2);
    var v1 = a1 * b1 / ((a1 + b1) * (a1 + b1) * (a1 + b1 + 1)), v2 = a2 * b2 / ((a2 + b2) * (a2 + b2) * (a2 + b2 + 1));
    return cdf((m2 - m1) / Math.sqrt(v1 + v2));
  }

  /* seeded random numbers (mulberry32) */
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
  /* Gamma(k, 1) sample, Marsaglia–Tsang (k ≥ 1 here because priors are Beta(1, 1)) */
  function gamma(k, r) {
    var d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
    for (;;) {
      var x, v;
      do { x = gauss(r); v = 1 + c * x; } while (v <= 0);
      v = v * v * v;
      var u = r();
      if (u < 1 - 0.0331 * x * x * x * x || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }
  /* Chance that each version has the highest true rate (seeded simulation). groups = [{n, c}] */
  function probBest(groups, draws, seed) {
    var r = rng(seed || 12345), wins = groups.map(function () { return 0; });
    for (var i = 0; i < draws; i++) {
      var best = -1, bi = 0;
      for (var g = 0; g < groups.length; g++) {
        var x = gamma(groups[g].c + 1, r), y = gamma(groups[g].n - groups[g].c + 1, r), v = x / (x + y);
        if (v > best) { best = v; bi = g; }
      }
      wins[bi]++;
    }
    return wins.map(function (w) { return w / draws; });
  }

  /* Visitors needed in EACH group to detect p1 → p2 (two-sided test, equal groups):
     n = [z(1−α/2)·√(2·p̄·q̄) + z(1−β)·√(p1·q1 + p2·q2)]² / (p2 − p1)²,  p̄ = (p1 + p2)/2  (Fleiss, no continuity correction). */
  function sampleSize(p1, p2, alpha, power) {
    if (!(p1 > 0 && p1 < 1 && p2 > 0 && p2 < 1) || p1 === p2) return NaN;
    var za = inv(1 - alpha / 2), zb = inv(power), pb = (p1 + p2) / 2;
    var num = za * Math.sqrt(2 * pb * (1 - pb)) + zb * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2));
    return { raw: num * num / ((p2 - p1) * (p2 - p1)), n: Math.ceil(num * num / ((p2 - p1) * (p2 - p1)) - 1e-9), za: za, zb: zb };
  }

  /* Was the traffic split 50/50 (or 1/k each) as planned? Chi-square goodness of fit, p-value. */
  function splitP(ns) {
    var tot = ns.reduce(function (a, b) { return a + b; }, 0), e = tot / ns.length, chi = 0;
    ns.forEach(function (n) { chi += (n - e) * (n - e) / e; });
    if (ns.length === 2) return 2 * tail(Math.sqrt(chi));      /* χ² with 1 df */
    return Math.exp(-chi / 2);                                  /* χ² with 2 df */
  }

  /* density of Beta(a, b) at x, for drawing */
  function betaPdf(x, a, b) {
    if (x <= 0 || x >= 1) return 0;
    return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - lbeta(a, b));
  }

  var api = { tail: tail, cdf: cdf, inv: inv, lgamma: lgamma, lbeta: lbeta, compare: compare, probBBeatsA: probBBeatsA,
    probBest: probBest, sampleSize: sampleSize, splitP: splitP, betaPdf: betaPdf, rng: rng };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ABSTATS = api;
})(typeof window !== 'undefined' ? window : this);
