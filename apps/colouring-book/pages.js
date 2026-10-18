/* Colouring Book: every page is original line art drawn here in code (viewBox 0 0 400 400).
   A page is a list of items, bottom to top:
     region  { d | text, part, det, bg }   a closed shape the child can fill
     line    { d }                          a decorative stroke (not fillable)
     ink     { d }                          a small solid black shape (eyes, nostrils)
   det: a small detail region; in toddler mode it is only a line, and taps fill the bigger shape below.
   bg:  the background; it can be filled but is not needed to finish the page. */
(function () {
  'use strict';
  function f(n) { return Math.round(n * 10) / 10; }
  var G = {
    c: function (x, y, r) { return 'M' + f(x - r) + ' ' + f(y) + 'a' + r + ' ' + r + ' 0 1 0 ' + f(2 * r) + ' 0a' + r + ' ' + r + ' 0 1 0 ' + f(-2 * r) + ' 0Z'; },
    e: function (x, y, rx, ry) { return 'M' + f(x - rx) + ' ' + f(y) + 'a' + rx + ' ' + ry + ' 0 1 0 ' + f(2 * rx) + ' 0a' + rx + ' ' + ry + ' 0 1 0 ' + f(-2 * rx) + ' 0Z'; },
    rect: function (x, y, w, h, r) {
      r = Math.min(r || 0, w / 2, h / 2);
      if (!r) return 'M' + x + ' ' + y + 'h' + w + 'v' + h + 'h' + (-w) + 'Z';
      var a = 'a' + r + ' ' + r + ' 0 0 1 ';
      return 'M' + f(x + r) + ' ' + y + 'h' + f(w - 2 * r) + a + r + ' ' + r + 'v' + f(h - 2 * r) + a + (-r) + ' ' + r +
        'h' + f(-(w - 2 * r)) + a + (-r) + ' ' + (-r) + 'v' + f(-(h - 2 * r)) + a + r + ' ' + (-r) + 'Z';
    },
    poly: function (pts) {
      var s = 'M' + f(pts[0]) + ' ' + f(pts[1]);
      for (var i = 2; i < pts.length; i += 2) s += 'L' + f(pts[i]) + ' ' + f(pts[i + 1]);
      return s + 'Z';
    },
    star: function (x, y, n, ro, ri, rot) {
      var pts = [], a0 = (rot == null ? -90 : rot) * Math.PI / 180;
      for (var i = 0; i < n * 2; i++) { var a = a0 + i * Math.PI / n, r = i % 2 ? ri : ro; pts.push(x + r * Math.cos(a), y + r * Math.sin(a)); }
      return G.poly(pts);
    },
    /* a leaf / petal from (x,y) to a tip len away at angle deg; w = width */
    petal: function (x, y, len, w, deg) {
      var a = deg * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
      var tx = x + len * ca, ty = y + len * sa, mx = x + len * 0.5 * ca, my = y + len * 0.5 * sa, px = -sa * w, py = ca * w;
      return 'M' + f(x) + ' ' + f(y) + 'Q' + f(mx + px) + ' ' + f(my + py) + ' ' + f(tx) + ' ' + f(ty) + 'Q' + f(mx - px) + ' ' + f(my - py) + ' ' + f(x) + ' ' + f(y) + 'Z';
    },
    /* rotate a flat list of points around (cx,cy) */
    rot: function (pts, cx, cy, deg) {
      var a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), out = [];
      for (var i = 0; i < pts.length; i += 2) { var dx = pts[i] - cx, dy = pts[i + 1] - cy; out.push(cx + dx * c - dy * s, cy + dx * s + dy * c); }
      return out;
    },
    /* a fluffy cloud from circles along a base */
    cloud: function (x, y, w) {
      var h = w * 0.42, r1 = w * 0.22, r2 = w * 0.3;
      return 'M' + f(x) + ' ' + f(y + h) + 'a' + f(r1) + ' ' + f(r1) + ' 0 0 1 ' + f(w * 0.2) + ' ' + f(-h * 0.85) +
        'a' + f(r2) + ' ' + f(r2) + ' 0 0 1 ' + f(w * 0.48) + ' ' + f(-h * 0.25) +
        'a' + f(r1) + ' ' + f(r1) + ' 0 0 1 ' + f(w * 0.32) + ' ' + f(h * 1.1) + 'Z';
    },
    /* a heart centred at x,y with size s */
    heart: function (x, y, s) {
      return 'M' + f(x) + ' ' + f(y + s * 0.45) + 'C' + f(x - s * 0.9) + ' ' + f(y - s * 0.1) + ' ' + f(x - s * 0.45) + ' ' + f(y - s * 0.75) + ' ' + f(x) + ' ' + f(y - s * 0.3) +
        'C' + f(x + s * 0.45) + ' ' + f(y - s * 0.75) + ' ' + f(x + s * 0.9) + ' ' + f(y - s * 0.1) + ' ' + f(x) + ' ' + f(y + s * 0.45) + 'Z';
    },
    flowerRing: function (b, x, y, n, len, w, part, det, rot) {
      for (var i = 0; i < n; i++) b.r(G.petal(x, y, len, w, (rot || -90) + i * 360 / n), part, det);
    }
  };

  function Builder() { this.items = []; }
  Builder.prototype.bg = function (d, part) { this.items.push({ k: 'r', d: d, part: part || 'sky', bg: 1 }); return this; };
  Builder.prototype.r = function (d, part, det) { this.items.push({ k: 'r', d: d, part: part || '', det: det ? 1 : 0 }); return this; };
  Builder.prototype.text = function (x, y, txt, size, part, det) { this.items.push({ k: 'r', text: txt, x: x, y: y, size: size, part: part || '', det: det ? 1 : 0 }); return this; };
  Builder.prototype.line = function (d) { this.items.push({ k: 'line', d: d }); return this; };
  Builder.prototype.ink = function (d) { this.items.push({ k: 'ink', d: d }); return this; };
  var FULL = G.rect(0, 0, 400, 400);

  /* ------------------------------------------------------------ picture pages */
  var PICS = [];
  function pic(id, cat, fn) { PICS.push({ id: id, cat: cat, draw: fn }); }

  /* ---------- animals ---------- */
  pic('elephant', 'animals', function (b) {
    b.bg(FULL).r(G.rect(0, 318, 400, 82), 'ground');
    b.r(G.rect(92, 240, 38, 92, 12), 'leg').r(G.rect(140, 246, 38, 88, 12), 'leg').r(G.rect(208, 246, 38, 88, 12), 'leg').r(G.rect(254, 240, 38, 92, 12), 'leg');
    b.r('M70 196Q46 232 56 270L68 268Q60 236 80 206Z', 'tail', 1);
    b.r(G.e(180, 205, 112, 78), 'body');
    b.r('M118 140Q178 118 238 140L246 204Q180 224 112 204Z', 'cloth');
    b.r(G.c(130, 214, 9), 'cloth', 1).r(G.c(180, 222, 9), 'cloth', 1).r(G.c(230, 214, 9), 'cloth', 1);
    b.r('M318 196Q348 246 330 296Q326 322 348 322Q364 300 356 248Q350 210 344 186Z', 'trunk');
    b.r(G.c(292, 168, 62), 'head');
    b.r('M266 118Q200 116 204 180Q210 244 268 230Q290 180 266 118Z', 'ear');
    b.r('M318 222Q328 252 356 254Q332 240 328 214Z', 'tusk', 1);
    b.r(G.poly([300, 112, 314, 128, 300, 144, 286, 128]), 'cloth', 1);
    b.ink(G.c(318, 160, 6));
    b.line('M98 320v10M112 320v10M146 324v10M160 324v10M214 324v10M228 324v10M260 320v10M274 320v10');
  });

  pic('peacock', 'animals', function (b) {
    b.bg(FULL).r(G.rect(0, 352, 400, 48), 'ground');
    b.r('M30 300A170 170 0 0 1 370 300Z', 'tail');
    var i, a;
    for (i = 0; i < 9; i++) { a = (198 + i * 18) * Math.PI / 180; b.r(G.e(200 + 132 * Math.cos(a), 300 + 132 * Math.sin(a), 17, 22), 'feather'); }
    for (i = 0; i < 9; i++) { a = (198 + i * 18) * Math.PI / 180; b.r(G.c(200 + 132 * Math.cos(a), 300 + 132 * Math.sin(a), 8), 'feather', 1); }
    for (i = 0; i < 6; i++) { a = (205 + i * 26) * Math.PI / 180; b.r(G.e(200 + 78 * Math.cos(a), 300 + 78 * Math.sin(a), 14, 17), 'feather'); }
    b.line('M188 336L184 372M182 372L172 380M184 372L192 380M212 336L216 372M214 372L206 380M216 372L226 380');
    b.r(G.e(200, 296, 34, 50), 'body');
    b.r('M186 262Q180 208 191 160L211 160Q217 208 216 262Z', 'neck');
    b.line('M193 132L184 106M201 130V102M209 132L218 106');
    b.r(G.c(184, 102, 6), 'feather', 1).r(G.c(201, 98, 6), 'feather', 1).r(G.c(219, 102, 6), 'feather', 1);
    b.r(G.c(201, 150, 20), 'head');
    b.r(G.poly([216, 143, 240, 151, 216, 158]), 'beak');
    b.ink(G.c(206, 146, 4));
  });

  pic('tiger', 'animals', function (b) {
    b.bg(FULL);
    b.r(G.e(200, 360, 130, 70), 'body');
    b.r(G.c(118, 112, 36), 'ear').r(G.c(282, 112, 36), 'ear');
    b.r(G.c(118, 112, 18), 'ear', 1).r(G.c(282, 112, 18), 'ear', 1);
    b.r(G.e(200, 205, 118, 102), 'head');
    b.r('M186 106L200 152L214 106Z', 'stripe').r('M150 116L168 150L176 112Z', 'stripe', 1).r('M250 116L232 150L224 112Z', 'stripe', 1);
    b.r(G.poly([84, 176, 134, 192, 86, 202]), 'stripe').r(G.poly([90, 222, 134, 214, 98, 244]), 'stripe');
    b.r(G.poly([316, 176, 266, 192, 314, 202]), 'stripe').r(G.poly([310, 222, 266, 214, 302, 244]), 'stripe');
    b.r(G.e(200, 252, 58, 42), 'mouth');
    b.r(G.e(158, 186, 18, 20), 'eye', 1).r(G.e(242, 186, 18, 20), 'eye', 1);
    b.ink(G.c(160, 190, 8)).ink(G.c(244, 190, 8));
    b.ink('M182 226Q200 220 218 226L200 246Z');
    b.line('M200 246Q200 264 182 268M200 246Q200 264 218 268');
    b.line('M150 250L104 244M150 262L106 268M250 250L296 244M250 262L294 268');
  });

  pic('cow', 'animals', function (b) {
    b.bg(FULL).r(G.rect(0, 320, 400, 80), 'ground');
    b.r(G.rect(126, 250, 30, 80, 10), 'leg').r(G.rect(170, 254, 30, 76, 10), 'leg').r(G.rect(250, 254, 30, 76, 10), 'leg').r(G.rect(290, 250, 30, 80, 10), 'leg');
    b.line('M318 190Q350 220 344 272');
    b.r(G.e(344, 282, 10, 14), 'tail', 1);
    b.r(G.rect(112, 162, 214, 112, 46), 'body');
    b.r('M170 172Q200 160 216 184Q206 214 176 206Q156 196 170 172Z', 'spot', 1);
    b.r('M258 214Q290 200 300 232Q290 260 262 252Q244 236 258 214Z', 'spot', 1);
    b.r(G.e(272, 278, 22, 13), 'udder', 1);
    b.r('M64 150Q60 128 74 120L80 142Z', 'horn', 1).r('M116 150Q122 128 108 120L100 142Z', 'horn', 1);
    b.r(G.petal(70, 162, 40, 22, 200), 'ear').r(G.petal(110, 162, 40, 22, -20), 'ear');
    b.r(G.e(90, 186, 40, 48), 'head');
    b.r(G.e(90, 226, 34, 22), 'mouth');
    b.ink(G.c(76, 178, 5)).ink(G.c(104, 178, 5)).ink(G.e(80, 226, 4, 6)).ink(G.e(100, 226, 4, 6));
    b.r(G.rect(108, 240, 40, 10, 5), 'cloth', 1).r(G.c(128, 262, 12), 'bell', 1);
    b.line('M30 322l10 -16l6 16M360 330l8 -14l6 14');
  });

  pic('fish', 'animals', function (b) {
    b.bg(FULL, 'water');
    b.r('M300 200L372 136Q352 200 372 264Z', 'tail');
    b.r('M140 136Q196 82 262 140Z', 'fin').r('M170 262Q200 304 238 262Z', 'fin');
    b.r(G.e(190, 200, 122, 76), 'body');
    b.r('M150 135Q172 200 150 265Q128 200 150 135Z', 'stripe').r('M214 132Q234 200 214 268Q194 200 214 132Z', 'stripe');
    b.line('M110 160Q126 200 110 240');
    b.r(G.c(96, 184, 16), 'eye', 1);
    b.ink(G.c(92, 184, 7));
    b.line('M70 222Q80 230 92 226');
    b.r(G.c(54, 120, 12), 'bubble', 1).r(G.c(40, 84, 8), 'bubble', 1).r(G.c(62, 50, 10), 'bubble', 1);
    b.r('M40 400Q20 350 50 310Q44 360 66 400Z', 'leaf').r('M330 400Q310 340 346 300Q340 360 360 400Z', 'leaf');
    b.r(G.e(170, 392, 40, 16), 'stone').r(G.e(240, 396, 30, 12), 'stone');
  });

  pic('butterfly', 'animals', function (b) {
    b.bg(FULL).r(G.rect(0, 340, 400, 60), 'ground');
    b.r('M196 196Q120 70 62 110Q30 190 196 202Z', 'wing').r('M204 196Q280 70 338 110Q370 190 204 202Z', 'wing');
    b.r('M196 208Q104 222 104 290Q140 336 196 220Z', 'wing').r('M204 208Q296 222 296 290Q260 336 204 220Z', 'wing');
    b.r(G.c(118, 140, 22), 'spot', 1).r(G.c(282, 140, 22), 'spot', 1).r(G.c(140, 270, 16), 'spot', 1).r(G.c(260, 270, 16), 'spot', 1);
    b.r(G.c(160, 176, 10), 'spot', 1).r(G.c(240, 176, 10), 'spot', 1);
    b.r(G.e(200, 220, 13, 70), 'body');
    b.r(G.c(200, 142, 16), 'head');
    b.line('M194 128Q184 96 166 86M206 128Q216 96 234 86');
    b.ink(G.c(166, 86, 5)).ink(G.c(234, 86, 5));
    b.r(G.petal(60, 360, 36, 26, -70), 'leaf').r(G.petal(340, 360, 36, 26, -110), 'leaf');
    G.flowerRing(b, 40, 318, 5, 16, 16, 'petal', 1);
    b.r(G.c(40, 318, 6), 'petal', 1);
  });

  pic('parrot', 'animals', function (b) {
    b.bg(FULL);
    b.r('M196 280L172 380L204 380L216 282Z', 'tail');
    b.r(G.rect(40, 286, 320, 20, 10), 'branch');
    b.r(G.e(206, 214, 50, 82), 'body');
    b.r('M196 160Q150 216 178 290Q216 254 220 176Z', 'wing');
    b.r(G.c(214, 122, 42), 'head');
    b.r('M184 156Q214 176 246 154L248 164Q214 188 182 166Z', 'neck', 1);
    b.r('M248 104Q290 108 280 152Q268 136 248 140Z', 'beak');
    b.r(G.c(226, 112, 11), 'eye', 1);
    b.ink(G.c(228, 112, 5));
    b.r(G.e(196, 296, 12, 8), 'leg', 1).r(G.e(226, 296, 12, 8), 'leg', 1);
    b.r(G.petal(100, 296, 50, 30, 120), 'leaf').r(G.petal(300, 296, 50, 30, 60), 'leaf').r(G.petal(330, 290, 46, 28, -40), 'leaf');
  });

  pic('tortoise', 'animals', function (b) {
    b.bg(FULL).r(G.rect(0, 300, 400, 100), 'ground');
    b.r(G.e(120, 290, 22, 16), 'leg').r(G.e(290, 290, 22, 16), 'leg');
    b.r(G.poly([84, 260, 52, 270, 84, 278]), 'tail', 1);
    b.r('M330 248Q340 210 360 212Q392 214 386 248Q382 270 352 270Z', 'head');
    b.ink(G.c(368, 232, 5));
    b.r('M86 264Q96 130 210 128Q322 130 334 264Z', 'shell');
    b.r(G.poly([180, 160, 240, 160, 262, 205, 240, 250, 180, 250, 158, 205]), 'shell');
    b.r('M120 250Q118 196 150 160L180 160L158 205L180 250Z', 'shell', 1);
    b.r('M300 250Q302 196 270 160L240 160L262 205L240 250Z', 'shell', 1);
    b.r(G.rect(80, 252, 260, 24, 12), 'shell');
    b.r(G.e(150, 284, 20, 15), 'leg').r(G.e(262, 284, 20, 15), 'leg');
    b.line('M30 302l8 -14l6 14M56 300l8 -12l6 12M340 302l8 -14l6 14');
  });

  pic('owl', 'animals', function (b) {
    b.bg(FULL);
    b.r(G.c(330, 70, 34), 'moon');
    b.r(G.star(70, 60, 5, 16, 7), 'star', 1).r(G.star(130, 40, 5, 11, 5), 'star', 1);
    b.r(G.rect(30, 336, 340, 22, 11), 'branch');
    b.r(G.poly([110, 120, 120, 60, 160, 100]), 'ear').r(G.poly([290, 120, 280, 60, 240, 100]), 'ear');
    b.r(G.e(200, 230, 104, 124), 'body');
    b.r(G.e(200, 270, 66, 76), 'belly');
    b.line('M170 250q10 10 20 0q10 10 20 0q10 10 20 0M160 280q10 10 20 0q10 10 20 0q10 10 20 0q10 10 20 0M170 310q10 10 20 0q10 10 20 0q10 10 20 0');
    b.r('M100 200Q74 270 120 320Q126 260 108 200Z', 'wing').r('M300 200Q326 270 280 320Q274 260 292 200Z', 'wing');
    b.r(G.c(160, 170, 36), 'eye').r(G.c(240, 170, 36), 'eye');
    b.r(G.c(160, 172, 18), 'eye', 1).r(G.c(240, 172, 18), 'eye', 1);
    b.ink(G.c(160, 174, 8)).ink(G.c(240, 174, 8));
    b.r(G.poly([188, 200, 212, 200, 200, 226]), 'beak');
    b.r(G.e(176, 344, 14, 9), 'leg', 1).r(G.e(224, 344, 14, 9), 'leg', 1);
  });

  /* ---------- festivals ---------- */
  pic('diya', 'festivals', function (b) {
    b.bg(FULL, 'wall');
    b.r(G.e(200, 334, 168, 34), 'plate');
    b.r('M80 238Q88 322 200 326Q312 322 320 238Z', 'lamp');
    b.r(G.c(140, 286, 10), 'lamp', 1).r(G.c(200, 300, 10), 'lamp', 1).r(G.c(260, 286, 10), 'lamp', 1);
    b.r('M296 236Q344 230 362 206Q338 252 300 254Z', 'lamp');
    b.r(G.e(200, 238, 122, 20), 'oil');
    b.r('M348 206Q318 160 350 104Q388 160 362 206Q356 214 348 206Z', 'flame');
    b.r('M352 200Q338 172 354 140Q372 172 360 200Z', 'flame', 1);
    b.r(G.star(70, 110, 4, 22, 6), 'star', 1).r(G.star(120, 60, 4, 14, 4), 'star', 1).r(G.star(270, 80, 4, 16, 5), 'star', 1);
  });

  pic('rangoli', 'festivals', function (b) {
    b.bg(FULL, 'ground');
    b.r(G.c(200, 200, 176), 'ground');
    var i;
    for (i = 0; i < 8; i++) b.r(G.petal(200, 200, 168, 78, -90 + 22.5 + i * 45), 'petal');
    for (i = 0; i < 8; i++) b.r(G.petal(200, 200, 120, 70, -90 + i * 45), 'petal');
    b.r(G.c(200, 200, 52), 'petal');
    for (i = 0; i < 8; i++) b.r(G.petal(200, 200, 48, 26, -90 + i * 45), 'petal', 1);
    b.r(G.c(200, 200, 14), 'petal');
    for (i = 0; i < 8; i++) { var a = (-90 + 22.5 + i * 45) * Math.PI / 180; b.r(G.c(200 + 108 * Math.cos(a), 200 + 108 * Math.sin(a), 9), 'petal', 1); }
    b.r(G.c(32, 32, 16), 'petal', 1).r(G.c(368, 32, 16), 'petal', 1).r(G.c(32, 368, 16), 'petal', 1).r(G.c(368, 368, 16), 'petal', 1);
  });

  pic('kite', 'festivals', function (b) {
    b.bg(FULL);
    b.r(G.cloud(250, 300, 120), 'cloud').r(G.cloud(30, 40, 90), 'cloud');
    b.line('M200 318Q150 360 100 336T20 380');
    b.r('M118 336l-14 -10v20Z', 'kite', 1).r('M60 360l-14 -10v20Z', 'kite', 1);
    b.r(G.poly([200, 50, 200, 176, 104, 176]), 'kite').r(G.poly([200, 50, 296, 176, 200, 176]), 'kite');
    b.r(G.poly([104, 176, 200, 176, 200, 300]), 'kite').r(G.poly([200, 176, 296, 176, 200, 300]), 'kite');
    b.r(G.c(200, 176, 16), 'kite', 1);
    b.r(G.poly([200, 296, 176, 330, 224, 330]), 'tail');
  });

  pic('lantern', 'festivals', function (b) {
    b.bg(FULL, 'wall');
    b.line('M200 0V70');
    b.r(G.poly([200, 64, 300, 140, 100, 140]), 'roof');
    b.r(G.poly([100, 140, 166, 140, 176, 260, 116, 250]), 'lamp').r(G.poly([166, 140, 234, 140, 224, 266, 176, 266]), 'lamp');
    b.r(G.poly([234, 140, 300, 140, 284, 250, 224, 260]), 'lamp');
    b.r(G.c(200, 200, 22), 'flame', 1);
    b.r(G.poly([116, 250, 176, 266, 224, 266, 284, 250, 200, 316]), 'lamp');
    b.r(G.rect(130, 300, 16, 80, 6), 'string').r(G.rect(168, 316, 16, 74, 6), 'string').r(G.rect(216, 316, 16, 74, 6), 'string').r(G.rect(254, 300, 16, 80, 6), 'string');
    b.r(G.star(60, 80, 5, 20, 8), 'star', 1).r(G.star(340, 90, 5, 20, 8), 'star', 1).r(G.star(340, 320, 5, 16, 7), 'star', 1);
  });

  pic('xmas-star', 'festivals', function (b) {
    b.bg(FULL);
    b.line('M200 0V58');
    var cx = 200, cy = 190, ro = 140, ri = 60, i, pts = [];
    for (i = 0; i < 10; i++) { var a = (-90 + i * 36) * Math.PI / 180, r = i % 2 ? ri : ro; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    for (i = 0; i < 10; i++) { var p = pts[i], q = pts[(i + 1) % 10]; b.r(G.poly([cx, cy, p[0], p[1], q[0], q[1]]), 'star'); }
    b.r(G.c(cx, cy, 26), 'star', 1);
    b.r(G.rect(156, 318, 16, 64, 6), 'string').r(G.rect(192, 318, 16, 74, 6), 'string').r(G.rect(228, 318, 16, 64, 6), 'string');
    b.r(G.star(50, 60, 4, 18, 5), 'star', 1).r(G.star(352, 60, 4, 18, 5), 'star', 1).r(G.star(60, 340, 4, 14, 4), 'star', 1).r(G.star(344, 340, 4, 14, 4), 'star', 1);
  });

  pic('eid', 'festivals', function (b) {
    b.bg(FULL);
    b.r('M120 40A74 74 0 0 0 120 188A42 74 0 0 1 120 40Z', 'moon');
    b.r(G.star(176, 92, 5, 18, 8), 'star').r(G.star(60, 250, 5, 14, 6), 'star', 1).r(G.star(110, 330, 5, 12, 5), 'star', 1);
    b.line('M290 0V60');
    b.r('M250 110Q250 64 290 58Q330 64 330 110Z', 'roof');
    b.r(G.rect(244, 108, 92, 12, 4), 'lamp');
    b.r(G.rect(250, 120, 80, 150, 10), 'lamp');
    b.r('M262 260V160Q262 136 290 132Q318 136 318 160V260Z', 'window');
    b.r(G.c(290, 214, 14), 'flame', 1);
    b.r(G.rect(240, 270, 100, 16, 6), 'lamp');
    b.r(G.poly([254, 286, 326, 286, 300, 312, 280, 312]), 'lamp');
    b.r(G.c(290, 324, 12), 'lamp', 1);
  });

  pic('onam-boat', 'festivals', function (b) {
    b.bg(FULL);
    b.r(G.c(330, 70, 36), 'sun');
    b.r(G.rect(0, 290, 400, 110), 'water');
    b.line('M20 340q20 -12 40 0t40 0M200 370q20 -12 40 0t40 0M260 330q20 -12 40 0t40 0');
    b.r('M40 112Q30 140 50 290L60 290Q52 150 62 112Z', 'stem', 1);
    b.r(G.petal(52, 110, 50, 24, 200), 'leaf').r(G.petal(52, 110, 50, 24, -20), 'leaf').r(G.petal(52, 110, 46, 22, 250), 'leaf').r(G.petal(52, 110, 46, 22, -70), 'leaf');
    var i;
    for (i = 0; i < 5; i++) {
      var x = 120 + i * 44;
      b.r(G.rect(x - 9, 232, 18, 34, 6), 'body', 1);
      b.r(G.c(x, 222, 10), 'head', 1);
      b.line('M' + (x + 4) + ' 250L' + (x - 26) + ' 318');
    }
    b.r('M70 260Q210 296 330 250Q352 210 360 120Q372 108 380 122Q378 234 340 288Q210 326 76 290Z', 'boat');
    b.r('M90 272Q210 300 328 264L334 276Q212 312 92 284Z', 'boat', 1);
  });

  pic('laddoo', 'festivals', function (b) {
    b.bg(FULL, 'wall');
    b.r(G.e(200, 300, 172, 52), 'plate');
    b.r(G.e(200, 296, 136, 34), 'plate', 1);
    var pos = [[124, 266], [200, 270], [276, 266], [162, 206], [238, 206], [200, 146]], i;
    for (i = 0; i < pos.length; i++) {
      b.r(G.c(pos[i][0], pos[i][1], 40), 'laddoo');
      b.ink(G.c(pos[i][0] - 12, pos[i][1] - 10, 2.5)).ink(G.c(pos[i][0] + 10, pos[i][1] - 4, 2.5)).ink(G.c(pos[i][0] - 2, pos[i][1] + 14, 2.5));
    }
    G.flowerRing(b, 56, 66, 6, 22, 18, 'petal', 1);
    b.r(G.c(56, 66, 8), 'petal', 1);
    G.flowerRing(b, 344, 66, 6, 22, 18, 'petal', 1);
    b.r(G.c(344, 66, 8), 'petal', 1);
  });

  /* ---------- things and travel ---------- */
  pic('auto', 'things', function (b) {
    b.bg(FULL).r(G.rect(0, 318, 400, 82), 'ground');
    b.line('M20 360h50M110 360h50M200 360h50M290 360h50');
    b.r('M92 112Q200 66 304 112L306 132L90 132Z', 'roof');
    b.r('M80 130L312 130Q346 140 346 200L346 292L80 292Z', 'body');
    b.r(G.rect(106, 146, 150, 110, 14), 'door');
    b.r(G.rect(118, 214, 90, 22, 8), 'seat', 1);
    b.r('M292 142L330 162L336 214L292 214Z', 'window');
    b.r(G.rect(80, 262, 266, 14), 'stripe', 1);
    b.r(G.c(338, 236, 10), 'lamp', 1);
    b.r(G.c(132, 296, 34), 'wheel').r(G.c(304, 296, 34), 'wheel');
    b.r(G.c(132, 296, 13), 'wheel', 1).r(G.c(304, 296, 13), 'wheel', 1);
  });

  pic('train', 'things', function (b) {
    b.bg(FULL).r(G.rect(0, 300, 400, 100), 'ground');
    b.line('M0 330H400M0 346H400M20 330v16M60 330v16M100 330v16M140 330v16M180 330v16M220 330v16M260 330v16M300 330v16M340 330v16M380 330v16');
    b.r(G.cloud(300, 26, 90), 'cloud', 1).r(G.cloud(250, 60, 60), 'cloud', 1);
    b.r(G.rect(326, 112, 24, 50, 4), 'roof');
    b.r(G.rect(250, 104, 68, 70, 8), 'roof');
    b.r(G.rect(264, 118, 40, 34, 6), 'window');
    b.r('M250 170H360Q382 170 382 196V290H250Z', 'body');
    b.r(G.c(370, 210, 9), 'lamp', 1);
    b.r(G.rect(12, 150, 108, 140, 10), 'body').r(G.rect(130, 150, 110, 140, 10), 'body');
    b.r(G.rect(24, 168, 36, 40, 6), 'window').r(G.rect(72, 168, 36, 40, 6), 'window').r(G.rect(142, 168, 38, 40, 6), 'window').r(G.rect(190, 168, 38, 40, 6), 'window');
    b.r(G.rect(12, 234, 228, 16), 'stripe', 1);
    var wx = [40, 92, 158, 212, 276, 340], i;
    for (i = 0; i < wx.length; i++) b.r(G.c(wx[i], 300, 22), 'wheel');
    b.line('M120 274H130M240 274H250');
  });

  pic('rocket', 'things', function (b) {
    b.bg(FULL);
    b.r(G.c(330, 80, 34), 'moon');
    b.r('M282 80Q330 60 380 84Q330 104 282 80Z', 'moon', 1);
    b.r(G.star(60, 60, 5, 16, 7), 'star', 1).r(G.star(90, 200, 5, 12, 5), 'star', 1).r(G.star(330, 230, 5, 14, 6), 'star', 1).r(G.star(40, 320, 5, 12, 5), 'star', 1);
    b.r('M160 300Q170 362 200 390Q230 362 240 300Z', 'flame');
    b.r('M178 300Q184 344 200 364Q216 344 222 300Z', 'flame', 1);
    b.r(G.poly([152, 220, 106, 290, 106, 330, 152, 300]), 'fin').r(G.poly([248, 220, 294, 290, 294, 330, 248, 300]), 'fin');
    b.r('M200 50Q252 104 252 230L252 306L148 306L148 230Q148 104 200 50Z', 'body');
    b.r('M200 50Q236 84 245 126L155 126Q164 84 200 50Z', 'roof');
    b.r(G.c(200, 184, 28), 'window');
    b.r(G.c(200, 184, 16), 'window', 1);
    b.r(G.rect(176, 240, 48, 60, 6), 'door', 1);
  });

  pic('school-bag', 'things', function (b) {
    b.bg(FULL, 'wall');
    b.r('M156 120Q156 58 200 58Q244 58 244 120L228 120Q228 76 200 76Q172 76 172 120Z', 'string');
    b.r(G.rect(80, 150, 30, 160, 12), 'string').r(G.rect(290, 150, 30, 160, 12), 'string');
    b.r(G.rect(100, 108, 200, 252, 44), 'bag');
    b.r('M100 180Q200 210 300 180L300 196Q200 226 100 196Z', 'stripe', 1);
    b.r(G.rect(128, 232, 144, 104, 22), 'pocket');
    b.r('M128 258Q128 232 150 232H250Q272 232 272 258Q200 280 128 258Z', 'pocket', 1);
    b.line('M150 150H250');
    b.r(G.star(200, 300, 5, 18, 8), 'star', 1);
    b.r(G.c(250, 150, 8), 'lamp', 1);
  });

  pic('cricket', 'things', function (b) {
    b.bg(FULL).r(G.rect(0, 300, 400, 100), 'ground');
    b.r(G.rect(260, 150, 12, 170, 4), 'stump').r(G.rect(296, 150, 12, 170, 4), 'stump').r(G.rect(332, 150, 12, 170, 4), 'stump');
    b.r(G.rect(256, 140, 50, 10, 4), 'stump', 1).r(G.rect(300, 140, 48, 10, 4), 'stump', 1);
    b.r(G.poly(G.rot([86, 40, 108, 40, 108, 120, 86, 120], 97, 200, -30)), 'bat');
    b.r(G.poly(G.rot([70, 120, 124, 120, 128, 330, 66, 330], 97, 200, -30)), 'bat');
    b.r(G.poly(G.rot([84, 160, 110, 160, 112, 300, 82, 300], 97, 200, -30)), 'bat', 1);
    b.r(G.c(206, 300, 38), 'ball');
    b.line('M180 274Q206 300 180 326M232 274Q206 300 232 326');
  });

  pic('school-bus', 'things', function (b) {
    b.bg(FULL).r(G.rect(0, 300, 400, 100), 'ground');
    b.r(G.c(60, 60, 30), 'sun');
    b.r(G.rect(24, 120, 352, 170, 26), 'body');
    b.r(G.rect(24, 236, 352, 18), 'stripe', 1);
    var i;
    for (i = 0; i < 4; i++) b.r(G.rect(44 + i * 64, 140, 52, 56, 8), 'window');
    b.r(G.rect(308, 140, 50, 140, 8), 'door');
    b.r(G.rect(316, 150, 34, 50, 6), 'window', 1);
    b.r(G.c(366, 266, 8), 'lamp', 1);
    b.r(G.c(96, 292, 32), 'wheel').r(G.c(288, 292, 32), 'wheel');
    b.r(G.c(96, 292, 12), 'wheel', 1).r(G.c(288, 292, 12), 'wheel', 1);
  });

  pic('dome', 'things', function (b) {
    b.bg(FULL);
    b.r(G.rect(0, 330, 400, 70), 'ground');
    b.r(G.rect(150, 330, 100, 70), 'water');
    b.r(G.rect(40, 150, 26, 180, 4), 'wall').r(G.rect(334, 150, 26, 180, 4), 'wall');
    b.r('M36 150Q53 110 70 150Z', 'roof').r('M330 150Q347 110 364 150Z', 'roof');
    b.r(G.rect(80, 200, 240, 130), 'wall');
    b.r('M110 200Q110 170 135 160Q160 170 160 200Z', 'roof', 1).r('M240 200Q240 170 265 160Q290 170 290 200Z', 'roof', 1);
    b.r('M134 202Q114 140 200 80Q286 140 266 202Z', 'roof');
    b.line('M200 80V52');
    b.r(G.c(200, 48, 7), 'roof', 1);
    b.r('M168 330V262Q168 230 200 222Q232 230 232 262V330Z', 'door');
    b.r('M98 300V258Q98 240 116 236Q134 240 134 258V300Z', 'window', 1).r('M266 300V258Q266 240 284 236Q302 240 302 258V300Z', 'window', 1);
  });

  pic('hut', 'things', function (b) {
    b.bg(FULL).r(G.rect(0, 320, 400, 80), 'ground');
    b.r(G.c(330, 64, 32), 'sun');
    b.r(G.rect(308, 210, 22, 112, 6), 'stem');
    b.r(G.c(320, 190, 52), 'leaf');
    b.r(G.rect(80, 200, 210, 130), 'wall');
    b.r('M56 214Q120 120 186 92Q250 120 316 214Z', 'roof');
    b.line('M110 180L150 140M150 190L186 130M200 186L220 136M244 186L250 160');
    b.r('M150 330V270Q150 248 176 246Q202 248 202 270V330Z', 'door');
    b.r(G.rect(224, 240, 46, 40, 6), 'window');
    b.r(G.rect(14, 286, 60, 12, 3), 'wall', 1).r(G.rect(14, 306, 60, 12, 3), 'wall', 1);
    b.line('M24 270V330M44 270V330M64 270V330');
  });

  pic('umbrella', 'things', function (b) {
    b.bg(FULL);
    b.r(G.cloud(20, 10, 130), 'cloud').r(G.cloud(250, 0, 140), 'cloud');
    b.r('M196 196V318Q196 352 226 352Q252 352 252 324L238 324Q238 338 226 338Q212 338 212 318V196Z', 'string');
    b.r('M60 200Q66 100 200 84L120 200Q90 184 60 200Z', 'roof').r('M120 200L200 84L200 200Q160 184 120 200Z', 'roof');
    b.r('M200 200L200 84L280 200Q240 184 200 200Z', 'roof').r('M280 200L200 84Q334 100 340 200Q310 184 280 200Z', 'roof');
    b.line('M200 84V70');
    b.r(G.petal(60, 230, 26, 14, 90), 'water', 1).r(G.petal(90, 290, 26, 14, 90), 'water', 1).r(G.petal(320, 240, 26, 14, 90), 'water', 1).r(G.petal(300, 310, 26, 14, 90), 'water', 1);
    b.r(G.e(200, 376, 150, 18), 'water');
  });

  /* ---------- nature and food ---------- */
  pic('mango', 'nature', function (b) {
    b.bg(FULL);
    b.r(G.rect(40, 50, 320, 18, 9), 'branch');
    b.r(G.petal(130, 60, 110, 46, 160), 'leaf').r(G.petal(270, 60, 110, 46, 20), 'leaf').r(G.petal(200, 60, 90, 40, -60), 'leaf');
    b.r(G.rect(144, 64, 10, 40, 4), 'stem').r(G.rect(246, 64, 10, 52, 4), 'stem');
    b.r('M150 100Q90 110 86 190Q84 290 160 300Q226 300 222 220Q218 140 150 100Z', 'mango');
    b.r('M250 112Q200 120 196 200Q196 300 264 310Q330 306 322 220Q316 140 250 112Z', 'mango');
    b.r(G.e(116, 160, 12, 22), 'mango', 1);
  });

  pic('lotus', 'nature', function (b) {
    b.bg(FULL);
    b.r(G.rect(0, 280, 400, 120), 'water');
    b.r('M40 330A60 22 0 1 0 160 330L100 330Z', 'leaf').r('M260 350A70 24 0 1 0 380 350L320 350Z', 'leaf');
    b.r(G.rect(194, 270, 12, 60, 4), 'stem');
    b.r(G.petal(200, 270, 120, 70, 200), 'petal').r(G.petal(200, 270, 120, 70, -20), 'petal');
    b.r(G.petal(200, 272, 150, 80, 235), 'petal').r(G.petal(200, 272, 150, 80, -55), 'petal');
    b.r(G.petal(200, 274, 170, 80, -90), 'petal');
    b.line('M30 300q20 -10 40 0M300 300q20 -10 40 0M180 380q20 -10 40 0');
  });

  pic('sun-clouds', 'nature', function (b) {
    b.bg(FULL);
    var i;
    for (i = 0; i < 10; i++) { var a = i * 36; b.r(G.petal(200, 170, 150, 30, a), 'sun'); }
    b.r(G.c(200, 170, 76), 'sun');
    b.ink(G.c(176, 156, 7)).ink(G.c(224, 156, 7));
    b.line('M172 190Q200 216 228 190');
    b.r(G.cloud(20, 250, 180), 'cloud').r(G.cloud(200, 270, 190), 'cloud');
    b.line('M50 60q12 -12 24 0q12 -12 24 0M300 50q10 -10 20 0q10 -10 20 0');
  });

  pic('chai', 'nature', function (b) {
    b.bg(FULL, 'wall');
    b.line('M170 140Q154 112 170 88T170 40M206 140Q190 112 206 88T206 40M242 140Q226 112 242 88T242 40');
    b.r(G.e(200, 316, 170, 40), 'plate');
    b.r('M300 190Q356 190 352 238Q348 280 292 276L294 258Q332 260 334 236Q336 208 300 210Z', 'cup');
    b.r('M100 160H300L286 284Q282 306 258 306H142Q118 306 114 284Z', 'cup');
    b.r(G.e(200, 160, 100, 16), 'tea');
    b.r('M112 220Q200 240 294 220L292 236Q200 256 114 236Z', 'stripe', 1);
    b.r(G.c(60, 340, 34), 'biscuit').r(G.c(340, 350, 30), 'biscuit', 1);
    b.ink(G.c(50, 330, 3)).ink(G.c(70, 344, 3)).ink(G.c(56, 354, 3)).ink(G.c(334, 344, 3)).ink(G.c(348, 358, 3));
  });

  pic('flower-pot', 'nature', function (b) {
    b.bg(FULL, 'wall');
    b.line('M200 250V150M200 230Q160 200 130 150M200 230Q240 200 270 150');
    b.r(G.petal(200, 220, 50, 30, 210), 'leaf').r(G.petal(200, 210, 50, 30, -30), 'leaf');
    var fl = [[130, 140], [200, 120], [270, 140]], i;
    for (i = 0; i < 3; i++) { G.flowerRing(b, fl[i][0], fl[i][1], 6, 38, 32, 'petal'); b.r(G.c(fl[i][0], fl[i][1], 14), 'petal', 1); }
    b.r(G.rect(110, 250, 180, 30, 8), 'pot');
    b.r(G.poly([124, 280, 276, 280, 252, 380, 148, 380]), 'pot');
    b.r(G.heart(200, 324, 40), 'pot', 1);
  });

  pic('kulfi', 'nature', function (b) {
    b.bg(FULL);
    b.r(G.rect(188, 290, 24, 90, 8), 'stick');
    b.r('M140 120Q140 70 200 70Q260 70 260 120L252 290Q252 306 236 306H164Q148 306 148 290Z', 'kulfi');
    b.r('M141 150Q200 176 259 150L257 190Q228 210 214 190Q200 214 186 190Q170 210 143 190Z', 'kulfi');
    b.r(G.c(176, 240, 7), 'kulfi', 1).r(G.c(222, 256, 7), 'kulfi', 1).r(G.c(196, 276, 6), 'kulfi', 1);
    b.r(G.star(70, 90, 5, 22, 9), 'star', 1).r(G.star(330, 120, 5, 22, 9), 'star', 1).r(G.heart(320, 300, 50), 'star', 1).r(G.heart(80, 310, 46), 'star', 1);
  });

  /* ------------------------------------------------------------ letters and numbers */
  var FONT = 'Noto Sans, Noto Sans Devanagari, Noto Sans Bengali, Noto Sans Gurmukhi, Noto Sans Gujarati, Noto Sans Oriya, Noto Sans Tamil, Noto Sans Telugu, Noto Sans Kannada, Noto Sans Malayalam, Noto Naskh Arabic, Nirmala UI, Arial, sans-serif';
  function corners(b, kind) {
    var pos = [[40, 40], [360, 40], [40, 360], [360, 360]], i;
    for (i = 0; i < 4; i++) {
      if (kind === 0) b.r(G.star(pos[i][0], pos[i][1], 5, 28, 12), 'star');
      else if (kind === 1) b.r(G.heart(pos[i][0], pos[i][1] + 4, 52), 'star');
      else { G.flowerRing(b, pos[i][0], pos[i][1], 5, 28, 26, 'petal'); b.r(G.c(pos[i][0], pos[i][1], 9), 'petal', 1); }
    }
  }
  function letterPage(ch, small, kind) {
    return function (b) {
      b.bg(FULL);
      corners(b, kind);
      b.text(small ? 178 : 200, small ? 290 : 300, ch, small ? 270 : 290, 'letter');
      if (small) b.text(304, 340, small, 110, 'letter');
    };
  }
  function balloon(b, x, y, r) { b.line('M' + x + ' ' + (y + r) + 'q-6 14 0 26'); b.r(G.e(x, y, r * 0.85, r), 'balloon'); }
  function numberPage(n) {
    return function (b) {
      b.bg(FULL);
      b.text(200, 220, String(n), 220, 'number');
      if (!n) { b.r('M110 300Q200 400 290 300Z', 'plate'); b.r(G.e(200, 300, 90, 14), 'plate', 1); return; }
      var rows = n > 5 ? 2 : 1, perRow = Math.ceil(n / rows), i, r = n > 5 ? 22 : 28;
      for (i = 0; i < n; i++) {
        var row = Math.floor(i / perRow), inRow = row === rows - 1 ? n - perRow * (rows - 1) : perRow, col = i - row * perRow;
        var gap = 360 / inRow, x = 20 + gap * (col + 0.5), y = rows === 1 ? 300 : 272 + row * 64;
        var kind = n <= 5 ? n % 3 : 2 + n % 2;
        if (kind === 1) balloon(b, x, y - 6, r);
        else if (kind === 2 || kind === 0 && n > 5) b.r(G.star(x, y, 5, r + 4, (r + 4) * 0.45), 'star');
        else { G.flowerRing(b, x, y, 5, r, r * 0.9, 'petal'); b.r(G.c(x, y, r * 0.3), 'petal', 1); }
      }
    };
  }

  var CATS = ['animals', 'festivals', 'things', 'nature', 'letters', 'numbers', 'script'];

  /* letters: the current language's own first letters (from content.js) */
  function list(lang, letters) {
    var out = PICS.slice(), i, A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (i = 0; i < 26; i++) out.push({ id: 'abc-' + A[i], cat: 'letters', letter: A[i], draw: letterPage(A[i], A[i].toLowerCase(), i % 3) });
    for (i = 0; i <= 9; i++) out.push({ id: 'num-' + i, cat: 'numbers', num: i, draw: numberPage(i) });
    (letters || []).forEach(function (ch, j) { out.push({ id: 'sc-' + lang + '-' + j, cat: 'script', letter: ch, draw: letterPage(ch, '', j % 3) }); });
    return out;
  }

  /* compile a page into items with region ids r0, r1, ... */
  function build(pg) {
    if (pg.items) return pg.items;
    var b = new Builder(); pg.draw(b);
    var n = 0;
    b.items.forEach(function (it) { if (it.k === 'r') it.id = 'r' + (n++); });
    pg.items = b.items;
    return pg.items;
  }

  window.CB_PAGES = { G: G, list: list, build: build, CATS: CATS, FONT: FONT, Builder: Builder };
})();
