/* Health Calculators
   Five everyday health numbers in tabs: BMI (WHO + Asian cut-offs), healthy weight for a height, daily calories
   (Mifflin-St Jeor x activity), a rough daily water guide, and waist-to-height ratio.
   General information only. Everything runs on this device; nothing is sent anywhere. */
(function () {
  'use strict';
  var SLUG = 'health-calculators';
  var store = EDU.store(SLUG);
  var $ = EDU.$, $$ = EDU.$$;
  var FSI = '⁨', PDI = '⁩';
  var TABS = ['bmi', 'ideal', 'cal', 'water', 'waist'];
  var DEF = { unit: 'cm', hcm: '165', hft: '5', hin: '5', w: '62', age: '30', sex: 'f', act: '2', hot: false, wcm: '80', win: '31.5', tab: 'bmi' };

  /* ================================================================ formulas (pure) */
  var C = {
    ACT: [1.2, 1.375, 1.55, 1.725, 1.9],
    WHO: [18.5, 25, 30],            /* underweight < 18.5 <= healthy < 25 <= overweight < 30 <= obese */
    ASIAN: [18.5, 23, 25],          /* lower cut-offs commonly used for Asian adults */
    round: function (v, d) { var p = Math.pow(10, d || 0); return Math.round((v + Number.EPSILON) * p) / p; },
    ftInToCm: function (ft, inch) { return (ft * 12 + inch) * 2.54; },
    bmi: function (kg, cm) { var m = cm / 100; return kg / (m * m); },
    cat: function (bmi1, cuts) { return bmi1 < cuts[0] ? 'under' : bmi1 < cuts[1] ? 'normal' : bmi1 < cuts[2] ? 'over' : 'obese'; },
    /* weight range in kg for a height: BMI lo..hi */
    idealRange: function (cm, lo, hi) { var m2 = (cm / 100) * (cm / 100); return [lo * m2, hi * m2]; },
    /* Mifflin-St Jeor: 10 x kg + 6.25 x cm - 5 x age + 5 (men) or - 161 (women) */
    bmr: function (sex, kg, cm, age) { return 10 * kg + 6.25 * cm - 5 * age + (sex === 'm' ? 5 : -161); },
    tdee: function (bmr, level) { return bmr * C.ACT[level - 1]; },
    /* rough guide: 30 to 35 ml per kg a day, + 500 ml on a hot or very active day; returns ml */
    water: function (kg, hot) { var x = hot ? 500 : 0; return [30 * kg + x, 35 * kg + x]; },
    whtr: function (waist, height) { return waist / height; },
    whtrCat: function (r2) { return r2 < 0.4 ? 'low' : r2 < 0.5 ? 'ok' : r2 < 0.6 ? 'inc' : 'high'; }
  };
  window.HEALTHCALC = C;

  /* ================================================================ helpers */
  function rtl() { return document.documentElement.dir === 'rtl'; }
  /* in right-to-left pages every inserted value is isolated so "53.5" or "2,556" stays in one piece */
  function t(key, vars) {
    if (vars && rtl()) {
      var o = {};
      Object.keys(vars).forEach(function (k) { o[k] = FSI + vars[k] + PDI; });
      return EDU.t(key, o);
    }
    return EDU.t(key, vars);
  }
  function f(n, d) { return EDU.fmt(C.round(n, d || 0), { maximumFractionDigits: d || 0 }); }
  function f1(n) { return EDU.fmt(C.round(n, 1), { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
  function f2(n) { return EDU.fmt(C.round(n, 2), { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  var ZEROS = [0x0660, 0x06F0, 0x0966, 0x09E6, 0x0A66, 0x0AE6, 0x0B66, 0x0BE6, 0x0C66, 0x0CE6, 0x0D66];
  function latin(s) {
    return String(s == null ? '' : s).replace(/[٠-٩۰-۹०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯]/g, function (c) {
      var code = c.charCodeAt(0);
      for (var i = 0; i < ZEROS.length; i++) if (code >= ZEROS[i] && code <= ZEROS[i] + 9) return String(code - ZEROS[i]);
      return c;
    }).replace(/٫/g, '.');
  }
  /* "165", "62.5", "८०" -> { v } or { e: 'empty' | 'nan' } */
  function num(raw) {
    var s = latin(raw).trim();
    if (!s) return { e: 'empty' };
    if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return { e: 'nan' };
    var v = Number(s);
    return isFinite(v) ? { v: v } : { e: 'nan' };
  }

  function load() {
    var s = store.get('state', null), o = {}, k;
    for (k in DEF) o[k] = DEF[k];
    if (s && typeof s === 'object') {
      for (k in DEF) {
        if (typeof s[k] === typeof DEF[k]) o[k] = typeof s[k] === 'string' ? s[k].slice(0, 12) : s[k];
      }
    }
    if (o.unit !== 'cm' && o.unit !== 'ft') o.unit = 'cm';
    if (o.sex !== 'm' && o.sex !== 'f') o.sex = 'f';
    if (!/^[1-5]$/.test(o.act)) o.act = '2';
    if (TABS.indexOf(o.tab) < 0) o.tab = 'bmi';
    return o;
  }
  var S = load();
  function save() { store.set('state', S); }

  /* ================================================================ reading the inputs */
  var bad = {};                                     /* input id -> true when its value is the problem */
  function height() {
    if (S.unit === 'cm') {
      var n = num(S.hcm);
      if (n.e === 'empty') return { e: t('need_h'), id: 'h-cm' };
      if (n.e) return { e: t('err_num'), id: 'h-cm' };
      if (n.v < 60 || n.v > 250) return { e: t('err_h'), id: 'h-cm' };
      return { v: n.v };
    }
    var a = num(S.hft), b = num(S.hin);
    if (a.e === 'empty') return { e: t('need_h'), id: 'h-ft' };
    if (a.e) return { e: t('err_num'), id: 'h-ft' };
    if (b.e === 'empty') b = { v: 0 };
    if (b.e) return { e: t('err_num'), id: 'h-in' };
    if (a.v !== Math.floor(a.v) || a.v < 2 || a.v > 8) return { e: t('err_ft'), id: 'h-ft' };
    if (b.v >= 12) return { e: t('err_ft'), id: 'h-in' };
    return { v: C.ftInToCm(a.v, b.v) };
  }
  function weight() {
    var n = num(S.w);
    if (n.e === 'empty') return { e: t('need_w'), id: 'w-kg' };
    if (n.e) return { e: t('err_num'), id: 'w-kg' };
    if (n.v < 20 || n.v > 400) return { e: t('err_w'), id: 'w-kg' };
    return { v: n.v };
  }
  function age() {
    var n = num(S.age);
    if (n.e === 'empty') return { e: t('need_age'), id: 'age' };
    if (n.e) return { e: t('err_num'), id: 'age' };
    if (n.v > 110) return { e: t('err_age'), id: 'age' };
    if (n.v < 18) return { e: t('cal_adult'), id: 'age' };
    return { v: n.v };
  }
  function waist() {                                /* always returned in the same unit as the typed value */
    var inches = S.unit === 'ft', n = num(inches ? S.win : S.wcm);
    if (n.e === 'empty') return { e: t('need_waist'), id: 'waist' };
    if (n.e) return { e: t('err_num'), id: 'waist' };
    if (inches ? (n.v < 16 || n.v > 98) : (n.v < 40 || n.v > 250)) return { e: t(inches ? 'err_waist_in' : 'err_waist_cm'), id: 'waist' };
    return { v: n.v };
  }

  /* show the first problem of a tab (or none) and hide its result while there is one */
  function gate(tab, list) {
    var err = null, i;
    for (i = 0; i < list.length; i++) if (list[i].e) { err = list[i]; break; }
    var box = $('#err-' + tab), res = $('#res-' + tab);
    box.hidden = !err; box.textContent = err ? err.e : '';
    res.hidden = !!err;
    if (err) bad[err.id] = true;
    return !err;
  }
  function pill(node, text, level) { node.textContent = text; node.className = 'hc-pill ' + level; }
  var LEVEL = { under: 'mid', normal: 'ok', over: 'mid', obese: 'bad', low: 'mid', ok: 'ok', inc: 'mid', high: 'bad' };

  /* ================================================================ the five calculators */
  function rangeText(cuts, i) {
    if (i === 0) return t('r_below', { a: f(cuts[0], 1) });
    if (i === 3) return t('r_above', { a: f(cuts[2], 1) });
    return t('r_between', { a: f(cuts[i - 1], 1), b: f(cuts[i] - 0.1, 1) });
  }
  function renderBmi(h, w) {
    var cats = ['under', 'normal', 'over', 'obese'], who = null, asian = null;
    if (gate('bmi', [h, w])) {
      var b = C.round(C.bmi(w.v, h.v), 1);
      who = C.cat(b, C.WHO); asian = C.cat(b, C.ASIAN);
      $('#out-bmi').textContent = f1(b);
      pill($('#bmi-who'), t('who_line', { cat: t('cat_' + who) }), LEVEL[who]);
      pill($('#bmi-asian'), t('asian_line', { cat: t('cat_' + asian) }), LEVEL[asian]);
      $('#bmi-mark').style.insetInlineStart = (EDU.clamp((b - 15) / 25, 0, 1) * 100) + '%';
      $('#bmi-exp').textContent = t('bmi_exp_' + who);
    }
    var body = $('#bmi-rows'); body.textContent = '';
    cats.forEach(function (c, i) {
      body.appendChild(EDU.el('tr', {},
        EDU.el('td', { text: t('cat_' + c) }),
        EDU.el('td', { text: rangeText(C.WHO, i), class: who === c ? 'now' : '' }),
        EDU.el('td', { text: rangeText(C.ASIAN, i), class: asian === c ? 'now' : '' })));
    });
  }
  function renderIdeal(h, w) {
    if (!gate('ideal', [h])) return;
    var r = C.idealRange(h.v, 18.5, 24.9), ra = C.idealRange(h.v, 18.5, 22.9);
    var lo = C.round(r[0], 1), hi = C.round(r[1], 1), cm = f(h.v, 1);
    $('#out-ideal').textContent = t('ideal_out', { a: f(lo, 1), b: f(hi, 1) });
    $('#ideal-exp').textContent = t('ideal_exp', { h: cm, a: f(lo, 1), b: f(hi, 1) });
    $('#ideal-asian').textContent = t('ideal_asian', { a: f(ra[0], 1), b: f(ra[1], 1) });
    var now = $('#ideal-now');
    now.hidden = !!w.e;
    if (!w.e) {
      var wv = C.round(w.v, 1);
      now.textContent = wv < lo ? t('ideal_below', { w: f(wv, 1), d: f(lo - wv, 1) })
        : wv > hi ? t('ideal_above', { w: f(wv, 1), d: f(wv - hi, 1) }) : t('ideal_in', { w: f(wv, 1) });
    }
  }
  function renderCal(h, w) {
    if (!gate('cal', [h, w, age()])) return;
    var b = C.bmr(S.sex, w.v, h.v, age().v), d = C.tdee(b, Number(S.act));
    $('#out-tdee').textContent = t('cal_out', { n: f(d) });
    $('#out-bmr').textContent = t('cal_bmr', { n: f(b) });
    $('#cal-exp').textContent = t('cal_exp', { bmr: f(b), tdee: f(d) });
  }
  function renderWater(w) {
    if (!gate('water', [w])) return;
    var r = C.water(w.v, S.hot);
    $('#out-water').textContent = t('water_out', { a: f1(r[0] / 1000), b: f1(r[1] / 1000) });
    $('#water-glasses').textContent = t('water_glasses', { a: f(r[0] / 250), b: f(r[1] / 250) });
  }
  function renderWaist(h) {
    var inches = S.unit === 'ft';
    $('#waistL').textContent = t(inches ? 'lbl_waist_in' : 'lbl_waist_cm');
    if (!gate('waist', [h, waist()])) return;
    var hh = inches ? h.v / 2.54 : h.v;
    var r = C.round(C.whtr(waist().v, hh), 2), c = C.whtrCat(r);
    $('#out-whtr').textContent = f2(r);
    pill($('#whtr-cat'), t('wh_' + c), LEVEL[c]);
    $('#whtr-exp').textContent = t('wh_exp_' + c);
    $('#whtr-rule').textContent = t(inches ? 'wh_rule_in' : 'wh_rule_cm', { n: f(hh / 2, 1) });
  }

  function render() {
    bad = {};
    var h = height(), w = weight();
    renderBmi(h, w); renderIdeal(h, w); renderCal(h, w); renderWater(w); renderWaist(h);
    $$('#app input[type="text"]').forEach(function (i) {
      if (bad[i.id]) i.setAttribute('aria-invalid', 'true'); else i.removeAttribute('aria-invalid');
    });
  }

  /* ================================================================ controls */
  function syncControls() {
    $$('input[data-k], select[data-k]').forEach(function (i) { i.value = S[i.getAttribute('data-k')]; });
    $('#waist').value = S.unit === 'ft' ? S.win : S.wcm;
    $('#hot').checked = !!S.hot;
    $$('[data-unit]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-unit') === S.unit)); });
    $$('[data-sex]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-sex') === S.sex)); });
    $('#f-hcm').hidden = S.unit !== 'cm';
    $('#f-hft').hidden = $('#f-hin').hidden = S.unit !== 'ft';
    $$('[data-tab]').forEach(function (b) {
      var on = b.getAttribute('data-tab') === S.tab;
      b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1;
      $('#p-' + b.getAttribute('data-tab')).hidden = !on;
    });
  }
  function setUnit(u) {
    if (u === S.unit) return;
    var h = height(), wa = waist();                 /* read in the old unit, then carry the values over */
    if (!h.e) {
      if (u === 'ft') {
        var total = C.round(h.v / 2.54, 1), ft = Math.floor(total / 12);
        S.hft = String(ft); S.hin = String(C.round(total - ft * 12, 1));
      } else S.hcm = String(C.round(h.v, 1));
    }
    if (!wa.e) { if (u === 'ft') S.win = String(C.round(wa.v / 2.54, 1)); else S.wcm = String(C.round(wa.v * 2.54, 1)); }
    S.unit = u; save(); syncControls(); render();
  }
  function setTab(tab, focus) {
    S.tab = tab; save(); syncControls();
    if (focus) $('#tab-' + tab).focus();
  }

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  $$('input[data-k], select[data-k]').forEach(function (i) {
    var h = function () { S[i.getAttribute('data-k')] = i.value; save(); render(); };
    i.addEventListener('input', h); i.addEventListener('change', h);
  });
  $('#waist').addEventListener('input', function () { S[S.unit === 'ft' ? 'win' : 'wcm'] = this.value; save(); render(); });
  $('#hot').addEventListener('change', function () { S.hot = this.checked; save(); render(); });
  $$('[data-unit]').forEach(function (b) { b.addEventListener('click', function () { setUnit(b.getAttribute('data-unit')); }); });
  $$('[data-sex]').forEach(function (b) { b.addEventListener('click', function () { S.sex = b.getAttribute('data-sex'); save(); syncControls(); render(); }); });
  $$('[data-tab]').forEach(function (b) {
    b.addEventListener('click', function () { setTab(b.getAttribute('data-tab')); });
    b.addEventListener('keydown', function (e) {
      var i = TABS.indexOf(b.getAttribute('data-tab')), step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!step) return;
      if (rtl()) step = -step;
      e.preventDefault(); setTab(TABS[(i + step + TABS.length) % TABS.length], true);
    });
  });
  $('#resetAll').addEventListener('click', function () {
    if (!confirm(EDU.t('confirm_reset'))) return;
    S = {}; for (var k in DEF) S[k] = DEF[k];
    store.remove('state'); syncControls(); render(); EDU.toast(EDU.t('reset_done'));
  });

  EDU.onLang(render);
  syncControls(); render();
})();
