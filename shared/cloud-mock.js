/* AI Pathshala Apps: window.EDUCloudMock = "Demo mode" of the teacher-account + Live Class Quiz cloud.
 *
 * Same API as window.EDUCloud (see LIVE_SPEC.md and firebase/API.md), but with NO network at all:
 *   - all data lives in this browser's localStorage under 'edu.cloudmock.' (memory if storage is blocked),
 *   - tabs of the same browser see each other's changes live (BroadcastChannel + storage events,
 *     plus a cheap 1-second version check as a fallback, e.g. for file:// pages),
 *   - the fake teacher is {uid:'demo-teacher', name:'Demo Teacher', demo:true},
 *   - every student TAB is a different anonymous player (id kept in sessionStorage, so it survives reload),
 *   - "server time" is Date.now(),
 *   - it checks the same things as firebase/firestore.rules (nickname 1-20 chars and unique per session,
 *     locked / ended sessions, kicked players, one answer per question, only the current question,
 *     owner-only teacher actions) and rejects with the same error codes, so apps behave the same.
 *
 * It also defines EDUCloudMock.util: pure helpers (validation, scoring, ranking, errors) that
 * shared/cloud.js reuses, so both modes share one implementation of the rules of the game.
 * Classic script, no dependencies, never throws at load time. Load it BEFORE shared/cloud.js. */
(function () {
  'use strict';

  /* =========================================================== shared pure helpers (util) */
  var ERROR_CODES = ['not-configured', 'offline', 'quota-exceeded', 'not-found', 'permission-denied',
    'session-locked', 'session-ended', 'name-taken', 'invalid-input', 'unknown'];
  var LIMITS = {
    name: 20, title: 150, questions: 200, question: 1000, option: 300, explain: 600,
    minOptions: 2, maxOptions: 6, minTime: 5, maxTime: 600, defaultTime: 20, keepDays: 30
  };
  var DAY = 86400000;
  var STATES = ['lobby', 'question', 'reveal', 'ended'];

  function cloudError(code, message, extra) {
    if (ERROR_CODES.indexOf(code) < 0) code = 'unknown';
    var e = new Error(message || code);
    e.name = 'EDUCloudError';
    e.code = code;
    if (extra) for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) e[k] = extra[k];
    return e;
  }
  function isCloudError(e) { return !!(e && e.name === 'EDUCloudError' && ERROR_CODES.indexOf(e.code) >= 0); }
  function bad(msg) { return cloudError('invalid-input', msg); }

  function isInt(n) { return typeof n === 'number' && isFinite(n) && Math.floor(n) === n; }
  function clampInt(v, lo, hi, def) {
    var n = Math.round(Number(v));
    if (v === null || v === undefined || v === '' || !isFinite(n)) return def;
    return Math.max(lo, Math.min(hi, n));
  }

  function rand(n) {
    try {
      var a = new Uint32Array(1);
      window.crypto.getRandomValues(a);
      return a[0] % n;
    } catch (e) { return Math.floor(Math.random() * n); }
  }
  function rid(len) {
    var abc = 'abcdefghijklmnopqrstuvwxyz0123456789', s = '';
    for (var i = 0; i < len; i++) s += abc.charAt(rand(abc.length));
    return s;
  }
  function shuffled(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = rand(i + 1); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function randomCode() { return String(100000 + rand(900000)); }

  /* Text a teacher typed: keep line breaks only when multiline, drop control characters, trim. */
  function cleanText(v, multiline) {
    var s = v === null || v === undefined ? '' : String(v);
    s = s.replace(/\r\n?/g, '\n');
    s = multiline ? s.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '') : s.replace(/[\u0000-\u001f\u007f]+/g, ' ');
    return s.trim();
  }

  /* Characters removed from a nickname: control characters, and invisible or text-reordering ones (soft
     hyphen, zero-width space, LRM/RLM, bidi embeddings/overrides/isolates, word joiner, fillers, BOM…) that
     could make a nickname look exactly like another student's. firestore.rules (validName) refuses the same
     characters; every kind of space (no-break, ideographic…) becomes a plain space before that. */
  var NAME_DROP = /[\u0000-\u001f\u007f-\u009f­͏؜ᅟᅠ឴឵᠋-᠏​‎‏‪-‮⁠-⁯ㅤ﻿ﾠ￹-￻]/g;
  /* ZWNJ/ZWJ (Indian scripts need them) and emoji variation selectors stay in the nickname, but are
     ignored when nicknames are compared: "Asha" and "Asha"+ZWJ look the same, so they are the same nickname. */
  var NAME_SKIP = /[‌‍︎️]/g;

  /* Student nickname → clean string, or null when it is not allowed.
     Same limits as firestore.rules: 1-20 characters (JS length), single spaces, no '/', and its nameKey must
     be a usable id (not empty, not only dots, not __x__). */
  function normalizeName(raw) {
    var s = String(raw === null || raw === undefined ? '' : raw)
      .replace(NAME_DROP, '')
      .replace(/\s+/g, ' ').trim();
    if (!s || s.length > LIMITS.name) return null;
    if (s.indexOf('/') >= 0) return null;
    if (/^[.\s]+$/.test(s)) return null;
    var key = nameKey(s);
    if (!key || /^[.]+$/.test(key) || /^__.*__$/.test(key)) return null;
    return s;
  }
  /* The id of a nickname in names/ (unique per session); equal to nameKey() in firestore.rules. */
  function nameKey(name) { return String(name).toLowerCase().replace(NAME_SKIP, ''); }

  /* A session is "live" while it has not ended and is less than 1 day old (firestore.rules isLive). Only a
     live session can be read by anyone who knows the code and joined; after that only its owner and its own
     players see it. For anyone else it looks ended: hiddenSession() is what they get. */
  function isLive(s, nowMs) {
    if (!s || s.state === 'ended') return false;
    var t = typeof nowMs === 'number' ? nowMs : Date.now();
    return !(typeof s.createdAt === 'number' && s.createdAt < t - DAY);
  }
  function hiddenSession(seen) {
    var s = {}, k;
    if (seen) for (k in seen) s[k] = seen[k];
    else s = { title: '', lang: '', current: -1, questionStartedAt: null, starts: {}, timePerQ: LIMITS.defaultTime, locked: true,
      createdAt: null, expireAt: null, questions: [], reveal: null, playerCount: 0, kicked: [] };
    s.state = 'ended';
    return s;
  }

  /* "123 456" / "123-456" → "123456"; anything that is not 6 digits → null. */
  function normalizeCode(code) {
    var s = String(code === null || code === undefined ? '' : code).replace(/[\s-]/g, '');
    return /^[0-9]{6}$/.test(s) ? s : null;
  }

  /* Quiz → clean {title, questions:[{q, options, correct, explain?, time?}], lang} or throws invalid-input.
     Accepts Quiz Maker's field names too (text → q, answer → correct). */
  function validateQuiz(quiz) {
    if (!quiz || typeof quiz !== 'object') throw bad('quiz must be an object');
    var title = cleanText(quiz.title).replace(/\s+/g, ' ');
    if (!title) throw bad('quiz title is empty');
    if (title.length > LIMITS.title) throw bad('quiz title is longer than ' + LIMITS.title + ' characters');
    var qs = quiz.questions;
    if (!Array.isArray(qs) || !qs.length) throw bad('quiz has no questions');
    if (qs.length > LIMITS.questions) throw bad('quiz has more than ' + LIMITS.questions + ' questions');
    var out = [];
    for (var i = 0; i < qs.length; i++) {
      var src = qs[i] && typeof qs[i] === 'object' ? qs[i] : {};
      var n = 'question ' + (i + 1) + ': ';
      var q = cleanText(src.q !== undefined && src.q !== null ? src.q : src.text, true);
      if (!q) throw bad(n + 'text is empty');
      if (q.length > LIMITS.question) throw bad(n + 'text is too long');
      if (!Array.isArray(src.options)) throw bad(n + 'options missing');
      if (src.options.length < LIMITS.minOptions || src.options.length > LIMITS.maxOptions) throw bad(n + 'needs 2 to 6 options');
      var opts = [];
      for (var j = 0; j < src.options.length; j++) {
        var o = cleanText(src.options[j], true);
        if (!o) throw bad(n + 'option ' + (j + 1) + ' is empty');
        if (o.length > LIMITS.option) throw bad(n + 'option ' + (j + 1) + ' is too long');
        opts.push(o);
      }
      var c = Number(src.correct !== undefined && src.correct !== null ? src.correct : src.answer);
      if (!isInt(c) || c < 0 || c >= opts.length) throw bad(n + 'correct answer is not one of the options');
      var item = { q: q, options: opts, correct: c };
      var ex = cleanText(src.explain, true);
      if (ex) {
        if (ex.length > LIMITS.explain) throw bad(n + 'explanation is too long');
        item.explain = ex;
      }
      var tm = Number(src.time);
      if (src.time !== undefined && src.time !== null && src.time !== '' && isFinite(tm) && tm > 0) {
        item.time = clampInt(tm, LIMITS.minTime, LIMITS.maxTime, LIMITS.defaultTime);
      }
      out.push(item);
    }
    var lang = cleanText(quiz.lang);
    if (!/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/.test(lang)) lang = 'en';
    return { title: title, questions: out, lang: lang };
  }

  /* Clean quiz + options → what a session stores: public questions (no answers) + the private key. */
  function buildSession(clean, opts) {
    opts = opts || {};
    var timePerQ = clampInt(opts.timePerQ, LIMITS.minTime, LIMITS.maxTime, LIMITS.defaultTime);
    var order = clean.questions.map(function (_, i) { return i; });
    if (opts.shuffle) order = shuffled(order);
    var questions = [], correct = [], explain = [];
    order.forEach(function (k) {
      var src = clean.questions[k];
      var oi = src.options.map(function (_, j) { return j; });
      if (opts.shuffleOptions) oi = shuffled(oi);
      questions.push({ q: src.q, options: oi.map(function (j) { return src.options[j]; }), time: src.time || timePerQ });
      correct.push(oi.indexOf(src.correct));
      explain.push(src.explain || '');
    });
    return { timePerQ: timePerQ, questions: questions, correct: correct, explain: explain };
  }

  /* Scoring rule of LIVE_SPEC: correct → 500 + round(500 × max(0, 1 − ms / (time × 1000))), wrong → 0. */
  function points(isCorrect, ms, timeSec) {
    if (!isCorrect) return 0;
    var T = Math.max(1, Number(timeSec) || LIMITS.defaultTime) * 1000;
    if (ms === null || ms === undefined || !isFinite(Number(ms))) return 500;
    return 500 + Math.round(500 * Math.max(0, 1 - Math.max(0, Number(ms)) / T));
  }

  /* writeScores value: a number (total score) or {score?, last?, lastQ?, rank?}. → clean fields or throws. */
  function scoreFields(v) {
    var out = {}, n = 0;
    if (typeof v === 'number') v = { score: v };
    if (!v || typeof v !== 'object') throw bad('score must be a number or an object');
    if (v.score !== undefined) { if (!isFinite(Number(v.score)) || Number(v.score) < 0) throw bad('bad score'); out.score = Math.round(Number(v.score)); n++; }
    if (v.last !== undefined) { if (!isFinite(Number(v.last)) || Number(v.last) < 0) throw bad('bad last'); out.last = Math.round(Number(v.last)); n++; }
    if (v.lastQ !== undefined) { if (!isInt(Number(v.lastQ)) || Number(v.lastQ) < 0) throw bad('bad lastQ'); out.lastQ = Number(v.lastQ); n++; }
    if (v.rank !== undefined) { if (!isInt(Number(v.rank)) || Number(v.rank) < 1) throw bad('bad rank'); out.rank = Number(v.rank); n++; }
    if (!n) throw bad('nothing to write');
    return out;
  }

  /* From a hostWatch() state: the score updates for question i (only players whose numbers change).
     Re-running it for the same question does not count points twice (uses player.last / lastQ). */
  function computeScores(state, i) {
    var out = {};
    var s = state && state.session;
    if (!s || !isInt(i) || !s.questions || !s.questions[i]) return out;
    var correct = s.reveal && s.reveal.index === i ? s.reveal.correct : (state.key && state.key.correct ? state.key.correct[i] : null);
    if (!isInt(correct)) return out;
    var time = s.questions[i].time || s.timePerQ || LIMITS.defaultTime;
    var ans = (state.answers && state.answers[i]) || {};
    (state.players || []).forEach(function (p) {
      var score = Number(p.score) || 0;
      var counted = p.lastQ === i;
      var base = counted ? score - (Number(p.last) || 0) : score;
      var a = ans[p.id];
      var pts = a && a.choice === correct ? points(true, a.ms, time) : 0;
      if (counted ? p.last !== pts : pts > 0) out[p.id] = { score: Math.max(0, base + pts), last: pts, lastQ: i };
    });
    return out;
  }

  /* Players sorted for a leaderboard, with competition ranks (equal scores share a rank: 1, 1, 3). */
  function rankPlayers(players) {
    var list = (players || []).map(function (p) { var c = {}; for (var k in p) c[k] = p[k]; c.score = Number(p.score) || 0; return c; });
    list.sort(function (a, b) {
      return (b.score - a.score) || ((a.joinedAt || 0) - (b.joinedAt || 0)) || String(a.name).localeCompare(String(b.name));
    });
    for (var i = 0; i < list.length; i++) list[i].rank = i && list[i].score === list[i - 1].score ? list[i - 1].rank : i + 1;
    return list;
  }

  /* What students may see of a session (drops owner uid and the kicked list). */
  function publicSession(code, s) {
    if (!s) return null;
    var out = { code: code };
    ['title', 'lang', 'state', 'current', 'questionStartedAt', 'timePerQ', 'locked', 'createdAt', 'expireAt',
      'questions', 'reveal', 'playerCount'].forEach(function (k) { if (s[k] !== undefined) out[k] = s[k]; });
    return out;
  }

  /* Answer docs [{uid, i, choice, at}] → {[i]: {[uid]: {choice, ms, at}}}; ms counts from that question's start. */
  function answersFrom(docs, s) {
    var out = {};
    (docs || []).forEach(function (a) {
      if (!a || !isInt(a.i)) return;
      var start = s && s.starts && s.starts[a.i] !== undefined && s.starts[a.i] !== null ? s.starts[a.i]
        : (s && s.current === a.i ? s.questionStartedAt : null);
      var ms = typeof a.at === 'number' && typeof start === 'number' ? Math.max(0, a.at - start) : null;
      (out[a.i] = out[a.i] || {})[a.uid] = { choice: a.choice, ms: ms, at: typeof a.at === 'number' ? a.at : null };
    });
    return out;
  }

  function cleanPlayer(id, p) {
    var o = { id: id, name: p.name, score: Number(p.score) || 0, joinedAt: typeof p.joinedAt === 'number' ? p.joinedAt : null };
    if (p.last !== undefined && p.last !== null) o.last = p.last;
    if (p.lastQ !== undefined && p.lastQ !== null) o.lastQ = p.lastQ;
    if (p.rank !== undefined && p.rank !== null) o.rank = p.rank;
    return o;
  }
  function sortPlayers(list) {
    return list.sort(function (a, b) { return ((a.joinedAt || 0) - (b.joinedAt || 0)) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0); });
  }

  /* "Stay updated" list (shared/signup.js → EDUCloud.registerInterest). Adults only; the form asks for consent.
     firestore.rules (match /interest/{id}) checks the same shape: keep both in step. */
  var INTEREST = {
    name: 60, org: 80, place: 60, email: 254,
    roles: ['teacher', 'principal', 'student', 'parent', 'org', 'other'],
    topics: ['apps', 'videos', 'training'],
    pages: ['home', 'schools', 'business', 'other'],
    langs: ['en', 'hi', 'bn', 'mr', 'gu', 'pa', 'or', 'ta', 'te', 'kn', 'ml', 'ur']
  };
  /* firestore.rules (validEmail) also refuses control characters, so the client refuses them too */
  var EMAIL_RE = /^[^\s\u0000-\u001f\u007f@<>()[\]\\,;:"]+@[^\s\u0000-\u001f\u007f@<>()[\]\\,;:"]+\.[^\s\u0000-\u001f\u007f@<>()[\]\\,;:".]{2,}$/;
  /* one line of text, at most max UTF-16 units (so the rules' size() limit holds however it counts) */
  function shortText(v, max) {
    var s = cleanText(v, false).replace(/\s+/g, ' ');
    if (s.length > max) s = s.slice(0, max).replace(/[\ud800-\udbff]$/, '').trim();
    return s;
  }
  function validEmail(v) {
    var e = String(v === null || v === undefined ? '' : v).trim().toLowerCase();
    return e.length >= 6 && e.length <= INTEREST.email && EMAIL_RE.test(e) ? e : null;
  }
  /* The record stored for one sign-up (exactly these fields; createdAt and uid are added by the backend).
     Throws invalid-input for a bad email, role, topic list or missing consent. */
  function validateInterest(d) {
    d = d || {};
    var email = validEmail(d.email);
    if (!email) throw bad('Please give a valid email address.');
    if (INTEREST.roles.indexOf(d.role) < 0) throw bad('Unknown role.');
    var topics = [];
    (Array.isArray(d.topics) ? d.topics : []).forEach(function (x) {
      if (INTEREST.topics.indexOf(x) < 0) throw bad('Unknown topic.');
      if (topics.indexOf(x) < 0) topics.push(x);
    });
    if (!topics.length) throw bad('Choose at least one topic.');
    if (d.consent !== true) throw bad('Consent is required.');
    function lang(v) { return INTEREST.langs.indexOf(v) >= 0 ? v : 'en'; }
    return {
      name: shortText(d.name, INTEREST.name),
      email: email,
      role: d.role,
      org: shortText(d.org, INTEREST.org),
      place: shortText(d.place, INTEREST.place),
      prefLang: lang(d.prefLang),
      topics: topics,
      consent: true,
      lang: lang(d.lang),
      page: INTEREST.pages.indexOf(d.page) >= 0 ? d.page : 'other'
    };
  }

  /* Page URL with ?mock=1 added (for a "use Demo mode instead" link). */
  function demoUrl() {
    try {
      var u = new URL(location.href);
      u.searchParams.set('mock', '1');
      return u.toString();
    } catch (e) { return '?mock=1'; }
  }

  var util = {
    ERROR_CODES: ERROR_CODES, LIMITS: LIMITS, DAY: DAY, STATES: STATES,
    cloudError: cloudError, isCloudError: isCloudError, isInt: isInt, clampInt: clampInt, rid: rid,
    randomCode: randomCode, cleanText: cleanText, normalizeName: normalizeName, nameKey: nameKey,
    isLive: isLive, hiddenSession: hiddenSession,
    normalizeCode: normalizeCode, validateQuiz: validateQuiz, buildSession: buildSession, points: points,
    scoreFields: scoreFields, computeScores: computeScores, rankPlayers: rankPlayers,
    publicSession: publicSession, answersFrom: answersFrom, cleanPlayer: cleanPlayer, sortPlayers: sortPlayers,
    demoUrl: demoUrl, INTEREST: INTEREST, validEmail: validEmail, validateInterest: validateInterest
  };

  /* =========================================================== mock storage */
  var P = 'edu.cloudmock.';
  var DEMO_TEACHER = { uid: 'demo-teacher', name: 'Demo Teacher', email: '', photo: '' };
  var memLS = {};
  var LS = null;
  try {
    LS = window.localStorage;
    LS.setItem(P + '__probe', '1');
    LS.removeItem(P + '__probe');
  } catch (e) { LS = null; }

  function sGet(k) {
    var v = null;
    try { v = LS ? LS.getItem(k) : (Object.prototype.hasOwnProperty.call(memLS, k) ? memLS[k] : null); } catch (e) { v = null; }
    if (v === null || v === undefined) return null;
    try { return JSON.parse(v); } catch (e) { return null; }
  }
  function sSet(k, v) {
    var s = JSON.stringify(v);
    if (LS) {
      try { LS.setItem(k, s); return; } catch (e) { throw cloudError('unknown', 'Demo storage on this device is full. Delete old sessions.'); }
    }
    memLS[k] = s;
  }
  function sDel(k) { try { if (LS) LS.removeItem(k); else delete memLS[k]; } catch (e) { } }
  function sKeys(prefix) {
    var out = [];
    try {
      if (LS) { for (var i = 0; i < LS.length; i++) { var k = LS.key(i); if (k && k.indexOf(prefix) === 0) out.push(k); } }
      else { for (var k2 in memLS) if (k2.indexOf(prefix) === 0) out.push(k2); }
    } catch (e) { }
    return out;
  }

  var K = {
    teacher: P + 'teacher',
    ver: P + 'ver',
    tdoc: function (uid) { return P + 'teachers/' + uid; },
    quiz: function (id) { return P + 'quizzes/' + id; },
    session: function (code) { return P + 'sessions/' + code; },
    sub: function (code, coll) { return P + 'sessions/' + code + '/' + coll + '/'; },
    player: function (code, uid) { return P + 'sessions/' + code + '/players/' + uid; },
    answer: function (code, uid, i) { return P + 'sessions/' + code + '/answers/' + uid + '_' + i; },
    name: function (code, key) { return P + 'sessions/' + code + '/names/' + encodeURIComponent(key); },
    key: function (code) { return P + 'sessions/' + code + '/private/key'; }
  };

  /* per-tab anonymous student id: sessionStorage survives reload, a new tab gets a new id */
  var anonMem = null;
  function anonId() {
    var k = P + 'anon';
    try {
      var v = window.sessionStorage.getItem(k);
      if (v) return v;
      v = 'anon-' + rid(16);
      window.sessionStorage.setItem(k, v);
      return v;
    } catch (e) { }
    return anonMem || (anonMem = 'anon-' + rid(16));
  }

  /* =========================================================== live updates across tabs */
  var watchers = [];
  var teacherLs = [];
  var lastTeacherKey = null;
  var refreshTimer = null, pollTimer = null, lastVer = null;
  var bc = null;
  try {
    if (typeof BroadcastChannel === 'function') {
      bc = new BroadcastChannel('edu.cloudmock');
      bc.onmessage = function () { fireTeacher(); scheduleRefresh(); };
    }
  } catch (e) { bc = null; }
  try {
    window.addEventListener('storage', function (e) {
      if (e.key !== null && String(e.key).indexOf(P) !== 0) return;
      fireTeacher();
      scheduleRefresh();
    });
  } catch (e) { }

  function scheduleRefresh() {
    if (refreshTimer || !watchers.length) return;
    refreshTimer = setTimeout(function () {
      refreshTimer = null;
      watchers.slice().forEach(function (w) { w.refresh(); });
    }, 15);
  }
  function notify() {
    var v = Date.now() + '.' + rid(4);
    try { sSet(K.ver, v); } catch (e) { }
    lastVer = v;
    try { if (bc) bc.postMessage({ v: v }); } catch (e) { }
    scheduleRefresh();
  }
  function startPoll() {
    if (pollTimer) return;
    lastVer = sGet(K.ver);
    pollTimer = setInterval(function () {
      var v = sGet(K.ver);
      if (v !== lastVer) { lastVer = v; fireTeacher(); scheduleRefresh(); }
    }, 1000);
  }
  function stopPollIfIdle() {
    if (pollTimer && !watchers.length && !teacherLs.length) { clearInterval(pollTimer); pollTimer = null; }
  }
  function addWatcher(w) {
    watchers.push(w);
    startPoll();
    Promise.resolve().then(function () { w.refresh(); });
    return function () {
      if (w.stopped) return;
      w.stopped = true;
      var i = watchers.indexOf(w);
      if (i >= 0) watchers.splice(i, 1);
      stopPollIfIdle();
    };
  }
  /* calls cb(state) only when the state really changed; errors go to onError once per error code */
  function makeWatcher(build, cb, onError) {
    var w = { last: null, lastErr: null, stopped: false };
    w.refresh = function () {
      if (w.stopped) return;
      var state;
      try { state = build(); } catch (e) {
        var err = isCloudError(e) ? e : cloudError('unknown', e && e.message);
        if (w.lastErr !== err.code) { w.lastErr = err.code; w.last = null; if (typeof onError === 'function') onError(err); }
        return;
      }
      w.lastErr = null;
      var json = JSON.stringify(state);
      if (json === w.last) return;
      w.last = json;
      if (typeof cb === 'function') cb(JSON.parse(json));
    };
    return w;
  }

  /* =========================================================== teacher */
  function currentTeacher() {
    var t = sGet(K.teacher);
    if (!t || t.uid !== DEMO_TEACHER.uid) return null;
    return { uid: t.uid, name: t.name || DEMO_TEACHER.name, email: t.email || '', photo: t.photo || '', demo: true };
  }
  function fireTeacher() {
    var t = currentTeacher();
    var key = t ? t.uid : '';
    if (key === lastTeacherKey) return;
    lastTeacherKey = key;
    teacherLs.slice().forEach(function (l) { l.cb(t ? copy(t) : null); });
  }
  lastTeacherKey = (function () { var t = currentTeacher(); return t ? t.uid : ''; })();

  function requireTeacher() {
    var t = currentTeacher();
    if (!t) throw cloudError('permission-denied', 'Please sign in as a teacher first.');
    return t;
  }
  function requireOwner(code) {
    var t = requireTeacher();
    var c = normalizeCode(code);
    var s = c && sGet(K.session(c));
    if (!s) throw cloudError('not-found', 'No session with this code.');
    if (s.owner !== t.uid) throw cloudError('permission-denied', 'This is not your session.');
    return { teacher: t, code: c, s: s };
  }
  function checkIndex(s, i) {
    if (!isInt(i) || i < 0 || !s.questions || i >= s.questions.length) throw bad('no question number ' + i);
  }

  function copy(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }
  /* every call is async like the real thing; errors reject with an EDUCloud error code */
  function run(fn) {
    return Promise.resolve().then(fn).then(copy, function (e) {
      throw isCloudError(e) ? e : cloudError('unknown', e && e.message);
    });
  }

  /* =========================================================== helpers over stored docs */
  function playersOf(code) {
    var pre = K.sub(code, 'players');
    return sortPlayers(sKeys(pre).map(function (k) {
      var p = sGet(k);
      return p ? cleanPlayer(k.slice(pre.length), p) : null;
    }).filter(Boolean));
  }
  function answerDocsOf(code, uid) {
    var pre = K.sub(code, 'answers') + (uid ? uid + '_' : '');
    return sKeys(pre).map(sGet).filter(Boolean);
  }
  function hostState(code, s) {
    var key = sGet(K.key(code));
    var session = { code: code };
    for (var k in s) session[k] = s[k];
    return {
      code: code,
      session: session,
      players: playersOf(code),
      answers: answersFrom(answerDocsOf(code), s),
      key: key ? { correct: key.correct || [], explain: key.explain || [] } : null
    };
  }
  function deleteSessionDeep(code) {
    sKeys(P + 'sessions/' + code + '/').forEach(sDel);
    sDel(K.session(code));
  }
  /* retention: sessions older than 30 days are deleted by the app (LIVE_SPEC "Retention on the FREE plan") */
  function isExpired(s) {
    var t = Date.now();
    return (typeof s.expireAt === 'number' && s.expireAt < t) || (typeof s.createdAt === 'number' && s.createdAt < t - LIMITS.keepDays * DAY);
  }
  function purgeOwn(uid) {
    var n = 0;
    ownSessionCodes(uid).forEach(function (c) { if (isExpired(sGet(K.session(c)))) { deleteSessionDeep(c); n++; } });
    if (n) notify();
    return n;
  }
  function ownSessionCodes(uid) {
    var pre = P + 'sessions/';
    return sKeys(pre).map(function (k) { return k.slice(pre.length); }).filter(function (c) {
      if (!/^[0-9]{6}$/.test(c)) return false;
      var s = sGet(K.session(c));
      return s && s.owner === uid;
    });
  }

  /* =========================================================== the API */
  var M = {
    mode: 'mock',
    isDemo: true,
    util: util,

    ready: function () { return Promise.resolve(); },

    now: function () { return Date.now(); },

    onTeacher: function (cb) {
      var l = { cb: typeof cb === 'function' ? cb : function () { }, off: false };
      teacherLs.push(l);
      startPoll();
      Promise.resolve().then(function () { if (!l.off) { var t = currentTeacher(); l.cb(t ? copy(t) : null); } });
      return function () {
        l.off = true;
        var i = teacherLs.indexOf(l);
        if (i >= 0) teacherLs.splice(i, 1);
        stopPollIfIdle();
      };
    },

    signInTeacher: function () {
      return run(function () {
        sSet(K.teacher, DEMO_TEACHER);
        if (!sGet(K.tdoc(DEMO_TEACHER.uid))) sSet(K.tdoc(DEMO_TEACHER.uid), { name: DEMO_TEACHER.name, createdAt: Date.now(), plan: 'free' });
        notify();
        fireTeacher();
        return currentTeacher();
      });
    },

    signOut: function () {
      return run(function () { sDel(K.teacher); notify(); fireTeacher(); });
    },

    deleteTeacherAccount: function () {
      return run(function () {
        var t = requireTeacher();
        sKeys(P + 'quizzes/').forEach(function (k) { var q = sGet(k); if (!q || q.owner === t.uid) sDel(k); });
        ownSessionCodes(t.uid).forEach(deleteSessionDeep);
        sDel(K.tdoc(t.uid));
        sDel(K.teacher);
        notify();
        fireTeacher();
      });
    },

    listQuizzes: function () {
      return run(function () {
        var t = requireTeacher();
        var pre = P + 'quizzes/';
        return sKeys(pre).map(function (k) {
          var q = sGet(k);
          if (!q || q.owner !== t.uid) return null;
          return { id: k.slice(pre.length), title: q.title, count: (q.questions || []).length, updatedAt: q.updatedAt || q.createdAt || 0 };
        }).filter(Boolean).sort(function (a, b) { return b.updatedAt - a.updatedAt; });
      });
    },

    getQuiz: function (id) {
      return run(function () {
        var t = requireTeacher();
        if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(id)) throw cloudError('not-found', 'No such quiz.');
        var q = sGet(K.quiz(id));
        if (!q) throw cloudError('not-found', 'No such quiz.');
        if (q.owner !== t.uid) throw cloudError('permission-denied', 'This is not your quiz.');
        return { id: id, title: q.title, questions: q.questions, lang: q.lang, createdAt: q.createdAt, updatedAt: q.updatedAt };
      });
    },

    saveQuiz: function (quiz) {
      return run(function () {
        var t = requireTeacher();
        var clean = validateQuiz(quiz);
        var id = quiz.id;
        if (id !== undefined && id !== null && id !== '') {
          if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(id)) throw bad('bad quiz id');
        } else {
          do { id = 'q' + rid(19); } while (sGet(K.quiz(id)));
        }
        var old = sGet(K.quiz(id));
        if (old && old.owner !== t.uid) throw cloudError('permission-denied', 'This is not your quiz.');
        var now = Date.now();
        sSet(K.quiz(id), { owner: t.uid, title: clean.title, questions: clean.questions, lang: clean.lang, createdAt: old ? old.createdAt : now, updatedAt: now });
        notify();
        return id;
      });
    },

    deleteQuiz: function (id) {
      return run(function () {
        var t = requireTeacher();
        if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(id)) return;
        var q = sGet(K.quiz(id));
        if (!q) return;
        if (q.owner !== t.uid) throw cloudError('permission-denied', 'This is not your quiz.');
        sDel(K.quiz(id));
        notify();
      });
    },

    createSession: function (quiz, opts) {
      return run(function () {
        var t = requireTeacher();
        var clean = validateQuiz(quiz);
        var b = buildSession(clean, opts);
        var code, tries = 0;
        do { code = randomCode(); } while (sGet(K.session(code)) && ++tries < 100);
        if (sGet(K.session(code))) throw cloudError('unknown', 'Could not find a free code.');
        var now = Date.now(), expireAt = now + LIMITS.keepDays * DAY;
        sSet(K.session(code), {
          owner: t.uid, title: clean.title, lang: clean.lang, state: 'lobby', current: -1, questionStartedAt: null,
          starts: {}, timePerQ: b.timePerQ, locked: false, createdAt: now, expireAt: expireAt,
          questions: b.questions, reveal: null, playerCount: 0, kicked: [],
          quizId: typeof quiz.id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(quiz.id) ? quiz.id : null
        });
        sSet(K.key(code), { owner: t.uid, correct: b.correct, explain: b.explain, expireAt: expireAt });
        notify();
        return { code: code };
      });
    },

    hostWatch: function (code, cb, onError) {
      var c = normalizeCode(code);
      return addWatcher(makeWatcher(function () {
        var t = requireTeacher();
        var s = c && sGet(K.session(c));
        if (!s) return { code: c || String(code), session: null, players: [], answers: {}, key: null };
        if (s.owner !== t.uid) throw cloudError('permission-denied', 'This is not your session.');
        return hostState(c, s);
      }, cb, onError));
    },

    startQuestion: function (code, i) {
      return run(function () {
        var o = requireOwner(code), s = o.s;
        checkIndex(s, i);
        if (s.state === 'ended') throw cloudError('session-ended', 'This session has ended.');
        var now = Date.now();
        s.state = 'question'; s.current = i; s.questionStartedAt = now;
        s.starts = s.starts || {}; s.starts[i] = now;
        s.reveal = null; s.playerCount = playersOf(o.code).length;
        sSet(K.session(o.code), s);
        notify();
      });
    },

    revealQuestion: function (code, i) {
      return run(function () {
        var o = requireOwner(code), s = o.s;
        checkIndex(s, i);
        if (s.state === 'ended') throw cloudError('session-ended', 'This session has ended.');
        var key = sGet(K.key(o.code)) || { correct: [], explain: [] };
        var reveal = { index: i, correct: key.correct[i], explain: (key.explain && key.explain[i]) || '' };
        s.state = 'reveal'; s.current = i; s.reveal = reveal; s.playerCount = playersOf(o.code).length;
        sSet(K.session(o.code), s);
        notify();
        return reveal;
      });
    },

    writeScores: function (code, scores) {
      return run(function () {
        var o = requireOwner(code);
        if (!scores || typeof scores !== 'object') throw bad('scores must be an object');
        var updates = [];
        Object.keys(scores).forEach(function (pid) { updates.push([pid, scoreFields(scores[pid])]); });
        updates.forEach(function (u) {
          var p = sGet(K.player(o.code, u[0]));
          if (!p) return;                                  /* left or kicked meanwhile: skip */
          for (var k in u[1]) p[k] = u[1][k];
          sSet(K.player(o.code, u[0]), p);
        });
        if (updates.length) notify();
      });
    },

    lockSession: function (code, locked) {
      return run(function () {
        var o = requireOwner(code);
        o.s.locked = !!locked;
        o.s.playerCount = playersOf(o.code).length;
        sSet(K.session(o.code), o.s);
        notify();
      });
    },

    kickPlayer: function (code, playerId) {
      return run(function () {
        var o = requireOwner(code);
        if (typeof playerId !== 'string' || !playerId) throw bad('bad player id');
        var p = sGet(K.player(o.code, playerId));
        if (p) {
          var nk = K.name(o.code, nameKey(p.name));
          var nd = sGet(nk);
          if (nd && nd.uid === playerId) sDel(nk);
          sDel(K.player(o.code, playerId));
        }
        o.s.kicked = o.s.kicked || [];
        if (o.s.kicked.indexOf(playerId) < 0) o.s.kicked.push(playerId);
        o.s.playerCount = playersOf(o.code).length;
        sSet(K.session(o.code), o.s);
        notify();
      });
    },

    endSession: function (code) {
      return run(function () {
        var o = requireOwner(code);
        o.s.state = 'ended';
        o.s.playerCount = playersOf(o.code).length;
        sSet(K.session(o.code), o.s);
        notify();
      });
    },

    listSessions: function () {
      return run(function () {
        var t = requireTeacher();
        purgeOwn(t.uid);
        var out = [];
        ownSessionCodes(t.uid).forEach(function (c) {
          var s = sGet(K.session(c));
          out.push({ code: c, title: s.title, createdAt: s.createdAt, players: playersOf(c).length, state: s.state });
        });
        return out.sort(function (a, b) { return b.createdAt - a.createdAt; });
      });
    },

    sessionResults: function (code) {
      return run(function () {
        var o = requireOwner(code);
        return hostState(o.code, o.s);
      });
    },

    deleteSession: function (code) {
      return run(function () {
        var t = requireTeacher();
        var c = normalizeCode(code);
        var s = c && sGet(K.session(c));
        if (!s) return;
        if (s.owner !== t.uid) throw cloudError('permission-denied', 'This is not your session.');
        deleteSessionDeep(c);
        notify();
      });
    },

    joinSession: function (code, nickname) {
      var c = normalizeCode(code);
      var name = normalizeName(nickname);
      function doJoin() {
        if (!name) throw bad('Nickname must be 1 to 20 characters.');
        var s = c && sGet(K.session(c));
        if (!s) throw cloudError('not-found', 'No quiz with this code.');
        var me = anonId();
        var mine = sGet(K.player(c, me));
        if (mine) return { playerId: me, name: mine.name, rejoined: true };        /* reconnect: same player */
        /* not a player: an ended or day-old session is not even visible (firestore.rules isLive) */
        if (!isLive(s)) throw cloudError('session-ended', 'This quiz has ended.');
        if ((s.kicked || []).indexOf(me) >= 0) throw cloudError('permission-denied', 'The teacher removed you from this quiz.');
        if (s.locked) throw cloudError('session-locked', 'The teacher has locked this quiz.');
        var nk = K.name(c, nameKey(name));
        var taken = sGet(nk);
        if (taken && taken.uid !== me) throw cloudError('name-taken', 'Someone already uses this nickname.');
        var now = Date.now(), expireAt = now + LIMITS.keepDays * DAY;
        sSet(nk, { uid: me, expireAt: expireAt });
        sSet(K.player(c, me), { name: name, score: 0, joinedAt: now, expireAt: expireAt });
        notify();
        return { playerId: me, name: name };
      }
      return run(function () {
        if (!name) return doJoin();                         /* throws invalid-input */
        var locks = null;
        try { locks = navigator.locks && typeof navigator.locks.request === 'function' ? navigator.locks : null; } catch (e) { locks = null; }
        if (!locks || !c) return doJoin();
        /* serialise joins across tabs so two tabs cannot grab the same nickname at the same moment */
        var result, failed = null;
        var p;
        try {
          p = locks.request(P + 'join.' + c, function () {
            try { result = doJoin(); } catch (e) { failed = e; }
          });
        } catch (e) { return doJoin(); }
        return Promise.resolve(p).then(function () {
          if (failed) throw failed;
          return result;
        }, function () { return doJoin(); });       /* locks not allowed here (e.g. file://): join without it */
      });
    },

    playerWatch: function (code, cb, onError) {
      var c = normalizeCode(code);
      var seen = null;      /* the session as this watcher last saw it */
      return addWatcher(makeWatcher(function () {
        var me = anonId();
        var s = c && sGet(K.session(c));
        var p = s ? sGet(K.player(c, me)) : null;
        /* like firestore.rules: an ended or day-old session is visible only to its own players (and the
           owner); anyone else sees "ended", with what they saw before (Firebase mode does the same) */
        if (s && !p && !isLive(s)) s = hiddenSession(seen);
        else if (s) seen = s;
        var myAnswers = {};
        if (s) answerDocsOf(c, me).forEach(function (a) { myAnswers[a.i] = a.choice; });
        return {
          code: c || String(code),
          session: s ? publicSession(c, s) : null,
          me: p ? cleanPlayer(me, p) : null,
          myAnswers: myAnswers,
          kicked: !!(s && !p && (s.kicked || []).indexOf(me) >= 0)
        };
      }, cb, onError));
    },

    submitAnswer: function (code, i, choice) {
      return run(function () {
        if (!isInt(i) || i < 0 || !isInt(choice) || choice < 0) throw bad('bad question or choice');
        var c = normalizeCode(code);
        var s = c && sGet(K.session(c));
        if (!s) throw cloudError('not-found', 'No quiz with this code.');
        var me = anonId();
        var old = sGet(K.answer(c, me, i));
        if (old) {
          if (old.choice === choice) return true;          /* same answer again (retry): fine */
          throw cloudError('permission-denied', 'You already answered this question.');
        }
        if (s.state === 'ended') throw cloudError('session-ended', 'This quiz has ended.');
        if (!sGet(K.player(c, me))) throw cloudError('permission-denied', 'Join the quiz first.');
        if (s.state !== 'question' || s.current !== i) throw cloudError('permission-denied', 'This question is closed.');
        if (!s.questions[i] || choice >= s.questions[i].options.length) throw bad('no such option');
        sSet(K.answer(c, me, i), { uid: me, i: i, choice: choice, at: Date.now(), expireAt: s.expireAt });
        notify();
        return true;
      });
    },

    /* leave = delete my player doc + nickname; after the end (or when the session is gone) it is also
       "Remove me": my answers are deleted too. During a quiz answers stay (same as firestore.rules). */
    leaveSession: function (code) {
      return run(function () {
        var c = normalizeCode(code);
        if (!c) return;
        var me = anonId();
        var s = sGet(K.session(c));
        var changed = false;
        var p = sGet(K.player(c, me));
        if (p) {
          var nk = K.name(c, nameKey(p.name));
          var nd = sGet(nk);
          if (nd && nd.uid === me) sDel(nk);
          sDel(K.player(c, me));
          changed = true;
        }
        if (!s || s.state === 'ended') {
          sKeys(K.sub(c, 'answers') + me + '_').forEach(function (k) { sDel(k); changed = true; });
        }
        if (changed) notify();
      });
    },

    /* delete this teacher's sessions older than 30 days → number deleted (also runs by itself once per page) */
    purgeExpired: function () {
      return run(function () { return purgeOwn(requireTeacher().uid); });
    },

    /* "Stay updated" sign-up (shared/signup.js). Demo mode keeps it in this browser only, marked demo:true;
       nothing is sent anywhere. Like Firebase mode, every sign-up gets its own new anonymous id (never the quiz
       player's) and is stored under that id. → {id, demo:true} */
    registerInterest: function (data) {
      return run(function () {
        var rec = validateInterest(data);
        var id = 'anon-' + rid(16);
        rec.createdAt = Date.now();
        rec.uid = id;
        rec.demo = true;
        sSet(P + 'interest/' + id, rec);
        return { id: id, demo: true };
      });
    },

    /* How many sign-ups there are (the "Join 120+ teachers" line of the form). Demo mode: the sign-ups saved in
       this browser. Never rejects: a number, or null when it is not known. */
    signupCount: function () {
      return run(function () { return sKeys(P + 'interest/').length; }).catch(function () { return null; });
    },

    /* helpers (same on EDUCloud) */
    ERRORS: ERROR_CODES.slice(),
    LIMITS: LIMITS,
    normalizeName: normalizeName,
    normalizeCode: normalizeCode,
    points: points,
    computeScores: computeScores,
    rankPlayers: rankPlayers,
    demoUrl: demoUrl,
    INTEREST: INTEREST,
    validEmail: validEmail,

    /* test helper: wipe every demo-mode record in this browser */
    _reset: function () {
      sKeys(P).forEach(sDel);
      try { window.sessionStorage.removeItem(P + 'anon'); } catch (e) { }
      anonMem = null;
      notify();
      fireTeacher();
    }
  };

  window.EDUCloudMock = M;

  /* once per page: a signed-in demo teacher's old sessions are cleaned up, like in Firebase mode */
  setTimeout(function () {
    try { var t = currentTeacher(); if (t) purgeOwn(t.uid); } catch (e) { }
  }, 0);
})();
