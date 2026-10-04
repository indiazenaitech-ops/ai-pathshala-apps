/* Invitation Card Maker: Indian motifs drawn on canvas from code (no clip art, no copyrighted images).
 * Paisley, marigold toran, kalash, lotus, peacock feather, diya, jaali, roses, mandala, balloons, banana leaf,
 * kolam, ribbons, rings, hearts, plus frames, corner ornaments and background patterns.
 *   ICM_ART.background(ctx, W, H, pal, design, rnd, u)   ICM_ART.frame(ctx, W, H, pal, kind, u)
 *   ICM_ART.corners(ctx, W, H, pal, kind, u)              ICM_ART.top[kind](ctx, W, h, pal, rnd, u, extra)
 *   ICM_ART.bottom[kind](ctx, W, H, h, pal, rnd, u)       ICM_ART.symbol(ctx, kind, cx, cy, s, col)
 * u = 1 for a 1080 px wide card; rnd = seeded random so the same card always looks the same. */
window.ICM_ART = (function () {
  'use strict';
  var PI = Math.PI, TAU = PI * 2;

  /* ------------------------------------------------------------ helpers */
  function rng(seed) {
    var s = (seed >>> 0) || 1;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function toRgb(c) {
    c = String(c).trim();
    var m = c.match(/^rgba?\(([^)]+)\)/);
    if (m) { var p = m[1].split(',').map(parseFloat); return [p[0], p[1], p[2]]; }
    c = c.replace('#', '');
    if (c.length === 3) c = c.split('').map(function (x) { return x + x; }).join('');
    var n = parseInt(c, 16) || 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgba(c, a) { var r = toRgb(c); return 'rgba(' + r[0] + ',' + r[1] + ',' + r[2] + ',' + a + ')'; }
  function shade(c, t) {
    var r = toRgb(c), k = t < 0 ? 0 : 255, a = Math.abs(t);
    return 'rgb(' + r.map(function (v) { return Math.round(v + (k - v) * a); }).join(',') + ')';
  }
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU); }
  function rrect(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function star(ctx, x, y, r1, r2, n, rot) {
    ctx.beginPath();
    for (var i = 0; i < n * 2; i++) {
      var r = i % 2 ? r2 : r1, a = (rot === undefined ? -PI / 2 : rot) + i * PI / n;
      var px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();
  }
  function diamond(ctx, x, y, r) { ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); }
  /* petal from the origin pointing up (-y) */
  function petal(ctx, len, wid) {
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(wid, -len * 0.3, wid * 0.7, -len * 0.82, 0, -len);
    ctx.bezierCurveTo(-wid * 0.7, -len * 0.82, -wid, -len * 0.3, 0, 0);
    ctx.closePath();
  }
  function lgrad(ctx, x0, y0, x1, y1, cols) {
    var g = ctx.createLinearGradient(x0, y0, x1, y1);
    cols.forEach(function (c, i) { g.addColorStop(cols.length === 1 ? 0 : i / (cols.length - 1), c); });
    return g;
  }
  function glow(ctx, x, y, r, col, a) {
    if (r <= 0) return;
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(col, a)); g.addColorStop(0.5, rgba(col, a * 0.4)); g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g; circle(ctx, x, y, r); ctx.fill();
  }
  function sparkle(ctx, x, y, r, col) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill();
  }
  function heartPath(ctx, cx, cy, s) {
    ctx.beginPath(); ctx.moveTo(cx, cy + s * 0.95);
    ctx.bezierCurveTo(cx - s * 1.1, cy + s * 0.2, cx - s * 0.9, cy - s * 0.8, cx, cy - s * 0.35);
    ctx.bezierCurveTo(cx + s * 0.9, cy - s * 0.8, cx + s * 1.1, cy + s * 0.2, cx, cy + s * 0.95);
    ctx.closePath();
  }

  /* ------------------------------------------------------------ motifs */
  /* paisley (ambi / mango): a teardrop whose tip is bent over, built from points so the curl is smooth.
     s = height; the round end sits near (x, y + s*0.3), the curled tip bends to the right. */
  function paisleyPts(s, scale) {
    var R = s * 0.33, tipY = -s * 0.72, pts = [], a0 = -0.3, a;
    for (a = a0; a <= PI - a0; a += 0.14) pts.push([Math.cos(a) * R, Math.sin(a) * R]);
    var P0 = pts[pts.length - 1], P1 = [0, tipY], C = [-R * 1.05, tipY * 0.42], tt;
    for (tt = 0.06; tt < 1; tt += 0.06) pts.push([(1 - tt) * (1 - tt) * P0[0] + 2 * (1 - tt) * tt * C[0] + tt * tt * P1[0], (1 - tt) * (1 - tt) * P0[1] + 2 * (1 - tt) * tt * C[1] + tt * tt * P1[1]]);
    pts.push(P1);
    var Q0 = pts[0], C2 = [R * 1.05, tipY * 0.42];
    for (tt = 0.06; tt < 1; tt += 0.06) pts.push([(1 - tt) * (1 - tt) * P1[0] + 2 * (1 - tt) * tt * C2[0] + tt * tt * Q0[0], (1 - tt) * (1 - tt) * P1[1] + 2 * (1 - tt) * tt * C2[1] + tt * tt * Q0[1]]);
    /* bend everything above yb around (0, yb): the higher the point, the more it turns */
    var yb = -R * 0.1, bend = 1.05, out = [];
    pts.forEach(function (p) {
      var x = p[0] * scale, y = p[1] * scale, yb2 = yb * scale;
      if (y < yb2) { var f = (yb2 - y) / (yb2 - tipY * scale), ang = bend * f * f, dx = x, dy = y - yb2; x = dx * Math.cos(ang) - dy * Math.sin(ang); y = yb2 + dx * Math.sin(ang) + dy * Math.cos(ang); }
      out.push([x, y]);
    });
    return out;
  }
  function polyPath(ctx, pts) { ctx.beginPath(); pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.closePath(); }
  function paisley(ctx, x, y, s, rot, col, fill) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    var outer = paisleyPts(s, 1), inner = paisleyPts(s, 0.6), dots = paisleyPts(s, 0.82);
    if (fill) { ctx.fillStyle = fill; polyPath(ctx, outer); ctx.fill(); }
    ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, s * 0.035); polyPath(ctx, outer); ctx.stroke();
    ctx.lineWidth = Math.max(0.8, s * 0.022); polyPath(ctx, inner); ctx.stroke();
    ctx.fillStyle = col;
    for (var i = 0; i < dots.length; i += 3) { circle(ctx, dots[i][0], dots[i][1], Math.max(0.6, s * 0.018)); ctx.fill(); }
    circle(ctx, 0, s * 0.12, s * 0.05); ctx.fill();
    ctx.restore();
  }
  function marigold(ctx, x, y, r, col) {
    ctx.save(); ctx.translate(x, y);
    [1, 0.78, 0.55, 0.32].forEach(function (k, i) {
      ctx.fillStyle = i % 2 ? shade(col, 0.22) : shade(col, -0.1 * i);
      for (var j = 0; j < 9; j++) { ctx.save(); ctx.rotate(j * TAU / 9 + i * 0.35); petal(ctx, r * k, r * k * 0.36); ctx.fill(); ctx.restore(); }
    });
    ctx.fillStyle = shade(col, -0.35); circle(ctx, 0, 0, r * 0.14); ctx.fill();
    ctx.restore();
  }
  function mangoLeaf(ctx, x, y, len, ang, c1, c2) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = lgrad(ctx, 0, 0, 0, len, [c1, c2]);
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(len * 0.3, len * 0.2, len * 0.28, len * 0.75, 0, len);
    ctx.bezierCurveTo(-len * 0.28, len * 0.75, -len * 0.3, len * 0.2, 0, 0); ctx.fill();
    ctx.strokeStyle = rgba('#ffffff', 0.35); ctx.lineWidth = Math.max(1, len * 0.02);
    ctx.beginPath(); ctx.moveTo(0, len * 0.05); ctx.lineTo(0, len * 0.92); ctx.stroke();
    ctx.restore();
  }
  function flame(ctx, fx, fy, fh, fw) {
    glow(ctx, fx, fy - fh * 0.45, fh * 1.2, '#ffd166', 0.5);
    var g = ctx.createRadialGradient(fx, fy - fh * 0.22, fw * 0.1, fx, fy - fh * 0.35, fh * 0.85);
    g.addColorStop(0, '#fffdf0'); g.addColorStop(0.35, '#ffe066'); g.addColorStop(0.75, '#ff9f1c'); g.addColorStop(1, '#ff5400');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(fx, fy - fh);
    ctx.bezierCurveTo(fx + fw * 0.5, fy - fh * 0.6, fx + fw, fy - fh * 0.25, fx, fy);
    ctx.bezierCurveTo(fx - fw, fy - fh * 0.25, fx - fw * 0.5, fy - fh * 0.6, fx, fy - fh); ctx.fill();
  }
  function diya(ctx, x, y, s, gold) {
    ctx.save();
    ctx.fillStyle = lgrad(ctx, 0, y - s * 0.05, 0, y + s * 0.3, ['#d97a3a', '#9a3f18', '#5f2209']);
    ctx.beginPath(); ctx.ellipse(x, y, s / 2, s * 0.28, 0, 0, PI); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4e1a07'; ctx.beginPath(); ctx.ellipse(x, y, s / 2, s * 0.09, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e8a33a'; ctx.beginPath(); ctx.ellipse(x, y + s * 0.005, s * 0.42, s * 0.06, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = gold || '#f2c14e';
    for (var i = -2; i <= 2; i++) { circle(ctx, x + i * s * 0.16, y + s * 0.15 * Math.sqrt(Math.max(0, 1 - Math.pow(i * 0.32, 2))), s * 0.024); ctx.fill(); }
    flame(ctx, x, y - s * 0.02, s * 0.5, s * 0.15);
    ctx.restore();
  }
  /* brass kalash: round pot, narrow neck with a flared mouth, mango leaves fanning out and a coconut on top. s = width */
  function kalash(ctx, cx, by, s, pal) {
    ctx.save();
    var brass = ['#7a4a10', '#f6dc8c', '#d9a53a', '#8a5a14'], metal = lgrad(ctx, cx - s / 2, 0, cx + s / 2, 0, brass);
    /* mango leaves fan out from the mouth (behind the coconut) */
    [-1.05, -0.55, 0, 0.55, 1.05].forEach(function (a, i) { mangoLeaf(ctx, cx, by - s * 0.98, s * (i === 2 ? 0.46 : 0.42), PI + a, '#2e7d32', '#8bc34a'); });
    /* coconut */
    ctx.fillStyle = lgrad(ctx, 0, by - s * 1.42, 0, by - s * 1.0, ['#a9784a', '#5a3517']);
    ctx.beginPath(); ctx.ellipse(cx, by - s * 1.2, s * 0.17, s * 0.21, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,230,180,.5)'; ctx.lineWidth = s * 0.015;
    ctx.beginPath(); ctx.moveTo(cx - s * 0.05, by - s * 1.38); ctx.quadraticCurveTo(cx, by - s * 1.2, cx - s * 0.03, by - s * 1.02); ctx.stroke();
    /* body */
    ctx.fillStyle = metal;
    ctx.beginPath(); ctx.moveTo(cx - s * 0.17, by - s * 0.8);
    ctx.bezierCurveTo(cx - s * 0.66, by - s * 0.74, cx - s * 0.62, by - s * 0.02, cx - s * 0.28, by);
    ctx.lineTo(cx + s * 0.28, by);
    ctx.bezierCurveTo(cx + s * 0.62, by - s * 0.02, cx + s * 0.66, by - s * 0.74, cx + s * 0.17, by - s * 0.8); ctx.closePath(); ctx.fill();
    /* foot ring, neck and flared mouth */
    ctx.fillStyle = metal;
    ctx.beginPath(); ctx.ellipse(cx, by, s * 0.3, s * 0.05, 0, 0, TAU); ctx.fill();
    ctx.fillRect(cx - s * 0.17, by - s * 0.92, s * 0.34, s * 0.14);
    ctx.beginPath(); ctx.moveTo(cx - s * 0.17, by - s * 0.92); ctx.lineTo(cx - s * 0.3, by - s * 1.0); ctx.lineTo(cx + s * 0.3, by - s * 1.0); ctx.lineTo(cx + s * 0.17, by - s * 0.92); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, by - s * 1.0, s * 0.3, s * 0.06, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5a3517'; ctx.beginPath(); ctx.ellipse(cx, by - s * 1.0, s * 0.22, s * 0.035, 0, 0, TAU); ctx.fill();
    /* highlight, decorative band, kumkum tilak */
    ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.ellipse(cx - s * 0.26, by - s * 0.5, s * 0.07, s * 0.22, 0.15, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(120,70,10,.45)'; ctx.lineWidth = s * 0.02;
    ctx.beginPath(); ctx.ellipse(cx, by - s * 0.36, s * 0.52, s * 0.08, 0, 0.12, PI - 0.12); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, by - s * 0.56, s * 0.56, s * 0.08, 0, 0.12, PI - 0.12); ctx.stroke();
    ctx.fillStyle = '#c62828'; ctx.beginPath(); ctx.moveTo(cx, by - s * 0.7); ctx.quadraticCurveTo(cx + s * 0.075, by - s * 0.5, cx, by - s * 0.28); ctx.quadraticCurveTo(cx - s * 0.075, by - s * 0.5, cx, by - s * 0.7); ctx.fill();
    ctx.fillStyle = '#ffd54f'; circle(ctx, cx, by - s * 0.49, s * 0.035); ctx.fill();
    ctx.restore();
  }
  function lotus(ctx, cx, by, s, cols) {
    ctx.save(); ctx.translate(cx, by);
    var c1 = cols[0], c2 = cols[1];
    /* back row */
    for (var i = -3; i <= 3; i++) {
      ctx.save(); ctx.rotate(i * 0.3);
      ctx.fillStyle = lgrad(ctx, 0, 0, 0, -s, [shade(c1, -0.1), shade(c2, 0.2)]);
      petal(ctx, s * (1 - Math.abs(i) * 0.07), s * 0.2); ctx.fill(); ctx.restore();
    }
    for (var j = -2; j <= 2; j++) {
      ctx.save(); ctx.rotate(j * 0.34);
      ctx.fillStyle = lgrad(ctx, 0, 0, 0, -s * 0.75, [c1, shade(c2, 0.45)]);
      petal(ctx, s * 0.78 * (1 - Math.abs(j) * 0.06), s * 0.2); ctx.fill(); ctx.restore();
    }
    ctx.fillStyle = '#f9d976'; ctx.beginPath(); ctx.ellipse(0, -s * 0.08, s * 0.2, s * 0.1, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function feather(ctx, x, y, len, ang, u) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.lineCap = 'round';
    /* barbs */
    for (var i = 0; i < 46; i++) {
      var t = i / 46, yy = -len * 0.08 - t * len * 0.78, w = len * (0.07 + Math.sin(t * PI) * 0.17);
      ctx.strokeStyle = rgba(i % 2 ? '#1fa8b8' : '#2b7a3b', 0.75 + 0.2 * Math.sin(t * PI)); ctx.lineWidth = Math.max(1, len * 0.012);
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.quadraticCurveTo(w * 0.6, yy - len * 0.03, w, yy - len * 0.08); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.quadraticCurveTo(-w * 0.6, yy - len * 0.03, -w, yy - len * 0.08); ctx.stroke();
    }
    /* stem */
    ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = Math.max(1.2, len * 0.018);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -len * 0.86); ctx.stroke();
    /* eye */
    var ey = -len * 0.66, er = len * 0.13;
    ctx.fillStyle = '#1b5e20'; ctx.beginPath(); ctx.ellipse(0, ey, er * 1.05, er * 1.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#0d47a1'; ctx.beginPath(); ctx.ellipse(0, ey + er * 0.1, er * 0.78, er * 1.12, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#26c6da'; ctx.beginPath(); ctx.ellipse(0, ey + er * 0.2, er * 0.5, er * 0.72, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f9d976'; ctx.beginPath(); ctx.ellipse(0, ey + er * 0.3, er * 0.22, er * 0.3, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function rose(ctx, x, y, r, col) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = shade(col, -0.15);
    for (var j = 0; j < 7; j++) { ctx.save(); ctx.rotate(j * TAU / 7); petal(ctx, r, r * 0.5); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = col;
    for (var k = 0; k < 6; k++) { ctx.save(); ctx.rotate(k * TAU / 6 + 0.5); petal(ctx, r * 0.72, r * 0.42); ctx.fill(); ctx.restore(); }
    ctx.strokeStyle = shade(col, -0.35); ctx.lineWidth = Math.max(1, r * 0.06); ctx.lineCap = 'round';
    ctx.beginPath();
    for (var a = 0; a < TAU * 2.4; a += 0.2) { var rr = r * 0.08 + a * r * 0.055; var px = Math.cos(a) * rr, py = Math.sin(a) * rr; if (a) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
    ctx.stroke();
    ctx.restore();
  }
  function leafSimple(ctx, x, y, len, ang, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.5, len * 0.1, len, 0); ctx.quadraticCurveTo(len * 0.5, -len * 0.42, 0, 0); ctx.fill();
    ctx.strokeStyle = rgba('#ffffff', 0.45); ctx.lineWidth = Math.max(1, len * 0.03); ctx.beginPath(); ctx.moveTo(len * 0.1, -len * 0.02); ctx.lineTo(len * 0.9, -len * 0.08); ctx.stroke();
    ctx.restore();
  }
  function balloon(ctx, x, y, r, col, strTo) {
    ctx.save();
    ctx.strokeStyle = rgba('#555555', 0.5); ctx.lineWidth = Math.max(1, r * 0.05);
    ctx.beginPath(); ctx.moveTo(x, y + r * 1.25); ctx.quadraticCurveTo(x + r * 0.5, y + r * 2.2, strTo[0], strTo[1]); ctx.stroke();
    var g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.2);
    g.addColorStop(0, shade(col, 0.5)); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, -0.25));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, r, r * 1.18, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = shade(col, -0.2); ctx.beginPath(); ctx.moveTo(x, y + r * 1.12); ctx.lineTo(x - r * 0.14, y + r * 1.3); ctx.lineTo(x + r * 0.14, y + r * 1.3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(x - r * 0.4, y - r * 0.5, r * 0.16, r * 0.3, -0.5, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function bananaLeaf(ctx, x, y, len, ang, u) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = lgrad(ctx, 0, 0, 0, len, ['#2e7d32', '#66bb6a']);
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(len * 0.32, len * 0.08, len * 0.34, len * 0.7, 0, len);
    ctx.bezierCurveTo(-len * 0.34, len * 0.7, -len * 0.32, len * 0.08, 0, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = Math.max(1, len * 0.012);
    for (var i = 1; i < 12; i++) {
      var t = i / 12, yy = len * t, w = len * 0.3 * Math.sin(t * PI) * 0.95;
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy + len * 0.05); ctx.moveTo(0, yy); ctx.lineTo(-w, yy + len * 0.05); ctx.stroke();
    }
    ctx.strokeStyle = '#c8e6c9'; ctx.lineWidth = Math.max(1.5, len * 0.022); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, len * 0.97); ctx.stroke();
    ctx.restore();
  }
  function ring(ctx, cx, cy, r, gold, u) {
    ctx.save();
    ctx.strokeStyle = lgrad(ctx, cx - r, cy - r, cx + r, cy + r, [shade(gold, 0.5), gold, shade(gold, -0.3), gold]);
    ctx.lineWidth = r * 0.22; circle(ctx, cx, cy, r); ctx.stroke();
    ctx.restore();
  }
  function bow(ctx, cx, cy, s, col) {
    ctx.save(); ctx.translate(cx, cy);
    ctx.fillStyle = shade(col, -0.1);
    [[-1, 0], [1, 0]].forEach(function (d) {
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(d[0] * s * 0.3, -s * 0.55, d[0] * s * 1.1, -s * 0.5, d[0] * s * 0.95, 0);
      ctx.bezierCurveTo(d[0] * s * 1.1, s * 0.5, d[0] * s * 0.3, s * 0.55, 0, 0); ctx.fill();
    });
    ctx.fillStyle = shade(col, -0.25);
    [-1, 1].forEach(function (d) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(d * s * 0.42, s * 0.95); ctx.lineTo(d * s * 0.12, s * 1.0); ctx.lineTo(0, s * 0.15); ctx.closePath(); ctx.fill(); });
    ctx.fillStyle = shade(col, 0.2); rrect(ctx, -s * 0.16, -s * 0.16, s * 0.32, s * 0.32, s * 0.08); ctx.fill();
    ctx.restore();
  }

  /* ------------------------------------------------------------ background patterns */
  function background(ctx, W, H, pal, design, rnd, u) {
    ctx.fillStyle = lgrad(ctx, 0, 0, W * 0.25, H, [pal.bg[0], pal.bg[1]]);
    ctx.fillRect(0, 0, W, H);
    var v = ctx.createRadialGradient(W / 2, H * 0.4, Math.min(W, H) * 0.15, W / 2, H * 0.4, Math.max(W, H) * 0.85);
    if (pal.dark) { v.addColorStop(0, 'rgba(255,255,255,.07)'); v.addColorStop(1, 'rgba(0,0,0,.4)'); }
    else { v.addColorStop(0, 'rgba(255,255,255,.4)'); v.addColorStop(1, 'rgba(255,255,255,0)'); }
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    var k = design.bgp, a = pal.dark ? 0.08 : 0.11;
    ctx.save();
    if (k === 'rays') {
      var rx = W / 2, ry = H * 0.3, RR = Math.hypot(W, H);
      ctx.fillStyle = rgba(pal.gold, a * 0.6);
      for (var i = 0; i < 36; i += 2) { ctx.beginPath(); ctx.moveTo(rx, ry); ctx.arc(rx, ry, RR, i * TAU / 36, (i + 1) * TAU / 36); ctx.closePath(); ctx.fill(); }
    } else if (k === 'dots') {
      var s = 54 * u; ctx.fillStyle = rgba(pal.gold, a + 0.03);
      for (var y = s / 2, row = 0; y < H; y += s * 0.866, row++) for (var x = row % 2 ? s : s / 2; x < W; x += s) { circle(ctx, x, y, 2.6 * u); ctx.fill(); }
    } else if (k === 'jaali') {
      var q = 92 * u; ctx.strokeStyle = rgba(pal.gold, a); ctx.lineWidth = 1.8 * u;
      for (var gy = -q; gy < H + q; gy += q) for (var gx = -q + (Math.round(gy / q) % 2) * q / 2; gx < W + q; gx += q) {
        star(ctx, gx, gy, q * 0.5, q * 0.21, 8, 0); ctx.stroke();
        circle(ctx, gx, gy, q * 0.12); ctx.stroke();
      }
    } else if (k === 'damask') {
      var d = 150 * u; ctx.globalAlpha = a * 0.9;
      for (var dy = -d; dy < H + d; dy += d) for (var dx = -d + (Math.round(dy / d) % 2) * d / 2; dx < W + d; dx += d) {
        paisley(ctx, dx, dy, d * 0.42, 0.5, pal.gold, null);
        paisley(ctx, dx + d * 0.5, dy + d * 0.5, d * 0.42, 0.5 + PI, pal.gold, null);
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  /* ------------------------------------------------------------ frames + corners */
  function frame(ctx, W, H, pal, kind, u) {
    if (!kind || kind === 'none') return;
    var i = 34 * u;
    ctx.save(); ctx.strokeStyle = pal.gold; ctx.fillStyle = pal.gold; ctx.lineJoin = 'round';
    if (kind === 'thin') {
      ctx.globalAlpha = 0.9; ctx.lineWidth = 2.2 * u; ctx.strokeRect(i, i, W - 2 * i, H - 2 * i);
    } else if (kind === 'double') {
      ctx.globalAlpha = 0.95; ctx.lineWidth = 3.2 * u; ctx.strokeRect(i, i, W - 2 * i, H - 2 * i);
      var j = i + 12 * u; ctx.lineWidth = 1.2 * u; ctx.strokeRect(j, j, W - 2 * j, H - 2 * j);
      [[W / 2, i], [W / 2, H - i], [i, H / 2], [W - i, H / 2]].forEach(function (p) { diamond(ctx, p[0], p[1], 9 * u); ctx.fill(); });
    } else if (kind === 'geo') {
      ctx.globalAlpha = 0.95; ctx.lineWidth = 5 * u; ctx.strokeRect(i, i, W - 2 * i, H - 2 * i);
      var j2 = i + 14 * u; ctx.lineWidth = 1.6 * u; ctx.strokeRect(j2, j2, W - 2 * j2, H - 2 * j2);
      [[i, i], [W - i, i], [i, H - i], [W - i, H - i]].forEach(function (p) {
        ctx.fillStyle = pal.gold; diamond(ctx, p[0], p[1], 20 * u); ctx.fill();
        ctx.fillStyle = pal.bg[0]; diamond(ctx, p[0], p[1], 8 * u); ctx.fill();
      });
    } else if (kind === 'arch') {
      /* Mughal arch: pointed arch at the top, straight sides, scalloped inner edge */
      var r = (W - 2 * i) / 2, cx = W / 2, top = i + r * 0.55;
      ctx.lineWidth = 3 * u; ctx.globalAlpha = 0.95;
      ctx.beginPath(); ctx.moveTo(i, H - i); ctx.lineTo(i, top);
      ctx.bezierCurveTo(i, top - r * 0.75, cx - r * 0.55, top - r * 0.62, cx, top - r * 0.9);
      ctx.bezierCurveTo(cx + r * 0.55, top - r * 0.62, W - i, top - r * 0.75, W - i, top);
      ctx.lineTo(W - i, H - i); ctx.closePath(); ctx.stroke();
      ctx.lineWidth = 1.2 * u; var j3 = 11 * u, i2 = i + j3, r2 = r - j3, top2 = top;
      ctx.beginPath(); ctx.moveTo(i2, H - i2); ctx.lineTo(i2, top2);
      ctx.bezierCurveTo(i2, top2 - r2 * 0.75, cx - r2 * 0.55, top2 - r2 * 0.62, cx, top2 - r2 * 0.9);
      ctx.bezierCurveTo(cx + r2 * 0.55, top2 - r2 * 0.62, W - i2, top2 - r2 * 0.75, W - i2, top2);
      ctx.lineTo(W - i2, H - i2); ctx.closePath(); ctx.stroke();
      ctx.fillStyle = pal.gold; star(ctx, cx, top - r * 0.9 - 2 * u, 16 * u, 7 * u, 8, 0); ctx.fill();
      [[i, H - i], [W - i, H - i]].forEach(function (p) { diamond(ctx, p[0], p[1], 12 * u); ctx.fill(); });
    }
    ctx.restore();
  }
  function corners(ctx, W, H, pal, kind, u) {
    if (!kind || kind === 'none') return;
    var m = 48 * u;
    [[m, m, 0], [W - m, m, PI / 2], [W - m, H - m, PI], [m, H - m, -PI / 2]].forEach(function (c) {
      ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(c[2]);
      if (kind === 'paisley') {
        paisley(ctx, 70 * u, 36 * u, 72 * u, PI * 0.9, pal.gold, rgba(pal.gold, 0.12));
        paisley(ctx, 36 * u, 72 * u, 52 * u, PI * 0.45, pal.gold, rgba(pal.gold, 0.12));
        ctx.fillStyle = pal.gold; circle(ctx, 14 * u, 14 * u, 5 * u); ctx.fill();
      } else if (kind === 'leaf') {
        ctx.strokeStyle = pal.gold; ctx.lineWidth = 2 * u; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(60 * u, 10 * u, 120 * u, 0); ctx.moveTo(0, 0); ctx.quadraticCurveTo(10 * u, 60 * u, 0, 120 * u); ctx.stroke();
        for (var k = 1; k <= 3; k++) { leafSimple(ctx, k * 32 * u, 4 * u, 26 * u, 0.9, rgba(pal.gold, 0.85)); leafSimple(ctx, 4 * u, k * 32 * u, 26 * u, PI / 2 - 0.9, rgba(pal.gold, 0.85)); }
      } else if (kind === 'feather') {
        feather(ctx, 10 * u, 10 * u, 250 * u, -PI * 0.75, u);
      } else if (kind === 'rose') {
        var cols = pal.deco;
        leafSimple(ctx, 40 * u, 40 * u, 110 * u, 0.1, '#7fb069'); leafSimple(ctx, 40 * u, 40 * u, 110 * u, PI / 2 - 0.1, '#5f8f4e');
        leafSimple(ctx, 40 * u, 40 * u, 90 * u, 0.75, '#9ac17a');
        rose(ctx, 46 * u, 46 * u, 44 * u, cols[0]); rose(ctx, 112 * u, 26 * u, 26 * u, cols[1]); rose(ctx, 26 * u, 112 * u, 26 * u, cols[1]);
        ctx.fillStyle = '#ffffff'; circle(ctx, 86 * u, 86 * u, 5 * u); ctx.fill(); circle(ctx, 140 * u, 60 * u, 4 * u); ctx.fill(); circle(ctx, 60 * u, 140 * u, 4 * u); ctx.fill();
      }
      ctx.restore();
    });
  }

  /* ------------------------------------------------------------ top bands (h = band height) */
  var top = {
    none: function () { },
    toran: function (ctx, W, h, pal, rnd, u) {
      var swags = Math.max(3, Math.round(W / (300 * u))), sw = W / swags, sag = h * 0.42, r = Math.min(17 * u, sw / 18);
      for (var j = 0; j < swags; j++) {
        var x0 = j * sw, n = 10;
        for (var i = 0; i <= n; i++) { var t = i / n; marigold(ctx, x0 + sw * t, 4 * u + sag * 4 * t * (1 - t), r, i % 2 ? '#ff8c00' : '#ffc300'); }
      }
      for (var k = 0; k <= swags; k++) {
        var x = k * sw;
        mangoLeaf(ctx, x - 9 * u, 4 * u, h * 0.6, 0.3, '#43a047', '#1b5e20');
        mangoLeaf(ctx, x + 9 * u, 4 * u, h * 0.6, -0.3, '#43a047', '#1b5e20');
        mangoLeaf(ctx, x, 6 * u, h * 0.7, 0, '#66bb6a', '#2e7d32');
        marigold(ctx, x, 10 * u, r * 1.25, '#e85d04');
      }
    },
    kalash: function (ctx, W, h, pal, rnd, u) {
      kalash(ctx, W / 2, h * 0.98, h * 0.62, pal);
      ctx.save(); ctx.strokeStyle = pal.gold; ctx.lineWidth = 2 * u; ctx.globalAlpha = 0.8; ctx.lineCap = 'round';
      [-1, 1].forEach(function (sd) {
        var x0 = W / 2 + sd * h * 0.5, x1 = W / 2 + sd * (W * 0.5 - 70 * u), y = h * 0.86;
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
        ctx.fillStyle = pal.gold; diamond(ctx, x1 + sd * 6 * u, y, 6 * u); ctx.fill();
      });
      ctx.restore();
    },
    lights: function (ctx, W, h, pal, rnd, u) {
      var swags = Math.max(2, Math.round(W / (420 * u))), sw = W / swags, cols = pal.deco;
      for (var sIdx = 0; sIdx < swags; sIdx++) {
        var x0 = sIdx * sw, sag = h * 0.5, n = 7;
        ctx.strokeStyle = pal.dark ? 'rgba(255,240,200,.5)' : 'rgba(70,45,20,.45)'; ctx.lineWidth = 2 * u;
        ctx.beginPath();
        for (var t = 0; t <= 1.0001; t += 0.05) { var px = x0 + sw * t, py = 4 * u + sag * 4 * t * (1 - t); if (t) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
        ctx.stroke();
        for (var i = 0; i < n; i++) {
          var tt = (i + 0.5) / n, bx = x0 + sw * tt, by = 4 * u + sag * 4 * tt * (1 - tt), col = cols[(i + sIdx) % cols.length];
          glow(ctx, bx, by + 14 * u, 36 * u, col, pal.dark ? 0.5 : 0.3);
          ctx.fillStyle = 'rgba(60,40,20,.8)'; ctx.fillRect(bx - 3.5 * u, by, 7 * u, 6 * u);
          ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(bx, by + 16 * u, 7 * u, 11 * u, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.65)'; circle(ctx, bx - 2.2 * u, by + 12 * u, 2.2 * u); ctx.fill();
        }
      }
    },
    mandala: function (ctx, W, h, pal, rnd, u) {
      var cx = W / 2, cy = -h * 0.35, r = h * 1.3;
      ctx.save(); ctx.translate(cx, cy); ctx.strokeStyle = pal.gold; ctx.fillStyle = pal.gold; ctx.lineWidth = 2 * u; ctx.globalAlpha = 0.85;
      [1, 0.86, 0.66, 0.44].forEach(function (k) { circle(ctx, 0, 0, r * k); ctx.stroke(); });
      [{ n: 28, at: 0.86, len: 0.14, wid: 0.045, fill: true }, { n: 18, at: 0.66, len: 0.2, wid: 0.07 }, { n: 12, at: 0.44, len: 0.22, wid: 0.09, fill: true }].forEach(function (L) {
        for (var i = 0; i < L.n; i++) {
          ctx.save(); ctx.rotate(i * TAU / L.n); ctx.translate(0, -r * L.at); ctx.rotate(PI); petal(ctx, r * L.len, r * L.wid);
          if (L.fill) { ctx.globalAlpha = 0.35; ctx.fill(); ctx.globalAlpha = 0.85; } ctx.stroke(); ctx.restore();
        }
      });
      for (var j = 0; j < 36; j++) { var a = j * TAU / 36; circle(ctx, Math.cos(a) * r * 1.06, Math.sin(a) * r * 1.06, 3 * u); ctx.fill(); }
      ctx.restore();
    },
    balloons: function (ctx, W, h, pal, rnd, u) {
      var cols = pal.deco, n = Math.max(5, Math.round(W / (190 * u)));
      for (var i = 0; i < n; i++) {
        var x = W * (i + 0.5) / n + (rnd() - 0.5) * 40 * u, r = (28 + rnd() * 16) * u, y = h * (0.25 + rnd() * 0.3);
        balloon(ctx, x, y, r, cols[i % cols.length], [x + (rnd() - 0.5) * 60 * u, y + r * 3.6]);
      }
      for (var k = 0; k < 24; k++) {
        ctx.save(); ctx.translate(rnd() * W, rnd() * h * 1.2); ctx.rotate(rnd() * PI); ctx.fillStyle = cols[k % cols.length]; ctx.globalAlpha = 0.85;
        ctx.fillRect(-5 * u, -2.5 * u, 10 * u, 5 * u); ctx.restore();
      }
    },
    banana: function (ctx, W, h, pal, rnd, u) {
      bananaLeaf(ctx, -20 * u, -10 * u, h * 1.5, -PI * 0.33, u);
      bananaLeaf(ctx, W + 20 * u, -10 * u, h * 1.5, PI * 0.33, u);
      bananaLeaf(ctx, 40 * u, -30 * u, h * 1.2, -PI * 0.2, u);
      bananaLeaf(ctx, W - 40 * u, -30 * u, h * 1.2, PI * 0.2, u);
      marigold(ctx, 70 * u, h * 0.78, 16 * u, '#ff8c00'); marigold(ctx, W - 70 * u, h * 0.78, 16 * u, '#ff8c00');
      marigold(ctx, 110 * u, h * 0.9, 12 * u, '#ffc300'); marigold(ctx, W - 110 * u, h * 0.9, 12 * u, '#ffc300');
    },
    monogram: function (ctx, W, h, pal, rnd, u, extra) {
      var cx = W / 2, cy = h * 0.5, r = h * 0.36;
      ctx.save(); ctx.strokeStyle = pal.gold; ctx.lineWidth = 2 * u; circle(ctx, cx, cy, r); ctx.stroke();
      ctx.lineWidth = 1 * u; circle(ctx, cx, cy, r - 7 * u); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - r - 10 * u, cy); ctx.lineTo(cx - W * 0.3, cy); ctx.moveTo(cx + r + 10 * u, cy); ctx.lineTo(cx + W * 0.3, cy); ctx.lineWidth = 1.5 * u; ctx.stroke();
      if (extra && extra.symDraw) symbol(ctx, extra.symDraw, cx, cy, r * 1.2, pal.gold);
      else if (extra && extra.symGlyph) {
        ctx.fillStyle = pal.gold; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
        ctx.font = '400 ' + Math.round(r * 1.25) + 'px ' + (extra.symFam || 'serif'); ctx.fillText(extra.symGlyph, cx, cy + r * 0.06);
      } else if (extra && extra.mono) {
        ctx.fillStyle = pal.head; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
        ctx.font = '700 ' + Math.round(r * (extra.mono.length > 1 ? 0.78 : 1.05)) + 'px ' + (extra.fam || 'serif');
        ctx.fillText(extra.mono, cx, cy + r * 0.04);
      }
      ctx.restore();
    },
    ribbon: function (ctx, W, h, pal, rnd, u) {
      /* a big gift bow with two curling ribbon tails and sparkles: shop openings, annual days, celebrations */
      var cols = pal.deco, col = cols[0], cx = W / 2, y = h * 0.42;
      ctx.save(); ctx.lineCap = 'round';
      [-1, 1].forEach(function (d) {
        ctx.strokeStyle = shade(col, -0.12); ctx.lineWidth = h * 0.2;
        ctx.beginPath(); ctx.moveTo(cx + d * h * 0.25, y + h * 0.12);
        ctx.bezierCurveTo(cx + d * W * 0.12, y + h * 0.5, cx + d * W * 0.2, y - h * 0.35, cx + d * W * 0.36, y + h * 0.3); ctx.stroke();
        ctx.strokeStyle = rgba('#ffffff', 0.35); ctx.lineWidth = h * 0.05;
        ctx.beginPath(); ctx.moveTo(cx + d * h * 0.25, y + h * 0.12);
        ctx.bezierCurveTo(cx + d * W * 0.12, y + h * 0.5, cx + d * W * 0.2, y - h * 0.35, cx + d * W * 0.36, y + h * 0.3); ctx.stroke();
      });
      bow(ctx, cx, y, h * 0.55, col);
      for (var k = 0; k < 16; k++) { sparkle(ctx, rnd() * W, rnd() * h, (4 + rnd() * 9) * u, rgba(pal.gold, 0.9)); }
      ctx.restore();
    },
    rings: function (ctx, W, h, pal, rnd, u) {
      var cx = W / 2, cy = h * 0.52, r = h * 0.26;
      ring(ctx, cx - r * 0.62, cy, r, pal.gold, u); ring(ctx, cx + r * 0.62, cy - r * 0.08, r * 0.92, pal.gold, u);
      ctx.save(); ctx.fillStyle = '#ffffff'; star(ctx, cx + r * 0.62, cy - r * 1.0, r * 0.26, r * 0.1, 4, 0); ctx.fill();
      ctx.fillStyle = rgba('#ffffff', 0.9); star(ctx, cx - r * 1.4, cy - r * 0.6, r * 0.16, r * 0.06, 4, 0); ctx.fill(); star(ctx, cx + r * 1.5, cy + r * 0.4, r * 0.14, r * 0.05, 4, 0); ctx.fill();
      ctx.restore();
    }
  };

  /* ------------------------------------------------------------ bottom bands (h = band height, drawn above H) */
  var bottom = {
    none: function () { },
    diyas: function (ctx, W, H, h, pal, rnd, u) {
      var n = Math.max(3, Math.round(W / (260 * u))), base = H - h * 0.32;
      for (var i = 0; i < n; i++) { var x = W * (i + 0.5) / n, s = h * (i === Math.floor(n / 2) ? 0.9 : 0.72); diya(ctx, x, base, s, pal.gold); }
      ctx.save(); ctx.strokeStyle = rgba(pal.gold, 0.6); ctx.lineWidth = 1.5 * u; ctx.beginPath(); ctx.moveTo(W * 0.1, base + h * 0.3); ctx.lineTo(W * 0.9, base + h * 0.3); ctx.stroke(); ctx.restore();
    },
    lotus: function (ctx, W, H, h, pal, rnd, u) {
      var cols = [pal.deco[0], pal.deco[1]];
      lotus(ctx, W / 2, H - h * 0.08, h * 0.95, cols);
      lotus(ctx, W * 0.26, H - h * 0.05, h * 0.62, cols); lotus(ctx, W * 0.74, H - h * 0.05, h * 0.62, cols);
      ctx.save(); ctx.strokeStyle = rgba(pal.gold, 0.7); ctx.lineWidth = 2 * u; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(W * 0.08, H - h * 0.06); ctx.quadraticCurveTo(W * 0.5, H - h * 0.3, W * 0.92, H - h * 0.06); ctx.stroke(); ctx.restore();
    },
    marigold: function (ctx, W, H, h, pal, rnd, u) {
      var n = Math.max(6, Math.round(W / (120 * u)));
      for (var k = 0; k <= n; k++) mangoLeaf(ctx, W * k / n, H - h * 0.3, h * 0.55, PI + (k % 2 ? 0.3 : -0.3), '#43a047', '#1b5e20');
      for (var i = 0; i < n; i++) { var x = W * (i + 0.5) / n; marigold(ctx, x, H - h * 0.35, h * 0.3, i % 2 ? '#ff8c00' : '#ffc300'); }
    },
    paisleyrow: function (ctx, W, H, h, pal, rnd, u) {
      var n = Math.max(4, Math.round(W / (150 * u))), s = h * 0.5;
      for (var i = 0; i < n; i++) { var x = W * (i + 0.5) / n; paisley(ctx, x, H - h * 0.5, s, i % 2 ? 0.35 : -0.35, pal.gold, rgba(pal.gold, 0.12)); }
    },
    mandala: function (ctx, W, H, h, pal, rnd, u) {
      ctx.save(); ctx.translate(0, H); ctx.scale(1, -1); top.mandala(ctx, W, h, pal, rnd, u); ctx.restore();
    },
    confetti: function (ctx, W, H, h, pal, rnd, u) {
      var cols = pal.deco;
      for (var k = 0; k < 40; k++) {
        ctx.save(); ctx.translate(rnd() * W, H - rnd() * h); ctx.rotate(rnd() * PI); ctx.fillStyle = cols[k % cols.length]; ctx.globalAlpha = 0.9;
        if (k % 3) ctx.fillRect(-6 * u, -3 * u, 12 * u, 6 * u); else { circle(ctx, 0, 0, 4 * u); ctx.fill(); }
        ctx.restore();
      }
      for (var s = 0; s < 6; s++) { star(ctx, rnd() * W, H - rnd() * h, 12 * u, 5 * u, 5, 0); ctx.fillStyle = pal.gold; ctx.fill(); }
    },
    kolam: function (ctx, W, H, h, pal, rnd, u) {
      var g = 26 * u, rows = 4, cols = Math.floor(W * 0.6 / g), x0 = (W - cols * g) / 2 + g / 2, y0 = H - h * 0.75;
      ctx.save(); ctx.strokeStyle = pal.gold; ctx.fillStyle = pal.gold; ctx.lineWidth = 1.8 * u; ctx.globalAlpha = 0.9;
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) { circle(ctx, x0 + c * g, y0 + r * g, 2.2 * u); ctx.fill(); }
      for (var r2 = 0; r2 < rows - 1; r2++) for (var c2 = 0; c2 < cols - 1; c2++) {
        if ((r2 + c2) % 2) continue;
        var cx = x0 + c2 * g + g / 2, cy = y0 + r2 * g + g / 2;
        ctx.beginPath();
        for (var a = 0; a <= TAU + 0.01; a += 0.1) { var rr = g * 0.42 * (1 + 0.5 * Math.cos(4 * a)); var px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr; if (a) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
        ctx.stroke();
      }
      ctx.restore();
    },
    stars: function (ctx, W, H, h, pal, rnd, u) {
      ctx.save(); ctx.fillStyle = pal.gold;
      for (var k = 0; k < 14; k++) { ctx.globalAlpha = 0.5 + rnd() * 0.5; star(ctx, rnd() * W, H - h * (0.15 + rnd() * 0.8), (6 + rnd() * 12) * u, (2.5 + rnd() * 5) * u, 5, 0); ctx.fill(); }
      ctx.restore();
    },
    hearts: function (ctx, W, H, h, pal, rnd, u) {
      var cols = pal.deco;
      for (var k = 0; k < 9; k++) {
        ctx.save(); ctx.globalAlpha = 0.45 + rnd() * 0.5; ctx.fillStyle = cols[k % 2]; var x = W * (k + 0.5) / 9 + (rnd() - 0.5) * 30 * u;
        heartPath(ctx, x, H - h * (0.3 + rnd() * 0.5), (8 + rnd() * 10) * u); ctx.fill(); ctx.restore();
      }
    }
  };

  /* ------------------------------------------------------------ sacred symbols (drawn, gold line art) */
  function symbol(ctx, kind, cx, cy, s, col) {
    ctx.save(); ctx.translate(cx, cy); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = s * 0.055;
    if (kind === 'ganesh') {
      /* stylised Ganesh head, the way wedding cards print it: crown, head, ears, eyes, tilak and a trunk curling left */
      ctx.beginPath(); ctx.arc(0, -s * 0.02, s * 0.3, PI * 1.05, PI * 1.95); ctx.stroke();                       /* top of head */
      ctx.beginPath(); ctx.moveTo(-s * 0.29, -s * 0.04); ctx.quadraticCurveTo(-s * 0.3, s * 0.2, -s * 0.12, s * 0.26); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * 0.29, -s * 0.04); ctx.quadraticCurveTo(s * 0.3, s * 0.2, s * 0.12, s * 0.26); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s * 0.12, s * 0.26);                                                            /* trunk */
      ctx.bezierCurveTo(-s * 0.1, s * 0.45, -s * 0.2, s * 0.56, -s * 0.34, s * 0.5);
      ctx.bezierCurveTo(-s * 0.46, s * 0.44, -s * 0.42, s * 0.3, -s * 0.32, s * 0.34); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * 0.12, s * 0.26); ctx.quadraticCurveTo(s * 0.02, s * 0.44, -s * 0.14, s * 0.42); ctx.stroke();
      [-1, 1].forEach(function (d) {                                                                               /* ears */
        ctx.beginPath(); ctx.moveTo(d * s * 0.3, -s * 0.12);
        ctx.bezierCurveTo(d * s * 0.62, -s * 0.3, d * s * 0.66, s * 0.18, d * s * 0.32, s * 0.14); ctx.stroke();
      });
      ctx.beginPath(); ctx.moveTo(-s * 0.16, -s * 0.3); ctx.quadraticCurveTo(0, -s * 0.62, s * 0.16, -s * 0.3); ctx.stroke();     /* crown */
      ctx.beginPath(); ctx.moveTo(-s * 0.09, -s * 0.36); ctx.quadraticCurveTo(0, -s * 0.52, s * 0.09, -s * 0.36); ctx.stroke();
      circle(ctx, 0, -s * 0.6, s * 0.035); ctx.fill();
      circle(ctx, -s * 0.11, -s * 0.03, s * 0.03); ctx.fill(); circle(ctx, s * 0.11, -s * 0.03, s * 0.03); ctx.fill();            /* eyes */
      ctx.lineWidth = s * 0.04; ctx.beginPath(); ctx.moveTo(0, -s * 0.24); ctx.lineTo(0, -s * 0.12); ctx.stroke();                 /* tilak */
      ctx.beginPath(); ctx.moveTo(s * 0.14, s * 0.3); ctx.quadraticCurveTo(s * 0.2, s * 0.44, s * 0.1, s * 0.5); ctx.stroke();      /* tusk */
    } else if (kind === 'cross') {
      ctx.lineWidth = s * 0.14; ctx.beginPath(); ctx.moveTo(0, -s * 0.55); ctx.lineTo(0, s * 0.55); ctx.moveTo(-s * 0.36, -s * 0.2); ctx.lineTo(s * 0.36, -s * 0.2); ctx.stroke();
    } else if (kind === 'star8') {
      star(ctx, 0, 0, s * 0.55, s * 0.42, 8, 0); ctx.stroke();
      star(ctx, 0, 0, s * 0.38, s * 0.29, 8, PI / 8); ctx.stroke();
      circle(ctx, 0, 0, s * 0.1); ctx.fill();
    } else if (kind === 'wheel') {
      circle(ctx, 0, 0, s * 0.55); ctx.stroke(); circle(ctx, 0, 0, s * 0.42); ctx.stroke(); circle(ctx, 0, 0, s * 0.1); ctx.fill();
      for (var i = 0; i < 8; i++) { var a = i * PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * s * 0.1, Math.sin(a) * s * 0.1); ctx.lineTo(Math.cos(a) * s * 0.42, Math.sin(a) * s * 0.42); ctx.stroke(); }
    }
    ctx.restore();
  }

  function divider(ctx, cx, y, w, col, u) {
    ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.6 * u; ctx.globalAlpha = 0.9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - w / 2, y); ctx.lineTo(cx - 18 * u, y); ctx.moveTo(cx + 18 * u, y); ctx.lineTo(cx + w / 2, y); ctx.stroke();
    diamond(ctx, cx, y, 7 * u); ctx.fill();
    [-1, 1].forEach(function (sd) { circle(ctx, cx + sd * (w / 2 + 7 * u), y, 3 * u); ctx.fill(); });
    ctx.restore();
  }
  function icon(ctx, kind, x, y, s, col) {
    ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(1, s * 0.09); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (kind === 'calendar') {
      rrect(ctx, x + s * 0.1, y + s * 0.16, s * 0.8, s * 0.74, s * 0.1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + s * 0.1, y + s * 0.38); ctx.lineTo(x + s * 0.9, y + s * 0.38); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + s * 0.32, y + s * 0.06); ctx.lineTo(x + s * 0.32, y + s * 0.26); ctx.moveTo(x + s * 0.68, y + s * 0.06); ctx.lineTo(x + s * 0.68, y + s * 0.26); ctx.stroke();
      circle(ctx, x + s * 0.5, y + s * 0.64, s * 0.08); ctx.fill();
    } else if (kind === 'clock') {
      circle(ctx, x + s / 2, y + s / 2, s * 0.42); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + s / 2, y + s * 0.24); ctx.lineTo(x + s / 2, y + s / 2); ctx.lineTo(x + s * 0.7, y + s * 0.62); ctx.stroke();
    } else if (kind === 'pin') {
      var cx = x + s / 2;
      ctx.beginPath(); ctx.moveTo(cx, y + s * 0.96);
      ctx.bezierCurveTo(cx - s * 0.5, y + s * 0.5, cx - s * 0.4, y + s * 0.04, cx, y + s * 0.04);
      ctx.bezierCurveTo(cx + s * 0.4, y + s * 0.04, cx + s * 0.5, y + s * 0.5, cx, y + s * 0.96); ctx.stroke();
      circle(ctx, cx, y + s * 0.38, s * 0.12); ctx.fill();
    } else if (kind === 'phone') {
      rrect(ctx, x + s * 0.26, y + s * 0.04, s * 0.48, s * 0.92, s * 0.1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + s * 0.42, y + s * 0.15); ctx.lineTo(x + s * 0.58, y + s * 0.15); ctx.stroke();
      circle(ctx, x + s * 0.5, y + s * 0.82, s * 0.05); ctx.fill();
    }
    ctx.restore();
  }

  return { rng: rng, rgba: rgba, shade: shade, circle: circle, rrect: rrect, star: star, diamond: diamond, lgrad: lgrad, glow: glow, sparkle: sparkle,
    paisley: paisley, marigold: marigold, lotus: lotus, feather: feather, diya: diya, kalash: kalash, rose: rose,
    background: background, frame: frame, corners: corners, top: top, bottom: bottom, symbol: symbol, divider: divider, icon: icon };
})();
