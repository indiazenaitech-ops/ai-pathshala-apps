/* Lesson Plan Maker: UI. The data model and all logic live in engine.js (window.LPM); localized samples,
   Bloom's verbs and activity ideas in content.js (window.APP_CONTENT).
   Everything is saved with EDU.store('lesson-plan-maker'): the draft being edited, the list of saved plans and a
   few UI settings. Nothing leaves the device. */
(function () {
  'use strict';
  var SLUG = 'lesson-plan-maker';
  var store = EDU.store(SLUG);
  var L = window.LPM;
  var $ = EDU.$, $$ = EDU.$$, el = EDU.el;
  var TABS = ['edit', 'preview', 'plans'];
  var SEG_COLORS = ['--c1', '--c4', '--c7', '--c2', '--c3', '--c5', '--c6', '--c8'];
  var DEFAULT_SAMPLE = 'fractions';

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ================================================================ i18n helpers */
  function isRtl() { return document.documentElement.dir === 'rtl'; }
  /* EDU.t, but in Urdu every inserted value sits in a bidi isolate so "35 / 40 min" stays in one piece */
  function t(key, vars) {
    if (vars && isRtl()) {
      var o = {};
      Object.keys(vars).forEach(function (k) { o[k] = '⁨' + vars[k] + '⁩'; });
      vars = o;
    }
    return EDU.t(key, vars);
  }
  function plain(s) { return String(s).replace(/[⁦-⁩]/g, ''); }
  function C() { var A = window.APP_CONTENT || {}; return A[EDU.lang] || A.en || {}; }
  function n(v) { return EDU.fmt(v); }
  function isoFromTs(ts) {
    var d = new Date(ts), m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }

  /* ================================================================ state */
  var S = { tab: 'edit', draft: null, plans: [], dirty: false, level: 'remember', q: '' };

  function loadUI() {
    var u = store.get('ui', null); u = u && typeof u === 'object' ? u : {};
    S.tab = TABS.indexOf(u.tab) >= 0 ? u.tab : 'edit';
    S.level = L.LEVELS.indexOf(u.level) >= 0 ? u.level : 'remember';
    S.dirty = !!u.dirty;
  }
  function saveUI() { store.set('ui', { tab: S.tab, level: S.level, dirty: S.dirty }); }
  function loadPlans() {
    var raw = store.get('plans', null), seen = {};
    S.plans = (Array.isArray(raw) ? raw : []).filter(function (p) { return p && typeof p === 'object'; }).map(L.clean)
      .filter(function (p) { if (seen[p.id]) return false; seen[p.id] = 1; return true; }).slice(0, L.MAX_PLANS);
    S.plans.sort(function (a, b) { return b.updated - a.updated; });
  }
  function savePlans() { store.set('plans', S.plans); }
  function sampleDraft(key, base) { return L.fromSample((C().samples || {})[key], base); }
  function loadDraft() {
    var raw = store.get('draft', null);
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) S.draft = L.clean(raw);
    else { S.draft = sampleDraft(DEFAULT_SAMPLE, null); S.dirty = false; }
  }
  function saveDraft() { store.set('draft', S.draft); }
  function savedIndex() { for (var i = 0; i < S.plans.length; i++) if (S.plans[i].id === S.draft.id) return i; return -1; }

  /* every edit: remember it, mark the draft as changed, refresh the small things that depend on it */
  var waTimer = 0;
  function touch() {
    S.draft.updated = Date.now();
    if (!S.dirty) { S.dirty = true; saveUI(); }
    saveDraft();
    renderSaveState();
    clearTimeout(waTimer); waTimer = setTimeout(updateWa, 250);
  }

  loadUI(); loadPlans(); loadDraft();

  /* ================================================================ tabs */
  function showTab(name) {
    if (TABS.indexOf(name) < 0) name = 'edit';
    S.tab = name; saveUI();
    $$('#tabs [role="tab"]').forEach(function (b) {
      var on = b.id === 'tab-' + name;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      $('#' + b.getAttribute('data-panel')).hidden = !on;
    });
    if (name === 'preview') renderPreview();
    if (name === 'plans') renderPlans();
  }
  $$('#tabs [role="tab"]').forEach(function (b, i, all) {
    b.addEventListener('click', function () { showTab(b.id.slice(4)); });
    b.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      if (isRtl()) d = -d;
      var nx = all[(i + d + all.length) % all.length]; nx.focus(); nx.click();
    });
  });

  /* ================================================================ format */
  function setFormat(f) {
    if (L.FORMATS.indexOf(f) < 0 || f === S.draft.format) return;
    S.draft.format = f; touch();
    renderFormat(); renderTiming(); renderIdeas();
  }
  $$('#fmt button').forEach(function (b) { b.addEventListener('click', function () { setFormat(b.dataset.fmt); }); });
  function renderFormat() {
    var f = S.draft.format, lesson = f !== 'weekly';
    $$('#fmt button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.fmt === f)); });
    $$('.lesson-only').forEach(function (x) { x.hidden = !lesson; });
    $$('.weekly-only').forEach(function (x) { x.hidden = lesson; });
    $$('.cbse-only').forEach(function (x) { x.hidden = f !== 'cbse'; });
    $$('.e5-only').forEach(function (x) { x.hidden = f !== '5e'; });
    $('#page-size').textContent = '@page { size: A4 ' + (f === 'weekly' ? 'landscape' : 'portrait') + '; margin: 12mm; }';
    document.body.setAttribute('data-format', f);
  }

  /* ================================================================ samples */
  function renderSamples() {
    var box = $('#samples'); box.innerHTML = '';
    L.SAMPLES.forEach(function (k) {
      box.appendChild(el('button', { type: 'button', class: 'chip', dataset: { sample: k }, text: t('sample_' + k), onclick: function () { loadSample(k); } }));
    });
  }
  function loadSample(k) {
    if (S.dirty && !confirm(t('confirm_sample'))) return;
    S.draft = sampleDraft(k, S.draft);
    S.dirty = false; saveDraft(); saveUI();
    renderAll(); EDU.toast(t('sample_ok'));
    if (S.tab !== 'edit') showTab('edit');
  }

  /* ================================================================ simple fields */
  var TEXT = { 'f-school': 'school', 'f-teacher': 'teacher', 'f-class': 'cls', 'f-section': 'section', 'f-subject': 'subject', 'f-topic': 'topic',
    'f-outcomes': 'outcomes', 'f-prev': 'prev', 'f-intro': 'intro', 'f-recap': 'recap', 'f-assess': 'assess', 'f-hw': 'hw', 'f-reflect': 'reflect',
    'f-support': 'support', 'f-extension': 'extension' };
  Object.keys(TEXT).forEach(function (id) {
    $('#' + id).addEventListener('input', function () { S.draft[TEXT[id]] = this.value; touch(); });
  });
  function onDate(e) { var v = $('#f-date').value; if (L.isoDate(v)) { S.draft.date = v; touch(); } }
  $('#f-date').addEventListener('input', onDate); $('#f-date').addEventListener('change', onDate);
  $('#f-period').addEventListener('input', function () { if (this.value === '') return; S.draft.period = L.clean({ period: this.value }).period; touch(); });
  $('#f-period').addEventListener('change', function () { this.value = S.draft.period; });
  $('#f-duration').addEventListener('input', function () { if (this.value === '') return; S.draft.duration = L.clean({ duration: this.value }).duration; touch(); renderTiming(); });
  $('#f-duration').addEventListener('change', function () { this.value = S.draft.duration; });
  function onWeekStart() { var v = $('#f-weekstart').value; if (!L.isoDate(v)) return; S.draft.weekStart = L.mondayOf(v); touch(); if (document.activeElement !== $('#f-weekstart')) $('#f-weekstart').value = S.draft.weekStart; renderWeek(); }
  $('#f-weekstart').addEventListener('change', onWeekStart);
  $('#f-weekstart').addEventListener('blur', function () { this.value = S.draft.weekStart; });
  (function () { var sel = $('#f-periods'); for (var i = 1; i <= L.MAX_PERIODS; i++) sel.appendChild(el('option', { value: i, text: n(i) })); })();
  $('#f-periods').addEventListener('change', function () { S.draft.periods = L.clean({ periods: this.value }).periods; touch(); renderWeek(); });

  function fillForm() {
    var p = S.draft;
    Object.keys(TEXT).forEach(function (id) { $('#' + id).value = p[TEXT[id]]; });
    $('#f-date').value = p.date; $('#f-period').value = p.period; $('#f-duration').value = p.duration;
    $('#f-weekstart').value = p.weekStart; $('#f-periods').value = p.periods;
  }

  /* ================================================================ Bloom's verbs */
  function renderBloom() {
    var lv = $('#bloom-levels'); lv.innerHTML = '';
    L.LEVELS.forEach(function (k) {
      lv.appendChild(el('button', { type: 'button', dataset: { level: k }, 'aria-pressed': String(k === S.level), text: t('bl_' + k),
        onclick: function () { S.level = k; saveUI(); renderBloom(); } }));
    });
    var vb = $('#bloom-verbs'); vb.innerHTML = '';
    ((C().bloom || {})[S.level] || []).forEach(function (v, i) {
      vb.appendChild(el('button', { type: 'button', class: 'chip', dataset: { verb: v, i: String(i) }, text: v, onclick: function () { insertVerb(v); } }));
    });
  }
  /* appends "• verb " as a new line of the outcomes; the teacher finishes the sentence */
  function insertVerb(v) {
    var ta = $('#f-outcomes'), cur = ta.value;
    ta.value = cur + (cur && !/\n$/.test(cur) ? '\n' : '') + '• ' + v + ' ';
    S.draft.outcomes = ta.value; touch();
    ta.focus();
    try { ta.setSelectionRange(ta.value.length, ta.value.length); } catch (e) { }
  }

  /* ================================================================ NEP competencies */
  function renderComp() {
    var box = $('#comp'); box.innerHTML = '';
    L.COMPS.forEach(function (c) {
      box.appendChild(el('button', { type: 'button', class: 'chip', dataset: { comp: c }, 'aria-pressed': String(S.draft.comp.indexOf(c) >= 0), text: t('c_' + c),
        onclick: function () { var i = S.draft.comp.indexOf(c); if (i >= 0) S.draft.comp.splice(i, 1); else S.draft.comp.push(c); touch(); renderComp(); } }));
    });
  }

  /* ================================================================ materials checklist */
  function matIndex(text) { text = text.trim().toLowerCase(); for (var i = 0; i < S.draft.materials.length; i++) if (S.draft.materials[i].text.toLowerCase() === text) return i; return -1; }
  function addMaterial(text) {
    text = String(text || '').trim().slice(0, 120);
    if (!text || matIndex(text) >= 0) return false;
    if (S.draft.materials.length >= L.MAX_MATERIALS) { EDU.toast(t('mat_full')); return false; }
    S.draft.materials.push({ text: text, done: false }); touch(); renderMaterials(); return true;
  }
  function renderMaterials() {
    var ul = $('#mat-list'); ul.innerHTML = '';
    S.draft.materials.forEach(function (m, i) {
      var cb = el('input', { type: 'checkbox', class: 'mat-done' }); cb.checked = m.done;
      var li = el('li', { dataset: { i: String(i) }, class: m.done ? 'done' : '' },
        el('label', { class: 'check' }, cb, el('span', { class: 'no-i18n', text: m.text })),
        el('button', { type: 'button', class: 'btn btn-ghost btn-sm mat-del no-i18n', 'aria-label': plain(t('mat_remove', { x: m.text })), title: plain(t('mat_remove', { x: m.text })), text: '✕',
          onclick: function () { S.draft.materials.splice(i, 1); touch(); renderMaterials(); } }));
      cb.addEventListener('change', function () { m.done = cb.checked; li.classList.toggle('done', m.done); touch(); });
      ul.appendChild(li);
    });
    $('#mat-empty').hidden = S.draft.materials.length > 0;
    var chips = $('#mat-chips'); chips.innerHTML = '';
    (C().materials || []).forEach(function (m) {
      var on = matIndex(m) >= 0;
      chips.appendChild(el('button', { type: 'button', class: 'chip', dataset: { mat: m }, 'aria-pressed': String(on), text: m,
        onclick: function () { var i = matIndex(m); if (i >= 0) { S.draft.materials.splice(i, 1); touch(); renderMaterials(); } else addMaterial(m); } }));
    });
  }
  $('#mat-add').addEventListener('click', function () { var inp = $('#mat-input'); if (addMaterial(inp.value)) inp.value = ''; inp.focus(); });
  $('#mat-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); $('#mat-add').click(); } });

  /* ================================================================ CBSE steps */
  function labelled(key, control, extra) {
    return el('label', { class: 'field' }, el('span', { text: t(key) + (extra || '') }), control);
  }
  function renderSteps() {
    var box = $('#steps'); box.innerHTML = '';
    if (!S.draft.steps.length) box.appendChild(el('p', { class: 'steps-empty', id: 'steps-empty', text: t('steps_empty') }));
    S.draft.steps.forEach(function (s, i) {
      var ta1 = el('textarea', { class: 'st-teacher no-i18n', rows: '2' }); ta1.value = s.teacher;
      var ta2 = el('textarea', { class: 'st-student no-i18n', rows: '2' }); ta2.value = s.student;
      var mn = el('input', { type: 'number', class: 'st-min no-i18n', min: '0', max: '600', step: '1', inputmode: 'numeric' }); mn.value = s.min || '';
      ta1.addEventListener('input', function () { s.teacher = ta1.value; touch(); });
      ta2.addEventListener('input', function () { s.student = ta2.value; touch(); });
      mn.addEventListener('input', function () { if (mn.value === '') { s.min = 0; } else s.min = L.clean({ steps: [{ min: mn.value }] }).steps[0].min; touch(); renderTiming(); });
      mn.addEventListener('change', function () { mn.value = s.min || ''; });
      box.appendChild(el('div', { class: 'step', dataset: { i: String(i) } },
        el('div', { class: 'step-head' },
          el('b', { text: t('step_n', { n: n(i + 1) }) }),
          el('button', { type: 'button', class: 'btn btn-ghost btn-sm st-del no-i18n', 'aria-label': plain(t('step_remove', { n: n(i + 1) })), title: plain(t('step_remove', { n: n(i + 1) })), text: '✕',
            onclick: function () { S.draft.steps.splice(i, 1); touch(); renderSteps(); renderTiming(); } })),
        el('div', { class: 'step-grid' }, labelled('col_teacher', ta1), labelled('col_student', ta2), labelled('col_min', mn))));
    });
  }
  $('#step-add').addEventListener('click', function () {
    if (S.draft.steps.length >= L.MAX_STEPS) { EDU.toast(t('steps_full')); return; }
    S.draft.steps.push({ teacher: '', student: '', min: 5 }); touch(); renderSteps(); renderTiming();
    var last = $$('#steps .st-teacher').pop(); if (last) last.focus();
  });

  /* ================================================================ timing bar (CBSE steps and 5E phases) */
  function renderTiming() {
    var f = S.draft.format; if (f === 'weekly') return;
    var mins = L.minutes(S.draft), T = L.timing(mins, S.draft.duration);
    var box = $(f === '5e' ? '#timing-5e' : '#timing'), bar = $(f === '5e' ? '#tbar-5e' : '#tbar'), txt = $(f === '5e' ? '#timing-text-5e' : '#timing-text');
    box.dataset.status = T.status; box.dataset.total = String(T.total); box.dataset.over = String(T.over); box.dataset.duration = String(T.duration);
    bar.innerHTML = '';
    var span = Math.max(T.total, T.duration), acc = 0;
    mins.forEach(function (m, i) {
      if (!(m > 0)) return;
      var start = acc; acc += m;
      var color = 'var(' + SEG_COLORS[i % SEG_COLORS.length] + ')';
      if (start < T.duration && acc > T.duration) {      /* this step crosses the end of the period: two parts */
        bar.appendChild(el('span', { class: 'tseg', style: { width: ((T.duration - start) / span * 100) + '%', background: color } }));
        bar.appendChild(el('span', { class: 'tseg over', style: { width: ((acc - T.duration) / span * 100) + '%' } }));
      } else {
        bar.appendChild(el('span', { class: 'tseg' + (start >= T.duration ? ' over' : ''), style: { width: (m / span * 100) + '%', background: color } }));
      }
    });
    var wrap = bar.parentNode, old = wrap.querySelector('.tmark'); if (old) old.remove();
    var pos = T.duration / span * 100;
    wrap.appendChild(el('span', { class: 'tmark' + (pos > 92 ? ' at-end' : ''), style: { left: 'calc(' + pos + '% - 1px)' }, 'data-label': n(T.duration) + ' ' + plain(t('pv_min')) }));
    txt.textContent = t('timing_' + T.status, { total: n(T.total), dur: n(T.duration), over: n(T.over), left: n(T.left) });
  }

  /* ================================================================ 5E phases */
  function renderE5() {
    var box = $('#e5'); box.innerHTML = '';
    L.PHASES.forEach(function (k, i) {
      var ph = S.draft.e5[k];
      var act = el('textarea', { class: 'ph-act no-i18n', rows: '3' }); act.value = ph.act;
      var mn = el('input', { type: 'number', class: 'ph-min no-i18n', min: '0', max: '600', step: '1', inputmode: 'numeric' }); mn.value = ph.min || '';
      var mat = el('input', { type: 'text', class: 'ph-mat no-i18n', maxlength: '240' }); mat.value = ph.mat;
      act.addEventListener('input', function () { ph.act = act.value; touch(); });
      mn.addEventListener('input', function () { ph.min = mn.value === '' ? 0 : L.clean({ e5: { engage: { min: mn.value } } }).e5.engage.min; touch(); renderTiming(); });
      mn.addEventListener('change', function () { mn.value = ph.min || ''; });
      mat.addEventListener('input', function () { ph.mat = mat.value; touch(); });
      box.appendChild(el('section', { class: 'phase', dataset: { phase: k } },
        el('h3', {}, el('span', { class: 'pnum', 'aria-hidden': 'true', text: n(i + 1) }), el('span', { text: t('e5_' + k) })),
        el('p', { class: 'hint', text: t('e5_' + k + '_hint') }),
        el('div', { class: 'phase-grid' }, labelled('ph_activity', act), labelled('ph_min', mn), labelled('ph_materials', mat))));
    });
  }

  /* ================================================================ weekly grid */
  function weekCell(d, p) {
    var key = d + '-' + p;
    var mk = function (f, cls, phKey) {
      var c = S.draft.week[key] || { topic: '', hw: '' };
      var inp = el('input', { type: 'text', class: cls + ' no-i18n', maxlength: '300', dataset: { d: String(d), p: String(p), f: f }, placeholder: t(phKey),
        'aria-label': plain(t('day_' + d)) + ' · ' + plain(t('period_n', { n: n(p) })) + ' · ' + t(phKey) });
      inp.value = c[f];
      inp.addEventListener('input', function () {
        var cur = S.draft.week[key] || (S.draft.week[key] = { topic: '', hw: '' });
        cur[f] = inp.value.slice(0, 300);
        if (!cur.topic && !cur.hw) delete S.draft.week[key];
        touch();
      });
      return inp;
    };
    return el('div', { class: 'wcell' }, mk('topic', 'w-topic', 'cell_topic'), mk('hw', 'w-hw', 'cell_hw'));
  }
  function renderWeek() {
    var p = S.draft, tbl = $('#week'); tbl.innerHTML = '';
    var head = el('tr'); head.appendChild(el('th', { class: 'pn', scope: 'col', text: '' }));
    for (var d = 0; d < L.DAYS; d++) head.appendChild(el('th', { scope: 'col' }, el('span', { class: 'wd', text: t('day_' + d) }), el('span', { class: 'wdate ltr', text: L.dmy(L.addDays(p.weekStart, d)) })));
    tbl.appendChild(el('thead', {}, head));
    var tb = el('tbody');
    for (var k = 1; k <= p.periods; k++) {
      var row = el('tr', { dataset: { p: String(k) } });
      row.appendChild(el('th', { class: 'pn', scope: 'row', text: plain(t('period_short', { n: n(k) })) }));
      for (d = 0; d < L.DAYS; d++) row.appendChild(el('td', {}, weekCell(d, k)));
      tb.appendChild(row);
    }
    tbl.appendChild(tb);
  }

  /* ================================================================ student activity ideas */
  function renderIdeas() {
    var sel = $('#ideas-subject'); sel.innerHTML = '';
    L.SUBJECTS.forEach(function (k) { sel.appendChild(el('option', { value: k, text: t('subj_' + k) })); });
    sel.value = S.draft.subjectKey;
    var box = $('#ideas'); box.innerHTML = '';
    ((C().ideas || {})[S.draft.subjectKey] || []).forEach(function (idea, i) {
      box.appendChild(el('button', { type: 'button', class: 'chip', dataset: { i: String(i) }, text: idea, onclick: function () { addIdea(idea); } }));
    });
    $('#ideas-hint').textContent = t(S.draft.format === '5e' ? 'ideas_hint_5e' : 'ideas_hint_cbse');
  }
  $('#ideas-subject').addEventListener('change', function () { S.draft.subjectKey = L.SUBJECTS.indexOf(this.value) >= 0 ? this.value : 'general'; touch(); renderIdeas(); });
  function addIdea(idea) {
    if (S.draft.format === '5e') {
      var ph = S.draft.e5.explore;
      ph.act = ((ph.act ? ph.act.replace(/\s+$/, '') + '\n' : '') + idea).slice(0, 3000);
      touch(); renderE5(); EDU.toast(t('idea_added_5e'));
    } else {
      if (S.draft.steps.length >= L.MAX_STEPS) { EDU.toast(t('steps_full')); return; }
      S.draft.steps.push({ teacher: '', student: idea, min: 5 });
      touch(); renderSteps(); renderTiming(); EDU.toast(t('idea_added'));
    }
  }

  /* ================================================================ save / new / duplicate / open / delete */
  function renderSaveState() {
    var b = $('#save-state'), i = savedIndex();
    var st = i < 0 ? 'new' : S.dirty ? 'dirty' : 'saved';
    b.dataset.state = st; b.textContent = t('state_' + st);
    $('#plans-badge').textContent = n(S.plans.length);
  }
  function savePlan(quiet) {
    var i = savedIndex(), copy = L.clean(S.draft);
    copy.updated = Date.now(); S.draft.updated = copy.updated;
    if (i < 0) S.plans.unshift(copy); else S.plans[i] = copy;
    S.plans.sort(function (a, b) { return b.updated - a.updated; });
    S.plans = S.plans.slice(0, L.MAX_PLANS);
    savePlans();
    S.dirty = false; saveDraft(); saveUI();
    renderSaveState(); renderPlans();
    if (!quiet) EDU.toast(t('saved_ok'));
  }
  function newPlan() {
    if (S.dirty && !confirm(t('confirm_new'))) return;
    var old = S.draft, p = L.blank();
    p.school = old.school; p.teacher = old.teacher; p.format = old.format; p.subjectKey = old.subjectKey; p.duration = old.duration;
    S.draft = p; S.dirty = false; saveDraft(); saveUI();
    renderAll(); showTab('edit'); EDU.toast(t('new_ok'));
    $('#f-class').focus();
  }
  function duplicateDraft() {
    var d = L.duplicate(S.draft, t('copy_suffix'));
    S.plans.unshift(d); savePlans();
    S.draft = d; S.dirty = false; saveDraft(); saveUI();
    renderAll(); EDU.toast(t('dup_ok'));
  }
  function openPlan(p) {
    if (S.dirty && p.id !== S.draft.id && !confirm(t('confirm_open'))) return;
    S.draft = L.clean(p); S.dirty = false; saveDraft(); saveUI();
    renderAll(); showTab('edit'); EDU.toast(t('loaded_ok'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function deletePlan(p) {
    if (!confirm(t('confirm_delete'))) return;
    S.plans = S.plans.filter(function (x) { return x.id !== p.id; });
    savePlans(); renderPlans(); renderSaveState(); EDU.toast(t('deleted_ok'));
  }
  $('#btn-save').addEventListener('click', function () { savePlan(); });
  $('#btn-new').addEventListener('click', newPlan);
  $('#btn-dup').addEventListener('click', duplicateDraft);
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && String(e.key).toLowerCase() === 's') { e.preventDefault(); savePlan(); }
  });

  /* ================================================================ saved plans list */
  $('#plan-search').addEventListener('input', function () { S.q = this.value; renderPlans(); });
  function renderPlans() {
    var list = L.search(S.plans, S.q), box = $('#plan-list'); box.innerHTML = '';
    $('#plans-badge').textContent = n(S.plans.length);
    $('#plans-count').textContent = t('plans_count', { n: n(S.plans.length) });
    var empty = $('#plans-empty'); empty.hidden = list.length > 0; empty.textContent = t(S.plans.length ? 'plans_none_found' : 'plans_empty');
    list.forEach(function (p) {
      var cur = p.id === S.draft.id;
      var meta = el('div', { class: 'pm' });
      var who = [p.cls ? plain(t('pv_class')) + ' ' + p.cls + (p.section ? ' ' + p.section : '') : '', p.teacher].filter(Boolean).join(' · ');
      if (who) meta.appendChild(el('span', { class: 'no-i18n', text: who }));
      meta.appendChild(el('span', { class: 'badge', text: t('fmt_' + p.format) }));
      meta.appendChild(el('span', {}, t('p_updated', { d: L.dmy(isoFromTs(p.updated)) })));
      if (cur) meta.appendChild(el('span', { class: 'badge primary', text: t('p_current') }));
      box.appendChild(el('div', { class: 'plan-item' + (cur ? ' current' : ''), dataset: { id: p.id } },
        el('div', {}, el('div', { class: 'pt no-i18n', text: L.title(p, t('untitled')) }), meta),
        el('div', { class: 'pb' },
          el('button', { type: 'button', class: 'btn btn-sm p-open', text: t('p_open'), onclick: function () { openPlan(p); } }),
          el('button', { type: 'button', class: 'btn btn-sm p-dup', text: t('p_dup'), onclick: function () { var d = L.duplicate(p, t('copy_suffix')); S.plans.unshift(d); savePlans(); renderPlans(); renderSaveState(); EDU.toast(t('dup_ok')); } }),
          el('button', { type: 'button', class: 'btn btn-sm btn-danger p-del', text: t('p_del'), onclick: function () { deletePlan(p); } }))));
    });
  }

  /* ================================================================ preview (the printed page) */
  function pvSec(key, id, content) { return el('section', { class: 'pv-sec', id: id }, el('h3', { text: t(key) }), content); }
  function pvText(v, id) { return v && String(v).trim() ? el('p', { class: 'pv-text no-i18n', id: id, text: v }) : el('div', { class: 'pv-blank', id: id }); }
  function pvVal(id, v, ltr) { return el('span', { id: id, class: 'no-i18n' + (ltr ? ' ltr' : ''), text: v || '' }); }
  function renderPreview() {
    var p = S.draft, pv = $('#pv'); pv.innerHTML = '';
    pv.classList.toggle('land', p.format === 'weekly');
    pv.setAttribute('data-format', p.format);
    pv.appendChild(el('div', { class: 'pv-head' },
      el('div', { class: 'pv-school no-i18n', id: 'pv-school', text: p.school }),
      el('div', { class: 'pv-title', text: t('fmt_' + p.format + '_full') })));
    var info = el('div', { class: 'pv-info' });
    var kv = function (key, id, v, ltr) { info.appendChild(el('div', { class: 'pv-kv' }, el('b', { text: t(key) + ':' }), pvVal(id, v, ltr))); };
    kv('pv_teacher', 'pv-teacher', p.teacher);
    kv('pv_class', 'pv-class', (p.cls + (p.section ? ' – ' + p.section : '')).trim());
    kv('pv_subject', 'pv-subject', p.subject);
    if (p.format === 'weekly') kv('pv_week', 'pv-week', L.dmy(p.weekStart) + ' – ' + L.dmy(L.addDays(p.weekStart, 5)), true);
    else {
      kv('pv_topic', 'pv-topic', p.topic);
      kv('pv_date', 'pv-date', L.dmy(p.date), true);
      kv('pv_period', 'pv-period', n(p.period), true);
      kv('pv_duration', 'pv-duration', plain(t('min_n', { n: n(p.duration) })), true);
    }
    pv.appendChild(info);
    if (p.format === 'weekly') previewWeek(pv, p); else previewLesson(pv, p);
    pv.appendChild(el('div', { class: 'pv-sign' }, ['teacher', 'hod', 'principal'].map(function (k) { return el('div', { text: t('pv_sign_' + k) }); })));
    pv.appendChild(el('div', { class: 'pv-foot', text: t('pv_foot') }));
    updateWa();
  }
  function previewLesson(pv, p) {
    pv.appendChild(pvSec('pv_outcomes', 'pv-sec-outcomes', pvText(p.outcomes, 'pv-outcomes')));
    if (p.comp.length) pv.appendChild(pvSec('pv_comp', 'pv-sec-comp', el('div', { class: 'pv-tags', id: 'pv-comp' }, p.comp.map(function (c) { return el('span', { class: 'pv-tag', dataset: { comp: c }, text: t('c_' + c) }); }))));
    pv.appendChild(pvSec('pv_prev', 'pv-sec-prev', pvText(p.prev, 'pv-prev')));
    if (p.materials.length) pv.appendChild(pvSec('pv_materials', 'pv-sec-materials', el('ul', { class: 'pv-mats no-i18n', id: 'pv-materials' }, p.materials.map(function (m) { return el('li', { class: m.done ? 'done' : '', text: m.text }); }))));
    var T = L.timing(L.minutes(p), p.duration);
    var totalCell = el('td', { class: 'num', id: 'pv-total', dataset: { total: String(T.total), over: String(T.over) } }, el('span', { class: 'ltr', text: n(T.total) + ' / ' + n(p.duration) }));
    if (p.format === 'cbse') {
      pv.appendChild(pvSec('pv_intro', 'pv-sec-intro', pvText(p.intro, 'pv-intro')));
      var tb = el('tbody');
      if (!p.steps.length) tb.appendChild(el('tr', {}, el('td', { class: 'num', text: '1' }), el('td', {}, el('div', { class: 'pv-blank' })), el('td', {}, el('div', { class: 'pv-blank' })), el('td', { class: 'num' })));
      p.steps.forEach(function (s, i) {
        tb.appendChild(el('tr', { dataset: { i: String(i) } }, el('td', { class: 'num', text: n(i + 1) }),
          el('td', {}, el('div', { class: 'pv-text no-i18n', text: s.teacher })), el('td', {}, el('div', { class: 'pv-text no-i18n', text: s.student })),
          el('td', { class: 'num' }, el('span', { class: 'ltr', text: s.min ? n(s.min) : '' }))));
      });
      pv.appendChild(pvSec('pv_steps', 'pv-sec-steps', el('table', { class: 'pv-table', id: 'pv-steps' },
        el('thead', {}, el('tr', {}, el('th', { class: 'num', text: '#' }), el('th', { text: t('col_teacher') }), el('th', { text: t('col_student') }), el('th', { class: 'num', text: t('pv_min') }))),
        tb, el('tfoot', {}, el('tr', { class: 'total' }, el('td', { colspan: '3', text: t('pv_total') + ' (' + plain(t('pv_min')) + ')' }), totalCell)))));
      pv.appendChild(pvSec('pv_recap', 'pv-sec-recap', pvText(p.recap, 'pv-recap')));
      pv.appendChild(pvSec('pv_assess', 'pv-sec-assess', pvText(p.assess, 'pv-assess')));
      pv.appendChild(pvSec('pv_hw', 'pv-sec-hw', pvText(p.hw, 'pv-hw')));
    } else {
      var tb5 = el('tbody');
      L.PHASES.forEach(function (k) {
        var ph = p.e5[k];
        tb5.appendChild(el('tr', { dataset: { phase: k } }, el('td', { class: 'pv-phase-name', text: t('e5_' + k) }),
          el('td', {}, ph.act.trim() ? el('div', { class: 'pv-text no-i18n', text: ph.act }) : el('div', { class: 'pv-blank' })),
          el('td', { class: 'no-i18n', text: ph.mat }), el('td', { class: 'num' }, el('span', { class: 'ltr', text: ph.min ? n(ph.min) : '' }))));
      });
      pv.appendChild(pvSec('pv_5e', 'pv-sec-5e', el('table', { class: 'pv-table', id: 'pv-e5' },
        el('thead', {}, el('tr', {}, el('th', { text: t('pv_phase') }), el('th', { text: t('ph_activity') }), el('th', { text: t('ph_materials') }), el('th', { class: 'num', text: t('pv_min') }))),
        tb5, el('tfoot', {}, el('tr', { class: 'total' }, el('td', { colspan: '3', text: t('pv_total') + ' (' + plain(t('pv_min')) + ')' }), totalCell)))));
    }
    if (p.support.trim() || p.extension.trim()) {
      pv.appendChild(pvSec('pv_diff', 'pv-sec-diff', el('div', { class: 'pv-two' },
        el('div', {}, el('h4', { text: t('pv_support') }), pvText(p.support, 'pv-support')),
        el('div', {}, el('h4', { text: t('pv_extension') }), pvText(p.extension, 'pv-extension')))));
    }
    if (p.format === 'cbse') pv.appendChild(pvSec('pv_reflect', 'pv-sec-reflect', pvText(p.reflect, 'pv-reflect')));
  }
  function previewWeek(pv, p) {
    var head = el('tr'); head.appendChild(el('th', { text: t('pv_day') }));
    for (var k = 1; k <= p.periods; k++) head.appendChild(el('th', { class: 'num', text: plain(t('period_short', { n: n(k) })) }));
    var tb = el('tbody');
    for (var d = 0; d < L.DAYS; d++) {
      var row = el('tr', { dataset: { d: String(d) } });
      row.appendChild(el('th', { class: 'day', scope: 'row' }, t('day_' + d), el('small', { class: 'ltr', text: L.dmy(L.addDays(p.weekStart, d)) })));
      for (k = 1; k <= p.periods; k++) {
        var c = p.week[d + '-' + k];
        row.appendChild(el('td', { dataset: { d: String(d), p: String(k) }, class: 'no-i18n' },
          c && c.topic ? el('div', { class: 'wt', text: c.topic }) : null,
          c && c.hw ? el('div', { class: 'wh', text: t('pv_hw_short') + ': ' + c.hw }) : null));
      }
      tb.appendChild(row);
    }
    pv.appendChild(el('section', { class: 'pv-sec' }, el('div', { class: 'pv-scroll' }, el('table', { class: 'pv-table pv-week', id: 'pv-week-table' }, el('thead', {}, head), tb))));
  }

  /* ================================================================ share / copy / print / export / import */
  function labels() {
    return {
      label: function (k) { return plain(EDU.t(k)); }, day: function (i) { return plain(EDU.t('day_' + i)); },
      period: function (k) { return plain(EDU.t('period_n', { n: k })); }, minutes: function (m) { return plain(EDU.t('min_n', { n: m })); },
      compName: function (c) { return plain(EDU.t('c_' + c)); }, phase: function (k) { return plain(EDU.t('e5_' + k)); }, formatName: function (f) { return plain(EDU.t('fmt_' + f + '_full')); }
    };
  }
  function shareText() { return L.text(S.draft, labels()); }
  function updateWa() {
    var href = EDU.waLink(shareText() + '\n\n' + EDU.shareUrl());
    $('#btn-wa').href = href; $('#pv-wa').href = href;
  }
  function copyText() { EDU.copy(shareText()); }
  function printPlan() {
    if (S.tab !== 'preview') showTab('preview'); else renderPreview();
    setTimeout(function () { window.print(); }, 80);
  }
  window.addEventListener('beforeprint', function () { renderPreview(); });
  function fileName(base) { var s = (S.draft.topic || base).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 40); return 'lesson-plan-' + (s || base) + '.json'; }
  function exportDraft() { EDU.download(fileName('plan'), L.exportJSON([S.draft]), 'application/json'); }
  function exportAll() { EDU.download('lesson-plans-all.json', L.exportJSON(S.plans.length ? S.plans : [S.draft]), 'application/json'); }
  function importFile() {
    EDU.pickFile('.json,application/json').then(function (f) {
      if (!f) return null;
      return EDU.readText(f).then(function (text) {
        var r = L.importJSON(text);
        if (r.error) { EDU.toast(t('import_bad')); return; }
        S.plans = L.merge(S.plans, r.plans); savePlans();
        if (r.plans.length === 1 && !S.dirty) { S.draft = L.clean(r.plans[0]); saveDraft(); renderAll(); showTab('edit'); }
        else { renderPlans(); renderSaveState(); showTab('plans'); }
        EDU.toast(t('import_ok', { n: n(r.plans.length) }));
      });
    }).catch(function () { EDU.toast(t('import_bad')); });
  }
  $('#btn-copy').addEventListener('click', copyText); $('#pv-copy').addEventListener('click', copyText);
  $('#btn-print').addEventListener('click', printPlan); $('#pv-print').addEventListener('click', printPlan);
  $('#btn-preview').addEventListener('click', function () { showTab('preview'); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  $('#pv-edit').addEventListener('click', function () { showTab('edit'); });
  $('#btn-export').addEventListener('click', exportDraft);
  $('#export-all').addEventListener('click', exportAll);
  $('#btn-import').addEventListener('click', importFile); $('#import-all').addEventListener('click', importFile);
  ['btn-wa', 'pv-wa'].forEach(function (id) { $('#' + id).addEventListener('click', updateWa); });

  /* ================================================================ reset */
  $('#btn-reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    ['draft', 'plans', 'ui'].forEach(function (k) { store.remove(k); });
    S.plans = []; S.level = 'remember'; S.q = ''; $('#plan-search').value = '';
    S.draft = sampleDraft(DEFAULT_SAMPLE, null); S.dirty = false; S.tab = 'edit';
    saveDraft(); saveUI();
    renderAll(); showTab('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ================================================================ render all */
  function renderAll() {
    fillForm(); renderFormat(); renderSamples(); renderBloom(); renderComp(); renderMaterials();
    renderSteps(); renderE5(); renderWeek(); renderTiming(); renderIdeas(); renderSaveState(); renderPlans();
    if (S.tab === 'preview') renderPreview(); else updateWa();
  }
  EDU.onLang(renderAll);
  renderAll();
  showTab(S.tab);

  /* small hook for tests and curious teachers */
  window.LessonPlanMaker = { state: function () { return S; }, engine: L, render: renderAll };
})();
