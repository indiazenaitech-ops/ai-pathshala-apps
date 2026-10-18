/* Tambola (Housie) engine: seeded tickets and claim checks. Pure functions, no DOM, no network.
 *
 * Ticket rules (standard Indian Tambola / 90-ball):
 *   3 rows x 9 columns, exactly 5 numbers in every row (15 per ticket), column 1 = 1-9, column 2 = 10-19 ...
 *   column 9 = 80-90, every column has at least one number, numbers go up from top to bottom inside a column.
 * Tickets always come in strips of 6 that use every number 1-90 exactly once. Ticket n belongs to strip
 * floor((n - 1) / 6), so "game code + ticket number" is enough to rebuild any ticket on any device:
 * the strip is drawn from a PRNG (xmur3 hash -> mulberry32) seeded with the game code and the strip number.
 */
(function (root) {
  'use strict';
  var ROWS = 3, COLS = 9, PER_ROW = 5, PER_TICKET = 15, STRIP = 6;
  var RANGE = [[1, 9], [10, 19], [20, 29], [30, 39], [40, 49], [50, 59], [60, 69], [70, 79], [80, 90]];
  var CODE_ABC = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';     // no 0/O, 1/I/L: easy to read aloud and type
  var MAX_TICKET = 99996;                                // a multiple of 6, so the last strip is whole

  function colOf(n) { return n >= 80 ? 8 : Math.floor(n / 10); }

  /* ---------------- seeded PRNG: same code -> same tickets in every browser ---------------- */
  function xmur3(str) {
    for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^= h >>> 16) >>> 0;
    };
  }
  function mulberry32(a) {
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rngFor(code, strip) { return mulberry32(xmur3('tambola|v1|' + code + '|' + strip)()); }
  function rint(rng, n) { return Math.floor(rng() * n); }
  function shuffle(a, rng) {
    for (var i = a.length - 1; i > 0; i--) { var j = rint(rng, i + 1), x = a[i]; a[i] = a[j]; a[j] = x; }
    return a;
  }

  /* ---------------- fair randomness for the caller (crypto, no modulo bias) ---------------- */
  var cryptoObj = root.crypto || root.msCrypto;
  function rnd32() {
    if (cryptoObj && cryptoObj.getRandomValues) { var a = new Uint32Array(1); cryptoObj.getRandomValues(a); return a[0]; }
    return Math.floor(Math.random() * 4294967296);
  }
  function randBelow(n) {
    if (n <= 1) return 0;
    var limit = 4294967296 - (4294967296 % n), x;
    do { x = rnd32(); } while (x >= limit);
    return x % n;
  }

  /* ---------------- game codes ---------------- */
  function normCode(s) { return String(s == null ? '' : s).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16); }
  function codeOk(s) { var c = normCode(s); return c.length >= 3 && c.length <= 16; }
  function randomCode() { var s = ''; for (var i = 0; i < 6; i++) s += CODE_ABC[randBelow(CODE_ABC.length)]; return s; }

  /* ---------------- strip generation ---------------- */
  /* How many numbers each of the 6 tickets has in each column: every cell 1..3, every ticket 15,
     column totals 9, 10 x 7, 11. Start from 1 everywhere and deal the 36 "extra" numbers at random
     (weighted by how many each ticket still needs); retry the deal in the rare case it gets stuck. */
  function stripCounts(rng) {
    for (var attempt = 0; attempt < 100; attempt++) {
      var counts = [], need = [], t, c;
      for (t = 0; t < STRIP; t++) { counts.push([1, 1, 1, 1, 1, 1, 1, 1, 1]); need.push(PER_TICKET - COLS); }
      var tokens = [];
      for (c = 0; c < COLS; c++) for (var k = RANGE[c][1] - RANGE[c][0] + 1 - STRIP; k > 0; k--) tokens.push(c);
      shuffle(tokens, rng);
      var ok = true;
      for (var i = 0; i < tokens.length && ok; i++) {
        var col = tokens[i], cands = [], w = 0;
        for (t = 0; t < STRIP; t++) if (need[t] > 0 && counts[t][col] < ROWS) { cands.push(t); w += need[t]; }
        if (!cands.length) { ok = false; break; }
        var r = rng() * w, pick = cands[cands.length - 1];
        for (var j = 0; j < cands.length; j++) { r -= need[cands[j]]; if (r < 0) { pick = cands[j]; break; } }
        counts[pick][col]++; need[pick]--;
      }
      if (ok) return counts;
    }
    /* never reached in practice; a fixed valid deal keeps the function total */
    return [[2, 2, 2, 2, 1, 2, 2, 1, 1], [1, 2, 1, 2, 2, 2, 1, 2, 2], [2, 1, 2, 1, 2, 1, 2, 2, 2],
      [1, 2, 2, 2, 2, 1, 2, 1, 2], [2, 1, 2, 2, 1, 2, 1, 2, 2], [1, 2, 1, 1, 2, 2, 2, 2, 2]];
  }

  /* Can 3 rows with these free places still take columns with these counts (each 1..3)?
     Gale-Ryser for a 3-row 0/1 matrix: sorted r1 >= r2 >= r3, r1 <= #columns, r1 + r2 <= sum min(c, 2), total equal. */
  function feasible(caps, cols) {
    var n = cols.length, s = 0, s2 = 0;
    for (var i = 0; i < n; i++) { s += cols[i]; s2 += Math.min(cols[i], 2); }
    var r = caps.slice().sort(function (a, b) { return b - a; });
    return r[2] >= 0 && r[0] + r[1] + r[2] === s && r[0] <= n && r[0] + r[1] <= s2;
  }
  var SUBSETS = { 1: [[0], [1], [2]], 2: [[0, 1], [0, 2], [1, 2]], 3: [[0, 1, 2]] };
  /* Which cells of a ticket hold numbers, given how many numbers each column has: 5 per row.
     Columns are placed in random order; each choice keeps the rest solvable, so it never gets stuck. */
  function layout(counts, rng) {
    var order = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8], rng), caps = [PER_ROW, PER_ROW, PER_ROW];
    var grid = [[0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0]];
    for (var i = 0; i < COLS; i++) {
      var c = order[i], rest = [];
      for (var j = i + 1; j < COLS; j++) rest.push(counts[order[j]]);
      var opts = SUBSETS[counts[c]].filter(function (sub) {
        var nc = caps.slice();
        for (var k = 0; k < sub.length; k++) nc[sub[k]]--;
        return feasible(nc, rest);
      });
      if (!opts.length) opts = SUBSETS[counts[c]];          // cannot happen for valid counts
      var pick = opts[rint(rng, opts.length)];
      for (var m = 0; m < pick.length; m++) { caps[pick[m]]--; grid[pick[m]][c] = 1; }
    }
    return grid;
  }

  var cache = {}, cacheKeys = [];
  /* 6 tickets that together hold every number 1-90 exactly once. strip index s = 0, 1, 2 ... */
  function strip(code, s) {
    code = normCode(code); s = Math.max(0, Math.floor(s) || 0);
    var key = code + '|' + s;
    if (cache[key]) return cache[key];
    var rng = rngFor(code, s), counts = stripCounts(rng), tickets = [], t, c, r;
    for (t = 0; t < STRIP; t++) {
      var g = layout(counts[t], rng);
      tickets.push({ no: s * STRIP + t + 1, code: code, rows: g });
    }
    for (c = 0; c < COLS; c++) {
      var pool = [];
      for (var n = RANGE[c][0]; n <= RANGE[c][1]; n++) pool.push(n);
      shuffle(pool, rng);
      var p = 0;
      for (t = 0; t < STRIP; t++) {
        var mine = pool.slice(p, p + counts[t][c]).sort(function (a, b) { return a - b; });
        p += counts[t][c];
        for (r = 0; r < ROWS; r++) if (tickets[t].rows[r][c]) tickets[t].rows[r][c] = mine.shift();
      }
    }
    cache[key] = tickets; cacheKeys.push(key);
    if (cacheKeys.length > 400) delete cache[cacheKeys.shift()];
    return tickets;
  }
  function ticket(code, no) {
    no = Math.floor(no);
    if (!(no >= 1 && no <= MAX_TICKET)) return null;
    return strip(code, Math.floor((no - 1) / STRIP))[(no - 1) % STRIP];
  }

  /* ---------------- reading tickets ---------------- */
  function rowNums(tk, r) { return tk.rows[r].filter(function (x) { return x > 0; }); }
  function numbersOf(tk) { return rowNums(tk, 0).concat(rowNums(tk, 1), rowNums(tk, 2)).sort(function (a, b) { return a - b; }); }

  /* list of problems; [] = a valid standard ticket */
  function validate(tk) {
    var bad = [], seen = {};
    if (!tk || !tk.rows || tk.rows.length !== ROWS) return ['shape'];
    for (var r = 0; r < ROWS; r++) {
      if (tk.rows[r].length !== COLS) bad.push('row ' + r + ' length');
      if (rowNums(tk, r).length !== PER_ROW) bad.push('row ' + r + ' has ' + rowNums(tk, r).length + ' numbers');
    }
    for (var c = 0; c < COLS; c++) {
      var last = 0, cnt = 0;
      for (r = 0; r < ROWS; r++) {
        var n = tk.rows[r][c];
        if (!n) continue;
        cnt++;
        if (n < RANGE[c][0] || n > RANGE[c][1]) bad.push(n + ' in column ' + (c + 1));
        if (n <= last) bad.push('column ' + (c + 1) + ' not ascending');
        if (seen[n]) bad.push(n + ' twice');
        seen[n] = 1; last = n;
      }
      if (!cnt) bad.push('column ' + (c + 1) + ' empty');
    }
    return bad;
  }

  /* A ticket typed by hand (printed elsewhere): three lists of numbers, one per row.
     Returns { tk } or { error: 'range'|'dup'|'col'|'empty', list: [...] }. Rows need not hold exactly 5. */
  function fromRows(lists) {
    var rows = [[0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0]];
    var seen = {}, out = [], dup = [], all = 0;
    for (var r = 0; r < ROWS; r++) {
      var L = lists[r] || [];
      if (!L.length) return { error: 'empty', list: [] };
      for (var i = 0; i < L.length; i++) {
        var n = L[i];
        if (!(n >= 1 && n <= 90) || n % 1) { out.push(n); continue; }
        if (seen[n]) { dup.push(n); continue; }
        seen[n] = 1; all++;
        var c = colOf(n);
        if (rows[r][c]) return { error: 'col', list: [Math.min(rows[r][c], n), Math.max(rows[r][c], n)] };
        rows[r][c] = n;
      }
    }
    if (out.length) return { error: 'range', list: out };
    if (dup.length) return { error: 'dup', list: dup };
    if (!all) return { error: 'empty', list: [] };
    return { tk: { no: 0, code: '', rows: rows, typed: true } };
  }
  function parseNums(text) {
    return (String(text || '').match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  }

  /* ---------------- claims ---------------- */
  var PATTERNS = ['early5', 'top', 'middle', 'bottom', 'corners', 'full', 'full2', 'full3'];
  function base(p) { return p === 'full2' || p === 'full3' ? 'full' : p; }
  /* numbers a pattern needs (early five: any 5 of the 15) */
  function needed(tk, p) {
    p = base(p);
    if (p === 'top') return rowNums(tk, 0);
    if (p === 'middle') return rowNums(tk, 1);
    if (p === 'bottom') return rowNums(tk, 2);
    if (p === 'corners') {
      var a = rowNums(tk, 0), b = rowNums(tk, 2), out = [];
      [a[0], a[a.length - 1], b[0], b[b.length - 1]].forEach(function (n) { if (n && out.indexOf(n) < 0) out.push(n); });
      return out;
    }
    return numbersOf(tk);
  }
  /* check(ticket, pattern, calledInOrder) -> { ok, need, missing, have, left, completedAt } on the called list:
     completedAt = index in the called list of the number that completed the pattern (-1 = not yet). */
  function check(tk, p, called) {
    var pos = {};
    for (var i = 0; i < called.length; i++) if (pos[called[i]] === undefined) pos[called[i]] = i;
    var need = needed(tk, p), b = base(p);
    if (b === 'early5') {
      var hits = need.filter(function (n) { return pos[n] !== undefined; }).map(function (n) { return pos[n]; }).sort(function (x, y) { return x - y; });
      var ok5 = hits.length >= 5;
      return { ok: ok5, need: need, missing: [], have: hits.length, left: Math.max(0, 5 - hits.length), completedAt: ok5 ? hits[4] : -1, any: true };
    }
    var missing = need.filter(function (n) { return pos[n] === undefined; });
    var ok = !missing.length && need.length > 0, at = -1;
    if (ok) need.forEach(function (n) { if (pos[n] > at) at = pos[n]; });
    return { ok: ok, need: need, missing: missing, have: need.length - missing.length, left: missing.length, completedAt: at, any: false };
  }
  /* which patterns a set of marked numbers completes (for the player's own phone ticket) */
  function completedBy(tk, marked) {
    var set = {}; marked.forEach(function (n) { set[n] = 1; });
    var hits = numbersOf(tk).filter(function (n) { return set[n]; }).length;
    return ['early5', 'top', 'middle', 'bottom', 'corners', 'full'].filter(function (p) {
      if (p === 'early5') return hits >= 5;
      var need = needed(tk, p);
      return need.length && need.every(function (n) { return set[n]; });
    });
  }

  root.TAMBOLA = {
    ROWS: ROWS, COLS: COLS, STRIP: STRIP, RANGE: RANGE, MAX_TICKET: MAX_TICKET, PATTERNS: PATTERNS,
    colOf: colOf, normCode: normCode, codeOk: codeOk, randomCode: randomCode, randBelow: randBelow,
    strip: strip, ticket: ticket, rowNums: rowNums, numbersOf: numbersOf, validate: validate,
    fromRows: fromRows, parseNums: parseNums, base: base, needed: needed, check: check, completedBy: completedBy,
    _feasible: feasible
  };
})(typeof window !== 'undefined' ? window : this);
