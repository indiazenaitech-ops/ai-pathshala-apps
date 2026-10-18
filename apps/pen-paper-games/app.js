/* Tic-Tac-Toe & More: four pen-and-paper games with a fair computer opponent.
   Rules and computer players live in engine.js (window.PPG); this file is the UI, saving and turn flow. */
(function () {
  'use strict';
  var SLUG = 'pen-paper-games';
  var t = EDU.t, $ = EDU.$, $$ = EDU.$$, el = EDU.el, fmt = EDU.fmt;
  var store = EDU.store(SLUG);
  var reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var SVGNS = 'http://www.w3.org/2000/svg';
  var GAMES = ['ttt', 'c4', 'dots', 'bulls'];
  var MODES = { ttt: ['cpu', 'two'], c4: ['cpu', 'two'], dots: ['cpu', 'two'], bulls: ['solo', 'cpu', 'two'] };
  var LEVELS = ['easy', 'medium', 'hard'];

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'wa_game' });

  /* ------------------------------------------------------------ state */
  function blankScore() { return { 1: 0, 2: 0, d: 0 }; }
  function freshGame(id, keep) {
    keep = keep || {};
    var g = { mode: keep.mode || (id === 'bulls' ? 'solo' : 'cpu'), level: keep.level || 'medium', starter: keep.starter || 1,
      score: keep.score || blankScore(), gen: (keep.gen || 0) + 1, over: false, winner: 0, moves: 0 };
    if (id === 'ttt') { g.size = keep.size || 3; g.board = zeros(g.size * g.size); g.line = null; g.blocked = false; g.last = -1; }
    if (id === 'c4') { g.board = zeros(42); g.line = null; g.last = -1; }
    if (id === 'dots') { g.size = keep.size || 4; var dg = PPG.dots.geom(g.size, g.size); g.lines = zeros(dg.L); g.boxes = zeros(dg.B); g.last = -1; g.pts = { 1: 0, 2: 0 }; g.again = false; }
    if (id === 'bulls') {
      g.len = keep.len || 4; g.hist = { 1: [], 2: [] }; g.secret = { 1: '', 2: '' }; g.best = keep.best || 0; g.played = keep.played || 0;
      g.err = ''; g.solvedBy = 0; g.gaveUp = false;
      if (g.mode === 'solo') { g.phase = 'play'; g.secret[1] = randomSecret(g.len); g.turn = 1; }
      else { g.phase = 'setup1'; g.secret[1] = g.mode === 'cpu' ? randomSecret(g.len) : ''; g.turn = g.starter; }
    }
    if (id !== 'bulls') g.turn = g.starter;
    return g;
  }
  function zeros(n) { var a = []; for (var i = 0; i < n; i++) a.push(0); return a; }
  function randomSecret(len) { var all = PPG.bc.all(len, true); return all[Math.floor(Math.random() * all.length)]; }

  function load() {
    var d = store.get('state', null), S = { tab: 'ttt', sound: false, think: false, names: { 1: '', 2: '' }, games: {} };
    GAMES.forEach(function (id) { S.games[id] = freshGame(id); });
    if (!d || typeof d !== 'object') return S;
    try {
      if (GAMES.indexOf(d.tab) >= 0) S.tab = d.tab;
      S.sound = !!d.sound; S.think = !!d.think;
      if (d.names) { S.names[1] = String(d.names[1] || '').slice(0, 16); S.names[2] = String(d.names[2] || '').slice(0, 16); }
      GAMES.forEach(function (id) { var g = d.games && d.games[id]; if (g && valid(id, g)) S.games[id] = g; });
    } catch (e) { }
    return S;
  }
  function valid(id, g) {
    if (MODES[id].indexOf(g.mode) < 0 || LEVELS.indexOf(g.level) < 0 || !g.score || [1, 2].indexOf(g.turn) < 0) return false;
    if (id === 'ttt') return [3, 4, 5].indexOf(g.size) >= 0 && Array.isArray(g.board) && g.board.length === g.size * g.size;
    if (id === 'c4') return Array.isArray(g.board) && g.board.length === 42;
    if (id === 'dots') { if ([3, 4, 5, 6].indexOf(g.size) < 0) return false; var dg = PPG.dots.geom(g.size, g.size); return Array.isArray(g.lines) && g.lines.length === dg.L && Array.isArray(g.boxes) && g.boxes.length === dg.B && g.pts; }
    if (id === 'bulls') return [3, 4].indexOf(g.len) >= 0 && g.hist && Array.isArray(g.hist[1]) && Array.isArray(g.hist[2]) && g.secret && typeof g.phase === 'string';
    return false;
  }
  var S = load();
  var saveT = 0;
  function save() { clearTimeout(saveT); saveT = setTimeout(saveNow, 200); }
  function saveNow() { clearTimeout(saveT); store.set('state', S); }
  window.addEventListener('pagehide', saveNow);

  function G() { return S.games[S.tab]; }
  function isCpu(g, p) { return g.mode === 'cpu' && p === 2; }
  function pname(p, g) {
    g = g || G();
    if (isCpu(g, p)) return t('computer');
    var n = (S.names[p] || '').trim();
    return n || t(p === 1 ? 'def_p1' : 'def_p2');
  }
  function mark(p) { return p === 1 ? 'X' : 'O'; }

  /* ------------------------------------------------------------ the computer: a Blob worker (works on file://) */
  var worker = null, workerOk = true, reqs = {}, reqId = 0, testSeed = null;
  function getWorker() {
    if (worker || !workerOk) return worker;
    try {
      var src = 'var PPG=' + window.PPG_SOURCE + ';self.onmessage=function(e){var r;try{r=PPG.ai(e.data.req);}catch(x){r=null;}self.postMessage({id:e.data.id,res:r});};';
      var url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
      worker = new Worker(url);
      worker.onmessage = function (e) { var cb = reqs[e.data.id]; if (cb) { delete reqs[e.data.id]; cb(e.data.res); } };
      worker.onerror = function () { workerOk = false; worker = null; Object.keys(reqs).forEach(function (k) { var cb = reqs[k]; delete reqs[k]; cb('retry'); }); };
    } catch (e) { workerOk = false; worker = null; }
    return worker;
  }
  function think(req) {
    if (testSeed !== null) req.seed = testSeed++;
    return new Promise(function (resolve) {
      function local() { setTimeout(function () { var r2 = Object.assign({}, req); if (r2.timeMs) r2.timeMs = Math.min(r2.timeMs, 400); resolve(PPG.ai(r2)); }, 30); }
      var w = getWorker();
      if (!w) return local();
      var id = ++reqId;
      reqs[id] = function (res) { if (res === 'retry' || res === null) local(); else resolve(res); };
      w.postMessage({ id: id, req: req });
    });
  }
  var busy = {};
  function later(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function cpuTurn(id) {
    var g = S.games[id];
    if (g.mode !== 'cpu' || g.over || g.turn !== 2 || busy[id]) return;
    if (id === 'bulls' && g.phase !== 'play') return;
    var req;
    if (id === 'ttt') req = { game: 'ttt', board: g.board.slice(), n: g.size, k: g.size === 3 ? 3 : 4, p: 2, level: g.level, timeMs: 700 };
    else if (id === 'c4') req = { game: 'c4', board: g.board.slice(), p: 2, level: g.level, timeMs: 900 };
    else if (id === 'dots') req = { game: 'dots', R: g.size, C: g.size, lines: g.lines.slice(), boxes: g.boxes.slice(), p: 2, level: g.level };
    else req = { game: 'bulls', len: g.len, zero: true, hist: g.hist[2].slice(), level: g.level };
    busy[id] = g.gen; render();
    var t0 = Date.now(), gen = g.gen;
    Promise.all([think(req), later(id === 'dots' && g.again ? 380 : 480)]).then(function (out) {
      busy[id] = 0;
      var res = out[0], g2 = S.games[id];
      if (g2 !== g || g.gen !== gen || g.over) { render(); return; }
      if (id === 'ttt') tttPlay(g, res.move);
      else if (id === 'c4') c4Play(g, res.move);
      else if (id === 'dots') dotsDraw(g, res.move);
      else bcApply(g, 2, res.guess);
      void t0;
    });
  }
  function cpuAll() { GAMES.forEach(cpuTurn); }

  /* ------------------------------------------------------------ sound (off by default) */
  var actx = null;
  function beep(kind) {
    if (!S.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var notes = kind === 'win' ? [523, 659, 784] : kind === 'draw' ? [440, 392] : kind === 'box' ? [660, 880] : [kind === 2 ? 392 : 523];
      notes.forEach(function (f, i) {
        var o = actx.createOscillator(), gn = actx.createGain(), at = actx.currentTime + i * 0.11;
        o.frequency.value = f; o.type = 'triangle';
        gn.gain.setValueAtTime(0.0001, at); gn.gain.exponentialRampToValueAtTime(0.18, at + 0.02); gn.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
        o.connect(gn); gn.connect(actx.destination); o.start(at); o.stop(at + 0.18);
      });
    } catch (e) { }
  }

  /* ------------------------------------------------------------ end of a game */
  function finish(g, winner) {
    g.over = true; g.winner = winner;
    if (winner) g.score[winner]++; else g.score.d++;
    g.starter = 3 - g.starter;            /* players take turns to start */
    beep(winner ? 'win' : 'draw');
  }
  function newGame(id, opts) {
    var g = S.games[id];
    S.games[id] = freshGame(id, Object.assign({ mode: g.mode, level: g.level, starter: g.starter, score: g.score, gen: g.gen, size: g.size, len: g.len, best: g.best, played: g.played }, opts || {}));
    busy[id] = 0; rateCache = {};
    save(); render(); cpuTurn(id);
  }
  function inProgress(g) {
    if (g.over) return false;
    if (S.tab === 'bulls') return g.hist[1].length + g.hist[2].length > 0;
    return g.moves > 0;
  }
  function changeSetting(apply) {
    var g = G();
    if (inProgress(g) && !confirm(t('confirm_restart'))) { render(); return; }
    apply(g);
    newGame(S.tab);
  }

  /* ------------------------------------------------------------ Tic-Tac-Toe */
  function tttK(g) { return g.size === 3 ? 3 : 4; }
  function tttPlay(g, i) {
    if (g.over || i < 0 || g.board[i]) return;
    g.board[i] = g.turn; g.moves++; g.last = i;
    beep(g.turn);
    var st = PPG.ttt.status(g.board, g.size, tttK(g));
    if (st.over) { g.line = st.line; g.blocked = !!st.blocked; finish(g, st.winner); }
    else g.turn = 3 - g.turn;
    save(); render(); cpuTurn('ttt');
  }
  var rateCache = {}, ratePending = '';
  function rateKey(g) { return g.gen + ':' + g.size + ':' + g.board.join(''); }
  function wantRate(g) { return S.tab === 'ttt' && S.think && !g.over && !isCpu(g, g.turn); }
  function requestRate(g) {
    var key = rateKey(g);
    if (!wantRate(g) || rateCache[key] || ratePending === key) return;
    ratePending = key;
    think({ game: 'ttt', rate: true, board: g.board.slice(), n: g.size, k: tttK(g), p: g.turn, timeMs: g.size === 3 ? 0 : 450 }).then(function (res) {
      ratePending = '';
      if (res) rateCache[key] = { res: res, p: g.turn };
      if (S.tab === 'ttt' && rateKey(S.games.ttt) === key) render();
    });
  }
  var RATE_SYM = { win: '✓', good: '▲', draw: '=', even: '=', bad: '▼', lose: '✗' };
  var focusCell = 0;
  function renderTtt(host, g) {
    var n = g.size, r = wantRate(g) ? rateCache[rateKey(g)] : null, cpuNow = isCpu(g, g.turn) || !!busy.ttt;
    var grid = el('div', { class: 'ttt n' + n, id: 'ttt-board', role: 'grid', 'aria-label': t('tab_ttt'), style: { gridTemplateColumns: 'repeat(' + n + ', minmax(0, 1fr))' } });
    if (focusCell >= n * n) focusCell = 0;
    for (var i = 0; i < n * n; i++) {
      var v = g.board[i], cat = r && !v ? r.res.cats[i] : null;
      var lbl = t('cell_label', { r: fmt(Math.floor(i / n) + 1), c: fmt(i % n + 1), v: v ? mark(v) : t('cell_empty') }) + (cat ? ' (' + t('rate_' + cat) + ')' : '');
      var b = el('button', { type: 'button', class: (v ? 'm' + v : '') + (g.line && g.line.indexOf(i) >= 0 ? ' win' : '') + (i === g.last ? ' last' : '') + (cat ? ' r-' + cat : ''),
        'data-cell': i, 'aria-label': lbl, tabindex: i === focusCell ? '0' : '-1' }, v ? mark(v) : '');
      if (cat) b.appendChild(el('span', { class: 'rt', 'aria-hidden': 'true', text: RATE_SYM[cat] }));
      if (v || g.over || cpuNow) b.disabled = !!(v || g.over);
      grid.appendChild(b);
    }
    host.appendChild(grid);
    if (wantRate(g) && !r) requestRate(g);
  }
  function tttThinkText(g) {
    if (!S.think) return '';
    if (g.over) return '';
    if (!wantRate(g)) return t('think_off_turn');
    var r = rateCache[rateKey(g)];
    if (!r) return t('think_wait');
    if (r.res.exact) return t('think_exact', { name: pname(r.p, g), g: fmt(r.res.games) });
    return t('think_depth', { name: pname(r.p, g), d: fmt(r.res.depth || 1) });
  }

  /* ------------------------------------------------------------ Four in a Row */
  var dropAnim = -1, focusCol = 3;
  function c4Play(g, c) {
    if (g.over || c < 0 || c > 6) return;
    var r = PPG.c4.row(g.board, c);
    if (r < 0) { EDU.toast(t('col_full')); return; }
    var idx = c * 6 + r;
    g.board[idx] = g.turn; g.moves++; g.last = idx; dropAnim = idx;
    beep(g.turn);
    var st = PPG.c4.status(g.board);
    if (st.over) { g.line = st.line; finish(g, st.winner); }
    else g.turn = 3 - g.turn;
    save(); render(); cpuTurn('c4');
  }
  function svg(tag, attrs) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function renderC4(host, g) {
    var cpuNow = isCpu(g, g.turn) || !!busy.c4;
    var wrap = el('div', { class: 'c4' });
    var cols = el('div', { class: 'c4-cols', id: 'c4-cols' });
    for (var c = 0; c < 7; c++) {
      var full = PPG.c4.row(g.board, c) < 0;
      var b = el('button', { type: 'button', 'data-col': c, 'aria-label': t('c4_col', { n: fmt(c + 1) }), tabindex: c === focusCol ? '0' : '-1', title: t('c4_col', { n: fmt(c + 1) }) }, '▼');
      b.disabled = g.over || full || cpuNow;
      cols.appendChild(b);
    }
    wrap.appendChild(cols);
    var s = svg('svg', { viewBox: '0 0 700 600', role: 'img', 'aria-label': t('c4_board_label'), id: 'c4-svg' });
    s.appendChild(svg('rect', { class: 'frame', x: 0, y: 0, width: 700, height: 600, rx: 30 }));
    for (c = 0; c < 7; c++) for (var r = 0; r < 6; r++) {
      var idx = c * 6 + r, cx = c * 100 + 50, cy = (5 - r) * 100 + 50, v = g.board[idx];
      s.appendChild(svg('circle', { class: 'hole', cx: cx, cy: cy, r: 40 }));
      if (v) {
        var pc = svg('circle', { class: 'pc p' + v + (g.line && g.line.indexOf(idx) >= 0 ? ' win' : ''), cx: cx, cy: cy, r: 40, 'data-cell': idx });
        if (idx === dropAnim && !reduceMotion) {
          pc.setAttribute('class', pc.getAttribute('class') + ' drop');
          pc.style.setProperty('--dy', -(cy + 50) + 'px');
          pc.style.setProperty('--dur', (0.15 + 0.05 * (6 - r)) + 's');
        }
        s.appendChild(pc);
        if (idx === g.last && !g.line) s.appendChild(svg('circle', { class: 'ring', cx: cx, cy: cy, r: 22 }));
      }
    }
    dropAnim = -1;
    s.addEventListener('click', function (e) {
      var gg = S.games.c4;
      if (gg.over || isCpu(gg, gg.turn) || busy.c4) return;
      var box = s.getBoundingClientRect(), col = Math.floor((e.clientX - box.left) / box.width * 7);
      if (col >= 0 && col < 7) c4Play(gg, col);
    });
    wrap.appendChild(s);
    host.appendChild(wrap);
  }

  /* ------------------------------------------------------------ Dots and Boxes */
  var focusLine = 0, DS = 100, DP = 30;
  function dotsXY(dg, l) {          /* end points of line l */
    if (l < dg.H) { var r = Math.floor(l / dg.C), c = l % dg.C; return [c, r, c + 1, r]; }
    var k = l - dg.H, rr = Math.floor(k / (dg.C + 1)), cc = k % (dg.C + 1);
    return [cc, rr, cc, rr + 1];
  }
  function dotsDraw(g, l) {
    var dg = PPG.dots.geom(g.size, g.size);
    if (g.over || l < 0 || l >= dg.L || g.lines[l]) return;
    var done = PPG.dots.play(dg, g.lines, g.boxes, l, g.turn);
    g.moves++; g.last = l;
    g.pts[g.turn] += done.length;
    g.again = done.length > 0;
    beep(done.length ? 'box' : g.turn);
    if (g.pts[1] + g.pts[2] === dg.B) finish(g, g.pts[1] > g.pts[2] ? 1 : g.pts[2] > g.pts[1] ? 2 : 0);
    else if (!done.length) g.turn = 3 - g.turn;
    save(); render(); cpuTurn('dots');
  }
  function renderDots(host, g) {
    var dg = PPG.dots.geom(g.size, g.size), W = g.size * DS + 2 * DP, cpuNow = isCpu(g, g.turn) || !!busy.dots;
    var wrap = el('div', { class: 'dots' });
    var s = svg('svg', { viewBox: '0 0 ' + W + ' ' + W, id: 'dots-svg', role: 'group', 'aria-label': t('dots_board_label') });
    var b, l, p;
    for (b = 0; b < dg.B; b++) {
      var bo = g.boxes[b];
      if (!bo) continue;
      var bx = (b % dg.C) * DS + DP, by = Math.floor(b / dg.C) * DS + DP;
      s.appendChild(svg('rect', { class: 'bx p' + bo, x: bx + 4, y: by + 4, width: DS - 8, height: DS - 8, rx: 8 }));
      var tx = svg('text', { class: 'bt p' + bo, x: bx + DS / 2, y: by + DS / 2 });
      tx.textContent = (pname(bo, g).trim().charAt(0) || mark(bo)).toUpperCase();
      s.appendChild(tx);
    }
    if (focusLine >= dg.L) focusLine = 0;
    for (l = 0; l < dg.L; l++) {
      p = dotsXY(dg, l);
      var x1 = p[0] * DS + DP, y1 = p[1] * DS + DP, x2 = p[2] * DS + DP, y2 = p[3] * DS + DP, own = g.lines[l];
      s.appendChild(svg('line', { class: 'ln' + (own ? ' p' + own : '') + (l === g.last ? ' last' : ''), x1: x1, y1: y1, x2: x2, y2: y2 }));
      var hit = svg('line', { class: 'hit' + (own ? ' on' : ''), x1: x1, y1: y1, x2: x2, y2: y2, 'data-line': l, tabindex: l === focusLine ? '0' : '-1', role: 'button',
        'aria-label': t('dots_line', { a: fmt(p[1] + 1) + '-' + fmt(p[0] + 1), b: fmt(p[3] + 1) + '-' + fmt(p[2] + 1) }) + (own ? ' (' + pname(own, g) + ')' : '') });
      if (own || g.over || cpuNow) hit.setAttribute('aria-disabled', 'true');
      s.appendChild(hit);
    }
    for (var r = 0; r <= dg.R; r++) for (var c = 0; c <= dg.C; c++) s.appendChild(svg('circle', { class: 'dt', cx: c * DS + DP, cy: r * DS + DP, r: 9 }));
    s.addEventListener('click', function (e) {
      var gg = S.games.dots;
      if (gg.over || isCpu(gg, gg.turn) || busy.dots) return;
      var tl = e.target && e.target.getAttribute && e.target.getAttribute('data-line');
      if (tl !== null && tl !== undefined && !gg.lines[+tl]) { focusLine = +tl; dotsDraw(gg, +tl); return; }
      var box = s.getBoundingClientRect(), sc = W / box.width, x = (e.clientX - box.left) * sc, y = (e.clientY - box.top) * sc, best = -1, bd = 40;
      for (var q = 0; q < dg.L; q++) {
        if (gg.lines[q]) continue;
        var pp = dotsXY(dg, q), mx = (pp[0] + pp[2]) / 2 * DS + DP, my = (pp[1] + pp[3]) / 2 * DS + DP;
        var dd = pp[0] === pp[2] ? Math.max(Math.abs(x - mx), Math.max(0, Math.abs(y - my) - DS / 2) * 3) : Math.max(Math.abs(y - my), Math.max(0, Math.abs(x - mx) - DS / 2) * 3);
        if (dd < bd) { bd = dd; best = q; }
      }
      if (best >= 0) { focusLine = best; dotsDraw(gg, best); }
    });
    s.addEventListener('keydown', function (e) {
      var gg = S.games.dots, cur = focusLine;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!gg.over && !isCpu(gg, gg.turn) && !busy.dots && !gg.lines[cur]) dotsDraw(gg, cur);
        return;
      }
      var dir = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[e.key];
      if (!dir) return;
      e.preventDefault();
      var a = dotsXY(dg, cur), ax = (a[0] + a[2]) / 2, ay = (a[1] + a[3]) / 2, best = -1, bd = Infinity;
      for (var q = 0; q < dg.L; q++) {
        if (q === cur) continue;
        var pp = dotsXY(dg, q), dx = (pp[0] + pp[2]) / 2 - ax, dy = (pp[1] + pp[3]) / 2 - ay, along = dx * dir[0] + dy * dir[1];
        if (along <= 0.01) continue;
        var side = Math.abs(dx * dir[1]) + Math.abs(dy * dir[0]), score = along + side * 2;
        if (score < bd) { bd = score; best = q; }
      }
      if (best >= 0) { focusLine = best; $$('#dots-svg .hit').forEach(function (h) { h.setAttribute('tabindex', +h.getAttribute('data-line') === best ? '0' : '-1'); }); var nh = $('#dots-svg .hit[data-line="' + best + '"]'); if (nh) nh.focus(); }
    });
    wrap.appendChild(s);
    host.appendChild(wrap);
  }

  /* ------------------------------------------------------------ Bulls and Cows */
  function other(p) { return 3 - p; }
  function bcApply(g, p, guess) {
    var target = g.secret[p], r = PPG.bc.score(target, guess);
    g.hist[p].push({ g: guess, b: r.b, c: r.c });
    beep(r.b === g.len ? 'win' : p);
    var n1 = g.hist[1].length, n2 = g.hist[2].length, s1 = solved(g, 1), s2 = solved(g, 2);
    if (g.mode === 'solo') {
      if (r.b === g.len) { g.over = true; g.winner = 1; g.played++; if (!g.best || n1 < g.best) g.best = n1; beep('win'); }
    } else if ((s1 || s2) && n1 === n2) {
      finish(g, s1 && s2 ? 0 : s1 ? 1 : 2);
    } else g.turn = other(p);
    g.err = '';
    save(); render(); cpuTurn('bulls');
  }
  function solved(g, p) { var h = g.hist[p]; return h.length > 0 && h[h.length - 1].b === g.len; }
  var bcDraft = '';
  function bcSubmit() {
    var g = S.games.bulls, inp = $('#bc-input');
    if (!inp || g.over || g.phase !== 'play' || isCpu(g, g.turn) || busy.bulls) return;
    var v = inp.value.replace(/\s/g, ''), e = PPG.bc.check(v, g.len, true);
    if (!e && g.hist[g.turn].some(function (h) { return h.g === v; })) e = 'dup';
    if (e) { g.err = e; render(); var i2 = $('#bc-input'); if (i2) i2.focus(); return; }
    bcDraft = '';
    bcApply(g, g.turn, v);
    var i3 = $('#bc-input'); if (i3) i3.focus();
  }
  function bcLock(rand) {
    var g = S.games.bulls, inp = $('#bc-secret');
    var v = rand ? randomSecret(g.len) : (inp ? inp.value.replace(/\s/g, '') : ''), e = PPG.bc.check(v, g.len, true);
    if (e) { g.err = e; render(); var i2 = $('#bc-secret'); if (i2) i2.focus(); return; }
    g.err = '';
    if (g.phase === 'setup1') { g.secret[2] = v; g.phase = g.mode === 'two' ? 'setup2' : 'play'; }
    else if (g.phase === 'setup2') { g.secret[1] = v; g.phase = 'play'; }
    if (g.phase === 'play') g.turn = g.starter;
    save(); render(); cpuTurn('bulls');
  }
  function errText(g) {
    if (!g.err) return '';
    return g.err === 'len' ? t('bc_err_len', { n: fmt(g.len) }) : t('bc_err_' + g.err);
  }
  function histTable(g, p) {
    var h = g.hist[p];
    var box = el('div', { class: 'bc-hist' }, el('h3', null, el('span', { class: 'dot p' + p, 'aria-hidden': 'true' }), t('bc_hist_title', { name: pname(p, g) })));
    if (!h.length) { box.appendChild(el('p', { class: 'hint', text: t('bc_none') })); return box; }
    var tb = el('tbody');
    h.forEach(function (x, i) {
      tb.appendChild(el('tr', { class: x.b === g.len ? 'solved' : '', 'aria-label': t('bc_result', { g: x.g, b: fmt(x.b), c: fmt(x.c) }) },
        el('td', { class: 'num', text: fmt(i + 1) }), el('td', { class: 'num gnum no-i18n', text: x.g }),
        el('td', { class: 'num', text: fmt(x.b) }), el('td', { class: 'num', text: fmt(x.c) })));
    });
    box.appendChild(el('div', { class: 'scroll-x' }, el('table', { class: 'table', id: 'bc-hist-' + p },
      el('thead', null, el('tr', null, el('th', { text: '#' }), el('th', { text: t('bc_col_guess') }), el('th', { text: t('bc_col_bulls') }), el('th', { text: t('bc_col_cows') }))), tb)));
    return box;
  }
  function renderBulls(host, g) {
    var wrap = el('div', { class: 'bc' }), human = g.phase === 'play' && !g.over && !isCpu(g, g.turn) && !busy.bulls;
    if (g.phase === 'setup1' || g.phase === 'setup2') {
      var setter = g.phase === 'setup1' ? 1 : 2;
      wrap.appendChild(el('p', { class: 'mb0', text: t(g.mode === 'cpu' ? 'bc_set_cpu' : 'bc_set_secret', { name: pname(setter, g), other: pname(other(setter), g), n: fmt(g.len) }) }));
      var sin = el('input', { type: 'password', id: 'bc-secret', class: 'bc-in no-i18n', inputmode: 'numeric', maxlength: String(g.len), autocomplete: 'off', 'aria-label': t('bc_secret_label') });
      sin.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); bcLock(false); } });
      wrap.appendChild(el('div', { class: 'bc-row' },
        el('label', { for: 'bc-secret', class: 'lbl', text: t('bc_secret_label') }), sin,
        el('button', { type: 'button', class: 'btn btn-primary', id: 'bc-lock', text: t('bc_lock'), onclick: function () { bcLock(false); } }),
        el('button', { type: 'button', class: 'btn', id: 'bc-rand', text: t('bc_random'), onclick: function () { bcLock(true); } })));
    } else {
      var inp = el('input', { type: 'text', id: 'bc-input', class: 'bc-in no-i18n', inputmode: 'numeric', maxlength: String(g.len), autocomplete: 'off', 'aria-label': t('bc_guess_label'), placeholder: '' });
      inp.value = bcDraft;
      inp.disabled = !human;
      inp.addEventListener('input', function () { bcDraft = inp.value = inp.value.replace(/[^0-9]/g, '').slice(0, g.len); syncPad(); });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); bcSubmit(); } });
      wrap.appendChild(el('div', { class: 'bc-row' }, el('label', { for: 'bc-input', class: 'lbl', text: t('bc_guess_label') }), inp));
      var pad = el('div', { class: 'bc-pad', id: 'bc-pad' });
      for (var d = 1; d <= 10; d++) {
        var dig = String(d % 10);
        pad.appendChild(el('button', { type: 'button', class: 'btn', 'data-d': dig, text: dig, onclick: (function (x) { return function () { var i = $('#bc-input'); if (!i || i.disabled || i.value.length >= g.len || i.value.indexOf(x) >= 0) return; i.value += x; bcDraft = i.value; syncPad(); }; })(dig) }));
      }
      pad.appendChild(el('button', { type: 'button', class: 'btn', id: 'bc-back', 'aria-label': t('bc_backspace'), title: t('bc_backspace'), text: '⌫', onclick: function () { var i = $('#bc-input'); if (!i || i.disabled) return; i.value = i.value.slice(0, -1); bcDraft = i.value; syncPad(); } }));
      pad.appendChild(el('button', { type: 'button', class: 'btn btn-primary go', id: 'bc-go', text: t('bc_guess_btn'), onclick: bcSubmit }));
      wrap.appendChild(pad);
      if (g.mode === 'cpu' && g.secret[2]) wrap.appendChild(el('p', { class: 'mb0 secret-note' }, t('bc_your_secret', { name: pname(1, g) }) + ' ', el('span', { class: 'num gnum no-i18n', text: g.secret[2] })));
      if (S.games.bulls.hint && human) {
        var left = PPG.bc.cands(g.len, true, g.hist[g.turn]).length;
        wrap.appendChild(el('p', { class: 'callout mb0', id: 'bc-left', text: t('bc_left', { n: fmt(left) }) }));
      }
      var hs = el('div', { class: 'bc-hists' }, histTable(g, 1));
      if (g.mode !== 'solo') hs.appendChild(histTable(g, 2));
      wrap.appendChild(hs);
    }
    if (g.err) wrap.appendChild(el('p', { class: 'bad mb0', id: 'bc-err', role: 'alert', text: errText(g) }));
    host.appendChild(wrap);
    syncPad();
  }
  function syncPad() {
    var i = $('#bc-input'), g = S.games.bulls;
    if (!i) return;
    $$('#bc-pad [data-d]').forEach(function (b) { b.disabled = i.disabled || i.value.indexOf(b.getAttribute('data-d')) >= 0 || i.value.length >= g.len; });
    var go = $('#bc-go'), bk = $('#bc-back');
    if (go) go.disabled = i.disabled;
    if (bk) bk.disabled = i.disabled || !i.value.length;
  }

  /* ------------------------------------------------------------ status line, scores, options */
  function dotHtml(p) { return el('span', { class: 'dot p' + p, 'aria-hidden': 'true' }); }
  function statusInfo(g) {
    var id = S.tab;
    if (id === 'bulls') {
      if (g.mode === 'solo') {
        if (g.over) return { cls: g.gaveUp ? 'draw' : 'win', txt: g.gaveUp ? t('bc_gave_up', { s: g.secret[1] }) : t('bc_solved', { n: fmt(g.hist[1].length), s: g.secret[1] }) };
        return { txt: t('bc_solo_start', { n: fmt(g.len) }) };
      }
      if (g.phase !== 'play') return { txt: t('bc_setup_status') };
      if (g.over) {
        var rv = ' ' + t('bc_reveal', { a: pname(1, g), s1: g.secret[2], b: pname(2, g), s2: g.secret[1] });
        return g.winner ? { cls: 'win', p: g.winner, txt: t('st_win', { name: pname(g.winner, g) }) + rv } : { cls: 'draw', txt: t('bc_both') + rv };
      }
      var sv = solved(g, other(g.turn)) ? ' ' + t('bc_last_turn', { name: pname(other(g.turn), g), other: pname(g.turn, g) }) : '';
      if (busy.bulls) return { p: g.turn, txt: t('st_thinking', { name: pname(g.turn, g) }) + sv };
      return { p: g.turn, txt: t('bc_turn', { name: pname(g.turn, g), other: pname(other(g.turn), g) }) + sv };
    }
    if (g.over) {
      if (g.winner) return { cls: 'win', p: g.winner, txt: t('st_win', { name: pname(g.winner, g) }) };
      if (id === 'dots') return { cls: 'draw', txt: t('st_draw') };
      return { cls: 'draw', txt: g.blocked ? t('st_draw_blocked') : t('st_draw') };
    }
    var nm = pname(g.turn, g);
    if (busy[id] || isCpu(g, g.turn)) return { p: g.turn, txt: t('st_thinking', { name: nm }) };
    var s = id === 'ttt' ? t('st_turn_mark', { name: nm, mark: mark(g.turn) }) : t('st_turn', { name: nm });
    if (id === 'dots' && g.again) s = t('dots_again', { name: nm });
    return { p: g.turn, txt: s };
  }
  function renderScores(g) {
    var box = $('#scores');
    box.innerHTML = '';
    if (S.tab === 'bulls' && g.mode === 'solo') {
      box.appendChild(el('div', { class: 'sc p1' }, el('span', { class: 'k', text: t('bc_played') }), el('span', { class: 'v', text: fmt(g.played) })));
      box.appendChild(el('div', { class: 'sc p2' }, el('span', { class: 'k', text: t('bc_best') }), el('span', { class: 'v', text: g.best ? fmt(g.best) : '–' })));
      box.appendChild(el('div', { class: 'sc' }, el('span', { class: 'k', text: t('bc_now') }), el('span', { class: 'v', text: fmt(g.hist[1].length) })));
      return;
    }
    [1, 2].forEach(function (p) {
      var v = S.tab === 'dots' && !g.over && g.moves ? fmt(g.score[p]) + ' · ' + fmt(g.pts[p]) : fmt(g.score[p]);
      box.appendChild(el('div', { class: 'sc p' + p, id: 'score-' + p, title: pname(p, g) }, el('span', { class: 'k no-i18n', text: pname(p, g) }), el('span', { class: 'v', text: S.tab === 'dots' ? fmt(g.score[p]) : v })));
    });
    box.appendChild(el('div', { class: 'sc', id: 'score-d' }, el('span', { class: 'k', text: t('draws') }), el('span', { class: 'v', text: fmt(g.score.d) })));
    if (S.tab === 'dots') {
      box.appendChild(el('p', { class: 'hint', id: 'dots-pts', style: { gridColumn: '1 / -1' }, text: t('dots_now', { a: pname(1, g), n: fmt(g.pts[1]), b: pname(2, g), m: fmt(g.pts[2]) }) }));
    }
  }
  function segBtn(attrs, label, on, fn) {
    var b = el('button', Object.assign({ type: 'button', 'aria-pressed': on ? 'true' : 'false', onclick: fn }, attrs), label);
    return b;
  }
  function renderOpts(g) {
    var box = $('#opts');
    box.innerHTML = '';
    var id = S.tab;
    if (id === 'ttt' || id === 'dots') {
      var sizes = id === 'ttt' ? [3, 4, 5] : [3, 4, 5, 6];
      var seg = el('div', { class: 'seg', role: 'group', 'aria-labelledby': 'size-lbl', id: id + '-size' });
      sizes.forEach(function (n) {
        seg.appendChild(segBtn({ 'data-size': n }, id === 'ttt' ? t('size_' + n) : fmt(n) + ' × ' + fmt(n), g.size === n, function () { if (g.size !== n) changeSetting(function (gg) { gg.size = n; }); }));
      });
      box.appendChild(el('span', { class: 'lbl', id: 'size-lbl', text: t(id === 'ttt' ? 'ttt_size' : 'dots_size') }));
      box.appendChild(seg);
    }
    if (id === 'ttt') {
      var cb = el('input', { type: 'checkbox', id: 'ttt-think' });
      cb.checked = S.think;
      cb.addEventListener('change', function () { S.think = cb.checked; save(); render(); });
      box.appendChild(el('label', { class: 'check', for: 'ttt-think' }, cb, ' ', el('span', { text: t('think_label') })));
      var tx = tttThinkText(g);
      if (tx) box.appendChild(el('p', { class: 'callout think-box', id: 'think-msg', 'aria-live': 'polite', text: tx }));
    }
    if (id === 'bulls') {
      var seg2 = el('div', { class: 'seg', role: 'group', 'aria-labelledby': 'len-lbl', id: 'bc-len' });
      [4, 3].forEach(function (n) { seg2.appendChild(segBtn({ 'data-len': n }, t('bc_len' + n), g.len === n, function () { if (g.len !== n) changeSetting(function (gg) { gg.len = n; }); })); });
      box.appendChild(el('span', { class: 'lbl', id: 'len-lbl', text: t('bc_len') }));
      box.appendChild(seg2);
      var hc = el('input', { type: 'checkbox', id: 'bc-hint' });
      hc.checked = !!g.hint;
      hc.addEventListener('change', function () { g.hint = hc.checked; save(); render(); });
      box.appendChild(el('label', { class: 'check', for: 'bc-hint' }, hc, ' ', el('span', { text: t('bc_hint') })));
    }
  }
  function ruleText(g) {
    if (S.tab === 'ttt') return t(g.size === 3 ? 'ttt_rule3' : 'ttt_rule4') + ' ' + t('starter_note');
    if (S.tab === 'c4') return t('c4_rule') + ' ' + t('starter_note');
    if (S.tab === 'dots') return t('dots_rule');
    return t('bc_rule', { n: fmt(g.len) }) + (g.mode === 'solo' ? '' : ' ' + t('bc_race'));
  }

  /* ------------------------------------------------------------ main render */
  function render() {
    var g = G(), id = S.tab;
    GAMES.forEach(function (k) { var b = $('#tab-' + k), on = k === id; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
    $('#stage').setAttribute('aria-labelledby', 'tab-' + id);
    var mode = $('#mode');
    mode.innerHTML = '';
    MODES[id].forEach(function (m) { mode.appendChild(segBtn({ 'data-mode': m }, t('mode_' + m), g.mode === m, function () { if (g.mode !== m) changeSetting(function (gg) { gg.mode = m; }); })); });
    $('#level-box').hidden = g.mode !== 'cpu';
    $$('#level [data-level]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-level') === g.level ? 'true' : 'false'); });
    $('#name2-box').hidden = g.mode !== 'two';
    $('#name1').placeholder = t('def_p1'); $('#name2').placeholder = t('def_p2');
    if (document.activeElement !== $('#name1')) $('#name1').value = S.names[1];
    if (document.activeElement !== $('#name2')) $('#name2').value = S.names[2];

    var host = $('#host'), af = document.activeElement, refocus = null;
    if (af && host.contains(af)) refocus = af.getAttribute('data-cell') !== null ? '[data-cell="' + af.getAttribute('data-cell') + '"]'
      : af.getAttribute('data-col') !== null ? '[data-col="' + af.getAttribute('data-col') + '"]'
        : af.getAttribute('data-line') !== null ? '[data-line="' + af.getAttribute('data-line') + '"]' : af.id ? '#' + af.id : null;
    host.innerHTML = '';
    host.classList.toggle('is-busy', !!busy[id]);
    if (id === 'ttt') renderTtt(host, g);
    else if (id === 'c4') renderC4(host, g);
    else if (id === 'dots') renderDots(host, g);
    else renderBulls(host, g);
    if (refocus) { var nf = host.querySelector(refocus); if (nf && !nf.disabled) nf.focus(); }

    var si = statusInfo(g), st = $('#status');
    st.className = 'callout status' + (si.cls ? ' ' + si.cls : '');
    st.innerHTML = '';
    if (si.p) st.appendChild(dotHtml(si.p));
    st.appendChild(el('span', { id: 'status-txt', text: si.txt }));
    $('#new-game-txt').textContent = t(g.over ? 'play_again' : 'new_game');
    $('#give-up').hidden = !(id === 'bulls' && g.mode === 'solo' && !g.over && g.hist[1].length > 0);
    renderScores(g);
    renderOpts(g);
    $('#rule').textContent = ruleText(g);
    $('#sound').checked = S.sound;
  }

  /* ------------------------------------------------------------ events */
  function setTab(id, focus) {
    if (GAMES.indexOf(id) < 0) return;
    S.tab = id; save(); render();
    if (focus) $('#tab-' + id).focus();
    cpuTurn(id);
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
  $$('#level [data-level]').forEach(function (b) {
    b.addEventListener('click', function () {
      var g = G(), lv = b.getAttribute('data-level');
      if (g.level === lv) return;
      g.level = lv; save(); render();        /* the level can change mid-game; it applies from the next computer move */
    });
  });
  ['1', '2'].forEach(function (p) {
    var inp = $('#name' + p);
    inp.addEventListener('input', function () { S.names[p] = inp.value.slice(0, 16); save(); render(); });
  });
  $('#new-game').addEventListener('click', function () {
    var g = G();
    if (inProgress(g) && !confirm(t('confirm_restart'))) return;
    newGame(S.tab);
  });
  $('#give-up').addEventListener('click', function () {
    var g = S.games.bulls;
    if (g.over || g.mode !== 'solo') return;
    g.over = true; g.gaveUp = true; g.played++;
    save(); render();
  });
  $('#reset-score').addEventListener('click', function () {
    if (!confirm(t('confirm_reset_score'))) return;
    var g = G(); g.score = blankScore(); g.starter = 1;
    if (S.tab === 'bulls') { g.best = 0; g.played = 0; }
    save(); render();
  });
  $('#sound').addEventListener('change', function () { S.sound = this.checked; save(); });
  $('#fs-btn').addEventListener('click', function () { EDU.fullscreen($('#stage')); });

  /* board clicks + keyboard (event delegation, the boards are re-rendered) */
  $('#host').addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button');
    if (!b || b.disabled) return;
    var g = G();
    if (busy[S.tab] || isCpu(g, g.turn) || g.over) return;
    if (S.tab === 'ttt' && b.hasAttribute('data-cell')) { focusCell = +b.getAttribute('data-cell'); tttPlay(g, focusCell); }
    if (S.tab === 'c4' && b.hasAttribute('data-col')) { focusCol = +b.getAttribute('data-col'); c4Play(g, focusCol); }
  });
  $('#host').addEventListener('keydown', function (e) {
    var g = G(), dir;
    if (S.tab === 'ttt' && e.target.hasAttribute('data-cell')) {
      var n = g.size, i = +e.target.getAttribute('data-cell'), r = Math.floor(i / n), c = i % n;
      dir = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] }[e.key];
      if (!dir) return;
      e.preventDefault();
      r = (r + dir[0] + n) % n; c = (c + dir[1] + n) % n;
      focusCell = r * n + c;
      $$('#ttt-board button').forEach(function (bb) { bb.tabIndex = +bb.getAttribute('data-cell') === focusCell ? 0 : -1; });
      var nb = $('#ttt-board [data-cell="' + focusCell + '"]'); if (nb) nb.focus();
    } else if (S.tab === 'c4' && e.target.hasAttribute('data-col')) {
      dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (/^[1-7]$/.test(e.key)) { e.preventDefault(); focusCol = +e.key - 1; if (!g.over && !isCpu(g, g.turn) && !busy.c4) c4Play(g, focusCol); return; }
      if (!dir) return;
      e.preventDefault();
      focusCol = (focusCol + dir + 7) % 7;
      $$('#c4-cols button').forEach(function (bb) { bb.tabIndex = +bb.getAttribute('data-col') === focusCol ? 0 : -1; });
      var nc = $('#c4-cols [data-col="' + focusCol + '"]'); if (nc) nc.focus();
    }
  });

  /* deterministic hooks for the interaction test (they never run in normal play) */
  window.__gameTest = {
    setSecret: function (s) { var g = S.games.bulls; if (PPG.bc.check(s, g.len, true)) return false; g.secret[1] = s; save(); render(); return true; },
    setSeed: function (n) { testSeed = typeof n === 'number' ? n : null; },
    state: function () { return JSON.parse(JSON.stringify({ tab: S.tab, games: S.games, busy: busy })); },
    idle: function () { return !GAMES.some(function (k) { return busy[k]; }); },
    worker: function () { return !!worker; }
  };

  EDU.onLang(function () { render(); });
  EDU.onTheme(function () { render(); });
  render();
  cpuAll();
})();
