/* Split Bill & Trip Expenses
   Groups of friends/family, expenses (equal / shares / exact / percent / restaurant items with GST + service
   charge), balances per member and the fewest payments to settle up, with UPI deep links and WhatsApp text.
   All money is kept in paise (integers) so every total reconciles to the paisa. Nothing leaves the device. */
(function () {
  'use strict';
  var SLUG = 'split-bill';
  var store = EDU.store(SLUG);
  var el = EDU.el, $ = EDU.$, $$ = EDU.$$;
  var MAX_MEMBERS = 30, MAX_AMOUNT_P = 100 * 1e7 * 100;   /* ₹100 crore */
  var MODES = ['equal', 'shares', 'exact', 'percent', 'items'];
  var COLORS = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c7', '--c6', '--c8'];

  /* ================================================================ i18n helpers */
  function isRtl() { return document.documentElement.dir === 'rtl'; }
  /* EDU.t, but in right-to-left pages every inserted value is wrapped in a first-strong isolate so Urdu
     sentences keep "₹1,598.50" and names in one piece */
  function t(key, vars) {
    if (vars && isRtl()) {
      var o = {};
      Object.keys(vars).forEach(function (k) { o[k] = '⁨' + vars[k] + '⁩'; });
      vars = o;
    }
    return EDU.t(key, vars);
  }
  function plain(s) { return String(s).replace(/[⁦-⁩]/g, ''); }
  /* translated template where {vars} become DOM nodes (bold names, amounts) */
  function tn(key, vars) {
    var frag = document.createDocumentFragment();
    EDU.t(key).split(/(\{\w+\})/).forEach(function (part) {
      var m = /^\{(\w+)\}$/.exec(part);
      if (!m) { if (part) frag.appendChild(document.createTextNode(part)); return; }
      var v = vars[m[1]];
      if (v === undefined || v === null) frag.appendChild(document.createTextNode(part));
      else frag.appendChild(v.nodeType ? v : el('bdi', { text: String(v) }));
    });
    return frag;
  }
  function nameNode(txt, cls) { return el('bdi', { class: 'no-i18n' + (cls ? ' ' + cls : ''), text: txt }); }

  /* ================================================================ money (paise) */
  var NF0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  var NF2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function rs(p) {
    p = Math.round(p || 0);
    var neg = p < 0; p = Math.abs(p);
    return (neg ? '−' : '') + '₹' + (p % 100 === 0 ? NF0.format(p / 100) : NF2.format(p / 100));
  }
  function rsNum(p) { return (Math.round(p) / 100).toFixed(2); }        /* "1598.50" for UPI am= and CSV */
  function fmtN(v, d) { return new Intl.NumberFormat('en-IN', { maximumFractionDigits: d === undefined ? 2 : d }).format(v); }
  var ZEROS = [0x966, 0x9E6, 0xA66, 0xAE6, 0xB66, 0xBE6, 0xC66, 0xCE6, 0xD66, 0x660, 0x6F0];
  function toLatin(s) {
    return String(s == null ? '' : s).replace(/[०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯٠-٩۰-۹]/g, function (c) {
      var code = c.charCodeAt(0);
      for (var i = 0; i < ZEROS.length; i++) if (code >= ZEROS[i] && code <= ZEROS[i] + 9) return String(code - ZEROS[i]);
      return c;
    });
  }
  /* "1,250", "₹1250.5", "Rs. 1,250/-", Devanagari digits -> paise. '' -> null, junk -> NaN */
  function parseMoney(s) {
    s = toLatin(s).replace(/[\s,₹]/g, '').replace(/^(rs\.?|inr)/i, '').replace(/\/[-=]$/, '').replace(/[٫]/g, '.');
    if (s === '') return null;
    if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
    return Math.round(parseFloat(s) * 100);
  }
  function parseNum(s) {
    s = toLatin(s).replace(/[\s,%]/g, '').replace(/[٫]/g, '.');
    if (s === '') return null;
    if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
    return parseFloat(s);
  }

  /* ================================================================ maths (pure) */
  /* Split totalP paise in proportion to weights; largest-remainder rounding so the parts always add up exactly. */
  function allocate(totalP, weights) {
    var n = weights.length, out = [], raw = [], sumW = 0, base = 0, i, w;
    for (i = 0; i < n; i++) { w = weights[i] > 0 ? +weights[i] : 0; sumW += w; out.push(0); raw.push(0); }
    totalP = Math.round(totalP || 0);
    if (!(sumW > 0) || totalP <= 0) return out;
    for (i = 0; i < n; i++) {
      w = weights[i] > 0 ? +weights[i] : 0;
      raw[i] = totalP * w / sumW;
      out[i] = Math.floor(raw[i] + 1e-9);
      base += out[i];
    }
    var rem = totalP - base, order = [];
    for (i = 0; i < n; i++) if (weights[i] > 0) order.push(i);
    order.sort(function (a, b) { return (raw[b] - out[b]) - (raw[a] - out[a]) || a - b; });
    for (i = 0; i < rem && order.length; i++) out[order[i % order.length]]++;
    return out;
  }
  /* Fewest transfers from net balances (paise, sum = 0): exact pairs first, then greedy largest-with-largest. */
  function settlePlan(net) {
    var debt = [], cred = [], out = [];
    Object.keys(net).forEach(function (id) {
      if (net[id] < 0) debt.push({ id: id, v: -net[id] });
      else if (net[id] > 0) cred.push({ id: id, v: net[id] });
    });
    debt.sort(function (a, b) { return b.v - a.v; }); cred.sort(function (a, b) { return b.v - a.v; });
    for (var i = 0; i < debt.length; i++) {               /* one payment clears both sides */
      for (var j = 0; j < cred.length; j++) {
        if (cred[j].v > 0 && cred[j].v === debt[i].v) { out.push({ from: debt[i].id, to: cred[j].id, amt: debt[i].v }); debt[i].v = 0; cred[j].v = 0; break; }
      }
    }
    debt = debt.filter(function (d) { return d.v > 0; }); cred = cred.filter(function (c) { return c.v > 0; });
    var a = 0, b = 0;
    while (a < debt.length && b < cred.length) {
      var amt = Math.min(debt[a].v, cred[b].v);
      out.push({ from: debt[a].id, to: cred[b].id, amt: amt });
      debt[a].v -= amt; cred[b].v -= amt;
      if (debt[a].v === 0) a++;
      if (cred[b].v === 0) b++;
    }
    return out;
  }
  /* Restaurant bill: items -> each person's subtotal; GST and service charge shared in proportion to it. */
  function itemsCalc(memberIds, items, gst, sc) {
    var sub = {}, subTotal = 0;
    memberIds.forEach(function (id) { sub[id] = 0; });
    (items || []).forEach(function (it) {
      var lineP = Math.round((it.priceP || 0) * (it.qty > 0 ? it.qty : 1));
      if (lineP <= 0) return;
      var who = (it.who || []).filter(function (id) { return memberIds.indexOf(id) >= 0; });
      if (!who.length) who = memberIds;
      var a = allocate(lineP, who.map(function () { return 1; }));
      who.forEach(function (id, i) { sub[id] += a[i]; });
      subTotal += lineP;
    });
    var gstP = Math.round(subTotal * (gst > 0 ? gst : 0) / 100), scP = Math.round(subTotal * (sc > 0 ? sc : 0) / 100);
    var order = memberIds.filter(function (id) { return sub[id] > 0; }), ws = order.map(function (id) { return sub[id]; });
    var ga = allocate(gstP, ws), sa = allocate(scP, ws), perTotal = {}, perGst = {}, perSc = {};
    order.forEach(function (id, i) { perGst[id] = ga[i]; perSc[id] = sa[i]; perTotal[id] = sub[id] + ga[i] + sa[i]; });
    return { sub: sub, subTotal: subTotal, gstP: gstP, scP: scP, totalP: subTotal + gstP + scP, perTotal: perTotal, perGst: perGst, perSc: perSc, order: order };
  }
  window.SPLIT = { allocate: allocate, settlePlan: settlePlan, itemsCalc: itemsCalc };

  /* ================================================================ state */
  var state = { groups: [], current: null };
  var seq = 0;
  function uid() { return (Date.now().toString(36) + (seq++).toString(36) + Math.random().toString(36).slice(2, 6)); }
  function isoDaysAgo(n) {
    var d = new Date(); d.setDate(d.getDate() - n);
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function makeExample() {
    var m1 = uid(), m2 = uid(), m3 = uid();
    var p = {}; p[m1] = 1; p[m2] = 1; p[m3] = 1;
    var sh = {}; sh[m1] = 2; sh[m2] = 1; sh[m3] = 1;
    var ex = {}; ex[m1] = 120000; ex[m3] = 120000;
    return {
      id: uid(), nameKey: 'ex_group', example: true,
      members: [{ id: m1, nameKey: 'ex_m1', upi: '' }, { id: m2, nameKey: 'ex_m2', upi: '' }, { id: m3, nameKey: 'ex_m3', upi: '' }],
      expenses: [
        { id: uid(), kind: 'expense', titleKey: 'ex_e1', payer: m1, amountP: 600000, date: isoDaysAgo(3), mode: 'equal', parts: p, created: 1 },
        { id: uid(), kind: 'expense', titleKey: 'ex_e2', payer: m3, amountP: 150000, date: isoDaysAgo(2), mode: 'shares', parts: sh, created: 2 },
        { id: uid(), kind: 'expense', titleKey: 'ex_e3', payer: m2, amountP: 124950, date: isoDaysAgo(2), mode: 'items', gst: 5, sc: 0, created: 3,
          items: [{ nameKey: 'ex_i1', priceP: 35000, qty: 2, who: [m1, m3] }, { nameKey: 'ex_i2', priceP: 25000, qty: 1, who: [m2] }, { nameKey: 'ex_i3', priceP: 8000, qty: 3, who: [m1, m2, m3] }] },
        { id: uid(), kind: 'expense', titleKey: 'ex_e4', payer: m2, amountP: 240000, date: isoDaysAgo(1), mode: 'exact', parts: ex, created: 4 }
      ]
    };
  }
  function newGroup(name) { return { id: uid(), name: name, members: [], expenses: [] }; }
  function load() {
    var s = store.get('state', null);
    if (s && Array.isArray(s.groups) && s.groups.length) state = s;
    else { var g = makeExample(); state = { groups: [g], current: g.id }; }
    if (!cur()) state.current = state.groups[0].id;
  }
  function save() { store.set('state', state); }
  function cur() { for (var i = 0; i < state.groups.length; i++) if (state.groups[i].id === state.current) return state.groups[i]; return null; }
  function gName(g) { return g.nameKey ? EDU.t(g.nameKey) : g.name; }
  function mName(m) { return m.nameKey ? EDU.t(m.nameKey) : m.name; }
  function eTitle(e) { return e.titleKey ? EDU.t(e.titleKey) : (e.title || ''); }
  function iName(it) { return it.nameKey ? EDU.t(it.nameKey) : (it.name || ''); }
  function member(g, id) { for (var i = 0; i < g.members.length; i++) if (g.members[i].id === id) return g.members[i]; return null; }
  function memberIds(g) { return g.members.map(function (m) { return m.id; }); }
  /* the sample group becomes the user's own the moment they change anything: names are frozen in the current language */
  function own(g) {
    if (!g.example && !g.nameKey) return;
    g.example = false;
    if (g.nameKey) { g.name = EDU.t(g.nameKey); delete g.nameKey; }
    g.members.forEach(function (m) { if (m.nameKey) { m.name = EDU.t(m.nameKey); delete m.nameKey; } });
    g.expenses.forEach(function (e) {
      if (e.titleKey) { e.title = EDU.t(e.titleKey); delete e.titleKey; }
      (e.items || []).forEach(function (it) { if (it.nameKey) { it.name = EDU.t(it.nameKey); delete it.nameKey; } });
    });
  }

  /* per-expense shares, from the stored data, every time (single source of truth) */
  function splitsOf(g, e) {
    var ids = memberIds(g), out = {};
    if (e.mode === 'items') {
      var r = itemsCalc(ids, e.items, e.gst, e.sc);
      return { splits: r.perTotal, amountP: r.totalP, calc: r };
    }
    var parts = e.parts || {};
    var pids = ids.filter(function (id) { return parts[id] > 0; });
    if (e.mode === 'exact') pids.forEach(function (id) { out[id] = Math.round(parts[id]); });
    else {
      var a = allocate(e.amountP, pids.map(function (id) { return e.mode === 'equal' ? 1 : parts[id]; }));
      pids.forEach(function (id, i) { out[id] = a[i]; });
    }
    return { splits: out, amountP: e.amountP };
  }
  function balances(g) {
    var ids = memberIds(g), paid = {}, share = {}, net = {}, spent = 0, count = 0;
    ids.forEach(function (id) { paid[id] = 0; share[id] = 0; });
    g.expenses.forEach(function (e) {
      var r = splitsOf(g, e);
      if (paid[e.payer] === undefined) return;             /* payer no longer in the group: ignore */
      paid[e.payer] += r.amountP;
      Object.keys(r.splits).forEach(function (id) { if (share[id] !== undefined) share[id] += r.splits[id]; });
      if (e.kind !== 'settle') { spent += r.amountP; count++; }
    });
    ids.forEach(function (id) { net[id] = paid[id] - share[id]; });
    return { paid: paid, share: share, net: net, spent: spent, count: count, plan: settlePlan(net) };
  }
  function memberUsage(g, id) {
    var n = 0;
    g.expenses.forEach(function (e) {
      if (e.payer === id) { n++; return; }
      if (e.mode === 'items') { if ((e.items || []).some(function (it) { return (it.who || []).indexOf(id) >= 0; })) n++; }
      else if ((e.parts || {})[id] > 0) n++;
    });
    return n;
  }

  /* ================================================================ dates */
  var DTF = {};
  function fmtDate(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
    var y = +iso.slice(0, 4), m = +iso.slice(5, 7) - 1, d = +iso.slice(8, 10), dt = new Date(y, m, d);
    if (isNaN(dt)) return '';
    var key = EDU.lang + (y === new Date().getFullYear() ? 's' : 'l');
    if (!DTF[key]) {
      var o = { day: 'numeric', month: 'short', numberingSystem: 'latn' };
      if (key.slice(-1) === 'l') o.year = 'numeric';
      try { DTF[key] = new Intl.DateTimeFormat(EDU.langInfo(EDU.lang).tag, o); } catch (e) { DTF[key] = new Intl.DateTimeFormat('en-IN', o); }
    }
    return DTF[key].format(dt);
  }

  /* ================================================================ UI: shell */
  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });
  load();

  var ui = {
    grpSel: $('#grpSel'), grpPanel: $('#grpPanel'), grpName: $('#grpName'), grpOk: $('#btnGrpOk'), exNote: $('#exNote'),
    stTotal: $('#stTotal'), stMembers: $('#stMembers'), stExpenses: $('#stExpenses'),
    memList: $('#memList'), memForm: $('#memForm'), memName: $('#memName'), memUpi: $('#memUpi'), memAdd: $('#btnAddMember'), memCancel: $('#btnMemCancel'), memMsg: $('#memMsg'),
    expForm: $('#expForm'), expFormTitle: $('#expFormTitle'), exTitle: $('#exTitle'), exAmount: $('#exAmount'), amountHint: $('#amountHint'), exPayer: $('#exPayer'), exDate: $('#exDate'),
    segMode: $('#segMode'), modeHint: $('#modeHint'), splitArea: $('#splitArea'), expMsg: $('#expMsg'), saveExp: $('#btnSaveExpense'), expList: $('#expList'), addExp: $('#btnAddExpense'),
    balList: $('#balList'), settleInfo: $('#settleInfo'), settleList: $('#settleList'), wa: $('#btnWaSummary'), canvas: $('#pngCanvas')
  };
  var grpMode = null;          /* 'new' | 'rename' */
  var memEdit = null;          /* member id being edited */
  var form = { open: false, editId: null, mode: 'equal', parts: {}, items: [], gst: '5', sc: '0' };
  var openDetails = {};        /* expense id -> details expanded */

  function colorOf(g, id) {
    var i = memberIds(g).indexOf(id);
    return 'var(' + COLORS[(i < 0 ? 0 : i) % COLORS.length] + ')';
  }
  function avatar(g, m, small) {
    var ch = (mName(m) || '?').trim().charAt(0).toUpperCase();
    return el('span', { class: 'avatar no-i18n', 'aria-hidden': 'true', style: { background: colorOf(g, m.id) }, text: ch });
  }
  function showMsg(box, msg) { box.textContent = msg || ''; }

  /* ---------------- group bar */
  function renderGroups() {
    var g = cur();
    ui.grpSel.innerHTML = '';
    state.groups.forEach(function (x) {
      var o = el('option', { value: x.id, text: gName(x) + (x.example ? ' · ' + EDU.t('example_badge') : '') });
      if (x.id === g.id) o.selected = true;
      ui.grpSel.appendChild(o);
    });
    ui.exNote.hidden = !g.example;
    var b = balances(g);
    ui.stTotal.textContent = rs(b.spent);
    ui.stMembers.textContent = EDU.fmt(g.members.length);
    ui.stExpenses.textContent = EDU.fmt(b.count);
    $('#btnDeleteGroup').disabled = false;
  }
  function openGrpPanel(mode) {
    grpMode = mode;
    ui.grpPanel.hidden = false;
    $('#grpPanelLbl').textContent = EDU.t(mode === 'new' ? 'lbl_group_name' : 'lbl_rename_to');
    ui.grpOk.textContent = EDU.t(mode === 'new' ? 'btn_create' : 'save');
    ui.grpName.value = mode === 'rename' ? gName(cur()) : '';
    ui.grpName.focus();
  }
  function closeGrpPanel() { grpMode = null; ui.grpPanel.hidden = true; }
  ui.grpSel.addEventListener('change', function () { state.current = ui.grpSel.value; closeForm(); closeGrpPanel(); save(); renderAll(); });
  $('#btnNewGroup').addEventListener('click', function () { openGrpPanel('new'); });
  $('#btnRenameGroup').addEventListener('click', function () { openGrpPanel('rename'); });
  $('#btnGrpCancel').addEventListener('click', closeGrpPanel);
  ui.grpPanel.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var name = ui.grpName.value.replace(/\s+/g, ' ').trim();
    if (!name) { ui.grpName.focus(); return; }
    if (grpMode === 'new') {
      if (state.groups.length >= 20) { EDU.toast(EDU.t('groups_max')); return; }
      var g = newGroup(name); state.groups.push(g); state.current = g.id; closeForm();
    } else { var c = cur(); own(c); c.name = name; }
    closeGrpPanel(); save(); renderAll();
  });
  $('#btnDeleteGroup').addEventListener('click', function () {
    var g = cur();
    if (!confirm(t('confirm_delete_group', { name: gName(g) }))) return;
    state.groups = state.groups.filter(function (x) { return x.id !== g.id; });
    if (!state.groups.length) state.groups.push(newGroup(EDU.t('group_default_name')));
    state.current = state.groups[0].id;
    closeForm(); save(); renderAll();
  });
  $('#btnMakeMine').addEventListener('click', function () {
    var g = newGroup(EDU.t('group_default_name'));
    state.groups.push(g); state.current = g.id; closeForm(); save(); renderAll();
    ui.memName.focus();
  });

  /* ---------------- members */
  function renderMembers() {
    var g = cur();
    ui.memList.innerHTML = '';
    if (!g.members.length) ui.memList.appendChild(el('p', { class: 'empty', text: EDU.t('no_members') }));
    g.members.forEach(function (m) {
      var row = el('div', { class: 'mem' + (memEdit === m.id ? ' editing' : ''), dataset: { member: m.id } },
        avatar(g, m),
        el('div', { class: 'mem-body' },
          el('div', { class: 'mem-name', text: mName(m) }),
          el('div', { class: 'mem-upi' + (m.upi ? '' : ' none'), dir: m.upi ? 'ltr' : null, text: m.upi || EDU.t('no_upi') })),
        el('button', { type: 'button', class: 'iconbtn', 'aria-label': t('aria_edit_member', { name: mName(m) }), title: EDU.t('edit'), text: '✎', onclick: function () { startEditMember(m.id); } }),
        el('button', { type: 'button', class: 'iconbtn danger', 'aria-label': t('aria_remove_member', { name: mName(m) }), title: EDU.t('delete'), text: '✕', onclick: function () { removeMember(m.id); } }));
      ui.memList.appendChild(row);
    });
    ui.memAdd.textContent = EDU.t(memEdit ? 'save' : 'btn_add_member');
    ui.memCancel.hidden = !memEdit;
    ui.addExp.disabled = !g.members.length;
  }
  function startEditMember(id) {
    var m = member(cur(), id); if (!m) return;
    memEdit = id; ui.memName.value = mName(m); ui.memUpi.value = m.upi || ''; showMsg(ui.memMsg, '');
    renderMembers(); ui.memName.focus();
  }
  function cancelEditMember() { memEdit = null; ui.memName.value = ''; ui.memUpi.value = ''; showMsg(ui.memMsg, ''); renderMembers(); }
  ui.memCancel.addEventListener('click', cancelEditMember);
  function cleanUpi(s) { return String(s || '').replace(/\s+/g, '').toLowerCase(); }
  var VPA_RE = /^[a-z0-9._-]{2,}@[a-z][a-z0-9.-]{1,}$/;
  ui.memForm.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var g = cur(), name = ui.memName.value.replace(/\s+/g, ' ').trim(), upi = cleanUpi(ui.memUpi.value);
    if (!name) { showMsg(ui.memMsg, EDU.t('err_name')); ui.memName.focus(); return; }
    if (upi && !VPA_RE.test(upi)) { showMsg(ui.memMsg, EDU.t('err_upi')); ui.memUpi.focus(); return; }
    var dup = g.members.some(function (m) { return m.id !== memEdit && mName(m).toLowerCase() === name.toLowerCase(); });
    if (dup) { showMsg(ui.memMsg, t('err_dup_member', { name: name })); ui.memName.focus(); return; }
    if (!memEdit && g.members.length >= MAX_MEMBERS) { showMsg(ui.memMsg, t('err_max_members', { n: MAX_MEMBERS })); return; }
    own(g);
    if (memEdit) { var m = member(g, memEdit); if (m) { m.name = name; m.upi = upi; } }
    else g.members.push({ id: uid(), name: name, upi: upi });
    memEdit = null; ui.memName.value = ''; ui.memUpi.value = ''; showMsg(ui.memMsg, '');
    if (form.open) syncFormMembers();
    save(); renderAll(); ui.memName.focus();
  });
  function removeMember(id) {
    var g = cur(), m = member(g, id); if (!m) return;
    var b = balances(g), net = b.net[id] || 0;
    if (net !== 0) { showMsg(ui.memMsg, t(net < 0 ? 'err_remove_owes' : 'err_remove_gets', { name: mName(m), amt: rs(Math.abs(net)) })); return; }
    var used = memberUsage(g, id);
    if (used) { showMsg(ui.memMsg, t('err_remove_used', { name: mName(m), n: EDU.fmt(used) })); return; }
    if (!confirm(t('confirm_remove_member', { name: mName(m) }))) return;
    own(g);
    g.members = g.members.filter(function (x) { return x.id !== id; });
    if (memEdit === id) cancelEditMember();
    showMsg(ui.memMsg, '');
    if (form.open) syncFormMembers();
    save(); renderAll();
  }

  /* ---------------- expense form */
  function openForm(editId) {
    var g = cur();
    if (!g.members.length) return;
    form.open = true; form.editId = editId || null;
    showMsg(ui.expMsg, '');
    if (editId) {
      var e = g.expenses.filter(function (x) { return x.id === editId; })[0];
      if (!e) return;
      form.mode = e.kind === 'settle' ? 'exact' : e.mode;
      form.parts = {}; Object.keys(e.parts || {}).forEach(function (k) { form.parts[k] = e.parts[k]; });
      form.items = (e.items || []).map(function (it) { return { name: iName(it), priceP: it.priceP, qty: it.qty, who: (it.who || []).slice() }; });
      form.gst = String(e.gst === undefined ? 5 : e.gst); form.sc = String(e.sc === undefined ? 0 : e.sc);
      ui.exTitle.value = e.kind === 'settle' ? t('settle_title', { from: mName(member(g, e.payer) || {}), to: mName(member(g, Object.keys(e.parts || {})[0]) || {}) }) : eTitle(e);
      ui.exAmount.value = e.mode === 'items' ? '' : rsNum(e.amountP).replace(/\.00$/, '');
      ui.exDate.value = e.date || '';
      fillPayer(g, e.payer);
    } else {
      form.mode = 'equal'; form.parts = {}; form.items = []; form.gst = '5'; form.sc = '0';
      ui.exTitle.value = ''; ui.exAmount.value = ''; ui.exDate.value = isoDaysAgo(0);
      fillPayer(g, g.members[0].id);
    }
    if (form.mode !== 'items') normaliseParts(g);
    ui.expFormTitle.textContent = EDU.t(editId ? 'f_edit_expense' : 'f_new_expense');
    ui.saveExp.textContent = EDU.t(editId ? 'save' : 'btn_save_expense');
    ui.expForm.hidden = false;
    renderModeSeg(); renderSplitArea();
    ui.exTitle.focus();
    if (editId) ui.expForm.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function closeForm() { form.open = false; form.editId = null; ui.expForm.hidden = true; showMsg(ui.expMsg, ''); }
  function fillPayer(g, selected) {
    ui.exPayer.innerHTML = '';
    g.members.forEach(function (m) { var o = el('option', { value: m.id, text: mName(m) }); if (m.id === selected) o.selected = true; ui.exPayer.appendChild(o); });
  }
  /* a fresh form: everyone takes part (equal 1 / shares 1 / percent split evenly / exact empty) */
  function normaliseParts(g) {
    var ids = memberIds(g), any = ids.some(function (id) { return form.parts[id] !== undefined; });
    if (any) return;
    ids.forEach(function (id) { form.parts[id] = (form.mode === 'exact') ? 0 : 1; });
    if (form.mode === 'percent') { var pct = Math.floor(10000 / ids.length) / 100; ids.forEach(function (id, i) { form.parts[id] = i === ids.length - 1 ? +(100 - pct * (ids.length - 1)).toFixed(2) : pct; }); }
  }
  function syncFormMembers() {       /* members added/removed while the form is open */
    var g = cur();
    fillPayer(g, ui.exPayer.value && member(g, ui.exPayer.value) ? ui.exPayer.value : (g.members[0] || {}).id);
    renderSplitArea();
  }
  function renderModeSeg() {
    $$('button', ui.segMode).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.mode === form.mode ? 'true' : 'false'); });
    ui.modeHint.textContent = EDU.t('hint_' + form.mode);
    var items = form.mode === 'items';
    ui.exAmount.disabled = items; ui.amountHint.hidden = !items;
    if (items) ui.exAmount.value = rsNum(itemsCalc(memberIds(cur()), form.items, parseNum(form.gst) || 0, parseNum(form.sc) || 0).totalP).replace(/\.00$/, '');
  }
  ui.segMode.addEventListener('click', function (ev) {
    var b = ev.target.closest('button[data-mode]'); if (!b) return;
    var next = b.dataset.mode; if (next === form.mode) return;
    var g = cur(), ids = memberIds(g), old = form.mode;
    form.mode = next;
    /* carry participation across modes: who was in, stays in */
    var np = {};
    ids.forEach(function (id) {
      var was = old === 'items' ? true : form.parts[id] > 0;
      if (next === 'equal' || next === 'shares') np[id] = was ? 1 : 0;
      else if (next === 'exact') np[id] = 0;
      else if (next === 'percent') np[id] = 0;
    });
    if (next === 'percent') {
      var inn = ids.filter(function (id) { return old === 'items' ? true : form.parts[id] > 0; });
      if (!inn.length) inn = ids;
      var pct = Math.floor(10000 / inn.length) / 100;
      inn.forEach(function (id, i) { np[id] = i === inn.length - 1 ? +(100 - pct * (inn.length - 1)).toFixed(2) : pct; });
    }
    if (next === 'exact') {               /* start from what an equal split would give, so only tweaks are needed */
      var amt = parseMoney(ui.exAmount.value), inn2 = ids.filter(function (id) { return old === 'items' ? true : form.parts[id] > 0; });
      if (amt > 0 && inn2.length) { var a = allocate(amt, inn2.map(function () { return 1; })); inn2.forEach(function (id, i) { np[id] = a[i]; }); }
    }
    form.parts = np;
    if (next === 'items' && !form.items.length) form.items.push({ name: '', priceP: 0, qty: 1, who: [] });
    showMsg(ui.expMsg, '');
    renderModeSeg(); renderSplitArea();
  });
  ui.exAmount.addEventListener('input', updatePreview);
  ui.exPayer.addEventListener('change', updatePreview);

  function renderSplitArea() {
    var g = cur(), ids = memberIds(g), area = ui.splitArea;
    area.innerHTML = '';
    if (form.mode === 'items') { renderItemsArea(g, area); return; }
    var rows = el('div', { class: 'split-rows', role: 'group', 'aria-label': EDU.t('participants') });
    g.members.forEach(function (m) {
      var row = el('div', { class: 'srow' + (form.mode === 'equal' ? '' : ' has-ctl'), dataset: { member: m.id } });
      var who = el('div', { class: 'who' }, avatar(g, m), el('span', { class: 'no-i18n', text: mName(m) }));
      if (form.mode === 'equal') {
        var cb = el('input', { type: 'checkbox', 'aria-label': mName(m) });
        cb.checked = form.parts[m.id] > 0;
        cb.addEventListener('change', function () { form.parts[m.id] = cb.checked ? 1 : 0; updatePreview(); });
        row.appendChild(el('label', { class: 'check-big' }, cb, avatar(g, m), el('span', { class: 'no-i18n', text: mName(m) })));
      } else {
        row.appendChild(who);
        var inp = el('input', { type: 'text', inputmode: 'decimal', dir: 'ltr', class: form.mode === 'exact' ? 'wide' : '', 'aria-label': mName(m) + ' · ' + EDU.t('mode_' + form.mode) });
        var v = form.parts[m.id];
        inp.value = form.mode === 'exact' ? (v > 0 ? rsNum(v).replace(/\.00$/, '') : '') : (v === undefined || v === null ? '' : String(v));
        inp.addEventListener('input', function () {
          var n = form.mode === 'exact' ? parseMoney(inp.value) : parseNum(inp.value);
          form.parts[m.id] = (n === null || isNaN(n)) ? 0 : n;
          inp.setAttribute('aria-invalid', isNaN(n) ? 'true' : 'false');
          updatePreview();
        });
        var unit = form.mode === 'exact' ? '₹' : form.mode === 'percent' ? '%' : EDU.t('unit_shares');
        row.appendChild(el('div', { class: 'ctl' }, form.mode === 'exact' ? el('span', { class: 'unit', text: unit }) : null, inp, form.mode !== 'exact' ? el('span', { class: 'unit', text: unit }) : null));
      }
      row.appendChild(el('div', { class: 'calc num', dataset: { calc: m.id } }));
      rows.appendChild(row);
    });
    area.appendChild(rows);
    area.appendChild(el('div', { class: 'split-tot', id: 'splitTot' }));
    updatePreview();
  }
  function previewSplits() {
    var g = cur(), ids = memberIds(g), amt = parseMoney(ui.exAmount.value);
    if (form.mode === 'items') { var r = itemsCalc(ids, form.items, parseNum(form.gst) || 0, parseNum(form.sc) || 0); return { splits: r.perTotal, amountP: r.totalP, calc: r }; }
    var out = {}, pids = ids.filter(function (id) { return form.parts[id] > 0; });
    if (form.mode === 'exact') { pids.forEach(function (id) { out[id] = Math.round(form.parts[id]); }); return { splits: out, amountP: amt }; }
    if (!(amt > 0)) return { splits: out, amountP: amt };
    var a = allocate(amt, pids.map(function (id) { return form.mode === 'equal' ? 1 : form.parts[id]; }));
    pids.forEach(function (id, i) { out[id] = a[i]; });
    return { splits: out, amountP: amt };
  }
  function updatePreview() {
    var g = cur(), p = previewSplits(), tot = $('#splitTot');
    if (form.mode === 'items') { renderBillSummary(p.calc); return; }
    $$('[data-calc]', ui.splitArea).forEach(function (c) {
      var id = c.dataset.calc, v = p.splits[id];
      c.textContent = v > 0 ? rs(v) : (form.parts[id] > 0 ? '' : '—');
      var row = c.closest('.srow'); if (row) row.classList.toggle('off', !(form.parts[id] > 0));
    });
    if (!tot) return;
    tot.innerHTML = '';
    var sum = 0, pids = memberIds(g).filter(function (id) { return form.parts[id] > 0; });
    if (form.mode === 'exact') {
      pids.forEach(function (id) { sum += Math.round(form.parts[id]); });
      var amt = parseMoney(ui.exAmount.value);
      if (amt > 0) {
        var diff = amt - sum;
        if (diff === 0) tot.appendChild(el('span', { class: 'good', text: '✓ ' + t('sum_matches', { amt: rs(sum) }) }));
        else if (diff > 0) {
          tot.appendChild(el('span', { class: 'warn', text: t('remaining', { amt: rs(diff) }) }));
          var payer = member(g, ui.exPayer.value);
          if (payer) tot.appendChild(el('button', { type: 'button', class: 'btn btn-sm', text: t('btn_give_rest', { name: mName(payer) }), onclick: function () { form.parts[payer.id] = (form.parts[payer.id] > 0 ? Math.round(form.parts[payer.id]) : 0) + diff; renderSplitArea(); } }));
        } else tot.appendChild(el('span', { class: 'warn', text: t('over_assigned', { amt: rs(-diff) }) }));
      } else tot.appendChild(el('span', { class: 'muted', text: t('sum_entered', { amt: rs(sum) }) }));
    } else if (form.mode === 'percent') {
      pids.forEach(function (id) { sum += form.parts[id]; });
      sum = Math.round(sum * 100) / 100;
      if (Math.abs(sum - 100) < 0.005) tot.appendChild(el('span', { class: 'good', text: '✓ 100%' }));
      else if (sum < 100) tot.appendChild(el('span', { class: 'warn', text: t('pct_remaining', { p: fmtN(100 - sum) }) }));
      else tot.appendChild(el('span', { class: 'warn', text: t('pct_over', { p: fmtN(sum - 100) }) }));
    } else {
      if (!pids.length) tot.appendChild(el('span', { class: 'warn', text: EDU.t('err_no_participants') }));
      else tot.appendChild(el('span', { class: 'muted', text: t('n_people_each', { n: EDU.fmt(pids.length), amt: p.amountP > 0 ? rs(Math.round(p.amountP / pids.length)) : '—' }) }));
    }
  }

  /* restaurant mode */
  function renderItemsArea(g, area) {
    var head = el('div', { class: 'items-head' }, el('span', { text: EDU.t('col_item') }), el('span', { text: EDU.t('col_price') }), el('span', { text: EDU.t('col_qty') }), el('span', { text: '' }));
    var list = el('div', { class: 'items', id: 'itemList' });
    form.items.forEach(function (it, idx) {
      var row = el('div', { class: 'item', dataset: { item: idx } });
      var nameI = el('input', { type: 'text', class: 'name no-i18n', maxlength: 40, placeholder: EDU.t('ph_item'), 'aria-label': EDU.t('col_item'), value: it.name || '' });
      nameI.addEventListener('input', function () { it.name = nameI.value; });
      var priceI = el('input', { type: 'text', class: 'price no-i18n', inputmode: 'decimal', dir: 'ltr', placeholder: '₹', 'aria-label': EDU.t('col_price'), value: it.priceP > 0 ? rsNum(it.priceP).replace(/\.00$/, '') : '' });
      priceI.addEventListener('input', function () { var n = parseMoney(priceI.value); it.priceP = n > 0 ? n : 0; priceI.setAttribute('aria-invalid', isNaN(n) ? 'true' : 'false'); updatePreview(); });
      var qtyI = el('input', { type: 'text', class: 'qty no-i18n', inputmode: 'decimal', dir: 'ltr', 'aria-label': EDU.t('col_qty'), value: it.qty > 0 ? String(it.qty) : '1' });
      qtyI.addEventListener('input', function () { var n = parseNum(qtyI.value); it.qty = n > 0 ? n : 0; updatePreview(); });
      var del = el('button', { type: 'button', class: 'iconbtn danger', 'aria-label': EDU.t('aria_remove_item'), text: '✕', onclick: function () { form.items.splice(idx, 1); renderSplitArea(); } });
      var chips = el('div', { class: 'who-chips' }, el('span', { class: 'lbl', text: EDU.t('col_who') }));
      g.members.forEach(function (m) {
        var on = it.who.indexOf(m.id) >= 0;
        var chip = el('button', { type: 'button', class: 'chip no-i18n', 'aria-pressed': on ? 'true' : 'false', text: mName(m), onclick: function () {
          var i = it.who.indexOf(m.id); if (i >= 0) it.who.splice(i, 1); else it.who.push(m.id);
          chip.setAttribute('aria-pressed', i >= 0 ? 'false' : 'true'); all.setAttribute('aria-pressed', it.who.length ? 'false' : 'true'); updatePreview();
        } });
        chips.appendChild(chip);
      });
      var all = el('button', { type: 'button', class: 'chip', 'aria-pressed': it.who.length ? 'false' : 'true', text: EDU.t('who_all'), onclick: function () { it.who = []; renderSplitArea(); } });
      chips.appendChild(all);
      row.appendChild(nameI); row.appendChild(priceI); row.appendChild(qtyI); row.appendChild(del); row.appendChild(chips);
      list.appendChild(row);
    });
    var addBtn = el('button', { type: 'button', class: 'btn btn-sm', id: 'btnAddItem', text: '＋ ' + EDU.t('btn_add_item'), onclick: function () {
      if (form.items.length >= 60) return;
      form.items.push({ name: '', priceP: 0, qty: 1, who: [] }); renderSplitArea();
      var last = $$('#itemList .item .name').pop(); if (last) last.focus();
    } });
    var gstI = el('input', { type: 'text', id: 'exGst', inputmode: 'decimal', dir: 'ltr', value: form.gst, 'aria-describedby': 'gstHint' });
    gstI.addEventListener('input', function () { form.gst = gstI.value; renderModeSeg(); updatePreview(); });
    var scI = el('input', { type: 'text', id: 'exSc', inputmode: 'decimal', dir: 'ltr', value: form.sc });
    scI.addEventListener('input', function () { form.sc = scI.value; renderModeSeg(); updatePreview(); });
    var tax = el('div', { class: 'tax-row' },
      el('div', { class: 'field' }, el('label', { for: 'exGst', text: EDU.t('f_gst') }), gstI, el('span', { class: 'hint', id: 'gstHint', text: EDU.t('gst_hint') })),
      el('div', { class: 'field' }, el('label', { for: 'exSc', text: EDU.t('f_service') }), scI));
    area.appendChild(head); area.appendChild(list);
    area.appendChild(el('div', { class: 'row' }, addBtn, el('span', { class: 'hint', text: EDU.t('items_unassigned_hint') })));
    area.appendChild(tax);
    area.appendChild(el('div', { class: 'bill-sum', id: 'billSum', 'aria-live': 'polite' }));
    updatePreview();
  }
  function renderBillSummary(c) {
    var g = cur(), box = $('#billSum'); if (!box) return;
    box.innerHTML = '';
    function line(label, v, cls) { box.appendChild(el('div', { class: cls || '' }, el('span', { text: label }), el('span', { class: 'num', text: rs(v) }))); }
    line(EDU.t('lbl_subtotal'), c.subTotal);
    line(t('lbl_gst_n', { p: fmtN(parseNum(form.gst) || 0) }), c.gstP);
    if (c.scP > 0 || parseNum(form.sc) > 0) line(t('lbl_service_n', { p: fmtN(parseNum(form.sc) || 0) }), c.scP);
    line(EDU.t('lbl_bill_total'), c.totalP, 'tot');
    c.order.forEach(function (id) {
      var m = member(g, id); if (!m) return;
      box.appendChild(el('div', { class: 'muted' }, el('span', {}, nameNode(mName(m)), document.createTextNode(' · ' + t('items_person_detail', { sub: rs(c.sub[id]), tax: rs(c.perGst[id] + c.perSc[id]) }))), el('span', { class: 'num', text: rs(c.perTotal[id]) })));
    });
    renderModeSeg();
  }

  ui.addExp.addEventListener('click', function () { if (form.open && !form.editId) closeForm(); else openForm(null); });
  $('#btnCancelExpense').addEventListener('click', closeForm);
  ui.expForm.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var g = cur(), ids = memberIds(g);
    var payer = member(g, ui.exPayer.value);
    if (!payer) { showMsg(ui.expMsg, EDU.t('err_payer')); return; }
    var title = ui.exTitle.value.replace(/\s+/g, ' ').trim();
    var date = /^\d{4}-\d{2}-\d{2}$/.test(ui.exDate.value) ? ui.exDate.value : isoDaysAgo(0);
    var e = { id: form.editId || uid(), kind: 'expense', title: title, payer: payer.id, date: date, mode: form.mode, created: Date.now() };
    var amt = parseMoney(ui.exAmount.value), pids = ids.filter(function (id) { return form.parts[id] > 0; }), parts = {};
    if (form.mode === 'items') {
      var items = form.items.filter(function (it) { return it.priceP > 0 && it.qty > 0; }).map(function (it) {
        return { name: (it.name || '').replace(/\s+/g, ' ').trim(), priceP: Math.round(it.priceP), qty: Math.round(it.qty * 100) / 100, who: (function (w) { return w.length ? w : ids.slice(); })(it.who.filter(function (id) { return ids.indexOf(id) >= 0; })) };   /* freeze "everyone" so members added later are not charged */
      });
      if (!items.length) { showMsg(ui.expMsg, EDU.t('err_no_items')); return; }
      var gst = parseNum(form.gst), sc = parseNum(form.sc);
      if (isNaN(gst) || gst > 100 || isNaN(sc) || sc > 100) { showMsg(ui.expMsg, EDU.t('err_tax')); return; }
      var c = itemsCalc(ids, items, gst || 0, sc || 0);
      if (!(c.totalP > 0) || c.totalP > MAX_AMOUNT_P) { showMsg(ui.expMsg, EDU.t(c.totalP > 0 ? 'err_amount_big' : 'err_no_items')); return; }
      e.items = items; e.gst = gst || 0; e.sc = sc || 0; e.amountP = c.totalP;
    } else {
      if (form.mode === 'exact') {
        var sum = 0; pids.forEach(function (id) { sum += Math.round(form.parts[id]); parts[id] = Math.round(form.parts[id]); });
        if (amt === null) amt = sum;
        if (isNaN(amt) || !(amt > 0)) { showMsg(ui.expMsg, EDU.t('err_amount')); ui.exAmount.focus(); return; }
        if (!pids.length) { showMsg(ui.expMsg, EDU.t('err_no_participants')); return; }
        if (sum !== amt) { showMsg(ui.expMsg, t(sum < amt ? 'err_exact_short' : 'err_exact_over', { amt: rs(Math.abs(amt - sum)) })); return; }
      } else {
        if (amt === null || isNaN(amt) || !(amt > 0)) { showMsg(ui.expMsg, EDU.t('err_amount')); ui.exAmount.focus(); return; }
        if (!pids.length) { showMsg(ui.expMsg, EDU.t('err_no_participants')); return; }
        if (form.mode === 'percent') {
          var ps = 0; pids.forEach(function (id) { ps += form.parts[id]; });
          if (Math.abs(ps - 100) >= 0.005) { showMsg(ui.expMsg, t('err_percent', { p: fmtN(ps) })); return; }
        }
        pids.forEach(function (id) { parts[id] = form.mode === 'equal' ? 1 : form.parts[id]; });
      }
      if (amt > MAX_AMOUNT_P) { showMsg(ui.expMsg, EDU.t('err_amount_big')); ui.exAmount.focus(); return; }
      e.amountP = amt; e.parts = parts;
    }
    own(g);
    if (form.editId) {
      var idx = -1; g.expenses.forEach(function (x, i) { if (x.id === form.editId) idx = i; });
      if (idx >= 0) { e.created = g.expenses[idx].created || e.created; g.expenses[idx] = e; } else g.expenses.push(e);
    } else {
      if (g.expenses.length >= 500) { showMsg(ui.expMsg, EDU.t('err_max_expenses')); return; }
      g.expenses.push(e);
    }
    closeForm(); save(); renderAll();
    EDU.toast(EDU.t('saved_toast'));
  });

  /* ---------------- expense list */
  function sortedExpenses(g) {
    return g.expenses.slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || '') || (b.created || 0) - (a.created || 0); });
  }
  function renderExpenses() {
    var g = cur(); ui.expList.innerHTML = '';
    if (!g.expenses.length) { ui.expList.appendChild(el('p', { class: 'empty', text: EDU.t(g.members.length ? 'no_expenses' : 'no_members_first') })); return; }
    sortedExpenses(g).forEach(function (e) {
      var r = splitsOf(g, e), payer = member(g, e.payer), isSettle = e.kind === 'settle';
      var title = isSettle ? t('settle_title', { from: payer ? mName(payer) : '?', to: mName(member(g, Object.keys(e.parts || {})[0]) || { name: '?' }) }) : (eTitle(e) || EDU.t('exp_default_title'));
      var sub = el('div', { class: 'exp-sub' });
      if (fmtDate(e.date)) sub.appendChild(el('span', { text: fmtDate(e.date) }));
      if (!isSettle) sub.appendChild(el('span', {}, tn('paid_by', { name: nameNode(payer ? mName(payer) : '?') })));
      sub.appendChild(el('span', { class: 'badge' + (isSettle ? ' success' : ''), text: EDU.t(isSettle ? 'b_settle' : 'mode_' + e.mode) }));
      var box = el('div', { class: 'exp' + (isSettle ? ' settle' : ''), dataset: { expense: e.id, amount: r.amountP } });
      var btns = el('div', { class: 'exp-btns' },
        el('button', { type: 'button', class: 'iconbtn', 'aria-label': EDU.t('aria_details'), 'aria-expanded': openDetails[e.id] ? 'true' : 'false', text: openDetails[e.id] ? '▴' : '▾', onclick: function () { openDetails[e.id] = !openDetails[e.id]; renderExpenses(); } }),
        isSettle ? null : el('button', { type: 'button', class: 'iconbtn', 'aria-label': EDU.t('edit'), title: EDU.t('edit'), text: '✎', onclick: function () { openForm(e.id); } }),
        el('button', { type: 'button', class: 'iconbtn danger', 'aria-label': EDU.t('delete'), title: EDU.t('delete'), text: '🗑', onclick: function () {
          if (!confirm(t('confirm_delete_expense', { title: plain(title) }))) return;
          own(g); g.expenses = g.expenses.filter(function (x) { return x.id !== e.id; });
          if (form.editId === e.id) closeForm();
          save(); renderAll();
        } }));
      box.appendChild(el('div', { class: 'exp-row' },
        el('div', { class: 'exp-main' }, el('div', { class: 'exp-title' + (isSettle ? '' : ' no-i18n'), text: title }), sub),
        el('div', { class: 'exp-amt num', text: rs(r.amountP) }), btns));
      if (openDetails[e.id]) {
        var det = el('div', { class: 'exp-det' });
        g.members.forEach(function (m) {
          var v = r.splits[m.id];
          if (!(v > 0)) return;
          det.appendChild(el('div', {}, el('span', {}, nameNode(mName(m)), document.createTextNode(e.mode === 'shares' ? ' · ' + t('n_shares', { n: fmtN(e.parts[m.id]) }) : e.mode === 'percent' ? ' · ' + fmtN(e.parts[m.id]) + '%' : '')), el('span', { class: 'num', text: rs(v) })));
        });
        if (e.mode === 'items' && r.calc) {
          det.appendChild(el('div', { class: 'muted' }, el('span', { text: EDU.t('lbl_subtotal') }), el('span', { class: 'num', text: rs(r.calc.subTotal) })));
          det.appendChild(el('div', { class: 'muted' }, el('span', { text: t('lbl_gst_n', { p: fmtN(e.gst || 0) }) + (e.sc > 0 ? ' + ' + t('lbl_service_n', { p: fmtN(e.sc) }) : '') }), el('span', { class: 'num', text: rs(r.calc.gstP + r.calc.scP) })));
          (e.items || []).forEach(function (it) {
            var whoTxt = (it.who && it.who.length ? it.who.map(function (id) { var m = member(g, id); return m ? mName(m) : ''; }).filter(Boolean) : [EDU.t('who_all')]).join(', ');
            det.appendChild(el('div', { class: 'muted no-i18n' }, el('span', { text: (iName(it) || EDU.t('col_item')) + (it.qty !== 1 ? ' × ' + fmtN(it.qty) : '') + ' · ' + whoTxt }), el('span', { class: 'num', text: rs(it.priceP * it.qty) })));
          });
        }
        box.appendChild(det);
      }
      ui.expList.appendChild(box);
    });
  }

  /* ---------------- balances + settle up */
  function renderBalances() {
    var g = cur(), b = balances(g);
    ui.balList.innerHTML = '';
    if (!g.members.length) { ui.balList.appendChild(el('p', { class: 'empty', text: EDU.t('no_members') })); return b; }
    var maxV = 1; g.members.forEach(function (m) { maxV = Math.max(maxV, b.paid[m.id], b.share[m.id]); });
    g.members.forEach(function (m) {
      var net = b.net[m.id], cls = net > 0 ? 'get' : net < 0 ? 'owe' : 'zero';
      var netTxt = net > 0 ? t('gets_back', { amt: rs(net) }) : net < 0 ? t('owes', { amt: rs(-net) }) : EDU.t('settled');
      ui.balList.appendChild(el('div', { class: 'bal', dataset: { member: m.id, net: net } },
        avatar(g, m),
        el('div', { class: 'bal-name no-i18n', text: mName(m) }),
        el('div', { class: 'bal-net ' + cls, text: netTxt }),
        el('div', { class: 'bal-sub', text: t('paid_share', { paid: rs(b.paid[m.id]), share: rs(b.share[m.id]) }) }),
        el('div', { class: 'bal-bar', 'aria-hidden': 'true' }, el('span', { class: 'p', style: { width: (b.paid[m.id] / maxV * 50).toFixed(1) + '%' } }), el('span', { class: 's', style: { width: (b.share[m.id] / maxV * 50).toFixed(1) + '%' } }))));
    });
    return b;
  }
  function upiLink(to, amtP, note) {
    return 'upi://pay?pa=' + encodeURIComponent(to.upi) + '&pn=' + encodeURIComponent(mName(to)) + '&am=' + rsNum(amtP) + '&cu=INR&tn=' + encodeURIComponent(note.slice(0, 50));
  }
  function waText(g, s) {
    var from = member(g, s.from), to = member(g, s.to);
    var upiLine = to && to.upi ? plain(t('wa_upi_line', { upi: to.upi })) : '';
    return plain(t('wa_msg', { from: mName(from), to: mName(to), amt: rs(s.amt), group: gName(g), upi: upiLine, url: EDU.shareUrl() })).replace(/\n{3,}/g, '\n\n');
  }
  function renderSettle(b) {
    var g = cur(); ui.settleList.innerHTML = '';
    if (!g.members.length || !g.expenses.length) { ui.settleInfo.textContent = EDU.t('settle_empty'); return; }
    if (!b.plan.length) {
      ui.settleInfo.textContent = '';
      ui.settleList.appendChild(el('div', { class: 'done-box callout success' }, el('div', { class: 'big', 'aria-hidden': 'true', text: '🎉' }), el('div', { text: EDU.t('all_settled') })));
      return;
    }
    ui.settleInfo.textContent = t('n_transfers', { n: EDU.fmt(b.plan.length) });
    b.plan.forEach(function (s) {
      var from = member(g, s.from), to = member(g, s.to);
      var row = el('div', { class: 'settle', dataset: { from: s.from, to: s.to, amt: s.amt } });
      row.appendChild(el('div', { class: 'settle-txt' }, tn('settle_row', { from: nameNode(mName(from), 'b'), to: nameNode(mName(to), 'b'), amt: el('span', { class: 'amt num', text: rs(s.amt) }) })));
      var btns = el('div', { class: 'settle-btns' });
      var note = plain(t('upi_note', { group: gName(g) }));
      if (to.upi) btns.appendChild(el('a', { class: 'btn btn-primary', href: upiLink(to, s.amt, note), text: '💳 ' + EDU.t('btn_upi_pay') }));
      btns.appendChild(el('a', { class: 'btn btn-wa', href: EDU.waLink(waText(g, s)), target: '_blank', rel: 'noopener', text: '💬 ' + EDU.t('btn_whatsapp') }));
      btns.appendChild(el('button', { type: 'button', class: 'btn', text: '✓ ' + EDU.t('btn_mark_paid'), onclick: function () { markPaid(s); } }));
      row.appendChild(btns);
      if (!to.upi) row.appendChild(el('p', { class: 'settle-upi' }, tn('upi_need', { name: nameNode(mName(to)) }), document.createTextNode(' '), el('button', { type: 'button', text: EDU.t('btn_add_upi'), onclick: function () { startEditMember(to.id); ui.memUpi.focus(); } })));
      ui.settleList.appendChild(row);
    });
  }
  function markPaid(s) {
    var g = cur(), from = member(g, s.from), to = member(g, s.to);
    if (!from || !to) return;
    if (!confirm(plain(t('confirm_mark_paid', { from: mName(from), to: mName(to), amt: rs(s.amt) })))) return;
    own(g);
    var parts = {}; parts[to.id] = s.amt;
    g.expenses.push({ id: uid(), kind: 'settle', title: '', payer: from.id, amountP: s.amt, date: isoDaysAgo(0), mode: 'exact', parts: parts, created: Date.now() });
    save(); renderAll();
    EDU.toast(EDU.t('mark_paid_done'));
  }

  /* ---------------- summary text / WhatsApp / CSV / PNG */
  function summaryLines(g) {
    var b = balances(g), L = [];
    L.push('🧾 ' + gName(g) + ' · ' + EDU.t('app_title'));
    L.push(plain(t('sum_total', { amt: rs(b.spent), n: EDU.fmt(g.members.length), m: EDU.fmt(b.count) })));
    L.push('');
    L.push(EDU.t('h_balances') + ':');
    g.members.forEach(function (m) {
      var net = b.net[m.id];
      var netTxt = net > 0 ? t('gets_back', { amt: rs(net) }) : net < 0 ? t('owes', { amt: rs(-net) }) : EDU.t('settled');
      L.push('• ' + plain(t('sum_bal_line', { name: mName(m), paid: rs(b.paid[m.id]), share: rs(b.share[m.id]), net: netTxt })));
    });
    L.push('');
    L.push(EDU.t('h_settle') + ':');
    if (!b.plan.length) L.push('• ' + EDU.t('all_settled'));
    b.plan.forEach(function (s) { L.push('• ' + plain(t('settle_row', { from: mName(member(g, s.from)), to: mName(member(g, s.to)), amt: rs(s.amt) }))); });
    L.push('');
    L.push(EDU.t('sum_footer') + ' ' + EDU.shareUrl());
    return L;
  }
  function refreshWa() { ui.wa.href = EDU.waLink(summaryLines(cur()).join('\n')); }
  $('#btnCopySummary').addEventListener('click', function () { EDU.copy(summaryLines(cur()).join('\n')); });
  $('#btnPrint').addEventListener('click', function () { window.print(); });
  $('#btnCsv').addEventListener('click', function () {
    var g = cur(), b = balances(g), rows = [];
    var head = [EDU.t('csv_date'), EDU.t('csv_title'), EDU.t('csv_paid_by'), EDU.t('csv_amount'), EDU.t('csv_split')];
    g.members.forEach(function (m) { head.push(mName(m)); });
    rows.push(head);
    sortedExpenses(g).reverse().forEach(function (e) {
      var r = splitsOf(g, e), payer = member(g, e.payer), isSettle = e.kind === 'settle';
      var title = isSettle ? plain(t('settle_title', { from: payer ? mName(payer) : '', to: mName(member(g, Object.keys(e.parts || {})[0]) || { name: '' }) })) : (eTitle(e) || EDU.t('exp_default_title'));
      var row = [e.date || '', title, payer ? mName(payer) : '', rsNum(r.amountP), EDU.t(isSettle ? 'b_settle' : 'mode_' + e.mode)];
      g.members.forEach(function (m) { row.push(r.splits[m.id] ? rsNum(r.splits[m.id]) : '0.00'); });
      rows.push(row);
    });
    var tot = ['', EDU.t('col_share'), '', '', '']; g.members.forEach(function (m) { tot.push(rsNum(b.share[m.id])); }); rows.push(tot);
    var pd = ['', EDU.t('col_paid'), '', rsNum(b.spent), '']; g.members.forEach(function (m) { pd.push(rsNum(b.paid[m.id])); }); rows.push(pd);
    var nt = ['', EDU.t('col_net'), '', '', '']; g.members.forEach(function (m) { nt.push(rsNum(b.net[m.id])); }); rows.push(nt);
    EDU.download(gName(g).replace(/[^\wऀ-\uDFFF -]+/g, '').trim().replace(/\s+/g, '-').slice(0, 40) + '-expenses.csv', EDU.csv.stringify(rows), 'text/csv');
  });
  $('#btnPng').addEventListener('click', function () {
    drawCard(cur());
    EDU.downloadCanvas(ui.canvas, gName(cur()).replace(/[^\wऀ-\uDFFF -]+/g, '').trim().replace(/\s+/g, '-').slice(0, 40) + '-summary.png');
  });
  /* a shareable 1080-px summary card; fixed light palette so it reads well in any chat */
  function drawCard(g) {
    var b = balances(g), cv = ui.canvas, rtl = isRtl();
    var font = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';
    var W = 1080, pad = 64, lineH = rtl ? 76 : 60;
    var rows = g.members.length + Math.max(1, b.plan.length);
    var H = 420 + rows * lineH + 2 * 110 + 120;
    cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    ctx.fillStyle = '#faf6f0'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#0b4f5c'; ctx.fillRect(0, 0, W, 250);
    ctx.direction = rtl ? 'rtl' : 'ltr';
    var x0 = rtl ? W - pad : pad, xEnd = rtl ? pad : W - pad;
    function text(s, x, y, size, color, weight, align, maxW) {
      ctx.font = (weight || 400) + ' ' + size + 'px ' + font; ctx.fillStyle = color; ctx.textAlign = align || (rtl ? 'right' : 'left'); ctx.textBaseline = 'alphabetic';
      s = plain(String(s));
      if (maxW) { while (s.length > 1 && ctx.measureText(s).width > maxW) s = s.slice(0, -2) + '…'; }
      ctx.fillText(s, x, y);
    }
    text(EDU.t('app_title'), x0, 80, 30, 'rgba(255,255,255,.8)', 600, null, W - 2 * pad);
    text(gName(g), x0, 150, 56, '#ffffff', 800, null, W - 2 * pad);
    text(plain(t('sum_total', { amt: rs(b.spent), n: EDU.fmt(g.members.length), m: EDU.fmt(b.count) })), x0, 212, 30, 'rgba(255,255,255,.9)', 500, null, W - 2 * pad);
    var y = 330;
    text(EDU.t('h_balances'), x0, y, 36, '#0b4f5c', 800); y += 30;
    g.members.forEach(function (m) {
      var net = b.net[m.id];
      var netTxt = net > 0 ? t('gets_back', { amt: rs(net) }) : net < 0 ? t('owes', { amt: rs(-net) }) : EDU.t('settled');
      y += lineH;
      ctx.fillStyle = '#ffffff'; roundRect(ctx, pad, y - lineH + 14, W - 2 * pad, lineH - 8, 14); ctx.fill();
      text(mName(m), rtl ? x0 - 20 : x0 + 20, y - 14, 30, '#1b2a30', 700, null, 420);
      text(netTxt, rtl ? xEnd + 20 : xEnd - 20, y - 14, 30, net > 0 ? '#2b8a3e' : net < 0 ? '#c92a2a' : '#868e96', 700, rtl ? 'left' : 'right', 480);
    });
    y += 90;
    text(EDU.t('h_settle'), x0, y, 36, '#0b4f5c', 800); y += 30;
    if (!b.plan.length) { y += lineH; text('🎉 ' + EDU.t('all_settled'), x0 + (rtl ? -20 : 20), y - 14, 30, '#2b8a3e', 700); }
    b.plan.forEach(function (s) {
      y += lineH;
      ctx.fillStyle = '#e6f4ea'; roundRect(ctx, pad, y - lineH + 14, W - 2 * pad, lineH - 8, 14); ctx.fill();
      text(plain(t('settle_row', { from: mName(member(g, s.from)), to: mName(member(g, s.to)), amt: rs(s.amt) })), x0 + (rtl ? -20 : 20), y - 14, 30, '#1b2a30', 600, null, W - 2 * pad - 40);
    });
    text(EDU.t('sum_footer'), W / 2, H - 50, 24, '#5c6f75', 500, 'center', W - 2 * pad);
    text(EDU.shareUrl().replace(/^https?:\/\//, ''), W / 2, H - 16, 22, '#5c6f75', 500, 'center', W - 2 * pad);
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  /* ---------------- reset */
  $('#btnReset').addEventListener('click', function () {
    if (!confirm(EDU.t('confirm_reset'))) return;
    store.remove('state'); closeForm(); memEdit = null; openDetails = {};
    load(); save(); renderAll();
  });

  /* ================================================================ render everything */
  function renderAll() {
    if (!cur()) state.current = state.groups[0].id;
    renderGroups();
    renderMembers();
    renderExpenses();
    var b = renderBalances();
    renderSettle(b);
    refreshWa();
    if (form.open) {
      ui.expFormTitle.textContent = EDU.t(form.editId ? 'f_edit_expense' : 'f_new_expense');
      ui.saveExp.textContent = EDU.t(form.editId ? 'save' : 'btn_save_expense');
      var sel = ui.exPayer.value; fillPayer(cur(), sel);
      renderModeSeg(); renderSplitArea();
    }
  }
  EDU.onLang(function () { DTF = {}; renderAll(); });
  renderAll();
})();
