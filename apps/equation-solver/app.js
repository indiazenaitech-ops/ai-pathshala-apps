/* Equation Solver with Steps: UI. Maths lives in engine.js (window.EQS), word problems in content.js. */
(function () {
  'use strict';
  var E = window.EQS, store = EDU.store('equation-solver'), $ = EDU.$, $$ = EDU.$$, el = EDU.el, t = EDU.t;
  var MINUS = E.MINUS;

  var LIN_EX = ['3x + 5 = 2x - 7', '2(x - 3) = 4x + 1', 'x/2 + 3 = 7', '2x + 1 = 2x + 3', '5(x + 2) = 3x + 20', '3(x - 1) = 3x - 3'];
  var PAIR_EX = [['2x + 3y = 12', 'x - y = 1'], ['2x + 3y = 9', '4x + 6y = 18'], ['x + 2y = 4', '2x + 4y = 12'], ['3x - 5y = 4', '9x = 2y + 7'], ['x + y = 14', 'x - y = 4']];
  var QUAD_EX = ['x^2 - 5x + 6 = 0', '2x^2 - 4x - 3 = 0', '4x^2 - 12x + 9 = 0', 'x^2 + 2x + 5 = 0', '2x^2 + x - 6 = 0', '6 = x^2 + 5x'];
  var TABS = ['linear', 'pair', 'quad', 'word', 'practice'], MODES = ['linear', 'pair', 'quad'], LEVELS = ['easy', 'medium', 'hard'];
  var PAIR_METHODS = ['substitution', 'elimination', 'cross'], QUAD_METHODS = ['factor', 'square', 'formula'];
  var KEYS = ['x', 'y', '²', '(', ')', '+', '−', '×', '/', '=', '⌫'];

  /* ------------------------------------------------------------ state */
  function defaults() {
    return {
      tab: 'linear',
      lin: { eq: LIN_EX[0] },
      pair: { mode: 'type', eq1: PAIR_EX[0][0], eq2: PAIR_EX[0][1], boxes: ['2', '3', '12', '1', '-1', '1'], method: 'substitution' },
      quad: { eq: QUAD_EX[0], method: 'factor' },
      word: { mode: 'linear' },
      pr: { mode: 'linear', level: 'easy', problem: null, solved: 0, correct: 0, streak: 0 }
    };
  }
  function str(v, d, max) { return typeof v === 'string' ? v.slice(0, max || 120) : d; }
  function oneOf(v, list, d) { return list.indexOf(v) >= 0 ? v : d; }
  function num(v) { return typeof v === 'number' && isFinite(v) && v >= 0 ? Math.floor(v) : 0; }
  function cleanProblem(p) {
    if (!p || typeof p !== 'object' || MODES.indexOf(p.mode) < 0 || LEVELS.indexOf(p.level) < 0 || !p.answer || typeof p.answer !== 'object') return null;
    try {
      if (p.mode === 'pair') { if (typeof p.eq1 !== 'string' || typeof p.eq2 !== 'string') return null; E.parseEquation(p.eq1); E.parseEquation(p.eq2); }
      else { if (typeof p.eq !== 'string') return null; E.parseEquation(p.eq); }
      if (p.mode === 'quad') { if (!Array.isArray(p.answer.roots) || typeof p.answer.D !== 'number') return null; }
      else { E.F(p.answer.x.n, p.answer.x.d); if (p.mode === 'pair') E.F(p.answer.y.n, p.answer.y.d); }
      return p;
    } catch (e) { return null; }
  }
  function load() {
    var d = defaults(), s = store.get('state', null);
    if (!s || typeof s !== 'object') return d;
    var o = {
      tab: oneOf(s.tab, TABS, d.tab),
      lin: { eq: str(s.lin && s.lin.eq, d.lin.eq) },
      pair: {
        mode: oneOf(s.pair && s.pair.mode, ['type', 'boxes'], 'type'),
        eq1: str(s.pair && s.pair.eq1, d.pair.eq1), eq2: str(s.pair && s.pair.eq2, d.pair.eq2),
        boxes: (s.pair && Array.isArray(s.pair.boxes) && s.pair.boxes.length === 6) ? s.pair.boxes.map(function (b) { return str(b, '', 12); }) : d.pair.boxes,
        method: oneOf(s.pair && s.pair.method, PAIR_METHODS, 'substitution')
      },
      quad: { eq: str(s.quad && s.quad.eq, d.quad.eq), method: oneOf(s.quad && s.quad.method, QUAD_METHODS, 'factor') },
      word: { mode: oneOf(s.word && s.word.mode, MODES, 'linear') },
      pr: {
        mode: oneOf(s.pr && s.pr.mode, MODES, 'linear'), level: oneOf(s.pr && s.pr.level, LEVELS, 'easy'),
        problem: cleanProblem(s.pr && s.pr.problem), solved: num(s.pr && s.pr.solved), correct: num(s.pr && s.pr.correct), streak: num(s.pr && s.pr.streak)
      }
    };
    if (o.pr.correct > o.pr.solved) o.pr.correct = o.pr.solved;
    return o;
  }
  var S = load();
  function save() { store.set('state', S); }
  var last = { linear: null, pair: null, quad: null };   /* last results (re-rendered on language change) */
  var wpOpen = {};                                          /* open hints / answers in the word tab (not saved) */

  EDU.init({ slug: 'equation-solver', title: 'app_title' });

  /* ------------------------------------------------------------ small helpers */
  function m(text, cls) { return el('span', { class: 'm no-i18n' + (cls ? ' ' + cls : ''), dir: 'ltr', text: text }); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; }
  /* a translated sentence whose {vars} are maths: the maths pieces become LTR spans */
  function noteEl(key, vars, tag, cls) {
    var marks = {}, v2 = {};
    Object.keys(vars || {}).forEach(function (k, i) { marks['\u0001' + i + '\u0002'] = String(vars[k]); v2[k] = '\u0001' + i + '\u0002'; });
    var s = t(key, v2), node = el(tag || 'span', { class: cls || 'step-note' });
    s.split(/(\u0001\d+\u0002)/).forEach(function (piece) {
      if (!piece) return;
      if (marks[piece] !== undefined) node.appendChild(m(marks[piece]));
      else node.appendChild(document.createTextNode(piece));
    });
    return node;
  }
  function setSeg(id, value) { $$('#' + id + ' button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === value ? 'true' : 'false'); }); }
  function onSeg(id, fn) { $$('#' + id + ' button').forEach(function (b) { b.addEventListener('click', function () { fn(b.dataset.v); }); }); }
  function insertAt(input, text) {
    var a = input.selectionStart == null ? input.value.length : input.selectionStart, b = input.selectionEnd == null ? a : input.selectionEnd, v = input.value;
    if (text === '⌫') { if (a === b && a > 0) a--; input.value = v.slice(0, a) + v.slice(b); input.setSelectionRange(a, a); }
    else { input.value = v.slice(0, a) + text + v.slice(b); input.setSelectionRange(a + text.length, a + text.length); }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
  }
  function errorMessage(e) {
    var code = (e && e.code) || 'err_syntax', vars = { n: e && e.n !== undefined ? e.n : '', at: e && e.at ? e.at : '' };
    if (!EDU.has(code)) code = 'err_syntax';
    var box = el('div', { class: 'callout danger err', role: 'alert' });
    box.appendChild(el('p', { text: t('err_title') }));
    box.appendChild(noteEl(code, vars, 'p', ''));
    if (e && e.at) box.appendChild(el('p', { class: 'small muted' }, t('err_near') + ' ', m(e.at)));
    if (!e || !e.code) { try { console.warn('[equation-solver]', e); } catch (x) { } }
    return box;
  }

  /* ------------------------------------------------------------ tabs */
  function showTab(id, focus) {
    S.tab = id; save();
    TABS.forEach(function (k) {
      var btn = $('#tab-' + k), panel = $('#panel-' + k);
      btn.setAttribute('aria-selected', k === id ? 'true' : 'false'); btn.tabIndex = k === id ? 0 : -1;
      panel.hidden = k !== id;
    });
    if (focus) $('#tab-' + id).focus();
    if (id === 'word') renderWord();
    if (id === 'practice') renderPractice();
  }
  TABS.forEach(function (k) {
    $('#tab-' + k).addEventListener('click', function () { showTab(k); });
  });
  $('#tabs').addEventListener('keydown', function (e) {
    var i = TABS.indexOf(S.tab); if (i < 0) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); var d = (e.key === 'ArrowRight') !== (document.documentElement.dir === 'rtl') ? 1 : -1; showTab(TABS[(i + d + TABS.length) % TABS.length], true); }
    if (e.key === 'Home') { e.preventDefault(); showTab(TABS[0], true); }
    if (e.key === 'End') { e.preventDefault(); showTab(TABS[TABS.length - 1], true); }
  });

  /* ------------------------------------------------------------ keypads + examples */
  var pairFocus = 'pair-eq1';
  ['pair-eq1', 'pair-eq2'].forEach(function (id) { $('#' + id).addEventListener('focus', function () { pairFocus = id; }); });
  $$('.keys').forEach(function (pad) {
    KEYS.forEach(function (k) {
      var b = el('button', { type: 'button', class: 'btn btn-ghost btn-sm', text: k, tabindex: '-1' });
      if (k === '⌫') b.setAttribute('aria-label', t('backspace_aria'));
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      b.addEventListener('click', function () {
        var target = pad.dataset.target === 'pair-eq1' ? pairFocus : pad.dataset.target;
        insertAt($('#' + target), k === '²' ? '^2' : k === '×' ? '*' : k === '−' ? '-' : k);
      });
      pad.appendChild(b);
    });
  });
  function chips(container, list, onPick) {
    clear(container);
    list.forEach(function (item, i) {
      var label = Array.isArray(item) ? item.map(E.prettyInput).join(' ; ') : E.prettyInput(item);
      var b = el('button', { type: 'button', class: 'chip', id: container.id + '-' + i }, m(label));
      b.addEventListener('click', function () { onPick(item); });
      container.appendChild(b);
    });
  }
  chips($('#lin-examples'), LIN_EX, function (eq) { $('#lin-eq').value = eq; solveLinear(); });
  chips($('#pair-examples'), PAIR_EX, function (p) { setPairInputMode('type'); $('#pair-eq1').value = p[0]; $('#pair-eq2').value = p[1]; solvePair(); });
  chips($('#quad-examples'), QUAD_EX, function (eq) { $('#quad-eq').value = eq; solveQuad(); });

  /* ------------------------------------------------------------ shared result pieces */
  function stepsList(steps) {
    var ol = el('ol', { class: 'steps' });
    steps.forEach(function (st) {
      var li = el('li', { class: 'step', dataset: { key: st.t } });
      li.appendChild(noteEl(st.t, st.v || {}));
      if (st.m !== undefined) {
        var box = el('div', { class: 'step-math' });
        [].concat(st.m).forEach(function (line) { box.appendChild(m(line)); });
        li.appendChild(box);
      }
      ol.appendChild(li);
    });
    return ol;
  }
  function stepsText(steps) {
    var out = [];
    steps.forEach(function (st, i) {
      var vars = {}; Object.keys(st.v || {}).forEach(function (k) { vars[k] = st.v[k]; });
      out.push((i + 1) + '. ' + t(st.t, vars));
      if (st.m !== undefined) [].concat(st.m).forEach(function (l) { out.push('   ' + l); });
    });
    return out.join('\n');
  }
  function answerBox(kind, label, big, note) {
    var box = el('div', { class: 'answer-box kind-' + kind });
    box.appendChild(el('span', { class: 'ans-label', text: label }));
    if (big) box.appendChild(m(big, 'ans-big'));
    if (note) box.appendChild(typeof note === 'string' ? el('p', { class: 'ans-note', text: note }) : note);
    return box;
  }
  function actions(res, title) {
    var row = el('div', { class: 'result-actions no-print' });
    var copyBtn = el('button', { type: 'button', class: 'btn btn-sm' }, '📋 ', el('span', { text: t('copy_steps') }));
    copyBtn.addEventListener('click', function () { EDU.copy(title + '\n' + stepsText(res.steps)); EDU.toast(t('copied')); });
    var printBtn = el('button', { type: 'button', class: 'btn btn-sm' }, '🖨️ ', el('span', { text: t('print') }));
    printBtn.addEventListener('click', function () { window.print(); });
    row.appendChild(copyBtn); row.appendChild(printBtn);
    return row;
  }
  function h3(key) { return el('h3', { class: 'mt0 mb0', text: t(key) }); }

  /* ------------------------------------------------------------ LINEAR */
  function solveLinear() {
    var input = $('#lin-eq'), box = $('#lin-result');
    S.lin.eq = input.value.slice(0, 120); save();
    clear(box); input.classList.remove('bad');
    try {
      var res = E.solveLinear(input.value);
      last.linear = res;
      renderLinear(res, box);
    } catch (e) {
      last.linear = { error: e };
      input.classList.add('bad');
      box.dataset.status = 'error'; delete box.dataset.x;
      box.appendChild(errorMessage(e));
    }
  }
  function renderLinear(res, box) {
    clear(box);
    box.dataset.status = res.status;
    if (res.x) box.dataset.x = E.fs(res.x).replace(MINUS, '-'); else delete box.dataset.x;
    box.appendChild(h3('steps_title'));
    if (res.status === 'unique') box.appendChild(answerBox('unique', t('answer_label'), res.answer));
    else if (res.status === 'identity') box.appendChild(answerBox('identity', t('answer_label'), null, t('answer_identity')));
    else box.appendChild(answerBox('none', t('answer_label'), null, t('answer_none')));
    box.appendChild(stepsList(res.steps));
    box.appendChild(actions(res, S.lin.eq));
  }
  $('#lin-solve').addEventListener('click', solveLinear);
  $('#lin-eq').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); solveLinear(); } });
  $('#lin-clear').addEventListener('click', function () { $('#lin-eq').value = ''; $('#lin-eq').focus(); });

  /* ------------------------------------------------------------ PAIR */
  function setPairInputMode(mode) {
    S.pair.mode = mode; save(); setSeg('pair-input-mode', mode);
    $('#pair-typed').hidden = mode !== 'type'; $('#pair-boxes').hidden = mode !== 'boxes';
  }
  onSeg('pair-input-mode', setPairInputMode);
  onSeg('pair-method', function (v) { S.pair.method = v; save(); setSeg('pair-method', v); if (last.pair && !last.pair.error) solvePair(); });
  var BOX_IDS = ['p-a1', 'p-b1', 'p-c1', 'p-a2', 'p-b2', 'p-c2'];
  function solvePair() {
    var box = $('#pair-result'), gcard = $('#pair-graph-card');
    clear(box); $$('.eq-input', $('#pair-typed')).forEach(function (i) { i.classList.remove('bad'); });
    var input;
    try {
      if (S.pair.mode === 'boxes') {
        S.pair.boxes = BOX_IDS.map(function (id) { return $('#' + id).value.slice(0, 12); }); save();
        var vals = S.pair.boxes.map(E.fparse);
        var bad = vals.indexOf(null);
        if (bad >= 0) throw { code: 'err_box', at: ['a₁', 'b₁', 'c₁', 'a₂', 'b₂', 'c₂'][bad] };
        input = { a1: vals[0], b1: vals[1], c1: vals[2], a2: vals[3], b2: vals[4], c2: vals[5] };
      } else {
        S.pair.eq1 = $('#pair-eq1').value.slice(0, 120); S.pair.eq2 = $('#pair-eq2').value.slice(0, 120); save();
        input = { eq1: S.pair.eq1, eq2: S.pair.eq2 };
      }
      var res = E.solvePair(input, S.pair.method);
      last.pair = res;
      renderPair(res, box);
      gcard.hidden = false; drawPairGraph(res);
    } catch (e) {
      last.pair = { error: e };
      if (S.pair.mode === 'type' && e && e.n) $('#pair-eq' + e.n).classList.add('bad');
      box.dataset.status = 'error'; delete box.dataset.x; delete box.dataset.y;
      box.appendChild(errorMessage(e));
      gcard.hidden = true;
    }
  }
  function renderPair(res, box) {
    clear(box);
    box.dataset.status = res.status; box.dataset.method = res.method;
    if (res.x) { box.dataset.x = E.fs(res.x).replace(MINUS, '-'); box.dataset.y = E.fs(res.y).replace(MINUS, '-'); } else { delete box.dataset.x; delete box.dataset.y; }
    box.appendChild(h3('steps_title'));
    var c = res.consistency;
    var cons = el('div', { class: 'consist k-' + c.kind }, el('p', { text: t('consist_' + c.kind) }), m(c.ratios));
    if (res.status === 'unique') {
      box.appendChild(answerBox('unique', t('answer_label'), res.answer, t('m_' + res.method)));
      box.appendChild(cons);
    } else if (res.status === 'infinite') {
      box.appendChild(answerBox('infinite', t('answer_label'), null, t('answer_infinite')));
      box.appendChild(cons);
    } else {
      box.appendChild(answerBox('none', t('answer_label'), null, t('answer_pair_none')));
      box.appendChild(cons);
    }
    if (res.cross) box.appendChild(crossLayout(res.cross));
    box.appendChild(stepsList(res.steps));
    box.appendChild(actions(res, E.eqStr(res.eq1) + ' ; ' + E.eqStr(res.eq2)));
  }
  /* the standard cross-multiplication picture: three 2×2 blocks under x, y, 1 */
  function crossLayout(c) {
    var wrap = el('div', { class: 'cross no-i18n', dir: 'ltr' });
    var cols = [['x', c.b1, c.c1, c.b2, c.c2], ['y', c.c1, c.a1, c.c2, c.a2], ['1', c.a1, c.b1, c.a2, c.b2]];
    var NS = 'http://www.w3.org/2000/svg';
    cols.forEach(function (col) {
      var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 118 92');
      function txt(x, y, s, cls) { var tx = document.createElementNS(NS, 'text'); tx.setAttribute('x', x); tx.setAttribute('y', y); tx.setAttribute('text-anchor', 'middle'); if (cls) tx.setAttribute('class', cls); tx.textContent = s; svg.appendChild(tx); }
      function line(x1, y1, x2, y2) { var l = document.createElementNS(NS, 'line'); l.setAttribute('x1', x1); l.setAttribute('y1', y1); l.setAttribute('x2', x2); l.setAttribute('y2', y2); svg.appendChild(l); }
      txt(59, 18, col[0], 'hd');
      txt(30, 48, E.fs(col[1])); txt(88, 48, E.fs(col[2]));
      txt(30, 84, E.fs(col[3])); txt(88, 84, E.fs(col[4]));
      line(40, 54, 78, 76); line(78, 54, 40, 76);
      wrap.appendChild(el('div', { class: 'cross-block' }, svg));
    });
    return el('div', { class: 'stack' }, el('p', { class: 'small muted mb0', text: t('cross_layout') }), wrap);
  }
  $('#pair-solve').addEventListener('click', solvePair);
  ['pair-eq1', 'pair-eq2'].concat(BOX_IDS).forEach(function (id) { $('#' + id).addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); solvePair(); } }); });

  /* ------------------------------------------------------------ QUADRATIC */
  onSeg('quad-method', function (v) { S.quad.method = v; save(); setSeg('quad-method', v); if (last.quad && !last.quad.error) solveQuad(); });
  function solveQuad() {
    var input = $('#quad-eq'), box = $('#quad-result'), gcard = $('#quad-graph-card');
    S.quad.eq = input.value.slice(0, 120); save();
    clear(box); input.classList.remove('bad');
    try {
      var res = E.solveQuadratic(input.value, S.quad.method);
      last.quad = res;
      renderQuad(res, box);
      gcard.hidden = false; drawParabola(res);
    } catch (e) {
      last.quad = { error: e };
      input.classList.add('bad');
      box.dataset.status = 'error'; delete box.dataset.roots; delete box.dataset.d;
      box.appendChild(errorMessage(e));
      gcard.hidden = true;
    }
  }
  function renderQuad(res, box) {
    clear(box);
    box.dataset.status = res.nature; box.dataset.d = String(res.D); box.dataset.method = res.method;
    box.dataset.roots = res.roots.map(function (r) { return r.frac ? E.fs(r.frac).replace(MINUS, '-') : String(Math.round(r.value * 1000) / 1000); }).join(',');
    if (res.split) { box.dataset.p = String(res.split.p); box.dataset.q = String(res.split.q); } else { delete box.dataset.p; delete box.dataset.q; }
    box.appendChild(h3('steps_title'));
    var natureNote = el('p', { class: 'ans-note' }, el('span', { text: t('nature_' + res.nature) + ' ' }), m('(D = ' + E.fs(E.F(res.D)) + ')'));
    if (res.nature === 'none') {
      box.appendChild(answerBox('none', t('answer_label'), null, el('div', { class: 'ans-note' }, el('p', { class: 'mb0', text: t('answer_no_real') }), natureNote)));
    } else {
      var note = el('div', { class: 'ans-note' });
      note.appendChild(natureNote);
      if (!res.roots[0].frac) {
        var dl = res.roots.map(function (r) { return E.dec(r.value, 2); }).join(', ');
        note.appendChild(el('p', { class: 'mb0' }, el('span', { text: t('decimal_label') + ' ' }), m('x ≈ ' + dl)));
        if (res.exactSplit) note.appendChild(el('p', { class: 'mb0' }, el('span', { text: t('also_written') + ' ' }), m(res.exactSplit)));
      }
      note.appendChild(el('p', { class: 'mb0' }, el('span', { text: t('method_used') + ' ' + t('m_' + res.method) })));
      box.appendChild(answerBox('unique', t(res.nature === 'equal' ? 'roots_equal_label' : 'roots_label'), res.exact, note));
    }
    box.appendChild(stepsList(res.steps));
    box.appendChild(actions(res, S.quad.eq));
  }
  $('#quad-solve').addEventListener('click', solveQuad);
  $('#quad-eq').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); solveQuad(); } });
  $('#quad-clear').addEventListener('click', function () { $('#quad-eq').value = ''; $('#quad-eq').focus(); });

  /* ------------------------------------------------------------ graphs (SVG, colours from CSS tokens) */
  var NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs, text) { var n = document.createElementNS(NS, tag); Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); }); if (text !== undefined) n.textContent = text; return n; }
  function niceStep(span) { var raw = span / 8, p = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), r = raw / p; return (r < 1.5 ? 1 : r < 3.5 ? 2 : r < 7.5 ? 5 : 10) * p; }
  function Graph(container, xr, yr) {
    var W = 420, H = 340, PAD = { l: 34, r: 14, t: 14, b: 28 };
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img' });
    var id = 'clip' + container.id;
    var defs = svgEl('defs'), cp = svgEl('clipPath', { id: id });
    cp.appendChild(svgEl('rect', { x: PAD.l, y: PAD.t, width: W - PAD.l - PAD.r, height: H - PAD.t - PAD.b })); defs.appendChild(cp); svg.appendChild(defs);
    var sx = function (x) { return PAD.l + (x - xr[0]) / (xr[1] - xr[0]) * (W - PAD.l - PAD.r); };
    var sy = function (y) { return H - PAD.b - (y - yr[0]) / (yr[1] - yr[0]) * (H - PAD.t - PAD.b); };
    var stepX = niceStep(xr[1] - xr[0]), stepY = niceStep(yr[1] - yr[0]);
    for (var gx = Math.ceil(xr[0] / stepX) * stepX; gx <= xr[1] + 1e-9; gx += stepX) {
      svg.appendChild(svgEl('line', { class: 'gr', x1: sx(gx), y1: PAD.t, x2: sx(gx), y2: H - PAD.b }));
      if (Math.abs(gx) > 1e-9) svg.appendChild(svgEl('text', { class: 'tick', x: sx(gx), y: H - PAD.b + 13, 'text-anchor': 'middle' }, E.dec(gx, 2)));
    }
    for (var gy = Math.ceil(yr[0] / stepY) * stepY; gy <= yr[1] + 1e-9; gy += stepY) {
      svg.appendChild(svgEl('line', { class: 'gr', x1: PAD.l, y1: sy(gy), x2: W - PAD.r, y2: sy(gy) }));
      if (Math.abs(gy) > 1e-9) svg.appendChild(svgEl('text', { class: 'tick', x: PAD.l - 4, y: sy(gy) + 3, 'text-anchor': 'end' }, E.dec(gy, 2)));
    }
    if (xr[0] <= 0 && xr[1] >= 0) svg.appendChild(svgEl('line', { class: 'ax', x1: sx(0), y1: PAD.t, x2: sx(0), y2: H - PAD.b }));
    if (yr[0] <= 0 && yr[1] >= 0) svg.appendChild(svgEl('line', { class: 'ax', x1: PAD.l, y1: sy(0), x2: W - PAD.r, y2: sy(0) }));
    svg.appendChild(svgEl('text', { class: 'tick', x: W - PAD.r - 2, y: sy(Math.max(yr[0], Math.min(yr[1], 0))) - 4, 'text-anchor': 'end' }, 'x'));
    svg.appendChild(svgEl('text', { class: 'tick', x: sx(Math.max(xr[0], Math.min(xr[1], 0))) + 5, y: PAD.t + 10 }, 'y'));
    var g = svgEl('g', { 'clip-path': 'url(#' + id + ')' }); svg.appendChild(g);
    return { svg: svg, g: g, sx: sx, sy: sy, W: W, H: H, PAD: PAD,
      point: function (x, y, cls, label) {
        svg.appendChild(svgEl('circle', { class: cls, cx: sx(x), cy: sy(y), r: 6 }));
        var tx = sx(x) + 9, anchor = 'start'; if (tx > W - 80) { tx = sx(x) - 9; anchor = 'end'; }
        svg.appendChild(svgEl('text', { class: 'ptl', x: tx, y: sy(y) - 8, 'text-anchor': anchor }, label));
      } };
  }
  function range(vals, minSpan) {
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    if (!isFinite(lo) || !isFinite(hi)) { lo = -5; hi = 5; }
    var span = Math.max(minSpan, hi - lo), mid = (lo + hi) / 2;
    lo = mid - span / 2 - span * 0.15; hi = mid + span / 2 + span * 0.15;
    return [lo, hi];
  }
  function drawPairGraph(res) {
    var box = clear($('#pair-graph')), lg = clear($('#pair-legend'));
    var e1 = res.eq1, e2 = res.eq2, fv = E.fval;
    var xs = [0], ys = [0];
    [e1, e2].forEach(function (e) {
      var a = fv(e.a), b = fv(e.b), c = fv(e.c);
      if (a) xs.push(c / a); if (b) ys.push(c / b);
    });
    if (res.x) { xs.push(fv(res.x)); ys.push(fv(res.y)); }
    var xr = range(xs, 10), yr = range(ys, 10);
    var span = Math.max(xr[1] - xr[0], yr[1] - yr[0]);
    xr = [(xr[0] + xr[1]) / 2 - span / 2, (xr[0] + xr[1]) / 2 + span / 2]; yr = [(yr[0] + yr[1]) / 2 - span / 2, (yr[0] + yr[1]) / 2 + span / 2];
    var G = Graph(box, xr, yr);
    [e1, e2].forEach(function (e, i) {
      var a = fv(e.a), b = fv(e.b), c = fv(e.c), p1, p2;
      if (Math.abs(b) > 1e-12) { p1 = [xr[0], (c - a * xr[0]) / b]; p2 = [xr[1], (c - a * xr[1]) / b]; }
      else { p1 = [c / a, yr[0]]; p2 = [c / a, yr[1]]; }
      G.g.appendChild(svgEl('line', { class: i === 0 ? 'l1' : 'l2' + (res.status === 'infinite' ? ' solid' : ''), x1: G.sx(p1[0]), y1: G.sy(p1[1]), x2: G.sx(p2[0]), y2: G.sy(p2[1]) }));
    });
    if (res.x) G.point(fv(res.x), fv(res.y), 'pt', '(' + E.fs(res.x) + ', ' + E.fs(res.y) + ')');
    box.appendChild(G.svg);
    lg.appendChild(el('span', {}, el('span', { class: 'sw' }), m('(1) ' + E.eqStr(e1))));
    lg.appendChild(el('span', {}, el('span', { class: 'sw two' }), m('(2) ' + E.eqStr(e2))));
    if (res.status === 'unique') lg.appendChild(el('span', {}, el('span', { class: 'sw pt' }), el('span', { text: t('legend_intersection') })));
    else lg.appendChild(el('span', { class: 'muted', text: t(res.status === 'infinite' ? 'graph_coincident' : 'graph_parallel') }));
  }
  function drawParabola(res) {
    var box = clear($('#quad-graph')), lg = clear($('#quad-legend'));
    var a = res.a, b = res.b, c = res.c, vx = res.vertex.x, vy = res.vertex.y;
    var xs = [vx, 0], ys = [vy, 0, c];
    res.roots.forEach(function (r) { xs.push(r.value); });
    var half = Math.max(3, (Math.max.apply(null, xs) - Math.min.apply(null, xs)) * 0.8);
    var xr = [Math.min.apply(null, xs) - half / 2 - 0.5, Math.max.apply(null, xs) + half / 2 + 0.5];
    var yEdge = Math.max(a * xr[0] * xr[0] + b * xr[0] + c, a * xr[1] * xr[1] + b * xr[1] + c);
    var yEdgeMin = Math.min(a * xr[0] * xr[0] + b * xr[0] + c, a * xr[1] * xr[1] + b * xr[1] + c);
    ys.push(yEdge); ys.push(yEdgeMin);
    var yr = range(ys, 6);
    var G = Graph(box, xr, yr), d = '';
    for (var i = 0; i <= 120; i++) { var x = xr[0] + (xr[1] - xr[0]) * i / 120, y = a * x * x + b * x + c; d += (i ? ' L' : 'M') + G.sx(x).toFixed(1) + ' ' + G.sy(y).toFixed(1); }
    G.g.appendChild(svgEl('path', { class: 'para', d: d }));
    G.point(vx, vy, 'vx', '(' + E.dec(vx, 2) + ', ' + E.dec(vy, 2) + ')');
    res.roots.forEach(function (r) { G.point(r.value, 0, 'pt', r.frac ? E.fs(r.frac) : E.dec(r.value, 2)); });
    box.appendChild(G.svg);
    lg.appendChild(el('span', {}, el('span', { class: 'sw' }), m('y = ' + E.ps({ '2,0': E.F(a), '1,0': E.F(b), '0,0': E.F(c) }).replace(/ \+ 0$/, ''))));
    lg.appendChild(el('span', {}, el('span', { class: 'sw vx' }), el('span', { text: t('legend_vertex') })));
    if (res.roots.length) lg.appendChild(el('span', {}, el('span', { class: 'sw pt' }), el('span', { text: t('legend_roots') })));
    else lg.appendChild(el('span', { class: 'muted', text: t('graph_no_cut') }));
  }

  /* ------------------------------------------------------------ WORD PROBLEMS */
  function content() { var C = window.APP_CONTENT || {}; return C[EDU.lang] || C.en || {}; }
  onSeg('word-mode', function (v) { S.word.mode = v; save(); renderWord(); });
  function renderWord() {
    var mode = S.word.mode; setSeg('word-mode', mode);
    var list = clear($('#word-list')), items = content()[mode] || [], eqs = (window.APP_PROBLEM_EQ || {})[mode] || [];
    items.forEach(function (it, i) {
      var key = mode + i, eq = eqs[i] || {}, open = wpOpen[key] || {};
      var card = el('div', { class: 'wp card', id: 'wp-' + mode + '-' + i });
      card.appendChild(el('div', { class: 'wp-head' }, el('span', { class: 'wp-num no-i18n', text: String(i + 1) }), el('p', { class: 'wp-q', text: it.q })));
      var row = el('div', { class: 'row no-print' });
      var hb = el('button', { type: 'button', class: 'btn btn-sm', 'aria-expanded': open.hint ? 'true' : 'false' }, '💡 ', el('span', { text: t(open.hint ? 'hide_hint' : 'show_hint') }));
      var ab = el('button', { type: 'button', class: 'btn btn-sm', 'aria-expanded': open.ans ? 'true' : 'false' }, '✅ ', el('span', { text: t(open.ans ? 'hide_answer' : 'show_answer') }));
      var sb = el('button', { type: 'button', class: 'btn btn-sm btn-primary' }, '🧮 ', el('span', { text: t('solve_in_solver') }));
      hb.addEventListener('click', function () { wpOpen[key] = wpOpen[key] || {}; wpOpen[key].hint = !open.hint; renderWord(); });
      ab.addEventListener('click', function () { wpOpen[key] = wpOpen[key] || {}; wpOpen[key].ans = !open.ans; renderWord(); });
      sb.addEventListener('click', function () { openInSolver(mode, eq); });
      row.appendChild(hb); row.appendChild(ab); row.appendChild(sb);
      card.appendChild(row);
      if (open.hint) {
        var hint = el('div', { class: 'wp-hint' }, el('p', { text: it.hint }));
        if (eq.let) hint.appendChild(el('p', { class: 'small muted mb0', text: it.let || '' }));
        hint.appendChild(m(mode === 'pair' ? eq.eq1 + ' ; ' + eq.eq2 : (eq.show || eq.eq)));
        card.appendChild(hint);
      }
      if (open.ans) card.appendChild(el('p', { class: 'wp-ans', text: it.a }));
      list.appendChild(card);
    });
  }
  function openInSolver(mode, eq) {
    if (mode === 'pair') { setPairInputMode('type'); $('#pair-eq1').value = eq.eq1; $('#pair-eq2').value = eq.eq2; showTab('pair'); solvePair(); }
    else if (mode === 'quad') { $('#quad-eq').value = eq.eq; showTab('quad'); solveQuad(); }
    else { $('#lin-eq').value = eq.eq; showTab('linear'); solveLinear(); }
    var r = $('#' + (mode === 'linear' ? 'lin' : mode) + '-result'); if (r && r.scrollIntoView) r.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  $('#word-print').addEventListener('click', function () { window.print(); });

  /* ------------------------------------------------------------ PRACTICE */
  onSeg('pr-mode', function (v) { S.pr.mode = v; newProblem(); });
  onSeg('pr-level', function (v) { S.pr.level = v; newProblem(); });
  function newProblem() { S.pr.problem = E.generate(S.pr.mode, S.pr.level); save(); feedback('', ''); renderPractice(); }
  function feedback(text, cls) { var fb = $('#pr-feedback'); fb.textContent = text; fb.className = 'pr-fb ' + cls; fb.dataset.ok = cls; }
  function renderPractice() {
    setSeg('pr-mode', S.pr.mode); setSeg('pr-level', S.pr.level);
    if (!S.pr.problem) { S.pr.problem = E.generate(S.pr.mode, S.pr.level); save(); }
    var p = S.pr.problem, prob = clear($('#pr-problem')), ans = clear($('#pr-answers'));
    prob.dataset.mode = p.mode;
    if (p.mode === 'pair') { prob.appendChild(m(E.prettyInput(p.eq1))); prob.appendChild(m(E.prettyInput(p.eq2))); }
    else prob.appendChild(m(E.prettyInput(p.eq)));
    var old = {}; $$('input', ans).forEach(function (i) { old[i.id] = i.value; });
    function field(id, labelText) {
      var lab = el('label', { for: id }, m(labelText), el('input', { id: id, type: 'text', inputmode: 'text', dir: 'ltr', class: 'no-i18n', autocomplete: 'off', maxlength: '14', 'aria-label': labelText }));
      return lab;
    }
    if (p.mode === 'linear') ans.appendChild(field('pr-x', 'x ='));
    else if (p.mode === 'pair') { ans.appendChild(field('pr-x', 'x =')); ans.appendChild(field('pr-y', 'y =')); }
    else {
      ans.appendChild(field('pr-x', 'x₁ =')); ans.appendChild(field('pr-y', 'x₂ ='));
      ans.appendChild(el('label', { class: 'check' }, el('input', { id: 'pr-noroots', type: 'checkbox' }), el('span', { text: t('no_real_roots_opt') })));
    }
    $$('input[type=text]', ans).forEach(function (i) { i.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); checkPractice(); } }); });
    renderStats();
  }
  function renderStats() {
    var st = clear($('#pr-stats'));
    st.appendChild(el('span', { class: 'badge', id: 'st-solved' }, t('stat_solved') + ' ', m(String(S.pr.solved))));
    st.appendChild(el('span', { class: 'badge', id: 'st-correct' }, t('stat_correct') + ' ', m(String(S.pr.correct))));
    st.appendChild(el('span', { class: 'badge', id: 'st-streak' }, t('stat_streak') + ' ', m(String(S.pr.streak))));
  }
  function checkPractice() {
    var p = S.pr.problem; if (!p) return;
    var typed = { x: ($('#pr-x') || {}).value || '', y: ($('#pr-y') || {}).value || '' };
    var noRoots = $('#pr-noroots') && $('#pr-noroots').checked;
    var ok;
    if (p.mode === 'quad' && !p.answer.roots.length) ok = !!noRoots && !typed.x.trim() && !typed.y.trim();
    else if (p.mode === 'quad' && noRoots) ok = false;
    else {
      if (!typed.x.trim() && (p.mode === 'linear' || !typed.y.trim())) { feedback(t('fb_empty'), 'bad'); return; }
      ok = E.checkAnswer(p, typed) === true;
    }
    S.pr.solved++;
    if (ok) { S.pr.correct++; S.pr.streak++; feedback(t('fb_correct'), 'ok'); }
    else { S.pr.streak = 0; feedback(t('fb_wrong', { ans: E.answerText(p) }), 'bad'); }
    save(); renderStats();
  }
  $('#pr-check').addEventListener('click', checkPractice);
  $('#pr-new').addEventListener('click', newProblem);
  $('#pr-steps').addEventListener('click', function () {
    var p = S.pr.problem; if (!p) return;
    var holder = el('div', { class: 'stack result-card' });
    try {
      var res = p.mode === 'pair' ? E.solvePair({ eq1: p.eq1, eq2: p.eq2 }, S.pair.method) : p.mode === 'quad' ? E.solveQuadratic(p.eq, S.quad.method) : E.solveLinear(p.eq);
      if (p.mode === 'pair') renderPair(res, holder); else if (p.mode === 'quad') renderQuad(res, holder); else renderLinear(res, holder);
    } catch (e) { holder.appendChild(errorMessage(e)); }
    EDU.modal(holder, { title: t('show_steps') });
  });

  /* worksheet: 10 problems + answer key, printed */
  function buildWorksheet() {
    var ws = clear($('#worksheet')), probs = [];
    for (var i = 0; i < 10; i++) probs.push(E.generate(S.pr.mode, S.pr.level));
    function head(titleKey) {
      return el('div', { class: 'stack' },
        el('h2', { class: 'mb0', text: t(titleKey) + ' · ' + t('mode_' + S.pr.mode) + ' · ' + t('lv_' + S.pr.level) }),
        el('p', { class: 'small', text: t('ws_name') + ' ________________________    ' + t('ws_class') + ' ________    ' + t('ws_date') + ' ____________' }));
    }
    var tbl = el('table', { class: 'ws-table' }, el('thead', {}, el('tr', {}, el('th', { text: t('ws_col_no') }), el('th', { text: t('ws_col_problem') }), el('th', { text: t('ws_col_work') }))));
    var tb = el('tbody'); probs.forEach(function (p, i) {
      tb.appendChild(el('tr', { class: 'ws-q' }, el('td', { class: 'no-i18n', text: String(i + 1) }), el('td', { class: 'eq' }, m(p.mode === 'pair' ? E.prettyInput(p.eq1) + ' ; ' + E.prettyInput(p.eq2) : E.prettyInput(p.eq))), el('td', { class: 'work' })));
    });
    tbl.appendChild(tb);
    var key = el('table', { class: 'ws-table' }, el('thead', {}, el('tr', {}, el('th', { text: t('ws_col_no') }), el('th', { text: t('ws_col_problem') }), el('th', { text: t('ws_col_answer') }))));
    var kb = el('tbody'); probs.forEach(function (p, i) {
      kb.appendChild(el('tr', { class: 'ws-k' }, el('td', { class: 'no-i18n', text: String(i + 1) }), el('td', {}, m(p.mode === 'pair' ? E.prettyInput(p.eq1) + ' ; ' + E.prettyInput(p.eq2) : E.prettyInput(p.eq))), el('td', { class: 'ans' }, m(E.answerText(p)))));
    });
    key.appendChild(kb);
    ws.appendChild(head('ws_title')); ws.appendChild(el('p', { class: 'small', text: t('ws_instruction') })); ws.appendChild(tbl);
    ws.appendChild(el('div', { class: 'ws-key' }, head('ws_key_title'), key));
    return probs;
  }
  $('#pr-worksheet').addEventListener('click', function () {
    buildWorksheet();
    document.body.classList.add('printing-ws');
    var done = function () { document.body.classList.remove('printing-ws'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(function () { try { window.print(); } catch (e) { } setTimeout(done, 1500); }, 50);
  });

  /* ------------------------------------------------------------ reset + language */
  $('#reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    store.remove('state'); S = defaults(); wpOpen = {}; last = { linear: null, pair: null, quad: null }; save();
    fillInputs(); solveAll(); showTab('linear');
  });
  function fillInputs() {
    $('#lin-eq').value = S.lin.eq; $('#pair-eq1').value = S.pair.eq1; $('#pair-eq2').value = S.pair.eq2; $('#quad-eq').value = S.quad.eq;
    BOX_IDS.forEach(function (id, i) { $('#' + id).value = S.pair.boxes[i]; });
    setPairInputMode(S.pair.mode); setSeg('pair-method', S.pair.method); setSeg('quad-method', S.quad.method);
  }
  function solveAll() { solveLinear(); solvePair(); solveQuad(); }
  function rerender() {
    ['linear', 'pair', 'quad'].forEach(function (k) {
      var r = last[k], box = $('#' + (k === 'linear' ? 'lin' : k) + '-result'); if (!r) return;
      if (r.error) { clear(box); box.appendChild(errorMessage(r.error)); return; }
      if (k === 'linear') renderLinear(r, box); else if (k === 'pair') { renderPair(r, box); drawPairGraph(r); } else { renderQuad(r, box); drawParabola(r); }
    });
    $$('.keys button').forEach(function (b) { if (b.textContent === '⌫') b.setAttribute('aria-label', t('backspace_aria')); });
    renderWord(); renderPractice();
  }
  EDU.onLang(rerender);

  fillInputs();
  solveAll();
  showTab(S.tab);
  renderWord(); renderPractice();
})();
