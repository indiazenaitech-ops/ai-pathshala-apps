/* Party Games: Dumb Charades, Antakshari helper, Draw & Guess and Icebreakers with one shared team scoreboard.
   For the host of a family party, a wedding sangeet, a kitty party or a class. Everything runs on this device;
   teams, scores, used cards and settings are kept with EDU.store('party-games').
   Timers are driven by wall-clock timestamps (Date.now), so they stay right in a background tab. */
(function () {
  'use strict';
  var SLUG = 'party-games';
  var store = EDU.store(SLUG);
  var t = EDU.t, $ = EDU.$, $$ = EDU.$$, el = EDU.el;
  var fmt = function (n) { return EDU.fmt(n); };
  var CONTENT = window.APP_CONTENT || {};

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'wa_game' });

  var DECKS = ['animals', 'jobs', 'actions', 'foods', 'festivals', 'places', 'sports', 'home', 'kids'];
  var CATS = ['all'].concat(DECKS, ['custom']);
  var TIMES = { ch: [60, 90, 120], dw: [60, 90, 120], ak: [20, 30, 45, 60] };
  var SKIPS = [0, 1, 2, 3, 5];
  var MAX_TEAMS = 6, MIN_TEAMS = 2, MAX_SCORE = 9999;
  var PENS = ['--text', '--c2', '--c4', '--c7', '--c5'];
  var WYR_COUNT = 30;                         // icebreakers: the first 30 are "Would you rather", the rest "Tell us about"

  /* ---------------- helpers ---------------- */
  function now() { return Date.now(); }
  function clampInt(v, lo, hi, d) { v = parseInt(v, 10); if (isNaN(v)) v = d; return Math.max(lo, Math.min(hi, v)); }
  function arr(a) { return Array.isArray(a) ? a : []; }
  var random = Math.random;                    // replaced only by the test hook (window.__gameTest.setRandom)
  function randBelow(n) { return n <= 1 ? 0 : Math.min(n - 1, Math.floor(random() * n)); }
  function C() { return CONTENT[EDU.lang] || CONTENT.en || {}; }
  function CE() { return CONTENT.en || {}; }
  function reducedMotion() { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function mmss(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000)), m = Math.floor(s / 60), x = s % 60;
    return m + ':' + (x < 10 ? '0' : '') + x;
  }
  function pop(node) {
    if (reducedMotion() || !node) return;
    node.classList.remove('pop'); void node.offsetWidth; node.classList.add('pop');
  }
  /* toasts must be drawn inside the full-screen element, or nobody sees them on the TV */
  function placeToasts() {
    var w = $('.edu-toast-wrap'), host = document.fullscreenElement || document.webkitFullscreenElement || document.body;
    if (w && w.parentNode !== host) host.appendChild(w);
  }
  function toast(msg) { EDU.toast(msg); placeToasts(); }
  document.addEventListener('fullscreenchange', placeToasts);

  /* ---------------- state (restored from this device) ---------------- */
  function defTeams() { return [{ name: '', color: 0, score: 0 }, { name: '', color: 1, score: 0 }]; }
  var S = (function () {
    var s = store.get('state', null) || {};
    var o = {};
    o.teams = arr(s.teams).slice(0, MAX_TEAMS).map(function (x, i) {
      x = x || {};
      return { name: typeof x.name === 'string' ? x.name.slice(0, 24) : '', color: clampInt(x.color, 0, 7, i % 8), score: clampInt(x.score, 0, MAX_SCORE, 0) };
    });
    if (o.teams.length < MIN_TEAMS) o.teams = defTeams();
    o.turn = clampInt(s.turn, 0, o.teams.length - 1, 0);
    o.tab = ['ch', 'ak', 'dw', 'ice'].indexOf(s.tab) >= 0 ? s.tab : 'ch';
    o.sound = s.sound === true;                 // sound is OFF by default
    var ch = s.ch || {}, dw = s.dw || {}, ak = s.ak || {}, ice = s.ice || {};
    o.ch = { cat: CATS.indexOf(ch.cat) >= 0 ? ch.cat : 'all', secs: TIMES.ch.indexOf(ch.secs) >= 0 ? ch.secs : 60,
      skips: SKIPS.indexOf(ch.skips) >= 0 ? ch.skips : 0, autohide: ch.autohide !== false };
    o.dw = { secs: TIMES.dw.indexOf(dw.secs) >= 0 ? dw.secs : 90, skips: SKIPS.indexOf(dw.skips) >= 0 ? dw.skips : 0, autohide: dw.autohide !== false };
    o.ak = { secs: TIMES.ak.indexOf(ak.secs) >= 0 ? ak.secs : 30, li: typeof ak.li === 'number' ? ak.li : -1 };
    o.ice = { kind: ['all', 'wyr', 'tell'].indexOf(ice.kind) >= 0 ? ice.kind : 'all', cur: typeof ice.cur === 'number' ? ice.cur : -1,
      used: arr(ice.used).filter(function (i) { return typeof i === 'number'; }) };
    o.used = {};
    var u = s.used || {};
    Object.keys(u).forEach(function (k) { if (/^[a-z]+$/.test(k)) o.used[k] = arr(u[k]).filter(function (i) { return typeof i === 'number' && i >= 0; }); });
    o.custom = typeof s.custom === 'string' ? s.custom.slice(0, 20000) : '';
    o.pen = clampInt(s.pen, 0, PENS.length - 1, 0);
    o.size = s.size === 12 ? 12 : 4;
    return o;
  })();
  function save() { store.set('state', S); }

  var testDeck = null;                          // set only by window.__gameTest.setDeck (fixed order, for tests)

  /* ---------------- teams ---------------- */
  function teamName(i) { var tm = S.teams[i]; return tm && tm.name ? tm.name : t('team_n', { n: fmt(i + 1) }); }
  function teamColor(i) { return 'var(--c' + ((S.teams[i] ? S.teams[i].color : i) % 8 + 1) + ')'; }
  function nextTurn() { S.turn = (S.turn + 1) % S.teams.length; }
  function addPoint(i, d) {
    var tm = S.teams[i]; if (!tm) return;
    tm.score = Math.max(0, Math.min(MAX_SCORE, tm.score + d));
  }
  function turnChip(node, i) {
    if (!S.teams[i]) i = 0;
    node.innerHTML = '';
    node.style.setProperty('--tc', teamColor(i));
    node.appendChild(el('span', { class: 'dot', 'aria-hidden': 'true' }));
    var custom = !!S.teams[i].name;
    node.appendChild(el('span', { class: 'nm' + (custom ? ' no-i18n' : ''), text: t('turn_of', { name: teamName(i) }) }));
  }

  /* ---------------- sound (WebAudio, no files; off by default) ---------------- */
  var actx = null;
  function audio() {
    if (!S.sound) return null;
    try {
      if (!actx) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; actx = new AC(); }
      if (actx.state === 'suspended' && actx.resume) actx.resume();
      return actx;
    } catch (e) { return null; }
  }
  function tone(freq, delay, len, vol, type) {
    var a = audio(); if (!a) return;
    try {
      var t0 = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
      o.connect(g); g.connect(a.destination);
      o.start(t0); o.stop(t0 + len + 0.05);
    } catch (e) { /* sound is optional */ }
  }
  function chime() { [659.3, 523.3, 392].forEach(function (f, i) { tone(f, i * 0.28, 1.3, 0.16); tone(f * 2, i * 0.28, 0.5, 0.03); }); }
  function softTick() { tone(880, 0, 0.08, 0.05, 'triangle'); }
  function ding() { tone(1046.5, 0, 0.35, 0.08); tone(1568, 0.08, 0.4, 0.05); }

  /* ---------------- cards and decks ---------------- */
  function customWords() {
    return S.custom.split(/\r\n|\r|\n/).map(function (s) { return s.replace(/\s+/g, ' ').trim().slice(0, 60); }).filter(Boolean).slice(0, 500);
  }
  function deckSize(d) {
    if (d === 'test') return testDeck ? testDeck.length : 0;
    if (d === 'custom') return customWords().length;
    if (d === 'draw') return arr(CE().draw).length;
    return arr((CE().decks || {})[d]).length;
  }
  function cardText(c) {
    if (!c) return '';
    if (c.d === 'test') return testDeck ? String(testDeck[c.i] || '') : '';
    if (c.d === 'custom') return customWords()[c.i] || '';
    if (c.d === 'draw') return arr(C().draw)[c.i] || arr(CE().draw)[c.i] || '';
    return arr((C().decks || {})[c.d])[c.i] || arr((CE().decks || {})[c.d])[c.i] || '';
  }
  function decksFor(m) {
    if (m === 'dw') return ['draw'];
    if (testDeck && S.ch.cat === 'test') return ['test'];
    if (S.ch.cat === 'all') return DECKS;
    return [S.ch.cat];
  }
  function usedOf(d) { return S.used[d] || (S.used[d] = []); }
  function usedCount(m) { return decksFor(m).reduce(function (a, d) { return a + Math.min(usedOf(d).length, deckSize(d)); }, 0); }
  function totalCount(m) { return decksFor(m).reduce(function (a, d) { return a + deckSize(d); }, 0); }
  function pool(m, exclude) {
    var out = [];
    decksFor(m).forEach(function (d) {
      var n = deckSize(d), u = {};
      usedOf(d).forEach(function (i) { u[i] = 1; });
      for (var i = 0; i < n; i++) if (!u[i] && !(exclude && exclude.d === d && exclude.i === i)) out.push({ d: d, i: i });
    });
    return out;
  }
  /* no repeats until the deck is used up; then the used cards are shuffled back in */
  function drawCard(m, exclude) {
    var p = pool(m, exclude);
    if (!p.length) {
      decksFor(m).forEach(function (d) { S.used[d] = []; });
      p = pool(m, exclude);
      if (p.length) toast(t('deck_reshuffled'));
    }
    if (!p.length) p = pool(m, null);
    if (!p.length) return null;
    if (decksFor(m)[0] === 'test') return p[0];          // fixed order for the interaction test
    return p[randBelow(p.length)];
  }
  function markUsed(c) { if (!c) return; var u = usedOf(c.d); if (u.indexOf(c.i) < 0) u.push(c.i); }
  function catLabel(d) { return d === 'test' || d === 'custom' ? '' : t('cat_' + d); }

  /* ---------------- rounds (charades + draw & guess share one engine) ---------------- */
  function blankRound() { return { state: 'idle', endAt: 0, left: 0, total: 0, card: null, shown: false, ok: [], sk: [], team: 0, warned: 0 }; }
  function loadRound(m) {
    var r = store.get('round_' + m, null), o = blankRound();
    if (!r || typeof r !== 'object') return o;
    o.state = ['idle', 'running', 'paused', 'done'].indexOf(r.state) >= 0 ? r.state : 'idle';
    o.total = Math.max(0, +r.total || 0);
    o.left = Math.max(0, Math.min(o.total, +r.left || 0));
    o.team = clampInt(r.team, 0, S.teams.length - 1, 0);
    var okc = function (c) { return c && typeof c.d === 'string' && typeof c.i === 'number' && c.d !== 'test'; };
    o.card = okc(r.card) ? r.card : null;
    o.ok = arr(r.ok).filter(okc); o.sk = arr(r.sk).filter(okc);
    if (o.state === 'running') {                // reloaded during a round: continue paused, with the time that was left
      o.left = Math.max(0, Math.min(o.total, (+r.endAt || 0) - now()));
      o.state = o.left > 0 ? 'paused' : 'done';
    }
    if ((o.state === 'paused' || o.state === 'running') && !o.card) o.state = 'idle';
    return o;
  }
  var R = { ch: loadRound('ch'), dw: loadRound('dw') };
  function saveRound(m) { store.set('round_' + m, R[m]); }
  function cfg(m) { return S[m]; }
  function leftOf(r) { return r.state === 'running' ? Math.max(0, r.endAt - now()) : r.left; }

  function roundStart(m) {
    var r = R[m];
    if (m === 'ch' && S.ch.cat === 'custom' && !customWords().length) { toast(t('custom_empty')); $('#ch-custom').focus(); return; }
    var c = drawCard(m, null);
    if (!c) { toast(t('custom_empty')); return; }
    audio();                                     // unlock audio inside the tap
    R[m] = r = blankRound();
    r.team = S.turn;
    r.total = cfg(m).secs * 1000;
    r.endAt = now() + r.total;
    r.left = r.total;
    r.state = 'running';
    r.card = c;
    r.shown = !cfg(m).autohide;
    if (m === 'dw') padClear(true);
    saveRound(m);
    renderRound(m);
  }
  function roundPause(m) {
    var r = R[m];
    if (r.state === 'running') { r.left = leftOf(r); r.state = 'paused'; }
    else if (r.state === 'paused') { r.endAt = now() + r.left; r.state = 'running'; audio(); }
    saveRound(m); renderRound(m);
  }
  function skipsLeft(m) { var lim = cfg(m).skips; return lim ? Math.max(0, lim - R[m].sk.length) : Infinity; }
  function roundAnswer(m, good) {
    var r = R[m];
    if (r.state !== 'running' && r.state !== 'paused') return;
    if (!r.card) return;
    if (!good && skipsLeft(m) <= 0) { toast(t('no_skips')); return; }
    markUsed(r.card);
    if (good) { r.ok.push(r.card); addPoint(r.team, 1); ding(); } else r.sk.push(r.card);
    r.card = drawCard(m, r.card);
    r.shown = !cfg(m).autohide;
    if (m === 'dw') padClear(true);
    save(); saveRound(m);
    renderRound(m); renderScores();
  }
  function roundEnd(m, timeUp) {
    var r = R[m];
    if (r.state !== 'running' && r.state !== 'paused') return;
    r.left = 0; r.state = 'done'; r.card = null; r.shown = false;   // the card that was not finished goes back into the pile
    saveRound(m); save();
    renderRound(m); renderScores();
    if (timeUp) { chime(); toast(t('time_up')); }
  }
  function roundNextTeam(m) {
    nextTurn();
    R[m] = blankRound();
    saveRound(m); save();
    renderAllRounds(); renderScores(); renderAk();
  }
  function mainAction(m) {
    var st = R[m].state;
    if (st === 'idle') roundStart(m);
    else if (st === 'done') roundNextTeam(m);
    else roundPause(m);
  }

  /* ---------------- rendering: rounds ---------------- */
  function setBtn(btn, ico, key, vars, custom) {
    var sig = ico + '|' + key + '|' + JSON.stringify(vars || {}) + '|' + EDU.lang;
    if (btn.__sig === sig) return;
    btn.__sig = sig;
    btn.innerHTML = '';
    btn.appendChild(el('span', { 'aria-hidden': 'true', text: ico }));
    btn.appendChild(el('span', { class: custom ? 'no-i18n' : null, text: t(key, vars) }));
  }
  function updateTimer(m) {
    var r = R[m], left = leftOf(r), tm = $('#' + m + '-timer'), box = $('#' + m + '-barbox');
    var txt = mmss(r.state === 'idle' ? cfg(m).secs * 1000 : left);
    if (tm.__t !== txt) { tm.textContent = txt; tm.__t = txt; }
    var warn = r.state === 'running' && left <= 10000;
    tm.classList.toggle('warn', warn);
    tm.classList.toggle('done', r.state === 'done');
    box.classList.toggle('warn', warn);
    var frac = r.state === 'idle' ? 1 : (r.total ? left / r.total : 0);
    $('#' + m + '-bar').style.width = (Math.max(0, Math.min(1, frac)) * 100).toFixed(1) + '%';
  }
  function renderRound(m) {
    var r = R[m], st = r.state, live = st === 'running' || st === 'paused';
    turnChip($('#' + m + '-turn'), live || st === 'done' ? r.team : S.turn);
    updateTimer(m);
    var card = $('#' + m + '-card'), hint = $('#' + m + '-hint'), word = $('#' + m + '-word'), cat = $('#' + m + '-cat');
    var covered = live && !r.shown;
    card.classList.toggle('covered', covered);
    card.disabled = !live;
    if (!live) {
      hint.textContent = t(st === 'done' ? 'round_over' : (m === 'dw' ? 'card_ready_dw' : 'card_ready'));
      word.textContent = ''; cat.textContent = '';
      card.setAttribute('aria-label', hint.textContent);
    } else if (covered) {
      hint.textContent = t(m === 'dw' ? 'tap_reveal_dw' : 'tap_reveal');
      word.textContent = ''; cat.textContent = '';
      card.setAttribute('aria-label', hint.textContent);
    } else {
      hint.textContent = st === 'paused' ? t('paused') : t('tap_hide');
      word.textContent = cardText(r.card);
      cat.textContent = m === 'ch' && S.ch.cat === 'all' ? catLabel(r.card.d) : '';
      card.setAttribute('aria-label', word.textContent + ' · ' + t('tap_hide'));
    }
    var stats = '';
    if (live) {
      stats = t('round_stats', { c: fmt(r.ok.length), s: fmt(r.sk.length) });
      if (cfg(m).skips) stats += ' · ' + (skipsLeft(m) > 0 ? t('skips_left', { n: fmt(skipsLeft(m)) }) : t('no_skips'));
      if (st === 'paused') stats = t('paused') + ' · ' + stats;
    }
    $('#' + m + '-stats').textContent = stats;
    var ctr = $('#' + m + '-controls'), main = $('#' + m + '-start');
    ctr.classList.toggle('idle', !live);
    if (st === 'idle') setBtn(main, '▶', 'start_round');
    else if (st === 'running') setBtn(main, '⏸', 'pause');
    else if (st === 'paused') setBtn(main, '▶', 'resume');
    else {
      var nx = (S.turn + 1) % S.teams.length;
      setBtn(main, '➜', 'next_team', { name: teamName(nx) }, !!S.teams[nx].name);
    }
    $('#' + m + '-skip').disabled = !live || skipsLeft(m) <= 0;
    $('#' + m + '-correct').disabled = !live;
    $('#' + m + '-end').hidden = !live;
    var sum = $('#' + m + '-summary');
    sum.hidden = st !== 'done';
    if (st === 'done') {
      sum.innerHTML = '';
      var custom = !!(S.teams[r.team] && S.teams[r.team].name);
      sum.appendChild(el('h3', { class: custom ? 'no-i18n' : null, text: t('summary_head', { name: teamName(r.team), n: fmt(r.ok.length) }) }));
      var list = function (key, cards, ico) {
        var ul = el('ul');
        if (!cards.length) ul.appendChild(el('li', { class: 'muted', text: t('none') }));
        cards.forEach(function (c) { ul.appendChild(el('li', { class: 'no-i18n', text: cardText(c) })); });
        return el('div', {}, el('h4', {}, el('span', { 'aria-hidden': 'true', text: ico + ' ' }), el('span', { text: t(key) })), ul);
      };
      sum.appendChild(el('div', { class: 'sum-cols' }, list('guessed', r.ok, '✓'), list('skipped', r.sk, '⏭')));
    }
    $('#' + m + '-used').textContent = t('used_n', { n: fmt(usedCount(m)), total: fmt(totalCount(m)) });
  }
  function renderAllRounds() { renderRound('ch'); renderRound('dw'); }

  /* ---------------- rendering: scoreboard + teams ---------------- */
  function renderScores() {
    var box = $('#scores');
    box.innerHTML = '';
    S.teams.forEach(function (tm, i) {
      var name = teamName(i), custom = !!tm.name;
      var tile = el('div', { class: 'score-tile' + (i === S.turn ? ' is-turn' : ''), id: 'tile-' + i },
        el('div', { class: 'st-name' },
          el('span', { class: 'dot', 'aria-hidden': 'true' }),
          el('span', { class: 'nm' + (custom ? ' no-i18n' : ''), text: name }),
          i === S.turn ? el('span', { class: 'turn-badge', role: 'img', 'aria-label': t('now_playing'), title: t('now_playing'), text: '▶' }) : null),
        el('button', { type: 'button', class: 'btn st-btn', 'aria-label': t('minus_point', { name: name }), title: t('minus_point', { name: name }), dataset: { i: String(i), d: '-1' }, text: '−' }),
        el('div', { class: 'st-score num', id: 'score-' + i, 'aria-label': t('score_aria', { name: name, n: fmt(tm.score) }), text: fmt(tm.score) }),
        el('button', { type: 'button', class: 'btn st-btn', 'aria-label': t('plus_point', { name: name }), title: t('plus_point', { name: name }), dataset: { i: String(i), d: '1' }, text: '+' }));
      tile.style.setProperty('--tc', teamColor(i));
      box.appendChild(tile);
    });
    var best = Math.max.apply(null, S.teams.map(function (x) { return x.score; }));
    var top = S.teams.filter(function (x) { return x.score === best; });
    var lead = $('#leader');
    if (best <= 0) lead.textContent = t('leader_none');
    else if (top.length > 1) lead.textContent = t('scores_level');
    else lead.textContent = t('leader', { name: teamName(S.teams.indexOf(top[0])) });
  }
  function renderTeamEdit() {
    $('#teamCount').textContent = fmt(S.teams.length);
    $('#teamMinus').disabled = S.teams.length <= MIN_TEAMS;
    $('#teamPlus').disabled = S.teams.length >= MAX_TEAMS;
    var rows = $('#teamRows'), act = document.activeElement, focusId = act && act.id;
    rows.innerHTML = '';
    S.teams.forEach(function (tm, i) {
      var inp = el('input', { type: 'text', id: 'teamName' + i, maxlength: '24', autocomplete: 'off', class: 'no-i18n', placeholder: t('team_n', { n: fmt(i + 1) }), dataset: { i: String(i) } });
      inp.value = tm.name;
      var sw = el('div', { class: 'swatches', role: 'group', 'aria-label': t('team_color', { name: teamName(i) }) });
      for (var c = 0; c < 8; c++) {
        sw.appendChild(el('button', { type: 'button', class: 'swatch', 'aria-pressed': tm.color === c ? 'true' : 'false', 'aria-label': t('color_n', { n: fmt(c + 1) }),
          dataset: { i: String(i), c: String(c) }, style: { background: 'var(--c' + (c + 1) + ')' } }));
      }
      rows.appendChild(el('div', { class: 'team-row' }, el('label', { for: 'teamName' + i, class: 'sr-only', text: t('team_name_label', { n: fmt(i + 1) }) }), inp, sw));
    });
    if (focusId && $('#' + focusId)) $('#' + focusId).focus();
  }

  /* ---------------- rendering: settings ---------------- */
  function renderSetup() {
    var cats = $('#ch-cats');
    cats.innerHTML = '';
    CATS.forEach(function (c) {
      cats.appendChild(el('button', { type: 'button', class: 'chip', 'aria-pressed': S.ch.cat === c ? 'true' : 'false', dataset: { cat: c }, text: t('cat_' + c) }));
    });
    $('#ch-customBox').hidden = S.ch.cat !== 'custom';
    var ta = $('#ch-custom');
    if (document.activeElement !== ta) ta.value = S.custom;
    ['ch', 'dw', 'ak'].forEach(function (m) {
      var seg = $('#' + m + '-time');
      seg.innerHTML = '';
      TIMES[m].forEach(function (s) { seg.appendChild(el('button', { type: 'button', 'aria-pressed': cfg(m).secs === s ? 'true' : 'false', dataset: { s: String(s) }, text: t('secs', { n: fmt(s) }) })); });
    });
    ['ch', 'dw'].forEach(function (m) {
      var sel = $('#' + m + '-skips');
      sel.innerHTML = '';
      SKIPS.forEach(function (n) { sel.appendChild(el('option', { value: String(n), text: n ? fmt(n) : t('skips_any') })); });
      sel.value = String(cfg(m).skips);
      $('#' + m + '-autohide').checked = cfg(m).autohide;
    });
    var sb = $('#soundBtn');
    sb.setAttribute('aria-pressed', S.sound ? 'true' : 'false');
    $('#soundIc').textContent = S.sound ? '🔔' : '🔇';
  }

  /* ---------------- Antakshari ---------------- */
  var AK = { state: 'idle', endAt: 0, left: 0, msg: null };
  function letters() { return String(t('ak_letters')).split(/\s+/).filter(Boolean); }
  function akCheckLetter() {
    var L = letters();
    if (!(S.ak.li >= 0 && S.ak.li < L.length)) S.ak.li = randBelow(L.length);
  }
  function akSetLetter(i) { S.ak.li = i; save(); renderAk(); pop($('#ak-letter')); }
  function akNext() {
    var L = letters(); if (L.length < 2) return;
    var i = randBelow(L.length - 1);
    if (i >= S.ak.li) i++;                        // always a different letter
    AK.msg = null;
    akSetLetter(i);
  }
  function akReset() { AK.state = 'idle'; AK.left = S.ak.secs * 1000; }
  function akToggle() {
    audio();
    if (AK.state === 'running') { AK.left = Math.max(0, AK.endAt - now()); AK.state = 'paused'; }
    else if (AK.state === 'paused') { AK.endAt = now() + AK.left; AK.state = 'running'; }
    else { AK.left = S.ak.secs * 1000; AK.endAt = now() + AK.left; AK.state = 'running'; AK.warned = 0; }
    renderAk();
  }
  function akPoint() {
    var who = S.turn;
    addPoint(who, 1); ding();
    nextTurn(); akReset();
    AK.msg = { key: 'ak_then_pick', vars: { name: who } };
    save(); renderScores(); renderAk(); renderAllRounds();
    var g = $('#ak-grid');
    g.classList.add('nudge');
    setTimeout(function () { g.classList.remove('nudge'); }, 2400);
  }
  function akPass() {
    var who = S.turn;
    nextTurn(); akReset();
    AK.msg = { key: 'ak_passed', vars: { name: who, next: S.turn } };
    save(); renderScores(); renderAk(); renderAllRounds();
  }
  function akLeft() { return AK.state === 'running' ? Math.max(0, AK.endAt - now()) : (AK.state === 'idle' ? S.ak.secs * 1000 : AK.left); }
  function akTimer() {
    var left = akLeft(), tm = $('#ak-timer'), txt = mmss(left);
    if (tm.__t !== txt) { tm.textContent = txt; tm.__t = txt; }
    var warn = AK.state === 'running' && left <= 5000;
    tm.classList.toggle('warn', warn);
    tm.classList.toggle('done', AK.state === 'up');
    $('#ak-barbox').classList.toggle('warn', warn);
    $('#ak-bar').style.width = (Math.max(0, Math.min(1, left / (S.ak.secs * 1000))) * 100).toFixed(1) + '%';
  }
  function renderAk() {
    akCheckLetter();
    var L = letters();
    turnChip($('#ak-turn'), S.turn);
    $('#ak-letter').textContent = L[S.ak.li] || '';
    akTimer();
    var main = $('#ak-start');
    if (AK.state === 'running') setBtn(main, '⏸', 'pause');
    else if (AK.state === 'paused') setBtn(main, '▶', 'resume');
    else setBtn(main, '▶', 'ak_start');
    var msg = '';
    if (AK.state === 'up') msg = t('ak_time_up');
    else if (AK.msg) {
      var v = {};
      Object.keys(AK.msg.vars || {}).forEach(function (k) { v[k] = teamName(AK.msg.vars[k]); });
      msg = t(AK.msg.key, v);
    }
    $('#ak-msg').textContent = msg;
    var g = $('#ak-grid');
    if (g.__lang !== EDU.lang || g.children.length !== L.length) {
      g.__lang = EDU.lang;
      g.innerHTML = '';
      L.forEach(function (ch, i) { g.appendChild(el('button', { type: 'button', class: 'no-i18n', dataset: { i: String(i) }, 'aria-pressed': 'false', text: ch })); });
    }
    $$('button', g).forEach(function (b, i) { b.setAttribute('aria-pressed', i === S.ak.li ? 'true' : 'false'); });
  }

  /* ---------------- Icebreakers ---------------- */
  function iceList() { return arr(C().ice).length ? arr(C().ice) : arr(CE().ice); }
  function iceIdx(kind) {
    var n = arr(CE().ice).length, out = [];
    for (var i = 0; i < n; i++) if (kind === 'all' || (kind === 'wyr') === (i < WYR_COUNT)) out.push(i);
    return out;
  }
  function icePool() { var u = {}; S.ice.used.forEach(function (i) { u[i] = 1; }); return iceIdx(S.ice.kind).filter(function (i) { return !u[i]; }); }
  function iceNext() {
    var p = icePool();
    if (!p.length) {
      if (S.ice.cur !== -2) { S.ice.cur = -2; save(); renderIce(); return; }     // natural end: "that was the last one"
      var all = iceIdx(S.ice.kind);
      S.ice.used = S.ice.used.filter(function (i) { return all.indexOf(i) < 0; });
      p = icePool();
    }
    var i = p[randBelow(p.length)];
    S.ice.cur = i; S.ice.used.push(i);
    save(); renderIce(); pop($('#ice-text'));
  }
  function renderIce() {
    var c = S.ice.cur, list = iceList();
    $('#ice-text').textContent = c >= 0 ? (list[c] || '') : t(c === -2 ? 'ice_done' : 'ice_start');
    $$('#ice-filter button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.kind === S.ice.kind ? 'true' : 'false'); });
    $('#ice-left').textContent = t('ice_left', { n: fmt(icePool().length), total: fmt(iceIdx(S.ice.kind).length) });
  }

  /* ---------------- drawing pad (pointer events: finger, mouse, stylus) ---------------- */
  var pad = $('#dw-pad'), pctx = pad.getContext('2d'), strokes = [], drawing = null, padW = 0, padH = 0;
  function penColor(i) { return EDU.css(PENS[i] || '--text') || '#222'; }
  function sizePad() {
    var w = Math.round(pad.getBoundingClientRect().width), h = Math.round(pad.getBoundingClientRect().height);
    if (!w || !h) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (pad.width !== Math.round(w * dpr) || pad.height !== Math.round(h * dpr)) { pad.width = Math.round(w * dpr); pad.height = Math.round(h * dpr); }
    padW = w; padH = h;
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redrawPad();
  }
  function strokePath(s) {
    pctx.strokeStyle = penColor(s.c); pctx.fillStyle = pctx.strokeStyle;
    pctx.lineWidth = s.w; pctx.lineCap = 'round'; pctx.lineJoin = 'round';
    var p = s.pts;
    if (p.length === 1) { pctx.beginPath(); pctx.arc(p[0][0] * padW, p[0][1] * padH, s.w / 2, 0, Math.PI * 2); pctx.fill(); return; }
    pctx.beginPath(); pctx.moveTo(p[0][0] * padW, p[0][1] * padH);
    for (var i = 1; i < p.length; i++) pctx.lineTo(p[i][0] * padW, p[i][1] * padH);
    pctx.stroke();
  }
  function redrawPad() { if (!padW) return; pctx.clearRect(0, 0, padW, padH); strokes.forEach(strokePath); }
  function padClear() { strokes = []; drawing = null; redrawPad(); }
  function ptOf(e) { var r = pad.getBoundingClientRect(); return [Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), Math.max(0, Math.min(1, (e.clientY - r.top) / r.height))]; }
  pad.addEventListener('pointerdown', function (e) {
    if (e.button > 0) return;
    if (!padW) sizePad();
    e.preventDefault();
    try { pad.setPointerCapture(e.pointerId); } catch (x) { }
    drawing = { id: e.pointerId, s: { c: S.pen, w: S.size, pts: [ptOf(e)] } };
    strokes.push(drawing.s);
    strokePath(drawing.s);
  });
  pad.addEventListener('pointermove', function (e) {
    if (!drawing || drawing.id !== e.pointerId) return;
    var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    if (!evs.length) evs = [e];
    var s = drawing.s;
    evs.forEach(function (ev) {
      var a = s.pts[s.pts.length - 1], b = ptOf(ev);
      s.pts.push(b);
      pctx.strokeStyle = penColor(s.c); pctx.lineWidth = s.w; pctx.lineCap = 'round';
      pctx.beginPath(); pctx.moveTo(a[0] * padW, a[1] * padH); pctx.lineTo(b[0] * padW, b[1] * padH); pctx.stroke();
    });
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) { pad.addEventListener(ev, function (e) { if (drawing && drawing.id === e.pointerId) drawing = null; }); });
  function renderPens() {
    var box = $('#dw-pens');
    box.innerHTML = '';
    PENS.forEach(function (v, i) {
      box.appendChild(el('button', { type: 'button', class: 'pen', 'aria-pressed': S.pen === i ? 'true' : 'false', 'aria-label': t('pen_n', { n: fmt(i + 1) }), dataset: { p: String(i) }, style: { background: 'var(' + v + ')' } }));
    });
    $$('#dw-size button').forEach(function (b) { b.setAttribute('aria-pressed', +b.dataset.size === S.size ? 'true' : 'false'); });
  }

  /* ---------------- tabs ---------------- */
  var TABS = ['ch', 'ak', 'dw', 'ice'];
  function showTab(name, focus) {
    S.tab = name; save();
    TABS.forEach(function (k) {
      var b = $('#tab-' + k), on = k === name;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      $('#panel-' + k).hidden = !on;
    });
    if (focus) $('#tab-' + name).focus();
    if (name === 'dw') requestAnimationFrame(sizePad);
  }

  /* ---------------- full screen (TV / projector), with a fallback for phones without the API ---------------- */
  var pseudo = false;
  function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
  function setPseudo(on) { pseudo = on; $('#party').classList.toggle('is-fs', on); document.documentElement.classList.toggle('pg-noscroll', on); renderFs(); }
  function toggleFs() {
    if (pseudo) { setPseudo(false); return; }
    if (fsEl()) { var ex = document.exitFullscreen || document.webkitExitFullscreen; try { var r = ex.call(document); if (r && r.catch) r.catch(function () { }); } catch (e) { } return; }
    var p = $('#party'), req = p.requestFullscreen || p.webkitRequestFullscreen;
    if (!req) { setPseudo(true); return; }
    try { var q = req.call(p); if (q && q.then) q.then(null, function () { setPseudo(true); }); } catch (e) { setPseudo(true); }
  }
  function renderFs() {
    var on = pseudo || !!fsEl();
    $('#fsLbl').textContent = t(on ? 'fs_exit' : 'fullscreen');
    $('#fsBtn').setAttribute('aria-pressed', on ? 'true' : 'false');
    if (S.tab === 'dw') requestAnimationFrame(sizePad);
  }
  document.addEventListener('fullscreenchange', renderFs);
  document.addEventListener('webkitfullscreenchange', renderFs);

  function renderAll() {
    renderScores(); renderTeamEdit(); renderSetup(); renderAllRounds(); renderAk(); renderIce(); renderPens(); renderFs();
  }

  /* ---------------- events ---------------- */
  $$('#tabs [role="tab"]').forEach(function (b) { b.addEventListener('click', function () { showTab(b.dataset.tab); }); });
  $('#tabs').addEventListener('keydown', function (e) {
    var i = TABS.indexOf(S.tab), rtl = document.documentElement.dir === 'rtl', k = e.key, step = 0;
    if (k === 'ArrowRight') step = rtl ? -1 : 1; else if (k === 'ArrowLeft') step = rtl ? 1 : -1;
    else if (k === 'Home') { showTab(TABS[0], true); e.preventDefault(); return; }
    else if (k === 'End') { showTab(TABS[TABS.length - 1], true); e.preventDefault(); return; }
    if (!step) return;
    e.preventDefault(); e.stopPropagation();
    showTab(TABS[(i + step + TABS.length) % TABS.length], true);
  });

  // scoreboard + teams
  $('#scores').addEventListener('click', function (e) {
    var b = e.target.closest('.st-btn'); if (!b) return;
    addPoint(+b.dataset.i, +b.dataset.d); save(); renderScores();
  });
  $('#teamsBtn').addEventListener('click', function () {
    var box = $('#teamEdit'), open = box.hidden;
    box.hidden = !open;
    this.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { renderTeamEdit(); var f = $('#teamName0'); if (f) f.focus(); }
  });
  function teamsChanged() { save(); renderScores(); renderAllRounds(); renderAk(); }
  $('#teamPlus').addEventListener('click', function () {
    if (S.teams.length >= MAX_TEAMS) return;
    var taken = S.teams.map(function (x) { return x.color; }), c = 0;
    while (taken.indexOf(c) >= 0 && c < 7) c++;
    S.teams.push({ name: '', color: c, score: 0 });
    renderTeamEdit(); teamsChanged();
  });
  $('#teamMinus').addEventListener('click', function () {
    if (S.teams.length <= MIN_TEAMS) return;
    S.teams.pop();
    if (S.turn >= S.teams.length) S.turn = 0;
    ['ch', 'dw'].forEach(function (m) { if (R[m].team >= S.teams.length) R[m].team = 0; });
    renderTeamEdit(); teamsChanged();
  });
  $('#teamRows').addEventListener('input', function (e) {
    var inp = e.target; if (!inp.dataset || inp.dataset.i === undefined || inp.tagName !== 'INPUT') return;
    S.teams[+inp.dataset.i].name = inp.value.replace(/\s+/g, ' ').trimStart().slice(0, 24);
    teamsChanged();
  });
  $('#teamRows').addEventListener('change', function (e) {
    var inp = e.target; if (inp.tagName !== 'INPUT') return;
    var tm = S.teams[+inp.dataset.i]; tm.name = tm.name.trim(); inp.value = tm.name; teamsChanged();
  });
  $('#teamRows').addEventListener('click', function (e) {
    var b = e.target.closest('.swatch'); if (!b) return;
    S.teams[+b.dataset.i].color = +b.dataset.c;
    renderTeamEdit(); teamsChanged();
  });
  $('#soundBtn').addEventListener('click', function () {
    S.sound = !S.sound; save(); renderSetup();
    if (S.sound) ding();
  });
  $('#fsBtn').addEventListener('click', toggleFs);
  $('#newGame').addEventListener('click', function () {
    if (!confirm(t('confirm_new'))) return;
    S.teams.forEach(function (x) { x.score = 0; });
    S.turn = 0; S.used = {}; S.ice.used = []; S.ice.cur = -1;
    R.ch = blankRound(); R.dw = blankRound(); saveRound('ch'); saveRound('dw');
    akReset(); AK.msg = null;
    padClear();
    save(); renderAll();
    toast(t('new_done'));
  });

  // charades + draw & guess
  ['ch', 'dw'].forEach(function (m) {
    $('#' + m + '-start').addEventListener('click', function () { mainAction(m); });
    $('#' + m + '-correct').addEventListener('click', function () { roundAnswer(m, true); });
    $('#' + m + '-skip').addEventListener('click', function () { roundAnswer(m, false); });
    $('#' + m + '-end').addEventListener('click', function () { roundEnd(m, false); });
    $('#' + m + '-card').addEventListener('click', function () {
      var r = R[m]; if (r.state !== 'running' && r.state !== 'paused') return;
      r.shown = !r.shown; saveRound(m); renderRound(m);
    });
    $('#' + m + '-time').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      cfg(m).secs = +b.dataset.s; save(); renderSetup(); renderRound(m);
    });
    $('#' + m + '-skips').addEventListener('change', function () { cfg(m).skips = clampInt(this.value, 0, 99, 0); save(); renderRound(m); });
    $('#' + m + '-autohide').addEventListener('change', function () { cfg(m).autohide = this.checked; save(); });
    $('#' + m + '-reuse').addEventListener('click', function () {
      decksFor(m).forEach(function (d) { S.used[d] = []; });
      save(); renderRound(m); toast(t('deck_reset'));
    });
  });
  $('#ch-cats').addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return;
    if (R.ch.state === 'running' || R.ch.state === 'paused') { toast(t('cat_locked')); return; }
    S.ch.cat = b.dataset.cat; save(); renderSetup(); renderRound('ch');
    if (S.ch.cat === 'custom' && !customWords().length) $('#ch-custom').focus();
  });
  $('#ch-custom').addEventListener('input', function () { S.custom = this.value.slice(0, 20000); S.used.custom = []; save(); renderRound('ch'); });
  $('#ch-custom').addEventListener('change', function () { var n = customWords().length; if (n) toast(t('custom_saved', { n: fmt(n) })); });

  // antakshari
  $('#ak-start').addEventListener('click', akToggle);
  $('#ak-point').addEventListener('click', akPoint);
  $('#ak-pass').addEventListener('click', akPass);
  $('#ak-next').addEventListener('click', akNext);
  $('#ak-grid').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; AK.msg = null; akSetLetter(+b.dataset.i); });
  $('#ak-time').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    S.ak.secs = +b.dataset.s; save();
    if (AK.state !== 'running') akReset();
    renderSetup(); renderAk();
  });

  // icebreakers
  $('#ice-next').addEventListener('click', iceNext);
  $('#ice-filter').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    S.ice.kind = b.dataset.kind; S.ice.cur = -1; save(); renderIce();
  });

  // drawing pad tools
  $('#dw-pens').addEventListener('click', function (e) { var b = e.target.closest('.pen'); if (!b) return; S.pen = +b.dataset.p; save(); renderPens(); });
  $('#dw-size').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; S.size = +b.dataset.size === 12 ? 12 : 4; save(); renderPens(); });
  $('#dw-undo').addEventListener('click', function () { strokes.pop(); redrawPad(); });
  $('#dw-clear').addEventListener('click', function () { padClear(); });

  /* after a mouse / touch click, drop the focus so Space keeps working as the host's start / pause key */
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('button') : null;
    if (b && e.detail > 0 && !b.closest('#teamEdit')) b.blur();
  });

  /* host keys: Space start / pause · → correct · ← skip · N new letter / question · F full screen */
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
    var k = e.key;
    if (k === 'Escape' && pseudo) { setPseudo(false); return; }
    var tg = e.target, tn = (tg && tg.tagName) || '';
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tn) || (tg && tg.isContentEditable)) return;
    if (document.querySelector('.edu-modal-back')) return;
    if (tg && tg.closest && tg.closest('[role="tablist"]') && (k === 'ArrowLeft' || k === 'ArrowRight')) return;
    var space = k === ' ' || k === 'Spacebar';
    if (space && /^(BUTTON|A|SUMMARY)$/.test(tn)) return;     // a focused control works as usual
    if (e.repeat) { if (space) e.preventDefault(); return; }
    var tab = S.tab, done = true;
    if (space) {
      if (tab === 'ch' || tab === 'dw') mainAction(tab); else if (tab === 'ak') akToggle(); else iceNext();
    } else if (k === 'ArrowRight') {
      if (tab === 'ch' || tab === 'dw') roundAnswer(tab, true); else if (tab === 'ak') akPoint(); else iceNext();
    } else if (k === 'ArrowLeft') {
      if (tab === 'ch' || tab === 'dw') roundAnswer(tab, false); else if (tab === 'ak') akPass(); else done = false;
    } else if (k === 'n' || k === 'N') {
      if (tab === 'ak') akNext(); else if (tab === 'ice') iceNext(); else done = false;
    } else if (k === 'f' || k === 'F') toggleFs();
    else done = false;
    if (done) e.preventDefault();
  });

  /* ---------------- clock ---------------- */
  function tick() {
    ['ch', 'dw'].forEach(function (m) {
      var r = R[m];
      if (r.state !== 'running') return;
      var left = leftOf(r);
      if (left <= 0) { roundEnd(m, true); return; }
      var sec = Math.ceil(left / 1000);
      if (sec <= 5 && r.warned !== sec) { r.warned = sec; softTick(); }
      updateTimer(m);
    });
    if (AK.state === 'running') {
      var l = akLeft();
      if (l <= 0) { AK.state = 'up'; AK.left = 0; chime(); renderAk(); }
      else {
        var s2 = Math.ceil(l / 1000);
        if (s2 <= 5 && AK.warned !== s2) { AK.warned = s2; softTick(); }
        akTimer();
      }
    }
  }
  setInterval(tick, 200);
  document.addEventListener('visibilitychange', tick);

  if (window.ResizeObserver) new ResizeObserver(function () { requestAnimationFrame(sizePad); }).observe(pad);
  else window.addEventListener('resize', sizePad);
  EDU.onTheme(function () { redrawPad(); });
  EDU.onLang(function () { $('#ak-grid').__lang = null; renderAll(); });

  /* ---------------- test hook (used only by tools/tests/party-games.test.js; normal play never calls it) ---------------- */
  window.__gameTest = {
    setDeck: function (words) {
      testDeck = arr(words).map(String);
      S.ch.cat = 'test'; S.used.test = [];
      R.ch = blankRound(); saveRound('ch');
      renderAll();
    },
    setRandom: function (fn) { random = typeof fn === 'function' ? fn : Math.random; },
    setTimeLeft: function (m, sec) {
      var ms = Math.max(0, sec * 1000);
      if (m === 'ak') { if (AK.state === 'running') AK.endAt = now() + ms; else AK.left = ms; return; }
      var r = R[m]; if (!r) return;
      if (r.state === 'running') r.endAt = now() + ms; else if (r.state === 'paused') r.left = ms;
    },
    state: function () {
      return { scores: S.teams.map(function (x) { return x.score; }), turn: S.turn, used: usedCount('ch'), round: R.ch.state,
        ok: R.ch.ok.length, sk: R.ch.sk.length, card: cardText(R.ch.card), letter: letters()[S.ak.li] || '', ak: AK.state };
    }
  };

  /* ---------------- start ---------------- */
  akReset();
  renderAll();
  showTab(S.tab);
})();
