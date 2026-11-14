/* Shagun Register: a private family gift book for weddings, birthdays, griha pravesh, naming ceremonies and other functions.

   Data (EDU.store('shagun-register'), never sent anywhere):
     events:  [{ id, name, nk, date:'YYYY-MM-DD'|'', kind, dir:'ours'|'theirs', host, place, sample }]
              dir 'ours'   = our function: each entry is a gift we received
              dir 'theirs' = someone else's function: each entry is a gift we gave
     entries: [{ id, eid, name, nk, city, ck, phone, side, gift:'cash'|'gold'|'silver'|'other', amt (paise), wt (grams × 100), desc, dk, created }]
     sides:   custom side names typed by the family (built-in sides are keys)
   Sample data stores string keys (nk/ck/dk) so it follows the page language; it is cleared on the first edit. */
(function () {
  'use strict';
  var SLUG = 'shagun-register';
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$;

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  var MAX_AMT = 1000000000 * 10;  /* ₹10,00,00,000 */
  var MAX_WT = 1000000;           /* 10 kg */
  var KINDS = ['wedding', 'engage', 'birthday', 'griha', 'naming', 'anniv', 'other'];
  var SIDES = ['bride', 'groom', 'family', 'friends', 'office', 'neigh', 'other'];
  var GIFTS = ['cash', 'gold', 'silver', 'other'];
  var QUICK = [101, 201, 251, 501, 1001, 1100, 2100, 5100, 11000];
  var ID_RE = /^[a-z0-9]{4,24}$/;

  /* ---------------- helpers ---------------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function todayStr() { var n = new Date(); return n.getFullYear() + '-' + pad(n.getMonth() + 1) + '-' + pad(n.getDate()); }
  function addDays(s, k) { var p = s.split('-'); var d = new Date(+p[0], +p[1] - 1, +p[2] + k); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function okDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof s === 'string' ? s : '');
    if (!m) return false;
    var y = +m[1], mo = +m[2], d = +m[3];
    return y >= 1900 && y <= 2200 && mo >= 1 && mo <= 12 && d >= 1 && d <= new Date(y, mo, 0).getDate();
  }
  function iso(s) { return EDU.langInfo(EDU.lang).dir === 'rtl' ? '⁦' + s + '⁩' : s; }
  /* 05/12/2026: slashes never break across lines inside a sentence (hyphens can) */
  function dmy(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? iso(m[3] + '/' + m[2] + '/' + m[1]) : ''; }
  var uidN = 0;
  function uid() { return Date.now().toString(36).slice(-6) + Math.random().toString(36).slice(2, 7) + (uidN++).toString(36); }
  function str(x, max) { return (typeof x === 'string' ? x : typeof x === 'number' && isFinite(x) ? String(x) : '').replace(/\s+/g, ' ').trim().slice(0, max || 60); }
  function int(x, lo, hi, d) { if (x === null || x === '' || typeof x === 'boolean') return d; var n = Math.round(+x); return isFinite(n) && n >= lo && n <= hi ? n : d; }
  function groupIn(n) { var s = String(n); if (s.length <= 3) return s; return s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3); }
  function money(p) { var a = Math.abs(p), ps = a % 100; return iso((p < 0 ? '−' : '') + '₹' + groupIn(Math.floor(a / 100)) + (ps ? '.' + pad(ps) : '')); }
  function plainRs(p) { return Math.floor(p / 100) + '.' + pad(p % 100); }
  /* number then unit in the reading order of the language ("4 g", Urdu "4 گرام" read right to left) */
  function grams(h) { return (h / 100).toFixed(2).replace(/\.?0+$/, '') + ' ' + t('u_g'); }
  function numSpan(s) { return el('span', { class: 'num', text: s }); }
  var DIGIT_BASES = [0x966, 0x9E6, 0xA66, 0xAE6, 0xB66, 0xBE6, 0xC66, 0xCE6, 0xD66, 0x660, 0x6F0];
  function asciiDigits(s) {
    return String(s == null ? '' : s).replace(/[०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯٠-٩۰-۹]/g, function (c) {
      var x = c.charCodeAt(0);
      for (var i = 0; i < DIGIT_BASES.length; i++) if (x >= DIGIT_BASES[i] && x <= DIGIT_BASES[i] + 9) return String(x - DIGIT_BASES[i]);
      return c;
    });
  }
  /* "₹1,100" / "1100.50" / "5100/-" → hundredths. {empty} | {v} | {err: key}; never negative */
  function parseHund(raw, max) {
    var s = asciiDigits(raw).trim().replace(/^(rs\.?|inr)/i, '').replace(/[₹,\s]/g, '').replace(/\/-$/, '').replace(/[−–]/g, '-');
    if (s === '') return { empty: true };
    if (s[0] === '-') return { err: 'err_neg' };
    var m = /^\+?(\d*)(?:\.(\d*))?$/.exec(s);
    if (!m || (m[1] === '' && !m[2])) return { err: 'err_num' };
    if (m[2] && m[2].length > 2) return { err: 'err_dec' };
    if (m[1].length > 12) return { err: 'err_big' };
    var v = (+(m[1] || '0')) * 100 + (+((m[2] || '') + '00').slice(0, 2));
    if (v > max) return { err: 'err_big' };
    return { v: v };
  }
  function phoneDigits(s) { return asciiDigits(s).replace(/\D/g, ''); }
  function normName(s) { return String(s || '').toLowerCase().replace(/[.,'’"()\-_/]/g, ' ').replace(/\s+/g, ' ').trim(); }

  /* ---------------- data ---------------- */
  function blank() { return { v: 1, events: [], entries: [], sides: [], cur: '', started: true }; }
  function cleanEvent(x, seen) {
    if (!x || typeof x !== 'object') return null;
    var sample = x.sample === true && (x.nk === 1 || x.nk === 2);
    var name = str(x.name, 80);
    if (!name && !sample) return null;
    var id = typeof x.id === 'string' && ID_RE.test(x.id) && !seen[x.id] ? x.id : uid();
    seen[id] = 1;
    return { id: id, name: sample ? '' : name, nk: sample ? x.nk : 0, date: okDate(x.date) ? x.date : '', kind: KINDS.indexOf(x.kind) >= 0 ? x.kind : 'other',
      dir: x.dir === 'theirs' ? 'theirs' : 'ours', host: str(x.host, 60), hk: sample && x.hk === 1 ? 1 : 0, place: str(x.place, 40), sample: sample };
  }
  function cleanEntry(x, eids, seen, sides) {
    if (!x || typeof x !== 'object' || typeof x.eid !== 'string' || !eids[x.eid]) return null;
    var id = typeof x.id === 'string' && ID_RE.test(x.id) && !seen[x.id] ? x.id : uid();
    seen[id] = 1;
    var sample = eids[x.eid] === 2;
    var gift = GIFTS.indexOf(x.gift) >= 0 ? x.gift : 'cash';
    var side = typeof x.side === 'string' && (SIDES.indexOf(x.side) >= 0 || sides.indexOf(x.side) >= 0) ? x.side : 'other';
    var e = { id: id, eid: x.eid, name: str(x.name, 60), nk: sample ? int(x.nk, 0, 9, 0) : 0, city: str(x.city, 40), ck: sample ? int(x.ck, 0, 9, 0) : 0,
      phone: str(x.phone, 20).replace(/[^\d+\-\s()]/g, ''), side: side, gift: gift, amt: int(x.amt, 0, MAX_AMT, 0), wt: gift === 'gold' || gift === 'silver' ? int(x.wt, 0, MAX_WT, 0) : 0,
      desc: str(x.desc, 60), dk: sample ? int(x.dk, 0, 9, 0) : 0, created: int(x.created, 0, 9e15, Date.now()) };
    if (gift === 'cash' && !e.amt) return null;
    return e;
  }
  function cleanData(x) {
    var D = blank();
    if (!x || typeof x !== 'object') return D;
    D.sides = (Array.isArray(x.sides) ? x.sides : []).map(function (s) { return str(s, 30); }).filter(function (s, i, a) { return s && SIDES.indexOf(s) < 0 && a.indexOf(s) === i; }).slice(0, 40);
    var seen = Object.create(null), eids = Object.create(null);
    D.events = (Array.isArray(x.events) ? x.events : []).slice(0, 500).map(function (e) { return cleanEvent(e, seen); }).filter(Boolean);
    D.events.forEach(function (e) { eids[e.id] = e.sample ? 2 : 1; });
    var seenE = Object.create(null);
    D.entries = (Array.isArray(x.entries) ? x.entries : []).slice(0, 50000).map(function (e) { return cleanEntry(e, eids, seenE, D.sides); }).filter(Boolean);
    D.cur = typeof x.cur === 'string' && eids[x.cur] ? x.cur : (D.events[0] ? D.events[0].id : '');
    D.started = x.started !== false;
    return D;
  }
  /* clearly fictional example: one of our weddings and one function we attended */
  function sampleData() {
    var D = blank(), T = todayStr(), now = Date.now();
    D.started = false;
    var a = { id: uid(), name: '', nk: 1, date: addDays(T, -12), kind: 'wedding', dir: 'ours', host: '', hk: 0, place: '', sample: true };
    var b = { id: uid(), name: '', nk: 2, date: addDays(T, -200), kind: 'griha', dir: 'theirs', host: '', hk: 1, place: '', sample: true };
    D.events = [a, b];
    function E(ev, nk, ck, side, gift, rs, wt, dk, i) {
      return { id: uid(), eid: ev.id, name: '', nk: nk, city: '', ck: ck, phone: '', side: side, gift: gift, amt: rs * 100, wt: wt * 100, desc: '', dk: dk, created: now - 100000 + i };
    }
    D.entries = [
      E(a, 1, 1, 'bride', 'cash', 5100, 0, 0, 1),
      E(a, 2, 2, 'groom', 'cash', 2100, 0, 0, 2),
      E(a, 3, 3, 'friends', 'cash', 1100, 0, 0, 3),
      E(a, 4, 4, 'office', 'other', 4500, 0, 4, 4),
      E(a, 5, 5, 'bride', 'gold', 0, 4, 5, 5),
      E(a, 6, 0, 'neigh', 'silver', 0, 10, 6, 6),
      E(a, 0, 0, 'groom', 'cash', 501, 0, 0, 7),
      E(b, 3, 3, 'friends', 'cash', 2100, 0, 0, 8)
    ];
    D.cur = a.id;
    return D;
  }
  var data = (function () { var raw = store.get('data', null); return raw ? cleanData(raw) : sampleData(); })();
  function hasSample() { return data.events.some(function (e) { return e.sample; }); }

  var ui = { edit: null, gift: 'cash', q: '', side: '', fgift: '', sort: 'order', quick: false, qside: '', lq: '' };

  function save() { idx = null; if (!store.set('data', data)) EDU.toast(t('save_fail'), 5000); }
  function clearSample(quiet) {
    if (!hasSample()) { data.started = true; return false; }
    data = blank(); ui.edit = null; ui.quick = false;
    save();
    if (!quiet) EDU.toast(t('sample_cleared'), 4000);
    renderAll();
    return true;
  }

  /* ---------------- names and labels ---------------- */
  function evById(id) { for (var i = 0; i < data.events.length; i++) if (data.events[i].id === id) return data.events[i]; return null; }
  function curEv() { return evById(data.cur); }
  function evName(e) { return e.nk ? t('sample_ev' + e.nk) : e.name; }
  function evHost(e) { return e.hk ? t('sample_g3') : e.host; }
  function enName(e) { return e.nk ? t('sample_g' + e.nk) : e.name; }
  function enShown(e) { return enName(e) || t('no_name'); }
  function enCity(e) { return e.ck ? t('sample_c' + e.ck) : e.city; }
  function enDesc(e) { return e.dk ? t('sample_d' + e.dk) : e.desc; }
  function sideLabel(s) { return SIDES.indexOf(s) >= 0 ? t('side_' + s) : s; }
  function allSides() { return SIDES.concat(data.sides); }
  function entriesOf(eid) { return data.entries.filter(function (e) { return e.eid === eid; }); }
  function giftMain(e) {
    if (e.gift === 'cash') return money(e.amt);
    return t('g_' + e.gift);
  }
  function giftSub(e) {
    if (e.gift === 'cash') return '';
    var parts = [];
    if (enDesc(e)) parts.push(enDesc(e));
    if (e.wt) parts.push(grams(e.wt));
    if (e.amt) parts.push(money(e.amt));
    return parts.join(' · ');
  }
  function giftText(e) { var s = giftSub(e); return e.gift === 'cash' ? money(e.amt) : t('g_' + e.gift) + (s ? ': ' + s : ''); }
  function evLabel(e) { return evName(e) + (e.date ? ' · ' + dmy(e.date) : ''); }

  /* totals for one event */
  function totals(eid) {
    var T = { n: 0, cash: 0, cashN: 0, gold: 0, goldW: 0, goldV: 0, silver: 0, silverW: 0, silverV: 0, other: 0, otherV: 0, sides: {} };
    entriesOf(eid).forEach(function (e) {
      T.n++;
      var s = T.sides[e.side] = T.sides[e.side] || { n: 0, cash: 0, items: 0 };
      s.n++;
      if (e.gift === 'cash') { T.cash += e.amt; T.cashN++; s.cash += e.amt; }
      else {
        s.items++;
        if (e.gift === 'gold') { T.gold++; T.goldW += e.wt; T.goldV += e.amt; }
        else if (e.gift === 'silver') { T.silver++; T.silverW += e.wt; T.silverV += e.amt; }
        else { T.other++; T.otherV += e.amt; }
      }
    });
    return T;
  }
  function itemNote(w, v) { return [w ? grams(w) : '', v ? t('items_value', { amt: money(v) }) : ''].filter(Boolean).join(' · '); }
  /* other entries with the same name (or the same phone number) anywhere in the register; an index keeps big registers fast */
  var idx = null;
  function index() {
    if (idx) return idx;
    idx = { byName: Object.create(null), byPhone: Object.create(null) };
    data.entries.forEach(function (e) {
      var n = normName(enName(e)), p = phoneDigits(e.phone).slice(-10);
      if (n.length >= 2) (idx.byName[n] = idx.byName[n] || []).push(e);
      if (p.length >= 10) (idx.byPhone[p] = idx.byPhone[p] || []).push(e);
    });
    return idx;
  }
  function historyFor(name, phone, exceptId) {
    var n = normName(name), p = phoneDigits(phone).slice(-10), I = index(), out = [], seen = {};
    function add(list) { (list || []).forEach(function (e) { if (e.id !== exceptId && !seen[e.id]) { seen[e.id] = 1; out.push(e); } }); }
    if (n.length >= 2) add(I.byName[n]);
    if (p.length >= 10) add(I.byPhone[p]);
    return out;
  }
  function histLine(e) {
    var ev = evById(e.eid);
    return t(ev && ev.dir === 'theirs' ? 'h_we_gave' : 'h_they_gave', { gift: giftText(e), event: ev ? evLabel(ev) : '' });
  }

  /* ---------------- rendering ---------------- */
  function renderEvents() {
    var has = data.events.length > 0;
    $('#noEvents').hidden = has; $('#evBox').hidden = !has;
    var sel = $('#evSel'); sel.innerHTML = '';
    var evs = data.events.slice().sort(function (a, b) { return (b.date || '') < (a.date || '') ? -1 : (b.date || '') > (a.date || '') ? 1 : 0; });
    evs.forEach(function (e) { sel.appendChild(el('option', { value: e.id, text: evLabel(e) })); });
    if (!curEv() && data.events.length) data.cur = evs[0].id;
    sel.value = data.cur;
    var ev = curEv();
    if (ev) {
      var meta = [t('k_' + ev.kind), t(ev.dir === 'ours' ? 'dir_ours' : 'dir_theirs')];
      if (ev.dir === 'theirs' && evHost(ev)) meta.push(t('host_is', { host: evHost(ev) }));
      if (ev.place) meta.push(ev.place);
      $('#evMeta').textContent = meta.join(' · ');
    }
    var tb = $('#evAll'); tb.innerHTML = '';
    tb.appendChild(el('thead', null, el('tr', null, el('th', { text: t('c_event') }), el('th', { text: t('c_date') }), el('th', { class: 'a', text: t('t_entries') }), el('th', { class: 'a', text: t('t_cash') }))));
    var body = el('tbody');
    evs.forEach(function (e) {
      var T = totals(e.id);
      body.appendChild(el('tr', { class: e.id === data.cur ? 'cur' : '' },
        el('td', null, el('button', { type: 'button', class: 'link no-i18n', text: evName(e), onclick: function () { data.cur = e.id; ui.edit = null; save(); renderAll(); } }),
          el('div', { class: 'tiny muted', text: t(e.dir === 'ours' ? 'dir_ours_s' : 'dir_theirs_s') })),
        el('td', null, numSpan(e.date ? dmy(e.date) : '–')), el('td', { class: 'a' }, numSpan(String(T.n))), el('td', { class: 'a' }, numSpan(money(T.cash)))));
    });
    tb.appendChild(body);
  }
  function renderTotals() {
    var ev = curEv();
    $('#totCard').hidden = !ev;
    if (!ev) return;
    var T = totals(ev.id);
    $('#totHead').textContent = t(ev.dir === 'ours' ? 'tot_ours' : 'tot_theirs');
    $('#tCash').textContent = money(T.cash); $('#tCash').setAttribute('data-p', String(T.cash));
    $('#tCashN').textContent = t('n_envelopes', { n: T.cashN });
    $('#tCount').textContent = String(T.n); $('#tCount').setAttribute('data-n', String(T.n));
    $('#tGold').textContent = String(T.gold); $('#tGoldW').textContent = itemNote(T.goldW, T.goldV);
    $('#tGold').setAttribute('data-w', String(T.goldW));
    $('#tSilver').textContent = String(T.silver); $('#tSilverW').textContent = itemNote(T.silverW, T.silverV);
    $('#tSilver').setAttribute('data-w', String(T.silverW));
    $('#tOther').textContent = String(T.other); $('#tOtherV').textContent = itemNote(0, T.otherV);
    var tb = $('#tSides'); tb.innerHTML = '';
    var keys = allSides().filter(function (s) { return T.sides[s]; });
    if (!keys.length) return;
    /* three columns so it fits a phone: side (with the number of entries under it), cash, gifts */
    tb.appendChild(el('thead', null, el('tr', null, el('th', { text: t('f_side') }), el('th', { class: 'a', text: t('t_cash') }), el('th', { class: 'a', text: t('t_items') }))));
    var body = el('tbody');
    keys.forEach(function (s) {
      var x = T.sides[s];
      body.appendChild(el('tr', { 'data-side': s, 'data-n': String(x.n) }, el('td', null, el('span', { class: SIDES.indexOf(s) >= 0 ? '' : 'no-i18n', text: sideLabel(s) }), el('small', { text: t('n_entries', { n: x.n }) })),
        el('td', { class: 'a', 'data-p': String(x.cash) }, numSpan(money(x.cash))), el('td', { class: 'a' }, numSpan(String(x.items)))));
    });
    tb.appendChild(body);
    tb.appendChild(el('tfoot', null, el('tr', null, el('td', null, t('total'), el('small', { text: t('n_entries', { n: T.n }) })), el('td', { class: 'a' }, numSpan(money(T.cash))), el('td', { class: 'a' }, numSpan(String(T.gold + T.silver + T.other))))));
  }
  function fillSideSelect(sel, withAll, withNew) {
    var v = sel.value; sel.innerHTML = '';
    if (withAll) sel.appendChild(el('option', { value: '', text: t('all') }));
    SIDES.forEach(function (s) { sel.appendChild(el('option', { value: s, text: t('side_' + s) })); });
    data.sides.forEach(function (s) { sel.appendChild(el('option', { value: s, class: 'no-i18n', text: s })); });
    if (withNew) sel.appendChild(el('option', { value: '__new', text: t('side_new_opt') }));
    sel.value = v;
    if (sel.selectedIndex < 0) sel.selectedIndex = 0;
  }
  function renderForm() {
    var ev = curEv();
    $('#formCard').hidden = !ev || ui.quick;
    $('#quickCard').hidden = !ev || !ui.quick;
    if (!ev) return;
    var theirs = ev.dir === 'theirs';
    $('#formHead').textContent = t(ui.edit ? 'form_edit' : theirs ? 'form_add_theirs' : 'form_add_ours');
    $('#fNameLbl').textContent = t(theirs ? 'f_name_theirs' : 'f_name');
    $('#btnQuick').hidden = theirs;
    fillSideSelect($('#fSide'), false, true);
    $$('#fGift button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-g') === ui.gift)); });
    var cash = ui.gift === 'cash', metal = ui.gift === 'gold' || ui.gift === 'silver';
    $('#fAmtLbl').textContent = t(cash ? 'f_amount' : 'f_value');
    $('#fWtBox').hidden = !metal;
    $('#fDescBox').hidden = cash;
    $('#fDescLbl').textContent = t(ui.gift === 'other' ? 'f_desc_other' : 'f_desc_metal');
    $('#fDesc').placeholder = t(ui.gift === 'gold' ? 'ph_gold' : ui.gift === 'silver' ? 'ph_silver' : 'ph_other');
    $('#fSave').textContent = t(ui.edit ? 'save' : 'add_entry');
    $('#fCancel').hidden = !ui.edit; $('#fDel').hidden = !ui.edit;
    $('#fSideNewBox').hidden = $('#fSide').value !== '__new';
    renderHint();
    var dl = $('#knownNames'); dl.innerHTML = '';
    var seen = {};
    data.entries.forEach(function (e) { var n = enName(e); if (n && !seen[n.toLowerCase()]) { seen[n.toLowerCase()] = 1; dl.appendChild(el('option', { value: n })); } });
  }
  function renderHint() {
    var box = $('#fHint'), ev = curEv();
    var hist = ev ? historyFor($('#fName').value, $('#fPhone').value, ui.edit) : [];
    box.innerHTML = ''; box.hidden = !hist.length;
    if (!hist.length) return;
    var dup = hist.filter(function (e) { return e.eid === ev.id; });
    var other = hist.filter(function (e) { return e.eid !== ev.id; });
    box.className = 'hint-box' + (dup.length ? ' dup' : '');
    if (dup.length) box.appendChild(el('div', { text: t('hint_dup', { gift: giftText(dup[0]) }) }));
    if (other.length) {
      box.appendChild(el('b', { text: t('hint_before') }));
      var ul = el('ul');
      other.slice(0, 5).forEach(function (e) { ul.appendChild(el('li', { text: histLine(e) })); });
      box.appendChild(ul);
    }
  }
  function sortList(arr) {
    var by = ui.sort;
    var nm = function (e) { return enShown(e).toLowerCase(); };
    arr.sort(function (a, b) {
      if (by === 'name') return nm(a).localeCompare(nm(b)) || a.created - b.created;
      if (by === 'amt') return b.amt - a.amt || nm(a).localeCompare(nm(b));
      if (by === 'side') return allSides().indexOf(a.side) - allSides().indexOf(b.side) || a.created - b.created;
      return a.created - b.created;
    });
    return arr;
  }
  function renderList() {
    var ev = curEv();
    $('#listCard').hidden = !ev;
    if (!ev) return;
    fillSideSelect($('#rSide'), true, false); $('#rSide').value = ui.side; if ($('#rSide').selectedIndex < 0) { ui.side = ''; $('#rSide').value = ''; }
    var gs = $('#rGift'), gv = ui.fgift; gs.innerHTML = '';
    gs.appendChild(el('option', { value: '', text: t('all') }));
    GIFTS.forEach(function (g) { gs.appendChild(el('option', { value: g, text: t('g_' + g) })); });
    gs.value = gv;
    $('#rSort').value = ui.sort;
    var q = normName(ui.q), qd = phoneDigits(ui.q);
    var all = entriesOf(ev.id);
    var list = all.filter(function (e) {
      if (ui.side && e.side !== ui.side) return false;
      if (ui.fgift && e.gift !== ui.fgift) return false;
      if (!q) return true;
      var hay = normName(enShown(e) + ' ' + enCity(e) + ' ' + enDesc(e) + ' ' + sideLabel(e.side));
      return hay.indexOf(q) >= 0 || (qd.length >= 3 && phoneDigits(e.phone).indexOf(qd) >= 0);
    });
    sortList(list);
    var box = $('#rList'); box.innerHTML = '';
    var order = {}; all.slice().sort(function (a, b) { return a.created - b.created; }).forEach(function (e, i) { order[e.id] = i + 1; });
    list.forEach(function (e) {
      var sub = [enCity(e), sideLabel(e.side), e.phone].filter(Boolean).join(' · ');
      var hist = historyFor(enName(e), e.phone, e.id).filter(function (h) { return h.eid !== ev.id; });
      var row = el('button', { type: 'button', class: 'rrow' + (ui.edit === e.id ? ' editing' : ''), 'data-id': e.id, 'data-amt': String(e.amt) },
        el('span', null, el('span', { class: 'nm no-i18n', text: order[e.id] + '. ' + enShown(e) }), el('span', { class: 'sub no-i18n', text: sub })),
        el('span', { class: 'gift' }, numSpan(giftMain(e)), giftSub(e) ? el('small', { class: 'no-i18n', text: giftSub(e) }) : null),
        hist.length ? el('span', { class: 'hist', text: '↔ ' + histLine(hist[0]) + (hist.length > 1 ? ' (+' + (hist.length - 1) + ')' : '') }) : null);
      row.addEventListener('click', function () { startEdit(e.id); });
      box.appendChild(row);
    });
    $('#rCount').textContent = t('shown_of', { n: list.length, total: all.length });
    $('#rEmpty').hidden = list.length > 0;
    $('#rEmpty').textContent = all.length ? t('no_match') : t(ev.dir === 'ours' ? 'empty_ours' : 'empty_theirs');
  }
  function renderLookup() {
    var box = $('#lRes'); box.innerHTML = '';
    var q = normName(ui.lq), qd = phoneDigits(ui.lq);
    if (q.length < 2 && qd.length < 3) { box.appendChild(el('p', { class: 'muted small mb0', text: t('lookup_empty') })); return; }
    var groups = {}, order = [];
    data.entries.forEach(function (e) {
      var nm = enName(e); if (!nm) return;
      var hay = normName(nm + ' ' + enCity(e));
      if (!(hay.indexOf(q) >= 0 && q.length >= 2) && !(qd.length >= 3 && phoneDigits(e.phone).indexOf(qd) >= 0)) return;
      var k = normName(nm);
      if (!groups[k]) { groups[k] = { name: nm, cities: [], got: [], gave: [] }; order.push(k); }
      var g = groups[k], ev = evById(e.eid);
      if (enCity(e) && g.cities.indexOf(enCity(e)) < 0) g.cities.push(enCity(e));
      (ev && ev.dir === 'theirs' ? g.gave : g.got).push(e);
    });
    if (!order.length) { box.appendChild(el('p', { class: 'muted small mb0', text: t('lookup_none') })); return; }
    order.slice(0, 30).forEach(function (k) {
      var g = groups[k];
      function col(list, key, cls) {
        var cash = list.reduce(function (s, e) { return s + (e.gift === 'cash' ? e.amt : 0); }, 0);
        var ul = el('ul');
        list.forEach(function (e) { var ev = evById(e.eid); ul.appendChild(el('li', null, el('span', { class: 'no-i18n', text: giftText(e) + ' · ' + (ev ? evLabel(ev) : '') }))); });
        return el('div', null, el('div', { class: 'lbl ' + cls, text: t(key, { amt: money(cash), n: list.length }) }), list.length ? ul : el('div', { class: 'small muted', text: t('nothing_yet') }));
      }
      box.appendChild(el('div', { class: 'lgroup', 'data-name': k },
        el('h4', null, el('span', { class: 'no-i18n', text: g.name }), g.cities.length ? el('span', { class: 'small muted no-i18n', text: ' · ' + g.cities.join(', ') }) : null),
        el('div', { class: 'cols' }, col(g.got, 'l_they_gave', 'in'), col(g.gave, 'l_we_gave', 'out'))));
    });
  }
  function renderQuick() {
    var ev = curEv(); if (!ev || !ui.quick) return;
    var sides = $('#qSides'); sides.innerHTML = '';
    sides.appendChild(el('button', { type: 'button', class: 'chip', 'data-s': '', 'aria-pressed': String(ui.qside === ''), text: t('side_none'), onclick: function () { ui.qside = ''; renderQuick(); } }));
    allSides().forEach(function (s) {
      sides.appendChild(el('button', { type: 'button', class: 'chip' + (SIDES.indexOf(s) >= 0 ? '' : ' no-i18n'), 'data-s': s, 'aria-pressed': String(ui.qside === s), text: sideLabel(s), onclick: function () { ui.qside = s; renderQuick(); } }));
    });
    var amts = $('#qAmts');
    if (!amts.children.length) QUICK.forEach(function (a) { amts.appendChild(el('button', { type: 'button', class: 'btn', 'data-amt': String(a), text: money(a * 100) })); });
    else $$('button', amts).forEach(function (b) { b.textContent = money(+b.getAttribute('data-amt') * 100); });
    var T = totals(ev.id);
    $('#qCount').textContent = String(T.cashN); $('#qTotal').textContent = money(T.cash); $('#qTotal').setAttribute('data-p', String(T.cash));
    var rec = entriesOf(ev.id).sort(function (a, b) { return b.created - a.created; }).slice(0, 5);
    var ul = $('#qRecent'); ul.innerHTML = '';
    rec.forEach(function (e) { ul.appendChild(el('li', null, el('span', { class: 'no-i18n', text: enShown(e) + (e.side !== 'other' || ui.qside ? ' · ' + sideLabel(e.side) : '') }), numSpan(giftMain(e)))); });
    $('#qUndo').disabled = !rec.length;
  }
  function renderPrint() {
    var box = $('#printReg'); box.innerHTML = '';
    var ev = curEv(); if (!ev) return;
    var T = totals(ev.id), list = sortList(entriesOf(ev.id));
    box.appendChild(el('h1', { class: 'no-i18n', text: evName(ev) }));
    var meta = [t('k_' + ev.kind), ev.date ? dmy(ev.date) : '', t(ev.dir === 'ours' ? 'dir_ours' : 'dir_theirs'), ev.place].filter(Boolean).join(' · ');
    box.appendChild(el('p', { class: 'p-sub', text: meta + ' · ' + t('printed_on', { date: dmy(todayStr()) }) }));
    var head = el('tr', null, el('th', { text: '#' }), el('th', { text: t(ev.dir === 'theirs' ? 'f_name_theirs' : 'f_name') }), el('th', { text: t('f_city') }), el('th', { text: t('f_side') }),
      el('th', { text: t('f_gift') }), el('th', { text: t('c_details') }), el('th', { class: 'a', text: t('c_amount') }));
    var body = el('tbody');
    list.forEach(function (e, i) {
      body.appendChild(el('tr', null, el('td', { text: String(i + 1) }), el('td', { class: 'no-i18n', text: enShown(e) }), el('td', { class: 'no-i18n', text: enCity(e) }), el('td', { text: sideLabel(e.side) }),
        el('td', { text: t('g_' + e.gift) }), el('td', { class: 'no-i18n', text: [enDesc(e), e.wt ? grams(e.wt) : ''].filter(Boolean).join(' · ') }), el('td', { class: 'a', text: e.amt ? money(e.amt) : '' })));
    });
    box.appendChild(el('table', null, el('thead', null, head), body));
    function par(s) { return s ? ' (' + s + ')' : ''; }
    var sum = [t('t_cash') + ': ' + money(T.cash) + par(t('n_envelopes', { n: T.cashN })), t('g_gold') + ': ' + T.gold + par(itemNote(T.goldW, T.goldV)),
      t('g_silver') + ': ' + T.silver + par(itemNote(T.silverW, T.silverV)), t('g_other') + ': ' + T.other + par(itemNote(0, T.otherV))];
    box.appendChild(el('p', null, el('b', { text: t('total') + ': ' }), sum.join(' · ')));
    var st = el('tbody');
    allSides().forEach(function (s) { var x = T.sides[s]; if (x) st.appendChild(el('tr', null, el('td', { text: sideLabel(s) }), el('td', { class: 'a', text: String(x.n) }), el('td', { class: 'a', text: money(x.cash) }), el('td', { class: 'a', text: String(x.items) }))); });
    box.appendChild(el('table', { style: { width: 'auto', minWidth: '60%' } }, el('thead', null, el('tr', null, el('th', { text: t('f_side') }), el('th', { class: 'a', text: t('t_entries') }), el('th', { class: 'a', text: t('t_cash') }), el('th', { class: 'a', text: t('t_items') }))), st));
  }
  function renderAll() {
    idx = null;
    $('#sampleNote').hidden = !hasSample();
    renderEvents();
    renderTotals();
    renderForm();
    renderQuick();
    renderList();
    renderLookup();
    renderPrint();
    $('#btnPrint').disabled = $('#btnCsv').disabled = !curEv();
  }

  /* ---------------- entry form ---------------- */
  function resetForm() {
    ui.edit = null; ui.gift = 'cash';
    ['#fName', '#fCity', '#fPhone', '#fAmt', '#fWt', '#fDesc', '#fSideNew'].forEach(function (s) { $(s).value = ''; });
    $('#fErr').textContent = '';
    var ev = curEv();
    if (ev && ev.dir === 'theirs' && evHost(ev)) $('#fName').value = evHost(ev);
  }
  function startEdit(id) {
    var e = null; data.entries.forEach(function (x) { if (x.id === id) e = x; });
    if (!e) return;
    if (hasSample()) { clearSample(); return; }
    ui.edit = id; ui.gift = e.gift; ui.quick = false;
    $('#fName').value = e.name; $('#fCity').value = e.city; $('#fPhone').value = e.phone;
    $('#fAmt').value = e.amt ? plainIn(e.amt) : ''; $('#fWt').value = e.wt ? (e.wt / 100).toFixed(2).replace(/\.?0+$/, '') : ''; $('#fDesc').value = e.desc;
    $('#fErr').textContent = '';
    renderAll();
    $('#fSide').value = e.side;
    $('#formCard').scrollIntoView({ block: 'start', behavior: 'smooth' });
    setTimeout(function () { $('#fName').focus(); }, 50);
  }
  function plainIn(p) { return Math.floor(p / 100) + (p % 100 ? '.' + pad(p % 100) : ''); }
  $$('#fGift button').forEach(function (b) { b.addEventListener('click', function () { ui.gift = b.getAttribute('data-g'); renderForm(); }); });
  $('#fSide').addEventListener('change', function () { $('#fSideNewBox').hidden = this.value !== '__new'; if (this.value === '__new') $('#fSideNew').focus(); });
  $('#fName').addEventListener('input', renderHint);
  $('#fPhone').addEventListener('input', renderHint);
  $('#fCancel').addEventListener('click', function () { resetForm(); renderAll(); });
  $('#fDel').addEventListener('click', function () {
    if (!ui.edit) return;
    var e = data.entries.filter(function (x) { return x.id === ui.edit; })[0];
    if (!e || !confirm(t('confirm_del_entry', { name: enShown(e) }))) return;
    data.entries = data.entries.filter(function (x) { return x.id !== ui.edit; });
    save(); resetForm(); renderAll();
    EDU.toast(t('deleted_toast'));
  });
  function needEvent() {
    if (curEv()) return true;
    eventForm(null);
    return false;
  }
  $('#eForm').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var err = $('#fErr');
    if (hasSample()) { clearSample(); needEvent(); return; }
    if (!needEvent()) return;
    var name = str($('#fName').value, 60), phone = str($('#fPhone').value, 20), pd = phoneDigits(phone);
    if (phone && (/[^\d+\-\s()]/.test(asciiDigits(phone)) || pd.length < 10 || pd.length > 13)) { err.textContent = t('err_phone'); return; }
    var a = parseHund($('#fAmt').value, MAX_AMT);
    if (a.err) { err.textContent = t(a.err); return; }
    var w = parseHund($('#fWt').value, MAX_WT);
    if (ui.gift === 'gold' || ui.gift === 'silver') { if (w.err) { err.textContent = t('c_weight') + ': ' + t(w.err); return; } } else w = { empty: true };
    var desc = ui.gift === 'cash' ? '' : str($('#fDesc').value, 60);
    if (ui.gift === 'cash' && (a.empty || !a.v)) { err.textContent = t('err_amount'); return; }
    if (ui.gift === 'other' && !desc) { err.textContent = t('err_desc'); return; }
    var side = $('#fSide').value;
    if (side === '__new') {
      side = str($('#fSideNew').value, 30);
      if (!side) { err.textContent = t('err_side'); return; }
      var known = SIDES.filter(function (s) { return t('side_' + s).toLowerCase() === side.toLowerCase(); })[0];
      if (known) side = known;
      else if (data.sides.indexOf(side) < 0) data.sides.push(side);
    }
    err.textContent = '';
    var rec = { name: name, nk: 0, city: str($('#fCity').value, 40), ck: 0, phone: phone, side: side, gift: ui.gift, amt: a.empty ? 0 : a.v, wt: w.empty ? 0 : w.v, desc: desc, dk: 0 };
    if (ui.edit) {
      data.entries.forEach(function (x) { if (x.id === ui.edit) Object.keys(rec).forEach(function (k) { x[k] = rec[k]; }); });
      EDU.toast(t('saved_toast'));
    } else {
      rec.id = uid(); rec.eid = data.cur; rec.created = Date.now();
      data.entries.push(rec);
      EDU.toast(t('added_toast', { name: name || t('no_name') }));
    }
    var keepSide = side;
    save(); resetForm(); renderAll();
    $('#fSide').value = keepSide;
    $('#fName').focus();
  });

  /* ---------------- quick envelope counting ---------------- */
  $('#btnQuick').addEventListener('click', function () {
    if (hasSample()) { clearSample(); needEvent(); return; }
    if (!needEvent()) return;
    ui.quick = true; ui.edit = null; renderAll();
    setTimeout(function () { $('#qName').focus(); }, 30);
  });
  $('#qClose').addEventListener('click', function () { ui.quick = false; renderAll(); });
  $('#qFull').addEventListener('click', function () { EDU.fullscreen($('#quickCard')); });
  function quickAdd(paise) {
    if (hasSample()) { clearSample(); needEvent(); return; }
    var ev = curEv(); if (!ev) return;
    var name = str($('#qName').value, 60);
    data.entries.push({ id: uid(), eid: ev.id, name: name, nk: 0, city: '', ck: 0, phone: '', side: ui.qside || 'other', gift: 'cash', amt: paise, wt: 0, desc: '', dk: 0, created: Date.now() });
    save();
    $('#qName').value = ''; $('#qOther').value = ''; $('#qErr').textContent = '';
    $('#qFlash').textContent = t('q_added', { name: name || t('no_name'), amt: money(paise) });
    renderAll();
    $('#qName').focus();
  }
  $('#qAmts').addEventListener('click', function (e) { var b = e.target.closest('[data-amt]'); if (b) quickAdd(+b.getAttribute('data-amt') * 100); });
  function quickOther() {
    var p = parseHund($('#qOther').value, MAX_AMT);
    if (p.empty || !p.v || p.err) { $('#qErr').textContent = t(p.err || 'err_amount'); return; }
    quickAdd(p.v);
  }
  $('#qAdd').addEventListener('click', quickOther);
  $('#qOther').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); quickOther(); } });
  $('#qName').addEventListener('keydown', function (e) { if (e.key === 'Enter' && $('#qOther').value.trim()) { e.preventDefault(); quickOther(); } });
  $('#qUndo').addEventListener('click', function () {
    var ev = curEv(); if (!ev) return;
    var rec = entriesOf(ev.id).sort(function (a, b) { return b.created - a.created; })[0];
    if (!rec) return;
    if (hasSample()) { clearSample(); return; }
    data.entries = data.entries.filter(function (x) { return x.id !== rec.id; });
    save();
    $('#qFlash').textContent = t('q_undone', { name: enShown(rec), amt: giftMain(rec) });
    renderAll();
  });

  /* ---------------- filters, look-up ---------------- */
  $('#rSearch').addEventListener('input', function () { ui.q = this.value; renderList(); });
  $('#rSide').addEventListener('change', function () { ui.side = this.value; renderList(); });
  $('#rGift').addEventListener('change', function () { ui.fgift = this.value; renderList(); });
  $('#rSort').addEventListener('change', function () { ui.sort = this.value; renderList(); renderPrint(); });
  $('#lQ').addEventListener('input', function () { ui.lq = this.value; renderLookup(); });

  /* ---------------- events (modal) ---------------- */
  var closeModal = null;
  function eventForm(ev) {
    if (closeModal) closeModal();
    var isNew = !ev, dir = ev ? ev.dir : 'ours';
    var f = el('form', { class: 'stack', id: 'ev-form', novalidate: true });
    var name = el('input', { type: 'text', id: 'ev-name', class: 'no-i18n', maxlength: '80', autocomplete: 'off', value: ev ? ev.name || evName(ev) : '' });
    name.placeholder = t('ph_event');
    var date = el('input', { type: 'date', id: 'ev-date', value: ev ? ev.date : todayStr() });
    var kind = el('select', { id: 'ev-kind' });
    KINDS.forEach(function (k) { kind.appendChild(el('option', { value: k, text: t('k_' + k) })); });
    kind.value = ev ? ev.kind : 'wedding';
    var seg = el('div', { class: 'seg', id: 'ev-dir', role: 'group' });
    var host = el('input', { type: 'text', id: 'ev-host', class: 'no-i18n', maxlength: '60', autocomplete: 'off', value: ev ? evHost(ev) : '' });
    var place = el('input', { type: 'text', id: 'ev-place', class: 'no-i18n', maxlength: '40', autocomplete: 'off', value: ev ? ev.place : '' });
    var hostBox = el('label', { class: 'field' }, el('span', { text: t('f_host') }), host);
    var err = el('p', { class: 'err', id: 'ev-err', role: 'alert' });
    function sync() { $$('button', seg).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === dir)); }); hostBox.hidden = dir !== 'theirs'; }
    ['ours', 'theirs'].forEach(function (v) { seg.appendChild(el('button', { type: 'button', 'data-v': v, text: t('dir_' + v), onclick: function () { dir = v; sync(); } })); });
    f.appendChild(el('label', { class: 'field' }, el('span', { text: t('f_event_name') }), name));
    f.appendChild(el('div', { class: 'two' }, el('label', { class: 'field' }, el('span', { text: t('f_date') }), date), el('label', { class: 'field' }, el('span', { text: t('f_kind') }), kind)));
    f.appendChild(el('div', { class: 'field' }, el('span', { text: t('f_dir') }), seg));
    f.appendChild(hostBox);
    f.appendChild(el('label', { class: 'field' }, el('span', { text: t('f_place') }), place));
    f.appendChild(err);
    f.appendChild(el('div', { class: 'row' }, el('button', { type: 'submit', class: 'btn btn-primary', id: 'ev-save', text: t('save') }),
      el('button', { type: 'button', class: 'btn', text: t('cancel'), onclick: function () { if (closeModal) closeModal(); } })));
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var nm = str(name.value, 80);
      if (!nm) { err.textContent = t('err_event_name'); return; }
      if (date.value && !okDate(date.value)) { err.textContent = t('err_date'); return; }
      if (hasSample()) clearSample(true);
      var rec = { name: nm, nk: 0, date: date.value || '', kind: KINDS.indexOf(kind.value) >= 0 ? kind.value : 'other', dir: dir, host: dir === 'theirs' ? str(host.value, 60) : '', hk: 0, place: str(place.value, 40), sample: false };
      if (isNew) { rec.id = uid(); data.events.push(rec); data.cur = rec.id; }
      else { var cur = evById(ev.id); if (cur) Object.keys(rec).forEach(function (k) { cur[k] = rec[k]; }); }
      save(); if (closeModal) closeModal();
      resetForm(); renderAll();
      EDU.toast(t(isNew ? 'event_added' : 'saved_toast'));
    });
    sync();
    closeModal = EDU.modal(f, { title: t(isNew ? 'new_event' : 'edit_event'), onClose: function () { closeModal = null; } });
    setTimeout(function () { name.focus(); }, 30);
  }
  $('#evNew').addEventListener('click', function () { if (hasSample()) clearSample(true); eventForm(null); });
  $('#evEdit').addEventListener('click', function () { var ev = curEv(); if (!ev) return; if (ev.sample) { clearSample(); return; } eventForm(ev); });
  $('#evDel').addEventListener('click', function () {
    var ev = curEv(); if (!ev) return;
    if (ev.sample) { clearSample(); return; }
    var n = entriesOf(ev.id).length;
    if (!confirm(t('confirm_del_event', { name: evName(ev), n: n }))) return;
    data.events = data.events.filter(function (x) { return x.id !== ev.id; });
    data.entries = data.entries.filter(function (x) { return x.eid !== ev.id; });
    data.cur = data.events[0] ? data.events[0].id : '';
    save(); resetForm(); renderAll();
  });
  $('#evSel').addEventListener('change', function () { data.cur = this.value; ui.edit = null; ui.quick = ui.quick && curEv() && curEv().dir === 'ours'; if (!hasSample()) save(); resetForm(); renderAll(); });
  $('#btnClearSample').addEventListener('click', function () { clearSample(); });

  /* ---------------- print, CSV, backup ---------------- */
  $('#btnPrint').addEventListener('click', function () { renderPrint(); window.print(); });
  function csvFor(events) {
    var rows = [[t('c_event'), t('c_date'), t('f_dir'), t('f_name'), t('f_city'), t('f_phone'), t('f_side'), t('f_gift'), t('c_details'), t('c_weight'), t('c_amount')]];
    events.forEach(function (ev) {
      sortList(entriesOf(ev.id)).forEach(function (e) {
        rows.push([evName(ev), ev.date ? ev.date.split('-').reverse().join('-') : '', t(ev.dir === 'ours' ? 'dir_ours_s' : 'dir_theirs_s'), enShown(e), enCity(e), e.phone, sideLabel(e.side), t('g_' + e.gift),
          enDesc(e), e.wt ? (e.wt / 100).toFixed(2) : '', e.amt ? plainRs(e.amt) : '']);
      });
    });
    return EDU.csv.stringify(rows);
  }
  $('#btnCsv').addEventListener('click', function () { var ev = curEv(); if (ev) EDU.download('shagun-register-' + (ev.date || todayStr()) + '.csv', csvFor([ev]), 'text/csv'); });
  $('#btnCsvAll').addEventListener('click', function () { EDU.download('shagun-register-all-' + todayStr() + '.csv', csvFor(data.events), 'text/csv'); });
  $('#btnBackup').addEventListener('click', function () {
    var out = { app: SLUG, v: 1, saved: new Date().toISOString(), data: hasSample() ? blank() : data };
    EDU.download('shagun-register-backup-' + todayStr() + '.json', JSON.stringify(out, null, 1), 'application/json');
    EDU.toast(t('backup_done'));
  });
  $('#btnRestore').addEventListener('click', function () {
    EDU.pickFile('.json,application/json').then(function (f) {
      if (!f) return;
      if (f.size > 20 * 1024 * 1024) { EDU.toast(t('restore_bad'), 4000); return; }
      return EDU.readText(f).then(function (txt) {
        var obj = null;
        try { obj = JSON.parse(txt); } catch (e) { obj = null; }
        if (!obj || obj.app !== SLUG || !obj.data || typeof obj.data !== 'object') { EDU.toast(t('restore_bad'), 4000); return; }
        if (!confirm(t('confirm_restore'))) return;
        if (Array.isArray(obj.data.events)) obj.data.events.forEach(function (e) { if (e && typeof e === 'object') e.sample = false; });
        data = cleanData(obj.data); data.started = true;
        ui.edit = null; ui.quick = false; resetForm();
        save(); renderAll();
        EDU.toast(t('restore_ok', { n: data.events.length, m: data.entries.length }));
      });
    }).catch(function () { EDU.toast(t('restore_bad'), 4000); });
  });
  $('#btnReset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    data = blank(); ui.edit = null; ui.quick = false; resetForm(); save(); renderAll();
  });

  EDU.onLang(function () { $('#qAmts').innerHTML = ''; renderAll(); });
  resetForm();
  renderAll();
})();
