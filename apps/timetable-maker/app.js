/* Timetable Maker: weekly class / study timetables.
   Paint, swap or choose subjects for periods, see teacher clashes across classes,
   today's period, a weekly summary, and print (landscape, colours), CSV and copy as text.
   Everything is saved with EDU.store on this device. */
(function () {
  'use strict';
  var SLUG = 'timetable-maker';
  var store = EDU.store(SLUG);
  EDU.init({ slug: SLUG, title: 'app_title', wide: true });

  var $ = EDU.$, $$ = EDU.$$, el = EDU.el, t = EDU.t;
  var ERASE = '__erase';
  var COLORS = ['#e03131', '#1971c2', '#2f9e44', '#f08c00', '#7048e8', '#0c8599', '#d6336c', '#5c940d', '#9c36b5', '#e8590c', '#1098ad', '#868e96', '#b08900', '#364fc7'];
  var SCHOOL_KEYS = ['eng', 'l2', 'mat', 'sci', 'sst', 'l3', 'cmp', 'art', 'pe', 'lib'];   // l2 = state language, l3 = third language
  var STUDY_KEYS = ['hw', 'mat', 'sci', 'eng', 'l2', 'sst', 'rev', 'read', 'hobby'];
  var ALL_KEYS = SCHOOL_KEYS.concat(['hw', 'rev', 'read', 'hobby']);
  var SK_COLOR = { eng: '#1971c2', l2: '#e8590c', mat: '#e03131', sci: '#2f9e44', sst: '#b08900', l3: '#9c36b5', cmp: '#0c8599', art: '#d6336c', pe: '#5c940d', lib: '#868e96', hw: '#7048e8', rev: '#1098ad', read: '#c2255c', hobby: '#5c940d' };
  var SK_WANT = { eng: 7, l2: 6, mat: 8, sci: 7, sst: 7, l3: 4, cmp: 3, art: 2, pe: 3, lib: 1 };
  var BRK = ['short', 'lunch', 'assembly', 'rest', 'play', 'meal'];
  var LETTER = { M: 'mat', E: 'eng', S: 'sci', H: 'l2', G: 'sst', K: 'l3', C: 'cmp', A: 'art', P: 'pe', L: 'lib' };
  /* Class 7-A sample week (Mon..Sat, periods 1-8). Class 8-A swaps neighbouring periods,
     so the shared teachers never clash. Periods/week: Maths 8, Sci 7, Eng 7, Hin 6, SSt 7, Skt 4, Comp 3, Art 2, PE 3, Lib 1. */
  var SAMPLE_A = ['MESHGKCP', 'EMHSGMKA', 'SMEGHSCP', 'HEMSGKEL', 'MSEHGKMA', 'EHMGSGCP'];
  var STUDY_GRID = [
    ['hw', 'mat', 'sci', 'read'], ['hw', 'eng', 'mat', 'rev'], ['hw', 'sci', 'sst', 'read'], ['hw', 'mat', 'l2', 'rev'],
    ['hw', 'sst', 'eng', 'read'], ['mat', 'sci', 'l2', 'hobby'], ['rev', 'mat', 'hobby', 'read']
  ];
  var MAX_SLOTS = 20, MAX_SUBJ = 40, MAX_TT = 60;

  /* ------------------------------------------------------------ small helpers */
  function uid() { return Math.random().toString(36).slice(2, 7) + (Date.now() % 1e7).toString(36); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function toMin(v) {
    var m = /^(\d{1,2}):(\d{2})/.exec(String(v || ''));
    if (!m) return null;
    var h = +m[1], mi = +m[2];
    if (h > 23 || mi > 59) return null;
    return h * 60 + mi;
  }
  function fromMin(n) { n = ((Math.round(n) % 1440) + 1440) % 1440; return pad(Math.floor(n / 60)) + ':' + pad(n % 60); }
  function str(v, max) { return typeof v === 'string' ? v.slice(0, max || 80) : ''; }
  function C() { var A = window.APP_CONTENT || {}; return A[EDU.lang] || A.en || {}; }
  function graphemes(s) {
    try { if (window.Intl && Intl.Segmenter) return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s), function (x) { return x.segment; }); } catch (e) { }
    return Array.from(s);
  }
  function listOf(key) { var a = String(t(key)).split(/\s*[,،]\s*/); while (a.length < 7) a.push('?'); return a; }
  function dayName(d, short) { return listOf(short ? 'days_short' : 'days_full')[d] || '?'; }
  function hm(min) {
    min = Math.max(0, Math.round(min));
    var h = Math.floor(min / 60), m = min % 60;
    if (!h) return t('mins', { n: EDU.fmt(m) });
    return m ? t('hm', { h: EDU.fmt(h), m: EDU.fmt(m) }) : t('hours', { h: EDU.fmt(h) });
  }
  function fmtTime(v) {
    var n = toMin(v);
    if (n == null) return '–';
    var h = Math.floor(n / 60), m = n % 60;
    if (ui.h24) return pad(h) + ':' + pad(m);
    h = h % 12; if (h === 0) h = 12;
    return h + ':' + pad(m);
  }
  /* In Urdu (RTL) a bare "10:00–10:15" is reordered to "10:15–10:00"; a left-to-right isolate keeps it readable. */
  function fmtRange(sl) {
    var r = fmtTime(sl.s) + '–' + fmtTime(sl.e);
    return EDU.langInfo(EDU.lang).dir === 'rtl' ? '\u2066' + r + '\u2069' : r;
  }
  function dur(sl) { var a = toMin(sl.s), b = toMin(sl.e); return a == null || b == null || b <= a ? 0 : b - a; }
  function norm(name) {
    return String(name || '').toLowerCase().replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim()
      .replace(/^(mr|mrs|ms|miss|dr|shri|smt|sir|madam) /, '');
  }
  var live;
  function announce(msg) { if (!live) live = $('#live'); if (live) { live.textContent = ''; setTimeout(function () { live.textContent = msg; }, 30); } }

  /* ------------------------------------------------------------ sample data */
  function P(id, s, e) { return { id: id, t: 'p', s: s, e: e, label: '', lk: null }; }
  function B(id, lk, s, e) { return { id: id, t: 'b', s: s, e: e, label: '', lk: lk }; }
  function defaultSlots() {
    return [P('p1', '08:00', '08:40'), P('p2', '08:40', '09:20'), P('p3', '09:20', '10:00'), B('b1', 'short', '10:00', '10:15'),
      P('p4', '10:15', '10:55'), P('p5', '10:55', '11:35'), B('b2', 'lunch', '11:35', '12:05'),
      P('p6', '12:05', '12:45'), P('p7', '12:45', '13:25'), P('p8', '13:25', '14:05')];
  }
  function schoolSubjects(withTeachers) {
    return SCHOOL_KEYS.map(function (k) { return { id: k, name: '', sk: k, short: '', teacher: '', tk: withTeachers ? k : null, color: SK_COLOR[k], want: SK_WANT[k] }; });
  }
  function blankClass(name) {
    return { id: uid(), name: name || '', nk: null, kind: 'class', ct: '', ctk: null, days: [true, true, true, true, true, true, false], slots: defaultSlots(), subjects: schoolSubjects(false), cells: {} };
  }
  function sampleClass(nk, rows, ctk) {
    var tt = blankClass('');
    tt.nk = nk; tt.ctk = ctk; tt.subjects = schoolSubjects(true);
    rows.forEach(function (row, d) { row.split('').forEach(function (ch, i) { tt.cells[d + '|p' + (i + 1)] = LETTER[ch]; }); });
    return tt;
  }
  function swapPairs(row) { var o = ''; for (var i = 0; i < row.length; i += 2) o += row[i + 1] + row[i]; return o; }
  function studyTT(name) {
    var tt = {
      id: uid(), name: name || '', nk: name ? null : 'study', kind: 'study', ct: '', ctk: null, days: [true, true, true, true, true, true, true],
      slots: [B('b1', 'rest', '16:00', '16:30'), P('p1', '16:30', '17:15'), B('b2', 'short', '17:15', '17:30'), P('p2', '17:30', '18:15'),
        B('b3', 'play', '18:15', '19:00'), P('p3', '19:00', '19:45'), B('b4', 'meal', '19:45', '20:30'), P('p4', '20:30', '21:00')],
      subjects: STUDY_KEYS.map(function (k) { return { id: k, name: '', sk: k, short: '', teacher: '', tk: null, color: SK_COLOR[k], want: 0 }; }),
      cells: {}
    };
    STUDY_GRID.forEach(function (row, d) { row.forEach(function (k, i) { tt.cells[d + '|p' + (i + 1)] = k; }); });
    var cnt = counts(tt);
    tt.subjects.forEach(function (s) { s.want = cnt[s.id] || 0; });
    return tt;
  }
  function sampleData() {
    var a = sampleClass('c0', SAMPLE_A, 'eng'), b = sampleClass('c1', SAMPLE_A.map(swapPairs), 'mat');
    return { v: 1, school: '', cur: a.id, tts: [a, b] };
  }

  /* ------------------------------------------------------------ load / validate */
  function sanitize(d) {
    if (!d || typeof d !== 'object' || !Array.isArray(d.tts)) return null;
    var out = { v: 1, school: str(d.school, 160), cur: '', tts: [] }, seen = {};
    d.tts.slice(0, MAX_TT).forEach(function (x) {
      if (!x || typeof x !== 'object') return;
      var id = str(x.id, 40);
      if (!id || seen[id]) id = uid();
      seen[id] = 1;
      var tt = {
        id: id, name: str(x.name), nk: ['c0', 'c1', 'study'].indexOf(x.nk) >= 0 ? x.nk : null,
        kind: x.kind === 'study' ? 'study' : 'class', ct: str(x.ct), ctk: ALL_KEYS.indexOf(x.ctk) >= 0 ? x.ctk : null,
        days: [0, 1, 2, 3, 4, 5, 6].map(function (i) { return Array.isArray(x.days) ? !!x.days[i] : i < 6; }),
        slots: [], subjects: [], cells: {}
      };
      var sids = {};
      (Array.isArray(x.slots) ? x.slots : []).slice(0, MAX_SLOTS).forEach(function (s) {
        if (!s || typeof s !== 'object') return;
        var sid = str(s.id, 40);
        if (!sid || sids[sid] || sid.indexOf('|') >= 0) sid = uid();
        sids[sid] = 1;
        var a = toMin(s.s), b = toMin(s.e);
        tt.slots.push({ id: sid, t: s.t === 'b' ? 'b' : 'p', s: a == null ? '08:00' : fromMin(a), e: b == null ? '08:40' : fromMin(b), label: str(s.label, 40), lk: BRK.indexOf(s.lk) >= 0 ? s.lk : null });
      });
      var subs = {};
      (Array.isArray(x.subjects) ? x.subjects : []).slice(0, MAX_SUBJ).forEach(function (s, i) {
        if (!s || typeof s !== 'object') return;
        var sid = str(s.id, 40);
        if (!sid || subs[sid] || sid === ERASE) sid = uid();
        subs[sid] = 1;
        var w = parseInt(s.want, 10);
        tt.subjects.push({
          id: sid, name: str(s.name, 60), sk: ALL_KEYS.indexOf(s.sk) >= 0 ? s.sk : null, short: str(s.short, 12), teacher: str(s.teacher, 60),
          tk: ALL_KEYS.indexOf(s.tk) >= 0 ? s.tk : null, color: /^#[0-9a-f]{6}$/i.test(s.color || '') ? s.color : COLORS[i % COLORS.length],
          want: isFinite(w) ? EDU.clamp(w, 0, 60) : 0
        });
      });
      if (x.cells && typeof x.cells === 'object') {
        Object.keys(x.cells).forEach(function (k) {
          var m = /^([0-6])\|(.+)$/.exec(k);
          if (m && sids[m[2]] && subs[x.cells[k]]) tt.cells[k] = x.cells[k];
        });
      }
      if (!tt.days.some(Boolean)) tt.days[0] = true;
      out.tts.push(tt);
    });
    if (!out.tts.length) return null;
    out.cur = out.tts.some(function (tt) { return tt.id === d.cur; }) ? d.cur : out.tts[0].id;
    return out;
  }

  var data = sanitize(store.get('data', null)) || sampleData();
  var ui = Object.assign({ tab: 'grid', mode: 'paint', brush: null, layout: 'auto', h24: false, showT: true, teacher: '', note: true }, store.get('ui', {}) || {});
  var undoStack = [], swapSel = null, todayDay = null, clashCache = null;

  function saveUi() { store.set('ui', ui); }
  function save() {
    clashCache = null;
    if (!store.set('data', data) && !save.warned) { save.warned = true; EDU.toast(t('save_fail')); }
  }

  /* ------------------------------------------------------------ model helpers */
  function cur() {
    for (var i = 0; i < data.tts.length; i++) if (data.tts[i].id === data.cur) return data.tts[i];
    data.cur = data.tts[0].id;
    return data.tts[0];
  }
  function ttById(id) { for (var i = 0; i < data.tts.length; i++) if (data.tts[i].id === id) return data.tts[i]; return null; }
  function ttName(tt) {
    if (tt.name) return tt.name;
    var c = C();
    if (tt.nk === 'study') return c.study_name || t('untitled');
    if (tt.nk === 'c0' || tt.nk === 'c1') return (c.classes || [])[+tt.nk.slice(1)] || t('untitled');
    return t('untitled');
  }
  /* "Class 7-A" -> "7-A" for small screens */
  function ttShort(tt) {
    var n = ttName(tt).trim(), w = n.split(/\s+/), last = w[w.length - 1];
    if (w.length > 1 && /\d/.test(last)) return last;
    var g = graphemes(n);
    return g.length <= 6 ? n : g.slice(0, 5).join('') + '.';
  }
  function subjById(tt, id) { for (var i = 0; i < tt.subjects.length; i++) if (tt.subjects[i].id === id) return tt.subjects[i]; return null; }
  function sample(sk) { var s = C().subjects || {}; return s[sk] || null; }
  function sName(s) {
    if (!s) return '';
    if (s.name) return s.name;
    var x = s.sk && sample(s.sk);
    return x ? x[0] : t('new_subject');
  }
  function autoShort(name) {
    name = String(name || '').trim();
    var g = graphemes(name);
    if (g.length <= 6) return name;
    var words = name.split(/\s+/).filter(Boolean);
    if (words.length > 1 && /^[A-Za-z]/.test(name)) return words.map(function (w) { return w[0].toUpperCase(); }).join('').slice(0, 4);
    var first = graphemes(words[0] || name);
    return first.length <= 6 ? words[0] : first.slice(0, 5).join('') + '.';
  }
  function sShort(s) {
    if (!s) return '';
    if (s.short) return s.short;
    if (!s.name && s.sk && sample(s.sk)) return sample(s.sk)[1];
    return autoShort(sName(s));
  }
  function sTeacher(s) {
    if (!s) return '';
    if (s.teacher) return s.teacher.trim();
    return s.tk ? ((C().teachers || {})[s.tk] || '') : '';
  }
  function ctName(tt) { return tt.ct ? tt.ct : (tt.ctk ? ((C().teachers || {})[tt.ctk] || '') : ''); }
  function slotLabel(sl) { return sl.label || (sl.lk ? t('brk_' + sl.lk) : t('slot_break')); }
  function periodNums(tt) { var n = 0, m = {}; tt.slots.forEach(function (s) { if (s.t === 'p') m[s.id] = ++n; }); return m; }
  function activeDays(tt) { var a = []; tt.days.forEach(function (on, i) { if (on) a.push(i); }); return a; }
  function eachCell(tt, fn) {
    var subj = {};
    tt.subjects.forEach(function (s) { subj[s.id] = s; });
    tt.slots.forEach(function (sl) {
      if (sl.t !== 'p') return;
      for (var d = 0; d < 7; d++) {
        if (!tt.days[d]) continue;
        var key = d + '|' + sl.id, sid = tt.cells[key];
        if (sid && subj[sid]) fn(d, sl, subj[sid], key);
      }
    });
  }
  function counts(tt) { var c = {}; eachCell(tt, function (d, sl, s) { c[s.id] = (c[s.id] || 0) + 1; }); return c; }
  function totalPeriods(tt) { return activeDays(tt).length * tt.slots.filter(function (s) { return s.t === 'p'; }).length; }
  function nextColor(tt) {
    var used = {}; tt.subjects.forEach(function (s) { used[s.color.toLowerCase()] = 1; });
    for (var i = 0; i < COLORS.length; i++) if (!used[COLORS[i]]) return COLORS[i];
    return COLORS[tt.subjects.length % COLORS.length];
  }
  function nowInfo() { var n = new Date(); return { day: (n.getDay() + 6) % 7, min: n.getHours() * 60 + n.getMinutes() + n.getSeconds() / 60 }; }
  function slotAt(tt, min) {
    for (var i = 0; i < tt.slots.length; i++) { var a = toMin(tt.slots[i].s), b = toMin(tt.slots[i].e); if (a != null && b != null && a <= min && min < b) return tt.slots[i]; }
    return null;
  }

  /* ------------------------------------------------------------ teachers + clashes (all class timetables) */
  function clashInfo() {
    if (clashCache) return clashCache;
    var byT = {}, names = {}, subjOf = {};
    data.tts.forEach(function (tt) {
      if (tt.kind !== 'class') return;
      tt.subjects.forEach(function (s) {
        var tn = sTeacher(s), k = norm(tn);
        if (!k) return;
        if (!names[k]) names[k] = tn;
        (subjOf[k] = subjOf[k] || []).push({ tt: tt, s: s });
        byT[k] = byT[k] || [];
      });
      eachCell(tt, function (d, sl, s, key) {
        var k = norm(sTeacher(s));
        if (!k) return;
        byT[k].push({ tt: tt, d: d, sl: sl, s: s, key: key, a: toMin(sl.s), b: toMin(sl.e) });
      });
    });
    var list = [], cell = {};
    Object.keys(byT).forEach(function (k) {
      var arr = byT[k];
      for (var i = 0; i < arr.length; i++) for (var j = i + 1; j < arr.length; j++) {
        var x = arr[i], y = arr[j];
        if (x.tt === y.tt || x.d !== y.d || x.a == null || y.a == null) continue;
        if (x.a < y.b && y.a < x.b) {
          list.push({ teacher: names[k], k: k, d: x.d, x: x, y: y });
          (cell[x.tt.id + '|' + x.key] = cell[x.tt.id + '|' + x.key] || []).push({ teacher: names[k], tt: y.tt, s: y.s });
          (cell[y.tt.id + '|' + y.key] = cell[y.tt.id + '|' + y.key] || []).push({ teacher: names[k], tt: x.tt, s: x.s });
        }
      }
    });
    list.sort(function (p, q) { return p.d - q.d || p.x.a - q.x.a || p.teacher.localeCompare(q.teacher); });
    clashCache = { list: list, cell: cell, byT: byT, names: names, subjOf: subjOf };
    return clashCache;
  }
  function teacherKeys() {
    var ci = clashInfo();
    return Object.keys(ci.names).sort(function (a, b) { return ci.names[a].localeCompare(ci.names[b]); });
  }
  /* teachers (norm keys) busy in OTHER class timetables at day d during slot sl */
  function busyAt(tt, d, sl) {
    var ci = clashInfo(), a = toMin(sl.s), b = toMin(sl.e), out = {};
    if (a == null || b == null) return out;
    Object.keys(ci.byT).forEach(function (k) {
      ci.byT[k].forEach(function (x) { if (x.tt !== tt && x.d === d && x.a < b && a < x.b) out[k] = x.tt; });
    });
    return out;
  }

  /* ------------------------------------------------------------ undo */
  function pushUndo(tt, snap) {
    undoStack.push({ id: tt.id, cells: snap || JSON.stringify(tt.cells) });
    if (undoStack.length > 60) undoStack.shift();
  }
  function undo() {
    var u = undoStack.pop();
    if (!u) return;
    var tt = ttById(u.id);
    if (!tt) return undo();
    try { tt.cells = JSON.parse(u.cells); } catch (e) { return; }
    data.cur = tt.id; swapSel = null;
    save(); renderAll();
    announce(t('undone'));
  }

  /* ------------------------------------------------------------ layout decisions */
  function orientation() {
    if (ui.layout === 'rows' || ui.layout === 'cols') return ui.layout;
    return window.innerWidth >= 820 ? 'rows' : 'cols';
  }
  function isCompact(tt, orient) {
    var w = Math.min(window.innerWidth, 1500) - 70;
    var np = tt.slots.filter(function (s) { return s.t === 'p'; }).length, nb = tt.slots.length - np, nd = activeDays(tt).length;
    var colW = orient === 'rows' ? (w - 110 - nb * 40) / Math.max(1, np) : (w - 70) / Math.max(1, nd);
    return colW < 96;
  }

  /* Generic week table. o = { days, slots, pn, orient, compact, today, nowSlot, cellFn(d, slot) -> <td>, cls } */
  function buildTable(o) {
    var nd = o.days.length;
    var tbl = el('table', { class: 'tt ' + (o.orient === 'rows' ? 'tt-rows' : 'tt-cols') + (o.compact ? ' compact' : '') + (o.cls ? ' ' + o.cls : '') });
    var thead = el('thead'), tbody = el('tbody'), hr = el('tr');
    hr.appendChild(el('th', { class: 'corner', scope: 'col' }, el('span', { class: 'sr-only', text: o.orient === 'rows' ? t('col_day') : t('col_time') })));
    if (o.orient === 'rows') {
      o.slots.forEach(function (sl) {
        if (sl.t === 'p') hr.appendChild(el('th', { scope: 'col', class: 'ph' }, el('span', { class: 'pnum', text: EDU.fmt(o.pn[sl.id] || 0) }), el('span', { class: 'tm', text: fmtRange(sl) })));
        else hr.appendChild(el('th', { scope: 'col', class: 'bh' }, el('span', { class: 'tm', text: fmtTime(sl.s) })));
      });
      o.days.forEach(function (d, di) {
        var tr = el('tr', { class: d === o.today ? 'today' : null },
          el('th', { scope: 'row', class: 'dh' }, el('span', { class: 'dn', text: dayName(d, o.compact) }), d === o.today ? el('span', { class: 'tbadge', text: t('today') }) : null));
        o.slots.forEach(function (sl) {
          if (sl.t === 'p') tr.appendChild(o.cellFn(d, sl));
          else if (di === 0) tr.appendChild(el('td', { class: 'brk', rowspan: nd }, el('span', { class: 'vt', text: slotLabel(sl) })));
        });
        tbody.appendChild(tr);
      });
    } else {
      o.days.forEach(function (d) {
        hr.appendChild(el('th', { scope: 'col', class: 'dh' + (d === o.today ? ' today' : '') }, el('span', { class: 'dn', text: dayName(d, o.compact) }), d === o.today ? el('span', { class: 'tbadge', text: t('today') }) : null));
      });
      o.slots.forEach(function (sl) {
        var tr;
        if (sl.t === 'p') {
          tr = el('tr', null, el('th', { scope: 'row', class: 'ph' }, el('span', { class: 'pnum', text: EDU.fmt(o.pn[sl.id] || 0) }),
            el('span', { class: 'tm' }, fmtTime(sl.s), el('br'), fmtTime(sl.e))));
          o.days.forEach(function (d) { tr.appendChild(o.cellFn(d, sl)); });
        } else {
          tr = el('tr', { class: 'brk-row' }, el('th', { scope: 'row', class: 'ph bt' }, el('span', { class: 'tm', text: fmtTime(sl.s) })),
            el('td', { class: 'brk', colspan: nd }, el('span', { class: 'bl', text: slotLabel(sl) }), ' ', el('span', { class: 'tm', text: fmtRange(sl) })));
        }
        tbody.appendChild(tr);
      });
    }
    thead.appendChild(hr);
    tbl.appendChild(thead); tbl.appendChild(tbody);
    return tbl;
  }

  /* Shrink labels that do not fit their cell (narrow phones, wide scripts, long user names) instead of
     breaking a word in the middle. Two passes: measure everything, then write font sizes. */
  function fitLabels(root, compact) {
    var items = $$('.cell .sn, .tcell .sn, .tcell .st, th.dh .dn', root).filter(function (x) { return compact || !/\s/.test(x.textContent.trim()); });
    if (!items.length) return;
    items.forEach(function (x) { x.style.whiteSpace = 'nowrap'; x.style.fontSize = ''; });
    var m = items.map(function (x) { var cs = getComputedStyle(x.parentElement); return [x, x.parentElement.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 2, x.scrollWidth, parseFloat(getComputedStyle(x).fontSize)]; });
    m.forEach(function (v) { if (v[2] > v[1] && v[1] > 0) v[0].style.fontSize = Math.max(9, v[3] * v[1] / v[2]).toFixed(1) + 'px'; });
    m.forEach(function (v) { if (v[0].scrollWidth > v[1] + 1) v[0].style.whiteSpace = 'normal'; });
  }

  /* ------------------------------------------------------------ top bar + tabs */
  var TABS = ['grid', 'setup', 'summary', 'teachers', 'today'];
  function renderTop() {
    var sel = $('#tt-sel');
    sel.innerHTML = '';
    data.tts.forEach(function (tt) { sel.appendChild(el('option', { value: tt.id, text: (tt.kind === 'study' ? '🎒 ' : '🏫 ') + ttName(tt) })); });
    sel.value = data.cur;
    var t0 = cur();
    $('#sample-note').hidden = !ui.note || !(t0.nk === 'c0' || t0.nk === 'c1');
  }
  function setTab(name, focus) {
    if (TABS.indexOf(name) < 0) name = 'grid';
    ui.tab = name; saveUi();
    TABS.forEach(function (tb) {
      var b = $('#tab-' + tb), p = $('#p-' + tb), on = tb === name;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      p.hidden = !on;
    });
    if (focus) $('#tab-' + name).focus();
    renderTab();
  }
  function renderTab() {
    if (ui.tab === 'grid') renderGridTab();
    else if (ui.tab === 'setup') renderSetup();
    else if (ui.tab === 'summary') renderSummary();
    else if (ui.tab === 'teachers') renderTeachers();
    else renderToday();
  }
  function renderAll() { renderTop(); setTab(ui.tab); }

  /* ------------------------------------------------------------ TIMETABLE tab */
  function renderGridTab() {
    var tt = cur();
    $$('#mode-seg button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.mode === ui.mode ? 'true' : 'false'); });
    $('#mode-help').textContent = t('mode_help_' + ui.mode);
    renderPalette(tt);
    renderGrid(tt);
    renderSubjects(tt);
    $('#undo-btn').disabled = !undoStack.length;
  }
  function refreshGrid() {
    var tt = cur();
    renderPalette(tt); renderGrid(tt); updateSubjCounts(tt);
    $('#undo-btn').disabled = !undoStack.length;
  }
  function renderPalette(tt) {
    var box = $('#palette');
    box.innerHTML = '';
    if (ui.brush !== ERASE && !subjById(tt, ui.brush)) ui.brush = tt.subjects[0] ? tt.subjects[0].id : ERASE;
    var cnt = counts(tt), paint = ui.mode === 'paint';
    tt.subjects.forEach(function (s) {
      var n = cnt[s.id] || 0;
      box.appendChild(el('button', { type: 'button', class: 'pchip', 'data-sid': s.id, 'aria-pressed': paint && ui.brush === s.id ? 'true' : 'false', style: { '--sc': s.color } },
        el('span', { class: 'dot', 'aria-hidden': 'true' }),
        el('span', { class: 'pn no-i18n', text: sName(s) }),
        el('span', { class: 'pc' + (s.want && n !== s.want ? ' off' : ''), text: s.want ? EDU.fmt(n) + '/' + EDU.fmt(s.want) : EDU.fmt(n) })));
    });
    box.appendChild(el('button', { type: 'button', class: 'pchip erase', 'data-sid': ERASE, id: 'eraser', 'aria-pressed': paint && ui.brush === ERASE ? 'true' : 'false' },
      el('span', { 'aria-hidden': 'true', text: '⌫' }), el('span', { class: 'pn', text: t('eraser') })));
    if (!tt.subjects.length) box.appendChild(el('span', { class: 'muted small', text: t('no_subjects') }));
  }
  function cellLabel(tt, d, sl, s, pn) {
    return dayName(d) + ', ' + t('period_n', { n: EDU.fmt(pn[sl.id]) }) + ' (' + fmtRange(sl) + '): ' + (s ? sName(s) + (tt.kind === 'class' && sTeacher(s) ? ', ' + sTeacher(s) : '') : t('free_period'));
  }
  function renderGrid(tt) {
    var wrap = $('#grid'), orient = orientation(), compact = isCompact(tt, orient), ci = clashInfo(), now = nowInfo();
    var pn = periodNums(tt), nowSl = tt.days[now.day] ? slotAt(tt, now.min) : null;
    var showT = ui.showT && !compact && tt.kind === 'class';
    var subj = {};
    tt.subjects.forEach(function (s) { subj[s.id] = s; });
    var tbl = buildTable({
      days: activeDays(tt), slots: tt.slots, pn: pn, orient: orient, compact: compact, today: now.day,
      cellFn: function (d, sl) {
        var key = d + '|' + sl.id, s = subj[tt.cells[key]] || null;
        var isNow = nowSl && nowSl.id === sl.id && d === now.day;
        var cl = s ? ci.cell[tt.id + '|' + key] : null;
        var b = el('button', {
          type: 'button', class: 'cell' + (s ? '' : ' empty') + (cl ? ' clash' : '') + (swapSel === key ? ' sel' : ''),
          'data-d': d, 'data-s': sl.id, 'data-sub': s ? s.id : '', style: s ? { '--sc': s.color } : null,
          'aria-label': cellLabel(tt, d, sl, s, pn) + (cl ? ' — ' + t('clash_word') : '')
        });
        if (s) {
          b.appendChild(el('span', { class: 'sn no-i18n', text: compact ? sShort(s) : sName(s) }));
          if (showT && sTeacher(s)) b.appendChild(el('span', { class: 'st no-i18n', text: sTeacher(s) }));
        }
        if (cl) {
          b.appendChild(el('span', { class: 'warn-ic', 'aria-hidden': 'true', text: '⚠' }));
          b.title = t('clash_cell', { teacher: cl[0].teacher, cls: cl.map(function (x) { return ttName(x.tt); }).join(', ') });
        }
        if (isNow) b.appendChild(el('span', { class: 'now-pill', 'aria-hidden': 'true', text: t('now') }));
        return el('td', { class: (isNow ? 'now ' : '') + (d === now.day ? 'tcol' : '') }, b);
      }
    });
    wrap.innerHTML = '';
    wrap.appendChild(tbl);
    fitLabels(tbl, compact);
    var total = totalPeriods(tt), filled = 0;
    eachCell(tt, function () { filled++; });
    var mine = ci.list.filter(function (c) { return c.x.tt === tt || c.y.tt === tt; }).length;
    $('#grid-status').textContent = t('filled_n', { n: EDU.fmt(filled), total: EDU.fmt(total) });
    var note = $('#clash-note');
    note.hidden = !mine;
    if (mine) {
      note.innerHTML = '';
      note.appendChild(el('span', { text: '⚠ ' + t('clash_here', { n: EDU.fmt(mine) }) + ' ' }));
      note.appendChild(el('button', { type: 'button', class: 'btn btn-sm', id: 'go-teachers', text: t('see_clashes'), onclick: function () { setTab('teachers'); } }));
    }
  }
  /* --- cell actions --- */
  function setCell(tt, key, sid) { if (sid) tt.cells[key] = sid; else delete tt.cells[key]; }
  function warnClash(tt, key) {
    var info = clashInfo().cell[tt.id + '|' + key];
    if (info && info.length) EDU.toast('⚠ ' + t('clash_cell', { teacher: info[0].teacher, cls: info.map(function (x) { return ttName(x.tt); }).join(', ') }), 4000);
  }
  function describe(tt, key) {
    var p = key.split('|'), d = +p[0], sl = null;
    tt.slots.forEach(function (x) { if (x.id === p[1]) sl = x; });
    if (!sl) return '';
    return cellLabel(tt, d, sl, subjById(tt, tt.cells[key]), periodNums(tt));
  }
  function paintClick(tt, key) {
    var want = ui.brush === ERASE ? null : ui.brush;
    if (want && !subjById(tt, want)) { EDU.toast(t('no_subjects')); return; }
    var old = tt.cells[key] || null;
    if (old === want && !want) return;
    pushUndo(tt);
    setCell(tt, key, old === want ? null : want);    // tapping the same subject again empties the period
    save(); refreshGrid();
    announce(describe(tt, key));
    if (tt.cells[key]) warnClash(tt, key);
  }
  function swapClick(tt, key) {
    if (!swapSel) { swapSel = key; refreshGrid(); announce(t('swap_first')); return; }
    if (swapSel === key) { swapSel = null; refreshGrid(); return; }
    var a = tt.cells[swapSel] || null, b = tt.cells[key] || null, k1 = swapSel;
    swapSel = null;
    if (a === b) { refreshGrid(); announce(t('swapped')); return; }
    pushUndo(tt);
    setCell(tt, k1, b); setCell(tt, key, a);
    save(); refreshGrid();
    announce(t('swapped'));
    var ci = clashInfo();
    if (ci.cell[tt.id + '|' + k1] || ci.cell[tt.id + '|' + key]) warnClash(tt, ci.cell[tt.id + '|' + k1] ? k1 : key);
  }
  function pickModal(tt, key) {
    var p = key.split('|'), d = +p[0], sl = null, pn = periodNums(tt);
    tt.slots.forEach(function (x) { if (x.id === p[1]) sl = x; });
    if (!sl) return;
    var busy = tt.kind === 'class' ? busyAt(tt, d, sl) : {};
    var curId = tt.cells[key], close;
    var box = el('div', { class: 'pick-list', role: 'list' });
    function choose(sid) {
      pushUndo(tt); setCell(tt, key, sid); save(); close(); refreshGrid();
      announce(describe(tt, key));
      if (sid) warnClash(tt, key);
      var btn = $('#grid .cell[data-d="' + d + '"][data-s="' + sl.id + '"]');
      if (btn) btn.focus();
    }
    tt.subjects.forEach(function (s) {
      var bz = tt.kind === 'class' && busy[norm(sTeacher(s))];
      box.appendChild(el('button', { type: 'button', class: 'pick-btn' + (s.id === curId ? ' on' : ''), 'data-sid': s.id, style: { '--sc': s.color }, onclick: function () { choose(s.id); } },
        el('span', { class: 'dot', 'aria-hidden': 'true' }),
        el('span', { class: 'pk-n no-i18n', text: sName(s) }),
        tt.kind === 'class' && sTeacher(s) ? el('span', { class: 'pk-t muted no-i18n', text: sTeacher(s) }) : null,
        bz ? el('span', { class: 'badge danger', text: t('busy_in', { cls: ttName(bz) }) }) : null));
    });
    box.appendChild(el('button', { type: 'button', class: 'pick-btn empty', 'data-sid': '', onclick: function () { choose(null); } },
      el('span', { 'aria-hidden': 'true', text: '⌫' }), el('span', { class: 'pk-n', text: t('free_period') })));
    close = EDU.modal(el('div', { class: 'stack' }, el('p', { class: 'muted mb0', text: dayName(d) + ' · ' + t('period_n', { n: EDU.fmt(pn[sl.id]) }) + ' · ' + fmtRange(sl) }), box), { title: t('pick_title') });
    var first = box.querySelector('.pick-btn.on') || box.querySelector('.pick-btn');
    if (first) setTimeout(function () { first.focus(); }, 30);
  }

  /* --- drag painting with mouse / pen (touch scrolls the table instead) --- */
  var drag = null, suppressClick = false;
  function keyOf(b) { return b.getAttribute('data-d') + '|' + b.getAttribute('data-s'); }
  function dragPaint(key) {
    if (drag.seen[key]) return;
    drag.seen[key] = 1;
    var want = ui.brush === ERASE ? null : ui.brush;
    if ((drag.tt.cells[key] || null) === want) return;
    setCell(drag.tt, key, want);
    drag.changed = true;
    clashCache = null;
    refreshGrid();
  }

  /* --- subjects editor --- */
  function teacherDatalist() {
    var dl = $('#teacher-dl');
    dl.innerHTML = '';
    var seen = {};
    data.tts.forEach(function (tt) { tt.subjects.forEach(function (s) { var n = sTeacher(s); if (n && !seen[norm(n)]) { seen[norm(n)] = 1; dl.appendChild(el('option', { value: n })); } }); });
  }
  function renderSubjects(tt) {
    var list = $('#subj-list'), study = tt.kind === 'study';
    $('#subj-card').classList.toggle('study', study);
    list.innerHTML = '';
    teacherDatalist();
    var cnt = counts(tt);
    list.appendChild(el('div', { class: 'srow shead', 'aria-hidden': 'true' },
      el('span', { class: 'c-col', text: t('subj_color') }), el('span', { class: 'c-name', text: t('subj_name') }), el('span', { class: 'c-short', text: t('subj_short') }),
      study ? null : el('span', { class: 'c-teach', text: t('subj_teacher') }), el('span', { class: 'c-want', text: t('subj_want') }), el('span', { class: 'c-have', text: t('subj_have') }), el('span', { class: 'c-del' })));
    tt.subjects.forEach(function (s) {
      var row = el('div', { class: 'srow', 'data-sid': s.id, style: { '--sc': s.color } });
      var color = el('input', { type: 'color', class: 'c-col', value: s.color, 'aria-label': t('subj_color') });
      color.addEventListener('input', function () { s.color = color.value; row.style.setProperty('--sc', s.color); save(); renderPalette(tt); renderGrid(tt); });
      var name = el('input', { type: 'text', class: 'c-name in-name no-i18n', value: s.name || (s.sk ? sName(s) : ''), maxlength: 60, 'aria-label': t('subj_name'), placeholder: t('subject_ph') });
      name.addEventListener('input', function () { s.name = name.value.trim() ? name.value : ''; s.sk = null; short.placeholder = sShort(s); save(); renderPalette(tt); renderGrid(tt); });
      var short = el('input', { type: 'text', class: 'c-short in-short no-i18n', value: s.short, maxlength: 12, 'aria-label': t('subj_short'), placeholder: sShort(s) });
      short.addEventListener('input', function () { s.short = short.value.trim(); save(); renderGrid(tt); });
      var teach = null;
      if (!study) {
        teach = el('input', { type: 'text', class: 'c-teach in-teach no-i18n', value: sTeacher(s), maxlength: 60, list: 'teacher-dl', 'aria-label': t('subj_teacher'), placeholder: t('teacher_ph') });
        teach.addEventListener('input', function () { s.teacher = teach.value; s.tk = null; save(); renderGrid(tt); });
        teach.addEventListener('change', teacherDatalist);
      }
      var want = el('input', { type: 'number', class: 'c-want in-want', min: 0, max: 60, step: 1, inputmode: 'numeric', value: s.want ? String(s.want) : '', 'aria-label': t('subj_want'), placeholder: '0' });
      want.addEventListener('input', function () { var v = parseInt(want.value, 10); s.want = isFinite(v) ? EDU.clamp(v, 0, 60) : 0; save(); renderPalette(tt); updateSubjCounts(tt); });
      var have = el('span', { class: 'c-have have', 'aria-live': 'off' });
      var del = el('button', { type: 'button', class: 'btn btn-ghost btn-sm c-del del-subj', 'aria-label': t('delete_subject'), title: t('delete_subject'), text: '✕', onclick: function () { deleteSubject(tt, s); } });
      function cap(key, input) { return el('label', { class: 'sf ' + input.className.split(' ')[0] }, el('span', { class: 'cap', text: t(key) }), input); }
      row.appendChild(color);
      row.appendChild(cap('subj_name', name));
      row.appendChild(cap('subj_short', short));
      if (teach) row.appendChild(cap('subj_teacher', teach));
      row.appendChild(cap('subj_want', want));
      row.appendChild(el('div', { class: 'sf c-have' }, el('span', { class: 'cap', text: t('subj_have') }), have));
      row.appendChild(del);
      list.appendChild(row);
    });
    updateSubjCounts(tt, cnt);
    $('#add-subj').disabled = tt.subjects.length >= MAX_SUBJ;
  }
  function updateSubjCounts(tt, cnt) {
    cnt = cnt || counts(tt);
    $$('#subj-list .srow[data-sid]').forEach(function (row) {
      var s = subjById(tt, row.getAttribute('data-sid'));
      if (!s) return;
      var n = cnt[s.id] || 0, h = row.querySelector('.have');
      h.textContent = EDU.fmt(n) + (s.want ? (n === s.want ? ' ✓' : ' (' + (n > s.want ? '+' : '−') + EDU.fmt(Math.abs(n - s.want)) + ')') : '');
      h.className = 'have' + (s.want && n !== s.want ? ' off' : (s.want ? ' ok' : ''));
    });
  }
  function deleteSubject(tt, s) {
    var n = counts(tt)[s.id] || 0;
    if (n && !confirm(t('confirm_del_subject', { name: sName(s), n: EDU.fmt(n) }))) return;
    tt.subjects = tt.subjects.filter(function (x) { return x !== s; });
    Object.keys(tt.cells).forEach(function (k) { if (tt.cells[k] === s.id) delete tt.cells[k]; });
    undoStack = undoStack.filter(function (u) { return u.id !== tt.id; });
    if (ui.brush === s.id) ui.brush = null;
    save(); renderGridTab();
  }
  function addSubject() {
    var tt = cur();
    if (tt.subjects.length >= MAX_SUBJ) return;
    var s = { id: uid(), name: '', sk: null, short: '', teacher: '', tk: null, color: nextColor(tt), want: 0 };
    tt.subjects.push(s);
    ui.brush = s.id; ui.mode = 'paint'; saveUi();
    save(); renderGridTab();
    var inp = $('#subj-list .srow[data-sid="' + s.id + '"] .in-name');
    if (inp) { inp.focus(); inp.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  }

  /* --- auto-fill --- */
  function autoFill() {
    var tt = cur();
    if (!tt.subjects.some(function (s) { return s.want > 0; })) { EDU.toast(t('autofill_none'), 4500); return; }
    var cnt = counts(tt), groups = [];
    tt.subjects.forEach(function (s) { var n = (s.want || 0) - (cnt[s.id] || 0); if (n > 0) groups.push({ s: s, n: n }); });
    var periods = tt.slots.filter(function (s) { return s.t === 'p'; });
    var empties = [];
    activeDays(tt).forEach(function (d) { periods.forEach(function (sl) { if (!tt.cells[d + '|' + sl.id]) empties.push({ d: d, sl: sl, key: d + '|' + sl.id }); }); });
    if (!groups.length) { EDU.toast(t('autofill_full')); return; }
    if (!empties.length) { EDU.toast(t('autofill_nofree')); return; }
    var busy = {};
    if (tt.kind === 'class') data.tts.forEach(function (o) {
      if (o === tt || o.kind !== 'class') return;
      eachCell(o, function (d, sl, s) { var k = norm(sTeacher(s)); if (k) (busy[k] = busy[k] || []).push({ d: d, a: toMin(sl.s), b: toMin(sl.e) }); });
    });
    var idx = {};
    tt.slots.forEach(function (sl, i) { idx[sl.id] = i; });
    function neighbours(e) {
      var i = idx[e.sl.id], out = [];
      [i - 1, i + 1].forEach(function (j) { var n = tt.slots[j]; if (n && n.t === 'p') out.push(e.d + '|' + n.id); });
      return out;
    }
    var best = null;
    for (var attempt = 0; attempt < 40; attempt++) {
      var cells = Object.assign({}, tt.cells), perDay = {}, free = empties.slice(), placed = 0, left = 0, pen = 0;
      eachCell(tt, function (d, sl, s) { perDay[s.id + '|' + d] = (perDay[s.id + '|' + d] || 0) + 1; });
      var gs = EDU.shuffle(groups).sort(function (x, y) { return y.n - x.n; }).map(function (g) { return { s: g.s, n: g.n }; });
      var tokens = [];
      for (var more = true; more;) { more = false; gs.forEach(function (g) { if (g.n > 0) { tokens.push(g.s); g.n--; more = true; } }); }
      tokens.forEach(function (s) {
        var k = tt.kind === 'class' ? norm(sTeacher(s)) : '';
        var bestE = null, bestScore = Infinity;
        free.forEach(function (e) {
          if (k && busy[k]) {
            var a = toMin(e.sl.s), b = toMin(e.sl.e);
            if (busy[k].some(function (x) { return x.d === e.d && x.a < b && a < x.b; })) return;
          }
          var same = neighbours(e).filter(function (nk) { return cells[nk] === s.id; }).length;
          var sc = (perDay[s.id + '|' + e.d] || 0) * 10 + same * 4 + Math.random() * 2;
          if (sc < bestScore) { bestScore = sc; bestE = e; }
        });
        if (!bestE) { left++; return; }
        cells[bestE.key] = s.id;
        perDay[s.id + '|' + bestE.d] = (perDay[s.id + '|' + bestE.d] || 0) + 1;
        free.splice(free.indexOf(bestE), 1);
        placed++;
        pen += Math.floor(bestScore);
      });
      var score = left * 1000 + pen;
      if (!best || score < best.score) best = { score: score, cells: cells, placed: placed, left: left };
      if (!left && pen === 0) break;
    }
    if (!best.placed) { EDU.toast(t('autofill_left', { n: EDU.fmt(best.left) }), 4500); return; }
    pushUndo(tt);
    tt.cells = best.cells;
    save(); refreshGrid();
    var msg = t('autofill_done', { n: EDU.fmt(best.placed) }) + (best.left ? ' ' + t('autofill_left', { n: EDU.fmt(best.left) }) : '');
    EDU.toast(msg, 4500); announce(msg);
  }

  /* ------------------------------------------------------------ SETUP tab */
  function renderSetup() {
    var tt = cur();
    $('#tt-name').value = ttName(tt);
    $$('#kind-seg button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.kind === tt.kind ? 'true' : 'false'); });
    $('#ct-field').hidden = tt.kind === 'study';
    $('#tt-ct').value = ctName(tt);
    var days = $('#days-box');
    days.innerHTML = '';
    for (var d = 0; d < 7; d++) {
      days.appendChild(el('button', { type: 'button', class: 'chip day-chip', 'data-d': d, 'aria-pressed': tt.days[d] ? 'true' : 'false' }, dayName(d)));
    }
    $$('#clock-seg button').forEach(function (b) { b.setAttribute('aria-pressed', (b.dataset.h24 === '1') === !!ui.h24 ? 'true' : 'false'); });
    $$('#layout-seg button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.layout === ui.layout ? 'true' : 'false'); });
    $('#show-t').checked = !!ui.showT;
    $('#school').value = data.school || '';
    renderSlots(tt);
    var first = tt.slots[0];
    $('#auto-start').value = first ? first.s : '08:00';
    $('#auto-len').value = String(typicalLen(tt));
  }
  function typicalLen(tt) {
    var f = {}, best = 40, bn = 0;
    tt.slots.forEach(function (s) { if (s.t === 'p') { var n = dur(s); if (n) { f[n] = (f[n] || 0) + 1; if (f[n] > bn) { bn = f[n]; best = n; } } } });
    return best;
  }
  function slotWarn(tt) {
    var prevEnd = null, bad = {}, any = false;
    tt.slots.forEach(function (sl) {
      var a = toMin(sl.s), b = toMin(sl.e);
      if (a == null || b == null || b <= a || (prevEnd != null && a < prevEnd)) { bad[sl.id] = 1; any = true; }
      if (b != null) prevEnd = b;
    });
    return { bad: bad, any: any };
  }
  function renderSlots(tt) {
    var box = $('#slots'), pn = periodNums(tt), w = slotWarn(tt);
    box.innerHTML = '';
    tt.slots.forEach(function (sl, i) {
      var row = el('div', { class: 'slot-row ' + (sl.t === 'b' ? 'is-brk' : 'is-per') + (w.bad[sl.id] ? ' warn' : ''), 'data-id': sl.id });
      var name;
      if (sl.t === 'p') name = el('span', { class: 'slot-name' }, el('span', { class: 'slot-ic', 'aria-hidden': 'true', text: '📘' }), el('strong', { text: t('period_n', { n: EDU.fmt(pn[sl.id]) }) }));
      else {
        var inp = el('input', { type: 'text', class: 'brk-in', list: 'brk-dl', value: slotLabel(sl), maxlength: 40, 'aria-label': t('slot_label') });
        inp.addEventListener('input', function () {
          var v = inp.value.trim(), lk = null;
          BRK.forEach(function (k) { if (t('brk_' + k) === v) lk = k; });
          sl.lk = lk; sl.label = lk ? '' : v;
          save();
        });
        name = el('span', { class: 'slot-name' }, el('span', { class: 'slot-ic', 'aria-hidden': 'true', text: '☕' }), inp);
      }
      var st = el('input', { type: 'time', class: 'in-start', value: sl.s, 'aria-label': t('slot_start'), required: true });
      var en = el('input', { type: 'time', class: 'in-end', value: sl.e, 'aria-label': t('slot_end'), required: true });
      var len = el('span', { class: 'slot-len muted small' });
      function upd() { len.textContent = dur(sl) ? t('mins', { n: EDU.fmt(dur(sl)) }) : '⚠'; }
      upd();
      st.addEventListener('change', function () { if (toMin(st.value) != null) { sl.s = st.value; save(); upd(); markSlotWarn(tt); } });
      en.addEventListener('change', function () { if (toMin(en.value) != null) { sl.e = en.value; save(); upd(); markSlotWarn(tt); } });
      var acts = el('span', { class: 'slot-acts' },
        el('button', { type: 'button', class: 'btn btn-sm btn-ghost', 'aria-label': t('move_up'), title: t('move_up'), disabled: i === 0, text: '↑', onclick: function () { moveSlot(tt, i, -1); } }),
        el('button', { type: 'button', class: 'btn btn-sm btn-ghost', 'aria-label': t('move_down'), title: t('move_down'), disabled: i === tt.slots.length - 1, text: '↓', onclick: function () { moveSlot(tt, i, 1); } }),
        el('button', { type: 'button', class: 'btn btn-sm btn-ghost del-slot', 'aria-label': t('remove'), title: t('remove'), text: '✕', onclick: function () { removeSlot(tt, sl); } }));
      row.appendChild(name);
      row.appendChild(el('span', { class: 'slot-times' }, st, el('span', { 'aria-hidden': 'true', text: '–' }), en, len));
      row.appendChild(acts);
      box.appendChild(row);
    });
    $('#slot-warn').hidden = !w.any;
    $('#add-period').disabled = $('#add-break').disabled = tt.slots.length >= MAX_SLOTS;
    var dl = $('#brk-dl');
    dl.innerHTML = '';
    BRK.forEach(function (k) { dl.appendChild(el('option', { value: t('brk_' + k) })); });
  }
  function markSlotWarn(tt) {
    var w = slotWarn(tt);
    $$('#slots .slot-row').forEach(function (r) { r.classList.toggle('warn', !!w.bad[r.getAttribute('data-id')]); });
    $('#slot-warn').hidden = !w.any;
  }
  function retime(tt, start, periodLen) {
    var m = toMin(start);
    if (m == null) m = 480;
    tt.slots.forEach(function (sl) {
      var len = sl.t === 'p' ? (periodLen || dur(sl) || 40) : (dur(sl) || 15);
      sl.s = fromMin(m); sl.e = fromMin(m + len); m += len;
    });
  }
  function moveSlot(tt, i, dir) {
    var j = i + dir;
    if (j < 0 || j >= tt.slots.length) return;
    var start = tt.slots[0].s, x = tt.slots[i];
    tt.slots[i] = tt.slots[j]; tt.slots[j] = x;
    retime(tt, start, 0);            // durations move with the rows; the day still starts at the same time
    save(); renderSlots(tt);
    var btn = $('#slots .slot-row[data-id="' + x.id + '"] .slot-acts button:' + (dir < 0 ? 'first-child' : 'nth-child(2)'));
    if (btn && !btn.disabled) btn.focus();
  }
  function removeSlot(tt, sl) {
    var used = 0;
    Object.keys(tt.cells).forEach(function (k) { if (k.split('|')[1] === sl.id) used++; });
    if (tt.slots.length <= 1) { EDU.toast(t('need_one_slot')); return; }
    if (used && !confirm(t('confirm_remove_period', { n: EDU.fmt(used) }))) return;
    tt.slots = tt.slots.filter(function (x) { return x !== sl; });
    Object.keys(tt.cells).forEach(function (k) { if (k.split('|')[1] === sl.id) delete tt.cells[k]; });
    undoStack = undoStack.filter(function (u) { return u.id !== tt.id; });
    save(); renderSlots(tt);
  }
  function addSlot(type) {
    var tt = cur();
    if (tt.slots.length >= MAX_SLOTS) return;
    var last = tt.slots[tt.slots.length - 1], s = last ? toMin(last.e) : 480;
    if (s == null) s = 480;
    var len = type === 'p' ? typicalLen(tt) : 15;
    var sl = { id: uid(), t: type, s: fromMin(s), e: fromMin(s + len), label: '', lk: type === 'b' ? 'short' : null };
    tt.slots.push(sl);
    save(); renderSlots(tt);
    var r = $('#slots .slot-row[data-id="' + sl.id + '"] .in-start');
    if (r) r.focus();
    announce(type === 'p' ? t('period_added') : t('break_added'));
  }

  /* ------------------------------------------------------------ new / duplicate / delete timetables */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function addTT(tt) {
    if (data.tts.length >= MAX_TT) { EDU.toast(t('too_many')); return; }
    data.tts.push(tt); data.cur = tt.id; swapSel = null;
    save(); ui.tab = 'grid'; renderAll();
    EDU.toast(t('created', { name: ttName(tt) }));
  }
  function duplicate(src, name) {
    var tt = clone(src);
    tt.id = uid(); tt.nk = null;
    tt.name = name || t('copy_of', { name: ttName(src) });
    return tt;
  }
  function newModal() {
    var src = cur(), close;
    var nameIn = el('input', { type: 'text', id: 'new-name', class: 'w100', maxlength: 60, placeholder: t('name_ph') });
    var opts = el('div', { class: 'new-opts' });
    function opt(id, icon, title, desc, fn) {
      opts.appendChild(el('button', { type: 'button', class: 'new-opt', id: id, onclick: function () { var nm = nameIn.value.trim(); close(); fn(nm); } },
        el('span', { class: 'ni', 'aria-hidden': 'true', text: icon }),
        el('span', { class: 'nt' }, el('strong', { text: title }), el('span', { class: 'muted small', text: desc }))));
    }
    if (src.kind === 'class') opt('new-copy', '📋', t('new_copy'), t('new_copy_desc', { name: ttName(src) }), function (nm) {
      var tt = duplicate(src, nm || t('untitled'));
      tt.cells = {}; tt.ct = ''; tt.ctk = null;
      addTT(tt);
    });
    opt('new-std', '🏫', t('new_std'), t('new_std_desc'), function (nm) { addTT(blankClass(nm || t('untitled'))); });
    opt('new-dup', '📑', t('new_dup'), t('new_dup_desc', { name: ttName(src) }), function (nm) { addTT(duplicate(src, nm)); });
    opt('new-study', '🎒', t('new_study'), t('new_study_desc'), function (nm) { addTT(studyTT(nm)); });
    close = EDU.modal(el('div', { class: 'stack' },
      el('div', { class: 'field' }, el('label', { for: 'new-name', text: t('new_name') }), nameIn),
      el('p', { class: 'muted small mb0', text: t('new_pick') }), opts), { title: t('new_title') });
    setTimeout(function () { nameIn.focus(); }, 40);
  }
  function deleteTT() {
    var tt = cur();
    if (data.tts.length < 2) { EDU.toast(t('cant_delete_last')); return; }
    if (!confirm(t('confirm_del_tt', { name: ttName(tt) }))) return;
    data.tts = data.tts.filter(function (x) { return x !== tt; });
    undoStack = undoStack.filter(function (u) { return u.id !== tt.id; });
    data.cur = data.tts[0].id;
    save(); renderAll();
  }

  /* ------------------------------------------------------------ SUMMARY tab */
  function renderSummary() {
    var tt = cur(), study = tt.kind === 'study', cnt = counts(tt), mins = {}, total = totalPeriods(tt), filled = 0, tmin = 0;
    eachCell(tt, function (d, sl, s) { mins[s.id] = (mins[s.id] || 0) + dur(sl); filled++; tmin += dur(sl); });
    $('#sum-name').textContent = ttName(tt);
    var tiles = $('#sum-tiles');
    tiles.innerHTML = '';
    function tile(label, val, id) { tiles.appendChild(el('div', { class: 'stat' }, el('div', { class: 'stat-v', id: id, text: val }), el('div', { class: 'stat-l', text: label }))); }
    tile(t('tile_filled'), EDU.fmt(filled) + ' / ' + EDU.fmt(total), 'st-filled');
    tile(t('tile_free'), EDU.fmt(total - filled), 'st-free');
    tile(t('tile_subjects'), EDU.fmt(tt.subjects.length), 'st-subj');
    tile(study ? t('tile_study_time') : t('tile_teach_time'), hm(tmin), 'st-time');

    var max = 1;
    tt.subjects.forEach(function (s) { max = Math.max(max, cnt[s.id] || 0, s.want || 0); });
    var tbl = $('#sum-table');
    tbl.innerHTML = '';
    tbl.appendChild(el('thead', null, el('tr', null, el('th', { text: t('col_subject') }), study ? null : el('th', { class: 'hide-sm', text: t('col_teacher') }),
      el('th', { class: 'num', text: t('col_periods') }), el('th', { class: 'num', text: t('col_wanted') }), el('th', { class: 'num', text: t('col_time') }), el('th', { class: 'barcol', 'aria-hidden': 'true' }))));
    var tb = el('tbody');
    tt.subjects.forEach(function (s) {
      var n = cnt[s.id] || 0, diff = s.want ? n - s.want : 0;
      tb.appendChild(el('tr', { 'data-sid': s.id, style: { '--sc': s.color } },
        el('td', null, el('span', { class: 'dot', 'aria-hidden': 'true' }), ' ', el('span', { class: 'no-i18n', text: sName(s) })),
        study ? null : el('td', { class: 'no-i18n hide-sm', text: sTeacher(s) || '—' }),
        el('td', { class: 'num n-have', text: EDU.fmt(n) }),
        el('td', { class: 'num' + (s.want ? (diff ? ' bad' : ' ok') : '') }, s.want ? EDU.fmt(s.want) + (diff ? ' (' + (diff > 0 ? '+' : '−') + EDU.fmt(Math.abs(diff)) + ')' : ' ✓') : '–'),
        el('td', { class: 'num', text: hm(mins[s.id] || 0) }),
        el('td', { class: 'barcol', 'aria-hidden': 'true' }, el('span', { class: 'sbar' }, el('span', { style: { width: (n / max * 100).toFixed(1) + '%' } })))));
    });
    tbl.appendChild(tb);

    // spread: subject x day
    var days = activeDays(tt), perDay = {};
    eachCell(tt, function (d, sl, s) { perDay[s.id + '|' + d] = (perDay[s.id + '|' + d] || 0) + 1; });
    var sp = el('table', { class: 'table spread-t', id: 'spread-t' });
    var hr = el('tr', null, el('th', { text: t('col_subject') }));
    days.forEach(function (d) { hr.appendChild(el('th', { class: 'num', text: dayName(d, true) })); });
    sp.appendChild(el('thead', null, hr));
    var sb = el('tbody');
    tt.subjects.forEach(function (s) {
      var tr = el('tr', { style: { '--sc': s.color } }, el('td', null, el('span', { class: 'dot', 'aria-hidden': 'true' }), ' ', el('span', { class: 'no-i18n', text: sShort(s) })));
      days.forEach(function (d) { var n = perDay[s.id + '|' + d] || 0; tr.appendChild(el('td', { class: 'num' + (n > 1 ? ' many' : '') + (n ? '' : ' zero'), text: n ? EDU.fmt(n) : '·' })); });
      sb.appendChild(tr);
    });
    sp.appendChild(sb);
    $('#spread').innerHTML = '';
    $('#spread').appendChild(sp);

    // teacher load inside this timetable
    $('#sum-teach-card').hidden = study;
    if (!study) {
      var load = {}, order = [];
      tt.subjects.forEach(function (s) {
        var tn = sTeacher(s), k = norm(tn) || '—';
        if (!load[k]) { load[k] = { name: tn || t('no_teacher'), subs: [], n: 0 }; order.push(k); }
        load[k].subs.push(sName(s)); load[k].n += cnt[s.id] || 0;
      });
      var lt = el('table', { class: 'table', id: 'sum-teach-t' });
      lt.appendChild(el('thead', null, el('tr', null, el('th', { text: t('col_teacher') }), el('th', { text: t('col_subjects') }), el('th', { class: 'num', text: t('col_periods') }))));
      var lb = el('tbody');
      order.sort(function (a, b) { return load[b].n - load[a].n; }).forEach(function (k) {
        lb.appendChild(el('tr', null, el('td', { class: 'no-i18n', text: load[k].name }), el('td', { class: 'no-i18n small', text: load[k].subs.join(', ') }), el('td', { class: 'num', text: EDU.fmt(load[k].n) })));
      });
      lt.appendChild(lb);
      $('#sum-teach').innerHTML = '';
      $('#sum-teach').appendChild(lt);
    }
  }

  /* ------------------------------------------------------------ TEACHERS tab */
  function unionModel() {
    var classTTs = data.tts.filter(function (x) { return x.kind === 'class'; });
    var dayset = {}, slotMap = {}, slots = [];
    classTTs.forEach(function (tt) {
      activeDays(tt).forEach(function (d) { dayset[d] = 1; });
      tt.slots.forEach(function (sl) {
        var k = sl.t + sl.s + sl.e;
        if (!slotMap[k] && dur(sl)) { slotMap[k] = { id: k, t: sl.t, s: sl.s, e: sl.e, label: sl.label, lk: sl.lk }; slots.push(slotMap[k]); }
      });
    });
    slots.sort(function (a, b) { return toMin(a.s) - toMin(b.s) || toMin(a.e) - toMin(b.e) || (a.t === 'p' ? -1 : 1); });
    var pn = {}, n = 0;
    slots.forEach(function (s) { if (s.t === 'p') pn[s.id] = ++n; });
    return { days: Object.keys(dayset).map(Number).sort(), slots: slots, pn: pn, ttCount: classTTs.length };
  }
  function teacherTable(k, model, printMode) {
    var ci = clashInfo(), entries = ci.byT[k] || [], at = {};
    entries.forEach(function (x) { var key = x.d + '|' + x.sl.t + x.sl.s + x.sl.e; (at[key] = at[key] || []).push(x); });
    var now = nowInfo(), orient = printMode ? 'rows' : orientation();
    var compact = !printMode && isCompact({ slots: model.slots, days: [0, 1, 2, 3, 4, 5, 6].map(function (d) { return model.days.indexOf(d) >= 0; }) }, orient);
    var tbl = buildTable({
      days: model.days, slots: model.slots, pn: model.pn, orient: orient, compact: compact, today: printMode ? -1 : now.day, cls: printMode ? 'ptab' : 'tview',
      cellFn: function (d, sl) {
        var list = at[d + '|' + sl.id] || [], a = toMin(sl.s), b = toMin(sl.e);
        var isNow = !printMode && d === now.day && a <= now.min && now.min < b;
        var td = el('td', { class: 'tc' + (list.length ? ' busy' : '') + (isNow ? ' now' : '') });
        var clash = list.length > 1 || list.some(function (x) { return ci.cell[x.tt.id + '|' + x.key]; });
        if (clash) td.classList.add('clash');
        list.forEach(function (x) {
          td.appendChild(el('div', { class: 'tcell', style: { '--sc': x.s.color } },
            el('span', { class: 'sn no-i18n', text: compact ? ttShort(x.tt) : ttName(x.tt) }), el('span', { class: 'st no-i18n', text: compact ? sShort(x.s) : sName(x.s) })));
        });
        if (clash && !printMode) td.appendChild(el('span', { class: 'warn-ic', text: '⚠', 'aria-label': t('clash_word') }));
        return td;
      }
    });
    return tbl;
  }
  function renderTeachers() {
    var ci = clashInfo(), keys = teacherKeys(), model = unionModel();
    $('#no-teachers').hidden = keys.length > 0;
    $('#teach-main').hidden = !keys.length;
    if (!keys.length) return;

    // clash list
    var cl = $('#clash-list');
    cl.innerHTML = '';
    if (!ci.list.length) cl.appendChild(el('p', { class: 'callout success mb0', id: 'no-clash', text: '✓ ' + t('no_clashes') }));
    else {
      cl.appendChild(el('p', { class: 'callout danger', id: 'clash-count', text: '⚠ ' + t('clash_total', { n: EDU.fmt(ci.list.length) }) }));
      var ul = el('ul', { class: 'clash-ul' });
      ci.list.forEach(function (c) {
        ul.appendChild(el('li', null,
          el('div', null, el('strong', { class: 'no-i18n', text: c.teacher }), ' · ', el('span', { text: dayName(c.d) + ' · ' + fmtRange(c.x.sl) })),
          el('div', { class: 'small no-i18n' }, ttName(c.x.tt) + ' (' + sName(c.x.s) + ')  ⇄  ' + ttName(c.y.tt) + ' (' + sName(c.y.s) + ')'),
          el('button', { type: 'button', class: 'btn btn-sm', text: t('open_tt'), onclick: function () { data.cur = c.x.tt.id; swapSel = null; save(); ui.tab = 'grid'; renderAll(); } })));
      });
      cl.appendChild(ul);
    }

    // teacher picker + grid
    if (keys.indexOf(ui.teacher) < 0) ui.teacher = keys[0];
    var sel = $('#teacher-sel');
    sel.innerHTML = '';
    keys.forEach(function (k) { sel.appendChild(el('option', { value: k, text: ci.names[k] })); });
    sel.value = ui.teacher;
    var g = $('#teacher-grid');
    g.innerHTML = '';
    var ttab = teacherTable(ui.teacher, model, false);
    g.appendChild(ttab);
    fitLabels(ttab, ttab.classList.contains('compact'));
    var entries = ci.byT[ui.teacher] || [], per = {};
    entries.forEach(function (x) { per[x.d] = (per[x.d] || 0) + 1; });
    var tsum = $('#teacher-sum');
    tsum.innerHTML = '';
    tsum.appendChild(el('strong', { id: 'teacher-total', text: t('teacher_week', { n: EDU.fmt(entries.length) }) }));
    tsum.appendChild(el('span', { class: 'muted', text: ' · ' + model.days.map(function (d) { return dayName(d, true) + ' ' + EDU.fmt(per[d] || 0); }).join(' · ') }));

    // load table
    var lt = $('#load-table');
    lt.innerHTML = '';
    lt.appendChild(el('thead', null, el('tr', null, el('th', { text: t('col_teacher') }), el('th', { text: t('col_classes') }),
      el('th', { class: 'num', text: t('col_week') }), el('th', { class: 'num', text: t('col_maxday') }), el('th', { class: 'num', text: t('col_clashes') }))));
    var lb = el('tbody');
    keys.forEach(function (k) {
      var es = ci.byT[k] || [], pd = {}, cls = {}, mx = 0, mxd = -1;
      var nm = window.innerWidth < 620 ? ttShort : ttName;
      es.forEach(function (x) { pd[x.d] = (pd[x.d] || 0) + 1; cls[nm(x.tt)] = 1; });
      (ci.subjOf[k] || []).forEach(function (o) { cls[nm(o.tt)] = 1; });
      Object.keys(pd).forEach(function (d) { if (pd[d] > mx) { mx = pd[d]; mxd = +d; } });
      var nc = ci.list.filter(function (c) { return c.k === k; }).length;
      lb.appendChild(el('tr', { class: k === ui.teacher ? 'sel' : null, 'data-k': k },
        el('td', null, el('button', { type: 'button', class: 'linkbtn no-i18n', text: ci.names[k], onclick: function () { ui.teacher = k; saveUi(); renderTeachers(); $('#teacher-sel').focus(); } })),
        el('td', { class: 'small no-i18n cls', text: Object.keys(cls).join(', ') }),
        el('td', { class: 'num', text: EDU.fmt(es.length) }),
        el('td', { class: 'num', text: mxd >= 0 ? dayName(mxd, true) + ' (' + EDU.fmt(mx) + ')' : '–' }),
        el('td', { class: 'num' }, nc ? el('span', { class: 'badge danger', text: EDU.fmt(nc) }) : el('span', { class: 'muted', text: '0' }))));
    });
    lt.appendChild(lb);

    renderFree(model);
  }
  function renderFree(model) {
    var dSel = $('#free-day'), sSel = $('#free-slot'), now = nowInfo();
    var periods = model.slots.filter(function (s) { return s.t === 'p'; });
    var prevD = dSel.value, prevS = sSel.value;
    dSel.innerHTML = ''; sSel.innerHTML = '';
    model.days.forEach(function (d) { dSel.appendChild(el('option', { value: String(d), text: dayName(d) })); });
    periods.forEach(function (sl) { sSel.appendChild(el('option', { value: sl.id, text: t('period_n', { n: EDU.fmt(model.pn[sl.id]) }) + ' · ' + fmtRange(sl) })); });
    if (!model.days.length || !periods.length) { $('#free-list').innerHTML = ''; return; }
    if (prevD && model.days.indexOf(+prevD) >= 0) dSel.value = prevD;
    else dSel.value = String(model.days.indexOf(now.day) >= 0 ? now.day : model.days[0]);
    if (prevS && periods.some(function (p) { return p.id === prevS; })) sSel.value = prevS;
    else {
      var pick = periods.filter(function (p) { return toMin(p.e) > now.min; })[0] || periods[0];
      sSel.value = pick.id;
    }
    showFree(model);
  }
  function showFree(model) {
    var ci = clashInfo(), d = +$('#free-day').value, sid = $('#free-slot').value, sl = null;
    model.slots.forEach(function (s) { if (s.id === sid) sl = s; });
    var box = $('#free-list');
    box.innerHTML = '';
    if (!sl) return;
    var a = toMin(sl.s), b = toMin(sl.e), free = [];
    teacherKeys().forEach(function (k) {
      var es = ci.byT[k] || [];
      if (es.some(function (x) { return x.d === d && x.a < b && a < x.b; })) return;
      free.push({ k: k, n: es.filter(function (x) { return x.d === d; }).length });
    });
    free.sort(function (x, y) { return x.n - y.n || ci.names[x.k].localeCompare(ci.names[y.k]); });
    if (!free.length) { box.appendChild(el('li', { class: 'muted', text: t('free_none') })); return; }
    free.forEach(function (f) {
      box.appendChild(el('li', null, el('strong', { class: 'no-i18n', text: ci.names[f.k] }), ' ', el('span', { class: 'muted small', text: t('free_load', { n: EDU.fmt(f.n) }) })));
    });
  }

  /* ------------------------------------------------------------ TODAY tab */
  function nextActiveDay(tt, d) { for (var i = 0; i < 7; i++) { var x = (d + i) % 7; if (tt.days[x]) return x; } return 0; }
  function renderToday() {
    var tt = cur(), now = nowInfo(), on = tt.days[now.day];
    if (todayDay == null || !tt.days[todayDay]) todayDay = on ? now.day : nextActiveDay(tt, now.day);
    var d = todayDay, isToday = d === now.day;
    $('#today-name').textContent = ttName(tt);
    $('#today-day').textContent = dayName(d) + (isToday ? ' · ' + t('today') : '');
    var seg = $('#today-days');
    seg.innerHTML = '';
    activeDays(tt).forEach(function (x) {
      seg.appendChild(el('button', { type: 'button', 'data-d': x, 'aria-pressed': x === d ? 'true' : 'false', class: x === now.day ? 'is-today' : null, text: dayName(x, true) }));
    });
    var note = $('#today-note');
    note.hidden = on;
    if (!on) note.textContent = t('day_off', { day: dayName(now.day), shown: dayName(d) });

    var pn = periodNums(tt), subj = {};
    tt.subjects.forEach(function (s) { subj[s.id] = s; });
    var curSl = isToday ? slotAt(tt, now.min) : null;
    var valid = tt.slots.filter(function (s) { return dur(s) > 0; });
    var nextSl = null;
    if (isToday) valid.forEach(function (s) { if (!nextSl && toMin(s.s) > now.min && s !== curSl) nextSl = s; });

    // now box
    var box = $('#now-box');
    box.innerHTML = '';
    box.hidden = !isToday;
    function what(sl) {
      if (sl.t === 'b') return slotLabel(sl);
      var s = subj[tt.cells[d + '|' + sl.id]];
      return t('period_n', { n: EDU.fmt(pn[sl.id]) }) + ' · ' + (s ? sName(s) : t('free_period'));
    }
    if (isToday) {
      if (curSl) {
        var s = curSl.t === 'p' ? subj[tt.cells[d + '|' + curSl.id]] : null;
        var left = Math.max(0, Math.ceil(toMin(curSl.e) - now.min)), pct = EDU.clamp((now.min - toMin(curSl.s)) / dur(curSl) * 100, 0, 100);
        box.appendChild(el('div', { class: 'now-card', style: s ? { '--sc': s.color } : null },
          el('div', { class: 'now-k', text: t('now') + ' · ' + fmtRange(curSl) }),
          el('div', { class: 'now-v', id: 'now-what' }, curSl.t === 'p' ? el('span', { text: t('period_n', { n: EDU.fmt(pn[curSl.id]) }) + ' · ' }) : null,
            el('span', { class: 'no-i18n', id: 'now-subj', text: curSl.t === 'b' ? slotLabel(curSl) : (s ? sName(s) : t('free_period')) })),
          s && tt.kind === 'class' && sTeacher(s) ? el('div', { class: 'now-t no-i18n', text: sTeacher(s) }) : null,
          el('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(pct)), 'aria-label': t('time_left', { n: EDU.fmt(left) }) }, el('span', { style: { width: pct.toFixed(1) + '%' } })),
          el('div', { class: 'now-left', id: 'now-left', text: t('time_left', { n: EDU.fmt(left) }) })));
      } else if (valid.length && now.min < toMin(valid[0].s)) {
        box.appendChild(el('div', { class: 'now-card idle' }, el('div', { class: 'now-v', id: 'now-what', text: t('before_start', { time: fmtTime(valid[0].s), n: hm(toMin(valid[0].s) - now.min) }) })));
      } else if (!nextSl) {
        box.appendChild(el('div', { class: 'now-card idle' }, el('div', { class: 'now-v', id: 'now-what', text: t('after_end') })));
      }
      if (nextSl) box.appendChild(el('p', { class: 'now-next', id: 'now-next' }, el('strong', { text: t('next_label') + ': ' }), el('span', { class: 'no-i18n', text: what(nextSl) }), ' · ' + t('at_time', { time: fmtTime(nextSl.s) })));
    }

    // list for the day
    var ol = $('#day-list');
    ol.innerHTML = '';
    tt.slots.forEach(function (sl) {
      var a = toMin(sl.s), b = toMin(sl.e);
      var past = isToday && b != null && b <= now.min, isNow = curSl === sl;
      var s = sl.t === 'p' ? subj[tt.cells[d + '|' + sl.id]] : null;
      var li = el('li', { class: 'dl-row ' + (sl.t === 'b' ? 'is-brk' : '') + (past ? ' past' : '') + (isNow ? ' now' : '') + (s ? '' : (sl.t === 'p' ? ' free' : '')), style: s ? { '--sc': s.color } : null, 'aria-current': isNow ? 'time' : null },
        el('span', { class: 'dl-time', text: fmtRange(sl) }),
        el('span', { class: 'dl-p', text: sl.t === 'p' ? EDU.fmt(pn[sl.id]) : '☕' }),
        el('span', { class: 'dl-main' },
          el('span', { class: 'dl-s no-i18n', text: sl.t === 'b' ? slotLabel(sl) : (s ? sName(s) : t('free_period')) }),
          s && tt.kind === 'class' && sTeacher(s) ? el('span', { class: 'dl-t no-i18n', text: sTeacher(s) }) : null),
        isNow ? el('span', { class: 'tbadge', text: t('now') }) : null);
      ol.appendChild(li);
    });
  }
  function dayText(tt, d) {
    var pn = periodNums(tt), lines = ['*' + ttName(tt) + ' · ' + dayName(d) + '*'];
    tt.slots.forEach(function (sl) {
      if (sl.t === 'b') { lines.push('   ☕ ' + fmtRange(sl) + '  ' + slotLabel(sl)); return; }
      var s = subjById(tt, tt.cells[d + '|' + sl.id]);
      lines.push(EDU.fmt(pn[sl.id]) + ') ' + fmtRange(sl) + '  ' + (s ? sName(s) + (tt.kind === 'class' && sTeacher(s) ? ' – ' + sTeacher(s) : '') : t('free_period')));
    });
    return lines.join('\n');
  }
  function weekText(tt) {
    var parts = ['📅 ' + ttName(tt) + ' – ' + t('weekly_tt') + (data.school ? '\n' + data.school : '')];
    activeDays(tt).forEach(function (d) { parts.push(dayText(tt, d)); });
    return parts.join('\n\n');
  }

  /* ------------------------------------------------------------ print / CSV */
  var printing = false;
  function printBlock(tt) {
    var pn = periodNums(tt), subj = {}, cnt = counts(tt), study = tt.kind === 'study';
    tt.subjects.forEach(function (s) { subj[s.id] = s; });
    var sec = el('section', { class: 'pblock' });
    sec.appendChild(el('div', { class: 'phead' },
      el('div', null, data.school ? el('div', { class: 'pschool', text: data.school }) : null, el('h2', { text: ttName(tt) + ' — ' + t('weekly_tt') })),
      el('div', { class: 'pmeta' }, !study && ctName(tt) ? el('div', { text: t('class_teacher') + ': ' + ctName(tt) }) : null, el('div', { text: t('printed_on', { date: new Date().toLocaleDateString(EDU.langInfo(EDU.lang).tag, { numberingSystem: 'latn', day: 'numeric', month: 'long', year: 'numeric' }) }) }))));
    sec.appendChild(buildTable({
      days: activeDays(tt), slots: tt.slots, pn: pn, orient: 'rows', compact: false, today: -1, cls: 'ptab',
      cellFn: function (d, sl) {
        var s = subj[tt.cells[d + '|' + sl.id]];
        if (!s) return el('td', { class: 'pe' });
        return el('td', { class: 'pc', style: { '--sc': s.color } }, el('div', { class: 'sn', text: sName(s) }), !study && sTeacher(s) ? el('div', { class: 'st', text: sTeacher(s) }) : null);
      }
    }));
    var lg = el('table', { class: 'plegend' });
    lg.appendChild(el('thead', null, el('tr', null, el('th', { text: t('col_subject') }), study ? null : el('th', { text: t('col_teacher') }), el('th', { text: t('col_periods') }))));
    var lb = el('tbody');
    tt.subjects.forEach(function (s) {
      lb.appendChild(el('tr', null, el('td', null, el('span', { class: 'pdot', style: { '--sc': s.color } }), ' ' + sName(s)), study ? null : el('td', { text: sTeacher(s) || '—' }), el('td', { text: EDU.fmt(cnt[s.id] || 0) })));
    });
    lg.appendChild(lb);
    sec.appendChild(el('div', { class: 'pfoot' }, lg, study ? null : el('div', { class: 'psign' }, el('span', { text: t('class_teacher') }), el('span', { text: t('principal') }))));
    return sec;
  }
  function doPrint(blocks) {
    var area = $('#print-area');
    area.innerHTML = '';
    blocks.forEach(function (b) { area.appendChild(b); });
    printing = true;
    try { window.print(); } catch (e) { }
    setTimeout(function () { printing = false; }, 500);
  }
  window.addEventListener('beforeprint', function () {
    if (printing) return;
    var area = $('#print-area');
    area.innerHTML = '';
    area.appendChild(printBlock(cur()));
  });
  function printTeacher() {
    var k = ui.teacher, ci = clashInfo();
    if (!k || !ci.names[k]) return;
    var sec = el('section', { class: 'pblock' });
    sec.appendChild(el('div', { class: 'phead' },
      el('div', null, data.school ? el('div', { class: 'pschool', text: data.school }) : null, el('h2', { text: t('teacher_tt_title', { name: ci.names[k] }) })),
      el('div', { class: 'pmeta' }, el('div', { text: t('teacher_week', { n: EDU.fmt((ci.byT[k] || []).length) }) }))));
    sec.appendChild(teacherTable(k, unionModel(), true));
    doPrint([sec]);
  }
  function fileBase(tt) {
    var n = ttName(tt).replace(/[\\/:*?"<>|]+/g, '').trim().replace(/\s+/g, '-');
    return 'timetable-' + (n || 'class');
  }
  function exportCSV() {
    var tt = cur(), pn = periodNums(tt), study = tt.kind === 'study', cnt = counts(tt), mins = {};
    eachCell(tt, function (d, sl, s) { mins[s.id] = (mins[s.id] || 0) + dur(sl); });
    var rows = [[ttName(tt) + ' – ' + t('weekly_tt')]];
    if (data.school) rows.push([data.school]);
    var hdr = [t('col_day')];
    tt.slots.forEach(function (sl) { hdr.push((sl.t === 'p' ? t('period_n', { n: pn[sl.id] }) : slotLabel(sl)) + ' (' + fmtRange(sl) + ')'); });
    rows.push(hdr);
    activeDays(tt).forEach(function (d) {
      var r = [dayName(d)];
      tt.slots.forEach(function (sl) {
        if (sl.t === 'b') { r.push(slotLabel(sl)); return; }
        var s = subjById(tt, tt.cells[d + '|' + sl.id]);
        r.push(s ? sName(s) + (!study && sTeacher(s) ? ' (' + sTeacher(s) + ')' : '') : '');
      });
      rows.push(r);
    });
    rows.push([]);
    rows.push(study ? [t('col_subject'), t('col_periods'), t('col_time')] : [t('col_subject'), t('col_teacher'), t('col_periods'), t('col_time')]);
    tt.subjects.forEach(function (s) {
      rows.push(study ? [sName(s), cnt[s.id] || 0, hm(mins[s.id] || 0)] : [sName(s), sTeacher(s), cnt[s.id] || 0, hm(mins[s.id] || 0)]);
    });
    EDU.download(fileBase(tt) + '.csv', EDU.csv.stringify(rows), 'text/csv');
    EDU.toast(t('csv_done'));
  }
  function backup() {
    var d = new Date();
    EDU.download('timetables-backup-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '.json',
      JSON.stringify({ app: SLUG, v: 1, data: data }, null, 1), 'application/json');
  }
  function restore() {
    EDU.pickFile('.json,application/json').then(function (f) {
      if (!f) return null;
      if (f.size > 3 * 1024 * 1024) throw new Error('big');
      return EDU.readText(f).then(function (txt) {
        var o = JSON.parse(txt), d = sanitize(o && o.data ? o.data : o);
        if (!d) throw new Error('bad');
        if (!confirm(t('restore_confirm', { n: EDU.fmt(d.tts.length) }))) return;
        data = d; undoStack = []; swapSel = null;
        save(); renderAll();
        EDU.toast(t('restore_ok', { n: EDU.fmt(d.tts.length) }));
      });
    }).catch(function () { EDU.toast(t('restore_bad'), 4000); });
  }

  /* ------------------------------------------------------------ events */
  $('#tt-sel').addEventListener('change', function () { data.cur = this.value; swapSel = null; todayDay = null; save(); renderAll(); });
  $('#new-tt').addEventListener('click', newModal);
  $('#sample-x').addEventListener('click', function () { ui.note = false; saveUi(); $('#sample-note').hidden = true; });
  TABS.forEach(function (tb, i) {
    var b = $('#tab-' + tb);
    b.addEventListener('click', function () { setTab(tb); });
    b.addEventListener('keydown', function (e) {
      var dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!dir) return;
      if (document.documentElement.dir === 'rtl') dir = -dir;
      e.preventDefault();
      setTab(TABS[(i + dir + TABS.length) % TABS.length], true);
    });
  });

  // timetable tab
  $('#mode-seg').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-mode]');
    if (!b) return;
    ui.mode = b.dataset.mode; swapSel = null; saveUi(); renderGridTab();
  });
  $('#palette').addEventListener('click', function (e) {
    var b = e.target.closest('.pchip');
    if (!b) return;
    ui.brush = b.getAttribute('data-sid'); ui.mode = 'paint'; swapSel = null; saveUi();
    $$('#mode-seg button').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.mode === 'paint' ? 'true' : 'false'); });
    $('#mode-help').textContent = t('mode_help_paint');
    renderPalette(cur()); renderGrid(cur());
    var s = subjById(cur(), ui.brush);
    announce(s ? t('brush_is', { name: sName(s) }) : t('eraser'));
  });
  $('#grid').addEventListener('click', function (e) {
    var b = e.target.closest('.cell');
    if (!b) return;
    if (suppressClick) { suppressClick = false; return; }
    var tt = cur(), key = keyOf(b);
    if (ui.mode === 'swap') swapClick(tt, key);
    else if (ui.mode === 'pick') pickModal(tt, key);
    else paintClick(tt, key);
  });
  $('#grid').addEventListener('pointerdown', function (e) {
    if (ui.mode !== 'paint' || e.pointerType === 'touch' || e.button !== 0) return;
    var b = e.target.closest('.cell');
    if (!b) return;
    var tt = cur();
    drag = { tt: tt, start: keyOf(b), moved: false, changed: false, seen: {}, snap: JSON.stringify(tt.cells) };
  });
  document.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var x = document.elementFromPoint(e.clientX, e.clientY), b = x && x.closest ? x.closest('#grid .cell') : null;
    if (!b) return;
    var key = keyOf(b);
    if (!drag.moved) {
      if (key === drag.start) return;
      drag.moved = true;
      dragPaint(drag.start);
    }
    dragPaint(key);
  });
  function endDrag() {
    if (!drag) return;
    var d = drag;
    drag = null;
    if (!d.moved) return;
    suppressClick = true;
    setTimeout(function () { suppressClick = false; }, 0);
    if (d.changed) { pushUndo(d.tt, d.snap); save(); refreshGrid(); }
  }
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);
  $('#undo-btn').addEventListener('click', undo);
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && ui.tab === 'grid' && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '') && !$('.edu-modal')) {
      e.preventDefault(); undo();
    }
    if (e.key === 'Escape' && swapSel) { swapSel = null; refreshGrid(); }
  });
  $('#fs-btn').addEventListener('click', function () { EDU.fullscreen($('#grid-card')); });
  $('#autofill').addEventListener('click', autoFill);
  $('#clear-all').addEventListener('click', function () {
    var tt = cur();
    if (!Object.keys(tt.cells).length) return;
    if (!confirm(t('confirm_clear_all', { name: ttName(tt) }))) return;
    pushUndo(tt); tt.cells = {}; swapSel = null; save(); refreshGrid();
    announce(t('cleared'));
  });
  $('#add-subj').addEventListener('click', addSubject);
  $('#print-tt').addEventListener('click', function () { doPrint([printBlock(cur())]); });
  $('#print-all').addEventListener('click', function () { doPrint(data.tts.map(printBlock)); });
  $('#export-csv').addEventListener('click', exportCSV);
  $('#copy-text').addEventListener('click', function () { EDU.copy(weekText(cur())); });
  $('#backup').addEventListener('click', backup);
  $('#restore').addEventListener('click', restore);

  // setup tab
  $('#tt-name').addEventListener('input', function () {
    var tt = cur();
    tt.name = this.value.trim() ? this.value : ''; tt.nk = null;
    save(); renderTop();
  });
  $('#tt-name').addEventListener('blur', function () { if (!this.value.trim()) this.value = ttName(cur()); });
  $('#kind-seg').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-kind]');
    if (!b) return;
    cur().kind = b.dataset.kind; save(); renderTop(); renderSetup();
  });
  $('#tt-ct').addEventListener('input', function () { var tt = cur(); tt.ct = this.value; tt.ctk = null; save(); });
  $('#days-box').addEventListener('click', function (e) {
    var b = e.target.closest('.day-chip');
    if (!b) return;
    var tt = cur(), d = +b.getAttribute('data-d');
    if (tt.days[d] && activeDays(tt).length === 1) { EDU.toast(t('need_one_day')); return; }
    tt.days[d] = !tt.days[d];
    save();
    b.setAttribute('aria-pressed', tt.days[d] ? 'true' : 'false');
  });
  $('#clock-seg').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-h24]');
    if (!b) return;
    ui.h24 = b.dataset.h24 === '1'; saveUi(); renderSetup();
  });
  $('#layout-seg').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-layout]');
    if (!b) return;
    ui.layout = b.dataset.layout; saveUi(); renderSetup();
  });
  $('#show-t').addEventListener('change', function () { ui.showT = this.checked; saveUi(); });
  $('#school').addEventListener('input', function () { data.school = this.value.slice(0, 160); save(); });
  $('#add-period').addEventListener('click', function () { addSlot('p'); });
  $('#add-break').addEventListener('click', function () { addSlot('b'); });
  $('#recalc').addEventListener('click', function () {
    var tt = cur(), st = $('#auto-start').value, len = parseInt($('#auto-len').value, 10);
    if (toMin(st) == null) { EDU.toast(t('time_bad')); return; }
    len = EDU.clamp(isFinite(len) ? len : 40, 5, 240);
    retime(tt, st, len);
    save(); renderSetup();
    EDU.toast(t('recalc_done'));
  });
  $('#dup-tt').addEventListener('click', function () { addTT(duplicate(cur())); });
  $('#del-tt').addEventListener('click', deleteTT);
  $('#reset-all').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    data = sampleData(); undoStack = []; swapSel = null; todayDay = null; ui.note = true; ui.teacher = '';
    save(); saveUi(); ui.tab = 'grid'; renderAll();
  });

  // teachers tab
  $('#teacher-sel').addEventListener('change', function () { ui.teacher = this.value; saveUi(); renderTeachers(); });
  $('#print-teacher').addEventListener('click', printTeacher);
  $('#free-day').addEventListener('change', function () { showFree(unionModel()); });
  $('#free-slot').addEventListener('change', function () { showFree(unionModel()); });

  // today tab
  $('#today-days').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-d]');
    if (!b) return;
    todayDay = +b.getAttribute('data-d'); renderToday();
  });
  $('#copy-day').addEventListener('click', function () { renderToday(); EDU.copy(dayText(cur(), todayDay)); });
  $('#today-fs').addEventListener('click', function () { EDU.fullscreen($('#today-card')); });

  // keep "now" fresh, and re-layout when the screen size changes
  var lastMinute = -1;
  setInterval(function () {
    var m = Math.floor(nowInfo().min);
    if (m === lastMinute || drag || $('.edu-modal')) return;
    lastMinute = m;
    if (ui.tab === 'today') renderToday();
    else if (ui.tab === 'grid') renderGrid(cur());
  }, 10000);
  var lastShape = '';
  function shape() { var tt = cur(), o = orientation(); return o + isCompact(tt, o); }
  var rz;
  window.addEventListener('resize', function () {
    clearTimeout(rz);
    rz = setTimeout(function () {
      var s = shape();
      if (s === lastShape) return;
      lastShape = s;
      if (ui.tab === 'grid') renderGrid(cur());
      else if (ui.tab === 'teachers') renderTeachers();
    }, 150);
  });
  lastShape = shape();

  EDU.onLang(function () { clashCache = null; renderAll(); });
  renderAll();
})();
