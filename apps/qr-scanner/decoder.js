/* Pure-JS barcode reader for the QR & Barcode Scanner app. No library, works offline and from file://.
 * Written from the public standards: QR Code (ISO/IEC 18004), EAN/UPC (GS1 General Specifications),
 * Code 128 (ISO/IEC 15417). Used when the browser has no native BarcodeDetector (Firefox, iOS Safari, desktop).
 *
 *   QRDecode.decodeQR(imageData)  -> { format:'qr_code', text, version, ecl, mask, corrected } | null
 *   QRDecode.decode1D(imageData)  -> { format:'ean_13'|'ean_8'|'upc_a'|'code_128', text } | null
 *   QRDecode.scan(imageData, {qr:true, oneD:true}) -> first result or null
 * imageData = { data: RGBA Uint8ClampedArray, width, height } (a canvas ImageData works).
 *
 * QR pipeline: grayscale -> adaptive threshold -> finder patterns (1:1:3:1:1 runs, cross-checked)
 * -> best right-angle triple -> alignment pattern -> perspective grid sampling -> format + version info (BCH)
 * -> unmask + zigzag read -> de-interleave -> Reed-Solomon correction -> segments (numeric, alphanumeric,
 * byte UTF-8 / ECI, kanji via Shift_JIS when the browser can decode it).
 */
(function (root) {
  'use strict';

  /* ================= GF(256) and Reed-Solomon (polynomial 0x11D, roots a^0..a^(n-1)) ================= */
  var EXP = new Uint8Array(512), LOG = new Uint8Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11D; }
    for (i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();
  function gmul(a, b) { return a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]; }
  function gdiv(a, b) { return a === 0 ? 0 : EXP[(LOG[a] + 255 - LOG[b]) % 255]; }
  /* evaluate polynomial with coefficients low->high at x */
  function polyEvalLow(p, x) { var r = 0; for (var i = p.length - 1; i >= 0; i--) r = gmul(r, x) ^ p[i]; return r; }

  /* Corrects `block` (array, highest power first) in place. Returns number of fixed errors, or -1. */
  function rsDecode(block, nsym) {
    var n = block.length, S = [], j, i, any = false;
    for (j = 0; j < nsym; j++) {
      var s = 0, a = EXP[j];
      for (i = 0; i < n; i++) s = gmul(s, a) ^ block[i];
      S.push(s); if (s) any = true;
    }
    if (!any) return 0;
    /* Berlekamp-Massey */
    var C = [1], B = [1], L = 0, m = 1, b = 1;
    for (var k = 0; k < nsym; k++) {
      var d = S[k];
      for (i = 1; i <= L; i++) d ^= gmul(C[i] || 0, S[k - i]);
      if (d === 0) { m++; continue; }
      var coef = gdiv(d, b), T = C.slice(), len = Math.max(C.length, B.length + m), NC = [];
      for (i = 0; i < len; i++) NC.push(C[i] || 0);
      for (i = 0; i < B.length; i++) NC[i + m] ^= gmul(coef, B[i]);
      if (2 * L <= k) { L = k + 1 - L; B = T; b = d; m = 1; } else m++;
      C = NC;
    }
    while (C.length > 1 && C[C.length - 1] === 0) C.pop();
    if (C.length - 1 !== L || 2 * L > nsym) return -1;
    /* Chien search: codeword index i has power p = n-1-i, locator X = a^p */
    var pos = [];
    for (i = 0; i < n; i++) {
      var p = n - 1 - i;
      if (polyEvalLow(C, EXP[(255 - p % 255) % 255]) === 0) pos.push(i);
    }
    if (pos.length !== L) return -1;
    /* Forney: Omega = S(x) * Lambda(x) mod x^nsym; e = X * Omega(X^-1) / Lambda'(X^-1) */
    var Om = [];
    for (i = 0; i < nsym; i++) {
      var v = 0;
      for (j = 0; j <= i; j++) if (j < C.length) v ^= gmul(C[j], S[i - j]);
      Om.push(v);
    }
    var D = [];                                              // formal derivative of Lambda
    for (i = 1; i < C.length; i++) D.push(i & 1 ? C[i] : 0);
    for (k = 0; k < pos.length; k++) {
      var pw = n - 1 - pos[k], X = EXP[pw % 255], Xinv = EXP[(255 - pw % 255) % 255];
      var den = polyEvalLow(D, Xinv);
      if (den === 0) return -1;
      block[pos[k]] ^= gmul(X, gdiv(polyEvalLow(Om, Xinv), den));
    }
    /* re-check */
    for (j = 0; j < nsym; j++) {
      var s2 = 0, a2 = EXP[j];
      for (i = 0; i < n; i++) s2 = gmul(s2, a2) ^ block[i];
      if (s2) return -1;
    }
    return L;
  }

  /* ================= QR tables (ISO/IEC 18004 Table 9) ================= */
  var ECC_PER_BLOCK = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
  ];
  var NUM_BLOCKS = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
  ];
  var ECL_NAMES = ['L', 'M', 'Q', 'H'];
  var FORMAT_TO_ECL = { 1: 0, 0: 1, 3: 2, 2: 3 };            // 2 format bits -> L M Q H index

  function numRawDataModules(ver) {
    var r = (16 * ver + 128) * ver + 64;
    if (ver >= 2) { var na = Math.floor(ver / 7) + 2; r -= (25 * na - 10) * na - 55; if (ver >= 7) r -= 36; }
    return r;
  }
  function alignmentPositions(ver) {
    if (ver === 1) return [];
    var size = ver * 4 + 17, na = Math.floor(ver / 7) + 2;
    var step = Math.floor((ver * 8 + na * 3 + 5) / (na * 4 - 4)) * 2, res = [6];
    for (var p = size - 7; res.length < na; p -= step) res.splice(1, 0, p);
    return res;
  }
  var VALID_FORMATS = (function () {
    var out = [];
    for (var e = 0; e < 4; e++) for (var mk = 0; mk < 8; mk++) {
      var data = e << 3 | mk, rem = data;
      for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      out.push({ bits: (data << 10 | rem) ^ 0x5412, fecl: e, mask: mk });
    }
    return out;
  })();
  var VALID_VERSIONS = (function () {
    var out = [];
    for (var v = 7; v <= 40; v++) {
      var rem = v;
      for (var i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      out.push({ bits: v << 12 | rem, ver: v });
    }
    return out;
  })();
  function popcount(x) { var c = 0; while (x) { c += x & 1; x >>>= 1; } return c; }

  var fnCache = {};
  function functionMask(ver) {
    if (fnCache[ver]) return fnCache[ver];
    var size = ver * 4 + 17, m = new Uint8Array(size * size), i, x, y;
    function set(xx, yy) { if (xx >= 0 && yy >= 0 && xx < size && yy < size) m[yy * size + xx] = 1; }
    for (i = 0; i < size; i++) { set(6, i); set(i, 6); }
    [[0, 0], [size - 8, 0], [0, size - 8]].forEach(function (c) { for (y = 0; y < 8; y++) for (x = 0; x < 8; x++) set(c[0] + x, c[1] + y); });
    var pos = alignmentPositions(ver), n = pos.length, a, b;
    for (a = 0; a < n; a++) for (b = 0; b < n; b++) {
      if (a === 0 && b === 0 || a === 0 && b === n - 1 || a === n - 1 && b === 0) continue;
      for (y = -2; y <= 2; y++) for (x = -2; x <= 2; x++) set(pos[a] + x, pos[b] + y);
    }
    for (i = 0; i < 9; i++) { set(8, i); set(i, 8); }
    for (i = 0; i < 8; i++) { set(size - 1 - i, 8); set(8, size - 1 - i); }
    if (ver >= 7) for (i = 0; i < 18; i++) { set(size - 11 + i % 3, Math.floor(i / 3)); set(Math.floor(i / 3), size - 11 + i % 3); }
    fnCache[ver] = m;
    return m;
  }
  function maskBit(mask, x, y) {
    switch (mask) {
      case 0: return (x + y) % 2 === 0;
      case 1: return y % 2 === 0;
      case 2: return x % 3 === 0;
      case 3: return (x + y) % 3 === 0;
      case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
      case 5: return x * y % 2 + x * y % 3 === 0;
      case 6: return (x * y % 2 + x * y % 3) % 2 === 0;
      default: return ((x + y) % 2 + x * y % 3) % 2 === 0;
    }
  }

  /* ================= image -> bits ================= */
  function toGray(img) {
    var w = img.width, h = img.height, d = img.data, g = new Uint8Array(w * h);
    for (var i = 0, j = 0; i < g.length; i++, j += 4) {
      // transparent pixels count as white (PNG screenshots with alpha)
      var a = d[j + 3];
      var v = (d[j] * 77 + d[j + 1] * 150 + d[j + 2] * 29) >> 8;
      g[i] = a === 255 ? v : 255 - ((255 - v) * a / 255);
    }
    return g;
  }
  /* local-average threshold in 8x8 blocks, smoothed over 5x5 blocks (handles shadows and glare) */
  function binarizeAdaptive(g, w, h) {
    var B = 8, bw = Math.ceil(w / B), bh = Math.ceil(h / B), avg = new Float32Array(bw * bh), out = new Uint8Array(w * h);
    var bx, by, x, y;
    for (by = 0; by < bh; by++) for (bx = 0; bx < bw; bx++) {
      var mn = 255, mx = 0, sum = 0, cnt = 0;
      for (y = by * B; y < Math.min(h, by * B + B); y++) for (x = bx * B; x < Math.min(w, bx * B + B); x++) {
        var v = g[y * w + x]; sum += v; cnt++; if (v < mn) mn = v; if (v > mx) mx = v;
      }
      var a = sum / cnt;
      if (mx - mn <= 24) {
        a = mn / 2;
        if (by > 0 && bx > 0) {
          var nb = (avg[(by - 1) * bw + bx] + 2 * avg[by * bw + bx - 1] + avg[(by - 1) * bw + bx - 1]) / 4;
          if (mn < nb) a = nb;
        }
      }
      avg[by * bw + bx] = a;
    }
    for (by = 0; by < bh; by++) for (bx = 0; bx < bw; bx++) {
      var s = 0, c = 0;
      for (var yy = Math.max(0, by - 2); yy <= Math.min(bh - 1, by + 2); yy++) for (var xx = Math.max(0, bx - 2); xx <= Math.min(bw - 1, bx + 2); xx++) { s += avg[yy * bw + xx]; c++; }
      var th = s / c;
      for (y = by * B; y < Math.min(h, by * B + B); y++) for (x = bx * B; x < Math.min(w, bx * B + B); x++) out[y * w + x] = g[y * w + x] <= th ? 1 : 0;
    }
    return out;
  }
  function binarizeOtsu(g) {
    var hist = new Array(256).fill(0), i, n = g.length;
    for (i = 0; i < n; i++) hist[g[i]]++;
    var sum = 0; for (i = 0; i < 256; i++) sum += i * hist[i];
    var sB = 0, wB = 0, best = 0, th = 127;
    for (i = 0; i < 256; i++) {
      wB += hist[i]; if (!wB) continue;
      var wF = n - wB; if (!wF) break;
      sB += i * hist[i];
      var mB = sB / wB, mF = (sum - sB) / wF, between = wB * wF * (mB - mF) * (mB - mF);
      if (between > best) { best = between; th = i; }
    }
    var out = new Uint8Array(n);
    for (i = 0; i < n; i++) out[i] = g[i] <= th ? 1 : 0;
    return out;
  }

  /* ================= finder patterns ================= */
  function ratioOK(sc, tol) {
    var total = sc[0] + sc[1] + sc[2] + sc[3] + sc[4];
    if (total < 7) return false;
    var m = total / 7, v = m * tol;
    return Math.abs(m - sc[0]) < v && Math.abs(m - sc[1]) < v && Math.abs(3 * m - sc[2]) < 3 * v && Math.abs(m - sc[3]) < v && Math.abs(m - sc[4]) < v;
  }
  function findFinders(bits, w, h) {
    var centers = [];
    function at(x, y) { return bits[y * w + x]; }
    function crossCheck(cx, cy, dx, dy, maxCount, origTotal) {
      // walk from (cx,cy) along +/-(dx,dy) counting dark/light/dark runs
      var sc = [0, 0, 0, 0, 0], x = cx, y = cy;
      function inb(px, py) { return px >= 0 && py >= 0 && px < w && py < h; }
      while (inb(x, y) && at(x, y)) { sc[2]++; x -= dx; y -= dy; }
      if (!inb(x, y)) return NaN;
      while (inb(x, y) && !at(x, y) && sc[1] <= maxCount) { sc[1]++; x -= dx; y -= dy; }
      if (!inb(x, y) || sc[1] > maxCount) return NaN;
      while (inb(x, y) && at(x, y) && sc[0] <= maxCount) { sc[0]++; x -= dx; y -= dy; }
      if (sc[0] > maxCount) return NaN;
      x = cx + dx; y = cy + dy;
      while (inb(x, y) && at(x, y)) { sc[2]++; x += dx; y += dy; }
      if (!inb(x, y)) return NaN;
      while (inb(x, y) && !at(x, y) && sc[3] < maxCount) { sc[3]++; x += dx; y += dy; }
      if (!inb(x, y) || sc[3] >= maxCount) return NaN;
      while (inb(x, y) && at(x, y) && sc[4] < maxCount) { sc[4]++; x += dx; y += dy; }
      if (sc[4] >= maxCount) return NaN;
      var total = sc[0] + sc[1] + sc[2] + sc[3] + sc[4];
      if (5 * Math.abs(total - origTotal) >= 2 * origTotal) return NaN;
      if (!ratioOK(sc, 0.6)) return NaN;
      // offset of the centre from the start point along the walk direction
      var end = (dx ? x : y) - (dx || dy) * (sc[4] + sc[3]);
      return { c: end - (dx || dy) * sc[2] / 2, total: total };
    }
    function handle(sc, row, endX) {
      var total = sc[0] + sc[1] + sc[2] + sc[3] + sc[4];
      var cx = Math.floor(endX - sc[4] - sc[3] - sc[2] / 2);
      var v = crossCheck(cx, row, 0, 1, sc[2] * 2, total);
      if (!v) return false;
      var cy = Math.floor(v.c);
      var hz = crossCheck(cx, cy, 1, 0, sc[2] * 2, total);
      if (!hz) return false;
      var fx = hz.c, fy = v.c, ms = (hz.total + v.total) / 14;
      for (var i = 0; i < centers.length; i++) {
        var c = centers[i];
        if (Math.abs(fy - c.y) <= ms && Math.abs(fx - c.x) <= ms && Math.abs(ms - c.ms) <= Math.max(1, c.ms)) {
          var n = c.count;
          c.x = (c.x * n + fx) / (n + 1); c.y = (c.y * n + fy) / (n + 1); c.ms = (c.ms * n + ms) / (n + 1); c.count++;
          return true;
        }
      }
      centers.push({ x: fx, y: fy, ms: ms, count: 1 });
      return true;
    }
    var step = h > 700 ? 2 : 1;
    for (var y = 0; y < h; y += step) {
      var sc = [0, 0, 0, 0, 0], st = 0;
      for (var x = 0; x < w; x++) {
        if (bits[y * w + x]) {
          if (st & 1) st++;
          sc[st]++;
        } else if (!(st & 1)) {
          if (st === 4) {
            if (ratioOK(sc, 0.5) && handle(sc, y, x)) { sc = [0, 0, 0, 0, 0]; st = 0; }
            else { sc = [sc[2], sc[3], sc[4], 1, 0]; st = 3; }
          } else sc[++st]++;
        } else sc[st]++;
      }
      if (st === 4 && ratioOK(sc, 0.5)) handle(sc, y, w);
    }
    return centers;
  }
  function dist(a, b) { return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y)); }
  /* rank triples of centres by how close they are to a right isosceles triangle with equal module sizes */
  function rankTriples(cs) {
    cs = cs.filter(function (c) { return c.count >= 1; }).sort(function (a, b) { return b.count - a.count; }).slice(0, 12);
    var out = [];
    for (var i = 0; i < cs.length; i++) for (var j = i + 1; j < cs.length; j++) for (var k = j + 1; k < cs.length; k++) {
      var p = [cs[i], cs[j], cs[k]];
      var msAvg = (p[0].ms + p[1].ms + p[2].ms) / 3, msVar = 0;
      p.forEach(function (q) { msVar += Math.abs(q.ms - msAvg) / msAvg; });
      if (msVar > 0.9) continue;
      var d01 = dist(p[0], p[1]), d02 = dist(p[0], p[2]), d12 = dist(p[1], p[2]);
      var tl, a, b, hyp, l1, l2;
      if (d12 >= d01 && d12 >= d02) { tl = p[0]; a = p[1]; b = p[2]; hyp = d12; l1 = d01; l2 = d02; }
      else if (d02 >= d01 && d02 >= d12) { tl = p[1]; a = p[0]; b = p[2]; hyp = d02; l1 = d01; l2 = d12; }
      else { tl = p[2]; a = p[0]; b = p[1]; hyp = d01; l1 = d02; l2 = d12; }
      if (l1 < msAvg * 10 || l2 < msAvg * 10) continue;     // smallest QR: 14 modules between centres
      var score = Math.abs(l1 - l2) / Math.max(l1, l2) + Math.abs(hyp - Math.sqrt(l1 * l1 + l2 * l2)) / hyp + msVar * 0.5 +
        0.3 / Math.min(p[0].count, p[1].count, p[2].count);
      if (score > 0.6) continue;
      // orientation: TR x BL cross product positive in image coordinates (y down)
      var cross = (a.x - tl.x) * (b.y - tl.y) - (a.y - tl.y) * (b.x - tl.x);
      var tr = cross > 0 ? a : b, bl = cross > 0 ? b : a;
      out.push({ tl: tl, tr: tr, bl: bl, ms: msAvg, score: score });
    }
    out.sort(function (x, y) { return x.score - y.score; });
    return out.slice(0, 6);
  }

  /* ================= perspective ================= */
  function squareToQuad(p) {
    var x0 = p[0], y0 = p[1], x1 = p[2], y1 = p[3], x2 = p[4], y2 = p[5], x3 = p[6], y3 = p[7];
    var dx3 = x0 - x1 + x2 - x3, dy3 = y0 - y1 + y2 - y3;
    var dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, den = dx1 * dy2 - dx2 * dy1;
    var a13 = (dx3 * dy2 - dx2 * dy3) / den, a23 = (dx1 * dy3 - dx3 * dy1) / den;
    return [x1 - x0 + a13 * x1, x3 - x0 + a23 * x3, x0,
            y1 - y0 + a13 * y1, y3 - y0 + a23 * y3, y0,
            a13, a23, 1];                                        // row-major: [a b c; d e f; g h i]
  }
  function adjoint(m) {
    return [m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4],
            m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5],
            m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3]];
  }
  function mul(a, b) {
    var r = [];
    for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) r.push(a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j]);
    return r;
  }
  /* maps src quad (module coordinates) to dst quad (image pixels) */
  function quadToQuad(src, dst) { return mul(squareToQuad(dst), adjoint(squareToQuad(src))); }
  function apply(m, x, y) {
    var d = m[6] * x + m[7] * y + m[8];
    return [(m[0] * x + m[1] * y + m[2]) / d, (m[3] * x + m[4] * y + m[5]) / d];
  }

  /* alignment pattern search near the expected position, using the code's own axes (handles rotation) */
  function findAlignment(bits, w, h, est, ux, uy, vx, vy, ms) {
    var best = -1, bx = 0, by = 0, R = Math.max(4, Math.round(ms * 7));
    var offs = [];
    for (var j = -2; j <= 2; j++) for (var i = -2; i <= 2; i++) offs.push([i * ux + j * vx, i * uy + j * vy, Math.max(Math.abs(i), Math.abs(j)) !== 1 ? 1 : 0]);
    var step = ms > 6 ? 2 : 1;
    for (var y = Math.round(est[1] - R); y <= est[1] + R; y += step) for (var x = Math.round(est[0] - R); x <= est[0] + R; x += step) {
      var sc = 0;
      for (var k = 0; k < 25; k++) {
        var px = Math.round(x + offs[k][0]), py = Math.round(y + offs[k][1]);
        var b = px >= 0 && py >= 0 && px < w && py < h ? bits[py * w + px] : 0;
        if (b === offs[k][2]) sc++;
      }
      // prefer candidates close to the estimate when scores tie
      var s2 = sc - Math.sqrt((x - est[0]) * (x - est[0]) + (y - est[1]) * (y - est[1])) / (R * 4);
      if (s2 > best) { best = s2; bx = x; by = y; }
    }
    if (best < 22) return null;
    // refine to the centroid of the dark centre module
    var sx = 0, sy = 0, n = 0, r = Math.max(1, Math.floor(ms / 2));
    for (y = by - r; y <= by + r; y++) for (x = bx - r; x <= bx + r; x++) if (x >= 0 && y >= 0 && x < w && y < h && bits[y * w + x]) { sx += x; sy += y; n++; }
    return n ? [sx / n, sy / n] : [bx, by];
  }

  function sampleGrid(bits, w, h, T, dim) {
    var m = new Uint8Array(dim * dim);
    for (var y = 0; y < dim; y++) for (var x = 0; x < dim; x++) {
      var p = apply(T, x + 0.5, y + 0.5), px = Math.floor(p[0]), py = Math.floor(p[1]);
      m[y * dim + x] = px >= 0 && py >= 0 && px < w && py < h ? bits[py * w + px] : 0;
    }
    return m;
  }

  /* ================= matrix -> text ================= */
  function readFormat(m, size) {
    function g(x, y) { return m[y * size + x]; }
    var a = 0, b = 0, i;
    for (i = 0; i <= 5; i++) a |= g(8, i) << i;
    a |= g(8, 7) << 6; a |= g(8, 8) << 7; a |= g(7, 8) << 8;
    for (i = 9; i < 15; i++) a |= g(14 - i, 8) << i;
    for (i = 0; i < 8; i++) b |= g(size - 1 - i, 8) << i;
    for (i = 8; i < 15; i++) b |= g(8, size - 15 + i) << i;
    var best = null, bd = 99;
    VALID_FORMATS.forEach(function (f) {
      var d = Math.min(popcount(f.bits ^ a), popcount(f.bits ^ b));
      if (d < bd) { bd = d; best = f; }
    });
    return bd <= 3 ? { ecl: FORMAT_TO_ECL[best.fecl], mask: best.mask } : null;
  }
  function readVersion(m, size) {
    var a = 0, b = 0;
    for (var i = 0; i < 18; i++) {
      var x = size - 11 + i % 3, y = Math.floor(i / 3);
      a |= m[y * size + x] << i;
      b |= m[x * size + y] << i;
    }
    var best = null, bd = 99;
    VALID_VERSIONS.forEach(function (v) {
      var d = Math.min(popcount(v.bits ^ a), popcount(v.bits ^ b));
      if (d < bd) { bd = d; best = v; }
    });
    return bd <= 3 ? best.ver : 0;
  }

  function decodeMatrix(m, size) {
    var ver = (size - 17) / 4;
    if (ver < 1 || ver > 40 || ver !== Math.floor(ver)) return null;
    var fmt = readFormat(m, size);
    if (!fmt) return null;
    var fn = functionMask(ver), raw = Math.floor(numRawDataModules(ver) / 8), cw = new Uint8Array(raw), bi = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) {
        for (var j = 0; j < 2; j++) {
          var x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
          if (fn[y * size + x] || bi >= raw * 8) continue;
          var bit = m[y * size + x] ^ (maskBit(fmt.mask, x, y) ? 1 : 0);
          if (bit) cw[bi >>> 3] |= 0x80 >>> (bi & 7);
          bi++;
        }
      }
    }
    var ecl = fmt.ecl, nb = NUM_BLOCKS[ecl][ver], ecc = ECC_PER_BLOCK[ecl][ver];
    var nShort = nb - raw % nb, shortLen = Math.floor(raw / nb), blocks = [], i, k = 0;
    for (i = 0; i < nb; i++) blocks.push(new Array(shortLen + 1).fill(0));
    for (i = 0; i < shortLen + 1; i++) for (j = 0; j < nb; j++) {
      if (i === shortLen - ecc && j < nShort) continue;
      blocks[j][i] = cw[k++];
    }
    var data = [], corrected = 0;
    for (j = 0; j < nb; j++) {
      var blk = blocks[j];
      if (j < nShort) blk.splice(shortLen - ecc, 1);
      var r = rsDecode(blk, ecc);
      if (r < 0) return null;
      corrected += r;
      for (i = 0; i < blk.length - ecc; i++) data.push(blk[i]);
    }
    var text = parseSegments(data, ver);
    if (text === null) return null;
    return { format: 'qr_code', text: text, version: ver, ecl: ECL_NAMES[ecl], mask: fmt.mask, corrected: corrected };
  }

  var ALNUM = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
  var ECI_LABELS = { 1: 'iso-8859-1', 3: 'iso-8859-1', 4: 'iso-8859-2', 5: 'iso-8859-3', 6: 'iso-8859-4', 7: 'iso-8859-5', 8: 'iso-8859-6', 9: 'iso-8859-7', 10: 'iso-8859-8', 11: 'windows-874', 13: 'iso-8859-11', 15: 'iso-8859-13', 17: 'iso-8859-15', 20: 'shift_jis', 21: 'windows-1250', 22: 'windows-1251', 23: 'windows-1252', 24: 'windows-1256', 25: 'utf-16be', 26: 'utf-8', 27: 'us-ascii', 28: 'big5', 29: 'gb18030', 30: 'euc-kr' };
  function decodeBytes(bytes, label) {
    var u8 = new Uint8Array(bytes);
    if (typeof TextDecoder !== 'undefined') {
      if (label) { try { return new TextDecoder(label).decode(u8); } catch (e) { /* fall through */ } }
      try { return new TextDecoder('utf-8', { fatal: true }).decode(u8); } catch (e) { /* not UTF-8 */ }
      try { return new TextDecoder('iso-8859-1').decode(u8); } catch (e) { /* ignore */ }
    }
    var s = ''; for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return s;
  }
  function parseSegments(data, ver) {
    var pos = 0, total = data.length * 8, out = '', eci = '';
    function read(n) {
      var v = 0;
      for (var i = 0; i < n; i++) { v = (v << 1) | ((data[pos >>> 3] >>> (7 - (pos & 7))) & 1); pos++; }
      return v;
    }
    var ci = ver <= 9 ? 0 : ver <= 26 ? 1 : 2;
    while (total - pos >= 4) {
      var mode = read(4), n, i;
      if (mode === 0) break;
      if (mode === 1) {
        n = read([10, 12, 14][ci]);
        while (n >= 3) { if (total - pos < 10) return null; var v3 = read(10); if (v3 > 999) return null; out += ('00' + v3).slice(-3); n -= 3; }
        if (n === 2) { var v2 = read(7); if (v2 > 99) return null; out += ('0' + v2).slice(-2); }
        else if (n === 1) { var v1 = read(4); if (v1 > 9) return null; out += v1; }
      } else if (mode === 2) {
        n = read([9, 11, 13][ci]);
        while (n >= 2) { var p = read(11); if (p >= 45 * 45) return null; out += ALNUM[Math.floor(p / 45)] + ALNUM[p % 45]; n -= 2; }
        if (n === 1) { var q = read(6); if (q >= 45) return null; out += ALNUM[q]; }
      } else if (mode === 4) {
        n = read([8, 16, 16][ci]);
        if (n * 8 > total - pos) return null;
        var bytes = [];
        for (i = 0; i < n; i++) bytes.push(read(8));
        out += decodeBytes(bytes, eci);
      } else if (mode === 8) {
        n = read([8, 10, 12][ci]);
        if (n * 13 > total - pos) return null;
        var sj = [];
        for (i = 0; i < n; i++) {
          var k = read(13), val = (Math.floor(k / 0xC0) << 8) | (k % 0xC0);
          val += val < 0x1F00 ? 0x8140 : 0xC140;
          sj.push(val >> 8, val & 255);
        }
        var kt = null;
        try { kt = new TextDecoder('shift_jis').decode(new Uint8Array(sj)); } catch (e) { kt = null; }
        out += kt === null ? new Array(n + 1).join('�') : kt;
      } else if (mode === 7) {
        var first = read(8), val2;
        if ((first & 0x80) === 0) val2 = first & 0x7F;
        else if ((first & 0xC0) === 0x80) val2 = ((first & 0x3F) << 8) | read(8);
        else if ((first & 0xE0) === 0xC0) val2 = ((first & 0x1F) << 16) | read(16);
        else return null;
        eci = ECI_LABELS[val2] || '';
      } else if (mode === 3) { read(16); }
      else if (mode === 5) { /* FNC1 first position: nothing to add */ }
      else if (mode === 9) { read(8); }
      else return out.length ? out : null;                 // unknown mode: keep what we have
    }
    return out;
  }

  function transpose(m, size) {
    var t = new Uint8Array(size * size);
    for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) t[x * size + y] = m[y * size + x];
    return t;
  }

  function tryTriple(bits, w, h, tri) {
    var tl = tri.tl, tr = tri.tr, bl = tri.bl, ms = tri.ms;
    var est = (dist(tl, tr) + dist(tl, bl)) / 2 / ms;
    var dim0 = Math.round(est) + 7;
    switch (dim0 & 3) { case 0: dim0++; break; case 2: dim0--; break; case 3: dim0 -= 2; break; }
    var dims = [dim0, dim0 + 4, dim0 - 4].filter(function (d) { return d >= 21 && d <= 177; });
    var seen = {};
    for (var di = 0; di < dims.length; di++) {
      var dim = dims[di];
      if (seen[dim]) continue; seen[dim] = 1;
      var r = tryDim(bits, w, h, tl, tr, bl, ms, dim);
      if (r && r.verFix && !seen[r.verFix]) { seen[r.verFix] = 1; r = tryDim(bits, w, h, tl, tr, bl, ms, r.verFix); }
      if (r && r.text !== undefined) return r;
    }
    return null;
  }
  function tryDim(bits, w, h, tl, tr, bl, ms, dim) {
    var span = dim - 7;
    var ux = (tr.x - tl.x) / span, uy = (tr.y - tl.y) / span, vx = (bl.x - tl.x) / span, vy = (bl.y - tl.y) / span;
    var brx = tr.x - tl.x + bl.x, bry = tr.y - tl.y + bl.y;
    var ver = (dim - 17) / 4, src, dst, results = [];
    var cands = [], BRsrc = [3.5, 3.5, dim - 3.5, 3.5, dim - 3.5, dim - 3.5, 3.5, dim - 3.5];
    /* second guess for the 4th corner when the photo is taken at an angle: finder patterns that look
       bigger are closer to the camera, so stretch each side by the ratio of module sizes */
    var rv = bl.ms / tl.ms, ru = tr.ms / tl.ms;
    var p2x = ((bl.x + (tr.x - tl.x) * rv) + (tr.x + (bl.x - tl.x) * ru)) / 2;
    var p2y = ((bl.y + (tr.y - tl.y) * rv) + (tr.y + (bl.y - tl.y) * ru)) / 2;
    var corners = [[brx, bry]];
    if (Math.abs(p2x - brx) + Math.abs(p2y - bry) > ms * 1.5) corners.push([p2x, p2y]);
    if (ver >= 2) {
      var k = (span - 3) / span;
      for (var ci = 0; ci < corners.length; ci++) {
        var est = [tl.x + k * (corners[ci][0] - tl.x), tl.y + k * (corners[ci][1] - tl.y)];
        var al = findAlignment(bits, w, h, est, ux, uy, vx, vy, ms);
        if (al) cands.push({ src: [3.5, 3.5, dim - 3.5, 3.5, dim - 6.5, dim - 6.5, 3.5, dim - 3.5], dst: [tl.x, tl.y, tr.x, tr.y, al[0], al[1], bl.x, bl.y] });
      }
    }
    for (ci = 0; ci < corners.length; ci++) cands.push({ src: BRsrc, dst: [tl.x, tl.y, tr.x, tr.y, corners[ci][0], corners[ci][1], bl.x, bl.y] });
    function attempt(src, dst) {
      var T = quadToQuad(src, dst);
      var m = sampleGrid(bits, w, h, T, dim);
      for (var flip = 0; flip < 2; flip++) {
        var mm = flip ? transpose(m, dim) : m;
        if (dim >= 45) {
          var vv = readVersion(mm, dim);
          if (vv && vv * 4 + 17 !== dim) return { verFix: vv * 4 + 17 };
        }
        var r = decodeMatrix(mm, dim);
        if (r) { r.mirrored = !!flip; return r; }
      }
      return null;
    }
    var c, r;
    for (c = 0; c < cands.length; c++) { r = attempt(cands[c].src, cands[c].dst); if (r) return r; }
    /* perspective (photo taken at an angle): the 4th corner is not where the parallelogram puts it.
       Nudge it around in module steps; format info + Reed-Solomon reject wrong guesses. */
    var offs = [], R = dim > 100 ? 2 : 3, a, b;
    for (a = -R; a <= R; a++) for (b = -R; b <= R; b++) if (a || b) offs.push([a, b]);
    offs.sort(function (p, q) { return Math.abs(p[0]) + Math.abs(p[1]) - Math.abs(q[0]) - Math.abs(q[1]); });
    for (c = 0; c < cands.length; c++) {
      for (var o = 0; o < offs.length; o++) {
        if (Date.now() > deadline) return null;
        var d = cands[c].dst.slice(), s = offs[o][0] * 0.75, t = offs[o][1] * 0.75;
        d[4] += s * ux + t * vx; d[5] += s * uy + t * vy;
        r = attempt(cands[c].src, d);
        if (r) return r;
      }
    }
    return null;
  }

  var deadline = 0;
  function decodeBits(bits, w, h) {
    var triples = rankTriples(findFinders(bits, w, h));
    for (var i = 0; i < triples.length; i++) {
      if (Date.now() > deadline) return null;
      var r = tryTriple(bits, w, h, triples[i]);
      if (r) return r;
    }
    return null;
  }

  /* opts.budget: rough time limit in ms (camera frames use a small one) */
  function decodeQR(img, opts) {
    if (!img || !img.width || !img.height) return null;
    deadline = Date.now() + ((opts && opts.budget) || 2500);
    var w = img.width, h = img.height, g = toGray(img);
    var bits = binarizeAdaptive(g, w, h), r = decodeBits(bits, w, h), i;
    if (r) return r;
    var ob = binarizeOtsu(g);
    r = decodeBits(ob, w, h);
    if (r) return r;
    for (i = 0; i < bits.length; i++) bits[i] ^= 1;     // light-on-dark codes
    r = decodeBits(bits, w, h);
    if (r) { r.inverted = true; return r; }
    return null;
  }

  /* ================= 1-D barcodes from scanlines ================= */
  var EAN_L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
  var EAN_PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
  function runsOf(bitstr) { var r = [], i = 0; while (i < bitstr.length) { var j = i; while (j < bitstr.length && bitstr[j] === bitstr[i]) j++; r.push(j - i); i = j; } return r; }
  var L_RUNS = EAN_L.map(runsOf);                                  // space,bar,space,bar
  var G_RUNS = L_RUNS.map(function (r) { return r.slice().reverse(); });
  var R_RUNS = L_RUNS;                                              // R = inverted L: same widths, starting with a bar

  function matchDigit(runs, start, tables) {
    var sum = runs[start] + runs[start + 1] + runs[start + 2] + runs[start + 3], u = sum / 7, best = 9, bd = -1, bt = -1;
    for (var t = 0; t < tables.length; t++) for (var d = 0; d < 10; d++) {
      var p = tables[t][d], e = 0;
      for (var k = 0; k < 4; k++) e += Math.abs(runs[start + k] / u - p[k]);
      if (e < best) { best = e; bd = d; bt = t; }
    }
    return best < 1.6 ? { d: bd, t: bt } : null;
  }
  function eanCheckOK(code) {
    var s = 0, n = code.length;
    for (var i = 0; i < n - 1; i++) s += (+code[n - 2 - i]) * (i % 2 === 0 ? 3 : 1);
    return (10 - s % 10) % 10 === +code[n - 1];
  }
  function guardOK(runs, i, n, u) {
    for (var k = 0; k < n; k++) if (runs[i + k] < u * 0.4 || runs[i + k] > u * 1.9) return false;
    return true;
  }
  /* runs: alternating widths, runs[0] is a light run (quiet zone) */
  function tryEAN(runs) {
    var found = [];
    for (var i = 1; i + 3 < runs.length; i += 2) {                   // odd indexes are dark runs
      var u0 = (runs[i] + runs[i + 1] + runs[i + 2]) / 3;
      if (runs[i - 1] < u0 * 3 || !guardOK(runs, i, 3, u0)) continue;
      // EAN-13: 59 runs, 95 modules
      if (i + 59 <= runs.length) {
        var tot = 0; for (var k = 0; k < 59; k++) tot += runs[i + k];
        var u = tot / 95;
        if (guardOK(runs, i, 3, u) && guardOK(runs, i + 27, 5, u) && guardOK(runs, i + 56, 3, u)) {
          var code = '', par = '', ok = true;
          for (var d = 0; d < 6 && ok; d++) { var m = matchDigit(runs, i + 3 + d * 4, [L_RUNS, G_RUNS]); if (!m) ok = false; else { code += m.d; par += m.t ? 'G' : 'L'; } }
          for (d = 0; d < 6 && ok; d++) { var r = matchDigit(runs, i + 32 + d * 4, [R_RUNS]); if (!r) ok = false; else code += r.d; }
          if (ok) {
            var first = EAN_PARITY.indexOf(par);
            if (first >= 0) {
              var full = first + code;
              if (eanCheckOK(full)) found.push(first === 0 ? { format: 'upc_a', text: full.slice(1) } : { format: 'ean_13', text: full });
            }
          }
        }
      }
      // EAN-8: 43 runs, 67 modules
      if (i + 43 <= runs.length) {
        var tot8 = 0; for (k = 0; k < 43; k++) tot8 += runs[i + k];
        var u8 = tot8 / 67;
        if (guardOK(runs, i, 3, u8) && guardOK(runs, i + 19, 5, u8) && guardOK(runs, i + 40, 3, u8)) {
          var c8 = '', ok8 = true;
          for (d = 0; d < 4 && ok8; d++) { var m8 = matchDigit(runs, i + 3 + d * 4, [L_RUNS]); if (!m8) ok8 = false; else c8 += m8.d; }
          for (d = 0; d < 4 && ok8; d++) { var r8 = matchDigit(runs, i + 24 + d * 4, [R_RUNS]); if (!r8) ok8 = false; else c8 += r8.d; }
          if (ok8 && eanCheckOK(c8)) found.push({ format: 'ean_8', text: c8 });
        }
      }
      if (found.length) return found[0];
    }
    return null;
  }

  var C128 = ['212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412', '211214', '211232'].map(function (s) { return s.split('').map(Number); });
  var C128_STOP = [2, 3, 3, 1, 1, 1, 2];
  function match128(runs, i) {
    var sum = 0, k; for (k = 0; k < 6; k++) sum += runs[i + k];
    var u = sum / 11, best = 99, bv = -1;
    for (var v = 0; v < C128.length; v++) {
      var e = 0; for (k = 0; k < 6; k++) e += Math.abs(runs[i + k] / u - C128[v][k]);
      if (e < best) { best = e; bv = v; }
    }
    return best < 2.2 ? bv : -1;
  }
  function isStop(runs, i) {
    if (i + 7 > runs.length) return false;
    var sum = 0, k; for (k = 0; k < 7; k++) sum += runs[i + k];
    var u = sum / 13, e = 0;
    for (k = 0; k < 7; k++) e += Math.abs(runs[i + k] / u - C128_STOP[k]);
    return e < 2.4;
  }
  function tryCode128(runs) {
    for (var i = 1; i + 6 < runs.length; i += 2) {
      var s0 = runs[i] + runs[i + 1] + runs[i + 2] + runs[i + 3] + runs[i + 4] + runs[i + 5];
      if (runs[i - 1] < s0 / 11 * 4) continue;                    // needs a quiet zone of ~5+ modules (relaxed)
      var start = match128(runs, i);
      if (start < 103 || start > 105) continue;
      var vals = [start], j = i + 6, ok = false;
      while (j + 6 <= runs.length) {
        if (isStop(runs, j)) { ok = true; break; }
        var v = match128(runs, j);
        if (v < 0 || v > 102) break;
        vals.push(v); j += 6;
      }
      if (!ok || vals.length < 3) continue;
      var check = vals.pop(), sum = vals[0];
      for (var k = 1; k < vals.length; k++) sum += vals[k] * k;
      if (sum % 103 !== check) continue;
      var set = start === 103 ? 'A' : start === 104 ? 'B' : 'C', out = '', shift = false;
      for (k = 1; k < vals.length; k++) {
        var c = vals[k], cur = shift ? (set === 'A' ? 'B' : 'A') : set; shift = false;
        if (cur === 'C') {
          if (c < 100) out += (c < 10 ? '0' : '') + c;
          else if (c === 100) set = 'B'; else if (c === 101) set = 'A';
          else if (c === 102 && out) out += '\u001d';
        } else {
          if (c < 96) out += cur === 'A' ? String.fromCharCode(c < 64 ? c + 32 : c - 64) : String.fromCharCode(c + 32);
          else if (c === 98) shift = true;
          else if (c === 99) set = 'C';
          else if (c === 100 && cur === 'A') set = 'B';
          else if (c === 101 && cur === 'B') set = 'A';
          else if (c === 102 && out) out += '\u001d';
        }
      }
      if (out) return { format: 'code_128', text: out };
    }
    return null;
  }
  function lineRuns(vals) {
    var n = vals.length, mn = 255, mx = 0, i;
    for (i = 0; i < n; i++) { if (vals[i] < mn) mn = vals[i]; if (vals[i] > mx) mx = vals[i]; }
    if (mx - mn < 40) return null;
    var th = (mn + mx) / 2, runs = [], cur = 0, len = 0;     // start light (quiet zone)
    for (i = 0; i < n; i++) {
      var b = vals[i] < th ? 1 : 0;
      if (b === cur) len++; else { runs.push(len); cur = b; len = 1; }
    }
    runs.push(len);
    if (cur === 1) runs.push(0);
    return runs;
  }
  function decode1D(img) {
    if (!img || !img.width || !img.height) return null;
    var w = img.width, h = img.height, g = toGray(img), votes = {};
    function rev(r) { return r.slice().reverse(); }
    function scanLine(vals) {
      var runs = lineRuns(vals);
      if (!runs || runs.length < 20) return null;
      return tryEAN(runs) || tryEAN(rev(runs)) || tryCode128(runs) || tryCode128(rev(runs));
    }
    function vote(r) {
      if (!r) return null;
      var k = r.format + ':' + r.text;
      votes[k] = (votes[k] || 0) + 1;
      return votes[k] >= 2 ? r : null;
    }
    var N = 17, i, k, y, x, line, res;
    for (var dir = 0; dir < 2; dir++) {
      var len = dir ? h : w, across = dir ? w : h;
      for (i = 0; i < N; i++) {
        // centre first, then alternate outward
        var f = 0.5 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * (0.42 / Math.ceil(N / 2));
        var c = Math.round(f * (across - 1));
        line = new Uint8Array(len);
        for (k = 0; k < len; k++) {
          if (dir) { y = k; x = c; } else { y = c; x = k; }
          // average 3 neighbouring lines against print noise
          var s = 0, n = 0;
          for (var o = -1; o <= 1; o++) {
            var yy = dir ? y : y + o, xx = dir ? x + o : x;
            if (yy >= 0 && yy < h && xx >= 0 && xx < w) { s += g[yy * w + xx]; n++; }
          }
          line[k] = s / n;
        }
        res = vote(scanLine(line));
        if (res) return res;
      }
    }
    // single clean read (screenshots): accept if only one candidate was seen at all
    var keys = Object.keys(votes);
    if (keys.length === 1) { var p = keys[0].indexOf(':'); return { format: keys[0].slice(0, p), text: keys[0].slice(p + 1) }; }
    return null;
  }

  function scan(img, opts) {
    opts = opts || {};
    var r = null;
    if (opts.qr !== false) r = decodeQR(img, opts);
    if (!r && opts.oneD !== false) r = decode1D(img);
    return r;
  }

  root.QRDecode = { decodeQR: decodeQR, decode1D: decode1D, scan: scan, _rsDecode: rsDecode, _decodeMatrix: decodeMatrix };
})(typeof window !== 'undefined' ? window : this);
