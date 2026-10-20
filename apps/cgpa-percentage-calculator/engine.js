/* CGPA & Percentage Calculator: pure maths, no DOM (window.CGPA).
   Every function takes plain numbers/arrays and returns plain objects, so app.js and the test can check them.
   Rules implemented (checked Oct 2026):
   - CBSE 9-point scale (used for Class 10 CGPA 2011-2017, still used by many schools): A1 91-100 = 10, A2 81-90 = 9,
     B1 71-80 = 8, B2 61-70 = 7, C1 51-60 = 6, C2 41-50 = 5, D 33-40 = 4, E below 33 (no grade point).
     CGPA = average grade point of the five main subjects; percentage = CGPA x 9.5.
   - University SGPA = sum(credit x grade point) / sum(credit); CGPA = sum of all credit points / sum of all credits
     (= SGPA weighted by credits).
   - Percentage from CGPA: x 10, x 9.5 (CBSE, DU), (CGPA - 0.75) x 10 (VTU, older UGC), 7.1 x CGPA + 11 (Mumbai
     University, 10-point), 7.4 x CGPA + 12 (Mumbai University, 7-point), custom a x CGPA + b.
   - 4.0 GPA: approximate band table (there is no official all-India rule). */
(function () {
  'use strict';

  /* empty boxes (null, undefined, '') are "no value", never 0: Number(null) would be 0 */
  function num(v, d) {
    if (v === null || v === undefined || v === '') return d === undefined ? 0 : d;
    v = Number(v); return isFinite(v) ? v : (d === undefined ? 0 : d);
  }
  function round(v, dp) { var m = Math.pow(10, dp === undefined ? 2 : dp); return Math.round((v + Number.EPSILON) * m) / m; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /* ---------------------------------------------------------------- CBSE */
  var CBSE_SCALE = [
    { grade: 'A1', min: 91, max: 100, gp: 10 },
    { grade: 'A2', min: 81, max: 90, gp: 9 },
    { grade: 'B1', min: 71, max: 80, gp: 8 },
    { grade: 'B2', min: 61, max: 70, gp: 7 },
    { grade: 'C1', min: 51, max: 60, gp: 6 },
    { grade: 'C2', min: 41, max: 50, gp: 5 },
    { grade: 'D', min: 33, max: 40, gp: 4 },
    { grade: 'E', min: 0, max: 32, gp: 0 }
  ];
  var CBSE_FACTOR = 9.5;

  /* marks out of max (default 100) -> { grade, gp, pct, pass } */
  function cbseGrade(marks, max) {
    max = num(max, 100) > 0 ? num(max, 100) : 100;
    var m = num(marks, NaN);
    if (!isFinite(m)) return null;
    var pct = clamp(m / max * 100, 0, 100);
    var row = CBSE_SCALE[CBSE_SCALE.length - 1];
    for (var i = 0; i < CBSE_SCALE.length; i++) { if (pct >= CBSE_SCALE[i].min) { row = CBSE_SCALE[i]; break; } }
    return { grade: row.grade, gp: row.gp, pct: round(pct, 2), pass: row.gp > 0 };
  }
  function cbseByGrade(grade) {
    for (var i = 0; i < CBSE_SCALE.length; i++) if (CBSE_SCALE[i].grade === grade) return CBSE_SCALE[i];
    return null;
  }
  function cbseCgpaToPct(cgpa) { return round(num(cgpa) * CBSE_FACTOR, 2); }
  function cbsePctToCgpa(pct) { return round(num(pct) / CBSE_FACTOR, 2); }
  /* overall CGPA from grade points (CBSE: average of the five main subjects) */
  function cbseOverall(gps) {
    var list = (gps || []).map(function (g) { return num(g, NaN); }).filter(function (g) { return isFinite(g); });
    if (!list.length) return null;
    var sum = list.reduce(function (a, b) { return a + b; }, 0);
    var cgpa = sum / list.length;
    return { cgpa: round(cgpa, 2), cgpa1: round(cgpa, 1), pct: round(cgpa * CBSE_FACTOR, 2), count: list.length, sum: sum };
  }

  /* "I have written `done` papers with an average of `avg` %; there are `total` papers; I want `target` % overall.
     What average do I need in the remaining papers?" (equal weight for every paper) */
  function neededAverage(done, avg, total, target) {
    done = Math.max(0, num(done)); total = Math.max(0, num(total)); avg = num(avg); target = num(target);
    var left = total - done;
    if (total <= 0 || left <= 0 || done < 0) return { ok: false, status: 'bad_input', left: left };
    var need = (target * total - avg * done) / left;
    var status = need > 100 ? 'impossible' : need <= 0 ? 'done' : 'possible';
    return { ok: true, need: round(need, 2), left: left, status: status, doneTotal: round(avg * done, 2), wantTotal: round(target * total, 2) };
  }

  /* ---------------------------------------------------------------- university */
  var SCALES = {
    '10': [{ g: 'O', p: 10 }, { g: 'A+', p: 9 }, { g: 'A', p: 8 }, { g: 'B+', p: 7 }, { g: 'B', p: 6 }, { g: 'C', p: 5 }, { g: 'P', p: 4 }, { g: 'F', p: 0 }],
    '4': [{ g: 'A', p: 4 }, { g: 'B', p: 3 }, { g: 'C', p: 2 }, { g: 'D', p: 1 }, { g: 'F', p: 0 }]
  };
  function scaleCopy(kind) { return (SCALES[kind] || SCALES['10']).map(function (r) { return { g: r.g, p: r.p }; }); }
  function scaleMax(scale) { return (scale || []).reduce(function (m, r) { return Math.max(m, num(r.p)); }, 0); }
  function pointsFor(scale, grade) {
    for (var i = 0; i < (scale || []).length; i++) if (scale[i].g === grade) return num(scale[i].p);
    return null;
  }

  /* subjects: [{ credit, gp }] -> { sgpa, credits, points, rows } (rows keep each credit point) */
  function sgpa(subjects) {
    var credits = 0, points = 0, rows = [];
    (subjects || []).forEach(function (s) {
      var c = Math.max(0, num(s.credit)), gp = num(s.gp, NaN);
      if (!isFinite(gp)) { rows.push({ credit: c, gp: null, cp: null }); return; }
      credits += c; points += c * gp; rows.push({ credit: c, gp: gp, cp: round(c * gp, 2) });
    });
    return { sgpa: credits > 0 ? round(points / credits, 2) : null, raw: credits > 0 ? points / credits : null, credits: round(credits, 2), points: round(points, 2), rows: rows };
  }

  /* semesters: [{ credits, points }] or [{ sgpa, credits }] -> CGPA weighted by credits */
  function cgpa(semesters) {
    var credits = 0, points = 0, n = 0;
    (semesters || []).forEach(function (s) {
      var c = Math.max(0, num(s.credits));
      if (c <= 0) return;
      var p = s.points !== undefined && s.points !== null ? num(s.points) : num(s.sgpa) * c;
      credits += c; points += p; n++;
    });
    return { cgpa: credits > 0 ? round(points / credits, 2) : null, raw: credits > 0 ? points / credits : null, credits: round(credits, 2), points: round(points, 2), semesters: n };
  }

  /* ---------------------------------------------------------------- percentage from CGPA */
  var FORMULAS = ['x10', 'x95', 'vtu', 'mu10', 'mu7', 'custom'];
  function formulaText(key, a, b) {
    switch (key) {
      case 'x10': return 'CGPA × 10';
      case 'x95': return 'CGPA × 9.5';
      case 'vtu': return '(CGPA − 0.75) × 10';
      case 'mu10': return '7.1 × CGPA + 11';
      case 'mu7': return '7.4 × CGPA + 12';
      default: return String(round(num(a, 10), 4)) + ' × CGPA ' + (num(b) < 0 ? '− ' : '+ ') + String(round(Math.abs(num(b)), 4));
    }
  }
  function pctFromCgpa(c, key, a, b) {
    c = num(c, NaN);
    if (!isFinite(c)) return null;
    var p;
    switch (key) {
      case 'x10': p = c * 10; break;
      case 'x95': p = c * 9.5; break;
      case 'vtu': p = (c - 0.75) * 10; break;
      case 'mu10': p = 7.1 * c + 11; break;
      case 'mu7': p = 7.4 * c + 12; break;
      default: p = num(a, 10) * c + num(b, 0);
    }
    return { pct: round(clamp(p, 0, 100), 2), raw: round(p, 2), clipped: p < 0 || p > 100, formula: formulaText(key, a, b) };
  }
  /* the inverse, for the conversions tab (percentage -> CGPA on a 10-point scale) */
  function cgpaFromPct(p, key, a, b) {
    p = num(p, NaN);
    if (!isFinite(p)) return null;
    var c;
    switch (key) {
      case 'x10': c = p / 10; break;
      case 'x95': c = p / 9.5; break;
      case 'vtu': c = p / 10 + 0.75; break;
      case 'mu10': c = (p - 11) / 7.1; break;
      case 'mu7': c = (p - 12) / 7.4; break;
      default: var aa = num(a, 10); c = aa === 0 ? NaN : (p - num(b, 0)) / aa;
    }
    if (!isFinite(c)) return null;
    var max = key === 'mu7' ? 7 : 10;
    return { cgpa: round(clamp(c, 0, max), 2), raw: round(c, 2), clipped: c < 0 || c > max, formula: formulaText(key, a, b) };
  }

  /* ---------------------------------------------------------------- 4.0 GPA bands (approximate) */
  var GPA_BANDS = [
    { min: 85, max: 100, gpa: 4.0, letter: 'A+' },
    { min: 75, max: 84.99, gpa: 3.7, letter: 'A' },
    { min: 65, max: 74.99, gpa: 3.3, letter: 'B+' },
    { min: 60, max: 64.99, gpa: 3.0, letter: 'B' },
    { min: 55, max: 59.99, gpa: 2.7, letter: 'C+' },
    { min: 50, max: 54.99, gpa: 2.3, letter: 'C' },
    { min: 40, max: 49.99, gpa: 2.0, letter: 'D' },
    { min: 0, max: 39.99, gpa: 0, letter: 'F' }
  ];
  function gpaFromPct(p) {
    p = num(p, NaN);
    if (!isFinite(p)) return null;
    p = clamp(p, 0, 100);
    for (var i = 0; i < GPA_BANDS.length; i++) if (p >= GPA_BANDS[i].min) return GPA_BANDS[i];
    return GPA_BANDS[GPA_BANDS.length - 1];
  }
  /* a 4.0 GPA -> the band at or just below it (3.5 -> the 3.3 band, 65-74.99 %) */
  function bandFromGpa(g) {
    g = num(g, NaN);
    if (!isFinite(g)) return null;
    g = clamp(g, 0, 4);
    for (var i = 0; i < GPA_BANDS.length; i++) if (g >= GPA_BANDS[i].gpa - 1e-9) return GPA_BANDS[i];
    return GPA_BANDS[GPA_BANDS.length - 1];
  }

  /* ---------------------------------------------------------------- marks */
  /* rows: [{ obt, max }] -> { obt, max, pct, rows (each with pct) } */
  function marksTotal(rows) {
    var obt = 0, max = 0, out = [];
    (rows || []).forEach(function (r, i) {
      var o = num(r.obt, NaN), m = num(r.max, NaN);
      var valid = isFinite(o) && isFinite(m) && m > 0 && o >= 0;
      if (valid) { obt += o; max += m; }
      out.push({ i: i, obt: valid ? o : null, max: valid ? m : null, pct: valid ? round(o / m * 100, 2) : null, valid: valid });
    });
    return { obt: round(obt, 2), max: round(max, 2), pct: max > 0 ? round(obt / max * 100, 2) : null, rows: out, count: out.filter(function (r) { return r.valid; }).length };
  }
  /* best n subjects by percentage */
  function bestOf(rows, n) {
    var all = marksTotal(rows).rows.filter(function (r) { return r.valid; });
    n = Math.round(num(n, all.length));
    if (n <= 0 || n > all.length) n = all.length;
    var sorted = all.slice().sort(function (a, b) { return b.pct - a.pct || b.obt - a.obt; });
    var chosen = sorted.slice(0, n);
    var obt = 0, max = 0;
    chosen.forEach(function (r) { obt += r.obt; max += r.max; });
    return { n: n, chosen: chosen.map(function (r) { return r.i; }), obt: round(obt, 2), max: round(max, 2), pct: max > 0 ? round(obt / max * 100, 2) : null, dropped: sorted.slice(n).map(function (r) { return r.i; }) };
  }
  /* internal (obt/max, weight %) + final (obt/max, weight %) -> overall % */
  function weighted(io, im, iw, fo, fm, fw) {
    im = num(im); fm = num(fm); iw = num(iw); fw = num(fw);
    if (im <= 0 || fm <= 0 || iw < 0 || fw < 0 || iw + fw <= 0) return null;
    var ip = clamp(num(io) / im * 100, 0, 1e9), fp = clamp(num(fo) / fm * 100, 0, 1e9);
    var overall = (ip * iw + fp * fw) / (iw + fw);
    return { ip: round(ip, 2), fp: round(fp, 2), overall: round(overall, 2), iPart: round(ip * iw / (iw + fw), 2), fPart: round(fp * fw / (iw + fw), 2) };
  }
  /* what % (and marks) do I need in the final exam to reach `target` % overall? */
  function finalNeeded(io, im, iw, fm, fw, target) {
    im = num(im); fm = num(fm); iw = num(iw); fw = num(fw); target = num(target);
    if (im <= 0 || fm <= 0 || iw < 0 || fw <= 0 || iw + fw <= 0) return null;
    var ip = num(io) / im * 100;
    var W = iw + fw;
    var iPart = ip * iw / W;                       /* points already in hand (out of 100) */
    var needPct = (target - iPart) * W / fw;       /* % needed in the final */
    var status = needPct > 100 ? 'impossible' : needPct <= 0 ? 'done' : 'possible';
    return { ip: round(ip, 2), iPart: round(iPart, 2), needPct: round(needPct, 2), needMarks: round(needPct / 100 * fm, 2), needMarksCeil: Math.max(0, Math.ceil(needPct / 100 * fm - 1e-9)), status: status, maxPossible: round(iPart + fw / W * 100, 2) };
  }

  window.CGPA = {
    round: round, num: num, clamp: clamp,
    CBSE_SCALE: CBSE_SCALE, CBSE_FACTOR: CBSE_FACTOR, cbseGrade: cbseGrade, cbseByGrade: cbseByGrade,
    cbseCgpaToPct: cbseCgpaToPct, cbsePctToCgpa: cbsePctToCgpa, cbseOverall: cbseOverall, neededAverage: neededAverage,
    SCALES: SCALES, scaleCopy: scaleCopy, scaleMax: scaleMax, pointsFor: pointsFor, sgpa: sgpa, cgpa: cgpa,
    FORMULAS: FORMULAS, formulaText: formulaText, pctFromCgpa: pctFromCgpa, cgpaFromPct: cgpaFromPct,
    GPA_BANDS: GPA_BANDS, gpaFromPct: gpaFromPct, bandFromGpa: bandFromGpa,
    marksTotal: marksTotal, bestOf: bestOf, weighted: weighted, finalNeeded: finalNeeded
  };
})();
