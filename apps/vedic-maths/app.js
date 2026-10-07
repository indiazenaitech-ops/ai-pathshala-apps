/* Vedic Maths: mental-maths tricks with animated steps, try-yourself, timed drills, printable worksheets.
   Part 1 is a pure, UI-free engine (window.VEDIC) so the test can check every trick against ordinary arithmetic.
   Part 2 is the UI (only runs when EDU is present). */
(function () {
  'use strict';

  /* =========================================================================
     PART 1: pure engine. Every solve(p) returns { answer, steps:[{k, v}] }.
     Steps are template keys into APP_CONTENT[lang].tricks[id].steps with vars v.
     ========================================================================= */
  function digits(n) { return String(n).split('').map(Number); }
  function pow10(k) { var r = 1; for (var i = 0; i < k; i++) r *= 10; return r; }
  function pad(n, k) { var s = String(n); while (s.length < k) s = '0' + s; return s; }
  function sgn(n) { return n < 0 ? '− ' + (-n) : '+ ' + n; }   // signed deviation for display
  function ri(rng, a, b) { return a + Math.floor(rng() * (b - a + 1)); }
  function digitSum(n) { return digits(n).reduce(function (s, d) { return s + d; }, 0); }

  /* ---------- 1. multiply by 11 ---------- */
  function solveMul11(p) {
    var n = p.n, d = digits(n), res = [], steps = [], carry = 0;
    var last = d[d.length - 1];
    res.unshift(last);
    steps.push({ k: 'last', v: { n: n, d: last } });
    for (var i = d.length - 1; i > 0; i--) {
      var s = d[i] + d[i - 1] + carry, w = s % 10, c = Math.floor(s / 10);
      steps.push({ k: 'pair' + (carry ? '_in' : '') + (c ? '_out' : ''), v: { x: d[i - 1], y: d[i], c: carry, s: s, w: w, carry: c } });
      res.unshift(w); carry = c;
    }
    var f = d[0] + carry;
    steps.push({ k: carry ? 'first_c' : 'first', v: { f: d[0], c: carry, s: f } });
    res.unshift(f);
    var ans = Number(res.join(''));
    steps.push({ k: 'ans', v: { n: n, ans: ans } });
    return { answer: ans, steps: steps };
  }

  /* ---------- 2. multiply by 9, 99, 999 ---------- */
  function solveMul9s(p) {
    var n = p.n, k = p.k, nines = pow10(k) - 1, base = pow10(k), steps = [], ans;
    if (String(n).length === k) {                       // same number of digits: (n−1) | complement
      var left = n - 1, right = base - n;
      ans = left * base + right;
      steps.push({ k: 'c_left', v: { n: n, nines: nines, left: left } });
      steps.push({ k: 'c_right', v: { base: base, n: n, right: pad(right, k) } });
      steps.push({ k: 'c_join', v: { left: left, right: pad(right, k), ans: ans } });
    } else {                                            // n × 100 − n
      var m = n * base;
      ans = m - n;
      steps.push({ k: 'n_is', v: { nines: nines, base: base } });
      steps.push({ k: 'n_times', v: { n: n, base: base, m: m } });
      steps.push({ k: 'n_minus', v: { m: m, n: n, ans: ans } });
    }
    steps.push({ k: 'ans', v: { n: n, nines: nines, ans: ans } });
    return { answer: ans, steps: steps };
  }

  /* ---------- 3. multiply by 5, 25, 50 ---------- */
  function solveMul5(p) {
    var n = p.n, m = p.m, pw = m === 5 ? 10 : 100, dv = m === 25 ? 4 : 2, t = n * pw, ans = t / dv, steps = [];
    steps.push({ k: 'f_idea', v: { m: m, pw: pw, dv: dv } });
    steps.push({ k: 'f_times', v: { n: n, pw: pw, t: t } });
    steps.push({ k: 'f_div', v: { t: t, dv: dv, ans: ans } });
    steps.push({ k: 'ans', v: { n: n, m: m, ans: ans } });
    return { answer: ans, steps: steps };
  }

  /* ---------- 4. squares ending in 5 ---------- */
  function solveSq5(p) {
    var n = p.n, a = Math.floor(n / 10), prod = a * (a + 1), ans = prod * 100 + 25, steps = [];
    steps.push({ k: 'split', v: { n: n, a: a } });
    steps.push({ k: 'mul', v: { a: a, a1: a + 1, prod: prod } });
    steps.push({ k: 'join', v: { prod: prod, ans: ans } });
    steps.push({ k: 'ans', v: { n: n, ans: ans } });
    return { answer: ans, steps: steps };
  }

  /* ---------- 5. Nikhilam: numbers near a base (97 × 96, 103², 998 × 1004) ---------- */
  function solveNikhilam(p) {
    var a = p.a, b = p.b, base = p.base, k = String(base).length - 1;
    var da = a - base, db = b - base, left = a + db, prod = da * db, steps = [];
    steps.push({ k: 'base', v: { a: a, b: b, base: base } });
    steps.push({ k: 'dev', v: { a: a, b: b, base: base, da: sgn(da), db: sgn(db) } });
    steps.push({ k: 'cross', v: { a: a, db: sgn(db), left: left } });
    steps.push({ k: 'prod', v: { da: sgn(da), db: sgn(db), prod: prod, k: k } });
    if (prod < 0) {
      var l2 = left - 1, p2 = prod + base;
      steps.push({ k: 'borrow', v: { left: left, l2: l2, prod: prod, base: base, p2: p2 } });
      left = l2; prod = p2;
    } else if (prod >= base) {
      var c = Math.floor(prod / base), l3 = left + c, p3 = prod % base;
      steps.push({ k: 'carry', v: { prod: prod, base: base, c: c, left: left, l3: l3, p3: pad(p3, k) } });
      left = l3; prod = p3;
    }
    var ans = left * base + prod;
    steps.push({ k: 'join', v: { left: left, right: pad(prod, k), ans: ans } });
    steps.push({ k: 'ans', v: { a: a, b: b, ans: ans } });
    return { answer: ans, steps: steps };
  }

  /* ---------- 6. vertically and crosswise (Urdhva Tiryak), any digit counts ---------- */
  function solveCross(p) {
    var A = digits(p.a), B = digits(p.b), m = A.length, n = B.length, res = [], steps = [], carry = 0;
    steps.push({ k: 'setup', v: { a: p.a, b: p.b } });
    for (var col = 0; col <= m + n - 2; col++) {
      var terms = [], sum = 0;
      for (var i = 0; i < m; i++) {
        var j = col - i;
        if (j < 0 || j >= n) continue;
        var x = A[m - 1 - i], y = B[n - 1 - j];
        terms.push(x + '×' + y); sum += x * y;
      }
      var total = sum + carry, w = col === m + n - 2 ? total : total % 10, c = col === m + n - 2 ? 0 : Math.floor(total / 10);
      steps.push({ k: 'col' + (carry ? '_in' : '') + (c ? '_out' : ''), v: { i: col + 1, terms: terms.join(' + '), sum: sum, c: carry, total: total, w: w, carry: c } });
      res.unshift(w); carry = c;
    }
    var ans = Number(res.join(''));
    steps.push({ k: 'ans', v: { a: p.a, b: p.b, ans: ans } });
    return { answer: ans, steps: steps };
  }

  /* ---------- 7. division by 9 ---------- */
  function solveDiv9(p) {
    var n = p.n, d = digits(n), steps = [], run = [], q = 0, s = 0;
    for (var i = 0; i < d.length - 1; i++) {
      s += d[i]; run.push(s); q = q * 10 + s;                 // running sums; q absorbs any carries
      steps.push(i === 0 ? { k: 'first', v: { n: n, d: d[0] } } : { k: 'add', v: { prev: run[i - 1], d: d[i], s: s } });
    }
    var r = s + d[d.length - 1];
    steps.push({ k: 'quot', v: { list: run.join(', '), q: q } });
    steps.push({ k: 'rem', v: { list: d.join(' + '), r: r } });
    while (r >= 9) {
      var q2 = q + 1, r2 = r - 9;
      steps.push({ k: 'adjust', v: { r: r, q: q, q2: q2, r2: r2 } });
      q = q2; r = r2;
    }
    steps.push({ k: 'ans', v: { n: n, q: q, r: r } });
    return { answer: { q: q, r: r }, steps: steps };
  }

  /* ---------- 8. cube roots of perfect cubes (4 to 6 digits) ---------- */
  var CUBE_UNITS = { 0: 0, 1: 1, 8: 2, 7: 3, 4: 4, 5: 5, 6: 6, 3: 7, 2: 8, 9: 9 };
  function solveCubeRoot(p) {
    var n = p.n, left = Math.floor(n / 1000), right = n % 1000, last = n % 10, u = CUBE_UNITS[last], t = 0, steps = [];
    while ((t + 1) * (t + 1) * (t + 1) <= left) t++;
    steps.push({ k: 'split', v: { n: n, left: left, right: pad(right, 3) } });
    steps.push({ k: 'units', v: { last: last, u: u, u3: u * u * u } });
    steps.push({ k: 'tens', v: { left: left, t: t, t3: t * t * t, t1: t + 1, t13: (t + 1) * (t + 1) * (t + 1) } });
    var ans = 10 * t + u;
    steps.push({ k: 'ans', v: { n: n, ans: ans } });
    return { answer: ans, steps: steps };
  }

  /* ---------- 9. percentage tricks (10%, 5%, halves and quarters) ---------- */
  function solvePercent(p) {
    var P = p.p, n = p.n, steps = [], ans, ten = n / 10, half = n / 2, quarter = n / 4, five = ten / 2;
    if (P === 50) { ans = half; steps.push({ k: 'half', v: { n: n, half: half } }); }
    else if (P === 25) { ans = quarter; steps.push({ k: 'half', v: { n: n, half: half } }); steps.push({ k: 'quarter', v: { half: half, quarter: quarter } }); }
    else if (P === 75) {
      ans = half + quarter;
      steps.push({ k: 'half', v: { n: n, half: half } }); steps.push({ k: 'quarter', v: { half: half, quarter: quarter } });
      steps.push({ k: 'sum', v: { parts: half + ' + ' + quarter, ans: ans } });
    } else if (P === 90) { ans = n - ten; steps.push({ k: 'ten', v: { n: n, ten: ten } }); steps.push({ k: 'minus', v: { n: n, ten: ten, ans: ans } }); }
    else {
      var tens = Math.floor(P / 10), hasFive = P % 10 === 5, parts = [];
      steps.push({ k: 'ten', v: { n: n, ten: ten } });
      if (tens === 1) parts.push(ten);
      else if (tens > 1) { steps.push({ k: 'tens', v: { tens: tens, ten: ten, p: tens * 10, val: tens * ten } }); parts.push(tens * ten); }
      if (hasFive) { steps.push({ k: 'five', v: { ten: ten, five: five } }); parts.push(five); }
      ans = parts.reduce(function (s, x) { return s + x; }, 0);
      if (parts.length > 1) steps.push({ k: 'sum', v: { parts: parts.join(' + '), ans: ans } });
    }
    steps.push({ k: 'ans', v: { p: P, n: n, ans: ans } });
    return { answer: ans, steps: steps };
  }

  /* ---------- 10. digit sums (casting out nines) ---------- */
  function rootSteps(n, steps, label) {
    var x = n;
    while (x > 9) { var s = digitSum(x); steps.push({ k: 'sum', v: { label: label, list: digits(x).join(' + '), s: s } }); x = s; }
    return x;
  }
  function solveDigitSum(p) {
    var steps = [];
    if (p.mode === 'root') {
      steps.push({ k: 'start', v: { n: p.n } });
      var r = rootSteps(p.n, steps, String(p.n));
      if (r === p.n) steps.push({ k: 'single', v: { n: p.n } });
      steps.push({ k: 'root', v: { n: p.n, r: r } });
      return { answer: r, steps: steps };
    }
    var a = p.a, b = p.b, c = p.c;
    steps.push({ k: 'check', v: { a: a, b: b, c: c } });
    var ra = rootSteps(a, steps, String(a)), rb = rootSteps(b, steps, String(b));
    steps.push({ k: 'roots', v: { a: a, ra: ra, b: b, rb: rb } });
    var rm = rootSteps(ra * rb, steps, ra + '×' + rb);
    steps.push({ k: 'mulroot', v: { ra: ra, rb: rb, prod: ra * rb, rm: rm } });
    var rc = rootSteps(c, steps, String(c));
    steps.push({ k: 'croot', v: { c: c, rc: rc } });
    var ok = rm === rc;
    steps.push({ k: ok ? 'match' : 'mismatch', v: { rm: rm, rc: rc, a: a, b: b, c: c } });
    return { answer: ok, steps: steps };
  }

  /* ---------- generators (level 1..3) ---------- */
  function genMul11(level, rng) { var lo = [12, 100, 1000][level - 1], hi = [99, 999, 9999][level - 1]; return { n: ri(rng, lo, hi) }; }
  function genMul9s(level, rng) {
    var k = level === 1 ? (rng() < 0.5 ? 1 : 2) : level === 2 ? 2 : 3;
    var n = k === 1 ? ri(rng, 12, 99) : k === 2 ? (rng() < 0.6 ? ri(rng, 12, 99) : ri(rng, 3, 9)) : (rng() < 0.6 ? ri(rng, 100, 999) : ri(rng, 12, 99));
    return { n: n, k: k };
  }
  function genMul5(level, rng) {
    var m = level === 1 ? 5 : level === 2 ? (rng() < 0.5 ? 25 : 50) : [5, 25, 50][ri(rng, 0, 2)];
    var n = level === 1 ? ri(rng, 12, 99) : level === 2 ? ri(rng, 12, 99) : ri(rng, 100, 999);
    if (m === 5 && level === 3) n = ri(rng, 100, 9999);
    return { n: n, m: m };
  }
  function genSq5(level, rng) { var a = level === 1 ? ri(rng, 1, 9) : level === 2 ? ri(rng, 10, 29) : ri(rng, 30, 99); return { n: a * 10 + 5 }; }
  function genNikhilam(level, rng) {
    var base = level === 1 ? 100 : level === 2 ? 100 : (rng() < 0.6 ? 1000 : 100), spread = level === 1 ? 5 : level === 2 ? 12 : (base === 1000 ? 25 : 15);
    var a = base + ri(rng, -spread, spread), b = rng() < 0.25 ? a : base + ri(rng, -spread, spread);
    if (level === 1 && rng() < 0.7) { a = base - ri(rng, 1, 9); b = base - ri(rng, 1, 9); }   // start with the classic 97 × 96 shape
    if (a === base) a = base - 1;
    if (b === base) b = base + 2;
    return { a: a, b: b, base: base };
  }
  function genCross(level, rng) {
    if (level === 1) return { a: ri(rng, 11, 49), b: ri(rng, 11, 29) };
    if (level === 2) return { a: ri(rng, 12, 99), b: ri(rng, 12, 99) };
    return { a: ri(rng, 102, 999), b: ri(rng, 12, 99) };
  }
  function genDiv9(level, rng) { return { n: level === 1 ? ri(rng, 10, 99) : level === 2 ? ri(rng, 100, 999) : ri(rng, 1000, 9999) }; }
  function genCubeRoot(level, rng) { var r = level === 1 ? ri(rng, 11, 29) : level === 2 ? ri(rng, 11, 59) : ri(rng, 11, 99); return { n: r * r * r }; }
  var PCTS = [5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 75, 90];
  function genPercent(level, rng) {
    var pool = level === 1 ? [10, 20, 25, 50] : level === 2 ? [5, 10, 15, 20, 25, 30, 50, 75] : PCTS;
    var p = pool[ri(rng, 0, pool.length - 1)], n = 20 * (level === 1 ? ri(rng, 1, 20) : level === 2 ? ri(rng, 2, 60) : ri(rng, 5, 300));
    return { p: p, n: n };
  }
  function genDigitSum(level, rng) {
    var lo = [100, 1000, 10000][level - 1], hi = [999, 9999, 99999][level - 1];
    return { mode: 'root', n: ri(rng, lo, hi) };
  }
  function exampleDigitSum(level, rng) {
    var a = ri(rng, 12, level === 1 ? 49 : 99), b = ri(rng, 12, level === 1 ? 29 : 99), c = a * b;
    if (rng() < 0.5) {                                   // plant a one-digit slip that the digit sum will catch
      var d = digits(c), i = ri(rng, 0, d.length - 1), nd = (d[i] + ri(rng, 1, 8)) % 10;
      if (i === 0 && nd === 0) nd = 1;
      d[i] = nd; var c2 = Number(d.join(''));
      if ((c2 - c) % 9 !== 0) c = c2;
    }
    return { mode: 'check', a: a, b: b, c: c };
  }

  var TRICKS = [
    { id: 'mul11', gen: genMul11, solve: solveMul11 },
    { id: 'mul9s', gen: genMul9s, solve: solveMul9s },
    { id: 'mul5', gen: genMul5, solve: solveMul5 },
    { id: 'sq5', gen: genSq5, solve: solveSq5 },
    { id: 'nikhilam', gen: genNikhilam, solve: solveNikhilam },
    { id: 'cross', gen: genCross, solve: solveCross },
    { id: 'div9', gen: genDiv9, solve: solveDiv9, parts: ['q', 'r'] },
    { id: 'cuberoot', gen: genCubeRoot, solve: solveCubeRoot },
    { id: 'percent', gen: genPercent, solve: solvePercent },
    { id: 'digitsum', gen: genDigitSum, example: exampleDigitSum, solve: solveDigitSum }
  ];
  var BY_ID = {};
  TRICKS.forEach(function (t) { BY_ID[t.id] = t; });

  /* the fixed example each trick opens with (level 1 so the first thing a student sees is simple) */
  var OPENERS = {
    mul11: { n: 52 }, mul9s: { n: 47, k: 2 }, mul5: { n: 48, m: 5 }, sq5: { n: 65 }, nikhilam: { a: 97, b: 96, base: 100 },
    cross: { a: 23, b: 14 }, div9: { n: 2301 }, cuberoot: { n: 17576 }, percent: { p: 15, n: 240 }, digitsum: { mode: 'check', a: 47, b: 23, c: 1081 }
  };

  /* question vars: how the question text is written (template key 'q' in content, plus 'q_check' for digit-sum checks) */
  function questionVars(id, p) {
    switch (id) {
      case 'mul11': return { a: p.n, b: 11 };
      case 'mul9s': return { a: p.n, b: pow10(p.k) - 1 };
      case 'mul5': return { a: p.n, b: p.m };
      case 'sq5': return { n: p.n };
      case 'nikhilam': return { a: p.a, b: p.b };
      case 'cross': return { a: p.a, b: p.b };
      case 'div9': return { n: p.n };
      case 'cuberoot': return { n: p.n };
      case 'percent': return { p: p.p, n: p.n };
      case 'digitsum': return p.mode === 'root' ? { n: p.n } : { a: p.a, b: p.b, c: p.c };
    }
    return p;
  }
  /* plain-maths text of a question (language-neutral symbols), used on worksheets */
  function questionMath(id, p) {
    switch (id) {
      case 'mul11': return p.n + ' × 11';
      case 'mul9s': return p.n + ' × ' + (pow10(p.k) - 1);
      case 'mul5': return p.n + ' × ' + p.m;
      case 'sq5': return p.n + '²';
      case 'nikhilam': return p.a === p.b ? p.a + '²' : p.a + ' × ' + p.b;
      case 'cross': return p.a + ' × ' + p.b;
      case 'div9': return p.n + ' ÷ 9';
      case 'cuberoot': return '∛' + p.n;
      case 'percent': return p.p + '% × ' + p.n;
      case 'digitsum': return p.mode === 'root' ? '⊕ ' + p.n : p.a + ' × ' + p.b + ' = ' + p.c + ' ?';
    }
    return '';
  }
  function answerText(id, ans) {
    if (id === 'div9') return ans.q + ' r ' + ans.r;
    if (typeof ans === 'boolean') return ans ? '✓' : '✗';
    return String(ans);
  }

var FINAL = { ans: 1, root: 1, match: 1, mismatch: 1 };
  var VEDIC = {
    tricks: TRICKS, byId: BY_ID, openers: OPENERS,
    solve: function (id, p) { return BY_ID[id].solve(p); },
    gen: function (id, level, rng) { return BY_ID[id].gen(level, rng || Math.random); },
    example: function (id, level, rng) { var t = BY_ID[id]; return (t.example || t.gen)(level, rng || Math.random); },
    isFinal: function (k) { return !!FINAL[k]; }, questionVars: questionVars, questionMath: questionMath, answerText: answerText, digitSum: digitSum
  };
  window.VEDIC = VEDIC;
  if (!window.EDU) return;                                 // engine-only load (tests)

  /* =========================================================================
     PART 2: UI
     ========================================================================= */
  var $ = EDU.$, $$ = EDU.$$, t = EDU.t, el = EDU.el, esc = EDU.esc;
  var store = EDU.store('vedic-maths');
  var S = { trick: 'mul11', level: 1, tab: 'learn', drillN: 5 };
  var saved = store.get('state', null);
  if (saved && typeof saved === 'object') {
    if (BY_ID[saved.trick]) S.trick = saved.trick;
    if ([1, 2, 3].indexOf(saved.level) >= 0) S.level = saved.level;
    if ([5, 10].indexOf(saved.drillN) >= 0) S.drillN = saved.drillN;
  }
  var PROG = store.get('progress', {});
  if (!PROG || typeof PROG !== 'object' || Array.isArray(PROG)) PROG = {};
  function prog(id) {
    var p = PROG[id];
    if (!p || typeof p !== 'object') p = PROG[id] = { tried: 0, right: 0, best: null, drills: 0 };
    p.tried = +p.tried || 0; p.right = +p.right || 0; p.drills = +p.drills || 0;
    if (typeof p.best !== 'number' || !(p.best > 0)) p.best = null;
    return p;
  }
  function saveState() { store.set('state', { trick: S.trick, level: S.level, drillN: S.drillN }); }
  function saveProg() { store.set('progress', PROG); }

  EDU.init({ slug: 'vedic-maths', title: 'app_title' });

  function C() { var c = window.APP_CONTENT || {}; return c[EDU.lang] || c.en; }
  function trickText(id) { return C().tricks[id]; }
  /* template with numbers wrapped in LTR isolates so steps read correctly in Urdu */
  function num(v) { return '<bdi class="vm-n">' + esc(String(v)) + '</bdi>'; }
  function tpl(str, v) {
    return esc(str || '').replace(/\{(\w+)\}/g, function (m, k) { return k in v ? num(v[k]) : m; });
  }
  function stepHtml(id, step) {
    var tt = trickText(id);
    return tpl(tt.steps[step.k] || step.k, step.v);
  }
  function qHtml(id, p) {
    var tt = trickText(id), key = (id === 'digitsum' && p.mode === 'check') ? 'q_check' : 'q';
    return tpl(tt[key], questionVars(id, p));
  }

  /* ---------- trick picker ---------- */
  function renderPicker() {
    var box = $('#picker'); box.innerHTML = '';
    TRICKS.forEach(function (tr) {
      var tt = trickText(tr.id), p = prog(tr.id);
      var b = el('button', { class: 'vm-pick' + (tr.id === S.trick ? ' active' : ''), type: 'button', dataset: { trick: tr.id }, 'aria-pressed': tr.id === S.trick ? 'true' : 'false' },
        el('span', { class: 'vm-pick-ico no-i18n', 'aria-hidden': 'true', text: tt.icon }),
        el('span', { class: 'vm-pick-txt' }, el('b', { text: tt.name }), el('span', { class: 'vm-pick-ex no-i18n', text: tt.sample })),
        p.right ? el('span', { class: 'badge success vm-pick-badge', text: EDU.fmt(p.right) + ' ✓' }) : null);
      b.addEventListener('click', function () { S.trick = tr.id; saveState(); renderPicker(); renderTrick(); });
      box.appendChild(b);
    });
  }

  /* ---------- Learn: animated example ---------- */
  var anim = { timer: null, steps: [], i: 0, params: null };
  function stopAnim() { if (anim.timer) { clearTimeout(anim.timer); anim.timer = null; } }
  function speedMs() { return $('#speed').value === 'fast' ? 500 : $('#speed').value === 'slow' ? 2200 : 1300; }
  function playExample(p, instant) {
    stopAnim();
    anim.params = p;
    var id = S.trick, r = VEDIC.solve(id, p);
    anim.steps = r.steps; anim.i = 0;
    $('#ex-q').innerHTML = qHtml(id, p);
    var list = $('#ex-steps'); list.innerHTML = '';
    $('#ex-ans').textContent = '';
    $('#ex-ans').className = 'vm-ex-ans vm-math';
    function showNext() {
      if (anim.i >= anim.steps.length) {
        $('#ex-ans').textContent = VEDIC.answerText(id, r.answer) === '✓' ? t('check_ok_short') : VEDIC.answerText(id, r.answer) === '✗' ? t('check_bad_short') : VEDIC.answerText(id, r.answer);
        $('#ex-ans').classList.add('show');
        $('#replay').disabled = false;
        return;
      }
      var st = anim.steps[anim.i++];
      var li = el('li', { class: 'vm-step' + (VEDIC.isFinal(st.k) ? ' final' : '') });
      li.innerHTML = stepHtml(id, st);
      list.appendChild(li);
      $$('.vm-step.now', list).forEach(function (e) { e.classList.remove('now'); });
      li.classList.add('now');
      if (instant) showNext(); else anim.timer = setTimeout(showNext, speedMs());
    }
    $('#replay').disabled = !instant;
    showNext();
  }
  function renderTrick() {
    var id = S.trick, tt = trickText(id);
    $('#trick-name').textContent = tt.name;
    $('#trick-tag').textContent = tt.tagline;
    var ul = $('#trick-how'); ul.innerHTML = '';
    tt.how.forEach(function (s) { ul.appendChild(el('li', { text: s })); });
    $('#trick-why').textContent = tt.why;
    renderOwnInputs();
    playExample(anim.params && anim.trick === id ? anim.params : VEDIC.openers[id], false);
    anim.trick = id;
    newTry();
    resetDrillUI();
    renderWorksheet(false);
    renderProgress();
    $('#ws-trick').value = S.trick;
  }

  /* own-example inputs: fields depend on the trick */
  function ownFields(id) {
    switch (id) {
      case 'mul11': return [{ k: 'n', label: 'f_number', min: 1, max: 999999 }];
      case 'mul9s': return [{ k: 'n', label: 'f_number', min: 1, max: 99999 }, { k: 'k', label: 'f_nines', select: [[1, '9'], [2, '99'], [3, '999']] }];
      case 'mul5': return [{ k: 'n', label: 'f_number', min: 1, max: 999999 }, { k: 'm', label: 'f_mult', select: [[5, '5'], [25, '25'], [50, '50']] }];
      case 'sq5': return [{ k: 'n', label: 'f_ends5', min: 5, max: 9995, step: 10 }];
      case 'nikhilam': return [{ k: 'a', label: 'f_first', min: 2, max: 99999 }, { k: 'b', label: 'f_second', min: 2, max: 99999 }];
      case 'cross': return [{ k: 'a', label: 'f_first', min: 10, max: 9999 }, { k: 'b', label: 'f_second', min: 10, max: 999 }];
      case 'div9': return [{ k: 'n', label: 'f_number', min: 10, max: 9999999 }];
      case 'cuberoot': return [{ k: 'r', label: 'f_root', min: 10, max: 99 }];
      case 'percent': return [{ k: 'p', label: 'f_percent', select: PCTS.map(function (x) { return [x, x + '%']; }) }, { k: 'n', label: 'f_of', min: 20, max: 999980, step: 20 }];
      case 'digitsum': return [{ k: 'a', label: 'f_first', min: 2, max: 9999 }, { k: 'b', label: 'f_second', min: 2, max: 9999 }, { k: 'c', label: 'f_claimed', min: 1, max: 99999999 }];
    }
    return [];
  }
  function renderOwnInputs() {
    var box = $('#own-fields'); box.innerHTML = '';
    var cur = VEDIC.openers[S.trick];
    ownFields(S.trick).forEach(function (f) {
      var lab = el('label', { class: 'field vm-own-f' }, el('span', { text: t(f.label) }));
      var inp;
      if (f.select) {
        inp = el('select', { id: 'own-' + f.k, class: 'no-i18n' });
        f.select.forEach(function (o) { inp.appendChild(el('option', { value: String(o[0]), text: o[1] })); });
        inp.value = String(cur[f.k]);
      } else {
        inp = el('input', { id: 'own-' + f.k, type: 'number', inputmode: 'numeric', min: f.min, max: f.max, step: f.step || 1, class: 'vm-math' });
        inp.value = f.k === 'r' ? Math.round(Math.cbrt(cur.n)) : cur[f.k];
        inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); showOwn(); } });
      }
      lab.appendChild(inp); box.appendChild(lab);
    });
  }
  /* validate the user's own numbers and build params; returns a message key on failure */
  function ownParams() {
    var id = S.trick, v = {}, bad = false;
    ownFields(id).forEach(function (f) {
      var e = $('#own-' + f.k), x = Number(e.value);
      if (!e.value.trim() || !isFinite(x) || x !== Math.floor(x)) bad = true;
      if (!f.select && (x < f.min || x > f.max)) bad = true;
      v[f.k] = x;
    });
    if (bad) return { err: 'own_bad' };
    switch (id) {
      case 'mul11': return { p: { n: v.n } };
      case 'mul9s': return { p: { n: v.n, k: v.k } };
      case 'mul5': return { p: { n: v.n, m: v.m } };
      case 'sq5': return v.n % 10 === 5 ? { p: { n: v.n } } : { err: 'own_ends5' };
      case 'nikhilam': {
        var mn = Math.min(v.a, v.b);
        /* pick the power of 10 nearest to both numbers; refuse if either is more than 30% away */
        var best = null, bd = Infinity;
        [10, 100, 1000, 10000, 100000].forEach(function (B) { var d = Math.abs(v.a - B) + Math.abs(v.b - B); if (d < bd) { bd = d; best = B; } });
        if (Math.abs(v.a - best) > best * 0.3 || Math.abs(v.b - best) > best * 0.3 || mn < 2) return { err: 'own_near_base' };
        return { p: { a: v.a, b: v.b, base: best } };
      }
      case 'cross': return { p: { a: v.a, b: v.b } };
      case 'div9': return { p: { n: v.n } };
      case 'cuberoot': return { p: { n: v.r * v.r * v.r } };
      case 'percent': return v.n % 20 === 0 ? { p: { p: v.p, n: v.n } } : { err: 'own_mult20' };
      case 'digitsum': return { p: { mode: 'check', a: v.a, b: v.b, c: v.c } };
    }
    return { err: 'own_bad' };
  }
  function showOwn() {
    var r = ownParams();
    $('#own-msg').textContent = r.err ? t(r.err) : '';
    if (r.err) return;
    anim.params = r.p;
    playExample(r.p, false);
  }

  /* ---------- Try yourself ---------- */
  var TRY = { p: null, answered: false };
  function newTry() {
    TRY.p = VEDIC.gen(S.trick, S.level); TRY.answered = false;
    $('#try-q').innerHTML = qHtml(S.trick, TRY.p);
    $('#try-fb').textContent = ''; $('#try-fb').className = 'vm-fb';
    $('#try-steps').innerHTML = ''; $('#try-steps').hidden = true;
    var two = S.trick === 'div9';
    $('#try-r-wrap').hidden = !two;
    $('#try-a').value = ''; $('#try-r').value = '';
    $('#try-a-label').textContent = two ? t('quotient') : t('your_answer');
    $('#try-check').disabled = false;
    $('#try-a').focus({ preventScroll: true });
  }
  function readAnswer(aEl, rEl) {
    var a = aEl.value.trim();
    if (!a || !/^-?\d+$/.test(a)) return null;
    if (S.trick === 'div9') { var r = rEl.value.trim(); if (!/^\d+$/.test(r)) return null; return { q: Number(a), r: Number(r) }; }
    return Number(a);
  }
  function same(id, given, want) {
    if (id === 'div9') return given && given.q === want.q && given.r === want.r;
    return given === want;
  }
  function checkTry() {
    if (TRY.answered) return;
    var given = readAnswer($('#try-a'), $('#try-r'));
    if (given === null) { $('#try-fb').textContent = t('enter_number'); $('#try-fb').className = 'vm-fb warn'; return; }
    var r = VEDIC.solve(S.trick, TRY.p), ok = same(S.trick, given, r.answer), P = prog(S.trick);
    TRY.answered = true; P.tried++; if (ok) P.right++; saveProg();
    $('#try-fb').textContent = ok ? t('correct') : t('wrong_ans', { a: VEDIC.answerText(S.trick, r.answer) });
    $('#try-fb').className = 'vm-fb ' + (ok ? 'ok' : 'bad');
    var list = $('#try-steps'); list.innerHTML = '';
    r.steps.forEach(function (st) { var li = el('li', { class: 'vm-step' + (VEDIC.isFinal(st.k) ? ' final' : '') }); li.innerHTML = stepHtml(S.trick, st); list.appendChild(li); });
    list.hidden = false;
    renderPicker(); renderProgress();
  }
  $('#try-check').addEventListener('click', checkTry);
  $('#try-next').addEventListener('click', newTry);
  ['#try-a', '#try-r'].forEach(function (sel) {
    $(sel).addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); if (TRY.answered) newTry(); else checkTry(); }
    });
  });

  /* ---------- Drill ---------- */
  var D = { on: false, qs: [], i: 0, right: 0, t0: 0, timer: null, results: [] };
  function resetDrillUI() {
    stopDrill();
    $('#drill-setup').hidden = false; $('#drill-play').hidden = true; $('#drill-done').hidden = true;
    var P = prog(S.trick);
    $('#drill-best').textContent = P.best ? t('best_time', { s: fmtSec(P.best) }) : t('no_best');
  }
  function fmtSec(ms) { return (ms / 1000).toFixed(1); }
  function stopDrill() { D.on = false; if (D.timer) { clearInterval(D.timer); D.timer = null; } }
  function startDrill() {
    D.qs = []; D.results = []; D.i = 0; D.right = 0;
    for (var i = 0; i < S.drillN; i++) D.qs.push(VEDIC.gen(S.trick, S.level));
    D.on = true; D.t0 = Date.now();
    $('#drill-setup').hidden = true; $('#drill-done').hidden = true; $('#drill-play').hidden = false;
    D.timer = setInterval(function () { $('#drill-clock').textContent = fmtSec(Date.now() - D.t0); }, 100);
    showDrillQ();
  }
  function showDrillQ() {
    var p = D.qs[D.i];
    $('#drill-q').innerHTML = qHtml(S.trick, p);
    $('#drill-count').textContent = t('q_of', { i: EDU.fmt(D.i + 1), n: EDU.fmt(D.qs.length) });
    $('#drill-bar').style.width = (D.i / D.qs.length * 100) + '%';
    var two = S.trick === 'div9';
    $('#drill-r-wrap').hidden = !two;
    $('#drill-a-label').textContent = two ? t('quotient') : t('your_answer');
    $('#drill-a').value = ''; $('#drill-r').value = '';
    $('#drill-fb').textContent = '';
    $('#drill-a').focus({ preventScroll: true });
  }
  function answerDrill() {
    if (!D.on) return;
    var given = readAnswer($('#drill-a'), $('#drill-r'));
    if (given === null) { $('#drill-fb').textContent = t('enter_number'); return; }
    var p = D.qs[D.i], r = VEDIC.solve(S.trick, p), ok = same(S.trick, given, r.answer);
    D.results.push({ p: p, given: given, want: r.answer, ok: ok });
    if (ok) D.right++;
    D.i++;
    if (D.i >= D.qs.length) return finishDrill();
    showDrillQ();
  }
  function finishDrill() {
    var ms = Date.now() - D.t0;
    stopDrill();
    var P = prog(S.trick); P.drills++; P.tried += D.qs.length; P.right += D.right;
    var perfect = D.right === D.qs.length, newBest = false;
    if (perfect && D.qs.length === 5 && (!P.best || ms < P.best)) { P.best = ms; newBest = true; }
    saveProg();
    $('#drill-play').hidden = true; $('#drill-done').hidden = false;
    $('#drill-score').textContent = t('drill_score', { r: EDU.fmt(D.right), n: EDU.fmt(D.qs.length), s: fmtSec(ms) });
    $('#drill-score').dataset.right = D.right; $('#drill-score').dataset.ms = ms;
    $('#drill-msg').textContent = newBest ? t('new_best') : perfect ? t('perfect') : D.right >= D.qs.length / 2 ? t('good_try') : t('keep_practising');
    var tb = $('#drill-review'); tb.innerHTML = '';
    D.results.forEach(function (x) {
      var tr = el('tr', { class: x.ok ? 'ok' : 'bad' });
      var q = el('td', { class: 'vm-math' }); q.innerHTML = qHtml(S.trick, x.p);
      tr.appendChild(q);
      tr.appendChild(el('td', { class: 'vm-math no-i18n', text: VEDIC.answerText(S.trick, x.given) }));
      tr.appendChild(el('td', { class: 'vm-math no-i18n', text: VEDIC.answerText(S.trick, x.want) }));
      tr.appendChild(el('td', { text: x.ok ? '✓' : '✗', 'aria-label': x.ok ? t('correct') : t('wrong') }));
      tb.appendChild(tr);
    });
    renderPicker(); renderProgress();
  }
  $('#drill-start').addEventListener('click', startDrill);
  $('#drill-ok').addEventListener('click', answerDrill);
  $('#drill-quit').addEventListener('click', resetDrillUI);
  $('#drill-again').addEventListener('click', startDrill);
  $('#drill-back').addEventListener('click', resetDrillUI);
  ['#drill-a', '#drill-r'].forEach(function (sel) {
    $(sel).addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); answerDrill(); } });
  });
  $$('#drill-n button').forEach(function (b) {
    b.addEventListener('click', function () {
      S.drillN = Number(b.dataset.n); saveState();
      $$('#drill-n button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    });
    b.setAttribute('aria-pressed', Number(b.dataset.n) === S.drillN ? 'true' : 'false');
  });

  /* ---------- level ---------- */
  $$('#levels button').forEach(function (b) {
    b.addEventListener('click', function () {
      S.level = Number(b.dataset.level); saveState();
      $$('#levels button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      newTry(); resetDrillUI(); renderWorksheet(false);
    });
    b.setAttribute('aria-pressed', Number(b.dataset.level) === S.level ? 'true' : 'false');
  });

  /* ---------- Worksheet (20 problems + answer key) ---------- */
  var WS = { items: [] };
  function makeWorksheet() {
    var sel = $('#ws-trick').value, items = [];
    for (var i = 0; i < 20; i++) {
      var id = sel === 'mixed' ? TRICKS[i % TRICKS.length].id : sel;
      var p = VEDIC.gen(id, S.level);
      items.push({ id: id, p: p, ans: VEDIC.solve(id, p).answer });
    }
    WS.items = items;
  }
  function renderWorksheet(fresh) {
    if (fresh || !WS.items.length || (WS.sel !== $('#ws-trick').value)) { makeWorksheet(); WS.sel = $('#ws-trick').value; }
    var sel = WS.sel;
    $('#ws-title').textContent = sel === 'mixed' ? t('ws_mixed') : trickText(sel).name;
    $('#ws-level').textContent = t('level_' + S.level);
    var ol = $('#ws-list'); ol.innerHTML = '';
    var key = $('#ws-key'); key.innerHTML = '';
    WS.items.forEach(function (it, i) {
      var li = el('li', { class: 'vm-math no-i18n' });
      li.innerHTML = '<bdi>' + esc(VEDIC.questionMath(it.id, it.p)) + '</bdi> = <span class="vm-blank"></span>';
      ol.appendChild(li);
      key.appendChild(el('li', { class: 'vm-math no-i18n', text: VEDIC.answerText(it.id, it.ans) }));
    });
    $('#ws-legend').hidden = !(sel === 'mixed' || sel === 'digitsum');
  }
  $('#ws-new').addEventListener('click', function () { renderWorksheet(true); });
  $('#ws-trick').addEventListener('change', function () { renderWorksheet(true); });
  $('#ws-print').addEventListener('click', function () {
    document.body.classList.add('vm-print-ws');
    try { window.print(); } catch (e) { }
  });
  window.addEventListener('afterprint', function () { document.body.classList.remove('vm-print-ws'); });
  function fillWsSelect() {
    var sel = $('#ws-trick'), cur = sel.value || S.trick; sel.innerHTML = '';
    TRICKS.forEach(function (tr) { sel.appendChild(el('option', { value: tr.id, text: trickText(tr.id).name })); });
    sel.appendChild(el('option', { value: 'mixed', text: t('ws_mixed') }));
    sel.value = cur;
  }

  /* ---------- Progress ---------- */
  function renderProgress() {
    var tb = $('#prog-body'); tb.innerHTML = '';
    var any = false;
    TRICKS.forEach(function (tr) {
      var P = prog(tr.id);
      if (!P.tried && !P.drills) return;
      any = true;
      var tr_ = el('tr');
      tr_.appendChild(el('td', { text: trickText(tr.id).name }));
      tr_.appendChild(el('td', { class: 'vm-math', text: EDU.fmt(P.right) + ' / ' + EDU.fmt(P.tried) }));
      tr_.appendChild(el('td', { class: 'vm-math', text: P.tried ? Math.round(P.right / P.tried * 100) + '%' : '–' }));
      tr_.appendChild(el('td', { class: 'vm-math', text: P.best ? fmtSec(P.best) + ' s' : '–' }));
      tb.appendChild(tr_);
    });
    $('#prog-table').hidden = !any; $('#prog-none').hidden = any;
  }
  $('#prog-reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    PROG = {}; saveProg(); renderPicker(); renderProgress(); resetDrillUI();
  });

  /* ---------- tabs ---------- */
  function showTab(name) {
    S.tab = name;
    $$('#tabs button').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.tab === name ? 'true' : 'false'); });
    $$('.vm-tab').forEach(function (p) { p.hidden = p.id !== 'tab-' + name; });
    if (name === 'learn' && anim.params) { /* keep the example as is */ }
    if (name === 'try') $('#try-a').focus({ preventScroll: true });
    if (name === 'worksheet') renderWorksheet(false);
  }
  $$('#tabs button').forEach(function (b) { b.addEventListener('click', function () { showTab(b.dataset.tab); }); });

  /* ---------- example controls ---------- */
  $('#replay').addEventListener('click', function () { if (anim.params) playExample(anim.params, false); });
  $('#new-ex').addEventListener('click', function () { anim.params = VEDIC.example(S.trick, S.level); playExample(anim.params, false); });
  $('#show-all').addEventListener('click', function () { if (anim.params) playExample(anim.params, true); });
  $('#own-go').addEventListener('click', showOwn);
  $('#speed').addEventListener('change', function () { store.set('speed', $('#speed').value); });
  var sp = store.get('speed', 'normal'); if (['slow', 'normal', 'fast'].indexOf(sp) >= 0) $('#speed').value = sp;

  /* ---------- projector mode ---------- */
  function setPresent(on) {
    document.body.classList.toggle('vm-present', on);
    $('#app').classList.toggle('present', on);
    $('#present').setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on) EDU.fullscreen();
    else if (document.fullscreenElement) { try { document.exitFullscreen(); } catch (e) { } }
  }
  $('#present').addEventListener('click', function () { setPresent(!document.body.classList.contains('vm-present')); });
  document.addEventListener('fullscreenchange', function () { if (!document.fullscreenElement && document.body.classList.contains('vm-present')) setPresent(false); });

  /* ---------- language + first render ---------- */
  function renderAll() {
    fillWsSelect();
    renderPicker();
    renderTrick();
    showTab(S.tab);
  }
  EDU.onLang(function () { stopAnim(); renderAll(); if (anim.params) playExample(anim.params, true); });
  renderAll();
})();
