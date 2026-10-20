/* Motion Graphs Lab: UI, state, animation, equations solver, quiz and worksheet.
   Maths in engine.js (window.MGL), drawing in view.js (window.MGVIEW), data in data.js, quiz texts in content.js. */
(function () {
  'use strict';
  var SLUG = 'motion-graphs-lab';
  var store = EDU.store(SLUG), M = window.MGL, V = window.MGVIEW, D = window.MG_DATA;
  var $ = EDU.$, $$ = EDU.$$, el = EDU.el, t = EDU.t;
  var TABS = ['lab', 'eq', 'quiz', 'words'], KEYS = ['u', 'v', 'a', 't', 's'];
  var G = { earth: 9.8, moon: 1.6, mars: 3.7 };
  var UNIT = { u: 'm/s', v: 'm/s', a: 'm/s²', t: 's', s: 'm' };
  var QN = D.stories.length + D.reads.length;

  EDU.init({ slug: SLUG, title: 'app_title', wide: true });

  /* ------------------------------------------------------------------ helpers */
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function num(v, lo, hi, d) { v = Number(v); if (!isFinite(v)) v = d; return Math.min(hi, Math.max(lo, v)); }
  function fx(v, d) { d = d === undefined ? 2 : d; var k = Math.pow(10, d), r = Math.round(v * k) / k; return EDU.fmt(r === 0 ? 0 : r, { maximumFractionDigits: d }); }
  function fg(v) { return fx(v, 2); }                /* numbers inside the graphs */
  function ltr(txt, cls) { return el('span', { class: 'ltr' + (cls ? ' ' + cls : ''), text: txt }); }
  function C() { var A = window.APP_CONTENT || {}; return A[EDU.lang] || A.en; }
  function vars(s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return v[k] !== undefined ? v[k] : m; }); }
  function shapeModel(id) { var sh = D.shapes[id]; return M.build(sh.segs, sh.d0 || 0); }
  function debounce(fn, ms) { var h; return function () { clearTimeout(h); h = setTimeout(fn, ms); }; }
  function rtl() { return document.documentElement.dir === 'rtl'; }

  /* ------------------------------------------------------------------ state */
  function defaults() {
    return {
      tab: 'lab',
      lab: { vehicle: 'car', segs: clone(D.presets.car.segs), slopeOn: false, slopeKind: 'd', t1: 15, t2: 25, rate: 1, t: 0 },
      eq: { known: { u: true, v: false, a: true, t: true, s: false }, vals: { u: 0, v: null, a: 2, t: 5, s: null }, ff: false, g: 'earth', dir: 'down' },
      quiz: null, best: null
    };
  }
  function cleanQuiz(q) {
    if (!q || typeof q !== 'object' || !Array.isArray(q.order) || !q.order.length || q.order.length > QN) return null;
    var seen = {}, perms = {};
    for (var i = 0; i < q.order.length; i++) {
      var id = String(q.order[i]), mt = /^([sr])(\d+)$/.exec(id);
      if (!mt || seen[id]) return null;
      var n = +mt[2];
      if (mt[1] === 's' ? n >= D.stories.length : n >= D.reads.length) return null;
      seen[id] = 1;
      if (mt[1] === 's') {
        var p = q.perms && q.perms[id];
        if (!Array.isArray(p) || p.length !== 4 || p.slice().sort().join('') !== '0123') return null;
        perms[id] = p.map(Number);
      }
    }
    var idx = q.i | 0;
    if (idx < 0 || idx >= q.order.length) return null;
    var picked = q.picked;
    if (picked !== null && picked !== undefined && typeof picked !== 'number') return null;
    if (typeof picked === 'number' && !isFinite(picked)) picked = null;
    return { order: q.order.map(String), perms: perms, i: idx, score: Math.max(0, Math.min(idx + 1, q.score | 0)), picked: picked === undefined ? null : picked, done: !!q.done, right: !!q.right };
  }
  function load() {
    var d = defaults(), s = store.get('state', null);
    if (!s || typeof s !== 'object') return d;
    var o = d;
    if (TABS.indexOf(s.tab) >= 0) o.tab = s.tab;
    var L = s.lab && typeof s.lab === 'object' ? s.lab : {};
    var segs = M.cleanSegs(L.segs);
    o.lab = {
      vehicle: D.VEHICLE_ORDER.indexOf(L.vehicle) >= 0 ? L.vehicle : 'car',
      segs: segs.length ? segs : d.lab.segs,
      slopeOn: !!L.slopeOn, slopeKind: L.slopeKind === 'v' ? 'v' : 'd',
      t1: num(L.t1, 0, M.TMAX * M.MAXSEG, 15), t2: num(L.t2, 0, M.TMAX * M.MAXSEG, 25),
      rate: [1, 2, 5].indexOf(+L.rate) >= 0 ? +L.rate : 1, t: num(L.t, 0, M.TMAX * M.MAXSEG, 0)
    };
    var E = s.eq && typeof s.eq === 'object' ? s.eq : {};
    var known = {}, vals = {};
    KEYS.forEach(function (k) {
      known[k] = E.known && typeof E.known === 'object' ? !!E.known[k] : d.eq.known[k];
      var v = E.vals && typeof E.vals === 'object' ? E.vals[k] : d.eq.vals[k];
      vals[k] = typeof v === 'number' && isFinite(v) ? num(v, -1e6, 1e6, 0) : null;
    });
    o.eq = { known: known, vals: vals, ff: !!E.ff, g: G[E.g] ? E.g : 'earth', dir: E.dir === 'up' ? 'up' : 'down' };
    o.quiz = cleanQuiz(s.quiz);
    o.best = typeof s.best === 'number' && s.best >= 0 && s.best <= QN ? Math.round(s.best) : null;
    return o;
  }
  var S = load();
  function save() { store.set('state', S); }

  /* ------------------------------------------------------------------ tabs */
  function showTab(name) {
    S.tab = name; save();
    $$('#tabs [role="tab"]').forEach(function (b) {
      var on = b.id === 'tab-' + name;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      $('#' + b.getAttribute('data-panel')).hidden = !on;
    });
    if (name !== 'lab') stopPlay();
    if (name === 'lab') { sizeAll(); renderGraphs(); drawRoad(); }
    if (name === 'quiz' && !S.quiz) startQuiz();
    if (name === 'quiz') renderQuiz();
  }
  $$('#tabs [role="tab"]').forEach(function (b, i, all) {
    b.addEventListener('click', function () { showTab(b.id.slice(4)); });
    b.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      if (rtl()) d = -d;
      var nx = all[(i + d + all.length) % all.length]; nx.focus(); nx.click();
    });
  });

  /* ================================================================== LAB */
  var model = M.build(S.lab.segs);
  function rebuild() { model = M.build(S.lab.segs); S.lab.t = Math.min(S.lab.t, model.T); S.lab.t1 = Math.min(S.lab.t1, model.T); S.lab.t2 = Math.min(S.lab.t2, model.T); }
  var VEH_LABEL = { car: 'veh_car', bus: 'veh_bus', cycle: 'veh_cycle', train: 'veh_train', ball: 'veh_ball', dot: 'veh_dot' };

  function renderPresets() {
    var box = $('#presets'); box.innerHTML = '';
    D.PRESET_ORDER.forEach(function (p) {
      box.appendChild(el('button', { type: 'button', class: 'chip', id: 'preset-' + p, dataset: { p: p }, text: (D.vehicles[D.presets[p].vehicle] || '●') + ' ' + t('preset_' + p),
        onclick: function () { applyPreset(p); } }));
    });
  }
  function applyPreset(p) {
    stopPlay();
    var P = D.presets[p];
    S.lab.segs = clone(P.segs); S.lab.vehicle = P.vehicle; S.lab.t = 0;
    rebuild();
    S.lab.t1 = Math.round(model.T * 0.3 * 2) / 2; S.lab.t2 = Math.round(model.T * 0.7 * 2) / 2;
    if (p === 'car') { S.lab.t1 = 15; S.lab.t2 = 25; }
    save(); renderLab();
  }
  function renderVehicles() {
    var box = $('#vehicles'); box.innerHTML = '';
    D.VEHICLE_ORDER.forEach(function (v) {
      var b = el('button', { type: 'button', id: 'veh-' + v, dataset: { v: v }, 'aria-pressed': String(S.lab.vehicle === v), title: t(VEH_LABEL[v]), 'aria-label': t(VEH_LABEL[v]),
        onclick: function () { S.lab.vehicle = v; save(); renderVehicles(); sizeAll(); drawRoad(); } });
      if (D.vehicles[v]) b.textContent = D.vehicles[v]; else b.appendChild(el('span', { class: 'dot', 'aria-hidden': 'true' }));
      box.appendChild(b);
    });
  }

  /* ---- segment table ---- */
  function renderSegTable() {
    var tb = $('#seg-body'); tb.innerHTML = '';
    S.lab.segs.forEach(function (s, i) {
      var tr = el('tr', { dataset: { i: i } });
      var sel = el('select', { class: 'seg-type', 'aria-label': t('col_type') },
        el('option', { value: 'const', text: t('type_const') }), el('option', { value: 'accel', text: t('type_accel') }));
      sel.value = s.type;
      sel.addEventListener('change', function () {
        s.type = sel.value;
        if (s.type === 'accel') { var prev = i > 0 ? S.lab.segs[i - 1].v : 0; s.u = prev; } else s.u = s.v;
        changedSegs(true);
      });
      var inU = el('input', { type: 'number', class: 'seg-u', step: 'any', min: -M.VMAX, max: M.VMAX, value: String(s.u), 'aria-label': 'u (m/s)' });
      var inV = el('input', { type: 'number', class: 'seg-v', step: 'any', min: -M.VMAX, max: M.VMAX, value: String(s.v), 'aria-label': 'v (m/s)' });
      var inT = el('input', { type: 'number', class: 'seg-t', step: 'any', min: M.TMIN, max: M.TMAX, value: String(s.t), 'aria-label': 't (s)' });
      function bind(inp, key, lo, hi) {
        inp.addEventListener('input', function () {
          if (inp.value === '' || !isFinite(Number(inp.value))) return;
          s[key] = M.round(num(inp.value, lo, hi, s[key]));
          if (s.type === 'const') s.u = s.v;
          changedSegs(false);
        });
        inp.addEventListener('change', function () { inp.value = String(s[key]); });
      }
      bind(inU, 'u', -M.VMAX, M.VMAX); bind(inV, 'v', -M.VMAX, M.VMAX); bind(inT, 't', M.TMIN, M.TMAX);
      tr.appendChild(el('td', { text: EDU.fmt(i + 1) }));
      tr.appendChild(el('td', {}, sel));
      tr.appendChild(s.type === 'accel' ? el('td', {}, inU) : el('td', { class: 'na', text: '–' }));
      tr.appendChild(el('td', {}, inV));
      tr.appendChild(el('td', {}, inT));
      tr.appendChild(el('td', { class: 'num seg-a' }));
      tr.appendChild(el('td', { class: 'num seg-d' }));
      tr.appendChild(el('td', {}, el('button', { type: 'button', class: 'btn btn-ghost btn-sm seg-del', 'aria-label': t('del_row'), title: t('del_row'), text: '✕',
        onclick: function () { S.lab.segs.splice(i, 1); changedSegs(true); } })));
      tb.appendChild(tr);
    });
    updateSegComputed();
  }
  function updateSegComputed() {
    var rows = $$('#seg-body tr'), jump = false, turn = false;
    model.segs.forEach(function (ms, i) {
      var tr = rows[i]; if (!tr) return;
      $('.seg-a', tr).textContent = fx(ms.a, 2);
      $('.seg-d', tr).textContent = fx(ms.dist, 2);
      tr.setAttribute('data-a', ms.a); tr.setAttribute('data-dist', ms.dist);
      var prevV = i > 0 ? model.segs[i - 1].v : null;
      var j = prevV !== null && Math.abs(prevV - ms.u) > 1e-9;
      tr.classList.toggle('jump', j); tr.classList.toggle('turn', ms.tz !== null);
      if (j) jump = true; if (ms.tz !== null) turn = true;
    });
    var note = $('#seg-note'), msgs = [];
    if (jump) msgs.push(t('seg_jump_note'));
    if (turn) msgs.push(t('seg_turn_note'));
    if (S.lab.segs.length >= M.MAXSEG) msgs.push(t('seg_max', { n: EDU.fmt(M.MAXSEG) }));
    note.textContent = msgs.join(' ');
    $('#add-const').disabled = $('#add-accel').disabled = S.lab.segs.length >= M.MAXSEG;
  }
  function changedSegs(structural) {
    stopPlay();
    rebuild(); save();
    if (structural) renderSegTable(); else updateSegComputed();
    renderGraphs(); renderReadouts(); renderSlope(); drawRoad(); syncScrub();
  }
  function addSeg(type) {
    if (S.lab.segs.length >= M.MAXSEG) return;
    var last = S.lab.segs[S.lab.segs.length - 1], v0 = last ? last.v : 0;
    S.lab.segs.push(type === 'accel' ? { type: 'accel', u: v0, v: v0 === 0 ? 10 : 0, t: 5 } : { type: 'const', u: v0 || 10, v: v0 || 10, t: 10 });
    changedSegs(true);
    var rows = $$('#seg-body tr'), inp = $('.seg-v', rows[rows.length - 1]); if (inp) inp.focus();
  }
  $('#add-const').addEventListener('click', function () { addSeg('const'); });
  $('#add-accel').addEventListener('click', function () { addSeg('accel'); });

  /* ---- graphs ---- */
  var views = { d: null, v: null, a: null }, gw = 320;
  function graphH(kind) { return gw < 500 ? (kind === 'a' ? 150 : 190) : (kind === 'a' ? 160 : 230); }
  function graphOpts(kind, width, compact, mdl, extra) {
    var o = {
      kind: kind, model: mdl || model, width: width, height: compact ? Math.round(width * 0.7) : graphH(kind), compact: compact, fmt: fg,
      labels: { t: compact ? 't' : t('ax_t'), y: compact ? kind : t('ax_' + kind), dt: 'Δt', dy: kind === 'v' ? 'Δv' : 'Δd', slope: t('slope_word'), marker: t('marker') },
      units: { m: 'm', ms: 'm/s', ms2: 'm/s²' }, shade: kind === 'v', cursorT: null, slope: null
    };
    if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
    return o;
  }
  function renderGraph(kind) {
    var svg = $('#svg-' + kind);
    views[kind] = V.graph(svg, graphOpts(kind, gw, false, model, {
      cursorT: S.lab.t, slope: S.lab.slopeOn ? { kind: S.lab.slopeKind, t1: S.lab.t1, t2: S.lab.t2 } : null
    }));
  }
  function renderGraphs() {
    ['d', 'v', 'a'].forEach(renderGraph);
    var pa = M.areaParts(model), lg = $('#area-legend'); lg.innerHTML = '';
    lg.appendChild(el('span', {}, el('span', { class: 'sw pos', 'aria-hidden': 'true' }), t('area_pos'), ' ', ltr('+' + fx(pa.pos) + ' m')));
    if (pa.neg > 0) lg.appendChild(el('span', {}, el('span', { class: 'sw neg', 'aria-hidden': 'true' }), t('area_neg'), ' ', ltr('−' + fx(pa.neg) + ' m')));
    lg.appendChild(el('b', { id: 'area-total', dataset: { v: model.disp } }, t('area_total'), ' ', ltr((pa.neg > 0 ? '+' + fx(pa.pos) + ' − ' + fx(pa.neg) + ' = ' : '') + fx(model.disp) + ' m')));
  }
  function setCursorAll(tc) { ['d', 'v', 'a'].forEach(function (k) { if (views[k] && views[k].setCursor) views[k].setCursor(tc); }); }

  /* ---- readouts ---- */
  function renderReadouts() {
    var m = model;
    function put(id, v, txt) { var e = $(id); e.textContent = txt; e.setAttribute('data-v', String(M.round(v))); }
    put('#ro-time', m.T, fx(m.T) + ' s');
    put('#ro-dist', m.dist, fx(m.dist) + ' m');
    put('#ro-disp', m.disp, (m.disp < 0 ? '−' : '') + fx(Math.abs(m.disp)) + ' m');
    put('#ro-avgs', m.avgSpeed, fx(m.avgSpeed) + ' m/s');
    put('#ro-avgv', m.avgVel, (m.avgVel < 0 ? '−' : '') + fx(Math.abs(m.avgVel)) + ' m/s');
    $('#ro-disp-f').textContent = t('ro_disp_f', { d: fx(m.dEnd) });
    $('#ro-avgs-f').textContent = fx(m.dist) + ' m ÷ ' + fx(m.T) + ' s';
    $('#ro-avgv-f').textContent = (m.disp < 0 ? '−' : '') + fx(Math.abs(m.disp)) + ' m ÷ ' + fx(m.T) + ' s';
    var note = $('#ro-note');
    var back = Math.abs(m.dist - Math.abs(m.disp)) > 1e-6;
    note.textContent = t(back ? 'ro_note_back' : 'ro_note_same');
    note.className = 'callout small ' + (back ? 'accent' : '');
    note.setAttribute('data-back', back ? '1' : '0');
  }

  /* ---- road animation ---- */
  var cv = $('#road'), raf = 0, playing = false, lastTs = 0;
  function colors() {
    var dark = EDU.theme() === 'dark';
    return {
      surface: EDU.css('--surface'), text: EDU.css('--text'), muted: EDU.css('--muted'), grid: EDU.css('--border'),
      road: dark ? '#2a3a42' : '#d9d2c5', dash: dark ? '#9bb0b6' : '#fffaf0', ground: dark ? '#1a2a22' : '#eef3e6', grass: dark ? '#4caf50' : '#3f8a3a',
      primary: EDU.css('--primary'), accent: EDU.css('--accent')
    };
  }
  function vertical() { return S.lab.vehicle === 'ball'; }
  function sizeAll() {
    var w = $('#graph-card').clientWidth - 32; if (w > 100) gw = Math.round(w);
    var rw = cv.parentNode.clientWidth || 600;
    cv.setAttribute('data-w', rw);
  }
  function drawRoad() {
    var w = cv.parentNode.clientWidth || 600, h = vertical() ? 300 : (w < 560 ? 150 : 160);
    V.road(cv, { model: model, t: S.lab.t, width: w, height: h, vertical: vertical(), vehicle: S.lab.vehicle, emoji: D.vehicles[S.lab.vehicle],
      colors: colors(), font: getComputedStyle(document.body).fontFamily, fmt: fg, labels: { m: 'm', ms: 'm/s', title: t(VEH_LABEL[S.lab.vehicle]) } });
    renderNow();
  }
  function renderNow() {
    var st = M.at(model, S.lab.t), box = $('#readnow'); box.innerHTML = '';
    [['t', fx(st.t) + ' s'], ['d', fx(st.d) + ' m'], ['v', fx(st.v) + ' m/s'], ['a', fx(st.a) + ' m/s²']].forEach(function (p) {
      box.appendChild(el('span', { class: 'ltr' }, el('b', { text: p[0] }), ' = ' + p[1]));
    });
    box.setAttribute('data-t', st.t); box.setAttribute('data-d', st.d); box.setAttribute('data-v', st.v); box.setAttribute('data-a', st.a);
  }
  function syncScrub() { $('#scrub').value = model.T > 0 ? Math.round(S.lab.t / model.T * 1000) : 0; $('#scrub').disabled = !(model.T > 0); }
  function setTime(tc, light) {
    S.lab.t = Math.min(model.T, Math.max(0, tc));
    setCursorAll(S.lab.t); drawRoad(); syncScrub();
    if (!light) save();
  }
  function tick(ts) {
    raf = 0;
    if (!playing) return;
    var dt = lastTs ? (ts - lastTs) / 1000 : 0; lastTs = ts;
    var nt = S.lab.t + dt * S.lab.rate;
    if (nt >= model.T) { setTime(model.T); stopPlay(); return; }
    setTime(nt, true);
    raf = requestAnimationFrame(tick);
  }
  function startPlay() {
    if (!(model.T > 0)) return;
    if (S.lab.t >= model.T - 1e-6) S.lab.t = 0;
    playing = true; lastTs = 0; $('#play').setAttribute('aria-pressed', 'true'); $('#play-txt').textContent = t('pause'); $('#play').firstChild.textContent = '⏸ ';
    cv.setAttribute('data-playing', '1');
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function stopPlay() {
    if (!playing && !raf) { $('#play-txt').textContent = t('play'); return; }
    playing = false; if (raf) { cancelAnimationFrame(raf); raf = 0; }
    $('#play').setAttribute('aria-pressed', 'false'); $('#play-txt').textContent = t('play'); $('#play').firstChild.textContent = '▶ ';
    cv.setAttribute('data-playing', '0');
    save();
  }
  $('#play').addEventListener('click', function () { if (playing) stopPlay(); else startPlay(); });
  $('#restart').addEventListener('click', function () { stopPlay(); setTime(0); });
  $('#scrub').addEventListener('input', function () { stopPlay(); setTime(model.T * Number(this.value) / 1000, true); });
  $('#scrub').addEventListener('change', save);
  $$('#rate button').forEach(function (b) {
    b.addEventListener('click', function () { S.lab.rate = +b.dataset.r; save(); $$('#rate button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); });
  });
  $('#fs').addEventListener('click', function () { EDU.fullscreen($('#stage-card')); });
  cv.tabIndex = 0;
  cv.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#play').click(); } });

  /* ---- slope tool ---- */
  function renderSlope() {
    var on = S.lab.slopeOn, k = S.lab.slopeKind;
    $('#slope-on').checked = on; $('#slope-body').hidden = !on;
    $$('#slope-kind button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.k === k)); });
    var i1 = $('#slope-t1'), i2 = $('#slope-t2');
    i1.max = i2.max = model.T;
    if (document.activeElement !== i1) i1.value = String(M.round(S.lab.t1, 2));
    if (document.activeElement !== i2) i2.value = String(M.round(S.lab.t2, 2));
    var out = $('#slope-out'); out.innerHTML = '';
    if (!on) return;
    var sl = M.slope(model, k, S.lab.t1, S.lab.t2);
    if (!sl) { out.textContent = t('slope_same'); out.removeAttribute('data-v'); return; }
    var yu = k === 'v' ? 'm/s' : 'm', su = k === 'v' ? 'm/s²' : 'm/s', dy = k === 'v' ? 'Δv' : 'Δd';
    out.setAttribute('data-v', String(M.round(sl.value, 4))); out.setAttribute('data-kind', k);
    out.appendChild(el('div', {}, t(k === 'v' ? 'slope_is_a' : 'slope_is_v')));
    out.appendChild(el('div', { class: 'mg-eq' }, t('slope_word') + ' = ' + dy + ' / Δt = ' + fx(sl.rise) + ' ' + yu + ' ÷ ' + fx(sl.run) + ' s = '));
    out.appendChild(el('b', { class: 'ltr', text: fx(sl.value) + ' ' + su }));
    out.appendChild(el('div', { class: 'small muted', text: t(k === 'v' ? 'slope_read_a' : 'slope_read_v', { n: fx(Math.abs(sl.value)) }) }));
  }
  $('#slope-on').addEventListener('change', function () { S.lab.slopeOn = this.checked; save(); renderSlope(); renderGraphs(); });
  $$('#slope-kind button').forEach(function (b) {
    b.addEventListener('click', function () { S.lab.slopeKind = b.dataset.k; save(); renderSlope(); renderGraphs(); });
  });
  [['#slope-t1', 't1'], ['#slope-t2', 't2']].forEach(function (p) {
    $(p[0]).addEventListener('input', function () {
      if (this.value === '' || !isFinite(Number(this.value))) return;
      S.lab[p[1]] = num(this.value, 0, model.T, S.lab[p[1]]); save(); renderSlope(); renderGraph(S.lab.slopeKind);
    });
    $(p[0]).addEventListener('change', renderSlope);
  });
  /* dragging the two markers on the graph (mouse, touch, pen) and moving them with the arrow keys */
  ['d', 'v'].forEach(function (kind) {
    var svg = $('#svg-' + kind), drag = null;
    function tAt(e) { var r = svg.getBoundingClientRect(), vw = views[kind]; return vw.xToT((e.clientX - r.left) * (vw.W / r.width)); }
    svg.addEventListener('pointerdown', function (e) {
      var mk = e.target.closest('.mg-marker'); if (!mk || !S.lab.slopeOn || S.lab.slopeKind !== kind) return;
      drag = mk.dataset.m === '1' ? 't1' : 't2'; svg.setPointerCapture(e.pointerId); e.preventDefault();
    });
    svg.addEventListener('pointermove', function (e) {
      if (!drag) return;
      S.lab[drag] = M.round(tAt(e), 2); renderGraph(kind); renderSlope();
    });
    function end(e) { if (!drag) return; drag = null; save(); }
    svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
    svg.addEventListener('keydown', function (e) {
      var mk = e.target.closest('.mg-marker'); if (!mk) return;
      var d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var key = mk.dataset.m === '1' ? 't1' : 't2', step = e.shiftKey ? 0.1 : 0.5;
      S.lab[key] = num(M.round(S.lab[key] + d * step, 2), 0, model.T, S.lab[key]); save(); renderGraph(kind); renderSlope();
      var again = $('.mg-marker[data-m="' + mk.dataset.m + '"]', svg); if (again) again.focus();
    });
  });

  /* ---- print / reset ---- */
  function printAs(cls) {
    stopPlay();
    document.body.classList.add(cls);
    var done = function () { document.body.classList.remove(cls); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(function () { window.print(); setTimeout(done, 1500); }, 60);
  }
  $('#print-lab').addEventListener('click', function () { printAs('printing-lab'); });
  $('#reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    stopPlay();
    S = defaults(); store.remove('state'); rebuild(); save();
    renderAll(); EDU.toast(t('reset_done'));
  });

  function renderLab() {
    renderPresets(); renderVehicles(); renderSegTable();
    $$('#rate button').forEach(function (x) { x.setAttribute('aria-pressed', String(+x.dataset.r === S.lab.rate)); });
    $('#play-txt').textContent = t(playing ? 'pause' : 'play');
    sizeAll(); renderGraphs(); renderReadouts(); renderSlope(); drawRoad(); syncScrub();
  }

  /* ================================================================== EQUATIONS */
  var WHAT = { u: 'q_u', v: 'q_v', a: 'q_a', t: 'q_t', s: 'q_s' };
  var EQNAME = { e1: 'eq1_name', e2: 'eq2_name', e3: 'eq3_name', e4: 'eq4_name' };
  var EQTXT = { e1: 'v = u + at', e2: 's = ut + ½at²', e3: 'v² = u² + 2as', e4: 's = (u + v) × t / 2' };
  function gVal() { return (S.eq.dir === 'up' ? -1 : 1) * G[S.eq.g]; }
  function renderKnowns() {
    var box = $('#knowns'); box.innerHTML = '';
    KEYS.forEach(function (k) {
      var E = S.eq, locked = E.ff && k === 'a', on = locked ? true : !!E.known[k];
      var cb = el('input', { type: 'checkbox', id: 'k-' + k, checked: on, disabled: locked, 'aria-label': t('known_of', { x: t(WHAT[k]) }) });
      var inp = el('input', { type: 'number', id: 'in-' + k, step: 'any', disabled: !on || locked, value: locked ? String(gVal()) : (E.vals[k] === null ? '' : String(E.vals[k])), placeholder: on ? '' : '?' });
      cb.addEventListener('change', function () { E.known[k] = cb.checked; save(); renderKnowns(); solveNow(); });
      inp.addEventListener('input', function () {
        E.vals[k] = inp.value === '' || !isFinite(Number(inp.value)) ? null : num(inp.value, -1e6, 1e6, 0); save(); solveSoon();
      });
      var row = el('label', { class: 'mg-known' + (on ? '' : ' off'), for: 'in-' + k },
        cb, el('span', { class: 'what' }, el('span', { class: 'sym', text: k }), ' ', el('span', { text: t(WHAT[k]) })), inp, el('span', { class: 'unit', text: UNIT[k] }));
      box.appendChild(row);
    });
    $$('#eq-mode button').forEach(function (b) { b.setAttribute('aria-pressed', String((b.id === 'mode-ff') === S.eq.ff)); });
    $('#ff-opts').hidden = !S.eq.ff;
    $$('#planets button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.g === S.eq.g)); });
    $$('#ff-dir button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.d === S.eq.dir)); });
    $('#ff-note').textContent = t(S.eq.dir === 'up' ? 'ff_note_up' : 'ff_note_down', { g: fx(G[S.eq.g], 1) });
  }
  function knownVals() {
    var k = {};
    KEYS.forEach(function (key) {
      if (S.eq.ff && key === 'a') { k.a = gVal(); return; }
      if (S.eq.known[key] && S.eq.vals[key] !== null) k[key] = S.eq.vals[key];
    });
    return k;
  }
  function solveNow() {
    var k = knownVals(), r = M.solve(k, function (x) { return fx(x, 3); });
    var vb = $('#eq-vals'); vb.innerHTML = '';
    KEYS.forEach(function (key) {
      var known = key in k, val = r.ok ? r.values[key] : (known ? k[key] : null);
      var card = el('div', { class: 'mg-val' + (r.ok && !known ? ' found' : ''), id: 'val-' + key, dataset: { v: val === null ? '' : String(M.round(val, 4)), known: known ? '1' : '0' } },
        el('span', { class: 'sym', text: key }), el('b', { text: val === null ? '?' : fx(val, 3) }), el('small', { text: UNIT[key] }));
      vb.appendChild(card);
    });
    var err = $('#eq-err'), steps = $('#eq-steps'); steps.innerHTML = '';
    if (!r.ok) {
      err.hidden = false;
      var n = Object.keys(k).length;
      err.textContent = t(r.error, { n: EDU.fmt(n) });
    } else {
      err.hidden = true;
      r.steps.forEach(function (st) {
        steps.appendChild(el('div', { class: 'mg-step', dataset: { find: st.find, eq: st.eq } },
          el('div', { class: 'mg-eqname' }, t('step_find', { x: st.find }), ' · ', el('span', { class: 'ltr', text: EQTXT[st.eq] }), ' (', t(EQNAME[st.eq]), ')'),
          el('pre', { class: 'no-i18n', text: st.lines.join('\n') })));
      });
      if (r.steps.some(function (st) { return st.eq === 'e3' && /√/.test(st.lines.join('')); })) steps.appendChild(el('p', { class: 'small muted mb0', text: t('root_note') }));
    }
    $('#eq-sign').textContent = t('sign_note');
  }
  var solveSoon = debounce(solveNow, 120);
  $('#solve').addEventListener('click', function () { solveNow(); if (window.innerWidth < 760) $('#eq-out').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  $('#eq-clear').addEventListener('click', function () { KEYS.forEach(function (k) { S.eq.vals[k] = null; }); save(); renderKnowns(); solveNow(); });
  $('#mode-general').addEventListener('click', function () { S.eq.ff = false; save(); renderKnowns(); solveNow(); });
  $('#mode-ff').addEventListener('click', function () {
    S.eq.ff = true;
    /* a sensible start: dropped from rest, time known */
    if (S.eq.vals.u === null && !S.eq.known.u) { S.eq.known.u = true; S.eq.vals.u = 0; }
    save(); renderKnowns(); solveNow();
  });
  $$('#planets button').forEach(function (b) { b.addEventListener('click', function () { S.eq.g = b.dataset.g; save(); renderKnowns(); solveNow(); }); });
  $$('#ff-dir button').forEach(function (b) { b.addEventListener('click', function () { S.eq.dir = b.dataset.d; save(); renderKnowns(); solveNow(); }); });

  /* km/h ⇄ m/s */
  var convLock = false;
  $('#conv-ms').addEventListener('input', function () {
    if (convLock) return; convLock = true;
    var v = Number(this.value); $('#conv-kmh').value = isFinite(v) && this.value !== '' ? String(M.round(M.msToKmh(v), 3)) : ''; convLock = false;
  });
  $('#conv-kmh').addEventListener('input', function () {
    if (convLock) return; convLock = true;
    var v = Number(this.value); $('#conv-ms').value = isFinite(v) && this.value !== '' ? String(M.round(M.kmhToMs(v), 3)) : ''; convLock = false;
  });

  /* the picture behind s = ut + ½at²: area under a v–t line = rectangle + triangle */
  function renderDeriv() {
    var svg = $('#deriv-svg'), sv = V.sv, W = 420, H = 240, L = 46, B = 200, R = 370, T0 = 40;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var yu = 140, yv = 55;
    svg.appendChild(sv('rect', { class: 'mg-area rect', x: L, y: yu, width: R - L, height: B - yu }));
    svg.appendChild(sv('polygon', { class: 'mg-area tri', points: [L, yu, R, yu, R, yv].join(' ') }));
    svg.appendChild(sv('line', { class: 'ln', x1: L, y1: B, x2: R + 20, y2: B }));
    svg.appendChild(sv('line', { class: 'ln', x1: L, y1: B, x2: L, y2: T0 - 10 }));
    svg.appendChild(sv('line', { class: 'vline', x1: L, y1: yu, x2: R, y2: yv }));
    svg.appendChild(sv('line', { class: 'dsh', x1: R, y1: yv, x2: R, y2: B }));
    svg.appendChild(sv('line', { class: 'dsh', x1: L, y1: yv, x2: R, y2: yv }));
    svg.appendChild(sv('line', { class: 'dsh', x1: L, y1: yu, x2: R, y2: yu }));
    svg.appendChild(sv('text', { x: L - 6, y: yu + 4, 'text-anchor': 'end', text: 'u' }));
    svg.appendChild(sv('text', { x: L - 6, y: yv + 4, 'text-anchor': 'end', text: 'v' }));
    svg.appendChild(sv('text', { x: L - 6, y: B + 4, 'text-anchor': 'end', text: '0' }));
    svg.appendChild(sv('text', { x: R, y: B + 18, 'text-anchor': 'middle', text: 't' }));
    svg.appendChild(sv('text', { x: R + 22, y: B + 18, 'text-anchor': 'end', class: 'mu', text: t('ax_t') }));
    svg.appendChild(sv('text', { x: L + 6, y: T0 - 14, 'text-anchor': 'start', class: 'mu', text: t('ax_v') }));
    svg.appendChild(sv('text', { x: (L + R) / 2, y: (yu + B) / 2 + 5, 'text-anchor': 'middle', text: t('deriv_rect') }));
    svg.appendChild(sv('text', { x: (L + 2 * R) / 3, y: (yu + yv) / 2 + 12, 'text-anchor': 'middle', text: t('deriv_tri') }));
    svg.appendChild(sv('text', { x: R + 8, y: (yu + yv) / 2 + 4, 'text-anchor': 'start', class: 'mu', text: 'at' }));
  }

  /* ================================================================== QUIZ */
  function qInfo(id) {
    var mt = /^([sr])(\d+)$/.exec(id), n = +mt[2];
    return mt[1] === 's' ? { type: 'story', n: n, data: D.stories[n] } : { type: 'read', n: n, data: D.reads[n] };
  }
  function startQuiz() {
    var ids = [];
    D.stories.forEach(function (_, i) { ids.push('s' + i); });
    D.reads.forEach(function (_, i) { ids.push('r' + i); });
    var perms = {};
    ids.forEach(function (id) { if (id[0] === 's') perms[id] = EDU.shuffle([0, 1, 2, 3]); });
    S.quiz = { order: EDU.shuffle(ids), perms: perms, i: 0, score: 0, picked: null, done: false, right: false };
    save(); renderQuiz();
  }
  function answerStory(optIndex) {
    var q = S.quiz; if (!q || q.done || q.picked !== null) return;
    var id = q.order[q.i], info = qInfo(id), perm = q.perms[id];
    q.picked = optIndex; q.right = perm[optIndex] === info.data.ans;
    if (q.right) q.score++;
    save(); renderQuiz();
    var nx = $('#quiz-next'); if (nx) nx.focus();
  }
  function answerRead(value) {
    var q = S.quiz; if (!q || q.done || q.picked !== null) return;
    var info = qInfo(q.order[q.i]), ans = info.data.ans;
    var ok = isFinite(value) && Math.abs(value - ans) <= Math.max(0.05, Math.abs(ans) * 0.01);
    q.picked = isFinite(value) ? value : 0; q.right = ok;
    if (ok) q.score++;
    save(); renderQuiz();
    var nx = $('#quiz-next'); if (nx) nx.focus();
  }
  function nextQ() {
    var q = S.quiz; if (!q || q.picked === null) return;
    if (q.i + 1 >= q.order.length) {
      q.done = true;
      if (S.best === null || q.score > S.best) S.best = q.score;
    } else { q.i++; q.picked = null; q.right = false; }
    save(); renderQuiz();
    var f = $('#opt-0') || $('#ans') || $('#quiz-again'); if (f) f.focus();
  }
  function unitText(u) { return u === 'ms' ? 'm/s' : u === 'ms2' ? 'm/s²' : 'm'; }
  function renderQuiz() {
    var q = S.quiz, box = $('#quiz'); if (!q) return;
    box.innerHTML = '';
    if (q.done) {
      var pct = q.score / q.order.length;
      box.appendChild(el('h2', { text: t('quiz_title') }));
      box.appendChild(el('div', { class: 'final-score', id: 'final-score', dataset: { score: q.score }, text: EDU.fmt(q.score) + ' / ' + EDU.fmt(q.order.length) }));
      box.appendChild(el('p', { class: 'mb0', text: t('quiz_result', { score: EDU.fmt(q.score), total: EDU.fmt(q.order.length) }) }));
      box.appendChild(el('p', { class: 'callout ' + (pct === 1 ? 'success' : pct >= 0.6 ? '' : 'warning'), text: t(pct === 1 ? 'quiz_perfect' : pct >= 0.6 ? 'quiz_good' : 'quiz_keep') }));
      if (S.best !== null) box.appendChild(el('p', { class: 'muted', id: 'quiz-best', dataset: { best: S.best }, text: t('quiz_best', { n: EDU.fmt(S.best) + ' / ' + EDU.fmt(QN) }) }));
      box.appendChild(el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'quiz-again', onclick: startQuiz }, '🔁 ', t('quiz_again'))));
      return;
    }
    var id = q.order[q.i], info = qInfo(id), content = C();
    box.appendChild(el('div', { class: 'qtop' },
      el('h2', { class: 'mb0', text: t('quiz_title') }),
      el('div', { class: 'row' },
        el('span', { class: 'pill', id: 'quiz-progress', text: t('quiz_progress', { n: EDU.fmt(q.i + 1), total: EDU.fmt(q.order.length) }) }),
        el('span', { class: 'pill' }, t('score') + ': ', el('b', { id: 'quiz-score', text: EDU.fmt(q.score) })))));
    box.appendChild(el('div', { class: 'progress', 'aria-hidden': 'true' }, el('span', { style: { width: Math.round((q.i + (q.picked !== null ? 1 : 0)) / q.order.length * 100) + '%' } })));
    var answered = q.picked !== null;
    if (info.type === 'story') {
      var st = content.stories[info.n], perm = q.perms[id], kind = info.data.kind;
      box.appendChild(el('p', { class: 'mg-story', id: 'q-text', text: st.q }));
      if (!answered) box.appendChild(el('p', { class: 'muted small mb0', text: t('quiz_pick_hint', { g: t('g_' + kind + 't') }) }));
      var opts = el('div', { class: 'mg-opts', id: 'opts' });
      perm.forEach(function (shapeIdx, pos) {
        var shape = info.data.opts[shapeIdx], correct = shapeIdx === info.data.ans;
        var cls = 'mg-opt' + (answered ? (correct ? ' win' : ' lose') + (q.picked === pos ? ' picked' : '') : '');
        var btn = el('button', { type: 'button', class: cls, id: 'opt-' + pos, disabled: answered, dataset: { shape: shape, correct: correct ? '1' : '0' }, 'aria-label': t('option_n', { n: 'ABCD'[pos] }),
          onclick: function () { answerStory(pos); } });
        var svg = V.sv('svg', { class: 'mg-graph', 'aria-hidden': 'true' });
        V.graph(svg, graphOpts(kind, 160, true, shapeModel(shape)));
        btn.appendChild(el('span', { class: 'row', style: { gap: '6px' } }, el('span', { class: 'ol', 'aria-hidden': 'true', text: 'ABCD'[pos] }), answered && correct ? el('span', { class: 'badge success', text: '✓' }) : null));
        btn.appendChild(svg);
        opts.appendChild(btn);
      });
      box.appendChild(opts);
      if (answered) reveal(box, st.why, null);
    } else {
      var rd = content.reads[info.n], dat = info.data, mdl = M.build(dat.segs);
      var wrap = el('div', { class: 'mg-read' });
      var svg2 = V.sv('svg', { class: 'mg-graph', role: 'img', 'aria-label': t('g_' + dat.kind + 't') });
      V.graph(svg2, graphOpts(dat.kind, Math.min(420, Math.max(280, (box.clientWidth || 600) * 0.55)), false, mdl, { shade: dat.kind === 'v' && answered }));
      wrap.appendChild(el('div', {}, svg2));
      var right = el('div', { class: 'stack' });
      right.appendChild(el('p', { class: 'mg-story', id: 'q-text', text: vars(rd.q, dat.vars) }));
      if (!answered) {
        var inp = el('input', { type: 'number', id: 'ans', step: 'any', 'aria-label': t('your_answer'), placeholder: t('your_answer') });
        inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(); } });
        var check = function () { if (inp.value === '') { inp.focus(); return; } answerRead(Number(inp.value)); };
        right.appendChild(el('div', { class: 'mg-answer' }, inp, el('span', { class: 'unit', text: unitText(dat.unit) }), el('button', { type: 'button', class: 'btn btn-primary', id: 'check', onclick: check }, t('check'))));
        right.appendChild(el('p', { class: 'muted small mb0', text: t('read_hint') }));
      } else {
        right.appendChild(el('p', { class: 'mb0' }, t('your_answer') + ': ', el('b', { class: 'ltr', text: fx(q.picked, 3) + ' ' + unitText(dat.unit) })));
        right.appendChild(el('p', { class: 'mb0', id: 'q-answer', dataset: { v: dat.ans } }, t('correct_answer') + ': ', el('b', { class: 'ltr', text: fx(dat.ans, 3) + ' ' + unitText(dat.unit) })));
      }
      wrap.appendChild(right);
      box.appendChild(wrap);
      if (answered) reveal(box, vars(rd.why, dat.vars), dat);
    }
  }
  function reveal(box, why) {
    var q = S.quiz;
    box.appendChild(el('div', { class: 'stack', id: 'quiz-reveal', dataset: { right: q.right ? '1' : '0' } },
      el('p', { class: 'verdict ' + (q.right ? 'ok' : 'bad'), id: 'quiz-verdict', text: q.right ? t('correct') : t('wrong') }),
      el('p', { class: 'callout', text: why }),
      el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'quiz-next', onclick: nextQ }, t('next'), ' ', el('span', { 'aria-hidden': 'true', text: rtl() ? '←' : '→' })))));
  }
  document.addEventListener('keydown', function (e) {
    if (S.tab !== 'quiz' || !S.quiz || S.quiz.done || e.ctrlKey || e.metaKey || e.altKey) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    var k = e.key.toLowerCase(), i = 'abcd'.indexOf(k) >= 0 ? 'abcd'.indexOf(k) : '1234'.indexOf(k);
    if (i >= 0 && S.quiz.picked === null && $('#opt-' + i)) { e.preventDefault(); answerStory(i); }
  });
  $('#quiz-restart').addEventListener('click', startQuiz);

  /* ---- printable worksheet: 3 story questions + 3 read-the-graph questions, with a key ---- */
  var WS_PERMS = [[2, 0, 3, 1], [1, 3, 0, 2], [3, 1, 2, 0]];
  function buildWorksheet() {
    var ws = $('#worksheet'), content = C(), n = 0, key = [];
    ws.innerHTML = '';
    ws.appendChild(el('h2', { text: t('ws_title') }));
    ws.appendChild(el('p', { text: t('ws_name') }));
    ws.appendChild(el('p', { text: t('ws_instr') }));
    D.worksheet.stories.forEach(function (si, wi) {
      var sd = D.stories[si], st = content.stories[si], perm = WS_PERMS[wi % WS_PERMS.length];
      n++;
      var block = el('div', { class: 'ws-q', dataset: { q: n } }, el('h3', { text: EDU.fmt(n) + '. ' + st.q + ' (' + t('g_' + sd.kind + 't') + ')' }));
      var opts = el('div', { class: 'ws-opts' }), letter = '';
      perm.forEach(function (shapeIdx, pos) {
        var svg = V.sv('svg', { class: 'mg-graph', 'aria-hidden': 'true' });
        V.graph(svg, graphOpts(sd.kind, 150, true, shapeModel(sd.opts[shapeIdx])));
        opts.appendChild(el('div', { class: 'o' }, el('div', { text: 'ABCD'[pos] }), svg));
        if (shapeIdx === sd.ans) letter = 'ABCD'[pos];
      });
      block.appendChild(opts);
      ws.appendChild(block);
      key.push([n, letter, st.why]);
    });
    D.worksheet.reads.forEach(function (ri) {
      var rd = D.reads[ri], rc = content.reads[ri];
      n++;
      var svg = V.sv('svg', { class: 'mg-graph', 'aria-hidden': 'true' });
      V.graph(svg, graphOpts(rd.kind, 300, false, M.build(rd.segs), { shade: false }));
      ws.appendChild(el('div', { class: 'ws-q', dataset: { q: n } }, el('h3', { text: EDU.fmt(n) + '. ' + vars(rc.q, rd.vars) }),
        el('div', { class: 'ws-read' }, el('div', {}, svg), el('div', {}, el('div', { class: 'ws-line' }), el('div', { class: 'ws-line' }), el('div', { class: 'ws-line' })))));
      key.push([n, fx(rd.ans, 3) + ' ' + unitText(rd.unit), vars(rc.why, rd.vars)]);
    });
    var tb = el('tbody');
    key.forEach(function (r) { tb.appendChild(el('tr', {}, el('td', { text: EDU.fmt(r[0]) }), el('td', {}, el('strong', { class: 'ltr', text: r[1] })), el('td', { text: r[2] }))); });
    ws.appendChild(el('div', { class: 'ws-key' }, el('h2', { text: t('ws_key') }),
      el('table', { class: 'ws-table' }, el('thead', {}, el('tr', {}, el('th', { text: '#' }), el('th', { text: t('ws_answer') }), el('th', { text: t('ws_why') }))), tb)));
  }
  $('#quiz-print').addEventListener('click', function () { buildWorksheet(); printAs('printing-ws'); });

  /* ================================================================== WORDS: circular motion helper */
  function renderCirc() {
    var r = Number($('#circ-r').value), T = Number($('#circ-T').value), out = $('#circ-out');
    if (!(r > 0) || !(T > 0)) { out.textContent = t('circ_need'); out.removeAttribute('data-v'); return; }
    var v = M.circular(r, T);
    out.innerHTML = '';
    out.appendChild(el('span', { class: 'ltr mg-eq', text: 'v = 2πr / T = 2 × 3.14 × ' + fx(r) + ' / ' + fx(T) + ' = ' }));
    out.appendChild(el('b', { class: 'ltr', text: fx(v) + ' m/s' }));
    out.setAttribute('data-v', String(M.round(v, 4)));
  }
  $('#circ-r').addEventListener('input', renderCirc); $('#circ-T').addEventListener('input', renderCirc);

  /* ================================================================== render all */
  function renderAll() {
    renderLab(); renderKnowns(); solveNow(); renderDeriv(); renderCirc();
    if (S.quiz) renderQuiz();
    showTab(S.tab);
  }
  EDU.onLang(function () { stopPlay(); renderAll(); });
  EDU.onTheme(function () { drawRoad(); });
  var rt = 0, lastW = 0;
  function onResize() { clearTimeout(rt); rt = setTimeout(function () { sizeAll(); renderGraphs(); drawRoad(); }, 80); }
  window.addEventListener('resize', onResize);
  if (window.ResizeObserver) new ResizeObserver(function () {
    var w = $('#graph-card').clientWidth; if (Math.abs(w - lastW) < 2) return; lastW = w; onResize();
  }).observe($('#graph-card'));
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) { document.addEventListener(ev, function () { setTimeout(function () { sizeAll(); drawRoad(); }, 60); }); });
  window.addEventListener('beforeprint', function () { stopPlay(); });

  renderAll();
  /* small hook for tests and curious teachers */
  window.MotionLab = { state: function () { return S; }, model: function () { return model; }, engine: M };
})();
