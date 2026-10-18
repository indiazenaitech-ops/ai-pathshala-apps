/* Sudoku (apps/sudoku): play, explained hints, daily puzzle, stats and printable A4 puzzles.
   The puzzle maths lives in engine.js (window.SudokuEngine); big puzzles are made in a Blob worker so the page
   never freezes on a cheap phone. Everything stays on this device (EDU.store('sudoku')). */
(function () {
  'use strict';
  var SLUG = 'sudoku';
  var E = window.SudokuEngine;
  var store = EDU.store(SLUG);
  var $ = EDU.$, $$ = EDU.$$, el = EDU.el;
  var t = function (k, v) { return EDU.t(k, v); };
  var LRI = String.fromCharCode(0x2066), PDI = String.fromCharCode(0x2069);   /* keeps numbers left-to-right inside Urdu */
  var iso = function (s) { return LRI + s + PDI; };

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'wa_game' });

  /* ------------------------------------------------------------ settings + saved game */
  function cleanSettings(s) {
    s = s && typeof s === 'object' ? s : {};
    var n = [4, 6, 9].indexOf(+s.n) >= 0 ? +s.n : 9;
    var lv = E.LEVELS_FOR[n].indexOf(s.level) >= 0 ? s.level : 'easy';
    return { n: n, level: lv, mistakes: s.mistakes !== false, prBig: !!s.prBig, prKey: s.prKey !== false,
      prPer: [1, 2, 4].indexOf(+s.prPer) >= 0 ? +s.prPer : 2, prPages: Math.min(5, Math.max(1, +s.prPages || 1)) };
  }
  var S = cleanSettings(store.get('settings', null));
  function saveSettings() { store.set('settings', S); }

  function validGame(g) {
    if (!g || typeof g !== 'object' || [4, 6, 9].indexOf(g.n) < 0) return false;
    var nn = g.n * g.n, ok = function (a, max) { return Array.isArray(a) && a.length === nn && a.every(function (x) { return x === (x | 0) && x >= 0 && x <= max; }); };
    if (!ok(g.givens, g.n) || !ok(g.solution, g.n) || !ok(g.v, g.n) || !ok(g.notes, (1 << g.n) - 1)) return false;
    for (var i = 0; i < nn; i++) if (g.givens[i] && (g.givens[i] !== g.solution[i] || g.v[i] !== g.givens[i])) return false;
    return E.LEVELS_FOR[g.n].indexOf(g.level) >= 0;
  }
  var game = store.get('game', null);
  if (!validGame(game)) game = null;
  else { game.elapsed = Math.max(0, +game.elapsed || 0); game.hints = +game.hints || 0; game.mistakes = +game.mistakes || 0; }
  var undoStack = [], redoStack = [], sel = -1, notesMode = false, hintMark = { cells: [], target: -1 }, checkFlash = false, busy = false;

  /* ------------------------------------------------------------ stats */
  function getStats() {
    var s = store.get('stats', null);
    if (!s || typeof s !== 'object') s = {};
    if (!s.lv || typeof s.lv !== 'object') s.lv = {};
    if (!s.daily || typeof s.daily !== 'object') s.daily = { last: '', streak: 0, best: 0 };
    return s;
  }
  function dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function dayNum(k) { var p = String(k).split('-'); return p.length === 3 ? Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 864e5) : NaN; }
  function currentStreak(st) {
    var gap = dayNum(dayKey()) - dayNum(st.daily.last);
    return gap === 0 || gap === 1 ? st.daily.streak || 0 : 0;
  }
  /* returns { best: true when this was a new best time } */
  function recordWin(g) {
    var st = getStats(), key = g.n + '-' + g.level, r = st.lv[key] || { won: 0, best: 0, total: 0 }, secs = Math.round(g.elapsed / 1000), res = {};
    r.won = (r.won || 0) + 1; r.total = (r.total || 0) + secs;
    if (!r.best || secs < r.best) { res.best = r.won > 1; r.best = secs; }
    st.lv[key] = r;
    if (g.daily) {
      var gap = dayNum(g.daily) - dayNum(st.daily.last);
      if (gap === 1) st.daily.streak = (st.daily.streak || 0) + 1;
      else if (gap !== 0) st.daily.streak = 1;
      if (gap > 0 || !st.daily.last) st.daily.last = g.daily;
      st.daily.best = Math.max(st.daily.best || 0, st.daily.streak);
      res.streak = st.daily.streak;
    }
    store.set('stats', st);
    return res;
  }

  /* ------------------------------------------------------------ puzzle making (Blob worker, main-thread fallback) */
  var worker = null, jobs = {}, jobId = 0;
  try {
    var src = 'var SudokuEngine = (' + window.SudokuEngineFactory.toString() + ')();\n' +
      'onmessage = function (e) { var d = e.data; postMessage({ id: d.id, p: SudokuEngine.generate(d.n, d.level, d.seed) }); };';
    worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
    worker.onmessage = function (e) { var cb = jobs[e.data.id]; delete jobs[e.data.id]; if (cb) cb(e.data.p); };
    worker.onerror = function () { worker = null; var waiting = jobs; jobs = {}; Object.keys(waiting).forEach(function (k) { var j = waiting[k]; setTimeout(function () { j(null); }, 0); }); };
  } catch (e) { worker = null; }
  function makePuzzle(n, level, seed, cb) {
    var local = function () { setTimeout(function () { cb(E.generate(n, level, seed)); }, 20); };
    if (!worker) return local();
    var id = ++jobId;
    jobs[id] = function (p) { if (p) cb(p); else local(); };
    worker.postMessage({ id: id, n: n, level: level, seed: seed });
  }
  function randomSeed() { return (Math.floor(Math.random() * 4294967295) >>> 0) || 1; }
  var DAILY_LEVEL = ['expert', 'easy', 'easy', 'medium', 'medium', 'hard', 'hard'];   /* Sunday … Saturday */
  function dailyLevel(k) { var p = k.split('-'); return DAILY_LEVEL[new Date(+p[0], +p[1] - 1, +p[2]).getDay()]; }

  function startGame(p, daily) {
    var nn = p.n * p.n;
    game = { n: p.n, level: p.level, seed: p.seed, daily: daily || '', givens: p.givens.slice(), solution: p.solution.slice(),
      v: p.givens.slice(), notes: new Array(nn).fill(0), elapsed: 0, hints: 0, mistakes: 0, done: false, revealed: false };
    undoStack = []; redoStack = []; sel = -1; notesMode = false; hintMark = { cells: [], target: -1 };
    $('#hintbox').textContent = '';
    $('#done').hidden = true;
    paused = false;
    buildBoard(); saveGame(); render(); startClock();
  }
  function newPuzzle(n, level, daily) {
    if (busy) return;
    busy = true; stopClock();
    $('#board').classList.add('busy');
    $('#status').textContent = t('making');
    var seed = daily ? E.hash('daily:' + daily) : randomSeed();
    makePuzzle(n, level, seed, function (p) {
      busy = false;
      $('#board').classList.remove('busy');
      $('#status').textContent = '';
      startGame(p, daily);
    });
  }
  function inProgress() {
    if (!game || game.done) return false;
    for (var i = 0; i < game.v.length; i++) if (game.v[i] && !game.givens[i]) return true;
    return false;
  }
  function askNew(n, level, daily) {
    if (inProgress() && !confirm(t('confirm_new'))) return false;
    newPuzzle(n, level, daily);
    return true;
  }

  /* ------------------------------------------------------------ clock */
  var paused = false, runFrom = 0, tick = null;
  function running() { return !!runFrom; }
  function startClock() {
    if (!game || game.done || paused || document.hidden || runFrom) return;
    runFrom = performance.now();
    tick = setInterval(showClock, 1000);
    showClock();
  }
  function stopClock() {
    if (runFrom && game) { game.elapsed += performance.now() - runFrom; saveGame(); }
    runFrom = 0; clearInterval(tick); tick = null; showClock();
  }
  function elapsed() { return game ? game.elapsed + (runFrom ? performance.now() - runFrom : 0) : 0; }
  function fmtTime(ms) {
    var s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60, two = function (v) { return ('0' + v).slice(-2); };
    return (h ? h + ':' + two(m) : two(m)) + ':' + two(x);
  }
  function showClock() { $('#clock').textContent = fmtTime(elapsed()); }
  function setPaused(p) {
    if (!game || game.done) p = false;
    paused = p;
    if (p) stopClock(); else startClock();
    renderPause();
  }
  function renderPause() {
    var hide = paused && game && !game.done;
    $('#board').classList.toggle('paused', !!hide);
    $('#cover').hidden = !hide;
    $('#cover-txt').textContent = t('paused');
    var b = $('#btn-pause');
    b.textContent = (paused ? '▶ ' : '‖ ') + t(paused ? 'resume' : 'pause');
    b.disabled = !game || game.done;
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (running()) { stopClock(); hiddenStop = true; } }
    else if (hiddenStop) { hiddenStop = false; startClock(); }
  });
  var hiddenStop = false;
  window.addEventListener('pagehide', function () { if (running()) { game.elapsed += performance.now() - runFrom; runFrom = performance.now(); saveGame(); } });

  var saveT = null;
  function saveGame() { clearTimeout(saveT); saveT = null; if (game) store.set('game', game); }
  function saveSoon() { if (!saveT) saveT = setTimeout(saveGame, 400); }

  /* ------------------------------------------------------------ board */
  var cells = [];
  function boxOf(n) { return E.BOX[n]; }
  function buildBoard() {
    var n = game.n, b = boxOf(n), board = $('#board');
    board.style.setProperty('--n', n);
    board.textContent = '';
    cells = [];
    for (var i = 0; i < n * n; i++) {
      var r = (i / n) | 0, c = i % n, cls = 'cell';
      if (c === n - 1) cls += ' lc'; else if ((c + 1) % b[1] === 0) cls += ' br';
      if (r === n - 1) cls += ' lr'; else if ((r + 1) % b[0] === 0) cls += ' bb';
      var cell = el('button', { type: 'button', class: cls, role: 'gridcell', tabindex: '-1', dataset: { i: String(i) } });
      cells.push(cell);
      board.appendChild(cell);
    }
    var pc = n === 9 ? 5 : n + 1, pad = $('#pad');
    pad.style.setProperty('--pc', pc);
    pad.textContent = '';
    for (var d = 1; d <= n; d++) pad.appendChild(el('button', { type: 'button', class: 'pk', dataset: { d: String(d) } }, el('span', { text: String(d) }), el('span', { class: 'rem' })));
    pad.appendChild(el('button', { type: 'button', class: 'pk erase', id: 'btn-erase', dataset: { d: '0' } }, el('span', { 'aria-hidden': 'true', text: '⌫' })));
  }
  function posName(i) { return t('cell_name', { r: Math.floor(i / game.n) + 1, c: i % game.n + 1 }); }
  function unitName(u) {
    var n = game.n;
    if (u < n) return t('unit_row', { n: u + 1 });
    if (u < 2 * n) return t('unit_col', { n: u - n + 1 });
    return t('unit_box', { n: u - 2 * n + 1 });
  }
  function wrongSet() {
    var bad = {}, n = game.n, G = E.geo(n);
    for (var i = 0; i < n * n; i++) {
      var d = game.v[i];
      if (!d || game.givens[i]) continue;
      if (d !== game.solution[i]) bad[i] = 1;
      var P = G.peers[i];
      for (var k = 0; k < P.length; k++) if (game.v[P[k]] === d) { bad[i] = 1; if (game.givens[P[k]] || game.v[P[k]] === game.solution[P[k]]) bad['c' + P[k]] = 1; }
    }
    return bad;
  }
  function render() { draw(); }     /* 81 small cells: drawing at once is cheap and keeps taps instant */
  function draw() {
    if (!game) return;
    var n = game.n, G = E.geo(n), nc = n === 4 ? 2 : 3, sd = sel >= 0 ? game.v[sel] : 0, show = S.mistakes || checkFlash;
    var bad = show ? wrongSet() : {}, board = $('#board');
    board.style.setProperty('--n', n);
    for (var i = 0; i < n * n; i++) {
      var cell = cells[i], d = game.v[i], cls = cell.className.replace(/ (given|hl|same|sel|bad|clash|hint-src|hinted)\b/g, '');
      if (game.givens[i]) cls += ' given';
      if (sel >= 0 && i !== sel && G.seen[sel * n * n + i]) cls += ' hl';
      if (sd && d === sd && i !== sel) cls += ' same';
      if (i === sel) cls += ' sel';
      if (bad[i]) cls += ' bad';
      if (bad['c' + i]) cls += ' clash';
      if (hintMark.cells.indexOf(i) >= 0) cls += ' hint-src';
      if (hintMark.target === i) cls += ' hinted';
      cell.className = cls;
      cell.tabIndex = i === (sel >= 0 ? sel : 0) ? 0 : -1;
      var label;
      if (d) {
        if (cell.firstChild && cell.firstChild.nodeType === 1) cell.textContent = '';
        if (cell.textContent !== String(d)) cell.textContent = String(d);
        label = t('cell_val', { pos: posName(i), d: d });
      } else if (game.notes[i]) {
        var m = game.notes[i], box = el('span', { class: 'nts', 'aria-hidden': 'true', style: { '--nc': nc, '--nf': n === 9 ? 0.26 : n === 6 ? 0.22 : 0.24 } });
        for (var q = 1; q <= n; q++) box.appendChild(el('span', { class: (m & (1 << (q - 1))) && sd === q ? 'on' : '', text: m & (1 << (q - 1)) ? String(q) : '' }));
        cell.textContent = ''; cell.appendChild(box);
        label = t('cell_notes', { pos: posName(i), list: E.digitsOf(m).join(', ') });
      } else {
        if (cell.textContent) cell.textContent = '';
        label = t('cell_empty', { pos: posName(i) });
      }
      cell.setAttribute('aria-label', label);
      cell.setAttribute('aria-selected', i === sel ? 'true' : 'false');
    }
    /* number pad: how many of each digit are still to place */
    var cnt = new Array(n + 1).fill(0);
    for (i = 0; i < n * n; i++) if (game.v[i] && game.v[i] === game.solution[i]) cnt[game.v[i]]++;
    $$('#pad .pk').forEach(function (b) {
      var dd = +b.dataset.d;
      if (!dd) { b.setAttribute('aria-label', t('erase')); b.title = t('erase'); return; }
      var left = n - cnt[dd];
      b.querySelector('.rem').textContent = left > 0 ? String(left) : '✓';
      b.classList.toggle('out', left <= 0);
      b.setAttribute('aria-label', t(notesMode ? 'pad_note' : 'pad_aria', { d: dd, n: Math.max(0, left) }));
    });
    $('#pad').classList.toggle('notes', notesMode);
    $('#btn-notes').setAttribute('aria-pressed', notesMode ? 'true' : 'false');
    $('#btn-undo').disabled = !undoStack.length || game.done;
    $('#btn-redo').disabled = !redoStack.length || game.done;
    $('#controls').hidden = !!game.done;
    showClock();
    renderBadges();
    renderPause();
  }
  function levelName(lv) { return t('lv_' + lv); }
  function sizeName(n) { return n + '×' + n; }
  function fmtDate(k) {
    var p = k.split('-');
    try { return new Intl.DateTimeFormat(EDU.langInfo(EDU.lang).tag, { day: 'numeric', month: 'short', year: 'numeric', numberingSystem: 'latn' }).format(new Date(+p[0], +p[1] - 1, +p[2])); }
    catch (e) { return k; }
  }
  function renderBadges() {
    if (!game) return;
    $('#badge').textContent = game.daily ? t('badge_daily', { date: fmtDate(game.daily), level: levelName(game.level) }) : t('badge', { level: levelName(game.level), size: sizeName(game.n) });
    var kid = $('#kidbadge');
    kid.hidden = game.n === 9;
    kid.textContent = t('kids');
  }

  /* ------------------------------------------------------------ moves */
  function snap() { return { v: game.v.slice(), notes: game.notes.slice(), sel: sel }; }
  function pushUndo() { undoStack.push(snap()); if (undoStack.length > 400) undoStack.shift(); redoStack = []; }
  function restore(s) { game.v = s.v; game.notes = s.notes; sel = s.sel; }
  function clearHintMark() { hintMark = { cells: [], target: -1 }; }
  function canEdit() { return game && !game.done && !paused && !busy; }

  function setDigit(i, d, why) {          /* why: 'play' (counts mistakes) | 'hint' | 'reveal' */
    var n = game.n, G = E.geo(n);
    game.v[i] = d; game.notes[i] = 0;
    var bit = 1 << (d - 1), P = G.peers[i];
    for (var k = 0; k < P.length; k++) game.notes[P[k]] &= ~bit;     /* notes of that number disappear around it */
    if (why === 'play' && d !== game.solution[i]) game.mistakes++;
  }
  function input(d) {
    if (!canEdit()) return;
    if (sel < 0) { say(t('pick_cell')); return; }
    if (game.givens[sel]) { say(t('given_cell')); return; }
    clearHintMark(); checkFlash = false;
    if (d === 0) {
      if (!game.v[sel] && !game.notes[sel]) return;
      pushUndo(); game.v[sel] = 0; game.notes[sel] = 0;
    } else if (notesMode) {
      if (game.v[sel]) { say(t('note_filled')); return; }
      pushUndo(); game.notes[sel] ^= 1 << (d - 1);
    } else if (game.v[sel] === d) {
      pushUndo(); game.v[sel] = 0;
    } else {
      pushUndo(); setDigit(sel, d, 'play');
    }
    after();
  }
  function after() {
    saveSoon(); render(); checkWin();
  }
  function undo() { if (!canEdit() || !undoStack.length) return; redoStack.push(snap()); restore(undoStack.pop()); clearHintMark(); after(); }
  function redo() { if (!canEdit() || !redoStack.length) return; undoStack.push(snap()); restore(redoStack.pop()); clearHintMark(); after(); }

  function checkWin() {
    var full = true, right = true;
    for (var i = 0; i < game.v.length; i++) { if (!game.v[i]) { full = false; break; } if (game.v[i] !== game.solution[i]) right = false; }
    if (!full) return;
    if (!right) { say(t('full_wrong')); if (!S.mistakes) { checkFlash = true; render(); } return; }
    finish(false);
  }
  function finish(revealed) {
    stopClock();
    game.done = true; game.revealed = revealed;
    var res = revealed ? {} : recordWin(game);
    saveGame();
    sel = -1; clearHintMark();
    $('#hintbox').textContent = '';
    showDone(res);
    draw(); renderStats();
  }
  function showDone(res) {
    var box = $('#done');
    box.hidden = false;
    box.className = 'callout done ' + (game.revealed ? 'warning' : 'success');
    $('#done-title').textContent = t(game.revealed ? 'done_revealed' : 'done_title');
    $('#done-time').textContent = fmtTime(game.elapsed);
    $('#done-line').textContent = t('done_line', { level: levelName(game.level), size: sizeName(game.n), h: game.hints, m: game.mistakes });
    var extra = [];
    if (res && res.best) extra.push(t('done_best'));
    if (res && res.streak) extra.push(t('done_streak', { n: res.streak }));
    if (game.revealed) extra.push(t('done_try'));
    $('#done-extra').textContent = extra.join(' ');
    if (box.getBoundingClientRect().top > window.innerHeight - 80) box.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    try { box.focus({ preventScroll: true }); } catch (e) { }
  }
  function say(msg) { $('#status').textContent = msg; EDU.toast(msg); }

  /* ------------------------------------------------------------ hints with explanations */
  function knownGrid() {
    var g = game.givens.slice();
    for (var i = 0; i < g.length; i++) if (game.v[i] && game.v[i] === game.solution[i]) g[i] = game.v[i];
    return g;
  }
  function cellsList(list) { return list.map(posName).join('; '); }
  function digitList(mask) { return E.digitsOf(mask).join(', '); }
  function explainChain(e) {
    var units = function (arr) { return arr.map(unitName).join(', '); };
    switch (e.t) {
      case 'pointing': case 'claiming': return t('c_locked', { unit: unitName(e.unit), unit2: unitName(e.unit2), d: e.d });
      case 'nsub': return t('c_nsub', { unit: unitName(e.unit), cells: cellsList(e.cells), digits: digitList(e.digits) });
      case 'hsub': return t('c_hsub', { unit: unitName(e.unit), cells: cellsList(e.cells), digits: digitList(e.digits) });
      case 'fish': return t('c_fish', { d: e.d, base: units(e.base), cover: units(e.cover) });
      case 'xywing': return t('c_wing', { cells: cellsList(e.cells), ends: cellsList(e.cells.slice(1)), d: e.d });
      case 'xyzwing': return t('c_wing', { cells: cellsList(e.cells), ends: cellsList(e.cells), d: e.d });
    }
    return '';
  }
  function explainStep(s) {
    if (s.t === 'full') return t('h_full', { unit: unitName(s.unit), d: s.d });
    if (s.t === 'hidden') return t('h_hidden', { unit: unitName(s.unit), d: s.d });
    if (s.t === 'naked') return t('h_naked', { list: s.have.join(', '), d: s.d });
    if (s.t === 'forcing') {
      var why = s.why.kind === 'cell' ? t('why_cell') : t('why_unit', { unit: unitName(s.why.unit), x: s.why.d });
      return t('h_forcing', { wrong: s.wrong, d: s.d, why: why });
    }
    return '';
  }
  function hint() {
    if (!canEdit()) return;
    var bad = wrongSet(), wrong = Object.keys(bad).filter(function (k) { return k[0] !== 'c'; });
    var box = $('#hintbox');
    if (wrong.length) {
      checkFlash = true; clearHintMark();
      hintMark.cells = wrong.map(Number);
      box.textContent = '';
      box.appendChild(el('p', { text: t('hint_fix', { n: wrong.length }) }));
      render(); return;
    }
    var h = E.hint(knownGrid(), game.n, sel >= 0 && !game.v[sel] ? sel : null);
    if (!h) return;
    box.textContent = '';
    pushUndo();
    var target, text;
    if (h.stuck || !h.step) {
      target = sel >= 0 && !game.v[sel] ? sel : game.v.indexOf(0);
      text = t('h_guess');
      setDigit(target, game.solution[target], 'hint');
    } else {
      target = h.step.cell;
      text = explainStep(h.step);
      setDigit(target, h.step.d, 'hint');
    }
    game.hints++;
    if (h.chain && h.chain.length) {
      box.appendChild(el('p', { text: t('h_first') }));
      var ol = el('ol');
      h.chain.slice(0, 4).forEach(function (e) { ol.appendChild(el('li', { text: explainChain(e) })); });
      if (h.chain.length > 4) ol.appendChild(el('li', { text: t('h_more', { n: h.chain.length - 4 }) }));
      box.appendChild(ol);
    }
    box.appendChild(el('p', { style: { marginTop: h.chain && h.chain.length ? '8px' : '0' } }, el('strong', { text: posName(target) + ': ' + game.solution[target] + '. ' }), text));
    hintMark = { cells: (h.chain || []).reduce(function (a, e) { return a.concat(e.cells || []); }, []).slice(0, 12), target: target };
    sel = target; checkFlash = false;
    after();
  }
  function check() {
    if (!canEdit()) return;
    var bad = wrongSet(), wrong = Object.keys(bad).filter(function (k) { return k[0] !== 'c'; }).length, left = 0;
    for (var i = 0; i < game.v.length; i++) if (!game.v[i]) left++;
    checkFlash = wrong > 0;
    say(wrong ? t('check_bad', { n: wrong }) : t('check_ok', { n: left }));
    render();
  }
  function revealCell() {
    if (!canEdit()) return;
    if (sel < 0 || game.givens[sel]) { say(t('pick_cell')); return; }
    if (game.v[sel] === game.solution[sel]) return;
    pushUndo(); setDigit(sel, game.solution[sel], 'reveal'); game.hints++; clearHintMark();
    hintMark.target = sel;
    after();
  }
  function revealAll() {
    if (!canEdit()) return;
    if (!confirm(t('confirm_reveal'))) return;
    game.v = game.solution.slice(); game.notes = game.notes.map(function () { return 0; });
    finish(true);
  }
  function fillNotes() {
    if (!canEdit()) return;
    pushUndo();
    var c = E.candidates(game.v, game.n);
    for (var i = 0; i < c.length; i++) if (!game.v[i]) game.notes[i] = c[i];
    after();
  }

  /* ------------------------------------------------------------ events */
  $('#board').addEventListener('pointerdown', function (e) {
    var c = e.target.closest('.cell');
    if (!c || paused || busy || !game || game.done) return;
    sel = +c.dataset.i; render();
  });
  $('#board').addEventListener('click', function (e) {
    var c = e.target.closest('.cell');
    if (!c || !game || game.done) return;
    if (sel !== +c.dataset.i) { sel = +c.dataset.i; render(); }
    c.focus({ preventScroll: true });
  });
  $('#pad').addEventListener('click', function (e) { var b = e.target.closest('.pk'); if (b) input(+b.dataset.d); });
  $('#btn-notes').addEventListener('click', function () { notesMode = !notesMode; render(); });
  $('#btn-undo').addEventListener('click', undo);
  $('#btn-redo').addEventListener('click', redo);
  $('#btn-hint').addEventListener('click', hint);
  $('#btn-check').addEventListener('click', check);
  $('#btn-reveal').addEventListener('click', revealCell);
  $('#btn-solve').addEventListener('click', revealAll);
  $('#btn-fill').addEventListener('click', fillNotes);
  $('#btn-pause').addEventListener('click', function () { setPaused(!paused); });
  $('#btn-resume').addEventListener('click', function () { setPaused(false); });
  $('#opt-mistakes').addEventListener('change', function () { S.mistakes = this.checked; saveSettings(); checkFlash = false; render(); });
  $('#btn-again').addEventListener('click', function () { newPuzzle(S.n, S.level, ''); });
  $('#btn-new').addEventListener('click', function () { askNew(S.n, S.level, ''); });
  $('#btn-daily').addEventListener('click', function () {
    var k = dayKey();
    if (game && game.daily === k && !game.done) { say(t('daily_on')); return; }
    var st = getStats();
    if (st.daily.last === k && !confirm(t('daily_again'))) return;
    askNew(9, dailyLevel(k), k);
  });
  $('#seg-size').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var n = +b.dataset.n, lv = E.LEVELS_FOR[n].indexOf(S.level) >= 0 ? S.level : E.LEVELS_FOR[n][E.LEVELS_FOR[n].length - 1];
    if (n === S.n && game && game.n === n && !game.daily) return;
    if (!askNew(n, lv, '')) return;
    S.n = n; S.level = lv; saveSettings(); renderControls();
  });
  $('#seg-level').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || b.hidden) return;
    var lv = b.dataset.lv;
    if (lv === S.level && game && game.n === S.n && game.level === lv && !game.daily) return;
    if (!askNew(S.n, lv, '')) return;
    S.level = lv; saveSettings(); renderControls();
  });

  document.addEventListener('keydown', function (e) {
    if (!game || e.altKey || e.metaKey) return;
    var tg = e.target, tag = tg && tg.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || document.querySelector('.edu-modal-back')) return;
    var onBoard = tg && tg.closest && tg.closest('#board'), k = e.key, n = game.n;
    if (e.ctrlKey) {
      if (k === 'z' || k === 'Z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
      else if (k === 'y' || k === 'Y') { e.preventDefault(); redo(); }
      return;
    }
    var moves = { ArrowUp: -n, ArrowDown: n, ArrowLeft: -1, ArrowRight: 1 };
    if (moves[k] !== undefined && (onBoard || sel >= 0) && !game.done) {
      if (tag === 'BUTTON' && !onBoard) return;
      e.preventDefault();
      if (sel < 0) sel = 0;
      else {
        var r = Math.floor(sel / n), c = sel % n;
        if (k === 'ArrowUp') r = (r + n - 1) % n; else if (k === 'ArrowDown') r = (r + 1) % n;
        else if (k === 'ArrowLeft') c = (c + n - 1) % n; else c = (c + 1) % n;
        sel = r * n + c;
      }
      draw(); cells[sel].focus({ preventScroll: false });
      return;
    }
    if (/^[1-9]$/.test(k) && +k <= n) { if (sel >= 0) { e.preventDefault(); input(+k); } return; }
    if (k === '0' || k === 'Backspace' || k === 'Delete') { if (sel >= 0 && (onBoard || tag !== 'BUTTON')) { e.preventDefault(); input(0); } return; }
    if (k === 'n' || k === 'N') { notesMode = !notesMode; render(); return; }
    if (k === 'h' || k === 'H') { hint(); return; }
    if (k === 'z' || k === 'Z') { undo(); return; }
    if (k === 'y' || k === 'Y') { redo(); return; }
    if (k === 'p' || k === 'P') { setPaused(!paused); return; }
  });

  /* ------------------------------------------------------------ controls, stats */
  function renderControls() {
    $$('#seg-size button').forEach(function (b) { b.setAttribute('aria-pressed', +b.dataset.n === S.n ? 'true' : 'false'); });
    $$('#seg-level button').forEach(function (b) {
      b.hidden = E.LEVELS_FOR[S.n].indexOf(b.dataset.lv) < 0;
      b.setAttribute('aria-pressed', b.dataset.lv === S.level ? 'true' : 'false');
    });
    $('#lv-desc').textContent = S.n === 9 ? t('desc_' + S.level) : t('desc_small');
    $('#opt-mistakes').checked = S.mistakes;
    $('#btn-daily').title = t('daily_note', { level: levelName(dailyLevel(dayKey())) });
  }
  function renderStats() {
    var st = getStats(), tb = $('#stats');
    tb.textContent = '';
    tb.appendChild(el('thead', null, el('tr', null, el('th', { text: t('level_label') }), el('th', { class: 'num', text: t('st_won') }),
      el('th', { class: 'num', text: t('st_best') }), el('th', { class: 'num', text: t('st_avg') }))));
    var body = el('tbody'), any = false;
    [9, 6, 4].forEach(function (n) {
      E.LEVELS_FOR[n].forEach(function (lv) {
        var r = st.lv[n + '-' + lv];
        if (!r && n !== 9) return;
        any = any || !!r;
        body.appendChild(el('tr', null, el('td', { text: levelName(lv) + ' · ' + sizeName(n) }), el('td', { class: 'num', text: r ? EDU.fmt(r.won) : '0' }),
          el('td', { class: 'num', text: r && r.best ? fmtTime(r.best * 1000) : '–' }), el('td', { class: 'num', text: r && r.won ? fmtTime(Math.round(r.total / r.won) * 1000) : '–' })));
      });
    });
    tb.appendChild(body);
    $('#streak').textContent = t('st_streak', { n: currentStreak(st), b: st.daily.best || 0 }) + ' ' + t('daily_note', { level: levelName(dailyLevel(dayKey())) });
  }
  $('#btn-reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset_stats'))) return;
    store.remove('stats'); renderStats(); EDU.toast(t('stats_cleared'));
  });

  /* ------------------------------------------------------------ printing */
  function fillPrLevels() {
    var n = +$('#pr-size').value, s = $('#pr-level'), cur = s.value || S.level;
    s.textContent = '';
    E.LEVELS_FOR[n].forEach(function (lv) { s.appendChild(el('option', { value: lv, text: levelName(lv) })); });
    s.value = E.LEVELS_FOR[n].indexOf(cur) >= 0 ? cur : E.LEVELS_FOR[n][0];
  }
  function gridTable(n, values, givens, cs) {
    var b = boxOf(n), tb = el('table', { class: 'pp-grid', style: { '--cs': cs } }), body = el('tbody');
    for (var r = 0; r < n; r++) {
      var tr = el('tr');
      for (var c = 0; c < n; c++) {
        var i = r * n + c, cls = [];
        if (c < n - 1 && (c + 1) % b[1] === 0) cls.push('br');
        if (r < n - 1 && (r + 1) % b[0] === 0) cls.push('bb');
        if (givens && givens[i]) cls.push('g');
        tr.appendChild(el('td', { class: cls.join(' '), text: values[i] ? String(values[i]) : '' }));
      }
      body.appendChild(tr);
    }
    tb.appendChild(body);
    return tb;
  }
  function cellSize(n, per, big) {
    var side = per === 1 ? (big ? 178 : 160) : per === 2 ? (big ? 118 : 112) : (big ? 88 : 84);   /* grid side in mm on A4 */
    return (side / n).toFixed(2) + 'mm';
  }
  function buildPrint(list, per, big, key) {
    var area = $('#print-area');
    area.textContent = '';
    var today = fmtDate(dayKey());
    var head = function (title) { return el('div', { class: 'pp-head' }, el('strong', { text: title }), el('span', { text: today })); };
    for (var p = 0; p < list.length; p += per) {
      var page = el('section', { class: 'pp-page per-' + per + (big ? ' big' : '') }), ul = el('div', { class: 'pp-list' });
      page.appendChild(head(t('app_title')));
      page.appendChild(el('div', { class: 'pp-name' }, t('print_name'), el('span'), t('print_time'), el('span')));
      list.slice(p, p + per).forEach(function (z, k) {
        ul.appendChild(el('div', { class: 'pp-item' }, el('div', { class: 'pp-cap', text: t('print_cap', { n: p + k + 1, level: levelName(z.level), size: sizeName(z.n) }) }),
          gridTable(z.n, z.givens, null, cellSize(z.n, per, big))));
      });
      page.appendChild(ul);
      page.appendChild(el('div', { class: 'pp-foot', text: t('print_foot') }));
      area.appendChild(page);
    }
    if (key) {
      for (var a = 0; a < list.length; a += 9) {
        var kp = el('section', { class: 'pp-page pp-key' }), kl = el('div', { class: 'pp-list' });
        kp.appendChild(head(t('print_answers')));
        list.slice(a, a + 9).forEach(function (z, k) {
          kl.appendChild(el('div', { class: 'pp-item' }, el('div', { class: 'pp-cap', text: t('print_cap', { n: a + k + 1, level: levelName(z.level), size: sizeName(z.n) }) }),
            gridTable(z.n, z.solution, z.givens, (54 / z.n).toFixed(2) + 'mm')));
        });
        kp.appendChild(kl);
        area.appendChild(kp);
      }
    }
  }
  function doPrint() { setTimeout(function () { window.print(); }, 60); }
  var printing = false;
  $('#btn-print').addEventListener('click', function () {
    if (printing) return;
    var n = +$('#pr-size').value, lv = $('#pr-level').value, per = +$('#pr-per').value, pages = +$('#pr-pages').value;
    var total = per * pages, list = [], st = $('#pr-status');
    S.prPer = per; S.prPages = pages; S.prBig = $('#pr-big').checked; S.prKey = $('#pr-key').checked; saveSettings();
    printing = true; $('#btn-print').disabled = true;
    (function next() {
      st.textContent = t('print_making', { a: list.length + 1, b: total });
      makePuzzle(n, lv, randomSeed(), function (p) {
        list.push(p);
        if (list.length < total) return next();
        printing = false; $('#btn-print').disabled = false; st.textContent = '';
        buildPrint(list, per, S.prBig, S.prKey);
        doPrint();
      });
    })();
  });
  $('#btn-print-this').addEventListener('click', function () {
    if (!game) return;
    buildPrint([{ n: game.n, level: game.level, givens: game.givens, solution: game.solution }], 1, $('#pr-big').checked, true);
    doPrint();
  });
  $('#pr-size').addEventListener('change', fillPrLevels);

  /* ------------------------------------------------------------ language + start */
  function renderAll() {
    renderControls(); renderStats(); fillPrLevels();
    if (game) { draw(); if (game.done) showDone(null); }
  }
  EDU.onLang(renderAll);

  $('#pr-size').value = String(S.n);
  $('#pr-per').value = String(S.prPer);
  $('#pr-pages').value = String(S.prPages);
  $('#pr-big').checked = S.prBig;
  $('#pr-key').checked = S.prKey;
  fillPrLevels();
  if (game) {
    buildBoard(); renderAll(); startClock();
    if (game.done) showDone(null);
  } else {
    startGame(E.generate(S.n, S.level, randomSeed()), '');   /* easy puzzles take a few milliseconds */
    renderAll();
  }

  /* ------------------------------------------------------------ test hook (used by tools/tests/sudoku.test.js only) */
  window.__gameTest = {
    solutionCount: function (grid, n) { return E.countSolutions(grid || game.givens, n || game.n, 2); },
    solution: function () { return game.solution.slice(); },
    givens: function () { return game.givens.slice(); },
    values: function () { return game.v.slice(); },
    generate: function (n, level, seed) { var p = E.generate(n, level, seed || 1); return { givens: p.givens, solution: p.solution, tier: p.tier, unique: p.unique }; },
    /* load({ n, givens, solution?, level? }) starts that puzzle, exactly as if it had been generated */
    load: function (o) {
      var n = +o.n, sol = o.solution || E.solve(o.givens, n);
      if (!sol || E.countSolutions(o.givens, n, 2) !== 1) return false;
      startGame({ n: n, level: E.LEVELS_FOR[n].indexOf(o.level) >= 0 ? o.level : 'easy', seed: 0, givens: o.givens.slice(), solution: sol.slice() }, '');
      draw();
      return true;
    },
    done: function () { return !!(game && game.done); }
  };
})();
