/* Graph Plotter: UI, state and wiring. Maths lives in parser.js + maths.js, drawing in plot.js.
   Everything runs on this device; state is kept with EDU.store. */
(function () {
  'use strict';
  var SLUG = 'graph-plotter';
  var store = EDU.store(SLUG);
  var $ = EDU.$, el = EDU.el, t = EDU.t, M = window.GMATH, G = window.GPARSE;
  var NAMES = ['f', 'g', 'h', 'p', 'q', 'r', 's', 'u'], MAX = 8, PARAMS = ['a', 'b', 'c'];

  EDU.init({ slug: SLUG, title: 'app_title', wide: true });

  /* ------------------------------------------------------------ presets */
  var PRESETS = {
    linear: { fns: ['ax + b'], P: { a: 2, b: 1, c: 0 } },
    pair: { fns: ['6 - 2x', 'x'], view: { x0: -6, x1: 8, y0: -4, y1: 8 } },
    quadratic: { fns: ['ax^2 + bx + c'], P: { a: 1, b: -2, c: -3 }, view: { x0: -6, x1: 8, y0: -6, y1: 8 } },
    cubic: { fns: ['x^3 - 4x'], view: { x0: -4, x1: 4, y0: -7, y1: 7 } },
    trig: { fns: ['a sin(bx)', 'cos x'], P: { a: 1, b: 1, c: 0 }, pi: true, view: { x0: -7, x1: 7, y0: -2.4, y1: 2.4 }, viewDeg: { x0: -400, x1: 400, y0: -2.4, y1: 2.4 } },
    exp: { fns: ['2^x', '(1/2)^x'], view: { x0: -5, x1: 5, y0: -1.5, y1: 9 } },
    recip: { fns: ['1/x'], view: { x0: -6, x1: 6, y0: -5, y1: 5 } }
  };
  var PRESET_ORDER = ['linear', 'pair', 'quadratic', 'cubic', 'trig', 'exp', 'recip'];
  var LEARN = [
    { k: '9', preset: 'linear' }, { k: '10a', preset: 'cubic' }, { k: '10b', preset: 'pair' },
    { k: '11a', preset: 'trig' }, { k: '11b', preset: 'recip' }
  ];
  var KEYS = [['x', 'x'], ['x²', '^2'], ['^', '^'], ['√', 'sqrt()'], ['π', 'pi'], ['( )', '()'], ['|x|', '||'],
    ['sin', 'sin()'], ['cos', 'cos()'], ['tan', 'tan()'], ['log', 'log()'], ['a', 'a'], ['b', 'b'], ['c', 'c']];

  /* ------------------------------------------------------------ state */
  var DEF = {
    fns: [{ src: 'ax^2 + bx + c', ci: 0, on: true }, { src: 'x + 1', ci: 1, on: true }],
    P: { a: 1, b: -2, c: -3 }, deg: false, pi: false,
    show: { roots: true, inter: true, turn: true },
    note: 'quadratic', tv: { fi: 0, from: -5, to: 5, step: 1 }, view: null
  };
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function num(v, d) { v = Number(v); return isFinite(v) ? v : d; }
  function sanitize(s) {
    s = (s && typeof s === 'object') ? s : {};
    var o = clone(DEF);
    if (Array.isArray(s.fns)) {
      o.fns = s.fns.slice(0, MAX).filter(function (f) { return f && typeof f.src === 'string'; }).map(function (f, k) {
        return { src: f.src.slice(0, 300), ci: Math.round(EDU.clamp(num(f.ci, k), 0, 7)), on: f.on !== false };
      });
    }
    if (s.P && typeof s.P === 'object') PARAMS.forEach(function (p) { o.P[p] = EDU.clamp(num(s.P[p], o.P[p]), -1e6, 1e6); });
    o.deg = !!s.deg; o.pi = !!s.pi;
    if (s.show && typeof s.show === 'object') ['roots', 'inter', 'turn'].forEach(function (k) { if (typeof s.show[k] === 'boolean') o.show[k] = s.show[k]; });
    o.note = PRESETS[s.note] ? s.note : (s.note === null ? null : o.note);
    if (s.tv && typeof s.tv === 'object') {
      o.tv.fi = Math.round(EDU.clamp(num(s.tv.fi, 0), 0, MAX - 1));
      ['from', 'to', 'step'].forEach(function (k) { if (s.tv[k] === '' || isFinite(Number(s.tv[k]))) o.tv[k] = s.tv[k] === '' ? '' : Number(s.tv[k]); });
    }
    var v = s.view;
    if (v && isFinite(v.cx) && isFinite(v.cy) && v.sx > 0 && v.sy > 0) o.view = { cx: +v.cx, cy: +v.cy, sx: +v.sx, sy: +v.sy };
    return o;
  }

  var S = sanitize(store.get('state', null));
  (function fromLink() {
    var m = /[#&]g=([A-Za-z0-9_-]+)/.exec(location.hash || '');
    if (!m) return;
    var d = EDU.unpack(m[1]);
    if (d && Array.isArray(d.f)) {
      S = sanitize({
        fns: d.f.map(function (r) { return { src: String(r[0] || ''), ci: r[1], on: r[2] !== 0 }; }),
        P: { a: (d.P || [])[0], b: (d.P || [])[1], c: (d.P || [])[2] }, deg: d.d === 1, pi: d.pi === 1, note: null,
        show: S.show, tv: S.tv,
        view: Array.isArray(d.v) ? { cx: d.v[0], cy: d.v[1], sx: d.v[2], sy: d.v[3] } : null
      });
    }
    try { history.replaceState(history.state, '', location.href.split('#')[0]); } catch (e) { }
  })();

  var comp = [];        // compiled functions, same order as S.fns
  var analysis = { pts: [], same: [], empty: [] };
  var colors = {};
  var lastFocus = 0;

  function compileAll() { comp = S.fns.map(function (f) { return G.compile(f.src); }); }
  function params() { return { a: S.P.a, b: S.P.b, c: S.P.c, deg: S.deg }; }
  function readColors() {
    colors = { bg: EDU.css('--surface'), text: EDU.css('--text'), axis: EDU.css('--text'), label: EDU.css('--muted'), grid: EDU.css('--border'), c: [] };
    for (var k = 1; k <= 8; k++) colors.c.push(EDU.css('--c' + k));
  }
  function visibleFns() {
    var out = [];
    S.fns.forEach(function (f, i) {
      if (f.on && comp[i] && comp[i].ok) out.push({ i: i, f: comp[i].f, color: colors.c[f.ci] || colors.text, name: NAMES[i], src: f.src.trim().replace(/^\s*(y|f\s*\(\s*x\s*\))\s*=\s*/i, '') });
    });
    return out;
  }

  /* ------------------------------------------------------------ plot */
  var canvas = $('#plot');
  var plot = window.GPLOT(canvas, {
    fns: visibleFns, P: params,
    piAxis: function () { return S.pi; }, deg: function () { return S.deg; },
    points: function () { return analysis.pts; },
    colors: function () { return colors; },
    onView: function (busy) { if (!busy) { queueAnalysis(140); } saveSoon(); },
    onTrace: showTrace
  });

  var lastW = 0;
  function isFs() { var f = document.fullscreenElement || document.webkitFullscreenElement; return f === $('#graph-card'); }
  function layout(force) {
    var w = $('#stage').clientWidth, h;
    if (!w) return;
    if (!force && w === lastW && !isFs()) return;
    lastW = w;
    if (isFs()) {
      var card = $('#graph-card');
      h = window.innerHeight - $('.gp-toolbar', card).offsetHeight - $('.gp-under', card).offsetHeight - $('#readout').offsetHeight - 70;
      h = Math.max(240, h);
    } else h = w < 600 ? Math.round(w * 0.86) : Math.round(EDU.clamp(w * 0.62, 320, 640));
    plot.resize(w, h);
  }
  function resetView() {
    if (S.deg) plot.fit(-400, 400, -2.5, 2.5); else plot.square(10);
    queueAnalysis(0); saveSoon();
  }
  function setPresetView(p) {
    var v = S.deg && p.viewDeg ? p.viewDeg : (!S.deg ? p.view : null);
    if (v) plot.fit(v.x0, v.x1, v.y0, v.y1); else resetView();
  }

  /* ------------------------------------------------------------ analysis */
  var aTimer = 0;
  function queueAnalysis(ms) { clearTimeout(aTimer); aTimer = setTimeout(runAnalysis, ms || 0); }
  function runAnalysis() {
    var r = plot.range(), sz = plot.size(), list = visibleFns();
    analysis = M.analyze(list, params(), r.x0, r.x1, {
      N: Math.round(EDU.clamp(sz.w, 300, 1200)), sy: plot.getView().sy, limit: 40,
      roots: S.show.roots, inter: S.show.inter, turn: S.show.turn
    });
    // keep only points that are on screen (vertically too)
    analysis.pts = analysis.pts.filter(function (p) { return p.y >= r.y0 - 1e-9 && p.y <= r.y1 + 1e-9; });
    plot.draw();
    renderPoints();
    renderFnMessages();
  }

  /* ------------------------------------------------------------ readout */
  var traceInfo = null;
  function describe(p) {
    if (p.kind === 'inter') return t('pt_inter', { a: NAMES[p.fi], b: NAMES[p.fj] });
    var key = { root: 'pt_root', yint: 'pt_yint', min: 'pt_min', max: 'pt_max' }[p.kind];
    return t(key, { name: NAMES[p.fi] });
  }
  /* x for display: degrees get °, and with "x-axis in π" a multiple of π/12 shows as e.g. π/2 (1.5708) */
  function xs(x) {
    if (S.deg) return M.fmt(x) + '°';
    if (S.pi && Math.abs(x) > 1e-9) {
      var n = x / Math.PI * 12;
      if (Math.abs(n - Math.round(n)) < 1e-4 && Math.abs(n) < 2400) return M.piTick(x) + ' (' + M.fmt(x) + ')';
    }
    return M.fmt(x);
  }
  function showTrace(info) {
    traceInfo = info;
    var r = $('#readout');
    if (!info) { r.textContent = t('readout_idle'); r.removeAttribute('data-x'); r.removeAttribute('data-y'); return; }
    if (info.kind === 'undef') { r.textContent = t('readout_undef', { name: NAMES[info.fi] + '(x)', x: xs(info.x) }); r.dataset.x = M.raw(info.x); r.removeAttribute('data-y'); return; }
    if (info.kind === 'point') r.textContent = describe(info.p) + ':  x = ' + xs(info.x) + ',  y = ' + M.fmt(info.y);
    else r.textContent = t('readout_point', { name: NAMES[info.fi] + '(x)', x: xs(info.x), y: M.fmt(info.y) });
    r.dataset.x = M.raw(info.x); r.dataset.y = M.raw(info.y); r.dataset.fi = info.fi;
  }

  /* ------------------------------------------------------------ function list */
  function buildFnList() {
    var list = $('#fn-list');
    list.textContent = '';
    S.fns.forEach(function (f, i) {
      var input = el('input', { type: 'text', id: 'fn-in-' + i, class: 'gp-in', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', enterkeyhint: 'done', dir: 'ltr' });
      input.value = f.src;
      input.addEventListener('input', function () { S.fns[i].src = input.value; comp[i] = G.compile(input.value); refreshFn(i); afterChange(); });
      input.addEventListener('focus', function () { lastFocus = i; });
      var row = el('div', { class: 'gp-fn' + (f.on ? '' : ' is-off'), id: 'fn-row-' + i },
        el('button', { type: 'button', class: 'gp-swatch', id: 'fn-on-' + i, 'aria-pressed': f.on ? 'true' : 'false',
          onclick: function () { S.fns[i].on = !S.fns[i].on; row.classList.toggle('is-off', !S.fns[i].on); this.setAttribute('aria-pressed', S.fns[i].on ? 'true' : 'false'); afterChange(); } }, el('span')),
        el('label', { class: 'gp-name', for: 'fn-in-' + i, text: NAMES[i] + '(x) =' }),
        input,
        el('button', { type: 'button', class: 'btn btn-ghost btn-sm gp-del', id: 'fn-del-' + i, text: '✕', onclick: function () { removeFn(i); } }),
        el('p', { class: 'gp-msg', id: 'fn-msg-' + i, 'aria-live': 'polite' }));
      $('#fn-on-' + i, row).style.setProperty('--col', 'var(--c' + (f.ci + 1) + ')');   // EDU.el style{} cannot set custom properties
      list.appendChild(row);
    });
    $('#add-fn').disabled = S.fns.length >= MAX;
    relabelFns();
    S.fns.forEach(function (f, i) { refreshFn(i); });
  }
  function relabelFns() {
    S.fns.forEach(function (f, i) {
      var n = NAMES[i] + '(x)';
      var inp = $('#fn-in-' + i); if (!inp) return;
      inp.setAttribute('aria-label', t('fn_input', { name: n }));
      inp.setAttribute('placeholder', t('fn_placeholder'));
      $('#fn-on-' + i).setAttribute('aria-label', t('toggle_fn', { name: n }));
      $('#fn-on-' + i).setAttribute('title', t('toggle_fn', { name: n }));
      $('#fn-del-' + i).setAttribute('aria-label', t('delete_fn', { name: n }));
      $('#fn-del-' + i).setAttribute('title', t('delete_fn', { name: n }));
    });
  }
  function refreshFn(i) {
    var c = comp[i], msg = $('#fn-msg-' + i), inp = $('#fn-in-' + i);
    if (!msg) return;
    var bad = c && !c.ok && !c.empty;
    inp.setAttribute('aria-invalid', bad ? 'true' : 'false');
    msg.className = 'gp-msg' + (bad ? ' err' : ' muted');
    msg.textContent = bad ? t('err_' + c.code, { tok: c.tok }) : '';
    msg.dataset.code = bad ? c.code : '';
  }
  function renderFnMessages() {
    S.fns.forEach(function (f, i) {
      var c = comp[i], msg = $('#fn-msg-' + i);
      if (!msg || !c || !c.ok) return;
      var none = f.on && analysis.empty.indexOf(i) >= 0;
      msg.className = 'gp-msg muted'; msg.textContent = none ? t('fn_no_values') : ''; msg.dataset.code = none ? 'none' : '';
    });
  }
  function freeColor() {
    for (var k = 0; k < 8; k++) if (!S.fns.some(function (f) { return f.ci === k; })) return k;
    return S.fns.length % 8;
  }
  function addFn(src) {
    if (S.fns.length >= MAX) { EDU.toast(t('max_fns', { n: MAX })); return; }
    S.fns.push({ src: src || '', ci: freeColor(), on: true });
    compileAll(); buildFnList(); afterChange();
    var inp = $('#fn-in-' + (S.fns.length - 1)); if (inp) { inp.focus(); lastFocus = S.fns.length - 1; }
  }
  function removeFn(i) {
    S.fns.splice(i, 1);
    if (S.tv.fi >= S.fns.length) S.tv.fi = Math.max(0, S.fns.length - 1);
    compileAll(); buildFnList(); traceInfo = null; plot.clearTrace(); afterChange();
  }
  function insertKey(text) {
    if (!S.fns.length) addFn('');
    var i = Math.min(lastFocus, S.fns.length - 1), inp = $('#fn-in-' + i);
    var a = inp.selectionStart == null ? inp.value.length : inp.selectionStart, b = inp.selectionEnd == null ? a : inp.selectionEnd;
    var caret = /\(\)$|\|\|$/.test(text) ? text.length - 1 : text.length;
    inp.value = inp.value.slice(0, a) + text + inp.value.slice(b);
    inp.focus();
    try { inp.setSelectionRange(a + caret, a + caret); } catch (e) { }
    inp.dispatchEvent(new Event('input'));
  }

  /* ------------------------------------------------------------ sliders */
  function buildParams() {
    var box = $('#params');
    PARAMS.forEach(function (p) {
      var range = el('input', { type: 'range', id: 'param-' + p, min: -10, max: 10, step: 0.1, dir: 'ltr' });   // number line: − on the left
      var box2 = el('input', { type: 'number', id: 'param-' + p + '-num', step: 0.1, inputmode: 'decimal', dir: 'ltr' });
      range.value = EDU.clamp(S.P[p], -10, 10); box2.value = S.P[p];
      range.addEventListener('input', function () { S.P[p] = +(+range.value).toFixed(2); box2.value = S.P[p]; paramChanged(); });
      box2.addEventListener('input', function () {
        var v = Number(box2.value);
        if (box2.value.trim() === '' || !isFinite(v)) return;
        S.P[p] = EDU.clamp(v, -1e6, 1e6); range.value = EDU.clamp(v, -10, 10); paramChanged();
      });
      box.appendChild(el('div', { class: 'gp-param', id: 'param-row-' + p }, el('label', { class: 'pname', for: 'param-' + p, text: p }), range, box2));
    });
  }
  function syncParams() {
    var used = {};
    comp.forEach(function (c) { if (c && c.ok) Object.keys(c.params).forEach(function (k) { used[k] = 1; }); });
    PARAMS.forEach(function (p) {
      $('#param-' + p).value = EDU.clamp(S.P[p], -10, 10);
      if (document.activeElement !== $('#param-' + p + '-num')) $('#param-' + p + '-num').value = S.P[p];
      $('#param-' + p).setAttribute('aria-label', t('param_label', { p: p }));
      $('#param-' + p + '-num').setAttribute('aria-label', t('param_label', { p: p }));
      $('#param-row-' + p).classList.toggle('unused', !used[p]);
    });
  }
  var tTimer = 0;
  function paramChanged() { plot.draw(); queueAnalysis(60); syncTrace(); saveSoon(); clearTimeout(tTimer); tTimer = setTimeout(renderTable, 120); }
  function syncTrace() { if (traceInfo && traceInfo.kind === 'curve') { var c = comp[traceInfo.fi]; if (c && c.ok) { var y = M.ev(c.f, traceInfo.x, params()); if (y === y) { traceInfo.y = y; showTrace(traceInfo); } } } }

  /* ------------------------------------------------------------ presets + notes */
  function renderPresets() {
    var box = $('#presets'); box.textContent = '';
    PRESET_ORDER.forEach(function (k) {
      box.appendChild(el('button', { type: 'button', class: 'chip', id: 'preset-' + k, 'aria-pressed': S.note === k ? 'true' : 'false', text: t('pr_' + k), onclick: function () { loadPreset(k); } }));
    });
    var note = $('#note');
    if (S.note) { note.hidden = false; note.textContent = t('note_' + S.note); } else { note.hidden = true; note.textContent = ''; }
  }
  function loadPreset(k) {
    var p = PRESETS[k];
    S.fns = p.fns.map(function (src, j) { return { src: src, ci: j, on: true }; });
    if (p.P) S.P = clone(p.P);
    S.pi = !!p.pi; S.note = k; S.tv.fi = 0;
    compileAll(); buildFnList(); syncParams(); syncSettings(); renderPresets();
    setPresetView(p);
    plot.clearTrace(); afterChange();
    EDU.toast(t('loaded', { name: t('pr_' + k) }));
  }
  function renderLearn() {
    var box = $('#learn'); box.textContent = '';
    LEARN.forEach(function (L) {
      box.appendChild(el('div', { class: 'gp-learn-item' },
        el('h3', { text: t('learn_' + L.k + '_t') }),
        el('p', { text: t('learn_' + L.k) }),
        el('button', { type: 'button', class: 'btn btn-sm', id: 'try-' + L.k, text: t('try_it') + ' →', onclick: function () {
          loadPreset(L.preset);
          var g = $('#graph-card'); if (g.scrollIntoView) g.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } })));
    });
  }

  /* ------------------------------------------------------------ settings */
  function syncSettings() {
    $('#mode-rad').setAttribute('aria-pressed', S.deg ? 'false' : 'true');
    $('#mode-deg').setAttribute('aria-pressed', S.deg ? 'true' : 'false');
    $('#pi-axis').checked = S.pi; $('#pi-axis').disabled = S.deg;
    $('#show-roots').checked = S.show.roots; $('#show-inter').checked = S.show.inter; $('#show-turn').checked = S.show.turn;
  }
  function setDeg(d) {
    if (S.deg === d) return;
    var v = plot.getView(), f = d ? 180 / Math.PI : Math.PI / 180;
    S.deg = d;
    plot.setView({ cx: v.cx * f, cy: v.cy, sx: v.sx / f, sy: v.sy });
    syncSettings(); plot.clearTrace(); afterChange();
  }

  /* ------------------------------------------------------------ special points */
  var KIND_ORDER = { root: 0, yint: 1, inter: 2, min: 3, max: 4 };
  function dot(cls, col) { var d = el('span', { class: cls }); d.style.setProperty('--col', col); return d; }
  function renderPoints() {
    var body = $('#points-body'), note = $('#points-note');
    body.textContent = '';
    var pts = analysis.pts.slice().sort(function (p, q) { return (KIND_ORDER[p.kind] - KIND_ORDER[q.kind]) || (p.fi - q.fi) || (p.x - q.x); });
    var cap = 30;
    pts.slice(0, cap).forEach(function (p) {
      var dotCls = 'gp-dot' + (p.kind === 'inter' ? ' ring' : (p.kind === 'min' || p.kind === 'max') ? ' diamond' : '');
      var col = p.kind === 'inter' ? 'var(--text)' : 'var(--c' + ((S.fns[p.fi] || { ci: 0 }).ci + 1) + ')';
      body.appendChild(el('tr', { dataset: { kind: p.kind, fi: String(p.fi), fj: p.fj == null ? '' : String(p.fj), x: M.raw(p.x), y: M.raw(p.y) } },
        el('td', {}, dot(dotCls, col), el('span', { text: describe(p) })),
        el('td', { class: 'num', text: xs(p.x) }),
        el('td', { class: 'num', text: M.fmt(p.y) })));
    });
    var lines = [];
    if (!pts.length) lines.push(t('points_none'));
    if (pts.length > cap) lines.push(t('points_more', { n: pts.length - cap }));
    analysis.same.forEach(function (pr) { lines.push(t('pt_same', { a: NAMES[pr[0]], b: NAMES[pr[1]] })); });
    note.textContent = lines.join(' ');
    $('#points-table').hidden = !pts.length;
  }

  /* ------------------------------------------------------------ table of values */
  function tvRows() {
    var i = S.tv.fi, c = comp[i];
    if (!c || !c.ok) return { err: 'tv_empty' };
    var from = Number(S.tv.from), to = Number(S.tv.to), step = Number(S.tv.step);
    if (S.tv.from === '' || S.tv.to === '' || !isFinite(from) || !isFinite(to)) return { err: 'tv_empty' };
    if (!(step > 0) || !isFinite(step)) return { err: 'tv_bad_step' };
    var dir = to >= from ? 1 : -1, n = Math.floor(Math.abs(to - from) / step + 1e-9) + 1, cap = 201, rows = [], P = params();
    for (var k = 0; k < Math.min(n, cap); k++) {
      var x = +(from + dir * k * step).toPrecision(12);
      rows.push([x, M.ev(c.f, x, P)]);
    }
    return { rows: rows, capped: n > cap, cap: cap };
  }
  function renderTable() {
    var sel = $('#tv-fn');
    sel.textContent = '';
    S.fns.forEach(function (f, i) { sel.appendChild(el('option', { value: String(i), text: NAMES[i] + '(x) = ' + (f.src.trim() || '…') })); });
    if (S.tv.fi >= S.fns.length) S.tv.fi = 0;
    sel.value = String(S.tv.fi);
    sel.disabled = !S.fns.length;
    ['from', 'to', 'step'].forEach(function (k) { var inp = $('#tv-' + k); if (document.activeElement !== inp) inp.value = S.tv[k]; });
    $('#tv-head-y').textContent = (NAMES[S.tv.fi] || 'f') + '(x)';
    var body = $('#tv-body'), note = $('#tv-note'), r = tvRows();
    body.textContent = '';
    $('#tv-wrap').hidden = !!r.err;
    if (r.err) { note.textContent = t(r.err); return; }
    r.rows.forEach(function (row) {
      var ok = row[1] === row[1];
      body.appendChild(el('tr', { dataset: { x: M.raw(row[0]), y: ok ? M.raw(row[1]) : '' } },
        el('td', { class: 'num', text: xs(row[0]) }),
        el('td', { class: ok ? 'num' : 'undef', text: ok ? M.fmt(row[1]) : t('undefined') })));
    });
    note.textContent = r.capped ? t('tv_cap', { n: r.cap }) : '';
  }
  function downloadCsv() {
    var r = tvRows();
    if (r.err) { EDU.toast(t(r.err)); return; }
    var name = NAMES[S.tv.fi] || 'f';
    var rows = [['x', name + '(x) = ' + S.fns[S.tv.fi].src.trim()]].concat(r.rows.map(function (row) { return [M.raw(row[0]), row[1] === row[1] ? M.raw(row[1]) : '']; }));
    EDU.download('table-' + name + '.csv', EDU.csv.stringify(rows), 'text/csv');
  }

  /* ------------------------------------------------------------ saving */
  var sTimer = 0;
  function saveSoon() {
    clearTimeout(sTimer);
    sTimer = setTimeout(function () { S.view = plot.getView(); store.set('state', S); }, 250);
  }
  function afterChange() {
    syncParams(); plot.draw(); queueAnalysis(30); renderTable(); saveSoon();
    if (traceInfo && traceInfo.kind !== 'undef') syncTrace();
  }

  /* ------------------------------------------------------------ wiring */
  $('#add-fn').addEventListener('click', function () { addFn(''); });
  $('#reset-all').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    S = clone(DEF); compileAll(); buildFnList(); syncParams(); syncSettings(); renderPresets();
    resetView(); plot.clearTrace(); afterChange();
  });
  (function buildKeys() {
    var box = $('#keys');
    KEYS.forEach(function (k) {
      var b = el('button', { type: 'button', class: 'btn btn-sm', text: k[0], 'data-insert': k[1] });
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); });   // keep the caret in the input
      b.addEventListener('click', function () { insertKey(k[1]); });
      box.appendChild(b);
    });
  })();
  $('#zoom-in').addEventListener('click', function () { var s = plot.size(); plot.zoomAt(1.5, s.w / 2, s.h / 2); queueAnalysis(80); saveSoon(); });
  $('#zoom-out').addEventListener('click', function () { var s = plot.size(); plot.zoomAt(1 / 1.5, s.w / 2, s.h / 2); queueAnalysis(80); saveSoon(); });
  $('#reset-view').addEventListener('click', function () { plot.clearTrace(); resetView(); plot.draw(); });
  $('#fs-btn').addEventListener('click', function () { EDU.fullscreen($('#graph-card')); });
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) {
    document.addEventListener(ev, function () { setTimeout(function () { layout(true); queueAnalysis(50); }, 60); });
  });
  $('#save-png').addEventListener('click', function () { plot.draw(); EDU.downloadCanvas(canvas, 'graph.png'); });
  $('#share-btn').addEventListener('click', function () {
    var v = plot.getView();
    var data = { f: S.fns.map(function (f) { return [f.src, f.ci, f.on ? 1 : 0]; }), P: [S.P.a, S.P.b, S.P.c], d: S.deg ? 1 : 0, pi: S.pi ? 1 : 0, v: [v.cx, v.cy, v.sx, v.sy] };
    EDU.share(location.href.split('#')[0] + '#g=' + EDU.pack(data), t('app_title'));
  });
  $('#mode-rad').addEventListener('click', function () { setDeg(false); });
  $('#mode-deg').addEventListener('click', function () { setDeg(true); });
  $('#pi-axis').addEventListener('change', function () { S.pi = this.checked; plot.draw(); renderPoints(); renderTable(); showTrace(traceInfo); saveSoon(); });
  [['show-roots', 'roots'], ['show-inter', 'inter'], ['show-turn', 'turn']].forEach(function (p) {
    $('#' + p[0]).addEventListener('change', function () { S.show[p[1]] = this.checked; queueAnalysis(0); saveSoon(); });
  });
  $('#tv-fn').addEventListener('change', function () { S.tv.fi = Number(this.value) || 0; renderTable(); saveSoon(); });
  ['from', 'to', 'step'].forEach(function (k) {
    $('#tv-' + k).addEventListener('input', function () { var v = this.value.trim(); S.tv[k] = v === '' ? '' : Number(v); renderTable(); saveSoon(); });
  });
  $('#tv-csv').addEventListener('click', downloadCsv);
  $('#tv-print').addEventListener('click', function () { window.print(); });
  window.addEventListener('beforeprint', function () { plot.draw(); });

  /* ------------------------------------------------------------ start */
  readColors();
  compileAll();
  buildFnList();
  buildParams();
  syncParams();
  syncSettings();
  renderPresets();
  renderLearn();
  layout(true);
  if (S.view) plot.setView(S.view); else resetView();
  plot.draw();
  runAnalysis();
  renderTable();
  showTrace(null);

  if (window.ResizeObserver) new ResizeObserver(function () { layout(false); }).observe($('#stage'));
  window.addEventListener('resize', function () { layout(false); });
  EDU.onTheme(function () { readColors(); plot.draw(); });
  EDU.onLang(function () {
    relabelFns(); S.fns.forEach(function (f, i) { refreshFn(i); }); renderFnMessages();
    syncParams(); renderPresets(); renderLearn(); renderPoints(); renderTable(); showTrace(traceInfo);
  });

  /* for the automated test and curious students in the console */
  window.GraphPlotter = { plot: plot, state: function () { return S; }, analysis: function () { return analysis; } };
})();
