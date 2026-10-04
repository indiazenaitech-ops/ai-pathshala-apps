/* EMI, SIP & FD Calculator
   Loan EMI with a full repayment schedule, prepayments, floating-rate changes, fees -> APR,
   flat-vs-reducing rate, "no-cost EMI" and affordability checks; SIP (step-up, goal planner),
   FD / RD (quarterly compounding, Indian bank convention) and PPF.
   All maths runs on this device. Nothing is sent anywhere. */
(function () {
  'use strict';
  var SLUG = 'emi-savings-calculator';
  var store = EDU.store(SLUG);
  var el = EDU.el, $ = EDU.$, $$ = EDU.$$, esc = EDU.esc;
  /* EDU.t, but in right-to-left pages every inserted value (₹ amounts, %, dates) is wrapped in a
     first-strong isolate, so Urdu sentences keep "₹16,63,670" and "8.5%" in one piece. */
  function t(key, vars) {
    if (vars && document.documentElement.dir === 'rtl') {
      var o = {};
      Object.keys(vars).forEach(function (k) { o[k] = '\u2068' + vars[k] + '\u2069'; });
      vars = o;
    }
    return EDU.t(key, vars);
  }
  function plain(s) { return typeof s === 'string' ? s.replace(/[\u2066-\u2069]/g, '') : s; }

  /* ================================================================ maths (pure) */
  var F = {};
  /* EMI = P r (1+r)^n / ((1+r)^n - 1); r = monthly rate (fraction), n = months. 0 % -> P / n */
  F.emi = function (P, r, n) {
    if (n <= 0) return P;
    if (Math.abs(r) < 1e-12) return P / n;
    var f = Math.pow(1 + r, n);
    return P * r * f / (f - 1);
  };
  /* present value of n monthly payments */
  F.pv = function (pmt, i, n) { return Math.abs(i) < 1e-12 ? pmt * n : pmt * (1 - Math.pow(1 + i, -n)) / i; };
  /* months needed to clear bal with this EMI (Infinity if the EMI does not even cover the interest) */
  F.nper = function (bal, r, emi) {
    if (bal <= 0.005) return 0;
    if (!(emi > 0)) return Infinity;
    if (Math.abs(r) < 1e-12) return Math.max(1, Math.ceil(bal / emi - 1e-6));
    var x = 1 - bal * r / emi;
    if (x <= 1e-12) return Infinity;
    return Math.max(1, Math.ceil(-Math.log(x) / Math.log(1 + r) - 1e-6));
  };
  /* monthly rate i with pv = pmt * (1 - (1+i)^-n) / i  (IRR of a level loan) */
  F.rateFor = function (pv, pmt, n) {
    if (!(pv > 0) || !(pmt > 0) || !(n > 0)) return NaN;
    if (pmt * n <= pv * (1 + 1e-12)) return 0;
    var lo = 0, hi = 0.05;
    while (F.pv(pmt, hi, n) > pv && hi < 1e6) hi *= 2;
    for (var k = 0; k < 200; k++) {
      var mid = (lo + hi) / 2;
      if (F.pv(pmt, mid, n) > pv) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  };

  /* Loan schedule. o = { P, rate (% a year), n (months),
       pp: [{ amt, at (month no.), freq: once|yearly|monthly }], ppMode: tenure|emi, charge (% of prepayment),
       rc: [{ at (month no.), rate }], rcMode: tenure (keep EMI) | emi (keep tenure) } */
  F.loan = function (o) {
    var rate = o.rate, r = rate / 1200, bal = o.P, emi = F.emi(o.P, r, o.n), emi0 = emi;
    var pp = (o.pp || []).filter(function (p) { return p.amt > 0 && p.at >= 1; });
    var rc = (o.rc || []).filter(function (c) { return c.at >= 1 && c.rate >= 0; }).sort(function (a, b) { return a.at - b.at; });
    var rows = [], totI = 0, totPP = 0, totC = 0, totPay = 0, warnLow = false, capped = null, m, k;
    for (m = 1; bal > 0.005 && m <= 1200; m++) {
      var changed = false;
      for (k = 0; k < rc.length; k++) {
        if (rc[k].at !== m || rc[k].rate === rate) continue;
        var left = F.nper(bal, r, emi);                       /* months left at the old rate */
        if (!isFinite(left)) left = Math.max(1, o.n - m + 1);
        rate = rc[k].rate; r = rate / 1200; changed = true;
        if (o.rcMode === 'emi') emi = F.emi(bal, r, left);
        else {
          /* keep EMI: if it no longer covers the interest (or the loan would run past 100 years), raise it */
          var nNew = F.nper(bal, r, emi);
          if (!isFinite(nNew) || m - 1 + nNew > 1200) { emi = F.emi(bal, r, left); warnLow = true; }
        }
      }
      var interest = bal * r, pay = emi, prin = pay - interest;
      if (prin >= bal - 0.005) { prin = bal; pay = bal + interest; }   /* final (smaller) EMI */
      bal -= prin;
      var extra = 0;
      for (k = 0; k < pp.length; k++) {
        var p = pp[k];
        if (m === p.at || (m > p.at && (p.freq === 'monthly' || (p.freq === 'yearly' && (m - p.at) % 12 === 0)))) extra += p.amt;
      }
      var charge = 0;
      if (extra > 0 && bal > 0.005) {
        if (extra > bal + 0.005) { capped = { m: m, need: bal, asked: extra }; extra = bal; }
        var leftB = F.nper(bal, r, emi);
        bal -= extra;
        charge = extra * (o.charge || 0) / 100;
        if (o.ppMode === 'emi' && bal > 0.005 && isFinite(leftB)) emi = F.emi(bal, r, Math.max(1, leftB));
      } else extra = 0;
      if (bal < 0.005) bal = 0;
      totI += interest; totPP += extra; totC += charge; totPay += pay;
      rows.push({ m: m, rate: rate, emi: pay, prin: prin, int: interest, pp: extra, charge: charge, bal: bal, ev: changed || extra > 0 });
    }
    var last = rows[rows.length - 1] || { emi: 0 };
    return {
      emi0: emi0, emiEnd: emi, rows: rows, months: rows.length, totInt: totI, totPP: totPP, totCharge: totC,
      totPay: totPay, lastPay: last.emi, warnLow: warnLow, capped: capped, unpaid: bal > 0.005
    };
  };

  /* Flat rate: interest on the full amount for the whole tenure. flatYear = % a year. */
  F.flat = function (P, flatYear, n) {
    var interest = P * flatYear / 100 * n / 12, emi = (P + interest) / n, i = F.rateFor(P, emi, n);
    return { emi: emi, interest: interest, real: i * 1200, reducingEmi: F.emi(P, flatYear / 1200, n) };
  };

  /* "No-cost EMI": EMIs add up to the price; the bank's interest is given as an upfront discount. */
  F.noCost = function (o) {
    var emi = o.price / o.n, loan = F.pv(emi, o.rate / 1200, o.n), hidden = Math.max(0, o.price - loan);
    var gst = hidden * 0.18, feeG = o.fee * 1.18, extra = gst + feeG + o.cash;
    return { emi: emi, loan: loan, hidden: hidden, gst: gst, feeG: feeG, extra: extra, pct: extra / o.price * 100 };
  };

  /* SIP at the start of every month (annuity due), growth = rate / 12 each month; step-up once a year.
     One-time (lumpsum) amount grows once a year: L (1 + rate)^years. */
  F.sip = function (o) {
    var i = o.ret / 1200, a = o.ret / 100, val = 0, inv = 0, sip = o.amt, rows = [];
    for (var y = 1; y <= o.yrs; y++) {
      var invY = 0;
      for (var m = 0; m < 12; m++) { val = (val + sip) * (1 + i); invY += sip; }
      inv += invY;
      var lumpV = (o.lump || 0) * Math.pow(1 + a, y), total = val + lumpV, invested = inv + (o.lump || 0);
      rows.push({ y: y, sip: sip, invY: invY, invested: invested, value: total, gain: total - invested, real: total / Math.pow(1 + (o.inf || 0) / 100, y) });
      sip = sip * (1 + (o.step || 0) / 100);
    }
    var last = rows[rows.length - 1] || { invested: 0, value: 0, gain: 0, real: 0 };
    return { rows: rows, invested: last.invested, value: last.value, gain: last.gain, real: last.real };
  };
  /* monthly SIP needed to reach goalFuture */
  F.sipNeeded = function (goalFuture, o) {
    var unit = F.sip({ amt: 1, step: o.step, ret: o.ret, yrs: o.yrs, lump: 0, inf: 0 }).value;
    var lumpFV = (o.lump || 0) * Math.pow(1 + o.ret / 100, o.yrs);
    return Math.max(0, (goalFuture - lumpFV) / unit);
  };

  /* FD value after `months` (cumulative): quarterly compounding for whole quarters, simple interest for the
     months left over; under 6 months banks pay simple interest. */
  F.fdValue = function (P, rate, months) {
    var a = rate / 100;
    if (months < 6) return P * (1 + a * months / 12);
    var q = Math.floor(months / 3), rem = months % 3;
    return P * Math.pow(1 + a / 4, q) * (1 + a * rem / 12);
  };
  F.fd = function (o) {          /* { P, rate, months, payout: cum|month|quarter } */
    var a = o.rate / 100, rows = [], y, mm, prev = 0, tot = 0;
    var monthly = o.P * (a / 4) / (1 + (1 + a / 12) + Math.pow(1 + a / 12, 2));   /* discounted monthly payout */
    var quarterly = o.P * a / 4;
    function paidBy(months) {      /* interest paid out by month `months` (payout modes) */
      if (o.payout === 'month') return monthly * months;
      var q = Math.floor(months / 3), extra = months === o.months ? o.P * a * (months % 3) / 12 : 0;
      return quarterly * q + extra;
    }
    for (y = 1; (y - 1) * 12 < o.months; y++) {
      mm = Math.min(y * 12, o.months);
      var cumInt = o.payout === 'cum' ? F.fdValue(o.P, o.rate, mm) - o.P : paidBy(mm);
      rows.push({ y: y, months: mm, intY: cumInt - prev, cumInt: cumInt, value: o.payout === 'cum' ? o.P + cumInt : o.P });
      prev = cumInt; tot = cumInt;
    }
    var maturity = o.payout === 'cum' ? o.P + tot : o.P;
    var yieldPct = o.payout === 'cum' && o.months > 0 ? (Math.pow((o.P + tot) / o.P, 12 / o.months) - 1) * 100 : NaN;
    return { rows: rows, maturity: maturity, interest: tot, monthly: monthly, quarterly: quarterly, yieldPct: yieldPct };
  };
  /* RD: each monthly deposit compounds quarterly for the time it stays (fractional quarters). */
  F.rdValueAt = function (R, rate, t) {
    var g = Math.pow(1 + rate / 400, 1 / 3), s = 0, f = 1;
    for (var k = 1; k <= t; k++) { f *= g; s += R * f; }
    return s;
  };
  F.rd = function (o) {          /* { R, rate, months } */
    var rows = [];
    for (var y = 1; (y - 1) * 12 < o.months; y++) {
      var mm = Math.min(y * 12, o.months), v = F.rdValueAt(o.R, o.rate, mm);
      rows.push({ y: y, months: mm, depY: o.R * (mm - (y - 1) * 12), dep: o.R * mm, cumInt: v - o.R * mm, value: v });
    }
    var maturity = F.rdValueAt(o.R, o.rate, o.months);
    return { rows: rows, maturity: maturity, deposited: o.R * o.months, interest: maturity - o.R * o.months };
  };
  /* PPF: yearly compounding; interest on the lowest balance between the 5th and month end, credited on 31 March. */
  F.ppf = function (o) {         /* { D, rate, monthly, ext (extra years), extDep } */
    var a = o.rate / 100, bal = 0, rows = [], dep = Math.min(Math.max(0, o.D), 150000), totD = 0, totI = 0, years = 15 + (o.ext || 0);
    for (var y = 1; y <= years; y++) {
      var d = (y <= 15 || o.extDep) ? dep : 0, yi = 0;
      if (o.monthly) { for (var m = 0; m < 12; m++) { bal += d / 12; yi += bal * a / 12; } }
      else { bal += d; yi = bal * a; }
      bal += yi; totD += d; totI += yi;
      rows.push({ y: y, dep: d, int: yi, cumDep: totD, cumInt: totI, bal: bal });
    }
    return { rows: rows, deposited: totD, interest: totI, maturity: bal, years: years };
  };
  window.FINCALC = F;   /* handy for tests and for the curious */

  /* ================================================================ formatting */
  var NFC = {};
  function nf(v, d) {
    d = d || 0;
    var f = NFC[d] || (NFC[d] = new Intl.NumberFormat('en-IN', { maximumFractionDigits: d, minimumFractionDigits: 0 }));
    return f.format(v);
  }
  function rs(v) { v = Math.round(v); return (v < 0 ? '−' : '') + '₹' + nf(Math.abs(v)); }
  function pc(v, d) { return nf(v, d === undefined ? 2 : d) + '%'; }
  function trimNum(v, d) { return nf(Math.round(v * Math.pow(10, d)) / Math.pow(10, d), d); }
  function words(v) {
    var a = Math.abs(v);
    if (a >= 1e7) return t('w_cr', { n: trimNum(v / 1e7, 2) });
    if (a >= 1e5) return t('w_l', { n: trimNum(v / 1e5, 2) });
    if (a >= 1e3) return t('w_k', { n: trimNum(v / 1e3, 2) });
    return '';
  }
  function short(v) {
    var a = Math.abs(v);
    /* 1 lakh crore and above: "₹5.1L Cr" / "₹5.1 लाख करोड़" keeps chart labels short */
    if (a >= 1e12) return '₹' + t('s_l', { n: trimNum(v / 1e12, a >= 1e14 ? 0 : 1) }) + ' ' + plain(t('s_cr', { n: '' })).trim();
    if (a >= 1e7) return '₹' + t('s_cr', { n: trimNum(v / 1e7, a >= 1e9 ? 0 : 2) });
    if (a >= 1e5) return '₹' + t('s_l', { n: trimNum(v / 1e5, 1) });
    if (a >= 1e3) return '₹' + t('s_k', { n: trimNum(v / 1e3, 1) });
    return '₹' + nf(v);
  }
  function tenureTxt(months) {
    var y = Math.floor(months / 12), m = months % 12;
    if (y && m) return t('t_ym', { y: y, m: m });
    if (y) return t('t_y', { y: y });
    return t('t_m', { m: m });
  }
  var DTF = {};
  function monthName(idx) {          /* idx = year * 12 + month (0-11) */
    var L = EDU.lang;
    if (!DTF[L]) {
      try { DTF[L] = new Intl.DateTimeFormat(EDU.langInfo(L).tag, { month: 'short', year: 'numeric', numberingSystem: 'latn' }); }
      catch (e) { DTF[L] = new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }); }
    }
    return DTF[L].format(new Date(Math.floor(idx / 12), idx % 12, 1));
  }
  function fyOf(idx) { var y = Math.floor(idx / 12), mo = idx % 12; return mo >= 3 ? y : y - 1; }
  function fyLabel(a) { return t('fy_lbl', { a: a, b: String(a + 1).slice(-2) }); }

  /* digits typed on an Indian-language keyboard -> 0-9; "10L", "1.5cr", "50k" shorthands for money */
  var ZEROS = [0x966, 0x9E6, 0xA66, 0xAE6, 0xB66, 0xBE6, 0xC66, 0xCE6, 0xD66, 0x660, 0x6F0];
  function toLatin(s) {
    return String(s == null ? '' : s).replace(/[०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯٠-٩۰-۹]/g, function (c) {
      var code = c.charCodeAt(0);
      for (var i = 0; i < ZEROS.length; i++) if (code >= ZEROS[i] && code <= ZEROS[i] + 9) return String(code - ZEROS[i]);
      return c;
    });
  }
  var MULT = { k: 1e3, th: 1e3, l: 1e5, lac: 1e5, lacs: 1e5, lakh: 1e5, lakhs: 1e5, cr: 1e7, crore: 1e7, crores: 1e7 };
  function parseNum(s, money) {
    s = toLatin(s).replace(/[\s,₹_'%]/g, '').replace(/[٫]/g, '.').replace(/[−–]/g, '-').toLowerCase();
    if (s === '') return null;
    var m = /^(-?(?:\d+\.?\d*|\.\d+))([a-z]*)$/.exec(s);
    if (!m) return NaN;
    var v = parseFloat(m[1]);
    if (m[2]) { if (!money || !MULT[m[2]]) return NaN; v *= MULT[m[2]]; }
    return v;
  }

  /* ================================================================ state */
  function nextMonth() { var d = new Date(); var i = d.getFullYear() * 12 + d.getMonth() + 1; return Math.floor(i / 12) + '-' + ('0' + (i % 12 + 1)).slice(-2); }
  var DEF = {
    tab: 'emi',
    emiAmt: '30,00,000', emiRate: '8.5', emiYrs: '20', emiMos: '0', emiStart: '', preset: 'home',
    pp: [], ppMode: 'tenure', ppCharge: '0', rc: [], rcMode: 'tenure', view: 'yearly', chart: 'balance',
    aprFee: '0.5', aprOther: '10,000', aprGst: true,
    flAmt: '50,000', flRate: '1', flPer: 'month', flN: '12',
    ncPrice: '60,000', ncN: '6', ncRate: '16', ncFee: '199', ncCash: '0',
    afInc: '1,00,000', afOth: '0', afFoir: '40',
    sipMode: 'grow', sipAmt: '10,000', sipStep: '10', sipRet: '12', sipYrs: '15', sipLump: '0', sipInf: '6', sipGoal: '1,00,00,000', sipToday: true,
    fdKind: 'fd', fdAmt: '1,00,000', fdRate: '7', fdYrs: '5', fdMos: '0', fdPayout: 'cum', fdSenior: false, rdAmt: '5,000', rdRate: '6.5', rdN: '60',
    ppfAmt: '1,50,000', ppfRate: '7.1', ppfMode: 'yearly', ppfExt: '0', ppfExtDep: true
  };
  var ENUMS = {
    tab: ['emi', 'sip', 'fd', 'ppf'], preset: ['home', 'car', 'bike', 'personal', 'edu', ''], ppMode: ['tenure', 'emi'], rcMode: ['tenure', 'emi'],
    view: ['monthly', 'yearly', 'fy'], chart: ['balance', 'split'], flPer: ['month', 'year'], sipMode: ['grow', 'goal'],
    fdKind: ['fd', 'rd'], fdPayout: ['cum', 'month', 'quarter'], ppfMode: ['yearly', 'monthly'], ppfExt: ['0', '5', '10', '15', '20']
  };
  var MAX_ROWS = 10;
  function clean(raw) {
    var s = JSON.parse(JSON.stringify(DEF));
    s.emiStart = nextMonth();
    if (!raw || typeof raw !== 'object') return s;
    Object.keys(DEF).forEach(function (k) {
      if (!(k in raw)) return;
      var v = raw[k];
      if (k === 'pp' || k === 'rc') {
        if (!Array.isArray(v)) return;
        s[k] = v.filter(function (r) { return r && typeof r === 'object'; }).slice(0, MAX_ROWS).map(function (r) {
          return k === 'pp'
            ? { amt: String(r.amt == null ? '' : r.amt).slice(0, 20), at: String(r.at == null ? '' : r.at).slice(0, 6), freq: ['once', 'yearly', 'monthly'].indexOf(r.freq) >= 0 ? r.freq : 'once' }
            : { at: String(r.at == null ? '' : r.at).slice(0, 6), rate: String(r.rate == null ? '' : r.rate).slice(0, 8) };
        });
        return;
      }
      if (typeof v !== typeof DEF[k]) return;
      if (typeof v === 'string') v = v.slice(0, 24);
      if (ENUMS[k] && ENUMS[k].indexOf(v) < 0) return;
      s[k] = v;
    });
    if (!/^\d{4}-\d{2}$/.test(s.emiStart)) s.emiStart = nextMonth();
    return s;
  }
  var S = clean(store.get('s', null));
  var fromLink = false;
  (function readHash() {
    var m = /^#c=([A-Za-z0-9_-]+)$/.exec(location.hash || '');
    if (!m) return;
    var raw = EDU.unpack(m[1]);
    if (raw && typeof raw === 'object') {
      var merged = JSON.parse(JSON.stringify(S));
      Object.keys(raw).forEach(function (k) { if (k in DEF) merged[k] = raw[k]; });
      S = clean(merged); fromLink = true;
    }
    try { history.replaceState(history.state, '', location.href.split('#')[0]); } catch (e) { }
  })();
  var saveTimer = 0;
  function save() { clearTimeout(saveTimer); saveTimer = setTimeout(function () { saveTimer = 0; store.set('s', S); }, 250); }
  /* a reload or a closed tab right after typing must not lose the last change */
  function flushSave() { if (saveTimer) { clearTimeout(saveTimer); saveTimer = 0; store.set('s', S); } }
  window.addEventListener('pagehide', flushSave);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flushSave(); });
  function startIdx() { var m = /^(\d{4})-(\d{2})$/.exec(S.emiStart) || /^(\d{4})-(\d{2})$/.exec(nextMonth()); return (+m[1]) * 12 + (+m[2]) - 1; }

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ================================================================ number fields */
  var FIELDS = {
    emiAmt: { lbl: 'f_loan_amt', money: 1, min: 1, max: 1e10, step: 50000, slider: [10000, 1e8, 'log'], tab: 'emi' },
    emiRate: { lbl: 'f_rate', sfx: '%', min: 0, max: 50, step: 0.05, dec: 1, slider: [0, 20, 0.05], tab: 'emi' },
    emiYrs: { aria: 'f_years', sfx: 'sfx_years', min: 0, max: 40, step: 1, int: 1, tab: 'emi', noHint: 1 },
    emiMos: { aria: 'f_months', sfx: 'sfx_months', min: 0, max: 11, step: 1, int: 1, tab: 'emi', noHint: 1 },
    ppCharge: { lbl: 'pp_charge', sfx: '%', min: 0, max: 10, step: 0.5, dec: 1, opt: 1, hint: 'pp_charge_hint', tab: 'emi' },
    aprFee: { lbl: 'apr_fee', sfx: '%', min: 0, max: 20, step: 0.25, dec: 1, opt: 1, tab: 'emi' },
    aprOther: { lbl: 'apr_other', money: 1, min: 0, max: 1e9, step: 1000, opt: 1, tab: 'emi' },
    flAmt: { lbl: 'f_amount', money: 1, min: 1, max: 1e9, step: 5000, tab: 'emi' },
    flRate: { lbl: 'flat_rate', sfx: '%', min: 0, max: 100, step: 0.1, dec: 1, tab: 'emi', noHint: 1 },
    flN: { lbl: 'f_months_n', sfx: 'sfx_months', min: 1, max: 120, step: 1, int: 1, tab: 'emi' },
    ncPrice: { lbl: 'nc_price', money: 1, min: 1, max: 1e8, step: 1000, tab: 'emi' },
    ncN: { lbl: 'f_months_n', sfx: 'sfx_months', min: 1, max: 60, step: 1, int: 1, tab: 'emi' },
    ncRate: { lbl: 'nc_rate', sfx: '%', min: 0, max: 60, step: 0.5, dec: 1, tab: 'emi' },
    ncFee: { lbl: 'nc_fee', money: 1, min: 0, max: 1e6, step: 50, opt: 1, tab: 'emi' },
    ncCash: { lbl: 'nc_cash', money: 1, min: 0, max: 1e8, step: 500, opt: 1, hint: 'nc_cash_hint', tab: 'emi' },
    afInc: { lbl: 'af_income', money: 1, min: 1, max: 1e9, step: 5000, tab: 'emi' },
    afOth: { lbl: 'af_other', money: 1, min: 0, max: 1e9, step: 1000, opt: 1, tab: 'emi' },
    afFoir: { lbl: 'af_limit', sfx: '%', min: 10, max: 90, step: 5, slider: [20, 70, 5], tab: 'emi', hint: 'af_limit_hint' },
    sipGoal: { lbl: 'sip_goal_amt', money: 1, min: 1, max: 1e11, step: 100000, slider: [1e5, 1e9, 'log'], tab: 'sip' },
    sipAmt: { lbl: 'sip_amt', money: 1, min: 1, max: 1e8, step: 500, slider: [500, 1e6, 'log'], tab: 'sip' },
    sipStep: { lbl: 'sip_step', sfx: '%', min: 0, max: 50, step: 1, dec: 1, opt: 1, hint: 'sip_step_hint', tab: 'sip' },
    sipRet: { lbl: 'sip_ret', sfx: '%', min: 0, max: 50, step: 0.5, dec: 1, slider: [1, 30, 0.5], hint: 'sip_ret_hint', tab: 'sip' },
    sipYrs: { lbl: 'sip_yrs', sfx: 'sfx_years', min: 1, max: 50, step: 1, int: 1, slider: [1, 40, 1], tab: 'sip' },
    sipLump: { lbl: 'sip_lump', money: 1, min: 0, max: 1e10, step: 10000, opt: 1, tab: 'sip' },
    sipInf: { lbl: 'sip_inf', sfx: '%', min: 0, max: 20, step: 0.5, dec: 1, opt: 1, tab: 'sip', hint: 'sip_inf_hint' },
    fdAmt: { lbl: 'fd_amt', money: 1, min: 1, max: 1e10, step: 10000, slider: [1000, 1e8, 'log'], tab: 'fd' },
    fdRate: { lbl: 'f_rate', sfx: '%', min: 0, max: 20, step: 0.05, dec: 1, slider: [1, 12, 0.05], tab: 'fd' },
    fdYrs: { aria: 'f_years', sfx: 'sfx_years', min: 0, max: 20, step: 1, int: 1, tab: 'fd', noHint: 1 },
    fdMos: { aria: 'f_months', sfx: 'sfx_months', min: 0, max: 11, step: 1, int: 1, tab: 'fd', noHint: 1 },
    rdAmt: { lbl: 'rd_amt', money: 1, min: 1, max: 1e8, step: 500, slider: [100, 1e6, 'log'], tab: 'fd' },
    rdRate: { lbl: 'f_rate', sfx: '%', min: 0, max: 20, step: 0.05, dec: 1, slider: [1, 12, 0.05], tab: 'fd' },
    rdN: { lbl: 'rd_months', sfx: 'sfx_months', min: 1, max: 240, step: 1, int: 1, slider: [6, 120, 6], tab: 'fd' },
    ppfAmt: { lbl: 'ppf_amt', money: 1, min: 0, max: 1e8, step: 500, slider: [500, 150000, 500], tab: 'ppf' },
    ppfRate: { lbl: 'f_rate', sfx: '%', min: 0, max: 20, step: 0.05, dec: 1, tab: 'ppf' }
  };
  var PRESETS = {
    home: { emiAmt: 3000000, emiRate: 8.5, emiYrs: 20, emiMos: 0 },
    car: { emiAmt: 800000, emiRate: 9, emiYrs: 5, emiMos: 0 },
    bike: { emiAmt: 120000, emiRate: 11, emiYrs: 3, emiMos: 0 },
    personal: { emiAmt: 500000, emiRate: 12, emiYrs: 3, emiMos: 0 },
    edu: { emiAmt: 1000000, emiRate: 9.5, emiYrs: 7, emiMos: 0 }
  };

  /* value of a field: number, or NaN when empty / not a number / out of range (optional fields: empty = 0) */
  function num(id) {
    var f = FIELDS[id], v = parseNum(S[id], f.money);
    if (v === null) return f.opt ? 0 : NaN;
    if (isNaN(v) || v < f.min || v > f.max) return NaN;
    if (f.int && Math.floor(v) !== v) return NaN;      /* years / months / number of EMIs: whole numbers only */
    return v;
  }
  /* why a field is not accepted ('' when it is fine) */
  function fieldErr(id) {
    var f = FIELDS[id], raw = parseNum(S[id], f.money);
    if (!isNaN(num(id))) return '';
    if (raw === null) return t('err_empty');
    if (f.int && !isNaN(raw) && raw >= f.min && raw <= f.max) return t(f.sfx === 'sfx_years' && !f.lbl ? 'err_whole_tenure' : 'err_whole');
    return t('err_range', { a: f.money ? nf(f.min) : nf(f.min, 2), b: f.money ? nf(f.max) : nf(f.max, 2) });
  }
  function fmtField(id, v) { var f = FIELDS[id]; return f.money ? nf(Math.round(v)) : nf(v, f.dec ? 2 : 0).replace(/,/g, ''); }
  function sliderPos(f, v) {
    var s = f.slider;
    if (s[2] === 'log') { var a = Math.log10(s[0]), b = Math.log10(s[1]); return EDU.clamp((Math.log10(Math.max(v, s[0])) - a) / (b - a) * 1000, 0, 1000); }
    return EDU.clamp(v, s[0], s[1]);
  }
  function sliderVal(f, p) {
    var s = f.slider;
    if (s[2] !== 'log') return +p;
    var a = Math.log10(s[0]), b = Math.log10(s[1]), v = Math.pow(10, a + (b - a) * p / 1000);
    var mag = Math.pow(10, Math.floor(Math.log10(v)) - 1);
    return Math.round(v / mag) * mag;
  }
  function buildField(host) {
    var id = host.getAttribute('data-f'), f = FIELDS[id];
    var inp = el('input', { id: id, class: 'nf-in', type: 'text', inputmode: f.dec || (!f.money && f.step < 1) ? 'decimal' : 'numeric', autocomplete: 'off', spellcheck: 'false', 'aria-describedby': id + '-h' });
    if (f.aria) { inp.setAttribute('data-i18n-aria-label', f.aria); inp.setAttribute('aria-label', t(f.aria)); }
    var box = el('div', { class: 'nf' },
      f.money ? el('span', { class: 'nf-pfx', 'aria-hidden': 'true', text: '₹' }) : null,
      inp,
      f.sfx ? (f.sfx === '%' ? el('span', { class: 'nf-sfx', 'aria-hidden': 'true', text: '%' }) : el('span', { class: 'nf-sfx', 'aria-hidden': 'true', i18n: f.sfx })) : null);
    host.classList.add('field');
    if (f.lbl) host.appendChild(el('label', { for: id, i18n: f.lbl }));
    host.appendChild(box);
    if (f.slider) {
      var s = f.slider, rg = el('input', { type: 'range', class: 'nf-range no-print', id: id + '-r', tabindex: '-1', 'aria-hidden': 'true', min: s[2] === 'log' ? 0 : s[0], max: s[2] === 'log' ? 1000 : s[1], step: s[2] === 'log' ? 1 : s[2] });
      rg.addEventListener('input', function () {
        var v = sliderVal(f, rg.value);
        S[id] = fmtField(id, v); inp.value = S[id];
        fieldChanged(id, true);
      });
      host.appendChild(rg);
    }
    if (!f.noHint) host.appendChild(el('span', { class: 'nf-hint', id: id + '-h' }));
    inp.value = S[id];
    inp.addEventListener('input', function () { S[id] = inp.value; fieldChanged(id); });
    inp.addEventListener('blur', function () {
      var v = num(id);
      if (!isNaN(v) && String(S[id]).trim() !== '') { S[id] = fmtField(id, v); inp.value = S[id]; save(); }
    });
    inp.addEventListener('keydown', function (e) { stepKey(e, inp, f, function (v) { S[id] = fmtField(id, v); inp.value = S[id]; fieldChanged(id); }); });
  }
  function stepKey(e, inp, f, apply) {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    var v = parseNum(inp.value, f.money);
    if (v === null || isNaN(v)) v = f.min > 0 ? f.min : 0;
    var st = f.step * (e.shiftKey ? 10 : 1);
    v = e.key === 'ArrowUp' ? v + st : v - st;
    v = Math.round(v / f.step) * f.step;
    v = EDU.clamp(+v.toFixed(4), f.min, f.max);
    apply(v);
    e.preventDefault();
  }
  function syncField(id) {
    var f = FIELDS[id], inp = $('#' + id);
    if (!inp) return;
    if (document.activeElement !== inp && inp.value !== S[id]) inp.value = S[id];
    var v = num(id), bad = isNaN(v);
    inp.setAttribute('aria-invalid', bad ? 'true' : 'false');
    var rg = $('#' + id + '-r');
    if (rg && !bad && document.activeElement !== rg) rg.value = sliderPos(f, v);
    var h = $('#' + id + '-h');
    if (!h) return;
    var txt = '', err = false;
    if (bad) { err = true; txt = fieldErr(id); }
    else if (id === 'ppfAmt' && v > 150000) { err = true; txt = t('ppf_over'); }
    else if (id === 'ppfAmt' && v < 500) { err = true; txt = t('ppf_under'); }
    else if (f.money && v >= 1000) txt = words(v);
    else if (f.hint) txt = t(f.hint);
    h.textContent = txt;
    h.classList.toggle('err', err);
  }
  function setField(id, v) { S[id] = typeof v === 'number' ? fmtField(id, v) : v; var inp = $('#' + id); if (inp) inp.value = S[id]; syncField(id); }
  function fieldChanged(id) {
    if ((id === 'emiAmt' || id === 'emiRate' || id === 'emiYrs' || id === 'emiMos') && S.preset) { S.preset = ''; syncPresets(); }
    syncField(id);
    save();
    schedule(FIELDS[id].tab);
  }
  var pending = {};
  function schedule(tab) {
    if (pending[tab]) return;
    pending[tab] = requestAnimationFrame(function () { pending[tab] = 0; RENDER[tab](); });
  }

  /* ================================================================ small UI helpers */
  function bindSeg(id, key, tab, after) {
    $$('#' + id + ' button').forEach(function (b) {
      b.addEventListener('click', function () { S[key] = b.getAttribute('data-v'); syncSeg(id, key); save(); if (after) after(); schedule(tab); });
    });
  }
  function syncSeg(id, key) { $$('#' + id + ' button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-v') === S[key] ? 'true' : 'false'); }); }
  function bindCheck(id, key, tab, after) {
    var c = $('#' + id);
    c.checked = !!S[key];
    c.addEventListener('change', function () { S[key] = c.checked; save(); if (after) after(); schedule(tab); });
  }
  function stat(label, value, cls, id) {
    return el('div', { class: 'fc-stat' + (cls ? ' ' + cls : '') }, el('span', { text: label }), el('b', { id: id || null, class: String(value).length > 13 ? 'long' : null, text: value }));
  }
  /* the big result number; very long amounts get a smaller font so they never spill out of the card */
  function bigNum(id, text) { return el('div', { class: 'big-number' + (String(text).length > 12 ? ' long' : ''), id: id, text: text }); }
  function kv(rows) {
    var dl = el('dl', { class: 'fc-kv' });
    rows.forEach(function (r) {
      if (!r) return;
      dl.appendChild(el('dt', { class: r[2] || null, text: r[0] }));
      dl.appendChild(el('dd', { class: r[2] || null, text: r[1], id: r[3] || null }));
    });
    return dl;
  }
  function errBox(host) { host.innerHTML = ''; host.appendChild(el('p', { class: 'fc-err mb0', text: t('err_fix') })); }
  function pibar(a, b) {
    var tot = a + b || 1;
    return el('div', { class: 'fc-pibar', 'aria-hidden': 'true' },
      el('span', { class: 'p', style: { width: (a / tot * 100).toFixed(2) + '%' } }),
      el('span', { class: 'i', style: { width: (b / tot * 100).toFixed(2) + '%' } }));
  }
  function legend(id, items) {
    var host = $('#' + id); host.innerHTML = '';
    items.forEach(function (it) {
      var sw = el('i', { class: 'sw ' + (it[2] === 'bar' ? 'sw-' + it[0] : 'line sw-' + it[0] + (it[2] === 'dash' ? ' dash' : '')), style: it[2] === 'dash' ? { '--sw': 'var(--' + it[0] + ')' } : {} });
      host.appendChild(el('span', null, sw, it[1]));
    });
  }
  function link(tab) {
    var keys = Object.keys(DEF).filter(function (k) {
      if (tab === 'emi') return /^(emi|pp(?!f)|rc|apr|fl|nc|af|preset|view|chart)/.test(k);
      if (tab === 'sip') return /^sip/.test(k);
      if (tab === 'fd') return /^(fd|rd)/.test(k);
      return /^ppf/.test(k);
    });
    var o = { tab: tab };
    keys.forEach(function (k) { o[k] = S[k]; });
    return EDU.shareUrl() + '#c=' + EDU.pack(o);
  }
  function copySummary(text, tab) { EDU.copy(plain(text) + '\n' + link(tab) + '\n' + t('copy_foot')); }

  /* ================================================================ chart (inline SVG, theme-aware via CSS classes) */
  var charts = {};
  function niceStep(max, count) {
    var raw = max / count, mag = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / mag;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
  }
  function chart(id, cfg) { charts[id] = cfg; drawChart(id); }
  function drawChart(id) {
    var host = $('#' + id), cfg = charts[id];
    if (!host || !cfg) return;
    if (host.offsetParent === null) { host._dirty = true; return; }
    host._dirty = false;
    var W = Math.max(240, Math.floor(host.clientWidth)), narrow = W < 480, H = narrow ? 210 : 250;
    var n = Math.max(1, cfg.n), max = 0, i;
    for (i = 0; i < n; i++) {
      var s = 0;
      (cfg.bars || []).forEach(function (b) { s += Math.max(0, b.vals[i] || 0); });
      max = Math.max(max, s);
      (cfg.lines || []).forEach(function (l) { if (l.vals[i] != null) max = Math.max(max, l.vals[i]); });
    }
    if (!(max > 0)) max = 1;
    var step = niceStep(max, narrow ? 4 : 5), topV = Math.ceil(max / step - 1e-9) * step, ticks = [];
    for (var v = 0; v <= topV + step / 2; v += step) ticks.push(v);
    var lw = 0; ticks.forEach(function (v) { lw = Math.max(lw, short(v).length); });
    var Lm = Math.min(Math.max(96, W * 0.4), 12 + lw * 6.4), R = 10, T = 10, B = 24, cw = W - Lm - R, ch = H - T - B, slot = cw / n;
    var Y = function (v) { return T + ch - (v / topV) * ch; }, X = function (k) { return Lm + (k + 0.5) * slot; };
    var out = [];
    ticks.forEach(function (v) {
      var y = Y(v).toFixed(1);
      out.push('<line class="grid" x1="' + Lm + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '"/>');
      out.push('<text x="' + (Lm - 6) + '" y="' + (+y + 4) + '" text-anchor="end">' + esc(short(v)) + '</text>');
    });
    if (cfg.bars && cfg.bars.length) {
      var bw = Math.max(1, Math.min(44, slot * 0.72));
      for (i = 0; i < n; i++) {
        var base = 0;
        for (var b = 0; b < cfg.bars.length; b++) {
          var bv = Math.max(0, cfg.bars[b].vals[i] || 0);
          if (!bv) continue;
          var y1 = Y(base + bv), y0 = Y(base);
          out.push('<rect class="' + cfg.bars[b].cls + '" x="' + (X(i) - bw / 2).toFixed(1) + '" y="' + y1.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(0.6, y0 - y1).toFixed(1) + '" rx="' + (bw > 8 ? 2 : 0) + '"/>');
          base += bv;
        }
      }
    }
    (cfg.lines || []).forEach(function (l) {
      var d = '', first = -1, last = -1;
      for (var k = 0; k < n; k++) {
        if (l.vals[k] == null) continue;
        if (first < 0) first = k;
        last = k;
        d += (d ? 'L' : 'M') + X(k).toFixed(1) + ' ' + Y(l.vals[k]).toFixed(1);
      }
      if (!d) return;
      if (l.area) out.push('<path class="' + l.area + '" d="' + d + 'L' + X(last).toFixed(1) + ' ' + Y(0).toFixed(1) + 'L' + X(first).toFixed(1) + ' ' + Y(0).toFixed(1) + 'Z"/>');
      out.push('<path class="ln ' + l.cls + (l.dash ? ' dash' : '') + '" d="' + d + '"/>');
    });
    out.push('<line class="axis" x1="' + Lm + '" x2="' + (W - R) + '" y1="' + Y(0).toFixed(1) + '" y2="' + Y(0).toFixed(1) + '"/>');
    /* x labels: pick a step (1, 2, 5, 10 ...) so labels never collide */
    var minGap = narrow ? 38 : 46, per = cfg.xPer || 1, cands = [1, 2, 5, 10, 20, 25, 50, 100], c = 100;
    for (var q = 0; q < cands.length; q++) if (cands[q] * per * slot >= minGap) { c = cands[q]; break; }
    for (i = 0; i < n; i++) {
      var key = cfg.xKey(i);
      if (key == null || key % c !== 0) continue;
      out.push('<text x="' + X(i).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(String(cfg.xText ? cfg.xText(key) : key)) + '</text>');
    }
    host.innerHTML = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(cfg.aria || '') + '">' +
      out.join('') + '<line class="guide" x1="0" x2="0" y1="' + T + '" y2="' + (T + ch) + '" visibility="hidden"/></svg>';
    var tip = el('div', { class: 'fc-tip', dir: document.documentElement.dir || 'ltr' });
    tip.hidden = true;
    host.appendChild(tip);
    host._geo = { L: Lm, slot: slot, n: n, W: W, T: T };
    host._sel = -1;
  }
  function bindChart(id) {
    var host = $('#' + id);
    function show(i) {
      var g = host._geo, cfg = charts[id];
      if (!g || !cfg) return;
      i = EDU.clamp(i, 0, g.n - 1); host._sel = i;
      var x = g.L + (i + 0.5) * g.slot, guide = host.querySelector('.guide'), tip = host.querySelector('.fc-tip');
      if (!guide || !tip) return;
      guide.setAttribute('x1', x.toFixed(1)); guide.setAttribute('x2', x.toFixed(1)); guide.setAttribute('visibility', 'visible');
      var info = cfg.tip(i);
      tip.innerHTML = '<b>' + esc(info.title) + '</b>' + info.items.map(function (r) {
        return '<div class="tr"><span>' + (r[0] ? '<i class="sw sw-' + r[0] + '"></i>' : '') + esc(r[1]) + '</span><span>' + esc(r[2]) + '</span></div>';
      }).join('');
      tip.hidden = false;
      var tw = tip.offsetWidth, left = x + 14;
      if (left + tw > g.W) left = x - tw - 14;
      tip.style.left = Math.max(0, left) + 'px';
      tip.style.top = (g.T + 2) + 'px';
    }
    function hide() {
      var guide = host.querySelector('.guide'), tip = host.querySelector('.fc-tip');
      if (guide) guide.setAttribute('visibility', 'hidden');
      if (tip) tip.hidden = true;
      host._sel = -1;
    }
    function at(e) {
      var g = host._geo; if (!g) return;
      var r = host.getBoundingClientRect(), i = Math.floor((e.clientX - r.left - g.L) / g.slot);
      if (i < 0 || i >= g.n) hide(); else show(i);
    }
    host.addEventListener('pointermove', at);
    host.addEventListener('pointerdown', at);
    host.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hide(); });
    host.addEventListener('blur', hide);
    host.addEventListener('keydown', function (e) {
      var g = host._geo, cfg = charts[id]; if (!g || !cfg) return;
      var st = cfg.kStep || 1, cur = host._sel < 0 ? -1 : host._sel;
      if (e.key === 'ArrowRight') show(cur < 0 ? 0 : cur + st);
      else if (e.key === 'ArrowLeft') show(cur < 0 ? g.n - 1 : cur - st);
      else if (e.key === 'Home') show(0);
      else if (e.key === 'End') show(g.n - 1);
      else if (e.key === 'Escape') hide();
      else return;
      e.preventDefault();
    });
    if (window.ResizeObserver) {
      var lastW = 0;
      new ResizeObserver(function () {
        var w = Math.floor(host.clientWidth);
        if (w && w !== lastW) { lastW = w; drawChart(id); }
      }).observe(host);
    }
  }

  /* ================================================================ table helper */
  function table(id, head, rows, foot) {
    var h = '<thead><tr>' + head.map(function (c) { return '<th scope="col"' + (c[1] ? ' class="n"' : '') + '>' + esc(c[0]) + '</th>'; }).join('') + '</tr></thead><tbody>';
    h += rows.map(function (r) {
      return '<tr' + (r.cls ? ' class="' + r.cls + '"' : '') + '>' + r.cells.map(function (c, k) { return '<td' + (head[k] && head[k][1] ? ' class="n"' : '') + '>' + esc(c) + '</td>'; }).join('') + '</tr>';
    }).join('') + '</tbody>';
    if (foot) h += '<tfoot><tr>' + foot.map(function (c, k) { return '<td' + (head[k] && head[k][1] ? ' class="n"' : '') + '>' + esc(c) + '</td>'; }).join('') + '</tr></tfoot>';
    $('#' + id).innerHTML = h;
  }
  function r2(v) { return Math.round(v * 100) / 100; }
  function csvDownload(name, summary, head, rows) {
    var all = summary.concat([[]], [head], rows).map(function (r) { return r.map(plain); });
    EDU.download(name, EDU.csv.stringify(all), 'text/csv');
  }
  function setPrintDate() {
    var d = new Date();
    try { $('#printDate').textContent = new Intl.DateTimeFormat(EDU.langInfo(EDU.lang).tag, { dateStyle: 'long', numberingSystem: 'latn' }).format(d) + ' · apnipathshala.ai'; } catch (e) { }
  }
  function doPrint() { setPrintDate(); window.print(); }
  window.addEventListener('beforeprint', setPrintDate);   /* Ctrl+P too */

  /* ================================================================ EMI tab */
  function loanIn() {
    var P = num('emiAmt'), rate = num('emiRate'), y = num('emiYrs'), mo = num('emiMos');
    var n = isNaN(y) || isNaN(mo) ? NaN : y * 12 + mo;
    var th = $('#tenureHint');
    if (n === 0 || n > 480) { th.textContent = n === 0 ? t('err_tenure') : t('err_range', { a: 1, b: 480 }); th.classList.add('err'); }
    else if (!isNaN(n)) { th.textContent = t('tenure_emis', { n: nf(n) }); th.classList.remove('err'); }
    else { th.textContent = fieldErr('emiYrs') || fieldErr('emiMos') || t('err_fix'); th.classList.add('err'); }
    if (isNaN(P) || isNaN(rate) || isNaN(n) || n < 1 || n > 480) return null;
    return { P: P, rate: rate, n: n, start: startIdx() };
  }
  function changesIn(L) {
    var pp = [], rc = [], i;
    for (i = 0; i < S.pp.length; i++) {
      var a = parseNum(S.pp[i].amt, true), m = parseNum(S.pp[i].at);
      if (a > 0 && m >= 1 && m <= 1200 && Math.floor(m) === m) pp.push({ amt: a, at: m, freq: S.pp[i].freq });
    }
    for (i = 0; i < S.rc.length; i++) {
      var at = parseNum(S.rc[i].at), rt = parseNum(S.rc[i].rate);
      if (at >= 1 && at <= 1200 && Math.floor(at) === at && rt >= 0 && rt <= 50) rc.push({ at: at, rate: rt });
    }
    var ch = num('ppCharge');
    return { P: L.P, rate: L.rate, n: L.n, pp: pp, ppMode: S.ppMode, charge: isNaN(ch) ? 0 : ch, rc: rc, rcMode: S.rcMode };
  }

  var last = { emi: null };
  function renderEmi() {
    ['emiAmt', 'emiRate', 'emiYrs', 'emiMos', 'ppCharge', 'aprFee', 'aprOther', 'flAmt', 'flRate', 'flN', 'ncPrice', 'ncN', 'ncRate', 'ncFee', 'ncCash', 'afInc', 'afOth', 'afFoir'].forEach(syncField);
    var yr = $('#emiYrsR'), yv = num('emiYrs');
    if (!isNaN(yv) && document.activeElement !== yr) yr.value = yv;
    $('#emiStart').value = S.emiStart;
    var L = loanIn(), res = $('#emiRes');
    syncRowHints(L);
    if (!L) {
      errBox(res); last.emi = null;
      chart('emiChart', { n: 1, bars: [], lines: [], xKey: function () { return null; }, tip: function () { return { title: '', items: [] }; } });
      $('#emiLegend').innerHTML = ''; $('#chgOut').innerHTML = ''; $('#schTable').innerHTML = ''; $('#schNote').textContent = '';
      renderTools(null);
      return;
    }
    var base = F.loan({ P: L.P, rate: L.rate, n: L.n }), C = changesIn(L), plan = F.loan(C);
    var hasChg = C.pp.length > 0 || C.rc.length > 0;
    last.emi = { L: L, base: base, plan: plan, hasChg: hasChg };

    /* --- result card */
    res.innerHTML = '';
    res.appendChild(el('div', { class: 'fc-big' },
      el('span', { class: 'muted', text: t('r_emi') }),
      bigNum('emiBig', rs(base.emi0)),
      el('span', { class: 'small muted', text: t('r_for', { n: nf(L.n), t: tenureTxt(L.n), r: pc(L.rate) }) })));
    res.appendChild(el('div', { class: 'fc-stats' },
      stat(t('r_principal'), rs(L.P), '', 'emiP'),
      stat(t('r_interest'), rs(base.totInt), '', 'emiI'),
      stat(t('r_total'), rs(L.P + base.totInt), 'hl', 'emiT')));
    res.appendChild(pibar(L.P, base.totInt));
    res.appendChild(el('div', { class: 'fc-legend' },
      el('span', null, el('i', { class: 'sw sw-c1' }), t('r_principal') + ' ', el('bdi', { dir: 'ltr', text: pc(L.P / (L.P + base.totInt) * 100, 0) })),
      el('span', null, el('i', { class: 'sw sw-c2' }), t('r_interest') + ' ', el('bdi', { dir: 'ltr', text: pc(base.totInt / (L.P + base.totInt) * 100, 0) }))));
    res.appendChild(el('p', { class: 'small mb0', style: { marginTop: '10px' }, id: 'emiEnd', text: t('r_last', { date: monthName(L.start + base.months - 1) }) }));
    res.appendChild(el('div', { class: 'fc-res-actions no-print' },
      el('button', { type: 'button', class: 'btn btn-sm', id: 'emiCopy', onclick: function () {
        copySummary(t('sum_emi', { amt: rs(L.P), rate: pc(L.rate), t: tenureTxt(L.n), emi: rs(base.emi0), int: rs(base.totInt), tot: rs(L.P + base.totInt) }), 'emi');
      } }, el('span', { 'aria-hidden': 'true', text: '📋' }), ' ', t('copy_sum'))));

    renderChanges(L, base, plan, hasChg);
    renderEmiChart(L, base, plan, hasChg);
    renderSchedule(L, plan, C);
    renderTools(L, base);
  }

  function renderChanges(L, base, plan, hasChg) {
    var out = $('#chgOut'); out.innerHTML = '';
    if (!hasChg) { out.appendChild(el('p', { class: 'fc-empty', text: t('chg_empty') })); return; }
    var endB = L.start + base.months - 1, endP = L.start + plan.months - 1;
    var emiTxt = Math.abs(plan.emiEnd - plan.emi0) > 0.5 && plan.months > 1 ? rs(plan.emi0) + ' → ' + rs(plan.emiEnd) : rs(plan.emi0);
    var dI = base.totInt - plan.totInt, dM = base.months - plan.months;
    var rows = [
      [t('r_emi'), rs(base.emi0), emiTxt],
      [t('cmp_emis'), nf(base.months) + ' (' + tenureTxt(base.months) + ')', nf(plan.months) + ' (' + tenureTxt(plan.months) + ')', dM > 0 ? 'good' : dM < 0 ? 'bad' : ''],
      [t('cmp_end'), monthName(endB), monthName(endP)],
      [t('r_interest'), rs(base.totInt), rs(plan.totInt), dI > 0.5 ? 'good' : dI < -0.5 ? 'bad' : ''],
      plan.totPP > 0 ? [t('cmp_pp'), '—', rs(plan.totPP)] : null,
      plan.totCharge > 0 ? [t('cmp_charges'), '—', rs(plan.totCharge)] : null,
      [t('cmp_total'), rs(L.P + base.totInt), rs(L.P + plan.totInt + plan.totCharge)]
    ].filter(Boolean);
    var tb = el('table', { class: 'table fc-cmp', id: 'cmpTable' },
      el('thead', null, el('tr', null, el('th', { scope: 'col' }), el('th', { scope: 'col', class: 'n', text: t('cmp_orig') }), el('th', { scope: 'col', class: 'n', text: t('cmp_plan') }))),
      el('tbody', null, rows.map(function (r) {
        return el('tr', null, el('th', { scope: 'row', text: r[0] }), el('td', { class: 'n', text: r[1] }), el('td', { class: 'n' + (r[3] ? ' ' + r[3] : ''), text: r[2] }));
      })));
    out.appendChild(el('div', { class: 'scroll-x' }, tb));
    var msgs = [];
    if (dI > 0.5) msgs.push(t('sum_save', { amt: rs(dI) })); else if (dI < -0.5) msgs.push(t('sum_more', { amt: rs(-dI) }));
    if (dM > 0) msgs.push(t('sum_earlier', { t: tenureTxt(dM) })); else if (dM < 0) msgs.push(t('sum_later', { t: tenureTxt(-dM) }));
    if (plan.totCharge > 0 && dI > 0.5) msgs.push(t('sum_net', { amt: rs(dI - plan.totCharge) }));
    if (msgs.length) out.appendChild(el('p', { class: 'callout ' + (dI >= 0 ? 'success' : 'danger') + ' mb0', id: 'chgSum', style: { marginTop: '10px' }, text: msgs.join(' ') }));
    if (plan.capped) out.appendChild(el('p', { class: 'callout warning small mb0', style: { marginTop: '8px' }, text: t('pp_capped', { n: nf(plan.capped.m), amt: rs(plan.capped.need) }) }));
    if (plan.warnLow) out.appendChild(el('p', { class: 'callout warning small mb0', style: { marginTop: '8px' }, text: t('warn_low') }));
    if (Math.abs(plan.lastPay - plan.emiEnd) > 1 && plan.months > 1) out.appendChild(el('p', { class: 'small muted mb0', style: { marginTop: '8px' }, text: t('last_emi_amt', { amt: rs(plan.lastPay), date: monthName(endP) }) }));
  }

  function renderEmiChart(L, base, plan, hasChg) {
    var title = $('#emiChartTitle');
    syncSeg('emiChartSeg', 'chart');
    if (S.chart === 'balance') {
      title.textContent = t('ch_balance_t');
      var N = Math.max(base.months, plan.months) + 1;
      var bv = [], pv = [];
      for (var i = 0; i < N; i++) {
        bv.push(i === 0 ? L.P : i <= base.months ? base.rows[i - 1].bal : null);
        pv.push(i === 0 ? L.P : i <= plan.months ? plan.rows[i - 1].bal : null);
      }
      var lines = hasChg
        ? [{ cls: 'l-c8', vals: bv, dash: true }, { cls: 'l-c1', vals: pv, area: 'a-c1' }]
        : [{ cls: 'l-c1', vals: bv, area: 'a-c1' }];
      chart('emiChart', {
        n: N, lines: lines, xPer: 12, kStep: 12,
        xKey: function (k) { var idx = L.start + k; return idx % 12 === 0 ? idx / 12 : null; },
        tip: function (k) {
          var items = [];
          if (hasChg) { items.push(['c8', t('cmp_orig'), bv[k] == null ? '—' : rs(bv[k])]); items.push(['c1', t('cmp_plan'), pv[k] == null ? '—' : rs(pv[k])]); }
          else items.push(['c1', t('ch_left'), rs(bv[k])]);
          return { title: k === 0 ? t('ch_start') : t('ch_after', { n: nf(k), date: monthName(L.start + k - 1) }), items: items };
        },
        aria: t('ch_balance_t') + ': ' + rs(L.P) + ' → ₹0, ' + tenureTxt(plan.months)
      });
      legend('emiLegend', hasChg ? [['c8', t('cmp_orig'), 'dash'], ['c1', t('cmp_plan'), 'line']] : [['c1', t('ch_left'), 'line']]);
    } else {
      title.textContent = t('ch_split_t');
      var g = groupRows(plan.rows, L.start, 'yearly');
      var hasPP = plan.totPP > 0;
      chart('emiChart', {
        n: g.length,
        bars: [{ cls: 'b-c1', vals: g.map(function (x) { return x.prin; }) }, { cls: 'b-c2', vals: g.map(function (x) { return x.int; }) }].concat(hasPP ? [{ cls: 'b-c4', vals: g.map(function (x) { return x.pp; }) }] : []),
        xKey: function (k) { return g[k].key; },
        tip: function (k) {
          var x = g[k], items = [['c1', t('col_principal'), rs(x.prin)], ['c2', t('col_interest'), rs(x.int)]];
          if (hasPP) items.push(['c4', t('col_prepay'), rs(x.pp)]);
          items.push(['', t('col_balance'), rs(x.bal)]);
          return { title: String(x.key), items: items };
        },
        aria: t('ch_split_t')
      });
      legend('emiLegend', [['c1', t('col_principal'), 'bar'], ['c2', t('col_interest'), 'bar']].concat(hasPP ? [['c4', t('col_prepay'), 'bar']] : []));
    }
  }

  function groupRows(rows, start, mode) {
    var out = [], cur = null;
    rows.forEach(function (r) {
      var idx = start + r.m - 1, key = mode === 'fy' ? fyOf(idx) : Math.floor(idx / 12);
      if (!cur || cur.key !== key) { cur = { key: key, emi: 0, prin: 0, int: 0, pp: 0, n: 0, bal: 0, ev: false }; out.push(cur); }
      cur.emi += r.emi; cur.prin += r.prin; cur.int += r.int; cur.pp += r.pp; cur.n++; cur.bal = r.bal; cur.ev = cur.ev || r.ev;
    });
    return out;
  }

  function scheduleData(L, plan, C) {
    var hasPP = plan.totPP > 0, hasRate = C.rc.length > 0, view = S.view;
    var head, rows, foot;
    var tot = { emi: plan.totPay, prin: L.P - (plan.unpaid ? plan.rows[plan.rows.length - 1].bal : 0) - plan.totPP, int: plan.totInt, pp: plan.totPP };
    if (view === 'monthly') {
      head = [[t('col_no'), 1], [t('col_month')], [t('col_emi'), 1], [t('col_principal'), 1], [t('col_interest'), 1]];
      if (hasPP) head.push([t('col_prepay'), 1]);
      if (hasRate) head.push([t('col_rate'), 1]);
      head.push([t('col_balance'), 1]);
      rows = plan.rows.map(function (r) {
        var c = [nf(r.m), monthName(L.start + r.m - 1), rs(r.emi), rs(r.prin), rs(r.int)];
        if (hasPP) c.push(r.pp ? rs(r.pp) : '—');
        if (hasRate) c.push(pc(r.rate));
        c.push(rs(r.bal));
        return { cells: c, cls: r.bal === 0 ? 'done' : r.ev ? 'ev' : '', raw: [r.m, monthName(L.start + r.m - 1), r2(r.emi), r2(r.prin), r2(r.int)].concat(hasPP ? [r2(r.pp)] : [], hasRate ? [r.rate] : [], [r2(r.bal)]) };
      });
      foot = [t('total'), '', rs(tot.emi), rs(tot.prin), rs(tot.int)].concat(hasPP ? [rs(tot.pp)] : [], hasRate ? [''] : [], ['']);
    } else {
      var g = groupRows(plan.rows, L.start, view);
      head = [[view === 'fy' ? t('col_fy') : t('col_year')], [t('col_emis'), 1], [t('col_emi_paid'), 1], [t('col_principal'), 1], [t('col_interest'), 1]];
      if (hasPP) head.push([t('col_prepay'), 1]);
      head.push([t('col_balance'), 1]);
      rows = g.map(function (x) {
        var lbl = view === 'fy' ? fyLabel(x.key) : String(x.key);
        var c = [lbl, nf(x.n), rs(x.emi), rs(x.prin), rs(x.int)];
        if (hasPP) c.push(x.pp ? rs(x.pp) : '—');
        c.push(rs(x.bal));
        return { cells: c, cls: x.bal === 0 ? 'done' : '', raw: [lbl, x.n, r2(x.emi), r2(x.prin), r2(x.int)].concat(hasPP ? [r2(x.pp)] : [], [r2(x.bal)]) };
      });
      foot = [t('total'), nf(plan.months), rs(tot.emi), rs(tot.prin), rs(tot.int)].concat(hasPP ? [rs(tot.pp)] : [], ['']);
    }
    return { head: head, rows: rows, foot: foot };
  }
  function renderSchedule(L, plan, C) {
    syncSeg('schView', 'view');
    var d = scheduleData(L, plan, C);
    table('schTable', d.head, d.rows, d.foot);
    $('#schNote').textContent = S.view === 'fy' ? t('sch_fy_note') : S.view === 'monthly' ? t('sch_m_note') : t('sch_y_note');
  }

  function renderTools(L, base) {
    /* fees -> APR */
    var aprOut = $('#aprOut'); aprOut.innerHTML = '';
    var fee = num('aprFee'), other = num('aprOther');
    if (!L) aprOut.appendChild(el('p', { class: 'muted mb0', text: t('need_loan') }));
    else if (isNaN(fee) || isNaN(other)) errBox(aprOut);
    else {
      var gstM = S.aprGst ? 1.18 : 1, fees = (L.P * fee / 100 + other) * gstM, net = L.P - fees;
      if (net <= 0) aprOut.appendChild(el('p', { class: 'fc-err mb0', text: t('apr_too_high') }));
      else {
        var i = F.rateFor(net, base.emi0, L.n), apr = i * 1200, eff = (Math.pow(1 + i, 12) - 1) * 100;
        aprOut.appendChild(kv([
          [t('apr_fees'), rs(fees)],
          [t('apr_net'), rs(net)],
          [t('apr_quoted'), pc(L.rate)],
          [t('apr_apr'), pc(apr), 'tot', 'aprVal'],
          [t('apr_eff'), pc(eff)]
        ]));
        aprOut.appendChild(el('p', { class: 'small', text: t('apr_says', { p: pc(Math.max(0, apr - L.rate)) }) }));
      }
    }
    /* flat -> reducing */
    var flOut = $('#flatOut'); flOut.innerHTML = '';
    syncSeg('flPer', 'flPer');
    var fa = num('flAmt'), fr = num('flRate'), fn = num('flN');
    if (isNaN(fa) || isNaN(fr) || isNaN(fn) || Math.floor(fn) !== fn) errBox(flOut);
    else {
      var fy = S.flPer === 'month' ? fr * 12 : fr, fl = F.flat(fa, fy, fn);
      flOut.appendChild(kv([
        [t('flat_emi'), rs(fl.emi)],
        [t('flat_int'), rs(fl.interest)],
        [t('flat_total'), rs(fa + fl.interest)],
        [t('flat_real'), pc(fl.real), 'tot', 'flatReal']
      ]));
      flOut.appendChild(el('p', { class: 'callout accent small', id: 'flatSays', text: t('flat_says', { f: pc(fy), r: pc(fl.real, 1) }) }));
      flOut.appendChild(el('p', { class: 'small mb0', text: t('flat_cmp', { f: pc(fy), emi: rs(fl.reducingEmi), save: rs((fl.emi - fl.reducingEmi) * fn) }) }));
    }
    /* no-cost EMI */
    var ncOut = $('#ncOut'); ncOut.innerHTML = '';
    var np = num('ncPrice'), nn = num('ncN'), nr = num('ncRate'), nfee = num('ncFee'), ncash = num('ncCash');
    if ([np, nn, nr, nfee, ncash].some(isNaN) || Math.floor(nn) !== nn) errBox(ncOut);
    else {
      var nc = F.noCost({ price: np, n: nn, rate: nr, fee: nfee, cash: ncash });
      ncOut.appendChild(kv([
        [t('nc_emi'), rs(nc.emi) + ' × ' + nf(nn)],
        [t('nc_loan'), rs(nc.loan)],
        [t('nc_hidden'), rs(nc.hidden)],
        [t('nc_gst'), rs(nc.gst)],
        [t('nc_fee_gst'), rs(nc.feeG)],
        ncash > 0 ? [t('nc_cash_lost'), rs(ncash)] : null,
        [t('nc_extra'), rs(nc.extra), 'tot', 'ncExtra']
      ]));
      ncOut.appendChild(el('p', { class: 'callout ' + (nc.pct < 1 ? 'success' : 'warning') + ' small mb0', text: t('nc_says', { amt: rs(nc.extra), p: pc(nc.pct) }) }));
    }
    /* affordability */
    var afOut = $('#afOut'); afOut.innerHTML = '';
    var inc = num('afInc'), oth = num('afOth'), lim = num('afFoir');
    if (!L) afOut.appendChild(el('p', { class: 'muted mb0', text: t('need_loan') }));
    else if ([inc, oth, lim].some(isNaN)) errBox(afOut);
    else {
      var all = base.emi0 + oth, share = all / inc * 100, cls = share <= lim * 0.75 ? 'ok' : share <= lim ? 'tight' : 'over';
      var maxEmi = inc * lim / 100 - oth, maxLoan = maxEmi > 0 ? F.pv(maxEmi, L.rate / 1200, L.n) : 0;
      afOut.appendChild(el('div', { class: 'fc-meter ' + cls, role: 'img', 'aria-label': t('af_share') + ' ' + pc(share, 0) },
        el('span', { style: { width: Math.min(100, share).toFixed(1) + '%' } }),
        el('i', { style: { insetInlineStart: Math.min(100, lim) + '%' } })));
      afOut.appendChild(kv([
        [t('af_emi'), rs(base.emi0)],
        oth > 0 ? [t('af_all'), rs(all)] : null,
        [t('af_share'), pc(share, 1), '', 'afShare'],
        [t('af_left'), rs(inc - all)],
        [t('af_max'), rs(maxLoan), 'tot', 'afMax']
      ]));
      afOut.appendChild(el('p', { class: 'callout ' + (cls === 'ok' ? 'success' : cls === 'tight' ? 'warning' : 'danger') + ' small mb0', id: 'afVerdict', text: t('af_' + cls) }));
    }
  }

  /* --- prepayment and rate-change rows */
  function rowField(id, lblKey, value, money, sfx, onInput) {
    var inp = el('input', { id: id, class: 'nf-in', type: 'text', inputmode: money || !sfx ? 'numeric' : 'decimal', autocomplete: 'off', spellcheck: 'false', 'aria-describedby': id + '-h' });
    inp.value = value;
    inp.addEventListener('input', function () { onInput(inp.value); });
    inp.addEventListener('blur', function () {
      var v = parseNum(inp.value, money);
      if (money && v > 0) { inp.value = nf(Math.round(v)); onInput(inp.value, true); }
    });
    var f = money ? { money: 1, min: 0, max: 1e10, step: 10000 } : sfx ? { min: 0, max: 50, step: 0.05 } : { min: 1, max: 1200, step: 1 };
    inp.addEventListener('keydown', function (e) { stepKey(e, inp, f, function (v) { inp.value = money ? nf(v) : String(+v.toFixed(2)); onInput(inp.value); }); });
    return el('div', { class: 'field' },
      el('label', { for: id, i18n: lblKey }),
      el('div', { class: 'nf' }, money ? el('span', { class: 'nf-pfx', 'aria-hidden': 'true', text: '₹' }) : null, inp, sfx ? el('span', { class: 'nf-sfx', 'aria-hidden': 'true', text: sfx }) : null),
      el('span', { class: 'nf-hint', id: id + '-h' }));
  }
  function buildRows() {
    var ppList = $('#ppList'); ppList.innerHTML = '';
    S.pp.forEach(function (p, i) {
      var sel = el('select', { id: 'pp' + i + 'f' },
        el('option', { value: 'once', i18n: 'freq_once' }), el('option', { value: 'yearly', i18n: 'freq_yearly' }), el('option', { value: 'monthly', i18n: 'freq_monthly' }));
      sel.value = p.freq;
      sel.addEventListener('change', function () { p.freq = sel.value; save(); schedule('emi'); });
      ppList.appendChild(el('div', { class: 'fc-row', 'data-i': i },
        rowField('pp' + i + 'a', 'pp_amt', p.amt, true, '', function (v, quiet) { p.amt = v; save(); if (!quiet) schedule('emi'); }),
        rowField('pp' + i + 'm', 'pp_at', p.at, false, '', function (v) { p.at = toLatin(v); save(); schedule('emi'); }),
        el('div', { class: 'field' }, el('label', { for: 'pp' + i + 'f', i18n: 'pp_freq' }), sel),
        el('button', { type: 'button', class: 'btn btn-sm btn-ghost rm no-print', 'data-i18n-aria-label': 'remove', 'aria-label': t('remove'), title: t('remove'), text: '✕', onclick: function () { S.pp.splice(i, 1); save(); buildRows(); schedule('emi'); } })));
    });
    $('#ppAdd').disabled = S.pp.length >= MAX_ROWS;
    var rcList = $('#rcList'); rcList.innerHTML = '';
    S.rc.forEach(function (c, i) {
      rcList.appendChild(el('div', { class: 'fc-row rc', 'data-i': i },
        rowField('rc' + i + 'm', 'rc_at', c.at, false, '', function (v) { c.at = toLatin(v); save(); schedule('emi'); }),
        rowField('rc' + i + 'r', 'rc_rate', c.rate, false, '%', function (v) { c.rate = toLatin(v); save(); schedule('emi'); }),
        el('button', { type: 'button', class: 'btn btn-sm btn-ghost rm no-print', 'data-i18n-aria-label': 'remove', 'aria-label': t('remove'), title: t('remove'), text: '✕', onclick: function () { S.rc.splice(i, 1); save(); buildRows(); schedule('emi'); } })));
    });
    $('#rcAdd').disabled = S.rc.length >= MAX_ROWS;
    if (!S.pp.length) ppList.appendChild(el('p', { class: 'fc-empty', text: t('pp_none') }));
    if (!S.rc.length) rcList.appendChild(el('p', { class: 'fc-empty', text: t('rc_none') }));
  }
  function hint(id, text, err) { var h = $('#' + id + '-h'); if (!h) return; h.textContent = text; h.classList.toggle('err', !!err); var i = $('#' + id); if (i) i.setAttribute('aria-invalid', err ? 'true' : 'false'); }
  function syncRowHints(L) {
    var end = L ? F.loan({ P: L.P, rate: L.rate, n: L.n }).months : 0;
    function monthHint(id, raw) {
      var m = parseNum(raw);
      if (m === null) return hint(id, t('err_empty'), true);
      if (isNaN(m) || m < 1 || m > 1200 || Math.floor(m) !== m) return hint(id, t('err_range', { a: 1, b: L ? end : 1200 }), true);
      if (!L) return hint(id, '', false);
      hint(id, m > end ? t('after_end') : monthName(L.start + m - 1), false);
    }
    S.pp.forEach(function (p, i) {
      var a = parseNum(p.amt, true);
      if (a === null) hint('pp' + i + 'a', t('err_empty'), true);
      else if (isNaN(a) || a <= 0) hint('pp' + i + 'a', t('err_range', { a: 1, b: nf(1e10) }), true);
      else hint('pp' + i + 'a', words(a), false);
      monthHint('pp' + i + 'm', p.at);
    });
    S.rc.forEach(function (c, i) {
      monthHint('rc' + i + 'm', c.at);
      var r = parseNum(c.rate);
      if (r === null) hint('rc' + i + 'r', t('err_empty'), true);
      else if (isNaN(r) || r < 0 || r > 50) hint('rc' + i + 'r', t('err_range', { a: 0, b: 50 }), true);
      else hint('rc' + i + 'r', '', false);
    });
  }

  /* ================================================================ SIP tab */
  function renderSip() {
    ['sipGoal', 'sipAmt', 'sipStep', 'sipRet', 'sipYrs', 'sipLump', 'sipInf'].forEach(syncField);
    syncSeg('sipMode', 'sipMode');
    var goal = S.sipMode === 'goal';
    $('#sipGoalBox').hidden = !goal; $('#sipAmtBox').hidden = goal;
    $('#sipToday').checked = !!S.sipToday;
    var res = $('#sipRes');
    var amt = num('sipAmt'), step = num('sipStep'), ret = num('sipRet'), yrs = num('sipYrs'), lump = num('sipLump'), inf = num('sipInf'), gl = num('sipGoal');
    if ([step, ret, yrs, lump, inf].some(isNaN) || Math.floor(yrs) !== yrs || (goal ? isNaN(gl) : isNaN(amt))) {
      errBox(res); $('#sipTable').innerHTML = ''; $('#sipLegend').innerHTML = '';
      chart('sipChart', { n: 1, bars: [], xKey: function () { return null; }, tip: function () { return { title: '', items: [] }; } });
      return;
    }
    var o = { amt: amt, step: step, ret: ret, yrs: yrs, lump: lump, inf: inf }, goalFuture = 0, need = 0;
    if (goal) {
      goalFuture = S.sipToday ? gl * Math.pow(1 + inf / 100, yrs) : gl;
      need = F.sipNeeded(goalFuture, o);
      o.amt = need;
    }
    var R = F.sip(o);
    res.innerHTML = '';
    if (goal) {
      res.appendChild(el('div', { class: 'fc-big' },
        el('span', { class: 'muted', text: t('sip_need') }),
        bigNum('sipBig', rs(need)),
        el('span', { class: 'small muted', text: t('sip_need_sub', { goal: rs(goalFuture), y: nf(yrs), r: pc(ret) }) })));
      if (need === 0) res.appendChild(el('p', { class: 'callout success small', style: { marginTop: '10px' }, text: t('sip_goal_met') }));
    } else {
      res.appendChild(el('div', { class: 'fc-big' },
        el('span', { class: 'muted', text: t('sip_value') }),
        bigNum('sipBig', rs(R.value)),
        el('span', { class: 'small muted', text: t('sip_sub', { y: nf(yrs), r: pc(ret) }) })));
    }
    res.appendChild(el('div', { class: 'fc-stats' },
      stat(t('sip_invested'), rs(R.invested), '', 'sipInv'),
      stat(t('sip_gains'), rs(R.gain), 'good', 'sipGain'),
      goal ? stat(t('sip_value'), rs(R.value), 'hl', 'sipVal') : stat(t('sip_real'), rs(R.real), 'hl', 'sipReal')));
    res.appendChild(pibar(R.invested, Math.max(0, R.gain)));
    res.appendChild(el('div', { class: 'fc-legend' },
      el('span', null, el('i', { class: 'sw sw-c1' }), t('sip_invested')),
      el('span', null, el('i', { class: 'sw sw-c2' }), t('sip_gains'))));
    if (goal && S.sipToday) res.appendChild(el('p', { class: 'small mb0', style: { marginTop: '10px' }, text: t('sip_goal_infl', { a: rs(gl), b: rs(goalFuture), y: nf(yrs) }) }));
    else if (!goal) res.appendChild(el('p', { class: 'small mb0', style: { marginTop: '10px' }, text: t('sip_real_note', { v: rs(R.real), p: pc(inf, 1) }) }));
    res.appendChild(el('div', { class: 'fc-res-actions no-print' },
      el('button', { type: 'button', class: 'btn btn-sm', id: 'sipCopy', onclick: function () {
        copySummary(t('sum_sip', { amt: rs(goal ? need : amt), step: pc(step, 1), r: pc(ret), y: nf(yrs), inv: rs(R.invested), val: rs(R.value) }), 'sip');
      } }, el('span', { 'aria-hidden': 'true', text: '📋' }), ' ', t('copy_sum'))));
    var rows = R.rows;
    chart('sipChart', {
      n: rows.length,
      bars: [{ cls: 'b-c1', vals: rows.map(function (x) { return x.invested; }) }, { cls: 'b-c2', vals: rows.map(function (x) { return Math.max(0, x.gain); }) }],
      lines: inf > 0 ? [{ cls: 'l-c3', vals: rows.map(function (x) { return x.real; }), dash: true }] : [],
      xKey: function (k) { return rows[k].y; },
      tip: function (k) {
        var x = rows[k];
        return { title: t('year_n', { n: x.y }), items: [['c1', t('sip_invested'), rs(x.invested)], ['c2', t('sip_gains'), rs(x.gain)], ['', t('sip_value'), rs(x.value)]].concat(inf > 0 ? [['c3', t('sip_real'), rs(x.real)]] : []) };
      },
      aria: t('ch_growth') + ': ' + rs(R.value)
    });
    legend('sipLegend', [['c1', t('sip_invested'), 'bar'], ['c2', t('sip_gains'), 'bar']].concat(inf > 0 ? [['c3', t('sip_real'), 'dash']] : []));
    var d = sipTable(R);
    table('sipTable', d.head, d.rows);
    last.sip = { R: R, o: o, goal: goal, goalFuture: goalFuture };
  }
  function sipTable(R) {
    return {
      head: [[t('col_year')], [t('col_sip'), 1], [t('col_inv_y'), 1], [t('col_inv_tot'), 1], [t('col_value'), 1], [t('col_gain'), 1], [t('col_real'), 1]],
      rows: R.rows.map(function (x) {
        return { cells: [nf(x.y), rs(x.sip), rs(x.invY), rs(x.invested), rs(x.value), rs(x.gain), rs(x.real)], raw: [x.y, r2(x.sip), r2(x.invY), r2(x.invested), r2(x.value), r2(x.gain), r2(x.real)] };
      })
    };
  }

  /* ================================================================ FD / RD tab */
  function renderFd() {
    ['fdAmt', 'fdRate', 'fdYrs', 'fdMos', 'rdAmt', 'rdRate', 'rdN'].forEach(syncField);
    syncSeg('fdKind', 'fdKind');
    var rd = S.fdKind === 'rd';
    $('#fdBox').hidden = rd; $('#rdBox').hidden = !rd;
    $('#fdPayout').value = S.fdPayout;
    $('#fdSenior').checked = !!S.fdSenior;
    var res = $('#fdRes'), bonus = S.fdSenior ? 0.5 : 0, R, rate, months, P;
    var th = $('#fdTenureHint');
    if (!rd) {
      P = num('fdAmt'); rate = num('fdRate'); var y = num('fdYrs'), mo = num('fdMos');
      months = isNaN(y) || isNaN(mo) ? NaN : y * 12 + mo;
      th.textContent = months === 0 ? t('err_tenure') : isNaN(months) ? (fieldErr('fdYrs') || fieldErr('fdMos') || t('err_fix')) : '';
      th.classList.toggle('err', !(months > 0));
    } else { P = num('rdAmt'); rate = num('rdRate'); months = num('rdN'); }
    if (isNaN(P) || isNaN(rate) || !(months >= 1) || Math.floor(months) !== months) {
      errBox(res); $('#fdTable').innerHTML = ''; $('#fdLegend').innerHTML = '';
      chart('fdChart', { n: 1, bars: [], xKey: function () { return null; }, tip: function () { return { title: '', items: [] }; } });
      return;
    }
    var used = rate + bonus;
    res.innerHTML = '';
    var sub = t('fd_sub', { t: tenureTxt(months), r: pc(used) }) + (bonus ? ' ' + t('fd_senior_used') : '');
    var big, rows, head, tRows, copyTxt;
    if (!rd) {
      R = F.fd({ P: P, rate: used, months: months, payout: S.fdPayout });
      if (S.fdPayout === 'cum') {
        big = [t('fd_maturity'), rs(R.maturity)];
        res.appendChild(bigBlock(big, sub));
        res.appendChild(el('div', { class: 'fc-stats' }, stat(t('fd_deposit'), rs(P)), stat(t('fd_interest'), rs(R.interest), 'good', 'fdInt'), stat(t('fd_yield'), pc(R.yieldPct), 'hl', 'fdYield')));
      } else {
        var per = S.fdPayout === 'month' ? R.monthly : R.quarterly;
        big = [S.fdPayout === 'month' ? t('fd_per_month') : t('fd_per_quarter'), rs(per)];
        res.appendChild(bigBlock(big, sub));
        res.appendChild(el('div', { class: 'fc-stats' }, stat(t('fd_deposit'), rs(P)), stat(t('fd_interest'), rs(R.interest), 'good', 'fdInt'), stat(t('fd_back'), rs(R.maturity), 'hl')));
      }
      res.appendChild(pibar(P, R.interest));
      copyTxt = t('sum_fd', { amt: rs(P), r: pc(used), t: tenureTxt(months), mat: rs(P + R.interest), int: rs(R.interest) });
      rows = R.rows;
      head = [[t('col_year')], [S.fdPayout === 'cum' ? t('col_int_y') : t('col_int_paid'), 1], [t('col_int_tot'), 1], [t('col_value'), 1]];
      tRows = rows.map(function (x) { return { cells: [nf(x.y), rs(x.intY), rs(x.cumInt), rs(x.value)], raw: [x.y, r2(x.intY), r2(x.cumInt), r2(x.value)] }; });
    } else {
      R = F.rd({ R: P, rate: used, months: months });
      res.appendChild(bigBlock([t('fd_maturity'), rs(R.maturity)], t('rd_sub', { n: nf(months), amt: rs(P), r: pc(used) }) + (bonus ? ' ' + t('fd_senior_used') : '')));
      res.appendChild(el('div', { class: 'fc-stats two' }, stat(t('rd_deposited'), rs(R.deposited)), stat(t('fd_interest'), rs(R.interest), 'good', 'fdInt')));
      res.appendChild(pibar(R.deposited, R.interest));
      copyTxt = t('sum_rd', { amt: rs(P), n: nf(months), r: pc(used), mat: rs(R.maturity), int: rs(R.interest) });
      rows = R.rows;
      head = [[t('col_year')], [t('col_dep_y'), 1], [t('col_dep_tot'), 1], [t('col_int_tot'), 1], [t('col_value'), 1]];
      tRows = rows.map(function (x) { return { cells: [nf(x.y), rs(x.depY), rs(x.dep), rs(x.cumInt), rs(x.value)], raw: [x.y, r2(x.depY), r2(x.dep), r2(x.cumInt), r2(x.value)] }; });
    }
    res.appendChild(el('div', { class: 'fc-legend' },
      el('span', null, el('i', { class: 'sw sw-c1' }), rd ? t('rd_deposited') : t('fd_deposit')),
      el('span', null, el('i', { class: 'sw sw-c2' }), t('fd_interest'))));
    res.appendChild(el('div', { class: 'fc-res-actions no-print' },
      el('button', { type: 'button', class: 'btn btn-sm', id: 'fdCopy', onclick: function () { copySummary(copyTxt, 'fd'); } }, el('span', { 'aria-hidden': 'true', text: '📋' }), ' ', t('copy_sum'))));
    chart('fdChart', {
      n: rows.length,
      bars: [{ cls: 'b-c1', vals: rows.map(function (x) { return rd ? x.dep : P; }) }, { cls: 'b-c2', vals: rows.map(function (x) { return x.cumInt; }) }],
      xKey: function (k) { return rows[k].y; },
      tip: function (k) {
        var x = rows[k];
        return { title: t('year_n', { n: x.y }), items: [['c1', rd ? t('rd_deposited') : t('fd_deposit'), rs(rd ? x.dep : P)], ['c2', t('col_int_tot'), rs(x.cumInt)]] };
      },
      aria: t('ch_growth')
    });
    legend('fdLegend', [['c1', rd ? t('rd_deposited') : t('fd_deposit'), 'bar'], ['c2', t('col_int_tot'), 'bar']]);
    table('fdTable', head, tRows);
    last.fd = { head: head, rows: tRows, rd: rd, P: P, used: used, months: months, R: R };
  }
  function bigBlock(big, sub) {
    return el('div', { class: 'fc-big' }, el('span', { class: 'muted', text: big[0] }), bigNum('fdBig', big[1]), el('span', { class: 'small muted', text: sub }));
  }

  /* ================================================================ PPF tab */
  function buildExt() {
    var sel = $('#ppfExt'); sel.innerHTML = '';
    ENUMS.ppfExt.forEach(function (v) {
      sel.appendChild(el('option', { value: v, text: v === '0' ? t('ppf_ext_none') : t('ppf_ext_n', { n: v, y: 15 + (+v) }) }));
    });
    sel.value = S.ppfExt;
  }
  function renderPpf() {
    ['ppfAmt', 'ppfRate'].forEach(syncField);
    syncSeg('ppfMode', 'ppfMode');
    buildExt();
    $('#ppfExtDepBox').hidden = S.ppfExt === '0';
    $('#ppfExtDep').checked = !!S.ppfExtDep;
    var res = $('#ppfRes'), D = num('ppfAmt'), rate = num('ppfRate');
    if (isNaN(D) || isNaN(rate)) {
      errBox(res); $('#ppfTable').innerHTML = ''; $('#ppfLegend').innerHTML = '';
      chart('ppfChart', { n: 1, bars: [], xKey: function () { return null; }, tip: function () { return { title: '', items: [] }; } });
      return;
    }
    var R = F.ppf({ D: D, rate: rate, monthly: S.ppfMode === 'monthly', ext: +S.ppfExt, extDep: S.ppfExtDep });
    res.innerHTML = '';
    res.appendChild(el('div', { class: 'fc-big' },
      el('span', { class: 'muted', text: t('fd_maturity') }),
      bigNum('ppfBig', rs(R.maturity)),
      el('span', { class: 'small muted', text: t('ppf_sub', { y: nf(R.years), r: pc(rate) }) })));
    res.appendChild(el('div', { class: 'fc-stats' },
      stat(t('rd_deposited'), rs(R.deposited), '', 'ppfDep'), stat(t('fd_interest'), rs(R.interest), 'good', 'ppfInt'), stat(t('ppf_years'), tenureTxt(R.years * 12), 'hl')));
    res.appendChild(pibar(R.deposited, R.interest));
    res.appendChild(el('div', { class: 'fc-legend' },
      el('span', null, el('i', { class: 'sw sw-c1' }), t('rd_deposited')),
      el('span', null, el('i', { class: 'sw sw-c2' }), t('fd_interest'))));
    res.appendChild(el('p', { class: 'callout success small mb0', style: { marginTop: '10px' }, text: t('ppf_tax') }));
    res.appendChild(el('div', { class: 'fc-res-actions no-print' },
      el('button', { type: 'button', class: 'btn btn-sm', id: 'ppfCopy', onclick: function () {
        copySummary(t('sum_ppf', { amt: rs(Math.min(D, 150000)), r: pc(rate), y: nf(R.years), mat: rs(R.maturity), int: rs(R.interest) }), 'ppf');
      } }, el('span', { 'aria-hidden': 'true', text: '📋' }), ' ', t('copy_sum'))));
    var rows = R.rows;
    chart('ppfChart', {
      n: rows.length,
      bars: [{ cls: 'b-c1', vals: rows.map(function (x) { return x.cumDep; }) }, { cls: 'b-c2', vals: rows.map(function (x) { return x.cumInt; }) }],
      xKey: function (k) { return rows[k].y; },
      tip: function (k) { var x = rows[k]; return { title: t('year_n', { n: x.y }), items: [['c1', t('rd_deposited'), rs(x.cumDep)], ['c2', t('fd_interest'), rs(x.cumInt)], ['', t('col_balance'), rs(x.bal)]] }; },
      aria: t('ch_growth') + ': ' + rs(R.maturity)
    });
    legend('ppfLegend', [['c1', t('rd_deposited'), 'bar'], ['c2', t('fd_interest'), 'bar']]);
    var head = [[t('col_year')], [t('col_deposit'), 1], [t('col_interest'), 1], [t('col_balance'), 1]];
    var tRows = rows.map(function (x) { return { cells: [nf(x.y), rs(x.dep), rs(x.int), rs(x.bal)], cls: x.y === 15 && R.years > 15 ? 'ev' : '', raw: [x.y, r2(x.dep), r2(x.int), r2(x.bal)] }; });
    table('ppfTable', head, tRows, [t('total'), rs(R.deposited), rs(R.interest), rs(R.maturity)]);
    last.ppf = { head: head, rows: tRows, R: R, D: D, rate: rate };
  }

  var RENDER = { emi: renderEmi, sip: renderSip, fd: renderFd, ppf: renderPpf };

  /* ================================================================ tabs */
  var TABS = ['emi', 'sip', 'fd', 'ppf'];
  function setTab(name, focus) {
    if (TABS.indexOf(name) < 0) name = 'emi';
    S.tab = name; save();
    TABS.forEach(function (tb) {
      var on = tb === name, b = $('#tab-' + tb);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      $('#p-' + tb).hidden = !on;
    });
    RENDER[name]();
    Object.keys(charts).forEach(function (id) { var h = $('#' + id); if (h && h._dirty) drawChart(id); });
    if (focus) $('#tab-' + name).focus();
  }
  $$('#tabs button').forEach(function (b) {
    b.addEventListener('click', function () { setTab(b.getAttribute('data-tab')); });
    b.addEventListener('keydown', function (e) {
      var k = e.key, rtl = document.documentElement.dir === 'rtl', i = TABS.indexOf(b.getAttribute('data-tab'));
      if (k === 'ArrowRight' || k === 'ArrowLeft') i += ((k === 'ArrowRight') !== rtl ? 1 : -1);
      else if (k === 'Home') i = 0; else if (k === 'End') i = TABS.length - 1; else return;
      setTab(TABS[(i + TABS.length) % TABS.length], true);
      e.preventDefault();
    });
  });

  /* ================================================================ wiring */
  $$('[data-f]').forEach(buildField);
  bindChart('emiChart'); bindChart('sipChart'); bindChart('fdChart'); bindChart('ppfChart');

  function syncPresets() { $$('#presets [data-preset]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-preset') === S.preset ? 'true' : 'false'); }); }
  $$('#presets [data-preset]').forEach(function (b) {
    b.addEventListener('click', function () {
      var p = PRESETS[b.getAttribute('data-preset')];
      Object.keys(p).forEach(function (k) { setField(k, p[k]); });
      S.preset = b.getAttribute('data-preset'); syncPresets(); save(); schedule('emi');
    });
  });
  var yrR = $('#emiYrsR');
  yrR.addEventListener('input', function () { setField('emiYrs', +yrR.value); if (S.preset) { S.preset = ''; syncPresets(); } save(); schedule('emi'); });
  $('#emiStart').addEventListener('change', function () { var v = $('#emiStart').value; if (/^\d{4}-\d{2}$/.test(v)) { S.emiStart = v; save(); schedule('emi'); } });

  $('#ppAdd').addEventListener('click', function () {
    if (S.pp.length >= MAX_ROWS) return;
    var P = num('emiAmt'), amt = P > 0 ? Math.max(1000, Math.round(P * 0.05 / 10000) * 10000 || Math.round(P * 0.05)) : 100000;
    S.pp.push({ amt: nf(amt), at: '12', freq: 'yearly' });
    save(); buildRows(); schedule('emi');
    var inp = $('#pp' + (S.pp.length - 1) + 'a'); if (inp) inp.focus();
  });
  $('#rcAdd').addEventListener('click', function () {
    if (S.rc.length >= MAX_ROWS) return;
    var r = num('emiRate');
    S.rc.push({ at: String(12 * (S.rc.length + 1) + 1), rate: String(isNaN(r) ? 9 : +(r + 0.5).toFixed(2)) });
    save(); buildRows(); schedule('emi');
    var inp = $('#rc' + (S.rc.length - 1) + 'm'); if (inp) inp.focus();
  });
  bindSeg('ppMode', 'ppMode', 'emi');
  bindSeg('rcMode', 'rcMode', 'emi');
  bindSeg('emiChartSeg', 'chart', 'emi');
  bindSeg('schView', 'view', 'emi');
  bindSeg('flPer', 'flPer', 'emi');
  bindCheck('aprGst', 'aprGst', 'emi');
  bindSeg('sipMode', 'sipMode', 'sip');
  bindCheck('sipToday', 'sipToday', 'sip');
  bindSeg('fdKind', 'fdKind', 'fd');
  bindCheck('fdSenior', 'fdSenior', 'fd');
  $('#fdPayout').addEventListener('change', function () { S.fdPayout = $('#fdPayout').value; save(); schedule('fd'); });
  bindSeg('ppfMode', 'ppfMode', 'ppf');
  bindCheck('ppfExtDep', 'ppfExtDep', 'ppf');
  $('#ppfExt').addEventListener('change', function () { S.ppfExt = $('#ppfExt').value; save(); schedule('ppf'); });

  /* CSV + print */
  function slugDate() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  $('#emiCsv').addEventListener('click', function () {
    var e = last.emi; if (!e) return EDU.toast(t('err_fix'));
    var d = scheduleData(e.L, e.plan, changesIn(e.L));
    csvDownload('emi-schedule-' + slugDate() + '.csv', [
      [t('app_title')], [t('f_loan_amt'), e.L.P], [t('f_rate') + ' (%)', e.L.rate], [t('f_tenure'), tenureTxt(e.L.n)], [t('f_start'), monthName(e.L.start)],
      [t('r_emi'), r2(e.base.emi0)], [t('r_interest'), r2(e.base.totInt)], [t('cmp_plan') + ': ' + t('r_interest'), r2(e.plan.totInt)], [t('disc_title'), t('disclaimer')]
    ], d.head.map(function (h) { return h[0]; }), d.rows.map(function (r) { return r.raw; }));
  });
  $('#sipCsv').addEventListener('click', function () {
    var s = last.sip; if (!s) return EDU.toast(t('err_fix'));
    var d = sipTable(s.R);
    csvDownload('sip-plan-' + slugDate() + '.csv', [
      [t('app_title')], [t('sip_amt'), r2(s.R.rows[0] ? s.R.rows[0].sip : 0)], [t('sip_step') + ' (%)', s.o.step], [t('sip_ret') + ' (%)', s.o.ret], [t('sip_yrs'), s.o.yrs],
      [t('sip_lump'), s.o.lump], [t('sip_inf') + ' (%)', s.o.inf], [t('sip_value'), r2(s.R.value)], [t('disc_title'), t('disclaimer')]
    ], d.head.map(function (h) { return h[0]; }), d.rows.map(function (r) { return r.raw; }));
  });
  $('#fdCsv').addEventListener('click', function () {
    var f = last.fd; if (!f) return EDU.toast(t('err_fix'));
    csvDownload((f.rd ? 'rd' : 'fd') + '-plan-' + slugDate() + '.csv', [
      [t('app_title') + ' · ' + (f.rd ? t('fd_kind_rd') : t('fd_kind_fd'))], [f.rd ? t('rd_amt') : t('fd_amt'), f.P], [t('f_rate') + ' (%)', f.used], [t('f_tenure'), tenureTxt(f.months)],
      [t('fd_maturity'), r2(f.rd ? f.R.maturity : f.P + f.R.interest)], [t('fd_interest'), r2(f.R.interest)], [t('disc_title'), t('disclaimer')]
    ], f.head.map(function (h) { return h[0]; }), f.rows.map(function (r) { return r.raw; }));
  });
  $('#ppfCsv').addEventListener('click', function () {
    var p = last.ppf; if (!p) return EDU.toast(t('err_fix'));
    csvDownload('ppf-plan-' + slugDate() + '.csv', [
      [t('app_title') + ' · PPF'], [t('ppf_amt'), Math.min(p.D, 150000)], [t('f_rate') + ' (%)', p.rate], [t('fd_maturity'), r2(p.R.maturity)], [t('disc_title'), t('disclaimer')]
    ], p.head.map(function (h) { return h[0]; }), p.rows.map(function (r) { return r.raw; }));
  });
  ['emiPrint', 'sipPrint', 'fdPrint', 'ppfPrint'].forEach(function (id) { $('#' + id).addEventListener('click', doPrint); });

  $('#resetAll').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    var tab = S.tab;
    S = clean(null); S.tab = tab;
    store.set('s', S);
    Object.keys(FIELDS).forEach(function (id) { var i = $('#' + id); if (i) i.value = S[id]; });
    ['aprGst', 'sipToday', 'fdSenior', 'ppfExtDep'].forEach(function (id) { $('#' + id).checked = !!S[id]; });
    syncPresets(); buildRows(); renderAll();
  });

  function renderAll() {
    ['ppMode', 'rcMode', 'flPer'].forEach(function (k) { syncSeg(k, k); });
    TABS.forEach(function (tb) { RENDER[tb](); });
  }
  EDU.onLang(function () { buildRows(); renderAll(); });

  syncPresets();
  buildRows();
  ['ppMode', 'rcMode', 'flPer'].forEach(function (k) { syncSeg(k, k); });
  $('#aprGst').checked = !!S.aprGst;
  TABS.forEach(function (tb) { if (tb !== S.tab) RENDER[tb](); });
  setTab(S.tab);
  if (fromLink) { save(); EDU.toast(t('link_loaded')); }
})();
