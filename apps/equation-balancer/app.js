/* Chemical Equation Balancer: UI (balancer with steps + NCERT Class 10 practice). Chemistry core is in chem.js. */
(function () {
  'use strict';
  var SLUG = 'equation-balancer';
  var CH = window.EB_CHEM;
  var store = EDU.store(SLUG);
  var t = EDU.t, $ = EDU.$, $$ = EDU.$$, esc = EDU.esc;

  EDU.init({ slug: SLUG, title: 'app_title' });

  var LETTERS = 'abcdefghijklmnopqrstuvwxyz';
  var DEFAULT_EQ = 'Fe + H2O -> Fe3O4 + H2';
  var EXAMPLES = [
    'Fe + H2O -> Fe3O4 + H2',
    'H2 + O2 -> H2O',
    'C3H8 + O2 -> CO2 + H2O',
    'Al + O2 -> Al2O3',
    'Ca(OH)2 + H3PO4 -> Ca3(PO4)2 + H2O',
    'CuSO4·5H2O -> CuSO4 + H2O',
    'Cu + HNO3 -> Cu(NO3)2 + NO + H2O',
    'KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2',
    'MnO4^- + Fe^2+ + H^+ -> Mn^2+ + Fe^3+ + H2O',
    'K4[Fe(CN)6] + KMnO4 + H2SO4 -> KHSO4 + Fe2(SO4)3 + MnSO4 + HNO3 + CO2 + H2O'
  ];
  /* 15 reactions from NCERT Science Class 10, Chapter 1 (and Ch. 3) with their smallest whole-number answers */
  var REACTIONS = [
    { eq: 'Mg(s) + O2(g) -> MgO(s)', ans: [2, 1, 2], type: 'combination', also: ['combustion', 'redox'] },
    { eq: 'CaO(s) + H2O(l) -> Ca(OH)2(aq)', ans: [1, 1, 1], type: 'combination', also: [] },
    { eq: 'Al(s) + O2(g) -> Al2O3(s)', ans: [4, 3, 2], type: 'combination', also: ['redox'] },
    { eq: 'CH4(g) + O2(g) -> CO2(g) + H2O(g)', ans: [1, 2, 1, 2], type: 'combustion', also: ['redox'] },
    { eq: 'C4H10(g) + O2(g) -> CO2(g) + H2O(g)', ans: [2, 13, 8, 10], type: 'combustion', also: ['redox'] },
    { eq: 'FeSO4(s) -> Fe2O3(s) + SO2(g) + SO3(g)', ans: [2, 1, 1, 1], type: 'decomposition', also: [], cond: 'heat' },
    { eq: 'Pb(NO3)2(s) -> PbO(s) + NO2(g) + O2(g)', ans: [2, 2, 4, 1], type: 'decomposition', also: [], cond: 'heat' },
    { eq: 'H2O(l) -> H2(g) + O2(g)', ans: [2, 2, 1], type: 'decomposition', also: [], cond: 'elec' },
    { eq: 'AgCl(s) -> Ag(s) + Cl2(g)', ans: [2, 2, 1], type: 'decomposition', also: [], cond: 'sun' },
    { eq: 'Fe(s) + CuSO4(aq) -> FeSO4(aq) + Cu(s)', ans: [1, 1, 1, 1], type: 'displacement', also: ['redox'] },
    { eq: 'Cu(s) + AgNO3(aq) -> Cu(NO3)2(aq) + Ag(s)', ans: [1, 2, 1, 2], type: 'displacement', also: ['redox'] },
    { eq: 'Na2SO4(aq) + BaCl2(aq) -> BaSO4(s) + NaCl(aq)', ans: [1, 1, 1, 2], type: 'double', also: [] },
    { eq: 'Pb(NO3)2(aq) + KI(aq) -> PbI2(s) + KNO3(aq)', ans: [1, 2, 1, 2], type: 'double', also: [] },
    { eq: 'Fe(s) + H2O(g) -> Fe3O4(s) + H2(g)', ans: [3, 4, 1, 4], type: 'redox', also: ['displacement'] },
    { eq: 'MnO2(s) + HCl(aq) -> MnCl2(aq) + H2O(l) + Cl2(g)', ans: [1, 4, 1, 2, 1], type: 'redox', also: [] }
  ];
  var TYPES = ['combination', 'decomposition', 'displacement', 'double', 'combustion', 'redox'];
  REACTIONS.forEach(function (R) { R.parsed = CH.parseEquation(R.eq); });

  function content() { var C = window.APP_CONTENT || {}; return C[EDU.lang] || C.en || { reactions: [] }; }

  /* ---------------- formatting helpers ---------------- */
  function chargeHtml(q) {
    if (!q) return '';
    var a = Math.abs(q);
    return '<sup>' + (a > 1 ? a : '') + (q > 0 ? '+' : '−') + '</sup>';
  }
  function formulaHtml(f) {
    if (f === 'e') return 'e';
    return String(f).split('·').map(function (seg, i) {
      var lead = '', m = /^(\d+)/.exec(seg);
      if (m && i > 0) { lead = m[1]; seg = seg.slice(m[1].length); }
      return (i > 0 ? '·' : '') + lead + esc(seg).replace(/(\d+)/g, '<sub>$1</sub>');
    }).join('');
  }
  function speciesHtml(sp, withState) {
    return '<span class="eb-f">' + formulaHtml(sp.formula) + chargeHtml(sp.charge) + '</span>' +
      (withState && sp.state ? '<span class="eb-st">(' + esc(sp.state) + ')</span>' : '');
  }
  function arrowHtml(cond) {
    return '<span class="eb-arrow">' + (cond ? '<small>' + esc(t('cond_' + cond)) + '</small>' : '') + '<span aria-hidden="true">→</span></span>';
  }
  /* opts: coefs (array) | letters (true) | inputs (true, practice) | blanks (true, worksheet) ; states ; cond */
  function equationHtml(eq, opts) {
    opts = opts || {};
    var sides = [[], []];
    eq.species.forEach(function (sp, j) {
      var pre = '';
      if (opts.letters) pre = '<i class="eb-var">' + LETTERS.charAt(j) + '</i>';
      else if (opts.inputs) {
        var v = (opts.values && opts.values[j]) || '';
        pre = '<input class="eb-coef-in" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" autocomplete="off" data-j="' + j + '" id="pr-in-' + j +
          '" value="' + esc(v) + '" placeholder="1" aria-label="' + esc(t('coef_aria', { f: CH.speciesText(sp) })) + '">';
      } else if (opts.blanks) pre = '<span class="eb-blank"></span>';
      else if (opts.coefs) { var c = String(opts.coefs[j]); if (c !== '1') pre = '<b class="eb-co">' + esc(c) + '</b>'; }
      sides[sp.side].push('<span class="eb-term">' + pre + speciesHtml(sp, opts.states) + '</span>');
    });
    var plus = '<span class="eb-plus">+</span>';
    return sides[0].join(plus) + arrowHtml(opts.cond) + sides[1].join(plus);
  }
  /* "2b + d", "−a + 2b", "3c" */
  function linExpr(terms) {
    var out = '';
    terms.forEach(function (tm, i) {
      var k = tm.k, a = Math.abs(k);
      var body = (a === 1 ? '' : a) + '<i class="eb-var">' + tm.v + '</i>';
      if (i === 0) out += (k < 0 ? '−' : '') + body;
      else out += (k < 0 ? ' − ' : ' + ') + body;
    });
    return out || '0';
  }
  function rowEquationHtml(row, eq) {
    var L = [], R = [];
    eq.species.forEach(function (sp, j) {
      var per = row.isCharge ? sp.charge : (sp.counts[row.label] || 0);
      if (!per) return;
      (sp.side === 0 ? L : R).push({ k: per, v: LETTERS.charAt(j) });
    });
    return linExpr(L) + ' = ' + linExpr(R);
  }
  function rowLabel(row) { return row.isCharge ? '<span class="eb-qlab">' + esc(t('charge')) + '</span>' : '<span class="eb-sym">' + esc(row.label) + '</span>'; }
  function fracHtml(f) { return f.d === 1 || String(f.d) === '1' ? esc(String(f.n)) : '<span class="eb-frac">' + esc(String(f.n)) + '/' + esc(String(f.d)) + '</span>'; }
  function tHtml(key, varsHtml) {
    return esc(t(key)).replace(/\{(\w+)\}/g, function (m, k) { return varsHtml[k] !== undefined ? varsHtml[k] : m; });
  }
  function signed(q) { return q > 0 ? '+' + q : '−' + Math.abs(q); }
  function partsText(parts, isCharge) {
    return parts.map(function (p) { return p[0] + '×' + (isCharge ? '(' + signed(p[1]) + ')' : p[1]); }).join(' + ');
  }
  function countText(v) { var s = String(v); return s.charAt(0) === '-' ? '−' + s.slice(1) : s; }

  function tallyTable(eq, coefs, id) {
    var rows = CH.tally(eq, coefs);
    var h = '<table class="table eb-atoms" id="' + id + '"><thead><tr><th>' + esc(t('col_element')) + '</th><th>' + esc(t('col_left')) +
      '</th><th>' + esc(t('col_right')) + '</th><th class="eb-okcol">' + esc(t('col_ok')) + '</th></tr></thead><tbody>';
    rows.forEach(function (r) {
      h += '<tr class="' + (r.ok ? 'eb-yes' : 'eb-no') + '" data-el="' + esc(r.isCharge ? 'charge' : r.label) + '" data-ok="' + (r.ok ? 1 : 0) + '" data-l="' + esc(String(r.l)) + '" data-r="' + esc(String(r.r)) + '">' +
        '<th scope="row" class="eb-elcell">' + rowLabel(r) + '</th>' +
        '<td><b class="eb-n">' + esc(countText(r.l)) + '</b><small class="eb-parts" dir="ltr">' + esc(partsText(r.lp, r.isCharge)) + '</small></td>' +
        '<td><b class="eb-n">' + esc(countText(r.r)) + '</b><small class="eb-parts" dir="ltr">' + esc(partsText(r.rp, r.isCharge)) + '</small></td>' +
        '<td class="eb-okcol"><span class="eb-mark ' + (r.ok ? 'ok' : 'bad') + '" aria-label="' + esc(r.ok ? t('yes') : t('no')) + '">' + (r.ok ? '✓' : '✗') + '</span></td></tr>';
    });
    return { html: h + '</tbody></table>', rows: rows };
  }

  /* ---------------- tabs ---------------- */
  var tab = store.get('tab', 'balance');
  if (tab !== 'balance' && tab !== 'practice') tab = 'balance';
  function showTab(name) {
    tab = name; store.set('tab', name);
    $$('#tabs [role="tab"]').forEach(function (b) {
      var on = b.dataset.tab === name;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    $('#p-balance').hidden = name !== 'balance';
    $('#p-practice').hidden = name !== 'practice';
  }
  $$('#tabs [role="tab"]').forEach(function (b) {
    b.addEventListener('click', function () { showTab(b.dataset.tab); });
    b.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      var other = b.dataset.tab === 'balance' ? 'practice' : 'balance';
      showTab(other); $('#tab-' + other).focus();
    });
  });
  $('#fs-btn').addEventListener('click', function () { EDU.fullscreen(); });

  /* ================= BALANCER ================= */
  var input = $('#eq-in');
  var last = null;   // { eq, res } | { err, eq }

  function runBalance() {
    var text = input.value;
    store.set('eq', text);
    try {
      var eq = CH.parseEquation(text);
      var res = CH.balance(eq);
      last = res.status === 'error' ? { err: res.err, eq: eq } : { eq: eq, res: res };
    } catch (e) {
      if (!(e instanceof CH.Err)) { console.error(e); e = new CH.Err('err_impossible'); }
      last = { err: e };
    }
    renderResult();
  }

  function errText(err, eq) {
    var vars = {};
    Object.keys(err.vars || {}).forEach(function (k) { vars[k] = err.vars[k]; });
    if (err.idx && eq) vars.f = err.idx.map(function (j) { return CH.speciesText(eq.species[j]); }).join(', ');
    return t(err.key, vars);
  }

  function renderResult() {
    var msg = $('#eq-msg'), out = $('#result');
    msg.textContent = ''; msg.removeAttribute('data-err'); msg.hidden = true;
    if (!last) { out.hidden = true; return; }
    if (last.err) {
      msg.hidden = false;
      msg.textContent = errText(last.err, last.eq);
      msg.setAttribute('data-err', last.err.key);
      out.hidden = true;
      return;
    }
    out.hidden = false;
    var eq = last.eq, res = last.res;
    var coefs = res.coefs.map(String);
    var big = $('#result-eq');
    big.innerHTML = equationHtml(eq, { coefs: coefs, states: true });
    big.setAttribute('data-coefs', coefs.join(','));
    var status = $('#eb-status');
    status.textContent = res.status === 'ok' ? t('status_ok') : t('status_many');
    status.className = 'badge ' + (res.status === 'ok' ? 'success' : 'accent');
    status.setAttribute('data-status', res.status);

    /* the student's own numbers */
    var yours = $('#yours');
    yours.hidden = true; yours.removeAttribute('data-yours');
    if (eq.userCoefs) {
      var uc = eq.species.map(function (sp) { return sp.coef || 1; });
      var tl = CH.tally(eq, uc), ok = tl.every(function (r) { return r.ok; });
      var k = ok && res.status === 'ok' ? CH.multipleOf(uc, res.coefs) : 0;
      var kind, txt;
      if (ok && (res.status !== 'ok' || String(k) === '1')) { kind = 'ok'; txt = t('yours_ok'); }
      else if (ok && k) { kind = 'multiple'; txt = t('yours_multiple', { k: String(k) }); }
      else {
        kind = 'bad';
        txt = t('yours_bad', { list: tl.filter(function (r) { return !r.ok; }).map(function (r) { return r.isCharge ? t('charge') : r.label; }).join(', ') });
      }
      yours.hidden = false;
      yours.className = 'callout ' + (kind === 'ok' ? 'success' : kind === 'multiple' ? 'warning' : 'danger');
      yours.setAttribute('data-yours', kind);
      yours.innerHTML = '<div class="small muted">' + esc(t('yours_label')) + '</div><div class="eb-eq eb-eq-sm no-i18n" dir="ltr">' +
        equationHtml(eq, { coefs: uc.map(String), states: true }) + '</div><div>' + esc(txt) + '</div>';
    }

    var many = $('#many');
    many.hidden = res.status !== 'many';
    if (res.status === 'many') many.textContent = t('many_text');

    var tt = tallyTable(eq, coefs, 'atoms');
    $('#atoms-wrap').innerHTML = tt.html;

    var stepsCard = $('#steps-card');
    stepsCard.hidden = res.status !== 'ok';
    if (res.status === 'ok') $('#steps').innerHTML = stepsHtml(eq, res);
  }

  function stepHtml(n, titleKey, body) {
    return '<div class="eb-step"><div class="eb-step-h"><span class="eb-step-n">' + n + '</span><h3>' + esc(t(titleKey)) + '</h3></div>' + body + '</div>';
  }
  function stepsHtml(eq, res) {
    var h = '';
    /* 1. elements */
    h += stepHtml(1, 's1_title', '<p>' + esc(t('s1_text')) + '</p><div class="eb-els no-i18n" dir="ltr">' +
      eq.elements.map(function (el) { return '<span class="eb-el">' + esc(el) + '</span>'; }).join('') +
      (eq.hasCharge ? '<span class="eb-el eb-el-q">' + esc(t('charge')) + '</span>' : '') + '</div>');
    /* 2. unknowns */
    h += stepHtml(2, 's2_title', '<p>' + esc(t('s2_text')) + '</p><div class="eb-eq eb-eq-md no-i18n" dir="ltr">' + equationHtml(eq, { letters: true }) + '</div>');
    /* 3. one equation per element */
    var eqs = res.rows.map(function (row) {
      return '<div class="eb-mrow"><span class="eb-mlab">' + rowLabel(row) + '</span><span class="eb-math" dir="ltr">' + rowEquationHtml(row, eq) + '</span></div>';
    }).join('');
    h += stepHtml(3, 's3_title', '<p>' + esc(t('s3_text')) + (eq.hasCharge ? ' ' + esc(t('s3_charge')) : '') + '</p><div class="eb-mgrid">' + eqs + '</div>');
    /* 4. solve */
    var free = res.free, vals = res.values, S = res.steps;
    var body = '<p>' + tHtml('s4_let', { eq: '<span class="eb-iso" dir="ltr"><i class="eb-var">' + LETTERS.charAt(free) + '</i> = 1</span>', f: '<span class="eb-f-inline" dir="ltr">' + speciesHtml(eq.species[free]) + '</span>' }) + '</p>';
    body += '<div class="eb-mgrid">' + S.lines.map(function (ln) {
      var row = res.rows[ln.row];
      return '<div class="eb-mrow"><span class="eb-mlab">' + rowLabel(row) + '</span><span class="eb-math" dir="ltr">' + rowEquationHtml(row, eq) +
        ' <span class="eb-then">⇒</span> <i class="eb-var">' + LETTERS.charAt(ln.solve) + '</i> = ' + fracHtml(ln.value) + '</span></div>';
    }).join('') + '</div>';
    if (S.rest.length) {
      body += '<p>' + esc(t('s4_together')) + '</p><div class="eb-vals" dir="ltr">' + S.rest.map(function (j) {
        return '<span><i class="eb-var">' + LETTERS.charAt(j) + '</i> = ' + fracHtml(vals[j]) + '</span>';
      }).join('') + '</div>';
    }
    var finalVals = '<div class="eb-vals eb-final" dir="ltr">' + res.coefs.map(function (c, j) {
      return '<span><i class="eb-var">' + LETTERS.charAt(j) + '</i> = <b>' + esc(String(c)) + '</b></span>';
    }).join('') + '</div>';
    if (String(res.mult) !== '1') body += '<p>' + esc(t('s4_mult', { m: String(res.mult) })) + '</p>' + finalVals;
    else body += '<p>' + esc(t('s4_whole')) + '</p>' + finalVals;
    h += stepHtml(4, 's4_title', body);
    /* 5. check */
    h += stepHtml(5, 's5_title', '<p>' + esc(t('s5_text')) + '</p><div class="eb-eq eb-eq-md no-i18n" dir="ltr">' + equationHtml(eq, { coefs: res.coefs.map(String), states: true }) + '</div>');
    return h;
  }

  /* example chips + quick keys */
  var exBox = $('#examples');
  EXAMPLES.forEach(function (ex) {
    var eq = CH.parseEquation(ex);
    var b = EDU.el('button', { type: 'button', class: 'chip eb-ex', dir: 'ltr', 'data-eq': ex, html: equationHtml(eq, {}) });
    b.addEventListener('click', function () { input.value = ex; runBalance(); $('#result').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
    exBox.appendChild(b);
  });
  var KEYS = [['→', ' → '], ['+', ' + '], ['(', '('], [')', ')'], ['[', '['], [']', ']'], ['·', '·'], ['^', '^'], ['e⁻', 'e-']];
  var keyBox = $('#keys');
  KEYS.forEach(function (k) {
    var b = EDU.el('button', { type: 'button', class: 'btn btn-sm eb-key', dir: 'ltr', text: k[0] });
    b.addEventListener('mousedown', function (e) { e.preventDefault(); });
    b.addEventListener('click', function () {
      var s = input.selectionStart == null ? input.value.length : input.selectionStart;
      var e2 = input.selectionEnd == null ? s : input.selectionEnd;
      input.value = input.value.slice(0, s) + k[1] + input.value.slice(e2);
      var p = s + k[1].length;
      input.focus();
      try { input.setSelectionRange(p, p); } catch (er) { }
    });
    keyBox.appendChild(b);
  });

  $('#balance-btn').addEventListener('click', runBalance);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); runBalance(); } });
  $('#clear-btn').addEventListener('click', function () { input.value = ''; store.set('eq', ''); last = null; renderResult(); input.focus(); });
  $('#copy-btn').addEventListener('click', function () {
    if (last && last.res) EDU.copy(CH.equationText(last.eq, last.res.coefs, true));
  });
  $('#print-btn').addEventListener('click', function () { document.body.classList.remove('eb-printing'); window.print(); });

  /* ================= PRACTICE ================= */
  var prog = store.get('prog', {});
  if (!prog || typeof prog !== 'object') prog = {};
  var pi = EDU.clamp(parseInt(store.get('pi', 0), 10) || 0, 0, REACTIONS.length - 1);
  var pvals = {};      // typed numbers per reaction (this session)
  var pfb = {};        // feedback per reaction: { key, vars, result }
  var ptally = {};     // show tally table per reaction
  var ptype = {};      // type answer per reaction: { pick, ok }
  var phint = {};      // hint level per reaction
  var phinted = {};    // inputs filled by hints: { j: true }

  function P(i) { if (!prog[i]) prog[i] = {}; return prog[i]; }
  function saveProg() { store.set('prog', prog); }
  function solvedCount() { return REACTIONS.filter(function (R, i) { return prog[i] && prog[i].s; }).length; }
  function revealed(i) { return !!((prog[i] && (prog[i].s || prog[i].a)) || ptype[i]); }

  function buildPracticeEq() {
    var R = REACTIONS[pi];
    var box = $('#pr-eq');
    box.innerHTML = equationHtml(R.parsed, { inputs: true, values: pvals[pi] || [], states: true, cond: R.cond });
    $$('.eb-coef-in', box).forEach(function (inp) {
      var j = +inp.dataset.j;
      if (phinted[pi] && phinted[pi][j]) inp.classList.add('eb-hinted');
      inp.addEventListener('input', function () {
        inp.value = inp.value.replace(/[^0-9]/g, '').slice(0, 2);
        if (!pvals[pi]) pvals[pi] = [];
        pvals[pi][j] = inp.value;
        inp.classList.remove('eb-hinted');
        if (phinted[pi]) delete phinted[pi][j];
        if (pfb[pi] || ptally[pi]) { pfb[pi] = null; renderPractice(false); }
      });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); prCheck(); } });
    });
  }

  function renderPractice(rebuild) {
    var R = REACTIONS[pi], total = REACTIONS.length;
    var sel = $('#pr-select');
    sel.innerHTML = '';
    REACTIONS.forEach(function (Rx, i) {
      sel.appendChild(EDU.el('option', { value: String(i), text: (i + 1) + '. ' + CH.equationText(Rx.parsed) + (prog[i] && prog[i].s ? '  ✓' : '') }));
    });
    sel.value = String(pi);
    var sc = solvedCount();
    $('#pr-solved').textContent = t('pr_solved', { n: sc, total: total });
    $('#pr-solved').setAttribute('data-n', String(sc));
    $('#pr-bar').style.width = (100 * sc / total) + '%';
    $('#pr-num').textContent = t('pr_num', { n: pi + 1, total: total });
    $('#pr-desc').textContent = (content().reactions || [])[pi] || '';
    var st = $('#pr-state');
    st.hidden = !(prog[pi] && (prog[pi].s || prog[pi].a));
    st.textContent = prog[pi] && prog[pi].s ? '✓ ' + t('pr_done') : t('pr_shown');
    st.className = 'badge ' + (prog[pi] && prog[pi].s ? 'success' : '');

    if (rebuild) buildPracticeEq();
    else $$('#pr-eq .eb-coef-in').forEach(function (inp) {
      inp.setAttribute('aria-label', t('coef_aria', { f: CH.speciesText(R.parsed.species[+inp.dataset.j]) }));
    });
    var arrowLab = $('#pr-eq .eb-arrow small');
    if (arrowLab && R.cond) arrowLab.textContent = t('cond_' + R.cond);

    var fb = $('#pr-fb'), f = pfb[pi];
    fb.textContent = f ? t(f.key, f.vars) : '';
    fb.className = 'eb-fb' + (f ? ' ' + (f.result === 'ok' ? 'ok' : f.result === 'shown' || f.result === 'hint' ? 'info' : 'bad') : '');
    if (f) fb.setAttribute('data-result', f.result); else fb.removeAttribute('data-result');

    var tw = $('#pr-tally');
    if (ptally[pi]) { tw.hidden = false; tw.innerHTML = tallyTable(R.parsed, readLenient(), 'pr-atoms').html; }
    else { tw.hidden = true; tw.innerHTML = ''; }

    /* reaction type */
    var tb = $('#pr-types');
    tb.innerHTML = '';
    var ta = ptype[pi];
    TYPES.forEach(function (ty) {
      var right = ty === R.type || R.also.indexOf(ty) >= 0;
      var cls = 'chip eb-type';
      if (ta && ta.pick === ty) cls += ta.ok ? ' eb-type-ok' : ' eb-type-bad';
      else if (ta && !ta.ok && ty === R.type) cls += ' eb-type-ok';
      var b = EDU.el('button', { type: 'button', class: cls, 'data-type': ty, 'aria-pressed': ta && ta.pick === ty ? 'true' : 'false', text: t('t_' + ty) });
      b.addEventListener('click', function () {
        ptype[pi] = { pick: ty, ok: right };
        renderPractice(false);
      });
      tb.appendChild(b);
    });
    var tfb = $('#pr-type-fb');
    if (ta) { tfb.textContent = ta.ok ? t('type_ok') : t('type_bad'); tfb.className = 'eb-fb ' + (ta.ok ? 'ok' : 'bad'); tfb.setAttribute('data-result', ta.ok ? 'ok' : 'bad'); }
    else { tfb.textContent = ''; tfb.className = 'eb-fb'; tfb.removeAttribute('data-result'); }

    var info = $('#pr-type-info');
    if (revealed(pi)) {
      info.hidden = false;
      info.innerHTML = '<div class="row eb-tybadges"><span class="small muted">' + esc(t('type_label')) + ':</span><span class="badge accent eb-tyb">' + esc(t('t_' + R.type)) + '</span>' +
        (R.also.length ? '<span class="small muted">' + esc(t('also')) + ':</span>' + R.also.map(function (a) { return '<span class="badge">' + esc(t('t_' + a)) + '</span>'; }).join('') : '') +
        '</div><p class="mb0">' + esc(t('x_' + R.type)) + '</p>';
      info.setAttribute('data-type', R.type);
    } else { info.hidden = true; info.innerHTML = ''; info.removeAttribute('data-type'); }
  }

  /* typed numbers: null if any box is invalid; empty = 1 */
  function readStrict() {
    var R = REACTIONS[pi], out = [];
    var inputs = $$('#pr-eq .eb-coef-in');
    for (var j = 0; j < R.parsed.species.length; j++) {
      var v = (inputs[j] && inputs[j].value || '').trim();
      if (v === '') { out.push(1); continue; }
      if (!/^\d+$/.test(v)) return null;
      var n = parseInt(v, 10);
      if (n < 1 || n > 99) return null;
      out.push(n);
    }
    return out;
  }
  function readLenient() {
    var R = REACTIONS[pi];
    var vals = (pvals[pi] || []);
    return R.parsed.species.map(function (sp, j) { var n = parseInt(vals[j], 10); return n >= 1 && n <= 99 ? n : 1; });
  }

  function prCheck() {
    var R = REACTIONS[pi];
    var vals = readStrict();
    if (!vals) { pfb[pi] = { key: 'fb_invalid', result: 'invalid' }; ptally[pi] = false; renderPractice(false); return; }
    var tl = CH.tally(R.parsed, vals);
    var bal = tl.every(function (r) { return r.ok; });
    if (bal) {
      var k = CH.multipleOf(vals, R.ans);
      if (String(k) === '1') {
        pfb[pi] = { key: 'fb_ok', result: 'ok' };
        var p = P(pi);
        if (!p.s) { p.s = 1; p.h = phint[pi] || 0; saveProg(); }
      } else pfb[pi] = { key: 'fb_multiple', vars: { k: String(k) }, result: 'multiple' };
    } else {
      var bad = tl.filter(function (r) { return !r.ok; }).map(function (r) { return r.label; });
      pfb[pi] = { key: 'fb_bad', vars: { list: bad.join(', ') }, result: 'bad' };
    }
    ptally[pi] = true;
    renderPractice(false);
  }

  function setInput(j, n) {
    if (!pvals[pi]) pvals[pi] = [];
    pvals[pi][j] = String(n);
    if (!phinted[pi]) phinted[pi] = {};
    phinted[pi][j] = true;
  }

  function prHint() {
    var R = REACTIONS[pi], eq = R.parsed;
    var vals = readLenient();
    var tl = CH.tally(eq, vals);
    var bad = tl.filter(function (r) { return !r.ok; });
    var level = phint[pi] = (phint[pi] || 0) + 1;
    var p = P(pi); p.hu = (p.hu || 0) + 1; saveProg();
    var wrongJ = [];
    vals.forEach(function (v, j) { if (v !== R.ans[j]) wrongJ.push(j); });
    if (!wrongJ.length) { pfb[pi] = { key: 'hint_done', result: 'hint' }; renderPractice(false); return; }
    if (bad.length && level % 2 === 1) {
      var r = bad[0];
      var list = eq.species.filter(function (sp) { return sp.counts[r.label]; }).map(function (sp) { return CH.speciesText(sp); });
      pfb[pi] = { key: 'hint_atoms', vars: { e: r.label, l: String(r.l), r: String(r.r), list: list.join(', ') }, result: 'hint', el: r.label };
    } else {
      /* reveal one number: the biggest formula that is still wrong */
      var j = wrongJ.reduce(function (best, x) { return eq.species[x].atoms > eq.species[best].atoms ? x : best; }, wrongJ[0]);
      setInput(j, R.ans[j]);
      pfb[pi] = { key: 'hint_reveal', vars: { f: CH.speciesText(eq.species[j]), n: String(R.ans[j]) }, result: 'hint' };
      renderPractice(true);
      return;
    }
    renderPractice(false);
  }

  function prShow() {
    var R = REACTIONS[pi];
    pvals[pi] = R.ans.map(String);
    phinted[pi] = {};
    var p = P(pi);
    if (!p.s) { p.a = 1; saveProg(); }
    pfb[pi] = { key: 'fb_shown', result: 'shown' };
    ptally[pi] = true;
    renderPractice(true);
  }

  function goTo(i) {
    pi = (i + REACTIONS.length) % REACTIONS.length;
    store.set('pi', pi);
    renderPractice(true);
  }

  $('#pr-select').addEventListener('change', function () { goTo(parseInt(this.value, 10) || 0); });
  $('#pr-prev').addEventListener('click', function () { goTo(pi - 1); });
  $('#pr-next').addEventListener('click', function () { goTo(pi + 1); });
  $('#pr-next2').addEventListener('click', function () { goTo(pi + 1); $('#pr-card').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  $('#pr-check').addEventListener('click', prCheck);
  $('#pr-hint').addEventListener('click', prHint);
  $('#pr-show').addEventListener('click', prShow);
  $('#pr-reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    prog = {}; pvals = {}; pfb = {}; ptally = {}; ptype = {}; phint = {}; phinted = {};
    saveProg();
    goTo(0);
  });

  /* worksheet */
  function worksheetHtml() {
    var R = REACTIONS;
    var h = '<div class="eb-ws"><div class="eb-ws-head"><h1>' + esc(t('ws_title')) + '</h1><p class="eb-ws-meta">' +
      esc(t('ws_name')) + ': <span class="eb-line long"></span> ' + esc(t('ws_class')) + ': <span class="eb-line"></span> ' +
      esc(t('ws_date')) + ': <span class="eb-line"></span></p><p>' + esc(t('ws_instr')) + '</p><p class="small">' + esc(t('states_note')) + '</p></div><ol class="eb-ws-list">';
    R.forEach(function (Rx) {
      h += '<li><div class="eb-eq eb-eq-ws" dir="ltr">' + equationHtml(Rx.parsed, { blanks: true, states: true, cond: Rx.cond }) + '</div><div class="eb-ws-type">' +
        esc(t('type_label')) + ': <span class="eb-line long"></span></div></li>';
    });
    h += '</ol></div><div class="eb-ws eb-ws-key"><h2>' + esc(t('ws_key')) + '</h2><ol>';
    R.forEach(function (Rx) {
      h += '<li><span class="eb-eq" dir="ltr">' + equationHtml(Rx.parsed, { coefs: Rx.ans.map(String), cond: Rx.cond }) + '</span> — ' + esc(t('t_' + Rx.type)) +
        (Rx.also.length ? ' (' + esc(t('also')) + ': ' + Rx.also.map(function (a) { return esc(t('t_' + a)); }).join(', ') + ')' : '') + '</li>';
    });
    return h + '</ol></div>';
  }
  $('#ws-print').addEventListener('click', function () {
    $('#print-area').innerHTML = worksheetHtml();
    document.body.classList.add('eb-printing');
    window.print();
  });
  window.addEventListener('afterprint', function () { document.body.classList.remove('eb-printing'); });

  /* ---------------- start ---------------- */
  function renderAll() {
    renderResult();
    renderPractice(true);
    $$('#keys .eb-key').forEach(function (b) { b.title = t('keys_aria'); });
  }
  input.value = store.get('eq', DEFAULT_EQ);
  if (typeof input.value !== 'string') input.value = DEFAULT_EQ;
  showTab(tab);
  if (input.value.trim()) runBalance(); else renderResult();
  renderPractice(true);
  $$('#keys .eb-key').forEach(function (b) { b.title = t('keys_aria'); });
  EDU.onLang(renderAll);
})();
