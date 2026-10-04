/* Digital Whiteboard: drawing engine (page model, backgrounds, strokes, hit-testing).
   Everything is drawn in LOGICAL board units (a wide page is 1600 x 1000), so the board
   looks the same on a phone, a laptop or a smartboard and survives any resize.
   Exposes window.WBDraw. No UI and no text in here. */
(function () {
  'use strict';

  var SHAPES = { wide: { w: 1600, h: 1000 }, tall: { w: 1000, h: 1400 } };
  var BGS = ['plain', 'grid', 'dots', 'ruled', 'four', 'graph', 'axes'];
  var BOARDS = {
    white: { fill: '#ffffff', dark: false },
    green: { fill: '#1e3b2e', dark: true },
    black: { fill: '#15181c', dark: true }
  };
  /* Palette colours are stored as "p0".."p7" so they adapt when the board turns dark:
     black ink becomes white chalk, dark blue becomes light blue, and so on. */
  var PAL = {
    light: ['#1b1b1b', '#1d4ed8', '#dc2626', '#15803d', '#ea580c', '#7c3aed', '#ca8a04', '#0891b2'],
    dark: ['#f8fafc', '#93c5fd', '#fca5a5', '#86efac', '#fdba74', '#c4b5fd', '#fde047', '#67e8f9'],
    /* highlighter on a light board: bright marker colours (multiplied, so the ink below stays readable) */
    hl: ['#6b7280', '#38bdf8', '#fb7185', '#4ade80', '#fb923c', '#c084fc', '#fde047', '#22d3ee']
  };
  var TYPES = ['pen', 'hl', 'line', 'arrow', 'rect', 'ellipse', 'text'];
  var FONT = '"Noto Sans", "Nirmala UI", "Noto Sans Devanagari", "Noto Nastaliq Urdu", system-ui, -apple-system, "Segoe UI", sans-serif';
  var LINE_H = 1.3;

  function dims(page) { return SHAPES[page && page.shape] || SHAPES.wide; }
  function isDark(page) { return !!(BOARDS[page && page.board] || BOARDS.white).dark; }
  function color(c, page, marker) {
    if (typeof c === 'string' && /^p[0-7]$/.test(c)) return PAL[isDark(page) ? 'dark' : (marker ? 'hl' : 'light')][+c.charAt(1)];
    return /^#[0-9a-f]{6}$/i.test(String(c)) ? c : '#888888';
  }
  function newPage(opts) {
    opts = opts || {};
    return { id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      bg: BGS.indexOf(opts.bg) >= 0 ? opts.bg : 'plain', board: BOARDS[opts.board] ? opts.board : 'white',
      shape: SHAPES[opts.shape] ? opts.shape : 'wide', s: [] };
  }

  /* ---------------- backgrounds ---------------- */
  function hLines(ctx, S, step, start, col, lw) {
    ctx.beginPath();
    for (var y = start; y < S.h; y += step) { ctx.moveTo(0, y); ctx.lineTo(S.w, y); }
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
  }
  function vLines(ctx, S, step, start, col, lw) {
    ctx.beginPath();
    for (var x = start; x < S.w; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, S.h); }
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
  }
  function grid(ctx, S, step, col, lw, ox, oy) {
    vLines(ctx, S, step, ox === undefined ? step : ox, col, lw);
    hLines(ctx, S, step, oy === undefined ? step : oy, col, lw);
  }

  function drawBg(ctx, page) {
    var S = dims(page), b = BOARDS[page.board] || BOARDS.white, dk = b.dark;
    ctx.save();
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = b.fill; ctx.fillRect(0, 0, S.w, S.h);
    var blue = dk ? 'rgba(255,255,255,0.16)' : 'rgba(37,99,160,0.22)';
    var blueStrong = dk ? 'rgba(255,255,255,0.30)' : 'rgba(37,99,160,0.40)';
    var red = dk ? 'rgba(252,165,165,0.55)' : 'rgba(220,38,38,0.50)';
    var green = dk ? 'rgba(134,239,172,0.16)' : 'rgba(21,128,61,0.18)';
    var greenStrong = dk ? 'rgba(134,239,172,0.34)' : 'rgba(21,128,61,0.42)';
    switch (page.bg) {
      case 'grid': grid(ctx, S, 50, blue, 1.4); break;
      case 'dots': {
        ctx.fillStyle = blueStrong;
        for (var dx = 40; dx < S.w; dx += 40) for (var dy = 40; dy < S.h; dy += 40) { ctx.beginPath(); ctx.arc(dx, dy, 2.6, 0, Math.PI * 2); ctx.fill(); }
        break;
      }
      case 'ruled': {
        hLines(ctx, S, 50, 110, blue, 1.6);
        ctx.beginPath(); ctx.moveTo(110, 0); ctx.lineTo(110, S.h); ctx.strokeStyle = red; ctx.lineWidth = 2; ctx.stroke();
        break;
      }
      case 'four': {
        /* Indian four-line copy: tall letters touch line 1, small letters sit between lines 2 and 3
           (line 3, red, is the base line), tails go down to line 4. */
        var gap = 30, period = gap * 3 + 50;
        for (var y0 = 70; y0 + gap * 3 < S.h - 20; y0 += period) {
          for (var k = 0; k < 4; k++) {
            ctx.beginPath(); ctx.moveTo(30, y0 + k * gap); ctx.lineTo(S.w - 30, y0 + k * gap);
            ctx.strokeStyle = k === 2 ? red : blueStrong; ctx.lineWidth = k === 2 ? 2 : 1.6; ctx.stroke();
          }
        }
        break;
      }
      case 'graph':
        grid(ctx, S, 10, green, 0.8);
        grid(ctx, S, 100, greenStrong, 2);
        break;
      case 'axes': drawAxes(ctx, S, dk, green, greenStrong); break;
    }
    ctx.restore();
  }

  function drawAxes(ctx, S, dk, minor, major) {
    var u = 50, cx = Math.round(S.w / 2 / u) * u, cy = Math.round(S.h / 2 / u) * u;
    grid(ctx, S, u / 5, minor, 0.7, (cx % (u / 5)), (cy % (u / 5)));
    grid(ctx, S, u, major, 1.3, cx % u, cy % u);
    var ink = dk ? 'rgba(255,255,255,0.85)' : 'rgba(20,30,40,0.85)';
    ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(14, cy); ctx.lineTo(S.w - 14, cy); ctx.moveTo(cx, 14); ctx.lineTo(cx, S.h - 14); ctx.stroke();
    function head(x, y, ang) {
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.lineTo(x - 18 * Math.cos(ang - 0.4), y - 18 * Math.sin(ang - 0.4));
      ctx.lineTo(x - 18 * Math.cos(ang + 0.4), y - 18 * Math.sin(ang + 0.4));
      ctx.closePath(); ctx.fill();
    }
    head(S.w - 8, cy, 0); head(8, cy, Math.PI); head(cx, 8, -Math.PI / 2); head(cx, S.h - 8, Math.PI / 2);
    ctx.font = '600 17px ' + FONT; ctx.direction = 'ltr';
    ctx.lineWidth = 2;
    for (var x = cx % u, i; x < S.w - 20; x += u) {
      i = Math.round((x - cx) / u); if (!i || x < 20) continue;
      ctx.beginPath(); ctx.moveTo(x, cy - 7); ctx.lineTo(x, cy + 7); ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(String(i), x, cy + 10);
    }
    for (var y = cy % u, j; y < S.h - 20; y += u) {
      j = Math.round((cy - y) / u); if (!j || y < 20) continue;
      ctx.beginPath(); ctx.moveTo(cx - 7, y); ctx.lineTo(cx + 7, y); ctx.stroke();
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(String(j), cx - 11, y);
    }
    ctx.font = 'italic 700 28px ' + FONT;
    ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText('x', S.w - 22, cy + 12);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('y', cx + 14, 16);
    ctx.font = '700 20px ' + FONT; ctx.textAlign = 'right'; ctx.fillText('O', cx - 8, cy + 8);
  }

  /* ---------------- strokes ---------------- */
  function smoothPath(ctx, p) {
    var n = p.length / 2, i;
    ctx.beginPath(); ctx.moveTo(p[0], p[1]);
    if (n === 1) { ctx.lineTo(p[0] + 0.01, p[1]); return; }
    if (n === 2) { ctx.lineTo(p[2], p[3]); return; }
    for (i = 1; i < n - 1; i++) {
      ctx.quadraticCurveTo(p[2 * i], p[2 * i + 1], (p[2 * i] + p[2 * i + 2]) / 2, (p[2 * i + 1] + p[2 * i + 3]) / 2);
    }
    ctx.lineTo(p[2 * n - 2], p[2 * n - 1]);
  }
  function pf(v) { return 0.35 + 1.3 * (v == null ? 0.5 : v / 100); }   /* stylus pressure 0..100 → width factor */
  function pressureStroke(ctx, s) {
    var p = s.p, pr = s.pr, n = p.length / 2, i, sx = p[0], sy = p[1];
    if (n < 3) { ctx.lineWidth = s.w * pf(pr[0]); smoothPath(ctx, p); ctx.stroke(); return; }
    for (i = 1; i < n - 1; i++) {
      var mx = (p[2 * i] + p[2 * i + 2]) / 2, my = (p[2 * i + 1] + p[2 * i + 3]) / 2;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(p[2 * i], p[2 * i + 1], mx, my);
      ctx.lineWidth = s.w * pf(pr[i]); ctx.stroke(); sx = mx; sy = my;
    }
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(p[2 * n - 2], p[2 * n - 1]);
    ctx.lineWidth = s.w * pf(pr[n - 1]); ctx.stroke();
  }
  function arrowHead(s) {
    var p = s.p, ang = Math.atan2(p[3] - p[1], p[2] - p[0]);
    var L = Math.max(18, s.w * 3.4), a = 0.45;
    return { ang: ang, L: L, pts: [p[2], p[3],
      p[2] - L * Math.cos(ang - a), p[3] - L * Math.sin(ang - a),
      p[2] - L * Math.cos(ang + a), p[3] - L * Math.sin(ang + a)] };
  }
  function textLines(s) { return String(s.tx || '').split('\n'); }
  /* Base direction of typed text from its first strong letter (Urdu → rtl), the same rule as the
     text box's dir="auto", so the words keep their order and place when the box turns into ink. */
  var RTL_CH = /[֐-ࣿיִ-﷿ﹰ-﻿]/, LTR_CH = /[A-Za-zÀ-ʸͰ-ϿЀ-ԯऀ-෿Ḁ-῿]/;
  function textDir(tx) {
    var str = String(tx || '');
    for (var i = 0; i < str.length; i++) {
      var ch = str.charAt(i);
      if (RTL_CH.test(ch)) return 'rtl';
      if (LTR_CH.test(ch)) return 'ltr';
    }
    return 'ltr';
  }
  function fontFor(size) { return '500 ' + size + 'px ' + FONT; }
  function measure(ctx, s) {
    ctx.save(); ctx.font = fontFor(s.s);
    var w = 0; textLines(s).forEach(function (l) { w = Math.max(w, ctx.measureText(l).width); });
    ctx.restore();
    return { w: Math.ceil(w), h: Math.ceil(textLines(s).length * s.s * LINE_H) };
  }

  function drawStroke(ctx, s, page) {
    var col = color(s.c, page, s.t === 'hl'), p = s.p;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = s.w;
    switch (s.t) {
      case 'hl':
        ctx.globalAlpha = isDark(page) ? 0.5 : 0.55;
        ctx.globalCompositeOperation = isDark(page) ? 'screen' : 'multiply';
        smoothPath(ctx, p); ctx.stroke(); break;
      case 'pen':
        if (s.pr && s.pr.length === p.length / 2) pressureStroke(ctx, s); else { smoothPath(ctx, p); ctx.stroke(); }
        break;
      case 'line':
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[2], p[3]); ctx.stroke(); break;
      case 'arrow': {
        var h = arrowHead(s), back = h.L * 0.6;
        var len = Math.hypot(p[2] - p[0], p[3] - p[1]);
        ctx.beginPath(); ctx.moveTo(p[0], p[1]);
        if (len > back) ctx.lineTo(p[2] - back * Math.cos(h.ang), p[3] - back * Math.sin(h.ang));
        ctx.stroke();
        ctx.beginPath(); ctx.moveTo(h.pts[0], h.pts[1]); ctx.lineTo(h.pts[2], h.pts[3]); ctx.lineTo(h.pts[4], h.pts[5]);
        ctx.closePath(); ctx.lineWidth = Math.max(2, s.w / 2); ctx.fill(); ctx.stroke();
        break;
      }
      case 'rect':
        ctx.beginPath(); ctx.rect(Math.min(p[0], p[2]), Math.min(p[1], p[3]), Math.abs(p[2] - p[0]), Math.abs(p[3] - p[1])); ctx.stroke(); break;
      case 'ellipse':
        ctx.beginPath();
        ctx.ellipse((p[0] + p[2]) / 2, (p[1] + p[3]) / 2, Math.max(0.5, Math.abs(p[2] - p[0]) / 2), Math.max(0.5, Math.abs(p[3] - p[1]) / 2), 0, 0, Math.PI * 2);
        ctx.stroke(); break;
      case 'text':
        /* the text box is always left-aligned at the tap point; only the reading order follows the text */
        ctx.font = fontFor(s.s); ctx.textBaseline = 'top'; ctx.textAlign = 'left'; ctx.direction = textDir(s.tx);
        textLines(s).forEach(function (l, i) { ctx.fillText(l, p[0], p[1] + i * s.s * LINE_H + s.s * 0.08); });
        break;
    }
    ctx.restore();
  }

  function render(ctx, page, opts) {
    opts = opts || {};
    if (!opts.noBg) drawBg(ctx, page);
    for (var i = 0; i < page.s.length; i++) drawStroke(ctx, page.s[i], page);
  }

  /* Draw a page into any canvas (thumbnails, PNG export, print). */
  function paint(canvas, page, scale) {
    var S = dims(page);
    canvas.width = Math.max(1, Math.round(S.w * scale));
    canvas.height = Math.max(1, Math.round(S.h * scale));
    var ctx = canvas.getContext('2d');
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    render(ctx, page);
    return canvas;
  }

  /* ---------------- hit-testing (stroke eraser) ---------------- */
  var boxCache = typeof WeakMap === 'function' ? new WeakMap() : null;
  function bbox(s) {
    var b = boxCache && boxCache.get(s);
    if (b) return b;
    var p = s.p, x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, i;
    if (s.t === 'text') { x0 = p[0]; y0 = p[1]; x1 = p[0] + (s.bw || 10); y1 = p[1] + (s.bh || s.s || 10); }
    else for (i = 0; i < p.length; i += 2) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]); }
    var pad = (s.w || 0) * (s.t === 'arrow' ? 3.5 : 1);
    b = { x0: x0 - pad, y0: y0 - pad, x1: x1 + pad, y1: y1 + pad };
    if (boxCache) boxCache.set(s, b);
    return b;
  }
  function distSeg(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy, t = L ? ((px - ax) * dx + (py - ay) * dy) / L : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }
  function nearPoly(pts, x, y, tol, closed) {
    var n = pts.length / 2, i;
    if (n === 1) return Math.hypot(x - pts[0], y - pts[1]) <= tol;
    for (i = 0; i < n - 1; i++) if (distSeg(x, y, pts[2 * i], pts[2 * i + 1], pts[2 * i + 2], pts[2 * i + 3]) <= tol) return true;
    return !!closed && distSeg(x, y, pts[2 * n - 2], pts[2 * n - 1], pts[0], pts[1]) <= tol;
  }
  function hit(s, x, y, r) {
    var b = bbox(s);
    if (x < b.x0 - r || x > b.x1 + r || y < b.y0 - r || y > b.y1 + r) return false;
    var p = s.p, tol = r + (s.w || 0) / 2;
    switch (s.t) {
      case 'pen': case 'hl': case 'line': return nearPoly(p, x, y, tol);
      case 'arrow': return nearPoly(p, x, y, tol) || nearPoly(arrowHead(s).pts, x, y, tol, true);
      case 'rect': return nearPoly([p[0], p[1], p[2], p[1], p[2], p[3], p[0], p[3]], x, y, tol, true);
      case 'ellipse': {
        var cx = (p[0] + p[2]) / 2, cy = (p[1] + p[3]) / 2, rx = Math.abs(p[2] - p[0]) / 2, ry = Math.abs(p[3] - p[1]) / 2, poly = [];
        for (var k = 0; k < 48; k++) { var a = k / 48 * Math.PI * 2; poly.push(cx + rx * Math.cos(a), cy + ry * Math.sin(a)); }
        return nearPoly(poly, x, y, tol, true);
      }
      case 'text': return true;   /* inside the padded box */
    }
    return false;
  }

  /* ---------------- validation (stored data / opened files) ---------------- */
  function num(v) { return typeof v === 'number' && isFinite(v); }
  function cleanStroke(s) {
    if (!s || typeof s !== 'object' || TYPES.indexOf(s.t) < 0 || !Array.isArray(s.p)) return null;
    var p = s.p.filter(num).slice(0, 40000);
    if (p.length % 2) p.pop();
    if (!p.length) return null;
    var need = { line: 4, arrow: 4, rect: 4, ellipse: 4, text: 2 }[s.t];
    if (need && p.length < need) return null;
    var o = { t: s.t, c: (typeof s.c === 'string' && (/^p[0-7]$/.test(s.c) || /^#[0-9a-f]{6}$/i.test(s.c))) ? s.c : 'p0',
      w: num(s.w) ? Math.min(Math.max(s.w, 0.5), 300) : 6, p: need ? p.slice(0, need) : p };
    if (s.t === 'pen' && Array.isArray(s.pr) && s.pr.length === p.length / 2 && s.pr.every(num)) o.pr = s.pr;
    if (s.t === 'text') {
      if (typeof s.tx !== 'string' || !s.tx.trim()) return null;
      o.tx = s.tx.slice(0, 2000); o.s = num(s.s) ? Math.min(Math.max(s.s, 8), 400) : 40;
      var lines = o.tx.split('\n'), longest = Math.max.apply(null, lines.map(function (l) { return l.length; }));
      o.bw = num(s.bw) && s.bw > 0 ? Math.min(s.bw, 20000) : o.s * longest * 0.6;
      o.bh = num(s.bh) && s.bh > 0 ? Math.min(s.bh, 20000) : o.s * LINE_H * lines.length;
    }
    return o;
  }
  function cleanPages(arr, max) {
    if (!Array.isArray(arr) || !arr.length) return null;
    var out = [];
    arr.slice(0, max || 50).forEach(function (pg) {
      if (!pg || typeof pg !== 'object') return;
      var page = newPage(pg);
      if (typeof pg.id === 'string' && pg.id.length < 40) page.id = pg.id;
      page.s = (Array.isArray(pg.s) ? pg.s : []).map(cleanStroke).filter(Boolean);
      out.push(page);
    });
    var seen = {};
    out.forEach(function (pg, i) { if (seen[pg.id]) pg.id += '_' + i; seen[pg.id] = 1; });
    return out.length ? out : null;
  }

  window.WBDraw = {
    SHAPES: SHAPES, BGS: BGS, BOARDS: BOARDS, PAL: PAL, FONT: FONT, LINE_H: LINE_H,
    dims: dims, isDark: isDark, color: color, newPage: newPage,
    drawBg: drawBg, drawStroke: drawStroke, render: render, paint: paint, smoothPath: smoothPath,
    fontFor: fontFor, measure: measure, textDir: textDir, hit: hit, cleanPages: cleanPages, cleanStroke: cleanStroke
  };
})();
