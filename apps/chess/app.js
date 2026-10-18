/* Chess: play a friend or the computer, mate puzzles, and lessons. Rules and search are in engine.js
   (ChessEngine); the computer thinks in a Blob Web Worker so the page never freezes (works on file:// too). */
(function () {
  'use strict';
  var SLUG = 'chess';
  var E = window.ChessEngine, PUZ = window.CHESS_PUZZLES || [];
  var store = EDU.store(SLUG);
  var t = EDU.t, $ = EDU.$, $$ = EDU.$$, fmt = EDU.fmt;
  var SVGNS = 'http://www.w3.org/2000/svg';
  var VAL = [0, 1, 3, 3, 5, 9, 0];
  var CLOCKS = { none: null, '3+2': [180, 2], '5+0': [300, 0], '10+5': [600, 5] };
  var reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'wa_game' });
  document.body.insertAdjacentHTML('afterbegin', window.CHESS_PIECES.sprite());

  function oneOf(v, list, d) { return list.indexOf(v) >= 0 ? v : d; }
  function pid(code) { return '#p-' + (code & 8 ? 'b' : 'w') + ' PNBRQK'[code & 7]; }
  function pieceSvg(code, cls) { return '<svg viewBox="0 0 100 100" class="' + (cls || '') + '" aria-hidden="true" focusable="false"><use href="' + pid(code) + '"/></svg>'; }
  function sideName(c) { return t(c === 0 ? 'white' : 'black'); }

  /* ================================================================ test hook (deterministic computer) */
  var testSeed = null;
  function nextSeed() { if (testSeed === null) return Math.floor(Math.random() * 4294967295); return testSeed++; }

  /* ================================================================ computer (Blob worker, main-thread fallback) */
  var worker = null, workerOk = true, reqSeq = 0, pending = {};
  function makeWorker() {
    if (!workerOk || !window.Worker || !window.Blob || !window.ChessEngineFactory) return null;
    try {
      var src = 'var E = (' + window.ChessEngineFactory.toString() + ')();\n' +
        'onmessage = function (e) { var r; try { r = E.think(e.data.req); } catch (x) { r = { error: String(x) }; } postMessage({ id: e.data.id, res: r }); };';
      var url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
      var w = new Worker(url);
      w.onmessage = function (e) { var cb = pending[e.data.id]; delete pending[e.data.id]; if (cb) cb(e.data.res); };
      w.onerror = function (ev) { if (ev && ev.preventDefault) ev.preventDefault(); workerOk = false; worker = null; flushToMain(); };
      return w;
    } catch (e) { workerOk = false; return null; }
  }
  var mainQueue = [];
  function flushToMain() { Object.keys(pending).forEach(function (id) { mainQueue.push([+id, pending[id].req]); }); runMainQueue(); }
  function runMainQueue() {
    var job = mainQueue.shift();
    if (!job) return;
    setTimeout(function () {
      var cb = pending[job[0]];
      if (cb) {
        delete pending[job[0]];
        var req = Object.assign({}, job[1], { time: Math.min(job[1].time || 500, 500) });
        cb(E.think(req));
      }
      runMainQueue();
    }, 30);
  }
  /* returns an id; cancel(id) drops the answer */
  function think(req, cb) {
    var id = ++reqSeq;
    cb.req = req;
    pending[id] = cb;
    if (!worker) worker = makeWorker();
    if (worker) worker.postMessage({ id: id, req: req });
    else { mainQueue.push([id, req]); runMainQueue(); }
    return id;
  }
  function cancelAll() {
    pending = {};
    mainQueue = [];
    if (worker) { worker.terminate(); worker = null; }   /* stop a long search at once */
  }

  /* ================================================================ sound (off by default) */
  var audio = null;
  function beep(capture) {
    if (!S.sound) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      var o = audio.createOscillator(), g = audio.createGain(), now = audio.currentTime;
      o.type = 'triangle'; o.frequency.value = capture ? 300 : 520;
      g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.18, now + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      o.connect(g); g.connect(audio.destination); o.start(now); o.stop(now + 0.14);
    } catch (e) { }
  }

  /* ================================================================ board widget */
  var boardSeq = 0;
  function el(tag, attrs) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function sqColor(sq) { return ((sq >> 4) + (sq & 7)) & 1 ? 'L' : 'D'; }

  /* o: { label, canPick(sq), targets(sq) -> [to], onMove(from, to), onTap(sq) } ; set state with b.set({...}) */
  function Board(host, o) {
    var n = ++boardSeq;
    var svg = el('svg', { viewBox: '0 0 800 800', class: 'cb-svg', tabindex: '0', role: 'application' });
    var defs = el('defs', {});
    defs.innerHTML = '<radialGradient id="chk' + n + '"><stop offset="0" stop-color="#ff2a2a" stop-opacity=".95"/><stop offset=".55" stop-color="#e01b1b" stop-opacity=".55"/><stop offset="1" stop-color="#e01b1b" stop-opacity="0"/></radialGradient>' +
      '<marker id="arr' + n + '" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--sq-hint)"/></marker>';
    svg.appendChild(defs);
    var gSq = el('g', {}), gHl = el('g', { class: 'hl' }), gCo = el('g', { class: 'coords' }), gPc = el('g', { class: 'pieces' }), gDot = el('g', { class: 'dots' }), gArr = el('g', { class: 'arrows' });
    var ghost = el('use', { class: 'ghost', width: '100', height: '100', visibility: 'hidden' });
    [gSq, gHl, gCo, gPc, gDot, gArr, ghost].forEach(function (g) { svg.appendChild(g); });
    var rects = {};
    for (var r = 0; r < 8; r++) for (var f = 0; f < 8; f++) {
      var sq = r * 16 + f, rc = el('rect', { width: '100', height: '100', class: 'sq' + sqColor(sq), 'data-sq': E.sqName(sq) });
      rects[sq] = rc; gSq.appendChild(rc);
    }
    host.innerHTML = '';
    host.appendChild(svg);
    var B = { svg: svg, host: host, board: new Int8Array(128), flipped: false, last: null, check: -1, hint: null, dots: true,
      sel: -1, cursor: -1, interactive: true, anim: null, marks: [], o: o };

    function xy(sq) { var f = sq & 7, r = sq >> 4; return B.flipped ? [(7 - f) * 100, r * 100] : [f * 100, (7 - r) * 100]; }
    function sqAt(ev) {
      var rc = svg.getBoundingClientRect();
      var x = Math.floor((ev.clientX - rc.left) / rc.width * 8), y = Math.floor((ev.clientY - rc.top) / rc.height * 8);
      if (x < 0 || x > 7 || y < 0 || y > 7) return -1;
      return B.flipped ? y * 16 + (7 - x) : (7 - y) * 16 + x;
    }
    B.sqAt = sqAt;
    var placedFlip = null;
    function place() {
      if (placedFlip === B.flipped) return;
      placedFlip = B.flipped;
      Object.keys(rects).forEach(function (k) { var p = xy(+k); rects[k].setAttribute('x', p[0]); rects[k].setAttribute('y', p[1]); });
      var co = '';
      for (var i = 0; i < 8; i++) {
        var fileSq = B.flipped ? 7 - i : i;                  /* bottom row: file letters */
        var bottomSq = (B.flipped ? 7 : 0) * 16 + fileSq;
        co += '<text x="' + (i * 100 + 92) + '" y="793" text-anchor="end" class="c' + sqColor(bottomSq) + '">' + 'abcdefgh'[fileSq] + '</text>';
        var rank = B.flipped ? i : 7 - i, leftSq = rank * 16 + (B.flipped ? 7 : 0);
        co += '<text x="6" y="' + (i * 100 + 22) + '" class="c' + sqColor(leftSq) + '">' + (rank + 1) + '</text>';
      }
      gCo.innerHTML = co;
    }
    B.render = function () {
      place();
      var hl = '', s, p;
      if (B.last) [B.last.from, B.last.to].forEach(function (q) { p = xy(q); hl += '<rect x="' + p[0] + '" y="' + p[1] + '" width="100" height="100" fill="var(--sq-last)"/>'; });
      if (B.sel >= 0) { p = xy(B.sel); hl += '<rect x="' + p[0] + '" y="' + p[1] + '" width="100" height="100" fill="var(--sq-sel)"/>'; }
      if (B.check >= 0) { p = xy(B.check); hl += '<circle cx="' + (p[0] + 50) + '" cy="' + (p[1] + 50) + '" r="54" fill="url(#chk' + n + ')"/>'; }
      if (B.cursor >= 0 && B.focusVisible) { p = xy(B.cursor); hl += '<rect x="' + (p[0] + 4) + '" y="' + (p[1] + 4) + '" width="92" height="92" fill="none" stroke="var(--sq-cur)" stroke-width="7" rx="6"/>'; }
      B.marks.forEach(function (q) { p = xy(q); hl += '<circle cx="' + (p[0] + 50) + '" cy="' + (p[1] + 50) + '" r="46" fill="none" stroke="var(--sq-hint)" stroke-width="6" stroke-dasharray="14 9"/>'; });
      gHl.innerHTML = hl;
      var pcs = '';
      for (s = 0; s < 120; s++) {
        if (s & 0x88) { s += 7; continue; }
        p = B.board[s];
        if (!p) continue;
        var q = xy(s), cls = (B.dragFrom === s && B.dragging) ? ' class="lift"' : '';
        pcs += '<use href="' + pid(p) + '" x="' + q[0] + '" y="' + q[1] + '" width="100" height="100" data-at="' + E.sqName(s) + '"' + cls + '/>';
      }
      gPc.innerHTML = pcs;
      var dots = '';
      if (B.sel >= 0 && B.dots) {
        o.targets(B.sel).forEach(function (q) {
          var c = xy(q), occ = B.board[q] || (o.isCapture && o.isCapture(B.sel, q));
          dots += occ ? '<circle data-dot="' + E.sqName(q) + '" cx="' + (c[0] + 50) + '" cy="' + (c[1] + 50) + '" r="44" fill="none" stroke="var(--sq-dot)" stroke-width="9"/>'
            : '<circle data-dot="' + E.sqName(q) + '" cx="' + (c[0] + 50) + '" cy="' + (c[1] + 50) + '" r="16" fill="var(--sq-dot)"/>';
        });
      }
      gDot.innerHTML = dots;
      var ar = '';
      if (B.hint) {
        var a = xy(B.hint.from), b = xy(B.hint.to);
        ar = '<line x1="' + (a[0] + 50) + '" y1="' + (a[1] + 50) + '" x2="' + (b[0] + 50) + '" y2="' + (b[1] + 50) + '" stroke="var(--sq-hint)" stroke-width="16" stroke-linecap="round" opacity=".85" marker-end="url(#arr' + n + ')"/>';
      }
      gArr.innerHTML = ar;
      if (B.anim && !reduceMotion) {
        var mv = gPc.querySelector('use[data-at="' + E.sqName(B.anim.to) + '"]');
        if (mv) {
          var A0 = xy(B.anim.from), A1 = xy(B.anim.to);
          mv.style.transform = 'translate(' + (A0[0] - A1[0]) + 'px,' + (A0[1] - A1[1]) + 'px)';
          mv.getBoundingClientRect();
          requestAnimationFrame(function () { mv.classList.add('anim'); mv.style.transform = 'translate(0px,0px)'; });
        }
      }
      B.anim = null;
      svg.setAttribute('aria-label', o.label ? o.label() : '');
    };
    B.set = function (st) { for (var k in st) B[k] = st[k]; B.render(); };
    B.deselect = function () { if (B.sel >= 0) { B.sel = -1; B.render(); } };

    /* ---- pointer: tap-tap and drag ---- */
    var drag = null;
    function tryTo(from, to) {
      if (o.targets(from).indexOf(to) < 0) return false;
      B.sel = -1; B.dragging = false; B.dragFrom = -1;
      o.onMove(from, to);
      return true;
    }
    svg.addEventListener('pointerdown', function (ev) {
      if (!B.interactive || (ev.button !== undefined && ev.button > 0)) return;
      if (drag && ev.pointerId !== drag.id) return;      /* a second finger: ignore */
      var sq = sqAt(ev);
      if (sq < 0) return;
      B.focusVisible = false;
      B.cursor = sq;
      if (B.sel >= 0 && B.sel !== sq && tryTo(B.sel, sq)) { ev.preventDefault(); return; }
      if (o.canPick(sq)) {
        ev.preventDefault();
        var was = B.sel === sq;
        B.sel = sq;
        drag = { id: ev.pointerId, from: sq, x: ev.clientX, y: ev.clientY, was: was, moved: false };
        try { svg.setPointerCapture(ev.pointerId); } catch (e) { }
        B.render();
      } else {
        if (o.onTap) o.onTap(sq);
        B.deselect();
      }
    });
    var rafPending = false, lastEv = null;
    svg.addEventListener('pointermove', function (ev) {
      if (!drag || ev.pointerId !== drag.id) return;
      if (!drag.moved && Math.abs(ev.clientX - drag.x) + Math.abs(ev.clientY - drag.y) < 7) return;
      if (!drag.moved) {
        drag.moved = true; B.dragging = true; B.dragFrom = drag.from;
        ghost.setAttribute('href', pid(B.board[drag.from]));
        ghost.setAttribute('visibility', 'visible');
        B.render();
      }
      lastEv = ev;
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(function () {
          rafPending = false;
          if (!drag || !lastEv) return;
          var rc = svg.getBoundingClientRect(), k = 800 / rc.width;
          ghost.setAttribute('x', (lastEv.clientX - rc.left) * k - 50);
          ghost.setAttribute('y', (lastEv.clientY - rc.top) * k - 62);
        });
      }
    });
    function endDrag(ev, cancel) {
      if (!drag || (ev && ev.pointerId !== drag.id)) return;
      var d = drag; drag = null;
      ghost.setAttribute('visibility', 'hidden');
      var wasDragging = B.dragging;
      B.dragging = false; B.dragFrom = -1;
      if (cancel) { B.render(); return; }
      if (d.moved) {
        var to = sqAt(ev);
        if (to >= 0 && to !== d.from && tryTo(d.from, to)) return;
        B.render();
      } else if (d.was) { B.sel = -1; B.render(); }
      else if (wasDragging) B.render();
    }
    svg.addEventListener('pointerup', function (ev) { endDrag(ev, false); });
    svg.addEventListener('pointercancel', function (ev) { endDrag(ev, true); });
    svg.addEventListener('lostpointercapture', function (ev) { if (drag && drag.moved) endDrag(ev, true); });

    /* ---- keyboard: arrows move a cursor, Enter / Space picks up and puts down ---- */
    svg.addEventListener('keydown', function (ev) {
      if (!B.interactive) return;
      var k = ev.key, c = B.cursor >= 0 ? B.cursor : (B.flipped ? 116 : 4);
      var df = 0, dr = 0;
      if (k === 'ArrowLeft') df = -1; else if (k === 'ArrowRight') df = 1; else if (k === 'ArrowUp') dr = 1; else if (k === 'ArrowDown') dr = -1;
      if (df || dr) {
        ev.preventDefault();
        if (B.flipped) { df = -df; dr = -dr; }
        var f = EDU.clamp((c & 7) + df, 0, 7), r = EDU.clamp((c >> 4) + dr, 0, 7);
        B.cursor = r * 16 + f; B.focusVisible = true; B.render();
        if (o.announce) o.announce(B.cursor);
        return;
      }
      if (k === 'Enter' || k === ' ') {
        ev.preventDefault();
        B.focusVisible = true;
        if (B.cursor < 0) { B.cursor = c; B.render(); return; }
        if (B.sel >= 0 && B.sel !== B.cursor && tryTo(B.sel, B.cursor)) return;
        if (o.canPick(B.cursor)) { B.sel = B.sel === B.cursor ? -1 : B.cursor; B.render(); }
        else B.deselect();
      }
      if (k === 'Escape') B.deselect();
    });
    svg.addEventListener('focus', function () { if (B.cursor < 0) B.cursor = B.flipped ? 116 : 4; });
    svg.addEventListener('blur', function () { if (B.focusVisible) { B.focusVisible = false; B.render(); } });
    return B;
  }

  /* promotion chooser over a board → Promise<type 2..5 | 0> */
  function choosePromo(B, color) {
    return new Promise(function (resolve) {
      var box = document.createElement('div');
      box.className = 'promo';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-label', t('promo_title'));
      var types = [[5, 'q', 'p_q'], [4, 'r', 'p_r'], [3, 'b', 'p_b'], [2, 'n', 'p_n']];
      box.innerHTML = '<div class="promo-box"><p>' + EDU.esc(t('promo_title')) + '</p><div class="promo-row">' +
        types.map(function (x) { return '<button type="button" id="promo-' + x[1] + '" data-t="' + x[0] + '" aria-label="' + EDU.esc(t(x[2])) + '" title="' + EDU.esc(t(x[2])) + '">' + pieceSvg(color | x[0]) + '</button>'; }).join('') +
        '</div></div>';
      function done(v) { document.removeEventListener('keydown', key, true); box.remove(); resolve(v); }
      function key(e) { if (e.key === 'Escape') { e.stopPropagation(); done(0); } }
      box.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (b) done(+b.dataset.t); else if (e.target === box) done(0);
      });
      document.addEventListener('keydown', key, true);
      B.host.appendChild(box);
      var first = box.querySelector('button'); if (first) first.focus();
    });
  }

  /* pick a legal move from→to (asks for the promotion piece when needed) → Promise<move | 0> */
  function resolveMove(B, legal, from, to, color) {
    var c = legal.filter(function (m) { return E.mFrom(m) === from && E.mTo(m) === to; });
    if (!c.length) return Promise.resolve(0);
    if (c.length === 1) return Promise.resolve(c[0]);
    return choosePromo(B, color).then(function (tp) {
      if (!tp) return 0;
      return c.filter(function (m) { return E.mPromo(m) === tp; })[0] || 0;
    });
  }
  function targetsOf(legal, from) {
    var out = [];
    legal.forEach(function (m) { if (E.mFrom(m) === from && out.indexOf(E.mTo(m)) < 0) out.push(E.mTo(m)); });
    return out;
  }
  function sqWords(sq) { return E.sqName(sq); }

  /* ================================================================ settings */
  var S = {
    tab: oneOf(store.get('tab', 'play'), ['play', 'puzzles', 'learn'], 'play'),
    mode: oneOf(store.get('mode', 'cpu'), ['cpu', 'human'], 'cpu'),
    level: EDU.clamp(store.get('level', 2) | 0 || 2, 1, 6),
    col: oneOf(store.get('col', 'w'), ['w', 'b', 'r'], 'w'),
    clk: oneOf(store.get('clk', 'none'), Object.keys(CLOCKS), 'none'),
    autoflip: store.get('autoflip', false) === true,
    showdots: store.get('showdots', true) !== false,
    autodraw: store.get('autodraw', true) !== false,
    sound: store.get('sound', false) === true
  };
  function saveSettings() { ['tab', 'mode', 'level', 'col', 'clk', 'autoflip', 'showdots', 'autodraw', 'sound'].forEach(function (k) { store.set(k, S[k]); }); }

  /* ================================================================ PLAY */
  var G = null;           /* { game, mode, level, human (0|8), clk, times [w,b] ms, hist [[w,b]...], flipped, drawOffer } */
  var view = null;        /* ply index being viewed, null = live */
  var cpuReq = 0, hintReq = 0, hintMove = null, overShown = false, msgFn = null, lastClockTick = 0, clockTimer = 0;
  var PB;                 /* play board */

  function fresh(fen) {
    var c = CLOCKS[S.clk];
    var human = S.col === 'r' ? (Math.random() < 0.5 ? 0 : 8) : (S.col === 'b' ? 8 : 0);
    var g = { game: new E.Game(fen || E.START_FEN), mode: S.mode, level: S.level, human: human, clk: S.clk,
      times: c ? [c[0] * 1000, c[0] * 1000] : null, hist: [], flipped: S.mode === 'cpu' ? human === 8 : false };
    return g;
  }
  function saveGame() {
    if (!G) return;
    store.set('game', { fen: G.game.startFen, moves: G.game.moves.map(function (m) { return m.uci; }), mode: G.mode, level: G.level,
      human: G.human, clk: G.clk, times: G.times, hist: G.hist, flipped: G.flipped, result: G.game.result });
  }
  function loadGame() {
    var s = store.get('game', null);
    if (!s || typeof s !== 'object' || !Array.isArray(s.moves)) return null;
    try {
      var g = { game: new E.Game(s.fen || E.START_FEN), mode: s.mode === 'human' ? 'human' : 'cpu', level: EDU.clamp(s.level | 0 || 2, 1, 6),
        human: s.human === 8 ? 8 : 0, clk: oneOf(s.clk, Object.keys(CLOCKS), 'none'), times: null, hist: [], flipped: !!s.flipped };
      for (var k = 0; k < s.moves.length; k++) if (!g.game.playUci(String(s.moves[k]))) return null;
      if (CLOCKS[g.clk] && Array.isArray(s.times) && s.times.length === 2) {
        g.times = [Math.max(0, +s.times[0] || 0), Math.max(0, +s.times[1] || 0)];
        g.hist = Array.isArray(s.hist) ? s.hist.slice(0, s.moves.length).map(function (h) { return [+h[0] || 0, +h[1] || 0]; }) : [];
      } else g.clk = 'none';
      if (s.result && s.result.result && s.result.reason) g.game.setResult(String(s.result.result), String(s.result.reason));
      return g;
    } catch (e) { return null; }
  }

  function status() { return G.game.status({ manual: !S.autodraw }); }
  function isCpuTurn() { return G.mode === 'cpu' && G.game.pos.turn !== G.human && !status().over; }
  function humanCanMove() { var st = status(); return view === null && !st.over && !isCpuTurn(); }

  function viewPos() {
    if (view === null) return G.game.pos;
    return E.buildPosition(G.game.startFen, G.game.moves.slice(0, view).map(function (m) { return m.uci; }));
  }
  function playLegal() { return humanCanMove() ? G.game.pos.legalMoves() : []; }

  function renderPlayBoard(anim) {
    var pos = viewPos(), ply = view === null ? G.game.moves.length : view, last = ply ? G.game.moves[ply - 1] : null;
    var check = pos.inCheck() ? pos.kings[pos.turn >> 3] : -1;
    PB.set({ board: pos.board, flipped: G.flipped, last: last ? { from: last.from, to: last.to } : null, check: check, dots: S.showdots,
      hint: view === null && hintMove ? hintMove : null, anim: anim || null, interactive: true });
  }

  function playerBar(host, color) {
    var who, isCpu = G.mode === 'cpu' && color !== G.human;
    if (G.mode === 'cpu') who = isCpu ? t('computer_lv', { level: t('lv' + G.level) }) : t('you_side', { side: sideName(color) });
    else who = sideName(color);
    /* pieces this side has captured, and the material lead */
    var caps = [], ply = view === null ? G.game.moves.length : view;
    G.game.moves.slice(0, ply).forEach(function (m) { if (m.color === color && m.captured) caps.push(m.captured); });
    caps.sort(function (a, b) { return VAL[a & 7] - VAL[b & 7]; });
    var pos = viewPos(), mat = [0, 0];
    for (var s = 0; s < 120; s++) { if (s & 0x88) { s += 7; continue; } var p = pos.board[s]; if (p) mat[p & 8 ? 1 : 0] += VAL[p & 7]; }
    var lead = color === 0 ? mat[0] - mat[1] : mat[1] - mat[0];
    var running = G.times && !status().over && view === null && G.game.moves.length > 0 && G.game.pos.turn === color;
    var tm = G.times ? G.times[color >> 3] : 0;
    host.innerHTML = '<span class="who"><span class="dot ' + (color ? 'b' : 'w') + '" aria-hidden="true"></span><span class="nm">' + EDU.esc(who) + '</span></span>' +
      '<span class="caps" aria-label="' + EDU.esc(t('captured_aria', { n: fmt(caps.length) })) + '">' + caps.map(function (c) { return pieceSvg(c); }).join('') +
      (lead > 0 ? '<span class="adv">+' + lead + '</span>' : '') + '</span>' +
      '<span class="clock' + (running ? ' run' : '') + (tm < 20000 ? ' low' : '') + '" id="clock-' + (color ? 'b' : 'w') + '"' + (G.times ? '' : ' hidden') + ' role="timer">' + clockText(tm) + '</span>';
  }
  function clockText(ms) {
    ms = Math.max(0, ms);
    var s = Math.floor(ms / 1000);
    if (ms < 10000) return '0:0' + s + '.' + Math.floor((ms % 1000) / 100);
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }

  function setStatus(kind, fn) { msgFn = fn; var b = $('#status'); b.dataset.kind = kind || ''; b.textContent = fn(); }
  function overText(st) {
    var r = st.reason, winW = st.result === '1-0';
    var map = {
      checkmate: winW ? 'over_mate_w' : 'over_mate_b', stalemate: 'over_stalemate', threefold: 'over_threefold', fivefold: 'over_fivefold',
      fifty: 'over_fifty', seventyfive: 'over_seventyfive', insufficient: 'over_insufficient', agreed: 'over_agreed', claimed: 'over_claimed',
      resign: winW ? 'over_resign_b' : 'over_resign_w', time: winW ? 'over_time_b' : 'over_time_w', timedraw: 'over_time_draw'
    };
    return t(map[r] || 'res_draw');
  }
  function renderStatus() {
    var st = status();
    if (view !== null) { setStatus('', function () { return t('browsing', { n: fmt(view) }); }); return; }
    if (st.over) { setStatus('over', function () { return overText(status()); }); return; }
    var side = G.game.pos.turn;
    if (G.mode === 'cpu' && side !== G.human) { setStatus('', function () { return t('thinking'); }); return; }
    if (hintMove) { var hs = hintMove.san; setStatus('good', function () { return t('hint_msg', { move: hs }); }); return; }
    if (G.drawDeclined) { setStatus('', function () { return t('cpu_declines'); }); G.drawDeclined = false; return; }
    if (st.check) setStatus('check', function () { return t(side === 0 ? 'check_w' : 'check_b'); });
    else if (G.mode === 'cpu') setStatus('', function () { return t('your_turn', { side: sideName(side) }); });
    else setStatus('', function () { return t(side === 0 ? 'turn_w' : 'turn_b'); });
  }
  function renderMoves() {
    var ms = G.game.moves, ol = $('#mlist'), html = '', start = E.parseFen(G.game.startFen).pos, num = start.full, cur = view === null ? ms.length : view;
    $('#no-moves').hidden = ms.length > 0;
    for (var k = 0; k < ms.length; k++) {
      if (ms[k].color === 0 || k === 0) {
        html += '<li class="n">' + num + '.</li>';
        if (ms[k].color === 8) html += '<li>…</li>';
      }
      html += '<li><button type="button" data-ply="' + (k + 1) + '"' + (cur === k + 1 ? ' aria-current="true"' : '') + '>' + EDU.esc(ms[k].san) + '</button></li>';
      if (ms[k].color === 8) num++;
    }
    ol.innerHTML = html;
    var c = ol.querySelector('[aria-current="true"]');
    if (c && c.scrollIntoView && view === null) ol.scrollTop = ol.scrollHeight;
  }
  function renderButtons() {
    var st = status(), n = G.game.moves.length;
    $('#undo').disabled = n === 0 || (G.mode === 'cpu' && !G.game.moves.some(function (m) { return m.color === G.human; }) && !isCpuTurn());
    $('#hint').disabled = st.over || isCpuTurn() || view !== null;
    $('#resign').disabled = st.over || n === 0;
    $('#draw').disabled = st.over || n < 2 || isCpuTurn();
    $('#claim').hidden = st.over || !st.claim;
    $('#nav-first').disabled = $('#nav-prev').disabled = (view === null ? n : view) === 0;
    $('#nav-next').disabled = $('#nav-last').disabled = view === null;
    $('#type-btn').disabled = !humanCanMove();
    $('#autoflip-row').hidden = G.mode !== 'human';
  }
  function renderBars() {
    var topColor = G.flipped ? 0 : 8;
    playerBar($('#bar-top'), topColor);
    playerBar($('#bar-bot'), topColor ^ 8);
  }
  function renderSettings() {
    $$('[data-mode]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === S.mode)); });
    $$('[data-lv]').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.lv === S.level)); });
    $$('[data-col]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.col === S.col)); });
    $$('[data-clk]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.clk === S.clk)); });
    $('#cpu-opts').hidden = S.mode !== 'cpu';
    $('#autoflip').checked = S.autoflip; $('#showdots').checked = S.showdots; $('#autodraw').checked = S.autodraw; $('#sound').checked = S.sound;
  }
  function renderPlay(anim) {
    renderPlayBoard(anim);
    renderBars();
    renderStatus();
    renderMoves();
    renderButtons();
  }

  /* ---- clocks ---- */
  function clockRunning() { return G && G.times && !status().over && G.game.moves.length > 0; }
  function tickClock() {
    var now = Date.now(), dt = now - lastClockTick;
    lastClockTick = now;
    if (!clockRunning()) return;
    var side = G.game.pos.turn >> 3;
    G.times[side] -= dt;
    if (G.times[side] <= 0) {
      G.times[side] = 0;
      var other = side ? 0 : 8;
      /* flag fall: the other side wins, unless it could never checkmate (then it is a draw) */
      if (E.canMate(G.game.pos, other)) G.game.setResult(other === 0 ? '1-0' : '0-1', 'time');
      else G.game.setResult('1/2-1/2', 'timedraw');
      cancelAll(); cpuReq = 0;
      saveGame();
      renderPlay();
      gameOverDialog();
      return;
    }
    var c = $('#clock-' + (side ? 'b' : 'w'));
    if (c) { c.textContent = clockText(G.times[side]); c.classList.toggle('low', G.times[side] < 20000); }
    if ((now / 1000 | 0) % 5 === 0) saveGame();
  }
  function startClock() { clearInterval(clockTimer); lastClockTick = Date.now(); clockTimer = setInterval(tickClock, 100); }

  /* ---- making moves ---- */
  function afterMove(rec, byCpu) {
    if (G.times) {
      var mover = rec.color >> 3, c = CLOCKS[G.clk];
      if (G.game.moves.length > 1 || mover === 1) G.times[mover] += c[1] * 1000;   /* increment (not for White's very first move, the clock was not running) */
      G.hist.push([G.times[0], G.times[1]]);
      lastClockTick = Date.now();
    }
    hintMove = null; hintReq = 0;
    beep(!!rec.captured);
    if (G.mode === 'human' && S.autoflip && !status().over) G.flipped = G.game.pos.turn === 8;
    saveGame();
    renderPlay({ from: rec.from, to: rec.to, cpu: byCpu });
    var st = status();
    if (st.over) { gameOverDialog(); return; }
    if (isCpuTurn()) requestCpu();
  }
  function humanMove(m) {
    if (!humanCanMove()) return;
    var rec = G.game.play(m);
    if (rec) afterMove(rec, false);
  }
  function requestCpu() {
    var moves = G.game.moves.map(function (m) { return m.uci; });
    var lv = G.level, cap = E.LEVELS[lv].time;
    if (G.times) {
      var mine = G.times[G.game.pos.turn >> 3], inc = CLOCKS[G.clk][1] * 1000;
      cap = Math.max(60, Math.min(cap, mine / 28 + inc * 0.7));
    }
    var startAt = Date.now(), id;
    id = cpuReq = think({ fen: G.game.startFen, moves: moves, level: lv, time: cap, seed: nextSeed() }, function (res) {
      if (id !== cpuReq) return;
      /* never answer instantly: a short pause lets people see what happened */
      var wait = Math.max(0, (reduceMotion ? 120 : 380) - (Date.now() - startAt));
      setTimeout(function () {
        if (id !== cpuReq) return;
        cpuReq = 0;
        if (!res || !res.move) return;
        var rec = G.game.playUci(res.move);
        if (rec) afterMove(rec, true);
      }, wait);
    });
    renderStatus();
  }

  function gameOverDialog() {
    if (overShown) return;
    overShown = true;
    var st = status(), you = '';
    if (G.mode === 'cpu' && st.result !== '1/2-1/2') you = (st.result === '1-0') === (G.human === 0) ? t('you_won') : t('you_lost');
    var box = EDU.el('div', { class: 'over-box', id: 'over-box', 'data-result': st.result, 'data-reason': st.reason },
      EDU.el('p', { class: 'big', id: 'over-text', text: overText(st) }),
      you ? EDU.el('p', { class: 'mb0', text: you }) : null,
      EDU.el('p', { class: 'muted small mb0 no-i18n', dir: 'ltr', text: st.result }),
      EDU.el('div', { class: 'row' },
        EDU.el('button', { type: 'button', class: 'btn btn-primary', id: 'go-new', text: t('play_again'), onclick: function () { close(); newGame(true); } }),
        EDU.el('button', { type: 'button', class: 'btn', id: 'go-review', text: t('review'), onclick: function () { close(); } })));
    var close = EDU.modal(box, { title: t('over_title') });
  }

  function newGame(noAsk, fen) {
    var st = G ? status() : null;
    if (!noAsk && G && G.game.moves.length && !st.over && !confirm(t('confirm_new'))) return;
    cancelAll(); cpuReq = 0; hintMove = null; hintReq = 0; view = null; overShown = false;
    G = fresh(fen);
    saveGame();
    startClock();
    renderPlay();
    if (isCpuTurn()) requestCpu();
  }

  function undo() {
    if (!G.game.moves.length) return;
    cancelAll(); cpuReq = 0; hintMove = null; view = null; overShown = false;
    var n = 1;
    if (G.mode === 'cpu') {
      /* take back to the last position where it was your turn */
      if (G.game.pos.turn === G.human || status().over) {
        n = 0;
        for (var k = G.game.moves.length - 1; k >= 0; k--) { n++; if (G.game.moves[k].color === G.human) break; }
      }
    }
    G.game.result = null;
    while (n-- > 0 && G.game.moves.length) {
      G.game.undo();
      if (G.times) G.hist.pop();
    }
    if (G.times) {
      var c = CLOCKS[G.clk][0] * 1000;
      G.times = G.hist.length ? G.hist[G.hist.length - 1].slice() : [c, c];
    }
    if (G.mode === 'human' && S.autoflip) G.flipped = G.game.pos.turn === 8;
    saveGame();
    renderPlay();
    if (isCpuTurn()) requestCpu();
  }

  function hint() {
    if (!humanCanMove()) return;
    var id;
    setStatus('', function () { return t('thinking_hint'); });
    $('#hint').disabled = true;
    id = hintReq = think({ fen: G.game.startFen, moves: G.game.moves.map(function (m) { return m.uci; }), level: 6, time: 900, book: false, seed: nextSeed() }, function (res) {
      if (id !== hintReq) return;
      hintReq = 0;
      if (!res || !res.move) { renderPlay(); return; }
      var from = E.sqIndex(res.move.slice(0, 2)), to = E.sqIndex(res.move.slice(2, 4));
      hintMove = { from: from, to: to, san: res.san, uci: res.move };
      renderPlay();
    });
  }

  function resign() {
    if (status().over || !G.game.moves.length) return;
    if (!confirm(t('confirm_resign'))) return;
    var loser = G.mode === 'cpu' ? G.human : G.game.pos.turn;
    G.game.setResult(loser === 0 ? '0-1' : '1-0', 'resign');
    cancelAll(); cpuReq = 0;
    saveGame(); renderPlay(); gameOverDialog();
  }
  function agreeDraw(reason) {
    G.game.setResult('1/2-1/2', reason || 'agreed');
    cancelAll(); cpuReq = 0;
    saveGame(); renderPlay(); gameOverDialog();
  }
  function offerDraw() {
    if (status().over) return;
    if (G.mode === 'human') {
      var asker = G.game.pos.turn, close;
      var box = EDU.el('div', { class: 'over-box', id: 'draw-box' },
        EDU.el('p', { class: 'big', text: t(asker === 0 ? 'draw_offer_w' : 'draw_offer_b') }),
        EDU.el('div', { class: 'row' },
          EDU.el('button', { type: 'button', class: 'btn btn-primary', id: 'draw-yes', text: t('accept'), onclick: function () { close(); agreeDraw(); } }),
          EDU.el('button', { type: 'button', class: 'btn', id: 'draw-no', text: t('decline'), onclick: function () { close(); } })));
      close = EDU.modal(box, { title: t('offer_draw') });
      return;
    }
    /* the computer accepts when it is clearly worse, or in a long level game */
    setStatus('', function () { return t('thinking'); });
    var id = think({ fen: G.game.startFen, moves: G.game.moves.map(function (m) { return m.uci; }), level: 6, time: 500, book: false, seed: nextSeed() }, function (res) {
      if (!res || !res.move) return;
      /* score is for the side to move (you); the computer's view is the opposite */
      var cpuScore = -res.score, ply = G.game.moves.length;
      if (cpuScore < -150 || (Math.abs(cpuScore) < 25 && ply > 60)) { EDU.toast(t('cpu_accepts')); agreeDraw(); }
      else { G.drawDeclined = true; renderPlay(); }
    });
    return id;
  }
  function claimDraw() {
    var st = status();
    if (st.over || !st.claim) return;
    G.game.setResult('1/2-1/2', st.claim);
    cancelAll(); cpuReq = 0;
    saveGame(); renderPlay(); gameOverDialog();
  }

  function typedMove() {
    var inp = $('#type-move'), txt = inp.value.trim();
    if (!txt || !humanCanMove()) return;
    var m = E.parseMove(G.game.pos, txt);
    if (!m) { EDU.toast(t('type_move_bad', { move: txt })); return; }
    inp.value = '';
    humanMove(m);
  }

  function setView(v) {
    var n = G.game.moves.length;
    if (v !== null) v = EDU.clamp(v, 0, n);
    if (v === n) v = null;
    view = v;
    PB.sel = -1;
    renderPlay();
  }

  function loadText() {
    var txt = $('#load-text').value.trim(), msg = $('#load-msg');
    if (!txt) { msg.textContent = t('load_empty'); return; }
    var isFen = !/[\[\]]/.test(txt) && !/\d+\.\s*\S/.test(txt) && (txt.split('/').length === 8);
    if (isFen) {
      var r = E.parseFen(txt);
      if (r.error) { msg.textContent = t('load_bad_fen', { why: t('fen_err_' + r.error) }); return; }
      newGame(true, txt);
      msg.textContent = t('load_ok');
      return;
    }
    var p = E.parsePgn(txt);
    if (p.error === 'fen') { msg.textContent = t('load_bad_fen', { why: t('fen_err_format') }); return; }
    if (p.error === 'move' && (!p.game || !p.game.moves.length)) { msg.textContent = t('load_bad_move', { move: p.at }); return; }
    newGame(true, p.game.startFen);
    p.game.moves.forEach(function (m) { G.game.playUci(m.uci); if (G.times) G.hist.push(G.times.slice()); });
    if (p.result && p.result !== '*' && !status().over) {
      G.game.setResult(p.result, p.result === '1/2-1/2' ? 'agreed' : (p.result === '1-0' ? 'resign' : 'resign'));
      if (p.result === '1-0') G.game.result.reason = 'resign';
    }
    cancelAll(); cpuReq = 0;
    overShown = status().over;   /* a finished game from a file: no pop-up, the result is shown below the board */
    saveGame(); renderPlay();
    msg.textContent = p.error === 'move' ? t('load_bad_move', { move: p.at }) : t('load_ok');
    if (isCpuTurn()) requestCpu();
  }
  function pgnText() {
    var d = new Date(), date = d.getFullYear() + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + ('0' + d.getDate()).slice(-2);
    var wn = G.mode === 'cpu' ? (G.human === 0 ? 'You' : 'Computer level ' + G.level) : 'White';
    var bn = G.mode === 'cpu' ? (G.human === 8 ? 'You' : 'Computer level ' + G.level) : 'Black';
    var tags = { Event: 'AI Pathshala Chess', Site: 'apnipathshala.ai', Date: date, White: wn, Black: bn };
    if (G.times) tags.TimeControl = CLOCKS[G.clk][0] + '+' + CLOCKS[G.clk][1];
    var st = status();
    if (st.over) tags.Termination = st.reason;
    return G.game.pgn(tags);
  }

  function initPlay() {
    PB = Board($('#play-board'), {
      label: function () { return t('board_aria'); },
      canPick: function (sq) { if (!humanCanMove()) return false; var p = G.game.pos.board[sq]; return !!p && (p & 8) === G.game.pos.turn; },
      targets: function (sq) { return targetsOf(playLegal(), sq); },
      isCapture: function (from, to) { return playLegal().some(function (m) { return E.mFrom(m) === from && E.mTo(m) === to && (E.mFlags(m) & E.F_CAP); }); },
      onMove: function (from, to) {
        resolveMove(PB, playLegal(), from, to, G.game.pos.turn).then(function (m) { if (m) humanMove(m); else renderPlayBoard(); });
      },
      announce: function (sq) { $('#status').textContent = sqWords(sq) + (G.game.pos.board[sq] ? ' · ' + t('pc_' + ' pnbrqk'[G.game.pos.board[sq] & 7]) + ' (' + sideName(G.game.pos.board[sq] & 8) + ')' : ''); }
    });
    G = loadGame() || fresh();
    overShown = status().over;
    $$('[data-mode]').forEach(function (b) { b.addEventListener('click', function () { S.mode = b.dataset.mode; saveSettings(); renderSettings(); }); });
    $$('[data-lv]').forEach(function (b) { b.addEventListener('click', function () { S.level = +b.dataset.lv; saveSettings(); renderSettings(); }); });
    $$('[data-col]').forEach(function (b) { b.addEventListener('click', function () { S.col = b.dataset.col; saveSettings(); renderSettings(); }); });
    $$('[data-clk]').forEach(function (b) { b.addEventListener('click', function () { S.clk = b.dataset.clk; saveSettings(); renderSettings(); }); });
    $('#new-game').addEventListener('click', function () { newGame(false); });
    $('#autoflip').addEventListener('change', function (e) { S.autoflip = e.target.checked; saveSettings(); if (G.mode === 'human' && S.autoflip) { G.flipped = G.game.pos.turn === 8; saveGame(); renderPlay(); } });
    $('#showdots').addEventListener('change', function (e) { S.showdots = e.target.checked; saveSettings(); renderPlay(); });
    $('#autodraw').addEventListener('change', function (e) {
      S.autodraw = e.target.checked; saveSettings(); renderPlay();
      if (status().over) gameOverDialog(); else if (isCpuTurn() && !cpuReq) requestCpu();
    });
    $('#sound').addEventListener('change', function (e) { S.sound = e.target.checked; saveSettings(); beep(false); });
    $('#undo').addEventListener('click', undo);
    $('#hint').addEventListener('click', hint);
    $('#flip').addEventListener('click', function () { G.flipped = !G.flipped; saveGame(); renderPlay(); });
    $('#resign').addEventListener('click', resign);
    $('#draw').addEventListener('click', offerDraw);
    $('#claim').addEventListener('click', claimDraw);
    $('#fs-btn').addEventListener('click', function () { EDU.fullscreen($('#board-card')); });
    $('#nav-first').addEventListener('click', function () { setView(0); });
    $('#nav-prev').addEventListener('click', function () { setView((view === null ? G.game.moves.length : view) - 1); });
    $('#nav-next').addEventListener('click', function () { if (view !== null) setView(view + 1); });
    $('#nav-last').addEventListener('click', function () { setView(null); });
    $('#mlist').addEventListener('click', function (e) { var b = e.target.closest('button[data-ply]'); if (b) setView(+b.dataset.ply); });
    $('#type-btn').addEventListener('click', typedMove);
    $('#type-move').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); typedMove(); } });
    $('#copy-pgn').addEventListener('click', function () { EDU.copy(pgnText()); });
    $('#dl-pgn').addEventListener('click', function () { EDU.download('chess-game.pgn', pgnText(), 'application/x-chess-pgn'); });
    $('#copy-fen').addEventListener('click', function () { EDU.copy(viewPos().fen()); });
    $('#print-btn').addEventListener('click', function () { window.print(); });
    $('#load-btn').addEventListener('click', loadText);
    $('#load-file').addEventListener('click', function () {
      EDU.pickFile('.pgn,.fen,.txt,text/plain').then(function (f) {
        if (!f) return;
        if (f.size > 2 * 1024 * 1024) { $('#load-msg').textContent = t('load_big'); return; }
        EDU.readText(f).then(function (txt) {
          /* a PGN file can hold many games: take the first one */
          var parts = txt.split(/\n\s*\n(?=\[Event )/);
          $('#load-text').value = parts[0].slice(0, 200000);
          loadText();
        });
      });
    });
    renderSettings();
    startClock();
    renderPlay();
    if (isCpuTurn()) requestCpu();
  }

  /* ================================================================ PUZZLES */
  var P = { idx: 0, game: null, phase: 'solve', ply: 0, req: 0, done: false, failed: false };
  var PZ;
  var solved = (function () { var s = store.get('solved', []); return Array.isArray(s) ? s.filter(function (f) { return typeof f === 'string'; }) : []; })();
  function isSolved(i) { return solved.indexOf(PUZ[i].fen) >= 0; }
  function pzLegal() { return P.done || P.phase !== 'solve' ? [] : P.game.pos.legalMoves(); }
  function pzMsg(kind, fn) { P.msgFn = fn; P.kind = kind; var b = $('#pz-msg'); b.dataset.kind = kind || ''; b.textContent = fn(); }
  function pzTask() {
    var pz = PUZ[P.idx], black = / b /.test(pz.fen);
    return t((pz.n === 1 ? 'pz_m1_' : 'pz_m2_') + (black ? 'b' : 'w'));
  }
  function renderPuzzleBoard(anim, hintSq) {
    var pos = P.game.pos, last = P.game.moves[P.game.moves.length - 1];
    PZ.set({ board: pos.board, flipped: / b /.test(PUZ[P.idx].fen), last: last ? { from: last.from, to: last.to } : null,
      check: pos.inCheck() ? pos.kings[pos.turn >> 3] : -1, dots: S.showdots, anim: anim || null, marks: hintSq >= 0 ? [hintSq] : [], hint: P.solution || null });
  }
  function renderPuzzles() {
    var pz = PUZ[P.idx];
    $('#pz-task').textContent = t('pz_n', { n: fmt(P.idx + 1), total: fmt(PUZ.length) }) + ' · ' + pzTask();
    $('#pz-theme').textContent = t('th_' + pz.theme);
    var n = PUZ.filter(function (_, i) { return isSolved(i); }).length;
    $('#pz-count').textContent = n === PUZ.length ? t('pz_all_done', { total: fmt(PUZ.length) }) : t('pz_solved_count', { n: fmt(n), total: fmt(PUZ.length) });
    $('#pz-bar').style.width = (100 * n / PUZ.length) + '%';
    $('#pz-list').innerHTML = PUZ.map(function (p, i) {
      var lab = t('pz_n', { n: fmt(i + 1), total: fmt(PUZ.length) }) + ' · ' + t(p.n === 1 ? 'pz_mate1' : 'pz_mate2') + (isSolved(i) ? ' · ' + t('pz_solved_mark') : '');
      return '<button type="button" class="' + (p.n === 2 ? 'm2' : '') + (isSolved(i) ? ' solved' : '') + '" data-pz="' + i + '" id="pz-btn-' + i + '"' + (i === P.idx ? ' aria-current="true"' : '') +
        ' aria-label="' + EDU.esc(lab) + '" title="' + EDU.esc(lab) + '">' + (isSolved(i) ? '✓' : (i + 1)) + '</button>';
    }).join('');
    if (P.msgFn) pzMsg(P.kind, P.msgFn);
    $('#pz-hint').disabled = P.done;
    $('#pz-show').disabled = P.done && !P.failed;
  }
  function loadPuzzle(i) {
    P.idx = EDU.clamp(i | 0, 0, PUZ.length - 1);
    store.set('pz', P.idx);
    P.game = new E.Game(PUZ[P.idx].fen);
    P.phase = 'solve'; P.ply = 0; P.done = false; P.failed = false; P.req = 0; P.solution = null;
    pzMsg('', function () { return pzTask(); });
    renderPuzzleBoard();
    renderPuzzles();
  }
  function markSolved() {
    var f = PUZ[P.idx].fen;
    if (!P.failed && solved.indexOf(f) < 0) { solved.push(f); store.set('solved', solved); }
  }
  function isMateNow() { var st = P.game.status(); return st.over && st.reason === 'checkmate'; }
  function pzMove(m) {
    var pz = PUZ[P.idx];
    var rec = P.game.play(m);
    if (!rec) return;
    beep(!!rec.captured);
    P.solution = null;
    if (isMateNow()) {
      P.done = true; markSolved();
      renderPuzzleBoard({ from: rec.from, to: rec.to });
      pzMsg('good', function () { return P.failed ? t('pz_correct_after') : t('pz_correct'); });
      renderPuzzles();
      return;
    }
    var keyOk = pz.n === 2 && P.ply === 0 && rec.uci === pz.sol;
    renderPuzzleBoard({ from: rec.from, to: rec.to });
    if (!keyOk) {
      P.failed = true;
      pzMsg('check', function () { return t(P.ply === 0 && pz.n === 2 ? 'pz_wrong' : 'pz_wrong2'); });
      P.phase = 'wait';
      setTimeout(function () { P.game.undo(); P.phase = 'solve'; renderPuzzleBoard(); renderPuzzles(); }, 900);
      renderPuzzles();
      return;
    }
    /* good key move: the computer finds the most stubborn defence */
    P.phase = 'wait'; P.ply = 1;
    pzMsg('good', function () { return t('pz_good_m2'); });
    renderPuzzles();
    var id = P.req = think({ fen: pz.fen, moves: [pz.sol], level: 6, time: 400, book: false, seed: nextSeed() }, function (res) {
      if (id !== P.req) return;
      setTimeout(function () {
        if (id !== P.req || !res || !res.move) return;
        var r2 = P.game.playUci(res.move);
        P.phase = 'solve';
        renderPuzzleBoard(r2 ? { from: r2.from, to: r2.to } : null);
        pzMsg('', function () { return t('pz_now_mate', { move: r2 ? r2.san : '' }); });
        renderPuzzles();
      }, reduceMotion ? 100 : 450);
    });
  }
  function mateMoves(pos) {
    return pos.legalMoves().filter(function (m) { pos.make(m); var ok = pos.inCheck() && !pos.hasLegalMove(); pos.unmake(); return ok; });
  }
  function pzSolutionMove() {
    if (P.phase !== 'solve' || P.done) return 0;
    if (P.game.moves.length === 0) {
      var pz = PUZ[P.idx];
      return P.game.legal().filter(function (m) { return E.uci(m) === pz.sol; })[0] || 0;
    }
    return mateMoves(P.game.pos)[0] || 0;
  }
  function initPuzzles() {
    PZ = Board($('#pz-board'), {
      label: function () { return t('board_aria'); },
      canPick: function (sq) { var p = P.game.pos.board[sq]; return P.phase === 'solve' && !P.done && !!p && (p & 8) === P.game.pos.turn; },
      targets: function (sq) { return targetsOf(pzLegal(), sq); },
      isCapture: function (from, to) { return pzLegal().some(function (m) { return E.mFrom(m) === from && E.mTo(m) === to && (E.mFlags(m) & E.F_CAP); }); },
      onMove: function (from, to) { resolveMove(PZ, pzLegal(), from, to, P.game.pos.turn).then(function (m) { if (m) pzMove(m); else renderPuzzleBoard(); }); }
    });
    $('#pz-list').addEventListener('click', function (e) { var b = e.target.closest('[data-pz]'); if (b) loadPuzzle(+b.dataset.pz); });
    $('#pz-next').addEventListener('click', function () {
      var i = P.idx;
      for (var k = 1; k <= PUZ.length; k++) { var j = (P.idx + k) % PUZ.length; if (!isSolved(j)) { i = j; break; } if (k === PUZ.length) i = (P.idx + 1) % PUZ.length; }
      loadPuzzle(i);
    });
    $('#pz-retry').addEventListener('click', function () { P.req = 0; loadPuzzle(P.idx); });
    $('#pz-hint').addEventListener('click', function () {
      var m = pzSolutionMove();
      if (!m) return;
      P.failed = P.failed || false;
      renderPuzzleBoard(null, E.mFrom(m));
      pzMsg('', function () { return t('pz_hint', { sq: E.sqName(E.mFrom(m)) }); });
    });
    $('#pz-show').addEventListener('click', function () {
      var m = pzSolutionMove();
      if (!m) return;
      P.failed = true;
      var s = E.san(P.game.pos, m);
      P.solution = { from: E.mFrom(m), to: E.mTo(m) };
      renderPuzzleBoard();
      pzMsg('', function () { return t('pz_solution', { move: s }); });
      renderPuzzles();
    });
    $('#pz-reset').addEventListener('click', function () {
      if (!confirm(t('confirm_reset'))) return;
      solved = []; store.set('solved', solved); renderPuzzles();
    });
    var first = store.get('pz', null);
    if (first === null) { first = 0; for (var i = 0; i < PUZ.length; i++) if (!isSolved(i)) { first = i; break; } }
    loadPuzzle(first);
  }

  /* ================================================================ LEARN */
  /* piece lessons: one white piece and black pawns to catch (the pawns do not move) */
  var LESSONS = {
    k: { code: 6, at: 'e4', pawns: ['d5', 'e6', 'f5'], val: 'val_k' },
    q: { code: 5, at: 'd1', pawns: ['d7', 'a4', 'h4'], val: 9 },
    r: { code: 4, at: 'a1', pawns: ['a8', 'h8', 'h1'], val: 5 },
    b: { code: 3, at: 'c1', pawns: ['a3', 'e5', 'g7'], val: 3 },
    n: { code: 2, at: 'b1', pawns: ['c3', 'e4', 'f6'], val: 3 },
    p: { code: 1, at: 'e2', pawns: ['d5', 'c6', 'b7'], val: 1 }
  };
  var L = { piece: 'n', pos: null, sq: -1, count: 0 };
  var LB;
  function lessonPos() {
    var pos = new E.Position();
    pos.turn = 0; pos.castle = 0; pos.ep = -1;
    return pos;
  }
  function learnTargets(sq) {
    if (sq !== L.sq) return [];
    var buf = new Int32Array(64), n = L.pos.gen(buf, 0, false), out = [];
    for (var k = 0; k < n; k++) if (E.mFrom(buf[k]) === sq && out.indexOf(E.mTo(buf[k])) < 0) out.push(E.mTo(buf[k]));
    return out;
  }
  function pawnsLeft() { var n = 0; for (var s = 0; s < 120; s++) { if (s & 0x88) { s += 7; continue; } if (L.pos.board[s] === 9) n++; } return n; }
  function learnMsg() {
    var left = pawnsLeft();
    var b = $('#learn-msg');
    b.dataset.kind = left ? '' : 'good';
    b.textContent = left ? t('lesson_goal', { n: fmt(left) }) + ' · ' + t('moves_count', { n: fmt(L.count) }) : t('lesson_done', { n: fmt(L.count) });
  }
  function renderLearnText() {
    var ls = LESSONS[L.piece];
    $('#pc-name').textContent = t('pc_' + L.piece);
    $('#pc-move').textContent = t('mv_' + L.piece);
    $('#pc-val').textContent = typeof ls.val === 'number' ? t('val', { n: fmt(ls.val) }) : t(ls.val);
    $('#pc-pick').innerHTML = 'kqrbnp'.split('').map(function (k) {
      return '<button type="button" data-pc="' + k + '" id="pc-' + k + '" aria-pressed="' + (k === L.piece) + '">' + pieceSvg(LESSONS[k].code) + '<span>' + EDU.esc(t('pc_' + k)) + '</span></button>';
    }).join('');
    learnMsg();
  }
  function startLesson(k) {
    L.piece = k; L.count = 0;
    var ls = LESSONS[k];
    L.pos = lessonPos();
    L.sq = E.sqIndex(ls.at);
    L.pos.board[L.sq] = ls.code;
    ls.pawns.forEach(function (s) { L.pos.board[E.sqIndex(s)] = 9; });
    LB.set({ board: L.pos.board, sel: L.sq, last: null, check: -1, dots: true });
    renderLearnText();
  }
  function initLearn() {
    LB = Board($('#learn-board'), {
      label: function () { return t('pc_' + L.piece); },
      canPick: function (sq) { return sq === L.sq && pawnsLeft() > 0; },
      targets: learnTargets,
      onMove: function (from, to) {
        var p = L.pos.board[from];
        L.pos.board[to] = p; L.pos.board[from] = 0;
        if (p === 1 && (to >> 4) === 7) L.pos.board[to] = 5;   /* a pawn reaching the end becomes a queen */
        L.sq = to; L.count++;
        beep(false);
        LB.set({ board: L.pos.board, last: { from: from, to: to }, sel: pawnsLeft() ? to : -1, anim: { from: from, to: to } });
        learnMsg();
      }
    });
    $('#pc-pick').addEventListener('click', function (e) { var b = e.target.closest('[data-pc]'); if (b) { startLesson(b.dataset.pc); store.set('lesson', b.dataset.pc); } });
    $('#learn-reset').addEventListener('click', function () { startLesson(L.piece); });
    startLesson(oneOf(store.get('lesson', 'n'), 'kqrbnp'.split(''), 'n'));
    initSpecial('castle', 'r3k2r/pppq1ppp/2n1bn2/4p3/4P3/2N1BN2/PPPQ1PPP/R3K2R w KQkq - 0 1', function (m) { return E.mFlags(m) & E.F_CASTLE; }, 'sp_castle_try', null);
    initSpecial('ep', 'rnbqkbnr/ppp1p1pp/5p2/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3', function (m) { return E.mFlags(m) & E.F_EP; }, 'sp_ep_try', { from: E.sqIndex('d7'), to: E.sqIndex('d5') });
    initSpecial('promo', '7k/4P3/8/8/8/8/6PP/6K1 w - - 0 1', function (m) { return E.mPromo(m); }, 'sp_promo_try', null);
  }
  var SP = {};
  function initSpecial(id, fen, goal, tryKey, lastMv) {
    var st = { game: null, done: false };
    SP[id] = st;
    var msg = $('#sp-' + id + '-msg');
    function legal() {
      if (st.done) return [];
      return st.game.pos.legalMoves().filter(goal);        /* only the special move is allowed here */
    }
    var B = Board($('#sp-' + id + '-board'), {
      label: function () { return t('sp_' + id + '_t'); },
      canPick: function (sq) { return legal().some(function (m) { return E.mFrom(m) === sq; }); },
      targets: function (sq) { return targetsOf(legal(), sq); },
      isCapture: function (from, to) { return legal().some(function (m) { return E.mFrom(m) === from && E.mTo(m) === to && (E.mFlags(m) & E.F_CAP); }); },
      onMove: function (from, to) {
        resolveMove(B, legal(), from, to, 0).then(function (m) {
          if (!m) { B.render(); return; }
          var rec = st.game.play(m);
          st.done = true;
          beep(!!rec.captured);
          B.set({ board: st.game.pos.board, last: { from: rec.from, to: rec.to }, check: st.game.pos.inCheck() ? st.game.pos.kings[1] : -1, anim: { from: rec.from, to: rec.to }, sel: -1 });
          st.msg = function () { return t('sp_done') + ' ' + rec.san; };
          msg.dataset.kind = 'good'; msg.textContent = st.msg();
        });
      }
    });
    function reset() {
      st.game = new E.Game(fen); st.done = false;
      st.msg = function () { return t(tryKey); };
      msg.dataset.kind = ''; msg.textContent = st.msg();
      B.set({ board: st.game.pos.board, last: lastMv, check: -1, sel: -1, marks: [] });
    }
    st.reset = reset; st.B = B; st.msgEl = msg;
    $('#sp-' + id + '-again').addEventListener('click', reset);
    reset();
  }

  /* ================================================================ tabs */
  function showTab(tab) {
    S.tab = tab; saveSettings();
    $$('#tabs [data-tab]').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.tab === tab)); b.tabIndex = b.dataset.tab === tab ? 0 : -1; });
    ['play', 'puzzles', 'learn'].forEach(function (k) { $('#tab-' + k).hidden = k !== tab; });
  }
  $('#tabs').addEventListener('click', function (e) { var b = e.target.closest('[data-tab]'); if (b) showTab(b.dataset.tab); });
  $('#tabs').addEventListener('keydown', function (e) {
    var order = ['play', 'puzzles', 'learn'], i = order.indexOf(S.tab);
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      var rtl = document.documentElement.dir === 'rtl', d = (e.key === 'ArrowRight') !== rtl ? 1 : -1;
      var next = order[(i + d + 3) % 3];
      showTab(next); $('#tabbtn-' + next).focus(); e.preventDefault();
    }
  });

  /* ================================================================ start */
  initPlay();
  initPuzzles();
  initLearn();
  showTab(S.tab);

  EDU.onLang(function () {
    renderSettings();
    renderPlay();
    renderPuzzles();
    renderLearnText();
    Object.keys(SP).forEach(function (k) { if (SP[k].msg) SP[k].msgEl.textContent = SP[k].msg(); });
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) lastClockTick = Date.now(); else saveGame(); });
  window.addEventListener('pagehide', saveGame);

  /* small hook for the automated test: fixed random seeds + read-only state; normal play is unchanged */
  window.__gameTest = {
    setSeed: function (n) { testSeed = n >>> 0; },
    state: function () {
      var st = status();
      return { fen: G.game.fen(), turn: G.game.pos.turn === 0 ? 'w' : 'b', moves: G.game.moves.map(function (m) { return m.san; }), uci: G.game.moves.map(function (m) { return m.uci; }),
        over: st.over, result: st.result || null, reason: st.reason || null, check: st.check, mode: G.mode, level: G.level, human: G.human === 0 ? 'w' : 'b', thinking: !!cpuReq,
        flipped: G.flipped, times: G.times ? G.times.slice() : null, view: view };
    },
    legalUci: function (fen, moves) { var p = E.buildPosition(fen || E.START_FEN, moves || []); return p ? p.legalMoves().map(E.uci) : null; },
    puzzle: function () { return { idx: P.idx, done: P.done, phase: P.phase, solved: solved.length, total: PUZ.length, sol: PUZ[P.idx].sol, n: PUZ[P.idx].n }; },
    lesson: function () { return { piece: L.piece, left: pawnsLeft(), count: L.count }; }
  };
})();
