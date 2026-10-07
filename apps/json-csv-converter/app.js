/* JSON ↔ CSV Converter: JSON / JSON Lines to CSV (flatten or explode), CSV to typed JSON, validate and format JSON. */
(function () {
  'use strict';
  var J = window.JCC, SLUG = 'json-csv-converter';
  var store = EDU.store(SLUG), t = EDU.t, $ = EDU.$, el = EDU.el;
  var PAGE = 100, AUTO_LIMIT = 400000, SAVE_LIMIT = 1000000, SHOW_LIMIT = 1500000;

  EDU.init({ slug: SLUG, title: 'app_title', wide: true, waKey: 'shell_wa_tool' });

  var saved = store.get('state', {}) || {};
  var S = {
    mode: ['j2c', 'c2j', 'fmt'].indexOf(saved.mode) >= 0 ? saved.mode : 'j2c',
    arr: ['join', 'explode', 'json'].indexOf(saved.arr) >= 0 ? saved.arr : 'join',
    keepText: !!saved.keepText, nest: saved.nest !== false, outFmt: saved.outFmt || 'pretty', indent: saved.indent || '2',
    tab: null, path: undefined, sample: saved.sample !== false, inputs: saved.inputs || {}, page: 0,
    result: null, fileName: ''
  };

  /* ---------------- samples ---------------- */
  function C() { return (window.APP_CONTENT || {})[EDU.lang] || window.APP_CONTENT.en; }
  function sampleJson() {
    var c = C();
    var data = {
      status: 'ok', page: 1, total: 3,
      orders: [
        { id: 5001, date: '2026-09-14', customer: { name: c.names[0], phone: '+91 98765 43210', address: { city: c.cities[0], pin: '411001' } },
          items: [{ name: c.items[0], qty: 2, price: 45 }, { name: c.items[1], qty: 1, price: 120 }], paid: true, coupon: null, tags: ['new', 'upi'] },
        { id: 5002, date: '2026-09-15', customer: { name: c.names[1], phone: '+91 91234 56780', address: { city: c.cities[1], pin: '302001' } },
          items: [{ name: c.items[2], qty: 5, price: 30 }], paid: false, coupon: 'DIWALI10', tags: [] },
        { id: 5003, date: '2026-09-15', customer: { name: c.names[2], phone: '+91 99887 76655', address: { city: c.cities[2] } },
          items: [{ name: c.items[3], qty: 1, price: 550 }, { name: c.items[4], qty: 3, price: 20 }, { name: c.items[5], qty: 2, price: 60 }],
          paid: true, coupon: null, tags: ['cod'], 'delivery.slot': 'evening' }
      ]
    };
    return JSON.stringify(data, null, 2);
  }
  function sampleCsv() {
    var c = C().contacts;
    var phones = ['09876543210', '9823012345', '+91 94440 12345', '9988776655', '9814012345', '9437012345'];
    var ages = ['34', '29', '41', '', '38', '45.5'], pins = ['600001', '682001', '226001', '440001', '143001', '751001'];
    var wa = ['true', 'false', 'TRUE', 'true', 'false', 'true'];
    var rows = [c.headers.slice()];
    for (var i = 0; i < 6; i++) rows.push([c.names[i], phones[i], ages[i], c.cities[i], pins[i], wa[i], i === 0 ? c.notes[0] : i === 3 ? c.notes[1] : '']);
    return EDU.csv.stringify(rows).replace(/^﻿/, '');
  }
  function sampleFor(mode) { return mode === 'c2j' ? sampleCsv() : sampleJson(); }

  /* ---------------- input ---------------- */
  var input = $('#input');
  function setInput(text, name, isSample) {
    input.value = text;
    S.fileName = name || '';
    S.sample = !!isSample;
    S.path = undefined; S.page = 0;
    saveInput();
    run(true);
  }
  function saveInput() {
    var v = input.value;
    if (!S.sample) S.inputs[S.mode] = v.length <= SAVE_LIMIT ? v : '';
    else delete S.inputs[S.mode];
    persist();
  }
  function persist() {
    store.set('state', { mode: S.mode, arr: S.arr, keepText: S.keepText, nest: S.nest, outFmt: S.outFmt, indent: S.indent, sample: S.sample, inputs: S.inputs });
  }
  function sizeText(n) { return n < 1024 ? t('size_b', { n: EDU.fmt(n) }) : n < 1048576 ? t('size_kb', { n: EDU.fmt(Math.round(n / 1024)) }) : t('size_mb', { n: EDU.fmt(Math.round(n / 104857.6) / 10) }); }

  /* ---------------- conversion ---------------- */
  var timer = null;
  function run(force) {
    var text = input.value;
    $('#in-size').textContent = sizeText(text.length);
    var big = text.length > AUTO_LIMIT;
    $('#convert').hidden = !big;
    if (big && !force) { setStatus('info', t('big_press')); return; }
    var t0 = performance.now();
    try {
      if (S.mode === 'c2j') runC2J(text); else runJson(text);
    } catch (e) {
      setStatus('danger', t('err_generic')); S.result = null; renderOutput();
      return;
    }
    S.ms = Math.round(performance.now() - t0);
    renderOutput();
  }
  function setStatus(kind, text) {
    var s = $('#status');
    s.className = 'callout ' + (kind === 'ok' ? 'success' : kind === 'info' ? '' : kind);
    s.textContent = text;
    s.hidden = !text;
  }
  function showError(err) {
    var box = $('#json-error');
    box.hidden = false;
    box.dataset.line = err.line; box.dataset.col = err.col;
    $('#err-msg').textContent = t('e_' + err.kind);
    $('#err-where').textContent = t('err_where', { line: EDU.fmt(err.line), col: EDU.fmt(err.col) });
    var lt = err.lineText || '', start = Math.max(0, err.col - 1 - 40), shown = lt.slice(start, start + 80);
    $('#err-code').textContent = (start > 0 ? '…' : '') + shown + '\n' + ' '.repeat(Math.max(0, err.col - 1 - start + (start > 0 ? 1 : 0))) + '^';
    setStatus('', '');
  }
  function goToError() {
    var b = $('#json-error'), line = +b.dataset.line, col = +b.dataset.col, txt = input.value, pos = 0;
    for (var l = 1; l < line; l++) { pos = txt.indexOf('\n', pos) + 1; if (pos <= 0) break; }
    pos += col - 1;
    input.focus(); input.setSelectionRange(pos, Math.min(txt.length, pos + 1));
  }
  function runJson(text) {
    $('#json-error').hidden = true;
    var p = J.parseAny(text);
    if (!p.ok) {
      S.result = null;
      if (p.error.kind === 'empty') { setStatus('info', t('empty_input')); return; }
      showError(p.error);
      return;
    }
    var v = p.value;
    if (S.mode === 'fmt') {
      var ind = S.indent === 'tab' ? '\t' : +S.indent;
      var out = p.lines ? v.map(function (x) { return JSON.stringify(x); }).join('\n') : S.fmtMin ? JSON.stringify(v) : JSON.stringify(v, null, ind);
      if (p.lines && !S.fmtMin) out = JSON.stringify(v, null, ind);
      S.result = { kind: 'text', text: out, ext: p.lines && S.fmtMin ? '.jsonl' : '.json', schemaOf: Array.isArray(v) ? v : [v], value: v };
      var what = Array.isArray(v) ? t('top_array', { n: EDU.fmt(v.length) }) : J.typeOf(v) === 'object' ? t('top_object', { n: EDU.fmt(Object.keys(v).length) }) : t('top_value');
      setStatus('ok', (p.lines ? t('valid_jsonl', { n: EDU.fmt(v.length) }) : t('valid_json')) + ' ' + what);
      return;
    }
    /* JSON → CSV: choose the list of records */
    var lists = p.lines ? [] : J.findLists(v);
    if (S.path === undefined || (S.path !== null && J.getPath(v, S.path) === undefined)) S.path = p.lines ? '' : J.defaultPath(v);
    fillPaths(lists, v, p.lines);
    var recs = p.lines ? v : J.records(v, S.path);
    var tbl = J.toTable(recs, S.arr);
    S.result = { kind: 'table', table: tbl, records: recs.length, schemaOf: recs, ext: '.csv', lines: p.lines };
    var msg = t('j2c_done', { recs: EDU.fmt(recs.length), rows: EDU.fmt(tbl.rows.length), cols: EDU.fmt(tbl.headers.length) });
    if (p.lines) msg = t('read_jsonl') + ' ' + msg;
    setStatus('ok', msg);
    var notes = [];
    if (tbl.capped) notes.push(t('note_capped', { n: EDU.fmt(tbl.rows.length) }));
    if (tbl.dotKeys) notes.push(t('note_dotkeys'));
    $('#notes').textContent = notes.join(' ');
    $('#notes').hidden = !notes.length;
  }
  function fillPaths(lists, v, lines) {
    var sel = $('#rec-path'); sel.innerHTML = '';
    var add = function (val, label) { var o = el('option', { value: val === null ? '\u0000' : val, text: label }); sel.appendChild(o); };
    if (lines) { add('', t('path_lines')); sel.value = ''; sel.disabled = true; return; }
    sel.disabled = false;
    if (!Array.isArray(v)) add(null, t('path_whole'));
    lists.forEach(function (c) { add(c.path, c.path ? t('path_list', { path: c.path, n: EDU.fmt(c.count) }) : t('path_top', { n: EDU.fmt(c.count) })); });
    if (Array.isArray(v) && !lists.some(function (c) { return c.path === ''; })) add('', t('path_top', { n: EDU.fmt(v.length) }));
    sel.value = S.path === null ? '\u0000' : S.path;
  }
  function runC2J(text) {
    $('#json-error').hidden = true;
    if (!text.trim()) { S.result = null; setStatus('info', t('empty_input')); return; }
    var rows = EDU.csv.parse(text, detectDelim(text));
    if (!rows.length || !rows[0].length) { S.result = null; setStatus('danger', t('err_csv')); return; }
    var width = 0; rows.forEach(function (r) { if (r.length > width) width = r.length; });
    var headers = [], seen = {};
    for (var c = 0; c < width; c++) {
      var h = String(rows[0][c] == null ? '' : rows[0][c]).trim() || ('column' + (c + 1)), nm = h, k = 2;
      while (seen[nm]) nm = h + '_' + (k++);
      seen[nm] = 1; headers.push(nm);
    }
    var table = { headers: headers, rows: rows.slice(1) };
    var objs = J.tableToObjects(table, { keepText: S.keepText, nest: S.nest });
    var out, ext = '.json';
    if (S.outFmt === 'jsonl') { out = objs.map(function (o) { return JSON.stringify(o); }).join('\n'); ext = '.jsonl'; }
    else if (S.outFmt === 'compact') out = JSON.stringify(objs);
    else out = JSON.stringify(objs, null, 2);
    S.result = { kind: 'text', text: out, ext: ext, schemaOf: objs, value: objs, table: table };
    setStatus('ok', t('c2j_done', { rows: EDU.fmt(objs.length), cols: EDU.fmt(headers.length) }));
  }
  function detectDelim(text) {
    var first = text.slice(0, 5000).split(/\r?\n/).filter(function (l) { return l.trim(); }).slice(0, 5), best = ',', score = -1;
    [',', ';', '\t', '|'].forEach(function (d) {
      var counts = first.map(function (l) { var n = 0, q = false; for (var i = 0; i < l.length; i++) { var ch = l.charAt(i); if (ch === '"') q = !q; else if (ch === d && !q) n++; } return n; });
      if (!counts.length || !counts[0]) return;
      var sc = counts.filter(function (n) { return n === counts[0]; }).length * 1000 + counts[0];
      if (sc > score) { score = sc; best = d; }
    });
    return best;
  }

  /* ---------------- output ---------------- */
  function tabsFor() { return S.mode === 'j2c' ? ['table', 'text', 'schema'] : ['text', 'schema']; }
  function outputText() {
    var r = S.result;
    if (!r) return '';
    if (r.kind === 'table') {
      if (r.csv === undefined) r.csv = EDU.csv.stringify([r.table.headers].concat(r.table.rows)).replace(/^﻿/, '');
      return r.csv;
    }
    return r.text;
  }
  function renderOutput() {
    var tabs = tabsFor();
    if (tabs.indexOf(S.tab) < 0) S.tab = tabs[0];
    EDU.$$('#out-tabs button').forEach(function (b) {
      b.hidden = tabs.indexOf(b.dataset.tab) < 0;
      b.setAttribute('aria-selected', b.dataset.tab === S.tab ? 'true' : 'false');
    });
    $('#tab-text').textContent = t(S.mode === 'j2c' ? 'tab_csv' : 'tab_json');
    var r = S.result;
    $('#out-empty').hidden = !!r;
    $('#out-table').hidden = !(r && S.tab === 'table');
    $('#out-text').hidden = !(r && S.tab === 'text');
    $('#out-schema').hidden = !(r && S.tab === 'schema');
    $('#copy').disabled = $('#download').disabled = !r;
    $('#timing').textContent = r && S.ms !== undefined ? t('timing', { ms: EDU.fmt(S.ms) }) : '';
    if (!r) { $('#notes').hidden = true; return; }
    if (S.mode !== 'j2c') $('#notes').hidden = true;
    if (S.tab === 'table') renderTable();
    if (S.tab === 'text') {
      var txt = outputText(), ta = $('#output');
      ta.value = txt.length > SHOW_LIMIT ? txt.slice(0, SHOW_LIMIT) : txt;
      $('#text-cut').hidden = txt.length <= SHOW_LIMIT;
      $('#out-size').textContent = sizeText(txt.length);
    }
    if (S.tab === 'schema') renderSchema();
  }
  function renderTable() {
    var tb = S.result.table, total = tb.rows.length, pages = Math.max(1, Math.ceil(total / PAGE));
    if (S.page >= pages) S.page = pages - 1;
    var from = S.page * PAGE, to = Math.min(total, from + PAGE), h = ['<thead><tr><th class="jc-rn" scope="col">#</th>'];
    tb.headers.forEach(function (x) { h.push('<th scope="col">' + EDU.esc(x) + '</th>'); });
    h.push('</tr></thead><tbody>');
    for (var i = from; i < to; i++) {
      h.push('<tr><td class="jc-rn">' + (i + 1) + '</td>');
      tb.rows[i].forEach(function (v, c) { h.push('<td data-c="' + c + '">' + EDU.esc(v) + '</td>'); });
      h.push('</tr>');
    }
    $('#grid').innerHTML = h.join('') + '</tbody>';
    $('#pager').hidden = pages < 2;
    $('#page-info').textContent = total ? t('page_info', { from: EDU.fmt(from + 1), to: EDU.fmt(to), total: EDU.fmt(total) }) : '';
    $('#pg-prev').disabled = S.page === 0; $('#pg-next').disabled = S.page >= pages - 1;
  }
  function renderSchema() {
    var sc = J.schema(S.result.schemaOf), body = $('#schema-body');
    body.innerHTML = '';
    sc.fields.forEach(function (f) {
      var types = Object.keys(f.types);
      var tcell = el('td', {});
      types.forEach(function (k) { tcell.appendChild(el('span', { class: 'badge t-' + k, text: t('ty_' + k) })); });
      if (types.filter(function (k) { return k !== 'null'; }).length > 1) tcell.appendChild(el('span', { class: 'badge danger', text: t('mixed') }));
      var pct = sc.records ? Math.round(100 * f.present / sc.records) : 0;
      body.appendChild(el('tr', {},
        el('th', { scope: 'row', class: 'no-i18n jc-path', text: f.path }),
        tcell,
        el('td', { class: 'num' }, el('span', { class: 'jc-bar', style: { '--p': pct + '%' } }), EDU.fmt(pct) + '%'),
        el('td', { class: 'no-i18n jc-ex', text: f.example === undefined ? '—' : String(f.example).slice(0, 60) })));
    });
    $('#schema-info').textContent = t('schema_info', { n: EDU.fmt(sc.fields.length), recs: EDU.fmt(sc.records) });
  }

  /* ---------------- mode & options UI ---------------- */
  function renderMode() {
    EDU.$$('#mode-tabs button').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.mode === S.mode ? 'true' : 'false'); });
    $('#opts-j2c').hidden = S.mode !== 'j2c'; $('#opts-c2j').hidden = S.mode !== 'c2j'; $('#opts-fmt').hidden = S.mode !== 'fmt';
    $('#in-label').textContent = t(S.mode === 'c2j' ? 'in_csv' : 'in_json');
    $('#load-sample').textContent = t(S.mode === 'c2j' ? 'sample_csv' : 'sample_json');
    $('#arr-mode').value = S.arr; $('#opt-text').checked = S.keepText; $('#opt-nest').checked = S.nest; $('#out-fmt').value = S.outFmt; $('#indent').value = S.indent;
    $('#mode-help').textContent = t('help_' + S.mode);
  }
  function switchMode(m, keepText) {
    S.mode = m; S.tab = null; S.path = undefined; S.page = 0; S.fmtMin = false;
    renderMode();
    if (!keepText) {
      var have = S.inputs[m];
      if (have) { input.value = have; S.sample = false; } else { input.value = sampleFor(m); S.sample = true; }
    }
    persist();
    run(true);
  }

  /* ---------------- events ---------------- */
  EDU.$$('#mode-tabs button').forEach(function (b) { b.addEventListener('click', function () { if (b.dataset.mode !== S.mode) switchMode(b.dataset.mode); }); });
  input.addEventListener('input', function () {
    S.sample = false; S.fileName = '';
    clearTimeout(timer);
    timer = setTimeout(function () { saveInput(); S.path = S.path; run(false); }, input.value.length > 100000 ? 700 : 250);
  });
  $('#convert').addEventListener('click', function () { run(true); });
  $('#load-sample').addEventListener('click', function () { setInput(sampleFor(S.mode), '', true); });
  $('#clear-in').addEventListener('click', function () { setInput('', '', false); input.focus(); });
  function openFile(f) {
    if (!f) return;
    if (/\.(xlsx?|ods|pdf|docx?)$/i.test(f.name)) { EDU.toast(t('err_excel')); return; }
    $('#busy').hidden = false;
    EDU.readText(f).then(function (text) {
      var isCsv = /\.(csv|tsv|txt)$/i.test(f.name) && !/^\s*[\[{]/.test(text.slice(0, 200));
      var isJson = /\.(json|jsonl|ndjson|geojson)$/i.test(f.name) || /^\s*[\[{]/.test(text.slice(0, 200));
      if (isCsv && S.mode !== 'c2j') switchMode('c2j', true);
      else if (isJson && S.mode === 'c2j') switchMode('j2c', true);
      setTimeout(function () { setInput(text, f.name.replace(/\.[^.]+$/, ''), false); $('#busy').hidden = true; }, 20);
    }).catch(function () { $('#busy').hidden = true; EDU.toast(t('err_file')); });
  }
  $('#open-file').addEventListener('click', function () { EDU.pickFile('.json,.jsonl,.ndjson,.geojson,.csv,.tsv,.txt,application/json,text/csv,text/plain').then(openFile); });
  var drop = $('#in-card');
  drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('drag'); });
  drop.addEventListener('dragleave', function () { drop.classList.remove('drag'); });
  drop.addEventListener('drop', function (e) { e.preventDefault(); drop.classList.remove('drag'); openFile(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]); });
  $('#rec-path').addEventListener('change', function () { var v = $('#rec-path').value; S.path = v === '\u0000' ? null : v; S.page = 0; run(true); });
  $('#arr-mode').addEventListener('change', function () { S.arr = $('#arr-mode').value; S.page = 0; persist(); run(true); });
  $('#opt-text').addEventListener('change', function () { S.keepText = $('#opt-text').checked; persist(); run(true); });
  $('#opt-nest').addEventListener('change', function () { S.nest = $('#opt-nest').checked; persist(); run(true); });
  $('#out-fmt').addEventListener('change', function () { S.outFmt = $('#out-fmt').value; persist(); run(true); });
  $('#indent').addEventListener('change', function () { S.indent = $('#indent').value; S.fmtMin = false; persist(); run(true); });
  $('#btn-pretty').addEventListener('click', function () { S.fmtMin = false; run(true); S.tab = 'text'; renderOutput(); });
  $('#btn-min').addEventListener('click', function () { S.fmtMin = true; run(true); S.tab = 'text'; renderOutput(); });
  $('#btn-use').addEventListener('click', function () { if (S.result && S.result.text !== undefined) setInput(S.result.text, S.fileName, false); });
  $('#goto-err').addEventListener('click', goToError);
  EDU.$$('#out-tabs button').forEach(function (b) { b.addEventListener('click', function () { S.tab = b.dataset.tab; renderOutput(); }); });
  $('#pg-prev').addEventListener('click', function () { S.page--; renderTable(); });
  $('#pg-next').addEventListener('click', function () { S.page++; renderTable(); });
  $('#copy').addEventListener('click', function () { EDU.copy(outputText()); });
  $('#download').addEventListener('click', function () {
    var r = S.result; if (!r) return;
    var base = S.fileName || (S.mode === 'c2j' ? 'contacts' : S.mode === 'fmt' ? 'formatted' : 'orders');
    if (r.kind === 'table') EDU.download(base + '.csv', EDU.csv.stringify([r.table.headers].concat(r.table.rows)), 'text/csv');
    else EDU.download(base + r.ext, r.text, r.ext === '.jsonl' ? 'application/x-ndjson' : 'application/json');
  });
  $('#reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    store.remove('state');
    S.inputs = {}; S.arr = 'join'; S.keepText = false; S.nest = true; S.outFmt = 'pretty'; S.indent = '2';
    switchMode('j2c');
  });

  EDU.onLang(function () {
    renderMode();
    if (S.sample) input.value = sampleFor(S.mode);
    run(true);
  });

  /* ---------------- start ---------------- */
  renderMode();
  if (S.inputs[S.mode]) { input.value = S.inputs[S.mode]; S.sample = false; }
  else { input.value = sampleFor(S.mode); S.sample = true; }
  run(true);
})();
