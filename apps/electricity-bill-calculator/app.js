/* Electricity Bill & Energy Calculator: UI. Maths lives in engine.js (window.EBC). State in EDU.store. */
(function () {
  'use strict';
  var SLUG = 'electricity-bill-calculator';
  var store = EDU.store(SLUG);
  var el = EDU.el, $ = EDU.$, $$ = EDU.$$, E = window.EBC;
  var TABS = ['audit', 'bill', 'save', 'meter', 'science'];
  var MAX_ROWS = 60;

  /* ---------------- i18n helpers ---------------- */
  function isRtl() { return document.documentElement.dir === 'rtl'; }
  function t(key, vars) {
    if (vars && isRtl()) { var o = {}; Object.keys(vars).forEach(function (k) { o[k] = '⁨' + vars[k] + '⁩'; }); vars = o; }
    return EDU.t(key, vars);
  }
  function tn(key, vars) {       /* template where {vars} become LTR nodes */
    var frag = document.createDocumentFragment();
    EDU.t(key).split(/(\{\w+\})/).forEach(function (part) {
      var m = /^\{(\w+)\}$/.exec(part);
      if (!m) { if (part) frag.appendChild(document.createTextNode(part)); return; }
      var v = vars[m[1]];
      frag.appendChild(v && v.nodeType ? v : ltr(v === undefined ? part : v));
    });
    return frag;
  }
  function ltr(txt, cls) { return el('bdi', { class: 'eb-ltr' + (cls ? ' ' + cls : ''), text: String(txt) }); }
  var NF0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  var NF1 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 });
  var NF2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function rs(x) { x = Math.round((+x || 0) * 100) / 100; return '₹' + (x % 1 === 0 ? NF0.format(x) : NF2.format(x)); }
  function u1(x) { return NF1.format(+x || 0); }
  function num(v, d) { v = parseFloat(v); return isFinite(v) ? v : d; }
  function clampN(v, lo, hi, d) { v = num(v, d); return Math.min(hi, Math.max(lo, v)); }

  /* ---------------- state ---------------- */
  var SAMPLE = [
    { id: 'led', q: 6, h: 5 }, { id: 'fan', q: 3, h: 8 }, { id: 'fridge', q: 1, h: 8 }, { id: 'tv', q: 1, h: 4 },
    { id: 'ac15', q: 1, h: 5 }, { id: 'charger', q: 2, h: 2 }, { id: 'router', q: 1, h: 24 }, { id: 'washer', q: 1, h: 0.5 },
    { id: 'iron', q: 1, h: 0.25 }, { id: 'mixer', q: 1, h: 0.25 }, { id: 'bulb', q: 2, h: 4 }
  ].map(function (s) { return { id: s.id, w: E.BY_ID[s.id].w, q: s.q, h: s.h }; });

  function cleanItems(arr) {
    if (!Array.isArray(arr)) return null;
    var out = [];
    arr.forEach(function (x) {
      if (!x || !E.BY_ID[x.id] || out.length >= MAX_ROWS) return;
      out.push({ id: x.id, w: clampN(x.w, 0, 100000, E.BY_ID[x.id].w), q: clampN(x.q, 0, 1000, 1), h: clampN(x.h, 0, 24, 1) });
    });
    return out;
  }
  function cleanSlabs(arr) {
    if (!Array.isArray(arr) || !arr.length) return null;
    var out = [];
    arr.forEach(function (s) {
      if (!Array.isArray(s) || out.length >= 12) return;
      out.push([s[0] === null ? null : clampN(s[0], 0, 1e7, 0), clampN(s[1], 0, 1000, 0)]);
    });
    return out.length ? out : null;
  }
  function tariffDefaults(id) {
    var tf = E.TARIFF_BY_ID[id] || E.TARIFFS[0];
    return { slabs: tf.slabs.map(function (s) { return [s[0], s[1]]; }), fixed: tf.fixed, duty: tf.duty, fuel: tf.fuel, free: tf.free, sub: tf.free > 0, tele: tf.telescopic };
  }
  var st = (function load() {
    var s = store.get('state', null) || {};
    var stateId = E.TARIFF_BY_ID[s.stateId] || s.stateId === 'custom' ? s.stateId : 'delhi';
    var d = tariffDefaults(stateId);
    var items = cleanItems(s.items);
    return {
      tab: TABS.indexOf(s.tab) >= 0 ? s.tab : 'audit',
      items: items === null ? SAMPLE.slice() : items,
      days: clampN(s.days, 1, 366, 30),
      stateId: stateId,
      slabs: cleanSlabs(s.slabs) || d.slabs,
      tele: typeof s.tele === 'boolean' ? s.tele : d.tele,
      load: clampN(s.load, 0, 1000, 2),
      fixed: clampN(s.fixed, 0, 1e6, d.fixed),
      duty: clampN(s.duty, 0, 100, d.duty),
      fuel: clampN(s.fuel, 0, 100, d.fuel),
      sub: typeof s.sub === 'boolean' ? s.sub : d.sub,
      free: clampN(s.free, 0, 1e6, d.free),
      useAudit: s.useAudit !== false,
      units: clampN(s.units, 0, 1e9, 0),
      sw: { led: !!(s.sw && s.sw.led), ac24: !!(s.sw && s.sw.ac24), fridge5: !!(s.sw && s.sw.fridge5), bldc: !!(s.sw && s.sw.bldc), standby: !!(s.sw && s.sw.standby) },
      svRate: s.svRate === null || s.svRate === undefined ? null : clampN(s.svRate, 0, 1000, null),
      mPrev: s.mPrev === '' || s.mPrev === undefined || s.mPrev === null ? '' : clampN(s.mPrev, 0, 1e9, ''),
      mCur: s.mCur === '' || s.mCur === undefined || s.mCur === null ? '' : clampN(s.mCur, 0, 1e9, ''),
      sKw: clampN(s.sKw, 0, 10000, 3),
      sPer: clampN(s.sPer, 0, 24, E.SOLAR_PER_KW_DAY),
      scV: clampN(s.scV, 0, 1e6, 220), scI: clampN(s.scI, 0, 1e6, 5), scPw: clampN(s.scPw, 0, 1e9, 100), scH: clampN(s.scH, 0, 24, 5), scD: clampN(s.scD, 1, 366, 30),
      shown: Array.isArray(s.shown) ? s.shown.filter(function (x) { return x >= 0 && x < 6; }) : []
    };
  })();
  function save() { store.set('state', st); }

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ---------------- derived ---------------- */
  function auditRes() { return E.audit(st.items, st.days); }
  function billUnits() { return st.useAudit ? auditRes().total : st.units; }
  function billOpts(units) {
    return { units: units, slabs: st.slabs, telescopic: st.tele, fixedPerKw: st.fixed, loadKw: st.load, dutyPct: st.duty, fuelPct: st.fuel, subsidy: st.sub, freeUnits: st.free };
  }
  function billRes() { return E.bill(billOpts(billUnits())); }
  function autoRate() {
    var b = billRes();
    var mr = E.marginalRate(b.billed, st.slabs);
    var r = mr * (1 + st.fuel / 100) * (1 + st.duty / 100);
    return Math.round(r * 100) / 100;
  }
  function svRate() { return st.svRate === null ? autoRate() : st.svRate; }
  function apName(id) { return t('ap_' + id); }

  /* ---------------- tabs ---------------- */
  function showTab(tab, focus) {
    st.tab = tab; save();
    TABS.forEach(function (k) {
      var b = $('#tab-' + k), p = $('#p-' + k);
      b.setAttribute('aria-selected', k === tab ? 'true' : 'false');
      b.tabIndex = k === tab ? 0 : -1;
      p.hidden = k !== tab;
    });
    if (focus) $('#tab-' + tab).focus();
  }
  $('#tabs').addEventListener('click', function (e) { var b = e.target.closest('button[data-tab]'); if (b) showTab(b.dataset.tab); });
  $('#tabs').addEventListener('keydown', function (e) {
    var i = TABS.indexOf(st.tab), rtl = isRtl(), n = null;
    if (e.key === 'ArrowRight') n = rtl ? i - 1 : i + 1;
    else if (e.key === 'ArrowLeft') n = rtl ? i + 1 : i - 1;
    else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = TABS.length - 1;
    if (n === null) return;
    e.preventDefault(); showTab(TABS[(n + TABS.length) % TABS.length], true);
  });

  /* ---------------- 1. audit ---------------- */
  function fillAddSelect() {
    var sel = $('#add-sel'), cur = sel.value;
    sel.innerHTML = '';
    E.APPLIANCES.forEach(function (a) { sel.appendChild(el('option', { value: a.id, text: apName(a.id) + ' · ' + a.w + ' W' })); });
    if (cur) sel.value = cur;
  }
  function numInput(cls, val, attrs, onInput) {
    var i = el('input', Object.assign({ class: 'eb-num', type: 'number', inputmode: 'decimal', value: String(val) }, attrs));
    i.addEventListener('input', function () { onInput(i.value); });
    return i;
  }
  function renderAuditRows() {
    var box = $('#audit-rows'); box.innerHTML = '';
    var res = auditRes();
    st.items.forEach(function (it, idx) {
      var a = E.BY_ID[it.id], r = res.rows[idx];
      var name = el('div', { class: 'ap-name' }, el('span', { text: apName(it.id) }));
      if (a.note) name.appendChild(el('small', { text: t(a.note) }));
      var row = el('div', { class: 'ap-row', dataset: { id: it.id } },
        name,
        el('div', { class: 'ap-f ap-w' }, el('span', { class: 'ap-l', text: t('col_watts') }),
          numInput('w', it.w, { min: 0, max: 100000, step: 1, 'aria-label': t('col_watts'), 'data-f': 'w' }, function (v) { it.w = clampN(v, 0, 100000, 0); save(); renderAuditOut(); })),
        el('div', { class: 'ap-f ap-q' }, el('span', { class: 'ap-l', text: t('col_qty') }),
          numInput('q', it.q, { min: 0, max: 1000, step: 1, 'aria-label': t('col_qty'), 'data-f': 'q' }, function (v) { it.q = clampN(v, 0, 1000, 0); save(); renderAuditOut(); })),
        el('div', { class: 'ap-f ap-h' }, el('span', { class: 'ap-l', text: t('col_hours') }),
          numInput('h', it.h, { min: 0, max: 24, step: 0.25, 'aria-label': t('col_hours'), 'data-f': 'h' }, function (v) { it.h = clampN(v, 0, 24, 0); save(); renderAuditOut(); })),
        el('div', { class: 'ap-u' }, el('span', { class: 'ap-l', text: t('col_units') }), el('span', { class: 'ap-uv eb-ltr', text: u1(r.units) })),
        el('button', { type: 'button', class: 'btn btn-ghost ap-del', 'aria-label': t('delete'), title: t('delete'), onclick: function () { st.items.splice(idx, 1); save(); renderAudit(); } }, '✕'));
      box.appendChild(row);
    });
    $('#audit-empty').hidden = st.items.length > 0;
  }
  function renderAuditOut() {
    var res = auditRes();
    /* update per-row units without rebuilding inputs */
    $$('#audit-rows .ap-row').forEach(function (row, i) { var v = $('.ap-uv', row); if (v && res.rows[i]) v.textContent = u1(res.rows[i].units); });
    var b = E.bill(billOpts(res.total));
    var out = $('#audit-result'); out.innerHTML = '';
    out.appendChild(el('div', { class: 'eb-res-lbl', text: t('audit_total') }));
    out.appendChild(el('div', { class: 'eb-big', id: 'audit-total', dataset: { units: res.total.toFixed(2) } }, ltr(u1(res.total)), ' ', el('small', { text: t('unit_kwh') })));
    var kv = el('dl', { class: 'eb-kv' });
    kv.appendChild(el('div', null, el('dt', { text: t('per_day') }), el('dd', null, ltr(u1(res.total / st.days)), ' ', t('unit_kwh'))));
    kv.appendChild(el('div', null, el('dt', { text: t('audit_count') }), el('dd', null, ltr(st.items.length))));
    kv.appendChild(el('div', { class: 'big' }, el('dt', { text: t('est_bill') }), el('dd', { id: 'audit-bill', dataset: { total: b.total.toFixed(2) } }, ltr(rs(b.total)))));
    out.appendChild(kv);
    out.appendChild(el('p', { class: 'eb-note', style: { marginTop: '8px' } }, tn('est_bill_note', { state: st.stateId === 'custom' ? t('st_custom') : t('st_' + st.stateId) })));
    out.appendChild(el('div', { class: 'row', style: { marginTop: '10px' } },
      el('button', { type: 'button', class: 'btn btn-primary', onclick: function () { showTab('bill'); } }, t('go_bill') + ' →'),
      el('button', { type: 'button', class: 'btn', onclick: printAudit }, '🖨 ', t('print_audit'))));
    /* ranking */
    var top = $('#top3'); top.innerHTML = '';
    res.top3.forEach(function (r, i) { top.appendChild(el('span', { class: 'chip', dataset: { id: r.id } }, (i + 1) + '. ' + apName(r.id) + ' ', ltr(Math.round(r.share * 100) + '%'))); });
    var list = $('#rank-list'); list.innerHTML = '';
    var max = res.ranked.length ? res.ranked[0].units : 0;
    res.ranked.forEach(function (r, i) {
      list.appendChild(el('li', { class: 'rk-item' + (i < 3 && r.units > 0 ? ' top' : ''), dataset: { id: r.id } },
        el('span', { class: 'rk-name', text: apName(r.id) + ' × ' + r.q }),
        el('span', { class: 'rk-val' }, ltr(u1(r.units)), ' ', t('unit_kwh'), ' · ', ltr(Math.round(r.share * 100) + '%')),
        el('span', { class: 'rk-bar', 'aria-hidden': 'true' }, el('i', { style: { width: (max > 0 ? r.units / max * 100 : 0) + '%' } }))));
    });
    if (!res.ranked.length) list.appendChild(el('li', { class: 'muted', text: t('audit_empty') }));
    renderBillOut(); renderSaveOut(); renderSolar();
  }
  function renderAudit() { renderAuditRows(); renderAuditOut(); }
  $('#days').addEventListener('input', function () { st.days = clampN(this.value, 1, 366, 30); save(); renderAuditOut(); });
  $('#add-btn').addEventListener('click', function () {
    if (st.items.length >= MAX_ROWS) { EDU.toast(t('max_rows', { n: MAX_ROWS })); return; }
    var a = E.BY_ID[$('#add-sel').value] || E.APPLIANCES[0];
    st.items.push({ id: a.id, w: a.w, q: a.q, h: a.h }); save(); renderAudit();
    var rows = $$('#audit-rows .ap-row'); var last = rows[rows.length - 1]; if (last) { var inp = $('input', last); if (inp) inp.focus(); }
  });
  $('#sample-btn').addEventListener('click', function () { st.items = SAMPLE.map(function (x) { return Object.assign({}, x); }); save(); renderAudit(); });
  $('#clear-btn').addEventListener('click', function () { if (!st.items.length || !confirm(t('confirm_reset'))) return; st.items = []; save(); renderAudit(); });

  /* ---------------- 2. bill ---------------- */
  function fillStateSelect() {
    var sel = $('#b-state'); sel.innerHTML = '';
    E.TARIFFS.forEach(function (x) { sel.appendChild(el('option', { value: x.id, text: t('st_' + x.id) })); });
    sel.appendChild(el('option', { value: 'custom', text: t('st_custom') }));
    sel.value = st.stateId;
  }
  function applyTariff(id) {
    st.stateId = id;
    if (id !== 'custom') { var d = tariffDefaults(id); st.slabs = d.slabs; st.fixed = d.fixed; st.duty = d.duty; st.fuel = d.fuel; st.free = d.free; st.sub = d.sub; st.tele = d.tele; }
    save(); renderBill();
  }
  $('#b-state').addEventListener('change', function () { applyTariff(this.value); });
  function markCustom() { if (st.stateId !== 'custom') { st.stateId = 'custom'; $('#b-state').value = 'custom'; } }
  function renderSlabs() {
    var box = $('#slab-rows'); box.innerHTML = '';
    st.slabs.forEach(function (s, i) {
      var last = i === st.slabs.length - 1;
      var upto = last ? el('span', { class: 'sl-last' }, s[0] === null ? t('slab_above', { n: i > 0 ? (st.slabs[i - 1][0] || 0) + 1 : 1 }) : '') : null;
      if (!last || s[0] !== null) {
        upto = numInput('upto', s[0] === null ? '' : s[0], { min: 0, step: 1, 'aria-label': t('col_upto'), 'data-f': 'upto' }, function (v) {
          s[0] = v === '' ? null : clampN(v, 0, 1e7, 0); markCustom(); save(); renderBillOut();
        });
      }
      box.appendChild(el('div', { class: 'sl-row' },
        upto,
        numInput('rate', s[1], { min: 0, step: 0.01, 'aria-label': t('col_rate'), 'data-f': 'rate' }, function (v) { s[1] = clampN(v, 0, 1000, 0); markCustom(); save(); renderBillOut(); }),
        el('button', { type: 'button', class: 'btn btn-ghost sl-del', 'aria-label': t('delete'), title: t('delete'), disabled: st.slabs.length <= 1, onclick: function () {
          st.slabs.splice(i, 1); if (st.slabs.length) st.slabs[st.slabs.length - 1][0] = null; markCustom(); save(); renderBill();
        } }, '✕')));
    });
  }
  $('#slab-add').addEventListener('click', function () {
    if (st.slabs.length >= 12) return;
    var prev = st.slabs[st.slabs.length - 1];
    var prevUpto = st.slabs.length > 1 ? (st.slabs[st.slabs.length - 2][0] || 0) : 0;
    prev[0] = prevUpto + 100;
    st.slabs.push([null, prev[1]]); markCustom(); save(); renderBill();
  });
  $('#slab-restore').addEventListener('click', function () { applyTariff(st.stateId === 'custom' ? 'delhi' : st.stateId); });
  function bindNum(id, key, lo, hi, after) {
    $(id).addEventListener('input', function () { st[key] = clampN(this.value, lo, hi, 0); if (after) after(); save(); renderBillOut(); });
  }
  bindNum('#b-units', 'units', 0, 1e9, function () { if (st.useAudit) { st.useAudit = false; $('#b-use-audit').checked = false; } });
  bindNum('#b-load', 'load', 0, 1000);
  bindNum('#b-fixed', 'fixed', 0, 1e6, markCustom);
  bindNum('#b-duty', 'duty', 0, 100, markCustom);
  bindNum('#b-fuel', 'fuel', 0, 100, markCustom);
  bindNum('#b-free', 'free', 0, 1e6, markCustom);
  $('#b-sub').addEventListener('change', function () { st.sub = this.checked; save(); renderBillOut(); });
  $('#b-use-audit').addEventListener('change', function () { st.useAudit = this.checked; if (st.useAudit) st.units = Math.round(auditRes().total); save(); renderBill(); });
  $('#b-tele').addEventListener('click', function (e) { var b = e.target.closest('button[data-v]'); if (!b) return; st.tele = b.dataset.v === '1'; save(); renderBill(); });

  function renderBill() {
    $('#b-state').value = st.stateId;
    $('#b-units').value = st.useAudit ? Math.round(auditRes().total * 10) / 10 : st.units;
    $('#b-units').readOnly = st.useAudit;
    $('#b-use-audit').checked = st.useAudit;
    $('#b-load').value = st.load; $('#b-fixed').value = st.fixed; $('#b-duty').value = st.duty; $('#b-fuel').value = st.fuel;
    $('#b-sub').checked = st.sub; $('#b-free').value = st.free;
    $$('#b-tele button').forEach(function (b) { b.setAttribute('aria-pressed', (b.dataset.v === '1') === st.tele ? 'true' : 'false'); });
    $('#tele-hint').textContent = t(st.tele ? 'tele_hint_yes' : 'tele_hint_no');
    renderSlabs(); renderBillOut();
  }
  function slabLabel(r) {
    if (r.to === null) return t('slab_above', { n: r.from });
    return r.from + '–' + r.to;
  }
  function renderBillOut() {
    var units = billUnits(), b = E.bill(billOpts(units));
    var out = $('#bill-result'); out.innerHTML = '';
    out.appendChild(el('div', { class: 'eb-res-lbl', text: t('bill_total') }));
    out.appendChild(el('div', { class: 'eb-big', id: 'b-total', dataset: { total: b.total.toFixed(2), energy: b.energy.toFixed(2) } }, ltr(rs(b.total))));
    out.appendChild(el('p', { class: 'eb-note' }, tn('bill_for', { n: u1(units), state: st.stateId === 'custom' ? t('st_custom') : t('st_' + st.stateId) })));
    var tb = el('table', { class: 'eb-tbl' });
    tb.appendChild(el('thead', null, el('tr', null, el('th', { text: t('col_slab') }), el('th', { class: 'v', text: t('col_units') }), el('th', { class: 'v', text: t('col_rate') }), el('th', { class: 'v', text: t('col_amount') }))));
    var body = el('tbody');
    if (b.freeUsed > 0) body.appendChild(el('tr', { class: 'ok' }, el('td', { text: t('r_free') }), el('td', { class: 'v' }, ltr(u1(b.freeUsed))), el('td', { class: 'v' }, ltr('₹0')), el('td', { class: 'v' }, ltr('₹0'))));
    b.rows.forEach(function (r) {
      body.appendChild(el('tr', { class: 'slab-row', dataset: { amount: r.amount } }, el('td', null, ltr(slabLabel(r))), el('td', { class: 'v' }, ltr(u1(r.units))), el('td', { class: 'v' }, ltr(rs(r.rate))), el('td', { class: 'v' }, ltr(rs(r.amount)))));
    });
    if (!b.rows.length && !b.freeUsed) body.appendChild(el('tr', null, el('td', { colspan: 4, class: 'muted', text: t('bill_empty') })));
    function line(label, val, cls, id) { body.appendChild(el('tr', { class: cls || '' }, el('th', { colspan: 3, text: label }), el('td', { class: 'v', id: id }, ltr(rs(val))))); }
    line(t('r_energy'), b.energy, '', 'b-energy');
    line(t('r_fixed', { kw: ltrTxt(st.load), rate: ltrTxt(rs(st.fixed)) }), b.fixed, '', 'b-fixed-out');
    if (st.fuel > 0) line(t('r_fuel', { p: ltrTxt(st.fuel) }), b.fuel, '', 'b-fuel-out');
    if (st.duty > 0) line(t('r_duty', { p: ltrTxt(st.duty) }), b.duty, '', 'b-duty-out');
    line(t('r_total'), b.total, 'sum', 'b-total-row');
    tb.appendChild(body);
    out.appendChild(el('div', { class: 'scroll-x' }, tb));
    var kv = el('dl', { class: 'eb-kv' });
    kv.appendChild(el('div', null, el('dt', { text: t('r_per_unit') }), el('dd', null, ltr(rs(b.perUnit)))));
    kv.appendChild(el('div', null, el('dt', { text: t('r_year') }), el('dd', null, ltr(rs(b.total * 12)))));
    out.appendChild(kv);
    out.appendChild(el('p', { class: 'eb-note', style: { marginTop: '8px' }, text: t('approx_note') }));
  }
  function ltrTxt(v) { return isRtl() ? '⁦' + v + '⁩' : String(v); }

  /* ---------------- 3. savings ---------------- */
  ['led', 'ac24', 'fridge5', 'bldc', 'standby'].forEach(function (k) {
    $('#sw-' + k).addEventListener('change', function () { st.sw[k] = this.checked; save(); renderSaveOut(); });
  });
  $('#sv-rate').addEventListener('input', function () { st.svRate = this.value === '' ? null : clampN(this.value, 0, 1000, 0); save(); renderSaveOut(); });
  $('#sv-rate-auto').addEventListener('click', function () { st.svRate = null; save(); renderSave(); });
  function renderSave() {
    ['led', 'ac24', 'fridge5', 'bldc', 'standby'].forEach(function (k) { $('#sw-' + k).checked = !!st.sw[k]; });
    $('#sv-rate').value = svRate();
    renderSaveOut();
  }
  function renderSaveOut() {
    var sv = E.savings(st.items, st.days, st.sw), rate = svRate();
    var out = $('#save-result'); out.innerHTML = '';
    out.appendChild(el('div', { class: 'eb-res-lbl', text: t('sv_title') }));
    out.appendChild(el('div', { class: 'eb-big', id: 'sv-kwh', dataset: { kwh: sv.total.toFixed(2), rs: (sv.total * rate).toFixed(2) } }, ltr(u1(sv.total)), ' ', el('small', { text: t('kwh_per_month') })));
    var rows = el('div', { class: 'sv-rows' });
    [['led', 'sw_led'], ['ac24', 'sw_ac24'], ['fridge5', 'sw_fridge5'], ['bldc', 'sw_bldc'], ['standby', 'sw_standby']].forEach(function (p) {
      if (!st.sw[p[0]]) return;
      rows.appendChild(el('div', { dataset: { sw: p[0] } }, el('span', { text: t(p[1]) }), el('span', { class: 'sv-v', dataset: { kwh: sv[p[0]].toFixed(2) } }, ltr(u1(sv[p[0]])), ' ', t('unit_kwh'))));
    });
    if (!rows.children.length) rows.appendChild(el('p', { class: 'muted', text: t('sv_none') }));
    out.appendChild(rows);
    var grid = el('div', { class: 'sv-grid' });
    function tile(lbl, val, id) { grid.appendChild(el('div', { class: 'sv-tile' }, el('span', { class: 'lbl', text: lbl }), el('span', { class: 'val', id: id }, ltr(val)))); }
    tile(t('sv_month'), rs(sv.total * rate), 'sv-month');
    tile(t('sv_year'), rs(sv.total * rate * 12), 'sv-year');
    tile(t('sv_kwh_year'), u1(sv.total * 12) + ' kWh', 'sv-kwh-year');
    tile(t('sv_co2'), u1(E.co2(sv.total * 12)) + ' kg', 'sv-co2');
    out.appendChild(grid);
    out.appendChild(el('p', { class: 'eb-note', style: { marginTop: '8px' } }, tn('sv_rate_note', { r: rs(rate), c: E.CO2_PER_UNIT })));
  }

  /* ---------------- 4. meter + solar ---------------- */
  $('#m-prev').addEventListener('input', function () { st.mPrev = this.value === '' ? '' : clampN(this.value, 0, 1e9, 0); save(); renderMeter(); });
  $('#m-cur').addEventListener('input', function () { st.mCur = this.value === '' ? '' : clampN(this.value, 0, 1e9, 0); save(); renderMeter(); });
  function renderMeter() {
    var out = $('#meter-result'); out.innerHTML = '';
    if (st.mPrev === '' && st.mCur === '') { out.appendChild(el('p', { class: 'eb-note', text: t('m_empty') })); return; }
    var u = E.meter(st.mPrev, st.mCur);
    if (u === null) { out.appendChild(el('p', { class: 'eb-warn', id: 'm-err', text: t('m_err') })); return; }
    var b = E.bill(billOpts(u));
    var kv = el('dl', { class: 'eb-kv' });
    kv.appendChild(el('div', { class: 'big' }, el('dt', { text: t('m_units') }), el('dd', { id: 'm-units', dataset: { units: u } }, ltr(u1(u)), ' ', t('unit_kwh'))));
    kv.appendChild(el('div', null, el('dt', { text: t('m_bill') }), el('dd', { id: 'm-bill', dataset: { total: b.total.toFixed(2) } }, ltr(rs(b.total)))));
    out.appendChild(kv);
  }
  $('#s-kw').addEventListener('input', function () { st.sKw = clampN(this.value, 0, 10000, 0); save(); renderSolar(); });
  $('#s-per').addEventListener('input', function () { st.sPer = clampN(this.value, 0, 24, 0); save(); renderSolar(); });
  function renderSolar() {
    var out = $('#solar-result'); out.innerHTML = '';
    var u = E.solar(st.sKw, st.sPer, 30), need = auditRes().total, rate = svRate();
    var kv = el('dl', { class: 'eb-kv' });
    kv.appendChild(el('div', { class: 'big' }, el('dt', { text: t('s_units') }), el('dd', { id: 's-units', dataset: { units: u.toFixed(1) } }, ltr(u1(u)), ' ', t('unit_kwh'))));
    kv.appendChild(el('div', null, el('dt', { text: t('s_year') }), el('dd', null, ltr(u1(u * 12)), ' ', t('unit_kwh'))));
    kv.appendChild(el('div', null, el('dt', { text: t('s_share') }), el('dd', { id: 's-share' }, ltr(need > 0 ? Math.min(999, Math.round(u / need * 100)) + '%' : '–'))));
    kv.appendChild(el('div', { class: 'ok' }, el('dt', { text: t('s_rs') }), el('dd', { id: 's-rs' }, ltr(rs(u * rate)))));
    out.appendChild(kv);
    out.appendChild(el('p', { class: 'eb-note', style: { marginTop: '8px' }, text: t('s_note') }));
  }

  /* ---------------- 5. science ---------------- */
  ['scV', 'scI', 'scPw', 'scH', 'scD'].forEach(function (k) {
    var id = { scV: '#sc-v', scI: '#sc-i', scPw: '#sc-pw', scH: '#sc-h', scD: '#sc-d' }[k];
    $(id).addEventListener('input', function () { st[k] = clampN(this.value, k === 'scD' ? 1 : 0, 1e9, k === 'scD' ? 1 : 0); save(); renderSciOut(); });
  });
  function renderSciOut() {
    var p = E.power(st.scV, st.scI);
    var o = $('#sc-p-out'); o.innerHTML = ''; o.dataset.p = p;
    o.appendChild(tn('sc_p_out', { v: st.scV, i: st.scI, p: u1(p) }));
    var kwhDay = E.energyKwh(st.scPw, st.scH), kwhMonth = kwhDay * st.scD, j = kwhDay * E.J_PER_KWH;
    var e = $('#sc-e-out'); e.innerHTML = ''; e.dataset.kwh = kwhMonth.toFixed(3);
    var kv = el('dl', { class: 'eb-kv' });
    kv.appendChild(el('div', null, el('dt', { text: t('sc_day') }), el('dd', null, ltr(NF2.format(kwhDay)), ' kWh = ', el('bdi', { class: 'eb-ltr' }, j.toExponential(2).split('e+')[0] + ' × 10', el('sup', { text: j.toExponential(2).split('e+')[1] })), ' J')));
    kv.appendChild(el('div', { class: 'big' }, el('dt', { text: t('sc_month', { d: ltrTxt(st.scD) }) }), el('dd', { id: 'sc-kwh' }, ltr(u1(kwhMonth)), ' ', t('unit_kwh'))));
    e.appendChild(kv);
  }
  function renderQuestions() {
    var list = $('#sc-q'); list.innerHTML = '';
    for (var i = 1; i <= 6; i++) (function (i) {
      var shown = st.shown.indexOf(i - 1) >= 0;
      var ans = el('div', { class: 'ans', hidden: !shown, id: 'ans-' + i }, el('bdi', null, t('a' + i)));
      var btn = el('button', { type: 'button', class: 'btn btn-sm', text: t(shown ? 'hide_answer' : 'show_answer'), 'aria-expanded': shown ? 'true' : 'false', 'aria-controls': 'ans-' + i, onclick: function () {
        var k = st.shown.indexOf(i - 1); if (k >= 0) st.shown.splice(k, 1); else st.shown.push(i - 1); save(); renderQuestions();
      } });
      list.appendChild(el('li', null, el('span', { class: 'qn', text: 'Q' + i }), el('bdi', { text: t('q' + i) }), el('div', null, btn), ans));
    })(i);
  }

  /* ---------------- print ---------------- */
  function printAudit() {
    var res = auditRes(), b = E.bill(billOpts(res.total)), pa = $('#print-area'); pa.innerHTML = '';
    pa.appendChild(el('h1', { text: t('pa_title') }));
    pa.appendChild(el('p', { class: 'pa-small' }, t('pa_meta', { d: new Date().toLocaleDateString('en-IN'), days: st.days })));
    var tb = el('table');
    tb.appendChild(el('thead', null, el('tr', null, el('th', { text: '#' }), el('th', { text: t('col_appliance') }), el('th', { class: 'v', text: t('col_watts') }), el('th', { class: 'v', text: t('col_qty') }), el('th', { class: 'v', text: t('col_hours') }), el('th', { class: 'v', text: t('col_units') }), el('th', { class: 'v', text: '%' }))));
    var body = el('tbody');
    res.ranked.forEach(function (r, i) {
      body.appendChild(el('tr', null, el('td', { text: i + 1 }), el('td', { text: apName(r.id) }), el('td', { class: 'v', text: r.w }), el('td', { class: 'v', text: r.q }), el('td', { class: 'v', text: r.h }), el('td', { class: 'v', text: u1(r.units) }), el('td', { class: 'v', text: Math.round(r.share * 100) })));
    });
    for (var i = 0; i < 3; i++) body.appendChild(el('tr', { class: 'pa-blank' }, el('td', { text: res.ranked.length + i + 1 }), el('td'), el('td'), el('td'), el('td'), el('td'), el('td')));
    body.appendChild(el('tr', { class: 'pa-sum' }, el('td', { colspan: 5, text: t('audit_total') }), el('td', { class: 'v', text: u1(res.total) }), el('td', { class: 'v', text: '100' })));
    body.appendChild(el('tr', { class: 'pa-sum' }, el('td', { colspan: 5, text: t('est_bill') }), el('td', { class: 'v', colspan: 2, text: rs(b.total) })));
    tb.appendChild(body); pa.appendChild(tb);
    pa.appendChild(el('p', { class: 'pa-small', text: t('pa_note') }));
    pa.appendChild(el('p', { class: 'pa-small', text: t('approx_note') }));
    window.print();
  }
  $('#print-btn').addEventListener('click', printAudit);

  /* ---------------- reset ---------------- */
  $('#reset-btn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    store.remove('state');
    location.reload();
  });

  /* ---------------- render all ---------------- */
  function renderAll() {
    $('#days').value = st.days;
    fillAddSelect(); fillStateSelect();
    renderAudit(); renderBill(); renderSave(); renderMeter(); renderSolar();
    $('#m-prev').value = st.mPrev; $('#m-cur').value = st.mCur; $('#s-kw').value = st.sKw; $('#s-per').value = st.sPer;
    $('#sc-v').value = st.scV; $('#sc-i').value = st.scI; $('#sc-pw').value = st.scPw; $('#sc-h').value = st.scH; $('#sc-d').value = st.scD;
    renderSciOut(); renderQuestions();
    showTab(st.tab);
  }
  renderAll();
  EDU.onLang(function () { renderAll(); });
})();
