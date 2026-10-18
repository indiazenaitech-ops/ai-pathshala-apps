/* Electricity Bill & Power Use.
   Units (kWh) per appliance, a bill estimate from the user's own tariff slabs, inverter battery backup and a
   rooftop solar estimate. Everything runs on this device; nothing is sent anywhere. */
(function () {
  'use strict';
  var SLUG = 'electricity-bill-calculator';
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$;

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ------------------------------------------------------------ catalog (typical values, all editable) */
  var CAT = {
    fan:       { ic: '🌀', w: 70,   q: 3, h: 10,  d: 30 },
    bldc:      { ic: '🌀', w: 30,   q: 1, h: 10,  d: 30 },
    led:       { ic: '💡', w: 9,    q: 6, h: 6,   d: 30 },
    tube:      { ic: '💡', w: 20,   q: 2, h: 5,   d: 30 },
    tv:        { ic: '📺', w: 60,   q: 1, h: 4,   d: 30 },
    fridge:    { ic: '🧊', u: 0.9,  q: 1, d: 30, v: 's3' },
    ac:        { ic: '❄️', w: 1500, q: 1, h: 8,   d: 30, v: 'ni3' },
    geyser:    { ic: '🚿', w: 2000, q: 1, h: 0.5, d: 30 },
    iron:      { ic: '👕', w: 1000, q: 1, h: 0.5, d: 12 },
    wm:        { ic: '🧺', w: 500,  q: 1, h: 1,   d: 12 },
    mixer:     { ic: '🥤', w: 500,  q: 1, h: 0.25, d: 30 },
    pump:      { ic: '💧', w: 750,  q: 1, h: 0.5, d: 30 },
    cooler:    { ic: '🌬️', w: 180,  q: 1, h: 8,   d: 30 },
    laptop:    { ic: '💻', w: 50,   q: 1, h: 4,   d: 30 },
    charger:   { ic: '📱', w: 10,   q: 2, h: 3,   d: 30 },
    induction: { ic: '🍳', w: 1800, q: 1, h: 0.5, d: 30 },
    microwave: { ic: '🍲', w: 1200, q: 1, h: 0.2, d: 30 },
    router:    { ic: '📶', w: 10,   q: 1, h: 24,  d: 30 },
    desktop:   { ic: '🖥️', w: 150,  q: 1, h: 4,   d: 30 },
    heater:    { ic: '🔥', w: 1500, q: 1, h: 2,   d: 30 },
    ro:        { ic: '🚰', w: 40,   q: 1, h: 1,   d: 30 },
    custom:    { ic: '🔌', w: 100,  q: 1, h: 1,   d: 30 }
  };
  var ORDER = Object.keys(CAT);
  var DEFAULT_LIST = ['fan', 'led', 'tube', 'tv', 'fridge', 'ac', 'iron', 'wm', 'mixer', 'pump', 'laptop', 'charger'];
  /* 1.5-ton AC: typical input power (non-inverter) or typical average draw while running (inverter) */
  var AC_V = { ni3: 1500, ni5: 1300, inv3: 1100, inv5: 900 };
  /* fridge, ~250 L double door: typical units per day by star level (label kWh/year ÷ 365 is better) */
  var FR_V = { s1: 1.25, s2: 1.05, s3: 0.9, s4: 0.75, s5: 0.6 };
  var SAMPLE_SLABS = [{ to: 100, r: 3 }, { to: 200, r: 4.5 }, { to: 400, r: 6 }, { to: null, r: 7.5 }];
  var VA_SIZES = [400, 500, 600, 700, 800, 900, 1000, 1100, 1250, 1500, 1700, 2000, 2500, 3000, 3500, 4000, 5000, 7500, 10000];
  /* PM Surya Ghar: Muft Bijli Yojana, central financial assistance for homes (MNRE guidelines, checked 18 Oct 2026) */
  var SUB = { gen: [30000, 30000, 18000], spl: [33000, 33000, 19800] };

  /* ------------------------------------------------------------ helpers */
  function num(v, d) { var n = typeof v === 'number' ? v : parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(n) ? n : (d === undefined ? 0 : d); }
  function pos(v, d) { var n = num(v, d); return n < 0 ? 0 : n; }
  function obj(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : null; }
  function f(n, dec) { return EDU.fmt(n, { maximumFractionDigits: dec === undefined ? 1 : dec }); }
  function f2(n) { return EDU.fmt(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function rs(n) { return '₹' + f2(n); }
  function rs0(n) { return '₹' + EDU.fmt(Math.round(n)); }
  function uid() { return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function hm(hours) {
    var mins = Math.round(hours * 60);
    return t('hm', { h: EDU.fmt(Math.floor(mins / 60)), m: EDU.fmt(mins % 60) });
  }
  function apName(r) { return r.t === 'custom' && r.name ? r.name : t('ap_' + r.t); }

  /* ------------------------------------------------------------ state */
  function newRow(type) {
    var c = CAT[type] || CAT.custom;
    var r = { id: uid(), t: CAT[type] ? type : 'custom', q: c.q, d: c.d };
    if (type === 'fridge') { r.u = c.u; r.v = c.v; } else { r.w = c.w; r.h = c.h; }
    if (type === 'ac') r.v = c.v;
    if (r.t === 'custom') r.name = '';
    return r;
  }
  function defaultRows() { return DEFAULT_LIST.map(newRow); }
  function defaultBill() { return { useTotal: true, units: 250, period: 1, slabs: SAMPLE_SLABS.map(function (s) { return { to: s.to, r: s.r }; }), sample: true, method: 'tel', fixed: 100, fxMode: 'm', load: 2, duty: 5, dutyOn: 'e', fuel: 0.2, other: 0, sub: 0 }; }
  function defaultInv() { return { mode: 'h', load: 600, ah: 150, v: 12, n: 1, eff: 85, dod: 80, want: 3 }; }
  function defaultSol() { return { useTotal: true, units: 300, gen: 4, area: 100, cat: 'gen', cost: 60000, useAvg: true, tariff: 7 }; }

  function cleanRows(a) {
    if (!Array.isArray(a)) return null;
    return a.filter(obj).map(function (r) {
      var type = CAT[r.t] ? r.t : 'custom';
      var o = { id: typeof r.id === 'string' ? r.id : uid(), t: type, q: pos(r.q, 1), d: pos(r.d, 30) };
      if (type === 'fridge') { o.u = pos(r.u, 0.9); o.v = FR_V[r.v] ? r.v : ''; } else { o.w = pos(r.w, 0); o.h = pos(r.h, 0); }
      if (type === 'ac') o.v = AC_V[r.v] ? r.v : '';
      if (type === 'custom') o.name = typeof r.name === 'string' ? r.name.slice(0, 60) : '';
      return o;
    });
  }
  function merge(def, saved) {
    var o = {}, s = obj(saved) || {};
    Object.keys(def).forEach(function (k) {
      var v = s[k];
      if (typeof def[k] === 'number') o[k] = num(v, def[k]);
      else if (typeof def[k] === 'boolean') o[k] = typeof v === 'boolean' ? v : def[k];
      else if (typeof def[k] === 'string') o[k] = typeof v === 'string' ? v : def[k];
      else o[k] = v === undefined ? def[k] : v;
    });
    return o;
  }

  var rows = cleanRows(store.get('rows', null)) || defaultRows();
  var bill = merge(defaultBill(), store.get('bill', null));
  if (!Array.isArray(bill.slabs)) bill.slabs = defaultBill().slabs;
  bill.slabs = bill.slabs.filter(obj).map(function (s) { return { to: s.to === null || s.to === '' || s.to === undefined ? null : pos(s.to, 0), r: num(s.r, 0) }; });
  if (['tel', 'flat'].indexOf(bill.method) < 0) bill.method = 'tel';
  if (bill.period !== 2) bill.period = 1;
  var inv = merge(defaultInv(), store.get('inv', null));
  var sol = merge(defaultSol(), store.get('sol', null));
  var tab = store.get('tab', 'use');
  if (['use', 'bill', 'inv', 'sol'].indexOf(tab) < 0) tab = 'use';

  function save() { store.set('rows', rows); store.set('bill', bill); store.set('inv', inv); store.set('sol', sol); }

  /* ------------------------------------------------------------ maths (pure) */
  function rowUnits(r) {
    if (r.t === 'fridge') return pos(r.u) * pos(r.q) * pos(r.d);
    return pos(r.w) * pos(r.q) * pos(r.h) * pos(r.d) / 1000;
  }
  function totalUnits() { return rows.reduce(function (s, r) { return s + rowUnits(r); }, 0); }

  /* slabs: [{to: upper limit or null = no limit, r: ₹/unit}] → {energy, lines:[{u, r, from, to}], warn} */
  function slabCharge(units, slabs, method) {
    var list = slabs.filter(function (s) { return isFinite(s.r); }).slice();
    var capped = list.filter(function (s) { return s.to !== null && s.to > 0; }).sort(function (a, b) { return a.to - b.to; });
    var open = list.filter(function (s) { return s.to === null; })[0];
    var seq = capped.concat(open ? [open] : []);
    var out = { energy: 0, lines: [], warn: false };
    if (!seq.length) return null;
    if (method === 'flat') {
      var hit = null;
      for (var i = 0; i < seq.length; i++) if (seq[i].to === null || units <= seq[i].to) { hit = seq[i]; break; }
      if (!hit) { hit = seq[seq.length - 1]; out.warn = true; }
      out.energy = units * hit.r;
      out.lines.push({ u: units, r: hit.r });
      return out;
    }
    var prev = 0, left = units;
    for (var j = 0; j < seq.length && left > 1e-9; j++) {
      var s = seq[j], cap = s.to === null ? Infinity : s.to;
      if (cap <= prev) continue;
      var take = Math.min(left, cap - prev);
      out.energy += take * s.r;
      out.lines.push({ u: take, r: s.r });
      left -= take; prev = cap;
    }
    if (left > 1e-9) {   // no "no limit" slab: charge the rest at the last rate
      var last = seq[seq.length - 1];
      out.energy += left * last.r; out.lines.push({ u: left, r: last.r }); out.warn = true;
    }
    return out;
  }
  function billUnits() { return bill.useTotal ? Math.round(totalUnits() * bill.period) : pos(bill.units); }
  function calcBill() {
    var u = billUnits();
    var sc = slabCharge(u, bill.slabs, bill.method);
    if (!sc) return null;
    var months = bill.period;
    var fixed = bill.fxMode === 'kw' ? pos(bill.fixed) * pos(bill.load) * months : pos(bill.fixed) * months;
    var fuel = num(bill.fuel) * u;
    var dutyBase = bill.dutyOn === 'all' ? sc.energy + fixed + fuel : sc.energy;
    var duty = Math.max(0, dutyBase) * pos(bill.duty) / 100;
    var other = num(bill.other), sub = pos(bill.sub);
    var total = Math.max(0, sc.energy + fixed + fuel + duty + other - sub);
    return { units: u, sc: sc, fixed: fixed, fuel: fuel, duty: duty, other: other, sub: sub, total: total, avg: u > 0 ? total / u : 0 };
  }
  function calcInv() {
    var load = pos(inv.load), v = pos(inv.v), n = Math.max(1, Math.round(pos(inv.n, 1))), eff = pos(inv.eff) / 100, dod = pos(inv.dod) / 100;
    var r = { load: load, v: v, n: n, eff: eff, dod: dod };
    r.va = load > 0 ? VA_SIZES.filter(function (x) { return x >= load / 0.8; })[0] || Math.ceil(load / 0.8 / 500) * 500 : 0;
    if (inv.mode === 'ah') {
      var hrs = pos(inv.want);
      r.want = hrs;
      r.ah = (v > 0 && eff > 0 && dod > 0) ? load * hrs / (v * n * dod * eff) : NaN;
      r.energy = load * hrs / (eff || 1);
    } else {
      var ah = pos(inv.ah);
      r.ah = ah;
      r.energy = ah * v * n * dod * eff;
      r.hours = load > 0 ? r.energy / load : NaN;
    }
    return r;
  }
  function subsidyFor(kw, cat) {
    var s = SUB[cat] || SUB.gen, total = 0;
    for (var i = 0; i < 3; i++) total += Math.max(0, Math.min(1, kw - i)) * s[i];
    return total;
  }
  function calcSol() {
    var units = sol.useTotal ? totalUnits() : pos(sol.units);
    var gen = pos(sol.gen);
    if (!(gen > 0) || !(units > 0)) return { units: units, bad: true };
    var exact = units / (30 * gen);
    var kw = Math.max(1, Math.ceil(exact * 2 - 1e-9) / 2);
    var b = calcBill();
    var tariff = sol.useAvg && b && b.avg > 0 ? b.avg : pos(sol.tariff);
    var month = kw * gen * 30;
    var sub = subsidyFor(kw, sol.cat);
    var cost = kw * pos(sol.cost);
    var net = Math.max(0, cost - sub);
    var saving = Math.min(month, units) * tariff;
    return { units: units, gen: gen, exact: exact, kw: kw, area: kw * pos(sol.area), month: month, year: kw * gen * 365, sub: sub, cost: cost, net: net, tariff: tariff, saving: saving, payback: saving > 0 ? net / (saving * 12) : NaN };
  }

  /* ------------------------------------------------------------ tabs */
  function setTab(id, focus) {
    tab = id; store.set('tab', id);
    $$('#tabs [role=tab]').forEach(function (b) {
      var on = b.dataset.tab === id;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    ['use', 'bill', 'inv', 'sol'].forEach(function (k) { $('#p-' + k).hidden = k !== id; });
    renderAll();
  }
  $$('#tabs [role=tab]').forEach(function (b) {
    b.addEventListener('click', function () { setTab(b.dataset.tab); });
    b.addEventListener('keydown', function (e) {
      var ids = ['use', 'bill', 'inv', 'sol'], i = ids.indexOf(tab), rtl = document.documentElement.dir === 'rtl';
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        var step = (e.key === 'ArrowRight') !== rtl ? 1 : -1;
        e.preventDefault(); setTab(ids[(i + step + 4) % 4], true);
      }
    });
  });

  /* ------------------------------------------------------------ appliance list */
  function numField(labelKey, val, key, r, extra) {
    var id = r.id + '-' + key;
    var inp = el('input', Object.assign({ type: 'number', id: id, inputmode: 'decimal', min: '0', step: 'any', value: String(val) }, extra || {}));
    inp.dataset.k = key;
    inp.addEventListener('input', function () {
      r[key] = pos(inp.value, 0);
      if (key === 'w' && r.t === 'ac') { r.v = ''; var s = $('#' + r.id + '-v'); if (s) s.value = ''; }
      if (key === 'u') { r.v = ''; var s2 = $('#' + r.id + '-v'); if (s2) s2.value = ''; }
      updateRowUnits(r); afterRowsChange();
    });
    return el('div', { class: 'field' }, el('label', { for: id, text: t(labelKey) }), inp);
  }
  function variantSelect(r) {
    var opts = r.t === 'ac' ? Object.keys(AC_V) : Object.keys(FR_V);
    var sel = el('select', { id: r.id + '-v', 'aria-label': t(r.t === 'ac' ? 'ac_variant' : 'fridge_variant') });
    sel.appendChild(el('option', { value: '', text: t('v_own') }));
    opts.forEach(function (k) {
      var label = r.t === 'ac' ? t('v_' + k) : t('star_n', { n: k.slice(1) });
      sel.appendChild(el('option', { value: k, text: label }));
    });
    sel.value = r.v || '';
    sel.addEventListener('change', function () {
      r.v = sel.value;
      if (!sel.value) return save();
      if (r.t === 'ac') { r.w = AC_V[sel.value]; var w = $('#' + r.id + '-w'); if (w) w.value = String(r.w); }
      else { r.u = FR_V[sel.value]; var u = $('#' + r.id + '-u'); if (u) u.value = String(r.u); }
      updateRowUnits(r); afterRowsChange();
    });
    return sel;
  }
  function rowEl(r) {
    var c = CAT[r.t] || CAT.custom;
    var name = el('div', { class: 'ap-name' });
    if (r.t === 'custom') {
      var ni = el('input', { type: 'text', id: r.id + '-nm', value: r.name || '', placeholder: t('custom_name'), 'aria-label': t('custom_name'), maxlength: '60', class: 'no-i18n' });
      ni.addEventListener('input', function () { r.name = ni.value; afterRowsChange(true); });
      name.appendChild(el('div', { class: 'nm' }, el('span', { class: 'ic', 'aria-hidden': 'true', text: c.ic }), el('span', { text: t('ap_custom') })));
      name.appendChild(ni);
    } else {
      name.appendChild(el('div', { class: 'nm' }, el('span', { class: 'ic', 'aria-hidden': 'true', text: c.ic }), el('span', { text: t('ap_' + r.t) })));
      if (r.t === 'ac' || r.t === 'fridge') name.appendChild(variantSelect(r));
    }
    var cells = [name];
    if (r.t === 'fridge') {
      cells.push(numField('col_upd', r.u, 'u', r));
      cells.push(numField('col_qty', r.q, 'q', r, { inputmode: 'numeric' }));
      cells.push(el('div', { class: 'field' }, el('span', { class: 'tiny muted', style: { fontWeight: 600 }, text: t('col_hours') }), el('div', { class: 'allday', text: t('fridge_allday') })));
    } else {
      cells.push(numField('col_watts', r.w, 'w', r));
      cells.push(numField('col_qty', r.q, 'q', r, { inputmode: 'numeric' }));
      cells.push(numField('col_hours', r.h, 'h', r, { max: '24' }));
    }
    cells.push(numField('col_days', r.d, 'd', r, { max: '31' }));
    cells.push(el('div', { class: 'ap-units' }, el('b', { id: r.id + '-out' }), el('span', { text: t('col_units') })));
    cells.push(el('button', { type: 'button', class: 'btn btn-ghost rm', 'aria-label': t('remove_row', { name: apName(r) }), title: t('delete'), text: '✕', onclick: function () {
      rows = rows.filter(function (x) { return x.id !== r.id; });
      renderRows(); afterRowsChange();
    } }));
    var row = el('div', { class: 'ap-row', id: r.id, dataset: { type: r.t } }, cells);
    return row;
  }
  function updateRowUnits(r) {
    var o = $('#' + r.id + '-out'); if (o) o.textContent = f(rowUnits(r));
    var row = $('#' + r.id); if (row) row.classList.toggle('off', rowUnits(r) === 0);
  }
  function renderRows() {
    var box = $('#apList'); box.innerHTML = '';
    if (!rows.length) box.appendChild(el('p', { class: 'muted', text: t('no_rows') }));
    rows.forEach(function (r) { box.appendChild(rowEl(r)); updateRowUnits(r); });
  }
  function renderPicker() {
    var sel = $('#apPick'), keep = sel.value;
    sel.innerHTML = '';
    ORDER.forEach(function (k) { sel.appendChild(el('option', { value: k, text: CAT[k].ic + ' ' + t('ap_' + k) })); });
    sel.value = keep || 'bldc';
  }
  $('#apAdd').addEventListener('click', function () {
    var r = newRow($('#apPick').value || 'custom');
    rows.push(r); renderRows(); afterRowsChange();
    var first = $('#' + r.id + ' input'); if (first) first.focus();
  });

  function renderTotals() {
    var tot = totalUnits();
    $('#apTotal').textContent = f(tot);
    $('#apTotalUnit').textContent = t('units_word');
    $('#apTotalDay').textContent = t('per_day', { n: f(tot / 30) });
  }
  function renderBars() {
    var box = $('#bars'); box.innerHTML = '';
    var tot = totalUnits();
    var items = rows.map(function (r) { return { name: apName(r), u: rowUnits(r) }; }).filter(function (x) { return x.u > 0; }).sort(function (a, b) { return b.u - a.u; });
    if (!items.length || tot <= 0) { box.appendChild(el('p', { class: 'muted', text: t('no_rows') })); return; }
    if (items.length > 8) {
      var rest = items.slice(7).reduce(function (s, x) { return s + x.u; }, 0);
      items = items.slice(0, 7).concat([{ name: t('others'), u: rest }]);
    }
    var max = items[0].u;
    items.forEach(function (x, i) {
      box.appendChild(el('div', { class: 'bar-row' },
        el('span', { class: 'nm' + (x.name !== t('others') ? ' no-i18n' : ''), text: x.name }),
        el('span', { class: 'bar-track', 'aria-hidden': 'true' }, el('span', { class: 'k' + (i % 8 + 1), style: { width: (x.u / max * 100).toFixed(1) + '%' } })),
        el('span', { class: 'val' }, f(x.u) + ' ', el('small', { text: '(' + f(x.u / tot * 100, 0) + '%)' }))
      ));
    });
  }
  function renderTips() {
    var box = $('#tips'); box.innerHTML = '';
    var groups = {};
    rows.forEach(function (r) { var u = rowUnits(r); if (u <= 0) return; (groups[r.t] = groups[r.t] || []).push(r); });
    var list = Object.keys(groups).map(function (k) {
      var rs_ = groups[k], u = rs_.reduce(function (s, r) { return s + rowUnits(r); }, 0), save = 0;
      if (k === 'fan') save = rs_.reduce(function (s, r) { return s + Math.max(0, pos(r.w) - 30) * pos(r.q) * pos(r.h) * pos(r.d) / 1000; }, 0);
      if (k === 'tube') save = rs_.reduce(function (s, r) { return s + (pos(r.w) >= 36 ? (pos(r.w) - 20) * pos(r.q) * pos(r.h) * pos(r.d) / 1000 : 0); }, 0);
      if (k === 'ac') save = u * 0.12;
      if (k === 'led' || k === 'tv' || k === 'desktop') save = 0;
      return { k: k, u: u, save: save };
    }).sort(function (a, b) { return b.u - a.u; }).slice(0, 6);
    if (!list.length) { box.appendChild(el('li', { class: 'muted', text: t('no_rows') })); return; }
    var b = calcBill(), rate = b && b.avg > 0 ? b.avg : 7;
    list.forEach(function (x) {
      var li = el('li', null, el('b', null, (CAT[x.k] || CAT.custom).ic + ' ' + t('ap_' + x.k) + ' · ' + t('units_n', { n: f(x.u) })), el('p', { text: t('tip_' + x.k) }));
      if (x.save >= 0.5) li.appendChild(el('span', { class: 'save', text: t(x.k === 'ac' ? 'save_ac' : x.k === 'fan' ? 'save_fan' : 'save_tube', { n: f(x.save), r: rs0(x.save * rate) }) }));
      box.appendChild(li);
    });
  }
  var rowSaveTimer = 0;
  function afterRowsChange(nameOnly) {
    clearTimeout(rowSaveTimer); rowSaveTimer = setTimeout(save, 250);
    if (nameOnly) { renderBars(); renderTips(); return; }
    renderAll();
  }

  /* ------------------------------------------------------------ bill */
  function bindNum(id, objRef, key, cb) {
    var inp = $('#' + id);
    inp.addEventListener('input', function () { objRef()[key] = num(inp.value, 0); save(); cb(); });
  }
  function setVal(id, v) { var e = $('#' + id); if (document.activeElement !== e) e.value = String(v); }
  function segBind(id, getter, setter) {
    $$('#' + id + ' button').forEach(function (b) {
      b.addEventListener('click', function () { setter(b.dataset.v); save(); renderAll(); });
    });
  }
  function segPaint(id, val) { $$('#' + id + ' button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v) === String(val) ? 'true' : 'false'); }); }

  function renderSlabs() {
    var box = $('#slabs'); box.innerHTML = '';
    bill.slabs.forEach(function (s, i) {
      var idTo = 'slTo' + i, idR = 'slR' + i;
      var to = el('input', { type: 'number', id: idTo, inputmode: 'decimal', min: '0', step: 'any', value: s.to === null ? '' : String(s.to), placeholder: t('slab_nolimit') });
      var r = el('input', { type: 'number', id: idR, inputmode: 'decimal', min: '0', step: 'any', value: String(s.r) });
      var rng = el('span', { class: 'rng', id: 'slRng' + i });
      to.addEventListener('input', function () { s.to = to.value.trim() === '' ? null : pos(to.value, 0); bill.sample = false; save(); paintRanges(); renderBillOut(); });
      r.addEventListener('input', function () { s.r = num(r.value, 0); bill.sample = false; save(); renderBillOut(); });
      box.appendChild(el('div', { class: 'slab-row' },
        rng,
        el('div', { class: 'field' }, el('label', { for: idTo, text: t('slab_upto') }), to),
        el('div', { class: 'field' }, el('label', { for: idR, text: t('slab_rate') }), r),
        el('button', { type: 'button', class: 'btn btn-ghost rm', 'aria-label': t('remove_slab', { n: i + 1 }), title: t('delete'), text: '✕', onclick: function () {
          bill.slabs.splice(i, 1); bill.sample = false; save(); renderSlabs(); renderBillOut();
        } })));
    });
    if (!bill.slabs.length) box.appendChild(el('p', { class: 'muted', text: t('bill_zero') }));
    paintRanges();
    $('#sampleBadge').hidden = !bill.sample;
  }
  function paintRanges() {
    /* label each slab with the range it covers, in the order the user typed them */
    var caps = bill.slabs.map(function (s) { return s.to; }).filter(function (x) { return x !== null && x > 0; }).sort(function (a, b) { return a - b; });
    bill.slabs.forEach(function (s, i) {
      var e = $('#slRng' + i); if (!e) return;
      if (s.to === null) { e.textContent = t('slab_rest', { a: f(caps.length ? caps[caps.length - 1] : 0, 2) }); return; }
      var below = caps.filter(function (x) { return x < s.to; });
      var from = below.length ? below[below.length - 1] + 1 : (s.to >= 1 ? 1 : 0);
      e.textContent = t('slab_range', { a: f(Math.min(from, s.to), 2), b: f(s.to, 2) });
    });
  }
  $('#addSlab').addEventListener('click', function () {
    var caps = bill.slabs.map(function (s) { return s.to; }).filter(function (x) { return x !== null; });
    var hasOpen = bill.slabs.some(function (s) { return s.to === null; });
    var next = caps.length ? Math.max.apply(null, caps) + 100 : 100;
    var last = bill.slabs.length ? bill.slabs[bill.slabs.length - 1].r : 5;
    var s = { to: hasOpen ? next : null, r: last };
    if (hasOpen) { var oi = bill.slabs.findIndex(function (x) { return x.to === null; }); bill.slabs.splice(oi, 0, s); }
    else bill.slabs.push(s);
    bill.sample = false; save(); renderSlabs(); renderBillOut();
  });
  $('#loadSample').addEventListener('click', function () {
    bill.slabs = SAMPLE_SLABS.map(function (s) { return { to: s.to, r: s.r }; }); bill.sample = true;
    save(); renderSlabs(); renderBillOut();
  });
  $('#bUseTotal').addEventListener('change', function () { bill.useTotal = this.checked; if (!bill.useTotal && !(bill.units > 0)) bill.units = billUnitsFromTotal(); save(); renderBill(); });
  function billUnitsFromTotal() { return Math.round(totalUnits() * bill.period); }
  $('#bUnits').addEventListener('input', function () { bill.units = pos(this.value, 0); save(); renderBillOut(); });
  segBind('bPeriod', null, function (v) { bill.period = v === '2' ? 2 : 1; });
  segBind('bMethod', null, function (v) { bill.method = v === 'flat' ? 'flat' : 'tel'; });
  bindNum('bFixed', function () { return bill; }, 'fixed', function () { renderBillOut(); });
  bindNum('bLoad', function () { return bill; }, 'load', function () { renderBillOut(); });
  bindNum('bDuty', function () { return bill; }, 'duty', function () { renderBillOut(); });
  bindNum('bFuel', function () { return bill; }, 'fuel', function () { renderBillOut(); });
  bindNum('bOther', function () { return bill; }, 'other', function () { renderBillOut(); });
  bindNum('bSub', function () { return bill; }, 'sub', function () { renderBillOut(); });
  $('#bFxMode').addEventListener('change', function () { bill.fxMode = this.value === 'kw' ? 'kw' : 'm'; save(); renderBill(); });
  $('#bDutyOn').addEventListener('change', function () { bill.dutyOn = this.value === 'all' ? 'all' : 'e'; save(); renderBillOut(); });

  function renderBill() {
    var tot = totalUnits();
    $('#bUseTotal').checked = bill.useTotal;
    $('#bUseTotalLbl').textContent = t('use_total', { n: f(tot * bill.period, 0) });
    var bu = $('#bUnits'); bu.disabled = bill.useTotal;
    setVal('bUnits', bill.useTotal ? billUnitsFromTotal() : bill.units);
    segPaint('bPeriod', bill.period); segPaint('bMethod', bill.method);
    setVal('bFixed', bill.fixed); $('#bFxMode').value = bill.fxMode; $('#bLoadWrap').hidden = bill.fxMode !== 'kw';
    setVal('bLoad', bill.load); setVal('bDuty', bill.duty); $('#bDutyOn').value = bill.dutyOn;
    setVal('bFuel', bill.fuel); setVal('bOther', bill.other); setVal('bSub', bill.sub);
    renderSlabs(); renderBillOut();
  }
  function renderBillOut() {
    var b = calcBill(), dl = $('#bBreak'), errE = $('#bErr');
    dl.innerHTML = '';
    if (bill.useTotal) setVal('bUnits', billUnitsFromTotal());
    if (!b) { $('#bTotal').textContent = '₹0'; $('#bAvg').textContent = ''; errE.hidden = false; errE.textContent = t('bill_zero'); return; }
    errE.hidden = !b.sc.warn; errE.textContent = b.sc.warn ? t('slab_warn') : '';
    $('#bTotal').textContent = rs(b.total);
    $('#bAvg').textContent = t('b_avg', { r: rs(b.avg), u: f(b.units, 2) });
    function add(label, val, sub, cls) {
      var dt = el('dt', { class: cls || '' }, label); if (sub) dt.appendChild(el('small', { text: sub }));
      dl.appendChild(dt); dl.appendChild(el('dd', { class: cls || '', text: val }));
    }
    var lines = b.sc.lines.map(function (l) { return t('b_slab_line', { u: f(l.u, 2), r: f2(l.r) }); }).join(' + ');
    add(t('b_energy'), rs(b.sc.energy), lines);
    add(t('b_fixed'), rs(b.fixed));
    if (b.fuel) add(t('b_fuel'), rs(b.fuel), t('b_slab_line', { u: f(b.units, 2), r: f2(num(bill.fuel)) }));
    add(t('b_duty'), rs(b.duty), f(pos(bill.duty), 2) + '%');
    if (b.other) add(t('b_other'), rs(b.other));
    if (b.sub) add(t('b_sub'), '−' + rs(b.sub), null, 'neg');
    add(t('b_total'), rs(b.total), null, 'tot');
  }

  /* ------------------------------------------------------------ inverter */
  var QUICK = [['fan', 70], ['led', 9], ['tv', 60], ['router', 10], ['laptop', 50], ['tube', 20]];
  function renderQuick() {
    var box = $('#iQuick');
    $$('.chip', box).forEach(function (c) { c.remove(); });
    QUICK.forEach(function (q) {
      box.appendChild(el('button', { type: 'button', class: 'chip', text: '+ ' + t('ap_' + q[0]) + ' ' + q[1] + ' W', onclick: function () {
        inv.load = pos(inv.load) + q[1]; save(); setVal('iLoad', inv.load); renderInvOut();
      } }));
    });
  }
  ['load', 'ah', 'v', 'n', 'eff', 'dod', 'want'].forEach(function (k) {
    var id = 'i' + (k === 'want' ? 'Want' : k === 'ah' ? 'Ah' : k === 'v' ? 'V' : k === 'n' ? 'N' : k === 'eff' ? 'Eff' : k === 'dod' ? 'Dod' : 'Load');
    bindNum(id, function () { return inv; }, k, function () { renderInvOut(); });
  });
  segBind('iMode', null, function (v) { inv.mode = v === 'ah' ? 'ah' : 'h'; });
  $$('[data-dod]').forEach(function (b) { b.addEventListener('click', function () { inv.dod = num(b.dataset.dod); save(); setVal('iDod', inv.dod); renderInvOut(); }); });
  function renderInv() {
    segPaint('iMode', inv.mode);
    ['load', 'ah', 'v', 'n', 'eff', 'dod', 'want'].forEach(function (k) {
      var id = 'i' + (k === 'want' ? 'Want' : k === 'ah' ? 'Ah' : k === 'v' ? 'V' : k === 'n' ? 'N' : k === 'eff' ? 'Eff' : k === 'dod' ? 'Dod' : 'Load');
      setVal(id, inv[k]);
    });
    $('#iWantWrap').hidden = inv.mode !== 'ah';
    $('#iAhWrap').hidden = inv.mode === 'ah';
    renderQuick(); renderInvOut();
  }
  function renderInvOut() {
    var r = calcInv(), errE = $('#iErr');
    errE.hidden = true;
    $('#iEnergy').textContent = isFinite(r.energy) ? f(r.energy, 0) + ' Wh' : '–';
    $('#iVa').textContent = r.va ? EDU.fmt(r.va) + ' VA' : '–';
    var D = function (x, d) { return Number(x).toFixed(d === undefined ? 2 : d).replace(/\.?0+$/, '') || '0'; };
    if (inv.mode === 'ah') {
      $('#iResLbl').textContent = t('r_ah');
      $('#iFormula').textContent = t('formula_ah');
      if (!isFinite(r.ah)) { $('#iRes').textContent = '–'; $('#iResSub').textContent = ''; $('#iCalc').textContent = ''; errE.hidden = false; errE.textContent = t('inv_bad'); return; }
      $('#iRes').textContent = f(r.ah, 0) + ' Ah';
      $('#iResSub').textContent = t('r_ah_sub', { n: EDU.fmt(r.n), v: f(r.v, 1), h: f(r.want, 2) });
      $('#iCalc').textContent = D(r.load) + ' × ' + D(r.want) + ' ÷ (' + D(r.v) + ' × ' + r.n + ' × ' + D(r.dod) + ' × ' + D(r.eff) + ') = ' + D(r.ah, 1) + ' Ah';
    } else {
      $('#iResLbl').textContent = t('r_hours');
      $('#iFormula').textContent = t('formula_hours');
      if (!isFinite(r.hours)) { $('#iRes').textContent = '–'; $('#iResSub').textContent = ''; $('#iCalc').textContent = ''; errE.hidden = false; errE.textContent = t('inv_bad'); return; }
      $('#iRes').textContent = hm(r.hours);
      $('#iResSub').textContent = t('r_hours_sub', { h: f(r.hours, 2), w: f(r.load, 0) });
      $('#iCalc').textContent = D(r.ah) + ' × ' + D(r.v) + ' × ' + r.n + ' × ' + D(r.dod) + ' × ' + D(r.eff) + ' ÷ ' + D(r.load) + ' = ' + D(r.hours) + ' h';
    }
  }

  /* ------------------------------------------------------------ solar */
  ['units', 'gen', 'area', 'cost', 'tariff'].forEach(function (k) {
    bindNum('s' + k.charAt(0).toUpperCase() + k.slice(1), function () { return sol; }, k, function () { renderSolOut(); });
  });
  $('#sCat').addEventListener('change', function () { sol.cat = this.value === 'spl' ? 'spl' : 'gen'; save(); renderSolOut(); });
  $('#sUseTotal').addEventListener('change', function () { sol.useTotal = this.checked; if (!sol.useTotal) sol.units = Math.round(totalUnits()) || sol.units; save(); renderSol(); });
  $('#sUseAvg').addEventListener('change', function () { sol.useAvg = this.checked; var b = calcBill(); if (!sol.useAvg && b && b.avg > 0) sol.tariff = Math.round(b.avg * 100) / 100; save(); renderSol(); });
  function renderSol() {
    var b = calcBill();
    $('#sUseTotal').checked = sol.useTotal;
    $('#sUseTotalLbl').textContent = t('use_total', { n: f(totalUnits(), 0) });
    $('#sUseAvg').checked = sol.useAvg;
    $('#sUseAvgLbl').textContent = t('use_avg', { r: b && b.avg > 0 ? rs(b.avg) : '–' });
    $('#sUnits').disabled = sol.useTotal; $('#sTariff').disabled = sol.useAvg;
    setVal('sGen', sol.gen); setVal('sArea', sol.area); setVal('sCost', sol.cost);
    $('#sCat').value = sol.cat;
    renderSolOut();
  }
  function renderSolOut() {
    var s = calcSol(), errE = $('#sErr');
    setVal('sUnits', sol.useTotal ? Math.round(s.units * 10) / 10 : sol.units);
    setVal('sTariff', sol.useAvg && s.tariff ? Math.round(s.tariff * 100) / 100 : sol.tariff);
    var ids = ['sSize', 'sExact', 'sAreaOut', 'sGenOut', 'sSub', 'sNet', 'sSave', 'sPay'];
    if (s.bad) {
      ids.forEach(function (id) { $('#' + id).textContent = id === 'sExact' ? '' : '–'; });
      errE.hidden = false; errE.textContent = t('sol_bad'); return;
    }
    errE.hidden = true;
    $('#sSize').textContent = f(s.kw, 1) + ' kW';
    $('#sExact').textContent = t('r_exact', { n: f(s.exact, 2) });
    $('#sAreaOut').textContent = t('sqft', { n: f(s.area, 0) });
    $('#sGenOut').textContent = t('gen_val', { m: f(s.month, 0), y: f(s.year, 0) });
    $('#sSub').textContent = rs0(s.sub);
    $('#sNet').textContent = rs0(s.net);
    $('#sSave').textContent = rs0(s.saving);
    $('#sPay').textContent = isFinite(s.payback) && s.net > 0 ? t('years', { n: f(s.payback, 1) }) : '–';
  }

  /* ------------------------------------------------------------ summary / print / reset */
  function summary() {
    var tot = totalUnits(), b = calcBill(), r = calcInv(), s = calcSol();
    var lines = [t('sum_title') + ' (' + new Date().toLocaleDateString('en-IN') + ')', ''];
    lines.push(t('sum_use', { n: f(tot) }));
    rows.filter(function (x) { return rowUnits(x) > 0; }).sort(function (a, b2) { return rowUnits(b2) - rowUnits(a); }).forEach(function (x) {
      lines.push('• ' + apName(x) + ': ' + t('units_n', { n: f(rowUnits(x)) }));
    });
    lines.push('');
    if (b) lines.push(t('sum_bill', { r: rs(b.total), u: f(b.units, 2) }) + (bill.sample ? ' [' + t('sample_badge') + ']' : ''));
    if (r) {
      if (inv.mode === 'ah' && isFinite(r.ah)) lines.push(t('sum_inv_ah', { n: f(r.ah, 0), v: f(r.v, 1), h: f(r.want, 2), w: f(r.load, 0) }));
      else if (isFinite(r.hours)) lines.push(t('sum_inv', { h: hm(r.hours), w: f(r.load, 0) }));
    }
    if (!s.bad) lines.push(t('sum_sol', { k: f(s.kw, 1), a: f(s.area, 0), s: rs0(s.sub) }));
    lines.push('', t('app_title') + ' · apnipathshala.ai');
    return lines.join('\n');
  }
  $('#copySum').addEventListener('click', function () { EDU.copy(summary()); });
  $('#printBtn').addEventListener('click', function () {
    $('#printDate').textContent = new Date().toLocaleDateString('en-IN');
    window.print();
  });
  $('#resetBtn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    rows = defaultRows(); bill = defaultBill(); inv = defaultInv(); sol = defaultSol();
    save(); renderRows(); renderAll();
  });

  function renderAll() {
    /* every section is rendered (not only the open tab) so print and the summary always show fresh numbers */
    renderTotals(); renderBars(); renderTips(); renderBill(); renderInv(); renderSol();
  }
  function renderLang() { renderPicker(); renderRows(); renderAll(); }

  /* test hook (read-only): lets the interaction test check the maths directly */
  window.__ebTest = { slabCharge: slabCharge, subsidyFor: subsidyFor, totalUnits: totalUnits, rowUnits: function (i) { return rows[i] ? rowUnits(rows[i]) : NaN; } };

  EDU.onLang(renderLang);
  renderPicker(); renderRows();
  setTab(tab);
})();
