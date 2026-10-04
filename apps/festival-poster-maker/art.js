/* Festival Poster Maker: procedural festive art drawn on canvas (no clip art, no images).
 * Every shape is drawn from code: diyas, rangoli, lights, toran, kites, fireworks, lanterns, borders...
 *   FPM_ART.background(ctx, W, H, pal, tpl, rnd, u)    FPM_ART.border(ctx, W, H, pal, kind, u)
 *   FPM_ART.top[kind](ctx, W, h, pal, rnd, u)            FPM_ART.bottom[kind](ctx, W, H, h, pal, rnd, u)
 *   FPM_ART.hero[kind](ctx, box, pal, rnd, u, extra)     FPM_ART.mini[kind](ctx, cx, cy, s, pal, rnd, u)
 * u = 1 for a 1080 px wide poster. rnd = seeded random (same seed = same poster). */
window.FPM_ART = (function () {
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
  /* t > 0 lightens towards white, t < 0 darkens towards black */
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
  function starPath(ctx, x, y, r1, r2, n, rot) {
    ctx.beginPath();
    for (var i = 0; i < n * 2; i++) {
      var r = i % 2 ? r2 : r1, a = (rot === undefined ? -PI / 2 : rot) + i * PI / n;
      var px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();
  }
  function diamond(ctx, x, y, r) { ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); }
  /* petal from the origin pointing up (−y), length len, half-width wid */
  function petalPath(ctx, len, wid) {
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(wid, -len * 0.3, wid * 0.7, -len * 0.82, 0, -len);
    ctx.bezierCurveTo(-wid * 0.7, -len * 0.82, -wid, -len * 0.3, 0, 0);
    ctx.closePath();
  }
  function glow(ctx, x, y, r, col, a) {
    if (r <= 0) return;
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(col, a)); g.addColorStop(0.45, rgba(col, a * 0.45)); g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g; circle(ctx, x, y, r); ctx.fill();
  }
  function sparkle(ctx, x, y, r, col) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill();
  }
  function lgrad(ctx, x0, y0, x1, y1, cols) {
    var g = ctx.createLinearGradient(x0, y0, x1, y1);
    cols.forEach(function (c, i) { g.addColorStop(cols.length === 1 ? 0 : i / (cols.length - 1), c); });
    return g;
  }
  function sparkles(ctx, b, n, col, rnd, u, yMax) {
    for (var i = 0; i < n; i++) {
      ctx.globalAlpha = 0.45 + rnd() * 0.55;
      sparkle(ctx, b.x + rnd() * b.w, b.y + rnd() * b.h * (yMax || 1), (5 + rnd() * 11) * u, col);
    }
    ctx.globalAlpha = 1;
  }
  function onDark(pal) { return !!pal.dark; }

  /* ------------------------------------------------------------ building blocks */
  function flame(ctx, fx, fy, fh, fw) {
    glow(ctx, fx, fy - fh * 0.45, fh * 1.15, '#ffd166', 0.5);
    var g = ctx.createRadialGradient(fx, fy - fh * 0.22, fw * 0.1, fx, fy - fh * 0.35, fh * 0.85);
    g.addColorStop(0, '#fffdf0'); g.addColorStop(0.35, '#ffe066'); g.addColorStop(0.75, '#ff9f1c'); g.addColorStop(1, '#ff5400');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(fx, fy - fh);
    ctx.bezierCurveTo(fx + fw * 0.5, fy - fh * 0.6, fx + fw, fy - fh * 0.25, fx, fy);
    ctx.bezierCurveTo(fx - fw, fy - fh * 0.25, fx - fw * 0.5, fy - fh * 0.6, fx, fy - fh);
    ctx.fill();
  }
  /* clay diya: (x, y) = centre of the rim, s = width */
  function diya(ctx, x, y, s, pal) {
    ctx.save();
    glow(ctx, x + s * 0.3, y - s * 0.3, s * 0.95, '#ffb84d', 0.42);
    ctx.fillStyle = '#9c3a14';
    ctx.beginPath(); ctx.moveTo(x + s * 0.3, y - s * 0.07);
    ctx.quadraticCurveTo(x + s * 0.58, y - s * 0.1, x + s * 0.66, y - s * 0.18);
    ctx.quadraticCurveTo(x + s * 0.6, y + s * 0.06, x + s * 0.34, y + s * 0.09);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = lgrad(ctx, 0, y - s * 0.05, 0, y + s * 0.3, ['#e0702f', '#a3401a', '#6b240c']);
    ctx.beginPath(); ctx.ellipse(x, y, s / 2, s * 0.3, 0, 0, PI); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5a1d08'; ctx.beginPath(); ctx.ellipse(x, y, s / 2, s * 0.1, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e8a33a'; ctx.beginPath(); ctx.ellipse(x, y + s * 0.006, s * 0.42, s * 0.066, 0, 0, TAU); ctx.fill();
    var dot = pal && pal.gold ? pal.gold : '#f2c14e';
    for (var i = -3; i <= 3; i++) {
      var dx = i * s * 0.12, yy = y + s * 0.15 * Math.sqrt(Math.max(0, 1 - Math.pow(dx / (s * 0.5), 2)));
      ctx.fillStyle = i % 2 ? '#ffe9a8' : dot; circle(ctx, x + dx, yy, s * 0.026); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,220,150,.55)'; ctx.lineWidth = s * 0.016;
    ctx.beginPath(); ctx.ellipse(x, y + s * 0.03, s * 0.47, s * 0.2, 0, 0.15, PI - 0.15); ctx.stroke();
    flame(ctx, x + s * 0.62, y - s * 0.17, s * 0.56, s * 0.17);
    ctx.restore();
  }
  function marigold(ctx, x, y, r, col) {
    var g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, shade(col, 0.45)); g.addColorStop(0.65, col); g.addColorStop(1, shade(col, -0.28));
    ctx.fillStyle = g; circle(ctx, x, y, r); ctx.fill();
    ctx.fillStyle = 'rgba(120,40,0,.13)';
    for (var k = 0; k < 7; k++) { var a = k * TAU / 7; circle(ctx, x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.2); ctx.fill(); }
  }
  /* leaf hanging down from (x, y) when ang = 0 */
  function leaf(ctx, x, y, len, ang, c1, c2, wf) {
    var k = wf || 1;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang || 0);
    ctx.fillStyle = lgrad(ctx, -len * 0.15 * k, 0, len * 0.15 * k, 0, [c1 || '#3a9d47', c2 || '#1b5e20']);
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(len * 0.24 * k, len * 0.25, len * 0.17 * k, len * 0.75, 0, len);
    ctx.bezierCurveTo(-len * 0.17 * k, len * 0.75, -len * 0.24 * k, len * 0.25, 0, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = Math.max(1, len * 0.02);
    ctx.beginPath(); ctx.moveTo(0, len * 0.05); ctx.lineTo(0, len * 0.9); ctx.stroke();
    ctx.restore();
  }
  function rangoli(ctx, cx, cy, r, cols, rot) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot || 0);
    var c = function (i) { return cols[((i % cols.length) + cols.length) % cols.length]; };
    for (var i = 0; i < 40; i++) { ctx.fillStyle = c(i); circle(ctx, Math.cos(i * TAU / 40) * r * 0.97, Math.sin(i * TAU / 40) * r * 0.97, r * 0.025); ctx.fill(); }
    var layers = [{ n: 16, at: 0.6, len: 0.33, wid: 0.075 }, { n: 12, at: 0.34, len: 0.28, wid: 0.09 }, { n: 8, at: 0.12, len: 0.24, wid: 0.1 }];
    ctx.lineWidth = Math.max(1, r * 0.012); ctx.strokeStyle = 'rgba(255,255,255,.85)';
    layers.forEach(function (L, li) {
      for (var k = 0; k < L.n; k++) {
        ctx.save(); ctx.rotate(k * TAU / L.n + (li % 2 ? PI / L.n : 0)); ctx.translate(0, -r * L.at);
        petalPath(ctx, r * L.len, r * L.wid * 1.6); ctx.fillStyle = c(li * 2 + (k % 2)); ctx.fill(); ctx.stroke(); ctx.restore();
      }
      if (li < 2) for (var d = 0; d < L.n * 2; d++) { ctx.fillStyle = 'rgba(255,255,255,.9)'; circle(ctx, Math.cos(d * PI / L.n) * r * (L.at - 0.02), Math.sin(d * PI / L.n) * r * (L.at - 0.02), r * 0.015); ctx.fill(); }
    });
    ctx.fillStyle = c(5); circle(ctx, 0, 0, r * 0.12); ctx.fill();
    ctx.fillStyle = '#fff4c2'; circle(ctx, 0, 0, r * 0.055); ctx.fill();
    ctx.restore();
  }
  function firework(ctx, cx, cy, r, col, rnd, dark) {
    ctx.save();
    if (dark) ctx.globalCompositeOperation = 'lighter';
    var n = 26;
    ctx.lineCap = 'round';
    for (var i = 0; i < n; i++) {
      var a = i * TAU / n + rnd() * 0.12, r1 = r * (0.16 + rnd() * 0.1), r2 = r * (0.72 + rnd() * 0.28);
      var x1 = cx + Math.cos(a) * r1, y1 = cy + Math.sin(a) * r1, x2 = cx + Math.cos(a) * r2, y2 = cy + Math.sin(a) * r2;
      var g = ctx.createLinearGradient(x1, y1, x2, y2); g.addColorStop(0, rgba(col, 0)); g.addColorStop(1, rgba(col, 0.95));
      ctx.strokeStyle = g; ctx.lineWidth = Math.max(1.5, r * 0.028);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.fillStyle = col; circle(ctx, cx + Math.cos(a) * (r2 + r * 0.06), cy + Math.sin(a) * (r2 + r * 0.06), r * 0.03); ctx.fill();
    }
    glow(ctx, cx, cy, r * 0.42, col, 0.4);
    ctx.restore();
  }
  function kite(ctx, x, y, s, c1, c2, ang) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang || 0);
    var w = s * 0.48, h = s * 0.6;
    ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(w, 0); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(-w, 0); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(0, h * 0.1); ctx.lineTo(-w * 0.32, h * 0.52); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.88)'; circle(ctx, 0, -h * 0.12, s * 0.08); ctx.fill();
    ctx.strokeStyle = 'rgba(70,35,10,.75)'; ctx.lineWidth = Math.max(1, s * 0.016);
    ctx.beginPath(); ctx.moveTo(0, -h); ctx.lineTo(0, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-w, 0); ctx.quadraticCurveTo(0, -h * 0.6, w, 0); ctx.stroke();
    ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(0, h * 0.92); ctx.lineTo(s * 0.13, h + s * 0.17); ctx.lineTo(-s * 0.13, h + s * 0.17); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function kiteString(ctx, x0, y0, x1, y1, col, u) {
    ctx.strokeStyle = col; ctx.lineWidth = 1.6 * u;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2 + (x1 - x0) * 0.2, Math.max(y0, y1) + 30 * u, x1, y1); ctx.stroke();
  }
  function lantern(ctx, x, y, s, col) {
    var w = s * 0.52;
    ctx.save();
    glow(ctx, x, y + s * 0.5, s * 0.85, '#ffd166', 0.32);
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(x - w * 0.32, y + s * 0.17); ctx.quadraticCurveTo(x, y - s * 0.04, x + w * 0.32, y + s * 0.17); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, s * 0.025); circle(ctx, x, y - s * 0.02, s * 0.035); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - w * 0.4, y + s * 0.18); ctx.lineTo(x + w * 0.4, y + s * 0.18); ctx.lineTo(x + w * 0.5, y + s * 0.44);
    ctx.lineTo(x + w * 0.32, y + s * 0.78); ctx.lineTo(x - w * 0.32, y + s * 0.78); ctx.lineTo(x - w * 0.5, y + s * 0.44); ctx.closePath();
    var g = ctx.createRadialGradient(x, y + s * 0.47, s * 0.02, x, y + s * 0.47, s * 0.42);
    g.addColorStop(0, '#fffbe0'); g.addColorStop(0.45, '#ffd166'); g.addColorStop(1, rgba(col, 0.95));
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = Math.max(1, s * 0.028); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + s * 0.18); ctx.lineTo(x, y + s * 0.78);
    ctx.moveTo(x - w * 0.2, y + s * 0.18); ctx.lineTo(x - w * 0.16, y + s * 0.78);
    ctx.moveTo(x + w * 0.2, y + s * 0.18); ctx.lineTo(x + w * 0.16, y + s * 0.78);
    ctx.moveTo(x - w * 0.5, y + s * 0.44); ctx.lineTo(x + w * 0.5, y + s * 0.44); ctx.lineWidth = Math.max(1, s * 0.014); ctx.stroke();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(x - w * 0.32, y + s * 0.78); ctx.lineTo(x + w * 0.32, y + s * 0.78); ctx.lineTo(x + w * 0.14, y + s * 0.88); ctx.lineTo(x - w * 0.14, y + s * 0.88); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x, y + s * 0.88); ctx.lineTo(x + s * 0.03, y + s * 0.97); ctx.lineTo(x, y + s * 1.04); ctx.lineTo(x - s * 0.03, y + s * 0.97); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function crescent(ctx, cx, cy, r, cols) {
    var size = Math.ceil(r * 2 + 6), c = document.createElement('canvas');
    c.width = size; c.height = size;
    var g = c.getContext('2d'), o = size / 2;
    g.fillStyle = lgrad(g, 0, 0, size, size, cols); circle(g, o, o, r); g.fill();
    g.globalCompositeOperation = 'destination-out'; circle(g, o + r * 0.42, o - r * 0.24, r * 0.84); g.fill();
    ctx.drawImage(c, cx - o, cy - o);
  }
  function sun(ctx, cx, cy, r, rays) {
    glow(ctx, cx, cy, r * 2.3, '#ffd166', 0.45);
    if (rays) {
      ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = 'rgba(255,183,3,.75)';
      for (var i = 0; i < 16; i++) {
        ctx.rotate(TAU / 16); var L = i % 2 ? r * 1.45 : r * 1.7;
        ctx.beginPath(); ctx.moveTo(r * 0.9, -r * 0.12); ctx.lineTo(L, 0); ctx.lineTo(r * 0.9, r * 0.12); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    var g = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.1, cx, cy, r);
    g.addColorStop(0, '#fffbe0'); g.addColorStop(0.45, '#ffd166'); g.addColorStop(1, '#fb8500');
    ctx.fillStyle = g; circle(ctx, cx, cy, r); ctx.fill();
  }
  function coin(ctx, x, y, r, tilt) {
    var ry = r * tilt, th = r * 0.16;
    ctx.fillStyle = '#9a6b0a';
    ctx.beginPath(); ctx.ellipse(x, y + th, r, ry, 0, 0, TAU); ctx.fill(); ctx.fillRect(x - r, y, 2 * r, th);
    ctx.fillStyle = lgrad(ctx, x - r, y - ry, x + r, y + ry, ['#fff2b2', '#f2c14e', '#c8901a']);
    ctx.beginPath(); ctx.ellipse(x, y, r, ry, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(154,107,10,.6)'; ctx.lineWidth = Math.max(1, r * 0.08);
    ctx.beginPath(); ctx.ellipse(x, y, r * 0.7, ry * 0.7, 0, 0, TAU); ctx.stroke();
  }
  function coinStack(ctx, x, by, r, n) { for (var i = 0; i < n; i++) coin(ctx, x, by - r * 0.32 - i * r * 0.23, r, 0.34); }
  function brassPot(ctx, cx, by, s) {
    var r = s * 0.42, cy = by - r * 0.9;
    var g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r * 1.1);
    g.addColorStop(0, '#fff0b3'); g.addColorStop(0.45, '#e2a72e'); g.addColorStop(1, '#7a5208');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.92, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c8901a'; rrect(ctx, cx - r * 0.42, cy - r * 1.14, r * 0.84, r * 0.32, r * 0.06); ctx.fill();
    ctx.fillStyle = '#f6d365'; ctx.beginPath(); ctx.ellipse(cx, cy - r * 1.14, r * 0.58, r * 0.13, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(110,70,5,.55)'; ctx.lineWidth = Math.max(1, r * 0.035);
    ctx.beginPath(); ctx.ellipse(cx, cy - r * 0.05, r * 0.97, r * 0.26, 0, 0.1, PI - 0.1); ctx.stroke();
    for (var i = -4; i <= 4; i++) { ctx.fillStyle = '#b5121b'; circle(ctx, cx + i * r * 0.2, cy + r * 0.32 - Math.abs(i) * r * 0.03, r * 0.045); ctx.fill(); }
    return cy - r * 1.14;
  }
  function clayPot(ctx, cx, by, s, rnd) {
    var r = s * 0.4, cy = by - r * 0.92;
    var g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.3, r * 0.1, cx, cy, r * 1.05);
    g.addColorStop(0, '#f08a4b'); g.addColorStop(0.55, '#c2541f'); g.addColorStop(1, '#6b240c');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.93, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#a8441a'; rrect(ctx, cx - r * 0.48, cy - r * 1.2, r * 0.96, r * 0.36, r * 0.08); ctx.fill();
    ctx.strokeStyle = '#fffaf0'; ctx.lineWidth = Math.max(1, r * 0.035);
    ctx.beginPath();
    for (var i = 0; i <= 12; i++) { var x = cx - r * 0.85 + i * r * 0.142, y = cy + (i % 2 ? r * 0.12 : -r * 0.04); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.stroke();
    ctx.fillStyle = '#fffaf0';
    for (var j = 0; j < 9; j++) { circle(ctx, cx - r * 0.66 + j * r * 0.165, cy + r * 0.34, r * 0.035); ctx.fill(); }
    leaf(ctx, cx - r * 0.35, cy - r * 0.95, r * 0.95, PI + 0.75, '#3a9d47', '#1b5e20');
    leaf(ctx, cx + r * 0.35, cy - r * 0.95, r * 0.95, PI - 0.75, '#3a9d47', '#1b5e20');
    ctx.fillStyle = '#fffdf7';
    for (var k = 0; k < 11; k++) { circle(ctx, cx + (k - 5) * r * 0.1, cy - r * 1.28 - rnd() * r * 0.2, r * (0.1 + rnd() * 0.08)); ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(cx - r * 0.5, cy - r * 0.95, r * 0.09, r * 0.28, 0.15, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + r * 0.52, cy - r * 1.0, r * 0.08, r * 0.22, -0.15, 0, TAU); ctx.fill();
  }
  function sugarcane(ctx, x, by, h, ang) {
    ctx.save(); ctx.translate(x, by); ctx.rotate(ang || 0);
    var w = h * 0.048, n = 7, segH = h * 0.8 / n;
    for (var i = 0; i < n; i++) {
      var y0 = -i * segH;
      ctx.fillStyle = lgrad(ctx, -w / 2, 0, w / 2, 0, ['#3d1b3a', '#8a4a7c', '#3d1b3a']);
      ctx.fillRect(-w / 2, y0 - segH, w, segH);
      ctx.fillStyle = '#c9a26b'; ctx.fillRect(-w * 0.56, y0 - segH - w * 0.07, w * 1.12, w * 0.14);
    }
    [-1.5, -0.95, -0.4, 0.25, 0.8, 1.35].forEach(function (a, i) { leaf(ctx, 0, -h * 0.8 + (i % 2) * h * 0.03, h * (i % 3 ? 0.36 : 0.3), PI + a, '#7cc47f', '#2a6f31', 0.32); });
    ctx.restore();
  }
  function wheat(ctx, x, by, h, ang, col) {
    ctx.save(); ctx.translate(x, by); ctx.rotate(ang || 0);
    ctx.strokeStyle = col || '#b8860b'; ctx.lineWidth = Math.max(1, h * 0.012);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -h * 0.97); ctx.stroke();
    for (var i = 0; i < 9; i++) {
      var y = -h * 0.6 - i * h * 0.042;
      [-1, 1].forEach(function (sd) {
        ctx.save(); ctx.translate(sd * h * 0.022, y); ctx.rotate(sd * 0.42);
        ctx.fillStyle = lgrad(ctx, -h * 0.02, 0, h * 0.02, 0, ['#ffe08a', '#d4a017', '#9c6b06']);
        ctx.beginPath(); ctx.ellipse(0, 0, h * 0.021, h * 0.043, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(212,160,23,.8)'; ctx.lineWidth = Math.max(1, h * 0.004);
        ctx.beginPath(); ctx.moveTo(0, -h * 0.04); ctx.lineTo(sd * h * 0.02, -h * 0.13); ctx.stroke();
        ctx.restore();
      });
    }
    ctx.restore();
  }
  function lotus(ctx, cx, by, s) {
    ctx.save();
    ctx.fillStyle = '#2d6a4f';
    ctx.beginPath(); ctx.ellipse(cx - s * 0.42, by + s * 0.02, s * 0.3, s * 0.07, 0.05, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + s * 0.42, by + s * 0.02, s * 0.3, s * 0.07, -0.05, 0, TAU); ctx.fill();
    function petals(angles, len, wid, c1, c2) {
      angles.forEach(function (a) {
        ctx.save(); ctx.translate(cx, by); ctx.rotate(a);
        petalPath(ctx, len, wid); ctx.fillStyle = lgrad(ctx, 0, 0, 0, -len, [c2, c1]); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = Math.max(1, s * 0.006); ctx.stroke(); ctx.restore();
      });
    }
    petals([-1.3, -0.8, 0.8, 1.3], s * 0.4, s * 0.16, '#ffe3ee', '#f48fb1');
    petals([-0.5, 0.5], s * 0.46, s * 0.18, '#ffd1e3', '#ec6fa4');
    petals([-0.22, 0.22], s * 0.5, s * 0.17, '#ffc2da', '#e0559a');
    petals([0], s * 0.55, s * 0.17, '#ffd6e6', '#e75480');
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.ellipse(cx, by - s * 0.03, s * 0.1, s * 0.035, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function balloon(ctx, x, y, r, col, strTo) {
    if (strTo) {
      ctx.strokeStyle = 'rgba(80,80,80,.55)'; ctx.lineWidth = Math.max(1, r * 0.03);
      ctx.beginPath(); ctx.moveTo(x, y + r * 1.22); ctx.bezierCurveTo(x + r * 0.3, y + r * 1.8, strTo[0] - r * 0.3, strTo[1] - r, strTo[0], strTo[1]); ctx.stroke();
    }
    var g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.45, r * 0.1, x, y, r * 1.25);
    g.addColorStop(0, shade(col, 0.55)); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, -0.22));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, r, r * 1.18, 0, 0, TAU); ctx.fill();
    if (toRgb(col).every(function (v) { return v > 230; })) { ctx.strokeStyle = 'rgba(0,0,0,.14)'; ctx.lineWidth = Math.max(1, r * 0.03); ctx.stroke(); }
    ctx.fillStyle = shade(col, -0.2);
    ctx.beginPath(); ctx.moveTo(x, y + r * 1.15); ctx.lineTo(x + r * 0.1, y + r * 1.3); ctx.lineTo(x - r * 0.1, y + r * 1.3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(x - r * 0.38, y - r * 0.5, r * 0.15, r * 0.26, -0.5, 0, TAU); ctx.fill();
  }
  function gift(ctx, cx, by, s, c1, c2) {
    ctx.fillStyle = lgrad(ctx, cx - s / 2, 0, cx + s / 2, 0, [shade(c1, 0.15), c1, shade(c1, -0.2)]);
    ctx.fillRect(cx - s / 2, by - s * 0.78, s, s * 0.78);
    ctx.fillStyle = shade(c1, -0.12); ctx.fillRect(cx - s * 0.56, by - s * 0.94, s * 1.12, s * 0.2);
    ctx.fillStyle = c2; ctx.fillRect(cx - s * 0.08, by - s * 0.94, s * 0.16, s * 0.94);
    ctx.beginPath(); ctx.ellipse(cx - s * 0.17, by - s * 1.02, s * 0.17, s * 0.09, -0.5, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + s * 0.17, by - s * 1.02, s * 0.17, s * 0.09, 0.5, 0, TAU); ctx.fill();
  }
  function heartPath(ctx, cx, cy, s) {
    ctx.beginPath(); ctx.moveTo(cx, cy + s * 0.38);
    ctx.bezierCurveTo(cx - s * 0.62, cy - s * 0.02, cx - s * 0.32, cy - s * 0.58, cx, cy - s * 0.24);
    ctx.bezierCurveTo(cx + s * 0.32, cy - s * 0.58, cx + s * 0.62, cy - s * 0.02, cx, cy + s * 0.38); ctx.closePath();
  }
  function flower5(ctx, cx, cy, r, col, center) {
    ctx.fillStyle = col;
    for (var i = 0; i < 5; i++) { var a = i * TAU / 5 - PI / 2; ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55, r * 0.5, r * 0.32, a, 0, TAU); ctx.fill(); }
    ctx.fillStyle = center || '#ffd166'; circle(ctx, cx, cy, r * 0.28); ctx.fill();
  }
  function cloud(ctx, x, y, r, col, rnd) {
    for (var j = 0; j < 5; j++) {
      var cx = x + (rnd() - 0.5) * r, cy = y + (rnd() - 0.5) * r * 0.8, rr = r * (0.5 + rnd() * 0.5);
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
      g.addColorStop(0, rgba(col, 0.62)); g.addColorStop(0.6, rgba(col, 0.32)); g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g; circle(ctx, cx, cy, rr); ctx.fill();
    }
    ctx.fillStyle = rgba(col, 0.85);
    for (var k = 0; k < 26; k++) { var a = rnd() * TAU, d = r * (0.5 + rnd() * 0.9); circle(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, r * (0.008 + rnd() * 0.022)); ctx.fill(); }
  }
  function egg(ctx, cx, by, h, cols, ang) {
    var w = h * 0.76;
    ctx.save(); ctx.translate(cx, by); ctx.rotate(ang || 0); ctx.translate(0, -h * 0.42);
    ctx.beginPath(); ctx.ellipse(0, 0, w / 2, h * 0.58, 0, PI, TAU); ctx.ellipse(0, 0, w / 2, h * 0.42, 0, 0, PI); ctx.closePath();
    ctx.save(); ctx.clip();
    ctx.fillStyle = cols[0]; ctx.fillRect(-w, -h, 2 * w, 2 * h);
    ctx.fillStyle = cols[1]; ctx.beginPath(); ctx.moveTo(-w, h * 0.02);
    for (var i = 0; i <= 10; i++) ctx.lineTo(-w / 2 + i * w / 10, i % 2 ? -h * 0.1 : h * 0.02);
    ctx.lineTo(w, h * 0.02); ctx.lineTo(w, h * 0.14); ctx.lineTo(-w, h * 0.14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = cols[2]; for (var j = 0; j < 5; j++) { circle(ctx, -w * 0.36 + j * w * 0.18, -h * 0.28, h * 0.04); ctx.fill(); }
    ctx.fillStyle = cols[2]; ctx.fillRect(-w, h * 0.24, 2 * w, h * 0.05);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(-w * 0.18, -h * 0.3, w * 0.08, h * 0.14, -0.3, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function dhol(ctx, cx, cy, w) {
    var h = w * 0.58;
    ctx.strokeStyle = '#e9c46a'; ctx.lineWidth = Math.max(1, w * 0.02);
    ctx.beginPath(); ctx.moveTo(cx - w * 0.4, cy - h * 0.4); ctx.quadraticCurveTo(cx, cy - h * 1.25, cx + w * 0.4, cy - h * 0.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - w / 2, cy - h * 0.42); ctx.quadraticCurveTo(cx, cy - h * 0.62, cx + w / 2, cy - h * 0.42);
    ctx.lineTo(cx + w / 2, cy + h * 0.42); ctx.quadraticCurveTo(cx, cy + h * 0.62, cx - w / 2, cy + h * 0.42); ctx.closePath();
    ctx.fillStyle = lgrad(ctx, 0, cy - h * 0.5, 0, cy + h * 0.5, ['#e5383b', '#a4161a', '#660708']); ctx.fill();
    ctx.strokeStyle = '#f4d58d'; ctx.lineWidth = Math.max(1, w * 0.012); ctx.beginPath();
    for (var i = 0; i <= 12; i++) {
      var x = cx - w * 0.44 + i * w * 0.0733, top = i % 2 === 0;
      var yy = top ? cy - h * 0.42 - h * 0.1 * Math.cos((x - cx) / w * PI) : cy + h * 0.42 + h * 0.1 * Math.cos((x - cx) / w * PI);
      if (i) ctx.lineTo(x, yy); else ctx.moveTo(x, yy);
    }
    ctx.stroke();
    ctx.fillStyle = '#ffba08'; ctx.fillRect(cx - w * 0.3, cy - h * 0.55, w * 0.04, h * 1.1); ctx.fillRect(cx + w * 0.26, cy - h * 0.55, w * 0.04, h * 1.1);
    [-1, 1].forEach(function (sd) {
      ctx.fillStyle = '#f1e3c6'; ctx.beginPath(); ctx.ellipse(cx + sd * w / 2, cy, w * 0.075, h * 0.44, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#7f4f24'; ctx.lineWidth = Math.max(1, w * 0.015); ctx.stroke();
    });
  }
  function standLamp(ctx, x, by, h) {
    ctx.fillStyle = lgrad(ctx, x - h * 0.12, 0, x + h * 0.12, 0, ['#8a5a00', '#f6d365', '#8a5a00']);
    ctx.beginPath(); ctx.moveTo(x - h * 0.16, by); ctx.lineTo(x + h * 0.16, by); ctx.lineTo(x + h * 0.05, by - h * 0.12); ctx.lineTo(x - h * 0.05, by - h * 0.12); ctx.closePath(); ctx.fill();
    ctx.fillRect(x - h * 0.022, by - h * 0.72, h * 0.044, h * 0.62);
    [0.3, 0.5].forEach(function (k) { ctx.beginPath(); ctx.ellipse(x, by - h * k, h * 0.05, h * 0.022, 0, 0, TAU); ctx.fill(); });
    ctx.beginPath(); ctx.ellipse(x, by - h * 0.72, h * 0.16, h * 0.045, 0, 0, TAU); ctx.fill();
    [-0.11, 0, 0.11].forEach(function (dx) { flame(ctx, x + dx * h, by - h * 0.74, h * 0.16, h * 0.045); });
  }
  function dandiya(ctx, cx, cy, len, ang, c1, c2) {
    var w = len * 0.065;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
    rrect(ctx, -len / 2, -w / 2, len, w, w / 2); ctx.save(); ctx.clip();
    ctx.fillStyle = c1; ctx.fillRect(-len / 2, -w, len, 2 * w);
    ctx.fillStyle = c2;
    for (var x = -len / 2; x < len / 2; x += len * 0.12) { ctx.beginPath(); ctx.moveTo(x, -w); ctx.lineTo(x + len * 0.04, -w); ctx.lineTo(x + len * 0.04 + w, w); ctx.lineTo(x + w, w); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = '#f2c14e'; circle(ctx, -len / 2 + w * 0.9, 0, w * 0.55); ctx.fill(); circle(ctx, len / 2 - w * 0.9, 0, w * 0.55); ctx.fill();
    ctx.restore();
  }
  function garbo(ctx, cx, by, s) {
    var r = s * 0.42, cy = by - r;
    var g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    g.addColorStop(0, '#f4a261'); g.addColorStop(0.6, '#d1495b'); g.addColorStop(1, '#7a1d2b');
    ctx.fillStyle = g; circle(ctx, cx, cy, r); ctx.fill();
    [-0.5, -0.17, 0.17, 0.5].forEach(function (k, ri) {
      var yy = cy + k * r, hw = Math.sqrt(Math.max(0, r * r - yy * yy + 2 * yy * cy - cy * cy)) * 0.82, n = 9 - ri % 2;
      for (var j = 0; j < n; j++) {
        var x = cx - hw + (2 * hw) * (j + 0.5) / n;
        glow(ctx, x, yy, r * 0.11, '#ffd166', 0.9);
        ctx.fillStyle = '#fff3b0'; circle(ctx, x, yy, r * 0.035); ctx.fill();
      }
    });
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = Math.max(1, r * 0.025);
    ctx.beginPath(); ctx.ellipse(cx, cy - r * 0.33, r * 0.94, r * 0.12, 0, 0.1, PI - 0.1); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.33, r * 0.94, r * 0.12, 0, 0.1, PI - 0.1); ctx.stroke();
    ctx.fillStyle = '#9c2c13'; rrect(ctx, cx - r * 0.3, cy - r * 1.12, r * 0.6, r * 0.2, r * 0.05); ctx.fill();
    diya(ctx, cx - r * 0.18, cy - r * 1.12, r * 0.6, { gold: '#f2c14e' });
  }
  function bag(ctx, cx, by, w, h, col) {
    ctx.strokeStyle = shade(col, -0.35); ctx.lineWidth = Math.max(1, w * 0.045);
    ctx.beginPath(); ctx.ellipse(cx, by - h, w * 0.22, h * 0.28, 0, PI, TAU); ctx.stroke();
    ctx.fillStyle = lgrad(ctx, cx - w / 2, 0, cx + w / 2, 0, [shade(col, 0.15), col, shade(col, -0.18)]);
    ctx.beginPath(); ctx.moveTo(cx - w * 0.45, by - h); ctx.lineTo(cx + w * 0.45, by - h); ctx.lineTo(cx + w / 2, by); ctx.lineTo(cx - w / 2, by); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(cx - w * 0.45, by - h, w * 0.9, h * 0.1);
  }
  function feather(ctx, x, y, len, ang) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.strokeStyle = '#d9c8a0'; ctx.lineWidth = Math.max(1, len * 0.012);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -len); ctx.stroke();
    ctx.strokeStyle = 'rgba(46,160,110,.7)'; ctx.lineWidth = Math.max(1, len * 0.004);
    for (var i = 0; i < 34; i++) {
      var yy = -len * 0.25 - i * len * 0.021, wd = len * 0.17 * Math.sin(PI * (i / 34) * 0.95 + 0.15);
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.quadraticCurveTo(-wd * 0.6, yy - len * 0.02, -wd, yy - len * 0.06); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.quadraticCurveTo(wd * 0.6, yy - len * 0.02, wd, yy - len * 0.06); ctx.stroke();
    }
    var ey = -len * 0.82;
    [['#2a9d8f', 0.15, 0.2], ['#c9a227', 0.11, 0.15], ['#0f9d8a', 0.085, 0.11], ['#1d3fa0', 0.06, 0.08], ['#0b1a4a', 0.035, 0.045]].forEach(function (e) {
      ctx.fillStyle = e[0]; ctx.beginPath(); ctx.ellipse(0, ey, len * e[1], len * e[2], 0, 0, TAU); ctx.fill();
    });
    ctx.restore();
  }
  function flute(ctx, cx, cy, len, ang) {
    var w = len * 0.055;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
    ctx.fillStyle = lgrad(ctx, 0, -w / 2, 0, w / 2, ['#f6dd8a', '#d4a24c', '#8a5a1a']);
    rrect(ctx, -len / 2, -w / 2, len, w, w / 2); ctx.fill();
    ctx.fillStyle = '#5a3510';
    [-0.42, -0.36, 0.38, 0.44].forEach(function (k) { ctx.fillRect(len * k, -w / 2, len * 0.012, w); });
    for (var i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(-len * 0.12 + i * len * 0.07, 0, w * 0.2, w * 0.14, 0, 0, TAU); ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(-len * 0.33, 0, w * 0.22, w * 0.15, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#d00000'; ctx.lineWidth = Math.max(1, w * 0.18);
    ctx.beginPath(); ctx.moveTo(len * 0.3, w * 0.3); ctx.quadraticCurveTo(len * 0.31, w * 3, len * 0.26, w * 4.2); ctx.stroke();
    ctx.strokeStyle = '#ffba08';
    ctx.beginPath(); ctx.moveTo(len * 0.31, w * 0.3); ctx.quadraticCurveTo(len * 0.34, w * 3, len * 0.33, w * 4); ctx.stroke();
    ctx.restore();
  }
  function modak(ctx, cx, by, s) {
    ctx.fillStyle = lgrad(ctx, cx - s * 0.45, by - s, cx + s * 0.45, by, ['#fffaf0', '#f3dcae', '#c99a54']);
    ctx.beginPath(); ctx.moveTo(cx, by - s);
    ctx.bezierCurveTo(cx + s * 0.12, by - s * 0.7, cx + s * 0.55, by - s * 0.45, cx + s * 0.45, by - s * 0.08);
    ctx.quadraticCurveTo(cx, by + s * 0.06, cx - s * 0.45, by - s * 0.08);
    ctx.bezierCurveTo(cx - s * 0.55, by - s * 0.45, cx - s * 0.12, by - s * 0.7, cx, by - s);
    ctx.fill();
    ctx.strokeStyle = 'rgba(150,100,40,.35)'; ctx.lineWidth = Math.max(1, s * 0.025);
    [-0.32, -0.16, 0, 0.16, 0.32].forEach(function (k) { ctx.beginPath(); ctx.moveTo(cx, by - s * 0.96); ctx.quadraticCurveTo(cx + k * s * 1.2, by - s * 0.5, cx + k * s * 1.25, by - s * 0.06); ctx.stroke(); });
  }
  function tongue(ctx, x, by, h, w, cols) {
    ctx.fillStyle = lgrad(ctx, 0, by, 0, by - h, [cols[1], cols[0]]);
    ctx.beginPath(); ctx.moveTo(x - w / 2, by);
    ctx.bezierCurveTo(x - w * 0.62, by - h * 0.5, x - w * 0.1, by - h * 0.62, x + w * 0.06, by - h);
    ctx.bezierCurveTo(x + w * 0.26, by - h * 0.55, x + w * 0.62, by - h * 0.42, x + w / 2, by);
    ctx.closePath(); ctx.fill();
  }
  function flames(ctx, cx, by, h, w, cols, rnd) {
    var n = 5;
    for (var i = 0; i < n; i++) {
      var off = (i - (n - 1) / 2) / ((n - 1) / 2);
      tongue(ctx, cx + off * w * 0.5, by, h * (1 - Math.abs(off) * 0.42) * (0.85 + rnd() * 0.3), w * 0.34, cols);
    }
  }
  function logPiece(ctx, cx, cy, len, th, ang) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
    ctx.fillStyle = lgrad(ctx, 0, -th / 2, 0, th / 2, ['#8a5a36', '#5a3418', '#2e1a0b']);
    rrect(ctx, -len / 2, -th / 2, len, th, th / 2); ctx.fill();
    ctx.fillStyle = '#c89b6d'; ctx.beginPath(); ctx.ellipse(len / 2 - th * 0.3, 0, th * 0.3, th * 0.48, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function snowflake(ctx, x, y, r) {
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var a = i * PI / 3, ex = x + Math.cos(a) * r, ey = y + Math.sin(a) * r;
      ctx.moveTo(x, y); ctx.lineTo(ex, ey);
      var bx = x + Math.cos(a) * r * 0.55, by = y + Math.sin(a) * r * 0.55;
      ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a + 0.7) * r * 0.32, by + Math.sin(a + 0.7) * r * 0.32);
      ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a - 0.7) * r * 0.32, by + Math.sin(a - 0.7) * r * 0.32);
    }
    ctx.stroke();
  }
  function onionDome(ctx, cx, by, w, h) {
    ctx.beginPath(); ctx.moveTo(cx - w / 2, by);
    ctx.bezierCurveTo(cx - w * 0.64, by - h * 0.55, cx - w * 0.08, by - h * 0.7, cx, by - h);
    ctx.bezierCurveTo(cx + w * 0.08, by - h * 0.7, cx + w * 0.64, by - h * 0.55, cx + w / 2, by);
    ctx.closePath();
  }
  function wave(ctx, W, y0, a, L, ph, bottom, u) {
    ctx.beginPath(); ctx.moveTo(0, bottom); ctx.lineTo(0, y0 + Math.sin(ph) * a);
    for (var x = 0; x <= W + 8 * u; x += 8 * u) ctx.lineTo(x, y0 + Math.sin(x / L * TAU + ph) * a);
    ctx.lineTo(W, bottom); ctx.closePath();
  }

  /* ------------------------------------------------------------ background, frame */
  function background(ctx, W, H, pal, tpl, rnd, u) {
    ctx.fillStyle = lgrad(ctx, 0, 0, W * 0.3, H, [pal.bg[0], pal.bg[1]]);
    ctx.fillRect(0, 0, W, H);
    var cx = W / 2, cy = H * 0.42, R = Math.max(W, H) * 0.8;
    var v = ctx.createRadialGradient(cx, cy, R * 0.15, cx, cy, R);
    if (pal.dark) { v.addColorStop(0, 'rgba(255,255,255,.07)'); v.addColorStop(1, 'rgba(0,0,0,.38)'); }
    else { v.addColorStop(0, 'rgba(255,255,255,.35)'); v.addColorStop(1, 'rgba(255,255,255,0)'); }
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    ctx.save();
    var k = tpl.bgp;
    if (k === 'rays') {
      var rx = W / 2, ry = H * 0.4, RR = Math.hypot(W, H);
      ctx.fillStyle = pal.dark ? 'rgba(255,255,255,.04)' : rgba(pal.gold, 0.07);
      for (var i = 0; i < 40; i += 2) { ctx.beginPath(); ctx.moveTo(rx, ry); ctx.arc(rx, ry, RR, i * TAU / 40, (i + 1) * TAU / 40); ctx.closePath(); ctx.fill(); }
    } else if (k === 'mandala') {
      mandalaOutline(ctx, W / 2, H * 0.44, Math.min(W, H) * 0.6, rgba(pal.gold, pal.dark ? 0.1 : 0.16), u);
    } else if (k === 'dots') {
      var s = 48 * u; ctx.fillStyle = rgba(pal.gold, pal.dark ? 0.1 : 0.14);
      for (var y = s / 2, row = 0; y < H; y += s * 0.866, row++) for (var x = row % 2 ? s : s / 2; x < W; x += s) { circle(ctx, x, y, 3.2 * u); ctx.fill(); }
    } else if (k === 'jaali') {
      var q = 72 * u; ctx.strokeStyle = rgba(pal.gold, pal.dark ? 0.09 : 0.14); ctx.lineWidth = 2 * u;
      for (var d = -H; d < W + H; d += q) { ctx.beginPath(); ctx.moveTo(d, 0); ctx.lineTo(d + H, H); ctx.moveTo(d, 0); ctx.lineTo(d - H, H); ctx.stroke(); }
      ctx.fillStyle = rgba(pal.gold, pal.dark ? 0.12 : 0.16);
      for (var gy = 0; gy < H; gy += q) for (var gx = (Math.round(gy / q) % 2) * q / 2; gx < W; gx += q) { starPath(ctx, gx, gy, 9 * u, 4 * u, 8, 0); ctx.fill(); }
    }
    ctx.restore();
  }
  function mandalaOutline(ctx, cx, cy, r, col, u) {
    ctx.save(); ctx.translate(cx, cy); ctx.strokeStyle = col; ctx.lineWidth = 2.2 * u;
    [1, 0.82, 0.55, 0.3].forEach(function (k) { circle(ctx, 0, 0, r * k); ctx.stroke(); });
    [{ n: 24, at: 0.82, len: 0.18, wid: 0.06 }, { n: 16, at: 0.55, len: 0.27, wid: 0.09 }, { n: 12, at: 0.3, len: 0.25, wid: 0.1 }].forEach(function (L) {
      for (var i = 0; i < L.n; i++) { ctx.save(); ctx.rotate(i * TAU / L.n); ctx.translate(0, -r * L.at); petalPath(ctx, r * L.len, r * L.wid); ctx.stroke(); ctx.restore(); }
    });
    ctx.restore();
  }
  function border(ctx, W, H, pal, kind, u) {
    if (!kind || kind === 'none') return;
    var i = 26 * u;
    ctx.save(); ctx.strokeStyle = pal.gold; ctx.fillStyle = pal.gold;
    if (kind === 'simple') {
      ctx.globalAlpha = 0.85; ctx.lineWidth = 4 * u; rrect(ctx, i, i, W - 2 * i, H - 2 * i, 24 * u); ctx.stroke();
      ctx.globalAlpha = 0.5; ctx.lineWidth = 1.5 * u; rrect(ctx, i + 10 * u, i + 10 * u, W - 2 * i - 20 * u, H - 2 * i - 20 * u, 16 * u); ctx.stroke();
    } else if (kind === 'geo') {
      ctx.globalAlpha = 0.92; ctx.lineWidth = 5 * u; ctx.strokeRect(i, i, W - 2 * i, H - 2 * i);
      var j = i + 13 * u; ctx.lineWidth = 1.6 * u; ctx.strokeRect(j, j, W - 2 * j, H - 2 * j);
      [[i, i], [W - i, i], [i, H - i], [W - i, H - i]].forEach(function (p) {
        ctx.fillStyle = pal.gold; diamond(ctx, p[0], p[1], 20 * u); ctx.fill();
        ctx.fillStyle = pal.bg[0]; diamond(ctx, p[0], p[1], 8 * u); ctx.fill();
      });
      ctx.fillStyle = pal.gold;
      [[W / 2, i], [W / 2, H - i], [i, H / 2], [W - i, H / 2]].forEach(function (p) { diamond(ctx, p[0], p[1], 11 * u); ctx.fill(); });
    } else if (kind === 'scallop') {
      ctx.globalAlpha = 0.8; ctx.lineWidth = 3 * u; ctx.strokeRect(i, i, W - 2 * i, H - 2 * i);
      var r = 11 * u, step = 2 * r; ctx.lineWidth = 2 * u;
      for (var x = i + r; x <= W - i - r + 0.5; x += step) {
        ctx.beginPath(); ctx.arc(x, i, r, 0, PI); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, H - i, r, PI, TAU); ctx.stroke();
      }
      for (var y = i + r; y <= H - i - r + 0.5; y += step) {
        ctx.beginPath(); ctx.arc(i, y, r, -PI / 2, PI / 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(W - i, y, r, PI / 2, 3 * PI / 2); ctx.stroke();
      }
    }
    ctx.restore();
  }

  /* ------------------------------------------------------------ top decorations (h = height of the top band) */
  var top = {
    none: function () { },
    lights: function (ctx, W, h, pal, rnd, u) {
      var swags = Math.max(2, Math.round(W / (420 * u))), sw = W / swags, cols = pal.deco;
      for (var sIdx = 0; sIdx < swags; sIdx++) {
        var x0 = sIdx * sw, sag = h * 0.62, n = 7;
        ctx.strokeStyle = pal.dark ? 'rgba(255,240,200,.5)' : 'rgba(70,45,20,.45)'; ctx.lineWidth = 2.4 * u;
        ctx.beginPath();
        for (var t = 0; t <= 1.0001; t += 0.05) { var px = x0 + sw * t, py = 6 * u + sag * 4 * t * (1 - t); if (t) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
        ctx.stroke();
        for (var i = 0; i < n; i++) {
          var tt = (i + 0.5) / n, bx = x0 + sw * tt, by = 6 * u + sag * 4 * tt * (1 - tt), col = cols[(i + sIdx) % cols.length];
          glow(ctx, bx, by + 14 * u, 40 * u, col, pal.dark ? 0.5 : 0.3);
          ctx.fillStyle = 'rgba(60,40,20,.8)'; ctx.fillRect(bx - 4 * u, by, 8 * u, 7 * u);
          ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(bx, by + 17 * u, 8 * u, 12 * u, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.65)'; circle(ctx, bx - 2.5 * u, by + 13 * u, 2.5 * u); ctx.fill();
        }
      }
    },
    toran: function (ctx, W, h, pal, rnd, u) {
      var swags = Math.max(3, Math.round(W / (300 * u))), sw = W / swags, sag = h * 0.5, r = Math.min(19 * u, sw / 18);
      for (var j = 0; j < swags; j++) {
        var x0 = j * sw, n = 10;
        for (var i = 0; i <= n; i++) { var t = i / n; marigold(ctx, x0 + sw * t, 4 * u + sag * 4 * t * (1 - t), r, i % 2 ? '#ff8c00' : '#ffc300'); }
      }
      for (var k = 0; k <= swags; k++) {
        var x = k * sw;
        leaf(ctx, x - 8 * u, 6 * u, h * 0.62, 0.32, '#43a047', '#1b5e20');
        leaf(ctx, x + 8 * u, 6 * u, h * 0.62, -0.32, '#43a047', '#1b5e20');
        leaf(ctx, x, 8 * u, h * 0.72, 0, '#66bb6a', '#2e7d32');
        marigold(ctx, x, 10 * u, r * 1.25, '#e85d04');
      }
    },
    bunting: function (ctx, W, h, pal, rnd, u) {
      var swags = Math.max(2, Math.round(W / (500 * u))), sw = W / swags, sag = h * 0.35, cols = pal.deco;
      for (var j = 0; j < swags; j++) {
        var x0 = j * sw, n = Math.max(5, Math.round(sw / (70 * u)));
        ctx.strokeStyle = pal.dark ? 'rgba(255,255,255,.55)' : 'rgba(60,40,20,.45)'; ctx.lineWidth = 2 * u;
        ctx.beginPath(); for (var t = 0; t <= 1.0001; t += 0.05) { var px = x0 + sw * t, py = 8 * u + sag * 4 * t * (1 - t); if (t) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.stroke();
        for (var i = 0; i < n; i++) {
          var t1 = (i + 0.15) / n, t2 = (i + 0.85) / n, tm = (i + 0.5) / n;
          var ax = x0 + sw * t1, ay = 8 * u + sag * 4 * t1 * (1 - t1), bx = x0 + sw * t2, by = 8 * u + sag * 4 * t2 * (1 - t2);
          var mx = x0 + sw * tm, my = 8 * u + sag * 4 * tm * (1 - tm) + h * 0.48;
          ctx.fillStyle = cols[(i + j) % cols.length];
          ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(mx, my); ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.45)'; circle(ctx, mx, (ay + by) / 2 + h * 0.16, 4 * u); ctx.fill();
        }
      }
    },
    stars: function (ctx, W, h, pal, rnd, u) {
      var n = Math.round(16 * W / (1080 * u));
      for (var i = 0; i < n; i++) {
        var x = rnd() * W, y = 14 * u + rnd() * h * 1.5, r = (4 + rnd() * 10) * u;
        ctx.globalAlpha = 0.5 + rnd() * 0.5;
        if (i % 3) sparkle(ctx, x, y, r, i % 2 ? pal.gold : '#ffffff');
        else { ctx.fillStyle = pal.gold; starPath(ctx, x, y, r * 0.8, r * 0.35, 5); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
    },
    kites: function (ctx, W, h, pal, rnd, u) {
      var c = pal.deco, s = h * 0.75;
      kite(ctx, W * 0.14, h * 0.5, s, c[0], c[1], -0.3); kiteString(ctx, W * 0.14 - 10 * u, h * 0.5 + s * 0.75, 0, h * 2.4, rgba(pal.text, 0.35), u);
      kite(ctx, W * 0.86, h * 0.5, s * 0.8, c[2], c[3] || c[1], 0.25); kiteString(ctx, W * 0.86 + 10 * u, h * 0.5 + s * 0.65, W, h * 2.2, rgba(pal.text, 0.35), u);
      kite(ctx, W * 0.66, h * 0.3, s * 0.45, c[1], c[0], 0.1);
    },
    lanterns: function (ctx, W, h, pal, rnd, u) {
      var n = Math.max(3, Math.round(W / (240 * u)));
      for (var i = 0; i < n; i++) {
        var x = W * (i + 0.5) / n, len = h * (0.05 + ((i * 7) % 3) * 0.12), s = h * (i % 2 ? 0.5 : 0.62);
        ctx.strokeStyle = rgba(pal.gold, 0.8); ctx.lineWidth = 1.6 * u;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, len); ctx.stroke();
        lantern(ctx, x, len, s, i % 2 ? pal.gold : shade(pal.gold, -0.15));
      }
      top.stars(ctx, W, h * 0.6, pal, rnd, u);
    },
    flowers: function (ctx, W, h, pal, rnd, u) {
      var r = 13 * u;
      [0, 1].forEach(function (side) {
        for (var k = 0; k < 3; k++) {
          var x = side ? W - (34 * u + k * 34 * u) : 34 * u + k * 34 * u, len = h * (1.5 - k * 0.38);
          for (var y = 0; y < len; y += r * 1.85) marigold(ctx, x, y, r, (Math.round(y / (r * 1.85)) + k) % 2 ? '#ff8c00' : '#ffc300');
          leaf(ctx, x, len, r * 2.6, 0, '#43a047', '#1b5e20');
        }
      });
      var swagW = W - 2 * 140 * u, n = 16;
      for (var i = 0; i <= n; i++) { var t = i / n; marigold(ctx, 140 * u + swagW * t, 6 * u + h * 0.32 * 4 * t * (1 - t), r * 0.9, i % 2 ? '#ff8c00' : '#ffc300'); }
    },
    tricolor: function (ctx, W, h, pal, rnd, u) {
      var y = h * 0.55;
      ctx.fillStyle = '#ff9933'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, y * 0.55);
      ctx.bezierCurveTo(W * 0.7, y * 1.4, W * 0.35, y * 0.2, 0, y * 1.25); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = pal.dark ? '#ffffff' : 'rgba(11,46,107,.25)'; ctx.lineWidth = 7 * u;
      ctx.beginPath(); ctx.moveTo(W, y * 0.55 + 10 * u); ctx.bezierCurveTo(W * 0.7, y * 1.4 + 10 * u, W * 0.35, y * 0.2 + 10 * u, 0, y * 1.25 + 10 * u); ctx.stroke();
    },
    colors: function (ctx, W, h, pal, rnd, u) {
      var c = ['#ff006e', '#ffbe0b', '#3a86ff', '#8338ec', '#06d6a0', '#fb5607'];
      cloud(ctx, W * 0.06, h * 0.25, h * 1.1, c[0], rnd); cloud(ctx, W * 0.3, -h * 0.1, h * 0.8, c[1], rnd);
      cloud(ctx, W * 0.94, h * 0.2, h * 1.1, c[2], rnd); cloud(ctx, W * 0.7, -h * 0.05, h * 0.75, c[4], rnd);
    }
  };

  /* ------------------------------------------------------------ bottom decorations (h = height of the bottom band) */
  var bottom = {
    none: function () { },
    diyas: function (ctx, W, H, h, pal, rnd, u) {
      var n = Math.max(3, Math.min(6, Math.round(W / (230 * u)))), s = Math.min(h * 0.62, 120 * u);
      glow(ctx, W / 2, H - h * 0.2, W * 0.6, pal.glow, 0.18);
      for (var i = 0; i < n; i++) diya(ctx, W * (0.14 + 0.72 * (n === 1 ? 0.5 : i / (n - 1))) - s * 0.08, H - h * 0.36, s, pal);
    },
    rangoli: function (ctx, W, H, h, pal, rnd, u) {
      var r = h * 1.15;
      rangoli(ctx, -r * 0.05, H + r * 0.05, r, pal.deco, 0.2); rangoli(ctx, W + r * 0.05, H + r * 0.05, r, pal.deco, 0.5);
      var n = 9; for (var i = 0; i < n; i++) { ctx.fillStyle = pal.deco[i % pal.deco.length]; circle(ctx, W * 0.3 + i * W * 0.05, H - h * 0.22, 5 * u); ctx.fill(); }
    },
    flowers: function (ctx, W, H, h, pal, rnd, u) {
      [[0.06, 1], [0.94, -1]].forEach(function (p) {
        var bx = W * p[0], by = H - h * 0.18;
        leaf(ctx, bx, by, h * 0.9, PI - p[1] * 0.9, '#43a047', '#1b5e20');
        leaf(ctx, bx, by, h * 0.8, PI - p[1] * 1.5, '#66bb6a', '#2e7d32');
        for (var i = 0; i < 6; i++) marigold(ctx, bx + p[1] * (rnd() * h * 1.3), by - rnd() * h * 0.55, (14 + rnd() * 10) * u, i % 2 ? '#ff8c00' : '#ffc300');
      });
      for (var k = 0; k < 26; k++) {
        ctx.fillStyle = k % 3 ? (k % 2 ? '#ff8c00' : '#ffc300') : '#e63946';
        ctx.beginPath(); ctx.ellipse(W * (0.18 + rnd() * 0.64), H - rnd() * h * 0.5 - 10 * u, 7 * u, 4 * u, rnd() * PI, 0, TAU); ctx.fill();
      }
    },
    water: function (ctx, W, H, h, pal, rnd, u) {
      var col = pal.dark ? '#2a6f97' : '#4ea8de';
      for (var k = 0; k < 3; k++) {
        wave(ctx, W, H - h * (0.78 - k * 0.24), h * 0.07, W / (2.2 + k), k * 1.7, H, u);
        ctx.fillStyle = rgba(shade(col, -k * 0.15), 0.35 + k * 0.2); ctx.fill();
      }
      ctx.strokeStyle = rgba(pal.dark ? '#ffd166' : '#ffffff', 0.7); ctx.lineWidth = 3 * u; ctx.lineCap = 'round';
      for (var i = 0; i < 12; i++) { var x = rnd() * W, y = H - h * (0.15 + rnd() * 0.45); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (20 + rnd() * 30) * u, y); ctx.stroke(); }
    },
    snow: function (ctx, W, H, h, pal, rnd, u) {
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2 * u; ctx.fillStyle = 'rgba(255,255,255,.7)';
      var n = Math.round(30 * (W * H) / (1080 * 1920 * u * u));
      for (var i = 0; i < n; i++) { var x = rnd() * W, y = rnd() * H, r = (3 + rnd() * 9) * u; if (r > 8 * u) snowflake(ctx, x, y, r * 1.4); else { circle(ctx, x, y, r * 0.5); ctx.fill(); } }
      ctx.fillStyle = '#eef6ff'; wave(ctx, W, H - h * 0.55, h * 0.12, W * 0.7, 0.8, H, u); ctx.fill();
      ctx.fillStyle = '#ffffff'; wave(ctx, W, H - h * 0.32, h * 0.1, W * 0.5, 2.2, H, u); ctx.fill();
    },
    confetti: function (ctx, W, H, h, pal, rnd, u) {
      var n = Math.round(46 * W / (1080 * u)), cols = pal.deco;
      for (var i = 0; i < n; i++) {
        var x = rnd() * W, y = i % 4 === 0 ? 40 * u + rnd() * h : H - 12 * u - rnd() * h * 0.85;
        ctx.save(); ctx.translate(x, y); ctx.rotate(rnd() * PI); ctx.fillStyle = cols[i % cols.length];
        if (i % 3 === 0) { circle(ctx, 0, 0, 5 * u); ctx.fill(); }
        else if (i % 3 === 1) ctx.fillRect(-9 * u, -3.5 * u, 18 * u, 7 * u);
        else { ctx.strokeStyle = cols[i % cols.length]; ctx.lineWidth = 3.5 * u; ctx.beginPath(); ctx.arc(0, 0, 10 * u, 0, PI * 1.2); ctx.stroke(); }
        ctx.restore();
      }
    },
    tricolor: function (ctx, W, H, h, pal, rnd, u) {
      var y = h * 0.6;
      ctx.fillStyle = '#138808'; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(W, H); ctx.lineTo(W, H - y * 1.25);
      ctx.bezierCurveTo(W * 0.65, H - y * 0.2, W * 0.3, H - y * 1.4, 0, H - y * 0.55); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = pal.dark ? '#ffffff' : 'rgba(11,46,107,.25)'; ctx.lineWidth = 7 * u;
      ctx.beginPath(); ctx.moveTo(W, H - y * 1.25 - 10 * u); ctx.bezierCurveTo(W * 0.65, H - y * 0.2 - 10 * u, W * 0.3, H - y * 1.4 - 10 * u, 0, H - y * 0.55 - 10 * u); ctx.stroke();
    },
    colors: function (ctx, W, H, h, pal, rnd, u) {
      var c = ['#ff006e', '#ffbe0b', '#3a86ff', '#8338ec', '#06d6a0', '#fb5607'];
      cloud(ctx, W * 0.08, H - h * 0.2, h * 1.2, c[3], rnd); cloud(ctx, W * 0.92, H - h * 0.25, h * 1.2, c[5], rnd);
      cloud(ctx, W * 0.5, H + h * 0.2, h * 0.9, c[4], rnd);
    },
    domes: function (ctx, W, H, h, pal, rnd, u) {
      ctx.fillStyle = pal.dark ? rgba(pal.gold, 0.26) : rgba(pal.head[0], 0.16);
      var cx = W / 2, base = H;
      ctx.fillRect(0, base - h * 0.16, W, h * 0.16);
      ctx.fillRect(cx - W * 0.13, base - h * 0.42, W * 0.26, h * 0.42);
      onionDome(ctx, cx, base - h * 0.42, W * 0.2, h * 0.46); ctx.fill();
      ctx.fillRect(cx - 2 * u, base - h * 0.98, 4 * u, h * 0.12);
      [-1, 1].forEach(function (sd) {
        var mx = cx + sd * W * 0.2;
        ctx.fillRect(mx - W * 0.016, base - h * 0.85, W * 0.032, h * 0.85);
        onionDome(ctx, mx, base - h * 0.85, W * 0.05, h * 0.18); ctx.fill();
        var sx = cx + sd * W * 0.36;
        ctx.fillRect(sx - W * 0.07, base - h * 0.32, W * 0.14, h * 0.32);
        onionDome(ctx, sx, base - h * 0.32, W * 0.1, h * 0.3); ctx.fill();
      });
    },
    grass: function (ctx, W, H, h, pal, rnd, u) {
      ctx.lineCap = 'round';
      for (var x = -10 * u; x < W + 10 * u; x += 7 * u) {
        var bh = h * (0.25 + rnd() * 0.45), lean = (rnd() - 0.5) * 30 * u;
        ctx.strokeStyle = ['#2b9348', '#55a630', '#80b918', '#007f5f'][Math.floor(rnd() * 4)]; ctx.lineWidth = (3 + rnd() * 3) * u;
        ctx.beginPath(); ctx.moveTo(x, H); ctx.quadraticCurveTo(x + lean * 0.3, H - bh * 0.6, x + lean, H - bh); ctx.stroke();
      }
      for (var i = 0; i < 12; i++) flower5(ctx, rnd() * W, H - h * (0.15 + rnd() * 0.3), (8 + rnd() * 6) * u, pal.deco[i % pal.deco.length], '#ffd166');
    },
    gamosa: function (ctx, W, H, h, pal, rnd, u) {
      var bh = h * 0.6, y0 = H - bh - 8 * u;
      ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, y0, W, bh);
      ctx.fillStyle = '#c1121f'; ctx.fillRect(0, y0, W, bh * 0.13); ctx.fillRect(0, y0 + bh * 0.87, W, bh * 0.13);
      ctx.fillRect(0, y0 + bh * 0.2, W, bh * 0.04); ctx.fillRect(0, y0 + bh * 0.76, W, bh * 0.04);
      var yc = y0 + bh / 2, step = bh * 0.85;
      for (var x = step / 2; x < W; x += step) {
        diamond(ctx, x, yc, bh * 0.2); ctx.fill();
        ctx.fillStyle = '#fffaf0'; diamond(ctx, x, yc, bh * 0.08); ctx.fill(); ctx.fillStyle = '#c1121f';
        circle(ctx, x + step / 2, yc, bh * 0.04); ctx.fill();
      }
      ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, y0 + bh, W, H - y0 - bh);
    },
    leaves: function (ctx, W, H, h, pal, rnd, u) {
      [[0, 1], [W, -1]].forEach(function (p) {
        ctx.save(); ctx.translate(p[0], H + h * 0.1); ctx.rotate(p[1] * -0.55); ctx.scale(p[1], 1);
        var L = h * 2.4, wd = h * 0.55;
        ctx.fillStyle = lgrad(ctx, 0, -wd, 0, wd, ['#7cc47f', '#2d8a3e', '#1b5e20']);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(L * 0.3, -wd * 1.2, L * 0.85, -wd, L, -wd * 0.1);
        ctx.bezierCurveTo(L * 0.8, wd * 0.6, L * 0.3, wd * 0.7, 0, 0); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(L * 0.5, -wd * 0.35, L, -wd * 0.1); ctx.stroke();
        ctx.lineWidth = 1.2 * u;
        for (var i = 1; i < 14; i++) { var t = i / 14, mx = L * t, my = -wd * 0.35 * 4 * t * (1 - t) * 0.9; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + L * 0.03, my - wd * 0.7 * (1 - Math.abs(t - 0.45))); ctx.stroke(); }
        ctx.restore();
      });
      bottom.flowers(ctx, W, H, h * 0.6, pal, rnd, u);
    }
  };

  /* ------------------------------------------------------------ heroes (main festival art inside box b) */
  function C(b) { return { cx: b.x + b.w / 2, cy: b.y + b.h / 2, by: b.y + b.h, m: Math.min(b.w, b.h) }; }
  var hero = {
    diyas: function (ctx, b, pal, rnd, u) {
      var c = C(b), s = Math.min(b.w * 0.3, b.h * 0.62), by = b.y + b.h * 0.72;
      ctx.save(); ctx.translate(c.cx, by + s * 0.12); ctx.scale(1, 0.32); rangoli(ctx, 0, 0, Math.min(s * 1.6, b.w * 0.5), pal.deco, 0); ctx.restore();
      diya(ctx, c.cx - s * 1.0, by + s * 0.06, s * 0.62, pal);
      diya(ctx, c.cx + s * 1.0, by + s * 0.06, s * 0.62, pal);
      diya(ctx, c.cx - s * 0.08, by - s * 0.04, s, pal);
      sparkles(ctx, b, 12, pal.gold, rnd, u, 0.5);
    },
    coins: function (ctx, b, pal, rnd, u) {
      var c = C(b), s = Math.min(b.w * 0.42, b.h * 0.95), by = b.y + b.h * 0.92;
      glow(ctx, c.cx, by - s * 0.45, s * 1.05, pal.glow, 0.5);
      var mouth = brassPot(ctx, c.cx, by, s * 0.85);
      for (var i = 0; i < 11; i++) coin(ctx, c.cx + (i - 5) * s * 0.06 + (rnd() - 0.5) * s * 0.03, mouth - s * 0.02 - (5 - Math.abs(i - 5)) * s * 0.016 - rnd() * s * 0.03, s * 0.07, 0.4 + rnd() * 0.3);
      coinStack(ctx, c.cx - s * 0.66, by, s * 0.11, 6); coinStack(ctx, c.cx - s * 0.46, by, s * 0.09, 3);
      coinStack(ctx, c.cx + s * 0.64, by, s * 0.11, 4); coinStack(ctx, c.cx + s * 0.86, by, s * 0.08, 2);
      sparkles(ctx, b, 14, '#fff3b0', rnd, u, 0.7);
    },
    hills: function (ctx, b, pal, rnd, u) {
      var c = C(b), base = b.y + b.h * 0.86, hh = b.h * 0.82;
      glow(ctx, c.cx, base - hh * 0.6, b.w * 0.5, pal.glow, 0.35);
      [{ c: ['#8fd694', '#3f8f4a'], h: 1, w: 0.6 }, { c: ['#62b46b', '#2d6e36'], h: 0.72, w: 0.84 }, { c: ['#3d8c48', '#1f5527'], h: 0.46, w: 1 }].forEach(function (L) {
        var hw = b.w * 0.5 * L.w, tp = base - hh * L.h;
        ctx.fillStyle = lgrad(ctx, 0, tp, 0, base, L.c);
        ctx.beginPath(); ctx.moveTo(c.cx - hw, base);
        ctx.bezierCurveTo(c.cx - hw * 0.55, base, c.cx - hw * 0.4, tp, c.cx, tp);
        ctx.bezierCurveTo(c.cx + hw * 0.4, tp, c.cx + hw * 0.55, base, c.cx + hw, base); ctx.closePath(); ctx.fill();
      });
      for (var i = 0; i < 22; i++) {
        var t = rnd(), x = c.cx + (t - 0.5) * b.w * 0.5, y = base - hh * 0.1 - rnd() * hh * 0.5 * (1 - Math.abs(t - 0.5) * 1.6);
        flower5(ctx, x, y, (5 + rnd() * 5) * u, pal.deco[i % pal.deco.length], '#fff3b0');
      }
      var s = Math.min(b.w * 0.11, b.h * 0.2);
      for (var k = -2; k <= 2; k++) diya(ctx, c.cx + k * s * 1.9 - s * 0.1, base + s * 0.02, s, pal);
    },
    thali: function (ctx, b, pal, rnd, u) {
      var c = C(b), s = Math.min(b.w * 0.84, b.h * 1.6), cy = b.y + b.h * 0.66, rx = s * 0.5, ry = s * 0.2;
      glow(ctx, c.cx, cy - ry, s * 0.7, pal.glow, 0.35);
      ctx.fillStyle = lgrad(ctx, c.cx - rx, 0, c.cx + rx, 0, ['#a87408', '#ffe08a', '#c8901a', '#7a5208']);
      ctx.beginPath(); ctx.ellipse(c.cx, cy + ry * 0.08, rx, ry, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#e8b931'; ctx.beginPath(); ctx.ellipse(c.cx, cy, rx * 0.97, ry * 0.95, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#c1121f'; ctx.beginPath(); ctx.ellipse(c.cx, cy, rx * 0.84, ry * 0.8, 0, 0, TAU); ctx.fill();
      for (var i = 0; i < 28; i++) { var a = i * TAU / 28; ctx.fillStyle = '#ffd166'; circle(ctx, c.cx + Math.cos(a) * rx * 0.9, cy + Math.sin(a) * ry * 0.88, s * 0.008); ctx.fill(); }
      for (var p = 0; p < 22; p++) { ctx.fillStyle = p % 2 ? '#ff8fab' : '#ffc300'; ctx.beginPath(); ctx.ellipse(c.cx + (rnd() - 0.5) * rx * 1.4, cy + (rnd() - 0.5) * ry * 1.2, s * 0.014, s * 0.008, rnd() * PI, 0, TAU); ctx.fill(); }
      var bx = c.cx - rx * 0.48;
      ctx.fillStyle = '#c8901a'; ctx.beginPath(); ctx.ellipse(bx, cy + ry * 0.05, rx * 0.14, ry * 0.3, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#d00000'; ctx.beginPath(); ctx.ellipse(bx, cy - ry * 0.02, rx * 0.11, ry * 0.18, 0, 0, TAU); ctx.fill();
      var rx2 = c.cx - rx * 0.16;
      ctx.fillStyle = '#c8901a'; ctx.beginPath(); ctx.ellipse(rx2, cy + ry * 0.4, rx * 0.13, ry * 0.28, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fffdf2'; ctx.beginPath(); ctx.ellipse(rx2, cy + ry * 0.33, rx * 0.1, ry * 0.16, 0, 0, TAU); ctx.fill();
      [[0.08, -0.28], [0.2, -0.3], [0.14, -0.5]].forEach(function (q) {
        var lx = c.cx + rx * q[0], ly = cy + ry * q[1];
        ctx.fillStyle = lgrad(ctx, lx - s * 0.04, ly - s * 0.04, lx + s * 0.04, ly + s * 0.04, ['#ffd166', '#f48c06', '#c2410c']);
        circle(ctx, lx, ly, s * 0.045); ctx.fill();
      });
      diya(ctx, c.cx + rx * 0.5, cy + ry * 0.12, rx * 0.42, pal);
    },
    chhath: function (ctx, b, pal, rnd, u) {
      var c = C(b), hz = b.y + b.h * 0.6, r = Math.min(b.w * 0.24, b.h * 0.4), wb = b.y + b.h;
      ctx.save(); ctx.beginPath(); ctx.rect(b.x - b.w, b.y - b.h, b.w * 3, hz - b.y + b.h); ctx.clip(); sun(ctx, c.cx, hz, r, true); ctx.restore();
      ctx.fillStyle = lgrad(ctx, 0, hz, 0, wb, pal.dark ? ['#1d4e89', '#0b2545'] : ['#5aa9e6', '#1d4e89']);
      ctx.beginPath(); ctx.ellipse(c.cx, hz, b.w * 0.5, wb - hz, 0, 0, PI); ctx.closePath(); ctx.fill();
      for (var k = 0; k < 6; k++) {
        var y = hz + (k + 0.5) * (wb - hz) / 7, w = r * (1.5 - k * 0.2);
        ctx.fillStyle = rgba('#ffd166', 0.8 - k * 0.11); rrect(ctx, c.cx - w / 2, y, w, Math.max(3 * u, b.h * 0.014), 3 * u); ctx.fill();
      }
      sugarcane(ctx, b.x + b.w * 0.06, wb, b.h * 1.0, 0.16);
      sugarcane(ctx, b.x + b.w * 0.94, wb, b.h * 1.0, -0.16);
      diya(ctx, c.cx - r * 1.45, hz + (wb - hz) * 0.42, r * 0.5, pal);
      diya(ctx, c.cx + r * 1.3, hz + (wb - hz) * 0.5, r * 0.45, pal);
    },
    lamps: function (ctx, b, pal, rnd, u) {
      var c = C(b), cy = b.y + b.h * 0.5, R = Math.min(b.w, b.h) * 0.6;
      ctx.save(); ctx.translate(c.cx, cy);
      for (var i = 0; i < 28; i++) { ctx.rotate(TAU / 28); ctx.fillStyle = rgba(pal.gold, i % 2 ? 0.1 : 0.22); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R, -R * 0.06); ctx.lineTo(R, R * 0.06); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      glow(ctx, c.cx, cy, R * 0.75, pal.glow, 0.5);
      ctx.strokeStyle = rgba(pal.gold, 0.8); ctx.lineWidth = 3 * u; ctx.setLineDash([2 * u, 10 * u]); ctx.lineCap = 'round';
      circle(ctx, c.cx, cy, R * 0.45); ctx.stroke(); ctx.setLineDash([]);
      var s = Math.min(b.w * 0.15, b.h * 0.3);
      for (var k = -2; k <= 2; k++) diya(ctx, c.cx + k * s * 1.45 - s * 0.1, b.y + b.h * 0.86 - (2 - Math.abs(k)) * s * 0.3, s * (k === 0 ? 1.12 : 0.92), pal);
    },
    tree: function (ctx, b, pal, rnd, u) {
      var c = C(b), h = Math.min(b.h * 0.96, b.w * 1.1), by = b.y + b.h * 0.98, w = h * 0.68;
      glow(ctx, c.cx, by - h * 0.5, h * 0.7, pal.glow, 0.32);
      ctx.fillStyle = '#6b3e1e'; ctx.fillRect(c.cx - w * 0.07, by - h * 0.13, w * 0.14, h * 0.13);
      var tiers = [{ y0: 0.12, y1: 0.5, w: 1 }, { y0: 0.38, y1: 0.73, w: 0.78 }, { y0: 0.6, y1: 0.92, w: 0.55 }];
      tiers.forEach(function (T) {
        var yb = by - h * T.y0, yt = by - h * T.y1, hw = w * T.w / 2;
        ctx.fillStyle = lgrad(ctx, c.cx - hw, 0, c.cx + hw, 0, ['#0f5132', '#2a9d58', '#0b3d26']);
        ctx.beginPath(); ctx.moveTo(c.cx, yt);
        ctx.quadraticCurveTo(c.cx + hw * 0.35, yb - (yb - yt) * 0.35, c.cx + hw, yb);
        ctx.quadraticCurveTo(c.cx, yb + h * 0.045, c.cx - hw, yb);
        ctx.quadraticCurveTo(c.cx - hw * 0.35, yb - (yb - yt) * 0.35, c.cx, yt); ctx.fill();
        ctx.strokeStyle = '#ffd166'; ctx.lineWidth = Math.max(1, h * 0.008);
        ctx.beginPath(); ctx.moveTo(c.cx - hw * 0.7, yb - (yb - yt) * 0.32); ctx.quadraticCurveTo(c.cx, yb - (yb - yt) * 0.1, c.cx + hw * 0.7, yb - (yb - yt) * 0.4); ctx.stroke();
        for (var i = 0; i < 5; i++) {
          var f = 0.12 + rnd() * 0.6, y = yb - (yb - yt) * f, half = hw * (1 - f) * 0.8, x = c.cx + (rnd() * 2 - 1) * half;
          var col = pal.deco[i % pal.deco.length];
          ctx.fillStyle = col === '#ffffff' ? '#ef4444' : col; circle(ctx, x, y, h * 0.022); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.6)'; circle(ctx, x - h * 0.007, y - h * 0.007, h * 0.006); ctx.fill();
        }
      });
      glow(ctx, c.cx, by - h * 0.93, h * 0.14, '#fff3b0', 0.85);
      ctx.fillStyle = lgrad(ctx, 0, by - h, 0, by - h * 0.86, ['#fff3b0', '#facc15', '#d4a017']);
      starPath(ctx, c.cx, by - h * 0.93, h * 0.07, h * 0.03, 5); ctx.fill();
      gift(ctx, c.cx - w * 0.56, by, h * 0.15, '#d62828', '#ffd166');
      gift(ctx, c.cx + w * 0.6, by, h * 0.12, '#1d4e89', '#ffffff');
    },
    year: function (ctx, b, pal, rnd, u, extra) {
      var c = C(b), m = c.m;
      firework(ctx, b.x + b.w * 0.2, b.y + b.h * 0.32, m * 0.32, pal.deco[0], rnd, pal.dark);
      firework(ctx, b.x + b.w * 0.8, b.y + b.h * 0.28, m * 0.3, pal.deco[1], rnd, pal.dark);
      firework(ctx, c.cx, b.y + b.h * 0.2, m * 0.24, pal.deco[2], rnd, pal.dark);
      var yr = String((extra && extra.year) || new Date().getFullYear());
      var px = Math.min(b.h * 0.6, b.w * 0.42);
      ctx.font = '900 ' + px + 'px "Noto Sans", "Segoe UI", Roboto, Arial, sans-serif';
      var wd = ctx.measureText(yr).width; if (wd > b.w * 0.8) { px *= b.w * 0.8 / wd; ctx.font = '900 ' + px + 'px "Noto Sans", "Segoe UI", Roboto, Arial, sans-serif'; }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
      var y = b.y + b.h * 0.62;
      ctx.save(); ctx.shadowColor = rgba(pal.gold, 0.8); ctx.shadowBlur = 30 * u;
      ctx.fillStyle = lgrad(ctx, 0, y - px / 2, 0, y + px / 2, ['#fffbe6', '#ffd166', '#f59f00']);
      ctx.fillText(yr, c.cx, y); ctx.restore();
      ctx.lineWidth = Math.max(1, px * 0.012); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.strokeText(yr, c.cx, y);
    },
    bonfire: function (ctx, b, pal, rnd, u) {
      var c = C(b), by = b.y + b.h * 0.92, s = Math.min(b.w * 0.55, b.h * 0.85);
      glow(ctx, c.cx, by - s * 0.4, s * 1.05, '#ff9f1c', 0.55);
      logPiece(ctx, c.cx, by - s * 0.04, s * 0.78, s * 0.1, 0.3); logPiece(ctx, c.cx, by - s * 0.04, s * 0.78, s * 0.1, -0.3); logPiece(ctx, c.cx, by, s * 0.92, s * 0.09, 0);
      flames(ctx, c.cx, by - s * 0.08, s * 0.66, s * 0.56, ['#e85d04', '#d00000'], rnd);
      flames(ctx, c.cx, by - s * 0.08, s * 0.5, s * 0.4, ['#ffba08', '#f48c06'], rnd);
      flames(ctx, c.cx, by - s * 0.08, s * 0.3, s * 0.22, ['#fff3b0', '#ffd166'], rnd);
      for (var i = 0; i < 26; i++) { ctx.fillStyle = rgba('#ffd166', 0.5 + rnd() * 0.5); circle(ctx, c.cx + (rnd() - 0.5) * s * 0.95, by - s * (0.55 + rnd() * 0.5), (1.5 + rnd() * 3.5) * u); ctx.fill(); }
    },
    kites: function (ctx, b, pal, rnd, u) {
      var s = Math.min(b.w * 0.36, b.h * 0.55), d = pal.deco, cx = b.x + b.w / 2, sp = [cx, b.y + b.h * 0.98];
      sun(ctx, b.x + b.w * 0.8, b.y + b.h * 0.26, s * 0.26, true);
      var ks = [[b.x + b.w * 0.3, b.y + b.h * 0.38, s, d[0], d[1], -0.25], [b.x + b.w * 0.68, b.y + b.h * 0.52, s * 0.78, d[2], d[4] || '#ffffff', 0.22], [b.x + b.w * 0.5, b.y + b.h * 0.2, s * 0.5, d[3] || d[1], d[0], 0.05]];
      ks.forEach(function (k) { kiteString(ctx, k[0], k[1] + k[2] * 0.55, sp[0], sp[1], rgba(pal.text, 0.45), u); });
      ks.forEach(function (k) { kite(ctx, k[0], k[1], k[2], k[3], k[4], k[5]); });
      ctx.fillStyle = '#8d5524'; rrect(ctx, sp[0] - s * 0.12, sp[1] - s * 0.16, s * 0.24, s * 0.16, s * 0.03); ctx.fill();
      ctx.fillStyle = '#e63946'; rrect(ctx, sp[0] - s * 0.09, sp[1] - s * 0.14, s * 0.18, s * 0.12, s * 0.03); ctx.fill();
    },
    pongal: function (ctx, b, pal, rnd, u) {
      var c = C(b), by = b.y + b.h * 0.97, s = Math.min(b.w * 0.42, b.h * 0.6);
      sun(ctx, c.cx, by - s * 1.18, s * 0.36, true);
      sugarcane(ctx, c.cx - s * 0.78, by, s * 1.5, -0.2); sugarcane(ctx, c.cx + s * 0.78, by, s * 1.5, 0.2);
      ctx.save(); ctx.translate(c.cx, by - s * 0.02); ctx.scale(1, 0.25); rangoli(ctx, 0, 0, s * 0.9, pal.deco, 0); ctx.restore();
      clayPot(ctx, c.cx, by - s * 0.04, s, rnd);
    },
    balloons: function (ctx, b, pal, rnd, u) {
      var c = C(b), s = Math.min(b.w * 0.2, b.h * 0.4), gather = [c.cx, b.y + b.h * 0.98];
      [['#ff9933', 0], ['#ffffff', 1], ['#138808', 2]].forEach(function (p, i) {
        var t = b.h * (0.48 + i * 0.12);
        ctx.fillStyle = p[0] === '#ffffff' ? (pal.dark ? '#ffffff' : '#e9eef5') : p[0];
        ctx.beginPath(); ctx.moveTo(b.x, b.y + t); ctx.bezierCurveTo(b.x + b.w * 0.35, b.y + t - b.h * 0.3, b.x + b.w * 0.65, b.y + t + b.h * 0.18, b.x + b.w, b.y + t - b.h * 0.12);
        ctx.lineTo(b.x + b.w, b.y + t - b.h * 0.12 + b.h * 0.07); ctx.bezierCurveTo(b.x + b.w * 0.65, b.y + t + b.h * 0.25, b.x + b.w * 0.35, b.y + t - b.h * 0.23, b.x, b.y + t + b.h * 0.07); ctx.closePath();
        ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;
      });
      balloon(ctx, c.cx - s * 1.05, b.y + b.h * 0.08 + s * 0.75, s * 0.48, '#ff9933', gather);
      balloon(ctx, c.cx + s * 1.05, b.y + b.h * 0.08 + s * 0.8, s * 0.48, '#138808', gather);
      balloon(ctx, c.cx, b.y + b.h * 0.08 + s * 0.55, s * 0.52, '#ffffff', gather);
      sparkles(ctx, b, 10, pal.dark ? '#ffffff' : '#ff9933', rnd, u, 0.6);
    },
    tricolorkites: function (ctx, b, pal, rnd, u) {
      var s = Math.min(b.w * 0.34, b.h * 0.55), sp = [b.x + b.w / 2, b.y + b.h * 0.98];
      var ks = [[b.x + b.w * 0.28, b.y + b.h * 0.4, s, '#ff9933', '#ffffff', -0.25], [b.x + b.w * 0.7, b.y + b.h * 0.34, s * 0.85, '#138808', '#ffffff', 0.2], [b.x + b.w * 0.5, b.y + b.h * 0.62, s * 0.55, '#0b2e6b', '#ff9933', 0.05]];
      ks.forEach(function (k) { kiteString(ctx, k[0], k[1] + k[2] * 0.55, sp[0], sp[1], rgba(pal.text, 0.45), u); });
      ks.forEach(function (k) { kite(ctx, k[0], k[1], k[2], k[3], k[4], k[5]); });
      sparkles(ctx, b, 10, pal.dark ? '#ffffff' : '#ff9933', rnd, u, 0.6);
    },
    gulal: function (ctx, b, pal, rnd, u) {
      var c = C(b), cols = ['#ff006e', '#ffbe0b', '#3a86ff', '#8338ec', '#06d6a0', '#fb5607'];
      for (var i = 0; i < 8; i++) cloud(ctx, b.x + b.w * (0.12 + rnd() * 0.76), b.y + b.h * (0.12 + rnd() * 0.5), c.m * (0.16 + rnd() * 0.14), cols[i % 6], rnd);
      var s = Math.min(b.w * 0.27, b.h * 0.42), by = b.y + b.h * 0.95;
      [[-1, 0], [0, 1], [1, 4]].forEach(function (p) {
        var x = c.cx + p[0] * s * 1.12, col = cols[p[1]], rimY = by - s * 0.3;
        ctx.fillStyle = '#7a5208'; ctx.beginPath(); ctx.ellipse(x, rimY, s * 0.5, s * 0.08, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = lgrad(ctx, 0, by - s * 0.9, 0, rimY, [shade(col, 0.3), col]);
        ctx.beginPath(); ctx.moveTo(x - s * 0.44, rimY); ctx.quadraticCurveTo(x, by - s * 1.05, x + s * 0.44, rimY); ctx.closePath(); ctx.fill();
        ctx.fillStyle = lgrad(ctx, x - s * 0.5, 0, x + s * 0.5, 0, ['#a87408', '#ffe08a', '#c8901a', '#7a5208']);
        ctx.beginPath(); ctx.ellipse(x, rimY, s * 0.5, s * 0.3, 0, 0, PI); ctx.closePath(); ctx.fill();
      });
    },
    gudi: function (ctx, b, pal, rnd, u) {
      var c = C(b), by = b.y + b.h * 0.98, h = Math.min(b.h * 0.96, b.w * 1.1);
      glow(ctx, c.cx, by - h * 0.6, h * 0.6, pal.glow, 0.4);
      ctx.save(); ctx.translate(c.cx, by); ctx.scale(1, 0.25); rangoli(ctx, 0, 0, h * 0.42, pal.deco, 0); ctx.restore();
      ctx.strokeStyle = '#8d5524'; ctx.lineWidth = h * 0.026; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(c.cx, by - h * 0.02); ctx.lineTo(c.cx, by - h * 0.86); ctx.stroke();
      var tp = by - h * 0.8;
      [-1.1, -0.6, 0.6, 1.1].forEach(function (a, i) { leaf(ctx, c.cx, tp - h * 0.02, h * (i % 3 ? 0.2 : 0.16), PI + a, '#43a047', '#1b5e20'); });
      ctx.fillStyle = lgrad(ctx, c.cx - h * 0.2, tp, c.cx + h * 0.2, tp + h * 0.4, ['#ffd60a', '#f77f00', '#d00000']);
      ctx.beginPath(); ctx.moveTo(c.cx, tp);
      ctx.bezierCurveTo(c.cx + h * 0.13, tp + h * 0.08, c.cx + h * 0.21, tp + h * 0.3, c.cx + h * 0.18, tp + h * 0.42);
      ctx.lineTo(c.cx - h * 0.18, tp + h * 0.42);
      ctx.bezierCurveTo(c.cx - h * 0.21, tp + h * 0.3, c.cx - h * 0.13, tp + h * 0.08, c.cx, tp); ctx.fill();
      ctx.fillStyle = '#2b9348'; ctx.fillRect(c.cx - h * 0.18, tp + h * 0.38, h * 0.36, h * 0.045);
      ctx.fillStyle = '#ffd166'; for (var d = 0; d < 9; d++) { circle(ctx, c.cx - h * 0.16 + d * h * 0.04, tp + h * 0.4, h * 0.007); ctx.fill(); }
      ctx.strokeStyle = 'rgba(120,40,0,.3)'; ctx.lineWidth = Math.max(1, h * 0.005);
      [-0.08, 0, 0.08].forEach(function (k) { ctx.beginPath(); ctx.moveTo(c.cx + k * h * 0.3, tp + h * 0.06); ctx.lineTo(c.cx + k * h * 1.3, tp + h * 0.38); ctx.stroke(); });
      for (var m = 0; m <= 8; m++) { var t = m / 8; marigold(ctx, c.cx - h * 0.12 + h * 0.24 * t, tp + h * 0.12 + h * 0.08 * 4 * t * (1 - t), h * 0.016, m % 2 ? '#ff8c00' : '#ffc300'); }
      var g = ctx.createRadialGradient(c.cx - h * 0.02, by - h * 0.9, h * 0.01, c.cx, by - h * 0.88, h * 0.07);
      g.addColorStop(0, '#ffc49b'); g.addColorStop(0.6, '#c8642c'); g.addColorStop(1, '#7a3412');
      ctx.fillStyle = g; circle(ctx, c.cx, by - h * 0.885, h * 0.062); ctx.fill();
      ctx.fillStyle = '#9a4a1c'; rrect(ctx, c.cx - h * 0.04, by - h * 0.835, h * 0.08, h * 0.03, h * 0.008); ctx.fill();
    },
    crescent: function (ctx, b, pal, rnd, u) {
      var c = C(b), cy = b.y + b.h * 0.5, r = Math.min(b.w * 0.26, b.h * 0.4);
      glow(ctx, c.cx, cy, r * 1.7, pal.glow, 0.35);
      crescent(ctx, c.cx - r * 0.1, cy, r, ['#fff8d6', pal.gold, shade(pal.gold, -0.25)]);
      ctx.fillStyle = pal.gold; starPath(ctx, c.cx + r * 0.62, cy - r * 0.18, r * 0.2, r * 0.085, 5); ctx.fill();
      sparkles(ctx, b, 10, pal.gold, rnd, u, 0.9);
      var s = Math.min(b.h * 0.42, b.w * 0.16);
      [[b.x + b.w * 0.1, 0.08], [b.x + b.w * 0.9, 0.2]].forEach(function (p) {
        var ly = b.y + b.h * p[1];
        ctx.strokeStyle = rgba(pal.gold, 0.8); ctx.lineWidth = 1.6 * u; ctx.beginPath(); ctx.moveTo(p[0], b.y - 20 * u); ctx.lineTo(p[0], ly); ctx.stroke();
        lantern(ctx, p[0], ly, s, pal.gold);
      });
    },
    lotus: function (ctx, b, pal, rnd, u) {
      var c = C(b), s = Math.min(b.w * 0.6, b.h * 1.25), by = b.y + b.h * 0.78;
      glow(ctx, c.cx, by - s * 0.25, s * 0.8, pal.glow, 0.45);
      ctx.strokeStyle = rgba(pal.dark ? '#ffffff' : '#1d4e89', 0.35); ctx.lineWidth = 2.5 * u;
      [0.55, 0.8, 1.05].forEach(function (k) { ctx.beginPath(); ctx.ellipse(c.cx, by + s * 0.05, s * k * 0.6, s * k * 0.1, 0, 0, TAU); ctx.stroke(); });
      lotus(ctx, c.cx, by, s);
      sparkles(ctx, b, 10, pal.gold, rnd, u, 0.5);
    },
    moonlotus: function (ctx, b, pal, rnd, u) {
      var c = C(b), r = Math.min(b.w * 0.2, b.h * 0.25);
      glow(ctx, c.cx, b.y + r * 1.2, r * 2.4, '#fff8d6', 0.4);
      ctx.fillStyle = lgrad(ctx, c.cx - r, b.y, c.cx + r, b.y + 2 * r, ['#fffdf0', '#f6e7b0', '#e3cf8a']);
      circle(ctx, c.cx, b.y + r * 1.15, r); ctx.fill();
      ctx.fillStyle = 'rgba(180,150,80,.18)'; [[-0.3, -0.2, 0.18], [0.25, 0.15, 0.14], [-0.1, 0.4, 0.1]].forEach(function (q) { circle(ctx, c.cx + q[0] * r, b.y + r * 1.15 + q[1] * r, q[2] * r); ctx.fill(); });
      var s = Math.min(b.w * 0.5, b.h * 0.7), by = b.y + b.h * 0.92;
      lotus(ctx, c.cx, by, s);
    },
    eggs: function (ctx, b, pal, rnd, u) {
      var c = C(b), h = Math.min(b.h * 0.62, b.w * 0.3), by = b.y + b.h * 0.92;
      glow(ctx, c.cx, by - h * 0.5, h * 1.5, pal.glow, 0.4);
      egg(ctx, c.cx - h * 0.7, by, h * 0.82, ['#ffadad', '#ffd6a5', '#9bf6ff'], -0.25);
      egg(ctx, c.cx + h * 0.72, by, h * 0.78, ['#caffbf', '#bdb2ff', '#ffc6ff'], 0.25);
      egg(ctx, c.cx, by, h, ['#a0c4ff', '#ffd166', '#ff8fab'], 0);
      ctx.lineCap = 'round';
      for (var x = c.cx - h * 1.5; x < c.cx + h * 1.5; x += 6 * u) { ctx.strokeStyle = ['#2b9348', '#55a630', '#80b918'][Math.floor(rnd() * 3)]; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.moveTo(x, by + 4 * u); ctx.lineTo(x + (rnd() - 0.5) * 16 * u, by - h * (0.08 + rnd() * 0.16)); ctx.stroke(); }
      for (var i = 0; i < 6; i++) flower5(ctx, c.cx + (rnd() - 0.5) * h * 2.8, by - rnd() * h * 0.15, (9 + rnd() * 6) * u, pal.deco[i % pal.deco.length], '#ffd166');
    },
    wheat: function (ctx, b, pal, rnd, u) {
      var c = C(b), h = Math.min(b.h * 0.95, b.w * 0.9), by = b.y + b.h * 0.98;
      sun(ctx, c.cx, by - h * 0.62, h * 0.24, true);
      for (var i = -4; i <= 4; i++) wheat(ctx, c.cx + i * h * 0.012, by, h * (0.92 - Math.abs(i) * 0.04), i * 0.11, '#b8860b');
      ctx.fillStyle = '#c1121f'; rrect(ctx, c.cx - h * 0.06, by - h * 0.3, h * 0.12, h * 0.05, h * 0.015); ctx.fill();
      ctx.fillStyle = '#ffd166'; rrect(ctx, c.cx - h * 0.06, by - h * 0.285, h * 0.12, h * 0.012, h * 0.005); ctx.fill();
    },
    dhol: function (ctx, b, pal, rnd, u) {
      var c = C(b), w = Math.min(b.w * 0.66, b.h * 1.3);
      glow(ctx, c.cx, c.cy, w * 0.7, pal.glow, 0.35);
      for (var i = 0; i < 10; i++) { var a = i * TAU / 10; flower5(ctx, c.cx + Math.cos(a) * w * 0.68, c.cy + w * 0.06 + Math.sin(a) * w * 0.34, (10 + (i % 3) * 4) * u * Math.max(1, w / (500 * u)), pal.deco[i % pal.deco.length], '#ffd166'); }
      dhol(ctx, c.cx, c.cy + w * 0.08, w);
    },
    pookalam: function (ctx, b, pal, rnd, u) {
      var c = C(b), r = Math.min(b.w * 0.36, b.h * 0.47);
      var cols = ['#ffd60a', '#f77f00', '#d00000', '#fffaf0', '#9d4edd', '#2b9348'];
      ctx.fillStyle = '#2b9348'; circle(ctx, c.cx, c.cy, r * 1.04); ctx.fill();
      rangoli(ctx, c.cx, c.cy, r, cols, 0);
      for (var i = 0; i < 24; i++) { var a = i * TAU / 24; marigold(ctx, c.cx + Math.cos(a) * r * 1.08, c.cy + Math.sin(a) * r * 1.08, r * 0.055, i % 2 ? '#ff8c00' : '#ffc300'); }
      standLamp(ctx, b.x + b.w * 0.07, b.y + b.h, b.h * 0.7);
      standLamp(ctx, b.x + b.w * 0.93, b.y + b.h, b.h * 0.7);
    },
    rakhi: function (ctx, b, pal, rnd, u) {
      var c = C(b), s = Math.min(b.w * 0.42, b.h * 0.72), cy = c.cy;
      glow(ctx, c.cx, cy, s * 0.9, pal.glow, 0.4);
      ctx.save(); ctx.translate(c.cx, cy); ctx.scale(1.3, 1.3); ctx.translate(-c.cx, -cy);
      [['#c1121f', 0], ['#ffd166', s * 0.03]].forEach(function (th) {
        ctx.strokeStyle = th[0]; ctx.lineWidth = s * 0.03;
        ctx.beginPath(); ctx.moveTo(c.cx - s * 1.15, cy + s * 0.18 + th[1]); ctx.quadraticCurveTo(c.cx - s * 0.6, cy + s * 0.28 + th[1], c.cx, cy + th[1]);
        ctx.quadraticCurveTo(c.cx + s * 0.6, cy + s * 0.28 + th[1], c.cx + s * 1.15, cy + s * 0.18 + th[1]); ctx.stroke();
      });
      [-1, 1].forEach(function (sd) { marigold(ctx, c.cx + sd * s * 1.15, cy + s * 0.2, s * 0.06, '#ffc300'); marigold(ctx, c.cx + sd * s * 1.05, cy + s * 0.28, s * 0.05, '#e63946'); });
      ctx.save(); ctx.translate(c.cx, cy);
      for (var i = 0; i < 14; i++) { ctx.save(); ctx.rotate(i * TAU / 14); petalPath(ctx, s * 0.5, s * 0.12); ctx.fillStyle = i % 2 ? pal.deco[0] : shade(pal.deco[0], -0.15); ctx.fill(); ctx.restore(); }
      for (var j = 0; j < 10; j++) { ctx.save(); ctx.rotate(j * TAU / 10 + 0.3); petalPath(ctx, s * 0.36, s * 0.11); ctx.fillStyle = pal.deco[1] === '#ffffff' ? '#ffd166' : pal.deco[1]; ctx.fill(); ctx.restore(); }
      ctx.restore();
      for (var k = 0; k < 18; k++) { var a = k * TAU / 18; ctx.fillStyle = k % 2 ? '#ffd166' : '#fffaf0'; circle(ctx, c.cx + Math.cos(a) * s * 0.25, cy + Math.sin(a) * s * 0.25, s * 0.028); ctx.fill(); }
      var g = ctx.createRadialGradient(c.cx - s * 0.04, cy - s * 0.04, s * 0.01, c.cx, cy, s * 0.15);
      g.addColorStop(0, '#ff8fa3'); g.addColorStop(0.6, '#c1121f'); g.addColorStop(1, '#6a040f');
      ctx.fillStyle = g; circle(ctx, c.cx, cy, s * 0.15); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(ctx, c.cx - s * 0.05, cy - s * 0.05, s * 0.03); ctx.fill();
      ctx.restore();
    },
    flute: function (ctx, b, pal, rnd, u) {
      var c = C(b), s = Math.min(b.w * 0.8, b.h * 1.3);
      glow(ctx, c.cx, c.cy, s * 0.55, pal.glow, 0.4);
      feather(ctx, c.cx + s * 0.08, b.y + b.h * 0.98, Math.min(b.h * 0.95, s * 0.75), 0.42);
      flute(ctx, c.cx, c.cy + b.h * 0.08, s * 0.92, -0.28);
      var px = c.cx - s * 0.32, py = b.y + b.h * 0.96, pr = Math.min(b.h * 0.2, s * 0.13);
      var g = ctx.createRadialGradient(px - pr * 0.3, py - pr * 1.2, pr * 0.1, px, py - pr, pr * 1.1);
      g.addColorStop(0, '#f08a4b'); g.addColorStop(1, '#7a2a0c');
      ctx.fillStyle = g; circle(ctx, px, py - pr, pr); ctx.fill();
      ctx.fillStyle = '#a8441a'; rrect(ctx, px - pr * 0.5, py - pr * 2.1, pr, pr * 0.3, pr * 0.08); ctx.fill();
      ctx.fillStyle = '#fffdf2'; ctx.beginPath(); ctx.ellipse(px, py - pr * 2.12, pr * 0.55, pr * 0.22, 0, PI, TAU); ctx.fill();
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = Math.max(1, pr * 0.06); ctx.beginPath(); ctx.ellipse(px, py - pr, pr * 0.98, pr * 0.3, 0, 0.2, PI - 0.2); ctx.stroke();
    },
    modak: function (ctx, b, pal, rnd, u) {
      var c = C(b), s = Math.min(b.w * 0.17, b.h * 0.3), by = b.y + b.h * 0.86;
      glow(ctx, c.cx, by - s, s * 3, pal.glow, 0.45);
      ctx.fillStyle = lgrad(ctx, c.cx - s * 2.2, 0, c.cx + s * 2.2, 0, ['#a87408', '#ffe08a', '#c8901a', '#7a5208']);
      ctx.beginPath(); ctx.ellipse(c.cx, by, s * 2.3, s * 0.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2b9348'; ctx.beginPath(); ctx.ellipse(c.cx, by - s * 0.05, s * 1.9, s * 0.36, 0, 0, TAU); ctx.fill();
      [[-0.9, 0], [0, 0], [0.9, 0], [-0.45, -0.72], [0.45, -0.72], [0, -1.42]].forEach(function (p) { modak(ctx, c.cx + p[0] * s, by + p[1] * s, s * 0.95); });
      for (var i = 0; i < 9; i++) marigold(ctx, c.cx - s * 2.1 + i * s * 0.52, by + s * 0.42 + (i % 2) * s * 0.06, s * 0.16, i % 2 ? '#ff8c00' : '#ffc300');
      diya(ctx, c.cx + s * 2.65, by + s * 0.05, s * 0.9, pal);
      diya(ctx, c.cx - s * 2.75, by + s * 0.05, s * 0.9, pal);
    },
    garba: function (ctx, b, pal, rnd, u) {
      var c = C(b), s = Math.min(b.w * 0.42, b.h * 0.72), by = b.y + b.h * 0.96;
      mandalaOutline(ctx, c.cx, by - s * 0.55, s * 0.95, rgba(pal.gold, 0.45), u);
      dandiya(ctx, c.cx - s * 0.75, by - s * 0.55, s * 0.95, -0.9, pal.deco[0], pal.deco[1]);
      dandiya(ctx, c.cx - s * 0.75, by - s * 0.55, s * 0.95, -0.25, pal.deco[2], pal.deco[1]);
      dandiya(ctx, c.cx + s * 0.75, by - s * 0.55, s * 0.95, 0.9, pal.deco[3] || pal.deco[0], pal.deco[1]);
      dandiya(ctx, c.cx + s * 0.75, by - s * 0.55, s * 0.95, 0.25, pal.deco[0], pal.deco[2]);
      garbo(ctx, c.cx, by, s);
    },
    bow: function (ctx, b, pal, rnd, u) {
      var c = C(b), s = Math.min(b.w * 0.6, b.h * 0.95);
      glow(ctx, c.cx, c.cy, s * 0.7, pal.glow, 0.45);
      firework(ctx, b.x + b.w * 0.18, b.y + b.h * 0.3, s * 0.28, pal.deco[0], rnd, pal.dark);
      firework(ctx, b.x + b.w * 0.82, b.y + b.h * 0.3, s * 0.24, pal.deco[1], rnd, pal.dark);
      ctx.save(); ctx.translate(c.cx, c.cy); ctx.rotate(-0.6);
      ctx.strokeStyle = lgrad(ctx, 0, -s * 0.55, 0, s * 0.55, ['#ffe08a', '#b8860b', '#6b4423']); ctx.lineWidth = s * 0.045; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-s * 0.12, -s * 0.55); ctx.quadraticCurveTo(s * 0.42, 0, -s * 0.12, s * 0.55); ctx.stroke();
      ctx.fillStyle = '#c1121f'; rrect(ctx, s * 0.11, -s * 0.07, s * 0.08, s * 0.14, s * 0.02); ctx.fill();
      ctx.strokeStyle = '#fff8e7'; ctx.lineWidth = Math.max(1, s * 0.008);
      ctx.beginPath(); ctx.moveTo(-s * 0.12, -s * 0.55); ctx.lineTo(-s * 0.36, 0); ctx.lineTo(-s * 0.12, s * 0.55); ctx.stroke();
      ctx.strokeStyle = '#6b4423'; ctx.lineWidth = s * 0.018; ctx.beginPath(); ctx.moveTo(-s * 0.4, 0); ctx.lineTo(s * 0.56, 0); ctx.stroke();
      ctx.fillStyle = '#f2c14e'; ctx.beginPath(); ctx.moveTo(s * 0.66, 0); ctx.lineTo(s * 0.53, -s * 0.05); ctx.lineTo(s * 0.53, s * 0.05); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d00000';
      ctx.beginPath(); ctx.moveTo(-s * 0.4, 0); ctx.lineTo(-s * 0.32, -s * 0.05); ctx.lineTo(-s * 0.26, -s * 0.05); ctx.lineTo(-s * 0.32, 0); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-s * 0.4, 0); ctx.lineTo(-s * 0.32, s * 0.05); ctx.lineTo(-s * 0.26, s * 0.05); ctx.lineTo(-s * 0.32, 0); ctx.closePath(); ctx.fill();
      glow(ctx, s * 0.62, 0, s * 0.14, '#ffd166', 0.8);
      ctx.restore();
    },
    ribbon: function (ctx, b, pal, rnd, u) {
      var c = C(b), t = Math.min(b.h * 0.12, 70 * u), y = c.cy + b.h * 0.08;
      balloon(ctx, b.x + b.w * 0.1, b.y + b.h * 0.32, Math.min(b.w * 0.07, b.h * 0.15), pal.deco[0], [b.x + b.w * 0.14, b.y + b.h]);
      balloon(ctx, b.x + b.w * 0.9, b.y + b.h * 0.28, Math.min(b.w * 0.07, b.h * 0.15), pal.deco[2] || pal.deco[1], [b.x + b.w * 0.86, b.y + b.h]);
      ctx.fillStyle = lgrad(ctx, 0, y - t / 2, 0, y + t / 2, ['#ff6b6b', '#d62828', '#8f1414']);
      ctx.beginPath(); ctx.moveTo(b.x, y - t / 2); ctx.bezierCurveTo(b.x + b.w * 0.3, y - t / 2 - b.h * 0.08, b.x + b.w * 0.7, y - t / 2 + b.h * 0.08, b.x + b.w, y - t / 2);
      ctx.lineTo(b.x + b.w, y + t / 2); ctx.bezierCurveTo(b.x + b.w * 0.7, y + t / 2 + b.h * 0.08, b.x + b.w * 0.3, y + t / 2 - b.h * 0.08, b.x, y + t / 2); ctx.closePath(); ctx.fill();
      var bs = Math.min(b.w * 0.2, b.h * 0.42);
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath(); ctx.moveTo(c.cx, y); ctx.lineTo(c.cx - bs * 0.45, y + bs * 0.95); ctx.lineTo(c.cx - bs * 0.22, y + bs * 0.85); ctx.lineTo(c.cx - bs * 0.12, y + bs); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(c.cx, y); ctx.lineTo(c.cx + bs * 0.45, y + bs * 0.95); ctx.lineTo(c.cx + bs * 0.22, y + bs * 0.85); ctx.lineTo(c.cx + bs * 0.12, y + bs); ctx.closePath(); ctx.fill();
      [-1, 1].forEach(function (sd) {
        ctx.save(); ctx.translate(c.cx + sd * bs * 0.38, y - bs * 0.05); ctx.rotate(sd * -0.35);
        ctx.fillStyle = lgrad(ctx, 0, -bs * 0.3, 0, bs * 0.3, ['#ff6b6b', '#d62828', '#8f1414']);
        ctx.beginPath(); ctx.ellipse(0, 0, bs * 0.45, bs * 0.27, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(80,0,0,.35)'; ctx.beginPath(); ctx.ellipse(sd * -bs * 0.08, 0, bs * 0.18, bs * 0.1, 0, 0, TAU); ctx.fill();
        ctx.restore();
      });
      ctx.fillStyle = '#8f1414'; circle(ctx, c.cx, y - bs * 0.03, bs * 0.15); ctx.fill();
      var sx = c.cx + b.w * 0.18, sy = b.y + b.h * 0.22, ss = Math.min(b.w * 0.16, b.h * 0.3);
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(0.6);
      [-1, 1].forEach(function (sd) {
        ctx.save(); ctx.rotate(sd * 0.22);
        ctx.fillStyle = lgrad(ctx, -ss * 0.05, 0, ss * 0.05, 0, ['#f1f3f5', '#adb5bd']);
        ctx.beginPath(); ctx.moveTo(0, -ss * 0.05); ctx.lineTo(ss * 0.04 * sd, -ss * 0.62); ctx.lineTo(-ss * 0.02 * sd, -ss * 0.6); ctx.lineTo(-ss * 0.03, 0); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = ss * 0.05; circle(ctx, sd * ss * 0.04, ss * 0.2, ss * 0.13); ctx.stroke();
        ctx.restore();
      });
      ctx.restore();
      sparkles(ctx, b, 10, pal.gold, rnd, u, 0.6);
    },
    sale: function (ctx, b, pal, rnd, u) {
      var c = C(b), r = Math.min(b.w * 0.3, b.h * 0.46);
      ctx.save(); ctx.translate(c.cx, c.cy); ctx.rotate(-0.12);
      ctx.fillStyle = lgrad(ctx, 0, -r, 0, r, ['#fff3a3', '#ffd43b', '#f59f00']);
      starPath(ctx, 0, 0, r, r * 0.84, 22, 0); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = Math.max(2, r * 0.025); circle(ctx, 0, 0, r * 0.7); ctx.stroke();
      ctx.font = '900 ' + Math.round(r * 0.95) + 'px "Noto Sans", "Segoe UI", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
      ctx.fillStyle = '#c92a2a'; ctx.fillText('%', 0, r * 0.04);
      ctx.restore();
      [[-1, -0.35, pal.deco[1] || '#ffffff'], [1, 0.4, pal.deco[2] || '#ffffff']].forEach(function (p) {
        var tx = c.cx + p[0] * r * 1.35, ty = c.cy + p[1] * r, tw = r * 0.5, th = r * 0.3;
        ctx.save(); ctx.translate(tx, ty); ctx.rotate(p[0] * 0.4);
        ctx.fillStyle = p[2]; ctx.beginPath(); ctx.moveTo(-tw / 2, -th / 2); ctx.lineTo(tw * 0.3, -th / 2); ctx.lineTo(tw / 2, 0); ctx.lineTo(tw * 0.3, th / 2); ctx.lineTo(-tw / 2, th / 2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = pal.bg[1]; circle(ctx, tw * 0.25, 0, th * 0.12); ctx.fill();
        ctx.restore();
      });
      sparkles(ctx, b, 12, '#ffffff', rnd, u, 1);
    },
    bags: function (ctx, b, pal, rnd, u) {
      var c = C(b), h = Math.min(b.h * 0.62, b.w * 0.34), by = b.y + b.h * 0.95;
      glow(ctx, c.cx, by - h * 0.6, h * 1.6, pal.glow, 0.4);
      bag(ctx, c.cx - h * 0.62, by, h * 0.78, h * 0.86, pal.deco[1] === '#ffffff' ? '#ef476f' : pal.deco[1]);
      bag(ctx, c.cx + h * 0.64, by, h * 0.72, h * 0.8, pal.deco[3] || pal.deco[0]);
      bag(ctx, c.cx, by, h * 0.88, h, pal.deco[0]);
      for (var i = 0; i < 14; i++) { ctx.globalAlpha = 0.6 + rnd() * 0.4; sparkle(ctx, c.cx + (rnd() - 0.5) * b.w * 0.9, b.y + rnd() * b.h * 0.6, (6 + rnd() * 14) * u, i % 2 ? pal.gold : '#ffffff'); }
      ctx.globalAlpha = 1;
    },
    hearts: function (ctx, b, pal, rnd, u) {
      var c = C(b), s = Math.min(b.w * 0.42, b.h * 0.8);
      glow(ctx, c.cx, c.cy, s * 0.9, pal.glow, 0.45);
      heartPath(ctx, c.cx, c.cy + s * 0.05, s); ctx.fillStyle = lgrad(ctx, c.cx - s / 2, c.cy - s / 2, c.cx + s / 2, c.cy + s / 2, [shade(pal.deco[0], 0.3), pal.deco[0], shade(pal.deco[0], -0.25)]); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(c.cx - s * 0.2, c.cy - s * 0.12, s * 0.07, s * 0.12, -0.6, 0, TAU); ctx.fill();
      for (var i = 0; i < 7; i++) { var hx = c.cx + (rnd() - 0.5) * b.w * 0.9, hy = b.y + rnd() * b.h * 0.8, hs = s * (0.12 + rnd() * 0.12); heartPath(ctx, hx, hy, hs); ctx.fillStyle = rgba(pal.deco[(i + 1) % pal.deco.length] === '#ffffff' ? '#ff8fab' : pal.deco[(i + 1) % pal.deco.length], 0.8); ctx.fill(); }
      for (var k = 0; k < 7; k++) flower5(ctx, c.cx + (k - 3) * s * 0.28, b.y + b.h * 0.95 - (k % 2) * s * 0.06, s * 0.08, pal.deco[k % pal.deco.length] === '#ffffff' ? '#ffd166' : pal.deco[k % pal.deco.length], '#fff3b0');
    }
  };

  /* ------------------------------------------------------------ small motifs placed beside a photo */
  var mini = {
    diya: function (ctx, cx, cy, s, pal) { diya(ctx, cx - s * 0.1, cy + s * 0.15, s * 0.85, pal); },
    coin: function (ctx, cx, cy, s) { coinStack(ctx, cx, cy + s * 0.45, s * 0.32, 5); },
    gift: function (ctx, cx, cy, s, pal) { gift(ctx, cx, cy + s * 0.45, s * 0.75, pal.deco[0] === '#ffffff' ? '#d62828' : pal.deco[0], '#ffd166'); },
    firework: function (ctx, cx, cy, s, pal, rnd) { firework(ctx, cx, cy, s * 0.55, pal.deco[0], rnd, pal.dark); },
    flame: function (ctx, cx, cy, s, pal, rnd) { glow(ctx, cx, cy, s * 0.7, '#ff9f1c', 0.5); flames(ctx, cx, cy + s * 0.45, s * 0.8, s * 0.6, ['#ffba08', '#e85d04'], rnd); },
    kite: function (ctx, cx, cy, s, pal) { kite(ctx, cx, cy - s * 0.1, s * 0.75, pal.deco[0], pal.deco[1], 0.2); },
    flower: function (ctx, cx, cy, s) { leaf(ctx, cx, cy + s * 0.1, s * 0.5, PI + 0.9, '#43a047', '#1b5e20'); leaf(ctx, cx, cy + s * 0.1, s * 0.5, PI - 0.9, '#43a047', '#1b5e20'); marigold(ctx, cx - s * 0.2, cy + s * 0.2, s * 0.2, '#ffc300'); marigold(ctx, cx + s * 0.2, cy + s * 0.22, s * 0.18, '#ff8c00'); marigold(ctx, cx, cy - s * 0.05, s * 0.22, '#ff8c00'); },
    balloon: function (ctx, cx, cy, s, pal) { balloon(ctx, cx, cy - s * 0.15, s * 0.32, pal.deco[0], [cx, cy + s * 0.55]); },
    splash: function (ctx, cx, cy, s, pal, rnd) { cloud(ctx, cx, cy, s * 0.5, pal.deco[0], rnd); },
    lantern: function (ctx, cx, cy, s, pal) { lantern(ctx, cx, cy - s * 0.45, s * 0.9, pal.gold); },
    lotus: function (ctx, cx, cy, s) { lotus(ctx, cx, cy + s * 0.35, s * 0.85); },
    egg: function (ctx, cx, cy, s) { egg(ctx, cx, cy + s * 0.4, s * 0.75, ['#a0c4ff', '#ffd166', '#ff8fab'], 0.2); },
    wheat: function (ctx, cx, cy, s) { for (var i = -2; i <= 2; i++) wheat(ctx, cx, cy + s * 0.5, s * 1.0, i * 0.14, '#b8860b'); },
    feather: function (ctx, cx, cy, s) { feather(ctx, cx, cy + s * 0.5, s * 1.05, 0.3); },
    dandiya: function (ctx, cx, cy, s, pal) { dandiya(ctx, cx, cy, s, 0.7, pal.deco[0], pal.deco[1]); dandiya(ctx, cx, cy, s, -0.7, pal.deco[2] || pal.deco[0], pal.deco[1]); },
    sparkle: function (ctx, cx, cy, s, pal) { sparkle(ctx, cx, cy, s * 0.35, pal.gold); sparkle(ctx, cx + s * 0.3, cy - s * 0.3, s * 0.15, '#ffffff'); sparkle(ctx, cx - s * 0.28, cy + s * 0.25, s * 0.12, pal.gold); },
    heart: function (ctx, cx, cy, s, pal) { heartPath(ctx, cx, cy, s * 0.7); ctx.fillStyle = pal.deco[0] === '#ffffff' ? '#ff8fab' : pal.deco[0]; ctx.fill(); }
  };

  return {
    rng: rng, rgba: rgba, shade: shade, rrect: rrect, circle: circle, glow: glow, diamond: diamond, sparkle: sparkle, lgrad: lgrad,
    background: background, border: border, top: top, bottom: bottom, hero: hero, mini: mini
  };
})();
