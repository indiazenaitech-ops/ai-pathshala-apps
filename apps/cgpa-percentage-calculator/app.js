/* CGPA & Percentage Calculator: UI and state. The maths lives in engine.js (window.CGPA).
   Four tabs: CBSE (9.5 rule, 9-point grades, five-subject CGPA, marks needed), University (SGPA/CGPA with credits,
   editable grade scale, percentage formulas, print sheet, CSV), Conversions (% <-> CGPA <-> 4.0 GPA bands) and
   Marks (percentage, best-of-N, weighted average, what do I need in the final). Everything stays on the device. */
(function () {
  'use strict';
  var SLUG = 'cgpa-percentage-calculator';
  var C = window.CGPA;
  var store = EDU.store(SLUG);
  var $ = EDU.$, $$ = EDU.$$, el = EDU.el;
  var TABS = ['cbse', 'uni', 'conv', 'marks'];
  var CB_GRADES = C.CBSE_SCALE.map(function (r) { return r.grade; });
  var FIVE_KEYS = ['sub_english', 'sub_hindi', 'sub_maths', 'sub_science', 'sub_sst'];
  var SAMPLE_KEYS = ['sub_english', 'sub_hindi', 'sub_maths', 'sub_science', 'sub_sst', 'sub_sanskrit', 'smp_math1', 'smp_physics', 'smp_c',
    'smp_english', 'smp_math2', 'smp_chem', 'smp_ds', 'smp_workshop', 'smp_evs'];
  var MAX_SEMS = 12, MAX_SUBJ = 20, MAX_ROWS = 20, MAX_SCALE = 15;

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ================================================================ i18n helpers */
  function isRtl() { return document.documentElement.dir === 'rtl'; }
  /* EDU.t, but in Urdu every inserted value sits in a first-strong isolate so "8.75" and "Semester 1" stay whole */
  function t(key, vars) {
    if (vars && isRtl()) {
      var o = {};
      Object.keys(vars).forEach(function (k) { o[k] = '⁨' + vars[k] + '⁩'; });
      vars = o;
    }
    return EDU.t(key, vars);
  }
  function f2(v) { return v === null || v === undefined || !isFinite(v) ? '–' : EDU.fmt(v, { maximumFractionDigits: 2 }); }
  function pctText(v) { return v === null || v === undefined || !isFinite(v) ? '–' : f2(v) + ' %'; }
  function setText(id, txt) { var n = $('#' + id); if (n) n.textContent = txt; }
  function setData(id, k, v) { var n = $('#' + id); if (n) { if (v === null || v === undefined) delete n.dataset[k]; else n.dataset[k] = String(v); } }

  /* ================================================================ state */
  function num(v, lo, hi, d) { v = Number(v); if (v === null || !isFinite(v)) return d; return Math.min(hi, Math.max(lo, v)); }
  /* a number the user may leave empty: null stays null, garbage becomes the default */
  function opt(v, lo, hi, d) { if (v === null || v === '' || v === undefined) return null; v = Number(v); if (!isFinite(v)) return d === undefined ? null : d; return Math.min(hi, Math.max(lo, v)); }
  function str(v, max) { return typeof v === 'string' ? v.slice(0, max || 80) : ''; }
  function nameOf(row) { return row.name !== null && row.name !== undefined ? row.name : (row.key ? t(row.key) : ''); }
  function cleanName(row, maxLen) {
    var key = SAMPLE_KEYS.indexOf(row.key) >= 0 ? row.key : null;
    var name = typeof row.name === 'string' ? row.name.slice(0, maxLen || 60) : null;
    if (name === null && !key) name = '';
    return { key: key, name: name };
  }

  function defaults() {
    return {
      tab: 'cbse',
      cbse: {
        cgpa: 8.2, pct: 76, marks: 85, max: 100, mode: 'marks',
        five: [{ key: 'sub_english', name: null, marks: 85, grade: 'A2' }, { key: 'sub_hindi', name: null, marks: 78, grade: 'B1' },
          { key: 'sub_maths', name: null, marks: 92, grade: 'A1' }, { key: 'sub_science', name: null, marks: 67, grade: 'B2' },
          { key: 'sub_sst', name: null, marks: 74, grade: 'B1' }],
        tg: { done: 3, avg: 70, total: 5, target: 75 }
      },
      uni: {
        kind: '10', scale: C.scaleCopy('10'), cur: 0, formula: 'x10', a: 10, b: 0, student: '', college: '', course: '',
        sems: [
          { name: null, subjects: [{ key: 'smp_math1', name: null, credit: 4, grade: 'O' }, { key: 'smp_physics', name: null, credit: 3, grade: 'A+' },
            { key: 'smp_c', name: null, credit: 3, grade: 'A' }, { key: 'smp_english', name: null, credit: 2, grade: 'B+' }] },
          { name: null, subjects: [{ key: 'smp_math2', name: null, credit: 4, grade: 'A+' }, { key: 'smp_chem', name: null, credit: 3, grade: 'A' },
            { key: 'smp_ds', name: null, credit: 4, grade: 'O' }, { key: 'smp_workshop', name: null, credit: 2, grade: 'A' }, { key: 'smp_evs', name: null, credit: 2, grade: 'B+' }] }
        ]
      },
      conv: { src: 'pct', pct: 77.9, cgpa: 8.2, gpa: 3.7, formula: 'x95', a: 10, b: 0 },
      marks: {
        rows: [{ key: 'sub_hindi', name: null, obt: 72, max: 100 }, { key: 'sub_english', name: null, obt: 81, max: 100 }, { key: 'sub_maths', name: null, obt: 95, max: 100 },
          { key: 'sub_science', name: null, obt: 88, max: 100 }, { key: 'sub_sst', name: null, obt: 69, max: 100 }, { key: 'sub_sanskrit', name: null, obt: 90, max: 100 }],
        best: 5,
        wt: { io: 24, im: 30, iw: 30, fo: 52, fm: 70, fw: 70 },
        fn: { io: 24, im: 30, iw: 30, fm: 70, fw: 70, target: 75 }
      }
    };
  }

  /* everything from EDU.store is checked field by field: wrong types, ranges and enums fall back to the defaults */
  function load() {
    var d = defaults(), s = store.get('state', null);
    if (!s || typeof s !== 'object') return d;
    var o = d;
    o.tab = TABS.indexOf(s.tab) >= 0 ? s.tab : 'cbse';
    var cb = s.cbse && typeof s.cbse === 'object' ? s.cbse : {};
    o.cbse.cgpa = opt(cb.cgpa, 0, 10, d.cbse.cgpa); o.cbse.pct = opt(cb.pct, 0, 100, d.cbse.pct);
    o.cbse.marks = opt(cb.marks, 0, 100000, d.cbse.marks); o.cbse.max = num(cb.max, 1, 1000, 100);
    o.cbse.mode = cb.mode === 'grades' ? 'grades' : 'marks';
    if (Array.isArray(cb.five) && cb.five.length === 5) {
      o.cbse.five = cb.five.map(function (r, i) {
        r = r && typeof r === 'object' ? r : {};
        var nm = cleanName({ key: r.key || FIVE_KEYS[i], name: r.name }, 40);
        return { key: nm.key, name: nm.name, marks: opt(r.marks, 0, 100000, null), grade: CB_GRADES.indexOf(r.grade) >= 0 ? r.grade : 'A1' };
      });
    }
    var tg = cb.tg && typeof cb.tg === 'object' ? cb.tg : {};
    o.cbse.tg = { done: opt(tg.done, 0, 50, 3), avg: opt(tg.avg, 0, 100, 70), total: opt(tg.total, 1, 50, 5), target: opt(tg.target, 0, 100, 75) };

    var un = s.uni && typeof s.uni === 'object' ? s.uni : {};
    o.uni.kind = un.kind === '4' ? '4' : '10';
    if (Array.isArray(un.scale) && un.scale.length) {
      o.uni.scale = un.scale.slice(0, MAX_SCALE).map(function (r) { r = r && typeof r === 'object' ? r : {}; return { g: str(r.g, 4).trim(), p: num(r.p, 0, 20, 0) }; })
        .filter(function (r) { return r.g; });
      if (!o.uni.scale.length) o.uni.scale = C.scaleCopy(o.uni.kind);
    } else o.uni.scale = C.scaleCopy(o.uni.kind);
    var letters = o.uni.scale.map(function (r) { return r.g; });
    if (Array.isArray(un.sems) && un.sems.length) {
      o.uni.sems = un.sems.slice(0, MAX_SEMS).map(function (sm) {
        sm = sm && typeof sm === 'object' ? sm : {};
        var subs = (Array.isArray(sm.subjects) ? sm.subjects : []).slice(0, MAX_SUBJ).map(function (r) {
          r = r && typeof r === 'object' ? r : {};
          var nm = cleanName(r, 60);
          return { key: nm.key, name: nm.name, credit: opt(r.credit, 0, 30, null), grade: letters.indexOf(r.grade) >= 0 ? r.grade : (typeof r.grade === 'string' ? r.grade.slice(0, 4) : letters[0]) };
        });
        return { name: typeof sm.name === 'string' ? sm.name.slice(0, 40) : null, subjects: subs };
      });
    }
    o.uni.cur = Math.round(num(un.cur, 0, o.uni.sems.length - 1, 0));
    o.uni.formula = C.FORMULAS.indexOf(un.formula) >= 0 ? un.formula : 'x10';
    o.uni.a = num(un.a, -1000, 1000, 10); o.uni.b = num(un.b, -1000, 1000, 0);
    o.uni.student = str(un.student, 60); o.uni.college = str(un.college, 80); o.uni.course = str(un.course, 60);

    var cv = s.conv && typeof s.conv === 'object' ? s.conv : {};
    o.conv = { src: ['pct', 'cgpa', 'gpa'].indexOf(cv.src) >= 0 ? cv.src : 'pct', pct: opt(cv.pct, 0, 100, 77.9), cgpa: opt(cv.cgpa, 0, 10, 8.2), gpa: opt(cv.gpa, 0, 4, 3.7),
      formula: C.FORMULAS.indexOf(cv.formula) >= 0 ? cv.formula : 'x95', a: num(cv.a, -1000, 1000, 10), b: num(cv.b, -1000, 1000, 0) };

    var mk = s.marks && typeof s.marks === 'object' ? s.marks : {};
    if (Array.isArray(mk.rows) && mk.rows.length) {
      o.marks.rows = mk.rows.slice(0, MAX_ROWS).map(function (r) {
        r = r && typeof r === 'object' ? r : {};
        var nm = cleanName(r, 60);
        return { key: nm.key, name: nm.name, obt: opt(r.obt, 0, 100000, null), max: opt(r.max, 0, 100000, null) };
      });
    }
    o.marks.best = Math.round(num(mk.best, 0, MAX_ROWS, 0));
    var w = mk.wt && typeof mk.wt === 'object' ? mk.wt : {};
    o.marks.wt = { io: opt(w.io, 0, 100000, 24), im: opt(w.im, 0, 100000, 30), iw: opt(w.iw, 0, 100, 30), fo: opt(w.fo, 0, 100000, 52), fm: opt(w.fm, 0, 100000, 70), fw: opt(w.fw, 0, 100, 70) };
    var f = mk.fn && typeof mk.fn === 'object' ? mk.fn : {};
    o.marks.fn = { io: opt(f.io, 0, 100000, 24), im: opt(f.im, 0, 100000, 30), iw: opt(f.iw, 0, 100, 30), fm: opt(f.fm, 0, 100000, 70), fw: opt(f.fw, 0, 100, 70), target: opt(f.target, 0, 100, 75) };
    return o;
  }
  var S = load();
  var saveTimer = null;
  function save() { clearTimeout(saveTimer); saveTimer = setTimeout(function () { store.set('state', S); }, 120); }

  /* ================================================================ tabs */
  function showTab(name) {
    if (TABS.indexOf(name) < 0) name = 'cbse';
    S.tab = name; save();
    $$('#tabs [role="tab"]').forEach(function (b) {
      var on = b.dataset.tab === name;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      var p = $('#' + b.getAttribute('aria-controls')); if (p) p.hidden = !on;
    });
  }
  $$('#tabs [role="tab"]').forEach(function (b, i, all) {
    b.addEventListener('click', function () { showTab(b.dataset.tab); });
    b.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      if (isRtl()) d = -d;
      var nx = all[(i + d + all.length) % all.length]; nx.focus(); nx.click(); e.preventDefault();
    });
  });

  /* ================================================================ input helpers */
  function readNum(input) { var v = input.value.trim(); if (v === '') return null; var n = Number(v); return isFinite(n) ? n : null; }
  function setVal(id, v) { var n = $('#' + id); if (n) n.value = v === null || v === undefined ? '' : String(v); }
  /* bind a static numeric input to obj[key] with range checks; `after` re-renders */
  function bindNum(id, get, key, lo, hi, after) {
    var n = $('#' + id);
    n.addEventListener('input', function () {
      var v = readNum(n);
      if (v !== null) v = Math.min(hi, Math.max(lo, v));
      get()[key] = v; save(); after();
    });
    n.addEventListener('blur', function () { var v = get()[key]; if (v !== null && String(v) !== n.value.trim()) n.value = String(v); });
  }
  function bindText(id, get, key, max, after) {
    var n = $('#' + id);
    n.addEventListener('input', function () { get()[key] = n.value.slice(0, max); save(); if (after) after(); });
  }
  function gradeBadge(grade, pass, small) {
    return el('span', { class: 'cg-grade ltr' + (pass ? '' : ' fail') + (small ? ' sm' : ''), text: grade });
  }

  /* ================================================================ 1. CBSE */
  function renderCbseScale() {
    var tb = $('#cb-scale tbody'); tb.innerHTML = '';
    C.CBSE_SCALE.forEach(function (r) {
      var range = r.grade === 'E' ? t('cb_below', { n: '33' }) : EDU.fmt(r.min) + '–' + EDU.fmt(r.max);
      tb.appendChild(el('tr', null,
        el('td', { class: 'g ltr', text: r.grade }),
        el('td', { class: 'num', text: range }),
        el('td', { class: 'v num', text: r.gp ? EDU.fmt(r.gp) : '–' }),
        el('td', { class: 'v num', text: r.gp ? f2(r.gp * C.CBSE_FACTOR) + ' %' : '–' })));
    });
  }
  function updateCbseQuick() {
    var cb = S.cbse;
    var p = cb.cgpa === null ? null : C.cbseCgpaToPct(cb.cgpa);
    setText('cb-cgpa-pct', pctText(p)); setData('cb-cgpa-pct', 'value', p);
    var c = cb.pct === null ? null : C.cbsePctToCgpa(cb.pct);
    setText('cb-pct-cgpa', f2(c)); setData('cb-pct-cgpa', 'value', c);
    var g = cb.marks === null ? null : C.cbseGrade(cb.marks, cb.max);
    var badge = $('#cb-grade');
    badge.textContent = g ? g.grade : '–'; badge.classList.toggle('fail', !!g && !g.pass);
    setData('cb-grade', 'grade', g ? g.grade : null);
    setText('cb-gp', g ? (g.gp ? EDU.fmt(g.gp) : t('cb_e_gp')) : '–'); setData('cb-gp', 'gp', g ? g.gp : null);
    setText('cb-subject-pct', g && g.gp ? pctText(g.gp * C.CBSE_FACTOR) : (g ? pctText(g.pct) : '–'));
  }
  function fiveGp(r) {
    if (S.cbse.mode === 'grades') { var row = C.cbseByGrade(r.grade); return row ? { grade: row.grade, gp: row.gp, pass: row.gp > 0 } : null; }
    return r.marks === null ? null : C.cbseGrade(r.marks, 100);
  }
  function renderFive() {
    var tb = $('#cb-rows'); tb.innerHTML = '';
    var grades = S.cbse.mode === 'grades';
    $('#cb-five-h2').textContent = grades ? t('col_grade_pick') : t('col_marks_100');
    $$('#cb-mode button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.mode === S.cbse.mode ? 'true' : 'false'); });
    S.cbse.five.forEach(function (r, i) {
      var tr = el('tr', { dataset: { i: i } });
      tr.appendChild(el('td', null, el('input', { type: 'text', class: 'no-i18n cb-name', maxlength: '40', value: nameOf(r), 'aria-label': t('col_subject') + ' ' + (i + 1), dataset: { i: i } })));
      if (grades) {
        var sel = el('select', { class: 'cb-grade-sel ltr no-i18n', dataset: { i: i }, 'aria-label': t('col_grade') + ' ' + (i + 1) });
        CB_GRADES.forEach(function (g) { sel.appendChild(el('option', { value: g, text: g, selected: g === r.grade })); });
        tr.appendChild(el('td', null, sel));
      } else {
        tr.appendChild(el('td', null, el('input', { type: 'number', class: 'num cb-mark no-i18n', inputmode: 'decimal', step: '0.5', min: '0', max: '100', dir: 'ltr', value: r.marks === null ? '' : r.marks, dataset: { i: i }, 'aria-label': t('col_marks_100') + ' ' + (i + 1) })));
      }
      tr.appendChild(el('td', { class: 'c cb-g' }));
      tr.appendChild(el('td', { class: 'v num cb-gp' }));
      tb.appendChild(tr);
    });
    updateFive();
  }
  function updateFive() {
    var gps = [], sum = 0;
    S.cbse.five.forEach(function (r, i) {
      var g = fiveGp(r), tr = $('#cb-rows tr[data-i="' + i + '"]');
      if (!tr) return;
      var gc = tr.querySelector('.cb-g'), pc = tr.querySelector('.cb-gp');
      gc.innerHTML = ''; if (g) gc.appendChild(gradeBadge(g.grade, g.pass, true));
      gc.dataset.grade = g ? g.grade : '';
      pc.textContent = g ? (g.gp ? EDU.fmt(g.gp) : '0') : '–';
      if (g) { gps.push(g.gp); sum += g.gp; }
    });
    var o = C.cbseOverall(gps);
    setText('cb-overall', o ? f2(o.cgpa) : '–'); setData('cb-overall', 'cgpa', o ? o.cgpa : null);
    setText('cb-overall-how', o ? t('cb_overall_how', { sum: EDU.fmt(sum), n: EDU.fmt(o.count) }) + (gps.indexOf(0) >= 0 ? ' · ' + t('cb_e_counted') : '') : t('cb_fill_marks'));
    setText('cb-overall-pct', o ? pctText(o.pct) : '–'); setData('cb-overall-pct', 'pct', o ? o.pct : null);
  }
  $('#cb-rows').addEventListener('input', function (e) {
    var i = +e.target.dataset.i, r = S.cbse.five[i]; if (!r) return;
    if (e.target.classList.contains('cb-name')) { r.name = e.target.value.slice(0, 40); r.key = null; }
    else if (e.target.classList.contains('cb-mark')) {
      var v = readNum(e.target); r.marks = v === null ? null : Math.min(100, Math.max(0, v));
      var g = r.marks === null ? null : C.cbseGrade(r.marks, 100); if (g) r.grade = g.grade;
    }
    save(); updateFive();
  });
  $('#cb-rows').addEventListener('change', function (e) {
    if (!e.target.classList.contains('cb-grade-sel')) return;
    var r = S.cbse.five[+e.target.dataset.i]; if (!r) return;
    r.grade = e.target.value; save(); updateFive();
  });
  $$('#cb-mode button').forEach(function (b) { b.addEventListener('click', function () { S.cbse.mode = b.dataset.mode; save(); renderFive(); }); });

  function updateTarget() {
    var g = S.cbse.tg, box = $('#tg-status');
    var r = (g.done === null || g.avg === null || g.total === null || g.target === null) ? { ok: false, status: 'bad_input' } : C.neededAverage(g.done, g.avg, g.total, g.target);
    box.dataset.status = r.status;
    setText('tg-lbl', r.ok ? t('tg_need_lbl', { n: EDU.fmt(r.left) }) : t('tg_need_lbl', { n: '–' }));
    setText('tg-need', r.ok ? pctText(r.need) : '–'); setData('tg-need', 'value', r.ok ? r.need : null);
    var msg = '';
    if (!r.ok) msg = t('tg_bad_input');
    else if (r.status === 'possible') msg = t('tg_possible', { need: f2(r.need), n: EDU.fmt(r.left), target: f2(g.target) });
    else if (r.status === 'done') msg = t('tg_done_msg', { target: f2(g.target) });
    else msg = t('tg_impossible', { need: f2(r.need) });
    setText('tg-text', msg);
  }
  bindNum('cb-cgpa', function () { return S.cbse; }, 'cgpa', 0, 10, updateCbseQuick);
  bindNum('cb-pct', function () { return S.cbse; }, 'pct', 0, 100, updateCbseQuick);
  bindNum('cb-marks', function () { return S.cbse; }, 'marks', 0, 100000, updateCbseQuick);
  $('#cb-max').addEventListener('input', function () { var v = readNum($('#cb-max')); S.cbse.max = v === null ? 100 : Math.min(1000, Math.max(1, v)); save(); updateCbseQuick(); });
  bindNum('tg-done', function () { return S.cbse.tg; }, 'done', 0, 50, updateTarget);
  bindNum('tg-avg', function () { return S.cbse.tg; }, 'avg', 0, 100, updateTarget);
  bindNum('tg-total', function () { return S.cbse.tg; }, 'total', 1, 50, updateTarget);
  bindNum('tg-target', function () { return S.cbse.tg; }, 'target', 0, 100, updateTarget);

  function renderCbse() {
    var cb = S.cbse;
    setVal('cb-cgpa', cb.cgpa); setVal('cb-pct', cb.pct); setVal('cb-marks', cb.marks); setVal('cb-max', cb.max);
    setVal('tg-done', cb.tg.done); setVal('tg-avg', cb.tg.avg); setVal('tg-total', cb.tg.total); setVal('tg-target', cb.tg.target);
    renderCbseScale(); updateCbseQuick(); renderFive(); updateTarget();
  }

  /* ================================================================ 2. University */
  function curSem() { if (S.uni.cur >= S.uni.sems.length) S.uni.cur = S.uni.sems.length - 1; return S.uni.sems[S.uni.cur]; }
  function semName(sm, i) { return sm.name !== null && sm.name !== '' ? sm.name : t('sem_n', { n: EDU.fmt(i + 1) }); }
  function scaleLetters() { return S.uni.scale.map(function (r) { return r.g; }).filter(Boolean); }
  function semCalc(sm) {
    return C.sgpa(sm.subjects.map(function (s) { var p = C.pointsFor(S.uni.scale, s.grade); return { credit: s.credit === null ? 0 : s.credit, gp: p === null ? NaN : p }; }));
  }
  function allCgpa() { return C.cgpa(S.uni.sems.map(function (sm) { var r = semCalc(sm); return { credits: r.credits, points: r.points }; })); }
  function formulaLabel(key) { return t('fm_' + key); }
  function fillFormulaSelect(sel, value) {
    sel.innerHTML = '';
    C.FORMULAS.forEach(function (k) { sel.appendChild(el('option', { value: k, text: formulaLabel(k), selected: k === value })); });
  }

  function renderSemChips() {
    var box = $('#sem-list'); box.innerHTML = '';
    S.uni.sems.forEach(function (sm, i) {
      box.appendChild(el('button', { type: 'button', class: 'chip no-i18n sem-chip', id: 'sem-chip-' + i, 'aria-pressed': i === S.uni.cur ? 'true' : 'false', dataset: { i: i }, text: semName(sm, i),
        onclick: function () { S.uni.cur = i; save(); renderUni(); } }));
    });
    if (S.uni.sems.length < MAX_SEMS) box.appendChild(el('button', { type: 'button', class: 'chip add', id: 'sem-add', text: '＋ ' + t('un_add_sem'), onclick: addSem }));
  }
  function addSem() {
    if (S.uni.sems.length >= MAX_SEMS) { EDU.toast(t('un_max_sems', { n: EDU.fmt(MAX_SEMS) })); return; }
    var top = scaleLetters()[0] || '';
    S.uni.sems.push({ name: null, subjects: [{ key: null, name: '', credit: 4, grade: top }, { key: null, name: '', credit: 3, grade: top }, { key: null, name: '', credit: 3, grade: top }] });
    S.uni.cur = S.uni.sems.length - 1; save(); renderUni();
    var inp = $('#sem-name'); if (inp) inp.focus();
  }
  function renderSubjects() {
    var sm = curSem(), tb = $('#subj-rows'); tb.innerHTML = '';
    var letters = scaleLetters();
    setVal('sem-name', sm.name === null ? '' : sm.name);
    $('#sem-name').placeholder = t('sem_n', { n: EDU.fmt(S.uni.cur + 1) });
    sm.subjects.forEach(function (s, i) {
      var tr = el('tr', { dataset: { i: i } });
      tr.appendChild(el('td', null, el('input', { type: 'text', class: 'no-i18n sj-name', maxlength: '60', value: nameOf(s), placeholder: t('subject_n', { n: EDU.fmt(i + 1) }), dataset: { i: i }, 'aria-label': t('col_subject') + ' ' + (i + 1) })));
      tr.appendChild(el('td', null, el('input', { type: 'number', class: 'num sj-credit no-i18n', inputmode: 'decimal', step: '0.5', min: '0', max: '30', dir: 'ltr', value: s.credit === null ? '' : s.credit, dataset: { i: i }, 'aria-label': t('col_credits') + ' ' + (i + 1) })));
      var sel = el('select', { class: 'sj-grade ltr no-i18n', dataset: { i: i }, 'aria-label': t('col_grade') + ' ' + (i + 1) });
      if (letters.indexOf(s.grade) < 0) sel.appendChild(el('option', { value: '', text: '–', selected: true }));
      letters.forEach(function (g) { sel.appendChild(el('option', { value: g, text: g, selected: g === s.grade })); });
      tr.appendChild(el('td', null, sel));
      tr.appendChild(el('td', { class: 'v num sj-gp' }));
      tr.appendChild(el('td', { class: 'v num sj-cp' }));
      tr.appendChild(el('td', null, el('button', { type: 'button', class: 'btn cg-del sj-del', dataset: { i: i }, 'aria-label': t('delete'), text: '✕' })));
      tb.appendChild(tr);
    });
    updateSem();
  }
  function updateSem() {
    var sm = curSem(), r = semCalc(sm);
    r.rows.forEach(function (row, i) {
      var tr = $('#subj-rows tr[data-i="' + i + '"]'); if (!tr) return;
      tr.querySelector('.sj-gp').textContent = row.gp === null ? '–' : f2(row.gp);
      tr.querySelector('.sj-cp').textContent = row.cp === null ? '–' : f2(row.cp);
    });
    setText('sem-credits', f2(r.credits)); setText('sem-points', f2(r.points));
    setText('sgpa-lbl', t('res_sgpa_of', { name: semName(sm, S.uni.cur) }));
    setText('sgpa', f2(r.sgpa)); setData('sgpa', 'value', r.sgpa);
    setText('sgpa-how', r.sgpa === null ? '' : f2(r.points) + ' ÷ ' + f2(r.credits));
    setText('sem-scale-hint', t('un_scale_hint', { max: f2(C.scaleMax(S.uni.scale)) }));
    $('#sem-del').disabled = S.uni.sems.length <= 1;
    updateCgpa();
  }
  function updateCgpa() {
    var tb = $('#cgpa-rows'); tb.innerHTML = '';
    S.uni.sems.forEach(function (sm, i) {
      var r = semCalc(sm);
      tb.appendChild(el('tr', { dataset: { i: i }, class: i === S.uni.cur ? 'cur' : '' },
        el('td', { class: 'no-i18n', text: semName(sm, i) }),
        el('td', { class: 'v num', text: f2(r.credits) }),
        el('td', { class: 'v num', text: f2(r.points) }),
        el('td', { class: 'v num sem-sgpa', text: f2(r.sgpa) })));
    });
    var all = allCgpa();
    setText('cgpa-lbl', t('res_cgpa_all'));
    setText('cgpa', f2(all.cgpa)); setData('cgpa', 'value', all.cgpa);
    setText('cgpa-how', all.cgpa === null ? t('un_cgpa_empty') : t('un_cgpa_how', { points: f2(all.points), credits: f2(all.credits), n: EDU.fmt(all.semesters) }));
    updateUniPct();
  }
  function updateUniPct() {
    var all = allCgpa(), cur = semCalc(curSem());
    var base = all.cgpa !== null ? all.raw : cur.raw, from = all.cgpa !== null ? 'cgpa' : 'sgpa';
    var four = S.uni.kind === '4';
    $('#formula-field').hidden = four;
    $('#custom-fields').hidden = four || S.uni.formula !== 'custom';
    var r = null;
    if (base !== null) r = four ? C.pctFromCgpa(base, 'custom', 25, 0) : C.pctFromCgpa(base, S.uni.formula, S.uni.a, S.uni.b);
    setText('uni-pct', r ? pctText(r.pct) : '–'); setData('uni-pct', 'value', r ? r.pct : null);
    setText('uni-formula', four ? 'GPA × 25' : C.formulaText(S.uni.formula, S.uni.a, S.uni.b));
    setData('uni-formula', 'formula', four ? 'x25' : S.uni.formula);
    var note = '';
    if (r) {
      note = t(from === 'cgpa' ? 'un_pct_from_cgpa' : 'un_pct_from_sgpa', { v: f2(C.round(base, 2)) });
      if (four) note += ' · ' + t('un_pct_four_note');
      if (r.clipped) note += ' · ' + t('un_pct_clipped', { v: f2(r.raw) });
    }
    setText('uni-pct-note', note);
  }
  $('#subj-rows').addEventListener('input', function (e) {
    var sm = curSem(), s = sm.subjects[+e.target.dataset.i]; if (!s) return;
    if (e.target.classList.contains('sj-name')) { s.name = e.target.value.slice(0, 60); s.key = null; }
    else if (e.target.classList.contains('sj-credit')) { var v = readNum(e.target); s.credit = v === null ? null : Math.min(30, Math.max(0, v)); }
    save(); updateSem();
  });
  $('#subj-rows').addEventListener('change', function (e) {
    if (!e.target.classList.contains('sj-grade')) return;
    var s = curSem().subjects[+e.target.dataset.i]; if (!s) return;
    s.grade = e.target.value; save(); renderSubjects();
  });
  $('#subj-rows').addEventListener('click', function (e) {
    var b = e.target.closest('.sj-del'); if (!b) return;
    var sm = curSem(); sm.subjects.splice(+b.dataset.i, 1); save(); renderSubjects();
  });
  $('#subj-add').addEventListener('click', function () {
    var sm = curSem();
    if (sm.subjects.length >= MAX_SUBJ) { EDU.toast(t('un_max_subjects', { n: EDU.fmt(MAX_SUBJ) })); return; }
    sm.subjects.push({ key: null, name: '', credit: 3, grade: scaleLetters()[0] || '' }); save(); renderSubjects();
    var last = $$('#subj-rows .sj-name').pop(); if (last) last.focus();
  });
  $('#sem-name').addEventListener('input', function () { curSem().name = $('#sem-name').value.slice(0, 40) || null; save(); renderSemChips(); updateSem(); });
  $('#sem-del').addEventListener('click', function () {
    if (S.uni.sems.length <= 1) return;
    if (!confirm(t('un_sem_confirm', { name: semName(curSem(), S.uni.cur) }))) return;
    S.uni.sems.splice(S.uni.cur, 1); S.uni.cur = Math.max(0, S.uni.cur - 1); save(); renderUni();
  });
  $('#sem-add-2') && $('#sem-add-2').addEventListener('click', addSem);
  $('#sem-add').addEventListener('click', addSem);
  $('#formula').addEventListener('change', function () { S.uni.formula = $('#formula').value; save(); updateUniPct(); });
  bindNum('f-a', function () { return S.uni; }, 'a', -1000, 1000, updateUniPct);
  bindNum('f-b', function () { return S.uni; }, 'b', -1000, 1000, updateUniPct);
  bindText('student-name', function () { return S.uni; }, 'student', 60);
  bindText('college-name', function () { return S.uni; }, 'college', 80);
  bindText('course-name', function () { return S.uni; }, 'course', 60);

  /* grade scale */
  function renderScale() {
    $$('#scale-preset button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.kind === S.uni.kind ? 'true' : 'false'); });
    var tb = $('#scale-rows'); tb.innerHTML = '';
    S.uni.scale.forEach(function (r, i) {
      tb.appendChild(el('tr', { dataset: { i: i } },
        el('td', null, el('input', { type: 'text', class: 'no-i18n ltr sc-g', maxlength: '4', value: r.g, dir: 'ltr', dataset: { i: i }, 'aria-label': t('col_grade_letter') + ' ' + (i + 1), style: { maxWidth: '120px' } })),
        el('td', null, el('input', { type: 'number', class: 'num sc-p no-i18n', inputmode: 'decimal', step: '0.5', min: '0', max: '20', dir: 'ltr', value: r.p, dataset: { i: i }, 'aria-label': t('col_gp') + ' ' + (i + 1) })),
        el('td', null, el('button', { type: 'button', class: 'btn cg-del sc-del', dataset: { i: i }, 'aria-label': t('delete'), text: '✕' }))));
    });
  }
  /* subjects keep their letter when it still exists; otherwise the grade with the nearest share of the maximum */
  function remapGrades(oldScale, newScale) {
    var oldMax = C.scaleMax(oldScale) || 1, newMax = C.scaleMax(newScale) || 1;
    var letters = newScale.map(function (r) { return r.g; });
    S.uni.sems.forEach(function (sm) {
      sm.subjects.forEach(function (s) {
        if (letters.indexOf(s.grade) >= 0) return;
        var p = C.pointsFor(oldScale, s.grade);
        if (p === null) { s.grade = letters[0] || ''; return; }
        var want = p / oldMax * newMax, best = newScale[0];
        newScale.forEach(function (r) { if (Math.abs(r.p - want) < Math.abs(best.p - want)) best = r; });
        s.grade = best.g;
      });
    });
  }
  function setPreset(kind) {
    var old = S.uni.scale;
    S.uni.kind = kind; S.uni.scale = C.scaleCopy(kind);
    remapGrades(old, S.uni.scale); save(); renderUni();
    EDU.toast(t('un_scale_switched', { max: EDU.fmt(C.scaleMax(S.uni.scale)) }));
  }
  $$('#scale-preset button').forEach(function (b) { b.addEventListener('click', function () { if (b.dataset.kind !== S.uni.kind) setPreset(b.dataset.kind); }); });
  $('#scale-rows').addEventListener('input', function (e) {
    var r = S.uni.scale[+e.target.dataset.i]; if (!r) return;
    if (e.target.classList.contains('sc-g')) r.g = e.target.value.slice(0, 4).trim();
    else if (e.target.classList.contains('sc-p')) { var v = readNum(e.target); r.p = v === null ? 0 : Math.min(20, Math.max(0, v)); }
    save(); renderSubjects();
  });
  $('#scale-rows').addEventListener('click', function (e) {
    var b = e.target.closest('.sc-del'); if (!b) return;
    if (S.uni.scale.length <= 2) { EDU.toast(t('un_scale_min')); return; }
    S.uni.scale.splice(+b.dataset.i, 1); save(); renderScale(); renderSubjects();
  });
  $('#scale-add').addEventListener('click', function () {
    if (S.uni.scale.length >= MAX_SCALE) return;
    S.uni.scale.push({ g: '', p: 0 }); save(); renderScale();
    var last = $$('#scale-rows .sc-g').pop(); if (last) last.focus();
  });
  $('#scale-reset').addEventListener('click', function () { var old = S.uni.scale; S.uni.scale = C.scaleCopy(S.uni.kind); remapGrades(old, S.uni.scale); save(); renderUni(); });

  /* print sheet + CSV */
  function buildSheet() {
    var box = $('#print-area'); box.innerHTML = '';
    var sm = curSem(), r = semCalc(sm), all = allCgpa();
    var four = S.uni.kind === '4';
    var pr = all.cgpa === null ? null : (four ? C.pctFromCgpa(all.raw, 'custom', 25, 0) : C.pctFromCgpa(all.raw, S.uni.formula, S.uni.a, S.uni.b));
    var today = new Date().toLocaleDateString(EDU.langInfo(EDU.lang).tag, { year: 'numeric', month: 'long', day: 'numeric', numberingSystem: 'latn' });
    box.appendChild(el('div', { class: 'pa-head' },
      el('div', null, el('h1', { text: S.uni.college || t('pa_title') }), S.uni.college ? el('div', { text: t('pa_title') }) : null, S.uni.course ? el('div', { class: 'no-i18n', text: S.uni.course }) : null),
      el('div', null, el('div', { text: t('pa_date') + ': ' }, el('span', { class: 'num', text: today })))));
    box.appendChild(el('div', { class: 'pa-meta' },
      el('div', null, el('b', { text: t('un_student') + ': ' }), el('span', { class: 'no-i18n', text: S.uni.student || '____________________' })),
      el('div', null, el('b', { text: t('col_semester') + ': ' }), el('span', { class: 'no-i18n', text: semName(sm, S.uni.cur) }))));
    var tbl = el('table', null, el('thead', null, el('tr', null,
      el('th', { text: '#' }), el('th', { text: t('col_subject') }), el('th', { class: 'v', text: t('col_credits') }), el('th', { text: t('col_grade') }),
      el('th', { class: 'v', text: t('col_gp') }), el('th', { class: 'v', text: t('col_credit_points') }))));
    var tb = el('tbody');
    sm.subjects.forEach(function (s, i) {
      var row = r.rows[i];
      tb.appendChild(el('tr', null, el('td', { class: 'num', text: EDU.fmt(i + 1) }), el('td', { class: 'no-i18n', text: nameOf(s) || t('subject_n', { n: EDU.fmt(i + 1) }) }),
        el('td', { class: 'v num', text: f2(row.credit) }), el('td', { class: 'ltr', text: s.grade || '–' }), el('td', { class: 'v num', text: row.gp === null ? '–' : f2(row.gp) }), el('td', { class: 'v num', text: row.cp === null ? '–' : f2(row.cp) })));
    });
    tb.appendChild(el('tr', { class: 'sum' }, el('td', { colspan: '2', text: t('total') }), el('td', { class: 'v num', text: f2(r.credits) }), el('td'), el('td'), el('td', { class: 'v num', text: f2(r.points) })));
    tbl.appendChild(tb); box.appendChild(tbl);
    box.appendChild(el('div', { class: 'pa-boxes' },
      el('div', { class: 'pa-box' }, el('b', { class: 'num', text: f2(r.sgpa) }), el('span', { text: 'SGPA = ' + f2(r.points) + ' ÷ ' + f2(r.credits) })),
      el('div', { class: 'pa-box' }, el('b', { class: 'num', text: f2(r.credits) }), el('span', { text: t('col_credits') }))));
    if (S.uni.sems.length > 1 || all.cgpa !== null) {
      box.appendChild(el('h2', { text: t('un_cgpa_title') }));
      var t2 = el('table', null, el('thead', null, el('tr', null, el('th', { text: t('col_semester') }), el('th', { class: 'v', text: t('col_credits') }), el('th', { class: 'v', text: t('col_credit_points') }), el('th', { class: 'v', text: t('col_sgpa') }))));
      var b2 = el('tbody');
      S.uni.sems.forEach(function (x, i) { var rr = semCalc(x); b2.appendChild(el('tr', null, el('td', { class: 'no-i18n', text: semName(x, i) }), el('td', { class: 'v num', text: f2(rr.credits) }), el('td', { class: 'v num', text: f2(rr.points) }), el('td', { class: 'v num', text: f2(rr.sgpa) }))); });
      b2.appendChild(el('tr', { class: 'sum' }, el('td', { text: t('total') }), el('td', { class: 'v num', text: f2(all.credits) }), el('td', { class: 'v num', text: f2(all.points) }), el('td', { class: 'v num', text: f2(all.cgpa) })));
      t2.appendChild(b2); box.appendChild(t2);
      box.appendChild(el('div', { class: 'pa-boxes' },
        el('div', { class: 'pa-box' }, el('b', { class: 'num', text: f2(all.cgpa) }), el('span', { text: 'CGPA' })),
        el('div', { class: 'pa-box' }, el('b', { class: 'num', text: pr ? pctText(pr.pct) : '–' }), el('span', { class: 'ltr', text: four ? 'GPA × 25' : C.formulaText(S.uni.formula, S.uni.a, S.uni.b) }))));
    }
    box.appendChild(el('div', { class: 'pa-sign' }, el('div', { text: t('pa_sign_student') }), el('div', { text: t('pa_sign_teacher') })));
    box.appendChild(el('p', { class: 'pa-small', text: t('un_check_rule') + ' · ' + t('pa_made') }));
  }
  $('#print-sheet').addEventListener('click', function () { buildSheet(); window.print(); });
  $('#csv-export').addEventListener('click', function () {
    var rows = [[t('col_semester'), t('col_subject'), t('col_credits'), t('col_grade'), t('col_gp'), t('col_credit_points')]];
    S.uni.sems.forEach(function (sm, i) {
      var r = semCalc(sm), nm = semName(sm, i);
      sm.subjects.forEach(function (s, j) { var row = r.rows[j]; rows.push([nm, nameOf(s), row.credit, s.grade, row.gp === null ? '' : row.gp, row.cp === null ? '' : row.cp]); });
      rows.push([nm, 'SGPA', r.credits, '', '', r.sgpa === null ? '' : r.sgpa]);
    });
    var all = allCgpa();
    rows.push(['', 'CGPA', all.credits, '', '', all.cgpa === null ? '' : all.cgpa]);
    var four = S.uni.kind === '4';
    var pr = all.cgpa === null ? null : (four ? C.pctFromCgpa(all.raw, 'custom', 25, 0) : C.pctFromCgpa(all.raw, S.uni.formula, S.uni.a, S.uni.b));
    if (pr) rows.push(['', t('res_pct'), '', '', four ? 'GPA x 25' : pr.formula, pr.pct]);
    EDU.download('cgpa-semesters.csv', EDU.csv.stringify(rows), 'text/csv');
    EDU.toast(t('un_csv_done'));
  });

  function renderUni() {
    fillFormulaSelect($('#formula'), S.uni.formula);
    setVal('f-a', S.uni.a); setVal('f-b', S.uni.b);
    setVal('student-name', S.uni.student); setVal('college-name', S.uni.college); setVal('course-name', S.uni.course);
    renderScale(); renderSemChips(); renderSubjects();
  }

  /* ================================================================ 3. Conversions */
  function rangeText(lo, hi) { return t('cv_range', { a: f2(lo), b: f2(hi) }); }
  function updateConv() {
    var cv = S.conv, pct = null, cgpa = null, band = null, pctLo = null, pctHi = null;
    $('#cv-custom-fields').hidden = cv.formula !== 'custom';
    ['pct', 'cgpa', 'gpa'].forEach(function (k) { $('#cv-' + k).classList.toggle('cg-src', cv.src === k); });
    var fTxt = C.formulaText(cv.formula, cv.a, cv.b);
    if (cv.src === 'pct' && cv.pct !== null) {
      pct = cv.pct; var c1 = C.cgpaFromPct(pct, cv.formula, cv.a, cv.b); cgpa = c1 ? c1.cgpa : null; band = C.gpaFromPct(pct);
    } else if (cv.src === 'cgpa' && cv.cgpa !== null) {
      cgpa = cv.cgpa; var p1 = C.pctFromCgpa(cgpa, cv.formula, cv.a, cv.b); pct = p1 ? p1.pct : null; band = pct === null ? null : C.gpaFromPct(pct);
    } else if (cv.src === 'gpa' && cv.gpa !== null) {
      band = C.bandFromGpa(cv.gpa);
      if (band) { pctLo = band.min; pctHi = band.max === 100 ? 100 : band.max + 0.01; }
    }
    var fromGpa = cv.src === 'gpa';
    setText('cv-out-pct', fromGpa ? (band ? rangeText(pctLo, pctHi) : '–') : pctText(pct));
    setData('cv-out-pct', 'value', fromGpa ? null : pct); setData('cv-out-pct', 'lo', fromGpa && band ? pctLo : null); setData('cv-out-pct', 'hi', fromGpa && band ? pctHi : null);
    setText('cv-out-pct-note', fromGpa && band ? t('approx') : '');
    if (fromGpa && band) {
      var a = C.cgpaFromPct(pctLo, cv.formula, cv.a, cv.b), b = C.cgpaFromPct(pctHi, cv.formula, cv.a, cv.b);
      setText('cv-out-cgpa', a && b ? rangeText(a.cgpa, b.cgpa) : '–'); setData('cv-out-cgpa', 'value', null);
    } else { setText('cv-out-cgpa', f2(cgpa)); setData('cv-out-cgpa', 'value', cgpa); }
    setText('cv-out-cgpa-note', fTxt);
    setText('cv-out-gpa', fromGpa ? (cv.gpa === null ? '–' : f2(cv.gpa)) : (band ? f2(band.gpa) : '–'));
    setData('cv-out-gpa', 'value', fromGpa ? cv.gpa : (band ? band.gpa : null));
    setText('cv-out-gpa-note', band && !fromGpa ? t('cv_band_of', { a: f2(band.min), b: f2(band.max === 100 ? 100 : band.max + 0.01) }) : (band ? t('cv_band_nearest', { g: f2(band.gpa) }) : ''));
    setText('cv-out-letter', band ? band.letter : '–'); setData('cv-out-letter', 'letter', band ? band.letter : null);
    renderBands(band);
  }
  function renderBands(active) {
    var tb = $('#band-table tbody'); tb.innerHTML = '';
    var cv = S.conv;
    C.GPA_BANDS.forEach(function (b) {
      var hi = b.max === 100 ? 100 : b.max + 0.01;
      var c1 = C.cgpaFromPct(b.min, cv.formula, cv.a, cv.b), c2 = C.cgpaFromPct(hi, cv.formula, cv.a, cv.b);
      tb.appendChild(el('tr', { class: active && active.gpa === b.gpa ? 'cur' : '', style: active && active.gpa === b.gpa ? { background: 'var(--primary-soft)' } : null },
        el('td', { class: 'num', text: f2(b.min) + '–' + f2(hi) + ' %' }),
        el('td', { class: 'num', text: c1 && c2 ? f2(c1.cgpa) + '–' + f2(c2.cgpa) : '–' }),
        el('td', { class: 'v num', text: b.gpa.toFixed(1) }),
        el('td', { class: 'c ltr', text: b.letter })));
    });
  }
  ['pct', 'cgpa', 'gpa'].forEach(function (k) {
    var lim = { pct: 100, cgpa: 10, gpa: 4 }[k];
    $('#cv-' + k).addEventListener('input', function () {
      var v = readNum($('#cv-' + k)); S.conv[k] = v === null ? null : Math.min(lim, Math.max(0, v)); S.conv.src = k; save(); updateConv();
    });
  });
  $('#cv-formula').addEventListener('change', function () { S.conv.formula = $('#cv-formula').value; save(); updateConv(); });
  bindNum('cv-a', function () { return S.conv; }, 'a', -1000, 1000, updateConv);
  bindNum('cv-b', function () { return S.conv; }, 'b', -1000, 1000, updateConv);
  function renderConv() {
    fillFormulaSelect($('#cv-formula'), S.conv.formula);
    setVal('cv-pct', S.conv.pct); setVal('cv-cgpa', S.conv.cgpa); setVal('cv-gpa', S.conv.gpa); setVal('cv-a', S.conv.a); setVal('cv-b', S.conv.b);
    updateConv();
  }

  /* ================================================================ 4. Marks */
  function renderMarkRows() {
    var tb = $('#mk-rows'); tb.innerHTML = '';
    S.marks.rows.forEach(function (r, i) {
      tb.appendChild(el('tr', { dataset: { i: i } },
        el('td', null, el('input', { type: 'text', class: 'no-i18n mk-name', maxlength: '60', value: nameOf(r), placeholder: t('subject_n', { n: EDU.fmt(i + 1) }), dataset: { i: i }, 'aria-label': t('col_subject') + ' ' + (i + 1) })),
        el('td', null, el('input', { type: 'number', class: 'num mk-obt no-i18n', inputmode: 'decimal', step: '0.5', min: '0', dir: 'ltr', value: r.obt === null ? '' : r.obt, dataset: { i: i }, 'aria-label': t('col_obtained') + ' ' + (i + 1) })),
        el('td', null, el('input', { type: 'number', class: 'num mk-max no-i18n', inputmode: 'decimal', step: '1', min: '1', dir: 'ltr', value: r.max === null ? '' : r.max, dataset: { i: i }, 'aria-label': t('col_max') + ' ' + (i + 1) })),
        el('td', { class: 'v num mk-pct' }),
        el('td', null, el('button', { type: 'button', class: 'btn cg-del mk-del', dataset: { i: i }, 'aria-label': t('delete'), text: '✕' }))));
    });
    updateMarks();
  }
  function updateMarks() {
    var tot = C.marksTotal(S.marks.rows);
    tot.rows.forEach(function (r) {
      var tr = $('#mk-rows tr[data-i="' + r.i + '"]'); if (!tr) return;
      tr.querySelector('.mk-pct').textContent = r.valid ? pctText(r.pct) : '–';
      tr.classList.remove('drop');
    });
    setText('mk-obt', f2(tot.obt)); setText('mk-max', f2(tot.max)); setText('mk-pct-cell', pctText(tot.pct));
    setText('mk-pct', pctText(tot.pct)); setData('mk-pct', 'value', tot.pct);
    setText('mk-pct-how', tot.max > 0 ? f2(tot.obt) + ' ÷ ' + f2(tot.max) + ' × 100' : '');
    /* best-of-N options: all, then n-1 .. 1 */
    var sel = $('#mk-best'), n = tot.count; sel.innerHTML = '';
    sel.appendChild(el('option', { value: '0', text: t('mk_best_all') }));
    for (var k = n - 1; k >= 1; k--) sel.appendChild(el('option', { value: String(k), text: t('mk_best_n', { n: EDU.fmt(k) }) }));
    if (S.marks.best >= n) S.marks.best = 0;
    sel.value = String(S.marks.best);
    var best = S.marks.best > 0 ? C.bestOf(S.marks.rows, S.marks.best) : null;
    setText('mk-best-lbl', best ? t('mk_best_res', { n: EDU.fmt(best.n), total: EDU.fmt(n) }) : t('mk_best_pick'));
    setText('mk-best-pct', best ? pctText(best.pct) : '–'); setData('mk-best-pct', 'value', best ? best.pct : null);
    setText('mk-best-how', best ? f2(best.obt) + ' ÷ ' + f2(best.max) + ' × 100' : '');
    if (best) best.dropped.forEach(function (i) { var tr = $('#mk-rows tr[data-i="' + i + '"]'); if (tr) tr.classList.add('drop'); });
  }
  $('#mk-rows').addEventListener('input', function (e) {
    var r = S.marks.rows[+e.target.dataset.i]; if (!r) return;
    if (e.target.classList.contains('mk-name')) { r.name = e.target.value.slice(0, 60); r.key = null; }
    else if (e.target.classList.contains('mk-obt')) { var v = readNum(e.target); r.obt = v === null ? null : Math.min(100000, Math.max(0, v)); }
    else if (e.target.classList.contains('mk-max')) { var m = readNum(e.target); r.max = m === null ? null : Math.min(100000, Math.max(0, m)); }
    save(); updateMarks();
  });
  $('#mk-rows').addEventListener('click', function (e) {
    var b = e.target.closest('.mk-del'); if (!b) return;
    S.marks.rows.splice(+b.dataset.i, 1); save(); renderMarkRows();
  });
  $('#mk-add').addEventListener('click', function () {
    if (S.marks.rows.length >= MAX_ROWS) { EDU.toast(t('un_max_subjects', { n: EDU.fmt(MAX_ROWS) })); return; }
    S.marks.rows.push({ key: null, name: '', obt: null, max: 100 }); save(); renderMarkRows();
    var last = $$('#mk-rows .mk-name').pop(); if (last) last.focus();
  });
  $('#mk-best').addEventListener('change', function () { S.marks.best = Math.round(num($('#mk-best').value, 0, MAX_ROWS, 0)); save(); updateMarks(); });

  function updateWeighted() {
    var w = S.marks.wt, r = (w.io === null || w.fo === null) ? null : C.weighted(w.io, w.im, w.iw, w.fo, w.fm, w.fw);
    setText('wt-overall', r ? pctText(r.overall) : '–'); setData('wt-overall', 'value', r ? r.overall : null);
    setText('wt-how', r ? t('wt_how', { ip: f2(r.ip), iw: f2(w.iw), fp: f2(r.fp), fw: f2(w.fw) }) : t('wt_bad_input'));
  }
  function updateFinal() {
    var f = S.marks.fn, box = $('#fn-status');
    var r = (f.io === null || f.target === null) ? null : C.finalNeeded(f.io, f.im, f.iw, f.fm, f.fw, f.target);
    var status = r ? r.status : 'bad_input';
    box.dataset.status = status;
    setText('fn-lbl', t('fn_need_lbl'));
    setText('fn-need-pct', r ? pctText(r.needPct) : '–'); setData('fn-need-pct', 'value', r ? r.needPct : null); setData('fn-need-pct', 'marks', r ? r.needMarks : null);
    var msg;
    if (!r) msg = t('fn_bad_input');
    else if (status === 'possible') msg = t('fn_possible', { marks: f2(r.needMarks), max: f2(f.fm), have: f2(r.iPart) });
    else if (status === 'done') msg = t('fn_done_msg', { have: f2(r.iPart), target: f2(f.target) });
    else msg = t('fn_impossible', { max: f2(r.maxPossible), target: f2(f.target) });
    setText('fn-text', msg);
    var have = r ? Math.min(100, Math.max(0, r.iPart)) : 0;
    var need = r ? Math.min(100 - have, Math.max(0, (status === 'impossible' ? 100 : f.target) - have)) : 0;
    $('#fn-bar-have').style.width = have + '%'; $('#fn-bar-need').style.width = need + '%';
  }
  var W = function () { return S.marks.wt; }, F = function () { return S.marks.fn; };
  bindNum('wt-io', W, 'io', 0, 100000, updateWeighted); bindNum('wt-im', W, 'im', 0, 100000, updateWeighted);
  bindNum('wt-fo', W, 'fo', 0, 100000, updateWeighted); bindNum('wt-fm', W, 'fm', 0, 100000, updateWeighted);
  bindNum('wt-fw', W, 'fw', 0, 100, updateWeighted);
  bindNum('wt-iw', W, 'iw', 0, 100, function () { if (S.marks.wt.iw !== null) { S.marks.wt.fw = C.round(100 - S.marks.wt.iw, 2); setVal('wt-fw', S.marks.wt.fw); } updateWeighted(); });
  bindNum('fn-io', F, 'io', 0, 100000, updateFinal); bindNum('fn-im', F, 'im', 0, 100000, updateFinal);
  bindNum('fn-fm', F, 'fm', 0, 100000, updateFinal); bindNum('fn-fw', F, 'fw', 0, 100, updateFinal);
  bindNum('fn-target', F, 'target', 0, 100, updateFinal);
  bindNum('fn-iw', F, 'iw', 0, 100, function () { if (S.marks.fn.iw !== null) { S.marks.fn.fw = C.round(100 - S.marks.fn.iw, 2); setVal('fn-fw', S.marks.fn.fw); } updateFinal(); });
  function renderMarks() {
    var w = S.marks.wt, f = S.marks.fn;
    setVal('wt-io', w.io); setVal('wt-im', w.im); setVal('wt-iw', w.iw); setVal('wt-fo', w.fo); setVal('wt-fm', w.fm); setVal('wt-fw', w.fw);
    setVal('fn-io', f.io); setVal('fn-im', f.im); setVal('fn-iw', f.iw); setVal('fn-fm', f.fm); setVal('fn-fw', f.fw); setVal('fn-target', f.target);
    renderMarkRows(); updateWeighted(); updateFinal();
  }

  /* ================================================================ reset, language, start */
  $('#reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    store.remove('state'); S = defaults(); save(); renderAll(); EDU.toast(t('reset_done'));
  });
  function renderAll() { showTab(S.tab); renderCbse(); renderUni(); renderConv(); renderMarks(); }
  EDU.onLang(function () { renderAll(); if ($('#print-area').childNodes.length) buildSheet(); });
  window.addEventListener('beforeprint', function () { if (S.tab === 'uni' || !$('#print-area').childNodes.length) buildSheet(); });
  renderAll();
})();
