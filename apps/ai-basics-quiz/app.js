/* AI Basics Quiz: practice, timed test and projector quiz on the basics of AI
   (CBSE Artificial Intelligence 417). Everything runs on the device; results stay in EDU.store. */
(function () {
  'use strict';
  var SLUG = 'ai-basics-quiz';
  var store = EDU.store(SLUG);
  var $ = EDU.$, $$ = EDU.$$, el = EDU.el, t = EDU.t;

  var KEY = Array.isArray(window.APP_QUIZ_KEY) ? window.APP_QUIZ_KEY : [];
  var TOPICS = ['basics', 'domains', 'cycle', 'learning', 'eval', 'ethics', 'genai'];
  var ICON = { basics: '🤖', domains: '🧭', cycle: '🔄', learning: '🧠', eval: '📊', ethics: '⚖️', genai: '✨' };
  var L4 = ['A', 'B', 'C', 'D'];
  var MODES = ['practice', 'test', 'class'];
  var NUMS = [5, 10, 15, 20, 25];
  var TEST_SECS = [0, 30, 45, 60, 90, 120];
  var CLASS_SECS = [0, 15, 20, 30, 45, 60, 90];
  var byId = {};
  KEY.forEach(function (k, i) { byId[k.id] = { i: i, topic: k.topic, a: k.a }; });

  var DEF = { mode: 'practice', topics: TOPICS.slice(), num: 10, shufQ: true, shufO: true, testSecs: 60, classSecs: 30, teams: 3, names: ['', '', '', ''] };

  function isArr(v) { return Array.isArray(v); }
  function validAns(a) { return a === 0 || a === 1 || a === 2 || a === 3 ? a : null; }
  function validItems(items) {
    return isArr(items) && items.length > 0 && items.every(function (it) {
      return it && byId[it.id] && isArr(it.p) && it.p.length === 4 && [0, 1, 2, 3].every(function (x) { return it.p.indexOf(x) >= 0; });
    });
  }

  function loadSettings() {
    var s = store.get('settings', null);
    if (!s || typeof s !== 'object') s = {};
    var o = {};
    o.mode = MODES.indexOf(s.mode) >= 0 ? s.mode : DEF.mode;
    o.topics = isArr(s.topics) ? s.topics.filter(function (x) { return TOPICS.indexOf(x) >= 0; }) : DEF.topics.slice();
    if (!o.topics.length) o.topics = DEF.topics.slice();
    o.num = s.num === 'all' ? 'all' : (NUMS.indexOf(+s.num) >= 0 ? +s.num : DEF.num);
    o.shufQ = typeof s.shufQ === 'boolean' ? s.shufQ : DEF.shufQ;
    o.shufO = typeof s.shufO === 'boolean' ? s.shufO : DEF.shufO;
    o.testSecs = TEST_SECS.indexOf(+s.testSecs) >= 0 ? +s.testSecs : DEF.testSecs;
    o.classSecs = CLASS_SECS.indexOf(+s.classSecs) >= 0 ? +s.classSecs : DEF.classSecs;
    o.teams = [2, 3, 4].indexOf(+s.teams) >= 0 ? +s.teams : DEF.teams;
    o.names = [0, 1, 2, 3].map(function (i) { var n = isArr(s.names) ? s.names[i] : ''; return typeof n === 'string' ? n.slice(0, 30) : ''; });
    return o;
  }

  function loadSession() {
    var s = store.get('session', null);
    if (!s || typeof s !== 'object' || MODES.indexOf(s.mode) < 0 || !validItems(s.items)) return null;
    var n = s.items.length;
    s.ans = s.items.map(function (_, i) { return validAns(isArr(s.ans) ? s.ans[i] : null); });
    s.idx = EDU.clamp(Math.floor(+s.idx) || 0, 0, n - 1);
    s.t0 = +s.t0 || Date.now();
    s.ends = +s.ends || 0;
    s.secs = +s.secs || 0;
    if (s.mode === 'class') {
      s.rev = s.items.map(function (_, i) { return !!(isArr(s.rev) && s.rev[i]); });
      s.pick = s.items.map(function (_, i) { return validAns(isArr(s.pick) ? s.pick[i] : null); });
      s.teams = (isArr(s.teams) ? s.teams : []).slice(0, 4).map(function (tm) {
        return { name: tm && typeof tm.name === 'string' ? tm.name.slice(0, 30) : '', s: tm && isFinite(+tm.s) ? Math.round(+tm.s) : 0 };
      });
      if (s.teams.length < 2) return null;
      s.done = false;
    }
    return s;
  }

  function loadLast() {
    var r = store.get('last', null);
    if (!r || typeof r !== 'object' || ['practice', 'test'].indexOf(r.mode) < 0 || !validItems(r.items)) return null;
    r.ans = r.items.map(function (_, i) { return validAns(isArr(r.ans) ? r.ans[i] : null); });
    r.d = +r.d || Date.now();
    r.ms = +r.ms || 0;
    return r;
  }

  var S = loadSettings();
  var session = loadSession();
  var last = loadLast();
  var history = (function () {
    var h = store.get('history', []);
    return isArr(h) ? h.filter(function (x) { return x && MODES.indexOf(x.mode) >= 0 && isFinite(+x.score) && +x.total > 0; }).slice(0, 12) : [];
  })();
  var view = 'setup';
  var onlyWrong = false;
  var ticker = null;
  var cT = { left: 0, ends: 0, running: false, up: false };

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ------------------------------------------------------------------ content */
  function bank(lang) { var A = window.APP_CONTENT || {}; var c = A[lang]; return c && isArr(c.questions) ? c.questions : null; }
  function Q(id) {
    var k = byId[id];
    var c = (bank(EDU.lang) || [])[k.i] || (bank('en') || [])[k.i] || { q: '', o: ['', '', '', ''], e: '' };
    return { id: id, topic: k.topic, a: k.a, q: c.q, o: c.o, e: c.e };
  }
  function topicName(tp) { return ICON[tp] + ' ' + t('topic_' + tp); }
  function poolIds(topics) { return KEY.filter(function (k) { return topics.indexOf(k.topic) >= 0; }).map(function (k) { return k.id; }); }
  function countFor(avail) { return S.num === 'all' ? avail : Math.min(S.num, avail); }

  /* Pick n questions spread evenly over the chosen topics (round-robin). */
  function pickBalanced(ids, n, shuffle) {
    if (n >= ids.length) return shuffle ? EDU.shuffle(ids) : ids.slice();
    var groups = {}, order = [];
    (shuffle ? EDU.shuffle(ids) : ids).forEach(function (id) {
      var tp = byId[id].topic;
      if (!groups[tp]) { groups[tp] = []; order.push(tp); }
      groups[tp].push(id);
    });
    if (shuffle) order = EDU.shuffle(order); else order.sort(function (a, b) { return TOPICS.indexOf(a) - TOPICS.indexOf(b); });
    var out = [], r = 0, added = true;
    while (out.length < n && added) {
      added = false;
      for (var i = 0; i < order.length && out.length < n; i++) {
        var id = groups[order[i]][r];
        if (id) { out.push(id); added = true; }
      }
      r++;
    }
    return shuffle ? EDU.shuffle(out) : out.sort(function (a, b) { return byId[a].i - byId[b].i; });
  }
  function makeItems(ids) { return ids.map(function (id) { return { id: id, p: S.shufO ? EDU.shuffle([0, 1, 2, 3]) : [0, 1, 2, 3] }; }); }

  /* ------------------------------------------------------------------ helpers */
  function saveS() { store.set('settings', S); }
  function saveSession() { if (session && !session.done) store.set('session', session); }
  function fmtTime(ms) {
    var s = Math.max(0, Math.round(ms / 1000)), m = Math.floor(s / 60);
    s = s % 60;
    return EDU.fmt(m) + ':' + (s < 10 ? EDU.fmt(0) : '') + EDU.fmt(s);
  }
  function fmtDate(ms, short) {
    var d = new Date(ms);
    var o = short ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false } : { day: 'numeric', month: 'long', year: 'numeric' };
    try { return new Intl.DateTimeFormat(EDU.langInfo(EDU.lang).tag, Object.assign({ numberingSystem: 'latn' }, o)).format(d); }
    catch (e) { return d.toISOString().slice(0, 10); }
  }
  function joinList(arr) {
    try { if (Intl.ListFormat) return new Intl.ListFormat(EDU.langInfo(EDU.lang).tag, { type: 'conjunction' }).format(arr); } catch (e) { /* old browser */ }
    return arr.join(EDU.lang === 'ur' ? '، ' : ', ');
  }
  function fillSelect(sel, opts, value) {
    sel.innerHTML = '';
    opts.forEach(function (o) { sel.appendChild(el('option', { value: o[0], text: o[1] })); });
    sel.value = value;
    if (sel.value !== value && opts.length) sel.value = opts[opts.length - 1][0];
  }
  function speakQ(q, it) {
    var txt = q.q + ' ' + it.p.map(function (o, pos) { return L4[pos] + '. ' + q.o[o]; }).join('. ');
    EDU.speak(txt).then(function (ok) { if (!ok) EDU.toast(t('no_voice')); });
  }
  function letter(pos) { return el('span', { class: 'lt l' + pos, 'aria-hidden': 'true', text: L4[pos] }); }
  function beep() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      var ac = beep.ac || (beep.ac = new AC());
      var o = ac.createOscillator(), g = ac.createGain(), now = ac.currentTime;
      o.type = 'sine'; o.frequency.value = 660;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.25, now + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
      o.connect(g); g.connect(ac.destination); o.start(now); o.stop(now + 0.75);
    } catch (e) { /* no audio: the timer text still says "Time's up" */ }
  }
  function tally(r) {
    var c = 0, w = 0, sk = 0, bt = {};
    r.items.forEach(function (it, i) {
      var k = byId[it.id], b = bt[k.topic] || (bt[k.topic] = { c: 0, n: 0 }), a = r.ans[i];
      b.n++;
      if (a === null) sk++; else if (a === k.a) { c++; b.c++; } else w++;
    });
    var n = r.items.length;
    return { c: c, w: w, sk: sk, n: n, pct: n ? Math.round(100 * c / n) : 0, bt: bt };
  }

  /* ------------------------------------------------------------------ views */
  function show(v) {
    view = v;
    $('#setup').hidden = v !== 'setup';
    $('#quiz').hidden = v !== 'quiz';
    $('#results').hidden = v !== 'results';
    $('#classView').hidden = v !== 'class';
    EDU.stopSpeaking();
    render();
    startTicker();
    var target = v === 'setup' ? null : $(v === 'class' ? '#classView' : '#' + v);
    if (target && target.scrollIntoView) target.scrollIntoView({ block: 'start' }); else window.scrollTo(0, 0);
  }
  function render() {
    if (view === 'setup') renderSetup();
    else if (view === 'quiz') renderQuiz();
    else if (view === 'results') renderResults();
    else if (view === 'class') renderClass();
  }

  /* ---------- setup ---------- */
  function renderSetup() {
    $$('#modes .mode').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === S.mode)); });
    $$('[data-for]').forEach(function (e) { e.hidden = e.getAttribute('data-for') !== S.mode; });

    var box = $('#topicChips');
    box.innerHTML = '';
    var allOn = S.topics.length === TOPICS.length;
    box.appendChild(el('button', { type: 'button', class: 'chip', id: 'topic-all', 'aria-pressed': String(allOn), onclick: function () {
      S.topics = allOn ? [] : TOPICS.slice(); saveS(); renderSetup();
    } }, el('span', { text: t('all_topics') }), el('span', { class: 'n num', text: EDU.fmt(KEY.length) })));
    TOPICS.forEach(function (tp) {
      var n = KEY.filter(function (k) { return k.topic === tp; }).length, on = S.topics.indexOf(tp) >= 0;
      box.appendChild(el('button', { type: 'button', class: 'chip', id: 'topic-' + tp, 'aria-pressed': String(on), onclick: function () {
        if (on) S.topics = S.topics.filter(function (x) { return x !== tp; });
        else S.topics = TOPICS.filter(function (x) { return x === tp || S.topics.indexOf(x) >= 0; });
        saveS(); renderSetup();
      } }, el('span', { 'aria-hidden': 'true', text: ICON[tp] }), el('span', { text: t('topic_' + tp) }), el('span', { class: 'n num', text: EDU.fmt(n) })));
    });

    var avail = poolIds(S.topics).length;
    $('#availMsg').textContent = t('n_available', { n: EDU.fmt(avail) });
    $('#topicErr').hidden = avail > 0;
    $('#startBtn').disabled = avail === 0;
    $('#paperBtn').disabled = avail === 0;

    var numOpts = NUMS.filter(function (n) { return n < avail; }).map(function (n) { return [String(n), EDU.fmt(n)]; });
    numOpts.push(['all', t('all_n', { n: EDU.fmt(avail) })]);
    fillSelect($('#numSel'), numOpts, S.num === 'all' || S.num >= avail ? 'all' : String(S.num));
    fillSelect($('#testSecs'), TEST_SECS.map(function (s) { return [String(s), s ? t('time_per_q', { s: EDU.fmt(s) }) : t('no_limit')]; }), String(S.testSecs));
    fillSelect($('#classSecs'), CLASS_SECS.map(function (s) { return [String(s), s ? t('sec_n', { s: EDU.fmt(s) }) : t('timer_off')]; }), String(S.classSecs));
    fillSelect($('#teamCount'), [2, 3, 4].map(function (n) { return [String(n), EDU.fmt(n)]; }), String(S.teams));
    var nq = countFor(avail);
    $('#testTotal').textContent = S.testSecs && avail ? t('total_time', { t: fmtTime(nq * S.testSecs * 1000) }) : '';

    var ti = $('#teamInputs');
    ti.innerHTML = '';
    for (var i = 0; i < S.teams; i++) {
      (function (i) {
        var inp = el('input', { type: 'text', id: 'teamName' + i, maxlength: '30', autocomplete: 'off', placeholder: t('team_n', { n: L4[i] }) });
        inp.value = S.names[i] || '';
        inp.addEventListener('input', function () { S.names[i] = inp.value.slice(0, 30); saveS(); });
        ti.appendChild(el('div', { class: 'field' }, el('label', { for: 'teamName' + i, text: t('team_name_label', { n: L4[i] }) }), inp));
      })(i);
    }
    $('#shufQ').checked = S.shufQ;
    $('#shufO').checked = S.shufO;

    $('#resumeBox').hidden = !session;
    if (session) $('#resumeMsg').textContent = t('resume_title', { mode: t('mode_' + session.mode), n: EDU.fmt(session.idx + 1), total: EDU.fmt(session.items.length) });
    renderHistory();
  }

  function renderHistory() {
    var ol = $('#historyList');
    ol.innerHTML = '';
    history.forEach(function (h) {
      var pct = Math.round(+h.pct) || 0;
      ol.appendChild(el('li', null,
        el('span', { class: 'hist-date', text: fmtDate(h.d, true) }),
        el('span', { class: 'badge', text: t('mode_' + h.mode) }),
        el('span', { class: 'hist-score num', text: EDU.fmt(+h.score) + ' / ' + EDU.fmt(+h.total) }),
        el('span', { class: 'badge num ' + (pct >= 75 ? 'success' : pct >= 50 ? 'primary' : 'danger'), text: EDU.fmt(pct) + '%' })));
    });
    $('#historyEmpty').hidden = history.length > 0;
    var best = history.reduce(function (m, h) { return Math.max(m, Math.round(+h.pct) || 0); }, -1);
    $('#bestBadge').hidden = best < 0;
    $('#bestBadge').textContent = best >= 0 ? t('best_score', { pct: EDU.fmt(best) }) : '';
    $('#lastBtn').hidden = !last;
  }

  /* ---------- start / finish ---------- */
  function startSession(mode, ids, retry) {
    var items = makeItems(ids), now = Date.now();
    session = { mode: mode, items: items, idx: 0, ans: items.map(function () { return null; }), t0: now, ends: 0, secs: 0, retry: !!retry };
    if (mode === 'test' && S.testSecs) { session.secs = S.testSecs; session.ends = now + items.length * S.testSecs * 1000; }
    if (mode === 'class') {
      session.secs = S.classSecs;
      session.rev = items.map(function () { return false; });
      session.pick = items.map(function () { return null; });
      session.teams = [];
      for (var i = 0; i < S.teams; i++) session.teams.push({ name: (S.names[i] || '').trim(), s: 0 });
      session.done = false;
      resetClassTimer();
    }
    saveSession();
    show(mode === 'class' ? 'class' : 'quiz');
    if (mode !== 'class') focusQuestion();
  }
  function startFromSetup() {
    var ids = poolIds(S.topics);
    if (!ids.length) { $('#topicErr').hidden = false; return; }
    startSession(S.mode, pickBalanced(ids, countFor(ids.length), S.shufQ));
  }
  function finish(timeUp) {
    var s = session, now = Date.now(), end = s.ends ? Math.min(now, s.ends) : now;
    var r = { mode: s.mode, d: now, ms: Math.max(0, end - s.t0), items: s.items, ans: s.ans.slice(), timeUp: !!timeUp, retry: !!s.retry };
    var T = tally(r);
    last = r;
    store.set('last', r);
    if (!r.retry) {
      history.unshift({ d: now, mode: r.mode, score: T.c, total: T.n, pct: T.pct });
      history = history.slice(0, 12);
      store.set('history', history);
    }
    session = null;
    store.remove('session');
    onlyWrong = false;
    $('#onlyWrong').checked = false;
    show('results');
  }
  function quit() {
    if (!confirm(t('confirm_quit'))) return;
    session = null;
    store.remove('session');
    show('setup');
  }

  /* ---------- practice / test ---------- */
  function focusQuestion() { var h = $(view === 'class' ? '#cText' : '#qText'); if (h && h.focus) try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }

  function renderQuiz() {
    var s = session;
    if (!s) return show('setup');
    var test = s.mode === 'test', n = s.items.length, it = s.items[s.idx], q = Q(it.id), mine = s.ans[s.idx];
    var answered = s.ans.filter(function (a) { return a !== null; }).length;
    var correct = s.items.reduce(function (c, x, i) { return c + (s.ans[i] !== null && s.ans[i] === byId[x.id].a ? 1 : 0); }, 0);

    $('#qProgress').textContent = t('q_of', { n: EDU.fmt(s.idx + 1), total: EDU.fmt(n) });
    $('#qTopic').textContent = topicName(q.topic);
    $('#qScore').hidden = test;
    $('#qScore').textContent = t('score_n', { n: EDU.fmt(correct), total: EDU.fmt(answered) });
    $('#qBar').style.width = (100 * answered / n) + '%';
    $('#qTimer').hidden = !(test && s.ends);
    updateTestTimer();

    var nav = $('#qNav');
    nav.hidden = !test;
    nav.innerHTML = '';
    if (test) s.items.forEach(function (_, i) {
      nav.appendChild(el('button', { type: 'button', class: s.ans[i] !== null ? 'done' : '', 'aria-current': String(i === s.idx),
        'aria-label': t('jump_to', { n: EDU.fmt(i + 1) }), text: EDU.fmt(i + 1), onclick: function () { go(i); } }));
    });

    var h = $('#qText');
    h.textContent = q.q;
    h.setAttribute('data-qid', q.id);
    h.setAttribute('data-topic', q.topic);

    var box = $('#qOpts');
    box.innerHTML = '';
    var locked = !test && mine !== null;
    it.p.forEach(function (orig, pos) {
      var cls = 'opt', mark = '';
      if (test && mine === orig) cls += ' picked';
      if (locked) {
        if (orig === q.a) { cls += ' is-right'; mark = '✓'; }
        else if (orig === mine) { cls += ' is-wrong'; mark = '✗'; }
        else cls += ' dim';
      }
      box.appendChild(el('button', { type: 'button', class: cls, id: 'qOpt' + pos, 'data-opt': String(orig), 'data-pos': String(pos),
        'aria-pressed': test ? String(mine === orig) : null, disabled: locked, onclick: function () { choose(pos); } },
        letter(pos), el('span', { class: 'ot', text: q.o[orig] }), mark ? el('span', { class: 'mk', 'aria-hidden': 'true', text: mark }) : null));
    });

    var fb = $('#qFeedback');
    fb.innerHTML = '';
    if (locked) {
      var ok = mine === q.a, rp = it.p.indexOf(q.a);
      fb.appendChild(el('div', { class: 'callout fb ' + (ok ? 'success' : 'danger') },
        el('p', { class: 'fb-head' }, el('span', { 'aria-hidden': 'true', text: ok ? '✅ ' : '❌ ' }), el('b', { text: ok ? t('correct') : t('wrong') }),
          ok ? null : el('span', { text: ' ' + t('correct_was', { a: L4[rp] + '. ' + q.o[q.a] }) })),
        el('p', { class: 'fb-e' }, el('b', { text: t('explanation') + ': ' }), q.e)));
    }

    $('#qPrev').hidden = !test;
    $('#qPrev').disabled = s.idx === 0;
    $('#qSubmit').hidden = !test;
    var nextBtn = $('#qNext');
    if (test) {
      nextBtn.hidden = s.idx >= n - 1;
      $('#qNextTxt').textContent = t('next');
      nextBtn.disabled = false;
    } else {
      nextBtn.hidden = !locked;
      $('#qNextTxt').textContent = s.idx >= n - 1 ? t('see_result') : t('next_q');
    }
    $('#qSubmit').className = 'btn ' + (test && s.idx >= n - 1 ? 'btn-primary' : 'btn-accent');
  }

  function choose(pos) {
    var s = session;
    if (!s || view !== 'quiz') return;
    var it = s.items[s.idx], orig = it.p[pos];
    if (orig === undefined) return;
    if (s.mode === 'practice') {
      if (s.ans[s.idx] !== null) return;
      s.ans[s.idx] = orig;
      saveSession();
      renderQuiz();
      var nb = $('#qNext');
      if (nb && !nb.hidden) nb.focus();
    } else {
      s.ans[s.idx] = s.ans[s.idx] === orig ? null : orig;
      saveSession();
      renderQuiz();
    }
  }
  function go(i) {
    var s = session;
    if (!s || i < 0 || i >= s.items.length) return;
    s.idx = i;
    EDU.stopSpeaking();
    saveSession();
    renderQuiz();
    focusQuestion();
  }
  function next() {
    var s = session;
    if (!s) return;
    if (s.mode === 'practice') {
      if (s.ans[s.idx] === null) return;
      if (s.idx >= s.items.length - 1) return finish(false);
    } else if (s.idx >= s.items.length - 1) return;
    go(s.idx + 1);
  }
  function submitTest() {
    var s = session;
    if (!s) return;
    var left = s.ans.filter(function (a) { return a === null; }).length;
    if (left && !confirm(t('confirm_submit', { n: EDU.fmt(left) }))) return;
    finish(false);
  }
  function updateTestTimer() {
    var s = session, box = $('#qTimer');
    if (!s || s.mode !== 'test' || !s.ends) return;
    var left = s.ends - Date.now();
    box.textContent = '⏱ ' + fmtTime(Math.max(0, left));
    box.setAttribute('aria-label', t('time_left') + ' ' + fmtTime(Math.max(0, left)));
    box.classList.toggle('low', left <= 60000);
  }

  /* ---------- results ---------- */
  function renderResults() {
    var r = last;
    if (!r) return show('setup');
    var T = tally(r);
    var ring = $('#rRing');
    ring.style.setProperty('--p', T.pct);
    ring.style.setProperty('--ring', T.pct >= 75 ? 'var(--success)' : T.pct >= 50 ? 'var(--primary)' : 'var(--danger)');
    ring.setAttribute('aria-label', EDU.fmt(T.c) + ' / ' + EDU.fmt(T.n) + ' (' + EDU.fmt(T.pct) + '%)');
    $('#rScore').textContent = EDU.fmt(T.c) + '/' + EDU.fmt(T.n);
    $('#rPct').textContent = EDU.fmt(T.pct) + '%';
    $('#rMode').textContent = t('mode_' + r.mode);
    $('#rTimeUp').hidden = !r.timeUp;
    $('#rMsg').textContent = t(T.pct >= 90 ? 'msg_90' : T.pct >= 75 ? 'msg_75' : T.pct >= 50 ? 'msg_50' : 'msg_0');
    var st = $('#rStats');
    st.innerHTML = '';
    st.appendChild(el('span', { class: 'stat ok', id: 'rCorrect' }, '✓ ', t('n_correct', { n: EDU.fmt(T.c) })));
    st.appendChild(el('span', { class: 'stat bad', id: 'rWrong' }, '✗ ', t('n_wrong', { n: EDU.fmt(T.w) })));
    if (T.sk) st.appendChild(el('span', { class: 'stat skip', id: 'rSkipped' }, '– ', t('n_skipped', { n: EDU.fmt(T.sk) })));
    st.appendChild(el('span', { class: 'stat' }, '⏱ ', t('time_taken', { t: fmtTime(r.ms) })));

    var tb = $('#rTopics');
    tb.innerHTML = '';
    var weak = [];
    TOPICS.forEach(function (tp) {
      var b = T.bt[tp];
      if (!b) return;
      var p = Math.round(100 * b.c / b.n);
      if (p < 60) weak.push(t('topic_' + tp));
      tb.appendChild(el('div', { class: 'tbar', 'data-topic': tp },
        el('span', { text: topicName(tp) }),
        el('span', { class: 'tval num', text: EDU.fmt(b.c) + ' / ' + EDU.fmt(b.n) }),
        el('div', { class: 'progress', 'aria-hidden': 'true' }, el('span', { style: { width: Math.max(p, 2) + '%', background: p >= 75 ? 'var(--success)' : p >= 50 ? 'var(--primary)' : 'var(--danger)' } }))));
    });
    $('#rRevise').hidden = !weak.length;
    $('#rRevise').textContent = weak.length ? '📚 ' + t('revise_tip', { list: joinList(weak) }) : '';
    $('#rMistakes').disabled = T.w + T.sk === 0;
    $('#certCard').hidden = !!r.retry;
    renderCert(T);
    renderReview();
  }

  function renderReview() {
    var r = last, ol = $('#rReview'), shown = 0;
    ol.innerHTML = '';
    r.items.forEach(function (it, i) {
      var q = Q(it.id), a = r.ans[i], ok = a === q.a, skip = a === null;
      if (onlyWrong && ok) return;
      shown++;
      var ul = el('ul', { class: 'rv-opts' });
      it.p.forEach(function (orig, pos) {
        var isAns = orig === q.a, isMine = orig === a && !isAns;
        ul.appendChild(el('li', { class: isAns ? 'ans' : isMine ? 'mine' : '' },
          el('span', { class: 'lt-mini', text: L4[pos] }), el('span', { text: q.o[orig] }),
          isAns ? el('span', { 'aria-hidden': 'true', text: ' ✓' }) : isMine ? el('span', { 'aria-hidden': 'true', text: ' ✗' }) : null,
          isMine ? el('span', { class: 'badge danger', style: { marginInlineStart: '6px' }, text: t('your_answer') }) : null));
      });
      ol.appendChild(el('li', { class: 'rv ' + (ok ? 'good' : skip ? 'skip' : 'bad'), 'data-qid': q.id },
        el('div', { class: 'row rv-head' },
          el('span', { class: 'rv-n', text: EDU.fmt(i + 1) }),
          el('span', { class: 'badge', text: topicName(q.topic) }),
          el('span', { class: 'badge ' + (ok ? 'success' : skip ? '' : 'danger'), text: ok ? t('correct') : skip ? t('not_answered') : t('wrong') })),
        el('p', { class: 'rv-q', text: q.q }),
        ul,
        el('p', { class: 'rv-e' }, el('b', { text: t('explanation') + ': ' }), q.e)));
    });
    $('#rNoMistakes').hidden = !(onlyWrong && shown === 0);
  }

  function certNode(T) {
    var r = last, name = $('#certName').value.trim(), school = $('#certSchool').value.trim();
    var lvl = T.pct >= 90 ? ['🏆', 'badge_star'] : T.pct >= 75 ? ['🌟', 'badge_explorer'] : T.pct >= 50 ? ['📘', 'badge_learner'] : ['🌱', 'badge_starter'];
    var tps = TOPICS.filter(function (tp) { return T.bt[tp]; });
    var list = tps.length === TOPICS.length ? t('all_topics') : joinList(tps.map(function (tp) { return t('topic_' + tp); }));
    return el('div', { class: 'cert', id: 'certificate' }, el('div', { class: 'cert-in' },
      el('div', { class: 'cert-brand' }, el('img', { src: EDU.ROOT + 'shared/img/icon-96.png', alt: '' }), el('span', { text: t('brand') })),
      el('div', { class: 'cert-badge', 'aria-hidden': 'true', text: lvl[0] }),
      el('h3', { class: 'cert-title', text: t('cert_title') }),
      el('p', { class: 'cert-small', text: t('cert_certify') }),
      el('p', { class: 'cert-name no-i18n', id: 'certNameOut', text: name || ' ' }),
      school ? el('p', { class: 'cert-school no-i18n', text: school }) : null,
      el('p', { class: 'cert-body', id: 'certBody', text: t('cert_body', { score: EDU.fmt(T.c), total: EDU.fmt(T.n), pct: EDU.fmt(T.pct) }) }),
      el('p', { class: 'cert-level', text: lvl[0] + ' ' + t(lvl[1]) }),
      el('p', { class: 'cert-topics', text: t('cert_topics', { list: list }) }),
      el('div', { class: 'cert-foot' },
        el('span', { text: t('cert_date', { d: fmtDate(r.d) }) }),
        el('span', { class: 'cert-sign', text: t('cert_sign') }))));
  }
  function renderCert(T) {
    var box = $('#certBox');
    box.innerHTML = '';
    box.appendChild(certNode(T || tally(last)));
  }

  /* ---------- printing ---------- */
  function printNode(node, cls) {
    var pa = $('#printArea');
    pa.innerHTML = '';
    pa.appendChild(node);
    document.body.classList.add('printing', cls);
    var done = function () { document.body.classList.remove('printing', cls); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    try { window.print(); } catch (e) { done(); }
  }
  function buildPaper() {
    var ids = poolIds(S.topics);
    if (!ids.length) return null;
    var items = makeItems(pickBalanced(ids, countFor(ids.length), S.shufQ));
    var n = items.length;
    var tps = S.topics.length === TOPICS.length ? t('all_topics') : joinList(TOPICS.filter(function (tp) { return S.topics.indexOf(tp) >= 0; }).map(function (tp) { return t('topic_' + tp); }));
    var qs = el('ol', { class: 'p-qs' });
    var key = el('ol', { class: 'p-ans' });
    items.forEach(function (it) {
      var q = Q(it.id);
      qs.appendChild(el('li', null, el('div', { class: 'p-qt', text: q.q }),
        el('ul', { class: 'p-opts' }, it.p.map(function (orig, pos) { return el('li', { text: '(' + L4[pos] + ') ' + q.o[orig] }); }))));
      var rp = it.p.indexOf(q.a);
      key.appendChild(el('li', null, el('b', { text: '(' + L4[rp] + ') ' + q.o[q.a] }), el('div', { text: q.e })));
    });
    return el('div', { class: 'paper', id: 'paper' },
      el('h1', { text: t('paper_title') }),
      el('p', { class: 'p-sub', text: tps + ' · ' + t('n_questions', { n: EDU.fmt(n) }) }),
      el('div', { class: 'p-lines' }, el('span', { text: t('paper_name') }), el('span', { text: t('paper_class') }), el('span', { text: t('paper_date') }), el('span', { text: t('paper_marks', { total: EDU.fmt(n) }) })),
      el('p', { class: 'p-instr', text: t('paper_instr') }),
      qs,
      el('p', { class: 'p-foot', text: t('made_with') }),
      el('div', { class: 'p-key' }, el('h2', { text: t('answer_key') }), key));
  }

  /* ---------- projector quiz ---------- */
  function teamName(i) { var tm = session && session.teams[i]; return (tm && tm.name) || t('team_n', { n: L4[i] }); }
  function resetClassTimer() {
    var secs = session ? session.secs : 0;
    cT = { left: secs * 1000, ends: 0, running: false, up: false };
    if (secs && session && !session.rev[session.idx]) { cT.running = true; cT.ends = Date.now() + cT.left; }
  }
  function renderClassTimer() {
    var s = session, box = $('#cTimerBox');
    if (!s || s.done) return;
    box.hidden = !s.secs || s.rev[s.idx];
    if (box.hidden) return;
    var left = cT.running ? Math.max(0, cT.ends - Date.now()) : cT.left;
    var tm = $('#cTimer');
    tm.textContent = cT.up ? t('times_up') : EDU.fmt(Math.ceil(left / 1000));
    tm.classList.toggle('low', !cT.up && left <= 5000);
    tm.classList.toggle('up', cT.up);
    var b = $('#cTimerBtn');
    b.textContent = cT.up ? '↻' : cT.running ? '⏸' : '▶';
    var lbl = cT.up ? t('restart_timer') : cT.running ? t('pause') : t('resume');
    b.setAttribute('aria-label', lbl);
    b.title = lbl;
  }
  function toggleClassTimer() {
    if (cT.up) { resetClassTimer(); }
    else if (cT.running) { cT.left = Math.max(0, cT.ends - Date.now()); cT.running = false; }
    else { cT.running = true; cT.ends = Date.now() + cT.left; }
    renderClassTimer();
  }

  function renderClass() {
    var s = session;
    if (!s) return show('setup');
    $('#cPlay').hidden = !!s.done;
    $('#cEnd').hidden = !s.done;
    $('#teams').hidden = !!s.done;
    $('#cFoot').hidden = !!s.done;
    if (s.done) return renderClassEnd();
    renderTeams();
    var it = s.items[s.idx], q = Q(it.id), rev = s.rev[s.idx], pick = s.pick[s.idx], n = s.items.length;
    $('#cProgress').textContent = t('q_of', { n: EDU.fmt(s.idx + 1), total: EDU.fmt(n) });
    $('#cTopic').textContent = topicName(q.topic);
    $('#cBar').style.width = (100 * (s.idx + (rev ? 1 : 0)) / n) + '%';
    var h = $('#cText');
    h.textContent = q.q;
    h.setAttribute('data-qid', q.id);
    var box = $('#cOpts');
    box.innerHTML = '';
    it.p.forEach(function (orig, pos) {
      var cls = 'opt', mark = '';
      if (pick === orig) cls += ' picked';
      if (rev) {
        if (orig === q.a) { cls += ' is-right'; mark = '✓'; }
        else if (orig === pick) { cls += ' is-wrong'; mark = '✗'; }
        else cls += ' dim';
      }
      box.appendChild(el('button', { type: 'button', class: cls, id: 'cOpt' + pos, 'data-opt': String(orig), 'data-pos': String(pos),
        'aria-pressed': String(pick === orig), disabled: rev, onclick: function () { classPick(pos); } },
        letter(pos), el('span', { class: 'ot', text: q.o[orig] }), mark ? el('span', { class: 'mk', 'aria-hidden': 'true', text: mark }) : null));
    });
    var ex = $('#cExplain');
    ex.hidden = !rev;
    ex.innerHTML = '';
    if (rev) {
      var rp = it.p.indexOf(q.a);
      ex.appendChild(el('p', null, el('b', { text: '✅ ' + t('answer_is', { a: L4[rp] + '. ' + q.o[q.a] }) })));
      ex.appendChild(el('p', { class: 'mb0', text: q.e }));
    }
    $('#cReveal').disabled = rev;
    $('#cPrev').disabled = s.idx === 0;
    $('#cNextTxt').textContent = s.idx >= n - 1 ? t('class_finish') : t('next');
    renderClassTimer();
  }
  function renderTeams() {
    var s = session, box = $('#teams');
    box.innerHTML = '';
    var max = Math.max.apply(null, s.teams.map(function (x) { return x.s; }));
    s.teams.forEach(function (tm, i) {
      box.appendChild(el('div', { class: 'team t' + i + (max > 0 && tm.s === max ? ' lead' : '') },
        el('div', { class: 'team-name' + (tm.name ? ' no-i18n' : ''), text: teamName(i) }),
        el('div', { class: 'team-score', id: 'teamScore' + i, text: EDU.fmt(tm.s) }),
        s.done ? null : el('div', { class: 'row' },
          el('button', { type: 'button', class: 'btn', id: 'teamMinus' + i, 'aria-label': t('minus_point', { team: teamName(i) }), text: '−1', onclick: function () { addPoint(i, -1); } }),
          el('button', { type: 'button', class: 'btn btn-primary', id: 'teamPlus' + i, 'aria-label': t('plus_point', { team: teamName(i) }), text: '+1', onclick: function () { addPoint(i, 1); } }))));
    });
  }
  function addPoint(i, d) {
    var s = session;
    if (!s || !s.teams[i]) return;
    s.teams[i].s = EDU.clamp(s.teams[i].s + d, -999, 999);
    saveSession();
    renderTeams();
  }
  function renderClassEnd() {
    var s = session;
    var ranked = s.teams.map(function (tm, i) { return { i: i, s: tm.s }; }).sort(function (a, b) { return b.s - a.s || a.i - b.i; });
    var top = ranked[0].s, winners = ranked.filter(function (x) { return x.s === top; });
    $('#cWinner').textContent = winners.length > 1 ? t('tie') : '🎉 ' + t('winner', { team: teamName(winners[0].i) });
    var ol = $('#cRank');
    ol.innerHTML = '';
    ranked.forEach(function (x) {
      var place = 1 + ranked.filter(function (y) { return y.s > x.s; }).length;
      var medal = ['🥇', '🥈', '🥉'][place - 1] || '🎖️';
      ol.appendChild(el('li', { class: place === 1 ? 'top' : '', 'data-team': String(x.i) },
        el('span', { class: x.i < s.teams.length && s.teams[x.i].name ? 'no-i18n' : '', text: medal + ' ' + teamName(x.i) }),
        el('b', { class: 'num', text: EDU.fmt(x.s) })));
    });
  }
  function classPick(pos) {
    var s = session;
    if (!s || view !== 'class' || s.done || s.rev[s.idx]) return;
    var orig = s.items[s.idx].p[pos];
    if (orig === undefined) return;
    s.pick[s.idx] = s.pick[s.idx] === orig ? null : orig;
    saveSession();
    renderClass();
  }
  function reveal() {
    var s = session;
    if (!s || s.done || s.rev[s.idx]) return;
    s.rev[s.idx] = true;
    cT.running = false;
    saveSession();
    renderClass();
  }
  function classGo(i) {
    var s = session;
    if (!s || i < 0 || i >= s.items.length) return;
    s.idx = i;
    EDU.stopSpeaking();
    resetClassTimer();
    saveSession();
    renderClass();
  }
  function classNext() {
    var s = session;
    if (!s || s.done) return;
    if (s.idx >= s.items.length - 1) {
      s.done = true;
      cT.running = false;
      store.remove('session');
      renderClass();
      return;
    }
    classGo(s.idx + 1);
  }

  /* ---------- timers ---------- */
  function tick() {
    var s = session;
    if (!s) return;
    if (view === 'quiz' && s.mode === 'test' && s.ends) {
      updateTestTimer();
      if (Date.now() >= s.ends) { EDU.toast(t('times_up')); finish(true); }
    } else if (view === 'class' && !s.done && cT.running) {
      if (Date.now() >= cT.ends) { cT.running = false; cT.left = 0; cT.up = true; beep(); }
      renderClassTimer();
    }
  }
  function startTicker() {
    if (ticker) clearInterval(ticker);
    ticker = null;
    if (view === 'quiz' || view === 'class') ticker = setInterval(tick, 250);
  }

  /* ------------------------------------------------------------------ events */
  $$('#modes .mode').forEach(function (b) {
    b.addEventListener('click', function () { S.mode = b.getAttribute('data-mode'); saveS(); renderSetup(); });
  });
  $('#numSel').addEventListener('change', function () { var v = this.value; S.num = v === 'all' ? 'all' : +v; saveS(); renderSetup(); });
  $('#testSecs').addEventListener('change', function () { S.testSecs = +this.value; saveS(); renderSetup(); });
  $('#classSecs').addEventListener('change', function () { S.classSecs = +this.value; saveS(); });
  $('#teamCount').addEventListener('change', function () { S.teams = +this.value; saveS(); renderSetup(); });
  $('#shufQ').addEventListener('change', function () { S.shufQ = this.checked; saveS(); });
  $('#shufO').addEventListener('change', function () { S.shufO = this.checked; saveS(); });
  $('#startBtn').addEventListener('click', startFromSetup);
  $('#paperBtn').addEventListener('click', function () { var p = buildPaper(); if (p) printNode(p, 'print-paper'); });
  $('#resumeBtn').addEventListener('click', function () {
    if (!session) return;
    if (session.mode === 'class') resetClassTimer();
    show(session.mode === 'class' ? 'class' : 'quiz');
    if (session && session.mode === 'test' && session.ends && Date.now() >= session.ends) { EDU.toast(t('times_up')); finish(true); }
  });
  $('#discardBtn').addEventListener('click', function () { session = null; store.remove('session'); renderSetup(); });
  $('#lastBtn').addEventListener('click', function () { if (last) show('results'); });
  $('#resetBtn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    ['settings', 'session', 'history', 'last', 'name', 'school'].forEach(function (k) { store.remove(k); });
    S = loadSettings(); session = null; last = null; history = [];
    $('#certName').value = ''; $('#certSchool').value = '';
    renderSetup();
    EDU.toast(t('reset_done'));
  });

  $('#qNext').addEventListener('click', next);
  $('#qPrev').addEventListener('click', function () { if (session) go(session.idx - 1); });
  $('#qSubmit').addEventListener('click', submitTest);
  $('#qQuit').addEventListener('click', quit);
  $('#qSpeak').addEventListener('click', function () { if (session) speakQ(Q(session.items[session.idx].id), session.items[session.idx]); });

  $('#rMistakes').addEventListener('click', function () {
    if (!last) return;
    var ids = last.items.filter(function (it, i) { return last.ans[i] !== byId[it.id].a; }).map(function (it) { return it.id; });
    if (!ids.length) return;
    startSession('practice', S.shufQ ? EDU.shuffle(ids) : ids, true);
  });
  $('#rAgain').addEventListener('click', function () { if (last) { S.mode = last.mode; saveS(); } startFromSetup(); });
  $('#rHome').addEventListener('click', function () { show('setup'); });
  $('#onlyWrong').addEventListener('change', function () { onlyWrong = this.checked; renderReview(); });
  $('#certName').value = store.get('name', '') || '';
  $('#certSchool').value = store.get('school', '') || '';
  $('#certName').addEventListener('input', function () { store.set('name', this.value.slice(0, 60)); if (last) renderCert(); });
  $('#certSchool').addEventListener('input', function () { store.set('school', this.value.slice(0, 80)); if (last) renderCert(); });
  $('#certPrint').addEventListener('click', function () { if (last) printNode(certNode(tally(last)), 'print-cert'); });

  $('#cReveal').addEventListener('click', reveal);
  $('#cNext').addEventListener('click', classNext);
  $('#cPrev').addEventListener('click', function () { if (session) classGo(session.idx - 1); });
  $('#cTimerBtn').addEventListener('click', toggleClassTimer);
  $('#cFull').addEventListener('click', function () { EDU.fullscreen($('#stage')); });
  $('#cSpeak').addEventListener('click', function () { if (session && !session.done) speakQ(Q(session.items[session.idx].id), session.items[session.idx]); });
  $('#cExit').addEventListener('click', function () {
    if (session && !session.done && !confirm(t('confirm_quit'))) return;
    session = null; store.remove('session');
    if (document.fullscreenElement) EDU.fullscreen();
    show('setup');
  });
  $('#cHome').addEventListener('click', function () { session = null; if (document.fullscreenElement) EDU.fullscreen(); show('setup'); });
  $('#cAgain').addEventListener('click', function () { S.mode = 'class'; saveS(); startFromSetup(); });

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || !session) return;
    var tg = e.target;
    if (tg && (/^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName) || tg.isContentEditable)) return;
    if (document.querySelector('.edu-modal-back')) return;
    var k = (e.key || '').toLowerCase(), onBtn = tg && (tg.tagName === 'BUTTON' || tg.tagName === 'A' || tg.tagName === 'SUMMARY');
    var pos = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 }[k];
    var rtl = document.documentElement.dir === 'rtl';
    var fwd = rtl ? 'arrowleft' : 'arrowright', back = rtl ? 'arrowright' : 'arrowleft';
    if (view === 'quiz') {
      if (pos !== undefined) { e.preventDefault(); choose(pos); }
      else if ((k === 'enter' && !onBtn) || k === fwd) { e.preventDefault(); next(); }
      else if (k === back && session.mode === 'test') { e.preventDefault(); go(session.idx - 1); }
    } else if (view === 'class' && !session.done) {
      if (pos !== undefined) { e.preventDefault(); classPick(pos); }
      else if (k === 'r' || (k === ' ' && !onBtn)) { e.preventDefault(); reveal(); }
      else if (k === fwd || k === 'n') { e.preventDefault(); classNext(); }
      else if (k === back || k === 'p') { e.preventDefault(); if (session.idx > 0) classGo(session.idx - 1); }
      else if (k === 't') { e.preventDefault(); toggleClassTimer(); }
      else if (k === 'f') { e.preventDefault(); EDU.fullscreen($('#stage')); }
    }
  });

  EDU.onLang(render);
  show('setup');
})();
