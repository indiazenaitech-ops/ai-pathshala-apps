/* Udhaar Khata (Credit Book): a private customer / supplier credit ledger for small shops.
   Everything is stored on the device with EDU.store('udhaar-khata'):
     meta    = { v, tab, shop, upi, phone, remindLang, cashStart (paise), firstUse, lastBackup, changed, snooze, pin:{salt,hash}|null, filter, sort }
     parties = [{ id, name, phone, type:'customer'|'supplier', note, lang, sample, sk, created }]
     entries = [{ id, pid, kind:'gave'|'got', paise, date:'YYYY-MM-DD', note, nk, due:'', created }]
     cash    = [{ id, kind:'in'|'out', paise, date, note, nk, sample, created }]
   Money is kept as integer paise, so balances are exact to the paisa.
   balance(party) = sum(gave) - sum(got): positive = they owe you ("you will get"), negative = you owe them. */
(function () {
  'use strict';
  var SLUG = 'udhaar-khata';
  var store = EDU.store(SLUG);
  var t = EDU.t, $ = EDU.$, $$ = EDU.$$, esc = EDU.esc, el = EDU.el;
  var MAX_PAISE = 999999999999;                 /* ₹9,99,99,99,999.99 per entry */
  var STORE_LIMIT = 5 * 1024 * 1024;            /* characters; the usual browser storage quota */
  var BACKUP_DAYS = 7, UNDO_MS = 9000, PBKDF2_ITER = 200000;
  var VPA_RE = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  var ID_RE = /^[A-Za-z0-9_-]{1,40}$/;

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ---------------- dates (local time, never toISOString) ---------------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return isNaN(d.getTime()) || d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[3] ? null : d;
  }
  function todayStr() { return ymd(new Date()); }
  function addDays(s, n) { var d = parseDate(s) || new Date(); d.setDate(d.getDate() + n); return ymd(d); }
  function dmy(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '')); return m ? m[3] + '-' + m[2] + '-' + m[1] : String(s || ''); }
  function daysBetween(a, b) { var x = parseDate(a), y = parseDate(b); return x && y ? Math.round((y - x) / 86400000) : 0; }
  function list(key) { return String(t(key)).split(',').map(function (s) { return s.trim(); }); }
  function monthName(m) { return list('months')[m] || String(m + 1); }
  function monthLabel(y, m) { return monthName(m) + ' ' + y; }
  function ymOf(s) { return s.slice(0, 7); }

  /* ---------------- money (integer paise) ---------------- */
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
  /* "₹1,250.5", "Rs 1250/-", "१२५०" -> { paise: 125050 } ; otherwise { err: key } or { empty: true } */
  function parsePaise(raw) {
    var s = asciiDigits(raw).replace(/[\s,₹]/g, '').replace(/^(rs\.?|inr)/i, '').replace(/\/[-=]$/, '');
    if (!s) return { empty: true };
    if (/^-/.test(s)) return { err: 'err_amt_neg' };
    if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return { err: 'err_amt_bad' };
    var parts = s.split('.'), whole = (parts[0] || '0').replace(/^0+(?=\d)/, ''), dec = parts[1] || '';
    if (dec.length > 2) return { err: 'err_amt_dec' };
    if (whole.length > 10) return { err: 'err_amt_big' };
    var paise = Number(whole) * 100 + Number((dec + '00').slice(0, 2));
    if (!(paise > 0)) return { err: 'err_amt_neg' };
    if (paise > MAX_PAISE) return { err: 'err_amt_big' };
    return { paise: paise };
  }
  function rupees(p) { return (p < 0 ? '-' : '') + Math.floor(Math.abs(p) / 100) + '.' + pad(Math.abs(p) % 100); }   /* plain "1250.50" for CSV */
  /* lakh/crore grouping with Latin digits in every language (CLDR ur-IN and kn-IN group by thousands, so the page locale is not used) */
  var inFmt = null;
  function groupIn(n) {
    try { if (!inFmt) inFmt = new Intl.NumberFormat('en-IN', { numberingSystem: 'latn', maximumFractionDigits: 0, useGrouping: true }); return inFmt.format(n); }
    catch (e) { var str = String(n), last3 = str.slice(-3), rest = str.slice(0, -3); return (rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' : '') + last3; }
  }
  function money(p) { var a = Math.abs(p); return (p < 0 ? '−' : '') + '₹' + groupIn(Math.floor(a / 100)) + '.' + pad(a % 100); }
  function moneyAbs(p) { return money(Math.abs(p)); }

  /* ---------------- state ---------------- */
  var meta, parties = [], entries = [], cash = [];
  var ui = { pid: null, q: '', cashDate: todayStr(), ym: null, editEntry: null, entryKind: 'gave', editCash: null, cashKind: 'in' };
  var uidN = 0;
  function uid() { return Date.now().toString(36).slice(-6) + Math.random().toString(36).slice(2, 7) + (uidN++).toString(36); }
  function okId(x) { return typeof x === 'string' && ID_RE.test(x) && !(x in Object.prototype); }
  function str(x, max) { return (typeof x === 'string' ? x : typeof x === 'number' && isFinite(x) ? String(x) : '').replace(/\s+/g, ' ').trim().slice(0, max || 120); }
  function paiseOf(x) { var n = Math.round(+x); return Number.isFinite(n) && n > 0 && n <= MAX_PAISE ? n : 0; }
  function langOk(c) { return c && EDU.LANGS.some(function (l) { return l.code === c; }) ? c : ''; }

  function defaultsMeta(m) {
    m = m && typeof m === 'object' ? m : {};
    var pin = m.pin && typeof m.pin === 'object' && typeof m.pin.hash === 'string' && typeof m.pin.salt === 'string' ? { salt: m.pin.salt.slice(0, 64), hash: m.pin.hash.slice(0, 128) } : null;
    return {
      v: 1,
      tab: ['khata', 'cash', 'sum', 'set'].indexOf(m.tab) >= 0 ? m.tab : 'khata',
      shop: str(m.shop, 60), upi: str(m.upi, 100), phone: str(m.phone, 20),
      remindLang: langOk(m.remindLang),
      cashStart: Number.isFinite(+m.cashStart) ? Math.round(+m.cashStart) : 0,
      sampleCash: m.sampleCash === true,
      firstUse: Number.isFinite(+m.firstUse) && +m.firstUse > 0 ? +m.firstUse : Date.now(),
      lastBackup: Number.isFinite(+m.lastBackup) ? +m.lastBackup : 0,
      changed: m.changed === true,
      snooze: Number.isFinite(+m.snooze) ? +m.snooze : 0,
      pin: pin,
      filter: ['all', 'customer', 'supplier', 'overdue'].indexOf(m.filter) >= 0 ? m.filter : 'all',
      sort: ['recent', 'name', 'bal'].indexOf(m.sort) >= 0 ? m.sort : 'recent'
    };
  }
  function sanitizeParty(p, seen) {
    if (!p || typeof p !== 'object' || Array.isArray(p)) return null;
    var id = okId(p.id) && !seen[p.id] ? p.id : uid();
    var sample = p.sample === true && +p.sk >= 1 && +p.sk <= 3;
    var name = str(p.name, 80);
    if (!name && !sample) return null;
    seen[id] = 1;
    return { id: id, name: name, phone: str(p.phone, 20), type: p.type === 'supplier' ? 'supplier' : 'customer', note: str(p.note, 120),
      lang: langOk(p.lang), sample: sample, sk: sample ? +p.sk : 0, created: Number.isFinite(+p.created) ? +p.created : Date.now() };
  }
  function sanitizeEntry(e, pids, seen) {
    if (!e || typeof e !== 'object' || !pids[e.pid] || !parseDate(e.date)) return null;
    var paise = paiseOf(e.paise); if (!paise) return null;
    var id = okId(e.id) && !seen[e.id] ? e.id : uid();
    seen[id] = 1;
    var nk = +e.nk >= 1 && +e.nk <= 7 ? +e.nk : 0;
    return { id: id, pid: e.pid, kind: e.kind === 'got' ? 'got' : 'gave', paise: paise, date: e.date, note: nk ? '' : str(e.note, 120), nk: nk,
      due: e.kind !== 'got' && parseDate(e.due) ? e.due : '', created: Number.isFinite(+e.created) ? +e.created : Date.now() };
  }
  function sanitizeCash(c, seen) {
    if (!c || typeof c !== 'object' || !parseDate(c.date)) return null;
    var paise = paiseOf(c.paise); if (!paise) return null;
    var id = okId(c.id) && !seen[c.id] ? c.id : uid();
    seen[id] = 1;
    var nk = +c.nk >= 1 && +c.nk <= 7 ? +c.nk : 0;
    return { id: id, kind: c.kind === 'out' ? 'out' : 'in', paise: paise, date: c.date, note: nk ? '' : str(c.note, 120), nk: nk, sample: c.sample === true, created: Number.isFinite(+c.created) ? +c.created : Date.now() };
  }
  function cleanAll(P, E, C) {
    var seenP = Object.create(null), seenE = Object.create(null), seenC = Object.create(null), pids = Object.create(null);
    var ps = (Array.isArray(P) ? P : []).map(function (p) { return sanitizeParty(p, seenP); }).filter(Boolean);
    ps.forEach(function (p) { pids[p.id] = 1; });
    var es = (Array.isArray(E) ? E : []).map(function (e) { return sanitizeEntry(e, pids, seenE); }).filter(Boolean);
    var cs = (Array.isArray(C) ? C : []).map(function (c) { return sanitizeCash(c, seenC); }).filter(Boolean);
    return { parties: ps, entries: es, cash: cs };
  }

  /* sample data: names and notes are string keys, so they follow the page language */
  function pname(p) { return p.sample && p.sk ? t('sample_p' + p.sk) : p.name; }
  function enote(e) { return e.nk ? t('sample_n' + e.nk) : e.note; }
  function pnote(p) { return p.sample && p.sk === 3 ? t('sample_note3') : p.note; }
  function seedSamples() {
    var now = Date.now(), T = todayStr();
    function P(sk, type) { return { id: uid(), name: '', phone: '', type: type, note: '', lang: '', sample: true, sk: sk, created: now - sk }; }
    function E(p, kind, rs, daysAgo, nk, dueIn) { return { id: uid(), pid: p.id, kind: kind, paise: rs * 100, date: addDays(T, -daysAgo), note: '', nk: nk, due: dueIn === undefined ? '' : addDays(T, dueIn), created: now - daysAgo * 86400000 }; }
    var p1 = P(1, 'customer'), p2 = P(2, 'customer'), p3 = P(3, 'supplier');
    parties = [p1, p2, p3];
    entries = [
      E(p1, 'gave', 1250, 12, 1), E(p1, 'got', 500, 6, 2), E(p1, 'gave', 320.5 * 1, 2, 3, 5),
      E(p2, 'gave', 800, 20, 4, -7),
      E(p3, 'got', 15000, 10, 5), E(p3, 'gave', 5000, 3, 2)
    ];
    entries[2].paise = 32050;
    cash = [
      { id: uid(), kind: 'in', paise: 185000, date: T, note: '', nk: 6, sample: true, created: now - 3600000 },
      { id: uid(), kind: 'out', paise: 40000, date: T, note: '', nk: 7, sample: true, created: now - 1800000 }
    ];
    meta.cashStart = 200000; meta.sampleCash = true;
  }
  function hasSamples() { return parties.some(function (p) { return p.sample; }) || cash.some(function (c) { return c.sample; }); }
  function hasRealData() { return parties.some(function (p) { return !p.sample; }) || cash.some(function (c) { return !c.sample; }); }

  /* ---------------- persistence ---------------- */
  var dirty = Object.create(null), timer = null, saveWarned = false;
  function saveMeta() { if (!store.set('meta', meta)) saveFailed(); }
  function touch(k) {
    dirty[k] = 1;
    if (k !== 'meta') { meta.changed = true; dirty.meta = 1; }
    if (!timer) timer = setTimeout(flush, 300);
  }
  function flush() {
    clearTimeout(timer); timer = null;
    var ok = true;
    if (dirty.parties) ok = store.set('parties', parties) && ok;
    if (dirty.entries) ok = store.set('entries', entries) && ok;
    if (dirty.cash) ok = store.set('cash', cash) && ok;
    if (dirty.meta) ok = store.set('meta', meta) && ok;
    dirty = Object.create(null);
    if (!ok) saveFailed();
    if (!$('#p-set').classList.contains('off')) renderStorage();
  }
  function saveFailed() {
    var q = $('#quota-warn'); q.hidden = false; $('#quota-txt').textContent = t('save_failed');
    if (!saveWarned) { saveWarned = true; EDU.toast(t('save_failed'), 5000); }
  }
  window.addEventListener('pagehide', flush);
  window.addEventListener('beforeunload', flush);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(); });

  function load() {
    meta = defaultsMeta(store.get('meta', null));
    var c = cleanAll(store.get('parties', null), store.get('entries', null), store.get('cash', null));
    parties = c.parties; entries = c.entries; cash = c.cash;
    if (!parties.length && !entries.length && !cash.length && !hasRealData() && !meta.changed) seedSamples();
    store.set('parties', parties); store.set('entries', entries); store.set('cash', cash); saveMeta();
  }
  function usedChars() {
    try { return JSON.stringify(parties).length + JSON.stringify(entries).length + JSON.stringify(cash).length + JSON.stringify(meta).length + 80; } catch (e) { return 0; }
  }

  /* ---------------- undo ---------------- */
  var undoStack = [], undoTimer = null;
  function pushUndo(label, apply) {
    undoStack.push({ label: label, apply: apply });
    if (undoStack.length > 25) undoStack.shift();
    $('#undo-txt').textContent = label;
    $('#undo-bar').hidden = false;
    clearTimeout(undoTimer);
    undoTimer = setTimeout(function () { $('#undo-bar').hidden = true; }, UNDO_MS);
  }
  function undo() {
    var u = undoStack.pop();
    $('#undo-bar').hidden = true;
    if (!u) return;
    u.apply();
    touch('parties'); touch('entries'); touch('cash');
    renderAll();
    EDU.toast(t('undone'));
  }
  $('#undo-btn').addEventListener('click', undo);
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
      var a = document.activeElement, tag = a && a.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (undoStack.length) { e.preventDefault(); undo(); }
    }
  });
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function replaceById(arr, obj) { for (var i = 0; i < arr.length; i++) if (arr[i].id === obj.id) { arr[i] = obj; return; } arr.push(obj); }
  function removeById(arr, id) { for (var i = arr.length - 1; i >= 0; i--) if (arr[i].id === id) arr.splice(i, 1); }

  /* ---------------- computations ---------------- */
  function partyById(id) { for (var i = 0; i < parties.length; i++) if (parties[i].id === id) return parties[i]; return null; }
  function entriesOf(pid) {
    return entries.filter(function (e) { return e.pid === pid; }).sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : a.created - b.created; });
  }
  /* balance, last entry date and (FIFO: payments settle the oldest udhaar first) the earliest due date still open */
  function statsOf(pid, today) {
    var es = entriesOf(pid), bal = 0, got = 0, last = '';
    es.forEach(function (e) { bal += e.kind === 'gave' ? e.paise : -e.paise; if (e.kind === 'got') got += e.paise; if (e.date > last) last = e.date; });
    var due = '';
    if (bal > 0) {
      var left = got;
      es.forEach(function (e) {
        if (e.kind !== 'gave') return;
        if (left >= e.paise) { left -= e.paise; return; }
        left = 0;
        if (e.due && (!due || e.due < due)) due = e.due;
      });
    }
    return { bal: bal, last: last, due: due, overdue: !!due && due < today, n: es.length };
  }
  function allStats() {
    var today = todayStr(), out = Object.create(null);
    parties.forEach(function (p) { out[p.id] = statsOf(p.id, today); });
    return out;
  }
  function balLabel(bal) { return bal > 0 ? t('you_get') : bal < 0 ? t('you_give') : t('settled'); }
  function balClass(bal) { return bal > 0 ? 'get' : bal < 0 ? 'give' : ''; }
  function dueText(S, today) {
    if (!S.due) return '';
    var d = daysBetween(S.due, today);
    return d > 0 ? t('overdue_days', { n: EDU.fmt(d) }) : d === 0 ? t('due_today') : t('due_on', { date: dmy(S.due) });
  }
  /* for innerHTML contexts: dates in a nowrap LTR span, so Urdu lines never break inside "02-10-2026" */
  function numHtml(s) { return '<span class="num">' + esc(s) + '</span>'; }
  function dueHtml(S, today) { return esc(dueText(S, today)).replace(/\d{2}-\d{2}-\d{4}/g, function (m) { return numHtml(m); }); }

  /* ---------------- dashboard ---------------- */
  function renderDash() {
    var S = allStats(), collect = 0, pay = 0, nc = 0, np = 0, od = 0, nod = 0;
    parties.forEach(function (p) {
      var s = S[p.id];
      if (s.bal > 0) { collect += s.bal; nc++; } else if (s.bal < 0) { pay -= s.bal; np++; }
      if (s.overdue) { od += s.bal; nod++; }
    });
    $('#d-collect').textContent = money(collect); $('#d-collect-n').textContent = t('n_people', { n: EDU.fmt(nc) });
    $('#d-pay').textContent = money(pay); $('#d-pay-n').textContent = t('n_people', { n: EDU.fmt(np) });
    $('#d-overdue').textContent = money(od); $('#d-overdue').classList.toggle('bad', nod > 0); $('#d-overdue-n').textContent = t('n_people', { n: EDU.fmt(nod) });
    $('#lock-btn').hidden = !meta.pin;
    renderReminder();
  }

  /* ---------------- tabs ---------------- */
  function setTab(tab) {
    meta.tab = tab; saveMeta();
    $$('.tabs [role="tab"]').forEach(function (b) {
      var on = b.getAttribute('data-tab') === tab;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    ['khata', 'cash', 'sum', 'set'].forEach(function (k) { $('#p-' + k).classList.toggle('off', k !== tab); });
    renderTab();
  }
  function renderTab() {
    if (meta.tab === 'khata') renderKhata();
    else if (meta.tab === 'cash') renderCash();
    else if (meta.tab === 'sum') renderSum();
    else renderSettings();
  }
  function renderAll() { renderDash(); renderTab(); }
  $$('.tabs [role="tab"]').forEach(function (b) {
    b.addEventListener('click', function () { setTab(b.getAttribute('data-tab')); });
    b.addEventListener('keydown', function (e) {
      var tabs = $$('.tabs [role="tab"]'), i = tabs.indexOf(b), rtl = document.documentElement.dir === 'rtl';
      var k = e.key === 'ArrowRight' ? (rtl ? -1 : 1) : e.key === 'ArrowLeft' ? (rtl ? 1 : -1) : 0;
      if (!k) return;
      e.preventDefault();
      var nb = tabs[(i + k + tabs.length) % tabs.length];
      nb.focus(); setTab(nb.getAttribute('data-tab'));
    });
  });

  /* ---------------- khata: list ---------------- */
  function matches(p, q) {
    if (!q) return true;
    q = q.toLowerCase();
    return pname(p).toLowerCase().indexOf(q) >= 0 || asciiDigits(p.phone).replace(/\D/g, '').indexOf(asciiDigits(q).replace(/\D/g, '') || '\u0001') >= 0 || pnote(p).toLowerCase().indexOf(q) >= 0;
  }
  function initial(name) { var c = Array.from(String(name).trim())[0]; return c ? c.toUpperCase() : '?'; }
  function sortedParties(S) {
    var arr = parties.slice();
    if (meta.sort === 'name') arr.sort(function (a, b) { return pname(a).localeCompare(pname(b)); });
    else if (meta.sort === 'bal') arr.sort(function (a, b) { return Math.abs(S[b.id].bal) - Math.abs(S[a.id].bal) || pname(a).localeCompare(pname(b)); });
    else arr.sort(function (a, b) { var x = S[a.id].last || '', y = S[b.id].last || ''; return x < y ? 1 : x > y ? -1 : b.created - a.created; });
    return arr;
  }
  function renderKhata() {
    if (ui.pid && partyById(ui.pid)) { $('#k-list').hidden = true; $('#k-detail').hidden = false; renderDetail(); return; }
    ui.pid = null;
    $('#k-list').hidden = false; $('#k-detail').hidden = true;
    var S = allStats(), today = todayStr();
    $$('#k-filter button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === meta.filter)); });
    $('#k-sort').value = meta.sort;
    if (document.activeElement !== $('#k-search')) $('#k-search').value = ui.q;
    $('#sample-note').hidden = !hasSamples();
    var html = '', shown = 0;
    sortedParties(S).forEach(function (p) {
      var s = S[p.id];
      if (meta.filter === 'customer' && p.type !== 'customer') return;
      if (meta.filter === 'supplier' && p.type !== 'supplier') return;
      if (meta.filter === 'overdue' && !s.overdue) return;
      if (!matches(p, ui.q)) return;
      shown++;
      var sub = [esc(t(p.type)), p.phone ? numHtml(p.phone) : '', s.last ? esc(t('last_entry', { date: '\u0001' })).replace('\u0001', numHtml(dmy(s.last))) : ''].filter(Boolean).join(' · ');
      var due = s.due && s.bal > 0 ? '<small class="' + (s.overdue ? 'late' : '') + '">' + dueHtml(s, today) + '</small>' : '';
      html += '<button type="button" class="prow' + (p.type === 'supplier' ? ' sup' : '') + '" data-pid="' + esc(p.id) + '">' +
        '<span class="avatar" aria-hidden="true">' + esc(initial(pname(p))) + '</span>' +
        '<span class="pinfo"><span class="pname no-i18n">' + esc(pname(p)) + '</span>' + (p.sample ? '<span class="badge ex">' + esc(t('example')) + '</span>' : '') +
        '<span class="psub">' + sub + '</span></span>' +
        '<span class="pbal"><b class="' + balClass(s.bal) + '">' + esc(moneyAbs(s.bal)) + '</b><small>' + esc(balLabel(s.bal)) + '</small>' + due + '</span></button>';
    });
    $('#k-rows').innerHTML = html;
    var em = $('#k-empty');
    em.hidden = shown > 0;
    if (!shown) em.textContent = parties.length ? t('no_match', { q: ui.q }) : t('no_parties');
    $('#k-count').textContent = t('n_people', { n: EDU.fmt(parties.length) });
  }
  $('#k-rows').addEventListener('click', function (e) {
    var b = e.target.closest('.prow'); if (!b) return;
    openParty(b.getAttribute('data-pid'));
  });
  function openParty(pid) { ui.pid = pid; closeEntryForm(); renderKhata(); $('#k-detail').scrollIntoView({ block: 'start', behavior: 'smooth' }); }
  $('#k-search').addEventListener('input', function () { ui.q = this.value.trim(); renderKhata(); });
  $$('#k-filter button').forEach(function (b) { b.addEventListener('click', function () { meta.filter = b.dataset.v; saveMeta(); renderKhata(); }); });
  $('#k-sort').addEventListener('change', function () { meta.sort = this.value; saveMeta(); renderKhata(); });
  $('#k-back').addEventListener('click', function () { ui.pid = null; closeEntryForm(); renderKhata(); });

  /* ---------------- party form (modal) ---------------- */
  var closeModal = null;
  function openModal(content, title) { if (closeModal) closeModal(); closeModal = EDU.modal(content, { title: title, onClose: function () { closeModal = null; } }); }
  function dupWarn(name, exceptId) {
    var n = name.trim().toLowerCase();
    return !!n && parties.some(function (p) { return p.id !== exceptId && pname(p).trim().toLowerCase() === n; });
  }
  function partyForm(p) {
    var isNew = !p;
    var f = el('form', { class: 'stack', id: 'pf' });
    var name = el('input', { type: 'text', id: 'pf-name', class: 'no-i18n', maxlength: '80', placeholder: t('pf_name_ph'), value: p ? pname(p) : '', required: true, autocomplete: 'off' });
    var phone = el('input', { type: 'text', id: 'pf-phone', class: 'no-i18n', dir: 'ltr', inputmode: 'tel', maxlength: '20', placeholder: t('pf_phone_ph'), value: p ? p.phone : '', autocomplete: 'off' });
    var note = el('input', { type: 'text', id: 'pf-note', class: 'no-i18n', maxlength: '120', placeholder: t('pf_note_ph'), value: p ? pnote(p) : '' });
    var type = p ? p.type : 'customer';
    var seg = el('div', { class: 'seg', id: 'pf-type', role: 'group', 'aria-label': t('pf_type') });
    ['customer', 'supplier'].forEach(function (k) {
      seg.appendChild(el('button', { type: 'button', 'data-v': k, 'aria-pressed': String(type === k), text: t(k), onclick: function () { type = k; $$('button', seg).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === k)); }); } }));
    });
    var lang = el('select', { id: 'pf-lang' });
    lang.appendChild(el('option', { value: '', text: t('st_lang_auto') }));
    EDU.LANGS.forEach(function (l) { lang.appendChild(el('option', { value: l.code, text: l.native })); });
    lang.value = p ? p.lang : '';
    var warn = el('div', { class: 'callout warning small', hidden: true });
    var err = el('div', { class: 'callout danger small', hidden: true });
    name.addEventListener('input', function () { var d = dupWarn(name.value, p ? p.id : null); warn.hidden = !d; if (d) warn.textContent = t('dup_name', { name: name.value.trim() }); });
    f.appendChild(el('label', { class: 'field' }, el('span', { text: t('pf_name') }), name));
    f.appendChild(warn);
    f.appendChild(el('div', { class: 'two' },
      el('label', { class: 'field' }, el('span', { text: t('pf_phone') }), phone),
      el('div', { class: 'field' }, el('span', { text: t('pf_type') }), seg)));
    f.appendChild(el('label', { class: 'field' }, el('span', { text: t('pf_note') }), note));
    f.appendChild(el('label', { class: 'field' }, el('span', { text: t('pf_lang') }), lang, el('span', { class: 'hint', text: t('pf_lang_hint') })));
    f.appendChild(err);
    f.appendChild(el('div', { class: 'row' },
      el('button', { type: 'submit', class: 'btn btn-primary', id: 'pf-save', text: t('save') }),
      el('button', { type: 'button', class: 'btn', id: 'pf-cancel', text: t('cancel'), onclick: function () { if (closeModal) closeModal(); } })));
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var nm = str(name.value, 80);
      if (!nm) { err.hidden = false; err.textContent = t('need_name'); name.focus(); return; }
      if (isNew) {
        var np = { id: uid(), name: nm, phone: str(phone.value, 20), type: type, note: str(note.value, 120), lang: langOk(lang.value), sample: false, sk: 0, created: Date.now() };
        parties.push(np); touch('parties');
        if (closeModal) closeModal();
        EDU.toast(t('party_saved'));
        openParty(np.id);
      } else {
        var before = clone(p);
        p.name = nm; p.phone = str(phone.value, 20); p.type = type; p.note = str(note.value, 120); p.lang = langOk(lang.value);
        if (p.sample && (nm !== t('sample_p' + p.sk) || p.note !== t('sample_note3'))) { p.sample = false; p.sk = 0; }
        touch('parties');
        if (closeModal) closeModal();
        pushUndo(t('party_saved'), function () { replaceById(parties, before); });
        renderAll();
      }
    });
    if (!isNew && p.sample) { seg.hidden = false; }
    openModal(f, t(isNew ? 'pf_title_new' : 'pf_title_edit'));
    setTimeout(function () { name.focus(); }, 30);
  }
  $('#k-add').addEventListener('click', function () { partyForm(null); });
  $('#k-edit').addEventListener('click', function () { var p = partyById(ui.pid); if (p) partyForm(p); });
  $('#k-del').addEventListener('click', function () {
    var p = partyById(ui.pid); if (!p) return;
    if (!confirm(t('confirm_delete_party', { name: pname(p) }))) return;
    var gone = clone(p), goneE = clone(entriesOf(p.id));
    removeById(parties, p.id);
    entries = entries.filter(function (e) { return e.pid !== p.id; });
    touch('parties'); touch('entries');
    ui.pid = null;
    pushUndo(t('party_deleted', { name: pname(gone) }), function () { parties.push(gone); goneE.forEach(function (e) { entries.push(e); }); });
    renderAll();
  });

  /* ---------------- party detail + ledger ---------------- */
  function renderDetail() {
    var p = partyById(ui.pid), today = todayStr(), S = statsOf(p.id, today);
    $('#pd-name').textContent = pname(p);
    $('#pd-ex').hidden = !p.sample;
    var sub = [esc(t(p.type)), p.phone ? numHtml(p.phone) : '', pnote(p) ? '<span class="no-i18n">' + esc(pnote(p)) + '</span>' : ''].filter(Boolean).join(' · ');
    $('#pd-sub').innerHTML = sub;
    $('#pd-bal-l').textContent = balLabel(S.bal);
    $('#pd-bal').textContent = moneyAbs(S.bal);
    $('#pd-balbox').className = 'bal-big ' + balClass(S.bal);
    var dl = $('#pd-due');
    dl.hidden = !(S.due && S.bal > 0);
    if (!dl.hidden) { dl.textContent = dueText(S, today); dl.classList.toggle('late', S.overdue); }
    $('#sup-hint').hidden = p.type !== 'supplier';
    $('#k-wa').disabled = S.bal <= 0;
    $('#ph-shop').textContent = meta.shop || t('wa_shop_default');
    $('#ph-phone').textContent = meta.phone ? t('phone_line', { p: meta.phone }) : '';
    $('#ph-date').textContent = t('printed_on', { date: dmy(today) });

    var es = entriesOf(p.id), run = 0, tg = 0, tr = 0, h = '';
    $('#pd-empty').hidden = es.length > 0;
    $('#pd-wrap').hidden = !es.length;
    if (!es.length) { $('#pd-table').innerHTML = ''; return; }
    h += '<thead><tr><th scope="col">' + esc(t('col_date')) + '</th><th scope="col">' + esc(t('col_note')) + '</th><th scope="col" class="g">' + esc(t('col_gave')) + '</th><th scope="col" class="r">' + esc(t('col_got')) + '</th><th scope="col" class="b">' + esc(t('col_bal')) + '</th><th scope="col" class="a no-print"><span class="sr-only">' + esc(t('edit')) + '</span></th></tr></thead><tbody>';
    es.forEach(function (e) {
      run += e.kind === 'gave' ? e.paise : -e.paise;
      if (e.kind === 'gave') tg += e.paise; else tr += e.paise;
      var dueHtml = e.due ? '<span class="dd' + (e.due < today && run > 0 ? ' late' : '') + '">' + esc(t('due_on', { date: '\u0001' })).replace('\u0001', numHtml(dmy(e.due))) + '</span>' : '';
      h += '<tr data-eid="' + esc(e.id) + '"' + (e.nk ? ' class="sample"' : '') + '><td class="d">' + dmy(e.date) + '</td>' +
        '<td class="n"><span class="no-i18n">' + esc(enote(e) || t(e.kind === 'gave' ? 'kind_gave' : 'kind_got')) + '</span>' + dueHtml + '</td>' +
        '<td class="g">' + (e.kind === 'gave' ? esc(money(e.paise)) : '') + '</td><td class="r">' + (e.kind === 'got' ? esc(money(e.paise)) : '') + '</td>' +
        '<td class="b' + (run < 0 ? ' neg' : '') + '">' + esc(money(run)) + '</td>' +
        '<td class="a no-print"><button type="button" class="btn btn-ghost edit" aria-label="' + esc(t('edit')) + '" title="' + esc(t('edit')) + '">✎</button></td></tr>';
    });
    h += '</tbody><tfoot><tr><td class="hide-m"></td><td>' + esc(t('total')) + '</td><td class="g">' + esc(money(tg)) + '</td><td class="r">' + esc(money(tr)) + '</td><td class="b' + (run < 0 ? ' neg' : '') + '">' + esc(money(run)) + '</td><td class="a no-print"></td></tr></tfoot>';
    $('#pd-table').innerHTML = h;
    var w = $('#pd-wrap'); w.scrollTop = w.scrollHeight;
  }
  $('#pd-table').addEventListener('click', function (e) {
    var b = e.target.closest('.edit'); if (!b) return;
    var id = b.closest('tr').getAttribute('data-eid'), en = entries.filter(function (x) { return x.id === id; })[0];
    if (en) openEntryForm(en.kind, en);
  });

  /* entry form (new or edit) */
  function openEntryForm(kind, entry) {
    ui.editEntry = entry || null; ui.entryKind = kind;
    var f = $('#e-form'); f.hidden = false;
    $('#e-title').textContent = entry ? t('e_edit') : t(kind === 'gave' ? 'e_new_gave' : 'e_new_got');
    $('#e-amt').value = entry ? rupees(entry.paise).replace(/\.00$/, '') : '';
    $('#e-date').value = entry ? entry.date : todayStr();
    $('#e-note').value = entry ? enote(entry) : '';
    $('#e-due').value = entry ? entry.due : '';
    $('#e-delete').hidden = !entry;
    $('#e-err').hidden = true;
    syncKind();
    f.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    $('#e-amt').focus();
  }
  function syncKind() {
    $$('#e-kind button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === ui.entryKind)); });
    $('#e-due-f').hidden = ui.entryKind !== 'gave';
  }
  function closeEntryForm() { $('#e-form').hidden = true; ui.editEntry = null; }
  $$('#e-kind button').forEach(function (b) { b.addEventListener('click', function () { ui.entryKind = b.dataset.v; syncKind(); }); });
  $('#e-gave').addEventListener('click', function () { openEntryForm('gave'); });
  $('#e-got').addEventListener('click', function () { openEntryForm('got'); });
  $('#e-cancel').addEventListener('click', function () { closeEntryForm(); $('#e-gave').focus(); });
  $('#e-form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var p = partyById(ui.pid); if (!p) return;
    var a = parsePaise($('#e-amt').value), err = $('#e-err');
    if (a.empty) { err.hidden = false; err.textContent = t('err_amt_empty'); $('#e-amt').focus(); return; }
    if (a.err) { err.hidden = false; err.textContent = t(a.err); $('#e-amt').focus(); return; }
    var date = $('#e-date').value;
    if (!parseDate(date)) { err.hidden = false; err.textContent = t('err_date'); $('#e-date').focus(); return; }
    var due = ui.entryKind === 'gave' && parseDate($('#e-due').value) ? $('#e-due').value : '';
    var note = str($('#e-note').value, 120);
    if (ui.editEntry) {
      var e = ui.editEntry, before = clone(e);
      e.kind = ui.entryKind; e.paise = a.paise; e.date = date; e.due = due;
      if (!(e.nk && note === t('sample_n' + e.nk))) { e.note = note; e.nk = 0; }
      touch('entries');
      pushUndo(t('entry_saved'), function () { replaceById(entries, before); });
    } else {
      entries.push({ id: uid(), pid: p.id, kind: ui.entryKind, paise: a.paise, date: date, note: note, nk: 0, due: due, created: Date.now() });
      touch('entries');
      EDU.toast(t('entry_saved'));
    }
    closeEntryForm();
    renderAll();
    $('#e-gave').focus();
  });
  $('#e-delete').addEventListener('click', function () {
    var e = ui.editEntry; if (!e) return;
    var gone = clone(e);
    removeById(entries, e.id); touch('entries');
    closeEntryForm();
    pushUndo(t('entry_deleted'), function () { entries.push(gone); });
    renderAll();
    $('#e-gave').focus();
  });

  /* ---------------- WhatsApp reminder ---------------- */
  function waNumber(phone) {
    var d = asciiDigits(phone).replace(/\D/g, '');
    if (d.length === 10) return '91' + d;
    if (d.length === 11 && d.charAt(0) === '0') return '91' + d.slice(1);
    if (d.length === 12 && d.slice(0, 2) === '91') return d;
    if (d.length >= 11 && d.length <= 15) return d;
    return '';
  }
  function ts(key, L, vars) {
    var S = window.APP_STRINGS || {}, v = (S[L] && S[L][key]) || (S.en && S.en[key]) || key;
    if (vars) v = String(v).replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; });
    return v;
  }
  function fmtIn(L, p) {
    var a = Math.abs(p);
    return '₹' + groupIn(Math.floor(a / 100)) + (a % 100 ? '.' + pad(a % 100) : '');
  }
  function waMessage(p, S, L) {
    var upi = VPA_RE.test(meta.upi) ? meta.upi : '';
    var vars = { name: pname(p), shop: meta.shop || ts('wa_shop_default', L), amt: fmtIn(L, S.bal), due: S.due ? ts('wa_due_part', L, { date: dmy(S.due) }) : '' };
    if (upi) { vars.upi = upi; return ts('wa_msg', L, vars); }
    return ts('wa_msg_noupi', L, vars);
  }
  $('#k-wa').addEventListener('click', function () {
    var p = partyById(ui.pid); if (!p) return;
    var S = statsOf(p.id, todayStr());
    if (S.bal <= 0) { EDU.toast(t('wa_nothing')); return; }
    var L = p.lang || meta.remindLang || EDU.lang;
    var box = el('div', { class: 'stack' });
    var sel = el('select', { id: 'wa-lang' });
    EDU.LANGS.forEach(function (l) { sel.appendChild(el('option', { value: l.code, text: l.native })); });
    sel.value = L;
    var ta = el('textarea', { id: 'wa-text', class: 'wa-text no-i18n', 'aria-label': t('wa_preview') });
    ta.value = waMessage(p, S, L);
    ta.setAttribute('dir', EDU.langInfo(L).dir);
    ta.setAttribute('lang', L);
    var num = waNumber(p.phone);
    var link = el('a', { class: 'btn btn-wa', id: 'wa-open', target: '_blank', rel: 'noopener', href: '#' }, el('span', { 'aria-hidden': 'true', text: '💬' }), ' ', t('wa_open'));
    function setHref() { link.href = 'https://wa.me/' + num + '?text=' + encodeURIComponent(ta.value); }
    setHref();
    ta.addEventListener('input', setHref);
    sel.addEventListener('change', function () {
      L = sel.value; p.lang = L; touch('parties');
      ta.value = waMessage(p, S, L); ta.setAttribute('dir', EDU.langInfo(L).dir); ta.setAttribute('lang', L); setHref();
    });
    box.appendChild(el('label', { class: 'field' }, el('span', { text: t('wa_lang') }), sel));
    box.appendChild(el('label', { class: 'field' }, el('span', { text: t('wa_preview') }), ta));
    if (!num) box.appendChild(el('p', { class: 'callout warning small mb0', text: t('wa_no_phone') }));
    box.appendChild(el('div', { class: 'row' }, link,
      el('button', { type: 'button', class: 'btn', id: 'wa-copy', text: t('copy'), onclick: function () { EDU.copy(ta.value); } })));
    openModal(box, t('wa_title'));
  });

  /* ---------------- UPI QR ---------------- */
  var QUIET = 4;
  function qrSvg(q) {
    var n = q.size, d = '';
    for (var y = 0; y < n; y++) {
      var x = 0;
      while (x < n) {
        if (q.modules[y][x]) { var x0 = x; while (x < n && q.modules[y][x]) x++; d += 'M' + (x0 + QUIET) + ' ' + (y + QUIET) + 'h' + (x - x0) + 'v1h-' + (x - x0) + 'z'; }
        else x++;
      }
    }
    var total = n + 2 * QUIET;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total + '" shape-rendering="crispEdges" role="img"><rect width="' + total + '" height="' + total + '" fill="#fff"/><path fill="#000" d="' + d + '"/></svg>';
  }
  function upiLink(paise) {
    var pn = /^[\x20-\x7E]+$/.test(meta.shop) ? meta.shop : '';
    return 'upi://pay?pa=' + meta.upi + (pn ? '&pn=' + encodeURIComponent(pn) : '') + (paise > 0 ? '&am=' + rupees(paise) : '') + '&cu=INR&tn=Khata';
  }
  $('#k-qr').addEventListener('click', function () {
    var p = partyById(ui.pid); if (!p) return;
    if (!VPA_RE.test(meta.upi)) {
      openModal(el('div', { class: 'stack' }, el('p', { text: t('qr_no_upi') }),
        el('button', { type: 'button', class: 'btn btn-primary', text: t('go_settings'), onclick: function () { if (closeModal) closeModal(); setTab('set'); $('#st-upi').focus(); } })), t('qr_title'));
      return;
    }
    var S = statsOf(p.id, todayStr()), paise = S.bal > 0 ? S.bal : 0;
    var box = el('div', { class: 'stack' });
    var wrap = el('div', { class: 'qr-wrap', id: 'qr-box' });
    var amtLine = el('p', { class: 'qr-amt no-i18n', id: 'qr-amt' });
    var amtIn = el('input', { type: 'text', id: 'qr-amt-in', class: 'no-i18n', inputmode: 'decimal', dir: 'ltr', value: paise ? rupees(paise).replace(/\.00$/, '') : '' });
    function draw() {
      var a = parsePaise(amtIn.value), v = a.paise || 0, q = QRGen.encode(upiLink(v), 'M');
      wrap.innerHTML = q.ok ? qrSvg(q) : '';
      wrap.dataset.payload = upiLink(v);
      amtLine.textContent = v ? money(v) : '';
    }
    amtIn.addEventListener('input', draw);
    draw();
    box.appendChild(wrap);
    box.appendChild(amtLine);
    box.appendChild(el('p', { class: 'qr-sub no-i18n', dir: 'ltr', text: (meta.shop ? meta.shop + ' · ' : '') + meta.upi }));
    box.appendChild(el('label', { class: 'field' }, el('span', { text: t('qr_amount') }), amtIn));
    box.appendChild(el('p', { class: 'small muted mb0', text: t('qr_hint') }));
    openModal(box, t('qr_title'));
  });

  /* ---------------- CSV + print ---------------- */
  function csvSafe(v) { v = String(v == null ? '' : v); return /^[=+\-@\t\r]/.test(v) && !/^-?\d+(\.\d+)?$/.test(v) ? "'" + v : v; }
  function safeName(s) { return String(s).replace(/[\\/:*?"<>|\s·]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'khata'; }
  function statementRows(p) {
    var rows = [[t('col_date'), t('col_note'), t('col_gave'), t('col_got'), t('col_bal'), t('col_due')]], run = 0;
    entriesOf(p.id).forEach(function (e) {
      run += e.kind === 'gave' ? e.paise : -e.paise;
      rows.push([dmy(e.date), csvSafe(enote(e)), e.kind === 'gave' ? rupees(e.paise) : '', e.kind === 'got' ? rupees(e.paise) : '', rupees(run), e.due ? dmy(e.due) : '']);
    });
    return rows;
  }
  $('#k-csv').addEventListener('click', function () {
    var p = partyById(ui.pid); if (!p) return;
    flush();
    var rows = statementRows(p);
    rows.unshift([t('statement_title'), csvSafe(pname(p)), csvSafe(p.phone), t(p.type), '', ''], []);
    EDU.download('khata-' + safeName(pname(p)) + '-' + todayStr() + '.csv', EDU.csv.stringify(rows), 'text/csv');
  });
  function allEntriesRows(filterYm) {
    var rows = [[t('col_date'), t('col_name'), t('col_phone'), t('col_type'), t('col_kind'), t('col_amount'), t('col_note'), t('col_due')]];
    entries.slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : a.created - b.created; }).forEach(function (e) {
      if (filterYm && ymOf(e.date) !== filterYm) return;
      var p = partyById(e.pid); if (!p) return;
      rows.push([dmy(e.date), csvSafe(pname(p)), csvSafe(p.phone), t(p.type), t(e.kind === 'gave' ? 'kind_gave' : 'kind_got'), rupees(e.paise), csvSafe(enote(e)), e.due ? dmy(e.due) : '']);
    });
    return rows;
  }
  $('#bk-csv-all').addEventListener('click', function () {
    flush();
    var rows = allEntriesRows(null);
    rows.push([], [t('cash_title')], [t('col_date'), t('col_note'), t('col_in'), t('col_out')]);
    cash.slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : a.created - b.created; }).forEach(function (c) {
      rows.push([dmy(c.date), csvSafe(enote(c)), c.kind === 'in' ? rupees(c.paise) : '', c.kind === 'out' ? rupees(c.paise) : '']);
    });
    EDU.download('udhaar-khata-all-' + todayStr() + '.csv', EDU.csv.stringify(rows), 'text/csv');
  });
  function printAs(cls) {
    flush(); renderTab();
    document.body.classList.add(cls);
    setTimeout(function () { window.print(); }, 60);
  }
  window.addEventListener('afterprint', function () { document.body.classList.remove('pr-khata', 'pr-cash', 'pr-sum'); });
  window.addEventListener('beforeprint', function () {
    if (!document.body.className.match(/pr-/)) document.body.classList.add(meta.tab === 'khata' && ui.pid ? 'pr-khata' : meta.tab === 'cash' ? 'pr-cash' : meta.tab === 'sum' ? 'pr-sum' : 'pr-khata');
  });
  $('#k-print').addEventListener('click', function () { printAs('pr-khata'); });
  $('#c-print').addEventListener('click', function () { printAs('pr-cash'); });
  $('#s-print').addEventListener('click', function () { printAs('pr-sum'); });

  /* ---------------- cash book ---------------- */
  function cashSorted() { return cash.slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : a.created - b.created; }); }
  function cashBefore(date) { var s = meta.cashStart; cash.forEach(function (c) { if (c.date < date) s += c.kind === 'in' ? c.paise : -c.paise; }); return s; }
  function renderCash() {
    var d = ui.cashDate, today = todayStr();
    $('#c-date').value = d;
    $('#c-long').textContent = dmy(d) + (d === today ? ' · ' + t('today') : '');
    $('#cph-shop').textContent = meta.shop || t('wa_shop_default');
    $('#cph-date').textContent = dmy(d);
    var open = cashBefore(d), tin = 0, tout = 0, run = open, h = '', day = cashSorted().filter(function (c) { return c.date === d; });
    day.forEach(function (c) { if (c.kind === 'in') tin += c.paise; else tout += c.paise; });
    $('#c-open-v').textContent = money(open);
    $('#c-in-v').textContent = money(tin);
    $('#c-out-v').textContent = money(tout);
    $('#c-close-v').textContent = money(open + tin - tout);
    $('#c-empty').hidden = day.length > 0;
    if (!day.length) { $('#c-table').innerHTML = ''; return; }
    h += '<thead><tr><th scope="col">' + esc(t('col_date')) + '</th><th scope="col">' + esc(t('col_note')) + '</th><th scope="col" class="g">' + esc(t('col_in')) + '</th><th scope="col" class="r">' + esc(t('col_out')) + '</th><th scope="col" class="b">' + esc(t('col_bal')) + '</th><th scope="col" class="a no-print"><span class="sr-only">' + esc(t('edit')) + '</span></th></tr></thead><tbody>';
    h += '<tr><td class="d">' + dmy(d) + '</td><td class="n">' + esc(t('opening')) + '</td><td class="g"></td><td class="r"></td><td class="b' + (run < 0 ? ' neg' : '') + '">' + esc(money(run)) + '</td><td class="a no-print"></td></tr>';
    day.forEach(function (c) {
      run += c.kind === 'in' ? c.paise : -c.paise;
      h += '<tr data-cid="' + esc(c.id) + '"' + (c.nk ? ' class="sample"' : '') + '><td class="d">' + dmy(c.date) + '</td><td class="n"><span class="no-i18n">' + esc(enote(c) || t(c.kind === 'in' ? 'cash_in' : 'cash_out')) + '</span></td>' +
        '<td class="g">' + (c.kind === 'in' ? esc(money(c.paise)) : '') + '</td><td class="r">' + (c.kind === 'out' ? esc(money(c.paise)) : '') + '</td>' +
        '<td class="b' + (run < 0 ? ' neg' : '') + '">' + esc(money(run)) + '</td>' +
        '<td class="a no-print"><button type="button" class="btn btn-ghost edit" aria-label="' + esc(t('edit')) + '" title="' + esc(t('edit')) + '">✎</button></td></tr>';
    });
    h += '</tbody><tfoot><tr><td class="hide-m"></td><td>' + esc(t('closing')) + '</td><td class="g">' + esc(money(tin)) + '</td><td class="r">' + esc(money(tout)) + '</td><td class="b' + (run < 0 ? ' neg' : '') + '">' + esc(money(run)) + '</td><td class="a no-print"></td></tr></tfoot>';
    $('#c-table').innerHTML = h;
  }
  function goCashDate(s) { if (!parseDate(s)) return; ui.cashDate = s; closeCashForm(); renderCash(); }
  $('#c-date').addEventListener('change', function () { if (parseDate(this.value)) goCashDate(this.value); });
  $('#c-date').addEventListener('blur', function () { if (!parseDate(this.value)) this.value = ui.cashDate; });
  $('#c-prev').addEventListener('click', function () { goCashDate(addDays(ui.cashDate, -1)); });
  $('#c-next').addEventListener('click', function () { goCashDate(addDays(ui.cashDate, 1)); });
  $('#c-today').addEventListener('click', function () { goCashDate(todayStr()); });

  function openCashForm(kind, c) {
    ui.editCash = c || null; ui.cashKind = kind;
    $('#o-form').hidden = true;
    var f = $('#c-form'); f.hidden = false;
    $('#c-title').textContent = c ? t('c_edit') : t(kind === 'in' ? 'c_new_in' : 'c_new_out');
    $('#c-amt').value = c ? rupees(c.paise).replace(/\.00$/, '') : '';
    $('#c-note').value = c ? enote(c) : '';
    $('#c-delete').hidden = !c;
    $('#c-err').hidden = true;
    syncCashKind();
    $('#c-amt').focus();
  }
  function syncCashKind() { $$('#c-kind button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === ui.cashKind)); }); }
  function closeCashForm() { $('#c-form').hidden = true; $('#o-form').hidden = true; ui.editCash = null; }
  $$('#c-kind button').forEach(function (b) { b.addEventListener('click', function () { ui.cashKind = b.dataset.v; syncCashKind(); }); });
  $('#c-in').addEventListener('click', function () { openCashForm('in'); });
  $('#c-out').addEventListener('click', function () { openCashForm('out'); });
  $('#c-cancel').addEventListener('click', function () { closeCashForm(); $('#c-in').focus(); });
  $('#c-form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var a = parsePaise($('#c-amt').value), err = $('#c-err');
    if (a.empty) { err.hidden = false; err.textContent = t('err_amt_empty'); $('#c-amt').focus(); return; }
    if (a.err) { err.hidden = false; err.textContent = t(a.err); $('#c-amt').focus(); return; }
    var note = str($('#c-note').value, 120);
    if (ui.editCash) {
      var c = ui.editCash, before = clone(c);
      c.kind = ui.cashKind; c.paise = a.paise;
      if (!(c.nk && note === t('sample_n' + c.nk))) { c.note = note; c.nk = 0; c.sample = false; }
      touch('cash');
      pushUndo(t('entry_saved'), function () { replaceById(cash, before); });
    } else {
      cash.push({ id: uid(), kind: ui.cashKind, paise: a.paise, date: ui.cashDate, note: note, nk: 0, sample: false, created: Date.now() });
      touch('cash');
      EDU.toast(t('entry_saved'));
    }
    closeCashForm(); renderCash(); $('#c-in').focus();
  });
  $('#c-delete').addEventListener('click', function () {
    var c = ui.editCash; if (!c) return;
    var gone = clone(c);
    removeById(cash, c.id); touch('cash');
    closeCashForm();
    pushUndo(t('entry_deleted'), function () { cash.push(gone); });
    renderCash(); $('#c-in').focus();
  });
  $('#c-table').addEventListener('click', function (e) {
    var b = e.target.closest('.edit'); if (!b) return;
    var id = b.closest('tr').getAttribute('data-cid'), c = cash.filter(function (x) { return x.id === id; })[0];
    if (c) openCashForm(c.kind, c);
  });
  /* opening balance of the shown day: earlier days are shifted so this day opens with the typed amount */
  $('#c-open').addEventListener('click', function () {
    closeCashForm();
    var f = $('#o-form'); f.hidden = false;
    $('#o-hint').textContent = t('set_opening_hint', { date: dmy(ui.cashDate) });
    $('#o-amt').value = rupees(cashBefore(ui.cashDate)).replace(/\.00$/, '');
    $('#o-err').hidden = true;
    $('#o-amt').focus();
  });
  $('#o-cancel').addEventListener('click', function () { closeCashForm(); $('#c-open').focus(); });
  $('#o-form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var raw = asciiDigits($('#o-amt').value).trim(), neg = /^-/.test(raw.replace(/[\s₹]/g, ''));
    var a = raw.replace(/[\s₹]/g, '') === '' || raw.replace(/[\s₹]/g, '') === '0' ? { paise: 0 } : parsePaise(raw.replace(/^-/, ''));
    if (a.err) { $('#o-err').hidden = false; $('#o-err').textContent = t(a.err); return; }
    var want = (neg ? -1 : 1) * (a.paise || 0), before = meta.cashStart;
    meta.cashStart = before + (want - cashBefore(ui.cashDate)); meta.sampleCash = false;
    touch('meta');
    closeCashForm();
    pushUndo(t('entry_saved'), function () { meta.cashStart = before; touch('meta'); });
    renderCash();
  });
  $('#c-csv').addEventListener('click', function () {
    flush();
    var ym = ymOf(ui.cashDate), first = ym + '-01', run = cashBefore(first);
    var rows = [[t('col_date'), t('col_note'), t('col_in'), t('col_out'), t('col_bal')], [dmy(first), t('opening'), '', '', rupees(run)]];
    cashSorted().forEach(function (c) {
      if (ymOf(c.date) !== ym) return;
      run += c.kind === 'in' ? c.paise : -c.paise;
      rows.push([dmy(c.date), csvSafe(enote(c)), c.kind === 'in' ? rupees(c.paise) : '', c.kind === 'out' ? rupees(c.paise) : '', rupees(run)]);
    });
    EDU.download('cash-book-' + ym + '.csv', EDU.csv.stringify(rows), 'text/csv');
  });

  /* ---------------- monthly summary ---------------- */
  function renderSum() {
    var y = ui.ym[0], m = ui.ym[1], ym = y + '-' + pad(m + 1), today = todayStr();
    $('#s-label').textContent = monthLabel(y, m);
    var gave = 0, got = 0, ng = 0, nr = 0, cin = 0, cout = 0;
    var es = entries.filter(function (e) { return ymOf(e.date) === ym; }).sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : a.created - b.created; });
    es.forEach(function (e) { if (e.kind === 'gave') { gave += e.paise; ng++; } else { got += e.paise; nr++; } });
    cash.forEach(function (c) { if (ymOf(c.date) === ym) { if (c.kind === 'in') cin += c.paise; else cout += c.paise; } });
    $('#s-gave').textContent = money(gave); $('#s-gave-n').textContent = t('n_entries', { n: EDU.fmt(ng) });
    $('#s-got').textContent = money(got); $('#s-got-n').textContent = t('n_entries', { n: EDU.fmt(nr) });
    $('#s-net').textContent = money(gave - got);
    $('#s-cin').textContent = money(cin); $('#s-cout').textContent = money(cout);

    var S = allStats(), od = [], top = [];
    parties.forEach(function (p) { var s = S[p.id]; if (s.overdue) od.push([p, s]); if (s.bal > 0) top.push([p, s]); });
    od.sort(function (a, b) { return a[1].due < b[1].due ? -1 : 1; });
    top.sort(function (a, b) { return b[1].bal - a[1].bal; });
    function mini(p, s, extra, cls) {
      return '<button type="button" class="prow' + (p.type === 'supplier' ? ' sup' : '') + '" data-pid="' + esc(p.id) + '"><span class="avatar" aria-hidden="true">' + esc(initial(pname(p))) + '</span>' +
        '<span class="pinfo"><span class="pname no-i18n">' + esc(pname(p)) + '</span><span class="psub">' + esc(extra).replace(/\d{2}-\d{2}-\d{4}/g, function (m) { return numHtml(m); }) + '</span></span>' +
        '<span class="pbal"><b class="' + cls + '">' + esc(moneyAbs(s.bal)) + '</b></span></button>';
    }
    $('#s-overdue-n').textContent = EDU.fmt(od.length);
    $('#s-overdue').innerHTML = od.length ? od.map(function (x) { return mini(x[0], x[1], dueText(x[1], today), 'late'); }).join('') : '<p class="muted small mb0">' + esc(t('s_no_overdue')) + '</p>';
    $('#s-top').innerHTML = top.length ? top.slice(0, 5).map(function (x) { return mini(x[0], x[1], x[1].last ? t('last_entry', { date: dmy(x[1].last) }) : '', 'get'); }).join('') : '<p class="muted small mb0">' + esc(t('s_none')) + '</p>';

    $('#s-empty').hidden = es.length > 0;
    if (!es.length) { $('#s-table').innerHTML = ''; return; }
    var h = '<thead><tr><th scope="col">' + esc(t('col_date')) + '</th><th scope="col">' + esc(t('col_name')) + '</th><th scope="col" class="g">' + esc(t('col_gave')) + '</th><th scope="col" class="r">' + esc(t('col_got')) + '</th><th scope="col" class="b">' + esc(t('col_note')) + '</th></tr></thead><tbody>';
    es.forEach(function (e) {
      var p = partyById(e.pid); if (!p) return;
      h += '<tr data-pid="' + esc(p.id) + '"><td class="d">' + dmy(e.date) + '</td><td class="n"><span class="no-i18n">' + esc(pname(p)) + '</span></td>' +
        '<td class="g">' + (e.kind === 'gave' ? esc(money(e.paise)) : '') + '</td><td class="r">' + (e.kind === 'got' ? esc(money(e.paise)) : '') + '</td><td class="b"><span class="no-i18n">' + esc(enote(e)) + '</span></td></tr>';
    });
    h += '</tbody><tfoot><tr><td class="hide-m"></td><td>' + esc(t('total')) + '</td><td class="g">' + esc(money(gave)) + '</td><td class="r">' + esc(money(got)) + '</td><td class="b"></td></tr></tfoot>';
    $('#s-table').innerHTML = h;
  }
  function shiftMonth(k) {
    var y = ui.ym[0], m = ui.ym[1] + k;
    if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }
    ui.ym = [y, m]; renderSum();
  }
  $('#s-prev').addEventListener('click', function () { shiftMonth(-1); });
  $('#s-next').addEventListener('click', function () { shiftMonth(1); });
  $('#p-sum').addEventListener('click', function (e) {
    var b = e.target.closest('.prow'); if (!b) return;
    setTab('khata'); openParty(b.getAttribute('data-pid'));
  });
  $('#s-csv').addEventListener('click', function () {
    flush();
    var ym = ui.ym[0] + '-' + pad(ui.ym[1] + 1);
    EDU.download('udhaar-khata-' + ym + '.csv', EDU.csv.stringify(allEntriesRows(ym)), 'text/csv');
  });

  /* ---------------- settings: shop details ---------------- */
  function renderSettings() {
    if (document.activeElement !== $('#st-shop')) $('#st-shop').value = meta.shop;
    if (document.activeElement !== $('#st-upi')) $('#st-upi').value = meta.upi;
    if (document.activeElement !== $('#st-phone')) $('#st-phone').value = meta.phone;
    $('#st-upi-warn').hidden = !meta.upi || VPA_RE.test(meta.upi);
    var sel = $('#st-lang'); sel.innerHTML = '';
    sel.appendChild(el('option', { value: '', text: t('st_lang_auto') }));
    EDU.LANGS.forEach(function (l) { sel.appendChild(el('option', { value: l.code, text: l.native })); });
    sel.value = meta.remindLang;
    $('#bk-last').textContent = meta.lastBackup ? t('bk_last', { date: dmy(ymd(new Date(meta.lastBackup))) }) : t('bk_never');
    $('#rm-samples').hidden = !hasSamples();
    $('#pin-status').textContent = meta.pin ? t('pin_on') : t('pin_off');
    $('#pin-set').textContent = meta.pin ? t('pin_change') : t('pin_set');
    $('#pin-remove').hidden = !meta.pin;
    renderStorage();
  }
  $('#st-shop').addEventListener('input', function () { meta.shop = this.value.slice(0, 60); touch('meta'); });
  $('#st-upi').addEventListener('input', function () { meta.upi = this.value.trim().slice(0, 100); $('#st-upi-warn').hidden = !meta.upi || VPA_RE.test(meta.upi); touch('meta'); });
  $('#st-upi').addEventListener('blur', function () { var v = this.value.trim().toLowerCase(); if (v !== this.value) { this.value = v; meta.upi = v; touch('meta'); } $('#st-upi-warn').hidden = !meta.upi || VPA_RE.test(meta.upi); });
  $('#st-phone').addEventListener('input', function () { meta.phone = this.value.slice(0, 20); touch('meta'); });
  $('#st-lang').addEventListener('change', function () { meta.remindLang = langOk(this.value); touch('meta'); });

  /* ---------------- storage meter + persistence ---------------- */
  var persistState = 'unknown';
  function renderStorage() {
    var used = usedChars(), pct = Math.min(100, Math.round(used * 100 / STORE_LIMIT));
    var bar = $('#store-bar');
    bar.querySelector('span').style.width = Math.max(1, pct) + '%';
    bar.setAttribute('aria-valuenow', String(pct));
    bar.classList.toggle('hot', pct >= 80);
    $('#store-txt').textContent = t('store_used', { kb: EDU.fmt(Math.round(used / 1024)), n: EDU.fmt(entries.length + cash.length) });
    $('#persist-txt').textContent = t(persistState === 'yes' ? 'persist_yes' : persistState === 'no' ? 'persist_no' : 'persist_unknown');
    var q = $('#quota-warn');
    if (saveWarned) { q.hidden = false; $('#quota-txt').textContent = t('save_failed'); }
    else if (pct >= 80) { q.hidden = false; $('#quota-txt').textContent = t('store_warn'); }
    else if (!saveWarned) q.hidden = true;
  }
  function askPersist() {
    try {
      if (navigator.storage && navigator.storage.persisted) {
        navigator.storage.persisted().then(function (on) {
          if (on) { persistState = 'yes'; return; }
          return navigator.storage.persist().then(function (ok) { persistState = ok ? 'yes' : 'no'; });
        }).catch(function () { }).then(function () { if (meta.tab === 'set') renderStorage(); });
      }
    } catch (e) { }
  }

  /* ---------------- backup / restore ---------------- */
  function backupPayload() {
    flush();
    return { app: SLUG, version: 1, saved: new Date().toISOString(),
      meta: { shop: meta.shop, upi: meta.upi, phone: meta.phone, remindLang: meta.remindLang, cashStart: meta.cashStart, sampleCash: meta.sampleCash },
      parties: parties, entries: entries, cash: cash };
  }
  function markBackedUp() {
    meta.lastBackup = Date.now(); meta.changed = false; meta.snooze = 0; touch('meta');
    renderSettings(); renderReminder();
    EDU.toast(t('bk_done'));
  }
  $('#bk-json').addEventListener('click', function () {
    EDU.download('udhaar-khata-backup-' + todayStr() + '.json', JSON.stringify(backupPayload()), 'application/json');
    markBackedUp();
  });

  /* WebCrypto: PBKDF2 (SHA-256) -> AES-GCM 256 */
  var subtle = (window.crypto && window.crypto.subtle) || null;
  function b64(bytes) { var s = ''; for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s); }
  function unb64(s) { var bin = atob(String(s || '')), out = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
  function rnd(n) { var a = new Uint8Array(n); window.crypto.getRandomValues(a); return a; }
  function deriveKey(pass, salt, iter) {
    return subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']).then(function (k) {
      return subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: iter, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    });
  }
  function encryptBackup(obj, pass) {
    var salt = rnd(16), iv = rnd(12);
    return deriveKey(pass, salt, PBKDF2_ITER).then(function (key) {
      return subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(JSON.stringify(obj)));
    }).then(function (buf) {
      return { app: SLUG, version: 1, enc: 1, saved: new Date().toISOString(), kdf: { name: 'PBKDF2', hash: 'SHA-256', iter: PBKDF2_ITER, salt: b64(salt) }, iv: b64(iv), data: b64(new Uint8Array(buf)) };
    });
  }
  function decryptBackup(file, pass) {
    var iter = +(file.kdf && file.kdf.iter) || PBKDF2_ITER;
    if (iter > 5000000) iter = PBKDF2_ITER;
    return deriveKey(pass, unb64(file.kdf && file.kdf.salt), iter).then(function (key) {
      return subtle.decrypt({ name: 'AES-GCM', iv: unb64(file.iv) }, key, unb64(file.data));
    }).then(function (buf) { return JSON.parse(new TextDecoder().decode(buf)); });
  }
  /* passphrase modal -> Promise<string|null> */
  function askPassphrase(hintKey, minLen) {
    return new Promise(function (resolve) {
      var done = false;
      var inp = el('input', { type: 'password', id: 'pp-input', class: 'no-i18n', dir: 'ltr', autocomplete: 'off', placeholder: t('pp_ph'), maxlength: '200' });
      var err = el('p', { class: 'small mb0', style: { color: 'var(--danger)' }, 'aria-live': 'polite' });
      var f = el('form', { class: 'stack' }, el('p', { class: 'small muted mb0', text: t(hintKey) }), el('label', { class: 'field' }, el('span', { text: t('pp_ph') }), inp), err,
        el('div', { class: 'row' }, el('button', { type: 'submit', class: 'btn btn-primary', id: 'pp-ok', text: t('done') }),
          el('button', { type: 'button', class: 'btn', id: 'pp-cancel', text: t('cancel'), onclick: function () { if (closeModal) closeModal(); } })));
      f.addEventListener('submit', function (ev) {
        ev.preventDefault();
        if (minLen && inp.value.length < minLen) { err.textContent = t('pp_short'); inp.focus(); return; }
        done = true; var v = inp.value; if (closeModal) closeModal(); resolve(v);
      });
      if (closeModal) closeModal();
      closeModal = EDU.modal(f, { title: t('pp_title'), onClose: function () { closeModal = null; if (!done) resolve(null); } });
      setTimeout(function () { inp.focus(); }, 30);
    });
  }
  $('#bk-enc').addEventListener('click', function () {
    if (!subtle) { EDU.toast(t('pp_unsupported'), 5000); return; }
    askPassphrase('pp_set_hint', 8).then(function (pass) {
      if (!pass) return;
      return encryptBackup(backupPayload(), pass).then(function (file) {
        EDU.download('udhaar-khata-backup-' + todayStr() + '.encrypted.json', JSON.stringify(file), 'application/json');
        markBackedUp();
      });
    }).catch(function () { EDU.toast(t('pp_unsupported'), 5000); });
  });
  function restoreFrom(obj) {
    if (!obj || obj.app !== SLUG || !Array.isArray(obj.parties)) { EDU.toast(t('restore_bad'), 4000); return; }
    var c = cleanAll(obj.parties, obj.entries, obj.cash);
    if (!confirm(t('confirm_restore', { p: EDU.fmt(c.parties.length), e: EDU.fmt(c.entries.length + c.cash.length) }))) return;
    flush();
    var m = obj.meta && typeof obj.meta === 'object' ? obj.meta : {};
    parties = c.parties; entries = c.entries; cash = c.cash;
    meta.shop = str(m.shop, 60); meta.upi = str(m.upi, 100); meta.phone = str(m.phone, 20); meta.remindLang = langOk(m.remindLang);
    meta.cashStart = Number.isFinite(+m.cashStart) ? Math.round(+m.cashStart) : 0; meta.sampleCash = m.sampleCash === true;
    ui.pid = null; undoStack = []; $('#undo-bar').hidden = true;
    dirty.parties = dirty.entries = dirty.cash = dirty.meta = 1;
    meta.changed = false; meta.lastBackup = meta.lastBackup || Date.now();
    flush();
    renderAll();
    EDU.toast(t('restore_ok', { p: EDU.fmt(parties.length), e: EDU.fmt(entries.length + cash.length) }), 4000);
  }
  $('#bk-restore').addEventListener('click', function () {
    EDU.pickFile('.json,application/json').then(function (f) {
      if (!f) return;
      return EDU.readText(f).then(function (txt) {
        var obj = null;
        try { obj = JSON.parse(String(txt).replace(/^﻿/, '')); } catch (e) { obj = null; }
        if (obj && obj.enc) {
          if (!subtle) { EDU.toast(t('pp_unsupported'), 5000); return; }
          return askPassphrase('pp_open_hint', 0).then(function (pass) {
            if (pass === null) return;
            return decryptBackup(obj, pass).then(restoreFrom, function () { EDU.toast(t('pp_wrong'), 4000); });
          });
        }
        restoreFrom(obj);
      });
    }).catch(function () { EDU.toast(t('restore_bad'), 4000); });
  });

  /* backup reminder: real entries, something changed, 7+ days since the last backup (or since first use) */
  function backupDueDays() {
    if (!hasRealData() || !meta.changed) return 0;
    var ref = Math.max(meta.lastBackup || 0, meta.firstUse || 0);
    var days = Math.floor((Date.now() - ref) / 86400000);
    if (days < BACKUP_DAYS) return 0;
    if (meta.snooze && Date.now() < meta.snooze) return 0;
    return days;
  }
  function renderReminder() {
    var d = backupDueDays(), box = $('#bk-remind');
    box.hidden = !d;
    if (d) $('#bk-remind-txt').textContent = meta.lastBackup ? t('bk_remind_days', { n: EDU.fmt(d) }) : t('bk_remind_never', { n: EDU.fmt(d) });
  }
  $('#bk-remind-go').addEventListener('click', function () { setTab('set'); $('#bk-json').focus(); });
  $('#quota-go').addEventListener('click', function () { setTab('set'); $('#bk-json').focus(); });
  $('#bk-remind-later').addEventListener('click', function () { meta.snooze = Date.now() + 86400000; touch('meta'); renderReminder(); });

  /* ---------------- PIN (privacy screen, not encryption) ---------------- */
  function hashPin(pin, salt) {
    var txt = salt + ':' + pin;
    if (subtle) {
      return subtle.digest('SHA-256', new TextEncoder().encode(txt)).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
      }).catch(function () { return sha256Hex(txt); });
    }
    return Promise.resolve(sha256Hex(txt));
  }
  /* small pure-JS SHA-256 (FIPS 180-4) for pages without crypto.subtle (plain http on a LAN); same hex as the WebCrypto path,
     so a PIN set on https or file:// still opens there and nobody is locked out of their khata */
  function sha256Hex(str) {
    var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var bytes = new TextEncoder().encode(str), l = bytes.length, padLen = ((l + 9 + 63) >> 6) << 6, m = new Uint8Array(padLen);
    m.set(bytes); m[l] = 0x80;
    var bits = l * 8; m[padLen - 4] = (bits >>> 24) & 255; m[padLen - 3] = (bits >>> 16) & 255; m[padLen - 2] = (bits >>> 8) & 255; m[padLen - 1] = bits & 255;
    var w = new Array(64), rotr = function (x, n) { return (x >>> n) | (x << (32 - n)); };
    for (var off = 0; off < padLen; off += 64) {
      for (var i = 0; i < 16; i++) w[i] = (m[off + i * 4] << 24) | (m[off + i * 4 + 1] << 16) | (m[off + i * 4 + 2] << 8) | m[off + i * 4 + 3];
      for (i = 16; i < 64; i++) { var s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10); w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0; }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (i = 0; i < 64; i++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25), ch = (e & f) ^ (~e & g), t1 = (h + S1 + ch + K[i] + w[i]) | 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22), maj = (a & b) ^ (a & c) ^ (b & c), t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0; H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    var out = '';
    for (var j = 0; j < 8; j++) out += ('00000000' + (H[j] >>> 0).toString(16)).slice(-8);
    return out;
  }
  function saltStr() { try { return b64(rnd(12)); } catch (e) { return Math.random().toString(36).slice(2); } }
  $('#pin-set').addEventListener('click', function () {
    var a = el('input', { type: 'password', id: 'pin-in1', class: 'pin-in no-i18n', inputmode: 'numeric', maxlength: '6', autocomplete: 'off' });
    var b = el('input', { type: 'password', id: 'pin-in2', class: 'pin-in no-i18n', inputmode: 'numeric', maxlength: '6', autocomplete: 'off' });
    var err = el('p', { class: 'small mb0', style: { color: 'var(--danger)' }, 'aria-live': 'polite' });
    var f = el('form', { class: 'stack' }, el('p', { class: 'small muted mb0', text: t('pin_help') }),
      el('label', { class: 'field' }, el('span', { text: t('pin_new') }), a), el('label', { class: 'field' }, el('span', { text: t('pin_again') }), b), err,
      el('div', { class: 'row' }, el('button', { type: 'submit', class: 'btn btn-primary', id: 'pin-ok', text: t('save') }), el('button', { type: 'button', class: 'btn', text: t('cancel'), onclick: function () { if (closeModal) closeModal(); } })));
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = asciiDigits(a.value);
      if (!/^\d{4,6}$/.test(v)) { err.textContent = t('pin_bad'); a.focus(); return; }
      if (v !== asciiDigits(b.value)) { err.textContent = t('pin_mismatch'); b.focus(); return; }
      var salt = saltStr();
      hashPin(v, salt).then(function (h) {
        meta.pin = { salt: salt, hash: h }; saveMeta();
        if (closeModal) closeModal();
        renderSettings(); renderDash();
        EDU.toast(t('pin_saved'));
      });
    });
    openModal(f, t(meta.pin ? 'pin_change' : 'pin_set'));
    setTimeout(function () { a.focus(); }, 30);
  });
  $('#pin-remove').addEventListener('click', function () { meta.pin = null; saveMeta(); renderSettings(); renderDash(); EDU.toast(t('pin_removed')); });
  function lock() {
    if (!meta.pin) return;
    $('#lock').hidden = false; document.body.classList.add('locked');
    $('#lock-pin').value = ''; $('#lock-err').textContent = '';
    setTimeout(function () { $('#lock-pin').focus(); }, 30);
  }
  function unlock() { $('#lock').hidden = true; document.body.classList.remove('locked'); }
  $('#lock-btn').addEventListener('click', lock);
  $('#lock-form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (!meta.pin) { unlock(); return; }
    var v = asciiDigits($('#lock-pin').value);
    hashPin(v, meta.pin.salt).then(function (h) {
      if (h === meta.pin.hash) { unlock(); renderAll(); }
      else { $('#lock-err').textContent = t('lock_wrong'); $('#lock-pin').value = ''; $('#lock-pin').focus(); }
    });
  });
  $('#lock-erase').addEventListener('click', function () { if (confirm(t('confirm_erase'))) { resetAll(); unlock(); } });
  document.addEventListener('keydown', function (e) {                    /* keep the focus inside the lock screen */
    if ($('#lock').hidden || e.key !== 'Tab') return;
    var f = $$('#lock input, #lock button, #lock summary'), i = f.indexOf(document.activeElement);
    e.preventDefault();
    f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
  });

  /* ---------------- samples, reset ---------------- */
  function removeSamples() {
    var goneP = clone(parties.filter(function (p) { return p.sample; })), ids = Object.create(null);
    goneP.forEach(function (p) { ids[p.id] = 1; });
    var goneE = clone(entries.filter(function (e) { return ids[e.pid]; })), goneC = clone(cash.filter(function (c) { return c.sample; })), start = meta.cashStart, sc = meta.sampleCash;
    parties = parties.filter(function (p) { return !p.sample; });
    entries = entries.filter(function (e) { return !ids[e.pid]; });
    cash = cash.filter(function (c) { return !c.sample; });
    if (meta.sampleCash) { meta.cashStart = 0; meta.sampleCash = false; }
    if (ui.pid && ids[ui.pid]) ui.pid = null;
    touch('parties'); touch('entries'); touch('cash'); touch('meta');
    pushUndo(t('samples_removed'), function () {
      goneP.forEach(function (p) { parties.push(p); }); goneE.forEach(function (e) { entries.push(e); }); goneC.forEach(function (c) { cash.push(c); });
      meta.cashStart = start; meta.sampleCash = sc; touch('meta');
    });
    renderAll();
  }
  $('#sample-remove').addEventListener('click', removeSamples);
  $('#rm-samples').addEventListener('click', removeSamples);
  function resetAll() {
    var tab = meta.tab;
    ['parties', 'entries', 'cash', 'meta'].forEach(function (k) { store.remove(k); });
    parties = []; entries = []; cash = []; undoStack = []; $('#undo-bar').hidden = true;
    meta = defaultsMeta(null); meta.tab = tab; meta.changed = true;
    ui.pid = null;
    dirty.parties = dirty.entries = dirty.cash = dirty.meta = 1; flush();
    renderAll();
  }
  $('#reset-btn').addEventListener('click', function () { if (confirm(t('confirm_reset'))) resetAll(); });

  /* ---------------- start ---------------- */
  load();
  (function () { var d = new Date(); ui.ym = [d.getFullYear(), d.getMonth()]; })();
  EDU.onLang(function () {
    if (closeModal) closeModal();
    renderAll();
    /* forms that are open mid-task keep their values; only their titles need the new language */
    if (!$('#e-form').hidden) $('#e-title').textContent = ui.editEntry ? t('e_edit') : t(ui.entryKind === 'gave' ? 'e_new_gave' : 'e_new_got');
    if (!$('#c-form').hidden) $('#c-title').textContent = ui.editCash ? t('c_edit') : t(ui.cashKind === 'in' ? 'c_new_in' : 'c_new_out');
    if (!$('#o-form').hidden) $('#o-hint').textContent = t('set_opening_hint', { date: dmy(ui.cashDate) });
  });
  renderDash();
  setTab(meta.tab);
  askPersist();
  if (meta.pin) lock();
  /* a tab left open overnight: the cash book moves to the new day if it was showing "today" */
  var shownToday = todayStr();
  function checkToday() { var now = todayStr(); if (now !== shownToday) { if (ui.cashDate === shownToday) ui.cashDate = now; shownToday = now; renderAll(); } }
  setInterval(checkToday, 60000);
  window.addEventListener('focus', checkToday);
})();
