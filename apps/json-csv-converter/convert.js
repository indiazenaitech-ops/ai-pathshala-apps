/* JSON ↔ CSV Converter: the engine (no DOM). window.JCC */
(function () {
  'use strict';
  function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function typeOf(v) { return v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v; }

  /* ---------------- JSON error finder ----------------
     JSON.parse only says "something is wrong". This walks the text and returns
     { kind, pos, line, col } for the first problem, with a kind we can explain in simple words. */
  function locate(text) {
    var i = 0, n = text.length;
    function fail(kind, pos) { var e = new Error(kind); e.kind = kind; e.pos = pos === undefined ? i : pos; throw e; }
    function ws() {
      for (;;) {
        var c = text.charCodeAt(i);
        if (c === 32 || c === 9 || c === 10 || c === 13 || c === 0xFEFF) i++;
        else if (c === 47 && (text.charAt(i + 1) === '/' || text.charAt(i + 1) === '*')) fail('comment');
        else return;
      }
    }
    function str() {
      var start = i; i++;
      for (;;) {
        if (i >= n) fail('unclosed_string', start);
        var c = text.charAt(i);
        if (c === '"') { i++; return; }
        if (c === '\\') {
          var e = text.charAt(i + 1);
          if (e === 'u') { if (!/^[0-9a-fA-F]{4}$/.test(text.substr(i + 2, 4))) fail('bad_escape'); i += 6; continue; }
          if ('"\\/bfnrt'.indexOf(e) < 0 || e === '') fail('bad_escape');
          i += 2; continue;
        }
        if (text.charCodeAt(i) < 32) fail(c === '\n' || c === '\r' ? 'newline_in_string' : 'bad_char_in_string');
        i++;
      }
    }
    var NUM = /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/y;
    function num() {
      NUM.lastIndex = i;
      var m = NUM.exec(text);
      if (!m || !m[0] || m[0] === '-') fail('bad_number');
      var next = text.charAt(i + m[0].length);
      if (/[0-9.eExX]/.test(next)) fail('bad_number');
      i += m[0].length;
    }
    function word() {
      var m = /^[A-Za-z_$][\w$]*/.exec(text.substr(i, 40));
      var w = m ? m[0] : '';
      if (w === 'true' || w === 'false' || w === 'null') { i += w.length; return; }
      if (/^(True|False|None|NULL|Null|undefined|NaN|Infinity)$/.test(w)) fail('bad_literal');
      fail(w ? 'no_quotes' : 'unexpected_char');
    }
    function value(depth) {
      if (depth > 2000) fail('too_deep');
      ws();
      if (i >= n) fail('unexpected_end');
      var c = text.charAt(i);
      if (c === '{') return obj(depth);
      if (c === '[') return arr(depth);
      if (c === '"') return str();
      if (c === "'") fail('single_quotes');
      if (c === '-' || (c >= '0' && c <= '9')) return num();
      if (/[A-Za-z_$]/.test(c)) return word();
      if (c === ',') fail('extra_comma');
      fail('unexpected_char');
    }
    function obj(depth) {
      i++; ws();
      if (text.charAt(i) === '}') { i++; return; }
      for (;;) {
        ws();
        var c = text.charAt(i);
        if (i >= n) fail('unexpected_end');
        if (c === '}') fail('trailing_comma');
        if (c === "'") fail('single_quotes');
        if (c === ',') fail('extra_comma');
        if (c !== '"') fail(/[A-Za-z_$0-9]/.test(c) ? 'key_quotes' : 'unexpected_char');
        str(); ws();
        if (text.charAt(i) !== ':') fail(i >= n ? 'unexpected_end' : 'missing_colon');
        i++;
        value(depth + 1); ws();
        c = text.charAt(i);
        if (c === ',') { i++; continue; }
        if (c === '}') { i++; return; }
        if (i >= n) fail('unexpected_end');
        fail('missing_comma');
      }
    }
    function arr(depth) {
      i++; ws();
      if (text.charAt(i) === ']') { i++; return; }
      for (;;) {
        ws();
        if (text.charAt(i) === ']') fail('trailing_comma');
        if (text.charAt(i) === ',') fail('extra_comma');
        value(depth + 1); ws();
        var c = text.charAt(i);
        if (c === ',') { i++; continue; }
        if (c === ']') { i++; return; }
        if (i >= n) fail('unexpected_end');
        fail('missing_comma');
      }
    }
    try {
      ws();
      if (i >= n) fail('empty');
      value(0); ws();
      if (i < n) fail('extra_text');
      return null;
    } catch (e) {
      var kind = e.kind || 'unexpected_char', pos = Math.min(e.kind ? e.pos : i, n);
      return Object.assign({ kind: kind, pos: pos }, lineCol(text, pos));
    }
  }
  function lineCol(text, pos) {
    var line = 1, last = -1;
    for (var k = text.indexOf('\n'); k >= 0 && k < pos; k = text.indexOf('\n', k + 1)) { line++; last = k; }
    var end = text.indexOf('\n', pos); if (end < 0) end = text.length;
    var lineText = text.slice(last + 1, end).replace(/\r$/, '');
    return { line: line, col: pos - last, lineText: lineText };
  }

  /* parse JSON or JSON Lines. Returns { ok, value, lines (true if JSON Lines), error } */
  function parseAny(text) {
    text = String(text).replace(/^﻿/, '');
    if (!text.trim()) return { ok: false, error: { kind: 'empty', pos: 0, line: 1, col: 1, lineText: '' } };
    try { return { ok: true, value: JSON.parse(text), lines: false }; } catch (e) { /* maybe JSON Lines */ }
    var rows = text.split('\n'), out = [], okLines = 0;
    for (var r = 0; r < rows.length; r++) {
      var l = rows[r].trim();
      if (!l) continue;
      try { out.push(JSON.parse(l)); okLines++; } catch (e) { okLines = -1; break; }
    }
    if (okLines > 1) return { ok: true, value: out, lines: true };
    var err = locate(text) || { kind: 'unexpected_char', pos: 0, line: 1, col: 1, lineText: '' };
    /* if most lines look like JSON Lines, point at the bad line instead */
    if (err.kind === 'extra_text') {
      var bad = jsonlError(text);
      if (bad) err = bad;
    }
    return { ok: false, error: err };
  }
  function jsonlError(text) {
    var start = 0;
    while (start <= text.length) {
      var end = text.indexOf('\n', start); if (end < 0) end = text.length;
      var l = text.slice(start, end);
      if (l.trim()) {
        var e = locate(l);
        if (e) { var lc = lineCol(text, start + e.pos); return Object.assign({ kind: e.kind, pos: start + e.pos }, lc); }
      }
      if (end >= text.length) break;
      start = end + 1;
    }
    return null;
  }

  /* ---------------- choosing the records ---------------- */
  /* candidate lists inside a JSON value: [{ path, count, objects }] (path '' = the value itself) */
  function findLists(v) {
    var out = [];
    (function walk(x, path, depth) {
      if (Array.isArray(x)) {
        var objs = 0; for (var i = 0; i < x.length && i < 200; i++) if (isObj(x[i])) objs++;
        out.push({ path: path, count: x.length, objects: objs > 0 });
        return;
      }
      if (isObj(x) && depth < 5) Object.keys(x).forEach(function (k) { walk(x[k], path ? path + '.' + k : k, depth + 1); });
    })(v, '', 0);
    return out.filter(function (c) { return c.objects; });
  }
  function getPath(v, path) {
    if (!path) return v;
    /* walk key by key; keys may contain dots, so try the longest key first */
    var parts = path.split('.'), cur = v;
    while (parts.length) {
      if (!isObj(cur)) return undefined;
      for (var take = parts.length; take > 0; take--) {
        var k = parts.slice(0, take).join('.');
        if (Object.prototype.hasOwnProperty.call(cur, k)) { cur = cur[k]; parts = parts.slice(take); break; }
      }
      if (take === 0) return undefined;
    }
    return cur;
  }
  function defaultPath(v) {
    if (Array.isArray(v)) return '';
    var c = findLists(v);
    if (!c.length) return null;   /* the whole object is one record */
    c.sort(function (a, b) { return b.count - a.count; });
    return c[0].path;
  }
  function records(v, path) {
    var x = path === null || path === undefined ? v : getPath(v, path);
    if (x === undefined) x = v;
    return Array.isArray(x) ? x : [x];
  }

  /* ---------------- JSON → table ---------------- */
  function cellText(v) { return v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v); }
  /* arrays: 'join' (simple values "a; b", lists of objects as JSON text), 'explode' (lists of objects become rows), 'json' */
  function expand(v, prefix, mode, cap) {
    if (Array.isArray(v)) {
      var allSimple = v.every(function (x) { return x === null || typeof x !== 'object'; });
      if (mode === 'explode' && !v.length) return [{}];
      if (mode === 'explode' && v.length && !allSimple) {
        var rows = [];
        for (var i = 0; i < v.length; i++) {
          var sub = expand(v[i], prefix, mode, cap);
          for (var s = 0; s < sub.length; s++) rows.push(sub[s]);
          if (rows.length > cap.max) { cap.hit = true; break; }
        }
        return rows;
      }
      var o = {};
      o[prefix || 'value'] = mode === 'json' || !allSimple ? JSON.stringify(v) : v.map(cellText).join('; ');
      return [o];
    }
    if (isObj(v)) {
      var keys = Object.keys(v), acc = [{}];
      if (!keys.length) { var e = {}; if (prefix) e[prefix] = ''; return [e]; }
      keys.forEach(function (k) {
        var sub = expand(v[k], prefix ? prefix + '.' + k : k, mode, cap);
        if (sub.length === 1) { acc.forEach(function (r) { Object.assign(r, sub[0]); }); return; }
        var next = [];
        acc.forEach(function (r) { sub.forEach(function (s) { if (next.length <= cap.max) next.push(Object.assign({}, r, s)); }); });
        if (next.length > cap.max) cap.hit = true;
        acc = next;
      });
      return acc;
    }
    var p = {}; p[prefix || 'value'] = cellText(v); return [p];
  }
  function toTable(recs, mode, max) {
    var cap = { max: max || 200000, hit: false }, rows = [], cols = [], seen = Object.create(null), dotKeys = 0;
    for (var r = 0; r < recs.length; r++) {
      var ex = expand(recs[r], '', mode, cap);
      for (var e = 0; e < ex.length; e++) {
        var o = ex[e];
        for (var k in o) if (!(k in seen)) { seen[k] = cols.length; cols.push(k); }
        rows.push(o);
      }
      if (rows.length > cap.max) { cap.hit = true; rows.length = cap.max; break; }
    }
    recs.slice(0, 500).forEach(function (x) { if (isObj(x)) Object.keys(x).forEach(function (k) { if (k.indexOf('.') >= 0) dotKeys++; }); });
    return {
      headers: cols,
      rows: rows.map(function (o) { return cols.map(function (c) { return c in o ? o[c] : ''; }); }),
      capped: cap.hit, dotKeys: dotKeys
    };
  }

  /* ---------------- CSV → JSON ---------------- */
  var NUMBER = /^-?(0|[1-9]\d{0,14})(\.\d+)?$/;
  function typed(s, keepText) {
    if (keepText) return s;
    var t = s.trim();
    if (t === '') return null;
    if (/^true$/i.test(t)) return true;
    if (/^false$/i.test(t)) return false;
    if (NUMBER.test(t)) return Number(t);
    return s;
  }
  function setPath(o, keys, v) {
    var cur = o;
    for (var i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in cur)) cur[keys[i]] = {};
      else if (!isObj(cur[keys[i]])) return false;
      cur = cur[keys[i]];
    }
    var last = keys[keys.length - 1];
    if (isObj(cur[last])) return false;
    cur[last] = v; return true;
  }
  function tableToObjects(table, opt) {
    opt = opt || {};
    var H = table.headers;
    return table.rows.map(function (r) {
      var o = {};
      for (var c = 0; c < H.length; c++) {
        var v = typed(r[c] == null ? '' : String(r[c]), opt.keepText);
        var h = H[c];
        if (opt.nest && h.indexOf('.') > 0 && h.indexOf('..') < 0 && h.charAt(h.length - 1) !== '.') { if (!setPath(o, h.split('.'), v)) o[h] = v; }
        else o[h] = v;
      }
      return o;
    });
  }

  /* ---------------- schema ---------------- */
  function schema(recs, limit) {
    var map = Object.create(null), order = [], n = Math.min(recs.length, limit || 20000);
    function add(path, v, seen) {
      var f = map[path];
      if (!f) { f = map[path] = { path: path, types: {}, present: 0, example: undefined }; order.push(path); }
      var t = typeOf(v); f.types[t] = (f.types[t] || 0) + 1;
      if (!seen[path]) { seen[path] = 1; if (v !== null && v !== '') f.present++; }
      if (f.example === undefined && v !== null && typeof v !== 'object' && v !== '') f.example = v;
    }
    function walk(v, path, seen) {
      if (isObj(v) && path) add(path, v, seen);
      if (isObj(v)) { Object.keys(v).forEach(function (k) { walk(v[k], path ? path + '.' + k : k, seen); }); return; }
      if (Array.isArray(v)) {
        add(path || '[]', v, seen);
        for (var i = 0; i < v.length && i < 50; i++) walk(v[i], (path || '') + '[]', seen);
        return;
      }
      add(path || 'value', v, seen);
    }
    for (var r = 0; r < n; r++) walk(recs[r], '', {});
    return { fields: order.map(function (p) { return map[p]; }), records: n };
  }

  window.JCC = { locate: locate, lineCol: lineCol, parseAny: parseAny, findLists: findLists, getPath: getPath, defaultPath: defaultPath,
    records: records, toTable: toTable, typed: typed, tableToObjects: tableToObjects, schema: schema, typeOf: typeOf, cellText: cellText };
})();
