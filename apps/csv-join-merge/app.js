/* Join & Merge Files: join two CSV files on a key column (like VLOOKUP / XLOOKUP), or stack many files. */
(function () {
  'use strict';
  var J = window.CJM, SLUG = 'csv-join-merge';
  var store = EDU.store(SLUG), t = EDU.t, $ = EDU.$, el = EDU.el;
  var PAGE = 100, MAX_SAVE = 500000;

  EDU.init({ slug: SLUG, title: 'app_title', wide: true, waKey: 'shell_wa_tool' });

  /* ---------------- sample files ---------------- */
  function C() { return (window.APP_CONTENT || {})[EDU.lang] || window.APP_CONTENT.en; }
  var MARKS = [[101, 0, 78], [101, 1, 85], [102, 0, 64], [103, 0, 91], [103, 1, 88], [104, 0, 55], [106, 0, 72], [107, 1, 69], [109, 0, 95], [111, 0, 81], [112, 1, 74]];
  var ORDER_KEYS = ['001', '2', '03', '4', '4', '7', '9', '5 ', '', '2'], ORDER_AMT = [650, 1850, 480, 199, 799, 1200, 240, 350, 120, 299];
  var PHONES = ['9876501234', '9823012345', '9431098765', '9845123456', '9839087654', '9864011223', '9825566778', '9443322110'];
  var PRICE = [40, 30, 60, 48, 45];
  function samplePair(id) {
    var c = C();
    if (id === 'orders') {
      return {
        A: { name: c.files.orders, table: { headers: c.orders.headers.slice(), rows: ORDER_KEYS.map(function (k, i) { return ['O-' + (101 + i), k, c.orders.items[i], String(ORDER_AMT[i])]; }) } },
        B: { name: c.files.customers, table: { headers: c.customers.headers.slice(), rows: c.customers.names.map(function (n, i) { return [String(i + 1), n, c.customers.cities[i], PHONES[i]]; }) } }
      };
    }
    return {
      A: { name: c.files.students, table: { headers: c.students.headers.slice(), rows: c.students.names.map(function (n, i) { return [String(101 + i), n, i < 5 ? '8-A' : '8-B', c.students.cities[i % 5]]; }) } },
      B: { name: c.files.marks, table: { headers: c.marks.headers.slice(), rows: MARKS.map(function (m, i) { return [(i === 6 ? ' ' : '') + m[0], c.marks.subjects[m[1]], String(m[2])]; }) } }
    };
  }
  function sampleStack() {
    var c = C(), H = c.sales.headers, it = c.sales.items, pay = c.sales.pay;
    var row = function (d, i, q) { return { d: d, i: it[i], q: String(q), a: String(q * PRICE[i]) }; };
    var jan = [row('2026-01-05', 0, 3), row('2026-01-12', 1, 10), row('2026-01-19', 2, 6), row('2026-01-26', 4, 2)];
    var feb = [row('2026-02-02', 3, 5), row('2026-02-09', 0, 4), row('2026-02-16', 2, 8), row('2026-02-20', 1, 12), row('2026-02-27', 4, 3)];
    var mar = [row('2026-03-03', 2, 10), row('2026-03-10', 3, 2), row('2026-03-17', 0, 6)];
    return [
      { name: c.files.jan, table: { headers: [H[0], H[1], H[2], H[3]], rows: jan.map(function (r) { return [r.d, r.i, r.q, r.a]; }) } },
      { name: c.files.feb, table: { headers: [H[1], H[0], H[2].toLowerCase(), H[3] + ' '], rows: feb.map(function (r) { return [r.i, r.d, r.q, r.a]; }) } },
      { name: c.files.mar, table: { headers: H.slice(), rows: mar.map(function (r, k) { return [r.d, r.i, r.q, r.a, pay[k % 2]]; }) } }
    ];
  }

  /* ---------------- state ---------------- */
  var saved = store.get('state', {}) || {};
  var S = {
    mode: saved.mode === 'stack' ? 'stack' : 'join',
    sample: saved.sample === 'orders' ? 'orders' : (saved.sample === null ? null : 'students'),
    A: null, B: null, ka: 0, kb: 0,
    type: ['inner', 'left', 'right', 'full'].indexOf(saved.type) >= 0 ? saved.type : 'left',
    opts: Object.assign({ trim: true, icase: true, numeric: false }, saved.opts || {}),
    off: {}, page: 0, umTab: 'a', umPage: 0,
    files: null, stackSample: saved.stackSample !== false, stackOpts: Object.assign({ loose: true, source: true }, saved.stackOpts || {}), stPage: 0
  };
  function persist() {
    var st = { mode: S.mode, sample: S.sample, type: S.type, opts: S.opts, ka: S.ka, kb: S.kb, stackSample: S.stackSample, stackOpts: S.stackOpts };
    if (!S.sample) {
      ['A', 'B'].forEach(function (k) { var f = S[k]; if (f && f.text && f.text.length <= MAX_SAVE) st[k] = { name: f.name, text: f.text }; });
    }
    if (!S.stackSample && S.files) {
      var total = 0, list = [];
      S.files.forEach(function (f) { if (f.text) { total += f.text.length; list.push({ name: f.name, text: f.text }); } });
      if (total <= MAX_SAVE * 2 && list.length === S.files.length) st.files = list;
    }
    store.set('state', st);
  }

  function parse(text) {
    try { return J.toTable(EDU.csv.parse(text, J.detectDelim(text))); } catch (e) { return null; }
  }

  /* ---------------- join: files and keys ---------------- */
  function setSample(id) {
    var p = samplePair(id);
    S.sample = id; S.A = p.A; S.B = p.B; S.off = {}; S.page = 0;
    var g = J.guessKeys(S.A.table, S.B.table); S.ka = g[0]; S.kb = g[1];
    renderJoinAll();
  }
  function setFile(side, name, text) {
    var tbl = parse(text);
    if (!tbl || !tbl.headers.length || !tbl.rows.length) { EDU.toast(t('err_empty')); return false; }
    if (S.sample) {   /* the other side keeps its sample file, as a normal file */
      var other = side === 'A' ? 'B' : 'A';
      S[other] = { name: S[other].name, table: S[other].table, text: EDU.csv.stringify([S[other].table.headers].concat(S[other].table.rows)).replace(/^﻿/, '') };
    }
    S.sample = null;
    S[side] = { name: name, table: tbl, text: text };
    S.off = {}; S.page = 0;
    var g = J.guessKeys(S.A.table, S.B.table); S.ka = g[0]; S.kb = g[1];
    if (text.length > MAX_SAVE) EDU.toast(t('big_note'));
    renderJoinAll();
    return true;
  }
  function readFile(file, cb) {
    if (!file) return;
    if (/\.(xlsx?|ods|pdf|docx?)$/i.test(file.name)) { EDU.toast(t('err_excel')); return; }
    EDU.readText(file).then(function (text) { cb(file.name.replace(/\.[^.]+$/, ''), text); }).catch(function () { EDU.toast(t('err_file')); });
  }

  /* ---------------- rendering helpers ---------------- */
  /* a paged table: 100 rows a page, rows built only for the visible page */
  function grid(tableEl, pagerEl, infoEl) {
    var st = { page: 0 };
    function draw(headers, total, getRow, cls) {
      var pages = Math.max(1, Math.ceil(total / PAGE));
      if (st.page >= pages) st.page = pages - 1;
      var from = st.page * PAGE, to = Math.min(total, from + PAGE), h = ['<thead><tr><th class="cj-rn" scope="col">#</th>'];
      headers.forEach(function (x) { h.push('<th scope="col">' + EDU.esc(x) + '</th>'); });
      h.push('</tr></thead><tbody>');
      for (var i = from; i < to; i++) {
        var r = getRow(i);
        h.push('<tr><td class="cj-rn">' + (i + 1) + '</td>');
        for (var c = 0; c < r.length; c++) {
          var k = cls ? cls(i, c) : '';
          h.push('<td data-c="' + c + '"' + (k ? ' class="' + k + '"' : '') + '>' + EDU.esc(r[c]) + '</td>');
        }
        h.push('</tr>');
      }
      h.push('</tbody>');
      tableEl.innerHTML = h.join('');
      pagerEl.hidden = pages < 2;
      $('.pg-info', pagerEl).textContent = total ? t('page_info', { from: EDU.fmt(from + 1), to: EDU.fmt(to), total: EDU.fmt(total) }) : '';
      $('.pg-prev', pagerEl).disabled = st.page === 0;
      $('.pg-next', pagerEl).disabled = st.page >= pages - 1;
      if (infoEl) infoEl.hidden = total > 0;
      st.last = [headers, total, getRow, cls];
    }
    $('.pg-prev', pagerEl).addEventListener('click', function () { st.page--; draw.apply(null, st.last); });
    $('.pg-next', pagerEl).addEventListener('click', function () { st.page++; draw.apply(null, st.last); });
    return { draw: draw, reset: function () { st.page = 0; } };
  }
  var gridOut = grid($('#out-grid'), $('#out-pager'), $('#out-empty'));
  var gridUm = grid($('#um-grid'), $('#um-pager'), $('#um-empty'));
  var gridSt = grid($('#st-grid'), $('#st-pager'), null);

  function fileBox(side) {
    var f = S[side], box = $('#file-' + side.toLowerCase());
    $('.cj-fname', box).textContent = f ? f.name : '';
    $('.cj-finfo', box).textContent = f ? t('file_info', { rows: EDU.fmt(f.table.rows.length), cols: EDU.fmt(f.table.headers.length) }) : '';
    var cols = $('.cj-fcols', box); cols.innerHTML = '';
    if (f) f.table.headers.forEach(function (h) { cols.appendChild(el('span', { class: 'badge', text: h })); });
  }
  function keySelect(sel, table, value) {
    sel.innerHTML = '';
    table.headers.forEach(function (h, i) { sel.appendChild(el('option', { value: String(i), text: h, class: 'no-i18n' })); });
    sel.value = String(value);
  }
  function renderJoinAll() {
    fileBox('A'); fileBox('B');
    keySelect($('#key-a'), S.A.table, S.ka);
    keySelect($('#key-b'), S.B.table, S.kb);
    EDU.$$('#sample-seg button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.s === S.sample ? 'true' : 'false'); });
    renderJoin();
  }

  var VENN = { inner: [0, 1, 0], left: [1, 1, 0], right: [0, 1, 1], full: [1, 1, 1] };
  function renderJoin() {
    var A = S.A.table, B = S.B.table;
    $('#opt-trim').checked = S.opts.trim; $('#opt-icase').checked = S.opts.icase; $('#opt-num').checked = S.opts.numeric;
    EDU.$$('#type-seg button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.type === S.type ? 'true' : 'false'); });
    var v = VENN[S.type];
    $('#venn').setAttribute('class', 'cj-venn' + (v[0] ? ' a' : '') + (v[2] ? ' b' : ''));
    $('#type-help').textContent = t('help_' + S.type);

    var all = J.join(A, B, S.ka, S.kb, 'full', S.opts);
    var res = S.type === 'full' ? all : J.join(A, B, S.ka, S.kb, S.type, S.opts);
    S.res = res; S.all = all;
    var stat = function (id, n) { var e = $('#' + id); e.textContent = EDU.fmt(n); e.dataset.n = n; };
    stat('st-matched', all.matchedA); stat('st-onlya', all.onlyA); stat('st-onlyb', all.onlyB); stat('st-rows', res.rows);
    $('#lbl-onlya').textContent = t('only_in', { name: S.A.name }); $('#lbl-onlyb').textContent = t('only_in', { name: S.B.name });

    /* warnings */
    var w = $('#warnings'); w.innerHTML = '';
    if (all.dupKeysB) w.appendChild(el('p', { class: 'callout warning', id: 'warn-dup', text: t('warn_dup_b', { n: EDU.fmt(all.dupKeysB), name: S.B.name }) }));
    if (all.dupKeysA && S.type !== 'inner') w.appendChild(el('p', { class: 'callout', text: t('note_dup_a', { n: EDU.fmt(all.dupKeysA), name: S.A.name }) }));
    if (all.blankA || all.blankB) w.appendChild(el('p', { class: 'callout', text: t('warn_blank', { n: EDU.fmt(all.blankA + all.blankB) }) }));
    if (!all.matchedA) w.appendChild(el('p', { class: 'callout danger', text: t('warn_none') }));
    else if (!S.opts.numeric && numericHint()) w.appendChild(el('p', { class: 'callout', id: 'hint-num', text: t('hint_numeric') }));

    /* output columns */
    var cols = J.outColumns(A, B, S.ka, S.kb, ' (B)');
    cols.forEach(function (c) { var k = c.side + c.idx; if (k in S.off) c.on = !S.off[k]; });
    S.cols = cols;
    var box = $('#out-cols'); box.innerHTML = '';
    cols.forEach(function (c) {
      box.appendChild(el('button', { type: 'button', class: 'chip ' + (c.side === 'a' ? 'cj-ca' : 'cj-cb'), 'aria-pressed': c.on ? 'true' : 'false', text: c.name,
        onclick: function () { S.off[c.side + c.idx] = c.on; renderJoin(); } }));
    });
    var on = cols.filter(function (c) { return c.on; });
    gridOut.draw(on.map(function (c) { return c.name; }), res.rows,
      function (i) { var p = res.pairs[i]; return on.map(function (c) { return J.cell(A, B, S.kb, p, c); }); },
      function (i, c) { var p = res.pairs[i], col = on[c]; return (col.side === 'a' && p[0] < 0 && !col.key) || (col.side === 'b' && p[1] < 0) ? 'nm' : (col.side === 'b' ? 'cb' : ''); });
    renderUnmatched();
    persist();
  }
  /* would "007" = "7" find more matches? */
  function numericHint() {
    var o2 = Object.assign({}, S.opts, { numeric: true });
    return J.join(S.A.table, S.B.table, S.ka, S.kb, 'inner', o2).matchedA > S.all.matchedA;
  }
  function unmatched(side) {
    var out = [];
    S.all.pairs.forEach(function (p) { if (side === 'a' ? p[1] < 0 : p[0] < 0) out.push(side === 'a' ? p[0] : p[1]); });
    return out;
  }
  function renderUnmatched() {
    var side = S.umTab, T = side === 'a' ? S.A.table : S.B.table, idx = unmatched(side);
    EDU.$$('#um-tabs button').forEach(function (b) {
      var s = b.dataset.side;
      b.setAttribute('aria-selected', s === side ? 'true' : 'false');
      b.textContent = t('only_in_n', { name: s === 'a' ? S.A.name : S.B.name, n: EDU.fmt(s === 'a' ? S.all.onlyA : S.all.onlyB) });
    });
    gridUm.draw(T.headers, idx.length, function (i) { return T.rows[idx[i]]; });
  }

  /* ---------------- stack ---------------- */
  function renderStack() {
    if (!S.files) S.files = sampleStack();
    $('#st-loose').checked = S.stackOpts.loose; $('#st-source').checked = S.stackOpts.source;
    var res = J.stack(S.files, { loose: S.stackOpts.loose, source: S.stackOpts.source, sourceName: t('source_col') });
    S.stackRes = res;
    var list = $('#st-files'); list.innerHTML = '';
    S.files.forEach(function (f, i) {
      var pf = res.perFile[i], notes = [t('file_info', { rows: EDU.fmt(pf.rows), cols: EDU.fmt(pf.cols) })];
      if (pf.added) notes.push(t('st_added', { n: EDU.fmt(pf.added) }));
      if (pf.missing.length) notes.push(t('st_missing', { cols: pf.missing.join(', ') }));
      list.appendChild(el('li', { class: 'cj-sfile' },
        el('span', { class: 'cj-num', text: EDU.fmt(i + 1) }),
        el('div', { class: 'cj-sdesc' }, el('b', { class: 'no-i18n', text: f.name }), el('div', { class: 'small muted no-i18n', text: notes.join(' · ') })),
        el('button', { type: 'button', class: 'btn btn-sm btn-ghost', 'aria-label': t('remove_file'), title: t('remove_file'), text: '✕',
          onclick: function () { S.files.splice(i, 1); S.stackSample = false; renderStack(); } })));
    });
    $('#st-empty').hidden = S.files.length > 0;
    var total = res.table.rows.length;
    $('#st-total').textContent = t('st_total', { rows: EDU.fmt(total), files: EDU.fmt(S.files.length), cols: EDU.fmt(res.table.headers.length) });
    $('#st-total').dataset.rows = total; $('#st-total').dataset.cols = res.table.headers.length;
    var srcCol = S.stackOpts.source ? res.table.headers.length - 1 : -1;
    gridSt.draw(res.table.headers, total, function (i) { return res.table.rows[i]; }, function (i, c) { return c === srcCol ? 'src' : (res.table.rows[i][c] === '' ? 'nm' : ''); });
    persist();
  }
  function addStackFiles(fileList) {
    var arr = Array.prototype.slice.call(fileList || []);
    if (!arr.length) return;
    if (S.stackSample) { S.files = []; S.stackSample = false; }
    var left = arr.length;
    arr.forEach(function (file) {
      if (/\.(xlsx?|ods|pdf|docx?)$/i.test(file.name)) { EDU.toast(t('err_excel')); if (!--left) renderStack(); return; }
      EDU.readText(file).then(function (text) {
        var tbl = parse(text);
        if (tbl && tbl.headers.length) S.files.push({ name: file.name.replace(/\.[^.]+$/, ''), table: tbl, text: text });
        else EDU.toast(t('err_empty'));
      }).catch(function () { EDU.toast(t('err_file')); }).then(function () { if (!--left) renderStack(); });
    });
  }

  /* ---------------- mode ---------------- */
  function renderMode() {
    EDU.$$('#mode-tabs button').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.mode === S.mode ? 'true' : 'false'); });
    $('#join-panel').hidden = S.mode !== 'join';
    $('#stack-panel').hidden = S.mode !== 'stack';
    if (S.mode === 'stack') renderStack(); else renderJoinAll();
  }

  /* ---------------- events ---------------- */
  EDU.$$('#mode-tabs button').forEach(function (b) { b.addEventListener('click', function () { S.mode = b.dataset.mode; renderMode(); persist(); }); });
  EDU.$$('#sample-seg button').forEach(function (b) { b.addEventListener('click', function () { setSample(b.dataset.s); }); });
  ['A', 'B'].forEach(function (side) {
    var box = $('#file-' + side.toLowerCase());
    $('.cj-open', box).addEventListener('click', function () { EDU.pickFile('.csv,.tsv,.txt,text/csv,text/plain').then(function (f) { readFile(f, function (n, text) { setFile(side, n, text); }); }); });
    $('.cj-use', box).addEventListener('click', function () {
      var ta = $('textarea', box);
      if (!ta.value.trim()) { EDU.toast(t('err_empty')); return; }
      if (setFile(side, t(side === 'A' ? 'pasted_a' : 'pasted_b'), ta.value)) $('details', box).open = false;
    });
    box.addEventListener('dragover', function (e) { e.preventDefault(); box.classList.add('drag'); });
    box.addEventListener('dragleave', function () { box.classList.remove('drag'); });
    box.addEventListener('drop', function (e) {
      e.preventDefault(); box.classList.remove('drag');
      if (S.mode !== 'join') return;
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      readFile(f, function (n, text) { setFile(side, n, text); });
    });
  });
  $('#key-a').addEventListener('change', function () { S.ka = +$('#key-a').value; S.off = {}; renderJoin(); });
  $('#key-b').addEventListener('change', function () { S.kb = +$('#key-b').value; S.off = {}; renderJoin(); });
  $('#opt-trim').addEventListener('change', function () { S.opts.trim = $('#opt-trim').checked; renderJoin(); });
  $('#opt-icase').addEventListener('change', function () { S.opts.icase = $('#opt-icase').checked; renderJoin(); });
  $('#opt-num').addEventListener('change', function () { S.opts.numeric = $('#opt-num').checked; renderJoin(); });
  $('#swap').addEventListener('click', function () { var x = S.A; S.A = S.B; S.B = x; var k = S.ka; S.ka = S.kb; S.kb = k; S.off = {}; renderJoinAll(); });
  EDU.$$('#type-seg button').forEach(function (b) { b.addEventListener('click', function () { S.type = b.dataset.type; gridOut.reset(); renderJoin(); }); });
  EDU.$$('#um-tabs button').forEach(function (b) { b.addEventListener('click', function () { S.umTab = b.dataset.side; gridUm.reset(); renderUnmatched(); }); });
  function csvName(base) { return base.replace(/[\\/:*?"<>|]+/g, '-') + '.csv'; }
  $('#dl-out').addEventListener('click', function () {
    var out = J.buildRows(S.A.table, S.B.table, S.kb, S.res, S.cols);
    EDU.download(csvName(S.A.name + '-' + S.B.name + '-' + S.type), EDU.csv.stringify([out.headers].concat(out.rows)), 'text/csv');
  });
  $('#dl-um').addEventListener('click', function () {
    var side = S.umTab, T = side === 'a' ? S.A.table : S.B.table;
    EDU.download(csvName((side === 'a' ? S.A.name : S.B.name) + '-' + t('unmatched_file')), EDU.csv.stringify([T.headers].concat(unmatched(side).map(function (i) { return T.rows[i]; }))), 'text/csv');
  });
  /* stack */
  $('#st-add').addEventListener('click', function () {
    var i = el('input', { type: 'file', accept: '.csv,.tsv,.txt,text/csv,text/plain', multiple: true, style: { display: 'none' } });
    i.addEventListener('change', function () { addStackFiles(i.files); i.remove(); });
    document.body.appendChild(i); i.click();
  });
  $('#st-sample').addEventListener('click', function () { S.files = sampleStack(); S.stackSample = true; gridSt.reset(); renderStack(); });
  $('#st-clear').addEventListener('click', function () { S.files = []; S.stackSample = false; renderStack(); });
  $('#st-loose').addEventListener('change', function () { S.stackOpts.loose = $('#st-loose').checked; renderStack(); });
  $('#st-source').addEventListener('change', function () { S.stackOpts.source = $('#st-source').checked; renderStack(); });
  $('#st-drop').addEventListener('dragover', function (e) { e.preventDefault(); $('#st-drop').classList.add('drag'); });
  $('#st-drop').addEventListener('dragleave', function () { $('#st-drop').classList.remove('drag'); });
  $('#st-drop').addEventListener('drop', function (e) { e.preventDefault(); $('#st-drop').classList.remove('drag'); addStackFiles(e.dataTransfer && e.dataTransfer.files); });
  $('#st-dl').addEventListener('click', function () {
    var T = S.stackRes.table;
    EDU.download(csvName(t('stacked_file')), EDU.csv.stringify([T.headers].concat(T.rows)), 'text/csv');
  });
  $('#reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    store.remove('state');
    S.type = 'left'; S.opts = { trim: true, icase: true, numeric: false }; S.stackOpts = { loose: true, source: true };
    S.files = sampleStack(); S.stackSample = true;
    EDU.$$('textarea').forEach(function (x) { x.value = ''; });
    setSample('students'); renderMode();
  });

  EDU.onLang(function () {
    if (S.sample) { var ka = S.ka, kb = S.kb; var p = samplePair(S.sample); S.A = p.A; S.B = p.B; S.ka = ka; S.kb = kb; }
    if (S.stackSample) S.files = sampleStack();
    renderMode();
  });

  /* ---------------- start ---------------- */
  (function start() {
    if (!S.sample && saved.A && saved.B) {
      var a = parse(saved.A.text), b = parse(saved.B.text);
      if (a && b && a.headers.length && b.headers.length) {
        S.A = { name: saved.A.name, table: a, text: saved.A.text }; S.B = { name: saved.B.name, table: b, text: saved.B.text };
        S.ka = Math.min(+saved.ka || 0, a.headers.length - 1); S.kb = Math.min(+saved.kb || 0, b.headers.length - 1);
      }
    }
    if (!S.A) { var p = samplePair(S.sample || 'students'); S.sample = S.sample || 'students'; S.A = p.A; S.B = p.B; var g = J.guessKeys(S.A.table, S.B.table); S.ka = g[0]; S.kb = g[1]; }
    if (!S.stackSample && saved.files) {
      S.files = saved.files.map(function (f) { return { name: f.name, table: parse(f.text) || { headers: [], rows: [] }, text: f.text }; });
    }
    if (!S.files) { S.files = sampleStack(); S.stackSample = true; }
    renderMode();
  })();
})();
