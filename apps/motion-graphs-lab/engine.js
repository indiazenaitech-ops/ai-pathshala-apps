/* Motion Graphs Lab: the maths, with no DOM.  window.MGL
   - build(segments, d0) turns a list of straight-line motion segments into a model with positions, totals and ranges
   - at(model, t) gives position, velocity and acceleration at time t
   - slope(model, 'd'|'v', t1, t2) is the slope of the d–t or v–t graph between two times
   - areaParts(model) splits the area under the v–t graph into the part above and the part below the axis
   - solve(known) solves the equations of motion (v = u + at, s = ut + ½at², v² = u² + 2as, s = (u + v)t/2)
     from any three of u, v, a, t, s and lists the steps.
   Units are SI throughout: metres, seconds, m/s, m/s². */
(function () {
  'use strict';
  var MAXSEG = 8, VMAX = 200, TMAX = 600, TMIN = 0.1, DMAX = 100000;

  function num(v, lo, hi, d) { v = Number(v); if (!isFinite(v)) v = d; return Math.min(hi, Math.max(lo, v)); }
  function round(x, p) { var k = Math.pow(10, p === undefined ? 6 : p); var r = Math.round(x * k) / k; return r === 0 ? 0 : r; }

  /* a segment from storage or from the table: unknown fields fall back to safe defaults */
  function cleanSeg(s) {
    if (!s || typeof s !== 'object') return null;
    var type = s.type === 'accel' ? 'accel' : 'const';
    var v = num(s.v, -VMAX, VMAX, 0), t = num(s.t, TMIN, TMAX, 10);
    var u = type === 'accel' ? num(s.u, -VMAX, VMAX, 0) : v;
    return { type: type, u: round(u), v: round(v), t: round(t) };
  }
  function cleanSegs(list) {
    var out = (Array.isArray(list) ? list : []).map(cleanSeg).filter(Boolean).slice(0, MAXSEG);
    return out;
  }

  /* model: every segment gets its start time/position, acceleration, displacement and path length */
  function build(segments, d0) {
    var segs = cleanSegs(segments);
    d0 = num(d0, -DMAX, DMAX, 0);
    var t0 = 0, d = d0, out = [], dist = 0;
    var vmax = -Infinity, vmin = Infinity, amax = -Infinity, amin = Infinity, dmax = d0, dmin = d0;
    segs.forEach(function (s, i) {
      var a = s.type === 'accel' ? (s.v - s.u) / s.t : 0;
      var disp = (s.u + s.v) / 2 * s.t;      /* area under the v–t line = average velocity × time */
      var tz = null, dz = null, pathLen = Math.abs(disp);
      if (s.u * s.v < 0 && a !== 0) {        /* velocity changes sign inside this segment: the object turns back */
        tz = -s.u / a;                       /* seconds after the segment start when v = 0 */
        var s1 = s.u * tz + 0.5 * a * tz * tz;
        dz = d + s1;
        pathLen = Math.abs(s1) + Math.abs(disp - s1);
        dmax = Math.max(dmax, dz); dmin = Math.min(dmin, dz);
      }
      var seg = { i: i, type: s.type, u: s.u, v: s.v, t: s.t, a: a, t0: t0, t1: t0 + s.t, d0: d, d1: d + disp, disp: disp, dist: pathLen, tz: tz, dz: dz };
      out.push(seg);
      t0 += s.t; d += disp; dist += pathLen;
      vmax = Math.max(vmax, s.u, s.v); vmin = Math.min(vmin, s.u, s.v);
      amax = Math.max(amax, a); amin = Math.min(amin, a);
      dmax = Math.max(dmax, d); dmin = Math.min(dmin, d);
    });
    if (!out.length) { vmax = vmin = amax = amin = 0; }
    var T = t0;
    return {
      segs: out, T: T, d0: d0, dEnd: d, disp: d - d0, dist: dist,
      avgSpeed: T > 0 ? dist / T : 0, avgVel: T > 0 ? (d - d0) / T : 0,
      vmax: vmax, vmin: vmin, amax: amax, amin: amin, dmax: dmax, dmin: dmin
    };
  }

  function segAt(m, t) {
    var L = m.segs; if (!L.length) return null;
    for (var i = 0; i < L.length; i++) if (t < L[i].t1) return L[i];
    return L[L.length - 1];
  }
  /* position, velocity and acceleration at time t (clamped to the scenario) */
  function at(m, t) {
    if (!m.segs.length) return { t: 0, d: m.d0, v: 0, a: 0, seg: null };
    t = Math.min(m.T, Math.max(0, Number(t) || 0));
    var s = segAt(m, t), dt = t - s.t0;
    return { t: t, d: s.d0 + s.u * dt + 0.5 * s.a * dt * dt, v: s.u + s.a * dt, a: s.a, seg: s };
  }
  /* slope of the d–t graph (= velocity) or the v–t graph (= acceleration) between t1 and t2 */
  function slope(m, kind, t1, t2) {
    if (!(Math.abs(t2 - t1) > 1e-9)) return null;
    var p = at(m, t1), q = at(m, t2), k = kind === 'v' ? 'v' : 'd';
    return { rise: q[k] - p[k], run: t2 - t1, value: (q[k] - p[k]) / (t2 - t1), p: p, q: q };
  }
  /* area under the v–t graph: above the axis (forward) and below it (backward); pos − neg = displacement */
  function areaParts(m) {
    var pos = 0, neg = 0;
    m.segs.forEach(function (s) {
      if (s.tz === null) { if (s.disp >= 0) pos += s.disp; else neg += -s.disp; return; }
      var s1 = s.u * s.tz + 0.5 * s.a * s.tz * s.tz, s2 = s.disp - s1;
      if (s1 >= 0) pos += s1; else neg += -s1;
      if (s2 >= 0) pos += s2; else neg += -s2;
    });
    return { pos: pos, neg: neg };
  }
  /* points for drawing: straight pieces need 2 points, curved (accelerating) d–t pieces get many */
  function samples(m, kind, perSeg) {
    var pts = [];
    perSeg = perSeg || 24;
    if (!m.segs.length) return pts;
    m.segs.forEach(function (s, i) {
      if (kind === 'a') {
        pts.push({ t: s.t0, y: s.a, i: i, start: true }); pts.push({ t: s.t1, y: s.a, i: i });
      } else if (kind === 'v') {
        pts.push({ t: s.t0, y: s.u, i: i, start: true }); pts.push({ t: s.t1, y: s.v, i: i });
      } else {
        var n = s.a === 0 ? 1 : perSeg;
        for (var k = 0; k <= n; k++) {
          var dt = s.t * k / n;
          pts.push({ t: s.t0 + dt, y: s.d0 + s.u * dt + 0.5 * s.a * dt * dt, i: i, start: k === 0 });
        }
      }
    });
    return pts;
  }

  /* ---------------- equations of motion ---------------- */
  var KEYS = ['u', 'v', 'a', 't', 's'];
  function fin(x) { return typeof x === 'number' && isFinite(x); }
  function sgn(x) { return x < 0 ? -1 : 1; }
  /* known = { u, v, a, t, s } with numbers for exactly three of them.
     Returns { ok, values, steps: [{ find, eq, lines }], error } where eq is one of e1..e4 and lines are
     plain maths strings (numbers substituted) to show under the equation. */
  function solve(known, fmt) {
    fmt = fmt || function (x) { return String(round(x, 3)); };
    var k = {}; KEYS.forEach(function (key) { if (fin(known[key])) k[key] = known[key]; });
    var have = KEYS.filter(function (key) { return key in k; });
    var res = { ok: false, values: {}, steps: [], error: null, known: have };
    if (have.length !== 3) { res.error = have.length < 3 ? 'err_need3' : 'err_only3'; return res; }
    if ('t' in k && !(k.t > 0)) { res.error = 'err_t'; return res; }
    var u = k.u, v = k.v, a = k.a, t = k.t, s = k.s, st = [];
    var H = '½';
    function step(find, eq, lines) { st.push({ find: find, eq: eq, lines: lines }); }
    function sq(x) { return fmt(x) + '²'; }
    function root(find, val, sign) {
      if (val < -1e-9) return false;
      var r = Math.sqrt(Math.max(0, val)) * sign;
      return r;
    }
    try {
      if ('u' in k && 'a' in k && 't' in k) {
        v = u + a * t;
        step('v', 'e1', ['v = ' + fmt(u) + ' + ' + fmt(a) + ' × ' + fmt(t), 'v = ' + fmt(v) + ' m/s']);
        s = u * t + 0.5 * a * t * t;
        step('s', 'e2', ['s = ' + fmt(u) + ' × ' + fmt(t) + ' + ' + H + ' × ' + fmt(a) + ' × ' + sq(t), 's = ' + fmt(u * t) + ' + ' + fmt(0.5 * a * t * t), 's = ' + fmt(s) + ' m']);
      } else if ('u' in k && 'v' in k && 't' in k) {
        a = (v - u) / t;
        step('a', 'e1', ['a = (v − u) / t', 'a = (' + fmt(v) + ' − ' + fmt(u) + ') / ' + fmt(t), 'a = ' + fmt(a) + ' m/s²']);
        s = (u + v) / 2 * t;
        step('s', 'e4', ['s = (' + fmt(u) + ' + ' + fmt(v) + ') × ' + fmt(t) + ' / 2', 's = ' + fmt(s) + ' m']);
      } else if ('u' in k && 'v' in k && 'a' in k) {
        if (a === 0) { res.error = u === v ? 'err_a0' : 'err_impossible'; return res; }
        t = (v - u) / a;
        if (t < 0) { res.error = 'err_negt'; return res; }
        step('t', 'e1', ['t = (v − u) / a', 't = (' + fmt(v) + ' − ' + fmt(u) + ') / ' + fmt(a), 't = ' + fmt(t) + ' s']);
        s = (v * v - u * u) / (2 * a);
        step('s', 'e3', ['s = (v² − u²) / 2a', 's = (' + sq(v) + ' − ' + sq(u) + ') / (2 × ' + fmt(a) + ')', 's = ' + fmt(v * v - u * u) + ' / ' + fmt(2 * a), 's = ' + fmt(s) + ' m']);
      } else if ('u' in k && 'a' in k && 's' in k) {
        var v2 = u * u + 2 * a * s;
        if (v2 < -1e-9) { res.error = 'err_root'; return res; }
        var sign = u !== 0 ? (sgn(s) === sgn(u) ? sgn(u) : sgn(a)) : (a !== 0 ? sgn(a) : 1);
        v = Math.sqrt(Math.max(0, v2)) * sign;
        step('v', 'e3', ['v² = ' + sq(u) + ' + 2 × ' + fmt(a) + ' × ' + fmt(s), 'v² = ' + fmt(v2), 'v = ' + (sign < 0 ? '−' : '') + '√' + fmt(v2) + ' = ' + fmt(v) + ' m/s']);
        if (a !== 0) { t = (v - u) / a; step('t', 'e1', ['t = (v − u) / a', 't = (' + fmt(v) + ' − ' + fmt(u) + ') / ' + fmt(a), 't = ' + fmt(t) + ' s']); }
        else if (u !== 0) { t = s / u; step('t', 'e4', ['t = s / u (a = 0)', 't = ' + fmt(s) + ' / ' + fmt(u), 't = ' + fmt(t) + ' s']); }
        else { res.error = 'err_impossible'; return res; }
        if (t < -1e-9) { res.error = 'err_negt'; return res; }
      } else if ('u' in k && 'v' in k && 's' in k) {
        if (u + v === 0) { res.error = 'err_uv0'; return res; }
        t = 2 * s / (u + v);
        if (t <= 0) { res.error = 'err_negt'; return res; }
        step('t', 'e4', ['t = 2s / (u + v)', 't = 2 × ' + fmt(s) + ' / (' + fmt(u) + ' + ' + fmt(v) + ')', 't = ' + fmt(t) + ' s']);
        a = (v * v - u * u) / (2 * s);
        step('a', 'e3', ['a = (v² − u²) / 2s', 'a = (' + sq(v) + ' − ' + sq(u) + ') / (2 × ' + fmt(s) + ')', 'a = ' + fmt(a) + ' m/s²']);
      } else if ('u' in k && 't' in k && 's' in k) {
        a = 2 * (s - u * t) / (t * t);
        step('a', 'e2', ['a = 2(s − ut) / t²', 'a = 2 × (' + fmt(s) + ' − ' + fmt(u) + ' × ' + fmt(t) + ') / ' + sq(t), 'a = ' + fmt(a) + ' m/s²']);
        v = u + a * t;
        step('v', 'e1', ['v = ' + fmt(u) + ' + ' + fmt(a) + ' × ' + fmt(t), 'v = ' + fmt(v) + ' m/s']);
      } else if ('v' in k && 'a' in k && 't' in k) {
        u = v - a * t;
        step('u', 'e1', ['u = v − at', 'u = ' + fmt(v) + ' − ' + fmt(a) + ' × ' + fmt(t), 'u = ' + fmt(u) + ' m/s']);
        s = (u + v) / 2 * t;
        step('s', 'e4', ['s = (' + fmt(u) + ' + ' + fmt(v) + ') × ' + fmt(t) + ' / 2', 's = ' + fmt(s) + ' m']);
      } else if ('v' in k && 'a' in k && 's' in k) {
        var u2 = v * v - 2 * a * s;
        if (u2 < -1e-9) { res.error = 'err_root'; return res; }
        var sg = v !== 0 ? sgn(v) : 1;
        u = Math.sqrt(Math.max(0, u2)) * sg;
        step('u', 'e3', ['u² = v² − 2as', 'u² = ' + sq(v) + ' − 2 × ' + fmt(a) + ' × ' + fmt(s), 'u² = ' + fmt(u2), 'u = ' + (sg < 0 ? '−' : '') + '√' + fmt(u2) + ' = ' + fmt(u) + ' m/s']);
        if (a === 0) { if (v === 0) { res.error = 'err_impossible'; return res; } t = s / v; step('t', 'e4', ['t = s / v (a = 0)', 't = ' + fmt(s) + ' / ' + fmt(v), 't = ' + fmt(t) + ' s']); }
        else { t = (v - u) / a; step('t', 'e1', ['t = (v − u) / a', 't = (' + fmt(v) + ' − ' + fmt(u) + ') / ' + fmt(a), 't = ' + fmt(t) + ' s']); }
        if (t < -1e-9) { res.error = 'err_negt'; return res; }
      } else if ('v' in k && 't' in k && 's' in k) {
        u = 2 * s / t - v;
        step('u', 'e4', ['u = 2s / t − v', 'u = 2 × ' + fmt(s) + ' / ' + fmt(t) + ' − ' + fmt(v), 'u = ' + fmt(u) + ' m/s']);
        a = (v - u) / t;
        step('a', 'e1', ['a = (v − u) / t', 'a = (' + fmt(v) + ' − ' + fmt(u) + ') / ' + fmt(t), 'a = ' + fmt(a) + ' m/s²']);
      } else if ('a' in k && 't' in k && 's' in k) {
        u = (s - 0.5 * a * t * t) / t;
        step('u', 'e2', ['u = (s − ' + H + 'at²) / t', 'u = (' + fmt(s) + ' − ' + H + ' × ' + fmt(a) + ' × ' + sq(t) + ') / ' + fmt(t), 'u = ' + fmt(u) + ' m/s']);
        v = u + a * t;
        step('v', 'e1', ['v = ' + fmt(u) + ' + ' + fmt(a) + ' × ' + fmt(t), 'v = ' + fmt(v) + ' m/s']);
      } else { res.error = 'err_need3'; return res; }
    } catch (e) { res.error = 'err_impossible'; return res; }
    var vals = { u: u, v: v, a: a, t: t, s: s };
    for (var key in vals) if (!fin(vals[key])) { res.error = 'err_impossible'; return res; }
    res.ok = true; res.values = vals; res.steps = st;
    return res;
  }

  /* unit helpers */
  function msToKmh(x) { return x * 3.6; }
  function kmhToMs(x) { return x / 3.6; }
  /* uniform circular motion: speed = circumference / time period */
  function circular(r, T) { return T > 0 ? 2 * Math.PI * r / T : 0; }

  window.MGL = {
    MAXSEG: MAXSEG, VMAX: VMAX, TMAX: TMAX, TMIN: TMIN, DMAX: DMAX,
    cleanSeg: cleanSeg, cleanSegs: cleanSegs, build: build, at: at, slope: slope, areaParts: areaParts, samples: samples,
    solve: solve, msToKmh: msToKmh, kmhToMs: kmhToMs, circular: circular, round: round, num: num, KEYS: KEYS
  };
})();
