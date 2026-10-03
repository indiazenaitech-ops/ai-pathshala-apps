/* SQL Playground: SQLite (sql.js) in the browser with a ready CBSE-style school database. */
(function () {
  'use strict';
  var SLUG = 'sql-playground';
  var SQLJS_BASE = 'https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/';
  var MAX_SHOW = 500;                 // rows rendered per result table
  var MAX_SAVE_BYTES = 1500000;       // biggest database we keep in EDU.store
  var SIZES = [1, 1.2, 1.45];         // editor / table text sizes (rem)
  var DATA = window.SQLP_DATA;
  var store = EDU.store(SLUG);
  var t = EDU.t;
  var $ = EDU.$;

  EDU.init({ slug: SLUG, title: 'app_title', wide: true });

  var SQL = null;        // sql.js module
  var db = null;         // main database
  var refCache = {};     // practice index -> reference result
  var lastBlocks = [];   // model of the results area (re-rendered on language change)
  var inTxn = false;     // user opened BEGIN without COMMIT: don't export (export would roll back)
  var currentTask = store.get('task', null);
  var showAnswer = false;
  var checkState = null; // {ok, key, vars}
  var solved = store.get('solved', []);
  if (!Array.isArray(solved)) solved = [];
  var history = store.get('history', []);
  if (!Array.isArray(history)) history = [];
  var sizeIdx = EDU.clamp(store.get('size', 0) | 0, 0, SIZES.length - 1);

  var editor = $('#editor');
  var DEFAULT_SQL = 'SELECT * FROM STUDENT;';
  editor.value = store.get('draft', DEFAULT_SQL);

  /* ------------------------------------------------------------ helpers */
  function content() { var C = window.APP_CONTENT || {}; return C[EDU.lang] || C.en; }
  function el(tag, props) { return EDU.el.apply(null, arguments); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  /* Render text with `code` spans (from content.js) safely. */
  function richText(node, text) {
    clear(node);
    String(text).split('`').forEach(function (part, i) {
      if (!part) return;
      node.appendChild(i % 2 ? el('code', { class: 'no-i18n', dir: 'ltr', text: part }) : document.createTextNode(part));
    });
    return node;
  }

  function fmtCell(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') {
      if (Number.isInteger(v) || !isFinite(v)) return String(v);
      return String(Number(v.toFixed(4)));
    }
    if (v instanceof Uint8Array) return '[BLOB ' + v.length + ' bytes]';
    return String(v);
  }
  function rawCell(v) {
    if (v === null || v === undefined) return '';
    if (v instanceof Uint8Array) return '';
    return String(v);
  }

  /* ------------------------------------------------------------ MySQL-style functions */
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function parseDate(v) {
    if (v === null || v === undefined) return null;
    var m = String(v).match(/^\s*(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (!m) return null;
    var y = +m[1], mo = +m[2], d = +m[3];
    var dt = new Date(Date.UTC(y, mo - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
    return dt;
  }
  function nowParts() {
    var n = new Date();
    return { date: n.getFullYear() + '-' + pad(n.getMonth() + 1) + '-' + pad(n.getDate()), time: pad(n.getHours()) + ':' + pad(n.getMinutes()) + ':' + pad(n.getSeconds()) };
  }
  function mysqlRound(x, d) {
    if (x === null || x === undefined || d === null || d === undefined) return null;
    x = Number(x); d = Math.trunc(Number(d));
    if (!isFinite(x) || !isFinite(d)) return null;
    d = EDU.clamp(d, -30, 30);
    var sign = x < 0 ? -1 : 1, a = Math.abs(x);
    var r = Number(Math.round(Number(a + 'e' + d)) + 'e' + (-d));
    if (!isFinite(r)) { var f = Math.pow(10, d); r = Math.round(a * f) / f; }
    return sign * r;
  }
  function mysqlSubstr(s, p, n) {
    if (s === null || s === undefined || p === null || p === undefined) return null;
    s = String(s); p = Math.round(Number(p));
    var L = s.length, start;
    if (p > 0) start = p - 1; else if (p < 0) start = L + p; else return '';
    if (start < 0 || start >= L) return '';
    if (n === undefined) return s.slice(start);
    if (n === null) return null;
    n = Math.round(Number(n));
    return n <= 0 ? '' : s.substr(start, n);
  }
  var FNS = {
    UCASE: function (s) { return s === null ? null : String(s).toUpperCase(); },
    LCASE: function (s) { return s === null ? null : String(s).toLowerCase(); },
    MID: function (s, p, n) { return mysqlSubstr(s, p, n); },
    mid: function (s, p) { return mysqlSubstr(s, p); },               // 2-argument MID (name differs only in case)
    LEFT: function (s, n) { if (s === null || n === null) return null; n = Math.max(0, Math.floor(n)); return String(s).slice(0, n); },
    RIGHT: function (s, n) { if (s === null || n === null) return null; n = Math.max(0, Math.floor(n)); return n ? String(s).slice(-n) : ''; },
    CHAR_LENGTH: function (s) { return s === null ? null : Array.from(String(s)).length; },
    MOD: function (a, b) { if (a === null || b === null || Number(b) === 0) return null; return Number(a) % Number(b); },
    POW: function (a, b) { if (a === null || b === null) return null; return Math.pow(Number(a), Number(b)); },
    ROUND: function (x, d) { return mysqlRound(x, d); },                 // 2-argument ROUND, MySQL style (ROUND(476.65,-1) = 480)
    TRUNCATE: function (x, d) { if (x === null || d === null) return null; var f = Math.pow(10, Math.trunc(d)); return Math.trunc(Number(x) * f + (x >= 0 ? 1e-9 : -1e-9)) / f; },
    NOW: function () { var p = nowParts(); return p.date + ' ' + p.time; },
    SYSDATE: function () { var p = nowParts(); return p.date + ' ' + p.time; },
    CURDATE: function () { return nowParts().date; },
    CURTIME: function () { return nowParts().time; },
    YEAR: function (v) { var d = parseDate(v); return d ? d.getUTCFullYear() : null; },
    MONTH: function (v) { var d = parseDate(v); return d ? d.getUTCMonth() + 1 : null; },
    DAY: function (v) { var d = parseDate(v); return d ? d.getUTCDate() : null; },
    DAYOFMONTH: function (v) { var d = parseDate(v); return d ? d.getUTCDate() : null; },
    DAYOFWEEK: function (v) { var d = parseDate(v); return d ? d.getUTCDay() + 1 : null; },
    DAYNAME: function (v) { var d = parseDate(v); return d ? DAYS[d.getUTCDay()] : null; },
    MONTHNAME: function (v) { var d = parseDate(v); return d ? MONTHS[d.getUTCMonth()] : null; },
    DATEDIFF: function (a, b) { var x = parseDate(a), y = parseDate(b); return x && y ? Math.round((x - y) / 86400000) : null; }
  };
  function registerFns(d) {
    Object.keys(FNS).forEach(function (name) { try { d.create_function(name, FNS[name]); } catch (e) { /* ignore */ } });
  }

  /* ------------------------------------------------------------ database lifecycle */
  function freshDb() {
    var d = new SQL.Database();
    d.exec('BEGIN;\n' + DATA.seed + '\nCOMMIT;');
    registerFns(d);
    return d;
  }
  function toB64(bytes) {
    var bin = '', CH = 0x8000;
    for (var i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
    return btoa(bin);
  }
  function fromB64(s) {
    var bin = atob(s), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function loadSavedDb() {
    var saved = store.get('db', null);
    if (typeof saved !== 'string' || !saved) return null;
    try {
      var d = new SQL.Database(fromB64(saved));
      d.exec('SELECT count(*) FROM sqlite_master');
      registerFns(d);
      return d;
    } catch (e) { return null; }
  }
  function saveDb() {
    if (!db || inTxn) return;
    try {
      var bytes = db.export();
      registerFns(db);                       // export() removes custom functions
      if (bytes.length > MAX_SAVE_BYTES) { store.remove('db'); EDU.toast(t('too_big'), 4500); return; }
      var b64 = toB64(bytes);
      store.set('db', b64);
      if (store.get('db', '') !== b64) EDU.toast(t('too_big'), 4500);
    } catch (e) { /* storage full or private mode: keep working in memory */ }
  }

  /* ------------------------------------------------------------ SQL splitting */
  function stripComments(s) {
    return s.replace(/\/\*[\s\S]*?(\*\/|$)/g, ' ').replace(/--[^\n]*/g, ' ');
  }
  /* Split a script into statements on ';' outside quotes/comments (keeps CREATE TRIGGER ... END together). */
  function splitSQL(text) {
    var out = [], start = 0, i = 0, n = text.length, c, q = null;
    while (i < n) {
      c = text[i];
      if (q) {
        if (c === q) { if (text[i + 1] === q) i++; else q = null; }
        i++; continue;
      }
      if (c === "'" || c === '"' || c === '`') { q = c; i++; continue; }
      if (c === '[') { var close = text.indexOf(']', i); i = close < 0 ? n : close + 1; continue; }
      if (c === '-' && text[i + 1] === '-') { var nl = text.indexOf('\n', i); i = nl < 0 ? n : nl + 1; continue; }
      if (c === '/' && text[i + 1] === '*') { var e = text.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
      if (c === ';') {
        var piece = text.slice(start, i);
        var clean = stripComments(piece).trim();
        if (/^CREATE\s+(TEMP\w*\s+)?TRIGGER\b/i.test(clean) && !/\bEND$/i.test(clean)) { i++; continue; }
        out.push(piece);
        start = i + 1;
      }
      i++;
    }
    if (start < n) out.push(text.slice(start));
    return out.map(function (s) { return { sql: s.trim(), clean: stripComments(s).trim() }; })
      .filter(function (s) { return s.clean.length > 0; });
  }
  function firstWord(clean) { var m = clean.match(/^[A-Za-z]+/); return m ? m[0].toUpperCase() : ''; }
  function isReadOnly(clean) {
    var w = firstWord(clean);
    return w === 'SELECT' || w === 'VALUES' || w === 'EXPLAIN' || w === 'DESC' || w === 'DESCRIBE' || w === 'SHOW' || w === 'WITH';
  }

  /* ------------------------------------------------------------ execution */
  function tableExists(d, name) {
    var st = d.prepare("SELECT name FROM sqlite_master WHERE type IN ('table','view') AND lower(name) = lower(?)");
    try { st.bind([name]); return st.step() ? st.get()[0] : null; } finally { st.free(); }
  }
  function describe(d, name) {
    var real = tableExists(d, name);
    if (!real) throw new Error('no such table: ' + name);
    var res = d.exec('PRAGMA table_info("' + real.replace(/"/g, '""') + '")');
    var rows = res.length ? res[0].values : [];
    return {
      type: 'rows', columns: ['Field', 'Type', 'Null', 'Key', 'Default'],
      rows: rows.map(function (r) { return [r[1], r[2] || '', (r[3] || r[5]) ? 'NO' : 'YES', r[5] ? 'PRI' : '', r[4]]; }),
      total: rows.length
    };
  }
  function listTables(d) {
    var res = d.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid");
    return res.length ? res[0].values.map(function (r) { return r[0]; }) : [];
  }
  var IDENT = '[`"\\[]?([\\w$]+)[`"\\]]?';
  var RX = {
    desc: new RegExp('^(?:DESC|DESCRIBE|EXPLAIN)\\s+' + IDENT + '$', 'i'),
    showCols: new RegExp('^SHOW\\s+(?:FULL\\s+)?(?:COLUMNS|FIELDS)\\s+(?:FROM|IN)\\s+' + IDENT + '$', 'i'),
    showCreate: new RegExp('^SHOW\\s+CREATE\\s+TABLE\\s+' + IDENT + '$', 'i'),
    showTables: /^SHOW\s+(?:FULL\s+)?TABLES$/i,
    showDbs: /^SHOW\s+(?:DATABASES|SCHEMAS)$/i,
    use: /^USE\s+\S+$/i,
    db: /^(?:CREATE|DROP)\s+(?:DATABASE|SCHEMA)\b/i
  };

  /* Run one statement → a result block. Throws Error on SQL errors. */
  function execOne(d, stmt) {
    var c = stmt.clean.replace(/;+\s*$/, '').trim(), m;
    if ((m = c.match(RX.desc)) || (m = c.match(RX.showCols))) return describe(d, m[1]);
    if (RX.showTables.test(c)) { var names = listTables(d); return { type: 'rows', columns: ['Tables_in_school'], rows: names.map(function (x) { return [x]; }), total: names.length }; }
    if (RX.showDbs.test(c)) return { type: 'rows', columns: ['Database'], rows: [['school']], total: 1 };
    if ((m = c.match(RX.showCreate))) {
      var real = tableExists(d, m[1]);
      if (!real) throw new Error('no such table: ' + m[1]);
      var r = d.exec("SELECT sql FROM sqlite_master WHERE name = '" + real.replace(/'/g, "''") + "'");
      return { type: 'rows', columns: ['Table', 'Create Table'], rows: [[real, r[0].values[0][0]]], total: 1 };
    }
    if (RX.use.test(c)) return { type: 'msg', key: 'msg_use' };
    if (RX.db.test(c)) return { type: 'msg', key: 'msg_create_db' };

    var w = firstWord(c);
    var st = d.prepare(stmt.sql);
    try {
      var cols = st.getColumnNames();
      var rows = [], total = 0;
      while (st.step()) { total++; if (rows.length < MAX_SHOW) rows.push(st.get()); }
      if (w === 'BEGIN' || w === 'SAVEPOINT') inTxn = d === db ? true : inTxn;
      if ((w === 'COMMIT' || w === 'END' || (w === 'ROLLBACK' && !/^ROLLBACK\s+(TRANSACTION\s+)?TO\b/i.test(c))) && d === db) inTxn = false;
      if (cols.length) return { type: 'rows', columns: cols, rows: rows, total: total };
      var changes = d.getRowsModified();
      if (w === 'INSERT' || w === 'REPLACE') return { type: 'msg', key: 'ins_n', vars: { n: changes }, ok: true };
      if (w === 'UPDATE') return { type: 'msg', key: 'upd_n', vars: { n: changes }, ok: true };
      if (w === 'DELETE') return { type: 'msg', key: 'del_n', vars: { n: changes }, ok: true };
      if (/^CREATE\s+(TEMP\w*\s+)?TABLE\b/i.test(c)) return { type: 'msg', key: 'tbl_created', ok: true };
      if (/^DROP\s+TABLE\b/i.test(c)) return { type: 'msg', key: 'tbl_dropped', ok: true };
      if (w === 'ALTER') return { type: 'msg', key: 'tbl_altered', ok: true };
      return { type: 'msg', key: 'done', ok: true };
    } finally { st.free(); }
  }

  function hintFor(msg) {
    var m;
    if ((m = msg.match(/no such table: (?:main\.)?(\S+)/i))) return { key: 'h_no_table', vars: { x: m[1] } };
    if ((m = msg.match(/no such column: (\S+)/i))) return { key: 'h_no_column', vars: { x: m[1] } };
    if (/no such function/i.test(msg) || /wrong number of arguments to function/i.test(msg)) return { key: 'h_function' };
    if ((m = msg.match(/near "([^"]*)": syntax error/i))) {
      if (/^(modify|change)$/i.test(m[1])) return { key: 'h_modify' };
      return { key: 'h_syntax', vars: { x: m[1] } };
    }
    if (/incomplete input/i.test(msg)) return { key: 'h_incomplete' };
    if (/unrecognized token/i.test(msg)) return { key: 'h_token' };
    if (/UNIQUE constraint failed|PRIMARY KEY must be unique/i.test(msg)) return { key: 'h_unique' };
    if (/NOT NULL constraint failed/i.test(msg)) return { key: 'h_notnull' };
    if (/CHECK constraint failed/i.test(msg)) return { key: 'h_check' };
    if (/columns but \d+ values|values for \d+ columns|terms in VALUES/i.test(msg)) return { key: 'h_values' };
    if (/duplicate column name/i.test(msg)) return { key: 'h_dup_col' };
    if (/already exists/i.test(msg)) return { key: 'h_exists' };
    if (/misuse of aggregate/i.test(msg)) return { key: 'h_aggregate' };
    if (/ambiguous column name/i.test(msg)) return { key: 'h_ambiguous' };
    return { key: 'h_generic' };
  }

  /* Run a whole script on database d. Returns { blocks, sets, error, dirty }. */
  function runScript(d, text) {
    var stmts = splitSQL(text), blocks = [], sets = [], dirty = false;
    for (var i = 0; i < stmts.length; i++) {
      var s = stmts[i];
      try {
        var b = execOne(d, s);
        b.sql = s.sql; b.idx = i + 1;
        blocks.push(b);
        if (b.type === 'rows') sets.push(b);
        if (!isReadOnly(s.clean)) dirty = true;
      } catch (e) {
        var msg = String((e && e.message) || e);
        if (!isReadOnly(s.clean)) dirty = true;
        blocks.push({ type: 'error', sql: s.sql, idx: i + 1, message: msg, hint: hintFor(msg), more: i < stmts.length - 1 });
        return { blocks: blocks, sets: sets, error: msg, dirty: dirty, count: stmts.length };
      }
    }
    return { blocks: blocks, sets: sets, error: null, dirty: dirty, count: stmts.length };
  }

  /* ------------------------------------------------------------ results rendering */
  function csvFor(b) {
    var rows = [b.columns].concat(b.rows.map(function (r) { return r.map(rawCell); }));
    return EDU.csv.stringify(rows);
  }
  function tableEl(b) {
    var thead = el('thead', {}, el('tr', {}, el('th', { class: 'rn', text: '#' }), b.columns.map(function (c) { return el('th', { text: c }); })));
    var tbody = el('tbody');
    b.rows.forEach(function (r, ri) {
      var tr = el('tr', {}, el('td', { class: 'rn', text: String(ri + 1) }));
      r.forEach(function (v) {
        var f = fmtCell(v);
        tr.appendChild(f === null ? el('td', {}, el('span', { class: 'sqlp-null', text: 'NULL' })) : el('td', { class: typeof v === 'number' ? 'num' : null, text: f }));
      });
      tbody.appendChild(tr);
    });
    return el('div', { class: 'sqlp-scroll no-i18n', dir: 'ltr', tabindex: '0' }, el('table', { class: 'table sqlp-table' }, thead, tbody));
  }
  function blockEl(b, opts) {
    opts = opts || {};
    var head = el('div', { class: 'sqlp-block-head' });
    if (opts.title) head.appendChild(el('strong', { text: t(opts.title) }));
    else if (b.idx && lastCount > 1) head.appendChild(el('span', { class: 'badge', text: t('stmt_n', { n: b.idx }) }));
    var shown = b.sql ? (b.sql.replace(/^(\s*--[^\n]*(\n|$))+/, '').trim() || b.sql) : '';
    if (shown && b.type !== 'error') head.appendChild(el('code', { class: 'sqlp-stmt', text: shown.length > 160 ? shown.slice(0, 157) + '…' : shown }));
    var box = el('div', { class: 'sqlp-block' }, head);
    if (b.type === 'rows') {
      head.appendChild(el('span', { class: 'badge primary', text: t('rows_n', { n: EDU.fmt(b.total) }) }));
      head.appendChild(el('button', { class: 'btn btn-sm sqlp-csv', type: 'button', 'aria-label': t('download_csv'), title: t('download_csv'), text: '⬇ CSV', onclick: function () { EDU.download('sql_result.csv', csvFor(b), 'text/csv'); } }));
      if (!b.rows.length && b.total === 0) box.appendChild(el('p', { class: 'muted mb0', text: t('no_rows') }));
      box.appendChild(tableEl(b));
      if (b.total > b.rows.length) box.appendChild(el('p', { class: 'muted small mb0', text: t('rows_shown', { shown: EDU.fmt(b.rows.length), n: EDU.fmt(b.total) }) }));
    } else if (b.type === 'msg') {
      box.appendChild(el('p', { class: 'mb0' + (b.ok ? ' sqlp-ok' : ''), text: (b.ok ? '✓ ' : 'ℹ ') + t(b.key, b.vars) }));
    } else if (b.type === 'error') {
      var call = el('div', { class: 'callout danger' },
        el('strong', { text: '✗ ' + t('err_in', { n: b.idx }) }),
        el('code', { class: 'sqlp-err-msg', text: b.message }),
        el('p', { class: 'mb0' }, el('strong', { text: '💡 ' + t('hint') + ': ' }), t(b.hint.key, b.hint.vars)),
        el('pre', { class: 'sqlp-code no-i18n', text: b.sql }));
      if (b.more) call.appendChild(el('p', { class: 'small muted mb0', style: { marginTop: '8px' }, text: t('not_run') }));
      box.appendChild(call);
    } else if (b.type === 'note') {
      box.appendChild(el('p', { class: 'muted small mb0', text: 'ℹ ' + t(b.key, b.vars) }));
    }
    return box;
  }
  var lastCount = 0;
  function renderResults() {
    var r = $('#results');
    clear(r);
    if (!lastBlocks.length) { r.appendChild(el('p', { class: 'muted sqlp-empty mb0', text: t('results_empty') })); return; }
    lastBlocks.forEach(function (b) { r.appendChild(blockEl(b, { title: b.title })); });
  }

  /* ------------------------------------------------------------ run button */
  function getRunText() {
    var s = editor.selectionStart, e = editor.selectionEnd;
    if (typeof s === 'number' && e > s && document.activeElement === editor) {
      var sel = editor.value.slice(s, e);
      if (sel.trim()) return { text: sel, selection: true };
    }
    return { text: editor.value, selection: false };
  }
  function pushHistory(text) {
    text = text.trim();
    if (!text || text.length > 4000) return;
    history = history.filter(function (h) { return h !== text; });
    history.unshift(text);
    history = history.slice(0, 15);
    store.set('history', history);
    renderHistory();
  }
  function run(opts) {
    opts = opts || {};
    if (!db) return;
    var src = opts.text !== undefined ? { text: opts.text, selection: false } : getRunText();
    if (!splitSQL(src.text).length) {
      lastBlocks = [{ type: 'note', key: 'nothing_to_run' }]; lastCount = 0; renderResults(); return;
    }
    var res = runScript(db, src.text);
    lastCount = res.count;
    lastBlocks = res.blocks.slice();
    if (src.selection) lastBlocks.unshift({ type: 'note', key: 'ran_selection' });
    renderResults();
    $('#printSql').textContent = src.text;
    if (res.dirty) { saveDb(); renderSchema(); }
    if (!opts.noHistory) pushHistory(src.text);
    if (opts.scroll !== false && window.innerWidth < 980) {
      var card = $('#results').parentNode;
      if (card.scrollIntoView) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* ------------------------------------------------------------ schema sidebar */
  function insertAtCursor(text) {
    var v = editor.value, s = editor.selectionStart, e = editor.selectionEnd;
    if (typeof s !== 'number') { s = e = v.length; }
    var before = v.slice(0, s);
    if (before && /[\w)]$/.test(before)) text = ' ' + text;
    editor.value = before + text + v.slice(e);
    var pos = s + text.length;
    try { editor.setSelectionRange(pos, pos); } catch (er) { }
    if (window.matchMedia && matchMedia('(pointer: fine)').matches) editor.focus();
    store.set('draft', editor.value);
  }
  function renderSchema() {
    var box = $('#schema');
    clear(box);
    if (!db) return;
    var names;
    try { names = listTables(db); } catch (e) { names = []; }
    names.forEach(function (name) {
      var cols = [], count = 0;
      try {
        var info = db.exec('PRAGMA table_info("' + name.replace(/"/g, '""') + '")');
        cols = info.length ? info[0].values : [];
        var cr = db.exec('SELECT count(*) FROM "' + name.replace(/"/g, '""') + '"');
        count = cr.length ? cr[0].values[0][0] : 0;
      } catch (e) { }
      var descKey = DATA.tables[name] || 'tb_user';
      var item = el('div', { class: 'sqlp-tbl' },
        el('div', { class: 'sqlp-tbl-head' },
          el('button', { class: 'sqlp-tname no-i18n', type: 'button', dir: 'ltr', text: name, onclick: function () { insertAtCursor(name); } }),
          el('span', { class: 'badge', text: t('rows_count', { n: EDU.fmt(count) }) }),
          el('span', { class: 'grow' }),
          el('button', { class: 'btn btn-sm', type: 'button', 'aria-label': t('show_rows', { t: name }), title: t('show_rows', { t: name }), text: '▶', onclick: function () {
            var q = 'SELECT * FROM ' + name + ';';
            editor.value = q; store.set('draft', q); run({ text: q });
          } })),
        el('p', { class: 'tiny muted sqlp-tdesc', text: t(descKey) }),
        el('div', { class: 'sqlp-cols no-i18n' }, cols.map(function (c) {
          return el('button', { class: 'sqlp-col' + (c[5] ? ' pk' : ''), type: 'button', onclick: function () { insertAtCursor(c[1]); } },
            c[1], c[2] ? el('small', { text: c[2] }) : null);
        })));
      box.appendChild(item);
    });
  }

  /* ------------------------------------------------------------ examples + history selects */
  function renderExamples() {
    var sel = $('#exSelect'), C = content();
    clear(sel);
    sel.appendChild(el('option', { value: '', text: t('examples') }));
    DATA.examples.forEach(function (topic, ti) {
      var g = el('optgroup', { label: t(topic.topic) });
      topic.items.forEach(function (sql, ii) {
        g.appendChild(el('option', { value: ti + '.' + ii, text: (C.ex[ti] && C.ex[ti][ii]) || sql }));
      });
      sel.appendChild(g);
    });
    sel.value = '';
  }
  function renderHistory() {
    var sel = $('#histSelect');
    clear(sel);
    sel.appendChild(el('option', { value: '', text: t('history') }));
    history.forEach(function (h, i) {
      var one = h.replace(/\s+/g, ' ');
      sel.appendChild(el('option', { value: String(i), text: one.length > 70 ? one.slice(0, 67) + '…' : one }));
    });
    sel.value = '';
    sel.disabled = !history.length;
  }
  $('#exSelect').addEventListener('change', function () {
    var v = this.value; if (!v) return;
    var p = v.split('.'), ti = +p[0], ii = +p[1];
    var sql = DATA.examples[ti].items[ii], C = content();
    var title = (C.ex[ti] && C.ex[ti][ii]) || '';
    editor.value = '-- ' + title + '\n' + sql;
    store.set('draft', editor.value);
    this.value = '';
    run({ text: editor.value });
  });
  $('#histSelect').addEventListener('change', function () {
    var v = this.value; if (v === '') return;
    editor.value = history[+v] || '';
    store.set('draft', editor.value);
    this.value = '';
  });

  /* ------------------------------------------------------------ practice */
  function normVal(v) {
    if (v === null || v === undefined) return '\u0000';
    if (typeof v === 'number') return (Math.round(v * 100) / 100).toFixed(2);
    var s = String(v).trim();
    if (/^-?\d+(\.\d+)?$/.test(s)) return (Math.round(Number(s) * 100) / 100).toFixed(2);
    return s.toLowerCase();
  }
  function rowKeys(set, sortCells) {
    return set.rows.map(function (r) { var c = r.map(normVal); if (sortCells) c.sort(); return c.join('\u0001'); });
  }
  function reference(i) {
    if (refCache[i]) return refCache[i];
    var d = freshDb();
    try { refCache[i] = runScript(d, DATA.practice[i].sql).sets[0]; } finally { d.close(); }
    return refCache[i];
  }
  function compare(user, exp, ordered) {
    if (user.columns.length !== exp.columns.length) return { key: 'check_cols', vars: { a: user.columns.length, b: exp.columns.length } };
    if (user.total !== exp.total) return { key: 'check_rows', vars: { a: user.total, b: exp.total } };
    var a = rowKeys(user, false), b = rowKeys(exp, false);
    var sa = a.slice().sort(), sb = b.slice().sort();
    if (sa.join('\u0002') === sb.join('\u0002')) {
      if (ordered && a.join('\u0002') !== b.join('\u0002')) return { key: 'check_order' };
      return { ok: true, key: 'check_ok' };
    }
    var ca = rowKeys(user, true).sort(), cb = rowKeys(exp, true).sort();   // same values, columns in another order
    if (ca.join('\u0002') === cb.join('\u0002')) return { ok: true, key: 'check_ok' };
    return { key: 'check_values' };
  }
  function checkAnswer() {
    if (currentTask === null || !SQL) return;
    var i = currentTask, src = getRunText();
    var d = freshDb(), res;
    try { res = runScript(d, src.text); } finally { d.close(); }
    var exp = reference(i);
    var verdict;
    if (!splitSQL(src.text).length) verdict = { key: 'check_noresult' };
    else if (res.error) verdict = { key: 'check_error' };
    else if (!res.sets.length) verdict = { key: 'check_noresult' };
    else verdict = compare(res.sets[res.sets.length - 1], exp, !!DATA.practice[i].ordered);
    checkState = verdict;
    if (verdict.ok && solved.indexOf(i) < 0) { solved.push(i); store.set('solved', solved); }
    lastCount = 0;
    if (res.error) lastBlocks = res.blocks.filter(function (b) { return b.type === 'error'; });
    else if (res.sets.length) {
      var mine = Object.assign({}, res.sets[res.sets.length - 1], { title: 'your_result', idx: 0 });
      lastBlocks = verdict.ok ? [mine] : [mine, Object.assign({}, exp, { title: 'expected', sql: '', idx: 0 })];
    } else lastBlocks = res.blocks;
    renderResults();
    renderTask();
    renderPractice();
    if (verdict.ok) EDU.toast(t('check_ok'));
  }
  function renderTask() {
    var box = $('#taskBox'), C = content();
    if (currentTask === null || currentTask >= DATA.practice.length) { box.hidden = true; return; }
    box.hidden = false;
    $('#taskTitle').textContent = t('task_n', { n: currentTask + 1 }) + (solved.indexOf(currentTask) >= 0 ? '  ✓' : '');
    $('#taskText').textContent = C.practice[currentTask];
    $('#checkBtn').disabled = !SQL;
    $('#answerBtn').textContent = t(showAnswer ? 'hide_answer' : 'show_answer');
    $('#answerBtn').setAttribute('aria-expanded', showAnswer ? 'true' : 'false');
    var code = $('#answerCode');
    code.hidden = !showAnswer;
    code.textContent = DATA.practice[currentTask].sql;
    var msg = $('#checkMsg');
    msg.className = 'mb0' + (checkState ? (checkState.ok ? ' sqlp-msg-ok' : ' sqlp-msg-bad') : '');
    msg.textContent = checkState ? (checkState.ok ? '✓ ' : '✗ ') + t(checkState.key, checkState.vars) : '';
  }
  function renderPractice() {
    var list = $('#taskList'), C = content();
    clear(list);
    C.practice.forEach(function (q, i) {
      var done = solved.indexOf(i) >= 0;
      list.appendChild(el('li', { class: done ? 'done' : null },
        el('button', { type: 'button', 'aria-current': currentTask === i ? 'true' : 'false', onclick: function () { selectTask(i); } },
          el('span', { class: 'num', text: done ? '✓' : String(i + 1) }), el('span', { text: q }))));
    });
    var total = DATA.practice.length, n = solved.filter(function (x) { return x < total; }).length;
    $('#solvedTxt').textContent = t('solved_n', { n: n, total: total });
    $('#solvedBar').style.width = Math.round(100 * n / total) + '%';
  }
  function selectTask(i) {
    currentTask = i; showAnswer = false; checkState = null;
    store.set('task', i);
    renderTask(); renderPractice();
    var box = $('#taskBox');
    if (box.scrollIntoView && window.innerWidth < 980) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  $('#checkBtn').addEventListener('click', checkAnswer);
  $('#answerBtn').addEventListener('click', function () { showAnswer = !showAnswer; renderTask(); });
  $('#taskClose').addEventListener('click', function () { currentTask = null; checkState = null; store.set('task', null); renderTask(); renderPractice(); });

  /* ------------------------------------------------------------ tabs */
  function selectTab(which) {
    var tables = which !== 'practice';
    $('#tabTables').setAttribute('aria-selected', tables ? 'true' : 'false');
    $('#tabPractice').setAttribute('aria-selected', tables ? 'false' : 'true');
    $('#paneTables').hidden = !tables;
    $('#panePractice').hidden = tables;
    store.set('tab', tables ? 'tables' : 'practice');
  }
  $('#tabTables').addEventListener('click', function () { selectTab('tables'); });
  $('#tabPractice').addEventListener('click', function () { selectTab('practice'); });
  [$('#tabTables'), $('#tabPractice')].forEach(function (b) {
    b.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { var other = b.id === 'tabTables' ? $('#tabPractice') : $('#tabTables'); other.click(); other.focus(); e.preventDefault(); }
    });
  });

  /* ------------------------------------------------------------ more tools */
  function sqlLiteral(v) {
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'number') return isFinite(v) ? String(v) : 'NULL';
    if (v instanceof Uint8Array) { var h = ''; for (var i = 0; i < v.length; i++) h += (v[i] < 16 ? '0' : '') + v[i].toString(16); return "X'" + h + "'"; }
    return "'" + String(v).replace(/'/g, "''") + "'";
  }
  function dumpSQL() {
    var out = ['-- SQL Playground · AI Pathshala', '-- ' + new Date().toISOString().slice(0, 10), ''];
    var res = db.exec("SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY CASE type WHEN 'table' THEN 0 ELSE 1 END, rowid");
    var objs = res.length ? res[0].values : [];
    objs.forEach(function (o) {
      if (o[0] !== 'table') return;
      var q = '"' + o[1].replace(/"/g, '""') + '"';
      out.push('DROP TABLE IF EXISTS ' + q + ';', o[2] + ';');
      var rows = db.exec('SELECT * FROM ' + q);
      if (rows.length) rows[0].values.forEach(function (r) { out.push('INSERT INTO ' + q + ' VALUES (' + r.map(sqlLiteral).join(', ') + ');'); });
      out.push('');
    });
    objs.forEach(function (o) { if (o[0] !== 'table') out.push(o[2] + ';'); });
    return out.join('\n');
  }
  $('#dumpBtn').addEventListener('click', function () { if (db) EDU.download('school_database.sql', dumpSQL(), 'application/sql'); });

  $('#resetBtn').addEventListener('click', function () {
    if (!SQL || !confirm(t('confirm_reset_db'))) return;
    try { if (db) db.close(); } catch (e) { }
    db = freshDb(); inTxn = false;
    store.remove('db');
    renderSchema();
    lastBlocks = [{ type: 'note', key: 'db_reset_done' }]; lastCount = 0;
    renderResults();
    EDU.toast(t('db_reset_done'));
  });

  function safeIdent(s, fallback) {
    var x = String(s || '').trim().replace(/[^\p{L}\p{N}_]+/gu, '_').replace(/^_+|_+$/g, '');
    if (!x) x = fallback;
    if (/^\d/.test(x)) x = 'c_' + x;
    return x.slice(0, 40);
  }
  $('#csvImportBtn').addEventListener('click', function () {
    if (!db) return;
    EDU.pickFile('.csv,text/csv,text/plain').then(function (file) {
      if (!file) return null;
      return EDU.readText(file).then(function (text) {
        var rows = EDU.csv.parse(text);
        if (rows.length < 1 || !rows[0].length) throw new Error('empty');
        var head = rows[0], data = rows.slice(1, 20001), seen = {};
        var cols = head.map(function (h, i) {
          var n = safeIdent(h, 'col' + (i + 1)), k = n.toLowerCase(), j = 2;
          while (seen[k]) { n = safeIdent(h, 'col' + (i + 1)) + '_' + j++; k = n.toLowerCase(); }
          seen[k] = 1; return n;
        });
        var types = cols.map(function (c, ci) {
          var allInt = true, allNum = true, any = false;
          data.forEach(function (r) {
            var v = (r[ci] || '').trim(); if (!v) return; any = true;
            if (!/^-?\d+$/.test(v)) allInt = false;
            if (!/^-?\d+(\.\d+)?$/.test(v)) allNum = false;
          });
          return !any ? 'TEXT' : allInt ? 'INT' : allNum ? 'REAL' : 'TEXT';
        });
        var base = safeIdent(file.name.replace(/\.[^.]+$/, ''), 'IMPORTED').toUpperCase(), name = base, k = 2;
        while (tableExists(db, name)) name = base + '_' + k++;
        var q = function (s) { return '"' + s.replace(/"/g, '""') + '"'; };
        db.exec('CREATE TABLE ' + q(name) + ' (' + cols.map(function (c, i) { return q(c) + ' ' + types[i]; }).join(', ') + ')');
        var st = db.prepare('INSERT INTO ' + q(name) + ' VALUES (' + cols.map(function () { return '?'; }).join(',') + ')');
        db.exec('BEGIN');
        try {
          data.forEach(function (r) {
            st.run(cols.map(function (c, ci) {
              var v = (r[ci] === undefined ? '' : String(r[ci])).trim();
              if (v === '') return null;
              return types[ci] === 'TEXT' ? v : Number(v);
            }));
          });
          db.exec('COMMIT');
        } catch (e) { try { db.exec('ROLLBACK'); } catch (e2) { } throw e; } finally { st.free(); }
        saveDb(); renderSchema();
        var sql = 'SELECT * FROM ' + (/^[A-Za-z_]\w*$/.test(name) ? name : q(name)) + ';';
        editor.value = sql; store.set('draft', sql);
        run({ text: sql });
        EDU.toast(t('csv_imported', { t: name, n: EDU.fmt(data.length) }));
        return true;
      });
    }).catch(function () { EDU.toast(t('csv_bad'), 4000); });
  });

  function buildSheet() {
    var sheet = $('#printSheet'), C = content();
    clear(sheet);
    var d = freshDb(), wrap = el('div', { class: 'sheet-tables no-i18n', dir: 'ltr' }), pair = el('div', { class: 'sheet-pair' });
    try {
      ['STUDENT', 'TEACHER', 'MARKS', 'CLUB'].forEach(function (name, i) {
        var r = d.exec('SELECT * FROM ' + name)[0];
        var tbl = el('table', { class: 'table' },
          el('thead', {}, el('tr', {}, r.columns.map(function (c) { return el('th', { text: c }); }))),
          el('tbody', {}, r.values.map(function (row) { return el('tr', {}, row.map(function (v) { var f = fmtCell(v); return el('td', { text: f === null ? 'NULL' : f }); })); })));
        (i < 2 ? wrap : pair).appendChild(el('div', {}, el('h3', { text: name }), tbl));
      });
      wrap.appendChild(pair);
    } finally { d.close(); }
    sheet.appendChild(el('h1', { text: t('sheet_title') }));
    sheet.appendChild(el('p', { text: t('sheet_name') }));
    sheet.appendChild(el('h2', { text: t('sheet_questions') }));
    sheet.appendChild(el('ol', {}, C.practice.map(function (q) { return el('li', { text: q }); })));
    sheet.appendChild(wrap);
  }
  $('#printBtn').addEventListener('click', function () {
    if (!SQL) return;
    buildSheet();
    document.body.classList.add('sqlp-printing');
    /* The class only matters in @media print, so it is safe to keep it until the print dialog is closed. */
    var done = function () {
      document.body.classList.remove('sqlp-printing');
      window.removeEventListener('afterprint', done);
      document.removeEventListener('pointerdown', done);
    };
    window.addEventListener('afterprint', done);
    setTimeout(function () {
      window.print();
      setTimeout(function () { document.addEventListener('pointerdown', done); }, 800);
    }, 50);
  });

  /* ------------------------------------------------------------ editor + toolbar */
  editor.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); }
  });
  var draftTimer;
  editor.addEventListener('input', function () { clearTimeout(draftTimer); draftTimer = setTimeout(function () { store.set('draft', editor.value); }, 400); });
  $('#runBtn').addEventListener('click', function () { run(); });
  /* Keep the editor focused when Run/Check is pressed, so "run only the selected text" works with the buttons too. */
  ['#runBtn', '#checkBtn'].forEach(function (sel) {
    $(sel).addEventListener('mousedown', function (e) { if (document.activeElement === editor) e.preventDefault(); });
  });
  $('#clearBtn').addEventListener('click', function () { editor.value = ''; store.set('draft', ''); editor.focus(); });
  function applySize() {
    $('#app').style.setProperty('--code-size', SIZES[sizeIdx] + 'rem');
    $('#sizeBtn').setAttribute('aria-pressed', sizeIdx > 0 ? 'true' : 'false');
    $('#sizeBtn').textContent = ['A+', 'A++', 'A−'][sizeIdx];
  }
  $('#sizeBtn').addEventListener('click', function () { sizeIdx = (sizeIdx + 1) % SIZES.length; store.set('size', sizeIdx); applySize(); });
  $('#fsBtn').addEventListener('click', function () { EDU.fullscreen(); });

  /* ------------------------------------------------------------ help lists */
  function renderHelp() {
    var C = content();
    var tips = $('#tipsList'), my = $('#mysqlList');
    clear(tips); clear(my);
    C.tips.forEach(function (x) { tips.appendChild(richText(el('li'), x)); });
    C.mysql.forEach(function (x) { my.appendChild(richText(el('li'), x)); });
  }

  /* ------------------------------------------------------------ engine loading */
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (window.initSqlJs) return resolve();
      var s = document.createElement('script');
      s.src = src; s.async = true; s.crossOrigin = 'anonymous';
      var timer = setTimeout(function () { s.remove(); reject(new Error('timeout')); }, 45000);
      s.onload = function () { clearTimeout(timer); window.initSqlJs ? resolve() : reject(new Error('no initSqlJs')); };
      s.onerror = function () { clearTimeout(timer); s.remove(); reject(new Error('load failed')); };
      document.head.appendChild(s);
    });
  }
  function setLoading(state) {
    var box = $('#loadBox'), msg = $('#loadMsg');
    box.hidden = state === 'ready';
    box.className = 'callout sqlp-loading' + (state === 'failed' ? ' danger' : '');
    $('#loadSpin').hidden = state !== 'loading';
    $('#retryBtn').hidden = state !== 'failed';
    msg.setAttribute('data-i18n', state === 'failed' ? 'load_failed' : 'loading_engine');
    msg.textContent = t(state === 'failed' ? 'load_failed' : 'loading_engine');
  }
  function start() {
    setLoading('loading');
    loadScript(SQLJS_BASE + 'sql-wasm.js')
      .then(function () { return window.initSqlJs({ locateFile: function (f) { return SQLJS_BASE + f; } }); })
      .then(function (mod) {
        SQL = mod;
        db = loadSavedDb() || freshDb();
        setLoading('ready');
        $('#runBtn').disabled = false;
        renderSchema();
        renderTask();
        var stmts = splitSQL(editor.value);
        if (stmts.length && stmts.every(function (s) { return isReadOnly(s.clean); })) run({ text: editor.value, noHistory: true, scroll: false });
        else renderResults();
        $('#app').setAttribute('data-ready', '1');
      })
      .catch(function (e) {
        console.warn('[sql-playground] engine failed to load:', e && e.message);
        setLoading('failed');
      });
  }
  $('#retryBtn').addEventListener('click', start);

  /* ------------------------------------------------------------ language + first render */
  function renderAll() {
    renderExamples();
    renderHistory();
    renderPractice();
    renderTask();
    renderHelp();
    renderSchema();
    renderResults();
    applySize();
  }
  EDU.onLang(renderAll);
  selectTab(store.get('tab', 'tables'));
  renderAll();
  start();
})();
