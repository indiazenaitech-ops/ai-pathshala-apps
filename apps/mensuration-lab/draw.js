/* Area & Volume Lab: labelled SVG drawings that keep the true proportions of the inputs.
   window.ML_DRAW(shape, vals, { lab: fn(symbol) → 'r = 7 cm', small: bool, title: string }) → SVG markup */
(function () {
  'use strict';
  var K = 0.3;              // ellipse squash for circles seen at an angle
  var OB = { k: 0.5, c: Math.cos(Math.PI / 6), s: Math.sin(Math.PI / 6) };   // oblique depth for boxes

  function r1(x) { return Math.round(x * 10) / 10; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function Builder(W, H, pad, fs) {
    this.W = W; this.H = H; this.fs = fs || 16; this.out = [];
    this.pad = [Math.max(pad[0], this.fs * 3.6), Math.max(pad[1], this.fs * 2.3)];
  }
  Builder.prototype.tw = function (s) { return String(s).length * this.fs * 0.56; };
  /* fit model box (y up) into the view; returns P(x,y) → [sx, sy] and the scale */
  Builder.prototype.fit = function (x0, y0, x1, y1) {
    var p = this.pad, bw = Math.max(x1 - x0, 1e-9), bh = Math.max(y1 - y0, 1e-9);
    var s = Math.min((this.W - 2 * p[0]) / bw, (this.H - 2 * p[1]) / bh);
    var ox = (this.W - bw * s) / 2 - x0 * s, oy = (this.H + bh * s) / 2 + y0 * s;
    this.s = s;
    var P = function (x, y) { return [ox + x * s, oy - y * s]; };
    this.P = P;
    return P;
  };
  Builder.prototype.add = function (s) { this.out.push(s); return this; };
  Builder.prototype.poly = function (pts, cls) { return this.add('<polygon class="' + cls + '" points="' + pts.map(function (q) { return r1(q[0]) + ',' + r1(q[1]); }).join(' ') + '"/>'); };
  Builder.prototype.line = function (a, b, cls) { return this.add('<line class="' + cls + '" x1="' + r1(a[0]) + '" y1="' + r1(a[1]) + '" x2="' + r1(b[0]) + '" y2="' + r1(b[1]) + '"/>'); };
  Builder.prototype.path = function (d, cls, extra) { return this.add('<path class="' + cls + '" d="' + d + '"' + (extra || '') + '/>'); };
  Builder.prototype.ell = function (c, rx, ry, cls) { return this.add('<ellipse class="' + cls + '" cx="' + r1(c[0]) + '" cy="' + r1(c[1]) + '" rx="' + r1(Math.max(rx, 0.1)) + '" ry="' + r1(Math.max(ry, 0.1)) + '"/>'); };
  Builder.prototype.dot = function (c) { return this.add('<circle class="dot" cx="' + r1(c[0]) + '" cy="' + r1(c[1]) + '" r="3.5"/>'); };
  Builder.prototype.text = function (x, y, s, opt) {
    opt = opt || {};
    var rot = opt.rot ? ' transform="rotate(' + r1(opt.rot) + ' ' + r1(x) + ' ' + r1(y) + ')"' : '';
    return this.add('<text class="lab' + (opt.cls ? ' ' + opt.cls : '') + '" x="' + r1(x) + '" y="' + r1(y) + '" text-anchor="' + (opt.anchor || 'middle') + '" dominant-baseline="central"' + rot + '>' + esc(s) + '</text>');
  };
  /* label an edge A→B on the side away from point C, rotated along the edge and kept upright */
  Builder.prototype.edge = function (A, B, s, C, gap) {
    gap = gap || this.fs * 0.85 + 3;
    var dx = B[0] - A[0], dy = B[1] - A[1], len = Math.sqrt(dx * dx + dy * dy) || 1;
    var nx = -dy / len, ny = dx / len, mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
    if (C && (nx * (mx - C[0]) + ny * (my - C[1])) < 0) { nx = -nx; ny = -ny; }
    var ang = Math.atan2(dy, dx) * 180 / Math.PI;
    if (ang > 90) ang -= 180; else if (ang < -90) ang += 180;
    if (Math.abs(Math.abs(ang) - 90) < 1) ang = -90;
    return this.text(mx + nx * gap, my + ny * gap, s, { rot: ang });
  };
  /* small right-angle mark at corner Q with arms towards U and V */
  Builder.prototype.right = function (Q, U, V) {
    var z = 11;
    var u = norm([U[0] - Q[0], U[1] - Q[1]]), v = norm([V[0] - Q[0], V[1] - Q[1]]);
    var a = [Q[0] + u[0] * z, Q[1] + u[1] * z], b = [a[0] + v[0] * z, a[1] + v[1] * z], c = [Q[0] + v[0] * z, Q[1] + v[1] * z];
    return this.path('M' + r1(a[0]) + ' ' + r1(a[1]) + 'L' + r1(b[0]) + ' ' + r1(b[1]) + 'L' + r1(c[0]) + ' ' + r1(c[1]), 'mark');
  };
  /* label for a vertical dashed segment at x from y0 to y1; 'room' = free width on the chosen side (dir -1 left, +1 right) */
  Builder.prototype.vlab = function (x, y0, y1, s, room, dir, cls) {
    var w = this.tw(s), my = (y0 + y1) / 2, len = Math.abs(y1 - y0);
    if (room >= w + 12) return this.text(x + dir * 8, my, s, { anchor: dir < 0 ? 'end' : 'start', cls: cls });
    if (len >= w + 8) return this.text(x + dir * this.fs * 0.75, my, s, { rot: -90, cls: cls });
    var ox = x + dir * (room + 10);
    if (dir < 0 && ox - w < 2) { dir = 1; ox = x + 8; }
    return this.text(ox, my, s, { anchor: dir < 0 ? 'end' : 'start', cls: cls });
  };
  Builder.prototype.svg = function (cls, title) {
    return '<svg class="fig' + (cls ? ' ' + cls : '') + '" viewBox="0 0 ' + this.W + ' ' + this.H + '" xmlns="http://www.w3.org/2000/svg" role="img" direction="ltr" style="font-size:' + r1(this.fs) + 'px"' +
      (title ? ' aria-label="' + esc(title) + '"' : '') + '>' + this.out.join('') + '</svg>';
  };
  function norm(v) { var l = Math.sqrt(v[0] * v[0] + v[1] * v[1]) || 1; return [v[0] / l, v[1] / l]; }
  function cen(pts) { var x = 0, y = 0; pts.forEach(function (p) { x += p[0]; y += p[1]; }); return [x / pts.length, y / pts.length]; }
  function arc(rx, ry, sweep, to) { return 'A' + r1(Math.max(rx, 0.1)) + ' ' + r1(Math.max(ry, 0.1)) + ' 0 0 ' + sweep + ' ' + r1(to[0]) + ' ' + r1(to[1]); }
  function M(p) { return 'M' + r1(p[0]) + ' ' + r1(p[1]); }
  function Lp(p) { return 'L' + r1(p[0]) + ' ' + r1(p[1]); }

  /* ---------------- 2D ---------------- */
  function draw2(b, shape, v, lab) {
    var P, pts, C;
    switch (shape) {
      case 'square': case 'rectangle': {
        var w = shape === 'square' ? v.a : v.l, h = shape === 'square' ? v.a : v.b;
        P = b.fit(0, 0, w, h);
        pts = [P(0, 0), P(w, 0), P(w, h), P(0, h)]; C = cen(pts);
        b.poly(pts, 'f1');
        b.line(pts[0], pts[2], 'aux');
        b.right(pts[0], pts[1], pts[3]); b.right(pts[1], pts[0], pts[2]); b.right(pts[2], pts[1], pts[3]); b.right(pts[3], pts[2], pts[0]);
        if (shape === 'square') { b.edge(pts[0], pts[1], lab('a'), C); b.edge(pts[1], pts[2], lab('a'), C); }
        else { b.edge(pts[0], pts[1], lab('l'), C); b.edge(pts[1], pts[2], lab('b'), C); }
        break;
      }
      case 'tri_bh': {
        var ax = 0.3 * v.b;
        P = b.fit(0, 0, v.b, v.h);
        pts = [P(0, 0), P(v.b, 0), P(ax, v.h)]; C = cen(pts);
        b.poly(pts, 'f1');
        var foot = P(ax, 0);
        b.line(pts[2], foot, 'dim'); b.right(foot, pts[1], pts[2]);
        b.edge(pts[0], pts[1], lab('b'), C);
        b.vlab(foot[0], foot[1], pts[2][1], lab('h'), 0.35 * v.b * b.s, 1, 'acc');
        break;
      }
      case 'tri_heron': {
        var A = v.a, B = v.b, Cc = v.c;
        var x = (Cc * Cc - B * B + A * A) / (2 * A), y = Math.sqrt(Math.max(Cc * Cc - x * x, 0));
        P = b.fit(Math.min(0, x), 0, Math.max(A, x), y);
        pts = [P(0, 0), P(A, 0), P(x, y)]; C = cen(pts);
        b.poly(pts, 'f1');
        b.edge(pts[0], pts[1], lab('a'), C); b.edge(pts[1], pts[2], lab('b'), C); b.edge(pts[2], pts[0], lab('c'), C);
        break;
      }
      case 'parallelogram': {
        var off = Math.sqrt(Math.max(v.a * v.a - v.h * v.h, 0));
        P = b.fit(0, 0, v.b + off, v.h);
        pts = [P(0, 0), P(v.b, 0), P(v.b + off, v.h), P(off, v.h)]; C = cen(pts);
        b.poly(pts, 'f1');
        var ft = P(off, 0);
        if (off > v.b) b.line(pts[1], ft, 'aux');
        b.line(pts[3], ft, 'dim'); b.right(ft, off > v.b ? pts[1] : pts[0], pts[3]);
        b.edge(pts[0], pts[1], lab('b'), C); b.edge(pts[0], pts[3], lab('a'), C);
        b.vlab(ft[0], ft[1], pts[3][1], lab('h'), Math.max(v.b - off, 0) * b.s + off * b.s / 2, 1, 'acc');
        break;
      }
      case 'rhombus': {
        var p = v.d1 / 2, q = v.d2 / 2;
        P = b.fit(-p, -q, p, q);
        pts = [P(-p, 0), P(0, -q), P(p, 0), P(0, q)]; C = cen(pts);
        b.poly(pts, 'f1');
        b.line(pts[0], pts[2], 'dim'); b.line(pts[1], pts[3], 'dim2');
        var O = P(0, 0); b.right(O, pts[2], pts[3]);
        b.text((O[0] + pts[0][0]) / 2, O[1] + b.fs * 0.85, lab('d₁'), { cls: 'acc' });
        b.vlab(O[0], O[1], pts[3][1], lab('d₂'), (O[0] - pts[0][0]) / 2, -1, 'acc2');
        break;
      }
      case 'trapezium': {
        var o = (v.a - v.b) / 2;
        P = b.fit(Math.min(0, o), 0, Math.max(v.a, o + v.b), v.h);
        pts = [P(0, 0), P(v.a, 0), P(o + v.b, v.h), P(o, v.h)]; C = cen(pts);
        b.poly(pts, 'f1');
        var hx = v.a / 2, h0 = P(hx, 0), h1 = P(hx, v.h);
        b.line(h0, h1, 'dim'); b.right(h0, pts[1], h1);
        b.edge(pts[0], pts[1], lab('a'), C); b.edge(pts[3], pts[2], lab('b'), C);
        b.vlab(h0[0], h0[1], h1[1], lab('h'), (v.a + v.b) / 4 * b.s, 1, 'acc');
        break;
      }
      case 'circle': case 'semicircle': {
        var r = v.r, semi = shape === 'semicircle';
        P = semi ? b.fit(-r, 0, r, r) : b.fit(-r, -r, r, r);
        var c = P(0, 0), R = r * b.s;
        if (semi) {
          b.path(M(P(-r, 0)) + arc(R, R, 1, P(r, 0)) + 'Z', 'f1');
          var t = P(r * Math.cos(Math.PI / 3), r * Math.sin(Math.PI / 3));
          b.line(c, t, 'dim'); b.dot(c);
          b.edge(c, t, lab('r'), P(r, 0), 14);
        } else {
          b.add('<circle class="f1" cx="' + r1(c[0]) + '" cy="' + r1(c[1]) + '" r="' + r1(R) + '"/>');
          var e = P(r, 0);
          b.line(c, e, 'dim'); b.dot(c);
          b.text((c[0] + e[0]) / 2, c[1] - b.fs * 0.85, lab('r'), { cls: 'acc' });
        }
        break;
      }
      case 'ring': {
        P = b.fit(-v.R, -v.R, v.R, v.R);
        var cc = P(0, 0), RO = v.R * b.s, RI = v.r * b.s;
        b.path('M' + r1(cc[0] - RO) + ' ' + r1(cc[1]) + 'a' + r1(RO) + ' ' + r1(RO) + ' 0 1 0 ' + r1(2 * RO) + ' 0a' + r1(RO) + ' ' + r1(RO) + ' 0 1 0 ' + r1(-2 * RO) + ' 0Z' +
          'M' + r1(cc[0] - RI) + ' ' + r1(cc[1]) + 'a' + r1(RI) + ' ' + r1(RI) + ' 0 1 0 ' + r1(2 * RI) + ' 0a' + r1(RI) + ' ' + r1(RI) + ' 0 1 0 ' + r1(-2 * RI) + ' 0Z', 'f1', ' fill-rule="evenodd"');
        var po = [cc[0] + RO, cc[1]], pi = [cc[0] - RI, cc[1]];
        b.line(cc, po, 'dim'); b.line(cc, pi, 'dim2'); b.dot(cc);
        b.text(cc[0] + RO / 2, cc[1] - b.fs * 0.85, lab('R'), { cls: 'acc' });
        b.text(cc[0] - RI / 2, cc[1] + b.fs * 0.85, lab('r'), { cls: 'acc2' });
        break;
      }
    }
  }

  /* ---------------- 3D ---------------- */
  function box(b, l, h, d, lab, syms) {
    var k = OB.k * d, dx = k * OB.c, dy = k * OB.s;
    var P = b.fit(0, 0, l + dx, h + dy);
    var Q = function (x, y, z) { var f = OB.k * z; return P(x + f * OB.c, y + f * OB.s); };
    var A0 = Q(0, 0, 0), B0 = Q(l, 0, 0), C0 = Q(l, h, 0), D0 = Q(0, h, 0);
    var A1 = Q(0, 0, d), B1 = Q(l, 0, d), C1 = Q(l, h, d), D1 = Q(0, h, d);
    var mid = cen([A0, B0, C0, D0, A1, B1, C1, D1]);
    b.line(A1, B1, 'hid'); b.line(A1, D1, 'hid'); b.line(A1, A0, 'hid');
    b.poly([D0, C0, C1, D1], 'f2');
    b.poly([B0, B1, C1, C0], 'f3');
    b.poly([A0, B0, C0, D0], 'f1');
    b.edge(A0, B0, lab(syms[0]), mid);
    b.edge(A0, D0, lab(syms[2]), mid);
    b.edge(B0, B1, lab(syms[1]), mid);
  }

  function draw3(b, shape, v, lab) {
    var P;
    switch (shape) {
      case 'cube': box(b, v.a, v.a, v.a, lab, ['a', 'a', 'a']); break;
      case 'cuboid': box(b, v.l, v.h, v.b, lab, ['l', 'b', 'h']); break;
      case 'cylinder': {
        var r = v.r, h = v.h;
        P = b.fit(-r, -K * r, r, h + K * r);
        var rx = r * b.s, ry = rx * K, bc = P(0, 0), tc = P(0, h);
        var bl = [bc[0] - rx, bc[1]], br = [bc[0] + rx, bc[1]], tl = [tc[0] - rx, tc[1]], tr = [tc[0] + rx, tc[1]];
        b.path(M(tl) + Lp(bl) + arc(rx, ry, 0, br) + Lp(tr) + 'Z', 'f1');
        b.path(M(bl) + arc(rx, ry, 1, br), 'hid');
        b.ell(tc, rx, ry, 'f2');
        b.line(tc, tr, 'dim'); b.dot(tc);
        b.text((tc[0] + tr[0]) / 2, tc[1] - ry - b.fs * 0.85, lab('r'), { cls: 'acc' });
        b.edge(br, tr, lab('h'), bc, 16);
        break;
      }
      case 'cone': {
        var cr = v.r, ch = v.h;
        P = b.fit(-cr, -K * cr, cr, ch);
        var crx = cr * b.s, cry = crx * K, c0 = P(0, 0), apex = P(0, ch);
        var cl = [c0[0] - crx, c0[1]], cR = [c0[0] + crx, c0[1]];
        b.path(M(apex) + Lp(cR) + arc(crx, cry, 1, cl) + 'Z', 'f1');
        b.path(M(cR) + arc(crx, cry, 0, cl), 'hid');
        b.line(apex, c0, 'dim2'); b.line(c0, cR, 'dim'); b.dot(c0);
        b.right(c0, cR, apex);
        b.text((c0[0] + cR[0]) / 2, c0[1] + cry + b.fs * 0.85, lab('r'), { cls: 'acc' });
        b.vlab(c0[0], c0[1], apex[1], lab('h'), crx / 2, -1, 'acc2');
        b.edge(cR, apex, lab('l'), c0, 16);
        break;
      }
      case 'sphere': {
        var sr = v.r;
        P = b.fit(-sr, -sr, sr, sr);
        var sc = P(0, 0), SR = sr * b.s;
        b.add('<circle class="f1" cx="' + r1(sc[0]) + '" cy="' + r1(sc[1]) + '" r="' + r1(SR) + '"/>');
        b.add('<ellipse class="shine" cx="' + r1(sc[0] - SR * 0.35) + '" cy="' + r1(sc[1] - SR * 0.4) + '" rx="' + r1(SR * 0.28) + '" ry="' + r1(SR * 0.18) + '"/>');
        var el = [sc[0] - SR, sc[1]], er = [sc[0] + SR, sc[1]];
        b.path(M(el) + arc(SR, SR * K, 0, er), 'edge');
        b.path(M(el) + arc(SR, SR * K, 1, er), 'hid');
        b.line(sc, er, 'dim'); b.dot(sc);
        b.text((sc[0] + er[0]) / 2, sc[1] - b.fs * 0.85, lab('r'), { cls: 'acc' });
        break;
      }
      case 'hemisphere': {
        var hr = v.r;
        P = b.fit(-hr, -hr, hr, K * hr);
        var hc = P(0, 0), HR = hr * b.s;
        var hl = [hc[0] - HR, hc[1]], hR = [hc[0] + HR, hc[1]];
        b.path(M(hl) + arc(HR, HR, 0, hR) + 'Z', 'f1');
        b.ell(hc, HR, HR * K, 'f2');
        b.line(hc, hR, 'dim'); b.dot(hc);
        b.text((hc[0] + hR[0]) / 2, hc[1] - b.fs * 0.85, lab('r'), { cls: 'acc' });
        break;
      }
      case 'frustum': {
        var a1 = v.r1, a2 = v.r2, fh = v.h, mx = Math.max(a1, a2);
        P = b.fit(-mx, -K * a2, mx, fh + K * a1);
        var s = b.s, b0 = P(0, 0), t0 = P(0, fh), rx1 = a1 * s, rx2 = a2 * s;
        var BL = [b0[0] - rx2, b0[1]], BR = [b0[0] + rx2, b0[1]], TL = [t0[0] - rx1, t0[1]], TR = [t0[0] + rx1, t0[1]];
        b.path(M(TL) + Lp(BL) + arc(rx2, rx2 * K, 0, BR) + Lp(TR) + 'Z', 'f1');
        b.path(M(BL) + arc(rx2, rx2 * K, 1, BR), 'hid');
        b.ell(t0, rx1, rx1 * K, 'f2');
        b.line(b0, t0, 'dim2'); b.line(t0, TR, 'dim'); b.line(b0, BR, 'dim'); b.dot(t0); b.dot(b0);
        b.text((t0[0] + TR[0]) / 2, t0[1] - rx1 * K - b.fs * 0.85, lab('r₁'), { cls: 'acc' });
        b.text((b0[0] + BR[0]) / 2, b0[1] + rx2 * K + b.fs * 0.85, lab('r₂'), { cls: 'acc' });
        b.vlab(b0[0], b0[1], t0[1], lab('h'), (rx1 + rx2) / 2, -1, 'acc2');
        b.edge(BR, TR, lab('l'), [b0[0], (b0[1] + t0[1]) / 2], 16);
        break;
      }
    }
  }

  window.ML_DRAW = function (shape, vals, opts) {
    opts = opts || {};
    var small = !!opts.small;
    var b = small ? new Builder(340, 240, [46, 34], opts.fs || 17) : new Builder(480, 320, [64, 40], opts.fs || 16);
    var lab = opts.lab || function (s) { return s; };
    var g3 = ['cube', 'cuboid', 'cylinder', 'cone', 'sphere', 'hemisphere', 'frustum'].indexOf(shape) >= 0;
    try { (g3 ? draw3 : draw2)(b, shape, vals, lab); } catch (e) { b.out = []; }
    return b.svg(small ? 'sm' : '', opts.title);
  };
})();
