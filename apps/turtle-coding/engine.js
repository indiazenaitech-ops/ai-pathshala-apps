/* Turtle Coding engine: program model, text parser / printer, compiler, turtle geometry
   and the "did you draw the shape?" checker. No DOM here, so it is easy to test. */
(function (root) {
  'use strict';

  /* Block types. num = has a number; color = has a colour; int = whole numbers only. */
  var TYPES = {
    fd:     { kw: 'forward', cat: 'move', num: true, def: 50, min: -1000, max: 1000 },
    bk:     { kw: 'back',    cat: 'move', num: true, def: 50, min: -1000, max: 1000 },
    rt:     { kw: 'right',   cat: 'turn', num: true, def: 90, min: -3600, max: 3600 },
    lt:     { kw: 'left',    cat: 'turn', num: true, def: 90, min: -3600, max: 3600 },
    repeat: { kw: 'repeat',  cat: 'loop', num: true, def: 4, min: 0, max: 500, int: true },
    pu:     { kw: 'penup',   cat: 'pen' },
    pd:     { kw: 'pendown', cat: 'pen' },
    color:  { kw: 'color',   cat: 'pen', color: true, def: 'red' },
    width:  { kw: 'width',   cat: 'pen', num: true, def: 4, min: 1, max: 30 },
    home:   { kw: 'home',    cat: 'move' },
    clear:  { kw: 'clear',   cat: 'pen' }
  };
  var ORDER = ['fd', 'bk', 'rt', 'lt', 'repeat', 'pu', 'pd', 'color', 'width', 'home', 'clear'];
  var COLORS = ['black', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown'];
  var ALIAS = {
    forward: 'fd', fd: 'fd', back: 'bk', backward: 'bk', bk: 'bk',
    right: 'rt', rt: 'rt', left: 'lt', lt: 'lt',
    penup: 'pu', pu: 'pu', pendown: 'pd', pd: 'pd',
    color: 'color', colour: 'color', pencolor: 'color', pencolour: 'color', setcolor: 'color',
    width: 'width', penwidth: 'width', pensize: 'width', setwidth: 'width',
    repeat: 'repeat', home: 'home', clear: 'clear', cs: 'clear', clearscreen: 'clear'
  };
  var COLOR_ALIAS = { violet: 'purple', grey: 'black', gray: 'black', saffron: 'orange' };
  var MAX_OPS = 20000;

  var uid = 0;
  function newId() { uid += 1; return 'b' + uid; }

  function clampNum(t, v) {
    var T = TYPES[t];
    v = Number(v);
    if (!isFinite(v)) v = T.def;
    if (T.int) v = Math.round(v);
    v = Math.max(T.min, Math.min(T.max, v));
    return Math.round(v * 100) / 100;
  }

  function make(t, val) {
    var T = TYPES[t], b = { id: newId(), t: t };
    if (T.num) b.n = val !== undefined ? clampNum(t, val) : T.def;
    if (T.color) b.c = COLORS.indexOf(val) >= 0 ? val : T.def;
    if (t === 'repeat') b.body = [];
    return b;
  }

  /* ---------------- text → blocks ---------------- */
  function ParseError(key, vars) { this.key = key; this.vars = vars || {}; }

  function tokenize(src) {
    var toks = [];
    String(src == null ? '' : src).split(/\r?\n/).forEach(function (line, li) {
      line = line.replace(/(#|\/\/).*$/, '');
      var re = /\[|\]|[^\s\[\]]+/g, m;
      while ((m = re.exec(line))) toks.push({ v: m[0], line: li + 1 });
    });
    return toks;
  }

  function isNum(s) { return /^[-+]?(\d+\.?\d*|\.\d+)$/.test(s); }

  function parse(src) {
    var toks = tokenize(src), i = 0;
    function list(inside, openLine) {
      var out = [];
      while (i < toks.length) {
        var tk = toks[i++], w = tk.v.toLowerCase();
        if (w === ']') {
          if (inside) return out;
          throw new ParseError('err_extra', { line: tk.line });
        }
        if (w === 'pen' && toks[i] && /^(up|down)$/i.test(toks[i].v)) { w = 'pen' + toks[i].v.toLowerCase(); i++; }
        var t = ALIAS[w];
        if (!t) throw new ParseError('err_unknown', { line: tk.line, word: tk.v.slice(0, 24) });
        var T = TYPES[t], b = make(t);
        if (T.num) {
          var nt = toks[i];
          if (!nt || !isNum(nt.v)) throw new ParseError('err_number', { line: tk.line, word: tk.v.slice(0, 24) });
          i++;
          b.n = clampNum(t, parseFloat(nt.v));
        }
        if (T.color) {
          var ct = toks[i], cw = ct ? ct.v.toLowerCase() : '';
          if (COLOR_ALIAS[cw]) cw = COLOR_ALIAS[cw];
          if (COLORS.indexOf(cw) < 0) throw new ParseError('err_color', { line: tk.line, word: ct ? ct.v.slice(0, 24) : '?', list: COLORS.join(', ') });
          i++;
          b.c = cw;
        }
        if (t === 'repeat') {
          var bt = toks[i];
          if (!bt || bt.v !== '[') throw new ParseError('err_open', { line: tk.line });
          i++;
          b.body = list(true, tk.line);
        }
        out.push(b);
      }
      if (inside) throw new ParseError('err_unclosed', { line: openLine });
      return out;
    }
    return list(false, 0);
  }

  /* ---------------- blocks → text ---------------- */
  function fmtNum(n) { return String(Math.round(n * 100) / 100); }
  function toCode(list, ind) {
    ind = ind || '';
    return (list || []).map(function (b) {
      var T = TYPES[b.t], s = ind + T.kw;
      if (T.num) s += ' ' + fmtNum(b.n);
      if (T.color) s += ' ' + b.c;
      if (b.t === 'repeat') s += ' [' + (b.body.length ? '\n' + toCode(b.body, ind + '  ') + '\n' + ind : ' ') + ']';
      return s;
    }).join('\n');
  }

  function countBlocks(list, skip) {
    var n = 0;
    (list || []).forEach(function (b) {
      if (!skip || skip.indexOf(b.t) < 0) n++;
      if (b.body) n += countBlocks(b.body, skip);
    });
    return n;
  }
  function hasType(list, t) {
    return (list || []).some(function (b) { return b.t === t || (b.body && hasType(b.body, t)); });
  }

  /* ---------------- blocks → flat list of operations ---------------- */
  function compile(list) {
    var ops = [], over = false;
    (function emit(lst) {
      for (var k = 0; k < lst.length && !over; k++) {
        var b = lst[k];
        if (b.t === 'repeat') {
          for (var r = 0; r < b.n && !over; r++) {
            ops.push({ op: 'iter', id: b.id, i: r + 1, n: b.n });
            emit(b.body);
            if (ops.length > MAX_OPS) over = true;
          }
        } else {
          var o = { op: b.t, id: b.id };
          if (b.n !== undefined) o.n = b.n;
          if (b.c !== undefined) o.c = b.c;
          ops.push(o);
        }
        if (ops.length > MAX_OPS) over = true;
      }
    })(list || []);
    return over ? null : ops;
  }

  /* ---------------- turtle geometry ---------------- */
  /* heading in degrees: 0 = up (north), 90 = right (east). y grows upwards. */
  function newTurtle() { return { x: 0, y: 0, h: 0, pen: true, c: 'black', w: 2 }; }
  function rad(d) { return d * Math.PI / 180; }
  function normDeg(h) { h = h % 360; if (h < 0) h += 360; return Math.abs(h - 360) < 1e-9 ? 0 : h; }
  function clean(v) { var r = Math.round(v); return Math.abs(v - r) < 1e-9 ? r : v; }

  /* Where a move op ends (for animation too). */
  function moveTarget(tu, op) {
    if (op.op === 'home') return { x: 0, y: 0 };
    var d = op.op === 'fd' ? op.n : -op.n;
    return { x: clean(tu.x + Math.sin(rad(tu.h)) * d), y: clean(tu.y + Math.cos(rad(tu.h)) * d) };
  }

  /* Apply one op instantly. Returns the drawn segment or null. ('clear' is handled by the caller.) */
  function apply(tu, op) {
    var seg = null;
    switch (op.op) {
      case 'fd': case 'bk': case 'home':
        var p = moveTarget(tu, op);
        if (tu.pen && (p.x !== tu.x || p.y !== tu.y)) seg = { x1: tu.x, y1: tu.y, x2: p.x, y2: p.y, c: tu.c, w: tu.w };
        tu.x = p.x; tu.y = p.y;
        if (op.op === 'home') tu.h = 0;
        break;
      case 'rt': tu.h = normDeg(tu.h + op.n); break;
      case 'lt': tu.h = normDeg(tu.h - op.n); break;
      case 'pu': tu.pen = false; break;
      case 'pd': tu.pen = true; break;
      case 'color': tu.c = op.c; break;
      case 'width': tu.w = op.n; break;
    }
    return seg;
  }

  /* Run a whole program instantly; returns the segments left on screen. */
  function simulate(list) {
    var ops = compile(list) || [], tu = newTurtle(), segs = [];
    ops.forEach(function (op) {
      if (op.op === 'clear') { segs = []; return; }
      var s = apply(tu, op);
      if (s) segs.push(s);
    });
    return { segs: segs, turtle: tu };
  }

  /* ---------------- shape checker ---------------- */
  function segLen(s) { return Math.sqrt((s.x2 - s.x1) * (s.x2 - s.x1) + (s.y2 - s.y1) * (s.y2 - s.y1)); }
  function samples(segs, maxPts) {
    var total = 0, pts = [];
    segs.forEach(function (s) { total += segLen(s); });
    var step = Math.max(3, total / (maxPts || 6000));
    segs.forEach(function (s) {
      var n = Math.max(1, Math.ceil(segLen(s) / step));
      for (var k = 0; k <= n; k++) pts.push([s.x1 + (s.x2 - s.x1) * k / n, s.y1 + (s.y2 - s.y1) * k / n]);
    });
    return pts;
  }
  function distPS(px, py, s) {
    var dx = s.x2 - s.x1, dy = s.y2 - s.y1, L = dx * dx + dy * dy, u = 0;
    if (L > 0) u = Math.max(0, Math.min(1, ((px - s.x1) * dx + (py - s.y1) * dy) / L));
    var qx = s.x1 + u * dx - px, qy = s.y1 + u * dy - py;
    return Math.sqrt(qx * qx + qy * qy);
  }
  var CELL = 25;
  function index(segs, tol) {
    var map = {};
    segs.forEach(function (s, k) {
      var x0 = Math.floor((Math.min(s.x1, s.x2) - tol) / CELL), x1 = Math.floor((Math.max(s.x1, s.x2) + tol) / CELL);
      var y0 = Math.floor((Math.min(s.y1, s.y2) - tol) / CELL), y1 = Math.floor((Math.max(s.y1, s.y2) + tol) / CELL);
      if ((x1 - x0 + 1) * (y1 - y0 + 1) > 4000) return;   /* giant off-screen line: skip */
      for (var i = x0; i <= x1; i++) for (var j = y0; j <= y1; j++) (map[i + ',' + j] = map[i + ',' + j] || []).push(k);
    });
    return { map: map, segs: segs };
  }
  function near(ix, x, y, tol) {
    var c = ix.map[Math.floor(x / CELL) + ',' + Math.floor(y / CELL)];
    if (!c) return false;
    for (var k = 0; k < c.length; k++) if (distPS(x, y, ix.segs[c[k]]) <= tol) return true;
    return false;
  }
  function frac(pts, ix, tol) {
    if (!pts.length) return 0;
    var ok = 0;
    pts.forEach(function (p) { if (near(ix, p[0], p[1], tol)) ok++; });
    return ok / pts.length;
  }
  function compare(drawn, target, tol) {
    return { cov: frac(samples(target), index(drawn, tol), tol), prec: frac(samples(drawn), index(target, tol), tol) };
  }
  /* Loose comparison: the outline must be covered and there must be few extra lines.
     A mirror image (turning left instead of right) is accepted too. */
  function check(drawn, target, tol) {
    tol = tol || 7;
    drawn = (drawn || []).filter(function (s) { return segLen(s) > 0.01; });
    if (!drawn.length) return { cov: 0, prec: 0, pass: false, empty: true };
    var a = compare(drawn, target, tol);
    var mir = target.map(function (s) { return { x1: -s.x1, y1: s.y1, x2: -s.x2, y2: s.y2 }; });
    var b = compare(drawn, mir, tol);
    var best = (b.cov + b.prec > a.cov + a.prec) ? b : a;
    best.mirrored = best === b;
    best.pass = best.cov >= 0.97 && best.prec >= 0.95;
    return best;
  }

  var api = {
    TYPES: TYPES, ORDER: ORDER, COLORS: COLORS, MAX_OPS: MAX_OPS,
    make: make, clampNum: clampNum, parse: parse, ParseError: ParseError, toCode: toCode,
    countBlocks: countBlocks, hasType: hasType, compile: compile,
    newTurtle: newTurtle, moveTarget: moveTarget, apply: apply, simulate: simulate, normDeg: normDeg,
    check: check, segLen: segLen
  };
  root.TurtleEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : this);
