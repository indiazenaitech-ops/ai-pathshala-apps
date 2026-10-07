/* Seating Chart Maker: classroom and exam seating planner.
   Everything stays in this browser (EDU.store). No uploads, no network.
   Data model (saved as one object):
     classes: [{ id, name, nameKey?, sample?, students: [{ id, k?, name, roll, gender: 'M'|'F'|'', marks: number|null, needs: { front, glasses, left } }], apart: [[idA, idB]] }]
     rooms:   [{ id, name, nameKey?, layout: rows|pairs|groups|ushape|exam, rows, cols, sets }]
     charts:  { '<roomId>|<classId>': [studentId|null per seat, in seat order] }
   Sample students carry k = index into APP_CONTENT[lang].names, so their names follow the language. */
(function () {
  'use strict';
  var SLUG = 'seating-chart-maker';
  EDU.init({ slug: SLUG, title: 'app_title', wide: true });
  var t = EDU.t, $ = EDU.$, el = EDU.el;
  var store = EDU.store(SLUG);
  var MAX_STUDENTS = 300, MAX_ROWS = 20, MAX_COLS = 14;
  var LAYOUTS = ['pairs', 'rows', 'groups', 'ushape', 'exam'];

  /* ---------- example class (language-independent details; names come from content.js) ---------- */
  var SAMPLE_MARKS = [78, 91, 64, 88, 55, 72, 69, 95, 47, 83, 61, 76, 58, 90, 66, 81, 52, 74, 70, 86, 45, 93, 63, 68, 57, 79, 50, 84, 73, 60];
  var SAMPLE_NEEDS = { 3: { front: true, glasses: true }, 6: { left: true }, 13: { glasses: true }, 18: { glasses: true }, 22: { front: true }, 25: { left: true } };

  function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3); }
  function contentNames() { var C = window.APP_CONTENT || {}; return (C[EDU.lang] || C.en || { names: [] }).names; }

  function sampleClass() {
    var names = contentNames();
    var students = names.map(function (n, i) {
      var nd = SAMPLE_NEEDS[i] || {};
      return { id: 's' + (i + 1), k: i, name: n, roll: String(i + 1), gender: i % 2 ? 'F' : 'M', marks: SAMPLE_MARKS[i], needs: { front: !!nd.front, glasses: !!nd.glasses, left: !!nd.left } };
    });
    return { id: 'c-sample', nameKey: 'sample_class', name: '', sample: true, students: students, apart: [['s5', 's9']] };
  }
  function sampleRoom() { return { id: 'r-sample', nameKey: 'sample_room', name: '', layout: 'pairs', rows: 5, cols: 6, sets: false }; }
  function freshState() {
    return { classes: [sampleClass()], rooms: [sampleRoom()], charts: {}, cur: { cls: 'c-sample', room: 'r-sample' }, order: 'roll', boygirl: false, front: true, tab: 'chart' };
  }

  /* ---------- load + validate saved data ---------- */
  function num(v, lo, hi, d) { v = parseInt(v, 10); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; }
  function cleanStudent(s) {
    if (!s || typeof s !== 'object') return null;
    var nd = s.needs || {};
    var m = s.marks === null || s.marks === '' || s.marks === undefined ? null : Number(s.marks);
    var o = { id: String(s.id || uid()), name: String(s.name || '').slice(0, 80), roll: String(s.roll == null ? '' : s.roll).slice(0, 20),
      gender: s.gender === 'M' || s.gender === 'F' ? s.gender : '', marks: isFinite(m) ? m : null, needs: { front: !!nd.front, glasses: !!nd.glasses, left: !!nd.left } };
    if (typeof s.k === 'number' && s.k >= 0) o.k = s.k;
    if (!o.name && o.k === undefined) return null;
    return o;
  }
  function load() {
    var d = store.get('data', null);
    if (!d || !Array.isArray(d.classes) || !Array.isArray(d.rooms)) return freshState();
    var st = freshState();
    st.classes = d.classes.filter(function (c) { return c && c.id; }).map(function (c) {
      var studs = (Array.isArray(c.students) ? c.students : []).map(cleanStudent).filter(Boolean);
      var ids = {}; studs.forEach(function (s) { ids[s.id] = 1; });
      return { id: String(c.id), name: String(c.name || ''), nameKey: c.nameKey === 'sample_class' ? 'sample_class' : undefined, sample: !!c.sample,
        students: studs, apart: (Array.isArray(c.apart) ? c.apart : []).filter(function (p) { return Array.isArray(p) && ids[p[0]] && ids[p[1]] && p[0] !== p[1]; }) };
    });
    st.rooms = d.rooms.filter(function (r) { return r && r.id; }).map(function (r) {
      return { id: String(r.id), name: String(r.name || ''), nameKey: r.nameKey === 'sample_room' ? 'sample_room' : undefined,
        layout: LAYOUTS.indexOf(r.layout) >= 0 ? r.layout : 'pairs', rows: num(r.rows, 1, MAX_ROWS, 5), cols: num(r.cols, 1, MAX_COLS, 6), sets: !!r.sets };
    });
    if (!st.classes.length) st.classes = [sampleClass()];
    if (!st.rooms.length) st.rooms = [sampleRoom()];
    st.charts = d.charts && typeof d.charts === 'object' ? d.charts : {};
    var cur = d.cur || {};
    st.cur = { cls: findById(st.classes, cur.cls) ? cur.cls : st.classes[0].id, room: findById(st.rooms, cur.room) ? cur.room : st.rooms[0].id };
    st.order = ['roll', 'alpha', 'random', 'mixed'].indexOf(d.order) >= 0 ? d.order : 'roll';
    st.boygirl = !!d.boygirl; st.front = d.front !== false; st.tab = d.tab === 'students' ? 'students' : 'chart';
    return st;
  }
  function findById(arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i]; return null; }

  var S = load();
  var undoStack = {};          // chart key → previous seat arrays (this visit only)
  var lastWarn = [];           // warnings from the last "Arrange" (marks / gender)
  var selected = null;         // { kind: 'seat', i } or { kind: 'stu', id }
  function save() { store.set('data', S); }

  function cls() { return findById(S.classes, S.cur.cls) || S.classes[0]; }
  function room() { return findById(S.rooms, S.cur.room) || S.rooms[0]; }
  function chartKey() { return room().id + '|' + cls().id; }
  function className(c) { return c.nameKey && !c.name ? t(c.nameKey) : (c.name || t('new_class_name', { n: S.classes.indexOf(c) + 1 })); }
  function roomName(r) { return r.nameKey && !r.name ? t(r.nameKey) : (r.name || t('new_room_name', { n: S.rooms.indexOf(r) + 1 })); }
  function stuName(s) { if (s.k !== undefined) { var n = contentNames()[s.k]; if (n) return n; } return s.name; }
  function stuById(id) { var a = cls().students; for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }

  /* ---------- room geometry ----------
     Seats are listed in "fill order" (front of the room first). Each seat has a logical position (r, c), a
     display grid cell (dr, dc), a paper set parity and a list of neighbours (beside, in front, behind). */
  function geom(rm) {
    var R = rm.rows, C = rm.cols, L = rm.layout, seats = [], i;
    if (L === 'ushape') {
      var path = [];
      for (i = 0; i < R; i++) path.push({ r: i, c: 0 });
      for (i = 0; i < C; i++) path.push({ r: R, c: i + 1 });
      for (i = R - 1; i >= 0; i--) path.push({ r: i, c: C + 1 });
      path.forEach(function (p, k) { p.p = k; p.dr = p.r; p.dc = p.c; p.par = k % 2; });
      seats = path.slice().sort(function (a, b) { return a.r - b.r || a.c - b.c; });
      var byP = {}; seats.forEach(function (s, k) { byP[s.p] = k; });
      seats.forEach(function (s) { s.adj = []; if (byP[s.p - 1] !== undefined) s.adj.push(byP[s.p - 1]); if (byP[s.p + 1] !== undefined) s.adj.push(byP[s.p + 1]); });
      return { seats: seats, dcols: C + 2, drows: R + 1, gapC: {}, gapR: {} };
    }
    var gapC = {}, gapR = {}, dcols = C, drows = R;
    var dcOf = function (c) { return c; }, drOf = function (r) { return r; };
    if (L === 'pairs' || L === 'groups') { dcOf = function (c) { return c + Math.floor(c / 2); }; dcols = dcOf(C - 1) + 1; for (i = 2; i < C; i += 2) gapC[dcOf(i) - 1] = 1; }
    if (L === 'groups') { drOf = function (r) { return r + Math.floor(r / 2); }; drows = drOf(R - 1) + 1; for (i = 2; i < R; i += 2) gapR[drOf(i) - 1] = 1; }
    var at = {};
    for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) { at[r + ',' + c] = seats.length; seats.push({ r: r, c: c, dr: drOf(r), dc: dcOf(c), par: (r + c) % 2 }); }
    seats.forEach(function (s) {
      s.adj = [];
      [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(function (d) { var k = at[(s.r + d[0]) + ',' + (s.c + d[1])]; if (k !== undefined) s.adj.push(k); });
      if (L === 'groups') {   // everyone at the same table of 4 counts as a neighbour
        [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (d) {
          var r2 = s.r + d[0], c2 = s.c + d[1];
          if (Math.floor(r2 / 2) === Math.floor(s.r / 2) && Math.floor(c2 / 2) === Math.floor(s.c / 2)) { var k = at[r2 + ',' + c2]; if (k !== undefined) s.adj.push(k); }
        });
      }
    });
    return { seats: seats, dcols: dcols, drows: drows, gapC: gapC, gapR: gapR };
  }
  function setOf(seat) { return seat.par ? 'B' : 'A'; }

  /* ---------- the current chart (always the right length, only known students, no duplicates) ---------- */
  function getChart() {
    var g = geom(room()), key = chartKey(), arr = S.charts[key];
    if (!Array.isArray(arr)) return null;
    var seen = {}, out = [];
    for (var i = 0; i < g.seats.length; i++) {
      var id = arr[i];
      if (id && stuById(id) && !seen[id]) { seen[id] = 1; out.push(id); } else out.push(null);
    }
    return out;
  }
  function setChart(arr, noUndo) {
    var key = chartKey();
    if (!noUndo) { var prev = getChart(); if (prev) { (undoStack[key] = undoStack[key] || []).push(prev); if (undoStack[key].length > 40) undoStack[key].shift(); } }
    S.charts[key] = arr; save();
  }

  /* ---------- arranging ---------- */
  function cmpRoll(a, b) {
    var x = parseFloat(a.roll), y = parseFloat(b.roll);
    var nx = /^\s*\d+(\.\d+)?\s*$/.test(a.roll), ny = /^\s*\d+(\.\d+)?\s*$/.test(b.roll);
    if (nx && ny && x !== y) return x - y;
    if (!a.roll !== !b.roll) return a.roll ? -1 : 1;     // students without a roll number go last
    return String(a.roll).localeCompare(String(b.roll), undefined, { numeric: true }) || 0;
  }
  function ordered(students, order) {
    var list = students.slice();
    var coll;
    try { coll = new Intl.Collator(EDU.langInfo(EDU.lang).tag || 'en', { sensitivity: 'base', numeric: true }); } catch (e) { coll = new Intl.Collator('en'); }
    if (order === 'alpha') list.sort(function (a, b) { return coll.compare(stuName(a), stuName(b)) || cmpRoll(a, b); });
    else if (order === 'random') list = EDU.shuffle(list);
    else if (order === 'mixed') {
      var known = list.filter(function (s) { return s.marks !== null; });
      var avg = known.length ? known.reduce(function (a, s) { return a + s.marks; }, 0) / known.length : 0;
      var mk = function (s) { return s.marks === null ? avg : s.marks; };
      list.sort(function (a, b) { return mk(b) - mk(a) || cmpRoll(a, b); });
      var mixed = [], lo = 0, hi = list.length - 1;
      while (lo <= hi) { mixed.push(list[lo++]); if (lo <= hi) mixed.push(list[hi--]); }   // strongest, weakest, 2nd strongest, 2nd weakest…
      list = mixed;
    } else list.sort(cmpRoll);
    return list;
  }

  function violations(arr, seats, pairs) {
    var pos = {}, out = [];
    arr.forEach(function (id, i) { if (id) pos[id] = i; });
    pairs.forEach(function (p) {
      var a = pos[p[0]], b = pos[p[1]];
      if (a !== undefined && b !== undefined && seats[a].adj.indexOf(b) >= 0) out.push(p);
    });
    return out;
  }

  /* Move students out of keep-apart conflicts with as little disturbance as possible. */
  function repairApart(arr, seats, pairs, opts) {
    var guard = 0;
    while (guard++ < 400) {
      var bad = violations(arr, seats, pairs);
      if (!bad.length) return [];
      var best = null;
      bad.forEach(function (p) {
        [p[1], p[0]].forEach(function (x) {
          var from = arr.indexOf(x), sx = stuById(x);
          for (var j = 0; j < arr.length; j++) {
            if (j === from) continue;
            var y = arr[j], sy = y ? stuById(y) : null;
            var trial = arr.slice(); trial[from] = y; trial[j] = x;
            var n = violations(trial, seats, pairs).length;
            if (n >= bad.length) continue;
            var cost = n * 1000 + Math.abs(seats[j].r - seats[from].r) + Math.abs(seats[j].c - seats[from].c) * 0.5;
            if (opts.boygirl && sy && sx.gender !== sy.gender) cost += 40;
            if (opts.boygirl && !sy && seats[j].par !== seats[from].par) cost += 20;
            if (opts.front && sx.needs.front !== (sy ? sy.needs.front : false)) cost += 60;
            if (!best || cost < best.cost) best = { cost: cost, trial: trial };
          }
        });
      });
      if (!best) return bad;
      for (var i = 0; i < arr.length; i++) arr[i] = best.trial[i];
    }
    return violations(arr, seats, pairs);
  }

  function arrange() {
    var c = cls(), g = geom(room()), seats = g.seats, N = seats.length;
    var list = ordered(c.students, S.order);
    lastWarn = [];
    if (S.order === 'mixed' && c.students.some(function (s) { return s.marks === null; })) lastWarn.push(t('warn_nomarks'));
    var bg = S.boygirl;
    if (bg && !c.students.some(function (s) { return s.gender; })) { lastWarn.push(t('warn_nogender')); bg = false; }
    var pools = S.front ? [list.filter(function (s) { return s.needs.front; }), list.filter(function (s) { return !s.needs.front; })] : [list];
    // boy–girl: the larger group gets the "even" seats (seat 1 is even)
    var boys = c.students.filter(function (s) { return s.gender === 'M'; }).length, girls = c.students.filter(function (s) { return s.gender === 'F'; }).length;
    var evenG = boys >= girls ? 'M' : 'F', oddG = evenG === 'M' ? 'F' : 'M';
    var arr = new Array(N).fill(null);
    for (var i = 0; i < N; i++) {
      var pool = pools[0].length ? pools[0] : (pools[1] || []);
      if (!pool.length) break;
      var k = 0;
      if (bg) {
        var want = seats[i].par ? oddG : evenG;
        k = pool.findIndex(function (s) { return s.gender === want; });
        if (k < 0) k = pool.findIndex(function (s) { return !s.gender; });
        if (k < 0) k = 0;
      }
      arr[i] = pool.splice(k, 1)[0].id;
    }
    repairApart(arr, seats, c.apart, { boygirl: bg, front: S.front });
    setChart(arr);
    selected = null;
    var seated = arr.filter(Boolean).length;
    EDU.toast(t('arranged', { n: seated }));
    render();
  }

  /* After a room change, keep the seated order and flow it into the new seats. */
  function reflow(oldRoom) {
    S.classes.forEach(function (c) {
      var key = room().id + '|' + c.id, arr = S.charts[key];
      if (!Array.isArray(arr)) return;
      var ids = arr.filter(Boolean), n = geom(room()).seats.length, out = new Array(n).fill(null);
      for (var i = 0; i < n && i < ids.length; i++) out[i] = ids[i];
      S.charts[key] = out;
    });
    undoStack = {};
  }

  /* ---------- parsing a pasted list ---------- */
  var RE_M = /^(m|male|boy|b|पु|पुरुष|लड़का|छात्र)$/i, RE_F = /^(f|female|girl|g|स्त्री|लड़की|छात्रा)$/i;
  function needWords(key) { return [t(key)].concat({ need_front: ['front', 'front row'], need_glasses: ['glasses', 'specs', 'spectacles'], need_left: ['left', 'left-handed', 'left handed', 'lefty'] }[key]); }
  function parseList(text) {
    var lines = String(text || '').replace(/^﻿/, '').split(/\r?\n/), out = [];
    lines.forEach(function (line, li) {
      if (!line.trim()) return;
      var delim = line.indexOf('\t') >= 0 ? '\t' : (line.indexOf(';') >= 0 && line.indexOf(',') < 0 ? ';' : ',');
      var f = EDU.csv.parse(line.replace(new RegExp(delim === '\t' ? '\t' : delim, 'g'), ','))[0] || [];
      f = f.map(function (x) { return String(x).trim(); });
      var name = (f[0] || '').replace(/^\d+[.)]\s+/, '').trim();
      if (!name) return;
      if (li === 0 && /^(name|names|student|student name|नाम)$/i.test(name) || name === t('col_name') || name === t('student_name')) return;
      var s = { name: name.slice(0, 80), roll: '', gender: '', marks: null, needs: { front: false, glasses: false, left: false } };
      var nums = 0;
      f.slice(1).forEach(function (v) {
        if (!v) { nums++; return; }   // an empty column keeps its place (roll, then marks)
        var lv = v.toLowerCase();
        if (RE_M.test(v) || v === t('gender_m')) { s.gender = 'M'; return; }
        if (RE_F.test(v) || v === t('gender_f')) { s.gender = 'F'; return; }
        if (/^-?\d+(\.\d+)?$/.test(v)) { if (nums === 0) s.roll = v; else if (s.marks === null) s.marks = parseFloat(v); nums++; return; }
        var hit = false;
        v.split(/[\/|+]/).forEach(function (part) {
          var p = part.trim().toLowerCase();
          if (!p) return;
          ['need_front', 'need_glasses', 'need_left'].forEach(function (key) {
            if (needWords(key).some(function (w) { return w && p === String(w).toLowerCase(); })) { s.needs[key.slice(5)] = true; hit = true; }
          });
        });
        if (!hit && nums === 0 && /^[\w\-\/]{1,12}$/.test(v)) { s.roll = v; nums++; }
      });
      out.push(s);
    });
    return out;
  }
  function serialize(c) {
    return c.students.map(function (s) {
      var f = [stuName(s), s.roll, s.gender, s.marks === null ? '' : s.marks];
      var nd = []; if (s.needs.front) nd.push('front'); if (s.needs.glasses) nd.push('glasses'); if (s.needs.left) nd.push('left-handed');
      f.push(nd.join(' / '));
      while (f.length > 1 && (f[f.length - 1] === '' || f[f.length - 1] === null)) f.pop();
      return f.map(function (x) { x = String(x); return /[,"]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; }).join(', ');
    }).join('\n');
  }
  function applyList(parsed) {
    var c = cls();
    if (parsed.length > MAX_STUDENTS) { EDU.toast(t('too_many', { n: MAX_STUDENTS })); parsed = parsed.slice(0, MAX_STUDENTS); }
    var old = c.students.slice(), used = {};
    c.students = parsed.map(function (p) {
      var m = old.find(function (o) { return !used[o.id] && stuName(o) === p.name && (o.roll === p.roll || !p.roll || !o.roll); });
      var id = m ? m.id : uid();
      used[id] = 1;
      return { id: id, name: p.name, roll: p.roll, gender: p.gender, marks: p.marks, needs: p.needs };
    });
    var ids = {}; c.students.forEach(function (s) { ids[s.id] = 1; });
    c.apart = c.apart.filter(function (p) { return ids[p[0]] && ids[p[1]]; });
    c.sample = false;
    save();
    EDU.toast(t('list_saved', { n: c.students.length }));
    renderAll();
  }

  /* ---------- rendering ---------- */
  var roomEl = $('#room');
  function fillSelect(sel, items, nameFn, cur) {
    sel.textContent = '';
    items.forEach(function (it) { var o = el('option', { value: it.id, text: nameFn(it) }); if (it.id === cur) o.selected = true; sel.appendChild(o); });
  }

  function renderPickers() {
    fillSelect($('#classSel'), S.classes, className, cls().id);
    fillSelect($('#roomSel'), S.rooms, roomName, room().id);
    $('#tabChart').setAttribute('aria-selected', S.tab === 'chart');
    $('#tabStudents').setAttribute('aria-selected', S.tab === 'students');
    $('#viewChart').hidden = S.tab !== 'chart';
    $('#viewStudents').hidden = S.tab !== 'students';
    $('#sampleNote').hidden = !cls().sample;
  }

  function renderRoomForm() {
    var r = room();
    var rn = $('#roomName'); if (document.activeElement !== rn) rn.value = r.name || (r.nameKey ? t(r.nameKey) : '');
    EDU.$$('#layoutSeg button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.lay === r.layout); });
    $('#rowsIn').value = r.rows; $('#colsIn').value = r.cols;
    $('#setsChk').checked = !!r.sets;
    $('#capacity').textContent = t('capacity', { s: EDU.fmt(geom(r).seats.length), n: EDU.fmt(cls().students.length) });
    $('#orderSel').value = S.order;
    $('#optBoyGirl').checked = S.boygirl; $('#optFront').checked = S.front;
    $('#arrangeBtn').textContent = t(S.order === 'random' && getChart() ? 'shuffle_btn' : 'arrange_btn');
  }

  function seatEl(i, seat, sid, showSets) {
    var s = sid ? stuById(sid) : null;
    var b = el('button', { type: 'button', class: 'seat' + (s ? '' : ' empty') + (s && s.gender ? ' g-' + s.gender : ''), dataset: { i: String(i) },
      style: { gridRow: String(seat.dr + 1), gridColumn: String(seat.dc + 1) } });
    b.appendChild(el('span', { class: 'no', text: EDU.fmt(i + 1) }));
    if (showSets) b.appendChild(el('span', { class: 'st ' + setOf(seat), text: setOf(seat) }));
    if (s) {
      b.appendChild(el('span', { class: 'nm', text: stuName(s) }));
      if (s.roll) b.appendChild(el('span', { class: 'rl', text: s.roll }));
      var ic = (s.needs.front ? '⬆' : '') + (s.needs.glasses ? '👓' : '') + (s.needs.left ? '✋' : '');
      if (ic) b.appendChild(el('span', { class: 'ic', 'aria-hidden': 'true', text: ic }));
      b.setAttribute('aria-label', t('seat_aria', { n: i + 1, name: stuName(s) }));
    } else {
      b.appendChild(el('span', { class: 'nm', text: t('seat_empty') }));
      b.setAttribute('aria-label', t('seat_aria_empty', { n: i + 1 }));
    }
    if (selected && selected.kind === 'seat' && selected.i === i) b.classList.add('sel');
    return b;
  }

  function renderChart() {
    var r = room(), c = cls(), g = geom(r), arr = getChart();
    roomEl.className = 'room no-i18n' + (r.layout === 'exam' ? ' exam' : '');
    var cols = [], rows = [], i;
    for (i = 0; i < g.dcols; i++) cols.push(g.gapC[i] ? '10px' : 'minmax(var(--seat-w), 1fr)');
    for (i = 0; i < g.drows; i++) rows.push(g.gapR[i] ? '10px' : 'auto');
    roomEl.style.gridTemplateColumns = cols.join(' ');
    roomEl.style.gridTemplateRows = rows.join(' ');
    roomEl.setAttribute('aria-label', t('chart_title'));
    roomEl.textContent = '';
    var bad = arr ? violations(arr, g.seats, c.apart) : [];
    var badIds = {}; bad.forEach(function (p) { badIds[p[0]] = badIds[p[1]] = 1; });
    g.seats.forEach(function (seat, k) {
      var sid = arr ? arr[k] : null, b = seatEl(k, seat, sid, r.sets);
      if (sid && badIds[sid]) b.classList.add('bad');
      roomEl.appendChild(b);
    });
    // unseated students
    var seatedIds = {}; (arr || []).forEach(function (id) { if (id) seatedIds[id] = 1; });
    var un = c.students.filter(function (s) { return !seatedIds[s.id]; });
    var box = $('#unseatedBox'), chips = $('#unseated');
    box.hidden = !un.length || !arr;
    chips.textContent = '';
    if (arr) un.forEach(function (s) {
      var b = el('button', { type: 'button', class: 'btn btn-sm' + (selected && selected.kind === 'stu' && selected.id === s.id ? ' btn-primary' : ''), dataset: { id: s.id }, text: stuName(s) + (s.roll ? ' (' + s.roll + ')' : '') });
      b.addEventListener('click', function () { selected = selected && selected.id === s.id ? null : { kind: 'stu', id: s.id }; renderChart(); if (selected) EDU.toast(t('select_hint')); });
      chips.appendChild(b);
    });
    // legend
    var lg = $('#legend'); lg.textContent = '';
    var any = function (f) { return c.students.some(f); };
    if (any(function (s) { return s.gender === 'M'; })) lg.appendChild(el('span', {}, el('span', { class: 'sw', style: { background: 'var(--c1)' } }), t('legend_boy')));
    if (any(function (s) { return s.gender === 'F'; })) lg.appendChild(el('span', {}, el('span', { class: 'sw', style: { background: 'var(--c2)' } }), t('legend_girl')));
    if (any(function (s) { return s.needs.front; })) lg.appendChild(el('span', { text: '⬆ ' + t('legend_front') }));
    if (any(function (s) { return s.needs.glasses; })) lg.appendChild(el('span', { text: '👓 ' + t('legend_glasses') }));
    if (any(function (s) { return s.needs.left; })) lg.appendChild(el('span', { text: '✋ ' + t('legend_left') }));
    if (r.sets) lg.appendChild(el('span', { text: 'A / B: ' + t('legend_sets') }));
    // status + warnings
    var seated = Object.keys(seatedIds).length;
    $('#status').textContent = t('chart_status', { seated: EDU.fmt(seated), n: EDU.fmt(c.students.length), empty: EDU.fmt(g.seats.length - seated) });
    var w = lastWarn.slice();
    if (arr && un.length) w.unshift(t('warn_unseated', { n: EDU.fmt(un.length) }));
    if (bad.length) w.unshift(t('warn_apart', { pairs: bad.map(function (p) { return stuName(stuById(p[0])) + ' – ' + stuName(stuById(p[1])); }).join(', ') }));
    var warn = $('#warn'); warn.textContent = '';
    w.forEach(function (x) { warn.appendChild(el('div', { text: x })); });
    $('#undoBtn').disabled = !(undoStack[chartKey()] || []).length;
  }

  function needsText(s) {
    var a = []; if (s.needs.front) a.push(t('need_front')); if (s.needs.glasses) a.push(t('need_glasses')); if (s.needs.left) a.push(t('need_left'));
    return a.join(', ');
  }
  function renderStudents() {
    var c = cls();
    var cn = $('#className'); if (document.activeElement !== cn) cn.value = c.name || (c.nameKey ? t(c.nameKey) : '');
    var ta = $('#names'); if (document.activeElement !== ta) ta.value = serialize(c);
    $('#stuCount').textContent = c.students.length ? t('students_n', { n: EDU.fmt(c.students.length) }) : t('no_students');
    var tb = $('#stuTable tbody'); tb.textContent = '';
    c.students.forEach(function (s, i) {
      var tr = el('tr', { tabindex: '0', dataset: { id: s.id } },
        el('td', { text: EDU.fmt(i + 1) }),
        el('td', { class: 'no-i18n', text: stuName(s) }),
        el('td', { class: 'no-i18n', text: s.roll }),
        el('td', { text: s.gender === 'M' ? t('gender_m') : s.gender === 'F' ? t('gender_f') : '' }),
        el('td', { text: s.marks === null ? '' : EDU.fmt(s.marks) }),
        el('td', { class: 'small', text: needsText(s) }));
      tr.addEventListener('click', function () { editStudent(s.id); });
      tr.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); editStudent(s.id); } });
      tb.appendChild(tr);
    });
    // keep-apart
    var opts = function (sel) {
      var v = sel.value; sel.textContent = '';
      c.students.forEach(function (s) { sel.appendChild(el('option', { value: s.id, text: stuName(s) + (s.roll ? ' (' + s.roll + ')' : '') })); });
      if (v && stuById(v)) sel.value = v;
    };
    opts($('#apartA')); opts($('#apartB'));
    if ($('#apartA').value === $('#apartB').value && c.students.length > 1) $('#apartB').selectedIndex = 1;
    var ul = $('#pairs'); ul.textContent = '';
    c.apart.forEach(function (p, k) {
      var a = stuById(p[0]), b = stuById(p[1]);
      if (!a || !b) return;
      ul.appendChild(el('li', {}, el('span', { class: 'no-i18n', text: stuName(a) + ' ↔ ' + stuName(b) }),
        el('button', { type: 'button', class: 'btn btn-sm btn-ghost', 'aria-label': t('remove_pair'), title: t('remove_pair'), text: '✕',
          onclick: function () { c.apart.splice(k, 1); save(); renderAll(); } })));
    });
  }

  function renderAll() { renderPickers(); renderRoomForm(); renderChart(); renderStudents(); }
  function render() { renderPickers(); renderRoomForm(); renderChart(); }

  /* ---------- seat interaction: tap–tap, drag, keyboard ---------- */
  function placeOrSwap(toIdx) {
    var arr = getChart(); if (!arr) arr = new Array(geom(room()).seats.length).fill(null);
    if (!selected) return;
    if (selected.kind === 'seat') {
      var from = selected.i;
      if (from === toIdx) { selected = null; renderChart(); return; }
      var a = arr[from], b = arr[toIdx];
      arr[from] = b; arr[toIdx] = a;
      setChart(arr);
      EDU.toast(t(b ? 'swapped' : 'moved'));
    } else {
      arr[toIdx] = selected.id;    // the person already on that seat (if any) becomes unseated
      setChart(arr);
      EDU.toast(t('moved'));
    }
    selected = null;
    renderChart();
    var f = roomEl.querySelector('[data-i="' + toIdx + '"]'); if (f) f.focus();
  }
  function onSeatTap(i) {
    var arr = getChart();
    if (!selected) {
      if (!arr || !arr[i]) return;          // nothing to pick up on an empty seat
      selected = { kind: 'seat', i: i };
      renderChart();
      EDU.toast(t('select_hint'));
      var f = roomEl.querySelector('[data-i="' + i + '"]'); if (f) f.focus();
      return;
    }
    placeOrSwap(i);
  }
  function unseat(i) {
    var arr = getChart(); if (!arr || !arr[i]) return;
    var s = stuById(arr[i]); arr[i] = null; setChart(arr); selected = null;
    EDU.toast(t('unseated_one', { name: stuName(s) }));
    renderChart();
    var f = roomEl.querySelector('[data-i="' + i + '"]'); if (f) f.focus();
  }

  var drag = null, suppressClick = false;
  roomEl.addEventListener('pointerdown', function (e) {
    var b = e.target.closest('.seat'); if (!b || e.button > 0) return;
    var arr = getChart(), i = +b.dataset.i;
    if (!arr || !arr[i]) return;
    drag = { i: i, x: e.clientX, y: e.clientY, on: false, ghost: null, over: null };
  });
  window.addEventListener('pointermove', function (e) {
    if (!drag) return;
    if (!drag.on && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) {
      drag.on = true;
      drag.ghost = el('div', { class: 'ghost no-i18n', text: stuName(stuById(getChart()[drag.i])) });
      document.body.appendChild(drag.ghost);
    }
    if (drag.on) {
      e.preventDefault();
      drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px';
      var under = document.elementFromPoint(e.clientX, e.clientY), s = under && under.closest ? under.closest('#room .seat') : null;
      if (drag.over && drag.over !== s) drag.over.classList.remove('drop');
      if (s) s.classList.add('drop');
      drag.over = s;
    }
  });
  function endDrag(e, cancel) {
    if (!drag) return;
    var d = drag; drag = null;
    if (d.ghost) d.ghost.remove();
    if (d.over) d.over.classList.remove('drop');
    if (!d.on) return;
    suppressClick = true; setTimeout(function () { suppressClick = false; }, 50);
    if (cancel || !d.over) return;
    selected = { kind: 'seat', i: d.i };
    placeOrSwap(+d.over.dataset.i);
  }
  window.addEventListener('pointerup', function (e) { endDrag(e, false); });
  window.addEventListener('pointercancel', function (e) { endDrag(e, true); });
  roomEl.addEventListener('click', function (e) {
    var b = e.target.closest('.seat'); if (!b || suppressClick) return;
    onSeatTap(+b.dataset.i);
  });
  roomEl.addEventListener('keydown', function (e) {
    var b = e.target.closest('.seat'); if (!b) return;
    var i = +b.dataset.i, g = geom(room()), s = g.seats[i];
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); unseat(i); return; }
    if (e.key === 'Escape') { selected = null; renderChart(); return; }
    var rtl = document.documentElement.dir === 'rtl';
    var dir = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, rtl ? 1 : -1], ArrowRight: [0, rtl ? -1 : 1] }[e.key];
    if (!dir) return;
    e.preventDefault();
    var best = -1, bd = 1e9;
    g.seats.forEach(function (o, k) {
      var ddr = o.dr - s.dr, ddc = o.dc - s.dc;
      if (dir[0] && Math.sign(ddr) !== dir[0]) return;
      if (dir[1] && Math.sign(ddc) !== dir[1]) return;
      var d = dir[0] ? Math.abs(ddr) * 10 + Math.abs(ddc) * 100 : Math.abs(ddc) * 10 + Math.abs(ddr) * 100;
      if (d < bd) { bd = d; best = k; }
    });
    if (best >= 0) { var n = roomEl.querySelector('[data-i="' + best + '"]'); if (n) n.focus(); }
  });

  /* ---------- student editor ---------- */
  function editStudent(id) {
    var c = cls(), s = id ? stuById(id) : null;
    var nm = el('input', { class: 'no-i18n', value: s ? stuName(s) : '', maxlength: '80' });
    var rl = el('input', { class: 'no-i18n', value: s ? s.roll : '', maxlength: '20' });
    var gd = el('select', {}, el('option', { value: '', text: t('gender_none') }), el('option', { value: 'M', text: t('gender_m') }), el('option', { value: 'F', text: t('gender_f') }));
    gd.value = s ? s.gender : '';
    var mk = el('input', { type: 'number', inputmode: 'decimal', value: s && s.marks !== null ? s.marks : '' });
    var cf = el('input', { type: 'checkbox' }), cg = el('input', { type: 'checkbox' }), cl = el('input', { type: 'checkbox' });
    if (s) { cf.checked = s.needs.front; cg.checked = s.needs.glasses; cl.checked = s.needs.left; }
    var close;
    var form = el('form', { class: 'modal-form' },
      el('label', { class: 'field' }, el('span', { text: t('student_name') }), nm),
      el('label', { class: 'field' }, el('span', { text: t('student_roll') }), rl),
      el('label', { class: 'field' }, el('span', { text: t('student_gender') }), gd),
      el('label', { class: 'field' }, el('span', { text: t('student_marks') }), mk),
      el('div', { class: 'field' }, el('span', { text: t('student_needs') }),
        el('div', { class: 'checks' },
          el('label', { class: 'check' }, cf, el('span', { text: t('need_front') })),
          el('label', { class: 'check' }, cg, el('span', { text: t('need_glasses') })),
          el('label', { class: 'check' }, cl, el('span', { text: t('need_left') })))),
      el('div', { class: 'row' },
        el('button', { type: 'submit', class: 'btn btn-primary', id: 'stuSave', text: t('save') }),
        s ? el('button', { type: 'button', class: 'btn btn-danger', id: 'stuRemove', text: t('remove_student'), onclick: function () {
          c.students = c.students.filter(function (x) { return x.id !== s.id; });
          c.apart = c.apart.filter(function (p) { return p[0] !== s.id && p[1] !== s.id; });
          save(); close(); renderAll();
        } }) : null,
        el('button', { type: 'button', class: 'btn', text: t('cancel'), onclick: function () { close(); } })));
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = nm.value.trim();
      if (!name) { EDU.toast(t('name_required')); nm.focus(); return; }
      var m = mk.value === '' ? null : parseFloat(mk.value);
      var o = s || { id: uid() };
      if (!s || name !== stuName(s)) { delete o.k; o.name = name.slice(0, 80); }
      o.roll = rl.value.trim().slice(0, 20); o.gender = gd.value; o.marks = isFinite(m) ? m : null;
      o.needs = { front: cf.checked, glasses: cg.checked, left: cl.checked };
      if (!s) {
        if (c.students.length >= MAX_STUDENTS) { EDU.toast(t('too_many', { n: MAX_STUDENTS })); return; }
        c.students.push(o);
      }
      save(); close(); renderAll();
    });
    close = EDU.modal(form, { title: t(s ? 'edit_student' : 'new_student') });
    setTimeout(function () { nm.focus(); }, 30);
  }

  /* ---------- printing ---------- */
  function today() { try { return new Date().toLocaleDateString(EDU.langInfo(EDU.lang).tag, { numberingSystem: 'latn', day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return new Date().toDateString(); } }
  function head(title) {
    return el('div', { class: 'pr-head' },
      el('h1', { text: title }),
      el('div', {}, el('div', { text: t('p_class') + ': ' + className(cls()) + ' · ' + t('p_room') + ': ' + roomName(room()) }),
        el('div', { text: t('p_date') + ': ' + today() + ' · ' + t('p_students_n', { n: EDU.fmt(cls().students.length) }) })));
  }
  function seatedList() {
    var g = geom(room()), arr = getChart() || [];
    var out = [];
    g.seats.forEach(function (seat, i) { var s = arr[i] ? stuById(arr[i]) : null; if (s) out.push({ i: i, seat: seat, s: s }); });
    return out;
  }
  function rowNo(seat) { return seat.r + 1; }
  function buildPrint(kind) {
    var pa = $('#printArea'), r = room(), g = geom(r), arr = getChart() || [];
    pa.textContent = '';
    $('#pageSize').textContent = '@page { size: A4 ' + (kind === 'chart' ? 'landscape' : 'portrait') + '; margin: 10mm; }';
    if (kind === 'chart') {
      pa.appendChild(head(t('chart_title')));
      pa.appendChild(el('div', { class: 'pr-board', text: t('board_label') }));
      var gapMM = r.layout === 'exam' ? 6 : 3;
      var realRows = g.drows - Object.keys(g.gapR).length, realCols = g.dcols - Object.keys(g.gapC).length;
      var h = Math.max(8, Math.min(22, (150 - (g.drows - 1) * gapMM) / realRows));
      var w = (277 - (g.dcols - 1) * gapMM) / realCols;
      var fs = Math.max(7, Math.min(18, h * 1.1, w * 0.55));
      var grid = el('div', { class: 'pr-room no-i18n' + (r.layout === 'exam' ? ' exam' : '') });
      var cols = [], rows = [], i;
      for (i = 0; i < g.dcols; i++) cols.push(g.gapC[i] ? '4mm' : '1fr');
      for (i = 0; i < g.drows; i++) rows.push(g.gapR[i] ? '4mm' : 'auto');
      grid.style.gridTemplateColumns = cols.join(' '); grid.style.gridTemplateRows = rows.join(' ');
      g.seats.forEach(function (seat, k) {
        var s = arr[k] ? stuById(arr[k]) : null;
        var d = el('div', { class: 'pr-seat' + (s ? '' : ' empty'), style: { gridRow: String(seat.dr + 1), gridColumn: String(seat.dc + 1), minHeight: h + 'mm' } });
        d.appendChild(el('div', { class: 'sm', text: EDU.fmt(k + 1) + (r.sets ? ' · ' + t('p_set') + ' ' + setOf(seat) : '') }));
        if (s) {
          d.appendChild(el('div', { class: 'nm', style: { fontSize: fs.toFixed(1) + 'pt' }, text: stuName(s) }));
          if (s.roll) d.appendChild(el('div', { class: 'sm', text: s.roll }));
        }
        grid.appendChild(d);
      });
      pa.appendChild(grid);
      if (r.sets) pa.appendChild(el('p', { class: 'pr-note', text: t('p_sets_note') }));
    } else if (kind === 'slips') {
      var slips = el('div', { class: 'slips no-i18n' });
      seatedList().forEach(function (x) {
        slips.appendChild(el('div', { class: 'slip' },
          el('div', { class: 'big', text: x.s.roll || '—' }),
          el('div', { class: 'nm', text: stuName(x.s) }),
          el('div', { text: t('p_seat') + ' ' + EDU.fmt(x.i + 1) + ' · ' + t('p_row', { n: EDU.fmt(rowNo(x.seat)) }) + (r.sets ? ' · ' + t('p_set') + ' ' + setOf(x.seat) : '') }),
          el('div', { text: className(cls()) + ' · ' + roomName(r) })));
      });
      pa.appendChild(slips);
    } else if (kind === 'labels') {
      var labels = el('div', { class: 'labels no-i18n' });
      seatedList().forEach(function (x) {
        labels.appendChild(el('div', { class: 'label' }, el('div', { class: 'nm', text: stuName(x.s) }),
          el('div', { text: (x.s.roll ? t('p_roll') + ' ' + x.s.roll + ' · ' : '') + t('p_seat') + ' ' + EDU.fmt(x.i + 1) })));
      });
      pa.appendChild(labels);
    } else {
      pa.appendChild(head(t('p_list_title')));
      var tb = el('tbody');
      seatedList().forEach(function (x) {
        tb.appendChild(el('tr', {}, el('td', { text: EDU.fmt(x.i + 1) }), el('td', { text: x.s.roll }), el('td', { text: stuName(x.s) }),
          r.sets ? el('td', { text: setOf(x.seat) }) : null, el('td', { class: 'sign' })));
      });
      pa.appendChild(el('table', { class: 'pr-table no-i18n' },
        el('thead', {}, el('tr', {}, el('th', { text: t('p_seat') }), el('th', { text: t('p_roll') }), el('th', { text: t('p_name') }), r.sets ? el('th', { text: t('p_set') }) : null, el('th', { text: t('p_sign') }))), tb));
      if (r.sets) pa.appendChild(el('p', { class: 'pr-note', text: t('p_sets_note') }));
    }
  }
  function doPrint(kind) {
    if (!getChart()) arrange();
    buildPrint(kind);
    setTimeout(function () { window.print(); }, 60);
  }

  function chartRows() {
    var g = geom(room()), arr = getChart() || [], r = room();
    return g.seats.map(function (seat, i) { var s = arr[i] ? stuById(arr[i]) : null; return [i + 1, seat.r + 1, seat.c + 1, s ? s.roll : '', s ? stuName(s) : '', r.sets ? setOf(seat) : '']; });
  }
  function asText() {
    var g = geom(room()), arr = getChart() || [], lines = [className(cls()) + ' · ' + roomName(room())], byRow = {};
    g.seats.forEach(function (seat, i) { var s = arr[i] ? stuById(arr[i]) : null; (byRow[seat.r] = byRow[seat.r] || []).push(s ? stuName(s) + (s.roll ? ' (' + s.roll + ')' : '') : '—'); });
    Object.keys(byRow).sort(function (a, b) { return a - b; }).forEach(function (r) { lines.push(t('p_row', { n: +r + 1 }) + ': ' + byRow[r].join(', ')); });
    return lines.join('\n');
  }

  /* ---------- wiring ---------- */
  $('#classSel').addEventListener('change', function (e) { S.cur.cls = e.target.value; selected = null; lastWarn = []; save(); ensureChart(); renderAll(); });
  $('#roomSel').addEventListener('change', function (e) { S.cur.room = e.target.value; selected = null; lastWarn = []; save(); ensureChart(); renderAll(); });
  $('#newClass').addEventListener('click', function () {
    var c = { id: uid(), name: t('new_class_name', { n: S.classes.length + 1 }), students: [], apart: [] };
    S.classes.push(c); S.cur.cls = c.id; S.tab = 'students'; save(); renderAll();
    $('#names').focus();
  });
  $('#newRoom').addEventListener('click', function () {
    var r0 = room(), r = { id: uid(), name: t('new_room_name', { n: S.rooms.length + 1 }), layout: r0.layout, rows: r0.rows, cols: r0.cols, sets: r0.sets };
    S.rooms.push(r); S.cur.room = r.id; S.tab = 'chart'; save(); ensureChart(); renderAll();
  });
  EDU.$$('.tabs button').forEach(function (b) { b.addEventListener('click', function () { S.tab = b.dataset.tab; save(); renderAll(); }); });
  $('#roomName').addEventListener('input', function (e) { var r = room(); r.name = e.target.value.slice(0, 60); if (!r.name && r.nameKey) r.name = ''; save(); fillSelect($('#roomSel'), S.rooms, roomName, r.id); });
  $('#className').addEventListener('input', function (e) { var c = cls(); c.name = e.target.value.slice(0, 60); save(); fillSelect($('#classSel'), S.classes, className, c.id); });
  EDU.$$('#layoutSeg button').forEach(function (b) { b.addEventListener('click', function () { var r = room(); r.layout = b.dataset.lay; reflow(); save(); render(); }); });
  function dimChange() {
    var r = room();
    r.rows = num($('#rowsIn').value, 1, MAX_ROWS, r.rows); r.cols = num($('#colsIn').value, 1, MAX_COLS, r.cols);
    reflow(); save(); render();
  }
  $('#rowsIn').addEventListener('change', dimChange); $('#colsIn').addEventListener('change', dimChange);
  $('#setsChk').addEventListener('change', function (e) { room().sets = e.target.checked; save(); render(); });
  $('#delRoom').addEventListener('click', function () {
    var r = room(); if (!confirm(t('confirm_delete_room', { name: roomName(r) }))) return;
    S.rooms = S.rooms.filter(function (x) { return x !== r; });
    Object.keys(S.charts).forEach(function (k) { if (k.indexOf(r.id + '|') === 0) delete S.charts[k]; });
    if (!S.rooms.length) S.rooms.push({ id: uid(), name: t('new_room_name', { n: 1 }), layout: 'pairs', rows: 5, cols: 6, sets: false });
    S.cur.room = S.rooms[0].id; save(); ensureChart(); renderAll();
  });
  $('#delClass').addEventListener('click', function () {
    var c = cls(); if (!confirm(t('confirm_delete_class', { name: className(c) }))) return;
    S.classes = S.classes.filter(function (x) { return x !== c; });
    Object.keys(S.charts).forEach(function (k) { if (k.split('|')[1] === c.id) delete S.charts[k]; });
    if (!S.classes.length) S.classes.push({ id: uid(), name: t('new_class_name', { n: 1 }), students: [], apart: [] });
    S.cur.cls = S.classes[0].id; save(); ensureChart(); renderAll();
  });
  $('#orderSel').addEventListener('change', function (e) { S.order = e.target.value; save(); renderRoomForm(); });
  $('#optBoyGirl').addEventListener('change', function (e) { S.boygirl = e.target.checked; save(); });
  $('#optFront').addEventListener('change', function (e) { S.front = e.target.checked; save(); });
  $('#arrangeBtn').addEventListener('click', arrange);
  $('#clearBtn').addEventListener('click', function () { setChart(new Array(geom(room()).seats.length).fill(null)); selected = null; lastWarn = []; EDU.toast(t('cleared')); render(); });
  $('#undoBtn').addEventListener('click', function () {
    var st = undoStack[chartKey()]; if (!st || !st.length) return;
    S.charts[chartKey()] = st.pop(); save(); selected = null; EDU.toast(t('undone')); render();
  });
  $('#fsBtn').addEventListener('click', function () { EDU.fullscreen($('#chartCard')); });
  $('#prChart').addEventListener('click', function () { doPrint('chart'); });
  $('#prSlips').addEventListener('click', function () { doPrint('slips'); });
  $('#prLabels').addEventListener('click', function () { doPrint('labels'); });
  $('#prList').addEventListener('click', function () { doPrint('list'); });
  $('#csvBtn').addEventListener('click', function () {
    var rows = [[t('p_seat'), t('rows_label'), t('p_column'), t('p_roll'), t('p_name'), t('p_set')]].concat(chartRows());
    var fname = (className(cls()) + '-' + roomName(room())).replace(/[\\\/:*?"<>|]+/g, '').replace(/\s+/g, '-').slice(0, 60) || 'seating';
    EDU.download(fname + '.csv', EDU.csv.stringify(rows), 'text/csv');
  });
  $('#copyBtn').addEventListener('click', function () { EDU.copy(asText()); });

  $('#useList').addEventListener('click', function () {
    var parsed = parseList($('#names').value);
    var c = cls();
    if (c.students.length && serialize(c) !== $('#names').value && !confirm(t('confirm_replace'))) return;
    applyList(parsed);
  });
  $('#importCsv').addEventListener('click', function () {
    EDU.pickFile('.csv,.txt,.tsv,text/csv,text/plain').then(function (f) {
      if (!f) return null;
      return EDU.readText(f).then(function (txt) {
        var parsed = parseList(txt);
        if (!parsed.length) { EDU.toast(t('import_failed')); return; }
        $('#names').value = txt;
        applyList(parsed);
      });
    }).catch(function () { EDU.toast(t('import_failed')); });
  });
  $('#addStudent').addEventListener('click', function () { editStudent(null); });
  $('#loadSample').addEventListener('click', function () {
    var c = cls();
    if (c.students.length && !confirm(t('confirm_replace'))) return;
    var smp = sampleClass();
    c.students = smp.students; c.apart = smp.apart; c.sample = true;
    Object.keys(S.charts).forEach(function (k) { if (k.split('|')[1] === c.id) delete S.charts[k]; });
    save(); ensureChart(); renderAll();
  });
  $('#addPair').addEventListener('click', function () {
    var c = cls(), a = $('#apartA').value, b = $('#apartB').value;
    if (!a || !b || a === b) { EDU.toast(t('same_pair')); return; }
    if (c.apart.some(function (p) { return (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a); })) { EDU.toast(t('pair_exists')); return; }
    c.apart.push([a, b]); save(); renderAll();
  });
  $('#resetAll').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    store.remove('data'); S = freshState(); undoStack = {}; lastWarn = []; selected = null; ensureChart(); save(); renderAll();
  });

  /* a room + class seen for the first time gets an automatic first arrangement */
  function ensureChart() {
    if (!getChart() && cls().students.length) {
      var keepWarn = lastWarn; arrangeSilently(); lastWarn = keepWarn;
    }
  }
  function arrangeSilently() {
    var toast = EDU.toast; EDU.toast = function () { };
    try { arrange(); } finally { EDU.toast = toast; }
    undoStack[chartKey()] = [];
  }

  EDU.onLang(function () { lastWarn = []; renderAll(); });
  ensureChart();
  renderAll();

  /* for the automated test */
  window.SEAT_DEBUG = function () {
    var g = geom(room()), arr = getChart() || [];
    return {
      layout: room().layout, rows: room().rows, cols: room().cols, sets: room().sets, nSeats: g.seats.length,
      seats: arr, students: cls().students.map(function (s) { return { id: s.id, name: stuName(s), roll: s.roll, gender: s.gender, marks: s.marks, front: s.needs.front }; }),
      adj: g.seats.map(function (s) { return s.adj.slice(); }), pos: g.seats.map(function (s) { return { r: s.r, c: s.c, par: s.par, set: setOf(s) }; }),
      apart: cls().apart.slice(), violations: violations(arr, g.seats, cls().apart), classes: S.classes.length, rooms: S.rooms.length
    };
  };
  window.SEAT_PRINT = buildPrint;
})();
