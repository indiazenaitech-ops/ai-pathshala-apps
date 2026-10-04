/* Unit Converter: two-way unit conversion with factor + steps, and Indian / international number systems. */
(function () {
  'use strict';
  var SLUG = 'unit-converter';
  var store = EDU.store(SLUG);
  var CATS = window.UC_UNITS || [];
  var W = window.UCWords;
  var $ = EDU.$, el = EDU.el, t = EDU.t;

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ------------------------------------------------------------------ state */
  var TABS = ['convert', 'numbers', 'practice'];
  function freshPr() { return { topic: 'mixed', level: 'easy', q: null, n: 1, c: 0, tot: 0, streak: 0, done: false, res: null, given: '' }; }
  function freshState() {
    return { tab: 'convert', cat: 'length', pairs: {}, vals: {}, num: '12345678', digits: 8, quiz: false, revealed: false,
      pr: freshPr(), ws: { items: [], show: false } };
  }
  var state = freshState();
  (function load() {
    var tab = store.get('tab', 'convert');
    state.tab = TABS.indexOf(tab) >= 0 ? tab : 'convert';
    var c = store.get('cat', 'length');
    state.cat = catById(c) ? c : 'length';
    var p = store.get('pairs', {}); state.pairs = p && typeof p === 'object' ? p : {};
    var v = store.get('vals', {}); state.vals = v && typeof v === 'object' ? v : {};
    var n = store.get('num', '12345678'); state.num = typeof n === 'string' ? n : '12345678';
    var d = Number(store.get('digits', 8)); state.digits = d >= 1 && d <= 15 ? Math.round(d) : 8;
    state.quiz = !!store.get('quiz', false);
    var pr = store.get('pr', null), P = freshPr();
    if (pr && typeof pr === 'object') {
      P.topic = pr.topic === 'mixed' || catById(pr.topic) ? pr.topic : 'mixed';
      P.level = pr.level === 'hard' ? 'hard' : 'easy';
      P.q = validQ(pr.q) ? pr.q : null;
      ['n', 'c', 'tot', 'streak'].forEach(function (k) { var x = Number(pr[k]); if (isFinite(x) && x >= 0) P[k] = Math.floor(x); });
      if (P.n < 1) P.n = 1;
      if (P.c > P.tot) P.c = P.tot;
      P.done = !!pr.done && !!P.q && ['exact', 'close', 'wrong'].indexOf(pr.res) >= 0;
      P.res = P.done ? pr.res : null;
      P.given = P.done && typeof pr.given === 'string' ? pr.given.slice(0, 40) : '';
    }
    state.pr = P;
    var ws = store.get('ws', null);
    if (ws && Array.isArray(ws.items) && ws.items.length && ws.items.every(validQ)) state.ws = { items: ws.items.slice(0, 10), show: !!ws.show };
  })();
  function save() {
    store.set('tab', state.tab); store.set('cat', state.cat); store.set('pairs', state.pairs);
    store.set('vals', state.vals); store.set('num', state.num); store.set('digits', state.digits); store.set('quiz', state.quiz);
  }
  function savePr() { store.set('pr', state.pr); store.set('ws', state.ws); }
  /* A stored practice question must point to real units and hold finite numbers. */
  function validQ(q) {
    if (!q || typeof q !== 'object') return false;
    var cat = catById(q.cat);
    return !!(cat && unitById(cat, q.a) && unitById(cat, q.b) && typeof q.v === 'number' && isFinite(q.v) && typeof q.r === 'number' && isFinite(q.r));
  }

  function catById(id) { for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i]; return null; }
  function unitById(cat, id) { for (var i = 0; i < cat.units.length; i++) if (cat.units[i].id === id) return cat.units[i]; return null; }
  function curCat() { return catById(state.cat) || CATS[0]; }
  function pairFor(cat) {
    var p = state.pairs[cat.id];
    if (!Array.isArray(p) || !unitById(cat, p[0]) || !unitById(cat, p[1])) p = [cat.def[0], cat.def[1]];
    return p;
  }
  function valFor(cat) {
    var v = state.vals[cat.id];
    if (!v || typeof v.v !== 'string') v = { v: cat.def[2], side: 'a' };
    if (v.side !== 'b') v.side = 'a';
    return v;
  }
  function unitName(u) { return t('u_' + u.id); }

  /* Text with inline maths ("1 km = 1000 m"). In Urdu (RTL) every Latin/number run is isolated
     as its own left-to-right island, otherwise the bidi algorithm scrambles the formula. */
  var LTR_RUN = /[0-9A-Za-z°µ(][0-9A-Za-z°µ²³\/.,%()×÷=+\-−– ]*[0-9A-Za-z°µ²³)%]|[0-9A-Za-z]/g;
  function setRich(node, text) {
    node.textContent = '';
    if (document.documentElement.dir !== 'rtl') { node.textContent = text; return node; }
    var last = 0, m;
    LTR_RUN.lastIndex = 0;
    while ((m = LTR_RUN.exec(text))) {
      if (m.index > last) node.appendChild(document.createTextNode(text.slice(last, m.index)));
      node.appendChild(el('span', { class: 'uc-ltr no-i18n', dir: 'ltr', text: m[0] }));
      last = m.index + m[0].length;
    }
    if (last < text.length) node.appendChild(document.createTextNode(text.slice(last)));
    return node;
  }
  function rich(tag, props, text) { return setRich(el(tag, props), text); }

  /* ------------------------------------------------------------------ numbers */
  var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  function sup(n) { return String(n).replace(/[0-9-]/g, function (c) { return SUP[c]; }); }
  function round(x, p) { return Number(x.toPrecision(p || 10)); }
  /* Pretty number for reading: Indian grouping, up to 10 significant digits, × 10ⁿ for huge / tiny values */
  function pretty(x) {
    if (!isFinite(x)) return '—';
    if (x === 0) return '0';
    var a = Math.abs(x);
    if (a >= 1e12 || a < 1e-6) {
      var e = Math.floor(Math.log10(a)), m = round(x / Math.pow(10, e), 7);
      if (Math.abs(m) >= 10) { m = round(m / 10, 7); e += 1; }
      return EDU.fmt(m, { maximumFractionDigits: 6 }) + ' × 10' + sup(e);
    }
    return EDU.fmt(round(x, 10), { maximumFractionDigits: 10 });
  }
  /* Plain number for the input boxes (easy to edit, no commas) */
  function plain(x) { return isFinite(x) ? String(round(x, 12)) : ''; }
  function sigDigits(x) {
    var s = Math.abs(x).toPrecision(10).split('e')[0].replace('.', '').replace(/^0+/, '').replace(/0+$/, '');
    return s.length || 1;
  }
  function parseNum(s) {
    s = String(s == null ? '' : s).trim().replace(/[\s,_']/g, '').replace(/[−–]/g, '-');
    if (s === '' || s === '-' || s === '+') return { empty: true };
    if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return { bad: true };
    var v = parseFloat(s);
    if (!isFinite(v)) return { big: true };
    return { v: v };
  }

  /* ------------------------------------------------------------------ conversion */
  function toC(u, v) { return u === 'c' ? v : u === 'f' ? (v - 32) * 5 / 9 : v - 273.15; }
  function fromC(u, c) { return u === 'c' ? c : u === 'f' ? c * 9 / 5 + 32 : c + 273.15; }
  function convert(cat, ua, ub, v) {
    if (cat.temp) return fromC(ub.id, toC(ua.id, v));
    return v * ua.f / ub.f;
  }

  var TEMP_FORMULA = {
    'c>f': { f: '°F = °C × 9/5 + 32', put: function (v) { return '°F = ' + pretty(v) + ' × 9/5 + 32'; }, work: function (v, r) { return '= ' + pretty(v * 9 / 5) + ' + 32 = ' + pretty(r); } },
    'f>c': { f: '°C = (°F − 32) × 5/9', put: function (v) { return '°C = (' + pretty(v) + ' − 32) × 5/9'; }, work: function (v, r) { return '= ' + pretty(v - 32) + ' × 5/9 = ' + pretty(r); } },
    'c>k': { f: 'K = °C + 273.15', put: function (v) { return 'K = ' + pretty(v) + ' + 273.15'; }, work: function (v, r) { return '= ' + pretty(r); } },
    'k>c': { f: '°C = K − 273.15', put: function (v) { return '°C = ' + pretty(v) + ' − 273.15'; }, work: function (v, r) { return '= ' + pretty(r); } },
    'f>k': { f: 'K = (°F − 32) × 5/9 + 273.15', put: function (v) { return 'K = (' + pretty(v) + ' − 32) × 5/9 + 273.15'; }, work: function (v, r) { return '= ' + pretty((v - 32) * 5 / 9) + ' + 273.15 = ' + pretty(r); } },
    'k>f': { f: '°F = (K − 273.15) × 9/5 + 32', put: function (v) { return '°F = (' + pretty(v) + ' − 273.15) × 9/5 + 32'; }, work: function (v, r) { return '= ' + pretty((v - 273.15) * 9 / 5) + ' + 32 = ' + pretty(r); } }
  };

  /* Build {steps:[{lbl, math, ans}], hint, factor:[lines]} for v (in ua) → r (in ub) */
  function explain(cat, ua, ub, v, r) {
    var steps = [], hint = '', factor = [];
    var answer = { lbl: t('step_answer'), math: pretty(v) + ' ' + ua.sym + ' = ' + pretty(r) + ' ' + ub.sym, ans: true };
    if (cat.temp) {
      if (ua.id === ub.id) {
        hint = t('hint_same');
        factor.push('1 ' + ua.sym + ' = 1 ' + ub.sym);
      } else {
        var F = TEMP_FORMULA[ua.id + '>' + ub.id], B = TEMP_FORMULA[ub.id + '>' + ua.id];
        factor.push(F.f, B.f);
        steps.push({ lbl: t('step_formula'), math: F.f });
        steps.push({ lbl: t('step_put'), math: F.put(v) });
        steps.push({ lbl: t('step_work'), math: F.work(v, r) });
      }
      steps.push(answer);
      return { steps: steps, hint: hint, factor: factor };
    }
    var f = ua.f / ub.f;
    factor.push('1 ' + ua.sym + ' = ' + pretty(f) + ' ' + ub.sym);
    if (ua.id !== ub.id) factor.push('1 ' + ub.sym + ' = ' + pretty(1 / f) + ' ' + ua.sym);
    var m = round(f, 10), d = round(1 / f, 10);
    if (m === 1) {
      hint = t('hint_same');
    } else if (ua.id === 'kmh' && ub.id === 'mps') {
      steps.push({ lbl: t('step_relation'), math: '1 km/h = 1000 m ÷ 3600 s = 5/18 m/s' });
      steps.push({ lbl: t('step_shortcut', { f: '5/18' }), math: pretty(v) + ' × 5/18 = ' + pretty(r) });
    } else if (ua.id === 'mps' && ub.id === 'kmh') {
      steps.push({ lbl: t('step_relation'), math: '1 m/s = (1/1000 km) ÷ (1/3600 h) = 18/5 km/h' });
      steps.push({ lbl: t('step_shortcut', { f: '18/5' }), math: pretty(v) + ' × 18/5 = ' + pretty(r) });
    } else {
      var sm = sigDigits(m), sd = sigDigits(d);
      var useDiv = sd < sm || (sd === sm && f < 1);
      if (!useDiv) {
        steps.push({ lbl: t('step_relation'), math: '1 ' + ua.sym + ' = ' + pretty(m) + ' ' + ub.sym });
        steps.push({ lbl: t('step_mult', { f: pretty(m) }), math: pretty(v) + ' × ' + pretty(m) + ' = ' + pretty(r) });
      } else {
        steps.push({ lbl: t('step_relation'), math: '1 ' + ub.sym + ' = ' + pretty(d) + ' ' + ua.sym });
        steps.push({ lbl: t('step_div', { f: pretty(d) }), math: pretty(v) + ' ÷ ' + pretty(d) + ' = ' + pretty(r) });
      }
    }
    if (!hint) hint = f > 1 ? t('hint_bigger') : t('hint_smaller');
    steps.push(answer);
    return { steps: steps, hint: hint, factor: factor };
  }

  /* ------------------------------------------------------------------ converter UI */
  var inA = $('#in-a'), inB = $('#in-b'), selA = $('#unit-a'), selB = $('#unit-b');
  var lastResult = '';

  function renderCats() {
    var box = $('#cats');
    box.textContent = '';
    CATS.forEach(function (c) {
      box.appendChild(el('button', {
        type: 'button', class: 'chip', 'aria-pressed': String(c.id === state.cat), dataset: { cat: c.id },
        onclick: function () { state.cat = c.id; save(); renderConverter(); }
      }, el('span', { class: 'ic', 'aria-hidden': 'true', text: c.icon }), el('span', { text: t('cat_' + c.id) })));
    });
  }

  function fillSelect(sel, cat, value) {
    sel.textContent = '';
    cat.units.forEach(function (u) {
      sel.appendChild(el('option', { value: u.id, text: unitName(u) + ' (' + u.sym + ')' }));
    });
    sel.value = value;
  }

  function renderConverter() {
    var cat = curCat(), pair = pairFor(cat), val = valFor(cat);
    EDU.$$('#cats .chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.cat === cat.id)); });
    var title = $('#cat-title');
    title.textContent = '';
    title.appendChild(el('span', { 'aria-hidden': 'true', text: cat.icon }));
    title.appendChild(el('span', { text: t('cat_' + cat.id) }));
    fillSelect(selA, cat, pair[0]);
    fillSelect(selB, cat, pair[1]);
    $('#pm-a').hidden = !cat.temp; $('#pm-b').hidden = !cat.temp;
    if (val.side === 'a') inA.value = val.v; else inB.value = val.v;
    renderExamples(cat);
    setRich($('#note'), t('note_' + cat.id));
    renderSpecial(cat);
    compute();
  }

  function renderExamples(cat) {
    var box = $('#examples');
    box.textContent = '';
    cat.ex.forEach(function (ex) {
      box.appendChild(setRich(el('button', {
        type: 'button', class: 'chip', dataset: { ex: ex.k },
        onclick: function () {
          state.pairs[cat.id] = [ex.a, ex.b];
          state.vals[cat.id] = { v: ex.v, side: 'a' };
          save(); renderConverter();
        }
      }), t(ex.k)));
    });
  }

  function renderSpecial(cat) {
    var box = $('#special');
    box.textContent = '';
    if (cat.id === 'speed') {
      box.appendChild(el('div', { class: 'callout accent' },
        el('h3', { text: t('speed_trick_title') }), rich('p', {}, t('speed_trick'))));
    } else if (cat.id === 'temp') {
      box.appendChild(el('div', { class: 'callout accent' },
        el('h3', { text: t('temp_formulas_title') }),
        el('div', { class: 'uc-formulas' },
          el('span', { class: 'math no-i18n', text: '°F = °C × 9/5 + 32' }),
          el('span', { class: 'math no-i18n', text: '°C = (°F − 32) × 5/9' }),
          el('span', { class: 'math no-i18n', text: 'K = °C + 273.15' }))));
    } else if (cat.id === 'data') {
      box.appendChild(el('div', { class: 'callout warning' }, rich('p', {}, t('data_note'))));
    } else if (cat.id === 'area') {
      box.appendChild(el('div', { class: 'callout warning' }, el('p', { text: t('area_note') })));
    }
  }

  function clearOutputs() {
    $('#result').textContent = '';
    $('#factor').textContent = '';
    $('#steps').textContent = '';
    $('#hint').textContent = '';
    $('#all-units tbody').textContent = '';
    lastResult = '';
  }

  function compute() {
    var cat = curCat(), pair = pairFor(cat), val = valFor(cat);
    var ua = unitById(cat, pair[0]), ub = unitById(cat, pair[1]);
    var srcIn = val.side === 'a' ? inA : inB, dstIn = val.side === 'a' ? inB : inA;
    var src = val.side === 'a' ? ua : ub, dst = val.side === 'a' ? ub : ua;
    var err = $('#err');
    srcIn.removeAttribute('aria-invalid'); dstIn.removeAttribute('aria-invalid');
    err.textContent = '';
    var p = parseNum(srcIn.value);
    if (p.empty) { dstIn.value = ''; clearOutputs(); err.textContent = t('type_number'); return; }
    if (p.bad || p.big) {
      dstIn.value = ''; clearOutputs(); srcIn.setAttribute('aria-invalid', 'true');
      err.textContent = p.big ? t('too_big') : t('type_number'); return;
    }
    var v = p.v;
    if (cat.temp && toC(src.id, v) < -273.15 - 1e-9) {
      dstIn.value = ''; clearOutputs(); srcIn.setAttribute('aria-invalid', 'true');
      err.textContent = t('below_zero'); return;
    }
    var r = convert(cat, src, dst, v);
    if (!isFinite(r) || (r !== 0 && Math.abs(r) < 1e-300)) {
      dstIn.value = ''; clearOutputs(); err.textContent = t('too_big'); return;
    }
    dstIn.value = plain(r);
    var ex = explain(cat, src, dst, v, r);
    lastResult = pretty(v) + ' ' + src.sym + ' = ' + pretty(r) + ' ' + dst.sym;
    var res = $('#result');
    res.textContent = '';
    res.appendChild(el('span', { class: 'math no-i18n', id: 'result-math', text: lastResult }));
    var fac = $('#factor');
    fac.textContent = '';
    ex.factor.forEach(function (line) { fac.appendChild(el('span', { class: 'math no-i18n', text: line })); });
    var ol = $('#steps');
    ol.textContent = '';
    ex.steps.forEach(function (s) {
      ol.appendChild(el('li', { class: s.ans ? 'ans' : '' },
        rich('span', { class: 'lbl' }, s.lbl), el('span', { class: 'math no-i18n', text: s.math })));
    });
    setRich($('#hint'), ex.hint);
    renderAllUnits(cat, src, v, ua, ub);
  }

  function renderAllUnits(cat, src, v, ua, ub) {
    var tb = $('#all-units tbody');
    tb.textContent = '';
    cat.units.forEach(function (u) {
      var x = convert(cat, src, u, v);
      var pick = function () {
        var side = valFor(cat).side, pair = pairFor(cat).slice();
        if (side === 'a') pair[1] = u.id; else pair[0] = u.id;
        state.pairs[cat.id] = pair; save(); renderConverter();
      };
      var tr = el('tr', { class: (u.id === ua.id ? 'is-a' : '') + (u.id === ub.id ? ' is-b' : ''), dataset: { unit: u.id }, onclick: pick },
        el('td', {}, el('button', { type: 'button', class: 'rowbtn', onclick: function (e) { e.stopPropagation(); pick(); } },
          el('span', { text: unitName(u) + ' ' }), el('span', { class: 'sym uc-ltr', text: '(' + u.sym + ')' }))),
        el('td', { class: 'v' }, el('span', { class: 'math no-i18n', text: pretty(x) + ' ' + u.sym })));
      tb.appendChild(tr);
    });
  }

  function onType(side) {
    var cat = curCat();
    state.vals[cat.id] = { v: (side === 'a' ? inA : inB).value, side: side };
    save(); compute();
  }
  inA.addEventListener('input', function () { onType('a'); });
  inB.addEventListener('input', function () { onType('b'); });
  function onUnits() {
    var cat = curCat();
    state.pairs[cat.id] = [selA.value, selB.value];
    save(); renderConverter();
  }
  selA.addEventListener('change', onUnits);
  selB.addEventListener('change', onUnits);
  $('#swap').addEventListener('click', function () {
    var cat = curCat(), p = pairFor(cat);
    state.pairs[cat.id] = [p[1], p[0]];
    var val = valFor(cat);
    state.vals[cat.id] = { v: (val.side === 'a' ? inA : inB).value, side: val.side };
    save(); renderConverter();
  });
  function toggleSign(side) {
    var inp = side === 'a' ? inA : inB, s = inp.value.trim();
    inp.value = s.charAt(0) === '-' ? s.slice(1) : '-' + (s || '0');
    onType(side);
  }
  $('#pm-a').addEventListener('click', function () { toggleSign('a'); });
  $('#pm-b').addEventListener('click', function () { toggleSign('b'); });
  $('#copy-res').addEventListener('click', function () { if (lastResult) EDU.copy(lastResult); else EDU.toast(t('type_number')); });
  $('#print-btn').addEventListener('click', function () { window.print(); });
  $('#num-print').addEventListener('click', function () { window.print(); });
  $('#fs-btn').addEventListener('click', function () { EDU.fullscreen(); });
  $('#reset-btn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    ['tab', 'cat', 'pairs', 'vals', 'num', 'digits', 'quiz', 'pr', 'ws'].forEach(function (k) { store.remove(k); });
    var tab = state.tab;
    state = freshState(); state.tab = tab;
    inA.value = ''; inB.value = ''; $('#pr-ans').value = '';
    renderAll();
  });

  /* ------------------------------------------------------------------ tabs */
  function setTab(name) {
    state.tab = TABS.indexOf(name) >= 0 ? name : 'convert';
    TABS.forEach(function (n) {
      var on = n === state.tab, tab = $('#tab-' + n);
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      $('#pane-' + n).hidden = !on;
    });
    store.set('tab', state.tab);
  }
  TABS.forEach(function (n) { $('#tab-' + n).addEventListener('click', function () { setTab(n); }); });
  /* Arrow keys move between tabs (mirrored for right-to-left Urdu); Home / End jump to the ends. */
  $('.uc-tabs').addEventListener('keydown', function (e) {
    var i = TABS.indexOf(state.tab), rtl = document.documentElement.dir === 'rtl';
    if (e.key === 'ArrowRight') i += rtl ? -1 : 1;
    else if (e.key === 'ArrowLeft') i += rtl ? 1 : -1;
    else if (e.key === 'Home') i = 0;
    else if (e.key === 'End') i = TABS.length - 1;
    else return;
    e.preventDefault();
    var next = TABS[(i + TABS.length) % TABS.length];
    setTab(next); $('#tab-' + next).focus();
  });

  /* ------------------------------------------------------------------ number systems */
  var numIn = $('#num-in');
  var NUM_EX = [{ k: 'nx_moon', n: '384400' }, { k: 'nx_light', n: '299792458' }, { k: 'nx_year', n: '31536000' }];
  var CMP = [
    { n: '1000', ind: [['1', 'w_thousand']], intl: [['1', 'w_thousand']], z: 3 },
    { n: '100000', ind: [['1', 'w_lakh']], intl: [['100', 'w_thousand']], z: 5 },
    { n: '1000000', ind: [['10', 'w_lakh']], intl: [['1', 'w_million']], z: 6 },
    { n: '10000000', ind: [['1', 'w_crore']], intl: [['10', 'w_million']], z: 7 },
    { n: '100000000', ind: [['10', 'w_crore']], intl: [['100', 'w_million']], z: 8 },
    { n: '1000000000', ind: [['100', 'w_crore']], intl: [['1', 'w_billion']], z: 9 },
    { n: '1000000000000', ind: [['1', 'w_lakh'], ['', 'w_crore']], intl: [['1', 'w_trillion']], z: 12 }
  ];
  /* place value columns, highest first (9 digits) */
  var PV_IN = { periods: [['period_crores', 2], ['period_lakhs', 2], ['period_thousands', 2], ['period_ones', 3]],
    places: ['pv_tc', 'pv_c', 'pv_tl', 'pv_l', 'pv_tth', 'pv_th', 'pv_h', 'pv_t', 'pv_o'] };
  var PV_INTL = { periods: [['period_millions', 3], ['period_thousands', 3], ['period_ones', 3]],
    places: ['pv_hm', 'pv_tm', 'pv_m', 'pv_hth', 'pv_tth', 'pv_th', 'pv_h', 'pv_t', 'pv_o'] };

  function periodWords() {
    return { thousand: t('w_thousand'), lakh: t('w_lakh'), crore: t('w_crore'), million: t('w_million'), billion: t('w_billion'), trillion: t('w_trillion') };
  }
  function phrase(parts) { return parts.map(function (p) { return (p[0] ? p[0] + ' ' : '') + t(p[1]); }).join(' '); }

  function renderNumCtrls() {
    var sel = $('#num-digits');
    sel.textContent = '';
    for (var d = 1; d <= 15; d++) sel.appendChild(el('option', { value: String(d), text: t('digits_n', { n: d }) }));
    sel.value = String(state.digits);
    var box = $('#num-examples');
    box.textContent = '';
    NUM_EX.forEach(function (x) {
      box.appendChild(el('button', { type: 'button', class: 'chip', text: t(x.k), dataset: { n: x.n },
        onclick: function () { setNum(x.n); } }));
    });
    $('#quiz').checked = state.quiz;
    var tb = $('#cmp tbody');
    tb.textContent = '';
    CMP.forEach(function (row) {
      var pick = function () { setNum(row.n); numIn.focus(); };
      tb.appendChild(el('tr', { onclick: pick, dataset: { n: row.n } },
        el('td', {}, el('button', { type: 'button', class: 'rowbtn', onclick: function (e) { e.stopPropagation(); pick(); } }, el('strong', { text: phrase(row.ind) })),
          el('div', { class: 'math muted no-i18n', text: W.groupIndian(row.n) })),
        el('td', {}, el('strong', { text: phrase(row.intl) }), el('div', { class: 'math muted no-i18n', text: W.groupIntl(row.n) })),
        el('td', { class: 'n' }, el('span', { class: 'math no-i18n', text: String(row.z) }))));
    });
  }

  function setNum(n) {
    state.num = n; state.revealed = false;
    numIn.value = n;
    store.set('num', n);
    renderNumbers();
  }

  function pvTable(tbl, def, s) {
    tbl.textContent = '';
    var thead = el('thead'), r1 = el('tr'), r2 = el('tr'), body = el('tbody'), r3 = el('tr');
    var col = 0, pIdx = 0, nPer = def.periods.length;
    def.periods.forEach(function (p) {
      var cls = 'p' + (nPer - 1 - pIdx);
      r1.appendChild(el('th', { colspan: String(p[1]), class: cls, scope: 'colgroup', text: t(p[0]) }));
      for (var i = 0; i < p[1]; i++, col++) {
        var place = 8 - col;   /* power of ten */
        r2.appendChild(el('th', { class: cls, scope: 'col', text: t(def.places[col]) }));
        var digit = place < s.length ? s.charAt(s.length - 1 - place) : '';
        r3.appendChild(el('td', { class: cls + ' no-i18n', dataset: { place: String(place) }, text: digit }));
      }
      pIdx++;
    });
    thead.appendChild(r1); thead.appendChild(r2); body.appendChild(r3);
    tbl.appendChild(thead); tbl.appendChild(body);
  }

  function renderNumbers() {
    var s = W.clean(state.num);
    var err = $('#num-err'), out = $('#num-out');
    if (numIn.value !== state.num && document.activeElement !== numIn) numIn.value = state.num;
    if (s === null) {
      err.textContent = t('num_invalid');
      numIn.setAttribute('aria-invalid', 'true');
      out.hidden = true;
      return;
    }
    err.textContent = '';
    numIn.removeAttribute('aria-invalid');
    out.hidden = false;
    var w = periodWords();
    $('#in-group').textContent = W.groupIndian(s);
    $('#intl-group').textContent = W.groupIntl(s);
    $('#in-short').textContent = W.shortIndian(s, w);
    $('#intl-short').textContent = W.shortIntl(s, w);
    $('#in-en').textContent = W.enIndian(s);
    $('#intl-en').textContent = W.enIntl(s);
    $('#in-hi').textContent = W.hiIndian(s);
    $('#digits-count').textContent = t('digits_n', { n: s.length });
    var big = s.length > 9;
    $('#pv-big').hidden = !big;
    EDU.$$('#pv-in, #pv-intl').forEach(function (tb) { tb.parentNode.hidden = big; });
    EDU.$$('.uc-pv-cap').forEach(function (c) { c.hidden = big; });
    if (!big) { pvTable($('#pv-in'), PV_IN, s); pvTable($('#pv-intl'), PV_INTL, s); }
    /* expanded form */
    var terms = [], pows = [];
    for (var i = 0; i < s.length; i++) {
      var dgt = s.charAt(i), place = s.length - 1 - i;
      if (dgt === '0') continue;
      var pv = '1' + new Array(place + 1).join('0');
      terms.push(place === 0 ? dgt : dgt + ' × ' + W.groupIndian(pv));
      pows.push(place === 0 ? dgt : dgt + ' × 10' + sup(place));
    }
    $('#expanded').textContent = s + ' = ' + (terms.length ? terms.join(' + ') : '0');
    $('#expanded-pow').textContent = s + ' = ' + (pows.length ? pows.join(' + ') : '0');
    var hide = state.quiz && !state.revealed;
    out.classList.toggle('uc-quiz', hide);
    $('#reveal').hidden = !hide;
    $('#quiz-note').hidden = !hide;
  }

  numIn.addEventListener('input', function () {
    state.num = numIn.value; state.revealed = false;
    store.set('num', state.num);
    renderNumbers();
  });
  $('#num-digits').addEventListener('change', function () {
    state.digits = Number($('#num-digits').value) || 8; store.set('digits', state.digits);
  });
  $('#num-rand').addEventListener('click', function () {
    var n = state.digits, s = String(n > 1 ? EDU.randInt(1, 9) : EDU.randInt(0, 9));
    for (var i = 1; i < n; i++) s += EDU.randInt(0, 9);
    setNum(s);
  });
  $('#quiz').addEventListener('change', function () {
    state.quiz = $('#quiz').checked; state.revealed = false; store.set('quiz', state.quiz); renderNumbers();
  });
  $('#reveal').addEventListener('click', function () { state.revealed = true; renderNumbers(); });
  EDU.$$('.say').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-say'), text = $('#' + id).textContent;
      EDU.speak(text, { lang: id === 'in-hi' ? 'hi' : 'en', rate: 0.9 }).then(function (ok) { if (!ok) EDU.toast(t('no_voice')); });
    });
  });

  /* ------------------------------------------------------------------ practice */
  /* Questions are built so the answer is always a "clean" number: for a pair with a whole-number
     factor F (1 big unit = F small units) we either pick a nice value in the big unit (answer = value × F)
     or a nice answer in the big unit (question = answer × F). Temperature and speed have their own makers. */
  function nice(level) {
    var x;
    if (level !== 'hard') return Math.random() < 0.8 ? EDU.randInt(2, 20) : EDU.pick([25, 30, 40, 50, 60, 75]);
    switch (EDU.randInt(0, 2)) {
      case 0: do { x = EDU.randInt(1, 99); } while (x % 10 === 0); return x / 10;            /* 0.1 … 9.9 */
      case 1: return EDU.randInt(1, 30) + EDU.pick([0.25, 0.5, 0.75]);                        /* 4.25, 12.5 … */
      default: do { x = EDU.randInt(101, 999); } while (x % 10 === 0); return x / 100;        /* 1.01 … 9.99 */
    }
  }
  function notMult(lo, hi, m) { var x; do { x = EDU.randInt(lo, hi); } while (x % m === 0); return x; }
  function makeQ(topic, level) {
    var cat = catById(topic) || EDU.pick(CATS), hard = level === 'hard', a, b, v, r, c;
    if (cat.id === 'temp') {
      var kind = EDU.pick(['cf', 'fc', 'ck', 'kc']);
      if (kind === 'cf' || kind === 'fc') {
        c = hard ? notMult(-40, 120, 5) : 5 * EDU.randInt(0, 20);
        var f = round(c * 9 / 5 + 32, 12);
        if (kind === 'cf') { a = 'c'; b = 'f'; v = c; r = f; } else { a = 'f'; b = 'c'; v = f; r = c; }
      } else {
        c = hard ? EDU.randInt(-100, 400) : EDU.randInt(0, 100);
        var k = round(c + 273.15, 12);
        if (kind === 'ck') { a = 'c'; b = 'k'; v = c; r = k; } else { a = 'k'; b = 'c'; v = k; r = c; }
      }
    } else if (cat.id === 'speed') {
      var mps = hard ? notMult(1, 40, 5) : 5 * EDU.randInt(1, 10), kmh = round(mps * 3.6, 12);
      if (Math.random() < 0.5) { a = 'kmh'; b = 'mps'; v = kmh; r = mps; } else { a = 'mps'; b = 'kmh'; v = mps; r = kmh; }
    } else {
      var pair = EDU.pick(cat.pr), big = unitById(cat, pair[0]), small = unitById(cat, pair[1]);
      var F = round(big.f / small.f, 10), n = nice(level);
      if (Math.random() < 0.5) { a = big.id; b = small.id; v = n; r = round(n * F, 12); }
      else { a = small.id; b = big.id; v = round(n * F, 12); r = n; }
    }
    return { cat: cat.id, a: a, b: b, v: v, r: r };
  }
  function sameQ(p, q) { return !!(p && q && p.a === q.a && p.b === q.b && p.v === q.v); }
  /* 'exact' | 'close' (kelvin worked out with 273 instead of 273.15) | 'wrong' | null (not a number) */
  function checkAnswer(q, text) {
    var p = parseNum(text);
    if (p.empty || p.bad || p.big) return null;
    var d = Math.abs(p.v - q.r);
    if (d <= Math.max(1e-9, Math.abs(q.r) * 1e-9)) return 'exact';
    if ((q.a === 'k' || q.b === 'k') && d <= 0.15 + 1e-9) return 'close';
    return 'wrong';
  }
  function qUnits(q) { var cat = catById(q.cat); return { cat: cat, ua: unitById(cat, q.a), ub: unitById(cat, q.b) }; }
  function topicName(topic) { return topic === 'mixed' ? t('pr_mixed') : t('cat_' + topic); }

  function newQuestion(countIt) {
    var P = state.pr, q, tries = 0;
    do { q = makeQ(P.topic, P.level); } while (sameQ(q, P.q) && tries++ < 20);
    if (countIt && P.q) P.n++;
    P.q = q; P.done = false; P.res = null; P.given = '';
    $('#pr-ans').value = '';
  }
  function newWorksheet() {
    var P = state.pr, items = [], tries = 0;
    while (items.length < 10 && tries++ < 300) {
      var q = makeQ(P.topic, P.level);
      if (!items.some(function (x) { return sameQ(x, q); })) items.push(q);
    }
    state.ws.items = items;
  }

  function renderPractice() {
    var P = state.pr, sel = $('#pr-topic');
    sel.textContent = '';
    sel.appendChild(el('option', { value: 'mixed', text: t('pr_mixed') }));
    CATS.forEach(function (c) { sel.appendChild(el('option', { value: c.id, text: t('cat_' + c.id) })); });
    sel.value = P.topic;
    $('#pr-easy').setAttribute('aria-pressed', String(P.level !== 'hard'));
    $('#pr-hard').setAttribute('aria-pressed', String(P.level === 'hard'));
    if (!P.q) { newQuestion(false); savePr(); }
    if (!state.ws.items.length) { newWorksheet(); savePr(); }
    renderQuestion();
    renderWorksheet();
  }

  function renderQuestion(note) {
    var P = state.pr, q = P.q, u = qUnits(q);
    $('#pr-qno').textContent = t('pr_q', { n: EDU.fmt(P.n) });
    $('#pr-score').textContent = t('pr_score', { c: EDU.fmt(P.c), n: EDU.fmt(P.tot) });
    var box = $('#pr-q');
    box.textContent = '';
    box.appendChild(el('span', { class: 'math no-i18n', id: 'pr-q-math', dir: 'ltr', dataset: { cat: q.cat, from: q.a, to: q.b, v: String(q.v) } },
      pretty(q.v) + ' ' + u.ua.sym + ' = ', el('span', { class: 'qm', text: P.done ? pretty(q.r) : '?' }), ' ' + u.ub.sym));
    setRich($('#pr-ans-lbl'), t('pr_your', { unit: u.ub.sym }));
    var inp = $('#pr-ans');
    if (P.done) inp.value = P.given;
    inp.disabled = P.done;
    $('#pr-check').disabled = P.done;
    var fb = $('#pr-fb'), ol = $('#pr-steps');
    fb.textContent = ''; ol.textContent = ''; ol.hidden = true;
    if (note) fb.appendChild(el('p', { class: 'callout warning', text: note }));
    if (P.done) {
      var ans = pretty(q.r) + ' ' + u.ub.sym;
      var msg = P.res === 'exact' ? t('pr_right') : P.res === 'close' ? t('pr_right_exact', { ans: ans }) : t('pr_wrong', { ans: ans });
      fb.appendChild(rich('p', { class: 'callout ' + (P.res === 'wrong' ? 'danger' : 'success'), id: 'pr-msg', dataset: { res: P.res } },
        (P.res === 'wrong' ? '✗ ' : '✓ ') + msg));
      if (P.res === 'wrong') {
        explain(u.cat, u.ua, u.ub, q.v, q.r).steps.forEach(function (s) {
          ol.appendChild(el('li', { class: s.ans ? 'ans' : '' }, rich('span', { class: 'lbl' }, s.lbl), el('span', { class: 'math no-i18n', text: s.math })));
        });
        ol.hidden = false;
      }
    }
    $('#pr-streak').textContent = P.streak > 1 ? t('pr_streak', { n: EDU.fmt(P.streak) }) : '';
  }

  function renderWorksheet() {
    var P = state.pr, ol = $('#ws-list');
    $('#ws-sub').textContent = topicName(P.topic) + ' · ' + (P.level === 'hard' ? t('pr_hard') : t('pr_easy'));
    ol.textContent = '';
    ol.classList.toggle('show-ans', !!state.ws.show);
    state.ws.items.forEach(function (q) {
      var u = qUnits(q);
      ol.appendChild(el('li', {}, el('span', { class: 'math no-i18n', dir: 'ltr' },
        pretty(q.v) + ' ' + u.ua.sym + ' = ', el('span', { class: 'blank', 'aria-hidden': 'true' }),
        el('span', { class: 'wsa', text: pretty(q.r) }), ' ' + u.ub.sym)));
    });
    $('#ws-show').checked = !!state.ws.show;
  }

  function setPracticeOptions(topic, level) {
    var P = state.pr;
    if (topic === P.topic && level === P.level) return;
    P.topic = topic; P.level = level;
    newQuestion(P.done); newWorksheet(); savePr();   /* an unanswered question is simply replaced */
    renderPractice();
  }
  $('#pr-topic').addEventListener('change', function () { setPracticeOptions($('#pr-topic').value, state.pr.level); });
  EDU.$$('.uc-seg button').forEach(function (b) {
    b.addEventListener('click', function () { setPracticeOptions(state.pr.topic, b.getAttribute('data-level')); });
  });
  $('#pr-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var P = state.pr, inp = $('#pr-ans');
    if (P.done) return;
    var res = checkAnswer(P.q, inp.value);
    if (!res) { renderQuestion(t('type_number')); inp.focus(); return; }
    P.given = inp.value.trim(); P.done = true; P.res = res; P.tot++;
    if (res === 'wrong') P.streak = 0; else { P.c++; P.streak++; }
    savePr(); renderQuestion();
    $('#pr-next').focus();
  });
  $('#pr-next').addEventListener('click', function () {
    newQuestion(true); savePr(); renderQuestion();
    $('#pr-ans').focus();
  });
  $('#pr-reset').addEventListener('click', function () {
    var P = state.pr;
    P.c = 0; P.tot = 0; P.streak = 0; P.n = 1;
    newQuestion(false); savePr(); renderQuestion();
  });
  $('#ws-new').addEventListener('click', function () { newWorksheet(); savePr(); renderWorksheet(); });
  $('#ws-show').addEventListener('change', function () { state.ws.show = $('#ws-show').checked; savePr(); renderWorksheet(); });
  $('#ws-print').addEventListener('click', function () { window.print(); });

  /* ------------------------------------------------------------------ boot */
  function renderAll() {
    renderCats();
    renderConverter();
    renderNumCtrls();
    numIn.value = state.num;
    renderNumbers();
    renderPractice();
    setTab(state.tab);
  }
  EDU.onLang(function () { renderCats(); renderConverter(); renderNumCtrls(); renderNumbers(); renderPractice(); });
  renderAll();
})();
