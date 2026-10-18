/* Snakes & Ladders (Saanp-Seedhi): pass-and-play for 2-4 players or the computer, Classic / Moksha Patam (values) /
   fair random boards, house-rule toggles, move history, save & resume. Logic: engine.js, drawing: board.js. */
(function () {
  'use strict';
  var SLUG = 'snakes-ladders';
  var t = EDU.t, $ = EDU.$, el = EDU.el, SL = window.SL, B = window.SLBoard;
  var store = EDU.store(SLUG);
  var CONTENT = window.APP_CONTENT || {};
  var COLORS = ['#e03131', '#1971c2', '#2f9e44', '#f08c00', '#7048e8', '#d6336c'];
  var COLOR_KEYS = ['col_red', 'col_blue', 'col_green', 'col_orange', 'col_purple', 'col_pink'];
  var SHAPES = B.SHAPES;                                        // circle square triangle diamond star

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'wa_game' });

  function fmt(n) { return EDU.fmt(n); }
  function reduced() { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function content() { return CONTENT[EDU.lang] || CONTENT.en; }
  function clampInt(v, lo, hi, d) { v = parseInt(v, 10); return isNaN(v) ? d : Math.max(lo, Math.min(hi, v)); }

  /* ---------------- fair dice (crypto, no modulo bias) + the test hook queue ---------------- */
  var testRolls = [];
  function rollValue() {
    if (testRolls.length) return testRolls.shift();
    var c = window.crypto || window.msCrypto;
    if (c && c.getRandomValues) { var a = new Uint8Array(1); do { c.getRandomValues(a); } while (a[0] >= 252); return a[0] % 6 + 1; }
    return 1 + Math.floor(Math.random() * 6);
  }

  /* ---------------- settings (the set-up form) ---------------- */
  var DEF_PLAYERS = [
    { name: '', type: 'human', color: 0, shape: 0 }, { name: '', type: 'cpu', color: 1, shape: 1 },
    { name: '', type: 'human', color: 2, shape: 2 }, { name: '', type: 'human', color: 3, shape: 3 }
  ];
  function cleanPlayer(p, i) {
    var d = DEF_PLAYERS[i];
    p = p && typeof p === 'object' ? p : {};
    return {
      name: typeof p.name === 'string' ? p.name.slice(0, 24) : '',
      type: p.type === 'cpu' ? 'cpu' : (p.type === 'human' ? 'human' : d.type),
      color: clampInt(p.color, 0, COLORS.length - 1, d.color),
      shape: clampInt(p.shape, 0, SHAPES.length - 1, d.shape)
    };
  }
  function cleanSettings(s) {
    s = s && typeof s === 'object' ? s : {};
    var r = s.rules && typeof s.rules === 'object' ? s.rules : {}, rules = {};
    Object.keys(SL.DEFAULT_RULES).forEach(function (k) { rules[k] = typeof r[k] === 'boolean' ? r[k] : SL.DEFAULT_RULES[k]; });
    var pl = Array.isArray(s.players) ? s.players : [];
    return {
      board: ['classic', 'moksha', 'random'].indexOf(s.board) >= 0 ? s.board : 'classic',
      count: clampInt(s.count, 2, 4, 2),
      players: DEF_PLAYERS.map(function (d, i) { return cleanPlayer(pl[i], i); }),
      rules: rules,
      sound: s.sound === true
    };
  }
  var settings = cleanSettings(store.get('settings', null));
  function saveSettings() { store.set('settings', settings); }

  /* ---------------- game ---------------- */
  var game = store.get('game', null), resumed = false;
  if (SL.validGame(game)) resumed = game.status === 'playing' && game.moves > 0;
  else game = null;
  function newSeed() { var c = window.crypto; if (c && c.getRandomValues) { var a = new Uint32Array(1); c.getRandomValues(a); return a[0] || 7; } return (Date.now() % 4294967295) || 7; }
  function makeGame() {
    var seed = settings.board === 'random' ? newSeed() : 0;
    var g = SL.newGame(settings.players.slice(0, settings.count), SL.layoutFor(settings.board, seed), settings.rules, settings.board, seed);
    g.startedAt = Date.now();
    return g;
  }
  if (!game) game = makeGame();
  function saveGame() { store.set('game', game); }
  saveGame();

  function pname(i) {
    var p = game.players[i];
    if (p.name && p.name.trim()) return p.name.trim();
    if (p.type === 'cpu') {
      var cpus = game.players.filter(function (q) { return q.type === 'cpu' && !(q.name && q.name.trim()); });
      if (cpus.length < 2) return t('cpu_name');
      return t('cpu_name_n', { n: fmt(cpus.indexOf(p) + 1) });
    }
    return t('name_' + (i + 1));
  }
  function setupName(i) {
    var p = settings.players[i];
    if (p.name.trim()) return p.name.trim();
    return p.type === 'cpu' ? t('cpu_name') : t('name_' + (i + 1));
  }
  function pcolor(i) { return COLORS[game.players[i].color] || COLORS[0]; }
  function pshape(i) { return SHAPES[game.players[i].shape] || 'circle'; }
  function posText(n) { return n > 0 ? t('square_n', { n: fmt(n) }) : t('at_start'); }

  /* ---------------- sound (WebAudio, off by default) ---------------- */
  var actx = null;
  function audio() {
    if (!settings.sound) return null;
    try {
      if (!actx) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; actx = new AC(); }
      if (actx.state === 'suspended' && actx.resume) actx.resume();
      return actx;
    } catch (e) { return null; }
  }
  function tone(f1, f2, delay, len, vol, type) {
    var a = audio(); if (!a) return;
    try {
      var t0 = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
      o.type = type || 'triangle';
      o.frequency.setValueAtTime(f1, t0);
      if (f2 && f2 !== f1) o.frequency.exponentialRampToValueAtTime(f2, t0 + len);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
      o.connect(g); g.connect(a.destination);
      o.start(t0); o.stop(t0 + len + 0.05);
    } catch (e) { }
  }
  var sfx = {
    dice: function () { for (var i = 0; i < 5; i++) tone(500 + i * 90, 0, i * 0.07, 0.04, 0.05, 'square'); },
    step: function () { tone(720, 0, 0, 0.05, 0.06, 'sine'); },
    ladder: function () { tone(330, 990, 0, 0.6, 0.09, 'triangle'); },
    snake: function () { tone(880, 180, 0, 0.75, 0.09, 'sawtooth'); },
    bump: function () { tone(200, 150, 0, 0.2, 0.08, 'square'); },
    win: function () { [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { tone(f, 0, i * 0.12, i === 3 ? 0.6 : 0.2, 0.12, 'triangle'); }); }
  };

  /* ---------------- board + tokens ---------------- */
  var svg = $('#board'), drawn = null, tokenEls = [], busy = false, gen = 0, cpuTimer = null;
  function titleFor(type, i, p) {
    var arrow = t('from_to', { from: fmt(p[0]), to: fmt(p[1]) });
    if (game.board === 'moksha') {
      var item = (type === 'ladder' ? content().virtues : content().vices)[i];
      if (item) return item.name + ': ' + arrow;
    }
    return t(type === 'ladder' ? 'ladder_title' : 'snake_title', { fromto: arrow });
  }
  function drawBoard() {
    drawn = B.draw(svg, game.layout, { startLabel: t('start_label'), title: titleFor });
    tokenEls = game.players.map(function (p, i) {
      var g = B.mk('g', { class: 'token', 'data-p': i }, drawn.tokens), inner = B.mk('g', { class: 't-in' }, g);
      var d = B.shapePath(pshape(i), 26);
      B.mk('ellipse', { cx: 3, cy: 24, rx: 22, ry: 7, class: 't-shadow' }, inner);
      B.mk('path', { d: d, class: 't-body', fill: pcolor(i) }, inner);
      B.mk('path', { d: d, class: 't-line', transform: 'scale(1.2)' }, inner);
      B.mk('circle', { r: 37, class: 't-ring' }, inner);
      return g;
    });
    placeAll();
  }
  function restSpots() {
    var by = {}, out = [];
    game.pos.forEach(function (sq, i) { if (sq > 0) (by[sq] = by[sq] || []).push(i); });
    game.pos.forEach(function (sq, i) {
      if (sq <= 0) { out.push(B.spot(0, 0, 1, i)); return; }
      var list = by[sq]; out.push(B.spot(sq, list.indexOf(i), list.length, i));
    });
    return out;
  }
  function setTok(i, p) { tokenEls[i].setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ') scale(' + (p.s || 1) + ')'); }
  function placeAll() {
    var s = restSpots();
    tokenEls.forEach(function (g, i) {
      setTok(i, s[i]);
      g.classList.toggle('cur', game.status === 'playing' && i === game.turn);
    });
    var cur = tokenEls[game.turn];
    if (cur) drawn.tokens.appendChild(cur);                  // the player whose turn it is sits on top
    svg.setAttribute('aria-label', t('board_aria', { list: game.players.map(function (p, i) { return pname(i) + ': ' + posText(game.pos[i]); }).join(', ') }));
  }

  /* ---------------- animation helpers (requestAnimationFrame) ---------------- */
  function tween(ms, fn) {
    return new Promise(function (res) {
      var my = gen, t0 = performance.now();
      function frame(now) {
        if (my !== gen) return res(false);
        var k = Math.min(1, (now - t0) / ms);
        fn(k);
        if (k < 1) requestAnimationFrame(frame); else res(true);
      }
      requestAnimationFrame(frame);
    });
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function ease(k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }

  function animateMove(res) {
    var i = res.player, my = gen;
    if (reduced() || !tokenEls[i]) return Promise.resolve();
    drawn.tokens.appendChild(tokenEls[i]);
    var start = restSpotsBefore(res), chain = Promise.resolve(), cur = start;
    res.path.forEach(function (sq) {
      chain = chain.then(function () {
        if (my !== gen) return;
        var a = cur, b = B.spot(sq, 0, 1, i);
        cur = b;
        return tween(170, function (k) {
          var e = ease(k);
          setTok(i, { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e - Math.sin(Math.PI * k) * 22, s: 1 });
        }).then(function () { sfx.step(); });
      });
    });
    if (res.via) {
      chain = chain.then(function () {
        if (my !== gen) return;
        var pts;
        if (res.via.type === 'ladder') { pts = [cur, B.spot(res.via.to, 0, 1, i)]; sfx.ladder(); }
        else {
          pts = drawn.geo.snakes[res.via.idx].pts.map(function (p) { return { x: p.x + 6, y: p.y + 10 }; });
          pts.unshift(cur); pts.push(B.spot(res.via.to, 0, 1, i)); sfx.snake();
        }
        var hot = svg.querySelector('.' + res.via.type + '[data-i="' + res.via.idx + '"]');
        if (hot) hot.classList.add('hot');
        var len = Math.hypot(pts[pts.length - 1].x - pts[0].x, pts[pts.length - 1].y - pts[0].y);
        return wait(120).then(function () {
          return tween(Math.min(1400, 450 + len * 1.1), function (k) { var p = B.along(pts, ease(k)); setTok(i, { x: p.x, y: p.y, s: 1 }); });
        }).then(function () { if (hot) hot.classList.remove('hot'); });
      });
    }
    return chain;
  }
  /* where the moving token stood before this roll (positions of the others are already final) */
  function restSpotsBefore(res) {
    var saved = game.pos[res.player];
    game.pos[res.player] = res.from;
    var s = restSpots()[res.player];
    game.pos[res.player] = saved;
    return s;
  }

  /* ---------------- dice ---------------- */
  var FACES = { 1: ['c'], 2: ['tr', 'bl'], 3: ['tr', 'c', 'bl'], 4: ['tl', 'tr', 'bl', 'br'], 5: ['tl', 'tr', 'c', 'bl', 'br'], 6: ['tl', 'tr', 'ml', 'mr', 'bl', 'br'] };
  var lastRoll = 0;
  function showFace(n) {
    var on = FACES[n] || [];
    Array.prototype.forEach.call(document.querySelectorAll('#die .die-pip'), function (c) { c.style.display = on.indexOf(c.getAttribute('data-pip')) >= 0 ? '' : 'none'; });
    $('#die').classList.toggle('red', n === 1);
  }
  function animateDice(value) {
    var die = $('#die');
    if (reduced()) { showFace(value); return Promise.resolve(); }
    sfx.dice();
    die.classList.add('rolling');
    var my = gen, n = 0;
    return new Promise(function (res) {
      (function spin() {
        if (my !== gen) { die.classList.remove('rolling'); return res(); }
        if (n++ < 7) { showFace(1 + ((value + n * 5) % 6)); setTimeout(spin, 70); }
        else { die.classList.remove('rolling'); showFace(value); res(); }
      })();
    });
  }

  /* ---------------- messages ---------------- */
  var lastEvent = resumed ? { type: 'resumed' } : { type: 'ready' };
  function virtueLine(res) {
    if (!res.via) return '';
    if (game.board === 'moksha') {
      var item = (res.via.type === 'ladder' ? content().virtues : content().vices)[res.via.idx];
      if (item) return item.line;
    }
    return t(res.via.type === 'ladder' ? 'big_ladder' : 'big_snake');
  }
  function describe(res) {
    var v = { name: pname(res.player), n: fmt(res.roll), from: fmt(res.from), land: fmt(res.land), to: fmt(res.to), need: fmt(res.need) };
    var parts = [];
    if (res.kind === 'three') parts.push(t('msg_three', v));
    else if (res.kind === 'need6') parts.push(t('msg_need6', v));
    else if (res.kind === 'enter') parts.push(t('msg_enter', v));
    else if (res.kind === 'exact') parts.push(t('msg_exact', v));
    else if (res.kind === 'bounce') parts.push(t('msg_bounce', v));
    else parts.push(t('msg_move', v));
    if (res.via) parts.push(t(res.via.type === 'ladder' ? 'msg_ladder' : 'msg_snake', { fromto: t('from_to', { from: v.land, to: v.to }) }));
    if (res.won) parts.push(t('msg_win', v));
    else if (res.extra) parts.push(t('msg_extra', v));
    return parts.join(' ');
  }
  function renderMsg() {
    var m = $('#msg'), e = lastEvent;
    m.className = 'msg';
    m.textContent = '';
    if (e.type === 'roll') {
      var big = e.res.won ? t('big_win', { name: pname(e.res.player) }) : virtueLine(e.res);
      if (e.res.won) m.classList.add('win'); else if (e.res.via) m.classList.add(e.res.via.type === 'ladder' ? 'up' : 'down');
      if (big) m.appendChild(el('span', { class: 'big', text: big }));
      m.appendChild(document.createTextNode(describe(e.res)));
    } else if (game.status === 'won') {
      m.classList.add('win');
      m.textContent = t('msg_win', { name: pname(game.winner) });
    } else {
      m.textContent = t(e.type === 'resumed' ? 'msg_resumed' : 'msg_ready', { name: pname(game.turn) });
    }
  }

  /* ---------------- side panel ---------------- */
  function renderBanner() {
    var i = game.status === 'won' ? game.winner : game.turn, ban = $('#banner');
    ban.style.setProperty('--pc', pcolor(i));
    $('#gameCard').style.setProperty('--pc', pcolor(i));
    var ic = $('#bannerIcon'); ic.textContent = ''; ic.appendChild(B.tokenIcon(pcolor(i), pshape(i), 34));
    $('#bannerName').textContent = pname(i);
    var cpu = game.players[i].type === 'cpu';
    $('#bannerSub').textContent = game.status === 'won' ? t('turn_won') : (cpu ? t('turn_cpu') : t('turn_human'));
    var canRoll = game.status === 'playing' && !busy && !cpu;
    $('#rollBtn').disabled = !canRoll;
    $('#gameCard').setAttribute('data-state', game.status === 'won' ? 'won' : (busy ? 'busy' : (cpu ? 'cpu' : 'ready')));
    $('#diceLbl').textContent = lastRoll ? t('rolled_n', { n: fmt(lastRoll) }) : t('roll_btn');
    $('#diceHint').textContent = game.status === 'won' ? '' : (cpu ? t('turn_cpu') : t('dice_hint'));
  }
  function renderPlayers() {
    var ul = $('#players'); ul.textContent = '';
    game.players.forEach(function (p, i) {
      var li = el('li', { class: game.status === 'playing' && i === game.turn ? 'cur' : '', style: { '--pc': pcolor(i) } },
        B.tokenIcon(pcolor(i), pshape(i), 28),
        el('span', { class: 'p-txt' },
          el('span', { class: 'p-name no-i18n', text: pname(i) + (p.type === 'cpu' && p.name.trim() ? ' (' + t('type_cpu') + ')' : '') }),
          el('span', { class: 'p-pos', text: posText(game.pos[i]) })));
      ul.appendChild(li);
    });
  }
  function histText(h) {
    var v = { n: fmt(h.r), from: fmt(h.f), land: fmt(h.l), to: fmt(h.t), need: fmt(h.n) };
    var s;
    if (h.k === 'three') s = t('hist_three', v);
    else if (h.k === 'need6') s = t('hist_need6', v);
    else if (h.k === 'exact') s = t('hist_exact', v);
    else s = t('hist_move', { n: v.n, fromto: t('from_to', { from: v.from, to: v.land }) });
    if (h.v) {
      var name = '';
      if (game.board === 'moksha') { var it = (h.v.y === 'L' ? content().virtues : content().vices)[h.v.i]; if (it) name = it.name + ' '; }
      s += ' · ' + (h.v.y === 'L' ? '🪜 ' : '🐍 ') + name + t('from_to', { from: v.land, to: v.to });
    }
    if (h.w) s += ' · 🏆 ' + t('hist_win');
    else if (h.x) s += ' · ' + t('hist_extra');
    return s;
  }
  function renderHistory() {
    var ol = $('#history'); ol.textContent = '';
    var H = game.history;
    if (!H.length) { ol.appendChild(el('li', { class: 'empty', text: t('history_empty') })); return; }
    for (var k = H.length - 1; k >= Math.max(0, H.length - 80); k--) {
      var h = H[k], i = h.p;
      if (!game.players[i]) continue;
      ol.appendChild(el('li', { class: h.v ? (h.v.y === 'L' ? 'up' : 'down') : '' },
        B.tokenIcon(pcolor(i), pshape(i), 18),
        el('span', null, el('b', { class: 'no-i18n', text: pname(i) + ': ' }), histText(h))));
    }
  }
  function rulesSummary(r) {
    var L = [];
    L.push(r.exact ? (r.bounce ? t('rs_bounce') : t('rs_exact')) : t('rs_over'));
    if (r.sixAgain) L.push(r.threeSixes ? t('rs_six') + ', ' + t('rs_three') : t('rs_six'));
    if (r.startSix) L.push(t('rs_start6'));
    return L.join(' · ');
  }
  var eCache = {};
  function expected(layout, rules) {
    var k = JSON.stringify([layout, rules.exact, rules.bounce, rules.startSix]);
    if (!(k in eCache)) eCache[k] = SL.expectedRolls(layout, rules);
    return eCache[k];
  }
  function boardName(b) { return t(b === 'moksha' ? 'board_moksha' : (b === 'random' ? 'board_random' : 'board_classic')); }
  function renderInfo() {
    $('#ruleLine').textContent = t('rules_now', { list: rulesSummary(game.rules) });
    var e = expected(game.layout, game.rules);
    $('#boardInfo').textContent = t('board_info', { board: boardName(game.board), l: fmt(game.layout.ladders.length), s: fmt(game.layout.snakes.length), r: fmt(Math.round(isFinite(e) ? e : 0)) });
    $('#printTitle').textContent = t('app_title') + ' · ' + boardName(game.board);
    var lg = $('#legend'), list = $('#legendList');
    lg.hidden = game.board !== 'moksha';
    list.textContent = '';
    if (game.board === 'moksha') {
      game.layout.ladders.forEach(function (p, i) {
        var it = content().virtues[i]; if (!it) return;
        list.appendChild(el('li', { class: 'v' }, el('span', { class: 'sq', text: '🪜 ' + t('from_to', { from: fmt(p[0]), to: fmt(p[1]) }) }), el('span', null, el('b', { text: it.name }), ' · ' + it.line)));
      });
      game.layout.snakes.forEach(function (p, i) {
        var it = content().vices[i]; if (!it) return;
        list.appendChild(el('li', { class: 'x' }, el('span', { class: 'sq', text: '🐍 ' + t('from_to', { from: fmt(p[0]), to: fmt(p[1]) }) }), el('span', null, el('b', { text: it.name }), ' · ' + it.line)));
      });
    }
  }
  function renderWin() {
    var box = $('#winBox');
    if (game.status !== 'won') { box.hidden = true; $('#confetti').textContent = ''; return; }
    var w = game.winner;
    box.style.setProperty('--pc', pcolor(w));
    $('#winTitle').textContent = t('win_title', { name: pname(w) });
    $('#winSub').textContent = t('win_sub', { n: fmt(game.rolls[w]) });
    var order = game.players.map(function (p, i) { return i; }).sort(function (a, b) { return a === w ? -1 : b === w ? 1 : game.pos[b] - game.pos[a]; });
    var ol = $('#winList'); ol.textContent = '';
    order.forEach(function (i, k) {
      ol.appendChild(el('li', null, B.tokenIcon(pcolor(i), pshape(i), 20), el('span', { class: 'no-i18n', text: fmt(k + 1) + '. ' + pname(i) }), el('span', { class: 'muted', text: '· ' + posText(game.pos[i]) })));
    });
    box.hidden = false;
  }
  function confetti() {
    if (reduced()) return;
    var c = $('#confetti'); c.textContent = '';
    for (var k = 0; k < 40; k++) {
      c.appendChild(el('i', { style: { insetInlineStart: (Math.random() * 100).toFixed(1) + '%', background: COLORS[k % COLORS.length], animationDelay: (Math.random() * 0.9).toFixed(2) + 's', transform: 'rotate(' + Math.round(Math.random() * 180) + 'deg)' } }));
    }
  }
  function renderPanel() { renderBanner(); renderPlayers(); renderHistory(); renderMsg(); renderInfo(); renderWin(); }

  /* ---------------- playing ---------------- */
  function roll(fromCpu) {
    if (busy || game.status !== 'playing') return;
    if (!fromCpu && game.players[game.turn].type === 'cpu') return;
    busy = true;
    clearTimeout(cpuTimer);
    var value = rollValue(), my = gen;
    lastRoll = 0;
    renderBanner();
    animateDice(value).then(function () {
      if (my !== gen) return;
      lastRoll = value;
      var res = SL.applyRoll(game, value);
      saveGame();                                             // a reload mid-animation shows the finished move
      $('#diceLbl').textContent = t('rolled_n', { n: fmt(value) });
      if (res.kind === 'exact' || res.kind === 'need6' || res.kind === 'three') sfx.bump();
      // keep the moving token at its old square while it walks
      var final = game.pos.slice();
      game.pos[res.player] = res.from;
      placeAll();
      game.pos = final;
      return animateMove(res).then(function () {
        if (my !== gen) return;
        busy = false;
        lastEvent = { type: 'roll', res: res };
        placeAll();
        renderPanel();
        if (res.won) { sfx.win(); confetti(); var again = $('#againBtn'); if (again && !reduced()) setTimeout(function () { try { again.focus({ preventScroll: true }); } catch (e) { } }, 50); }
        scheduleCpu();
      });
    });
  }
  function scheduleCpu() {
    clearTimeout(cpuTimer);
    if (game.status !== 'playing' || busy || game.players[game.turn].type !== 'cpu') return;
    cpuTimer = setTimeout(function () { roll(true); }, reduced() ? 350 : 900);
  }
  function restart() {
    gen++;
    busy = false;
    clearTimeout(cpuTimer);
    game = makeGame();
    saveGame();
    lastRoll = 0;
    lastEvent = { type: 'ready' };
    showFace(6);
    drawBoard();
    renderPanel();
    renderDirty();
    scheduleCpu();
  }

  /* ---------------- set-up form ---------------- */
  function renderSetup() {
    Array.prototype.forEach.call(document.querySelectorAll('#boardOpts .bopt'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-board') === settings.board ? 'true' : 'false'); });
    $('#hintClassic').textContent = t('board_classic_hint', { l: fmt(SL.BOARDS.classic.ladders.length), s: fmt(SL.BOARDS.classic.snakes.length) });
    Array.prototype.forEach.call(document.querySelectorAll('#countSeg button'), function (b) { b.setAttribute('aria-pressed', +b.getAttribute('data-n') === settings.count ? 'true' : 'false'); });
    var wrap = $('#playerRows'); wrap.textContent = '';
    for (var i = 0; i < settings.count; i++) wrap.appendChild(playerRow(i));
    var r = settings.rules;
    $('#ruleExact').checked = r.exact; $('#ruleBounce').checked = r.bounce; $('#ruleBounce').disabled = !r.exact;
    $('#bounceWrap').classList.toggle('off', !r.exact);
    $('#ruleSix').checked = r.sixAgain; $('#ruleThree').checked = r.threeSixes; $('#ruleThree').disabled = !r.sixAgain;
    $('#threeWrap').classList.toggle('off', !r.sixAgain);
    $('#ruleStart6').checked = r.startSix;
    renderSound();
    renderDirty();
  }
  function playerRow(i) {
    var p = settings.players[i], id = 'pn' + i;
    var fs = el('fieldset', { class: 'prow', id: 'prow' + i });
    fs.appendChild(el('legend', null, B.tokenIcon(COLORS[p.color], SHAPES[p.shape], 26), el('span', { text: t('player_n', { n: fmt(i + 1) }) })));
    var grid = el('div', { class: 'prow-grid' });
    var name = el('input', { type: 'text', id: id, maxlength: '24', autocomplete: 'off', placeholder: setupName(i), value: p.name, class: 'no-i18n' });
    name.addEventListener('input', function () { p.name = name.value.slice(0, 24); saveSettings(); renderDirty(); });
    grid.appendChild(el('div', { class: 'field' }, el('label', { for: id, text: t('name_label') }), name));
    var seg = el('div', { class: 'seg', role: 'group', 'aria-label': t('type_label') });
    ['human', 'cpu'].forEach(function (ty) {
      seg.appendChild(el('button', { type: 'button', class: 'ptype', 'data-type': ty, 'data-p': i, 'aria-pressed': p.type === ty ? 'true' : 'false', text: (ty === 'cpu' ? '🤖 ' : '🙂 ') + t(ty === 'cpu' ? 'type_cpu' : 'type_human'),
        onclick: function () { p.type = ty; saveSettings(); renderSetup(); } }));
    });
    grid.appendChild(el('div', { class: 'field' }, el('span', { class: 'lbl', text: t('type_label') }), seg));
    var sw = el('div', { class: 'swatches', role: 'radiogroup', 'aria-label': t('colour_label') });
    COLORS.forEach(function (c, k) {
      sw.appendChild(el('button', { type: 'button', class: 'sw', role: 'radio', 'aria-checked': p.color === k ? 'true' : 'false', 'aria-label': t(COLOR_KEYS[k]), title: t(COLOR_KEYS[k]), style: { background: c },
        onclick: function () { p.color = k; saveSettings(); renderSetup(); } }));
    });
    grid.appendChild(el('div', { class: 'field' }, el('span', { class: 'lbl', text: t('colour_label') }), sw));
    var sel = el('select', { id: 'ps' + i });
    SHAPES.forEach(function (s, k) { sel.appendChild(el('option', { value: String(k), text: t('shape_' + s) })); });
    sel.value = String(p.shape);
    sel.addEventListener('change', function () { p.shape = clampInt(sel.value, 0, SHAPES.length - 1, 0); saveSettings(); renderSetup(); });
    grid.appendChild(el('div', { class: 'field' }, el('label', { for: 'ps' + i, text: t('shape_label') }), sel));
    fs.appendChild(grid);
    return fs;
  }
  /* does the set-up differ from the game on the board? (changes start with the next game) */
  function renderDirty() {
    var g = game, s = settings, dirty = g.board !== s.board || g.players.length !== s.count ||
      JSON.stringify(Object.keys(SL.DEFAULT_RULES).map(function (k) { return !!g.rules[k]; })) !== JSON.stringify(Object.keys(SL.DEFAULT_RULES).map(function (k) { return !!s.rules[k]; })) ||
      g.players.some(function (p, i) { var q = s.players[i]; return !q || p.type !== q.type || p.color !== q.color || p.shape !== q.shape || (p.name || '') !== (q.name || ''); });
    $('#dirtyNote').hidden = !dirty;
  }
  function renderSound() {
    var b = $('#soundBtn');
    b.setAttribute('aria-pressed', settings.sound ? 'true' : 'false');
    $('.ic-on', b).hidden = !settings.sound;
    $('.ic-off', b).hidden = settings.sound;
  }

  /* ---------------- events ---------------- */
  $('#rollBtn').addEventListener('click', function () { roll(false); });
  svg.addEventListener('click', function () { roll(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== ' ' && e.code !== 'Space') return;
    var tg = e.target, tag = tg && tg.tagName;
    if (tg && (tg.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A|SUMMARY)$/.test(tag))) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    roll(false);
  });
  $('#boardOpts').addEventListener('click', function (e) {
    var b = e.target.closest('.bopt'); if (!b) return;
    settings.board = b.getAttribute('data-board'); saveSettings(); renderSetup();
  });
  $('#countSeg').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    settings.count = clampInt(b.getAttribute('data-n'), 2, 4, 2); saveSettings(); renderSetup();
  });
  [['ruleExact', 'exact'], ['ruleBounce', 'bounce'], ['ruleSix', 'sixAgain'], ['ruleThree', 'threeSixes'], ['ruleStart6', 'startSix']].forEach(function (x) {
    $('#' + x[0]).addEventListener('change', function (e) { settings.rules[x[1]] = e.target.checked; saveSettings(); renderSetup(); });
  });
  $('#startBtn').addEventListener('click', function () {
    if (game.status === 'playing' && game.moves > 0 && !confirm(t('confirm_new'))) return;
    restart();
    try { $('#gameCard').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }); } catch (e) { }
  });
  $('#againBtn').addEventListener('click', function () { restart(); try { $('#rollBtn').focus({ preventScroll: true }); } catch (e) { } });
  $('#toSetupBtn').addEventListener('click', function () {
    if (document.fullscreenElement) EDU.fullscreen();
    var s = $('#setupCard');
    try { s.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }); } catch (e) { }
  });
  $('#resetBtn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    store.remove('settings'); store.remove('game');
    settings = cleanSettings(null); saveSettings();
    renderSetup();
    restart();
  });
  $('#soundBtn').addEventListener('click', function () { settings.sound = !settings.sound; saveSettings(); renderSound(); if (settings.sound) sfx.step(); });
  $('#fsBtn').addEventListener('click', function () { EDU.fullscreen($('#gameCard')); });
  $('#printBtn').addEventListener('click', function () { window.print(); });

  EDU.onLang(function () { drawBoard(); renderPanel(); renderSetup(); });

  /* test hook (the interaction test makes the dice deterministic); normal play never uses it */
  window.__gameTest = {
    setRolls: function (a) { testRolls = (a || []).map(function (x) { return clampInt(x, 1, 6, 1); }); },
    state: function () { return JSON.parse(JSON.stringify({ pos: game.pos, turn: game.turn, status: game.status, winner: game.winner, board: game.board, layout: game.layout, rules: game.rules, players: game.players, busy: busy, moves: game.moves })); }
  };

  showFace(lastRoll || 6);
  drawBoard();
  renderSetup();
  renderPanel();
  scheduleCpu();
})();
