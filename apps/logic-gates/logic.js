/* Logic Gates Lab: Boolean expression engine (tokenizer, parser, evaluator, printers).
   Pure functions, no DOM and no eval(). Exposed as window.LG_LOGIC.
   Grammar (lowest to highest precedence):
     OR / NOR   ( + | ∨ OR NOR )
     XOR / XNOR ( ^ ⊕ ⊙ XOR XNOR )
     AND / NAND ( · . * & ∧ × AND NAND, or two things side by side: AB, A(B+C) )
     NOT        ( prefix ¬ ! ~ NOT, postfix ' ’ ′ )
     A–E, 0, 1, ( ), [ ], { } */
(function () {
  'use strict';
  var VARS = ['A', 'B', 'C', 'D', 'E'];
  var KW = { AND: 'and', OR: 'or', NOT: 'not', XOR: 'xor', NAND: 'nand', NOR: 'nor', XNOR: 'xnor' };
  var LEVEL = { or: 0, nor: 0, xor: 1, xnor: 1, and: 2, nand: 2 };
  var SYMS = {
    '·': 'and', '.': 'and', '*': 'and', '&': 'and', '∧': 'and', '×': 'and', '⋅': 'and', '•': 'and', '∙': 'and',
    '+': 'or', '|': 'or', '∨': 'or',
    '^': 'xor', '⊕': 'xor', '⊙': 'xnor'
  };
  var MAXLEN = 200, MAXDEPTH = 60;

  function ParseError(key, vars) { this.key = key; this.vars = vars || {}; this.message = key; }
  ParseError.prototype = Object.create(Error.prototype);
  ParseError.prototype.constructor = ParseError;

  function tokenize(src) {
    var out = [], i = 0, n = src.length;
    function push(o) { out.push(o); }
    while (i < n) {
      var c = src[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/[A-Za-z]/.test(c)) {
        var j = i;
        while (j < n && /[A-Za-z]/.test(src[j])) j++;
        var word = src.slice(i, j), up = word.toUpperCase();
        if (KW[up]) {
          if (KW[up] === 'not') push({ t: 'notp', pos: i, raw: word });
          else push({ t: 'op', op: KW[up], pos: i, raw: word });
        } else {
          for (var k = 0; k < word.length; k++) {
            var ch = word[k].toUpperCase();
            if (VARS.indexOf(ch) < 0) throw new ParseError('err_unknown', { ch: word[k] });
            push({ t: 'var', name: ch, pos: i + k, raw: word[k] });
          }
        }
        i = j; continue;
      }
      if (c === '0' || c === '1') { push({ t: 'const', v: +c, pos: i, raw: c }); i++; continue; }
      if (c === '(' || c === '[' || c === '{') { push({ t: 'lp', pos: i, raw: c }); i++; continue; }
      if (c === ')' || c === ']' || c === '}') { push({ t: 'rp', pos: i, raw: c }); i++; continue; }
      if (c === '¬' || c === '!' || c === '~') { push({ t: 'notp', pos: i, raw: c }); i++; continue; }
      if (c === "'" || c === '’' || c === '′' || c === '`') { push({ t: 'post', pos: i, raw: c }); i++; continue; }
      if (SYMS[c]) {
        var op = SYMS[c], len = 1;
        if ((c === '&' || c === '|') && src[i + 1] === c) len = 2;  /* && and || */
        push({ t: 'op', op: op, pos: i, raw: src.substr(i, len) }); i += len; continue;
      }
      throw new ParseError('err_symbol', { ch: c, n: i + 1 });
    }
    return out;
  }

  /* AB, A(B+C), (A+B)(A+C), A NOT B → insert an AND between two things written side by side */
  function withImplicitAnd(toks) {
    var out = [];
    for (var i = 0; i < toks.length; i++) {
      var a = out[out.length - 1], b = toks[i];
      var endsOperand = a && (a.t === 'var' || a.t === 'const' || a.t === 'rp' || a.t === 'post');
      var startsOperand = b.t === 'var' || b.t === 'const' || b.t === 'lp' || b.t === 'notp';
      if (endsOperand && startsOperand) out.push({ t: 'op', op: 'and', pos: b.pos, raw: '', implicit: true });
      out.push(b);
    }
    return out;
  }

  function parse(src) {
    src = String(src == null ? '' : src);
    if (!src.trim()) throw new ParseError('err_empty');
    if (src.length > MAXLEN) throw new ParseError('err_too_long', { n: MAXLEN });
    var toks = withImplicitAnd(tokenize(src)), p = 0, depth = 0;

    function level(lv) {
      if (lv === 3) return unary();
      var left = level(lv + 1);
      while (p < toks.length && toks[p].t === 'op' && LEVEL[toks[p].op] === lv) {
        var op = toks[p].op; p++;
        var right = level(lv + 1);
        left = { k: 'op', op: op, args: [left, right] };
      }
      return left;
    }
    function unary() {
      var tk = toks[p];
      if (tk && tk.t === 'notp') {
        p++;
        if (++depth > MAXDEPTH) throw new ParseError('err_too_long', { n: MAXLEN });
        var a = unary(); depth--;
        return { k: 'not', a: a };
      }
      var node = primary();
      while (p < toks.length && toks[p].t === 'post') { p++; node = { k: 'not', a: node }; }
      return node;
    }
    function primary() {
      var tk = toks[p];
      if (!tk) throw new ParseError('err_end');
      if (tk.t === 'var') { p++; return { k: 'var', name: tk.name }; }
      if (tk.t === 'const') { p++; return { k: 'const', v: tk.v }; }
      if (tk.t === 'lp') {
        p++;
        if (++depth > MAXDEPTH) throw new ParseError('err_too_long', { n: MAXLEN });
        var e = level(0); depth--;
        if (!toks[p] || toks[p].t !== 'rp') throw new ParseError('err_close', { n: tk.pos + 1 });
        p++;
        return e;
      }
      throw new ParseError('err_operand', { n: tk.pos + 1, ch: tk.raw });
    }
    var tree = level(0);
    if (p < toks.length) {
      var tk = toks[p];
      throw new ParseError(tk.t === 'rp' ? 'err_extra_close' : 'err_operand', { n: tk.pos + 1, ch: tk.raw });
    }
    return flatten(tree);
  }

  /* (A·B)·C → one AND with three inputs. Only for AND, OR, XOR (they are associative). */
  function flatten(n) {
    if (n.k === 'not') return { k: 'not', a: flatten(n.a) };
    if (n.k !== 'op') return n;
    var args = n.args.map(flatten);
    if (n.op === 'and' || n.op === 'or' || n.op === 'xor') {
      var out = [];
      args.forEach(function (a) { if (a.k === 'op' && a.op === n.op) out = out.concat(a.args); else out.push(a); });
      args = out;
    }
    return { k: 'op', op: n.op, args: args };
  }

  function gate(op, ins) {
    var ones = 0;
    for (var i = 0; i < ins.length; i++) ones += ins[i] ? 1 : 0;
    var n = ins.length;
    switch (op) {
      case 'and': return ones === n ? 1 : 0;
      case 'or': return ones > 0 ? 1 : 0;
      case 'xor': return ones % 2;
      case 'nand': return ones === n ? 0 : 1;
      case 'nor': return ones > 0 ? 0 : 1;
      case 'xnor': return 1 - ones % 2;
      case 'not': return ins[0] ? 0 : 1;
    }
    return 0;
  }

  function evaluate(n, env) {
    if (n.k === 'var') return env[n.name] ? 1 : 0;
    if (n.k === 'const') return n.v;
    if (n.k === 'not') return 1 - evaluate(n.a, env);
    return gate(n.op, n.args.map(function (a) { return evaluate(a, env); }));
  }

  function varsOf(n, acc) {
    acc = acc || {};
    if (n.k === 'var') acc[n.name] = 1;
    else if (n.k === 'not') varsOf(n.a, acc);
    else if (n.k === 'op') n.args.forEach(function (a) { varsOf(a, acc); });
    return acc;
  }
  function vars(n) { var acc = varsOf(n); return VARS.filter(function (v) { return acc[v]; }); }

  /* Row i of a truth table → {A:0/1, ...}; the first variable is the most significant bit. */
  function env(vs, i) {
    var e = {};
    for (var k = 0; k < vs.length; k++) e[vs[k]] = (i >> (vs.length - 1 - k)) & 1;
    return e;
  }
  function rowOf(vs, e) {
    var i = 0;
    for (var k = 0; k < vs.length; k++) i = i * 2 + (e[vs[k]] ? 1 : 0);
    return i;
  }
  function column(n, vs) {
    var out = [];
    for (var i = 0; i < (1 << vs.length); i++) out.push(evaluate(n, env(vs, i)));
    return out;
  }

  /* ---------- printers ---------- */
  var BASE = { and: 'and', or: 'or', xor: 'xor', nand: 'and', nor: 'or', xnor: 'xor' };
  var PREC = { or: 1, xor: 2, and: 3 };
  function precOf(n) { return n.k === 'op' && (n.op === 'and' || n.op === 'or' || n.op === 'xor') ? PREC[n.op] : 5; }
  function needParens(child, base) {
    var cp = precOf(child);
    return cp < PREC[base] || (base === 'or' && child.k === 'op' && child.op === 'xor');
  }
  function printer(o) {
    function pr(n) {
      if (n.k === 'var') return o.v(n.name);
      if (n.k === 'const') return o.v(String(n.v));
      if (n.k === 'not') return o.not(pr(n.a), n.a);
      var base = BASE[n.op];
      var parts = n.args.map(function (a) { var s = pr(a); return needParens(a, base) ? o.paren(s) : s; });
      var s = parts.join(o.sym[base]);
      return base === n.op ? s : o.bar(s);
    }
    return pr;
  }
  /* HTML with overbars (NCERT style): Ā, (A·B) with a bar on top for NAND, etc. */
  var html = printer({
    v: function (x) { return x; },
    not: function (s) { return '<span class="ov">' + s + '</span>'; },
    bar: function (s) { return '<span class="ov">' + s + '</span>'; },
    paren: function (s) { return '(' + s + ')'; },
    sym: { and: '·', or: ' + ', xor: ' ⊕ ' }
  });
  /* Plain text with a prime for NOT: (A·B)' + C */
  var text = printer({
    v: function (x) { return x; },
    not: function (s, a) { return (a.k === 'var' || a.k === 'const' || a.k === 'not') ? s + "'" : '(' + s + ")'"; },
    bar: function (s) { return '(' + s + ")'"; },
    paren: function (s) { return '(' + s + ')'; },
    sym: { and: '·', or: ' + ', xor: ' ⊕ ' }
  });

  /* Intermediate columns for a truth table (children first, no repeats, no leaves, not the root). */
  function steps(root, max) {
    var out = [], seen = {};
    (function walk(n) {
      if (n.k === 'not') walk(n.a);
      else if (n.k === 'op') n.args.forEach(walk);
      else return;
      if (n === root) return;
      var key = text(n);
      if (!seen[key]) { seen[key] = 1; out.push(n); }
    })(root);
    return max ? out.slice(0, max) : out;
  }

  function size(n) {
    if (n.k === 'not') return 1 + size(n.a);
    if (n.k === 'op') return n.args.reduce(function (s, a) { return s + size(a); }, 1);
    return 1;
  }

  /* Compare two expressions over all rows of their combined variables. */
  function compare(a, b) {
    var acc = varsOf(a); varsOf(b, acc);
    var vs = VARS.filter(function (v) { return acc[v]; });
    var rows = [], firstBad = -1;
    for (var i = 0; i < (1 << vs.length); i++) {
      var e = env(vs, i), x = evaluate(a, e), y = evaluate(b, e);
      rows.push({ env: e, a: x, b: y });
      if (x !== y && firstBad < 0) firstBad = i;
    }
    return { vars: vs, rows: rows, equal: firstBad < 0, bad: firstBad };
  }

  function gateAst(op, n) {
    var ins = VARS.slice(0, n).map(function (v) { return { k: 'var', name: v }; });
    if (op === 'not') return { k: 'not', a: ins[0] };
    return { k: 'op', op: op, args: ins };
  }

  window.LG_LOGIC = {
    VARS: VARS, ParseError: ParseError, MAXLEN: MAXLEN,
    tokenize: tokenize, parse: parse, evaluate: evaluate, gate: gate, vars: vars,
    env: env, rowOf: rowOf, column: column, html: html, text: text, steps: steps, size: size,
    compare: compare, gateAst: gateAst
  };
})();
