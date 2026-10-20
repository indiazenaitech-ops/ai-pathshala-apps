/* Scientific Calculator: the Equations tab (quadratic with NCERT steps, Cramer's rule for 2 and 3 unknowns)
   and the Statistics tab. window.SC_TABS.init(H) is called by app.js after EDU.init.
   H = { store, num(x) → text, numB(x) → text in brackets when negative, frac(x) → "3/4" or decimal text } */
(function () {
  'use strict';
  var S = window.SCALC;
  var $ = EDU.$, el = EDU.el, t = EDU.t;

  var EX = {
    quad: [[1, -5, 6], [2, -7, 3], [1, 2, 5], [1, -4, 4], [1, 0, -2], [3, -5, 2]],
    lin2: [[[2, 3, 13], [1, -1, -1]], [[1, 1, 10], [1, -1, 2]], [[1, 2, 3], [2, 4, 6]], [[1, 2, 3], [2, 4, 7]]],
    lin3: [[[1, 1, 1, 6], [2, -1, 1, 3], [1, 2, -1, 2]], [[2, 1, -1, 8], [-3, -1, 2, -11], [-2, 1, 2, -3]]]
  };
  var VARS = ['x', 'y', 'z'];

  function init(H) {
    var store = H.store;
    var st = store.get('eq', null);
    var E = { type: 'quad', quad: ['1', '-5', '6'], lin2: [['2', '3', '13'], ['1', '-1', '-1']], lin3: [['1', '1', '1', '6'], ['2', '-1', '1', '3'], ['1', '2', '-1', '2']] };
    if (st && typeof st === 'object') {
      if (['quad', 'lin2', 'lin3'].indexOf(st.type) >= 0) E.type = st.type;
      if (Array.isArray(st.quad) && st.quad.length === 3) E.quad = st.quad.map(String);
      if (Array.isArray(st.lin2) && st.lin2.length === 2 && st.lin2.every(function (r) { return Array.isArray(r) && r.length === 3; })) E.lin2 = st.lin2.map(function (r) { return r.map(String); });
      if (Array.isArray(st.lin3) && st.lin3.length === 3 && st.lin3.every(function (r) { return Array.isArray(r) && r.length === 4; })) E.lin3 = st.lin3.map(function (r) { return r.map(String); });
    }
    function save() { store.set('eq', E); }

    var N = H.num, NB = H.numB;
    function sgnTerm(v, first) {           // "+ 3", "− 3" (or "3", "−3" for the first term)
      if (first) return N(v);
      return v < 0 ? '− ' + N(-v) : '+ ' + N(v);
    }
    /* "x² − 5x + 6 = 0" from numbers */
    function polyText(cs, vars) {
      var out = '', any = false;
      for (var i = 0; i < cs.length; i++) {
        var c = cs[i], v = vars[i];
        if (c === 0) continue;
        var mag = Math.abs(c), coef = (mag === 1 && v) ? '' : N(mag);
        var term = coef + v;
        if (!any) out = (c < 0 ? '−' : '') + term;
        else out += (c < 0 ? ' − ' : ' + ') + term;
        any = true;
      }
      return any ? out : '0';
    }

    /* ---------------------------------------------------------- inputs */
    function render() {
      ['quad', 'lin2', 'lin3'].forEach(function (k) { $('#eqt-' + k).setAttribute('aria-pressed', String(E.type === k)); });
      $('#eq-form-hint').textContent = t('form_' + E.type);
      var box = $('#eq-rows'); box.textContent = '';
      if (E.type === 'quad') {
        box.appendChild(row(['a', 'b', 'c'], E.quad, ['x² +', 'x +', '= 0'], function (i, v) { E.quad[i] = v; }));
      } else {
        var n = E.type === 'lin2' ? 2 : 3, rows = E[E.type];
        var labs = n === 2 ? ['x +', 'y =', ''] : ['x +', 'y +', 'z =', ''];
        var names = n === 2 ? ['a', 'b', 'c'] : ['a', 'b', 'c', 'd'];
        rows.forEach(function (r, ri) {
          box.appendChild(row(names.map(function (nm) { return nm + (ri + 1); }), r, labs, function (i, v) { rows[ri][i] = v; }));
        });
      }
      var ex = $('#eq-examples'); ex.textContent = '';
      EX[E.type].forEach(function (sample, i) {
        var txt = E.type === 'quad' ? polyText(sample, ['x²', 'x', '']) + ' = 0'
          : sample.map(function (r) { return polyText(r.slice(0, -1), VARS) + ' = ' + N(r[r.length - 1]); }).join(',  ');
        ex.appendChild(el('button', { type: 'button', class: 'chip', id: 'eqex-' + E.type + '-' + i, text: txt, onclick: function () { load(sample); } }));
      });
      solve();
    }
    function row(names, vals, labs, set) {
      var r = el('div', { class: 'sc-eqrow' });
      names.forEach(function (nm, i) {
        var inp = el('input', { type: 'text', inputmode: 'text', id: 'eq-' + nm, value: vals[i], autocomplete: 'off', spellcheck: 'false', 'aria-label': t('coef_aria', { n: nm }) });
        inp.addEventListener('input', function () { set(i, inp.value); save(); solve(); });
        r.appendChild(inp);
        if (labs[i]) r.appendChild(el('span', { class: 'sc-v', text: labs[i] }));
      });
      return r;
    }
    function load(sample) {
      if (E.type === 'quad') E.quad = sample.map(String);
      else E[E.type] = sample.map(function (r) { return r.map(String); });
      save(); render();
    }
    ['quad', 'lin2', 'lin3'].forEach(function (k) {
      $('#eqt-' + k).addEventListener('click', function () { E.type = k; save(); render(); });
    });
    $('#eq-print').addEventListener('click', function () { window.print(); });

    /* read every box: an empty box is 0, any calculator expression works (1/2, √3, −2.5) */
    function readAll() {
      var bad = null, inputs = EDU.$$('#eq-rows input'), vals = [];
      inputs.forEach(function (inp) {
        var s = inp.value.trim(), v = 0, ok = true;
        if (s) { var r = S.evaluate(s, { angle: H.angle() }); if (r.ok) v = r.value; else ok = false; }
        inp.setAttribute('aria-invalid', String(!ok));
        if (!ok && !bad) bad = inp.getAttribute('aria-label');
        vals.push(v);
      });
      return { vals: vals, bad: bad };
    }

    /* ---------------------------------------------------------- solve */
    function step(label, lines, ansIdx) {
      var li = el('li', null, el('span', { class: 'lbl', text: label }));
      (lines || []).forEach(function (ln, i) { li.appendChild(el('span', { class: 'sc-math' + (i === ansIdx ? ' ans' : ''), text: ln })); });
      return li;
    }
    function rootChip(name, text, sub) {
      return el('span', { class: 'sc-root', 'data-root': name }, name + ' = ' + text, sub ? el('small', { text: '  (' + sub + ')' }) : null);
    }
    function clearOut() { $('#eq-answer').textContent = ''; $('#eq-steps').textContent = ''; $('#eq-verdict').textContent = ''; $('#eq-prev').textContent = ''; }

    function solve() {
      clearOut();
      var R = readAll();
      $('#eq-err').textContent = R.bad ? t('eq_bad', { n: R.bad }) : '';
      if (R.bad) return;
      if (E.type === 'quad') quad(R.vals[0], R.vals[1], R.vals[2]);
      else linear(R.vals);
    }

    function quad(a, b, c) {
      $('#eq-prev').textContent = polyText([a, b, c], ['x²', 'x', '']) + ' = 0';
      var Q = S.solveQuadratic(a, b, c), ans = $('#eq-answer'), steps = $('#eq-steps'), v = $('#eq-verdict');
      steps.appendChild(step(t('st_compare'), ['a = ' + N(a) + ',  b = ' + N(b) + ',  c = ' + N(c)]));
      if (Q.kind === 'all' || Q.kind === 'none') { v.textContent = t(Q.kind === 'all' ? 'q_all' : 'q_none'); return; }
      if (Q.kind === 'linear') {
        v.textContent = t('q_linear');
        ans.appendChild(rootChip('x', H.frac(Q.roots[0])));
        steps.appendChild(step(t('st_linear'), ['x = −c ÷ b = −' + NB(c) + ' ÷ ' + NB(b) + ' = ' + H.frac(Q.roots[0])], 0));
        return;
      }
      if (Q.kind === 'big') { v.textContent = t('err_big'); return; }
      steps.appendChild(step(t('st_disc'), [
        'D = b² − 4ac',
        '= ' + NB(b) + '² − 4 × ' + NB(a) + ' × ' + NB(c),
        '= ' + N(Q.b2) + ' − ' + NB(Q.ac4),
        '= ' + N(Q.D)
      ], 3));
      var nat = Q.kind === 'two' ? 'nat_two' : Q.kind === 'equal' ? 'nat_equal' : 'nat_none';
      steps.appendChild(step(t('st_nature'), [t(nat, { d: N(Q.D) })]));
      v.textContent = t(nat, { d: N(Q.D) });
      var den = '2 × ' + NB(a);
      if (Q.kind === 'two') {
        var ex = Q.exact, s1, s2;
        if (ex && ex.rational) { s1 = fr(ex.r[0]); s2 = fr(ex.r[1]); }
        else if (ex) { s1 = surdText(ex, '+'); s2 = surdText(ex, '−'); }
        steps.appendChild(step(t('st_formula'), [
          'x = (−b ± √D) / 2a',
          '= (' + N(-b) + ' ± √' + N(Q.D) + ') / (' + den + ')',
          '= (' + N(-b) + ' ± ' + N(Q.sqrtD) + ') / ' + N(2 * a)
        ]));
        var l1 = 'x₁ = (' + N(-b) + ' + ' + N(Q.sqrtD) + ') / ' + NB(2 * a) + ' = ' + (s1 && s1 !== N(Q.roots[0]) ? s1 + ' ≈ ' : '') + N(Q.roots[0]);
        var l2 = 'x₂ = (' + N(-b) + ' − ' + N(Q.sqrtD) + ') / ' + NB(2 * a) + ' = ' + (s2 && s2 !== N(Q.roots[1]) ? s2 + ' ≈ ' : '') + N(Q.roots[1]);
        steps.appendChild(step(t('st_roots'), [l1, l2]));
        ans.appendChild(rootChip('x₁', ex && ex.rational ? s1 : N(Q.roots[0]), ex && !ex.rational ? s1 : null));
        ans.appendChild(rootChip('x₂', ex && ex.rational ? s2 : N(Q.roots[1]), ex && !ex.rational ? s2 : null));
        check(a, b, c, Q.roots[0] + Q.roots[1], Q.roots[0] * Q.roots[1]);
      } else if (Q.kind === 'equal') {
        var r0 = Q.exact ? fr(Q.exact.r[0]) : N(Q.roots[0]);
        steps.appendChild(step(t('st_formula'), ['x = −b / 2a = ' + N(-b) + ' / (' + den + ')', '= ' + r0], 1));
        ans.appendChild(rootChip('x₁ = x₂', r0));
        check(a, b, c, 2 * Q.roots[0], Q.roots[0] * Q.roots[0]);
      } else {
        var reT = N(Q.re), imT = N(Q.im);
        if (Q.exact && Q.exact.complex && Q.exact.m === 1) { reT = fr(Q.exact.re); imT = fr(Q.exact.im); }
        var symb = Q.exact && Q.exact.complex && Q.exact.m !== 1 ? surdText(Q.exact, '±', true) : null;
        steps.appendChild(step(t('st_complex'), [
          'x = (−b ± √D) / 2a = (' + N(-b) + ' ± √(' + N(Q.D) + ')) / (' + den + ')',
          '√(' + N(Q.D) + ') = ' + N(Q.sqrtD) + 'i   (i = √−1)',
          (symb ? 'x = ' + symb + '  ≈  ' : 'x = ') + cplx(reT, imT, '±')
        ], 2));
        ans.appendChild(rootChip('x₁', cplx(reT, imT, '+')));
        ans.appendChild(rootChip('x₂', cplx(reT, imT, '−')));
        check(a, b, c, 2 * Q.re, Q.re * Q.re + Q.im * Q.im);
      }
    }
    function cplx(re, im, sign) { return (re === '0' ? '' : re + ' ' + sign + ' ') + (re === '0' && sign !== '+' ? sign : '') + (im === '1' ? '' : im) + 'i'; }
    function fr(f) { return f.d === 1 ? N(f.n) : (f.n < 0 ? '−' : '') + Math.abs(f.n) + '/' + f.d; }
    function surdText(ex, sign, cx) {
      var k = ex.k === 1 ? '' : ex.k, rt = k + '√' + ex.m + (cx ? ' i' : '');
      var top = ex.p === 0 ? (sign === '+' ? '' : sign === '−' ? '−' : '±') + rt : N(ex.p) + ' ' + sign + ' ' + rt;
      return ex.q === 1 ? top : '(' + top + ') / ' + ex.q;
    }
    function check(a, b, c, sum, prod) {
      $('#eq-steps').appendChild(step(t('st_check'), [
        'x₁ + x₂ = ' + N(S.round12(sum)) + ',   −b/a = ' + N(S.round12(-b / a)),
        'x₁ × x₂ = ' + N(S.round12(prod)) + ',   c/a = ' + N(S.round12(c / a))
      ]));
    }

    function linear(vals) {
      var n = E.type === 'lin2' ? 2 : 3, rows = [];
      for (var i = 0; i < n; i++) rows.push(vals.slice(i * (n + 1), (i + 1) * (n + 1)));
      $('#eq-prev').textContent = rows.map(function (r) { return polyText(r.slice(0, n), VARS.slice(0, n)) + ' = ' + N(r[n]); }).join('\n');
      var L = S.solveLinear(rows), ans = $('#eq-answer'), steps = $('#eq-steps'), v = $('#eq-verdict');
      steps.appendChild(step(t('st_cramer'), [n === 2 ? 'x = Dx / D,   y = Dy / D' : 'x = Dx / D,   y = Dy / D,   z = Dz / D']));
      var A = L.A, B = L.B;
      function mat(M) {
        var m = el('span', { class: 'sc-mat', style: { gridTemplateColumns: 'repeat(' + n + ', auto)' } });
        M.forEach(function (r) { r.forEach(function (x) { m.appendChild(el('span', { text: N(x) })); }); });
        return m;
      }
      function colRep(j) { return A.map(function (r, i) { var c = r.slice(); c[j] = B[i]; return c; }); }
      function detLine(name, M, value) {
        var li = el('span', { class: 'sc-det sc-math' }, name + ' = ', mat(M), ' = ' + expand(M) + ' = ' + N(value));
        return li;
      }
      function expand(M) {
        if (n === 2) return NB(M[0][0]) + '×' + NB(M[1][1]) + ' − ' + NB(M[0][1]) + '×' + NB(M[1][0]);
        var m = S.det3(M).minors;
        return NB(M[0][0]) + '×' + NB(m[0]) + ' − ' + NB(M[0][1]) + '×' + NB(m[1]) + ' + ' + NB(M[0][2]) + '×' + NB(m[2]);
      }
      var li = el('li', null, el('span', { class: 'lbl', text: t('st_dets') }));
      li.appendChild(detLine('D', A, L.D));
      if (n === 3) li.appendChild(el('span', { class: 'tiny muted', style: { display: 'block' }, text: t('st_minor') }));
      steps.appendChild(li);
      if (L.kind !== 'unique') {
        var why = t(L.kind === 'none' ? 'lin_none' : 'lin_many');
        v.textContent = why;
        steps.appendChild(step(t('st_result'), [why]));
        if (n === 2) {
          var r1 = rows[0], r2 = rows[1];
          steps.appendChild(step(t('st_ratio'), ['a₁/a₂ = ' + ratio(r1[0], r2[0]) + ',   b₁/b₂ = ' + ratio(r1[1], r2[1]) + ',   c₁/c₂ = ' + ratio(r1[2], r2[2])]));
        }
        return;
      }
      var li2 = el('li', null, el('span', { class: 'lbl', text: t('st_replace') }));
      for (var j = 0; j < n; j++) li2.appendChild(detLine('D' + VARS[j], colRep(j), L.Ds[j]));
      steps.appendChild(li2);
      var lines = [];
      for (var k = 0; k < n; k++) {
        lines.push(VARS[k] + ' = D' + VARS[k] + ' / D = ' + N(L.Ds[k]) + ' / ' + NB(L.D) + ' = ' + H.frac(L.x[k]));
        ans.appendChild(rootChip(VARS[k], H.frac(L.x[k])));
      }
      steps.appendChild(step(t('st_values'), lines));
      EDU.$$('#eq-steps li:last-child .sc-math').forEach(function (s) { s.className += ' ans'; });
      v.textContent = t('lin_unique');
    }
    function ratio(p, q) { return q === 0 ? (p === 0 ? '0/0' : '∞') : H.frac(p / q); }

    EDU.onLang(render);
    render();

    /* ---------------------------------------------------------- statistics */
    var stIn = $('#st-in');
    var SAMPLE = '45, 52, 38, 61, 52, 47, 55, 52, 40, 58';
    var txt = store.get('stats', null);
    stIn.value = typeof txt === 'string' ? txt : SAMPLE;
    var last = null;
    function stats() {
      var P = S.parseList(stIn.value), R = S.stats(P.vals), body = $('#st-body');
      body.textContent = '';
      $('#st-bad').textContent = P.bad.length ? t('st_bad', { list: P.bad.join('  ') }) : '';
      last = R;
      if (!R) { body.appendChild(el('tr', null, el('td', { text: t('st_empty') }))); $('#st-sorted').textContent = ''; return; }
      var rowsDef = [
        ['st_n', N(R.n)], ['st_sum', N(R.sum)], ['st_mean', N(R.mean)], ['st_median', N(R.median)],
        ['st_mode', R.modes.length ? R.modes.map(N).join(', ') + '  (' + t('st_times', { n: R.modeCount }) + ')' : t('st_nomode')],
        ['st_min', N(R.min)], ['st_max', N(R.max)], ['st_range', N(R.range)],
        ['st_sdp', N(R.sdP)], ['st_varp', N(R.varP)],
        ['st_sds', R.sdS === null ? '—' : N(R.sdS)], ['st_vars', R.varS === null ? '—' : N(R.varS)],
        ['st_sum2', N(R.sum2)]
      ];
      rowsDef.forEach(function (d) { body.appendChild(el('tr', { 'data-k': d[0] }, el('td', { text: t(d[0]) }), el('td', { class: 'v', text: d[1] }))); });
      var sorted = P.vals.slice().sort(function (p, q) { return p - q; });
      $('#st-sorted').textContent = t('st_sorted') + ': ' + sorted.slice(0, 200).map(N).join(', ') + (sorted.length > 200 ? ' …' : '');
      last.rows = rowsDef;
    }
    stIn.addEventListener('input', function () { store.set('stats', stIn.value); stats(); });
    $('#st-example').addEventListener('click', function () { stIn.value = SAMPLE; store.set('stats', SAMPLE); stats(); });
    $('#st-clear').addEventListener('click', function () { stIn.value = ''; store.set('stats', ''); stats(); stIn.focus(); });
    $('#st-copy').addEventListener('click', function () {
      if (!last || !last.rows) return;
      EDU.copy(last.rows.map(function (d) { return t(d[0]) + '\t' + d[1]; }).join('\n'));
    });
    EDU.onLang(stats);
    stats();

    return {
      refresh: function () { render(); stats(); },
      reset: function () {
        E.type = 'quad'; E.quad = ['1', '-5', '6']; E.lin2 = [['2', '3', '13'], ['1', '-1', '-1']]; E.lin3 = [['1', '1', '1', '6'], ['2', '-1', '1', '3'], ['1', '2', '-1', '2']];
        store.remove('eq'); store.remove('stats'); stIn.value = SAMPLE; render(); stats();
      }
    };
  }

  window.SC_TABS = { init: init };
})();
