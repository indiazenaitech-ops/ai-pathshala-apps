/* Ohm's Law & Circuits: circuit lab, V–I experiment (NCERT activity) and practice problems. */
(function () {
  'use strict';
  var SLUG = 'circuit-ohms-law';
  var store = EDU.store(SLUG);
  var C = window.CIRCUIT;
  var $ = EDU.$, $$ = EDU.$$, el = EDU.el, t = EDU.t;

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ================= number helpers ================= */
  function sig3(x) { return Number(Number(x).toPrecision(3)); }
  function nf(x) {
    if (x === Infinity) return '∞';
    if (typeof x !== 'number' || !isFinite(x)) return '–';
    var a = Math.abs(x);
    if (a < 1e-9) return '0';
    return EDU.fmt(x, a >= 1000 ? { maximumFractionDigits: 0 } : a >= 100 ? { maximumFractionDigits: 1 } : { maximumSignificantDigits: 3 });
  }
  function shown(x) { var a = Math.abs(x); return a >= 1000 ? Math.round(x) : a >= 100 ? Math.round(x * 10) / 10 : sig3(x); }
  /* " = 6" when the shown number is exact, " ≈ 6.67" when it was rounded */
  function exact(x) { return Math.abs(shown(x) - x) <= 1e-9 * Math.max(1, Math.abs(x)); }
  /* eq(result, input1, input2 ...): " ≈ " also when a number used in the working was itself rounded
     (so "6 / 6.67 ≈ 0.9", not "= 0.9") */
  function eq(x) {
    var ok = exact(x);
    for (var i = 1; i < arguments.length; i++) if (!exact(arguments[i])) ok = false;
    return (ok ? ' = ' : ' ≈ ') + nf(x);
  }
  function gcd(a, b) { while (b) { var c = a % b; a = b; b = c; } return a; }
  var SUB = '₀₁₂₃₄₅₆₇₈₉';
  function sub(s) { return String(s).replace(/\d/g, function (d) { return SUB.charAt(+d); }); }
  function rn(k) { return 'R' + sub(k + 1); }
  function clampV(v) { if (v === null || v === undefined || v === '') return null; v = Number(v); if (!isFinite(v)) return null; return EDU.clamp(Math.round(v * 2) / 2, 1.5, 12); }
  function clampR(v) { if (v === null || v === undefined || v === '') return null; v = Number(v); if (!isFinite(v)) return null; return EDU.clamp(Math.round(v), 1, 100); }
  /* table header: full words on wide screens, the physics symbol + unit on phones */
  function hth(key, sym) { return el('th', { class: 'n', title: t(key) }, el('span', { class: 'hw', text: t(key) }), el('bdi', { class: 'hs', dir: 'ltr', text: sym })); }
  function numTd(text) { return el('td', { class: 'n' }, el('bdi', { dir: 'ltr', text: text })); }
  /* keep a number and its unit together when a line of working wraps ("1.4 A", not "1.4 / A") */
  function nb(s) { return String(s).replace(/(\d) (?=(Ω|V|A|W|kW|kWh|h)(?![A-Za-z]))/g, '$1 '); }
  function setNum(input, v, force) { if (!force && document.activeElement === input && input.type === 'number') return; input.value = v; }

  /* ================= tabs ================= */
  var TABS = ['lab', 'exp', 'prac'];
  var tab = TABS.indexOf(store.get('tab')) >= 0 ? store.get('tab') : 'lab';
  function renderTabs() {
    $$('.cl-tabs [data-tab]').forEach(function (b) {
      var on = b.dataset.tab === tab;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      $('#pane-' + b.dataset.tab).hidden = !on;
    });
  }
  function goTab(name) {
    tab = name; store.set('tab', tab); renderTabs();
    if (tab === 'lab') { renderLab(); fitLabels(); }
    if (tab === 'exp') renderExp();
    if (tab === 'prac' && !q) newProblem();
  }
  $$('.cl-tabs [data-tab]').forEach(function (b) {
    b.addEventListener('click', function () { goTab(b.dataset.tab); });
    b.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var dir = (e.key === 'ArrowRight' ? 1 : -1) * (document.documentElement.dir === 'rtl' ? -1 : 1);
      var i = (TABS.indexOf(b.dataset.tab) + dir + TABS.length) % TABS.length;
      goTab(TABS[i]); $('#tab-' + TABS[i]).focus();
    });
  });

  /* ================= circuit lab ================= */
  var DEF = { preset: 'series2', V: 6, R: [10, 20, 30], closed: true, bulbs: false, flow: 'conv', vm: 'R1', short: false };
  function loadLab() {
    var s = store.get('lab', {}) || {};
    var o = JSON.parse(JSON.stringify(DEF));
    if (C.PRESETS.indexOf(s.preset) >= 0) o.preset = s.preset;
    if (clampV(s.V) !== null) o.V = clampV(s.V);
    if (Array.isArray(s.R)) for (var i = 0; i < 3; i++) if (clampR(s.R[i]) !== null) o.R[i] = clampR(s.R[i]);
    ['closed', 'bulbs', 'short'].forEach(function (k) { if (typeof s[k] === 'boolean') o[k] = s[k]; });
    if (s.flow === 'elec') o.flow = 'elec';
    if (/^(B|R[123])$/.test(s.vm || '')) o.vm = s.vm;
    return o;
  }
  var lab = loadLab();
  function saveLab() { store.set('lab', lab); }

  var PINFO = {
    single: { k: 'p_single', f: 'R₁' },
    series2: { k: 'p_series', f: 'R₁+R₂' },
    series3: { k: 'p_series', f: 'R₁+R₂+R₃' },
    parallel2: { k: 'p_parallel', f: 'R₁‖R₂' },
    parallel3: { k: 'p_parallel', f: 'R₁‖R₂‖R₃' },
    mixedA: { k: 'p_mixed', f: 'R₁+(R₂‖R₃)' },
    mixedB: { k: 'p_mixed', f: '(R₁+R₂)‖R₃' }
  };
  var ICONS = {
    single: '<path d="M1 15H16M30 15H45"/><rect x="16" y="10" width="14" height="10" rx="2"/>',
    series2: '<path d="M1 15H7M18 15H28M39 15H45"/><rect x="7" y="10" width="11" height="10" rx="2"/><rect x="28" y="10" width="11" height="10" rx="2"/>',
    series3: '<path d="M1 15H3M12 15H18M27 15H33M42 15H45"/><rect x="3" y="10" width="9" height="10" rx="2"/><rect x="18" y="10" width="9" height="10" rx="2"/><rect x="33" y="10" width="9" height="10" rx="2"/>',
    parallel2: '<path d="M1 15H8M8 7V23M38 7V23M38 15H45M8 7H18M28 7H38M8 23H18M28 23H38"/><rect x="18" y="3" width="10" height="8" rx="2"/><rect x="18" y="19" width="10" height="8" rx="2"/>',
    parallel3: '<path d="M1 15H8M8 4V26M38 4V26M38 15H45M8 4H18M28 4H38M8 15H18M28 15H38M8 26H18M28 26H38"/><rect x="18" y="1" width="10" height="6" rx="2"/><rect x="18" y="12" width="10" height="6" rx="2"/><rect x="18" y="23" width="10" height="6" rx="2"/>',
    mixedA: '<path d="M1 15H3M13 15H20M20 7V23M42 7V23M42 15H45M20 7H26M36 7H42M20 23H26M36 23H42"/><rect x="3" y="11" width="10" height="8" rx="2"/><rect x="26" y="3" width="10" height="8" rx="2"/><rect x="26" y="19" width="10" height="8" rx="2"/>',
    mixedB: '<path d="M1 15H5M5 7V23M41 7V23M41 15H45M5 7H9M19 7H27M37 7H41M5 23H18M28 23H41"/><rect x="9" y="3" width="10" height="8" rx="2"/><rect x="27" y="3" width="10" height="8" rx="2"/><rect x="18" y="19" width="10" height="8" rx="2"/>'
  };
  (function buildPresets() {
    var box = $('#presets');
    C.PRESETS.forEach(function (p) {
      var b = el('button', { type: 'button', class: 'cl-preset', id: 'preset-' + p, 'data-preset': p, 'aria-pressed': 'false',
        html: '<svg class="pico" viewBox="0 0 46 30" aria-hidden="true">' + ICONS[p] + '</svg>' },
        el('span', { class: 'pt' }, el('span', { i18n: PINFO[p].k }), el('span', { class: 'pf no-i18n', text: PINFO[p].f })));
      b.addEventListener('click', function () {
        lab.preset = p;
        if (/^R/.test(lab.vm) && Number(lab.vm.slice(1)) > C.COUNT[p]) lab.vm = 'R1';
        saveLab(); renderLab();
      });
      box.appendChild(b);
    });
  })();

  var labView = new C.View($('#cv-lab'), { onSwitch: function () { lab.closed = !lab.closed; saveLab(); renderLab(); } });

  function viewLabels(names) {
    return { names: names, fmt: nf, shortTag: t('short_tag'), vmName: t('voltmeter'), amName: t('ammeter'), swName: t('sw_toggle'), aria: t('diagram') };
  }

  function stat(id, value, text, hot) {
    var e = $(id);
    e.textContent = text;
    e.setAttribute('data-value', String(value));
    e.parentNode.classList.toggle('hot', !!hot);
  }

  function renderLab() {
    var res = C.solve({ preset: lab.preset, V: lab.V, R: lab.R, closed: lab.closed, shorted: lab.short });
    var n = res.n;
    /* controls */
    $$('#presets .cl-preset').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.preset === lab.preset ? 'true' : 'false'); });
    setNum($('#v-range'), lab.V, true); setNum($('#v-num'), lab.V);
    for (var k = 0; k < 3; k++) {
      $('#r-row-' + (k + 1)).hidden = k >= n;
      setNum($('#r' + (k + 1) + '-range'), lab.R[k], true); setNum($('#r' + (k + 1) + '-num'), lab.R[k]);
      $('#r' + (k + 1) + '-num').setAttribute('aria-label', t('res_n', { n: rn(k) }));
    }
    $('#btn-switch').setAttribute('aria-pressed', lab.closed ? 'true' : 'false');
    $('#sw-text').textContent = lab.closed ? t('sw_closed') : t('sw_open');
    $('#as-res').setAttribute('aria-pressed', lab.bulbs ? 'false' : 'true');
    $('#as-bulb').setAttribute('aria-pressed', lab.bulbs ? 'true' : 'false');
    $('#flow-conv').setAttribute('aria-pressed', lab.flow === 'elec' ? 'false' : 'true');
    $('#flow-elec').setAttribute('aria-pressed', lab.flow === 'elec' ? 'true' : 'false');
    var sel = $('#vm-sel');
    sel.innerHTML = '';
    sel.appendChild(el('option', { value: 'B', text: t('battery') }));
    for (k = 0; k < n; k++) sel.appendChild(el('option', { value: 'R' + (k + 1), text: rn(k) }));
    if (lab.vm !== 'B' && Number(lab.vm.slice(1)) > n) lab.vm = 'R1';
    sel.value = lab.vm;
    $('#btn-short').setAttribute('aria-pressed', lab.short ? 'true' : 'false');
    $('#btn-short').textContent = lab.short ? t('short_on') : t('short_btn');

    /* diagram */
    labView.render(lab, res, viewLabels(res.R.map(function (r, i) { return rn(i) + ' = ' + nf(r) + ' Ω'; })));

    /* key numbers */
    var low = res.closed && !res.shorted && res.req < 1;
    if (res.shorted) stat('#out-req', 0, '≈ 0 Ω', true); else stat('#out-req', res.req, nf(res.req) + ' Ω', low);
    if (res.shorted) { stat('#out-i', 'Infinity', t('very_large'), true); stat('#out-p', 'Infinity', t('very_large'), true); }
    else { stat('#out-i', res.I, nf(res.I) + ' A', low); stat('#out-p', res.P, nf(res.P) + ' W', low); }

    $('#warn-open').hidden = res.closed;
    $('#warn-short').hidden = !res.shorted;
    $('#warn-low').hidden = !low;
    if (low) $('#warn-low').textContent = t('warn_low', { r: nf(res.req), i: nf(res.I) });
    var bn = $('#bright-note');
    if (lab.bulbs && res.I > 0 && n > 1) {
      var pmax = Math.max.apply(null, res.Pk), pmin = Math.min.apply(null, res.Pk), top = [];
      /* every bulb within 0.5 % of the brightest glows just as brightly: name them all */
      for (k = 0; k < n; k++) if (res.Pk[k] >= pmax * 0.995) top.push(rn(k));
      if (pmax - pmin <= 0.005 * pmax) bn.textContent = t('equal_bulbs', { p: nf(pmax) });
      else if (top.length > 1) bn.textContent = t('brightest_tie', { name: '⁦' + top.join(', ') + '⁩', p: nf(pmax) });
      else bn.textContent = t('brightest', { name: top[0], p: nf(pmax) });
      bn.setAttribute('data-top', top.join(','));
      bn.hidden = false;
    } else bn.hidden = true;
    $('#dot-key').className = 'cl-dotkey' + (lab.flow === 'elec' ? ' elec' : '');
    $('#dots-note').textContent = t(lab.flow === 'elec' ? 'dots_elec' : 'dots_conv');

    renderCalc(res);
  }

  function renderCalc(res) {
    var box = $('#calc-steps'); box.innerHTML = '';
    var r = res.R, n = res.n, V = res.V, I = res.I, k;
    var names = r.map(function (x, i) { return rn(i); }), vals = r.map(nf);
    function step(title, lines, note) {
      var d = el('div', { class: 'cl-step' }, el('h4', { text: title }));
      if (note) d.appendChild(el('p', { class: 'small', text: note }));
      lines.forEach(function (l) { d.appendChild(el('div', { class: 'math no-i18n', text: nb(l) })); });
      box.appendChild(d);
    }
    /* 1. equivalent resistance */
    var L1 = [], note1 = '';
    if (res.kind === 'series') {
      L1.push(n === 1 ? 'R = R₁ = ' + vals[0] + ' Ω' : 'R = ' + names.join(' + ') + ' = ' + vals.join(' + ') + eq(res.req) + ' Ω');
    } else if (res.kind === 'parallel') {
      note1 = t('note_parallel');
      var head = '1/R = ' + names.map(function (x) { return '1/' + x; }).join(' + ') + ' = ' + vals.map(function (x) { return '1/' + x; }).join(' + ');
      var lcm = r.reduce(function (a, x) { return a / gcd(a, x) * x; }, 1);
      if (r.every(function (x) { return x === Math.round(x); }) && lcm <= 1000) {
        /* the NCERT way: common denominator, add, then turn the fraction upside down */
        var nums = r.map(function (x) { return lcm / x; }), S = nums.reduce(function (a, x) { return a + x; }, 0), g = gcd(S, lcm);
        var terms = nums.map(function (x) { return x + '/' + lcm; }).join(' + ');
        var line = head + (lcm === r[0] && r.every(function (x) { return x === r[0]; }) ? '' : ' = ' + terms) + ' = ' + S + '/' + lcm;
        if (g > 1) line += ' = ' + (S / g) + '/' + (lcm / g);
        L1.push(line);
        L1.push(S / g === 1 ? 'R = ' + (lcm / g) + ' Ω' : 'R = ' + (lcm / g) + '/' + (S / g) + eq(res.req) + ' Ω');
      } else {
        var inv4 = EDU.fmt(res.parts.inv, { maximumSignificantDigits: 4 });
        L1.push(head + ' ≈ ' + inv4);
        L1.push('R = 1 / ' + inv4 + ' ≈ ' + nf(res.req) + ' Ω');
      }
    } else if (res.kind === 'mixedA') {
      note1 = t('note_mixedA');
      L1.push('R₂₃ = (R₂ × R₃) / (R₂ + R₃) = (' + vals[1] + ' × ' + vals[2] + ') / (' + vals[1] + ' + ' + vals[2] + ')' + eq(res.parts.r23) + ' Ω');
      L1.push('R = R₁ + R₂₃ = ' + vals[0] + ' + ' + nf(res.parts.r23) + eq(res.req, res.parts.r23) + ' Ω');
    } else {
      note1 = t('note_mixedB');
      var r12 = nf(res.parts.r12);
      L1.push('R₁₂ = R₁ + R₂ = ' + vals[0] + ' + ' + vals[1] + ' = ' + r12 + ' Ω');
      L1.push('R = (R₁₂ × R₃) / (R₁₂ + R₃) = (' + r12 + ' × ' + vals[2] + ') / (' + r12 + ' + ' + vals[2] + ')' + eq(res.req) + ' Ω');
    }
    step(t('step_req'), L1, note1);

    /* 2. total current */
    if (!res.closed) step(t('step_i'), ['I = 0 A'], t('open_i'));
    else if (res.shorted) step(t('step_i'), ['R ≈ 0 Ω', 'I = V / R = ' + nf(V) + ' / 0 → ∞'], t('short_i'));
    else step(t('step_i'), ['I = V / R = ' + nf(V) + ' / ' + nf(res.req) + eq(I, res.req) + ' A']);

    /* 3. each part, 4. power */
    if (I > 0) {
      var L3 = [], Vk = res.Vk, Ik = res.Ik;
      var vn = function (i) { return 'V' + sub(i + 1); }, inn = function (i) { return 'I' + sub(i + 1); };
      if (res.kind === 'series') {
        for (k = 0; k < n; k++) L3.push(vn(k) + ' = I × ' + rn(k) + ' = ' + nf(I) + ' × ' + vals[k] + eq(Vk[k], I) + ' V');
      } else if (res.kind === 'parallel') {
        for (k = 0; k < n; k++) L3.push(inn(k) + ' = V / ' + rn(k) + ' = ' + nf(V) + ' / ' + vals[k] + eq(Ik[k]) + ' A');
      } else if (res.kind === 'mixedA') {
        L3.push('V₁ = I × R₁ = ' + nf(I) + ' × ' + vals[0] + eq(Vk[0], I) + ' V');
        L3.push('V₂₃ = I × R₂₃ = ' + nf(I) + ' × ' + nf(res.parts.r23) + eq(Vk[1], I, res.parts.r23) + ' V');
        L3.push('I₂ = V₂₃ / R₂ = ' + nf(Vk[1]) + ' / ' + vals[1] + eq(Ik[1], Vk[1]) + ' A');
        L3.push('I₃ = V₂₃ / R₃ = ' + nf(Vk[2]) + ' / ' + vals[2] + eq(Ik[2], Vk[2]) + ' A');
      } else {
        L3.push('I₁₂ = V / R₁₂ = ' + nf(V) + ' / ' + nf(res.parts.r12) + eq(Ik[0]) + ' A');
        L3.push('V₁ = I₁₂ × R₁ = ' + nf(Ik[0]) + ' × ' + vals[0] + eq(Vk[0], Ik[0]) + ' V');
        L3.push('V₂ = I₁₂ × R₂ = ' + nf(Ik[0]) + ' × ' + vals[1] + eq(Vk[1], Ik[0]) + ' V');
        L3.push('I₃ = V / R₃ = ' + nf(V) + ' / ' + vals[2] + eq(Ik[2]) + ' A');
      }
      if (n > 1) step(t('step_parts'), L3);
      var L4 = ['P = V × I = ' + nf(V) + ' × ' + nf(I) + eq(res.P, I) + ' W'];
      if (n > 1) for (k = 0; k < n; k++) L4.push('P' + sub(k + 1) + ' = ' + vn(k) + ' × ' + inn(k) + ' = ' + nf(Vk[k]) + ' × ' + nf(Ik[k]) + eq(res.Pk[k], Vk[k], Ik[k]) + ' W');
      step(t(n > 1 ? 'step_p' : 'step_p1'), L4);
    }

    /* table */
    var tb = $('#calc-table'); tb.innerHTML = '';
    tb.appendChild(el('thead', null, el('tr', null,
      el('th', { text: t('tbl_part') }), hth('tbl_r', 'R (Ω)'), hth('tbl_v', 'V (V)'), hth('tbl_i', 'I (A)'), hth('tbl_p', 'P (W)'))));
    var body = el('tbody');
    for (k = 0; k < n; k++) {
      body.appendChild(el('tr', { 'data-k': k, 'data-v': res.Vk[k], 'data-i': res.Ik[k], 'data-p': res.Pk[k] },
        el('td', { class: 'name', text: rn(k) }), numTd(nf(r[k])), numTd(nf(res.Vk[k])), numTd(nf(res.Ik[k])), numTd(nf(res.Pk[k]))));
    }
    body.appendChild(el('tr', { class: 'tot' },
      el('td', { class: 'name', text: t('whole') }), numTd(res.shorted ? '≈ 0' : nf(res.req)), numTd(nf(V)),
      numTd(res.shorted ? '∞' : nf(I)), numTd(res.shorted ? '∞' : nf(res.P))));
    tb.appendChild(body);

    /* check: Kirchhoff-style sums (in Class 10 words) */
    var chk = $('#calc-check'); chk.innerHTML = '';
    if (I > 0) {
      var lines = [], key;
      var sumStr = function (arr, unit) { return arr.map(function (x) { return nf(x) + ' ' + unit; }).join(' + '); };
      if (n === 1) { key = 'chk_single'; lines.push('V₁ = ' + nf(res.Vk[0]) + ' V = V ✓'); }
      else if (res.kind === 'series') { key = 'chk_series'; lines.push(res.Vk.map(function (x, i) { return 'V' + sub(i + 1); }).join(' + ') + ' = ' + sumStr(res.Vk, 'V') + eq(V) + ' V ✓'); }
      else if (res.kind === 'parallel') { key = 'chk_parallel'; lines.push(res.Ik.map(function (x, i) { return 'I' + sub(i + 1); }).join(' + ') + ' = ' + sumStr(res.Ik, 'A') + eq(I) + ' A = I ✓'); }
      else if (res.kind === 'mixedA') {
        key = 'chk_mixedA';
        lines.push('I₂ + I₃ = ' + sumStr([res.Ik[1], res.Ik[2]], 'A') + eq(I) + ' A = I₁ ✓');
        lines.push('V₁ + V₂₃ = ' + sumStr([res.Vk[0], res.Vk[1]], 'V') + eq(V) + ' V ✓');
      } else {
        key = 'chk_mixedB';
        lines.push('V₁ + V₂ = ' + sumStr([res.Vk[0], res.Vk[1]], 'V') + eq(V) + ' V = V₃ ✓');
        lines.push('I₁ + I₃ = ' + sumStr([res.Ik[0], res.Ik[2]], 'A') + eq(I) + ' A = I ✓');
      }
      chk.appendChild(el('p', { text: t(key) }));
      lines.forEach(function (l) { chk.appendChild(el('div', { class: 'math no-i18n', text: nb(l) })); });
      chk.hidden = false;
    } else chk.hidden = true;
  }

  /* lab events */
  $('#v-range').addEventListener('input', function () { var v = clampV(this.value); if (v === null) return; lab.V = v; saveLab(); renderLab(); });
  $('#v-num').addEventListener('input', function () { var v = clampV(this.value); if (v === null) return; lab.V = v; saveLab(); renderLab(); });
  $('#v-num').addEventListener('change', function () { setNum(this, lab.V, true); });
  [1, 2, 3].forEach(function (i) {
    var rg = $('#r' + i + '-range'), nb = $('#r' + i + '-num');
    rg.addEventListener('input', function () { var v = clampR(rg.value); if (v === null) return; lab.R[i - 1] = v; saveLab(); renderLab(); });
    nb.addEventListener('input', function () { var v = clampR(nb.value); if (v === null) return; lab.R[i - 1] = v; saveLab(); renderLab(); });
    nb.addEventListener('change', function () { setNum(nb, lab.R[i - 1], true); });
  });
  $('#btn-switch').addEventListener('click', function () { lab.closed = !lab.closed; saveLab(); renderLab(); });
  $('#as-res').addEventListener('click', function () { lab.bulbs = false; saveLab(); renderLab(); });
  $('#as-bulb').addEventListener('click', function () { lab.bulbs = true; saveLab(); renderLab(); });
  $('#flow-conv').addEventListener('click', function () { lab.flow = 'conv'; saveLab(); renderLab(); });
  $('#flow-elec').addEventListener('click', function () { lab.flow = 'elec'; saveLab(); renderLab(); });
  $('#vm-sel').addEventListener('change', function () { lab.vm = this.value; saveLab(); renderLab(); });
  $('#btn-short').addEventListener('click', function () { lab.short = !lab.short; saveLab(); renderLab(); });
  $('#btn-reset').addEventListener('click', function () { lab = JSON.parse(JSON.stringify(DEF)); saveLab(); renderLab(); EDU.toast(t('reset_done')); });
  $('#btn-fs').addEventListener('click', function () { EDU.fullscreen($('.cl-lab')); });

  /* ================= V–I experiment ================= */
  var MAX_ROWS = 40;
  var MYST = [4.7, 5.6, 6.8, 8.2, 10, 12, 15, 18, 22, 27, 33, 39, 47];
  function loadExp() {
    var s = store.get('exp', {}) || {};
    var o = {
      mode: s.mode === 'mystery' ? 'mystery' : 'known', R: clampR(s.R) || 10,
      mR: MYST.indexOf(s.mR) >= 0 ? s.mR : EDU.pick(MYST),
      cells: EDU.clamp(Math.round(Number(s.cells) || 1), 1, 8), noise: !!s.noise, revealed: !!s.revealed, rows: []
    };
    if (Array.isArray(s.rows)) s.rows.slice(0, MAX_ROWS).forEach(function (r) {
      if (r && isFinite(r.V) && isFinite(r.I) && r.V > 0 && r.I > 0) o.rows.push({ cells: EDU.clamp(Math.round(Number(r.cells) || 1), 1, 8), V: Number(r.V), I: Number(r.I) });
    });
    return o;
  }
  var exp = loadExp();
  function saveExp() { store.set('exp', exp); }
  function expR() { return exp.mode === 'mystery' ? exp.mR : exp.R; }
  function gauss() { var u = 1 - Math.random(), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function measure(cells) {
    var V = cells * 1.5, I = V / expR();
    if (exp.noise) { V *= 1 + EDU.clamp(gauss() * 0.012, -0.03, 0.03); I *= 1 + EDU.clamp(gauss() * 0.02, -0.05, 0.05); }
    return { cells: cells, V: sig3(V), I: sig3(I) };
  }
  var reading = measure(exp.cells);
  var expView = new C.View($('#cv-exp'), {});

  function renderExp() {
    var R = expR(), hidden = exp.mode === 'mystery' && !exp.revealed, locked = exp.rows.length > 0;
    $('#exp-known').setAttribute('aria-pressed', exp.mode === 'known' ? 'true' : 'false');
    $('#exp-mystery').setAttribute('aria-pressed', exp.mode === 'mystery' ? 'true' : 'false');
    $('#exp-r-row').hidden = exp.mode !== 'known';
    $('#exp-myst-row').hidden = exp.mode !== 'mystery';
    setNum($('#exp-r-range'), exp.R, true); setNum($('#exp-r-num'), exp.R);
    $('#exp-r-num').setAttribute('aria-label', t('exp_known'));
    ['#exp-known', '#exp-mystery', '#exp-r-range', '#exp-r-num', '#exp-new'].forEach(function (s) { $(s).disabled = locked; });
    $('#exp-reveal').disabled = exp.revealed;
    $('#exp-lock').textContent = locked ? t('exp_locked') : '';
    $('#exp-cells').value = exp.cells;
    $('#exp-cells-v').textContent = exp.cells + ' × 1.5 V = ' + nf(exp.cells * 1.5) + ' V';
    $('#exp-noise').checked = exp.noise;

    var V = exp.cells * 1.5;
    var res = C.solve({ preset: 'single', V: V, R: [R], closed: true, shorted: false });
    res.I = res.Itop = reading.I; res.Ik = [reading.I]; res.Vk = [reading.V];
    expView.render({ preset: 'single', V: V, closed: true, bulbs: false, flow: lab.flow, vm: 'R1', short: false, cells: exp.cells }, res,
      viewLabels(['R = ' + (hidden ? '?' : nf(R)) + ' Ω']));
    $('#exp-v').textContent = nf(reading.V) + ' V';
    $('#exp-v').setAttribute('data-value', reading.V);
    $('#exp-i').textContent = nf(reading.I) + ' A';
    $('#exp-i').setAttribute('data-value', reading.I);
    renderExpTable();
    renderGraph();
  }

  function renderExpTable() {
    var tb = $('#exp-table'); tb.innerHTML = '';
    tb.appendChild(el('thead', null, el('tr', null,
      el('th', { class: 'n', text: t('col_no') }), el('th', { class: 'n', text: t('col_cells') }), hth('col_v', 'V (V)'),
      hth('col_i', 'I (A)'), hth('col_vi', 'V/I (Ω)'), el('th', { class: 'no-print', text: '' }))));
    var body = el('tbody');
    if (!exp.rows.length) body.appendChild(el('tr', null, el('td', { colspan: 6, class: 'muted', text: t('exp_empty') })));
    exp.rows.forEach(function (r, i) {
      body.appendChild(el('tr', { class: 'exp-row', 'data-v': r.V, 'data-i': r.I },
        numTd(EDU.fmt(i + 1)), numTd(EDU.fmt(r.cells)), numTd(nf(r.V)), numTd(nf(r.I)), numTd(nf(r.V / r.I)),
        el('td', { class: 'no-print' }, el('button', { type: 'button', class: 'btn btn-sm btn-ghost', text: '✕', 'aria-label': t('del_row', { n: i + 1 }), title: t('del_row', { n: i + 1 }),
          onclick: function () { exp.rows.splice(i, 1); saveExp(); renderExp(); } }))));
    });
    tb.appendChild(body);
    $('#exp-csv').disabled = !exp.rows.length;
    $('#exp-record').disabled = exp.rows.length >= MAX_ROWS;
    $('#exp-clear').disabled = !exp.rows.length;
  }

  function niceStep(x) {
    var p = Math.pow(10, Math.floor(Math.log10(x))), m = x / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
  }
  function S(tag, attrs, parent, text) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (text !== undefined) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  /* a centred message in the graph, broken into lines that fit (one long SVG line would be cut off) */
  function wrapText(parent, x, y, text, cls, maxW, dir) {
    var probe = S('text', { x: 0, y: -999, class: cls }, parent), lines = [], cur = '';
    var width = function (str) {
      probe.textContent = str;
      var w = 0; try { w = probe.getComputedTextLength(); } catch (e) { }
      return w || str.length * 10;   /* hidden pane: rough guess, redrawn when the tab opens */
    };
    String(text).split(/\s+/).forEach(function (wd) {
      var tryLine = cur ? cur + ' ' + wd : wd;
      if (cur && width(tryLine) > maxW) { lines.push(cur); cur = wd; } else cur = tryLine;
    });
    if (cur) lines.push(cur);
    var lh = 1.35 * (parseFloat(getComputedStyle(probe).fontSize) || 17);
    parent.removeChild(probe);
    var te = S('text', { x: x, y: y - (lines.length - 1) * lh / 2, 'text-anchor': 'middle', class: cls, direction: dir }, parent);
    lines.forEach(function (l, i) { S('tspan', { x: x, dy: i ? lh : 0 }, te, l); });
    return te;
  }

  function renderGraph() {
    var svg = $('#exp-graph');
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var W = 560, H = 380, ml = 70, mr = 24, mt = 18, mb = 62, pw = W - ml - mr, ph = H - mt - mb;
    var pts = exp.rows.map(function (r) { return { I: r.I, V: r.V }; });
    var maxI = Math.max.apply(null, pts.map(function (p) { return p.I; }).concat([V0I()]));
    var maxV = Math.max.apply(null, pts.map(function (p) { return p.V; }).concat([1.5]));
    var xs = niceStep(maxI * 1.12 / 5), ys = niceStep(maxV * 1.12 / 5);
    var xmax = xs * Math.max(1, Math.ceil(maxI * 1.12 / xs)), ymax = ys * Math.max(1, Math.ceil(maxV * 1.12 / ys));
    var X = function (i) { return ml + i / xmax * pw; }, Y = function (v) { return mt + ph - v / ymax * ph; };
    var g = S('g', {}, svg), i;
    for (i = 0; i <= Math.round(xmax / xs); i++) {
      var xv = i * xs; S('line', { x1: X(xv), y1: mt, x2: X(xv), y2: mt + ph, class: 'gl' }, g);
      S('text', { x: X(xv), y: mt + ph + 22, 'text-anchor': 'middle', class: 'tick' }, g, nf(xv));
    }
    for (i = 0; i <= Math.round(ymax / ys); i++) {
      var yv = i * ys; S('line', { x1: ml, y1: Y(yv), x2: ml + pw, y2: Y(yv), class: 'gl' }, g);
      S('text', { x: ml - 8, y: Y(yv) + 5, 'text-anchor': 'end', class: 'tick' }, g, nf(yv));
    }
    S('line', { x1: ml, y1: mt + ph, x2: ml + pw, y2: mt + ph, class: 'axis' }, g);
    S('line', { x1: ml, y1: mt, x2: ml, y2: mt + ph, class: 'axis' }, g);
    var tdir = document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr';   /* words in the graph follow the page direction (Urdu) */
    S('text', { x: ml + pw / 2, y: H - 10, 'text-anchor': 'middle', class: 'alab', direction: tdir }, g, t('axis_i'));
    S('text', { x: 0, y: 0, 'text-anchor': 'middle', class: 'alab', direction: tdir, transform: 'translate(18 ' + (mt + ph / 2) + ') rotate(-90)' }, g, t('axis_v'));
    svg.setAttribute('aria-label', t('graph_title'));

    var res = $('#exp-result'); res.innerHTML = '';
    /* the slope needs two different voltages (numbers of cells): two readings with the same cells
       but small meter errors would give a meaningless, even negative, ΔV / ΔI */
    var byCells = exp.rows.slice().sort(function (a, b) { return a.cells - b.cells; });
    var lo = byCells[0], hi = byCells[byCells.length - 1];
    if (!lo || lo.cells === hi.cells || !(hi.I > lo.I)) {
      if (!pts.length) wrapText(g, ml + pw / 2, mt + ph / 2, t('need2'), 'empty', pw - 30, tdir);
      pts.forEach(function (p) { S('circle', { cx: X(p.I), cy: Y(p.V), r: 6.5, class: 'pt' }, g); });
      res.appendChild(el('p', { class: 'muted small', text: t('need2') }));
      if (exp.mode === 'mystery' && exp.revealed) res.appendChild(el('p', { class: 'callout accent', text: t('exp_revealed_only', { r: nf(exp.mR) }) }));
      return;
    }
    /* best straight line through the origin: R = ΣVI / ΣI² */
    var sVI = 0, sII = 0, sR = 0;
    pts.forEach(function (p) { sVI += p.V * p.I; sII += p.I * p.I; sR += p.V / p.I; });
    var fit = sVI / sII, mean = sR / pts.length;
    var xEnd = Math.min(xmax, ymax / fit);
    S('line', { x1: X(0), y1: Y(0), x2: X(xEnd), y2: Y(fit * xEnd), class: 'fit' }, g);
    /* slope triangle between the readings with the fewest and the most cells */
    var p1 = lo, p2 = hi;
    var slope = (p2.V - p1.V) / (p2.I - p1.I);
    S('polyline', { points: [X(p1.I), Y(p1.V), X(p2.I), Y(p1.V), X(p2.I), Y(p2.V)].join(' '), class: 'tri' }, g);
    S('text', { x: (X(p1.I) + X(p2.I)) / 2, y: Y(p1.V) + 22, 'text-anchor': 'middle', class: 'tril' }, g, 'ΔI');
    S('text', { x: X(p2.I) + 8, y: (Y(p1.V) + Y(p2.V)) / 2 + 5, 'text-anchor': 'start', class: 'tril' }, g, 'ΔV');
    pts.forEach(function (p) { S('circle', { cx: X(p.I), cy: Y(p.V), r: 6.5, class: 'pt' }, g); });

    var dV = p2.V - p1.V, dI = p2.I - p1.I;
    res.appendChild(el('p', { class: 'small', html: '<b>' + EDU.esc(t('slope_lbl')) + '</b>' }));
    res.appendChild(el('div', { class: 'math no-i18n ans', id: 'exp-slope', 'data-value': slope,
      text: nb('R = ΔV / ΔI = (' + nf(p2.V) + ' − ' + nf(p1.V) + ') / (' + nf(p2.I) + ' − ' + nf(p1.I) + ')' + (exact(dV) && exact(dI) ? ' = ' : ' ≈ ') + nf(dV) + ' / ' + nf(dI) + eq(slope, dV, dI) + ' Ω') }));
    res.appendChild(el('p', { class: 'small', style: { marginTop: '8px' } }, t('fit_lbl') + ': ', el('bdi', { class: 'math no-i18n', id: 'exp-fit', 'data-value': fit, text: 'R ≈ ' + nf(fit) + ' Ω' })));
    res.appendChild(el('p', { class: 'small' }, t('mean_lbl') + ': ', el('bdi', { class: 'math no-i18n', text: nf(mean) + ' Ω' })));
    res.appendChild(el('p', { class: 'callout success', text: t('exp_concl') }));
    if (exp.mode === 'mystery' && exp.revealed) {
      var err = Math.abs(slope - exp.mR) / exp.mR * 100;
      res.appendChild(el('p', { class: 'callout accent', id: 'exp-reveal-out', 'data-r': exp.mR, text: t('exp_revealed', { r: nf(exp.mR), g: nf(slope), e: nf(err) }) }));
    }
  }
  function V0I() { return 1.5 / expR(); }

  function newReading() { reading = measure(exp.cells); }
  $('#exp-known').addEventListener('click', function () { if (exp.rows.length) return; exp.mode = 'known'; newReading(); saveExp(); renderExp(); });
  $('#exp-mystery').addEventListener('click', function () { if (exp.rows.length) return; exp.mode = 'mystery'; newReading(); saveExp(); renderExp(); });
  function setExpR(v) { if (v === null || exp.rows.length) return; exp.R = v; newReading(); saveExp(); renderExp(); }
  $('#exp-r-range').addEventListener('input', function () { setExpR(clampR(this.value)); });
  $('#exp-r-num').addEventListener('input', function () { setExpR(clampR(this.value)); });
  $('#exp-r-num').addEventListener('change', function () { setNum(this, exp.R, true); });
  $('#exp-new').addEventListener('click', function () {
    if (exp.rows.length) return;
    var old = exp.mR, guard = 0;
    while (exp.mR === old && guard++ < 20) exp.mR = EDU.pick(MYST);
    exp.revealed = false; newReading(); saveExp(); renderExp();
  });
  $('#exp-reveal').addEventListener('click', function () { exp.revealed = true; saveExp(); renderExp(); });
  $('#exp-cells').addEventListener('input', function () { exp.cells = EDU.clamp(Math.round(Number(this.value) || 1), 1, 8); newReading(); saveExp(); renderExp(); });
  $('#exp-noise').addEventListener('change', function () { exp.noise = this.checked; newReading(); saveExp(); renderExp(); });
  $('#exp-record').addEventListener('click', function () {
    if (exp.rows.length >= MAX_ROWS) return;
    exp.rows.push({ cells: reading.cells, V: reading.V, I: reading.I });
    EDU.toast(t('recorded', { n: exp.rows.length }));
    newReading(); saveExp(); renderExp();
  });
  $('#exp-quick').addEventListener('click', function () {
    if (exp.rows.length && !confirm(t('confirm_quick'))) return;
    exp.rows = [1, 2, 3, 4].map(measure);
    exp.cells = 4; newReading(); saveExp(); renderExp();
  });
  $('#exp-clear').addEventListener('click', function () {
    if (!exp.rows.length || !confirm(t('confirm_reset'))) return;
    exp.rows = []; saveExp(); renderExp();
  });
  $('#exp-csv').addEventListener('click', function () {
    var rows = [[t('col_no'), t('col_cells'), t('col_v'), t('col_i'), t('col_vi')]];
    exp.rows.forEach(function (r, i) { rows.push([i + 1, r.cells, r.V, r.I, sig3(r.V / r.I)]); });
    EDU.download('v-i-readings.csv', EDU.csv.stringify(rows), 'text/csv');
  });
  $('#exp-print').addEventListener('click', function () { document.body.classList.remove('cl-print-ws'); window.print(); });

  /* ================= practice ================= */
  var prac = (function () {
    var s = store.get('prac', {}) || {};
    return { topic: ['all', 'ohm', 'combo', 'power'].indexOf(s.topic) >= 0 ? s.topic : 'all',
      c: Math.max(0, Math.round(Number(s.c) || 0)), n: Math.max(0, Math.round(Number(s.n) || 0)), streak: Math.max(0, Math.round(Number(s.streak) || 0)) };
  })();
  if (prac.c > prac.n) prac.c = prac.n;
  function savePrac() { store.set('prac', prac); }
  var TYPES = { ohm: ['current', 'voltage', 'resistance', 'heater'], combo: ['series', 'parallel', 'series_i', 'parallel_i'], power: ['power', 'power_i2r', 'cost'] };
  function typesFor(topic) { return topic === 'all' ? TYPES.ohm.concat(TYPES.combo, TYPES.power) : TYPES[topic]; }
  var PAIRS = [[3, 6], [4, 12], [6, 12], [10, 15], [12, 24], [20, 30], [10, 40], [5, 20], [10, 10], [20, 20], [30, 60], [15, 30], [6, 6],
    [8, 8], [9, 18], [20, 5], [24, 8], [40, 10], [60, 20], [36, 12], [18, 9], [30, 20], [45, 90], [25, 100], [50, 50], [4, 4], [2, 2]];
  function nice(x) { return Math.abs(Math.round(x * 1000) - x * 1000) < 1e-6; }
  var P = EDU.pick;

  /* each problem: { type, vars, ans, unit, sol: [lines], lab: {preset, V, R} | null } */
  function gen(type) {
    for (var guard = 0; guard < 400; guard++) {
      var R, V, I, a, b, c, s, pr, rp;
      switch (type) {
        case 'current':
          R = P([2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 25, 30, 40, 50]); V = P([1.5, 3, 4.5, 6, 9, 12]); I = V / R;
          if (!nice(I) || I < 0.05) continue;
          return { type: type, vars: { R: R, V: V }, ans: I, unit: 'A', sol: ['I = V / R = ' + nf(V) + ' / ' + nf(R) + ' = ' + nf(I) + ' A'], lab: { preset: 'single', V: V, R: [R] } };
        case 'voltage':
          R = P([2, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50]); I = P([0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 1, 1.5, 2]); V = Math.round(I * R * 1000) / 1000;
          if (V > 100) continue;
          return { type: type, vars: { I: I, R: R }, ans: V, unit: 'V', sol: ['V = I × R = ' + nf(I) + ' × ' + nf(R) + ' = ' + nf(V) + ' V'], lab: { preset: 'single', V: V, R: [R] } };
        case 'resistance':
          V = P([3, 4.5, 6, 9, 12]); I = P([0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 1.5]); R = V / I;
          if (Math.abs(R - Math.round(R)) > 1e-9 || R < 2 || R > 100) continue;
          R = Math.round(R);
          return { type: type, vars: { V: V, I: I }, ans: R, unit: 'Ω', sol: ['R = V / I = ' + nf(V) + ' / ' + nf(I) + ' = ' + nf(R) + ' Ω'], lab: { preset: 'single', V: V, R: [R] } };
        case 'heater':
          V = 220; I = P([2, 4, 5, 8, 10, 11, 20]); R = V / I;
          return { type: type, vars: { V: V, I: I }, ans: R, unit: 'Ω', sol: ['R = V / I = ' + nf(V) + ' / ' + nf(I) + ' = ' + nf(R) + ' Ω'], lab: null };
        case 'series':
          a = EDU.randInt(1, 50); b = EDU.randInt(1, 50); c = EDU.randInt(1, 50); s = a + b + c;
          return { type: type, vars: { a: a, b: b, c: c }, ans: s, unit: 'Ω', sol: ['R = R₁ + R₂ + R₃ = ' + nf(a) + ' + ' + nf(b) + ' + ' + nf(c) + ' = ' + nf(s) + ' Ω'], lab: { preset: 'series3', V: 6, R: [a, b, c] } };
        case 'parallel':
          pr = P(PAIRS); a = pr[0]; b = pr[1]; rp = a * b / (a + b);
          return { type: type, vars: { a: a, b: b }, ans: rp, unit: 'Ω', sol: ['1/R = 1/R₁ + 1/R₂  ⇒  R = (R₁ × R₂) / (R₁ + R₂)', 'R = (' + nf(a) + ' × ' + nf(b) + ') / (' + nf(a) + ' + ' + nf(b) + ') = ' + nf(a * b) + ' / ' + nf(a + b) + ' = ' + nf(rp) + ' Ω'], lab: { preset: 'parallel2', V: 6, R: [a, b] } };
        case 'series_i':
          a = EDU.randInt(1, 30); b = EDU.randInt(1, 30); V = P([3, 4.5, 6, 9, 12]); s = a + b; I = V / s;
          if (!nice(I) || I < 0.05) continue;
          return { type: type, vars: { a: a, b: b, V: V }, ans: I, unit: 'A', sol: ['R = R₁ + R₂ = ' + nf(a) + ' + ' + nf(b) + ' = ' + nf(s) + ' Ω', 'I = V / R = ' + nf(V) + ' / ' + nf(s) + ' = ' + nf(I) + ' A'], lab: { preset: 'series2', V: V, R: [a, b] } };
        case 'parallel_i':
          pr = P(PAIRS); a = pr[0]; b = pr[1]; rp = a * b / (a + b); V = P([3, 6, 9, 12]); I = V / rp;
          if (!nice(I)) continue;
          return { type: type, vars: { a: a, b: b, V: V }, ans: I, unit: 'A', sol: ['R = (' + nf(a) + ' × ' + nf(b) + ') / (' + nf(a) + ' + ' + nf(b) + ') = ' + nf(rp) + ' Ω', 'I = V / R = ' + nf(V) + ' / ' + nf(rp) + ' = ' + nf(I) + ' A'], lab: { preset: 'parallel2', V: V, R: [a, b] } };
        case 'power':
          V = 220; I = P([2, 2.5, 3, 4, 4.5, 5, 6]); s = V * I;
          return { type: type, vars: { I: I, V: V }, ans: s, unit: 'W', sol: ['P = V × I = ' + nf(V) + ' × ' + nf(I) + ' = ' + nf(s) + ' W'], lab: null };
        case 'power_i2r':
          I = P([0.5, 1, 1.5, 2, 2.5, 3]); R = P([2, 4, 5, 8, 10, 12, 20]); s = I * I * R;
          V = I * R;
          return { type: type, vars: { I: I, R: R }, ans: s, unit: 'W', sol: ['P = I² × R = ' + nf(I) + '² × ' + nf(R) + ' = ' + nf(s) + ' W'],
            lab: V >= 1.5 && V <= 12 && Math.abs(V * 2 - Math.round(V * 2)) < 1e-9 ? { preset: 'single', V: V, R: [R] } : null };
        case 'cost':
          var pw = P([500, 1000, 1500, 2000]), h = P([2, 3]), d = P([10, 15, 30]), rate = P([5, 6, 7, 8]);
          var kwh = pw / 1000 * h * d, cost = kwh * rate;
          return { type: type, vars: { P: pw, h: h, d: d, rate: rate }, ans: cost, unit: '₹',
            sol: ['t = ' + nf(h) + ' h × ' + nf(d) + ' = ' + nf(h * d) + ' h', 'E = P × t = ' + nf(pw / 1000) + ' kW × ' + nf(h * d) + ' h = ' + nf(kwh) + ' kWh', nf(kwh) + ' kWh × ₹' + nf(rate) + ' = ₹' + nf(cost)], lab: null };
      }
    }
    return gen('series');
  }
  function qText(p) {
    var v = {}; Object.keys(p.vars).forEach(function (k) { v[k] = nf(p.vars[k]); });
    return t('q_' + p.type, v).replace(/(\d) (?=(Ω|V|A|W)(?![A-Za-z]))/g, '$1 ');
  }
  /* number + unit kept together (and left-to-right inside Urdu text) */
  function ansStr(p) { return '⁦' + (p.unit === '₹' ? '₹' + nf(p.ans) : nf(p.ans) + ' ' + p.unit) + '⁩'; }

  var DIGIT_ZERO = [0x0966, 0x09E6, 0x0A66, 0x0AE6, 0x0B66, 0x0BE6, 0x0C66, 0x0CE6, 0x0D66, 0x06F0, 0x0660];
  function parseNum(str) {
    var s = String(str || '').replace(/[٠-٩۰-۹०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯]/g, function (ch) {
      var c = ch.charCodeAt(0);
      for (var i = 0; i < DIGIT_ZERO.length; i++) if (c >= DIGIT_ZERO[i] && c <= DIGIT_ZERO[i] + 9) return String(c - DIGIT_ZERO[i]);
      return ch;
    });
    s = s.replace(/[\s₹]/g, '').replace(/[٫]/g, '.').replace(/[−–]/g, '-').replace(/[÷⁄]/g, '/');
    /* "R = 40", "I=0.15", "Rs 50": drop a short label in front of the number */
    s = s.replace(/^(rs\.?|inr|[A-Za-zΩ₀-₉]{0,4}=)/i, '');
    if (/^-?[1-9]\d{0,2}(,\d{2,3})+(\.\d+)?/.test(s)) s = s.replace(/,/g, '');   /* 1,440 · 1,44,000 */
    else if (/^-?\d+,\d+/.test(s) && s.indexOf('.') < 0) s = s.replace(',', '.');   /* 0,25 → 0.25 */
    var f = s.match(/^(-?\d*\.?\d+)\/(\d*\.?\d+)(?![\d.])/);   /* a fraction such as 3/40 */
    if (f) return Number(f[2]) ? Number(f[1]) / Number(f[2]) : NaN;
    var m = s.match(/^-?\d*\.?\d+(e-?\d+)?/i);
    return m ? Number(m[0]) : NaN;
  }

  var q = null;
  function newProblem() {
    q = gen(P(typesFor(prac.topic)));
    q.done = false; q.result = '';
    $('#q-ans').value = '';
    renderPrac();
  }
  function renderPrac() {
    $$('.cl-topics .chip').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.topic === prac.topic ? 'true' : 'false'); });
    var sc = $('#score'); sc.textContent = t('score', { c: EDU.fmt(prac.c), n: EDU.fmt(prac.n) });
    sc.setAttribute('data-c', prac.c); sc.setAttribute('data-n', prac.n);
    $('#streak').textContent = t('streak', { n: EDU.fmt(prac.streak) });
    if (!q) return;
    var card = $('#prac-card');
    card.setAttribute('data-type', q.type);
    card.setAttribute('data-answer', String(Math.round(q.ans * 1e6) / 1e6));
    $('#q-text').textContent = qText(q);
    $('#q-unit').textContent = q.unit;
    $('#q-unit-hint').textContent = t('ans_in', { u: q.unit });
    var fb = $('#q-feedback');
    fb.className = 'callout';
    fb.setAttribute('data-result', q.result || '');
    if (q.result === 'right') { fb.classList.add('success'); fb.textContent = t('fb_right'); }
    else if (q.result === 'wrong') { fb.classList.add('danger'); fb.textContent = t('fb_wrong', { a: ansStr(q) }); }
    else if (q.result === 'nan') { fb.classList.add('warning'); fb.textContent = t('fb_nan'); }
    else fb.textContent = '';
    var sol = $('#q-solution');
    sol.innerHTML = '';
    if (q.result === 'right' || q.result === 'wrong') {
      sol.appendChild(el('h4', { text: t('solution') }));
      q.sol.forEach(function (l) { sol.appendChild(el('div', { class: 'math no-i18n', text: nb(l) })); });
      if (q.type === 'cost') sol.appendChild(el('p', { class: 'small muted mb0', text: t('cost_note') }));
      sol.hidden = false;
    } else sol.hidden = true;
    $('#q-lab').hidden = !(q.lab && (q.result === 'right' || q.result === 'wrong') && labFits(q.lab));
  }
  function labFits(L) {
    return L.V >= 1.5 && L.V <= 12 && Math.abs(L.V * 2 - Math.round(L.V * 2)) < 1e-9 &&
      L.R.every(function (r) { return r >= 1 && r <= 100 && Math.round(r) === r; });
  }
  function check() {
    if (!q) return;
    var x = parseNum($('#q-ans').value);
    if (!isFinite(x)) { q.result = 'nan'; renderPrac(); $('#q-ans').focus(); return; }
    var ok = Math.abs(x - q.ans) <= Math.max(0.02 * Math.abs(q.ans), 0.005);
    if (!q.done) {
      q.done = true; prac.n++;
      if (ok) { prac.c++; prac.streak++; } else prac.streak = 0;
      savePrac();
    }
    q.result = ok ? 'right' : 'wrong';
    renderPrac();
  }
  $('#q-check').addEventListener('click', check);
  $('#q-ans').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(); } });
  $('#q-new').addEventListener('click', function () { newProblem(); $('#q-ans').focus(); });
  $$('.cl-topics .chip').forEach(function (b) {
    b.addEventListener('click', function () { prac.topic = b.dataset.topic; savePrac(); newProblem(); });
  });
  $('#score-reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    prac.c = 0; prac.n = 0; prac.streak = 0; savePrac(); renderPrac();
  });
  $('#q-lab').addEventListener('click', function () {
    if (!q || !q.lab) return;
    lab.preset = q.lab.preset; lab.V = q.lab.V;
    q.lab.R.forEach(function (r, i) { lab.R[i] = r; });
    lab.closed = true; lab.short = false; lab.vm = 'R1';
    saveLab(); goTab('lab');
    var d = $('#diag-card'); if (d.scrollIntoView) d.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* worksheet */
  var ws = null;
  function makeWs() {
    var types = EDU.shuffle(typesFor(prac.topic)), list = [];
    for (var i = 0; i < 10; i++) list.push(gen(types[i % types.length]));
    ws = list; renderWs();
  }
  function renderWs() {
    var out = $('#ws-out'); out.innerHTML = '';
    $('#ws-print').disabled = !ws;
    if (!ws) return;
    out.appendChild(el('div', { class: 'ws-head' }, el('h2', { text: t('ws_head') }), el('p', { text: t('ws_name') })));
    var ol = el('ol', { class: 'ws-list', id: 'ws-list' });
    ws.forEach(function (p) {
      ol.appendChild(el('li', { class: 'ws-item' }, qText(p), ' ', el('bdi', { class: 'muted', text: '(' + p.unit + ')' }),
        el('span', { class: 'ws-line', text: t('ws_ans_line') })));
    });
    out.appendChild(ol);
    var key = el('ol', { class: 'ws-key', id: 'ws-key' });
    ws.forEach(function (p) { key.appendChild(el('li', { text: ansStr(p) })); });
    out.appendChild(el('div', { class: 'ws-key-wrap' + ($('#ws-ans').checked ? '' : ' no-key') }, el('h3', { class: 'cl-sub', text: t('ws_key') }), key));
  }
  $('#ws-make').addEventListener('click', makeWs);
  $('#ws-ans').addEventListener('change', renderWs);
  $('#ws-print').addEventListener('click', function () {
    if (!ws) return;
    document.body.classList.add('cl-print-ws');
    window.print();
    setTimeout(function () { document.body.classList.remove('cl-print-ws'); }, 800);
  });

  /* ================= fit long labels ================= */
  /* Long words (Tamil, Malayalam ...) in narrow boxes on phones: switch that group to a stacked layout
     instead of clipping the word or breaking it in the middle. Measured in the normal layout each time. */
  var FIT = [['#presets', '.cl-preset .pt, .cl-preset .pt > span'], ['.cl-syms', '.cl-sym > span'], ['.cl-stats', '.cl-stat .k']];
  function fitLabels() {
    FIT.forEach(function (f) {
      $$(f[0]).forEach(function (box) {
        if (!box.getClientRects().length) return;
        box.classList.remove('stack');
        var over = $$(f[1], box).some(function (e) { return e.scrollWidth > e.clientWidth + 1; });
        box.classList.toggle('stack', over);
      });
    });
  }
  var fitQueued = false;
  function queueFit() {
    if (fitQueued) return; fitQueued = true;
    (window.requestAnimationFrame || setTimeout)(function () { fitQueued = false; fitLabels(); });
  }
  window.addEventListener('resize', queueFit);
  try { if (document.fonts) { document.fonts.ready.then(queueFit); document.fonts.addEventListener('loadingdone', queueFit); } } catch (e) { }

  /* ================= start ================= */
  function renderAll() { renderLab(); renderExp(); renderPrac(); renderWs(); fitLabels(); }
  EDU.onLang(renderAll);
  renderTabs();
  renderLab();
  renderExp();
  newProblem();
  renderWs();
  fitLabels();
})();
