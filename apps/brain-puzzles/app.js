/* Brain Puzzles: 2048, Number Slide, Memory Sequence and Lights Out.
   Rules live in engine.js (window.BP); this file is the UI, saving, timers and input. */
(function () {
  'use strict';
  var SLUG = 'brain-puzzles';
  var t = EDU.t, $ = EDU.$, $$ = EDU.$$, el = EDU.el, fmt = EDU.fmt;
  var store = EDU.store(SLUG);
  var reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var GAMES = ['t2048', 'slide', 'simon', 'lights'];
  var SIMON_MAX = 20, SIMON_LIVES = 3, UNDO_MAX = 10;
  var rnd = Math.random;
  var spawnQueue = [], lastAnim = null, tileEls = {};
  var timerOn = false, timerT0 = 0, timerIv = 0, picCache = {};

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'wa_game' });

  /* ------------------------------------------------------------ state */
  function fresh(id, keep) {
    keep = keep || {};
    if (id === 't2048') {
      var g = { n: keep.n || 4, tiles: [], nextId: 1, score: 0, moves: 0, won: false, keep: false, over: false, undo: [] };
      spawn(g); spawn(g);
      return g;
    }
    if (id === 'slide') { var n = keep.n || 4; return { n: n, board: BP.slide.shuffle(n, rnd), moves: 0, ms: 0, solved: false, pic: !!keep.pic, hue: Math.floor(rnd() * 360) }; }
    if (id === 'simon') return { mode: keep.mode || 'strict', seq: [], level: 0, pos: 0, phase: 'idle', lives: 0 };
    var ln = keep.n || 5, b = BP.lights.generate(ln, rnd), sol = BP.lights.solve(b, ln);
    return { n: ln, board: b, moves: 0, hints: 0, solved: false, min: sol ? sol.length : 0, hintCell: -1 };
  }
  function load() {
    var d = store.get('state', null), S = { tab: 't2048', sound: false, best: {}, g: {} };
    if (d && typeof d === 'object') {
      if (GAMES.indexOf(d.tab) >= 0) S.tab = d.tab;
      S.sound = !!d.sound;
      if (d.best && typeof d.best === 'object') S.best = d.best;
    }
    GAMES.forEach(function (id) {
      var g = d && d.g && d.g[id];
      S.g[id] = (g && valid(id, g)) ? g : fresh(id);
    });
    var sm = S.g.simon;
    if (sm.phase === 'show' || sm.phase === 'input' || sm.phase === 'good' || sm.phase === 'oops') { sm.phase = 'paused'; sm.pos = 0; }
    return S;
  }
  function isArr(a, len) { return Array.isArray(a) && (len === undefined || a.length === len); }
  function valid(id, g) {
    try {
      if (id === 't2048') return [3, 4, 5].indexOf(g.n) >= 0 && isArr(g.tiles) && g.tiles.every(function (x) { return x.r >= 0 && x.r < g.n && x.c >= 0 && x.c < g.n && x.v >= 2; }) && isArr(g.undo) && typeof g.score === 'number';
      if (id === 'slide') return [3, 4, 5].indexOf(g.n) >= 0 && isArr(g.board, g.n * g.n) && g.board.slice().sort(function (a, b) { return a - b; }).every(function (v, i) { return v === i; }) && BP.slide.solvable(g.board, g.n);
      if (id === 'simon') return ['strict', 'relaxed'].indexOf(g.mode) >= 0 && isArr(g.seq) && typeof g.phase === 'string';
      if (id === 'lights') return [3, 5].indexOf(g.n) >= 0 && isArr(g.board, g.n * g.n) && !!BP.lights.solve(g.board, g.n);
    } catch (e) { }
    return false;
  }
  var S = load();
  var saveT = 0;
  function save() { clearTimeout(saveT); saveT = setTimeout(saveNow, 200); }
  function saveNow() { clearTimeout(saveT); slideBank(); store.set('state', S); }
  window.addEventListener('pagehide', saveNow);
  document.addEventListener('visibilitychange', function () { if (document.hidden) { slideBank(); saveNow(); } else syncTimer(); });

  function G() { return S.g[S.tab]; }
  function bestKey(id, g) { return id === 'simon' ? 'simon_' + g.mode : id + '_' + g.n; }
  function getBest(id, g) { return S.best[bestKey(id, g)]; }
  var newBest = {};

  /* ------------------------------------------------------------ sound (off by default) */
  var actx = null;
  function tone(freqs, opts) {
    if (!S.sound) return;
    opts = opts || {};
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      freqs.forEach(function (f, i) {
        var o = actx.createOscillator(), gn = actx.createGain(), at = actx.currentTime + i * (opts.step || 0.11), len = opts.len || 0.16;
        o.frequency.value = f; o.type = opts.type || 'triangle';
        gn.gain.setValueAtTime(0.0001, at); gn.gain.exponentialRampToValueAtTime(opts.vol || 0.16, at + 0.02); gn.gain.exponentialRampToValueAtTime(0.0001, at + len);
        o.connect(gn); gn.connect(actx.destination); o.start(at); o.stop(at + len + 0.02);
      });
    } catch (e) { }
  }
  var PAD_HZ = [329.63, 277.18, 220, 164.81];
  function winTune() { tone([523, 659, 784, 1047]); }

  /* ------------------------------------------------------------ helpers */
  function mmss(ms) { var s = Math.floor((ms || 0) / 1000), m = Math.floor(s / 60); s %= 60; return m + ':' + (s < 10 ? '0' : '') + s; }
  function digits(v) { return String(v).length; }
  var DIRS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down', A: 'left', D: 'right', W: 'up', S: 'down' };
  var ARROW = { left: '←', right: '→', up: '↑', down: '↓' };

  /* ------------------------------------------------------------ 2048 */
  function spawn(g) {
    var empties = BP.g2048.empties(g.tiles, g.n);
    if (!empties.length) return null;
    var cell, v;
    while (spawnQueue.length) { var q = spawnQueue.shift(); if (empties.indexOf(q.i) >= 0) { cell = q.i; v = q.v; break; } }
    if (cell === undefined) { cell = empties[Math.floor(rnd() * empties.length)]; v = rnd() < 0.9 ? 2 : 4; }
    var tile = { id: g.nextId++, v: v, r: Math.floor(cell / g.n), c: cell % g.n };
    g.tiles.push(tile);
    return tile;
  }
  function move2048(dir) {
    var g = S.g.t2048;
    if (g.over || (g.won && !g.keep)) return false;
    var res = BP.g2048.slide(g.tiles, g.n, dir, g.nextId);
    if (!res.moved) return false;
    g.undo.push({ tiles: g.tiles, score: g.score, nextId: g.nextId, moves: g.moves });
    if (g.undo.length > UNDO_MAX) g.undo.shift();
    g.tiles = res.tiles; g.nextId = res.nextId; g.score += res.gained; g.moves++;
    var nt = spawn(g);
    lastAnim = { consumed: res.consumed, merged: res.merged, born: nt ? nt.id : -1 };
    if (res.gained) tone([440 + Math.min(8, Math.log2(BP.g2048.maxTile(res.tiles))) * 40], { len: 0.09 });
    var target = BP.g2048.target(g.n);
    if (!g.won && BP.g2048.maxTile(g.tiles) >= target) { g.won = true; winTune(); }
    if (!BP.g2048.canMove(g.tiles, g.n)) { g.over = true; tone([330, 262], { step: 0.18 }); }
    var k = bestKey('t2048', g);
    if (g.score > (S.best[k] || 0)) { S.best[k] = g.score; newBest.t2048 = true; }
    save(); render();
    return true;
  }
  function undo2048() {
    var g = S.g.t2048, u = g.undo.pop();
    if (!u) return;
    g.tiles = u.tiles; g.score = u.score; g.nextId = u.nextId; g.moves = u.moves; g.over = false;
    if (g.won && BP.g2048.maxTile(g.tiles) < BP.g2048.target(g.n)) { g.won = false; g.keep = false; }
    lastAnim = null; save(); render();
  }
  function build2048(host, g) {
    var board = el('div', { class: 'sq b2048 n' + g.n, id: 'board-2048', tabindex: '0', role: 'group', style: { '--n': g.n }, 'aria-label': t('board_2048') });
    var cells = el('div', { class: 'cells', 'aria-hidden': 'true' });
    for (var i = 0; i < g.n * g.n; i++) cells.appendChild(el('i'));
    board.appendChild(cells);
    board.appendChild(el('div', { id: 'tiles', 'aria-hidden': 'true' }));
    host.appendChild(board);
    var pad = el('div', { class: 'pad4' });
    ['left', 'up', 'down', 'right'].forEach(function (d) {
      pad.appendChild(el('button', { type: 'button', class: 'btn', 'data-dir': d, 'aria-label': t('dir_' + d), text: ARROW[d] }));
    });
    host.appendChild(pad);
    host.appendChild(el('p', { class: 'sr-only', id: 'grid-2048', style: { position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)' } }));
    tileEls = {};
    addSwipe(board, function (d) { move2048(d); });
  }
  function tileClass(v) { return v > 2048 ? 'tbig' : 't' + v; }
  function placeTile(e, tl) {
    e.style.setProperty('--r', tl.r); e.style.setProperty('--c', tl.c);
    var cls = 'tile ' + tileClass(tl.v) + ' d' + Math.min(5, Math.max(2, digits(tl.v)));
    e.dataset.base = cls;
    e.className = cls + (e.dataset.extra ? ' ' + e.dataset.extra : '');
    e.firstChild.textContent = tl.v;
  }
  function sync2048(g) {
    var layer = $('#tiles'); if (!layer) return;
    var anim = lastAnim && !reduceMotion ? lastAnim : null;
    lastAnim = null;
    var keep = {};
    if (anim) anim.consumed.forEach(function (c) {
      var e = tileEls[c.id]; if (!e) return;
      delete tileEls[c.id];
      e.dataset.extra = 'gone';
      e.style.setProperty('--r', c.r); e.style.setProperty('--c', c.c);
      e.className = e.dataset.base + ' gone';
      setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, 130);
    });
    g.tiles.forEach(function (tl) {
      keep[tl.id] = 1;
      var e = tileEls[tl.id];
      if (!e) {
        e = el('div', { class: 'tile' }, el('div', { class: 'face num' }));
        e.dataset.extra = anim ? (anim.merged.indexOf(tl.id) >= 0 ? 'merged' : tl.id === anim.born ? 'new' : '') : '';
        tileEls[tl.id] = e; layer.appendChild(e);
      } else e.dataset.extra = '';
      placeTile(e, tl);
    });
    Object.keys(tileEls).forEach(function (id) { if (!keep[id]) { var e = tileEls[id]; if (e.parentNode) e.parentNode.removeChild(e); delete tileEls[id]; } });
    if (!anim) $$('.tile.gone', layer).forEach(function (e) { e.parentNode.removeChild(e); });
    var board = $('#board-2048');
    board.classList.toggle('locked', g.over || (g.won && !g.keep));
    var grid = BP.g2048.toGrid(g.tiles, g.n), rows = [];
    for (var r = 0; r < g.n; r++) rows.push(grid.slice(r * g.n, r * g.n + g.n).map(function (v) { return v || '·'; }).join(' '));
    $('#grid-2048').textContent = rows.join(' | ');
    $('#grid-2048').setAttribute('data-grid', grid.join(','));
  }

  /* ------------------------------------------------------------ number slide */
  function slideElapsed(g) { return g.ms + (timerOn ? performance.now() - timerT0 : 0); }
  function slideBank() { if (timerOn) { var g = S.g.slide; g.ms += performance.now() - timerT0; timerT0 = performance.now(); } }
  function syncTimer() {
    var g = S.g.slide, want = S.tab === 'slide' && g.moves > 0 && !g.solved && !document.hidden;
    if (want && !timerOn) { timerOn = true; timerT0 = performance.now(); timerIv = setInterval(tickTimer, 500); }
    else if (!want && timerOn) { slideBank(); timerOn = false; clearInterval(timerIv); }
  }
  function tickTimer() { var v = $('#sc-time'); if (v) v.textContent = mmss(slideElapsed(S.g.slide)); }
  function picture(hue) {
    if (picCache[hue]) return picCache[hue];
    var W = 480, c = document.createElement('canvas'); c.width = c.height = W;
    var x = c.getContext('2d'); if (!x) return '';
    var bg = x.createRadialGradient(W / 2, W / 2, 20, W / 2, W / 2, W * 0.75);
    bg.addColorStop(0, 'hsl(' + hue + ',80%,88%)'); bg.addColorStop(1, 'hsl(' + (hue + 60) + ',65%,38%)');
    x.fillStyle = bg; x.fillRect(0, 0, W, W);
    /* corner fans so every piece looks different */
    [[0, 0], [W, 0], [0, W], [W, W]].forEach(function (p, k) {
      for (var r = 150; r > 0; r -= 30) { x.beginPath(); x.arc(p[0], p[1], r, 0, Math.PI * 2); x.fillStyle = 'hsl(' + (hue + 180 + k * 25 + r) + ',70%,' + (40 + r / 6) + '%)'; x.fill(); }
    });
    x.save(); x.translate(W / 2, W / 2);
    for (var ring = 4; ring >= 0; ring--) {
      var count = 6 + ring * 4, rad = 30 + ring * 42, len = 26 + ring * 9, wid = 10 + ring * 3;
      for (var i = 0; i < count; i++) {
        x.save(); x.rotate((i / count) * Math.PI * 2 + ring * 0.3); x.translate(rad, 0);
        x.beginPath(); x.ellipse(0, 0, len, wid, 0, 0, Math.PI * 2);
        x.fillStyle = 'hsl(' + (hue + ring * 65 + (i % 2) * 30) + ',75%,' + (45 + (ring % 2) * 18) + '%)'; x.fill();
        x.lineWidth = 2; x.strokeStyle = 'rgba(255,255,255,.7)'; x.stroke();
        x.beginPath(); x.arc(len + 8, 0, 5, 0, Math.PI * 2); x.fillStyle = '#fff'; x.fill();
        x.restore();
      }
    }
    x.beginPath(); x.arc(0, 0, 26, 0, Math.PI * 2); x.fillStyle = 'hsl(' + (hue + 200) + ',80%,55%)'; x.fill();
    x.lineWidth = 4; x.strokeStyle = '#fff'; x.stroke();
    x.restore();
    try { picCache[hue] = c.toDataURL('image/png'); } catch (e) { picCache[hue] = ''; }
    return picCache[hue];
  }
  function buildSlide(host, g) {
    var board = el('div', { class: 'sq bslide n' + g.n + (g.pic ? ' pic' : ''), id: 'board-slide', tabindex: '0', role: 'group', style: { '--n': g.n }, 'aria-label': t('board_slide') });
    var cells = el('div', { class: 'cells', 'aria-hidden': 'true' });
    for (var i = 0; i < g.n * g.n; i++) cells.appendChild(el('i'));
    board.appendChild(cells);
    var url = g.pic ? picture(g.hue) : '';
    for (var v = 1; v < g.n * g.n; v++) {
      var hr = Math.floor((v - 1) / g.n), hc = (v - 1) % g.n;
      var face = el('span', { class: 'face num', text: String(v) });
      if (url) {
        face.style.backgroundImage = 'url(' + url + ')';
        face.style.backgroundSize = (g.n * 100) + '% ' + (g.n * 100) + '%';
        face.style.backgroundPosition = (hc / (g.n - 1) * 100) + '% ' + (hr / (g.n - 1) * 100) + '%';
      }
      board.appendChild(el('button', { type: 'button', class: 'tile', tabindex: '-1', 'data-v': v, 'aria-label': t('tile_label', { v: v }) }, face));
    }
    host.appendChild(board);
    addSwipe(board, function (d) { slideMove(BP.slide.arrow(S.g.slide.board, S.g.slide.n, d)); });
  }
  function syncSlide(g) {
    var board = $('#board-slide'); if (!board) return;
    g.board.forEach(function (v, i) {
      if (!v) return;
      var b = board.querySelector('[data-v="' + v + '"]');
      b.style.setProperty('--r', Math.floor(i / g.n)); b.style.setProperty('--c', i % g.n);
      b.classList.toggle('home', !g.pic && v === i + 1);
      b.disabled = g.solved;
    });
    board.classList.toggle('solved', g.solved);
    board.setAttribute('data-board', g.board.join(','));
  }
  function slideMove(res) {
    var g = S.g.slide;
    if (!res || g.solved) return;
    g.board = res.board; g.moves += res.count;
    syncTimer();
    tone([620], { len: 0.05, vol: 0.08 });
    if (BP.slide.isSolved(g.board)) {
      slideBank(); g.solved = true; syncTimer();
      var k = bestKey('slide', g), b = S.best[k] || {};
      var nb = { m: b.m ? Math.min(b.m, g.moves) : g.moves, t: b.t ? Math.min(b.t, Math.round(g.ms)) : Math.round(g.ms) };
      if (nb.m !== b.m || nb.t !== b.t) newBest.slide = true;
      S.best[k] = nb;
      winTune();
    }
    save(); render();
  }

  /* ------------------------------------------------------------ memory sequence */
  var simonTok = 0, simonFast = false, litPad = -1;
  var SHAPES = [
    '<circle class="shape" cx="50" cy="50" r="40"/>',
    '<polygon class="shape" points="50,8 92,88 8,88"/>',
    '<rect class="shape" x="12" y="12" width="76" height="76" rx="6"/>',
    '<polygon class="shape" points="50,5 61,38 96,38 68,59 78,93 50,73 22,93 32,59 4,38 39,38"/>'
  ];
  function buildSimon(host, g) {
    var wrap = el('div', { class: 'simon', id: 'simon' });
    for (var i = 0; i < 4; i++) {
      var b = el('button', { type: 'button', class: 'pad p' + i, 'data-pad': i, 'aria-label': t('pad_' + i) });
      b.innerHTML = '<span class="kn" aria-hidden="true">' + (i + 1) + '</span><svg viewBox="0 0 100 100" aria-hidden="true">' + SHAPES[i] + '</svg>';
      wrap.appendChild(b);
    }
    host.appendChild(wrap);
    host.appendChild(el('div', { class: 'simon-dots', id: 'simon-dots', 'aria-hidden': 'true' }));
  }
  function syncSimon(g) {
    $$('#simon .pad').forEach(function (b, i) { b.classList.toggle('on', litPad === i); b.disabled = g.phase !== 'input'; });
    var dots = $('#simon-dots'); if (!dots) return;
    dots.innerHTML = '';
    if (g.phase === 'input' || g.phase === 'good') g.seq.forEach(function (_, i) { dots.appendChild(el('i', { class: i < g.pos ? 'ok' : '' })); });
  }
  function flash(i, ms) {
    litPad = i; syncSimon(S.g.simon);
    tone([PAD_HZ[i]], { len: Math.max(0.08, ms / 1000 * 0.9), type: 'sine', vol: 0.2 });
    var tok = simonTok;
    setTimeout(function () { if (tok !== simonTok) return; if (litPad === i) { litPad = -1; syncSimon(S.g.simon); } }, ms);
  }
  function simonSpeed(g) {
    if (simonFast) return { on: 60, gap: 40, pause: 80 };
    var on = Math.max(280, 620 - g.seq.length * 22);
    return { on: on, gap: Math.max(120, on * 0.4), pause: 700 };
  }
  function simonPlay() {
    var g = S.g.simon, tok = ++simonTok, sp = simonSpeed(g), i = 0;
    g.phase = 'show'; g.pos = 0; litPad = -1; render();
    function step() {
      if (tok !== simonTok) return;
      if (i >= g.seq.length) { g.phase = 'input'; g.pos = 0; save(); render(); return; }
      flash(g.seq[i], sp.on); i++;
      setTimeout(step, sp.on + sp.gap);
    }
    setTimeout(step, sp.pause);
  }
  function simonStart() {
    var g = S.g.simon;
    S.g.simon = { mode: g.mode, seq: [Math.floor(rnd() * 4)], level: 0, pos: 0, phase: 'show', lives: g.mode === 'relaxed' ? SIMON_LIVES : 1 };
    newBest.simon = false;
    simonPlay();
  }
  function simonPress(i) {
    var g = S.g.simon;
    if (g.phase !== 'input') return;
    if (g.seq[g.pos] === i) {
      flash(i, 220);
      g.pos++;
      if (g.pos === g.seq.length) {
        g.level = g.seq.length;
        var k = bestKey('simon', g);
        if (g.level > (S.best[k] || 0)) { S.best[k] = g.level; newBest.simon = true; }
        if (g.level >= SIMON_MAX) { g.phase = 'won'; simonTok++; setTimeout(winTune, 250); save(); render(); return; }
        g.phase = 'good'; save(); render();
        var tok = ++simonTok;
        setTimeout(function () { if (tok !== simonTok) return; g.seq.push(Math.floor(rnd() * 4)); simonPlay(); }, simonFast ? 50 : 650);
      } else syncSimon(g);
      return;
    }
    tone([110], { type: 'sawtooth', len: 0.35, vol: 0.12 });
    var bad = $('#simon [data-pad="' + i + '"]'); if (bad) { bad.classList.add('bad'); setTimeout(function () { bad.classList.remove('bad'); }, 500); }
    g.lives--;
    if (g.lives > 0) {
      g.phase = 'oops'; save(); render();
      var tk = ++simonTok;
      setTimeout(function () { if (tk !== simonTok) return; simonPlay(); }, simonFast ? 50 : 1200);
    } else { g.phase = 'over'; g.lives = 0; simonTok++; save(); render(); }
  }

  /* ------------------------------------------------------------ lights out */
  var lfocus = 12;
  function buildLights(host, g) {
    var board = el('div', { class: 'sq blights n' + g.n, id: 'board-lights', role: 'group', style: { '--n': g.n }, 'aria-label': t('tab_lights') });
    for (var i = 0; i < g.n * g.n; i++) board.appendChild(el('button', { type: 'button', 'data-cell': i, tabindex: '-1' }));
    host.appendChild(board);
    if (lfocus >= g.n * g.n) lfocus = Math.floor(g.n * g.n / 2);
  }
  function syncLights(g) {
    var board = $('#board-lights'); if (!board) return;
    $$('button', board).forEach(function (b, i) {
      var on = !!g.board[i];
      b.classList.toggle('on', on); b.classList.toggle('hint', g.hintCell === i);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', t(on ? 'cell_on' : 'cell_off', { r: Math.floor(i / g.n) + 1, c: i % g.n + 1 }));
      b.tabIndex = i === lfocus ? 0 : -1;
      b.disabled = g.solved;
    });
    board.classList.toggle('solved', g.solved);
    board.setAttribute('data-board', g.board.join(''));
  }
  function lightsPress(i) {
    var g = S.g.lights;
    if (g.solved || i < 0 || i >= g.n * g.n) return;
    g.board = BP.lights.press(g.board, g.n, i); g.moves++;
    if (g.hintCell === i) g.hintCell = -1;
    else if (g.hintCell >= 0) g.hintCell = -1;
    tone([g.board[i] ? 700 : 500], { len: 0.06, vol: 0.08 });
    if (!BP.lights.lit(g.board)) {
      g.solved = true; g.hintCell = -1;
      if (!g.hints) {
        var k = bestKey('lights', g);
        if (!S.best[k] || g.moves < S.best[k]) { S.best[k] = g.moves; newBest.lights = true; }
      }
      winTune();
    }
    save(); render();
  }
  function lightsHint() {
    var g = S.g.lights;
    if (g.solved) return;
    var sol = BP.lights.solve(g.board, g.n);
    if (!sol || !sol.length) return;
    g.hintCell = sol.indexOf(lfocus) >= 0 ? lfocus : sol[0];
    g.hints++;
    save(); render();
  }

  /* ------------------------------------------------------------ swipe (pointer events; the board has touch-action: none) */
  var suppressClick = 0;
  function addSwipe(node, fn) {
    var sx = 0, sy = 0, id = null;
    node.addEventListener('pointerdown', function (e) { id = e.pointerId; sx = e.clientX; sy = e.clientY; });
    node.addEventListener('pointerup', function (e) {
      if (e.pointerId !== id) return;
      id = null;
      var dx = e.clientX - sx, dy = e.clientY - sy, ax = Math.abs(dx), ay = Math.abs(dy);
      if (Math.max(ax, ay) < 24) return;
      suppressClick = Date.now();
      fn(ax > ay ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    });
    node.addEventListener('pointercancel', function () { id = null; });
  }

  /* ------------------------------------------------------------ render */
  var hostKey = null;
  function inProgress(id, g) {
    if (id === 't2048') return g.moves > 0 && !g.over;
    if (id === 'slide') return g.moves > 0 && !g.solved;
    if (id === 'simon') return g.level > 0 && g.phase !== 'over' && g.phase !== 'won' && g.phase !== 'idle';
    return g.moves > 0 && !g.solved;
  }
  function statusInfo(id, g) {
    var nb = newBest[id] ? ' ' + t('new_best') : '';
    if (id === 't2048') {
      var tg = BP.g2048.target(g.n);
      if (g.won && !g.keep) return { cls: 'win', txt: t('st_2048_won', { target: tg }) + nb };
      if (g.over) return { cls: 'lose', txt: t('st_2048_over', { score: fmt(g.score) }) + nb };
      return { txt: t('st_2048_play', { target: tg }) };
    }
    if (id === 'slide') {
      if (g.solved) return { cls: 'win', txt: t('st_slide_won', { moves: fmt(g.moves), time: mmss(g.ms) }) + nb };
      return { txt: t(g.pic ? 'st_slide_pic' : 'st_slide_play', { last: g.n * g.n - 1 }) };
    }
    if (id === 'simon') {
      var ph = g.phase;
      if (ph === 'show') return { txt: t('st_simon_show', { n: g.seq.length }) };
      if (ph === 'input') return { txt: t('st_simon_input', { n: g.seq.length }) };
      if (ph === 'good') return { cls: 'win', txt: t('st_simon_good') };
      if (ph === 'oops') return { cls: 'lose', txt: t('st_simon_oops', { lives: g.lives }) };
      if (ph === 'over') return { cls: 'lose', txt: t('st_simon_over', { level: g.level }) + nb };
      if (ph === 'won') return { cls: 'win', txt: t('st_simon_won', { level: g.level }) + nb };
      if (ph === 'paused') return { txt: t('st_simon_paused') };
      return { txt: t('st_simon_idle') };
    }
    if (g.solved) return { cls: 'win', txt: t('st_lights_won', { moves: fmt(g.moves), min: g.min }) + (g.hints ? ' ' + t('hints_used', { n: g.hints }) : nb) };
    if (g.hintCell >= 0) return { txt: t('st_lights_hint') };
    return { txt: t('st_lights_play', { min: g.min }) };
  }
  function scoreItems(id, g) {
    var b = getBest(id, g);
    if (id === 't2048') return [['s_score', fmt(g.score), 'sc-score'], ['s_best', fmt(b || 0), 'sc-best'], ['s_top', fmt(BP.g2048.maxTile(g.tiles)), 'sc-top']];
    if (id === 'slide') return [['s_moves', fmt(g.moves), 'sc-moves'], ['s_time', mmss(slideElapsed(g)), 'sc-time'], ['s_best_moves', b ? fmt(b.m) : '–', 'sc-bm'], ['s_best_time', b ? mmss(b.t) : '–', 'sc-bt']];
    if (id === 'simon') return [['s_level', fmt(g.level), 'sc-level'], ['s_best_level', fmt(b || 0), 'sc-best'], ['s_lives', g.phase === 'idle' ? '–' : fmt(Math.max(0, g.lives)), 'sc-lives']];
    return [['s_moves', fmt(g.moves), 'sc-moves'], ['s_lit', fmt(BP.lights.lit(g.board)), 'sc-lit'], ['s_best_moves', b ? fmt(b) : '–', 'sc-best']];
  }
  function sizeSeg(g, sizes, extra) {
    var seg = el('div', { class: 'seg', role: 'group', 'aria-labelledby': 'size-lbl' });
    sizes.forEach(function (n) {
      var b = el('button', { type: 'button', 'data-size': n, 'aria-pressed': g.n === n ? 'true' : 'false' }, el('span', { class: 'num', text: n + ' × ' + n }));
      if (extra && extra[n]) b.appendChild(el('small', { text: t(extra[n]) }));
      seg.appendChild(b);
    });
    return el('div', { class: 'opt' }, el('span', { class: 'lbl', id: 'size-lbl', text: t('size_label') }), seg);
  }
  function renderOpts(id, g) {
    var box = $('#opts'); box.innerHTML = '';
    if (id === 't2048') box.appendChild(sizeSeg(g, [3, 4, 5], { 3: 'easy' }));
    if (id === 'slide') {
      box.appendChild(sizeSeg(g, [3, 4, 5], { 3: 'easy' }));
      var cb = el('input', { type: 'checkbox', id: 'pic' }); cb.checked = !!g.pic;
      box.appendChild(el('label', { class: 'check' }, cb, ' ', el('span', { text: t('pic_label') })));
    }
    if (id === 'simon') {
      var seg = el('div', { class: 'seg', role: 'group', 'aria-labelledby': 'mode-lbl' });
      ['strict', 'relaxed'].forEach(function (m) { seg.appendChild(el('button', { type: 'button', 'data-mode': m, 'aria-pressed': g.mode === m ? 'true' : 'false', text: t('mode_' + m) })); });
      box.appendChild(el('div', { class: 'opt' }, el('span', { class: 'lbl', id: 'mode-lbl', text: t('mode_label') }), seg));
    }
    if (id === 'lights') box.appendChild(sizeSeg(g, [3, 5], { 3: 'kids' }));
  }
  function ruleText(id, g) {
    if (id === 't2048') return t('rule_2048', { target: BP.g2048.target(g.n) });
    if (id === 'slide') return t('rule_slide');
    if (id === 'simon') return t(g.mode === 'strict' ? 'rule_simon_strict' : 'rule_simon_relaxed', { max: SIMON_MAX, lives: SIMON_LIVES });
    return t('rule_lights');
  }
  function render() {
    var id = S.tab, g = G();
    $$('#tabs [role="tab"]').forEach(function (b) { var on = b.getAttribute('data-tab') === id; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
    $('#stage').setAttribute('aria-labelledby', 'tab-' + id);
    var key = id + ':' + (g.n || '') + ':' + (g.pic ? 1 : 0) + ':' + (g.hue || 0) + ':' + EDU.lang;
    var host = $('#host');
    if (key !== hostKey) {
      hostKey = key; host.innerHTML = ''; lastAnim = null;
      if (id === 't2048') build2048(host, g); else if (id === 'slide') buildSlide(host, g); else if (id === 'simon') buildSimon(host, g); else buildLights(host, g);
    }
    if (id === 't2048') sync2048(g); else if (id === 'slide') syncSlide(g); else if (id === 'simon') syncSimon(g); else syncLights(g);

    var si = statusInfo(id, g), st = $('#status');
    st.className = 'callout status' + (si.cls ? ' ' + si.cls : '');
    st.textContent = si.txt;
    var over = id === 't2048' ? (g.over || (g.won && !g.keep)) : id === 'slide' ? g.solved : id === 'lights' ? g.solved : (g.phase === 'over' || g.phase === 'won');
    $('#new-game-txt').textContent = id === 'simon' && g.phase === 'idle' ? t('start') : t(over ? 'play_again' : 'new_game');
    $('#keep-going').hidden = !(id === 't2048' && g.won && !g.keep);
    $('#undo').hidden = id !== 't2048';
    $('#undo').disabled = id !== 't2048' || !g.undo.length || (g.won && !g.keep);
    $('#hint').hidden = id !== 'lights';
    $('#hint').disabled = id !== 'lights' || g.solved;
    $('#cont').hidden = !(id === 'simon' && g.phase === 'paused');
    $('#keys-hint').textContent = t('keys_' + (id === 't2048' ? '2048' : id));

    var sc = $('#scores'), items = scoreItems(id, g);
    sc.className = 'scores' + (items.length === 4 ? ' k4' : '');
    sc.innerHTML = '';
    items.forEach(function (it, i) {
      sc.appendChild(el('div', { class: 'sc' + (i === 1 && newBest[id] ? ' flash' : '') }, el('span', { class: 'k', text: t(it[0]) }), el('span', { class: 'v', id: it[2], text: it[1] })));
    });
    $('#rule').textContent = ruleText(id, g);
    renderOpts(id, g);
    $('#sound').checked = S.sound;
    syncTimer();
  }

  /* ------------------------------------------------------------ actions */
  function newGame(id, keep) {
    var g = S.g[id];
    if (id === 'simon') { simonTok++; litPad = -1; S.g.simon.mode = (keep && keep.mode) || g.mode; simonStart(); save(); return; }
    if (id === 'slide') { slideBank(); timerOn = false; clearInterval(timerIv); }
    S.g[id] = fresh(id, Object.assign({ n: g.n, pic: g.pic, mode: g.mode }, keep || {}));
    newBest[id] = false; lastAnim = null;
    save(); render();
  }
  function setTab(id, focus) {
    if (GAMES.indexOf(id) < 0 || id === S.tab) { if (focus) $('#tab-' + id).focus(); return; }
    slideBank();
    if (S.tab === 'simon') {           /* leaving mid-round pauses the memory game */
      var sm = S.g.simon;
      if (['show', 'input', 'good', 'oops'].indexOf(sm.phase) >= 0) { simonTok++; litPad = -1; sm.phase = 'paused'; sm.pos = 0; }
    }
    S.tab = id; save(); render();
    if (focus) $('#tab-' + id).focus();
  }
  $$('#tabs [role="tab"]').forEach(function (b) { b.addEventListener('click', function () { setTab(b.getAttribute('data-tab')); }); });
  $('#tabs').addEventListener('keydown', function (e) {
    var i = GAMES.indexOf(S.tab), rtl = document.documentElement.dir === 'rtl';
    var step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, Home: -9, End: 9 }[e.key];
    if (!step) return;
    e.preventDefault();
    i = step === -9 ? 0 : step === 9 ? 3 : (i + step + 4) % 4;
    setTab(GAMES[i], true);
  });
  $('#new-game').addEventListener('click', function () {
    var id = S.tab, g = G();
    if (inProgress(id, g) && !confirm(t('confirm_restart'))) return;
    newGame(id);
  });
  $('#keep-going').addEventListener('click', function () { S.g.t2048.keep = true; save(); render(); var b = $('#board-2048'); if (b) b.focus(); });
  $('#undo').addEventListener('click', undo2048);
  $('#hint').addEventListener('click', lightsHint);
  $('#cont').addEventListener('click', function () { var g = S.g.simon; if (g.phase === 'paused') simonPlay(); });
  $('#fs-btn').addEventListener('click', function () { EDU.fullscreen($('#stage')); });
  $('#sound').addEventListener('change', function () { S.sound = this.checked; save(); if (S.sound) tone([660], { len: 0.08 }); });
  $('#reset-best').addEventListener('click', function () {
    if (!confirm(t('confirm_reset_best'))) return;
    var id = S.tab;
    Object.keys(S.best).forEach(function (k) { if (k.indexOf(id === 'simon' ? 'simon_' : id + '_') === 0) delete S.best[k]; });
    newBest[id] = false; save(); render();
  });
  $('#opts').addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button'); if (!b) return;
    var id = S.tab, g = G();
    if (b.hasAttribute('data-size')) {
      var n = +b.getAttribute('data-size'); if (n === g.n) return;
      if (inProgress(id, g) && !confirm(t('confirm_restart'))) return;
      newGame(id, { n: n });
    } else if (b.hasAttribute('data-mode')) {
      var m = b.getAttribute('data-mode'); if (m === g.mode) return;
      if (inProgress(id, g) && !confirm(t('confirm_restart'))) return;
      simonTok++; litPad = -1;
      S.g.simon = { mode: m, seq: [], level: 0, pos: 0, phase: 'idle', lives: 0 };
      newBest.simon = false; save(); render();
    }
  });
  $('#opts').addEventListener('change', function (e) {
    if (e.target.id !== 'pic') return;
    S.g.slide.pic = e.target.checked; save(); render();
  });

  /* board taps (delegated; boards are rebuilt on size / language change) */
  $('#host').addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.hasAttribute('data-dir')) { move2048(b.getAttribute('data-dir')); return; }
    if (b.hasAttribute('data-v')) {
      if (Date.now() - suppressClick < 350) return;
      var g = S.g.slide; slideMove(BP.slide.tap(g.board, g.n, g.board.indexOf(+b.getAttribute('data-v'))));
      return;
    }
    if (b.hasAttribute('data-pad')) { simonPress(+b.getAttribute('data-pad')); return; }
    if (b.hasAttribute('data-cell')) { lfocus = +b.getAttribute('data-cell'); lightsPress(lfocus); }
  });
  $('#host').addEventListener('keydown', function (e) {
    if (S.tab !== 'lights' || !e.target.hasAttribute('data-cell')) return;
    var g = S.g.lights, n = g.n, i = +e.target.getAttribute('data-cell'), r = Math.floor(i / n), c = i % n;
    var dir = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] }[e.key];
    if (!dir) return;
    e.preventDefault(); e.stopPropagation();
    r = (r + dir[0] + n) % n; c = (c + dir[1] + n) % n; lfocus = r * n + c;
    $$('#board-lights button').forEach(function (bb, k) { bb.tabIndex = k === lfocus ? 0 : -1; });
    var nb = $('#board-lights [data-cell="' + lfocus + '"]'); if (nb) nb.focus();
  });
  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    var tg = e.target, tag = (tg && tg.tagName) || '';
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(tag) || (tg.closest && (tg.closest('#tabs') || tg.closest('.edu-header, header, .edu-foot, footer')))) return;
    if (S.tab === 'simon' && /^[1-4]$/.test(e.key)) { e.preventDefault(); simonPress(+e.key - 1); return; }
    var d = DIRS[e.key]; if (!d) return;
    if (S.tab === 't2048') { e.preventDefault(); move2048(d); }
    else if (S.tab === 'slide') { e.preventDefault(); var g = S.g.slide; slideMove(BP.slide.arrow(g.board, g.n, d)); }
  });

  /* deterministic hooks for the interaction test (they never run in normal play) */
  window.__gameTest = {
    set2048: function (grid, n) {
      n = n || Math.round(Math.sqrt(grid.length));
      S.g.t2048 = { n: n, tiles: BP.g2048.fromGrid(grid, n), nextId: 500, score: 0, moves: 0, won: false, keep: false, over: false, undo: [] };
      hostKey = null; render();
    },
    queueSpawn: function (list) { spawnQueue = list.slice(); },
    setSlide: function (board) {
      var n = Math.round(Math.sqrt(board.length));
      S.g.slide = { n: n, board: board.slice(), moves: 0, ms: 0, solved: false, pic: S.g.slide.pic, hue: S.g.slide.hue }; render();
    },
    setLights: function (board) {
      var n = Math.round(Math.sqrt(board.length)), sol = BP.lights.solve(board, n);
      S.g.lights = { n: n, board: board.slice(), moves: 0, hints: 0, solved: false, min: sol ? sol.length : 0, hintCell: -1 }; render();
    },
    setSimon: function (seq, mode) {
      simonTok++; litPad = -1; simonFast = true;
      var m = mode || S.g.simon.mode;
      S.g.simon = { mode: m, seq: seq.slice(), level: seq.length - 1, pos: 0, phase: 'input', lives: m === 'relaxed' ? SIMON_LIVES : 1 }; render();
    },
    fast: function (on) { simonFast = !!on; },
    seed: function (n) { rnd = BP.rng(n); },
    state: function () { return JSON.parse(JSON.stringify(S)); },
    engine: BP
  };

  EDU.onLang(function () { hostKey = null; render(); });
  render();
})();
