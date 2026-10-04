/* Maths Worksheet Generator: the question engine.
   Pure maths, no DOM and no language. app.js turns these objects into HTML.
   window.WSGEN = { TOPICS, GROUPS, generate(cfg), check(q, values), plain(q), fmtInt, decStr, trimDec }

   A question object:
     { t: topic id, sig: unique key,
       parts: [tokens]            horizontal form (always present except word / txt / cmp)
       rows:  [{op, s}]           vertical (column) form, when the sum can be written in columns
       ld:    {dv, dd}            long-division form
       f: 'cmp', l: [tokens], r: [tokens]              comparison with a < > = box
       f: 'txt', key, vars: {name: [tokens]}, eq       sentence from strings.js (+ " = box" when eq)
       f: 'word', grp: 'money'|'time', tpl, v: {...}   word problem from content.js
       post: [tokens]             second line (e.g. "x = box")
       a: answer { k: 'num'|'frac'|'cmp'|'time'|'dur'|'dr'|'exp', ... } }
   Tokens: '+', '−', '×', '÷', '=', '(', ')', '[', ']', '{', '}', {n}, {n, par}, {dc: '12.5'}, {fr: [n, d], w},
           {x: coef}, {s: 'stringKey'}, {box: 1} */
(function () {
  'use strict';

  var MINUS = '−';

  /* ---------- seeded random (mulberry32) ---------- */
  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var a = (seed >>> 0) || 1;
    function f() {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    return {
      f: f,
      int: function (lo, hi) { return lo + Math.floor(f() * (hi - lo + 1)); },
      pick: function (arr) { return arr[Math.floor(f() * arr.length)]; },
      chance: function (p) { return f() < p; }
    };
  }

  /* ---------- small maths helpers ---------- */
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function P10(k) { return Math.pow(10, k); }
  function nd(R, d) { return d <= 1 ? R.int(1, 9) : R.int(P10(d - 1), P10(d) - 1); }   /* random number with d digits */
  function digitsOf(n) { return String(n).split('').reverse().map(Number); }              /* units digit first */
  function clamp(v, lo, hi) { v = Math.round(Number(v)); if (!isFinite(v)) v = lo; return Math.max(lo, Math.min(hi, v)); }
  function reduce(n, d) { var g = gcd(n, d) || 1; return [n / g, d / g]; }
  function num(v, extra) { var a = { k: 'num', v: v }; if (extra) for (var k in extra) a[k] = extra[k]; return a; }
  function properBase(R, dlo, dhi) {
    for (var i = 0; i < 200; i++) { var d = R.int(dlo, dhi), n = R.int(1, d - 1); if (gcd(n, d) === 1) return [n, d]; }
    return [1, 2];
  }

  /* Indian digit grouping: 1234567 → 12,34,567 (used in every Indian language) */
  function fmtInt(n) {
    var neg = n < 0, s = String(Math.abs(Math.round(n)));
    if (s.length > 3) s = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3);
    return (neg ? MINUS : '') + s;
  }
  /* scaled integer → decimal string with exactly dp places: (1235, 2) → "12.35" */
  function decStr(i, dp) {
    var neg = i < 0, s = String(Math.abs(i));
    if (!dp) return (neg ? MINUS : '') + s;
    while (s.length <= dp) s = '0' + s;
    return (neg ? MINUS : '') + s.slice(0, -dp) + '.' + s.slice(-dp);
  }
  function trimDec(s) { return s.indexOf('.') < 0 ? s : s.replace(/0+$/, '').replace(/\.$/, ''); }
  /* a decimal with dp places whose last decimal digit is not 0 */
  function mkDec(R, lo, hi, dp) {
    var ip = R.int(lo, hi), fp = dp ? R.int(0, P10(dp) - 1) : 0;
    if (dp && fp % 10 === 0) fp += R.int(1, 9);
    if (!dp && ip === 0) ip = 1;
    return { i: ip * P10(dp) + fp, dp: dp };
  }

  /* ---------- topics ---------- */
  var GROUPS = [
    { id: 'ops', key: 'grp_ops', topics: ['add', 'sub', 'tables', 'mul', 'div'] },
    { id: 'numbers', key: 'grp_numbers', topics: ['place', 'compare', 'round'] },
    { id: 'fd', key: 'grp_fd', topics: ['fsimp', 'fcmp', 'fadd', 'dadd', 'dmul'] },
    { id: 'alg', key: 'grp_alg', topics: ['int', 'bodmas', 'pct', 'eq'] },
    { id: 'word', key: 'grp_word', topics: ['time', 'money'] }
  ];
  /* cols = good number of columns on paper, m = on a phone; v = can be written in columns */
  var TOPICS = [
    { id: 'add', cols: 4, m: 2, v: 1, cls: '1-5' }, { id: 'sub', cols: 4, m: 2, v: 1, cls: '1-5' },
    { id: 'tables', cols: 3, m: 2, cls: '2-5' }, { id: 'mul', cols: 4, m: 2, v: 1, cls: '3-6' },
    { id: 'div', cols: 3, m: 1, v: 1, cls: '3-6' },
    { id: 'place', cols: 1, m: 1, cls: '2-5' }, { id: 'compare', cols: 3, m: 1, cls: '1-5' },
    { id: 'round', cols: 2, m: 1, cls: '3-5' },
    { id: 'fsimp', cols: 4, m: 2, cls: '4-6' }, { id: 'fcmp', cols: 4, m: 2, cls: '4-6' },
    { id: 'fadd', cols: 3, m: 1, cls: '4-7' }, { id: 'dadd', cols: 4, m: 2, v: 1, cls: '5-7' },
    { id: 'dmul', cols: 3, m: 1, cls: '6-7' },
    { id: 'int', cols: 2, m: 1, cls: '6-7' }, { id: 'bodmas', cols: 2, m: 1, cls: '5-8' },
    { id: 'pct', cols: 2, m: 1, cls: '6-8' }, { id: 'eq', cols: 3, m: 2, cls: '6-8' },
    { id: 'time', cols: 1, m: 1, cls: '3-6' }, { id: 'money', cols: 1, m: 1, cls: '2-6' }
  ];
  var TOPIC = {}; TOPICS.forEach(function (t) { TOPIC[t.id] = t; });

  /* ---------- arithmetic in columns ---------- */
  function arith(nums, op, ans) {
    var parts = [];
    nums.forEach(function (x, i) { if (i) parts.push(op); parts.push({ n: x }); });
    parts.push('=', { box: 1 });
    return {
      parts: parts,
      rows: nums.map(function (x, i) { return { op: i === nums.length - 1 ? op : '', s: String(x) }; }),
      a: num(ans), w: String(ans).length, sig: op + nums.join(',')
    };
  }
  function hasCarry(nums) {
    var carry = 0, any = false, len = Math.max.apply(null, nums.map(function (n) { return String(n).length; }));
    for (var c = 0; c < len; c++) {
      var s = carry;
      nums.forEach(function (n) { s += Math.floor(n / P10(c)) % 10; });
      if (s >= 10) any = true;
      carry = Math.floor(s / 10);
    }
    return any;
  }
  function noCarryNums(R, D, n) {
    var cols = [], c, j;
    for (c = 0; c < D; c++) {
      var lo = c === D - 1 ? 1 : 0, left = 9, ds = [];
      for (j = 0; j < n; j++) {
        var hi = left - (n - 1 - j) * lo, d = R.int(lo, Math.max(lo, hi));
        ds.push(d); left -= d;
      }
      for (var k = ds.length - 1; k > 0; k--) { var m = R.int(0, k), x = ds[k]; ds[k] = ds[m]; ds[m] = x; }
      cols.push(ds);
    }
    var nums = [];
    for (j = 0; j < n; j++) { var v = 0; for (c = 0; c < D; c++) v += cols[c][j] * P10(c); nums.push(v); }
    return nums;
  }

  function genAdd(R, o) {
    var D = o.digits, n = o.diff === 'hard' ? 3 : 2, nums = [];
    for (var t = 0; t < 300; t++) {
      if (o.carry === 'no') nums = noCarryNums(R, D, n);
      else {
        nums = [];
        for (var j = 0; j < n; j++) nums.push(nd(R, (j > 0 && D > 2 && o.diff !== 'easy' && R.chance(0.3)) ? D - 1 : D));
      }
      if (o.carry === 'yes' && !hasCarry(nums)) continue;
      break;
    }
    return arith(nums, '+', nums.reduce(function (s, x) { return s + x; }, 0));
  }

  function borrows(a, b) {
    var da = digitsOf(a), db = digitsOf(b);
    for (var i = 0; i < db.length; i++) if ((da[i] || 0) < db[i]) return true;
    return false;
  }
  function genSub(R, o) {
    var D = o.digits, a = 0, b = 0, t;
    if (D === 1) {
      if (o.carry === 'yes' || (o.carry === 'any' && R.chance(0.4))) { a = R.int(11, 18); b = R.int(a % 10 + 1, 9); }
      else { a = R.int(2, 9); b = R.int(1, a - 1); }
      return arith([a, b], MINUS, a - b);
    }
    for (t = 0; t < 400; t++) {
      if (o.carry === 'no') {
        var sa = '', sb = '';
        var shortB = R.chance(0.3);
        for (var c = 0; c < D; c++) {
          var x = R.int(c === 0 ? 1 : 0, 9), y = R.int(c === 0 && !shortB ? 1 : 0, x);
          if (c === 0 && shortB) y = 0;
          sa += x; sb += y;
        }
        a = Number(sa); b = Number(sb);
        if (b <= 0 || a === b) continue;
        break;
      }
      a = nd(R, D);
      if (o.diff === 'hard' && D >= 3 && R.chance(0.5)) {          /* zeros in the middle: 5003 − 1768 */
        var s = String(a).split('');
        for (var i = 1; i < s.length - 1; i++) if (R.chance(0.7)) s[i] = '0';
        a = Number(s.join(''));
      }
      var dB = (R.chance(0.3) && D > 1) ? D - 1 : D, lo = P10(dB - 1);
      if (a - 1 < lo) continue;
      b = R.int(lo, Math.min(a - 1, P10(dB) - 1));
      if (o.carry === 'yes' && !borrows(a, b)) continue;
      break;
    }
    return arith([a, b], MINUS, a - b);
  }

  function genTables(R, o) {
    var lo = Math.min(o.tFrom, o.tTo), hi = Math.max(o.tFrom, o.tTo);
    var a = R.int(lo, hi), b = R.int(1, 10), p = a * b, r = R.f();
    var type = o.diff === 'easy' ? 0 : o.diff === 'medium' ? (r < 0.7 ? 0 : 1) : (r < 0.4 ? 0 : r < 0.7 ? 1 : 2);
    /* w = 3 for every box: the box width must not hint whether the answer has 1, 2 or 3 digits */
    if (type === 0) return { parts: [{ n: a }, '×', { n: b }, '=', { box: 1 }], a: num(p), w: 3, sig: 'T' + a + 'x' + b };
    if (type === 1) return { parts: [{ n: a }, '×', { box: 1 }, '=', { n: p }], a: num(b), w: 3, sig: 'M' + a + 'x' + b };
    return { parts: [{ n: p }, '÷', { n: a }, '=', { box: 1 }], a: num(b), w: 3, sig: 'D' + p + '/' + a };
  }

  function genMul(R, o) {
    var pairs = o.diff === 'easy' ? [[2, 1]] : o.diff === 'medium' ? [[3, 1], [2, 2]] : [[3, 2], [4, 2], [3, 3]];
    var pr = R.pick(pairs), a = nd(R, pr[0]), b = pr[1] === 1 ? R.int(2, 9) : nd(R, pr[1]);
    var q = arith([a, b], '×', a * b);
    q.tall = pr[1] > 1 ? pr[1] : 0;
    return q;
  }

  function genDiv(R, o) {
    var dv, lo, hi;
    if (o.diff === 'easy') { dv = R.int(2, 9); lo = 10; hi = 99; }
    else if (o.diff === 'medium') { dv = R.int(2, 9); lo = 100; hi = 999; }
    else { dv = R.int(11, 35); lo = R.chance(0.5) ? 100 : 1000; hi = lo * 10 - 1; }
    var withR = o.rem === 'yes' || (o.rem === 'any' && R.chance(0.5));
    var r = withR ? R.int(1, dv - 1) : 0;
    var qlo = Math.max(2, Math.ceil((lo - r) / dv)), qhi = Math.floor((hi - r) / dv);
    var q = R.int(qlo, Math.max(qlo, qhi)), dd = q * dv + r;
    return {
      parts: [{ n: dd }, '÷', { n: dv }, '=', { box: 1 }], ld: { dv: dv, dd: dd },
      a: o.rem === 'no' ? num(q) : { k: 'dr', q: q, r: r }, w: String(dd).length, sig: dd + '/' + dv
    };
  }

  /* ---------- numbers ---------- */
  function genPlace(R, o, i) {
    var D = o.diff === 'easy' ? R.int(3, 4) : o.diff === 'medium' ? R.int(5, 6) : R.int(7, 9);
    var type = i % 3;
    if (type === 0) {
      for (var t = 0; t < 100; t++) {
        var N = nd(R, D), ds = digitsOf(N), cand = [];
        ds.forEach(function (d, k) { if (d && k > 0 && ds.indexOf(d) === ds.lastIndexOf(d)) cand.push(k); });
        if (!cand.length) continue;
        var k = R.pick(cand);
        /* the box is as wide as the number in the question, so a 9-digit answer fits (also on paper) */
        return { f: 'txt', key: 'pv_value', vars: { d: [{ n: ds[k] }], n: [{ n: N }] }, a: num(ds[k] * P10(k)), w: fmtInt(N).length, sig: 'pv' + N + ':' + k };
      }
      type = 1;
    }
    var s = String(nd(R, D)).split('');
    for (var j = 1; j < s.length; j++) if (R.chance(0.25)) s[j] = '0';
    var N2 = Number(s.join('')), terms = [];
    digitsOf(N2).forEach(function (d, k) { if (d) terms.unshift(d * P10(k)); });
    if (type === 1) return { f: 'txt', key: 'pv_expand', vars: { n: [{ n: N2 }] }, a: { k: 'exp', terms: terms }, sig: 'pe' + N2, wide: 1 };
    var parts = [];
    terms.forEach(function (x, m) { if (m) parts.push('+'); parts.push({ n: x }); });
    return { f: 'txt', key: 'pv_standard', vars: { e: parts }, a: num(N2), w: fmtInt(terms[0]).length, sig: 'ps' + N2, wide: 1 };
  }

  function genCompare(R, o) {
    var D = o.diff === 'easy' ? 2 : o.diff === 'medium' ? R.int(3, 4) : R.int(5, 7);
    var a = nd(R, D), b, r = R.f(), s;
    if (r < 0.12) b = a;
    else if (r < 0.55) {                                   /* change one digit: close numbers */
      s = String(a).split('');
      var k = R.int(0, s.length - 1), d;
      do { d = R.int(k === 0 ? 1 : 0, 9); } while (String(d) === s[k]);
      s[k] = String(d); b = Number(s.join(''));
    } else if (r < 0.75) {                                 /* swap two neighbouring digits */
      s = String(a).split('');
      var x = R.int(0, D - 2), tmp = s[x]; s[x] = s[x + 1]; s[x + 1] = tmp;
      b = s[0] === '0' ? nd(R, D) : Number(s.join(''));
    } else if (r < 0.85 && D > 2) b = nd(R, D - 1);
    else b = nd(R, D);
    if (R.chance(0.5)) { var z = a; a = b; b = z; }
    return { f: 'cmp', l: [{ n: a }], r: [{ n: b }], a: { k: 'cmp', v: a < b ? '<' : a > b ? '>' : '=' }, sig: 'c' + a + ',' + b };
  }

  function genRound(R, o) {
    var opts = o.diff === 'easy' ? [[10, 2], [10, 3]] :
      o.diff === 'medium' ? [[10, 3], [100, 3], [100, 4], [10, 4]] : [[100, 4], [1000, 4], [1000, 5], [10000, 5], [10000, 6]];
    var pr = R.pick(opts), p = pr[0], N = nd(R, pr[1]);
    if (N % p === 0) N += R.int(1, p - 1);
    return { f: 'txt', key: 'round_q', vars: { n: [{ n: N }], place: [{ s: 'pl_' + p }] }, a: num(Math.round(N / p) * p), w: fmtInt(N).length + 1, sig: 'r' + N + '/' + p };
  }

  /* ---------- fractions ---------- */
  function genFsimp(R, o) {
    var c = o.diff === 'easy' ? [2, 10, 2, 3] : o.diff === 'medium' ? [2, 12, 2, 6] : [3, 15, 3, 12];
    var b = properBase(R, c[0], c[1]), k = R.int(c[2], c[3]);
    if (o.diff === 'hard' && R.chance(0.2)) b = [b[0] + b[1], b[1]];
    return { parts: [{ fr: [b[0] * k, b[1] * k] }, '=', { box: 1 }], a: { k: 'frac', n: b[0], d: b[1] }, w: 5, sig: 'fs' + b[0] * k + '/' + b[1] * k };
  }

  function genFcmp(R, o) {
    var a, b;
    if (o.diff === 'easy') { var d = R.int(3, 12); a = [R.int(1, d - 1), d]; b = [R.int(1, d - 1), d]; }
    else if (o.diff === 'medium') {
      if (R.chance(0.5)) { var n = R.int(1, 7); a = [n, R.int(n + 1, 12)]; b = [n, R.int(n + 1, 12)]; }
      else { var d1 = R.int(2, 6), d2 = d1 * R.int(2, 3); a = [R.int(1, d1 - 1), d1]; b = [R.int(1, d2 - 1), d2]; }
    } else if (R.chance(0.15)) { var bs = properBase(R, 2, 9), k = R.int(2, 4); a = bs; b = [bs[0] * k, bs[1] * k]; }
    else { a = properBase(R, 2, 12); b = properBase(R, 2, 12); }
    if (R.chance(0.5)) { var t = a; a = b; b = t; }
    var lhs = a[0] * b[1], rhs = b[0] * a[1];
    return { f: 'cmp', l: [{ fr: a }], r: [{ fr: b }], a: { k: 'cmp', v: lhs < rhs ? '<' : lhs > rhs ? '>' : '=' }, sig: 'fc' + a + '|' + b };
  }

  function genFadd(R, o) {
    var plus = R.chance(0.55), a = [1, 2], b = [1, 3], w1 = 0, w2 = 0, n = 1, den = 6;
    for (var t = 0; t < 200; t++) {
      w1 = 0; w2 = 0;
      if (o.diff === 'easy') { var d = R.int(3, 12); a = [R.int(1, d - 1), d]; b = [R.int(1, d - 1), d]; }
      else if (o.diff === 'medium') {
        var d1 = R.int(2, 8), d2 = d1 * R.int(2, 3);
        a = properBase(R, d1, d1); b = properBase(R, d2, d2);
        if (R.chance(0.5)) { var x = a; a = b; b = x; }
      } else {
        var d3 = R.int(2, 10), d4 = R.int(2, 10);
        if (d3 === d4) continue;
        a = properBase(R, d3, d3); b = properBase(R, d4, d4);
        if (R.chance(0.35)) { w1 = R.int(1, 4); w2 = R.int(0, w1); }
      }
      var an = w1 * a[1] + a[0], bn = w2 * b[1] + b[0];
      if (!plus && an * b[1] < bn * a[1]) { var y = a; a = b; b = y; var z = w1; w1 = w2; w2 = z; var q = an; an = bn; bn = q; }
      n = plus ? an * b[1] + bn * a[1] : an * b[1] - bn * a[1]; den = a[1] * b[1];
      if (n > 0) break;
      plus = true;
    }
    var r = reduce(n, den);
    return {
      parts: [{ fr: a, w: w1 }, plus ? '+' : MINUS, { fr: b, w: w2 }, '=', { box: 1 }],
      a: { k: 'frac', n: r[0], d: r[1] }, w: 6, sig: 'fa' + [w1, a, plus, w2, b].join('|')
    };
  }

  /* ---------- decimals ---------- */
  function genDadd(R, o) {
    var A, B, plus = R.chance(0.5);
    if (o.diff === 'easy') { A = mkDec(R, 0, 99, 1); B = mkDec(R, 0, 99, 1); }
    else if (o.diff === 'medium') { A = mkDec(R, 0, 99, R.int(1, 2)); B = mkDec(R, 0, 99, R.int(1, 2)); }
    else { A = mkDec(R, 1, 999, R.int(0, 3)); B = mkDec(R, 0, 99, R.int(1, 3)); }
    var S = Math.max(A.dp, B.dp), a = A.i * P10(S - A.dp), b = B.i * P10(S - B.dp);
    if (!plus && a < b) { var t = A; A = B; B = t; var u = a; a = b; b = u; }
    if (a === b) plus = true;
    var res = plus ? a + b : a - b, op = plus ? '+' : MINUS;
    var ans = trimDec(decStr(res, S));
    return {
      parts: [{ dc: decStr(A.i, A.dp) }, op, { dc: decStr(B.i, B.dp) }, '=', { box: 1 }],
      rows: [{ op: '', s: decStr(a, S) }, { op: op, s: decStr(b, S) }],
      a: num(res / P10(S), { s: ans }), w: decStr(a, S).length + 1, sig: 'da' + A.i + op + B.i + ':' + A.dp + B.dp
    };
  }

  function genDmul(R, o) {
    var A, B, r = R.f();
    if (o.diff === 'easy') {
      if (r < 0.5) { A = mkDec(R, 0, 99, R.int(1, 2)); B = { i: R.pick([10, 100, 1000]), dp: 0 }; }
      else { A = mkDec(R, 0, 20, 1); B = { i: R.int(2, 9), dp: 0 }; }
    } else if (o.diff === 'medium') {
      if (r < 0.5) { A = mkDec(R, 0, 9, 1); B = mkDec(R, 0, 9, 1); } else { A = mkDec(R, 0, 20, 2); B = { i: R.int(2, 9), dp: 0 }; }
    } else if (r < 0.35) { A = mkDec(R, 0, 20, 2); B = mkDec(R, 0, 9, 1); }
    else if (r < 0.7) { A = mkDec(R, 0, 50, 1); B = { i: R.int(11, 99), dp: 0 }; }
    else { A = mkDec(R, 0, 1, 2); B = mkDec(R, 0, 1, 1); }
    var p = A.i * B.i, dp = A.dp + B.dp, ans = trimDec(decStr(p, dp));
    return {
      parts: [{ dc: decStr(A.i, A.dp) }, '×', { dc: decStr(B.i, B.dp) }, '=', { box: 1 }],
      a: num(p / P10(dp), { s: ans }), w: decStr(A.i, A.dp).length + decStr(B.i, B.dp).length, sig: 'dm' + A.i + '/' + A.dp + 'x' + B.i + '/' + B.dp
    };
  }

  /* ---------- integers ---------- */
  function sgn(n, first) { return n < 0 && !first ? { n: n, par: 1 } : { n: n }; }
  function genInt(R, o) {
    var M = o.diff === 'easy' ? 20 : o.diff === 'medium' ? 50 : 12, parts, val;
    function rnd() { var x; do { x = R.int(-M, M); } while (x === 0); return x; }
    if (o.diff === 'hard' && R.chance(0.6)) {
      var a = rnd(), b = rnd();
      if (a > 0 && b > 0) { if (R.chance(0.5)) a = -a; else b = -b; }   /* an integers sheet: every question has a negative number */
      if (R.chance(0.5)) { parts = [sgn(a, 1), '×', sgn(b)]; val = a * b; }
      else { parts = [sgn(a * b, 1), '÷', sgn(a)]; val = b; }
    } else {
      var n = o.diff === 'easy' ? 2 : R.int(2, 3), x0 = rnd(), seenNeg = x0 < 0;
      parts = [sgn(x0, 1)]; val = x0;
      for (var j = 1; j < n; j++) {
        var y = rnd(), op = R.chance(0.5) ? '+' : MINUS;
        if (j === n - 1 && !seenNeg && y > 0) y = -y;          /* every question has a negative number */
        if (y < 0) seenNeg = true;
        parts.push(op, sgn(y)); val += op === '+' ? y : -y;
      }
    }
    parts.push('=', { box: 1 });
    return { parts: parts, a: num(val), w: 4, neg: 1, sig: JSON.stringify(parts) };
  }

  /* ---------- BODMAS ---------- */
  var BOD = {
    easy: ['a + b × c', 'a × b + c', 'a × b − c', 'a − b × c', 'a + b ÷ c', 'a ÷ b + c', 'a − b + c', 'a × b ÷ c'],
    medium: ['( a + b ) × c', 'a × ( b − c )', '( a + b ) ÷ c', 'a + b × c − d', 'a ÷ b × c', '( a − b ) × ( c + d )', 'a − ( b + c ) + d', 'a × b − c × d'],
    hard: ['a − [ b + ( c − d ) ]', '[ a + ( b − c ) × d ] ÷ e', 'a × b − c ÷ d + e', 'a − ( b − c ) × d', '{ a + [ b × ( c − d ) ] } − e', '( a × b − c ) ÷ d', 'a + b × [ c − ( d + e ) ]', 'a ÷ [ b − ( c − d ) ]']
  };
  function evalToks(toks) {
    var i = 0, ok = true;
    function factor() {
      var tk = toks[i++];
      if (tk === '(' || tk === '[' || tk === '{') { var v = expr(); i++; return v; }
      return tk.n;
    }
    function term() {
      var v = factor();
      while (toks[i] === '×' || toks[i] === '÷') {
        var op = toks[i++], w = factor();
        if (op === '×') v *= w; else { if (!w || v % w) ok = false; v = w ? v / w : 0; }
      }
      return v;
    }
    function expr() {
      var v = term();
      while (toks[i] === '+' || toks[i] === MINUS) {
        var op = toks[i++], w = term();
        v = op === '+' ? v + w : v - w;
        if (v < 0 || (v === 0 && op !== '+')) ok = false;     /* no negatives, and no "23 − 23" that makes a bracket 0 */
      }
      return v;
    }
    var r = expr();
    return ok ? r : NaN;
  }
  function genBodmas(R, o, qi) {
    var list = BOD[o.diff] || BOD.easy, addMax = o.diff === 'easy' ? 20 : o.diff === 'medium' ? 40 : 60, mulMax = o.diff === 'hard' ? 15 : 10;
    /* go through the patterns in a shuffled order, so a sheet mixes them evenly (patterns that are easier
       to fill with numbers would otherwise fill half the sheet) */
    if (!o.bodOrder) {
      o.bodOrder = list.map(function (x, k) { return k; });
      for (var s = o.bodOrder.length - 1; s > 0; s--) { var m = R.int(0, s), z = o.bodOrder[s]; o.bodOrder[s] = o.bodOrder[m]; o.bodOrder[m] = z; }
    }
    var fixed = list[o.bodOrder[(qi || 0) % list.length]];
    for (var t = 0; t < 600; t++) {
      var tpl = (t < 400 ? fixed : R.pick(list)).split(' ').map(function (s) { return s === '−' ? MINUS : s; });
      var toks = tpl.map(function (s, i) {
        if (!/^[a-e]$/.test(s)) return s;
        var near = [tpl[i - 1], tpl[i + 1]].some(function (x) { return x === '×' || x === '÷'; });
        return { n: near ? R.int(2, mulMax) : R.int(1, addMax) };
      });
      for (var i = 1; i < toks.length - 1; i++) {          /* make plain "a ÷ b" divide exactly */
        if (toks[i] === '÷' && toks[i - 1].n !== undefined && toks[i + 1].n !== undefined) toks[i - 1] = { n: toks[i + 1].n * R.int(2, 9) };
      }
      var v = evalToks(toks);
      if (!isFinite(v) || v < 0 || v > 999 || v !== Math.round(v)) continue;
      toks.push('=', { box: 1 });
      return { parts: toks, a: num(v), w: 4, sig: JSON.stringify(toks) };
    }
    return { parts: [{ n: 4 }, '+', { n: 3 }, '×', { n: 5 }, '=', { box: 1 }], a: num(19), w: 3, sig: 'b0' };
  }

  /* ---------- percentages ---------- */
  function genPct(R, o) {
    var r = R.f(), p, step;
    var easyP = [10, 20, 25, 50], medP = [5, 10, 12, 15, 20, 25, 30, 40, 60, 75, 80];
    if (o.diff === 'easy' || (o.diff === 'medium' && r < 0.65) || (o.diff === 'hard' && r < 0.3)) {
      p = R.pick(o.diff === 'easy' ? easyP : medP);
      step = 100 / gcd(p, 100);
      var n = step * R.int(Math.ceil(20 / step), Math.floor((o.diff === 'easy' ? 500 : 2000) / step));
      return { f: 'txt', key: 'pct_of', eq: 1, vars: { p: [{ n: p }], n: [{ n: n }] }, a: num(p * n / 100), w: 5, sig: 'po' + p + ':' + n };
    }
    if (o.diff === 'medium' || r < 0.55) {
      var d = R.pick([2, 4, 5, 10, 20, 25, 50]), f = reduce(R.int(1, d - 1), d);
      return { f: 'txt', key: 'pct_frac', vars: { f: [{ fr: f }] }, a: num(f[0] * 100 / f[1], { unit: '%' }), w: 4, sig: 'pf' + f };
    }
    if (r < 0.8) {
      p = R.pick(medP.concat([35, 45, 90]));
      step = 100 / gcd(p, 100);
      var a = step * R.int(1, Math.floor(400 / step));
      if (a < 10) a = step * Math.ceil(10 / step);
      return { f: 'txt', key: 'pct_whatpct', vars: { a: [{ n: a }], b: [{ n: a * p / 100 }] }, a: num(p, { unit: '%' }), w: 4, sig: 'pw' + p + ':' + a };
    }
    p = R.pick(medP);
    step = 100 / gcd(p, 100);
    var whole = step * R.int(Math.ceil(20 / step), Math.floor(1000 / step));
    return { f: 'txt', key: 'pct_whole', vars: { p: [{ n: p }], b: [{ n: whole * p / 100 }] }, a: num(whole), w: 5, sig: 'ph' + p + ':' + whole };
  }

  /* ---------- simple equations ---------- */
  function genEq(R, o) {
    var x, a, b, parts, r = R.f(), ans;
    function X(k) { return { x: k || 1 }; }
    if (o.diff === 'easy') {
      x = R.int(1, 20); a = R.int(1, 20); ans = x;
      if (r < 0.4) parts = [X(), '+', { n: a }, '=', { n: x + a }];
      else if (r < 0.7) parts = [{ n: a }, '+', X(), '=', { n: x + a }];
      else { ans = a + R.int(1, 20); parts = [X(), MINUS, { n: a }, '=', { n: ans - a }]; }
    } else if (o.diff === 'medium') {
      a = R.int(2, 9); x = R.int(2, 15); ans = x;
      if (r < 0.35) parts = [X(a), '=', { n: a * x }];
      else if (r < 0.6) { ans = a * x; parts = [X(), '÷', { n: a }, '=', { n: x }]; }
      else if (r < 0.8) { b = x + R.int(1, 30); parts = [{ n: b }, MINUS, X(), '=', { n: b - x }]; }
      else { a = R.int(10, 99); parts = [X(), '+', { n: a }, '=', { n: x + a }]; }
    } else {
      a = R.int(2, 9); x = R.int(1, 12); b = R.int(1, 20); ans = x;
      if (r < 0.3) parts = [X(a), '+', { n: b }, '=', { n: a * x + b }];
      else if (r < 0.5) { b = R.int(1, a * x); parts = [X(a), MINUS, { n: b }, '=', { n: a * x - b }]; }
      else if (r < 0.7) parts = [{ n: a, tight: 1 }, '(', X(), '+', { n: b }, ')', '=', { n: a * (x + b) }];
      else if (r < 0.85) { ans = a * x; parts = [X(), '÷', { n: a }, '+', { n: b }, '=', { n: x + b }]; }
      else { var c = R.int(1, a - 1); parts = [X(a), '+', { n: b }, '=', X(c), '+', { n: (a - c) * x + b }]; }
    }
    return { parts: parts, post: [X(), '=', { box: 1 }], a: num(ans), w: 3, sig: JSON.stringify(parts) };
  }

  /* ---------- word problems (text comes from content.js) ---------- */
  var ITEM_PRICE = [[3, 12], [20, 60], [5, 25], [2, 8], [10, 20], [15, 40], [5, 30], [10, 30]];  /* same order as content items */
  var NAMES = 10;
  function rs(v) { return { rs: v }; }
  function twoItems(R) { var a = R.int(0, ITEM_PRICE.length - 1), b; do { b = R.int(0, ITEM_PRICE.length - 1); } while (b === a); return [a, b]; }
  function price(R, k, paise) { var p = R.int(ITEM_PRICE[k][0], ITEM_PRICE[k][1]); return paise && R.chance(0.6) ? p + 0.5 : p; }
  function money(v, paise) { return num(Math.round(v * 100) / 100, { rs: 1, dp: paise ? 2 : 0 }); }

  function genMoney(R, o) {
    var types = o.diff === 'easy' ? ['m_cost', 'm_change', 'm_save', 'm_left'] :
      o.diff === 'medium' ? ['m_cost', 'm_change', 'm_total', 'm_share', 'm_left', 'm_save'] : ['m_total', 'm_unit', 'm_change', 'm_share', 'm_cost'];
    var tpl = R.pick(types), hard = o.diff === 'hard', nm = R.int(0, NAMES - 1), it = R.int(0, ITEM_PRICE.length - 1), v, ans, p, n;
    if (tpl === 'm_cost') {
      p = price(R, it, hard); n = R.int(2, o.diff === 'easy' ? 9 : 15);
      v = { name: { nm: nm }, item: { it: it }, items: { itp: it }, n: { n: n }, p: rs(p) }; ans = money(p * n, p % 1);
    } else if (tpl === 'm_change') {
      p = price(R, it, hard);
      var notes = [10, 20, 50, 100, 200, 500].filter(function (x) { return x > p; }).slice(0, 3);
      var note = R.pick(notes);
      v = { name: { nm: nm }, item: { it: it }, p: rs(p), note: rs(note) }; ans = money(note - p, p % 1);
    } else if (tpl === 'm_total') {
      var two = twoItems(R), p1 = price(R, two[0], hard), p2 = price(R, two[1], hard), n1 = R.int(2, 6), n2 = R.int(2, 6);
      v = { name: { nm: nm }, item: { it: two[0] }, items: { itp: two[0] }, n: { n: n1 }, p: rs(p1), item2: { it: two[1] }, items2: { itp: two[1] }, n2: { n: n2 }, p2: rs(p2) };
      ans = money(p1 * n1 + p2 * n2, (p1 % 1) || (p2 % 1));
    } else if (tpl === 'm_share') {
      n = R.int(2, 8); var each = o.diff === 'easy' ? R.int(5, 50) : R.int(10, 250);
      v = { total: rs(each * n), n: { n: n } }; ans = money(each);
    } else if (tpl === 'm_left') {
      var tw = twoItems(R), b = price(R, tw[0]), c = price(R, tw[1]), a = 10 * R.int(Math.ceil((b + c + 5) / 10), Math.ceil((b + c + 5) / 10) + 30);
      v = { name: { nm: nm }, a: rs(a), b: rs(b), item: { it: tw[0] }, c: rs(c), item2: { it: tw[1] } }; ans = money(a - b - c);
    } else if (tpl === 'm_save') {
      p = o.diff === 'easy' ? R.int(2, 10) : R.int(5, 50); n = R.int(5, 30);
      v = { name: { nm: nm }, p: rs(p), n: { n: n } }; ans = money(p * n);
    } else {                                                /* m_unit: unitary method */
      var u = price(R, it), cnt = R.int(2, 12), k;
      do { k = R.int(2, 15); } while (k === cnt);
      v = { n: { n: cnt }, items: { itp: it }, total: rs(u * cnt), k: { n: k } }; ans = money(u * k);
    }
    return { f: 'word', grp: 'money', tpl: tpl, v: v, a: ans, w: 6, sig: tpl + JSON.stringify(v) };
  }

  function genTime(R, o) {
    var types = o.diff === 'easy' ? ['t_h2m', 't_days', 't_end'] : o.diff === 'medium' ? ['t_end', 't_dur', 't_h2m', 't_m2h', 't_days'] : ['t_end', 't_dur', 't_m2h', 't_h2m'];
    var step = o.diff === 'easy' ? 15 : o.diff === 'medium' ? 5 : 1;
    var tpl = R.pick(types), nm = R.int(0, NAMES - 1), v, ans;
    var d = R.int(2, 4) * 60 + step * R.int(1, Math.floor(59 / step));
    var startStep = o.diff === 'easy' ? 30 : step;
    var start = 7 * 60 + startStep * R.int(0, Math.floor(8 * 60 / startStep));
    if (tpl === 't_end') { v = { t1: { tm: start }, d: { du: d } }; ans = { k: 'time', v: start + d }; }
    else if (tpl === 't_dur') { v = { name: { nm: nm }, t1: { tm: start }, t2: { tm: start + d } }; ans = { k: 'dur', v: d }; }
    else if (tpl === 't_h2m') { v = { d: { du: d } }; ans = num(d, { unit: 'min' }); }
    else if (tpl === 't_m2h') { v = { m: { n: d } }; ans = { k: 'dur', v: d }; }
    else { var w = R.int(2, 3), dd = R.int(2, 6); v = { w: { n: w }, d: { n: dd } }; ans = num(7 * w + dd); }   /* festival holidays: 2–3 weeks is realistic */
    return { f: 'word', grp: 'time', tpl: tpl, v: v, a: ans, w: 5, sig: tpl + JSON.stringify(v) };
  }

  /* ---------- the whole sheet ---------- */
  var GEN = {
    add: genAdd, sub: genSub, tables: genTables, mul: genMul, div: genDiv,
    place: genPlace, compare: genCompare, round: genRound,
    fsimp: genFsimp, fcmp: genFcmp, fadd: genFadd, dadd: genDadd, dmul: genDmul,
    int: genInt, bodmas: genBodmas, pct: genPct, eq: genEq, time: genTime, money: genMoney
  };
  function pickOne(v, list, d) { return list.indexOf(v) >= 0 ? v : d; }
  function options(cfg) {
    return {
      diff: pickOne(cfg.diff, ['easy', 'medium', 'hard'], 'easy'),
      digits: clamp(cfg.digits, 1, 6),
      carry: pickOne(cfg.carry, ['any', 'yes', 'no'], 'any'),
      tFrom: clamp(cfg.tFrom, 2, 20), tTo: clamp(cfg.tTo, 2, 20),
      rem: pickOne(cfg.rem, ['any', 'yes', 'no'], 'no')
    };
  }
  /* → [{topic, qs: [question...]}] ; the same cfg (incl. seed) always gives the same sheet */
  function generate(cfg) {
    var o = options(cfg), want = cfg.topics || [];
    var ids = TOPICS.map(function (t) { return t.id; }).filter(function (id) { return want.indexOf(id) >= 0; });
    var C = clamp(cfg.count, 1, 60), T = ids.length, seed = clamp(cfg.seed, 0, 999999999), out = [];
    ids.forEach(function (id, ti) {
      var n = Math.floor(C / T) + (ti < C % T ? 1 : 0);
      if (n <= 0) return;
      var R = rng(hashStr(seed + ':' + id + ':' + o.diff + ':' + o.digits + o.carry + o.rem + o.tFrom + '-' + o.tTo));
      var used = {}, qs = [];
      for (var i = 0; i < n; i++) {
        var q, tries = 0;
        do { q = GEN[id](R, o, i); tries++; } while (used[q.sig] && tries < 30);
        used[q.sig] = 1; q.t = id; qs.push(q);
      }
      out.push({ topic: id, qs: qs });
    });
    return out;
  }

  /* ---------- checking typed answers ---------- */
  var DIGIT0 = [0x966, 0x9E6, 0xA66, 0xAE6, 0xB66, 0xBE6, 0xC66, 0xCE6, 0xD66, 0x660, 0x6F0];
  /* Students may type with an Indian-language keyboard: १२ / ১২ / ૧૨ / ۱۲ … → 12 */
  function latin(s) {
    return String(s == null ? '' : s).replace(/[٠-٩۰-۹०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯]/g, function (c) {
      var k = c.charCodeAt(0);
      for (var i = 0; i < DIGIT0.length; i++) if (k >= DIGIT0[i] && k <= DIGIT0[i] + 9) return String(k - DIGIT0[i]);
      return c;
    }).replace(/[−–—﹣－]/g, '-').replace(/٫/g, '.').replace(/٬/g, ',').trim();
  }
  function blank(v) { return String(v == null ? '' : v).trim() === ''; }
  /* a number, allowing "₹45.50", "60 %", "155 min" */
  function parseNum(s) {
    var c = latin(s).replace(/[,\s]/g, '');
    var m = /^[^\d.\-]*(-?(?:\d+\.?\d*|\.\d+))[^\d]*$/.exec(c);
    return m ? parseFloat(m[1]) : NaN;
  }
  function parseWhole(s) { var v = parseNum(s); return v === Math.round(v) ? v : NaN; }
  /* "3/4", "1 3/4", "2" → {n, d (improper), ok: written in lowest terms} */
  function parseFrac(s) {
    var c = latin(s).replace(/\s+/g, ' ').replace(/\s*\/\s*/g, '/'), m;
    if ((m = /^(-?\d+)$/.exec(c))) return { n: +m[1], d: 1, ok: true };
    if ((m = /^(\d+)\/(\d+)$/.exec(c))) { var n = +m[1], d = +m[2]; return d ? { n: n, d: d, ok: gcd(n, d) === 1 } : null; }
    if ((m = /^(\d+) (\d+)\/(\d+)$/.exec(c))) {
      var w = +m[1], fn = +m[2], fd = +m[3];
      return fd && fn < fd ? { n: w * fd + fn, d: fd, ok: gcd(fn, fd) === 1 } : null;
    }
    return null;
  }
  function parseClock(s) {
    var m = /^(\d{1,2})\s*[:.\s]\s*(\d{2})/.exec(latin(s));
    if (!m) return NaN;
    var h = +m[1], mi = +m[2];
    return mi > 59 || h > 23 ? NaN : h * 60 + mi;
  }
  function parseExp(s) {
    var c = latin(s).replace(/[,\s]/g, '');
    if (!c) return null;
    return c.split('+').map(function (term) {
      var f = term.split(/[×xX*]/);
      if (f.some(function (z) { return !/^\d+$/.test(z); })) return NaN;
      return f.reduce(function (p, z) { return p * Number(z); }, 1);
    });
  }
  /* true / false, or null when nothing was typed */
  function check(q, vals) {
    vals = vals || [];
    if (vals.every(blank)) return null;
    var a = q.a, v0 = vals[0], x, h, m;
    switch (a.k) {
      case 'num': x = parseNum(v0); return isFinite(x) && Math.abs(x - a.v) < 1e-9 * Math.max(1, Math.abs(a.v));
      case 'frac': x = parseFrac(v0); return !!(x && x.ok && x.n * a.d === a.n * x.d);
      case 'cmp': return v0 === a.v;
      case 'time': x = parseClock(v0); return isFinite(x) && (x === a.v || x % 720 === a.v % 720);
      case 'dur':
        h = blank(vals[0]) ? 0 : parseWhole(vals[0]); m = blank(vals[1]) ? 0 : parseWhole(vals[1]);
        return isFinite(h) && isFinite(m) && m >= 0 && m < 60 && h * 60 + m === a.v;
      case 'dr':
        h = parseWhole(vals[0]); m = blank(vals[1]) ? 0 : parseWhole(vals[1]);
        return h === a.q && m === a.r;
      case 'exp':
        x = parseExp(v0);
        if (!x || x.some(function (z) { return !isFinite(z); })) return false;
        x = x.filter(function (z) { return z !== 0; }).sort(function (p, r) { return r - p; });
        var want = a.terms.slice().sort(function (p, r) { return r - p; });
        return x.length === want.length && x.every(function (z, i) { return z === want[i]; });
    }
    return false;
  }
  /* the correct answer as a student would type it (one string per input box) */
  function plain(q) {
    var a = q.a;
    switch (a.k) {
      case 'num': return [a.s || String(a.v)];
      case 'frac': return [a.d === 1 ? String(a.n) : a.n + '/' + a.d];
      case 'cmp': return [a.v];
      case 'time': return [(Math.floor(a.v / 60) % 12 || 12) + ':' + ('0' + a.v % 60).slice(-2)];
      case 'dur': return [String(Math.floor(a.v / 60)), String(a.v % 60)];
      case 'dr': return [String(a.q), String(a.r)];
      case 'exp': return [a.terms.join(' + ')];
    }
    return [''];
  }

  window.WSGEN = {
    TOPICS: TOPICS, TOPIC: TOPIC, GROUPS: GROUPS, generate: generate, check: check, plain: plain,
    fmtInt: fmtInt, decStr: decStr, trimDec: trimDec, gcd: gcd, latin: latin, MINUS: MINUS
  };
})();
