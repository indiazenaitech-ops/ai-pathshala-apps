/* GIF Maker: the GIF encoder. Written for this app from the GIF89a specification (no outside code).
   For every frame: a palette of up to 256 colours (median cut) -> every pixel gets the nearest palette colour
   (optionally dithered) -> LZW compression -> GIF89a blocks.
   - Photos ("local" mode): each frame gets its own palette and Floyd-Steinberg dithering.
   - Video ("global" mode): one palette for the whole clip, made from sample frames; ordered (Bayer) dithering so
     still areas stay still; every frame after the first stores only the box that changed, and pixels that did not
     change are transparent. That keeps video GIFs much smaller.
   window.GIFMAKER_LIB is a plain function. The app turns its source text into a Web Worker through a Blob URL
   (this also works when the page is opened from a downloaded folder) and, if workers are not available, runs the
   same code on the page. Either way window/self.GIFMAKER = { Session } is the encoder. */
(function (root) {
  'use strict';
  function lib(self, inWorker) {
    var HSIZE = 32768;                              /* histogram: 5 bits per channel */
    var BAYER = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
      3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];

    /* ---------- growing byte buffer ---------- */
    function Bytes() { this.a = new Uint8Array(1 << 16); this.n = 0; }
    Bytes.prototype.need = function (k) {
      if (this.n + k <= this.a.length) return;
      var b = new Uint8Array(Math.max(this.a.length * 2, this.n + k + 4096)); b.set(this.a.subarray(0, this.n)); this.a = b;
    };
    Bytes.prototype.byte = function (v) { this.need(1); this.a[this.n++] = v & 255; };
    Bytes.prototype.u16 = function (v) { this.need(2); this.a[this.n++] = v & 255; this.a[this.n++] = (v >> 8) & 255; };
    Bytes.prototype.str = function (s) { for (var i = 0; i < s.length; i++) this.byte(s.charCodeAt(i)); };
    Bytes.prototype.put = function (src, len) { this.need(len); this.a.set(src.subarray(0, len), this.n); this.n += len; };

    /* ---------- colour histogram and median cut ---------- */
    function Hist() { this.cnt = new Float64Array(HSIZE); this.sum = new Float64Array(HSIZE * 3); this.total = 0; }
    Hist.prototype.add = function (px, maxSamples) {
      var n = px.length >> 2, step = Math.max(1, Math.ceil(n / (maxSamples || 250000))) | 1;
      if (n < 2) step = 1;
      var cnt = this.cnt, sum = this.sum;
      for (var i = 0; i < n; i += step) {
        var o = i << 2, r = px[o], g = px[o + 1], b = px[o + 2];
        var k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
        cnt[k]++; k *= 3; sum[k] += r; sum[k + 1] += g; sum[k + 2] += b;
        this.total++;
      }
    };
    function ch(k, c) { return c === 0 ? (k >> 10) & 31 : c === 1 ? (k >> 5) & 31 : k & 31; }
    /* returns [[r,g,b], ...] with at most maxColours entries */
    function medianCut(h, maxColours) {
      var list = [], i, j;
      for (i = 0; i < HSIZE; i++) if (h.cnt[i] > 0) list.push(i);
      if (!list.length) return [[0, 0, 0]];
      var idx = Int32Array.from(list);
      function box(s, e) {
        var lo = [31, 31, 31], hi = [0, 0, 0], count = 0;
        for (var q = s; q < e; q++) {
          var k = idx[q]; count += h.cnt[k];
          for (var c = 0; c < 3; c++) { var v = ch(k, c); if (v < lo[c]) lo[c] = v; if (v > hi[c]) hi[c] = v; }
        }
        var rg = [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]];
        var axis = rg[1] >= rg[0] && rg[1] >= rg[2] ? 1 : rg[0] >= rg[2] ? 0 : 2;
        return { s: s, e: e, count: count, axis: axis, vol: (rg[0] + 1) * (rg[1] + 1) * (rg[2] + 1) };
      }
      var boxes = [box(0, idx.length)], target = Math.min(maxColours, idx.length);
      while (boxes.length < target) {
        /* first half of the splits by number of pixels, then by pixels x colour volume (keeps small bright areas such as text) */
        var byVol = boxes.length >= target / 2, best = -1, bestScore = -1;
        for (i = 0; i < boxes.length; i++) {
          var bx = boxes[i];
          if (bx.e - bx.s < 2) continue;
          var sc = byVol ? bx.count * bx.vol : bx.count;
          if (sc > bestScore) { bestScore = sc; best = i; }
        }
        if (best < 0) break;
        var B = boxes[best], ax = B.axis;
        idx.subarray(B.s, B.e).sort(function (a, b) { return ch(a, ax) - ch(b, ax); });
        var half = B.count / 2, acc = 0, cut = B.s + 1;
        for (j = B.s; j < B.e; j++) { acc += h.cnt[idx[j]]; if (acc >= half) { cut = j + 1; break; } }
        if (cut >= B.e) cut = B.e - 1;
        if (cut <= B.s) cut = B.s + 1;
        boxes.splice(best, 1, box(B.s, cut), box(cut, B.e));
      }
      return boxes.map(function (bx) {
        var r = 0, g = 0, b = 0, n = 0;
        for (var q = bx.s; q < bx.e; q++) { var k = idx[q], c = h.cnt[k]; n += c; r += h.sum[k * 3]; g += h.sum[k * 3 + 1]; b += h.sum[k * 3 + 2]; }
        return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
      });
    }

    /* ---------- nearest palette colour, cached per 6-bit cell ---------- */
    function Mapper(pal) {
      var n = pal.length;
      this.n = n; this.r = new Int32Array(n); this.g = new Int32Array(n); this.b = new Int32Array(n);
      for (var i = 0; i < n; i++) { this.r[i] = pal[i][0]; this.g[i] = pal[i][1]; this.b[i] = pal[i][2]; }
      this.cache = new Int16Array(1 << 18); this.cache.fill(-1);
    }
    Mapper.prototype.find = function (key) {
      var r = ((key >> 12) << 2) + 2, g = (((key >> 6) & 63) << 2) + 2, b = ((key & 63) << 2) + 2;
      var best = 0, bd = 1e12, R = this.r, G = this.g, Bc = this.b;
      for (var i = 0; i < this.n; i++) {
        var dr = R[i] - r, dg = G[i] - g, db = Bc[i] - b, d = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
        if (d < bd) { bd = d; best = i; if (d === 0) break; }
      }
      this.cache[key] = best;
      return best;
    };
    function indexPlain(px, n, m, out) {
      var cache = m.cache;
      for (var i = 0, o = 0; i < n; i++, o += 4) {
        var key = ((px[o] >> 2) << 12) | ((px[o + 1] >> 2) << 6) | (px[o + 2] >> 2), v = cache[key];
        out[i] = v >= 0 ? v : m.find(key);
      }
    }
    function indexFS(px, w, h, m, out) {
      var cache = m.cache, R = m.r, G = m.g, B = m.b, K = 0.85;
      var e1 = new Float32Array((w + 2) * 3), e2 = new Float32Array((w + 2) * 3);
      for (var y = 0; y < h; y++) {
        var ltr = (y & 1) === 0, d = ltr ? 3 : -3;
        e2.fill(0);
        for (var xi = 0; xi < w; xi++) {
          var x = ltr ? xi : w - 1 - xi, i = y * w + x, o = i << 2, ei = (x + 1) * 3;
          var r = px[o] + e1[ei], g = px[o + 1] + e1[ei + 1], b = px[o + 2] + e1[ei + 2];
          r = r < 0 ? 0 : r > 255 ? 255 : r; g = g < 0 ? 0 : g > 255 ? 255 : g; b = b < 0 ? 0 : b > 255 ? 255 : b;
          var key = (((r | 0) >> 2) << 12) | (((g | 0) >> 2) << 6) | ((b | 0) >> 2), v = cache[key];
          if (v < 0) v = m.find(key);
          out[i] = v;
          var er = (r - R[v]) * K, eg = (g - G[v]) * K, eb = (b - B[v]) * K;
          e1[ei + d] += er * 0.4375; e1[ei + d + 1] += eg * 0.4375; e1[ei + d + 2] += eb * 0.4375;
          e2[ei - d] += er * 0.1875; e2[ei - d + 1] += eg * 0.1875; e2[ei - d + 2] += eb * 0.1875;
          e2[ei] += er * 0.3125; e2[ei + 1] += eg * 0.3125; e2[ei + 2] += eb * 0.3125;
          e2[ei + d] += er * 0.0625; e2[ei + d + 1] += eg * 0.0625; e2[ei + d + 2] += eb * 0.0625;
        }
        var tmp = e1; e1 = e2; e2 = tmp;
      }
    }
    function indexBayer(px, w, h, m, out, spread) {
      var cache = m.cache;
      for (var y = 0; y < h; y++) {
        var row = (y & 7) << 3;
        for (var x = 0; x < w; x++) {
          var i = y * w + x, o = i << 2, t = (BAYER[row | (x & 7)] / 64 - 0.4921875) * spread;
          var r = px[o] + t, g = px[o + 1] + t, b = px[o + 2] + t;
          r = r < 0 ? 0 : r > 255 ? 255 : r; g = g < 0 ? 0 : g > 255 ? 255 : g; b = b < 0 ? 0 : b > 255 ? 255 : b;
          var key = (((r | 0) >> 2) << 12) | (((g | 0) >> 2) << 6) | ((b | 0) >> 2), v = cache[key];
          out[i] = v >= 0 ? v : m.find(key);
        }
      }
    }

    /* ---------- LZW (variable code size 3..12 bits, clear code when the table is full) ---------- */
    function Lzw() { this.tab = new Int16Array(1 << 20); this.stamp = new Uint16Array(1 << 20); this.gen = 1; }
    Lzw.prototype.encode = function (out, pix, n, minSize) {
      var tab = this.tab, stamp = this.stamp, self_ = this;
      var clear = 1 << minSize, eoi = clear + 1, next = eoi + 1, size = minSize + 1;
      var blk = new Uint8Array(256), bl = 0, acc = 0, nb = 0;
      function emit(code) {
        acc |= code << nb; nb += size;
        while (nb >= 8) {
          blk[bl++] = acc & 255; acc >>>= 8; nb -= 8;
          if (bl === 255) { out.byte(255); out.put(blk, 255); bl = 0; }
        }
      }
      function reset() { self_.gen++; if (self_.gen > 65535) { stamp.fill(0); self_.gen = 1; } next = eoi + 1; size = minSize + 1; }
      out.byte(minSize);
      reset();
      emit(clear);
      var gen = this.gen, prefix = pix[0];
      for (var i = 1; i < n; i++) {
        var k = pix[i], key = (prefix << 8) | k;
        if (stamp[key] === gen) { prefix = tab[key]; continue; }
        emit(prefix);
        if (next < 4096) {
          tab[key] = next; stamp[key] = gen; next++;
          if (next > (1 << size) && size < 12) size++;
        } else {
          emit(clear); reset(); gen = this.gen;
        }
        prefix = k;
      }
      emit(prefix);
      /* the decoder adds one more table entry after reading that last code, and may widen the code size for the
         end code; do the same here so strict decoders read the end code with the right number of bits */
      if (next >= (1 << size) && size < 12) size++;
      emit(eoi);
      if (nb > 0) { blk[bl++] = acc & 255; if (bl === 255) { out.byte(255); out.put(blk, 255); bl = 0; } }
      if (bl > 0) { out.byte(bl); out.put(blk, bl); }
      out.byte(0);
    };

    /* ---------- one GIF file ---------- */
    function bitsFor(n) { var p = 1; while ((1 << p) < n) p++; return p; }
    function writeTable(out, pal, p) {
      var len = 1 << p;
      for (var i = 0; i < len; i++) { var c = pal[i] || [0, 0, 0]; out.byte(c[0]); out.byte(c[1]); out.byte(c[2]); }
    }
    /* o: { w, h, colours 2..256, dither 'none'|'fs'|'bayer', global: bool, loop: -1 (no loop block = plays once) | 0 (forever) | n (repeat n more times) } */
    function Session(o) {
      this.w = Math.max(1, o.w | 0); this.h = Math.max(1, o.h | 0);
      this.colours = Math.max(2, Math.min(256, o.colours | 0 || 256));
      this.dither = o.dither === 'fs' || o.dither === 'bayer' ? o.dither : 'none';
      this.global = !!o.global; this.loop = o.loop === undefined ? 0 : o.loop | 0;
      this.out = new Bytes(); this.frames = 0; this.lzw = new Lzw();
      this.hist = this.global ? new Hist() : null; this.map = null; this.gpal = null; this.prev = null; this.trans = -1;
      this.cur = new Uint8Array(this.w * this.h);
    }
    Session.prototype.sample = function (px) { if (this.hist && !this.map) this.hist.add(px, 120000); };
    Session.prototype.header = function () {
      var out = this.out;
      out.str('GIF89a'); out.u16(this.w); out.u16(this.h);
      if (this.gpal) {
        var p = bitsFor(this.gpal.length + 1);
        out.byte(0x80 | 0x70 | (p - 1)); out.byte(0); out.byte(0);
        writeTable(out, this.gpal, p);
        this.gbits = p;
      } else { out.byte(0x70); out.byte(0); out.byte(0); }
      if (this.loop >= 0) {
        out.byte(0x21); out.byte(0xFF); out.byte(11); out.str('NETSCAPE2.0');
        out.byte(3); out.byte(1); out.u16(Math.min(65535, this.loop)); out.byte(0);
      }
    };
    Session.prototype.frame = function (px, delayCs) {
      var w = this.w, h = this.h, n = w * h, out = this.out;
      if (px.length < n * 4) throw new Error('frame size');
      var delay = Math.max(2, Math.min(65535, Math.round(delayCs) || 10));
      if (this.global) {
        if (!this.map) {
          if (!this.hist.total) this.hist.add(px, 120000);
          this.gpal = medianCut(this.hist, this.colours - 1);       /* one slot is kept for "transparent" */
          this.map = new Mapper(this.gpal); this.trans = this.gpal.length; this.hist = null;
          this.header();
        }
        var cur = this.cur;
        if (this.dither === 'bayer') indexBayer(px, w, h, this.map, cur, 255 / Math.cbrt(this.colours) * 0.6);
        else if (this.dither === 'fs') indexFS(px, w, h, this.map, cur);
        else indexPlain(px, n, this.map, cur);
        var x0 = 0, y0 = 0, x1 = w - 1, y1 = h - 1, data = cur, bw = w, bh = h, useT = false;
        if (this.prev) {
          var prev = this.prev, found = false, x, y, i;
          x0 = w; y0 = h; x1 = -1; y1 = -1;
          for (y = 0; y < h; y++) {
            var rowAny = false, ro = y * w;
            for (x = 0; x < w; x++) if (cur[ro + x] !== prev[ro + x]) { rowAny = true; if (x < x0) x0 = x; if (x > x1) x1 = x; }
            if (rowAny) { found = true; if (y < y0) y0 = y; y1 = y; }
          }
          if (!found) { x0 = y0 = x1 = y1 = 0; }
          bw = x1 - x0 + 1; bh = y1 - y0 + 1; useT = true;
          data = new Uint8Array(bw * bh);
          for (y = 0; y < bh; y++) {
            var so = (y + y0) * w + x0, d0 = y * bw;
            for (x = 0; x < bw; x++) { i = so + x; data[d0 + x] = (found && cur[i] !== prev[i]) ? cur[i] : this.trans; }
          }
          var sw = this.prev; this.prev = cur; this.cur = sw;      /* cur becomes the new "previous" picture */
        } else {
          this.prev = cur; this.cur = new Uint8Array(n);
        }
        out.byte(0x21); out.byte(0xF9); out.byte(4); out.byte((1 << 2) | (useT ? 1 : 0)); out.u16(delay); out.byte(useT ? this.trans : 0); out.byte(0);
        out.byte(0x2C); out.u16(x0); out.u16(y0); out.u16(bw); out.u16(bh); out.byte(0);
        this.lzw.encode(out, data, bw * bh, Math.max(2, this.gbits));
      } else {
        if (!this.frames) this.header();
        var hs = new Hist(); hs.add(px, 250000);
        var pal = medianCut(hs, this.colours), m = new Mapper(pal), p = bitsFor(pal.length);
        if (this.dither === 'fs') indexFS(px, w, h, m, this.cur);
        else if (this.dither === 'bayer') indexBayer(px, w, h, m, this.cur, 255 / Math.cbrt(this.colours) * 0.6);
        else indexPlain(px, n, m, this.cur);
        out.byte(0x21); out.byte(0xF9); out.byte(4); out.byte(1 << 2); out.u16(delay); out.byte(0); out.byte(0);
        out.byte(0x2C); out.u16(0); out.u16(0); out.u16(w); out.u16(h); out.byte(0x80 | (p - 1));
        writeTable(out, pal, p);
        this.lzw.encode(out, this.cur, n, Math.max(2, p));
      }
      this.frames++;
      return out.n;
    };
    Session.prototype.finish = function () {
      if (!this.frames) { if (this.global && !this.gpal) this.gpal = [[0, 0, 0]]; this.header(); }
      this.out.byte(0x3B);
      return this.out.a.slice(0, this.out.n);
    };

    self.GIFMAKER = { Session: Session, medianCut: medianCut, Hist: Hist };

    if (inWorker) {
      var S = null;
      self.onmessage = function (e) {
        var m = e.data || {};
        try {
          if (m.t === 'begin') { S = new Session(m.o); self.postMessage({ t: 'ack', id: m.id, n: 0, bytes: 0 }); }
          else if (m.t === 'sample') { S.sample(new Uint8ClampedArray(m.px)); self.postMessage({ t: 'ack', id: m.id }); }
          else if (m.t === 'frame') { var b = S.frame(new Uint8ClampedArray(m.px), m.d); self.postMessage({ t: 'ack', id: m.id, n: S.frames, bytes: b }); }
          else if (m.t === 'end') { var buf = S.finish(); S = null; self.postMessage({ t: 'done', id: m.id, buf: buf.buffer }, [buf.buffer]); }
        } catch (err) { self.postMessage({ t: 'error', id: m.id, msg: String(err && err.message || err) }); }
      };
    }
  }
  root.GIFMAKER_LIB = lib;
  lib(root, false);
})(window);
