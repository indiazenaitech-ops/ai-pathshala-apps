/* Trigonometry Lab: maths engine (window.TRIG). Pure functions: no DOM, no strings to translate.
   - ratios(deg): the six ratios (null = not defined), computed from the reference angle so 180° gives exactly 0.
   - exact(deg): NCERT-style exact strings (1/2, √3/2, 1/√2, 1/√3, 2/√3) for every multiple of 30° and 45°.
   - surd arithmetic (a + b√r with rational a, b; r = 2 or 3) so heights-and-distances answers come out as 10√3.
   - parseAngle / parseValue / inverse (principal values) / solveHD (NCERT Class 10 cases a–e) / drillSet. */
(function () {
  'use strict';
  var PI = Math.PI, RAD = PI / 180, MINUS = '−';
  var FNS = ['sin', 'cos', 'tan', 'cosec', 'sec', 'cot'];
  var STD = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
  var BIG = Math.pow(2, 50);

  function near(a, b, eps) { return Math.abs(a - b) < (eps || 1e-7); }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function normDeg(d) { d = Number(d); if (!isFinite(d)) return 0; d = d % 360; if (d < 0) d += 360; if (near(d, 360)) d = 0; return Math.abs(d) < 1e-9 ? 0 : d; }
  function refAngle(d) { d = normDeg(d); var r = d % 180; if (r > 90) r = 180 - r; if (near(r, Math.round(r))) r = Math.round(r); return r; }
  function quadrant(d) { d = normDeg(d); var m = d % 90; if (near(m, 0) || near(m, 90)) return 0; return Math.floor(d / 90) + 1; }
  function isStandard(d) { var r = refAngle(d); return [0, 30, 45, 60, 90].some(function (s) { return near(r, s); }); }
  function snap(d) { var n = normDeg(d), best = 0, bd = 1e9; STD.concat([360]).forEach(function (s) { var x = Math.abs(s - n); if (x < bd) { bd = x; best = s; } }); return normDeg(best); }
  function nextStd(d, dir) {
    var n = normDeg(d);
    if (dir > 0) { for (var i = 0; i < STD.length; i++) if (STD[i] > n + 1e-7) return STD[i]; return 0; }
    for (var j = STD.length - 1; j >= 0; j--) if (STD[j] < n - 1e-7) return STD[j];
    return 330;
  }

  /* ---------- numeric ratios ---------- */
  function ratios(deg) {
    var d = normDeg(deg), r = refAngle(d), s, c;
    if (near(r, 0)) { s = 0; c = 1; }
    else if (near(r, 90)) { s = 1; c = 0; }
    else if (near(r, 45)) { s = Math.SQRT1_2; c = Math.SQRT1_2; }
    else if (near(r, 30)) { s = 0.5; c = Math.sqrt(3) / 2; }
    else if (near(r, 60)) { s = Math.sqrt(3) / 2; c = 0.5; }
    else { s = Math.sin(r * RAD); c = Math.cos(r * RAD); }
    if (d > 180 + 1e-9) s = -s;
    if (d > 90 + 1e-9 && d < 270 - 1e-9) c = -c;
    s += 0; c += 0;
    return { sin: s, cos: c, tan: c === 0 ? null : s / c + 0, cosec: s === 0 ? null : 1 / s, sec: c === 0 ? null : 1 / c, cot: s === 0 ? null : c / s + 0 };
  }

  /* ---------- exact strings (absolute values by reference angle; null = not defined) ---------- */
  var EX = {
    0: { sin: '0', cos: '1', tan: '0', cosec: null, sec: '1', cot: null },
    30: { sin: '1/2', cos: '√3/2', tan: '1/√3', cosec: '2', sec: '2/√3', cot: '√3' },
    45: { sin: '1/√2', cos: '1/√2', tan: '1', cosec: '√2', sec: '√2', cot: '1' },
    60: { sin: '√3/2', cos: '1/2', tan: '√3', cosec: '2/√3', sec: '2', cot: '1/√3' },
    90: { sin: '1', cos: '0', tan: null, cosec: '1', sec: null, cot: '0' }
  };
  function exact(deg) {
    if (!isStandard(deg)) return null;
    var r = Math.round(refAngle(deg)), row = EX[r], num = ratios(deg), out = {};
    FNS.forEach(function (f) {
      var s = row[f];
      if (s === null || num[f] === null) { out[f] = null; return; }
      out[f] = (num[f] < 0 && s !== '0') ? MINUS + s : s;
    });
    return out;
  }
  /* memory trick row: √0/2 … √4/2 */
  var TRICK = { sin: ['√0/2', '√1/2', '√2/2', '√3/2', '√4/2'], cos: ['√4/2', '√3/2', '√2/2', '√1/2', '√0/2'] };

  /* ---------- radians ---------- */
  function radFrac(deg) {
    var n = Math.round(deg);
    if (!near(deg, n, 1e-6)) return null;
    if (n === 0) return '0';
    var g = gcd(n, 180), p = n / g, q = 180 / g, sign = p < 0 ? MINUS : '';
    p = Math.abs(p);
    var top = (p === 1 ? '' : p) + 'π';
    return sign + (q === 1 ? top : top + '/' + q);
  }
  function toRad(d) { return d * RAD; }
  function toDeg(r) { return r / RAD; }

  /* ---------- parsing ---------- */
  var ZEROS = [0x966, 0x9E6, 0xA66, 0xAE6, 0xB66, 0xBE6, 0xC66, 0xCE6, 0xD66, 0x660, 0x6F0];
  function toLatin(s) {
    return String(s == null ? '' : s).replace(/[०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯٠-٩۰-۹]/g, function (c) {
      var code = c.charCodeAt(0);
      for (var i = 0; i < ZEROS.length; i++) if (code >= ZEROS[i] && code <= ZEROS[i] + 9) return String(code - ZEROS[i]);
      return c;
    });
  }
  function clean(text) {
    return toLatin(text).toLowerCase().replace(/\s+/g, '').replace(/[−–—]/g, '-').replace(/π/g, 'pi').replace(/[×x*]/g, '*').replace(/÷/g, '/').replace(/,/g, '.');
  }
  /* "30", "-45", "390", "45°", "pi/6", "2pi/3", "-3π/4", "1.5", "1.5rad", "2*pi" → degrees. unit: 'deg' | 'rad' for bare numbers. */
  function parseAngle(text, unit) {
    var s = clean(text), forceDeg = false, forceRad = false;
    if (!s) return null;
    if (/°|deg(rees?)?$/.test(s)) { forceDeg = true; s = s.replace(/°|deg(rees?)?$/g, ''); }
    if (/rad(ians?)?$/.test(s)) { forceRad = true; s = s.replace(/rad(ians?)?$/, ''); }
    var m = /^([+-])?(\d+\.?\d*|\.\d+)?\*?(pi)?(?:\/(\d+\.?\d*|\.\d+))?$/.exec(s);
    if (!m || (!m[2] && !m[3])) return null;
    var sign = m[1] === '-' ? -1 : 1, coef = m[2] !== undefined ? parseFloat(m[2]) : 1, hasPi = !!m[3], den = m[4] !== undefined ? parseFloat(m[4]) : 1;
    if (!(den > 0) || !isFinite(coef)) return null;
    var isRad = hasPi || forceRad || (unit === 'rad' && !forceDeg);
    var val = sign * coef / den, deg = hasPi ? val * 180 : (isRad ? toDeg(val) : val);
    if (!isFinite(deg) || Math.abs(deg) > 1e7) return null;
    return { deg: deg, rad: toRad(deg), isRad: isRad, hasPi: hasPi };
  }
  /* "0.5", "1/2", "√3/2", "sqrt3/2", "-1/√2", "2/√3", "√2", "root 3", "1.7321" → number */
  function parseValue(text) {
    var s = clean(text).replace(/sqrt\(?|root\(?/g, '√').replace(/[()]/g, '');
    if (!s) return null;
    var term = '(\\d+\\.?\\d*|\\.\\d+)?(?:\\*?√(\\d+\\.?\\d*))?';
    var m = new RegExp('^([+-])?' + term + '(?:/' + term + ')?$').exec(s);
    if (!m) return null;
    function val(coef, rad, must) {
      if (coef === undefined && rad === undefined) return must ? NaN : 1;
      var c = coef === undefined ? 1 : parseFloat(coef), r = rad === undefined ? 1 : Math.sqrt(parseFloat(rad));
      return c * r;
    }
    var num = val(m[2], m[3], true), den = m[4] === undefined && m[5] === undefined ? 1 : val(m[4], m[5], true);
    if (isNaN(num) || isNaN(den) || den === 0) return null;
    return (m[1] === '-' ? -1 : 1) * num / den;
  }

  /* ---------- inverse functions: principal values ---------- */
  function inverse(fn, x) {
    if (!isFinite(x)) return { ok: false, err: 'bad' };
    var deg;
    switch (fn) {
      case 'sin': if (Math.abs(x) > 1 + 1e-12) return { ok: false, err: 'sc' }; deg = toDeg(Math.asin(Math.max(-1, Math.min(1, x)))); break;
      case 'cos': if (Math.abs(x) > 1 + 1e-12) return { ok: false, err: 'sc' }; deg = toDeg(Math.acos(Math.max(-1, Math.min(1, x)))); break;
      case 'tan': deg = toDeg(Math.atan(x)); break;
      case 'cosec': if (Math.abs(x) < 1 - 1e-12) return { ok: false, err: 'cs' }; deg = toDeg(Math.asin(Math.max(-1, Math.min(1, 1 / x)))); break;
      case 'sec': if (Math.abs(x) < 1 - 1e-12) return { ok: false, err: 'cs' }; deg = toDeg(Math.acos(Math.max(-1, Math.min(1, 1 / x)))); break;
      case 'cot': deg = x === 0 ? 90 : toDeg(Math.atan(1 / x)); if (deg < 0) deg += 180; break;
      default: return { ok: false, err: 'bad' };
    }
    var r = Math.round(deg * 1e6) / 1e6;
    if (near(r, Math.round(r), 1e-6)) r = Math.round(r);
    r += 0;
    return { ok: true, deg: r, rad: toRad(r), standard: near(r, Math.round(r), 1e-6) && Math.round(Math.abs(r)) % 15 === 0 && isStandard(Math.abs(r)) };
  }

  /* ---------- fractions and surds (a + b√r) ---------- */
  function fr(n, d) {
    if (d < 0) { n = -n; d = -d; }
    if (d === 0 || !isFinite(n) || !isFinite(d)) return null;
    var g = gcd(n, d) || 1;
    n /= g; d /= g;
    if (Math.abs(n) > BIG || d > BIG) return null;
    return { n: n, d: d };
  }
  function frFromNum(x) {
    if (!isFinite(x)) return null;
    var s = String(Math.round(x * 1e6) / 1e6);
    if (/e/i.test(s)) return null;
    var p = s.indexOf('.'), k = p < 0 ? 0 : s.length - p - 1;
    return fr(Math.round(x * Math.pow(10, k)), Math.pow(10, k));
  }
  function fAdd(a, b) { return a && b ? fr(a.n * b.d + b.n * a.d, a.d * b.d) : null; }
  function fSub(a, b) { return a && b ? fr(a.n * b.d - b.n * a.d, a.d * b.d) : null; }
  function fMul(a, b) { return a && b ? fr(a.n * b.n, a.d * b.d) : null; }
  function fDiv(a, b) { return a && b && b.n !== 0 ? fr(a.n * b.d, a.d * b.n) : null; }
  function fNum(a) { return a.n / a.d; }

  function S(a, b, r) { /* a, b fractions (or numbers), r radicand */
    a = typeof a === 'number' ? fr(a, 1) : a; b = typeof b === 'number' ? fr(b, 1) : (b || fr(0, 1));
    if (!a || !b) return null;
    return { a: a, b: b.n === 0 ? fr(0, 1) : b, r: b.n === 0 ? 0 : r };
  }
  function sFromNum(x) { var f = frFromNum(x); return f ? S(f, 0, 0) : null; }
  function sRad(x, y) { /* radicand both sides agree on, or -1 when they clash */
    if (!x.r) return y.r; if (!y.r) return x.r; return x.r === y.r ? x.r : -1;
  }
  function sAdd(x, y) { if (!x || !y) return null; var r = sRad(x, y); if (r < 0) return null; return S(fAdd(x.a, y.a), fAdd(x.b, y.b), r); }
  function sSub(x, y) { if (!x || !y) return null; var r = sRad(x, y); if (r < 0) return null; return S(fSub(x.a, y.a), fSub(x.b, y.b), r); }
  function sMul(x, y) {
    if (!x || !y) return null; var r = sRad(x, y); if (r < 0) return null;
    /* (a + b√r)(c + d√r) = ac + bd·r + (ad + bc)√r */
    var a = fAdd(fMul(x.a, y.a), fMul(fMul(x.b, y.b), fr(r || 0, 1)));
    var b = fAdd(fMul(x.a, y.b), fMul(x.b, y.a));
    return S(a, b, r);
  }
  function sDiv(x, y) {
    if (!x || !y) return null; var r = sRad(x, y); if (r < 0) return null;
    /* 1/(c + d√r) = (c − d√r)/(c² − d²r) */
    var den = fSub(fMul(y.a, y.a), fMul(fMul(y.b, y.b), fr(r || 0, 1)));
    if (!den || den.n === 0) return null;
    var conj = S(y.a, fr(-y.b.n, y.b.d), r), num = sMul(x, conj);
    if (!num) return null;
    return S(fDiv(num.a, den), fDiv(num.b, den), r);
  }
  function sNum(x) { return x ? fNum(x.a) + (x.r ? fNum(x.b) * Math.sqrt(x.r) : 0) : NaN; }
  function fracStr(f) { var sg = f.n < 0 ? MINUS : '', n = Math.abs(f.n); return sg + (f.d === 1 ? String(n) : n + '/' + f.d); }
  /* rationalised display: 10√3, 5√3/2, (4 + 4√3)/5, 75√3 − 75 */
  function sStr(x) {
    if (!x) return null;
    if (!x.r || x.b.n === 0) return fracStr(x.a);
    var Sd = x.a.d * x.b.d / gcd(x.a.d, x.b.d), P = x.a.n * (Sd / x.a.d), Q = x.b.n * (Sd / x.b.d);
    var g = gcd(gcd(P, Q), Sd) || 1; P /= g; Q /= g; Sd /= g;
    var root = (Math.abs(Q) === 1 ? '' : Math.abs(Q)) + '√' + x.r, out;
    if (P === 0) out = (Q < 0 ? MINUS : '') + root;
    else if (P > 0 && Q > 0) out = P + ' + ' + root;
    else if (P < 0 && Q > 0) out = root + ' ' + MINUS + ' ' + (-P);
    else if (P > 0 && Q < 0) out = P + ' ' + MINUS + ' ' + root;
    else out = MINUS + '(' + (-P) + ' + ' + root + ')';
    if (Sd !== 1) out = (P === 0 ? out : '(' + out + ')') + '/' + Sd;
    return out;
  }
  /* exact ratio as a surd (absolute value by reference angle, then the sign) */
  var SURD = {
    0: { sin: [0, 0, 0], cos: [1, 0, 0], tan: [0, 0, 0], cosec: null, sec: [1, 0, 0], cot: null },
    30: { sin: [[1, 2], 0, 0], cos: [0, [1, 2], 3], tan: [0, [1, 3], 3], cosec: [2, 0, 0], sec: [0, [2, 3], 3], cot: [0, 1, 3] },
    45: { sin: [0, [1, 2], 2], cos: [0, [1, 2], 2], tan: [1, 0, 0], cosec: [0, 1, 2], sec: [0, 1, 2], cot: [1, 0, 0] },
    60: { sin: [0, [1, 2], 3], cos: [[1, 2], 0, 0], tan: [0, 1, 3], cosec: [0, [2, 3], 3], sec: [2, 0, 0], cot: [0, [1, 3], 3] },
    90: { sin: [1, 0, 0], cos: [0, 0, 0], tan: null, cosec: [1, 0, 0], sec: null, cot: [0, 0, 0] }
  };
  function exactSurd(fn, deg) {
    if (!isStandard(deg)) return null;
    var row = SURD[Math.round(refAngle(deg))][fn];
    if (!row) return null;
    var toF = function (v) { return Array.isArray(v) ? fr(v[0], v[1]) : fr(v, 1); };
    var s = S(toF(row[0]), toF(row[1]), row[2]), num = ratios(deg)[fn];
    if (num !== null && num < 0) s = S(fr(-s.a.n, s.a.d), fr(-s.b.n, s.b.d), s.r);
    return s;
  }

  /* ---------- heights and distances ---------- */
  /* quantities: { val, surd|null, kind: 'len' | 'ratio', ex (ratio strings) } */
  function qLen(val, surd) { return { kind: 'len', val: val, surd: surd || null }; }
  function qNum(x) { return qLen(x, sFromNum(x)); }
  function qRatio(fn, a) { var ex = exact(a); return { kind: 'ratio', val: ratios(a)[fn], surd: exactSurd(fn, a), ex: ex ? ex[fn] : null }; }
  function qMul(x, y) { return qLen(x.val * y.val, sMul(x.surd, y.surd)); }
  function qDiv(x, y) { return qLen(x.val / y.val, sDiv(x.surd, y.surd)); }
  function qAdd(x, y) { return qLen(x.val + y.val, sAdd(x.surd, y.surd)); }
  function qSub(x, y) { return qLen(x.val - y.val, sSub(x.surd, y.surd)); }
  function asRatio(q) { var ex = sStr(q.surd); return { kind: 'ratio', val: q.val, ex: ex }; }
  function okAngle(a) { return isFinite(a) && a > 0 && a < 90; }
  function pos(x) { return isFinite(x) && x > 0; }

  function solveHD(c, v) {
    var out = { ok: false, err: null, results: [], steps: [], geo: {} };
    var fail = function (k) { out.err = k; return out; };
    var R = function (key, q) { out.results.push({ key: key, val: q.val, surd: q.surd, ex: sStr(q.surd) }); };
    var ST = function (key, vars) { out.steps.push({ key: key, vars: vars || {} }); };
    var e = isFinite(v.e) && v.e > 0 ? v.e : 0, A1 = Number(v.a1), A2 = Number(v.a2);
    var t1, t2, h, d, total;
    switch (c) {
      case 'a': {
        if (!pos(v.d)) return fail('hd_err_pos');
        if (!okAngle(A1)) return fail('hd_err_angle');
        t1 = qRatio('tan', A1); d = qNum(v.d);
        h = qMul(d, t1); total = e > 0 ? qAdd(h, qNum(e)) : h;
        ST('st_tri'); ST('st_a_def', { a: A1 });
        ST('st_ratio', { fn: 'tan', a: A1, v: t1 });
        ST('st_a', { d: v.d, a: A1, t: t1, ans: h });
        if (e > 0) ST('st_eye', { h: h, e: e, total: total });
        R('res_height', total);
        out.geo = { d: v.d, h: h.val, e: e, a1: A1 };
        break;
      }
      case 'b': {
        if (!pos(v.H)) return fail('hd_err_pos');
        if (!okAngle(A1)) return fail('hd_err_angle');
        var hasB = isFinite(A2) && A2 > 0;
        if (hasB && !okAngle(A2)) return fail('hd_err_angle');
        var Hq = e > 0 ? qAdd(qNum(v.H), qNum(e)) : qNum(v.H);
        t1 = qRatio('tan', A1); d = qDiv(Hq, t1);
        ST('st_b1'); if (e > 0) ST('st_b_eye', { H: v.H, e: e, total: Hq });
        ST('st_ratio', { fn: 'tan', a: A1, v: t1 });
        ST('st_b2', { a: A1, H: Hq.val, t: t1, ans: d });
        R('res_dist', d);
        out.geo = { H: Hq.val, d1: d.val, a1: A1 };
        if (hasB) {
          t2 = qRatio('tan', A2); var d2 = qDiv(Hq, t2), gap = d.val >= d2.val ? qSub(d, d2) : qSub(d2, d);
          ST('st_ratio', { fn: 'tan', a: A2, v: t2 });
          ST('st_b3', { a: A2, H: Hq.val, t: t2, ans: d2 });
          ST('st_b4', { d1: Math.max(d.val, d2.val), d2: Math.min(d.val, d2.val), ans: gap });
          R('res_d2', d2); R('res_gap', gap);
          out.geo.d2 = d2.val; out.geo.a2 = A2;
        }
        break;
      }
      case 'c': {
        if (!pos(v.d)) return fail('hd_err_pos');
        if (!okAngle(A1) || !okAngle(A2)) return fail('hd_err_angle');
        d = qNum(v.d);
        var c1 = qRatio('cot', A1), c2 = qRatio('cot', A2);
        if (v.side === 'opp') {
          var sum = qAdd(c1, c2); h = qDiv(d, sum);
          var x1 = qMul(h, c1), x2 = qMul(h, c2);
          ST('st_tri'); ST('st_ratio', { fn: 'cot', a: A1, v: c1 }); ST('st_ratio', { fn: 'cot', a: A2, v: c2 });
          ST('st_c1o', { a: A1, c1: c1 }); ST('st_c2o', { b: A2, c2: c2 });
          ST('st_c3o', { d: v.d, c1: c1, c2: c2, sum: asRatio(sum), ans: h });
          ST('st_c4o', { x1: x1, x2: x2 });
          total = e > 0 ? qAdd(h, qNum(e)) : h;
          if (e > 0) ST('st_eye', { h: h, e: e, total: total });
          R('res_height', total); R('res_x1', x1); R('res_x2', x2);
          out.geo = { side: 'opp', h: h.val, x1: x1.val, x2: x2.val, a1: A1, a2: A2, e: e, d: v.d };
        } else {
          if (!(A1 > A2)) return fail('hd_err_order');
          var diff = qSub(c2, c1); h = qDiv(d, diff);
          var x = qMul(h, c1);
          ST('st_tri'); ST('st_ratio', { fn: 'cot', a: A1, v: c1 }); ST('st_ratio', { fn: 'cot', a: A2, v: c2 });
          ST('st_c1', { a: A1, c1: c1 }); ST('st_c2', { b: A2, d: v.d, c2: c2 });
          ST('st_c3', { d: v.d, c1: c1, c2: c2, diff: asRatio(diff), ans: h });
          ST('st_c4', { a: A1, ans: x });
          total = e > 0 ? qAdd(h, qNum(e)) : h;
          if (e > 0) ST('st_eye', { h: h, e: e, total: total });
          R('res_height', total); R('res_x', x);
          out.geo = { side: 'same', h: h.val, x: x.val, d: v.d, a1: A1, a2: A2, e: e };
        }
        break;
      }
      case 'd': {
        if (!okAngle(A1) || !okAngle(A2)) return fail('hd_err_angle');
        if (!(A2 > A1)) return fail('hd_err_flag');
        t1 = qRatio('tan', A1); t2 = qRatio('tan', A2);
        var f;
        ST('st_tri'); ST('st_ratio', { fn: 'tan', a: A1, v: t1 }); ST('st_ratio', { fn: 'tan', a: A2, v: t2 });
        if (v.known === 'flag') {
          if (!pos(v.f)) return fail('hd_err_pos');
          f = qNum(v.f); var dif = qSub(t2, t1); d = qDiv(f, dif); h = qMul(d, t1);
          ST('st_d1f', { a: A1, b: A2, f: v.f, t1: t1, t2: t2 });
          ST('st_d2f', { f: v.f, t1: t1, t2: t2, diff: asRatio(dif), ans: d });
          ST('st_d3f', { d: d.val, t1: t1, ans: h });
        } else {
          if (!pos(v.d)) return fail('hd_err_pos');
          d = qNum(v.d); h = qMul(d, t1); var hf = qMul(d, t2); f = qSub(hf, h);
          ST('st_d1', { a: A1, d: v.d, t1: t1, ans: h });
          ST('st_d2', { b: A2, d: v.d, t2: t2, ans: hf });
          ST('st_d3', { hf: hf.val, h: h.val, ans: f });
        }
        total = e > 0 ? qAdd(h, qNum(e)) : h;
        if (e > 0) ST('st_eye', { h: h, e: e, total: total });
        R('res_tower', total); R('res_flag', f); R('res_dist', d);
        out.geo = { d: d.val, h: h.val, f: f.val, a1: A1, a2: A2, e: e };
        break;
      }
      case 'e': {
        if (!okAngle(A1)) return fail('hd_err_angle');
        var sn = qRatio('sin', A1), cs = qRatio('cos', A1), L, hh, xx;
        ST('st_e1', { a: A1 });
        ST('st_ratio', { fn: 'sin', a: A1, v: sn }); ST('st_ratio', { fn: 'cos', a: A1, v: cs });
        if (v.known === 'h') {
          if (!pos(v.h)) return fail('hd_err_pos');
          hh = qNum(v.h); L = qDiv(hh, sn); xx = qMul(L, cs);
          ST('st_e2h', { h: v.h, a: A1, s: sn, ans: L });
          ST('st_e3', { L: L.val, a: A1, c: cs, ans: xx });
          R('res_ladder', L); R('res_foot', xx);
        } else if (v.known === 'x') {
          if (!pos(v.x)) return fail('hd_err_pos');
          xx = qNum(v.x); L = qDiv(xx, cs); hh = qMul(L, sn);
          ST('st_e2x', { x: v.x, a: A1, c: cs, ans: L });
          ST('st_e2', { L: L.val, a: A1, s: sn, ans: hh });
          R('res_ladder', L); R('res_wall', hh);
        } else {
          if (!pos(v.L)) return fail('hd_err_pos');
          L = qNum(v.L); hh = qMul(L, sn); xx = qMul(L, cs);
          ST('st_e2', { L: v.L, a: A1, s: sn, ans: hh });
          ST('st_e3', { L: v.L, a: A1, c: cs, ans: xx });
          R('res_wall', hh); R('res_foot', xx);
        }
        out.geo = { L: L.val, h: hh.val, x: xx.val, a1: A1 };
        break;
      }
      default: return fail('hd_err_pos');
    }
    out.ok = true;
    return out;
  }

  /* ---------- drill / worksheet questions on standard values ---------- */
  function rnd(n) { return Math.floor(Math.random() * n); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  /* level 1: 0°–90° (Class 10), level 2: 0°–360° (Class 11). answer/options: exact strings, null = not defined */
  function drillSet(level, n) {
    var angles = level === 2 ? STD : [0, 30, 45, 60, 90], pairs = [], used = {}, guard = 0;
    while (pairs.length < n && guard++ < 1000) {
      var fn = FNS[rnd(FNS.length)], a = angles[rnd(angles.length)], k = fn + a;
      if (used[k]) continue;
      used[k] = 1;
      pairs.push(makeQ(fn, a, angles));
    }
    return pairs;
  }
  function makeQ(fn, a, angles) {
    var ans = exact(a)[fn], pool = {}, opts = [];
    angles.forEach(function (x) { var s = exact(x)[fn]; pool[s === null ? 'ND' : s] = s; });
    if (fn === 'tan' || fn === 'sec' || fn === 'cosec' || fn === 'cot') pool.ND = null;
    Object.keys(pool).forEach(function (k) { var s = pool[k]; if (s !== ans) opts.push(s); });
    opts = shuffle(opts).slice(0, 3);
    opts.push(ans);
    return { fn: fn, deg: a, answer: ans, options: shuffle(opts) };
  }

  window.TRIG = {
    PI: PI, RAD: RAD, FNS: FNS, STD: STD, MINUS: MINUS, TRICK: TRICK, EX: EX,
    near: near, normDeg: normDeg, refAngle: refAngle, quadrant: quadrant, isStandard: isStandard, snap: snap, nextStd: nextStd,
    ratios: ratios, exact: exact, exactSurd: exactSurd, radFrac: radFrac, toRad: toRad, toDeg: toDeg,
    parseAngle: parseAngle, parseValue: parseValue, inverse: inverse, toLatin: toLatin,
    surd: { S: S, fromNum: sFromNum, add: sAdd, sub: sSub, mul: sMul, div: sDiv, num: sNum, str: sStr },
    solveHD: solveHD, drillSet: drillSet, makeQ: makeQ
  };
})();
