/* Scientific Calculator: keypad, display, memory, history, tabs. Maths lives in calc.js (window.SCALC). */
(function () {
  'use strict';
  var SLUG = 'scientific-calculator';
  var S = window.SCALC;
  var store = EDU.store(SLUG);
  var $ = EDU.$, el = EDU.el, t = EDU.t;

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ------------------------------------------------------------------ state */
  var ANGLES = ['deg', 'rad', 'grad'], NOTES = ['norm', 'sci', 'eng'], GROUPS = ['in', 'intl', 'off'], TABS = ['calc', 'eq', 'stats'];
  function pick(v, list, d) { return list.indexOf(v) >= 0 ? v : d; }
  function numOr(v, d) { return typeof v === 'number' && isFinite(v) ? v : d; }
  var st = {
    angle: pick(store.get('angle', 'deg'), ANGLES, 'deg'),
    note: pick(store.get('note', 'norm'), NOTES, 'norm'),
    group: pick(store.get('group', 'in'), GROUPS, 'in'),
    tab: pick(store.get('tab', 'calc'), TABS, 'calc'),
    ans: numOr(store.get('ans', 0), 0),
    mem: numOr(store.get('mem', 0), 0),
    frac: !!store.get('frac', false),
    dms: !!store.get('dms', false),
    hist: [],
    shift: false, hyp: false,
    done: false,          // the expression on screen has just been worked out with "="
    res: null             // { value } or { err } shown in the big line
  };
  (function () {
    var h = store.get('hist', []);
    if (Array.isArray(h)) st.hist = h.filter(function (x) { return x && typeof x.e === 'string' && typeof x.v === 'number' && isFinite(x.v); }).slice(0, 60);
  })();
  function save() {
    store.set('angle', st.angle); store.set('note', st.note); store.set('group', st.group); store.set('ans', st.ans);
    store.set('mem', st.mem); store.set('frac', st.frac); store.set('dms', st.dms); store.set('expr', inp.value);
  }

  /* ------------------------------------------------------------------ number text */
  function fopt() { return { notation: st.note, group: st.group }; }
  function numText(x) { return S.fmtText(x, fopt()); }
  function numB(x) { var s = numText(x); return x < 0 ? '(' + s + ')' : s; }
  function numHTML(x) {
    var f = S.format(x, fopt());
    var h = (f.neg ? '−' : '') + f.int + (f.frac ? '.' + f.frac : '');
    if (f.exp !== null) h += '<span class="sc-x10">×10<sup>' + (f.exp < 0 ? '−' + (-f.exp) : f.exp) + '</sup></span>';
    return h;
  }
  /* 0.75 → "3/4" when it is a simple fraction, else the decimal */
  function fracText(x) {
    var F = S.toFraction(S.round12(x), 10000);
    if (F && F.d !== 1) return (F.neg ? '−' : '') + F.n + '/' + F.d;
    return numText(x);
  }

  /* ------------------------------------------------------------------ keys */
  /* k: label (html), i: text to insert, sh: with SHIFT, hy: with HYP, hs: SHIFT + HYP, c: class, a: aria key, fn: action */
  var SCI = [
    { id: 'shift', l: 'SHIFT', c: 'modk long', a: 'k_shift', fn: function () { st.shift = !st.shift; paintMods(); } },
    { id: 'hyp', l: 'HYP', c: 'modk long', a: 'k_hyp', fn: function () { st.hyp = !st.hyp; paintMods(); } },
    { id: 'lp', l: '(', i: '(' }, { id: 'rp', l: ')', i: ')' },
    { id: 'sq', l: 'x<sup>2</sup>', i: '²', op: 1, a: 'k_sq' },
    { id: 'pow', l: 'x<sup>y</sup>', i: '^', op: 1, a: 'k_pow' },
    { id: 'sin', l: 'sin', i: 'sin(', sh: 'sin⁻¹(', hy: 'sinh(', hs: 'sinh⁻¹(', c: 'trig h', ls: 'sin<sup>−1</sup>', lh: 'sinh', lhs: 'sinh<sup>−1</sup>' },
    { id: 'cos', l: 'cos', i: 'cos(', sh: 'cos⁻¹(', hy: 'cosh(', hs: 'cosh⁻¹(', c: 'trig h', ls: 'cos<sup>−1</sup>', lh: 'cosh', lhs: 'cosh<sup>−1</sup>' },
    { id: 'tan', l: 'tan', i: 'tan(', sh: 'tan⁻¹(', hy: 'tanh(', hs: 'tanh⁻¹(', c: 'trig h', ls: 'tan<sup>−1</sup>', lh: 'tanh', lhs: 'tanh<sup>−1</sup>' },
    { id: 'sqrt', l: '√', i: '√(', a: 'k_sqrt' },
    { id: 'cbrt', l: '∛', i: '∛(', a: 'k_cbrt' },
    { id: 'yroot', l: '<sup>y</sup>√x', i: 'ˣ√(', op: 1, a: 'k_yroot' },
    { id: 'log', l: 'log', i: 'log(', a: 'k_log' },
    { id: 'ln', l: 'ln', i: 'ln(', a: 'k_ln' },
    { id: 'logb', l: 'log<sub>b</sub>x', i: 'log(', c: 'long', a: 'k_logb', tip: 'tip_logb' },
    { id: 'ex', l: 'e<sup>x</sup>', i: 'e^(', a: 'k_ex' },
    { id: 'tenx', l: '10<sup>x</sup>', i: '10^(', a: 'k_tenx' },
    { id: 'inv', l: '1/x', i: '⁻¹', op: 1, a: 'k_inv' },
    { id: 'pi', l: 'π', i: 'π' }, { id: 'e', l: 'e', i: 'e', a: 'k_e' },
    { id: 'fact', l: 'n!', i: '!', op: 1, a: 'k_fact' },
    { id: 'ncr', l: '<sup>n</sup>C<sub>r</sub>', i: 'C', op: 1, a: 'k_ncr', tip: 'tip_ncr' },
    { id: 'npr', l: '<sup>n</sup>P<sub>r</sub>', i: 'P', op: 1, a: 'k_npr', tip: 'tip_ncr' },
    { id: 'abs', l: '|x|', i: 'abs(', a: 'k_abs' },
    { id: 'cube', l: 'x<sup>3</sup>', i: '³', op: 1, a: 'k_cube' },
    { id: 'pct', l: '%', i: '%', op: 1, a: 'k_pct' },
    { id: 'dms', l: '°′″', fn: dmsKey, a: 'k_dms' },
    { id: 'comma', l: ',', i: ',', a: 'k_comma' },
    { id: 'left', l: '◀', fn: function () { moveCaret(-1); }, a: 'k_left' },
    { id: 'right', l: '▶', fn: function () { moveCaret(1); }, a: 'k_right' }
  ];
  var MEM = [
    { id: 'mc', l: 'MC', c: 'mem', a: 'k_mc', fn: function () { st.mem = 0; save(); paintMem(); note(t('mem_cleared')); } },
    { id: 'mr', l: 'MR', c: 'mem', a: 'k_mr', fn: function () { insert(S.toExpr(st.mem)); } },
    { id: 'mplus', l: 'M+', c: 'mem', a: 'k_mplus', fn: function () { memAdd(1); } },
    { id: 'mminus', l: 'M−', c: 'mem', a: 'k_mminus', fn: function () { memAdd(-1); } }
  ];
  var NUM = [
    { id: '7', l: '7', i: '7', c: 'num' }, { id: '8', l: '8', i: '8', c: 'num' }, { id: '9', l: '9', i: '9', c: 'num' },
    { id: 'del', l: 'DEL', c: 'long', a: 'k_del', fn: backspace }, { id: 'ac', l: 'AC', c: 'ac', a: 'k_ac', fn: clearAll },
    { id: '4', l: '4', i: '4', c: 'num' }, { id: '5', l: '5', i: '5', c: 'num' }, { id: '6', l: '6', i: '6', c: 'num' },
    { id: 'mul', l: '×', i: '×', c: 'op', op: 1, a: 'k_mul' }, { id: 'div', l: '÷', i: '÷', c: 'op', op: 1, a: 'k_div' },
    { id: '1', l: '1', i: '1', c: 'num' }, { id: '2', l: '2', i: '2', c: 'num' }, { id: '3', l: '3', i: '3', c: 'num' },
    { id: 'add', l: '+', i: '+', c: 'op', op: 1, a: 'k_add' }, { id: 'sub', l: '−', i: '−', c: 'op', op: 1, a: 'k_sub' },
    { id: '0', l: '0', i: '0', c: 'num' }, { id: 'dot', l: '.', i: '.', c: 'num', a: 'k_dot' },
    { id: 'exp', l: '×10<sup>n</sup>', i: 'E', c: 'long', op: 1, a: 'k_exp' },
    { id: 'ans', l: 'Ans', i: 'Ans', c: 'long', a: 'k_ans' },
    { id: 'eq', l: '=', c: 'eq', a: 'k_eq', fn: equals }
  ];
  var KEYS = {};
  function build(box, list) {
    list.forEach(function (k) {
      var b = el('button', { type: 'button', class: 'sc-key ' + (k.c || ''), id: 'key-' + k.id, html: k.l });
      if (k.id === 'shift' || k.id === 'hyp') b.setAttribute('aria-pressed', 'false');
      b.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse' || e.pointerType === 'touch' || e.pointerType === 'pen') e.preventDefault(); });
      b.addEventListener('click', function () { press(k); });
      KEYS[k.id] = { def: k, btn: b };
      box.appendChild(b);
    });
  }
  build($('#keys-sci'), SCI); build($('#keys-mem'), MEM); build($('#keys-num'), NUM);

  function press(k) {
    if (k.fn) { k.fn(); return; }
    var s = k.i;
    if (k.sh || k.hy) {
      s = st.shift && st.hyp ? k.hs : st.shift ? k.sh : st.hyp ? k.hy : k.i;
      st.shift = false; st.hyp = false; paintMods();
    } else if (st.shift) { st.shift = false; paintMods(); }
    insert(s, !!k.op);
    if (k.tip) note(t(k.tip));
  }
  function paintMods() {
    KEYS.shift.btn.setAttribute('aria-pressed', String(st.shift));
    KEYS.hyp.btn.setAttribute('aria-pressed', String(st.hyp));
    ['sin', 'cos', 'tan'].forEach(function (id) {
      var k = KEYS[id].def;
      KEYS[id].btn.innerHTML = st.shift && st.hyp ? k.lhs : st.shift ? k.ls : st.hyp ? k.lh : k.l;
    });
    $('#keys-sci').classList.toggle('shift', st.shift);
  }
  function keyLabels() {
    Object.keys(KEYS).forEach(function (id) {
      var k = KEYS[id].def;
      if (k.a) { KEYS[id].btn.setAttribute('aria-label', t(k.a)); KEYS[id].btn.title = t(k.a); }
    });
  }

  /* ------------------------------------------------------------------ the expression line */
  var inp = $('#expr');
  inp.value = typeof store.get('expr', '') === 'string' ? store.get('expr', '').slice(0, 400) : '';
  var caretKnown = false;
  ['focus', 'click', 'keyup', 'select'].forEach(function (ev) { inp.addEventListener(ev, function () { caretKnown = true; }); });
  function caret() {
    if (!caretKnown) return [inp.value.length, inp.value.length];
    return [inp.selectionStart == null ? inp.value.length : inp.selectionStart, inp.selectionEnd == null ? inp.value.length : inp.selectionEnd];
  }
  function setValue(v, pos) {
    inp.value = v;
    var p = pos === undefined ? v.length : pos;
    try { inp.setSelectionRange(p, p); } catch (e) { }
    caretKnown = document.activeElement === inp;
    if (!caretKnown && pos !== undefined) caretKnown = true;
    changed();
  }
  /* op = the key continues the last answer (+, ×, ², !, …) */
  function insert(s, op) {
    if (st.done) {
      st.done = false;
      if (op) setValue('Ans' + s);
      else setValue(s);
      return;
    }
    var c = caret(), v = inp.value;
    setValue(v.slice(0, c[0]) + s + v.slice(c[1]), c[0] + s.length);
  }
  function backspace() {
    if (st.done) { st.done = false; changed(); return; }
    var c = caret(), v = inp.value;
    if (c[0] !== c[1]) { setValue(v.slice(0, c[0]) + v.slice(c[1]), c[0]); return; }
    if (c[0] === 0) return;
    /* delete a whole function name like "sin⁻¹(" or "Ans" in one go */
    var before = v.slice(0, c[0]);
    var m = /(sinh⁻¹\(|cosh⁻¹\(|tanh⁻¹\(|sin⁻¹\(|cos⁻¹\(|tan⁻¹\(|sinh\(|cosh\(|tanh\(|sin\(|cos\(|tan\(|log\(|ln\(|abs\(|√\(|∛\(|ˣ√\(|e\^\(|10\^\(|Ans)$/.exec(before);
    var n = m ? m[0].length : 1;
    setValue(v.slice(0, c[0] - n) + v.slice(c[0]), c[0] - n);
  }
  function clearAll() {
    st.done = false; st.res = null; st.shift = false; st.hyp = false; paintMods();
    setValue('');
    note('');
  }
  function moveCaret(d) {
    var c = caret(), p = Math.max(0, Math.min(inp.value.length, (d < 0 ? c[0] : c[1]) + d));
    st.done = false;
    try { inp.setSelectionRange(p, p); } catch (e) { }
    caretKnown = true;
  }
  /* 12°30′15″: the key adds °, then ′, then ″ to the number being typed */
  function dmsKey() {
    var c = caret(), before = st.done ? '' : inp.value.slice(0, c[0]);
    var m = /([\d.]+°)?([\d.]+′)?[\d.]*$/.exec(before), sym = '°';
    if (m && m[2] && /\d$/.test(before)) sym = '″';
    else if (m && m[1] && /\d$/.test(before)) sym = '′';
    insert(sym, true);
    note(t('tip_dms'));
  }
  function memAdd(sign) {
    var v = currentValue();
    if (v === null) { note(t('mem_nothing')); return; }
    st.mem = S.addR(st.mem, sign * v); save(); paintMem();
    note(t(sign > 0 ? 'mem_added' : 'mem_sub', { n: numText(v) }));
  }
  /* the number M+ would use: the answer just shown, or the value of what is typed */
  function currentValue() {
    if (st.done && st.res && st.res.value !== undefined) return st.res.value;
    var r = S.evaluate(inp.value, ctx());
    return r.ok ? r.value : null;
  }
  function ctx() { return { angle: st.angle, ans: st.ans, mem: st.mem }; }

  /* ------------------------------------------------------------------ display */
  var resEl = $('#result'), prevEl = $('#preview'), noteEl = $('#disp-note');
  var noteMsg = '';
  function note(msg) { noteMsg = msg || ''; noteEl.textContent = noteMsg; }
  function sizeOf(len) { return len > 22 ? 'xs' : len > 17 ? 's' : len > 13 ? 'm' : ''; }

  function changed() {
    store.set('expr', inp.value);
    if (!st.done) {
      st.res = null;
      resEl.textContent = ''; resEl.className = 'sc-result'; resEl.removeAttribute('data-value'); resEl.removeAttribute('data-code');
      var v = inp.value.trim(), r = v ? S.evaluate(v, ctx()) : null;
      if (r && r.ok && !/^[−-]?[\d.]+$/.test(v)) { prevEl.innerHTML = '= ' + numHTML(r.value); prevEl.setAttribute('data-size', sizeOf(prevEl.textContent.length)); }
      else prevEl.textContent = '';
      if (/\de|e\d/.test(v) && !/E/.test(v)) note(t('tip_small_e'));
      else if (noteMsg === t('tip_small_e')) note('');
    }
  }
  function errText(r) {
    var map = {
      div0: 'err_div0', big: 'err_big', empty: 'err_empty', args: 'err_args',
      domain: { sqrt: 'err_sqrt', log: 'err_log', logbase: 'err_logbase', trig: 'err_trig', asin: 'err_asin', asec: 'err_asec', acosh: 'err_domain',
        atanh: 'err_domain', fact: 'err_fact', ncr: 'err_ncr', root: 'err_root', root0: 'err_domain', int: 'err_int', pow: 'err_pow', range: 'err_domain' },
      syntax: { unknown: 'err_unknown', end: 'err_end', paren: 'err_paren', comma: 'err_comma', emptyparen: 'err_emptyparen', fnarg: 'err_end',
        twonum: 'err_twonum', equals: 'err_equals', exp: 'err_exp', number: 'err_number', noinv: 'err_syntax', start: 'err_start', long: 'err_long' }
    };
    var k = map[r.code];
    if (typeof k === 'object') k = k[r.why] || (r.code === 'domain' ? 'err_domain' : 'err_syntax');
    return { kind: t(r.code === 'div0' ? 'errk_math' : r.code === 'domain' ? 'errk_math' : r.code === 'big' ? 'errk_math' : 'errk_syntax'), msg: t(k || 'err_syntax', { tok: r.tok, f: r.why }) };
  }

  function equals() {
    st.shift = false; st.hyp = false; paintMods();
    var src = inp.value;
    if (st.done) return;                       // already worked out
    if (!src.trim()) { if (st.res === null) showValue(st.ans, true); return; }
    var c = ctx(); c.usedAngle = false;
    var r = S.evaluate(src, c);
    st.done = true;
    prevEl.textContent = '';
    if (!r.ok) {
      st.res = { err: r };
      paintResult();
      return;
    }
    var v = r.value;
    if (r.autoClosed) inp.value = r.closed;
    st.ans = v; st.res = { value: v, used: c.usedAngle };
    var item = { e: inp.value.trim(), v: v };
    if (c.usedAngle) item.a = st.angle;
    var top = st.hist[0];
    if (!top || top.e !== item.e || top.v !== item.v) { st.hist.unshift(item); st.hist = st.hist.slice(0, 60); store.set('hist', st.hist); }
    save();
    paintResult();
    paintHist();
    note(r.autoClosed ? t('auto_closed', { n: r.autoClosed }) : c.usedAngle ? t('angle_used', { u: t('ang_' + st.angle) }) : '');
  }
  function showValue(v) { st.res = { value: v }; st.done = true; paintResult(); }

  function paintResult() {
    resEl.className = 'sc-result'; resEl.removeAttribute('data-code'); resEl.removeAttribute('data-value');
    var R = st.res;
    if (!R) { resEl.textContent = ''; return; }
    if (R.err) {
      var E = errText(R.err);
      resEl.className = 'sc-result err';
      resEl.setAttribute('data-code', R.err.code);
      resEl.textContent = '';
      resEl.appendChild(el('span', { class: 'sc-errtag', text: E.kind }));
      resEl.appendChild(document.createTextNode(E.msg));
      return;
    }
    var v = R.value;
    resEl.setAttribute('data-value', S.plain(v));
    var html = numHTML(v), extra = '';
    if (st.dms) {
      var D = S.toDMS(v);
      if (D) {
        var secs = D.s === Math.floor(D.s) ? String(D.s) : D.s.toFixed(2).replace(/0$/, '');
        html = (D.neg ? '−' : '') + D.d + '°' + D.m + '′' + secs + '″';
        extra = t('dms_note');
      }
    } else if (st.frac) {
      var F = S.toFraction(v);
      if (F && F.d !== 1) {
        html = (F.neg ? '−' : '') + '<span class="sc-fr"><span>' + F.n + '</span><span>' + F.d + '</span></span>';
        if (F.n > F.d) {
          var w = Math.floor(F.n / F.d);
          html += ' = ' + (F.neg ? '−' : '') + w + '<span class="sc-fr"><span>' + (F.n - w * F.d) + '</span><span>' + F.d + '</span></span>';
        }
        extra = t('frac_dec', { n: numText(v) });
      } else if (!F) extra = t('frac_none');
    }
    resEl.innerHTML = html;
    resEl.setAttribute('data-size', sizeOf(resEl.textContent.length));
    if (extra) note(extra);
  }

  function paintMem() {
    var f = $('#mem-flag');
    f.hidden = st.mem === 0;
    f.textContent = 'M = ' + numText(st.mem);
    f.title = t('mem_flag');
  }
  function paintModes() {
    var a = $('#angle-btn'), n = $('#note-btn');
    a.textContent = st.angle.toUpperCase();
    a.setAttribute('aria-label', t('angle_aria', { u: t('ang_' + st.angle) }));
    a.title = a.getAttribute('aria-label');
    n.textContent = st.note.toUpperCase();
    n.setAttribute('aria-label', t('note_aria', { u: t('note_' + st.note) }));
    n.title = n.getAttribute('aria-label');
    $('#frac-btn').setAttribute('aria-pressed', String(st.frac));
    $('#dms-btn').setAttribute('aria-pressed', String(st.dms));
    $('#group-sel').value = st.group;
  }
  /* after a setting changes, show the answer again (and work it out again for a new angle unit) */
  function rerender(reEval) {
    if (st.done && st.res && !st.res.err && reEval && st.res.used) {
      var r = S.evaluate(inp.value, ctx());
      if (r.ok) { st.res.value = r.value; st.ans = r.value; save(); }
    }
    if (st.done) paintResult(); else changed();
    paintHist(); paintMem();
  }
  $('#angle-btn').addEventListener('click', function () {
    st.angle = ANGLES[(ANGLES.indexOf(st.angle) + 1) % 3]; save(); paintModes(); rerender(true);
    note(t('angle_now', { u: t('ang_' + st.angle) }));
  });
  $('#note-btn').addEventListener('click', function () {
    st.note = NOTES[(NOTES.indexOf(st.note) + 1) % 3]; save(); paintModes(); rerender();
    note(t('note_' + st.note + '_tip'));
  });
  $('#frac-btn').addEventListener('click', function () { st.frac = !st.frac; if (st.frac) st.dms = false; save(); paintModes(); note(''); rerender(); });
  $('#dms-btn').addEventListener('click', function () { st.dms = !st.dms; if (st.dms) st.frac = false; save(); paintModes(); note(''); rerender(); });
  $('#group-sel').addEventListener('change', function () { st.group = pick(this.value, GROUPS, 'in'); save(); rerender(); });
  $('#copy-btn').addEventListener('click', function () {
    var v = st.res && st.res.value !== undefined ? st.res.value : currentValue();
    if (v === null || v === undefined) { note(t('mem_nothing')); return; }
    EDU.copy(S.plain(v));
  });
  $('#reset-btn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    ['angle', 'note', 'group', 'ans', 'mem', 'frac', 'dms', 'hist', 'expr', 'tab'].forEach(function (k) { store.remove(k); });
    st.angle = 'deg'; st.note = 'norm'; st.group = 'in'; st.ans = 0; st.mem = 0; st.frac = false; st.dms = false; st.hist = [];
    if (tabsApi) tabsApi.reset();
    paintModes(); paintMem(); paintHist(); clearAll();
  });
  $('#fs-btn').addEventListener('click', function () { EDU.fullscreen(); });

  /* ------------------------------------------------------------------ keyboard */
  inp.addEventListener('input', function () { st.done = false; caretKnown = true; changed(); });
  inp.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); equals(); return; }
    if (e.key === 'Escape') { e.preventDefault(); clearAll(); return; }
    if (st.done && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      /* typing after an answer: an operator continues it, anything else starts afresh */
      e.preventDefault();
      typed(e.key);
    } else if (st.done && e.key === 'Backspace') { st.done = false; }
  });
  var OPKEYS = '+-*/^!%×÷−';
  function typed(ch) {
    var map = { '*': '×', '/': '÷', '-': '−' };
    var s = map[ch] || ch;
    insert(s, OPKEYS.indexOf(ch) >= 0);
  }
  /* keys pressed while a keypad button (not the line) has focus still type into the line */
  document.addEventListener('keydown', function (e) {
    if (st.tab !== 'calc' || e.ctrlKey || e.metaKey || e.altKey) return;
    var tg = e.target, tag = tg && tg.tagName;
    if (tg === inp || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (tg && tg.isContentEditable)) return;
    if (tg && tg.closest && !tg.closest('#calc') && tg !== document.body) return;
    if (e.key === 'Enter' && tag === 'BUTTON') return;      // a focused key works with Enter as usual
    if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); equals(); }
    else if (e.key === 'Backspace') { e.preventDefault(); backspace(); }
    else if (e.key === 'Escape' || e.key === 'Delete') { e.preventDefault(); clearAll(); }
    else if (e.key.length === 1 && /[\d.+\-*/^()!%,a-zA-Zπ√]/.test(e.key) && e.key !== ' ') { e.preventDefault(); typed(e.key); }
  });

  /* ------------------------------------------------------------------ history */
  var COPY_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><rect x="8.5" y="8.5" width="11" height="11" rx="2.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.5 5.5v-.3A1.7 1.7 0 0 0 13.8 3.5H5.2A1.7 1.7 0 0 0 3.5 5.2v8.6a1.7 1.7 0 0 0 1.7 1.7h.3" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  var DEL_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
  var TRIES = ['sin(30)', '5!', '10C3', '2^10', '0.1+0.2', '2π×7', '√2^2', 'log(2,8)', '1÷0'];
  function paintHist() {
    var list = $('#hist-list');
    list.textContent = '';
    $('#hist-empty').hidden = st.hist.length > 0;
    $('#hist-clear').hidden = !st.hist.length;
    st.hist.forEach(function (h, i) {
      var li = el('li', { class: 'sc-hitem', 'data-i': String(i) },
        el('button', { type: 'button', class: 'sc-hbtn no-i18n', text: h.e, title: t('hist_use_expr'), 'aria-label': t('hist_use_expr') + ': ' + h.e,
          onclick: function () { st.done = false; setValue(h.e); caretKnown = true; try { inp.focus({ preventScroll: true }); } catch (e) { } } }),
        el('div', { class: 'sc-hrow' },
          h.a ? el('span', { class: 'badge', text: h.a.toUpperCase(), title: t('ang_' + h.a) }) : null,
          el('button', { type: 'button', class: 'sc-hval', html: '= ' + numHTML(h.v), title: t('hist_use_val'), 'aria-label': t('hist_use_val') + ': ' + numText(h.v),
            onclick: function () { insert(S.toExpr(h.v)); } }),
          el('button', { type: 'button', class: 'sc-icon', html: COPY_SVG, title: t('k_copy'), 'aria-label': t('k_copy'), onclick: function () { EDU.copy(S.plain(h.v)); } }),
          el('button', { type: 'button', class: 'sc-icon', html: DEL_SVG, title: t('delete'), 'aria-label': t('delete'),
            onclick: function () { st.hist.splice(i, 1); store.set('hist', st.hist); paintHist(); } })));
      list.appendChild(li);
    });
  }
  (function () {
    var box = $('#tries');
    TRIES.forEach(function (x) {
      box.appendChild(el('button', { type: 'button', class: 'chip no-i18n', text: x, onclick: function () { st.done = false; setValue(x); equals(); } }));
    });
  })();
  $('#hist-clear').addEventListener('click', function () {
    if (!confirm(t('hist_confirm'))) return;
    st.hist = []; store.set('hist', st.hist); paintHist();
  });

  /* ------------------------------------------------------------------ tabs */
  function setTab(name) {
    st.tab = pick(name, TABS, 'calc');
    TABS.forEach(function (n) {
      var on = n === st.tab, b = $('#tab-' + n);
      b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1;
      $('#pane-' + n).hidden = !on;
    });
    store.set('tab', st.tab);
  }
  TABS.forEach(function (n) { $('#tab-' + n).addEventListener('click', function () { setTab(n); }); });
  $('.sc-tabs').addEventListener('keydown', function (e) {
    var i = TABS.indexOf(st.tab), rtl = document.documentElement.dir === 'rtl';
    if (e.key === 'ArrowRight') i += rtl ? -1 : 1;
    else if (e.key === 'ArrowLeft') i += rtl ? 1 : -1;
    else if (e.key === 'Home') i = 0;
    else if (e.key === 'End') i = TABS.length - 1;
    else return;
    e.preventDefault();
    var nx = TABS[(i + TABS.length) % TABS.length];
    setTab(nx); $('#tab-' + nx).focus();
  });

  var tabsApi = window.SC_TABS ? window.SC_TABS.init({ store: store, num: numText, numB: numB, frac: fracText, angle: function () { return st.angle; } }) : null;

  /* ------------------------------------------------------------------ start */
  function renderAll() {
    keyLabels(); paintModes(); paintMem(); paintHist();
    if (st.done) paintResult(); else changed();
    if (noteMsg) note('');
  }
  EDU.onLang(renderAll);
  setTab(st.tab);
  paintMods();
  renderAll();
})();
