/* Area & Volume Lab: shape definitions + formulas with step-by-step working.
   window.ML_SHAPES.compute(shape, vals, piMode, nf) → { err, res:[{k, v, d, f, s:[...]}], notes:[] }
   k = result key (strings: r_<k>), v = value, d = power of the unit (1 length, 2 area, 3 volume),
   f = formula in symbols, s = substitution lines. nf(x) formats a number for the working. */
(function () {
  'use strict';

  var MAX = 1000000;
  function piVal(m) { return m === '314' ? 3.14 : 22 / 7; }
  function piStr(m) { return m === '314' ? '3.14' : '22/7'; }

  /* dims: [id, label key, symbol, default] */
  var DEFS = {
    square:        { g: 2, dims: [['a', 'd_side', 'a', 10]] },
    rectangle:     { g: 2, dims: [['l', 'd_length', 'l', 12], ['b', 'd_breadth', 'b', 5]] },
    tri_bh:        { g: 2, dims: [['b', 'd_base', 'b', 10], ['h', 'd_height', 'h', 6]] },
    tri_heron:     { g: 2, dims: [['a', 'd_side_a', 'a', 13], ['b', 'd_side_b', 'b', 14], ['c', 'd_side_c', 'c', 15]] },
    parallelogram: { g: 2, dims: [['b', 'd_base', 'b', 12], ['a', 'd_slant_side', 'a', 8], ['h', 'd_height', 'h', 6]] },
    rhombus:       { g: 2, dims: [['d1', 'd_diag1', 'd₁', 16], ['d2', 'd_diag2', 'd₂', 12]] },
    trapezium:     { g: 2, dims: [['a', 'd_par_a', 'a', 16], ['b', 'd_par_b', 'b', 10], ['h', 'd_height', 'h', 4]] },
    circle:        { g: 2, dims: [['r', 'd_radius', 'r', 7]] },
    semicircle:    { g: 2, dims: [['r', 'd_radius', 'r', 7]] },
    ring:          { g: 2, dims: [['R', 'd_outer', 'R', 14], ['r', 'd_inner', 'r', 7]] },
    cube:          { g: 3, dims: [['a', 'd_edge', 'a', 5]] },
    cuboid:        { g: 3, dims: [['l', 'd_length', 'l', 10], ['b', 'd_breadth', 'b', 8], ['h', 'd_height', 'h', 5]] },
    cylinder:      { g: 3, dims: [['r', 'd_radius', 'r', 7], ['h', 'd_height', 'h', 10]] },
    cone:          { g: 3, dims: [['r', 'd_radius', 'r', 7], ['h', 'd_height', 'h', 24]] },
    sphere:        { g: 3, dims: [['r', 'd_radius', 'r', 7]] },
    hemisphere:    { g: 3, dims: [['r', 'd_radius', 'r', 7]] },
    frustum:       { g: 3, dims: [['r1', 'd_r1', 'r₁', 14], ['r2', 'd_r2', 'r₂', 7], ['h', 'd_height', 'h', 24]] }
  };
  var ORDER2 = ['square', 'rectangle', 'tri_bh', 'tri_heron', 'parallelogram', 'rhombus', 'trapezium', 'circle', 'semicircle', 'ring'];
  var ORDER3 = ['cube', 'cuboid', 'cylinder', 'cone', 'sphere', 'hemisphere', 'frustum'];

  /* which results a practice question may ask for */
  var ASK = {
    square: ['area', 'perimeter'], rectangle: ['area', 'perimeter'], tri_bh: ['area'], tri_heron: ['area'],
    parallelogram: ['area', 'perimeter'], rhombus: ['area', 'perimeter'], trapezium: ['area'],
    circle: ['area', 'circumference'], semicircle: ['area', 'perimeter'], ring: ['area'],
    cube: ['volume', 'lsa', 'tsa'], cuboid: ['volume', 'lsa', 'tsa'], cylinder: ['volume', 'csa', 'tsa'],
    cone: ['volume', 'csa', 'tsa', 'slant'], sphere: ['volume', 'sa'], hemisphere: ['volume', 'csa', 'tsa'],
    frustum: ['volume', 'csa', 'tsa']
  };

  function defaults(shape) {
    var o = {};
    DEFS[shape].dims.forEach(function (d) { o[d[0]] = d[3]; });
    return o;
  }

  function compute(shape, vals, pm, nf) {
    nf = nf || function (x) { return String(Math.round(x * 10000) / 10000); };
    var def = DEFS[shape];
    if (!def) return { err: 'err_positive', res: [], notes: [] };
    var v = {}, bad = false, big = false;
    def.dims.forEach(function (d) {
      var x = Number(vals && vals[d[0]]);
      if (!isFinite(x) || x <= 0 || (vals[d[0]] === '' || vals[d[0]] === null || vals[d[0]] === undefined)) bad = true;
      else if (x > MAX) big = true;
      v[d[0]] = x;
    });
    if (bad) return { err: 'err_positive', res: [], notes: [] };
    if (big) return { err: 'err_big', res: [], notes: [] };

    var P = piVal(pm), PS = piStr(pm), res = [], notes = [];
    var sq = function (x) { return nf(x) + '²'; }, cu = function (x) { return nf(x) + '³'; };
    function R(k, val, d, f, s) { res.push({ k: k, v: val, d: d, f: f, s: s || [] }); return val; }

    switch (shape) {
      case 'square': {
        var a = v.a;
        R('area', a * a, 2, 'a²', [sq(a)]);
        R('perimeter', 4 * a, 1, '4 × a', ['4 × ' + nf(a)]);
        R('diagonal', Math.SQRT2 * a, 1, '√2 × a', ['√2 × ' + nf(a), '1.4142 × ' + nf(a)]);
        break;
      }
      case 'rectangle': {
        var l = v.l, b = v.b;
        R('area', l * b, 2, 'l × b', [nf(l) + ' × ' + nf(b)]);
        R('perimeter', 2 * (l + b), 1, '2 × (l + b)', ['2 × (' + nf(l) + ' + ' + nf(b) + ')', '2 × ' + nf(l + b)]);
        R('diagonal', Math.sqrt(l * l + b * b), 1, '√(l² + b²)', ['√(' + sq(l) + ' + ' + sq(b) + ')', '√(' + nf(l * l) + ' + ' + nf(b * b) + ')', '√' + nf(l * l + b * b)]);
        break;
      }
      case 'tri_bh': {
        R('area', v.b * v.h / 2, 2, '½ × b × h', ['½ × ' + nf(v.b) + ' × ' + nf(v.h)]);
        break;
      }
      case 'tri_heron': {
        var A = v.a, B = v.b, C = v.c;
        if (A + B <= C || B + C <= A || A + C <= B) return { err: 'err_triangle', res: [], notes: [], bad: ['a', 'b', 'c'] };
        var per = R('perimeter', A + B + C, 1, 'a + b + c', [nf(A) + ' + ' + nf(B) + ' + ' + nf(C)]);
        var s = R('s', per / 2, 1, '(a + b + c) ÷ 2', [nf(per) + ' ÷ 2']);
        var prod = s * (s - A) * (s - B) * (s - C);
        R('area', Math.sqrt(prod), 2, '√(s(s − a)(s − b)(s − c))', [
          '√(' + nf(s) + ' × (' + nf(s) + ' − ' + nf(A) + ') × (' + nf(s) + ' − ' + nf(B) + ') × (' + nf(s) + ' − ' + nf(C) + '))',
          '√(' + nf(s) + ' × ' + nf(s - A) + ' × ' + nf(s - B) + ' × ' + nf(s - C) + ')',
          '√' + nf(prod)]);
        notes.push('note_heron');
        break;
      }
      case 'parallelogram': {
        if (v.h > v.a) return { err: 'err_para', res: [], notes: [], bad: ['a', 'h'] };
        R('area', v.b * v.h, 2, 'b × h', [nf(v.b) + ' × ' + nf(v.h)]);
        R('perimeter', 2 * (v.a + v.b), 1, '2 × (a + b)', ['2 × (' + nf(v.a) + ' + ' + nf(v.b) + ')', '2 × ' + nf(v.a + v.b)]);
        break;
      }
      case 'rhombus': {
        var p = v.d1 / 2, q = v.d2 / 2;
        var side = R('side', Math.sqrt(p * p + q * q), 1, '√((d₁ ÷ 2)² + (d₂ ÷ 2)²)', ['√(' + sq(p) + ' + ' + sq(q) + ')', '√(' + nf(p * p) + ' + ' + nf(q * q) + ')', '√' + nf(p * p + q * q)]);
        R('area', v.d1 * v.d2 / 2, 2, '½ × d₁ × d₂', ['½ × ' + nf(v.d1) + ' × ' + nf(v.d2)]);
        R('perimeter', 4 * side, 1, '4 × a', ['4 × ' + nf(side)]);
        break;
      }
      case 'trapezium': {
        var ta = v.a, tb = v.b, th = v.h, off = Math.abs(ta - tb) / 2;
        R('area', (ta + tb) * th / 2, 2, '½ × (a + b) × h', ['½ × (' + nf(ta) + ' + ' + nf(tb) + ') × ' + nf(th), '½ × ' + nf(ta + tb) + ' × ' + nf(th)]);
        var leg = R('leg', Math.sqrt(th * th + off * off), 1, '√(h² + ((a − b) ÷ 2)²)', ['√(' + sq(th) + ' + ' + sq(off) + ')', '√(' + nf(th * th) + ' + ' + nf(off * off) + ')', '√' + nf(th * th + off * off)]);
        R('perimeter', ta + tb + 2 * leg, 1, 'a + b + 2 × c', [nf(ta) + ' + ' + nf(tb) + ' + 2 × ' + nf(leg)]);
        notes.push('note_trap');
        break;
      }
      case 'circle': {
        var r = v.r;
        R('diameter', 2 * r, 1, '2 × r', ['2 × ' + nf(r)]);
        R('circumference', 2 * P * r, 1, '2 × π × r', ['2 × ' + PS + ' × ' + nf(r)]);
        R('area', P * r * r, 2, 'π × r²', [PS + ' × ' + sq(r), PS + ' × ' + nf(r * r)]);
        break;
      }
      case 'semicircle': {
        var sr = v.r;
        R('area', P * sr * sr / 2, 2, '½ × π × r²', ['½ × ' + PS + ' × ' + sq(sr), '½ × ' + PS + ' × ' + nf(sr * sr)]);
        R('perimeter', P * sr + 2 * sr, 1, 'π × r + 2 × r', [PS + ' × ' + nf(sr) + ' + 2 × ' + nf(sr), nf(P * sr) + ' + ' + nf(2 * sr)]);
        break;
      }
      case 'ring': {
        if (v.R <= v.r) return { err: 'err_ring', res: [], notes: [], bad: ['R', 'r'] };
        R('width', v.R - v.r, 1, 'R − r', [nf(v.R) + ' − ' + nf(v.r)]);
        R('area', P * (v.R * v.R - v.r * v.r), 2, 'π × (R² − r²)', [PS + ' × (' + sq(v.R) + ' − ' + sq(v.r) + ')', PS + ' × (' + nf(v.R * v.R) + ' − ' + nf(v.r * v.r) + ')', PS + ' × ' + nf(v.R * v.R - v.r * v.r)]);
        break;
      }
      case 'cube': {
        var e = v.a;
        R('volume', e * e * e, 3, 'a³', [cu(e)]);
        R('lsa', 4 * e * e, 2, '4 × a²', ['4 × ' + sq(e), '4 × ' + nf(e * e)]);
        R('tsa', 6 * e * e, 2, '6 × a²', ['6 × ' + sq(e), '6 × ' + nf(e * e)]);
        R('diagonal', Math.sqrt(3) * e, 1, '√3 × a', ['√3 × ' + nf(e), '1.7321 × ' + nf(e)]);
        break;
      }
      case 'cuboid': {
        var L = v.l, Bb = v.b, H = v.h;
        R('volume', L * Bb * H, 3, 'l × b × h', [nf(L) + ' × ' + nf(Bb) + ' × ' + nf(H)]);
        R('lsa', 2 * H * (L + Bb), 2, '2 × h × (l + b)', ['2 × ' + nf(H) + ' × (' + nf(L) + ' + ' + nf(Bb) + ')', '2 × ' + nf(H) + ' × ' + nf(L + Bb)]);
        R('tsa', 2 * (L * Bb + Bb * H + H * L), 2, '2 × (lb + bh + hl)', ['2 × (' + nf(L) + ' × ' + nf(Bb) + ' + ' + nf(Bb) + ' × ' + nf(H) + ' + ' + nf(H) + ' × ' + nf(L) + ')', '2 × (' + nf(L * Bb) + ' + ' + nf(Bb * H) + ' + ' + nf(H * L) + ')', '2 × ' + nf(L * Bb + Bb * H + H * L)]);
        R('diagonal', Math.sqrt(L * L + Bb * Bb + H * H), 1, '√(l² + b² + h²)', ['√(' + sq(L) + ' + ' + sq(Bb) + ' + ' + sq(H) + ')', '√(' + nf(L * L) + ' + ' + nf(Bb * Bb) + ' + ' + nf(H * H) + ')', '√' + nf(L * L + Bb * Bb + H * H)]);
        break;
      }
      case 'cylinder': {
        var cr = v.r, ch = v.h;
        R('volume', P * cr * cr * ch, 3, 'π × r² × h', [PS + ' × ' + sq(cr) + ' × ' + nf(ch), PS + ' × ' + nf(cr * cr) + ' × ' + nf(ch)]);
        R('csa', 2 * P * cr * ch, 2, '2 × π × r × h', ['2 × ' + PS + ' × ' + nf(cr) + ' × ' + nf(ch)]);
        R('tsa', 2 * P * cr * (cr + ch), 2, '2 × π × r × (r + h)', ['2 × ' + PS + ' × ' + nf(cr) + ' × (' + nf(cr) + ' + ' + nf(ch) + ')', '2 × ' + PS + ' × ' + nf(cr) + ' × ' + nf(cr + ch)]);
        notes.push('note_cyl');
        break;
      }
      case 'cone': {
        var kr = v.r, kh = v.h;
        var sl = R('slant', Math.sqrt(kr * kr + kh * kh), 1, '√(r² + h²)', ['√(' + sq(kr) + ' + ' + sq(kh) + ')', '√(' + nf(kr * kr) + ' + ' + nf(kh * kh) + ')', '√' + nf(kr * kr + kh * kh)]);
        R('volume', P * kr * kr * kh / 3, 3, '⅓ × π × r² × h', ['⅓ × ' + PS + ' × ' + sq(kr) + ' × ' + nf(kh), '⅓ × ' + PS + ' × ' + nf(kr * kr) + ' × ' + nf(kh)]);
        R('csa', P * kr * sl, 2, 'π × r × l', [PS + ' × ' + nf(kr) + ' × ' + nf(sl)]);
        R('tsa', P * kr * (sl + kr), 2, 'π × r × (l + r)', [PS + ' × ' + nf(kr) + ' × (' + nf(sl) + ' + ' + nf(kr) + ')', PS + ' × ' + nf(kr) + ' × ' + nf(sl + kr)]);
        break;
      }
      case 'sphere': {
        var gr = v.r;
        R('volume', 4 / 3 * P * gr * gr * gr, 3, '4/3 × π × r³', ['4/3 × ' + PS + ' × ' + cu(gr), '4/3 × ' + PS + ' × ' + nf(gr * gr * gr)]);
        R('sa', 4 * P * gr * gr, 2, '4 × π × r²', ['4 × ' + PS + ' × ' + sq(gr), '4 × ' + PS + ' × ' + nf(gr * gr)]);
        break;
      }
      case 'hemisphere': {
        var hr = v.r;
        R('volume', 2 / 3 * P * hr * hr * hr, 3, '⅔ × π × r³', ['⅔ × ' + PS + ' × ' + cu(hr), '⅔ × ' + PS + ' × ' + nf(hr * hr * hr)]);
        R('csa', 2 * P * hr * hr, 2, '2 × π × r²', ['2 × ' + PS + ' × ' + sq(hr), '2 × ' + PS + ' × ' + nf(hr * hr)]);
        R('tsa', 3 * P * hr * hr, 2, '3 × π × r²', ['3 × ' + PS + ' × ' + sq(hr), '3 × ' + PS + ' × ' + nf(hr * hr)]);
        notes.push('note_hemi');
        break;
      }
      case 'frustum': {
        var r1 = v.r1, r2 = v.r2, fh = v.h, dr = Math.abs(r1 - r2);
        var fl = R('slant', Math.sqrt(fh * fh + dr * dr), 1, '√(h² + (r₁ − r₂)²)', ['√(' + sq(fh) + ' + ' + sq(dr) + ')', '√(' + nf(fh * fh) + ' + ' + nf(dr * dr) + ')', '√' + nf(fh * fh + dr * dr)]);
        var inner = r1 * r1 + r2 * r2 + r1 * r2;
        R('volume', P * fh * inner / 3, 3, '⅓ × π × h × (r₁² + r₂² + r₁ × r₂)', [
          '⅓ × ' + PS + ' × ' + nf(fh) + ' × (' + sq(r1) + ' + ' + sq(r2) + ' + ' + nf(r1) + ' × ' + nf(r2) + ')',
          '⅓ × ' + PS + ' × ' + nf(fh) + ' × (' + nf(r1 * r1) + ' + ' + nf(r2 * r2) + ' + ' + nf(r1 * r2) + ')',
          '⅓ × ' + PS + ' × ' + nf(fh) + ' × ' + nf(inner)]);
        var csa = R('csa', P * (r1 + r2) * fl, 2, 'π × (r₁ + r₂) × l', [PS + ' × (' + nf(r1) + ' + ' + nf(r2) + ') × ' + nf(fl), PS + ' × ' + nf(r1 + r2) + ' × ' + nf(fl)]);
        var ends = P * (r1 * r1 + r2 * r2);
        R('tsa', csa + ends, 2, 'π × (r₁ + r₂) × l + π × (r₁² + r₂²)', [nf(csa) + ' + ' + PS + ' × (' + nf(r1 * r1) + ' + ' + nf(r2 * r2) + ')', nf(csa) + ' + ' + nf(ends)]);
        notes.push('note_frustum');
        break;
      }
    }
    for (var i = 0; i < res.length; i++) if (!isFinite(res[i].v)) return { err: 'err_positive', res: [], notes: [] };
    if (DEFS[shape].dims.some(function (d) { return d[0] === 'r' || d[0] === 'r1' || d[0] === 'R'; }) && pm !== '314') notes.push('note_pi');
    return { err: null, res: res, notes: notes, vals: v };
  }

  /* ---------- practice question generator ---------- */
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pk(a) { return a[Math.floor(Math.random() * a.length)]; }
  var HERON = [[13, 14, 15], [5, 5, 6], [5, 5, 8], [10, 13, 13], [9, 10, 17], [6, 8, 10], [7, 15, 20], [11, 13, 20], [17, 25, 28], [13, 13, 24], [3, 4, 5], [5, 12, 13]];
  var TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20], [7, 24, 25], [20, 21, 29]];
  var RHOMB = [[16, 12], [24, 10], [30, 16], [6, 8], [10, 24], [12, 16], [18, 24], [14, 48]];

  function gen(shape, pm) {
    var p22 = pm !== '314';
    var rad = function () { return p22 ? pk([7, 14, 21, 3.5, 28, 35, 10.5]) : ri(2, 20); };
    switch (shape) {
      case 'square': return { a: ri(3, 30) };
      case 'rectangle': { var l = ri(6, 40); return { l: l, b: ri(Math.max(2, Math.ceil(l / 5)), l - 1) }; }
      /* keep the shapes in sensible proportions so the drawing and its labels stay clear */
      case 'tri_bh': { var tb = ri(4, 30); return { b: tb, h: ri(Math.max(3, Math.ceil(tb / 3)), Math.min(24, 3 * tb)) }; }
      case 'tri_heron': { var t = pk(HERON), k = pk([1, 1, 2, 3]); return { a: t[0] * k, b: t[1] * k, c: t[2] * k }; }
      case 'parallelogram': {
        var a = ri(5, 16), ph = ri(Math.ceil(a * 0.55), a - 1), off = Math.sqrt(a * a - ph * ph), lo = Math.max(6, Math.ceil(off));
        return { b: ri(lo, Math.max(lo, Math.min(25, 3 * ph))), a: a, h: ph };
      }
      case 'rhombus': { var d = pk(RHOMB); return { d1: d[0], d2: d[1] }; }
      case 'trapezium': { var ta = ri(8, 30); return { a: ta, b: ri(4, ta - 2), h: ri(Math.max(3, Math.ceil(ta / 4)), 16) }; }
      case 'circle': case 'semicircle': case 'sphere': case 'hemisphere': return { r: rad() };
      case 'ring': {
        var rr = rad(), lo2 = Math.max(1, Math.ceil(rr / 4));
        return { r: rr, R: rr + (p22 ? pk(rr >= 21 ? [7, 14] : [7, 3.5, 14]) : ri(lo2, lo2 + 5)) };
      }
      case 'cube': return { a: ri(2, 15) };
      case 'cuboid': return { l: ri(4, 25), b: ri(3, 15), h: ri(2, 12) };
      case 'cylinder': return { r: rad(), h: ri(3, 30) };
      case 'cone': {
        if (p22) { var c = pk([[7, 24], [14, 48], [21, 28], [21, 20], [7, 24], [35, 12]]); return { r: c[0], h: c[1] }; }
        var tr = pk(TRIPLES); return (Math.random() < 0.5 && tr[1] < 2 * tr[0]) ? { r: tr[1], h: tr[0] } : { r: tr[0], h: tr[1] };
      }
      case 'frustum': {
        if (p22) { var r2 = pk([7, 14]); return { r1: r2 + 7, r2: r2, h: 24 }; }
        var f = pk(TRIPLES), b2 = ri(2, 10); return { r1: b2 + f[0], r2: b2, h: f[1] };
      }
    }
    return defaults(shape);
  }

  window.ML_SHAPES = { DEFS: DEFS, ORDER2: ORDER2, ORDER3: ORDER3, ASK: ASK, MAX: MAX, defaults: defaults, compute: compute, gen: gen, piVal: piVal, piStr: piStr };
})();
