/* Fake News Detective: UI. Message facts in data.js (FND_MSGS), words in content.js (APP_CONTENT), the
   message-checker engine in engine.js (FND). Everything runs on the device; only game progress, class-round
   progress and scores are saved (EDU.store). Pasted messages are never stored. */
(function () {
  'use strict';
  var SLUG = 'fake-news-detective';
  var store = EDU.store(SLUG);
  var $ = EDU.$, $$ = EDU.$$, el = EDU.el, t = EDU.t;
  var MSGS = window.FND_MSGS, WS = window.FND_WS, FND = window.FND;
  var BY_ID = {};
  MSGS.forEach(function (m) { BY_ID[m.id] = m; });

  EDU.init({ slug: SLUG, title: 'app_title' });

  var ANSWERS = ['rel', 'fake', 'verify'];
  var FLAG_ICON = { urgent: '⏰', fwd: '↪️', nosource: '❓', caps: '🔊', domain: '🔗', oldphoto: '🖼️', round: '🔢', miracle: '💊', gift: '🎁', deepfake: '🤖', satire: '🎭', nowho: '👤', emo: '😱', money: '💸', true100: '✅' };
  var CF_ICON = { urgent: '⏰', fwd: '↪️', caps: '🔊', exclaim: '❗', shortlink: '🔗', lookalike: '🪤', money: '💸', otp: '🔑', true100: '✅', miracle: '💊', gift: '🎁', emo: '😱', nosource: '❓' };
  var STEP_ICON = { reverse: '🖼️', official: '🏛️', date: '📅', url: '🔗', bank: '☎️' };
  var KIND_ICON = { wa: '💬', sms: '📩', post: '📱', head: '📰', video: '▶️', shot: '📺', notice: '📄' };
  var LVL_ICON = { low: '🙂', medium: '⚠️', high: '🚩' };

  /* ---------------- state (cleaned on load) ---------------- */
  function isLevel(v) { return v === 'jr' || v === 'sr'; }
  function idsFor(level) { return MSGS.filter(function (m) { return level === 'all' || m.lvl === level; }).map(function (m) { return m.id; }); }
  function cleanOrder(order, level) {
    var want = idsFor(level);
    if (!Array.isArray(order) || order.length !== want.length) return null;
    var seen = {};
    for (var i = 0; i < order.length; i++) { if (!BY_ID[order[i]] || seen[order[i]] || want.indexOf(order[i]) < 0) return null; seen[order[i]] = 1; }
    return order.slice();
  }
  function cleanGame(g) {
    if (!g || typeof g !== 'object' || !isLevel(g.level)) return null;
    var order = cleanOrder(g.order, g.level);
    if (!order) return null;
    var answers = {};
    if (g.answers && typeof g.answers === 'object') Object.keys(g.answers).forEach(function (k) { if (BY_ID[k] && ANSWERS.indexOf(g.answers[k]) >= 0) answers[k] = g.answers[k]; });
    var i = EDU.clamp(parseInt(g.i, 10) || 0, 0, order.length);
    var score = 0, streak = 0, best = 0;
    order.slice(0, i).forEach(function (id) {
      if (answers[id] === BY_ID[id].ans) { score++; streak++; best = Math.max(best, streak); } else streak = 0;
    });
    return { level: g.level, order: order, i: i, answers: answers, score: score, streak: streak, bestStreak: best, revealed: !!g.revealed && i < order.length && answers[order[i]] !== undefined, done: i >= order.length };
  }
  function cleanStats(s) {
    s = s && typeof s === 'object' ? s : {};
    function n(v, max) { v = parseInt(v, 10); return v >= 0 && v <= max ? v : 0; }
    var best = s.best && typeof s.best === 'object' ? s.best : {};
    return { best: { jr: n(best.jr, 12), sr: n(best.sr, 12) }, streak: n(s.streak, 24), played: n(s.played, 100000) };
  }
  function cleanClass(c) {
    if (!c || typeof c !== 'object' || ['jr', 'sr', 'all'].indexOf(c.set) < 0) return null;
    var order = cleanOrder(c.order, c.set);
    if (!order) return null;
    var i = EDU.clamp(parseInt(c.i, 10) || 0, 0, order.length);
    var votes = {};
    ANSWERS.forEach(function (a) { var v = parseInt(c.votes && c.votes[a], 10); votes[a] = v >= 0 && v <= 999 ? v : 0; });
    return { set: c.set, order: order, i: i, votes: votes, revealed: !!c.revealed && i < order.length, score: EDU.clamp(parseInt(c.score, 10) || 0, 0, i), done: i >= order.length };
  }
  var state = {
    tab: store.get('tab', 'game'),
    level: store.get('level', 'jr'),
    wsLevel: store.get('wsLevel', 'jr'),
    classSet: store.get('classSet', 'jr'),
    game: cleanGame(store.get('game', null)),
    stats: cleanStats(store.get('stats', null)),
    cls: cleanClass(store.get('class', null)),
    chkText: ''
  };
  if (['game', 'check', 'kit', 'class'].indexOf(state.tab) < 0) state.tab = 'game';
  if (!isLevel(state.level)) state.level = 'jr';
  if (!isLevel(state.wsLevel)) state.wsLevel = 'jr';
  if (['jr', 'sr', 'all'].indexOf(state.classSet) < 0) state.classSet = 'jr';
  function saveGame() { store.set('game', state.game); }
  function saveStats() { store.set('stats', state.stats); }
  function saveClass() { store.set('class', state.cls); }

  /* ---------------- content helpers ---------------- */
  function msgText(id) {
    var C = window.APP_CONTENT || {};
    var L = C[EDU.lang] && C[EDU.lang].msgs && C[EDU.lang].msgs[id];
    return L || (C.en && C.en.msgs[id]) || { who: '', meta: '', text: '', cap: '', why: '', how: '' };
  }
  function wordLists() {
    var C = window.APP_CONTENT || {};
    var en = C.en && C.en.words, cur = C[EDU.lang] && C[EDU.lang].words;
    return EDU.lang === 'en' || !cur ? en : FND.mergeLists(en, cur);
  }
  function ltr(txt, cls) { return el('span', { class: 'ltr ' + (cls || ''), text: txt }); }
  function initial(who) { var s = String(who || '').trim(); return s ? Array.from(s)[0].toUpperCase() : '?'; }

  /* text with web addresses turned into "links" that only explain they never open */
  function linkify(text) {
    var out = [], last = 0;
    FND.findLinks(text).forEach(function (l) {
      if (l.s > last) out.push(text.slice(last, l.s));
      out.push(el('button', { type: 'button', class: 'lnk no-i18n', 'aria-describedby': 'link-note', onclick: function () { EDU.toast(t('link_game')); } }, l.txt));
      last = l.e;
    });
    if (last < text.length) out.push(text.slice(last));
    return out;
  }
  function fakePlay() { EDU.toast(t('link_game')); }

  /* one message card; big = projector size */
  function renderMsg(id, big) {
    var D = BY_ID[id], C = msgText(id), k = D.kind;
    var card = el('article', { class: 'msg k-' + k + (big ? ' big' : ''), dataset: { id: id, kind: k } });
    card.appendChild(el('div', { class: 'msg-kind' }, el('span', { class: 'ki', 'aria-hidden': 'true', text: KIND_ICON[k] }), el('span', { text: t('kind_' + k) })));
    var body;
    if (k === 'wa' || k === 'sms') {
      var who = C.who || t('unknown_number');
      card.appendChild(el('div', { class: 'chat-head' },
        el('span', { class: 'av no-i18n', 'aria-hidden': 'true', text: C.who ? initial(C.who) : '👤' }),
        el('div', { class: 'chat-who' }, el('div', { class: 'chat-name no-i18n', text: who }),
          el('div', { class: 'chat-sub no-i18n' }, C.meta || (D.from ? ltr(D.from) : '')))));
      var bubble = el('div', { class: 'bubble' });
      if (D.fwd) bubble.appendChild(el('div', { class: 'fwd-label' }, el('span', { class: 'arr', 'aria-hidden': 'true', text: '↪↪' }), el('span', { text: t('fwd_many') })));
      bubble.appendChild(el('p', { class: 'msg-text no-i18n mb0', dir: 'auto' }, linkify(C.text)));
      if (D.time) bubble.appendChild(el('div', { class: 'bubble-time' }, ltr(D.time)));
      card.appendChild(el('div', { class: 'chat-screen' }, bubble));
    } else if (k === 'post') {
      card.appendChild(el('div', { class: 'post-head' },
        el('span', { class: 'av no-i18n', 'aria-hidden': 'true', text: initial(C.who) }),
        el('div', { class: 'chat-who' },
          el('div', { class: 'post-name no-i18n' }, el('span', { text: C.who }), D.verified ? el('span', { class: 'tick', title: t('verified'), 'aria-label': t('verified'), text: '✓' }) : null),
          el('div', { class: 'post-sub no-i18n' }, D.handle ? ltr(D.handle) : null, D.handle && C.meta ? ' · ' : '', C.meta || ''))));
      body = el('div', { class: 'msg-body' });
      if (D.quote) {
        body.appendChild(el('div', { class: 'quote-box no-i18n' }, el('div', { class: 'q', text: C.text }), el('div', { class: 'qa', text: C.cap })));
      } else {
        body.appendChild(el('p', { class: 'msg-text no-i18n mb0', dir: 'auto' }, linkify(C.text)));
        if (D.pic) body.appendChild(el('div', { class: 'pic', role: 'img', 'aria-label': t('photo_alt') },
          el('div', { class: 'pic-scene', 'aria-hidden': 'true', text: D.pic }), C.cap ? el('div', { class: 'pic-cap no-i18n', text: C.cap }) : null));
      }
      body.appendChild(el('div', { class: 'post-foot', 'aria-hidden': 'true' }, el('span', { text: '♡' }), el('span', { text: '💬' }), el('span', { text: '↗' })));
      card.appendChild(body);
    } else if (k === 'head') {
      card.appendChild(el('div', { class: 'paper no-i18n' },
        el('div', { class: 'paper-mast', text: C.who }),
        el('div', { class: 'paper-meta' }, el('span', { text: C.meta }), el('span', { text: '₹ 5' })),
        el('h3', { class: 'paper-h', text: C.text }),
        el('p', { class: 'paper-p mb0', text: C.cap })));
    } else if (k === 'video') {
      card.appendChild(el('div', { class: 'thumb', role: 'img', 'aria-label': t('video_alt') },
        el('span', { class: 'thumb-scene', 'aria-hidden': 'true', text: D.pic || '🎬' }),
        el('button', { type: 'button', class: 'thumb-play', 'aria-label': t('link_game'), onclick: fakePlay }, el('span', { 'aria-hidden': 'true', text: '▶' })),
        el('span', { class: 'thumb-dur' }, ltr(D.dur || '0:30'))));
      card.appendChild(el('div', { class: 'vid-title no-i18n', text: C.cap }));
      card.appendChild(el('div', { class: 'vid-chan no-i18n' }, el('span', { class: 'av', style: { width: '26px', height: '26px', fontSize: '.8rem' }, 'aria-hidden': 'true', text: initial(C.who) }), el('span', { text: C.who + ' · ' + C.meta })));
      card.appendChild(el('div', { class: 'vid-desc no-i18n', dir: 'auto' }, linkify(C.text)));
    } else if (k === 'shot') {
      card.appendChild(el('div', { class: 'tv' },
        el('div', { class: 'tv-top' }, el('span', { class: 'no-i18n', text: C.who }), el('span', { class: 'tv-live', text: t('shot_live') })),
        el('div', { class: 'tv-scene', 'aria-hidden': 'true', text: '🎙️' }),
        el('div', { class: 'tv-ticker' }, el('span', { class: 'brk', text: t('shot_breaking') }), el('span', { class: 'no-i18n', text: C.text })),
        el('div', { class: 'tv-sub no-i18n', text: C.cap }),
        el('div', { class: 'tv-crop', 'aria-hidden': 'true' })));
      card.appendChild(el('div', { class: 'shot-note no-i18n', text: C.meta }));
    } else { /* notice */
      card.appendChild(el('div', { class: 'notice no-i18n' },
        el('div', { class: 'notice-head', text: C.who }),
        el('div', { class: 'notice-meta' }, el('span', { text: C.meta }), D.ref ? ltr(D.ref) : null),
        el('p', { class: 'mb0', dir: 'auto' }, linkify(C.text)),
        el('span', { class: 'notice-stamp', 'aria-hidden': 'true', text: '✓' })));
    }
    var speakBtn = el('button', { type: 'button', class: 'btn btn-ghost btn-sm read-btn', 'aria-label': t('read_aloud'), title: t('read_aloud'), onclick: function () {
      var txt = [C.who, C.text, C.cap].filter(Boolean).join('. ');
      EDU.speak(txt).then(function (ok) { if (!ok) EDU.toast(t('no_voice')); });
    } }, '🔊 ', el('span', { text: t('read_aloud') }));
    card.appendChild(el('div', { class: 'row', style: { padding: '6px 10px', justifyContent: 'flex-end' } }, speakBtn));
    return card;
  }

  function flagsList(D, C) {
    if (!D.flags.length) {
      return el('ul', { class: 'flags safe' }, el('li', {}, el('span', { class: 'fi', 'aria-hidden': 'true', text: '✅' }), el('div', {}, el('strong', { text: t('good_signs') }), el('small', { class: 'no-i18n', text: C.why }))));
    }
    var ul = el('ul', { class: 'flags', id: 'reveal-flags' });
    D.flags.forEach(function (f, i) {
      ul.appendChild(el('li', { dataset: { flag: f } }, el('span', { class: 'fnum', 'aria-hidden': 'true', text: String(i + 1) }), el('span', { class: 'fi', 'aria-hidden': 'true', text: FLAG_ICON[f] || '🚩' }),
        el('div', {}, el('strong', { text: t('flag_' + f) }), el('small', { text: t('fdesc_' + f) }))));
    });
    return ul;
  }
  function stepCard(D, C) {
    return el('div', { class: 'step-card', dataset: { step: D.step } }, el('span', { class: 'si', 'aria-hidden': 'true', text: STEP_ICON[D.step] }),
      el('div', {}, el('h3', { text: t('step_title') }), el('div', { class: 'sn', text: t('step_' + D.step) }), el('p', { class: 'muted small', text: t('sdesc_' + D.step) }), el('p', { class: 'no-i18n', text: C.how })));
  }

  /* ---------------- tabs ---------------- */
  function showTab(name) {
    state.tab = name; store.set('tab', name);
    $$('#tabs [role="tab"]').forEach(function (b) {
      var on = b.id === 'tab-' + name;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      $('#' + b.getAttribute('aria-controls')).hidden = !on;
    });
  }
  $$('#tabs [role="tab"]').forEach(function (b, i, all) {
    b.addEventListener('click', function () { showTab(b.id.replace('tab-', '')); });
    b.addEventListener('keydown', function (e) {
      var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? all.length - 1 : -1;
      if (j < 0) return;
      e.preventDefault(); j = (j + all.length) % all.length; all[j].focus(); all[j].click();
    });
  });

  /* ---------------- level segments ---------------- */
  function seg(id, get, set) {
    $$('#' + id + ' button').forEach(function (b) {
      b.addEventListener('click', function () { set(b.dataset.v); paintSeg(id, get()); });
    });
    paintSeg(id, get());
  }
  function paintSeg(id, v) { $$('#' + id + ' button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'); }); }

  /* ---------------- game ---------------- */
  function startGame() {
    state.game = { level: state.level, order: EDU.shuffle(idsFor(state.level)), i: 0, answers: {}, score: 0, streak: 0, bestStreak: 0, revealed: false, done: false };
    saveGame(); renderGame();
  }
  function answer(choice) {
    var g = state.game;
    if (!g || g.done || g.revealed) return;
    var id = g.order[g.i], D = BY_ID[id];
    g.answers[id] = choice; g.revealed = true;
    if (choice === D.ans) { g.score++; g.streak++; g.bestStreak = Math.max(g.bestStreak, g.streak); } else g.streak = 0;
    if (g.bestStreak > state.stats.streak) { state.stats.streak = g.bestStreak; saveStats(); }
    saveGame(); renderGame();
    var v = $('#verdict'); if (v) v.focus();
  }
  function nextMsg() {
    var g = state.game;
    if (!g || !g.revealed) return;
    g.i++; g.revealed = false;
    if (g.i >= g.order.length) {
      g.done = true;
      state.stats.played++;
      state.stats.best[g.level] = Math.max(state.stats.best[g.level], g.score);
      saveStats();
    }
    saveGame(); renderGame();
    window.scrollTo({ top: $('#panel-game').offsetTop - 70, behavior: 'smooth' });
  }

  function renderGame() {
    var g = state.game;
    var start = $('#game-start'), play = $('#game-play'), res = $('#game-results');
    start.innerHTML = ''; play.innerHTML = ''; res.innerHTML = '';
    paintSeg('seg-level', state.level);
    if (!g || g.done) {
      start.hidden = false; play.hidden = true; res.hidden = !(g && g.done);
      var st = state.stats;
      start.appendChild(el('div', { class: 'card stack' },
        el('h2', { class: 'mb0', text: t('start_title') }),
        el('p', { class: 'muted mb0', text: t('start_desc') }),
        el('div', { class: 'stats', id: 'stats' },
          el('div', { class: 'stat' }, el('b', { id: 'stat-best', text: EDU.fmt(st.best[state.level]) + ' / 12' }), el('span', { text: t('stat_best') })),
          el('div', { class: 'stat' }, el('b', { id: 'stat-streak', text: EDU.fmt(st.streak) }), el('span', { text: t('stat_streak') })),
          el('div', { class: 'stat' }, el('b', { id: 'stat-played', text: EDU.fmt(st.played) }), el('span', { text: t('stat_played') }))),
        el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'start-btn', onclick: startGame }, '🕵️ ', el('span', { text: t(g && g.done ? 'play_again' : 'start_btn') })))));
      if (g && g.done) renderResults(res);
      return;
    }
    start.hidden = true; res.hidden = true; play.hidden = false;
    var n = g.order.length, id = g.order[g.i], D = BY_ID[id], C = msgText(id);
    /* resume button when a round was in progress and the user re-opened the page: shown inside the start card instead */
    var top = el('div', { class: 'topbar' },
      el('span', { class: 'pill', id: 'q-pill' }, t('q_of', { i: EDU.fmt(g.i + 1), n: EDU.fmt(n) })),
      el('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(n), 'aria-valuenow': String(g.i) }, el('span', { style: { width: (g.i / n * 100) + '%' } })),
      el('span', { class: 'pill' }, t('score') + ': ', el('b', { id: 'score', dataset: { score: g.score }, text: EDU.fmt(g.score) })),
      el('span', { class: 'pill' }, '🔥 ', el('b', { id: 'streak', text: EDU.fmt(g.streak) }), ' ', el('span', { class: 'small muted', text: t('streak') })));
    play.appendChild(top);
    var grid = el('div', { class: 'game' });
    grid.appendChild(renderMsg(id, false));
    var side = el('div', { class: 'card stack', id: 'side' });
    if (!g.revealed) {
      side.appendChild(el('h2', { class: 'ask', text: t('ask') }));
      var ans = el('div', { class: 'ans', id: 'answers' });
      ANSWERS.forEach(function (a, i) {
        ans.appendChild(el('button', { type: 'button', id: 'ans-' + a, dataset: { a: a }, onclick: function () { answer(a); } },
          el('span', { class: 'al' }, el('span', { class: 'ak', 'aria-hidden': 'true', text: String(i + 1) }), el('span', { text: t('btn_' + a) })),
          el('span', { class: 'ah', text: t('hint_' + a) })));
      });
      side.appendChild(ans);
      side.appendChild(el('p', { class: 'tiny muted mb0', text: t('keys_hint') }));
      side.appendChild(el('p', { class: 'tiny muted mb0', id: 'link-note', text: t('link_game') }));
    } else {
      var pick = g.answers[id], ok = pick === D.ans;
      var near = (pick === 'verify' && D.ans === 'fake') || (pick === 'fake' && D.ans === 'verify');
      var msgKey = ok ? 'right_msg' : near ? (D.ans === 'fake' ? 'close_fake_msg' : 'close_verify_msg') : D.ans === 'fake' ? 'wrong_fake_msg' : D.ans === 'rel' ? 'wrong_rel_msg' : 'wrong_verify_msg';
      side.appendChild(el('p', { class: 'verdict ' + (ok ? 'ok' : near ? 'near' : 'bad'), id: 'verdict', tabindex: '-1', dataset: { result: ok ? 'correct' : near ? 'near' : 'wrong' }, 'aria-live': 'polite', text: (ok ? '✅ ' : near ? '🟡 ' : '❌ ') + t(ok ? 'correct' : 'wrong') }));
      side.appendChild(el('p', { class: 'mb0', text: t(msgKey) }));
      side.appendChild(el('p', { class: 'mb0' }, el('strong', { text: t('answer_was', { a: t('btn_' + D.ans) }) })));
      var ansv = el('div', { class: 'ans' });
      ANSWERS.forEach(function (a, i) {
        ansv.appendChild(el('button', { type: 'button', disabled: true, class: (a === D.ans ? 'win ' : '') + (a === pick ? 'picked ' : '') + (a === pick && !ok ? 'lose' : ''), dataset: { a: a } },
          el('span', { class: 'al' }, el('span', { class: 'ak', 'aria-hidden': 'true', text: String(i + 1) }), el('span', { text: t('btn_' + a) }))));
      });
      side.appendChild(ansv);
      side.appendChild(el('h3', { class: 'mb0', text: D.flags.length ? t('red_flags') : t('good_signs') }));
      side.appendChild(flagsList(D, C));
      if (D.flags.length) side.appendChild(el('div', {}, el('strong', { text: t('why_title') }), el('p', { class: 'mb0 no-i18n', text: C.why })));
      side.appendChild(stepCard(D, C));
      side.appendChild(el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'next-btn', onclick: nextMsg }, el('span', { text: t(g.i + 1 >= n ? 'see_results' : 'next_msg') }), ' →')));
    }
    grid.appendChild(side);
    play.appendChild(grid);
  }

  function renderResults(res) {
    var g = state.game, n = g.order.length;
    var key = g.score >= n * 0.8 ? 'res_great' : g.score >= n * 0.5 ? 'res_good' : 'res_low';
    var tbody = el('tbody');
    g.order.forEach(function (id, i) {
      var D = BY_ID[id], C = msgText(id), pick = g.answers[id], ok = pick === D.ans;
      tbody.appendChild(el('tr', { class: ok ? 'okr' : 'badr', dataset: { ok: ok ? 1 : 0 } },
        el('td', { text: String(i + 1) }),
        el('td', {}, el('span', { class: 'no-i18n', text: (C.text || C.cap).slice(0, 70) + ((C.text || C.cap).length > 70 ? '…' : '') }), el('div', { class: 'rm', text: t('kind_' + D.kind) })),
        el('td', { text: pick ? t('btn_' + pick) : '—' }),
        el('td', {}, el('strong', { text: t('btn_' + D.ans) }), el('div', { class: 'rm', text: t('step_' + D.step) }))));
    });
    res.appendChild(el('div', { class: 'card stack', id: 'results' },
      el('h2', { class: 'mb0', text: t('results_title') }),
      el('div', { class: 'final-score', id: 'final-score', dataset: { score: g.score }, text: g.score + ' / ' + n }),
      el('p', { class: 'mb0', 'aria-live': 'polite', text: t('results_line', { score: EDU.fmt(g.score), n: EDU.fmt(n) }) + ' ' + t(key) }),
      el('h3', { class: 'mb0', text: t('review_title') }),
      el('div', { class: 'scroll-x' }, el('table', { class: 'review' }, el('thead', {}, el('tr', {}, el('th', { text: '#' }), el('th', { text: t('ws_col_msg') }), el('th', { text: t('you_said') }), el('th', { text: t('answer') }))), tbody)),
      el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn btn-primary', id: 'play-again', onclick: startGame }, '🔁 ', el('span', { text: t('play_again') })))));
  }

  document.addEventListener('keydown', function (e) {
    if (state.tab !== 'game' || !state.game || state.game.done || e.ctrlKey || e.metaKey || e.altKey) return;
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === '1' || e.key === '2' || e.key === '3') { answer(ANSWERS[+e.key - 1]); e.preventDefault(); }
    else if (e.key === 'Enter' && state.game.revealed && tag !== 'BUTTON') { nextMsg(); e.preventDefault(); }
  });

  seg('seg-level', function () { return state.level; }, function (v) {
    state.level = v; store.set('level', v);
    if (state.game && !state.game.done && state.game.level !== v) {
      if (!confirm(t('confirm_reset'))) { paintSeg('seg-level', state.level = state.game.level); store.set('level', state.level); return; }
      state.game = null; saveGame();
    }
    if (state.game && state.game.done && state.game.level !== v) { state.game = null; saveGame(); }
    renderGame();
  });

  /* ---------------- checker ---------------- */
  var chkIn = $('#chk-in'), chkOut = $('#chk-out');
  function debounce(fn, ms) { var h; return function () { clearTimeout(h); h = setTimeout(fn, ms); }; }
  function renderChecker() {
    var text = chkIn.value;
    state.chkText = text;
    chkOut.innerHTML = '';
    chkOut.appendChild(el('h2', { class: 'mb0', text: t('chk_result') }));
    if (!text.trim()) {
      chkOut.appendChild(el('p', { class: 'muted mb0', id: 'chk-empty', text: t('chk_empty') }));
      chkOut.appendChild(el('div', { class: 'lvl-badge', id: 'chk-level', dataset: { level: 'none', flags: 0 }, hidden: true }));
      return;
    }
    var r = FND.analyze(text, wordLists());
    var langName = (EDU.langInfo(EDU.lang) || {}).name || EDU.lang;
    chkOut.appendChild(el('div', { class: 'lvl-badge', id: 'chk-level', dataset: { level: r.level, flags: r.flags.length, points: r.points } },
      el('span', { class: 'li', 'aria-hidden': 'true', text: LVL_ICON[r.level] }),
      el('div', {}, el('div', { class: 'lt', text: t('lvl_' + r.level) }), el('p', { text: t('lvl_' + r.level + '_d') }))));
    chkOut.appendChild(el('p', { class: 'mb0' }, el('strong', { id: 'chk-count', text: r.flags.length === 0 ? t('chk_flags_0') : r.flags.length === 1 ? t('chk_flags_1') : t('chk_flags_n', { n: EDU.fmt(r.flags.length) }) })));
    if (r.flags.length) {
      var ul = el('ul', { class: 'cflags', id: 'chk-flags' });
      r.flags.forEach(function (f) {
        var hits = [], seen = {};
        f.hits.forEach(function (h) { var k = h.txt.toLowerCase(); if (!seen[k] && hits.length < 6) { seen[k] = 1; hits.push(h.txt); } });
        ul.appendChild(el('li', { dataset: { flag: f.code, hits: f.hits.length } }, el('span', { class: 'fi', 'aria-hidden': 'true', text: CF_ICON[f.code] || '🚩' }),
          el('div', {}, el('strong', { text: t('cf_' + f.code) }), el('small', { text: t('cfd_' + f.code) }),
            hits.length ? el('div', { class: 'hits no-i18n' }, el('span', { class: 'muted', style: { border: 0, background: 'none', padding: 0 }, text: t('found_label') }), hits.map(function (h) { return el('span', { dir: 'auto', text: h }); })) : null)));
      });
      chkOut.appendChild(ul);
    }
    chkOut.appendChild(el('h3', { class: 'mb0', text: t('chk_text_title') }));
    var marked = el('div', { class: 'chk-text no-i18n', id: 'chk-marked', dir: 'auto' }), last = 0;
    r.ranges.forEach(function (rg) {
      if (rg.s > last) marked.appendChild(document.createTextNode(text.slice(last, rg.s)));
      marked.appendChild(el('mark', { dataset: { flag: rg.code }, text: text.slice(rg.s, rg.e) }));
      last = rg.e;
    });
    if (last < text.length) marked.appendChild(document.createTextNode(text.slice(last)));
    chkOut.appendChild(marked);
    chkOut.appendChild(el('p', { class: 'small muted mb0', id: 'chk-stats', text: t('chk_stats', { w: EDU.fmt(r.stats.words), c: EDU.fmt(Math.round(r.stats.capsRatio * 100)), e: EDU.fmt(r.stats.excl), l: EDU.fmt(r.stats.links.length) }) }));
    chkOut.appendChild(el('p', { class: 'tiny muted mb0', text: t('chk_note_lang', { lang: langName }) }));
  }
  var renderCheckerSoon = debounce(renderChecker, 160);
  chkIn.addEventListener('input', renderCheckerSoon);
  [['ex-scam', 'ex_scam'], ['ex-calm', 'ex_calm'], ['ex-bank', 'ex_bank']].forEach(function (p) {
    $('#' + p[0]).addEventListener('click', function () { chkIn.value = t(p[1]); renderChecker(); chkOut.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
  });
  $('#chk-clear').addEventListener('click', function () { chkIn.value = ''; renderChecker(); chkIn.focus(); });
  $('#chk-copy').addEventListener('click', function () {
    var text = chkIn.value;
    if (!text.trim()) { EDU.toast(t('chk_empty')); return; }
    var r = FND.analyze(text, wordLists());
    var lines = [t('chk_report_title'), t('lvl_' + r.level) + ' · ' + (r.flags.length === 1 ? t('chk_flags_1') : t('chk_flags_n', { n: r.flags.length }))];
    r.flags.forEach(function (f) { lines.push('- ' + t('cf_' + f.code) + (f.hits.length ? ': ' + f.hits.slice(0, 5).map(function (h) { return '"' + h.txt + '"'; }).join(', ') : '')); });
    lines.push('', t('chk_disclaimer'), '', '--- ', text);
    EDU.copy(lines.join('\n')).then(function (ok) { EDU.toast(t(ok === false ? 'wrong' : 'copied')); }, function () { EDU.toast(t('copied')); });
  });

  /* ---------------- class mode ---------------- */
  function startClass() {
    state.cls = { set: state.classSet, order: EDU.shuffle(idsFor(state.classSet)), i: 0, votes: { rel: 0, fake: 0, verify: 0 }, revealed: false, score: 0, done: false };
    saveClass(); renderClass();
  }
  function classVerdict(c) {
    var v = c.votes, total = v.rel + v.fake + v.verify, D = BY_ID[c.order[c.i]];
    if (!total) return 'novote';
    var max = Math.max(v.rel, v.fake, v.verify), tops = ANSWERS.filter(function (a) { return v[a] === max; });
    if (tops.length > 1) return 'tie';
    return tops[0] === D.ans ? 'right' : 'wrong';
  }
  function revealClass() {
    var c = state.cls; if (!c || c.revealed || c.done) return;
    c.revealed = true;
    if (classVerdict(c) === 'right') c.score++;
    saveClass(); renderClass();
  }
  function nextClass() {
    var c = state.cls; if (!c || !c.revealed) return;
    c.i++; c.revealed = false; c.votes = { rel: 0, fake: 0, verify: 0 };
    if (c.i >= c.order.length) c.done = true;
    saveClass(); renderClass();
  }
  function renderClass() {
    var c = state.cls, stage = $('#class-stage');
    stage.innerHTML = '';
    paintSeg('seg-class-set', state.classSet);
    var fsBtn = el('button', { type: 'button', class: 'btn', id: 'class-fs', onclick: function () { EDU.fullscreen($('#panel-class')); } }, '⛶ ', el('span', { text: t('fullscreen') }));
    if (!c || c.done) {
      var card = el('div', { class: 'card stack' },
        el('h2', { class: 'mb0', text: t('class_title') }),
        el('p', { class: 'muted mb0', text: t('class_desc') }));
      if (c && c.done) card.appendChild(el('p', { class: 'callout success mb0', id: 'class-summary', dataset: { score: c.score }, text: t('class_done') + ' ' + t('class_summary', { score: EDU.fmt(c.score), n: EDU.fmt(c.order.length) }) }));
      var segWrap = el('div', { class: 'row' }, el('span', { class: 'lbl', id: 'lbl-class-set', text: t('class_set') }));
      var sg = el('div', { class: 'seg', role: 'group', 'aria-labelledby': 'lbl-class-set', id: 'seg-class-set' });
      [['jr', 'level_jr'], ['sr', 'level_sr'], ['all', 'set_all']].forEach(function (p) {
        sg.appendChild(el('button', { type: 'button', dataset: { v: p[0] }, 'aria-pressed': state.classSet === p[0] ? 'true' : 'false', text: t(p[1]), onclick: function () { state.classSet = p[0]; store.set('classSet', p[0]); paintSeg('seg-class-set', p[0]); } }));
      });
      segWrap.appendChild(sg);
      card.appendChild(segWrap);
      card.appendChild(el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'class-start', onclick: startClass }, '🏫 ', el('span', { text: t(c && c.done ? 'class_restart' : 'class_start') })), fsBtn));
      stage.appendChild(card);
      return;
    }
    var n = c.order.length, id = c.order[c.i], D = BY_ID[id], C = msgText(id);
    stage.appendChild(el('div', { class: 'topbar' },
      el('span', { class: 'pill', id: 'class-pill' }, t('q_of', { i: EDU.fmt(c.i + 1), n: EDU.fmt(n) })),
      el('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(n), 'aria-valuenow': String(c.i) }, el('span', { style: { width: (c.i / n * 100) + '%' } })),
      el('span', { class: 'pill' }, t('score') + ': ', el('b', { id: 'class-score', dataset: { score: c.score }, text: EDU.fmt(c.score) })),
      fsBtn));
    stage.appendChild(renderMsg(id, true));
    var panel = el('div', { class: 'card stack', id: 'class-panel', style: { marginTop: '16px' } });
    if (!c.revealed) {
      panel.appendChild(el('h2', { class: 'mb0', text: '✋ ' + t('votes_title') }));
      var votes = el('div', { class: 'votes' });
      ANSWERS.forEach(function (a) {
        var inp = el('input', { type: 'number', min: '0', max: '999', inputmode: 'numeric', id: 'vote-' + a, value: String(c.votes[a]), 'aria-label': t('btn_' + a) });
        inp.addEventListener('input', function () { c.votes[a] = EDU.clamp(parseInt(inp.value, 10) || 0, 0, 999); saveClass(); });
        votes.appendChild(el('div', { class: 'vote-box ' + a },
          el('label', { for: 'vote-' + a }, el('strong', { text: t('btn_' + a) })),
          el('div', { class: 'vote-ctrl' },
            el('button', { type: 'button', class: 'btn', 'aria-label': t('remove_vote'), onclick: function () { c.votes[a] = Math.max(0, c.votes[a] - 1); inp.value = c.votes[a]; saveClass(); }, text: '−' }),
            inp,
            el('button', { type: 'button', class: 'btn btn-primary', id: 'vote-' + a + '-plus', 'aria-label': t('add_vote'), onclick: function () { c.votes[a] = Math.min(999, c.votes[a] + 1); inp.value = c.votes[a]; saveClass(); }, text: '+' }))));
      });
      panel.appendChild(votes);
      panel.appendChild(el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'class-reveal', onclick: revealClass }, '👁️ ', el('span', { text: t('reveal') }))));
    } else {
      var v = c.votes, total = v.rel + v.fake + v.verify, vd = classVerdict(c);
      var bars = el('div', { class: 'bars' });
      ANSWERS.forEach(function (a) {
        var pct = total ? Math.round(v[a] / total * 100) : 0;
        bars.appendChild(el('div', { class: 'bar-row ' + a }, el('span', { text: t('btn_' + a) + (a === D.ans ? ' ✓' : '') }), el('div', { class: 'bar' }, el('span', { style: { width: pct + '%' } })), el('span', { class: 'num', text: EDU.fmt(v[a]) + ' (' + pct + '%)' })));
      });
      panel.appendChild(bars);
      panel.appendChild(el('p', { class: 'verdict-big', id: 'class-verdict', dataset: { verdict: vd }, 'aria-live': 'polite', text: (vd === 'right' ? '✅ ' : vd === 'wrong' ? '❌ ' : '🤔 ') + t(vd === 'right' ? 'class_right' : vd === 'wrong' ? 'class_wrong' : vd === 'tie' ? 'class_tie' : 'class_novote') }));
      panel.appendChild(el('p', { class: 'mb0' }, el('strong', { text: t('answer_was', { a: t('btn_' + D.ans) }) })));
      panel.appendChild(el('h3', { class: 'mb0', text: D.flags.length ? t('red_flags') : t('good_signs') }));
      panel.appendChild(flagsList(D, C));
      if (D.flags.length) panel.appendChild(el('p', { class: 'mb0 no-i18n', text: C.why }));
      panel.appendChild(stepCard(D, C));
      panel.appendChild(el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'class-next', onclick: nextClass }, el('span', { text: t(c.i + 1 >= n ? 'see_results' : 'next_msg') }), ' →')));
    }
    stage.appendChild(panel);
  }

  /* ---------------- worksheet + poster ---------------- */
  function renderWorksheet() {
    var ws = $('#worksheet'); ws.innerHTML = '';
    paintSeg('seg-ws-level', state.wsLevel);
    var ids = WS[state.wsLevel];
    var qb = el('tbody'), kb = el('tbody');
    ids.forEach(function (id, i) {
      var D = BY_ID[id], C = msgText(id);
      qb.appendChild(el('tr', { class: 'ws-row', dataset: { id: id } },
        el('td', { text: String(i + 1) }),
        el('td', { class: 'ws-msg' }, el('span', { class: 'wk', text: t('kind_' + D.kind) + (D.fwd ? ' · ' + t('fwd_many') : '') }), C.who ? el('span', { class: 'ww no-i18n', text: C.who + (C.meta ? ' · ' + C.meta : '') }) : null, el('span', { class: 'wt no-i18n', text: C.text }), C.cap ? el('span', { class: 'wt no-i18n small', text: C.cap }) : null),
        el('td', {}, ANSWERS.map(function (a) { return el('span', { class: 'ws-opt' }, el('span', { class: 'ws-box', 'aria-hidden': 'true' }), t('btn_' + a)); })),
        el('td', { class: 'ws-why' })));
      kb.appendChild(el('tr', { class: 'ws-key-row', dataset: { id: id, ans: D.ans } },
        el('td', { text: String(i + 1) }),
        el('td', {}, el('strong', { text: t('btn_' + D.ans) })),
        el('td', { text: D.flags.length ? D.flags.map(function (f) { return t('flag_' + f); }).join(', ') : t('good_signs') }),
        el('td', {}, el('strong', { text: t('step_' + D.step) }), el('div', { class: 'small no-i18n', text: C.how }))));
    });
    ws.appendChild(el('h1', { text: t('ws_sheet_title') + ' · ' + t('level_' + state.wsLevel) }));
    ws.appendChild(el('p', { text: t('ws_name') }));
    ws.appendChild(el('p', { text: t('ws_instr') }));
    ws.appendChild(el('table', { class: 'ws-table ws-q' }, el('thead', {}, el('tr', {}, el('th', { text: '#' }), el('th', { text: t('ws_col_msg') }), el('th', { text: t('ws_col_ans') }), el('th', { text: t('ws_col_why') }))), qb));
    ws.appendChild(el('div', { class: 'ws-key' },
      el('h2', { text: t('ws_key') + ' · ' + t('level_' + state.wsLevel) }),
      el('table', { class: 'ws-table ws-k' }, el('thead', {}, el('tr', {}, el('th', { text: '#' }), el('th', { text: t('answer') }), el('th', { text: t('ws_flags') }), el('th', { text: t('ws_step') }))), kb)));
  }
  seg('seg-ws-level', function () { return state.wsLevel; }, function (v) { state.wsLevel = v; store.set('wsLevel', v); renderWorksheet(); });
  function printWith(cls) {
    document.body.classList.add(cls);
    var done = function () { document.body.classList.remove(cls); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(function () { try { window.print(); } catch (e) { } setTimeout(done, 1500); }, 50);
  }
  $('#ws-print').addEventListener('click', function () { renderWorksheet(); printWith('printing-ws'); });
  $('#poster-print').addEventListener('click', function () { printWith('printing-poster'); });

  /* ---------------- reset ---------------- */
  $('#reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    ['game', 'stats', 'class', 'level', 'wsLevel', 'classSet', 'tab'].forEach(function (k) { store.remove(k); });
    state.game = null; state.stats = cleanStats(null); state.cls = null; state.level = 'jr'; state.wsLevel = 'jr'; state.classSet = 'jr';
    chkIn.value = '';
    renderAll(); EDU.toast(t('reset_done'));
  });

  /* ---------------- render everything ---------------- */
  function renderAll() { renderGame(); renderChecker(); renderClass(); renderWorksheet(); }
  EDU.onLang(renderAll);
  showTab(state.tab);
  renderAll();
})();
