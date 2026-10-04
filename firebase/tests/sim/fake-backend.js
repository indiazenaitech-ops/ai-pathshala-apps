/* In-memory stand-in for Cloud Firestore, used ONLY by firebase/tests/firebase_mode.sim.js.
 *
 * It runs in the top page of the simulation; every client frame talks to it through fake-sdk.js (the fake
 * Firebase compat SDK). It gives what shared/cloud.js needs to run in Firebase mode without a real project:
 *   - documents, batches, transactions (with retry on conflict), queries with == filters, listeners;
 *   - a JavaScript port of firebase/firestore.rules (every read and write is checked; the nickname character
 *     lists are taken from the real rules file by the driver, so they cannot drift);
 *   - billing counters the way Firestore bills: 1 read per document read (a query with no results = 1),
 *     listener: initial documents + 1 per added/changed document, 1 write / delete per document written,
 *     plus the documents that security rules look up (get/exists/getAfter/existsAfter, once per request).
 * It is a model, not the real thing: the real rules are tested by firebase/tests/rules.test.js (emulator). */
(function () {
  'use strict';
  var DAY = 86400000;

  function clone(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }
  function isTs(v) { return !!v && typeof v === 'object' && typeof v.__ts === 'number'; }
  function isObj(v) { return !!v && typeof v === 'object' && !Array.isArray(v) && !isTs(v); }
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function err(code, msg) { var e = new Error(msg || code); e.code = code; return e; }
  function parent(path) { return path.split('/').slice(0, -1).join('/'); }

  function Backend(opts) {
    opts = opts || {};
    this.docs = {};                 /* path → {data, v} */
    this.ver = 0;
    this.listeners = {};
    this.lid = 0;
    this.bill = {};                 /* client → counters */
    this.denials = [];              /* every refused request: {client, op, path} */
    this.lat = opts.latency || [1, 6];
    this.strictAccessLimit = !!opts.strictAccessLimit;   /* count rule look-ups per write (no caching) */
    var bad = opts.badNameClass || '', skel = opts.skelClass || '';
    if (!bad || !skel) throw new Error('fake backend: nickname character classes missing');
    this.BAD = new RegExp('[' + bad + ']', 'u');
    this.SKEL = new RegExp('[' + skel + ']', 'gu');
  }
  var P = Backend.prototype;

  P.counters = function (client) {
    return this.bill[client] || (this.bill[client] = { reads: 0, writes: 0, deletes: 0, ruleReads: 0, listenReads: 0, requests: 0, denied: 0, bytes: 0 });
  };
  P.snapshot = function () { return clone(this.bill); };
  /* downloaded bytes (egress): the UTF-8 size of each document sent to a client, as JSON (close to the real wire size) */
  var ENC = new TextEncoder();
  function bytesOf(v) { return v ? ENC.encode(JSON.stringify(v)).length : 0; }
  P.later = function (fn) {
    var d = this.lat[0] + Math.random() * (this.lat[1] - this.lat[0]);
    return new Promise(function (res, rej) { setTimeout(function () { try { res(fn()); } catch (e) { rej(e); } }, d); });
  };
  P.now = function () { return Date.now(); };
  P.data = function (path) { var d = this.docs[path]; return d ? d.data : null; };
  P.paths = function (prefix) { return Object.keys(this.docs).filter(function (p) { return p.indexOf(prefix) === 0; }).sort(); };

  /* ------------------------------------------------------------------ rules port (firestore.rules) */
  /* R: the context of one request: auth, time, and the document look-ups the rules make (billed). */
  P.ctx = function (auth, before, after) {
    var self = this, seen = {}, calls = 0;
    function touch(p) { calls++; seen[p] = true; }
    return {
      auth: auth, time: this.now(),
      get: function (p) { touch(p); var d = before(p); return d ? { data: d } : null; },
      exists: function (p) { touch(p); return !!before(p); },
      getAfter: function (p) { touch(p); var d = after(p); return d ? { data: d } : null; },
      existsAfter: function (p) { touch(p); return !!after(p); },
      reads: function () { return Object.keys(seen).length; },
      calls: function () { return calls; },
      self: self
    };
  };
  function signedIn(R) { return !!R.auth; }
  function isTeacher(R) { return signedIn(R) && R.auth.provider !== 'anonymous'; }
  function dataOf(r) { if (!r) throw err('rules-error', 'null value'); return r.data; }
  function sessionPath(code) { return 'sessions/' + code; }
  function sessionData(R, code) { return dataOf(R.get(sessionPath(code))); }
  function isSessionOwner(R, code) { return isTeacher(R) && sessionData(R, code).owner === R.auth.uid; }
  function validExpire(R, t) { return isTs(t) && t.__ts > R.time + 25 * DAY && t.__ts < R.time + 35 * DAY; }
  function isLive(R, s) { return s.state !== 'ended' && isTs(s.createdAt) && s.createdAt.__ts > R.time - DAY; }
  function size(s) { return Array.from(s).length; }
  function trimRules(s) { return s.replace(/^[\u0000- ]+|[\u0000- ]+$/g, ''); }
  P.nameKey = function (n) { return n.toLowerCase().replace(this.SKEL, ''); };
  P.validName = function (n) {
    if (typeof n !== 'string' || size(n) < 1 || size(n) > 20 || n !== trimRules(n)) return false;
    if (/[\u0000-\u001f\u007f\/]/.test(n) || this.BAD.test(n) || /  /.test(n)) return false;
    var k = this.nameKey(n);
    return size(k) >= 1 && !/^[.]+$/.test(k) && !/^__.*__$/.test(k);
  };
  function keysOnly(o, list) { return Object.keys(o).every(function (k) { return list.indexOf(k) >= 0; }); }
  function keysAll(o, list) { return list.every(function (k) { return k in o; }); }
  function changed(a, b) {
    var out = [], k;
    for (k in a) if (!(k in b) || !same(a[k], b[k])) out.push(k);
    for (k in b) if (!(k in a)) out.push(k);
    return out;
  }
  function isInt(v) { return typeof v === 'number' && Math.floor(v) === v; }
  function validTitle(t) { return typeof t === 'string' && size(t) >= 1 && size(t) <= 150; }
  function validQuiz(q) { return validTitle(q.title) && Array.isArray(q.questions) && q.questions.length >= 1 && q.questions.length <= 200 && typeof q.lang === 'string' && q.lang.length <= 20; }
  function validSession(s) {
    return keysOnly(s, ['owner', 'title', 'lang', 'state', 'current', 'questionStartedAt', 'starts', 'timePerQ', 'locked', 'createdAt', 'expireAt', 'questions', 'reveal', 'playerCount', 'kicked', 'quizId'])
      && keysAll(s, ['owner', 'title', 'state', 'current', 'timePerQ', 'locked', 'createdAt', 'expireAt', 'questions'])
      && validTitle(s.title) && ['lobby', 'question', 'reveal', 'ended'].indexOf(s.state) >= 0
      && Array.isArray(s.questions) && s.questions.length >= 1 && s.questions.length <= 200
      && isInt(s.current) && s.current >= -1 && s.current < s.questions.length
      && typeof s.locked === 'boolean' && isInt(s.timePerQ) && s.timePerQ >= 5 && s.timePerQ <= 600
      && Array.isArray(s.kicked === undefined ? [] : s.kicked);
  }
  function tsEq(a, R) { return isTs(a) && a.__ts === R.time; }

  /* single-document rules: op = get | create | update | delete; res = stored data (or null), inc = data after the write */
  P.allowDoc = function (R, op, path, res, inc) {
    var self = this, s = path.split('/'), a = R.auth, uid = a && a.uid;
    try {
      if (s.length === 2 && s[0] === 'teachers') {
        if (op === 'get') return isTeacher(R) && uid === s[1];
        if (op === 'create') return isTeacher(R) && uid === s[1] && keysOnly(inc, ['name', 'createdAt', 'plan']) && keysAll(inc, ['name', 'createdAt', 'plan'])
          && typeof inc.name === 'string' && size(inc.name) <= 100 && tsEq(inc.createdAt, R) && inc.plan === 'free';
        if (op === 'update') return isTeacher(R) && uid === s[1] && keysOnly(objOf(changed(inc, res)), ['name']) && typeof inc.name === 'string';
        if (op === 'delete') return isTeacher(R) && uid === s[1];
      }
      if (s.length === 2 && s[0] === 'quizzes') {
        if (op === 'get' || op === 'delete') return isTeacher(R) && (!res || res.owner === uid);
        var shape = inc && keysOnly(inc, ['owner', 'title', 'questions', 'lang', 'createdAt', 'updatedAt']) && validQuiz(inc);
        if (op === 'create') return isTeacher(R) && shape && keysAll(inc, ['owner', 'title', 'questions', 'lang', 'createdAt', 'updatedAt']) && inc.owner === uid && tsEq(inc.createdAt, R) && tsEq(inc.updatedAt, R);
        if (op === 'update') return isTeacher(R) && res.owner === uid && shape && inc.owner === res.owner && same(inc.createdAt, res.createdAt) && tsEq(inc.updatedAt, R);
      }
      if (s[0] !== 'sessions') return false;
      var code = s[1];
      if (s.length === 2) {
        if (op === 'get') return signedIn(R) && (!res || isLive(R, res) || res.owner === uid || R.exists('sessions/' + code + '/players/' + uid));
        if (op === 'create') return isTeacher(R) && /^[0-9]{6}$/.test(code) && validSession(inc) && inc.owner === uid && inc.state === 'lobby' && inc.current === -1
          && inc.locked === false && tsEq(inc.createdAt, R) && validExpire(R, inc.expireAt) && (inc.playerCount || 0) === 0 && (inc.kicked || []).length === 0 && (inc.reveal === undefined || inc.reveal === null);
        if (op === 'update') return isTeacher(R) && res.owner === uid && validSession(inc) && inc.owner === res.owner && same(inc.createdAt, res.createdAt)
          && same(inc.expireAt, res.expireAt) && same(inc.questions, res.questions);
        if (op === 'delete') return isTeacher(R) && res.owner === uid;
      }
      if (s.length !== 4) return false;
      var coll = s[2], id = s[3];
      if (coll === 'private') {
        if (op === 'get' || op === 'delete') return isTeacher(R) && (!res || res.owner === uid);
        if (op === 'create') return isTeacher(R) && id === 'key' && keysOnly(inc, ['owner', 'correct', 'explain', 'expireAt']) && keysAll(inc, ['owner', 'correct', 'explain', 'expireAt'])
          && inc.owner === uid && Array.isArray(inc.correct) && Array.isArray(inc.explain) && validExpire(R, inc.expireAt) && dataOf(R.getAfter(sessionPath(code))).owner === uid;
        return false;
      }
      if (coll === 'players') {
        if (op === 'get') return (signedIn(R) && uid === id) || isSessionOwner(R, code);
        if (op === 'create') {
          if (!(signedIn(R) && uid === id && keysOnly(inc, ['name', 'score', 'joinedAt', 'expireAt']) && keysAll(inc, ['name', 'score', 'joinedAt', 'expireAt'])
            && self.validName(inc.name) && inc.score === 0 && tsEq(inc.joinedAt, R) && validExpire(R, inc.expireAt))) return false;
          var sd = sessionData(R, code);
          return isLive(R, sd) && sd.locked === false && (sd.kicked || []).indexOf(uid) < 0
            && dataOf(R.getAfter('sessions/' + code + '/names/' + self.nameKey(inc.name))).uid === uid;
        }
        if (op === 'update') {
          if (!isSessionOwner(R, code)) return false;
          return keysOnly(objOf(changed(inc, res)), ['score', 'last', 'lastQ', 'rank']) && isInt(inc.score) && inc.score >= 0
            && (!('last' in inc) || (isInt(inc.last) && inc.last >= 0)) && (!('lastQ' in inc) || (isInt(inc.lastQ) && inc.lastQ >= 0))
            && (!('rank' in inc) || (isInt(inc.rank) && inc.rank >= 1));
        }
        if (op === 'delete') {
          var selfLeave = false;
          try { selfLeave = signedIn(R) && uid === id && !R.existsAfter('sessions/' + code + '/names/' + self.nameKey(res.name)); } catch (e) { selfLeave = false; }
          return selfLeave || isSessionOwner(R, code);
        }
      }
      if (coll === 'names') {
        if (op === 'get') return signedIn(R) && (!res || res.uid === uid);
        if (op === 'create') return signedIn(R) && keysOnly(inc, ['uid', 'expireAt']) && keysAll(inc, ['uid', 'expireAt']) && inc.uid === uid && validExpire(R, inc.expireAt)
          && self.nameKey(dataOf(R.getAfter('sessions/' + code + '/players/' + uid)).name) === id;
        if (op === 'delete') return isSessionOwner(R, code) || (signedIn(R) && !!res && res.uid === uid && !R.existsAfter('sessions/' + code + '/players/' + uid));
        return false;
      }
      if (coll === 'answers') {
        if (op === 'get') return (signedIn(R) && new RegExp('^' + uid + '_[0-9]+$').test(id)) || isSessionOwner(R, code);
        if (op === 'create') {
          if (!(signedIn(R) && keysOnly(inc, ['uid', 'i', 'choice', 'at', 'expireAt']) && keysAll(inc, ['uid', 'i', 'choice', 'at', 'expireAt']) && inc.uid === uid
            && isInt(inc.i) && inc.i >= 0 && id === uid + '_' + inc.i && isInt(inc.choice) && inc.choice >= 0 && tsEq(inc.at, R) && validExpire(R, inc.expireAt))) return false;
          var se = sessionData(R, code);
          return se.state === 'question' && se.current === inc.i && inc.choice < se.questions[inc.i].options.length && R.exists('sessions/' + code + '/players/' + uid);
        }
        if (op === 'delete') return isSessionOwner(R, code) || (signedIn(R) && !!res && res.uid === uid && (!R.exists(sessionPath(code)) || sessionData(R, code).state === 'ended'));
        return false;
      }
    } catch (e) { return false; }      /* an error in a rule = denied */
    return false;
  };
  function objOf(keys) { var o = {}; keys.forEach(function (k) { o[k] = 1; }); return o; }

  /* list rules: wheres = [[field, '==', value]] */
  P.allowList = function (R, coll, wheres) {
    var s = coll.split('/'), uid = R.auth && R.auth.uid;
    function hasEq(f, v) { return wheres.some(function (w) { return w[0] === f && w[1] === '==' && w[2] === v; }); }
    try {
      if (s.length === 1 && (s[0] === 'quizzes' || s[0] === 'sessions')) return isTeacher(R) && hasEq('owner', uid);
      if (s.length === 3 && s[0] === 'sessions') {
        if (s[2] === 'players' || s[2] === 'names') return isSessionOwner(R, s[1]);
        if (s[2] === 'answers') return (signedIn(R) && hasEq('uid', uid)) || isSessionOwner(R, s[1]);
      }
    } catch (e) { return false; }
    return false;
  };

  /* ------------------------------------------------------------------ values */
  function setPath(obj, dotted, val) {
    var parts = dotted.split('.'), o = obj;
    for (var i = 0; i < parts.length - 1; i++) { if (!isObj(o[parts[i]])) o[parts[i]] = {}; o = o[parts[i]]; }
    if (val && val.__op === 'delete') delete o[parts[parts.length - 1]];
    else o[parts[parts.length - 1]] = val;
  }
  /* resolve server timestamps / arrayUnion against the stored value */
  function resolve(v, old, time) {
    if (v && typeof v === 'object' && v.__op === 'serverTimestamp') return { __ts: time };
    if (v && typeof v === 'object' && v.__op === 'arrayUnion') {
      var arr = Array.isArray(old) ? old.slice() : [];
      v.values.forEach(function (x) { if (!arr.some(function (y) { return same(x, y); })) arr.push(x); });
      return arr;
    }
    if (Array.isArray(v)) return v.map(function (x) { return resolve(x, undefined, time); });
    if (isObj(v) && !v.__op) { var o = {}; for (var k in v) o[k] = resolve(v[k], old && isObj(old) ? old[k] : undefined, time); return o; }
    return v;
  }
  function getPath(obj, dotted) { return dotted.split('.').reduce(function (o, k) { return o && isObj(o) ? o[k] : undefined; }, obj); }

  /* ------------------------------------------------------------------ requests */
  P.deny = function (client, op, path) {
    this.counters(client).denied++;
    this.denials.push({ client: client, op: op, path: path });
    return err('permission-denied', 'Missing or insufficient permissions. (' + op + ' ' + path + ')');
  };
  P.get = function (client, auth, path) {
    var self = this;
    return this.later(function () {
      var c = self.counters(client), res = self.data(path);
      var R = self.ctx(auth, function (p) { return self.data(p); }, function (p) { return self.data(p); });
      c.requests++;
      var ok = self.allowDoc(R, 'get', path, res, null);
      c.ruleReads += R.reads();
      if (!ok) throw self.deny(client, 'get', path);
      c.reads += 1;
      var d = self.docs[path];
      c.bytes += bytesOf(d && d.data) + 100;
      return { exists: !!d, data: d ? clone(d.data) : null, v: d ? d.v : 0 };
    });
  };
  P.match = function (coll, wheres) {
    var self = this, depth = coll.split('/').length + 1;
    return this.paths(coll + '/').filter(function (p) {
      if (p.split('/').length !== depth) return false;
      var d = self.docs[p].data;
      return wheres.every(function (w) { return same(getPath(d, w[0]), w[2]); });
    });
  };
  P.query = function (client, auth, coll, wheres) {
    var self = this;
    return this.later(function () {
      var c = self.counters(client);
      var R = self.ctx(auth, function (p) { return self.data(p); }, function (p) { return self.data(p); });
      c.requests++;
      var ok = self.allowList(R, coll, wheres);
      c.ruleReads += R.reads();
      if (!ok) throw self.deny(client, 'list', coll);
      var hits = self.match(coll, wheres);
      c.reads += Math.max(1, hits.length);
      hits.forEach(function (p) { c.bytes += bytesOf(self.docs[p].data) + 100; });
      return hits.map(function (p) { return { id: p.split('/').pop(), data: clone(self.docs[p].data) }; });
    });
  };
  /* writes: [{type:'set'|'update'|'delete', path, data}], pre: {path: version} for transactions */
  P.commit = function (client, auth, writes, pre) {
    var self = this;
    return this.later(function () {
      var c = self.counters(client), time = self.now();
      c.requests++;
      if (pre) for (var pp in pre) { var cur = self.docs[pp]; if ((cur ? cur.v : 0) !== pre[pp]) throw err('aborted', 'transaction conflict'); }
      /* state after all writes */
      var after = {}, ops = [];
      function now(p) { return p in after ? after[p] : self.data(p); }
      writes.forEach(function (w) {
        var old = now(w.path);
        var inc;
        if (w.type === 'delete') inc = null;
        else if (w.type === 'set') inc = resolve(w.data, old, time);
        else {
          if (!old) throw err('not-found', 'No document to update: ' + w.path);
          inc = clone(old);
          for (var k in w.data) {
            var val = w.data[k];
            setPath(inc, k, val && val.__op === 'delete' ? val : resolve(val, getPath(old, k), time));
          }
        }
        ops.push({ w: w, before: old, inc: inc, op: w.type === 'delete' ? 'delete' : old ? 'update' : 'create' });
        after[w.path] = inc;
      });
      var R = self.ctx(auth, function (p) { return self.data(p); }, function (p) { return now(p); });
      R.time = time;
      var allowed = ops.every(function (o) {
        var orig = self.data(o.w.path);
        var op = o.op;
        /* rules see each write against the stored document (before the request) */
        if (o.w.type !== 'delete') op = orig ? 'update' : 'create';
        return self.allowDoc(R, op, o.w.path, orig, o.inc);
      });
      c.ruleReads += R.reads();
      if (allowed && R.reads() > 20) allowed = false;                              /* Firestore: 20 look-ups per batch */
      if (allowed && self.strictAccessLimit && R.calls() > 20) allowed = false;    /* pessimistic: repeated look-ups count too */
      if (!allowed) throw self.deny(client, 'write', writes.map(function (w) { return w.type + ' ' + w.path; }).join(', '));
      var touched = [];
      ops.forEach(function (o) {
        if (o.w.type === 'delete') { c.deletes++; if (self.docs[o.w.path]) { delete self.docs[o.w.path]; touched.push(o.w.path); } }
        else { c.writes++; self.docs[o.w.path] = { data: o.inc, v: ++self.ver }; touched.push(o.w.path); }
      });
      self.fire(touched);
      return true;
    });
  };

  /* ------------------------------------------------------------------ listeners */
  P.listenDoc = function (client, auth, path, onNext, onError) {
    var self = this, id = ++this.lid;
    var L = { id: id, kind: 'doc', client: client, auth: auth, path: path, onNext: onNext, onError: onError, last: null, dead: false };
    this.listeners[id] = L;
    this.later(function () { self.deliverDoc(L, true); });
    return id;
  };
  P.listenQuery = function (client, auth, coll, wheres, onNext, onError) {
    var self = this, id = ++this.lid;
    var L = { id: id, kind: 'query', client: client, auth: auth, coll: coll, wheres: wheres, onNext: onNext, onError: onError, seen: {}, seenBefore: {}, dead: false };
    this.listeners[id] = L;
    this.later(function () {
      if (L.dead) return;
      var c = self.counters(client);
      var R = self.ctx(auth, function (p) { return self.data(p); }, function (p) { return self.data(p); });
      var ok = self.allowList(R, coll, wheres);
      c.ruleReads += R.reads();
      if (!ok) { self.kill(L, self.deny(client, 'listen', coll)); return; }
      self.deliverQuery(L, true);
    });
    return id;
  };
  P.unlisten = function (id) { var L = this.listeners[id]; if (L) { L.dead = true; delete this.listeners[id]; } };
  P.kill = function (L, e) { L.dead = true; delete this.listeners[L.id]; try { L.onError(e); } catch (x) { } };
  P.deliverDoc = function (L, first) {
    if (L.dead) return;
    var self = this, c = this.counters(L.client), d = this.docs[L.path];
    var R = this.ctx(L.auth, function (p) { return self.data(p); }, function (p) { return self.data(p); });
    var ok = this.allowDoc(R, 'get', L.path, d ? d.data : null, null);    /* rules are checked again on every change */
    c.ruleReads += R.reads();
    if (!ok) { this.kill(L, this.deny(L.client, 'listen', L.path)); return; }
    var v = d ? d.v : 0;
    if (!first && v === L.last) return;
    L.last = v;
    if (d || first) { c.reads++; c.listenReads++; }
    c.bytes += bytesOf(d && d.data) + 100;
    try { L.onNext({ exists: !!d, data: d ? clone(d.data) : null }); } catch (e) { console.error(e); }
  };
  P.deliverQuery = function (L, first) {
    if (L.dead) return;
    var self = this, c = this.counters(L.client), hits = this.match(L.coll, L.wheres), n = 0, changedAny = first;
    var now = {};
    hits.forEach(function (p) { var v = self.docs[p].v; now[p] = v; if (L.seen[p] !== v) { n++; changedAny = true; } });
    Object.keys(L.seen).forEach(function (p) { if (!(p in now)) changedAny = true; });
    L.seen = now;
    if (!changedAny) return;
    var billed = first ? Math.max(1, hits.length) : n;
    c.reads += billed; c.listenReads += billed;
    hits.forEach(function (p) { if (first || L.seenBefore[p] !== now[p]) c.bytes += bytesOf(self.docs[p].data) + 100; });
    L.seenBefore = now;
    try { L.onNext(hits.map(function (p) { return { id: p.split('/').pop(), data: clone(self.docs[p].data) }; })); } catch (e) { console.error(e); }
  };
  P.fire = function (paths) {
    var self = this;
    Object.keys(this.listeners).forEach(function (id) {
      var L = self.listeners[id];
      var hit = L.kind === 'doc' ? paths.indexOf(L.path) >= 0 : paths.some(function (p) { return parent(p) === L.coll; });
      if (hit) self.later(function () { if (L.kind === 'doc') self.deliverDoc(L, false); else self.deliverQuery(L, false); });
    });
  };

  window.FakeFirestoreBackend = Backend;
})();
