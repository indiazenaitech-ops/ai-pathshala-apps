/* Data Cleaning Lab: the cleaning engine (no DOM). window.DCL
   A dataset is { headers: [..], rows: [[..], ..] } (strings).
   A recipe is a list of steps { type, on, ...params }; run() replays it on a fresh copy of the data.
   Columns are referred to by NAME, so a recipe can be replayed on next month's file. */
(function () {
  'use strict';

  /* ---------------- small helpers ---------------- */
  var MISSING = { '': 1, 'na': 1, 'n/a': 1, 'n.a.': 1, 'n.a': 1, 'null': 1, 'none': 1, 'nil': 1, '-': 1, '--': 1, '---': 1, '?': 1, '#n/a': 1, 'nan': 1, 'undefined': 1, '(blank)': 1 };
  function isMissing(v) { return v == null || MISSING[String(v).trim().toLowerCase()] === 1; }
  function tidy(v) { return String(v == null ? '' : v).replace(/[\s ​]+/g, ' ').trim(); }
  function isUntidy(v) { return v !== '' && v !== tidy(v); }
  function round2(n) { return Math.round(n * 100) / 100; }
  function numStr(n) {
    var r = round2(n);
    if (Object.is(r, -0)) r = 0;
    if (Math.abs(r) >= 1e21) return String(r);
    var s = r.toFixed(2).replace(/\.?0+$/, '');
    return s;
  }
  function pad(n, w) { n = String(n); while (n.length < (w || 2)) n = '0' + n; return n; }

  /* ---------------- numbers and money ---------------- */
  var UNITS = [
    [/(?:crores?|crs?\.?|करोड़|करोड|কোটি|કરોડ|ਕਰੋੜ|କୋଟି|கோடி|కోట్లు|కోటి|ಕೋಟಿ|കോടി|کروڑ)$/i, 1e7],
    [/(?:lakhs?|lacs?|lkh|लाख|লাখ|লক্ষ|લાખ|ਲੱਖ|ଲକ୍ଷ|லட்சம்|லட்சங்கள்|లక్షలు|లక్ష|ಲಕ್ಷ|ലക്ഷം|لاکھ)$/i, 1e5],
    [/(?:thousands?|हज़ार|हजार|হাজার|હજાર|ਹਜ਼ਾਰ|ହଜାର|ஆயிரம்|వేలు|వేయి|ಸಾವಿರ|ആയിരം|ہزار)$/i, 1e3],
    [/(?:\d|\s)(l)$/i, 1e5], [/(?:\d|\s)(k)$/i, 1e3], [/(?:\d|\s)(cr)$/i, 1e7]
  ];
  var CURRENCY = /₹|\brs\.?|\binr\b|\brupees?\b|रु\.?|रुपये|रुपए|টাকা|রুপি|રૂ\.?|ਰੁ\.?|ரூ\.?|రూ\.?|ರೂ\.?|രൂ\.?|روپے/gi;
  /* "₹1,20,000" → 120000, "1.2 lakh" → 120000, "Rs. 4500/-" → 4500, "(500)" → -500. null if it is not a number. */
  function parseNumber(s) {
    if (s == null) return null;
    var t = tidy(s);
    if (isMissing(t)) return null;
    var neg = false, mult = 1;
    if (/^\(.*\)$/.test(t)) { neg = true; t = t.slice(1, -1).trim(); }
    t = t.replace(/\/-$/, '').trim();
    if (/^-/.test(t)) { neg = !neg; t = t.slice(1).trim(); }
    for (var i = 0; i < UNITS.length; i++) {
      var m = t.match(UNITS[i][0]);
      if (m) { mult = UNITS[i][1]; t = t.slice(0, t.length - (m[1] || m[0]).length).trim(); break; }
    }
    t = t.replace(CURRENCY, ' ').replace(/\/-$/, '').replace(/[\s,]/g, '');
    if (/^-/.test(t)) { neg = !neg; t = t.slice(1); }
    if (t.charAt(0) === '+') t = t.slice(1);
    if (!/^(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t)) return null;
    var n = parseFloat(t) * mult;
    if (!isFinite(n)) return null;
    return neg ? -n : n;
  }
  function isCleanNumber(v) { return /^-?\d+(\.\d+)?$/.test(v); }

  /* ---------------- dates ---------------- */
  var MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  function monthOf(w) {
    w = String(w).toLowerCase().replace(/\.$/, '');
    if (w.length < 3) return 0;
    if (w === 'sept') return 9;
    for (var i = 0; i < 12; i++) if (MONTHS[i].indexOf(w) === 0) return i + 1;
    return 0;
  }
  function dim(y, m) { return [31, (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; }
  function okDate(y, m, d) { return y >= 1000 && y <= 9999 && m >= 1 && m <= 12 && d >= 1 && d <= dim(y, m); }
  function fullYear(y, raw) {
    if (raw.length > 2) return y;
    var pivot = (new Date().getFullYear() % 100) + 10;
    return y <= pivot ? 2000 + y : 1900 + y;
  }
  /* order: 'dmy' (India) or 'mdy' (USA) for dates like 05/03/2026. Returns {y,m,d} or null. */
  function parseDate(s, order, allowSerial) {
    var t = tidy(s);
    if (isMissing(t)) return null;
    t = t.replace(/[T\s]\d{1,2}:\d{2}(:\d{2})?(\.\d+)?\s*(am|pm|z)?$/i, '').trim();
    var m, y, mo, d;
    if ((m = t.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/))) { y = +m[1]; mo = +m[2]; d = +m[3]; }
    else if ((m = t.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4}|\d{2})$/))) {
      var a = +m[1], b = +m[2];
      y = fullYear(+m[3], m[3]);
      if (order === 'mdy') { mo = a; d = b; } else { d = a; mo = b; }
      if (mo > 12 && d <= 12) { var x = mo; mo = d; d = x; }      /* only one reading is possible */
    }
    else if ((m = t.match(/^(\d{1,2})(?:st|nd|rd|th)?[\s\-\/.,]*([A-Za-z]{3,9})\.?[\s\-\/.,]*(\d{4}|\d{2})$/))) { d = +m[1]; mo = monthOf(m[2]); y = fullYear(+m[3], m[3]); }
    else if ((m = t.match(/^([A-Za-z]{3,9})\.?[\s\-\/.]*(\d{1,2})(?:st|nd|rd|th)?[\s,\-\/.]+(\d{4})$/))) { mo = monthOf(m[1]); d = +m[2]; y = +m[3]; }
    else if ((m = t.match(/^(\d{4})(\d{2})(\d{2})$/))) { y = +m[1]; mo = +m[2]; d = +m[3]; }
    else if (allowSerial && (m = t.match(/^(\d{5})(\.\d+)?$/)) && +m[1] >= 20000 && +m[1] <= 80000) {
      /* Excel / Google Sheets serial day number (days since 30-12-1899) */
      var dt = new Date(Date.UTC(1899, 11, 30) + (+m[1]) * 86400000);
      y = dt.getUTCFullYear(); mo = dt.getUTCMonth() + 1; d = dt.getUTCDate();
    }
    else return null;
    return okDate(y, mo, d) ? { y: y, m: mo, d: d } : null;
  }
  function fmtDate(o, to) { return to === 'ymd' ? o.y + '-' + pad(o.m) + '-' + pad(o.d) : pad(o.d) + '-' + pad(o.m) + '-' + o.y; }
  function strictDate(v) {
    var m;
    if ((m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(v)) && okDate(+m[3], +m[2], +m[1])) return 'dmy';
    if ((m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)) && okDate(+m[1], +m[2], +m[3])) return 'ymd';
    return '';
  }

  /* ---------------- Indian mobile numbers ---------------- */
  /* "+91 98765 43210" / "09876543210" / "98765-43210" → "9876543210"; '' when it is not a valid mobile number */
  function normPhone(s) {
    var t = tidy(s);
    if (isMissing(t) || /[a-z]/i.test(t)) return '';
    var d = t.replace(/\D/g, '');
    if (d.length === 12 && d.slice(0, 2) === '91') d = d.slice(2);
    else if (d.length === 11 && d.charAt(0) === '0') d = d.slice(1);
    else if (d.length === 13 && d.slice(0, 3) === '091') d = d.slice(3);
    else if (d.length === 14 && d.slice(0, 4) === '0091') d = d.slice(4);
    return /^[6-9]\d{9}$/.test(d) ? d : '';
  }
  function phoneLike(s) {
    var t = tidy(s);
    if (/[a-z]/i.test(t) || !/^[+(\d][\d\s().+\-\/]*$/.test(t)) return false;
    var n = t.replace(/\D/g, '').length;
    return normPhone(t) !== '' || (n >= 5 && n <= 14 && /[\s+\-]/.test(t)) || (n >= 10 && n <= 13);
  }
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/;

  /* ---------------- column types ---------------- */
  /* Guess what a column holds from its values: phone, date, number, email or text. */
  function detectType(values) {
    var vals = [], step = Math.max(1, Math.floor(values.length / 3000));
    for (var i = 0; i < values.length; i += step) if (!isMissing(values[i])) vals.push(values[i]);
    if (vals.length < 2) return 'text';
    var c = { phone: 0, date: 0, number: 0, email: 0 };
    vals.forEach(function (v) {
      var t = tidy(v);
      if (t.indexOf('@') > 0) { c.email++; return; }
      if (parseDate(t, 'dmy', false)) { c.date++; return; }
      var digits = t.replace(/\D/g, '').length;
      if (digits >= 10 && phoneLike(t)) { c.phone++; return; }
      if (phoneLike(t) && /^\+|^0\d|\d[\s\-]\d{3,}[\s\-]\d/.test(t) && digits >= 5 && digits <= 14 && !/,/.test(t)) { c.phone++; return; }
      if (parseNumber(t) !== null) c.number++;
    });
    var n = vals.length, best = 'text', bestN = 0;
    ['email', 'phone', 'date', 'number'].forEach(function (k) { if (c[k] > bestN) { best = k; bestN = c[k]; } });
    return bestN / n >= 0.6 ? best : 'text';
  }
  /* Is a (non-missing) value in the standard form for its column type? */
  function validator(type, values) {
    if (type === 'phone') return function (v) { return /^[6-9]\d{9}$/.test(v); };
    if (type === 'number') return isCleanNumber;
    if (type === 'email') return function (v) { return EMAIL.test(v) && v === v.toLowerCase(); };
    if (type === 'date') {
      var dmy = 0, ymd = 0;
      for (var i = 0; i < values.length; i++) { var k = strictDate(values[i]); if (k === 'dmy') dmy++; else if (k === 'ymd') ymd++; }
      var want = ymd > dmy ? 'ymd' : 'dmy';
      return function (v) { return strictDate(v) === want; };
    }
    return null;
  }

  /* ---------------- quality report ---------------- */
  function rowKey(vals, loose) {
    var out = new Array(vals.length);
    for (var i = 0; i < vals.length; i++) out[i] = loose ? tidy(vals[i]).toLowerCase() : vals[i];
    return out.join('\u0001');
  }
  /* table: {headers, rows}; types: optional {name: type} to reuse */
  function quality(table, types) {
    var H = table.headers, R = table.rows, nc = H.length, nr = R.length;
    var per = [], miss = 0, bad = 0, sp = 0;
    for (var c = 0; c < nc; c++) {
      var col = new Array(nr);
      for (var r = 0; r < nr; r++) col[r] = R[r][c] == null ? '' : R[r][c];
      var type = types && types[H[c]] ? types[H[c]] : detectType(col);
      var ok = validator(type, col), m = 0, b = 0, s = 0;
      for (r = 0; r < nr; r++) {
        var v = col[r];
        if (isMissing(v)) { m++; continue; }
        if (isUntidy(v)) s++;
        if (ok && !ok(v)) b++;
      }
      per.push({ name: H[c], type: type, missing: m, invalid: b, spaces: s });
      miss += m; bad += b; sp += s;
    }
    var seen = Object.create(null), dup = 0;
    for (var i = 0; i < nr; i++) { var k = rowKey(R[i], true); if (seen[k]) dup++; else seen[k] = 1; }
    var cells = nr * nc, problems = 0;
    /* a cell counts once even if it has two problems; whole duplicate rows count as problem cells */
    for (var p = 0; p < per.length; p++) problems += per[p].missing + Math.max(per[p].invalid, per[p].spaces);
    problems += dup * nc;
    var score = cells ? Math.max(0, Math.min(100, Math.round(100 * (1 - problems / cells)))) : 0;
    return { rows: nr, cols: nc, cells: cells, missing: miss, invalid: bad, spaces: sp, dups: dup, score: score, per: per };
  }

  /* ---------------- the cleaning steps ---------------- */
  /* ds = { cols: [{name, src}], rows: [{o, v:[]}] }  (src / o = position in the original file; src -1 = new column) */
  function colIdx(ds, name) { for (var i = 0; i < ds.cols.length; i++) if (ds.cols[i].name === name) return i; return -1; }
  function uniqName(ds, name, skip) {
    var base = tidy(name) || 'Column', n = base, k = 2;
    while (ds.cols.some(function (c, i) { return i !== skip && c.name === n; })) n = base + ' (' + (k++) + ')';
    return n;
  }
  function sepOf(code) { return { comma: ',', space: ' ', semicolon: ';', hyphen: '-', slash: '/', pipe: '|', at: '@', dot: '.' }[code] || code || ','; }
  function cols1(ds, p) { var i = colIdx(ds, p.col); return i < 0 ? { err: 'nocol', col: p.col } : i; }
  function mapCol(ds, i, fn) {
    var n = 0, bad = 0;
    for (var r = 0; r < ds.rows.length; r++) {
      var v = ds.rows[r].v[i], res = fn(v == null ? '' : v);
      if (res === undefined) continue;
      if (res === false) { bad++; continue; }
      if (res !== v) { ds.rows[r].v[i] = res; n++; }
    }
    return { n: n, bad: bad };
  }
  function titleCase(s) { return s.toLowerCase().replace(/(^|[\s\-(\/"'.])(\p{Ll})/gu, function (m, a, b) { return a + b.toUpperCase(); }); }
  function sentenceCase(s) { var l = s.toLowerCase(); return l.replace(/^(\P{L}*)(\p{Ll})/u, function (m, a, b) { return a + b.toUpperCase(); }); }

  var STEPS = {
    trim: function (ds, p) {
      var idx = [], n = 0;
      if (p.cols && p.cols.length) { for (var j = 0; j < p.cols.length; j++) { var i = colIdx(ds, p.cols[j]); if (i < 0) return { err: 'nocol', col: p.cols[j] }; idx.push(i); } }
      else idx = ds.cols.map(function (c, i) { return i; });
      idx.forEach(function (i) { n += mapCol(ds, i, function (v) { return tidy(v); }).n; });
      return { n: n };
    },
    case: function (ds, p) {
      var i = cols1(ds, p); if (i.err) return i;
      var f = p.mode === 'upper' ? function (v) { return v.toUpperCase(); } : p.mode === 'lower' ? function (v) { return v.toLowerCase(); } : p.mode === 'sentence' ? sentenceCase : titleCase;
      return { n: mapCol(ds, i, function (v) { return isMissing(v) ? v : f(v); }).n };
    },
    dedupe: function (ds, p) {
      var idx = [];
      for (var j = 0; j < (p.by || []).length; j++) { var i = colIdx(ds, p.by[j]); if (i < 0) return { err: 'nocol', col: p.by[j] }; idx.push(i); }
      var seen = Object.create(null), before = ds.rows.length;
      ds.rows = ds.rows.filter(function (row) {
        var vals = idx.length ? idx.map(function (i) { return row.v[i]; }) : row.v;
        var k = rowKey(vals, p.loose !== false);
        if (seen[k]) return false;
        seen[k] = 1; return true;
      });
      return { removed: before - ds.rows.length };
    },
    fill: function (ds, p) {
      var i = cols1(ds, p); if (i.err) return i;
      var how = p.how || 'value';
      if (how === 'drop') {
        var before = ds.rows.length;
        ds.rows = ds.rows.filter(function (row) { return !isMissing(row.v[i]); });
        return { removed: before - ds.rows.length };
      }
      var fillWith = null;
      if (how === 'value') fillWith = p.value == null ? '' : String(p.value);
      if (how === 'blank') fillWith = '';
      if (how === 'mean' || how === 'median') {
        var nums = [];
        ds.rows.forEach(function (row) { var x = parseNumber(row.v[i]); if (x !== null) nums.push(x); });
        if (!nums.length) return { n: 0, bad: 0, nonum: 1 };
        if (how === 'mean') fillWith = numStr(nums.reduce(function (a, b) { return a + b; }, 0) / nums.length);
        else { nums.sort(function (a, b) { return a - b; }); var h = nums.length >> 1; fillWith = numStr(nums.length % 2 ? nums[h] : (nums[h - 1] + nums[h]) / 2); }
      }
      var prev = null, n = 0;
      ds.rows.forEach(function (row) {
        var v = row.v[i];
        if (!isMissing(v)) { prev = v; return; }
        var nv = how === 'prev' ? prev : fillWith;
        if (nv !== null && nv !== v) { row.v[i] = nv; n++; }
      });
      return { n: n, filled: fillWith };
    },
    date: function (ds, p) {
      var i = cols1(ds, p); if (i.err) return i;
      return mapCol(ds, i, function (v) {
        if (isMissing(v)) return undefined;
        var o = parseDate(v, p.from || 'dmy', true);
        return o ? fmtDate(o, p.to || 'dmy') : false;
      });
    },
    phone: function (ds, p) {
      var i = cols1(ds, p); if (i.err) return i;
      var bad = 0;
      var r = mapCol(ds, i, function (v) {
        if (isMissing(v)) return undefined;
        var d = normPhone(v);
        if (d) return d;
        bad++;
        return p.bad === 'blank' ? '' : false;
      });
      return { n: r.n, bad: bad };
    },
    money: function (ds, p) {
      var i = cols1(ds, p); if (i.err) return i;
      var bad = 0;
      var r = mapCol(ds, i, function (v) {
        if (isMissing(v)) return undefined;
        var x = parseNumber(v);
        if (x !== null) return numStr(x);
        bad++;
        return p.bad === 'blank' ? '' : false;
      });
      return { n: r.n, bad: bad };
    },
    split: function (ds, p) {
      var i = cols1(ds, p); if (i.err) return i;
      var sep = sepOf(p.sep), parts = 1;
      if (!sep) return { n: 0 };
      var pieces = ds.rows.map(function (row) {
        var v = row.v[i] == null ? '' : String(row.v[i]);
        var a = sep === ' ' ? tidy(v).split(' ') : v.split(sep).map(tidy);
        if (a.length > 10) a = a.slice(0, 9).concat([a.slice(9).join(sep === ' ' ? ' ' : sep)]);
        if (a.length > parts) parts = a.length;
        return a;
      });
      var names = (p.names || []).map(tidy).filter(Boolean), base = ds.cols[i].name, newCols = [];
      for (var k = 0; k < parts; k++) newCols.push({ name: names[k] || base + ' ' + (k + 1), src: -1 });
      var at = i + 1;
      ds.cols.splice.apply(ds.cols, [at, 0].concat(newCols));
      ds.rows.forEach(function (row, r) {
        var add = []; for (var k = 0; k < parts; k++) add.push(pieces[r][k] || '');
        row.v.splice.apply(row.v, [at, 0].concat(add));
      });
      for (k = 0; k < parts; k++) ds.cols[at + k].name = uniqName(ds, ds.cols[at + k].name, at + k);
      if (!p.keep) { ds.cols.splice(i, 1); ds.rows.forEach(function (row) { row.v.splice(i, 1); }); }
      return { added: parts };
    },
    merge: function (ds, p) {
      var idx = [];
      for (var j = 0; j < (p.cols || []).length; j++) { var i = colIdx(ds, p.cols[j]); if (i < 0) return { err: 'nocol', col: p.cols[j] }; idx.push(i); }
      if (idx.length < 2) return { n: 0 };
      var sep = p.sep == null ? ' ' : sepOf(p.sep);
      if (sep === ',' || sep === ';' || sep === '|') sep = sep + ' ';
      var at = Math.max.apply(null, idx) + 1;
      ds.cols.splice(at, 0, { name: 'tmp', src: -1 });
      ds.rows.forEach(function (row) {
        var vals = idx.map(function (i) { return tidy(row.v[i]); }).filter(function (v) { return !isMissing(v); });
        row.v.splice(at, 0, vals.join(sep));
      });
      ds.cols[at].name = uniqName(ds, p.name || p.cols.join(' + '), at);
      if (!p.keep) {
        idx.sort(function (a, b) { return b - a; }).forEach(function (i) {
          ds.cols.splice(i, 1); ds.rows.forEach(function (row) { row.v.splice(i, 1); });
        });
      }
      return { added: 1 };
    },
    replace: function (ds, p) {
      var idx;
      if (p.col) { var i = colIdx(ds, p.col); if (i < 0) return { err: 'nocol', col: p.col }; idx = [i]; }
      else idx = ds.cols.map(function (c, i) { return i; });
      var find = p.find == null ? '' : String(p.find), repl = p.repl == null ? '' : String(p.repl), n = 0;
      if (!find && !p.whole) return { n: 0 };
      var lf = find.toLowerCase();
      idx.forEach(function (i) {
        n += mapCol(ds, i, function (v) {
          if (p.whole) return (p.icase ? tidy(v).toLowerCase() === lf.trim() : tidy(v) === find.trim()) ? repl : v;
          if (!p.icase) return v.split(find).join(repl);
          var out = '', low = v.toLowerCase(), pos = 0, at;
          while ((at = low.indexOf(lf, pos)) >= 0) { out += v.slice(pos, at) + repl; pos = at + find.length; }
          return out + v.slice(pos);
        }).n;
      });
      return { n: n };
    },
    rename: function (ds, p) {
      var i = cols1(ds, p); if (i.err) return i;
      var to = tidy(p.to);
      if (!to || to === ds.cols[i].name) return { n: 0 };
      ds.cols[i].name = uniqName(ds, to, i);
      return { renamed: 1 };
    },
    del: function (ds, p) {
      var idx = [];
      for (var j = 0; j < (p.cols || []).length; j++) { var i = colIdx(ds, p.cols[j]); if (i < 0) return { err: 'nocol', col: p.cols[j] }; idx.push(i); }
      idx.sort(function (a, b) { return b - a; }).forEach(function (i) {
        ds.cols.splice(i, 1); ds.rows.forEach(function (row) { row.v.splice(i, 1); });
      });
      return { deleted: idx.length };
    }
  };
  var TYPES = Object.keys(STEPS);

  /* Run a recipe on the original table. Returns { table, origin (row index in the original per output row),
     srcCol (original column per output column, -1 = new), results: one per step } */
  function run(orig, steps) {
    var ds = {
      cols: orig.headers.map(function (h, i) { return { name: h, src: i }; }),
      rows: orig.rows.map(function (r, i) { return { o: i, v: r.slice() }; })
    };
    var results = (steps || []).map(function (s) {
      if (!s || !s.on || !STEPS[s.type]) return null;
      try { return STEPS[s.type](ds, s); } catch (e) { return { err: 'fail' }; }
    });
    return {
      table: { headers: ds.cols.map(function (c) { return c.name; }), rows: ds.rows.map(function (r) { return r.v; }) },
      origin: ds.rows.map(function (r) { return r.o; }),
      srcCol: ds.cols.map(function (c) { return c.src; }),
      results: results
    };
  }
  function cellChanged(orig, out, r, c) {
    var sc = out.srcCol[c], v = out.table.rows[r][c];
    if (sc < 0) return true;
    var ov = orig.rows[out.origin[r]][sc];
    return (ov == null ? '' : ov) !== (v == null ? '' : v);
  }
  function countChanged(orig, out) {
    var n = 0, R = out.table.rows;
    for (var r = 0; r < R.length; r++) for (var c = 0; c < R[r].length; c++) if (cellChanged(orig, out, r, c)) n++;
    return n;
  }

  /* recipe file: { recipe: 'data-cleaning-lab', version: 1, steps: [...] } */
  var PARAMS = ['col', 'cols', 'by', 'mode', 'loose', 'how', 'value', 'from', 'to', 'bad', 'sep', 'names', 'keep', 'name', 'find', 'repl', 'whole', 'icase'];
  function cleanStep(s) {
    if (!s || typeof s !== 'object' || TYPES.indexOf(s.type) < 0) return null;
    var o = { type: s.type, on: s.on !== false };
    PARAMS.forEach(function (k) {
      if (!(k in s)) return;
      var v = s[k];
      if (Array.isArray(v)) o[k] = v.map(function (x) { return String(x); });
      else if (typeof v === 'boolean') o[k] = v;
      else if (v != null) o[k] = String(v);
    });
    return o;
  }
  function exportRecipe(steps) {
    return JSON.stringify({ recipe: 'data-cleaning-lab', version: 1, steps: steps.map(cleanStep).filter(Boolean) }, null, 2);
  }
  function importRecipe(text) {
    var o;
    try { o = JSON.parse(String(text).replace(/^﻿/, '')); } catch (e) { return null; }
    var list = Array.isArray(o) ? o : o && Array.isArray(o.steps) ? o.steps : null;
    if (!list) return null;
    return list.map(cleanStep).filter(Boolean);
  }

  /* ---------------- reading CSV text ---------------- */
  function detectDelim(text) {
    var lines = [], start = 0;
    for (var k = 0; k < 6 && start < text.length; k++) {
      var e = text.indexOf('\n', start); if (e < 0) e = text.length;
      lines.push(text.slice(start, e)); start = e + 1;
    }
    var best = ',', bestScore = -1;
    [',', ';', '\t', '|'].forEach(function (d) {
      var counts = lines.filter(function (l) { return l.trim(); }).map(function (l) {
        var n = 0, q = false;
        for (var i = 0; i < l.length; i++) { var ch = l.charAt(i); if (ch === '"') q = !q; else if (ch === d && !q) n++; }
        return n;
      });
      if (!counts.length || !counts[0]) return;
      var same = counts.filter(function (n) { return n === counts[0]; }).length;
      var score = same * 1000 + counts[0];
      if (score > bestScore) { bestScore = score; best = d; }
    });
    return best;
  }
  /* rows[][] → table with unique, non-empty headers and rows padded to the same width */
  function toTable(rows) {
    if (!rows || !rows.length) return { headers: [], rows: [] };
    var width = 0;
    rows.forEach(function (r) { if (r.length > width) width = r.length; });
    var head = rows[0].map(tidy), headers = [], seen = {};
    for (var c = 0; c < width; c++) {
      var h = head[c] || ('Column ' + (c + 1)), n = h, k = 2;
      while (seen[n]) n = h + ' (' + (k++) + ')';
      seen[n] = 1; headers.push(n);
    }
    var body = [];
    for (var r = 1; r < rows.length; r++) {
      var row = rows[r];
      if (row.length < width) { row = row.slice(); while (row.length < width) row.push(''); }
      body.push(row);
    }
    return { headers: headers, rows: body };
  }

  window.DCL = {
    isMissing: isMissing, tidy: tidy, parseNumber: parseNumber, numStr: numStr, parseDate: parseDate, fmtDate: fmtDate,
    normPhone: normPhone, detectType: detectType, quality: quality, run: run, cellChanged: cellChanged, countChanged: countChanged,
    validator: validator, exportRecipe: exportRecipe, importRecipe: importRecipe, cleanStep: cleanStep,
    detectDelim: detectDelim, toTable: toTable, TYPES: TYPES, sepOf: sepOf
  };
})();
