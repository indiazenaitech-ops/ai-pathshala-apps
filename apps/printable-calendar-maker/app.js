/* Printable Calendar Maker
   One month, a whole year on one page, or 12 monthly pages, on A4 portrait or landscape, in the interface language.
   Month and weekday names come from strings.js (not Intl), so all 12 languages look the same on every device and offline.
   There is NO built-in list of festivals or government holidays: users add their own events.
   Everything stays on this device. */
(function () {
  'use strict';
  var SLUG = 'printable-calendar-maker';
  var store = EDU.store(SLUG);
  var $ = EDU.$, $$ = EDU.$$, t = EDU.t;
  var MIN_Y = 1900, MAX_Y = 2100, MAX_EVENTS = 300, MAX_LABEL = 60;
  var LAYS = ['month', 'year', '12'], THEMES = ['blue', 'green', 'orange', 'pink', 'ink'];

  /* ================================================================ calendar maths (pure, no Date object) */
  var K = {
    isLeap: function (y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; },
    daysIn: function (y, m) { return m === 2 ? (K.isLeap(y) ? 29 : 28) : [4, 6, 9, 11].indexOf(m) >= 0 ? 30 : 31; },
    /* day of the week, 0 = Sunday ... 6 = Saturday (Sakamoto's method, Gregorian calendar) */
    dow: function (y, m, d) {
      var T = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
      if (m < 3) y -= 1;
      return (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + T[m - 1] + d) % 7;
    },
    /* cells of a month grid, 0 = empty cell; ws = 0 (week starts Sunday) or 1 (Monday) */
    cells: function (y, m, ws) {
      var out = [], lead = (K.dow(y, m, 1) - ws + 7) % 7, n = K.daysIn(y, m), i;
      for (i = 0; i < lead; i++) out.push(0);
      for (i = 1; i <= n; i++) out.push(i);
      while (out.length % 7) out.push(0);
      return out;
    },
    /* "2027-01-26", "26/01/2027" or "26-01-2027" -> { y, m, d } or null */
    parseDate: function (s) {
      s = latin(s).trim();
      var a = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s), b = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/.exec(s), y, m, d;
      if (a) { y = +a[1]; m = +a[2]; d = +a[3]; } else if (b) { y = +b[3]; m = +b[2]; d = +b[1]; } else return null;
      if (y < MIN_Y || y > MAX_Y || m < 1 || m > 12 || d < 1 || d > K.daysIn(y, m)) return null;
      return { y: y, m: m, d: d };
    },
    iso: function (y, m, d) { return y + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d; }
  };
  window.CALMAKER = K;

  function latin(s) {
    var Z = [0x0660, 0x06F0, 0x0966, 0x09E6, 0x0A66, 0x0AE6, 0x0B66, 0x0BE6, 0x0C66, 0x0CE6, 0x0D66];
    return String(s == null ? '' : s).replace(/[٠-٩۰-۹०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯]/g, function (c) {
      var code = c.charCodeAt(0);
      for (var i = 0; i < Z.length; i++) if (code >= Z[i] && code <= Z[i] + 9) return String(code - Z[i]);
      return c;
    });
  }
  function h(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  /* ================================================================ state */
  function defaults() {
    var now = new Date(), y = EDU.clamp(now.getFullYear(), MIN_Y, MAX_Y);
    return { lay: 'month', y: y, m: now.getMonth() + 1, ws: 0, pp: 'port', th: 'blue', title: '', sun: true, list: true };
  }
  function load() {
    var d = defaults(), s = store.get('state', null);
    if (s && typeof s === 'object') {
      if (LAYS.indexOf(s.lay) >= 0) d.lay = s.lay;
      if (s.y === Math.floor(s.y) && s.y >= MIN_Y && s.y <= MAX_Y) d.y = s.y;
      if (s.m === Math.floor(s.m) && s.m >= 1 && s.m <= 12) d.m = s.m;
      if (s.ws === 0 || s.ws === 1) d.ws = s.ws;
      if (s.pp === 'port' || s.pp === 'land') d.pp = s.pp;
      if (THEMES.indexOf(s.th) >= 0) d.th = s.th;
      if (typeof s.title === 'string') d.title = s.title.slice(0, MAX_LABEL);
      if (typeof s.sun === 'boolean') d.sun = s.sun;
      if (typeof s.list === 'boolean') d.list = s.list;
    }
    return d;
  }
  /* an event: { d: 'YYYY-MM-DD', t: 'label', y: true when it repeats every year } */
  function cleanEvent(o) {
    if (!o || typeof o !== 'object') return null;
    var p = K.parseDate(o.d != null ? o.d : o.date), label = String(o.t != null ? o.t : (o.label != null ? o.label : '')).replace(/\s+/g, ' ').trim().slice(0, MAX_LABEL);
    if (!p || !label) return null;
    return { d: K.iso(p.y, p.m, p.d), t: label, y: !!(o.y != null ? o.y : o.yearly) };
  }
  function loadEvents() {
    var raw = store.get('events', []), out = [];
    if (Array.isArray(raw)) raw.slice(0, MAX_EVENTS).forEach(function (o) { var e = cleanEvent(o); if (e) out.push(e); });
    return out;
  }
  var S = load(), EV = loadEvents();
  function save() { store.set('state', S); }
  function saveEvents() { store.set('events', EV); }
  function sortEvents() {
    EV.sort(function (a, b) { return a.d.slice(5) < b.d.slice(5) ? -1 : a.d.slice(5) > b.d.slice(5) ? 1 : a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });
  }
  function sameEvent(a, b) { return a.d === b.d && a.t === b.t && a.y === b.y; }

  /* events that fall in year y: { 'm-d': [labels] } (29 February of a yearly event is skipped in non-leap years) */
  function indexYear(y) {
    var map = {};
    EV.forEach(function (e) {
      var ey = +e.d.slice(0, 4), m = +e.d.slice(5, 7), d = +e.d.slice(8, 10);
      if (!(e.y || ey === y) || d > K.daysIn(y, m)) return;
      (map[m + '-' + d] = map[m + '-' + d] || []).push(e.t);
    });
    return map;
  }
  function monthEvents(map, y, m) {
    var out = [], d, n = K.daysIn(y, m);
    for (d = 1; d <= n; d++) (map[m + '-' + d] || []).forEach(function (label) { out.push({ d: d, t: label }); });
    return out;
  }

  /* ================================================================ sheets */
  function sheet(extra) {
    return h('div', 'cm-sheet ' + extra + (S.pp === 'land' ? ' land' : '') + ' t-' + S.th + (S.sun ? ' sunred' : ''));
  }
  function wrap(s) { var f = h('div', 'cm-fit'); f.appendChild(s); return f; }
  function titleLine(s) { if (S.title.trim()) s.appendChild(h('div', 'cm-title no-i18n', S.title.trim())); }
  function footCap() { return S.pp === 'land' ? 6 : 8; }

  function monthSheet(y, m, map) {
    var s = sheet('cm-month'), sunCol = (7 - S.ws) % 7, i;
    s.setAttribute('data-month', K.iso(y, m, 1).slice(0, 7));
    titleLine(s);
    var head = h('div', 'cm-head');
    head.appendChild(h('div', 'cm-mname', t('m' + m)));
    head.appendChild(h('div', 'cm-yr', String(y)));
    s.appendChild(head);
    var wd = h('div', 'cm-wd');
    for (i = 0; i < 7; i++) wd.appendChild(h('div', i === sunCol ? 'sun' : '', t('wd' + ((i + S.ws) % 7))));
    s.appendChild(wd);
    var grid = h('div', 'cm-grid'), cells = K.cells(y, m, S.ws), maxEv = S.pp === 'land' || cells.length > 35 ? 2 : 3;
    cells.forEach(function (d, idx) {
      var c = h('div', 'cm-day' + (d ? '' : ' blank') + (idx % 7 === sunCol ? ' sun' : ''));
      if (d) {
        c.setAttribute('data-date', K.iso(y, m, d));
        c.appendChild(h('div', 'cm-num', String(d)));
        var list = map[m + '-' + d] || [];
        if (list.length > 1) c.className += ' many';
        list.slice(0, list.length > maxEv ? maxEv - 1 : maxEv).forEach(function (label) { c.appendChild(h('div', 'cm-ev no-i18n', label)); });
        if (list.length > maxEv) c.appendChild(h('div', 'cm-more', t('more_n', { n: list.length - (maxEv - 1) })));
      }
      grid.appendChild(c);
    });
    s.appendChild(grid);
    var evs = monthEvents(map, y, m), cap = footCap();
    if (S.list && evs.length) {
      var foot = h('div', 'cm-foot');
      evs.slice(0, evs.length > cap ? cap - 1 : cap).forEach(function (e) { foot.appendChild(row('div', String(e.d), e.t)); });
      if (evs.length > cap) foot.appendChild(h('div', 'cm-more', t('more_n', { n: evs.length - (cap - 1) })));
      s.appendChild(foot);
    }
    return s;
  }
  function row(tag, date, label) {
    var r = h(tag, 'cm-row');
    r.appendChild(h('b', '', date)); r.appendChild(document.createTextNode('  '));
    r.appendChild(h('span', 'no-i18n', label));
    return r;
  }
  function yearSheet(y, map) {
    var s = sheet('cm-year'), sunCol = (7 - S.ws) % 7, m, i;
    s.setAttribute('data-year', String(y));
    titleLine(s);
    s.appendChild(h('div', 'cm-yhead', String(y)));
    var months = h('div', 'cm-months');
    for (m = 1; m <= 12; m++) {
      var mini = h('div', 'cm-mini'), g = h('div', 'cm-mgrid');
      mini.setAttribute('data-m', String(m));
      mini.appendChild(h('h3', '', t('m' + m)));
      for (i = 0; i < 7; i++) g.appendChild(h('span', 'w' + (i === sunCol ? ' sun' : ''), t('wn' + ((i + S.ws) % 7))));
      K.cells(y, m, S.ws).forEach(function (d, idx) {
        var c = h('span', d ? 'd' + (idx % 7 === sunCol ? ' sun' : '') + (map[m + '-' + d] ? ' has-ev' : '') : 'x', d ? String(d) : '');
        if (d) c.setAttribute('data-date', K.iso(y, m, d));
        g.appendChild(c);
      });
      mini.appendChild(g); months.appendChild(mini);
    }
    s.appendChild(months);
    return s;
  }
  function listSheet(y, map, from, to) {
    var s = sheet('cm-list'), rows = h('div', 'cm-rows'), m;
    titleLine(s);
    s.appendChild(h('h3', '', t('list_h') + ' · ' + y));
    for (m = from; m <= to; m++) monthEvents(map, y, m).forEach(function (e) { rows.appendChild(row('div', e.d + ' ' + t('m' + m), e.t)); });
    s.appendChild(rows);
    return s;
  }

  var pageStyle = document.createElement('style');
  document.head.appendChild(pageStyle);

  function renderSheets() {
    var box = $('#sheets'), map = indexYear(S.y), m, over = false, any = Object.keys(map).length > 0;
    var from = S.lay === 'month' ? S.m : 1, to = S.lay === 'month' ? S.m : 12;
    box.textContent = '';
    if (S.lay === 'year') box.appendChild(wrap(yearSheet(S.y, map)));
    else {
      for (m = from; m <= to; m++) {
        box.appendChild(wrap(monthSheet(S.y, m, map)));
        if (monthEvents(map, S.y, m).length > footCap()) over = true;
      }
    }
    if (S.list && any && (S.lay === 'year' || over)) box.appendChild(wrap(listSheet(S.y, map, from, to)));
    $('#pageCount').textContent = t('pages_n', { n: box.children.length });
    pageStyle.textContent = '@page { size: A4 ' + (S.pp === 'land' ? 'landscape' : 'portrait') + '; margin: 10mm; }';
    fit();
  }
  /* shrink every sheet (real paper size in mm) to the width of the preview column */
  function fit() {
    $$('#sheets .cm-fit').forEach(function (f) {
      var s = f.firstChild, fw = f.clientWidth;
      if (!fw || !s.offsetWidth) return;
      var gap = Math.max(6, fw * 0.03), k = Math.min(1, (fw - 2 * gap) / s.offsetWidth), padX = (fw - s.offsetWidth * k) / 2;
      s.style.transform = 'scale(' + k + ')';
      s.style.margin = gap + 'px ' + padX + 'px';
      f.style.height = Math.ceil(s.offsetHeight * k + 2 * gap) + 'px';
    });
  }

  /* ================================================================ controls */
  function press(sel, attr, val) { $$(sel).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute(attr) === String(val))); }); }
  function syncControls() {
    press('[data-lay]', 'data-lay', S.lay); press('[data-ws]', 'data-ws', S.ws); press('[data-pp]', 'data-pp', S.pp); press('[data-th]', 'data-th', S.th);
    var sel = $('#month'), m;
    sel.textContent = '';
    for (m = 1; m <= 12; m++) { var o = h('option', '', t('m' + m)); o.value = String(m); sel.appendChild(o); }
    sel.value = String(S.m);
    $('#monthBox').hidden = S.lay !== 'month';
    $('#title').value = S.title; $('#sunRed').checked = S.sun; $('#showList').checked = S.list;
  }
  function yearError(on) {
    var e = $('#yearErr'); e.hidden = !on; e.textContent = on ? t('err_year', { a: MIN_Y, b: MAX_Y }) : '';
    if (on) $('#year').setAttribute('aria-invalid', 'true'); else $('#year').removeAttribute('aria-invalid');
  }
  function setYear(y) { S.y = EDU.clamp(y, MIN_Y, MAX_Y); $('#year').value = String(S.y); yearError(false); save(); renderSheets(); }
  function evError(key, vars) { var e = $('#evErr'); e.hidden = !key; e.textContent = key ? t(key, vars) : ''; }

  function dateText(e) {
    var m = +e.d.slice(5, 7), d = +e.d.slice(8, 10);
    return d + ' ' + t('m' + m) + (e.y ? '' : ' ' + e.d.slice(0, 4));
  }
  function renderEvents() {
    var ul = $('#evList'); ul.textContent = ''; ul.hidden = !EV.length;
    $('#evCount').textContent = EV.length ? t('ev_count', { n: EV.length }) : t('ev_none');
    EV.forEach(function (e, i) {
      var li = h('li'), del = h('button', 'btn btn-ghost', '✕');
      li.appendChild(h('span', 'd', dateText(e)));
      li.appendChild(h('span', 'n no-i18n', e.t));
      if (e.y) li.appendChild(h('span', 'badge', t('yearly_badge')));
      del.type = 'button'; del.setAttribute('aria-label', t('del_ev')); del.setAttribute('data-del', String(i));
      del.addEventListener('click', function () { EV.splice(i, 1); saveEvents(); renderEvents(); renderSheets(); });
      li.appendChild(del); ul.appendChild(li);
    });
    $('#exportBtn').disabled = $('#clearEv').disabled = !EV.length;
  }
  function addEvent() {
    var p = K.parseDate($('#evDate').value), ev;
    if (!p) return evError('err_date', { a: MIN_Y, b: MAX_Y });
    ev = cleanEvent({ d: K.iso(p.y, p.m, p.d), t: $('#evLabel').value, y: $('#evYearly').checked });
    if (!ev) return evError('err_label');
    if (EV.length >= MAX_EVENTS) return evError('err_max', { n: MAX_EVENTS });
    if (EV.some(function (x) { return sameEvent(x, ev); })) return evError('err_dup');
    evError(null);
    EV.push(ev); sortEvents(); saveEvents();
    $('#evLabel').value = '';
    renderEvents(); renderSheets();
  }
  function exportEvents() {
    var data = { app: SLUG, version: 1, events: EV.map(function (e) { return { date: e.d, label: e.t, yearly: e.y }; }) };
    EDU.download('calendar-events.json', JSON.stringify(data, null, 2), 'application/json');
    EDU.toast(t('exp_ok'));
  }
  /* a file exported from this tool (JSON), or a CSV with: date, name, optional "yes" for every year */
  function importText(text) {
    var list = null, added = 0, valid = 0;
    text = String(text || '').replace(/^﻿/, '');
    try {
      var j = JSON.parse(text);
      list = Array.isArray(j) ? j : (j && Array.isArray(j.events) ? j.events : null);
    } catch (e) { list = null; }
    if (!list) {
      try {
        list = EDU.csv.parse(text).map(function (r) { return { d: r[0], t: r[1], y: /^(1|y|yes|true)$/i.test(String(r[2] || '').trim()) }; });
      } catch (e2) { list = []; }
    }
    list.slice(0, 5000).forEach(function (o) {
      var ev = cleanEvent(o);
      if (!ev) return;
      valid++;
      if (EV.length >= MAX_EVENTS || EV.some(function (x) { return sameEvent(x, ev); })) return;
      EV.push(ev); added++;
    });
    if (!valid) return EDU.toast(t('imp_bad'));
    if (added) { sortEvents(); saveEvents(); renderEvents(); renderSheets(); }
    EDU.toast(added ? t('imp_ok', { n: added }) : t('imp_none'));
  }

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  $$('[data-lay]').forEach(function (b) { b.addEventListener('click', function () { S.lay = b.getAttribute('data-lay'); save(); syncControls(); renderSheets(); }); });
  $$('[data-ws]').forEach(function (b) { b.addEventListener('click', function () { S.ws = +b.getAttribute('data-ws'); save(); syncControls(); renderSheets(); }); });
  $$('[data-pp]').forEach(function (b) { b.addEventListener('click', function () { S.pp = b.getAttribute('data-pp'); save(); syncControls(); renderSheets(); }); });
  $$('[data-th]').forEach(function (b) { b.addEventListener('click', function () { S.th = b.getAttribute('data-th'); save(); syncControls(); renderSheets(); }); });
  $('#year').addEventListener('input', function () {
    var s = latin(this.value).trim(), y = /^\d{4}$/.test(s) ? +s : NaN;
    if (!(y >= MIN_Y && y <= MAX_Y)) return yearError(true);
    S.y = y; yearError(false); save(); renderSheets();
  });
  $('#year').addEventListener('blur', function () { if ($('#yearErr').hidden) this.value = String(S.y); });
  $('#yr-prev').addEventListener('click', function () { setYear(S.y - 1); });
  $('#yr-next').addEventListener('click', function () { setYear(S.y + 1); });
  $('#month').addEventListener('change', function () { S.m = EDU.clamp(+this.value || 1, 1, 12); save(); renderSheets(); });
  $('#title').addEventListener('input', function () { S.title = this.value.slice(0, MAX_LABEL); save(); renderSheets(); });
  $('#sunRed').addEventListener('change', function () { S.sun = this.checked; save(); renderSheets(); });
  $('#showList').addEventListener('change', function () { S.list = this.checked; save(); renderSheets(); });
  $('#evAdd').addEventListener('click', addEvent);
  $('#evLabel').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addEvent(); } });
  $('#exportBtn').addEventListener('click', exportEvents);
  $('#importBtn').addEventListener('click', function () { $('#impFile').click(); });
  $('#impFile').addEventListener('change', function () {
    var f = this.files && this.files[0];
    this.value = '';
    if (!f) return;
    if (f.size > 1024 * 1024) return EDU.toast(t('imp_bad'));
    EDU.readText(f).then(importText, function () { EDU.toast(t('imp_bad')); });
  });
  $('#clearEv').addEventListener('click', function () {
    if (!EV.length || !confirm(t('confirm_clear'))) return;
    EV = []; saveEvents(); renderEvents(); renderSheets();
  });
  $('#printBtn').addEventListener('click', function () { window.print(); });
  $('#resetAll').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    S = defaults(); EV = []; store.remove('state'); store.remove('events');
    $('#year').value = String(S.y); $('#evLabel').value = ''; $('#evYearly').checked = false;
    yearError(false); evError(null); renderAll(); EDU.toast(t('reset_done'));
  });
  window.addEventListener('resize', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

  function renderAll() { syncControls(); renderEvents(); renderSheets(); if (!$('#yearErr').hidden) yearError(true); }
  $('#year').value = String(S.y);
  $('#evDate').value = K.iso(S.y, S.m, 1);
  sortEvents();
  EDU.onLang(renderAll);
  renderAll();
})();
