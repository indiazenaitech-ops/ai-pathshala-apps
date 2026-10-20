/* Lesson Plan Maker: the data model and pure logic (no DOM).
   window.LPM = { constants, blank(), clean(), fromSample(), duplicate(), timing(), text(), exportJSON(), importJSON(), search() ... }
   Every function here is safe to call with garbage: clean() never throws and always returns a usable plan. */
(function () {
  'use strict';

  var FORMATS = ['cbse', '5e', 'weekly'];
  var COMPS = ['critical', 'creativity', 'collab', 'comm', 'values', 'digital'];
  var PHASES = ['engage', 'explore', 'explain', 'elaborate', 'evaluate'];
  var LEVELS = ['remember', 'understand', 'apply', 'analyse', 'evaluate', 'create'];
  var SUBJECTS = ['maths', 'science', 'english', 'social', 'language', 'ai', 'general'];
  var SAMPLES = ['fractions', 'cell', 'poem', 'medieval', 'story', 'ai'];
  var DAYS = 6, MAX_PERIODS = 8, MAX_STEPS = 30, MAX_MATERIALS = 40, MAX_PLANS = 200;
  var SHORT = 120, LONG = 3000, CELL = 300;

  /* ---------------- small helpers ---------------- */
  function uid() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function str(v, max) { if (v === undefined || v === null) return ''; v = String(v); if (typeof v !== 'string') return ''; return v.length > max ? v.slice(0, max) : v; }
  function int(v, lo, hi, d) { v = Math.round(Number(v)); if (!isFinite(v)) return d; return Math.min(hi, Math.max(lo, v)); }
  function isoDate(v) { v = str(v, 10); return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : ''; }
  function todayISO() {
    var d = new Date(), m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }
  /* the Monday of the week that holds an ISO date (Sunday rolls forward to the next Monday) */
  function mondayOf(iso) {
    var p = isoDate(iso) ? iso.split('-').map(Number) : null;
    var d = p ? new Date(p[0], p[1] - 1, p[2]) : new Date();
    var wd = d.getDay();                           /* 0 = Sunday */
    var diff = wd === 0 ? 1 : 1 - wd;
    d.setDate(d.getDate() + diff);
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }
  function addDays(iso, n) {
    var p = iso.split('-').map(Number), d = new Date(p[0], p[1] - 1, p[2] + n);
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }
  /* dd/mm/yyyy, the way Indian schools write dates */
  function dmy(iso) { if (!isoDate(iso)) return ''; var p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }

  /* ---------------- the plan ---------------- */
  function blankPhase() { return { act: '', min: 0, mat: '' }; }
  function blank() {
    var e5 = {};
    PHASES.forEach(function (p) { e5[p] = blankPhase(); });
    var now = Date.now();
    return {
      id: uid(), format: 'cbse', created: now, updated: now,
      school: '', teacher: '', cls: '', section: '', subject: '', subjectKey: 'general', topic: '', date: todayISO(), period: 1, duration: 40,
      outcomes: '', prev: '', materials: [], comp: [],
      intro: '', steps: [], recap: '', assess: '', hw: '', reflect: '',
      e5: e5,
      support: '', extension: '',
      weekStart: mondayOf(todayISO()), periods: 6, week: {}
    };
  }

  function cleanStep(s) {
    if (!s || typeof s !== 'object') return null;
    return { teacher: str(s.teacher, LONG), student: str(s.student, LONG), min: int(s.min, 0, 600, 0) };
  }
  function cleanMaterial(m) {
    if (typeof m === 'string') m = { text: m, done: false };
    if (!m || typeof m !== 'object') return null;
    var text = str(m.text, SHORT).trim();
    return text ? { text: text, done: !!m.done } : null;
  }
  /* Validate everything that comes from storage or an imported file. Unknown keys are dropped,
     bad values fall back to the defaults one by one, so an old or damaged save never breaks the app. */
  function clean(raw) {
    var d = blank(), r = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    var p = {
      id: /^[A-Za-z0-9_-]{1,40}$/.test(String(r.id || '')) ? String(r.id) : d.id,
      format: FORMATS.indexOf(r.format) >= 0 ? r.format : 'cbse',
      created: int(r.created, 0, 4102444800000, d.created), updated: int(r.updated, 0, 4102444800000, d.updated),
      school: str(r.school, SHORT), teacher: str(r.teacher, SHORT), cls: str(r.cls, 20), section: str(r.section, 20),
      subject: str(r.subject, SHORT), subjectKey: SUBJECTS.indexOf(r.subjectKey) >= 0 ? r.subjectKey : 'general',
      topic: str(r.topic, SHORT), date: isoDate(r.date) || d.date, period: int(r.period, 1, 12, 1), duration: int(r.duration, 5, 480, 40),
      outcomes: str(r.outcomes, LONG), prev: str(r.prev, LONG),
      materials: (Array.isArray(r.materials) ? r.materials : []).map(cleanMaterial).filter(Boolean).slice(0, MAX_MATERIALS),
      comp: (Array.isArray(r.comp) ? r.comp : []).filter(function (c, i, a) { return COMPS.indexOf(c) >= 0 && a.indexOf(c) === i; }),
      intro: str(r.intro, LONG), steps: (Array.isArray(r.steps) ? r.steps : []).map(cleanStep).filter(Boolean).slice(0, MAX_STEPS),
      recap: str(r.recap, LONG), assess: str(r.assess, LONG), hw: str(r.hw, LONG), reflect: str(r.reflect, LONG),
      e5: {},
      support: str(r.support, LONG), extension: str(r.extension, LONG),
      weekStart: mondayOf(isoDate(r.weekStart) || d.weekStart), periods: int(r.periods, 1, MAX_PERIODS, 6), week: {}
    };
    var e = r.e5 && typeof r.e5 === 'object' ? r.e5 : {};
    PHASES.forEach(function (k) {
      var ph = e[k] && typeof e[k] === 'object' ? e[k] : {};
      p.e5[k] = { act: str(ph.act, LONG), min: int(ph.min, 0, 600, 0), mat: str(ph.mat, SHORT * 2) };
    });
    var w = r.week && typeof r.week === 'object' && !Array.isArray(r.week) ? r.week : {};
    Object.keys(w).forEach(function (key) {
      var m = /^([0-5])-([1-8])$/.exec(key); if (!m) return;
      var c = w[key] && typeof w[key] === 'object' ? w[key] : {};
      var topic = str(c.topic, CELL), hw = str(c.hw, CELL);
      if (topic || hw) p.week[key] = { topic: topic, hw: hw };
    });
    return p;
  }

  /* A plan from a content.js sample. base (optional) gives the school and teacher name to keep. */
  function fromSample(s, base) {
    var p = blank();
    s = s && typeof s === 'object' ? s : {};
    if (base && typeof base === 'object') { p.school = str(base.school, SHORT); p.teacher = str(base.teacher, SHORT); p.format = FORMATS.indexOf(base.format) >= 0 ? base.format : 'cbse'; }
    p.subjectKey = SUBJECTS.indexOf(s.subjectKey) >= 0 ? s.subjectKey : 'general';
    p.cls = str(s.cls, 20); p.subject = str(s.subject, SHORT); p.topic = str(s.topic, SHORT);
    p.period = int(s.period, 1, 12, 1); p.duration = int(s.duration, 5, 480, 40);
    p.outcomes = (Array.isArray(s.outcomes) ? s.outcomes : []).map(function (o) { return '• ' + str(o, LONG); }).join('\n');
    p.prev = str(s.prev, LONG);
    p.materials = (Array.isArray(s.materials) ? s.materials : []).map(function (m) { return { text: str(m, SHORT), done: false }; });
    p.comp = (Array.isArray(s.comp) ? s.comp : []).filter(function (c) { return COMPS.indexOf(c) >= 0; });
    p.intro = str(s.intro, LONG);
    p.steps = (Array.isArray(s.steps) ? s.steps : []).map(function (st) { return Array.isArray(st) ? { teacher: str(st[0], LONG), student: str(st[1], LONG), min: int(st[2], 0, 600, 0) } : null; }).filter(Boolean);
    p.recap = str(s.recap, LONG); p.assess = str(s.assess, LONG); p.hw = str(s.hw, LONG);
    var e = s.e5 && typeof s.e5 === 'object' ? s.e5 : {};
    PHASES.forEach(function (k) { var a = Array.isArray(e[k]) ? e[k] : []; p.e5[k] = { act: str(a[0], LONG), min: int(a[1], 0, 600, 0), mat: str(a[2], SHORT * 2) }; });
    p.support = str(s.support, LONG); p.extension = str(s.extension, LONG);
    (Array.isArray(s.week) ? s.week : []).slice(0, DAYS).forEach(function (c, d) {
      if (!Array.isArray(c)) return;
      var topic = str(c[0], CELL), hw = str(c[1], CELL);
      if (topic || hw) p.week[d + '-1'] = { topic: topic, hw: hw };
    });
    return clean(p);
  }

  function duplicate(p, suffix) {
    var c = clean(JSON.parse(JSON.stringify(p)));
    c.id = uid(); c.created = Date.now(); c.updated = c.created;
    if (suffix) c.topic = str((c.topic ? c.topic + ' ' : '') + suffix, SHORT);
    return c;
  }

  /* ---------------- timing ---------------- */
  function minutes(p) {
    if (p.format === '5e') return PHASES.map(function (k) { return p.e5[k].min; });
    if (p.format === 'cbse') return p.steps.map(function (s) { return s.min; });
    return [];
  }
  /* total of the step minutes against the period length */
  function timing(mins, duration) {
    var total = 0;
    (mins || []).forEach(function (m) { m = Number(m); if (isFinite(m) && m > 0) total += m; });
    duration = int(duration, 1, 100000, 40);
    var over = Math.max(0, total - duration), left = Math.max(0, duration - total);
    return { total: total, duration: duration, over: over, left: left,
      status: total === 0 ? 'none' : over > 0 ? 'over' : left === 0 ? 'exact' : 'under',
      pct: Math.min(100, Math.round(total / duration * 100)) };
  }

  /* ---------------- titles / search ---------------- */
  function title(p, fallback) {
    var parts = [];
    if (p.topic) parts.push(p.topic);
    if (p.subject) parts.push(p.subject);
    return parts.join(' · ') || fallback || '';
  }
  function haystack(p) {
    var cells = Object.keys(p.week).map(function (k) { return p.week[k].topic + ' ' + p.week[k].hw; }).join(' ');
    return [p.topic, p.subject, p.cls, p.section, p.teacher, p.school, p.outcomes, p.intro, p.date, p.format, cells].join(' ').toLowerCase();
  }
  function search(plans, q) {
    q = String(q || '').trim().toLowerCase();
    if (!q) return plans.slice();
    var words = q.split(/\s+/);
    return plans.filter(function (p) { var h = haystack(p); return words.every(function (w) { return h.indexOf(w) >= 0; }); });
  }

  /* ---------------- JSON export / import ---------------- */
  function exportJSON(plans) {
    return JSON.stringify({ app: 'lesson-plan-maker', version: 1, exported: new Date().toISOString(), plans: (plans || []).map(clean) }, null, 2);
  }
  /* Accepts our export file, a bare array of plans or a single plan. Returns { plans: [...] } or { error: 'why' }. */
  function importJSON(text) {
    var data;
    try { data = JSON.parse(String(text).replace(/^﻿/, '')); } catch (e) { return { error: 'json' }; }
    var list = Array.isArray(data) ? data : data && Array.isArray(data.plans) ? data.plans : data && typeof data === 'object' && (data.format || data.topic || data.steps) ? [data] : null;
    if (!list) return { error: 'shape' };
    var out = list.filter(function (x) { return x && typeof x === 'object'; }).slice(0, MAX_PLANS).map(clean);
    if (!out.length) return { error: 'empty' };
    return { plans: out };
  }
  /* merge imported plans into the saved list: same id replaces, others are added (newest first) */
  function merge(existing, incoming) {
    var byId = {}, out = existing.slice();
    out.forEach(function (p, i) { byId[p.id] = i; });
    incoming.forEach(function (p) { if (byId[p.id] !== undefined) out[byId[p.id]] = p; else { byId[p.id] = out.length; out.push(p); } });
    out.sort(function (a, b) { return b.updated - a.updated; });
    return out.slice(0, MAX_PLANS);
  }

  /* ---------------- plain text (WhatsApp / copy) ----------------
     L = { label(key) -> translated label, day(i), period(n), minutes(n), compName(c), phase(k), formatName(f) } */
  function text(p, L) {
    var lines = [], add = function (s) { lines.push(s); };
    var kv = function (key, v) { if (v) add(L.label(key) + ': ' + v); };
    add('📝 ' + L.formatName(p.format) + (p.school ? ' · ' + p.school : ''));
    kv('pv_teacher', p.teacher); kv('pv_class', (p.cls + (p.section ? ' ' + p.section : '')).trim()); kv('pv_subject', p.subject);
    if (p.format === 'weekly') {
      kv('pv_week', dmy(p.weekStart) + ' – ' + dmy(addDays(p.weekStart, 5)));
      for (var d = 0; d < DAYS; d++) {
        var row = [];
        for (var n = 1; n <= p.periods; n++) {
          var c = p.week[d + '-' + n]; if (!c) continue;
          row.push(L.period(n) + ': ' + c.topic + (c.hw ? ' (' + L.label('cell_hw') + ': ' + c.hw + ')' : ''));
        }
        if (row.length) { add(''); add(L.day(d) + ' ' + dmy(addDays(p.weekStart, d))); row.forEach(function (r) { add('  ' + r); }); }
      }
      return lines.join('\n');
    }
    kv('pv_topic', p.topic); kv('pv_date', dmy(p.date)); kv('pv_period', String(p.period)); kv('pv_duration', L.minutes(p.duration));
    var block = function (key, v) { if (v && String(v).trim()) { add(''); add(L.label(key) + ':'); add(String(v).trim()); } };
    block('pv_outcomes', p.outcomes);
    if (p.comp.length) { add(''); add(L.label('pv_comp') + ': ' + p.comp.map(L.compName).join(', ')); }
    block('pv_prev', p.prev);
    if (p.materials.length) { add(''); add(L.label('pv_materials') + ': ' + p.materials.map(function (m) { return m.text; }).join(', ')); }
    if (p.format === 'cbse') {
      block('pv_intro', p.intro);
      if (p.steps.length) {
        add(''); add(L.label('pv_steps') + ':');
        p.steps.forEach(function (s, i) {
          add((i + 1) + '. ' + L.label('col_teacher') + ': ' + s.teacher + (s.student ? ' | ' + L.label('col_student') + ': ' + s.student : '') + (s.min ? ' | ' + L.minutes(s.min) : ''));
        });
      }
      block('pv_recap', p.recap); block('pv_assess', p.assess); block('pv_hw', p.hw); block('pv_reflect', p.reflect);
    } else {
      PHASES.forEach(function (k) {
        var ph = p.e5[k]; if (!ph.act && !ph.mat) return;
        add(''); add(L.phase(k) + (ph.min ? ' (' + L.minutes(ph.min) + ')' : '') + ':');
        if (ph.act) add(ph.act.trim());
        if (ph.mat) add(L.label('ph_materials') + ': ' + ph.mat);
      });
    }
    block('pv_support', p.support); block('pv_extension', p.extension);
    return lines.join('\n');
  }

  window.LPM = {
    FORMATS: FORMATS, COMPS: COMPS, PHASES: PHASES, LEVELS: LEVELS, SUBJECTS: SUBJECTS, SAMPLES: SAMPLES,
    DAYS: DAYS, MAX_PERIODS: MAX_PERIODS, MAX_STEPS: MAX_STEPS, MAX_MATERIALS: MAX_MATERIALS, MAX_PLANS: MAX_PLANS,
    uid: uid, todayISO: todayISO, mondayOf: mondayOf, addDays: addDays, dmy: dmy, isoDate: isoDate,
    blank: blank, clean: clean, fromSample: fromSample, duplicate: duplicate,
    minutes: minutes, timing: timing, title: title, search: search,
    exportJSON: exportJSON, importJSON: importJSON, merge: merge, text: text
  };
})();
