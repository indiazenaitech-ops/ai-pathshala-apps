/* Marks & Report Cards: a free marks register for teachers.
   Totals, percentages, CBSE-style grades, ranks, class analysis, printable report cards and CSV.
   Everything stays in this browser (EDU.store). No accounts, nothing is uploaded. */
(function () {
  'use strict';
  var SLUG = 'marks-report-card';
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$;

  /* CBSE 9-point style scale, applied to the percentage in a subject (E = needs improvement). */
  var GRADES = [
    { g: 'A1', min: 91, range: '91–100', cls: 'ga' },
    { g: 'A2', min: 81, range: '81–90', cls: 'ga' },
    { g: 'B1', min: 71, range: '71–80', cls: 'gb' },
    { g: 'B2', min: 61, range: '61–70', cls: 'gb' },
    { g: 'C1', min: 51, range: '51–60', cls: 'gc' },
    { g: 'C2', min: 41, range: '41–50', cls: 'gc' },
    { g: 'D', min: 33, range: '33–40', cls: 'gd' },
    { g: 'E', min: -Infinity, range: '0–32', cls: 'ge' }
  ];
  var TABS = ['setup', 'marks', 'analysis', 'cards'];

  /* Sample class: 6 subjects (Computer out of 50), 8 students listed by roll number. */
  var SAMPLE_MAX = [100, 100, 100, 100, 100, 50];
  var SAMPLE_MARKS = [
    [76, 80, 72, 78, 74, 38],      // 418
    [95, 92, 98, 94, 90, 48],      // 517 → rank 1
    [90, 86, 88, 84, 89, 44],      // 481 → rank 2 (tie)
    [52, 48, 55, 50, 58, 27],      // 290
    [58, 62, 'AB', 55, 60, 30],    // 265, absent in subject 3 → fail
    [88, 91, 85, 89, 84, 44],      // 481 → rank 2 (tie)
    [38, 42, 30, 35, 40, 20],      // 205, below 33% in subject 3 → fail
    [65, 70, 58, 62, 68, 33]       // 356
  ];
  var SAMPLE_PRESENT = [96, 102, 99, 88, 80, 101, 74, 95];
  var SAMPLE_DAYS = 104;

  /* ---------------- small helpers ---------------- */
  var seq = 0;
  function uid() { seq += 1; return 'x' + Date.now().toString(36) + seq.toString(36) + Math.floor(Math.random() * 1296).toString(36); }
  var ZEROS = [0x0966, 0x09E6, 0x0A66, 0x0AE6, 0x0B66, 0x0BE6, 0x0C66, 0x0CE6, 0x0D66, 0x0660, 0x06F0];
  var DIGIT_RE = /[٠-٩۰-۹०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯]/g;
  /* Teachers may type marks with a Hindi / Bengali / Urdu ... keyboard: turn those digits into 0-9. */
  function latin(s) {
    return String(s == null ? '' : s).replace(DIGIT_RE, function (ch) {
      var code = ch.charCodeAt(0);
      for (var i = 0; i < ZEROS.length; i++) if (code >= ZEROS[i] && code <= ZEROS[i] + 9) return String(code - ZEROS[i]);
      return ch;
    });
  }
  function num(v, d) { var n = parseFloat(latin(v).replace(',', '.')); return isFinite(n) ? n : d; }
  function r2(n) { return Math.round(n * 100) / 100; }
  function fmtN(n) { return isFinite(n) ? EDU.fmt(r2(n), { maximumFractionDigits: 2 }) : '—'; }
  function fmtPct(p) { return isFinite(p) ? EDU.fmt(r2(p), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%' : '—'; }
  var AB_RE = /^(ab|a|-|–|—)$/i;
  function normMark(v) {
    var s = latin(v).trim();
    if (AB_RE.test(s)) return 'AB';
    return s.replace(/^(\d+),(\d+)$/, '$1.$2');
  }
  function parseMark(raw, max) {
    var s = latin(raw == null ? '' : raw).trim();
    if (!s) return { st: 'empty' };
    if (AB_RE.test(s)) return { st: 'ab', v: 0 };
    s = s.replace(/^(\d*),(\d+)$/, '$1.$2');
    if (!/^(\d+(\.\d+)?|\.\d+)$/.test(s)) return { st: 'bad', why: 'nan' };
    var v = parseFloat(s);
    if (!isFinite(v)) return { st: 'bad', why: 'nan' };
    if (v > max + 1e-9) return { st: 'bad', why: 'max' };
    return { st: 'ok', v: v };
  }
  function maxOf(s) { var m = num(s && s.max, 100); return m > 0 ? m : 100; }
  function gradeOf(p) {
    for (var i = 0; i < GRADES.length; i++) if (p + 1e-9 >= GRADES[i].min) return GRADES[i];
    return GRADES[GRADES.length - 1];
  }
  function content() { var A = window.APP_CONTENT || {}; return A[EDU.lang] || A.en; }
  function normName(s) { return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim(); }
  function setVal(sel, v) { var e = $(sel); if (e && document.activeElement !== e) e.value = v == null ? '' : v; }
  function fileBase(c) { return (String(c.name || 'class').replace(/[\\/:*?"<>|\s]+/g, '-').replace(/^-+|-+$/g, '') || 'class'); }

  /* ---------------- data ---------------- */
  function fixClass(c) {
    c = c && typeof c === 'object' ? c : {};
    if (!c.id) c.id = uid();
    c.name = String(c.name == null ? '' : c.name);
    c.term = String(c.term == null ? '' : c.term);
    c.passPct = EDU.clamp(num(c.passPct, 33), 0, 100);
    c.each = c.each !== false;
    c.showRank = c.showRank !== false;
    c.days = c.days == null ? '' : String(c.days);
    c.subjects = (Array.isArray(c.subjects) ? c.subjects : []).filter(function (s) { return s && typeof s === 'object'; }).map(function (s) {
      return { id: s.id ? String(s.id) : uid(), name: String(s.name == null ? '' : s.name), max: maxOf(s) };
    });
    c.students = (Array.isArray(c.students) ? c.students : []).filter(function (s) { return s && typeof s === 'object'; }).map(function (s) {
      var marks = {};
      if (s.marks && typeof s.marks === 'object') Object.keys(s.marks).forEach(function (k) { if (s.marks[k] != null) marks[k] = String(s.marks[k]); });
      return { id: s.id ? String(s.id) : uid(), roll: String(s.roll == null ? '' : s.roll), name: String(s.name == null ? '' : s.name), marks: marks, present: String(s.present == null ? '' : s.present), remark: String(s.remark == null ? '' : s.remark) };
    });
    return c;
  }
  function fixData(d) {
    if (!d || typeof d !== 'object' || !Array.isArray(d.classes) || !d.classes.length) return null;
    d.classes = d.classes.map(fixClass);
    if (!d.classes.some(function (c) { return c.id === d.cur; })) d.cur = d.classes[0].id;
    var s = d.school && typeof d.school === 'object' ? d.school : {};
    d.school = { name: String(s.name || ''), addr: String(s.addr || ''), logo: /^data:image\//.test(s.logo || '') ? s.logo : '' };
    if (TABS.indexOf(d.tab) < 0) d.tab = 'marks';
    d.v = 1;
    return d;
  }
  function sampleClass() {
    var C = content();
    var subjects = C.subjects.map(function (n, i) { return { id: uid(), name: n, max: SAMPLE_MAX[i] || 100 }; });
    var students = C.students.map(function (n, i) {
      var marks = {};
      subjects.forEach(function (s, j) { marks[s.id] = String(SAMPLE_MARKS[i][j]); });
      return { id: uid(), roll: String(i + 1), name: n, marks: marks, present: String(SAMPLE_PRESENT[i]), remark: '' };
    });
    var c = fixClass({ name: C.cls, term: C.term, passPct: 33, each: true, showRank: true, days: String(SAMPLE_DAYS), subjects: subjects, students: students });
    var R = compute(c);
    R.rows.forEach(function (r) { r.st.remark = autoRemark(r); });
    return c;
  }
  function freshData() {
    var c = sampleClass();
    return { v: 1, classes: [c], cur: c.id, school: { name: '', addr: '', logo: '' }, tab: 'marks' };
  }

  var data = fixData(store.get('data', null)) || freshData();
  var saveTimer = null;
  function save(now) {
    clearTimeout(saveTimer);
    if (now) store.set('data', data);
    else saveTimer = setTimeout(function () { store.set('data', data); }, 250);
  }
  window.addEventListener('pagehide', function () { store.set('data', data); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) store.set('data', data); });

  function cls() {
    for (var i = 0; i < data.classes.length; i++) if (data.classes[i].id === data.cur) return data.classes[i];
    data.cur = data.classes[0].id;
    return data.classes[0];
  }

  /* ---------------- the maths ---------------- */
  function compute(c) {
    var pass = num(c.passPct, 33);
    var maxTotal = c.subjects.reduce(function (a, s) { return a + maxOf(s); }, 0);
    var rows = c.students.map(function (st) {
      var cells = c.subjects.map(function (s) {
        var m = maxOf(s), p = parseMark(st.marks[s.id], m);
        if (p.st === 'ok' || p.st === 'ab') {
          p.pct = p.v * 100 / m;
          p.grade = gradeOf(p.pct);
          p.pass = p.st === 'ok' && p.pct + 1e-9 >= pass;
        }
        return p;
      });
      var complete = c.subjects.length > 0 && cells.every(function (x) { return x.st === 'ok' || x.st === 'ab'; });
      var tot = 0;
      cells.forEach(function (x) { if (x.st === 'ok') tot += x.v; });
      var r = { st: st, cells: cells, complete: complete, total: null, pct: null, grade: null, result: 'inc', rank: null, failed: [] };
      r.failed = c.subjects.filter(function (s, i) { return (cells[i].st === 'ok' || cells[i].st === 'ab') && !cells[i].pass; }).map(function (s) { return s.name; });
      if (complete) {
        r.total = r2(tot);
        r.pct = maxTotal > 0 ? tot * 100 / maxTotal : 0;
        r.grade = gradeOf(r.pct);
        var ok = c.each ? r.failed.length === 0 : r.pct + 1e-9 >= pass;
        r.result = ok ? 'pass' : 'fail';
      }
      return r;
    });
    var done = rows.filter(function (r) { return r.complete; });
    /* standard competition ranking: equal totals share a rank (1, 2, 2, 4) */
    done.forEach(function (r) {
      var key = Math.round(r.total * 100);
      r.rank = 1 + done.filter(function (o) { return Math.round(o.total * 100) > key; }).length;
    });
    return { rows: rows, done: done, maxTotal: maxTotal, pass: pass };
  }
  function subjectStats(c, R) {
    return c.subjects.map(function (s, j) {
      var vals = [], ab = 0, passed = 0, hi = null, lo = null;
      R.rows.forEach(function (r) {
        var x = r.cells[j];
        if (x.st === 'ok') {
          vals.push(x.v);
          if (x.pass) passed++;
          if (!hi || x.v > hi.v) hi = { v: x.v, name: r.st.name };
          if (!lo || x.v < lo.v) lo = { v: x.v, name: r.st.name };
        } else if (x.st === 'ab') ab++;
      });
      var avg = vals.length ? vals.reduce(function (a, b) { return a + b; }, 0) / vals.length : null;
      return { s: s, max: maxOf(s), n: vals.length, ab: ab, avg: avg, avgPct: avg == null ? null : avg * 100 / maxOf(s), hi: hi, lo: lo, passed: passed };
    });
  }
  function classStats(R) {
    var passed = R.done.filter(function (r) { return r.result === 'pass'; }).length;
    var avg = R.done.length ? R.done.reduce(function (a, r) { return a + r.pct; }, 0) / R.done.length : null;
    return { passed: passed, avg: avg, n: R.done.length };
  }
  function autoRemark(r) {
    var A = content().auto;
    if (!r.complete) return '';
    if (r.result === 'fail') return A.e;
    var g = r.grade.g;
    return g.charAt(0) === 'A' ? A.a : g.charAt(0) === 'B' ? A.b : g.charAt(0) === 'C' ? A.c : g === 'D' ? A.d : A.e;
  }
  function resultText(r) { return r.result === 'pass' ? t('res_pass') : r.result === 'fail' ? t('res_fail') : t('res_incomplete'); }
  function resultBadge(r) {
    return el('span', { class: 'badge ' + (r.result === 'pass' ? 'success' : r.result === 'fail' ? 'danger' : 'inc'), text: resultText(r) });
  }
  function gradeBadge(g) { return g ? el('span', { class: 'gbadge ' + g.cls, text: g.g }) : el('span', { class: 'muted', text: '—' }); }

  /* ---------------- start ---------------- */
  EDU.init({ slug: SLUG, title: 'app_title', wide: true });
  var rcIndex = 0;
  var distKey = 'all';

  function renderAll() {
    renderStatic();
    renderBar();
    showTab(data.tab);
  }

  function renderStatic() {
    var scale = $('#help-scale');
    scale.innerHTML = '';
    GRADES.forEach(function (g) {
      scale.appendChild(el('span', { class: 'scale-item' }, el('span', { class: 'gbadge ' + g.cls, text: g.g }), ' ', el('span', { class: 'small', text: g.range })));
    });
    scale.appendChild(el('span', { class: 'small muted', text: 'E = ' + t('needs_improvement') }));
    $('#saved-note').textContent = '🔒 ' + t('saved_local');
    var fs = $('#fs-btn');
    fs.hidden = !(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  }

  /* ---------------- class bar ---------------- */
  function classLabel(c) { return (c.name || t('untitled_class')) + (c.term ? ' · ' + c.term : ''); }
  /* same label as isolated pieces, so mixed scripts and numbers keep their order in Urdu (RTL) */
  function classLabelEl(c) {
    return [el('bdi', { text: c.name || t('untitled_class') }), c.term ? ' · ' : null, c.term ? el('bdi', { text: c.term }) : null];
  }
  function renderBar() {
    var sel = $('#class-select');
    sel.innerHTML = '';
    data.classes.forEach(function (c) { sel.appendChild(el('option', { value: c.id, text: classLabel(c) })); });
    sel.value = data.cur;
    $('#delete-class').disabled = data.classes.length < 2;
  }
  $('#class-select').addEventListener('change', function (e) {
    data.cur = e.target.value; rcIndex = 0; distKey = 'all'; save();
    showTab(data.tab);
  });
  $('#new-class').addEventListener('click', newClassDialog);
  $('#delete-class').addEventListener('click', function () {
    var c = cls();
    if (data.classes.length < 2) return;
    if (!confirm(t('confirm_delete_class', { name: c.name || t('untitled_class') }))) return;
    data.classes = data.classes.filter(function (x) { return x.id !== c.id; });
    data.cur = data.classes[0].id; rcIndex = 0; save(true);
    renderBar(); showTab(data.tab);
    EDU.toast(t('class_deleted'));
  });
  $('#export-csv').addEventListener('click', exportCSV);
  $('#print-sheet').addEventListener('click', function () { doPrint('sheet'); });
  $('#fs-btn').addEventListener('click', function () { EDU.fullscreen(); });

  function newClassDialog() {
    var c = cls();
    var name = el('input', { type: 'text', id: 'nc-name', maxlength: '60', placeholder: t('class_name_ph'), autocomplete: 'off' });
    var term = el('input', { type: 'text', id: 'nc-term', maxlength: '80', autocomplete: 'off' });
    term.value = c.term;
    function radio(val, checked, label) {
      var r = el('input', { type: 'radio', name: 'nc-mode', value: val, id: 'nc-mode-' + val });
      r.checked = checked;
      return el('label', { class: 'check nc-opt', for: 'nc-mode-' + val }, r, el('span', { text: label }));
    }
    var cname = c.name || t('untitled_class');
    var create = el('button', { class: 'btn btn-primary', id: 'nc-create', type: 'button', text: t('create') });
    var box = el('div', { class: 'stack' },
      el('div', { class: 'field' }, el('label', { for: 'nc-name', text: t('class_name') }), name),
      el('div', { class: 'field' }, el('label', { for: 'nc-term', text: t('term') }), term),
      el('fieldset', { class: 'nc-set' },
        el('legend', { class: 'small muted', text: t('nc_start_with') }),
        radio('subjects', true, t('copy_subjects', { name: cname })),
        radio('all', false, t('copy_all', { name: cname })),
        radio('blank', false, t('copy_none'))),
      el('div', { class: 'row' }, create, el('button', { class: 'btn', type: 'button', text: t('cancel'), onclick: function () { close(); } })));
    var close = EDU.modal(box, { title: t('new_class') });
    function go() {
      var modeEl = box.querySelector('input[name="nc-mode"]:checked');
      var mode = modeEl ? modeEl.value : 'subjects';
      var map = {};
      var nc = fixClass({
        name: name.value.trim() || t('untitled_class'), term: term.value.trim(), passPct: c.passPct, each: c.each, showRank: c.showRank, days: c.days,
        subjects: mode === 'blank' ? [{ name: t('subject_n', { n: 1 }), max: 100 }] : c.subjects.map(function (s) { var id = uid(); map[s.id] = id; return { id: id, name: s.name, max: s.max }; }),
        students: mode === 'all' ? c.students.map(function (s) { return { roll: s.roll, name: s.name, marks: {}, present: '', remark: '' }; }) : []
      });
      data.classes.push(nc);
      data.cur = nc.id; rcIndex = 0; distKey = 'all';
      save(true);
      close();
      renderBar();
      showTab(mode === 'all' ? 'marks' : 'setup');
      EDU.toast(t('class_created'));
    }
    create.addEventListener('click', go);
    name.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
    setTimeout(function () { name.focus(); }, 30);
  }

  /* ---------------- tabs ---------------- */
  function showTab(name) {
    if (TABS.indexOf(name) < 0) name = 'marks';
    data.tab = name; save();
    TABS.forEach(function (tb) {
      var b = $('#tab-' + tb), p = $('#panel-' + tb), on = tb === name;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      p.hidden = !on;
    });
    if (name === 'setup') renderSetup();
    else if (name === 'marks') renderMarks();
    else if (name === 'analysis') renderAnalysis();
    else renderCards();
  }
  TABS.forEach(function (tb, i) {
    var b = $('#tab-' + tb);
    b.addEventListener('click', function () { showTab(tb); });
    b.addEventListener('keydown', function (e) {
      var rtl = document.documentElement.dir === 'rtl', d = 0;
      if (e.key === 'ArrowRight') d = rtl ? -1 : 1; else if (e.key === 'ArrowLeft') d = rtl ? 1 : -1; else return;
      e.preventDefault();
      var nx = TABS[(i + d + TABS.length) % TABS.length];
      showTab(nx); $('#tab-' + nx).focus();
    });
  });

  /* ---------------- setup ---------------- */
  function renderSetup() {
    var c = cls();
    setVal('#cl-name', c.name); setVal('#cl-term', c.term); setVal('#cl-pass', c.passPct); setVal('#cl-days', c.days);
    $('#cl-each').checked = c.each; $('#cl-rank').checked = c.showRank;
    renderSubjects();
    renderStudentCount();
    setVal('#sc-name', data.school.name); setVal('#sc-addr', data.school.addr);
    renderLogo();
  }
  function bindText(sel, fn) { $(sel).addEventListener('input', function (e) { fn(e.target.value); save(); }); }
  bindText('#cl-name', function (v) { cls().name = v; renderBarLabel(); });
  bindText('#cl-term', function (v) { cls().term = v; renderBarLabel(); });
  bindText('#cl-days', function (v) { cls().days = latin(v).trim(); });
  $('#cl-pass').addEventListener('change', function (e) {
    var v = num(e.target.value, NaN);
    if (!(v >= 0 && v <= 100)) { e.target.value = cls().passPct; EDU.toast(t('err_pass')); return; }
    cls().passPct = v; save();
  });
  $('#cl-each').addEventListener('change', function (e) { cls().each = e.target.checked; save(); });
  $('#cl-rank').addEventListener('change', function (e) { cls().showRank = e.target.checked; save(); });
  bindText('#sc-name', function (v) { data.school.name = v; });
  bindText('#sc-addr', function (v) { data.school.addr = v; });
  function renderBarLabel() {
    var o = $('#class-select').querySelector('option[value="' + cls().id + '"]');
    if (o) o.textContent = classLabel(cls());
  }

  function renderSubjects() {
    var c = cls(), box = $('#subj-list');
    box.innerHTML = '';
    if (!c.subjects.length) box.appendChild(el('p', { class: 'muted small', text: t('no_subjects') }));
    c.subjects.forEach(function (s, i) {
      var name = el('input', { type: 'text', class: 'no-i18n s-name', maxlength: '40', 'aria-label': t('subject_n', { n: i + 1 }), autocomplete: 'off' });
      name.value = s.name;
      name.addEventListener('input', function () { s.name = name.value; save(); });
      var max = el('input', { type: 'number', class: 's-max', min: '1', max: '1000', step: 'any', inputmode: 'decimal', 'aria-label': t('max_marks') + ' ' + EDU.fmt(i + 1) });
      max.value = s.max;
      max.addEventListener('change', function () {
        var m = num(max.value, 0);
        if (m > 0 && m <= 1000) { s.max = m; save(); } else { max.value = s.max; EDU.toast(t('err_maxmarks')); }
      });
      var rm = el('button', { class: 'btn btn-sm btn-danger', type: 'button', 'aria-label': t('remove_subject'), title: t('remove_subject'), text: '✕' });
      rm.addEventListener('click', function () {
        var hasMarks = c.students.some(function (st) { return String(st.marks[s.id] || '').trim() !== ''; });
        if (hasMarks && !confirm(t('confirm_remove_subject', { name: s.name || '—' }))) return;
        c.subjects = c.subjects.filter(function (x) { return x !== s; });
        c.students.forEach(function (st) { delete st.marks[s.id]; });
        save(); renderSubjects();
      });
      box.appendChild(el('div', { class: 'subj-row' }, el('span', { class: 'subj-n muted', text: EDU.fmt(i + 1) }), name, max, rm));
    });
  }
  $('#add-subject').addEventListener('click', function () {
    var c = cls();
    if (c.subjects.length >= 25) { EDU.toast(t('too_many_subjects')); return; }
    c.subjects.push({ id: uid(), name: t('subject_n', { n: c.subjects.length + 1 }), max: 100 });
    save(); renderSubjects();
    var ins = $$('#subj-list .s-name');
    if (ins.length) { ins[ins.length - 1].focus(); ins[ins.length - 1].select(); }
  });

  function renderStudentCount() {
    $('#st-count').textContent = t('students_count', { n: EDU.fmt(cls().students.length) });
  }
  function nextRoll(c) {
    var m = 0;
    c.students.forEach(function (s) { var n = parseInt(latin(s.roll), 10); if (n > m) m = n; });
    return m + 1;
  }
  $('#sort-az').addEventListener('click', function () {
    var c = cls();
    c.students.sort(function (a, b) { return String(a.name).localeCompare(String(b.name), EDU.langInfo(EDU.lang).tag, { sensitivity: 'base' }); });
    save(); EDU.toast(t('sorted'));
  });
  $('#sort-roll').addEventListener('click', function () {
    var c = cls();
    c.students.sort(function (a, b) { return num(a.roll, 1e9) - num(b.roll, 1e9) || String(a.roll).localeCompare(String(b.roll)); });
    save(); EDU.toast(t('sorted'));
  });
  $('#renumber').addEventListener('click', function () {
    cls().students.forEach(function (s, i) { s.roll = String(i + 1); });
    save(); EDU.toast(t('renumbered'));
  });

  /* ---- paste / CSV import ---- */
  function parseDelim(text, d) {
    var rows = [], row = [], cur = '', q = false, c;
    for (var i = 0; i < text.length; i++) {
      c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
        else cur += c;
      } else if (c === '"' && cur.trim() === '') { q = true; cur = ''; }
      else if (c === d) { row.push(cur); cur = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cur); rows.push(row); row = []; cur = '';
      } else cur += c;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows;
  }
  function splitTable(text) {
    text = String(text || '').replace(/^﻿/, '');
    var lines = text.split(/\r\n|\n|\r/).filter(function (l) { return l.trim(); });
    if (!lines.length) return [];
    var d = text.indexOf('\t') >= 0 ? '\t' : lines.some(function (l) { return l.indexOf(',') >= 0; }) ? ',' : lines.some(function (l) { return l.indexOf(';') >= 0; }) ? ';' : null;
    if (!d) return lines.map(function (l) { return [l]; });
    return parseDelim(text, d);
  }
  function isMarkish(c) { var s = latin(c).trim(); return s === '' || AB_RE.test(s) || /^\d+([.,]\d+)?$/.test(s); }
  function mostlyText(rows, i) {
    var n = 0, txt = 0;
    rows.forEach(function (r) { var v = (r[i] || '').trim(); if (v) { n++; if (!isMarkish(v)) txt++; } });
    return txt > 0 && txt >= n * 0.6;
  }
  function headerMax(h) {
    var s = latin(h).trim();
    var m = /^(.*?)\s*[(\[\/]\s*(\d+(?:\.\d+)?)\s*[)\]]?\s*$/.exec(s);
    if (m && m[1].trim()) return { name: m[1].trim(), max: parseFloat(m[2]) };
    return { name: s, max: null };
  }
  function normH(s) { return String(s || '').toLowerCase().replace(/[\s._:#*'’()[\]\/-]+/g, ' ').trim(); }
  var HEADS = null;
  function headWords() {
    if (HEADS) return HEADS;
    var S = window.APP_STRINGS || {};
    function words(keys, extra) {
      var a = [];
      keys.forEach(function (k) { Object.keys(S).forEach(function (L) { if (S[L][k]) a.push(normH(S[L][k])); }); });
      return a.concat(extra.map(normH));
    }
    HEADS = {
      name: words(['col_name', 'rc_name'], ['name', 'names', 'student', 'students', 'student name', 'name of student', 'name of the student', 'students name', 'full name', 'naam']),
      roll: words(['col_roll', 'rc_roll'], ['roll', 'roll no', 'roll number', 'rollno', 'r no', 's no', 'sr no', 'sno', 'sl no', 'serial no', 'adm no', 'admission no']),
      present: words(['days_present'], ['attendance', 'present', 'days present']),
      remark: words(['remarks'], ['remark', 'remarks', 'comment', 'comments']),
      skip: words(['col_total', 'col_pct', 'col_grade', 'col_rank', 'col_result', 'rc_percentage', 'rc_overall_grade'], ['total', '%', 'percentage', 'percent', 'grade', 'rank', 'result', 'max', 'pass fail'])
    };
    return HEADS;
  }
  function importText(text) {
    var c = cls();
    var rows = splitTable(text).map(function (r) { return r.map(function (x) { return String(x == null ? '' : x).trim(); }); })
      .filter(function (r) { return r.some(function (x) { return x; }); });
    if (!rows.length) { EDU.toast(t('nothing_found')); return false; }
    if (rows.length > 801) rows = rows.slice(0, 801);
    var H = headWords();
    var first = rows[0];
    function kind(h) {
      var n = normH(headerMax(h).name);
      if (!n) return 'blank';
      if (H.name.indexOf(n) >= 0) return 'name';
      if (H.roll.indexOf(n) >= 0) return 'roll';
      if (H.present.indexOf(n) >= 0) return 'present';
      if (H.remark.indexOf(n) >= 0) return 'remark';
      if (H.skip.indexOf(n) >= 0 || normH(h) === '%') return 'skip';
      return 'other';
    }
    var kinds = first.map(kind);
    var hasHeader = kinds.indexOf('name') >= 0 || kinds.indexOf('roll') >= 0;
    if (!hasHeader && rows.length > 1) {
      var textCells = first.map(function (x, i) { return x && !isMarkish(x) ? i : -1; }).filter(function (i) { return i >= 0; });
      hasHeader = textCells.length >= 2 && textCells.some(function (i) { return !mostlyText(rows.slice(1), i); });
    }
    var col = [], nameCol = -1, rollCol = -1, body = rows, w = 0, i;
    rows.forEach(function (r) { if (r.length > w) w = r.length; });
    if (hasHeader) {
      body = rows.slice(1);
      first.forEach(function (h, i) {
        var k = kinds[i];
        if (k === 'name' && nameCol < 0) { nameCol = i; col[i] = { type: 'name' }; }
        else if (k === 'roll' && rollCol < 0) { rollCol = i; col[i] = { type: 'roll' }; }
        else if (k === 'present' || k === 'remark') col[i] = { type: k };
        else if (k === 'other') col[i] = { type: 'subj', h: headerMax(h) };
        else col[i] = { type: 'skip' };
      });
      if (nameCol < 0) {
        for (i = 0; i < first.length; i++) if (col[i].type === 'subj' && mostlyText(body, i)) { nameCol = i; col[i] = { type: 'name' }; break; }
      }
    } else {
      for (i = 0; i < w; i++) if (mostlyText(rows, i)) { nameCol = i; break; }
      if (nameCol > 0) rollCol = 0;
      var si = 0;
      for (i = 0; i < w; i++) {
        if (i === nameCol) col[i] = { type: 'name' };
        else if (i === rollCol) col[i] = { type: 'roll' };
        else if (i > nameCol && si < c.subjects.length) col[i] = { type: 'subj', subj: c.subjects[si++] };
        else col[i] = { type: 'skip' };
      }
    }
    if (nameCol < 0 || !body.length) { EDU.toast(t('nothing_found')); return false; }
    /* match header subjects to existing subjects (by name), or create them */
    var newSubs = 0;
    col.forEach(function (m) {
      if (!m || m.type !== 'subj' || m.subj) return;
      var key = normName(m.h.name);
      var found = c.subjects.filter(function (s) { return normName(s.name) === key; })[0];
      if (!found) {
        if (c.subjects.length >= 25) { m.type = 'skip'; return; }
        found = { id: uid(), name: m.h.name.slice(0, 40), max: m.h.max > 0 && m.h.max <= 1000 ? m.h.max : 100 };
        c.subjects.push(found); newSubs++;
      } else if (m.h.max > 0 && m.h.max <= 1000) found.max = m.h.max;
      m.subj = found;
    });
    var added = 0, updated = 0, roll = nextRoll(c);
    body.forEach(function (r) {
      var name = (r[nameCol] || '').trim().slice(0, 80);
      if (!name) return;
      var rl = rollCol >= 0 ? latin(r[rollCol] || '').trim().slice(0, 12) : '';
      var key = normName(name);
      var st = c.students.filter(function (s) { return normName(s.name) === key && (!rl || !s.roll || s.roll === rl); })[0];
      if (st) updated++;
      else {
        if (c.students.length >= 800) return;
        st = { id: uid(), roll: '', name: name, marks: {}, present: '', remark: '' };
        c.students.push(st); added++;
      }
      if (rl) st.roll = rl; else if (!st.roll) st.roll = String(roll++);
      col.forEach(function (m, i) {
        var v = (r[i] || '').trim();
        if (!m || !v) return;
        if (m.type === 'subj') st.marks[m.subj.id] = normMark(v);
        else if (m.type === 'present') st.present = latin(v);
        else if (m.type === 'remark') st.remark = v.slice(0, 600);
      });
    });
    if (!added && !updated) { EDU.toast(t('nothing_found')); return false; }
    save(true);
    EDU.toast(t('imported', { added: EDU.fmt(added), updated: EDU.fmt(updated) }) + (newSubs ? ' ' + t('subjects_added', { n: EDU.fmt(newSubs) }) : ''));
    return true;
  }
  $('#add-students').addEventListener('click', function () {
    var ta = $('#paste');
    if (importText(ta.value)) { ta.value = ''; showTab('marks'); }
  });
  $('#paste').addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) $('#add-students').click(); });
  $('#import-csv').addEventListener('click', function () {
    EDU.pickFile('.csv,.tsv,.txt,text/csv,text/plain').then(function (f) {
      if (!f) return;
      if (f.size > 3 * 1024 * 1024) { EDU.toast(t('bad_file')); return; }
      EDU.readText(f).then(function (txt) {
        if (/[\u0000-\u0008]/.test(txt.slice(0, 2000))) { EDU.toast(t('excel_hint')); return; }
        if (importText(txt)) showTab('marks');
      }).catch(function () { EDU.toast(t('bad_file')); });
    });
  });
  $('#template-csv').addEventListener('click', function () {
    var c = cls();
    var head = [t('col_roll'), t('col_name')].concat(c.subjects.map(function (s) { return s.name + ' (' + r2(maxOf(s)) + ')'; }));
    var rows = [head].concat(c.students.map(function (st) {
      return [st.roll, st.name].concat(c.subjects.map(function (s) { return st.marks[s.id] || ''; }));
    }));
    if (!c.students.length) rows.push(['1', ''].concat(c.subjects.map(function () { return ''; })));
    EDU.download(fileBase(c) + '-template.csv', EDU.csv.stringify(rows), 'text/csv');
  });

  /* ---- school, logo, backup ---- */
  function renderLogo() {
    var img = $('#sc-logo-img'), has = !!data.school.logo;
    img.hidden = !has;
    if (has) img.src = data.school.logo; else img.removeAttribute('src');
    $('#sc-logo-rm').hidden = !has;
  }
  $('#sc-logo-up').addEventListener('click', function () {
    EDU.pickFile('image/*').then(function (f) {
      if (!f) return;
      if (!/^image\//.test(f.type || '') || f.size > 15 * 1024 * 1024) { EDU.toast(t('bad_file')); return; }
      var rd = new FileReader();
      rd.onerror = function () { EDU.toast(t('bad_file')); };
      rd.onload = function () {
        var img = new Image();
        img.onerror = function () { EDU.toast(t('bad_file')); };
        img.onload = function () {
          try {
            var k = Math.min(1, 240 / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
            var cv = document.createElement('canvas');
            cv.width = Math.max(1, Math.round((img.naturalWidth || 240) * k));
            cv.height = Math.max(1, Math.round((img.naturalHeight || 240) * k));
            cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
            var url = cv.toDataURL('image/png');
            if (url.length > 300000) url = cv.toDataURL('image/jpeg', 0.85);
            data.school.logo = url; save(true); renderLogo();
            EDU.toast(t('logo_saved'));
          } catch (e) { EDU.toast(t('bad_file')); }
        };
        img.src = rd.result;
      };
      rd.readAsDataURL(f);
    });
  });
  $('#sc-logo-rm').addEventListener('click', function () { data.school.logo = ''; save(true); renderLogo(); });
  $('#backup').addEventListener('click', function () {
    var d = new Date(), stamp = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    EDU.download('marks-backup-' + stamp + '.json', JSON.stringify({ app: SLUG, v: 1, saved: d.toISOString(), data: data }), 'application/json');
  });
  $('#restore').addEventListener('click', function () {
    EDU.pickFile('.json,application/json').then(function (f) {
      if (!f) return;
      EDU.readText(f).then(function (txt) {
        var obj = null;
        try { obj = JSON.parse(txt); } catch (e) { obj = null; }
        var d = obj && fixData(obj.data || obj);
        if (!d) { EDU.toast(t('bad_file')); return; }
        if (!confirm(t('confirm_restore'))) return;
        data = d; rcIndex = 0; save(true); renderAll();
        EDU.toast(t('restored'));
      }).catch(function () { EDU.toast(t('bad_file')); });
    });
  });
  $('#reset-all').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    data = freshData(); rcIndex = 0; distKey = 'all'; save(true); renderAll();
  });
  $('#goto-school').addEventListener('click', function () { showTab('setup'); setTimeout(function () { $('#sc-name').focus(); }, 30); });

  /* ---------------- marks grid ---------------- */
  function renderMarks() {
    var c = cls();
    var mt = $('#mk-title'); mt.innerHTML = ''; classLabelEl(c).forEach(function (x) { if (x) mt.appendChild(typeof x === 'string' ? document.createTextNode(x) : x); });
    var head = $('#marks-head'), body = $('#marks-body');
    head.innerHTML = ''; body.innerHTML = '';
    var noSub = !c.subjects.length, noSt = !c.students.length;
    $('#mk-empty').hidden = !(noSub || noSt);
    $('#mk-empty-txt').textContent = noSub ? t('no_subjects') : t('no_students');
    $('#mk-wrap').hidden = noSub;
    $('#mk-legend').hidden = noSub || noSt;
    if (noSub) { $('#mk-summary').textContent = ''; return; }
    var R0 = compute(c);
    var tr = el('tr', null,
      el('th', { scope: 'col', class: 'c-roll', text: t('col_roll') }),
      el('th', { scope: 'col', class: 'c-name sticky', text: t('col_name') }));
    c.subjects.forEach(function (s) {
      tr.appendChild(el('th', { scope: 'col', class: 'c-sub' },
        el('span', { class: 'sub-name no-i18n', text: s.name || '—' }),
        el('span', { class: 'sub-max', text: '/ ' + fmtN(maxOf(s)) })));
    });
    tr.appendChild(el('th', { scope: 'col', class: 'c-calc' }, el('span', { class: 'sub-name', text: t('col_total') }), el('span', { class: 'sub-max', text: '/ ' + fmtN(R0.maxTotal) })));
    ['col_pct', 'col_grade', 'col_rank', 'col_result'].forEach(function (k) { tr.appendChild(el('th', { scope: 'col', class: 'c-calc', text: t(k) })); });
    tr.appendChild(el('th', { scope: 'col', class: 'c-del' }, el('span', { class: 'sr-only', text: t('delete_student') })));
    head.appendChild(tr);

    c.students.forEach(function (st, r) {
      var row = el('tr', { dataset: { sid: st.id, roll: st.roll } });
      var roll = el('input', { type: 'text', class: 'cellin rl', inputmode: 'numeric', maxlength: '12', autocomplete: 'off', 'aria-label': t('col_roll'), dataset: { r: r, c: 0 } });
      roll.value = st.roll;
      var nm = el('input', { type: 'text', class: 'cellin nm no-i18n', dir: 'auto', maxlength: '80', autocomplete: 'off', placeholder: t('student_name_ph'), 'aria-label': t('col_name'), dataset: { r: r, c: 1 } });
      nm.value = st.name;
      row.appendChild(el('td', { class: 'c-roll' }, roll));
      row.appendChild(el('th', { scope: 'row', class: 'c-name sticky' }, nm));
      c.subjects.forEach(function (s, j) {
        var inp = el('input', { type: 'text', class: 'cellin mk no-i18n', inputmode: 'decimal', maxlength: '7', autocomplete: 'off', 'aria-label': (st.name || t('col_name')) + ' · ' + (s.name || ''), dataset: { r: r, c: j + 2, s: j } });
        inp.value = st.marks[s.id] == null ? '' : st.marks[s.id];
        row.appendChild(el('td', { class: 'c-mk' }, inp));
      });
      row.appendChild(el('td', { class: 'c-total num' }));
      row.appendChild(el('td', { class: 'c-pct num' }));
      row.appendChild(el('td', { class: 'c-grade' }));
      row.appendChild(el('td', { class: 'c-rank num' }));
      row.appendChild(el('td', { class: 'c-result' }));
      row.appendChild(el('td', { class: 'c-del' }, el('button', { class: 'btn btn-sm btn-ghost del', type: 'button', 'aria-label': t('delete_student'), title: t('delete_student'), text: '✕', dataset: { r: r } })));
      body.appendChild(row);
    });
    refreshComputed();
  }
  function setCalc(tr, sel, node, val) {
    var td = tr.querySelector(sel);
    td.innerHTML = '';
    td.appendChild(typeof node === 'string' ? document.createTextNode(node) : node);
    td.setAttribute('data-val', val == null ? '' : String(val));
  }
  function refreshComputed() {
    var c = cls(), R = compute(c), trs = $$('#marks-body tr');
    R.rows.forEach(function (r, i) {
      var tr = trs[i];
      if (!tr) return;
      r.cells.forEach(function (x, j) {
        var inp = tr.querySelector('input.mk[data-s="' + j + '"]');
        if (!inp) return;
        inp.classList.toggle('bad', x.st === 'bad');
        inp.classList.toggle('ab', x.st === 'ab');
        inp.classList.toggle('low', x.st === 'ok' && !x.pass);
        inp.setAttribute('aria-invalid', x.st === 'bad' ? 'true' : 'false');
        if (x.st === 'bad') inp.title = x.why === 'max' ? t('err_max', { max: fmtN(maxOf(c.subjects[j])) }) : t('err_nan');
        else inp.removeAttribute('title');
      });
      setCalc(tr, '.c-total', r.complete ? fmtN(r.total) : '—', r.complete ? r.total : '');
      setCalc(tr, '.c-pct', r.complete ? fmtPct(r.pct) : '—', r.complete ? r2(r.pct) : '');
      setCalc(tr, '.c-grade', gradeBadge(r.grade), r.grade ? r.grade.g : '');
      setCalc(tr, '.c-rank', r.rank ? EDU.fmt(r.rank) : '—', r.rank || '');
      setCalc(tr, '.c-result', resultBadge(r), r.result);
    });
    var S = classStats(R);
    $('#mk-summary').textContent = S.n
      ? t('mk_summary', { n: EDU.fmt(c.students.length), p: EDU.fmt(S.passed), m: EDU.fmt(S.n), avg: fmtPct(S.avg) })
      : (c.students.length ? t('mk_summary_none', { n: EDU.fmt(c.students.length) }) : '');
  }
  var mb = $('#marks-body');
  mb.addEventListener('input', function (e) {
    var inp = e.target, c = cls();
    if (!inp.classList || !inp.classList.contains('cellin')) return;
    var st = c.students[+inp.dataset.r];
    if (!st) return;
    if (inp.classList.contains('mk')) { st.marks[c.subjects[+inp.dataset.s].id] = inp.value; refreshComputed(); }
    else if (inp.classList.contains('nm')) st.name = inp.value;
    else if (inp.classList.contains('rl')) { st.roll = latin(inp.value); inp.closest('tr').setAttribute('data-roll', st.roll); }
    save();
  });
  mb.addEventListener('change', function (e) {
    var inp = e.target, c = cls();
    if (!inp.classList || !inp.classList.contains('mk')) return;
    var st = c.students[+inp.dataset.r], s = c.subjects[+inp.dataset.s];
    if (!st || !s) return;
    var v = normMark(inp.value);
    if (v !== inp.value) { inp.value = v; st.marks[s.id] = v; save(); refreshComputed(); }
  });
  mb.addEventListener('focusin', function (e) {
    var inp = e.target;
    if (inp.classList && inp.classList.contains('cellin')) setTimeout(function () { try { if (document.activeElement === inp) inp.select(); } catch (er) { } }, 0);
  });
  mb.addEventListener('keydown', function (e) {
    var inp = e.target;
    if (!inp.classList || !inp.classList.contains('cellin')) return;
    var c = cls(), r = +inp.dataset.r, col = +inp.dataset.c, dr = 0, dc = 0;
    var lastR = c.students.length - 1, lastC = c.subjects.length + 1;
    if (e.key === 'Enter') dr = e.shiftKey ? -1 : 1;
    else if (e.key === 'ArrowDown') dr = 1;
    else if (e.key === 'ArrowUp') dr = -1;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      var rtl = document.documentElement.dir === 'rtl';
      var fwd = (e.key === 'ArrowRight') !== rtl;
      var a = inp.selectionStart, b = inp.selectionEnd, len = inp.value.length;
      var all = a === 0 && b === len;
      if (!(all || (fwd ? a === len : b === 0))) return;
      dc = fwd ? 1 : -1;
    } else return;
    var nr = r + dr, nc = col + dc;
    if (e.key === 'Enter') {
      if (nr > lastR) { nr = 0; nc = col + 1; }
      else if (nr < 0) { nr = lastR; nc = col - 1; }
      if (nc > lastC || nc < 0) { nr = r; nc = col; }
    }
    var target = mb.querySelector('.cellin[data-r="' + nr + '"][data-c="' + nc + '"]');
    e.preventDefault();
    if (target && target !== inp) { target.focus(); target.select(); }
  });
  mb.addEventListener('paste', function (e) {
    var inp = e.target;
    if (!inp.classList || !inp.classList.contains('cellin')) return;
    var text = (e.clipboardData || window.clipboardData).getData('text') || '';
    text = text.replace(/[\r\n]+$/, '');
    if (!/[\t\r\n]/.test(text)) return;          // a single value: let the browser paste it
    e.preventDefault();
    var c = cls(), r0 = +inp.dataset.r, c0 = +inp.dataset.c, n = 0;
    var lines = text.split(/\r\n|\n|\r/).slice(0, 800).map(function (l) { return l.split('\t'); });
    lines.forEach(function (cells, i) {
      var st = c.students[r0 + i];
      if (!st) {
        if (c0 > 1 || c.students.length >= 800) return;   // only pasting names / rolls may add rows
        st = { id: uid(), roll: String(nextRoll(c)), name: '', marks: {}, present: '', remark: '' };
        c.students.push(st);
      }
      cells.forEach(function (v, j) {
        var k = c0 + j;
        v = String(v).trim();
        if (k === 0) { if (v) st.roll = latin(v).slice(0, 12); }
        else if (k === 1) { if (v) st.name = v.slice(0, 80); }
        else if (k - 2 < c.subjects.length) { st.marks[c.subjects[k - 2].id] = normMark(v); n++; }
      });
    });
    save(true);
    renderMarks();
    EDU.toast(t('pasted', { n: EDU.fmt(lines.length) }));
    var back = mb.querySelector('.cellin[data-r="' + r0 + '"][data-c="' + c0 + '"]');
    if (back) back.focus();
  });
  mb.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button.del');
    if (!b) return;
    var c = cls(), r = +b.dataset.r, st = c.students[r];
    if (!st) return;
    if (!confirm(t('confirm_delete_student', { name: st.name || ('#' + st.roll) }))) return;
    c.students.splice(r, 1);
    save(true); renderMarks();
  });
  $('#add-row').addEventListener('click', function () {
    var c = cls();
    if (c.students.length >= 800) return;
    c.students.push({ id: uid(), roll: String(nextRoll(c)), name: '', marks: {}, present: '', remark: '' });
    save(); renderMarks();
    var ins = $$('#marks-body input.nm');
    if (ins.length) ins[ins.length - 1].focus();
  });
  $('#mk-goto-setup').addEventListener('click', function () { showTab('setup'); });

  /* ---------------- analysis ---------------- */
  function tile(label, value, id, val, sub, subUser) {
    return el('div', { class: 'stat' },
      el('div', { class: 'stat-l', text: label }),
      el('div', { class: 'stat-v', id: id, 'data-val': val == null ? '' : String(val), text: value }),
      sub ? el('div', { class: 'stat-s small muted' + (subUser ? ' no-i18n' : ''), text: sub }) : null);
  }
  function renderAnalysis() {
    var c = cls(), R = compute(c), root = $('#an-root');
    root.innerHTML = '';
    if (!c.subjects.length || !c.students.length) {
      root.appendChild(el('div', { class: 'callout warning', text: t('no_data') }));
      return;
    }
    var S = classStats(R);
    var ranked = R.done.slice().sort(function (a, b) { return a.rank - b.rank; });
    root.appendChild(el('h2', { class: 'no-i18n an-title' }, classLabelEl(c)));
    root.appendChild(el('div', { class: 'tiles', 'aria-live': 'polite' },
      tile(t('an_students'), EDU.fmt(c.students.length), 'an-students', c.students.length),
      tile(t('an_average'), S.n ? fmtPct(S.avg) : '—', 'an-avg', S.n ? r2(S.avg) : ''),
      tile(t('an_pass'), S.n ? fmtPct(S.passed * 100 / S.n) : '—', 'an-pass', S.passed, t('n_of_m', { n: EDU.fmt(S.passed), m: EDU.fmt(S.n) })),
      tile(t('an_highest'), ranked.length ? fmtPct(ranked[0].pct) : '—', 'an-high', ranked.length ? r2(ranked[0].pct) : '', ranked.length ? ranked[0].st.name : '', true)));
    var missing = R.rows.length - R.done.length;
    if (missing) root.appendChild(el('p', { class: 'callout warning small', text: t('an_incomplete', { n: EDU.fmt(missing) }) }));

    var grid = el('div', { class: 'an-grid' });
    root.appendChild(grid);

    /* top 3 */
    var top = el('div', { class: 'card stack' }, el('h3', { text: '🏆 ' + t('top3') }));
    var podium = ranked.filter(function (r) { return r.rank <= 3; }).slice(0, 6);
    if (!podium.length) top.appendChild(el('p', { class: 'muted', text: t('no_data') }));
    var ol = el('ol', { class: 'top3', id: 'an-top' });
    podium.forEach(function (r) {
      ol.appendChild(el('li', { 'data-rank': r.rank },
        el('span', { class: 'medal', 'aria-hidden': 'true', text: ['🥇', '🥈', '🥉'][r.rank - 1] }),
        el('span', { class: 'top-name no-i18n' }, el('bdi', { text: r.st.name || '—' })),
        el('span', { class: 'top-pct', text: fmtPct(r.pct) }),
        gradeBadge(r.grade)));
    });
    if (podium.length) top.appendChild(ol);
    grid.appendChild(top);

    /* grade distribution */
    var dist = el('div', { class: 'card stack' });
    var sel = el('select', { id: 'dist-sel', class: 'no-i18n', 'aria-label': t('dist_for') });
    sel.appendChild(el('option', { value: 'all', text: t('dist_overall') }));
    c.subjects.forEach(function (s) { sel.appendChild(el('option', { value: s.id, text: s.name || '—' })); });
    if (distKey !== 'all' && !c.subjects.some(function (s) { return s.id === distKey; })) distKey = 'all';
    sel.value = distKey;
    sel.addEventListener('change', function () { distKey = sel.value; renderAnalysis(); });
    var counts = GRADES.map(function () { return 0; });
    var j = -1;
    c.subjects.forEach(function (s, k) { if (s.id === distKey) j = k; });
    R.rows.forEach(function (r) {
      var g = distKey === 'all' ? r.grade : (r.cells[j] && r.cells[j].grade);
      if (g) counts[GRADES.indexOf(g)]++;
    });
    dist.appendChild(el('div', { class: 'row spread' }, el('h3', { class: 'mb0', text: '📊 ' + t('grade_dist') }),
      el('label', { class: 'row small dist-pick' }, el('span', { text: t('dist_for') }), sel)));
    dist.appendChild(bars(counts));
    grid.appendChild(dist);

    /* subject table */
    var ss = subjectStats(c, R);
    var tbl = el('table', { class: 'table an-table', id: 'an-subjects' },
      el('thead', null, el('tr', null,
        el('th', { scope: 'col', text: t('subject_name') }),
        el('th', { scope: 'col', class: 'num', text: t('max_marks') }),
        el('th', { scope: 'col', text: t('col_avg') }),
        el('th', { scope: 'col', class: 'num', text: t('col_high') }),
        el('th', { scope: 'col', class: 'num', text: t('col_low') }),
        el('th', { scope: 'col', class: 'num', text: t('col_passed') }))));
    var tb = el('tbody');
    ss.forEach(function (x) {
      var pc = x.avgPct == null ? 0 : EDU.clamp(x.avgPct, 0, 100);
      tb.appendChild(el('tr', null,
        el('th', { scope: 'row', class: 'no-i18n', text: x.s.name || '—' }),
        el('td', { class: 'num', text: fmtN(x.max) }),
        el('td', null,
          el('div', { class: 'avg-line' },
            el('span', { class: 'num avg-v', text: x.avg == null ? '—' : fmtN(x.avg) + ' (' + fmtPct(x.avgPct) + ')' }),
            el('span', { class: 'avg-track', 'aria-hidden': 'true' }, el('span', { class: 'avg-fill ' + (x.avgPct == null ? '' : gradeOf(x.avgPct).cls), style: { width: pc + '%' } })))),
        el('td', { class: 'num', text: x.hi ? fmtN(x.hi.v) : '—' }),
        el('td', { class: 'num', text: x.lo ? fmtN(x.lo.v) : '—' }),
        el('td', { class: 'num' }, x.n ? t('n_of_m', { n: EDU.fmt(x.passed), m: EDU.fmt(x.n) }) : '—',
          x.ab ? el('div', { class: 'tiny muted', text: t('an_absent', { n: EDU.fmt(x.ab) }) }) : null)));
    });
    tbl.appendChild(tb);
    root.appendChild(el('div', { class: 'card stack' },
      el('h3', { text: '📚 ' + t('subject_analysis') }),
      el('div', { class: 'scroll-x' }, tbl),
      el('p', { class: 'tiny muted mb0', text: t('pass_rule_' + (c.each ? 'each' : 'overall'), { p: EDU.fmt(R.pass) }) })));

    /* students who need support */
    var weak = R.rows.filter(function (r) { return r.result === 'fail'; });
    var sup = el('div', { class: 'card stack' }, el('h3', { text: '🤝 ' + t('need_support') }));
    if (!weak.length) sup.appendChild(el('p', { class: 'callout success mb0', text: R.done.length ? t('all_passed') : t('no_data') }));
    else {
      var ul = el('ul', { class: 'support', id: 'an-support' });
      weak.forEach(function (r) {
        ul.appendChild(el('li', null,
          el('strong', { class: 'no-i18n', text: (r.st.roll ? r.st.roll + '. ' : '') + (r.st.name || '—') }), ' ',
          el('span', { class: 'muted small', text: fmtPct(r.pct) }),
          r.failed.length ? el('div', { class: 'small' }, el('span', { text: t('needs_improve_in') + ' ' }), el('span', { class: 'no-i18n', text: r.failed.join(', ') })) : null));
      });
      sup.appendChild(ul);
    }
    root.appendChild(sup);
  }
  function bars(counts) {
    var max = Math.max.apply(null, counts.concat([1]));
    var wrap = el('div', { class: 'bars', id: 'an-bars', role: 'img', 'aria-label': t('grade_dist') + ': ' + GRADES.map(function (g, i) { return g.g + ' = ' + counts[i]; }).join(', ') });
    GRADES.forEach(function (g, i) {
      wrap.appendChild(el('div', { class: 'bar-col', 'data-grade': g.g, 'data-count': counts[i] },
        el('span', { class: 'bar-n', text: EDU.fmt(counts[i]) }),
        el('div', { class: 'bar-track' }, el('div', { class: 'gbar ' + g.cls, style: { height: (counts[i] / max * 100) + '%' } })),
        el('span', { class: 'bar-l', text: g.g })));
    });
    return wrap;
  }

  /* ---------------- report cards ---------------- */
  function renderCards() {
    var c = cls(), R = compute(c), sel = $('#rc-student'), n = c.students.length;
    sel.innerHTML = '';
    c.students.forEach(function (st, i) { sel.appendChild(el('option', { value: String(i), text: (st.roll ? st.roll + '. ' : '') + (st.name || '—') })); });
    $('#rc-editor-body').hidden = !n;
    $('#rc-none').hidden = !!n;
    $('#rc-none').textContent = !c.subjects.length ? t('no_subjects') : t('no_students');
    var prev = $('#rc-preview');
    prev.innerHTML = '';
    if (!n || !c.subjects.length) return;
    rcIndex = EDU.clamp(rcIndex, 0, n - 1);
    sel.value = String(rcIndex);
    var st = c.students[rcIndex];
    setVal('#rc-present', st.present);
    $('#rc-days').textContent = c.days ? t('out_of', { n: c.days }) : t('days_hint');
    setVal('#rc-remark', st.remark);
    $('#rc-prev').disabled = rcIndex === 0;
    $('#rc-next').disabled = rcIndex === n - 1;
    $('#rc-pos').textContent = EDU.fmt(rcIndex + 1) + ' / ' + EDU.fmt(n);
    var chips = $('#rc-sugg');
    chips.innerHTML = '';
    content().remarks.forEach(function (txt) {
      chips.appendChild(el('button', { class: 'chip', type: 'button', text: txt, onclick: function () {
        var s = cls().students[rcIndex];
        s.remark = s.remark.trim() ? s.remark.trim() + ' ' + txt : txt;
        $('#rc-remark').value = s.remark; save(); updatePreview();
      } }));
    });
    prev.appendChild(buildCard(c, R, rcIndex));
  }
  function updatePreview() {
    var c = cls();
    if (!c.students.length || !c.subjects.length) return;
    var prev = $('#rc-preview');
    prev.innerHTML = '';
    prev.appendChild(buildCard(c, compute(c), rcIndex));
  }
  $('#rc-student').addEventListener('change', function (e) { rcIndex = +e.target.value || 0; renderCards(); });
  $('#rc-prev').addEventListener('click', function () { rcIndex--; renderCards(); });
  $('#rc-next').addEventListener('click', function () { rcIndex++; renderCards(); });
  $('#rc-present').addEventListener('input', function (e) { var s = cls().students[rcIndex]; if (s) { s.present = latin(e.target.value).trim(); save(); updatePreview(); } });
  $('#rc-remark').addEventListener('input', function (e) { var s = cls().students[rcIndex]; if (s) { s.remark = e.target.value; save(); updatePreview(); } });
  $('#rc-auto').addEventListener('click', function () {
    var c = cls(), R = compute(c), n = 0;
    R.rows.forEach(function (r) { if (!r.st.remark.trim()) { var a = autoRemark(r); if (a) { r.st.remark = a; n++; } } });
    save(true); renderCards();
    EDU.toast(t('auto_done', { n: EDU.fmt(n) }));
  });
  $('#rc-print').addEventListener('click', function () { doPrint('card'); });
  $('#rc-print-all').addEventListener('click', function () { doPrint('all'); });

  function kv(label, value, user, id) {
    return el('div', { class: 'rc-kv' }, el('span', { class: 'rc-k', text: label }), el('span', { class: 'rc-v' + (user ? ' no-i18n' : ''), dir: user ? 'auto' : null, id: id, text: value || '—' }));
  }
  function buildCard(c, R, i) {
    var r = R.rows[i], st = r.st, S = data.school;
    var card = el('article', { class: 'rc', 'data-sid': st.id });
    card.appendChild(el('header', { class: 'rc-head' + (S.logo || S.name || S.addr ? '' : ' rc-head-empty') },
      S.logo ? el('img', { class: 'rc-logo', src: S.logo, alt: '' }) : null,
      el('div', { class: 'rc-school' },
        S.name ? el('div', { class: 'rc-sname no-i18n', text: S.name })
          : el('button', { class: 'btn btn-sm rc-addschool no-print', type: 'button', text: '＋ ' + t('rc_add_school'), onclick: function () { showTab('setup'); setTimeout(function () { $('#sc-name').focus(); }, 30); } }),
        S.addr ? el('div', { class: 'rc-addr no-i18n', text: S.addr }) : null),
      S.logo ? el('div', { class: 'rc-logo-pad', 'aria-hidden': 'true' }) : null));
    card.appendChild(el('div', { class: 'rc-title' }, el('span', { text: t('rc_title') }), c.term ? el('span', { class: 'no-i18n rc-term', dir: 'auto', text: c.term }) : null));
    var days = num(c.days, 0), pres = st.present === '' ? NaN : num(st.present, NaN);
    card.appendChild(el('div', { class: 'rc-info' },
      kv(t('rc_name'), st.name, true),
      kv(t('rc_roll'), st.roll, true),
      kv(t('rc_class'), c.name, true),
      days > 0 ? kv(t('attendance'), t('rc_att_val', { p: isFinite(pres) ? fmtN(pres) : '—', d: fmtN(days), pct: isFinite(pres) ? fmtPct(Math.min(100, pres * 100 / days)) : '—' })) : null));
    var tb = el('tbody');
    c.subjects.forEach(function (s, j) {
      var x = r.cells[j], has = x.st === 'ok' || x.st === 'ab';
      tb.appendChild(el('tr', { class: has && !x.pass ? 'rc-low' : '' },
        el('td', { class: 'no-i18n', text: s.name || '—' }),
        el('td', { class: 'num', text: fmtN(maxOf(s)) }),
        el('td', { class: 'num strong', text: x.st === 'ok' ? fmtN(x.v) : x.st === 'ab' ? 'AB' : '—' }),
        el('td', { class: 'num', text: has ? fmtPct(x.pct) : '—' }),
        el('td', { class: 'num strong', text: has ? x.grade.g : '—' })));
    });
    var foot = el('tfoot', null, el('tr', null,
      el('th', { scope: 'row', text: t('rc_total') }),
      el('td', { class: 'num', text: fmtN(R.maxTotal) }),
      el('td', { class: 'num strong rc-total', text: r.complete ? fmtN(r.total) : '—' }),
      el('td', { class: 'num', text: r.complete ? fmtPct(r.pct) : '—' }),
      el('td', { class: 'num strong', text: r.grade ? r.grade.g : '—' })));
    card.appendChild(el('div', { class: 'rc-tablewrap' }, el('table', { class: 'rc-table' },
      el('thead', null, el('tr', null,
        el('th', { scope: 'col', text: t('subject_name') }),
        el('th', { scope: 'col', class: 'num', text: t('max_marks') }),
        el('th', { scope: 'col', class: 'num', text: t('rc_obtained') }),
        el('th', { scope: 'col', class: 'num', text: t('col_pct') }),
        el('th', { scope: 'col', class: 'num', text: t('col_grade') }))), tb, foot)));
    var sum = el('div', { class: 'rc-sum' },
      el('div', { class: 'rc-box' }, el('span', { class: 'rc-k', text: t('rc_percentage') }), el('strong', { class: 'rc-big', text: r.complete ? fmtPct(r.pct) : '—' })),
      el('div', { class: 'rc-box' }, el('span', { class: 'rc-k', text: t('rc_overall_grade') }), el('strong', { class: 'rc-big', text: r.grade ? r.grade.g : '—' })),
      c.showRank ? el('div', { class: 'rc-box' }, el('span', { class: 'rc-k', text: t('col_rank') }), el('strong', { class: 'rc-big', text: r.rank ? t('rc_rank_of', { r: EDU.fmt(r.rank), n: EDU.fmt(R.done.length) }) : '—' })) : null,
      el('div', { class: 'rc-box rc-res-' + r.result }, el('span', { class: 'rc-k', text: t('col_result') }), el('strong', { class: 'rc-big rc-result', text: resultText(r) })));
    card.appendChild(sum);
    if (r.failed.length) card.appendChild(el('p', { class: 'rc-weak' }, el('span', { text: t('needs_improve_in') + ' ' }), el('span', { class: 'no-i18n', text: r.failed.join(', ') })));
    card.appendChild(el('div', { class: 'rc-remarks' }, el('div', { class: 'rc-k', text: t('remarks') }), el('div', { class: 'rc-rtext no-i18n', dir: 'auto', text: st.remark })));
    card.appendChild(el('p', { class: 'rc-scale' },
      el('strong', { text: t('scale_title') + ': ' }),
      GRADES.map(function (g) { return g.g + ' ' + g.range; }).join(' · '),
      el('span', { text: ' (E = ' + t('needs_improvement') + '). ' + t('pass_rule_' + (c.each ? 'each' : 'overall'), { p: EDU.fmt(R.pass) }) })));
    card.appendChild(el('div', { class: 'rc-sigs' },
      el('div', { class: 'rc-sig' }, t('rc_sig_teacher')),
      el('div', { class: 'rc-sig' }, t('rc_sig_principal')),
      el('div', { class: 'rc-sig' }, t('rc_sig_parent'))));
    card.appendChild(el('div', { class: 'rc-date' }, el('span', { text: t('rc_date') + ': ' }), el('span', { class: 'rc-line' })));
    return card;
  }

  /* ---------------- result sheet (print) ---------------- */
  function buildSheet(c, R) {
    var S = data.school, wrap = el('div', { class: 'sheet' });
    wrap.appendChild(el('header', { class: 'rc-head' },
      S.logo ? el('img', { class: 'rc-logo', src: S.logo, alt: '' }) : null,
      el('div', { class: 'rc-school' },
        S.name ? el('div', { class: 'rc-sname no-i18n', text: S.name }) : null,
        S.addr ? el('div', { class: 'rc-addr no-i18n', text: S.addr }) : null,
        el('div', { class: 'rc-title' }, el('span', { text: t('sheet_title') }), el('span', { class: 'no-i18n rc-term' }, classLabelEl(c)))),
      S.logo ? el('div', { class: 'rc-logo-pad' }) : null));
    var head = el('tr', null, el('th', { text: t('col_roll') }), el('th', { text: t('col_name') }));
    c.subjects.forEach(function (s) { head.appendChild(el('th', { class: 'num no-i18n', text: (s.name || '—') + ' (' + fmtN(maxOf(s)) + ')' })); });
    [t('col_total') + ' (' + fmtN(R.maxTotal) + ')', t('col_pct'), t('col_grade'), t('col_rank'), t('col_result')].forEach(function (h) { head.appendChild(el('th', { class: 'num', text: h })); });
    var tb = el('tbody');
    R.rows.forEach(function (r) {
      var tr = el('tr', null, el('td', { text: r.st.roll }), el('td', { class: 'no-i18n', text: r.st.name }));
      r.cells.forEach(function (x) { tr.appendChild(el('td', { class: 'num' + (x.st === 'ok' && !x.pass || x.st === 'ab' ? ' rc-lowc' : ''), text: x.st === 'ok' ? fmtN(x.v) : x.st === 'ab' ? 'AB' : '—' })); });
      tr.appendChild(el('td', { class: 'num strong', text: r.complete ? fmtN(r.total) : '—' }));
      tr.appendChild(el('td', { class: 'num', text: r.complete ? fmtPct(r.pct) : '—' }));
      tr.appendChild(el('td', { class: 'num', text: r.grade ? r.grade.g : '—' }));
      tr.appendChild(el('td', { class: 'num', text: r.rank ? EDU.fmt(r.rank) : '—' }));
      tr.appendChild(el('td', { class: 'num', text: resultText(r) }));
      tb.appendChild(tr);
    });
    wrap.appendChild(el('table', { class: 'sheet-table' }, el('thead', null, head), tb));
    var ss = subjectStats(c, R), st = classStats(R);
    var t2 = el('table', { class: 'sheet-table sheet-sub' }, el('thead', null, el('tr', null,
      el('th', { text: t('subject_name') }), el('th', { class: 'num', text: t('col_avg') }), el('th', { class: 'num', text: t('col_high') }), el('th', { class: 'num', text: t('col_low') }), el('th', { class: 'num', text: t('col_passed') }))));
    var b2 = el('tbody');
    ss.forEach(function (x) {
      b2.appendChild(el('tr', null, el('td', { class: 'no-i18n', text: x.s.name }),
        el('td', { class: 'num', text: x.avg == null ? '—' : fmtN(x.avg) + ' (' + fmtPct(x.avgPct) + ')' }),
        el('td', { class: 'num', text: x.hi ? fmtN(x.hi.v) : '—' }), el('td', { class: 'num', text: x.lo ? fmtN(x.lo.v) : '—' }),
        el('td', { class: 'num', text: x.n ? t('n_of_m', { n: EDU.fmt(x.passed), m: EDU.fmt(x.n) }) : '—' })));
    });
    t2.appendChild(b2);
    var counts = GRADES.map(function () { return 0; });
    R.done.forEach(function (r) { counts[GRADES.indexOf(r.grade)]++; });
    wrap.appendChild(el('div', { class: 'sheet-foot' }, t2,
      el('div', { class: 'sheet-stats' },
        el('p', null, el('strong', { text: t('an_students') + ': ' }), EDU.fmt(c.students.length)),
        el('p', null, el('strong', { text: t('an_average') + ': ' }), st.n ? fmtPct(st.avg) : '—'),
        el('p', null, el('strong', { text: t('an_pass') + ': ' }), st.n ? t('n_of_m', { n: EDU.fmt(st.passed), m: EDU.fmt(st.n) }) + ' (' + fmtPct(st.passed * 100 / st.n) + ')' : '—'),
        el('p', null, el('strong', { text: t('grade_dist') + ': ' }), GRADES.map(function (g, i) { return g.g + ' ' + counts[i]; }).join(' · ')),
        el('p', { class: 'tiny' }, t('pass_rule_' + (c.each ? 'each' : 'overall'), { p: EDU.fmt(R.pass) })))));
    wrap.appendChild(el('div', { class: 'rc-sigs' }, el('div', { class: 'rc-sig' }, t('rc_sig_teacher')), el('div', { class: 'rc-sig' }, t('rc_sig_principal'))));
    return wrap;
  }

  /* ---------------- printing ---------------- */
  var printReady = false;
  function preparePrint(kind) {
    var root = $('#print-root'), c = cls(), R = compute(c);
    root.innerHTML = '';
    $('#page-size').textContent = kind === 'sheet' ? '@page { size: A4 landscape; margin: 9mm; }' : '@page { size: A4 portrait; margin: 9mm; }';
    if (!c.subjects.length) { root.appendChild(el('p', { text: t('no_subjects') })); }
    else if (kind === 'sheet') root.appendChild(buildSheet(c, R));
    else if (!c.students.length) root.appendChild(el('p', { text: t('no_students') }));
    else if (kind === 'all') c.students.forEach(function (s, i) { root.appendChild(buildCard(c, R, i)); });
    else root.appendChild(buildCard(c, R, EDU.clamp(rcIndex, 0, c.students.length - 1)));
    printReady = true;
  }
  function doPrint(kind) {
    preparePrint(kind);
    var imgs = $$('#print-root img');
    Promise.all(imgs.map(function (im) { return im.decode ? im.decode().catch(function () { }) : null; })).then(function () {
      try { window.print(); } catch (e) { }
      printReady = false;
    });
  }
  window.addEventListener('beforeprint', function () { if (!printReady) preparePrint(data.tab === 'cards' ? 'card' : 'sheet'); });
  window.addEventListener('afterprint', function () { printReady = false; });

  /* ---------------- CSV export ---------------- */
  function exportCSV() {
    var c = cls(), R = compute(c);
    var head = [t('col_roll'), t('col_name')]
      .concat(c.subjects.map(function (s) { return s.name + ' (' + r2(maxOf(s)) + ')'; }))
      .concat([t('col_total') + ' (' + r2(R.maxTotal) + ')', t('col_pct'), t('col_grade'), t('col_rank'), t('col_result'), t('days_present'), t('remarks')]);
    var rows = [head].concat(R.rows.map(function (r) {
      return [r.st.roll, r.st.name]
        .concat(r.cells.map(function (x, j) { return x.st === 'ab' ? 'AB' : (r.st.marks[c.subjects[j].id] || ''); }))
        .concat([r.complete ? r.total : '', r.complete ? r2(r.pct).toFixed(2) : '', r.grade ? r.grade.g : '', r.rank || '', resultText(r), r.st.present, r.st.remark]);
    }));
    EDU.download(fileBase(c) + '-results.csv', EDU.csv.stringify(rows), 'text/csv');
    EDU.toast(t('csv_done'));
  }

  EDU.onLang(function () { renderAll(); });
  renderAll();
  save(true);
})();
