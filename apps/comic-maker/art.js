/* Comic Strip Maker: every picture here is original vector art drawn in code (no images, no known characters).
 * window.COMIC_ART = { person, animal, bg, BGS, SKIN, HAIRC, OUTC, ANIMAL_COLS, WF, face }
 * Characters are drawn in a 100-unit tall box with the origin at the feet (bottom centre), y going up (negative).
 */
(function () {
  'use strict';
  var OL = '#2a211b', PI = Math.PI;

  /* ---------------------------------------------------------------- helpers */
  function hexRgb(h) { h = String(h || '#000').replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); var n = parseInt(h, 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function shade(h, amt) {
    var c = hexRgb(h).map(function (v) { return amt < 0 ? v * (1 + amt) : v + (255 - v) * amt; });
    return '#' + c.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join('');
  }
  function rrect(ctx, x, y, w, h, r) {
    if (w < 0) { x += w; w = -w; } if (h < 0) { y += h; h = -h; }
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function ell(ctx, x, y, rx, ry, rot) { ctx.moveTo(x + Math.abs(rx) * Math.cos(rot || 0), y + Math.abs(rx) * Math.sin(rot || 0)); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, 2 * PI); }
  function shape(ctx, build, fill, lw) {
    ctx.beginPath(); build();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (lw !== 0) { ctx.lineWidth = lw || 1.5; ctx.strokeStyle = OL; ctx.stroke(); }
  }
  function limb(ctx, pts, color, w) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.strokeStyle = OL; ctx.lineWidth = w + 1.6; ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke();
  }
  function lerp(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; }
  function rng(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------------------------------------------------------------- palettes */
  var SKIN = ['#f8dcc0', '#eec39a', '#d9a273', '#c08556', '#9a633d', '#6b4226'];
  var HAIRC = ['#1d1915', '#4b2e1c', '#87522b', '#c58b3c', '#9a9a9a', '#ecebe6'];
  var OUTC = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#00897b', '#1e88e5', '#3949ab', '#8e24aa', '#d81b60', '#f5f5f5', '#6d4c41', '#263238'];
  var ANIMAL_COLS = {
    cat: ['#f0a040', '#9aa0a6', '#3a3a3a', '#f5f2ea'],
    dog: ['#b07a45', '#e0b060', '#f3efe6', '#3b3b3b'],
    cow: ['#f7f4ee', '#a0633a', '#e8d8b8'],
    elephant: ['#9aa3ad', '#b8aaa2'],
    parrot: ['#43a047', '#1e88e5', '#e53935'],
    monkey: ['#8d5a3b', '#c48a4b']
  };
  /* bounding-box width as a share of the height, per character kind */
  var WF = { person: 0.62, cat: 0.82, dog: 0.86, cow: 1.3, elephant: 1.3, parrot: 0.62, monkey: 0.95 };

  /* ---------------------------------------------------------------- faces (shared by people and animals) */
  function mouth(ctx, ex, cx, my, mw, lw) {
    ctx.lineWidth = lw; ctx.strokeStyle = OL; ctx.lineCap = 'round';
    ctx.beginPath();
    switch (ex) {
      case 'happy':
        ctx.moveTo(cx - mw / 2, my); ctx.quadraticCurveTo(cx, my + mw * 0.95, cx + mw / 2, my);
        ctx.quadraticCurveTo(cx, my + mw * 0.22, cx - mw / 2, my); ctx.closePath();
        ctx.fillStyle = '#8a2f2f'; ctx.fill(); ctx.lineWidth = lw * 0.8; ctx.stroke(); break;
      case 'sad':
        ctx.moveTo(cx - mw * 0.38, my + mw * 0.34); ctx.quadraticCurveTo(cx, my - mw * 0.16, cx + mw * 0.38, my + mw * 0.34); ctx.stroke(); break;
      case 'angry':
        rrect(ctx, cx - mw * 0.4, my, mw * 0.8, mw * 0.32, mw * 0.1); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = lw * 0.8; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - mw * 0.4, my + mw * 0.16); ctx.lineTo(cx + mw * 0.4, my + mw * 0.16); ctx.lineWidth = lw * 0.5; ctx.stroke(); break;
      case 'surprised':
        ell(ctx, cx, my + mw * 0.16, mw * 0.2, mw * 0.27); ctx.fillStyle = '#5a1f1f'; ctx.fill(); ctx.lineWidth = lw * 0.8; ctx.stroke(); break;
      case 'thinking':
        ctx.moveTo(cx - mw * 0.05, my + mw * 0.2); ctx.quadraticCurveTo(cx + mw * 0.2, my + mw * 0.08, cx + mw * 0.4, my + mw * 0.12); ctx.stroke(); break;
      default:
        ctx.moveTo(cx - mw * 0.25, my + mw * 0.15); ctx.lineTo(cx + mw * 0.25, my + mw * 0.15); ctx.stroke();
    }
  }
  /* o: {ex, style, cx, ey, dx, er, by, bw, my, mw, browC, lw, cheeks, mouth, cheekY} */
  function face(ctx, o) {
    var ex = o.ex, er = o.er * (ex === 'surprised' ? 1.28 : 1);
    var lx = ex === 'thinking' ? er * 0.45 : 0, ly = ex === 'thinking' ? -er * 0.5 : 0;
    [-1, 1].forEach(function (s) {
      var x = o.cx + s * o.dx, y = o.ey + (ex === 'angry' ? er * 0.15 : 0);
      if (o.style === 'big') {
        shape(ctx, function () { ell(ctx, x, y, er * 1.55, er * 1.85 * (ex === 'angry' ? 0.78 : 1)); }, '#fff', o.lw * 0.7);
        ctx.beginPath(); ctx.arc(x + lx, y + ly + (ex === 'sad' ? er * 0.3 : 0), er * (ex === 'surprised' ? 0.72 : 0.95), 0, 2 * PI); ctx.fillStyle = '#1b1410'; ctx.fill();
        ctx.beginPath(); ctx.arc(x + lx - er * 0.3, y + ly - er * 0.35, er * 0.3, 0, 2 * PI); ctx.fillStyle = '#fff'; ctx.fill();
      } else {
        if (ex === 'surprised') shape(ctx, function () { ell(ctx, x, y, er * 1.5, er * 1.65); }, '#fff', o.lw * 0.6);
        ctx.beginPath(); ell(ctx, x + lx * 0.6, y + ly * 0.6, er, er * 1.15); ctx.fillStyle = '#1b1410'; ctx.fill();
        if (o.style === 'lashes') {
          ctx.strokeStyle = '#1b1410'; ctx.lineWidth = o.lw * 0.6; ctx.lineCap = 'round'; ctx.beginPath();
          ctx.moveTo(x + s * er * 0.7, y - er * 0.8); ctx.lineTo(x + s * er * 1.6, y - er * 1.5);
          ctx.moveTo(x + s * er * 0.1, y - er * 1.1); ctx.lineTo(x + s * er * 0.5, y - er * 2.0); ctx.stroke();
        }
      }
    });
    if (o.by !== undefined) {
      ctx.strokeStyle = o.browC || OL; ctx.lineWidth = o.lw * (ex === 'angry' ? 1.5 : 1.05); ctx.lineCap = 'round';
      [-1, 1].forEach(function (s) {
        var x = o.cx + s * o.dx, y = o.by, w = o.bw, xin = x - s * w, xout = x + s * w;
        ctx.beginPath();
        if (ex === 'sad') { ctx.moveTo(xout, y + w * 0.2); ctx.lineTo(xin, y - w * 0.45); }
        else if (ex === 'angry') { ctx.moveTo(xout, y - w * 0.4); ctx.lineTo(xin, y + w * 0.4); }
        else if (ex === 'surprised') { ctx.moveTo(xout, y - w * 0.5); ctx.quadraticCurveTo(x, y - w * 1.35, xin, y - w * 0.55); }
        else if (ex === 'thinking' && s < 0) { ctx.moveTo(xout, y - w * 0.3); ctx.quadraticCurveTo(x, y - w * 1.2, xin, y - w * 0.4); }
        else if (ex === 'neutral' || ex === 'thinking') { ctx.moveTo(xout, y); ctx.lineTo(xin, y); }
        else { ctx.moveTo(xout, y); ctx.quadraticCurveTo(x, y - w * 0.6, xin, y); }
        ctx.stroke();
      });
    }
    if (o.cheeks && (ex === 'happy' || ex === 'angry')) {
      ctx.fillStyle = ex === 'angry' ? 'rgba(230,60,50,0.35)' : 'rgba(255,105,120,0.32)';
      [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.arc(o.cx + s * o.dx * 1.35, o.cheekY !== undefined ? o.cheekY : o.my - o.mw * 0.1, o.mw * 0.26, 0, 2 * PI); ctx.fill(); });
    }
    if (ex === 'sad') {
      var tx = o.cx + o.dx + er * 0.4, ty = o.ey + er * 2.3, tr = er * 0.75;
      shape(ctx, function () { ctx.moveTo(tx, ty - tr * 2); ctx.quadraticCurveTo(tx + tr * 1.1, ty - tr * 0.2, tx, ty + tr); ctx.quadraticCurveTo(tx - tr * 1.1, ty - tr * 0.2, tx, ty - tr * 2); }, '#7cc8ff', o.lw * 0.5);
    }
    if (o.mouth !== false) mouth(ctx, ex, o.cx, o.my, o.mw, o.lw);
  }

  /* ---------------------------------------------------------------- people */
  function person(ctx, L) {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    var kid = L.age === 'kid', elder = L.age === 'elder';
    var hr = kid ? 14.5 : 11.5, hcy = kid ? -83 : -86.5, sh = kid ? -66.5 : -72, sw = kid ? 10 : 12.5, wy = kid ? -38 : -43;
    var skin = SKIN[L.skin] || SKIN[1], hc = HAIRC[L.hairC] || HAIRC[0], oc = OUTC[L.outC] || OUTC[0];
    var o = L.outfit, pagdi = L.hat === 'pagdi';
    var top = o === 'uniform' ? '#fbfbfb' : o === 'saree' ? shade(oc, -0.3) : oc;
    var pants = { tshirt: '#3d5a8a', shirt: '#4b4744', kurta: '#f1ece0', uniform: '#283b6b' }[o] || '#3d5a8a';
    var armLen = kid ? 22 : 26;

    /* hair behind the head */
    if (L.hair === 'long' && !pagdi) shape(ctx, function () { rrect(ctx, -hr * 1.12, hcy - hr * 0.4, hr * 2.24, (sh + 13) - (hcy - hr * 0.4), hr * 0.7); }, hc);
    if (L.hair === 'bun' && !pagdi) shape(ctx, function () { ctx.arc(0, hcy - hr * 1.1, hr * 0.42, 0, 2 * PI); }, hc);

    /* legs and shoes */
    if (o !== 'saree') {
      var lc = o === 'frock' ? skin : pants;
      [-1, 1].forEach(function (s) { shape(ctx, function () { rrect(ctx, s * 3.7 - 2.8, wy - 2, 5.6, -wy - 0.5, 2); }, lc); });
    }
    [-1, 1].forEach(function (s) { shape(ctx, function () { ell(ctx, s * 4.6, -2, 4.3, 2.3); }, '#3b2a20'); });

    /* saree skirt */
    if (o === 'saree') {
      shape(ctx, function () { ctx.moveTo(-sw + 1.5, wy - 1); ctx.lineTo(-sw - 3, -1.5); ctx.lineTo(sw + 3, -1.5); ctx.lineTo(sw - 1.5, wy - 1); ctx.closePath(); }, oc);
      shape(ctx, function () { ctx.moveTo(-sw - 2.6, -5); ctx.lineTo(sw + 2.6, -5); ctx.lineTo(sw + 3, -1.5); ctx.lineTo(-sw - 3, -1.5); ctx.closePath(); }, '#f2c14e', 1);
      ctx.strokeStyle = shade(oc, -0.28); ctx.lineWidth = 0.8; ctx.beginPath();
      [1, 3.2, 5.4].forEach(function (x) { ctx.moveTo(x, wy + 6); ctx.lineTo(x + 0.8, -5); }); ctx.stroke();
    }

    /* neck + body */
    shape(ctx, function () { rrect(ctx, -2.6, sh - 5, 5.2, 7, 1.5); }, skin, 1.2);
    var bot = o === 'kurta' ? -21 : o === 'frock' ? -27 : wy + 1;
    var flare = o === 'frock' ? 7 : o === 'kurta' ? 1.5 : -1.2;
    shape(ctx, function () {
      ctx.moveTo(-sw, sh + 3.5); ctx.quadraticCurveTo(-sw, sh, -sw + 3.5, sh); ctx.lineTo(sw - 3.5, sh);
      ctx.quadraticCurveTo(sw, sh, sw, sh + 3.5); ctx.lineTo(sw + flare, bot); ctx.lineTo(-sw - flare, bot); ctx.closePath();
    }, o === 'saree' ? top : top);

    /* outfit details */
    ctx.lineWidth = 0.9; ctx.strokeStyle = OL;
    if (o === 'tshirt') { ctx.beginPath(); ctx.arc(0, sh, 3.4, 0.1, PI - 0.1); ctx.stroke(); }
    if (o === 'shirt' || o === 'uniform') {
      shape(ctx, function () { ctx.moveTo(-0.5, sh + 0.5); ctx.lineTo(-4.5, sh - 0.5); ctx.lineTo(-3.4, sh + 4); ctx.closePath(); }, '#ffffff', 0.9);
      shape(ctx, function () { ctx.moveTo(0.5, sh + 0.5); ctx.lineTo(4.5, sh - 0.5); ctx.lineTo(3.4, sh + 4); ctx.closePath(); }, '#ffffff', 0.9);
    }
    if (o === 'shirt') { ctx.fillStyle = OL; for (var by = sh + 7; by < wy - 2; by += 6.5) { ctx.beginPath(); ctx.arc(0, by, 0.7, 0, 2 * PI); ctx.fill(); } }
    if (o === 'uniform') {
      shape(ctx, function () { ctx.moveTo(-1.6, sh + 1.5); ctx.lineTo(1.6, sh + 1.5); ctx.lineTo(2.3, sh + 14); ctx.lineTo(0, sh + 17); ctx.lineTo(-2.3, sh + 14); ctx.closePath(); }, oc, 0.9);
      shape(ctx, function () { rrect(ctx, -sw + 1, wy - 2.5, (sw - 1) * 2, 3, 1); }, '#283b6b', 0.8);
    }
    if (o === 'kurta') {
      ctx.beginPath(); ctx.moveTo(0, sh + 0.5); ctx.lineTo(0, sh + 13); ctx.stroke();
      ctx.fillStyle = '#f2c14e'; [sh + 4, sh + 8, sh + 12].forEach(function (y) { ctx.beginPath(); ctx.arc(0.01, y, 0.8, 0, 2 * PI); ctx.fill(); });
      ctx.beginPath(); ctx.moveTo(-sw - 1, bot); ctx.lineTo(-sw + 0.5, bot - 6); ctx.moveTo(sw + 1, bot); ctx.lineTo(sw - 0.5, bot - 6); ctx.stroke();
    }
    if (o === 'frock') {
      shape(ctx, function () { rrect(ctx, -sw - 0.8, wy - 3, (sw + 0.8) * 2, 3.2, 1); }, shade(oc, -0.25), 0.8);
      shape(ctx, function () { ctx.arc(0, sh, 4.2, 0, PI); ctx.closePath(); }, '#ffffff', 0.8);
    }
    if (o === 'saree') {
      shape(ctx, function () { ctx.moveTo(-sw + 0.5, sh + 0.5); ctx.quadraticCurveTo(-sw - 5, sh + 18, -sw - 3.5, wy + 14); ctx.lineTo(-sw + 0.8, wy + 12); ctx.closePath(); }, shade(oc, -0.12), 1);
      shape(ctx, function () { ctx.moveTo(-sw + 0.5, sh + 0.5); ctx.lineTo(-sw + 7, sh); ctx.lineTo(sw + 0.5, wy + 0.5); ctx.lineTo(sw - 6, wy + 2.5); ctx.closePath(); }, oc, 1);
      ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-sw + 6.3, sh + 0.6); ctx.lineTo(sw - 0.2, wy + 1.2); ctx.stroke();
    }

    /* arms (drawn over the body) */
    var sx = sw - 1.8, sy = sh + 2.8, longSleeve = o === 'shirt' || o === 'kurta';
    function armPts(s) {
      if (s === 1 && L.pose === 'wave') return [[sx, sy], [sx + 7, sy - 6], [sx + 8, sy - 19]];
      if (s === 1 && L.pose === 'point') return [[sx, sy], [sx + 9, sy + 2], [sx + 19, sy]];
      return [[s * sx, sy], [s * (sx + 2.6), sy + armLen / 2], [s * (sx + 3.2), sy + armLen]];
    }
    var hands = [];
    [-1, 1].forEach(function (s) {
      var p = armPts(s);
      limb(ctx, p, skin, 4.6);
      var cut = longSleeve ? [p[0], p[1], lerp(p[1], p[2], 0.75)] : [p[0], lerp(p[0], p[1], 0.5)];
      limb(ctx, cut, top === '#fbfbfb' ? '#fbfbfb' : top, 5);
      hands.push(p[2]);
    });
    if (elder && L.pose !== 'point' && L.pose !== 'wave') {
      var hx = hands[1][0], hy = hands[1][1];
      ctx.strokeStyle = OL; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(hx + 1, hy - 3); ctx.quadraticCurveTo(hx + 1, hy - 6, hx + 4, hy - 5.5); ctx.moveTo(hx + 1, hy - 3); ctx.lineTo(hx + 2.2, -0.5); ctx.stroke();
      ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 1.8; ctx.stroke();
    }
    hands.forEach(function (h) { shape(ctx, function () { ctx.arc(h[0], h[1], 2.9, 0, 2 * PI); }, skin, 1.1); });

    /* plait in front of the shoulder */
    if (L.hair === 'braid' && !pagdi) {
      var bx0 = -hr * 0.78, by0 = hcy + hr * 0.6, bx1 = -sw + 1.2, by1 = sh + (kid ? 18 : 22);
      for (var k = 0; k <= 5; k++) { var q = lerp([bx0, by0], [bx1, by1], k / 5); shape(ctx, function () { ell(ctx, q[0], q[1], 2.4, 3.1); }, hc, 0.9); }
      shape(ctx, function () { ctx.moveTo(bx1, by1 + 2); ctx.lineTo(bx1 - 3, by1 + 5); ctx.lineTo(bx1 + 3, by1 + 5); ctx.closePath(); }, oc === '#f5f5f5' ? '#e53935' : oc, 0.8);
    }

    /* head */
    [-1, 1].forEach(function (s) { shape(ctx, function () { ell(ctx, s * hr * 0.98, hcy + hr * 0.1, hr * 0.24, hr * 0.3); }, skin, 1.1); });
    shape(ctx, function () {
      if (L.face === 'oval') ell(ctx, 0, hcy + hr * 0.06, hr * 0.9, hr * 1.1);
      else if (L.face === 'square') rrect(ctx, -hr * 0.98, hcy - hr, hr * 1.96, hr * 2.05, hr * 0.45);
      else ell(ctx, 0, hcy, hr, hr);
    }, skin, 1.4);

    /* hair on top */
    if (!pagdi) hairFront(ctx, L.hair, hr, hcy, hc);

    /* face */
    var ey = hcy + hr * (kid ? 0.12 : 0.06), my = hcy + hr * 0.5;
    var browC = L.hairC >= 4 ? '#6d625a' : hc;
    face(ctx, { ex: L.expr, style: L.eyes, cx: 0, ey: ey, dx: hr * 0.4, er: hr * (kid ? 0.12 : 0.1), by: ey - hr * 0.34, bw: hr * 0.17, my: my, mw: hr * 0.55, browC: browC, lw: 1.1, cheeks: true, cheekY: my - hr * 0.06 });
    ctx.strokeStyle = OL; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(0, ey + hr * 0.25, hr * 0.09, 0.15 * PI, 0.85 * PI); ctx.stroke();
    if (L.mous) {
      ctx.fillStyle = L.hairC >= 4 ? '#bdb7ae' : hc; ctx.beginPath();
      ell(ctx, -hr * 0.17, my - hr * 0.1, hr * 0.2, hr * 0.08, -0.25); ell(ctx, hr * 0.17, my - hr * 0.1, hr * 0.2, hr * 0.08, 0.25); ctx.fill();
    }
    if (L.bindi) { ctx.fillStyle = '#d0021b'; ctx.beginPath(); ctx.arc(0, ey - hr * 0.42, hr * 0.075, 0, 2 * PI); ctx.fill(); }
    if (L.glasses) {
      ctx.strokeStyle = '#33302c'; ctx.lineWidth = 1.1; ctx.fillStyle = 'rgba(255,255,255,0.18)';
      [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.arc(s * hr * 0.4, ey, hr * 0.27, 0, 2 * PI); ctx.fill(); ctx.stroke(); });
      ctx.beginPath(); ctx.moveTo(-hr * 0.13, ey - hr * 0.05); ctx.quadraticCurveTo(0, ey - hr * 0.15, hr * 0.13, ey - hr * 0.05);
      ctx.moveTo(-hr * 0.67, ey - hr * 0.05); ctx.lineTo(-hr * 0.95, ey - hr * 0.1); ctx.moveTo(hr * 0.67, ey - hr * 0.05); ctx.lineTo(hr * 0.95, ey - hr * 0.1); ctx.stroke();
    }

    /* headwear */
    if (L.hat === 'cap') {
      shape(ctx, function () { ctx.ellipse(0, hcy - hr * 0.3, hr * 1.08, hr * 0.85, 0, PI, 2 * PI); ctx.closePath(); }, '#2f6fd0', 1.2);
      shape(ctx, function () { ell(ctx, hr * 0.8, hcy - hr * 0.32, hr * 0.85, hr * 0.2); }, '#24569f', 1.1);
      shape(ctx, function () { ctx.arc(0, hcy - hr * 1.13, hr * 0.12, 0, 2 * PI); }, '#24569f', 0.8);
    } else if (L.hat === 'topi') {
      shape(ctx, function () { ctx.moveTo(-hr * 0.98, hcy - hr * 0.42); ctx.lineTo(hr * 0.98, hcy - hr * 0.42); ctx.lineTo(hr * 0.8, hcy - hr * 1.1); ctx.quadraticCurveTo(0, hcy - hr * 0.88, -hr * 0.8, hcy - hr * 1.1); ctx.closePath(); }, '#fbfaf4', 1.1);
      ctx.lineWidth = 0.7; ctx.strokeStyle = '#9a958a'; ctx.beginPath(); ctx.moveTo(-hr * 0.92, hcy - hr * 0.62); ctx.lineTo(hr * 0.92, hcy - hr * 0.62); ctx.stroke();
    } else if (pagdi) {
      var pc = '#f39c12';
      shape(ctx, function () { ctx.moveTo(-hr * 1.1, hcy - hr * 0.05); ctx.bezierCurveTo(-hr * 1.3, hcy - hr * 1.6, hr * 1.3, hcy - hr * 1.6, hr * 1.1, hcy - hr * 0.05); ctx.quadraticCurveTo(0, hcy - hr * 0.6, -hr * 1.1, hcy - hr * 0.05); ctx.closePath(); }, pc, 1.3);
      ctx.strokeStyle = shade(pc, -0.3); ctx.lineWidth = 0.9; ctx.beginPath();
      ctx.moveTo(-hr * 1.0, hcy - hr * 0.42); ctx.quadraticCurveTo(-hr * 0.1, hcy - hr * 1.2, hr * 0.95, hcy - hr * 0.95);
      ctx.moveTo(-hr * 0.95, hcy - hr * 0.75); ctx.quadraticCurveTo(0, hcy - hr * 1.38, hr * 0.7, hcy - hr * 1.2); ctx.stroke();
    }
  }
  function hairFront(ctx, style, hr, hcy, hc) {
    function cap(part) {
      ctx.arc(0, hcy, hr * 1.07, PI * 0.95, PI * 2.05);
      if (part) {
        ctx.lineTo(hr * 0.95, hcy - hr * 0.05); ctx.quadraticCurveTo(hr * 0.55, hcy - hr * 0.72, 0, hcy - hr * 0.8);
        ctx.quadraticCurveTo(-hr * 0.55, hcy - hr * 0.72, -hr * 0.95, hcy - hr * 0.05);
      } else {
        ctx.lineTo(hr * 0.9, hcy - hr * 0.15); ctx.quadraticCurveTo(hr * 0.5, hcy - hr * 0.62, -hr * 0.1, hcy - hr * 0.5);
        ctx.quadraticCurveTo(-hr * 0.6, hcy - hr * 0.45, -hr * 0.92, hcy - hr * 0.05);
      }
      ctx.closePath();
    }
    if (style === 'bald') {
      [-1, 1].forEach(function (s) { shape(ctx, function () { ell(ctx, s * hr * 0.86, hcy - hr * 0.08, hr * 0.2, hr * 0.36); }, hc, 1); });
      return;
    }
    if (style === 'curly') {
      var pts = []; for (var a = 190; a <= 350; a += 20) pts.push([Math.cos(a * PI / 180) * hr * 0.98, hcy + Math.sin(a * PI / 180) * hr * 0.98]);
      ctx.lineWidth = 3; ctx.strokeStyle = OL;
      pts.forEach(function (p) { ctx.beginPath(); ctx.arc(p[0], p[1], hr * 0.32, 0, 2 * PI); ctx.stroke(); });
      ctx.fillStyle = hc;
      pts.forEach(function (p) { ctx.beginPath(); ctx.arc(p[0], p[1], hr * 0.32, 0, 2 * PI); ctx.fill(); });
      shape(ctx, function () { cap(false); }, hc, 0);
      return;
    }
    if (style === 'spiky') {
      shape(ctx, function () {
        for (var a = 195, i = 0; a <= 345; a += 15, i++) {
          var r = i % 2 ? hr * 0.95 : hr * 1.42, x = Math.cos(a * PI / 180) * r, y = hcy + Math.sin(a * PI / 180) * r;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
      }, hc, 1.2);
    }
    shape(ctx, function () { cap(style === 'long' || style === 'bun' || style === 'braid'); }, hc, 1.2);
  }

  /* ---------------------------------------------------------------- animals */
  function animal(ctx, L) {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    var cols = ANIMAL_COLS[L.kind] || ANIMAL_COLS.cat, c = cols[L.color] || cols[0], ex = L.expr || 'happy';
    var light = shade(c, 0.45), dark = shade(c, -0.3);
    var f = DRAW[L.kind] || DRAW.cat;
    f(ctx, c, light, dark, ex, L);
  }
  var DRAW = {
    cat: function (ctx, c, light, dark, ex) {
      ctx.strokeStyle = OL; ctx.lineWidth = 8.6; ctx.beginPath(); ctx.moveTo(14, -8); ctx.bezierCurveTo(38, -10, 40, -36, 28, -46); ctx.stroke();
      ctx.strokeStyle = c; ctx.lineWidth = 7; ctx.stroke();
      shape(ctx, function () { ell(ctx, 0, -28, 22, 27); }, c);
      shape(ctx, function () { ell(ctx, 0, -27, 10.5, 17); }, light, 0);
      [-1, 1].forEach(function (s) { shape(ctx, function () { ell(ctx, s * 8, -3.5, 6.5, 4); }, light, 1.2); });
      [-1, 1].forEach(function (s) {
        shape(ctx, function () { ctx.moveTo(s * 20, -76); ctx.lineTo(s * 17, -99); ctx.lineTo(s * 4, -88); ctx.closePath(); }, c, 1.4);
        shape(ctx, function () { ctx.moveTo(s * 17, -80); ctx.lineTo(s * 15.5, -94); ctx.lineTo(s * 8, -88); ctx.closePath(); }, '#f6a5b5', 0);
      });
      shape(ctx, function () { ell(ctx, 0, -69, 22, 20); }, c, 1.5);
      if (c === '#f0a040') { ctx.strokeStyle = dark; ctx.lineWidth = 1.6; ctx.beginPath(); [-5, 0, 5].forEach(function (x) { ctx.moveTo(x, -88); ctx.lineTo(x, -82); }); ctx.stroke(); }
      shape(ctx, function () { ell(ctx, 0, -62, 9, 6.5); }, light, 0);
      face(ctx, { ex: ex, style: 'big', cx: 0, ey: -72, dx: 8.5, er: 2.5, by: ex === 'happy' ? undefined : -79, bw: 3.6, my: -58.5, mw: 8, browC: dark, lw: 1.1, mouth: ex !== 'happy', cheeks: false });
      shape(ctx, function () { ctx.moveTo(-2.4, -64.5); ctx.lineTo(2.4, -64.5); ctx.lineTo(0, -62); ctx.closePath(); }, '#f07a90', 0.8);
      if (ex === 'happy') { ctx.strokeStyle = OL; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(0, -62); ctx.quadraticCurveTo(-2, -58.5, -4.5, -60.5); ctx.moveTo(0, -62); ctx.quadraticCurveTo(2, -58.5, 4.5, -60.5); ctx.stroke(); }
      ctx.strokeStyle = OL; ctx.lineWidth = 0.7; ctx.beginPath();
      [-1, 1].forEach(function (s) { [-1.5, 1].forEach(function (d) { ctx.moveTo(s * 9, -62 + d); ctx.lineTo(s * 21, -63 + d * 2.4); }); }); ctx.stroke();
    },
    dog: function (ctx, c, light, dark, ex) {
      ctx.strokeStyle = OL; ctx.lineWidth = 7.6; ctx.beginPath(); ctx.moveTo(16, -10); ctx.quadraticCurveTo(34, -18, 33, -38); ctx.stroke();
      ctx.strokeStyle = c; ctx.lineWidth = 6; ctx.stroke();
      shape(ctx, function () { ell(ctx, 0, -28, 22, 27); }, c);
      shape(ctx, function () { ell(ctx, 0, -27, 11, 17); }, light, 0);
      [-1, 1].forEach(function (s) { shape(ctx, function () { ell(ctx, s * 8.5, -3.5, 7, 4.2); }, light, 1.2); });
      shape(ctx, function () { ell(ctx, 0, -70, 21, 19.5); }, c, 1.5);
      if (c === '#f3efe6') shape(ctx, function () { ell(ctx, 8, -76, 6.5, 6); }, '#b07a45', 0);
      [-1, 1].forEach(function (s) { shape(ctx, function () { ell(ctx, s * 20, -68, 6.5, 14, s * 0.25); }, dark, 1.3); });
      shape(ctx, function () { ell(ctx, 0, -61, 11, 8); }, light, 1.1);
      shape(ctx, function () { ell(ctx, 0, -65, 4.2, 3); }, '#1f1b18', 0);
      face(ctx, { ex: ex, style: 'big', cx: 0, ey: -75, dx: 8, er: 2.4, by: -82, bw: 3.4, my: -59, mw: 9, browC: shade(c, -0.5), lw: 1.1, mouth: true });
      if (ex === 'happy') shape(ctx, function () { rrect(ctx, -2.5, -56, 5, 6.5, 2.5); }, '#f07a90', 0.9);
    },
    cow: function (ctx, c, light, dark, ex) {
      var spots = c === '#f7f4ee';
      ctx.strokeStyle = OL; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-50, -58); ctx.quadraticCurveTo(-58, -45, -55, -30); ctx.stroke();
      shape(ctx, function () { ell(ctx, -55, -28, 2.6, 4.2); }, '#3a2a20', 0.8);
      [-42, -30, 16, 27].forEach(function (x) { shape(ctx, function () { rrect(ctx, x, -34, 7.5, 31, 2); }, c, 1.3); shape(ctx, function () { rrect(ctx, x - 0.3, -6, 8.1, 5, 1.2); }, '#3a2a20', 1); });
      shape(ctx, function () { rrect(ctx, -52, -66, 88, 38, 16); }, c, 1.6);
      if (spots) { ctx.fillStyle = '#2f2a28'; [[-34, -54, 9, 7], [-10, -40, 7, 6], [10, -56, 8, 6], [-44, -38, 5, 4]].forEach(function (s) { ctx.beginPath(); ell(ctx, s[0], s[1], s[2], s[3], 0.4); ctx.fill(); }); }
      shape(ctx, function () { ell(ctx, 4, -29, 6, 3.5); }, '#f3a7b2', 1);
      var hx = 40;
      [-1, 1].forEach(function (s) {
        ctx.strokeStyle = OL; ctx.lineWidth = 4.4; ctx.beginPath(); ctx.moveTo(hx + s * 7, -84); ctx.quadraticCurveTo(hx + s * 13, -88, hx + s * 12, -96); ctx.stroke();
        ctx.strokeStyle = '#efe3c5'; ctx.lineWidth = 2.8; ctx.stroke();
        shape(ctx, function () { ell(ctx, hx + s * 17, -78, 8, 3.8, s * -0.3); }, c, 1.2);
      });
      shape(ctx, function () { rrect(ctx, hx - 13, -88, 26, 40, 11); }, c, 1.5);
      if (spots) shape(ctx, function () { ell(ctx, hx - 6, -80, 5, 6); }, '#2f2a28', 0);
      shape(ctx, function () { ell(ctx, hx, -53, 13.5, 9); }, '#f3b9c0', 1.2);
      ctx.fillStyle = '#7a3b44'; [-1, 1].forEach(function (s) { ctx.beginPath(); ell(ctx, hx + s * 5, -55, 1.6, 2.2); ctx.fill(); });
      face(ctx, { ex: ex, style: 'big', cx: hx, ey: -71, dx: 6.5, er: 2.3, by: -78, bw: 3.2, my: -50.5, mw: 8, browC: '#3a2a20', lw: 1.1 });
      shape(ctx, function () { ctx.arc(hx, -44, 3.2, 0, 2 * PI); }, '#f2c14e', 1);
    },
    elephant: function (ctx, c, light, dark, ex) {
      ctx.strokeStyle = OL; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-50, -52); ctx.quadraticCurveTo(-58, -40, -56, -30); ctx.stroke();
      [-44, -30, 2, 16].forEach(function (x) {
        shape(ctx, function () { rrect(ctx, x, -32, 12, 31, 3); }, c, 1.4);
        ctx.fillStyle = '#f2ece2'; [2.5, 6, 9.5].forEach(function (d) { ctx.beginPath(); ctx.arc(x + d, -2.5, 1.3, PI, 2 * PI); ctx.fill(); });
      });
      shape(ctx, function () { ell(ctx, -16, -48, 38, 27); }, c, 1.6);
      var hx = 30, hy = -62;
      [-1, 1].forEach(function (s) { shape(ctx, function () { ell(ctx, hx + s * 22, hy + 2, 14, 19, s * 0.15); }, shade(c, -0.12), 1.4); shape(ctx, function () { ell(ctx, hx + s * 23, hy + 3, 8.5, 12.5, s * 0.15); }, '#e9b7b7', 0); });
      shape(ctx, function () { ell(ctx, hx, hy, 19, 20); }, c, 1.5);
      [-1, 1].forEach(function (s) { shape(ctx, function () { ctx.moveTo(hx + s * 6, hy + 14); ctx.quadraticCurveTo(hx + s * 10, hy + 22, hx + s * 15, hy + 22); ctx.quadraticCurveTo(hx + s * 10, hy + 18, hx + s * 9, hy + 12); ctx.closePath(); }, '#fbf7ee', 1); });
      ctx.strokeStyle = OL; ctx.lineWidth = 9.6; ctx.beginPath(); ctx.moveTo(hx, hy + 6); ctx.bezierCurveTo(hx + 1, hy + 30, hx + 4, hy + 46, hx + 13, hy + 44); ctx.stroke();
      ctx.strokeStyle = c; ctx.lineWidth = 8; ctx.stroke();
      ctx.strokeStyle = dark; ctx.lineWidth = 0.8; ctx.beginPath(); [16, 22, 28, 34].forEach(function (d) { ctx.moveTo(hx - 3.5 + d * 0.06, hy + d); ctx.lineTo(hx + 3.5 + d * 0.08, hy + d); }); ctx.stroke();
      face(ctx, { ex: ex, style: 'big', cx: hx, ey: hy - 4, dx: 7.5, er: 2.4, by: hy - 11, bw: 3.4, my: hy + 10, mw: 7, browC: dark, lw: 1.1, mouth: false, cheeks: true, cheekY: hy + 4 });
      if (ex === 'happy' || ex === 'surprised' || ex === 'sad') mouth(ctx, ex, hx + 12, hy + 12, 5, 1);
    },
    parrot: function (ctx, c, light, dark, ex) {
      var belly = c === '#1e88e5' ? '#fdd835' : c === '#e53935' ? '#ffb74d' : '#9ccc65';
      [[-4, -1], [3, 1]].forEach(function (t) { shape(ctx, function () { ctx.moveTo(t[0] - 3, -26); ctx.lineTo(t[0] * 1.6 - 2.5, -1); ctx.lineTo(t[0] * 1.6 + 2.5, -1); ctx.lineTo(t[0] + 3, -26); ctx.closePath(); }, t[1] < 0 ? '#1e63b8' : dark, 1.2); });
      ctx.strokeStyle = '#6d6d6d'; ctx.lineWidth = 1.8; ctx.beginPath(); [-5, 5].forEach(function (x) { ctx.moveTo(x, -18); ctx.lineTo(x, -14); ctx.moveTo(x - 3, -13); ctx.lineTo(x + 3, -13); }); ctx.stroke();
      shape(ctx, function () { ell(ctx, 0, -42, 16, 26); }, c, 1.5);
      shape(ctx, function () { ell(ctx, 0, -38, 9.5, 17); }, belly, 0);
      [-1, 1].forEach(function (s) { shape(ctx, function () { ell(ctx, s * 13, -42, 6.5, 17, s * -0.2); }, dark, 1.2); shape(ctx, function () { ell(ctx, s * 14.5, -31, 4, 6, s * -0.2); }, '#1e63b8', 0); });
      shape(ctx, function () { ell(ctx, 0, -74, 15, 14.5); }, c, 1.5);
      [-1, 1].forEach(function (s) { shape(ctx, function () { ell(ctx, s * 6.2, -77, 4.6, 4.6); }, '#ffffff', 0.9); });
      face(ctx, { ex: ex, style: 'dots', cx: 0, ey: -77, dx: 6.2, er: 1.8, by: -83, bw: 3, my: -66, mw: 6, browC: dark, lw: 1.1, mouth: false });
      var open = ex === 'surprised' || ex === 'happy' || ex === 'angry';
      if (open) shape(ctx, function () { ctx.moveTo(-3.5, -67); ctx.quadraticCurveTo(0, -60, 3.5, -67); ctx.closePath(); }, '#ffcc80', 1);
      shape(ctx, function () { ctx.moveTo(-4.5, -71); ctx.quadraticCurveTo(0, -75, 4.5, -71); ctx.quadraticCurveTo(4, -64, 0, open ? -64 : -61); ctx.quadraticCurveTo(-3.5, -66, -4.5, -71); ctx.closePath(); }, '#ff7043', 1.1);
    },
    monkey: function (ctx, c, light, dark, ex) {
      var fc = '#f1c9a5';
      ctx.strokeStyle = OL; ctx.lineWidth = 5.6; ctx.beginPath(); ctx.moveTo(14, -10); ctx.bezierCurveTo(42, -8, 44, -40, 32, -44); ctx.quadraticCurveTo(26, -44, 28, -38); ctx.stroke();
      ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.stroke();
      shape(ctx, function () { ell(ctx, 0, -29, 18, 25); }, c);
      shape(ctx, function () { ell(ctx, 0, -27, 10, 15); }, fc, 0);
      [-1, 1].forEach(function (s) { shape(ctx, function () { ell(ctx, s * 13, -6, 9, 5.5, s * 0.3); }, c, 1.3); shape(ctx, function () { ell(ctx, s * 18, -2.5, 4, 2.4); }, fc, 1); });
      [-1, 1].forEach(function (s) { limb(ctx, [[s * 14, -44], [s * 20, -30], [s * 14, -18]], c, 6); shape(ctx, function () { ctx.arc(s * 13, -17, 3.4, 0, 2 * PI); }, fc, 1); });
      [-1, 1].forEach(function (s) { shape(ctx, function () { ctx.arc(s * 20, -68, 7.5, 0, 2 * PI); }, c, 1.3); shape(ctx, function () { ctx.arc(s * 20, -68, 4.5, 0, 2 * PI); }, fc, 0); });
      shape(ctx, function () { ell(ctx, 0, -69, 19, 18.5); }, c, 1.5);
      shape(ctx, function () { ctx.arc(-6.5, -72, 7.2, 0, 2 * PI); ctx.moveTo(13.7, -72); ctx.arc(6.5, -72, 7.2, 0, 2 * PI); ctx.moveTo(14, -62); ell(ctx, 0, -62, 14, 9.5); }, fc, 0);
      ctx.fillStyle = shade(fc, -0.35); [-1.6, 1.6].forEach(function (x) { ctx.beginPath(); ctx.arc(x, -65, 0.9, 0, 2 * PI); ctx.fill(); });
      face(ctx, { ex: ex, style: 'big', cx: 0, ey: -72.5, dx: 6.5, er: 2.3, by: -79.5, bw: 3.2, my: -60, mw: 9.5, browC: dark, lw: 1.1, cheeks: true, cheekY: -62 });
    }
  };

  /* ---------------------------------------------------------------- backgrounds (w x h panel, drawn at origin) */
  function grad(ctx, h, a, b) { var g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
  function fillR(ctx, c, x, y, w, h) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
  function tree(ctx, x, y, k, leaf) {
    shape(ctx, function () { rrect(ctx, x - 2.2 * k, y - 22 * k, 4.4 * k, 22 * k, k); }, '#7a4f2a', 0.35 * k);
    ctx.fillStyle = leaf || '#4f9a3a'; ctx.strokeStyle = OL; ctx.lineWidth = 0.35 * k;
    [[0, -30, 11], [-8, -24, 8], [8, -24, 8], [0, -38, 8]].forEach(function (c) { ctx.beginPath(); ctx.arc(x + c[0] * k, y + c[1] * k, c[2] * k, 0, 2 * PI); ctx.stroke(); });
    [[0, -30, 11], [-8, -24, 8], [8, -24, 8], [0, -38, 8]].forEach(function (c) { ctx.beginPath(); ctx.arc(x + c[0] * k, y + c[1] * k, c[2] * k, 0, 2 * PI); ctx.fill(); });
  }
  function cloud(ctx, x, y, k) {
    ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath();
    [[0, 0, 5], [5, -2, 6], [11, 0, 5], [5, 2, 5]].forEach(function (c) { ctx.moveTo(x + (c[0] + c[2]) * k, y + c[1] * k); ctx.arc(x + c[0] * k, y + c[1] * k, c[2] * k, 0, 2 * PI); });
    ctx.fill();
  }
  function sun(ctx, x, y, r) { ctx.fillStyle = 'rgba(255,214,64,0.35)'; ctx.beginPath(); ctx.arc(x, y, r * 1.5, 0, 2 * PI); ctx.fill(); ctx.fillStyle = '#ffd640'; ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * PI); ctx.fill(); }

  var BGS = {
    classroom: function (ctx, w, h, k) {
      fillR(ctx, '#f4ead5', 0, 0, w, h * 0.72); fillR(ctx, '#d9c6a1', 0, h * 0.69, w, h * 0.03);
      fillR(ctx, '#c79a6b', 0, h * 0.72, w, h * 0.28);
      ctx.strokeStyle = 'rgba(90,55,25,0.25)'; ctx.lineWidth = 0.5 * k; ctx.beginPath();
      for (var y = h * 0.78; y < h; y += 7 * k) { ctx.moveTo(0, y); ctx.lineTo(w, y); } ctx.stroke();
      var bw = Math.min(w * 0.62, h * 1.05), bh = h * 0.34, bx = (w - bw) / 2, by = h * 0.12;
      shape(ctx, function () { rrect(ctx, bx - 1.6 * k, by - 1.6 * k, bw + 3.2 * k, bh + 3.2 * k, k); }, '#8d5a36', 0.4 * k);
      fillR(ctx, '#2f5d46', bx, by, bw, bh);
      fillR(ctx, '#8d5a36', bx + bw * 0.1, by + bh + 1.6 * k, bw * 0.8, 1.6 * k);
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = 'bold ' + (bh * 0.26) + 'px sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillText('2+3=5', bx + bw * 0.08, by + bh * 0.33);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 0.6 * k; ctx.beginPath();
      ctx.moveTo(bx + bw * 0.62, by + bh * 0.8); ctx.lineTo(bx + bw * 0.76, by + bh * 0.22); ctx.lineTo(bx + bw * 0.9, by + bh * 0.8); ctx.closePath();
      ctx.moveTo(bx + bw * 0.08, by + bh * 0.72); ctx.lineTo(bx + bw * 0.45, by + bh * 0.72); ctx.stroke();
      shape(ctx, function () { ctx.arc(w * 0.92, h * 0.15, 5 * k, 0, 2 * PI); }, '#ffffff', 0.5 * k);
      ctx.strokeStyle = OL; ctx.lineWidth = 0.5 * k; ctx.beginPath(); ctx.moveTo(w * 0.92, h * 0.15); ctx.lineTo(w * 0.92, h * 0.15 - 3.4 * k); ctx.moveTo(w * 0.92, h * 0.15); ctx.lineTo(w * 0.92 + 2.4 * k, h * 0.15); ctx.stroke();
      [0.02, 0.74].forEach(function (fx) {
        var dx = w * fx, dy = h * 0.8, dw = w * 0.24;
        shape(ctx, function () { rrect(ctx, dx, dy, dw, 3 * k, 0.6 * k); }, '#a0703f', 0.35 * k);
        fillR(ctx, '#6e4a28', dx + 2 * k, dy + 3 * k, 1.6 * k, h * 0.2); fillR(ctx, '#6e4a28', dx + dw - 3.6 * k, dy + 3 * k, 1.6 * k, h * 0.2);
      });
    },
    home: function (ctx, w, h, k) {
      fillR(ctx, '#fde7c8', 0, 0, w, h * 0.7); fillR(ctx, '#e6d3b3', 0, h * 0.7, w, h * 0.3);
      ctx.strokeStyle = 'rgba(120,90,60,0.25)'; ctx.lineWidth = 0.4 * k; ctx.beginPath();
      for (var x = 0; x < w; x += 12 * k) { ctx.moveTo(x, h * 0.7); ctx.lineTo(x - 6 * k, h); } ctx.moveTo(0, h * 0.84); ctx.lineTo(w, h * 0.84); ctx.stroke();
      var wx = w * 0.07, wy = h * 0.1, ww = Math.min(w * 0.28, h * 0.4), wh = h * 0.34;
      shape(ctx, function () { ctx.rect(wx, wy, ww, wh); }, '#bfe6ff', 0.5 * k);
      cloud(ctx, wx + ww * 0.3, wy + wh * 0.35, k * 0.8);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.4 * k; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();
      shape(ctx, function () { ctx.rect(wx, wy, ww, wh); }, null, 0.6 * k);
      [[wx - 3 * k, 1], [wx + ww + 3 * k, -1]].forEach(function (c) { shape(ctx, function () { ctx.moveTo(c[0], wy - 2 * k); ctx.lineTo(c[0] + c[1] * ww * 0.28, wy - 2 * k); ctx.quadraticCurveTo(c[0] + c[1] * ww * 0.05, wy + wh * 0.5, c[0] + c[1] * ww * 0.12, wy + wh + 4 * k); ctx.lineTo(c[0], wy + wh + 4 * k); ctx.closePath(); }, '#d64545', 0.35 * k); });
      fillR(ctx, '#8d5a36', wx - 5 * k, wy - 3 * k, ww + 10 * k, 1.4 * k);
      var px = w * 0.56, py = h * 0.12, pw = Math.min(w * 0.18, h * 0.24), ph = pw * 0.75;
      shape(ctx, function () { ctx.rect(px, py, pw, ph); }, '#cde9c4', 0.9 * k);
      shape(ctx, function () { ctx.moveTo(px, py + ph); ctx.lineTo(px + pw * 0.35, py + ph * 0.35); ctx.lineTo(px + pw * 0.6, py + ph * 0.7); ctx.lineTo(px + pw * 0.78, py + ph * 0.5); ctx.lineTo(px + pw, py + ph); ctx.closePath(); }, '#6fae5a', 0);
      sun(ctx, px + pw * 0.8, py + ph * 0.25, 2 * k);
      var sx = w * 0.62, sy = h * 0.52, sw = w * 0.36, shh = h * 0.24;
      shape(ctx, function () { rrect(ctx, sx, sy, sw, shh, 3 * k); }, '#c0504d', 0.4 * k);
      shape(ctx, function () { rrect(ctx, sx + 2 * k, sy + shh * 0.45, sw - 4 * k, shh * 0.32, 2 * k); }, '#d8706a', 0.3 * k);
      shape(ctx, function () { rrect(ctx, sx + sw * 0.12, sy + shh * 0.12, sw * 0.24, shh * 0.32, 2 * k); }, '#f2c14e', 0.3 * k);
      fillR(ctx, '#6e4a28', sx + 2 * k, sy + shh, 2 * k, 3 * k); fillR(ctx, '#6e4a28', sx + sw - 4 * k, sy + shh, 2 * k, 3 * k);
      shape(ctx, function () { ctx.moveTo(w * 0.04, h * 0.88); ctx.lineTo(w * 0.04 + 9 * k, h * 0.88); ctx.lineTo(w * 0.04 + 7.5 * k, h * 0.98); ctx.lineTo(w * 0.04 + 1.5 * k, h * 0.98); ctx.closePath(); }, '#b5653a', 0.35 * k);
      ctx.fillStyle = '#3f8f3a'; [[-3, -6, 4], [3, -8, 4], [0, -11, 4]].forEach(function (c) { ctx.beginPath(); ell(ctx, w * 0.04 + 4.5 * k + c[0] * k, h * 0.88 + c[1] * k, c[2] * 0.7 * k, c[2] * 1.4 * k, c[0] * 0.1); ctx.fill(); });
    },
    village: function (ctx, w, h, k) {
      ctx.fillStyle = grad(ctx, h * 0.62, '#9fd8ff', '#e9f7ff'); ctx.fillRect(0, 0, w, h * 0.62);
      sun(ctx, w * 0.84, h * 0.15, 6 * k); cloud(ctx, w * 0.3, h * 0.14, k);
      ctx.fillStyle = '#8bc86a'; ctx.beginPath(); ell(ctx, w * 0.25, h * 0.62, w * 0.45, h * 0.16); ctx.fill();
      ctx.fillStyle = '#6fb25a'; ctx.beginPath(); ell(ctx, w * 0.8, h * 0.62, w * 0.4, h * 0.13); ctx.fill();
      fillR(ctx, '#b9d77a', 0, h * 0.6, w, h * 0.4);
      ctx.strokeStyle = 'rgba(90,130,40,0.45)'; ctx.lineWidth = 0.6 * k; ctx.beginPath();
      for (var i = 0; i < 6; i++) { ctx.moveTo(w * 0.55, h * (0.66 + i * 0.06)); ctx.lineTo(w, h * (0.64 + i * 0.07)); } ctx.stroke();
      ctx.fillStyle = '#d8b27a'; ctx.beginPath(); ctx.moveTo(w * 0.36, h * 0.6); ctx.quadraticCurveTo(w * 0.3, h * 0.8, w * 0.2, h); ctx.lineTo(w * 0.46, h); ctx.quadraticCurveTo(w * 0.42, h * 0.8, w * 0.4, h * 0.6); ctx.closePath(); ctx.fill();
      var hx = w * 0.05, hy = h * 0.4, hw = Math.min(w * 0.3, h * 0.42), hh = h * 0.24;
      shape(ctx, function () { ctx.rect(hx, hy, hw, hh); }, '#d9a066', 0.4 * k);
      shape(ctx, function () { rrect(ctx, hx + hw * 0.4, hy + hh * 0.35, hw * 0.22, hh * 0.65, k); }, '#6e4a28', 0.35 * k);
      shape(ctx, function () { ctx.moveTo(hx - hw * 0.12, hy + 1); ctx.lineTo(hx + hw / 2, hy - hh * 0.75); ctx.lineTo(hx + hw * 1.12, hy + 1); ctx.closePath(); }, '#b8862f', 0.4 * k);
      ctx.strokeStyle = 'rgba(110,70,20,0.55)'; ctx.lineWidth = 0.4 * k; ctx.beginPath();
      for (var j = 1; j < 7; j++) { ctx.moveTo(hx + hw / 2, hy - hh * 0.75); ctx.lineTo(hx - hw * 0.12 + j * hw * 1.24 / 7, hy); } ctx.stroke();
      tree(ctx, w * 0.8, h * 0.66, k * 1.1);
    },
    market: function (ctx, w, h, k) {
      ctx.fillStyle = grad(ctx, h * 0.5, '#bfe7ff', '#eef9ff'); ctx.fillRect(0, 0, w, h * 0.5);
      var cols = ['#f6c6a0', '#c9d8f0', '#f2e2a8', '#d7c3e6', '#bfe0c9'];
      for (var i = 0, x = 0; x < w; i++) { var bw = (14 + (i * 7) % 10) * k, bh = h * (0.22 + ((i * 13) % 9) / 40); fillR(ctx, cols[i % 5], x, h * 0.5 - bh, bw, bh); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x + bw * 0.3, h * 0.5 - bh + 3 * k, bw * 0.4, 3 * k); x += bw; }
      fillR(ctx, '#d8d2c4', 0, h * 0.5, w, h * 0.5);
      [[0.03, '#e53935'], [0.53, '#2e9d4f']].forEach(function (s) {
        var sx = w * s[0], sw = w * 0.44, ay = h * 0.24, ah = h * 0.1, cy = h * 0.56, ch = h * 0.16;
        fillR(ctx, '#6e4a28', sx + 1.5 * k, ay, 1.6 * k, cy - ay); fillR(ctx, '#6e4a28', sx + sw - 3 * k, ay, 1.6 * k, cy - ay);
        var n = 6, sww = sw / n;
        for (var j = 0; j < n; j++) shape(ctx, function () { ctx.moveTo(sx + j * sww, ay); ctx.lineTo(sx + (j + 1) * sww, ay); ctx.lineTo(sx + (j + 1) * sww + 1.2 * k, ay + ah); ctx.quadraticCurveTo(sx + (j + 0.5) * sww, ay + ah + 3 * k, sx + j * sww - 1.2 * k, ay + ah); ctx.closePath(); }, j % 2 ? '#ffffff' : s[1], 0.3 * k);
        shape(ctx, function () { ctx.rect(sx, cy, sw, ch); }, '#a0703f', 0.4 * k);
        var fr = ['#ff9800', '#e53935', '#7cb342', '#fdd835'];
        for (var r = 0; r < 2; r++) for (var q = 0; q < 7; q++) { ctx.fillStyle = fr[(q + r + (s[0] > 0.5 ? 2 : 0)) % 4]; ctx.beginPath(); ctx.arc(sx + sw * (0.1 + q * 0.13), cy - 2.2 * k - r * 3.6 * k, 2.2 * k, 0, 2 * PI); ctx.fill(); }
      });
    },
    park: function (ctx, w, h, k) {
      ctx.fillStyle = grad(ctx, h * 0.6, '#9fdcff', '#e6f7ff'); ctx.fillRect(0, 0, w, h * 0.6);
      cloud(ctx, w * 0.15, h * 0.13, k); cloud(ctx, w * 0.62, h * 0.09, k * 0.8);
      fillR(ctx, '#8fd16a', 0, h * 0.58, w, h * 0.42);
      ctx.fillStyle = '#e7d6aa'; ctx.beginPath(); ctx.moveTo(w * 0.45, h * 0.58); ctx.quadraticCurveTo(w * 0.6, h * 0.8, w * 0.5, h); ctx.lineTo(w * 0.78, h); ctx.quadraticCurveTo(w * 0.78, h * 0.78, w * 0.52, h * 0.58); ctx.closePath(); ctx.fill();
      tree(ctx, w * 0.12, h * 0.64, k * 1.1); tree(ctx, w * 0.9, h * 0.6, k * 0.9, '#3f8a34');
      var bx = w * 0.58, by = h * 0.6, bw = Math.min(w * 0.26, 30 * k);
      fillR(ctx, '#5b3b22', bx + k, by + 6 * k, 1.4 * k, 6 * k); fillR(ctx, '#5b3b22', bx + bw - 2.4 * k, by + 6 * k, 1.4 * k, 6 * k);
      [0, 2.6].forEach(function (d) { shape(ctx, function () { rrect(ctx, bx, by + d * k, bw, 2 * k, 0.6 * k); }, '#a0703f', 0.3 * k); });
      shape(ctx, function () { rrect(ctx, bx, by + 5.2 * k, bw, 1.8 * k, 0.6 * k); }, '#a0703f', 0.3 * k);
      var rnd = rng(7), fl = ['#ff5a7a', '#ffd640', '#ffffff', '#b06cff'];
      for (var i = 0; i < 28; i++) { ctx.fillStyle = fl[i % 4]; ctx.beginPath(); ctx.arc(rnd() * w, h * (0.66 + rnd() * 0.32), 0.9 * k, 0, 2 * PI); ctx.fill(); }
    },
    beach: function (ctx, w, h, k) {
      ctx.fillStyle = grad(ctx, h * 0.46, '#7fcbff', '#ffe9be'); ctx.fillRect(0, 0, w, h * 0.46);
      sun(ctx, w * 0.7, h * 0.3, 7 * k); cloud(ctx, w * 0.2, h * 0.12, k);
      fillR(ctx, '#2b9fd8', 0, h * 0.44, w, h * 0.18);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 0.6 * k; ctx.beginPath();
      for (var y = h * 0.48; y < h * 0.6; y += 4 * k) for (var x = (y * 3) % (14 * k); x < w; x += 14 * k) { ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 2.5 * k, y - 1.4 * k, x + 5 * k, y); } ctx.stroke();
      ctx.fillStyle = '#f3d9a4'; ctx.beginPath(); ctx.moveTo(0, h * 0.6); ctx.quadraticCurveTo(w * 0.5, h * 0.56, w, h * 0.62); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.2 * k; ctx.beginPath(); ctx.moveTo(0, h * 0.6); ctx.quadraticCurveTo(w * 0.5, h * 0.56, w, h * 0.62); ctx.stroke();
      var tx = w * 0.88, ty = h * 0.86;
      ctx.strokeStyle = OL; ctx.lineWidth = 4.6 * k; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx + 2 * k, ty - h * 0.3, tx - 6 * k, ty - h * 0.58); ctx.stroke();
      ctx.strokeStyle = '#a7743d'; ctx.lineWidth = 3.8 * k; ctx.stroke();
      var top = [tx - 6 * k, ty - h * 0.58];
      [-2.6, -1.9, -1.0, -0.2, 0.5].forEach(function (a) {
        shape(ctx, function () { ctx.moveTo(top[0], top[1]); ctx.quadraticCurveTo(top[0] + Math.cos(a - 0.3) * 14 * k, top[1] + Math.sin(a - 0.3) * 14 * k, top[0] + Math.cos(a) * 20 * k, top[1] + Math.sin(a) * 20 * k + 6 * k); ctx.quadraticCurveTo(top[0] + Math.cos(a) * 9 * k, top[1] + Math.sin(a) * 9 * k + 3 * k, top[0], top[1]); }, '#3f9a3a', 0.35 * k);
      });
      var ux = w * 0.16, uy = h * 0.66, ur = Math.min(w * 0.13, 15 * k);
      fillR(ctx, '#6e4a28', ux - 0.6 * k, uy, 1.2 * k, h * 0.22);
      for (var i = 0; i < 4; i++) shape(ctx, function () { ctx.moveTo(ux, uy); ctx.arc(ux, uy, ur, PI + i * PI / 4, PI + (i + 1) * PI / 4); ctx.closePath(); }, i % 2 ? '#ffffff' : '#e53935', 0.35 * k);
    },
    station: function (ctx, w, h, k) {
      fillR(ctx, '#dfe9f2', 0, 0, w, h * 0.6);
      fillR(ctx, '#7a2f24', 0, 0, w, h * 0.06);
      var cy = h * 0.16, ch = h * 0.38;
      shape(ctx, function () { rrect(ctx, -4 * k, cy, w + 8 * k, ch, 3 * k); }, '#2f5f9e', 0.5 * k);
      fillR(ctx, '#f2c200', 0, cy + ch * 0.12, w, ch * 0.05);
      for (var x = 4 * k; x < w - 8 * k; x += 15 * k) {
        if (Math.round(x / (15 * k)) % 4 === 2) { shape(ctx, function () { ctx.rect(x, cy + ch * 0.25, 9 * k, ch * 0.68); }, '#244a7c', 0.35 * k); continue; }
        shape(ctx, function () { ctx.rect(x, cy + ch * 0.27, 10 * k, ch * 0.32); }, '#cfe3f5', 0.35 * k);
        ctx.strokeStyle = '#5c6a7a'; ctx.lineWidth = 0.35 * k; ctx.beginPath(); for (var b = 1; b < 4; b++) { ctx.moveTo(x + b * 2.5 * k, cy + ch * 0.27); ctx.lineTo(x + b * 2.5 * k, cy + ch * 0.59); } ctx.stroke();
      }
      fillR(ctx, '#3a3a3a', 0, h * 0.54, w, h * 0.06);
      fillR(ctx, '#cfc6b5', 0, h * 0.6, w, h * 0.4);
      fillR(ctx, '#f2c200', 0, h * 0.6, w, h * 0.025);
      ctx.strokeStyle = 'rgba(80,70,60,0.2)'; ctx.lineWidth = 0.4 * k; ctx.beginPath(); for (var t = 0; t < w; t += 10 * k) { ctx.moveTo(t, h * 0.63); ctx.lineTo(t - 8 * k, h); } ctx.stroke();
      [0.12, 0.88].forEach(function (fx) { shape(ctx, function () { ctx.rect(w * fx - 2.2 * k, h * 0.06, 4.4 * k, h * 0.6); }, '#9e3b2b', 0.35 * k); });
      var sw = Math.min(w * 0.3, 34 * k), sx = (w - sw) / 2;
      ctx.strokeStyle = OL; ctx.lineWidth = 0.4 * k; ctx.beginPath(); ctx.moveTo(sx + sw * 0.2, h * 0.06); ctx.lineTo(sx + sw * 0.2, h * 0.085); ctx.moveTo(sx + sw * 0.8, h * 0.06); ctx.lineTo(sx + sw * 0.8, h * 0.085); ctx.stroke();
      shape(ctx, function () { ctx.rect(sx, h * 0.085, sw, h * 0.07); }, '#ffd54f', 0.45 * k);
      ctx.fillStyle = OL; ctx.font = 'bold ' + (h * 0.05) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('1', sx + sw / 2, h * 0.122);
    },
    forest: function (ctx, w, h, k) {
      ctx.fillStyle = grad(ctx, h * 0.6, '#cdeccd', '#eef8e6'); ctx.fillRect(0, 0, w, h * 0.6);
      ctx.fillStyle = '#9ccc8f'; for (var i = 0; i < w; i += 9 * k) { ctx.beginPath(); ctx.moveTo(i, h * 0.6); ctx.lineTo(i + 5 * k, h * (0.34 + ((i / k) % 7) / 50)); ctx.lineTo(i + 10 * k, h * 0.6); ctx.fill(); }
      fillR(ctx, '#6fae55', 0, h * 0.58, w, h * 0.42);
      shape(ctx, function () { ell(ctx, w * 0.72, h * 0.86, w * 0.2, h * 0.07); }, '#5ab4e0', 0.35 * k);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.5 * k; ctx.beginPath(); ctx.moveTo(w * 0.62, h * 0.86); ctx.lineTo(w * 0.7, h * 0.86); ctx.moveTo(w * 0.74, h * 0.88); ctx.lineTo(w * 0.8, h * 0.88); ctx.stroke();
      tree(ctx, w * 0.08, h * 0.7, k * 1.5, '#3f8a34'); tree(ctx, w * 0.32, h * 0.62, k * 1.1, '#4f9a3a'); tree(ctx, w * 0.92, h * 0.68, k * 1.4, '#367a2e');
      ctx.fillStyle = '#4c9340'; [[0.5, 0.64], [0.2, 0.9], [0.95, 0.94]].forEach(function (b) { ctx.beginPath(); ctx.arc(w * b[0], h * b[1], 4 * k, PI, 0); ctx.arc(w * b[0] + 5 * k, h * b[1], 3.5 * k, PI, 0); ctx.fill(); });
      [[0.45, 0.93], [0.52, 0.95]].forEach(function (m) { fillR(ctx, '#f5ead6', w * m[0] - 0.6 * k, h * m[1] - 2.5 * k, 1.2 * k, 2.5 * k); shape(ctx, function () { ctx.arc(w * m[0], h * m[1] - 2.5 * k, 2 * k, PI, 0); ctx.closePath(); }, '#e53935', 0.3 * k); });
    },
    night: function (ctx, w, h, k) {
      ctx.fillStyle = grad(ctx, h, '#0d1b3e', '#2c4580'); ctx.fillRect(0, 0, w, h);
      var rnd = rng(42);
      ctx.fillStyle = '#ffffff'; for (var i = 0; i < 60; i++) { ctx.globalAlpha = 0.5 + rnd() * 0.5; ctx.beginPath(); ctx.arc(rnd() * w, rnd() * h * 0.6, (0.3 + rnd() * 0.6) * k, 0, 2 * PI); ctx.fill(); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255,244,196,0.18)'; ctx.beginPath(); ctx.arc(w * 0.78, h * 0.2, 11 * k, 0, 2 * PI); ctx.fill();
      ctx.fillStyle = '#fff4c4'; ctx.beginPath(); ctx.arc(w * 0.78, h * 0.2, 7 * k, 0, 2 * PI); ctx.fill();
      ctx.fillStyle = 'rgba(200,190,150,0.5)'; [[-2, -1, 1.4], [2, 2, 1], [1, -3, 0.8]].forEach(function (c) { ctx.beginPath(); ctx.arc(w * 0.78 + c[0] * k, h * 0.2 + c[1] * k, c[2] * k, 0, 2 * PI); ctx.fill(); });
      var x = 0, j = 0;
      while (x < w) {
        var bw = (12 + (j * 5) % 9) * k, bh = h * (0.16 + ((j * 7) % 10) / 45);
        fillR(ctx, '#0a1430', x, h * 0.72 - bh, bw, bh + h * 0.28);
        ctx.fillStyle = '#ffd76a';
        for (var wy = h * 0.72 - bh + 3 * k; wy < h * 0.7; wy += 5 * k) for (var wx = x + 2 * k; wx < x + bw - 3 * k; wx += 4.5 * k) if (((wx / k + wy / k + j) | 0) % 3 === 0) ctx.fillRect(wx, wy, 2 * k, 2.4 * k);
        x += bw + k; j++;
      }
      fillR(ctx, '#121d3d', 0, h * 0.72, w, h * 0.28);
    },
    burst: function (ctx, w, h) {
      fillR(ctx, '#ffe066', 0, 0, w, h);
      var cx = w / 2, cy = h / 2, R = Math.hypot(w, h), n = 24;
      ctx.fillStyle = '#ffc233';
      for (var i = 0; i < n; i += 2) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, i * 2 * PI / n, (i + 1) * 2 * PI / n); ctx.closePath(); ctx.fill(); }
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.45); g.addColorStop(0, 'rgba(255,255,255,0.85)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    },
    white: '#ffffff', yellow: '#fff6c9', blue: '#d7efff', pink: '#ffe0ec', green: '#dcf5d6'
  };
  var BG_IDS = ['white', 'classroom', 'home', 'village', 'market', 'park', 'beach', 'station', 'forest', 'night', 'burst', 'yellow', 'blue', 'pink', 'green'];
  function bg(ctx, id, w, h) {
    var f = BGS[id] || BGS.white;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (typeof f === 'string') { ctx.fillStyle = f; ctx.fillRect(0, 0, w, h); }
    else { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); f(ctx, w, h, Math.min(w, h) / 100); }
    ctx.restore();
  }

  window.COMIC_ART = {
    person: person, animal: animal, bg: bg, face: face, shade: shade, rrect: rrect,
    BG_IDS: BG_IDS, SKIN: SKIN, HAIRC: HAIRC, OUTC: OUTC, ANIMAL_COLS: ANIMAL_COLS, WF: WF
  };
})();
