/* Snakes & Ladders: board drawing (SVG, drawn here, no images). Curvy snakes, wooden ladders, tokens with
   colour + shape. Colours come from CSS variables, so light/dark themes need no redraw. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var SL = window.SL, C = SL.CELL;
  var W = 1000, H = 1090, START_Y = 1045;          // a "start" strip below row 1 holds the tokens before they enter

  function mk(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function r1(n) { return Math.round(n * 10) / 10; }
  function P(p) { return r1(p.x) + ' ' + r1(p.y); }

  /* ---------------- snake geometry: a wavy centre line from head to tail, tapering body ---------------- */
  function snakeGeom(from, to, idx) {
    var A = SL.xy(from), B = SL.xy(to);
    var dx = B.x - A.x, dy = B.y - A.y, L = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / L, ny = dx / L;
    var waves = Math.max(2, Math.min(7, Math.round(L / 125)));
    var amp = Math.min(36, 16 + L * 0.03) * (idx % 2 ? 1 : -1);
    var N = 72, pts = [], i;
    for (i = 0; i <= N; i++) {
      var s = i / N, env = Math.min(1, s * 5, (1 - s) * 3.2);
      var off = amp * Math.sin(Math.PI * waves * s) * env;
      pts.push({ x: A.x + dx * s + nx * off, y: A.y + dy * s + ny * off });
    }
    var left = [], right = [], norms = [];
    for (i = 0; i <= N; i++) {
      var a = pts[Math.max(0, i - 1)], b = pts[Math.min(N, i + 1)];
      var tx = b.x - a.x, ty = b.y - a.y, tl = Math.sqrt(tx * tx + ty * ty) || 1;
      var mx = -ty / tl, my = tx / tl, s2 = i / N;
      var w = 13 * Math.pow(1 - s2, 0.75) + 2.2;     // half width: thick neck, thin tail
      norms.push({ x: mx, y: my, w: w, tx: tx / tl, ty: ty / tl });
      left.push({ x: pts[i].x + mx * w, y: pts[i].y + my * w });
      right.push({ x: pts[i].x - mx * w, y: pts[i].y - my * w });
    }
    var end = norms[N], tip = { x: pts[N].x + end.tx * 14, y: pts[N].y + end.ty * 14 };
    var d = 'M' + P(left[0]);
    for (i = 1; i <= N; i++) d += 'L' + P(left[i]);
    d += 'L' + P(tip);
    for (i = N; i >= 0; i--) d += 'L' + P(right[i]);
    d += 'Z';
    var spots = '';
    for (i = 5; i < N - 4; i += 5) {
      var n = norms[i], c = pts[i], sz = n.w * 0.55, len = n.w * 0.9;
      var p1 = { x: c.x + n.tx * len, y: c.y + n.ty * len }, p2 = { x: c.x + n.x * sz, y: c.y + n.y * sz };
      var p3 = { x: c.x - n.tx * len, y: c.y - n.ty * len }, p4 = { x: c.x - n.x * sz, y: c.y - n.y * sz };
      spots += 'M' + P(p1) + 'L' + P(p2) + 'L' + P(p3) + 'L' + P(p4) + 'Z';
    }
    var t0 = norms[0], ang = Math.atan2(-t0.ty, -t0.tx) * 180 / Math.PI;   // the head looks away from the body
    return { pts: pts, body: d, spots: spots, head: A, angle: ang, len: L };
  }

  function ladderGeom(from, to) {
    var A = SL.xy(from), B = SL.xy(to);
    var dx = B.x - A.x, dy = B.y - A.y, L = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    var half = 17, ext = 18;
    var a = { x: A.x - ux * ext, y: A.y - uy * ext }, b = { x: B.x + ux * ext, y: B.y + uy * ext };
    var rails = 'M' + P({ x: a.x + nx * half, y: a.y + ny * half }) + 'L' + P({ x: b.x + nx * half, y: b.y + ny * half }) +
      'M' + P({ x: a.x - nx * half, y: a.y - ny * half }) + 'L' + P({ x: b.x - nx * half, y: b.y - ny * half });
    var rungs = '', total = L + 2 * ext;
    for (var d = 20; d < total - 12; d += 31) {
      var c = { x: a.x + ux * d, y: a.y + uy * d };
      rungs += 'M' + P({ x: c.x + nx * half, y: c.y + ny * half }) + 'L' + P({ x: c.x - nx * half, y: c.y - ny * half });
    }
    return { rails: rails, rungs: rungs, from: A, to: B };
  }

  /* ---------------- tokens: colour + a distinct shape for colour-blind players ---------------- */
  var SHAPES = ['circle', 'square', 'triangle', 'diamond', 'star'];
  function shapePath(shape, r) {
    var k = r / 26;
    function S(v) { return r1(v * k); }
    switch (shape) {
      case 'square': return 'M' + S(-20) + ' ' + S(-20) + 'H' + S(20) + 'V' + S(20) + 'H' + S(-20) + 'Z';
      case 'triangle': return 'M0 ' + S(-27) + 'L' + S(25) + ' ' + S(17) + 'H' + S(-25) + 'Z';
      case 'diamond': return 'M0 ' + S(-28) + 'L' + S(25) + ' 0L0 ' + S(28) + 'L' + S(-25) + ' 0Z';
      case 'star': {
        var d = '';
        for (var i = 0; i < 10; i++) {
          var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 12.5 : 29;
          d += (i ? 'L' : 'M') + S(Math.cos(a) * rr) + ' ' + S(Math.sin(a) * rr + 2);
        }
        return d + 'Z';
      }
      default: return 'M' + S(-23) + ' 0A' + S(23) + ' ' + S(23) + ' 0 1 0 ' + S(23) + ' 0A' + S(23) + ' ' + S(23) + ' 0 1 0 ' + S(-23) + ' 0Z';
    }
  }
  /* a small stand-alone token icon (player lists, banner, history) */
  function tokenIcon(colour, shape, size) {
    var svg = mk('svg', { viewBox: '-32 -32 64 64', width: size || 28, height: size || 28, class: 'tok-ic', 'aria-hidden': 'true', focusable: 'false' });
    mk('path', { d: shapePath(shape, 26), fill: colour, stroke: '#fff', 'stroke-width': 5, 'stroke-linejoin': 'round' }, svg);
    mk('path', { d: shapePath(shape, 26), fill: 'none', stroke: 'rgba(0,0,0,.45)', 'stroke-width': 1.6, 'stroke-linejoin': 'round', transform: 'scale(1.17)' }, svg);
    return svg;
  }

  /* ---------------- the board ---------------- */
  function draw(svg, layout, opts) {
    opts = opts || {};
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var geo = { snakes: [], ladders: [] };
    var cells = mk('g', { class: 'cells' }, svg), r, c, n;
    for (n = 1; n <= 100; n++) {
      var rc = SL.rowCol(n), x = rc.c * C, y = (9 - rc.r) * C;
      /* cream and soft colours in a checker pattern; the colour changes along the diagonals */
      var cls = 'cell' + ((rc.r + rc.c) % 2 ? ' ck' + ((((rc.r + rc.c - 1) / 2) | 0) % 4) : '');
      if (n === 100) cls += ' goal';
      mk('rect', { x: x, y: y, width: C, height: C, class: cls }, cells);
    }
    mk('rect', { x: 1.5, y: 1.5, width: W - 3, height: 1000 - 3, class: 'frame', rx: 6 }, cells);
    /* goal: a lotus-like flower behind 100 */
    var g100 = SL.xy(100), flower = mk('g', { class: 'goal-mark', transform: 'translate(' + g100.x + ' ' + (g100.y + 6) + ')' }, cells);
    for (var k = 0; k < 8; k++) mk('ellipse', { cx: 0, cy: -22, rx: 11, ry: 22, transform: 'rotate(' + (k * 45) + ')' }, flower);
    /* start strip */
    mk('rect', { x: 0, y: 1006, width: W, height: H - 1006, rx: 12, class: 'start-strip' }, cells);
    var lbl = mk('text', { x: W - 24, y: START_Y + 11, class: 'start-lbl', 'text-anchor': 'end' }, cells);
    lbl.textContent = opts.startLabel || '';

    var lad = mk('g', { class: 'ladders' }, svg);
    layout.ladders.forEach(function (p, i) {
      var g = ladderGeom(p[0], p[1]), grp = mk('g', { class: 'ladder', 'data-i': i }, lad);
      if (opts.title) mk('title', null, grp).textContent = opts.title('ladder', i, p);
      mk('path', { d: g.rails + g.rungs, class: 'l-shadow', transform: 'translate(6 7)' }, grp);
      mk('path', { d: g.rungs, class: 'l-rung' }, grp);
      mk('path', { d: g.rails, class: 'l-rail' }, grp);
      mk('path', { d: g.rails, class: 'l-shine' }, grp);
      geo.ladders.push(g);
    });
    var sn = mk('g', { class: 'snakes' }, svg);
    layout.snakes.forEach(function (p, i) {
      var g = snakeGeom(p[0], p[1], i), grp = mk('g', { class: 'snake sn' + (i % 9), 'data-i': i }, sn);
      if (opts.title) mk('title', null, grp).textContent = opts.title('snake', i, p);
      mk('path', { d: g.body, class: 's-shadow', transform: 'translate(5 6)' }, grp);
      mk('path', { d: g.body, class: 's-body' }, grp);
      mk('path', { d: g.spots, class: 's-spots' }, grp);
      var hd = mk('g', { class: 's-head', transform: 'translate(' + r1(g.head.x) + ' ' + r1(g.head.y) + ') rotate(' + r1(g.angle) + ')' }, grp);
      mk('path', { d: 'M20 0L33 0M33 0L40 -5M33 0L40 5', class: 's-tongue' }, hd);
      mk('ellipse', { cx: 2, cy: 0, rx: 22, ry: 16.5, class: 's-headshape' }, hd);
      mk('circle', { cx: 9, cy: -7, r: 5, class: 's-eye' }, hd);
      mk('circle', { cx: 9, cy: 7, r: 5, class: 's-eye' }, hd);
      mk('circle', { cx: 10.5, cy: -7, r: 2.4, class: 's-pupil' }, hd);
      mk('circle', { cx: 10.5, cy: 7, r: 2.4, class: 's-pupil' }, hd);
      geo.snakes.push(g);
    });
    var nums = mk('g', { class: 'nums' }, svg);
    for (n = 1; n <= 100; n++) {
      var q = SL.rowCol(n), tx = mk('text', { x: q.c * C + 9, y: (9 - q.r) * C + 31, class: n === 100 ? 'num goal-num' : 'num' }, nums);
      tx.textContent = String(n);
    }
    var fx = mk('g', { class: 'fx' }, svg);
    var tokens = mk('g', { class: 'tokens' }, svg);
    return { svg: svg, geo: geo, tokens: tokens, fx: fx };
  }

  /* where a token sits: square centre, nudged when several tokens share a square */
  var SLOT = [[0, 0], [[-20, -14], [20, 14]], [[-21, -16], [21, -16], [0, 20]], [[-21, -18], [21, -18], [-21, 20], [21, 20]]];
  function spot(square, k, count, playerIdx) {
    if (square <= 0) return { x: 62 + playerIdx * 86, y: START_Y, s: 1 };
    var p = SL.xy(square);
    if (count <= 1) return { x: p.x + 6, y: p.y + 10, s: 1 };
    var o = SLOT[Math.min(count, 4) - 1][k % 4];
    return { x: p.x + 4 + o[0], y: p.y + 8 + o[1], s: 0.72 };
  }

  /* point at fraction t (0..1) along a polyline */
  function along(pts, t) {
    if (t <= 0) return pts[0];
    if (t >= 1) return pts[pts.length - 1];
    var lens = [0], tot = 0, i;
    for (i = 1; i < pts.length; i++) { tot += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); lens.push(tot); }
    var want = t * tot;
    for (i = 1; i < pts.length; i++) {
      if (lens[i] >= want) {
        var f = (want - lens[i - 1]) / ((lens[i] - lens[i - 1]) || 1);
        return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f };
      }
    }
    return pts[pts.length - 1];
  }

  window.SLBoard = { W: W, H: H, START_Y: START_Y, SHAPES: SHAPES, mk: mk, draw: draw, shapePath: shapePath, tokenIcon: tokenIcon, spot: spot, along: along, snakeGeom: snakeGeom, ladderGeom: ladderGeom };
})();
