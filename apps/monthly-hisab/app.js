/* Monthly Hisab: a household's monthly account for daily deliveries and services
   (milk, newspaper, water cans, tiffin, ironing, house help, cook, driver ...).

   Data (saved with EDU.store('monthly-hisab'), never sent anywhere):
     items:  [{ id, tpl, kind:'qty'|'staff', name, unit, from:'YYYY-MM', until:'YYYY-MM'|'', skip:['YYYY-MM'],
                plan:  [{ from:''|'YYYY-MM', dq, sq }]                         qty items: usual quantity a day, Sunday quantity
                       [{ from:''|'YYYY-MM', pay:'month'|'day', sal, lv, basis:'m'|'30', off }]   staff
                rates: [{ from:''|'YYYY-MM-DD', r }]                           price for one unit / pay for one day
                sample }]
     months: { 'YYYY-MM': { <itemId>: { d:{ <day>: qty | 'p'|'a'|'h'|'o' }, paid, adj, an, ank, prev } } }
   Money is kept in paise and quantities in hundredths (1.5 L = 150), so every sum is exact.

   Bill rules (also shown in the app):
     quantity items  bill = Σ (quantity that day × rate that day), grouped by rate
     monthly salary  1 day's pay = salary ÷ days in that month (or ÷ 30, a per-person choice), rounded to the paisa;
                     absent days (half day = ½) above the allowed leaves are cut at 1 day's pay; holidays you give are not leave
     per-day pay     days present (half day = ½) × pay for one day
     balance         previous dues + bill + extra − paid; it is carried to next month as previous dues */
(function () {
  'use strict';
  var SLUG = 'monthly-hisab';
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$;

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  var MAX_RATE = 100000000;      /* ₹10,00,000 for one unit or one day */
  var MAX_AMT = 1000000000;      /* ₹1,00,00,000 */
  var MAX_QTY = 100000;          /* 1000 a day (hundredths) */
  var MAX_LV = 3100;             /* 31 leave days */
  var UNITS = ['l', 'kg', 'packet', 'copy', 'can', 'meal', 'piece'];
  var TPL = {
    milk: { k: 'qty', u: 'l', dq: 100 }, paper: { k: 'qty', u: 'copy', dq: 100 }, water: { k: 'qty', u: 'can', dq: 0 },
    tiffin: { k: 'qty', u: 'meal', dq: 100 }, iron: { k: 'qty', u: 'piece', dq: 0 }, other_qty: { k: 'qty', u: 'piece', dq: 100 },
    maid: { k: 'staff', lv: 200 }, cook: { k: 'staff', lv: 200 }, driver: { k: 'staff', lv: 200 }, car: { k: 'staff', lv: 0 }, other_staff: { k: 'staff', lv: 0 }
  };
  var TPL_ORDER = ['milk', 'paper', 'water', 'tiffin', 'iron', 'other_qty', 'maid', 'cook', 'driver', 'car', 'other_staff'];
  var STATES = ['p', 'a', 'h', 'o'];
  var SYM = { p: '✓', a: '✕', h: '½', o: '○' };
  var ID_RE = /^[a-z0-9]{4,24}$/;

  /* ---------------- small helpers ---------------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function parseYm(s) {
    var m = /^(\d{4})-(\d{2})$/.exec(typeof s === 'string' ? s : '');
    if (!m) return null;
    var y = +m[1], mo = +m[2] - 1;
    return mo >= 0 && mo <= 11 && y >= 1990 && y <= 2100 ? { y: y, m: mo } : null;
  }
  function ymOf(y, m) { return y + '-' + pad(m + 1); }
  function addYm(ym, n) { var p = parseYm(ym), k = p.y * 12 + p.m + n; return ymOf(Math.floor(k / 12), ((k % 12) + 12) % 12); }
  function daysIn(ym) { var p = parseYm(ym); return new Date(p.y, p.m + 1, 0).getDate(); }
  function wday(ym, d) { var p = parseYm(ym); return new Date(p.y, p.m, d).getDay(); }
  function dstr(ym, d) { return ym + '-' + pad(d); }
  function nowYm() { var n = new Date(); return ymOf(n.getFullYear(), n.getMonth()); }
  function todayStr() { var n = new Date(); return ymOf(n.getFullYear(), n.getMonth()) + '-' + pad(n.getDate()); }
  function okYm(s) { return !!parseYm(s); }
  function okDate(s) { var m = /^(\d{4}-\d{2})-(\d{2})$/.exec(typeof s === 'string' ? s : ''); return !!m && okYm(m[1]) && +m[2] >= 1 && +m[2] <= daysIn(m[1]); }
  function list(key) { return String(t(key)).split(',').map(function (s) { return s.trim(); }); }
  function monthLabel(ym) { var p = parseYm(ym); return (list('months')[p.m] || String(p.m + 1)) + ' ' + p.y; }
  function dmy(ds) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ds); return m ? iso(m[3] + '/' + m[2] + '/' + m[1]) : ds; }
  function dayMonth(ym, d) { var p = parseYm(ym); return d + ' ' + (list('months')[p.m] || ''); }
  var uidN = 0;
  function uid() { return Date.now().toString(36).slice(-6) + Math.random().toString(36).slice(2, 7) + (uidN++).toString(36); }
  function str(x, max) { return (typeof x === 'string' ? x : '').replace(/\s+/g, ' ').trim().slice(0, max || 60); }
  function int(x, lo, hi, d) { if (x === null || x === '' || typeof x === 'boolean') return d; var n = Math.round(+x); return isFinite(n) && n >= lo && n <= hi ? n : d; }

  function groupIn(n) {
    var s = String(n); if (s.length <= 3) return s;
    var last = s.slice(-3), rest = s.slice(0, -3);
    return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last;
  }
  /* In Urdu (right-to-left) an amount inside a sentence is wrapped in a left-to-right isolate, so "₹4,300" never shows as "4,300₹" */
  function iso(s) { return EDU.langInfo(EDU.lang).dir === 'rtl' ? '⁦' + s + '⁩' : s; }
  /* ₹1,922 · ₹5,806.45 · −₹500 (Indian grouping, paise only when there are any) */
  function money(p) { var a = Math.abs(p), ps = a % 100; return iso((p < 0 ? '−' : '') + '₹' + groupIn(Math.floor(a / 100)) + (ps ? '.' + pad(ps) : '')); }
  function plainRs(p) { var a = Math.abs(p); return (p < 0 ? '-' : '') + Math.floor(a / 100) + '.' + pad(a % 100); }
  function qtyStr(h) { var s = (Math.abs(h) / 100).toFixed(2).replace(/\.?0+$/, ''); return (h < 0 ? '−' : '') + s; }
  function numSpan(s) { return el('span', { class: 'num', text: s }); }
  function unitOf(it) { return t('u_' + it.unit); }

  /* Indian-language digits typed on a phone keyboard become 0-9 */
  var DIGIT_BASES = [0x966, 0x9E6, 0xA66, 0xAE6, 0xB66, 0xBE6, 0xC66, 0xCE6, 0xD66, 0x660, 0x6F0];
  function asciiDigits(s) {
    return String(s == null ? '' : s).replace(/[०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯٠-٩۰-۹]/g, function (c) {
      var x = c.charCodeAt(0);
      for (var i = 0; i < DIGIT_BASES.length; i++) if (x >= DIGIT_BASES[i] && x <= DIGIT_BASES[i] + 9) return String(x - DIGIT_BASES[i]);
      return c;
    });
  }
  /* "1,922.50" / "₹62" / "1.5" → hundredths (paise or quantity×100). {empty} | {v} | {err: key} */
  function parseHund(raw, allowNeg, max) {
    var s = asciiDigits(raw).trim().replace(/^(rs\.?|inr)/i, '').replace(/[₹,\s]/g, '').replace(/\/-$/, '').replace(/[−–]/g, '-');
    if (s === '') return { empty: true };
    var m = /^([-+]?)(\d*)(?:\.(\d*))?$/.exec(s);
    if (!m || (m[2] === '' && !m[3])) return { err: 'err_num' };
    if (m[3] && m[3].length > 2) return { err: 'err_dec' };
    if (m[1] === '-' && !allowNeg) return { err: 'err_neg' };
    if (m[2].length > 11) return { err: 'err_big' };
    var v = (+(m[2] || '0')) * 100 + (+((m[3] || '') + '00').slice(0, 2));
    if (v > max) return { err: 'err_big' };
    return { v: m[1] === '-' && v ? -v : v };
  }

  /* ---------------- data ---------------- */
  function blank() { return { v: 1, items: [], months: {}, house: '', started: true }; }
  function defaultPlan(kind, tpl) {
    var T = TPL[tpl] || {};
    return kind === 'qty' ? { from: '', dq: T.dq === undefined ? 100 : T.dq, sq: null } : { from: '', pay: 'month', sal: 0, lv: T.lv || 0, basis: 'm', off: -1 };
  }
  function cleanPlan(p, kind) {
    if (!p || typeof p !== 'object') return null;
    var from = p.from === '' ? '' : okYm(p.from) ? p.from : null;
    if (from === null) return null;
    if (kind === 'qty') return { from: from, dq: int(p.dq, 0, MAX_QTY, 100), sq: int(p.sq, 0, MAX_QTY, null) };
    return { from: from, pay: p.pay === 'day' ? 'day' : 'month', sal: int(p.sal, 0, MAX_AMT, 0), lv: int(p.lv, 0, MAX_LV, 0), basis: p.basis === '30' ? '30' : 'm', off: int(p.off, -1, 6, -1) };
  }
  function byFrom(a, b) { return a.from < b.from ? -1 : a.from > b.from ? 1 : 0; }
  function cleanItem(x, seen) {
    if (!x || typeof x !== 'object') return null;
    var id = typeof x.id === 'string' && ID_RE.test(x.id) && !seen[x.id] ? x.id : uid();
    seen[id] = 1;
    var tpl = Object.prototype.hasOwnProperty.call(TPL, x.tpl) ? x.tpl : (x.kind === 'staff' ? 'other_staff' : 'other_qty');
    var kind = TPL[tpl].k;
    var it = { id: id, tpl: tpl, kind: kind, name: str(x.name, 40), unit: UNITS.indexOf(x.unit) >= 0 ? x.unit : (TPL[tpl].u || 'piece'),
      from: okYm(x.from) ? x.from : nowYm(), until: okYm(x.until) ? x.until : '', skip: [], plan: [], rates: [], sample: x.sample === true };
    if (it.until && it.until < it.from) it.until = '';
    (Array.isArray(x.skip) ? x.skip : []).forEach(function (s) { if (okYm(s) && it.skip.indexOf(s) < 0 && it.skip.length < 600) it.skip.push(s); });
    (Array.isArray(x.plan) ? x.plan : []).slice(0, 600).forEach(function (p) {
      var e = cleanPlan(p, kind); if (!e) return;
      it.plan = it.plan.filter(function (q) { return q.from !== e.from; }); it.plan.push(e);
    });
    (Array.isArray(x.rates) ? x.rates : []).slice(0, 2000).forEach(function (r) {
      if (!r || typeof r !== 'object') return;
      var from = r.from === '' ? '' : okDate(r.from) ? r.from : null;
      if (from === null) return;
      var e = { from: from, r: int(r.r, 0, MAX_RATE, 0) };
      it.rates = it.rates.filter(function (q) { return q.from !== from; }); it.rates.push(e);
    });
    it.plan.sort(byFrom); it.rates.sort(byFrom);
    if (!it.plan.length) it.plan.push(defaultPlan(kind, tpl)); else it.plan[0].from = '';
    if (!it.rates.length) it.rates.push({ from: '', r: 0 }); else it.rates[0].from = '';
    return it;
  }
  function cleanRec(r, it, ym) {
    var out = { d: {}, paid: 0, adj: 0, an: '', ank: 0, prev: null };
    if (!r || typeof r !== 'object') return out;
    var N = daysIn(ym);
    if (r.d && typeof r.d === 'object') Object.keys(r.d).forEach(function (k) {
      var d = +k; if (!(d >= 1 && d <= N && String(d) === k)) return;
      var v = r.d[k];
      if (it.kind === 'qty') { var q = int(v, 0, MAX_QTY, null); if (q !== null) out.d[d] = q; }
      else if (STATES.indexOf(v) >= 0) out.d[d] = v;
    });
    out.paid = int(r.paid, 0, MAX_AMT, 0);
    out.adj = int(r.adj, -MAX_AMT, MAX_AMT, 0);
    out.an = str(r.an, 40);
    out.ank = it.sample && r.ank === 1 ? 1 : 0;
    out.prev = int(r.prev, -MAX_AMT, MAX_AMT, null);
    return out;
  }
  function cleanData(x) {
    var D = blank();
    if (!x || typeof x !== 'object') return D;
    var seen = Object.create(null);
    D.items = (Array.isArray(x.items) ? x.items : []).slice(0, 200).map(function (i) { return cleanItem(i, seen); }).filter(Boolean);
    var byId = Object.create(null); D.items.forEach(function (i) { byId[i.id] = i; });
    if (x.months && typeof x.months === 'object') Object.keys(x.months).forEach(function (ym) {
      if (!okYm(ym) || !x.months[ym] || typeof x.months[ym] !== 'object') return;
      Object.keys(x.months[ym]).forEach(function (id) {
        if (!Object.prototype.hasOwnProperty.call(byId, id)) return;
        var r = cleanRec(x.months[ym][id], byId[id], ym);
        if (isEmptyRec(r)) return;
        (D.months[ym] = D.months[ym] || {})[id] = r;
      });
    });
    D.house = str(x.house, 50);
    D.started = x.started !== false;
    return D;
  }
  function isEmptyRec(r) { return !Object.keys(r.d).length && !r.paid && !r.adj && !r.an && r.prev === null; }

  /* clearly fictional sample month (this month), cleared on the first edit */
  function sampleData() {
    var ym = nowYm(), D = blank();
    D.started = false;
    function item(tpl, plan, rate) {
      var it = cleanItem({ tpl: tpl, from: ym, sample: true, plan: [plan], rates: [{ from: '', r: rate }] }, {});
      D.items.push(it); return it;
    }
    var milk = item('milk', { from: '', dq: 100, sq: null }, 6200);
    var paper = item('paper', { from: '', dq: 100, sq: 200 }, 600);
    var maid = item('maid', { from: '', pay: 'month', sal: 600000, lv: 200, basis: 'm', off: -1 }, 0);
    var water = item('water', { from: '', dq: 0, sq: null }, 4000);
    var M = D.months[ym] = {};
    M[milk.id] = { d: { 5: 150, 12: 150, 9: 0 }, paid: 0, adj: 0, an: '', ank: 0, prev: 12400 };
    M[paper.id] = { d: { 20: 0 }, paid: 0, adj: 0, an: '', ank: 0, prev: null };
    M[maid.id] = { d: { 3: 'a', 10: 'a', 17: 'a', 24: 'o' }, paid: 200000, adj: 50000, an: '', ank: 1, prev: null };
    M[water.id] = { d: { 2: 100, 6: 100, 10: 100, 14: 200, 18: 100, 22: 100, 26: 100 }, paid: 0, adj: 0, an: '', ank: 0, prev: null };
    return D;
  }

  var data = (function () {
    var raw = store.get('data', null);
    if (!raw) return sampleData();
    return cleanData(raw);
  })();
  function hasSample() { return data.items.some(function (i) { return i.sample; }); }

  var ui = { ym: nowYm(), sel: null, brush: { qty: null, staff: 'a' }, other: false };
  if (hasSample()) ui.ym = data.items[0].from;

  function save() {
    memo = {};
    if (!store.set('data', data)) EDU.toast(t('save_fail'), 5000);
  }
  /* The first real edit clears the example. Returns true if the example was cleared (the caller then stops). */
  function clearSample(quiet) {
    if (!hasSample()) { if (!data.started) { data.started = true; } return false; }
    data = blank();
    ui.sel = null; ui.other = false;
    save();
    if (!quiet) EDU.toast(t('sample_cleared'), 4000);
    renderAll();
    return true;
  }

  /* ---------------- calculations ---------------- */
  var memo = {};
  function itemById(id) { for (var i = 0; i < data.items.length; i++) if (data.items[i].id === id) return data.items[i]; return null; }
  function inRange(it, ym) { return ym >= it.from && (!it.until || ym <= it.until); }
  function isSkipped(it, ym) { return it.skip.indexOf(ym) >= 0; }
  function getRec(ym, id) { var m = data.months[ym]; return m && m[id] ? m[id] : { d: {}, paid: 0, adj: 0, an: '', ank: 0, prev: null }; }
  function recFor(ym, id) { var m = data.months[ym] = data.months[ym] || {}; return m[id] = m[id] || { d: {}, paid: 0, adj: 0, an: '', ank: 0, prev: null }; }
  function tidy(ym, id) { var m = data.months[ym]; if (m && m[id] && isEmptyRec(m[id])) { delete m[id]; if (!Object.keys(m).length) delete data.months[ym]; } }
  function planFor(it, ym) { var p = it.plan[0]; for (var i = 1; i < it.plan.length; i++) if (it.plan[i].from <= ym) p = it.plan[i]; return p; }
  function rateOn(it, ds) { var r = it.rates[0].r; for (var i = 1; i < it.rates.length; i++) if (it.rates[i].from <= ds) r = it.rates[i].r; return r; }
  function usualOf(it, ym, d, plan) {
    if (it.kind === 'qty') return plan.sq !== null && wday(ym, d) === 0 ? plan.sq : plan.dq;
    return plan.off === wday(ym, d) ? 'o' : 'p';
  }
  function dayValue(it, ym, d, plan, r) { var v = r.d[d]; return v !== undefined ? v : usualOf(it, ym, d, plan); }

  /* the bill of one item for one month, without dues */
  function base(it, ym) {
    var key = 'b|' + it.id + '|' + ym;
    if (memo[key]) return memo[key];
    var N = daysIn(ym), plan = planFor(it, ym), r = getRec(ym, it.id);
    var out = { ym: ym, N: N, plan: plan, skipped: isSkipped(it, ym), groups: [], bill: 0 };
    var gi = {}, d, v;
    function grp(rate) { var g = gi[rate]; if (!g) { g = gi[rate] = { rate: rate, q: 0, amt: 0 }; out.groups.push(g); } return g; }
    if (it.kind === 'qty') {
      out.tot = 0; out.came = 0; out.none = []; out.diff = [];
      for (d = 1; d <= N; d++) {
        var u = usualOf(it, ym, d, plan); v = dayValue(it, ym, d, plan, r);
        if (v !== u) { if (v === 0) out.none.push(d); else out.diff.push(d); }
        if (v > 0) { out.came++; out.tot += v; grp(rateOn(it, dstr(ym, d))).q += v; }
      }
    } else {
      out.cnt = { p: 0, a: 0, h: 0, o: 0 }; out.days = { p: [], a: [], h: [], o: [] };
      for (d = 1; d <= N; d++) {
        v = dayValue(it, ym, d, plan, r);
        out.cnt[v]++; out.days[v].push(d);
        if (plan.pay === 'day' && (v === 'p' || v === 'h')) grp(rateOn(it, dstr(ym, d))).q += v === 'p' ? 100 : 50;
      }
      if (plan.pay === 'month') {
        out.sal = plan.sal;
        out.absH = out.cnt.a * 100 + out.cnt.h * 50;
        out.extraH = Math.max(0, out.absH - plan.lv);
        out.basis = plan.basis === '30' ? 30 : N;
        out.perDay = Math.round(plan.sal / out.basis);
        out.cut = Math.min(plan.sal, Math.round(out.perDay * out.extraH / 100));
        out.bill = plan.sal - out.cut;
      }
    }
    out.groups.forEach(function (g) { g.amt = Math.round(g.q * g.rate / 100); if (!(it.kind === 'staff' && plan.pay === 'month')) out.bill += g.amt; });
    out.full = out.bill;
    if (out.skipped) out.bill = 0;
    memo[key] = out;
    return out;
  }
  /* previous dues, paid, extra and balance; walks forward from the first month so the chain never recurses */
  function full(it, ym) {
    var key = 'f|' + it.id + '|' + ym;
    if (memo[key]) return memo[key];
    var m = it.from, bal = 0, res = null;
    while (m <= ym) {
      var k2 = 'f|' + it.id + '|' + m;
      if (memo[k2]) { res = memo[k2]; }
      else {
        var b = base(it, m), r = getRec(m, it.id);
        var auto = m === it.from ? 0 : bal;
        var prev = r.prev !== null ? r.prev : auto;
        res = { b: b, auto: auto, prev: prev, prevSet: r.prev !== null, adj: r.adj, paid: r.paid, an: r.ank ? t('sample_bonus') : r.an };
        res.bal = prev + b.bill + r.adj - r.paid;
        memo[k2] = res;
      }
      bal = res.bal; m = addYm(m, 1);
    }
    return res || { b: base(it, ym), auto: 0, prev: 0, prevSet: false, adj: 0, paid: 0, an: '', bal: base(it, ym).bill };
  }
  function countedItems(ym) { return data.items.filter(function (i) { return inRange(i, ym); }); }

  /* ---------------- text of a bill (screen, WhatsApp, print) ---------------- */
  function dayList(arr) { return arr.join(', '); }
  function billLines(it, ym) {
    /* [{k:'ln'|'note'|'tot'|'rule', a: left text, b: amount text}] */
    var F = full(it, ym), B = F.b, P = B.plan, L = [];
    if (B.skipped) { L.push({ k: 'note', a: t('skipped_note', { month: monthLabel(ym) }) }); }
    if (it.kind === 'qty') {
      L.push({ k: 'note', a: t('l_came', { n: B.came, d: B.N, q: qtyStr(B.tot), unit: unitOf(it) }) });
      B.groups.forEach(function (g) { L.push({ k: 'ln', a: t('l_qty_line', { q: qtyStr(g.q), unit: unitOf(it), rate: money(g.rate) }), b: money(g.amt) }); });
      if (B.none.length) L.push({ k: 'note', a: t('l_none_days', { list: dayList(B.none) }) });
      if (B.diff.length) L.push({ k: 'note', a: t('l_diff_days', { list: B.diff.map(function (d) { return d + ' (' + qtyStr(dayValue(it, ym, d, P, getRec(ym, it.id))) + ')'; }).join(', ') }) });
      if (!B.groups.length) L.push({ k: 'ln', a: t('l_nothing'), b: money(0) });
    } else {
      L.push({ k: 'note', a: t('l_att', { p: B.cnt.p, a: B.cnt.a, h: B.cnt.h, o: B.cnt.o }) });
      if (B.days.a.length) L.push({ k: 'note', a: t('l_absent_days', { list: dayList(B.days.a) }) });
      if (B.days.h.length) L.push({ k: 'note', a: t('l_half_days', { list: dayList(B.days.h) }) });
      if (P.pay === 'month') {
        L.push({ k: 'ln', a: t('l_salary'), b: money(B.sal) });
        if (B.absH > 0) L.push({ k: 'note', a: t('l_leaves', { a: qtyStr(B.absH), l: qtyStr(P.lv), x: qtyStr(B.extraH) }) });
        if (B.extraH > 0) {
          L.push({ k: 'note', a: P.basis === '30' ? t('l_perday_30', { sal: money(B.sal), pd: money(B.perDay) }) : t('l_perday_m', { sal: money(B.sal), d: B.N, pd: money(B.perDay) }) });
          L.push({ k: 'ln', a: t('l_cut', { x: qtyStr(B.extraH), pd: money(B.perDay) }), b: money(-B.cut) });
        } else L.push({ k: 'note', a: t('l_nocut') });
      } else {
        B.groups.forEach(function (g) { L.push({ k: 'ln', a: t('l_daily', { n: qtyStr(g.q), rate: money(g.rate) }), b: money(g.amt) }); });
        if (!B.groups.length) L.push({ k: 'ln', a: t('l_nothing'), b: money(0) });
      }
    }
    L.push({ k: 'tot', a: t('l_bill'), b: money(B.bill), id: 'bill' });
    return L;
  }
  function ruleText(it, ym) {
    if (it.kind === 'qty') return t('rule_qty');
    var P = planFor(it, ym);
    return P.pay === 'day' ? t('rule_day') : P.basis === '30' ? t('rule_30') : t('rule_month');
  }
  function planText(it, ym) {
    var P = planFor(it, ym), first = rateOn(it, dstr(ym, 1));
    if (it.kind === 'qty') {
      var s = t('plan_qty', { q: qtyStr(P.dq), unit: unitOf(it), rate: money(first) });
      if (P.sq !== null) s += ' · ' + t('plan_sun', { q: qtyStr(P.sq) });
      return s;
    }
    var s2 = P.pay === 'month' ? t('plan_month', { sal: money(P.sal), l: qtyStr(P.lv) }) : t('plan_day', { rate: money(first) });
    if (P.off >= 0) s2 += ' · ' + t('plan_off', { day: list('wd_long')[P.off] });
    return s2;
  }
  function nameOf(it) {
    if (it.name) return it.name;
    return t(it.tpl === 'other_qty' ? 'nm_other_qty' : it.tpl === 'other_staff' ? 'nm_other_staff' : 'tpl_' + it.tpl);
  }
  function balText(bal, share) {
    if (bal > 0) return t(share ? 's_bal' : 'bal_pay', { amt: money(bal) });
    if (bal < 0) return t(share ? 's_adv' : 'bal_adv', { amt: money(-bal) });
    return t('bal_zero');
  }
  function shareText(items, ym) {
    var out = ['*' + t('s_head', { month: monthLabel(ym) }) + '*'];
    if (data.house) out.push(data.house);
    var tb = 0, tp = 0, tbal = 0;
    items.forEach(function (it) {
      var F = full(it, ym);
      out.push('');
      out.push('*' + nameOf(it) + '*');
      billLines(it, ym).forEach(function (l) {
        if (l.k === 'rule') return;
        out.push(l.b !== undefined ? l.a + ': ' + l.b : l.a);
      });
      if (F.adj) out.push((F.an || t('s_extra')) + ': ' + (F.adj > 0 ? '+' : '') + money(F.adj));
      if (F.prev) out.push(t('s_prev', { amt: money(F.prev) }));
      if (F.paid) out.push(t('s_paid', { amt: money(F.paid) }));
      out.push('*' + balText(F.bal, true) + '*');
      tb += F.b.bill + F.adj; tp += F.paid; tbal += F.bal;
    });
    if (items.length > 1) {
      out.push('');
      out.push(t('s_tot_bill', { amt: money(tb) }) + ' · ' + t('s_paid', { amt: money(tp) }));
      out.push('*' + (tbal >= 0 ? t('s_total', { amt: money(tbal) }) : t('s_adv', { amt: money(-tbal) })) + '*');
    }
    return out.join('\n');
  }

  /* ---------------- rendering ---------------- */
  function renderMonth() {
    var lab = $('#monthLabel');
    lab.textContent = monthLabel(ui.ym);
    lab.setAttribute('data-ym', ui.ym);
    lab.setAttribute('data-days', String(daysIn(ui.ym)));
    $('#btnPrev').disabled = ui.ym <= '1990-01';
    $('#btnNext').disabled = ui.ym >= '2100-12';
    $('#btnToday').hidden = ui.ym === nowYm();
  }
  function renderChips() {
    var box = $('#itemChips'); box.innerHTML = '';
    var items = countedItems(ui.ym);
    if (!ui.sel || !items.some(function (i) { return i.id === ui.sel; })) ui.sel = items.length ? items[0].id : null;
    items.forEach(function (it) {
      var F = full(it, ui.ym);
      var b = el('button', { type: 'button', class: 'mh-chip' + (F.b.skipped ? ' skip' : ''), 'aria-pressed': String(it.id === ui.sel), 'data-id': it.id, 'data-p': String(F.b.bill + F.adj) },
        el('b', null, el('span', { class: 'no-i18n', text: nameOf(it) }), it.sample ? el('span', { class: 'badge accent', text: t('badge_example') }) : null),
        el('small', null, numSpan(money(F.b.bill + F.adj))));
      b.addEventListener('click', function () { if (ui.sel !== it.id) ui.brush.qty = null; ui.sel = it.id; ui.other = false; renderAll(); });
      box.appendChild(b);
    });
    $('#noItems').hidden = items.length > 0;
    var off = data.items.filter(function (i) { return !inRange(i, ui.ym); });
    var ina = $('#inactive'); ina.innerHTML = ''; ina.hidden = !off.length;
    if (off.length) {
      ina.appendChild(el('span', { class: 'lbl', text: t('not_counted_h') }));
      off.forEach(function (it) {
        ina.appendChild(el('span', { class: 'in-it' }, el('span', { class: 'no-i18n', text: nameOf(it) }),
          el('button', { type: 'button', class: 'btn btn-sm', 'data-id': it.id, text: t('count_here'), onclick: function () { countHere(it); } })));
      });
    }
  }
  function renderBrushes(it, B) {
    var box = $('#brushes'); box.innerHTML = '';
    var opts;
    if (it.kind === 'qty') {
      if (ui.brush.qty === null) ui.brush.qty = B.plan.dq > 0 ? 0 : 100;
      opts = [{ v: 'u', label: t('b_usual') }, { v: 0, label: t('b_none') }, { v: 50 }, { v: 100 }, { v: 150 }, { v: 200 }, { v: 300 }];
      var cur = ui.brush.qty;
      if (cur !== 'u' && !opts.some(function (o) { return o.v === cur; })) opts.push({ v: cur });
      opts.push({ v: 'x', label: t('b_other') });
      opts.forEach(function (o) {
        var pressed = o.v === 'x' ? ui.other : (!ui.other && o.v === cur);
        var b = el('button', { type: 'button', class: 'brush', 'data-b': String(o.v), 'aria-pressed': String(pressed) },
          o.label ? o.label : numSpan(qtyStr(o.v)));
        if (!o.label) b.setAttribute('aria-label', qtyStr(o.v) + ' ' + unitOf(it));
        b.addEventListener('click', function () {
          if (o.v === 'x') { ui.other = true; renderItem(); setTimeout(function () { var i = $('#otherQty'); if (i) i.focus(); }, 0); return; }
          ui.other = false; ui.brush.qty = o.v; renderItem();
        });
        box.appendChild(b);
      });
    } else {
      ['a', 'h', 'o', 'p'].forEach(function (s) {
        var b = el('button', { type: 'button', class: 'brush', 'data-b': s, 'aria-pressed': String(ui.brush.staff === s), text: t('b_' + s) });
        b.addEventListener('click', function () { ui.brush.staff = s; renderItem(); });
        box.appendChild(b);
      });
    }
    $('#otherRow').hidden = !(it.kind === 'qty' && ui.other);
  }
  function renderCal(it, B) {
    var cal = $('#cal'); cal.innerHTML = '';
    var wd = list('wd'), N = B.N, first = wday(ui.ym, 1), r = getRec(ui.ym, it.id), today = todayStr();
    for (var w = 0; w < 7; w++) cal.appendChild(el('div', { class: 'mh-wd' + (w === 0 ? ' sun' : ''), 'aria-hidden': 'true', text: wd[w] || '' }));
    for (var s = 0; s < first; s++) cal.appendChild(el('div', { class: 'day off-month', 'aria-hidden': 'true' }));
    for (var d = 1; d <= N; d++) {
      var u = usualOf(it, ui.ym, d, B.plan), v = dayValue(it, ui.ym, d, B.plan, r), cls = 'day', shown, said;
      if (wday(ui.ym, d) === 0) cls += ' sun';
      if (dstr(ui.ym, d) === today) cls += ' today';
      if (it.kind === 'qty') {
        if (v !== u) cls += ' chg';
        if (v === 0) { cls += u > 0 ? ' zero' : ' dim'; shown = u > 0 ? '✕' : '·'; said = t('v_none'); }
        else { shown = qtyStr(v); said = qtyStr(v) + ' ' + unitOf(it); }
      } else {
        cls += ' s-' + v + (v !== u ? ' chg' : '');
        shown = SYM[v]; said = t('v_' + v);
      }
      var b = el('button', { type: 'button', class: cls, 'data-d': String(d), 'data-v': String(v), 'aria-label': t('day_aria', { date: dayMonth(ui.ym, d), value: said }) },
        el('span', { class: 'dn', text: String(d) }), el('span', { class: 'dv', text: shown }));
      cal.appendChild(b);
    }
  }
  function renderBill(it) {
    var box = $('#bill'); box.innerHTML = '';
    box.appendChild(el('h4', { text: t('h_bill', { month: monthLabel(ui.ym) }) }));
    billLines(it, ui.ym).forEach(function (l) {
      if (l.k === 'note') box.appendChild(el('div', { class: 'note', text: l.a }));
      else {
        var row = el('div', { class: 'ln' + (l.k === 'tot' ? ' tot' : '') }, el('span', { text: l.a }), numSpan(l.b));
        if (l.id) { row.id = 'itBill'; row.setAttribute('data-p', String(full(it, ui.ym).b.bill)); }
        box.appendChild(row);
      }
    });
    box.appendChild(el('div', { class: 'rule', id: 'itRule', text: ruleText(it, ui.ym) }));
  }
  function renderBal(it) {
    var F = full(it, ui.ym), b = $('#itBal');
    b.textContent = balText(F.bal, false);
    b.className = 'bal' + (F.bal < 0 ? ' adv' : F.bal === 0 ? ' zero' : '');
    b.setAttribute('data-p', String(F.bal));
    $('#prevHint').textContent = t('prev_hint', { amt: money(F.auto) });
  }
  function setVal(id, v) { var i = $(id); if (document.activeElement !== i) i.value = v; }
  function renderInputs(it) {
    var F = full(it, ui.ym);
    setVal('#inPrev', plainIn(F.prev));
    setVal('#inPaid', F.paid ? plainIn(F.paid) : '');
    setVal('#inAdj', F.adj ? plainIn(F.adj) : '');
    setVal('#inAdjNote', getRec(ui.ym, it.id).ank ? t('sample_bonus') : getRec(ui.ym, it.id).an);
    ['#prevErr', '#paidErr', '#adjErr'].forEach(function (s) { $(s).textContent = ''; });
  }
  function plainIn(p) { var a = Math.abs(p); return (p < 0 ? '-' : '') + Math.floor(a / 100) + (a % 100 ? '.' + pad(a % 100) : ''); }
  function renderRates(it) {
    var P = planFor(it, ui.ym), monthly = it.kind === 'staff' && P.pay === 'month';
    $('#ratesBox').hidden = false;
    $('#rateForm').hidden = monthly; $('#rcMonthOnly').hidden = !monthly;
    var ul = $('#rateList'); ul.innerHTML = '';
    if (!monthly) {
      ul.appendChild(el('li', null, el('span', { text: t('r_base', { rate: money(rateOn(it, dstr(ui.ym, 1))) }) })));
      it.rates.forEach(function (r) {
        if (!r.from || r.from.slice(0, 7) !== ui.ym || r.from === dstr(ui.ym, 1)) return;
        ul.appendChild(el('li', null, el('span', { text: t('r_list', { date: dmy(r.from), rate: money(r.r) }) }),
          el('button', { type: 'button', class: 'btn btn-sm btn-danger', 'data-from': r.from, text: t('delete'), onclick: function () { removeRate(it, r.from); } })));
      });
      var di = $('#rcDate'); di.min = dstr(ui.ym, 1); di.max = dstr(ui.ym, daysIn(ui.ym));
      if (!di.value || di.value.slice(0, 7) !== ui.ym) di.value = dstr(ui.ym, Math.min(16, daysIn(ui.ym)));
    }
  }
  function renderItem() {
    var it = ui.sel ? itemById(ui.sel) : null;
    $('#itemCard').hidden = !it;
    if (!it) return;
    var B = base(it, ui.ym);
    $('#itName').textContent = nameOf(it);
    $('#itEx').hidden = !it.sample;
    $('#itPlan').textContent = planText(it, ui.ym);
    $('#btnSkip').textContent = t(B.skipped ? 'unskip_month' : 'skip_month');
    $('#btnStop').hidden = !!it.until && it.until <= ui.ym;
    $('#skipNote').hidden = !B.skipped;
    $('#skipNote').textContent = t('skipped_note', { month: monthLabel(ui.ym) });
    $('#calWrap').hidden = B.skipped;
    renderBrushes(it, B);
    renderCal(it, B);
    $('#legend').textContent = t(it.kind === 'qty' ? 'legend_qty' : 'legend_staff');
    renderBill(it);
    renderInputs(it);
    renderBal(it);
    renderRates(it);
  }
  function renderSummary() {
    var items = countedItems(ui.ym), tb = $('#sumTable');
    tb.innerHTML = '';
    $('#sumEmpty').hidden = items.length > 0;
    var tot = { bill: 0, prev: 0, paid: 0, bal: 0 };
    if (items.length) {
      tb.appendChild(el('thead', null, el('tr', null, el('th', { text: t('c_item') }), el('th', { class: 'a', text: t('c_bill') }),
        el('th', { class: 'a', text: t('c_prev') }), el('th', { class: 'a', text: t('c_paid') }), el('th', { class: 'a', text: t('c_bal') }))));
      var body = el('tbody');
      items.forEach(function (it) {
        var F = full(it, ui.ym), bill = F.b.bill + F.adj;
        tot.bill += bill; tot.prev += F.prev; tot.paid += F.paid; tot.bal += F.bal;
        body.appendChild(el('tr', { 'data-id': it.id },
          el('td', null, el('span', { class: 'no-i18n', text: nameOf(it) }), F.b.skipped ? el('small', { text: t('skip_month') }) : null),
          el('td', { class: 'a', 'data-p': String(bill) }, numSpan(money(bill))),
          el('td', { class: 'a', 'data-p': String(F.prev) }, numSpan(money(F.prev))),
          el('td', { class: 'a', 'data-p': String(F.paid) }, numSpan(money(F.paid))),
          el('td', { class: 'a', 'data-p': String(F.bal) }, numSpan(money(F.bal)), F.bal < 0 ? el('small', { text: t('adv_short') }) : null)));
      });
      tb.appendChild(body);
      tb.appendChild(el('tfoot', null, el('tr', { id: 'sumTotal' }, el('td', { text: t('total') }),
        el('td', { class: 'a', 'data-p': String(tot.bill) }, numSpan(money(tot.bill))), el('td', { class: 'a' }, numSpan(money(tot.prev))),
        el('td', { class: 'a' }, numSpan(money(tot.paid))), el('td', { class: 'a', 'data-p': String(tot.bal) }, numSpan(money(tot.bal))))));
    }
    $('#totBill').textContent = money(tot.bill); $('#totBill').setAttribute('data-p', String(tot.bill));
    $('#totPaid').textContent = money(tot.paid);
    $('#totBal').textContent = money(tot.bal); $('#totBal').setAttribute('data-p', String(tot.bal));
    ['#btnShareMonth', '#btnPrint', '#btnCsv'].forEach(function (s) { $(s).disabled = !items.length; });
  }
  function renderPrint() {
    var box = $('#printSum'); box.innerHTML = '';
    var items = countedItems(ui.ym), N = daysIn(ui.ym);
    box.appendChild(el('h1', { text: t('p_title', { month: monthLabel(ui.ym) }) }));
    box.appendChild(el('p', { class: 'p-sub' }, data.house ? el('b', { class: 'no-i18n', text: data.house + ' · ' }) : null, t('p_printed', { date: dmy(todayStr()) })));
    if (!items.length) { box.appendChild(el('p', { text: t('sum_empty') })); return; }
    var head = el('tr', null, el('th', { text: t('c_item') }), el('th', { text: t('p_details') }), el('th', { class: 'a', text: t('c_bill') }),
      el('th', { class: 'a', text: t('c_prev') }), el('th', { class: 'a', text: t('c_paid') }), el('th', { class: 'a', text: t('c_bal') }));
    var body = el('tbody'), tot = { bill: 0, prev: 0, paid: 0, bal: 0 };
    items.forEach(function (it) {
      var F = full(it, ui.ym), bill = F.b.bill + F.adj;
      tot.bill += bill; tot.prev += F.prev; tot.paid += F.paid; tot.bal += F.bal;
      var det = billLines(it, ui.ym).filter(function (l) { return l.k !== 'tot'; }).map(function (l) { return l.b !== undefined ? l.a + ': ' + l.b : l.a; });
      if (F.adj) det.push((F.an || t('s_extra')) + ': ' + (F.adj > 0 ? '+' : '') + money(F.adj));
      body.appendChild(el('tr', null, el('td', null, el('b', { class: 'no-i18n', text: nameOf(it) })), el('td', { text: det.join(' · ') }),
        el('td', { class: 'a', text: money(bill) }), el('td', { class: 'a', text: money(F.prev) }), el('td', { class: 'a', text: money(F.paid) }), el('td', { class: 'a', text: money(F.bal) })));
    });
    body.appendChild(el('tr', null, el('td', null, el('b', { text: t('total') })), el('td'), el('td', { class: 'a' }, el('b', { text: money(tot.bill) })),
      el('td', { class: 'a', text: money(tot.prev) }), el('td', { class: 'a', text: money(tot.paid) }), el('td', { class: 'a' }, el('b', { text: money(tot.bal) }))));
    box.appendChild(el('table', null, el('thead', null, head), body));
    /* day-by-day grid: one row per item, one column per day */
    box.appendChild(el('h2', { style: { fontSize: '11pt', margin: '0 0 1mm' }, text: t('p_days') }));
    var gh = el('tr', null, el('th', { class: 'nm', text: t('c_item') }));
    for (var d = 1; d <= N; d++) gh.appendChild(el('th', { text: String(d) }));
    var gb = el('tbody');
    items.forEach(function (it) {
      var B = base(it, ui.ym), r = getRec(ui.ym, it.id), tr = el('tr', null, el('td', { class: 'nm no-i18n', text: nameOf(it) }));
      for (var d2 = 1; d2 <= N; d2++) {
        var v = B.skipped ? '' : dayValue(it, ui.ym, d2, B.plan, r);
        var cell = B.skipped ? '–' : it.kind !== 'qty' ? SYM[v] : v > 0 ? qtyStr(v) : usualOf(it, ui.ym, d2, B.plan) > 0 ? '✕' : '·';
        tr.appendChild(el('td', { text: cell }));
      }
      gb.appendChild(tr);
    });
    box.appendChild(el('table', { class: 'g31' }, el('thead', null, gh), gb));
    if (items.some(function (i) { return i.kind === 'qty'; })) box.appendChild(el('p', { class: 'p-rule', text: t('legend_qty') }));
    if (items.some(function (i) { return i.kind === 'staff'; })) box.appendChild(el('p', { class: 'p-rule', text: t('legend_staff') }));
    var rules = [];
    items.forEach(function (it) { var x = ruleText(it, ui.ym); if (rules.indexOf(x) < 0) rules.push(x); });
    rules.forEach(function (x) { box.appendChild(el('p', { class: 'p-rule', text: x })); });
  }
  function renderNumbers() {
    memo = {};
    renderChips();
    var it = ui.sel ? itemById(ui.sel) : null;
    if (it) { renderBill(it); renderBal(it); }
    renderSummary();
    renderPrint();
  }
  function renderAll() {
    memo = {};
    $('#sampleNote').hidden = !hasSample();
    renderMonth();
    renderChips();
    renderItem();
    renderSummary();
    renderPrint();
    setVal('#inHouse', data.house);
  }

  /* ---------------- editing ---------------- */
  function selItem() { return ui.sel ? itemById(ui.sel) : null; }
  $('#cal').addEventListener('click', function (e) {
    var b = e.target.closest('.day[data-d]'); if (!b) return;
    var it = selItem(); if (!it) return;
    if (it.sample) { clearSample(); return; }
    var d = +b.getAttribute('data-d'), P = planFor(it, ui.ym), u = usualOf(it, ui.ym, d, P), r = recFor(ui.ym, it.id), cur = dayValue(it, ui.ym, d, P, r);
    var brush = it.kind === 'qty' ? ui.brush.qty : ui.brush.staff;
    if (it.kind === 'qty' && ui.other) { EDU.toast(t('use_first')); return; }
    if (brush === 'u' || (cur === brush && r.d[d] !== undefined) || brush === u) delete r.d[d];
    else r.d[d] = brush;
    tidy(ui.ym, it.id); save(); renderAll();
    var again = $('#cal .day[data-d="' + d + '"]'); if (again) again.focus();
  });
  $('#otherUse').addEventListener('click', function () {
    var p = parseHund($('#otherQty').value, false, MAX_QTY);
    if (p.empty || p.err) { $('#otherErr').textContent = t(p.err || 'err_need'); return; }
    $('#otherErr').textContent = '';
    ui.brush.qty = p.v; ui.other = false; renderItem();
  });
  $('#otherQty').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); $('#otherUse').click(); } });
  $('#btnResetMarks').addEventListener('click', function () {
    var it = selItem(); if (!it) return;
    if (it.sample) { clearSample(); return; }
    if (!confirm(t('confirm_reset_marks', { name: nameOf(it), month: monthLabel(ui.ym) }))) return;
    var r = recFor(ui.ym, it.id); r.d = {}; tidy(ui.ym, it.id); save(); renderAll();
  });

  function moneyInput(sel, errSel, allowNeg, apply) {
    $(sel).addEventListener('input', function () {
      var it = selItem(); if (!it) return;
      if (it.sample) { clearSample(); return; }
      var p = parseHund(this.value, allowNeg, MAX_AMT);
      if (p.err) { $(errSel).textContent = t(p.err); return; }
      $(errSel).textContent = '';
      apply(it, recFor(ui.ym, it.id), p.empty ? null : p.v);
      tidy(ui.ym, it.id); save(); renderNumbers();
    });
    $(sel).addEventListener('blur', function () { var it = selItem(); if (it && !$(errSel).textContent) renderInputs(it); });
  }
  /* previous dues: the box shows last month's balance; a typed amount overrides it, clearing the box (or typing the same amount) goes back to it */
  moneyInput('#inPrev', '#prevErr', true, function (it, r, v) { var auto = full(it, ui.ym).auto; r.prev = v === null || v === auto ? null : v; });
  moneyInput('#inPaid', '#paidErr', false, function (it, r, v) { r.paid = v || 0; });
  moneyInput('#inAdj', '#adjErr', true, function (it, r, v) { r.adj = v || 0; });
  $('#inAdjNote').addEventListener('input', function () {
    var it = selItem(); if (!it) return;
    if (it.sample) { clearSample(); return; }
    var r = recFor(ui.ym, it.id); r.an = str(this.value, 40); r.ank = 0;
    tidy(ui.ym, it.id); save(); renderNumbers();
  });
  $('#inHouse').addEventListener('input', function () {
    if (hasSample()) clearSample();
    data.house = str(this.value, 50); data.started = true; save(); renderPrint();
  });

  $('#rcSave').addEventListener('click', function () {
    var it = selItem(); if (!it) return;
    if (it.sample) { clearSample(); return; }
    var ds = $('#rcDate').value, p = parseHund($('#rcRate').value, false, MAX_RATE);
    if (!okDate(ds) || ds.slice(0, 7) !== ui.ym) { $('#rcErr').textContent = t('r_err_date'); return; }
    if (p.empty || p.err) { $('#rcErr').textContent = t(p.err || 'err_need'); return; }
    $('#rcErr').textContent = '';
    var from = ds === dstr(ui.ym, 1) && ui.ym <= it.from ? '' : ds;
    it.rates = it.rates.filter(function (r) { return r.from !== from; });
    it.rates.push({ from: from, r: p.v }); it.rates.sort(byFrom);
    $('#rcRate').value = '';
    save(); renderAll();
    EDU.toast(t('r_saved', { date: dmy(ds) }));
  });
  function removeRate(it, from) {
    if (it.sample) { clearSample(); return; }
    it.rates = it.rates.filter(function (r) { return r.from !== from; });
    save(); renderAll();
  }

  $('#btnSkip').addEventListener('click', function () {
    var it = selItem(); if (!it) return;
    if (it.sample) { clearSample(); return; }
    var i = it.skip.indexOf(ui.ym);
    if (i >= 0) it.skip.splice(i, 1); else it.skip.push(ui.ym);
    save(); renderAll();
  });
  $('#btnStop').addEventListener('click', function () {
    var it = selItem(); if (!it) return;
    if (it.sample) { clearSample(); return; }
    it.until = ui.ym;
    save(); renderAll();
    EDU.toast(t('stopped_toast', { name: nameOf(it), month: monthLabel(ui.ym) }), 4000);
  });
  $('#btnDel').addEventListener('click', function () {
    var it = selItem(); if (!it) return;
    if (it.sample) { clearSample(); return; }
    var nm = nameOf(it);
    if (!confirm(t('confirm_delete', { name: nm }))) return;
    data.items = data.items.filter(function (x) { return x.id !== it.id; });
    Object.keys(data.months).forEach(function (ym) { delete data.months[ym][it.id]; if (!Object.keys(data.months[ym]).length) delete data.months[ym]; });
    ui.sel = null; save(); renderAll();
    EDU.toast(t('deleted_toast', { name: nm }));
  });
  /* an item that is not counted in this month (starts later / was stopped) is counted here too */
  function countHere(it) {
    if (hasSample()) { clearSample(); return; }
    if (ui.ym < it.from) {
      it.from = ui.ym;
    } else if (it.until && ui.ym > it.until) {
      /* months between the stop and now are marked "not counted", so nothing is billed for them by surprise */
      var m = addYm(it.until, 1);
      while (m < ui.ym) { if (it.skip.indexOf(m) < 0) it.skip.push(m); m = addYm(m, 1); }
      it.until = '';
    }
    ui.sel = it.id; save(); renderAll();
  }

  /* ---------------- add / edit an item (modal) ---------------- */
  var closeModal = null;
  function openModal(content, title) { if (closeModal) closeModal(); closeModal = EDU.modal(content, { title: title, onClose: function () { closeModal = null; } }); }
  function field(labelKey, input, hint) {
    return el('label', { class: 'field' }, el('span', { text: t(labelKey) }), input, hint ? el('span', { class: 'hint', text: hint }) : null);
  }
  function itemForm(it) {
    var isNew = !it, tpl = it ? it.tpl : 'milk', kind = it ? it.kind : 'qty';
    var P = it ? planFor(it, ui.ym) : defaultPlan(kind, tpl);
    var rate0 = it ? rateOn(it, dstr(ui.ym, 1)) : 0;
    var pay = kind === 'staff' ? P.pay : 'month';
    var f = el('form', { class: 'stack', id: 'ed-form', novalidate: true });
    var tplBox = el('div', { class: 'mh-brush', id: 'ed-tpl', role: 'group' });
    var name = el('input', { type: 'text', id: 'ed-name', class: 'no-i18n', maxlength: '40', autocomplete: 'off', value: it ? it.name : '' });
    var unit = el('select', { id: 'ed-unit' });
    UNITS.forEach(function (u) { unit.appendChild(el('option', { value: u, text: t('u_' + u) })); });
    var dq = el('input', { type: 'text', inputmode: 'decimal', id: 'ed-dq', maxlength: '8', autocomplete: 'off' });
    var sq = el('input', { type: 'text', inputmode: 'decimal', id: 'ed-sq', maxlength: '8', autocomplete: 'off' });
    var rate = el('input', { type: 'text', inputmode: 'decimal', id: 'ed-rate', maxlength: '12', autocomplete: 'off' });
    var paySeg = el('div', { class: 'seg', id: 'ed-pay', role: 'group' });
    var sal = el('input', { type: 'text', inputmode: 'decimal', id: 'ed-sal', maxlength: '14', autocomplete: 'off' });
    var drate = el('input', { type: 'text', inputmode: 'decimal', id: 'ed-drate', maxlength: '12', autocomplete: 'off' });
    var lv = el('input', { type: 'text', inputmode: 'decimal', id: 'ed-lv', maxlength: '5', autocomplete: 'off' });
    var basis = el('select', { id: 'ed-basis' }, el('option', { value: 'm', text: t('basis_m') }), el('option', { value: '30', text: t('basis_30') }));
    var off = el('select', { id: 'ed-off' }, el('option', { value: '-1', text: t('off_none') }));
    list('wd_long').forEach(function (w, i) { off.appendChild(el('option', { value: String(i), text: w })); });
    var err = el('p', { class: 'err', id: 'ed-err', role: 'alert' });
    var qtyBox = el('div', { class: 'stack' }), staffBox = el('div', { class: 'stack' }), salBox = el('div'), dayBox = el('div');

    function fill(fromTpl) {
      var T = TPL[tpl];
      if (fromTpl) { kind = T.k; P = defaultPlan(kind, tpl); pay = 'month'; }
      name.placeholder = t(tpl === 'other_qty' ? 'nm_other_qty' : tpl === 'other_staff' ? 'nm_other_staff' : 'tpl_' + tpl);
      unit.value = it && !fromTpl ? it.unit : (T.u || 'piece');
      if (kind === 'qty') {
        dq.value = qtyStr(P.dq); sq.value = P.sq === null ? '' : qtyStr(P.sq);
        rate.value = rate0 || !isNew ? plainIn(rate0) : '';
      } else {
        sal.value = P.pay === 'month' && (P.sal || !isNew) ? plainIn(P.sal) : '';
        drate.value = rate0 || (!isNew && P.pay === 'day') ? plainIn(rate0) : '';
        lv.value = qtyStr(P.lv); basis.value = P.basis; off.value = String(P.off);
      }
      sync();
    }
    function sync() {
      $$('button', tplBox).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-t') === tpl)); });
      $$('button', paySeg).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === pay)); });
      qtyBox.hidden = kind !== 'qty'; staffBox.hidden = kind !== 'staff';
      salBox.hidden = pay !== 'month'; dayBox.hidden = pay !== 'day';
    }
    if (isNew) {
      TPL_ORDER.forEach(function (k) {
        tplBox.appendChild(el('button', { type: 'button', class: 'brush', 'data-t': k, text: t('tpl_' + k), onclick: function () { tpl = k; fill(true); } }));
      });
    }
    ['month', 'day'].forEach(function (v) {
      paySeg.appendChild(el('button', { type: 'button', 'data-v': v, text: t('pay_' + v), onclick: function () { pay = v; sync(); } }));
    });
    unit.addEventListener('change', sync);

    qtyBox.appendChild(el('div', { class: 'pay-grid' }, field('ed_unit', unit), field('ed_rate', rate),
      field('ed_dq', dq, t('ed_dq_hint')), field('ed_sq', sq, t('ed_sq_hint'))));
    salBox.appendChild(el('div', { class: 'pay-grid' }, field('ed_sal', sal), field('ed_lv', lv), field('ed_basis', basis), field('ed_off', off)));
    dayBox.appendChild(el('div', { class: 'pay-grid' }, field('ed_drate', drate), field('ed_off', off.cloneNode(true))));
    staffBox.appendChild(el('div', { class: 'field' }, el('span', { text: t('ed_pay') }), paySeg));
    staffBox.appendChild(salBox); staffBox.appendChild(dayBox);
    var offDay = dayBox.querySelector('select');
    offDay.id = 'ed-off2';
    offDay.addEventListener('change', function () { off.value = offDay.value; });
    off.addEventListener('change', function () { offDay.value = off.value; });

    if (isNew) f.appendChild(el('div', { class: 'field' }, el('span', { text: t('ed_type') }), tplBox));
    f.appendChild(field('ed_name', name));
    f.appendChild(qtyBox); f.appendChild(staffBox);
    if (!isNew) f.appendChild(el('p', { class: 'small muted mb0', text: t('ed_applies', { month: monthLabel(ui.ym) }) }));
    f.appendChild(err);
    f.appendChild(el('div', { class: 'row' }, el('button', { type: 'submit', class: 'btn btn-primary', id: 'ed-save', text: t('save') }),
      el('button', { type: 'button', class: 'btn', id: 'ed-cancel', text: t('cancel'), onclick: function () { if (closeModal) closeModal(); } })));

    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      function num(input, allowEmpty, max, key) {
        var p = parseHund(input.value, false, max);
        if (p.empty) { if (allowEmpty) return null; throw t('err_need_f', { field: t(key) }); }
        if (p.err) throw t(key) + ': ' + t(p.err);
        return p.v;
      }
      var plan, newRate = null;
      try {
        if (kind === 'qty') {
          plan = { dq: num(dq, false, MAX_QTY, 'ed_dq'), sq: num(sq, true, MAX_QTY, 'ed_sq') };
          newRate = num(rate, false, MAX_RATE, 'ed_rate');
        } else if (pay === 'month') {
          plan = { pay: 'month', sal: num(sal, false, MAX_AMT, 'ed_sal'), lv: num(lv, true, MAX_LV, 'ed_lv') || 0, basis: basis.value === '30' ? '30' : 'm', off: int(off.value, -1, 6, -1) };
        } else {
          plan = { pay: 'day', sal: P.sal || 0, lv: P.lv || 0, basis: P.basis || 'm', off: int(off.value, -1, 6, -1) };
          newRate = num(drate, false, MAX_RATE, 'ed_drate');
        }
      } catch (msg) { err.textContent = String(msg); return; }
      clearSample(true);
      if (isNew) {
        plan.from = '';
        it = cleanItem({ tpl: tpl, name: name.value, unit: unit.value, from: ui.ym, plan: [plan], rates: [{ from: '', r: newRate || 0 }] }, {});
        data.items.push(it);
        ui.sel = it.id; ui.brush.qty = null; ui.other = false;
        save(); if (closeModal) closeModal(); renderAll();
        EDU.toast(t('added_toast', { name: nameOf(it) }));
        return;
      }
      it.name = str(name.value, 40);
      if (kind === 'qty') it.unit = UNITS.indexOf(unit.value) >= 0 ? unit.value : it.unit;
      /* plan changes apply from this month on; in the first month they change the item's starting plan */
      var from = ui.ym <= it.from ? '' : ui.ym;
      plan.from = from;
      var cur = planFor(it, ui.ym), same = Object.keys(plan).every(function (k) { return k === 'from' || cur[k] === plan[k]; });
      if (!same) { it.plan = it.plan.filter(function (p) { return p.from !== from; }); it.plan.push(cleanPlan(plan, it.kind)); it.plan.sort(byFrom); }
      if (newRate !== null && newRate !== rateOn(it, dstr(ui.ym, 1))) {
        var rf = ui.ym <= it.from ? '' : dstr(ui.ym, 1);
        it.rates = it.rates.filter(function (r) { return r.from !== rf; }); it.rates.push({ from: rf, r: newRate }); it.rates.sort(byFrom);
      }
      save(); if (closeModal) closeModal(); renderAll();
      EDU.toast(t('saved_toast'));
    });
    fill(isNew);
    openModal(f, isNew ? t('ed_new') : t('ed_edit', { name: nameOf(it) }));
    setTimeout(function () { var x = isNew ? tplBox.querySelector('button') : name; if (x) x.focus(); }, 30);
  }
  $('#btnAdd').addEventListener('click', function () { if (hasSample()) clearSample(true); itemForm(null); });
  $('#btnEdit').addEventListener('click', function () { var it = selItem(); if (!it) return; if (it.sample) { clearSample(); return; } itemForm(it); });
  $('#btnClearSample').addEventListener('click', function () { clearSample(); });

  /* ---------------- month navigation ---------------- */
  function goMonth(n) { var to = addYm(ui.ym, n); if (!okYm(to)) return; ui.ym = to; ui.other = false; renderAll(); }
  $('#btnPrev').addEventListener('click', function () { goMonth(-1); });
  $('#btnNext').addEventListener('click', function () { goMonth(1); });
  $('#btnToday').addEventListener('click', function () { ui.ym = nowYm(); renderAll(); });

  /* ---------------- share, print, CSV ---------------- */
  function openShare(items) {
    var text = shareText(items, ui.ym);
    var ta = el('textarea', { id: 'sh-text', class: 'no-i18n', 'aria-label': t('h_share') }); ta.value = text;
    var wa = el('a', { class: 'btn btn-wa', id: 'sh-wa', target: '_blank', rel: 'noopener', href: EDU.waLink(text), text: t('open_wa') });
    ta.addEventListener('input', function () { wa.href = EDU.waLink(ta.value); });
    openModal(el('div', { class: 'stack' }, el('p', { class: 'small muted mb0', text: t('share_hint') }), ta,
      el('div', { class: 'row' }, wa, el('button', { type: 'button', class: 'btn', id: 'sh-copy', text: t('copy'), onclick: function () { EDU.copy(ta.value); } }))), t('h_share'));
  }
  $('#btnShareItem').addEventListener('click', function () { var it = selItem(); if (it) openShare([it]); });
  $('#btnShareMonth').addEventListener('click', function () { var items = countedItems(ui.ym); if (items.length) openShare(items); });
  $('#btnPrint').addEventListener('click', function () { renderPrint(); window.print(); });
  function stateCode(v) { return SYM[v]; }
  function csvRows() {
    var N = daysIn(ui.ym), rows = [[t('p_title', { month: monthLabel(ui.ym) })]];
    var head = [t('c_item'), t('c_unit')];
    for (var d = 1; d <= N; d++) head.push(String(d));
    head.push(t('c_qty'), t('c_rate'), t('l_bill'), t('c_extra'), t('c_prev'), t('c_paid'), t('c_bal'));
    rows.push(head);
    countedItems(ui.ym).forEach(function (it) {
      var F = full(it, ui.ym), B = F.b, r = getRec(ui.ym, it.id), P = B.plan;
      var row = [nameOf(it), it.kind === 'qty' ? unitOf(it) : t(P.pay === 'month' ? 'pay_month' : 'pay_day')];
      for (var d2 = 1; d2 <= N; d2++) { var v = dayValue(it, ui.ym, d2, P, r); row.push(B.skipped ? '' : it.kind === 'qty' ? qtyStr(v) : stateCode(v)); }
      var qty = it.kind === 'qty' ? qtyStr(B.tot) : P.pay === 'month' ? qtyStr(B.cnt.p * 100 + B.cnt.h * 50 + B.cnt.o * 100) : qtyStr(B.cnt.p * 100 + B.cnt.h * 50);
      var rateCell = it.kind === 'staff' && P.pay === 'month' ? plainRs(P.sal) : B.groups.map(function (g) { return plainRs(g.rate); }).join(' / ') || plainRs(rateOn(it, dstr(ui.ym, 1)));
      row.push(qty, rateCell, plainRs(B.bill), plainRs(F.adj), plainRs(F.prev), plainRs(F.paid), plainRs(F.bal));
      rows.push(row);
    });
    return rows;
  }
  $('#btnCsv').addEventListener('click', function () { EDU.download('monthly-hisab-' + ui.ym + '.csv', EDU.csv.stringify(csvRows()), 'text/csv'); });

  /* ---------------- backup, restore, reset ---------------- */
  $('#btnBackup').addEventListener('click', function () {
    var out = { app: SLUG, v: 1, saved: new Date().toISOString(), data: hasSample() ? blank() : data };
    EDU.download('monthly-hisab-backup-' + todayStr() + '.json', JSON.stringify(out, null, 1), 'application/json');
    EDU.toast(t('backup_done'));
  });
  $('#btnRestore').addEventListener('click', function () {
    EDU.pickFile('.json,application/json').then(function (f) {
      if (!f) return;
      if (f.size > 8 * 1024 * 1024) { EDU.toast(t('restore_bad'), 4000); return; }
      return EDU.readText(f).then(function (txt) {
        var obj = null;
        try { obj = JSON.parse(txt); } catch (e) { obj = null; }
        if (!obj || obj.app !== SLUG || !obj.data || typeof obj.data !== 'object') { EDU.toast(t('restore_bad'), 4000); return; }
        if (!confirm(t('confirm_restore'))) return;
        if (Array.isArray(obj.data.items)) obj.data.items.forEach(function (i) { if (i && typeof i === 'object') i.sample = false; });
        data = cleanData(obj.data); data.started = true;
        ui.sel = null; save(); renderAll();
        EDU.toast(t('restore_ok', { n: data.items.length }));
      });
    }).catch(function () { EDU.toast(t('restore_bad'), 4000); });
  });
  $('#btnReset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    data = blank(); ui.sel = null; ui.ym = nowYm(); save(); renderAll();
  });

  EDU.onLang(function () { renderAll(); });
  renderAll();
})();
