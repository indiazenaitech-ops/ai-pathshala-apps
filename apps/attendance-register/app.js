/* Attendance Register: daily marking, monthly register, students, backup.
   Storage (EDU.store('attendance-register')):
     meta  = { v, order:[classIds], active, tab, school, sundaysOff, leaveCounts, minPct, off:{date:1}, on:{date:1} }
     c_<id> = { id, name, sample, students:[{id, roll, name}], marks:{ 'YYYY-MM-DD': { studentId: 'P'|'A'|'T'|'V' } } }
   Codes: P present, A absent, T late (counts as present), V leave. */
(function () {
  'use strict';
  var SLUG = 'attendance-register';
  var store = EDU.store(SLUG);
  var CODES = ['P', 'A', 'T', 'V'];
  var NEXT = { '': 'P', P: 'A', A: 'T', T: 'V', V: '' };
  var NATIONAL = ['01-26', '08-15', '10-02'];
  var t = EDU.t, $ = EDU.$, $$ = EDU.$$, esc = EDU.esc;

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ---------------- dates (always local time, never toISOString) ---------------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return isNaN(d.getTime()) || d.getMonth() !== +m[2] - 1 ? null : d;
  }
  function todayStr() { return ymd(new Date()); }
  function addDays(s, n) { var d = parseDate(s) || new Date(); d.setDate(d.getDate() + n); return ymd(d); }
  function daysIn(y, m) { return new Date(y, m + 1, 0).getDate(); }
  function dateOf(y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); }
  function list(key) { return String(t(key)).split(',').map(function (s) { return s.trim(); }); }
  function monthName(m) { return list('months')[m] || String(m + 1); }
  function monthLabel(y, m) { return t('month_year', { m: monthName(m), y: y }); }
  function longDate(s) {
    var d = parseDate(s); if (!d) return s;
    return t('date_long', { wd: list('wd_full')[d.getDay()], d: d.getDate(), m: monthName(d.getMonth()), y: d.getFullYear() });
  }

  /* ---------------- state ---------------- */
  var meta, classes = {};
  var ui = { date: todayStr(), ym: null, q: '' };
  var uidN = 0;
  function uid() { return Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 6) + (uidN++).toString(36); }

  function defaultsMeta(m) {
    m = m && typeof m === 'object' ? m : {};
    var out = {
      v: 1,
      order: Array.isArray(m.order) ? m.order.filter(function (x) { return typeof x === 'string'; }) : [],
      active: typeof m.active === 'string' ? m.active : '',
      tab: ['day', 'month', 'students'].indexOf(m.tab) >= 0 ? m.tab : 'day',
      school: typeof m.school === 'string' ? m.school.slice(0, 100) : '',
      sundaysOff: m.sundaysOff !== false,
      leaveCounts: m.leaveCounts === true,
      minPct: Number.isFinite(+m.minPct) && +m.minPct >= 1 && +m.minPct <= 100 ? +m.minPct : 75,
      off: {}, on: {}
    };
    ['off', 'on'].forEach(function (k) {
      if (m[k] && typeof m[k] === 'object') Object.keys(m[k]).forEach(function (d) { if (parseDate(d) && m[k][d]) out[k][d] = 1; });
    });
    return out;
  }

  function sanitizeClass(c) {
    if (!c || typeof c !== 'object' || typeof c.id !== 'string' || !c.id) return null;
    var out = { id: c.id, name: String(c.name || t('my_class')).slice(0, 60), sample: !!c.sample, students: [], marks: {} };
    var seen = {};
    (Array.isArray(c.students) ? c.students : []).forEach(function (s) {
      if (!s || typeof s !== 'object') return;
      var id = typeof s.id === 'string' && s.id && !seen[s.id] ? s.id : uid();
      var name = String(s.name == null ? '' : s.name).trim().slice(0, 80);
      if (!name) return;
      seen[id] = 1;
      out.students.push({ id: id, roll: String(s.roll == null ? '' : s.roll).trim().slice(0, 8), name: name });
    });
    if (c.marks && typeof c.marks === 'object') {
      Object.keys(c.marks).forEach(function (d) {
        var day = c.marks[d];
        if (!parseDate(d) || !day || typeof day !== 'object') return;
        var clean = {}, any = false;
        Object.keys(day).forEach(function (sid) { if (seen[sid] && CODES.indexOf(day[sid]) >= 0) { clean[sid] = day[sid]; any = true; } });
        if (any) out.marks[d] = clean;
      });
    }
    return out;
  }

  function newClass(name) { return { id: uid(), name: String(name || t('my_class')).slice(0, 60), sample: false, students: [], marks: {} }; }

  function holidayKind(s) {
    if (meta.off[s]) return 'marked';
    if (meta.on[s] || !meta.sundaysOff) return '';
    var d = parseDate(s);
    if (!d) return '';
    if (d.getDay() === 0) return 'sunday';
    if (NATIONAL.indexOf(s.slice(5)) >= 0) return 'national';
    return '';
  }
  function setHoliday(s, makeOff) {
    if (makeOff) { delete meta.on[s]; if (!holidayKind(s)) meta.off[s] = 1; }
    else { delete meta.off[s]; if (holidayKind(s)) meta.on[s] = 1; }
    saveMeta();
  }

  function makeSample() {
    var cls = newClass(t('sample_class'));
    cls.sample = true;
    list('sample_names').forEach(function (n, i) { if (n) cls.students.push({ id: uid(), roll: String(i + 1), name: n }); });
    var seed = 20261;
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    var now = new Date(), today = todayStr();
    var d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    for (; ymd(d) <= today; d.setDate(d.getDate() + 1)) {
      var s = ymd(d);
      if (holidayKind(s)) continue;
      var day = {};
      cls.students.forEach(function (st, i) {
        var weak = (i === 3 || i === 13) ? 0.3 : (i % 6 === 2 ? 0.1 : 0.035);
        var r = rnd();
        day[st.id] = r < weak ? 'A' : r < weak + 0.04 ? 'T' : r < weak + 0.06 ? 'V' : 'P';
      });
      cls.marks[s] = day;
    }
    return cls;
  }

  /* ---------------- persistence ---------------- */
  var dirty = {}, timer = null;
  function saveMeta() { store.set('meta', meta); }
  function touch(id) { dirty[id || meta.active] = 1; if (!timer) timer = setTimeout(flush, 250); }
  function flush() {
    clearTimeout(timer); timer = null;
    Object.keys(dirty).forEach(function (id) { if (classes[id]) store.set('c_' + id, classes[id]); });
    dirty = {};
  }
  window.addEventListener('pagehide', flush);
  window.addEventListener('beforeunload', flush);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(); });

  function addClassObj(c) {
    classes[c.id] = c;
    meta.order.push(c.id);
    meta.active = c.id;
    store.set('c_' + c.id, c);
    saveMeta();
  }
  function removeClass(id) {
    delete classes[id];
    store.remove('c_' + id);
    meta.order = meta.order.filter(function (x) { return x !== id; });
    if (!meta.order.length) { addClassObj(newClass(t('my_class'))); return; }
    if (meta.active === id) meta.active = meta.order[0];
    saveMeta();
  }

  function load() {
    meta = defaultsMeta(store.get('meta', null));
    meta.order.forEach(function (id) { var c = sanitizeClass(store.get('c_' + id, null)); if (c) classes[c.id] = c; });
    meta.order = meta.order.filter(function (id, i, a) { return classes[id] && a.indexOf(id) === i; });
    if (!meta.order.length) addClassObj(makeSample());
    if (!classes[meta.active]) meta.active = meta.order[0];
    saveMeta();
  }

  function cur() { return classes[meta.active]; }
  function rollKey(r) { var n = parseFloat(r); return isNaN(n) ? Infinity : n; }
  function sorted(cls) {
    return cls.students.slice().sort(function (a, b) {
      var x = rollKey(a.roll), y = rollKey(b.roll);
      if (x !== y) return x < y ? -1 : 1;
      if (a.roll !== b.roll) return a.roll < b.roll ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }
  function matches(stu, q) {
    if (!q) return true;
    q = q.toLowerCase();
    return stu.name.toLowerCase().indexOf(q) >= 0 || String(stu.roll).toLowerCase() === q || String(stu.roll).toLowerCase().indexOf(q) === 0;
  }
  function stName(code) { return t(code ? 'st_' + code : 'st_none'); }
  function stShort(code) { return code ? t('sh_' + code) : ''; }

  /* ---------------- top bar + tabs ---------------- */
  function renderBar() {
    var sel = $('#class-sel');
    sel.innerHTML = '';
    meta.order.forEach(function (id) {
      var c = classes[id];
      sel.appendChild(EDU.el('option', { value: id, text: c.name + ' (' + EDU.fmt(c.students.length) + ')' }));
    });
    sel.value = meta.active;
  }
  function setTab(tab) {
    meta.tab = tab; saveMeta();
    $$('.tabs [role="tab"]').forEach(function (b) {
      var on = b.getAttribute('data-tab') === tab;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    ['day', 'month', 'students'].forEach(function (k) { $('#p-' + k).classList.toggle('off', k !== tab); });
    renderTab();
  }
  function renderTab() {
    if (meta.tab === 'day') renderDay();
    else if (meta.tab === 'month') renderMonth();
    else renderStudents();
  }
  function renderAll() { renderBar(); renderTab(); }

  /* ---------------- daily view ---------------- */
  function dayMarks(create) {
    var cls = cur();
    if (!cls.marks[ui.date] && create) cls.marks[ui.date] = {};
    return cls.marks[ui.date] || {};
  }
  function renderDay() {
    var cls = cur(), s = ui.date, today = todayStr();
    $('#day-date').value = s;
    $('#day-long').textContent = longDate(s) + (s === today ? ' · ' + t('today') : '');
    var hk = holidayKind(s);
    $('#sample-note').hidden = !cls.sample;
    $('#day-future').hidden = !(s > today);
    $('#day-holiday').hidden = !hk;
    if (hk) $('#day-holiday-txt').textContent = t(hk === 'sunday' ? 'holiday_sunday' : hk === 'national' ? 'holiday_national' : 'holiday_marked');
    $('#day-empty').hidden = !!hk || cls.students.length > 0;
    $('#day-work').hidden = !!hk || !cls.students.length;
    $('#day-search').value = ui.q;
    if (hk || !cls.students.length) return;
    var marks = dayMarks(false), html = '';
    sorted(cls).forEach(function (stu) {
      var code = marks[stu.id] || '';
      html += '<button type="button" class="stu" data-sid="' + esc(stu.id) + '" data-st="' + code + '"' +
        (matches(stu, ui.q) ? '' : ' hidden') + '>' +
        '<span class="stu-roll">' + esc(stu.roll) + '</span><span class="stu-name no-i18n">' + esc(stu.name) + '</span>' +
        '<span class="sr-only stu-st">' + esc(stName(code)) + '</span>' +
        '<span class="stu-mark" aria-hidden="true">' + esc(stShort(code)) + '</span></button>';
    });
    $('#day-grid').innerHTML = html;
    updateDaySummary();
    updateNoMatch();
  }
  function counts(cls, marks) {
    var c = { P: 0, A: 0, T: 0, V: 0, none: 0 };
    cls.students.forEach(function (stu) { var v = marks[stu.id]; if (v && c[v] !== undefined) c[v]++; else c.none++; });
    return c;
  }
  function updateDaySummary() {
    var cls = cur(), c = counts(cls, dayMarks(false));
    var html = '';
    CODES.forEach(function (k) {
      html += '<span class="sum-chip st-' + k + '"><b id="sum-' + k + '">' + EDU.fmt(c[k]) + '</b> ' + esc(t('st_' + k)) + '</span>';
    });
    html += '<span class="sum-chip"><b id="sum-none">' + EDU.fmt(c.none) + '</b> ' + esc(t('st_none')) + '</span>';
    $('#day-sum').innerHTML = html;
  }
  function updateNoMatch() {
    var any = $$('#day-grid .stu').some(function (b) { return !b.hidden; });
    var nm = $('#day-nomatch');
    nm.hidden = any || !ui.q;
    if (!nm.hidden) nm.textContent = t('no_match', { q: ui.q });
  }
  function setTile(btn, code) {
    btn.setAttribute('data-st', code);
    btn.querySelector('.stu-mark').textContent = stShort(code);
    btn.querySelector('.stu-st').textContent = stName(code);
  }
  function setMark(cls, date, sid, code) {
    if (!cls.marks[date]) cls.marks[date] = {};
    if (code) cls.marks[date][sid] = code; else delete cls.marks[date][sid];
    if (!Object.keys(cls.marks[date]).length) delete cls.marks[date];
    touch(cls.id);
  }

  $('#day-grid').addEventListener('click', function (e) {
    var btn = e.target.closest('.stu'); if (!btn) return;
    var sid = btn.getAttribute('data-sid'), code = NEXT[btn.getAttribute('data-st') || ''];
    setMark(cur(), ui.date, sid, code);
    setTile(btn, code);
    updateDaySummary();
  });
  function goDate(s) {
    if (!parseDate(s)) return;
    ui.date = s;
    var d = parseDate(s);
    ui.ym = [d.getFullYear(), d.getMonth()];
    renderDay();
  }
  $('#day-date').addEventListener('change', function () { if (parseDate(this.value)) goDate(this.value); });
  $('#day-prev').addEventListener('click', function () { goDate(addDays(ui.date, -1)); });
  $('#day-next').addEventListener('click', function () { goDate(addDays(ui.date, 1)); });
  $('#day-today').addEventListener('click', function () { goDate(todayStr()); });
  $('#day-unholiday').addEventListener('click', function () { setHoliday(ui.date, false); renderDay(); });
  $('#day-make-holiday').addEventListener('click', function () { setHoliday(ui.date, true); renderDay(); });
  $('#day-go-students').addEventListener('click', function () { setTab('students'); var p = $('#paste-box'); if (p) p.focus(); });
  $('#all-present').addEventListener('click', function () {
    var cls = cur(), marks = dayMarks(true), n = 0;
    cls.students.forEach(function (stu) { if (!marks[stu.id]) { marks[stu.id] = 'P'; n++; } });
    if (!Object.keys(marks).length) delete cls.marks[ui.date];
    touch(cls.id);
    renderDay();
    EDU.toast(n ? t('marked_present', { n: EDU.fmt(n) }) : t('all_marked'));
  });
  $('#clear-day').addEventListener('click', function () {
    var cls = cur();
    if (!cls.marks[ui.date]) return;
    if (!confirm(t('confirm_clear_day', { date: longDate(ui.date) }))) return;
    delete cls.marks[ui.date];
    touch(cls.id);
    renderDay();
  });
  $('#copy-absent').addEventListener('click', function () {
    var cls = cur(), marks = dayMarks(false);
    var abs = sorted(cls).filter(function (s) { return marks[s.id] === 'A'; });
    if (!abs.length) { EDU.toast(t('none_absent')); return; }
    var txt = t('absent_text', {
      cls: cls.name, date: longDate(ui.date), n: EDU.fmt(abs.length),
      list: abs.map(function (s) { return (s.roll ? s.roll + ' ' : '') + s.name; }).join(', ')
    });
    EDU.copy(txt);
  });
  function onSearch(v) {
    ui.q = String(v || '').trim();
    if (meta.tab === 'day') {
      var cls = cur(), byId = {};
      cls.students.forEach(function (s) { byId[s.id] = s; });
      $$('#day-grid .stu').forEach(function (b) { var s = byId[b.getAttribute('data-sid')]; b.hidden = !(s && matches(s, ui.q)); });
      updateNoMatch();
    } else if (meta.tab === 'month') {
      filterMonthRows();
    }
  }
  $('#day-search').addEventListener('input', function () { onSearch(this.value); });

  /* ---------------- monthly view ---------------- */
  function fmtPct(p) { return p === null || p === undefined ? '–' : EDU.fmt(p, { maximumFractionDigits: 1 }) + '%'; }

  function monthStats(cls, y, m) {
    var n = daysIn(y, m), dates = [], hol = [], taken = [], ids = {};
    cls.students.forEach(function (s) { ids[s.id] = 1; });
    for (var d = 1; d <= n; d++) {
      var s = dateOf(y, m, d), h = !!holidayKind(s), mk = cls.marks[s], any = false;
      if (mk && !h) for (var k in mk) if (ids[k]) { any = true; break; }
      dates.push(s); hol.push(h); taken.push(any);
    }
    var rows = sorted(cls).map(function (stu) {
      var c = { P: 0, A: 0, T: 0, V: 0 }, days = 0;
      dates.forEach(function (s, i) {
        if (hol[i]) return;
        var v = cls.marks[s] && cls.marks[s][stu.id];
        if (v && c[v] !== undefined) { c[v]++; days++; }
      });
      var pres = c.P + c.T + (meta.leaveCounts ? c.V : 0);
      var pct = days ? Math.round(pres * 1000 / days) / 10 : null;
      return { stu: stu, c: c, days: days, pct: pct, low: pct !== null && pct < meta.minPct };
    });
    var withPct = rows.filter(function (r) { return r.pct !== null; });
    var avg = withPct.length ? Math.round(withPct.reduce(function (a, r) { return a + r.pct; }, 0) * 10 / withPct.length) / 10 : null;
    var perDay = dates.map(function (s, i) {
      if (!taken[i]) return null;
      var k = 0;
      cls.students.forEach(function (st) { var v = cls.marks[s][st.id]; if (v === 'P' || v === 'T') k++; });
      return k;
    });
    return { n: n, dates: dates, hol: hol, taken: taken, rows: rows, perDay: perDay, avg: avg,
      workDays: taken.filter(Boolean).length, below: rows.filter(function (r) { return r.low; }).length };
  }

  function renderMonth() {
    var cls = cur(), y = ui.ym[0], m = ui.ym[1], S = monthStats(cls, y, m), today = todayStr();
    $('#m-label').textContent = monthLabel(y, m);
    $('#opt-sun').checked = meta.sundaysOff;
    $('#opt-leave').checked = meta.leaveCounts;
    if (document.activeElement !== $('#opt-min')) $('#opt-min').value = meta.minPct;
    $('#m-search').value = ui.q;
    $('#m-days').textContent = EDU.fmt(S.workDays);
    $('#m-avg').textContent = fmtPct(S.avg);
    $('#m-below-l').textContent = t('stat_below', { p: EDU.fmt(meta.minPct) });
    $('#m-below').textContent = EDU.fmt(S.below);
    $('#m-below').classList.toggle('bad', S.below > 0);
    $('#ph-school').textContent = meta.school;
    $('#ph-meta').textContent = t('print_meta', { cls: cls.name, month: monthLabel(y, m) });
    $('#ph-date').textContent = t('printed_on', { date: longDate(today) });

    var wd = list('wd_min');
    var h = '<thead><tr><th class="nm" scope="col"><span class="rl">' + esc(t('col_roll')) + '</span>' + esc(t('col_name')) + '</th>';
    S.dates.forEach(function (s, i) {
      var d = parseDate(s), cl = (S.hol[i] ? 'hol' : '') + (s === today ? ' today' : '');
      h += '<th scope="col"' + (cl.trim() ? ' class="' + cl.trim() + '"' : '') + '><button type="button" class="dh" data-date="' + s + '" aria-label="' +
        esc(longDate(s) + (S.hol[i] ? ' · ' + t('holiday') : '') + ' · ' + t(S.hol[i] ? 'take_anyway' : 'make_holiday')) + '">' + (i + 1) +
        '<small>' + esc(S.hol[i] ? t('sh_H') : wd[d.getDay()]) + '</small></button></th>';
    });
    CODES.forEach(function (k) { h += '<th scope="col" class="tot" title="' + esc(t('st_' + k)) + '">' + esc(t('sh_' + k)) + '</th>'; });
    h += '<th scope="col" class="tot">' + esc(t('col_days')) + '</th><th scope="col" class="tot pct">' + esc(t('col_pct')) + '</th></tr></thead><tbody>';
    S.rows.forEach(function (r) {
      h += '<tr data-sid="' + esc(r.stu.id) + '"' + (r.low ? ' class="low"' : '') + (matches(r.stu, ui.q) ? '' : ' hidden') + '>' +
        '<th scope="row" class="nm"><span class="rl">' + esc(r.stu.roll) + '</span><span class="no-i18n">' + esc(r.stu.name) + '</span></th>';
      S.dates.forEach(function (s, i) {
        var v = (cls.marks[s] && cls.marks[s][r.stu.id]) || '';
        if (S.hol[i]) h += '<td class="hol">' + (v ? '<span class="ghost">' + esc(stShort(v)) + '</span>' : '') + '</td>';
        else h += '<td' + (s > today ? ' class="fut"' : '') + '><button type="button" class="mc' + (v ? ' ' + v : '') + '" data-i="' + i +
          '" aria-label="' + esc((i + 1) + ' · ' + stName(v)) + '">' + esc(stShort(v)) + '</button></td>';
      });
      CODES.forEach(function (k) { h += '<td class="tot">' + EDU.fmt(r.c[k]) + '</td>'; });
      h += '<td class="tot">' + EDU.fmt(r.days) + '</td><td class="tot pct' + (r.low ? ' low' : '') + '">' + fmtPct(r.pct) + '</td></tr>';
    });
    h += '</tbody><tfoot><tr><th scope="row" class="nm">' + esc(t('day_present')) + '</th>';
    S.perDay.forEach(function (v, i) { h += '<td class="tot' + (S.hol[i] ? ' hol' : '') + '">' + (v === null ? '' : EDU.fmt(v)) + '</td>'; });
    var sum = { P: 0, A: 0, T: 0, V: 0 }, dsum = 0;
    S.rows.forEach(function (r) { CODES.forEach(function (k) { sum[k] += r.c[k]; }); dsum += r.days; });
    CODES.forEach(function (k) { h += '<td class="tot">' + EDU.fmt(sum[k]) + '</td>'; });
    h += '<td class="tot">' + EDU.fmt(dsum) + '</td><td class="tot pct">' + fmtPct(S.avg) + '</td></tr></tfoot>';
    $('#month-table').innerHTML = h;

    var lg = '';
    CODES.forEach(function (k) { lg += '<span class="lg"><b class="' + k + '">' + esc(t('sh_' + k)) + '</b>' + esc(t('st_' + k)) + '</span>'; });
    lg += '<span class="lg"><b class="H">' + esc(t('sh_H')) + '</b>' + esc(t('holiday')) + '</span>';
    lg += '<span class="muted small">' + esc(t('late_note')) + (meta.leaveCounts ? ' ' + esc(t('leave_counts')) + '.' : '') + '</span>';
    $('#m-legend').innerHTML = lg;
  }

  function filterMonthRows() {
    var cls = cur(), byId = {};
    cls.students.forEach(function (s) { byId[s.id] = s; });
    $$('#month-table tbody tr').forEach(function (tr) { var s = byId[tr.getAttribute('data-sid')]; tr.hidden = !(s && matches(s, ui.q)); });
  }

  $('#month-table').addEventListener('click', function (e) {
    var dh = e.target.closest('.dh');
    if (dh) {
      var ds = dh.getAttribute('data-date');
      setHoliday(ds, !holidayKind(ds));
      renderMonth();
      var b = $('#month-table .dh[data-date="' + ds + '"]'); if (b) b.focus({ preventScroll: true });
      return;
    }
    var mc = e.target.closest('.mc'); if (!mc) return;
    var tr = mc.closest('tr'), sid = tr.getAttribute('data-sid'), i = +mc.getAttribute('data-i');
    var s = dateOf(ui.ym[0], ui.ym[1], i + 1), cls = cur();
    var v = (cls.marks[s] && cls.marks[s][sid]) || '';
    setMark(cls, s, sid, NEXT[v]);
    renderMonth();
    var again = $('#month-table tr[data-sid="' + sid + '"] .mc[data-i="' + i + '"]');
    if (again) again.focus({ preventScroll: true });
  });
  function shiftMonth(k) {
    var y = ui.ym[0], m = ui.ym[1] + k;
    if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }
    ui.ym = [y, m];
    renderMonth();
  }
  $('#m-prev').addEventListener('click', function () { shiftMonth(-1); });
  $('#m-next').addEventListener('click', function () { shiftMonth(1); });
  $('#opt-sun').addEventListener('change', function () { meta.sundaysOff = this.checked; saveMeta(); renderMonth(); });
  $('#opt-leave').addEventListener('change', function () { meta.leaveCounts = this.checked; saveMeta(); renderMonth(); });
  $('#opt-min').addEventListener('change', function () {
    var v = Math.round(+this.value);
    meta.minPct = Number.isFinite(v) && v >= 1 ? Math.min(100, v) : 75;
    this.value = meta.minPct;
    saveMeta(); renderMonth();
  });
  $('#m-search').addEventListener('input', function () { onSearch(this.value); });

  function safeName(s) { return String(s).replace(/[\\/:*?"<>|\s·]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'class'; }
  $('#export-csv').addEventListener('click', function () {
    flush();
    var cls = cur(), y = ui.ym[0], m = ui.ym[1], S = monthStats(cls, y, m);
    var head = [t('col_roll'), t('col_name')];
    S.dates.forEach(function (s, i) { head.push(String(i + 1)); });
    CODES.forEach(function (k) { head.push(t('st_' + k)); });
    head.push(t('col_days'), t('col_pct'));
    var rows = [head];
    S.rows.forEach(function (r) {
      var row = [r.stu.roll, r.stu.name];
      S.dates.forEach(function (s, i) {
        var v = (cls.marks[s] && cls.marks[s][r.stu.id]) || '';
        row.push(S.hol[i] ? t('sh_H') : stShort(v));
      });
      CODES.forEach(function (k) { row.push(r.c[k]); });
      row.push(r.days, r.pct === null ? '' : r.pct);
      rows.push(row);
    });
    var foot = ['', t('day_present')];
    S.perDay.forEach(function (v) { foot.push(v === null ? '' : v); });
    rows.push(foot);
    EDU.download('attendance-' + safeName(cls.name) + '-' + y + '-' + pad(m + 1) + '.csv', EDU.csv.stringify(rows), 'text/csv');
  });
  $('#print-btn').addEventListener('click', function () { flush(); renderMonth(); setTimeout(function () { window.print(); }, 60); });
  window.addEventListener('beforeprint', function () { try { renderMonth(); } catch (e) { } });

  /* ---------------- students ---------------- */
  function nextRoll(cls) {
    var mx = 0;
    cls.students.forEach(function (s) { var n = parseInt(s.roll, 10); if (!isNaN(n) && n > mx) mx = n; });
    return String(mx + 1);
  }
  function findStu(cls, sid) { return cls.students.filter(function (s) { return s.id === sid; })[0]; }

  function renderStudents() {
    var cls = cur();
    if (document.activeElement !== $('#cls-name')) $('#cls-name').value = cls.name;
    if (document.activeElement !== $('#school')) $('#school').value = meta.school;
    $('#stu-count').textContent = t('students_n', { n: EDU.fmt(cls.students.length) });
    $('#one-roll').placeholder = nextRoll(cls);
    var seen = {}, dups = [];
    cls.students.forEach(function (s) { if (!s.roll) return; if (seen[s.roll] === 1) dups.push(s.roll); seen[s.roll] = (seen[s.roll] || 0) + 1; });
    var dw = $('#dup-warn');
    dw.hidden = !dups.length;
    dw.textContent = dups.length ? t('dup_rolls', { list: dups.join(', ') }) : '';
    var html = '';
    sorted(cls).forEach(function (s) {
      var rm = esc(t('remove_student', { name: s.name }));
      html += '<div class="srow" data-sid="' + esc(s.id) + '">' +
        '<input type="text" class="r no-i18n" value="' + esc(s.roll) + '" maxlength="8" inputmode="numeric" aria-label="' + esc(t('col_roll')) + '">' +
        '<input type="text" class="nm no-i18n" value="' + esc(s.name) + '" maxlength="80" aria-label="' + esc(t('col_name')) + '">' +
        '<button type="button" class="btn del" aria-label="' + rm + '" title="' + rm + '">✕</button></div>';
    });
    $('#stu-list').innerHTML = html;
  }

  function studentsChanged(cls) { touch(cls.id); renderBar(); renderStudents(); }

  $('#stu-list').addEventListener('change', function (e) {
    var row = e.target.closest('.srow'); if (!row) return;
    var cls = cur(), stu = findStu(cls, row.getAttribute('data-sid')); if (!stu) return;
    if (e.target.classList.contains('r')) {
      stu.roll = e.target.value.trim().slice(0, 8);
      studentsChanged(cls);
    } else if (e.target.classList.contains('nm')) {
      var v = e.target.value.trim().slice(0, 80);
      if (!v) { e.target.value = stu.name; EDU.toast(t('need_name')); return; }
      stu.name = v;
      touch(cls.id);
      var del = row.querySelector('.del'), rm = t('remove_student', { name: v });
      del.setAttribute('aria-label', rm); del.title = rm;
    }
  });
  $('#stu-list').addEventListener('click', function (e) {
    var del = e.target.closest('.del'); if (!del) return;
    var cls = cur(), sid = del.closest('.srow').getAttribute('data-sid'), stu = findStu(cls, sid);
    if (!stu || !confirm(t('confirm_remove', { name: stu.name }))) return;
    cls.students = cls.students.filter(function (s) { return s.id !== sid; });
    Object.keys(cls.marks).forEach(function (d) {
      delete cls.marks[d][sid];
      if (!Object.keys(cls.marks[d]).length) delete cls.marks[d];
    });
    studentsChanged(cls);
  });
  $('#one-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var cls = cur(), name = $('#one-name').value.trim().slice(0, 80);
    if (!name) { EDU.toast(t('need_name')); $('#one-name').focus(); return; }
    var roll = $('#one-roll').value.trim().slice(0, 8) || nextRoll(cls);
    cls.students.push({ id: uid(), roll: roll, name: name });
    $('#one-name').value = ''; $('#one-roll').value = '';
    studentsChanged(cls);
    $('#one-name').focus();
  });

  /* Parse rows of cells into [{roll, name}]. Handles "12, Priya", "12 Priya", "Priya<TAB>12", name-only lines and a header row. */
  var IS_ROLL = /^\d{1,6}[A-Za-z]?$/;
  function parseRows(rows) {
    var out = [], first = true;
    rows.forEach(function (cells) {
      cells = (cells || []).map(function (c) { return String(c == null ? '' : c).replace(/^["']+|["']+$/g, '').trim(); }).filter(Boolean);
      if (!cells.length) return;
      var roll = '', name = '';
      if (cells.length === 1) {
        var mm = /^(\d{1,6}[A-Za-z]?)[\s.,;:)\]\-–]+(.+)$/.exec(cells[0]);
        if (mm) { roll = mm[1]; name = mm[2].trim(); } else name = cells[0];
      } else {
        var ri = -1, ni = -1;
        cells.forEach(function (c, i) { if (ri < 0 && IS_ROLL.test(c)) ri = i; else if (ni < 0 && !IS_ROLL.test(c)) ni = i; });
        if (ri < 0 && first) { first = false; return; } /* header row like "Roll, Name" */
        roll = ri >= 0 ? cells[ri] : '';
        name = ni >= 0 ? cells[ni] : '';
      }
      if (first && !roll && /^(names?|student|students|student name|roll|s\.? ?no\.?)$/i.test(name)) { first = false; return; }
      first = false;
      name = name.replace(/\s+/g, ' ').slice(0, 80);
      if (name) out.push({ roll: roll.slice(0, 8), name: name });
    });
    return out.slice(0, 500);
  }
  function addParsed(items) {
    var cls = cur();
    if (!items.length) { EDU.toast(t('nothing_added')); return 0; }
    var n = parseInt(nextRoll(cls), 10);
    items.forEach(function (it) {
      var roll = it.roll;
      if (!roll) { roll = String(n); }
      var num = parseInt(roll, 10);
      if (!isNaN(num) && num >= n) n = num + 1;
      cls.students.push({ id: uid(), roll: roll, name: it.name });
    });
    studentsChanged(cls);
    EDU.toast(t('added_n', { n: EDU.fmt(items.length) }));
    return items.length;
  }
  $('#paste-add').addEventListener('click', function () {
    var txt = $('#paste-box').value;
    var rows = String(txt).split(/\r?\n/).map(function (line) { return line.split(/\t|,|;|\|/); });
    if (addParsed(parseRows(rows))) $('#paste-box').value = '';
  });
  $('#import-csv').addEventListener('click', function () {
    EDU.pickFile('.csv,.txt,text/csv,text/plain').then(function (f) {
      if (!f) return;
      return EDU.readText(f).then(function (txt) { addParsed(parseRows(EDU.csv.parse(txt))); });
    }).catch(function () { EDU.toast(t('nothing_added')); });
  });

  $('#add-class').addEventListener('click', function () {
    var inp = $('#new-class-name'), name = inp.value.trim().slice(0, 60) || t('my_class');
    flush();
    addClassObj(newClass(name));
    inp.value = '';
    renderAll();
    EDU.toast(t('class_added', { name: name }));
  });
  $('#new-class-name').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); $('#add-class').click(); } });
  function saveClassName() {
    var cls = cur(), v = $('#cls-name').value.trim().slice(0, 60);
    if (!v) { $('#cls-name').value = cls.name; return; }
    if (v === cls.name) return;
    cls.name = v; touch(cls.id); renderBar();
    EDU.toast(t('renamed'));
  }
  $('#cls-save').addEventListener('click', saveClassName);
  $('#cls-name').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); saveClassName(); } });
  $('#cls-del').addEventListener('click', function () {
    var cls = cur();
    if (!confirm(t('confirm_delete_class', { name: cls.name }))) return;
    removeClass(cls.id);
    renderAll();
  });
  $('#school').addEventListener('input', function () { meta.school = this.value.slice(0, 100); saveMeta(); });

  /* ---------------- backup / restore / reset ---------------- */
  $('#backup-btn').addEventListener('click', function () {
    flush();
    var payload = { app: SLUG, version: 1, saved: new Date().toISOString(), meta: meta, classes: meta.order.map(function (id) { return classes[id]; }) };
    EDU.download('attendance-backup-' + todayStr() + '.json', JSON.stringify(payload), 'application/json');
  });
  function restoreFrom(obj) {
    if (!obj || obj.app !== SLUG || !Array.isArray(obj.classes)) { EDU.toast(t('restore_bad')); return; }
    var got = obj.classes.map(sanitizeClass).filter(Boolean);
    if (!got.length) { EDU.toast(t('restore_bad')); return; }
    if (!confirm(t('confirm_restore'))) return;
    meta.order.forEach(function (id) { store.remove('c_' + id); });
    classes = {}; dirty = {};
    var tab = meta.tab;
    meta = defaultsMeta(obj.meta);
    meta.order = []; meta.tab = tab;
    got.forEach(function (c) {
      if (classes[c.id]) c.id = uid();
      classes[c.id] = c; meta.order.push(c.id); store.set('c_' + c.id, c);
    });
    if (!classes[meta.active]) meta.active = meta.order[0];
    saveMeta();
    renderAll();
    EDU.toast(t('restore_ok', { n: EDU.fmt(got.length) }));
  }
  $('#restore-btn').addEventListener('click', function () {
    EDU.pickFile('.json,application/json').then(function (f) {
      if (!f) return;
      return EDU.readText(f).then(function (txt) {
        var obj = null;
        try { obj = JSON.parse(String(txt).replace(/^﻿/, '')); } catch (e) { obj = null; }
        restoreFrom(obj);
      });
    }).catch(function () { EDU.toast(t('restore_bad')); });
  });
  $('#reset-btn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    meta.order.forEach(function (id) { store.remove('c_' + id); });
    classes = {}; dirty = {};
    var tab = meta.tab;
    meta = defaultsMeta(null); meta.tab = tab;
    addClassObj(newClass(t('my_class')));
    renderAll();
  });

  /* ---------------- wiring ---------------- */
  $('#class-sel').addEventListener('change', function () {
    flush();
    if (classes[this.value]) { meta.active = this.value; saveMeta(); }
    renderTab();
  });
  $('#fs-btn').addEventListener('click', function () { EDU.fullscreen(); });
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

  load();
  (function () { var d = parseDate(ui.date); ui.ym = [d.getFullYear(), d.getMonth()]; })();
  EDU.onLang(renderAll);
  renderBar();
  setTab(meta.tab);
})();
