/* Memory Card Game (concentration). Classic script, no libraries, works from file://.
   Rules followed (the common family version): all cards face down; a turn = turn over two cards.
   Same pair -> both stay face up, the player scores a point and plays again. Different -> both turn back
   and (with 2-4 players) the turn passes to the next player. The game ends when every pair is found. */
(function () {
  'use strict';
  var SLUG = 'memory-match';
  var S = EDU.store(SLUG);
  var C = window.APP_CONTENT || {};
  var $ = EDU.$, t = EDU.t;

  /* ---------------- decks ---------------- */
  var PICS = {
    fruits: ['🥭', '🍌', '🍎', '🍇', '🍉', '🍊', '🍍', '🥥', '🍋', '🍐', '🍑', '🍒', '🍓', '🥕', '🌽', '🍆', '🥔', '🥒', '🍅', '🥦', '🍈', '🥝'],
    animals: ['🐘', '🐅', '🦁', '🐒', '🐄', '🐐', '🐎', '🐪', '🦚', '🐍', '🐢', '🐟', '🦜', '🐇', '🐶', '🐱', '🐭', '🐻', '🦌', '🐿️', '🦆', '🐸', '🐔', '🦉'],
    festival: ['🪔', '🎆', '🎇', '🧨', '🪁', '🎈', '🎁', '🌼', '🌸', '🔔', '🥁', '🕯️', '🎊', '🎉', '🌙', '⭐', '🌾', '🍬', '🌺', '🎀', '🐚', '🎵'],
    vehicles: ['🚗', '🚌', '🚲', '🛺', '🚂', '🚀', '✈️', '🚁', '🚢', '⛵', '🚜', '🚑', '🚒', '🚓', '🏍️', '🛵', '🚚', '🚕', '🚇', '🛶', '🚤', '🚛'],
    sports: ['🏏', '🏑', '⚽', '🏀', '🏸', '🏓', '🎾', '🏐', '♟️', '🥊', '🏹', '🥋', '⛳', '🎳', '🏆', '🥇', '🛹', '🎯', '🏊', '🚴', '🎣', '🤸'],
    food: ['🍛', '🍚', '🥘', '🍲', '🥗', '🥛', '☕', '🥟', '🍮', '🍨', '🍦', '🍯', '🥜', '🍿', '🍬', '🍭', '🍫', '🍪', '🧁', '🥞', '🍳', '🍞']
  };
  var WORD_EMOJI = ['💧', '☀️', '🌙', '⭐', '🌳', '🌸', '🏠', '📖', '⚽', '🐄', '🐶', '🐱', '🐦', '🐟', '🥛', '🌧️', '✋', '🍎'];
  var DECKS = [
    { id: 'fruits', kind: 'pic', key: 'd_fruits' }, { id: 'animals', kind: 'pic', key: 'd_animals' },
    { id: 'festival', kind: 'pic', key: 'd_festival' }, { id: 'vehicles', kind: 'pic', key: 'd_vehicles' },
    { id: 'sports', kind: 'pic', key: 'd_sports' }, { id: 'food', kind: 'pic', key: 'd_food' },
    { id: 'numbers', kind: 'learn', key: 'd_numbers', max: 20 }, { id: 'letters', kind: 'learn', key: 'd_letters', max: 18 },
    { id: 'words', kind: 'learn', key: 'd_words', max: 18 }, { id: 'shapes', kind: 'learn', key: 'd_shapes', max: 12 },
    { id: 'maths', kind: 'learn', key: 'd_maths', max: 18 }
  ];
  DECKS.forEach(function (d) { if (d.kind === 'pic') d.max = PICS[d.id].length; });
  function deckById(id) { for (var i = 0; i < DECKS.length; i++) if (DECKS[i].id === id) return DECKS[i]; return DECKS[0]; }

  var SIZES = [
    { id: '2x3', r: 2, c: 3, key: 'lv_tiny' }, { id: '3x4', r: 3, c: 4, key: 'lv_easy' }, { id: '4x4', r: 4, c: 4, key: 'lv_medium' },
    { id: '4x5', r: 4, c: 5, key: 'lv_hard' }, { id: '5x6', r: 5, c: 6, key: 'lv_expert' }, { id: '6x6', r: 6, c: 6, key: 'lv_master' }
  ];
  function sizeById(id) { for (var i = 0; i < SIZES.length; i++) if (SIZES[i].id === id) return SIZES[i]; return SIZES[1]; }
  function pairsOf(sz) { return sz.r * sz.c / 2; }

  /* shapes drawn here (viewBox 0 0 100 100); order matches content.js shapes */
  function poly(n, r, rot, cx, cy) { var p = []; for (var i = 0; i < n; i++) { var a = rot + i * 2 * Math.PI / n; p.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1)); } return p.join(' '); }
  function starPts() { var p = []; for (var i = 0; i < 10; i++) { var r = i % 2 ? 19 : 46, a = -Math.PI / 2 + i * Math.PI / 5; p.push((50 + r * Math.cos(a)).toFixed(1) + ',' + (53 + r * Math.sin(a)).toFixed(1)); } return p.join(' '); }
  function crescentPts() {
    var p = [], i, a;
    for (i = 0; i <= 24; i++) { a = Math.PI / 2 + i * Math.PI / 24; p.push((56 + 42 * Math.cos(a)).toFixed(1) + ',' + (50 + 42 * Math.sin(a)).toFixed(1)); }
    /* inner arc: circle centred to the right, from the top tip back to the bottom tip through its leftmost point */
    var cx = 56 + 30, r = Math.sqrt(30 * 30 + 42 * 42), a0 = 2 * Math.PI + Math.atan2(-42, -30), a1 = Math.atan2(42, -30);
    for (i = 0; i <= 24; i++) { a = a0 - (a0 - a1) * i / 24; p.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (50 + r * Math.sin(a)).toFixed(1)); }
    return p.join(' ');
  }
  var SHAPES = [
    '<circle cx="50" cy="50" r="42"/>',
    '<rect x="12" y="12" width="76" height="76"/>',
    '<polygon points="50,8 94,88 6,88"/>',
    '<rect x="4" y="26" width="92" height="48"/>',
    '<ellipse cx="50" cy="50" rx="46" ry="28"/>',
    '<polygon points="' + starPts() + '"/>',
    '<path d="M50 90C22 68 5 51 5 31 5 17 16 7 29 7c9 0 17 5 21 13 4-8 12-13 21-13 13 0 24 10 24 24 0 20-17 37-45 59z"/>',
    '<polygon points="' + poly(5, 46, -Math.PI / 2, 50, 54) + '"/>',
    '<polygon points="' + poly(6, 46, 0, 50, 50) + '"/>',
    '<path d="M4 70A46 46 0 0 1 96 70Z"/>',
    '<polygon points="4,38 54,38 54,16 96,50 54,84 54,62 4,62"/>',
    '<polygon points="' + crescentPts() + '"/>'
  ];
  function shapeSvg(i, cls) { return '<svg class="' + (cls || 'mm-shape') + '" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><g fill="currentColor">' + SHAPES[i] + '</g></svg>'; }

  /* ---------------- settings + state ---------------- */
  var DEF = { deck: 'fruits', size: '3x4', mode: 'solo', players: 2, names: ['', '', '', ''], sound: false, speak: false };
  var settings = Object.assign({}, DEF, S.get('settings', {}) || {});
  if (!Array.isArray(settings.names)) settings.names = ['', '', '', ''];
  while (settings.names.length < 4) settings.names.push('');
  settings.deck = deckById(settings.deck).id;
  settings.size = sizeById(settings.size).id;
  if (['solo', 'players', 'practice'].indexOf(settings.mode) < 0) settings.mode = 'solo';
  settings.players = EDU.clamp(parseInt(settings.players, 10) || 2, 2, 4);
  var best = S.get('best', {}) || {};
  if (typeof best !== 'object' || Array.isArray(best)) best = {};

  var test = { noShuffle: false, missMs: 1100, peekMs: null };
  var game = null, missTimer = null, peekTimer = null, running = false, t0 = 0, focusIdx = 0, lastFace = null, warnedVoice = false;
  var SYM = ['●', '▲', '■', '◆'];

  function saveSettings() { S.set('settings', settings); }
  function saveGame() { if (!game) return; game.elapsed = timeNow(); S.set('game', game); }
  function timeNow() { return game ? game.elapsed + (running ? Date.now() - t0 : 0) : 0; }
  function fmtTime(ms) { var s = Math.floor(ms / 1000), m = Math.floor(s / 60); s = s % 60; return m + ':' + (s < 10 ? '0' : '') + s; }
  function shuffle(a) { return test.noShuffle ? a.slice() : EDU.shuffle(a); }
  function playerName(i) { var n = (settings.names[i] || '').trim(); return n || t('player_default', { n: i + 1 }); }
  function isMulti() { return game && game.mode === 'players'; }
  function reduced() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }

  /* ---------------- faces ---------------- */
  function lc() { return C[EDU.lang] || C.en; }
  function sizeCls(s, big) {
    var n = Array.from(String(s)).length;
    if (big) return n <= 2 ? 'f-xl' : n <= 5 ? 'f-l' : n <= 7 ? 'f-m' : 'f-s';
    return n <= 2 ? 'f-xl' : n <= 4 ? 'f-l' : n <= 7 ? 'f-m' : n <= 10 ? 'f-s' : 'f-xs';
  }
  function txt(s, opts) {
    opts = opts || {};
    var wrap = / /.test(String(s)) && !opts.big;
    return '<span class="mm-txt ' + sizeCls(s, opts.big) + (opts.lat ? ' lat' : '') + (wrap ? '' : ' nw') + '"' + (opts.lang ? ' lang="' + opts.lang + '"' : '') + ' dir="auto">' + EDU.esc(s) + '</span>';
  }
  function emo(e, sm) { return '<span class="mm-emoji' + (sm ? ' sm' : '') + '" aria-hidden="true">' + e + '</span>'; }
  /* returns {html, label, say, lang} for one side of one item */
  function faceFor(deckId, item, side) {
    var L = lc(), en = C.en;
    switch (deckId) {
      case 'numbers': {
        var num = String(item + 1);
        return side ? { html: txt(L.nums[item]), label: L.nums[item], say: L.nums[item] } : { html: txt(num, { big: true, lat: true }), label: num, say: num };
      }
      case 'letters': {
        var r = L.letters[item];
        return side ? { html: emo(r[2], true) + txt(r[1]), label: r[1], say: r[1] } : { html: txt(r[0]), label: r[0], say: r[0] };
      }
      case 'words': {
        if (!side) return { html: txt(en.words[item], { lat: true, lang: 'en' }), label: en.words[item], say: en.words[item], lang: 'en' };
        if (EDU.lang === 'en') return { html: emo(WORD_EMOJI[item]), label: WORD_EMOJI[item], say: null };
        return { html: emo(WORD_EMOJI[item], true) + txt(L.words[item]), label: L.words[item], say: L.words[item] };
      }
      case 'shapes':
        return side ? { html: txt(L.shapes[item]), label: L.shapes[item], say: L.shapes[item] } : { html: shapeSvg(item), label: L.shapes[item], say: null };
      case 'maths': {
        var q = item.a + ' ' + (item.op === '-' ? '−' : '+') + ' ' + item.b, a = String(item.a + (item.op === '-' ? -item.b : item.b));
        return side ? { html: txt(a, { big: true, lat: true }), label: a, say: a } : { html: txt(q, { big: true, lat: true }), label: q, say: q };
      }
      default: {
        var e = PICS[deckId][item];
        return { html: emo(e), label: e, say: null };
      }
    }
  }

  /* ---------------- new game ---------------- */
  function pickItems(deck, n) {
    if (deck.id === 'maths') {
      var ans = []; for (var v = 2; v <= 20; v++) ans.push(v);
      ans = shuffle(ans).slice(0, n);
      return ans.map(function (x) {
        if (test.noShuffle) { var h = Math.floor(x / 2); return { a: h, b: x - h, op: '+' }; }
        if (Math.random() < 0.45 && x <= 17) { var b = EDU.randInt(1, Math.min(9, 20 - x)); return { a: x + b, b: b, op: '-' }; }
        var a = EDU.randInt(1, x - 1); return { a: a, b: x - a, op: '+' };
      });
    }
    var idx = []; for (var i = 0; i < deck.max; i++) idx.push(i);
    return shuffle(idx).slice(0, n);
  }
  function fitSize() {
    var d = deckById(settings.deck), sz = sizeById(settings.size);
    if (pairsOf(sz) > d.max) {
      for (var i = SIZES.length - 1; i >= 0; i--) if (pairsOf(SIZES[i]) <= d.max) { settings.size = SIZES[i].id; break; }
    }
  }
  function newGame() {
    clearTimeout(missTimer); missTimer = null; clearInterval(peekTimer); peekTimer = null;
    fitSize();
    var deck = deckById(settings.deck), sz = sizeById(settings.size), n = pairsOf(sz);
    var items = pickItems(deck, n), cards = [];
    for (var p = 0; p < n; p++) { cards.push({ p: p, s: 0 }); cards.push({ p: p, s: 1 }); }
    cards = shuffle(cards);
    var np = settings.mode === 'players' ? settings.players : 1, scores = [];
    for (var k = 0; k < np; k++) scores.push(0);
    game = { v: 1, deck: deck.id, size: sz.id, mode: settings.mode, np: np, items: items, cards: cards,
      st: cards.map(function () { return 0; }), by: cards.map(function () { return -1; }), up: [],
      moves: 0, found: 0, elapsed: 0, scores: scores, turn: 0, done: false };
    running = false; focusIdx = 0; lastFace = null;
    saveGame();
    hideResult();
    renderBoard();
    renderStats();
    setMsg(isMulti() ? t('turn_of', { name: playerName(0) }) : t('msg_start'));
    if (game.mode === 'practice') startPeek();
  }
  function resumeGame() {
    var g = S.get('game', null);
    if (!g || g.v !== 1 || g.done || !Array.isArray(g.cards) || !Array.isArray(g.st) || g.cards.length !== g.st.length) return false;
    if (g.deck !== settings.deck || g.size !== settings.size || g.mode !== settings.mode) return false;
    if (g.mode === 'players' && g.np !== settings.players) return false;
    var sz = sizeById(g.size);
    if (g.cards.length !== sz.r * sz.c || !Array.isArray(g.items) || g.items.length !== g.cards.length / 2) return false;
    g.st = g.st.map(function (x) { return x === 2 ? 2 : 0; });
    g.up = []; g.peeking = false;
    if (!Array.isArray(g.by)) g.by = g.cards.map(function () { return -1; });
    g.elapsed = +g.elapsed || 0;
    game = g; running = false;
    renderBoard(); renderStats();
    setMsg(isMulti() ? t('turn_of', { name: playerName(game.turn) }) : t('msg_start'));
    return true;
  }

  /* ---------------- practice peek ---------------- */
  function startPeek() {
    var board = $('#board'), n = game.cards.length / 2;
    var ms = test.peekMs != null ? test.peekMs : Math.round(2000 + n * 330);
    var end = Date.now() + ms;
    game.peeking = true;
    board.classList.add('peek');
    EDU.$$('.mm-card', board).forEach(function (b) { b.classList.add('up'); });
    function tick() {
      var left = Math.ceil((end - Date.now()) / 1000);
      if (left > 0) { setMsg(t('peek_msg', { n: EDU.fmt(left) })); return; }
      clearInterval(peekTimer); peekTimer = null;
      game.peeking = false;
      board.classList.remove('peek');
      for (var i = 0; i < game.cards.length; i++) updateCard(i);
      setMsg(t('msg_start'));
    }
    tick();
    peekTimer = setInterval(tick, Math.min(250, Math.max(30, ms / 4)));
  }

  /* ---------------- board ---------------- */
  function colsFor(sz) {
    var portrait = window.innerWidth < 640 || window.innerWidth < window.innerHeight;
    return portrait ? Math.min(sz.r, sz.c) : Math.max(sz.r, sz.c);
  }
  function applyCols() {
    if (!game) return;
    var sz = sizeById(game.size), board = $('#board'), c = colsFor(sz);
    if (board.style.getPropertyValue('--cols') !== String(c)) {
      board.style.setProperty('--cols', c);
      board.style.setProperty('--rows', sz.r * sz.c / c);
      if (board.children.length) fitText(board);
    }
  }
  function renderBoard() {
    var board = $('#board');
    board.textContent = '';
    board.classList.remove('peek');
    var frag = document.createDocumentFragment();
    game.cards.forEach(function (cd, i) {
      var f = faceFor(game.deck, game.items[cd.p], cd.s);
      var b = EDU.el('button', { type: 'button', class: 'mm-card', 'data-i': i, tabindex: i === focusIdx ? '0' : '-1' },
        EDU.el('span', { class: 'mm-inner' },
          EDU.el('span', { class: 'mm-back', 'aria-hidden': 'true' }),
          EDU.el('span', { class: 'mm-face no-i18n', 'aria-hidden': 'true', html: f.html })));
      frag.appendChild(b);
    });
    board.appendChild(frag);
    board.style.removeProperty('--cols');
    applyCols();
    for (var i = 0; i < game.cards.length; i++) updateCard(i);
    fitText(board);
    $('#sayBtn').hidden = deckById(game.deck).kind !== 'learn';
  }
  /* biggest text size that fits each card without breaking a word (size classes are in cqi, so they scale with the card) */
  var FIT = ['f-xl', 'f-l', 'f-m', 'f-s', 'f-xs', 'f-xxs'];
  function fitText(root) {
    EDU.$$('.mm-txt', root).forEach(function (el) {
      var face = el.parentElement, k = 0;
      FIT.forEach(function (c) { el.classList.remove(c); });
      el.classList.add(FIT[0]);
      while (k < FIT.length - 1 && (el.scrollWidth > el.clientWidth + 1 || face.scrollHeight > face.clientHeight + 1)) {
        el.classList.remove(FIT[k]); k++; el.classList.add(FIT[k]);
      }
    });
  }
  function cardEl(i) { return $('#board').children[i]; }
  function updateCard(i) {
    var b = cardEl(i); if (!b) return;
    var st = game.st[i], cd = game.cards[i];
    var f = faceFor(game.deck, game.items[cd.p], cd.s);
    b.classList.toggle('up', st === 1 || (!!game.peeking));
    b.classList.toggle('done', st === 2);
    b.setAttribute('aria-label', st === 2 ? t('card_done', { n: i + 1, face: f.label }) : st === 1 ? t('card_up', { n: i + 1, face: f.label }) : t('card_down', { n: i + 1 }));
    if (st === 2) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled');
    var face = b.querySelector('.mm-face'), by = face.querySelector('.mm-by');
    if (st === 2 && isMulti() && game.by[i] >= 0) {
      if (!by) { by = EDU.el('span', { class: 'mm-by', 'aria-hidden': 'true' }); face.appendChild(by); }
      by.textContent = SYM[game.by[i]];
      by.style.color = 'var(--' + ['c1', 'c2', 'c3', 'c5'][game.by[i]] + ')';
    } else if (by) by.remove();
  }
  function setFocus(i, move) {
    var cards = $('#board').children;
    if (!cards.length) return;
    i = EDU.clamp(i, 0, cards.length - 1);
    if (cards[focusIdx]) cards[focusIdx].setAttribute('tabindex', '-1');
    focusIdx = i;
    cards[i].setAttribute('tabindex', '0');
    if (move) cards[i].focus();
  }

  /* ---------------- play ---------------- */
  function flip(i) {
    if (!game || game.done || game.peeking) return;
    if (game.st[i] !== 0) return;
    if (missTimer) { clearTimeout(missTimer); resolveMiss(); }   /* a quick third tap turns the two back at once */
    if (game.st[i] !== 0) return;
    if (!running) { running = true; t0 = Date.now(); }
    game.st[i] = 1; game.up.push(i);
    updateCard(i);
    var cd = game.cards[i], f = faceFor(game.deck, game.items[cd.p], cd.s);
    lastFace = f;
    $('#srLive').textContent = t('card_up', { n: i + 1, face: f.label });
    sound('flip');
    if (settings.speak && f.say) say(f);
    if (game.up.length < 2) { saveGame(); return; }
    var a = game.up[0], b = game.up[1];
    game.moves++;
    if (game.cards[a].p === game.cards[b].p) {
      game.st[a] = game.st[b] = 2; game.by[a] = game.by[b] = game.turn; game.up = [];
      game.found++; game.scores[game.turn]++;
      [a, b].forEach(function (k) { updateCard(k); var el = cardEl(k); el.classList.add('justdone'); setTimeout(function () { el.classList.remove('justdone'); }, 450); });
      sound('match');
      if (game.found === game.cards.length / 2) { finish(); return; }
      setMsg(isMulti() ? t('msg_match_p', { name: playerName(game.turn) }) : t('msg_match'));
    } else {
      [a, b].forEach(function (k) { cardEl(k).classList.add('miss'); });
      sound('miss');
      var next = isMulti() ? (game.turn + 1) % game.np : 0;
      setMsg(isMulti() ? t('msg_miss_p', { name: playerName(next) }) : t('msg_miss'));
      missTimer = setTimeout(function () { missTimer = null; resolveMiss(); }, test.missMs);
    }
    renderStats();
    saveGame();
  }
  function resolveMiss() {
    if (!game) return;
    game.up.forEach(function (k) { if (game.st[k] === 1) game.st[k] = 0; var el = cardEl(k); if (el) el.classList.remove('miss'); updateCard(k); });
    game.up = [];
    if (isMulti()) game.turn = (game.turn + 1) % game.np;
    renderStats();
    saveGame();
  }
  function stars(p, m) { return m <= Math.ceil(p * 1.6) ? 3 : m <= Math.ceil(p * 2.3) ? 2 : 1; }
  function finish() {
    game.elapsed = timeNow(); running = false; game.done = true;
    var p = game.cards.length / 2, newBest = false;
    if (game.mode === 'solo') {
      var key = game.deck + '|' + game.size, old = best[key];
      if (!old || game.moves < old.m || (game.moves === old.m && game.elapsed < old.t)) {
        best[key] = { m: game.moves, t: game.elapsed, s: stars(p, game.moves) };
        S.set('best', best); newBest = true;
      }
    }
    game.newBest = newBest;
    S.set('game', game);
    renderStats(); renderBest();
    sound('win');
    setMsg(game.mode === 'players' ? winnerText() : t('res_solo'));
    setTimeout(showResult, reduced() ? 50 : 650);
  }
  function winnerText() {
    var mx = Math.max.apply(null, game.scores), w = [];
    game.scores.forEach(function (s, i) { if (s === mx) w.push(i); });
    return w.length === 1 ? t('res_win', { name: playerName(w[0]) }) : t('res_tie');
  }

  /* ---------------- result screen ---------------- */
  function showResult() {
    if (!game || !game.done) return;
    var r = $('#result'), multi = game.mode === 'players', p = game.cards.length / 2;
    $('#resIcon').textContent = multi ? '🏆' : '🎉';
    $('#resTitle').textContent = multi ? winnerText() : t('res_solo');
    var stEl = $('#resStars'), stats = $('#resStats'), rank = $('#resRank');
    stEl.textContent = ''; stats.textContent = ''; rank.textContent = '';
    if (multi) {
      stEl.hidden = true; stats.hidden = true; rank.hidden = false;
      $('#resText').textContent = '';
      var mx = Math.max.apply(null, game.scores);
      game.scores.map(function (s, i) { return { s: s, i: i }; }).sort(function (a, b) { return b.s - a.s || a.i - b.i; }).forEach(function (o) {
        rank.appendChild(EDU.el('li', { class: o.s === mx ? 'win' : '' },
          EDU.el('span', { class: 'mm-sym', style: { color: 'var(--' + ['c1', 'c2', 'c3', 'c5'][o.i] + ')' }, 'aria-hidden': 'true', text: SYM[o.i] }),
          EDU.el('span', { class: 'nm', text: playerName(o.i) }),
          EDU.el('b', { text: t('res_pairs', { n: EDU.fmt(o.s) }) })));
      });
    } else {
      var n = stars(p, game.moves);
      stEl.hidden = false; stats.hidden = false; rank.hidden = true;
      stEl.setAttribute('role', 'img'); stEl.setAttribute('aria-label', t('stars', { n: n }));
      for (var i = 0; i < 3; i++) stEl.appendChild(EDU.el('span', { class: i < n ? '' : 'off', 'aria-hidden': 'true', text: '★' }));
      $('#resText').textContent = t('res_solo_text', { pairs: EDU.fmt(p), moves: EDU.fmt(game.moves), time: fmtTime(game.elapsed) });
      stats.appendChild(EDU.el('div', null, EDU.el('b', { id: 'resMoves', text: EDU.fmt(game.moves) }), EDU.el('span', { text: t('moves') })));
      stats.appendChild(EDU.el('div', null, EDU.el('b', { id: 'resTime', text: fmtTime(game.elapsed) }), EDU.el('span', { text: t('time') })));
    }
    $('#resBest').hidden = !(game.mode === 'solo' && game.newBest);
    $('#resPractice').hidden = game.mode !== 'practice';
    r.hidden = false;
    confetti();
    try { $('#againBtn').focus({ preventScroll: true }); } catch (e) { $('#againBtn').focus(); }
  }
  function hideResult() { $('#result').hidden = true; $('#confetti').textContent = ''; }
  function confetti() {
    var box = $('#confetti'); box.textContent = '';
    if (reduced()) return;
    var cols = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6', '--c7'];
    for (var i = 0; i < 36; i++) {
      box.appendChild(EDU.el('i', { style: { insetInlineStart: (Math.random() * 100).toFixed(1) + '%', background: 'var(' + cols[i % cols.length] + ')', animationDelay: (Math.random() * 0.8).toFixed(2) + 's', animationDuration: (2 + Math.random() * 1.5).toFixed(2) + 's' } }));
    }
    setTimeout(function () { box.textContent = ''; }, 4500);
  }

  /* ---------------- stats bar ---------------- */
  function stat(label, value, id, cls) {
    return EDU.el('span', { class: 'mm-stat' + (cls ? ' ' + cls : '') }, EDU.el('span', { text: label }), EDU.el('b', { id: id, text: value }));
  }
  function renderStats() {
    var box = $('#stats'); box.textContent = '';
    if (!game) return;
    var p = game.cards.length / 2;
    if (isMulti()) {
      var wrap = EDU.el('div', { class: 'mm-players', role: 'list', 'aria-label': t('scoreboard') });
      game.scores.forEach(function (s, i) {
        var on = i === game.turn && !game.done;
        wrap.appendChild(EDU.el('span', { class: 'mm-pl p' + (i + 1) + (on ? ' on' : ''), role: 'listitem', id: 'pl' + i, 'aria-current': on ? 'true' : null },
          EDU.el('span', { class: 'arrow', 'aria-hidden': 'true', text: '▶' }),
          EDU.el('span', { class: 'mm-sym', 'aria-hidden': 'true', text: SYM[i] }),
          EDU.el('span', { class: 'nm' + ((settings.names[i] || '').trim() ? ' no-i18n' : ''), text: playerName(i) }),
          EDU.el('b', { class: 'sc', text: EDU.fmt(s) })));
      });
      box.appendChild(wrap);
      box.appendChild(stat(t('pairs'), EDU.fmt(game.found) + '/' + EDU.fmt(p), 'stPairs'));
    } else {
      box.appendChild(stat(t('moves'), EDU.fmt(game.moves), 'stMoves'));
      box.appendChild(stat(t('time'), fmtTime(timeNow()), 'stTime'));
      box.appendChild(stat(t('pairs'), EDU.fmt(game.found) + '/' + EDU.fmt(p), 'stPairs'));
      if (game.mode === 'solo') {
        var b = best[game.deck + '|' + game.size];
        box.appendChild(stat(t('best'), b ? t('best_val', { moves: EDU.fmt(b.m), time: fmtTime(b.t) }) : t('no_best'), 'stBest', 'best'));
      }
    }
  }
  setInterval(function () { if (running && game && !game.done) { var el = document.getElementById('stTime'); if (el) { var v = fmtTime(timeNow()); if (el.textContent !== v) el.textContent = v; } } }, 500);
  function setMsg(s) { $('#msg').textContent = s; }

  /* ---------------- best scores table ---------------- */
  function renderBest() {
    var tb = $('#bestTable'), keys = [];
    DECKS.forEach(function (d) { SIZES.forEach(function (sz) { var k = d.id + '|' + sz.id; if (best[k]) keys.push([d, sz, best[k]]); }); });
    $('#bestEmpty').hidden = keys.length > 0;
    tb.hidden = !keys.length;
    tb.textContent = '';
    if (!keys.length) return;
    var head = EDU.el('tr', null, ['col_cards', 'col_board', 'col_moves', 'col_time', 'col_stars'].map(function (k) { return EDU.el('th', { scope: 'col', text: t(k) }); }));
    tb.appendChild(EDU.el('thead', null, head));
    var body = EDU.el('tbody');
    keys.forEach(function (r) {
      body.appendChild(EDU.el('tr', null,
        EDU.el('td', { text: t(r[0].key) }), EDU.el('td', { text: r[1].r + '×' + r[1].c }),
        EDU.el('td', { text: EDU.fmt(r[2].m) }), EDU.el('td', { text: fmtTime(r[2].t) }),
        EDU.el('td', { 'aria-label': t('stars', { n: r[2].s }), text: '★★★'.slice(0, r[2].s) })));
    });
    tb.appendChild(body);
  }

  /* ---------------- settings UI ---------------- */
  function renderSettings() {
    var ds = $('#deck'); ds.textContent = '';
    [['pic', 'grp_pics'], ['learn', 'grp_learn']].forEach(function (g) {
      var og = EDU.el('optgroup', { label: t(g[1]) });
      DECKS.filter(function (d) { return d.kind === g[0]; }).forEach(function (d) { og.appendChild(EDU.el('option', { value: d.id, text: t(d.key) })); });
      ds.appendChild(og);
    });
    ds.value = settings.deck;
    var ss = $('#size'), d = deckById(settings.deck); ss.textContent = '';
    SIZES.forEach(function (sz) {
      var ok = pairsOf(sz) <= d.max;
      ss.appendChild(EDU.el('option', { value: sz.id, disabled: !ok, text: t(sz.key) + ' · ' + sz.r + '×' + sz.c + (ok ? '' : ' (' + t('size_na') + ')') }));
    });
    ss.value = settings.size;
    EDU.$$('#modeSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === settings.mode)); });
    $('#modeHint').textContent = t('m_' + settings.mode + '_hint');
    $('#playersBox').hidden = settings.mode !== 'players';
    EDU.$$('#countSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.n === settings.players)); });
    var nm = $('#names'); nm.textContent = '';
    for (var i = 0; i < settings.players; i++) {
      (function (i) {
        var inp = EDU.el('input', { type: 'text', id: 'pname' + i, class: 'no-i18n', maxlength: '20', autocomplete: 'off', placeholder: t('player_default', { n: i + 1 }) });
        inp.value = settings.names[i] || '';
        inp.addEventListener('input', function () { settings.names[i] = inp.value.slice(0, 20); saveSettings(); renderStats(); });
        nm.appendChild(EDU.el('label', { class: 'field', for: 'pname' + i },
          EDU.el('span', null, EDU.el('span', { class: 'mm-sym', style: { color: 'var(--' + ['c1', 'c2', 'c3', 'c5'][i] + ')' }, 'aria-hidden': 'true', text: SYM[i] + ' ' }), t('player_name', { n: i + 1 })), inp));
      })(i);
    }
    $('#soundChk').checked = !!settings.sound;
    $('#speakChk').checked = !!settings.speak;
  }

  $('#deck').addEventListener('change', function () { settings.deck = this.value; fitSize(); saveSettings(); renderSettings(); newGame(); });
  $('#size').addEventListener('change', function () { settings.size = this.value; saveSettings(); newGame(); });
  EDU.$$('#modeSeg button').forEach(function (b) {
    b.addEventListener('click', function () { settings.mode = b.dataset.mode; saveSettings(); renderSettings(); newGame(); });
  });
  EDU.$$('#countSeg button').forEach(function (b) {
    b.addEventListener('click', function () { settings.players = +b.dataset.n; saveSettings(); renderSettings(); newGame(); });
  });
  $('#soundChk').addEventListener('change', function () { settings.sound = this.checked; saveSettings(); if (settings.sound) sound('flip'); });
  $('#speakChk').addEventListener('change', function () { settings.speak = this.checked; saveSettings(); if (!settings.speak) EDU.stopSpeaking(); });
  $('#newGame').addEventListener('click', newGame);
  $('#againBtn').addEventListener('click', function () { newGame(); setFocus(0, true); });
  $('#changeBtn').addEventListener('click', function () { hideResult(); var d = $('#deck'); d.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' }); d.focus({ preventScroll: true }); });
  $('#fsBtn').addEventListener('click', function () { EDU.fullscreen($('#play')); });
  $('#sayBtn').addEventListener('click', function () { if (lastFace && lastFace.say) say(lastFace); else EDU.toast(t('no_word')); });
  $('#printBtn').addEventListener('click', printCards);
  $('#resetScores').addEventListener('click', function () {
    if (!confirm(t('confirm_scores'))) return;
    best = {}; S.remove('best'); renderBest(); renderStats(); EDU.toast(t('scores_cleared'));
  });

  var board = $('#board');
  board.addEventListener('click', function (e) {
    var b = e.target.closest('.mm-card'); if (!b) return;
    var i = +b.dataset.i; setFocus(i, false); flip(i);
  });
  board.addEventListener('keydown', function (e) {
    var b = e.target.closest('.mm-card'); if (!b || !game) return;
    var i = +b.dataset.i, cols = +board.style.getPropertyValue('--cols') || 4, n = game.cards.length, rtl = document.documentElement.dir === 'rtl', j = null;
    switch (e.key) {
      case 'ArrowRight': j = i + (rtl ? -1 : 1); break;
      case 'ArrowLeft': j = i + (rtl ? 1 : -1); break;
      case 'ArrowDown': j = i + cols; break;
      case 'ArrowUp': j = i - cols; break;
      case 'Home': j = 0; break;
      case 'End': j = n - 1; break;
      default: return;
    }
    e.preventDefault();
    if (j >= 0 && j < n) setFocus(j, true);
  });
  var rz = 0;
  window.addEventListener('resize', function () { if (rz) return; rz = requestAnimationFrame(function () { rz = 0; applyCols(); }); });

  /* ---------------- sound (Web Audio, off by default) ---------------- */
  var actx = null;
  function sound(kind) {
    if (!settings.sound) return;
    try {
      if (!actx) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; actx = new AC(); }
      if (actx.state === 'suspended') actx.resume();
      var seq = { flip: [[520, 0.05]], match: [[660, 0.09], [880, 0.14]], miss: [[240, 0.12], [190, 0.16]], win: [[523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.3]] }[kind] || [];
      var at = actx.currentTime + 0.01;
      seq.forEach(function (s) {
        var o = actx.createOscillator(), g = actx.createGain();
        o.type = kind === 'miss' ? 'triangle' : 'sine'; o.frequency.value = s[0];
        g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.18, at + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, at + s[1]);
        o.connect(g); g.connect(actx.destination); o.start(at); o.stop(at + s[1] + 0.02);
        at += s[1] * 0.85;
      });
    } catch (e) { }
  }
  function say(f) {
    EDU.speak(f.say, { lang: f.lang || EDU.lang, rate: 0.9 }).then(function (ok) { if (!ok && !warnedVoice) { warnedVoice = true; EDU.toast(t('no_voice')); } });
  }

  /* ---------------- print a paper set ---------------- */
  function printCards() {
    if (!game) return;
    var area = $('#printArea'); area.textContent = '';
    area.appendChild(EDU.el('h1', { text: t('app_title') + ': ' + t(deckById(game.deck).key) }));
    area.appendChild(EDU.el('p', { text: t('print_title') + ' · ' + t('print_tip') }));
    var grid = EDU.el('div', { class: 'pr-grid' });
    for (var p = 0; p < game.items.length; p++) {
      for (var s = 0; s < 2; s++) {
        var f = faceFor(game.deck, game.items[p], s), html = f.html;
        html = html.replace(/mm-emoji( sm)?/g, 'pe').replace(/mm-txt [^"]*/g, function (m) { return /f-xl|f-l/.test(m) ? 'pt big' : 'pt'; }).replace('class="mm-shape"', '');
        grid.appendChild(EDU.el('div', { class: 'pr-card no-i18n', html: html }));
      }
    }
    area.appendChild(grid);
    setTimeout(function () { window.print(); }, 60);
  }

  /* ---------------- language ---------------- */
  function renderAll() {
    renderSettings();
    if (game) {
      for (var i = 0; i < game.cards.length; i++) {
        var cd = game.cards[i], el = cardEl(i);
        if (el) el.querySelector('.mm-face').innerHTML = faceFor(game.deck, game.items[cd.p], cd.s).html;
        updateCard(i);
      }
      fitText($('#board'));
      renderStats();
      if (!game.peeking) setMsg(game.done ? (game.mode === 'players' ? winnerText() : t('res_solo')) : isMulti() ? t('turn_of', { name: playerName(game.turn) }) : t('msg_start'));
      if (!$('#result').hidden) showResult();
    }
    renderBest();
  }

  /* ---------------- test hook (used only by tools/tests/memory-match.test.js) ---------------- */
  window.__gameTest = {
    noShuffle: function (on) { test.noShuffle = on !== false; },
    fast: function (on) { if (on === false) { test.missMs = 1100; test.peekMs = null; } else { test.missMs = 400; test.peekMs = 150; } },
    state: function () {
      return game && { moves: game.moves, found: game.found, scores: game.scores.slice(), turn: game.turn, st: game.st.slice(), pairs: game.cards.map(function (c) { return c.p; }), done: game.done, mode: game.mode, np: game.np };
    }
  };

  /* ---------------- start ---------------- */
  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'wa_game' });
  document.body.appendChild(EDU.el('div', { id: 'srLive', class: 'sr', 'aria-live': 'polite' }));
  fitSize();
  renderSettings();
  renderBest();
  if (!resumeGame()) newGame();
  EDU.onLang(renderAll);
})();
