/* Logic Gates Lab: SVG drawing helpers (gate symbols, switches, lamps, circuits).
   Every function returns SVG markup as a string; app.js inserts it and handles clicks.
   Colours come from CSS classes in index.html, so light/dark themes need no redraw. */
(function () {
  'use strict';
  var NAME = { and: 'AND', or: 'OR', not: 'NOT', nand: 'NAND', nor: 'NOR', xor: 'XOR', xnor: 'XNOR' };
  var BASE = { and: 'and', nand: 'and', or: 'or', nor: 'or', xor: 'xor', xnor: 'xor', not: 'not' };

  function f(n) { return Math.round(n * 10) / 10; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function vc(v) { return v ? 'on' : 'off'; }

  /* A gate symbol (IEEE distinctive shapes).
     gate(type, x = left edge of the body, cy = centre line, n inputs, {W, H, gap, r, label})
     → { svg, pins: [{x, y}], out: {x, y}, back: x where the input wires stop } */
  function gate(type, x, cy, n, o) {
    var W = o.W, H = o.H, gap = o.gap, r = o.r || 5;
    var y0 = cy - H / 2, y1 = cy + H / 2, base = BASE[type], d;
    if (base === 'and') {
      var sx = Math.max(W * 0.3, W - H / 2);
      d = 'M' + f(x) + ' ' + f(y0) + 'H' + f(x + sx) + 'A' + f(W - sx) + ' ' + f(H / 2) + ' 0 0 1 ' + f(x + sx) + ' ' + f(y1) + 'H' + f(x) + 'Z';
    } else if (base === 'not') {
      d = 'M' + f(x) + ' ' + f(y0) + 'L' + f(x + W) + ' ' + f(cy) + 'L' + f(x) + ' ' + f(y1) + 'Z';
    } else {
      d = 'M' + f(x) + ' ' + f(y0) + 'Q' + f(x + 0.6 * W) + ' ' + f(y0) + ' ' + f(x + W) + ' ' + f(cy) +
        'Q' + f(x + 0.6 * W) + ' ' + f(y1) + ' ' + f(x) + ' ' + f(y1) +
        'Q' + f(x + 0.3 * W) + ' ' + f(cy) + ' ' + f(x) + ' ' + f(y0) + 'Z';
    }
    var s = '<path class="g-body" d="' + d + '"/>';
    var g = Math.max(6, W * 0.14);
    if (base === 'xor') s += '<path class="g-line" d="M' + f(x - g) + ' ' + f(y0) + 'Q' + f(x - g + 0.3 * W) + ' ' + f(cy) + ' ' + f(x - g) + ' ' + f(y1) + '"/>';
    var outX = x + W;
    if (type !== base || type === 'not') { s += '<circle class="g-body" cx="' + f(x + W + r) + '" cy="' + f(cy) + '" r="' + f(r) + '"/>'; outX += 2 * r; }
    if (o.label) {
      var lx = x + W * (base === 'not' ? 0.34 : base === 'and' ? 0.44 : 0.47);
      s += '<text class="g-lbl" x="' + f(lx) + '" y="' + f(cy) + '" dy=".35em" style="font-size:' + f(o.fs || 15) + 'px">' + esc(o.label) + '</text>';
    }
    var pins = [];
    for (var i = 0; i < n; i++) {
      var py = cy + (i - (n - 1) / 2) * gap, t = Math.max(0, Math.min(1, (py - y0) / H)), px = x;
      if (base === 'or') px = x + 0.6 * W * t * (1 - t);
      else if (base === 'xor') px = x - g + 0.6 * W * t * (1 - t);
      pins.push({ x: px, y: py });
    }
    return { svg: '<g class="gate">' + s + '</g>', pins: pins, out: { x: outX, y: cy }, back: base === 'xor' ? x - g : x };
  }

  function wire(pts, v) {
    return '<path class="w ' + vc(v) + '" d="M' + pts.map(function (p) { return f(p[0]) + ' ' + f(p[1]); }).join('L') + '"/>';
  }
  function pathW(d, v) { return '<path class="w ' + vc(v) + '" d="' + d + '"/>'; }
  /* horizontal wire from x1 to x2 at height y that hops over the wires at xs (no connection there) */
  function hop(x1, y, x2, xs) {
    var d = 'M' + f(x1) + ' ' + f(y);
    xs.forEach(function (hx) { d += 'H' + f(hx - 6) + 'A6 6 0 0 1 ' + f(hx + 6) + ' ' + f(y); });
    return d + 'H' + f(x2);
  }
  function dot(x, y, v) { return '<circle class="jd ' + vc(v) + '" cx="' + f(x) + '" cy="' + f(y) + '" r="4.5"/>'; }

  /* A slide switch with a letter. Its wire leaves at x + 94. */
  function toggle(id, label, v, x, y, aria, hitH, fk) {
    hitH = hitH || 52;
    var kx = x + 30 + (v ? 47 : 17);
    return '<g class="sw ' + vc(v) + '" data-sw="' + esc(id) + '" data-fk="' + esc(fk || ('sw-' + id)) + '" role="button" tabindex="0" aria-pressed="' + (v ? 'true' : 'false') + '" aria-label="' + esc(aria) + '">' +
      '<rect class="sw-hit" x="' + f(x - 8) + '" y="' + f(y - hitH / 2) + '" width="110" height="' + f(hitH) + '" rx="10"/>' +
      '<text class="sw-l" x="' + f(x + 11) + '" y="' + f(y) + '" dy=".35em"' + (label.length > 1 ? ' style="font-size:16px"' : '') + '>' + esc(label) + '</text>' +
      '<rect class="sw-track" x="' + f(x + 30) + '" y="' + f(y - 17) + '" width="64" height="34" rx="17"/>' +
      '<circle class="sw-knob" cx="' + f(kx) + '" cy="' + f(y) + '" r="13"/>' +
      '<text class="sw-v" x="' + f(kx) + '" y="' + f(y) + '" dy=".35em">' + (v ? 1 : 0) + '</text></g>';
  }

  /* A lamp (LED) showing an output. */
  function lamp(x, y, v, r, label, aria) {
    var s = '<g class="led ' + vc(v) + '" role="img" aria-label="' + esc(aria || '') + '">' +
      '<circle class="led-glow" cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(r + 9) + '"/>' +
      '<circle class="led-b" cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(r) + '"/>' +
      '<text class="led-v" x="' + f(x) + '" y="' + f(y) + '" dy=".35em" style="font-size:' + f(r * 0.85) + 'px">' + (v ? 1 : 0) + '</text>';
    if (label) s += '<text class="led-l" x="' + f(x) + '" y="' + f(y + r + 18) + '" dy=".35em">' + esc(label) + '</text>';
    return s + '</g>';
  }

  function svgWrap(w, h, body, aria, cls, y0) {
    return '<svg class="lg-svg ' + (cls || '') + '" viewBox="0 ' + f(y0 || 0) + ' ' + f(w) + ' ' + f(h) + '" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="' + esc(aria || '') + '">' + body + '</svg>';
  }

  /* Gate explorer: one big gate with 1–3 switches and a lamp.
     o = { swAria(i, label, v), outAria, aria } */
  function explorer(type, n, ins, y, o) {
    var cy = 120, gx = 196, isNot = type === 'not';
    var H = isNot ? 92 : (n === 3 ? 156 : 116), gap = n === 3 ? 48 : 60;
    var G = gate(type, gx, cy, n, { W: isNot ? 100 : 124, H: H, gap: gap, r: 9, label: NAME[type], fs: 17 });
    var s = '';
    G.pins.forEach(function (p, i) { s += wire([[110, p.y], [p.x, p.y]], ins[i]); });
    s += G.svg;
    s += wire([[G.out.x, cy], [384, cy]], y);
    G.pins.forEach(function (p, i) {
      var lbl = 'ABC'[i];
      s += toggle(String(i), lbl, ins[i], 16, p.y, o.swAria(i, lbl, ins[i]), n === 3 ? 46 : 54, 'gx-s' + i);
    });
    s += lamp(410, cy, y, 26, 'Y', o.outAria);
    return svgWrap(460, 184, s, o.aria, 'gx', 28);
  }

  /* Small symbol with labelled input stubs (for practice questions). */
  function symbol(type, n) {
    var cy = 50, isNot = type === 'not';
    var G = gate(type, 60, cy, n, { W: isNot ? 50 : 62, H: isNot ? 46 : (n === 3 ? 72 : 56), gap: n === 3 ? 22 : 28, r: 6, label: NAME[type], fs: 12 });
    var s = '';
    G.pins.forEach(function (p, i) {
      s += '<path class="w plain" d="M28 ' + f(p.y) + 'H' + f(p.x) + '"/>';
      s += '<text class="sym-l" x="16" y="' + f(p.y) + '" dy=".35em">' + 'ABC'[i] + '</text>';
    });
    s += G.svg + '<path class="w plain" d="M' + f(G.out.x) + ' ' + cy + 'H' + f(G.out.x + 26) + '"/>';
    s += '<text class="sym-l" x="' + f(G.out.x + 38) + '" y="' + cy + '" dy=".35em">Y</text>';
    return svgWrap(G.out.x + 52, 100, s, NAME[type], 'sym');
  }

  /* Circuit for an expression tree, drawn as a tree: inputs on the left, output lamp on the right.
     o = { leafAria(name, v), outAria, aria }. Returns null when the circuit is too big to draw neatly. */
  function circuit(ast, env, o) {
    var LG = window.LG_LOGIC, count = 0, leaves = 0, maxFan = 1;
    function build(n) {
      count++;
      if (n.k === 'var') { leaves++; return { leaf: true, name: n.name, isVar: true, col: 0, v: env[n.name] ? 1 : 0 }; }
      if (n.k === 'const') { leaves++; return { leaf: true, name: String(n.v), isVar: false, col: 0, v: n.v }; }
      var kids = n.k === 'not' ? [build(n.a)] : n.args.map(build);
      maxFan = Math.max(maxFan, kids.length);
      var type = n.k === 'not' ? 'not' : n.op;
      return { leaf: false, type: type, kids: kids, col: 1 + Math.max.apply(null, kids.map(function (k) { return k.col; })), v: LG.gate(type, kids.map(function (k) { return k.v; })) };
    }
    var root = build(ast);
    if (count > 64 || leaves > 24 || root.col > 9 || maxFan > 8) return null;

    var SH = 42, PAD = 14, GW = 42, NW = 30, R = 5, LEAF_R = 40;
    var gap = 50 + 7 * Math.max(0, maxFan - 2);
    function colX(c) { return LEAF_R + gap + (c - 1) * (GW + 2 * R + gap); }
    var slot = 0;
    (function place(N) {
      if (N.leaf) { N.y = PAD + slot * SH + SH / 2; slot++; return; }
      N.kids.forEach(place);
      N.y = N.kids.length === 1 ? N.kids[0].y : (N.kids[0].y + N.kids[N.kids.length - 1].y) / 2;
    })(root);
    var H = PAD * 2 + slot * SH;
    var wires = '', gates = '', vals = '', ins = '', leafNo = 0;
    (function draw(N) {
      if (N.leaf) {
        N.out = { x: LEAF_R, y: N.y };
        var pill = '<rect class="pill-b" x="6" y="' + f(N.y - 15) + '" width="' + (LEAF_R - 6) + '" height="30" rx="9"/>' +
          '<text class="pill-t" x="' + f(6 + (LEAF_R - 6) / 2) + '" y="' + f(N.y) + '" dy=".35em">' + esc(N.name) + '</text>';
        /* data-fk (leaf number) lets app.js put keyboard focus back on the same pill after a redraw */
        if (N.isVar) ins += '<g class="pill ' + vc(N.v) + '" data-var="' + N.name + '" data-fk="xp-' + (leafNo++) + '" role="button" tabindex="0" aria-pressed="' + (N.v ? 'true' : 'false') + '" aria-label="' + esc(o.leafAria(N.name, N.v)) + '">' + pill + '</g>';
        else ins += '<g class="pill const ' + vc(N.v) + '">' + pill + '</g>';
        return;
      }
      N.kids.forEach(draw);
      var n = N.kids.length, isNot = N.type === 'not';
      var G = gate(N.type, colX(N.col), N.y, n, { W: isNot ? NW : GW, H: isNot ? 26 : Math.max(32, 14 * n + 16), gap: 14, r: R });
      gates += G.svg;
      var down = [], up = [];
      N.kids.forEach(function (K, i) {
        var p = G.pins[i];
        if (Math.abs(K.out.y - p.y) < 0.5) wires += wire([[K.out.x, K.out.y], [p.x, p.y]], K.v);
        else if (K.out.y < p.y) down.push(i); else up.push(i);
      });
      /* the wire furthest from the gate's centre turns closest to the gate, so wires never cross */
      down.sort(function (a, b) { return N.kids[a].out.y - N.kids[b].out.y; });
      up.sort(function (a, b) { return N.kids[b].out.y - N.kids[a].out.y; });
      [down, up].forEach(function (list) {
        list.forEach(function (i, rank) {
          var K = N.kids[i], p = G.pins[i], xm = G.back - 10 - rank * 7;
          wires += wire([[K.out.x, K.out.y], [xm, K.out.y], [xm, p.y], [p.x, p.y]], K.v);
        });
      });
      N.out = G.out;
      if (N !== root) vals += '<text class="val ' + vc(N.v) + '" x="' + f(G.out.x + 7) + '" y="' + f(N.y - 9) + '">' + N.v + '</text>';
    })(root);
    var ledX = root.out.x + 40;
    wires += wire([[root.out.x, root.y], [ledX - 14, root.y]], root.v);
    var out = lamp(ledX, root.y, root.v, 14, '', o.outAria) + '<text class="led-l" x="' + f(ledX + 30) + '" y="' + f(root.y) + '" dy=".35em">Y</text>';
    var Wt = ledX + 46;
    return { svg: svgWrap(Wt, Math.max(H, 64), wires + gates + vals + ins + out, o.aria, 'circ'), w: Wt, h: Math.max(H, 64) };
  }

  var G2 = { W: 64, H: 52, gap: 24, r: 6, fs: 13 };
  function g2(type, x, cy) { return gate(type, x, cy, 2, Object.assign({ label: NAME[type] }, G2)); }

  /* Half adder: S = A ⊕ B, C = A·B. o = { swAria(id, label, v), aria, sAria, cAria } */
  function halfAdder(a, b, o) {
    var X = g2('xor', 222, 82), N = g2('and', 222, 170), S = a ^ b, C = a & b, s = '';
    s += pathW('M110 70H' + f(X.pins[0].x), a);
    s += pathW('M165 70V' + f(N.pins[0].y) + 'H' + f(N.pins[0].x), a);
    s += pathW('M110 150H135', b);
    s += pathW('M135 ' + f(X.pins[1].y) + 'V' + f(N.pins[1].y) + 'H' + f(N.pins[1].x), b);
    s += pathW(hop(135, X.pins[1].y, X.pins[1].x, [165]), b);
    s += pathW('M' + f(X.out.x) + ' 82H378', S) + pathW('M' + f(N.out.x) + ' 170H378', C);
    s += dot(165, 70, a) + dot(135, 150, b);
    s += X.svg + N.svg;
    s += toggle('a', 'A', a, 16, 70, o.swAria('a', 'A', a), 54, 'ha-a') + toggle('b', 'B', b, 16, 150, o.swAria('b', 'B', b), 54, 'ha-b');
    s += lamp(400, 82, S, 20, 'S', o.sAria) + lamp(400, 170, C, 20, 'C', o.cAria);
    return svgWrap(450, 230, s, o.aria);
  }

  /* Full adder from two half adders and an OR gate. */
  function fullAdder(a, b, c, o) {
    var X1 = g2('xor', 222, 112), A1 = g2('and', 222, 260), X2 = g2('xor', 382, 124), A2 = g2('and', 382, 200), O = g2('or', 492, 224);
    var P = a ^ b, G1 = a & b, S = P ^ c, G2v = P & c, Co = G1 | G2v, s = '';
    /* carry in, from the top */
    s += pathW('M110 36H350V' + f(A2.pins[0].y) + 'H' + f(A2.pins[0].x), c);
    s += pathW('M350 ' + f(X2.pins[0].y) + 'H' + f(X2.pins[0].x), c);
    /* A and B into the first half adder */
    s += pathW('M110 100H' + f(X1.pins[0].x), a);
    s += pathW('M165 100V' + f(A1.pins[0].y) + 'H' + f(A1.pins[0].x), a);
    s += pathW('M110 180H135', b);
    s += pathW('M135 ' + f(X1.pins[1].y) + 'V' + f(A1.pins[1].y) + 'H' + f(A1.pins[1].x), b);
    s += pathW(hop(135, X1.pins[1].y, X1.pins[1].x, [165]), b);
    /* P = A ⊕ B into the second half adder */
    s += pathW('M' + f(X1.out.x) + ' 112H330V' + f(A2.pins[1].y) + 'H' + f(A2.pins[1].x), P);
    s += pathW(hop(330, X2.pins[1].y, X2.pins[1].x, [350]), P);
    /* the two carries into the OR gate */
    s += pathW('M' + f(A1.out.x) + ' 260H472V' + f(O.pins[1].y) + 'H' + f(O.pins[1].x), G1);
    s += pathW('M' + f(A2.out.x) + ' 200H458V' + f(O.pins[0].y) + 'H' + f(O.pins[0].x), G2v);
    s += pathW('M' + f(X2.out.x) + ' 124H586', S) + pathW('M' + f(O.out.x) + ' 224H586', Co);
    s += dot(350, X2.pins[0].y, c) + dot(165, 100, a) + dot(135, 180, b) + dot(330, X2.pins[1].y, P);
    s += X1.svg + A1.svg + X2.svg + A2.svg + O.svg;
    s += toggle('c', 'Cin', c, 16, 36, o.swAria('c', 'Cin', c), 50, 'fa-c') + toggle('a', 'A', a, 16, 100, o.swAria('a', 'A', a), 54, 'fa-a') + toggle('b', 'B', b, 16, 180, o.swAria('b', 'B', b), 54, 'fa-b');
    s += lamp(608, 124, S, 20, 'S', o.sAria) + lamp(608, 224, Co, 20, 'Cout', o.cAria);
    return svgWrap(660, 290, s, o.aria);
  }

  window.LG_DRAW = { NAME: NAME, gate: gate, explorer: explorer, symbol: symbol, circuit: circuit, halfAdder: halfAdder, fullAdder: fullAdder };
})();
