/* Pivot Table Maker: rows × columns × value with sum/count/average/min/max/count distinct, % of total/row/column,
   filters, date grouping, sort, top N, bar chart, CSV export and copy for Excel. */
(function () {
  'use strict';
  var D = window.DATACORE;
  var store = EDU.store('pivot-table-maker');
  var MAX_SAVE = 1000000, MAX_COLKEYS = 60, MAX_SHOW_ROWS = 1000, MAX_FILTER_VALUES = 400;
  var BLANK = '\u0000blank';
  var AGGS = ['sum', 'count', 'avg', 'min', 'max', 'distinct'];
  var SHOWS = ['value', 'pct_total', 'pct_row', 'pct_col'];
  var SORTS = ['label', 'desc', 'asc'];
  var TOPS = [0, 5, 10, 20];
  var GROUPS = ['none', 'month', 'quarter', 'year'];

  EDU.init({ slug: 'pivot-table-maker', title: 'app_title', wide: true, waKey: 'shell_wa_tool' });

  var S = { ds: null, src: null, cfg: null, result: null };
  function V() { var C = window.APP_CONTENT; return C[EDU.lang] || C.en; }
  function colName(c) { return S.ds.headers[c] || EDU.t('col_n', { n: c + 1 }); }
  function msg(text) { var m = EDU.$('#msg'); m.textContent = text || ''; m.hidden = !text; }

  /* ---------- default settings for a dataset ---------- */
  var SAMPLE_CFG = {
    sales: { rows: 2, cols: -1, val: 6, agg: 'sum' },
    shop: { rows: 3, cols: 7, val: 6, agg: 'sum' },
    marks: { rows: 2, cols: 8, val: 4, agg: 'avg' }
  };
  function baseCfg() { return { rows: 0, rowGroup: 'none', cols: -1, colGroup: 'none', val: -1, agg: 'count', show: 'value', sort: 'label', top: 0, lakh: false, filters: {} }; }
  function guessCfg(ds) {
    var cfg = baseCfg(), c, best = -1, bestU = Infinity;
    for (c = 0; c < ds.width; c++) {
      if (ds.types[c] === 'text' || ds.types[c] === 'bool') {
        var u = uniqueCount(ds, c, 200);
        if (u >= 2 && u <= 50 && u < bestU) { best = c; bestU = u; }
      }
    }
    if (best < 0) for (c = 0; c < ds.width; c++) if (ds.types[c] === 'text' || ds.types[c] === 'date') { best = c; break; }
    cfg.rows = best < 0 ? 0 : best;
    if (ds.types[cfg.rows] === 'date') cfg.rowGroup = 'month';
    for (c = ds.width - 1; c >= 0; c--) if (ds.types[c] === 'number' && c !== cfg.rows) { cfg.val = c; cfg.agg = 'sum'; break; }
    return cfg;
  }
  function uniqueCount(ds, c, cap) { var s = new Set(), col = ds.cols[c]; for (var i = 0; i < col.length && s.size <= cap; i++) s.add(col[i]); return s.size; }

  /* ---------- loading ---------- */
  function setData(ds, src, cfg) {
    S.ds = ds; S.src = src; S.cfg = cfg || guessCfg(ds); msg('');
    saveAll(); renderAll();
  }
  function saveAll() {
    store.set('cfg', S.cfg);
    var src = S.src; if (!src) return;
    if (src.kind === 'sample') store.set('src', src);
    else if (src.text.length <= MAX_SAVE) { if (!store.set('src', src)) store.remove('src'); }
    else { store.remove('src'); EDU.toast(EDU.t('too_big_save')); }
  }
  function loadSample(id, keepCfg) {
    var ds = D.sample(id, V()), cfg = keepCfg && S.cfg ? S.cfg : Object.assign(baseCfg(), SAMPLE_CFG[id]);
    if (!keepCfg && id === 'sales') cfg.rowGroup = 'none';
    if (keepCfg) cfg.filters = {};      /* filter values are words in the old language */
    setData(ds, { kind: 'sample', id: id }, cfg);
  }
  function loadText(text, name) {
    if (!String(text || '').trim()) { msg(EDU.t('empty_file')); return; }
    EDU.$('#dsline').textContent = EDU.t('loading');
    setTimeout(function () {
      var ds = null; try { ds = D.load(text); } catch (e) { ds = null; }
      if (!ds) { msg(EDU.t('empty_file')); renderDsLine(); return; }
      if (!ds.n) { msg(EDU.t('only_header')); renderDsLine(); return; }
      setData(ds, { kind: 'text', name: name || '', text: text });
    }, 30);
  }
  function loadFile(f) {
    if (!f) return;
    if (/\.(xlsx|xls|ods)$/i.test(f.name)) { msg(EDU.t('excel_file')); return; }
    EDU.readText(f).then(function (t) { loadText(t, f.name); }, function () { msg(EDU.t('read_error')); });
  }

  /* ---------- keys ---------- */
  function keyFn(c, group) {
    var ds = S.ds, raw = ds.cols[c], num = ds.num[c], type = ds.types[c];
    if (type === 'date' && group !== 'none') {
      return function (r) {
        var t = num[r];
        if (t !== t) return D.isMissing(raw[r]) ? BLANK : raw[r];
        var d = new Date(t), y = d.getUTCFullYear(), m = d.getUTCMonth();
        if (group === 'year') return 'Y' + y;
        if (group === 'quarter') return 'Q' + y + '-' + (Math.floor(m / 3) + 1);
        return 'M' + y + '-' + (m < 9 ? '0' : '') + (m + 1);
      };
    }
    return function (r) { var v = raw[r]; return D.isMissing(v) ? BLANK : v; };
  }
  function keyLabel(k, c, group) {
    if (k === BLANK) return EDU.t('blank');
    if (S.ds.types[c] === 'date' && group !== 'none') {
      if (k.charAt(0) === 'Y') return k.slice(1);
      if (k.charAt(0) === 'Q') { var p = k.slice(1).split('-'); return EDU.t('quarter_label', { q: p[1], y: p[0] }); }
      if (k.charAt(0) === 'M') { var q = k.slice(1).split('-'); return V().months[+q[1] - 1] + ' ' + q[0]; }
    }
    return k;
  }
  var coll = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  function compareKeys(c, group) {
    var ds = S.ds, dateGrouped = ds.types[c] === 'date' && group !== 'none', isNum = ds.types[c] === 'number', isDate = ds.types[c] === 'date';
    return function (a, b) {
      if (a === b) return 0; if (a === BLANK) return 1; if (b === BLANK) return -1;
      if (dateGrouped) return a < b ? -1 : 1;
      if (isNum) { var x = D.parseNum(a), y = D.parseNum(b); if (x === x && y === y && x !== y) return x - y; }
      if (isDate) { var p = D.parseDate(a), q = D.parseDate(b); if (p === p && q === q && p !== q) return p - q; }
      return coll.compare(a, b);
    };
  }

  /* ---------- the pivot ---------- */
  function newAcc() { return { rows: 0, k: 0, sum: 0, min: Infinity, max: -Infinity, set: null }; }
  function compute() {
    var ds = S.ds, cfg = S.cfg, n = ds.n, r;
    var rk = keyFn(cfg.rows, cfg.rowGroup), ck = cfg.cols >= 0 ? keyFn(cfg.cols, cfg.colGroup) : null;
    var val = cfg.val, num = val >= 0 && ds.types[val] === 'number' ? ds.num[val] : null, raw = val >= 0 ? ds.cols[val] : null;
    var agg = cfg.agg, distinct = agg === 'distinct';
    /* filters */
    var tests = [];
    Object.keys(cfg.filters).forEach(function (fc) {
      var f = cfg.filters[fc]; if (!f || +fc >= ds.width) return;
      var kf = keyFn(+fc, 'none'), allow = new Set(f);
      tests.push(function (i) { return allow.has(kf(i)); });
    });
    var cells = new Map(), rowAcc = new Map(), colAcc = new Map(), grand = newAcc(), skippedText = 0, skippedBlank = 0, used = 0;
    function add(acc, v, rv) {
      acc.rows++;
      if (distinct) { if (rv !== null) { if (!acc.set) acc.set = new Set(); acc.set.add(rv); } return; }
      if (v === v && v !== null) { acc.k++; acc.sum += v; if (v < acc.min) acc.min = v; if (v > acc.max) acc.max = v; }
    }
    outer: for (r = 0; r < n; r++) {
      for (var t = 0; t < tests.length; t++) if (!tests[t](r)) continue outer;
      used++;
      var a = rk(r), b = ck ? ck(r) : '', v = null, rv = null;
      if (val >= 0) {
        var rawV = raw[r];
        if (D.isMissing(rawV)) { if (agg !== 'count') skippedBlank++; }
        else { rv = rawV; if (num) { v = num[r]; if (v !== v && agg !== 'count' && !distinct) skippedText++; } else if (agg !== 'count' && !distinct) skippedText++; }
      }
      var row = cells.get(a); if (!row) { row = new Map(); cells.set(a, row); }
      var acc = row.get(b); if (!acc) { acc = newAcc(); row.set(b, acc); }
      var ra = rowAcc.get(a); if (!ra) { ra = newAcc(); rowAcc.set(a, ra); }
      var ca = colAcc.get(b); if (!ca) { ca = newAcc(); colAcc.set(b, ca); }
      add(acc, v, rv); add(ra, v, rv); add(ca, v, rv); add(grand, v, rv);
    }
    var res = { cells: cells, rowAcc: rowAcc, colAcc: colAcc, grand: grand, used: used, skippedText: skippedText, skippedBlank: skippedBlank };
    var rowKeys = Array.from(rowAcc.keys()), colKeys = Array.from(colAcc.keys());
    colKeys.sort(compareKeys(cfg.cols, cfg.colGroup));
    res.colsCut = colKeys.length > MAX_COLKEYS ? colKeys.length : 0;
    if (res.colsCut) colKeys = colKeys.slice(0, MAX_COLKEYS);
    var lab = compareKeys(cfg.rows, cfg.rowGroup);
    var tot = function (k) { var x = value(rowAcc.get(k)); return x === x ? x : -Infinity; };
    res.allRows = rowKeys.length;
    if (cfg.top) { rowKeys.sort(function (a, b) { return tot(b) - tot(a) || lab(a, b); }); rowKeys = rowKeys.slice(0, cfg.top); }
    if (cfg.sort === 'desc') rowKeys.sort(function (a, b) { return tot(b) - tot(a) || lab(a, b); });
    else if (cfg.sort === 'asc') rowKeys.sort(function (a, b) { return tot(a) - tot(b) || lab(a, b); });
    else rowKeys.sort(lab);
    res.rowKeys = rowKeys; res.colKeys = colKeys;
    return res;
  }
  function value(acc) {
    if (!acc) return NaN;
    switch (S.cfg.agg) {
      case 'sum': return acc.k ? acc.sum : (acc.rows ? 0 : NaN);
      case 'count': return acc.rows;
      case 'avg': return acc.k ? acc.sum / acc.k : NaN;
      case 'min': return acc.k ? acc.min : NaN;
      case 'max': return acc.k ? acc.max : NaN;
      case 'distinct': return acc.set ? acc.set.size : 0;
    }
    return NaN;
  }
  function shown(v, rowTot, colTot, grandTot) {
    var s = S.cfg.show;
    if (s === 'value' || v !== v) return v;
    var base = s === 'pct_total' ? grandTot : s === 'pct_row' ? rowTot : colTot;
    return base ? v / base * 100 : NaN;
  }
  function fmtCell(v) {
    if (v !== v || v === undefined) return '';
    if (S.cfg.show !== 'value') return EDU.fmt(v, { maximumFractionDigits: 1 }) + '%';
    if (S.cfg.lakh) {
      var a = Math.abs(v), sg = v < 0 ? '-' : '';
      if (a >= 1e7) return sg + EDU.fmt(a / 1e7, { maximumFractionDigits: 2 }) + ' ' + EDU.t('crore');
      if (a >= 1e5) return sg + EDU.fmt(a / 1e5, { maximumFractionDigits: 2 }) + ' ' + EDU.t('lakh');
    }
    return EDU.fmt(v, { maximumFractionDigits: 2 });
  }

  /* ---------- output: table ---------- */
  function cellVal(res, a, b) { var row = res.cells.get(a); return value(row && row.get(b)); }
  function grid(res) {
    /* matrix of shown numbers incl. totals: {rows:[{key, cells:[], total}], colTotals:[], grand} */
    var cfg = S.cfg, hasCols = cfg.cols >= 0, gv = value(res.grand), out = { rows: [], colTotals: [], grand: shown(gv, gv, gv, gv) };
    var colTotRaw = res.colKeys.map(function (b) { return value(res.colAcc.get(b)); });
    res.rowKeys.forEach(function (a) {
      var rt = value(res.rowAcc.get(a));
      out.rows.push({ key: a, cells: hasCols ? res.colKeys.map(function (b, j) { return shown(cellVal(res, a, b), rt, colTotRaw[j], gv); }) : [], total: shown(rt, rt, gv, gv), rawTotal: rt });
    });
    out.colTotals = colTotRaw.map(function (ct) { return shown(ct, gv, ct, gv); });
    return out;
  }
  function valueTitle() {
    var cfg = S.cfg, aggName = EDU.t('agg_' + cfg.agg);
    var what = cfg.val >= 0 ? colName(cfg.val) : EDU.t('rows_word');
    var s = EDU.t('title_fmt', { agg: aggName, val: what, rows: colName(cfg.rows) });
    if (cfg.cols >= 0) s += ' ' + EDU.t('title_cols', { cols: colName(cfg.cols) });
    if (cfg.show !== 'value') s += ' (' + EDU.t('show_' + cfg.show) + ')';
    return s;
  }
  function renderTable() {
    var cfg = S.cfg, res = S.result, g = grid(res), hasCols = cfg.cols >= 0, table = EDU.$('#ptable');
    table.textContent = '';
    EDU.$('#h-out').textContent = valueTitle();
    var hr = EDU.el('tr', {}, EDU.el('th', { class: 'corner no-i18n', scope: 'col', text: colName(cfg.rows) + (hasCols ? ' ↓ / ' + colName(cfg.cols) + ' →' : '') }));
    if (hasCols) res.colKeys.forEach(function (b) { hr.appendChild(EDU.el('th', { scope: 'col', class: b === BLANK ? 'blank' : 'no-i18n', text: keyLabel(b, cfg.cols, cfg.colGroup) })); });
    hr.appendChild(EDU.el('th', { scope: 'col', class: 'tot', text: hasCols ? EDU.t('grand_total') : (cfg.show === 'value' ? EDU.t('agg_' + cfg.agg) : EDU.t('show_' + cfg.show)) }));
    table.appendChild(EDU.el('thead', {}, hr));
    var tb = EDU.el('tbody'), shownRows = g.rows.slice(0, MAX_SHOW_ROWS);
    shownRows.forEach(function (row) {
      var lab = keyLabel(row.key, cfg.rows, cfg.rowGroup);
      var tr = EDU.el('tr', {}, EDU.el('th', { scope: 'row', class: row.key === BLANK ? 'blank' : 'no-i18n', text: lab, title: lab }));
      row.cells.forEach(function (v) { tr.appendChild(EDU.el('td', { text: fmtCell(v), dataset: { v: v === v ? String(v) : '' } })); });
      tr.appendChild(EDU.el('td', { class: 'tot', text: fmtCell(row.total), dataset: { v: row.total === row.total ? String(row.total) : '', role: 'rowtotal' } }));
      tb.appendChild(tr);
    });
    table.appendChild(tb);
    var fr = EDU.el('tr', {}, EDU.el('th', { scope: 'row', text: EDU.t('grand_total') }));
    if (hasCols) g.colTotals.forEach(function (v) { fr.appendChild(EDU.el('td', { text: fmtCell(v), dataset: { v: v === v ? String(v) : '', role: 'coltotal' } })); });
    fr.appendChild(EDU.el('td', { text: fmtCell(g.grand), dataset: { v: g.grand === g.grand ? String(g.grand) : '', role: 'grand' } }));
    table.appendChild(EDU.el('tfoot', {}, fr));

    var notes = EDU.$('#notes'); notes.textContent = '';
    function note(t) { notes.appendChild(EDU.el('p', { text: t })); }
    note(EDU.t('used_rows', { n: EDU.fmt(res.used), all: EDU.fmt(S.ds.n) }));
    var skipped = res.skippedText + res.skippedBlank;
    if (cfg.val >= 0 && skipped && cfg.agg !== 'count' && cfg.agg !== 'distinct') note(EDU.t('skipped_note', { n: EDU.fmt(skipped), text: EDU.fmt(res.skippedText), blank: EDU.fmt(res.skippedBlank), col: colName(cfg.val) }));
    if (cfg.top && res.allRows > cfg.top) note(EDU.t('top_note', { n: cfg.top, all: EDU.fmt(res.allRows) }));
    if (res.colsCut) note(EDU.t('cols_cut', { n: MAX_COLKEYS, all: EDU.fmt(res.colsCut) }));
    if (g.rows.length > MAX_SHOW_ROWS) note(EDU.t('rows_cut', { n: EDU.fmt(MAX_SHOW_ROWS), all: EDU.fmt(g.rows.length) }));
    if ((cfg.agg === 'avg' || cfg.agg === 'min' || cfg.agg === 'max') && cfg.show !== 'value') note(EDU.t('pct_odd'));
  }

  /* ---------- output: bar chart (SVG with theme colours via CSS variables) ---------- */
  function renderChart() {
    var cfg = S.cfg, res = S.result, g = grid(res), box = EDU.$('#chart'); box.textContent = '';
    var rows = g.rows.filter(function (r) { return r.total === r.total; }).slice(0, 25);
    if (!rows.length) { box.appendChild(EDU.el('p', { class: 'muted', text: EDU.t('chart_none') })); return; }
    var stackable = cfg.cols >= 0 && cfg.show !== 'pct_row' && (cfg.agg === 'sum' || cfg.agg === 'count') && cfg.show === 'value' && res.colKeys.length <= 8;
    var W = 760, rowH = 30, top = 10, labW = 190, valW = 110, H = top + rows.length * rowH + 30;
    var lo = 0, hi = 0;
    rows.forEach(function (r) { if (r.total > hi) hi = r.total; if (r.total < lo) lo = r.total; });
    var ticks = D.niceTicks(lo, hi, 5), t0 = ticks[0], t1 = ticks[ticks.length - 1], x0 = labW + 8, x1 = W - valW;
    var X = function (v) { return x0 + (v - t0) / (t1 - t0) * (x1 - x0); };
    var out = ['<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" role="img" font-size="14" direction="ltr" aria-label="' + EDU.esc(valueTitle()) + '">'];
    ticks.forEach(function (v) { out.push('<line class="gridl" x1="' + X(v) + '" x2="' + X(v) + '" y1="' + top + '" y2="' + (H - 24) + '"/><text class="muted-t" x="' + X(v) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="12">' + EDU.esc(fmtCell(v)) + '</text>'); });
    var mctx = document.createElement('canvas').getContext('2d'); mctx.font = '14px sans-serif';
    function fit(s) { s = String(s); if (mctx.measureText(s).width <= labW - 6) return s; while (s.length > 1 && mctx.measureText(s + '…').width > labW - 6) s = s.slice(0, -1); return s + '…'; }
    rows.forEach(function (r, i) {
      var y = top + i * rowH, lab = keyLabel(r.key, cfg.rows, cfg.rowGroup);
      out.push('<text class="bar-label" x="' + labW + '" y="' + (y + 19) + '" text-anchor="end">' + EDU.esc(fit(lab)) + '</text>');
      if (stackable) {
        var acc = 0;
        res.colKeys.forEach(function (b, j) {
          var v = cellVal(res, r.key, b); if (!(v > 0)) return;
          var xa = X(acc), xb = X(acc + v); acc += v;
          out.push('<rect class="pv-bar" x="' + xa.toFixed(1) + '" y="' + (y + 4) + '" width="' + Math.max(0.5, xb - xa).toFixed(1) + '" height="' + (rowH - 8) + '" style="fill:var(--c' + (j % 8 + 1) + ')"><title>' + EDU.esc(lab + ' · ' + keyLabel(b, cfg.cols, cfg.colGroup) + ': ' + fmtCell(v)) + '</title></rect>');
        });
      } else {
        var z = X(Math.max(t0, Math.min(t1, 0))), xv = X(r.total);
        out.push('<rect class="pv-bar" x="' + Math.min(z, xv).toFixed(1) + '" y="' + (y + 4) + '" width="' + Math.max(0.5, Math.abs(xv - z)).toFixed(1) + '" height="' + (rowH - 8) + '" rx="3" style="fill:var(--c1)"><title>' + EDU.esc(lab + ': ' + fmtCell(r.total)) + '</title></rect>');
      }
      out.push('<text class="bar-label" x="' + (X(Math.max(r.total, 0)) + 6).toFixed(1) + '" y="' + (y + 19) + '" font-weight="700">' + EDU.esc(fmtCell(r.total)) + '</text>');
    });
    out.push('</svg>');
    var wrap = EDU.el('div', { class: 'no-i18n' }); wrap.innerHTML = out.join('');
    box.appendChild(wrap);
    if (stackable && res.colKeys.length > 1) {
      var leg = EDU.el('div', { class: 'pv-legend' });
      res.colKeys.forEach(function (b, j) { leg.appendChild(EDU.el('span', { class: b === BLANK ? '' : 'no-i18n' }, EDU.el('i', { style: { background: 'var(--c' + (j % 8 + 1) + ')' } }), keyLabel(b, cfg.cols, cfg.colGroup))); });
      box.appendChild(leg);
    }
    if (g.rows.length > 25) box.appendChild(EDU.el('p', { class: 'small muted mb0', text: EDU.t('chart_top', { n: 25 }) }));
  }

  /* ---------- export ---------- */
  function tableRows(forCopy) {
    var cfg = S.cfg, res = S.result, g = grid(res), hasCols = cfg.cols >= 0;
    var num = function (v) { if (v !== v) return ''; var x = Math.round(v * 100) / 100; return cfg.show !== 'value' ? x + '%' : String(x); };
    var head = [colName(cfg.rows)];
    if (hasCols) res.colKeys.forEach(function (b) { head.push(keyLabel(b, cfg.cols, cfg.colGroup)); });
    head.push(hasCols ? EDU.t('grand_total') : valueTitle());
    var rows = [head];
    g.rows.forEach(function (r) { var line = [keyLabel(r.key, cfg.rows, cfg.rowGroup)]; r.cells.forEach(function (v) { line.push(num(v)); }); line.push(num(r.total)); rows.push(line); });
    var foot = [EDU.t('grand_total')]; g.colTotals.forEach(function (v) { if (hasCols) foot.push(num(v)); }); foot.push(num(g.grand)); rows.push(foot);
    return rows;
  }
  EDU.$('#export').addEventListener('click', function () { if (S.result) EDU.download('pivot.csv', D.toCSV(tableRows()), 'text/csv'); });
  EDU.$('#copy').addEventListener('click', function () { if (S.result) EDU.copy(D.toTSV(tableRows(true))); });

  /* ---------- controls ---------- */
  function opt(sel, value, text, i18n) { var o = EDU.el('option', { value: value, text: text }); if (i18n) o.className = ''; sel.appendChild(o); }
  function fillFieldSelect(sel, allowNone, noneKey, filterFn) {
    sel.textContent = '';
    if (allowNone) opt(sel, -1, EDU.t(noneKey));
    for (var c = 0; c < S.ds.width; c++) if (!filterFn || filterFn(c)) opt(sel, c, colName(c));
  }
  function fillSimple(sel, list, prefix) { sel.textContent = ''; list.forEach(function (v) { opt(sel, v, EDU.t(prefix + v)); }); }
  function renderControls() {
    var cfg = S.cfg, ds = S.ds;
    fillFieldSelect(EDU.$('#f-rows'), false); EDU.$('#f-rows').value = cfg.rows;
    fillFieldSelect(EDU.$('#f-cols'), true, 'none_field', function (c) { return c !== cfg.rows; }); EDU.$('#f-cols').value = cfg.cols;
    fillFieldSelect(EDU.$('#f-val'), true, 'count_rows'); EDU.$('#f-val').value = cfg.val;
    var aggSel = EDU.$('#f-agg'); aggSel.textContent = '';
    var numeric = cfg.val >= 0 && ds.types[cfg.val] === 'number';
    AGGS.forEach(function (a) {
      if (cfg.val < 0 && a !== 'count') return;
      if (!numeric && cfg.val >= 0 && a !== 'count' && a !== 'distinct') return;
      opt(aggSel, a, EDU.t('agg_' + a));
    });
    aggSel.value = cfg.agg;
    fillSimple(EDU.$('#f-show'), SHOWS, 'show_'); EDU.$('#f-show').value = cfg.show;
    Array.prototype.forEach.call(EDU.$('#f-show').options, function (o) { o.disabled = cfg.cols < 0 && (o.value === 'pct_row'); });
    fillSimple(EDU.$('#f-sort'), SORTS, 'sort_'); EDU.$('#f-sort').value = cfg.sort;
    var top = EDU.$('#f-top'); top.textContent = ''; TOPS.forEach(function (n) { opt(top, n, n ? EDU.t('top_n', { n: n }) : EDU.t('top_all')); }); top.value = cfg.top;
    EDU.$('#f-lakh').checked = !!cfg.lakh;
    [['rows', 'g-rows'], ['cols', 'g-cols']].forEach(function (p) {
      var c = cfg[p[0]], isDate = c >= 0 && ds.types[c] === 'date';
      EDU.$('#' + p[1] + '-wrap').hidden = !isDate;
      fillSimple(EDU.$('#' + p[1]), GROUPS, 'group_'); EDU.$('#' + p[1]).value = cfg[p[0] === 'rows' ? 'rowGroup' : 'colGroup'];
    });
    fillFieldSelect(EDU.$('#f-filter'), false);
    renderFilterChips();
  }
  function fixCfg() {
    var cfg = S.cfg, ds = S.ds, numeric = cfg.val >= 0 && ds.types[cfg.val] === 'number';
    if (cfg.rows >= ds.width) cfg.rows = 0;
    if (cfg.cols >= ds.width || cfg.cols === cfg.rows) cfg.cols = -1;
    if (cfg.val >= ds.width) cfg.val = -1;
    if (cfg.val < 0) cfg.agg = 'count';
    else if (!numeric && cfg.agg !== 'count' && cfg.agg !== 'distinct') cfg.agg = 'count';
    if (cfg.cols < 0 && cfg.show === 'pct_row') cfg.show = 'value';
    if (ds.types[cfg.rows] !== 'date') cfg.rowGroup = 'none';
    if (cfg.cols < 0 || ds.types[cfg.cols] !== 'date') cfg.colGroup = 'none';
    if (GROUPS.indexOf(cfg.rowGroup) < 0) cfg.rowGroup = 'none';
  }
  function changed() { fixCfg(); store.set('cfg', S.cfg); renderControls(); recompute(); }
  [['#f-rows', 'rows', true], ['#f-cols', 'cols', true], ['#f-val', 'val', true], ['#f-agg', 'agg'], ['#f-show', 'show'], ['#f-sort', 'sort'], ['#f-top', 'top', true], ['#g-rows', 'rowGroup'], ['#g-cols', 'colGroup']].forEach(function (p) {
    EDU.$(p[0]).addEventListener('change', function () {
      var v = this.value; S.cfg[p[1]] = p[2] ? +v : v;
      if (p[1] === 'val' && S.cfg.val >= 0 && S.ds.types[S.cfg.val] === 'number' && S.cfg.agg === 'count') S.cfg.agg = 'sum';
      if ((p[1] === 'rows' || p[1] === 'cols') && S.ds.types[S.cfg[p[1]]] === 'date') S.cfg[p[1] === 'rows' ? 'rowGroup' : 'colGroup'] = 'month';
      changed();
    });
  });
  EDU.$('#f-lakh').addEventListener('change', function () { S.cfg.lakh = this.checked; changed(); });

  /* filters */
  function filterValues(c) {
    var kf = keyFn(c, 'none'), counts = new Map();
    for (var r = 0; r < S.ds.n; r++) { var k = kf(r); counts.set(k, (counts.get(k) || 0) + 1); }
    var keys = Array.from(counts.keys()); keys.sort(compareKeys(c, 'none'));
    return { keys: keys, counts: counts };
  }
  function editFilter(c) {
    var fv = filterValues(c), cur = S.cfg.filters[c] ? new Set(S.cfg.filters[c]) : null;
    if (fv.keys.length > MAX_FILTER_VALUES) { EDU.toast(EDU.t('filter_too_many', { n: EDU.fmt(fv.keys.length) })); return; }
    var wrap = EDU.el('div'), list = EDU.el('div', { class: 'pv-vallist' }), boxes = [];
    fv.keys.forEach(function (k) {
      var cb = EDU.el('input', { type: 'checkbox', checked: !cur || cur.has(k) });
      boxes.push([cb, k]);
      list.appendChild(EDU.el('label', { class: 'check' }, cb, EDU.el('span', { class: k === BLANK ? '' : 'no-i18n', text: keyLabel(k, c, 'none') + ' (' + EDU.fmt(fv.counts.get(k)) + ')' })));
    });
    wrap.appendChild(EDU.el('div', { class: 'pv-vals' },
      EDU.el('button', { type: 'button', class: 'btn btn-sm', text: EDU.t('all'), onclick: function () { boxes.forEach(function (b) { b[0].checked = true; }); } }),
      EDU.el('button', { type: 'button', class: 'btn btn-sm', text: EDU.t('none'), onclick: function () { boxes.forEach(function (b) { b[0].checked = false; }); } })));
    wrap.appendChild(list);
    var close;
    wrap.appendChild(EDU.el('div', { class: 'row' },
      EDU.el('button', { type: 'button', class: 'btn btn-primary', id: 'filter-apply', text: EDU.t('apply'), onclick: function () {
        var keep = boxes.filter(function (b) { return b[0].checked; }).map(function (b) { return b[1]; });
        if (keep.length === boxes.length) delete S.cfg.filters[c]; else S.cfg.filters[c] = keep;
        close(); changed();
      } }),
      EDU.el('button', { type: 'button', class: 'btn', text: EDU.t('cancel'), onclick: function () { close(); } })));
    close = EDU.modal(wrap, { title: EDU.t('filter_title', { col: colName(c) }) });
  }
  function renderFilterChips() {
    var box = EDU.$('#fchips'); box.textContent = '';
    var keys = Object.keys(S.cfg.filters);
    if (!keys.length) { box.appendChild(EDU.el('span', { class: 'muted small', text: EDU.t('no_filters') })); return; }
    keys.forEach(function (fc) {
      var c = +fc, f = S.cfg.filters[fc], total = filterValues(c).keys.length;
      var lab = colName(c) + ': ' + EDU.t('n_of_m', { n: f.length, m: total });
      box.appendChild(EDU.el('span', { class: 'chip pv-chip' },
        EDU.el('span', { class: 'lab no-i18n', text: lab, title: EDU.t('edit'), role: 'button', tabindex: '0', onclick: function () { editFilter(c); }, onkeydown: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); editFilter(c); } } }),
        EDU.el('button', { type: 'button', 'aria-label': EDU.t('remove_filter'), text: '×', onclick: function () { delete S.cfg.filters[fc]; changed(); } })));
    });
  }
  EDU.$('#filter-add').addEventListener('click', function () { editFilter(+EDU.$('#f-filter').value); });

  /* ---------- "what is a pivot table" worked example ---------- */
  function renderWhat() {
    var v = V(), R = v.regions, H = v.h, data = [[0, 500], [1, 300], [0, 200], [2, 400], [1, 100], [0, 100]];
    var box = EDU.$('#what-ex'); box.textContent = '';
    var t1 = EDU.el('table', { class: 'table' }, EDU.el('thead', {}, EDU.el('tr', {}, EDU.el('th', { text: H.region }), EDU.el('th', { class: 'n', text: H.amount }))));
    var b1 = EDU.el('tbody'); data.forEach(function (d) { b1.appendChild(EDU.el('tr', {}, EDU.el('td', { text: R[d[0]] }), EDU.el('td', { class: 'n', text: EDU.fmt(d[1]) }))); }); t1.appendChild(b1);
    var sums = [0, 0, 0]; data.forEach(function (d) { sums[d[0]] += d[1]; });
    var t2 = EDU.el('table', { class: 'table' }, EDU.el('thead', {}, EDU.el('tr', {}, EDU.el('th', { text: H.region }), EDU.el('th', { class: 'n', text: EDU.t('agg_sum') }))));
    var b2 = EDU.el('tbody');
    [0, 1, 2].forEach(function (k) {
      var parts = data.filter(function (d) { return d[0] === k; }).map(function (d) { return EDU.fmt(d[1]); }).join(' + ');
      b2.appendChild(EDU.el('tr', {}, EDU.el('td', { text: R[k] }), EDU.el('td', { class: 'n' }, EDU.el('span', { class: 'muted small', text: parts + ' = ' }), EDU.el('b', { text: EDU.fmt(sums[k]) }))));
    });
    b2.appendChild(EDU.el('tr', {}, EDU.el('th', { text: EDU.t('grand_total') }), EDU.el('td', { class: 'n' }, EDU.el('b', { text: EDU.fmt(sums[0] + sums[1] + sums[2]) }))));
    t2.appendChild(b2);
    box.appendChild(t1); box.appendChild(EDU.el('div', { class: 'arrow', 'aria-hidden': 'true', text: '➜' })); box.appendChild(t2);
  }

  /* ---------- render ---------- */
  function renderDsLine() {
    var el = EDU.$('#dsline');
    if (!S.ds) { el.textContent = ''; return; }
    var name = S.src && S.src.kind === 'sample' ? EDU.t('sample_' + S.src.id) : (S.src && S.src.name) || EDU.t('pasted_data');
    el.textContent = EDU.t('ds_line', { name: name, rows: EDU.fmt(S.ds.n), cols: EDU.fmt(S.ds.width) });
    el.classList.toggle('no-i18n', !(S.src && S.src.kind === 'sample'));
    EDU.$$('[data-sample]').forEach(function (b) { b.setAttribute('aria-pressed', S.src && S.src.kind === 'sample' && S.src.id === b.dataset.sample ? 'true' : 'false'); });
  }
  function recompute() {
    var t0 = performance.now();
    S.result = compute();
    renderTable(); renderChart();
    S.lastMs = performance.now() - t0;
  }
  function renderAll() {
    EDU.$('#work').hidden = !S.ds;
    renderWhat(); renderDsLine();
    if (!S.ds) return;
    fixCfg(); renderControls(); recompute();
  }

  /* ---------- events ---------- */
  EDU.$('#open').addEventListener('click', function () { EDU.pickFile('.csv,.tsv,.txt,text/csv,text/plain').then(loadFile); });
  EDU.$('#paste-btn').addEventListener('click', function () {
    var box = EDU.$('#paste-box'), open = box.hidden; box.hidden = !open; this.setAttribute('aria-expanded', open ? 'true' : 'false'); if (open) EDU.$('#paste').focus();
  });
  EDU.$('#paste-use').addEventListener('click', function () { loadText(EDU.$('#paste').value, ''); });
  EDU.$$('[data-sample]').forEach(function (b) { b.addEventListener('click', function () { loadSample(b.dataset.sample); }); });
  var drop = EDU.$('#drop');
  function hasFiles(e) { return e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0; }
  document.addEventListener('dragover', function (e) { if (hasFiles(e)) { e.preventDefault(); drop.classList.add('over'); } });
  document.addEventListener('dragleave', function (e) { if (!e.relatedTarget) drop.classList.remove('over'); });
  document.addEventListener('drop', function (e) { if (!hasFiles(e)) return; e.preventDefault(); drop.classList.remove('over'); loadFile(e.dataTransfer.files[0]); });
  EDU.$('#reset').addEventListener('click', function () {
    if (!confirm(EDU.t('confirm_reset'))) return;
    store.remove('src'); store.remove('cfg'); EDU.$('#paste').value = ''; loadSample('sales');
  });
  EDU.onLang(function () { if (S.src && S.src.kind === 'sample') loadSample(S.src.id, true); else renderAll(); });

  /* ---------- start ---------- */
  var saved = store.get('src', null), savedCfg = store.get('cfg', null);
  if (saved && saved.kind === 'text' && saved.text) {
    var ds0 = null; try { ds0 = D.load(saved.text); } catch (e) { ds0 = null; }
    if (ds0 && ds0.n) { S.ds = ds0; S.src = saved; S.cfg = Object.assign(baseCfg(), savedCfg || guessCfg(ds0)); renderAll(); }
    else loadSample('sales');
  } else if (saved && saved.kind === 'sample' && SAMPLE_CFG[saved.id]) {
    S.ds = D.sample(saved.id, V()); S.src = saved; S.cfg = Object.assign(baseCfg(), savedCfg || SAMPLE_CFG[saved.id]); renderAll();
  } else loadSample('sales');

  window.__pv = S;
})();
