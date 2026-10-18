/* Expense Tracker & Budget: private, on-device expense/income log with budgets, repeat entries, reports and backups.
   Money is kept in integer paise. Dates are local "YYYY-MM-DD" strings. */
(function () {
  'use strict';
  var SLUG = 'expense-tracker';
  var store = EDU.store(SLUG);
  var MAX_PAISE = 1e12;                       /* ₹1,000 crore per entry */
  var PBKDF2_ITER = 250000, PAGE = 100, UNDO_MS = 9000, STORE_LIMIT = 5 * 1024 * 1024;

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$;

  /* ---------------- categories ---------------- */
  var BUILTIN = [
    { id: 'food', e: '🍽️', k: 'e' }, { id: 'groc', e: '🛒', k: 'e' }, { id: 'travel', e: '🚌', k: 'e' }, { id: 'fuel', e: '⛽', k: 'e' },
    { id: 'rent', e: '🏠', k: 'e' }, { id: 'bills', e: '💡', k: 'e' }, { id: 'mobile', e: '📱', k: 'e' }, { id: 'health', e: '💊', k: 'e' },
    { id: 'edu', e: '📚', k: 'e' }, { id: 'shop', e: '🛍️', k: 'e' }, { id: 'fun', e: '🎬', k: 'e' }, { id: 'emi', e: '🏦', k: 'e' },
    { id: 'gift', e: '🎁', k: 'e' }, { id: 'invest', e: '📈', k: 'e', save: true }, { id: 'other', e: '📦', k: 'e' },
    { id: 'salary', e: '💼', k: 'i' }, { id: 'biz', e: '🏪', k: 'i' }, { id: 'interest', e: '💹', k: 'i' }, { id: 'otherin', e: '💰', k: 'i' }
  ];
  var BMAP = {}; BUILTIN.forEach(function (c) { BMAP[c.id] = c; });
  var EMOJIS = ['🐶', '👶', '🧹', '💇', '🚗', '🏍️', '🧺', '☕', '🍰', '🥛', '🙏', '🏥', '✈️', '🎓', '🏋️', '🧴', '🔧', '💻', '🎮', '📺', '🪔', '🎉', '🌱', '💳', '🏧', '🧾', '🎨', '📦'];
  var MODES = ['upi', 'cash', 'card', 'net'];

  function catById(id) {
    if (BMAP[id]) return BMAP[id];
    for (var i = 0; i < D.cats.length; i++) if (D.cats[i].id === id) return D.cats[i];
    return null;
  }
  function catOf(tx) { return catById(tx.c) || BMAP[tx.k === 'i' ? 'otherin' : 'other']; }
  function catName(c) { return c ? (BMAP[c.id] ? t('c_' + c.id) : c.name) : ''; }
  function catsOfKind(k) { return BUILTIN.filter(function (c) { return c.k === k; }).concat(D.cats.filter(function (c) { return c.k === k; })); }
  function isSave(c) { return !!(c && c.save); }
  function modeName(m) { return MODES.indexOf(m) >= 0 ? t('m_' + m) : ''; }
  function memName(id) { for (var i = 0; i < D.mem.length; i++) if (D.mem[i].id === id) return D.mem[i].name; return ''; }

  /* ---------------- dates ---------------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function todayStr() { return ymd(new Date()); }
  function parseYmd(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '')); if (!m) return null; var d = new Date(+m[1], +m[2] - 1, +m[3]); return d.getMonth() === +m[2] - 1 ? d : null; }
  function addDays(s, n) { var d = parseYmd(s) || new Date(); d.setDate(d.getDate() + n); return ymd(d); }
  function ymOf(s) { return String(s).slice(0, 7); }
  function ymAdd(ym, n) { var y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1 + n; y += Math.floor(m / 12); m = ((m % 12) + 12) % 12; return y + '-' + pad(m + 1); }
  function daysIn(ym) { return new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0).getDate(); }
  function list(key) { return String(t(key)).split(',').map(function (s) { return s.trim(); }); }
  function monthLabel(ym) { return (list('months')[+ym.slice(5, 7) - 1] || ym.slice(5, 7)) + ' ' + ym.slice(0, 4); }
  function monthShort(ym) { return list('months_s')[+ym.slice(5, 7) - 1] || ym.slice(5, 7); }
  function dmy(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '')); return m ? m[3] + '-' + m[2] + '-' + m[1] : String(s || ''); }
  function dayMon(s) { return +s.slice(8, 10) + ' ' + monthShort(ymOf(s)); }

  /* ---------------- money ---------------- */
  var DIGIT_ZEROS = [0x0660, 0x06F0, 0x0966, 0x09E6, 0x0A66, 0x0AE6, 0x0B66, 0x0BE6, 0x0C66, 0x0CE6, 0x0D66];
  function asciiDigits(s) {
    s = String(s == null ? '' : s);
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var k = s.charCodeAt(i), d = -1;
      for (var j = 0; j < DIGIT_ZEROS.length; j++) if (k >= DIGIT_ZEROS[j] && k <= DIGIT_ZEROS[j] + 9) { d = k - DIGIT_ZEROS[j]; break; }
      out += d >= 0 ? String(d) : s.charAt(i);
    }
    return out;
  }
  /* "₹1,250.5", "Rs 1250/-", "१२५०" -> { paise } | { err } | { empty } */
  function parsePaise(raw) {
    var s = asciiDigits(raw).replace(/[\s,₹]/g, '').replace(/^(rs\.?|inr)/i, '').replace(/\/[-=]$/, '');
    if (!s) return { empty: true };
    if (/^-/.test(s)) return { err: 'err_amt' };
    if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return { err: 'err_amt_bad' };
    var parts = s.split('.'), whole = (parts[0] || '0').replace(/^0+(?=\d)/, ''), dec = parts[1] || '';
    if (dec.length > 2) return { err: 'err_amt_bad' };
    if (whole.length > 10) return { err: 'err_amt_big' };
    var paise = Number(whole) * 100 + Number((dec + '00').slice(0, 2));
    if (!(paise > 0)) return { err: 'err_amt' };
    if (paise > MAX_PAISE) return { err: 'err_amt_big' };
    return { paise: paise };
  }
  var inFmt = null;
  function groupIn(n) {
    try { if (!inFmt) inFmt = new Intl.NumberFormat('en-IN', { numberingSystem: 'latn', maximumFractionDigits: 0 }); return inFmt.format(n); }
    catch (e) { var s = String(n), l3 = s.slice(-3), r = s.slice(0, -3); return (r ? r.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' : '') + l3; }
  }
  function money(p) { var a = Math.abs(Math.round(p)), ps = a % 100; return (p < 0 ? '−' : '') + '₹' + groupIn(Math.floor(a / 100)) + (ps ? '.' + pad(ps) : ''); }
  function moneyR(p) { return money(Math.round(p / 100) * 100); }          /* rounded to the rupee for summaries */
  function rupees(p) { return (p < 0 ? '-' : '') + Math.floor(Math.abs(p) / 100) + '.' + pad(Math.abs(p) % 100); }
  function compact(p) {
    var r = p / 100;
    if (r >= 1e7) return '₹' + (+(r / 1e7).toFixed(1)) + 'Cr';
    if (r >= 1e5) return '₹' + (+(r / 1e5).toFixed(1)) + 'L';
    if (r >= 1e3) return '₹' + (+(r / 1e3).toFixed(1)) + 'k';
    return '₹' + Math.round(r);
  }
  function pct(a, b) { return b > 0 ? a / b * 100 : 0; }
  function fmtPct(x) { return EDU.fmt(Math.round(x * 10) / 10, { maximumFractionDigits: 1 }); }

  /* ---------------- state ---------------- */
  var D = { tx: [], cats: [], mem: [], bud: { total: 0, cats: {}, carry: false, start: '' }, rec: [], meta: {} };
  var ui = { tab: 'add', ym: ymOf(todayStr()), kind: 'e', cat: 'food', mode: 'upi', edit: null, limit: PAGE,
    f: { q: '', kind: '', cat: '', mode: '', who: '', from: '', to: '' }, range: 'all', rcEdit: null, rcKind: 'e' };
  var uidN = 0;
  function uid() { return Date.now().toString(36).slice(-6) + Math.random().toString(36).slice(2, 6) + (uidN++).toString(36); }
  function str(x, max) { return (typeof x === 'string' ? x : typeof x === 'number' && isFinite(x) ? String(x) : '').replace(/\s+/g, ' ').trim().slice(0, max || 120); }
  function okId(x) { return typeof x === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(x) && !(x in Object.prototype); }
  function paiseOf(x) { var n = Math.round(+x); return Number.isFinite(n) && n > 0 && n <= MAX_PAISE ? n : 0; }

  function cleanTx(x, seen) {
    if (!x || typeof x !== 'object') return null;
    var p = paiseOf(x.p), d = parseYmd(x.d) ? x.d : '';
    if (!p || !d) return null;
    var id = okId(x.id) && !seen[x.id] ? x.id : uid(); seen[id] = 1;
    var o = { id: id, k: x.k === 'i' ? 'i' : 'e', p: p, c: okId(x.c) ? x.c : '', m: MODES.indexOf(x.m) >= 0 ? x.m : 'upi', d: d, n: str(x.n, 120), w: okId(x.w) ? x.w : '', cr: +x.cr || Date.now() };
    if (okId(x.r)) o.r = x.r;
    if (x.rv) o.rv = 1;
    if (x.s) { o.s = 1; o.nk = Math.max(0, Math.min(20, +x.nk || 0)); }
    return o;
  }
  function cleanAll(o) {
    o = o || {};
    var seen = {}, out = {};
    out.cats = (Array.isArray(o.cats) ? o.cats : []).filter(function (c) { return c && okId(c.id) && !BMAP[c.id] && str(c.name, 30); })
      .map(function (c) { return { id: c.id, name: str(c.name, 30), e: str(c.e, 8) || '📦', k: c.k === 'i' ? 'i' : 'e' }; }).slice(0, 60);
    out.mem = (Array.isArray(o.mem) ? o.mem : []).filter(function (m) { return m && okId(m.id) && str(m.name, 30); })
      .map(function (m) { return { id: m.id, name: str(m.name, 30) }; }).slice(0, 20);
    out.tx = (Array.isArray(o.tx) ? o.tx : []).map(function (x) { return cleanTx(x, seen); }).filter(Boolean);
    var b = o.bud && typeof o.bud === 'object' ? o.bud : {};
    out.bud = { total: paiseOf(b.total), cats: {}, carry: b.carry === true, start: /^\d{4}-\d{2}$/.test(b.start || '') ? b.start : '' };
    if (b.cats && typeof b.cats === 'object') Object.keys(b.cats).forEach(function (k) { if (okId(k) && paiseOf(b.cats[k])) out.bud.cats[k] = paiseOf(b.cats[k]); });
    var rseen = {};
    out.rec = (Array.isArray(o.rec) ? o.rec : []).map(function (r) {
      if (!r || !paiseOf(r.p)) return null;
      var id = okId(r.id) && !rseen[r.id] ? r.id : uid(); rseen[id] = 1;
      return { id: id, k: r.k === 'i' ? 'i' : 'e', p: paiseOf(r.p), c: okId(r.c) ? r.c : '', m: MODES.indexOf(r.m) >= 0 ? r.m : 'upi', n: str(r.n, 80), w: okId(r.w) ? r.w : '',
        day: Math.max(1, Math.min(31, Math.round(+r.day) || 1)), next: /^\d{4}-\d{2}$/.test(r.next || '') ? r.next : ymOf(todayStr()), on: r.on !== false };
    }).filter(Boolean).slice(0, 100);
    return out;
  }

  var saveOk = true;
  function save(keys) {
    var ok = true;
    (keys || ['tx', 'cats', 'mem', 'bud', 'rec', 'meta']).forEach(function (k) { ok = store.set(k, D[k]) && ok; });
    if (keys && keys.indexOf('tx') >= 0) { D.meta.changed = true; ok = store.set('meta', D.meta) && ok; }
    saveOk = ok;
    $('#quota-box').hidden = ok;
    idxVer++;
  }
  function load() {
    var c = cleanAll({ tx: store.get('tx', []), cats: store.get('cats', []), mem: store.get('mem', []), bud: store.get('bud', null), rec: store.get('rec', []) });
    D.tx = c.tx; D.cats = c.cats; D.mem = c.mem; D.bud = c.bud; D.rec = c.rec;
    var m = store.get('meta', {}); D.meta = m && typeof m === 'object' ? m : {};
    if (MODES.indexOf(D.meta.mode) >= 0) ui.mode = D.meta.mode;
    if (!D.meta.seeded && !D.tx.length) seedSamples();
  }

  /* ---------------- sample data ---------------- */
  function seedSamples() {
    var T = todayStr(), ym = ymOf(T), td = +T.slice(8, 10), now = Date.now(), pym = ymAdd(ym, -1);
    function day(y, d) { var n = y === ym ? Math.min(d, td) : Math.min(d, daysIn(y)); return y + '-' + pad(n); }
    var S = [
      /* [monthOffset, kind, cat, rupees, mode, day, noteKey] */
      [0, 'i', 'salary', 52000, 'net', 1, 1], [0, 'e', 'rent', 14000, 'net', 2, 2], [0, 'e', 'groc', 2860, 'upi', 3, 3], [0, 'e', 'food', 420, 'upi', 4, 4],
      [0, 'e', 'mobile', 349, 'upi', 5, 5], [0, 'e', 'fuel', 600, 'cash', 6, 6], [0, 'e', 'bills', 1840, 'upi', 8, 7], [0, 'e', 'invest', 3000, 'net', 5, 8],
      [0, 'e', 'fun', 450, 'card', 9, 9], [0, 'e', 'health', 260, 'cash', 10, 10], [0, 'e', 'food', 180, 'upi', 11, 11], [0, 'e', 'groc', 940, 'upi', 12, 12],
      [-1, 'i', 'salary', 52000, 'net', 1, 1], [-1, 'e', 'rent', 14000, 'net', 2, 2], [-1, 'e', 'groc', 4120, 'upi', 6, 3], [-1, 'e', 'food', 1650, 'upi', 12, 4],
      [-1, 'e', 'mobile', 349, 'upi', 5, 5], [-1, 'e', 'fuel', 1500, 'cash', 15, 6], [-1, 'e', 'bills', 2210, 'upi', 9, 7], [-1, 'e', 'invest', 3000, 'net', 5, 8],
      [-1, 'e', 'shop', 2499, 'card', 20, 13], [-1, 'e', 'travel', 960, 'upi', 24, 14], [-1, 'e', 'gift', 1100, 'cash', 27, 15]
    ];
    D.tx = S.map(function (s, i) {
      var y = s[0] ? pym : ym;
      return { id: uid(), k: s[1], c: s[2], p: s[3] * 100, m: s[4], d: day(y, s[5]), n: '', w: '', cr: now - i, s: 1, nk: s[6] };
    });
    D.bud = { total: 2500000, cats: { food: 300000, groc: 600000 }, carry: false, start: pym };
    D.meta.sampleBud = true;
    D.meta.seeded = true;
    save();
  }
  function hasSamples() { return D.tx.some(function (x) { return x.s; }); }
  function removeSamples() {
    D.tx = D.tx.filter(function (x) { return !x.s; });
    if (D.meta.sampleBud) { D.bud = { total: 0, cats: {}, carry: false, start: '' }; D.meta.sampleBud = false; }
    save();
  }
  function txNote(x) { return x.s && x.nk ? t('sn' + x.nk) : x.n; }

  /* ---------------- month index (cached) ---------------- */
  var idxVer = 0, idxBuilt = -1, byMonth = {};
  function index() {
    if (idxBuilt === idxVer) return byMonth;
    byMonth = {};
    for (var i = 0; i < D.tx.length; i++) { var x = D.tx[i], k = x.d.slice(0, 7); (byMonth[k] || (byMonth[k] = [])).push(x); }
    idxBuilt = idxVer;
    return byMonth;
  }
  function monthTx(ym) { return index()[ym] || []; }
  /* spent excludes "Savings & SIP" (money moved to savings is not spending) */
  function monthSum(ym) {
    var r = { spent: 0, inc: 0, inv: 0, n: 0, cats: {}, modes: {}, days: {}, nExp: 0 };
    monthTx(ym).forEach(function (x) {
      r.n++;
      if (x.k === 'i') { r.inc += x.p; return; }
      var c = catOf(x);
      if (isSave(c)) { r.inv += x.p; return; }
      r.spent += x.p; r.nExp++;
      r.cats[c.id] = (r.cats[c.id] || 0) + x.p;
      r.modes[x.m] = (r.modes[x.m] || 0) + x.p;
      var d = +x.d.slice(8, 10); r.days[d] = (r.days[d] || 0) + x.p;
    });
    r.saved = r.inc - r.spent;
    return r;
  }

  /* ---------------- budgets (with optional carry-forward of unspent money) ---------------- */
  function budgetFor(ym) {
    var B = D.bud, out = { total: null, cats: {} };
    var keys = Object.keys(B.cats).filter(function (k) { var c = catById(k); return c && c.k === 'e' && !isSave(c); });
    function base(key) { return key === '_t' ? B.total : B.cats[key] || 0; }
    var all = ['_t'].concat(keys), carry = {}, m;
    all.forEach(function (k) { carry[k] = 0; });
    if (B.carry && B.start && B.start < ym) {
      m = B.start < ymAdd(ym, -36) ? ymAdd(ym, -36) : B.start;
      for (; m < ym; m = ymAdd(m, 1)) {
        var s = monthSum(m);
        all.forEach(function (k) {
          var eff = base(k) + carry[k], sp = k === '_t' ? s.spent : s.cats[k] || 0;
          carry[k] = Math.max(0, eff - sp);
        });
      }
    }
    var cur = monthSum(ym);
    all.forEach(function (k) {
      if (!base(k)) return;
      var o = { base: base(k), carry: carry[k], eff: base(k) + carry[k], spent: k === '_t' ? cur.spent : cur.cats[k] || 0 };
      o.left = o.eff - o.spent; o.pct = pct(o.spent, o.eff); o.level = o.pct >= 100 ? 'over' : o.pct >= 80 ? 'warn' : '';
      if (k === '_t') out.total = o; else out.cats[k] = o;
    });
    return out;
  }
  function budgetLabel(k) { return k === '_t' ? t('bud_total') : catName(catById(k)); }

  /* ---------------- repeat entries ---------------- */
  function runRecurring() {
    var T = todayStr(), curYm = ymOf(T), added = 0;
    D.rec.forEach(function (r) {
      if (!r.on) return;
      var guard = 0;
      while (r.next <= curYm && guard++ < 36) {
        var dd = Math.min(r.day, daysIn(r.next)), date = r.next + '-' + pad(dd);
        if (date > T) break;
        D.tx.push({ id: uid(), k: r.k, p: r.p, c: r.c, m: r.m, d: date, n: r.n, w: r.w, cr: Date.now(), r: r.id, rv: 1 });
        added++;
        r.next = ymAdd(r.next, 1);
      }
    });
    if (added) { if (hasSamples()) removeSamples(); save(['tx', 'rec']); }
    return added;
  }
  function nextDate(r) { return r.next + '-' + pad(Math.min(r.day, daysIn(r.next))); }

  /* ---------------- rendering helpers ---------------- */
  function numSpan(s, cls) { return el('span', { class: 'num' + (cls ? ' ' + cls : ''), text: s }); }
  function setNum(sel, s, neg) { var e = $(sel); e.textContent = s; e.classList.toggle('neg', !!neg); }
  function txRow(x) {
    var c = catOf(x), note = txNote(x), who = memName(x.w);
    var sub = el('span', { class: 'es' }, catName(c) + ' · ', numSpan(dmy(x.d)), ' · ' + modeName(x.m) + (who ? ' · ' + who : ''));
    var title = el('span', { class: 'et' + (x.s || !note ? '' : ' no-i18n'), text: note || catName(c) });
    if (x.s) title.appendChild(el('span', { class: 'badge', text: t('example') }));
    if (x.r) title.appendChild(el('span', { class: 'badge primary', text: x.rv ? t('b_review') : t('b_repeat') }));
    return el('button', { type: 'button', class: 'erow', 'data-id': x.id },
      el('span', { class: 'eav', 'aria-hidden': 'true', text: c.e }),
      el('span', { class: 'einfo' }, title, sub),
      el('span', { class: 'ea num ' + (x.k === 'i' ? 'i' : 'o'), text: (x.k === 'i' ? '+' : '−') + money(x.p) }));
  }
  function sortDesc(a, b) { return a.d < b.d ? 1 : a.d > b.d ? -1 : b.cr - a.cr; }
  function txById(id) { for (var i = 0; i < D.tx.length; i++) if (D.tx[i].id === id) return D.tx[i]; return null; }

  /* ---------------- dashboard ---------------- */
  function renderDash() {
    var s = monthSum(ui.ym);
    $('#m-label').textContent = monthLabel(ui.ym);
    $('#m-today').hidden = ui.ym === ymOf(todayStr());
    setNum('#d-spent', money(s.spent));
    $('#d-spent-s').textContent = t('n_entries', { n: EDU.fmt(s.nExp) });
    setNum('#d-income', money(s.inc));
    $('#d-income-s').textContent = '';
    setNum('#d-saved', money(s.saved), s.saved < 0);
    $('#d-saved-s').textContent = s.inv ? t('invested_sub', { amt: moneyR(s.inv) }) : '';
    if (s.inc > 0) { setNum('#d-rate', fmtPct(pct(s.saved, s.inc)) + '%', s.saved < 0); $('#d-rate-s').textContent = t('rate_sub'); }
    else { setNum('#d-rate', '—'); $('#d-rate-s').textContent = t('rate_noinc'); }
    $('#print-head').textContent = t('app_title') + ' · ' + monthLabel(ui.ym);
  }
  function renderAlerts() {
    var box = $('#alerts'); box.textContent = '';
    var b = budgetFor(ui.ym), items = [];
    if (b.total && b.total.level) items.push(['_t', b.total]);
    Object.keys(b.cats).forEach(function (k) { if (b.cats[k].level) items.push([k, b.cats[k]]); });
    items.sort(function (x, y) { return y[1].pct - x[1].pct; });
    items.slice(0, 6).forEach(function (it) {
      var o = it[1], name = budgetLabel(it[0]);
      var txt = o.level === 'over' ? t('al_over', { cat: name, amt: moneyR(-o.left) }) : t('al_warn', { cat: name, pct: fmtPct(o.pct), left: moneyR(o.left) });
      box.appendChild(el('div', { class: 'callout ' + (o.level === 'over' ? 'danger' : 'warning') + ' alert-' + o.level, 'data-cat': it[0] },
        el('span', { 'aria-hidden': 'true', text: o.level === 'over' ? '⛔ ' : '⚠️ ' }), el('span', { text: txt })));
    });
  }
  function renderNotices() {
    var n = D.tx.filter(function (x) { return x.rv; }).length;
    $('#rv-box').hidden = !n;
    if (n) $('#rv-txt').textContent = t('rv_text', { n: EDU.fmt(n) });
    $('#sample-box').hidden = !hasSamples();
  }

  /* ---------------- tabs ---------------- */
  var TABS = ['add', 'list', 'rep', 'bud', 'rec', 'data'];
  function setTab(tab) {
    ui.tab = tab;
    $$('.tabs [role="tab"]').forEach(function (b) {
      var on = b.getAttribute('data-tab') === tab;
      b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1;
    });
    TABS.forEach(function (k) { $('#p-' + k).classList.toggle('off', k !== tab); });
    renderTab();
  }
  function renderTab() {
    if (ui.tab === 'add') renderAdd();
    else if (ui.tab === 'list') renderList();
    else if (ui.tab === 'rep') renderRep();
    else if (ui.tab === 'bud') renderBud();
    else if (ui.tab === 'rec') renderRec();
    else renderData();
  }
  function renderAll() { renderDash(); renderAlerts(); renderNotices(); renderTab(); }
  $$('.tabs [role="tab"]').forEach(function (b) {
    b.addEventListener('click', function () { setTab(b.getAttribute('data-tab')); });
    b.addEventListener('keydown', function (e) {
      var i = TABS.indexOf(b.getAttribute('data-tab')), rtl = document.documentElement.dir === 'rtl';
      var d = e.key === 'ArrowRight' ? (rtl ? -1 : 1) : e.key === 'ArrowLeft' ? (rtl ? 1 : -1) : 0;
      if (!d) return;
      e.preventDefault(); var n = TABS[(i + d + TABS.length) % TABS.length]; setTab(n); $('#tab-' + n).focus();
    });
  });
  $('#m-prev').addEventListener('click', function () { ui.ym = ymAdd(ui.ym, -1); onMonth(); });
  $('#m-next').addEventListener('click', function () { ui.ym = ymAdd(ui.ym, 1); onMonth(); });
  $('#m-today').addEventListener('click', function () { ui.ym = ymOf(todayStr()); onMonth(); });
  function onMonth() { if (ui.range === 'sel') applyRange('sel'); renderAll(); }

  /* ---------------- quick add ---------------- */
  function syncSeg(sel, v) { $$(sel + ' button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === v)); }); }
  function fillWho(sel, val, allLabel) {
    var s = $(sel); s.textContent = '';
    s.appendChild(el('option', { value: '', text: allLabel || t('who_none') }));
    D.mem.forEach(function (m) { s.appendChild(el('option', { value: m.id, text: m.name, class: 'no-i18n' })); });
    s.value = val && memName(val) ? val : '';
  }
  function renderCats() {
    var box = $('#f-cats'); box.textContent = '';
    var cs = catsOfKind(ui.kind);
    if (!catById(ui.cat) || catById(ui.cat).k !== ui.kind) ui.cat = cs[0].id;
    cs.forEach(function (c) {
      box.appendChild(el('button', { type: 'button', class: 'chip', 'data-c': c.id, 'aria-pressed': String(c.id === ui.cat) },
        el('span', { class: 'ce', 'aria-hidden': 'true', text: c.e }), el('span', { class: BMAP[c.id] ? '' : 'no-i18n', text: catName(c) })));
    });
    box.appendChild(el('button', { type: 'button', class: 'chip add-chip', id: 'f-newcat' }, el('span', { 'aria-hidden': 'true', text: '＋' }), el('span', { text: t('new_cat') })));
  }
  function renderAdd() {
    $('#f-title').textContent = ui.edit ? t('edit_title') : t('add_title');
    $('#f-save').textContent = ui.edit ? t('update') : t('save_entry');
    $('#f-cancel').hidden = !ui.edit; $('#f-del').hidden = !ui.edit;
    syncSeg('#f-kind', ui.kind); syncSeg('#f-mode', ui.mode);
    renderCats();
    fillWho('#f-who', $('#f-who').value || D.meta.who);
    if (!$('#f-date').value) $('#f-date').value = todayStr();
    amtPreview();
    var box = $('#recent'); box.textContent = '';
    var rows = D.tx.slice().sort(sortDesc).slice(0, 8);
    rows.forEach(function (x) { box.appendChild(txRow(x)); });
    $('#recent-empty').hidden = rows.length > 0;
    $('#see-all').hidden = D.tx.length <= 8;
  }
  function amtPreview() {
    var r = parsePaise($('#f-amt').value);
    $('#f-amt-prev').textContent = r.paise ? money(r.paise) : '';
  }
  $('#f-amt').addEventListener('input', function () { amtPreview(); $('#f-err').textContent = ''; });
  $$('#f-kind button').forEach(function (b) { b.addEventListener('click', function () { ui.kind = b.dataset.v; syncSeg('#f-kind', ui.kind); renderCats(); }); });
  $$('#f-mode button').forEach(function (b) { b.addEventListener('click', function () { ui.mode = b.dataset.v; syncSeg('#f-mode', ui.mode); }); });
  $('#f-cats').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.id === 'f-newcat') { newCatModal(ui.kind, function (c) { ui.cat = c.id; renderCats(); }); return; }
    ui.cat = b.getAttribute('data-c'); $$('#f-cats .chip[data-c]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
  });
  $('#f-today').addEventListener('click', function () { $('#f-date').value = todayStr(); });
  $('#f-yday').addEventListener('click', function () { $('#f-date').value = addDays(todayStr(), -1); });
  $('#f-addmem').addEventListener('click', function () { setTab('data'); $('#mem-name').focus(); });
  $('#see-all').addEventListener('click', function () { setTab('list'); });
  function resetForm() {
    ui.edit = null;
    $('#f-amt').value = ''; $('#f-note').value = ''; $('#f-err').textContent = '';
    renderAdd();
  }
  function startEdit(id) {
    var x = txById(id); if (!x) return;
    ui.edit = id; ui.kind = x.k; ui.cat = catOf(x).id; ui.mode = x.m;
    setTab('add');
    $('#f-amt').value = rupees(x.p).replace(/\.00$/, '');
    $('#f-date').value = x.d; $('#f-note').value = txNote(x); fillWho('#f-who', x.w);
    renderAdd();
    $('#f-add').scrollIntoView({ block: 'start', behavior: 'smooth' });
    $('#f-amt').focus();
  }
  function budgetLevel(ym, key) {
    var b = budgetFor(ym), o = key === '_t' ? b.total : b.cats[key];
    return o ? o.level : '';
  }
  $('#f-add').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var r = parsePaise($('#f-amt').value), err = $('#f-err');
    if (r.empty || r.err) { err.textContent = t(r.err || 'err_amt'); $('#f-amt').focus(); return; }
    var d = $('#f-date').value;
    if (!parseYmd(d)) { err.textContent = t('err_date'); $('#f-date').focus(); return; }
    err.textContent = '';
    var hadSamples = hasSamples() && !ui.edit;
    if (hadSamples) removeSamples();
    var ym = ymOf(d), before = { c: budgetLevel(ym, ui.cat), t: budgetLevel(ym, '_t') };
    var note = str($('#f-note').value, 120), who = $('#f-who').value;
    if (ui.edit) {
      var x = txById(ui.edit);
      if (x) {
        var prev = JSON.parse(JSON.stringify(x));
        x.k = ui.kind; x.p = r.paise; x.c = ui.cat; x.m = ui.mode; x.d = d; x.w = who; delete x.rv;
        if (!(x.s && note === t('sn' + x.nk))) { x.n = note; delete x.s; delete x.nk; }
        save(['tx']);
        pushUndo(t('updated'), function () { var y = txById(prev.id); if (y) Object.keys(y).forEach(function (k) { delete y[k]; }); Object.assign(y || {}, prev); });
      }
    } else {
      D.tx.push({ id: uid(), k: ui.kind, p: r.paise, c: ui.cat, m: ui.mode, d: d, n: note, w: who, cr: Date.now() });
      save(['tx']);
      EDU.toast(t('saved_toast', { amt: money(r.paise), cat: catName(catById(ui.cat)) }) + (hadSamples ? ' · ' + t('samples_gone') : ''), 3200);
    }
    D.meta.mode = ui.mode; D.meta.who = who; store.set('meta', D.meta);
    if (ui.kind === 'e') {
      var after = { c: budgetLevel(ym, ui.cat), t: budgetLevel(ym, '_t') };
      [['c', ui.cat], ['t', '_t']].forEach(function (p) {
        if (after[p[0]] && after[p[0]] !== before[p[0]]) {
          var b = budgetFor(ym), o = p[1] === '_t' ? b.total : b.cats[p[1]], name = budgetLabel(p[1]);
          EDU.toast(after[p[0]] === 'over' ? t('al_over', { cat: name, amt: moneyR(-o.left) }) : t('al_warn', { cat: name, pct: fmtPct(o.pct), left: moneyR(o.left) }), 5000);
        }
      });
    }
    ui.ym = ym;
    $('#f-amt').value = ''; $('#f-note').value = ''; ui.edit = null;
    renderAll();
    $('#f-amt').focus();
  });
  $('#f-cancel').addEventListener('click', resetForm);
  $('#f-del').addEventListener('click', function () { if (ui.edit) deleteTx(ui.edit); });

  /* ---------------- delete + undo ---------------- */
  var undoFn = null, undoTimer = null;
  function pushUndo(label, fn) {
    undoFn = fn; $('#undo-txt').textContent = label; $('#undo-bar').hidden = false;
    clearTimeout(undoTimer); undoTimer = setTimeout(function () { $('#undo-bar').hidden = true; undoFn = null; }, UNDO_MS);
  }
  $('#undo-btn').addEventListener('click', function () {
    if (!undoFn) return; var f = undoFn; undoFn = null; f(); save(['tx']); $('#undo-bar').hidden = true; renderAll(); EDU.toast(t('undone'));
  });
  function deleteTx(id) {
    var i = -1; for (var j = 0; j < D.tx.length; j++) if (D.tx[j].id === id) { i = j; break; }
    if (i < 0) return;
    var gone = D.tx.splice(i, 1)[0];
    save(['tx']);
    if (ui.edit === id) { ui.edit = null; $('#f-amt').value = ''; $('#f-note').value = ''; }
    pushUndo(t('deleted'), function () { D.tx.push(gone); });
    renderAll();
  }
  ['#recent', '#l-rows', '#r-top'].forEach(function (sel) {
    $(sel).addEventListener('click', function (e) { var b = e.target.closest('.erow'); if (b) startEdit(b.getAttribute('data-id')); });
  });

  /* ---------------- custom categories ---------------- */
  function newCatModal(kind, done) {
    var emo = EMOJIS[0], k = kind || 'e', close;
    var name = el('input', { type: 'text', id: 'nc-name', class: 'no-i18n', maxlength: '30' });
    var grid = el('div', { class: 'emo-grid', role: 'group', 'aria-label': t('nc_emoji') });
    EMOJIS.forEach(function (e) {
      grid.appendChild(el('button', { type: 'button', text: e, 'aria-pressed': String(e === emo), onclick: function () { emo = e; $$('button', grid).forEach(function (b) { b.setAttribute('aria-pressed', String(b.textContent === e)); }); } }));
    });
    var seg = el('div', { class: 'seg kind', role: 'group', 'aria-label': t('kind') });
    ['e', 'i'].forEach(function (v) {
      seg.appendChild(el('button', { type: 'button', 'data-v': v, 'aria-pressed': String(v === k), text: t(v === 'e' ? 'kind_exp' : 'kind_inc'), onclick: function () { k = v; $$('button', seg).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === v)); }); } }));
    });
    var err = el('p', { class: 'err', 'aria-live': 'polite' });
    var f = el('form', { class: 'stack' }, seg,
      el('label', { class: 'field' }, el('span', { text: t('nc_name') }), name),
      el('div', { class: 'field' }, el('span', { text: t('nc_emoji') }), grid), err,
      el('div', { class: 'row' }, el('button', { type: 'submit', class: 'btn btn-primary', id: 'nc-save', text: t('save') }), el('button', { type: 'button', class: 'btn', text: t('cancel'), onclick: function () { close(); } })));
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var n = str(name.value, 30);
      if (!n) { err.textContent = t('nc_err'); name.focus(); return; }
      var dup = catsOfKind(k).filter(function (c) { return catName(c).toLowerCase() === n.toLowerCase(); })[0];
      var c = dup || { id: 'u' + uid(), name: n, e: emo, k: k };
      if (!dup) { D.cats.push(c); save(['cats']); }
      close(); if (done) done(c); renderAll();
    });
    close = EDU.modal(f, { title: t('nc_title') });
    setTimeout(function () { name.focus(); }, 30);
  }

  /* ---------------- entries list ---------------- */
  function applyRange(r) {
    ui.range = r;
    var T = todayStr();
    if (r === 'sel') { ui.f.from = ui.ym + '-01'; ui.f.to = ui.ym + '-' + pad(daysIn(ui.ym)); }
    else if (r === 'last3') { ui.f.from = ymAdd(ymOf(T), -2) + '-01'; ui.f.to = T; }
    else if (r === 'year') { ui.f.from = T.slice(0, 4) + '-01-01'; ui.f.to = T.slice(0, 4) + '-12-31'; }
    else { ui.f.from = ''; ui.f.to = ''; }
    $('#l-from').value = ui.f.from; $('#l-to').value = ui.f.to;
  }
  function fillFilterSelects() {
    var cs = $('#l-cat'), cur = ui.f.cat; cs.textContent = '';
    cs.appendChild(el('option', { value: '', text: t('f_cat_all') }));
    catsOfKind('e').concat(catsOfKind('i')).forEach(function (c) { cs.appendChild(el('option', { value: c.id, text: c.e + ' ' + catName(c), class: BMAP[c.id] ? '' : 'no-i18n' })); });
    cs.value = cur;
    var ms = $('#l-mode'); ms.textContent = '';
    ms.appendChild(el('option', { value: '', text: t('f_mode_all') }));
    MODES.forEach(function (m) { ms.appendChild(el('option', { value: m, text: modeName(m) })); });
    ms.value = ui.f.mode;
    fillWho('#l-who', ui.f.who, t('f_who_all'));
    $('#l-kind').value = ui.f.kind;
  }
  function filtered() {
    var f = ui.f, q = f.q.toLowerCase(), qn = q.replace(/[,₹\s]/g, '');
    return D.tx.filter(function (x) {
      if (f.kind && x.k !== f.kind) return false;
      if (f.cat && catOf(x).id !== f.cat) return false;
      if (f.mode && x.m !== f.mode) return false;
      if (f.who && x.w !== f.who) return false;
      if (f.from && x.d < f.from) return false;
      if (f.to && x.d > f.to) return false;
      if (q) {
        var hay = (txNote(x) + ' ' + catName(catOf(x)) + ' ' + modeName(x.m) + ' ' + memName(x.w)).toLowerCase();
        if (hay.indexOf(q) < 0 && !(qn && /^\d+(\.\d+)?$/.test(qn) && rupees(x.p).indexOf(qn) === 0)) return false;
      }
      return true;
    }).sort(sortDesc);
  }
  function renderList() {
    fillFilterSelects();
    syncSeg('#l-range', ui.range);
    var rows = filtered(), out = 0, inc = 0;
    rows.forEach(function (x) { if (x.k === 'i') inc += x.p; else out += x.p; });
    $('#l-res').textContent = t('res_count', { n: EDU.fmt(rows.length), out: money(out), inc: money(inc) });
    var box = $('#l-rows'); box.textContent = '';
    var frag = document.createDocumentFragment();
    rows.slice(0, ui.limit).forEach(function (x) { frag.appendChild(txRow(x)); });
    box.appendChild(frag);
    $('#l-empty').hidden = rows.length > 0;
    $('#l-more').hidden = rows.length <= ui.limit;
    $('#l-csv').disabled = !rows.length;
  }
  var qTimer = null;
  $('#l-q').addEventListener('input', function () { var v = this.value; clearTimeout(qTimer); qTimer = setTimeout(function () { ui.f.q = v.trim(); ui.limit = PAGE; renderList(); }, 150); });
  [['#l-kind', 'kind'], ['#l-cat', 'cat'], ['#l-mode', 'mode'], ['#l-who', 'who']].forEach(function (p) {
    $(p[0]).addEventListener('change', function () { ui.f[p[1]] = this.value; ui.limit = PAGE; renderList(); });
  });
  [['#l-from', 'from'], ['#l-to', 'to']].forEach(function (p) {
    $(p[0]).addEventListener('change', function () { ui.f[p[1]] = parseYmd(this.value) ? this.value : ''; ui.range = 'custom'; ui.limit = PAGE; renderList(); });
  });
  $$('#l-range button').forEach(function (b) { b.addEventListener('click', function () { applyRange(b.dataset.v); ui.limit = PAGE; renderList(); }); });
  $('#l-more').addEventListener('click', function () { ui.limit += PAGE * 2; renderList(); });
  $('#l-clear').addEventListener('click', function () {
    ui.f = { q: '', kind: '', cat: '', mode: '', who: '', from: '', to: '' }; ui.range = 'all'; $('#l-q').value = ''; applyRange('all'); ui.limit = PAGE; renderList();
  });
  $('#l-csv').addEventListener('click', function () { exportCsv(filtered(), 'expenses-filtered-' + todayStr() + '.csv'); });
  $('#l-print').addEventListener('click', function () { ui.limit = 100000; renderList(); printAs('pr-list'); });

  /* ---------------- reports ---------------- */
  var COLORS = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)', 'var(--c7)', 'var(--c8)'];
  var SVGNS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) { var e = document.createElementNS(SVGNS, tag); Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); }); return e; }
  function renderRep() {
    var s = monthSum(ui.ym), prev = monthSum(ymAdd(ui.ym, -1));
    /* donut */
    var cats = Object.keys(s.cats).map(function (k) { return { c: catById(k) || BMAP.other, v: s.cats[k] }; }).sort(function (a, b) { return b.v - a.v; });
    var top = cats.slice(0, 7);
    if (cats.length > 7) { var rest = cats.slice(6).reduce(function (a, x) { return a + x.v; }, 0); top = cats.slice(0, 6).concat([{ rest: true, v: rest }]); }
    var donut = $('#r-donut'), leg = $('#r-legend');
    donut.textContent = ''; leg.textContent = '';
    $('#r-donut-wrap').hidden = !s.spent; $('#r-nospend').hidden = !!s.spent;
    if (s.spent) {
      var svg = svgEl('svg', { viewBox: '0 0 42 42', 'aria-hidden': 'true' });
      svg.appendChild(svgEl('circle', { cx: 21, cy: 21, r: 15.9155, fill: 'none', 'stroke-width': 6, style: 'stroke:var(--surface-2)' }));
      var acc = 0;
      top.forEach(function (x, i) {
        var p = x.v / s.spent * 100;
        svg.appendChild(svgEl('circle', { cx: 21, cy: 21, r: 15.9155, fill: 'none', 'stroke-width': 6, 'stroke-dasharray': Math.max(0, p - (top.length > 1 ? 0.4 : 0)) + ' ' + (100 - p + (top.length > 1 ? 0.4 : 0)), 'stroke-dashoffset': -acc, style: 'stroke:' + COLORS[i] }));
        acc += p;
        leg.appendChild(el('li', {},
          el('i', { class: 'sw', style: { background: COLORS[i] } }),
          el('span', { class: x.rest || BMAP[x.c.id] ? '' : 'no-i18n', text: x.rest ? t('rest') : x.c.e + ' ' + catName(x.c) }),
          el('span', { class: 'lv' }, numSpan(moneyR(x.v)), el('small', { class: 'num', text: fmtPct(p) + '%' }))));
      });
      donut.appendChild(svg);
      donut.appendChild(el('div', { class: 'ctr' }, el('b', { text: moneyR(s.spent) }), el('span', { text: t('t_spent') })));
      donut.setAttribute('aria-label', t('rep_cat') + ': ' + top.map(function (x) { return (x.rest ? t('rest') : catName(x.c)) + ' ' + fmtPct(x.v / s.spent * 100) + '%'; }).join(', '));
    }
    /* daily bars */
    var n = daysIn(ui.ym), max = 0, T = todayStr(), isCur = ymOf(T) === ui.ym, upto = isCur ? +T.slice(8, 10) : n;
    for (var d = 1; d <= n; d++) max = Math.max(max, s.days[d] || 0);
    var bars = $('#r-bars'), xl = $('#r-xlab'); bars.textContent = ''; xl.textContent = '';
    for (d = 1; d <= n; d++) {
      var v = s.days[d] || 0, date = ui.ym + '-' + pad(d);
      var b = el('div', { class: 'b' + (v ? '' : ' zero') + (isCur && d === upto ? ' today' : ''), title: dayMon(date) + ': ' + money(v) }, el('span', { style: { height: (max ? Math.max(v ? 2 : 0, v / max * 100) : 0) + '%' } }));
      bars.appendChild(b);
      xl.appendChild(el('span', { text: d === 1 || d % 5 === 0 ? String(d) : '' }));
    }
    var avg = upto > 0 ? s.spent / upto : 0;
    if (max && avg) bars.appendChild(el('div', { class: 'avg', style: { bottom: (avg / max * 100) + '%' } }));
    $('#r-dmax').textContent = max ? t('max_day', { amt: moneyR(max) }) : '';
    $('#r-davg').textContent = s.spent ? t('day_avg', { amt: moneyR(avg) }) : '';
    bars.setAttribute('aria-label', t('rep_daily') + ' · ' + (s.spent ? t('day_avg', { amt: moneyR(avg) }) : t('no_spend')));
    /* last 6 months */
    var tr = $('#r-trend'), tl = $('#r-tlab'); tr.textContent = ''; tl.textContent = '';
    var months = [], tmax = 0;
    for (var i = 5; i >= 0; i--) { var ym = ymAdd(ui.ym, -i), ms = monthSum(ym); months.push({ ym: ym, s: ms }); tmax = Math.max(tmax, ms.spent, ms.inc); }
    var aria = [];
    months.forEach(function (m) {
      tr.appendChild(el('div', { class: 'g' + (m.ym === ui.ym ? ' sel' : ''), title: monthLabel(m.ym) + ' · ' + t('t_spent') + ' ' + moneyR(m.s.spent) + ' · ' + t('t_income') + ' ' + moneyR(m.s.inc) },
        el('span', { style: { height: (tmax ? m.s.spent / tmax * 100 : 0) + '%', background: 'var(--c2)' } }),
        el('span', { style: { height: (tmax ? m.s.inc / tmax * 100 : 0) + '%', background: 'var(--c4)' } })));
      tl.appendChild(el('span', { text: monthShort(m.ym) }));
      aria.push(monthLabel(m.ym) + ' ' + moneyR(m.s.spent) + ' / ' + moneyR(m.s.inc));
    });
    tr.setAttribute('aria-label', t('rep_trend') + ': ' + aria.join('; '));
    /* compare */
    var tbl = $('#r-cmp'); tbl.textContent = '';
    var keys = {}; Object.keys(s.cats).concat(Object.keys(prev.cats)).forEach(function (k) { keys[k] = 1; });
    var rows = Object.keys(keys).map(function (k) { return { c: catById(k) || BMAP.other, a: s.cats[k] || 0, b: prev.cats[k] || 0 }; }).sort(function (x, y) { return y.a - x.a || y.b - x.b; });
    tbl.appendChild(el('thead', {}, el('tr', {}, el('th', { text: t('category') }), el('th', { class: 'n', text: monthShort(ui.ym) }), el('th', { class: 'n', text: monthShort(ymAdd(ui.ym, -1)) }), el('th', { class: 'n', text: t('col_change') }))));
    var tb = el('tbody');
    rows.concat([{ total: true, a: s.spent, b: prev.spent }]).forEach(function (r) {
      var ch = r.b ? (r.a - r.b) / r.b * 100 : null, cls = ch === null ? '' : ch > 0.5 ? 'up' : ch < -0.5 ? 'down' : '';
      var chTxt = ch === null ? (r.a ? t('new_lbl') : '—') : (ch > 0 ? '+' : ch < 0 ? '−' : '') + fmtPct(Math.abs(ch)) + '%';
      tb.appendChild(el('tr', r.total ? { style: { fontWeight: '800' } } : {},
        el('td', { class: r.total || BMAP[r.c.id] ? '' : 'no-i18n', text: r.total ? t('total') : r.c.e + ' ' + catName(r.c) }),
        el('td', { class: 'n' }, numSpan(moneyR(r.a))), el('td', { class: 'n' }, numSpan(moneyR(r.b))), el('td', { class: 'n ' + cls }, numSpan(chTxt))));
    });
    tbl.appendChild(tb);
    /* top expenses */
    var topBox = $('#r-top'); topBox.textContent = '';
    var big = monthTx(ui.ym).filter(function (x) { return x.k === 'e' && !isSave(catOf(x)); }).sort(function (a, b) { return b.p - a.p; }).slice(0, 5);
    big.forEach(function (x) { topBox.appendChild(txRow(x)); });
    $('#r-top-empty').hidden = big.length > 0;
    /* insights */
    var ins = $('#r-ins'); ins.textContent = '';
    insights(s, prev, cats, isCur, upto, n).forEach(function (txt) { ins.appendChild(el('li', { text: txt })); });
  }
  function insights(s, prev, cats, isCur, upto, n) {
    var out = [];
    if (!s.spent && !s.inc) return [t('ins_none')];
    if (cats.length) out.push(t('ins_top', { cat: catName(cats[0].c), pct: fmtPct(cats[0].v / s.spent * 100) }));
    if (s.inc > 0) {
      var rate = pct(s.saved, s.inc);
      if (s.saved < 0) out.push(t('ins_over', { amt: moneyR(-s.saved) }));
      else out.push(t(rate >= 20 ? 'ins_rate_good' : 'ins_rate', { pct: fmtPct(rate) }));
    }
    if (prev.spent > 0 && s.spent > 0 && !isCur) {
      var ch = (s.spent - prev.spent) / prev.spent * 100;
      if (Math.abs(ch) >= 1) out.push(t(ch > 0 ? 'ins_more' : 'ins_less', { pct: fmtPct(Math.abs(ch)), amt: moneyR(Math.abs(s.spent - prev.spent)) }));
    }
    var jump = null;
    cats.forEach(function (x) { var d = x.v - (prev.cats[x.c.id] || 0); if (prev.cats[x.c.id] && d > 0 && (!jump || d > jump.d)) jump = { c: x.c, d: d }; });
    if (jump && jump.d >= 10000) out.push(t('ins_jump', { cat: catName(jump.c), amt: moneyR(jump.d) }));
    var mk = Object.keys(s.modes).sort(function (a, b) { return s.modes[b] - s.modes[a]; })[0];
    if (mk && s.spent) out.push(t('ins_mode', { pct: fmtPct(s.modes[mk] / s.spent * 100), mode: modeName(mk) }));
    if (isCur && s.spent && upto >= 5 && upto < n) out.push(t('ins_pace', { amt: moneyR(s.spent / upto * n) }));
    var wk = 0; Object.keys(s.days).forEach(function (d) { var w = new Date(+ui.ym.slice(0, 4), +ui.ym.slice(5, 7) - 1, +d).getDay(); if (w === 0 || w === 6) wk += s.days[d]; });
    if (s.spent && wk / s.spent >= 0.4) out.push(t('ins_weekend', { pct: fmtPct(wk / s.spent * 100) }));
    var b = budgetFor(ui.ym), over = Object.keys(b.cats).filter(function (k) { return b.cats[k].level === 'over'; });
    if (b.total && b.total.level !== 'over' && !over.length && s.spent) out.push(t('ins_in_budget', { amt: moneyR(b.total.left) }));
    if (s.inv) out.push(t('ins_invest', { amt: moneyR(s.inv) }));
    return out;
  }
  $('#r-print').addEventListener('click', function () { printAs('pr-rep'); });
  $('#r-csv').addEventListener('click', function () { exportCsv(monthTx(ui.ym).slice().sort(sortDesc).reverse(), 'expenses-' + ui.ym + '.csv'); });
  function printAs(cls) {
    document.body.classList.add(cls);
    var done = function () { document.body.classList.remove(cls); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(function () { window.print(); setTimeout(done, 500); }, 50);
  }

  /* ---------------- budgets tab ---------------- */
  function budInput(id, key, val) {
    return el('input', { type: 'text', id: id, class: 'no-i18n', inputmode: 'decimal', dir: 'ltr', autocomplete: 'off', maxlength: '14', placeholder: '0', 'data-k': key, value: val ? rupees(val).replace(/\.00$/, '') : '', 'aria-label': budgetLabel(key) });
  }
  function renderBud() {
    var box = $('#b-rows'); box.textContent = '';
    var tot = el('div', { class: 'brow total', 'data-k': '_t' },
      el('label', { class: 'bn', for: 'b-total', text: '🎯 ' + t('bud_total') }), budInput('b-total', '_t', D.bud.total), el('div', { class: 'bst' }));
    box.appendChild(tot);
    box.appendChild(el('h3', { text: t('bud_cats'), style: { margin: '14px 0 0' } }));
    catsOfKind('e').filter(function (c) { return !isSave(c); }).forEach(function (c) {
      box.appendChild(el('div', { class: 'brow', 'data-k': c.id },
        el('label', { class: 'bn' + (BMAP[c.id] ? '' : ' no-i18n'), for: 'b-' + c.id, text: c.e + ' ' + catName(c) }), budInput('b-' + c.id, c.id, D.bud.cats[c.id]), el('div', { class: 'bst' })));
    });
    $('#b-carry').checked = D.bud.carry;
    updateBud();
    var s = monthSum(ui.ym), rule = $('#b-rule');
    if (s.inc > 0) {
      rule.textContent = t('r_calc', { inc: moneyR(s.inc), a: moneyR(s.inc * 0.5), b: moneyR(s.inc * 0.3), c: moneyR(s.inc * 0.2) });
      $('#b-rule-use').hidden = false;
    } else { rule.textContent = t('r_noinc'); $('#b-rule-use').hidden = true; }
  }
  function updateBud() {
    var b = budgetFor(ui.ym), s = monthSum(ui.ym);
    $$('#b-rows .brow').forEach(function (row) {
      var k = row.getAttribute('data-k'), o = k === '_t' ? b.total : b.cats[k], st = $('.bst', row);
      st.textContent = '';
      var spent = k === '_t' ? s.spent : s.cats[k] || 0;
      if (!o) { if (spent) st.appendChild(el('small', {}, el('span', { text: t('t_spent') + ': ' + moneyR(spent) }))); return; }
      st.appendChild(el('div', { class: 'progress ' + o.level, role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.min(100, Math.round(o.pct))), 'aria-label': budgetLabel(k) },
        el('span', { style: { width: Math.min(100, o.pct) + '%' } })));
      var left = o.left >= 0 ? el('span', { class: o.level === 'warn' ? 'w' : '', text: t('bud_left', { amt: moneyR(o.left) }) + ' · ' + fmtPct(o.pct) + '%' }) : el('span', { class: 'o', text: t('bud_over', { amt: moneyR(-o.left) }) });
      st.appendChild(el('small', {}, el('span', { text: t('bud_of', { spent: moneyR(o.spent), budget: moneyR(o.eff) }) + (o.carry ? ' · ' + t('bud_carry_amt', { amt: moneyR(o.carry) }) : '') }), left));
    });
  }
  $('#b-rows').addEventListener('change', function (e) {
    var inp = e.target.closest('input'); if (!inp) return;
    var k = inp.getAttribute('data-k'), r = parsePaise(inp.value), v = r.paise || 0;
    if (r.err) { EDU.toast(t(r.err)); inp.value = ''; v = 0; }
    if (k === '_t') D.bud.total = v; else if (v) D.bud.cats[k] = v; else delete D.bud.cats[k];
    if (!D.bud.start) D.bud.start = ui.ym;
    if (ui.ym < D.bud.start) D.bud.start = ui.ym;
    D.meta.sampleBud = false;
    save(['bud', 'meta']);
    updateBud(); renderAlerts();
    EDU.toast(t('bud_saved'));
  });
  $('#b-carry').addEventListener('change', function () { D.bud.carry = this.checked; if (!D.bud.start) D.bud.start = ui.ym; D.meta.sampleBud = false; save(['bud', 'meta']); updateBud(); renderAlerts(); });
  $('#b-clear').addEventListener('click', function () {
    if (!confirm(t('bud_clear_q'))) return;
    D.bud = { total: 0, cats: {}, carry: false, start: '' }; D.meta.sampleBud = false; save(['bud', 'meta']); renderBud(); renderAlerts();
  });
  $('#b-rule-use').addEventListener('click', function () {
    var s = monthSum(ui.ym); if (!(s.inc > 0)) return;
    D.bud.total = Math.round(s.inc * 0.8 / 100) * 100; if (!D.bud.start) D.bud.start = ui.ym; D.meta.sampleBud = false;
    save(['bud', 'meta']); renderBud(); renderAlerts(); EDU.toast(t('bud_saved'));
  });

  /* ---------------- repeat entries tab ---------------- */
  var PRESETS = [
    { key: 'p_rent', k: 'e', c: 'rent', m: 'net', day: 1, e: '🏠' }, { key: 'p_emi', k: 'e', c: 'emi', m: 'net', day: 5, e: '🏦' },
    { key: 'p_sip', k: 'e', c: 'invest', m: 'net', day: 10, e: '📈' }, { key: 'p_sub', k: 'e', c: 'fun', m: 'card', day: 15, e: '📺' },
    { key: 'p_fees', k: 'e', c: 'edu', m: 'net', day: 10, e: '🎓' }, { key: 'p_salary', k: 'i', c: 'salary', m: 'net', day: 1, e: '💼' }
  ];
  function fillRcSelects(r) {
    var cs = $('#rc-cat'); cs.textContent = '';
    catsOfKind(ui.rcKind).forEach(function (c) { cs.appendChild(el('option', { value: c.id, text: c.e + ' ' + catName(c), class: BMAP[c.id] ? '' : 'no-i18n' })); });
    if (r && r.c && catById(r.c) && catById(r.c).k === ui.rcKind) cs.value = r.c;
    var ms = $('#rc-mode'), mv = ms.value || 'net'; ms.textContent = '';
    MODES.forEach(function (m) { ms.appendChild(el('option', { value: m, text: modeName(m) })); });
    ms.value = r && r.m ? r.m : mv;
    var fs = $('#rc-from'), fv = fs.value; fs.textContent = '';
    var cur = ymOf(todayStr());
    for (var i = -6; i <= 12; i++) { var ym = ymAdd(cur, i); fs.appendChild(el('option', { value: ym, text: monthLabel(ym) })); }
    fs.value = r && r.next ? (r.next < ymAdd(cur, -6) ? cur : r.next) : (fv || cur);
    fillWho('#rc-who', r ? r.w : $('#rc-who').value);
  }
  function openRc(r, preset) {
    ui.rcEdit = r ? r.id : null;
    var src = r || preset || { k: 'e', c: 'rent', m: 'net', day: 1 };
    ui.rcKind = src.k;
    $('#rc-form').hidden = false;
    $('#rc-title').textContent = r ? t('rec_edit') : t('rec_add');
    syncSeg('#rc-kind', ui.rcKind);
    $('#rc-amt').value = r ? rupees(r.p).replace(/\.00$/, '') : '';
    $('#rc-note').value = r ? r.n : preset ? t(preset.key) : '';
    $('#rc-day').value = src.day || 1;
    $('#rc-err').textContent = '';
    $('#rc-del').hidden = !r;
    fillRcSelects(src);
    $('#rc-form').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    $('#rc-amt').focus();
  }
  function renderRec() {
    var pb = $('#rc-presets'); pb.textContent = '';
    PRESETS.forEach(function (p, i) { pb.appendChild(el('button', { type: 'button', class: 'chip', 'data-i': i }, el('span', { 'aria-hidden': 'true', text: p.e }), el('span', { text: t(p.key) }))); });
    pb.appendChild(el('button', { type: 'button', class: 'chip add-chip', id: 'rc-new' }, el('span', { 'aria-hidden': 'true', text: '＋' }), el('span', { text: t('rec_custom') })));
    if (!$('#rc-form').hidden) { syncSeg('#rc-kind', ui.rcKind); fillRcSelects(ui.rcEdit ? recById(ui.rcEdit) : { k: ui.rcKind, c: $('#rc-cat').value, m: $('#rc-mode').value, next: $('#rc-from').value }); $('#rc-title').textContent = ui.rcEdit ? t('rec_edit') : t('rec_add'); }
    var box = $('#rc-rows'); box.textContent = '';
    var monthly = 0;
    D.rec.forEach(function (r) {
      var c = catById(r.c) || BMAP[r.k === 'i' ? 'otherin' : 'other'];
      if (r.on && r.k === 'e') monthly += r.p;
      box.appendChild(el('div', { class: 'rrow' + (r.on ? '' : ' off') },
        el('span', { class: 'eav', 'aria-hidden': 'true', text: c.e }),
        el('span', { class: 'einfo' }, el('span', { class: 'et no-i18n', text: r.n || catName(c) }),
          el('span', { class: 'es', text: catName(c) + ' · ' + modeName(r.m) + ' · ' + t('rec_every', { d: r.day }) + (r.on ? ' · ' + t('rec_next', { date: dmy(nextDate(r)) }) : ' · ' + t('rec_paused')) })),
        el('span', { class: 'ea num ' + (r.k === 'i' ? 'i' : 'o'), text: money(r.p) }),
        el('span', { class: 'acts' },
          el('button', { type: 'button', class: 'btn btn-sm', 'data-act': 'edit', 'data-id': r.id, text: t('edit') }),
          el('button', { type: 'button', class: 'btn btn-sm', 'data-act': 'toggle', 'data-id': r.id, text: r.on ? t('pause') : t('resume') }))));
    });
    $('#rc-empty').hidden = D.rec.length > 0;
    $('#rc-total').hidden = !monthly;
    $('#rc-total').textContent = t('rec_monthly', { amt: money(monthly) });
  }
  function recById(id) { for (var i = 0; i < D.rec.length; i++) if (D.rec[i].id === id) return D.rec[i]; return null; }
  $('#rc-presets').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.id === 'rc-new') openRc(null, null); else openRc(null, PRESETS[+b.getAttribute('data-i')]);
  });
  $$('#rc-kind button').forEach(function (b) { b.addEventListener('click', function () { ui.rcKind = b.dataset.v; syncSeg('#rc-kind', ui.rcKind); fillRcSelects({ k: ui.rcKind, m: $('#rc-mode').value, next: $('#rc-from').value }); }); });
  $('#rc-cancel').addEventListener('click', function () { $('#rc-form').hidden = true; ui.rcEdit = null; });
  $('#rc-form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var r = parsePaise($('#rc-amt').value), err = $('#rc-err');
    if (r.empty || r.err) { err.textContent = t(r.err || 'err_amt'); $('#rc-amt').focus(); return; }
    var day = Math.round(+asciiDigits($('#rc-day').value));
    if (!(day >= 1 && day <= 31)) { err.textContent = t('err_day'); $('#rc-day').focus(); return; }
    var o = { k: ui.rcKind, p: r.paise, c: $('#rc-cat').value, m: $('#rc-mode').value, n: str($('#rc-note').value, 80), w: $('#rc-who').value, day: day, on: true };
    var from = $('#rc-from').value;
    if (ui.rcEdit) {
      var ex = recById(ui.rcEdit);
      if (ex) { var keepNext = ex.next; Object.assign(ex, o); ex.next = from > keepNext ? from : keepNext; }
    } else { o.id = uid(); o.next = from; D.rec.push(o); }
    save(['rec']);
    var added = runRecurring();
    $('#rc-form').hidden = true; ui.rcEdit = null;
    EDU.toast(t('rec_saved') + (added ? ' · ' + t('rv_text', { n: EDU.fmt(added) }) : ''), 4000);
    renderAll();
  });
  $('#rc-del').addEventListener('click', function () {
    if (!ui.rcEdit || !confirm(t('rec_del_q'))) return;
    D.rec = D.rec.filter(function (r) { return r.id !== ui.rcEdit; });
    save(['rec']); $('#rc-form').hidden = true; ui.rcEdit = null; EDU.toast(t('rec_deleted')); renderAll();
  });
  $('#rc-rows').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]'); if (!b) return;
    var r = recById(b.getAttribute('data-id')); if (!r) return;
    if (b.getAttribute('data-act') === 'edit') { openRc(r); return; }
    r.on = !r.on;
    if (r.on && r.next < ymOf(todayStr())) r.next = ymOf(todayStr());   /* resuming does not back-fill paused months */
    save(['rec']); if (r.on) runRecurring(); renderAll();
  });

  /* review modal for auto-added repeat entries */
  $('#rv-open').addEventListener('click', function () {
    var close, box = el('div', { class: 'stack' });
    function draw() {
      box.textContent = '';
      var items = D.tx.filter(function (x) { return x.rv; }).sort(function (a, b) { return a.d < b.d ? -1 : 1; });
      if (!items.length) { close(); renderAll(); return; }
      box.appendChild(el('p', { class: 'small muted mb0', text: t('rv_help') }));
      items.forEach(function (x) {
        var c = catOf(x);
        box.appendChild(el('div', { class: 'rv-row' },
          el('div', {}, el('b', { class: x.n ? 'no-i18n' : '', text: c.e + ' ' + (x.n || catName(c)) }), el('div', { class: 'small muted', text: dmy(x.d) + ' · ' + money(x.p) })),
          el('div', { class: 'row' },
            el('button', { type: 'button', class: 'btn btn-sm btn-primary', text: t('rv_ok'), onclick: function () { delete x.rv; save(['tx']); draw(); } }),
            el('button', { type: 'button', class: 'btn btn-sm', text: t('edit'), onclick: function () { delete x.rv; save(['tx']); close(); startEdit(x.id); } }),
            el('button', { type: 'button', class: 'btn btn-sm btn-danger', text: t('rv_skip'), onclick: function () { D.tx = D.tx.filter(function (y) { return y !== x; }); save(['tx']); draw(); } }))));
      });
      box.appendChild(el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn btn-primary', id: 'rv-all', text: t('rv_all'), onclick: function () { items.forEach(function (x) { delete x.rv; }); save(['tx']); draw(); } })));
    }
    close = EDU.modal(box, { title: t('rv_title'), onClose: function () { renderAll(); } });
    draw();
  });

  /* ---------------- CSV export ---------------- */
  function csvHeader() { return [t('date'), t('kind'), t('category'), t('amount_plain'), t('mode_label'), t('who'), t('note')]; }
  function exportCsv(rows, name) {
    var out = [csvHeader()];
    rows.forEach(function (x) { out.push([x.d, x.k === 'i' ? t('kind_inc') : t('kind_exp'), catName(catOf(x)), rupees(x.p), modeName(x.m), memName(x.w), txNote(x)]); });
    EDU.download(name, EDU.csv.stringify(out), 'text/csv');
  }
  $('#csv-all').addEventListener('click', function () { exportCsv(D.tx.slice().sort(sortDesc).reverse(), 'expenses-all-' + todayStr() + '.csv'); });

  /* ---------------- CSV import with column mapping ---------------- */
  var MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
  function mkDate(y, m, d) { if (y < 100) y += 2000; var dt = new Date(y, m - 1, d); return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d && y >= 1990 && y <= 2100 ? ymd(dt) : ''; }
  function parseAnyDate(raw, fmt) {
    var s = asciiDigits(raw).trim(); if (!s) return '';
    if (/^\d{5}(\.\d+)?$/.test(s)) { var ser = Math.floor(+s); if (ser > 30000 && ser < 80000) { var b = new Date(1899, 11, 30); b.setDate(b.getDate() + ser); return ymd(b); } }
    s = s.replace(/[T ]\d{1,2}:\d{2}.*$/, '').trim();
    var p = s.split(/[\s\/\-.,]+/).filter(Boolean);
    if (p.length < 3) return '';
    var mi = -1;
    for (var i = 0; i < 3; i++) { var w = p[i].toLowerCase().slice(0, 4).replace(/[^a-z]/g, ''); if (w && (MON[w] || MON[w.slice(0, 3)])) { mi = i; p[i] = String(MON[w] || MON[w.slice(0, 3)]); } }
    if (!/^\d+$/.test(p[0]) || !/^\d+$/.test(p[1]) || !/^\d+$/.test(p[2])) return '';
    var a = +p[0], b2 = +p[1], c = +p[2];
    if (p[0].length === 4 || fmt === 'ymd') return mkDate(a, b2, c);
    if (mi === 0) return mkDate(c, a, b2);
    if (fmt === 'mdy') return mkDate(c, a, b2);
    if (fmt === 'dmy' || mi === 1) return mkDate(c, b2, a);
    if (a <= 12 && b2 > 12) return mkDate(c, a, b2);   /* clearly MM/DD */
    return mkDate(c, b2, a);                           /* Indian default DD/MM */
  }
  /* signed paise from "1,250.00", "(500)", "-500", "500 Dr", "₹ 500 CR" ; null if not a number */
  function parseSigned(raw) {
    var s = asciiDigits(raw).trim(); if (!s) return null;
    var sign = 1, low = s.toLowerCase();
    if (/\bdr\.?$/.test(low)) { sign = -1; s = s.replace(/dr\.?$/i, ''); } else if (/\bcr\.?$/.test(low)) { s = s.replace(/cr\.?$/i, ''); }
    if (/^\(.*\)$/.test(s.trim())) { sign = -sign; s = s.trim().slice(1, -1); }
    s = s.replace(/[\s,₹]/g, '').replace(/^(rs\.?|inr)/i, '');
    if (/^-/.test(s)) { sign = -sign; s = s.slice(1); } else if (/^\+/.test(s)) s = s.slice(1);
    if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return null;
    var v = Math.round(parseFloat(s) * 100);
    return isFinite(v) ? sign * v : null;
  }
  var KW = [
    ['food', /swiggy|zomato|restaurant|cafe|hotel|dhaba|pizza|domino|kfc|mcdonald|chai|tea|food|canteen|bakery/],
    ['groc', /bigbasket|blinkit|zepto|grofers|dmart|d-mart|kirana|grocery|vegetable|sabzi|milk|dairy|reliance fresh|jiomart|more retail|instamart/],
    ['travel', /uber|ola|rapido|irctc|railway|metro|bus|redbus|makemytrip|goibibo|indigo|air india|cab|auto|toll|fastag/],
    ['fuel', /petrol|diesel|fuel|hpcl|bpcl|iocl|indian oil|bharat petroleum|cng/],
    ['rent', /\brent\b|landlord|pg rent|house rent/],
    ['bills', /electricity|bescom|msedcl|tneb|bses|tata power|water bill|gas|indane|bharat gas|hp gas|lpg|municipal|property tax/],
    ['mobile', /jio|airtel|vodafone|\bvi\b|bsnl|recharge|broadband|wifi|internet|dth|tata play/],
    ['health', /pharma|medical|medicine|chemist|apollo|hospital|clinic|doctor|lab|1mg|netmeds|pharmeasy/],
    ['edu', /school|college|tuition|fees|coaching|course|udemy|book/],
    ['shop', /amazon|flipkart|myntra|ajio|meesho|nykaa|mall|store|shopping/],
    ['fun', /netflix|hotstar|prime video|spotify|youtube|bookmyshow|pvr|inox|movie|cinema|game/],
    ['emi', /\bemi\b|loan|bajaj finserv|home credit|repayment/],
    ['invest', /\bsip\b|mutual fund|groww|zerodha|upstox|\bppf\b|\brd\b|fixed deposit|\bfd\b|nps|lic premium/],
    ['gift', /gift|donation|temple|mandir|gurudwara|church|mosque|charity/],
    ['salary', /salary|payroll|sal cr|stipend/],
    ['interest', /interest|int\.pd|int pd|dividend/]
  ];
  function guessCat(text, kind) {
    var s = String(text || '').toLowerCase().trim(); if (!s) return '';
    var all = catsOfKind(kind);
    for (var i = 0; i < all.length; i++) {
      var c = all[i], names = [catName(c).toLowerCase(), c.id];
      if (BMAP[c.id]) { var en = (window.APP_STRINGS.en || {})['c_' + c.id]; if (en) names.push(en.toLowerCase()); }
      if (names.indexOf(s) >= 0) return c.id;
    }
    for (var j = 0; j < KW.length; j++) if (KW[j][1].test(s) && BMAP[KW[j][0]].k === kind) return KW[j][0];
    return '';
  }
  function guessMode(text) {
    var s = String(text || '').toLowerCase(); if (!s) return '';
    for (var i = 0; i < MODES.length; i++) if (s === modeName(MODES[i]).toLowerCase() || s === MODES[i]) return MODES[i];
    if (/upi|gpay|google pay|phonepe|paytm|bhim|@/.test(s)) return 'upi';
    if (/\batm\b|cash|nwd/.test(s)) return 'cash';
    if (/\bpos\b|card|visa|rupay|mastercard|debit card|credit card/.test(s)) return 'card';
    if (/neft|imps|rtgs|net ?banking|ach|nach|ecs|inb|bank transfer/.test(s)) return 'net';
    return '';
  }
  function isIncomeWord(s) {
    s = String(s || '').toLowerCase().trim();
    return s === t('kind_inc').toLowerCase() || /^(income|credit|cr|deposit|received|in)$/.test(s);
  }
  var FIELDS = [
    ['date', 'imp_date', /date|dt\b|तारीख|दिनांक/i], ['amount', 'imp_amount', /^amount|amt|राशि|रक़म|रकम/i], ['debit', 'imp_debit', /debit|withdraw|paid out|\bdr\b/i],
    ['credit', 'imp_credit', /credit|deposit|paid in|\bcr\b/i], ['note', 'imp_note', /narration|description|particular|remark|note|details|naration|info/i],
    ['cat', 'imp_cat', /categor/i], ['mode', 'imp_mode', /mode|method|channel/i], ['type', 'imp_type', /^type|kind|dr\/cr|cr\/dr/i]
  ];
  function guessMap(head) {
    var map = {}, used = {}, mine = csvHeader().map(function (h) { return h.toLowerCase(); });
    var mineKeys = ['date', 'type', 'cat', 'amount', 'mode', 'who', 'note'];
    head.forEach(function (h, i) { var j = mine.indexOf(String(h).trim().toLowerCase()); if (j >= 0 && map[mineKeys[j]] === undefined) { map[mineKeys[j]] = i; used[i] = 1; } });
    FIELDS.forEach(function (f) {
      if (map[f[0]] !== undefined) return;
      for (var i = 0; i < head.length; i++) if (!used[i] && f[2].test(String(head[i]).trim())) { map[f[0]] = i; used[i] = 1; break; }
    });
    if (map.who === undefined) head.forEach(function (h, i) { if (!used[i] && /^(person|member|who|spent by)$/i.test(String(h).trim())) { map.who = i; used[i] = 1; } });
    return map;
  }
  $('#csv-imp').addEventListener('click', function () {
    EDU.pickFile('.csv,.tsv,.txt,text/csv,text/plain').then(function (f) {
      if (!f) return;
      if (f.size > 20 * 1024 * 1024) { EDU.toast(t('imp_bad'), 4000); return; }
      return EDU.readText(f).then(function (txt) {
        var rows = EDU.csv.parse(txt);
        if (!rows.length) { EDU.toast(t('imp_bad'), 4000); return; }
        /* bank statements often have a few title lines before the real header: start at the first row with 3+ cells */
        var start = 0; while (start < rows.length - 1 && start < 30 && rows[start].filter(function (c) { return String(c).trim(); }).length < 3) start++;
        importModal(rows.slice(start, start + 50001));
      });
    }).catch(function () { EDU.toast(t('imp_bad'), 4000); });
  });
  function importModal(rows) {
    var close, ncol = rows.reduce(function (a, r) { return Math.max(a, r.length); }, 0);
    var map = guessMap(rows[0]), hasHead = Object.keys(map).length >= 2;
    var opts = { head: hasHead, fmt: 'auto', defMode: 'upi', posInc: false, dups: true };
    var box = el('div', { class: 'stack' });
    function colSelect(key) {
      var s = el('select', { id: 'imp-' + key });
      s.appendChild(el('option', { value: '', text: t('imp_none') }));
      for (var i = 0; i < ncol; i++) {
        var lbl = opts.head ? String(rows[0][i] || '').slice(0, 30) : '';
        s.appendChild(el('option', { value: String(i), text: t('imp_col', { n: i + 1 }) + (lbl ? ': ' + lbl : ''), class: 'no-i18n' }));
      }
      s.value = map[key] === undefined ? '' : String(map[key]);
      s.addEventListener('change', function () { if (s.value === '') delete map[key]; else map[key] = +s.value; preview(); });
      return s;
    }
    var prevBox = el('div', { class: 'prev-wrap' }), summary = el('p', { class: 'small mb0', 'aria-live': 'polite' }), goBtn;
    function convert(limit) {
      var out = [], bad = 0, body = rows.slice(opts.head ? 1 : 0);
      for (var i = 0; i < body.length && (!limit || out.length + bad < limit); i++) {
        var r = body[i], get = function (k) { return map[k] === undefined ? '' : String(r[map[k]] == null ? '' : r[map[k]]).trim(); };
        var d = parseAnyDate(get('date'), opts.fmt), k = 'e', p = 0;
        if (map.debit !== undefined || map.credit !== undefined) {
          var dv = parseSigned(get('debit')), cv = parseSigned(get('credit'));
          if (dv) { p = Math.abs(dv); k = 'e'; } else if (cv) { p = Math.abs(cv); k = 'i'; }
        } else {
          var av = parseSigned(get('amount'));
          if (av) {
            p = Math.abs(av);
            if (map.type !== undefined) k = isIncomeWord(get('type')) ? 'i' : 'e';
            else if (opts.posInc) k = av > 0 ? 'i' : 'e';
            else k = av < 0 ? 'e' : 'e';
          }
        }
        if (!d || !(p > 0) || p > MAX_PAISE) { bad++; continue; }
        var note = get('note').replace(/\s+/g, ' ').slice(0, 120);
        var c = guessCat(get('cat'), k) || guessCat(note, k) || (k === 'i' ? 'otherin' : 'other');
        var m = guessMode(get('mode')) || guessMode(note) || opts.defMode;
        var who = '', wn = get('who').toLowerCase();
        if (wn) D.mem.forEach(function (mm) { if (mm.name.toLowerCase() === wn) who = mm.id; });
        out.push({ k: k, p: p, c: c, m: m, d: d, n: note, w: who });
      }
      return { out: out, bad: bad };
    }
    function preview() {
      var r = convert(6);
      prevBox.textContent = '';
      var tb = el('tbody');
      r.out.slice(0, 5).forEach(function (x) {
        tb.appendChild(el('tr', {}, el('td', { text: dmy(x.d) }), el('td', { text: x.k === 'i' ? t('kind_inc') : t('kind_exp') }), el('td', { text: catName(catById(x.c)) }),
          el('td', { class: 'n' }, numSpan(money(x.p))), el('td', { text: modeName(x.m) }), el('td', { class: 'no-i18n', text: x.n.slice(0, 40) })));
      });
      prevBox.appendChild(el('table', { class: 'tbl' }, el('thead', {}, el('tr', {}, el('th', { text: t('date') }), el('th', { text: t('kind') }), el('th', { text: t('category') }), el('th', { class: 'n', text: t('amount_plain') }), el('th', { text: t('mode_label') }), el('th', { text: t('note') }))), tb));
      var all = convert(0);
      summary.textContent = all.out.length ? t('imp_ready', { n: EDU.fmt(all.out.length), s: EDU.fmt(all.bad) }) : t('imp_err_none');
      goBtn.disabled = !all.out.length;
    }
    function draw() {
      box.textContent = '';
      box.appendChild(el('p', { class: 'small muted mb0', text: t('imp_help') }));
      var head = el('input', { type: 'checkbox', id: 'imp-head' }); head.checked = opts.head;
      head.addEventListener('change', function () { opts.head = head.checked; draw(); });
      box.appendChild(el('label', { class: 'check' }, head, el('span', { text: t('imp_header') })));
      var g = el('div', { class: 'map-grid' });
      FIELDS.concat([['who', 'who']]).forEach(function (f) { g.appendChild(el('label', { class: 'field' }, el('span', { text: t(f[1]) }), colSelect(f[0]))); });
      var fmtSel = el('select', { id: 'imp-fmt' });
      [['auto', 'df_auto'], ['dmy', 'df_dmy'], ['mdy', 'df_mdy'], ['ymd', 'df_ymd']].forEach(function (o) { fmtSel.appendChild(el('option', { value: o[0], text: t(o[1]) })); });
      fmtSel.value = opts.fmt; fmtSel.addEventListener('change', function () { opts.fmt = fmtSel.value; preview(); });
      g.appendChild(el('label', { class: 'field' }, el('span', { text: t('imp_datefmt') }), fmtSel));
      var dm = el('select', { id: 'imp-defmode' });
      MODES.forEach(function (m) { dm.appendChild(el('option', { value: m, text: modeName(m) })); });
      dm.value = opts.defMode; dm.addEventListener('change', function () { opts.defMode = dm.value; preview(); });
      g.appendChild(el('label', { class: 'field' }, el('span', { text: t('imp_defmode') }), dm));
      box.appendChild(g);
      var pos = el('input', { type: 'checkbox', id: 'imp-pos' }); pos.checked = opts.posInc;
      pos.addEventListener('change', function () { opts.posInc = pos.checked; preview(); });
      box.appendChild(el('label', { class: 'check' }, pos, el('span', { text: t('imp_pos_inc') })));
      var dups = el('input', { type: 'checkbox', id: 'imp-dups' }); dups.checked = opts.dups;
      dups.addEventListener('change', function () { opts.dups = dups.checked; });
      box.appendChild(el('label', { class: 'check' }, dups, el('span', { text: t('imp_dups') })));
      box.appendChild(el('h3', { class: 'mb0', text: t('imp_preview') }));
      box.appendChild(prevBox); box.appendChild(summary);
      goBtn = el('button', { type: 'button', class: 'btn btn-primary', id: 'imp-go', text: t('import'), onclick: doImport });
      box.appendChild(el('div', { class: 'row' }, goBtn, el('button', { type: 'button', class: 'btn', text: t('cancel'), onclick: function () { close(); } })));
      preview();
    }
    function doImport() {
      var r = convert(0), seen = {}, added = 0, skipped = r.bad, now = Date.now();
      if (opts.dups) D.tx.forEach(function (x) { seen[x.d + '|' + x.k + '|' + x.p + '|' + txNote(x).toLowerCase()] = 1; });
      if (r.out.length && hasSamples()) removeSamples();
      r.out.forEach(function (x, i) {
        var key = x.d + '|' + x.k + '|' + x.p + '|' + x.n.toLowerCase();
        if (opts.dups && seen[key]) { skipped++; return; }
        seen[key] = 1; x.id = uid(); x.cr = now + i; D.tx.push(x); added++;
      });
      save(['tx']);
      if (!saveOk) EDU.toast(t('save_failed'), 6000);
      close();
      var last = r.out.length ? r.out.map(function (x) { return x.d; }).sort().pop() : '';
      if (last) ui.ym = ymOf(last);
      renderAll();
      EDU.toast(t('imp_done', { n: EDU.fmt(added), s: EDU.fmt(skipped) }), 5000);
    }
    close = EDU.modal(box, { title: t('imp_title') });
    draw();
  }

  /* ---------------- backup / restore (plain or passcode-encrypted) ---------------- */
  function payload() { return { app: SLUG, version: 1, saved: new Date().toISOString(), tx: D.tx, cats: D.cats, mem: D.mem, bud: D.bud, rec: D.rec }; }
  function markBackedUp() { D.meta.lastBackup = Date.now(); D.meta.changed = false; store.set('meta', D.meta); renderData(); EDU.toast(t('bk_done')); }
  $('#bk-json').addEventListener('click', function () { EDU.download('expense-tracker-backup-' + todayStr() + '.json', JSON.stringify(payload()), 'application/json'); markBackedUp(); });
  var subtle = (window.crypto && window.crypto.subtle) || null;
  function b64(bytes) { var s = '', CH = 0x8000; for (var i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH)); return btoa(s); }
  function unb64(s) { var bin = atob(String(s || '')), out = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
  function rnd(n) { var a = new Uint8Array(n); window.crypto.getRandomValues(a); return a; }
  function deriveKey(pass, salt, iter) {
    return subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']).then(function (k) {
      return subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: iter, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    });
  }
  function encrypt(obj, pass) {
    var salt = rnd(16), iv = rnd(12);
    return deriveKey(pass, salt, PBKDF2_ITER).then(function (key) { return subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(JSON.stringify(obj))); })
      .then(function (buf) { return { app: SLUG, version: 1, enc: 1, saved: new Date().toISOString(), kdf: { name: 'PBKDF2', hash: 'SHA-256', iter: PBKDF2_ITER, salt: b64(salt) }, cipher: 'AES-GCM-256', iv: b64(iv), data: b64(new Uint8Array(buf)) }; });
  }
  function decrypt(file, pass) {
    var iter = +(file.kdf && file.kdf.iter) || PBKDF2_ITER; if (iter > 5000000 || iter < 1000) iter = PBKDF2_ITER;
    return deriveKey(pass, unb64(file.kdf && file.kdf.salt), iter).then(function (key) { return subtle.decrypt({ name: 'AES-GCM', iv: unb64(file.iv) }, key, unb64(file.data)); })
      .then(function (buf) { return JSON.parse(new TextDecoder().decode(buf)); });
  }
  function askPass(hintKey, minLen) {
    return new Promise(function (resolve) {
      var done = false, close;
      var inp = el('input', { type: 'password', id: 'pp-input', class: 'no-i18n', dir: 'ltr', autocomplete: 'new-password', maxlength: '200' });
      var err = el('p', { class: 'err', 'aria-live': 'polite' });
      var f = el('form', { class: 'stack' }, el('p', { class: 'small muted mb0', text: t(hintKey) }), el('label', { class: 'field' }, el('span', { text: t('pp_ph') }), inp), err,
        el('div', { class: 'row' }, el('button', { type: 'submit', class: 'btn btn-primary', id: 'pp-ok', text: t('done') }), el('button', { type: 'button', class: 'btn', text: t('cancel'), onclick: function () { close(); } })));
      f.addEventListener('submit', function (ev) {
        ev.preventDefault();
        if (minLen && inp.value.length < minLen) { err.textContent = t('pp_short'); inp.focus(); return; }
        done = true; var v = inp.value; close(); resolve(v);
      });
      close = EDU.modal(f, { title: t('pp_title'), onClose: function () { if (!done) resolve(null); } });
      setTimeout(function () { inp.focus(); }, 30);
    });
  }
  $('#bk-enc').addEventListener('click', function () {
    if (!subtle) { EDU.toast(t('pp_unsupported'), 5000); return; }
    askPass('pp_set_hint', 8).then(function (pass) {
      if (!pass) return;
      return encrypt(payload(), pass).then(function (file) {
        EDU.download('expense-tracker-backup-' + todayStr() + '.locked.json', JSON.stringify(file), 'application/json'); markBackedUp();
      });
    }).catch(function () { EDU.toast(t('pp_unsupported'), 5000); });
  });
  function restoreFrom(obj) {
    if (!obj || obj.app !== SLUG || !Array.isArray(obj.tx)) { EDU.toast(t('restore_bad'), 4000); return; }
    var c = cleanAll(obj);
    if (!confirm(t('confirm_restore', { n: EDU.fmt(c.tx.length) }))) return;
    D.tx = c.tx; D.cats = c.cats; D.mem = c.mem; D.bud = c.bud; D.rec = c.rec;
    D.meta.sampleBud = false; D.meta.seeded = true; D.meta.lastBackup = D.meta.lastBackup || Date.now();
    save(); runRecurring(); ui.edit = null;
    renderAll();
    EDU.toast(t('restore_ok', { n: EDU.fmt(D.tx.length) }), 4000);
  }
  $('#bk-restore').addEventListener('click', function () {
    EDU.pickFile('.json,application/json').then(function (f) {
      if (!f) return;
      return EDU.readText(f).then(function (txt) {
        var obj = null; try { obj = JSON.parse(String(txt).replace(/^﻿/, '')); } catch (e) { obj = null; }
        if (obj && obj.enc) {
          if (!subtle) { EDU.toast(t('pp_unsupported'), 5000); return; }
          return askPass('pp_open_hint', 0).then(function (pass) {
            if (pass === null) return;
            return decrypt(obj, pass).then(restoreFrom, function () { EDU.toast(t('pp_wrong'), 4000); });
          });
        }
        restoreFrom(obj);
      });
    }).catch(function () { EDU.toast(t('restore_bad'), 4000); });
  });

  /* ---------------- data tab: members, categories, storage, reset ---------------- */
  function renderData() {
    var lb = D.meta.lastBackup;
    $('#bk-last').textContent = lb ? t('last_bk', { d: dmy(ymd(new Date(lb))) }) : t('never_bk');
    var ml = $('#mem-list'); ml.textContent = '';
    D.mem.forEach(function (m) {
      ml.appendChild(el('button', { type: 'button', class: 'chip', 'data-id': m.id, 'aria-label': t('mem_remove', { name: m.name }) }, el('span', { text: m.name }), el('span', { class: 'x', 'aria-hidden': 'true', text: '✕' })));
    });
    if (!D.mem.length) ml.appendChild(el('span', { class: 'muted small', 'data-i18n': 'none_yet', text: t('none_yet') }));
    ml.classList.toggle('no-i18n', D.mem.length > 0);
    var cl = $('#cat-list'); cl.textContent = '';
    D.cats.forEach(function (c) {
      cl.appendChild(el('button', { type: 'button', class: 'chip', 'data-id': c.id, 'aria-label': t('cat_remove', { name: c.name }) },
        el('span', { 'aria-hidden': 'true', text: c.e }), el('span', { class: 'no-i18n', text: c.name + ' (' + (c.k === 'i' ? t('kind_inc') : t('kind_exp')) + ')' }), el('span', { class: 'x', 'aria-hidden': 'true', text: '✕' })));
    });
    if (!D.cats.length) cl.appendChild(el('span', { class: 'muted small', text: t('none_yet') }));
    var used = 0; ['tx', 'cats', 'mem', 'bud', 'rec', 'meta'].forEach(function (k) { try { used += JSON.stringify(D[k]).length; } catch (e) { } });
    var p = Math.min(100, used / STORE_LIMIT * 100);
    $('#store-bar span').style.width = Math.max(1, p) + '%';
    $('#store-bar').setAttribute('aria-valuenow', String(Math.round(p)));
    $('#store-txt').textContent = t('store_used', { pct: fmtPct(p), n: EDU.fmt(D.tx.length) });
  }
  $('#mem-form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var n = str($('#mem-name').value, 30); if (!n) { $('#mem-name').focus(); return; }
    if (D.mem.some(function (m) { return m.name.toLowerCase() === n.toLowerCase(); })) { $('#mem-name').value = ''; return; }
    if (D.mem.length >= 20) return;
    D.mem.push({ id: 'm' + uid(), name: n }); save(['mem']); $('#mem-name').value = ''; renderData(); EDU.toast(t('mem_added', { name: n }));
  });
  $('#mem-list').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-id]'); if (!b) return;
    var id = b.getAttribute('data-id'), name = memName(id);
    if (!confirm(t('mem_remove_q', { name: name }))) return;
    D.mem = D.mem.filter(function (m) { return m.id !== id; });
    D.tx.forEach(function (x) { if (x.w === id) x.w = ''; }); D.rec.forEach(function (r) { if (r.w === id) r.w = ''; });
    save(['mem', 'tx', 'rec']); renderData();
  });
  $('#cat-new').addEventListener('click', function () { newCatModal('e', null); });
  $('#cat-list').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-id]'); if (!b) return;
    var c = catById(b.getAttribute('data-id')); if (!c) return;
    if (!confirm(t('cat_remove_q', { name: c.name }))) return;
    var fb = c.k === 'i' ? 'otherin' : 'other';
    D.tx.forEach(function (x) { if (x.c === c.id) x.c = fb; }); D.rec.forEach(function (r) { if (r.c === c.id) r.c = fb; });
    delete D.bud.cats[c.id];
    D.cats = D.cats.filter(function (x) { return x !== c; });
    save(); renderAll();
  });
  $('#reset-all').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    D.tx = []; D.cats = []; D.mem = []; D.rec = []; D.bud = { total: 0, cats: {}, carry: false, start: '' };
    D.meta = { seeded: true }; ui.edit = null; ui.ym = ymOf(todayStr());
    save(); renderAll(); EDU.toast(t('reset_done'));
  });
  $('#sample-remove').addEventListener('click', function () { removeSamples(); renderAll(); });

  /* ---------------- start ---------------- */
  load();
  var addedNow = runRecurring();
  if (addedNow) setTimeout(function () { EDU.toast(t('rv_text', { n: EDU.fmt(addedNow) }), 4500); }, 400);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && runRecurring()) renderAll();
  });
  window.addEventListener('storage', function (e) { if (e.key && e.key.indexOf('edu.' + SLUG + '.') === 0) { load(); idxVer++; renderAll(); } });
  EDU.onLang(function () { renderAll(); });
  setTab('add');
  renderAll();
})();
