/* Salary & Income Tax Calculator (Tax Year 2026-27).
   CTC -> monthly in-hand, old vs new regime, salary hike, and in-hand -> CTC (binary search).
   All tax numbers come from window.RULES_2026_27 (data.js). Nothing leaves the device. */
(function () {
  'use strict';
  var SLUG = 'salary-tax-calculator';
  var R = window.RULES_2026_27;
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$;

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ================================================================ numbers in, numbers out */
  var ZEROS = [0x0660, 0x06F0, 0x0966, 0x09E6, 0x0A66, 0x0AE6, 0x0B66, 0x0BE6, 0x0C66, 0x0CE6, 0x0D66];
  function latinDigits(s) {
    return String(s).replace(/[٠-٩۰-۹०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯]/g, function (c) {
      var cp = c.charCodeAt(0);
      for (var i = 0; i < ZEROS.length; i++) if (cp >= ZEROS[i] && cp <= ZEROS[i] + 9) return String(cp - ZEROS[i]);
      return c;
    });
  }
  /* unit words people type: English + the 11 Indian languages (nukta dots are removed before matching) */
  var UNITS = [
    [1e7, /^(cr|crs|crore|crores|करोड|करोडों|कोटी|কোটি|કરોડ|ਕਰੋੜ|କୋଟି|கோடி|కోటి|కోట్లు|ಕೋಟಿ|കോടി|کروڑ)$/],
    [1e5, /^(l|lac|lacs|lakh|lakhs|lpa|लाख|লাখ|লক্ষ|લાખ|ਲੱਖ|ਲਖ|ଲକ୍ଷ|லட்சம்|லட்சம|లక్ష|లక్షలు|ಲಕ್ಷ|ലക്ഷം|لاکھ)$/],
    [1e3, /^(k|thousand|हजार|হাজার|હજાર|ਹਜਾਰ|ହଜାର|ஆயிரம்|వేలు|వేల|ಸಾವಿರ|ആയിരം|ہزار)$/]
  ];
  /* Amounts above ₹1 lakh crore are refused (they would only show silly numbers). */
  var MAX_AMT = 1e12;
  /* '12L', '12.5 lakh', '1.2 cr', '12,00,000', '₹85k', '10%' -> { value, pct, unit } | { empty } | { bad, big? } */
  function parseAmount(raw, opts) {
    var r = parseRaw(raw, opts || {});
    if (!r.pct && !r.bad && r.value > MAX_AMT) return { bad: true, big: true, value: 0 };
    return r;
  }
  function badKey(p) { return p.big ? 'too_big' : 'bad_amount'; }
  function badTxt(p) { return t(badKey(p), { max: inrW(MAX_AMT) }); }
  function parseRaw(raw, opts) {
    opts = opts || {};
    var s = latinDigits(raw == null ? '' : raw);
    try { s = s.normalize('NFC'); } catch (e) { }
    s = s.replace(/[़়਼]/g, '').toLowerCase().replace(/₹/g, ' ').replace(/,/g, '').replace(/\/-/g, ' ').trim();
    s = s.replace(/^(rs\.?|inr)\s*/, '').replace(/\s+/g, ' ').trim();
    if (!s) return { empty: true, value: 0 };
    var m = s.match(/^(\d+(?:\.\d*)?|\.\d+)\s*(.*)$/);
    if (!m) return { bad: true, value: 0 };
    var v = parseFloat(m[1]), u = m[2].trim().replace(/\.$/, '');
    if (!isFinite(v)) return { bad: true, value: 0 };
    if (u === '%') return opts.pct ? { value: v, pct: true } : { bad: true, value: 0 };
    if (u) {
      for (var i = 0; i < UNITS.length; i++) if (UNITS[i][1].test(u)) return { value: v * UNITS[i][0], unit: true };
      return { bad: true, value: 0 };
    }
    if (opts.lakhIfSmall && v > 0 && v < 1000) return { value: v * 1e5, guessed: true };
    return { value: v };
  }
  function amt(raw) { var p = parseAmount(raw); return p.bad || p.empty ? 0 : Math.max(0, p.value); }
  function num(raw, d) { var v = parseFloat(latinDigits(raw == null ? '' : raw)); return isFinite(v) ? v : (d || 0); }

  /* Indian digit grouping (12,34,567) in every language, Latin digits */
  function grp(n) {
    var s = String(Math.round(Math.abs(n)));
    if (s.length > 3) s = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3);
    return s;
  }
  /* In Urdu (RTL) a number written after Arabic letters is laid out right-to-left with its sign, so '₹1,000' would show
     as '1,000₹'. Wrapping it in Unicode left-to-right isolates keeps '₹1,00,300' and '5.7%' in the right order. */
  function iso(txt) { return EDU.langInfo(EDU.lang).dir === 'rtl' ? '\u2066' + txt + '\u2069' : txt; }
  function inr(n) { n = Math.round(n || 0); return iso((n < 0 ? '−' : '') + '₹' + grp(n)); }
  function words(n) {
    var a = Math.abs(n), f = function (x) { return EDU.fmt(x, { maximumFractionDigits: 2 }); };
    if (a >= 1e7) return f(n / 1e7) + ' ' + t('crore');
    if (a >= 1e5) return f(n / 1e5) + ' ' + t('lakh');
    return '';
  }
  function plus(n) { return iso('+₹' + grp(n)); }                 /* '+₹1,200' kept together in RTL */
  function inrW(n) { var w = words(n); return w ? inr(n) + ' (' + w + ')' : inr(n); }
  function pctTxt(x, d) { return iso(EDU.fmt(isFinite(x) ? x : 0, { maximumFractionDigits: d == null ? 1 : d }) + '%'); }
  function fmtDate(iso) {
    try { return new Intl.DateTimeFormat(EDU.langInfo(EDU.lang).tag, { day: 'numeric', month: 'long', year: 'numeric', numberingSystem: 'latn' }).format(new Date(iso + 'T12:00:00')); }
    catch (e) { return iso; }
  }
  function round10(x) { return Math.round(x / R.roundTo) * R.roundTo; }

  /* ================================================================ tax engine */
  function slabTax(income, slabs) {
    var tax = 0, prev = 0;
    for (var i = 0; i < slabs.length; i++) {
      var top = slabs[i][0] == null ? Infinity : slabs[i][0];
      if (income > prev) tax += (Math.min(income, top) - prev) * slabs[i][1];
      prev = top;
    }
    return tax;
  }
  function slabRows(income, slabs) {
    var rows = [], prev = 0;
    for (var i = 0; i < slabs.length; i++) {
      var top = slabs[i][0] == null ? Infinity : slabs[i][0];
      if (income > prev && slabs[i][1] > 0) rows.push({ from: prev, to: top, rate: slabs[i][1], tax: (Math.min(income, top) - prev) * slabs[i][1] });
      prev = top;
    }
    return rows;
  }
  /* Tax on a taxable income. regime 'new' | 'old'; age 'below60' | 'age60' | 'age80' (old regime only). */
  function taxOn(taxable, regime, age) {
    var cfg = regime === 'old' ? R.oldRegime : R.newRegime;
    var slabs = regime === 'old' ? (cfg.slabs[age] || cfg.slabs.below60) : cfg.slabs;
    var inc = round10(Math.max(0, taxable || 0));
    var base = slabTax(inc, slabs), rb = cfg.rebate, rebate = 0, relief = 0, tx = base;
    if (inc <= rb.incomeLimit) { rebate = Math.min(base, rb.max); tx = base - rebate; }
    else if (rb.marginalRelief && tx > inc - rb.incomeLimit) { relief = tx - (inc - rb.incomeLimit); tx = inc - rb.incomeLimit; }
    var sRate = 0, sThr = 0, sPrev = 0;
    cfg.surcharge.forEach(function (s, i) { if (inc > s[0]) { sRate = s[1]; sThr = s[0]; sPrev = i ? cfg.surcharge[i - 1][1] : 0; } });
    var sur = tx * sRate, surRelief = 0;
    if (sRate) {
      /* marginal relief: tax + surcharge may rise by no more than the income above the threshold */
      var cap = slabTax(sThr, slabs) * (1 + sPrev) + (inc - sThr);
      if (tx + sur > cap) { surRelief = Math.min(sur, tx + sur - cap); sur -= surRelief; }
    }
    var cess = (tx + sur) * R.cess;
    return { regime: regime, taxable: inc, rows: slabRows(inc, slabs), base: base, rebate: rebate, relief: relief,
      sRate: sRate, sur: sur, surRelief: surRelief, cess: cess, total: round10(tx + sur + cess) };
  }

  /* ================================================================ salary model */
  function ptFor(grossMonthly, s) {
    if (s.ptManual) return amt(s.pt);
    var rows = R.professionalTax[s.state] || [], v = 0;
    rows.forEach(function (r) { if (grossMonthly >= r[0]) v = r[1]; });
    return v;
  }
  function bonusOf(ctc, s) {
    if (typeof s.bonus === 'number') return Math.max(0, s.bonus);
    var p = parseAmount(s.bonus, { pct: true });
    if (p.bad || p.empty) return 0;
    return p.pct ? ctc * p.value / 100 : p.value;     // above 100% is capped (with a warning) in structure()
  }
  /* CTC -> components (yearly). Returns warnings for the edge cases. */
  function structure(ctc, s) {
    var warn = [], S = R.salary;
    ctc = Math.max(0, ctc || 0);
    var bonus = bonusOf(ctc, s);
    if (bonus > ctc) { bonus = ctc; warn.push(['warn_bonus']); }
    var fixed = ctc - bonus;
    var bp = EDU.clamp(num(s.basicPct, 50), 0, 100) / 100, hp = EDU.clamp(num(s.hraPct, 0), 0, 100) / 100, np = EDU.clamp(num(s.nps, 0), 0, 100) / 100;
    function build(basic) {
      var pfBase = s.pf === 'cap' ? Math.min(basic, S.pfWageCeilingMonthly * 12) : basic;
      var pf = s.pf === 'none' ? 0 : pfBase * S.pfRate;
      var grat = s.grat ? basic * S.gratuityRate : 0, hra = basic * hp, nps = basic * np;
      return { basic: basic, hra: hra, empPF: pf, eePF: pf, grat: grat, nps: nps, special: fixed - basic - hra - pf - grat - nps };
    }
    var b = build(fixed * bp);
    if (b.special < -0.5 && fixed > 0) {
      var lo = 0, hi = b.basic;
      for (var i = 0; i < 60; i++) { var mid = (lo + hi) / 2; if (build(mid).special >= 0) lo = mid; else hi = mid; }
      b = build(lo);
      warn.push(['warn_overflow', { pct: pctTxt(fixed ? b.basic / fixed * 100 : 0) }]);
    }
    b.special = Math.max(0, b.special);
    if (s.pf === 'cap' && b.basic > 0 && b.basic / 12 <= S.pfWageCeilingMonthly) warn.push(['warn_pfwage', { wage: inr(S.pfWageCeilingMonthly) }]);
    b.bonus = bonus; b.fixed = fixed; b.ctc = ctc;
    b.grossMonthly = (b.basic + b.hra + b.special) / 12;
    b.pt = ptFor(b.grossMonthly, s);
    b.warn = warn;
    return b;
  }
  /* Income tax on this salary in one regime. withBonus = include the yearly bonus. */
  function taxFor(b, s, regime, withBonus) {
    var old = regime === 'old', cfg = old ? R.oldRegime : R.newRegime, L = R.oldRegime.limits;
    var pay = b.basic + b.hra + b.special + (withBonus ? b.bonus : 0);
    var gross = pay + b.nps;                                             // employer NPS is part of salary, then deducted
    var perq = Math.max(0, b.empPF + b.nps - R.salary.employerRetirementCap);
    var hraEx = 0;
    if (old) {
      var rent = amt(s.rent) * 12, H = cfg.hraExemption;
      if (rent > 0 && b.hra > 0) hraEx = Math.max(0, Math.min(b.hra, rent - H.rentMinusBasic * b.basic, (s.city === 'metro' ? H.metro : H.other) * b.basic));
    }
    var sd = Math.min(cfg.standardDeduction, Math.max(0, gross - hraEx));
    var pt = old ? Math.min(b.pt, cfg.professionalTaxMax) : 0;
    var npsD = Math.min(b.nps, cfg.employerNpsLimit * b.basic);
    var hl = old ? Math.min(amt(s.hl), L.homeLoanInterest) : 0;
    var c80 = old ? Math.min(L.sec80C, b.eePF + amt(s.c80)) : 0;
    var d80 = old ? Math.min(amt(s.d80s), s.age === 'below60' ? L.sec80DSelf : L.sec80DSelfSenior) + Math.min(amt(s.d80p), s.par60 ? L.sec80DParentsSenior : L.sec80DParents) : 0;
    var ccd = old ? Math.min(amt(s.ccd), L.sec80CCD1B) : 0;
    var oldDed = hraEx + pt + hl + c80 + d80 + ccd;                   // deductions only the old regime gives
    var taxable = Math.max(0, gross + perq - sd - npsD - oldDed);
    return { regime: regime, pay: pay, gross: gross, perq: perq, hraEx: hraEx, sd: sd, pt: pt, npsD: npsD, hl: hl, c80: c80, d80: d80, ccd: ccd,
      oldDed: oldDed, beforeOld: gross + perq - sd - npsD, tax: taxOn(taxable, regime, s.age) };
  }
  /* Everything for one CTC in one regime */
  function calc(ctc, s, regime) {
    var b = structure(ctc, s);
    var all = taxFor(b, s, regime, true), fix = taxFor(b, s, regime, false);
    var tax = all.tax.total, taxFix = fix.tax.total;
    /* TDS spreads the whole year's tax (bonus included) over 12 months, the way payroll projects the year.
       bonusTax = the extra tax the bonus causes, for employers who cut it only in the bonus month. */
    var tds = tax / 12;
    var inHand = b.grossMonthly - b.eePF / 12 - b.pt / 12 - tds;
    var bonusTax = Math.max(0, tax - taxFix);
    return { ctc: ctc, regime: regime, b: b, w: all, tax: tax, taxFix: taxFix, tds: tds, tdsNoBonus: taxFix / 12, inHand: inHand,
      bonusTax: bonusTax, bonusNet: b.bonus, eff: all.pay > 0 ? tax / all.pay * 100 : 0 };
  }
  /* Old-regime deductions at which both regimes give the same tax */
  function breakEven(ctc, s) {
    var b = structure(ctc, s), nw = taxFor(b, s, 'new', true), od = taxFor(b, s, 'old', true);
    var newTax = nw.tax.total;
    if (newTax <= 0) return { never: true, cur: od.oldDed };
    var f = function (D) { return taxOn(Math.max(0, od.beforeOld - D), 'old', s.age).total; };
    if (f(0) <= newTax) return { be: 0, cur: od.oldDed };
    var lo = 0, hi = Math.max(0, od.beforeOld);
    for (var i = 0; i < 60; i++) { var mid = (lo + hi) / 2; if (f(mid) <= newTax) hi = mid; else lo = mid; }
    return { be: Math.ceil(hi / 100) * 100, cur: od.oldDed };
  }
  /* Smallest CTC (rounded up to Rs 1,000 where possible) whose monthly in-hand pay reaches the target.
     In-hand pay does not always rise with CTC: it dips just above the rebate limit (marginal relief + 4% cess means
     each extra rupee costs Rs 1.04), at the old-regime rebate cliff, at every surcharge threshold and at each
     professional-tax step. A plain binary search can land on the far side of such a dip and ask for up to ~Rs 74,000
     too much (e.g. Rs 1,06,250 in hand: 12.75 lakh is enough, not 13.49 lakh). So the search runs on the "best in-hand
     pay so far" curve, which uses the in-hand pay at the top of each dip. */
  function solveCTC(target, s, regime) {
    if (!(target > 0)) return null;
    var ih = function (c) { return calc(c, s, regime).inHand; };
    var hi = 1e5;
    while (ih(hi) < target && hi < 1e11) hi *= 2;
    if (ih(hi) < target) return null;
    var cfg = regime === 'old' ? R.oldRegime : R.newRegime, steps = [];
    function taxable(c) { var w = taxFor(structure(c, s), s, regime, true); return w.beforeOld - w.oldDed; }
    function grossM(c) { return structure(c, s).grossMonthly; }
    /* the last CTC before f(c) reaches v (f rises with CTC), or null when it never does inside [0, hi] */
    function lastBelow(f, v) {
      if (f(0) >= v || f(hi) < v) return null;
      var a = 0, z = hi;
      for (var i = 0; i < 60; i++) { var m = (a + z) / 2; if (f(m) >= v) z = m; else a = m; }
      return a;
    }
    /* taxable income is rounded to the nearest Rs 10, so a limit L still applies up to L + 4.99 */
    [cfg.rebate.incomeLimit].concat(cfg.surcharge.map(function (x) { return x[0]; })).forEach(function (L) { steps.push(lastBelow(taxable, L + 5)); });
    if (!s.ptManual) (R.professionalTax[s.state] || []).forEach(function (r) { steps.push(lastBelow(grossM, r[0])); });
    var peaks = steps.filter(function (c) { return c != null; }).map(function (c) { return [c, ih(c)]; });
    function best(c) {
      var v = ih(c);
      peaks.forEach(function (p) { if (p[0] <= c && p[1] > v) v = p[1]; });
      return v;
    }
    var lo = 0, up = hi;
    for (var i = 0; i < 70; i++) { var mid = (lo + up) / 2; if (best(mid) >= target) up = mid; else lo = mid; }
    /* 'up' is the smallest CTC that works; prefer a round figure, but never one that falls into a dip */
    var grid = [1000, 100, 10, 1];
    for (var g = 0; g < grid.length; g++) { var c = Math.ceil(up / grid[g]) * grid[g]; if (ih(c) >= target) return c; }
    var near = peaks.filter(function (p) { return p[1] >= target && p[0] <= up + 1; }).map(function (p) { return p[0]; });
    if (near.length) return Math.min.apply(null, near);
    c = Math.ceil(hi / 1000) * 1000;
    while (ih(c) < target) c += 1000;
    return c;
  }

  /* exposed for the interaction test and for curious users in the console */
  window.STX = { parseAmount: parseAmount, taxOn: taxOn, structure: structure, calc: calc, breakEven: breakEven, solveCTC: solveCTC, inr: inr };

  /* ================================================================ state */
  var MODES = ['salary', 'compare', 'hike', 'reverse'];
  var STATES = ['AP', 'AS', 'BR', 'CG', 'DL', 'GA', 'GJ', 'HR', 'HP', 'JK', 'JH', 'KA', 'KL', 'MP', 'MH', 'MN', 'ML', 'MZ', 'NL', 'OD', 'PY', 'PB', 'RJ', 'SK', 'TN', 'TS', 'TR', 'UP', 'UK', 'WB'];
  var DEF = { mode: 'salary', ctc: '15L', hike: '10', target: '1L', bonus: '', regime: 'new', age: 'below60', basicPct: '50', city: 'metro', hraPct: '50',
    pf: 'full', nps: '0', grat: true, state: 'MH', pt: '', ptManual: false, rent: '20000', c80: '', d80s: '', d80p: '', par60: false, ccd: '', hl: '' };
  function clean(o) {
    var x = Object.assign({}, DEF);
    if (o && typeof o === 'object') Object.keys(DEF).forEach(function (k) { if (o[k] !== undefined && typeof o[k] === typeof DEF[k]) x[k] = o[k]; });
    if (MODES.indexOf(x.mode) < 0) x.mode = 'salary';
    if (x.regime !== 'old') x.regime = 'new';
    if (['below60', 'age60', 'age80'].indexOf(x.age) < 0) x.age = 'below60';
    if (['full', 'cap', 'none'].indexOf(x.pf) < 0) x.pf = 'full';
    if (x.city !== 'other') x.city = 'metro';
    if (x.state !== 'other' && STATES.indexOf(x.state) < 0) x.state = 'MH';
    return x;
  }
  var s = clean(store.get('s', null));
  function save() { store.set('s', s); }
  var last = null;   // what is on screen now (for print / copy / CSV)

  /* ================================================================ small render helpers */
  function regName(r) { return t(r === 'old' ? 'reg_old_l' : 'reg_new_l'); }
  function stat(k, v, sub, id) {
    return el('div', { class: 'stat' }, el('div', { class: 'k', text: t(k) }), el('div', { class: 'v', id: id, text: v }), sub ? el('div', { class: 's', text: sub }) : null);
  }
  function note(key, cls, vars) { return el('div', { class: 'card' }, el('p', { class: 'callout ' + (cls || '') + ' mb0', text: t(key, vars) })); }
  function warnBox(list) {
    if (!list || !list.length) return null;
    return el('div', { class: 'warns' }, list.map(function (w) { return el('p', { class: 'callout warning', text: t(w[0], w[1]) }); }));
  }
  function tableOf(head, rows) {
    return el('div', { class: 'scroll-x' }, el('table', { class: 'table' },
      el('thead', {}, el('tr', {}, head.map(function (h, i) { return el('th', { class: i ? 'num' : '', text: h }); }))),
      el('tbody', {}, rows)));
  }
  function tr(cells, cls) {
    return el('tr', { class: cls || '' }, cells.map(function (c, i) { return el('td', { class: i ? 'num' : '', text: c == null ? '' : c }); }));
  }
  function money(v) { return v == null ? '' : inr(v); }

  function heroCard(c, other) {
    var card = el('div', { class: 'card hero' },
      el('div', { class: 'lbl', text: t('res_inhand') }),
      el('div', { class: 'big-number', id: 'inhand', text: inr(c.inHand) }),
      el('div', { class: 'sub', text: t('res_inhand_sub', { regime: regName(c.regime) }) }));
    card.appendChild(el('div', { class: 'stats' },
      stat('st_tax', inr(c.tax), null, 'annualTax'),
      stat('st_tds', inr(c.tds), null, 'tds'),
      stat('st_eff', pctTxt(c.eff), t('st_eff_sub'), 'eff'),
      stat('st_takehome', inr(c.inHand * 12 + c.b.bonus), null, 'takeHome')));
    if (c.b.bonus > 0) card.appendChild(el('p', { class: 'muted small', id: 'bonusNote', style: { margin: '12px 0 0' },
      text: t('bonus_note', { bonus: inr(c.b.bonus), tds: inr(c.tdsNoBonus), btax: inr(c.bonusTax) }) }));
    if (other) {
      var d = other.tax - c.tax;
      var msg = d === 0 ? t('other_same') : d < 0 ? t('other_better', { other: regName(other.regime), amt: inr(-d) }) : t('other_worse', { other: regName(other.regime), amt: inr(d) });
      card.appendChild(el('div', { class: 'callout ' + (d < 0 ? 'warning' : 'success') + ' row spread', style: { marginTop: '14px' } },
        el('span', { id: 'otherMsg', text: msg }),
        el('button', { class: 'btn btn-sm', type: 'button', text: t('see_compare'), onclick: function () { setMode('compare'); } })));
    }
    return card;
  }

  var PARTS = [['leg_inhand', '--c4'], ['leg_bonus', '--c7'], ['leg_tax', '--c2'], ['leg_pf', '--c1'], ['leg_grat', '--c3'], ['leg_nps', '--c6'], ['leg_pt', '--c8']];
  function chartCard(c) {
    var b = c.b, vals = [Math.max(0, c.inHand * 12), Math.max(0, c.bonusNet), c.tax, b.empPF + b.eePF, b.grat, b.nps, b.pt];
    var tot = vals.reduce(function (a, x) { return a + x; }, 0) || 1;
    var bar = el('div', { class: 'bar', role: 'img', 'aria-label': t('chart_title') });
    var leg = el('ul', { class: 'legend' });
    PARTS.forEach(function (p, i) {
      if (vals[i] <= 0) return;
      var col = 'var(' + p[1] + ')';
      bar.appendChild(el('span', { style: { width: (vals[i] / tot * 100) + '%', background: col }, title: t(p[0]) + ': ' + inr(vals[i]) }));
      leg.appendChild(el('li', {}, el('span', { class: 'sw', style: { background: col } }), el('span', { class: 'nm', text: t(p[0]) }),
        el('span', { class: 'num', text: inr(vals[i]) + ' · ' + pctTxt(vals[i] / tot * 100, vals[i] / tot < 0.01 ? 1 : 0) })));
    });
    return el('div', { class: 'card', id: 'chartCard' }, el('h2', { text: t('chart_title') }),
      el('p', { class: 'muted small mb0', text: t('chart_sub', { ctc: inrW(c.ctc) }) }), bar, leg);
  }

  /* rows: [label, monthly, yearly, cls] — used by the table, CSV and the copied text */
  function breakupRows(c) {
    var b = c.b, r = [];
    r.push([t('r_basic'), b.basic / 12, b.basic]);
    r.push([t('r_hra'), b.hra / 12, b.hra]);
    r.push([t('r_special'), b.special / 12, b.special]);
    r.push([t('r_gross_m'), b.grossMonthly, b.grossMonthly * 12, 'tot']);
    if (b.bonus) r.push([t('r_bonus'), null, b.bonus]);
    if (b.empPF) r.push([t('r_emp_pf'), b.empPF / 12, b.empPF]);
    if (b.nps) r.push([t('r_emp_nps'), b.nps / 12, b.nps]);
    if (b.grat) r.push([t('r_grat'), b.grat / 12, b.grat]);
    r.push([t('r_ctc'), b.ctc / 12, b.ctc, 'tot']);
    r.push([t('deduct_head'), null, null, 'head']);
    if (b.eePF) r.push([t('r_ee_pf'), -b.eePF / 12, -b.eePF]);
    if (b.pt) r.push([t('r_pt'), -b.pt / 12, -b.pt]);
    r.push([t('r_tds'), -c.tds, -c.tax]);
    r.push([t('r_net'), c.inHand, c.inHand * 12, 'tot']);
    if (b.bonus) r.push([t('leg_bonus'), null, b.bonus]);
    return r;
  }
  function breakupTable(c) {
    return tableOf([t('col_item'), t('col_month'), t('col_year')], breakupRows(c).map(function (x) {
      return x[3] === 'head' ? el('tr', { class: 'head' }, el('td', { colspan: '3', text: x[0] })) : tr([x[0], money(x[1]), money(x[2])], x[3]);
    }));
  }
  function breakupCard(c) { return el('div', { class: 'card', id: 'breakupCard' }, el('h2', { text: t('tbl_title') }), breakupTable(c)); }

  /* tax working: [label, value text, cls] */
  function workRows(w) {
    var T = w.tax, old = w.regime === 'old', cfg = old ? R.oldRegime : R.newRegime, r = [];
    function line(k, v, vars, cls) { r.push([t(k, vars), v, cls]); }
    function minus(v) { return inr(-Math.abs(v)); }
    line('w_gross', inr(w.pay));
    if (w.gross > w.pay + 0.5) line('w_nps_add', plus(w.gross - w.pay));
    if (w.perq) line('w_perq', plus(w.perq), { cap: inr(R.salary.employerRetirementCap) });
    if (w.hraEx) line('w_hra', minus(w.hraEx));
    line('w_sd', minus(w.sd), { amt: inr(cfg.standardDeduction) });
    if (w.pt) line('w_pt', minus(w.pt));
    if (w.npsD) line('w_nps', minus(w.npsD), { pct: pctTxt(cfg.employerNpsLimit * 100, 0) });
    if (w.hl) line('w_hl', minus(w.hl));
    if (w.c80) line('w_80c', minus(w.c80));
    if (w.d80) line('w_80d', minus(w.d80));
    if (w.ccd) line('w_ccd', minus(w.ccd));
    line('w_taxable', inr(T.taxable), null, 'tot');
    T.rows.forEach(function (x) {
      line(x.to === Infinity ? 'w_slab_top' : 'w_slab', inr(x.tax), { rate: pctTxt(x.rate * 100, 0), from: inr(x.from), to: inr(x.to) }, 'sub');
    });
    line('w_slabtax', inr(T.base));
    if (T.rebate) line('w_rebate', minus(T.rebate), { sec: cfg.rebate.section + ' / ' + cfg.rebate.was, limit: inr(cfg.rebate.incomeLimit) });
    if (T.relief) line('w_relief', minus(T.relief), { limit: inr(cfg.rebate.incomeLimit) });
    if (T.sur + T.surRelief > 0) line('w_sur', plus(T.sur + T.surRelief), { rate: pctTxt(T.sRate * 100, 0) });
    if (T.surRelief) line('w_sur_relief', minus(T.surRelief));
    line('w_cess', plus(T.cess), { rate: pctTxt(R.cess * 100, 0) });
    line('w_total', inr(T.total), null, 'tot');
    return r;
  }
  function workTable(w) {
    return tableOf([t('col_item'), t('col_amount')], workRows(w).map(function (x) { return tr([x[0], x[1]], x[2]); }));
  }
  function workCard(w, id) {
    return el('details', { class: 'card work', id: id || 'workCard' },
      el('summary', { text: t('work_title', { regime: regName(w.regime) }) }),
      workTable(w), el('p', { class: 'muted-note', text: t('w_round') }));
  }
  function fullResult(out, c, other) {
    out.appendChild(heroCard(c, other));
    var wb = warnBox(c.b.warn); if (wb) out.appendChild(wb);
    out.appendChild(chartCard(c));
    out.appendChild(breakupCard(c));
    out.appendChild(workCard(c.w));
  }

  /* ================================================================ the four modes */
  function renderSalary(out, ctc) {
    var c = calc(ctc, s, s.regime), other = calc(ctc, s, s.regime === 'new' ? 'old' : 'new');
    fullResult(out, c, other);
    var d = other.tax - c.tax;
    return { c: c, lines: [d === 0 ? t('other_same') : d < 0 ? t('other_better', { other: regName(other.regime), amt: inr(-d) }) : t('other_worse', { other: regName(other.regime), amt: inr(d) })] };
  }

  function renderCompare(out, ctc) {
    var nw = calc(ctc, s, 'new'), od = calc(ctc, s, 'old'), be = breakEven(ctc, s);
    var d = od.tax - nw.tax;
    var verdict = d > 0 ? t('cmp_new_wins', { amt: inr(d), m: inr(d / 12) }) : d < 0 ? t('cmp_old_wins', { amt: inr(-d), m: inr(-d / 12) }) : t('cmp_tie', { amt: inr(nw.tax) });
    var max = Math.max(nw.tax, od.tax, 1);
    function barRow(c, col) {
      var wins = d !== 0 && (d > 0) === (c.regime === 'new');
      return el('div', { class: 'cmp-row' }, el('div', { text: t(c.regime === 'old' ? 'reg_old' : 'reg_new') + (wins ? ' ✓' : '') }),
        el('div', {}, el('div', { class: 'track' }, el('div', { class: 'fill', style: { width: (c.tax / max * 100) + '%', background: 'var(' + col + ')' } })),
          el('div', { class: 'bar-val', text: inr(c.tax) + ' · ' + t('per_year') })));
    }
    function ded(c) { return c.w.sd + c.w.npsD + c.w.oldDed; }
    var rows = [
      tr([t('w_gross'), inr(nw.w.pay), inr(od.w.pay)]),
      tr([t('cmp_ded'), inr(ded(nw)), inr(ded(od))]),
      tr([t('w_taxable'), inr(nw.w.tax.taxable), inr(od.w.tax.taxable)]),
      tr([t('st_tax'), inr(nw.tax), inr(od.tax)], 'tot'),
      tr([t('st_tds'), inr(nw.tds), inr(od.tds)]),
      tr([t('res_inhand'), inr(nw.inHand), inr(od.inHand)], 'tot'),
      tr([t('st_eff'), pctTxt(nw.eff), pctTxt(od.eff)])
    ];
    var beTxt = be.never ? t('be_never') : be.be === 0 ? t('be_zero')
      : be.cur >= be.be ? t('be_old', { be: inr(be.be), cur: inr(be.cur) })
      : t('be_need', { be: inr(be.be), cur: inr(be.cur), gap: inr(be.be - be.cur) });
    out.appendChild(el('div', { class: 'card stack', id: 'cmpCard' },
      el('h2', { text: t('cmp_title') }),
      el('p', { class: 'verdict win', id: 'verdict', text: verdict }),
      el('div', { class: 'cmp-bars', role: 'img', 'aria-label': verdict }, barRow(nw, '--c1'), barRow(od, '--c2')),
      tableOf([t('col_item'), t('reg_new'), t('reg_old')], rows)));
    out.appendChild(el('div', { class: 'card' }, el('h2', { text: t('be_title') }), el('p', { class: 'mb0', id: 'beText', text: beTxt })));
    var wb = warnBox(nw.b.warn); if (wb) out.appendChild(wb);
    if (!amt(s.rent) && !amt(s.c80) && !amt(s.d80s) && !amt(s.hl)) out.appendChild(el('p', { class: 'callout', text: t('cmp_tip') }));
    out.appendChild(workCard(nw.w, 'workNew'));
    out.appendChild(workCard(od.w, 'workOld'));
    return { c: s.regime === 'old' ? od : nw, both: [nw, od], lines: [verdict, beTxt] };
  }

  /* hike %: a cut can take CTC to zero but not below it */
  function hikePct() { return EDU.clamp(num(s.hike, 0), -100, 1000); }
  function renderHike(out, ctc) {
    var h = hikePct(), ctc1 = ctc * (1 + h / 100);
    var s1 = Object.assign({}, s), bp = parseAmount(s.bonus, { pct: true });
    if (!bp.pct && !bp.bad && !bp.empty) s1.bonus = bp.value * (1 + h / 100);   // bonus keeps its share of CTC (a number, not typed text)
    var a = calc(ctc, s, s.regime), z = calc(ctc1, s1, s.regime);
    var dIn = z.inHand - a.inHand, dCtcM = (ctc1 - ctc) / 12;
    function rowOf(k, x, y) { return tr([t(k), inr(x), inr(y), (y - x >= 0 ? plus(y - x) : inr(y - x))]); }
    /* a pay cut, a raise that lowers in-hand pay (just above the rebate limit), or a normal raise */
    var line = h < 0 ? t('cut_line', { ctc: inr(-dCtcM), inhand: dIn > 0 ? plus(dIn) : inr(dIn) })
      : dIn < -0.5 ? t('hike_less', { ctc: inr(dCtcM), inhand: inr(-dIn) })
      : t('hike_line', { ctc: inr(dCtcM), inhand: inr(dIn), pct: pctTxt(dCtcM ? dIn / dCtcM * 100 : 0, 0) });
    out.appendChild(el('div', { class: 'card stack', id: 'hikeCard' },
      el('h2', { text: h < 0 ? t('cut_title', { pct: pctTxt(-h) }) : t('hike_title', { pct: pctTxt(h) }) }),
      el('p', { class: 'hike-line', id: 'hikeLine', text: line }),
      tableOf([t('col_item'), t('col_before'), t('col_after'), t('col_change')], [
        rowOf('r_ctc', ctc, ctc1),
        rowOf('r_gross_m', a.b.grossMonthly, z.b.grossMonthly),
        rowOf('res_inhand', a.inHand, z.inHand),
        rowOf('st_tax', a.tax, z.tax),
        rowOf('st_tds', a.tds, z.tds)
      ])));
    fullResult(out, z, null);
    return { c: z, lines: [line] };
  }

  function renderReverse(out) {
    var p = parseAmount(s.target);
    if (p.bad) { out.appendChild(note(badKey(p), 'danger', { max: inrW(MAX_AMT) })); return null; }
    if (p.empty || !(p.value > 0)) { out.appendChild(note('empty_target')); return null; }
    var ctc = solveCTC(p.value, s, s.regime);
    if (!ctc) { out.appendChild(note('rev_too_high', 'danger')); return null; }
    var c = calc(ctc, s, s.regime);
    var line = t('rev_line', { target: inr(p.value), regime: regName(s.regime), ctc: inrW(ctc) });
    out.appendChild(el('div', { class: 'card hero', id: 'revCard' },
      el('div', { class: 'lbl', text: t('rev_title') }),
      el('div', { class: 'big-number', id: 'revCtc', text: inr(ctc) }),
      el('div', { class: 'sub', text: words(ctc) ? words(ctc) + ' · ' + t('per_year') : t('per_year') }),
      el('p', { class: 'mb0', style: { marginTop: '10px' }, text: line }),
      el('p', { class: 'muted small mb0', id: 'revCheck', text: t('rev_sub', { inhand: inr(c.inHand) }) })));
    fullResult(out, c, null);
    return { c: c, lines: [line] };
  }

  /* ================================================================ controls */
  /* labels whose numbers come from RULES_2026_27 (so next year only data.js changes) */
  function ruleVars() {
    var S = R.salary, O = R.oldRegime;
    return {
      pf_cap: { wage: inr(S.pfWageCeilingMonthly), pf: inr(S.pfWageCeilingMonthly * S.pfRate) },
      grat: { pct: pctTxt(S.gratuityRate * 100, 2) },
      nps_hint: { nw: pctTxt(R.newRegime.employerNpsLimit * 100, 0), od: pctTxt(O.employerNpsLimit * 100, 0) },
      ccd: { max: inr(O.limits.sec80CCD1B) },
      hl: { max: inr(O.limits.homeLoanInterest) },
      metro_list: { metro: pctTxt(O.hraExemption.metro * 100, 0), other: pctTxt(O.hraExemption.other * 100, 0) }
    };
  }
  function rt(k) { return t(k, ruleVars()[k]); }
  function ruleTexts() { EDU.$$('[data-rk]').forEach(function (n) { n.textContent = rt(n.getAttribute('data-rk')); }); }

  function hdrYearTxt() { return t('hdr_year', { year: R.taxYear, from: fmtDate(R.from), to: fmtDate(R.to) }); }
  function hdrNoteTxt() { return t('hdr_note', { date: fmtDate(R.checked) }); }

  function buildStates() {
    var sel = $('#state'), tag = EDU.langInfo(EDU.lang).tag;
    sel.innerHTML = '';
    STATES.map(function (code) { return { code: code, name: t('st_' + code) }; })
      .sort(function (a, b) { return a.name.localeCompare(b.name, tag); })
      .forEach(function (x) { sel.appendChild(el('option', { value: x.code, text: x.name })); });
    sel.appendChild(el('option', { value: 'other', text: t('st_other') }));
    sel.value = s.state;
  }
  function fillInputs() {
    EDU.$$('[data-k]').forEach(function (inp) {
      var k = inp.dataset.k;
      if (inp.type === 'checkbox') inp.checked = !!s[k]; else if (k !== 'pt' || s.ptManual) inp.value = s[k] == null ? '' : s[k];
    });
  }
  function setPrev(id, txt, bad) { var n = $(id); n.textContent = txt || ''; n.classList.toggle('bad', !!bad); }
  function previews(ctc) {
    var p = parseAmount(s.ctc, { lakhIfSmall: true });
    setPrev('#ctcPrev', p.empty ? '' : p.bad ? badTxt(p) : '= ' + inrW(p.value) + (p.guessed ? ' · ' + t('guessed_lakh') : ''), p.bad);
    var h = hikePct();
    setPrev('#hikePrev', ctc > 0 ? t('new_ctc', { ctc: inrW(ctc * (1 + h / 100)) }) : '');
    var q = parseAmount(s.target);
    setPrev('#targetPrev', q.empty ? '' : q.bad ? badTxt(q) : '= ' + inrW(q.value) + ' · ' + t('per_month'), q.bad);
    var bp = parseAmount(s.bonus, { pct: true });
    setPrev('#bonusPrev', bp.empty ? '' : bp.bad ? badTxt(bp) : '= ' + inrW(bp.pct ? (ctc || 0) * Math.min(bp.value, 100) / 100 : bp.value) + ' · ' + t('per_year'), bp.bad);
  }
  function syncControls() {
    EDU.$$('#tabs [role="tab"]').forEach(function (b) {
      var on = b.dataset.mode === s.mode;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    $('#results').setAttribute('aria-labelledby', 'tab-' + s.mode);
    $('#fCtc').hidden = s.mode === 'reverse';
    $('#fHike').hidden = s.mode !== 'hike';
    $('#fTarget').hidden = s.mode !== 'reverse';
    $('#fRegime').hidden = s.mode === 'compare';
    var lk = s.mode === 'hike' ? 'ctc_now' : 'ctc', lbl = $('#ctcLbl');
    lbl.setAttribute('data-i18n', lk); lbl.textContent = t(lk);
    EDU.$$('[data-regime]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.regime === s.regime ? 'true' : 'false'); });
    EDU.$$('[data-city]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.city === s.city ? 'true' : 'false'); });
    EDU.$$('[data-basic]').forEach(function (b) { b.setAttribute('aria-pressed', String(num(s.basicPct)) === b.dataset.basic ? 'true' : 'false'); });
    $('#hdrYear').textContent = hdrYearTxt();
    $('#hdrNote').textContent = hdrNoteTxt();
  }

  /* ================================================================ main update */
  function update(ptReset) {
    syncControls();
    ruleTexts();
    var out = $('#results');
    out.innerHTML = '';
    var p = parseAmount(s.ctc, { lakhIfSmall: true }), ctc = !p.bad && p.value > 0 ? p.value : 0;
    previews(ctc);
    var res = null;
    if (s.mode === 'reverse') res = renderReverse(out);
    else if (p.bad) out.appendChild(note(badKey(p), 'danger', { max: inrW(MAX_AMT) }));
    else if (!ctc) out.appendChild(note('empty_ctc'));
    else if (s.mode === 'compare') res = renderCompare(out, ctc);
    else if (s.mode === 'hike') res = renderHike(out, ctc);
    else res = renderSalary(out, ctc);
    last = res ? Object.assign({ mode: s.mode }, res) : null;
    var qt = '';
    if (res && res.c) qt = s.mode === 'compare' ? res.lines[0] : s.mode === 'reverse' ? t('rev_title') + ': ' + inr(res.c.ctc) : t('res_inhand') + ': ' + inr(res.c.inHand);
    $('#quickTxt').textContent = qt;
    $('#quick').hidden = !qt;
    var b = res && res.c ? res.c.b : structure(ctc, s);
    var ptIn = $('#pt');
    if (!s.ptManual && (ptReset || document.activeElement !== ptIn)) ptIn.value = String(Math.round(b.pt));
    $('#c80Hint').textContent = t('c80_hint', { pf: inr(b.eePF), cap: inr(R.oldRegime.limits.sec80C) });
  }
  function setMode(m) {
    if (MODES.indexOf(m) < 0) return;
    s.mode = m; save();
    if (m === 'compare') $('#dedBox').open = true;
    update();
  }

  /* ================================================================ print / copy / CSV */
  function inputRows() {
    var p = parseAmount(s.ctc, { lakhIfSmall: true }), q = parseAmount(s.target), bp = parseAmount(s.bonus, { pct: true });
    var pfTxt = s.pf === 'cap' ? rt('pf_cap') : t(s.pf === 'none' ? 'pf_none' : 'pf_full');
    var rows = [];
    if (s.mode === 'reverse') rows.push([t('target'), q.bad || q.empty ? '' : inr(q.value)]);
    else rows.push([t(s.mode === 'hike' ? 'ctc_now' : 'ctc'), p.bad || p.empty ? '' : inrW(p.value)]);
    if (s.mode === 'hike') rows.push([t('hike_pct'), pctTxt(hikePct())]);
    rows.push([t('bonus'), bp.empty || bp.bad ? inr(0) : bp.pct ? pctTxt(bp.value) : inr(bp.value)]);
    rows.push([t('regime'), s.mode === 'compare' ? t('reg_new') + ' / ' + t('reg_old') : t(s.regime === 'old' ? 'reg_old' : 'reg_new')]);
    rows.push([t('age'), t(s.age === 'age60' ? 'age_60' : s.age === 'age80' ? 'age_80' : 'age_lt60')]);
    rows.push([t('basic_pct'), pctTxt(num(s.basicPct, 50))]);
    rows.push([t('city'), t(s.city === 'metro' ? 'city_metro' : 'city_other')]);
    rows.push([t('hra_pct'), pctTxt(num(s.hraPct, 0))]);
    rows.push([t('pf'), pfTxt]);
    rows.push([t('nps'), pctTxt(num(s.nps, 0))]);
    rows.push([rt('grat'), t(s.grat ? 'yes' : 'no')]);
    rows.push([t('state'), t('st_' + s.state)]);
    if (last && last.c) rows.push([t('pt'), inr(last.c.b.pt)]);
    if (s.regime === 'old' || s.mode === 'compare') {
      [['rent', s.rent], ['c80', s.c80], ['d80s', s.d80s], ['d80p', s.d80p], ['ccd', s.ccd], ['hl', s.hl]].forEach(function (x) { if (amt(x[1])) rows.push([rt(x[0]), inr(amt(x[1]))]); });
      if (s.par60) rows.push([t('par60'), t('yes')]);
    }
    return rows;
  }
  function keyRows(c) {
    return [[t('res_inhand'), inr(c.inHand)], [t('st_tax'), inr(c.tax)], [t('st_tds'), inr(c.tds)], [t('st_eff'), pctTxt(c.eff)], [t('r_ctc'), inrW(c.ctc)]];
  }
  function pairTable(rows) {
    return el('table', {}, el('tbody', {}, rows.map(function (r) { return el('tr', {}, el('td', { text: r[0] }), el('td', { class: 'num', text: r[1] })); })));
  }
  function buildPrint() {
    var pa = $('#printArea');
    pa.innerHTML = '';
    if (!last || !last.c) return;
    var c = last.c, today = new Date().toISOString().slice(0, 10);
    var box = el('div', { class: 'pw' },
      el('h1', { text: t('sum_title') }),
      el('p', { text: hdrYearTxt() + ' ' + hdrNoteTxt() }),
      el('h2', { text: t('sum_inputs') }), pairTable(inputRows()),
      el('h2', { text: t('sum_result') }), pairTable(keyRows(c)),
      (last.lines || []).map(function (l) { return el('p', { text: l }); }),
      el('h2', { text: t('tbl_title') }), breakupTable(c));
    (last.both || [c]).forEach(function (x) { box.appendChild(el('h2', { text: t('work_title', { regime: regName(x.regime) }) })); box.appendChild(workTable(x.w)); });
    box.appendChild(el('p', { class: 'note', text: t('sum_made', { date: fmtDate(today) }) + ' ' + t('privacy') + ' ' + t('scope') }));
    pa.appendChild(box);
  }
  function summaryText() {
    if (!last || !last.c) return '';
    var c = last.c, L = [t('sum_title'), hdrYearTxt(), hdrNoteTxt(), ''];
    inputRows().forEach(function (r) { L.push(r[0] + ': ' + r[1]); });
    L.push('');
    keyRows(c).forEach(function (r) { L.push(r[0] + ': ' + r[1]); });
    (last.lines || []).forEach(function (l) { L.push(l); });
    L.push('');
    breakupRows(c).forEach(function (r) { if (r[3] !== 'head') L.push(r[0] + ': ' + (r[1] == null ? '' : inr(r[1]) + ' / ') + inr(r[2])); });
    L.push('', t('sum_made', { date: fmtDate(new Date().toISOString().slice(0, 10)) }));
    return L.join('\n');
  }
  function exportCSV() {
    if (!last || !last.c) { EDU.toast(t('empty_ctc')); return; }
    var c = last.c, rows = [[t('sum_title'), hdrYearTxt()], [], [t('col_item'), t('col_month'), t('col_year')]];
    breakupRows(c).forEach(function (r) { if (r[3] !== 'head') rows.push([r[0], r[1] == null ? '' : Math.round(r[1]), Math.round(r[2])]); else rows.push([r[0]]); });
    (last.both || [c]).forEach(function (x) {
      rows.push([], [t('work_title', { regime: regName(x.regime) }), '', t('col_amount')]);
      workRows(x.w).forEach(function (r) { rows.push([r[0], '', r[1].replace(/[₹,\u2066-\u2069]/g, '').replace('−', '-')]); });
    });
    rows.push([], [hdrNoteTxt()]);
    EDU.download('salary-tax-' + R.taxYear + '.csv', EDU.csv.stringify(rows), 'text/csv');
  }

  /* ================================================================ events */
  function onField(e) {
    var k = e.target && e.target.dataset && e.target.dataset.k;
    if (!k) return;
    s[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    if (k === 'pt') s.ptManual = String(e.target.value).trim() !== '';
    if (k === 'state') { s.ptManual = false; s.pt = ''; }
    save(); update(k === 'state');
  }
  $('#inputs').addEventListener('input', onField);
  $('#inputs').addEventListener('change', function (e) { if (e.target.tagName === 'SELECT' || e.target.type === 'checkbox') onField(e); });
  EDU.$$('[data-regime]').forEach(function (b) {
    b.addEventListener('click', function () { s.regime = b.dataset.regime; if (s.regime === 'old') $('#dedBox').open = true; save(); update(); });
  });
  EDU.$$('[data-city]').forEach(function (b) {
    b.addEventListener('click', function () {
      s.city = b.dataset.city; s.hraPct = String(R.salary.hraOfBasic[s.city]); $('#hraPct').value = s.hraPct; save(); update();
    });
  });
  EDU.$$('[data-basic]').forEach(function (b) {
    b.addEventListener('click', function () { s.basicPct = b.dataset.basic; $('#basicPct').value = s.basicPct; save(); update(); });
  });
  var tabs = EDU.$$('#tabs [role="tab"]');
  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () { setMode(b.dataset.mode); });
    b.addEventListener('keydown', function (e) {
      var rtl = document.documentElement.dir === 'rtl', step = 0;
      if (e.key === 'ArrowRight') step = rtl ? -1 : 1; else if (e.key === 'ArrowLeft') step = rtl ? 1 : -1;
      else if (e.key === 'Home') step = -i; else if (e.key === 'End') step = tabs.length - 1 - i;
      if (!step) return;
      e.preventDefault();
      var n = tabs[(i + step + tabs.length) % tabs.length];
      setMode(n.dataset.mode); n.focus();
    });
  });
  $('#printBtn').addEventListener('click', function () { buildPrint(); window.print(); });
  window.addEventListener('beforeprint', buildPrint);
  $('#copyBtn').addEventListener('click', function () {
    var txt = summaryText();
    if (!txt) { EDU.toast(t('empty_ctc')); return; }
    Promise.resolve(EDU.copy(txt)).then(function () { EDU.toast(t('copied')); }, function () { EDU.toast(t('copied')); });
  });
  $('#csvBtn').addEventListener('click', exportCSV);
  $('#resetBtn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    s = clean(null); save();
    fillInputs(); buildStates(); update();
  });

  EDU.onLang(function () { buildStates(); update(); });
  buildStates();
  fillInputs();
  if (s.mode === 'compare' || s.regime === 'old') $('#dedBox').open = true;
  update();
})();
