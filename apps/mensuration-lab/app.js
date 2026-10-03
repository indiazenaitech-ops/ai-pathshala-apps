/* Area & Volume Lab: mensuration calculator, practice and unit converter. */
(function () {
  'use strict';
  var S = window.ML_SHAPES, DRAW = window.ML_DRAW;
  var t = EDU.t, $ = EDU.$, $$ = EDU.$$, el = EDU.el;
  var store = EDU.store('mensuration-lab');

  var SYM = { area: 'A', perimeter: 'P', circumference: 'C', diameter: 'd', diagonal: 'd', s: 's', side: 'a', leg: 'c', width: 'w',
    volume: 'V', lsa: 'LSA', csa: 'CSA', tsa: 'TSA', sa: 'S', slant: 'l' };
  var UNITS = ['mm', 'cm', 'm', 'km'];
  var UNIT_M = { mm: 0.001, cm: 0.01, m: 1, km: 1000 };
  var CONV = {
    len: [['mm', 1e-3], ['cm', 1e-2], ['m', 1], ['km', 1e3]],
    area: [['mm²', 1e-6], ['cm²', 1e-4], ['m²', 1], ['ha', 1e4, 'u_ha'], ['km²', 1e6]],
    vol: [['mm³', 1e-9], ['cm³', 1e-6], ['mL', 1e-6, 'u_ml'], ['L', 1e-3, 'u_litre'], ['m³', 1]]
  };

  var saved = store.get('state', {}) || {};
  var st = {
    tab: ['calc', 'practice', 'units'].indexOf(saved.tab) >= 0 ? saved.tab : 'calc',
    grp: saved.grp === 3 ? 3 : 2,
    shape2: S.ORDER2.indexOf(saved.shape2) >= 0 ? saved.shape2 : 'circle',
    shape3: S.ORDER3.indexOf(saved.shape3) >= 0 ? saved.shape3 : 'cylinder',
    vals: (saved.vals && typeof saved.vals === 'object') ? saved.vals : {},
    unit: UNITS.indexOf(saved.unit) >= 0 ? saved.unit : 'cm',
    pi: saved.pi === '314' ? '314' : '227',
    pg: ['2', '3', 'b'].indexOf(saved.pg) >= 0 ? saved.pg : 'b',
    score: (saved.score && typeof saved.score.c === 'number') ? saved.score : { c: 0, n: 0, streak: 0 },
    cvKind: CONV[saved.cvKind] ? saved.cvKind : 'area',
    cvVal: typeof saved.cvVal === 'string' ? saved.cvVal : '1',
    cvFrom: typeof saved.cvFrom === 'string' ? saved.cvFrom : 'm²'
  };
  var q = null, ws = null;
  function save() {
    store.set('state', { tab: st.tab, grp: st.grp, shape2: st.shape2, shape3: st.shape3, vals: st.vals, unit: st.unit, pi: st.pi,
      pg: st.pg, score: st.score, cvKind: st.cvKind, cvVal: st.cvVal, cvFrom: st.cvFrom });
  }

  EDU.init({ slug: 'mensuration-lab', title: 'app_title' });

  /* ---------------- number helpers ---------------- */
  function round(x, d) { var f = Math.pow(10, d); return Math.round(x * f) / f; }
  function nf(x) { return EDU.fmt(round(x, 4), { maximumFractionDigits: 4 }); }
  function ans2(x) {
    var ax = Math.abs(x);
    if (ax && (ax < 0.01 || ax >= 1e15)) return smart(x);
    return EDU.fmt(round(x, 2), { maximumFractionDigits: 2 });
  }
  function isApprox(x) { var ax = Math.abs(x); if (ax && ax < 0.01) return Math.abs(x - Number(x.toPrecision(7))) > 1e-12 * ax; return Math.abs(x - round(x, 2)) > 1e-9 * Math.max(1, ax); }
  var SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  function smart(x) {
    if (x === 0) return '0';
    var ax = Math.abs(x);
    if (ax >= 1e-4 && ax < 1e15) return EDU.fmt(x, { maximumSignificantDigits: 7 });
    var e = Math.floor(Math.log10(ax)), m = x / Math.pow(10, e);
    if (Math.abs(m) >= 9.9995) { m /= 10; e += 1; }
    return EDU.fmt(m, { maximumFractionDigits: 3 }) + ' × 10' + String(e).split('').map(function (c) { return SUP[c] || c; }).join('');
  }
  function parseNum(s) {
    s = String(s == null ? '' : s).trim().replace(/[,\s]/g, '').replace(/[٫]/g, '.');
    if (!s || !/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(s)) return NaN;
    return Number(s);
  }
  /* keep maths like "1 m² = 100 × 100 = 10,000 cm²" left-to-right inside Urdu sentences */
  function mathify(txt) {
    return EDU.esc(txt).replace(/[0-9π][0-9A-Za-z²³₁₂.,×=+\-−\/π() ]*[0-9A-Za-z²³₁₂)]/g, function (m) { return '<bdi dir="ltr">' + m + '</bdi>'; });
  }
  function uStr(unit, d) { return d === 0 ? '' : unit + (d === 2 ? '²' : d === 3 ? '³' : ''); }
  function withU(txt, unit, d) { var u = uStr(unit, d); return u ? txt + ' ' + u : txt; }
  function bdi(s, cls) { return '<bdi dir="ltr"' + (cls ? ' class="' + cls + '"' : '') + '>' + EDU.esc(s) + '</bdi>'; }

  /* label size in SVG units so labels stay ~14 px on screen, whatever the figure width */
  function figFs(box, W, min) {
    var w = box && box.clientWidth ? box.clientWidth - 12 : 0;
    if (!w) return min;
    return EDU.clamp(14.5 * W / w, min, 34);
  }
  function curShape() { return st.grp === 3 ? st.shape3 : st.shape2; }
  function valsFor(shape) {
    var d = S.defaults(shape), v = st.vals[shape] || {}, o = {};
    S.DEFS[shape].dims.forEach(function (x) { o[x[0]] = (v[x[0]] !== undefined && v[x[0]] !== null) ? String(v[x[0]]) : String(d[x[0]]); });
    return o;
  }
  function numVals(raw) { var o = {}; Object.keys(raw).forEach(function (k) { o[k] = parseNum(raw[k]); }); return o; }

  /* labels on the drawing: symbol → "r = 7 cm" */
  function labeller(shape, nv, out, unit) {
    var bySym = {};
    S.DEFS[shape].dims.forEach(function (d) { bySym[d[2]] = nv[d[0]]; });
    var slant = out && out.res ? out.res.filter(function (r) { return r.k === 'slant'; })[0] : null;
    return function (sym) {
      var v = bySym[sym];
      if (v === undefined && sym === 'l' && slant) return 'l = ' + ans2(slant.v) + ' ' + unit;
      if (v === undefined) return sym;
      return sym + ' = ' + nf(v) + ' ' + unit;
    };
  }

  function stepsHtml(out, unit) {
    return out.res.map(function (r) {
      var sym = SYM[r.k] || '';
      var lines = ['<div class="math f">' + bdi(sym + ' = ' + r.f) + '</div>'];
      r.s.forEach(function (s) { lines.push('<div class="math">' + bdi('= ' + s) + '</div>'); });
      lines.push('<div class="math ans">' + bdi((isApprox(r.v) ? '≈ ' : '= ') + withU(ans2(r.v), unit, r.d)) + '</div>');
      if (r.k === 'volume') {
        var litres = r.v * Math.pow(UNIT_M[unit], 3) * 1000;
        lines.push('<div class="ml-cap">' + EDU.esc(t('r_capacity')) + ': ' + bdi(smart(litres) + ' L') + ' (' + EDU.esc(t('u_litre')) + ')</div>');
      }
      return '<div class="ml-step" data-k="' + r.k + '"><h4>' + EDU.esc(t('r_' + r.k)) + '</h4>' + lines.join('') + '</div>';
    }).join('');
  }

  /* ---------------- tabs ---------------- */
  function renderTabs() {
    $$('.ml-tabs [data-tab]').forEach(function (b) {
      var on = b.dataset.tab === st.tab;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      $('#pane-' + b.dataset.tab).hidden = !on;
    });
  }
  $$('.ml-tabs [data-tab]').forEach(function (b) {
    b.addEventListener('click', function () {
      st.tab = b.dataset.tab; save(); renderTabs();
      if (st.tab === 'practice') { if (!q) newQuestion(); else renderQuestion(); }
      if (st.tab === 'calc') renderOut();
    });
    b.addEventListener('keydown', function (e) {
      var tabs = $$('.ml-tabs [data-tab]'), i = tabs.indexOf(b), dir = document.documentElement.dir === 'rtl' ? -1 : 1;
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var n = e.key === 'ArrowRight' ? i + dir : i - dir;
      n = (n + tabs.length) % tabs.length; tabs[n].focus(); tabs[n].click();
    });
  });

  /* ---------------- calculator ---------------- */
  function renderPicker() {
    $('#grp-2d').setAttribute('aria-pressed', st.grp === 2 ? 'true' : 'false');
    $('#grp-3d').setAttribute('aria-pressed', st.grp === 3 ? 'true' : 'false');
    $('#grp-hint').textContent = t(st.grp === 3 ? 'grp_3d_hint' : 'grp_2d_hint');
    var list = $('#shape-list'); list.innerHTML = '';
    (st.grp === 3 ? S.ORDER3 : S.ORDER2).forEach(function (sh) {
      list.appendChild(el('button', { type: 'button', class: 'chip', id: 'shape-' + sh, dataset: { shape: sh }, 'aria-pressed': sh === curShape() ? 'true' : 'false',
        text: t('sh_' + sh), onclick: function () { if (st.grp === 3) st.shape3 = sh; else st.shape2 = sh; save(); renderCalc(); } }));
    });
    $$('#unit-seg [data-unit]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.unit === st.unit ? 'true' : 'false'); });
    $$('.pi-seg [data-pi]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.pi === st.pi ? 'true' : 'false'); });
  }

  function renderFields() {
    var sh = curShape(), raw = valsFor(sh), box = $('#fields');
    box.innerHTML = '';
    S.DEFS[sh].dims.forEach(function (d) {
      var inp = el('input', { type: 'text', inputmode: 'decimal', id: 'in-' + d[0], value: raw[d[0]], autocomplete: 'off', dataset: { dim: d[0] } });
      inp.addEventListener('input', function () {
        st.vals[sh] = st.vals[sh] || {};
        st.vals[sh][d[0]] = inp.value;
        save(); renderOut();
      });
      box.appendChild(el('label', { class: 'field', for: 'in-' + d[0] }, el('span', { class: 'lbl', style: { color: 'var(--text)', fontWeight: '600' }, text: t(d[1]) + ' · ' + st.unit }), inp));
    });
  }

  function renderOut() {
    var sh = curShape(), raw = valsFor(sh), nv = numVals(raw), unit = st.unit;
    var out = S.compute(sh, nv, st.pi, nf);
    S.DEFS[sh].dims.forEach(function (d) {
      var i = $('#in-' + d[0]); if (!i) return;
      var x = nv[d[0]]; i.setAttribute('aria-invalid', (!isFinite(x) || x <= 0 || x > S.MAX) ? 'true' : 'false');
    });
    $('#shape-name').textContent = t('sh_' + sh);
    $('#shape-real').textContent = t('real_life', { x: t('ex_' + sh) });
    var given = S.DEFS[sh].dims.map(function (d) { return d[2] + ' = ' + (isFinite(nv[d[0]]) ? nf(nv[d[0]]) : '?') + ' ' + unit; }).join(',  ');
    $('#given-line').innerHTML = EDU.esc(t('pr_given')) + ': ' + bdi(given);
    var errBox = $('#calc-error'), outBox = $('#calc-out');
    $('#view-card').dataset.state = out.err ? 'error' : 'ok';
    if (out.err) {
      errBox.hidden = false;
      errBox.textContent = t(out.err, { max: EDU.fmt(S.MAX) });
      errBox.dataset.err = out.err;
      outBox.hidden = true;
      $('#figure').innerHTML = '';
      return;
    }
    errBox.hidden = true; errBox.dataset.err = ''; outBox.hidden = false;
    $('#figure').innerHTML = DRAW(sh, nv, { lab: labeller(sh, nv, out, unit), title: t('fig_aria') + ': ' + t('sh_' + sh), fs: figFs($('#figure'), 480, 16) });

    var mainK = S.DEFS[sh].g === 3 ? 'volume' : 'area', approx = false;
    var res = $('#results'); res.innerHTML = '';
    out.res.forEach(function (r) {
      if (isApprox(r.v)) approx = true;
      var tile = el('div', { class: 'ml-tile' + (r.k === mainK ? ' main' : ''), id: 'res-' + r.k, dataset: { value: String(round(r.v, 6)), k: r.k } },
        el('div', { class: 'k', text: t('r_' + r.k) }),
        el('bdi', { class: 'v', dir: 'ltr', text: (isApprox(r.v) ? '≈ ' : '') + withU(ans2(r.v), unit, r.d) }));
      res.appendChild(tile);
    });
    $('#working').innerHTML = stepsHtml(out, unit);
    $('#approx-note').hidden = !approx;

    /* same answer in other units */
    var main = out.res.filter(function (r) { return r.k === mainK; })[0];
    var kind = mainK === 'volume' ? 'vol' : 'area', pw = mainK === 'volume' ? 3 : 2;
    var si = main.v * Math.pow(UNIT_M[unit], pw);
    $('#conv-title').textContent = t('other_units') + ' · ' + t('r_' + mainK);
    var rows = CONV[kind].map(function (u) {
      var isFrom = u[0] === uStr(unit, pw);
      return '<tr' + (isFrom ? ' class="from"' : '') + ' data-unit="' + u[0] + '" data-value="' + (si / u[1]) + '"><td class="u">' + bdi(u[0]) + (u[2] ? ' <span class="muted small">(' + EDU.esc(t(u[2])) + ')</span>' : '') + '</td><td class="n">' + bdi(smart(si / u[1])) + '</td></tr>';
    }).join('');
    $('#conv').innerHTML = '<thead><tr><th>' + EDU.esc(t('cv_unit_col')) + '</th><th class="n">' + EDU.esc(t('cv_value_col')) + '</th></tr></thead><tbody>' + rows + '</tbody>';

    var notes = $('#notes'); notes.innerHTML = '';
    out.notes.forEach(function (k) { notes.appendChild(el('p', { class: 'callout' + (k === 'note_pi' ? ' accent' : ''), html: mathify(t(k)) })); });
  }

  function renderCalc() { renderPicker(); renderFields(); renderOut(); }

  $('#grp-2d').addEventListener('click', function () { st.grp = 2; save(); renderCalc(); });
  $('#grp-3d').addEventListener('click', function () { st.grp = 3; save(); renderCalc(); });
  $$('#unit-seg [data-unit]').forEach(function (b) { b.addEventListener('click', function () { st.unit = b.dataset.unit; save(); renderCalc(); }); });
  $$('.pi-seg [data-pi]').forEach(function (b) {
    b.addEventListener('click', function () {
      st.pi = b.dataset.pi; save(); renderPicker(); renderOut();
      if (q && !q.done) { newQuestion(); } else renderQuestion();
      renderWsNote();
    });
  });
  $('#sample').addEventListener('click', function () { delete st.vals[curShape()]; st.unit = 'cm'; save(); renderCalc(); });
  $('#print-btn').addEventListener('click', function () { document.body.classList.remove('ml-print-ws'); window.print(); });
  $('#fs-btn').addEventListener('click', function () { EDU.fullscreen($('#view-card')); });

  /* ---------------- practice ---------------- */
  function poolFor(pg) { return pg === '2' ? S.ORDER2 : pg === '3' ? S.ORDER3 : S.ORDER2.concat(S.ORDER3); }
  function makeQuestion(pg, pm) {
    var shape = EDU.pick(poolFor(pg)), vals = S.gen(shape, pm), unit = EDU.pick(['cm', 'cm', 'cm', 'm']);
    var k = EDU.pick(S.ASK[shape]);
    var out = S.compute(shape, vals, pm, nf);
    var r = out.res.filter(function (x) { return x.k === k; })[0];
    return { shape: shape, vals: vals, unit: unit, k: k, d: r.d, ans: round(r.v, 2), pm: pm, done: false };
  }
  function newQuestion() {
    q = makeQuestion(st.pg, st.pi);
    $('#q-ans').value = '';
    $('#q-feedback').textContent = ''; $('#q-feedback').className = 'callout';
    renderQuestion();
  }
  function givenLines(shape, vals, unit) {
    return S.DEFS[shape].dims.map(function (d) { return '<div>' + EDU.esc(t(d[1])) + ' = ' + bdi(nf(vals[d[0]]) + ' ' + unit) + '</div>'; }).join('');
  }
  function figFor(shape, vals, unit, small, fs) {
    var gl = function (sym) {
      var dd = S.DEFS[shape].dims.filter(function (d) { return d[2] === sym; })[0];
      if (dd) return sym + ' = ' + nf(vals[dd[0]]) + ' ' + unit;
      return sym === 'l' ? 'l = ?' : sym;
    };
    return DRAW(shape, vals, { lab: gl, small: small, fs: fs, title: t('fig_aria') + ': ' + t('sh_' + shape) });
  }
  function renderQuestion() {
    renderScore();
    $$('#pane-practice [data-pg]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.pg === st.pg ? 'true' : 'false'); });
    if (!q) return;
    var card = $('#prac-card');
    card.dataset.answer = String(q.ans); card.dataset.shape = q.shape; card.dataset.k = q.k;
    $('#q-shape').textContent = t('sh_' + q.shape);
    $('#q-real').textContent = t('real_life', { x: t('ex_' + q.shape) });
    $('#q-fig').innerHTML = figFor(q.shape, q.vals, q.unit, false, figFs($('#q-fig'), 480, 16));
    $('#q-given').innerHTML = givenLines(q.shape, q.vals, q.unit);
    $('#q-find').innerHTML = EDU.esc(t('r_' + q.k)) + ' ' + EDU.esc(t('pr_in_unit', { u: '@@U@@' })).replace('@@U@@', bdi(uStr(q.unit, q.d)));
    $('#q-round').textContent = t('pr_round', { pi: S.piStr(q.pm) });
    var sol = $('#q-solution');
    if (q.done || q.shown) {
      var out = S.compute(q.shape, q.vals, q.pm, nf);
      out.res = out.res.filter(function (r) { return r.k === q.k || (r.k === 'slant' && q.k !== 'volume') || r.k === 's' || r.k === 'side' || r.k === 'leg'; });
      sol.innerHTML = stepsHtml(out, q.unit); sol.hidden = false;
    } else { sol.hidden = true; sol.innerHTML = ''; }
    if (q.fb) {
      var fb = $('#q-feedback');
      fb.className = 'callout ' + (q.fb.ok ? 'success' : 'danger');
      fb.dataset.result = q.fb.ok ? 'right' : 'wrong';
      fb.textContent = q.fb.key === 'pr_enter' ? t('pr_enter') : t(q.fb.key, { ans: withU(ans2(q.ans), q.unit, q.d) });
    }
  }
  function renderScore() {
    $('#score').textContent = t('pr_score', { c: EDU.fmt(st.score.c), n: EDU.fmt(st.score.n) });
    $('#score').dataset.c = st.score.c; $('#score').dataset.n = st.score.n;
    $('#streak').textContent = t('pr_streak', { n: EDU.fmt(st.score.streak) });
  }
  function check() {
    if (!q) newQuestion();
    var x = parseNum($('#q-ans').value);
    if (!isFinite(x)) { q.fb = { ok: false, key: 'pr_enter' }; renderQuestion(); $('#q-feedback').className = 'callout warning'; $('#q-feedback').dataset.result = 'empty'; return; }
    var ok = Math.abs(x - q.ans) <= Math.max(0.011, Math.abs(q.ans) * 0.002);
    if (!q.done && !q.shown) {
      st.score.n++;
      if (ok) { st.score.c++; st.score.streak++; } else st.score.streak = 0;
      save();
    }
    q.done = true;
    q.fb = { ok: ok, key: ok ? 'pr_right' : 'pr_wrong' };
    renderQuestion();
  }
  $('#q-check').addEventListener('click', check);
  $('#q-ans').addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
  $('#q-new').addEventListener('click', function () { newQuestion(); $('#q-ans').focus(); });
  $('#q-show').addEventListener('click', function () { if (!q) return; q.shown = true; renderQuestion(); });
  $$('#pane-practice [data-pg]').forEach(function (b) { b.addEventListener('click', function () { st.pg = b.dataset.pg; save(); newQuestion(); }); });
  $('#score-reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    st.score = { c: 0, n: 0, streak: 0 }; save(); renderScore();
  });

  /* worksheet */
  function renderWsNote() { $('#ws-note').textContent = t('ws_note', { pi: S.piStr(st.pi) }); }
  function renderWs() {
    var box = $('#ws-out');
    $('#ws-print').disabled = !ws;
    $('#ws-sheet').hidden = !ws;
    if (!ws) { box.innerHTML = ''; return; }
    var items = ws.items.map(function (it) {
      return '<li class="ws-item"><h4>' + EDU.esc(t('sh_' + it.shape)) + '</h4>' + figFor(it.shape, it.vals, it.unit, true, 19) +
        '<p>' + givenLines(it.shape, it.vals, it.unit) + '</p><p><b>' + EDU.esc(t('pr_find')) + ':</b> ' + EDU.esc(t('r_' + it.k)) + ' (' + bdi(uStr(it.unit, it.d)) + ')</p>' +
        '<p class="ws-line">' + EDU.esc(t('ws_line')) + '</p></li>';
    }).join('');
    var key = ws.items.map(function (it) { return '<li>' + bdi(withU(ans2(it.ans), it.unit, it.d)) + '</li>'; }).join('');
    box.innerHTML = '<h3 class="ml-sub mt0">' + EDU.esc(t('ws_title')) + '</h3><p class="ws-head">' + EDU.esc(t('ws_head')) + '</p>' +
      '<p class="small muted">' + EDU.esc(t('pr_round', { pi: S.piStr(ws.pm) })) + '</p>' +
      '<ol class="ws-list" id="ws-list">' + items + '</ol><h3 class="ml-sub">' + EDU.esc(t('ws_answers')) + '</h3><ol class="ws-key" id="ws-key">' + key + '</ol>';
  }
  $('#ws-make').addEventListener('click', function () {
    var items = [], pool = poolFor(st.pg), used = {};
    for (var i = 0; i < 10; i++) {
      var it, tries = 0;
      do { it = makeQuestion(st.pg, st.pi); tries++; } while (used[it.shape + it.k] && tries < 12 && Object.keys(used).length < pool.length * 2);
      used[it.shape + it.k] = 1; items.push(it);
    }
    ws = { items: items, pm: st.pi };
    renderWs();
  });
  $('#ws-print').addEventListener('click', function () {
    if (!ws) return;
    document.body.classList.add('ml-print-ws');
    window.print();
    setTimeout(function () { document.body.classList.remove('ml-print-ws'); }, 1000);
  });

  /* ---------------- unit converter ---------------- */
  function renderUnits() {
    var kind = st.cvKind, list = CONV[kind];
    $$('#pane-units [data-kind]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.kind === kind ? 'true' : 'false'); });
    if (!list.some(function (u) { return u[0] === st.cvFrom; })) st.cvFrom = kind === 'len' ? 'm' : kind === 'area' ? 'm²' : 'L';
    var sel = $('#cv-from'); sel.innerHTML = '';
    list.forEach(function (u) { sel.appendChild(el('option', { value: u[0], text: u[0] + (u[2] ? ' (' + t(u[2]) + ')' : '') })); });
    sel.value = st.cvFrom;
    var inp = $('#cv-value'); if (inp.value !== st.cvVal) inp.value = st.cvVal;
    var x = parseNum(st.cvVal), from = list.filter(function (u) { return u[0] === st.cvFrom; })[0];
    var tb = '<thead><tr><th>' + EDU.esc(t('cv_unit_col')) + '</th><th class="n">' + EDU.esc(t('cv_value_col')) + '</th></tr></thead><tbody>';
    tb += list.map(function (u) {
      var v = isFinite(x) ? x * from[1] / u[1] : NaN;
      return '<tr' + (u[0] === st.cvFrom ? ' class="from"' : '') + ' data-unit="' + u[0] + '" data-value="' + (isFinite(v) ? v : '') + '"><td class="u">' + bdi(u[0]) +
        (u[2] ? ' <span class="muted small">(' + EDU.esc(t(u[2])) + ')</span>' : '') + '</td><td class="n">' + (isFinite(v) ? bdi(smart(v)) : '–') + '</td></tr>';
    }).join('') + '</tbody>';
    $('#cv-table').innerHTML = tb;
    inp.setAttribute('aria-invalid', isFinite(x) ? 'false' : 'true');
    $('#cv-rule').innerHTML = mathify(t(kind === 'len' ? 'cv_rule_len' : kind === 'area' ? 'cv_rule_area' : 'cv_rule_vol'));
  }
  $$('#pane-units [data-kind]').forEach(function (b) { b.addEventListener('click', function () { st.cvKind = b.dataset.kind; save(); renderUnits(); }); });
  $('#cv-value').addEventListener('input', function () { st.cvVal = this.value; save(); renderUnits(); });
  $('#cv-from').addEventListener('change', function () { st.cvFrom = this.value; save(); renderUnits(); });

  /* ---------------- all ---------------- */
  function renderAll() { renderTabs(); renderCalc(); renderQuestion(); renderWsNote(); renderWs(); renderUnits(); }
  EDU.onLang(renderAll);
  var rsz = null, lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth; clearTimeout(rsz);
    rsz = setTimeout(function () { if (st.tab === 'calc') renderOut(); else if (st.tab === 'practice') renderQuestion(); }, 200);
  });
  document.addEventListener('fullscreenchange', function () { setTimeout(renderOut, 120); });
  renderAll();
  if (!q) newQuestion();
  window.MensurationLab = { compute: S.compute, state: st };
})();
