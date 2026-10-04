/* Logic Gates Lab: user interface.
   Tabs: gate explorer · expression lab (truth table, circuit, equivalence) · adders · practice. */
(function () {
  'use strict';
  var L = window.LG_LOGIC, D = window.LG_DRAW;
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$;
  var store = EDU.store('logic-gates');
  var GATES = ['and', 'or', 'not', 'nand', 'nor', 'xor', 'xnor'];
  var NAME = D.NAME;
  var TABS = ['gates', 'expr', 'adders', 'practice'];
  var DEF = {
    tab: 'gates', gate: 'and', nIn: 2, gIn: [1, 0, 0],
    expr: "(A + B)·C'", steps: true, xv: { A: 1, B: 0, C: 0, D: 0, E: 0 },
    eq1: "(A·B)'", eq2: "A' + B'",
    adder: 'half', ha: [1, 1], fa: [1, 0, 1], a4: 9, b4: 7,
    pmode: 'fill', level: 'easy'
  };
  var EXAMPLES = ["A·B + C'", "(A + B)·C'", "NOT (A AND B)", "A'B + AB'", "A ⊕ B ⊕ C", "A·B + B·C + A·C", "(A + B)' + A·C", "A·B + A·B'"];
  var LAWS = [
    { k: 'law_dm1', a: "(A·B)'", b: "A' + B'" },
    { k: 'law_dm2', a: "(A + B)'", b: "A'·B'" },
    { k: 'law_abs1', a: 'A + A·B', b: 'A' },
    { k: 'law_abs2', a: 'A·(A + B)', b: 'A' },
    { k: 'law_dist1', a: 'A·(B + C)', b: 'A·B + A·C' },
    { k: 'law_dist2', a: 'A + B·C', b: '(A + B)·(A + C)' },
    { k: 'law_xor', a: 'A ⊕ B', b: "A·B' + A'·B" },
    { k: 'law_dneg', a: "(A')'", b: 'A' },
    { k: 'law_nand', a: 'A NAND A', b: "A'" },
    { k: 'law_mistake', a: "(A + B)'", b: "A' + B'" }
  ];
  var POOL = {
    medium: ["A·B'", "A' + B", "(A + B)'", "(A·B)'", "A'·B'", "A' + B'", "A ⊕ B'", 'A + A·B', "A·(A' + B)", "(A ⊕ B)'"],
    hard: ['A·B + C', "(A + B)·C'", 'A ⊕ B ⊕ C', "A·B + A'·C", "(A·B)' + C", "(A + B')·(B + C)", 'A·B + B·C + A·C', '(A ⊕ B)·C', "A'·B'·C + A·B·C'", "(A + B + C)'", "A·B' + B·C'", "(A·B + C)'"]
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function bits(a, n, d) { var out = []; for (var i = 0; i < n; i++) out.push(Array.isArray(a) && a[i] ? 1 : (Array.isArray(a) ? 0 : d[i])); return out; }
  function int(v, lo, hi, d) { v = Math.round(Number(v)); return isFinite(v) && v >= lo && v <= hi ? v : d; }
  function loadState() {
    var saved = store.get('state', {});
    var s = Object.assign(clone(DEF), saved && typeof saved === 'object' ? saved : {});
    if (TABS.indexOf(s.tab) < 0) s.tab = DEF.tab;
    if (GATES.indexOf(s.gate) < 0) s.gate = DEF.gate;
    if (s.nIn !== 2 && s.nIn !== 3) s.nIn = 2;
    s.gIn = bits(s.gIn, 3, DEF.gIn); s.ha = bits(s.ha, 2, DEF.ha); s.fa = bits(s.fa, 3, DEF.fa);
    ['expr', 'eq1', 'eq2'].forEach(function (k) { if (typeof s[k] !== 'string' || s[k].length > L.MAXLEN) s[k] = DEF[k]; });
    var xv = {}; L.VARS.forEach(function (v) { xv[v] = s.xv && s.xv[v] ? 1 : 0; }); s.xv = xv;
    s.a4 = int(s.a4, 0, 15, DEF.a4); s.b4 = int(s.b4, 0, 15, DEF.b4);
    if (['half', 'full', 'four'].indexOf(s.adder) < 0) s.adder = DEF.adder;
    if (['fill', 'name'].indexOf(s.pmode) < 0) s.pmode = DEF.pmode;
    if (['easy', 'medium', 'hard'].indexOf(s.level) < 0) s.level = DEF.level;
    s.steps = s.steps !== false;
    return s;
  }
  var st = loadState();
  var score = loadScore();
  function loadScore() {
    var s = store.get('score', {}) || {};
    return { c: int(s.c, 0, 1e6, 0), n: int(s.n, 0, 1e6, 0), streak: int(s.streak, 0, 1e6, 0), best: int(s.best, 0, 1e6, 0) };
  }
  function save() { store.set('state', st); }
  function saveScore() { store.set('score', score); }

  /* A shared link (#x=...) opens the expression lab with that expression. The expression is saved and the
     #x=... part is removed from the address, so a later reload keeps the student's own edits instead of
     bringing the shared expression back. Returns true when a link was applied. */
  function readHash() {
    var m = /[#&]x=([A-Za-z0-9_-]+)/.exec(location.hash || '');
    if (!m) return false;
    var o = EDU.unpack(m[1]), ok = !!(o && typeof o.e === 'string' && o.e.length <= L.MAXLEN);
    if (ok) { st.expr = o.e; st.tab = 'expr'; save(); }
    try { history.replaceState(history.state, '', location.href.split('#')[0]); } catch (e) { }
    return ok;
  }
  readHash();

  EDU.init({ slug: 'logic-gates', title: 'app_title' });

  /* ---------- helpers ---------- */
  function replace(sel, node) { var box = $(sel); box.innerHTML = ''; if (node) box.appendChild(node); }
  var LRI = '⁦', PDI = '⁩';
  function iso(s) { return LRI + s + PDI; }
  /* keep keyboard focus on the "same" control after a re-render */
  function keepFocus(fn) {
    var a = document.activeElement, key = a && a.getAttribute && a.getAttribute('data-fk');
    fn();
    if (key) { var b = document.querySelector('[data-fk="' + key + '"]'); if (b && b.focus) b.focus({ preventScroll: true }); }
  }
  function onActivate(root, sel, fn) {
    root.addEventListener('click', function (e) { var n = e.target.closest(sel); if (n && root.contains(n)) fn(n, e); });
    root.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var n = e.target.closest(sel);
      if (n && root.contains(n) && n.tagName !== 'BUTTON') { e.preventDefault(); fn(n, e); }
    });
  }
  function swAria(id, label, v) { return t('sw_aria', { v: label, x: v }); }
  function nInputs(n) { return n === 1 ? t('one_input') : t('n_inputs', { n: n }); }

  /* Truth table. vs = variable names used for the rows; cols = [{head (html), vals, out}]
     opts: {cur, onRow, index, labels, fk} */
  function ttTable(vs, cols, opts) {
    opts = opts || {};
    var labels = opts.labels || vs;
    var head = el('tr', null, opts.index ? el('th', { class: 'idx', text: '#' }) : null,
      labels.map(function (v) { return el('th', { class: 'in', text: v }); }),
      cols.map(function (c) { var th = el('th', { class: (c.out ? 'o' : 's') + (c.text ? ' txt' : '') }); th.innerHTML = c.head; return th; }));
    var tb = el('tbody');
    for (var i = 0; i < (1 << vs.length); i++) {
      var e = L.env(vs, i);
      var tr = el('tr', { class: i === opts.cur ? 'cur' : null, dataset: { row: String(i) } });
      if (opts.index) tr.appendChild(el('td', { class: 'idx', text: String(i) }));
      vs.forEach(function (v) { tr.appendChild(el('td', { class: 'in ' + (e[v] ? 'one' : 'zero'), text: String(e[v]) })); });
      cols.forEach(function (c) { var v = c.vals[i]; tr.appendChild(el('td', { class: (c.out ? 'o ' : 's ') + (v ? 'one' : 'zero'), text: String(v) })); });
      if (opts.onRow) {
        tr.tabIndex = 0;
        tr.setAttribute('data-fk', (opts.fk || 'tt') + '-' + i);
        tr.setAttribute('aria-label', labels.map(function (v, k) { return v + ' = ' + e[vs[k]]; }).join(', '));
        if (i === opts.cur) tr.setAttribute('aria-current', 'true');
      }
      tb.appendChild(tr);
    }
    var table = el('table', { class: 'table tt' + (opts.onRow ? ' clickable' : ''), dir: 'ltr' }, el('thead', null, head), tb);
    if (opts.onRow) onActivate(table, 'tr[data-row]', function (tr) { opts.onRow(+tr.dataset.row); });
    return table;
  }

  /* ---------- tabs ---------- */
  function showTab(id, focus) {
    st.tab = id; save();
    TABS.forEach(function (k) {
      var b = $('#tab-' + k), on = k === id;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      $('#p-' + k).hidden = !on;
    });
    if (focus) $('#tab-' + id).focus();
    if (id === 'practice' && !P.q) newQuestion();
  }
  TABS.forEach(function (k, i) {
    var b = $('#tab-' + k);
    b.addEventListener('click', function () { showTab(k); });
    b.addEventListener('keydown', function (e) {
      var rtl = document.documentElement.dir === 'rtl', d = 0;
      if (e.key === 'ArrowRight') d = rtl ? -1 : 1; else if (e.key === 'ArrowLeft') d = rtl ? 1 : -1;
      else if (e.key === 'Home') d = -i; else if (e.key === 'End') d = TABS.length - 1 - i;
      if (!d) return;
      e.preventDefault();
      showTab(TABS[(i + d + TABS.length) % TABS.length], true);
    });
  });

  /* =========================================================== gate explorer */
  function gateIns() { var n = st.gate === 'not' ? 1 : st.nIn; return st.gIn.slice(0, n); }
  function buildGateChips() {
    var wrap = $('#gate-chips');
    wrap.innerHTML = '';
    GATES.forEach(function (g) {
      wrap.appendChild(el('button', { type: 'button', class: 'chip gchip', id: 'g-' + g, 'data-fk': 'g-' + g, dataset: { g: g }, text: NAME[g], onclick: function () { st.gate = g; save(); renderGates(); } }));
    });
  }
  function renderGates() {
    var n = st.gate === 'not' ? 1 : st.nIn, ins = gateIns(), y = L.gate(st.gate, ins), vs = L.VARS.slice(0, n);
    $$('#gate-chips .chip').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.g === st.gate ? 'true' : 'false'); });
    $('#nin-row').hidden = st.gate === 'not';
    $$('#nin-seg button').forEach(function (b) { b.setAttribute('aria-pressed', +b.dataset.n === st.nIn ? 'true' : 'false'); b.textContent = t('n_inputs', { n: b.dataset.n }); });
    $('#gx-svg').innerHTML = D.explorer(st.gate, n, ins, y, { swAria: swAria, outAria: t('out_aria', { v: 'Y', x: y }), aria: t('gate_name', { g: NAME[st.gate] }) });
    $('#gx-name').textContent = t('gate_name', { g: NAME[st.gate] });
    $('#gx-expr').innerHTML = 'Y = ' + L.html(L.gateAst(st.gate, n));
    $('#gx-read').textContent = ins.map(function (v, i) { return 'ABC'[i] + ' = ' + v; }).join(', ') + '  →  Y = ' + y;
    $('#gx-rule').textContent = t('rule_' + st.gate);
    $('#gx-life').textContent = t('life_' + st.gate);
    $('#gx-univ').hidden = !(st.gate === 'nand' || st.gate === 'nor');
    var col = L.column(L.gateAst(st.gate, n), vs);
    replace('#gx-tt', ttTable(vs, [{ head: 'Y', vals: col, out: true }], {
      cur: L.rowOf(vs, envOf(vs, ins)), fk: 'gx',
      onRow: function (i) { var e = L.env(vs, i); keepFocus(function () { vs.forEach(function (v, k) { st.gIn[k] = e[v]; }); save(); renderGates(); }); }
    }));
    renderAllGates();
  }
  function envOf(vs, arr) { var e = {}; vs.forEach(function (v, i) { e[v] = arr[i] ? 1 : 0; }); return e; }
  function toggleGateInput(i) {
    var n = st.gate === 'not' ? 1 : st.nIn;
    if (!(i >= 0 && i < n)) return;
    keepFocus(function () { st.gIn[i] = st.gIn[i] ? 0 : 1; save(); renderGates(); });
  }
  onActivate($('#gx-svg'), '[data-sw]', function (n) { toggleGateInput(+n.getAttribute('data-sw')); });
  $$('#nin-seg button').forEach(function (b) { b.addEventListener('click', function () { st.nIn = +b.dataset.n; save(); renderGates(); }); });

  function renderAllGates() {
    var two = ['and', 'or', 'nand', 'nor', 'xor', 'xnor'], vs = ['A', 'B'];
    var cols = two.map(function (g) { return { head: NAME[g], vals: L.column(L.gateAst(g, 2), vs) }; });
    cols.push({ head: 'NOT A', vals: [1, 1, 0, 0] });   /* rows AB = 00, 01, 10, 11 */
    replace('#all-tt', ttTable(vs, cols, {
      cur: L.rowOf(vs, envOf(vs, st.gIn)), fk: 'ag',
      onRow: function (i) { keepFocus(function () { st.gIn[0] = (i >> 1) & 1; st.gIn[1] = i & 1; save(); renderGates(); }); }
    }));
  }

  /* =========================================================== expression lab */
  var X = { ast: null, err: null, vars: [] };
  function parseMain() {
    try { X.ast = L.parse(st.expr); X.err = null; X.vars = L.vars(X.ast); }
    catch (e) { if (!(e instanceof L.ParseError)) throw e; X.ast = null; X.err = e; X.vars = []; }
  }
  function errText(e) { return t(e.key, e.vars); }
  function renderExpr() {
    parseMain();
    var msg = $('#x-msg');
    $('#expr-in').setAttribute('aria-invalid', X.err && X.err.key !== 'err_empty' ? 'true' : 'false');
    if (X.err) {
      msg.textContent = errText(X.err);
      msg.className = 'callout ' + (X.err.key === 'err_empty' ? '' : 'danger');
      msg.hidden = false;
      $('#x-result').hidden = true;
      return;
    }
    msg.hidden = true;
    $('#x-result').hidden = false;
    $('#x-pretty').innerHTML = 'Y = ' + L.html(X.ast);
    var env = st.xv;
    /* input buttons */
    var tg = $('#x-toggles');
    tg.innerHTML = '';
    if (!X.vars.length) tg.appendChild(el('span', { class: 'muted small', i18n: 'no_inputs' }));
    X.vars.forEach(function (v) {
      tg.appendChild(el('button', { type: 'button', class: 'btn bit-t', 'data-fk': 'xt-' + v, dataset: { v: v }, 'aria-pressed': env[v] ? 'true' : 'false', 'aria-label': swAria(v, v, env[v]), text: v + ' = ' + env[v] }));
    });
    /* circuit */
    var c = D.circuit(X.ast, env, { leafAria: function (v, x) { return t('sw_aria', { v: v, x: x }); }, outAria: t('out_aria', { v: 'Y', x: L.evaluate(X.ast, env) }), aria: t('circuit') });
    var box = $('#x-circ');
    if (c) {
      box.innerHTML = c.svg;
      var svg = box.firstChild;
      svg.style.width = Math.round(c.w * 1.55) + 'px';
      svg.style.minWidth = Math.min(Math.round(c.w * 0.75), Math.round(c.w * 1.55)) + 'px';
      $('#x-big').hidden = true;
    } else { box.innerHTML = ''; $('#x-big').hidden = false; }
    /* truth table */
    var steps = st.steps ? L.steps(X.ast, 8) : [];
    var cols = steps.map(function (s) { return { head: L.html(s), vals: L.column(s, X.vars) }; });
    var yv = L.column(X.ast, X.vars);
    cols.push({ head: 'Y', vals: yv, out: true });
    replace('#x-tt', ttTable(X.vars, cols, {
      index: true, cur: L.rowOf(X.vars, env), fk: 'xr',
      onRow: function (i) { var e = L.env(X.vars, i); keepFocus(function () { X.vars.forEach(function (v) { st.xv[v] = e[v]; }); save(); renderExpr(); }); }
    }));
    var ones = [], zeros = [];
    yv.forEach(function (v, i) { (v ? ones : zeros).push(i); });
    var sum = $('#x-sum');
    sum.innerHTML = '';
    if (!zeros.length) sum.appendChild(el('span', { class: 'badge success', text: t('always_1') }));
    else if (!ones.length) sum.appendChild(el('span', { class: 'badge danger', text: t('always_0') }));
    else {
      sum.appendChild(el('span', { text: t('ones_in', { k: ones.length, n: yv.length }) + ' ' }));
      sum.appendChild(el('code', { class: 'mono', dir: 'ltr', text: 'Σm(' + ones.join(', ') + ')' }));
    }
  }
  function toggleVar(v) {
    if (X.vars.indexOf(v) < 0) return;
    keepFocus(function () { st.xv[v] = st.xv[v] ? 0 : 1; save(); renderExpr(); });
  }
  onActivate($('#x-toggles'), 'button[data-v]', function (n) { toggleVar(n.dataset.v); });
  onActivate($('#x-circ'), '[data-var]', function (n) { toggleVar(n.getAttribute('data-var')); });
  var exprTimer = null;
  $('#expr-in').value = st.expr;
  $('#expr-in').addEventListener('input', function () {
    clearTimeout(exprTimer);
    exprTimer = setTimeout(function () { st.expr = $('#expr-in').value.slice(0, L.MAXLEN + 50); save(); renderExpr(); }, 200);
  });
  $('#steps-on').checked = st.steps;
  $('#steps-on').addEventListener('change', function () { st.steps = $('#steps-on').checked; save(); renderExpr(); });
  (function buildExamples() {
    var wrap = $('#x-examples');
    EXAMPLES.forEach(function (ex) {
      wrap.appendChild(el('button', { type: 'button', class: 'chip mono', dir: 'ltr', text: ex, onclick: function () { st.expr = ex; $('#expr-in').value = ex; save(); renderExpr(); } }));
    });
  })();
  /* symbol keypad: inserts at the cursor (handy on phones, where · ⊕ ' are hard to type).
     Pressing a key must not move focus into the text box: on phones and smartboards that pops up the
     on-screen keyboard, which then covers this keypad. mousedown.preventDefault keeps focus where it was. */
  $$('#x-keys button').forEach(function (b) {
    b.addEventListener('mousedown', function (e) { if ($('#expr-in') === document.activeElement) e.preventDefault(); });
    b.addEventListener('click', function () {
      var inp = $('#expr-in'), ins = b.getAttribute('data-ins');
      clearTimeout(exprTimer);
      var s = inp.selectionStart == null ? inp.value.length : inp.selectionStart, e = inp.selectionEnd == null ? s : inp.selectionEnd;
      if (ins === '⌫') {
        if (s === e && s > 0) s--;
        inp.value = inp.value.slice(0, s) + inp.value.slice(e); e = s;
      } else {
        if (inp.value.length - (e - s) + ins.length > +inp.maxLength && inp.maxLength > 0) return;
        inp.value = inp.value.slice(0, s) + ins + inp.value.slice(e); s = e = s + ins.length;
      }
      try { inp.setSelectionRange(e, e); } catch (err) { }
      st.expr = inp.value; save(); renderExpr();
    });
  });
  $('#x-copy').addEventListener('click', function () {
    var url = location.href.split('#')[0] + '#x=' + EDU.pack({ e: st.expr });
    EDU.copy(url);
  });
  $('#x-print').addEventListener('click', function () { document.body.classList.remove('print-ws'); window.print(); });
  /* a second shared link pasted into the same tab only changes the #hash (no reload) */
  window.addEventListener('hashchange', function () {
    if (!readHash()) return;
    $('#expr-in').value = st.expr;
    renderExpr();
    showTab('expr');
  });

  /* ----- equivalence ----- */
  var eqTimer = null;
  $('#eq1').value = st.eq1; $('#eq2').value = st.eq2;
  ['eq1', 'eq2'].forEach(function (id) {
    $('#' + id).addEventListener('input', function () {
      clearTimeout(eqTimer);
      eqTimer = setTimeout(function () { st.eq1 = $('#eq1').value.slice(0, L.MAXLEN + 50); st.eq2 = $('#eq2').value.slice(0, L.MAXLEN + 50); save(); renderEq(); }, 250);
    });
    $('#' + id).addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); readEq(); renderEq(); } });
  });
  function readEq() { st.eq1 = $('#eq1').value.slice(0, L.MAXLEN + 50); st.eq2 = $('#eq2').value.slice(0, L.MAXLEN + 50); save(); }
  $('#eq-check').addEventListener('click', function () { readEq(); renderEq(); });
  function buildLaws() {
    var wrap = $('#eq-laws');
    wrap.innerHTML = '';
    LAWS.forEach(function (lw) {
      wrap.appendChild(el('button', { type: 'button', class: 'chip', dataset: { law: lw.k }, i18n: lw.k, onclick: function () {
        st.eq1 = lw.a; st.eq2 = lw.b; $('#eq1').value = lw.a; $('#eq2').value = lw.b; save(); renderEq();
      } }));
    });
  }
  function renderEq() {
    var a = null, b = null, ea = null, eb = null;
    try { a = L.parse(st.eq1); } catch (e) { if (!(e instanceof L.ParseError)) throw e; ea = e; }
    try { b = L.parse(st.eq2); } catch (e) { if (!(e instanceof L.ParseError)) throw e; eb = e; }
    $('#eq1-p').innerHTML = a ? '= ' + L.html(a) : '';
    $('#eq2-p').innerHTML = b ? '= ' + L.html(b) : '';
    $$('#eq-laws .chip').forEach(function (c) {
      var lw = LAWS.filter(function (x) { return x.k === c.dataset.law; })[0];
      c.setAttribute('aria-pressed', lw && lw.a === st.eq1 && lw.b === st.eq2 ? 'true' : 'false');
    });
    var res = $('#eq-res'), tbl = $('#eq-tt');
    res.innerHTML = ''; tbl.innerHTML = '';
    if (ea || eb) {
      res.className = 'callout danger';
      if (ea) res.appendChild(el('div', null, el('strong', { text: t('expr1') + ': ' }), errText(ea)));
      if (eb) res.appendChild(el('div', null, el('strong', { text: t('expr2') + ': ' }), errText(eb)));
      res.dataset.eq = '';
      return;
    }
    var r = L.compare(a, b);
    res.dataset.eq = r.equal ? 'yes' : 'no';
    if (r.equal) {
      res.className = 'callout success';
      res.appendChild(el('strong', { class: 'eq-big', text: t('equiv_yes', { n: r.rows.length }) }));
    } else {
      var bad = r.rows[r.bad];
      var vals = r.vars.map(function (v) { return v + ' = ' + bad.env[v]; }).join(', ');
      res.className = 'callout danger';
      res.appendChild(el('strong', { class: 'eq-big', text: t('equiv_no') }));
      res.appendChild(el('div', { text: t('equiv_detail', { vals: iso(vals), a: bad.a, b: bad.b }) }));
    }
    var vs = r.vars;
    var colA = r.rows.map(function (x) { return x.a; }), colB = r.rows.map(function (x) { return x.b; });
    var table = ttTable(vs, [{ head: EDU.esc(t('col_first')), vals: colA, out: true, text: true }, { head: EDU.esc(t('col_second')), vals: colB, out: true, text: true }]);
    var trs = $$('tbody tr', table);
    trs.forEach(function (tr, i) {
      var same = colA[i] === colB[i];
      tr.appendChild(el('td', { class: same ? 'ok mark' : 'bad mark', text: same ? '✓' : '✗' }));
      if (!same) tr.classList.add('diff');
    });
    $('thead tr', table).appendChild(el('th', { class: 'txt', text: t('same') }));
    tbl.appendChild(table);
  }

  /* =========================================================== adders */
  function renderAdders() {
    $$('#adder-seg button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.m === st.adder ? 'true' : 'false'); });
    ['half', 'full', 'four'].forEach(function (m) { $('#ad-' + m).hidden = st.adder !== m; });
    if (st.adder === 'half') renderHalf(); else if (st.adder === 'full') renderFull(); else renderFour();
  }
  function inputButtons(sel, list) {
    var box = $(sel);
    box.innerHTML = '';
    list.forEach(function (it) {
      box.appendChild(el('button', { type: 'button', class: 'btn bit-t', 'data-fk': sel + it.id, dataset: { id: it.id }, 'aria-pressed': it.v ? 'true' : 'false', 'aria-label': swAria(it.id, it.label, it.v), text: it.label + ' = ' + it.v }));
    });
  }
  function readLine(sel, parts, total, carry, sum) {
    var box = $(sel);
    box.innerHTML = '';
    box.appendChild(el('div', { class: 'add-eq', dir: 'ltr', text: parts.join(' + ') + ' = ' + total }));
    box.appendChild(el('div', { text: t('read_bin', { bin: iso(String(carry) + String(sum)), d: total }) }));
  }
  function renderHalf() {
    var a = st.ha[0], b = st.ha[1], S = a ^ b, C = a & b;
    $('#ha-svg').innerHTML = D.halfAdder(a, b, { swAria: swAria, aria: t('half_adder'), sAria: t('out_aria', { v: 'S', x: S }), cAria: t('out_aria', { v: 'C', x: C }) });
    inputButtons('#ha-btns', [{ id: 'a', label: 'A', v: a }, { id: 'b', label: 'B', v: b }]);
    readLine('#ha-read', [a, b], a + b, C, S);
    var vs = ['A', 'B'];
    replace('#ha-tt', ttTable(vs, [
      { head: 'C', vals: L.column(L.parse('A·B'), vs), out: true },
      { head: 'S', vals: L.column(L.parse('A ⊕ B'), vs), out: true }
    ], { cur: a * 2 + b, fk: 'ha', onRow: function (i) { keepFocus(function () { st.ha = [(i >> 1) & 1, i & 1]; save(); renderHalf(); }); } }));
  }
  function renderFull() {
    var a = st.fa[0], b = st.fa[1], c = st.fa[2], S = a ^ b ^ c, Co = (a & b) | (c & (a ^ b));
    $('#fa-svg').innerHTML = D.fullAdder(a, b, c, { swAria: swAria, aria: t('full_adder'), sAria: t('out_aria', { v: 'S', x: S }), cAria: t('out_aria', { v: 'Cout', x: Co }) });
    inputButtons('#fa-btns', [{ id: 'a', label: 'A', v: a }, { id: 'b', label: 'B', v: b }, { id: 'c', label: 'Cin', v: c }]);
    readLine('#fa-read', [a, b, c], a + b + c, Co, S);
    var vs = ['A', 'B', 'C'];
    replace('#fa-tt', ttTable(vs, [
      { head: 'Cout', vals: L.column(L.parse('A·B + C·(A ⊕ B)'), vs), out: true },
      { head: 'S', vals: L.column(L.parse('A ⊕ B ⊕ C'), vs), out: true }
    ], { labels: ['A', 'B', 'Cin'], cur: a * 4 + b * 2 + c, fk: 'fa', onRow: function (i) { keepFocus(function () { st.fa = [(i >> 2) & 1, (i >> 1) & 1, i & 1]; save(); renderFull(); }); } }));
  }
  function flipAdder(id) {
    keepFocus(function () {
      if (st.adder === 'half') { var k = id === 'a' ? 0 : id === 'b' ? 1 : -1; if (k < 0) return; st.ha[k] = st.ha[k] ? 0 : 1; save(); renderHalf(); }
      else if (st.adder === 'full') { var j = { a: 0, b: 1, c: 2 }[id]; if (j === undefined) return; st.fa[j] = st.fa[j] ? 0 : 1; save(); renderFull(); }
    });
  }
  onActivate($('#ha-svg'), '[data-sw]', function (n) { flipAdder(n.getAttribute('data-sw')); });
  onActivate($('#fa-svg'), '[data-sw]', function (n) { flipAdder(n.getAttribute('data-sw')); });
  onActivate($('#ha-btns'), 'button[data-id]', function (n) { flipAdder(n.dataset.id); });
  onActivate($('#fa-btns'), 'button[data-id]', function (n) { flipAdder(n.dataset.id); });
  $$('#adder-seg button').forEach(function (b) { b.addEventListener('click', function () { st.adder = b.dataset.m; save(); renderAdders(); }); });

  /* 4-bit ripple-carry adder, laid out like column addition (carries on top) */
  function renderFour() {
    var a = st.a4, b = st.b4, c = [0], s = [];
    for (var i = 0; i < 4; i++) {
      var ai = (a >> i) & 1, bi = (b >> i) & 1;
      s[i] = ai ^ bi ^ c[i];
      c[i + 1] = (ai & bi) | (c[i] & (ai ^ bi));
    }
    var total = a + b, grid = $('#four-grid');
    grid.innerHTML = '';
    function cell(cls, txt, attrs) { var d = el('div', Object.assign({ class: 'f-cell ' + (cls || '') }, attrs || {})); if (txt !== undefined && txt !== null) d.textContent = txt; grid.appendChild(d); return d; }
    /* header: place values */
    cell('f-lbl tiny muted', t('place_val'));
    cell('', ''); [8, 4, 2, 1].forEach(function (p) { cell('f-pv muted', String(p)); }); cell('', '');
    /* carries into each column (c4 is the final carry, shown in the answer row) */
    cell('f-lbl tiny', t('carry_row'));
    cell('', '');
    [3, 2, 1, 0].forEach(function (i) { if (i) cell('f-carry ' + (c[i] ? 'on' : 'off'), String(c[i]), { 'data-c': String(i) }); else cell('', ''); });
    cell('', '');
    /* A and B bits */
    [['A', 'a4', a], ['B', 'b4', b]].forEach(function (row, r) {
      cell('f-lbl f-big', (r ? '+ ' : '') + row[0]);
      cell('', '');
      [3, 2, 1, 0].forEach(function (i) {
        var v = (row[2] >> i) & 1, btn = el('button', { type: 'button', class: 'f-bit ' + (v ? 'on' : 'off'), 'data-fk': row[1] + i, dataset: { k: row[1], i: String(i) }, 'aria-pressed': v ? 'true' : 'false', 'aria-label': t('bit_aria', { v: row[0], p: 1 << i, x: v }), text: String(v) });
        var d = cell('f-btn'); d.appendChild(btn);
      });
      cell('f-dec', '= ' + row[2], { id: 'four-' + row[1] });
    });
    /* rule line + answer */
    var rule = el('div', { class: 'f-rule' }); grid.appendChild(rule);
    cell('f-lbl f-big', 'S');
    cell('f-sum f-c4 ' + (c[4] ? 'on' : 'off'), String(c[4]), { id: 'four-c4' });
    [3, 2, 1, 0].forEach(function (i) { cell('f-sum ' + (s[i] ? 'on' : 'off'), String(s[i]), { 'data-s': String(i) }); });
    cell('f-dec f-total', '= ' + total, { id: 'four-total' });
    $('#four-read').textContent = a + ' + ' + b + ' = ' + total;
    $('#four-bin').textContent = iso(bin(a, 4) + ' + ' + bin(b, 4) + ' = ' + bin(total, 5));
    $('#four-c4note').hidden = !c[4];
  }
  function bin(n, w) { var s = n.toString(2); while (s.length < w) s = '0' + s; return s; }
  onActivate($('#four-grid'), 'button[data-k]', function (n) {
    var k = n.dataset.k, i = +n.dataset.i;
    keepFocus(function () { st[k] = st[k] ^ (1 << i); save(); renderFour(); });
  });

  /* =========================================================== practice */
  var P = { q: null, ans: [], checked: false, shown: false, scored: false, picked: null };
  function makeQuestion(level, mode) {
    var r = Math.random();
    if (mode === 'name') {
      var opts = level === 'easy' ? ['and', 'or', 'nand', 'nor'] : ['and', 'or', 'nand', 'nor', 'xor', 'xnor'];
      return { kind: 'gate', gate: EDU.pick(opts), n: level === 'hard' ? 3 : 2 };
    }
    if (level === 'easy') { var g = EDU.pick(GATES); return { kind: 'gate', gate: g, n: g === 'not' ? 1 : 2 }; }
    if (level === 'medium' && r < 0.35) return { kind: 'gate', gate: EDU.pick(['and', 'or', 'nand', 'nor', 'xor', 'xnor']), n: 3 };
    return { kind: 'expr', src: EDU.pick(POOL[level === 'hard' ? 'hard' : 'medium']) };
  }
  function qKey(q) { return q.kind === 'gate' ? q.gate + q.n : q.src; }
  function prepare(q) {
    q.ast = q.kind === 'gate' ? L.gateAst(q.gate, q.n) : L.parse(q.src);
    q.vars = q.kind === 'gate' ? L.VARS.slice(0, q.n) : L.vars(q.ast);
    q.answer = L.column(q.ast, q.vars);
    return q;
  }
  function newQuestion() {
    var q, prev = P.q ? qKey(P.q) : '', tries = 0;
    do { q = makeQuestion(st.level, st.pmode); tries++; } while (qKey(q) === prev && tries < 20);
    P.q = prepare(q);
    P.ans = q.answer.map(function () { return null; });
    P.checked = false; P.shown = false; P.scored = false; P.picked = null;
    FB = { key: '', vars: null, cls: '' };
    renderPractice();
  }
  function scoreUp(right) {
    if (P.scored) return;
    P.scored = true;
    score.n++;
    if (right) { score.c++; score.streak++; score.best = Math.max(score.best, score.streak); } else score.streak = 0;
    saveScore();
  }
  function renderScore() {
    $('#sc-score').textContent = t('score') + ': ' + score.c + ' / ' + score.n;
    $('#sc-streak').textContent = '🔥 ' + t('streak') + ': ' + score.streak;
    $('#sc-best').textContent = '★ ' + t('best') + ': ' + score.best;
  }
  function qTitle(q) {
    var box = el('div', { class: 'q-title' });
    if (q.kind === 'gate') {
      var sym = el('div', { class: 'q-sym' }); sym.innerHTML = D.symbol(q.gate, q.n);
      box.appendChild(sym);
      if (st.pmode === 'fill') box.appendChild(el('div', { class: 'q-name', text: t('gate_name', { g: NAME[q.gate] }) + ' · ' + nInputs(q.n) }));
    } else {
      var ex = el('div', { class: 'expr-big', dir: 'ltr' }); ex.innerHTML = 'Y = ' + L.html(q.ast);
      box.appendChild(ex);
    }
    return box;
  }
  function renderPractice() {
    $$('#pmode-seg button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.m === st.pmode ? 'true' : 'false'); });
    $$('#level-seg button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.l === st.level ? 'true' : 'false'); });
    renderScore();
    var q = P.q, box = $('#q-box');
    if (!q) return;
    box.innerHTML = '';
    if (st.pmode === 'fill') {
      box.appendChild(el('p', { class: 'q-ask', text: t('fill_q') }));
      box.appendChild(qTitle(q));
      var head = el('tr', null, q.vars.map(function (v) { return el('th', { class: 'in', text: v }); }), el('th', { class: 'o', text: 'Y' }));
      var tb = el('tbody');
      q.answer.forEach(function (right, i) {
        var e = L.env(q.vars, i), v = P.ans[i];
        var cls = 'cell-btn';
        if (P.checked && v !== null) cls += v === right ? ' ok' : ' bad';
        if (P.shown) cls += ' shown';
        var btn = el('button', { type: 'button', class: cls, 'data-fk': 'pc-' + i, dataset: { i: String(i) }, 'aria-label': t('cell_aria', { n: i + 1, x: v === null ? '?' : v }), text: v === null ? '?' : String(v) });
        tb.appendChild(el('tr', null, q.vars.map(function (vv) { return el('td', { class: 'in ' + (e[vv] ? 'one' : 'zero'), text: String(e[vv]) }); }), el('td', { class: 'o' }, btn)));
      });
      var table = el('table', { class: 'table tt q-tt', dir: 'ltr', id: 'q-table' }, el('thead', null, head), tb);
      box.appendChild(el('div', { class: 'scroll-x tt-wrap', dir: 'ltr' }, table));
      box.appendChild(el('p', { class: 'muted small', text: t('tap_cells') }));
      box.appendChild(el('div', { class: 'row' },
        el('button', { type: 'button', class: 'btn btn-primary', id: 'q-check', i18n: 'check', disabled: P.shown ? true : null, onclick: checkFill }),
        el('button', { type: 'button', class: 'btn', id: 'q-show', i18n: 'show_answer', disabled: P.shown ? true : null, onclick: showAnswer }),
        el('button', { type: 'button', class: 'btn btn-accent', id: 'q-new', i18n: 'new_question', onclick: function () { newQuestion(); $('#q-new').focus(); } })));
      onActivate(table, 'button[data-i]', function (n) {
        if (P.shown) return;
        var i = +n.dataset.i, v = P.ans[i];
        P.ans[i] = v === null ? 0 : v === 0 ? 1 : 0;
        P.checked = false;
        keepFocus(renderPractice);
      });
    } else {
      box.appendChild(el('p', { class: 'q-ask', text: t('name_q') }));
      box.appendChild(el('div', { class: 'scroll-x tt-wrap', dir: 'ltr' }, ttTable(q.vars, [{ head: 'Y', vals: q.answer, out: true }])));
      var opts = q.n === 3 || st.level !== 'easy' ? ['and', 'or', 'nand', 'nor', 'xor', 'xnor'] : ['and', 'or', 'nand', 'nor'];
      var row = el('div', { class: 'row name-opts', role: 'group', 'aria-label': t('name_q') });
      opts.forEach(function (g) {
        var cls = 'btn btn-lg name-opt';
        if (P.picked) { if (g === q.gate) cls += ' ok'; else if (g === P.picked) cls += ' bad'; }
        row.appendChild(el('button', { type: 'button', class: cls, 'data-fk': 'po-' + g, dataset: { g: g }, disabled: P.picked ? true : null, text: NAME[g], onclick: function () { pickGate(g); } }));
      });
      box.appendChild(row);
      box.appendChild(el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn btn-accent', id: 'q-new', i18n: P.picked ? 'next' : 'new_question', onclick: function () { newQuestion(); $('#q-new').focus(); } })));
    }
    renderFeedback();
  }
  var FB = { key: '', vars: null, cls: '' };
  function setFeedback(key, vars, cls) { FB = { key: key, vars: vars, cls: cls }; renderFeedback(); }
  function renderFeedback() {
    var f = $('#q-fb');
    if (!FB.key) { f.hidden = true; f.textContent = ''; return; }
    f.hidden = false;
    f.className = 'callout ' + FB.cls;
    f.textContent = t(FB.key, FB.vars);
  }
  function checkFill() {
    if (P.ans.some(function (v) { return v === null; })) { setFeedback('fill_all', null, 'warning'); return; }
    var right = 0;
    P.ans.forEach(function (v, i) { if (v === P.q.answer[i]) right++; });
    var all = right === P.ans.length;
    scoreUp(all);
    P.checked = true;
    renderPractice();
    if (all) setFeedback('all_right', { n: right }, 'success');
    else setFeedback('some_wrong', { k: right, n: P.ans.length }, 'danger');
  }
  function showAnswer() {
    scoreUp(false);
    P.ans = P.q.answer.slice();
    P.shown = true; P.checked = false;
    renderPractice();
    setFeedback('answer_shown', null, '');
  }
  function pickGate(g) {
    if (P.picked) return;
    P.picked = g;
    var right = g === P.q.gate;
    scoreUp(right);
    renderPractice();
    setFeedback(right ? 'name_right' : 'name_wrong', { g: NAME[P.q.gate] }, right ? 'success' : 'danger');
    var nx = $('#q-new'); if (nx) nx.focus();
  }
  $$('#pmode-seg button').forEach(function (b) { b.addEventListener('click', function () { st.pmode = b.dataset.m; save(); newQuestion(); }); });
  $$('#level-seg button').forEach(function (b) { b.addEventListener('click', function () { st.level = b.dataset.l; save(); newQuestion(); }); });

  /* ----- printable worksheet with answer key ----- */
  function buildWorksheet() {
    var ws = $('#worksheet'), qs = [], keys = {}, tries = 0;
    while (qs.length < 8 && tries < 200) {
      tries++;
      var lv = st.level === 'easy' ? (qs.length < 6 ? 'easy' : 'medium') : st.level === 'medium' ? (qs.length < 6 ? 'medium' : 'hard') : (qs.length < 2 ? 'medium' : 'hard');
      var q = makeQuestion(lv, 'fill');
      if (keys[qKey(q)]) continue;
      keys[qKey(q)] = 1;
      qs.push(prepare(q));
    }
    ws.innerHTML = '';
    ws.appendChild(el('div', { class: 'ws-head' },
      el('h2', { class: 'ws-h', text: t('ws_title') }),
      el('div', { class: 'ws-sub muted', text: t('app_title') + ' · ' + t('brand') })));
    ws.appendChild(el('div', { class: 'ws-meta' },
      [t('ws_name'), t('ws_class'), t('ws_date')].map(function (x) { return el('span', null, x + ': ', el('span', { class: 'ws-line' })); })));
    ws.appendChild(el('p', { text: t('ws_intro') }));
    var grid = el('div', { class: 'ws-grid' });
    qs.forEach(function (q, k) {
      var cardEl = el('div', { class: 'ws-q' });
      var title = el('div', { class: 'ws-qt' }, el('strong', { text: (k + 1) + '. ' }));
      if (q.kind === 'gate') { title.appendChild(document.createTextNode(t('gate_name', { g: NAME[q.gate] }) + ' · ' + nInputs(q.n))); }
      else { var sp = el('span', { class: 'expr-ws', dir: 'ltr' }); sp.innerHTML = 'Y = ' + L.html(q.ast); title.appendChild(sp); }
      cardEl.appendChild(title);
      if (q.kind === 'gate') { var sym = el('div', { class: 'ws-sym' }); sym.innerHTML = D.symbol(q.gate, q.n); cardEl.appendChild(sym); }
      var head = el('tr', null, q.vars.map(function (v) { return el('th', { text: v }); }), el('th', { text: 'Y' }));
      var tb = el('tbody');
      q.answer.forEach(function (_, i) { var e = L.env(q.vars, i); tb.appendChild(el('tr', null, q.vars.map(function (v) { return el('td', { text: String(e[v]) }); }), el('td', { class: 'blank' }))); });
      cardEl.appendChild(el('table', { class: 'ws-tt', dir: 'ltr' }, el('thead', null, head), tb));
      grid.appendChild(cardEl);
    });
    ws.appendChild(grid);
    var key = el('div', { class: 'ws-key' }, el('h3', { text: t('answer_key') }));
    var ol = el('div', { class: 'ws-keylist', dir: 'ltr' });
    qs.forEach(function (q, k) { ol.appendChild(el('div', { text: (k + 1) + '.  Y = ' + q.answer.join(' ') })); });
    key.appendChild(ol);
    ws.appendChild(key);
  }
  $('#ws-print').addEventListener('click', function () {
    buildWorksheet();
    document.body.classList.add('print-ws');
    var done = function () { document.body.classList.remove('print-ws'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(function () { try { window.print(); } catch (e) { done(); } }, 50);
  });

  /* =========================================================== global */
  $('#btn-fs').addEventListener('click', function () { EDU.fullscreen(); });
  $('#btn-reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    var tab = st.tab;
    st = clone(DEF); st.tab = tab;
    score = { c: 0, n: 0, streak: 0, best: 0 };
    save(); saveScore();
    $('#expr-in').value = st.expr; $('#eq1').value = st.eq1; $('#eq2').value = st.eq2; $('#steps-on').checked = st.steps;
    renderAll();
    newQuestion();
  });
  /* keyboard: A, B, C, D, E flip inputs on the visible tab */
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var tg = e.target, tag = tg && tg.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (tg && tg.isContentEditable)) return;
    var k = String(e.key || '').toUpperCase();
    if (k.length !== 1 || 'ABCDE'.indexOf(k) < 0) return;
    /* only swallow the key when it really flips an input on the visible tab */
    if (st.tab === 'gates') {
      var gi = 'ABC'.indexOf(k);
      if (gi < 0 || gi >= (st.gate === 'not' ? 1 : st.nIn)) return;
      toggleGateInput(gi);
    } else if (st.tab === 'expr') {
      if (!X.ast || X.vars.indexOf(k) < 0) return;
      toggleVar(k);
    } else if (st.tab === 'adders') {
      if (!(st.adder === 'half' ? 'AB' : st.adder === 'full' ? 'ABC' : '').match(k)) return;
      flipAdder(k.toLowerCase());
    } else return;
    e.preventDefault();
  });

  function renderAll() {
    buildGateChips();
    renderGates();
    renderExpr();
    buildLaws();
    renderEq();
    renderAdders();
    renderPractice();
    showTab(st.tab);
  }
  EDU.onLang(function () { keepFocus(renderAll); });
  renderAll();
})();
