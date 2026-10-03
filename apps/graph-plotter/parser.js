/* Graph Plotter: a small, safe maths-expression parser (no eval, no Function).
   GPARSE.compile('2x^2 - 3sin(x)') -> { ok:true, f:function(x, P), trig:bool, params:{a,b,c} }
                                    or { ok:false, code:'paren'|'unknown'|..., tok:'...' }
   P = { a, b, c, deg }  (deg = true: trig functions use degrees)
   Grammar (school maths conventions):
     expr  := term (('+'|'-') term)*
     term  := unary (('*'|'/') unary | <implicit ×> power)*      2x, 3(x+1), x sin x
     unary := ('-'|'+') unary | power                             -x^2 = -(x^2)
     power := primary ('^' unary)?                                right-assoc: 2^3^2 = 2^9
     primary := number | x | a | b | c | pi | e | (expr) | |expr| | fn(expr) | fn^n(expr) | fn x  */
(function () {
  'use strict';
  var D2R = Math.PI / 180;
  function rad(v, P) { return P.deg ? v * D2R : v; }
  function ang(v, P) { return P.deg ? v / D2R : v; }
  var FN = {
    sin: function (v, P) { return Math.sin(rad(v, P)); },
    cos: function (v, P) { return Math.cos(rad(v, P)); },
    tan: function (v, P) { var r = rad(v, P); return Math.sin(r) / Math.cos(r); },
    sec: function (v, P) { return 1 / Math.cos(rad(v, P)); },
    cosec: function (v, P) { return 1 / Math.sin(rad(v, P)); },
    cot: function (v, P) { var r = rad(v, P); return Math.cos(r) / Math.sin(r); },
    asin: function (v, P) { return ang(Math.asin(v), P); },
    acos: function (v, P) { return ang(Math.acos(v), P); },
    atan: function (v, P) { return ang(Math.atan(v), P); },
    sqrt: function (v) { return Math.sqrt(v); },
    cbrt: function (v) { return Math.cbrt ? Math.cbrt(v) : (v < 0 ? -Math.pow(-v, 1 / 3) : Math.pow(v, 1 / 3)); },
    abs: function (v) { return Math.abs(v); },
    log: function (v) { return Math.log10 ? Math.log10(v) : Math.log(v) / Math.LN10; },
    ln: function (v) { return Math.log(v); },
    exp: function (v) { return Math.exp(v); },
    floor: function (v) { return Math.floor(v); },
    ceil: function (v) { return Math.ceil(v); }
  };
  var ALIAS = { csc: 'cosec', arcsin: 'asin', arccos: 'acos', arctan: 'atan', lg: 'log' };
  var TRIG = { sin: 1, cos: 1, tan: 1, sec: 1, cosec: 1, cot: 1, asin: 1, acos: 1, atan: 1 };
  var CONSTS = { pi: Math.PI, e: Math.E };
  var VARS = { x: 1, a: 1, b: 1, c: 1 };
  var NAMES = Object.keys(FN).concat(Object.keys(ALIAS), Object.keys(CONSTS), Object.keys(VARS))
    .sort(function (p, q) { return q.length - p.length; });

  function Err(code, tok) { this.code = code; this.tok = tok === undefined ? '' : String(tok); }

  /* ---------------------------------------------------------------- tokens */
  function tokenize(src) {
    var s = src.toLowerCase()
      .replace(/[−–—]/g, '-').replace(/[×·∙⋅]/g, '*').replace(/÷/g, '/')
      .replace(/\*\*/g, '^').replace(/π/g, ' pi ').replace(/²/g, '^2').replace(/³/g, '^3')
      .replace(/√/g, ' sqrt ').replace(/[\[{]/g, '(').replace(/[\]}]/g, ')');
    var out = [], i = 0, m;
    while (i < s.length) {
      var ch = s[i];
      if (/\s/.test(ch)) { i++; continue; }
      if ((m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i)))) {
        var next = s[i + m[0].length];
        if (next === '.' || (next && /\d/.test(next))) throw new Err('number', (/^[\d.]+/.exec(s.slice(i)) || [m[0]])[0]);
        out.push({ t: 'num', v: parseFloat(m[0]), s: m[0] });
        i += m[0].length; continue;
      }
      if ((m = /^[a-z]+/.exec(s.slice(i)))) {
        var run = m[0], j = 0;
        while (j < run.length) {
          var hit = null;
          for (var k = 0; k < NAMES.length; k++) if (run.substr(j, NAMES[k].length) === NAMES[k]) { hit = NAMES[k]; break; }
          if (!hit) throw new Err(run.charAt(j) === 'y' ? 'equation' : 'unknown', run);
          out.push({ t: 'name', v: ALIAS[hit] || hit, s: hit });
          j += hit.length;
        }
        i += run.length; continue;
      }
      if ('+-*/^'.indexOf(ch) >= 0) { out.push({ t: 'op', v: ch, s: ch }); i++; continue; }
      if (ch === '(' || ch === ')' || ch === '|') { out.push({ t: ch, s: ch }); i++; continue; }
      if (ch === '=') throw new Err('equation', '=');
      throw new Err('unexpected', ch);
    }
    out.push({ t: 'end', s: '' });
    return out;
  }

  /* ---------------------------------------------------------------- parser */
  function parse(tokens) {
    var i = 0, absDepth = 0, parenDepth = 0;
    function peek() { return tokens[i]; }
    function next() { return tokens[i++]; }
    function isOp(tk, v) { return tk.t === 'op' && tk.v === v; }
    function startsImplicit(tk) {
      return tk.t === 'num' || tk.t === 'name' || tk.t === '(' || (tk.t === '|' && absDepth === 0);
    }
    function isSimple(tk) { return tk.t === 'num' || (tk.t === 'name' && !FN[tk.v]); }

    function expr() {
      var n = term();
      while (isOp(peek(), '+') || isOp(peek(), '-')) { var op = next().v; n = { k: op, a: n, b: term() }; }
      return n;
    }
    function term() {
      var n = unary();
      for (;;) {
        var tk = peek();
        if (isOp(tk, '*') || isOp(tk, '/')) { next(); n = { k: tk.v, a: n, b: unary() }; }
        else if (startsImplicit(tk)) n = { k: '*', a: n, b: power() };
        else return n;
      }
    }
    function unary() {
      if (isOp(peek(), '-')) { next(); return { k: 'neg', a: unary() }; }
      if (isOp(peek(), '+')) { next(); return unary(); }
      return power();
    }
    function power() {
      var base = primary();
      if (isOp(peek(), '^')) { next(); return { k: '^', a: base, b: unary() }; }
      return base;
    }
    function primary() {
      var tk = next();
      if (tk.t === 'num') return { k: 'num', v: tk.v };
      if (tk.t === 'name') {
        if (CONSTS[tk.v] !== undefined) return { k: 'num', v: CONSTS[tk.v] };
        if (tk.v === 'x') return { k: 'x' };
        if (VARS[tk.v]) return { k: 'p', v: tk.v };
        // a function: sin(x), sin x, sin 2x, sin^2(x)
        var expo = null;
        if (isOp(peek(), '^')) {
          next();
          if (isOp(peek(), '-')) { next(); expo = { k: 'neg', a: primary() }; } else expo = primary();
        }
        var nx = peek(), arg;
        if (nx.t === '(') arg = primary();
        else if (nx.t === 'num' || nx.t === 'name' || (nx.t === '|' && absDepth === 0)) {
          arg = power();
          while (isSimple(peek())) arg = { k: '*', a: arg, b: power() };
        } else throw new Err('fn_arg', tk.s);
        var call = { k: 'call', v: tk.v, a: arg };
        return expo ? { k: '^', a: call, b: expo } : call;
      }
      if (tk.t === '(') {
        if (peek().t === ')') throw new Err('unexpected', '()');
        parenDepth++;
        var e = expr();
        if (peek().t !== ')') throw new Err(peek().t === 'end' ? 'paren' : 'unexpected', peek().s);
        next(); parenDepth--;
        return e;
      }
      if (tk.t === '|') {
        absDepth++;
        var inner = expr();
        if (peek().t !== '|') throw new Err('abs', '|');
        next(); absDepth--;
        return { k: 'call', v: 'abs', a: inner };
      }
      if (tk.t === ')') throw new Err('paren', ')');
      if (tk.t === 'end') throw new Err(parenDepth > 0 ? 'paren' : absDepth > 0 ? 'abs' : 'end', '');
      throw new Err('unexpected', tk.s);
    }

    var tree = expr();
    var last = peek();
    if (last.t !== 'end') throw new Err(last.t === ')' ? 'paren' : 'unexpected', last.s);
    return tree;
  }

  /* ------------------------------------------------------------ evaluation */
  /* real powers: a negative base with an odd-denominator fraction, e.g. x^(1/3), stays real */
  function pow(a, b) {
    var r = Math.pow(a, b);
    if (r === r || a >= 0 || !isFinite(b)) return r;
    for (var q = 3; q <= 15; q += 2) {
      var p = b * q, rp = Math.round(p);
      if (Math.abs(p - rp) < 1e-9) return (rp % 2 ? -1 : 1) * Math.pow(-a, b);
    }
    return NaN;
  }

  function build(n, info) {
    var A, B;
    switch (n.k) {
      case 'num': var v = n.v; return function () { return v; };
      case 'x': return function (x) { return x; };
      case 'p': var name = n.v; info.params[name] = true; return function (x, P) { return P[name]; };
      case 'neg': A = build(n.a, info); return function (x, P) { return -A(x, P); };
      case '+': A = build(n.a, info); B = build(n.b, info); return function (x, P) { return A(x, P) + B(x, P); };
      case '-': A = build(n.a, info); B = build(n.b, info); return function (x, P) { return A(x, P) - B(x, P); };
      case '*': A = build(n.a, info); B = build(n.b, info); return function (x, P) { return A(x, P) * B(x, P); };
      case '/': A = build(n.a, info); B = build(n.b, info); return function (x, P) { return A(x, P) / B(x, P); };
      case '^': A = build(n.a, info); B = build(n.b, info); return function (x, P) { return pow(A(x, P), B(x, P)); };
      case 'call':
        var fn = FN[n.v]; A = build(n.a, info);
        if (TRIG[n.v]) info.trig = true;
        return function (x, P) { return fn(A(x, P), P); };
    }
    throw new Err('unexpected', '');
  }

  function clean(src) {
    return String(src == null ? '' : src).replace(/^\s*(y|f\s*\(\s*x\s*\))\s*=/i, '').trim();
  }

  function compile(src) {
    var s = clean(src);
    if (!s) return { ok: false, empty: true, code: 'empty', tok: '' };
    if (s.length > 300) return { ok: false, code: 'unexpected', tok: s.slice(300, 310) };
    try {
      var info = { trig: false, params: {} };
      var f = build(parse(tokenize(s)), info);
      return { ok: true, f: f, trig: info.trig, params: info.params };
    } catch (e) {
      if (e instanceof Err) return { ok: false, code: e.code, tok: e.tok };
      if (e instanceof RangeError) return { ok: false, code: 'unexpected', tok: '' };   // absurdly deep nesting
      throw e;
    }
  }

  window.GPARSE = { compile: compile, pow: pow };
})();
