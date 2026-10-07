/* Data core shared by the Data & analytics apps (same file in csv-data-explorer, chart-maker, pivot-table-maker).
   Fast CSV reading (separator auto-detect: , ; tab |), Indian number parsing (₹1,20,000 → 120000), dates
   (DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD), yes/no, column type detection, statistics and the fictional samples.
   Everything runs on the device; nothing is sent anywhere. */
window.DATACORE = (function () {
  'use strict';

  /* ---------- missing values ---------- */
  var MISSING = { '': 1, 'na': 1, 'n/a': 1, 'n.a.': 1, '#n/a': 1, 'null': 1, 'none': 1, 'nan': 1, '-': 1, '--': 1, '—': 1, '–': 1, 'nil': 1, '?': 1 };
  function isMissing(s) { return s == null || MISSING[String(s).trim().toLowerCase()] === 1; }

  /* ---------- separator detection ---------- */
  var DELIMS = [',', ';', '\t', '|'];
  function countOutsideQuotes(line, d) {
    var n = 0, q = false;
    for (var i = 0; i < line.length; i++) { var c = line[i]; if (c === '"') q = !q; else if (!q && c === d) n++; }
    return n;
  }
  function detectDelim(text) {
    var lines = String(text).slice(0, 65536).split(/\r?\n/).filter(function (l) { return l.trim() !== ''; }).slice(0, 25);
    if (!lines.length) return ',';
    var best = ',', bestScore = 0;
    DELIMS.forEach(function (d) {
      var counts = lines.map(function (l) { return countOutsideQuotes(l, d); });
      if (!counts[0]) return;
      var same = counts.filter(function (c) { return c === counts[0]; }).length / counts.length;
      var score = same * 10 + Math.min(counts[0], 50) / 50;
      if (score > bestScore) { bestScore = score; best = d; }
    });
    return best;
  }

  /* ---------- CSV parsing (quotes, "" escapes, CRLF, newlines inside quotes) ---------- */
  function parseRows(text, d) {
    var rows = [], row = [], i = 0, n = text.length, dc = d.charCodeAt(0), k, cc;
    if (!n) return rows;
    while (i < n) {
      if (text.charCodeAt(i) === 34) {                     /* quoted field */
        i++; var buf = '', s = i;
        for (;;) {
          var j = text.indexOf('"', i);
          if (j < 0) { buf += text.slice(s); i = n; break; }
          if (text.charCodeAt(j + 1) === 34) { buf += text.slice(s, j + 1); i = j + 2; s = i; }
          else { buf += text.slice(s, j); i = j + 1; break; }
        }
        k = i; while (k < n) { cc = text.charCodeAt(k); if (cc === dc || cc === 10 || cc === 13) break; k++; }
        if (k > i) buf += text.slice(i, k);
        i = k; row.push(buf);
      } else {
        k = i; while (k < n) { cc = text.charCodeAt(k); if (cc === dc || cc === 10 || cc === 13) break; k++; }
        row.push(text.slice(i, k)); i = k;
      }
      if (i >= n) break;
      cc = text.charCodeAt(i);
      if (cc === dc) { i++; if (i >= n) row.push(''); continue; }
      if (cc === 13 && text.charCodeAt(i + 1) === 10) i++;
      i++; rows.push(row); row = [];
    }
    if (row.length) rows.push(row);
    return rows.filter(function (r) { for (var x = 0; x < r.length; x++) if (r[x].trim() !== '') return true; return false; });
  }

  /* Build a dataset from header + rows of strings. Columns are stored column-wise for speed. */
  function fromRows(headerRow, body, extra) {
    var width = headerRow.length, ragged = 0, r, c;
    for (r = 0; r < body.length; r++) { if (body[r].length !== headerRow.length) ragged++; if (body[r].length > width) width = body[r].length; }
    var headers = [], seen = {};
    for (c = 0; c < width; c++) {
      var h = c < headerRow.length ? String(headerRow[c]).trim() : '';
      if (!h) h = null;                                  /* the app names it "Column N" in the user's language */
      if (h) { var base = h, k = 2; while (seen[h.toLowerCase()]) h = base + ' (' + (k++) + ')'; seen[h.toLowerCase()] = 1; }
      headers.push(h);
    }
    var cols = [];
    for (c = 0; c < width; c++) cols.push(new Array(body.length));
    for (r = 0; r < body.length; r++) {
      var row = body[r];
      for (c = 0; c < width; c++) { var v = c < row.length ? row[c] : ''; cols[c][r] = v === '' ? '' : String(v).trim(); }
    }
    var ds = { headers: headers, cols: cols, n: body.length, width: width, ragged: ragged };
    if (extra) for (var key in extra) ds[key] = extra[key];
    analyse(ds);
    return ds;
  }

  function load(text) {
    text = String(text || '').replace(/^﻿/, '');
    if (!text.trim()) return null;
    var d = detectDelim(text);
    var rows = parseRows(text, d);
    if (!rows.length) return null;
    return fromRows(rows[0], rows.slice(1), { delim: d });
  }

  /* ---------- numbers: "₹1,20,000" → 120000, "(500)" → -500, "12.5%" → 12.5 ---------- */
  var SIMPLE = /^-?\d+(\.\d+)?$/;
  var NUMBODY = /^(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;
  var GROUPED = /^\d{1,3}(,\d{2,3})+(\.\d+)?$/;
  function parseNum(s) {
    if (s == null) return NaN;
    s = String(s).trim();
    if (!s) return NaN;
    if (SIMPLE.test(s)) return +s;
    var neg = false;
    s = s.replace(/[\s  ']/g, '');
    if (s.charAt(0) === '(' && s.charAt(s.length - 1) === ')') { neg = true; s = s.slice(1, -1); }
    for (var guard = 0; guard < 3; guard++) {
      var f = s.charAt(0);
      if (f === '-' || f === '−') { neg = !neg; s = s.slice(1); continue; }
      if (f === '+') { s = s.slice(1); continue; }
      var m = /^(₹|rs\.?|inr|\$|€|£)/i.exec(s);
      if (m) { s = s.slice(m[0].length); continue; }
      break;
    }
    s = s.replace(/(\/-|%|₹)$/, '');
    var mult = 1, um = /(lakhs?|lacs?|crores?|cr)\.?$/i.exec(s);
    if (um) { mult = /^c/i.test(um[1]) ? 1e7 : 1e5; s = s.slice(0, um.index); }
    if (s.indexOf(',') >= 0) { if (GROUPED.test(s)) s = s.replace(/,/g, ''); else return NaN; }
    if (!NUMBODY.test(s)) return NaN;
    var v = parseFloat(s) * mult;
    return neg ? -v : v;
  }

  /* ---------- dates → UTC milliseconds ---------- */
  var DMY = /^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/, YMD = /^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/;
  function mk(y, m, d) {
    if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1800 || y > 2200) return NaN;
    var t = Date.UTC(y, m - 1, d), dt = new Date(t);
    return dt.getUTCDate() === d && dt.getUTCMonth() === m - 1 ? t : NaN;
  }
  function parseDate(s) {
    if (s == null) return NaN;
    s = String(s).trim();
    var m = DMY.exec(s); if (m) return mk(+m[3], +m[2], +m[1]);
    m = YMD.exec(s); if (m) return mk(+m[1], +m[2], +m[3]);
    return NaN;
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmtDate(t) { if (!isFinite(t)) return ''; var d = new Date(t); return pad2(d.getUTCDate()) + '-' + pad2(d.getUTCMonth() + 1) + '-' + d.getUTCFullYear(); }

  /* ---------- yes / no (English plus the yes/no words of all 12 languages) ---------- */
  var BOOL = { yes: 1, y: 1, 'true': 1, no: 0, n: 0, 'false': 0, haan: 1, han: 1, nahi: 0, nahin: 0 };
  (function () {
    var C = window.APP_CONTENT || {};
    Object.keys(C).forEach(function (L) { if (C[L].yesno) { BOOL[C[L].yesno[0].toLowerCase()] = 1; BOOL[C[L].yesno[1].toLowerCase()] = 0; } });
  })();
  function parseBool(s) { var v = BOOL[String(s).trim().toLowerCase()]; return v === undefined ? NaN : v; }

  /* ---------- column types ---------- */
  function analyse(ds) {
    ds.types = []; ds.num = []; ds.missing = []; ds.invalid = [];
    for (var c = 0; c < ds.width; c++) {
      var col = ds.cols[c], n = col.length, miss = 0, nNum = 0, nDate = 0, nBool = 0, i, v;
      var probe = n > 3000 ? 3000 : n;                    /* decide the type from the first rows, then check all */
      for (i = 0; i < probe; i++) {
        v = col[i];
        if (isMissing(v)) continue;
        if (parseBool(v) === parseBool(v)) nBool++;
        if (parseDate(v) === parseDate(v)) nDate++;
        else if (parseNum(v) === parseNum(v)) nNum++;
      }
      var seen = 0; for (i = 0; i < probe; i++) if (!isMissing(col[i])) seen++;
      var type = 'text';
      if (seen === 0) type = 'empty';
      else if (nBool === seen) type = 'bool';
      else if (nDate >= 0.9 * seen) type = 'date';
      else if (nNum >= 0.9 * seen) type = 'number';
      var arr = null, bad = 0;
      if (type === 'number' || type === 'date' || type === 'bool') {
        var fn = type === 'number' ? parseNum : type === 'date' ? parseDate : parseBool;
        arr = new Float64Array(n);
        for (i = 0; i < n; i++) {
          v = col[i];
          if (isMissing(v)) { miss++; arr[i] = NaN; continue; }
          var x = fn(v);
          if (x !== x) bad++;
          arr[i] = x;
        }
      } else {
        for (i = 0; i < n; i++) if (isMissing(col[i])) miss++;
      }
      ds.types.push(type); ds.num.push(arr); ds.missing.push(miss); ds.invalid.push(bad);
    }
    return ds;
  }

  /* ---------- statistics ---------- */
  function sortedValid(arr, idx) {
    var out = new Float64Array(idx ? idx.length : arr.length), k = 0, i, v;
    if (idx) { for (i = 0; i < idx.length; i++) { v = arr[idx[i]]; if (v === v) out[k++] = v; } }
    else { for (i = 0; i < arr.length; i++) { v = arr[i]; if (v === v) out[k++] = v; } }
    out = out.subarray(0, k); out.sort(); return out;
  }
  function quantile(sorted, p) {
    var n = sorted.length; if (!n) return NaN;
    var h = (n - 1) * p, lo = Math.floor(h), hi = Math.ceil(h);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (h - lo);
  }
  function numStats(arr, idx) {
    var s = sortedValid(arr, idx), n = s.length;
    if (!n) return { count: 0, sum: 0, min: NaN, max: NaN, mean: NaN, median: NaN, sd: NaN, sorted: s };
    var sum = 0, i; for (i = 0; i < n; i++) sum += s[i];
    var mean = sum / n, ss = 0; for (i = 0; i < n; i++) { var dv = s[i] - mean; ss += dv * dv; }
    return { count: n, sum: sum, min: s[0], max: s[n - 1], mean: mean, median: quantile(s, 0.5), sd: n > 1 ? Math.sqrt(ss / (n - 1)) : 0, q1: quantile(s, 0.25), q3: quantile(s, 0.75), sorted: s };
  }
  function pearson(a, b) {
    var n = 0, sa = 0, sb = 0, i;
    for (i = 0; i < a.length; i++) { var x = a[i], y = b[i]; if (x === x && y === y) { n++; sa += x; sb += y; } }
    if (n < 3) return { r: NaN, n: n };
    var ma = sa / n, mb = sb / n, sab = 0, saa = 0, sbb = 0;
    for (i = 0; i < a.length; i++) { var p = a[i], q = b[i]; if (p === p && q === q) { var dx = p - ma, dy = q - mb; sab += dx * dy; saa += dx * dx; sbb += dy * dy; } }
    if (!saa || !sbb) return { r: NaN, n: n };
    return { r: sab / Math.sqrt(saa * sbb), n: n };
  }
  /* "nice" axis ticks */
  function niceTicks(lo, hi, want) {
    if (!(isFinite(lo) && isFinite(hi))) return [0, 1];
    if (lo === hi) { if (lo === 0) { hi = 1; } else { var pad = Math.abs(lo) * 0.1; lo -= pad; hi += pad; } }
    var span = hi - lo, step = Math.pow(10, Math.floor(Math.log10(span / (want || 5))));
    var err = (want || 5) / (span / step);
    if (err <= 0.15) step *= 10; else if (err <= 0.35) step *= 5; else if (err <= 0.75) step *= 2;
    var a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step, out = [];
    for (var v = a; v <= b + step / 2; v += step) out.push(Math.round(v / step) * step);
    return out;
  }

  /* ---------- CSV text out ---------- */
  function toCSV(rows) { return window.EDU ? EDU.csv.stringify(rows) : rows.map(function (r) { return r.join(','); }).join('\n'); }
  function toTSV(rows) { return rows.map(function (r) { return r.map(function (v) { return String(v == null ? '' : v).replace(/[\t\r\n]+/g, ' '); }).join('\t'); }).join('\n'); }

  /* ---------- seeded random (samples look the same every time) ---------- */
  function rng(seed) {
    var a = seed >>> 0;
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function inr(n) {           /* 120000 → "₹1,20,000" (Indian grouping, always Latin digits) */
    var s = String(Math.round(Math.abs(n))), last = s.slice(-3), rest = s.slice(0, -3);
    if (rest) last = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last;
    return (n < 0 ? '-' : '') + '₹' + last;
  }

  /* ---------- fictional samples, built in the current language (V = APP_CONTENT[lang]) ---------- */
  var MARKS = {
    maths: [78, 92, 45, 67, 88, 56, 28, 99, 72, 61, 83, 49, 95, 70, 58, 81],
    science: [82, 88, '', 71, 90, 60, 41, 97, 68, '', 79, 52, 91, 74, 63, 85],
    english: [74, 85, 58, 'N/A', 80, 66, 47, 90, 77, 69, 72, 55, 88, 81, 62, 79],
    attend: [92, 98, 75, 88, 95, 81, 68, 99, 90, 85, 93, 72, 97, 89, 80, 94],
    dob: ['14-03-2012', '02-07-2012', '21-11-2011', '09-01-2012', '30-05-2012', '17-08-2011', '05-12-2011', '23-02-2012', '11-06-2012', '28-09-2011', '07-04-2012', '19-10-2011', '03-01-2012', '25-07-2012', '12-12-2011', '08-05-2012']
  };
  var RAIN = [[95, 260, 250, 170], [210, 330, 250, 180], [160, 310, 270, 200], [260, 330, 300, 260], [50, 70, 100, 110], [55, 160, 150, 70],
    [200, 270, 210, 150], [110, 330, 230, 150], [650, 700, 400, 250], [210, 340, 360, 240], [70, 190, 170, 80], [430, 410, 330, 260]];
  var RAIN_REGION = [0, 3, 2, 2, 1, 3, 1, 3, 1, 2, 0, 4];
  var ITEM_PRICE = [60, 45, 48, 140, 35, 180, 120, 30], ITEM_CAT = [0, 0, 0, 2, 1, 0, 0, 2];
  var PRODUCT_PRICE = [60, 120, 850, 250, 150];
  var REGION_PEOPLE = [[10, 3], [15, 4], [1, 12], [11, 8]];

  function sampleMarks(V) {
    var H = V.h, head = [H.roll, H.name, H.gender, H.dob, V.subjects[0], V.subjects[1], V.subjects[2], H.attend, H.passed], rows = [];
    for (var i = 0; i < 16; i++) {
      var pass = MARKS.maths[i] >= 33 && (MARKS.science[i] === '' || MARKS.science[i] >= 33);
      rows.push([String(i + 1), V.names[i], V.gender[i % 2 ? 0 : 1], MARKS.dob[i], String(MARKS.maths[i]), String(MARKS.science[i]), String(MARKS.english[i]), String(MARKS.attend[i]), V.yesno[pass ? 0 : 1]]);
    }
    return { headers: head, rows: rows };
  }
  function sampleShop(V) {
    var H = V.h, head = [H.date, H.bill, H.item, H.category, H.qty, H.price, H.amount, H.payment], rows = [], r = rng(2026), bill = 1001;
    for (var day = 1; day <= 30; day++) {
      var nb = 3 + Math.floor(r() * 4);
      for (var b = 0; b < nb; b++) {
        var it = Math.floor(r() * 8), q = 1 + Math.floor(r() * 5), p = r(), pay = p < 0.55 ? 1 : p < 0.9 ? 0 : 2;
        rows.push([fmtDate(Date.UTC(2026, 8, day)), String(bill++), V.items[it], V.itemcats[ITEM_CAT[it]], String(q), String(ITEM_PRICE[it]), inr(q * ITEM_PRICE[it]), V.payments[pay]]);
      }
    }
    return { headers: head, rows: rows };
  }
  function sampleRain(V) {
    var H = V.h, mm = ' (' + H.mm + ')', head = [H.state, H.region, V.months[5] + mm, V.months[6] + mm, V.months[7] + mm, V.months[8] + mm, H.total + mm], rows = [];
    for (var i = 0; i < 12; i++) {
      var R = RAIN[i], tot = R[0] + R[1] + R[2] + R[3];
      rows.push([V.states[i], V.regions[RAIN_REGION[i]], String(R[0]), String(R[1]), String(R[2]), String(R[3]), String(tot)]);
    }
    return { headers: head, rows: rows };
  }
  function sampleSales(V) {
    var H = V.h, head = [H.date, H.month, H.region, H.product, H.person, H.qty, H.amount], rows = [], r = rng(7), start = Date.UTC(2025, 3, 1), list = [];
    for (var i = 0; i < 240; i++) {
      var t = start + Math.floor(r() * 365) * 86400000, reg = Math.floor(r() * 4), pr = Math.floor(r() * 5);
      var person = REGION_PEOPLE[reg][r() < 0.5 ? 0 : 1], q = pr === 2 ? 1 + Math.floor(r() * 6) : 2 + Math.floor(r() * 19);
      list.push([t, reg, pr, person, q]);
    }
    list.sort(function (a, b) { return a[0] - b[0]; });
    list.forEach(function (x) {
      rows.push([fmtDate(x[0]), V.months[new Date(x[0]).getUTCMonth()], V.regions[x[1]], V.products[x[2]], V.names[x[3]], String(x[4]), String(x[4] * PRODUCT_PRICE[x[2]])]);
    });
    return { headers: head, rows: rows };
  }
  var SAMPLES = { marks: sampleMarks, shop: sampleShop, rain: sampleRain, sales: sampleSales };
  function sample(id, V) { var s = SAMPLES[id](V); var ds = fromRows(s.headers, s.rows, { delim: ',' }); ds.sample = id; return ds; }
  function sampleRaw(id, V) { return SAMPLES[id](V); }

  return {
    isMissing: isMissing, detectDelim: detectDelim, parseRows: parseRows, fromRows: fromRows, load: load, analyse: analyse,
    parseNum: parseNum, parseDate: parseDate, parseBool: parseBool, fmtDate: fmtDate, inr: inr,
    numStats: numStats, sortedValid: sortedValid, quantile: quantile, pearson: pearson, niceTicks: niceTicks,
    toCSV: toCSV, toTSV: toTSV, rng: rng, sample: sample, sampleRaw: sampleRaw, MARKS: MARKS
  };
})();
