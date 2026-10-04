/* Fake Firebase compat SDK (window.firebase), used ONLY by firebase/tests/firebase_mode.sim.js.
 *
 * The simulation serves this file in place of https://cdn.jsdelivr.net/npm/firebase@12.19.0/firebase-app-compat.js,
 * so shared/cloud.js runs its real Firebase-mode code. Every call goes to the in-memory backend in the top page
 * (window.top.__FakeFirestore, see fake-backend.js). Only what cloud.js uses is implemented.
 * One frame = one device: ?dev=<id> in the frame URL keeps its signed-in users apart from other frames
 * (stored in localStorage under that id, so a reload of the frame keeps the same anonymous student). */
(function () {
  'use strict';
  var B = window.top.__FakeFirestore;
  var DEV = (function () { try { return new URLSearchParams(location.search).get('dev') || 'dev'; } catch (e) { return 'dev'; } })();
  if (window.firebase && window.firebase.__fake) return;
  /* a closed or reloaded frame = a closed tab: its listeners stop */
  var LIDS = [];
  function track(id) { LIDS.push(id); return id; }
  window.addEventListener('pagehide', function () { LIDS.forEach(function (id) { try { B.unlisten(id); } catch (e) { } }); LIDS = []; });

  function rnd(n) { var s = '', abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; for (var i = 0; i < n; i++) s += abc.charAt(Math.floor(Math.random() * abc.length)); return s; }
  function fbErr(code, msg) { var e = new Error(msg || code); e.code = code; e.name = 'FirebaseError'; return e; }

  /* ------------------------------------------------------------------ values */
  function Timestamp(ms) { this.seconds = Math.floor(ms / 1000); this.nanoseconds = (ms % 1000) * 1e6; this._ms = ms; }
  Timestamp.fromMillis = function (ms) { return new Timestamp(Math.round(ms)); };
  Timestamp.now = function () { return new Timestamp(Date.now()); };
  Timestamp.prototype.toMillis = function () { return this._ms; };
  Timestamp.prototype.toDate = function () { return new Date(this._ms); };
  Timestamp.prototype.isEqual = function (o) { return o && o._ms === this._ms; };
  Timestamp.prototype.valueOf = function () { return String(this._ms); };
  function Sentinel(op, values) { this.__op = op; if (values) this.values = values; }
  var FieldValue = {
    serverTimestamp: function () { return new Sentinel('serverTimestamp'); },
    arrayUnion: function () { return new Sentinel('arrayUnion', Array.prototype.slice.call(arguments)); },
    delete: function () { return new Sentinel('delete'); }
  };
  function encode(v) {
    if (v === undefined) return undefined;
    if (v instanceof Timestamp) return { __ts: v._ms };
    if (v instanceof Sentinel) return v.__op === 'arrayUnion' ? { __op: v.__op, values: v.values.map(encode) } : { __op: v.__op };
    if (Array.isArray(v)) return v.map(encode);
    if (v && typeof v === 'object') { var o = {}; for (var k in v) { var x = encode(v[k]); if (x !== undefined) o[k] = x; } return o; }
    return v;
  }
  function decode(v) {
    if (Array.isArray(v)) return v.map(decode);
    if (v && typeof v === 'object') {
      if (typeof v.__ts === 'number') return new Timestamp(v.__ts);
      var o = {}; for (var k in v) o[k] = decode(v[k]); return o;
    }
    return v;
  }

  /* ------------------------------------------------------------------ auth */
  function User(rec, auth) {
    this.uid = rec.uid; this.isAnonymous = !!rec.anon; this.displayName = rec.name || null; this.email = rec.email || null;
    this.photoURL = null; this.metadata = { lastSignInTime: new Date(rec.at || Date.now()).toUTCString(), creationTime: new Date(rec.at || Date.now()).toUTCString() };
    this._auth = auth;
  }
  User.prototype.delete = function () { var a = this._auth; return Promise.resolve().then(function () { a._set(null); }); };
  User.prototype.reauthenticateWithPopup = function () { var self = this; return Promise.resolve({ user: self }); };
  User.prototype.reauthenticateWithRedirect = function () { return Promise.resolve(); };
  User.prototype.getIdToken = function () { return Promise.resolve('fake'); };

  function Auth(app) {
    this.app = app; this._ls = []; this._key = 'fakeauth.' + DEV + '.' + app.name;
    var rec = null;
    try { rec = JSON.parse(localStorage.getItem(this._key) || 'null'); } catch (e) { rec = null; }
    this.currentUser = rec ? new User(rec, this) : null;
  }
  Auth.prototype.useEmulator = function () { };
  Auth.prototype._set = function (rec) {
    try { if (rec) localStorage.setItem(this._key, JSON.stringify(rec)); else localStorage.removeItem(this._key); } catch (e) { }
    this.currentUser = rec ? new User(rec, this) : null;
    var u = this.currentUser;
    this._ls.slice().forEach(function (cb) { setTimeout(function () { cb(u); }, 0); });
    return u;
  };
  Auth.prototype.onAuthStateChanged = function (cb) {
    var self = this;
    this._ls.push(cb);
    setTimeout(function () { if (self._ls.indexOf(cb) >= 0) cb(self.currentUser); }, 0);
    return function () { var i = self._ls.indexOf(cb); if (i >= 0) self._ls.splice(i, 1); };
  };
  Auth.prototype.getRedirectResult = function () { return Promise.resolve({ user: null }); };
  Auth.prototype.signInWithPopup = function () {
    var self = this;
    return new Promise(function (res) { setTimeout(function () {
      res({ user: self._set({ uid: 'g-' + DEV, name: 'Teacher ' + DEV, email: DEV + '@example.com', at: Date.now() }) });
    }, 5); });
  };
  Auth.prototype.signInWithRedirect = function () { return this.signInWithPopup().then(function () { }); };
  Auth.prototype.signInAnonymously = function () {
    var self = this;
    return new Promise(function (res) { setTimeout(function () { res({ user: self._set({ uid: 'anon' + DEV.replace(/[^A-Za-z0-9]/g, '') + rnd(8), anon: true, at: Date.now() }) }); }, 5); });
  };
  Auth.prototype.signOut = function () { var self = this; return Promise.resolve().then(function () { self._set(null); }); };
  function GoogleAuthProvider() { this.params = {}; }
  GoogleAuthProvider.prototype.setCustomParameters = function (p) { this.params = p; };

  /* ------------------------------------------------------------------ firestore */
  function Firestore(app) { this.app = app; }
  Firestore.prototype.settings = function () { };
  Firestore.prototype.useEmulator = function () { };
  Firestore.prototype._who = function () {
    var u = this.app.auth().currentUser;
    return { client: DEV, auth: u ? { uid: u.uid, provider: u.isAnonymous ? 'anonymous' : 'google.com' } : null };
  };
  Firestore.prototype.collection = function (path) { return new CollRef(this, path); };
  Firestore.prototype.batch = function () { return new Batch(this); };
  Firestore.prototype.runTransaction = function (fn) {
    var db = this, tries = 0;
    function attempt() {
      var tx = new Transaction(db);
      return Promise.resolve(fn(tx)).then(function (v) {
        var w = db._who();
        return B.commit(w.client, w.auth, tx._writes, tx._pre).then(function () { return v; });
      }).catch(function (e) {
        if (e && e.code === 'aborted' && ++tries < 5) return attempt();
        throw e;
      });
    }
    return attempt();
  };

  function DocSnap(ref, exists, data) {
    this.ref = ref; this.id = ref.id; this.exists = exists; this._d = data;
    this.metadata = { hasPendingWrites: false, fromCache: false };
  }
  DocSnap.prototype.data = function () { return this.exists ? decode(this._d) : undefined; };
  DocSnap.prototype.get = function (f) { var d = this.data(); return d ? d[f] : undefined; };
  function QuerySnap(docs) { this.docs = docs; this.size = docs.length; this.empty = !docs.length; this.metadata = { hasPendingWrites: false, fromCache: false }; }
  QuerySnap.prototype.forEach = function (fn) { this.docs.forEach(fn); };

  function CollRef(db, path, wheres) { this._db = db; this.path = path; this.id = path.split('/').pop(); this._w = wheres || []; }
  CollRef.prototype.doc = function (id) { return new DocRef(this._db, this.path + '/' + (id === undefined ? rnd(20) : id)); };
  CollRef.prototype.where = function (f, op, v) {
    if (op !== '==') throw new Error('fake sdk: only == filters');
    return new CollRef(this._db, this.path, this._w.concat([[f, op, encode(v)]]));
  };
  CollRef.prototype._snap = function (rows) {
    var db = this._db, path = this.path;
    return new QuerySnap(rows.map(function (r) { return new DocSnap(new DocRef(db, path + '/' + r.id), true, r.data); }));
  };
  CollRef.prototype.get = function () {
    var self = this, w = this._db._who();
    return B.query(w.client, w.auth, this.path, this._w).then(function (rows) { return self._snap(rows); });
  };
  CollRef.prototype.onSnapshot = function (next, error) {
    var self = this, w = this._db._who();
    var id = track(B.listenQuery(w.client, w.auth, this.path, this._w, function (rows) { next(self._snap(rows)); }, function (e) { if (error) error(e); }));
    return function () { B.unlisten(id); };
  };

  function DocRef(db, path) {
    if (!path || path.split('/').length % 2 !== 0 || path.split('/').some(function (s) { return !s; })) throw fbErr('invalid-argument', 'Invalid document reference: ' + path);
    this._db = db; this.path = path; this.id = path.split('/').pop();
  }
  DocRef.prototype.collection = function (name) { return new CollRef(this._db, this.path + '/' + name); };
  DocRef.prototype.get = function () {
    var self = this, w = this._db._who();
    return B.get(w.client, w.auth, this.path).then(function (r) { return new DocSnap(self, r.exists, r.data); });
  };
  DocRef.prototype._commit = function (writes) { var w = this._db._who(); return B.commit(w.client, w.auth, writes).then(function () { }); };
  DocRef.prototype.set = function (data) { return this._commit([{ type: 'set', path: this.path, data: encode(data) }]); };
  DocRef.prototype.update = function (data) { return this._commit([{ type: 'update', path: this.path, data: encode(data) }]); };
  DocRef.prototype.delete = function () { return this._commit([{ type: 'delete', path: this.path }]); };
  DocRef.prototype.onSnapshot = function (next, error) {
    var self = this, w = this._db._who();
    var id = track(B.listenDoc(w.client, w.auth, this.path, function (r) { next(new DocSnap(self, r.exists, r.data)); }, function (e) { if (error) error(e); }));
    return function () { B.unlisten(id); };
  };

  function Batch(db) { this._db = db; this._writes = []; }
  Batch.prototype.set = function (ref, data) { this._writes.push({ type: 'set', path: ref.path, data: encode(data) }); return this; };
  Batch.prototype.update = function (ref, data) { this._writes.push({ type: 'update', path: ref.path, data: encode(data) }); return this; };
  Batch.prototype.delete = function (ref) { this._writes.push({ type: 'delete', path: ref.path }); return this; };
  Batch.prototype.commit = function () { var w = this._db._who(); return B.commit(w.client, w.auth, this._writes).then(function () { }); };

  function Transaction(db) { this._db = db; this._writes = []; this._pre = {}; }
  Transaction.prototype.get = function (ref) {
    var self = this, w = this._db._who();
    return B.get(w.client, w.auth, ref.path).then(function (r) { self._pre[ref.path] = r.v; return new DocSnap(ref, r.exists, r.data); });
  };
  Transaction.prototype.set = Batch.prototype.set;
  Transaction.prototype.update = Batch.prototype.update;
  Transaction.prototype.delete = Batch.prototype.delete;

  /* ------------------------------------------------------------------ apps */
  function App(cfg, name) { this.options = cfg; this.name = name; this._auth = null; this._db = null; }
  App.prototype.auth = function () { return this._auth || (this._auth = new Auth(this)); };
  App.prototype.firestore = function () { return this._db || (this._db = new Firestore(this)); };
  var firebase = {
    __fake: true,
    SDK_VERSION: '12.19.0-fake',
    apps: [],
    initializeApp: function (cfg, name) {
      name = name || '[DEFAULT]';
      if (firebase.apps.some(function (a) { return a.name === name; })) throw fbErr('app/duplicate-app', 'duplicate app ' + name);
      var app = new App(cfg, name);
      firebase.apps.push(app);
      return app;
    }
  };
  firebase.auth = function (app) { return (app || firebase.apps[0]).auth(); };
  firebase.auth.GoogleAuthProvider = GoogleAuthProvider;
  firebase.firestore = function (app) { return (app || firebase.apps[0]).firestore(); };
  firebase.firestore.FieldValue = FieldValue;
  firebase.firestore.Timestamp = Timestamp;
  window.firebase = firebase;
})();
