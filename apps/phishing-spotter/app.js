/* Spot the Scam: a cyber-safety game with Indian SMS / WhatsApp / email / call messages.
   Structure of messages: data.js (window.SPOT_MSGS). Words in 12 languages: content.js (window.APP_CONTENT).
   In message texts, [[code|words]] marks a red flag (or a safe sign when code is "ok"). */
(function () {
  'use strict';
  var SLUG = 'phishing-spotter';
  var store = EDU.store(SLUG);
  var MSGS = window.SPOT_MSGS || [];
  var BY_ID = {};
  MSGS.forEach(function (m) { BY_ID[m.id] = m; });
  var FLAG_ICON = { sender: '📵', urgent: '⏰', threat: '😨', link: '🔗', secret: '🔑', money: '💸', prize: '🎁', odd: '✍️', upi: '📲', alone: '🤫', ok: '✅' };
  var CH_ICON = { sms: '💬', wa: '📱', email: '✉️', dm: '📷', call: '📹' };
  var MARK = /\[\[(\w+)\|([^\]]*)\]\]/g;
  var URL_RE = /(?:[a-z0-9-]+\.)+(?:xyz|top|net|com|org|in|info|link|site|online)(?:\/[\w\-./?=&]*)?/gi;

  EDU.init({ slug: SLUG, title: 'app_title' });
  var $ = EDU.$, el = EDU.el, t = EDU.t;

  /* ---------------- helpers ---------------- */
  function C(id) {
    var all = window.APP_CONTENT || {};
    var L = all[EDU.lang] && all[EDU.lang].msgs && all[EDU.lang].msgs[id];
    return L || (all.en && all.en.msgs && all.en.msgs[id]) || { ctx: '', who: '', text: '', why: '', todo: '' };
  }
  function parse(text) {
    var out = [], last = 0, m;
    text = String(text || '');
    MARK.lastIndex = 0;
    while ((m = MARK.exec(text))) {
      if (m.index > last) out.push({ code: null, s: text.slice(last, m.index) });
      out.push({ code: m[1], s: m[2] });
      last = MARK.lastIndex;
    }
    if (last < text.length) out.push({ code: null, s: text.slice(last) });
    return out;
  }
  function plain(text) { return String(text || '').replace(MARK, '$2'); }
  function flagsOf(m, text) {
    var list = [];
    if (m.senderFlag) list.push('sender');
    parse(text).forEach(function (s) { if (s.code && s.code !== 'ok' && list.indexOf(s.code) < 0) list.push(s.code); });
    return list;
  }
  function n(x) { return EDU.fmt(x); }
  function onFakeLink(e) { e.preventDefault(); EDU.toast(t('link_tap'), 3800); }

  function addUrlText(parent, s, revealed) {
    var last = 0, m;
    URL_RE.lastIndex = 0;
    while ((m = URL_RE.exec(s))) {
      if (m.index > last) parent.appendChild(document.createTextNode(s.slice(last, m.index)));
      var u = el('button', { type: 'button', class: 'lnk no-i18n', dir: 'ltr', text: m[0] });
      u.addEventListener('click', onFakeLink);
      parent.appendChild(u);
      last = URL_RE.lastIndex;
    }
    if (last < s.length) parent.appendChild(document.createTextNode(s.slice(last)));
  }

  function renderText(container, text, revealed, nums) {
    parse(text).forEach(function (seg) {
      if (seg.code && revealed) {
        var ok = seg.code === 'ok';
        var mk = el('mark', { class: ok ? 'ok' : 'rf', title: t('flag_' + seg.code) });
        addUrlText(mk, seg.s, revealed);
        if (!ok && nums[seg.code]) mk.appendChild(el('span', { class: 'fnum', 'aria-hidden': 'true', text: String(nums[seg.code]) }));
        container.appendChild(mk);
      } else {
        addUrlText(container, seg.s, revealed);
      }
    });
  }

  /* A decorative (not scannable) QR-code picture. */
  function qrSvg() {
    var N = 21, cells = '', seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    function finder(x, y) {
      return '<rect x="' + x + '" y="' + y + '" width="7" height="7" fill="#000"/><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" fill="#fff"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3" fill="#000"/>';
    }
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var inF = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
      if (!inF && rnd() > 0.52) cells += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
    }
    var w = el('div', { class: 'ph-qr', role: 'img', 'aria-label': t('qr_alt') });
    w.innerHTML = '<svg viewBox="0 0 21 21" width="120" height="120" shape-rendering="crispEdges" aria-hidden="true"><rect width="21" height="21" fill="#fff"/><g fill="#000">' + cells + '</g>' + finder(0, 0) + finder(14, 0) + finder(0, 14) + '</svg>';
    return w;
  }

  /* Phone-style message card. opts: {revealed, big, id} */
  function phone(m, opts) {
    opts = opts || {};
    var c = C(m.id), revealed = !!opts.revealed;
    var nums = {};
    flagsOf(m, c.text).forEach(function (f, i) { nums[f] = i + 1; });
    var fromEl = el('bdi', { class: 'ph-from no-i18n', dir: 'ltr', text: m.from });
    if (revealed && m.senderFlag) {
      fromEl = el('span', { class: 'sender-rf', title: t('flag_sender') }, fromEl, el('span', { class: 'fnum', 'aria-hidden': 'true', text: String(nums.sender) }));
    }
    var nameEl = el('div', { class: 'ph-name' }, c.who ? el('span', { text: c.who }) : fromEl);
    var subEl = el('div', { class: 'ph-sub' }, c.who ? fromEl : null, c.who ? ' · ' : null, el('span', { text: t('ch_' + m.ch) }));
    var head = el('div', { class: 'ph-head' },
      el('span', { class: 'ph-av', 'aria-hidden': 'true', text: CH_ICON[m.ch] || '💬' }),
      el('div', { class: 'ph-who' }, nameEl, subEl));
    var body = el('div', { class: 'ph-text no-i18n' });
    renderText(body, c.text, revealed, nums);
    var bubble = el('div', { class: 'ph-bubble' });
    if (m.attach === 'qr') bubble.appendChild(qrSvg());
    bubble.appendChild(body);
    bubble.appendChild(el('div', { class: 'ph-time', dir: 'ltr', text: m.time }));
    var screen = el('div', { class: 'ph-screen' }, el('p', { class: 'ph-day' }, el('span', { text: t('today') })), bubble);
    return el('div', { class: 'phone ch-' + m.ch + (opts.big ? ' big' : ''), id: opts.id || null, 'data-id': m.id },
      el('div', { class: 'ph-inner' }, el('div', { class: 'ph-notch', 'aria-hidden': 'true' }), head, screen));
  }

  function readAloudBtn(m) {
    return el('button', { type: 'button', class: 'btn btn-sm', onclick: function () {
      var c = C(m.id);
      EDU.speak(plain((c.who ? c.who + '. ' : '') + c.text)).then(function (ok) { if (!ok) EDU.toast(t('no_voice')); });
    } }, '🔊 ', el('span', { text: t('read_aloud') }));
  }

  /* Explanation block shown after an answer. */
  function revealInfo(m) {
    var c = C(m.id), box = el('div', { class: 'stack' });
    if (m.scam) {
      var flags = flagsOf(m, c.text);
      box.appendChild(el('h3', { class: 'rf-head', text: '🚩 ' + t('red_flags') + ' (' + n(flags.length) + ')' }));
      var ol = el('ol', { class: 'flags', id: 'flag-list' });
      flags.forEach(function (f, i) {
        ol.appendChild(el('li', null,
          el('span', { class: 'fnum', text: String(i + 1) }),
          el('span', { class: 'fi', 'aria-hidden': 'true', text: FLAG_ICON[f] || '🚩' }),
          el('div', null, el('strong', { text: t('flag_' + f) }), el('small', { text: t('fdesc_' + f) }))));
      });
      box.appendChild(ol);
      box.appendChild(el('div', null, el('h3', { text: t('why') }), el('p', { class: 'mb0', text: c.why })));
    } else {
      box.appendChild(el('h3', { class: 'ok-head', text: '✅ ' + t('safe_signs') }));
      box.appendChild(el('ul', { class: 'flags safe' }, el('li', null, el('span', { class: 'fi', 'aria-hidden': 'true', text: '✅' }), el('div', null, el('span', { text: c.why })))));
    }
    box.appendChild(el('div', { class: 'callout accent' }, el('strong', { text: '👉 ' + t('what_to_do') }), el('p', { class: 'mb0', text: c.todo })));
    return box;
  }

  /* ---------------- tabs ---------------- */
  var TABS = ['play', 'class', 'rules'];
  var activeTab = store.get('tab', 'play');
  if (TABS.indexOf(activeTab) < 0) activeTab = 'play';
  function showTab(name) {
    activeTab = name;
    store.set('tab', name);
    TABS.forEach(function (x) {
      $('#tab-' + x).setAttribute('aria-selected', x === name ? 'true' : 'false');
      $('#tab-' + x).tabIndex = x === name ? 0 : -1;
      $('#panel-' + x).hidden = x !== name;
    });
    renderAll();
  }
  TABS.forEach(function (x, i) {
    var b = $('#tab-' + x);
    b.addEventListener('click', function () { showTab(x); });
    b.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      if (document.documentElement.dir === 'rtl') d = -d;
      var nx = TABS[(i + d + TABS.length) % TABS.length];
      showTab(nx); $('#tab-' + nx).focus();
    });
  });

  /* ---------------- solo game ---------------- */
  var view = 'start';           // start | game | results
  var lenPref = store.get('len', 8);
  if ([8, 16].indexOf(lenPref) < 0) lenPref = 8;
  var game = loadGame();
  var lastGame = null;

  function loadGame() {
    var g = store.get('game', null);
    if (!g || !Array.isArray(g.ids) || !g.ids.length || g.ids.some(function (id) { return !BY_ID[id]; })) return null;
    if (!Array.isArray(g.answers)) g.answers = [];
    g.idx = EDU.clamp(parseInt(g.idx, 10) || 0, 0, g.ids.length - 1);
    g.revealed = !!g.revealed && !!g.answers[g.idx];
    g.streak = g.streak || 0; g.bestStreak = g.bestStreak || 0;
    return g;
  }
  function saveGame() { if (game) store.set('game', game); else store.remove('game'); }
  function scoreOf(g) {
    var s = 0;
    g.answers.forEach(function (a, i) { if (a && (a === 'scam') === BY_ID[g.ids[i]].scam) s++; });
    return s;
  }
  function pickIds(len) {
    var safe = EDU.shuffle(MSGS.filter(function (m) { return !m.scam; }));
    var scam = EDU.shuffle(MSGS.filter(function (m) { return m.scam; }));
    if (len >= MSGS.length) return EDU.shuffle(MSGS).map(function (m) { return m.id; });
    var nSafe = Math.max(2, Math.round(len * safe.length / MSGS.length));
    return EDU.shuffle(safe.slice(0, nSafe).concat(scam.slice(0, len - nSafe))).map(function (m) { return m.id; });
  }
  function newGame() {
    game = { ids: pickIds(lenPref), answers: [], idx: 0, revealed: false, streak: 0, bestStreak: 0 };
    saveGame();
    view = 'game';
    renderPlay();
    scrollToTop('#play-game');
  }
  function scrollToTop(sel) {
    var e = $(sel);
    if (e && e.getBoundingClientRect().top < 0) e.scrollIntoView({ block: 'start' });
  }

  function renderPlay() {
    $('#play-start').hidden = view !== 'start';
    $('#play-game').hidden = view !== 'game';
    $('#play-results').hidden = view !== 'results';
    if (view === 'start') renderStart();
    else if (view === 'game') renderGame();
    else renderResults();
  }

  function renderStart() {
    var root = $('#play-start');
    root.innerHTML = '';
    var best = store.get('best', null), bestStreak = store.get('bestStreak', 0), played = store.get('played', 0);
    var seg = el('div', { class: 'seg', role: 'group', 'aria-label': t('len_label') });
    [8, 16].forEach(function (len) {
      seg.appendChild(el('button', { type: 'button', id: 'len-' + len, 'aria-pressed': lenPref === len ? 'true' : 'false', text: t('len_n', { n: n(len) }),
        onclick: function () { lenPref = len; store.set('len', len); renderStart(); } }));
    });
    var btns = el('div', { class: 'row' },
      el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'start', onclick: newGame }, '▶ ', el('span', { text: t('start_game') })));
    if (game) {
      btns.appendChild(el('button', { type: 'button', class: 'btn btn-lg', id: 'continue', onclick: function () { view = 'game'; renderPlay(); } },
        '⏯ ', el('span', { text: t('continue_game', { i: n(game.idx + 1), n: n(game.ids.length) }) })));
    }
    var stats = el('div', { class: 'stats' },
      el('div', { class: 'stat' }, el('b', { id: 'best-score', dir: 'ltr', text: best ? n(best.score) + '/' + n(best.n) : '–' }), el('span', { text: t('stat_best') })),
      el('div', { class: 'stat' }, el('b', { id: 'best-streak', text: n(bestStreak) }), el('span', { text: t('stat_streak') })),
      el('div', { class: 'stat' }, el('b', { id: 'played', text: n(played) }), el('span', { text: t('stat_played') })));
    var left = el('div', { class: 'stack' },
      el('h2', { class: 'mb0', text: t('start_title') }),
      el('p', { class: 'mb0', text: t('start_desc') }),
      el('div', { class: 'field' }, el('span', { text: t('len_label') }), seg),
      btns, stats,
      el('div', { class: 'row spread' },
        el('span', { class: 'tiny muted', text: '🔒 ' + t('saved_local') }),
        el('button', { type: 'button', class: 'btn btn-sm btn-ghost', id: 'reset-scores', onclick: resetScores }, '↺ ', el('span', { text: t('reset_scores') }))));
    var demo = BY_ID.kyc || MSGS[0];
    var right = el('div', null, phone(demo, { id: 'preview-phone' }), el('p', { class: 'preview-cap', text: t('preview_q') }));
    root.appendChild(el('div', { class: 'card hero' }, left, right));
  }

  function resetScores() {
    if (!confirm(t('confirm_reset'))) return;
    ['best', 'bestStreak', 'played', 'game'].forEach(function (k) { store.remove(k); });
    game = null; lastGame = null;
    EDU.toast(t('scores_cleared'));
    renderStart();
  }

  function renderGame() {
    var root = $('#play-game');
    if (!game) { view = 'start'; return renderPlay(); }
    root.innerHTML = '';
    var m = BY_ID[game.ids[game.idx]], c = C(m.id), total = game.ids.length;
    var answeredCount = game.answers.filter(Boolean).length;
    root.appendChild(el('div', { class: 'topbar' },
      el('strong', { id: 'q-of', text: t('q_of', { i: n(game.idx + 1), n: n(total) }) }),
      el('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': String(answeredCount), 'aria-label': t('q_of', { i: n(game.idx + 1), n: n(total) }) },
        el('span', { style: { width: (100 * answeredCount / total) + '%' } })),
      el('span', { class: 'pill' }, '⭐ ', el('span', { text: t('score') }), el('b', { id: 'score', text: n(scoreOf(game)) })),
      el('span', { class: 'pill' }, '🔥 ', el('span', { text: t('streak') }), el('b', { id: 'streak', text: n(game.streak) }))));

    var left = el('div', null,
      c.ctx ? el('p', { class: 'ctx' }, el('span', { class: 'badge primary', text: t('situation') }), el('span', { text: c.ctx })) : null,
      phone(m, { revealed: game.revealed, id: 'phone' }),
      el('div', { class: 'row', style: { marginTop: '10px', justifyContent: 'center' } }, readAloudBtn(m)));

    var side = el('div', { class: 'stack', 'aria-live': 'polite', id: 'side' });
    if (!game.revealed) {
      side.appendChild(el('h2', { class: 'mb0', text: t('ask') }));
      side.appendChild(el('div', { class: 'answers' },
        el('button', { type: 'button', class: 'btn ans ans-safe', id: 'ans-safe', onclick: function () { answer('safe'); } },
          el('span', { class: 'ic', 'aria-hidden': 'true', text: '✅' }), el('span', { text: t('btn_safe') })),
        el('button', { type: 'button', class: 'btn ans ans-scam', id: 'ans-scam', onclick: function () { answer('scam'); } },
          el('span', { class: 'ic', 'aria-hidden': 'true', text: '🚩' }), el('span', { text: t('btn_scam') }))));
      side.appendChild(el('p', { class: 'tiny muted mb0', text: '⌨️ ' + t('keys_hint') }));
    } else {
      var mine = game.answers[game.idx], right = (mine === 'scam') === m.scam;
      var msg = right ? t('you_right') : (m.scam ? t('wrong_was_scam') : t('wrong_was_safe'));
      side.appendChild(el('div', { class: 'callout ' + (right ? 'success ok' : 'danger bad'), id: 'verdict', 'data-right': right ? '1' : '0' },
        el('strong', { text: (right ? '🎉 ' : '😮 ') + msg }),
        el('p', { class: 'verdict-big', text: m.scam ? '🚩 ' + t('verdict_scam') : '✅ ' + t('verdict_safe') })));
      side.appendChild(revealInfo(m));
      var last = game.idx >= total - 1;
      side.appendChild(el('div', { class: 'row' },
        el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'next', onclick: next }, el('span', { text: last ? t('see_results') : t('next_msg') }), el('span', { class: 'arr', 'aria-hidden': 'true', text: '➜' }))));
    }
    root.appendChild(el('div', { class: 'game' }, left, side));
  }

  function answer(choice) {
    if (!game || game.revealed) return;
    var m = BY_ID[game.ids[game.idx]];
    game.answers[game.idx] = choice;
    var right = (choice === 'scam') === m.scam;
    game.streak = right ? game.streak + 1 : 0;
    game.bestStreak = Math.max(game.bestStreak, game.streak);
    game.revealed = true;
    saveGame();
    renderGame();
    var nb = $('#next');
    if (nb) nb.focus({ preventScroll: true });
    var v = $('#verdict');
    if (v && window.innerWidth < 900) v.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function next() {
    if (!game || !game.revealed) return;
    if (game.idx < game.ids.length - 1) {
      game.idx++; game.revealed = false; saveGame(); renderGame(); scrollToTop('#play-game');
      var b = $('#ans-safe'); if (b) b.focus({ preventScroll: true });
      return;
    }
    finish();
  }

  function finish() {
    var s = scoreOf(game), total = game.ids.length;
    var best = store.get('best', null);
    if (!best || s / total > best.score / best.n || (s / total === best.score / best.n && total > best.n)) store.set('best', { score: s, n: total });
    store.set('bestStreak', Math.max(store.get('bestStreak', 0), game.bestStreak));
    store.set('played', store.get('played', 0) + 1);
    lastGame = game; game = null; saveGame();
    view = 'results';
    renderPlay();
    scrollToTop('#play-results');
  }

  function answerLabel(a) { return a === 'scam' ? '🚩 ' + t('btn_scam') : '✅ ' + t('btn_safe'); }

  function renderResults() {
    var root = $('#play-results');
    root.innerHTML = '';
    if (!lastGame) { view = 'start'; return renderPlay(); }
    var g = lastGame, s = scoreOf(g), total = g.ids.length, pct = s / total;
    var remark = pct >= 0.9 ? t('res_great') : pct >= 0.6 ? t('res_good') : t('res_low');
    root.appendChild(el('div', { class: 'card stack center', 'aria-live': 'polite' },
      el('h2', { class: 'mb0', text: t('results_title') }),
      el('div', { class: 'big-number', id: 'final-score', dir: 'ltr', text: n(s) + '/' + n(total) }),
      el('p', { class: 'mb0', text: t('results_line', { score: n(s), n: n(total) }) }),
      el('p', { class: 'mb0' }, el('strong', { text: remark })),
      el('p', { class: 'muted mb0', text: '🔥 ' + t('stat_streak') + ': ' + n(g.bestStreak) }),
      el('div', { class: 'row no-print', style: { justifyContent: 'center' } },
        el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'play-again', onclick: newGame }, '↻ ', el('span', { text: t('play_again') })),
        el('button', { type: 'button', class: 'btn btn-lg', onclick: function () { showTab('rules'); } }, '🛡️ ', el('span', { text: t('tab_rules') })),
        el('button', { type: 'button', class: 'btn btn-lg', onclick: function () { window.print(); } }, '🖨️ ', el('span', { text: t('print') })))));
    var ul = el('ul', { class: 'review', id: 'review' });
    g.ids.forEach(function (id, i) {
      var m = BY_ID[id], c = C(id), a = g.answers[i], right = (a === 'scam') === m.scam;
      ul.appendChild(el('li', { class: 'review-row ' + (right ? 'good' : 'badr') },
        el('span', { class: 'mark', 'aria-label': right ? t('correct') : t('wrong'), text: right ? '✔️' : '❌' }),
        el('div', { style: { minWidth: '0' } },
          el('div', { class: 'who' }, (CH_ICON[m.ch] || '') + ' ', c.who ? el('span', { text: c.who }) : el('bdi', { class: 'no-i18n', dir: 'ltr', text: m.from })),
          el('div', { class: 'snip no-i18n', text: plain(c.text) }),
          el('div', { class: 'tags' },
            el('span', { class: 'badge', text: t('you_said') + ': ' + answerLabel(a) }),
            el('span', { class: 'badge ' + (m.scam ? 'danger' : 'success'), text: t('answer') + ': ' + answerLabel(m.scam ? 'scam' : 'safe') }))),
        el('button', { type: 'button', class: 'btn btn-sm no-print', onclick: function () { openReview(m); } }, '🔍 ', el('span', { text: t('see_again') }))));
    });
    root.appendChild(el('div', { class: 'card stack', style: { marginTop: '16px' } }, el('h3', { class: 'mb0', text: t('review_title') }), ul));
  }

  function openReview(m) {
    var box = el('div', { class: 'stack' }, phone(m, { revealed: true }), el('p', { class: 'verdict-big', text: m.scam ? '🚩 ' + t('verdict_scam') : '✅ ' + t('verdict_safe') }), revealInfo(m));
    EDU.modal(box, { title: t('see_again') });
  }

  /* ---------------- class mode ---------------- */
  var cls = null;   // {ids, idx, votes:[{safe,scam}], revealed, results:[]}
  function classStart() {
    cls = { ids: EDU.shuffle(MSGS).map(function (m) { return m.id; }), idx: 0, votes: { safe: 0, scam: 0 }, revealed: false, results: [] };
    renderClass();
  }
  function renderClass() {
    var root = $('#panel-class');
    root.innerHTML = '';
    root.classList.toggle('present', !!cls);
    if (!cls || cls.done) {
      var card = el('div', { class: 'card stack' });
      if (cls && cls.done) {
        var sc = cls.results.filter(function (r) { return r === 1; }).length;
        card.appendChild(el('h2', { class: 'mb0', text: '🏁 ' + t('class_done') }));
        card.appendChild(el('div', { class: 'big-number', id: 'class-final', dir: 'ltr', text: n(sc) + '/' + n(cls.ids.length) }));
        card.appendChild(el('p', { text: t('class_summary', { score: n(sc), n: n(cls.ids.length) }) }));
      } else {
        card.appendChild(el('h2', { class: 'mb0', text: '🏫 ' + t('class_title') }));
        card.appendChild(el('p', { class: 'mb0', text: t('class_desc') }));
        card.appendChild(el('p', { class: 'mb0 muted', text: t('class_desc2', { n: n(MSGS.length) }) }));
      }
      card.appendChild(el('div', { class: 'row' },
        el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'class-start', onclick: classStart }, '▶ ', el('span', { text: cls ? t('class_restart') : t('class_start') }))));
      root.appendChild(card);
      return;
    }
    var m = BY_ID[cls.ids[cls.idx]], c = C(m.id), total = cls.ids.length;
    var sc2 = cls.results.filter(function (r) { return r === 1; }).length;
    root.appendChild(el('div', { class: 'topbar' },
      el('strong', { text: t('q_of', { i: n(cls.idx + 1), n: n(total) }) }),
      el('div', { class: 'progress', 'aria-hidden': 'true' }, el('span', { style: { width: (100 * cls.results.length / total) + '%' } })),
      el('span', { class: 'pill' }, '⭐ ', el('span', { text: t('score') }), el('b', { id: 'class-score', text: n(sc2) })),
      readAloudBtn(m),
      el('button', { type: 'button', class: 'btn btn-sm', onclick: function () { EDU.fullscreen($('#panel-class')); } }, '⛶ ', el('span', { text: t('fullscreen') }))));

    var left = el('div', null,
      c.ctx ? el('p', { class: 'ctx' }, el('span', { class: 'badge primary', text: t('situation') }), el('span', { text: c.ctx })) : null,
      phone(m, { revealed: cls.revealed, big: true, id: 'class-phone' }));
    var side = el('div', { class: 'stack', 'aria-live': 'polite' });
    side.appendChild(el('h2', { class: 'mb0', text: t('ask') }));
    side.appendChild(el('div', { class: 'votes' }, voteBox('safe'), voteBox('scam')));
    if (!cls.revealed) {
      side.appendChild(el('button', { type: 'button', class: 'btn btn-accent btn-lg w100', id: 'reveal', onclick: classReveal }, '👀 ', el('span', { text: t('reveal') })));
    } else {
      var v = cls.votes, tot = v.safe + v.scam;
      var pS = tot ? Math.round(100 * v.safe / tot) : 0, pX = tot ? 100 - pS : 0;
      side.appendChild(el('div', { class: 'bars' },
        el('div', { class: 'bar-row' }, el('span', { text: '✅ ' + t('btn_safe') }), el('div', { class: 'bar safe' }, el('span', { style: { width: pS + '%' } })), el('span', { id: 'bar-safe', dir: 'ltr', text: n(pS) + '%' })),
        el('div', { class: 'bar-row' }, el('span', { text: '🚩 ' + t('btn_scam') }), el('div', { class: 'bar scam' }, el('span', { style: { width: pX + '%' } })), el('span', { id: 'bar-scam', dir: 'ltr', text: n(pX) + '%' }))));
      var res = cls.results[cls.idx], vtxt = res === 1 ? t('class_right') : res === 0 ? t('class_wrong') : tot ? t('class_tie') : t('class_novote');
      side.appendChild(el('div', { class: 'callout ' + (res === 1 ? 'success' : res === 0 ? 'danger' : 'warning'), id: 'class-verdict', 'data-res': String(res) },
        el('strong', { text: vtxt }),
        el('p', { class: 'verdict-big', text: m.scam ? '🚩 ' + t('verdict_scam') : '✅ ' + t('verdict_safe') })));
      side.appendChild(revealInfo(m));
      var last = cls.idx >= total - 1;
      side.appendChild(el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'class-next', onclick: classNext }, el('span', { text: last ? t('see_results') : t('next_msg') }), el('span', { class: 'arr', 'aria-hidden': 'true', text: '➜' })));
    }
    root.appendChild(el('div', { class: 'game big' }, left, side));
  }

  function voteBox(kind) {
    var input = el('input', { type: 'number', min: '0', max: '999', inputmode: 'numeric', id: 'v-' + kind, value: String(cls.votes[kind]), disabled: cls.revealed });
    function set(v) { cls.votes[kind] = EDU.clamp(isFinite(v) ? Math.round(v) : 0, 0, 999); input.value = String(cls.votes[kind]); }
    input.addEventListener('input', function () { var v = parseInt(input.value, 10); cls.votes[kind] = EDU.clamp(isNaN(v) ? 0 : v, 0, 999); });
    input.addEventListener('change', function () { set(parseInt(input.value, 10)); });
    return el('div', { class: 'vote-box ' + kind },
      el('label', { for: 'v-' + kind, text: (kind === 'safe' ? '✅ ' : '🚩 ') + t(kind === 'safe' ? 'votes_safe' : 'votes_scam') }),
      el('div', { class: 'vote-ctrl' },
        el('button', { type: 'button', class: 'btn', id: 'v-' + kind + '-minus', 'aria-label': t('remove_vote'), disabled: cls.revealed, text: '−', onclick: function () { set(cls.votes[kind] - 1); } }),
        input,
        el('button', { type: 'button', class: 'btn', id: 'v-' + kind + '-plus', 'aria-label': t('add_vote'), disabled: cls.revealed, text: '+', onclick: function () { set(cls.votes[kind] + 1); } })));
  }

  function classReveal() {
    var m = BY_ID[cls.ids[cls.idx]], v = cls.votes;
    var res = v.scam === v.safe ? -1 : ((v.scam > v.safe) === m.scam ? 1 : 0);
    cls.results[cls.idx] = res;
    cls.revealed = true;
    renderClass();
  }
  function classNext() {
    if (cls.idx >= cls.ids.length - 1) { cls.done = true; renderClass(); return; }
    cls.idx++; cls.revealed = false; cls.votes = { safe: 0, scam: 0 };
    renderClass();
    scrollToTop('#panel-class');
  }

  /* ---------------- misc ---------------- */
  $('#print-poster').addEventListener('click', function () { window.print(); });

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var tg = e.target && e.target.tagName;
    if (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT') return;
    if (document.querySelector('.edu-modal-back')) return;
    if (activeTab !== 'play' || view !== 'game' || !game) return;
    if (!game.revealed && (e.key === '1' || e.key === '2')) { e.preventDefault(); answer(e.key === '1' ? 'safe' : 'scam'); }
    else if (game.revealed && (e.key === 'Enter' || e.key === 'ArrowRight' || e.key === 'ArrowLeft') && tg !== 'BUTTON') { e.preventDefault(); next(); }
  });

  function renderAll() {
    if (activeTab === 'play') renderPlay();
    else if (activeTab === 'class') renderClass();
  }
  EDU.onLang(renderAll);
  showTab(activeTab);
})();
