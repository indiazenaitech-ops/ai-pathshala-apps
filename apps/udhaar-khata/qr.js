/* QR code encoder (copied from apps/qr-code-maker/qr.js, MIT; works offline, no library needed).
 * Follows the public QR Code standard (ISO/IEC 18004): versions 1-40, error correction L/M/Q/H,
 * numeric / alphanumeric / byte (UTF-8) modes and automatic mask choice by the standard penalty rules.
 * The structure follows Project Nayuki's MIT-licensed reference design.
 *
 *   QRGen.encode(text, 'M', { mask: -1 }) ->
 *     { ok:true, version, size, ecl, mask, mode, bytes, usedBits, capacityBits, modules[y][x] (bool), kinds[y][x] }
 *     { ok:false, reason:'too_long', bytes, maxBytes }
 *   kinds: 0 data/ecc, 1 finder (+separator), 2 timing, 3 alignment, 4 format info (+dark module), 5 version info
 */
(function (root) {
  'use strict';

  var ECL_INDEX = { L: 0, M: 1, Q: 2, H: 3 };
  var ECL_FORMAT_BITS = [1, 0, 3, 2];

  /* error-correction codewords per block, index [ecl][version] */
  var ECC_PER_BLOCK = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
  ];
  /* number of error-correction blocks, index [ecl][version] */
  var NUM_BLOCKS = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
  ];

  var MODES = {
    numeric: { bits: 0x1, cc: [10, 12, 14] },
    alnum: { bits: 0x2, cc: [9, 11, 13] },
    byte: { bits: 0x4, cc: [8, 16, 16] }
  };
  var ALNUM_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

  /* ---------------- text -> bytes ---------------- */
  function utf8Bytes(str) {
    var out = [], i, c, c2;
    for (i = 0; i < str.length; i++) {
      c = str.charCodeAt(i);
      if (c >= 0xD800 && c <= 0xDBFF && i + 1 < str.length) {
        c2 = str.charCodeAt(i + 1);
        if (c2 >= 0xDC00 && c2 <= 0xDFFF) { c = 0x10000 + ((c - 0xD800) << 10) + (c2 - 0xDC00); i++; }
        else c = 0xFFFD;
      } else if (c >= 0xD800 && c <= 0xDFFF) c = 0xFFFD;      // lone surrogate
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xC0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else out.push(0xF0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
  }

  function pickMode(text) {
    if (/^[0-9]+$/.test(text)) return 'numeric';
    if (/^[0-9A-Z $%*+\-.\/:]+$/.test(text)) return 'alnum';
    return 'byte';
  }

  /* data bits (without mode indicator and count) for a segment */
  function segmentBits(text, mode) {
    var bits = [], i;
    function put(val, len) { for (var k = len - 1; k >= 0; k--) bits.push((val >>> k) & 1); }
    if (mode === 'numeric') {
      for (i = 0; i < text.length; i += 3) {
        var chunk = text.substr(i, 3);
        put(parseInt(chunk, 10), chunk.length * 3 + 1);
      }
      return { bits: bits, count: text.length };
    }
    if (mode === 'alnum') {
      for (i = 0; i + 1 < text.length; i += 2) put(ALNUM_CHARS.indexOf(text[i]) * 45 + ALNUM_CHARS.indexOf(text[i + 1]), 11);
      if (text.length % 2) put(ALNUM_CHARS.indexOf(text[text.length - 1]), 6);
      return { bits: bits, count: text.length };
    }
    var bytes = utf8Bytes(text);
    for (i = 0; i < bytes.length; i++) put(bytes[i], 8);
    return { bits: bits, count: bytes.length };
  }

  /* ---------------- capacity tables ---------------- */
  function numRawDataModules(ver) {
    var result = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      var numAlign = Math.floor(ver / 7) + 2;
      result -= (25 * numAlign - 10) * numAlign - 55;
      if (ver >= 7) result -= 36;
    }
    return result;
  }
  function numDataCodewords(ver, ecl) {
    return Math.floor(numRawDataModules(ver) / 8) - ECC_PER_BLOCK[ecl][ver] * NUM_BLOCKS[ecl][ver];
  }
  function ccIndex(ver) { return ver <= 9 ? 0 : (ver <= 26 ? 1 : 2); }
  /* the most UTF-8 bytes that fit at version 40 for this level */
  function maxBytes(ecl) { return Math.floor((numDataCodewords(40, ecl) * 8 - 4 - 16) / 8); }

  /* ---------------- Reed-Solomon over GF(256), polynomial 0x11D ---------------- */
  function gfMul(x, y) {
    var z = 0;
    for (var i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11D);
      z ^= ((y >>> i) & 1) * x;
    }
    return z;
  }
  function rsDivisor(degree) {
    var result = [], i, j;
    for (i = 0; i < degree - 1; i++) result.push(0);
    result.push(1);
    var r = 1;
    for (i = 0; i < degree; i++) {
      for (j = 0; j < result.length; j++) {
        result[j] = gfMul(result[j], r);
        if (j + 1 < result.length) result[j] ^= result[j + 1];
      }
      r = gfMul(r, 0x02);
    }
    return result;
  }
  function rsRemainder(data, divisor) {
    var result = divisor.map(function () { return 0; });
    for (var i = 0; i < data.length; i++) {
      var factor = data[i] ^ result.shift();
      result.push(0);
      for (var j = 0; j < divisor.length; j++) result[j] ^= gfMul(divisor[j], factor);
    }
    return result;
  }

  function addEccAndInterleave(data, ver, ecl) {
    var numBlocks = NUM_BLOCKS[ecl][ver], blockEccLen = ECC_PER_BLOCK[ecl][ver];
    var rawCodewords = Math.floor(numRawDataModules(ver) / 8);
    var numShortBlocks = numBlocks - rawCodewords % numBlocks;
    var shortBlockLen = Math.floor(rawCodewords / numBlocks);
    var blocks = [], div = rsDivisor(blockEccLen), i, k;
    for (i = 0, k = 0; i < numBlocks; i++) {
      var dat = data.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
      k += dat.length;
      var ecc = rsRemainder(dat, div);
      if (i < numShortBlocks) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    var result = [];
    for (i = 0; i < blocks[0].length; i++) {
      for (var j = 0; j < blocks.length; j++) {
        if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) result.push(blocks[j][i]);
      }
    }
    return result;
  }

  /* ---------------- matrix ---------------- */
  function alignmentPositions(ver, size) {
    if (ver === 1) return [];
    var numAlign = Math.floor(ver / 7) + 2;
    var step = Math.floor((ver * 8 + numAlign * 3 + 5) / (numAlign * 4 - 4)) * 2;
    var result = [6];
    for (var pos = size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
    return result;
  }
  function bit(x, i) { return ((x >>> i) & 1) !== 0; }

  function Matrix(ver, ecl) {
    var size = ver * 4 + 17, y;
    this.ver = ver; this.ecl = ecl; this.size = size;
    this.modules = []; this.isFn = []; this.kinds = [];
    for (y = 0; y < size; y++) {
      this.modules.push(new Array(size).fill(false));
      this.isFn.push(new Array(size).fill(false));
      this.kinds.push(new Array(size).fill(0));
    }
  }
  Matrix.prototype.setFn = function (x, y, dark, kind) {
    this.modules[y][x] = dark; this.isFn[y][x] = true; this.kinds[y][x] = kind;
  };
  Matrix.prototype.drawFunctionPatterns = function () {
    var size = this.size, i, j;
    for (i = 0; i < size; i++) { this.setFn(6, i, i % 2 === 0, 2); this.setFn(i, 6, i % 2 === 0, 2); }
    this.drawFinder(3, 3); this.drawFinder(size - 4, 3); this.drawFinder(3, size - 4);
    var pos = alignmentPositions(this.ver, size), n = pos.length;
    for (i = 0; i < n; i++) {
      for (j = 0; j < n; j++) {
        if (!(i === 0 && j === 0 || i === 0 && j === n - 1 || i === n - 1 && j === 0)) this.drawAlignment(pos[i], pos[j]);
      }
    }
    this.drawFormatBits(0);
    this.drawVersion();
  };
  Matrix.prototype.drawFinder = function (x, y) {
    for (var dy = -4; dy <= 4; dy++) {
      for (var dx = -4; dx <= 4; dx++) {
        var d = Math.max(Math.abs(dx), Math.abs(dy)), xx = x + dx, yy = y + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) this.setFn(xx, yy, d !== 2 && d !== 4, 1);
      }
    }
  };
  Matrix.prototype.drawAlignment = function (x, y) {
    for (var dy = -2; dy <= 2; dy++) {
      for (var dx = -2; dx <= 2; dx++) this.setFn(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1, 3);
    }
  };
  Matrix.prototype.drawFormatBits = function (mask) {
    var data = ECL_FORMAT_BITS[this.ecl] << 3 | mask, rem = data, i, size = this.size;
    for (i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    var bits = (data << 10 | rem) ^ 0x5412;
    for (i = 0; i <= 5; i++) this.setFn(8, i, bit(bits, i), 4);
    this.setFn(8, 7, bit(bits, 6), 4);
    this.setFn(8, 8, bit(bits, 7), 4);
    this.setFn(7, 8, bit(bits, 8), 4);
    for (i = 9; i < 15; i++) this.setFn(14 - i, 8, bit(bits, i), 4);
    for (i = 0; i < 8; i++) this.setFn(size - 1 - i, 8, bit(bits, i), 4);
    for (i = 8; i < 15; i++) this.setFn(8, size - 15 + i, bit(bits, i), 4);
    this.setFn(8, size - 8, true, 4);                       // the "dark module"
  };
  Matrix.prototype.drawVersion = function () {
    if (this.ver < 7) return;
    var rem = this.ver, i;
    for (i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
    var bits = this.ver << 12 | rem;
    for (i = 0; i < 18; i++) {
      var dark = bit(bits, i), a = this.size - 11 + i % 3, b = Math.floor(i / 3);
      this.setFn(a, b, dark, 5);
      this.setFn(b, a, dark, 5);
    }
  };
  Matrix.prototype.drawCodewords = function (data) {
    var size = this.size, i = 0, total = data.length * 8;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) {
        for (var j = 0; j < 2; j++) {
          var x = right - j, upward = ((right + 1) & 2) === 0, y = upward ? size - 1 - vert : vert;
          if (!this.isFn[y][x] && i < total) { this.modules[y][x] = bit(data[i >>> 3], 7 - (i & 7)); i++; }
        }
      }
    }
  };
  Matrix.prototype.applyMask = function (mask) {
    var size = this.size;
    for (var y = 0; y < size; y++) {
      for (var x = 0; x < size; x++) {
        var inv;
        switch (mask) {
          case 0: inv = (x + y) % 2 === 0; break;
          case 1: inv = y % 2 === 0; break;
          case 2: inv = x % 3 === 0; break;
          case 3: inv = (x + y) % 3 === 0; break;
          case 4: inv = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: inv = x * y % 2 + x * y % 3 === 0; break;
          case 6: inv = (x * y % 2 + x * y % 3) % 2 === 0; break;
          default: inv = ((x + y) % 2 + x * y % 3) % 2 === 0;
        }
        if (!this.isFn[y][x] && inv) this.modules[y][x] = !this.modules[y][x];
      }
    }
  };
  /* penalty score from the standard (lower = easier to scan) */
  Matrix.prototype.penalty = function () {
    var size = this.size, m = this.modules, result = 0, x, y, dark = 0;
    function addHistory(len, h) { if (h[0] === 0) len += size; h.pop(); h.unshift(len); }
    function countPatterns(h) {
      var n = h[1], core = n > 0 && h[2] === n && h[3] === n * 3 && h[4] === n && h[5] === n;
      return (core && h[0] >= n * 4 && h[6] >= n ? 1 : 0) + (core && h[6] >= n * 4 && h[0] >= n ? 1 : 0);
    }
    function terminate(color, len, h) {
      if (color) { addHistory(len, h); len = 0; }
      len += size; addHistory(len, h);
      return countPatterns(h);
    }
    function line(get) {
      var color = false, run = 0, h = [0, 0, 0, 0, 0, 0, 0], i;
      for (i = 0; i < size; i++) {
        if (get(i) === color) {
          run++;
          if (run === 5) result += 3; else if (run > 5) result++;
        } else {
          addHistory(run, h);
          if (!color) result += countPatterns(h) * 40;
          color = get(i); run = 1;
        }
      }
      result += terminate(color, run, h) * 40;
    }
    for (y = 0; y < size; y++) line(function (i) { return m[y][i]; });
    for (x = 0; x < size; x++) line(function (i) { return m[i][x]; });
    for (y = 0; y < size - 1; y++) {
      for (x = 0; x < size - 1; x++) {
        var c = m[y][x];
        if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) result += 3;
      }
    }
    for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (m[y][x]) dark++;
    var total = size * size;
    result += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
    return result;
  };

  /* ---------------- public ---------------- */
  function encode(text, eclName, opts) {
    opts = opts || {};
    text = String(text == null ? '' : text);
    var ecl = ECL_INDEX[eclName] !== undefined ? ECL_INDEX[eclName] : 1;
    var mode = text.length ? pickMode(text) : 'byte';
    var seg = segmentBits(text, mode);
    var byteLen = mode === 'byte' ? seg.count : utf8Bytes(text).length;
    var ver, cap, used;
    for (ver = 1; ver <= 40; ver++) {
      var ccBits = MODES[mode].cc[ccIndex(ver)];
      cap = numDataCodewords(ver, ecl) * 8;
      used = 4 + ccBits + seg.bits.length;
      if (seg.count < (1 << ccBits) && used <= cap) break;
    }
    if (ver > 40) return { ok: false, reason: 'too_long', bytes: byteLen, maxBytes: maxBytes(ecl), ecl: eclName };

    var bb = [];
    function put(val, len) { for (var k = len - 1; k >= 0; k--) bb.push((val >>> k) & 1); }
    put(MODES[mode].bits, 4);
    put(seg.count, MODES[mode].cc[ccIndex(ver)]);
    for (var i = 0; i < seg.bits.length; i++) bb.push(seg.bits[i]);
    put(0, Math.min(4, cap - bb.length));
    put(0, (8 - bb.length % 8) % 8);
    for (var pad = 0xEC; bb.length < cap; pad ^= 0xEC ^ 0x11) put(pad, 8);
    var data = [];
    for (i = 0; i < bb.length; i += 8) {
      var b = 0;
      for (var k = 0; k < 8; k++) b = (b << 1) | bb[i + k];
      data.push(b);
    }

    var mtx = new Matrix(ver, ecl);
    mtx.drawFunctionPatterns();
    mtx.drawCodewords(addEccAndInterleave(data, ver, ecl));
    var mask = typeof opts.mask === 'number' && opts.mask >= 0 && opts.mask <= 7 ? opts.mask : -1;
    if (mask < 0) {
      var best = Infinity;
      for (var mi = 0; mi < 8; mi++) {
        mtx.applyMask(mi); mtx.drawFormatBits(mi);
        var p = mtx.penalty();
        if (p < best) { best = p; mask = mi; }
        mtx.applyMask(mi);                                   // XOR again = undo
      }
    }
    mtx.applyMask(mask);
    mtx.drawFormatBits(mask);
    return {
      ok: true, version: ver, size: mtx.size, ecl: eclName, mask: mask, mode: mode,
      bytes: byteLen, usedBits: used, capacityBits: cap,
      modules: mtx.modules, kinds: mtx.kinds
    };
  }

  root.QRGen = {
    encode: encode, utf8Bytes: utf8Bytes, maxBytes: function (e) { return maxBytes(ECL_INDEX[e] !== undefined ? ECL_INDEX[e] : 1); },
    _numDataCodewords: numDataCodewords
  };
})(typeof window !== 'undefined' ? window : this);
