/* Stock Register: items, stock in / out / adjustment, low-stock and expiry alerts, barcode-scanner input,
   daily and monthly reports, CSV import/export, JSON backup/restore. Everything stays on the device.
   Stock is never stored: it is the sum of all movements of an item (in = +qty, out = -qty, adjustment = signed delta). */
(function () {
  'use strict';
  var SLUG = 'stock-register';
  var store = EDU.store(SLUG);
  var t = EDU.t, $ = EDU.$, esc = EDU.esc, el = EDU.el;
  var DAY = 86400000, PAGE = 200, MORE = 500;
  var QUOTA_WARN = 4 * 1024 * 1024, QUOTA_MAX = 5 * 1024 * 1024;   // localStorage is ~5 MB in most browsers
  var UNITS = ['pcs', 'pkt', 'kg', 'g', 'l', 'ml', 'box', 'dz', 'm', 'bag', 'strip', 'btl'];
  var UNIT_ALIAS = { pc: 'pcs', pcs: 'pcs', piece: 'pcs', pieces: 'pcs', nos: 'pcs', no: 'pcs', unit: 'pcs', units: 'pcs', each: 'pcs', ea: 'pcs',
    pkt: 'pkt', packet: 'pkt', packets: 'pkt', pack: 'pkt', pouch: 'pkt', kg: 'kg', kgs: 'kg', kilo: 'kg', kilogram: 'kg', g: 'g', gm: 'g', gms: 'g', gram: 'g', grams: 'g',
    l: 'l', ltr: 'l', litre: 'l', liter: 'l', litres: 'l', liters: 'l', lt: 'l', ml: 'ml', box: 'box', boxes: 'box', ctn: 'box', carton: 'box',
    dz: 'dz', dozen: 'dz', doz: 'dz', m: 'm', mtr: 'm', metre: 'm', meter: 'm', meters: 'm', metres: 'm', bag: 'bag', bags: 'bag', sack: 'bag',
    strip: 'strip', strips: 'strip', btl: 'btl', bottle: 'btl', bottles: 'btl' };
  var TYPES = ['in', 'out', 'adj'];
  /* numbers for the example items (words come from content.js, same order) */
  var SAMPLE_NUM = [
    { sku: '8900000000011', unit: 'pkt', buy: 24, sell: 28, gst: 0, min: 20, open: 60, outs: [[6, 10], [2, 5]] },
    { sku: '8900000000028', unit: 'btl', buy: 135, sell: 150, gst: 5, min: 10, open: 24, outs: [[5, 4], [1, 2]] },
    { sku: '8900000000035', unit: 'pcs', buy: 265, sell: 285, gst: 5, min: 10, open: 12, outs: [[4, 5], [0, 3]], exp: 12 },
    { sku: '8900000000042', unit: 'pkt', buy: 85, sell: 95, gst: 5, min: 24, open: 48, outs: [[3, 12], [1, 8]] },
    { sku: '8900000000059', unit: 'pkt', buy: 12, sell: 14, gst: 5, min: 30, open: 40, outs: [[5, 25], [2, 15]] },
    { sku: '8900000000066', unit: 'pkt', buy: 230, sell: 250, gst: 5, min: 8, open: 20, outs: [[3, 6]], exp: 240 },
    { sku: '', unit: 'kg', buy: 72, sell: 85, gst: 0, min: 25, open: 100, outs: [[4, 20], [1, 17.5]] },
    { sku: '8900000000073', unit: 'pcs', buy: 95, sell: 110, gst: 5, min: 12, open: 30, outs: [[2, 6]], exp: 400 }
  ];

  /* ================================================================ helpers */
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function isoOf(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function todayISO() { return isoOf(new Date()); }
  function shiftISO(days) { var d = new Date(); d.setDate(d.getDate() + days); return isoOf(d); }
  function fmtDate(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? m[3] + '-' + m[2] + '-' + m[1] : (iso || ''); }
  function parseDate(s) {
    s = String(s == null ? '' : s).trim(); var m;
    function mk(y, mo, d) { y = +y; mo = +mo; d = +d; if (y < 1900 || y > 2200 || mo < 1 || mo > 12 || d < 1 || d > 31) return ''; return y + '-' + pad2(mo) + '-' + pad2(d); }
    if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s))) return mk(m[1], m[2], m[3]);
    if ((m = /^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/.exec(s))) return mk(m[3], m[2], m[1]);
    return '';
  }
  function daysUntil(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); if (!m) return null;
    var a = new Date(+m[1], +m[2] - 1, +m[3]), b = new Date(); b.setHours(0, 0, 0, 0); a.setHours(0, 0, 0, 0);
    return Math.round((a - b) / DAY);
  }
  function monthLabel(ym) {
    var m = /^(\d{4})-(\d{2})$/.exec(ym); if (!m) return ym;
    try { return new Date(+m[1], +m[2] - 1, 1).toLocaleDateString(EDU.langInfo(EDU.lang).tag + '-u-nu-latn', { month: 'short', year: 'numeric' }); }
    catch (e) { return m[2] + '-' + m[1]; }
  }
  function num(s) {
    if (typeof s === 'number') return isFinite(s) ? s : NaN;
    s = String(s == null ? '' : s).replace(/[₹,%\s]/g, '').replace(/[^\d.\-]/g, '');
    if (!s || s === '-' || s === '.') return NaN;
    var n = parseFloat(s); return isFinite(n) ? n : NaN;
  }
  function r3(n) { return Math.round(n * 1000) / 1000; }
  function r2(n) { return Math.round(n * 100) / 100; }
  function fq(n) { return EDU.fmt(r3(n), { maximumFractionDigits: 3 }); }
  function signed(n) { n = r3(n); return (n > 0 ? '+' : n < 0 ? '−' : '') + fq(Math.abs(n)); }
  function money(n) { return '₹' + EDU.fmt(r2(n), { maximumFractionDigits: 2 }); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function str(v, max) { return String(v == null ? '' : v).trim().slice(0, max || 200); }
  function nn(v, d, max) { var n = num(v); if (isNaN(n)) return d; if (max != null && Math.abs(n) > max) return d; return n; }
  function unitName(u) { return UNITS.indexOf(u) >= 0 ? t('unit_' + u) : (u || t('unit_pcs')); }
  function unitAlias(s) { s = str(s, 20); var k = s.toLowerCase().replace(/[^a-z]/g, ''); return UNIT_ALIAS[k] || (UNITS.indexOf(s) >= 0 ? s : (s || 'pcs')); }
  function csvSafe(v) { v = String(v == null ? '' : v); return /^[=+\-@\t\r]/.test(v) ? "'" + v : v; }
  function confirmIt(msg) { try { return window.confirm(msg); } catch (e) { return true; } }

  /* ================================================================ data */
  var settings, items, entries, stockMap = {}, byId = {};
  var ui = { tab: 'stock', q: '', cat: '', status: '', sort: 'name', shown: PAGE, hit: '', view: 'ledger', period: 'month', from: '', to: '', mtype: '', mq: '', mshown: PAGE };
  var lastDel = null, undoTimer = null, persisted = null;

  function normSettings(s) {
    s = s && typeof s === 'object' ? s : {};
    var gst = num(s.gst);
    return {
      shop: str(s.shop, 80), gst: isNaN(gst) || gst < 0 || gst > 100 ? '5' : String(gst),
      expDays: [7, 30, 60, 90].indexOf(+s.expDays) >= 0 ? +s.expDays : 30,
      lastBackup: nn(s.lastBackup, 0, 1e14), snooze: nn(s.snooze, 0, 1e14), firstEdit: nn(s.firstEdit, 0, 1e14),
      persistAsked: !!s.persistAsked, tab: ['stock', 'moves', 'expiry', 'data'].indexOf(s.tab) >= 0 ? s.tab : 'stock',
      scanMode: ['find', 'in', 'out'].indexOf(s.scanMode) >= 0 ? s.scanMode : 'find'
    };
  }
  /* stored data, CSV rows and backup files are all normalised the same way, so a hand-edited file cannot break the page */
  function normItem(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var name = str(raw.name, 160); if (!name) return null;
    return { id: str(raw.id, 40) || uid(), name: name, sku: str(raw.sku, 64), cat: str(raw.cat, 60), unit: unitAlias(raw.unit),
      buy: Math.max(0, nn(raw.buy, 0, 1e9)), sell: Math.max(0, nn(raw.sell, 0, 1e9)), gst: Math.min(100, Math.max(0, nn(raw.gst, 0, 100))),
      min: Math.max(0, nn(raw.min, 0, 1e9)), supplier: str(raw.supplier, 120), expiry: parseDate(raw.expiry), sample: !!raw.sample, created: nn(raw.created, Date.now(), 1e14) };
  }
  function normEntry(raw, ids) {
    if (!raw || typeof raw !== 'object') return null;
    var item = str(raw.item, 40); if (!item || (ids && !ids[item])) return null;
    var type = TYPES.indexOf(raw.type) >= 0 ? raw.type : 'adj';
    var qty = nn(raw.qty, NaN, 1e9); if (isNaN(qty)) return null;
    if (type !== 'adj') qty = Math.abs(qty);
    return { id: str(raw.id, 40) || uid(), item: item, type: type, date: parseDate(raw.date) || todayISO(), qty: r3(qty), note: str(raw.note, 200), sample: !!raw.sample, ts: nn(raw.ts, Date.now(), 1e14) };
  }
  function delta(e) { return e.type === 'in' ? e.qty : e.type === 'out' ? -e.qty : e.qty; }
  function recompute() {
    stockMap = {}; byId = {};
    items.forEach(function (it) { byId[it.id] = it; stockMap[it.id] = 0; });
    entries.forEach(function (e) { if (e.item in stockMap) stockMap[e.item] += delta(e); });
    Object.keys(stockMap).forEach(function (k) { stockMap[k] = r3(stockMap[k]); });
  }
  function stockOf(it) { return stockMap[it.id] || 0; }
  function statusOf(it) { var s = stockOf(it); if (s < 0) return 'neg'; if (s === 0) return 'out'; if (it.min > 0 && s <= it.min) return 'low'; return 'ok'; }
  function expState(it) {
    if (!it.expiry || stockOf(it) <= 0) return '';
    var d = daysUntil(it.expiry); if (d === null) return '';
    return d < 0 ? 'expired' : d <= settings.expDays ? 'exp' : '';
  }
  function hasOwnData() {
    for (var i = 0; i < items.length; i++) if (!items[i].sample) return true;
    for (var j = 0; j < entries.length; j++) if (!entries[j].sample) return true;
    return false;
  }

  function seedSamples() {
    var C = (window.APP_CONTENT || {})[EDU.lang] || (window.APP_CONTENT || {}).en || { samples: [] };
    var now = Date.now();
    SAMPLE_NUM.forEach(function (n, i) {
      var w = C.samples[i] || {}; if (!w.name) return;
      var it = normItem({ name: w.name, sku: n.sku, cat: w.cat, unit: n.unit, buy: n.buy, sell: n.sell, gst: n.gst, min: n.min, supplier: w.supplier, expiry: n.exp ? shiftISO(n.exp) : '', sample: true, created: now - 1000 + i });
      items.push(it);
      entries.push(normEntry({ item: it.id, type: 'in', qty: n.open, date: shiftISO(-14), note: t('note_opening'), sample: true, ts: now - 14 * DAY }));
      n.outs.forEach(function (o, j) { entries.push(normEntry({ item: it.id, type: 'out', qty: o[1], date: shiftISO(-o[0]), note: '', sample: true, ts: now - o[0] * DAY + j })); });
    });
  }

  function load() {
    settings = normSettings(store.get('settings', null));
    var rawItems = store.get('items', null), rawEntries = store.get('entries', null);
    items = Array.isArray(rawItems) ? rawItems.map(normItem).filter(Boolean) : [];
    var ids = {}; items.forEach(function (i) { ids[i.id] = 1; });
    entries = Array.isArray(rawEntries) ? rawEntries.map(function (e) { return normEntry(e, ids); }).filter(Boolean) : [];
    if (rawItems === null && !items.length) { seedSamples(); save('items'); save('entries'); }   // first visit only
    ui.tab = settings.tab;
    recompute();
  }

  /* ---------------- persistence (debounced; flushed when the tab is hidden) ---------------- */
  var dirty = {}, timer = null, warnedFull = false;
  function save(k) { dirty[k] = 1; if (!timer) timer = setTimeout(flush, 200); }
  function flush() {
    clearTimeout(timer); timer = null;
    var ok = true;
    Object.keys(dirty).forEach(function (k) {
      var v = k === 'items' ? items : k === 'entries' ? entries : settings;
      if (store.set(k, v) === false) ok = false;
    });
    dirty = {};
    if (!ok) { if (!warnedFull) EDU.toast(t('store_full'), 6000); warnedFull = true; } else warnedFull = false;
    renderStorage();
  }
  window.addEventListener('pagehide', flush);
  window.addEventListener('beforeunload', flush);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(); });

  function usedBytes() { try { return (JSON.stringify(items).length + JSON.stringify(entries).length + 500) * 2; } catch (e) { return 0; } }
  function touched() {          // first real edit: remember the date (backup reminder) and ask the browser to keep the data
    if (!settings.firstEdit) { settings.firstEdit = Date.now(); save('settings'); }
    if (!settings.persistAsked) {
      settings.persistAsked = true; save('settings');
      try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().then(function (ok) { persisted = !!ok; renderStorage(); }).catch(function () { }); } catch (e) { }
    }
  }
  try { if (navigator.storage && navigator.storage.persisted) navigator.storage.persisted().then(function (ok) { persisted = !!ok; renderStorage(); }).catch(function () { }); } catch (e) { }

  /* ================================================================ rendering */
  function setTab(tab) {
    ui.tab = tab; settings.tab = tab; save('settings');
    ['stock', 'moves', 'expiry', 'data'].forEach(function (k) {
      $('#tab-' + k).setAttribute('aria-selected', k === tab ? 'true' : 'false');
      $('#pane-' + k).hidden = k !== tab;
    });
    renderPane();
  }
  function renderPane() {
    if (ui.tab === 'stock') renderStock();
    else if (ui.tab === 'moves') renderMoves();
    else if (ui.tab === 'expiry') renderExpiry();
    else renderData();
  }
  function renderAll() { renderBanners(); renderTiles(); renderCats(); renderPane(); renderStorage(); }

  function renderBanners() {
    $('#sample-banner').hidden = !items.some(function (i) { return i.sample; });
    var r = $('#remind'), now = Date.now();
    if (!hasOwnData() || now < settings.snooze) { r.hidden = true; return; }
    var since = settings.lastBackup ? now - settings.lastBackup : (settings.firstEdit ? now - settings.firstEdit : 0);
    if (since > 7 * DAY) {
      $('#remind-txt').textContent = settings.lastBackup ? t('remind_txt', { n: EDU.fmt(Math.floor(since / DAY)) }) : t('remind_never');
      r.hidden = false;
    } else r.hidden = true;
  }

  function renderTiles() {
    var cost = 0, sale = 0, low = 0, out = 0, exp = 0;
    items.forEach(function (it) {
      var s = stockOf(it); if (s > 0) { cost += s * it.buy; sale += s * it.sell; }
      var st = statusOf(it); if (st === 'low') low++; else if (st === 'out' || st === 'neg') out++;
      if (expState(it)) exp++;
    });
    function tile(filter, cls, val, label) {
      return '<button type="button" class="tile' + (cls ? ' ' + cls : '') + (ui.status === filter && filter ? ' on' : '') + '" data-filter="' + filter + '"><span class="tv">' + val + '</span><span class="tl">' + esc(label) + '</span></button>';
    }
    $('#tiles').innerHTML = tile('', '', EDU.fmt(items.length), t('tile_items')) + tile('', '', money(cost), t('tile_cost')) + tile('', '', money(sale), t('tile_sale')) +
      tile('low', low ? 'warn' : '', EDU.fmt(low), t('tile_low')) + tile('out', out ? 'bad' : '', EDU.fmt(out), t('tile_out')) +
      tile('exp', exp ? 'warn' : '', EDU.fmt(exp), t('tile_exp', { n: EDU.fmt(settings.expDays) }));
  }

  function catList() {
    var seen = {}, list = [];
    items.forEach(function (it) { if (it.cat && !seen[it.cat]) { seen[it.cat] = 1; list.push(it.cat); } });
    return list.sort(function (a, b) { return a.localeCompare(b); });
  }
  function renderCats() {
    var sel = $('#f-cat'), cats = catList();
    sel.innerHTML = '<option value="">' + esc(t('all_cats')) + '</option>' + cats.map(function (c) { return '<option class="no-i18n" value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('');
    if (cats.indexOf(ui.cat) < 0) ui.cat = '';
    sel.value = ui.cat;
    $('#cat-list').innerHTML = cats.map(function (c) { return '<option value="' + esc(c) + '"></option>'; }).join('');
  }

  function filteredItems() {
    var q = ui.q.toLowerCase();
    var list = items.filter(function (it) {
      if (ui.cat && it.cat !== ui.cat) return false;
      if (ui.status) {
        var st = statusOf(it), ex = expState(it);
        if (ui.status === 'low' && st !== 'low') return false;
        if (ui.status === 'out' && st !== 'out' && st !== 'neg') return false;
        if (ui.status === 'neg' && st !== 'neg') return false;
        if (ui.status === 'exp' && ex !== 'exp' && ex !== 'expired') return false;
        if (ui.status === 'expired' && ex !== 'expired') return false;
      }
      if (q && it.name.toLowerCase().indexOf(q) < 0 && it.sku.toLowerCase().indexOf(q) < 0 && it.cat.toLowerCase().indexOf(q) < 0 && it.supplier.toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var s = ui.sort;
    list.sort(function (a, b) {
      if (s === 'stock') return stockOf(a) - stockOf(b) || a.name.localeCompare(b.name);
      if (s === 'value') return Math.max(0, stockOf(b)) * b.buy - Math.max(0, stockOf(a)) * a.buy || a.name.localeCompare(b.name);
      if (s === 'expiry') { if (!!a.expiry !== !!b.expiry) return a.expiry ? -1 : 1; return (a.expiry < b.expiry ? -1 : a.expiry > b.expiry ? 1 : 0) || a.name.localeCompare(b.name); }
      if (s === 'new') return b.created - a.created;
      return a.name.localeCompare(b.name);
    });
    return list;
  }
  function badge(cls, text) { return '<span class="badge ' + cls + '">' + esc(text) + '</span>'; }
  function statusBadges(it) {
    var st = statusOf(it), ex = expState(it), h = '';
    h += st === 'ok' ? badge('success', t('st_ok')) : st === 'low' ? badge('warn', t('st_low')) : st === 'out' ? badge('danger', t('st_out')) : badge('danger', t('st_neg'));
    if (ex === 'exp') h += badge('warn', t('st_exp')); else if (ex === 'expired') h += badge('danger', t('st_expired'));
    return '<span class="badges">' + h + '</span>';
  }
  function actBtn(act, id, cls, label) { return '<button type="button" class="btn btn-sm ' + (cls || '') + '" data-act="' + act + '" data-id="' + id + '">' + esc(label) + '</button>'; }
  function rowHTML(it) {
    var s = stockOf(it), st = statusOf(it);
    return '<tr data-id="' + it.id + '" data-status="' + st + '"' + (ui.hit === it.id ? ' class="hit"' : '') + '>' +
      '<td class="nm no-i18n"><strong>' + esc(it.name) + '</strong>' + (it.sample ? ' <span class="badge">' + esc(t('example')) + '</span>' : '') +
      (it.supplier ? '<div class="tiny muted">' + esc(it.supplier) + '</div>' : '') + '</td>' +
      '<td class="mono no-i18n" dir="ltr">' + esc(it.sku) + '</td>' +
      '<td class="no-i18n">' + esc(it.cat) + '</td>' +
      '<td class="num tnum' + (s < 0 ? ' neg' : '') + '">' + fq(s) + ' <span class="small muted">' + esc(unitName(it.unit)) + '</span></td>' +
      '<td class="num tnum">' + (it.min ? fq(it.min) : '–') + '</td>' +
      '<td>' + statusBadges(it) + '</td>' +
      '<td class="num tnum">' + money(it.buy) + '</td>' +
      '<td class="num tnum">' + money(it.sell) + '</td>' +
      '<td class="num tnum">' + fq(it.gst) + '</td>' +
      '<td class="num tnum">' + money(Math.max(0, s) * it.buy) + '</td>' +
      '<td class="tnum">' + (it.expiry ? fmtDate(it.expiry) : '–') + '</td>' +
      '<td class="no-print"><div class="acts">' + actBtn('in', it.id, 'btn-primary', t('act_in')) + actBtn('out', it.id, 'btn-accent', t('act_out')) + actBtn('adj', it.id, '', t('act_adj')) + actBtn('edit', it.id, '', t('edit')) + '</div></td></tr>';
  }
  function renderStock() {
    var list = filteredItems(), shown = list.slice(0, ui.shown);
    $('#stock-body').innerHTML = shown.map(rowHTML).join('');
    $('#empty').hidden = items.length > 0;
    $('#stock-table').hidden = items.length === 0;
    $('#count-txt').textContent = items.length ? t('count_txt', { shown: EDU.fmt(shown.length), total: EDU.fmt(list.length) }) : '';
    $('#more').hidden = list.length <= ui.shown;
    if (ui.hit) { var r = $('#stock-body tr.hit'); if (r && r.scrollIntoView) try { r.scrollIntoView({ block: 'nearest' }); } catch (e) { } }
  }

  /* ---------------- movements & reports ---------------- */
  function rangeOf() {
    var today = todayISO(), d = new Date();
    switch (ui.period) {
      case 'today': return [today, today];
      case '7': return [shiftISO(-6), today];
      case 'month': return [today.slice(0, 8) + '01', today];
      case 'last': return [isoOf(new Date(d.getFullYear(), d.getMonth() - 1, 1)), isoOf(new Date(d.getFullYear(), d.getMonth(), 0))];
      case 'year': return [d.getFullYear() + '-01-01', today];
      case 'custom': return [ui.from, ui.to];
      default: return ['', ''];
    }
  }
  function filteredEntries() {
    var r = rangeOf(), q = ui.mq.toLowerCase();
    return entries.filter(function (e) {
      if (r[0] && e.date < r[0]) return false;
      if (r[1] && e.date > r[1]) return false;
      if (ui.mtype && e.type !== ui.mtype) return false;
      if (q) { var it = byId[e.item]; if (((it ? it.name + ' ' + it.sku : '') + ' ' + e.note).toLowerCase().indexOf(q) < 0) return false; }
      return true;
    }).sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : b.ts - a.ts; });
  }
  function renderMoves() {
    var list = filteredEntries();
    $('#from-field').hidden = $('#to-field').hidden = ui.period !== 'custom';
    $('#ledger-wrap').hidden = ui.view !== 'ledger' || !list.length;
    $('#report-wrap').hidden = ui.view === 'ledger' || !list.length;
    $('#m-empty').hidden = list.length > 0;
    $('#m-more').hidden = true;
    if (!list.length) { $('#m-count').textContent = ''; return; }
    if (ui.view === 'ledger') {
      var shown = list.slice(0, ui.mshown);
      $('#ledger-body').innerHTML = shown.map(function (e) {
        var it = byId[e.item], d = delta(e), u = it ? unitName(it.unit) : '';
        return '<tr data-id="' + e.id + '"><td class="tnum">' + fmtDate(e.date) + '</td><td class="nm no-i18n">' + esc(it ? it.name : '?') + (it && it.sku ? ' <span class="tiny muted mono">' + esc(it.sku) + '</span>' : '') + '</td>' +
          '<td>' + badge(e.type === 'in' ? 'success' : e.type === 'out' ? 'accent' : 'info', t('type_' + e.type)) + '</td>' +
          '<td class="num tnum' + (d < 0 ? ' neg' : '') + '">' + signed(d) + ' <span class="small muted">' + esc(u) + '</span></td>' +
          '<td class="note no-i18n">' + esc(e.note) + '</td>' +
          '<td class="no-print">' + actBtn('del-entry', e.id, 'btn-danger', t('delete')) + '</td></tr>';
      }).join('');
      $('#m-count').textContent = t('count_txt', { shown: EDU.fmt(shown.length), total: EDU.fmt(list.length) });
      $('#m-more').hidden = list.length <= ui.mshown;
    } else {
      var daily = ui.view === 'daily', groups = {}, keys = [];
      list.forEach(function (e) {
        var k = daily ? e.date : e.date.slice(0, 7);
        if (!groups[k]) { groups[k] = { n: 0, inQ: 0, outQ: 0, buy: 0, sell: 0 }; keys.push(k); }
        var g = groups[k], it = byId[e.item]; g.n++;
        if (e.type === 'in') { g.inQ += e.qty; g.buy += e.qty * (it ? it.buy : 0); }
        else if (e.type === 'out') { g.outQ += e.qty; g.sell += e.qty * (it ? it.sell : 0); }
        else if (e.qty > 0) g.inQ += e.qty; else g.outQ += -e.qty;
      });
      keys.sort().reverse();
      var T = { n: 0, inQ: 0, outQ: 0, buy: 0, sell: 0 };
      $('#rep-h1').textContent = daily ? t('col_date') : t('col_month');
      $('#report-body').innerHTML = keys.map(function (k) {
        var g = groups[k]; T.n += g.n; T.inQ += g.inQ; T.outQ += g.outQ; T.buy += g.buy; T.sell += g.sell;
        return '<tr><td class="tnum">' + esc(daily ? fmtDate(k) : monthLabel(k)) + '</td><td class="num tnum">' + EDU.fmt(g.n) + '</td><td class="num tnum">' + fq(g.inQ) + '</td><td class="num tnum">' + fq(g.outQ) + '</td><td class="num tnum">' + money(g.buy) + '</td><td class="num tnum">' + money(g.sell) + '</td></tr>';
      }).join('');
      $('#report-foot').innerHTML = '<tr><td>' + esc(t('total')) + '</td><td class="num tnum">' + EDU.fmt(T.n) + '</td><td class="num tnum">' + fq(T.inQ) + '</td><td class="num tnum">' + fq(T.outQ) + '</td><td class="num tnum">' + money(T.buy) + '</td><td class="num tnum">' + money(T.sell) + '</td></tr>';
      $('#m-count').textContent = t('count_txt', { shown: EDU.fmt(list.length), total: EDU.fmt(list.length) });
    }
  }

  /* ---------------- expiry ---------------- */
  function expiring() {
    return items.filter(function (it) { return !!expState(it); }).sort(function (a, b) { return a.expiry < b.expiry ? -1 : a.expiry > b.expiry ? 1 : a.name.localeCompare(b.name); });
  }
  function renderExpiry() {
    var list = expiring();
    $('#exp-days').value = String(settings.expDays);
    $('#exp-count').textContent = t('exp_count', { n: EDU.fmt(list.length) });
    $('#exp-empty').hidden = list.length > 0;
    $('#exp-body').parentNode.parentNode.hidden = !list.length;
    $('#exp-body').innerHTML = list.map(function (it) {
      var d = daysUntil(it.expiry), lab = d < 0 ? t('expired_ago', { n: EDU.fmt(-d) }) : d === 0 ? t('expires_today') : t('days_left', { n: EDU.fmt(d) });
      return '<tr data-id="' + it.id + '"><td class="nm no-i18n"><strong>' + esc(it.name) + '</strong></td><td class="mono no-i18n" dir="ltr">' + esc(it.sku) + '</td>' +
        '<td class="num tnum">' + fq(stockOf(it)) + ' <span class="small muted">' + esc(unitName(it.unit)) + '</span></td><td class="tnum">' + fmtDate(it.expiry) + '</td>' +
        '<td>' + badge(d < 0 ? 'danger' : d <= 7 ? 'warn' : 'info', lab) + '</td>' +
        '<td class="no-print"><div class="acts">' + actBtn('out', it.id, 'btn-accent', t('act_out')) + actBtn('edit', it.id, '', t('edit')) + '</div></td></tr>';
    }).join('');
  }

  /* ---------------- data tab ---------------- */
  function renderData() {
    $('#shop').value = settings.shop;
    $('#default-gst').value = settings.gst;
    $('#last-backup').textContent = settings.lastBackup ? t('last_backup', { date: fmtDate(isoOf(new Date(settings.lastBackup))) }) : t('never_backup');
    if (!$('#old-date').value) { var d = new Date(); d.setFullYear(d.getFullYear() - 1); $('#old-date').value = isoOf(d); }
    renderStorage();
  }
  function renderStorage() {
    var b = usedBytes(), kb = Math.round(b / 1024);
    $('#storage-txt').textContent = t('storage_used', { kb: EDU.fmt(kb) });
    $('#storage-bar').style.width = Math.min(100, b / QUOTA_MAX * 100).toFixed(1) + '%';
    $('#persist-txt').textContent = persisted === true ? t('persist_yes') : persisted === false ? t('persist_no') : t('persist_unknown');
    var q = $('#quota'); q.hidden = b < QUOTA_WARN;
    if (!q.hidden) $('#quota-txt').textContent = t('quota_warn', { kb: EDU.fmt(kb) });
  }

  /* ================================================================ undo */
  function showUndo(text, data) {
    lastDel = data; $('#undo-txt').textContent = text; $('#undo-bar').hidden = false;
    clearTimeout(undoTimer); undoTimer = setTimeout(hideUndo, 20000);
  }
  function hideUndo() { lastDel = null; $('#undo-bar').hidden = true; }
  function undo() {
    if (!lastDel) return;
    var d = lastDel;
    if (d.kind === 'item') { items.splice(Math.min(d.index, items.length), 0, d.item); entries = entries.concat(d.entries); }
    else if (d.kind === 'entry') entries.push(d.entry);
    else if (d.kind === 'bulk') { items = items.concat(d.items); entries = entries.concat(d.entries); }
    hideUndo(); save('items'); save('entries'); recompute(); renderAll(); EDU.toast(t('undone'));
  }

  /* ================================================================ item form (modal) */
  function openItemForm(existing, preset) {
    var it = existing || Object.assign({ name: '', sku: '', cat: '', unit: 'pcs', buy: '', sell: '', gst: settings.gst, min: '', supplier: '', expiry: '' }, preset || {});
    function fld(key, input, wide) { return el('label', { class: 'field' + (wide ? ' wide' : '') }, el('span', { i18n: key }), input); }
    var inName = el('input', { type: 'text', id: 'fi-name', value: it.name, maxlength: 160, dir: 'auto', autocomplete: 'off' });
    var inSku = el('input', { type: 'text', id: 'fi-sku', value: it.sku, maxlength: 64, dir: 'ltr', autocomplete: 'off', spellcheck: 'false', class: 'mono' });
    var inCat = el('input', { type: 'text', id: 'fi-cat', value: it.cat, maxlength: 60, dir: 'auto', autocomplete: 'off', list: 'cat-list' });
    var selUnit = el('select', { id: 'fi-unit' });
    UNITS.forEach(function (u) { selUnit.appendChild(el('option', { value: u, i18n: 'unit_' + u })); });
    if (UNITS.indexOf(it.unit) < 0 && it.unit) selUnit.appendChild(el('option', { value: it.unit, text: it.unit, class: 'no-i18n' }));
    selUnit.value = it.unit || 'pcs';
    var inBuy = el('input', { type: 'text', id: 'fi-buy', value: it.buy === '' ? '' : String(it.buy), inputmode: 'decimal', dir: 'ltr', autocomplete: 'off', class: 'tnum' });
    var inSell = el('input', { type: 'text', id: 'fi-sell', value: it.sell === '' ? '' : String(it.sell), inputmode: 'decimal', dir: 'ltr', autocomplete: 'off', class: 'tnum' });
    var inGst = el('input', { type: 'text', id: 'fi-gst', value: String(it.gst), inputmode: 'decimal', dir: 'ltr', autocomplete: 'off', list: 'gst-list', class: 'tnum' });
    var inMin = el('input', { type: 'text', id: 'fi-min', value: it.min === '' ? '' : String(it.min), inputmode: 'decimal', dir: 'ltr', autocomplete: 'off', class: 'tnum' });
    var inSup = el('input', { type: 'text', id: 'fi-supplier', value: it.supplier, maxlength: 120, dir: 'auto', autocomplete: 'off' });
    var inExp = el('input', { type: 'date', id: 'fi-expiry', value: it.expiry || '' });
    var inOpen = existing ? null : el('input', { type: 'text', id: 'fi-open', value: preset && preset.open != null ? String(preset.open) : '', inputmode: 'decimal', dir: 'ltr', autocomplete: 'off', class: 'tnum' });
    var msg = el('p', { class: 'msg bad small', id: 'fi-msg', 'aria-live': 'polite' });
    var editThat = el('button', { type: 'button', class: 'btn btn-sm', id: 'fi-edit-that', i18n: 'edit_that', hidden: true });
    var dupItem = null;
    editThat.addEventListener('click', function () { if (dupItem) { close(); openItemForm(dupItem); } });
    var grid = el('div', { class: 'grid-2' },
      fld('f_name', inName, true), fld('f_sku', inSku), fld('f_cat', inCat), fld('f_unit', selUnit), fld('f_buy', inBuy), fld('f_sell', inSell),
      fld('f_gst', inGst), fld('f_min', inMin), fld('f_supplier', inSup), fld('f_expiry', inExp), inOpen ? fld('f_open', inOpen) : null);
    var btns = el('div', { class: 'row' },
      el('button', { type: 'submit', class: 'btn btn-primary', id: 'fi-save', i18n: 'save' }),
      el('button', { type: 'button', class: 'btn', id: 'fi-cancel', i18n: 'cancel', onclick: function () { close(); } }),
      existing ? el('button', { type: 'button', class: 'btn btn-danger', id: 'fi-delete', i18n: 'delete', style: { marginInlineStart: 'auto' }, onclick: function () { if (deleteItem(existing)) close(); } }) : null);
    var form = el('form', { class: 'stack', id: 'item-form', novalidate: true }, grid, el('div', { class: 'row' }, msg, editThat), btns);
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var name = str(inName.value, 160);
      if (!name) { msg.textContent = t('need_name'); inName.focus(); return; }
      var buy = inBuy.value.trim() === '' ? 0 : num(inBuy.value), sell = inSell.value.trim() === '' ? 0 : num(inSell.value), gst = inGst.value.trim() === '' ? 0 : num(inGst.value),
        min = inMin.value.trim() === '' ? 0 : num(inMin.value), open = inOpen && inOpen.value.trim() !== '' ? num(inOpen.value) : 0;
      if ([buy, sell, gst, min, open].some(function (n) { return isNaN(n) || n < 0 || n > 1e9; }) || gst > 100) { msg.textContent = t('bad_number'); return; }
      var sku = str(inSku.value, 64);
      dupItem = null;
      if (sku) for (var i = 0; i < items.length; i++) if (items[i].sku.toLowerCase() === sku.toLowerCase() && items[i] !== existing) { dupItem = items[i]; break; }
      if (dupItem) { msg.textContent = t('dup_sku', { sku: sku, name: dupItem.name }); editThat.hidden = false; inSku.focus(); return; }
      var fields = { name: name, sku: sku, cat: str(inCat.value, 60), unit: selUnit.value || 'pcs', buy: r2(buy), sell: r2(sell), gst: gst, min: r3(min), supplier: str(inSup.value, 120), expiry: parseDate(inExp.value) };
      touched();
      if (existing) {
        Object.assign(existing, fields); existing.sample = false;
        save('items'); recompute(); renderAll(); EDU.toast(t('item_updated', { name: existing.name }));
      } else {
        var ni = normItem(fields); items.push(ni);
        if (open > 0) entries.push(normEntry({ item: ni.id, type: 'in', qty: open, date: todayISO(), note: t('note_opening') }));
        ui.hit = ni.id; ui.q = ''; $('#search').value = ''; ui.status = ''; $('#f-status').value = '';
        save('items'); save('entries'); recompute(); renderAll(); EDU.toast(t('item_added', { name: ni.name }));
      }
      close();
    });
    var close = EDU.modal(form, { title: t(existing ? 'item_form_edit' : 'item_form_add'), onClose: function () { refocusScan(); } });
    setTimeout(function () { inName.focus(); }, 30);
  }

  function deleteItem(it) {
    if (!confirmIt(t('confirm_delete_item', { name: it.name }))) return false;
    var idx = items.indexOf(it), mine = entries.filter(function (e) { return e.item === it.id; });
    items.splice(idx, 1); entries = entries.filter(function (e) { return e.item !== it.id; });
    touched(); save('items'); save('entries'); recompute(); renderAll();
    showUndo(t('item_deleted', { name: it.name, n: EDU.fmt(mine.length) }), { kind: 'item', item: it, entries: mine, index: idx });
    return true;
  }
  function deleteEntry(id) {
    var idx = -1; for (var i = 0; i < entries.length; i++) if (entries[i].id === id) { idx = i; break; }
    if (idx < 0 || !confirmIt(t('confirm_delete_entry'))) return;
    var e = entries.splice(idx, 1)[0];
    touched(); save('entries'); recompute(); renderAll();
    showUndo(t('entry_deleted'), { kind: 'entry', entry: e });
  }

  /* ================================================================ movement form (modal) */
  function addEntry(it, type, qty, date, note) {
    if (type === 'in' && qty <= 0 || type === 'out' && qty <= 0) return false;
    entries.push(normEntry({ item: it.id, type: type, qty: qty, date: date || todayISO(), note: note || '' }));
    touched(); save('entries'); recompute();
    if (it.sample) { it.sample = false; save('items'); }
    return true;
  }
  function openMove(it, type) {
    var cur = stockOf(it), u = unitName(it.unit), mode = type || 'in';
    var head = el('div', { class: 'mv-head no-i18n', text: it.name + (it.sku ? ' · ' + it.sku : '') });
    var curTxt = el('p', { class: 'muted mb0 tnum', text: t('current_stock', { stock: fq(cur), unit: u }) });
    var seg = el('div', { class: 'seg', id: 'mv-type', role: 'group' });
    TYPES.forEach(function (k) { seg.appendChild(el('button', { type: 'button', dataset: { type: k }, 'aria-pressed': k === mode ? 'true' : 'false', i18n: 'type_' + k })); });
    var qtyLab = el('span', { i18n: mode === 'adj' ? 'f_count' : 'f_qty' });
    var inQty = el('input', { type: 'text', id: 'mv-qty', inputmode: 'decimal', dir: 'ltr', autocomplete: 'off', class: 'tnum', value: mode === 'adj' ? String(cur) : '' });
    var inDate = el('input', { type: 'date', id: 'mv-date', value: todayISO() });
    var inNote = el('input', { type: 'text', id: 'mv-note', maxlength: 200, dir: 'auto', autocomplete: 'off' });
    var info = el('p', { class: 'msg small', id: 'mv-info', 'aria-live': 'polite' });
    function update() {
      var q = num(inQty.value);
      info.className = 'msg small';
      if (mode === 'out' && !isNaN(q) && q > cur) { info.textContent = t('neg_warn', { stock: fq(cur), unit: u }); info.className = 'msg small bad'; }
      else if (mode === 'adj' && !isNaN(q)) { info.textContent = t('adj_change', { d: signed(q - cur), unit: u }); info.classList.add('muted'); }
      else info.textContent = '';
    }
    seg.addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-type]'); if (!b) return;
      mode = b.dataset.type;
      EDU.$$('button', seg).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      qtyLab.setAttribute('data-i18n', mode === 'adj' ? 'f_count' : 'f_qty'); qtyLab.textContent = t(mode === 'adj' ? 'f_count' : 'f_qty');
      if (mode === 'adj' && inQty.value.trim() === '') inQty.value = String(cur);
      update(); inQty.focus();
    });
    inQty.addEventListener('input', update);
    var form = el('form', { class: 'stack', id: 'move-form', novalidate: true }, head, curTxt, seg,
      el('div', { class: 'grid-2' }, el('label', { class: 'field' }, qtyLab, inQty), el('label', { class: 'field' }, el('span', { i18n: 'f_date' }), inDate), el('label', { class: 'field wide' }, el('span', { i18n: 'f_note' }), inNote)),
      info,
      el('div', { class: 'row' }, el('button', { type: 'submit', class: 'btn btn-primary', id: 'mv-save', i18n: 'save' }), el('button', { type: 'button', class: 'btn', i18n: 'cancel', onclick: function () { close(); } })));
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var q = num(inQty.value), date = parseDate(inDate.value) || todayISO(), note = str(inNote.value, 200);
      if (mode === 'adj') {
        if (isNaN(q) || q < 0 || q > 1e9) { info.textContent = t('bad_number'); info.className = 'msg small bad'; return; }
        var d = r3(q - cur);
        if (d === 0) { EDU.toast(t('no_change')); close(); return; }
        addEntry(it, 'adj', d, date, note);
      } else {
        if (isNaN(q) || q <= 0 || q > 1e9) { info.textContent = t('qty_pos'); info.className = 'msg small bad'; return; }
        addEntry(it, mode, q, date, note);
      }
      ui.hit = it.id; renderAll();
      var now = stockOf(it);
      EDU.toast(now < 0 ? t('scan_neg', { name: it.name, stock: fq(now), unit: u }) : t('move_saved', { name: it.name, stock: fq(now), unit: u }));
      close();
    });
    var close = EDU.modal(form, { title: t('move_' + mode), onClose: function () { refocusScan(); } });
    update();
    setTimeout(function () { inQty.focus(); if (mode === 'adj') inQty.select(); }, 30);
  }

  /* ================================================================ scanner / quick search */
  var scanFocusWanted = false;
  function refocusScan() { if (scanFocusWanted && ui.tab === 'stock') { try { $('#scan').focus(); } catch (e) { } } }
  function onScan(code) {
    code = str(code, 120); if (!code) return;
    var lc = code.toLowerCase(), scan = $('#scan'), msg = $('#scan-msg');
    var hits = items.filter(function (i) { return i.sku && i.sku.toLowerCase() === lc; });
    if (!hits.length) hits = items.filter(function (i) { return i.name.toLowerCase().indexOf(lc) >= 0; });
    scan.value = ''; msg.className = 'small muted msg';
    if (hits.length === 1) {
      var it = hits[0], u = unitName(it.unit), mode = settings.scanMode;
      ui.hit = it.id;
      if (mode === 'find') {
        ui.q = code; $('#search').value = code; ui.status = ''; $('#f-status').value = ''; ui.shown = PAGE;
        msg.textContent = t('scan_found', { name: it.name, stock: fq(stockOf(it)), unit: u });
        renderAll();
      } else {
        addEntry(it, mode, 1, todayISO(), t('note_scan'));
        var s = stockOf(it);
        msg.textContent = t(mode === 'in' ? 'scan_in_done' : 'scan_out_done', { name: it.name, stock: fq(s), unit: u });
        if (s < 0) { msg.textContent += ' ' + t('scan_neg', { name: it.name, stock: fq(s), unit: u }); msg.className = 'small msg bad'; }
        renderAll();
      }
    } else if (hits.length > 1) {
      ui.q = code; $('#search').value = code; ui.status = ''; $('#f-status').value = ''; ui.shown = PAGE; ui.hit = '';
      msg.textContent = t('scan_many', { n: EDU.fmt(hits.length), code: code });
      renderAll();
    } else {
      msg.textContent = t('scan_none', { code: code });
      openItemForm(null, /^[\w\-\/.]{3,}$/.test(code) && /\d/.test(code) ? { sku: code } : { name: code });
    }
  }

  /* ================================================================ CSV */
  var CSV_HEAD = ['name', 'sku', 'category', 'unit', 'purchase_price', 'selling_price', 'gst_percent', 'min_stock', 'supplier', 'expiry', 'stock', 'value_at_cost'];
  var ALIASES = {
    name: ['name', 'item', 'itemname', 'product', 'productname', 'description', 'particulars', 'itemdescription'],
    sku: ['sku', 'code', 'barcode', 'itemcode', 'ean', 'upc', 'productcode', 'skubarcode'],
    cat: ['category', 'cat', 'group', 'itemgroup', 'type'],
    unit: ['unit', 'uom', 'units', 'measure'],
    buy: ['purchaseprice', 'purchase', 'costprice', 'cost', 'buy', 'buyprice', 'purchaserate', 'rate', 'price'],
    sell: ['sellingprice', 'selling', 'saleprice', 'sale', 'sell', 'mrp', 'sellrate', 'salesprice'],
    gst: ['gstpercent', 'gst', 'gstrate', 'tax', 'taxpercent', 'taxrate'],
    min: ['minstock', 'min', 'minimum', 'minimumstock', 'reorderlevel', 'reorder', 'minqty'],
    supplier: ['supplier', 'vendor', 'party', 'suppliername'],
    expiry: ['expiry', 'expirydate', 'expires', 'exp', 'bestbefore', 'expdate'],
    stock: ['stock', 'qty', 'quantity', 'openingstock', 'opening', 'currentstock', 'balance', 'closing', 'closingstock', 'onhand']
  };
  function exportItems() {
    var rows = [CSV_HEAD.slice()];
    items.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).forEach(function (it) {
      var s = stockOf(it);
      rows.push([csvSafe(it.name), csvSafe(it.sku), csvSafe(it.cat), it.unit, it.buy, it.sell, it.gst, it.min, csvSafe(it.supplier), it.expiry, s, r2(Math.max(0, s) * it.buy)]);
    });
    EDU.download('stock-register-items-' + todayISO() + '.csv', EDU.csv.stringify(rows), 'text/csv');
  }
  function exportMoves() {
    var rows = [['date', 'item', 'sku', 'type', 'quantity', 'unit', 'note']];
    entries.slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : a.ts - b.ts; }).forEach(function (e) {
      var it = byId[e.item] || { name: '?', sku: '', unit: '' };
      rows.push([e.date, csvSafe(it.name), csvSafe(it.sku), e.type, delta(e), it.unit, csvSafe(e.note)]);
    });
    EDU.download('stock-register-movements-' + todayISO() + '.csv', EDU.csv.stringify(rows), 'text/csv');
  }
  function importCSV(text) {
    var rows = EDU.csv.parse(text);
    if (!rows.length) throw new Error('empty');
    var head = rows[0].map(function (h) { return String(h).toLowerCase().replace(/[^a-z]/g, ''); });
    var map = {}, found = 0;
    Object.keys(ALIASES).forEach(function (k) {
      for (var i = 0; i < ALIASES[k].length; i++) { var idx = head.indexOf(ALIASES[k][i]); if (idx >= 0 && !Object.keys(map).some(function (m) { return map[m] === idx; })) { map[k] = idx; found++; return; } }
    });
    var data;
    if (found && map.name !== undefined) data = rows.slice(1);
    else {
      map = { name: 0, sku: 1, cat: 2, unit: 3, buy: 4, sell: 5, gst: 6, min: 7, supplier: 8, expiry: 9, stock: 10 };
      var headerish = rows.length > 1 && rows[0].slice(4, 8).every(function (c) { return isNaN(num(c)); });
      data = headerish ? rows.slice(1) : rows;
    }
    var update = $('#csv-update').checked, added = 0, updated = 0, skipped = 0, bySku = {}, pending = {}, today = todayISO();
    items.forEach(function (it) { if (it.sku) bySku[it.sku.toLowerCase()] = it; });
    data.forEach(function (r) {
      var get = function (k) { return map[k] === undefined ? '' : String(r[map[k]] == null ? '' : r[map[k]]); };
      var name = str(get('name'), 160); if (!name || /[<>]/.test(name) && name.length > 120) { skipped++; return; }
      var sku = str(get('sku'), 64), ex = sku ? bySku[sku.toLowerCase()] : null, stock = num(get('stock'));
      var has = function (k) { return map[k] !== undefined && get(k).trim() !== ''; };
      if (ex) {
        if (!update) { skipped++; return; }
        if (has('name')) ex.name = name;
        if (has('cat')) ex.cat = str(get('cat'), 60);
        if (has('unit')) ex.unit = unitAlias(get('unit'));
        if (has('buy')) ex.buy = Math.max(0, nn(get('buy'), ex.buy, 1e9));
        if (has('sell')) ex.sell = Math.max(0, nn(get('sell'), ex.sell, 1e9));
        if (has('gst')) ex.gst = Math.min(100, Math.max(0, nn(get('gst'), ex.gst, 100)));
        if (has('min')) ex.min = Math.max(0, nn(get('min'), ex.min, 1e9));
        if (has('supplier')) ex.supplier = str(get('supplier'), 120);
        if (has('expiry')) ex.expiry = parseDate(get('expiry'));
        ex.sample = false; updated++;
        if (!isNaN(stock) && Math.abs(stock) <= 1e9) {
          var cur = stockOf(ex) + (pending[ex.id] || 0), d = r3(stock - cur);
          if (d !== 0) { entries.push(normEntry({ item: ex.id, type: 'adj', qty: d, date: today, note: t('import_note') })); pending[ex.id] = (pending[ex.id] || 0) + d; }
        }
      } else {
        var it = normItem({ name: name, sku: sku, cat: get('cat'), unit: get('unit'), buy: get('buy'), sell: get('sell'), gst: get('gst'), min: get('min'), supplier: get('supplier'), expiry: get('expiry') });
        if (!it) { skipped++; return; }
        items.push(it); if (it.sku) bySku[it.sku.toLowerCase()] = it; added++;
        if (!isNaN(stock) && stock > 0 && stock <= 1e9) { entries.push(normEntry({ item: it.id, type: 'in', qty: stock, date: today, note: t('import_note') })); pending[it.id] = stock; }
      }
    });
    if (!added && !updated) { if (!skipped) throw new Error('nothing'); }
    touched(); save('items'); save('entries'); recompute(); ui.q = ''; $('#search').value = ''; renderAll();
    EDU.toast(t('import_done', { added: EDU.fmt(added), updated: EDU.fmt(updated), skipped: EDU.fmt(skipped) }), 5000);
  }

  /* ================================================================ backup / restore / reset */
  function backup() {
    flush();
    var payload = { app: SLUG, version: 1, saved: new Date().toISOString(), settings: { shop: settings.shop, gst: settings.gst, expDays: settings.expDays }, items: items, entries: entries };
    EDU.download('stock-register-backup-' + todayISO() + '.json', JSON.stringify(payload), 'application/json');
    settings.lastBackup = Date.now(); settings.snooze = 0; save('settings');
    renderBanners(); if (ui.tab === 'data') renderData();
  }
  function restoreFrom(obj) {
    if (!obj || obj.app !== SLUG || !Array.isArray(obj.items)) { EDU.toast(t('restore_bad')); return; }
    var seen = {}, its = obj.items.map(normItem).filter(Boolean).map(function (i) { if (seen[i.id]) i.id = uid(); seen[i.id] = 1; return i; });
    var ens = (Array.isArray(obj.entries) ? obj.entries : []).map(function (e) { return normEntry(e, seen); }).filter(Boolean);
    if (!its.length && !ens.length) { EDU.toast(t('restore_bad')); return; }
    if (!confirmIt(t('confirm_restore'))) return;
    items = its; entries = ens; hideUndo();
    var s = obj.settings && typeof obj.settings === 'object' ? obj.settings : {};
    var ns = normSettings(s); settings.shop = ns.shop; settings.gst = ns.gst; settings.expDays = ns.expDays;
    save('items'); save('entries'); save('settings'); flush();
    recompute(); ui.q = ''; $('#search').value = ''; ui.status = ''; $('#f-status').value = ''; ui.hit = '';
    renderAll();
    EDU.toast(t('restore_ok', { items: EDU.fmt(its.length), moves: EDU.fmt(ens.length) }));
  }
  function resetAll() {
    if (!confirmIt(t('confirm_reset'))) return;
    items = []; entries = []; hideUndo();
    var keep = { tab: settings.tab, scanMode: settings.scanMode, persistAsked: settings.persistAsked };
    settings = normSettings(keep);
    save('items'); save('entries'); save('settings'); flush();
    recompute(); ui.q = ''; $('#search').value = ''; ui.status = ''; $('#f-status').value = ''; ui.hit = '';
    renderAll();
  }
  function clearOld() {
    var cut = parseDate($('#old-date').value); if (!cut) return;
    var old = entries.filter(function (e) { return e.date < cut; });
    if (!old.length) { EDU.toast(t('none_old')); return; }
    if (!confirmIt(t('confirm_clear_old', { n: EDU.fmt(old.length), date: fmtDate(cut) }))) return;
    var net = {};
    old.forEach(function (e) { net[e.item] = r3((net[e.item] || 0) + delta(e)); });
    entries = entries.filter(function (e) { return e.date >= cut; });
    Object.keys(net).forEach(function (id) { if (net[id] !== 0 && byId[id]) entries.push(normEntry({ item: id, type: 'adj', qty: net[id], date: cut, note: t('note_opening'), ts: 0 })); });
    touched(); save('entries'); recompute(); renderAll();
    EDU.toast(t('cleared_old', { n: EDU.fmt(old.length) }));
  }

  /* ================================================================ stock-take sheet (print) */
  function buildSheet() {
    var list = filteredItems(), today = fmtDate(todayISO());
    var h = '<h1>' + esc(settings.shop || t('app_title')) + '</h1>' +
      '<p>' + esc(t('sheet_title')) + ' · ' + esc(t('sheet_date')) + ': ' + today + ' · ' + esc(t('sheet_by')) + ': ______________________' + (ui.cat ? ' · ' + esc(t('category')) + ': ' + esc(ui.cat) : '') + '</p>' +
      '<table><thead><tr><th>' + esc(t('sheet_no')) + '</th><th>' + esc(t('col_name')) + '</th><th>' + esc(t('col_sku')) + '</th><th>' + esc(t('col_unit')) + '</th><th>' + esc(t('sheet_book')) + '</th><th>' + esc(t('sheet_counted')) + '</th><th>' + esc(t('sheet_diff')) + '</th><th>' + esc(t('sheet_remarks')) + '</th></tr></thead><tbody>' +
      list.map(function (it, i) { return '<tr><td>' + EDU.fmt(i + 1) + '</td><td>' + esc(it.name) + '</td><td dir="ltr">' + esc(it.sku) + '</td><td>' + esc(unitName(it.unit)) + '</td><td>' + fq(stockOf(it)) + '</td><td class="blank"></td><td class="blank"></td><td class="blank"></td></tr>'; }).join('') +
      '</tbody></table><p style="margin-top:8px">' + esc(t('sheet_footer')) + '</p><div class="sign"><span>' + esc(t('sheet_sign')) + ': ______________________</span><span>' + esc(t('sheet_date')) + ': ______________</span></div>';
    $('#sheet').innerHTML = h;
    return list.length;
  }
  function printSheet() {
    buildSheet();
    document.body.classList.add('sheet-mode');
    try { window.print(); } catch (e) { }
    setTimeout(function () { document.body.classList.remove('sheet-mode'); }, 1500);
  }
  window.addEventListener('afterprint', function () { document.body.classList.remove('sheet-mode'); });

  /* ================================================================ wiring */
  EDU.init({ slug: SLUG, title: 'app_title', wide: true, waKey: 'shell_wa_tool' });
  load();

  $('#tabs').addEventListener('click', function (ev) { var b = ev.target.closest('button[data-tab]'); if (b) setTab(b.dataset.tab); });
  $('#tabs').addEventListener('keydown', function (ev) {
    var tabs = EDU.$$('button[data-tab]', $('#tabs')), i = tabs.indexOf(document.activeElement); if (i < 0) return;
    var rtl = document.documentElement.dir === 'rtl', fwd = rtl ? 'ArrowLeft' : 'ArrowRight', back = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (ev.key === fwd || ev.key === back) { ev.preventDefault(); var j = (i + (ev.key === fwd ? 1 : tabs.length - 1)) % tabs.length; tabs[j].focus(); setTab(tabs[j].dataset.tab); }
  });

  /* scanner */
  var scanEl = $('#scan');
  scanEl.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); scanFocusWanted = true; onScan(scanEl.value); } });
  scanEl.addEventListener('focus', function () { scanFocusWanted = true; });
  scanEl.addEventListener('blur', function () { setTimeout(function () { if (!document.querySelector('.edu-modal-back') && document.activeElement !== scanEl) scanFocusWanted = false; }, 50); });
  $('#scan-mode').addEventListener('click', function (ev) {
    var b = ev.target.closest('button[data-mode]'); if (!b) return;
    settings.scanMode = b.dataset.mode; save('settings');
    EDU.$$('button', $('#scan-mode')).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    scanEl.focus();
  });
  EDU.$$('button', $('#scan-mode')).forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.mode === settings.scanMode ? 'true' : 'false'); });

  /* stock filters */
  var qTimer = null;
  $('#search').addEventListener('input', function () { ui.q = this.value; ui.shown = PAGE; ui.hit = ''; clearTimeout(qTimer); qTimer = setTimeout(renderStock, 120); });
  $('#f-cat').addEventListener('change', function () { ui.cat = this.value; ui.shown = PAGE; renderStock(); });
  $('#f-status').addEventListener('change', function () { ui.status = this.value; ui.shown = PAGE; renderTiles(); renderStock(); });
  $('#sort').addEventListener('change', function () { ui.sort = this.value; ui.shown = PAGE; renderStock(); });
  $('#more').addEventListener('click', function () { ui.shown += MORE; renderStock(); });
  $('#tiles').addEventListener('click', function (ev) {
    var b = ev.target.closest('button[data-filter]'); if (!b) return;
    ui.status = ui.status === b.dataset.filter ? '' : b.dataset.filter; $('#f-status').value = ui.status; ui.shown = PAGE;
    renderTiles(); renderStock();
  });
  $('#add-item').addEventListener('click', function () { openItemForm(null); });
  $('#empty-add').addEventListener('click', function () { openItemForm(null); });
  $('#load-samples').addEventListener('click', function () { seedSamples(); save('items'); save('entries'); recompute(); renderAll(); });
  $('#remove-samples').addEventListener('click', function () {
    var gone = items.filter(function (i) { return i.sample; }), ids = {}; gone.forEach(function (i) { ids[i.id] = 1; });
    var goneE = entries.filter(function (e) { return ids[e.item]; });
    items = items.filter(function (i) { return !i.sample; }); entries = entries.filter(function (e) { return !ids[e.item]; });
    save('items'); save('entries'); recompute(); renderAll();
    showUndo(t('examples_removed'), { kind: 'bulk', items: gone, entries: goneE });
  });
  $('#print-sheet').addEventListener('click', printSheet);
  $('#export-items').addEventListener('click', exportItems);
  $('#export-items-2').addEventListener('click', exportItems);
  $('#export-moves').addEventListener('click', exportMoves);
  $('#export-moves-2').addEventListener('click', exportMoves);
  $('#undo-btn').addEventListener('click', undo);

  /* row actions (stock + expiry + ledger) */
  function onRowAction(ev) {
    var b = ev.target.closest('button[data-act]'); if (!b) return;
    var act = b.dataset.act, id = b.dataset.id;
    if (act === 'del-entry') { deleteEntry(id); return; }
    var it = byId[id]; if (!it) return;
    if (act === 'edit') openItemForm(it); else openMove(it, act);
  }
  $('#stock-body').addEventListener('click', onRowAction);
  $('#exp-body').addEventListener('click', onRowAction);
  $('#ledger-body').addEventListener('click', onRowAction);

  /* movements */
  $('#view-seg').addEventListener('click', function (ev) {
    var b = ev.target.closest('button[data-view]'); if (!b) return;
    ui.view = b.dataset.view; ui.mshown = PAGE;
    EDU.$$('button', $('#view-seg')).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    renderMoves();
  });
  $('#period').addEventListener('change', function () { ui.period = this.value; ui.mshown = PAGE; if (ui.period === 'custom' && !ui.from) { ui.from = shiftISO(-30); ui.to = todayISO(); $('#from').value = ui.from; $('#to').value = ui.to; } renderMoves(); });
  $('#from').addEventListener('change', function () { ui.from = parseDate(this.value); renderMoves(); });
  $('#to').addEventListener('change', function () { ui.to = parseDate(this.value); renderMoves(); });
  $('#m-type').addEventListener('change', function () { ui.mtype = this.value; ui.mshown = PAGE; renderMoves(); });
  var mqTimer = null;
  $('#m-search').addEventListener('input', function () { ui.mq = this.value; ui.mshown = PAGE; clearTimeout(mqTimer); mqTimer = setTimeout(renderMoves, 120); });
  $('#m-more').addEventListener('click', function () { ui.mshown += MORE; renderMoves(); });

  /* expiry */
  $('#exp-days').addEventListener('change', function () { settings.expDays = +this.value; save('settings'); renderTiles(); renderExpiry(); });

  /* data & backup */
  $('#shop').addEventListener('input', function () { settings.shop = str(this.value, 80); save('settings'); });
  $('#default-gst').addEventListener('change', function () { var g = num(this.value); settings.gst = isNaN(g) || g < 0 || g > 100 ? '5' : String(g); this.value = settings.gst; save('settings'); });
  $('#import-csv').addEventListener('click', function () {
    EDU.pickFile('.csv,.txt,text/csv,text/plain').then(function (f) {
      if (!f) return;
      return EDU.readText(f).then(function (txt) { try { importCSV(txt); } catch (e) { EDU.toast(t('import_bad')); } });
    }).catch(function () { EDU.toast(t('import_bad')); });
  });
  $('#backup-btn').addEventListener('click', backup);
  $('#remind-backup').addEventListener('click', backup);
  $('#quota-backup').addEventListener('click', backup);
  $('#remind-later').addEventListener('click', function () { settings.snooze = Date.now() + DAY; save('settings'); renderBanners(); });
  $('#restore-btn').addEventListener('click', function () {
    EDU.pickFile('.json,application/json').then(function (f) {
      if (!f) return;
      return EDU.readText(f).then(function (txt) {
        var obj = null; try { obj = JSON.parse(String(txt).replace(/^﻿/, '')); } catch (e) { obj = null; }
        restoreFrom(obj);
      });
    }).catch(function () { EDU.toast(t('restore_bad')); });
  });
  $('#clear-old').addEventListener('click', clearOld);
  $('#reset-btn').addEventListener('click', resetAll);

  EDU.onLang(function () { renderAll(); });
  setTab(ui.tab);
  renderAll();
})();
