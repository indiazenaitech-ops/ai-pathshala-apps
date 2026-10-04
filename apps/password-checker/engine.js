/* Password Strength Lab: the strength estimator (a small, explainable cousin of zxcvbn).
   Pure functions, no DOM, nothing leaves the device.

   1. Character-set maths: pool = 26 (a-z) + 26 (A-Z) + 10 (0-9) + 33 (symbols, space) + 100 (other letters).
   2. Pattern spotting: common passwords, words, names, places (also l33t / reversed / Capitalised),
      dates, years, mobile numbers, numbers, sequences (1234, abcd), keyboard walks (qwerty, 1qaz), repeats.
   3. The cheapest way to cover the whole password with pieces is found (dynamic programming).
      Guesses of the pieces multiply: total guesses = g1 × g2 × ... (a random piece costs pool^length).
   4. Time = guesses / 10 billion guesses per second (an offline attack on a stolen password file). */
(function (root) {
  'use strict';
  var D = root.PW_DATA || { common: [], en: [], hi: [], names: [], places: [], famousDates: [], pairs: [] };
  var RATE = 1e10;
  var MAXLEN = 256;            /* = the input's maxlength; longer input (never typed in the app) is analysed in chunks */
  var MAXW = 20;               /* longest dictionary word we look for */
  var REF_YEAR = new Date().getFullYear();
  var POOL = { lower: 26, upper: 26, digit: 10, symbol: 33, other: 100 };
  var LOG10_2 = Math.log10(2);

  function uniq(a) { var seen = Object.create(null), out = []; a.forEach(function (w) { w = String(w).toLowerCase(); if (w && !seen[w]) { seen[w] = 1; out.push(w); } }); return out; }
  var COMMON = uniq(D.common), NAMES = uniq(D.names), PLACES = uniq(D.places);
  var BAD = Object.create(null);
  COMMON.concat(NAMES, PLACES).forEach(function (w) { BAD[w] = 1; });
  /* Passphrase lists: no common passwords, names or places, so every word is really worth "1 of N". */
  var EN = uniq(D.en).filter(function (w) { return !BAD[w] && /^[a-z]{3,10}$/.test(w); });
  var enSet = Object.create(null); EN.forEach(function (w) { enSet[w] = 1; });
  var HI = uniq(D.hi).filter(function (w) { return !BAD[w] && !enSet[w] && /^[a-z]{2,12}$/.test(w); });
  var BOTH = EN.concat(HI);

  /* dictionary: word -> { kind, g } (smallest guess count wins) */
  var DICT = Object.create(null);
  function addList(list, kind, gFn) {
    list.forEach(function (w, i) { var g = gFn(i); if (w.length >= 3 && (!DICT[w] || DICT[w].g > g)) DICT[w] = { kind: kind, g: g }; });
  }
  addList(COMMON, 'common', function (i) { return i + 1; });
  addList(NAMES, 'name', function () { return NAMES.length; });
  addList(PLACES, 'place', function () { return PLACES.length; });
  addList(EN, 'word', function () { return EN.length; });
  addList(HI, 'hindi', function () { return HI.length; });
  /* everyday English words that are not passphrase words (mylife, bestfriend): 1 of all the English words we know */
  var EXTRA = uniq(D.enExtra || []).filter(function (w) { return !DICT[w] && /^[a-z]{3,}$/.test(w); });
  addList(EXTRA, 'word', function () { return EN.length + EXTRA.length; });

  var LEET = { '4': ['a'], '@': ['a'], '3': ['e'], '1': ['i', 'l'], '!': ['i'], '|': ['i', 'l'], '0': ['o'], '$': ['s'], '5': ['s'], '7': ['t'], '+': ['t'], '9': ['g'], '6': ['g'], '8': ['b'], '2': ['z'] };

  function classOf(c) {
    if (c >= 'a' && c <= 'z') return 'lower';
    if (c >= 'A' && c <= 'Z') return 'upper';
    if (c >= '0' && c <= '9') return 'digit';
    var code = c.codePointAt(0);
    if (code >= 32 && code < 127) return 'symbol';
    return 'other';
  }
  function isWordChar(c) { var k = classOf(c); return k !== 'symbol'; }
  function nCk(n, k) { if (k > n) return 0; if (k === 0) return 1; var r = 1; for (var d = 1; d <= k; d++) { r *= n; r /= d; n--; } return r; }
  function lg(x) { return Math.log2(Math.max(1, x)); }

  /* ---------------- keyboard (QWERTY) ---------------- */
  var ROWS = [['`1234567890-=', '~!@#$%^&*()_+'], ['qwertyuiop[]\\', 'QWERTYUIOP{}|'], ["asdfghjkl;'", 'ASDFGHJKL:"'], ['zxcvbnm,./', 'ZXCVBNM<>?']];
  var OFF = [0, 1.5, 1.75, 2.25];
  var KEYPOS = Object.create(null), KEYS = [];
  ROWS.forEach(function (r, ri) {
    for (var k = 0; k < r[0].length; k++) {
      KEYPOS[r[0][k]] = { r: ri, x: OFF[ri] + k, sh: false };
      KEYPOS[r[1][k]] = { r: ri, x: OFF[ri] + k, sh: true };
      KEYS.push(KEYPOS[r[0][k]]);
    }
  });
  function adjacent(a, b) {
    var dr = b.r - a.r, dx = b.x - a.x;
    return (dr === 0 && Math.abs(dx) === 1) || (Math.abs(dr) === 1 && Math.abs(dx) <= 0.8);
  }
  var KB_START = KEYS.length, KB_DEG = (function () {
    var tot = 0; KEYS.forEach(function (a) { KEYS.forEach(function (b) { if (a !== b && adjacent(a, b)) tot++; }); });
    return tot / KEYS.length;
  })();

  /* ---------------- pattern finders ---------------- */
  function capsInfo(chars) {
    var U = 0, L = 0, first = false, last = false, letters = [];
    chars.forEach(function (c) { var k = classOf(c); if (k === 'upper') { U++; letters.push(1); } else if (k === 'lower') { L++; letters.push(0); } });
    if (!U) return { kind: 'none', mult: 1 };
    if (!L) return { kind: 'all', mult: 2 };
    first = letters[0] === 1 && U === 1; last = letters[letters.length - 1] === 1 && U === 1;
    if (first) return { kind: 'first', mult: 2 };
    if (last) return { kind: 'last', mult: 2 };
    var v = 0; for (var i = 1; i <= Math.min(U, L); i++) v += nCk(U + L, i);
    return { kind: 'mixed', mult: Math.max(2, v) };
  }

  function leetVariants(sub) {
    var opts = sub.map(function (c) { return LEET[c] ? [c].concat(LEET[c]) : [c]; });
    var total = opts.reduce(function (p, o) { return p * o.length; }, 1);
    if (total > 64) opts = sub.map(function (c) { return LEET[c] ? [LEET[c][0]] : [c]; });  /* too many: full swap only */
    var out = [{ w: '', subs: 0 }];
    opts.forEach(function (o, idx) {
      var next = [];
      out.forEach(function (p) { o.forEach(function (ch) { next.push({ w: p.w + ch, subs: p.subs + (ch !== sub[idx] ? 1 : 0) }); }); });
      out = next;
    });
    return out.filter(function (v) { return v.subs > 0; });
  }

  function dictMatches(s, lower, out) {
    var n = s.length;
    for (var i = 0; i < n; i++) {
      var w = lower[i] + (lower[i + 1] || ''), leetN = (LEET[lower[i]] ? 1 : 0) + (LEET[lower[i + 1]] ? 1 : 0);
      for (var j = i + 3; j <= Math.min(n, i + MAXW); j++) {
        w += lower[j - 1];
        if (LEET[lower[j - 1]]) leetN++;
        var e = DICT[w], caps = null;
        if (e) { caps = capsInfo(s.slice(i, j)); out.push({ i: i, j: j, kind: e.kind, g: e.g * caps.mult, word: w, caps: caps.kind }); }
        if (j - i >= 4) {
          var r = w.split('').reverse().join(''), er = DICT[r];
          if (er && r !== w) { caps = caps || capsInfo(s.slice(i, j)); out.push({ i: i, j: j, kind: er.kind, g: er.g * caps.mult * 2, word: r, reversed: true, caps: caps.kind }); }
        }
        if (leetN && leetN <= 6 && j - i <= 16) {
          var vs = leetVariants(lower.slice(i, j));
          for (var v = 0; v < vs.length; v++) {
            var ev = DICT[vs[v].w];
            if (ev) { caps = caps || capsInfo(s.slice(i, j)); out.push({ i: i, j: j, kind: ev.kind, g: ev.g * caps.mult * Math.pow(2, vs[v].subs), word: vs[v].w, leet: true, caps: caps.kind }); }
          }
        }
      }
    }
  }

  function seqMatches(s, out) {
    var n = s.length; if (n < 3) return;
    var cp = s.map(function (c) { return c.codePointAt(0); }), cls = s.map(classOf);
    var i = 0;
    while (i < n - 2) {
      var d = cp[i + 1] - cp[i], k = cls[i];
      if ((d === 1 || d === -1 || d === 2 || d === -2) && cls[i + 1] === k && (k === 'lower' || k === 'upper' || k === 'digit')) {
        var j = i + 1;
        while (j + 1 < n && cp[j + 1] - cp[j] === d && cls[j + 1] === k) j++;
        var len = j - i + 1;
        if (len >= 3) {
          var base = 'aAzZ019'.indexOf(s[i]) >= 0 ? 4 : (k === 'digit' ? 10 : 26);
          if (d < 0) base *= 2;
          if (Math.abs(d) === 2) base *= 2;
          out.push({ i: i, j: j + 1, kind: 'seq', g: base * len });
          i = j; continue;
        }
      }
      i++;
    }
  }

  function keyboardMatches(s, out) {
    var n = s.length, i = 0;
    while (i < n - 3) {
      var j = i, turns = 0, last = null, sh = KEYPOS[s[i]] && KEYPOS[s[i]].sh ? 1 : 0;
      while (j + 1 < n) {
        var a = KEYPOS[s[j]], b = KEYPOS[s[j + 1]];
        if (!a || !b || !adjacent(a, b)) break;
        var dr = b.r - a.r, dir = dr === 0 ? (b.x > a.x ? 'E' : 'W') : (dr > 0 ? 'S' : 'N');
        if (dir !== last) { turns++; last = dir; }
        if (b.sh) sh++;
        j++;
      }
      var len = j - i + 1;
      if (len >= 4) {
        var g = 0;
        for (var L = 2; L <= len; L++) {
          var pt = Math.min(turns, L - 1);
          for (var t = 1; t <= pt; t++) g += nCk(L - 1, t - 1) * KB_START * Math.pow(KB_DEG, t);
        }
        var un = len - sh;
        if (sh) { if (!un) g *= 2; else { var v = 0; for (var q = 1; q <= Math.min(sh, un); q++) v += nCk(sh + un, q); g *= v; } }
        out.push({ i: i, j: j + 1, kind: 'keyboard', g: g });
        i = j; continue;
      }
      i++;
    }
  }

  function twoToFour(y) { return y > 99 ? y : (y > 50 ? 1900 + y : 2000 + y); }
  function mapDM(a, b) {
    if (a >= 1 && a <= 31 && b >= 1 && b <= 12) return { d: a, m: b };
    if (b >= 1 && b <= 31 && a >= 1 && a <= 12) return { d: b, m: a };
    return null;
  }
  function mapInts(ints) {
    if (ints[1] > 31 || ints[1] <= 0) return null;
    var over12 = 0, over31 = 0, under1 = 0;
    for (var k = 0; k < 3; k++) {
      var v = ints[k];
      if ((v > 99 && v < 1000) || v > 2050) return null;
      if (v > 31) over31++; if (v > 12) over12++; if (v <= 0) under1++;
    }
    if (over31 >= 2 || over12 === 3 || under1 >= 2) return null;
    var splits = [[ints[2], ints[0], ints[1]], [ints[0], ints[1], ints[2]]], dm, sp;
    for (k = 0; k < 2; k++) {
      sp = splits[k];
      if (sp[0] >= 1000 && sp[0] <= 2050) { dm = mapDM(sp[1], sp[2]); return dm ? { y: sp[0], m: dm.m, d: dm.d } : null; }
    }
    for (k = 0; k < 2; k++) {
      sp = splits[k];
      if (sp[0] <= 99) { dm = mapDM(sp[1], sp[2]); if (dm) return { y: twoToFour(sp[0]), m: dm.m, d: dm.d }; }
    }
    return null;
  }
  var DATE_SPLITS = { 4: [[1, 2], [2, 3]], 5: [[1, 3], [2, 3]], 6: [[1, 2], [2, 4], [4, 5]], 7: [[1, 3], [2, 3], [4, 5], [4, 6]], 8: [[2, 4], [4, 6]] };
  var FAMOUS = Object.create(null);
  (D.famousDates || []).forEach(function (x) { FAMOUS[x] = 1; });
  function pad2(x) { return (x < 10 ? '0' : '') + x; }
  function dateGuesses(dmy, sep) {
    var key = pad2(dmy.d) + pad2(dmy.m) + dmy.y;
    if (FAMOUS[key]) return { g: 10 * (sep ? 4 : 1), famous: true };
    return { g: 365 * Math.max(Math.abs(dmy.y - REF_YEAR), 20) * (sep ? 4 : 1), famous: false };
  }
  var SEP_DATE = /^(\d{1,4})([\s\/\\_.-])(\d{1,2})\2(\d{1,4})$/;
  function dateMatches(s, out) {
    var n = s.length, str = s.join('');
    if (str.length !== n) return;  /* only plain ASCII strings reach here sensibly */
    var isD = function (k) { return k >= 0 && k < n && str[k] >= '0' && str[k] <= '9'; };
    for (var i = 0; i < n; i++) {
      for (var len = 4; len <= 10 && i + len <= n; len++) {
        var sub = str.slice(i, i + len), best = null, sep = false;
        if (/^\d+$/.test(sub)) {
          /* a date typed without separators is a whole run of digits (not a few digits inside a longer number) */
          if (len > 8 || isD(i - 1) || isD(i + len)) continue;
          DATE_SPLITS[len].forEach(function (sp) {
            var dmy = mapInts([+sub.slice(0, sp[0]), +sub.slice(sp[0], sp[1]), +sub.slice(sp[1])]);
            if (dmy && (!best || Math.abs(dmy.y - REF_YEAR) < Math.abs(best.y - REF_YEAR))) best = dmy;
          });
        } else if (len >= 6) {
          var m = SEP_DATE.exec(sub);
          if (m && !isD(i - 1) && !isD(i + len)) { best = mapInts([+m[1], +m[3], +m[4]]); sep = true; }
        }
        if (best) {
          var dg = dateGuesses(best, sep);
          out.push({ i: i, j: i + len, kind: 'date', g: dg.g, famous: dg.famous, dmy: best });
        }
      }
    }
  }

  function digitRuns(s) {
    var runs = [], i = 0, n = s.length;
    while (i < n) {
      if (classOf(s[i]) === 'digit') { var j = i; while (j < n && classOf(s[j]) === 'digit') j++; runs.push([i, j]); i = j; }
      else i++;
    }
    return runs;
  }
  function numberMatches(s, out) {
    var str = s.join('');
    if (str.length !== s.length) str = null;
    digitRuns(s).forEach(function (r) {
      var len = r[1] - r[0], digits = s.slice(r[0], r[1]).join('');
      if (len >= 2) out.push({ i: r[0], j: r[1], kind: 'number', g: Math.pow(10, len) });
      if ((len === 10 && /^[6-9]/.test(digits)) || (len === 12 && /^91[6-9]/.test(digits))) out.push({ i: r[0], j: r[1], kind: 'phone', g: 4e9 });
      /* a year at the start or end of a run of digits: 2008, 200812, 122008 */
      [r[0], r[1] - 4].forEach(function (k, idx) {
        if (len < 4 || (idx === 1 && k === r[0])) return;
        var y = +s.slice(k, k + 4).join('');
        if (y >= 1900 && y <= 2049) out.push({ i: k, j: k + 4, kind: 'year', g: Math.max(Math.abs(y - REF_YEAR), 20) });
      });
    });
  }

  var memo = Object.create(null);
  function repeatMatches(s, out, depth) {
    var n = s.length;
    function eq(a, b, len) { for (var q = 0; q < len; q++) if (s[a + q] !== s[b + q]) return false; return true; }
    for (var i = 0; i < n; i++) {
      var bmin = 0;   /* shortest block already repeating from i: its multiples ("abab" in "abababab") add nothing */
      for (var b = 1; i + 2 * b <= n; b++) {
        if (i - b >= 0 && eq(i - b, i, b)) continue;  /* not the start of this repeat */
        if (bmin && b % bmin === 0 && eq(i, i + bmin, b - bmin)) continue;
        var k = 1;
        while (i + (k + 1) * b <= n && eq(i, i + k * b, b)) k++;
        if (k < 2 || k * b < 3) continue;
        if (!bmin) bmin = b;
        var block = s.slice(i, i + b).join(''), base;
        if (depth > 0) base = Math.pow(poolOf(s.slice(i, i + b)), b);
        else { if (memo[block] === undefined) memo[block] = Math.pow(2, analyze(block, 1).bits); base = memo[block]; }
        out.push({ i: i, j: i + k * b, kind: 'repeat', g: Math.max(2, base) * k, block: block, times: k });
      }
    }
  }

  /* Words typed in Indian scripts (or any non-Latin letters). We have no word lists for them, but attackers do,
     so a run of such letters counts as dictionary words (about 1 lakh words, ~5 letters per word),
     never as random characters. */
  var LETTERISH = (function () { try { return new RegExp('[\\p{L}\\p{M}\\u200c\\u200d]', 'u'); } catch (e) { return null; } })();
  var SCRIPT_DICT = 1e5, SCRIPT_WORD = 5;
  function isScriptLetter(c) {
    if (classOf(c) !== 'other') return false;
    if (LETTERISH) return LETTERISH.test(c);
    var code = c.codePointAt(0);
    return (code >= 0x0600 && code <= 0x0DFF) || code === 0x200c || code === 0x200d;   /* Arabic … Malayalam */
  }
  function scriptMatches(s, out) {
    var n = s.length, i = 0;
    while (i < n) {
      if (!isScriptLetter(s[i])) { i++; continue; }
      var j = i; while (j < n && isScriptLetter(s[j])) j++;
      var len = j - i;
      if (len >= 2) {
        var words = Math.max(1, Math.round(len / SCRIPT_WORD));
        out.push({ i: i, j: j, kind: 'script', g: Math.min(Math.pow(POOL.other, len), Math.pow(SCRIPT_DICT, words)) });
      }
      i = j;
    }
  }

  /* the same symbol used again and again between words: "tiger-mango-river" */
  function sepMatches(s, out) {
    var n = s.length, between = Object.create(null), total = Object.create(null);
    for (var k = 0; k < n; k++) {
      if (classOf(s[k]) !== 'symbol') continue;
      total[s[k]] = (total[s[k]] || 0) + 1;
      if (k > 0 && k < n - 1 && isWordChar(s[k - 1]) && isWordChar(s[k + 1])) between[s[k]] = (between[s[k]] || 0) + 1;
    }
    var best = null;
    Object.keys(between).forEach(function (c) { if (between[c] >= 2 && between[c] === total[c] && (!best || between[c] > between[best])) best = c; });
    if (!best) return null;
    var first = true;
    for (k = 0; k < n; k++) if (s[k] === best) { out.push({ i: k, j: k + 1, kind: 'sep', g: first ? 8 : 1 }); first = false; }
    return best;
  }

  function poolOf(chars) {
    var seen = {}, p = 0;
    chars.forEach(function (c) { var k = classOf(c); if (!seen[k]) { seen[k] = 1; p += POOL[k]; } });
    return Math.max(p, 1);
  }

  /* ---------------- main ---------------- */
  var DICT_KINDS = { common: 1, word: 1, hindi: 1, name: 1, place: 1 };
  function analyze(pw, depth) {
    depth = depth || 0;
    var all = Array.from(String(pw == null ? '' : pw));
    var s = all.length > MAXLEN ? all.slice(0, MAXLEN) : all;
    var n = s.length;
    var classes = {};
    all.forEach(function (c) { classes[classOf(c)] = true; });
    var pool = poolOf(all);
    var res = { length: all.length, classes: classes, pool: pool, simpleBits: all.length ? all.length * Math.log2(pool) : 0, segments: [], bits: 0, guessesLog2: 0, truncated: all.length > n };
    if (!n) return res;
    var lower = s.map(function (c) { return c.toLowerCase(); });
    var matches = [];
    dictMatches(s, lower, matches);
    seqMatches(s, matches);
    keyboardMatches(s, matches);
    dateMatches(s, matches);
    numberMatches(s, matches);
    scriptMatches(s, matches);
    var sep = depth === 0 ? sepMatches(s, matches) : null;
    if (depth === 0) repeatMatches(s, matches, depth);
    else repeatMatches(s, matches, depth);

    /* dynamic programming: cheapest cover of s[0..n) (1 bit penalty per piece keeps the split simple) */
    var PEN = 1, lp = Math.log2(pool);
    var byEnd = []; for (var e = 0; e <= n; e++) byEnd.push([]);
    matches.forEach(function (m) { m.lg = lg(m.g); byEnd[m.j].push(m); });
    var best = [0], back = [null], runMin = 0, runArg = 0;
    for (var j = 1; j <= n; j++) {
      /* random piece from argmin i: cost best[i] + (j - i) * lp + PEN */
      var bc = runMin + j * lp + PEN, bk = { i: runArg, j: j, kind: 'random' };
      byEnd[j].forEach(function (m) {
        var c = best[m.i] + m.lg + (m.kind === 'sep' ? 0 : PEN);
        if (c < bc - 1e-9) { bc = c; bk = m; }
      });
      best[j] = bc; back[j] = bk;
      var cand = best[j] - j * lp;
      if (cand < runMin) { runMin = cand; runArg = j; }
    }
    var segs = [], p = n;
    while (p > 0) { var m = back[p]; segs.push(m); p = m.i; }
    segs.reverse();
    var totalLg = 0;
    segs = segs.map(function (m) {
      var o = {}; for (var k in m) o[k] = m[k];
      o.token = all.slice(m.i, m.j).join('');
      if (o.kind === 'random') { o.g = Math.pow(pool, m.j - m.i); o.lg = (m.j - m.i) * lp; }
      return o;
    });
    /* "Capital First Letter Of Every Word" is ONE rule for an attacker, not a new choice for every word */
    var dictSegs = segs.filter(function (o) { return DICT_KINDS[o.kind]; });
    if (dictSegs.length >= 2 && dictSegs.every(function (o) { return o.caps === 'first'; })) {
      dictSegs.slice(1).forEach(function (o) { o.g /= 2; o.lg -= 1; o.capsRule = true; });
    }
    segs.forEach(function (o) { totalLg += o.lg; });
    if (all.length > n) totalLg += analyze(all.slice(n).join(''), depth).bits;   /* very long input: next chunk */
    var bits = Math.min(totalLg, res.simpleBits);
    res.segments = segs; res.bits = bits; res.guessesLog2 = bits; res.sep = sep;
    var joined = all.join('');
    res.flags = {
      phone: /(^|\D)(?:\+?91[\s-]?)?[6-9]\d{9}(?!\d)/.test(joined),
      digitsOnly: /^\d+$/.test(joined)
    };
    return res;
  }

  /* strength level 0..4 from bits: time = 2^bits / RATE */
  var Y = 365.25 * 86400;
  var LEVEL_SECS = [3600, 30.4375 * 86400, 100 * Y, 1e7 * Y];
  function secondsFor(bits) { return Math.pow(2, Math.min(bits, 1000)) / RATE; }
  function level(bits) {
    var s = secondsFor(bits), l = 0;
    while (l < 4 && s >= LEVEL_SECS[l]) l++;
    return l;
  }
  /* friendly time: { key, n } where key is a string key */
  function timeParts(bits) {
    if (bits > 140) return { key: 'time_universe' };
    var s = secondsFor(bits);
    if (s < 1) return { key: 'time_instant' };
    var units = [['time_s', 1, 60], ['time_min', 60, 3600], ['time_h', 3600, 86400], ['time_d', 86400, 30.4375 * 86400], ['time_mo', 30.4375 * 86400, Y]];
    /* a value that rounds up to the next unit moves to that unit ("about 60 seconds" -> "about 1 minute") */
    for (var u = 0; u < units.length; u++) {
      var v = Math.round(s / units[u][1]);
      if (v < units[u][2] / units[u][1]) return { key: units[u][0] + (v <= 1 ? '_one' : ''), n: Math.max(1, v) };
    }
    var y = s / Y, yv = Math.round(y);
    if (yv < 1000) return { key: 'time_y' + (yv <= 1 ? '_one' : ''), n: Math.max(1, yv) };
    if (Math.round(y / 1e3) < 100) return { key: 'time_ky', n: Math.round(y / 1e3) };
    if (Math.round(y / 1e5) < 100) return { key: 'time_lakh', n: Math.round(y / 1e5) };
    if (y < 1.38e10) return { key: 'time_crore', n: Math.round(y / 1e7) };
    return { key: 'time_universe' };
  }
  /* guesses as { small: number } or { mant: '2.6', exp: 17 } */
  function guessParts(bits) {
    if (bits < 20) return { small: Math.max(1, Math.round(Math.pow(2, bits))) };
    var l10 = bits * LOG10_2, exp = Math.floor(l10), mant = Math.pow(10, l10 - exp);
    if (mant >= 9.95) { mant = 1; exp++; }
    return { mant: mant.toFixed(1), exp: exp };
  }

  /* ---------------- passphrase generator ---------------- */
  function randBelow(n) {
    var c = root.crypto || root.msCrypto;
    if (c && c.getRandomValues) {
      var max = Math.floor(4294967296 / n) * n, buf = new Uint32Array(1);
      do { c.getRandomValues(buf); } while (buf[0] >= max);
      return buf[0] % n;
    }
    return Math.floor(Math.random() * n);
  }
  function listFor(name) { return name === 'hi' ? HI : name === 'both' ? BOTH : EN; }
  function generate(o) {
    var list = listFor(o.list), count = Math.max(3, Math.min(10, o.count | 0 || 6));
    var words = [];
    for (var k = 0; k < count; k++) {
      var w = list[randBelow(list.length)];
      words.push(o.caps ? w.charAt(0).toUpperCase() + w.slice(1) : w);
    }
    var parts = words.slice(), num = null;
    if (o.number) { num = String(10 + randBelow(90)); parts.splice(randBelow(count + 1), 0, num); }
    var sep = o.sep === undefined ? '-' : o.sep;
    return { text: parts.join(sep), parts: parts, sep: sep, words: words, number: num };
  }
  function genBits(o) {
    var N = listFor(o.list).length, count = o.count;
    var b = count * Math.log2(N);
    if (o.number) b += Math.log2(90) + Math.log2(count + 1);
    return b;
  }

  root.PWLAB = {
    analyze: function (pw) { return analyze(pw, 0); },
    level: level, timeParts: timeParts, guessParts: guessParts, secondsFor: secondsFor,
    generate: generate, genBits: genBits, listSize: function (name) { return listFor(name).length; },
    RATE: RATE, LEVEL_SECS: LEVEL_SECS, POOL: POOL, classOf: classOf,
    sizes: { common: COMMON.length, en: EN.length, hi: HI.length, both: BOTH.length, names: NAMES.length, places: PLACES.length, extra: EXTRA.length }
  };
})(window);
