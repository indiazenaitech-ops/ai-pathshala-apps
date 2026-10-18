/* Rangoli & Kolam Maker: drawing engine (no UI text in here).
   Everything is drawn in LOGICAL units: the design is a 1000 x 1000 square with its centre at (500, 500),
   so a design looks the same on a phone, a laptop, a smartboard, in a PNG or on an A4 print.
   Designs are kept as small vector data (strokes, stamps, fill taps, kolam lines, filled template parts),
   never as big pictures. Exposes window.RArt. */
(function () {
  'use strict';
  var W = 1000, C = 500, TAU = Math.PI * 2;

  /* small seeded random generator (mulberry32): the same seed always gives the same kolam */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var x = Math.imul(a ^ (a >>> 15), 1 | a);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
  function r1(v) { return Math.round(v * 10) / 10; }
  function hexRgb(h) {
    h = String(h || '').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (!/^[0-9a-f]{6}$/i.test(h) || isNaN(n)) return [128, 128, 128];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function shade(hex, v) {
    var c = hexRgb(hex).map(function (x) { return Math.max(0, Math.min(255, Math.round(x + v))); });
    return 'rgb(' + c.join(',') + ')';
  }
  function okColor(c) { return /^#[0-9a-f]{6}$/i.test(String(c)) ? c : '#d62839'; }

  /* ---------------------------------------------------------------- floors */
  var BG = {
    tile: { base: '#efe4d0', dark: false, dot: '#5a3a26' },
    oxide: { base: '#8c2f1e', dark: true, dot: '#f6efe2' },
    dark: { base: '#17181f', dark: true, dot: '#f6efe2' },
    paper: { base: '#ffffff', dark: false, dot: '#3a3a3a' }
  };
  function bgInfo(bg) { return BG[bg] || BG.tile; }

  function drawBg(ctx, bg) {
    var b = bgInfo(bg), r = rng(97), i, x, y;
    ctx.save();
    ctx.fillStyle = b.base; ctx.fillRect(0, 0, W, W);
    if (bg === 'tile') {
      var s = 125;
      for (y = 0; y < W; y += s) for (x = 0; x < W; x += s) {
        ctx.fillStyle = shade(b.base, (r() - 0.5) * 16); ctx.fillRect(x, y, s, s);
        /* a faint marble vein in some tiles */
        if (r() < 0.45) {
          ctx.beginPath(); ctx.moveTo(x + r() * s, y);
          ctx.bezierCurveTo(x + r() * s, y + s * 0.3, x + r() * s, y + s * 0.7, x + r() * s, y + s);
          ctx.strokeStyle = 'rgba(150,120,90,0.13)'; ctx.lineWidth = 1.5; ctx.stroke();
        }
      }
      ctx.beginPath();
      for (i = s; i < W; i += s) { ctx.moveTo(i, 0); ctx.lineTo(i, W); ctx.moveTo(0, i); ctx.lineTo(W, i); }
      ctx.strokeStyle = 'rgba(120,92,64,0.42)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath();
      for (i = s; i < W; i += s) { ctx.moveTo(i + 2.5, 0); ctx.lineTo(i + 2.5, W); ctx.moveTo(0, i + 2.5); ctx.lineTo(W, i + 2.5); }
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.2; ctx.stroke();
    } else if (bg === 'oxide') {
      var g = ctx.createRadialGradient(C, C * 0.85, 40, C, C, 760);
      g.addColorStop(0, '#a03d27'); g.addColorStop(1, '#702214');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, W);
      for (i = 0; i < 700; i++) {
        ctx.fillStyle = r() < 0.5 ? 'rgba(255,215,190,0.07)' : 'rgba(40,0,0,0.12)';
        ctx.beginPath(); ctx.arc(r() * W, r() * W, 0.8 + r() * 2.2, 0, TAU); ctx.fill();
      }
      var sh = ctx.createLinearGradient(0, 0, W, W);
      sh.addColorStop(0, 'rgba(255,255,255,0.10)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.10)');
      ctx.fillStyle = sh; ctx.fillRect(0, 0, W, W);
    } else if (bg === 'dark') {
      var gd = ctx.createRadialGradient(C, C, 30, C, C, 720);
      gd.addColorStop(0, '#262935'); gd.addColorStop(1, '#101116');
      ctx.fillStyle = gd; ctx.fillRect(0, 0, W, W);
    }
    ctx.restore();
  }

  /* guide circles / grid (shown on screen only, never in a PNG or print) */
  function drawGuides(ctx, bg, kind, f, m) {
    if (kind !== 'circles' && kind !== 'grid') return;
    var dk = bgInfo(bg).dark, col = dk ? 'rgba(255,255,255,0.26)' : 'rgba(70,45,25,0.26)', i;
    ctx.save();
    ctx.strokeStyle = col; ctx.lineWidth = 1.6;
    if (kind === 'grid') {
      ctx.beginPath();
      for (i = 50; i < W; i += 50) { ctx.moveTo(i, 0); ctx.lineTo(i, W); ctx.moveTo(0, i); ctx.lineTo(W, i); }
      ctx.stroke();
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(C, 0); ctx.lineTo(C, W); ctx.moveTo(0, C); ctx.lineTo(W, C); ctx.stroke();
    } else {
      for (i = 80; i <= 480; i += 80) { ctx.beginPath(); ctx.arc(C, C, i, 0, TAU); ctx.stroke(); }
      f = Math.max(1, f | 0);
      ctx.lineWidth = 2;
      if (f > 1) {
        ctx.beginPath();
        for (i = 0; i < f; i++) { var a = TAU * i / f - Math.PI / 2; ctx.moveTo(C, C); ctx.lineTo(C + 490 * Math.cos(a), C + 490 * Math.sin(a)); }
        ctx.stroke();
      }
      if (m) {   /* lines of symmetry (mirror lines) */
        ctx.setLineDash([10, 9]);
        ctx.beginPath();
        for (i = 0; i < f; i++) {
          var b = Math.PI * i / f - Math.PI / 2;
          ctx.moveTo(C - 490 * Math.cos(b), C - 490 * Math.sin(b)); ctx.lineTo(C + 490 * Math.cos(b), C + 490 * Math.sin(b));
        }
        ctx.stroke(); ctx.setLineDash([]);
      }
    }
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(C, C, 6, 0, TAU); ctx.fill();
    ctx.restore();
  }

  /* ---------------------------------------------------------------- symmetry */
  function fold(it) { return Math.max(1, Math.min(32, it.f | 0)); }
  function copies(it) { return fold(it) * (it.m ? 2 : 1); }
  function eachCopy(it, fn) {
    var f = fold(it);
    for (var k = 0; k < f; k++) { var a = TAU * k / f; fn(a, false); if (it.m) fn(a, true); }
  }
  /* turn (and mirror) the canvas for one copy; k = pixels per logical unit */
  function copyXf(ctx, k, a, mir) {
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.translate(C, C); ctx.rotate(a); if (mir) ctx.scale(-1, 1); ctx.translate(-C, -C);
  }
  /* where a point lands in one copy */
  function copyPt(x, y, a, mir) {
    var dx = x - C, dy = y - C; if (mir) dx = -dx;
    var c = Math.cos(a), s = Math.sin(a);
    return { x: C + dx * c - dy * s, y: C + dx * s + dy * c };
  }

  /* ---------------------------------------------------------------- paths */
  function smoothPath(p) {
    var path = new Path2D(), n = p.length / 2, i;
    if (n < 1) return path;
    path.moveTo(p[0], p[1]);
    if (n === 1) { path.lineTo(p[0] + 0.01, p[1]); return path; }
    if (n === 2) { path.lineTo(p[2], p[3]); return path; }
    for (i = 1; i < n - 1; i++) path.quadraticCurveTo(p[2 * i], p[2 * i + 1], (p[2 * i] + p[2 * i + 2]) / 2, (p[2 * i + 1] + p[2 * i + 3]) / 2);
    path.lineTo(p[2 * n - 2], p[2 * n - 1]);
    return path;
  }
  /* Catmull-Rom curve through points (kolam lines bend smoothly around the dots) */
  function crPath(p, closed) {
    var path = new Path2D(), n = p.length / 2, i;
    if (n < 2) { if (n === 1) { path.moveTo(p[0], p[1]); path.lineTo(p[0] + 0.01, p[1]); } return path; }
    function P(j) { if (closed) j = (j % n + n) % n; else j = Math.max(0, Math.min(n - 1, j)); return [p[2 * j], p[2 * j + 1]]; }
    path.moveTo(p[0], p[1]);
    var last = closed ? n : n - 1;
    for (i = 0; i < last; i++) {
      var p0 = P(i - 1), q1 = P(i), q2 = P(i + 1), p3 = P(i + 2);
      path.bezierCurveTo(q1[0] + (q2[0] - p0[0]) / 6, q1[1] + (q2[1] - p0[1]) / 6, q2[0] - (p3[0] - q1[0]) / 6, q2[1] - (p3[1] - q1[1]) / 6, q2[0], q2[1]);
    }
    if (closed) path.closePath();
    return path;
  }

  /* ---------------------------------------------------------------- stamps (drawn with code) */
  /* local coordinates: (0, -s) points away from the centre of the rangoli */
  function drawStamp(ctx, kind, s, col, outline) {
    var ink = outline ? '#000' : col;
    function fillOrLine(path) {
      if (outline) { ctx.lineWidth = Math.max(1.5, s * 0.07); ctx.strokeStyle = '#000'; ctx.stroke(path); }
      else { ctx.fillStyle = ink; ctx.fill(path); }
    }
    var p = new Path2D();
    if (kind === 'dot') {
      p.arc(0, 0, s * 0.5, 0, TAU); fillOrLine(p);
    } else if (kind === 'petal') {
      p.moveTo(0, -s); p.bezierCurveTo(s * 0.62, -s * 0.45, s * 0.45, s * 0.5, 0, s * 0.62);
      p.bezierCurveTo(-s * 0.45, s * 0.5, -s * 0.62, -s * 0.45, 0, -s); p.closePath(); fillOrLine(p);
      if (!outline) {
        var v = new Path2D(); v.moveTo(0, -s * 0.62); v.quadraticCurveTo(s * 0.12, 0, 0, s * 0.42);
        ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = Math.max(1, s * 0.07); ctx.lineCap = 'round'; ctx.stroke(v);
      }
    } else if (kind === 'leaf') {
      p.moveTo(0, -s); p.bezierCurveTo(s * 0.6, -s * 0.62, s * 0.55, s * 0.3, 0, s * 0.7);
      p.bezierCurveTo(-s * 0.25, s * 0.35, -s * 0.5, -s * 0.5, 0, -s); p.closePath(); fillOrLine(p);
      var rib = new Path2D(); rib.moveTo(0, -s * 0.85); rib.bezierCurveTo(s * 0.12, -s * 0.3, s * 0.08, s * 0.4, 0, s * 0.95);
      ctx.strokeStyle = outline ? '#000' : 'rgba(0,0,0,0.3)'; ctx.lineWidth = Math.max(1, s * 0.06); ctx.lineCap = 'round'; ctx.stroke(rib);
    } else if (kind === 'diya') {
      var flame = new Path2D();
      flame.moveTo(0, -s); flame.bezierCurveTo(s * 0.34, -s * 0.6, s * 0.3, -s * 0.18, 0, -s * 0.12);
      flame.bezierCurveTo(-s * 0.3, -s * 0.18, -s * 0.34, -s * 0.6, 0, -s); flame.closePath();
      if (outline) { ctx.lineWidth = Math.max(1.5, s * 0.06); ctx.strokeStyle = '#000'; ctx.stroke(flame); }
      else {
        ctx.fillStyle = '#ffb703'; ctx.fill(flame);
        var inner = new Path2D(); inner.moveTo(0, -s * 0.66); inner.bezierCurveTo(s * 0.16, -s * 0.44, s * 0.14, -s * 0.22, 0, -s * 0.18);
        inner.bezierCurveTo(-s * 0.14, -s * 0.22, -s * 0.16, -s * 0.44, 0, -s * 0.66); ctx.fillStyle = '#e85d04'; ctx.fill(inner);
      }
      var bowl = new Path2D(); bowl.moveTo(-s * 0.8, 0); bowl.bezierCurveTo(-s * 0.7, s * 0.75, s * 0.7, s * 0.75, s * 0.8, 0); bowl.closePath();
      fillOrLine(bowl);
      var rim = new Path2D(); rim.ellipse(0, 0, s * 0.8, s * 0.16, 0, 0, TAU);
      if (outline) { ctx.stroke(rim); } else { ctx.fillStyle = shade(col, 45); ctx.fill(rim); }
    } else if (kind === 'flower') {
      for (var i = 0; i < 5; i++) {
        var a = TAU * i / 5 - Math.PI / 2, q = new Path2D();
        q.arc(Math.cos(a) * s * 0.48, Math.sin(a) * s * 0.48, s * 0.34, 0, TAU); fillOrLine(q);
      }
      var mid = new Path2D(); mid.arc(0, 0, s * 0.24, 0, TAU);
      if (outline) { ctx.lineWidth = Math.max(1.5, s * 0.06); ctx.strokeStyle = '#000'; ctx.stroke(mid); }
      else { ctx.fillStyle = hexRgb(col)[0] > 200 && hexRgb(col)[1] > 170 ? '#d62839' : '#ffd166'; ctx.fill(mid); }
    }
  }
  function stampRot(x, y) { return (Math.abs(x - C) + Math.abs(y - C) < 0.5) ? 0 : Math.atan2(y - C, x - C) + Math.PI / 2; }

  /* ---------------------------------------------------------------- flood fill (bucket) */
  function floodFill(img, sx, sy, hex) {
    var w = img.width, h = img.height, d = img.data;
    sx = Math.round(sx); sy = Math.round(sy);
    if (sx < 0 || sy < 0 || sx >= w || sy >= h) return false;
    var fc = hexRgb(hex), i0 = (sy * w + sx) * 4;
    var tr = d[i0], tg = d[i0 + 1], tb = d[i0 + 2], ta = d[i0 + 3];
    if (ta > 250 && Math.abs(tr - fc[0]) + Math.abs(tg - fc[1]) + Math.abs(tb - fc[2]) < 6) return false;
    var clear = ta < 128;
    function match(p) {
      var j = p * 4, a = d[j + 3];
      if (clear) return a < 128;
      return a >= 128 && Math.abs(d[j] - tr) + Math.abs(d[j + 1] - tg) + Math.abs(d[j + 2] - tb) < 96;
    }
    var mask = new Uint8Array(w * h), stack = [sx, sy], n = 0;
    while (stack.length) {
      var y = stack.pop(), x = stack.pop(), p = y * w + x;
      while (x >= 0 && !mask[p] && match(p)) { x--; p--; }
      x++; p++;
      var up = false, dn = false;
      while (x < w && !mask[p] && match(p)) {
        mask[p] = 1; n++;
        if (y > 0) { var u = p - w; if (!mask[u] && match(u)) { if (!up) { stack.push(x, y - 1); up = true; } } else up = false; }
        if (y < h - 1) { var q = p + w; if (!mask[q] && match(q)) { if (!dn) { stack.push(x, y + 1); dn = true; } } else dn = false; }
        x++; p++;
      }
    }
    if (!n) return false;
    /* soften the edge: pixels just outside the area get the fill colour under them */
    var ring = new Uint8Array(w * h);
    for (var k = 0; k < w * h; k++) {
      if (!mask[k]) continue;
      var kx = k % w, nb = [kx > 0 ? k - 1 : -1, kx < w - 1 ? k + 1 : -1, k - w, k + w];
      for (var z = 0; z < 4; z++) {
        var m = nb[z];
        if (m < 0 || m >= w * h || mask[m] || ring[m]) continue;
        ring[m] = 1;
        var j = m * 4, al = d[j + 3] / 255;
        d[j] = Math.round(d[j] * al + fc[0] * (1 - al)); d[j + 1] = Math.round(d[j + 1] * al + fc[1] * (1 - al));
        d[j + 2] = Math.round(d[j + 2] * al + fc[2] * (1 - al)); d[j + 3] = 255;
      }
    }
    for (k = 0; k < w * h; k++) if (mask[k]) { var jj = k * 4; d[jj] = fc[0]; d[jj + 1] = fc[1]; d[jj + 2] = fc[2]; d[jj + 3] = 255; }
    return true;
  }

  /* ---------------------------------------------------------------- studio items */
  /* item types: pen {p,c,w,f,m} · erase {p,w,f,m} · stamps {k,p,s,c,f,m} · fill {x,y,c,f,m} */
  function drawItem(ctx, it, k, opts) {
    opts = opts || {};
    var outline = !!opts.outline;
    ctx.save();
    if (it.t === 'pen' || it.t === 'erase') {
      var path = smoothPath(it.p);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = it.w;
      if (it.t === 'erase') { ctx.globalCompositeOperation = 'destination-out'; ctx.strokeStyle = '#000'; }
      else ctx.strokeStyle = outline ? '#000' : okColor(it.c);
      if (outline && it.t === 'pen') ctx.lineWidth = Math.max(3, Math.min(it.w, 8));
      eachCopy(it, function (a, mir) { copyXf(ctx, k, a, mir); ctx.stroke(path); });
    } else if (it.t === 'stamps') {
      eachCopy(it, function (a, mir) {
        for (var i = 0; i + 1 < it.p.length; i += 2) {
          copyXf(ctx, k, a, mir);
          ctx.translate(it.p[i], it.p[i + 1]); ctx.rotate(stampRot(it.p[i], it.p[i + 1]));
          drawStamp(ctx, it.k, it.s, okColor(it.c), outline);
        }
      });
    } else if (it.t === 'fill' && !outline) {
      var cv = ctx.canvas, img;
      ctx.restore();
      try { img = ctx.getImageData(0, 0, cv.width, cv.height); } catch (e) { return; }
      var any = false;
      eachCopy(it, function (a, mir) { var q = copyPt(it.x, it.y, a, mir); if (floodFill(img, q.x * k, q.y * k, okColor(it.c))) any = true; });
      if (any) ctx.putImageData(img, 0, 0);
      return;
    }
    ctx.restore();
  }
  function renderStudio(ctx, items, k, opts) { for (var i = 0; i < items.length; i++) drawItem(ctx, items[i], k, opts); }
  function countCopies(items) {
    var n = 0; for (var i = 0; i < items.length; i++) if (items[i].t !== 'fill') n += copies(items[i]); return n;
  }

  /* a ready-made studio design, so the canvas is never empty on the first visit */
  function sampleStudio() {
    function polar(r, deg) { var a = deg * Math.PI / 180 - Math.PI / 2; return [r1(C + r * Math.cos(a)), r1(C + r * Math.sin(a))]; }
    var wave = [];
    for (var i = 0; i <= 12; i++) { var deg = i * 22.5 / 12, rr = 255 + 28 * Math.sin(i / 12 * Math.PI); wave = wave.concat(polar(rr, deg)); }
    return [
      { t: 'stamps', k: 'petal', p: polar(330, 0), s: 62, c: '#f77f00', f: 8, m: 0 },
      { t: 'stamps', k: 'leaf', p: polar(330, 22.5), s: 44, c: '#2a9d3f', f: 8, m: 0 },
      { t: 'pen', p: wave, c: '#d62839', w: 11, f: 8, m: 1 },
      { t: 'stamps', k: 'dot', p: polar(200, 11.25), s: 22, c: '#ffffff', f: 16, m: 0 },
      { t: 'stamps', k: 'petal', p: polar(130, 0), s: 48, c: '#f9c80e', f: 8, m: 0 },
      { t: 'stamps', k: 'diya', p: polar(432, 22.5), s: 46, c: '#9c4a1a', f: 8, m: 0 },
      { t: 'stamps', k: 'flower', p: [C, C], s: 78, c: '#e83e8c', f: 1, m: 0 }
    ];
  }

  /* ---------------------------------------------------------------- kolam dots */
  function lattice(g, n) {
    var dots = [], d, kind = 'sq', ox = C, oy = C, i, j;
    if (g === 'diamond') {
      n = Math.max(3, Math.min(13, n | 0)); if (n % 2 === 0) n++;
      d = 880 / n;
      var K = (n - 1) / 2;
      for (j = -K; j <= K; j++) for (i = -K; i <= K; i++) if (Math.abs(i) + Math.abs(j) <= K) dots.push({ x: C + i * d, y: C + j * d, i: i, j: j });
    } else if (g === 'tri') {
      n = Math.max(3, Math.min(9, n | 0)); kind = 'tri';
      d = 800 / n;
      var h = d * Math.sqrt(3) / 2, y0 = C - 2 / 3 * (n - 1) * h;
      for (j = 0; j < n; j++) for (i = 0; i <= j; i++) dots.push({ x: C + (i - j / 2) * d, y: y0 + j * h, i: i, j: j });
    } else {
      g = 'square'; n = Math.max(3, Math.min(9, n | 0));
      d = 880 / n; ox = oy = C - (n - 1) * d / 2;
      for (j = 0; j < n; j++) for (i = 0; i < n; i++) dots.push({ x: ox + i * d, y: oy + j * d, i: i, j: j });
    }
    var dirs = kind === 'tri' ? [0, 1, 2, 3, 4, 5].map(function (q) { var a = q * Math.PI / 3; return [Math.cos(a), Math.sin(a)]; }) : [[1, 0], [0, 1], [-1, 0], [0, -1]];
    var seen = {}, snaps = [];
    dots.forEach(function (o) {
      dirs.forEach(function (v) {
        var x = o.x + v[0] * d / 2, y = o.y + v[1] * d / 2, key = Math.round(x) + ',' + Math.round(y);
        if (!seen[key]) { seen[key] = 1; snaps.push({ x: x, y: y }); }
      });
    });
    return { g: g, n: n, d: d, kind: kind, dots: dots, snaps: snaps, ox: ox, oy: oy, dirs: dirs.length };
  }
  function folds(g) { return g === 'tri' ? [1, 3] : [1, 2, 4]; }
  function nearestSnap(lat, x, y, maxD) {
    var best = -1, bd = maxD * maxD;
    for (var i = 0; i < lat.snaps.length; i++) { var s = lat.snaps[i], q = (s.x - x) * (s.x - x) + (s.y - y) * (s.y - y); if (q < bd) { bd = q; best = i; } }
    return best;
  }
  function nearestDot(lat, x, y) {
    var best = null, bd = Infinity;
    lat.dots.forEach(function (o) { var q = (o.x - x) * (o.x - x) + (o.y - y) * (o.y - y); if (q < bd) { bd = q; best = o; } });
    return bd <= lat.d * lat.d * 0.5 ? best : null;
  }
  /* a closed loop around one dot, through the gaps on every side */
  function loopAround(lat, dot) {
    var p = [], m = lat.kind === 'tri' ? 6 : 4;
    for (var q = 0; q < m; q++) {
      var a = lat.kind === 'tri' ? q * Math.PI / 3 : q * Math.PI / 2;
      p.push(r1(dot.x + Math.cos(a) * lat.d / 2), r1(dot.y + Math.sin(a) * lat.d / 2));
    }
    return p;
  }

  /* kolam items: kl {p, cl (closed), c, w, f} · pen {p, c, w, f} */
  function renderKolam(ctx, doc, lat, k, opts) {
    opts = opts || {};
    var outline = !!opts.outline, b = bgInfo(doc.bg);
    ctx.save(); ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = outline ? '#000' : b.dot;
    var rad = Math.max(4, lat.d * 0.055);
    lat.dots.forEach(function (o) { ctx.beginPath(); ctx.arc(o.x, o.y, rad, 0, TAU); ctx.fill(); });
    ctx.restore();
    if (doc.ghost && doc.ghost.length && opts.ghost) {
      ctx.save(); ctx.globalAlpha = 0.3;
      doc.ghost.forEach(function (it) { drawKolamItem(ctx, it, k, { tint: b.dark ? '#ffffff' : '#000000' }); });
      ctx.restore();
    }
    (doc.items || []).forEach(function (it) { drawKolamItem(ctx, it, k, opts); });
  }
  function drawKolamItem(ctx, it, k, opts) {
    opts = opts || {};
    var path = it.t === 'kl' ? crPath(it.p, !!it.cl) : smoothPath(it.p);
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = opts.outline ? Math.max(3, Math.min(it.w, 7)) : it.w;
    ctx.strokeStyle = opts.tint || (opts.outline ? '#000' : okColor(it.c));
    eachCopy({ f: it.f, m: 0 }, function (a) { copyXf(ctx, k, a, false); ctx.stroke(path); });
    ctx.restore();
  }
  function distSeg(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy, u = L ? ((px - ax) * dx + (py - ay) * dy) / L : 0;
    u = Math.max(0, Math.min(1, u));
    var x = ax + u * dx - px, y = ay + u * dy - py;
    return Math.sqrt(x * x + y * y);
  }
  /* index of the kolam line under a point (or -1) */
  function hitKolam(items, x, y, tol) {
    for (var i = items.length - 1; i >= 0; i--) {
      var it = items[i], f = Math.max(1, it.f | 0), p = it.p, n = p.length / 2;
      for (var c = 0; c < f; c++) {
        var q = copyPt(x, y, -TAU * c / f, false), lim = tol + it.w / 2;
        if (n === 1 && Math.hypot(q.x - p[0], q.y - p[1]) < lim) return i;
        var last = it.cl ? n : n - 1;
        for (var s = 0; s < last; s++) {
          var e = (s + 1) % n;
          if (distSeg(q.x, q.y, p[2 * s], p[2 * s + 1], p[2 * e], p[2 * e + 1]) < lim) return i;
        }
      }
    }
    return -1;
  }

  /* ---------------------------------------------------------------- sikku kolam: one line around all dots
     Mirror-curve method (as described by Paulus Gerdes for kolam and sona designs): the line travels
     diagonally through the gaps between dots and bounces off the border and off small "mirrors" placed
     between two dots. With no mirrors a grid gives several closed lines; each mirror placed where two
     different lines cross joins them, until ONE line goes around every dot. */
  function sqHas(lat) {
    var set = {};
    lat.dots.forEach(function (o) { set[o.i + ',' + o.j] = 1; });
    return function (i, j) { return set[i + ',' + j] === 1; };
  }
  function mirrorSystem(lat) {
    var has = sqHas(lat), verts = [], vset = {};
    lat.dots.forEach(function (o) {
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (v) {
        var X = 2 * o.i + v[0], Y = 2 * o.j + v[1], key = X + ',' + Y;
        if (!vset[key]) { vset[key] = 1; verts.push([X, Y]); }
      });
    });
    function odd(v) { return ((v % 2) + 2) % 2 === 1; }
    /* new direction after passing vertex (X, Y) */
    function out(X, Y, dx, dy, mir) {
      var m = mir[X + ',' + Y];
      if (odd(X)) {          /* between two dots side by side */
        var a = has((X - 1) / 2, Y / 2), b = has((X + 1) / 2, Y / 2);
        if (!a || !b) dx = a ? -1 : 1;
        else if (m === 'w') dx = -dx; else if (m === 'c') dy = -dy;
      } else {                /* between two dots one above the other */
        var c = has(X / 2, (Y - 1) / 2), e = has(X / 2, (Y + 1) / 2);
        if (!c || !e) dy = c ? -1 : 1;
        else if (m === 'w') dy = -dy; else if (m === 'c') dx = -dx;
      }
      return [dx, dy];
    }
    function internal(X, Y) {
      return odd(X) ? has((X - 1) / 2, Y / 2) && has((X + 1) / 2, Y / 2) : has(X / 2, (Y - 1) / 2) && has(X / 2, (Y + 1) / 2);
    }
    function curves(mir) {
      var segOf = {}, list = [], DIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
      verts.forEach(function (v) {
        DIRS.forEach(function (dd) {
          var o = out(v[0], v[1], dd[0], dd[1], mir), sk = (2 * v[0] + o[0]) + ',' + (2 * v[1] + o[1]);
          if (segOf[sk] !== undefined) return;
          var id = list.length, pts = [], X = v[0], Y = v[1], dx = o[0], dy = o[1], guard = 0;
          var X0 = X, Y0 = Y, dx0 = dx, dy0 = dy;
          do {
            pts.push(X, Y);
            segOf[(2 * X + dx) + ',' + (2 * Y + dy)] = id;
            X += dx; Y += dy;
            var nd = out(X, Y, dx, dy, mir); dx = nd[0]; dy = nd[1];
          } while (!(X === X0 && Y === Y0 && dx === dx0 && dy === dy0) && ++guard < 20000);
          list.push(pts);
        });
      });
      return { list: list, segOf: segOf };
    }
    return { verts: verts, internal: internal, curves: curves };
  }
  function sikku(lat, seed, sym) {
    var sys = mirrorSystem(lat), rand = rng(seed || 1), mir = {};
    var cx = lat.g === 'square' ? lat.n - 1 : 0;      /* centre in doubled grid units */
    function orbit(X, Y) {
      if (!sym) return [[X, Y]];
      var o = [], x = X, y = Y;
      for (var q = 0; q < 4; q++) { o.push([x, y]); var nx = cx - (y - cx), ny = cx + (x - cx); x = nx; y = ny; }
      return o;
    }
    var inner = sys.verts.filter(function (v) { return sys.internal(v[0], v[1]); });
    var cur = sys.curves(mir), guard = 0;
    while (cur.list.length > 1 && guard++ < 500) {
      var cands = inner.filter(function (v) {
        var key = v[0] + ',' + v[1];
        if (mir[key]) return false;
        var A = cur.segOf[(2 * v[0] + 1) + ',' + (2 * v[1] + 1)], B = cur.segOf[(2 * v[0] + 1) + ',' + (2 * v[1] - 1)];
        return A !== undefined && B !== undefined && A !== B;
      });
      if (!cands.length) break;
      var pick = cands[Math.floor(rand() * cands.length)], type = rand() < 0.5 ? 'w' : 'c';
      var orb = orbit(pick[0], pick[1]), before = cur.list.length, placed = [];
      orb.forEach(function (v) { var key = v[0] + ',' + v[1]; if (!mir[key] && sys.internal(v[0], v[1])) { mir[key] = type; placed.push(key); } });
      var next = sys.curves(mir);
      if (next.list.length >= before) {          /* the symmetric set did not help: keep only the one mirror */
        placed.forEach(function (key) { delete mir[key]; });
        mir[pick[0] + ',' + pick[1]] = type;
        next = sys.curves(mir);
      }
      cur = next;
    }
    /* a few more symmetric mirrors that keep it one line, for a richer pattern */
    for (var tries = 0; tries < 24 && cur.list.length === 1; tries++) {
      var v = inner[Math.floor(rand() * inner.length)], orb2 = orbit(v[0], v[1]), t2 = rand() < 0.5 ? 'w' : 'c', added = [];
      orb2.forEach(function (q) { var key = q[0] + ',' + q[1]; if (!mir[key] && sys.internal(q[0], q[1])) { mir[key] = t2; added.push(key); } });
      if (!added.length) continue;
      var test = sys.curves(mir);
      if (test.list.length !== 1) added.forEach(function (key) { delete mir[key]; }); else cur = test;
    }
    return cur.list.map(function (pts) {
      var p = [];
      for (var i = 0; i < pts.length; i += 2) p.push(r1(lat.ox + pts[i] / 2 * lat.d), r1(lat.oy + pts[i + 1] / 2 * lat.d));
      return p;
    });
  }
  /* triangle dots: loops around dots plus round knots in the gaps (a lace pattern with 3-fold symmetry) */
  function triLace(lat, seed, all) {
    var rand = rng(seed || 1), out = [], d = lat.d;
    var byRow = {};
    lat.dots.forEach(function (o) { (byRow[o.j] = byRow[o.j] || [])[o.i] = o; });
    function rot120(x, y) { var q = copyPt(x, y, TAU / 3, false); return q; }
    function key(x, y) { return Math.round(x / 4) + ',' + Math.round(y / 4); }
    var chosen = {};
    function choose(x, y, val) { var a = { x: x, y: y }; for (var q = 0; q < 3; q++) { chosen[key(a.x, a.y)] = val; a = rot120(a.x, a.y); } }
    lat.dots.forEach(function (o) { if (chosen[key(o.x, o.y)] === undefined) choose(o.x, o.y, all || rand() < 0.6); });
    lat.dots.forEach(function (o) { if (chosen[key(o.x, o.y)]) out.push(loopAround(lat, o)); });
    /* small knots in every upward triangle gap */
    for (var j = 0; j + 1 < lat.n; j++) for (var i = 0; i <= j; i++) {
      var a = byRow[j][i], b = byRow[j + 1][i], c = byRow[j + 1][i + 1];
      var gx = (a.x + b.x + c.x) / 3, gy = (a.y + b.y + c.y) / 3, gk = 'g' + key(gx, gy);
      if (chosen[gk] === undefined) { var val = all || rand() < 0.7, g = { x: gx, y: gy }; for (var q = 0; q < 3; q++) { chosen['g' + key(g.x, g.y)] = val; g = rot120(g.x, g.y); } }
      if (chosen[gk]) out.push([r1((a.x + b.x) / 2), r1((a.y + b.y) / 2), r1((b.x + c.x) / 2), r1((b.y + c.y) / 2), r1((a.x + c.x) / 2), r1((a.y + c.y) / 2)]);
    }
    void d;
    return out;
  }
  var STARTERS = [
    { id: 'loops', g: 'square', n: 4 },
    { id: 'sikku3', g: 'square', n: 3, seed: 7 },
    { id: 'sikku5', g: 'square', n: 5, seed: 11 },
    { id: 'diamond', g: 'diamond', n: 7, seed: 5 },
    { id: 'sikku6', g: 'square', n: 6, seed: 3 },
    { id: 'lace', g: 'tri', n: 5 }
  ];
  var LINE_W = 7;
  function asItems(lines, col, w) { return lines.map(function (p) { return { t: 'kl', p: p, cl: 1, c: col, w: w || LINE_W, f: 1 }; }); }
  function starter(id) {
    var s = STARTERS.filter(function (x) { return x.id === id; })[0] || STARTERS[0];
    var lat = lattice(s.g, s.n), lines;
    if (s.id === 'loops') lines = lat.dots.map(function (o) { return loopAround(lat, o); });
    else if (s.g === 'tri') lines = triLace(lat, 1, true);
    else lines = sikku(lat, s.seed, true);
    return { g: lat.g, n: lat.n, items: asItems(lines, '#ffffff') };
  }
  /* a fresh random design on the current dots */
  function surprise(g, n, seed, col, w) {
    var lat = lattice(g, n);
    var lines = lat.kind === 'tri' ? triLace(lat, seed, false) : sikku(lat, seed, true);
    return asItems(lines, col, w);
  }

  /* ---------------------------------------------------------------- colour-in templates (SVG paths) */
  function P(r, deg) { var a = deg * Math.PI / 180; return [C + r * Math.sin(a), C - r * Math.cos(a)]; }
  function pt(p) { return r1(p[0]) + ' ' + r1(p[1]); }
  function circ(cx, cy, r) { return 'M' + r1(cx - r) + ' ' + r1(cy) + 'a' + r1(r) + ' ' + r1(r) + ' 0 1 0 ' + r1(2 * r) + ' 0a' + r1(r) + ' ' + r1(r) + ' 0 1 0 ' + r1(-2 * r) + ' 0Z'; }
  function circAt(r, deg, rad) { var p = P(r, deg); return circ(p[0], p[1], rad); }
  function sector(r0, r1_, a0, a1) {
    var p0 = P(r1_, a0), p1 = P(r1_, a1), large = (a1 - a0) > 180 ? 1 : 0;
    if (r0 <= 0) return 'M' + C + ' ' + C + 'L' + pt(p0) + 'A' + r1_ + ' ' + r1_ + ' 0 ' + large + ' 1 ' + pt(p1) + 'Z';
    var p2 = P(r0, a1), p3 = P(r0, a0);
    return 'M' + pt(p0) + 'A' + r1_ + ' ' + r1_ + ' 0 ' + large + ' 1 ' + pt(p1) + 'L' + pt(p2) + 'A' + r0 + ' ' + r0 + ' 0 ' + large + ' 0 ' + pt(p3) + 'Z';
  }
  /* a petal along the direction deg, from radius r0 to r1, half-width hw */
  function petal(r0, r1_, deg, hw, pointy) {
    var a = deg * Math.PI / 180, L = r1_ - r0;
    function Q(tt, off) { var R = r0 + tt * L; return [C + R * Math.sin(a) + off * Math.cos(a), C - R * Math.cos(a) + off * Math.sin(a)]; }
    var b = Q(0, 0), tip = Q(1, 0);
    if (pointy) return 'M' + pt(b) + 'C' + pt(Q(0.3, hw * 1.3)) + ' ' + pt(Q(0.72, hw * 0.95)) + ' ' + pt(tip) + 'C' + pt(Q(0.72, -hw * 0.95)) + ' ' + pt(Q(0.3, -hw * 1.3)) + ' ' + pt(b) + 'Z';
    return 'M' + pt(b) + 'C' + pt(Q(0.12, hw * 1.35)) + ' ' + pt(Q(1.08, hw * 1.15)) + ' ' + pt(tip) + 'C' + pt(Q(1.08, -hw * 1.15)) + ' ' + pt(Q(0.12, -hw * 1.35)) + ' ' + pt(b) + 'Z';
  }
  function poly(ps) { return 'M' + ps.map(pt).join('L') + 'Z'; }
  function paisley(R, deg, s) {
    var a = deg * Math.PI / 180, c = P(R, deg);
    function L(x, y) { return [c[0] + x * s * Math.cos(a) - y * s * Math.sin(a), c[1] + x * s * Math.sin(a) + y * s * Math.cos(a)]; }
    return 'M' + pt(L(0, 0.55)) + 'C' + pt(L(0.62, 0.55)) + ' ' + pt(L(0.68, -0.25)) + ' ' + pt(L(0.18, -0.62)) +
      'C' + pt(L(-0.02, -0.78)) + ' ' + pt(L(-0.2, -0.95)) + ' ' + pt(L(-0.02, -1.1)) +
      'C' + pt(L(-0.42, -0.95)) + ' ' + pt(L(-0.66, -0.3)) + ' ' + pt(L(-0.56, 0.12)) +
      'C' + pt(L(-0.46, 0.45)) + ' ' + pt(L(-0.24, 0.55)) + ' ' + pt(L(0, 0.55)) + 'Z';
  }
  function paisleyEye(R, deg, s) {
    var a = deg * Math.PI / 180, c = P(R, deg);
    return circ(c[0] + 0.05 * s * Math.sin(a) * -1 * 0, c[1] + 0, 0) && circ(c[0] - 0.05 * s * Math.sin(a), c[1] + 0.05 * s * Math.cos(a), s * 0.24);
  }
  function range(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }

  var TEMPLATES = (function () {
    var T = {};
    function add(id, build) {
      var regions = [];
      function R(d, g) { regions.push({ id: id[0] + regions.length, d: d, g: g }); }
      R('M0 0H1000V1000H0Z', 'page');
      build(R);
      T[id] = regions;
    }
    add('lotus', function (R) {
      range(24).forEach(function (i) { R(sector(440, 482, i * 15, i * 15 + 15), i % 2 ? 'ring2' : 'ring1'); });
      R(circ(C, C, 440), 'disc');
      range(8).forEach(function (i) { R(circAt(418, i * 45 + 22.5, 16), 'dots'); });
      range(8).forEach(function (i) { R(petal(105, 405, i * 45 + 22.5, 72, true), 'back'); });
      range(8).forEach(function (i) { R(petal(95, 360, i * 45, 78, true), 'front'); });
      range(8).forEach(function (i) { R(petal(70, 200, i * 45, 32, false), 'inner'); });
      R(circ(C, C, 88), 'c1'); R(circ(C, C, 42), 'c2');
    });
    add('marigold', function (R) {
      R(circ(C, C, 476), 'disc');
      range(24).forEach(function (i) { R(petal(330, 468, i * 15 + 7.5, 31, false), 'p24'); });
      range(12).forEach(function (i) { R(petal(195, 365, i * 30, 62, false), 'p12'); });
      range(8).forEach(function (i) { R(petal(115, 250, i * 45 + 22.5, 55, true), 'p8'); });
      range(12).forEach(function (i) { R(sector(68, 120, i * 30, i * 30 + 30), i % 2 ? 'sB' : 'sA'); });
      R(circ(C, C, 68), 'core');
    });
    add('diya', function (R) {
      R(circ(C, C, 455), 'disc');
      range(16).forEach(function (i) { R(circAt(442, i * 22.5, 38), 'scal'); });
      R(circ(C, C, 418), 'disc2');
      range(8).forEach(function (i) { R(petal(222, 398, i * 45, 56, true), 'pet'); });
      range(8).forEach(function (i) { R(circAt(335, i * 45 + 22.5, 24), 'dots'); });
      R(circ(C, C, 222), 'inner');
      R('M330 535C352 668 648 668 670 535Z', 'bowl');
      R('M330 535a170 28 0 1 0 340 0a170 28 0 1 0 -340 0Z', 'rim');
      R('M500 292C548 366 566 440 500 500C434 440 452 366 500 292Z', 'flame');
      R('M500 378C522 418 528 456 500 488C472 456 478 418 500 378Z', 'flame2');
    });
    add('star', function (R) {
      range(16).forEach(function (i) { R(sector(412, 472, i * 22.5, i * 22.5 + 22.5), i % 2 ? 'ring2' : 'ring1'); });
      R(circ(C, C, 412), 'disc');
      var Rr = 398, ri = Rr * Math.cos(Math.PI / 4) / Math.cos(Math.PI / 8);
      range(8).forEach(function (i) { R(poly([P(Rr, i * 45), P(ri, i * 45 + 22.5), P(ri * 0.62, i * 45), P(ri, i * 45 - 22.5)]), 'tipA'); });
      range(8).forEach(function (i) { R(poly([P(ri * 0.62, i * 45), P(ri, i * 45 + 22.5), P(ri * 0.62, i * 45 + 45), P(ri * 0.52, i * 45 + 22.5)]), 'kite'); });
      R(poly(range(8).map(function (i) { return P(ri * 0.62, i * 45); }).reduce(function (acc, p, i) { acc.push(p); acc.push(P(ri * 0.52, i * 45 + 22.5)); return acc; }, [])), 'oct');
      range(8).forEach(function (i) { R(petal(46, 168, i * 45, 34, false), 'pet'); });
      R(circ(C, C, 50), 'c');
      range(8).forEach(function (i) { R(circAt(360, i * 45 + 22.5, 20), 'dots'); });
    });
    add('paisley', function (R) {
      range(12).forEach(function (i) { R(sector(420, 474, i * 30, i * 30 + 30), i % 2 ? 'ring2' : 'ring1'); });
      R(circ(C, C, 420), 'disc');
      range(6).forEach(function (i) { R(paisley(262, i * 60, 140), 'pais'); });
      range(6).forEach(function (i) { R(paisleyEye(262, i * 60, 140), 'eye'); });
      range(6).forEach(function (i) { R(circAt(375, i * 60 + 30, 24), 'dots'); });
      range(6).forEach(function (i) { R(petal(44, 165, i * 60 + 30, 46, false), 'pet'); });
      R(circ(C, C, 48), 'c');
    });
    add('rings', function (R) {
      range(24).forEach(function (i) { R(sector(440, 480, i * 15, i * 15 + 15), i % 2 ? 'e2' : 'e1'); });
      range(12).forEach(function (i) { R(sector(350, 440, i * 30 + 15, i * 30 + 45), i % 2 ? 'd2' : 'd1'); });
      range(24).forEach(function (i) { R(sector(255, 350, i * 15, i * 15 + 15), i % 2 ? 'c2' : 'c1'); });
      range(12).forEach(function (i) { R(sector(160, 255, i * 30, i * 30 + 30), i % 2 ? 'b2' : 'b1'); });
      range(6).forEach(function (i) { R(sector(70, 160, i * 60, i * 60 + 60), i % 2 ? 'a2' : 'a1'); });
      R(circ(C, C, 70), 'core');
    });
    add('flower', function (R) {
      R(circ(C, C, 476), 'disc');
      range(6).forEach(function (i) { R(petal(190, 420, i * 60 + 30, 46, true), 'leaf'); });
      range(6).forEach(function (i) { R(petal(105, 440, i * 60, 128, false), 'pet'); });
      R(circ(C, C, 112), 'c'); R(circ(C, C, 52), 'c2');
    });
    return T;
  })();
  var TEMPLATE_IDS = ['lotus', 'marigold', 'diya', 'star', 'paisley', 'rings', 'flower'];

  /* paint a template on a canvas: fills = { regionId: colour } */
  function renderTemplate(ctx, id, fills, k, opts) {
    opts = opts || {};
    var regs = TEMPLATES[id] || TEMPLATES.lotus;
    ctx.save(); ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.lineJoin = 'round'; ctx.lineWidth = opts.thin ? 2 : 3; ctx.strokeStyle = '#2b2118';
    regs.forEach(function (r) {
      var p = new Path2D(r.d);
      ctx.fillStyle = (!opts.outline && fills && fills[r.id]) ? okColor(fills[r.id]) : '#ffffff';
      ctx.fill(p);
      if (r.g !== 'page') ctx.stroke(p);
    });
    ctx.restore();
  }

  window.RArt = {
    W: W, C: C, BG: BG, bgInfo: bgInfo, rng: rng, r1: r1,
    drawBg: drawBg, drawGuides: drawGuides,
    copies: copies, countCopies: countCopies, eachCopy: eachCopy, copyXf: copyXf, copyPt: copyPt,
    smoothPath: smoothPath, crPath: crPath, drawStamp: drawStamp, stampRot: stampRot,
    drawItem: drawItem, renderStudio: renderStudio, floodFill: floodFill, sampleStudio: sampleStudio,
    lattice: lattice, folds: folds, nearestSnap: nearestSnap, nearestDot: nearestDot, loopAround: loopAround,
    renderKolam: renderKolam, drawKolamItem: drawKolamItem, hitKolam: hitKolam,
    sikku: sikku, triLace: triLace, STARTERS: STARTERS, starter: starter, surprise: surprise, LINE_W: LINE_W,
    TEMPLATES: TEMPLATES, TEMPLATE_IDS: TEMPLATE_IDS, renderTemplate: renderTemplate
  };
})();
