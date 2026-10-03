/* AI Project Cycle Canvas: a guided worksheet for the CBSE AI Project Cycle.
   Several projects, autosave (EDU.store only), 3 localized samples, printable canvas,
   blank worksheet, text download and JSON export/import. No AI, nothing leaves the device. */
(function () {
  'use strict';
  var SLUG = 'ai-project-cycle';
  var store = EDU.store(SLUG);
  var $ = EDU.$, $$ = EDU.$$, el = EDU.el, t = EDU.t;
  var STEPS = 8;

  var TEXT_FIELDS = ['title', 'team', 'cls', 'who', 'who_know', 'what', 'what_evidence', 'where', 'why_value', 'why_improve',
    'ps_who', 'ps_what', 'ps_where', 'ps_why', 'features', 'source_details', 'data_check', 'explore_q', 'explore_notes',
    'model_reason', 'model_how', 'test_plan', 'success', 'error_cost', 'deploy_how', 'deploy_care',
    'eth_privacy', 'eth_bias', 'eth_safety'];

  function svg(inner) { return '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false">' + inner + '</svg>'; }
  var AX = '<path d="M3 3v18h18" fill="none" stroke="currentColor" stroke-width="1.6"/>';
  var SOURCES = [
    { id: 'survey', ico: '📝' }, { id: 'interview', ico: '🎤' }, { id: 'observe', ico: '👀' },
    { id: 'sensor', ico: '📡' }, { id: 'camera', ico: '📷' }, { id: 'ogd', ico: '🏛️' },
    { id: 'records', ico: '📒' }, { id: 'web', ico: '🌐' }, { id: 'api', ico: '🔌' }];
  var CHARTS = [
    { id: 'bar', svg: svg('<path d="M3 21h18" stroke="currentColor" stroke-width="1.6"/><rect x="4" y="11" width="4" height="9" rx="1" fill="currentColor"/><rect x="10" y="5" width="4" height="15" rx="1" fill="currentColor"/><rect x="16" y="14" width="4" height="6" rx="1" fill="currentColor"/>') },
    { id: 'line', svg: svg(AX + '<path d="M6 16l4-5 3 3 6-8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>') },
    { id: 'pie', svg: svg('<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 12V3a9 9 0 0 1 8.6 11.7z" fill="currentColor"/>') },
    { id: 'scatter', svg: svg(AX + '<g fill="currentColor"><circle cx="7" cy="16" r="1.7"/><circle cx="10" cy="13" r="1.7"/><circle cx="13" cy="14.5" r="1.7"/><circle cx="15" cy="9" r="1.7"/><circle cx="19" cy="6" r="1.7"/><circle cx="18" cy="11.5" r="1.7"/></g>') },
    { id: 'hist', svg: svg('<path d="M2 21h20" stroke="currentColor" stroke-width="1.6"/><g fill="currentColor"><rect x="3" y="15" width="4.2" height="5"/><rect x="7.6" y="9" width="4.2" height="11"/><rect x="12.2" y="4" width="4.2" height="16"/><rect x="16.8" y="12" width="4.2" height="8"/></g>') },
    { id: 'map', svg: svg('<path d="M12 22s7-7.4 7-12.2A7 7 0 0 0 5 9.8C5 14.6 12 22 12 22z" fill="currentColor"/><circle cx="12" cy="9.8" r="2.6" fill="#fff"/>') },
    { id: 'table', svg: svg('<rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 9.3h18M3 14.6h18M9.5 4v16" stroke="currentColor" stroke-width="1.6"/>') }];
  var METRICS = ['accuracy', 'precision', 'recall', 'f1', 'error', 'users', 'impact'].map(function (id) { return { id: id }; });
  var CHECKS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'];
  var TASKS = ['class', 'reg', 'cluster', 'unsure'];
  var LISTS = {
    sources: { opts: SOURCES, key: 'src_', desc: null },
    charts: { opts: CHARTS, key: 'ch_', desc: 'chu_' },
    metrics: { opts: METRICS, key: 'm_', desc: 'md_' }
  };
  var SAMPLE_ICONS = ['🍛', '🛣️', '💧'];
  /* language-independent choices of the three sample projects (their text lives in content.js) */
  var SAMPLE_SEL = [
    { sdg: 12, sources: ['observe', 'records', 'survey'], charts: ['bar', 'line', 'table'], approach: 'learn', task: 'reg', metrics: ['error', 'users', 'impact'] },
    { sdg: 9, sources: ['camera', 'survey', 'records'], charts: ['map', 'bar', 'pie'], approach: 'learn', task: 'class', metrics: ['accuracy', 'precision', 'recall', 'f1'] },
    { sdg: 6, sources: ['sensor', 'ogd', 'records'], charts: ['line', 'scatter', 'map'], approach: 'rule', task: '', metrics: ['recall', 'users', 'impact'] }];
  var STAGE_ICO = [null, '🎯', '📥', '🔍', '🧠', '📏', '🚀', '⚖️', '🗺️'];
  var EN_TERMS = [null, 'Problem Scoping', 'Data Acquisition', 'Data Exploration', 'Modelling', 'Evaluation', 'Deployment', 'Ethics', 'AI Project Cycle'];

  /* What each stage asks for. Drives progress, the printable canvas and the text download. */
  var STAGES = {
    1: [{ f: 'who', q: 'q_who', w: 'who' }, { f: 'who_know', q: 'q_who_know', w: 'who' },
      { f: 'what', q: 'q_what', w: 'what' }, { f: 'what_evidence', q: 'q_what_evidence', w: 'what' },
      { f: 'where', q: 'q_where', w: 'where' },
      { f: 'why_value', q: 'q_why_value', w: 'why' }, { f: 'why_improve', q: 'q_why_improve', w: 'why' },
      { f: 'ps_who', q: 'ps_l_who', ps: 1 }, { f: 'ps_what', q: 'ps_l_what', ps: 1 },
      { f: 'ps_where', q: 'ps_l_where', ps: 1 }, { f: 'ps_why', q: 'ps_l_why', ps: 1 }],
    2: [{ f: 'features', q: 'q_features', lines: 4 }, { list: 'sources', q: 'sources_h' },
      { f: 'source_details', q: 'q_source_details' }, { f: 'data_check', q: 'q_data_check' }],
    3: [{ list: 'charts', q: 'charts_h' }, { f: 'explore_q', q: 'q_explore_q' }, { f: 'explore_notes', q: 'q_explore_notes' }],
    4: [{ approach: 1, q: 'approach_h' }, { f: 'model_reason', q: 'q_model_reason' }, { f: 'model_how', q: 'model_how', lines: 4 }],
    5: [{ f: 'test_plan', q: 'q_test_plan' }, { list: 'metrics', q: 'metrics_h' }, { f: 'success', q: 'q_success' }, { f: 'error_cost', q: 'q_error_cost' }],
    6: [{ f: 'deploy_how', q: 'q_deploy_how' }, { f: 'deploy_care', q: 'q_deploy_care' }],
    7: [{ checks: 1, q: 'eth_checks_h' }, { f: 'eth_privacy', q: 'q_eth_privacy' }, { f: 'eth_bias', q: 'q_eth_bias' }, { f: 'eth_safety', q: 'q_eth_safety' }]
  };
  var TOTAL_ITEMS = 0;
  for (var s0 = 1; s0 <= 7; s0++) TOTAL_ITEMS += STAGES[s0].length;

  /* ---------------- helpers ---------------- */
  function trim(v) { return String(v == null ? '' : v).trim(); }
  function uid() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function content(lang) { var A = window.APP_CONTENT || {}; return A[lang] || A.en || { samples: [] }; }
  function sampleText(i, lang) { var S = content(lang).samples || []; return S[i] || null; }
  function sdgLabel(n) { return EDU.fmt(n) + ' · ' + t('sdg' + n); }
  function today() {
    try { return new Date().toLocaleDateString(EDU.langInfo(EDU.lang).tag + '-u-nu-latn', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  function ids(arr, allowed) {
    var ok = allowed.map(function (o) { return o.id || o; }), out = [];
    (Array.isArray(arr) ? arr : []).forEach(function (x) { if (ok.indexOf(x) >= 0 && out.indexOf(x) < 0) out.push(x); });
    return out;
  }

  /* ---------------- projects ---------------- */
  function blankProject() {
    return { id: uid(), created: Date.now(), updated: Date.now(), step: 1, sampleOf: null, edited: false,
      t: {}, sdg: 0, sources: [], charts: [], approach: '', task: '', metrics: [], checks: [] };
  }
  function cleanProject(o) {
    var p = blankProject();
    if (!o || typeof o !== 'object') return p;
    if (typeof o.id === 'string' && o.id) p.id = o.id.slice(0, 40);
    if (typeof o.created === 'number') p.created = o.created;
    if (typeof o.updated === 'number') p.updated = o.updated;
    var st = parseInt(o.step, 10); p.step = st >= 1 && st <= STEPS ? st : 1;
    p.sampleOf = (o.sampleOf === 0 || o.sampleOf === 1 || o.sampleOf === 2) ? o.sampleOf : null;
    p.edited = !!o.edited;
    var tt = o.t && typeof o.t === 'object' ? o.t : {};
    TEXT_FIELDS.forEach(function (f) { if (typeof tt[f] === 'string') p.t[f] = tt[f].slice(0, 8000); });
    var g = Number(o.sdg); p.sdg = g >= 1 && g <= 17 && Math.floor(g) === g ? g : 0;
    p.sources = ids(o.sources, SOURCES); p.charts = ids(o.charts, CHARTS); p.metrics = ids(o.metrics, METRICS);
    p.checks = ids(o.checks, CHECKS);
    p.approach = o.approach === 'rule' || o.approach === 'learn' ? o.approach : '';
    p.task = TASKS.indexOf(o.task) >= 0 ? o.task : '';
    return p;
  }
  function fillSampleText(p, i, lang) {
    var S = sampleText(i, lang);
    p.t = {};
    if (S) TEXT_FIELDS.forEach(function (f) { if (typeof S[f] === 'string') p.t[f] = S[f]; });
  }
  function sampleProject(i, lang) {
    var p = blankProject(), sel = SAMPLE_SEL[i];
    fillSampleText(p, i, lang);
    if (!sampleText(i, lang)) return p;
    p.sampleOf = i;
    p.sdg = sel.sdg; p.sources = sel.sources.slice(); p.charts = sel.charts.slice(); p.metrics = sel.metrics.slice();
    p.approach = sel.approach; p.task = sel.task; p.checks = CHECKS.slice();
    return p;
  }

  var projects = (function () {
    var raw = store.get('projects', []), seen = {}, out = [];
    (Array.isArray(raw) ? raw : []).forEach(function (o) {
      var p = cleanProject(o);
      if (seen[p.id]) p.id = uid();
      seen[p.id] = 1; out.push(p);
    });
    return out;
  })();

  EDU.init({ slug: SLUG, title: 'app_title' });

  if (!projects.length) projects.push(sampleProject(0, EDU.lang));
  var cur = find(store.get('current', null)) || projects[0];
  function find(id) { for (var i = 0; i < projects.length; i++) if (projects[i].id === id) return projects[i]; return null; }

  /* ---------------- saving ---------------- */
  var saveTimer = null;
  function saveNow() {
    clearTimeout(saveTimer); saveTimer = null;
    store.set('projects', projects);
    store.set('current', cur.id);
    showSaved();
  }
  function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 300); }
  function touched() { cur.edited = true; cur.updated = Date.now(); scheduleSave(); }
  function showSaved() { $('#save-status').textContent = t('saved_local'); }
  window.addEventListener('pagehide', function () { if (saveTimer) saveNow(); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && saveTimer) saveNow(); });

  /* ---------------- progress ---------------- */
  function isFilled(it, p) {
    if (it.f) return trim(p.t[it.f]) !== '';
    if (it.list) return p[it.list].length > 0;
    if (it.approach) return !!p.approach;
    if (it.checks) return p.checks.length === CHECKS.length;
    return false;
  }
  function stageDone(n, p) { return STAGES[n].every(function (it) { return isFilled(it, p); }); }
  function percent(p) {
    var n = 0;
    for (var s = 1; s <= 7; s++) STAGES[s].forEach(function (it) { if (isFilled(it, p)) n++; });
    return Math.round(n * 100 / TOTAL_ITEMS);
  }
  function qLabel(it, p) {
    if (it.f === 'model_how') return t(p.approach === 'rule' ? 'q_model_how_rule' : p.approach === 'learn' ? 'q_model_how_learn' : 'q_model_how_none');
    return t(it.q);
  }

  /* ---------------- problem statement ---------------- */
  function psVals(p) { return { who: trim(p.t.ps_who), what: trim(p.t.ps_what), where: trim(p.t.ps_where), why: trim(p.t.ps_why) }; }
  function hasPS(p) { var v = psVals(p); return !!(v.who || v.what || v.where || v.why); }
  function psSentence(p) {
    var v = psVals(p), gap = '____';
    return t('ps_sentence', { who: v.who || gap, what: v.what || gap, where: v.where || gap, why: v.why || gap });
  }
  function appendTemplate(box, tpl, v) {
    tpl.split(/(\{who\}|\{what\}|\{where\}|\{why\})/).forEach(function (part) {
      var m = /^\{(who|what|where|why)\}$/.exec(part);
      if (m) box.appendChild(el('mark', { class: 'ps-fill' + (v[m[1]] ? '' : ' ps-gap'), dir: 'auto', text: v[m[1]] || '____' }));
      else if (part) box.appendChild(document.createTextNode(part));
    });
  }
  function renderPS() {
    var box = $('#ps-preview');
    box.innerHTML = '';
    if (!hasPS(cur)) { box.appendChild(el('span', { class: 'muted', text: t('ps_empty') })); return; }
    appendTemplate(box, t('ps_sentence'), psVals(cur));
  }
  function firstLine(s) { return trim(String(s || '').split(/\r?\n/)[0]).replace(/[.,;:!?।۔]+$/, '').trim(); }

  /* ---------------- rendering ---------------- */
  function renderProjectSelect() {
    var sel = $('#proj-select');
    sel.innerHTML = '';
    projects.forEach(function (p) {
      var name = trim(p.t.title) || t('untitled');
      sel.appendChild(el('option', { value: p.id, text: (p.sampleOf !== null ? SAMPLE_ICONS[p.sampleOf] + ' ' : '') + name }));
    });
    sel.value = cur.id;
    $('#sample-note').hidden = cur.sampleOf === null;
  }
  function renderSamples() {
    var box = $('#samples');
    box.innerHTML = '';
    for (var i = 0; i < SAMPLE_SEL.length; i++) {
      var S = sampleText(i, EDU.lang);
      if (!S) continue;
      box.appendChild(el('button', { type: 'button', class: 'chip sample-chip', id: 'sample-' + i, dataset: { sample: String(i) }, title: S.title },
        el('span', { 'aria-hidden': 'true', text: SAMPLE_ICONS[i] }), el('span', { text: S.short })));
    }
  }
  function renderSdgOptions() {
    var sel = $('#f-sdg');
    sel.innerHTML = '';
    sel.appendChild(el('option', { value: '0', text: t('sdg_none') }));
    for (var n = 1; n <= 17; n++) sel.appendChild(el('option', { value: String(n), text: sdgLabel(n) }));
    sel.value = String(cur.sdg || 0);
  }
  function renderOptList(name) {
    var box = $('#opts-' + name), L = LISTS[name];
    box.innerHTML = '';
    L.opts.forEach(function (o) {
      var on = cur[name].indexOf(o.id) >= 0;
      box.appendChild(el('button', { type: 'button', class: 'opt', id: 'opt-' + name + '-' + o.id, 'aria-pressed': on ? 'true' : 'false', dataset: { list: name, oid: o.id } },
        el('span', { class: 'tick', 'aria-hidden': 'true' }),
        o.ico ? el('span', { class: 'opt-ico', 'aria-hidden': 'true', text: o.ico }) : null,
        o.svg ? el('span', { class: 'opt-ico', 'aria-hidden': 'true', html: o.svg }) : null,
        el('span', { class: 'opt-txt' },
          el('span', { class: 'opt-t', text: t(L.key + o.id) }),
          L.desc ? el('span', { class: 'opt-d', text: t(L.desc + o.id) }) : null)));
    });
  }
  function renderChecks() {
    var ul = $('#checks');
    ul.innerHTML = '';
    CHECKS.forEach(function (c) {
      var inp = el('input', { type: 'checkbox', id: 'ec-' + c, dataset: { check: c } });
      inp.checked = cur.checks.indexOf(c) >= 0;
      ul.appendChild(el('li', null, el('label', { class: 'check', for: 'ec-' + c }, inp, el('span', { text: t('e' + c) }))));
    });
    renderEthScore();
  }
  function renderEthScore() {
    var n = cur.checks.length, all = n === CHECKS.length;
    $('#eth-score').textContent = t('eth_score', { n: EDU.fmt(n), total: EDU.fmt(CHECKS.length) });
    $('#eth-msg').textContent = t(all ? 'eth_ok' : 'eth_todo');
    $('#eth-status').className = 'callout eth-status ' + (all ? 'success' : 'warning');
  }
  function renderModel() {
    $('#ap-rule').setAttribute('aria-pressed', cur.approach === 'rule' ? 'true' : 'false');
    $('#ap-learn').setAttribute('aria-pressed', cur.approach === 'learn' ? 'true' : 'false');
    $('#task-wrap').hidden = cur.approach !== 'learn';
    TASKS.forEach(function (k) { $('#tk-' + k).setAttribute('aria-pressed', cur.task === k ? 'true' : 'false'); });
    $('#l-model_how').textContent = qLabel({ f: 'model_how' }, cur);
  }
  function renderFeatCount() {
    var n = String(cur.t.features || '').split(/\r?\n/).filter(function (x) { return trim(x) !== ''; }).length;
    $('#feat-count').textContent = t('feat_count', { n: EDU.fmt(n) });
  }
  function renderStepper() {
    var ol = $('#stepper');
    ol.innerHTML = '';
    for (var n = 1; n <= STEPS; n++) {
      var done = n < STEPS && stageDone(n, cur);
      var b = el('button', { type: 'button', class: 'step-btn' + (done ? ' done' : ''), id: 'step-' + n, dataset: { step: String(n) } },
        el('span', { class: 'step-dot', 'aria-hidden': 'true', text: done ? '✓' : EDU.fmt(n) }),
        el('span', { class: 'step-name', text: t('st' + n) }),
        done ? el('span', { class: 'sr', text: t('stage_done') }) : null);
      if (n === cur.step) b.setAttribute('aria-current', 'step');
      ol.appendChild(el('li', { class: n <= cur.step ? 'past' : '' }, b));
    }
  }
  function renderProgress() {
    var pc = percent(cur);
    $('#overall').textContent = t('overall', { p: EDU.fmt(pc) });
    $('#overall-bar').style.width = pc + '%';
    renderStepper();
    renderEthScore();
  }
  function renderStep() {
    var s = cur.step;
    $$('.stage-sec').forEach(function (sec) { sec.hidden = +sec.getAttribute('data-stage') !== s; });
    $('#stage-body').hidden = s === STEPS;
    $('#canvas-body').classList.toggle('canvas-hide', s !== STEPS);
    $('#step-of').textContent = t('step_of', { n: EDU.fmt(s), total: EDU.fmt(STEPS) });
    $('#stage-ico').textContent = STAGE_ICO[s];
    $('#stage-title').textContent = t('st' + s);
    var en = $('#stage-en');
    en.hidden = EDU.lang === 'en';
    en.textContent = 'CBSE: ' + EN_TERMS[s];
    $('#stage-desc').textContent = t('st' + s + '_d');
    $('#btn-prev').disabled = s === 1;
    $('#btn-next').hidden = s === STEPS;
    if (s === STEPS) renderCanvas(false);
    renderStepper();
    autosizeAll();
  }
  function autosize(ta) {
    if (!ta || ta.offsetParent === null) return;
    ta.style.height = 'auto';
    ta.style.height = (ta.scrollHeight + 2) + 'px';
  }
  function autosizeAll() { $$('#stage-body textarea').forEach(autosize); }
  function renderLinks() {
    $('#lnk-tm').href = '../teachable-machine/index.html?lang=' + EDU.lang;
    $('#lnk-cm').href = '../confusion-matrix-lab/index.html?lang=' + EDU.lang;
  }
  function fillForm() {
    $$('[data-field]').forEach(function (inp) { inp.value = cur.t[inp.getAttribute('data-field')] || ''; });
    $('#f-sdg').value = String(cur.sdg || 0);
  }
  function renderAll() {
    renderProjectSelect();
    renderSamples();
    renderSdgOptions();
    Object.keys(LISTS).forEach(renderOptList);
    renderChecks();
    renderModel();
    renderPS();
    renderFeatCount();
    renderLinks();
    renderStep();
    renderProgress();
    showSaved();
  }

  /* ---------------- full canvas (screen, print, blank worksheet) ---------------- */
  function lines(n) { var w = el('div', { class: 'a-lines', 'aria-hidden': 'true' }); for (var i = 0; i < n; i++) w.appendChild(el('span', { class: 'ln' })); return w; }
  function emptyNode() { return el('div', { class: 'a empty', text: t('empty_field') }); }
  function qa(label, value, blank, n) {
    var a = blank ? lines(n || 3) : (trim(value) ? el('div', { class: 'a no-i18n', dir: 'auto', text: trim(value) }) : emptyNode());
    return el('div', { class: 'qa' }, el('div', { class: 'q', text: label }), a);
  }
  function optNodes(opts, onFn) {
    return el('div', { class: 'cv-opts' }, opts.map(function (o) {
      return el('span', { class: 'cv-opt' }, el('span', { 'aria-hidden': 'true', text: onFn(o) ? '☑' : '☐' }), el('span', { text: o.label }));
    }));
  }
  function answerNode(it, p, blank) {
    if (it.f) return qa(qLabel(it, p), p.t[it.f], blank, it.lines);
    var label = el('div', { class: 'q', text: t(it.q) }), body;
    if (it.list) {
      var L = LISTS[it.list];
      var opts = L.opts.map(function (o) { return { id: o.id, label: t(L.key + o.id) }; });
      if (blank) body = optNodes(opts, function () { return false; });
      else {
        var on = opts.filter(function (o) { return p[it.list].indexOf(o.id) >= 0; });
        body = on.length ? el('div', { class: 'cv-opts' }, on.map(function (o) { return el('span', { class: 'cv-chip', text: o.label }); })) : emptyNode();
      }
    } else if (it.approach) {
      if (blank) body = optNodes([{ id: 'rule', label: t('ap_rule') }, { id: 'learn', label: t('ap_learn') }], function () { return false; });
      else if (!p.approach) body = emptyNode();
      else body = el('div', { class: 'cv-opts' }, el('span', { class: 'cv-chip', text: t('ap_' + p.approach) }),
        p.approach === 'learn' && p.task ? el('span', { class: 'cv-chip', text: t('tk_' + p.task) }) : null);
    } else if (it.checks) {
      body = el('ul', { class: 'cv-checks' }, CHECKS.map(function (c) {
        var on = !blank && p.checks.indexOf(c) >= 0;
        return el('li', { class: on || blank ? '' : 'off' }, el('span', { 'aria-hidden': 'true', text: on ? '☑' : '☐' }), el('span', { text: t('e' + c) }));
      }));
    }
    return el('div', { class: 'qa' }, label, body);
  }
  function renderCanvas(blank) {
    var p = cur, T = p.t, root = $('#canvas');
    root.innerHTML = '';
    var head = el('div', { class: 'cv-head' }, el('div', { class: 'cv-kicker', text: t('app_title') }));
    if (blank) head.appendChild(el('div', { class: 'cv-meta-i', style: { margin: '8px 0' } }, el('span', { class: 'q', text: t('f_title') }), el('span', { class: 'blank-line', style: { minWidth: '22em' } })));
    else head.appendChild(el('h2', { class: 'cv-title no-i18n', dir: 'auto', text: trim(T.title) || t('untitled') }));
    var meta = el('div', { class: 'cv-meta' });
    [['f_team', T.team], ['f_class', T.cls], ['f_sdg', p.sdg ? sdgLabel(p.sdg) : '']].forEach(function (m) {
      meta.appendChild(el('div', { class: 'cv-meta-i' }, el('span', { class: 'q', text: t(m[0]) }),
        blank ? el('span', { class: 'blank-line' }) : el('span', { class: 'cv-meta-v no-i18n', dir: 'auto', text: trim(m[1]) || '—' })));
    });
    head.appendChild(meta);
    root.appendChild(head);

    var ps = el('div', { class: 'cv-ps' }, el('div', { class: 'q', text: t('ps_preview') }));
    if (blank) { ps.appendChild(el('p', { class: 'small mb0', text: t('ps_help') })); ps.appendChild(lines(3)); }
    else if (hasPS(p)) { var pe = el('p', { class: 'cv-ps-text no-i18n' }); appendTemplate(pe, t('ps_sentence'), psVals(p)); ps.appendChild(pe); }
    else ps.appendChild(emptyNode());
    root.appendChild(ps);

    var s1 = el('section', { class: 'cv-s1' }, el('h3', { class: 'cv-h' }, el('span', { class: 'cv-num', text: EDU.fmt(1) }), el('span', { 'aria-hidden': 'true', text: STAGE_ICO[1] }), el('span', { text: t('st1') })));
    var wg = el('div', { class: 'cv-w-grid' });
    [['who', '👥'], ['what', '❓'], ['where', '📍'], ['why', '💡']].forEach(function (w) {
      var box = el('div', { class: 'cv-box cv-w w-' + w[0] }, el('h4', { class: 'cv-wh' }, el('span', { 'aria-hidden': 'true', text: w[1] + ' ' }), el('span', { text: t('w_' + w[0]) })));
      STAGES[1].forEach(function (it) { if (it.w === w[0]) box.appendChild(qa(t(it.q), T[it.f], blank, w[0] === 'where' ? 4 : 3)); });
      wg.appendChild(box);
    });
    s1.appendChild(wg);
    root.appendChild(s1);

    var grid = el('div', { class: 'cv-stages' });
    for (var s = 2; s <= 7; s++) {
      var box = el('section', { class: 'cv-box' }, el('h3', { class: 'cv-h' }, el('span', { class: 'cv-num', text: EDU.fmt(s) }), el('span', { 'aria-hidden': 'true', text: STAGE_ICO[s] }), el('span', { text: t('st' + s) })));
      STAGES[s].forEach(function (it) { box.appendChild(answerNode(it, p, blank)); });
      grid.appendChild(box);
    }
    root.appendChild(grid);
    root.appendChild(el('div', { class: 'cv-foot', text: t('made_with', { date: today() }) }));
  }

  /* ---------------- plain text (download / copy) ---------------- */
  function answerText(it, p) {
    if (it.f) return trim(p.t[it.f]) || t('empty_field');
    if (it.list) {
      var L = LISTS[it.list], on = L.opts.filter(function (o) { return p[it.list].indexOf(o.id) >= 0; });
      return on.length ? on.map(function (o) { return t(L.key + o.id); }).join('; ') : t('empty_field');
    }
    if (it.approach) return p.approach ? t('ap_' + p.approach) + (p.approach === 'learn' && p.task ? ' · ' + t('tk_' + p.task) : '') : t('empty_field');
    if (it.checks) {
      return CHECKS.map(function (c) { return (p.checks.indexOf(c) >= 0 ? '[x] ' : '[ ] ') + t('e' + c); }).join('\r\n') +
        '\r\n' + t('eth_score', { n: EDU.fmt(p.checks.length), total: EDU.fmt(CHECKS.length) });
    }
    return '';
  }
  function buildText(p) {
    var T = p.t, out = [];
    out.push(t('app_title'));
    out.push('========================================');
    out.push(t('f_title') + ': ' + (trim(T.title) || t('untitled')));
    if (trim(T.team)) out.push(t('f_team') + ': ' + trim(T.team));
    if (trim(T.cls)) out.push(t('f_class') + ': ' + trim(T.cls));
    if (p.sdg) out.push(t('f_sdg') + ': ' + sdgLabel(p.sdg));
    out.push('');
    out.push(t('ps_preview') + ':');
    out.push(hasPS(p) ? psSentence(p) : t('empty_field'));
    for (var s = 1; s <= 7; s++) {
      out.push('');
      out.push('== ' + s + '. ' + t('st' + s) + ' ==');
      STAGES[s].forEach(function (it) {
        out.push('');
        out.push('> ' + (it.w ? t('w_' + it.w) + ' · ' : '') + qLabel(it, p));
        out.push(answerText(it, p));
      });
    }
    out.push('');
    out.push('— ' + t('made_with', { date: today() }));
    return out.join('\r\n').replace(/\r?\n/g, '\r\n');
  }
  function fileBase(p) {
    var s = trim(p.t.title).replace(/[\\/:*?"<>|#%&{}$!'@+`=\u0000-\u001f]+/g, '').replace(/\s+/g, '-').slice(0, 60);
    return s || 'ai-project';
  }

  /* ---------------- actions ---------------- */
  function switchTo(p) {
    if (saveTimer) saveNow();
    cur = p;
    saveNow();
    fillForm();
    renderAll();
  }
  function goStep(n) {
    n = EDU.clamp(n, 1, STEPS);
    if (n === cur.step) return;
    cur.step = n;
    scheduleSave();
    renderStep();
    var card = $('#stepper-card'), r = card.getBoundingClientRect();
    if (r.top < 0) window.scrollTo({ top: Math.max(0, window.pageYOffset + r.top - 70), behavior: 'auto' });
  }
  function toggleList(name, id) {
    var arr = cur[name], i = arr.indexOf(id);
    if (i >= 0) arr.splice(i, 1); else arr.push(id);
    var b = $('#opt-' + name + '-' + id);
    if (b) b.setAttribute('aria-pressed', i >= 0 ? 'false' : 'true');
    touched();
    renderProgress();
  }

  $('#app').addEventListener('input', function (e) {
    var f = e.target && e.target.getAttribute ? e.target.getAttribute('data-field') : null;
    if (!f || TEXT_FIELDS.indexOf(f) < 0) return;
    if (e.target.classList.contains('one-line') && /[\r\n]/.test(e.target.value)) e.target.value = e.target.value.replace(/\s*[\r\n]+\s*/g, ' ');
    cur.t[f] = e.target.value;
    if (e.target.tagName === 'TEXTAREA') autosize(e.target);
    touched();
    if (f.indexOf('ps_') === 0) renderPS();
    if (f === 'title') {
      var o = $('#proj-select').options[$('#proj-select').selectedIndex];
      if (o) o.textContent = (cur.sampleOf !== null ? SAMPLE_ICONS[cur.sampleOf] + ' ' : '') + (trim(cur.t.title) || t('untitled'));
    }
    if (f === 'features') renderFeatCount();
    renderProgress();
  });

  $('#app').addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('button') : null;
    if (!b) return;
    var d = b.dataset;
    if (d.list && d.oid) toggleList(d.list, d.oid);
    else if (d.step) goStep(+d.step);
    else if (d.ap) { cur.approach = d.ap; touched(); renderModel(); renderProgress(); }
    else if (d.task) { cur.task = d.task; touched(); renderModel(); }
    else if (d.sample !== undefined) {
      var p = sampleProject(+d.sample, EDU.lang);
      projects.push(p);
      switchTo(p);
      EDU.toast(t('sample_loaded'));
    }
  });

  $('#app').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target && e.target.classList && e.target.classList.contains('one-line')) e.preventDefault();
  });
  var resizeTimer = null;
  window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(autosizeAll, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(autosizeAll).catch(function () { });

  $('#checks').addEventListener('change', function (e) {
    var c = e.target && e.target.getAttribute('data-check');
    if (!c) return;
    var i = cur.checks.indexOf(c);
    if (e.target.checked && i < 0) cur.checks.push(c);
    if (!e.target.checked && i >= 0) cur.checks.splice(i, 1);
    cur.checks = ids(cur.checks, CHECKS);
    touched();
    renderProgress();
  });

  $('#f-sdg').addEventListener('change', function () { cur.sdg = +$('#f-sdg').value || 0; touched(); });
  $('#proj-select').addEventListener('change', function () { var p = find($('#proj-select').value); if (p && p !== cur) switchTo(p); });

  $('#btn-new').addEventListener('click', function () {
    var p = blankProject();
    projects.push(p);
    switchTo(p);
    try { $('#f-title').focus({ preventScroll: true }); } catch (e) { }
  });
  $('#btn-del').addEventListener('click', function () {
    var name = trim(cur.t.title) || t('untitled');
    if (!confirm(t('confirm_delete', { name: name }))) return;
    var i = projects.indexOf(cur);
    projects.splice(i, 1);
    if (!projects.length) projects.push(blankProject());
    switchTo(projects[Math.min(i, projects.length - 1)]);
    EDU.toast(t('deleted'));
  });

  $('#ps-fill').addEventListener('click', function () {
    var map = { ps_who: 'who', ps_what: 'what', ps_where: 'where', ps_why: 'why_value' }, n = 0;
    Object.keys(map).forEach(function (k) {
      var src = firstLine(cur.t[map[k]]);
      if (!trim(cur.t[k]) && src) { cur.t[k] = src; $('#f-' + k).value = src; autosize($('#f-' + k)); n++; }
    });
    if (!n) { EDU.toast(t('ps_fill_none')); return; }
    touched();
    renderPS();
    renderProgress();
  });

  $('#btn-prev').addEventListener('click', function () { goStep(cur.step - 1); });
  $('#btn-next').addEventListener('click', function () { goStep(cur.step + 1); });

  $('#btn-export').addEventListener('click', function () {
    if (saveTimer) saveNow();
    var data = { app: SLUG, version: 1, exported: new Date().toISOString(), project: cur };
    EDU.download(fileBase(cur) + '.json', JSON.stringify(data, null, 2), 'application/json');
  });
  $('#btn-import').addEventListener('click', function () {
    EDU.pickFile('.json,application/json').then(function (file) {
      if (!file) return null;
      if (file.size > 3 * 1024 * 1024) { EDU.toast(t('import_bad')); return null; }
      return EDU.readText(file).then(function (txt) {
        var o = null;
        try { o = JSON.parse(String(txt).replace(/^﻿/, '')); } catch (e) { o = null; }
        if (!o || o.app !== SLUG || !o.project || typeof o.project !== 'object') { EDU.toast(t('import_bad')); return; }
        var p = cleanProject(o.project);
        p.id = uid(); p.edited = true;
        projects.push(p);
        switchTo(p);
        EDU.toast(t('imported'));
      });
    }).catch(function () { EDU.toast(t('import_bad')); });
  });

  var printBlank = false;
  window.addEventListener('beforeprint', function () { renderCanvas(printBlank); });
  window.addEventListener('afterprint', function () { if (printBlank) { printBlank = false; renderCanvas(false); } });
  $('#btn-print').addEventListener('click', function () { printBlank = false; renderCanvas(false); window.print(); });
  $('#btn-print-blank').addEventListener('click', function () { printBlank = true; renderCanvas(true); window.print(); });
  $('#btn-txt').addEventListener('click', function () { EDU.download(fileBase(cur) + '.txt', '﻿' + buildText(cur), 'text/plain'); });
  $('#btn-copy').addEventListener('click', function () { EDU.copy(buildText(cur)); });
  $('#btn-fs').addEventListener('click', function () { EDU.fullscreen($('#canvas-body')); });

  EDU.onLang(function () {
    /* untouched samples follow the UI language; anything a student typed stays as typed */
    var changed = false;
    projects.forEach(function (p) {
      if (p.sampleOf !== null && !p.edited && sampleText(p.sampleOf, EDU.lang)) { fillSampleText(p, p.sampleOf, EDU.lang); changed = true; }
    });
    if (changed) { fillForm(); scheduleSave(); }
    renderAll();
  });

  fillForm();
  renderAll();
  saveNow();
})();
