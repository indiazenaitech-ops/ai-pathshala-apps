/* India GK Quiz Game: solo ladder, Quick 10, family / class teams and practice by topic.
   Questions live in content.js (APP_CONTENT[lang][cat][i] = [q, correct, wrong1, wrong2, wrong3, explanation])
   with GK_META.levels[cat] = '1112..' (difficulty per question). Everything runs on the device. */
(function () {
  'use strict';
  var SLUG = 'gk-quiz-game';
  var store = EDU.store(SLUG);
  var META = window.GK_META || { cats: [], levels: {} };
  var CATS = META.cats;
  var LADDER = [10, 20, 30, 40, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500, 1000];
  var SAFE = [4, 9];                        // question 5 and question 10 are safe levels
  var LETTERS = ['A', 'B', 'C', 'D'];
  var TEAM_COLORS = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6'];
  var TIMERS = [0, 15, 30, 45];
  var NQS = [10, 20, 30];

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'wa_game' });
  var t = EDU.t, $ = EDU.$, el = EDU.el, fmt = function (n) { return EDU.fmt(n); };

  /* ------------------------------------------------------------ settings + state */
  var S = Object.assign({
    mode: 'solo', cat: 'all', level: 0, timer: 0, nq: 10, teams: 2, names: ['', '', '', '', '', ''],
    style: 'turns', minus: false, autoRead: false, sound: false
  }, store.get('settings', {}));
  if (!Array.isArray(S.names) || S.names.length < 6) S.names = ['', '', '', '', '', ''];
  var best = Object.assign({ solo: 0, quick: {} }, store.get('best', {}));
  var seen = store.get('seen', {});           // { cat: [index, ...] } shown questions, cleared per topic when used up
  var session = store.get('session', null);   // the game in progress (survives a reload)
  if (session && (session.done || !session.items || !session.items.length)) session = null;
  var view = 'setup';
  var override = null;                        // test hook: fixed questions for the next game
  var timerId = null;

  function saveSettings() { store.set('settings', S); }
  function saveSession() { store.set('session', session && !session.done ? session : null); }

  /* ------------------------------------------------------------ question access */
  function content() { var c = window.APP_CONTENT || {}; return c[EDU.lang] || c.en || {}; }
  function levelOf(c, i) { return +((META.levels[c] || '')[i] || 1); }
  /* item: { c, i } (bank) or { x } (custom, test hook) + p = display permutation */
  function base(item) {
    if (item.x !== undefined) {
      var q = session.custom[item.x];
      return { q: q.q, opts: q.options.slice(0, 4), ans: q.answer, e: q.expl || '', cat: '', level: q.level || 1 };
    }
    var row = (content()[item.c] || [])[item.i] || ((window.APP_CONTENT.en[item.c] || [])[item.i]) || ['', '', '', '', '', ''];
    return { q: row[0], opts: [row[1], row[2], row[3], row[4]], ans: 0, e: row[5], cat: item.c, level: levelOf(item.c, item.i) };
  }
  function shown(item) {        // options in display order + display index of the right one
    var b = base(item);
    return { q: b.q, e: b.e, cat: b.cat, level: b.level, opts: item.p.map(function (k) { return b.opts[k]; }), right: item.p.indexOf(b.ans), b: b };
  }

  /* ------------------------------------------------------------ picking (no repeats until a topic is used up) */
  function catsFor(cat) { return cat === 'all' ? CATS.slice() : [cat]; }
  function unseenIn(c, level) {
    var s = seen[c] || [], n = (META.levels[c] || '').length, out = [];
    for (var i = 0; i < n; i++) if ((!level || levelOf(c, i) === level) && s.indexOf(i) < 0) out.push(i);
    return out;
  }
  function allIn(c, level) {
    var n = (META.levels[c] || '').length, out = [];
    for (var i = 0; i < n; i++) if (!level || levelOf(c, i) === level) out.push(i);
    return out;
  }
  /* Pick n questions (refs) from the given topics and level, preferring unseen ones and mixing topics. */
  function pick(cats, level, n, exclude) {
    exclude = exclude || [];
    var key = function (r) { return r.c + ':' + r.i; };
    var ex = {}; exclude.forEach(function (r) { ex[key(r)] = 1; });
    var fresh = [], old = [];
    cats.forEach(function (c) {
      var u = unseenIn(c, level);
      if (!u.length && allIn(c, level).length) {        // this part of the topic is used up: start it again
        var lv = allIn(c, level);
        seen[c] = (seen[c] || []).filter(function (i) { return lv.indexOf(i) < 0; });
        u = lv;
      }
      allIn(c, level).forEach(function (i) {
        var r = { c: c, i: i }; if (ex[key(r)]) return;
        (u.indexOf(i) >= 0 ? fresh : old).push(r);
      });
    });
    var out = spread(EDU.shuffle(fresh)).concat(EDU.shuffle(old)).slice(0, n);
    return out;
  }
  function spread(list) {       // avoid two questions of the same topic in a row where possible
    var out = [], rest = list.slice();
    while (rest.length) {
      var prev = out.length ? out[out.length - 1].c : null, k = 0;
      while (k < rest.length && rest[k].c === prev) k++;
      if (k >= rest.length) k = 0;
      out.push(rest.splice(k, 1)[0]);
    }
    return out;
  }
  /* For the ladder: 5 easy, 5 medium, 5 hard (falls back to other levels if a topic has too few). */
  function pickLadder(cat) {
    var cats = catsFor(cat), got = [];
    [1, 2, 3].forEach(function (lv) {
      var part = pick(cats, lv, 5, got);
      if (part.length < 5) part = part.concat(pick(cats, 0, 5 - part.length, got.concat(part)));
      got = got.concat(part);
    });
    return got.slice(0, 15);
  }
  function markSeen(item) {
    if (item.x !== undefined) return;
    var s = seen[item.c] = seen[item.c] || [];
    if (s.indexOf(item.i) < 0) { s.push(item.i); store.set('seen', seen); }
  }
  function newItem(ref) { var p = [0, 1, 2, 3]; return { c: ref.c, i: ref.i, x: ref.x, p: ref.x !== undefined ? p : EDU.shuffle(p) }; }

  /* ------------------------------------------------------------ setup UI */
  function teamName(i) { var n = (session && session.teams ? session.teams[i].name : S.names[i]) || ''; return n.trim() || t('team_default', { n: i + 1 }); }
  function catName(c) { return c ? t('cat_' + c) : t('cat_custom'); }
  function modeName(m) { return t('m_' + m); }

  function renderSetup() {
    EDU.$$('.mode').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === S.mode)); });
    var sel = $('#selCat'), cur = S.cat;
    sel.innerHTML = '';
    sel.appendChild(el('option', { value: 'all', text: t('cat_all') }));
    CATS.forEach(function (c) { sel.appendChild(el('option', { value: c, text: t('cat_' + c) + ' (' + fmt(allIn(c).length) + ')' })); });
    sel.value = CATS.indexOf(cur) >= 0 ? cur : 'all';
    $('#selLevel').value = String(S.level);
    $('#fLevel').hidden = S.mode === 'solo';
    $('#fTimer').hidden = S.mode !== 'quick';
    $('#fNq').hidden = S.mode !== 'teams';
    $('#soloNote').hidden = S.mode !== 'solo';
    $('#teamSetup').hidden = S.mode !== 'teams';
    var st = $('#segTimer'); st.innerHTML = '';
    TIMERS.forEach(function (s) {
      st.appendChild(el('button', { class: 'btn', 'aria-pressed': String(S.timer === s), text: s ? t('tm_s', { n: fmt(s) }) : t('tm_off'),
        onclick: function () { S.timer = s; saveSettings(); renderSetup(); } }));
    });
    var sq = $('#segNq'); sq.innerHTML = '';
    NQS.forEach(function (n) {
      sq.appendChild(el('button', { class: 'btn', 'aria-pressed': String(S.nq === n), text: fmt(n), onclick: function () { S.nq = n; saveSettings(); renderSetup(); } }));
    });
    var stn = $('#segTeams'); stn.innerHTML = '';
    [2, 3, 4, 5, 6].forEach(function (n) {
      stn.appendChild(el('button', { class: 'btn', id: 'teams' + n, 'aria-pressed': String(S.teams === n), text: fmt(n), onclick: function () { S.teams = n; saveSettings(); renderSetup(); } }));
    });
    $('#styleTurns').setAttribute('aria-pressed', String(S.style === 'turns'));
    $('#styleBuzz').setAttribute('aria-pressed', String(S.style === 'buzz'));
    $('#styleNote').textContent = t(S.style === 'buzz' ? 'st_buzz_d' : 'st_turns_d');
    $('#fMinus').hidden = S.style !== 'buzz';
    $('#chkMinus').checked = !!S.minus;
    var ti = $('#teamInputs');
    if (ti.children.length !== S.teams) {
      ti.innerHTML = '';
      for (var i = 0; i < S.teams; i++) (function (i) {
        var inp = el('input', { type: 'text', id: 'teamName' + i, maxlength: '24', class: 'no-i18n', value: S.names[i] || '' });
        inp.addEventListener('input', function () { S.names[i] = inp.value; saveSettings(); });
        ti.appendChild(el('div', { class: 'field' }, el('label', { for: 'teamName' + i, id: 'lblTeam' + i }), inp));
      })(i);
    }
    for (var j = 0; j < S.teams; j++) {
      $('#lblTeam' + j).textContent = t('l_team_name', { n: j + 1 });
      $('#teamName' + j).placeholder = t('team_default', { n: j + 1 });
    }
    $('#chkRead').checked = !!S.autoRead;
    $('#chkSound').checked = !!S.sound;
    // best scores
    var bl = $('#bestList'); bl.innerHTML = '';
    var any = false;
    if (best.solo) { any = true; bl.appendChild(el('li', { text: t('best_solo', { n: fmt(best.solo) }) })); }
    Object.keys(best.quick).forEach(function (c) {
      if (c !== 'all' && CATS.indexOf(c) < 0) return;
      any = true; bl.appendChild(el('li', { text: t('best_quick', { cat: c === 'all' ? t('cat_all') : t('cat_' + c), n: fmt(best.quick[c]) }) }));
    });
    if (!any) bl.appendChild(el('li', { text: t('best_none') }));
    // resume box
    var rb = $('#resumeBox');
    rb.hidden = !session;
    if (session) $('#resumeNote').textContent = t('resume_note', { mode: modeName(session.mode), n: fmt(session.idx + 1) });
  }

  EDU.$$('.mode').forEach(function (b) { b.addEventListener('click', function () { S.mode = b.dataset.mode; saveSettings(); renderSetup(); }); });
  $('#selCat').addEventListener('change', function (e) { S.cat = e.target.value; saveSettings(); });
  $('#selLevel').addEventListener('change', function (e) { S.level = +e.target.value; saveSettings(); });
  $('#styleTurns').addEventListener('click', function () { S.style = 'turns'; saveSettings(); renderSetup(); });
  $('#styleBuzz').addEventListener('click', function () { S.style = 'buzz'; saveSettings(); renderSetup(); });
  $('#chkMinus').addEventListener('change', function (e) { S.minus = e.target.checked; saveSettings(); });
  $('#chkRead').addEventListener('change', function (e) { S.autoRead = e.target.checked; saveSettings(); });
  $('#chkSound').addEventListener('change', function (e) { S.sound = e.target.checked; saveSettings(); if (S.sound) beep(true); });
  $('#bStart').addEventListener('click', function () { startGame(); });
  $('#bResume').addEventListener('click', function () { if (session) { show('game'); enterQuestion(false); } });
  $('#bDiscard').addEventListener('click', function () { session = null; saveSession(); renderSetup(); });
  $('#bResetAll').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    best = { solo: 0, quick: {} }; seen = {}; session = null;
    store.set('best', best); store.set('seen', seen); saveSession();
    renderSetup(); EDU.toast(t('reset_done'));
  });

  /* ------------------------------------------------------------ start a game */
  function startGame() {
    stopTimer();
    var m = S.mode, cat = S.cat, refs;
    var custom = override ? override.slice() : null;
    var count = m === 'solo' ? 15 : m === 'quick' ? 10 : m === 'teams' ? S.nq : 0;
    if (custom) {
      var n = count || custom.length; refs = [];
      for (var k = 0; k < n; k++) refs.push({ x: k % custom.length });
    } else if (m === 'solo') refs = pickLadder(cat);
    else if (m === 'practice') { refs = pick(catsFor(cat), S.level, 1000); if (!refs.length) refs = pick(catsFor(cat), 0, 1000); }
    else {
      refs = pick(catsFor(cat), S.level, count);
      if (refs.length < count) refs = refs.concat(pick(catsFor(cat), 0, count - refs.length, refs));
    }
    if (!refs.length) { EDU.toast(t('no_questions')); return; }
    session = {
      mode: m, cat: custom ? '' : cat, level: m === 'solo' ? 0 : S.level, timer: m === 'quick' ? S.timer : 0,
      custom: custom, items: refs.map(newItem), idx: 0, points: 0, correct: 0,
      helpers: { f: false, s: false, a: false }, hidden: [], votes: [0, 0, 0, 0],
      teams: m === 'teams' ? S.names.slice(0, S.teams).map(function (nm) { return { name: nm || '', score: 0 }; }) : null,
      style: S.style, minus: !!S.minus, turn: 0, buzzed: null, locked: [], wrongPicks: [],
      answered: false, done: false, end: '', deadline: 0
    };
    show('game');
    enterQuestion(true);
  }

  function show(v) {
    view = v;
    $('#setup').hidden = v !== 'setup';
    $('#game').hidden = v !== 'game';
    $('#results').hidden = v !== 'results';
    if (v !== 'game') { stopTimer(); EDU.stopSpeaking(); }
    if (v === 'setup') renderSetup();
    var target = $('#' + v);
    if (target && target.scrollIntoView && v !== 'setup') target.scrollIntoView({ block: 'start', behavior: 'auto' });
  }

  /* called when a question appears (fresh = new question, not a resume / language change) */
  function enterQuestion(fresh) {
    var it = session.items[session.idx];
    markSeen(it);
    if (fresh) {
      session.hidden = []; session.votes = [0, 0, 0, 0]; session.buzzed = null; session.locked = []; session.wrongPicks = [];
      session.answered = false;
      if (session.timer) session.deadline = Date.now() + session.timer * 1000;
    } else if (session.timer && !session.answered) {
      session.deadline = Date.now() + session.timer * 1000;      // a resumed question gets its full time again
    }
    saveSession();
    renderGame();
    if (session.timer && !session.answered) startTimer();
    var q = $('#qText'); if (q && q.focus) q.focus({ preventScroll: true });
    if (S.autoRead && !session.answered) readAloud(true);
  }

  /* ------------------------------------------------------------ game UI */
  function renderGame() {
    if (!session) return;
    var it = session.items[session.idx], sh = shown(it), m = session.mode;
    $('#gMode').textContent = modeName(m);
    $('#gCat').textContent = sh.cat ? catName(sh.cat) : (session.cat && session.cat !== 'all' ? catName(session.cat) : t('cat_all'));
    $('#gLevel').textContent = t('lv_' + sh.level);
    $('#gProg').textContent = t('q_of', { n: fmt(session.idx + 1), total: fmt(session.items.length) });
    var sc = $('#gScore');
    if (m === 'solo') sc.textContent = t('pts', { n: fmt(session.points) });
    else if (m === 'teams') sc.hidden = true;
    else sc.textContent = t('score_n', { n: fmt(session.correct), total: fmt(session.idx + (session.answered ? 1 : 0)) });
    if (m !== 'teams') sc.hidden = false;
    $('#gTimer').hidden = !session.timer;
    updateTimer();

    // ladder + helpers (solo)
    var solo = m === 'solo';
    $('#ladder').hidden = !solo;
    $('#gBody').classList.toggle('with-ladder', solo);
    $('#helpers').hidden = !solo;
    if (solo) {
      var ol = $('#ladderList'); ol.innerHTML = '';
      LADDER.forEach(function (p, i) {
        var cls = (SAFE.indexOf(i) >= 0 ? 'safe ' : '') + (i < session.idx || (i === session.idx && session.answered && session.end !== 'lost') ? 'done ' : '') + (i === session.idx ? 'now' : '');
        ol.appendChild(el('li', { class: cls.trim(), 'aria-current': i === session.idx ? 'step' : null },
          el('span', { class: 'lad-n num', text: fmt(i + 1) }), el('span', { class: 'lad-pts', text: fmt(p) })));
      });
      var lock = session.answered;
      $('#h5050').disabled = session.helpers.f || lock;
      $('#hSkip').disabled = session.helpers.s || lock;
      $('#hFamily').disabled = session.helpers.a || lock;
      ['#h5050', '#hSkip', '#hFamily'].forEach(function (s, k) {
        var used = [session.helpers.f, session.helpers.s, session.helpers.a][k];
        $(s).setAttribute('aria-label', t(['help_5050', 'help_skip', 'help_family'][k]) + (used ? ' (' + t('help_used') + ')' : ''));
      });
      $('#bStop').textContent = t('b_stop', { n: fmt(session.points) });
      $('#bStop').disabled = lock;
    }

    // teams
    var teams = m === 'teams';
    $('#teamBoard').hidden = !teams;
    $('#buzz').hidden = !(teams && session.style === 'buzz' && !session.answered);
    $('#turnNote').hidden = !teams;
    if (teams) {
      var tb = $('#teamBoard'); tb.innerHTML = '';
      var active = session.style === 'buzz' ? session.buzzed : session.turn;
      session.teams.forEach(function (tm, i) {
        tb.appendChild(el('div', { class: 'team-card' + (i === active && !session.answered ? ' turn' : '') + (session.locked.indexOf(i) >= 0 ? ' out' : ''), id: 'team' + i },
          el('span', { class: 'tn' }, el('span', { class: 'dot', style: { background: 'var(' + TEAM_COLORS[i] + ')' } }), el('span', { class: 'no-i18n', text: teamName(i) })),
          el('span', { class: 'ts', text: fmt(tm.score) })));
      });
      var br = $('#buzzRow'); br.innerHTML = '';
      session.teams.forEach(function (tm, i) {
        var out = session.locked.indexOf(i) >= 0;
        br.appendChild(el('button', { class: 'btn', id: 'buzz' + i, 'aria-pressed': String(session.buzzed === i), disabled: out ? '' : null,
          style: { borderInlineStart: '6px solid var(' + TEAM_COLORS[i] + ')' }, onclick: function () { buzz(i); } },
          el('span', { class: 'no-i18n', text: teamName(i) })));
      });
      br.appendChild(el('button', { class: 'btn btn-ghost', id: 'buzzNone', text: t('buzz_none'), onclick: function () { reveal(); } }));
      var note = $('#turnNote');
      if (session.answered) note.textContent = '';
      else if (session.style === 'buzz') note.textContent = session.buzzed === null ? t('buzz_wait') : t('turn_of', { team: teamName(session.buzzed) });
      else note.textContent = t('turn_of', { team: teamName(session.turn) });
      note.hidden = !note.textContent;
    }

    // question + options
    $('#qText').textContent = sh.q;
    var box = $('#opts'); box.innerHTML = '';
    var needBuzz = teams && session.style === 'buzz' && session.buzzed === null;
    sh.opts.forEach(function (o, i) {
      var cls = 'opt';
      var gone = session.hidden.indexOf(i) >= 0;
      if (gone) cls += ' gone';
      var mark = '';
      if (session.answered) {
        if (i === sh.right) { cls += ' is-right'; mark = '✓'; }
        else if (i === it.pick) { cls += ' is-wrong'; mark = '✗'; }
        else cls += ' dim';
      } else if (session.wrongPicks.indexOf(i) >= 0) { cls += ' is-wrong'; mark = '✗'; }
      var b = el('button', { class: cls, id: 'opt' + i, 'data-pos': String(i), disabled: (session.answered || gone || needBuzz || session.wrongPicks.indexOf(i) >= 0) ? '' : null,
        'aria-label': LETTERS[i] + '. ' + o, onclick: function () { choose(i); } },
        el('span', { class: 'lt l' + i, 'aria-hidden': 'true', text: LETTERS[i] }), el('span', { class: 'ot', text: o }), el('span', { class: 'mk', 'aria-hidden': 'true', text: mark }));
      box.appendChild(b);
    });

    renderFeedback(sh);
    var nb = $('#bNext');
    nb.hidden = !session.answered;
    nb.textContent = session.done || session.idx >= session.items.length - 1 ? t('b_finish') : t('b_next');
    $('#bEnd').textContent = m === 'solo' ? t('b_end') : t('b_finish_now');
  }

  function renderFeedback(sh) {
    var fb = $('#fb'); fb.innerHTML = ''; fb.className = 'fb';
    var it = session.items[session.idx];
    if (!session.answered) {
      if (session.mode === 'teams' && session.lastMsg) { fb.appendChild(el('p', { class: 'fb-h', text: session.lastMsg })); }
      return;
    }
    var ok = it.res === 'right';
    fb.classList.add(ok ? 'ok' : 'bad');
    var head;
    if (ok) head = t('fb_right');
    else if (it.res === 'time') head = t('fb_time', { a: sh.opts[sh.right] });
    else head = t('fb_wrong', { a: sh.opts[sh.right] });
    if (session.mode === 'teams' && it.team !== undefined && it.team !== null) {
      if (ok) head = t('fb_team_right', { team: teamName(it.team), n: fmt(10) });
    }
    fb.appendChild(el('p', { class: 'fb-h', text: head }));
    if (sh.e) fb.appendChild(el('p', { class: 'fb-e', text: sh.e }));
    if (session.mode === 'solo' && session.done) {
      fb.appendChild(el('p', { class: 'fb-e', text: session.end === 'won' ? t('solo_won') : t('solo_lost', { n: fmt(session.idx + 1), p: fmt(session.points) }) }));
    }
  }

  /* ------------------------------------------------------------ answering */
  function choose(pos) {
    if (!session || view !== 'game' || session.answered) return;
    var it = session.items[session.idx], sh = shown(it), m = session.mode;
    if (session.hidden.indexOf(pos) >= 0 || session.wrongPicks.indexOf(pos) >= 0) return;
    if (m === 'teams' && session.style === 'buzz' && session.buzzed === null) { EDU.toast(t('buzz_first')); return; }
    var right = pos === sh.right;
    session.lastMsg = '';
    if (m === 'teams') {
      var ti = session.style === 'buzz' ? session.buzzed : session.turn;
      if (right) {
        session.teams[ti].score += 10;
        it.team = ti;
      } else if (session.style === 'buzz') {
        if (session.minus) session.teams[ti].score -= 5;
        session.locked.push(ti);
        session.wrongPicks.push(pos);
        session.buzzed = null;
        beep(false);
        if (session.locked.length < session.teams.length && session.wrongPicks.length < 3) {
          session.lastMsg = (session.minus ? t('fb_team_minus', { team: teamName(ti), n: fmt(5) }) : t('fb_team_wrong', { team: teamName(ti) })) + ' ' + t('buzz_again');
          saveSession(); renderGame(); return;
        }
      } else it.team = ti;
    }
    stopTimer();
    it.pick = pos; it.res = right ? 'right' : 'wrong';
    session.answered = true;
    if (right) session.correct++;
    if (m === 'solo') {
      if (right) {
        session.points = LADDER[session.idx];
        if (session.idx === LADDER.length - 1 || session.idx >= session.items.length - 1) { session.done = true; session.end = 'won'; }
      } else {
        session.points = safePoints(session.idx);
        session.done = true; session.end = 'lost';
      }
    } else if (m === 'quick') session.points = session.correct * 10;
    beep(right);
    afterAnswer();
  }
  function safePoints(idx) { var p = 0; SAFE.forEach(function (s) { if (s < idx) p = LADDER[s]; }); return p; }
  function timeUp() {
    if (!session || session.answered) return;
    var it = session.items[session.idx];
    it.pick = null; it.res = 'time'; session.answered = true;
    beep(false);
    afterAnswer();
  }
  function reveal() {                         // teams: nobody knows / everyone got it wrong
    if (!session || session.answered) return;
    var it = session.items[session.idx];
    it.pick = null; it.res = 'wrong'; it.team = null; session.answered = true; session.lastMsg = '';
    stopTimer();
    afterAnswer();
  }
  function afterAnswer() {
    if (session.idx >= session.items.length - 1) session.done = session.done || true;
    if (session.done && !session.end) session.end = 'end';
    store.set('session', session.done ? null : session);
    renderGame();
    var nb = $('#bNext'); if (nb && !nb.hidden && nb.focus) nb.focus({ preventScroll: true });
  }
  function next() {
    if (!session || !session.answered) return;
    if (session.done) return finish();
    session.idx++;
    if (session.mode === 'teams' && session.style === 'turns') session.turn = (session.turn + 1) % session.teams.length;
    enterQuestion(true);
  }
  function buzz(i) {
    if (!session || session.answered || session.locked.indexOf(i) >= 0) return;
    session.buzzed = i; session.lastMsg = '';
    saveSession(); renderGame();
    var first = EDU.$$('#opts .opt:not([disabled])')[0]; if (first && first.focus) first.focus({ preventScroll: true });
  }

  /* ------------------------------------------------------------ helpers (solo) */
  function fiftyFifty() {
    if (!session || session.mode !== 'solo' || session.helpers.f || session.answered) return;
    var sh = shown(session.items[session.idx]);
    var wrong = [0, 1, 2, 3].filter(function (i) { return i !== sh.right; });
    session.hidden = EDU.shuffle(wrong).slice(0, 2);
    session.helpers.f = true;
    saveSession(); renderGame(); EDU.toast(t('toast_5050'));
  }
  function skip() {
    if (!session || session.mode !== 'solo' || session.helpers.s || session.answered) return;
    var cur = session.items[session.idx], rep;
    if (cur.x !== undefined) rep = { x: (session.items.length + session.idx) % session.custom.length };
    else {
      var lv = levelOf(cur.c, cur.i);
      rep = pick(catsFor(session.cat || 'all'), lv, 1, session.items)[0] || pick(catsFor('all'), lv, 1, session.items)[0];
    }
    if (!rep) { EDU.toast(t('no_questions')); return; }
    session.helpers.s = true;
    session.items[session.idx] = newItem(rep);
    EDU.toast(t('toast_skip'));
    enterQuestion(true);
  }
  function askFamily() {
    if (!session || session.mode !== 'solo' || session.helpers.a || session.answered) return;
    session.helpers.a = true; saveSession(); renderGame();
    var sh = shown(session.items[session.idx]);
    var wrap = el('div', { class: 'stack' }, el('p', { class: 'muted', text: t('fam_help') }));
    var list = el('div', { class: 'votes', 'aria-live': 'polite' });
    wrap.appendChild(list);
    function draw() {
      list.innerHTML = '';
      var total = session.votes.reduce(function (a, b) { return a + b; }, 0) || 1;
      sh.opts.forEach(function (o, i) {
        if (session.hidden.indexOf(i) >= 0) return;
        var pct = Math.round(session.votes[i] * 100 / total);
        list.appendChild(el('div', { class: 'vote' },
          el('button', { class: 'btn', id: 'vote' + i, 'aria-label': t('fam_vote_for', { l: LETTERS[i] }), text: LETTERS[i], onclick: function () { session.votes[i]++; saveSession(); draw(); } }),
          el('div', {}, el('div', { class: 'vlab', text: o }), el('div', { class: 'bar' }, el('i', { style: { width: pct + '%' } }))),
          el('span', { class: 'vote-n', text: fmt(session.votes[i]) })));
      });
    }
    draw();
    var close;
    wrap.appendChild(el('div', { class: 'row' }, el('button', { class: 'btn btn-primary', id: 'famDone', text: t('fam_done'), onclick: function () { close(); } })));
    close = EDU.modal(wrap, { title: t('fam_title') });
  }
  function stopAndKeep() {
    if (!session || session.mode !== 'solo' || session.answered) return;
    if (!confirm(t('confirm_stop', { n: fmt(session.points) }))) return;
    stopTimer();
    session.done = true; session.end = 'stopped';
    finish();
  }
  $('#h5050').addEventListener('click', fiftyFifty);
  $('#hSkip').addEventListener('click', skip);
  $('#hFamily').addEventListener('click', askFamily);
  $('#bStop').addEventListener('click', stopAndKeep);
  $('#bNext').addEventListener('click', next);
  $('#bRead').addEventListener('click', function () { readAloud(false); });
  $('#bFull').addEventListener('click', function () { EDU.fullscreen($('#game')); });
  $('#bEnd').addEventListener('click', function () {
    if (!session) return;
    if (session.mode === 'solo') return stopAndKeep();
    if (!session.answered && !confirm(t('confirm_end'))) return;
    stopTimer(); session.done = true; session.end = session.end || 'end'; finish();
  });

  /* ------------------------------------------------------------ timer */
  function startTimer() { stopTimer(); timerId = setInterval(updateTimer, 250); updateTimer(); }
  function stopTimer() { if (timerId) clearInterval(timerId); timerId = null; }
  function updateTimer() {
    var tm = $('#gTimer');
    if (!session || !session.timer) { tm.hidden = true; return; }
    if (session.answered) { tm.textContent = '⏱ —'; tm.classList.remove('low'); return; }
    var left = Math.max(0, Math.ceil((session.deadline - Date.now()) / 1000));
    tm.textContent = '⏱ ' + t('tm_left', { n: fmt(left) });
    tm.classList.toggle('low', left <= 5);
    if (left <= 0 && timerId) { stopTimer(); timeUp(); }
  }

  /* ------------------------------------------------------------ results */
  function finish() {
    stopTimer();
    var s = session; if (!s) return;
    s.done = true;
    store.set('session', null);
    var answered = s.items.slice(0, s.idx + 1).filter(function (it) { return it.res; });
    var nAns = answered.length, isBest = false;
    if (s.mode === 'solo' && !s.custom && s.points > (best.solo || 0)) { best.solo = s.points; isBest = true; }
    if (s.mode === 'quick' && !s.custom) {
      var k = s.cat || 'all';
      if (s.correct > (best.quick[k] || 0)) { best.quick[k] = s.correct; isBest = true; }
    }
    store.set('best', best);
    s.isBest = isBest;
    lastResult = s;
    show('results');
    renderResults();
  }
  var lastResult = null;
  function renderResults() {
    var s = lastResult; if (!s) return;
    session = s;          // so base() can read custom questions
    var answered = s.items.filter(function (it) { return it.res; });
    var big = $('#resBig'), line = $('#resLine');
    if (s.mode === 'solo') {
      big.textContent = t('pts', { n: fmt(s.points) });
      line.textContent = s.end === 'won' ? t('solo_won') : s.end === 'stopped' ? t('solo_stopped', { p: fmt(s.points) }) : t('solo_lost', { n: fmt(s.idx + 1), p: fmt(s.points) });
    } else if (s.mode === 'teams') {
      var top = Math.max.apply(null, s.teams.map(function (x) { return x.score; }));
      var winners = s.teams.map(function (x, i) { return i; }).filter(function (i) { return s.teams[i].score === top; });
      big.textContent = winners.length === 1 ? t('winner', { team: teamName(winners[0]) }) : t('tie', { teams: winners.map(teamName).join(', ') });
      line.textContent = t('res_teams', { n: fmt(answered.length) });
    } else {
      big.textContent = t('res_score', { n: fmt(s.correct), total: fmt(answered.length) });
      line.textContent = answered.length ? t('res_pct', { p: fmt(Math.round(s.correct * 100 / answered.length)) }) : '';
    }
    var rb = $('#resBest'); rb.hidden = !s.isBest; rb.textContent = t('new_best');
    var fbd = $('#finalBoard'); fbd.innerHTML = ''; fbd.hidden = s.mode !== 'teams';
    if (s.mode === 'teams') {
      var order = s.teams.map(function (x, i) { return i; }).sort(function (a, b) { return s.teams[b].score - s.teams[a].score; });
      var top2 = s.teams[order[0]].score;
      order.forEach(function (i, rank) {
        fbd.appendChild(el('div', { class: 'team-card' + (s.teams[i].score === top2 ? ' win' : ''), id: 'final' + i },
          el('span', { class: 'tn' }, el('span', { class: 'dot', style: { background: 'var(' + TEAM_COLORS[i] + ')' } }), el('span', { class: 'num', text: fmt(rank + 1) + '.' }), el('span', { class: 'no-i18n', text: teamName(i) })),
          el('span', { class: 'ts', text: t('pts', { n: fmt(s.teams[i].score) }) })));
      });
    }
    var rv = $('#review'); rv.innerHTML = '';
    var wrong = answered.filter(function (it) { return it.res !== 'right'; });
    if (!wrong.length) rv.appendChild(el('li', { style: { borderInlineStartColor: 'var(--success)' }, text: answered.length ? t('no_mistakes') : t('nothing_answered') }));
    wrong.forEach(function (it) {
      var sh = shown(it);
      rv.appendChild(el('li', {},
        el('p', { class: 'rq', text: sh.q }),
        el('p', { class: 'ra', text: t('your_ans', { a: it.pick === null || it.pick === undefined ? (it.res === 'time' ? t('ans_time') : t('ans_none')) : sh.opts[it.pick] }) }),
        el('p', { class: 'rc', text: t('right_ans', { a: sh.opts[sh.right] }) }),
        sh.e ? el('p', { class: 'muted small', text: sh.e }) : null));
    });
    session = null;
  }
  $('#bAgain').addEventListener('click', function () { if (lastResult) { S.mode = lastResult.mode; } startGame(); });
  $('#bMenu').addEventListener('click', function () { show('setup'); window.scrollTo(0, 0); });
  $('#bPrint').addEventListener('click', function () { window.print(); });

  /* ------------------------------------------------------------ read aloud + sound */
  function readAloud(auto) {
    if (!session) return;
    var sh = shown(session.items[session.idx]);
    var parts = [sh.q];
    sh.opts.forEach(function (o, i) { if (session.hidden.indexOf(i) < 0) parts.push(LETTERS[i] + '. ' + o); });
    EDU.speak(parts.join('. ')).then(function (ok) { if (!ok && !auto) EDU.toast(t('no_voice')); });
  }
  var actx = null;
  function beep(good) {
    if (!S.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var now = actx.currentTime;
      (good ? [660, 880] : [300, 220]).forEach(function (f, k) {
        var o = actx.createOscillator(), g = actx.createGain();
        o.type = good ? 'sine' : 'square'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, now + k * 0.12);
        g.gain.exponentialRampToValueAtTime(good ? 0.18 : 0.08, now + k * 0.12 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + k * 0.12 + 0.18);
        o.connect(g); g.connect(actx.destination); o.start(now + k * 0.12); o.stop(now + k * 0.12 + 0.2);
      });
    } catch (e) { /* no audio: ignore */ }
  }

  /* ------------------------------------------------------------ keyboard */
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || view !== 'game' || !session) return;
    var tg = e.target;
    if (tg && (/^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName) || tg.isContentEditable)) return;
    if (document.querySelector('.edu-modal-back')) return;
    var k = (e.key || '').toLowerCase();
    var pos = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 }[k];
    var onBtn = tg && (tg.tagName === 'BUTTON' || tg.tagName === 'SUMMARY' || tg.tagName === 'A');
    if (pos !== undefined && !session.answered) { e.preventDefault(); choose(pos); }
    else if (k === 'enter' && session.answered && !onBtn) { e.preventDefault(); next(); }
    else if ((k === 'arrowright' || k === 'arrowleft' || k === 'n') && session.answered) { e.preventDefault(); next(); }
  });

  /* ------------------------------------------------------------ language change + start */
  EDU.onLang(function () {
    if (view === 'setup') renderSetup();
    else if (view === 'game') renderGame();
    else if (view === 'results') renderResults();
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden) EDU.stopSpeaking(); });

  /* Test hook (used only by the automated interaction test; normal play never calls it).
     setQuestions([{ q, options: [4 strings], answer: index, expl }]) fixes the questions of the next game. */
  window.__gameTest = {
    setQuestions: function (arr) { override = Array.isArray(arr) && arr.length ? arr.map(function (q) { return { q: String(q.q), options: q.options.map(String), answer: +q.answer || 0, expl: q.expl || '', level: q.level || 1 }; }) : null; },
    state: function () { return session ? JSON.parse(JSON.stringify(session)) : null; }
  };

  renderSetup();
})();
