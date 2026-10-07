/* Join & Merge Files: the engine (no DOM). window.CJM
   A table is { headers: [..], rows: [[..], ..] } of strings. */
(function () {
  'use strict';
  function tidy(v) { return String(v == null ? '' : v).replace(/[\s ​]+/g, ' ').trim(); }

  /* the key used for matching; null = blank key (never matches) */
  function normKey(v, o) {
    var s = v == null ? '' : String(v);
    if (o.trim !== false) s = tidy(s);
    if (s === '') return null;
    if (o.icase) s = s.toLowerCase();
    if (o.numeric && /^[+-]?\d+(\.\d+)?$/.test(tidy(s))) s = String(Number(tidy(s)));
    return s;
  }

  /* join A (left) with B (right) on columns ka / kb.
     type: inner | left | right | full.  Returns pairs [aIndex|-1, bIndex|-1] and counts. */
  function join(A, B, ka, kb, type, o) {
    o = o || {};
    var map = Object.create(null), cntA = Object.create(null), dupB = 0, dupA = 0, blankA = 0, blankB = 0;
    for (var j = 0; j < B.rows.length; j++) {
      var k = normKey(B.rows[j][kb], o);
      if (k === null) { blankB++; continue; }
      if (map[k]) { if (map[k].length === 1) dupB++; map[k].push(j); } else map[k] = [j];
    }
    var pairs = [], usedB = new Uint8Array(B.rows.length), matchedA = 0, onlyA = 0;
    for (var i = 0; i < A.rows.length; i++) {
      var ki = normKey(A.rows[i][ka], o), m = ki === null ? null : map[ki];
      if (ki === null) blankA++;
      else { if (cntA[ki] === 1) dupA++; cntA[ki] = (cntA[ki] || 0) + 1; }
      if (m) {
        matchedA++;
        for (var x = 0; x < m.length; x++) { usedB[m[x]] = 1; if (type !== 'onlyB') pairs.push([i, m[x]]); }
      } else {
        onlyA++;
        if (type === 'left' || type === 'full') pairs.push([i, -1]);
      }
    }
    var matchedB = 0, onlyB = 0;
    for (j = 0; j < B.rows.length; j++) {
      if (usedB[j]) { matchedB++; continue; }
      onlyB++;
      if (type === 'right' || type === 'full') pairs.push([-1, j]);
    }
    if (type === 'right') {
      /* keep the right file's order for a right join */
      pairs.sort(function (p, q) { return p[1] - q[1] || p[0] - q[0]; });
    }
    var inner = 0;
    for (var p = 0; p < pairs.length; p++) if (pairs[p][0] >= 0 && pairs[p][1] >= 0) inner++;
    return { pairs: pairs, matchedA: matchedA, onlyA: onlyA, matchedB: matchedB, onlyB: onlyB, dupKeysA: dupA, dupKeysB: dupB,
      blankA: blankA, blankB: blankB, innerRows: inner, rows: pairs.length };
  }

  /* all possible output columns: A's columns, then B's (B key hidden by default, its value shows in A's key column) */
  function outColumns(A, B, ka, kb, suffix) {
    var cols = [], used = {};
    A.headers.forEach(function (h, i) { cols.push({ side: 'a', idx: i, name: h, key: i === ka, on: true }); used[h] = 1; });
    B.headers.forEach(function (h, i) {
      var n = h;
      if (used[n]) n = h + suffix;
      var k = 2; while (used[n]) n = h + suffix + ' ' + (k++);
      used[n] = 1;
      cols.push({ side: 'b', idx: i, name: n, key: i === kb, on: !(i === kb) });
    });
    return cols;
  }
  /* one output row; the A key column falls back to B's key for rows found only in B */
  function cell(A, B, kb, pair, c) {
    var a = pair[0], b = pair[1];
    if (c.side === 'a') {
      if (a >= 0) { var v = A.rows[a][c.idx]; return v == null ? '' : v; }
      if (c.key && b >= 0) { var w = B.rows[b][kb]; return w == null ? '' : w; }
      return '';
    }
    if (b < 0) return '';
    var u = B.rows[b][c.idx]; return u == null ? '' : u;
  }
  function buildRows(A, B, kb, res, cols) {
    var on = cols.filter(function (c) { return c.on; });
    return {
      headers: on.map(function (c) { return c.name; }),
      rows: res.pairs.map(function (p) { return on.map(function (c) { return cell(A, B, kb, p, c); }); })
    };
  }

  /* guess a matching key pair: same column name, else the pair whose values overlap most */
  function guessKeys(A, B) {
    var la = A.headers.map(function (h) { return tidy(h).toLowerCase(); });
    var lb = B.headers.map(function (h) { return tidy(h).toLowerCase(); });
    for (var i = 0; i < la.length; i++) { var j = lb.indexOf(la[i]); if (j >= 0) return [i, j]; }
    var best = [0, 0], bestN = 0, o = { trim: true, icase: true, numeric: true };
    var sample = function (T, c) { var s = Object.create(null), n = Math.min(T.rows.length, 2000); for (var r = 0; r < n; r++) { var k = normKey(T.rows[r][c], o); if (k !== null) s[k] = 1; } return s; };
    for (i = 0; i < A.headers.length && i < 40; i++) {
      var sa = sample(A, i);
      for (j = 0; j < B.headers.length && j < 40; j++) {
        var sb = sample(B, j), n = 0;
        for (var k in sb) if (sa[k]) n++;
        if (n > bestN) { bestN = n; best = [i, j]; }
      }
    }
    return best;
  }

  /* stack (append) files: columns matched by name. files: [{name, table}] */
  function stack(files, o) {
    o = o || {};
    var cols = [], index = Object.create(null);
    var keyOf = function (h) { return o.loose !== false ? tidy(h).toLowerCase() : h; };
    var info = files.map(function (f) {
      var map = [], added = 0;
      f.table.headers.forEach(function (h) {
        var k = keyOf(h);
        if (!(k in index)) { index[k] = cols.length; cols.push(o.loose !== false ? tidy(h) : h); added++; }
        map.push(index[k]);
      });
      return { map: map, added: added };
    });
    var headers = cols.slice(), rows = [];
    files.forEach(function (f, fi) {
      var m = info[fi].map;
      f.table.rows.forEach(function (r) {
        var out = new Array(cols.length);
        for (var c = 0; c < cols.length; c++) out[c] = '';
        for (var i = 0; i < m.length; i++) out[m[i]] = r[i] == null ? '' : r[i];
        if (o.source) out.push(f.name);
        rows.push(out);
      });
    });
    if (o.source) headers.push(o.sourceName || 'Source file');
    var perFile = files.map(function (f, fi) {
      var have = {}; info[fi].map.forEach(function (c) { have[c] = 1; });
      return { rows: f.table.rows.length, cols: f.table.headers.length, added: fi === 0 ? 0 : info[fi].added, missing: cols.filter(function (c, i) { return !have[i]; }) };
    });
    return { table: { headers: headers, rows: rows }, perFile: perFile };
  }

  /* CSV text → table (auto-detects , ; tab |) */
  function detectDelim(text) {
    var lines = text.split(/\r?\n/, 6).filter(function (l) { return l.trim(); });
    var best = ',', bestScore = -1;
    [',', ';', '\t', '|'].forEach(function (d) {
      var counts = lines.map(function (l) { var n = 0, q = false; for (var i = 0; i < l.length; i++) { var ch = l.charAt(i); if (ch === '"') q = !q; else if (ch === d && !q) n++; } return n; });
      if (!counts.length || !counts[0]) return;
      var score = counts.filter(function (n) { return n === counts[0]; }).length * 1000 + counts[0];
      if (score > bestScore) { bestScore = score; best = d; }
    });
    return best;
  }
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

  window.CJM = { tidy: tidy, normKey: normKey, join: join, outColumns: outColumns, buildRows: buildRows, cell: cell, guessKeys: guessKeys, stack: stack, detectDelim: detectDelim, toTable: toTable };
})();
