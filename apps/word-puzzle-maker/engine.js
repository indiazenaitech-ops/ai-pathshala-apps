/* Word Puzzle Maker: puzzle logic with no DOM. window.WPM = { parse, split, makeSearch, makeCrossword, makeScramble, ... }
   Every word is handled as a list of "cells". One cell = one akshara / grapheme cluster, so a consonant keeps its
   matras and conjuncts (वि, द्या, க், చం) and is never cut in the middle. */
(function () {
  'use strict';

  var ZWJ = '‍', ZWNJ = '‌';
  /* viramas that join consonants into one conjunct (Tamil pulli is left out on purpose: க் is its own letter) */
  var VIRAMA = { '्': 1, '্': 1, '੍': 1, '્': 1, '୍': 1, '్': 1, '್': 1, '്': 1 };

  function re(src, flags, fallback) { try { return new RegExp(src, flags); } catch (e) { return fallback; } }
  var RE_DROP = re('[^\\p{L}\\p{M}\\p{N}\\u200C\\u200D]', 'gu', /[\s!-\/:-@\[-`{-~ -​‐-⁯।॥]/g);
  var RE_MARK = re('^\\p{M}', 'u', /^[̀-ͯऀ-ःऺ-ॏ॑-ॗॢॣঁ-ঃ়-ৗਁ-ਃ਼-ੑੰੱੵઁ-ઃ઼-્ଁ-ଃ଼-ୗஂா-்ௗఀ-ఄా-ౖಁ-ಃ಼-ೖഀ-ഃ഻-്ൗً-ٰٟۖ-ۭ]/);
  var RE_LETTER = re('^\\p{L}', 'u', /^[^\s\d]/);
  var segmenter = null;
  try { if (typeof Intl !== 'undefined' && Intl.Segmenter) segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' }); } catch (e) { segmenter = null; }

  function chars(s) { return Array.from ? Array.from(s) : s.split(''); }
  function isMark(ch) { return ch === ZWJ || ch === ZWNJ || RE_MARK.test(ch); }

  /* text typed by the user -> only letters, marks and digits, capital letters for scripts that have them */
  function clean(word) {
    var s = String(word == null ? '' : word);
    try { s = s.normalize('NFC'); } catch (e) { }
    s = s.replace(RE_DROP, '').toUpperCase();
    var a = chars(s);
    while (a.length && isMark(a[0])) a.shift();          // a word cannot begin with a matra
    return a.join('');
  }

  function rawClusters(s, useSegmenter) {
    var out = [];
    if (useSegmenter && segmenter) {
      var it = segmenter.segment(s)[Symbol.iterator](), x;
      while (!(x = it.next()).done) out.push(x.value.segment);
      return out;
    }
    chars(s).forEach(function (ch) {
      if (out.length && isMark(ch)) out[out.length - 1] += ch; else out.push(ch);
    });
    return out;
  }
  function endsWithVirama(g) {
    var a = chars(g), last = a[a.length - 1];
    if (last === ZWJ) last = a[a.length - 2];
    return !!VIRAMA[last];
  }
  /* split a cleaned word into cells; opts.noSegmenter forces the built-in fallback (used by the test) */
  function split(s, opts) {
    var raw = rawClusters(s, !(opts && opts.noSegmenter)), res = [];
    for (var i = 0; i < raw.length; i++) {
      var g = raw[i];
      if (res.length && (isMark(chars(g)[0]) || (endsWithVirama(res[res.length - 1]) && RE_LETTER.test(g)))) res[res.length - 1] += g;
      else res.push(g);
    }
    return res;
  }

  /* ---------- scripts ---------- */
  function scriptOf(ch) {
    var c = ch.codePointAt ? ch.codePointAt(0) : ch.charCodeAt(0);
    if (c < 0x250) return /[A-Za-zÀ-ɏ]/.test(ch) ? 'latin' : 'other';
    if (c >= 0x0900 && c <= 0x097F) return 'deva';
    if (c >= 0x0980 && c <= 0x09FF) return 'beng';
    if (c >= 0x0A00 && c <= 0x0A7F) return 'guru';
    if (c >= 0x0A80 && c <= 0x0AFF) return 'gujr';
    if (c >= 0x0B00 && c <= 0x0B7F) return 'orya';
    if (c >= 0x0B80 && c <= 0x0BFF) return 'taml';
    if (c >= 0x0C00 && c <= 0x0C7F) return 'telu';
    if (c >= 0x0C80 && c <= 0x0CFF) return 'knda';
    if (c >= 0x0D00 && c <= 0x0D7F) return 'mlym';
    if ((c >= 0x0600 && c <= 0x06FF) || (c >= 0x0750 && c <= 0x077F) || (c >= 0xFB50 && c <= 0xFDFF) || (c >= 0xFE70 && c <= 0xFEFF)) return 'arab';
    if (c >= 0x0590 && c <= 0x05FF) return 'hebr';
    return 'other';
  }
  function dominantScript(entries) {
    var n = {}, best = 'latin', top = 0;
    entries.forEach(function (e) { e.cells.forEach(function (cell) { var s = scriptOf(cell); n[s] = (n[s] || 0) + 1; }); });
    Object.keys(n).forEach(function (k) { if (k !== 'other' && n[k] > top) { top = n[k]; best = k; } });
    return top ? best : 'other';
  }
  function isRTL(script) { return script === 'arab' || script === 'hebr'; }

  function L(s) { return s.split(' '); }
  var FILL = {
    latin: { c: L('A A A B C D D E E E E F G H I I I J K L L M N N O O O P Q R R S S T T T U U V W X Y Z') },
    deva: { c: L('क ख ग घ च छ ज झ ट ठ ड ढ ण त थ द ध न प फ ब भ म य र ल व श ष स ह'), m: L('ा ि ी ु ू े ै ो ौ ं'), v: L('अ आ इ ई उ ऊ ए ऐ ओ औ') },
    beng: { c: L('ক খ গ ঘ চ ছ জ ঝ ট ঠ ড ঢ ণ ত থ দ ধ ন প ফ ব ভ ম য র ল শ ষ স হ'), m: L('া ি ী ু ূ ে ৈ ো ৌ ং'), v: L('অ আ ই ঈ উ ঊ এ ঐ ও ঔ') },
    guru: { c: L('ਕ ਖ ਗ ਘ ਚ ਛ ਜ ਝ ਟ ਠ ਡ ਢ ਣ ਤ ਥ ਦ ਧ ਨ ਪ ਫ ਬ ਭ ਮ ਯ ਰ ਲ ਵ ਸ ਹ'), m: L('ਾ ਿ ੀ ੁ ੂ ੇ ੈ ੋ ੌ'), v: L('ਅ ਆ ਇ ਈ ਉ ਊ ਏ ਐ ਓ ਔ') },
    gujr: { c: L('ક ખ ગ ઘ ચ છ જ ઝ ટ ઠ ડ ઢ ણ ત થ દ ધ ન પ ફ બ ભ મ ય ર લ વ શ ષ સ હ ળ'), m: L('ા િ ી ુ ૂ ે ૈ ો ૌ ં'), v: L('અ આ ઇ ઈ ઉ ઊ એ ઐ ઓ ઔ') },
    orya: { c: L('କ ଖ ଗ ଘ ଚ ଛ ଜ ଝ ଟ ଠ ଡ ଢ ଣ ତ ଥ ଦ ଧ ନ ପ ଫ ବ ଭ ମ ଯ ର ଲ ଳ ଶ ଷ ସ ହ'), m: L('ା ି ୀ ୁ ୂ େ ୈ ୋ ୌ ଂ'), v: L('ଅ ଆ ଇ ଈ ଉ ଊ ଏ ଐ ଓ ଔ') },
    taml: { c: L('க ங ச ஞ ட ண த ந ப ம ய ர ல வ ழ ள ற ன'), m: L('ா ி ீ ு ூ ெ ே ை ொ ோ ்'), v: L('அ ஆ இ ஈ உ ஊ எ ஏ ஐ ஒ ஓ') },
    telu: { c: L('క ఖ గ ఘ చ ఛ జ ఝ ట ఠ డ ఢ ణ త థ ద ధ న ప ఫ బ భ మ య ర ల వ శ ష స హ ళ'), m: L('ా ి ీ ు ూ ె ే ై ొ ో ౌ ం'), v: L('అ ఆ ఇ ఈ ఉ ఊ ఎ ఏ ఐ ఒ ఓ') },
    knda: { c: L('ಕ ಖ ಗ ಘ ಚ ಛ ಜ ಝ ಟ ಠ ಡ ಢ ಣ ತ ಥ ದ ಧ ನ ಪ ಫ ಬ ಭ ಮ ಯ ರ ಲ ವ ಶ ಷ ಸ ಹ ಳ'), m: L('ಾ ಿ ೀ ು ೂ ೆ ೇ ೈ ೊ ೋ ೌ ಂ'), v: L('ಅ ಆ ಇ ಈ ಉ ಊ ಎ ಏ ಐ ಒ ಓ') },
    mlym: { c: L('ക ഖ ഗ ഘ ച ഛ ജ ഝ ട ഠ ഡ ഢ ണ ത ഥ ദ ധ ന പ ഫ ബ ഭ മ യ ര ല വ ശ ഷ സ ഹ ള ഴ റ'), m: L('ാ ി ീ ു ൂ െ േ ൈ ൊ ോ ം'), v: L('അ ആ ഇ ഈ ഉ ഊ എ ഏ ഐ ഒ ഓ') },
    arab: { c: L('ا ب پ ت ٹ ث ج چ ح خ د ڈ ذ ر ڑ ز ژ س ش ص ض ط ظ ع غ ف ق ک گ ل م ن و ہ ھ ی ے') }
  };

  /* ---------- seeded random ---------- */
  function rng(seed) {
    var a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, rand) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; }
    return a;
  }
  function pick(arr, rand) { return arr[Math.floor(rand() * arr.length)]; }

  /* ---------- reading the word list ---------- */
  var MAX_WORDS = 40;
  function parse(text) {
    var entries = [], dupes = [], short = [], seen = {}, extra = 0;
    String(text || '').split(/\r?\n/).forEach(function (line) {
      line = line.trim();
      if (!line) return;
      var m = line.match(/^([^:：=\t|]*)[:：=\t|]([\s\S]*)$/);
      var word = (m ? m[1] : line).trim(), clue = m ? m[2].trim() : '';
      var key = clean(word);
      if (!key) return;
      var cells = split(key);
      var show = word.replace(/\s+/g, ' ').toUpperCase();
      if (show.length > 60) show = chars(show).slice(0, 60).join('') + '…';
      if (seen[key]) { dupes.push(show); return; }
      seen[key] = 1;
      if (cells.length < 2) { short.push(show); return; }
      if (entries.length >= MAX_WORDS) { extra++; return; }
      entries.push({ word: show, clue: clue, key: key, cells: cells });
    });
    var script = dominantScript(entries);
    return { entries: entries, dupes: dupes, short: short, extra: extra, script: script, rtl: isRTL(script) };
  }

  /* ---------- word search ---------- */
  var DIRS = [
    [[0, 1], [1, 0]],
    [[0, 1], [1, 0], [1, 1], [-1, 1]],
    [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]]
  ];
  var ALL8 = DIRS[2];
  var AUTO_MAX = 20;

  function fillerFor(script, entries, rand) {
    var t = FILL[script], pool = [];
    entries.forEach(function (e) { e.cells.forEach(function (c) { pool.push(c); }); });
    return function () {
      if (!t) return pool.length ? pick(pool, rand) : '?';
      var r = rand();
      if (pool.length && r < 0.18) return pick(pool, rand);
      if (!t.m) return pick(t.c, rand);
      if (r < 0.70) return pick(t.c, rand);
      if (r < 0.92) return pick(t.c, rand) + pick(t.m, rand);
      return pick(t.v, rand);
    };
  }

  function tryLayout(words, N, dirs, rand) {
    var grid = [], r, c, placed = [], failed = [];
    for (r = 0; r < N; r++) { grid.push([]); for (c = 0; c < N; c++) grid[r].push(null); }
    words.forEach(function (w) {
      var len = w.cells.length, best = null, bestScore = -1, found = 0;
      for (var tries = 0; tries < 400 && found < 30; tries++) {
        var d = pick(dirs, rand);
        var r0 = Math.floor(rand() * N), c0 = Math.floor(rand() * N);
        var r1 = r0 + d[0] * (len - 1), c1 = c0 + d[1] * (len - 1);
        if (r1 < 0 || r1 >= N || c1 < 0 || c1 >= N) continue;
        var ok = true, overlap = 0;
        for (var i = 0; i < len; i++) {
          var g = grid[r0 + d[0] * i][c0 + d[1] * i];
          if (g === null) continue;
          if (g !== w.cells[i]) { ok = false; break; }
          overlap++;
        }
        if (!ok || overlap === len) continue;
        found++;
        var score = overlap + rand() * 0.9;
        if (score > bestScore) { bestScore = score; best = { r: r0, c: c0, dr: d[0], dc: d[1] }; }
      }
      if (!best) { failed.push(w); return; }
      for (var k = 0; k < len; k++) grid[best.r + best.dr * k][best.c + best.dc * k] = w.cells[k];
      placed.push({ word: w.word, key: w.key, cells: w.cells.slice(), r: best.r, c: best.c, dr: best.dr, dc: best.dc });
    });
    return { grid: grid, placed: placed, failed: failed };
  }

  function occurrences(grid, N, cells) {
    var out = [], len = cells.length;
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      if (grid[r][c] !== cells[0]) continue;
      for (var d = 0; d < 8; d++) {
        var dr = ALL8[d][0], dc = ALL8[d][1], r1 = r + dr * (len - 1), c1 = c + dc * (len - 1);
        if (r1 < 0 || r1 >= N || c1 < 0 || c1 >= N) continue;
        var ok = true;
        for (var i = 1; i < len; i++) if (grid[r + dr * i][c + dc * i] !== cells[i]) { ok = false; break; }
        if (ok) out.push({ r: r, c: c, dr: dr, dc: dc });
      }
    }
    return out;
  }

  /* opts: { size: 0 (auto) | n, level: 0|1|2, seed } */
  function makeSearch(parsed, opts) {
    opts = opts || {};
    var level = Math.max(0, Math.min(2, opts.level | 0)), dirs = DIRS[level], seed = (opts.seed >>> 0) || 1;
    var entries = parsed.entries, auto = !opts.size;
    var longest = 0, total = 0;
    entries.forEach(function (e) { if (e.cells.length <= AUTO_MAX) { longest = Math.max(longest, e.cells.length); total += e.cells.length; } });
    var N = auto ? Math.max(6, Math.min(AUTO_MAX, Math.max(longest, Math.ceil(Math.sqrt(total * (level === 0 ? 2.2 : 1.8)))))) : Math.max(4, Math.min(20, opts.size | 0));
    var best = null, tooLong = [], fit = [];
    for (;;) {
      tooLong = entries.filter(function (e) { return e.cells.length > N; });
      fit = entries.filter(function (e) { return e.cells.length <= N; });
      best = null;
      for (var attempt = 0; attempt < 14; attempt++) {
        var rand = rng(seed + attempt * 7919 + N * 104729);
        var order = shuffle(fit, rand).sort(function (a, b) { return b.cells.length - a.cells.length; });
        var res = tryLayout(order, N, dirs, rand);
        res.rand = rand;
        if (!best || res.placed.length > best.placed.length) best = res;
        if (!res.failed.length) break;
      }
      if (auto && N < AUTO_MAX && (best.failed.length || tooLong.some(function (e) { return e.cells.length <= AUTO_MAX; }))) { N++; continue; }
      break;
    }
    var grid = best.grid, rand2 = best.rand, fill = fillerFor(parsed.script, fit, rand2);
    var locked = [], r, c;
    for (r = 0; r < N; r++) { locked.push([]); for (c = 0; c < N; c++) { locked[r].push(grid[r][c] !== null); if (grid[r][c] === null) grid[r][c] = fill(); } }
    /* filler letters must not spell a second copy of a word by accident */
    for (var pass = 0; pass < 12; pass++) {
      var changed = false;
      best.placed.forEach(function (p) {
        occurrences(grid, N, p.cells).forEach(function (o) {
          for (var i = 0; i < p.cells.length; i++) {
            var rr = o.r + o.dr * i, cc = o.c + o.dc * i;
            if (!locked[rr][cc]) {
              var old = grid[rr][cc], x = old;
              for (var t = 0; t < 20 && x === old; t++) x = fill();
              grid[rr][cc] = x; changed = true; return;
            }
          }
        });
      });
      if (!changed) break;
    }
    /* keep the order the user typed */
    var pos = {}; entries.forEach(function (e, i) { pos[e.key] = i; });
    best.placed.sort(function (a, b) { return pos[a.key] - pos[b.key]; });
    return {
      type: 'search', size: N, grid: grid, placed: best.placed, level: level, seed: seed, rtl: parsed.rtl, script: parsed.script,
      tooLong: tooLong.map(function (e) { return e.word; }), unplaced: best.failed.map(function (e) { return e.word; })
    };
  }

  /* ---------- crossword ---------- */
  function crossAttempt(order, rand) {
    var board = {}, placed = [], minR = 0, maxR = 0, minC = 0, maxC = 0;
    function at(r, c) { return board[r + ',' + c]; }
    function canPlace(w, r, c, dir) {
      var dr = dir ? 1 : 0, dc = dir ? 0 : 1, len = w.cells.length, cross = 0;
      if (at(r - dr, c - dc) || at(r + dr * len, c + dc * len)) return -1;
      for (var i = 0; i < len; i++) {
        var rr = r + dr * i, cc = c + dc * i, g = at(rr, cc);
        if (g) {
          if (g.ch !== w.cells[i] || g[dir ? 'd' : 'a']) return -1;
          cross++;
        } else if (at(rr + dc, cc + dr) || at(rr - dc, cc - dr)) return -1;
      }
      return cross;
    }
    function put(w, r, c, dir) {
      var dr = dir ? 1 : 0, dc = dir ? 0 : 1;
      for (var i = 0; i < w.cells.length; i++) {
        var rr = r + dr * i, cc = c + dc * i, k = rr + ',' + cc;
        if (!board[k]) board[k] = { ch: w.cells[i], a: false, d: false };
        board[k][dir ? 'd' : 'a'] = true;
        if (rr < minR) minR = rr; if (rr > maxR) maxR = rr; if (cc < minC) minC = cc; if (cc > maxC) maxC = cc;
      }
      placed.push({ entry: w, r: r, c: c, dir: dir });
    }
    var left = order.slice();
    if (!left.length) return { placed: placed, left: left, rows: 0, cols: 0, minR: 0, minC: 0, board: board };
    put(left.shift(), 0, 0, 0);
    var progress = true;
    while (left.length && progress) {
      progress = false;
      for (var n = 0; n < left.length; n++) {
        var w = left[n], best = null, bestScore = -1e9;
        var keys = Object.keys(board);
        for (var i = 0; i < w.cells.length; i++) {
          for (var k = 0; k < keys.length; k++) {
            var g = board[keys[k]];
            if (g.ch !== w.cells[i]) continue;
            var p = keys[k].split(','), br = +p[0], bc = +p[1];
            for (var dir = 0; dir < 2; dir++) {
              if (g[dir ? 'd' : 'a']) continue;
              var r = br - (dir ? i : 0), c = bc - (dir ? 0 : i);
              var cross = canPlace(w, r, c, dir);
              if (cross < 1) continue;
              var er = r + (dir ? w.cells.length - 1 : 0), ec = c + (dir ? 0 : w.cells.length - 1);
              var h = Math.max(maxR, er) - Math.min(minR, r) + 1, wd = Math.max(maxC, ec) - Math.min(minC, c) + 1;
              var score = cross * 30 - (h * wd) * 0.5 - Math.abs(h - wd) * 2 - Math.max(0, wd - 15) * 20 - Math.max(0, h - 20) * 12 + rand() * 6;
              if (score > bestScore) { bestScore = score; best = { r: r, c: c, dir: dir }; }
            }
          }
        }
        if (best) { put(w, best.r, best.c, best.dir); left.splice(n, 1); n--; progress = true; }
      }
    }
    return { placed: placed, left: left, rows: maxR - minR + 1, cols: maxC - minC + 1, minR: minR, minC: minC, board: board };
  }

  function bestCross(entries, seed, attempts) {
    var best = null;
    for (var a = 0; a < attempts; a++) {
      var rand = rng(seed + a * 15485863);
      var order = shuffle(entries, rand);
      /* long words first on most tries; a few fully random orders as well */
      if (a % 4 !== 3) order.sort(function (x, y) { return (y.cells.length - x.cells.length) + (rand() < 0.25 ? (rand() - 0.5) * 3 : 0); });
      var res = crossAttempt(order, rand);
      var q = res.placed.length * 100000 - res.rows * res.cols * 10 - Math.abs(res.rows - res.cols) - Math.max(0, res.cols - 15) * 500 - Math.max(0, res.rows - 20) * 300;
      if (!best || q > best.q) { best = res; best.q = q; }
    }
    return best;
  }

  var CROSS_MAX = 18;
  /* Words that share a letter interlock. Words that share no letter with the rest (common with Indian scripts, where a
     whole akshara must match) are kept as separate small groups in the same grid and listed in "loose". */
  function makeCrossword(parsed, opts) {
    opts = opts || {};
    var seed = (opts.seed >>> 0) || 1;
    var tooLong = parsed.entries.filter(function (e) { return e.cells.length > CROSS_MAX; });
    var left = parsed.entries.filter(function (e) { return e.cells.length <= CROSS_MAX; });
    var groups = [];
    while (left.length) {
      var g = bestCross(left, seed + groups.length * 977, groups.length ? 10 : (left.length <= 1 ? 1 : 36));
      groups.push(g); left = g.left;
    }
    /* pack the groups on shelves, one empty line between them */
    var wide = Math.max(12, groups.length ? groups[0].cols : 0), x = 0, y = 0, shelfH = 0, rows = 0, cols = 0;
    var rest = groups.slice(1).sort(function (p, q) { return q.rows - p.rows || q.cols - p.cols; });
    (groups.length ? [groups[0]].concat(rest) : []).forEach(function (g, i) {
      if (i === 1) { x = 0; y += shelfH + 1; shelfH = 0; }            // the main group gets its own shelf
      if (x > 0 && x + g.cols > wide) { x = 0; y += shelfH + 1; shelfH = 0; }
      g.offR = y - g.minR; g.offC = x - g.minC;
      x += g.cols + 1; shelfH = Math.max(shelfH, g.rows);
      rows = Math.max(rows, y + g.rows); cols = Math.max(cols, x - 1);
    });
    var grid = [], r, c, placed = [], loose = [];
    for (r = 0; r < rows; r++) { grid.push([]); for (c = 0; c < cols; c++) grid[r].push(null); }
    groups.forEach(function (g, gi) {
      Object.keys(g.board).forEach(function (k) { var p = k.split(','); grid[+p[0] + g.offR][+p[1] + g.offC] = { ch: g.board[k].ch, num: 0 }; });
      g.placed.forEach(function (p) {
        placed.push({ word: p.entry.word, key: p.entry.key, clue: p.entry.clue, cells: p.entry.cells.slice(), r: p.r + g.offR, c: p.c + g.offC, dir: p.dir, dr: p.dir ? 1 : 0, dc: p.dir ? 0 : 1, num: 0, group: gi });
        if (gi > 0) loose.push(p.entry.word);
      });
    });
    var num = 0, startAt = {};
    placed.forEach(function (p) { (startAt[p.r + ',' + p.c] = startAt[p.r + ',' + p.c] || []).push(p); });
    for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) {
      var s = startAt[r + ',' + c];
      if (!s) continue;
      num++; grid[r][c].num = num;
      s.forEach(function (p) { p.num = num; });
    }
    var byNum = function (p, q) { return p.num - q.num; };
    return {
      type: 'cross', rows: rows, cols: cols, grid: grid, placed: placed, seed: seed, rtl: parsed.rtl, script: parsed.script, groups: groups.length,
      across: placed.filter(function (p) { return !p.dir; }).sort(byNum), down: placed.filter(function (p) { return p.dir; }).sort(byNum),
      loose: loose, unplaced: tooLong.map(function (e) { return e.word; })
    };
  }

  /* ---------- word scramble ---------- */
  function makeScramble(parsed, opts) {
    var seed = ((opts && opts.seed) >>> 0) || 1, rand = rng(seed + 31337);
    var items = parsed.entries.map(function (e) {
      var j = e.cells.slice(), same = function () { return j.join('\u0001') === e.cells.join('\u0001'); };
      for (var t = 0; t < 30; t++) { j = shuffle(e.cells, rand); if (!same()) break; }
      return { word: e.word, key: e.key, clue: e.clue, cells: e.cells.slice(), jumbled: j };
    });
    return { type: 'scramble', items: shuffle(items, rand), seed: seed, rtl: parsed.rtl, script: parsed.script };
  }

  window.WPM = {
    clean: clean, split: split, parse: parse, rng: rng, shuffle: shuffle, scriptOf: scriptOf, isRTL: isRTL,
    makeSearch: makeSearch, makeCrossword: makeCrossword, makeScramble: makeScramble,
    hasSegmenter: !!segmenter, MAX_WORDS: MAX_WORDS
  };
})();
