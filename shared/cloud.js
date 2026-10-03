/* AI Pathshala Apps: window.EDUCloud, the ONLY place that talks to Firebase.
 *
 * Used by the optional teacher account + Live Class Quiz (apps/live-quiz, apps/quiz-join).
 * Spec: LIVE_SPEC.md. Usage for app authors: firebase/API.md. Security rules: firebase/firestore.rules.
 *
 * Script order in an app:
 *   ../../shared/edu.js → strings.js → ../../shared/firebase-config.js → ../../shared/cloud-mock.js →
 *   ../../shared/cloud.js → app.js
 *
 * EDUCloud.mode is 'firebase' when window.EDU_FIREBASE is set, the page is http(s) and the URL has no ?mock=1;
 * otherwise 'mock' ("Demo mode", every call goes to window.EDUCloudMock and nothing leaves the device).
 *
 * Firebase mode:
 *   - loads the Firebase compat SDK (pinned) from jsDelivr only when first needed (ready()),
 *   - teachers sign in with Google (popup; full-page redirect when the popup is blocked / not supported),
 *   - students get an anonymous uid in a SEPARATE Firebase app instance ('edu-student'), so a teacher and a
 *     student on the same browser never mix; it is remembered on the device, so a reload = same player,
 *   - no Analytics, no tracking, nothing else is loaded.
 * All async functions reject with an Error whose .code is one of EDUCloud.ERRORS.
 * Classic script, never throws at load time. */
(function () {
  'use strict';

  var SDK_VERSION = '12.19.0';
  var SDK_BASE = 'https://cdn.jsdelivr.net/npm/firebase@' + SDK_VERSION + '/';
  var STUDENT_APP = 'edu-student';
  var PENDING_DELETE = 'edu.cloud.pendingDelete';
  var CLOCK_KEY = 'edu.cloud.clock';
  var API = ['ready', 'onTeacher', 'signInTeacher', 'signOut', 'deleteTeacherAccount', 'listQuizzes', 'getQuiz',
    'saveQuiz', 'deleteQuiz', 'createSession', 'hostWatch', 'startQuestion', 'revealQuestion', 'writeScores',
    'lockSession', 'kickPlayer', 'endSession', 'listSessions', 'sessionResults', 'deleteSession', 'joinSession',
    'playerWatch', 'submitAnswer', 'leaveSession', 'purgeExpired'];

  function detectMode() {
    try {
      var cfg = window.EDU_FIREBASE;
      if (!cfg || typeof cfg !== 'object') return 'mock';
      if (!/^https?:$/.test(location.protocol)) return 'mock';
      if (new URLSearchParams(location.search).get('mock') === '1') return 'mock';
      return 'firebase';
    } catch (e) { return 'mock'; }
  }

  /* Fallback when shared/cloud-mock.js was not loaded (or something unexpected failed at load):
     a harmless object whose calls reject with 'not-configured'. */
  function stubCloud(mode, why) {
    function err() { var e = new Error(why); e.name = 'EDUCloudError'; e.code = 'not-configured'; return e; }
    var o = { mode: mode, isDemo: mode === 'mock', ERRORS: [], now: function () { return Date.now(); } };
    API.forEach(function (n) { o[n] = function () { return Promise.reject(err()); }; });
    o.onTeacher = function (cb) { setTimeout(function () { if (typeof cb === 'function') cb(null); }, 0); return function () { }; };
    o.hostWatch = o.playerWatch = function (c, cb, onError) {
      setTimeout(function () { if (typeof onError === 'function') onError(err()); }, 0);
      return function () { };
    };
    return o;
  }

  var MODE = detectMode();
  var Mock = window.EDUCloudMock;
  var U = Mock && Mock.util;
  if (!U) {
    window.EDUCloud = stubCloud(MODE, 'Load shared/cloud-mock.js before shared/cloud.js');
    return;
  }

  try {
    window.EDUCloud = build();
  } catch (e) {
    window.EDUCloud = stubCloud(MODE, 'EDUCloud failed to start: ' + (e && e.message));
  }

  function build() {
    var DAY = U.DAY;
    var cloudError = U.cloudError;
    function bad(m) { return cloudError('invalid-input', m); }
    function notFound(m) { return cloudError('not-found', m || 'Not found.'); }
    function denied(m) { return cloudError('permission-denied', m || 'Not allowed.'); }
    function copy(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }
    function noop() { }
    function validId(id) { return typeof id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(id); }
    function validPid(id) { return typeof id === 'string' && /^[^/]{1,128}$/.test(id) && id !== '.' && id !== '..'; }

    /* ------------------------------------------------------------ errors */
    var FB_MAP = {
      'permission-denied': 'permission-denied', 'unauthenticated': 'permission-denied',
      'not-found': 'not-found', 'resource-exhausted': 'quota-exceeded',
      'unavailable': 'offline', 'deadline-exceeded': 'offline',
      'invalid-argument': 'invalid-input', 'out-of-range': 'invalid-input',
      'auth/network-request-failed': 'offline', 'auth/timeout': 'offline',
      'auth/too-many-requests': 'quota-exceeded', 'auth/quota-exceeded': 'quota-exceeded',
      'auth/unauthorized-domain': 'not-configured', 'auth/operation-not-allowed': 'not-configured',
      'auth/invalid-api-key': 'not-configured', 'auth/configuration-not-found': 'not-configured',
      'auth/admin-restricted-operation': 'not-configured', 'auth/app-not-authorized': 'not-configured',
      'auth/invalid-app-credential': 'not-configured', 'auth/project-not-found': 'not-configured',
      'auth/requires-recent-login': 'permission-denied', 'auth/user-token-expired': 'permission-denied',
      'auth/user-disabled': 'permission-denied', 'auth/user-mismatch': 'permission-denied',
      'auth/invalid-user-token': 'permission-denied', 'auth/user-not-found': 'permission-denied'
    };
    var CANCELLED = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled', 'auth/redirect-cancelled-by-user'];
    /* Firebase / network error → EDUCloud error (.code from EDUCloud.ERRORS, .fbCode = original code).
       A sign-in window closed by the user gives code 'unknown' with .cancelled = true (apps: stay quiet). */
    function mapError(e) {
      if (U.isCloudError(e)) return e;
      var raw = String((e && e.code) || '');
      var c = raw.replace(/^firestore\//, '');
      if (CANCELLED.indexOf(c) >= 0) return cloudError('unknown', 'Sign-in was cancelled.', { cancelled: true, fbCode: raw });
      var code = FB_MAP[c] || (/api-key/.test(c) ? 'not-configured' : null);
      if (!code) {
        var offline = false;
        try { offline = navigator.onLine === false; } catch (x) { }
        code = offline ? 'offline' : 'unknown';
      }
      return cloudError(code, (e && e.message) || raw || 'Unknown error', { fbCode: raw, cause: e });
    }
    function rethrow(e) { throw mapError(e); }

    /* Firestore keeps writes queued while offline instead of failing, so every network step gets a time limit. */
    function timeout(p, msec) {
      return new Promise(function (resolve, reject) {
        var done = false;
        var t = setTimeout(function () {
          if (done) return;
          done = true;
          reject(cloudError('offline', 'No internet connection (no reply from the server).'));
        }, msec || 20000);
        Promise.resolve(p).then(function (v) { if (!done) { done = true; clearTimeout(t); resolve(v); } },
          function (e) { if (!done) { done = true; clearTimeout(t); reject(e); } });
      });
    }

    /* ------------------------------------------------------------ server clock estimate
       School computers often have a wrong clock. Countdowns and the 30-day expiry use now() ≈ server time:
       first from the HTTP Date header of this page (same origin, no quota), then refined from our own
       Firestore writes (time before/after a write vs the server timestamp it got). */
    var clock = { best: null, err: Infinity, upper: null };
    try {
      var saved = JSON.parse(window.localStorage.getItem(CLOCK_KEY) || 'null');
      if (saved && isFinite(saved.best) && Math.abs(Date.now() - saved.at) < DAY) { clock.best = saved.best; clock.err = 2000; }
    } catch (e) { }
    function bracket(t0, t1, serverMs, extraErr) {
      if (typeof serverMs !== 'number' || !isFinite(serverMs) || !(t1 >= t0)) return;
      var err = (t1 - t0) / 2 + (extraErr || 0);
      if (err > clock.err) return;
      clock.best = (t0 + t1) / 2 - serverMs;
      clock.err = err;
      try { window.localStorage.setItem(CLOCK_KEY, JSON.stringify({ best: clock.best, at: Date.now() })); } catch (e) { }
    }
    function arrival(serverMs) {      /* a snapshot of a just-started question: offset + network delay */
      if (typeof serverMs !== 'number' || !isFinite(serverMs)) return;
      var s = Date.now() - serverMs;
      if (clock.upper === null || s < clock.upper) clock.upper = s;
    }
    function offset() { return clock.best !== null ? clock.best : (clock.upper !== null ? clock.upper : 0); }
    function now() { return Date.now() - offset(); }
    var clockSynced = false;
    function syncClockFromPage() {
      if (clockSynced) return;
      clockSynced = true;
      try {
        if (typeof fetch !== 'function') return;
        var t0 = Date.now();
        fetch(location.href.split('#')[0], { method: 'HEAD', cache: 'no-store', credentials: 'same-origin' }).then(function (r) {
          var d = Date.parse(r.headers.get('date') || '');
          if (isFinite(d)) bracket(t0, Date.now(), d + 500, 500);    /* Date header has 1-second precision */
        }).catch(noop);
      } catch (e) { }
    }
    var pend = {};
    function pendStart(k) { pend[k] = { t0: Date.now(), t1: null, server: null }; }
    function pendAck(k) { var p = pend[k]; if (p) { p.t1 = Date.now(); settle(k); } }
    function pendServer(k, ms) { var p = pend[k]; if (p && typeof ms === 'number') { p.server = ms; settle(k); } }
    function settle(k) { var p = pend[k]; if (p && p.t1 !== null && p.server !== null) { bracket(p.t0, p.t1, p.server); delete pend[k]; } }

    /* ------------------------------------------------------------ SDK loading */
    var scriptPs = {};
    function loadScript(src) {
      if (scriptPs[src]) return scriptPs[src];
      scriptPs[src] = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = src;
        s.async = false;
        var timer = setTimeout(fail, 30000);
        function fail() {
          clearTimeout(timer);
          s.onload = s.onerror = null;
          try { if (s.parentNode) s.parentNode.removeChild(s); } catch (e) { }
          delete scriptPs[src];
          reject(cloudError('offline', 'Could not load the online library. Check the internet connection.'));
        }
        s.onload = function () { clearTimeout(timer); resolve(); };
        s.onerror = fail;
        (document.head || document.documentElement).appendChild(s);
      });
      return scriptPs[src];
    }
    function loadSDK() {
      var fb = window.firebase;
      if (fb && fb.initializeApp && fb.auth && fb.firestore) return Promise.resolve(fb);
      return loadScript(SDK_BASE + 'firebase-app-compat.js').then(function () {
        return Promise.all([loadScript(SDK_BASE + 'firebase-auth-compat.js'), loadScript(SDK_BASE + 'firebase-firestore-compat.js')]);
      }).then(function () {
        var f = window.firebase;
        if (!f || !f.initializeApp || !f.auth || !f.firestore) throw cloudError('offline', 'The online library did not load.');
        return f;
      });
    }

    /* ------------------------------------------------------------ state */
    var S = {
      readyP: null, fb: null, app: null, auth: null, db: null, authKnown: false,
      stuP: null, sAuth: null, sDb: null,
      teacher: null, teacherLs: [], teacherDocs: {}, redirectError: null, purged: {},
      host: {},   /* code → {session, players, key}: what the host page knows (from hostWatch / own writes) */
      stu: {}     /* code → {session, my:{i:choice}, changed()}: what the student page knows */
    };

    function cfgCopy() {
      var src = window.EDU_FIREBASE || {}, c = {};
      for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k) && k !== 'measurementId' && k !== 'emulator') c[k] = src[k];
      return c;
    }
    function wantEmulator() {
      try {
        var h = location.hostname;
        if (h !== 'localhost' && h !== '127.0.0.1') return false;
        return !!((window.EDU_FIREBASE && window.EDU_FIREBASE.emulator) || new URLSearchParams(location.search).get('emulator') === '1');
      } catch (e) { return false; }
    }
    function findApp(fb, name) {
      var list = fb.apps || [];
      for (var i = 0; i < list.length; i++) if (list[i] && list[i].name === name) return list[i];
      return null;
    }
    function setupApp(app) {
      var auth = app.auth(), db = app.firestore();
      try { db.settings({ ignoreUndefinedProperties: true, merge: true }); } catch (e) { }
      if (wantEmulator()) {
        try { auth.useEmulator('http://127.0.0.1:9099', { disableWarnings: true }); } catch (e) { }
        try { db.useEmulator('127.0.0.1', 8080); } catch (e) { }
      }
      return { auth: auth, db: db };
    }
    function ST() { return S.fb.firestore.FieldValue.serverTimestamp(); }
    function TS(msec) { return S.fb.firestore.Timestamp.fromMillis(Math.round(msec)); }
    function expireTS() { return TS(now() + U.LIMITS.keepDays * DAY); }
    function ms(v) {
      if (v === null || v === undefined) return null;
      if (typeof v === 'number') return v;
      if (typeof v.toMillis === 'function') return v.toMillis();
      if (v instanceof Date) return v.getTime();
      return null;
    }

    function sessionData(snap) {
      var d = snap.data({ serverTimestamps: 'estimate' }) || {};
      var s = {};
      for (var k in d) s[k] = d[k];
      s.code = snap.id;
      s.createdAt = ms(d.createdAt);
      s.expireAt = ms(d.expireAt);
      s.questionStartedAt = ms(d.questionStartedAt);
      var st = {};
      if (d.starts) for (var i in d.starts) st[i] = ms(d.starts[i]);
      s.starts = st;
      s.kicked = d.kicked || [];
      s.reveal = d.reveal || null;
      return copy(s);
    }
    function playerData(snap) {
      var x = snap.data({ serverTimestamps: 'estimate' }) || {};
      return U.cleanPlayer(snap.id, { name: x.name, score: x.score, joinedAt: ms(x.joinedAt), last: x.last, lastQ: x.lastQ, rank: x.rank });
    }
    function answerData(snap) {
      var x = snap.data({ serverTimestamps: 'estimate' }) || {};
      return { uid: x.uid, i: x.i, choice: x.choice, at: ms(x.at) };
    }
    function keyData(snap) {
      var x = snap.data() || {};
      return { correct: x.correct || [], explain: x.explain || [] };
    }

    /* ------------------------------------------------------------ ready + teacher auth */
    function toTeacher(u) {
      return u && !u.isAnonymous ? { uid: u.uid, name: u.displayName || '', email: u.email || '', photo: u.photoURL || '' } : null;
    }
    function deliver(l) {
      if (l.off) return;
      var key = S.teacher ? S.teacher.uid : '';
      if (l.key === key) return;
      l.key = key;
      l.cb(S.teacher ? copy(S.teacher) : null);
    }
    function setUser(u) {
      S.teacher = toTeacher(u);
      if (S.teacher) { ensureTeacherDoc(S.teacher); autoPurge(S.teacher.uid); }
      S.teacherLs.slice().forEach(deliver);
    }
    /* teachers/{uid} = {name, createdAt, plan:'free'}: created once, on the first sign-in */
    function ensureTeacherDoc(t) {
      if (S.teacherDocs[t.uid]) return S.teacherDocs[t.uid];
      var ref = S.db.collection('teachers').doc(t.uid);
      var p = timeout(ref.get()).then(function (snap) {
        if (!snap.exists) return timeout(ref.set({ name: String(t.name || '').slice(0, 100), createdAt: ST(), plan: 'free' }));
      }).catch(function () { delete S.teacherDocs[t.uid]; });
      S.teacherDocs[t.uid] = p;
      return p;
    }
    function onRedirectResult(res) {
      var pending = null;
      try { pending = window.sessionStorage.getItem(PENDING_DELETE); } catch (e) { }
      if (!pending) return;
      try { window.sessionStorage.removeItem(PENDING_DELETE); } catch (e) { }
      var u = S.auth.currentUser;
      if (res && res.user && u && u.uid === pending) {
        /* came back from the re-login that "Delete my account" needed: finish the deletion */
        return deleteAllData(u.uid).then(function () { return u.delete(); }).catch(function (e) { S.redirectError = mapError(e); });
      }
    }

    function ready() {
      if (S.readyP) return S.readyP;
      syncClockFromPage();
      var p = loadSDK().then(function (fb) {
        var cfg = cfgCopy();
        if (!cfg.apiKey || !cfg.projectId || !cfg.authDomain || !cfg.appId) throw cloudError('not-configured', 'window.EDU_FIREBASE is incomplete.');
        S.fb = fb;
        var app = findApp(fb, '[DEFAULT]') || fb.initializeApp(cfg);
        var x = setupApp(app);
        S.app = app; S.auth = x.auth; S.db = x.db;
        S.auth.getRedirectResult().then(onRedirectResult, function (e) { S.redirectError = mapError(e); });
        return new Promise(function (resolve) {
          S.auth.onAuthStateChanged(function (user) {
            S.authKnown = true;
            setUser(user);
            resolve();
          }, function () { S.authKnown = true; resolve(); });
        });
      });
      S.readyP = p.catch(function (e) { S.readyP = null; throw mapError(e); });
      return S.readyP;
    }

    function teacherOrThrow() {
      var u = S.auth && S.auth.currentUser;
      if (!u || u.isAnonymous) throw denied('Please sign in as a teacher first.');
      return u;
    }
    function withTeacher(fn) {
      return ready().then(function () { return fn(teacherOrThrow()); }).catch(rethrow);
    }
    function provider() {
      var p = new S.fb.auth.GoogleAuthProvider();
      p.setCustomParameters({ prompt: 'select_account' });
      return p;
    }
    function popupUnusable(e) {
      var c = String((e && e.code) || '');
      return c === 'auth/popup-blocked' || c === 'auth/operation-not-supported-in-this-environment';
    }

    function onTeacher(cb) {
      var l = { cb: typeof cb === 'function' ? cb : noop, key: undefined, off: false };
      S.teacherLs.push(l);
      ready().then(function () { deliver(l); }, function () { deliver(l); });
      return function () {
        l.off = true;
        var i = S.teacherLs.indexOf(l);
        if (i >= 0) S.teacherLs.splice(i, 1);
      };
    }

    function doSignIn(opts) {
      var prov = provider();
      if (opts.redirect) return S.auth.signInWithRedirect(prov).then(function () { return null; });
      return S.auth.signInWithPopup(prov).then(function (res) {
        setUser(res.user);
        var t = toTeacher(res.user);
        if (!t) throw denied('Not a teacher account.');
        return ensureTeacherDoc(t).then(function () { return copy(t); });
      }, function (e) {
        /* popup blocked (or not possible here, e.g. some in-app browsers): use a full-page redirect.
           The promise resolves null; after the redirect, onTeacher() reports the teacher. */
        if (popupUnusable(e)) return S.auth.signInWithRedirect(prov).then(function () { return null; });
        throw e;
      });
    }
    function signInTeacher(opts) {
      opts = opts || {};
      /* SDK already up: open the popup in this same click (browsers block popups opened later) */
      if (S.auth && S.authKnown) {
        try { return doSignIn(opts).catch(rethrow); } catch (e) { return Promise.reject(mapError(e)); }
      }
      return ready().then(function () { return doSignIn(opts); }).catch(rethrow);
    }

    function signOut() {
      return ready().then(function () { return S.auth.signOut(); }).then(function () { S.host = {}; }).catch(rethrow);
    }

    /* ------------------------------------------------------------ deleting */
    function commitOps(db, ops) {
      var chunks = [];
      for (var i = 0; i < ops.length; i += 450) chunks.push(ops.slice(i, i + 450));
      return chunks.reduce(function (p, ch) {
        return p.then(function () {
          var b = db.batch();
          ch.forEach(function (op) { op(b); });
          return timeout(b.commit(), 30000);
        });
      }, Promise.resolve());
    }
    /* session + players + answers + names + private/key (subcollections first, the session doc last) */
    function deleteSessionDeep(db, code) {
      var ref = db.collection('sessions').doc(code);
      return Promise.all(['players', 'answers', 'names'].map(function (c) { return timeout(ref.collection(c).get()); })).then(function (snaps) {
        var ops = [];
        snaps.forEach(function (qs) { qs.docs.forEach(function (d) { ops.push(function (b) { b.delete(d.ref); }); }); });
        return commitOps(db, ops);
      }).then(function () {
        var b = db.batch();
        b.delete(ref.collection('private').doc('key'));
        b.delete(ref);
        return timeout(b.commit());
      }).then(function () { delete S.host[code]; });
    }
    function deleteAllData(uid) {
      var db = S.db;
      return timeout(db.collection('quizzes').where('owner', '==', uid).get()).then(function (qs) {
        return commitOps(db, qs.docs.map(function (d) { return function (b) { b.delete(d.ref); }; }));
      }).then(function () {
        return timeout(db.collection('sessions').where('owner', '==', uid).get());
      }).then(function (qs) {
        return qs.docs.reduce(function (p, d) { return p.then(function () { return deleteSessionDeep(db, d.id); }); }, Promise.resolve());
      }).then(function () {
        return timeout(db.collection('teachers').doc(uid).delete());
      }).then(function () { S.host = {}; });
    }
    function recentLogin(u) {
      var t = Date.parse((u.metadata && u.metadata.lastSignInTime) || '');
      return isFinite(t) && now() - t < 4 * 60000;
    }
    function deleteAuthUser(u) {
      return u.delete().catch(function (e) {
        if (String(e && e.code) !== 'auth/requires-recent-login') throw e;
        return u.reauthenticateWithPopup(provider()).then(function () { return u.delete(); }, function (e2) {
          if (!popupUnusable(e2)) throw e2;
          /* no popup possible: re-login by redirect; ready() finishes the deletion when the page comes back */
          try { window.sessionStorage.setItem(PENDING_DELETE, u.uid); } catch (x) { }
          return u.reauthenticateWithRedirect(provider()).then(function () { return null; });
        });
      });
    }
    function deleteTeacherAccount() {
      /* Firebase deletes an account only after a recent sign-in. Ask for it FIRST (inside the same click,
         so the popup is allowed) and only then delete: a cancelled popup deletes nothing. */
      var pre = Promise.resolve();
      var u0 = S.auth && S.auth.currentUser;
      if (u0 && !u0.isAnonymous && !recentLogin(u0)) {
        try {
          pre = u0.reauthenticateWithPopup(provider()).then(noop, function (e) { if (!popupUnusable(e)) throw e; });
        } catch (e) { pre = Promise.reject(e); }
      }
      return pre.then(ready).then(function () {
        var u = teacherOrThrow();
        return deleteAllData(u.uid).then(function () { return deleteAuthUser(u); }).then(function () { S.teacherDocs = {}; });
      }).catch(rethrow);
    }

    /* ------------------------------------------------------------ quizzes */
    function listQuizzes() {
      return withTeacher(function (u) {
        return timeout(S.db.collection('quizzes').where('owner', '==', u.uid).get()).then(function (qs) {
          return qs.docs.map(function (d) {
            var x = d.data({ serverTimestamps: 'estimate' });
            return { id: d.id, title: x.title, count: (x.questions || []).length, updatedAt: ms(x.updatedAt) || ms(x.createdAt) || 0 };
          }).sort(function (a, b) { return b.updatedAt - a.updatedAt; });
        });
      });
    }
    function getQuiz(id) {
      return withTeacher(function () {
        if (!validId(id)) throw notFound('No such quiz.');
        return timeout(S.db.collection('quizzes').doc(id).get()).then(function (snap) {
          if (!snap.exists) throw notFound('No such quiz.');
          var x = snap.data({ serverTimestamps: 'estimate' });
          return { id: id, title: x.title, questions: x.questions || [], lang: x.lang, createdAt: ms(x.createdAt), updatedAt: ms(x.updatedAt) };
        });
      });
    }
    function saveQuiz(quiz) {
      return withTeacher(function (u) {
        var clean = U.validateQuiz(quiz);
        var col = S.db.collection('quizzes');
        var id = quiz.id;
        if (id !== undefined && id !== null && id !== '') { if (!validId(id)) throw bad('bad quiz id'); } else id = null;
        function create(ref) {
          return timeout(ref.set({ owner: u.uid, title: clean.title, questions: clean.questions, lang: clean.lang, createdAt: ST(), updatedAt: ST() }))
            .then(function () { return ref.id; });
        }
        if (!id) return create(col.doc());
        var ref = col.doc(id);
        return timeout(ref.get()).then(function (snap) {
          if (!snap.exists) return create(ref);
          return timeout(ref.update({ title: clean.title, questions: clean.questions, lang: clean.lang, updatedAt: ST() })).then(function () { return id; });
        });
      });
    }
    function deleteQuiz(id) {
      return withTeacher(function () {
        if (!validId(id)) return;
        return timeout(S.db.collection('quizzes').doc(id).delete());
      });
    }

    /* ------------------------------------------------------------ host (teacher) side of a session */
    function sref(db, code) { return db.collection('sessions').doc(code); }
    function codeOr404(code) {
      var c = U.normalizeCode(code);
      if (!c) throw notFound('No session with this code.');
      return c;
    }
    function hostInfo(c) { return S.host[c] || (S.host[c] = {}); }
    /* the session as the host knows it (live copy from hostWatch, else one read); checks ownership */
    function hostSession(c, uid) {
      var H = hostInfo(c);
      if (H.session && H.session.owner === uid) return Promise.resolve(H.session);
      return timeout(sref(S.db, c).get()).then(function (snap) {
        if (!snap.exists) throw notFound('No session with this code.');
        var s = sessionData(snap);
        if (s.owner !== uid) throw denied('This is not your session.');
        H.session = s;
        return s;
      });
    }
    function hostKey(c) {
      var H = hostInfo(c);
      if (H.key) return Promise.resolve(H.key);
      return timeout(sref(S.db, c).collection('private').doc('key').get()).then(function (snap) {
        H.key = snap.exists ? keyData(snap) : { correct: [], explain: [] };
        return H.key;
      });
    }
    function knownCount(c) { var H = S.host[c]; return H && H.players ? H.players.length : null; }
    function checkIndex(s, i) {
      if (!U.isInt(i) || i < 0 || !s.questions || i >= s.questions.length) throw bad('no question number ' + i);
    }

    function createSession(quiz, opts) {
      return withTeacher(function (u) {
        var clean = U.validateQuiz(quiz);
        var b = U.buildSession(clean, opts);
        var quizId = validId(quiz.id) ? quiz.id : null;
        var tries = 0;
        function attempt() {
          var code = U.randomCode();
          var ref = sref(S.db, code), keyRef = ref.collection('private').doc('key');
          var exp = expireTS();
          var taken = false;
          pendStart('c:' + code);
          /* transaction = the 6-digit code is used only if nobody has it */
          return timeout(S.db.runTransaction(function (tx) {
            taken = false;                                   /* Firestore may run this function again */
            return tx.get(ref).then(function (snap) {
              if (snap.exists) { taken = true; return; }
              tx.set(ref, {
                owner: u.uid, title: clean.title, lang: clean.lang, state: 'lobby', current: -1, questionStartedAt: null,
                starts: {}, timePerQ: b.timePerQ, locked: false, createdAt: ST(), expireAt: exp,
                questions: b.questions, reveal: null, playerCount: 0, kicked: [], quizId: quizId
              });
              tx.set(keyRef, { owner: u.uid, correct: b.correct, explain: b.explain, expireAt: exp });
            });
          }), 30000).then(function () {
            if (taken) {
              delete pend['c:' + code];
              if (++tries < 8) return attempt();
              throw cloudError('unknown', 'Could not find a free code. Please try again.');
            }
            pendAck('c:' + code);
            S.host[code] = { key: { correct: b.correct, explain: b.explain } };   /* players: unknown until hostWatch */
            return { code: code };
          });
        }
        return attempt();
      });
    }

    function hostWatch(code, cb, onError) {
      var c = U.normalizeCode(code);
      var stopped = false, unsubs = [], timer = null, lastErr = null, lastJson = null;
      var st = { s: undefined, p: undefined, a: undefined, k: undefined };
      var deferred = null, H = null;
      cb = typeof cb === 'function' ? cb : noop;
      /* errors of the players/answers/key reads wait until we know the session exists:
         for a missing (deleted) session they are expected and the app just gets session:null */
      function subFail(e) {
        if (stopped || st.s === null) return;
        if (st.s === undefined) { deferred = deferred || e; return; }
        fail(e);
      }
      function fail(e) {
        if (stopped) return;
        var err = mapError(e);
        if (lastErr === err.code) return;
        lastErr = err.code;
        lastJson = null;
        if (typeof onError === 'function') onError(err);
      }
      function emit() {
        if (stopped || timer) return;
        timer = setTimeout(function () {
          timer = null;
          if (stopped) return;
          var out;
          if (st.s === null) out = { code: c, session: null, players: [], answers: {}, key: null };
          else if (st.s === undefined || st.p === undefined || st.a === undefined || st.k === undefined) return;
          else out = { code: c, session: st.s, players: st.p, answers: U.answersFrom(st.a, st.s), key: st.k };
          var json = JSON.stringify(out);
          if (json === lastJson) return;
          lastJson = json;
          lastErr = null;
          cb(JSON.parse(json));
        }, 0);
      }
      if (!c) {
        setTimeout(function () { if (!stopped) cb({ code: String(code), session: null, players: [], answers: {}, key: null }); }, 0);
        return function () { stopped = true; };
      }
      ready().then(function () {
        teacherOrThrow();
        if (stopped) return;
        var ref = sref(S.db, c);
        H = hostInfo(c);
        H.watchers = (H.watchers || 0) + 1;
        unsubs.push(ref.onSnapshot(function (snap) {
          if (!snap.exists) { st.s = null; H.session = null; deferred = null; emit(); return; }
          var s = sessionData(snap);
          if (!snap.metadata.hasPendingWrites) {
            pendServer('c:' + c, s.createdAt);
            if (s.state === 'question') pendServer('q:' + c + ':' + s.current, s.questionStartedAt);
          }
          st.s = s; H.session = s;
          if (deferred) { var d = deferred; deferred = null; fail(d); }
          emit();
        }, fail));
        unsubs.push(ref.collection('players').onSnapshot(function (qs) {
          st.p = U.sortPlayers(qs.docs.map(playerData));
          H.players = st.p;
          emit();
        }, subFail));
        unsubs.push(ref.collection('answers').onSnapshot(function (qs) {
          st.a = qs.docs.map(answerData);
          emit();
        }, subFail));
        hostKey(c).then(function (k) { st.k = k; emit(); }, function (e) { st.k = null; subFail(e); });
      }).catch(fail);
      return function () {
        if (stopped) return;
        stopped = true;
        unsubs.forEach(function (u) { try { u(); } catch (e) { } });
        unsubs = [];
        /* last watcher gone: forget the live copies, so later calls read fresh data */
        if (H && --H.watchers <= 0) { delete H.session; delete H.players; }
      };
    }

    function startQuestion(code, i) {
      return withTeacher(function (u) {
        var c = codeOr404(code);
        return hostSession(c, u.uid).then(function (s) {
          checkIndex(s, i);
          if (s.state === 'ended') throw cloudError('session-ended', 'This session has ended.');
          var upd = { state: 'question', current: i, questionStartedAt: ST(), reveal: null };
          upd['starts.' + i] = ST();
          var n = knownCount(c);
          if (n !== null) upd.playerCount = n;
          var k = 'q:' + c + ':' + i;
          pendStart(k);
          return timeout(sref(S.db, c).update(upd)).then(function () { pendAck(k); });
        });
      });
    }

    function revealQuestion(code, i) {
      return withTeacher(function (u) {
        var c = codeOr404(code);
        return hostSession(c, u.uid).then(function (s) {
          checkIndex(s, i);
          if (s.state === 'ended') throw cloudError('session-ended', 'This session has ended.');
          return hostKey(c);
        }).then(function (key) {
          var corr = key.correct[i];
          var reveal = { index: i, correct: U.isInt(corr) ? corr : null, explain: (key.explain && key.explain[i]) || '' };
          var upd = { state: 'reveal', current: i, reveal: reveal };
          var n = knownCount(c);
          if (n !== null) upd.playerCount = n;
          return timeout(sref(S.db, c).update(upd)).then(function () { return copy(reveal); });
        });
      });
    }

    function writeScores(code, scores) {
      return withTeacher(function () {
        var c = codeOr404(code);
        if (!scores || typeof scores !== 'object') throw bad('scores must be an object');
        var ups = Object.keys(scores).map(function (pid) {
          if (!validPid(pid)) throw bad('bad player id');
          return [pid, U.scoreFields(scores[pid])];
        });
        if (!ups.length) return;
        var players = sref(S.db, c).collection('players');
        function commit(exists) {
          var ops = ups.filter(function (x) { return !exists || exists[x[0]]; })
            .map(function (x) { return function (b) { b.update(players.doc(x[0]), x[1]); }; });
          return commitOps(S.db, ops);
        }
        var H = S.host[c], known = null;
        if (H && H.players) { known = {}; H.players.forEach(function (p) { known[p.id] = true; }); }
        return commit(known).catch(function (e) {
          if (mapError(e).code !== 'not-found') throw e;
          /* someone left meanwhile (a batch fails as a whole): write only to players that still exist */
          return timeout(players.get()).then(function (qs) {
            var ex = {};
            qs.docs.forEach(function (d) { ex[d.id] = true; });
            return commit(ex);
          });
        });
      });
    }

    function lockSession(code, locked) {
      return withTeacher(function () {
        var c = codeOr404(code);
        var upd = { locked: !!locked };
        var n = knownCount(c);
        if (n !== null) upd.playerCount = n;
        return timeout(sref(S.db, c).update(upd));
      });
    }

    function kickPlayer(code, playerId) {
      return withTeacher(function () {
        var c = codeOr404(code);
        if (!validPid(playerId)) throw bad('bad player id');
        var ref = sref(S.db, c);
        var H = S.host[c];
        var cached = H && H.players ? H.players.filter(function (p) { return p.id === playerId; })[0] : null;
        var nameP = cached ? Promise.resolve(cached.name)
          : timeout(ref.collection('players').doc(playerId).get()).then(function (snap) { return snap.exists ? snap.data().name : null; });
        return nameP.then(function (name) {
          var b = S.db.batch();
          b.delete(ref.collection('players').doc(playerId));
          if (typeof name === 'string' && U.normalizeName(name) === name) b.delete(ref.collection('names').doc(U.nameKey(name)));
          var upd = { kicked: S.fb.firestore.FieldValue.arrayUnion(playerId) };
          if (H && H.players) upd.playerCount = H.players.filter(function (p) { return p.id !== playerId; }).length;
          b.update(ref, upd);
          return timeout(b.commit());
        });
      });
    }

    function endSession(code) {
      return withTeacher(function () {
        var c = codeOr404(code);
        var upd = { state: 'ended' };
        var n = knownCount(c);
        if (n !== null) upd.playerCount = n;
        return timeout(sref(S.db, c).update(upd));
      });
    }

    /* Retention on the free plan (LIVE_SPEC amendment): sessions older than 30 days are deleted by the app.
       Only judged with a known server clock, so a PC with a wrong date never deletes fresh sessions. */
    function isOld(s) {
      if (clock.best === null) return false;
      var t = now(), keep = U.LIMITS.keepDays * DAY;
      return (typeof s.expireAt === 'number' && s.expireAt < t) || (typeof s.createdAt === 'number' && s.createdAt < t - keep);
    }
    function deleteOld(codes) {
      return codes.reduce(function (p, c) { return p.then(function () { return deleteSessionDeep(S.db, c); }); }, Promise.resolve());
    }
    function purgeExpired() {
      return withTeacher(function (u) {
        S.purged[u.uid] = true;
        return timeout(S.db.collection('sessions').where('owner', '==', u.uid).get()).then(function (qs) {
          var old = qs.docs.filter(function (d) { return isOld(sessionData(d)); }).map(function (d) { return d.id; });
          return deleteOld(old).then(function () { return old.length; });
        });
      });
    }
    /* once per page, a few seconds after a teacher is known (listSessions() does the same job when called) */
    function autoPurge(uid) {
      if (S.purged[uid] || S.purgeTimer) return;
      S.purgeTimer = setTimeout(function () {
        S.purgeTimer = null;
        if (S.purged[uid] || !S.teacher || S.teacher.uid !== uid) return;
        if (clock.best === null) { autoPurge(uid); return; }      /* wait for the server clock */
        S.purged[uid] = true;
        purgeExpired().catch(function () { S.purged[uid] = false; });
      }, 4000);
    }

    function listSessions() {
      return withTeacher(function (u) {
        return timeout(S.db.collection('sessions').where('owner', '==', u.uid).get()).then(function (qs) {
          var out = [], old = [];
          qs.docs.forEach(function (d) {
            var s = sessionData(d);
            if (isOld(s)) { old.push(d.id); return; }
            out.push({ code: d.id, title: s.title, createdAt: s.createdAt, players: s.playerCount || 0, state: s.state });
          });
          if (old.length || clock.best !== null) S.purged[u.uid] = true;
          if (old.length) deleteOld(old).catch(function () { S.purged[u.uid] = false; });
          return out.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
        });
      });
    }

    function sessionResults(code) {
      return withTeacher(function (u) {
        var c = codeOr404(code);
        var ref = sref(S.db, c);
        return timeout(ref.get()).then(function (snap) {
          if (!snap.exists) throw notFound('No session with this code.');
          var s = sessionData(snap);
          if (s.owner !== u.uid) throw denied('This is not your session.');
          return Promise.all([
            timeout(ref.collection('players').get()),
            timeout(ref.collection('answers').get()),
            timeout(ref.collection('private').doc('key').get())
          ]).then(function (r) {
            return copy({
              code: c, session: s,
              players: U.sortPlayers(r[0].docs.map(playerData)),
              answers: U.answersFrom(r[1].docs.map(answerData), s),
              key: r[2].exists ? keyData(r[2]) : null
            });
          });
        });
      });
    }

    function deleteSession(code) {
      return withTeacher(function (u) {
        var c = U.normalizeCode(code);
        if (!c) return;
        return timeout(sref(S.db, c).get()).then(function (snap) {
          if (!snap.exists) return;
          if (snap.data().owner !== u.uid) throw denied('This is not your session.');
          return deleteSessionDeep(S.db, c);
        });
      });
    }

    /* ------------------------------------------------------------ student side */
    function studentReady() {
      if (S.stuP) return S.stuP;
      var p = ready().then(function () {
        var app = findApp(S.fb, STUDENT_APP) || S.fb.initializeApp(cfgCopy(), STUDENT_APP);
        var x = setupApp(app);
        S.sAuth = x.auth; S.sDb = x.db;
        return new Promise(function (resolve, reject) {
          var done = false, off = null;
          off = S.sAuth.onAuthStateChanged(function () {
            if (done) return;
            done = true;
            if (off) off();
            resolve();
          }, function (e) { if (!done) { done = true; reject(e); } });
        });
      });
      S.stuP = p.catch(function (e) { S.stuP = null; throw mapError(e); });
      return S.stuP;
    }
    /* the student's anonymous user (created on first use, then remembered on this device) */
    function student() {
      return studentReady().then(function () {
        var u = S.sAuth.currentUser;
        if (u) return u;
        return timeout(S.sAuth.signInAnonymously()).then(function (cred) { return cred.user; });
      }).catch(rethrow);
    }
    function stuInfo(c) { return S.stu[c] || (S.stu[c] = { session: null, my: {}, changed: null }); }

    function joinSession(code, nickname) {
      var name = U.normalizeName(nickname);
      if (!name) return Promise.reject(bad('Nickname must be 1 to 20 characters.'));
      var c = U.normalizeCode(code);
      if (!c) return Promise.reject(notFound('No quiz with this code.'));
      return student().then(function (user) {
        var uid = user.uid, db = S.sDb, ref = sref(db, c);
        var pref = ref.collection('players').doc(uid), nref = ref.collection('names').doc(U.nameKey(name));
        var X = stuInfo(c);
        /* the same checks as firestore.rules, in the same order as the demo mode */
        function check() {
          return Promise.all([timeout(ref.get()), timeout(pref.get()), timeout(nref.get())]).then(function (r) {
            if (!r[0].exists) throw notFound('No quiz with this code.');
            var s = sessionData(r[0]);
            X.session = s;
            if (r[1].exists) return { done: { playerId: uid, name: r[1].data().name, rejoined: true } };
            if ((s.kicked || []).indexOf(uid) >= 0) throw denied('The teacher removed you from this quiz.');
            if (s.state === 'ended') throw cloudError('session-ended', 'This quiz has ended.');
            if (s.locked) throw cloudError('session-locked', 'The teacher has locked this quiz.');
            if (r[2].exists && r[2].data().uid !== uid) throw cloudError('name-taken', 'Someone already uses this nickname.');
            return { mine: r[2].exists };
          });
        }
        return check().then(function (r) {
          if (r.done) return r.done;
          var exp = expireTS();
          var b = db.batch();
          if (!r.mine) b.set(nref, { uid: uid, expireAt: exp });
          b.set(pref, { name: name, score: 0, joinedAt: ST(), expireAt: exp });
          pendStart('j:' + c);
          return timeout(b.commit()).then(function () {
            pendAck('j:' + c);
            return { playerId: uid, name: name };
          }, function (e) {
            if (mapError(e).code !== 'permission-denied') throw e;
            /* something changed in between (locked, name grabbed…): find out what, for a clear message */
            return check().then(function (r2) {
              if (r2.done) return r2.done;
              throw denied('Could not join this quiz.');
            });
          });
        });
      }).catch(rethrow);
    }

    function playerWatch(code, cb, onError) {
      var c = U.normalizeCode(code);
      var stopped = false, unsubs = [], timer = null, lastErr = null, lastJson = null, uid = null;
      var st = { s: undefined, me: undefined, answersLoaded: false }, prev = null;
      cb = typeof cb === 'function' ? cb : noop;
      function fail(e) {
        if (stopped) return;
        var err = mapError(e);
        if (lastErr === err.code) return;
        lastErr = err.code;
        lastJson = null;
        if (typeof onError === 'function') onError(err);
      }
      function emit() {
        if (stopped || timer) return;
        timer = setTimeout(function () {
          timer = null;
          if (stopped) return;
          var X = stuInfo(c), out;
          if (st.s === null) out = { code: c, session: null, me: null, myAnswers: {}, kicked: false };
          else if (st.s === undefined || st.me === undefined || !st.answersLoaded) return;
          else out = {
            code: c, session: U.publicSession(c, st.s), me: st.me, myAnswers: X.my,
            kicked: !!(!st.me && (st.s.kicked || []).indexOf(uid) >= 0)
          };
          var json = JSON.stringify(out);
          if (json === lastJson) return;
          lastJson = json;
          lastErr = null;
          cb(JSON.parse(json));
        }, 0);
      }
      if (!c) {
        setTimeout(function () { if (!stopped) cb({ code: String(code), session: null, me: null, myAnswers: {}, kicked: false }); }, 0);
        return function () { stopped = true; };
      }
      student().then(function (user) {
        if (stopped) return;
        uid = user.uid;
        var ref = sref(S.sDb, c), X = stuInfo(c);
        X.changed = emit;
        /* my earlier answers: read once (not a listener), then kept up to date by submitAnswer() */
        timeout(ref.collection('answers').where('uid', '==', uid).get()).then(function (qs) {
          qs.docs.forEach(function (d) { var a = d.data(); if (U.isInt(a.i)) X.my[a.i] = a.choice; });
          st.answersLoaded = true;
          emit();
        }, function () { st.answersLoaded = true; emit(); });
        unsubs.push(ref.onSnapshot(function (snap) {
          if (!snap.exists) { st.s = null; X.session = null; emit(); return; }
          var s = sessionData(snap);
          if (!snap.metadata.fromCache && prev && s.state === 'question' && (prev.state !== 'question' || prev.current !== s.current)) arrival(s.questionStartedAt);
          prev = s; st.s = s; X.session = s;
          emit();
        }, fail));
        unsubs.push(ref.collection('players').doc(uid).onSnapshot(function (snap) {
          if (!snap.exists) { st.me = null; emit(); return; }
          var p = playerData(snap);
          if (!snap.metadata.hasPendingWrites) pendServer('j:' + c, p.joinedAt);
          st.me = p;
          emit();
        }, fail));
      }).catch(fail);
      return function () {
        stopped = true;
        unsubs.forEach(function (u) { try { u(); } catch (e) { } });
        unsubs = [];
        var X = S.stu[c];
        if (X && X.changed === emit) X.changed = null;
      };
    }

    function submitAnswer(code, i, choice) {
      if (!U.isInt(i) || i < 0 || !U.isInt(choice) || choice < 0) return Promise.reject(bad('bad question or choice'));
      var c = U.normalizeCode(code);
      if (!c) return Promise.reject(notFound('No quiz with this code.'));
      return student().then(function (user) {
        var uid = user.uid, ref = sref(S.sDb, c);
        var aref = ref.collection('answers').doc(uid + '_' + i), pref = ref.collection('players').doc(uid);
        var X = stuInfo(c);
        function remember(v) { X.my[i] = v; if (X.changed) X.changed(); }
        if (X.my[i] !== undefined) {
          if (X.my[i] === choice) return true;
          throw denied('You already answered this question.');
        }
        var s = X.session;
        if (s && s.questions && s.questions[i] && choice >= s.questions[i].options.length) throw bad('no such option');
        function diagnose() {
          return Promise.all([timeout(ref.get()), timeout(aref.get()), timeout(pref.get())]).then(function (r) {
            if (!r[0].exists) throw notFound('No quiz with this code.');
            if (r[1].exists) {
              var a = r[1].data();
              remember(a.choice);
              if (a.choice === choice) return true;         /* the first try did arrive: fine */
              throw denied('You already answered this question.');
            }
            var s2 = r[0].data();
            if (s2.state === 'ended') throw cloudError('session-ended', 'This quiz has ended.');
            if (!r[2].exists) throw denied('Join the quiz first.');
            if (s2.state !== 'question' || s2.current !== i) throw denied('This question is closed.');
            if (!s2.questions || !s2.questions[i] || choice >= s2.questions[i].options.length) throw bad('no such option');
            throw denied('Could not save the answer.');
          });
        }
        return timeout(aref.set({ uid: uid, i: i, choice: choice, at: ST(), expireAt: expireTS() })).then(function () {
          remember(choice);
          return true;
        }, function (e) {
          var m = mapError(e);
          if (m.code !== 'permission-denied') throw m;
          return diagnose();
        });
      }).catch(rethrow);
    }

    /* Leave = delete my player doc + my nickname. Once the session has ended (or is gone) it is also
       "Remove me": my answers are deleted too. During a quiz answers stay (rules: no taking an answer back). */
    function leaveSession(code) {
      var c = U.normalizeCode(code);
      if (!c) return Promise.resolve();
      return student().then(function (user) {
        var uid = user.uid, ref = sref(S.sDb, c), pref = ref.collection('players').doc(uid);
        return Promise.all([timeout(ref.get()), timeout(pref.get())]).then(function (r) {
          var over = !r[0].exists || r[0].data().state === 'ended';
          var name = r[1].exists ? r[1].data().name : null;
          var nref = typeof name === 'string' && U.normalizeName(name) === name ? ref.collection('names').doc(U.nameKey(name)) : null;
          return Promise.all([
            nref ? timeout(nref.get()) : null,
            over ? timeout(ref.collection('answers').where('uid', '==', uid).get()) : null
          ]).then(function (r2) {
            var ops = [];
            if (r[1].exists) ops.push(function (b) { b.delete(pref); });
            if (r2[0] && r2[0].exists && r2[0].data().uid === uid) ops.push(function (b) { b.delete(nref); });
            if (r2[1]) r2[1].docs.forEach(function (d) { ops.push(function (b) { b.delete(d.ref); }); });
            return commitOps(S.sDb, ops);
          });
        }).then(function () { delete S.stu[c]; });
      }).catch(rethrow);
    }

    var FB = {
      ready: ready, onTeacher: onTeacher, signInTeacher: signInTeacher, signOut: signOut,
      deleteTeacherAccount: deleteTeacherAccount, listQuizzes: listQuizzes, getQuiz: getQuiz, saveQuiz: saveQuiz,
      deleteQuiz: deleteQuiz, createSession: createSession, hostWatch: hostWatch, startQuestion: startQuestion,
      revealQuestion: revealQuestion, writeScores: writeScores, lockSession: lockSession, kickPlayer: kickPlayer,
      endSession: endSession, listSessions: listSessions, sessionResults: sessionResults, deleteSession: deleteSession,
      joinSession: joinSession, playerWatch: playerWatch, submitAnswer: submitAnswer, leaveSession: leaveSession,
      purgeExpired: purgeExpired
    };

    /* ------------------------------------------------------------ public object */
    var api = {
      mode: MODE,
      isDemo: MODE === 'mock',
      sdkVersion: SDK_VERSION,
      ERRORS: U.ERROR_CODES.slice(),
      LIMITS: U.LIMITS,
      /* pure helpers, same in both modes */
      normalizeName: U.normalizeName,
      normalizeCode: U.normalizeCode,
      points: U.points,
      computeScores: U.computeScores,
      rankPlayers: U.rankPlayers,
      demoUrl: U.demoUrl,
      /* estimated server time in ms: use it for countdowns (questionStartedAt is server time) */
      now: function () { return MODE === 'mock' ? Date.now() : now(); },
      /* an error from a finished sign-in redirect (e.g. not-configured when the domain is not authorised) */
      redirectError: function () { return MODE === 'mock' ? null : S.redirectError; }
    };
    API.forEach(function (name) {
      api[name] = MODE === 'mock'
        ? function () { return Mock[name].apply(Mock, arguments); }
        : FB[name];
    });
    if (MODE === 'firebase') api._mapError = mapError;      /* for tests */
    return api;
  }
})();
