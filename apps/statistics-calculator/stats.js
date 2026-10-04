/* Statistics Calculator: pure maths, no DOM.  window.StatCore
   Conventions follow NCERT / CBSE:
   - mean, variance and SD divide by n (population form, NCERT Class 11)
   - grouped median / quartiles: l + ((p·n − cf) / f) × h, class = first class whose cf is greater than p·n
   - grouped mode: l + ((f1 − f0) / (2f1 − f0 − f2)) × h, f0 / f2 = 0 at the ends
   - quartiles of a list: value at position (n + 1)/4 and 3(n + 1)/4, interpolating between neighbours */
(function () {
  'use strict';
  var EPS = 1e-9;
  var ZEROS = [0x0966, 0x09E6, 0x0A66, 0x0AE6, 0x0B66, 0x0BE6, 0x0C66, 0x0CE6, 0x0D66, 0x0660, 0x06F0];
  var NATIVE = /[०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯٠-٩۰-۹]/g;

  /* Indian-script digits (०१२, ௧௨, ۱۲ …) → 0-9, unicode minus → '-' */
  function normDigits(s) {
    return String(s == null ? '' : s).replace(NATIVE, function (c) {
      var code = c.charCodeAt(0);
      for (var i = 0; i < ZEROS.length; i++) if (code >= ZEROS[i] && code <= ZEROS[i] + 9) return String(code - ZEROS[i]);
      return c;
    }).replace(/[−﹣－]/g, '-').replace(/٫/g, '.').replace(/٬/g, ',').replace(/[₹%]/g, '');
  }

  var NUM_RE = /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i;
  /* a number written with thousands separators: 1,000 · 12,500 · 1,20,000 (Indian) · 1,234,567 */
  var GROUPED_RE = /^[-+]?(\d{1,3}(,\d{3})+|\d{1,2}(,\d{2})*,\d{3})(\.\d+)?$/;
  /* one table cell: '' → null, bad → NaN. Commas are allowed only as real thousands separators
     (1,200 or 1,20,000); "12 15" or "12,15" in one cell is an error, not 1215. */
  function parseCell(s) {
    s = normDigits(s).trim();
    if (s === '') return null;
    if (s.indexOf(',') >= 0) {
      if (!GROUPED_RE.test(s)) return NaN;
      s = s.replace(/,/g, '');
    }
    if (!NUM_RE.test(s)) return NaN;
    var v = Number(s);
    return isFinite(v) ? v : NaN;
  }

  /* a pasted list: commas, spaces, tabs, new lines, semicolons and | all separate numbers.
     Exception: when the numbers are separated by spaces / new lines and every comma sits inside a
     number like 1,200 or 1,20,000 (a column copied from Excel), the commas are thousands separators. */
  function parseRaw(text, max) {
    var src = normDigits(text), thousands = false;
    var words = src.split(/[\s;|]+/).filter(Boolean).map(function (w) { return w.replace(/,+$/, ''); });
    if (words.length > 1) {
      var withComma = words.filter(function (w) { return w.indexOf(',') >= 0; });
      if (withComma.length && withComma.every(function (w) { return GROUPED_RE.test(w); })) {
        thousands = true;
        src = words.map(function (w) { return w.replace(/,/g, ''); }).join(' ');
      }
    }
    var toks = src.split(/[\s,;|]+/), vals = [], bad = [], badCount = 0;
    for (var i = 0; i < toks.length; i++) {
      var tk = toks[i];
      if (!tk) continue;
      var v = NUM_RE.test(tk) ? Number(tk) : NaN;
      if (!isFinite(v)) { badCount++; if (bad.length < 8 && bad.indexOf(tk) < 0) bad.push(tk.slice(0, 20)); continue; }
      vals.push(v);
    }
    var total = vals.length;
    if (max && vals.length > max) vals = vals.slice(0, max);
    return { vals: vals, bad: bad, badCount: badCount, total: total, cut: total > vals.length, thousands: thousands };
  }

  function clean(v) { return isFinite(v) ? parseFloat(v.toPrecision(12)) : v; }
  function isWhole(v) { return Math.abs(v - Math.round(v)) < EPS; }

  function itemsFromValues(vals) {
    var a = vals.slice().sort(function (x, y) { return x - y; }), items = [];
    for (var i = 0; i < a.length; i++) {
      var last = items[items.length - 1];
      if (last && last.x === a[i]) last.f++;
      else items.push({ x: a[i], f: 1 });
    }
    return { sorted: a, items: items };
  }

  /* ---------- discrete table rows [{x, f}] (strings) → {items, errors, bad, merged} ---------- */
  function prepDiscrete(rows) {
    var errors = [], bad = [], map = {}, list = [], merged = false;
    rows.forEach(function (r, i) {
      var xs = String(r.x == null ? '' : r.x), fs = String(r.f == null ? '' : r.f);
      if (!xs.trim() && !fs.trim()) return;
      var x = parseCell(xs), f = parseCell(fs);
      /* a value whose frequency is still blank counts 0 times (no error while the row is being typed) */
      if (f === null && x !== null && !isNaN(x)) f = 0;
      if (x === null || isNaN(x)) { bad.push([i, 'x']); }
      if (f === null || isNaN(f)) { bad.push([i, 'f']); }
      if (x === null || isNaN(x) || f === null || isNaN(f)) { errors.push({ key: 'err_row', vars: { r: i + 1 } }); return; }
      if (f < 0) { bad.push([i, 'f']); errors.push({ key: 'err_negf', vars: { r: i + 1 } }); return; }
      if (!isWhole(f)) { bad.push([i, 'f']); errors.push({ key: 'err_fint', vars: { r: i + 1 } }); return; }
      f = Math.round(f);
      var k = String(x);
      if (map[k]) { map[k].f += f; merged = true; }
      else { map[k] = { x: x, f: f }; list.push(map[k]); }
    });
    if (errors.length) return { errors: errors, bad: bad };
    if (!list.length) return { errors: [{ key: 'err_empty_t' }], bad: bad };
    list.sort(function (a, b) { return a.x - b.x; });
    var n = list.reduce(function (s, it) { return s + it.f; }, 0);
    if (n <= 0) return { errors: [{ key: 'err_total0' }], bad: bad };
    return { items: list, errors: [], bad: bad, merged: merged };
  }

  /* ---------- grouped rows [{l, u, f}] → {cls, incl, orig, errors, bad} ---------- */
  function prepGrouped(rows) {
    var errors = [], bad = [], cls = [];
    rows.forEach(function (r, i) {
      var ls = String(r.l == null ? '' : r.l), us = String(r.u == null ? '' : r.u), fs = String(r.f == null ? '' : r.f);
      if (!ls.trim() && !us.trim() && !fs.trim()) return;
      var l = parseCell(ls), u = parseCell(us), f = parseCell(fs), ok = true;
      /* a class whose frequency is still blank (new row, quick classes) is an empty class, f = 0 */
      if (f === null && l !== null && !isNaN(l) && u !== null && !isNaN(u)) f = 0;
      [[l, 'l'], [u, 'u'], [f, 'f']].forEach(function (p) { if (p[0] === null || isNaN(p[0])) { bad.push([i, p[1]]); ok = false; } });
      if (!ok) { errors.push({ key: 'err_row', vars: { r: i + 1 } }); return; }
      if (f < 0) { bad.push([i, 'f']); errors.push({ key: 'err_negf', vars: { r: i + 1 } }); return; }
      if (!isWhole(f)) { bad.push([i, 'f']); errors.push({ key: 'err_fint', vars: { r: i + 1 } }); return; }
      if (u <= l) { bad.push([i, 'u']); errors.push({ key: 'err_limits', vars: { r: i + 1 } }); return; }
      cls.push({ l: l, u: u, f: Math.round(f), row: i });
    });
    if (errors.length) return { errors: errors, bad: bad };
    if (!cls.length) return { errors: [{ key: 'err_empty_t' }], bad: bad };
    cls.sort(function (a, b) { return a.l - b.l || a.u - b.u; });
    var orig = cls.map(function (c) { return { l: c.l, u: c.u }; });
    var minW = Infinity, gaps = [];
    cls.forEach(function (c) { minW = Math.min(minW, c.u - c.l); });
    for (var i = 0; i + 1 < cls.length; i++) {
      var g = clean(cls[i + 1].l - cls[i].u);
      if (g < -EPS) {
        bad.push([cls[i + 1].row, 'l']);
        return { errors: [{ key: 'err_overlap', vars: { a: [cls[i].l, cls[i].u], b: [cls[i + 1].l, cls[i + 1].u] } }], bad: bad };
      }
      gaps.push(g);
    }
    var incl = 0;
    if (gaps.length && gaps.some(function (g) { return g > EPS; })) {
      var g0 = gaps[0];
      var same = gaps.every(function (g) { return Math.abs(g - g0) <= Math.max(EPS, Math.abs(g0) * 1e-6); });
      if (same && g0 <= 1 + EPS && g0 < minW) {
        incl = g0;
        cls.forEach(function (c) { c.l = clean(c.l - g0 / 2); c.u = clean(c.u + g0 / 2); });
      } else {
        var at = 0; while (at < gaps.length && gaps[at] <= EPS) at++;
        bad.push([cls[Math.min(at + 1, cls.length - 1)].row, 'l']);
        return { errors: [{ key: 'err_gap', vars: { a: [orig[at].l, orig[at].u] } }], bad: bad };
      }
    }
    var n = cls.reduce(function (s, c) { return s + c.f; }, 0);
    if (n <= 0) return { errors: [{ key: 'err_total0' }], bad: bad };
    return { cls: cls, orig: orig, incl: incl, errors: [], bad: bad };
  }

  /* ---------- statistics of an ungrouped frequency list (raw data uses this too) ---------- */
  function ungrouped(items) {
    var n = 0, sfx = 0, cf = [], i;
    for (i = 0; i < items.length; i++) { n += items[i].f; sfx += items[i].f * items[i].x; cf.push(n); }
    var mean = sfx / n, ss = 0;
    for (i = 0; i < items.length; i++) ss += items[i].f * (items[i].x - mean) * (items[i].x - mean);
    function idxAt(k) { for (var j = 0; j < items.length; j++) if (items[j].f > 0 && cf[j] >= k - EPS) return j; return items.length - 1; }
    function valueAt(k) { return items[idxAt(k)].x; }
    function posValue(p) {
      if (p <= 1) return { p: p, a: 1, b: 1, frac: 0, va: valueAt(1), vb: valueAt(1), v: valueAt(1), clamp: p < 1 };
      if (p >= n) return { p: p, a: n, b: n, frac: 0, va: valueAt(n), vb: valueAt(n), v: valueAt(n), clamp: p > n };
      var a = Math.floor(p + EPS), frac = p - a;
      if (frac < EPS) frac = 0;
      var va = valueAt(a), vb = frac ? valueAt(a + 1) : va;
      return { p: p, a: a, b: a + 1, frac: frac, va: va, vb: vb, v: va + frac * (vb - va) };
    }
    var med;
    if (n % 2 === 1) { var k = (n + 1) / 2; med = { odd: true, p: k, v: valueAt(k), idx: [idxAt(k)] }; }
    else { var p1 = n / 2, p2 = n / 2 + 1; med = { odd: false, p: p1, q: p2, va: valueAt(p1), vb: valueAt(p2), v: (valueAt(p1) + valueAt(p2)) / 2, idx: [idxAt(p1), idxAt(p2)] }; }
    var nz = items.filter(function (it) { return it.f > 0; });
    var maxf = 0; nz.forEach(function (it) { maxf = Math.max(maxf, it.f); });
    var modes = nz.filter(function (it) { return it.f === maxf; }).map(function (it) { return it.x; });
    var noMode = nz.length > 1 && modes.length === nz.length;
    if (noMode) modes = [];
    return {
      n: n, sum: sfx, mean: mean, ss: ss, variance: ss / n, sd: Math.sqrt(ss / n),
      sVariance: n > 1 ? ss / (n - 1) : NaN,
      cf: cf, median: med, modes: modes, maxf: maxf, noMode: noMode,
      min: nz[0].x, max: nz[nz.length - 1].x, range: nz[nz.length - 1].x - nz[0].x,
      q1: posValue((n + 1) / 4), q3: posValue(3 * (n + 1) / 4), valueAt: valueAt, idxAt: idxAt
    };
  }

  /* ---------- statistics of grouped classes (already continuous) ---------- */
  function grouped(cls) {
    var n = 0, sfx = 0, cf = [], xs = [], k = cls.length, i;
    for (i = 0; i < k; i++) { var x = (cls[i].l + cls[i].u) / 2; xs.push(x); n += cls[i].f; sfx += cls[i].f * x; cf.push(n); }
    var mean = sfx / n, ss = 0;
    for (i = 0; i < k; i++) ss += cls[i].f * (xs[i] - mean) * (xs[i] - mean);
    function locate(pos) { for (var j = 0; j < k; j++) if (cf[j] - pos > EPS) return j; return k - 1; }
    function byFormula(pos) {
      var j = locate(pos), c = cls[j], cfb = j > 0 ? cf[j - 1] : 0, h = c.u - c.l;
      return { j: j, pos: pos, l: c.l, cfb: cfb, f: c.f, h: h, v: c.l + (pos - cfb) / c.f * h };
    }
    var maxf = 0; cls.forEach(function (c) { maxf = Math.max(maxf, c.f); });
    var mj = -1, ties = 0;
    cls.forEach(function (c, j) { if (c.f === maxf) { ties++; if (mj < 0) mj = j; } });
    var f1 = maxf, f0 = mj > 0 ? cls[mj - 1].f : 0, f2 = mj < k - 1 ? cls[mj + 1].f : 0, den = 2 * f1 - f0 - f2;
    var allEqual = k > 1 && ties === k, mh = cls[mj].u - cls[mj].l;
    var mode = { j: mj, l: cls[mj].l, f0: f0, f1: f1, f2: f2, den: den, h: mh, ties: ties, allEqual: allEqual,
      v: (allEqual || Math.abs(den) < EPS) ? NaN : cls[mj].l + (f1 - f0) / den * mh };
    var first = 0, last = k - 1;
    while (first < k && cls[first].f === 0) first++;
    while (last > 0 && cls[last].f === 0) last--;
    var widths = cls.map(function (c) { return clean(c.u - c.l); });
    var minW = Math.min.apply(null, widths), maxW = Math.max.apply(null, widths);
    return {
      n: n, sum: sfx, mean: mean, ss: ss, variance: ss / n, sd: Math.sqrt(ss / n), sVariance: n > 1 ? ss / (n - 1) : NaN,
      xs: xs, cf: cf, median: byFormula(n / 2), q1: byFormula(n / 4), q3: byFormula(3 * n / 4), mode: mode,
      min: cls[first].l, max: cls[last].u, range: cls[last].u - cls[first].l,
      widths: widths, equalWidths: (maxW - minW) <= Math.max(EPS, maxW * 1e-9), minW: minW
    };
  }

  /* greatest common factor of decimals (for h in the step-deviation method) */
  function gcdDec(vals) {
    var d = 0;
    vals.forEach(function (v) { var s = String(clean(Math.abs(v))); var m = s.split('.')[1]; if (m && !/e/i.test(s)) d = Math.max(d, m.length); });
    d = Math.min(d, 6);
    var sc = Math.pow(10, d), g = 0;
    function gcd(a, b) { while (b) { var t = a % b; a = b; b = t; } return a; }
    vals.forEach(function (v) { var x = Math.round(Math.abs(v) * sc); if (x && x < 9e15) g = gcd(g, x); });
    return g ? clean(g / sc) : 1;
  }

  function mostCommon(arr) {
    var cnt = {}, best = arr[0], bc = 0;
    arr.forEach(function (v) { var k = String(v); cnt[k] = (cnt[k] || 0) + 1; if (cnt[k] > bc) { bc = cnt[k]; best = v; } });
    return best;
  }

  /* a "nice" class width (1, 2, 2.5, 5 × 10^k) for about 5-10 classes */
  function niceWidth(min, max, n) {
    var range = max - min;
    if (!(range > 0)) return 1;
    var k = Math.min(10, Math.max(5, Math.ceil(1 + 3.322 * Math.log10(Math.max(2, n)))));
    var raw = range / k, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
    var w = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
    return clean(w);
  }

  /* group sorted values into classes [start + i·w, start + (i+1)·w) */
  function groupValues(items, start, w, maxClasses) {
    var nzMax = -Infinity, nzMin = Infinity;
    items.forEach(function (it) { if (it.f > 0) { nzMax = Math.max(nzMax, it.x); nzMin = Math.min(nzMin, it.x); } });
    if (!(w > 0) || !isFinite(start) || start > nzMin) return null;
    var count = Math.floor((nzMax - start) / w + EPS) + 1;
    if (count > (maxClasses || 60)) return null;
    var cls = [];
    for (var i = 0; i < count; i++) cls.push({ l: clean(start + i * w), u: clean(start + (i + 1) * w), f: 0 });
    items.forEach(function (it) {
      var j = Math.floor((it.x - start) / w + EPS);
      j = Math.max(0, Math.min(count - 1, j));
      if (it.x < cls[j].l - EPS && j > 0) j--;
      cls[j].f += it.f;
    });
    return cls;
  }

  window.StatCore = {
    EPS: EPS, normDigits: normDigits, parseCell: parseCell, parseRaw: parseRaw, clean: clean,
    itemsFromValues: itemsFromValues, prepDiscrete: prepDiscrete, prepGrouped: prepGrouped,
    ungrouped: ungrouped, grouped: grouped, gcdDec: gcdDec, mostCommon: mostCommon,
    niceWidth: niceWidth, groupValues: groupValues
  };
})();
