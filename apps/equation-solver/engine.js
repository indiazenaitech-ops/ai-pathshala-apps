/* Equation Solver with Steps: the maths engine (window.EQS).
   Exact fraction arithmetic, a small safe parser (never eval), step lists for linear equations, pairs of linear
   equations (substitution, elimination, cross-multiplication) and quadratics (factorisation, completing the square,
   quadratic formula), surd simplification and a practice generator. Classic script, no dependencies.

   Display conventions: Unicode minus "−", "²", "√"; fractions as n/d. Every step is { t: 'string key', v: {vars},
   m: 'math line' | ['math', 'lines'] } and the UI translates t with EDU.t. Errors are thrown as { code, at }. */
(function () {
  'use strict';
  var MINUS = '−';

  /* ================================================================ integers */
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function lcm(a, b) { if (!a || !b) return 0; return Math.abs(a / gcd(a, b) * b); }
  function isInt(n) { return typeof n === 'number' && isFinite(n) && Math.floor(n) === n; }
  function isSquare(n) { if (n < 0 || !isInt(n)) return false; var r = Math.round(Math.sqrt(n)); return r * r === n; }
  function sq(n) { return Math.round(Math.sqrt(n)); }

  /* ================================================================ fractions {n, d}, d > 0, reduced */
  function F(n, d) {
    if (d === undefined) d = 1;
    if (!isFinite(n) || !isFinite(d)) throw { code: 'err_big' };
    if (d === 0) throw { code: 'err_div_zero' };
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d) || 1;
    n = n / g; d = d / g;
    if (Math.abs(n) > 1e15 || d > 1e15) throw { code: 'err_big' };
    return { n: n === 0 ? 0 : n, d: d };
  }
  function fadd(a, b) { return F(a.n * b.d + b.n * a.d, a.d * b.d); }
  function fsub(a, b) { return F(a.n * b.d - b.n * a.d, a.d * b.d); }
  function fmul(a, b) { return F(a.n * b.n, a.d * b.d); }
  function fdiv(a, b) { if (b.n === 0) throw { code: 'err_div_zero' }; return F(a.n * b.d, a.d * b.n); }
  function fneg(a) { return F(-a.n, a.d); }
  function fabs(a) { return F(Math.abs(a.n), a.d); }
  function fcmp(a, b) { var x = a.n * b.d - b.n * a.d; return x < 0 ? -1 : x > 0 ? 1 : 0; }
  function feq(a, b) { return a.n === b.n && a.d === b.d; }
  function fz(a) { return a.n === 0; }
  function fint(a) { return a.d === 1; }
  function fval(a) { return a.n / a.d; }
  function fsgn(a) { return a.n < 0 ? -1 : a.n > 0 ? 1 : 0; }
  function fpow(a, k) { var r = F(1); for (var i = 0; i < k; i++) r = fmul(r, a); return r; }
  /* "1.25" -> 5/4, "7" -> 7, "3/4" -> 3/4 (for the a1 b1 c1 boxes) */
  function fparse(s) {
    s = String(s == null ? '' : s).replace(/−/g, '-').replace(/\s+/g, '');
    if (!s) return null;
    var m = /^([+-]?)(\d+(?:\.\d+)?|\.\d+)(?:\/(\d+(?:\.\d+)?))?$/.exec(s);
    if (!m) return null;
    var num = fdec(m[2]);
    if (m[3] !== undefined) { var den = fdec(m[3]); if (fz(den)) return null; num = fdiv(num, den); }
    return m[1] === '-' ? fneg(num) : num;
  }
  function fdec(str) {
    var parts = str.split('.'), ip = parts[0] || '0', fp = (parts[1] || '').slice(0, 9);
    if (ip.length + fp.length > 15) throw { code: 'err_big' };
    return F(parseInt(ip + fp || '0', 10), Math.pow(10, fp.length));
  }
  /* display: "5", "−5", "3/2", "−3/2" */
  function fs(a) { return (a.n < 0 ? MINUS : '') + Math.abs(a.n) + (a.d === 1 ? '' : '/' + a.d); }
  function fsAbs(a) { return Math.abs(a.n) + (a.d === 1 ? '' : '/' + a.d); }
  /* wrapped in brackets when negative or a fraction: "(−3/2)" */
  function fsP(a) { return (a.n < 0 || a.d !== 1) ? '(' + fs(a) + ')' : fs(a); }
  function fsPneg(a) { return a.n < 0 ? '(' + fs(a) + ')' : fs(a); }
  /* decimal text, up to `dp` places, trailing zeros removed, Unicode minus */
  function dec(x, dp) {
    if (dp === undefined) dp = 2;
    if (!isFinite(x)) return '?';
    var s = (Math.round(x * Math.pow(10, dp)) / Math.pow(10, dp)).toFixed(dp);
    if (dp > 0) s = s.replace(/\.?0+$/, '');
    if (s === '-0' || s === '-0.0') s = '0';
    return s.replace('-', MINUS);
  }
  function decFixed(x, dp) { var s = x.toFixed(dp); if (/^-0\.?0*$/.test(s)) s = s.slice(1); return s.replace('-', MINUS); }

  /* ================================================================ polynomials in x, y: { 'ex,ey': F } */
  function P() { return {}; }
  function pConst(f) { var p = {}; if (!fz(f)) p['0,0'] = f; return p; }
  function pVar(v) { var p = {}; p[v === 'x' ? '1,0' : '0,1'] = F(1); return p; }
  function pClone(a) { var p = {}; Object.keys(a).forEach(function (k) { p[k] = a[k]; }); return p; }
  function pAdd(a, b) {
    var p = pClone(a);
    Object.keys(b).forEach(function (k) { var v = p[k] ? fadd(p[k], b[k]) : b[k]; if (fz(v)) delete p[k]; else p[k] = v; });
    return p;
  }
  function pScale(a, f) { var p = {}; if (fz(f)) return p; Object.keys(a).forEach(function (k) { p[k] = fmul(a[k], f); }); return p; }
  function pNeg(a) { return pScale(a, F(-1)); }
  function pSub(a, b) { return pAdd(a, pNeg(b)); }
  function pMul(a, b) {
    var p = {};
    Object.keys(a).forEach(function (ka) {
      var ea = ka.split(',');
      Object.keys(b).forEach(function (kb) {
        var eb = kb.split(','), k = (+ea[0] + +eb[0]) + ',' + (+ea[1] + +eb[1]);
        var v = fmul(a[ka], b[kb]);
        v = p[k] ? fadd(p[k], v) : v;
        if (fz(v)) delete p[k]; else p[k] = v;
      });
    });
    if (pDeg(p) > 6) throw { code: 'err_degree', n: pDeg(p) };
    return p;
  }
  function pDeg(a) { var d = 0; Object.keys(a).forEach(function (k) { var e = k.split(','); d = Math.max(d, +e[0] + +e[1]); }); return d; }
  function pCoef(a, ex, ey) { return a[ex + ',' + ey] || F(0); }
  function pHas(a, v) { return Object.keys(a).some(function (k) { var e = k.split(','); return v === 'x' ? +e[0] > 0 : +e[1] > 0; }); }
  function pIsZero(a) { return Object.keys(a).length === 0; }
  function pIsConst(a) { return Object.keys(a).every(function (k) { return k === '0,0'; }); }
  function pEval(a, xv, yv) { var s = F(0); Object.keys(a).forEach(function (k) { var e = k.split(','); s = fadd(s, fmul(a[k], fmul(fpow(xv || F(0), +e[0]), fpow(yv || F(0), +e[1])))); }); return s; }
  function pDen(a) { var L = 1; Object.keys(a).forEach(function (k) { L = lcm(L, a[k].d) || 1; }); return L; }
  function pGcd(a) { var g = 0; Object.keys(a).forEach(function (k) { g = gcd(g, a[k].n); }); return g; }
  /* ordered monomial list [{ex, ey, c}]: x², xy, y², x, y, constant */
  function monos(a) {
    return Object.keys(a).map(function (k) { var e = k.split(','); return { ex: +e[0], ey: +e[1], c: a[k] }; })
      .sort(function (p, q) { var dp = p.ex + p.ey, dq = q.ex + q.ey; if (dp !== dq) return dq - dp; return q.ex - p.ex; });
  }

  /* ================================================================ pretty printing */
  function sup(n) { return n === 1 ? '' : n === 2 ? '²' : n === 3 ? '³' : '^' + n; }
  function varStr(ex, ey) { return (ex ? 'x' + sup(ex) : '') + (ey ? 'y' + sup(ey) : ''); }
  /* one monomial -> { neg, body }: 3x, x/2, 3x/2, 5, 3/2 */
  function monoBody(c, ex, ey) {
    var v = varStr(ex, ey), a = fabs(c);
    if (!v) return fsAbs(a);
    if (a.d === 1) return (a.n === 1 ? '' : a.n) + v;
    return (a.n === 1 ? v : a.n + v) + '/' + a.d;
  }
  function joinMonos(list) {
    if (!list.length) return '0';
    var out = '';
    list.forEach(function (m, i) {
      var neg = m.c.n < 0, body = monoBody(m.c, m.ex, m.ey);
      if (i === 0) out += (neg ? MINUS : '') + body;
      else out += ' ' + (neg ? MINUS : '+') + ' ' + body;
    });
    return out;
  }
  function ps(a) { return joinMonos(monos(a)); }
  /* bracket a polynomial when it has more than one term */
  function psB(a) { var m = monos(a); return m.length === 1 && m[0].c.n > 0 ? ps(a) : '(' + ps(a) + ')'; }
  /* k·(poly) : "2(x + 1)", "(x + 1)", "−(x + 1)", "−3(x + 1)" */
  function coefBracket(k, a) {
    var s = ps(a); if (monos(a).length > 1 || k.d !== 1 || Math.abs(k.n) !== 1) s = '(' + s + ')';
    var ak = fabs(k), body = (ak.d === 1 && ak.n === 1) ? s : (ak.d === 1 ? ak.n + s : '(' + fs(ak) + ')' + s);
    return (k.n < 0 ? MINUS : '') + body;
  }
  /* |k| × value as it is written by hand: "3(−12)", "(−12)", "12", "8/2" (for x/2), "3(36/5)/4" (for 3x/4), "(3/2)²" */
  function coefTimes(ac, v, e) {
    e = e || 1;
    var vs = (v.n < 0 || v.d !== 1 || (ac.d === 1 && ac.n !== 1) || e > 1 || ac.d !== 1) ? '(' + fs(v) + ')' : fs(v);
    if (ac.d === 1) return (ac.n === 1 ? '' : String(ac.n)) + vs + sup(e);
    if (ac.n === 1 && e === 1) return (v.n < 0 || v.d !== 1 ? '(' + fs(v) + ')' : fs(v)) + '/' + ac.d;
    return ac.n + vs + sup(e) + '/' + ac.d;
  }
  /* value substituted into a polynomial of x (or y): "3(−12) + 5" and the term values */
  function substStr(a, v, varName) {
    var list = monos(a), parts = [], vals = [];
    list.forEach(function (m, i) {
      var e = varName === 'y' ? m.ey : m.ex, neg = m.c.n < 0, ac = fabs(m.c), body;
      if (!e) body = fsAbs(ac);
      else body = coefTimes(ac, v, e);
      parts.push(i === 0 ? (neg ? MINUS : '') + body : ' ' + (neg ? MINUS : '+') + ' ' + body);
      vals.push(fmul(m.c, fpow(v, e)));
    });
    var total = vals.reduce(function (s, x) { return fadd(s, x); }, F(0));
    var valStr = vals.map(function (x, i) { return i === 0 ? fs(x) : ' ' + (x.n < 0 ? MINUS : '+') + ' ' + fsAbs(x); }).join('');
    return { expr: parts.join('') || '0', terms: valStr, total: total, nTerms: vals.length };
  }
  /* "LHS = 3(−12) + 5 = −36 + 5 = −31" (no line repeats itself) */
  function checkLine(label, a, v, varName) {
    var s = substStr(a, v, varName), out = label + ' = ' + s.expr, last = s.expr;
    if (s.nTerms > 1 && s.terms !== last) { out += ' = ' + s.terms; last = s.terms; }
    var tot = fs(s.total);
    if (last !== tot) out += ' = ' + tot;
    return { line: out, total: s.total };
  }
  function dedupe(lines) { var out = []; [].concat(lines).forEach(function (l) { if (!out.length || out[out.length - 1] !== l) out.push(l); }); return out.length === 1 ? out[0] : out; }
  /* push a step; a step whose maths repeats the previous step's last line is dropped (unless it carries a conclusion) */
  var KEEP = { step_identity: 1, step_no_solution: 1, step_pair_unique: 1, step_pair_infinite: 1, step_pair_none: 1, step_check: 1 };
  function pushStep(steps, st) {
    if (st.m !== undefined) st.m = dedupe(st.m);
    var prev = steps.length ? steps[steps.length - 1] : null;
    var lastOf = function (s) { return Array.isArray(s.m) ? s.m[s.m.length - 1] : s.m; };
    if (prev && !KEEP[st.t] && typeof st.m === 'string' && lastOf(prev) === st.m) return;
    steps.push(st);
  }

  /* ================================================================ parser (never eval) */
  function normalize(src) {
    return String(src || '')
      .replace(/[−–—]/g, '-').replace(/[×⋅·•*]/g, '*').replace(/÷/g, '/')
      .replace(/²/g, '^2').replace(/³/g, '^3').replace(/[⁰¹⁴-⁹]/g, function (c) { return '^' + '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c); })
      .replace(/[XY]/g, function (c) { return c.toLowerCase(); }).replace(/[\[{]/g, '(').replace(/[\]}]/g, ')')
      .replace(/०|০|૦|੦|୦|௦|౦|೦|൦|۰|٠/g, '0')
      .replace(/\s+/g, '');
  }
  function tokenize(s) {
    var toks = [], i = 0;
    while (i < s.length) {
      var c = s[i];
      if (/[0-9.]/.test(c)) {
        var m = /^(\d+(?:\.\d*)?|\.\d+)/.exec(s.slice(i));
        if (!m || m[0] === '.') throw { code: 'err_syntax', at: s.slice(i, i + 3) };
        toks.push({ t: 'num', v: fdec(m[0]), i: i }); i += m[0].length; continue;
      }
      if (c === 'x' || c === 'y') { toks.push({ t: 'var', v: c, i: i }); i++; continue; }
      if ('+-*/^'.indexOf(c) >= 0) { toks.push({ t: 'op', v: c, i: i }); i++; continue; }
      if (c === '(' || c === ')') { toks.push({ t: c, i: i }); i++; continue; }
      throw { code: 'err_char', at: c };
    }
    return toks;
  }
  /* AST: {k:'num',v} {k:'var',v} {k:'neg',a} {k:'add'|'sub'|'mul'|'div',a,b} {k:'pow',a,n} */
  function parseExpr(src) {
    var s = normalize(src);
    if (!s) throw { code: 'err_empty' };
    var toks = tokenize(s), pos = 0;
    function peek() { return toks[pos]; }
    function near() { var t = toks[pos]; return t ? s.slice(t.i, t.i + 4) : s.slice(-4); }
    function expr() {
      var a = term();
      while (peek() && peek().t === 'op' && (peek().v === '+' || peek().v === '-')) {
        var op = toks[pos++].v; var b = term();
        a = { k: op === '+' ? 'add' : 'sub', a: a, b: b };
      }
      return a;
    }
    function term() {
      var a = unary();
      for (;;) {
        var t = peek(); if (!t) break;
        if (t.t === 'op' && (t.v === '*' || t.v === '/')) { pos++; var b = unary(); a = { k: t.v === '*' ? 'mul' : 'div', a: a, b: b }; }
        else if (t.t === 'num' || t.t === 'var' || t.t === '(') { var b2 = power(); a = { k: 'mul', a: a, b: b2 }; }   /* implicit × */
        else break;
      }
      return a;
    }
    function unary() {
      var t = peek();
      if (t && t.t === 'op' && (t.v === '-' || t.v === '+')) { pos++; var a = unary(); return t.v === '-' ? { k: 'neg', a: a } : a; }
      return power();
    }
    function power() {
      var a = atom(), t = peek();
      if (t && t.t === 'op' && t.v === '^') {
        pos++;
        var e = peek();
        var negE = false;
        if (e && e.t === 'op' && e.v === '-') { negE = true; pos++; e = peek(); }
        if (!e || e.t !== 'num' || !fint(e.v) || negE) throw { code: 'err_power' };
        pos++;
        if (e.v.n > 6) throw { code: 'err_degree', n: e.v.n };
        a = { k: 'pow', a: a, n: e.v.n };
        if (peek() && peek().t === 'op' && peek().v === '^') throw { code: 'err_power' };
      }
      return a;
    }
    function atom() {
      var t = peek();
      if (!t) throw { code: 'err_incomplete', at: near() };
      if (t.t === 'num') { pos++; return { k: 'num', v: t.v }; }
      if (t.t === 'var') { pos++; return { k: 'var', v: t.v }; }
      if (t.t === '(') {
        pos++; var a = expr();
        if (!peek() || peek().t !== ')') throw { code: 'err_bracket' };
        pos++; return a;
      }
      if (t.t === ')') throw { code: 'err_bracket' };
      throw { code: 'err_incomplete', at: near() };
    }
    var ast = expr();
    if (pos < toks.length) { if (toks[pos].t === ')') throw { code: 'err_bracket' }; throw { code: 'err_syntax', at: near() }; }
    return { ast: ast, text: s };
  }
  function evalAst(n) {
    switch (n.k) {
      case 'num': return pConst(n.v);
      case 'var': return pVar(n.v);
      case 'neg': return pNeg(evalAst(n.a));
      case 'add': return pAdd(evalAst(n.a), evalAst(n.b));
      case 'sub': return pSub(evalAst(n.a), evalAst(n.b));
      case 'mul': return pMul(evalAst(n.a), evalAst(n.b));
      case 'div': {
        var b = evalAst(n.b);
        if (!pIsConst(b)) throw { code: 'err_div_var' };
        var c = pCoef(b, 0, 0); if (fz(c)) throw { code: 'err_div_zero' };
        return pScale(evalAst(n.a), fdiv(F(1), c));
      }
      case 'pow': {
        var base = evalAst(n.a), r = pConst(F(1));
        for (var i = 0; i < n.n; i++) r = pMul(r, base);
        return r;
      }
    }
    throw { code: 'err_syntax' };
  }
  /* top-level additive pieces, each already expanded: "2(x-3) + 1 - x" -> [2x−6, 1, −x] */
  function flatTerms(n, neg) {
    if (n.k === 'add') return flatTerms(n.a, neg).concat(flatTerms(n.b, neg));
    if (n.k === 'sub') return flatTerms(n.a, neg).concat(flatTerms(n.b, !neg));
    if (n.k === 'neg') return flatTerms(n.a, !neg);
    var p = evalAst(n); return [neg ? pNeg(p) : p];
  }
  function hasBrackets(n) {
    if (!n || typeof n !== 'object') return false;
    if (n.k === 'mul' && (n.a.k === 'add' || n.a.k === 'sub' || n.b.k === 'add' || n.b.k === 'sub' || n.a.k === 'neg' || n.b.k === 'neg')) return true;
    if (n.k === 'pow' && n.a.k !== 'var' && n.a.k !== 'num') return true;
    if (n.k === 'div' && (n.a.k === 'add' || n.a.k === 'sub')) return true;
    return hasBrackets(n.a) || hasBrackets(n.b);
  }
  /* split "L = R" and parse both sides */
  function parseEquation(src) {
    var s = String(src == null ? '' : src).replace(/\s+/g, '');
    if (!s) throw { code: 'err_empty' };
    var parts = s.split('=');
    if (parts.length === 1) throw { code: 'err_no_equals' };
    if (parts.length > 2) throw { code: 'err_two_equals' };
    if (!parts[0]) throw { code: 'err_incomplete', at: '=' };
    if (!parts[1]) throw { code: 'err_incomplete', at: '=' };
    var L = parseExpr(parts[0]), R = parseExpr(parts[1]);
    var lp = evalAst(L.ast), rp = evalAst(R.ast);
    var lt = flatTerms(L.ast, false), rt = flatTerms(R.ast, false);
    return { L: lp, R: rp, Lterms: lt, Rterms: rt, brackets: hasBrackets(L.ast) || hasBrackets(R.ast), text: prettyInput(src) };
  }
  function termsMonos(list) { var out = []; list.forEach(function (p) { out = out.concat(monos(p)); }); return out; }
  /* the typed text, tidied for display: "3x+5=2x-7" -> "3x + 5 = 2x − 7" */
  function prettyInput(src) {
    var s = normalize(src).replace(/\^2/g, '²').replace(/\^3/g, '³'), out = '';
    for (var i = 0; i < s.length; i++) {
      var c = s[i], prev = i ? s[i - 1] : '';
      if (c === '=') out += ' = ';
      else if ((c === '+' || c === '-') && prev && !/[(=+\-*\/^]/.test(prev)) out += ' ' + (c === '-' ? MINUS : '+') + ' ';
      else if (c === '-') out += MINUS;
      else if (c === '*') out += ' × ';
      else out += c;
    }
    return out;
  }
  function noSpace(s) { return String(s).replace(/\s+/g, ''); }

  /* ================================================================ LINEAR in one variable */
  function solveLinear(src) {
    var eq = parseEquation(src), steps = [];
    var L = eq.L, R = eq.R;
    var hasX = pHas(L, 'x') || pHas(R, 'x'), hasY = pHas(L, 'y') || pHas(R, 'y');
    if (hasX && hasY) throw { code: 'err_two_vars' };
    if (!hasX && !hasY) throw { code: 'err_no_var' };
    var v = hasX ? 'x' : 'y';
    var deg = Math.max(pDeg(L), pDeg(R)), diff = pSub(L, R);
    if (deg > 1) {
      if (pDeg(diff) === 2 && v === 'x') throw { code: 'err_not_linear_quad' };
      if (pDeg(diff) > 1) throw { code: 'err_degree', n: pDeg(diff) };
    }
    function sqPart(p) { var q = {}; Object.keys(p).forEach(function (k) { if (k !== '0,0' && k !== '1,0' && k !== '0,1') q[k] = p[k]; }); return q; }
    function cx(p) { return v === 'x' ? pCoef(p, 1, 0) : pCoef(p, 0, 1); }
    function cc(p) { return pCoef(p, 0, 0); }
    var orig = { L: eq.L, R: eq.R };

    pushStep(steps, { t: 'step_given', m: eq.text });
    var lm = termsMonos(eq.Lterms), rm = termsMonos(eq.Rterms);
    var unmerged = joinMonos(lm) + ' = ' + joinMonos(rm), merged = ps(L) + ' = ' + ps(R);
    if (eq.brackets) pushStep(steps, { t: 'step_expand', m: unmerged });
    else if (unmerged !== eq.text) pushStep(steps, { t: 'step_simplify', m: unmerged });
    if (merged !== unmerged) pushStep(steps, { t: 'step_collect', m: merged });
    if (deg > 1) {
      /* the square terms cancel: say so and carry on with what is left */
      L = pAdd(L, pNeg(sqPart(L))); R = pAdd(R, pNeg(sqPart(R)));
      pushStep(steps, { t: 'step_cancel_square', m: ps(L) + ' = ' + ps(R) });
    }

    /* clear fractions */
    var den = lcm(pDen(L), pDen(R));
    if (den > 1) {
      L = pScale(L, F(den)); R = pScale(R, F(den));
      pushStep(steps, { t: 'step_clear_fractions', v: { n: den }, m: ps(L) + ' = ' + ps(R) });
    }
    /* transpose */
    var a1 = cx(L), b1 = cc(L), a2 = cx(R), b2 = cc(R);
    var needMove = !fz(a2) || !fz(b1);
    if (needMove) {
      var lhsList = [], rhsList = [];
      if (!fz(a1)) lhsList.push({ ex: v === 'x' ? 1 : 0, ey: v === 'y' ? 1 : 0, c: a1 });
      if (!fz(a2)) lhsList.push({ ex: v === 'x' ? 1 : 0, ey: v === 'y' ? 1 : 0, c: fneg(a2) });
      if (!fz(b2)) rhsList.push({ ex: 0, ey: 0, c: b2 });
      if (!fz(b1)) rhsList.push({ ex: 0, ey: 0, c: fneg(b1) });
      var moved = [];
      if (!fz(a2)) moved.push(monoBody(a2, v === 'x' ? 1 : 0, v === 'y' ? 1 : 0));
      if (!fz(b1)) moved.push(fsAbs(b1));
      pushStep(steps, { t: 'step_transpose', v: { terms: moved.join(', ') }, m: joinMonos(lhsList) + ' = ' + joinMonos(rhsList) });
    }
    var a = fsub(a1, a2), b = fsub(b2, b1);
    var simple = joinMonos(fz(a) ? [] : [{ ex: v === 'x' ? 1 : 0, ey: v === 'y' ? 1 : 0, c: a }]) + ' = ' + fs(b);
    pushStep(steps, { t: 'step_simplify', m: simple });
    var res = { kind: 'linear', variable: v, steps: steps, status: 'unique', x: null };
    if (fz(a)) {
      if (fz(b)) { res.status = 'identity'; pushStep(steps, { t: 'step_identity', m: '0 = 0' }); }
      else { res.status = 'none'; pushStep(steps, { t: 'step_no_solution', m: '0 = ' + fs(b) }); }
      return res;
    }
    var x = fdiv(b, a);
    if (!(a.n === 1 && a.d === 1)) {
      var divLine = v + ' = ' + fsP(b) + ' / ' + fsPneg(a) + ' = ' + fs(x);
      pushStep(steps, { t: 'step_divide', v: { n: fs(a) }, m: divLine });
    } else if (steps[steps.length - 1].t !== 'step_simplify') pushStep(steps, { t: 'step_answer', m: v + ' = ' + fs(x) });
    res.x = x;
    res.answer = v + ' = ' + fs(x) + (fint(x) ? '' : ' ≈ ' + dec(fval(x), 3));
    /* check by substitution in the original equation */
    var cl = checkLine('LHS', orig.L, x, v), cr = checkLine('RHS', orig.R, x, v);
    res.check = { lines: [cl.line, cr.line], ok: feq(cl.total, cr.total) };
    pushStep(steps, { t: 'step_check', v: { v: v, x: fs(x) }, m: [cl.line, cr.line, 'LHS = RHS ✓'] });
    return res;
  }

  /* ================================================================ PAIR of linear equations */
  /* one typed equation -> { a, b, c } with ax + by = c (fractions allowed) */
  function pairCoefs(src, n) {
    var eq = parseEquation(src), d = pSub(eq.L, eq.R);
    if (pDeg(d) > 1) throw { code: 'err_pair_degree', n: n };
    var a = pCoef(d, 1, 0), b = pCoef(d, 0, 1), c = fneg(pCoef(d, 0, 0));
    if (fz(a) && fz(b)) throw { code: 'err_pair_novar', n: n };
    return { a: a, b: b, c: c, text: prettyInput(eq.text) };
  }
  function eqStr(e) {
    var list = [];
    if (!fz(e.a)) list.push({ ex: 1, ey: 0, c: e.a });
    if (!fz(e.b)) list.push({ ex: 0, ey: 1, c: e.b });
    return joinMonos(list) + ' = ' + fs(e.c);
  }
  function eqStd(e) { /* a x + b y + c = 0 form */
    var list = [];
    if (!fz(e.a)) list.push({ ex: 1, ey: 0, c: e.a });
    if (!fz(e.b)) list.push({ ex: 0, ey: 1, c: e.b });
    if (!fz(e.c)) list.push({ ex: 0, ey: 0, c: fneg(e.c) });
    return joinMonos(list) + ' = 0';
  }
  function scaleEq(e, k) { return { a: fmul(e.a, k), b: fmul(e.b, k), c: fmul(e.c, k) }; }
  function ratioStr(p, q) { return fz(q) ? null : fs(fdiv(p, q)); }

  function solvePair(input, method) {
    /* input: { eq1, eq2 } strings, or { a1, b1, c1, a2, b2, c2 } fractions */
    var e1, e2, steps = [];
    if (input.eq1 !== undefined) { e1 = pairCoefs(input.eq1, 1); e2 = pairCoefs(input.eq2, 2); }
    else {
      e1 = { a: input.a1, b: input.b1, c: input.c1 }; e2 = { a: input.a2, b: input.b2, c: input.c2 };
      if (fz(e1.a) && fz(e1.b)) throw { code: 'err_pair_novar', n: 1 };
      if (fz(e2.a) && fz(e2.b)) throw { code: 'err_pair_novar', n: 2 };
      e1.text = eqStr(e1); e2.text = eqStr(e2);
    }
    pushStep(steps, { t: 'step_pair_given', m: [e1.text + '   …(1)', e2.text + '   …(2)'] });
    /* standard form with whole-number coefficients */
    var n1 = lcm(lcm(e1.a.d, e1.b.d), e1.c.d), n2 = lcm(lcm(e2.a.d, e2.b.d), e2.c.d);
    var s1 = scaleEq(e1, F(n1)), s2 = scaleEq(e2, F(n2));
    var std1 = eqStr(s1), std2 = eqStr(s2);
    if (noSpace(std1) !== noSpace(e1.text) || noSpace(std2) !== noSpace(e2.text)) {
      pushStep(steps, { t: n1 > 1 || n2 > 1 ? 'step_pair_std_frac' : 'step_pair_std', m: [std1 + '   …(1)', std2 + '   …(2)'] });
    }
    var a1 = s1.a, b1 = s1.b, c1 = s1.c, a2 = s2.a, b2 = s2.b, c2 = s2.c;
    var res = { kind: 'pair', steps: steps, eq1: s1, eq2: s2, method: method };
    /* consistency: compare a1/a2, b1/b2, c1/c2 */
    var det = fsub(fmul(a1, b2), fmul(a2, b1));          /* a1b2 − a2b1 */
    var dxy = fsub(fmul(b1, c2), fmul(b2, c1));           /* b1c2 − b2c1 */
    var dcx = fsub(fmul(a1, c2), fmul(a2, c1));           /* a1c2 − a2c1 */
    var rA = ratioStr(a1, a2), rB = ratioStr(b1, b2), rC = ratioStr(c1, c2);
    var ratioLine = 'a₁/a₂ = ' + (fz(a2) ? fs(a1) + '/0' : fsP(a1) + '/' + fsP(a2) + (rA !== null && (fsP(a1) + '/' + fsP(a2)) !== rA ? ' = ' + rA : ''))
      + ',  b₁/b₂ = ' + (fz(b2) ? fs(b1) + '/0' : fsP(b1) + '/' + fsP(b2) + (rB !== null && (fsP(b1) + '/' + fsP(b2)) !== rB ? ' = ' + rB : ''))
      + ',  c₁/c₂ = ' + (fz(c2) ? fs(c1) + '/0' : fsP(c1) + '/' + fsP(c2) + (rC !== null && (fsP(c1) + '/' + fsP(c2)) !== rC ? ' = ' + rC : ''));
    var kind;
    if (!fz(det)) kind = 'unique';
    else if (fz(dxy) && fz(dcx)) kind = 'infinite';
    else kind = 'none';
    res.consistency = { kind: kind, ratios: ratioLine, det: det, a1: a1, b1: b1, c1: c1, a2: a2, b2: b2, c2: c2 };
    pushStep(steps, { t: 'step_pair_compare', m: ['a₁ = ' + fs(a1) + ', b₁ = ' + fs(b1) + ', c₁ = ' + fs(c1) + ';  a₂ = ' + fs(a2) + ', b₂ = ' + fs(b2) + ', c₂ = ' + fs(c2), ratioLine] });
    pushStep(steps, { t: kind === 'unique' ? 'step_pair_unique' : kind === 'infinite' ? 'step_pair_infinite' : 'step_pair_none', m: kind === 'unique' ? 'a₁/a₂ ≠ b₁/b₂' : kind === 'infinite' ? 'a₁/a₂ = b₁/b₂ = c₁/c₂' : 'a₁/a₂ = b₁/b₂ ≠ c₁/c₂' });
    res.status = kind;
    if (kind === 'infinite') {
      /* general solution and two example points */
      var ex = [];
      if (!fz(b1)) { [F(0), F(1), F(2), F(3)].forEach(function (xv) { if (ex.length < 2) ex.push('(' + fs(xv) + ', ' + fs(fdiv(fsub(c1, fmul(a1, xv)), b1)) + ')'); }); }
      else { [F(0), F(1)].forEach(function (yv) { ex.push('(' + fs(fdiv(c1, a1)) + ', ' + fs(yv) + ')'); }); }
      pushStep(steps, { t: 'step_pair_infinite_ex', m: ex.join(', ') });
      return res;
    }
    if (kind === 'none') return res;

    var x, y;
    if (method === 'elimination') {
      /* eliminate the variable with the smaller LCM of coefficients; if a variable is missing somewhere, solve directly */
      var canX = !fz(a1) && !fz(a2), canY = !fz(b1) && !fz(b2);
      var Lx = canX ? lcm(Math.abs(a1.n), Math.abs(a2.n)) : Infinity, Ly = canY ? lcm(Math.abs(b1.n), Math.abs(b2.n)) : Infinity;
      if (!canX && !canY) {
        /* each equation has a single variable */
        var ex1 = fz(a1) ? { v: 'y', val: fdiv(c1, b1) } : { v: 'x', val: fdiv(c1, a1) };
        var ex2 = fz(a2) ? { v: 'y', val: fdiv(c2, b2) } : { v: 'x', val: fdiv(c2, a2) };
        pushStep(steps, { t: 'step_pair_direct', m: [ex1.v + ' = ' + fs(ex1.val), ex2.v + ' = ' + fs(ex2.val)] });
        x = ex1.v === 'x' ? ex1.val : ex2.val; y = ex1.v === 'y' ? ex1.val : ex2.val;
      } else {
        var elim = (Ly < Lx) ? 'y' : 'x', keep = elim === 'x' ? 'y' : 'x';
        var p1 = elim === 'x' ? a1 : b1, p2 = elim === 'x' ? a2 : b2;
        var Lm = lcm(Math.abs(p1.n), Math.abs(p2.n));
        var m1 = F(Lm / Math.abs(p1.n)), m2 = F(Lm / Math.abs(p2.n));
        var t1 = scaleEq(s1, m1), t2 = scaleEq(s2, m2);
        var lines = [];
        lines.push((m1.n === 1 ? '(1):  ' : '(1) × ' + fs(m1) + ':  ') + eqStr(t1) + '   …(3)');
        lines.push((m2.n === 1 ? '(2):  ' : '(2) × ' + fs(m2) + ':  ') + eqStr(t2) + '   …(4)');
        pushStep(steps, { t: 'step_elim_multiply', v: { v: elim }, m: lines });
        var q1 = elim === 'x' ? t1.a : t1.b, q2 = elim === 'x' ? t2.a : t2.b;
        var subtract = fsgn(q1) === fsgn(q2);
        var k1 = elim === 'x' ? t1.b : t1.a, k2 = elim === 'x' ? t2.b : t2.a;
        var kk = subtract ? fsub(k1, k2) : fadd(k1, k2), cc2 = subtract ? fsub(t1.c, t2.c) : fadd(t1.c, t2.c);
        var mono = function (c) { return joinMonos([{ ex: keep === 'x' ? 1 : 0, ey: keep === 'y' ? 1 : 0, c: c }]); };
        var wrap = function (s) { return s.charAt(0) === MINUS ? '(' + s + ')' : s; };
        var left = fz(k1) ? (subtract ? mono(fneg(k2)) : mono(k2)) : fz(k2) ? mono(k1) : mono(k1) + (subtract ? ' − ' : ' + ') + wrap(mono(k2));
        var opLine = (subtract ? '(3) − (4):  ' : '(3) + (4):  ') + left + ' = ' + fs(t1.c) + (subtract ? ' − ' : ' + ') + wrap(fs(t2.c));
        var keepVal = fdiv(cc2, kk);
        pushStep(steps, { t: subtract ? 'step_elim_subtract' : 'step_elim_add', v: { v: elim }, m: [opLine, mono(kk) + ' = ' + fs(cc2), keep + ' = ' + fsP(cc2) + ' / ' + fsPneg(kk) + ' = ' + fs(keepVal)] });
        /* back-substitute into (1) or (2): one that has the eliminated variable (and, if possible, both variables) */
        var has1 = !fz(elim === 'x' ? s1.a : s1.b), both1 = has1 && !fz(elim === 'x' ? s1.b : s1.a);
        var use = (both1 || (has1 && fz(elim === 'x' ? s2.b : s2.a))) ? { e: s1, n: '(1)' } : (!fz(elim === 'x' ? s2.a : s2.b) ? { e: s2, n: '(2)' } : { e: s1, n: '(1)' });
        var ea = elim === 'x' ? use.e.a : use.e.b, eb = elim === 'x' ? use.e.b : use.e.a;
        var prod = fmul(eb, keepVal), remaining = fsub(use.e.c, prod), elimVal = fdiv(remaining, ea);
        var bl = [];
        if (!fz(eb)) {
          bl.push(mono2(elim, ea) + (eb.n < 0 ? ' − ' : ' + ') + coefTimes(fabs(eb), keepVal, 1) + ' = ' + fs(use.e.c));
          bl.push(mono2(elim, ea) + (prod.n < 0 ? ' − ' : ' + ') + fsAbs(prod) + ' = ' + fs(use.e.c));
          bl.push(mono2(elim, ea) + ' = ' + fs(remaining));
        } else bl.push(mono2(elim, ea) + ' = ' + fs(use.e.c));
        bl.push(elim + ' = ' + (feq(ea, F(1)) ? fs(elimVal) : fsP(remaining) + ' / ' + fsPneg(ea) + ' = ' + fs(elimVal)));
        pushStep(steps, { t: 'step_back_subst', v: { v: keep, val: fs(keepVal), n: use.n }, m: bl });
        x = elim === 'x' ? elimVal : keepVal; y = elim === 'y' ? elimVal : keepVal;
      }
    } else if (method === 'cross') {
      /* a1x + b1y + c1' = 0 with c' = −c */
      var k1c = fneg(c1), k2c = fneg(c2);
      pushStep(steps, { t: 'step_cross_std', m: [eqStd(s1) + '   …(1)', eqStd(s2) + '   …(2)'] });
      var Dx = fsub(fmul(b1, k2c), fmul(b2, k1c)), Dy = fsub(fmul(k1c, a2), fmul(k2c, a1)), D1 = fsub(fmul(a1, b2), fmul(a2, b1));
      res.cross = { a1: a1, b1: b1, c1: k1c, a2: a2, b2: b2, c2: k2c, Dx: Dx, Dy: Dy, D1: D1 };
      pushStep(steps, { t: 'step_cross_formula', m: 'x / (b₁c₂ − b₂c₁) = y / (c₁a₂ − c₂a₁) = 1 / (a₁b₂ − a₂b₁)' });
      var P2 = function (p, q) { return '(' + fs(p) + ')(' + fs(q) + ')'; };
      pushStep(steps, { t: 'step_cross_subst', m: [
        'x / [' + P2(b1, k2c) + ' − ' + P2(b2, k1c) + '] = y / [' + P2(k1c, a2) + ' − ' + P2(k2c, a1) + '] = 1 / [' + P2(a1, b2) + ' − ' + P2(a2, b1) + ']',
        'x / ' + fsP(Dx) + ' = y / ' + fsP(Dy) + ' = 1 / ' + fsP(D1)] });
      x = fdiv(Dx, D1); y = fdiv(Dy, D1);
      pushStep(steps, { t: 'step_cross_solve', m: ['x = ' + fsP(Dx) + ' / ' + fsP(D1) + ' = ' + fs(x), 'y = ' + fsP(Dy) + ' / ' + fsP(D1) + ' = ' + fs(y)] });
    } else {
      /* substitution: pick the equation and variable with coefficient ±1 when possible */
      var cands = [{ e: s1, n: '(1)', other: s2, on: '(2)', v: 'x', k: s1.a }, { e: s1, n: '(1)', other: s2, on: '(2)', v: 'y', k: s1.b },
        { e: s2, n: '(2)', other: s1, on: '(1)', v: 'x', k: s2.a }, { e: s2, n: '(2)', other: s1, on: '(1)', v: 'y', k: s2.b }]
        .filter(function (c) { return !fz(c.k); });
      cands.sort(function (p, q) { var sp = (feq(fabs(p.k), F(1)) ? 0 : 10) + Math.abs(fval(p.k)), sq2 = (feq(fabs(q.k), F(1)) ? 0 : 10) + Math.abs(fval(q.k)); return sp - sq2; });
      var ch = cands[0], v1 = ch.v, v2 = v1 === 'x' ? 'y' : 'x';
      var kv = ch.k, ko = v1 === 'x' ? ch.e.b : ch.e.a;
      /* v1 = (c − ko·v2)/kv as a polynomial in v2 */
      var expr = {}; if (!fz(ko)) expr[v2 === 'x' ? '1,0' : '0,1'] = fneg(fdiv(ko, kv)); if (!fz(ch.e.c)) expr['0,0'] = fdiv(ch.e.c, kv);
      var fromLines = [], movedList = [];
      if (!fz(ch.e.c)) movedList.push({ ex: 0, ey: 0, c: ch.e.c });
      if (!fz(ko)) movedList.push({ ex: v2 === 'x' ? 1 : 0, ey: v2 === 'y' ? 1 : 0, c: fneg(ko) });
      if (!fz(ko)) fromLines.push(joinMonos([{ ex: v1 === 'x' ? 1 : 0, ey: v1 === 'y' ? 1 : 0, c: kv }]) + ' = ' + joinMonos(movedList));
      if (!feq(kv, F(1))) fromLines.push(v1 + ' = ' + psB(fz(ko) ? pConst(ch.e.c) : pAdd(pConst(ch.e.c), pScale(pVar(v2), fneg(ko)))) + ' / ' + fsPneg(kv));
      if (fromLines.length && fromLines[fromLines.length - 1] === v1 + ' = ' + ps(expr)) fromLines.pop();
      fromLines.push(v1 + ' = ' + ps(expr) + '   …(3)');
      pushStep(steps, { t: 'step_subst_from', v: { n: ch.n, v: v1 }, m: fromLines });
      /* substitute into the other equation */
      var oa = v1 === 'x' ? ch.other.a : ch.other.b, ob = v1 === 'x' ? ch.other.b : ch.other.a;
      var otherMono = fz(ob) ? '' : (ob.n < 0 ? ' − ' : ' + ') + monoBody(ob, v2 === 'x' ? 1 : 0, v2 === 'y' ? 1 : 0);
      var subLine = (fz(oa) ? '' : coefBracket(oa, expr)) + otherMono + ' = ' + fs(ch.other.c);
      var expanded = pAdd(pScale(expr, oa), fz(ob) ? {} : pScale(pVar(v2), ob));
      var unm = monos(pScale(expr, oa)).concat(fz(ob) ? [] : monos(pScale(pVar(v2), ob)));
      var sl = [subLine];
      if (joinMonos(unm) !== ps(expanded)) sl.push(joinMonos(unm) + ' = ' + fs(ch.other.c));
      sl.push(ps(expanded) + ' = ' + fs(ch.other.c));
      var coefV2 = v2 === 'x' ? pCoef(expanded, 1, 0) : pCoef(expanded, 0, 1), constE = pCoef(expanded, 0, 0);
      var rhs = fsub(ch.other.c, constE);
      var den2 = lcm(coefV2.d, lcm(constE.d, ch.other.c.d));
      var v2val = fdiv(rhs, coefV2);
      if (!fz(constE)) sl.push(monoBody(coefV2, v2 === 'x' ? 1 : 0, v2 === 'y' ? 1 : 0).replace(/^/, coefV2.n < 0 ? MINUS : '') + ' = ' + fs(ch.other.c) + (constE.n < 0 ? ' + ' : ' − ') + fsAbs(constE) + ' = ' + fs(rhs));
      if (den2 > 1) sl.push(monoBody(fmul(coefV2, F(den2)), v2 === 'x' ? 1 : 0, v2 === 'y' ? 1 : 0).replace(/^/, coefV2.n < 0 ? MINUS : '') + ' = ' + fs(fmul(rhs, F(den2))));
      sl.push(v2 + ' = ' + fs(v2val));
      pushStep(steps, { t: 'step_subst_into', v: { n: ch.on, v: v1 }, m: sl });
      var back = substStr(expr, v2val, v2), v1val = back.total;
      var backLine = v1 + ' = ' + back.expr, lastB = back.expr;
      if (back.nTerms > 1 && back.terms !== lastB) { backLine += ' = ' + back.terms; lastB = back.terms; }
      if (lastB !== fs(v1val)) backLine += ' = ' + fs(v1val);
      pushStep(steps, { t: 'step_subst_back', v: { v: v2, val: fs(v2val) }, m: backLine });
      x = v1 === 'x' ? v1val : v2val; y = v1 === 'y' ? v1val : v2val;
    }
    res.x = x; res.y = y;
    res.answer = 'x = ' + fs(x) + ', y = ' + fs(y);
    /* check in both original equations */
    var poly1 = {}; if (!fz(e1.a)) poly1['1,0'] = e1.a; if (!fz(e1.b)) poly1['0,1'] = e1.b;
    var poly2 = {}; if (!fz(e2.a)) poly2['1,0'] = e2.a; if (!fz(e2.b)) poly2['0,1'] = e2.b;
    var c1l = subst2(poly1, x, y), c2l = subst2(poly2, x, y);
    res.check = { ok: feq(c1l.total, e1.c) && feq(c2l.total, e2.c) };
    pushStep(steps, { t: 'step_pair_check', m: ['(1): ' + c1l.text + ' = ' + fs(c1l.total) + (feq(c1l.total, e1.c) ? ' ✓' : ''), '(2): ' + c2l.text + ' = ' + fs(c2l.total) + (feq(c2l.total, e2.c) ? ' ✓' : '')] });
    return res;
  }
  function mono2(v, c) { return joinMonos([{ ex: v === 'x' ? 1 : 0, ey: v === 'y' ? 1 : 0, c: c }]); }
  function subst2(poly, x, y) {
    var list = monos(poly), parts = [], total = F(0);
    list.forEach(function (m, i) {
      var val = m.ex ? x : y, ac = fabs(m.c), neg = m.c.n < 0;
      var vs = (val.n < 0 || val.d !== 1 || (ac.d === 1 && ac.n !== 1)) ? '(' + fs(val) + ')' : fs(val);
      var cs = ac.d === 1 ? (ac.n === 1 ? '' : String(ac.n)) : '(' + fs(ac) + ')';
      parts.push((i === 0 ? (neg ? MINUS : '') : ' ' + (neg ? MINUS : '+') + ' ') + cs + vs);
      total = fadd(total, fmul(m.c, val));
    });
    return { text: parts.join(''), total: total };
  }

  /* ================================================================ surds */
  function simplifySqrt(n) {        /* n ≥ 0 integer -> { k, m }: √n = k√m, m square-free */
    var k = 1, m = n;
    for (var i = 2; i * i <= m; i++) { while (m % (i * i) === 0) { m = m / (i * i); k *= i; } }
    return { k: k, m: m };
  }
  function sqrtStr(n) { var s = simplifySqrt(n); if (s.m === 1) return String(s.k); return (s.k === 1 ? '' : s.k) + '√' + s.m; }

  /* ================================================================ QUADRATIC */
  function solveQuadratic(src, method) {
    var eq = parseEquation(src), steps = [];
    if (pHas(eq.L, 'y') || pHas(eq.R, 'y')) throw { code: 'err_quad_y' };
    var d = pSub(eq.L, eq.R), deg = pDeg(d);
    if (deg > 2) throw { code: 'err_degree', n: deg };
    if (deg < 2) {
      if (pDeg(eq.L) === 2 || pDeg(eq.R) === 2) throw { code: 'err_quad_cancels' };
      throw { code: 'err_not_quadratic' };
    }
    pushStep(steps, { t: 'step_given', m: eq.text });
    var lm = termsMonos(eq.Lterms), rm = termsMonos(eq.Rterms);
    var unmerged = joinMonos(lm) + ' = ' + joinMonos(rm), merged = ps(eq.L) + ' = ' + ps(eq.R);
    if (eq.brackets) pushStep(steps, { t: 'step_expand', m: unmerged });
    else if (unmerged !== eq.text) pushStep(steps, { t: 'step_simplify', m: unmerged });
    if (merged !== unmerged) pushStep(steps, { t: 'step_collect', m: merged });
    if (!pIsZero(eq.R) || merged !== ps(d) + ' = 0') pushStep(steps, { t: 'step_quad_std', m: ps(d) + ' = 0' });
    /* whole-number coefficients, positive a, no common factor */
    var den = pDen(d);
    if (den > 1) { d = pScale(d, F(den)); pushStep(steps, { t: 'step_clear_fractions', v: { n: den }, m: ps(d) + ' = 0' }); }
    if (pCoef(d, 2, 0).n < 0) { d = pNeg(d); pushStep(steps, { t: 'step_quad_negate', m: ps(d) + ' = 0' }); }
    var g = pGcd(d);
    if (g > 1) { d = pScale(d, F(1, g)); pushStep(steps, { t: 'step_quad_gcd', v: { n: g }, m: ps(d) + ' = 0' }); }
    var a = pCoef(d, 2, 0).n, b = pCoef(d, 1, 0).n, c = pCoef(d, 0, 0).n;
    pushStep(steps, { t: 'step_quad_abc', m: 'a = ' + fs(F(a)) + ', b = ' + fs(F(b)) + ', c = ' + fs(F(c)) });
    var D = b * b - 4 * a * c;
    var fourac = 4 * a * c;
    pushStep(steps, { t: 'step_quad_disc', m: ['D = b² − 4ac = ' + fsP(F(b)) + '² − 4 × ' + fsP(F(a)) + ' × ' + fsP(F(c)), 'D = ' + (b * b) + (fourac < 0 ? ' + ' : ' − ') + Math.abs(fourac) + ' = ' + fs(F(D))] });
    var nature = D > 0 ? 'two' : D === 0 ? 'equal' : 'none';
    pushStep(steps, { t: nature === 'two' ? 'step_quad_nature_two' : nature === 'equal' ? 'step_quad_nature_equal' : 'step_quad_nature_none', m: 'D ' + (D > 0 ? '> 0' : D === 0 ? '= 0' : '< 0') });
    var res = { kind: 'quad', steps: steps, a: a, b: b, c: c, D: D, nature: nature, method: method, roots: [], vertex: { x: -b / (2 * a), y: -D / (4 * a) } };
    if (nature === 'none') {
      if (method === 'square') completeSquare(res, true);
      else if (method === 'formula') pushStep(steps, { t: 'step_formula_negative', m: 'x = [' + fs(F(-b)) + ' ± √(' + fs(F(D)) + ')] / ' + (2 * a) });
      else pushStep(steps, { t: 'step_factor_impossible_neg', m: 'D = ' + fs(F(D)) + ' < 0' });
      res.answer = null;
      return res;
    }
    /* exact roots */
    var sd = D === 0 ? { k: 0, m: 1 } : simplifySqrt(D);
    if (sd.m === 1) {
      var r1 = F(-b + sd.k, 2 * a), r2 = F(-b - sd.k, 2 * a);
      if (fcmp(r1, r2) > 0) { var tmp = r1; r1 = r2; r2 = tmp; }
      res.roots = D === 0 ? [{ frac: r1, value: fval(r1), text: fs(r1) }] : [{ frac: r1, value: fval(r1), text: fs(r1) }, { frac: r2, value: fval(r2), text: fs(r2) }];
      res.exact = D === 0 ? 'x = ' + fs(r1) : 'x = ' + fs(r1) + ' or x = ' + fs(r2);
    } else {
      var gg = gcd(gcd(Math.abs(b), sd.k), 2 * a);
      var num0 = -b / gg, kk = sd.k / gg, dn = 2 * a / gg;
      var kkS = (kk === 1 ? '' : kk) + '√' + sd.m;
      var inner = (num0 === 0 ? '' : fs(F(num0)) + ' ± ') + (num0 === 0 ? '±' : '') + kkS;
      var compact = dn === 1 ? inner : '(' + inner + ')/' + dn;
      res.exact = 'x = ' + compact;
      res.exactSplit = null;
      if (dn !== 1 && num0 !== 0 && num0 % dn === 0) res.exactSplit = 'x = ' + fs(F(num0 / dn)) + ' ± ' + kkS + '/' + dn;
      /* NCERT order: the "+" root first, then the "−" root */
      var vPlus = (-b + Math.sqrt(D)) / (2 * a), vMinus = (-b - Math.sqrt(D)) / (2 * a);
      var tMinus = dn === 1 ? (num0 === 0 ? MINUS + kkS : fs(F(num0)) + ' − ' + kkS) : '(' + (num0 === 0 ? MINUS + kkS : fs(F(num0)) + ' − ' + kkS) + ')/' + dn;
      var tPlus = dn === 1 ? (num0 === 0 ? kkS : fs(F(num0)) + ' + ' + kkS) : '(' + (num0 === 0 ? kkS : fs(F(num0)) + ' + ' + kkS) + ')/' + dn;
      res.roots = [{ frac: null, value: vPlus, text: tPlus }, { frac: null, value: vMinus, text: tMinus }];
      res.surd = { num0: num0, k: kk, m: sd.m, den: dn };
    }
    res.answer = res.roots.map(function (r) { return r.text; }).join(', ');
    if (method === 'square') completeSquare(res, false);
    else if (method === 'formula') formulaSteps(res);
    else factorSteps(res);
    /* verification */
    var poly = d;
    if (sd.m === 1) {
      var vl = res.roots.map(function (r) { var cl = checkLine('x = ' + fs(r.frac) + ':  LHS', poly, r.frac, 'x'); return cl.line + (fz(cl.total) ? ' = RHS ✓' : ''); });
      res.check = { ok: res.roots.every(function (r) { return fz(pEval(poly, r.frac)); }), lines: vl };
    } else {
      var vl2 = res.roots.map(function (r) { var val = a * r.value * r.value + b * r.value + c; return 'x ≈ ' + decFixed(r.value, 4) + ':  ' + ps(poly).replace(/x²/, '(' + decFixed(r.value, 4) + ')²').replace(/(\d)x/, '$1(' + decFixed(r.value, 4) + ')').replace(/(^|\s)x(\s|$)/, '$1(' + decFixed(r.value, 4) + ')$2') + ' ≈ ' + decFixed(val, 4) + ' ≈ 0 ✓'; });
      res.check = { ok: res.roots.every(function (r) { return Math.abs(a * r.value * r.value + b * r.value + c) < 1e-6; }), lines: vl2 };
    }
    pushStep(steps, { t: 'step_quad_check', m: res.check.lines });
    return res;
  }

  function factorSteps(res) {
    var a = res.a, b = res.b, c = res.c, steps = res.steps, D = res.D;
    var ax2 = monoBody(F(a), 2, 0);
    if (c === 0 && b === 0) { pushStep(steps, { t: 'step_factor_zero_product_equal', m: ['x × x = 0', 'x = 0'] }); return; }
    if (c === 0) {
      /* x(ax + b) = 0 */
      var inner = joinMonos([{ ex: 1, ey: 0, c: F(a) }, { ex: 0, ey: 0, c: F(b) }]);
      pushStep(steps, { t: 'step_factor_common_x', m: 'x(' + inner + ') = 0' });
      pushStep(steps, { t: 'step_factor_zero_product', m: ['x = 0  or  ' + inner + ' = 0', 'x = 0  or  x = ' + fs(F(-b, a))] });
      return;
    }
    if (b === 0) {
      /* ax² + c = 0 -> x² = −c/a */
      var k = F(-c, a);
      pushStep(steps, { t: 'step_factor_no_middle', m: [ax2 + ' = ' + fs(F(-c)), 'x² = ' + fs(k)] });
      if (k.n < 0) { pushStep(steps, { t: 'step_factor_impossible_neg', m: 'x² = ' + fs(k) + ' < 0' }); return; }
      if (isSquare(k.n) && isSquare(k.d)) {
        var r = F(sq(k.n), sq(k.d));
        if (fz(r)) pushStep(steps, { t: 'step_factor_zero_product_equal', m: ['x × x = 0', 'x = 0'] });
        else pushStep(steps, { t: 'step_factor_diff_squares', m: ['(x − ' + fs(r) + ')(x + ' + fs(r) + ') = 0', 'x = ' + fs(r) + '  or  x = ' + fs(fneg(r))] });
      } else {
        pushStep(steps, { t: 'step_factor_sqrt_both', m: 'x = ±√' + fsP(k) + ' = ±' + res.roots[0].text });
      }
      return;
    }
    if (!isSquare(D)) {
      pushStep(steps, { t: 'step_factor_impossible', m: 'ac = ' + fs(F(a * c)) + ', b = ' + fs(F(b)) + ';  D = ' + D });
      formulaSteps(res);
      return;
    }
    /* split the middle term: p + q = b, p q = ac */
    var ac = a * c, pairs = [], found = null, N = Math.abs(ac);
    for (var dd = 1; dd * dd <= N; dd++) {
      if (N % dd) continue;
      var e = N / dd, cand = ac > 0 ? [[dd, e], [-dd, -e]] : [[-dd, e], [dd, -e]];
      cand.forEach(function (pq) { var ok = pq[0] + pq[1] === b; var item = { p: pq[0], q: pq[1], sum: pq[0] + pq[1], ok: ok }; pairs.push(item); if (ok && !found) found = item; });
    }
    /* keep the list short: the chosen pair plus a few tried before it */
    var shown = [], idx = pairs.indexOf(found);
    pairs.forEach(function (it, i) { if (it === found || (i < idx && shown.length < 5) || (i > idx && shown.length < 6 && i - idx <= 1 && idx < 2)) shown.push(it); });
    if (shown.indexOf(found) < 0) shown.push(found);
    res.split = { p: found.p, q: found.q, ac: ac, tried: shown };
    pushStep(steps, { t: 'step_split_need', v: { b: fs(F(b)), ac: fs(F(ac)) }, m: 'p + q = ' + fs(F(b)) + ',  p × q = ' + fs(F(a)) + ' × ' + fsP(F(c)) + ' = ' + fs(F(ac)) });
    pushStep(steps, { t: 'step_split_tried', m: shown.map(function (it) { return fs(F(it.p)) + ', ' + fs(F(it.q)) + ' → ' + fs(F(it.p)) + ' + ' + fsPneg(F(it.q)) + ' = ' + fs(F(it.sum)) + (it.ok ? ' ✓' : ' ✗'); }) });
    var p = found.p, q = found.q;
    var rewritten = joinMonos([{ ex: 2, ey: 0, c: F(a) }, { ex: 1, ey: 0, c: F(p) }, { ex: 1, ey: 0, c: F(q) }, { ex: 0, ey: 0, c: F(c) }]) + ' = 0';
    pushStep(steps, { t: 'step_split_rewrite', v: { p: fs(F(p)), q: fs(F(q)) }, m: rewritten });
    var m1 = gcd(a, p), bA = F(a / m1), bB = F(p / m1);             /* bracket: bA x + bB */
    var m2 = q * m1 / a;                                               /* second group = m2 (bracket) */
    var bracket = '(' + joinMonos([{ ex: 1, ey: 0, c: bA }, { ex: 0, ey: 0, c: bB }]) + ')';
    var g1 = monoBody(F(m1), 1, 0) + bracket;
    var g2 = (m2 < 0 ? ' − ' : ' + ') + (Math.abs(m2) === 1 ? '' : Math.abs(m2)) + bracket;
    pushStep(steps, { t: 'step_split_group', m: g1 + g2 + ' = 0' });
    var second = '(' + joinMonos([{ ex: 1, ey: 0, c: F(m1) }, { ex: 0, ey: 0, c: F(m2) }]) + ')';
    var same = bracket === second;
    pushStep(steps, { t: 'step_split_factors', m: same ? bracket + '² = 0' : bracket + second + ' = 0' });
    var r1 = F(-p, a), r2 = F(-m2, m1);
    if (same) pushStep(steps, { t: 'step_factor_zero_product_equal', m: [bracket.slice(1, -1) + ' = 0', 'x = ' + fs(r1)] });
    else pushStep(steps, { t: 'step_factor_zero_product', m: [bracket.slice(1, -1) + ' = 0  or  ' + second.slice(1, -1) + ' = 0', 'x = ' + fs(r1) + '  or  x = ' + fs(r2)] });
  }

  function completeSquare(res, negative) {
    var a = res.a, b = res.b, c = res.c, steps = res.steps, D = res.D;
    var ba = F(b, a), ca = F(c, a), half = F(b, 2 * a), hsq = fmul(half, half);
    var lines = [];
    if (a !== 1) lines.push('x²' + (fz(ba) ? '' : (ba.n < 0 ? ' − ' : ' + ') + monoBody(ba, 1, 0)) + (fz(ca) ? '' : (ca.n < 0 ? ' − ' : ' + ') + fsAbs(ca)) + ' = 0');
    var monic = { '2,0': F(1) }; if (b) monic['1,0'] = F(b); if (c) monic['0,0'] = F(c);
    pushStep(steps, { t: a !== 1 ? 'step_sq_divide' : 'step_sq_start', v: { a: fs(F(a)) }, m: lines.length ? lines : [ps(monic) + ' = 0'] });
    var lhs = 'x²' + (fz(ba) ? '' : (ba.n < 0 ? ' − ' : ' + ') + monoBody(ba, 1, 0));
    pushStep(steps, { t: 'step_sq_move', m: lhs + ' = ' + fs(fneg(ca)) });
    if (b === 0) {
      /* already a square: x² = k */
      var k0 = fneg(ca);
      if (negative || k0.n < 0) { pushStep(steps, { t: 'step_sq_negative', m: 'x² = ' + fs(k0) + ' < 0' }); return; }
      if (fz(k0)) { pushStep(steps, { t: 'step_sq_zero', m: 'x = 0' }); return; }
      var sd0 = simplifySqrt(D), g0 = gcd(sd0.k, 2 * a);
      var r0 = sd0.m === 1 ? fs(F(sd0.k, 2 * a)) : (sd0.k / g0 === 1 ? '' : sd0.k / g0) + '√' + sd0.m + (2 * a / g0 === 1 ? '' : '/' + (2 * a / g0));
      pushStep(steps, { t: 'step_sq_root', m: 'x = ±√' + fsP(k0) + ' = ±' + r0 });
      if (sd0.m !== 1) pushStep(steps, { t: 'step_sq_solve', m: ['x = ' + r0 + '  or  x = ' + MINUS + r0, 'x ≈ ' + dec(res.roots[0].value, 2) + '  or  x ≈ ' + dec(res.roots[1].value, 2)] });
      else pushStep(steps, { t: 'step_sq_solve', m: 'x = ' + r0 + '  or  x = ' + MINUS + r0 });
      return;
    }
    var rhs = fadd(fneg(ca), hsq);
    pushStep(steps, { t: 'step_sq_add', v: { h: fs(half), hsq: fs(hsq) }, m: [lhs + ' + ' + fsP(half) + '² = ' + fs(fneg(ca)) + ' + ' + fsP(half) + '²', lhs + ' + ' + fsAbs(hsq) + ' = ' + fs(fneg(ca)) + ' + ' + fsAbs(hsq)] });
    var sqr = '(x ' + (half.n < 0 ? '− ' : '+ ') + fsAbs(half) + ')²';
    pushStep(steps, { t: 'step_sq_square', m: sqr + ' = ' + fs(rhs) });
    if (negative || rhs.n < 0) { pushStep(steps, { t: 'step_sq_negative', m: sqr + ' = ' + fs(rhs) + ' < 0' }); return; }
    var nh = fneg(half);
    if (fz(rhs)) {
      pushStep(steps, { t: 'step_sq_zero', m: ['x ' + (half.n < 0 ? '− ' : '+ ') + fsAbs(half) + ' = 0', 'x = ' + fs(nh)] });
      return;
    }
    /* √rhs: rhs = D/(4a²) -> √D / 2a */
    var sd = D === 0 ? { k: 0, m: 1 } : simplifySqrt(D);
    var rootStr = sd.m === 1 ? fs(F(sd.k, 2 * a)) : sqrtStr(D) + '/' + (2 * a);
    if (sd.m !== 1) { var gg = gcd(sd.k, 2 * a); rootStr = (sd.k / gg === 1 ? '' : sd.k / gg) + '√' + sd.m + (2 * a / gg === 1 ? '' : '/' + (2 * a / gg)); }
    var rhsRoot = '√' + fsP(rhs);
    pushStep(steps, { t: 'step_sq_root', m: ['x ' + (half.n < 0 ? '− ' : '+ ') + fsAbs(half) + ' = ±' + rhsRoot + (rhsRoot === rootStr ? '' : ' = ±' + rootStr)] });
    if (sd.m === 1) {
      var rt = F(sd.k, 2 * a);
      pushStep(steps, { t: 'step_sq_solve', m: ['x = ' + fs(nh) + ' + ' + fs(rt) + ' = ' + fs(fadd(nh, rt)) + '  or  x = ' + fs(nh) + ' − ' + fs(rt) + ' = ' + fs(fsub(nh, rt))] });
    } else {
      var l1 = 'x = ' + fs(nh) + ' ± ' + rootStr, out = [l1];
      if (res.exact !== l1) out.push(res.exact);
      out.push('x = ' + res.roots[0].text + ' ≈ ' + dec(res.roots[0].value, 2) + '  or  x = ' + res.roots[1].text + ' ≈ ' + dec(res.roots[1].value, 2));
      pushStep(steps, { t: 'step_sq_solve', m: out });
    }
  }

  function formulaSteps(res) {
    var a = res.a, b = res.b, c = res.c, steps = res.steps, D = res.D;
    pushStep(steps, { t: 'step_formula', m: 'x = [−b ± √(b² − 4ac)] / 2a' });
    var nb = fs(F(-b));
    var l1 = 'x = [' + (b < 0 ? MINUS + '(' + fs(F(b)) + ')' : MINUS + b) + ' ± √' + D + '] / (2 × ' + fsP(F(a)) + ')';
    var l2 = 'x = [' + nb + ' ± √' + D + '] / ' + (2 * a);
    var sd = D === 0 ? { k: 0, m: 1 } : simplifySqrt(D), lines = [l1, l2];
    if (sd.m === 1) {
      lines.push('x = [' + nb + ' ± ' + sd.k + '] / ' + (2 * a));
      pushStep(steps, { t: 'step_formula_subst', m: lines });
      var r1 = F(-b + sd.k, 2 * a), r2 = F(-b - sd.k, 2 * a);
      if (D === 0) pushStep(steps, { t: 'step_formula_roots_equal', m: 'x = ' + nb + ' / ' + (2 * a) + ' = ' + fs(r1) });
      else pushStep(steps, { t: 'step_formula_roots', m: ['x = (' + nb + ' + ' + sd.k + ') / ' + (2 * a) + ' = ' + fs(F(-b + sd.k)) + ' / ' + (2 * a) + ' = ' + fs(r1), 'x = (' + nb + ' − ' + sd.k + ') / ' + (2 * a) + ' = ' + fs(F(-b - sd.k)) + ' / ' + (2 * a) + ' = ' + fs(r2)] });
    } else {
      pushStep(steps, { t: 'step_formula_subst', m: lines });
      var surdLines = ['√' + D + ' = √(' + (sd.k * sd.k) + ' × ' + sd.m + ') = ' + sqrtStr(D)];
      if (sd.k > 1) surdLines.push('x = [' + nb + ' ± ' + sqrtStr(D) + '] / ' + (2 * a));
      var gg = gcd(gcd(Math.abs(b), sd.k), 2 * a);
      if (gg > 1) surdLines.push(res.exact + '   (dividing by ' + gg + ')');
      if (res.exactSplit) surdLines.push(res.exactSplit);
      pushStep(steps, { t: sd.k > 1 ? 'step_formula_surd' : 'step_formula_surd_simple', v: { g: gg }, m: surdLines });
      pushStep(steps, { t: 'step_formula_roots', m: ['x = ' + res.roots[0].text + ' ≈ ' + dec(res.roots[0].value, 2), 'x = ' + res.roots[1].text + ' ≈ ' + dec(res.roots[1].value, 2)] });
    }
  }

  /* ================================================================ practice generator */
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function rndNZ(a, b) { var v = 0; while (!v) v = rnd(a, b); return v; }
  function pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function lin(c, v) { return joinMonos([{ ex: v === 'x' ? 1 : 0, ey: v === 'y' ? 1 : 0, c: F(c) }]); }
  function eqText(parts) { return parts.replace(/−/g, '-'); } /* ASCII for the input box */
  function withConst(s, k) { if (k === 0) return s; return s + (k < 0 ? ' − ' : ' + ') + Math.abs(k); }

  function genLinear(level) {
    var x0, a, b, c, d, eq;
    if (level === 'easy') {
      x0 = rnd(-6, 12); a = rnd(2, 9); b = rnd(-15, 15); c = a * x0 + b;
      eq = pickOne([0, 1]) ? withConst(lin(a, 'x'), b) + ' = ' + c : c + ' = ' + withConst(lin(a, 'x'), b);
      if (Math.random() < 0.3) { a = 1; c = x0 + b; eq = withConst('x', b) + ' = ' + c; }
    } else if (level === 'medium') {
      x0 = rnd(-9, 12); a = rnd(2, 9); c = rndNZ(-6, 8); if (c === a) c = a + 1; b = rnd(-12, 12); d = a * x0 + b - c * x0;
      eq = withConst(lin(a, 'x'), b) + ' = ' + withConst(lin(c, 'x'), d);
    } else {
      var type = rnd(0, 2);
      if (type === 0) { /* a(x + b) = c x + d */
        x0 = rnd(-8, 10); a = rnd(2, 6); b = rnd(-9, 9); c = rndNZ(-5, 7); if (c === a) c = a - 1 || 1; d = a * (x0 + b) - c * x0;
        eq = a + '(' + withConst('x', b) + ') = ' + withConst(lin(c, 'x'), d);
      } else if (type === 1) { /* x/n + b = c */
        var n = rnd(2, 6); x0 = n * rnd(-5, 9); b = rnd(-9, 9); c = x0 / n + b;
        eq = 'x/' + n + (b < 0 ? ' − ' : ' + ') + Math.abs(b) + ' = ' + c;
      } else { /* a(x − b) + c = d(x + e) with fraction answer possible */
        a = rnd(2, 5); b = rnd(1, 7); c = rnd(-8, 8); d = rnd(2, 7); var e = rnd(-6, 6); if (d === a) d = a + 1;
        var num = d * e + a * b - c, den = a - d; x0 = F(num, den);
        eq = a + '(x − ' + b + ')' + (c < 0 ? ' − ' : ' + ') + Math.abs(c) + ' = ' + d + '(' + withConst('x', e) + ')';
      }
    }
    return { mode: 'linear', level: level, eq: eqText(eq), answer: { x: typeof x0 === 'number' ? F(x0) : x0 } };
  }
  function genPair(level) {
    var x0 = rnd(-5, 9), y0 = rnd(-5, 9), a1, b1, a2, b2, tries = 0;
    do {
      tries++;
      if (level === 'easy') { a1 = 1; b1 = rndNZ(-3, 3); a2 = rndNZ(-3, 3); b2 = pickOne([1, -1]); }
      else if (level === 'medium') { a1 = rnd(1, 4); b1 = rndNZ(-4, 5); a2 = rndNZ(-4, 5); b2 = rnd(1, 4); }
      else { a1 = rndNZ(-6, 9); b1 = rndNZ(-7, 9); a2 = rndNZ(-7, 9); b2 = rndNZ(-6, 9); }
    } while (a1 * b2 - a2 * b1 === 0 && tries < 50);
    if (a1 * b2 - a2 * b1 === 0) { a1 = 1; b1 = 1; a2 = 1; b2 = -1; }
    var c1 = a1 * x0 + b1 * y0, c2 = a2 * x0 + b2 * y0;
    var e1 = joinMonos([{ ex: 1, ey: 0, c: F(a1) }, { ex: 0, ey: 1, c: F(b1) }]) + ' = ' + c1;
    var e2 = joinMonos([{ ex: 1, ey: 0, c: F(a2) }, { ex: 0, ey: 1, c: F(b2) }]) + ' = ' + c2;
    return { mode: 'pair', level: level, eq1: eqText(e1), eq2: eqText(e2), answer: { x: F(x0), y: F(y0) } };
  }
  function genQuad(level) {
    var a, b, c, r1, r2;
    if (level === 'easy') {
      r1 = rndNZ(-9, 9); r2 = rndNZ(-9, 9); if (r2 === r1 && Math.random() < 0.7) r2 = -r1 || 2;
      a = 1; b = -(r1 + r2); c = r1 * r2;
    } else if (level === 'medium') {
      var a1 = rnd(1, 3), p = rndNZ(-7, 7), a2 = rnd(1, 3), q = rndNZ(-7, 7);
      /* (a1 x − p)(a2 x − q) */
      a = a1 * a2; b = -(a1 * q + a2 * p); c = p * q;
    } else {
      var t = rnd(0, 3);
      if (t === 0) { a = rnd(1, 3); var h = rndNZ(-5, 5); a = 1; b = -2 * h; c = h * h; }      /* equal roots */
      else if (t === 1) { a = rnd(1, 3); b = rnd(-6, 6); c = rnd(1, 9); if (b * b - 4 * a * c >= 0) { c = Math.floor(b * b / (4 * a)) + 1 + rnd(0, 3); } } /* no real roots */
      else { a = rnd(1, 3); b = rndNZ(-8, 8); c = rndNZ(-9, 9); if (b * b - 4 * a * c < 0) c = -Math.abs(c); }           /* often irrational */
    }
    var eq = joinMonos([{ ex: 2, ey: 0, c: F(a) }, { ex: 1, ey: 0, c: F(b) }, { ex: 0, ey: 0, c: F(c) }]) + ' = 0';
    var D = b * b - 4 * a * c, roots = [];
    if (D >= 0) { var s = Math.sqrt(D); roots = D === 0 ? [(-b) / (2 * a)] : [(-b - s) / (2 * a), (-b + s) / (2 * a)]; }
    return { mode: 'quad', level: level, eq: eqText(eq), answer: { D: D, roots: roots } };
  }
  function generate(mode, level) { return mode === 'pair' ? genPair(level) : mode === 'quad' ? genQuad(level) : genLinear(level); }
  /* the printed answer for a generated problem (no words, so it works in every language) */
  function answerText(p) {
    if (p.mode === 'linear') return 'x = ' + fs(p.answer.x);
    if (p.mode === 'pair') return 'x = ' + fs(p.answer.x) + ', y = ' + fs(p.answer.y);
    var r = p.answer.roots;
    if (!r.length) return 'D = ' + p.answer.D + ' < 0';
    return 'x = ' + r.map(function (v) { return exactRoot(v); }).join(', ');
  }
  function exactRoot(v) { var f = toFrac(v); return f ? fs(f) : dec(v, 2); }
  function toFrac(v) { for (var d = 1; d <= 60; d++) { var n = Math.round(v * d); if (Math.abs(n / d - v) < 1e-9) return F(n, d); } return null; }
  /* is the typed answer right? accepts "3", "-1.5", "3/2", "1.5" */
  function checkAnswer(p, typed) {
    if (p.mode === 'linear') { var f = fparse(typed.x); return !!f && feq(f, p.answer.x); }
    if (p.mode === 'pair') { var fx = fparse(typed.x), fy = fparse(typed.y); return !!fx && !!fy && feq(fx, p.answer.x) && feq(fy, p.answer.y); }
    var r = p.answer.roots.slice();
    if (!r.length) return String(typed.x || '').trim() === '' && String(typed.y || '').trim() === '' ? null : false;
    var given = [typed.x, typed.y].map(function (s) { var f2 = fparse(s); return f2 ? fval(f2) : null; }).filter(function (v) { return v !== null; });
    if (r.length === 1) return given.length >= 1 && given.every(function (v) { return Math.abs(v - r[0]) < 0.006; });
    if (given.length !== 2) return false;
    given.sort(function (a2, b2) { return a2 - b2; });
    return Math.abs(given[0] - r[0]) < 0.006 && Math.abs(given[1] - r[1]) < 0.006;
  }

  window.EQS = {
    F: F, fadd: fadd, fsub: fsub, fmul: fmul, fdiv: fdiv, fneg: fneg, feq: feq, fval: fval, fs: fs, fparse: fparse, dec: dec, gcd: gcd, lcm: lcm,
    simplifySqrt: simplifySqrt, sqrtStr: sqrtStr, parseEquation: parseEquation, parseExpr: parseExpr, ps: ps, prettyInput: prettyInput, eqStr: eqStr, toFrac: toFrac,
    solveLinear: solveLinear, solvePair: solvePair, solveQuadratic: solveQuadratic,
    generate: generate, answerText: answerText, checkAnswer: checkAnswer, MINUS: MINUS
  };
})();
