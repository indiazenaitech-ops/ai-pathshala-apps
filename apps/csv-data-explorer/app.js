/* Data Explorer: open a CSV (file, drop, paste or sample), profile every column, browse/filter/sort, correlation. */
(function () {
  'use strict';
  var D = window.DATACORE;
  var store = EDU.store('csv-data-explorer');
  var PAGE = 100, MAX_SAVE = 1000000, MAX_CORR = 20;

  EDU.init({ slug: 'csv-data-explorer', title: 'app_title', wide: true, waKey: 'shell_wa_tool' });

  var S = {
    ds: null, src: null,             /* src: {kind:'sample', id} | {kind:'text', name, text} */
    tab: store.get('tab', 'cols'),
    filters: [], query: '', sort: null, page: 0, hidden: {}, idx: null, profiles: null, corrSel: null, lower: {}
  };

  /* ---------- helpers ---------- */
  function V() { var C = window.APP_CONTENT; return C[EDU.lang] || C.en; }
  function colName(c) { return S.ds.headers[c] || EDU.t('col_n', { n: c + 1 }); }
  function f2(n) { return isFinite(n) ? EDU.fmt(n, { maximumFractionDigits: 2 }) : '–'; }
  function fInt(n) { return EDU.fmt(n); }
  function pct(a, b) { return b ? EDU.fmt(a / b * 100, { maximumFractionDigits: 1 }) : '0'; }
  function show(el, on) { el.hidden = !on; }
  function msg(text) { var m = EDU.$('#msg'); m.textContent = text || ''; show(m, !!text); }
  function fmtVal(c, v) { return S.ds.types[c] === 'date' ? D.fmtDate(v) : f2(v); }

  /* ---------- loading ---------- */
  function setDataset(ds, src, keepView) {
    S.ds = ds; S.src = src; S.profiles = null; S.lower = {}; S.corrSel = null;
    if (!keepView) { S.filters = []; S.query = ''; S.sort = null; S.page = 0; S.hidden = {}; EDU.$('#q').value = ''; }
    else S.filters = S.filters.filter(function (f) { return f.col < ds.width; });
    msg('');
    saveSrc();
    renderAll();
  }

  function saveSrc() {
    var src = S.src;
    if (!src) { store.remove('src'); return; }
    if (src.kind === 'sample') { store.set('src', src); return; }
    if (src.text.length <= MAX_SAVE) { if (!store.set('src', src)) store.remove('src'); }
    else { store.remove('src'); EDU.toast(EDU.t('too_big_save')); }
  }

  function loadSample(id, keepView) {
    setDataset(D.sample(id, V()), { kind: 'sample', id: id }, keepView);
  }

  function loadText(text, name) {
    if (!String(text || '').trim()) { msg(EDU.t('empty_file')); return; }
    var busy = EDU.$('#summary');
    EDU.$('#ds-area').hidden = false;
    busy.textContent = EDU.t('loading');
    setTimeout(function () {
      var ds = null;
      try { ds = D.load(text); } catch (e) { ds = null; }
      if (!ds) { msg(EDU.t('empty_file')); if (!S.ds) EDU.$('#ds-area').hidden = true; else renderSummary(); return; }
      if (!ds.n) { msg(EDU.t('only_header')); if (!S.ds) EDU.$('#ds-area').hidden = true; else renderSummary(); return; }
      setDataset(ds, { kind: 'text', name: name || '', text: text });
    }, 30);
  }

  function loadFile(file) {
    if (!file) return;
    if (/\.(xlsx|xls|ods|numbers)$/i.test(file.name)) { msg(EDU.t('excel_file')); return; }
    EDU.readText(file).then(function (txt) {
      if (/\u0000/.test(txt.slice(0, 2000))) { msg(EDU.t('read_error')); return; }
      loadText(txt, file.name);
    }, function () { msg(EDU.t('read_error')); });
  }

  /* ---------- summary ---------- */
  function renderSummary() {
    var ds = S.ds; if (!ds) return;
    var nameEl = EDU.$('#ds-name');
    nameEl.textContent = '';
    if (S.src && S.src.kind === 'sample') { nameEl.classList.remove('no-i18n'); nameEl.textContent = EDU.t('sample_' + S.src.id); }
    else { nameEl.classList.add('no-i18n'); nameEl.textContent = (S.src && S.src.name) || EDU.t('pasted_data'); }
    var miss = 0; ds.missing.forEach(function (m) { miss += m; });
    var cells = ds.n * ds.width;
    EDU.$('#summary').textContent = EDU.t('summary', { rows: fInt(ds.n), cols: fInt(ds.width), pct: pct(miss, cells) });
    var notes = EDU.$('#notes'); notes.textContent = '';
    var sepKey = { ',': 'sep_comma', ';': 'sep_semicolon', '\t': 'sep_tab', '|': 'sep_pipe' }[ds.delim] || 'sep_comma';
    if (!S.src || S.src.kind !== 'sample') notes.appendChild(EDU.el('p', { text: EDU.t('sep_used', { sep: EDU.t(sepKey) }) }));
    if (ds.ragged) notes.appendChild(EDU.el('p', { text: EDU.t('ragged_note', { n: fInt(ds.ragged) }) }));
    var noName = ds.headers.filter(function (h) { return !h; }).length;
    if (noName) notes.appendChild(EDU.el('p', { text: EDU.t('noname_note', { n: fInt(noName) }) }));
  }

  /* ---------- column profiles ---------- */
  function profile(c) {
    var ds = S.ds, type = ds.types[c], col = ds.cols[c], p = { type: type, missing: ds.missing[c], invalid: ds.invalid[c] };
    var counts = new Map(), i, v;
    for (i = 0; i < ds.n; i++) { v = col[i]; if (D.isMissing(v)) continue; counts.set(v, (counts.get(v) || 0) + 1); }
    p.unique = counts.size;
    if (type === 'number' || type === 'date') {
      p.stats = D.numStats(ds.num[c]);
      p.hist = histogram(p.stats.sorted, type);
      delete p.stats.sorted;
    } else if (type === 'bool') {
      var yes = 0, no = 0, a = ds.num[c];
      for (i = 0; i < a.length; i++) { if (a[i] === 1) yes++; else if (a[i] === 0) no++; }
      p.yes = yes; p.no = no; p.count = yes + no;
    }
    if (type === 'text') {
      var top = [];
      counts.forEach(function (n, k) { top.push([k, n]); });
      top.sort(function (x, y) { return y[1] - x[1] || (x[0] < y[0] ? -1 : 1); });
      p.top = top.slice(0, 5);
    }
    p.count = p.count !== undefined ? p.count : (p.stats ? p.stats.count : ds.n - p.missing);
    return p;
  }
  function histogram(sorted, type) {
    var n = sorted.length; if (!n) return null;
    var lo = sorted[0], hi = sorted[n - 1], bins = 10, out = [];
    if (lo === hi) return { lo: lo, hi: hi, counts: [n] };
    var w = (hi - lo) / bins;
    for (var b = 0; b < bins; b++) out.push(0);
    for (var i = 0; i < n; i++) { var k = Math.floor((sorted[i] - lo) / w); if (k >= bins) k = bins - 1; out[k]++; }
    return { lo: lo, hi: hi, counts: out };
  }
  function histSvg(h) {
    var NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 200 60'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('class', 'dx-hist'); svg.setAttribute('aria-hidden', 'true');
    var max = Math.max.apply(null, h.counts), w = 200 / h.counts.length;
    h.counts.forEach(function (n, i) {
      var r = document.createElementNS(NS, 'rect'), bh = max ? n / max * 56 : 0;
      r.setAttribute('x', (i * w + 1).toFixed(2)); r.setAttribute('width', Math.max(1, w - 2).toFixed(2));
      r.setAttribute('y', (60 - bh).toFixed(2)); r.setAttribute('height', bh.toFixed(2)); r.setAttribute('rx', '1.5');
      svg.appendChild(r);
    });
    return svg;
  }
  function statRow(dl, key, val, raw) { dl.appendChild(EDU.el('dt', { text: EDU.t(key) })); dl.appendChild(EDU.el('dd', { text: val, dataset: { stat: key, v: String(raw) } })); }

  function renderCards() {
    var ds = S.ds, box = EDU.$('#cards'); box.textContent = '';
    if (!S.profiles) { S.profiles = []; for (var c = 0; c < ds.width; c++) S.profiles.push(profile(c)); }
    S.profiles.forEach(function (p, c) {
      var card = EDU.el('article', { class: 'card dx-card', dataset: { col: c } });
      var head = EDU.el('div', { class: 'dx-card-head' },
        EDU.el('h3', { class: ds.headers[c] ? 'no-i18n' : '', text: colName(c), title: colName(c) }),
        EDU.el('span', { class: 'badge dx-badge-' + p.type, text: EDU.t('type_' + p.type) }));
      card.appendChild(head);
      var dl = EDU.el('dl', { class: 'dx-stats' });
      statRow(dl, 'st_count', fInt(p.count), p.count);
      statRow(dl, 'st_missing', fInt(p.missing) + ' (' + pct(p.missing, ds.n) + '%)', p.missing);
      statRow(dl, 'st_unique', fInt(p.unique), p.unique);
      if (p.type === 'number') {
        var st = p.stats;
        statRow(dl, 'st_min', f2(st.min), st.min); statRow(dl, 'st_max', f2(st.max), st.max);
        statRow(dl, 'st_mean', f2(st.mean), st.mean); statRow(dl, 'st_median', f2(st.median), st.median);
        statRow(dl, 'st_sd', f2(st.sd), st.sd); statRow(dl, 'st_sum', f2(st.sum), st.sum);
      } else if (p.type === 'date') {
        statRow(dl, 'st_earliest', D.fmtDate(p.stats.min), p.stats.min); statRow(dl, 'st_latest', D.fmtDate(p.stats.max), p.stats.max);
      } else if (p.type === 'bool') {
        statRow(dl, 'yes', fInt(p.yes), p.yes); statRow(dl, 'no', fInt(p.no), p.no);
      }
      card.appendChild(dl);
      if (p.invalid) card.appendChild(EDU.el('p', { class: 'dx-warn', text: EDU.t(p.type === 'date' ? 'invalid_dates' : 'invalid_nums', { n: fInt(p.invalid) }) }));
      if (p.hist) {
        card.appendChild(histSvg(p.hist));
        card.appendChild(EDU.el('div', { class: 'dx-hist-ax' }, EDU.el('span', { text: fmtVal(c, p.hist.lo) }), EDU.el('span', { text: fmtVal(c, p.hist.hi) })));
      }
      if (p.type === 'bool' && p.count) {
        card.appendChild(topList([[EDU.t('yes'), p.yes], [EDU.t('no'), p.no]], p.count, false));
      }
      if (p.top && p.top.length) {
        card.appendChild(EDU.el('strong', { class: 'small', text: EDU.t('st_top') }));
        card.appendChild(topList(p.top, p.count, true));
      }
      box.appendChild(card);
    });
  }
  function topList(items, total, user) {
    var wrap = EDU.el('div', { class: 'dx-top' }), max = 0;
    items.forEach(function (x) { if (x[1] > max) max = x[1]; });
    items.forEach(function (x) {
      wrap.appendChild(EDU.el('div', { class: 'dx-top-row' },
        EDU.el('i', { class: 'bar', style: { width: (max ? x[1] / max * 100 : 0) + '%' } }),
        EDU.el('span', { class: user ? 'no-i18n' : '', text: x[0], title: x[0] }),
        EDU.el('b', { text: fInt(x[1]) })));
    });
    return wrap;
  }

  /* ---------- table: filter, search, sort, page ---------- */
  var collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  function lowerCol(c) {
    if (!S.lower[c]) { var src = S.ds.cols[c], out = new Array(src.length); for (var i = 0; i < src.length; i++) out[i] = src[i].toLowerCase(); S.lower[c] = out; }
    return S.lower[c];
  }
  function visibleCols() { var out = []; for (var c = 0; c < S.ds.width; c++) if (!S.hidden[c]) out.push(c); return out; }

  function filterTest(f) {
    var ds = S.ds, c = f.col, type = ds.types[c], raw = ds.cols[c], num = ds.num[c];
    if (f.op === 'missing') return function (i) { return D.isMissing(raw[i]); };
    if (f.op === 'notmissing') return function (i) { return !D.isMissing(raw[i]); };
    if (f.op === 'between') {
      var parse = type === 'date' ? D.parseDate : D.parseNum;
      var a = parse(f.a), b = parse(f.b);
      if (a !== a) a = -Infinity; if (b !== b) b = Infinity;
      if (a > b) { var t = a; a = b; b = t; }
      return function (i) { var v = num[i]; return v === v && v >= a && v <= b; };
    }
    var needle = String(f.a || '').trim().toLowerCase(), low = lowerCol(c);
    if (f.op === 'equals') {
      if (num && type !== 'bool') {
        var x = type === 'date' ? D.parseDate(f.a) : D.parseNum(f.a);
        if (x === x) return function (i) { return num[i] === x; };
      }
      if (type === 'bool') { var bv = D.parseBool(f.a); if (bv === bv) return function (i) { return num[i] === bv; }; }
      return function (i) { return low[i] === needle; };
    }
    return function (i) { return low[i].indexOf(needle) >= 0; };
  }

  function computeIdx() {
    var ds = S.ds, n = ds.n, tests = S.filters.map(filterTest), q = S.query.trim().toLowerCase(), idx = [], i, k;
    var qcols = q ? visibleCols().map(lowerCol) : null;
    outer: for (i = 0; i < n; i++) {
      for (k = 0; k < tests.length; k++) if (!tests[k](i)) continue outer;
      if (qcols) {
        var hit = false;
        for (k = 0; k < qcols.length; k++) if (qcols[k][i].indexOf(q) >= 0) { hit = true; break; }
        if (!hit) continue;
      }
      idx.push(i);
    }
    if (S.sort) {
      var c = S.sort.col, dir = S.sort.dir, num = ds.num[c], raw = ds.cols[c];
      if (num && ds.types[c] !== 'bool') {
        idx.sort(function (a, b) {
          var x = num[a], y = num[b], xm = x !== x, ym = y !== y;
          if (xm || ym) return xm === ym ? a - b : (xm ? 1 : -1);
          return (x - y) * dir || a - b;
        });
      } else {
        idx.sort(function (a, b) {
          var x = raw[a], y = raw[b], xm = D.isMissing(x), ym = D.isMissing(y);
          if (xm || ym) return xm === ym ? a - b : (xm ? 1 : -1);
          return collator.compare(x, y) * dir || a - b;
        });
      }
    }
    S.idx = idx;
    var pages = Math.max(1, Math.ceil(idx.length / PAGE));
    if (S.page >= pages) S.page = pages - 1;
  }

  function renderTable() {
    var ds = S.ds; if (!ds) return;
    if (!S.idx) computeIdx();
    var idx = S.idx, cols = visibleCols(), table = EDU.$('#table');
    table.textContent = '';
    var thead = EDU.el('thead'), tr = EDU.el('tr');
    tr.appendChild(EDU.el('th', { class: 'rn', scope: 'col', text: '#' }));
    cols.forEach(function (c) {
      var arr = S.sort && S.sort.col === c ? (S.sort.dir > 0 ? '▲' : '▼') : '';
      var sortState = S.sort && S.sort.col === c ? (S.sort.dir > 0 ? 'ascending' : 'descending') : 'none';
      tr.appendChild(EDU.el('th', { scope: 'col', 'aria-sort': sortState },
        EDU.el('button', { type: 'button', class: ds.headers[c] ? 'no-i18n' : '', dataset: { sort: c }, onclick: function () { toggleSort(c); } },
          EDU.el('span', { text: colName(c) }), EDU.el('span', { class: 'arr', 'aria-hidden': 'true', text: arr }))));
    });
    thead.appendChild(tr); table.appendChild(thead);
    var tbody = EDU.el('tbody', { class: 'no-i18n' }), start = S.page * PAGE, end = Math.min(idx.length, start + PAGE), frag = document.createDocumentFragment();
    for (var k = start; k < end; k++) {
      var r = idx[k], row = document.createElement('tr'), td = document.createElement('td');
      td.className = 'rn'; td.textContent = r + 1; row.appendChild(td);
      for (var j = 0; j < cols.length; j++) {
        var c = cols[j], v = ds.cols[c][r], cell = document.createElement('td');
        cell.textContent = v;
        if (D.isMissing(v)) cell.className = 'miss';
        else if (ds.types[c] === 'number') cell.className = 'num';
        if (v.length > 30) cell.title = v;
        row.appendChild(cell);
      }
      frag.appendChild(row);
    }
    tbody.appendChild(frag); table.appendChild(tbody);
    var pages = Math.max(1, Math.ceil(idx.length / PAGE));
    EDU.$('#count').textContent = idx.length
      ? EDU.t('shown_rows', { from: fInt(start + 1), to: fInt(end), n: fInt(idx.length) }) + (idx.length !== ds.n ? ' ' + EDU.t('filtered_of', { n: fInt(ds.n) }) : '')
      : EDU.t('shown_none');
    EDU.$('#page').textContent = EDU.t('page_of', { p: fInt(S.page + 1), n: fInt(pages) });
    EDU.$('#prev').disabled = S.page <= 0;
    EDU.$('#next').disabled = S.page >= pages - 1;
    renderChips();
  }
  function refreshTable() { S.idx = null; renderTable(); }
  function toggleSort(c) {
    if (!S.sort || S.sort.col !== c) S.sort = { col: c, dir: 1 };
    else if (S.sort.dir === 1) S.sort.dir = -1;
    else S.sort = null;
    S.page = 0; refreshTable();
    var b = EDU.$('#table [data-sort="' + c + '"]'); if (b) b.focus();
  }

  /* filter builder */
  var OPS = { text: ['contains', 'equals', 'missing', 'notmissing'], number: ['between', 'equals', 'missing', 'notmissing'],
    date: ['between', 'equals', 'missing', 'notmissing'], bool: ['equals', 'missing', 'notmissing'], empty: ['missing', 'notmissing'] };
  function fillFilterCols() {
    var sel = EDU.$('#f-col'), keep = sel.value; sel.textContent = '';
    for (var c = 0; c < S.ds.width; c++) sel.appendChild(EDU.el('option', { value: c, text: colName(c) }));
    if (keep !== '' && +keep < S.ds.width) sel.value = keep;
    fillOps();
  }
  function fillOps() {
    var c = +EDU.$('#f-col').value || 0, sel = EDU.$('#f-op'), keep = sel.value, list = OPS[S.ds.types[c]] || OPS.text;
    sel.textContent = '';
    list.forEach(function (op) { sel.appendChild(EDU.el('option', { value: op, text: EDU.t('op_' + op) })); });
    if (list.indexOf(keep) >= 0) sel.value = keep;
    syncOpInputs();
  }
  function syncOpInputs() {
    var op = EDU.$('#f-op').value, c = +EDU.$('#f-col').value || 0, type = S.ds.types[c];
    show(EDU.$('#f-a-wrap'), op !== 'missing' && op !== 'notmissing');
    show(EDU.$('#f-b-wrap'), op === 'between');
    EDU.$('#f-a-lbl').textContent = EDU.t(op === 'between' ? 'f_from' : 'f_value');
    var ph = type === 'date' ? 'DD-MM-YYYY' : '';
    EDU.$('#f-a').placeholder = ph; EDU.$('#f-b').placeholder = ph;
  }
  function addFilter() {
    var f = { col: +EDU.$('#f-col').value, op: EDU.$('#f-op').value, a: EDU.$('#f-a').value.trim(), b: EDU.$('#f-b').value.trim() };
    if ((f.op === 'contains' || f.op === 'equals') && !f.a) { EDU.$('#f-a').focus(); EDU.toast(EDU.t('need_value')); return; }
    if (f.op === 'between' && !f.a && !f.b) { EDU.$('#f-a').focus(); EDU.toast(EDU.t('need_value')); return; }
    S.filters.push(f); S.page = 0;
    EDU.$('#f-a').value = ''; EDU.$('#f-b').value = '';
    refreshTable();
  }
  function filterLabel(f) {
    var s = colName(f.col) + ' ' + EDU.t('op_' + f.op);
    if (f.op === 'between') s += ' ' + (f.a || '…') + ' – ' + (f.b || '…');
    else if (f.op === 'contains' || f.op === 'equals') s += ' “' + f.a + '”';
    return s;
  }
  function renderChips() {
    var box = EDU.$('#chips'); box.textContent = '';
    if (!S.filters.length) { box.appendChild(EDU.el('span', { class: 'muted small', text: EDU.t('no_filters') })); return; }
    S.filters.forEach(function (f, i) {
      var lab = filterLabel(f);
      box.appendChild(EDU.el('span', { class: 'chip dx-chip no-i18n' }, EDU.el('span', { text: lab, title: lab }),
        EDU.el('button', { type: 'button', 'aria-label': EDU.t('remove_filter'), text: '×', onclick: function () { S.filters.splice(i, 1); S.page = 0; refreshTable(); } })));
    });
    if (S.filters.length > 1) box.appendChild(EDU.el('button', { type: 'button', class: 'btn btn-sm btn-ghost', text: EDU.t('clear_filters'), onclick: function () { S.filters = []; S.page = 0; refreshTable(); } }));
  }

  function chooseCols() {
    var ds = S.ds, wrap = EDU.el('div');
    var list = EDU.el('div', { class: 'dx-colpick' });
    for (var c = 0; c < ds.width; c++) {
      (function (c) {
        var cb = EDU.el('input', { type: 'checkbox', checked: !S.hidden[c] });
        cb.addEventListener('change', function () { if (cb.checked) delete S.hidden[c]; else S.hidden[c] = 1; if (visibleCols().length === 0) { S.hidden = {}; } refreshTable(); syncBoxes(); });
        list.appendChild(EDU.el('label', { class: 'check' }, cb, EDU.el('span', { class: ds.headers[c] ? 'no-i18n' : '', text: colName(c) })));
      })(c);
    }
    function syncBoxes() { EDU.$$('input', list).forEach(function (b, i) { b.checked = !S.hidden[i]; }); }
    wrap.appendChild(EDU.el('div', { class: 'row' },
      EDU.el('button', { type: 'button', class: 'btn btn-sm', text: EDU.t('show_all'), onclick: function () { S.hidden = {}; syncBoxes(); refreshTable(); } }),
      EDU.el('button', { type: 'button', class: 'btn btn-sm', text: EDU.t('hide_all'), onclick: function () { S.hidden = {}; for (var c = 1; c < ds.width; c++) S.hidden[c] = 1; syncBoxes(); refreshTable(); } })));
    wrap.appendChild(list);
    var close = EDU.modal(wrap, { title: EDU.t('choose_cols') });
    wrap.appendChild(EDU.el('div', { class: 'row' }, EDU.el('button', { type: 'button', class: 'btn btn-primary', text: EDU.t('done'), onclick: function () { close(); } })));
  }

  function exportRows() {
    if (!S.idx) computeIdx();
    var cols = visibleCols(), rows = [cols.map(colName)];
    S.idx.forEach(function (r) { rows.push(cols.map(function (c) { return S.ds.cols[c][r]; })); });
    var base = (S.src && S.src.kind === 'text' && S.src.name ? S.src.name.replace(/\.[^.]+$/, '') : 'data');
    EDU.download(base + '-filtered.csv', D.toCSV(rows), 'text/csv');
    EDU.toast(EDU.t('exported_n', { n: fInt(S.idx.length) }));
  }

  /* ---------- correlation ---------- */
  function rKind(r) {
    var a = Math.abs(r), sign = r >= 0 ? 'pos' : 'neg';
    if (a >= 0.7) return 'r_strong_' + sign;
    if (a >= 0.4) return 'r_mod_' + sign;
    if (a >= 0.2) return 'r_weak_' + sign;
    return 'r_none';
  }
  function reading(a, b, r) {
    var s = EDU.t('corr_read', { a: a, b: b, kind: EDU.t(rKind(r)), r: EDU.fmt(r, { maximumFractionDigits: 2, minimumFractionDigits: 2 }) });
    var k = Math.abs(r) < 0.2 ? 'corr_flat' : r > 0 ? 'corr_up' : 'corr_down';
    return s + ' ' + EDU.t(k, { a: a, b: b });
  }
  function cellBg(r) {
    if (!isFinite(r)) return 'var(--surface-2)';
    var p = Math.round(Math.min(1, Math.abs(r)) * 80);
    return 'color-mix(in srgb, ' + (r >= 0 ? 'var(--c7)' : 'var(--c2)') + ' ' + p + '%, var(--surface-2))';
  }
  function renderCorr() {
    var ds = S.ds, body = EDU.$('#corr-body'); body.textContent = '';
    var nums = []; for (var c = 0; c < ds.width; c++) if (ds.types[c] === 'number') nums.push(c);
    if (nums.length < 2) { body.appendChild(EDU.el('p', { class: 'callout', text: EDU.t('corr_need') })); return; }
    if (nums.length > MAX_CORR) { body.appendChild(EDU.el('p', { class: 'small muted', text: EDU.t('corr_limit', { n: MAX_CORR }) })); nums = nums.slice(0, MAX_CORR); }
    if (!S.corr || S.corr.ds !== ds) {
      var M = [];
      for (var i = 0; i < nums.length; i++) { M.push([]); for (var j = 0; j < nums.length; j++) M[i].push(i === j ? { r: 1 } : j < i ? M[j][i] : D.pearson(ds.num[nums[i]], ds.num[nums[j]])); }
      S.corr = { ds: ds, M: M };
    }
    var M2 = S.corr.M;
    var legend = EDU.el('div', { class: 'dx-legend' }, EDU.el('span', { text: EDU.t('corr_neg_label') }), EDU.el('span', { class: 'grad', 'aria-hidden': 'true' }), EDU.el('span', { text: EDU.t('corr_pos_label') }));
    body.appendChild(legend);
    var read = EDU.el('p', { class: 'dx-reading callout', 'aria-live': 'polite', text: EDU.t('corr_pick') });
    var table = EDU.el('table', { class: 'dx-corr' }), thead = EDU.el('tr', {}, EDU.el('th'));
    nums.forEach(function (c) { thead.appendChild(EDU.el('th', { scope: 'col', class: ds.headers[c] ? 'no-i18n' : '', text: colName(c), title: colName(c) })); });
    table.appendChild(EDU.el('thead', {}, thead));
    var tb = EDU.el('tbody');
    nums.forEach(function (ci, i) {
      var tr = EDU.el('tr', {}, EDU.el('th', { scope: 'row', class: ds.headers[ci] ? 'no-i18n' : '', text: colName(ci), title: colName(ci) }));
      nums.forEach(function (cj, j) {
        var r = M2[i][j].r, label = isFinite(r) ? EDU.fmt(r, { maximumFractionDigits: 2, minimumFractionDigits: 2 }) : '–';
        var btn = EDU.el('button', { type: 'button', text: label, style: { background: cellBg(r) }, 'aria-pressed': S.corrSel && S.corrSel[0] === i && S.corrSel[1] === j ? 'true' : 'false',
          'aria-label': colName(ci) + ' / ' + colName(cj) + ': ' + label,
          onclick: function () {
            S.corrSel = [i, j];
            EDU.$$('.dx-corr button').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
            btn.setAttribute('aria-pressed', 'true');
            read.textContent = i === j ? EDU.t('corr_self') : isFinite(r) ? reading(colName(ci), colName(cj), r) + ' ' + EDU.t('corr_warn') : EDU.t('corr_na');
          } });
        tr.appendChild(EDU.el('td', {}, btn));
      });
      tb.appendChild(tr);
    });
    table.appendChild(tb);
    body.appendChild(EDU.el('div', { class: 'dx-corr-wrap no-i18n-scroll' }, table));
    body.appendChild(read);
    var pairs = [];
    for (var a = 0; a < nums.length; a++) for (var b = a + 1; b < nums.length; b++) if (isFinite(M2[a][b].r)) pairs.push([a, b, M2[a][b].r]);
    pairs.sort(function (x, y) { return Math.abs(y[2]) - Math.abs(x[2]); });
    if (pairs.length) {
      body.appendChild(EDU.el('h3', { class: 'mb0', text: EDU.t('corr_strongest') }));
      var ol = EDU.el('ol', { class: 'dx-pairs' });
      pairs.slice(0, 5).forEach(function (p) { ol.appendChild(EDU.el('li', { text: reading(colName(nums[p[0]]), colName(nums[p[1]]), p[2]) })); });
      body.appendChild(ol);
      body.appendChild(EDU.el('p', { class: 'small muted mb0', text: EDU.t('corr_warn') }));
    }
  }

  /* ---------- tabs ---------- */
  function setTab(tab) {
    S.tab = tab; store.set('tab', tab);
    EDU.$$('#tabs [role="tab"]').forEach(function (b) { var on = b.dataset.tab === tab; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
    ['cols', 'table', 'corr'].forEach(function (k) { EDU.$('#p-' + k).hidden = k !== tab; });
    renderTab();
  }
  function renderTab() {
    if (!S.ds) return;
    if (S.tab === 'cols') renderCards();
    else if (S.tab === 'table') { fillFilterCols(); renderTable(); }
    else renderCorr();
  }
  function renderAll() {
    var has = !!S.ds;
    EDU.$('#ds-area').hidden = !has;
    EDU.$$('[data-sample]').forEach(function (b) { b.setAttribute('aria-pressed', S.src && S.src.kind === 'sample' && S.src.id === b.dataset.sample ? 'true' : 'false'); });
    if (!has) return;
    S.idx = null; S.corr = null;
    renderSummary();
    setTab(S.tab);
  }

  /* ---------- events ---------- */
  EDU.$('#open').addEventListener('click', function () { EDU.pickFile('.csv,.tsv,.txt,text/csv,text/plain').then(loadFile); });
  EDU.$('#paste-btn').addEventListener('click', function () {
    var box = EDU.$('#paste-box'), open = box.hidden; box.hidden = !open;
    this.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) EDU.$('#paste').focus();
  });
  EDU.$('#paste-use').addEventListener('click', function () { loadText(EDU.$('#paste').value, ''); });
  EDU.$$('[data-sample]').forEach(function (b) { b.addEventListener('click', function () { loadSample(b.dataset.sample); }); });
  var drop = EDU.$('#drop');
  function hasFiles(e) { return e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0; }
  document.addEventListener('dragover', function (e) { if (hasFiles(e)) { e.preventDefault(); drop.classList.add('over'); } });
  document.addEventListener('dragleave', function (e) { if (!e.relatedTarget) drop.classList.remove('over'); });
  document.addEventListener('drop', function (e) {
    if (!hasFiles(e)) return;
    e.preventDefault(); drop.classList.remove('over');
    loadFile(e.dataTransfer.files[0]);
  });
  EDU.$('#reset').addEventListener('click', function () {
    if (!confirm(EDU.t('confirm_reset'))) return;
    store.remove('src'); store.remove('tab'); S.tab = 'cols';
    EDU.$('#paste').value = '';
    loadSample('marks');
  });
  EDU.$$('#tabs [role="tab"]').forEach(function (b) {
    b.addEventListener('click', function () { setTab(b.dataset.tab); });
    b.addEventListener('keydown', function (e) {
      var tabs = EDU.$$('#tabs [role="tab"]'), i = tabs.indexOf(b), rtl = document.documentElement.dir === 'rtl';
      var step = e.key === 'ArrowRight' ? (rtl ? -1 : 1) : e.key === 'ArrowLeft' ? (rtl ? 1 : -1) : 0;
      if (!step) return;
      e.preventDefault(); var nb = tabs[(i + step + tabs.length) % tabs.length]; nb.focus(); setTab(nb.dataset.tab);
    });
  });
  var qTimer;
  EDU.$('#q').addEventListener('input', function () {
    clearTimeout(qTimer);
    var v = this.value;
    qTimer = setTimeout(function () { S.query = v; S.page = 0; refreshTable(); }, S.ds && S.ds.n > 5000 ? 250 : 60);
  });
  EDU.$('#f-col').addEventListener('change', fillOps);
  EDU.$('#f-op').addEventListener('change', syncOpInputs);
  EDU.$('#f-add').addEventListener('click', addFilter);
  ['#f-a', '#f-b'].forEach(function (s) { EDU.$(s).addEventListener('keydown', function (e) { if (e.key === 'Enter') addFilter(); }); });
  EDU.$('#prev').addEventListener('click', function () { if (S.page > 0) { S.page--; renderTable(); EDU.$('#tablewrap').scrollTop = 0; } });
  EDU.$('#next').addEventListener('click', function () { S.page++; renderTable(); EDU.$('#tablewrap').scrollTop = 0; });
  EDU.$('#cols-btn').addEventListener('click', chooseCols);
  EDU.$('#export').addEventListener('click', exportRows);

  EDU.onLang(function () {
    if (S.src && S.src.kind === 'sample') { loadSample(S.src.id, true); return; }   /* samples follow the language */
    renderAll();
  });

  /* ---------- start ---------- */
  var saved = store.get('src', null);
  if (saved && saved.kind === 'text' && saved.text) {
    var ds0 = null; try { ds0 = D.load(saved.text); } catch (e) { ds0 = null; }
    if (ds0 && ds0.n) { S.ds = ds0; S.src = saved; renderAll(); }
    else loadSample('marks');
  } else loadSample(saved && saved.kind === 'sample' && /^(marks|shop|rain)$/.test(saved.id) ? saved.id : 'marks');

  window.__dx = S;   /* for the automated test */
})();
