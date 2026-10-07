/* Data Cleaning Lab: load a messy CSV, build a cleaning recipe step by step, see before/after quality, export. */
(function () {
  'use strict';
  var D = window.DCL;
  var SLUG = 'data-cleaning-lab';
  var store = EDU.store(SLUG);
  var PAGE = 100, MAX_SAVE = 1000000;
  var t = EDU.t, $ = EDU.$, el = EDU.el;

  EDU.init({ slug: SLUG, title: 'app_title', wide: true, waKey: 'shell_wa_tool' });

  /* ---------------- state ---------------- */
  var S = {
    orig: { headers: [], rows: [] },   /* the loaded file, never changed */
    meta: { source: 'sample', name: '' },
    recipe: store.get('recipe', []).map(D.cleanStep).filter(Boolean),
    history: [],
    view: store.get('view', 'clean'), filter: 'all', page: 0,
    out: null, qBefore: null, qAfter: null, typesBefore: [], okAfter: [], okBefore: [], idx: null
  };

  /* ---------------- the messy sample ---------------- */
  var MAILS = ['priya.sharma', 'rahul.verma', 'ananya.iyer', 'arif.mohd', 'kavita.patil', 'suresh.reddy', 'fatima.khan', 'arjun.nair', 'meena.das',
    'harpreet.singh', 'lakshmi.menon', 'vikram.joshi', 'sneha.ghosh', 'imran.shaikh', 'deepa.rao', 'manoj.yadav', 'pooja.mehta', 'ravi.kumar'];
  var DOMAINS = ['gmail.com', 'yahoo.in', 'rediffmail.com', 'outlook.com'];
  var PHONES = ['+91 98765 43210', '09812345678', '98200-11223', '+91-9123456780', '919988776655', '8899001122', '12345', '', '+91 70123 45678',
    '(0) 9445566778', '96 1122 3344', 'N/A', '9001234567', '+91 6300 112 233', '0 81234 56789', '9988 7766 55', '7012345', '+91 9898989898'];
  var DATES = ['5/3/2026', '2026-01-14', '12 Jan 2026', '07.02.26', '18/11/2025', '2025-12-01', 'March 9, 2026', '23.08.25', '1/1/2026', '',
    '05 Oct 2025', '2026-02-28', '31/02/2026', '15-06-2025', '2025-07-04', '9 Sept 2025', '30.09.25', '46000'];
  var AMOUNTS = ['₹1,20,000', '1.2 lakh', 'Rs. 4500', '4,500', '2500/-', 'N/A', '₹ 75,000.50', '15000', '2.5k', '', 'INR 3,200', '₹999',
    '12,500.00', '1 lakh', '(500)', '₹ 8,000 /-', 'Rs 650', 'five hundred'];
  function sampleTable(lang) {
    var C = (window.APP_CONTENT || {})[lang] || window.APP_CONTENT.en;
    var rows = [];
    for (var i = 0; i < 18; i++) {
      var name = C.names[i];
      if (i % 5 === 0) name = '  ' + name + '  ';
      else if (i % 5 === 1) name = name.toLowerCase();
      else if (i % 5 === 2) name = name.toUpperCase();
      else if (i % 5 === 3) name = name.replace(' ', '   ');
      var city = C.cities[i % 8];
      if (i === 9) city = ''; else if (i === 14) city = 'N/A'; else if (i % 3 === 1) city = city + ' ';
      var mail = MAILS[i] + '@' + DOMAINS[i % 4];
      if (i % 4 === 1) mail = mail.charAt(0).toUpperCase() + mail.slice(1).replace('@g', '@G').replace('@y', '@Y');
      else if (i % 4 === 3) mail = mail.toUpperCase();
      if (i === 6) mail = 'fatima.khan@gmail'; else if (i === 15) mail = '';
      if (i === 10) mail = ' ' + mail;
      rows.push(['C' + (101 + i), name, PHONES[i], city, DATES[i], AMOUNTS[i], mail]);
    }
    /* three exact copies and one copy with different spaces / capitals */
    rows.push(rows[2].slice(), rows[7].slice(), rows[11].slice());
    var near = rows[4].slice(); near[1] = ' ' + near[1].replace(' ', '  '); near[6] = near[6].toUpperCase();
    rows.push(near);
    return { headers: C.headers.slice(), rows: rows };
  }

  /* ---------------- loading data ---------------- */
  function setData(table, meta, keepRecipe) {
    S.orig = table; S.meta = meta; S.page = 0; S.filter = 'all';
    if (!keepRecipe) { S.recipe = []; S.history = []; }
    var save = { source: meta.source, name: meta.name };
    if (meta.source !== 'sample') { if (meta.text && meta.text.length <= MAX_SAVE) save.text = meta.text; else save.big = true; }
    store.set('data', save);
    analyseBefore();
    rerun();
    renderStepForm();
  }
  function loadSample() { setData(sampleTable(EDU.lang), { source: 'sample', name: '' }, false); }
  function loadText(text, name, source) {
    var tbl;
    try { tbl = D.toTable(EDU.csv.parse(text, D.detectDelim(text))); } catch (e) { tbl = null; }
    if (!tbl || !tbl.headers.length || !tbl.rows.length) { EDU.toast(t('err_empty')); return false; }
    var keep = S.recipe.length > 0;
    setData(tbl, { source: source, name: name || '', text: text }, keep);
    if (keep) EDU.toast(t('recipe_kept', { n: S.recipe.length }));
    if (text.length > MAX_SAVE) EDU.toast(t('big_note'));
    return true;
  }
  function loadFile(file) {
    if (!file) return;
    if (/\.json$/i.test(file.name)) { EDU.readText(file).then(importRecipeText).catch(function () { EDU.toast(t('err_file')); }); return; }
    if (/\.(xlsx?|ods|pdf|docx?)$/i.test(file.name)) { EDU.toast(t('err_excel')); return; }
    setBusy(true);
    EDU.readText(file).then(function (text) {
      setTimeout(function () { loadText(text, file.name.replace(/\.[^.]+$/, ''), 'file'); setBusy(false); }, 30);
    }).catch(function () { setBusy(false); EDU.toast(t('err_file')); });
  }
  function setBusy(on) { $('#busy').hidden = !on; }

  /* ---------------- analysis ---------------- */
  function analyseBefore() {
    S.qBefore = D.quality(S.orig);
    S.typesBefore = S.qBefore.per.map(function (p) { return p.type; });
    S.okBefore = S.qBefore.per.map(function (p, c) {
      return D.validator(p.type, S.orig.rows.map(function (r) { return r[c]; }));
    });
  }
  function rerun() {
    S.out = D.run(S.orig, S.recipe);
    var types = {};
    S.out.srcCol.forEach(function (sc, c) { if (sc >= 0) types[S.out.table.headers[c]] = S.typesBefore[sc]; });
    S.qAfter = D.quality(S.out.table, types);
    S.okAfter = S.qAfter.per.map(function (p, c) { return D.validator(p.type, S.out.table.rows.map(function (r) { return r[c]; })); });
    S.changed = D.countChanged(S.orig, S.out);
    S.idx = null;
    store.set('recipe', S.recipe);
    renderInfo(); renderQuality(); renderRecipe(); renderTable();
  }

  /* ---------------- recipe editing ---------------- */
  function snapshot() { S.history.push(JSON.stringify(S.recipe)); if (S.history.length > 60) S.history.shift(); }
  function addSteps(list) { snapshot(); list.forEach(function (s) { s.on = true; S.recipe.push(s); }); S.page = 0; rerun(); renderStepForm(); }
  function undo() {
    if (!S.history.length) return;
    S.recipe = JSON.parse(S.history.pop()); rerun(); renderStepForm();
  }

  function colNames() { return S.out ? S.out.table.headers.slice() : S.orig.headers.slice(); }
  function quote(s) { return '"' + s + '"'; }
  function list(a) { return (a || []).map(quote).join(', '); }
  var CASES = { title: 'case_title', upper: 'case_upper', lower: 'case_lower', sentence: 'case_sentence' };
  var FILLS = { value: 'fill_value', prev: 'fill_prev', mean: 'fill_mean', median: 'fill_median', blank: 'fill_blank', drop: 'fill_drop' };
  var SEPS = ['comma', 'space', 'semicolon', 'hyphen', 'slash', 'pipe', 'at', 'dot'];
  function sepLabel(code) { return SEPS.indexOf(code) >= 0 ? t('sep_' + code) : quote(code); }
  function describe(s) {
    var c = quote(s.col || '');
    switch (s.type) {
      case 'trim': return s.cols && s.cols.length ? t('d_trim', { cols: list(s.cols) }) : t('d_trim_all');
      case 'case': return t('d_case', { col: c, mode: t(CASES[s.mode] || 'case_title') });
      case 'dedupe': return t((s.by && s.by.length ? 'd_dedupe_by' : 'd_dedupe_row') + (s.loose !== false ? '_loose' : ''), { cols: list(s.by) });
      case 'fill': return s.how === 'value' ? t('d_fill_value', { col: c, value: s.value || '' }) : t('d_fill', { col: c, how: t(FILLS[s.how] || 'fill_blank') });
      case 'date': return t('d_date', { col: c, to: t(s.to === 'ymd' ? 'to_ymd' : 'to_dmy') });
      case 'phone': return t('d_phone', { col: c });
      case 'money': return t('d_money', { col: c });
      case 'split': return t('d_split', { col: c, sep: sepLabel(s.sep) });
      case 'merge': return t('d_merge', { cols: list(s.cols), name: quote(s.name || '') });
      case 'replace': return s.col ? t('d_replace', { col: c, find: s.find || '', repl: s.repl || '' }) : t('d_replace_all', { find: s.find || '', repl: s.repl || '' });
      case 'rename': return t('d_rename', { col: c, to: quote(s.to || '') });
      case 'del': return t('d_del', { cols: list(s.cols) });
    }
    return s.type;
  }
  function resultText(s, r) {
    if (!s.on) return [t('r_off'), 'muted'];
    if (!r) return ['', ''];
    if (r.err === 'nocol') return [t('r_nocol', { col: r.col }), 'danger'];
    if (r.err) return [t('r_fail'), 'danger'];
    if (r.nonum) return [t('r_nonum'), 'danger'];
    var parts = [];
    if (r.removed !== undefined) parts.push(t('r_removed', { n: EDU.fmt(r.removed) }));
    if (r.n !== undefined) parts.push(t('r_changed', { n: EDU.fmt(r.n) }));
    if (r.added) parts.push(t('r_added', { n: EDU.fmt(r.added) }));
    if (r.renamed) parts.push(t('r_renamed'));
    if (r.deleted) parts.push(t('r_deleted', { n: EDU.fmt(r.deleted) }));
    if (r.bad) parts.push(t('r_bad', { n: EDU.fmt(r.bad) }));
    if (r.filled !== undefined && r.filled !== null && r.filled !== '' && (s.how === 'mean' || s.how === 'median')) parts.push(t('r_filled', { v: r.filled }));
    return [parts.join(' · '), r.bad ? 'warning' : 'success'];
  }

  /* ---------------- step form ---------------- */
  var FORM = {};   /* current form getters */
  function fieldSel(id, labelKey, opts, value) {
    var s = el('select', { id: id });
    opts.forEach(function (o) { var op = el('option', { value: o[0], text: o[1] }); if (o[2]) op.className = 'no-i18n'; s.appendChild(op); });
    if (value !== undefined) s.value = value;
    return el('label', { class: 'field' }, el('span', { text: t(labelKey) }), s);
  }
  function colOpts(withAll) {
    var o = withAll ? [['', t('p_all_cols')]] : [];
    colNames().forEach(function (n) { o.push([n, n, true]); });
    return o;
  }
  function chipPicker(id, labelKey, preset) {
    var box = el('div', { class: 'dc-chips no-i18n', id: id, role: 'group' });
    colNames().forEach(function (n) {
      box.appendChild(el('button', { type: 'button', class: 'chip', 'aria-pressed': preset && preset.indexOf(n) >= 0 ? 'true' : 'false', text: n, dataset: { col: n },
        onclick: function (e) { var b = e.currentTarget; b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); } }));
    });
    return el('div', { class: 'field dc-wide' }, el('span', { text: t(labelKey) }), box);
  }
  function picked(id) { return EDU.$$('#' + id + ' .chip[aria-pressed="true"]').map(function (b) { return b.dataset.col; }); }
  function textField(id, labelKey, value, ph) {
    return el('label', { class: 'field' }, el('span', { text: t(labelKey) }), el('input', { id: id, type: 'text', value: value || '', placeholder: ph || '', class: 'no-i18n', autocomplete: 'off' }));
  }
  function checkField(id, labelKey, on) {
    var i = el('input', { type: 'checkbox', id: id }); i.checked = !!on;
    return el('label', { class: 'check dc-wide' }, i, el('span', { text: t(labelKey) }));
  }
  function val(id) { var e = $('#' + id); return e ? e.value : ''; }
  function chk(id) { var e = $('#' + id); return !!(e && e.checked); }
  function needCol(c) { if (!c) { EDU.toast(t('err_pick_col')); return false; } return true; }

  function renderStepForm() {
    var type = val('step-type') || store.get('stepType', 'trim');
    var box = $('#step-form'); box.innerHTML = '';
    var cols = colNames(), firstCol = cols[0] || '';
    var add = function () { for (var i = 0; i < arguments.length; i++) box.appendChild(arguments[i]); };
    var badOpts = [['keep', t('bad_keep')], ['blank', t('bad_blank')]];
    var sepOpts = SEPS.map(function (k) { return [k, t('sep_' + k)]; });
    switch (type) {
      case 'trim':
        add(chipPicker('f-cols', 'p_trim_cols'));
        FORM.get = function () { return { type: 'trim', cols: picked('f-cols') }; };
        break;
      case 'case':
        add(fieldSel('f-col', 'p_column', colOpts(false), firstCol),
          fieldSel('f-mode', 'p_case_mode', [['title', t('case_title')], ['upper', t('case_upper')], ['lower', t('case_lower')], ['sentence', t('case_sentence')]]));
        FORM.get = function () { return needCol(val('f-col')) && { type: 'case', col: val('f-col'), mode: val('f-mode') }; };
        break;
      case 'dedupe':
        add(chipPicker('f-by', 'p_dedupe_by'), checkField('f-loose', 'p_loose', true));
        FORM.get = function () { return { type: 'dedupe', by: picked('f-by'), loose: chk('f-loose') }; };
        break;
      case 'fill':
        add(fieldSel('f-col', 'p_column', colOpts(false), firstCol),
          fieldSel('f-how', 'p_fill_how', Object.keys(FILLS).map(function (k) { return [k, t(FILLS[k])]; })),
          textField('f-value', 'p_value', ''));
        var sync = function () { $('#f-value').closest('label').hidden = val('f-how') !== 'value'; };
        $('#f-how').addEventListener('change', sync); sync();
        FORM.get = function () { var o = needCol(val('f-col')) && { type: 'fill', col: val('f-col'), how: val('f-how') }; if (o && o.how === 'value') o.value = val('f-value'); return o; };
        break;
      case 'date':
        add(fieldSel('f-col', 'p_column', colOpts(false), guessCol('date') || firstCol),
          fieldSel('f-from', 'p_date_from', [['dmy', t('from_dmy')], ['mdy', t('from_mdy')]]),
          fieldSel('f-to', 'p_date_to', [['dmy', t('to_dmy')], ['ymd', t('to_ymd')]]));
        FORM.get = function () { return needCol(val('f-col')) && { type: 'date', col: val('f-col'), from: val('f-from'), to: val('f-to') }; };
        break;
      case 'phone':
        add(fieldSel('f-col', 'p_column', colOpts(false), guessCol('phone') || firstCol), fieldSel('f-bad', 'p_bad', badOpts));
        FORM.get = function () { return needCol(val('f-col')) && { type: 'phone', col: val('f-col'), bad: val('f-bad') }; };
        break;
      case 'money':
        add(fieldSel('f-col', 'p_column', colOpts(false), guessCol('number') || firstCol), fieldSel('f-bad', 'p_bad', badOpts));
        FORM.get = function () { return needCol(val('f-col')) && { type: 'money', col: val('f-col'), bad: val('f-bad') }; };
        break;
      case 'split':
        add(fieldSel('f-col', 'p_column', colOpts(false), firstCol), fieldSel('f-sep', 'p_sep', sepOpts, 'space'),
          textField('f-names', 'p_new_names', ''), checkField('f-keep', 'p_keep', false));
        FORM.get = function () {
          return needCol(val('f-col')) && { type: 'split', col: val('f-col'), sep: val('f-sep'), names: val('f-names').split(',').map(D.tidy).filter(Boolean), keep: chk('f-keep') };
        };
        break;
      case 'merge':
        add(chipPicker('f-cols', 'p_merge_cols'), fieldSel('f-sep', 'p_sep', sepOpts, 'space'), textField('f-name', 'p_new_name', ''), checkField('f-keep', 'p_keep', false));
        FORM.get = function () {
          var cs = picked('f-cols');
          if (cs.length < 2) { EDU.toast(t('err_pick2')); return null; }
          return { type: 'merge', cols: cs, sep: val('f-sep'), name: D.tidy(val('f-name')) || cs.join(' + '), keep: chk('f-keep') };
        };
        break;
      case 'replace':
        add(fieldSel('f-col', 'p_column', colOpts(true), ''), textField('f-find', 'p_find', ''), textField('f-repl', 'p_repl', ''),
          checkField('f-whole', 'p_whole', false), checkField('f-icase', 'p_icase', false));
        FORM.get = function () {
          if (!val('f-find') && !chk('f-whole')) { EDU.toast(t('err_find')); return null; }
          return { type: 'replace', col: val('f-col'), find: val('f-find'), repl: val('f-repl'), whole: chk('f-whole'), icase: chk('f-icase') };
        };
        break;
      case 'rename':
        add(fieldSel('f-col', 'p_column', colOpts(false), firstCol), textField('f-to', 'p_rename_to', ''));
        FORM.get = function () {
          if (!needCol(val('f-col'))) return null;
          if (!D.tidy(val('f-to'))) { EDU.toast(t('err_name')); return null; }
          return { type: 'rename', col: val('f-col'), to: D.tidy(val('f-to')) };
        };
        break;
      case 'del':
        add(chipPicker('f-cols', 'p_del_cols'));
        FORM.get = function () { var cs = picked('f-cols'); if (!cs.length) { EDU.toast(t('err_pick_col')); return null; } return { type: 'del', cols: cs }; };
        break;
    }
  }
  function guessCol(type) {
    if (!S.qAfter) return '';
    for (var i = 0; i < S.qAfter.per.length; i++) if (S.qAfter.per[i].type === type) return S.qAfter.per[i].name;
    return '';
  }
  function renderStepTypes() {
    var sel = $('#step-type'), cur = sel.value || store.get('stepType', 'trim');
    sel.innerHTML = '';
    D.TYPES.forEach(function (k) { sel.appendChild(el('option', { value: k, text: t('st_' + k) })); });
    sel.value = cur;
  }

  /* ---------------- suggestions ---------------- */
  function suggest() {
    var have = function (type, col) { return S.recipe.some(function (s) { return s.type === type && (!col || s.col === col); }); };
    var q = D.quality(S.out.table, typesAfter()), add = [];
    if (q.spaces > 0 && !have('trim')) add.push({ type: 'trim', cols: [] });
    q.per.forEach(function (p, c) {
      var vals = S.out.table.rows.map(function (r) { return r[c]; });
      if (p.type === 'text' && !have('case', p.name)) {
        var odd = vals.filter(function (v) { v = D.tidy(v); return /[A-Za-z]{2}/.test(v) && !/\d/.test(v) && (v === v.toLowerCase() || v === v.toUpperCase()); }).length;
        if (odd >= 2) add.push({ type: 'case', col: p.name, mode: 'title' });
      }
      if (p.type === 'email' && !have('case', p.name) && vals.some(function (v) { return v !== v.toLowerCase(); })) add.push({ type: 'case', col: p.name, mode: 'lower' });
      if (p.type === 'phone' && p.invalid && !have('phone', p.name)) add.push({ type: 'phone', col: p.name, bad: 'keep' });
      if (p.type === 'date' && p.invalid && !have('date', p.name)) add.push({ type: 'date', col: p.name, from: 'dmy', to: 'dmy' });
      if (p.type === 'number' && p.invalid && !have('money', p.name)) add.push({ type: 'money', col: p.name, bad: 'keep' });
    });
    q.per.forEach(function (p, c) {
      var placeholders = S.out.table.rows.some(function (r) { return D.isMissing(r[c]) && D.tidy(r[c]) !== ''; });
      if (placeholders && !have('fill', p.name)) add.push({ type: 'fill', col: p.name, how: 'blank' });
    });
    if (q.dups > 0 && !have('dedupe')) add.push({ type: 'dedupe', by: [], loose: true });
    if (!add.length) { EDU.toast(t('suggest_none')); return; }
    addSteps(add);
    EDU.toast(t('suggest_added', { n: add.length }));
  }
  function typesAfter() { var o = {}; S.qAfter.per.forEach(function (p) { o[p.name] = p.type; }); return o; }

  /* ---------------- rendering ---------------- */
  function renderInfo() {
    var name = S.meta.source === 'sample' ? t('sample_name') : (S.meta.name || t('pasted_name'));
    $('#data-info').textContent = t('data_info', { name: name, rows: EDU.fmt(S.orig.rows.length), cols: EDU.fmt(S.orig.headers.length) });
  }
  /* lower is better for every count; "neutral" for the row count */
  function tile(label, before, after, neutral) {
    return el('div', { class: 'dc-stat' },
      el('span', { class: 'lbl', text: label }),
      el('span', { class: 'val' }, el('span', { class: 'b', text: EDU.fmt(before) }), el('span', { class: 'arr', 'aria-hidden': 'true', text: ' → ' }),
        el('b', { class: neutral || after === before ? '' : after < before ? 'up' : 'down', text: EDU.fmt(after) })));
  }
  function renderQuality() {
    var b = S.qBefore, a = S.qAfter;
    $('#score-before').textContent = EDU.fmt(b.score);
    $('#score-after').textContent = EDU.fmt(a.score);
    $('#score-before').dataset.value = b.score; $('#score-after').dataset.value = a.score;
    $('#bar-before').style.width = b.score + '%'; $('#bar-after').style.width = a.score + '%';
    var tiles = $('#q-tiles'); tiles.innerHTML = '';
    tiles.appendChild(tile(t('q_rows'), b.rows, a.rows, true));
    tiles.appendChild(tile(t('q_missing'), b.missing, a.missing));
    tiles.appendChild(tile(t('q_invalid'), b.invalid, a.invalid));
    tiles.appendChild(tile(t('q_spaces'), b.spaces, a.spaces));
    tiles.appendChild(tile(t('q_dups'), b.dups, a.dups));
    tiles.appendChild(el('div', { class: 'dc-stat' }, el('span', { class: 'lbl', text: t('q_changed') }), el('span', { class: 'val' }, el('b', { id: 'changed-count', text: EDU.fmt(S.changed) }))));
    var body = $('#q-body'); body.innerHTML = '';
    var cell = function (bv, av) {
      var td = el('td', { class: 'num' });
      if (bv === null) { td.appendChild(el('b', { text: EDU.fmt(av) })); return td; }
      td.appendChild(document.createTextNode(EDU.fmt(bv) + ' → '));
      td.appendChild(el('b', { class: av < bv ? 'up' : av > bv ? 'down' : '', text: EDU.fmt(av) }));
      return td;
    };
    a.per.forEach(function (p, c) {
      var sc = S.out.srcCol[c], bp = sc >= 0 ? b.per[sc] : null;
      var tr = el('tr', {},
        el('th', { scope: 'row', class: 'no-i18n' }, p.name, sc < 0 ? el('span', { class: 'badge accent dc-new', text: t('col_new') }) : null),
        el('td', {}, el('span', { class: 'badge', text: t('type_' + p.type) })),
        cell(bp ? bp.missing : null, p.missing), cell(bp ? bp.invalid : null, p.invalid), cell(bp ? bp.spaces : null, p.spaces));
      body.appendChild(tr);
    });
  }
  function renderRecipe() {
    var ol = $('#recipe'); ol.innerHTML = '';
    $('#recipe-empty').hidden = S.recipe.length > 0;
    $('#undo').disabled = !S.history.length;
    S.recipe.forEach(function (s, i) {
      var r = S.out ? S.out.results[i] : null, res = resultText(s, r);
      var cb = el('input', { type: 'checkbox', 'aria-label': t('step_on') }); cb.checked = s.on;
      cb.addEventListener('change', function () { snapshot(); s.on = cb.checked; rerun(); });
      var li = el('li', { class: 'dc-step' + (s.on ? '' : ' off'), dataset: { type: s.type } },
        el('label', { class: 'dc-on' }, cb),
        el('span', { class: 'dc-num', text: EDU.fmt(i + 1) }),
        el('div', { class: 'dc-desc' },
          el('div', { class: 'dc-what' }, el('b', { text: t('st_' + s.type) }), el('span', { class: 'muted no-i18n dc-detail', text: describe(s) })),
          res[0] ? el('div', { class: 'small dc-res ' + res[1], text: res[0] }) : null),
        el('div', { class: 'dc-btns' },
          el('button', { class: 'btn btn-sm btn-ghost', type: 'button', 'aria-label': t('move_up'), title: t('move_up'), text: '↑', disabled: i === 0, onclick: function () { move(i, -1); } }),
          el('button', { class: 'btn btn-sm btn-ghost', type: 'button', 'aria-label': t('move_down'), title: t('move_down'), text: '↓', disabled: i === S.recipe.length - 1, onclick: function () { move(i, 1); } }),
          el('button', { class: 'btn btn-sm btn-ghost dc-x', type: 'button', 'aria-label': t('remove_step'), title: t('remove_step'), text: '✕', onclick: function () { snapshot(); S.recipe.splice(i, 1); rerun(); renderStepForm(); } })));
      ol.appendChild(li);
    });
  }
  function move(i, d) {
    var j = i + d; if (j < 0 || j >= S.recipe.length) return;
    snapshot(); var x = S.recipe[i]; S.recipe[i] = S.recipe[j]; S.recipe[j] = x; rerun(); renderStepForm();
  }

  /* rows to show (indices into the current table) for the filter */
  function isBad(ok, v) { return D.isMissing(v) || (ok ? !ok(v) : false); }
  function rowIndex() {
    if (S.idx) return S.idx;
    var orig = S.view === 'orig', tbl = orig ? S.orig : S.out.table, R = tbl.rows, oks = orig ? S.okBefore : S.okAfter;
    if (S.filter === 'all') { S.idx = null; return null; }
    var idx = [];
    for (var r = 0; r < R.length; r++) {
      var hit = false;
      for (var c = 0; c < R[r].length && !hit; c++) {
        if (S.filter === 'changed') hit = orig ? false : D.cellChanged(S.orig, S.out, r, c);
        else hit = isBad(oks[c], R[r][c]);
      }
      if (hit) idx.push(r);
    }
    S.idx = idx;
    return idx;
  }
  function renderTable() {
    var orig = S.view === 'orig', tbl = orig ? S.orig : S.out.table, oks = orig ? S.okBefore : S.okAfter;
    var idx = rowIndex(), total = idx ? idx.length : tbl.rows.length;
    var pages = Math.max(1, Math.ceil(total / PAGE));
    if (S.page >= pages) S.page = pages - 1;
    var from = S.page * PAGE, to = Math.min(total, from + PAGE);
    var h = ['<thead><tr><th class="dc-rn" scope="col">#</th>'];
    tbl.headers.forEach(function (name, c) {
      var isNew = !orig && S.out.srcCol[c] < 0;
      h.push('<th scope="col"' + (isNew ? ' class="dc-newcol"' : '') + '>' + EDU.esc(name) + '</th>');
    });
    h.push('</tr></thead><tbody>');
    for (var k = from; k < to; k++) {
      var r = idx ? idx[k] : k, row = tbl.rows[r], on = orig ? r : S.out.origin[r];
      h.push('<tr><td class="dc-rn">' + (on + 1) + '</td>');
      for (var c = 0; c < tbl.headers.length; c++) {
        var v = row[c] == null ? '' : row[c], cls = [];
        if (!orig && D.cellChanged(S.orig, S.out, r, c)) cls.push('chg');
        if (isBad(oks[c], v)) cls.push('bad');
        var shown = v === '' ? '' : EDU.esc(v).replace(/^ +| +$/g, function (m) { return '<span class="sp">' + m.replace(/ /g, '·') + '</span>'; });
        h.push('<td data-c="' + c + '"' + (cls.length ? ' class="' + cls.join(' ') + '"' : '') + '>' + shown + '</td>');
      }
      h.push('</tr>');
    }
    h.push('</tbody>');
    $('#grid').innerHTML = h.join('');
    $('#no-rows').hidden = total > 0;
    $('#page-info').textContent = total ? t('page_info', { from: EDU.fmt(from + 1), to: EDU.fmt(to), total: EDU.fmt(total) }) : '';
    $('#out-count').dataset.rows = S.out.table.rows.length;
    $('#out-count').textContent = t('out_count', { rows: EDU.fmt(S.out.table.rows.length), cols: EDU.fmt(S.out.table.headers.length) });
    $('#pg-prev').disabled = S.page === 0; $('#pg-next').disabled = S.page >= pages - 1;
    $('#pager').hidden = pages < 2;
    EDU.$$('#view-seg button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === S.view ? 'true' : 'false'); });
    $('#filter').value = S.filter;
    $('#filter').querySelector('option[value="changed"]').disabled = orig;
  }

  /* ---------------- recipe import / export ---------------- */
  function importRecipeText(text) {
    var steps = D.importRecipe(text);
    if (!steps) { EDU.toast(t('recipe_bad')); return; }
    snapshot(); S.recipe = steps; S.page = 0; rerun(); renderStepForm();
    EDU.toast(t('recipe_loaded', { n: steps.length }));
  }
  function exportName(ext) { return (S.meta.source === 'sample' ? 'customers' : (S.meta.name || 'data')) + ext; }

  /* ---------------- events ---------------- */
  $('#load-sample').addEventListener('click', function () { if (S.recipe.length && !confirm(t('confirm_sample'))) return; loadSample(); });
  $('#open-file').addEventListener('click', function () { EDU.pickFile('.csv,.tsv,.txt,text/csv,text/plain').then(loadFile); });
  $('#use-paste').addEventListener('click', function () {
    var v = $('#paste').value;
    if (!v.trim()) { EDU.toast(t('err_empty')); return; }
    if (loadText(v, '', 'paste')) $('#paste-box').open = false;
  });
  ['dragenter', 'dragover'].forEach(function (ev) {
    document.addEventListener(ev, function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0) { e.preventDefault(); document.body.classList.add('dc-drag'); } });
  });
  ['dragleave', 'drop'].forEach(function (ev) { document.addEventListener(ev, function (e) { if (ev === 'dragleave' && e.relatedTarget) return; document.body.classList.remove('dc-drag'); }); });
  document.addEventListener('drop', function (e) {
    if (!e.dataTransfer || !e.dataTransfer.files || !e.dataTransfer.files.length) return;
    e.preventDefault(); loadFile(e.dataTransfer.files[0]);
  });
  $('#step-type').addEventListener('change', function () { store.set('stepType', val('step-type')); renderStepForm(); });
  $('#step-add').addEventListener('click', function () {
    var s = FORM.get && FORM.get();
    if (!s) return;
    addSteps([s]);
  });
  $('#suggest').addEventListener('click', suggest);
  $('#undo').addEventListener('click', undo);
  $('#clear-steps').addEventListener('click', function () { if (!S.recipe.length) return; snapshot(); S.recipe = []; rerun(); renderStepForm(); });
  $('#export-recipe').addEventListener('click', function () {
    EDU.download(exportName('-recipe.json'), D.exportRecipe(S.recipe), 'application/json');
  });
  $('#import-recipe').addEventListener('click', function () {
    EDU.pickFile('.json,application/json').then(function (f) { if (f) EDU.readText(f).then(importRecipeText).catch(function () { EDU.toast(t('err_file')); }); });
  });
  EDU.$$('#view-seg button').forEach(function (b) {
    b.addEventListener('click', function () { S.view = b.dataset.v; if (S.view === 'orig' && S.filter === 'changed') S.filter = 'all'; S.idx = null; S.page = 0; store.set('view', S.view); renderTable(); });
  });
  $('#filter').addEventListener('change', function () { S.filter = val('filter'); S.idx = null; S.page = 0; renderTable(); });
  $('#pg-prev').addEventListener('click', function () { S.page--; renderTable(); });
  $('#pg-next').addEventListener('click', function () { S.page++; renderTable(); });
  $('#download').addEventListener('click', function () {
    var tbl = S.out.table;
    EDU.download(exportName('-clean.csv'), EDU.csv.stringify([tbl.headers].concat(tbl.rows)), 'text/csv');
  });
  $('#reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    store.remove('data'); store.remove('recipe'); store.remove('view'); store.remove('stepType');
    S.view = 'clean'; $('#paste').value = '';
    loadSample();
  });

  /* ---------------- language ---------------- */
  function onLang() {
    if (S.meta.source === 'sample') {
      var oldH = S.orig.headers, tbl = sampleTable(EDU.lang), newH = tbl.headers;
      var map = function (n) { var i = oldH.indexOf(n); return i >= 0 ? newH[i] : n; };
      S.recipe.forEach(function (s) {
        if (s.col) s.col = map(s.col);
        ['cols', 'by'].forEach(function (k) { if (s[k]) s[k] = s[k].map(map); });
      });
      S.history = [];
      S.orig = tbl; analyseBefore();
    }
    renderStepTypes();
    rerun();
    renderStepForm();
  }
  EDU.onLang(onLang);

  /* ---------------- start ---------------- */
  renderStepTypes();
  var saved = store.get('data', null);
  var started = false;
  if (saved && saved.source !== 'sample' && saved.text) {
    var tbl = null;
    try { tbl = D.toTable(EDU.csv.parse(saved.text, D.detectDelim(saved.text))); } catch (e) { tbl = null; }
    if (tbl && tbl.headers.length) {
      S.orig = tbl; S.meta = { source: saved.source, name: saved.name || '', text: saved.text };
      analyseBefore(); rerun(); renderStepForm(); started = true;
    }
  }
  if (!started) {
    S.orig = sampleTable(EDU.lang); S.meta = { source: 'sample', name: '' };
    analyseBefore(); rerun(); renderStepForm();
    if (saved && saved.big) EDU.toast(t('big_note'));
  }
})();
