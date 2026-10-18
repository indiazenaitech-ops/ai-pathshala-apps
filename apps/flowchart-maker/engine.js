/* Flowchart & Algorithm Lab: the engine (no DOM). window.FCE
   - expression tokenizer / parser / evaluator (no eval): + - * / // % ** ^, comparisons, and/or/not, strings, True/False,
     a few functions (abs, int, round, sqrt, max, min, str, len)
   - pretty printer for the same expression in CBSE pseudocode style and in Python
   - program model: blocks = [{id, type, ...}], nested lists inside decision (yes/no), while and for (body)
   - pseudocode and Python generators (lists of lines with the block id, for highlighting)
   - Runner: step-by-step execution with a variable table, an output console, input requests and guards
   - layout: top-down flowchart geometry (nodes + edges) for the SVG view
   - clean(): validates a program loaded from storage, a file or a share link
   Values are JS numbers, strings and booleans. Errors are thrown as {key, vars} and shown through EDU.t(key, vars). */
(function () {
  'use strict';

  var MAX_STEPS = 10000;
  var KEYWORDS = { and: 1, or: 1, not: 1, true: 1, false: 1, mod: 1, True: 1, False: 1, AND: 1, OR: 1, NOT: 1, MOD: 1, TRUE: 1, FALSE: 1 };
  var FUNCS = {
    abs: function (a) { return Math.abs(num(a, 'abs')); },
    int: function (a) { if (typeof a === 'string') { var n = toNumber(a); if (n === null) fail('err_type', { op: 'int' }); a = n; } return Math.trunc(num(a, 'int')); },
    round: function (a, d) { var p = Math.pow(10, d === undefined ? 0 : num(d, 'round')); return Math.round(num(a, 'round') * p) / p; },
    sqrt: function (a) { a = num(a, 'sqrt'); if (a < 0) fail('err_type', { op: 'sqrt' }); return Math.sqrt(a); },
    max: function () { return Math.max.apply(null, Array.prototype.map.call(arguments, function (x) { return num(x, 'max'); })); },
    min: function () { return Math.min.apply(null, Array.prototype.map.call(arguments, function (x) { return num(x, 'min'); })); },
    str: function (a) { return fmtValue(a); },
    len: function (a) { return Array.from(fmtValue(a)).length; }
  };
  var IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

  function fail(key, vars) { throw { key: key, vars: vars || {} }; }
  function isNum(v) { return typeof v === 'number'; }
  function num(v, op) {
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (!isNum(v)) fail('err_type', { op: op });
    return v;
  }
  /* "12" -> 12, "7.5" -> 7.5, "abc" -> null */
  function toNumber(s) {
    s = String(s).trim();
    if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
    var n = Number(s);
    return isFinite(n) ? n : null;
  }
  function fmtValue(v) {
    if (typeof v === 'boolean') return v ? 'True' : 'False';
    if (isNum(v)) {
      if (!isFinite(v)) return String(v);
      var r = parseFloat(v.toPrecision(12));
      return String(r);
    }
    return String(v == null ? '' : v);
  }
  function truthy(v) { return typeof v === 'string' ? v.length > 0 : !!v; }

  /* ------------------------------------------------------------------ tokenizer */
  function tokenize(src) {
    var toks = [], i = 0, s = String(src), m;
    var re = /\s*(?:(\d+\.?\d*|\.\d+)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|([A-Za-z_][A-Za-z0-9_]*)|(\*\*|\/\/|==|!=|<>|<=|>=|≤|≥|≠|[-+*\/%^<>=(),×÷]))/y;
    while (i < s.length) {
      re.lastIndex = i;
      m = re.exec(s);
      if (!m || m[0] === '') {
        var rest = s.slice(i).trim();
        if (!rest) break;
        fail('err_syntax', { x: rest.slice(0, 12) });
      }
      i = re.lastIndex;
      if (m[1] !== undefined) toks.push({ t: 'num', v: Number(m[1]) });
      else if (m[2] !== undefined) toks.push({ t: 'str', v: m[2].slice(1, -1).replace(/\\(.)/g, '$1') });
      else if (m[3] !== undefined) {
        var w = m[3], lw = w.toLowerCase();
        if (lw === 'and' || lw === 'or' || lw === 'not' || lw === 'mod') toks.push({ t: 'op', v: lw });
        else if (lw === 'true' || lw === 'false') toks.push({ t: 'bool', v: lw === 'true' });
        else toks.push({ t: 'id', v: w });
      } else {
        var op = m[4];
        if (op === '×') op = '*'; else if (op === '÷') op = '/'; else if (op === '^') op = '**';
        else if (op === '<>' || op === '≠') op = '!='; else if (op === '≤') op = '<='; else if (op === '≥') op = '>=';
        else if (op === '=') op = '==';
        toks.push({ t: 'op', v: op });
      }
    }
    return toks;
  }

  /* ------------------------------------------------------------------ parser (recursive descent -> AST) */
  var PREC = { or: 1, and: 2, not: 3, cmp: 4, add: 5, mul: 6, unary: 7, pow: 8, atom: 9 };
  function Parser(toks) { this.toks = toks; this.i = 0; }
  Parser.prototype.peek = function () { return this.toks[this.i]; };
  Parser.prototype.isOp = function (v) { var p = this.peek(); return p && p.t === 'op' && p.v === v; };
  Parser.prototype.next = function () { return this.toks[this.i++]; };
  Parser.prototype.expect = function (v) { if (!this.isOp(v)) this.err(); this.i++; };
  Parser.prototype.err = function () {
    var p = this.peek();
    fail('err_syntax', { x: p ? (p.t === 'str' ? '"' + p.v + '"' : String(p.v)) : '…' });
  };
  Parser.prototype.parseList = function () {           /* expr (, expr)*  for PRINT */
    var list = [];
    if (!this.peek()) return list;
    list.push(this.expr());
    while (this.isOp(',')) { this.i++; list.push(this.expr()); }
    if (this.peek()) this.err();
    return list;
  };
  Parser.prototype.parseOne = function () {
    if (!this.peek()) fail('err_syntax', { x: '…' });
    var e = this.expr();
    if (this.peek()) this.err();
    return e;
  };
  Parser.prototype.expr = function () { return this.or(); };
  Parser.prototype.or = function () {
    var l = this.and();
    while (this.isOp('or')) { this.i++; l = { k: 'bin', op: 'or', l: l, r: this.and() }; }
    return l;
  };
  Parser.prototype.and = function () {
    var l = this.not();
    while (this.isOp('and')) { this.i++; l = { k: 'bin', op: 'and', l: l, r: this.not() }; }
    return l;
  };
  Parser.prototype.not = function () {
    if (this.isOp('not')) { this.i++; return { k: 'un', op: 'not', e: this.not() }; }
    return this.cmp();
  };
  Parser.prototype.cmp = function () {
    var l = this.add(), ops = ['==', '!=', '<', '<=', '>', '>='];
    while (this.peek() && this.peek().t === 'op' && ops.indexOf(this.peek().v) >= 0) {
      var op = this.next().v;
      l = { k: 'bin', op: op, l: l, r: this.add() };
    }
    return l;
  };
  Parser.prototype.add = function () {
    var l = this.mul();
    while (this.isOp('+') || this.isOp('-')) { var op = this.next().v; l = { k: 'bin', op: op, l: l, r: this.mul() }; }
    return l;
  };
  Parser.prototype.mul = function () {
    var l = this.unary();
    while (this.isOp('*') || this.isOp('/') || this.isOp('//') || this.isOp('%') || this.isOp('mod')) {
      var op = this.next().v; if (op === 'mod') op = '%';
      l = { k: 'bin', op: op, l: l, r: this.unary() };
    }
    return l;
  };
  Parser.prototype.unary = function () {
    if (this.isOp('-')) { this.i++; return { k: 'un', op: '-', e: this.unary() }; }
    if (this.isOp('+')) { this.i++; return this.unary(); }
    return this.pow();
  };
  Parser.prototype.pow = function () {
    var b = this.atom();
    if (this.isOp('**')) { this.i++; return { k: 'bin', op: '**', l: b, r: this.unary() }; }
    return b;
  };
  Parser.prototype.atom = function () {
    var p = this.next();
    if (!p) fail('err_syntax', { x: '…' });
    if (p.t === 'num') return { k: 'num', v: p.v };
    if (p.t === 'str') return { k: 'str', v: p.v };
    if (p.t === 'bool') return { k: 'bool', v: p.v };
    if (p.t === 'id') {
      if (this.isOp('(')) {
        this.i++;
        var args = [];
        if (!this.isOp(')')) { args.push(this.expr()); while (this.isOp(',')) { this.i++; args.push(this.expr()); } }
        this.expect(')');
        return { k: 'call', f: p.v, args: args };
      }
      return { k: 'var', v: p.v };
    }
    if (p.t === 'op' && p.v === '(') { var e = this.expr(); this.expect(')'); return { k: 'par', e: e }; }
    this.i--; this.err();
  };

  var astCache = {};
  function parseExpr(src) {
    var key = 'e:' + src;
    if (astCache[key]) return astCache[key];
    var ast = new Parser(tokenize(src)).parseOne();
    astCache[key] = ast; return ast;
  }
  function parseList(src) {
    var key = 'l:' + src;
    if (astCache[key]) return astCache[key];
    var list = new Parser(tokenize(src)).parseList();
    astCache[key] = list; return list;
  }

  /* ------------------------------------------------------------------ evaluator */
  function evalAst(n, vars) {
    switch (n.k) {
      case 'num': case 'str': case 'bool': return n.v;
      case 'par': return evalAst(n.e, vars);
      case 'var':
        if (!Object.prototype.hasOwnProperty.call(vars, n.v)) fail('err_unknown_var', { v: n.v });
        return vars[n.v];
      case 'call': {
        var f = FUNCS[n.f.toLowerCase()];
        if (!f) fail('err_fn', { f: n.f });
        return f.apply(null, n.args.map(function (a) { return evalAst(a, vars); }));
      }
      case 'un': {
        var v = evalAst(n.e, vars);
        if (n.op === 'not') return !truthy(v);
        return -num(v, '-');
      }
      case 'bin': {
        if (n.op === 'and') { var a = evalAst(n.l, vars); return truthy(a) ? evalAst(n.r, vars) : a; }
        if (n.op === 'or') { var o = evalAst(n.l, vars); return truthy(o) ? o : evalAst(n.r, vars); }
        var l = evalAst(n.l, vars), r = evalAst(n.r, vars);
        return binop(n.op, l, r);
      }
    }
    fail('err_syntax', { x: '?' });
  }
  function binop(op, l, r) {
    var ls = typeof l === 'string', rs = typeof r === 'string';
    switch (op) {
      case '+':
        if (ls || rs) return fmtValue(l) + fmtValue(r);
        return num(l, '+') + num(r, '+');
      case '-': return num(l, '-') - num(r, '-');
      case '*':
        if (ls && !rs) return repeat(l, r); if (rs && !ls) return repeat(r, l);
        return num(l, '*') * num(r, '*');
      case '/': { var d = num(r, '/'); if (d === 0) fail('err_div_zero'); return num(l, '/') / d; }
      case '//': { var d2 = num(r, '//'); if (d2 === 0) fail('err_div_zero'); return Math.floor(num(l, '//') / d2); }
      case '%': { var d3 = num(r, '%'); if (d3 === 0) fail('err_div_zero'); var a = num(l, '%'); return ((a % d3) + d3) % d3; }
      case '**': return Math.pow(num(l, '**'), num(r, '**'));
      case '==': return eq(l, r);
      case '!=': return !eq(l, r);
      case '<': case '<=': case '>': case '>=': {
        var c;
        if (ls && rs) c = l < r ? -1 : l > r ? 1 : 0;
        else if (ls || rs) fail('err_type', { op: op });
        else { var x = num(l, op), y = num(r, op); c = x < y ? -1 : x > y ? 1 : 0; }
        return op === '<' ? c < 0 : op === '<=' ? c <= 0 : op === '>' ? c > 0 : c >= 0;
      }
    }
    fail('err_syntax', { x: op });
  }
  function repeat(s, n) { n = Math.trunc(num(n, '*')); if (n > 10000) fail('err_type', { op: '*' }); var out = ''; for (var i = 0; i < n; i++) out += s; return out; }
  function eq(l, r) {
    if (typeof l === 'string' || typeof r === 'string') return typeof l === typeof r && l === r;
    return num(l, '==') === num(r, '==');
  }
  function evalExpr(src, vars) { return evalAst(typeof src === 'string' ? parseExpr(src) : src, vars); }

  /* ------------------------------------------------------------------ pretty printer */
  function prec(n) {
    if (n.k === 'bin') return n.op === 'or' ? 1 : n.op === 'and' ? 2 : /^(==|!=|<|<=|>|>=)$/.test(n.op) ? 4 : /^[+-]$/.test(n.op) ? 5 : n.op === '**' ? 8 : 6;
    if (n.k === 'un') return n.op === 'not' ? 3 : 7;
    return 9;
  }
  function quote(s) { return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'; }
  /* style: 'py' (Python) or 'pseudo' (CBSE pseudocode: MOD, ^, AND/OR/NOT, TRUE/FALSE) */
  function fmtAst(n, style) {
    var py = style === 'py';
    switch (n.k) {
      case 'num': return fmtValue(n.v);
      case 'str': return quote(n.v);
      case 'bool': return py ? (n.v ? 'True' : 'False') : (n.v ? 'TRUE' : 'FALSE');
      case 'var': return n.v;
      case 'par': return '(' + fmtAst(n.e, style) + ')';
      case 'call': return n.f + '(' + n.args.map(function (a) { return fmtAst(a, style); }).join(', ') + ')';
      case 'un': {
        var inner = fmtAst(n.e, style);
        if (prec(n.e) < prec(n)) inner = '(' + inner + ')';
        return n.op === 'not' ? (py ? 'not ' : 'NOT ') + inner : '-' + inner;
      }
      case 'bin': {
        var p = prec(n), l = fmtAst(n.l, style), r = fmtAst(n.r, style);
        var right = n.op === '**';
        if (prec(n.l) < p || (prec(n.l) === p && right)) l = '(' + l + ')';
        if (prec(n.r) < p || (prec(n.r) === p && !right)) r = '(' + r + ')';
        var op = n.op;
        if (!py) { if (op === '%') op = 'MOD'; else if (op === '**') op = '^'; else if (op === 'and') op = 'AND'; else if (op === 'or') op = 'OR'; }
        return l + ' ' + op + ' ' + r;
      }
    }
    return '';
  }
  /* format a user expression; if it does not parse, return the raw text */
  function fmtExpr(src, style) { try { return fmtAst(parseExpr(src), style); } catch (e) { return String(src); } }
  function fmtList(src, style) {
    try { return parseList(src).map(function (a) { return fmtAst(a, style); }).join(', '); } catch (e) { return String(src); }
  }
  /* a literal number / string / boolean (used to choose SET vs COMPUTE, and to fold "n + 1" in range()) */
  function literalOf(src) {
    try { var a = parseExpr(src); if (a.k === 'num' || a.k === 'str' || a.k === 'bool') return a; if (a.k === 'un' && a.op === '-' && a.e.k === 'num') return { k: 'num', v: -a.e.v }; } catch (e) { }
    return null;
  }

  /* ------------------------------------------------------------------ program model */
  var TYPES = ['input', 'output', 'process', 'decision', 'while', 'for'];
  var idCounter = 0;
  function newId() { idCounter++; return 'b' + idCounter; }
  function children(b) {
    if (b.type === 'decision') return [['yes', b.yes], ['no', b.no]];
    if (b.type === 'while' || b.type === 'for') return [['body', b.body]];
    return [];
  }
  function walk(list, fn, depth) {
    depth = depth || 0;
    list.forEach(function (b, i) {
      fn(b, list, i, depth);
      children(b).forEach(function (c) { walk(c[1], fn, depth + 1); });
    });
  }
  function find(program, id) {
    var hit = null;
    walk(program.blocks, function (b, list, i) { if (!hit && b.id === id) hit = { block: b, list: list, index: i }; });
    return hit;
  }
  function count(program) { var n = 0; walk(program.blocks, function () { n++; }); return n; }
  function renumber(program) { walk(program.blocks, function (b) { b.id = newId(); }); return program; }

  function str(v, max) { return typeof v === 'string' ? v.slice(0, max || 200) : (v === undefined || v === null ? '' : String(v).slice(0, max || 200)); }
  function cleanList(list, depth) {
    if (!Array.isArray(list) || depth > 12) return [];
    var out = [];
    list.forEach(function (b) {
      if (out.length >= 400 || !b || typeof b !== 'object' || TYPES.indexOf(b.type) < 0) return;
      var c = { id: newId(), type: b.type };
      switch (b.type) {
        case 'input': if (!IDENT.test(str(b.var)) || KEYWORDS[str(b.var)]) return; c.var = str(b.var, 40); c.prompt = str(b.prompt, 120); break;
        case 'output': c.expr = str(b.expr); break;
        case 'process': if (!IDENT.test(str(b.var)) || KEYWORDS[str(b.var)]) return; c.var = str(b.var, 40); c.expr = str(b.expr); break;
        case 'decision': c.cond = str(b.cond); c.yes = cleanList(b.yes, depth + 1); c.no = cleanList(b.no, depth + 1); break;
        case 'while': c.cond = str(b.cond); c.body = cleanList(b.body, depth + 1); break;
        case 'for':
          if (!IDENT.test(str(b.var)) || KEYWORDS[str(b.var)]) return;
          c.var = str(b.var, 40); c.from = str(b.from, 60) || '1'; c.to = str(b.to, 60) || '10'; c.step = str(b.step, 60) || '1'; c.body = cleanList(b.body, depth + 1); break;
      }
      out.push(c);
    });
    return out;
  }
  /* Accepts anything (storage, a JSON file, a share link) and returns a safe program or null. */
  function clean(p) {
    if (!p || typeof p !== 'object') return null;
    if (!Array.isArray(p.blocks)) return null;
    var inputs = Array.isArray(p.inputs) ? p.inputs.slice(0, 50).map(function (v) { return str(v, 80); }) : [];
    return { name: str(p.name, 60), blocks: cleanList(p.blocks, 0), inputs: inputs };
  }
  function clone(p) { return JSON.parse(JSON.stringify(p)); }

  /* ------------------------------------------------------------------ code generators */
  /* returns [{id, depth, text}]; id 'start' / 'end' for the terminals */
  function pseudocode(program) {
    var lines = [];
    var push = function (id, d, text) { lines.push({ id: id, depth: d, text: text }); };
    push('start', 0, 'START');
    (function gen(list, d) {
      list.forEach(function (b) {
        switch (b.type) {
          case 'input': push(b.id, d, (b.prompt ? 'PRINT ' + quote(b.prompt) + '\n' + pad(d) : '') + 'INPUT ' + b.var); break;
          case 'output': push(b.id, d, 'PRINT ' + fmtList(b.expr, 'pseudo')); break;
          case 'process': push(b.id, d, (literalOf(b.expr) ? 'SET ' : 'COMPUTE ') + b.var + ' = ' + fmtExpr(b.expr, 'pseudo')); break;
          case 'decision':
            push(b.id, d, 'IF ' + fmtExpr(b.cond, 'pseudo') + ' THEN');
            gen(b.yes, d + 1);
            if (b.no.length) { push(b.id + ':else', d, 'ELSE'); gen(b.no, d + 1); }
            push(b.id + ':end', d, 'END IF');
            break;
          case 'while':
            push(b.id, d, 'WHILE ' + fmtExpr(b.cond, 'pseudo') + ' DO');
            gen(b.body, d + 1);
            push(b.id + ':end', d, 'END WHILE');
            break;
          case 'for':
            push(b.id, d, 'FOR ' + b.var + ' = ' + fmtExpr(b.from, 'pseudo') + ' TO ' + fmtExpr(b.to, 'pseudo') + (isOne(b.step) ? '' : ' STEP ' + fmtExpr(b.step, 'pseudo')) + ' DO');
            gen(b.body, d + 1);
            push(b.id + ':end', d, 'END FOR');
            break;
        }
      });
    })(program.blocks, 0);
    push('end', 0, 'END');
    return lines;
  }
  function pad(d) { var s = ''; for (var i = 0; i < d; i++) s += '    '; return s; }
  function isOne(src) { var l = literalOf(src); return !!l && l.k === 'num' && l.v === 1; }
  function rangeEnd(to, step) {
    /* Python range() stops before the end, so an inclusive "TO n" becomes n + 1 (or n - 1 counting down) */
    var l = literalOf(to), s = literalOf(step), down = s && s.k === 'num' && s.v < 0;
    if (l && l.k === 'num') return fmtValue(l.v + (down ? -1 : 1));
    var t = fmtExpr(to, 'py');
    try { var a = parseExpr(to); if (prec(a) < 5) t = '(' + t + ')'; } catch (e) { }
    return t + (down ? ' - 1' : ' + 1');
  }
  function python(program, opts) {
    opts = opts || {};
    var lines = [], hasInput = false;
    walk(program.blocks, function (b) { if (b.type === 'input') hasInput = true; });
    var push = function (id, d, text) { lines.push({ id: id, depth: d, text: text }); };
    if (hasInput && opts.note) push('note', 0, '# ' + opts.note);
    (function gen(list, d) {
      if (!list.length) { push(null, d, 'pass'); return; }
      list.forEach(function (b) {
        switch (b.type) {
          case 'input': push(b.id, d, b.var + ' = int(input(' + (b.prompt ? quote(b.prompt + ' ') : '') + '))'); break;
          case 'output': push(b.id, d, 'print(' + fmtList(b.expr, 'py') + ')'); break;
          case 'process': push(b.id, d, b.var + ' = ' + fmtExpr(b.expr, 'py')); break;
          case 'decision':
            push(b.id, d, 'if ' + fmtExpr(b.cond, 'py') + ':');
            gen(b.yes, d + 1);
            if (b.no.length) { push(b.id + ':else', d, 'else:'); gen(b.no, d + 1); }
            break;
          case 'while':
            push(b.id, d, 'while ' + fmtExpr(b.cond, 'py') + ':');
            gen(b.body, d + 1);
            break;
          case 'for':
            push(b.id, d, 'for ' + b.var + ' in range(' + fmtExpr(b.from, 'py') + ', ' + rangeEnd(b.to, b.step) + (isOne(b.step) ? '' : ', ' + fmtExpr(b.step, 'py')) + '):');
            gen(b.body, d + 1);
            break;
        }
      });
    })(program.blocks, 0);
    if (!program.blocks.length) lines = [];
    return lines;
  }
  function linesToText(lines) { return lines.map(function (l) { return pad(l.depth) + l.text; }).join('\n'); }

  /* ------------------------------------------------------------------ runner */
  /* new FCE.Runner(program, { inputs: ['12', '8'] })
     r.step() -> state; r.provide(text) when state.status === 'input'; r.runAll(limit)
     state: { status: 'ready'|'input'|'done'|'error', current: id|'start'|'end'|null, vars, output[], steps, trace[], error, prompt, inputVar, changed } */
  function Runner(program, opts) {
    opts = opts || {};
    this.program = program;
    this.inputs = (opts.inputs || []).slice();
    this.inputIndex = 0;
    this.max = opts.maxSteps || MAX_STEPS;
    this.frames = [{ blocks: program.blocks, i: 0, loop: null }];
    this.started = false;
    this.status = 'ready';
    this.current = null;
    this.vars = {};
    this.varOrder = [];
    this.output = [];
    this.steps = 0;
    this.trace = [];
    this.error = null;
    this.prompt = ''; this.inputVar = ''; this.changed = null;
    this.pending = null;
  }
  Runner.prototype.assign = function (name, v) {
    if (this.varOrder.indexOf(name) < 0) this.varOrder.push(name);
    this.vars[name] = v; this.changed = name;
  };
  Runner.prototype.snapshot = function () {
    var o = {}, self = this;
    this.varOrder.forEach(function (k) { o[k] = self.vars[k]; });
    return o;
  };
  Runner.prototype.record = function (id, text, out, note) {
    this.steps++;
    this.trace.push({ n: this.steps, id: id, text: text, vars: this.snapshot(), out: out || '', note: note || '' });
  };
  Runner.prototype.fail = function (id, e) {
    this.status = 'error'; this.current = id;
    this.error = e && e.key ? e : { key: 'err_syntax', vars: { x: '?' } };
    this.record(id, lineText(this.program, id), '', 'error');
  };
  Runner.prototype.active = function () { return this.status === 'ready'; };
  Runner.prototype.step = function () {
    if (!this.active()) return this;
    this.changed = null;
    if (!this.started) { this.started = true; this.current = 'start'; this.record('start', 'START'); return this; }
    if (this.steps >= this.max) { this.fail(this.current, { key: 'err_infinite', vars: { n: this.max } }); return this; }
    var f, b;
    for (;;) {
      f = this.frames[this.frames.length - 1];
      if (f.i >= f.blocks.length) {
        if (f.loop) {                                  /* the loop body finished: test the loop again */
          var again;
          try { again = this.loopAgain(f); } catch (e) { this.fail(f.loop.id, e); return this; }
          this.current = f.loop.id;
          if (again) { f.i = 0; this.record(f.loop.id, lineText(this.program, f.loop.id), '', 'yes'); return this; }
          this.frames.pop(); this.frames[this.frames.length - 1].i++;
          this.record(f.loop.id, lineText(this.program, f.loop.id), '', 'no');
          return this;
        }
        if (this.frames.length === 1) { this.status = 'done'; this.current = 'end'; this.record('end', 'END'); return this; }
        this.frames.pop(); this.frames[this.frames.length - 1].i++;
        continue;
      }
      break;
    }
    b = f.blocks[f.i];
    this.current = b.id;
    try {
      switch (b.type) {
        case 'input': {
          var v = this.nextInput();
          if (v === null) {
            this.status = 'input'; this.prompt = b.prompt || ''; this.inputVar = b.var; this.pending = { frame: f, block: b };
            return this;
          }
          this.assign(b.var, v); f.i++;
          this.record(b.id, lineText(this.program, b.id), '', 'in:' + fmtValue(v));
          return this;
        }
        case 'output': {
          var line = parseList(b.expr).map(function (a) { return fmtValue(evalAst(a, this.vars)); }, this).join(' ');
          this.output.push(line); f.i++;
          this.record(b.id, lineText(this.program, b.id), line);
          return this;
        }
        case 'process': {
          var val = evalExpr(b.expr, this.vars);
          this.assign(b.var, val); f.i++;
          this.record(b.id, lineText(this.program, b.id));
          return this;
        }
        case 'decision': {
          var c = truthy(evalExpr(b.cond, this.vars));
          this.frames.push({ blocks: c ? b.yes : b.no, i: 0, loop: null });
          this.record(b.id, lineText(this.program, b.id), '', c ? 'yes' : 'no');
          return this;
        }
        case 'while': {
          var w = truthy(evalExpr(b.cond, this.vars));
          if (w) this.frames.push({ blocks: b.body, i: 0, loop: b }); else f.i++;
          this.record(b.id, lineText(this.program, b.id), '', w ? 'yes' : 'no');
          return this;
        }
        case 'for': {
          var from = num(evalExpr(b.from, this.vars), 'for'), to = num(evalExpr(b.to, this.vars), 'for'), st = num(evalExpr(b.step, this.vars), 'for');
          if (st === 0) fail('err_step_zero');
          this.assign(b.var, from);
          var go = st > 0 ? from <= to : from >= to;
          if (go) this.frames.push({ blocks: b.body, i: 0, loop: b, to: to, st: st }); else f.i++;
          this.record(b.id, lineText(this.program, b.id), '', go ? 'yes' : 'no');
          return this;
        }
      }
    } catch (e) { this.fail(b.id, e); return this; }
    f.i++;
    return this;
  };
  Runner.prototype.loopAgain = function (f) {
    var b = f.loop;
    if (b.type === 'while') return truthy(evalExpr(b.cond, this.vars));
    /* like Python's range(): the counter keeps its last used value after the loop (i = 5 after FOR i = 1 TO 5) */
    var v = num(this.vars[b.var], 'for') + f.st;
    var go = f.st > 0 ? v <= f.to : v >= f.to;
    if (go) this.assign(b.var, v);
    return go;
  };
  Runner.prototype.nextInput = function () {
    while (this.inputIndex < this.inputs.length) {
      var raw = this.inputs[this.inputIndex++];
      if (raw === undefined || raw === null) continue;
      return convertInput(raw);
    }
    return null;
  };
  Runner.prototype.provide = function (text) {
    if (this.status !== 'input' || !this.pending) return this;
    var p = this.pending, v = convertInput(text);
    this.pending = null; this.status = 'ready'; this.changed = null;
    this.assign(p.block.var, v); p.frame.i++;
    this.record(p.block.id, lineText(this.program, p.block.id), '', 'in:' + fmtValue(v));
    return this;
  };
  Runner.prototype.runAll = function (limit) {
    var n = 0, lim = limit || this.max + 5;
    while (this.active() && n < lim) { this.step(); n++; }
    return this;
  };
  function convertInput(raw) {
    var s = String(raw).trim(), n = toNumber(s);
    if (n !== null) return n;
    var low = s.toLowerCase();
    if (low === 'true') return true;
    if (low === 'false') return false;
    return s;
  }
  var lineCache = { p: null, map: null };
  function lineText(program, id) {
    if (lineCache.p !== program) {
      lineCache.p = program; lineCache.map = {};
      pseudocode(program).forEach(function (l) { if (!(l.id in lineCache.map)) lineCache.map[l.id] = l.text.replace(/\n\s*/g, ' · '); });
    }
    return lineCache.map[id] || '';
  }

  /* ------------------------------------------------------------------ flowchart layout */
  /* layout(program, { measure: fn(text) -> px, labels: {start, end, yes, no, input(v), output(e), while(c), for(v,a,b,s)} })
     -> { width, height, nodes: [{id, kind, x, y, w, h, lines[]}], edges: [{pts: [[x,y],...], label, side}] }
     Top-down. A decision opens two columns (Yes on the start side, No on the other), loops put the body below the
     test with a back arrow on the start side and the exit on the other side. */
  var NW_MIN = 120, NW_MAX = 280, NH = 46, NH2 = 64, GAP = 30, HGAP = 36, FONT = 14, LINE = 18, PAD = 18;
  function layout(program, opts) {
    var measure = opts.measure, L = opts.labels;
    var nodes = [], edges = [];

    function fit(text, maxW) {                /* wrap into at most 2 lines, ellipsis on the second */
      text = String(text);
      if (measure(text) <= maxW) return [text];
      var words = text.split(' '), l1 = '', l2 = '';
      var ell = '…';
      /* first line: as many words as fit (or a hard cut) */
      for (var i = 0; i < words.length; i++) {
        var cand = l1 ? l1 + ' ' + words[i] : words[i];
        if (measure(cand) <= maxW) l1 = cand; else break;
      }
      if (!l1) { l1 = hardCut(words[0], maxW, ''); i = 0; words[0] = words[0].slice(l1.length); }
      l2 = words.slice(i).join(' ').trim();
      if (measure(l2) > maxW) l2 = hardCut(l2, maxW, ell) + ell;
      return [l1, l2];
    }
    function hardCut(s, maxW, suffix) {
      var chars = Array.from(s), out = '';
      for (var i = 0; i < chars.length; i++) { if (measure(out + chars[i] + suffix) > maxW) break; out += chars[i]; }
      return out;
    }
    function box(kind, id, text) {             /* rectangle-like node: size from the text */
      var extra = kind === 'io' ? 16 : 0;
      var lines = fit(text, NW_MAX - 2 * PAD - extra);
      var tw = Math.max.apply(null, lines.map(measure));
      var w = Math.max(NW_MIN, Math.min(NW_MAX, tw + 2 * PAD + extra));
      if (kind === 'term') w = Math.max(100, Math.min(NW_MAX, tw + 2 * PAD + 10));
      return { id: id, kind: kind, lines: lines, w: w, h: lines.length > 1 ? NH2 : NH };
    }
    function diamond(kind, id, text) {         /* decision: the inscribed rectangle is half the width/height */
      var lines = fit(text, 170);
      var tw = Math.max.apply(null, lines.map(measure));
      var w = Math.max(150, Math.min(380, tw * 2 + 36));
      var h = Math.max(lines.length > 1 ? 86 : 68, Math.round(w * 0.42));
      if (kind === 'loop') { w = Math.max(150, Math.min(360, tw + 2 * PAD + 2 * 22)); h = lines.length > 1 ? 68 : 50; }
      return { id: id, kind: kind, lines: lines, w: w, h: h };
    }

    /* measure pass: extents of each list (left/right of its centre line) and heights */
    function ext(list) {
      var left = 0, right = 0, h = 0;
      list.forEach(function (b, i) {
        var e = blockExt(b);
        left = Math.max(left, e.left); right = Math.max(right, e.right);
        h += e.h + (i ? GAP : 0);
      });
      return { left: left, right: right, h: h };
    }
    function blockExt(b) {
      var n;
      switch (b.type) {
        case 'input': n = box('io', b.id, L.input(b)); break;
        case 'output': n = box('io', b.id, L.output(b)); break;
        case 'process': n = box('proc', b.id, L.process(b)); break;
        case 'decision': {
          n = diamond('dec', b.id, L.decision(b));
          var ey = ext(b.yes), en = ext(b.no);
          /* distance from the centre line to the Yes column (start side) and the No column (other side) */
          var offY = Math.max(n.w / 2 + HGAP + ey.right, n.w / 2 + 24);
          var offN = Math.max(n.w / 2 + HGAP + en.left, n.w / 2 + 24);
          var innerH = Math.max(ey.h, en.h);
          b._l = { node: n, offY: offY, offN: offN, ey: ey, en: en, innerH: innerH };
          return { left: offY + ey.left, right: offN + en.right, h: n.h + GAP + innerH + GAP + 10 };
        }
        case 'while': case 'for': {
          n = diamond(b.type === 'while' ? 'dec' : 'loop', b.id, b.type === 'while' ? L.whileLbl(b) : L.forLbl(b));
          var eb = ext(b.body);
          var backX = Math.max(n.w / 2, eb.left) + HGAP;      /* back arrow lane on the start side */
          var exitX = Math.max(n.w / 2, eb.right) + HGAP;     /* exit lane on the other side */
          b._l = { node: n, eb: eb, backX: backX, exitX: exitX };
          return { left: backX, right: exitX, h: n.h + GAP + (eb.h || 0) + GAP + 14 + GAP };
        }
      }
      b._l = { node: n };
      return { left: n.w / 2, right: n.w / 2, h: n.h };
    }

    /* place pass */
    function place(list, cx, y) {              /* returns the y where the next thing starts (an arrow comes down to it) */
      list.forEach(function (b, i) {
        if (i) { edge([[cx, y - GAP], [cx, y]]); }
        y = placeBlock(b, cx, y);
        y += GAP;
      });
      return y - GAP;
    }
    function node(n, cx, y) { n.x = cx; n.y = y; nodes.push(n); return n; }
    function edge(pts, label, side) { edges.push({ pts: pts, label: label || '', side: side || '' }); }
    function placeBlock(b, cx, y) {
      var l = b._l, n = l.node;
      switch (b.type) {
        case 'decision': {
          node(n, cx, y);
          var yTop = y + n.h + GAP;
          var xY = cx - l.offY, xN = cx + l.offN;
          var cornerY = y + n.h / 2;
          var merge = y + n.h + GAP + l.innerH + GAP;
          /* Yes: out of the start-side corner, No: out of the other corner. An empty branch is one line
             straight down to the merge point (no arrow head pointing at nothing). */
          [['yes', b.yes, xY, cx - n.w / 2, L.yes], ['no', b.no, xN, cx + n.w / 2, L.no]].forEach(function (br) {
            var side = br[0], list = br[1], x = br[2], x0 = br[3], label = br[4];
            if (!list.length) { edges.push({ pts: [[x0, cornerY], [x, cornerY], [x, merge], [cx, merge]], label: label, side: side, arrow: false }); return; }
            edge([[x0, cornerY], [x, cornerY], [x, yTop]], label, side);
            var endB = place(list, x, yTop);
            edges.push({ pts: [[x, endB], [x, merge], [cx, merge]], label: '', side: 'merge', arrow: false });
          });
          /* a tiny stub below the merge point so the next arrow starts from the centre */
          nodes.push({ id: b.id + ':merge', kind: 'dot', x: cx, y: merge, w: 0, h: 0, lines: [] });
          return merge + 10;
        }
        case 'while': case 'for': {
          node(n, cx, y);
          var top = y + n.h + GAP, bodyH = l.eb.h;
          var backX = cx - l.backX, exitX = cx + l.exitX;
          var bottom = top + bodyH;
          /* yes: straight down into the body */
          edge([[cx, y + n.h], [cx, top]], L.yes, 'yes');
          var endBody = b.body.length ? place(b.body, cx, top) : top;
          if (!b.body.length) { bottom = top + 8; endBody = top; }
          /* back arrow: down a little, over to the start side, up to the test, into its side */
          var loopY = (b.body.length ? endBody : top) + GAP;
          var inY = y + n.h / 2;
          edge([[cx, b.body.length ? endBody : top], [cx, loopY], [backX, loopY], [backX, inY], [cx - n.w / 2, inY]], '', 'back');
          /* exit: out of the other side, down past the body, back to the centre */
          var exitY = loopY + GAP;
          edge([[cx + n.w / 2, inY], [exitX, inY], [exitX, exitY], [cx, exitY]], L.no, 'no');
          nodes.push({ id: b.id + ':merge', kind: 'dot', x: cx, y: exitY, w: 0, h: 0, lines: [] });
          return exitY + 14;
        }
        default:
          node(n, cx, y);
          return y + n.h;
      }
    }

    var e = ext(program.blocks);
    var start = box('term', 'start', L.start), end = box('term', 'end', L.end);
    var left = Math.max(e.left, start.w / 2, end.w / 2) + 24, right = Math.max(e.right, start.w / 2, end.w / 2) + 24;
    var cx = left, y = 20;
    node(start, cx, y); y += start.h;
    edge([[cx, y], [cx, y + GAP]]); y += GAP;
    if (program.blocks.length) { y = place(program.blocks, cx, y); edge([[cx, y], [cx, y + GAP]]); y += GAP; }
    node(end, cx, y); y += end.h;
    /* ids get an arrow head only where a line ends on a node or a merge point (not at a merge join) */
    return { width: Math.round(left + right), height: Math.round(y + 20), nodes: nodes, edges: edges };
  }

  window.FCE = {
    MAX_STEPS: MAX_STEPS, TYPES: TYPES, IDENT: IDENT, KEYWORDS: KEYWORDS,
    tokenize: tokenize, parseExpr: parseExpr, parseList: parseList, evalExpr: evalExpr, evalAst: evalAst,
    fmtExpr: fmtExpr, fmtList: fmtList, fmtValue: fmtValue, literalOf: literalOf, convertInput: convertInput,
    newId: newId, walk: walk, find: find, count: count, children: children, renumber: renumber, clean: clean, clone: clone,
    pseudocode: pseudocode, python: python, linesToText: linesToText, lineText: lineText,
    Runner: Runner, layout: layout,
    validIdent: function (s) { return IDENT.test(String(s)) && !KEYWORDS[String(s)]; },
    checkExpr: function (src) { try { parseExpr(src); return null; } catch (e) { return e; } },
    checkList: function (src) { try { parseList(src); return null; } catch (e) { return e; } }
  };
})();
