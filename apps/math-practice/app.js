/* Mental Maths Challenge (math-practice)
   Timed mental-maths drills, a table trainer, mistake review, printable worksheets
   and a two-player race on one screen. Everything runs on the device. */
(function () {
  'use strict';
  var SLUG = 'math-practice';
  var store = EDU.store(SLUG);
  var $ = EDU.$, $$ = EDU.$$, el = EDU.el;
  var t = function (k, v) { return EDU.t(k, v); };

  var MODES = ['sprint', 'twenty', 'practice', 'table', 'duel'];
  var LEVELS = ['d1', 'd2', 'd3', 'tables', 'squares', 'cubes', 'percent'];
  var OP_LEVELS = ['d1', 'd2', 'd3', 'tables'];
  var OPS = ['add', 'sub', 'mul', 'div'];
  var SYM = { add: '+', sub: '−', mul: '×', div: '÷' };
  var DURS = [30, 60, 120], TARGETS = [10, 15, 20];
  var NB = String.fromCharCode(0xA0);   // no-break space
  var LRI = String.fromCharCode(0x2066), PDI = String.fromCharCode(0x2069);   // left-to-right isolate, for numbers inside RTL text
  var MAX_DIGITS = 6;

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ------------------------------------------------------------ settings */
  function cleanSettings(s) {
    s = (s && typeof s === 'object') ? s : {};
    var o = {};
    o.mode = MODES.indexOf(s.mode) >= 0 ? s.mode : 'sprint';
    o.level = LEVELS.indexOf(s.level) >= 0 ? s.level : 'd1';
    o.ops = Array.isArray(s.ops) ? OPS.filter(function (x) { return s.ops.indexOf(x) >= 0; }) : [];
    if (!o.ops.length) o.ops = ['add', 'sub'];
    o.table = (+s.table >= 2 && +s.table <= 20) ? Math.round(+s.table) : 7;
    o.dur = DURS.indexOf(s.dur) >= 0 ? s.dur : 60;
    o.target = TARGETS.indexOf(s.target) >= 0 ? s.target : 10;
    var n = Array.isArray(s.names) ? s.names : [];
    o.names = [String(n[0] || '').slice(0, 20), String(n[1] || '').slice(0, 20)];
    o.flip = !!s.flip;
    o.muted = !!s.muted;
    return o;
  }
  var S = cleanSettings(store.get('settings', null));
  function saveSettings() { store.set('settings', S); }

  /* Operations that actually apply to a level (in fixed order). */
  function effOps(level, ops) {
    if (level === 'tables') {
      var m = OPS.filter(function (o) { return (o === 'mul' || o === 'div') && ops.indexOf(o) >= 0; });
      return m.length ? m : ['mul', 'div'];
    }
    if (OP_LEVELS.indexOf(level) < 0) return [];
    var r = OPS.filter(function (o) { return ops.indexOf(o) >= 0; });
    return r.length ? r : ['add'];
  }
  function currentCfg() {
    return { mode: S.mode, level: S.level, ops: effOps(S.level, S.ops), table: S.table, dur: S.dur };
  }

  /* ------------------------------------------------------------ questions
     q = { k: 'add'|'sub'|'mul'|'div'|'sq'|'sqrt'|'cube'|'cbrt'|'pct', a, b, ans }
     Every answer is a whole number ≥ 0; division always divides exactly. */
  function R(a, b) { return EDU.randInt(a, b); }
  var GEN = {
    d1: {
      add: function () { var a = R(1, 9), b = R(1, 9); return [a, b, a + b]; },
      sub: function () { var x = R(1, 9), y = R(1, 9); return [x + y, y, x]; },          // inverse of 1-digit addition facts
      mul: function () { var a = R(2, 9), b = R(2, 9); return [a, b, a * b]; },
      div: function () { var q = R(2, 9), b = R(2, 9); return [q * b, b, q]; }
    },
    d2: {
      add: function () { var a = R(10, 99), b = R(10, 99); return [a, b, a + b]; },
      sub: function () { var a = R(20, 99), b = R(10, a - 1); return [a, b, a - b]; },
      mul: function () { var a = R(11, 99), b = R(2, 9); return [a, b, a * b]; },
      div: function () { var b = R(2, 9), q = R(Math.max(2, Math.ceil(10 / b)), Math.floor(99 / b)); return [q * b, b, q]; }
    },
    d3: {
      add: function () { var a = R(100, 999), b = R(100, 999); return [a, b, a + b]; },
      sub: function () { var a = R(200, 999), b = R(100, a - 1); return [a, b, a - b]; },
      mul: function () { var a = R(101, 999), b = R(2, 9); return [a, b, a * b]; },
      div: function () { var b = R(2, 9), q = R(Math.ceil(100 / b), Math.floor(999 / b)); return [q * b, b, q]; }
    },
    tables: {
      mul: function () { var a = R(2, 20), b = R(1, 10); return Math.random() < 0.75 ? [a, b, a * b] : [b, a, a * b]; },
      div: function () { var a = R(2, 20), b = R(1, 10); return [a * b, a, b]; }
    }
  };
  var PCTS = [1, 5, 10, 10, 20, 25, 25, 50, 50, 75, 15, 30, 40, 60, 80, 90];
  var BASES = [20, 40, 50, 60, 80, 100, 120, 140, 150, 160, 180, 200, 240, 250, 300, 320, 360, 400, 450, 500, 600, 800, 1000, 1200, 1500, 2000];

  function makeQ(level, ops) {
    var n, i;
    if (level === 'squares') { n = R(2, 30); return Math.random() < 0.65 ? { k: 'sq', a: n, ans: n * n } : { k: 'sqrt', a: n * n, ans: n }; }
    if (level === 'cubes') { n = R(2, 15); return Math.random() < 0.65 ? { k: 'cube', a: n, ans: n * n * n } : { k: 'cbrt', a: n * n * n, ans: n }; }
    if (level === 'percent') {
      for (i = 0; i < 100; i++) {
        var p = EDU.pick(PCTS), b = EDU.pick(BASES);
        if ((p * b) % 100 === 0) return { k: 'pct', a: p, b: b, ans: (p * b) / 100 };   // integer maths, exact
      }
      return { k: 'pct', a: 10, b: 200, ans: 20 };
    }
    var op = EDU.pick(effOps(level, ops));
    var g = (GEN[level] && GEN[level][op]) || GEN.d1[op];
    var r = g();
    return { k: op, a: r[0], b: r[1], ans: r[2] };
  }
  function qKey(q) { return q.k + ':' + q.a + ':' + (q.b || 0); }
  function qText(q) {
    switch (q.k) {
      case 'add': case 'sub': case 'mul': case 'div': return q.a + NB + SYM[q.k] + NB + q.b;
      case 'sq': return q.a + '²';
      case 'sqrt': return '√' + q.a;
      case 'cube': return q.a + '³';
      case 'cbrt': return '³√' + q.a;
      case 'pct':   /* isolate the numbers so "10%" stays "10%" inside Urdu (RTL) text */
        return t('pct_of', { p: LRI + q.a, n: LRI + q.b + PDI }).replace('%', '%' + PDI);
    }
    return '';
  }
  function qDir(q) { return q && q.k === 'pct' ? 'auto' : 'ltr'; }

  /* random stream that avoids repeating any of the last few questions */
  function Gen(level, ops) { this.level = level; this.ops = ops; this.recent = []; }
  Gen.prototype.next = function () {
    var q;
    for (var i = 0; i < 40; i++) { q = makeQ(this.level, this.ops); if (this.recent.indexOf(qKey(q)) < 0) break; }
    this.recent.push(qKey(q));
    if (this.recent.length > 8) this.recent.shift();
    return q;
  };
  function uniqueList(level, ops, n) {
    var out = [], seen = {}, tries = 0;
    while (out.length < n && tries < n * 60) {
      tries++;
      var q = makeQ(level, ops), k = qKey(q);
      if (seen[k] && tries < n * 50) continue;
      seen[k] = 1; out.push(q);
    }
    return out;
  }
  /* table trainer: n×1 … n×10 in order, then the same ten facts mixed up */
  function tableList(n) {
    var a = [], k;
    for (k = 1; k <= 10; k++) a.push({ k: 'mul', a: n, b: k, ans: n * k, phase: 1 });
    var b = EDU.shuffle(a).map(function (q) { return { k: 'mul', a: q.a, b: q.b, ans: q.ans, phase: 2 }; });
    if (b[0].b === 10) b.push(b.shift());            // do not repeat the last ordered fact straight away
    return a.concat(b);
  }

  /* ------------------------------------------------------------ labels */
  function modeName(m) { return t(m === 'mistakes' ? 'mistakes_round' : 'mode_' + m); }
  function descr(c) {
    if (c.mode === 'table' || c.from === 'table') return t('table_of', { n: c.table });
    var s = t('lvl_' + c.level);
    if (c.ops && c.ops.length) s += ' · ' + c.ops.map(function (o) { return SYM[o]; }).join(' ');
    if (c.mode === 'sprint') s += ' · ' + t('secs', { n: c.dur });
    return s;
  }
  function bestKey(c) {
    if (c.mode === 'table') return 'table|' + c.table;
    var k = c.mode + '|' + c.level;
    if (c.ops && c.ops.length) k += '|' + c.ops.join('');
    if (c.mode === 'sprint') k += '|' + c.dur;
    return k;
  }
  function clock(s) { s = Math.max(0, Math.floor(s)); var m = Math.floor(s / 60), r = s % 60; return m + ':' + (r < 10 ? '0' : '') + r; }
  function secs(x) { return t('secs', { n: EDU.fmt(x, { maximumFractionDigits: 1, minimumFractionDigits: x < 10 ? 1 : 0 }) }); }
  function fmtDate(ms) {
    try {
      return new Intl.DateTimeFormat(EDU.langInfo(EDU.lang).tag, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, numberingSystem: 'latn' }).format(new Date(ms));
    } catch (e) { var d = new Date(ms); return d.getDate() + '/' + (d.getMonth() + 1); }
  }
  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }

  /* ------------------------------------------------------------ sound (Web Audio, no files) */
  var actx = null;
  function audio() {
    if (actx) return actx;
    try { var AC = window.AudioContext || window.webkitAudioContext; if (AC) actx = new AC(); } catch (e) { actx = null; }
    return actx;
  }
  function tone(freq, dur, type, vol, delay) {
    if (S.muted) return;
    var ctx = audio(); if (!ctx) return;
    try {
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
      var t0 = ctx.currentTime + (delay || 0), o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(t0); o.stop(t0 + dur + 0.03);
    } catch (e) { /* sound is optional */ }
  }
  function sfx(kind) {
    if (kind === 'ok') { tone(660, 0.12, 'sine', 0.18); tone(990, 0.16, 'sine', 0.18, 0.08); }
    else if (kind === 'bad') { tone(220, 0.25, 'triangle', 0.25); tone(165, 0.3, 'triangle', 0.22, 0.12); }
    else if (kind === 'streak') { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.15, 'sine', 0.16, i * 0.07); }); }
    else if (kind === 'tick') tone(520, 0.1, 'sine', 0.14);
    else if (kind === 'go') tone(880, 0.22, 'sine', 0.2);
    else if (kind === 'end') { [784, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.18, 'sine', 0.16, i * 0.12); }); }
  }
  function updateMute() {
    $$('.mp-mute').forEach(function (b) {
      var lbl = t(S.muted ? 'sound_off' : 'sound_on');
      b.textContent = S.muted ? '🔇' : '🔊';
      b.setAttribute('aria-label', lbl); b.title = lbl;
    });
  }
  $$('.mp-mute').forEach(function (b) {
    b.addEventListener('click', function () { S.muted = !S.muted; saveSettings(); updateMute(); if (!S.muted) sfx('ok'); });
  });
  $$('.mp-fs').forEach(function (b) { b.addEventListener('click', function () { EDU.fullscreen(); }); });

  /* ------------------------------------------------------------ timers + screens */
  var timers = [], tickId = null, screen = 'setup';
  function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
  function stopTimers() { timers.forEach(clearTimeout); timers = []; if (tickId) { clearInterval(tickId); tickId = null; } }
  function show(name) {
    screen = name;
    ['setup', 'play', 'duel', 'summary'].forEach(function (s) { $('#' + s).hidden = s !== name; });
    $('#app').classList.toggle('mp-playing', name === 'play' || name === 'duel');
    if (name === 'setup') renderSetup();
    try { window.scrollTo(0, 0); } catch (e) { }
  }

  function countdown(box, numEl, done) {
    var steps = ['3', '2', '1', t('go')], i = 0;
    box.hidden = false;
    (function step() {
      if (i >= steps.length) { box.hidden = true; done(); return; }
      numEl.textContent = steps[i];
      sfx(i < 3 ? 'tick' : 'go');
      i++;
      later(step, i <= 3 ? 650 : 450);
    })();
  }

  /* number pads: pointerdown for instant multi-touch, click for keyboard activation */
  function padButton(k) {
    var label = k === 'back' ? '⌫' : k === 'ok' ? '✓' : k;
    var b = el('button', { type: 'button', class: k === 'back' ? 'k-back' : k === 'ok' ? 'k-ok' : 'k-n', 'data-k': k, text: label });
    if (k === 'back') b.setAttribute('data-i18n-aria-label', 'backspace');
    if (k === 'ok') b.setAttribute('data-i18n-aria-label', 'check');
    return b;
  }
  function buildPad(pad, keys, onKey) {
    pad.innerHTML = '';
    keys.forEach(function (k) { pad.appendChild(padButton(k)); });
    EDU.apply(pad);
    pad.addEventListener('pointerdown', function (e) {
      var b = e.target.closest('button[data-k]');
      if (!b || (e.pointerType === 'mouse' && e.button !== 0)) return;
      if (e.pointerType !== 'mouse') e.preventDefault();
      b.dataset.pd = String(Date.now());
      flash(b);
      onKey(b.dataset.k);
    });
    pad.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-k]');
      if (!b) return;
      if (Date.now() - (+b.dataset.pd || 0) < 900) return;    // already handled on pointerdown
      flash(b);
      onKey(b.dataset.k);
    });
  }
  function flash(b) { b.classList.add('hit'); setTimeout(function () { b.classList.remove('hit'); }, 120); }

  /* ============================================================ ONE-PLAYER GAME */
  var G = null, LAST = null;

  function startGame(cfg) {
    stopTimers();
    D = null;
    G = { cfg: cfg, idx: 0, cur: null, input: '', points: 0, streak: 0, bestStreak: 0, correct: 0, wrong: 0, log: [], fb: null,
      facts: [], locked: true, over: false, startAt: 0 };
    if (cfg.mode === 'table') G.list = tableList(cfg.table);
    else if (cfg.mode === 'mistakes') G.list = cfg.list.slice();
    else if (cfg.mode === 'twenty') G.list = uniqueList(cfg.level, cfg.ops, 20);
    else G.gen = new Gen(cfg.level, cfg.ops);
    show('play');
    var qa = $('#qa'); qa.dataset.qid = '0'; qa.dataset.state = 'count';
    renderPlay();
    if (cfg.mode === 'sprint' || cfg.mode === 'twenty') countdown($('#count'), $('#count-n'), begin);
    else begin();
  }
  function begin() {
    if (!G || G.over) return;
    G.startAt = now();
    if (G.cfg.mode === 'sprint') G.endAt = G.startAt + G.cfg.dur * 1000;
    tickId = setInterval(tick, 200);
    nextQ();
    tick();
  }
  function nextQ() {
    if (!G || G.over) return;
    if (G.list && G.idx >= G.list.length) { finish(false); return; }
    G.cur = G.list ? G.list[G.idx] : G.gen.next();
    G.idx++;
    G.input = ''; G.fb = null; G.locked = false; G.qStart = now();
    renderPlay();
    var qa = $('#qa'); qa.dataset.state = 'ready'; qa.dataset.qid = String(G.idx);
  }
  function playKey(k) {
    if (!G || G.over || G.locked) return;
    if (k === 'ok') { submit(); return; }
    if (k === 'back') G.input = G.input.slice(0, -1);
    else if (/^[0-9]$/.test(k) && G.input.length < MAX_DIGITS) G.input = (G.input === '0' ? '' : G.input) + k;
    renderAnswer();
  }
  function submit() {
    if (!G || G.locked || G.over) return;
    if (G.input === '') { var a = $('#ans'); a.animate && a.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 220 }); return; }
    var ms = now() - G.qStart, given = parseInt(G.input, 10), q = G.cur, ok = given === q.ans;
    G.locked = true;
    G.log.push({ q: q, given: given, ok: ok, ms: ms });
    if (ok) {
      G.correct++; G.streak++;
      if (G.streak > G.bestStreak) G.bestStreak = G.streak;
      var pts = 10 + 2 * Math.min(G.streak - 1, 5) + (ms <= 3000 ? 5 : 0);
      G.points += pts;
      G.fb = { ok: true, pts: pts, streak: G.streak };
      sfx(G.streak % 5 === 0 ? 'streak' : 'ok');
    } else {
      G.wrong++; G.streak = 0;
      G.fb = { ok: false, q: q };
      sfx('bad');
    }
    if (G.cfg.mode === 'table' && q.phase === 1) G.facts.push({ q: q, ok: ok });
    renderPlay();
    $('#qa').dataset.state = ok ? 'ok' : 'bad';
    later(nextQ, ok ? 350 : 1500);
  }
  function tick() {
    if (!G || G.over || !G.startAt) return;
    var tEl = $('#play-time');
    if (G.cfg.mode === 'sprint') {
      var left = Math.max(0, G.endAt - now());
      tEl.textContent = clock(Math.ceil(left / 1000));
      tEl.classList.toggle('warn', left < 10000);
      $('#play-bar').style.width = (left / (G.cfg.dur * 1000) * 100).toFixed(1) + '%';
      if (left <= 0) finish(true);
    } else {
      tEl.textContent = clock((now() - G.startAt) / 1000);
    }
  }
  function renderAnswer() {
    var a = $('#ans');
    a.textContent = G && G.input ? G.input : '?';
    a.classList.toggle('empty', !(G && G.input));
  }
  function renderPlay() {
    if (!G) return;
    var c = G.cfg;
    $('#play-mode').textContent = modeName(c.mode);
    $('#play-desc').textContent = descr(c);
    var qn = Math.max(1, G.idx);
    $('#play-prog').textContent = G.list ? EDU.fmt(qn) + ' / ' + EDU.fmt(G.list.length) : EDU.fmt(qn);
    $('#prog-pill').title = G.list ? t('q_of', { n: qn, total: G.list.length }) : t('q_n', { n: qn });
    $('#play-points').textContent = EDU.fmt(G.points);
    $('#play-streak').textContent = EDU.fmt(G.streak);
    $('#play-progress').hidden = !(G.list || c.mode === 'sprint');
    if (G.list) $('#play-bar').style.width = (G.log.length / G.list.length * 100).toFixed(1) + '%';
    else if (c.mode === 'sprint' && !G.startAt) $('#play-bar').style.width = '100%';
    if (!G.startAt) $('#play-time').textContent = c.mode === 'sprint' ? clock(c.dur) : '0:00';

    var ph = $('#phase');
    ph.hidden = !(c.mode === 'table' && G.cur);
    if (!ph.hidden) ph.textContent = t(G.cur.phase === 1 ? 'phase_order' : 'phase_mixed');

    var qEl = $('#q');
    qEl.textContent = G.cur ? qText(G.cur) : '…';
    qEl.dir = qDir(G.cur);
    qEl.classList.toggle('long', qEl.textContent.length > 10);
    renderAnswer();

    var fb = $('#fb');
    fb.className = 'mp-fb'; fb.textContent = '';
    if (G.fb && G.fb.ok) {
      fb.classList.add('ok');
      fb.textContent = '✓ ' + t('fb_correct', { n: G.fb.pts }) + (G.fb.streak % 5 === 0 ? ' ' + t('streak_msg', { n: G.fb.streak }) : '');
    } else if (G.fb) {
      fb.classList.add('bad');
      fb.appendChild(document.createTextNode('✗ ' + t('fb_wrong') + ' '));
      fb.appendChild(el('bdi', { dir: qDir(G.fb.q), text: qText(G.fb.q) + ' = ' + G.fb.q.ans }));
    }

    var facts = $('#facts');
    facts.innerHTML = '';
    if (c.mode === 'table' && (!G.cur || G.cur.phase === 1)) {
      G.facts.forEach(function (f) {
        facts.appendChild(el('span', { class: 'mp-num' + (f.ok ? '' : ' bad'), dir: 'ltr', text: qText(f.q) + ' = ' + f.q.ans }));
      });
    }
  }

  function finish(timeUp) {
    if (!G || G.over) return;
    G.over = true; G.locked = true;
    stopTimers();
    $('#count').hidden = true;
    var c = G.cfg, n = G.log.length;
    if (!n) { G = null; show('setup'); return; }
    var res = {
      cfg: c, points: G.points, correct: G.correct, total: n, acc: Math.round(G.correct / n * 100),
      avg: G.log.reduce(function (s, x) { return s + x.ms; }, 0) / n / 1000, streak: G.bestStreak,
      time: (now() - G.startAt) / 1000, timeUp: !!timeUp,
      mistakes: G.log.filter(function (x) { return !x.ok; }), isBest: false, prevBest: null
    };
    if (c.mode !== 'mistakes') {
      var key = bestKey(c), bests = store.get('best', {}) || {};
      var metric = c.mode === 'practice' ? G.bestStreak : G.points;
      res.prevBest = typeof bests[key] === 'number' ? bests[key] : null;
      if (metric > 0 && (res.prevBest === null || metric > res.prevBest)) { bests[key] = metric; store.set('best', bests); res.isBest = true; }
      var hist = store.get('hist', []);
      if (!Array.isArray(hist)) hist = [];
      hist.unshift({ at: Date.now(), mode: c.mode, level: c.level, ops: c.ops, table: c.table, dur: c.dur, points: G.points, correct: G.correct, total: n, acc: res.acc });
      store.set('hist', hist.slice(0, 12));
    }
    LAST = res;
    sfx('end');
    show('summary');
    renderSummary();
  }

  /* ------------------------------------------------------------ summary */
  function renderSummary() {
    var r = LAST; if (!r) return;
    var c = r.cfg;
    $('#sum-emoji').textContent = r.acc >= 90 ? '🏆' : r.acc >= 70 ? '🌟' : r.acc >= 50 ? '👍' : '💪';
    $('#sum-title').textContent = t(r.timeUp ? 'time_up' : 'finished');
    $('#sum-setting').textContent = modeName(c.mode) + ' · ' + descr(c);
    $('#sum-msg').textContent = t(r.acc >= 90 ? 'msg_90' : r.acc >= 70 ? 'msg_70' : r.acc >= 50 ? 'msg_50' : 'msg_low');
    var best = $('#sum-best'); best.innerHTML = '';
    if (r.isBest) best.appendChild(el('span', { class: 'mp-newbest', text: '★ ' + t('new_best') }));
    else if (r.prevBest !== null) best.appendChild(el('p', { class: 'mp-prevbest mb0', text: t(c.mode === 'practice' ? 'best_streak_here' : 'best_here', { n: EDU.fmt(r.prevBest) }) }));

    var stats = $('#sum-stats'); stats.innerHTML = '';
    function stat(id, label, val, main) {
      stats.appendChild(el('div', { class: 'mp-stat' + (main ? ' main' : '') }, el('span', { text: label }), el('b', { class: 'mp-num', id: id, text: val })));
    }
    stat('sum-points', t('points'), EDU.fmt(r.points), true);
    stat('sum-correct', t('stat_correct'), EDU.fmt(r.correct) + ' / ' + EDU.fmt(r.total));
    stat('sum-acc', t('stat_acc'), EDU.fmt(r.acc) + '%');
    stat('sum-avg', t('stat_avg'), secs(r.avg));
    stat('sum-streak', t('stat_streak'), EDU.fmt(r.streak));
    stat('sum-time', t('stat_time'), clock(r.time));

    var tb = $('#sum-mistakes'); tb.innerHTML = '';
    var has = r.mistakes.length > 0;
    $('#sum-nomist').hidden = has;
    $('#sum-mist-wrap').hidden = !has;
    $('#practise-mist').hidden = !has;
    if (has) {
      tb.appendChild(el('thead', null, el('tr', null, el('th', { text: '#' }), el('th', { text: t('col_q') }), el('th', { text: t('col_yours') }), el('th', { text: t('col_right') }))));
      var body = el('tbody');
      r.mistakes.forEach(function (m, i) {
        body.appendChild(el('tr', null,
          el('td', { class: 'mp-num', text: String(i + 1) }),
          el('td', { class: 'q mp-num' }, el('bdi', { dir: qDir(m.q), text: qText(m.q) })),
          el('td', { class: 'y mp-num', text: String(m.given) }),
          el('td', { class: 'r mp-num', text: String(m.q.ans) })));
      });
      tb.appendChild(body);
    }
  }
  function mistakesList(r) {
    var seen = {}, uniq = [];
    r.mistakes.forEach(function (m) { var k = qKey(m.q); if (!seen[k]) { seen[k] = 1; uniq.push({ k: m.q.k, a: m.q.a, b: m.q.b, ans: m.q.ans }); } });
    uniq = uniq.slice(0, 15);
    var first = EDU.shuffle(uniq), second = EDU.shuffle(uniq);
    if (uniq.length > 1 && qKey(second[0]) === qKey(first[first.length - 1])) second.push(second.shift());
    return first.concat(second);                    // every mistake comes back twice
  }
  $('#again').addEventListener('click', function () { if (LAST) startGame(LAST.cfg); });
  $('#practise-mist').addEventListener('click', function () {
    if (!LAST || !LAST.mistakes.length) return;
    var c = LAST.cfg;
    var from = c.mode === 'mistakes' ? c.from : c.mode;
    startGame({ mode: 'mistakes', from: from, level: c.level, ops: from === 'table' ? [] : c.ops, table: c.table, dur: c.dur, list: mistakesList(LAST) });
  });
  $('#to-setup').addEventListener('click', function () { show('setup'); });
  $('#print-sum').addEventListener('click', function () { document.body.classList.remove('mp-print-ws'); try { window.print(); } catch (e) { } });
  $('#end-play').addEventListener('click', function () { if (G && !G.over) finish(false); });

  /* ============================================================ TWO-PLAYER RACE */
  var D = null;
  function pName(i) { return (S.names[i] || '').trim() || t(i ? 'player2' : 'player1'); }
  function startDuel() {
    stopTimers();
    G = null;
    D = { level: S.level, ops: effOps(S.level, S.ops), target: S.target, seq: [], gen: new Gen(S.level, S.ops), over: false, started: false, winner: -1, startAt: 0,
      p: [0, 1].map(function (i) { return { i: i, idx: 0, cur: null, input: '', correct: 0, wrong: 0, ms: 0, fb: null, locked: true }; }) };
    show('duel');
    $('#duel-result').hidden = true;
    $('#duel-grid').hidden = false;
    $('#end-duel').hidden = false;
    buildDuel();
    renderDuel();
    countdown($('#duel-count'), $('#duel-count-n'), function () {
      if (!D || D.over) return;
      D.started = true; D.startAt = now();
      D.p.forEach(duelNext);
    });
  }
  function seqQ(i) { while (D.seq.length <= i) D.seq.push(D.gen.next()); return D.seq[i]; }
  function buildDuel() {
    var grid = $('#duel-grid');
    grid.innerHTML = '';
    grid.classList.toggle('flip', !!S.flip);
    D.p.forEach(function (P) {
      var pad = el('div', { class: 'mp-pad mp-pad6', role: 'group' });
      buildPad(pad, ['1', '2', '3', '4', '5', 'back', '6', '7', '8', '9', '0', 'ok'], function (k) { duelKey(P, k); });
      var box = el('section', { class: 'mp-player', id: 'p' + P.i, 'data-p': String(P.i), 'data-state': 'count', 'data-qid': '0' },
        el('div', { class: 'mp-phead' }, el('span', { class: 'mp-pname' }), el('span', { class: 'mp-pscore mp-num' })),
        el('div', { class: 'mp-track' }, el('span')),
        el('div', { class: 'mp-qline', dir: 'ltr', 'aria-live': 'polite' },
          el('span', { class: 'mp-q' }), el('span', { class: 'mp-eq', 'aria-hidden': 'true', text: '=' }), el('output', { class: 'mp-ans empty', text: '?' })),
        el('div', { class: 'mp-fb', role: 'status' }),
        pad);
      grid.appendChild(box);
    });
  }
  function renderDuel() {
    if (!D) return;
    $('#duel-goal').textContent = t('first_to', { n: D.target });
    D.p.forEach(renderPlayer);
    if (D.over) renderDuelResult();
  }
  function renderPlayer(P) {
    var box = $('#p' + P.i); if (!box || !D) return;
    var name = $('.mp-pname', box);
    name.textContent = pName(P.i);
    name.classList.toggle('no-i18n', !!(S.names[P.i] || '').trim());
    $('.mp-pscore', box).textContent = EDU.fmt(P.correct) + ' / ' + EDU.fmt(D.target);
    $('.mp-track span', box).style.width = Math.min(100, P.correct / D.target * 100) + '%';
    var q = $('.mp-q', box);
    q.textContent = P.cur ? qText(P.cur) : '…';
    q.dir = qDir(P.cur);
    q.classList.toggle('long', q.textContent.length > 10);
    var a = $('.mp-ans', box);
    a.textContent = P.input || '?';
    a.classList.toggle('empty', !P.input);
    var fb = $('.mp-fb', box);
    fb.className = 'mp-fb'; fb.textContent = '';
    if (P.fb && P.fb.ok) { fb.classList.add('ok'); fb.textContent = '✓ ' + t('correct'); }
    else if (P.fb) {
      fb.classList.add('bad');
      fb.appendChild(document.createTextNode('✗ ' + t('fb_wrong') + ' '));
      fb.appendChild(el('bdi', { dir: qDir(P.fb.q), text: qText(P.fb.q) + ' = ' + P.fb.q.ans }));
    }
  }
  function duelNext(P) {
    if (!D || D.over) return;
    P.cur = seqQ(P.idx); P.idx++;
    P.input = ''; P.fb = null; P.locked = false; P.qStart = now();
    renderPlayer(P);
    var box = $('#p' + P.i); box.dataset.state = 'ready'; box.dataset.qid = String(P.idx);
  }
  function duelKey(P, k) {
    if (!D || D.over || !D.started || P.locked) return;
    if (k === 'ok') { duelSubmit(P); return; }
    if (k === 'back') P.input = P.input.slice(0, -1);
    else if (/^[0-9]$/.test(k) && P.input.length < MAX_DIGITS) P.input = (P.input === '0' ? '' : P.input) + k;
    renderPlayer(P);
  }
  function duelSubmit(P) {
    if (P.input === '') return;
    var ok = parseInt(P.input, 10) === P.cur.ans;
    P.locked = true;
    P.ms += now() - P.qStart;
    var box = $('#p' + P.i);
    if (ok) {
      P.correct++; P.fb = { ok: true };
      sfx('ok');
      renderPlayer(P); box.dataset.state = 'ok';
      if (P.correct >= D.target) { duelEnd(P.i); return; }
      later(function () { duelNext(P); }, 300);
    } else {
      P.wrong++; P.fb = { ok: false, q: P.cur };
      sfx('bad');
      renderPlayer(P); box.dataset.state = 'bad';
      later(function () { duelNext(P); }, 1300);
    }
  }
  function duelEnd(winner) {
    if (!D || D.over) return;
    D.over = true; D.winner = winner;
    stopTimers();
    $('#duel-count').hidden = true;
    sfx('end');
    renderDuelResult();
  }
  function renderDuelResult() {
    var res = $('#duel-result');
    res.hidden = false;
    $('#duel-grid').hidden = true;
    $('#end-duel').hidden = true;
    var w = D.winner;
    $('#dres-emoji').textContent = w < 0 ? '🤝' : '🏆';
    var title = $('#dres-title'); title.innerHTML = '';
    if (w < 0) title.textContent = t('tie');
    else {
      var parts = t('wins').split('{name}');
      title.appendChild(document.createTextNode(parts[0] || ''));
      title.appendChild(el('bdi', { class: (S.names[w] || '').trim() ? 'no-i18n' : '', text: pName(w) }));
      title.appendChild(document.createTextNode(parts[1] || ''));
    }
    var tb = $('#dres-table'); tb.innerHTML = '';
    tb.appendChild(el('thead', null, el('tr', null, el('th', { text: t('col_player') }), el('th', { text: t('stat_correct') }), el('th', { text: t('wrong_n') }), el('th', { text: t('stat_acc') }), el('th', { text: t('stat_avg') }))));
    var body = el('tbody');
    D.p.forEach(function (P) {
      var n = P.correct + P.wrong;
      body.appendChild(el('tr', { id: 'dres-row' + P.i },
        el('td', null, el('bdi', { class: (S.names[P.i] || '').trim() ? 'no-i18n' : '', text: (w === P.i ? '🏆 ' : '') + pName(P.i) })),
        el('td', { class: 'mp-num c-ok', text: EDU.fmt(P.correct) }),
        el('td', { class: 'mp-num c-bad', text: EDU.fmt(P.wrong) }),
        el('td', { class: 'mp-num', text: n ? EDU.fmt(Math.round(P.correct / n * 100)) + '%' : '–' }),
        el('td', { class: 'mp-num', text: n ? secs(P.ms / n / 1000) : '–' })));
    });
    tb.appendChild(body);
  }
  $('#end-duel').addEventListener('click', function () {
    if (!D || D.over) return;
    if (!D.started) { stopTimers(); $('#duel-count').hidden = true; D = null; show('setup'); return; }
    var a = D.p[0].correct, b = D.p[1].correct;
    duelEnd(a === b ? -1 : (a > b ? 0 : 1));
  });
  $('#rematch').addEventListener('click', startDuel);
  $('#duel-settings').addEventListener('click', function () { D = null; show('setup'); });

  /* ------------------------------------------------------------ keyboard */
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var tag = (e.target && e.target.tagName) || '';
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
    if (screen === 'play' && G && !G.over) {
      var k = e.key;
      if (/^[0-9]$/.test(k)) playKey(k);
      else if (k === 'Backspace' || k === 'Delete') playKey('back');
      else if (k === 'Enter' || k === '=') playKey('ok');
      else return;
      e.preventDefault();
    } else if (screen === 'duel' && D && D.started && !D.over) {
      var c = e.code || '', m;
      if ((m = /^Digit([0-9])$/.exec(c))) duelKey(D.p[0], m[1]);
      else if ((m = /^Numpad([0-9])$/.exec(c))) duelKey(D.p[1], m[1]);
      else if (c === 'Enter') duelKey(D.p[0], 'ok');
      else if (c === 'NumpadEnter') duelKey(D.p[1], 'ok');
      else if (c === 'Backspace') duelKey(D.p[0], 'back');
      else if (c === 'NumpadDecimal' || c === 'NumpadSubtract' || c === 'Delete') duelKey(D.p[1], 'back');
      else if (!c && /^[0-9]$/.test(e.key)) duelKey(D.p[0], e.key);
      else return;
      e.preventDefault();
    }
  });

  /* ============================================================ SETUP SCREEN */
  (function buildSetup() {
    var tables = $('#tables');
    for (var n = 2; n <= 20; n++) tables.appendChild(el('button', { type: 'button', 'data-table': String(n), text: String(n) }));
    buildPad($('#pad'), ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'back', '0', 'ok'], playKey);
  })();

  function renderSetup() {
    $$('#modes .mp-mode').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === S.mode)); });
    var isTable = S.mode === 'table';
    $('#level-wrap').hidden = isTable;
    $$('#levels .chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.level === S.level)); });
    $('#ops-wrap').hidden = isTable || OP_LEVELS.indexOf(S.level) < 0;
    var eff = effOps(S.level, S.ops);
    $$('#ops .chip').forEach(function (b) {
      var o = b.dataset.op;
      b.hidden = S.level === 'tables' && (o === 'add' || o === 'sub');
      b.setAttribute('aria-pressed', String(eff.indexOf(o) >= 0));
    });
    $('#ops-hint').textContent = t(S.level === 'tables' ? 'ops_hint_tables' : 'ops_hint_mixed');
    $('#table-wrap').hidden = !isTable;
    $$('#tables button').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.table === S.table)); });

    $('#dur-wrap').hidden = S.mode !== 'sprint';
    var durs = $('#durs'); durs.innerHTML = '';
    DURS.forEach(function (d) { durs.appendChild(el('button', { type: 'button', 'data-dur': String(d), 'aria-pressed': String(d === S.dur), text: t('secs', { n: d }) })); });

    $('#duel-wrap').hidden = S.mode !== 'duel';
    var tg = $('#targets'); tg.innerHTML = '';
    TARGETS.forEach(function (n) { tg.appendChild(el('button', { type: 'button', 'data-target': String(n), 'aria-pressed': String(n === S.target), text: t('n_correct', { n: n }) })); });
    [0, 1].forEach(function (i) { var inp = $('#name' + i); if (document.activeElement !== inp) inp.value = S.names[i]; });
    $('#flip').checked = !!S.flip;

    renderSample();
    renderBest();
    renderRecent();
    updateMute();
  }
  function renderSample() {
    var box = $('#sample'); box.innerHTML = '';
    var qs = S.mode === 'table' ? tableList(S.table).slice(0, 3) : uniqueList(S.level, S.ops, 4);
    qs.forEach(function (q) { box.appendChild(el('span', { dir: qDir(q), text: qText(q) + ' = ?' })); });
  }
  function renderBest() {
    var line = $('#best-line');
    if (S.mode === 'duel') { line.textContent = '🤝 ' + t('first_to', { n: S.target }); return; }
    var b = (store.get('best', {}) || {})[bestKey(currentCfg())];
    if (typeof b !== 'number') line.textContent = t('best_none');
    else line.textContent = '🏆 ' + t(S.mode === 'practice' ? 'best_streak_here' : 'best_here', { n: EDU.fmt(b) });
  }
  function renderRecent() {
    var hist = store.get('hist', []);
    if (!Array.isArray(hist)) hist = [];
    $('#recent-none').hidden = hist.length > 0;
    $('#recent-wrap').hidden = !hist.length;
    var tb = $('#recent'); tb.innerHTML = '';
    if (!hist.length) return;
    tb.appendChild(el('thead', null, el('tr', null, el('th', { text: t('col_game') }), el('th', { text: t('points') }), el('th', { text: t('col_acc') }))));
    var body = el('tbody');
    hist.forEach(function (h) {
      if (!h || MODES.concat(['mistakes']).indexOf(h.mode) < 0) return;
      body.appendChild(el('tr', null,
        el('td', null, el('b', { text: modeName(h.mode) }), el('small', { text: descr(h) }), el('small', { class: 'when mp-num', text: fmtDate(h.at) })),
        el('td', { class: 'mp-num' }, el('b', { text: EDU.fmt(h.points || 0) })),
        el('td', { class: 'mp-num' }, el('b', { text: EDU.fmt(h.acc || 0) + '%' }), el('small', { text: EDU.fmt(h.correct || 0) + ' / ' + EDU.fmt(h.total || 0) }))));
    });
    tb.appendChild(body);
  }

  $('#modes').addEventListener('click', function (e) {
    var b = e.target.closest('.mp-mode'); if (!b) return;
    S.mode = b.dataset.mode; saveSettings(); renderSetup();
  });
  $('#levels').addEventListener('click', function (e) {
    var b = e.target.closest('[data-level]'); if (!b) return;
    S.level = b.dataset.level; saveSettings(); renderSetup();
  });
  $('#ops').addEventListener('click', function (e) {
    var b = e.target.closest('[data-op]'); if (!b) return;
    var o = b.dataset.op, cur = effOps(S.level, S.ops), i = cur.indexOf(o);
    if (i >= 0) {
      if (cur.length === 1) { EDU.toast(t('ops_need_one')); return; }
      cur.splice(i, 1);
    } else cur.push(o);
    if (S.level === 'tables') S.ops = S.ops.filter(function (x) { return x === 'add' || x === 'sub'; }).concat(cur);
    else S.ops = cur;
    S.ops = OPS.filter(function (x) { return S.ops.indexOf(x) >= 0; });
    saveSettings(); renderSetup();
  });
  $('#tables').addEventListener('click', function (e) {
    var b = e.target.closest('[data-table]'); if (!b) return;
    S.table = +b.dataset.table; saveSettings(); renderSetup();
  });
  $('#durs').addEventListener('click', function (e) {
    var b = e.target.closest('[data-dur]'); if (!b) return;
    S.dur = +b.dataset.dur; saveSettings(); renderSetup();
  });
  $('#targets').addEventListener('click', function (e) {
    var b = e.target.closest('[data-target]'); if (!b) return;
    S.target = +b.dataset.target; saveSettings(); renderSetup();
  });
  [0, 1].forEach(function (i) {
    $('#name' + i).addEventListener('input', function () { S.names[i] = this.value.slice(0, 20); saveSettings(); });
  });
  $('#flip').addEventListener('change', function () { S.flip = this.checked; saveSettings(); });
  $('#start').addEventListener('click', function () {
    audio();                                           // unlock sound on a user gesture (iPhone / Android)
    if (S.mode === 'duel') startDuel(); else startGame(currentCfg());
  });
  $('#reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    store.remove('best'); store.remove('hist'); store.remove('settings');
    S = cleanSettings(null);
    renderSetup();
  });

  /* ------------------------------------------------------------ worksheet */
  function printWorksheet() {
    var cfg = currentCfg();
    var qs = S.mode === 'table' ? tableList(S.table) : uniqueList(S.level, S.ops, 40);
    var sub = S.mode === 'table' ? t('table_of', { n: S.table }) : descr({ mode: 'practice', level: cfg.level, ops: cfg.ops });
    var ws = $('#ws'); ws.innerHTML = '';
    ws.appendChild(el('h1', { text: t('ws_title') }));
    ws.appendChild(el('p', { class: 'mp-ws-sub', text: t('app_title') + ' · ' + sub }));
    ws.appendChild(el('div', { class: 'mp-ws-meta' },
      el('span', { text: t('ws_name') + ': ______________________' }),
      el('span', { text: t('ws_class') + ': ________' }),
      el('span', { text: t('ws_date') + ': ____________' }),
      el('span', { text: t('ws_time') + ': ________' }),
      el('span', { text: t('score') + ': ______ / ' + qs.length })));
    var grid = el('ol', { class: 'mp-ws-grid' });
    qs.forEach(function (q, i) {
      grid.appendChild(el('li', { class: 'mp-ws-q' }, el('span', { class: 'n', text: (i + 1) + '.' }), el('bdi', { dir: qDir(q), text: qText(q) + ' =' }), el('span', { class: 'line' })));
    });
    ws.appendChild(grid);
    var key = el('ol', null);
    qs.forEach(function (q) { key.appendChild(el('li', { text: String(q.ans) })); });
    ws.appendChild(el('section', { class: 'mp-ws-key' }, el('h2', { text: t('answer_key') + ' · ' + sub }), key));
    ws.appendChild(el('p', { class: 'mp-ws-foot', text: t('brand') + ' · ' + t('app_title') }));
    document.body.classList.add('mp-print-ws');
    try { window.print(); } catch (e) { }
  }
  window.addEventListener('afterprint', function () { document.body.classList.remove('mp-print-ws'); });
  $('#print-ws').addEventListener('click', printWorksheet);

  /* ------------------------------------------------------------ language changes */
  EDU.onLang(function () {
    updateMute();
    if (screen === 'setup') renderSetup();
    if (screen === 'play') renderPlay();
    if (screen === 'duel') renderDuel();
    if (screen === 'summary') renderSummary();
  });

  show('setup');
})();
