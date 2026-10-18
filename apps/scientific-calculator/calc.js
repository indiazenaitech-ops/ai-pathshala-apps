/* Scientific Calculator: the maths engine. Pure functions, no DOM.  window.SCALC
   A small recursive-descent parser (never eval / Function).
   SCALC.evaluate('2sin(30)+5!', { angle:'deg', ans:0, mem:0 })
     -> { ok:true, value:121, closed:'2sin(30)+5!', autoClosed:0 }
     or { ok:false, code:'div0'|'domain'|'big'|'syntax'|..., why:'sqrt'|..., tok:'...' }

   Grammar (order of operations, like most school calculators):
     sum     := term (('+'|'−') term)*
     term    := comb (('×'|'÷') comb)*
     comb    := jux (('P'|'C') jux)*              10C3 = ¹⁰C₃ = 120 (nCr), 10P3 = 720 (nPr)
     jux     := unary (power)*                     implicit ×, tighter than × and ÷:  2π, 3(4+5), 2sin30, 1÷2π = 1÷(2π)
     unary   := ('−'|'+') unary | power            −2² = −4
     power   := postfix ('^' unary)?               right to left: 2^3^2 = 2^9
     postfix := primary ('!' | '%' | ² ³ ⁻¹ … | ° ′ ″)*
     primary := number | π | e | Ans | M | (sum) | fn(args) | fn⁻¹(x) | fn²(x) | fn x | √x | ∛x
   Numbers: 2.5, .5, 6.02E23 (E or ᴇ = ×10ⁿ, from the EXP key). Small e is always Euler's number 2.718…
   Degrees-minutes-seconds: 12°30′15″ is read in degrees and changed to the current angle unit (like a Casio). */
(function () {
  'use strict';

  var PI = Math.PI;
  var BIG = 1e308;

  function Err(code, why, tok) { this.code = code; this.why = why || ''; this.tok = tok === undefined ? '' : String(tok); }

  /* ------------------------------------------------------------------ number helpers */
  /* addition that removes floating-point noise: keeps 15 significant digits relative to the bigger number,
     so 0.1 + 0.2 = 0.3 exactly and 0.1 + 0.2 − 0.3 = 0 */
  function addR(a, b) {
    var r = a + b;
    if (!isFinite(r) || r === 0) return r;
    var m = Math.max(Math.abs(a), Math.abs(b));
    if (!m) return r;
    var P = Math.floor(Math.log10(Math.abs(r))) - Math.floor(Math.log10(m)) + 15;
    if (P <= 0) return 0;
    if (P >= 17) return r;
    return Number(r.toPrecision(P));
  }
  /* 12 significant digits, the way the answer is shown (−0 becomes 0) */
  function round12(x) {
    if (x === 0 || !isFinite(x)) return x === 0 ? 0 : x;
    return Number(x.toPrecision(12));
  }
  function nearInt(x, rel) {
    var k = Math.round(x);
    return Math.abs(x - k) <= (rel || 1e-12) * Math.max(1, Math.abs(k)) ? k : null;
  }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function finite(x) {
    if (x !== x) throw new Err('domain', 'range');
    if (!isFinite(x) || Math.abs(x) > BIG) throw new Err('big');
    return x;
  }

  /* ------------------------------------------------------------------ angles + trig */
  var R3 = Math.sqrt(3) / 2, R2 = Math.SQRT1_2;
  var SIN12 = [0, 0.5, R3, 1, R3, 0.5, 0, -0.5, -R3, -1, -R3, -0.5];   // sin(30°·k)
  var SIN8 = [0, R2, 1, R2, 0, -R2, -1, -R2];                           // sin(45°·k)
  var UNIT = { deg: 180, rad: PI, grad: 200 };                            // half a turn in each unit

  /* [sin, cos] of x in the current unit; exact at multiples of 30° and 45° (so sin 180° = 0, cos 90° = 0) */
  function sincos(x, mode) {
    var half = UNIT[mode] || 180;
    var tol = mode === 'rad' ? 4e-15 : 1e-14;
    var t12 = x * 6 / half, k = Math.round(t12);
    if (Math.abs(t12 - k) <= tol * Math.max(1, Math.abs(k))) {
      var i = ((k % 12) + 12) % 12;
      return [SIN12[i], SIN12[(i + 3) % 12]];
    }
    var t8 = x * 4 / half, j = Math.round(t8);
    if (Math.abs(t8 - j) <= tol * Math.max(1, Math.abs(j))) {
      var q = ((j % 8) + 8) % 8;
      return [SIN8[q], SIN8[(q + 2) % 8]];
    }
    var r;
    if (mode === 'rad') r = x;
    else {
      var d = (mode === 'grad' ? x * 0.9 : x) % 360;          // reduce in degrees first (exact), then convert
      r = d * PI / 180;
    }
    return [Math.sin(r), Math.cos(r)];
  }
  /* an angle in degrees → the current unit */
  function fromDeg(d, mode) { return mode === 'rad' ? d * PI / 180 : mode === 'grad' ? d / 0.9 : d; }
  /* inverse trig: exact degrees for the standard values (sin⁻¹ 0.5 = 30°) */
  var ASIN_T = [[0, 0], [0.5, 30], [R2, 45], [R3, 60], [1, 90]];
  var ATAN_T = [[0, 0], [1 / Math.sqrt(3), 30], [1, 45], [Math.sqrt(3), 60]];
  function exactDeg(v, table) {
    var a = Math.abs(v);
    for (var i = 0; i < table.length; i++) if (Math.abs(a - table[i][0]) <= 2e-16 * Math.max(1, a)) return (v < 0 ? -1 : 1) * table[i][1];
    return null;
  }
  function asinDeg(v) {
    if (Math.abs(v) > 1) { if (Math.abs(v) - 1 < 1e-14) v = v > 0 ? 1 : -1; else throw new Err('domain', 'asin'); }
    var d = exactDeg(v, ASIN_T);
    return d !== null ? d : Math.asin(v) * 180 / PI;
  }
  function atanDeg(v) {
    var d = exactDeg(v, ATAN_T);
    return d !== null ? d : Math.atan(v) * 180 / PI;
  }
  /* keep radians exact-free: compute directly from the JS function in radian mode for the best accuracy */
  function invOut(deg, rad, ctx) { ctx.usedAngle = true; var mode = ctx.angle; return mode === 'rad' ? rad : mode === 'grad' ? deg / 0.9 : deg; }

  /* ------------------------------------------------------------------ functions */
  function fact(x) {
    var n = nearInt(x);
    if (n === null || n < 0) throw new Err('domain', 'fact');
    if (n > 170) throw new Err('big');
    var r = 1;
    for (var i = 2; i <= n; i++) r *= i;
    return r;
  }
  function wholePair(n, r) {
    var a = nearInt(n), b = nearInt(r);
    if (a === null || b === null || a < 0 || b < 0 || b > a) throw new Err('domain', 'ncr');
    return [a, b];
  }
  function nCr(n, r) {
    var p = wholePair(n, r), N = p[0], k = Math.min(p[1], p[0] - p[1]), v = 1;
    for (var i = 1; i <= k; i++) {
      v = v * (N - k + i) / i;
      if (v > BIG) throw new Err('big');
    }
    return v < 9007199254740992 ? Math.round(v) : v;
  }
  function nPr(n, r) {
    var p = wholePair(n, r), N = p[0], k = p[1], v = 1;
    for (var i = 0; i < k; i++) {
      v *= (N - i);
      if (v > BIG) throw new Err('big');
    }
    return v;
  }
  function wholeList(args) {
    return args.map(function (x) {
      var n = nearInt(x);
      if (n === null || Math.abs(n) > 9007199254740991) throw new Err('domain', 'int');
      return Math.abs(n);
    });
  }
  function hcf(args) { return wholeList(args).reduce(function (a, b) { return gcd(a, b); }); }
  function lcm(args) {
    return wholeList(args).reduce(function (a, b) {
      if (a === 0 || b === 0) return 0;
      var v = a / gcd(a, b) * b;
      if (v > BIG) throw new Err('big');
      return v;
    });
  }
  function log10(x) {
    if (!(x > 0)) throw new Err('domain', 'log');
    return Math.log10(x);
  }
  function logb(b, x) {
    if (!(b > 0) || b === 1) throw new Err('domain', 'logbase');
    if (!(x > 0)) throw new Err('domain', 'log');
    var r = b === 10 ? Math.log10(x) : b === 2 ? Math.log2(x) : Math.log(x) / Math.log(b);
    var k = nearInt(r, 1e-13);
    if (k !== null && Math.pow(b, k) === x) return k;     // log(3, 81) = 4 exactly
    return r;
  }
  /* real powers: (−8)^(1/3) = −2 (odd root of a negative number), 10^n exact */
  function pow(a, b) {
    if (a === 0 && b < 0) throw new Err('div0');
    if (a === 10 && b === Math.round(b) && Math.abs(b) <= 308) return Number('1e' + b);
    var r = Math.pow(a, b);
    if (r !== r && a < 0) {
      for (var q = 3; q <= 15; q += 2) {
        var p = b * q, rp = Math.round(p);
        if (Math.abs(p - rp) < 1e-9) { r = (rp % 2 ? -1 : 1) * Math.pow(-a, b); break; }
      }
      if (r !== r) throw new Err('domain', 'pow');
    }
    return finite(r);
  }
  function root(n, x) {
    if (n === 0) throw new Err('domain', 'root0');
    var r;
    if (x < 0) {
      var k = nearInt(n);
      if (k === null || k % 2 === 0) throw new Err('domain', 'root');
      r = -Math.pow(-x, 1 / k);
    } else r = Math.pow(x, 1 / n);
    var ki = nearInt(n), ri = Math.round(r);
    if (ki !== null && ki > 0 && Math.abs(r - ri) < 1e-9 * Math.max(1, Math.abs(ri)) && Math.pow(ri, ki) === x) return ri;   // root(3, 27) = 3
    return r;
  }
  function modf(a, b) {
    if (b === 0) throw new Err('div0');
    var r = a - b * Math.floor(a / b);
    return Math.abs(r) < 1e-12 * Math.abs(b) ? 0 : r;
  }

  /* name → [minArgs, maxArgs, fn(args, ctx)]; trig functions use ctx.angle */
  function trig(which) {
    return function (a, ctx) {
      ctx.usedAngle = true;
      var sc = sincos(a[0], ctx.angle), s = sc[0], c = sc[1];
      switch (which) {
        case 'sin': return s;
        case 'cos': return c;
        case 'tan': if (c === 0) throw new Err('domain', 'trig'); return s / c;
        case 'sec': if (c === 0) throw new Err('domain', 'trig'); return 1 / c;
        case 'cosec': if (s === 0) throw new Err('domain', 'trig'); return 1 / s;
        case 'cot': if (s === 0) throw new Err('domain', 'trig'); return c / s;
      }
    };
  }
  var F = {
    sin: [1, 1, trig('sin')], cos: [1, 1, trig('cos')], tan: [1, 1, trig('tan')],
    sec: [1, 1, trig('sec')], cosec: [1, 1, trig('cosec')], cot: [1, 1, trig('cot')],
    asin: [1, 1, function (a, ctx) { var d = asinDeg(a[0]); return invOut(d, d === 90 || d === -90 || d === 0 ? d * PI / 180 : Math.asin(a[0]), ctx); }],
    acos: [1, 1, function (a, ctx) { var d = 90 - asinDeg(a[0]); return invOut(d, Math.acos(Math.max(-1, Math.min(1, a[0]))), ctx); }],
    atan: [1, 1, function (a, ctx) { return invOut(atanDeg(a[0]), Math.atan(a[0]), ctx); }],
    /* NCERT principal values: sec⁻¹ in [0, π] − {π/2}, cosec⁻¹ in [−π/2, π/2] − {0}, cot⁻¹ in (0, π) */
    asec: [1, 1, function (a, ctx) { if (Math.abs(a[0]) < 1) throw new Err('domain', 'asec'); var d = 90 - asinDeg(1 / a[0]); return invOut(d, Math.acos(1 / a[0]), ctx); }],
    acosec: [1, 1, function (a, ctx) { if (Math.abs(a[0]) < 1) throw new Err('domain', 'asec'); var d = asinDeg(1 / a[0]); return invOut(d, Math.asin(1 / a[0]), ctx); }],
    acot: [1, 1, function (a, ctx) { var d = 90 - atanDeg(a[0]); return invOut(d, PI / 2 - Math.atan(a[0]), ctx); }],
    sinh: [1, 1, function (a) { return finite(Math.sinh(a[0])); }],
    cosh: [1, 1, function (a) { return finite(Math.cosh(a[0])); }],
    tanh: [1, 1, function (a) { return Math.tanh(a[0]); }],
    asinh: [1, 1, function (a) { return Math.asinh(a[0]); }],
    acosh: [1, 1, function (a) { if (a[0] < 1) throw new Err('domain', 'acosh'); return Math.acosh(a[0]); }],
    atanh: [1, 1, function (a) { if (!(Math.abs(a[0]) < 1)) throw new Err('domain', 'atanh'); return Math.atanh(a[0]); }],
    log: [1, 2, function (a) { return a.length === 2 ? logb(a[0], a[1]) : log10(a[0]); }],
    ln: [1, 1, function (a) { if (!(a[0] > 0)) throw new Err('domain', 'log'); return Math.log(a[0]); }],
    exp: [1, 1, function (a) { return finite(Math.exp(a[0])); }],
    sqrt: [1, 1, function (a) { if (a[0] < 0) throw new Err('domain', 'sqrt'); return Math.sqrt(a[0]); }],
    cbrt: [1, 1, function (a) { var r = Math.cbrt(a[0]), k = Math.round(r); return k * k * k === a[0] ? k : r; }],
    root: [2, 2, function (a) { return root(a[0], a[1]); }],
    abs: [1, 1, function (a) { return Math.abs(a[0]); }],
    ncr: [2, 2, function (a) { return nCr(a[0], a[1]); }],
    npr: [2, 2, function (a) { return nPr(a[0], a[1]); }],
    hcf: [2, 20, function (a) { return hcf(a); }],
    lcm: [2, 20, function (a) { return lcm(a); }],
    mod: [2, 2, function (a) { return modf(a[0], a[1]); }]
  };
  var ALIAS = {
    csc: 'cosec', arcsin: 'asin', arccos: 'acos', arctan: 'atan', arcsec: 'asec', arccosec: 'acosec', acsc: 'acosec',
    arccsc: 'acosec', arccot: 'acot', arsinh: 'asinh', arcosh: 'acosh', artanh: 'atanh', arcsinh: 'asinh', arccosh: 'acosh',
    arctanh: 'atanh', lg: 'log', gcd: 'hcf', ncr: 'ncr', npr: 'npr'
  };
  var INV = { sin: 'asin', cos: 'acos', tan: 'atan', sec: 'asec', cosec: 'acosec', cot: 'acot', sinh: 'asinh', cosh: 'acosh', tanh: 'atanh' };
  var CONST = { pi: PI, ans: 'ans' };
  var NAMES = Object.keys(F).concat(Object.keys(ALIAS), Object.keys(CONST))
    .filter(function (v, i, a) { return a.indexOf(v) === i; })
    .sort(function (p, q) { return q.length - p.length; });

  /* ------------------------------------------------------------------ tokens */
  var SUPMAP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };
  function normalize(src) {
    return String(src == null ? '' : src)
      .replace(/[०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯]/g, function (d) { return String((d.charCodeAt(0) & 15) - 6); })   // Indian-script digits
      .replace(/[٠-٩۰-۹]/g, function (d) { return String(d.charCodeAt(0) & 15); })                                   // Urdu digits
      .replace(/٫/g, '.').replace(/[−–—‐-]/g, '-').replace(/[×·⋅∙✕*]/g, '×').replace(/[÷∕\/]/g, '÷')
      .replace(/××/g, '^').replace(/[′’']/g, '′').replace(/[″”"]/g, '″').replace(/º/g, '°')
      .replace(/[\[{]/g, '(').replace(/[\]}]/g, ')').replace(/ᴇ/g, 'E').replace(/ /g, ' ');
  }
  function tokenize(raw) {
    var s = normalize(raw), out = [], i = 0, m;
    while (i < s.length) {
      var ch = s[i], rest = s.slice(i);
      if (ch === ' ' || ch === '\t' || ch === '\n') { i++; continue; }
      /* 6.02E23 (capital E, the EXP key) means 6.02 × 10²³. Small e is always Euler's number, as on the keypad,
         so 2e−1 = 2 × 2.718… − 1 (the app shows a tip when a small e sits between digits). */
      if ((m = /^(\d+\.?\d*|\.\d+)(E[+\-]?\d+)?/.exec(rest))) {
        var after = s[i + m[0].length];
        if (after === '.') throw new Err('syntax', 'number', (/^[\d.E+\-]+/.exec(rest) || [m[0]])[0]);
        if (!m[2] && after === 'E') throw new Err('syntax', 'exp', 'E');
        var v = Number(m[0]);
        if (!isFinite(v)) throw new Err('big');
        out.push({ t: 'num', v: v, s: m[0] });
        i += m[0].length; continue;
      }
      if ((m = /^[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+/.exec(rest))) {
        var txt = m[0].replace(/./g, function (c) { return SUPMAP[c]; });
        if (!/^-?\d+$/.test(txt)) throw new Err('syntax', 'syntax', m[0]);
        out.push({ t: 'sup', v: Number(txt), s: m[0] });
        i += m[0].length; continue;
      }
      if ((m = /^[A-Za-z]+/.exec(rest))) {
        var run = m[0], j = 0;
        while (j < run.length) {
          var hit = null, low = run.slice(j).toLowerCase();
          for (var k = 0; k < NAMES.length; k++) if (low.substr(0, NAMES[k].length) === NAMES[k]) { hit = NAMES[k]; break; }
          if (hit) {
            var nm = ALIAS[hit] || hit;
            if (nm === 'pi') out.push({ t: 'num', v: PI, s: 'π', c: 1 });
            else if (nm === 'ans') out.push({ t: 'ans', s: 'Ans' });
            else out.push({ t: 'fn', v: nm, s: run.substr(j, hit.length) });
            j += hit.length; continue;
          }
          var c1 = run[j];
          if ((c1 === 'x' || c1 === 'X') && run.length === 1) out.push({ t: 'op', v: '×', s: c1 });   // 2x3 typed with the letter x
          else if (c1 === 'e') out.push({ t: 'num', v: Math.E, s: 'e', c: 1 });
          else if (c1 === 'C' || c1 === 'P') out.push({ t: 'op', v: c1, s: c1 });
          else if (c1 === 'M') out.push({ t: 'mem', s: 'M' });
          else if (c1 === 'E') {                               // "…E" at the end of a word, e.g. "2πE5"
            var tail = s.slice(i + j + 1);
            if ((m = /^([+\-]?\d+)/.exec(tail)) && j === run.length - 1) {
              var ev2 = Number('1e' + m[1]); if (!isFinite(ev2)) throw new Err('big');
              out.push({ t: 'num', v: ev2, s: 'E' + m[1] }); i += m[1].length;
            } else throw new Err('syntax', 'exp', 'E');
          } else throw new Err('syntax', 'unknown', run);
          j++;
        }
        i += run.length; continue;
      }
      if (ch === 'π') { out.push({ t: 'num', v: PI, s: 'π', c: 1 }); i++; continue; }
      if (ch === 'ˣ' && s[i + 1] === '√') { out.push({ t: 'op', v: 'xroot', s: 'ˣ√' }); i += 2; continue; }
      if (ch === '√') { out.push({ t: 'fn', v: 'sqrt', s: '√', root: 1 }); i++; continue; }
      if (ch === '∛') { out.push({ t: 'fn', v: 'cbrt', s: '∛', root: 1 }); i++; continue; }
      if ('+-×÷^'.indexOf(ch) >= 0) { out.push({ t: 'op', v: ch === '-' ? '−' : ch, s: ch }); i++; continue; }
      if ('!%°′″'.indexOf(ch) >= 0) { out.push({ t: 'post', v: ch, s: ch }); i++; continue; }
      if (ch === '(' || ch === ')' || ch === ',') { out.push({ t: ch, s: ch }); i++; continue; }
      if (ch === '=') throw new Err('syntax', 'equals', '=');
      throw new Err('syntax', 'unknown', ch);
    }
    out.push({ t: 'end', s: '' });
    return out;
  }

  /* ------------------------------------------------------------------ parser → tree */
  function parse(tokens) {
    var i = 0, depth = 0, closed = 0;
    function peek(o) { return tokens[i + (o || 0)]; }
    function next() { return tokens[i++]; }
    function isOp(tk, v) { return tk.t === 'op' && tk.v === v; }
    function startsOperand(tk) { return tk.t === 'num' || tk.t === 'fn' || tk.t === '(' || tk.t === 'ans' || tk.t === 'mem'; }
    function closeParen() {
      var tk = peek();
      if (tk.t === ')') { next(); depth--; return; }
      if (tk.t === 'end') { closed++; depth--; return; }          // brackets close themselves at the end
      throw new Err('syntax', tk.t === ',' ? 'comma' : 'syntax', tk.s);
    }

    function sum() {
      var n = term();
      while (isOp(peek(), '+') || isOp(peek(), '−')) { var op = next().v; n = { k: op, a: n, b: term() }; }
      return n;
    }
    function term() {
      var n = comb();
      while (isOp(peek(), '×') || isOp(peek(), '÷')) { var op = next().v; n = { k: op, a: n, b: comb() }; }
      return n;
    }
    function comb() {
      var n = jux();
      while (isOp(peek(), 'C') || isOp(peek(), 'P')) { var op = next().v; n = { k: op, a: n, b: jux() }; }
      return n;
    }
    function jux() {
      var n = unary();
      while (startsOperand(peek())) {
        if (peek().t === 'num' && !peek().c && tokens[i - 1] && tokens[i - 1].t === 'num' && !tokens[i - 1].c) throw new Err('syntax', 'twonum', peek().s);
        n = { k: '×', a: n, b: power() };
      }
      return n;
    }
    function unary() {
      if (isOp(peek(), '−')) { next(); return { k: 'neg', a: unary() }; }
      if (isOp(peek(), '+')) { next(); return unary(); }
      return power();
    }
    function power() {
      var base = postfix();
      if (isOp(peek(), '^')) { next(); return { k: '^', a: base, b: unary() }; }
      if (isOp(peek(), 'xroot')) { next(); return { k: 'xroot', a: base, b: unary() }; }   // 3ˣ√27 = 3
      return base;
    }
    function postfix() {
      var n = primary();
      for (;;) {
        var tk = peek();
        if (tk.t === 'post' && (tk.v === '!' || tk.v === '%')) { next(); n = { k: tk.v, a: n }; continue; }
        if (tk.t === 'sup') { next(); n = tk.v === -1 ? { k: 'recip', a: n } : { k: '^', a: n, b: { k: 'num', v: tk.v } }; continue; }
        if (tk.t === 'post' && (tk.v === '°' || tk.v === '′' || tk.v === '″')) { n = dms(n); continue; }
        return n;
      }
    }
    /* 12°30′15″ → one angle in degrees; also 30′ (minutes) or 45″ (seconds) alone */
    function dms(n) {
      var tk = next(), node = { k: 'dms', a: n, m: 0, s: 0 };
      if (tk.v === '′') node = { k: 'dms', a: { k: 'num', v: 0 }, m: n, s: 0, mOnly: true };
      if (tk.v === '″') return { k: 'dms', a: { k: 'num', v: 0 }, m: 0, s: n, sOnly: true };
      if (tk.v === '°' && peek().t === 'num' && peek(1).t === 'post' && peek(1).v === '′') { node.m = { k: 'num', v: next().v }; next(); }
      if (peek().t === 'num' && peek(1).t === 'post' && peek(1).v === '″') { node.s = { k: 'num', v: next().v }; next(); }
      return node;
    }
    function args() {                                          // after '(': one or more comma-separated sums
      var list = [sum()];
      while (peek().t === ',') { next(); list.push(sum()); }
      closeParen();
      return list;
    }
    function primary() {
      var tk = next();
      if (tk.t === 'num') return { k: 'num', v: tk.v };
      if (tk.t === 'ans') return { k: 'ans' };
      if (tk.t === 'mem') return { k: 'mem' };
      if (tk.t === '(') {
        if (peek().t === ')') throw new Err('syntax', 'emptyparen', '()');
        depth++;
        var e = sum();
        if (peek().t === ',') throw new Err('syntax', 'comma', ',');
        closeParen();
        return e;
      }
      if (tk.t === 'fn') return call(tk);
      if (tk.t === ')') throw new Err('syntax', depth > 0 ? 'syntax' : 'paren', ')');
      if (tk.t === 'end') throw new Err('syntax', 'end', '');
      if (tk.t === ',') throw new Err('syntax', 'comma', ',');
      if (tk.t === 'post' || tk.t === 'sup' || tk.t === 'op') throw new Err('syntax', tokens[i - 2] ? 'syntax' : 'start', tk.s);
      throw new Err('syntax', 'syntax', tk.s);
    }
    function call(tk) {
      var name = tk.v, inv = false, expo = null;
      if (!tk.root) {
        if (peek().t === 'sup') { var sv = next().v; if (sv === -1) inv = true; else expo = { k: 'num', v: sv }; }
        else if (isOp(peek(), '^') && (peek(1).t === 'num' || (isOp(peek(1), '−') && peek(2).t === 'num'))) {
          next();
          var neg = isOp(peek(), '−'); if (neg) next();
          var ev = next().v * (neg ? -1 : 1);
          if (ev === -1) inv = true; else expo = { k: 'num', v: ev };
        }
      }
      if (inv) { if (!INV[name]) throw new Err('syntax', 'noinv', tk.s); name = INV[name]; }
      var list;
      if (peek().t === '(') { next(); depth++; if (peek().t === ')') throw new Err('args', name, tk.s); list = args(); }
      else if (startsOperand(peek()) || isOp(peek(), '−')) {
        if (isOp(peek(), '−')) { next(); list = [{ k: 'neg', a: power() }]; }
        else list = [power()];
        if (!tk.root) while (peek().t === 'num' && peek().c) list[0] = { k: '×', a: list[0], b: power() };   // sin 2π = sin(2π)
      } else throw new Err('syntax', 'fnarg', tk.s);
      var spec = F[name];
      if (list.length < spec[0] || list.length > spec[1]) throw new Err('args', name, tk.s);
      var node = { k: 'call', f: name, args: list };
      return expo ? { k: '^', a: node, b: expo } : node;
    }

    var tree = sum();
    var last = peek();
    if (last.t !== 'end') {
      if (last.t === ')') throw new Err('syntax', 'paren', ')');
      if (last.t === ',') throw new Err('syntax', 'comma', ',');
      throw new Err('syntax', 'syntax', last.s);
    }
    return { tree: tree, closed: closed };
  }

  /* ------------------------------------------------------------------ evaluation */
  function ev(n, ctx) {
    var a, b;
    switch (n.k) {
      case 'num': return n.v;
      case 'ans': return ctx.ans || 0;
      case 'mem': return ctx.mem || 0;
      case 'neg': return -ev(n.a, ctx);
      case '+': return finite(addR(ev(n.a, ctx), ev(n.b, ctx)));
      case '−': return finite(addR(ev(n.a, ctx), -ev(n.b, ctx)));
      case '×': a = ev(n.a, ctx); b = ev(n.b, ctx); return finite(a * b);
      case '÷': a = ev(n.a, ctx); b = ev(n.b, ctx); if (b === 0) throw new Err('div0'); return finite(a / b);
      case '^': return pow(ev(n.a, ctx), ev(n.b, ctx));
      case 'xroot': return finite(root(ev(n.a, ctx), ev(n.b, ctx)));
      case 'C': return nCr(ev(n.a, ctx), ev(n.b, ctx));
      case 'P': return nPr(ev(n.a, ctx), ev(n.b, ctx));
      case '!': return fact(ev(n.a, ctx));
      case '%': return ev(n.a, ctx) / 100;
      case 'recip': a = ev(n.a, ctx); if (a === 0) throw new Err('div0'); return finite(1 / a);
      case 'dms':
        var d = ev(n.a, ctx), mi = n.m ? ev(n.m, ctx) : 0, se = n.s ? ev(n.s, ctx) : 0;
        var sign = d < 0 ? -1 : 1;
        var deg = addR(addR(d, sign * mi / 60), sign * se / 3600);
        ctx.usedAngle = true;
        return finite(fromDeg(deg, ctx.angle));
      case 'call':
        var vals = n.args.map(function (x) { return ev(x, ctx); });
        var r = F[n.f][2](vals, ctx);
        if (r !== r) throw new Err('domain', 'range');
        return finite(r);
    }
    throw new Err('syntax', 'syntax', '');
  }

  /* SCALC.evaluate(text, ctx) — never throws */
  function evaluate(src, ctx) {
    ctx = ctx || {};
    ctx.angle = UNIT[ctx.angle] ? ctx.angle : 'deg';
    var text = String(src == null ? '' : src);
    if (!text.trim()) return { ok: false, code: 'empty', why: '', tok: '' };
    if (text.length > 400) return { ok: false, code: 'syntax', why: 'long', tok: '' };
    try {
      var p = parse(tokenize(text));
      var v = ev(p.tree, ctx);
      if (v === 0) v = 0;                                      // no −0
      return { ok: true, value: v, autoClosed: p.closed, closed: p.closed ? text.replace(/\s+$/, '') + new Array(p.closed + 1).join(')') : text };
    } catch (e) {
      if (e instanceof Err) return { ok: false, code: e.code, why: e.why, tok: e.tok };
      if (e instanceof RangeError) return { ok: false, code: 'syntax', why: 'long', tok: '' };   // absurdly deep nesting
      throw e;
    }
  }

  /* ------------------------------------------------------------------ display formats */
  /* digits of |x| rounded to 12 significant digits: { neg, d:'602214076000', e:23 } */
  function digits(x) {
    var v = round12(x);
    if (v === 0) return { neg: false, d: '0', e: 0, zero: true };
    var s = Math.abs(v).toExponential(11), k = s.indexOf('e');
    return { neg: v < 0, d: s.slice(0, k).replace('.', ''), e: Number(s.slice(k + 1)) };
  }
  function trimZeros(f) { return f.replace(/0+$/, ''); }
  function group(intPart, how) {
    if (how === 'off' || intPart.length <= 3) return intPart;
    if (how === 'intl') return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    var last3 = intPart.slice(-3), rest = intPart.slice(0, -3);
    return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  }
  /* format(x, {notation:'norm'|'sci'|'eng', group:'in'|'intl'|'off'}) → { neg, int, frac, exp|null } */
  function format(x, opt) {
    opt = opt || {};
    var D = digits(x), note = opt.notation || 'norm';
    if (D.zero) return { neg: false, int: '0', frac: '', exp: note === 'norm' ? null : 0 };
    var useSci = note !== 'norm' || D.e >= 12 || D.e < -6;
    if (!useSci) {
      var ip, fp;
      if (D.e >= 0) { ip = D.d.slice(0, D.e + 1); fp = D.d.slice(D.e + 1); }
      else { ip = '0'; fp = new Array(-D.e).join('0') + D.d; }
      return { neg: D.neg, int: group(ip, opt.group || 'in'), frac: trimZeros(fp), exp: null };
    }
    var e = D.e, shift = 0;
    if (note === 'eng') { var e3 = Math.floor(e / 3) * 3; shift = e - e3; e = e3; }
    return { neg: D.neg, int: D.d.slice(0, 1 + shift), frac: trimZeros(D.d.slice(1 + shift)), exp: e };
  }
  /* plain text a person can type back in: 1234.5, −2.5E−7 */
  function toExpr(x) {
    var f = format(x, { notation: 'norm', group: 'off' });
    var s = (f.neg ? '−' : '') + f.int + (f.frac ? '.' + f.frac : '');
    return f.exp === null ? s : s + 'E' + (f.exp < 0 ? '−' + (-f.exp) : f.exp);
  }

  var SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  function supNum(n) { return String(n).replace(/-/g, '⁻').replace(/\d/g, function (d) { return SUP[d]; }); }
  /* one line of text: −1,234.5 or 6.02 × 10²³ */
  function fmtText(x, opt) {
    var f = format(x, opt);
    return (f.neg ? '−' : '') + f.int + (f.frac ? '.' + f.frac : '') + (f.exp === null ? '' : ' × 10' + supNum(f.exp));
  }
  /* for the clipboard / spreadsheets: -1234.5 or 6.02E23 */
  function plain(x) {
    var f = format(x, { notation: 'norm', group: 'off' });
    return (f.neg ? '-' : '') + f.int + (f.frac ? '.' + f.frac : '') + (f.exp === null ? '' : 'E' + f.exp);
  }

  /* decimal → fraction by continued fractions (denominator up to 100000, error < 1e-13 relative) */
  function toFraction(x, maxDen) {
    maxDen = maxDen || 100000;
    if (!isFinite(x)) return null;
    var neg = x < 0, a0 = Math.abs(x);
    if (a0 >= 1e12) return null;
    if (a0 === Math.floor(a0)) return { neg: neg && a0 > 0, n: a0, d: 1 };
    var tol = a0 * 1e-13, b = a0, h1 = 1, h2 = 0, k1 = 0, k2 = 1;
    for (var it = 0; it < 64; it++) {
      var a = Math.floor(b), h = a * h1 + h2, k = a * k1 + k2;
      if (k > maxDen) return null;
      if (Math.abs(a0 - h / k) <= tol) return { neg: neg, n: h, d: k };
      var fr = b - a;
      if (fr <= 0) return null;
      b = 1 / fr; h2 = h1; h1 = h; k2 = k1; k1 = k;
    }
    return null;
  }
  /* decimal degrees → { neg, d, m, s } with seconds to 2 decimal places */
  function toDMS(x) {
    var v = round12(x), neg = v < 0;
    v = Math.abs(v);
    var cs = Math.round(v * 360000);                             // hundredths of a second
    if (!isFinite(cs) || cs > 9e15) return null;
    var d = Math.floor(cs / 360000), rem = cs - d * 360000;
    var m = Math.floor(rem / 6000), s = (rem - m * 6000) / 100;
    return { neg: neg && cs > 0, d: d, m: m, s: s };
  }

  /* ------------------------------------------------------------------ equations */
  function det2(a, b, c, d) { return addR(a * d, -(b * c)); }
  function det3(M) {
    var m1 = det2(M[1][1], M[1][2], M[2][1], M[2][2]);
    var m2 = det2(M[1][0], M[1][2], M[2][0], M[2][2]);
    var m3 = det2(M[1][0], M[1][1], M[2][0], M[2][1]);
    return { value: addR(addR(M[0][0] * m1, -(M[0][1] * m2)), M[0][2] * m3), minors: [m1, m2, m3] };
  }
  /* rank of a matrix (rows of numbers), for telling "no solution" from "infinitely many" */
  function rank(rows) {
    var A = rows.map(function (r) { return r.slice(); }), R = A.length, C = A[0].length, rk = 0;
    var scale = 0;
    A.forEach(function (r) { r.forEach(function (v) { scale = Math.max(scale, Math.abs(v)); }); });
    var eps = (scale || 1) * 1e-10;
    for (var col = 0; col < C && rk < R; col++) {
      var piv = rk;
      for (var r = rk + 1; r < R; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
      if (Math.abs(A[piv][col]) <= eps) continue;
      var tmp = A[rk]; A[rk] = A[piv]; A[piv] = tmp;
      for (var r2 = 0; r2 < R; r2++) {
        if (r2 === rk) continue;
        var f = A[r2][col] / A[rk][col];
        for (var c2 = col; c2 < C; c2++) A[r2][c2] = addR(A[r2][c2], -f * A[rk][c2]);
      }
      rk++;
    }
    return rk;
  }
  /* rows: [[a, b, c], [a, b, c]] for a·x + b·y = c   or 3 rows of [a, b, c, d] */
  function solveLinear(rows) {
    var n = rows.length, A = rows.map(function (r) { return r.slice(0, n); }), B = rows.map(function (r) { return r[n]; });
    function withCol(j) { return A.map(function (r, i) { var c = r.slice(); c[j] = B[i]; return c; }); }
    function det(M) { return n === 2 ? det2(M[0][0], M[0][1], M[1][0], M[1][1]) : det3(M).value; }
    var D = det(A), Ds = [], i;
    for (i = 0; i < n; i++) Ds.push(det(withCol(i)));
    var out = { n: n, D: D, Ds: Ds, A: A, B: B, minors: n === 3 ? det3(A).minors : null };
    var scale = 0;
    A.forEach(function (r) { r.forEach(function (v) { scale = Math.max(scale, Math.abs(v)); }); });
    if (D === 0 || Math.abs(D) <= Math.pow(scale || 1, n) * 1e-12) {
      out.D = 0;
      var rA = rank(A), rAB = rank(rows.map(function (r) { return r.slice(0, n + 1); }));
      out.kind = rA < rAB ? 'none' : 'many';
      return out;
    }
    out.kind = 'unique';
    out.x = Ds.map(function (d) { var v = d / D; return Math.abs(v) < 1e-15 * (Math.abs(d) + 1) ? 0 : v; });
    return out;
  }
  /* biggest k with k² dividing n (n a whole number up to 10¹²): √n = k√(n/k²) */
  function surd(n) {
    var k = 1, m = n;
    for (var p = 2; p * p <= m; p++) while (m % (p * p) === 0) { m /= p * p; k *= p; }
    return { k: k, m: m };
  }
  /* a·x² + b·x + c = 0 */
  function solveQuadratic(a, b, c) {
    var out = { a: a, b: b, c: c };
    if (a === 0) {
      if (b === 0) { out.kind = c === 0 ? 'all' : 'none'; return out; }
      out.kind = 'linear'; out.roots = [-c / b || 0]; return out;
    }
    var b2 = b * b, ac4 = 4 * a * c, D = addR(b2, -ac4);
    out.b2 = b2; out.ac4 = ac4; out.D = D;
    if (!isFinite(D)) { out.kind = 'big'; return out; }
    if (D > 0) {
      var sq = Math.sqrt(D), q = -0.5 * (b + (b >= 0 ? sq : -sq));
      var r1 = q / a, r2 = q !== 0 ? c / q : -r1;               // stable: no loss of digits
      var plus = (-b + sq) / (2 * a);
      out.kind = 'two'; out.sqrtD = sq;
      out.roots = Math.abs(plus - r1) <= Math.abs(plus - r2) ? [r1, r2] : [r2, r1];   // [(−b + √D)/2a, (−b − √D)/2a]
    } else if (D === 0) {
      out.kind = 'equal'; out.roots = [-b / (2 * a) || 0];
    } else {
      out.kind = 'complex';
      out.re = -b / (2 * a) || 0; out.im = Math.abs(Math.sqrt(-D) / (2 * a)); out.sqrtD = Math.sqrt(-D);
    }
    /* exact form (whole-number coefficients): x = (p ± k√m)/q, reduced */
    var ints = [a, b, c].every(function (v) { return v === Math.round(v) && Math.abs(v) <= 1e6; });
    if (ints && out.kind !== 'equal' && Math.abs(D) <= 1e12) {
      var sd = surd(Math.abs(D)), p = -b, k = sd.k, m = sd.m, qd = 2 * a;
      if (m === 1) {                                              // rational roots
        out.exact = { rational: true, r: [frac(p + k, qd), frac(p - k, qd)], complex: D < 0 };
        if (D < 0) out.exact = { complex: true, re: frac(p, qd), im: frac(k, Math.abs(qd)), m: 1 };
      } else {
        var g = gcd(gcd(Math.abs(p), k), Math.abs(qd));
        p /= g; k /= g; qd /= g;
        if (qd < 0) { p = -p; qd = -qd; }
        out.exact = { rational: false, p: p, k: k, m: m, q: qd, complex: D < 0 };
      }
    } else if (ints && out.kind === 'equal') {
      out.exact = { rational: true, r: [frac(-b, 2 * a)] };
    }
    return out;
  }
  function frac(n, d) {
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d) || 1;
    return { n: n / g, d: d / g };
  }

  /* ------------------------------------------------------------------ statistics */
  function parseList(text) {
    var src = normalize(text).replace(/[−]/g, '-'), toks = src.split(/[\s,;|]+/), vals = [], bad = [];
    for (var i = 0; i < toks.length; i++) {
      var tk = toks[i];
      if (!tk) continue;
      var v = /^[-+]?(\d+\.?\d*|\.\d+)(E[-+]?\d+)?$/i.test(tk) ? Number(tk) : NaN;
      if (!isFinite(v)) { if (bad.length < 6) bad.push(tk.slice(0, 16)); continue; }
      vals.push(v);
    }
    return { vals: vals, bad: bad };
  }
  function stats(vals) {
    var n = vals.length;
    if (!n) return null;
    var s = vals.slice().sort(function (p, q) { return p - q; });
    var sum = 0, sum2 = 0;
    vals.forEach(function (v) { sum = addR(sum, v); sum2 = addR(sum2, v * v); });
    var mean = sum / n, ss = 0;
    vals.forEach(function (v) { var d = addR(v, -mean); ss = addR(ss, d * d); });
    var median = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
    var freq = {}, best = 0;
    s.forEach(function (v) { var k = String(v); freq[k] = (freq[k] || 0) + 1; if (freq[k] > best) best = freq[k]; });
    var modes = [];
    if (best > 1) Object.keys(freq).forEach(function (k) { if (freq[k] === best) modes.push(Number(k)); });
    modes.sort(function (p, q) { return p - q; });
    return {
      n: n, sum: sum, sum2: sum2, mean: mean, median: median, modes: modes, modeCount: best,
      min: s[0], max: s[n - 1], range: addR(s[n - 1], -s[0]),
      varP: ss / n, sdP: Math.sqrt(ss / n), varS: n > 1 ? ss / (n - 1) : null, sdS: n > 1 ? Math.sqrt(ss / (n - 1)) : null
    };
  }

  window.SCALC = {
    evaluate: evaluate, tokenize: tokenize, normalize: normalize, addR: addR, round12: round12,
    format: format, fmtText: fmtText, plain: plain, supNum: supNum, toExpr: toExpr, toFraction: toFraction, toDMS: toDMS, gcd: gcd,
    solveQuadratic: solveQuadratic, solveLinear: solveLinear, det2: det2, det3: det3, surd: surd,
    parseList: parseList, stats: stats, FUNCS: Object.keys(F)
  };
})();
