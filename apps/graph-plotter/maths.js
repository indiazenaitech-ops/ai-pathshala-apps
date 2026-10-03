/* Graph Plotter: numeric helpers (no DOM).
   - findBreak: tells a real jump / asymptote apart from a steep but continuous curve
   - analyze:   zeroes, intersections, turning points and y-intercepts in a visible x-range
   - number and axis-label formatting (always Latin digits) */
(function () {
  'use strict';

  function ev(f, x, P) { var y = f(x, P); return (typeof y === 'number' && isFinite(y)) ? y : NaN; }

  /* Between two plotted samples (xa, ya) and (xb, yb), is the curve continuous on screen?
     Bisect, always keeping the half with the bigger jump. A continuous curve's jump shrinks
     below a pixel; a real jump (tan x at 90°, 1/x at 0, floor x) never does.
     Returns null (continuous) or [xl, yl, xr, yr], the tiny interval that holds the break. */
  function findBreak(f, P, xa, ya, xb, yb, sy) {
    for (var d = 0; d < 48; d++) {
      if (Math.abs(ya - yb) * sy <= 1.5) return null;
      var xm = (xa + xb) / 2;
      if (xm === xa || xm === xb) break;
      var ym = ev(f, xm, P);
      if (ym !== ym) return [xa, ya, xb, yb];
      if (Math.abs(ym - ya) >= Math.abs(yb - ym)) { xb = xm; yb = ym; } else { xa = xm; ya = ym; }
    }
    return [xa, ya, xb, yb];
  }

  /* Where does the function stop being defined between xIn (defined) and xOut (undefined)? */
  function edge(f, P, xIn, xOut) {
    var yIn = ev(f, xIn, P);
    for (var k = 0; k < 60; k++) {
      var xm = (xIn + xOut) / 2;
      if (xm === xIn || xm === xOut) break;
      var ym = ev(f, xm, P);
      if (ym === ym) { xIn = xm; yIn = ym; } else xOut = xm;
    }
    return [xIn, yIn];
  }

  function bisect(g, lo, hi, glo) {
    for (var k = 0; k < 200; k++) {
      var m = (lo + hi) / 2;
      if (m === lo || m === hi) break;
      var gm = g(m);
      if (gm !== gm) return null;
      if (gm === 0) return m;
      if ((gm < 0) === (glo < 0)) { lo = m; glo = gm; } else hi = m;
    }
    return (lo + hi) / 2;
  }

  var GR = (3 - Math.sqrt(5)) / 2;
  function goldenMin(h, a, b) {
    var c = a + GR * (b - a), d = b - GR * (b - a), fc = h(c), fd = h(d);
    for (var k = 0; k < 120 && (b - a) > 1e-14 * (1 + Math.abs(a)); k++) {
      if (fc < fd) { b = d; d = c; fd = fc; c = a + GR * (b - a); fc = h(c); }
      else { a = c; c = d; fc = fd; d = b - GR * (b - a); fd = h(d); }
    }
    return (a + b) / 2;
  }
  function finite(h) { return function (x) { var v = h(x); return v === v ? v : Infinity; }; }

  /* zeroes of g on the sampled grid (xs, ys); identical = g is 0 everywhere we looked */
  function zeros(g, xs, ys, limit) {
    var out = [], N = xs.length - 1, any = false, allZero = true, k, snap = snapper(xs);
    for (k = 0; k <= N; k++) if (ys[k] === ys[k]) { any = true; if (Math.abs(ys[k]) > 1e-12) { allZero = false; break; } }
    if (!any) return { list: out, identical: false };
    if (allZero) return { list: out, identical: true };
    var tol = Math.abs(xs[1] - xs[0]) * 0.25;
    function add(x) { if (!out.length || Math.abs(out[out.length - 1] - x) > tol) out.push(x); }
    for (k = 0; k < N && out.length < limit; k++) {
      var a = ys[k], b = ys[k + 1];
      if (a !== a || b !== b) continue;
      if (a === 0) { if (k === 0 || ys[k - 1] !== 0) add(xs[k]); continue; }
      if (a * b < 0) {
        var r = bisect(g, xs[k], xs[k + 1], a);
        if (r !== null) { var gr = g(r); if (gr === gr && Math.abs(gr) <= 1e-6 * (1 + Math.min(Math.abs(a), Math.abs(b)))) add(r); }
      } else if (k > 0 && b !== 0) {
        var p = ys[k - 1];
        if (p === p && p * a > 0 && a * b > 0 && Math.abs(a) < Math.abs(p) && Math.abs(a) <= Math.abs(b)) {
          var m = goldenMin(finite(function (x) { return Math.abs(g(x)); }), xs[k - 1], xs[k + 1]);
          if (Math.abs(g(snap(m))) <= Math.abs(g(m)) * 10 + 1e-14) m = snap(m);
          var gm = g(m);
          if (gm === gm && Math.abs(gm) < 1e-9 * (1 + Math.abs(p))) add(m);   // touches the axis, e.g. (x - 1)^2
        }
      }
    }
    return { list: out, identical: false };
  }

  /* Golden-section search on a flat top or bottom is only accurate to about 1e-8 of the range,
     so round such x-values to 1 millionth of the visible range (1.0000000083 -> 1, 6e-7° -> 0). */
  function snapper(xs) {
    var range = Math.abs(xs[xs.length - 1] - xs[0]) || 1, q = Math.pow(10, Math.floor(Math.log(range) / Math.LN10) - 6);
    return function (x) { var r = Math.round(x / q) * q; return Math.abs(r) < q / 2 ? 0 : +r.toPrecision(12); };
  }

  /* local highest / lowest points (turning points) */
  function turns(f, P, xs, ys, sy, limit) {
    var out = [], snap = snapper(xs);
    for (var k = 1; k < xs.length - 1 && out.length < limit; k++) {
      var a = ys[k - 1], m = ys[k], b = ys[k + 1];
      if (a !== a || m !== m || b !== b) continue;
      var isMax = m > a && m > b, isMin = m < a && m < b;
      if (!isMax && !isMin) continue;
      if (findBreak(f, P, xs[k - 1], a, xs[k], m, sy) || findBreak(f, P, xs[k], m, xs[k + 1], b, sy)) continue;
      var sgn = isMax ? -1 : 1;
      var xm = goldenMin(finite(function (x) { return sgn * ev(f, x, P); }), xs[k - 1], xs[k + 1]);
      var ym = ev(f, xm, P);
      if (ym !== ym || sgn * ym > sgn * m) { xm = xs[k]; ym = m; }
      var xr = snap(xm), yr = ev(f, xr, P);
      if (yr === yr && Math.abs(yr - ym) <= Math.abs(m - a) + Math.abs(m - b)) { xm = xr; ym = yr; }
      if (Math.abs(ym - m) > Math.abs(m - a) + Math.abs(m - b) + 1e-12) continue;   // a spike next to an asymptote
      out.push({ kind: isMax ? 'max' : 'min', x: xm, y: ym });
    }
    return out;
  }

  /* list: [{i, f}] visible functions. opt: {N, sy, roots, inter, turn, limit} */
  function analyze(list, P, x0, x1, opt) {
    var N = opt.N || 600, limit = opt.limit || 40, xs = new Array(N + 1), k;
    for (k = 0; k <= N; k++) xs[k] = x0 + (x1 - x0) * k / N;
    var ys = list.map(function (o) { return xs.map(function (x) { return ev(o.f, x, P); }); });
    var pts = [], same = [], empty = [];
    list.forEach(function (o, a) {
      var any = ys[a].some(function (y) { return y === y; });
      if (!any) { empty.push(o.i); return; }
      if (opt.roots) {
        zeros(function (x) { return ev(o.f, x, P); }, xs, ys[a], limit).list.forEach(function (x) { pts.push({ kind: 'root', fi: o.i, x: x, y: 0 }); });
        if (x0 < 0 && x1 > 0) { var y0 = ev(o.f, 0, P); if (y0 === y0 && Math.abs(y0) > 1e-12) pts.push({ kind: 'yint', fi: o.i, x: 0, y: y0 }); }
      }
      if (opt.turn) turns(o.f, P, xs, ys[a], opt.sy || 40, limit).forEach(function (p) { p.fi = o.i; pts.push(p); });
    });
    if (opt.inter) {
      for (var a = 0; a < list.length; a++) for (var b = a + 1; b < list.length; b++) {
        var fa = list[a].f, fb = list[b].f;
        var g = function (x) { return ev(fa, x, P) - ev(fb, x, P); };
        var gys = xs.map(function (x, j) { return ys[a][j] - ys[b][j]; });
        var z = zeros(g, xs, gys, limit);
        if (z.identical) { same.push([list[a].i, list[b].i]); continue; }
        z.list.forEach(function (x) {
          var y = ev(fa, x, P);
          if (y === y) pts.push({ kind: 'inter', fi: list[a].i, fj: list[b].i, x: x, y: y });
        });
      }
    }
    return { pts: pts, same: same, empty: empty };
  }

  /* ---------------------------------------------------------------- formatting */
  var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  function minus(s) { return String(s).replace(/^-/, '−'); }
  function expo(v) {
    var p = v.toExponential(3).split('e');
    return minus(String(parseFloat(p[0]))) + '×10' + String(parseInt(p[1], 10)).replace(/[-0-9]/g, function (c) { return SUP[c]; });
  }
  /* 4 decimals, no trailing zeros, true minus sign; tiny noise like 1e-16 shows as 0 */
  function fmt(v, digits) {
    if (typeof v !== 'number' || !isFinite(v)) return '—';
    digits = digits == null ? 4 : digits;
    var av = Math.abs(v);
    if (av < 1e-10) return '0';
    if (av >= 1e7 || av < Math.pow(10, -digits)) return expo(v);
    return minus(String(+v.toFixed(digits)));
  }
  /* plain number for data-attributes and CSV */
  function raw(v) { return (typeof v === 'number' && isFinite(v)) ? String(Math.abs(v) < 1e-10 ? 0 : +v.toPrecision(12)) : ''; }

  function niceStep(pxPerUnit, targetPx) {
    var rawStep = targetPx / pxPerUnit, p = Math.pow(10, Math.floor(Math.log(rawStep) / Math.LN10)), m = rawStep / p;
    return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
  }
  function tick(v, step) {
    if (Math.abs(v) < step * 1e-6) return '0';
    if (step >= 1e6 || step < 1e-5) return expo(v);
    var dec = Math.max(0, -Math.floor(Math.log(step) / Math.LN10 + 1e-9));
    return minus(v.toFixed(dec));
  }
  var PI_STEPS = [1 / 12, 1 / 6, 1 / 4, 1 / 2, 1, 2, 4, 10, 20, 50, 100, 200];
  function piStep(pxPerUnit, minPx) {
    for (var k = 0; k < PI_STEPS.length; k++) if (PI_STEPS[k] * Math.PI * pxPerUnit >= minPx) return PI_STEPS[k] * Math.PI;
    return null;
  }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function piTick(v) {
    var n = Math.round(v / Math.PI * 12);
    if (n === 0) return '0';
    var g = gcd(n, 12), num = n / g, den = 12 / g;
    return (num === 1 ? '' : num === -1 ? '−' : minus(String(num))) + 'π' + (den > 1 ? '/' + den : '');
  }

  window.GMATH = { ev: ev, findBreak: findBreak, edge: edge, analyze: analyze, zeros: zeros, fmt: fmt, raw: raw, niceStep: niceStep, tick: tick, piStep: piStep, piTick: piTick };
})();
