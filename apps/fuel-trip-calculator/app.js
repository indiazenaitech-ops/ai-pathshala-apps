/* Fuel, Mileage & Trip Cost
   1. Mileage: quick tank-to-tank check + a fuel log per vehicle (full-to-full method, partial fills carried over),
      mileage trend and monthly spend charts (own SVG), CSV export.
   2. Trip cost: fuel + tolls + parking + food/stay, per person, and bike vs car vs bus/train.
   3. EV vs petrol/diesel/CNG: running cost per km, monthly saving, break-even, cumulative cost chart.
   4. Unit helpers: km/l <-> l/100 km <-> mpg (UK/US), price per litre <-> cost per km.
   Nothing is fetched: the user types today's prices. Everything is saved with EDU.store on this device. */
(function () {
  'use strict';
  var SLUG = 'fuel-trip-calculator';
  var store = EDU.store(SLUG);
  var $ = EDU.$, $$ = EDU.$$, el = EDU.el;

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ============================================================ constants */
  var FUELS = {
    petrol: { unit: 'l', eff: 'km/l', per100: 'l/100 km', qty: 'qty_l', price: 'price_l', def: 105 },
    diesel: { unit: 'l', eff: 'km/l', per100: 'l/100 km', qty: 'qty_l', price: 'price_l', def: 92 },
    cng: { unit: 'kg', eff: 'km/kg', per100: 'kg/100 km', qty: 'qty_kg', price: 'price_kg', def: 85 },
    ev: { unit: 'kWh', eff: 'km/kWh', per100: 'kWh/100 km', qty: 'qty_kwh', price: 'price_kwh', def: 8 }
  };
  var FUEL_IDS = ['petrol', 'diesel', 'cng', 'ev'];
  var KM_PER_MILE = 1.609344, L_PER_UKGAL = 4.54609, L_PER_USGAL = 3.785411784;
  var MPG_UK = L_PER_UKGAL / KM_PER_MILE, MPG_US = L_PER_USGAL / KM_PER_MILE;   /* km/l -> mpg factors */
  var MAX = 1e12;

  var EXAMPLE_LOG = [
    ['2026-07-03', 15200, 32, 104.5, true],
    ['2026-07-19', 15655, 30.2, 104.5, true],
    ['2026-08-06', 16090, 29, 104.8, true],
    ['2026-08-24', 16480, 15, 104.8, false],
    ['2026-09-02', 16610, 18, 105.1, true],
    ['2026-09-21', 17090, 31.5, 105.1, true],
    ['2026-10-09', 17540, 28.4, 105.4, true]
  ];
  var TRIP_DEF = { way: 'round', dist: '150', fuel: 'petrol', mileage: '15', price: '105', tolls: '300', parking: '100', food: '1500', stay: '0', other: '0', people: '3', bikeMil: '45', bikePrice: '105', ticket: '450' };
  var EV_DEF = {
    car: { kind: 'car', km: '1500', fuel: 'petrol', fPrice: '900000', fMil: '15', fRate: '105', fServ: '6000', ePrice: '1300000', eff: '7', home: '8', pub: '20', share: '80', loss: '10', eServ: '3500' },
    '2w': { kind: '2w', km: '1000', fuel: 'petrol', fPrice: '100000', fMil: '45', fRate: '105', fServ: '2500', ePrice: '140000', eff: '30', home: '8', pub: '20', share: '90', loss: '10', eServ: '1500' }
  };

  /* ============================================================ helpers */
  function isRtl() { return document.documentElement.dir === 'rtl'; }
  /* EDU.t, with inserted values isolated in right-to-left pages so "₹1,234" stays in one piece */
  function t(key, vars) {
    if (vars && isRtl()) { var o = {}; Object.keys(vars).forEach(function (k) { o[k] = '⁨' + vars[k] + '⁩'; }); vars = o; }
    return EDU.t(key, vars);
  }
  function plain(s) { return String(s).replace(/[⁦-⁩]/g, ''); }
  var ZEROS = [0x966, 0x9E6, 0xA66, 0xAE6, 0xB66, 0xBE6, 0xC66, 0xCE6, 0xD66, 0x660, 0x6F0];
  function toLatin(s) {
    return String(s == null ? '' : s).replace(/[०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯٠-٩۰-۹]/g, function (c) {
      var code = c.charCodeAt(0);
      for (var i = 0; i < ZEROS.length; i++) if (code >= ZEROS[i] && code <= ZEROS[i] + 9) return String(code - ZEROS[i]);
      return c;
    });
  }
  /* parse a typed number: Indian digits, commas, spaces and ₹ are accepted; '' or junk -> NaN */
  function num(v) {
    var s = toLatin(v).replace(/[,\s₹%]/g, '').replace(/٫/g, '.');
    if (!s || !/^-?\d*\.?\d+$|^-?\d+\.$/.test(s)) return NaN;
    var n = parseFloat(s);
    return isFinite(n) ? n : NaN;
  }
  function val(id) { return num($('#' + id).value); }
  function nf(v, max, min) { return new Intl.NumberFormat('en-IN', { maximumFractionDigits: max === undefined ? 2 : max, minimumFractionDigits: min || 0 }).format(v); }
  function rs(v) {   /* whole rupees when round, else paise */
    if (!isFinite(v)) return '–';
    var neg = v < 0; v = Math.abs(v);
    var r = Math.round(v * 100) / 100;
    return (neg ? '−' : '') + '₹' + (Math.abs(r - Math.round(r)) < 0.005 ? nf(Math.round(r), 0) : nf(r, 2, 2));
  }
  function rs2(v) { return isFinite(v) ? '₹' + nf(v, 2, 2) : '–'; }
  function rs0(v) { return isFinite(v) ? (v < 0 ? '−' : '') + '₹' + nf(Math.abs(Math.round(v)), 0) : '–'; }
  function rsShort(v) {
    try { return '₹' + new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(v); } catch (e) { return rs0(v); }
  }
  function km(v) { return nf(v, 1) + ' km'; }
  function dateFmt(iso, opts) {
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return iso;
    try { return new Intl.DateTimeFormat(EDU.langInfo(EDU.lang).tag, Object.assign({ numberingSystem: 'latn' }, opts || { day: 'numeric', month: 'short', year: 'numeric' })).format(d); }
    catch (e) { return iso; }
  }
  function todayIso() { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function setInvalid(id, bad) { var e = $('#' + id); if (bad) e.setAttribute('aria-invalid', 'true'); else e.removeAttribute('aria-invalid'); }
  function fuelOptions(sel, ids) {
    var cur = sel.value;
    sel.innerHTML = '';
    (ids || FUEL_IDS).forEach(function (f) { sel.appendChild(el('option', { value: f, text: t('fuel_' + f) })); });
    if (cur) sel.value = cur;
  }
  function svgEl(markup, w, h, label) {
    return '<svg class="chart no-i18n" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + EDU.esc(plain(label)) + '">' + markup + '</svg>';
  }
  function txt(x, y, s, anchor, extra) {
    return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="' + (anchor || 'middle') + '" style="fill:var(--muted);font-size:12px"' + (extra || '') + '>' + EDU.esc(s) + '</text>';
  }
  function niceMax(v) {
    if (!(v > 0)) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
  }

  /* ============================================================ state */
  var vehicles = store.get('vehicles', null);
  if (!Array.isArray(vehicles) || !vehicles.length) vehicles = [{ id: 'v1', name: '', fuel: 'petrol' }];
  var vid = store.get('vid', vehicles[0].id);
  var log = store.get('log', null);
  if (!Array.isArray(log)) log = makeExample();
  var trip = Object.assign({}, TRIP_DEF, store.get('trip', {}));
  var ev = Object.assign({}, EV_DEF.car, store.get('ev', {}));
  var quick = Object.assign({ fuel: 'petrol' }, store.get('quick', {}));
  var units = Object.assign({ solve: 'cpk' }, store.get('units', {}));
  var tab = store.get('tab', 'mileage');
  var editId = null, vFormMode = null;

  function makeExample() {
    return EXAMPLE_LOG.map(function (r, i) { return { id: 'ex' + i, vid: 'v1', date: r[0], odo: r[1], qty: r[2], price: r[3], full: r[4], ex: true }; });
  }
  function saveLog() { store.set('log', log); }
  function saveVehicles() { store.set('vehicles', vehicles); store.set('vid', vid); }
  function curV() { for (var i = 0; i < vehicles.length; i++) if (vehicles[i].id === vid) return vehicles[i]; vid = vehicles[0].id; return vehicles[0]; }
  function vName(v) { return v.name || t('def_vehicle'); }
  function vLog(id) { return log.filter(function (e) { return e.vid === id; }); }

  /* ============================================================ tabs */
  var TABS = ['mileage', 'trip', 'ev', 'units'];
  function showTab(name, focus) {
    if (TABS.indexOf(name) < 0) name = 'mileage';
    tab = name; store.set('tab', name);
    TABS.forEach(function (n) {
      var b = $('#tab-' + n), on = n === name;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      $('#p-' + n).hidden = !on;
    });
    if (focus) $('#tab-' + name).focus();
  }
  $$('.ft-tabs [role="tab"]').forEach(function (b) {
    b.addEventListener('click', function () { showTab(b.dataset.tab); });
    b.addEventListener('keydown', function (e) {
      var i = TABS.indexOf(b.dataset.tab), d = 0;
      if (e.key === 'ArrowRight') d = isRtl() ? -1 : 1;
      else if (e.key === 'ArrowLeft') d = isRtl() ? 1 : -1;
      else if (e.key === 'Home') { showTab(TABS[0], true); e.preventDefault(); return; }
      else if (e.key === 'End') { showTab(TABS[TABS.length - 1], true); e.preventDefault(); return; }
      if (d) { showTab(TABS[(i + d + TABS.length) % TABS.length], true); e.preventDefault(); }
    });
  });

  /* ============================================================ 1a. quick tank-to-tank */
  var qRes = null;
  function renderQuick() {
    var f = FUELS[$('#qFuel').value] || FUELS.petrol;
    $('#qQtyLbl').textContent = t(f.qty);
    $('#qPriceLbl').textContent = t(f.price);
    var a = val('qStart'), b = val('qEnd'), q = val('qQty'), p = val('qPrice');
    var msg = '';
    setInvalid('qEnd', false); setInvalid('qQty', false);
    if (isFinite(a) && isFinite(b) && b <= a) { msg = t('err_odo_order'); setInvalid('qEnd', true); }
    else if (!(q > 0) && $('#qQty').value.trim() !== '') { msg = t('err_qty_need'); setInvalid('qQty', true); }
    $('#qMsg').textContent = msg;
    qRes = null;
    if (!msg && isFinite(a) && isFinite(b) && q > 0 && b - a < MAX) {
      var d = b - a, m = d / q;
      qRes = { d: d, m: m, f: f, cost: p > 0 ? q * p : NaN, cpk: p > 0 ? q * p / d : NaN };
    }
    $('#qMileage').textContent = qRes ? nf(qRes.m, 2) + ' ' + f.eff : '–';
    $('#qDist').textContent = qRes ? km(qRes.d) : '–';
    $('#qCpk').textContent = qRes && isFinite(qRes.cpk) ? rs2(qRes.cpk) : '–';
    $('#qCost').textContent = qRes && isFinite(qRes.cost) ? rs(qRes.cost) : '–';
    $('#qL100').textContent = qRes ? nf(100 / qRes.m, 2) + ' ' + f.per100 : '';
    $('#qMileage').dataset.v = qRes ? qRes.m : '';
    $('#qUseTrip').disabled = !qRes;
  }
  ['qStart', 'qEnd', 'qQty', 'qPrice'].forEach(function (id) {
    $('#' + id).addEventListener('input', function () { saveQuick(); renderQuick(); });
  });
  $('#qFuel').addEventListener('change', function () {
    var f = FUELS[$('#qFuel').value];
    $('#qPrice').value = String(f.def);
    saveQuick(); renderQuick();
  });
  function saveQuick() {
    store.set('quick', { fuel: $('#qFuel').value, start: $('#qStart').value, end: $('#qEnd').value, qty: $('#qQty').value, price: $('#qPrice').value });
  }
  $('#qUseTrip').addEventListener('click', function () {
    if (!qRes) return;
    $('#tFuel').value = $('#qFuel').value;
    $('#tMileage').value = String(Math.round(qRes.m * 100) / 100);
    if (val('qPrice') > 0) $('#tPrice').value = $('#qPrice').value;
    saveTrip(); renderTrip();
    showTab('trip', true);
    window.scrollTo(0, 0);
  });

  /* ============================================================ 1b. vehicles */
  function renderVehicles() {
    var sel = $('#vSel');
    sel.innerHTML = '';
    vehicles.forEach(function (v) { sel.appendChild(el('option', { value: v.id, text: vName(v) + ' · ' + t('fuel_' + v.fuel) })); });
    sel.value = curV().id;
    $('#vDel').disabled = vehicles.length < 2;
  }
  $('#vSel').addEventListener('change', function () { vid = $('#vSel').value; saveVehicles(); cancelEdit(); renderLogAll(); });
  function openVForm(mode) {
    vFormMode = mode;
    var v = curV();
    $('#vForm').hidden = false;
    $('#vName').value = mode === 'edit' ? vName(v) : '';
    $('#vFuel').value = mode === 'edit' ? v.fuel : 'petrol';
    $('#vMsg').textContent = '';
    $('#vName').focus();
  }
  $('#vAdd').addEventListener('click', function () { openVForm('add'); });
  $('#vEdit').addEventListener('click', function () { openVForm('edit'); });
  $('#vCancel').addEventListener('click', function () { $('#vForm').hidden = true; });
  $('#vForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('#vName').value.trim().slice(0, 40), fuel = $('#vFuel').value;
    if (!name) { $('#vMsg').textContent = t('err_vname'); $('#vName').focus(); return; }
    var dup = vehicles.some(function (v) { return vName(v).toLowerCase() === name.toLowerCase() && !(vFormMode === 'edit' && v.id === vid); });
    if (dup) { $('#vMsg').textContent = t('err_vdup', { name: name }); return; }
    if (vFormMode === 'add') {
      if (vehicles.length >= 20) { $('#vMsg').textContent = t('err_vmax'); return; }
      var nv = { id: uid(), name: name, fuel: fuel };
      vehicles.push(nv); vid = nv.id;
    } else {
      var v = curV();
      v.name = name;
      if (v.fuel !== fuel) {
        if (vLog(v.id).length && !confirm(t('confirm_fuel_change'))) return;
        v.fuel = fuel;
      }
    }
    saveVehicles();
    $('#vForm').hidden = true;
    cancelEdit();
    renderLogAll();
  });
  $('#vDel').addEventListener('click', function () {
    if (vehicles.length < 2) return;
    var v = curV(), n = vLog(v.id).length;
    if (!confirm(t('confirm_del_vehicle', { name: vName(v), n: n }))) return;
    vehicles = vehicles.filter(function (x) { return x.id !== v.id; });
    log = log.filter(function (e) { return e.vid !== v.id; });
    vid = vehicles[0].id;
    saveVehicles(); saveLog(); cancelEdit(); renderLogAll();
  });

  /* ============================================================ 1c. fuel log */
  /* Full-to-full method: mileage is known at each full fill that follows an earlier full fill; the fuel counted
     is everything filled after that earlier full fill (partial top-ups included), the distance is the odometer gap. */
  function analyse(list) {
    var s = list.slice().sort(function (a, b) { return a.odo - b.odo; });
    var per = {}, points = [], lastFull = -1, acc = 0, accCost = 0, sd = 0, sq = 0, sc = 0, spent = 0;
    s.forEach(function (e, i) {
      spent += e.qty * e.price;
      if (lastFull >= 0) { acc += e.qty; accCost += e.qty * e.price; }
      if (e.full) {
        if (lastFull >= 0 && acc > 0) {
          var d = e.odo - s[lastFull].odo;
          per[e.id] = d / acc;
          points.push({ date: e.date, m: d / acc });
          sd += d; sq += acc; sc += accCost;
        }
        lastFull = i; acc = 0; accCost = 0;
      }
    });
    var months = {};
    s.forEach(function (e) { var k = String(e.date).slice(0, 7); months[k] = (months[k] || 0) + e.qty * e.price; });
    return {
      sorted: s, per: per, points: points, avg: sq > 0 ? sd / sq : null, cpk: sd > 0 ? sc / sd : null,
      spent: spent, dist: s.length > 1 ? s[s.length - 1].odo - s[0].odo : 0, fills: s.length, months: months
    };
  }
  var lastA = null;

  function lastPrice(list, fuel) {
    var s = list.slice().sort(function (a, b) { return b.odo - a.odo; });
    return s.length ? s[0].price : FUELS[fuel].def;
  }
  function resetForm() {
    var v = curV(), list = vLog(v.id);
    $('#lDate').value = todayIso();
    $('#lOdo').value = '';
    $('#lQty').value = '';
    $('#lPrice').value = String(lastPrice(list.filter(function (e) { return !e.ex; }), v.fuel));
    $('#lFull').checked = true;
    $('#lMsg').textContent = '';
    ['lOdo', 'lQty', 'lPrice'].forEach(function (id) { setInvalid(id, false); });
  }
  function cancelEdit() { editId = null; resetForm(); renderFormHead(); }
  function renderFormHead() {
    var f = FUELS[curV().fuel];
    $('#lQtyLbl').textContent = t(f.qty);
    $('#lPriceLbl').textContent = t(f.price);
    $('#lFormTitle').textContent = t(editId ? 'f_edit_entry' : 'f_new_entry');
    $('#lSave').textContent = t(editId ? 'btn_save_entry' : 'btn_add_entry');
    $('#lCancel').hidden = !editId;
  }
  $('#lCancel').addEventListener('click', cancelEdit);
  $('#lForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = curV(), odo = val('lOdo'), qty = val('lQty'), price = val('lPrice'), date = $('#lDate').value || todayIso();
    ['lOdo', 'lQty', 'lPrice'].forEach(function (id) { setInvalid(id, false); });
    var msg = '', bad = '';
    if (!(odo >= 0) || odo > 1e8) { msg = t('err_odo_need'); bad = 'lOdo'; }
    else if (!(qty > 0) || qty > 100000) { msg = t('err_qty_need'); bad = 'lQty'; }
    else if (!(price > 0) || price > 100000) { msg = t('err_price_need'); bad = 'lPrice'; }
    else if (vLog(v.id).some(function (x) { return !x.ex && x.id !== editId && x.odo === odo; })) { msg = t('err_odo_dup'); bad = 'lOdo'; }
    $('#lMsg').textContent = msg;
    if (msg) { setInvalid(bad, true); $('#' + bad).focus(); return; }
    var hadEx = log.some(function (x) { return x.ex; });
    if (hadEx) log = log.filter(function (x) { return !x.ex; });
    if (editId) {
      log.forEach(function (x) { if (x.id === editId) { x.date = date; x.odo = odo; x.qty = qty; x.price = price; x.full = $('#lFull').checked; } });
    } else {
      if (log.length >= 5000) { $('#lMsg').textContent = t('err_log_max'); return; }
      log.push({ id: uid(), vid: v.id, date: date, odo: odo, qty: qty, price: price, full: $('#lFull').checked });
    }
    saveLog();
    var was = editId;
    editId = null;
    resetForm(); renderFormHead(); renderLog();
    EDU.toast(hadEx ? t('toast_ex_cleared') : t(was ? 'toast_saved' : 'toast_added'));
    $('#lOdo').focus();
  });
  $('#exClear').addEventListener('click', function () {
    log = log.filter(function (x) { return !x.ex; });
    saveLog(); cancelEdit(); renderLog();
  });

  function renderLog() {
    var v = curV(), f = FUELS[v.fuel], list = vLog(v.id), a = analyse(list);
    lastA = a;
    $('#statsName').textContent = '· ' + vName(v);
    $('#exNote').hidden = !list.some(function (x) { return x.ex; });
    $('#sAvg').textContent = a.avg ? nf(a.avg, 2) + ' ' + f.eff : '–';
    $('#sAvg').dataset.v = a.avg || '';
    $('#sAvgSub').textContent = a.avg ? nf(100 / a.avg, 2) + ' ' + f.per100 : '';
    $('#sCpk').textContent = a.cpk ? rs2(a.cpk) : '–';
    $('#sSpent').textContent = rs(a.spent);
    $('#sSpent').dataset.v = a.spent;
    $('#sDist').textContent = km(a.dist);
    $('#sFills').textContent = nf(a.fills, 0);
    $('#needTwo').hidden = !!a.avg || !list.length;

    var body = $('#logBody');
    body.innerHTML = '';
    var rows = a.sorted.slice().reverse();
    rows.forEach(function (e) {
      var m = a.per[e.id];
      var tr = el('tr', { class: e.id === editId ? 'editing' : '', dataset: { id: e.id } },
        el('td', { text: dateFmt(e.date) }),
        el('td', { class: 'num', text: nf(e.odo, 1) }),
        el('td', { class: 'num', text: nf(e.qty, 2) + ' ' + f.unit }),
        el('td', { class: 'num', text: rs2(e.price) }),
        el('td', { class: 'num', text: rs(e.qty * e.price) }),
        el('td', { class: m ? 'num' : 'muted' , text: m ? nf(m, 2) + ' ' + f.eff : (e.full ? '–' : t('partial')) }),
        el('td', { class: 'acts' },
          el('button', { type: 'button', class: 'iconbtn', 'aria-label': plain(t('aria_edit', { date: dateFmt(e.date) })), title: t('edit'), text: '✎', onclick: function () { startEdit(e.id); } }),
          el('button', { type: 'button', class: 'iconbtn danger', 'aria-label': plain(t('aria_del', { date: dateFmt(e.date) })), title: t('delete'), text: '🗑', onclick: function () { delEntry(e.id); } })
        )
      );
      body.appendChild(tr);
    });
    $('#logTable').hidden = !rows.length;
    $('#logEmpty').hidden = !!rows.length;
    $('#logCsv').disabled = !rows.length;
    drawTrend(a, f);
    drawMonths(a);
    renderTripFromLog();
  }
  function startEdit(id) {
    var e = log.filter(function (x) { return x.id === id; })[0];
    if (!e) return;
    editId = id;
    $('#lDate').value = e.date; $('#lOdo').value = String(e.odo); $('#lQty').value = String(e.qty); $('#lPrice').value = String(e.price);
    $('#lFull').checked = !!e.full; $('#lMsg').textContent = '';
    renderFormHead(); renderLog();
    $('#lForm').scrollIntoView({ block: 'center' });
    $('#lOdo').focus();
  }
  function delEntry(id) {
    var e = log.filter(function (x) { return x.id === id; })[0];
    if (!e || !confirm(plain(t('confirm_del_entry', { date: dateFmt(e.date) })))) return;
    log = log.filter(function (x) { return x.id !== id; });
    if (editId === id) cancelEdit();
    saveLog(); renderLog();
  }
  function renderLogAll() { renderVehicles(); renderFormHead(); resetForm(); renderLog(); }

  /* ---------- charts (own SVG; colours from CSS tokens so dark mode just works) */
  function drawTrend(a, f) {
    var box = $('#trendBox'), pts = a.points.slice(-24);
    if (!pts.length) { box.innerHTML = ''; box.appendChild(el('p', { class: 'empty', text: t('chart_empty') })); return; }
    var W = 420, H = 230, L = 44, R = 12, T = 14, B = 34;
    var ms = pts.map(function (p) { return p.m; });
    var lo = Math.min.apply(null, ms.concat([a.avg])), hi = Math.max.apply(null, ms.concat([a.avg]));
    var pad = Math.max((hi - lo) * 0.2, hi * 0.05, 0.5);
    lo = Math.max(0, Math.floor(lo - pad)); hi = Math.ceil(hi + pad);
    var X = function (i) { return pts.length === 1 ? (L + W - R) / 2 : L + i * (W - L - R) / (pts.length - 1); };
    var Y = function (v) { return T + (hi - v) * (H - T - B) / (hi - lo || 1); };
    var g = '';
    for (var k = 0; k <= 4; k++) {
      var v = lo + (hi - lo) * k / 4, y = Y(v);
      g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" style="stroke:var(--border);stroke-width:1"/>';
      g += txt(L - 6, y + 4, nf(v, 1), 'end');
    }
    var step = Math.max(1, Math.ceil(pts.length / 5));
    pts.forEach(function (p, i) { if (i % step === 0 || i === pts.length - 1) g += txt(X(i), H - 12, dateFmt(p.date, { day: 'numeric', month: 'short' })); });
    var ya = Y(a.avg);
    g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + ya.toFixed(1) + '" y2="' + ya.toFixed(1) + '" style="stroke:var(--accent);stroke-width:2;stroke-dasharray:6 4"/>';
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.m).toFixed(1); }).join(' ');
    g += '<path d="' + d + '" style="fill:none;stroke:var(--c1);stroke-width:3;stroke-linejoin:round;stroke-linecap:round"/>';
    pts.forEach(function (p, i) { g += '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(p.m).toFixed(1) + '" r="4.5" style="fill:var(--surface);stroke:var(--c1);stroke-width:2.5"><title>' + EDU.esc(dateFmt(p.date) + ': ' + nf(p.m, 2) + ' ' + f.eff) + '</title></circle>'; });
    g += txt(L, 10, f.eff, 'start', ' style="fill:var(--muted);font-size:11px"');
    box.innerHTML = svgEl(g, W, H, t('ch_trend') + ': ' + t('st_avg') + ' ' + nf(a.avg, 2) + ' ' + f.eff);
  }
  function drawMonths(a) {
    var box = $('#monthBox'), keys = Object.keys(a.months).sort().slice(-6);
    if (!keys.length) { box.innerHTML = ''; box.appendChild(el('p', { class: 'empty', text: t('chart_empty') })); return; }
    var W = 420, H = 230, L = 10, R = 10, T = 22, B = 34;
    var vals = keys.map(function (k) { return a.months[k]; });
    var top = niceMax(Math.max.apply(null, vals));
    var slot = (W - L - R) / keys.length, bw = Math.min(54, slot * 0.62);
    var g = '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B) + '" y2="' + (H - B) + '" style="stroke:var(--border);stroke-width:1"/>';
    var multiYear = keys[0].slice(0, 4) !== keys[keys.length - 1].slice(0, 4);
    keys.forEach(function (k, i) {
      var v = a.months[k], h = (H - T - B) * v / top, x = L + slot * i + (slot - bw) / 2, y = H - B - h;
      g += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(h, 1).toFixed(1) + '" rx="5" style="fill:var(--primary)"><title>' + EDU.esc(rs(v)) + '</title></rect>';
      g += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (y - 6).toFixed(1) + '" text-anchor="middle" style="fill:var(--text);font-size:12px;font-weight:700">' + EDU.esc(rs0(v)) + '</text>';
      g += txt(x + bw / 2, H - 12, dateFmt(k + '-01', multiYear ? { month: 'short', year: '2-digit' } : { month: 'short' }));
    });
    box.innerHTML = svgEl(g, W, H, t('ch_month') + ': ' + keys.map(function (k, i) { return dateFmt(k + '-01', { month: 'long', year: 'numeric' }) + ' ' + rs0(vals[i]); }).join(', '));
  }

  $('#logCsv').addEventListener('click', function () {
    var v = curV(), f = FUELS[v.fuel], a = analyse(vLog(v.id));
    var rows = [[t('th_date'), t('lbl_vehicle'), t('lbl_fuel'), t('th_odo'), t('th_qty'), t('csv_unit'), t('th_price'), t('th_cost'), t('f_full'), t('th_mileage'), t('csv_mil_unit')]];
    a.sorted.forEach(function (e) {
      rows.push([e.date, vName(v), t('fuel_' + v.fuel), e.odo, e.qty, f.unit, e.price.toFixed(2), (e.qty * e.price).toFixed(2), e.full ? t('yes') : t('no'), a.per[e.id] ? a.per[e.id].toFixed(2) : '', f.eff]);
    });
    var safe = vName(v).replace(/[^\wऀ-෿؀-ۿ-]+/g, '-').replace(/^-+|-+$/g, '') || 'vehicle';
    EDU.download('fuel-log-' + safe + '.csv', EDU.csv.stringify(rows.map(function (r) { return r.map(plain); })), 'text/csv');
  });
  function logSummary() {
    var v = curV(), f = FUELS[v.fuel], a = lastA || analyse(vLog(v.id));
    var lines = [vName(v) + ' (' + t('fuel_' + v.fuel) + ')'];
    lines.push(t('st_avg') + ': ' + (a.avg ? nf(a.avg, 2) + ' ' + f.eff : '–'));
    lines.push(t('st_cpk') + ': ' + (a.cpk ? rs2(a.cpk) : '–'));
    lines.push(t('st_spent') + ': ' + rs(a.spent) + ' · ' + t('st_fills') + ': ' + a.fills + ' · ' + t('st_dist') + ': ' + km(a.dist));
    return plain(lines.join('\n'));
  }
  $('#logCopy').addEventListener('click', function () { EDU.copy(logSummary()); });
  $('#logPrint').addEventListener('click', function () { window.print(); });

  /* ============================================================ 2. trip cost */
  var TRIP_FIELDS = { tDist: 'dist', tMileage: 'mileage', tPrice: 'price', tTolls: 'tolls', tParking: 'parking', tFood: 'food', tStay: 'stay', tOther: 'other', tPeople: 'people', cBikeMil: 'bikeMil', cBikePrice: 'bikePrice', cTicket: 'ticket' };
  function loadTrip() {
    Object.keys(TRIP_FIELDS).forEach(function (id) { $('#' + id).value = trip[TRIP_FIELDS[id]]; });
    $('#tFuel').value = FUELS[trip.fuel] ? trip.fuel : 'petrol';
  }
  function saveTrip() {
    Object.keys(TRIP_FIELDS).forEach(function (id) { trip[TRIP_FIELDS[id]] = $('#' + id).value; });
    trip.fuel = $('#tFuel').value;
    store.set('trip', trip);
  }
  Object.keys(TRIP_FIELDS).forEach(function (id) { $('#' + id).addEventListener('input', function () { saveTrip(); renderTrip(); }); });
  $('#tFuel').addEventListener('change', function () {
    var f = FUELS[$('#tFuel').value];
    $('#tPrice').value = String(f.def);
    saveTrip(); renderTrip();
  });
  $$('#tWay button').forEach(function (b) { b.addEventListener('click', function () { trip.way = b.dataset.way; store.set('trip', trip); renderTrip(); }); });
  function opt0(id) { var v = val(id); return isFinite(v) && v > 0 ? Math.min(v, MAX) : 0; }
  var tRes = null;
  function renderTrip() {
    var f = FUELS[$('#tFuel').value] || FUELS.petrol;
    $('#tMileageLbl').textContent = t('lbl_mileage', { u: f.eff });
    $('#tPriceLbl').textContent = t(f.price);
    $$('#tWay button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.way === trip.way ? 'true' : 'false'); });
    var round = trip.way === 'round';
    var dist = val('tDist'), mil = val('tMileage'), price = val('tPrice'), ppl = Math.floor(val('tPeople'));
    var msg = '';
    ['tDist', 'tMileage', 'tPrice', 'tPeople'].forEach(function (id) { setInvalid(id, false); });
    if (!(dist > 0) || dist > 1e6) { msg = t('err_dist'); setInvalid('tDist', true); }
    else if (!(mil > 0) || mil > 10000) { msg = t('err_mileage'); setInvalid('tMileage', true); }
    else if (!(price >= 0) || price > 100000) { msg = t('err_price_need'); setInvalid('tPrice', true); }
    else if (!(ppl >= 1) || ppl > 1000) { msg = t('err_people'); setInvalid('tPeople', true); }
    $('#tMsg').textContent = msg;
    $('#tOut').hidden = !!msg;
    tRes = null;
    if (msg) { renderCompare(); return; }
    var total = dist * (round ? 2 : 1), qty = total / mil, fuel = qty * price;
    var r = { f: f, round: round, dist: dist, totalKm: total, qty: qty, fuel: fuel, tolls: opt0('tTolls'), parking: opt0('tParking'), food: opt0('tFood'), stay: opt0('tStay'), other: opt0('tOther'), ppl: ppl };
    r.drive = r.fuel + r.tolls + r.parking;
    r.total = r.drive + r.food + r.stay + r.other;
    r.pp = r.total / ppl;
    tRes = r;
    $('#tTotal').textContent = rs(r.total); $('#tTotal').dataset.v = r.total;
    $('#tPP').textContent = rs(r.pp); $('#tPP').dataset.v = r.pp;
    $('#tPPsub').textContent = t('pp_sub', { n: ppl });
    $('#tFuelNeed').textContent = nf(qty, 2) + ' ' + f.unit;
    $('#tCpk').textContent = rs2(r.drive / total);
    var b = $('#tBreak'); b.innerHTML = '';
    function line(label, v, cls) { b.appendChild(el('div', { class: cls || '' }, el('span', { text: label }), el('span', { class: 'num', text: v }))); }
    line(t('r_total_km'), km(total) + (round ? ' (' + nf(dist, 1) + ' × 2)' : ''));
    line(t('r_fuel_cost'), nf(qty, 2) + ' ' + f.unit + ' × ' + rs2(price) + ' = ' + rs(fuel));
    line(t('r_tolls'), rs(r.tolls));
    line(t('r_parking'), rs(r.parking));
    line(t('r_food'), rs(r.food));
    line(t('r_stay'), rs(r.stay));
    if (r.other) line(t('r_other'), rs(r.other));
    line(t('r_total'), rs(r.total), 'tot');
    line(t('r_pp_line', { n: ppl }), rs(r.pp));
    renderCompare();
  }
  function renderTripFromLog() {
    var v = curV(), a = lastA;
    var ok = a && a.avg;
    $('#tFromLogWrap').hidden = !ok;
    if (ok) $('#tFromLog').textContent = t('btn_from_log', { m: nf(a.avg, 2) + ' ' + FUELS[v.fuel].eff, name: vName(v) });
  }
  $('#tFromLog').addEventListener('click', function () {
    var v = curV(), a = lastA;
    if (!a || !a.avg) return;
    $('#tFuel').value = v.fuel;
    $('#tMileage').value = String(Math.round(a.avg * 100) / 100);
    var real = vLog(v.id);
    if (real.length) $('#tPrice').value = String(lastPrice(real, v.fuel));
    saveTrip(); renderTrip();
  });
  function renderCompare() {
    var out = $('#cmpOut'); out.innerHTML = '';
    var r = tRes;
    if (!r) return;
    var trips = r.round ? 2 : 1;
    var opts = [];
    opts.push({ id: 'car', name: t('m_car'), total: r.drive, sub: t('m_car_sub') });
    var bm = val('cBikeMil'), bp = val('cBikePrice');
    if (bm > 0 && bp >= 0) {
      var bikes = Math.ceil(r.ppl / 2);
      opts.push({ id: 'bike', name: t('m_bike', { n: bikes }), total: bikes * r.totalKm / bm * bp, sub: t('m_bike_sub', { q: nf(bikes * r.totalKm / bm, 1) }) });
    } else opts.push({ id: 'bike', name: t('m_bike', { n: Math.ceil(r.ppl / 2) }), total: NaN, sub: t('need_bike') });
    var tk = val('cTicket');
    if (tk >= 0) opts.push({ id: 'public', name: t('m_public'), total: tk * r.ppl * trips, sub: t('m_public_sub', { p: rs(tk), n: r.ppl, k: trips }) });
    else opts.push({ id: 'public', name: t('m_public'), total: NaN, sub: t('need_ticket') });
    var valid = opts.filter(function (o) { return isFinite(o.total); });
    var max = Math.max.apply(null, valid.map(function (o) { return o.total; }).concat([1]));
    var best = valid.length > 1 ? valid.reduce(function (m, o) { return o.total < m.total ? o : m; }) : null;
    opts.forEach(function (o) {
      var isBest = best && o === best;
      var row = el('div', { class: 'cmp-row' + (isBest ? ' best' : ''), dataset: { mode: o.id, total: isFinite(o.total) ? o.total : '' } },
        el('div', { class: 'cmp-name' }, document.createTextNode(o.name), isBest ? el('span', { class: 'badge success', style: { marginInlineStart: '8px' }, text: t('cheapest') }) : null),
        el('div', { class: 'cmp-val num', text: isFinite(o.total) ? rs(o.total) : '–' }),
        el('div', { class: 'cmp-sub', text: (isFinite(o.total) ? t('per_person_is', { p: rs(o.total / r.ppl) }) + ' · ' : '') + o.sub }),
        el('div', { class: 'cmp-bar', 'aria-hidden': 'true' }, el('span', { style: { width: (isFinite(o.total) ? Math.max(2, 100 * o.total / max) : 0) + '%' } }))
      );
      out.appendChild(row);
    });
  }
  function tripSummary() {
    var r = tRes;
    if (!r) return '';
    var L = [t('s_trip', { km: km(r.totalKm), way: t(r.round ? 'trip_round' : 'trip_oneway') })];
    L.push(t('r_fuel_cost') + ': ' + nf(r.qty, 2) + ' ' + r.f.unit + ' = ' + rs(r.fuel));
    if (r.tolls) L.push(t('r_tolls') + ': ' + rs(r.tolls));
    if (r.parking) L.push(t('r_parking') + ': ' + rs(r.parking));
    if (r.food) L.push(t('r_food') + ': ' + rs(r.food));
    if (r.stay) L.push(t('r_stay') + ': ' + rs(r.stay));
    if (r.other) L.push(t('r_other') + ': ' + rs(r.other));
    L.push(t('r_total') + ': ' + rs(r.total));
    L.push(t('r_pp_line', { n: r.ppl }) + ': ' + rs(r.pp));
    return plain(L.join('\n'));
  }
  $('#tCopy').addEventListener('click', function () { var s = tripSummary(); if (s) EDU.copy(s); });
  $('#tPrint').addEventListener('click', function () { window.print(); });

  /* ============================================================ 3. EV vs fuel */
  var EV_FIELDS = { eKm: 'km', eFPrice: 'fPrice', eFMil: 'fMil', eFRate: 'fRate', eFServ: 'fServ', eEPrice: 'ePrice', eEff: 'eff', eHome: 'home', ePublic: 'pub', eHomeShare: 'share', eLoss: 'loss', eEServ: 'eServ' };
  function loadEv() {
    Object.keys(EV_FIELDS).forEach(function (id) { $('#' + id).value = ev[EV_FIELDS[id]]; });
    $('#eFuel').value = ['petrol', 'diesel', 'cng'].indexOf(ev.fuel) >= 0 ? ev.fuel : 'petrol';
  }
  function saveEv() {
    Object.keys(EV_FIELDS).forEach(function (id) { ev[EV_FIELDS[id]] = $('#' + id).value; });
    ev.fuel = $('#eFuel').value;
    store.set('ev', ev);
  }
  Object.keys(EV_FIELDS).forEach(function (id) { $('#' + id).addEventListener('input', function () { saveEv(); renderEv(); }); });
  $('#eFuel').addEventListener('change', function () {
    var f = $('#eFuel').value;
    $('#eFRate').value = String(FUELS[f].def);
    if (f === 'cng' && ev.kind === 'car') $('#eFMil').value = '22';
    saveEv(); renderEv();
  });
  $$('#eKind button').forEach(function (b) {
    b.addEventListener('click', function () {
      if (ev.kind === b.dataset.kind) return;
      ev = Object.assign({}, EV_DEF[b.dataset.kind]);
      loadEv(); saveEv(); renderEv();
      EDU.toast(t('toast_kind'));
    });
  });
  var eRes = null;
  function renderEv() {
    var fuel = $('#eFuel').value, f = FUELS[fuel];
    $('#eFMilLbl').textContent = t('lbl_mileage', { u: f.eff });
    $('#eFRateLbl').textContent = t(f.price);
    $$('#eKind button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.kind === ev.kind ? 'true' : 'false'); });
    var kmM = val('eKm'), fp = val('eFPrice'), fm = val('eFMil'), fr = val('eFRate'), ep = val('eEPrice'), eff = val('eEff');
    var home = val('eHome'), pub = val('ePublic'), share = val('eHomeShare'), loss = val('eLoss');
    var fs = opt0('eFServ'), es = opt0('eEServ');
    var msg = '';
    if (!(kmM > 0) || kmM > 1e6) msg = t('err_km_month');
    else if (!(fp >= 0) || !(ep >= 0)) msg = t('err_prices');
    else if (!(fm > 0)) msg = t('err_mileage');
    else if (!(fr >= 0)) msg = t('err_price_need');
    else if (!(eff > 0)) msg = t('err_eff');
    else if (!(home >= 0) || !(pub >= 0)) msg = t('err_tariff');
    else if (!(share >= 0 && share <= 100)) msg = t('err_share');
    else if (!(loss >= 0 && loss < 100)) msg = t('err_loss');
    $('#eMsg').textContent = msg;
    $('#eOut').hidden = !!msg;
    eRes = null;
    if (msg) { $('#evBox').innerHTML = ''; return; }
    var fCpk = fr / fm;
    var tariff = (share / 100) * home + (1 - share / 100) * pub;
    var eCpk = tariff * (1 + loss / 100) / eff;
    var fMonth = fCpk * kmM + fs / 12, eMonth = eCpk * kmM + es / 12;
    var save = fMonth - eMonth, diff = ep - fp;
    var r = { fuel: fuel, f: f, fCpk: fCpk, eCpk: eCpk, fMonth: fMonth, eMonth: eMonth, save: save, diff: diff, tariff: tariff, fp: fp, ep: ep, months: null, state: '' };
    if (diff <= 0) r.state = save >= 0 ? 'now' : 'now_but';
    else if (save <= 0) r.state = 'never';
    else { r.state = 'months'; r.months = diff / save; }
    eRes = r;
    var be = $('#eBe'), sub = $('#eBeSub'), box = $('#eBeBox');
    box.className = 'callout ' + (r.state === 'never' || r.state === 'now_but' ? 'warning' : 'success');
    if (r.state === 'months') {
      var mo = r.months;
      be.textContent = mo > 1200 ? t('be_long') : t('be_months', { m: nf(mo, 1) });
      sub.textContent = mo > 1200 ? '' : t('be_years', { y: nf(mo / 12, 1), km: nf(Math.round(mo * kmM), 0) });
    } else if (r.state === 'never') { be.textContent = t('be_never'); sub.textContent = t('be_never_sub'); }
    else if (r.state === 'now') { be.textContent = t('be_now'); sub.textContent = t('be_now_sub'); }
    else { be.textContent = t('be_now_but'); sub.textContent = t('be_now_but_sub'); }
    be.dataset.months = r.months === null ? '' : r.months;
    be.dataset.state = r.state;
    $('#eFCpk').textContent = rs2(fCpk) + '/km';
    $('#eECpk').textContent = rs2(eCpk) + '/km';
    $('#eFMonth').textContent = t('per_month', { v: rs0(fMonth) });
    $('#eEMonth').textContent = t('per_month', { v: rs0(eMonth) });
    $('#eSave').textContent = rs0(save); $('#eSave').dataset.v = save;
    $('#eSaveYr').textContent = t('per_year', { v: rs0(save * 12) });
    $('#eDiff').textContent = rs0(diff);
    drawEv(r);
  }
  function drawEv(r) {
    var yrs = r.months ? Math.min(15, Math.max(5, Math.ceil(r.months / 12) + 2)) : 8;
    var W = 560, H = 260, L = 58, R = 16, T = 14, B = 38;
    var fAt = function (y) { return r.fp + r.fMonth * 12 * y; }, eAt = function (y) { return r.ep + r.eMonth * 12 * y; };
    var top = niceMax(Math.max(fAt(yrs), eAt(yrs), 1));
    var X = function (y) { return L + y * (W - L - R) / yrs; }, Y = function (v) { return T + (top - v) * (H - T - B) / top; };
    var g = '';
    for (var k = 0; k <= 4; k++) {
      var v = top * k / 4, y = Y(v);
      g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" style="stroke:var(--border);stroke-width:1"/>';
      g += txt(L - 6, y + 4, rsShort(v), 'end');
    }
    var st = yrs > 10 ? 2 : 1;
    for (var yy = 0; yy <= yrs; yy += st) g += txt(X(yy), H - 18, String(yy));
    g += txt((L + W - R) / 2, H - 3, t('yr_axis'), 'middle', '');
    g += '<line x1="' + X(0) + '" x2="' + X(yrs) + '" y1="' + Y(fAt(0)).toFixed(1) + '" y2="' + Y(fAt(yrs)).toFixed(1) + '" style="stroke:var(--c2);stroke-width:3;stroke-linecap:round"/>';
    g += '<line x1="' + X(0) + '" x2="' + X(yrs) + '" y1="' + Y(eAt(0)).toFixed(1) + '" y2="' + Y(eAt(yrs)).toFixed(1) + '" style="stroke:var(--c4);stroke-width:3;stroke-linecap:round"/>';
    if (r.months && r.months / 12 <= yrs) {
      var by = r.months / 12;
      g += '<line x1="' + X(by).toFixed(1) + '" x2="' + X(by).toFixed(1) + '" y1="' + T + '" y2="' + (H - B) + '" style="stroke:var(--muted);stroke-width:1;stroke-dasharray:4 4"/>';
      g += '<circle cx="' + X(by).toFixed(1) + '" cy="' + Y(fAt(by)).toFixed(1) + '" r="6" style="fill:var(--surface);stroke:var(--text);stroke-width:2.5"/>';
    }
    $('#evBox').innerHTML = svgEl(g, W, H, t('ch_cum') + ': ' + t('h_fuel_vehicle') + ' ' + rs0(fAt(yrs)) + ', ' + t('h_ev_vehicle') + ' ' + rs0(eAt(yrs)) + ' (' + yrs + ')');
  }
  function evSummary() {
    var r = eRes;
    if (!r) return '';
    var L = [t('h_ev')];
    L.push(t('fuel_' + r.fuel) + ': ' + rs2(r.fCpk) + '/km · ' + plain(t('per_month', { v: rs0(r.fMonth) })));
    L.push(t('fuel_ev') + ': ' + rs2(r.eCpk) + '/km · ' + plain(t('per_month', { v: rs0(r.eMonth) })));
    L.push(t('r_saving') + ': ' + rs0(r.save));
    L.push(t('r_extra') + ': ' + rs0(r.diff));
    L.push(t('r_breakeven') + ': ' + $('#eBe').textContent + (r.state === 'months' ? ' · ' + $('#eBeSub').textContent : ''));
    return plain(L.join('\n'));
  }
  $('#eCopy').addEventListener('click', function () { var s = evSummary(); if (s) EDU.copy(s); });
  $('#ePrint').addEventListener('click', function () { window.print(); });

  /* ============================================================ 4. units */
  function renderUnits() {
    var v = val('uVal'), from = $('#uFrom').value, out = $('#uOut');
    out.innerHTML = '';
    var kmpl = NaN;
    if (v > 0) kmpl = from === 'kmpl' ? v : from === 'l100' ? 100 / v : from === 'mpguk' ? v / MPG_UK : v / MPG_US;
    setInvalid('uVal', $('#uVal').value.trim() !== '' && !(v > 0));
    [['kmpl', kmpl, 'km/l'], ['l100', 100 / kmpl, 'l/100 km'], ['mpguk', kmpl * MPG_UK, 'mpg (UK)'], ['mpgus', kmpl * MPG_US, 'mpg (US)']].forEach(function (u) {
      out.appendChild(el('div', { class: 'stat' + (u[0] === from ? ' hi' : ''), dataset: { unit: u[0], v: isFinite(u[1]) ? u[1] : '' } },
        el('div', { class: 'stat-l', text: t('u_' + u[0]) }),
        el('div', { class: 'stat-v num', text: isFinite(u[1]) ? nf(u[1], 2) : '–' }),
        el('div', { class: 'stat-s num', text: u[2] })));
    });
    units.val = $('#uVal').value; units.from = from;
    renderCost();
  }
  function renderCost() {
    var mode = units.solve;
    $$('#uSolve button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.solve === mode ? 'true' : 'false'); });
    $('#uPriceF').hidden = mode === 'price'; $('#uMilF').hidden = mode === 'mil'; $('#uCpkF').hidden = mode === 'cpk';
    var p = val('uPrice'), m = val('uMil'), c = val('uCpk'), f = $('#uFormula'), s = $('#uFormulaSub');
    var res = NaN;
    if (mode === 'cpk' && p >= 0 && m > 0) { res = p / m; f.textContent = rs2(p) + ' ÷ ' + nf(m, 2) + ' km/l = ' + rs2(res) + '/km'; s.textContent = t('u_sub_100', { k: nf(res > 0 ? 100 / res : 0, 1) }); }
    else if (mode === 'mil' && p >= 0 && c > 0) { res = p / c; f.textContent = rs2(p) + ' ÷ ' + rs2(c) + '/km = ' + nf(res, 2) + ' km/l'; s.textContent = t('u_sub_mil', { c: rs2(c) }); }
    else if (mode === 'price' && c >= 0 && m > 0) { res = c * m; f.textContent = rs2(c) + '/km × ' + nf(m, 2) + ' km/l = ' + rs2(res) + '/l'; s.textContent = t('u_sub_price'); }
    else { f.textContent = '–'; s.textContent = t('u_need'); }
    f.dataset.v = isFinite(res) ? res : '';
    units.price = $('#uPrice').value; units.mil = $('#uMil').value; units.cpk = $('#uCpk').value;
    store.set('units', units);
  }
  $('#uVal').addEventListener('input', renderUnits);
  $('#uFrom').addEventListener('change', renderUnits);
  ['uPrice', 'uMil', 'uCpk'].forEach(function (id) { $('#' + id).addEventListener('input', renderCost); });
  $$('#uSolve button').forEach(function (b) { b.addEventListener('click', function () { units.solve = b.dataset.solve; renderCost(); }); });
  function loadUnits() {
    if (units.val !== undefined) $('#uVal').value = units.val;
    if (units.from) $('#uFrom').value = units.from;
    if (units.price !== undefined) $('#uPrice').value = units.price;
    if (units.mil !== undefined) $('#uMil').value = units.mil;
    if (units.cpk !== undefined) $('#uCpk').value = units.cpk;
  }

  /* ============================================================ reset + boot */
  $('#btnReset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    ['vehicles', 'vid', 'log', 'trip', 'ev', 'quick', 'units', 'tab'].forEach(function (k) { store.remove(k); });
    vehicles = [{ id: 'v1', name: '', fuel: 'petrol' }]; vid = 'v1'; log = makeExample();
    trip = Object.assign({}, TRIP_DEF); ev = Object.assign({}, EV_DEF.car); quick = { fuel: 'petrol' }; units = { solve: 'cpk' };
    editId = null; $('#vForm').hidden = true;
    $('#qStart').value = '12000'; $('#qEnd').value = '12400'; $('#qQty').value = '25'; $('#qPrice').value = '105';
    $('#uVal').value = '15'; $('#uFrom').value = 'kmpl'; $('#uPrice').value = '105'; $('#uMil').value = '15'; $('#uCpk').value = '5';
    boot();
    showTab('mileage');
  });

  function renderAll() {
    $$('.fuel-sel').forEach(function (s) { fuelOptions(s); });
    fuelOptions($('#eFuel'), ['petrol', 'diesel', 'cng']);
    renderQuick();
    renderVehicles(); renderFormHead(); renderLog();
    renderTrip(); renderEv(); renderUnits();
  }
  function boot() {
    $$('.fuel-sel').forEach(function (s) { fuelOptions(s); });
    fuelOptions($('#eFuel'), ['petrol', 'diesel', 'cng']);
    $('#qFuel').value = FUELS[quick.fuel] ? quick.fuel : 'petrol';
    ['start', 'end', 'qty', 'price'].forEach(function (k, i) { var id = ['qStart', 'qEnd', 'qQty', 'qPrice'][i]; if (quick[k] !== undefined) $('#' + id).value = quick[k]; });
    loadTrip(); loadEv(); loadUnits();
    resetForm();
    renderAll();
  }
  boot();
  showTab(tab);
  EDU.onLang(renderAll);
})();
