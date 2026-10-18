/* Carrom: UI, drawing, input, animation, computer turns, saving. Physics in physics.js, rules in rules.js. */
(function () {
  'use strict';
  var SLUG = 'carrom';
  var P = window.CRPHYS, R = window.CRRULES, B = P.B;
  var store = EDU.store(SLUG);
  var $ = EDU.$;
  var FR = 6.5, TOTAL = 74 + 2 * FR;       /* frame width and full board size, cm */
  var MAX_PULL = 15;                        /* cm of pull-back for full power */

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'wa_game' });

  /* ------------------------------------------------------------------ settings + match */
  var LEVELS = ['easy', 'medium', 'hard'];
  function loadSettings() {
    var s = store.get('settings', null) || {};
    return {
      mode: R.MODES.indexOf(s.mode) >= 0 ? s.mode : 'pvp', level: LEVELS.indexOf(s.level) >= 0 ? s.level : 'medium',
      match: R.MATCH[s.match] ? s.match : 'short', queenFirst: s.queenFirst !== false,
      names: Array.isArray(s.names) ? [String(s.names[0] || '').slice(0, 20), String(s.names[1] || '').slice(0, 20)] : ['', ''],
      guide: s.guide !== false, paths: !!s.paths, sound: !!s.sound
    };
  }
  var SET = loadSettings();
  function saveSettings() { store.set('settings', SET); }

  function validMatch(m) {
    try {
      if (!m || m.v !== 1 || R.MODES.indexOf(m.mode) < 0 || !m.board || !Array.isArray(m.board.pieces) || m.board.pieces.length !== 20) return false;
      if (!R.MATCH[m.opts && m.opts.match]) return false;
      var ok = m.board.pieces.every(function (p) {
        return p && typeof p.id === 'string' && 'wbqs'.indexOf(p.k) >= 0 && isFinite(p.x) && isFinite(p.y) && Math.abs(p.x) < 40 && Math.abs(p.y) < 40;
      });
      if (!ok || !Array.isArray(m.scores) || m.scores.length !== 2) return false;
      m.board.pieces.forEach(function (p) { p.vx = 0; p.vy = 0; p.r = p.k === 's' ? B.SR : B.CR; p.m = p.k === 's' ? B.SM : B.CM; });
      return true;
    } catch (e) { return false; }
  }
  var M = store.get('match', null);
  if (!validMatch(M)) M = R.newMatch(SET.mode, SET);
  function saveMatch() { store.set('match', M); }
  var best = store.get('best', null);

  /* ------------------------------------------------------------------ names + colours */
  function isCpu(i) { return M.mode === 'cpu' && i === 1; }
  function nameOf(i) {
    if (isCpu(i)) return EDU.t('computer');
    var n = (M.names || SET.names)[i];
    return n && n.trim() ? n.trim() : EDU.t(M.mode === 'practice' ? 'you' : (i === 0 ? 'player1' : 'player2'));
  }
  function colWord(k) { return EDU.t(k === 'w' ? 'c_white' : k === 'b' ? 'c_black' : 'c_queen'); }

  /* ------------------------------------------------------------------ canvas */
  var cv = $('#cv'), ctx = cv.getContext('2d'), bg = document.createElement('canvas');
  var S = 360, DPR = 1, KS = S / TOTAL;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function X(x) { return S / 2 + x * KS; }
  function toBoard(px, py) { return { x: (px - S / 2) / KS, y: (py - S / 2) / KS }; }

  function size() {
    var box = $('#stage'), w = box.clientWidth || 360;
    var fsOn = document.fullscreenElement === $('#play') || document.webkitFullscreenElement === $('#play');
    var hMax = fsOn ? window.innerHeight - 260 : Math.max(320, (window.innerHeight || 800) - 40);
    S = Math.max(240, Math.floor(Math.min(w, 660, hMax)));
    DPR = Math.min(window.devicePixelRatio || 1, 2.5);
    cv.width = Math.round(S * DPR); cv.height = Math.round(S * DPR);
    cv.style.width = S + 'px'; cv.style.height = S + 'px';
    cv.style.marginInline = 'auto';
    KS = S / TOTAL;
    drawBg();
  }

  function drawBg() {
    bg.width = cv.width; bg.height = cv.height;
    var g = bg.getContext('2d'), dark = EDU.theme() === 'dark';
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    var k = KS, c = S / 2, half = B.HALF * k;
    /* frame */
    var fr = g.createLinearGradient(0, 0, S, S);
    fr.addColorStop(0, dark ? '#4a2a14' : '#6b3d1e'); fr.addColorStop(0.5, dark ? '#5c3519' : '#83502a'); fr.addColorStop(1, dark ? '#3d2210' : '#5a3218');
    g.fillStyle = fr; roundRect(g, 0, 0, S, S, Math.max(8, 2.2 * k)); g.fill();
    /* playing surface */
    var sf = g.createRadialGradient(c, c, half * 0.2, c, c, half * 1.45);
    sf.addColorStop(0, dark ? '#e2c995' : '#f6e3b8'); sf.addColorStop(1, dark ? '#c9ab72' : '#e8cc93');
    g.fillStyle = sf; g.fillRect(c - half, c - half, 2 * half, 2 * half);
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = Math.max(1, 0.25 * k); g.strokeRect(c - half, c - half, 2 * half, 2 * half);
    var ink = '#1d1d1d', red = '#c62828', lw = Math.max(1, 0.4 * k), thin = Math.max(0.8, 0.15 * k);
    /* base lines + base circles, on all four sides (rotate by 90°) */
    for (var r = 0; r < 4; r++) {
      g.save(); g.translate(c, c); g.rotate(r * Math.PI / 2);
      var y1 = (B.HALF - B.BASE_OUT) * k, y2 = (B.HALF - B.BASE_OUT - B.BASE_GAP) * k, xb = B.BASE_X * k;
      g.strokeStyle = ink; g.lineWidth = lw;
      g.beginPath(); g.moveTo(-xb, y1); g.lineTo(xb, y1); g.moveTo(-xb, y2); g.lineTo(xb, y2); g.stroke();
      [-1, 1].forEach(function (sx) {
        g.beginPath(); g.arc(sx * xb, (y1 + y2) / 2, B.CIRCLE_R * k, 0, Math.PI * 2); g.fillStyle = sf; g.fill();
        g.lineWidth = thin; g.stroke();
        g.beginPath(); g.arc(sx * xb, (y1 + y2) / 2, 1.27 * k, 0, Math.PI * 2); g.fillStyle = red; g.fill();
      });
      /* arrow on the diagonal: from 15.25 cm to 41.95 cm out, head pointing to the centre, arch near the pocket */
      g.rotate(Math.PI / 4);
      var a0 = B.ARROW_IN * k, a1 = B.ARROW_OUT * k;
      g.strokeStyle = ink; g.lineWidth = thin * 1.3;
      g.beginPath(); g.moveTo(0, a0); g.lineTo(0, a1); g.stroke();
      g.beginPath(); g.moveTo(-0.9 * k, a0 + 1.4 * k); g.lineTo(0, a0); g.lineTo(0.9 * k, a0 + 1.4 * k); g.stroke();
      g.beginPath(); g.arc(0, a1 - 3.175 * k, 3.175 * k, Math.PI * 0.15, Math.PI * 0.85, true); g.stroke();
      g.restore();
    }
    /* centre: outer circle 17 cm, centre circle 3.18 cm (red) */
    g.strokeStyle = ink; g.lineWidth = lw;
    g.beginPath(); g.arc(c, c, B.OUTER_R * k, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(c, c, B.CIRCLE_R * k, 0, Math.PI * 2); g.fillStyle = red; g.fill(); g.lineWidth = thin; g.stroke();
    /* pockets */
    P.POCKETS.forEach(function (pk) {
      g.beginPath(); g.arc(X(pk[0]), X(pk[1]), B.PR * k, 0, Math.PI * 2);
      var pg = g.createRadialGradient(X(pk[0]), X(pk[1]), 0, X(pk[0]), X(pk[1]), B.PR * k);
      pg.addColorStop(0, '#000'); pg.addColorStop(1, '#2a2a2a');
      g.fillStyle = pg; g.fill(); g.strokeStyle = '#7a5a2e'; g.lineWidth = Math.max(1, 0.3 * k); g.stroke();
    });
  }
  function roundRect(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r);
    g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
    g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
  }

  var COIN = {
    w: ['#fffaf0', '#e9dcc0', '#b9a37a'], b: ['#4a4a4a', '#1e1e1e', '#000'], q: ['#ff6b6b', '#c62828', '#7f1414'], s: ['#ffffff', '#dfe7f2', '#2f5e9e']
  };
  function coin(p, alpha) {
    var x = X(p.x), y = X(p.y), r = p.r * KS, c = COIN[p.k];
    ctx.save(); if (alpha !== undefined) ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.arc(x + r * 0.12, y + r * 0.16, r, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fill();
    var gr = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    gr.addColorStop(0, c[0]); gr.addColorStop(1, c[1]);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = gr; ctx.fill();
    ctx.lineWidth = Math.max(1, r * 0.1); ctx.strokeStyle = c[2]; ctx.stroke();
    ctx.lineWidth = Math.max(0.7, r * 0.07); ctx.globalAlpha = (alpha === undefined ? 1 : alpha) * 0.6;
    ctx.beginPath(); ctx.arc(x, y, r * 0.62, 0, Math.PI * 2); ctx.stroke();
    if (p.k === 's') {
      ctx.globalAlpha = (alpha === undefined ? 1 : alpha);
      ctx.beginPath(); ctx.arc(x, y, r * 0.3, 0, Math.PI * 2); ctx.fillStyle = c[2]; ctx.fill();
      for (var i = 0; i < 8; i++) {
        var a = i * Math.PI / 4;
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, r * 0.07, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  /* first thing the striker would touch along the aim line: a piece or a cushion (straight-line guide) */
  function rayCast(s, dx, dy) {
    var best = { t: Infinity }, WL = B.HALF - s.r;
    M.board.pieces.forEach(function (p) {
      if (!p.on || p === s) return;
      var fx = s.x - p.x, fy = s.y - p.y, rr = s.r + p.r, bq = fx * dx + fy * dy, cq = fx * fx + fy * fy - rr * rr, disc = bq * bq - cq;
      if (disc < 0) return;
      var t = -bq - Math.sqrt(disc);
      if (t > 0.01 && t < best.t) best = { t: t, p: p };
    });
    [[dx < 0 ? -WL : WL, 'x'], [dy < 0 ? -WL : WL, 'y']].forEach(function (w) {
      var d = w[1] === 'x' ? dx : dy, o = w[1] === 'x' ? s.x : s.y;
      if (Math.abs(d) < 1e-9) return;
      var t = (w[0] - o) / d;
      if (t > 0.01 && t < best.t) best = { t: t, wall: w[1] };
    });
    return best;
  }

  var effects = [], trails = null;
  function draw(now) {
    now = now || performance.now();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(bg, 0, 0);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var b = M.board, s = R.striker(b);
    if (trails && SET.paths) {
      Object.keys(trails).forEach(function (id) {
        var tr = trails[id]; if (tr.pts.length < 2) return;
        ctx.strokeStyle = tr.k === 's' ? 'rgba(47,94,158,.75)' : tr.k === 'q' ? 'rgba(198,40,40,.75)' : tr.k === 'b' ? 'rgba(0,0,0,.6)' : 'rgba(120,90,40,.75)';
        ctx.lineWidth = Math.max(1, 0.35 * KS); ctx.setLineDash(tr.k === 's' ? [5, 4] : []);
        ctx.beginPath(); ctx.moveTo(X(tr.pts[0][0]), X(tr.pts[0][1]));
        for (var i = 1; i < tr.pts.length; i++) ctx.lineTo(X(tr.pts[i][0]), X(tr.pts[i][1]));
        ctx.stroke(); ctx.setLineDash([]);
      });
    }
    b.pieces.forEach(function (p) { if (p.on && p.k !== 's') coin(p); });
    var aiming = phase === 'aim' && !b.over && s.on;
    if (aiming || phase === 'cpu') {
      /* glow on the striker of the player to move */
      ctx.beginPath(); ctx.arc(X(s.x), X(s.y), s.r * KS * 1.55, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,170,40,.28)'; ctx.fill();
    }
    if (s.on) coin(s);
    if ((aiming || phase === 'cpu') && s.on) drawAim(s);
    /* pocket rings */
    effects = effects.filter(function (e) { return now - e.t0 < 500; });
    effects.forEach(function (e) {
      var f = (now - e.t0) / 500;
      ctx.beginPath(); ctx.arc(X(e.x), X(e.y), (B.PR + f * 4) * KS, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,200,60,' + (1 - f).toFixed(2) + ')'; ctx.lineWidth = 3; ctx.stroke();
    });
  }
  function drawAim(s) {
    var side = R.sideOf(M.board.turn), d = P.dir(side, aim.angle), pw = aim.power;
    var x0 = X(s.x), y0 = X(s.y);
    if (SET.guide) {
      var hit = rayCast(s, d.x, d.y), t = Math.min(hit.t, 80);
      var hx = s.x + d.x * t, hy = s.y + d.y * t;
      ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = 'rgba(20,20,20,.75)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(X(hx), X(hy)); ctx.stroke(); ctx.setLineDash([]);
      if (hit.p) {
        ctx.beginPath(); ctx.arc(X(hx), X(hy), s.r * KS, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(47,94,158,.85)'; ctx.lineWidth = 1.4; ctx.stroke();
        var nx = hit.p.x - hx, ny = hit.p.y - hy, nl = Math.sqrt(nx * nx + ny * ny) || 1;
        ctx.strokeStyle = 'rgba(198,40,40,.9)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(X(hit.p.x), X(hit.p.y)); ctx.lineTo(X(hit.p.x + nx / nl * 9), X(hit.p.y + ny / nl * 9)); ctx.stroke();
      } else if (hit.wall) {
        var rx = hit.wall === 'x' ? -d.x : d.x, ry = hit.wall === 'y' ? -d.y : d.y;
        ctx.setLineDash([3, 4]); ctx.strokeStyle = 'rgba(20,20,20,.5)';
        ctx.beginPath(); ctx.moveTo(X(hx), X(hy)); ctx.lineTo(X(hx + rx * 12), X(hy + ry * 12)); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.restore();
    }
    /* power arrow behind the striker (slingshot) */
    if (pw > 0.01) {
      var L = s.r * KS + pw * MAX_PULL * KS;
      ctx.strokeStyle = pw > 0.8 ? '#d9480f' : pw > 0.5 ? '#e8a400' : '#2b8a3e'; ctx.lineWidth = Math.max(3, 0.7 * KS); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0 - d.x * s.r * KS, y0 - d.y * s.r * KS); ctx.lineTo(x0 - d.x * L, y0 - d.y * L); ctx.stroke(); ctx.lineCap = 'butt';
    }
  }

  /* ------------------------------------------------------------------ sound (Web Audio click, off by default) */
  var actx = null;
  function sound(kind, vol) {
    if (!SET.sound) return;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      var t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
      o.type = kind === 'pocket' ? 'sine' : 'triangle';
      o.frequency.setValueAtTime(kind === 'pocket' ? 220 : kind === 'wall' ? 380 : 1400, t);
      if (kind === 'pocket') o.frequency.exponentialRampToValueAtTime(90, t + 0.18);
      g.gain.setValueAtTime(Math.min(0.35, 0.05 + vol * 0.3), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (kind === 'pocket' ? 0.22 : 0.06));
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + 0.25);
    } catch (e) { }
  }

  /* ------------------------------------------------------------------ aiming state */
  var phase = 'aim';             /* aim | moving | cpu | over */
  var aim = { angle: 0, power: 0.6 };
  var lastEvents = null;
  function striker() { return R.striker(M.board); }
  function humanTurn() { return phase === 'aim' && !M.board.over && !isCpu(M.board.turn); }

  function syncControls() {
    var s = striker();
    $('#pos').value = Math.round(s.x / B.BASE_X * 100);
    $('#pos-out').textContent = EDU.fmt(Math.round(s.x / B.BASE_X * 100));
    $('#angle').value = aim.angle;
    $('#angle-out').textContent = EDU.fmt(aim.angle, { maximumFractionDigits: 1 }) + '°';
    $('#power').value = Math.round(aim.power * 100);
    $('#power-out').textContent = EDU.fmt(Math.round(aim.power * 100)) + '%';
    $('#meter').style.width = Math.round(aim.power * 100) + '%';
    var dis = !humanTurn();
    ['#pos', '#angle', '#power', '#strike'].forEach(function (id) { $(id).disabled = dis; });
    cv.setAttribute('data-phase', M.board.over ? 'over' : phase);
    cv.setAttribute('data-turn', String(M.board.turn));
  }
  function moveStriker(x) {
    var b = M.board, side = R.sideOf(b.turn), fx = P.fitStriker(b.pieces, side, x);
    if (fx === null) return;
    var s = striker(); s.x = fx; b.strikerX[b.turn] = fx;
  }
  function setAngle(a) { aim.angle = Math.round(EDU.clamp(a, -88, 88) * 2) / 2; }
  function setPower(p) { aim.power = EDU.clamp(p, 0, 1); }

  $('#pos').addEventListener('input', function () { if (!humanTurn()) return; moveStriker(Number(this.value) / 100 * B.BASE_X); syncControls(); draw(); });
  $('#angle').addEventListener('input', function () { if (!humanTurn()) return; setAngle(Number(this.value)); syncControls(); draw(); });
  $('#power').addEventListener('input', function () { if (!humanTurn()) return; setPower(Number(this.value) / 100); syncControls(); draw(); });
  $('#strike').addEventListener('click', function () { if (humanTurn()) strike(); });

  /* pointer: drag the striker along the base line, pull back from it like a slingshot, or tap the board to aim */
  var drag = null;
  function evPos(e) { var r = cv.getBoundingClientRect(); return toBoard((e.clientX - r.left) * S / r.width, (e.clientY - r.top) * S / r.height); }
  cv.addEventListener('pointerdown', function (e) {
    if (!humanTurn()) return;
    var p = evPos(e), s = striker(), dx = p.x - s.x, dy = p.y - s.y;
    try { cv.setPointerCapture(e.pointerId); } catch (er) { }
    if (Math.sqrt(dx * dx + dy * dy) < s.r * 2.3) drag = { mode: 'grab', x0: p.x, y0: p.y, sx: s.x };
    else { drag = { mode: 'point' }; pointAt(p); }
    e.preventDefault();
  });
  cv.addEventListener('pointermove', function (e) {
    if (!drag || !humanTurn()) return;
    var p = evPos(e), s = striker(), side = R.sideOf(M.board.turn);
    if (drag.mode === 'point') { pointAt(p); return; }
    var mx = p.x - drag.x0, my = p.y - drag.y0;
    if (drag.mode === 'grab' && Math.sqrt(mx * mx + my * my) > 1.2) drag.mode = Math.abs(my) < Math.abs(mx) * 0.7 ? 'slide' : 'pull';
    if (drag.mode === 'slide') {
      if (Math.abs(p.y - side * B.BASE_Y) > 4.5) drag.mode = 'pull';
      else { moveStriker(drag.sx + mx); syncControls(); draw(); return; }
    }
    if (drag.mode === 'pull') {
      var vx = s.x - p.x, vy = s.y - p.y, L = Math.sqrt(vx * vx + vy * vy);
      if (L > 0.5) setAngle(P.angleOf(side, vx, vy));
      setPower(L < 1.5 ? 0 : Math.min(1, (L - 1.5) / MAX_PULL));
      syncControls(); draw();
    }
  });
  function endDrag(e, cancel) {
    if (!drag) return;
    var m = drag.mode; drag = null;
    if (!cancel && m === 'pull' && humanTurn() && aim.power >= 0.04) strike();
  }
  cv.addEventListener('pointerup', function (e) { endDrag(e, false); });
  cv.addEventListener('pointercancel', function (e) { endDrag(e, true); });
  function pointAt(p) {
    var s = striker(), side = R.sideOf(M.board.turn), vx = p.x - s.x, vy = p.y - s.y;
    if (vx * vx + vy * vy < 0.5) return;
    setAngle(P.angleOf(side, vx, vy)); syncControls(); draw();
  }
  cv.addEventListener('keydown', function (e) {
    if (!humanTurn()) return;
    var big = e.shiftKey ? 5 : 1, s = striker(), used = true;
    if (e.key === 'ArrowLeft') moveStriker(s.x - 0.5 * big);
    else if (e.key === 'ArrowRight') moveStriker(s.x + 0.5 * big);
    else if (e.key === 'ArrowUp') setAngle(aim.angle + big);
    else if (e.key === 'ArrowDown') setAngle(aim.angle - big);
    else if (e.key === '+' || e.key === '=' || e.key === 'PageUp') setPower(aim.power + 0.05);
    else if (e.key === '-' || e.key === '_' || e.key === 'PageDown') setPower(aim.power - 0.05);
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); strike(); return; }
    else used = false;
    if (used) { e.preventDefault(); syncControls(); draw(); }
  });

  /* ------------------------------------------------------------------ shooting + animation */
  var W = null, raf = 0, acc = 0, lastT = 0, evSeen = 0;
  function startShot(angle, power) {
    var b = M.board, side = R.sideOf(b.turn), d = P.dir(side, angle);
    W = P.world(b.pieces);
    P.fire(W, d.x, d.y, power);
    evSeen = 0;
    trails = {};
    b.pieces.forEach(function (p) { if (p.on) trails[p.id] = { k: p.k, pts: [[p.x, p.y]] }; });
    phase = 'moving';
    syncControls();
  }
  function strike() {
    if (!humanTurn() || aim.power < 0.01) return;
    startShot(aim.angle, aim.power);
    $('#msg').textContent = ''; $('#msg').className = 'cr-msg';
    acc = 0; lastT = performance.now();
    loop();
  }
  function stepOnce() {
    var moving = P.step(W);
    if (trails && W.steps % 2 === 0) M.board.pieces.forEach(function (p) {
      var tr = trails[p.id]; if (!tr || !p.on) return;
      var l = tr.pts[tr.pts.length - 1];
      if (Math.abs(l[0] - p.x) + Math.abs(l[1] - p.y) > 0.3) tr.pts.push([p.x, p.y]);
    });
    for (; evSeen < W.ev.length; evSeen++) {
      var e = W.ev[evSeen];
      if (e.type === 'pocket') { if (!reduce) effects.push({ x: P.POCKETS[e.pocket][0], y: P.POCKETS[e.pocket][1], t0: performance.now() }); sound('pocket', 0.6); if (trails && trails[e.id]) trails[e.id].pts.push([e.x === undefined ? P.POCKETS[e.pocket][0] : P.POCKETS[e.pocket][0], P.POCKETS[e.pocket][1]]); }
      else if (e.type === 'hit') sound('hit', Math.min(1, e.vn / 300));
      else if (e.type === 'wall' && e.vn > 20) sound('wall', Math.min(1, e.vn / 400));
    }
    return moving;
  }
  function loop() {
    if (raf) return;
    raf = requestAnimationFrame(function frame(now) {
      raf = 0;
      if (phase === 'moving' && W) {
        acc += Math.min(0.1, (now - lastT) / 1000); lastT = now;
        var n = 0, moving = true;
        while (acc >= P.K.DT && n < 8) { moving = stepOnce(); acc -= P.K.DT; n++; if (!moving) break; }
        if (!moving) { draw(now); settle(); return; }
      }
      draw(now);
      if (phase === 'moving' || effects.length || cpuAnim) raf = requestAnimationFrame(frame);
    });
  }
  /* everything at rest: apply the rules */
  function settle() {
    lastEvents = W.ev.slice();
    var who = M.board.turn, res = R.resolve(M, W.ev);
    W = null;
    phase = 'aim';
    aim.power = Math.min(aim.power, 1);
    showResult(res, who);
    saveMatch();
    renderAll();
    if (effects.length) loop();
    maybeCpu();
  }

  /* ------------------------------------------------------------------ messages */
  function showResult(res, who) {
    var b = M.board, parts = [], good = false, bad = false, nm = nameOf(who);
    res.msgs.forEach(function (m) {
      var k = m[0], v = m[1] || {};
      switch (k) {
        case 'own_coin': parts.push(EDU.t('m_own', { name: nm })); good = true; break;
        case 'opp_coin': parts.push(EDU.t('m_opp')); bad = true; break;
        case 'foul_striker': parts.push(EDU.t('m_foul')); bad = true; break;
        case 'foul_striker_p': parts.push(EDU.t('m_foul_p')); bad = true; break;
        case 'coin_back': parts.push(EDU.t(v.k === 'w' ? 'm_back_w' : v.k === 'b' ? 'm_back_b' : 'm_back_q')); break;
        case 'queen_cover_next': parts.push(EDU.t('m_queen_next')); good = true; break;
        case 'queen_covered': parts.push(EDU.t('m_queen_cov')); good = true; break;
        case 'queen_not_covered': parts.push(EDU.t('m_queen_not')); bad = true; break;
        case 'queen_early': parts.push(EDU.t('m_queen_early')); break;
        case 'queen_back_foul': parts.push(EDU.t('m_queen_foul')); break;
        case 'last_needs_queen': parts.push(EDU.t(v.k === 'w' ? 'm_last_w' : 'm_last_b')); break;
        case 'break_again': parts.push(EDU.t('m_break_again', { n: EDU.fmt(v.n) })); break;
        case 'break_pass': parts.push(EDU.t('m_break_pass')); break;
        case 'p_in': parts.push(EDU.t('m_p_in', { n: EDU.fmt(v.n) })); good = true; break;
        case 'p_queen': break;
      }
    });
    if (!parts.length) parts.push(EDU.t(M.mode === 'practice' ? 'm_p_none' : 'm_none'));
    var el = $('#msg');
    el.textContent = parts.join(' ');
    el.className = 'cr-msg' + (bad ? ' bad' : good ? ' good' : '');
    el.setAttribute('data-keys', res.msgs.map(function (m) { return m[0]; }).join(','));
    M.lastMsg = { text: res.msgs, who: who, good: good, bad: bad };
  }
  function restoreMsg() {
    var lm = M.lastMsg;
    if (!lm || !lm.text) { $('#msg').textContent = ''; return; }
    showResult({ msgs: lm.text }, lm.who);
  }

  /* ------------------------------------------------------------------ computer turn (thinks in small time slices) */
  var cpuTimer = 0, cpuAnim = null, rnd = Math.random;
  function maybeCpu() {
    if (!(M.mode === 'cpu' && M.board.turn === 1 && !M.board.over && phase === 'aim')) return;
    phase = 'cpu'; syncControls(); renderStatus();
    $('#thinking').hidden = false;
    M.opts.level = M.opts.level || SET.level;
    var plan = R.aiPlan(M);
    clearTimeout(cpuTimer);
    cpuTimer = setTimeout(function slice() {
      var t0 = performance.now(), more = true;
      while (more && performance.now() - t0 < 12) more = R.aiStep(M, plan);
      if (more) { cpuTimer = setTimeout(slice, 0); return; }
      var pick = R.aiPick(M, plan, rnd);
      $('#thinking').hidden = true;
      animateCpu(pick);
    }, reduce ? 0 : 350);
  }
  function animateCpu(pick) {
    var s = striker(), x0 = s.x, a0 = aim.angle, p0 = aim.power, T = reduce ? 0 : 900, t0 = performance.now();
    var side = R.sideOf(M.board.turn), fx = P.fitStriker(M.board.pieces, side, pick.x);
    var x1 = fx === null ? x0 : fx;
    cpuAnim = function (now) {
      var f = T ? Math.min(1, (now - t0) / T) : 1, e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
      s.x = x0 + (x1 - x0) * e; aim.angle = a0 + (pick.ang - a0) * e; aim.power = p0 + (pick.power - p0) * e;
      if (f >= 1) {
        cpuAnim = null; s.x = x1; M.board.strikerX[1] = x1; aim.angle = pick.ang; aim.power = pick.power;
        if (phase !== 'cpu') return;
        startShot(pick.ang, pick.power); acc = 0; lastT = performance.now();
      }
    };
    (function tickCpu() {
      if (!cpuAnim) { loop(); return; }
      cpuAnim(performance.now()); draw(); syncControls();
      if (cpuAnim) requestAnimationFrame(tickCpu); else loop();
    })();
  }
  function stopCpu() { clearTimeout(cpuTimer); cpuAnim = null; $('#thinking').hidden = true; if (phase === 'cpu') phase = 'aim'; }

  /* ------------------------------------------------------------------ rendering */
  function renderStatus() {
    var b = M.board, st = $('#status'), turn = b.turn;
    if (M.over) st.textContent = matchOverText();
    else if (b.over) st.textContent = EDU.t('st_board_over', { b: EDU.fmt(M.boardNo) });
    else if (M.mode === 'practice') st.textContent = EDU.t('st_practice', { n: EDU.fmt(b.shots) });
    else {
      var c = b.colors[turn];
      st.textContent = EDU.t(c === 'w' ? 'st_turn_w' : 'st_turn_b', { name: nameOf(turn) }) +
        (b.queen.st === 'pending' && b.queen.by === c ? ' ' + EDU.t('st_cover') : '') + (!b.breakDone ? ' ' + EDU.t('st_break') : '');
    }
    st.setAttribute('data-turn', String(turn));
  }
  function matchOverText() {
    if (M.mode === 'practice') return EDU.t('p_done', { n: EDU.fmt(M.board.shots) });
    if (M.winner === -1) return EDU.t('match_draw', { a: EDU.fmt(M.scores[0]), b: EDU.fmt(M.scores[1]) });
    return EDU.t('match_won', { name: nameOf(M.winner), a: EDU.fmt(Math.max(M.scores[0], M.scores[1])), b: EDU.fmt(Math.min(M.scores[0], M.scores[1])) });
  }
  function renderScore() {
    var b = M.board, practice = M.mode === 'practice';
    $('#pl1').hidden = practice;
    $('#scorebar').style.gridTemplateColumns = practice ? 'minmax(0, 1fr)' : '';
    [0, 1].forEach(function (i) {
      var c = b.colors[i];
      $('#nm' + i).textContent = nameOf(i);
      $('#dot' + i).className = 'cr-dot ' + (practice ? 'n' : c);
      $('#pl' + i).classList.toggle('turn', !b.over && b.turn === i && !practice);
      if (practice) {
        $('#pts0').textContent = EDU.fmt(b.shots);
        $('#sub0').textContent = EDU.t('p_left', { n: EDU.fmt(R.onBoard(b, 'w') + R.onBoard(b, 'b') + R.onBoard(b, 'q')) }) +
          (best ? ' · ' + EDU.t('p_best', { n: EDU.fmt(best) }) : '');
      } else {
        $('#pts' + i).textContent = EDU.fmt(M.scores[i]);
        var q = b.queen.by === c && b.queen.st === 'covered' ? ' · ' + EDU.t('queen_badge') : '';
        $('#sub' + i).textContent = EDU.t(c === 'w' ? 'left_w' : 'left_b', { n: EDU.fmt(R.onBoard(b, c)) }) + q;
      }
      $('#pts' + i).setAttribute('data-v', practice ? b.shots : M.scores[i]);
    });
  }
  function renderEnd() {
    var b = M.board, box = $('#end');
    box.hidden = !b.over;
    if (!b.over) return;
    var h = $('#end-h'), p = $('#end-p');
    if (M.mode === 'practice') {
      h.textContent = EDU.t('p_done', { n: EDU.fmt(b.shots) });
      p.textContent = EDU.t('p_best', { n: EDU.fmt(best || b.shots) });
    } else {
      var r = b.result;
      h.textContent = M.over ? matchOverText() : EDU.t('board_won', { name: nameOf(r.winner), b: EDU.fmt(M.boardNo) });
      p.textContent = EDU.t('board_pts', { c: EDU.fmt(r.coins), q: EDU.fmt(r.queen), pts: EDU.fmt(r.pts) }) + (r.noQueenPts ? ' ' + EDU.t('no_queen_pts') : '');
    }
    $('#next-board').hidden = M.over;
    $('#again').hidden = !M.over;
  }
  function renderBoards() {
    var tb = $('#boards'), cfg = R.MATCH[M.opts.match];
    tb.innerHTML = '';
    if (M.mode === 'practice') {
      $('#target').textContent = EDU.t('t_practice');
      $('#boards-wrap').hidden = true; return;
    }
    $('#boards-wrap').hidden = false;
    $('#target').textContent = EDU.t('t_' + M.opts.match) + ' ' + EDU.t('t_board', { b: EDU.fmt(M.boardNo) });
    M.boards.forEach(function (r, i) {
      tb.appendChild(EDU.el('tr', {}, EDU.el('td', { text: EDU.fmt(i + 1) }), EDU.el('td', { class: 'no-i18n', text: nameOf(r.winner) }),
        EDU.el('td', { class: 'num', text: EDU.fmt(r.pts) })));
    });
    tb.appendChild(EDU.el('tr', {}, EDU.el('td', { colspan: '2', style: { fontWeight: '700' }, text: EDU.t('total') + ': ' + nameOf(0) + ' – ' + nameOf(1) }),
      EDU.el('td', { class: 'num', style: { fontWeight: '700' }, text: EDU.fmt(M.scores[0]) + ' – ' + EDU.fmt(M.scores[1]) })));
    void cfg;
  }
  function f2(v) { return EDU.fmt(v, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function renderPhys() {
    var dl = $('#phys'), ev = lastEvents;
    $('#phys-none').hidden = !!ev; dl.hidden = !ev;
    if (!ev) return;
    dl.innerHTML = '';
    function row(k, v) { dl.appendChild(EDU.el('dt', { text: EDU.t(k) })); dl.appendChild(EDU.el('dd', { text: v })); }
    function head(k, vars) { dl.appendChild(EDU.el('div', { class: 'head', text: EDU.t(k, vars) })); }
    var fire = ev[0] && ev[0].type === 'fire' ? ev[0] : null;
    if (fire) row('ph_speed', f2(fire.v / 100) + ' m/s');
    var hit = null, wall = null;
    for (var i = 0; i < ev.length; i++) {
      var e = ev[i];
      if (!hit && e.type === 'hit' && (e.ka === 's' || e.kb === 's')) hit = e;
      if (!wall && e.type === 'wall' && e.k === 's') wall = e;
    }
    if (hit) {
      var sIsA = hit.ka === 's', ms = sIsA ? hit.ma : hit.mb, mc = sIsA ? hit.mb : hit.ma, kc = sIsA ? hit.kb : hit.ka;
      var s0 = sIsA ? hit.a0 : hit.b0, s1 = sIsA ? hit.a1 : hit.b1, c0 = sIsA ? hit.b0 : hit.a0, c1 = sIsA ? hit.b1 : hit.a1;
      var L = function (v) { return Math.sqrt(v[0] * v[0] + v[1] * v[1]); };
      head('ph_hit', { what: colWord(kc) });
      row('ph_masses', EDU.fmt(ms) + ' g : ' + EDU.fmt(mc) + ' g');
      row('ph_s_before', f2(L(s0) / 100) + ' m/s');
      row('ph_s_after', f2(L(s1) / 100) + ' m/s');
      row('ph_c_after', f2(L(c1) / 100) + ' m/s');
      var p0 = [ms * s0[0] + mc * c0[0], ms * s0[1] + mc * c0[1]], p1 = [ms * s1[0] + mc * c1[0], ms * s1[1] + mc * c1[1]];
      row('ph_p_before', f2(L(p0) / 100) + ' g·m/s');
      row('ph_p_after', f2(L(p1) / 100) + ' g·m/s');
      var k0 = ms * L(s0) * L(s0) + mc * L(c0) * L(c0), k1 = ms * L(s1) * L(s1) + mc * L(c1) * L(c1);
      row('ph_energy', EDU.fmt(k0 ? Math.round(k1 / k0 * 100) : 0) + '%');
    }
    if (wall) {
      var vertical = wall.side >= 3;
      var ain = Math.atan2(Math.abs(vertical ? wall.vin[0] : wall.vin[1]), Math.abs(vertical ? wall.vin[1] : wall.vin[0])) / P.DEG;
      var aout = Math.atan2(Math.abs(vertical ? wall.vout[0] : wall.vout[1]), Math.abs(vertical ? wall.vout[1] : wall.vout[0])) / P.DEG;
      head('ph_wall');
      row('ph_in', EDU.fmt(ain, { maximumFractionDigits: 1 }) + '°');
      row('ph_out', EDU.fmt(aout, { maximumFractionDigits: 1 }) + '°');
    }
    if (!hit && !wall) row('ph_nohit', '–');
  }
  function renderSettings() {
    ['pvp', 'cpu', 'practice'].forEach(function (m) { $('#mode-' + m).setAttribute('aria-pressed', String(SET.mode === m)); });
    LEVELS.forEach(function (l) { $('#lvl-' + l).setAttribute('aria-pressed', String(SET.level === l)); });
    $('#level-row').hidden = SET.mode !== 'cpu';
    $('#name2-f').hidden = SET.mode !== 'pvp';
    $('#match-f').hidden = SET.mode === 'practice';
    $('#qf-row').hidden = SET.mode === 'practice';
    $('#match').value = SET.match;
    $('#queen-first').checked = SET.queenFirst;
    $('#name1').placeholder = EDU.t(SET.mode === 'practice' ? 'you' : 'player1');
    $('#name2').placeholder = EDU.t('player2');
    $('#guide').checked = SET.guide; $('#paths').checked = SET.paths; $('#sound').checked = SET.sound;
    var differs = SET.mode !== M.mode || (M.mode !== 'practice' && (SET.match !== M.opts.match || SET.queenFirst !== M.opts.queenFirst));
    $('#pending').hidden = !differs;
    $('#new-match').classList.toggle('btn-accent', differs);
  }
  function renderAll() {
    renderScore(); renderStatus(); renderEnd(); renderBoards(); renderPhys(); renderSettings(); syncControls(); draw();
  }

  /* ------------------------------------------------------------------ game panel */
  ['pvp', 'cpu', 'practice'].forEach(function (m) {
    $('#mode-' + m).addEventListener('click', function () { SET.mode = m; saveSettings(); renderSettings(); });
  });
  LEVELS.forEach(function (l) {
    $('#lvl-' + l).addEventListener('click', function () { SET.level = l; if (M.mode === 'cpu') { M.opts.level = l; saveMatch(); } saveSettings(); renderSettings(); });
  });
  $('#match').addEventListener('change', function () { SET.match = this.value; saveSettings(); renderSettings(); });
  $('#queen-first').addEventListener('change', function () { SET.queenFirst = this.checked; saveSettings(); renderSettings(); });
  ['name1', 'name2'].forEach(function (id, i) {
    $('#' + id).value = SET.names[i];
    $('#' + id).addEventListener('input', function () {
      SET.names[i] = this.value.slice(0, 20); saveSettings();
      M.names = SET.names.slice(); saveMatch(); renderScore(); renderStatus(); renderBoards(); renderEnd();
    });
  });
  $('#guide').addEventListener('change', function () { SET.guide = this.checked; saveSettings(); draw(); });
  $('#paths').addEventListener('change', function () { SET.paths = this.checked; saveSettings(); draw(); });
  $('#sound').addEventListener('change', function () { SET.sound = this.checked; saveSettings(); if (SET.sound) sound('hit', 0.5); });

  function newMatch(ask) {
    var started = M.boards.length > 0 || M.board.shots > 0;
    if (ask && started && !M.over && !confirm(EDU.t('confirm_new'))) return false;
    stopCpu(); W = null; phase = 'aim'; lastEvents = null; trails = null;
    M = R.newMatch(SET.mode, SET); M.names = SET.names.slice(); M.lastMsg = null;
    aim = { angle: 0, power: 0.6 };
    $('#msg').textContent = ''; $('#msg').className = 'cr-msg';
    saveMatch(); renderAll(); maybeCpu();
    return true;
  }
  $('#new-match').addEventListener('click', function () { newMatch(true); });
  $('#again').addEventListener('click', function () { newMatch(false); });
  $('#next-board').addEventListener('click', function () {
    if (!R.nextBoard(M)) return;
    lastEvents = null; trails = null; aim = { angle: 0, power: 0.6 }; M.lastMsg = null;
    $('#msg').textContent = EDU.t('m_new_board', { name: nameOf(M.board.turn) }); $('#msg').className = 'cr-msg';
    saveMatch(); renderAll(); maybeCpu();
  });
  $('#fs').addEventListener('click', function () { EDU.fullscreen($('#play')); });
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) {
    document.addEventListener(ev, function () { setTimeout(function () { size(); draw(); }, 60); });
  });

  /* practice best: fewest shots, kept on this device */
  var bestSeen = M.mode === 'practice' && M.board.over;
  var origRenderEnd = renderEnd;
  renderEnd = function () {
    if (M.mode === 'practice' && M.board.over && !bestSeen) {
      bestSeen = true;
      if (!best || M.board.shots < best) { best = M.board.shots; store.set('best', best); EDU.toast(EDU.t('p_new_best')); }
    }
    if (!(M.mode === 'practice' && M.board.over)) bestSeen = false;
    origRenderEnd();
  };

  EDU.onLang(function () { renderAll(); restoreMsg(); });
  EDU.onTheme(function () { drawBg(); draw(); });
  var rt = 0, lastW = 0;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { size(); draw(); }, 80); });
  if (window.ResizeObserver) new ResizeObserver(function () {
    var w = $('#stage').clientWidth; if (Math.abs(w - lastW) < 2) return; lastW = w;
    clearTimeout(rt); rt = setTimeout(function () { size(); draw(); }, 50);
  }).observe($('#stage'));

  if (!M.names) M.names = SET.names.slice();
  size();
  renderAll();
  restoreMsg();
  maybeCpu();

  /* ------------------------------------------------------------------ test hook (used by tools/tests/carrom.test.js)
     Sets up positions and plays shots instantly; it does not change normal play. */
  window.__gameTest = {
    /* coins: [{k:'w'|'b'|'q', x, y}] are on the board; every other coin counts as already pocketed */
    setup: function (o) {
      o = o || {};
      stopCpu(); W = null; phase = 'aim';
      var b = M.board, used = {};
      b.breakDone = o.breakDone !== false;
      if (o.turn === 0 || o.turn === 1) b.turn = o.turn;
      b.pieces.forEach(function (p) { if (p.k !== 's') { p.on = false; p.vx = 0; p.vy = 0; } });
      (o.coins || []).forEach(function (c) {
        var p = b.pieces.filter(function (q) { return q.k === c.k && !used[q.id]; })[0];
        if (!p) return; used[p.id] = 1; p.on = true; p.x = c.x; p.y = c.y;
      });
      if (o.queen) b.queen = { st: o.queen.st, by: o.queen.by || null };
      b.due = { w: 0, b: 0 };
      R.placeStriker(M, o.strikerX || 0);
      renderAll();
      return this.state();
    },
    /* a spot on the straight line from the striker to a pocket (0 top-left, 1 top-right, 2 bottom-left, 3 bottom-right) */
    lineToPocket: function (pocket, dist) {
      var s = striker(), pk = P.POCKETS[pocket], side = R.sideOf(M.board.turn);
      var ux = pk[0] - s.x, uy = pk[1] - s.y, L = Math.sqrt(ux * ux + uy * uy);
      return { x: s.x + ux / L * dist, y: s.y + uy / L * dist, angle: P.angleOf(side, ux, uy) };
    },
    angleTo: function (x, y) { var s = striker(); return P.angleOf(R.sideOf(M.board.turn), x - s.x, y - s.y); },
    /* fire with this angle and power (0..1) and fast-forward the physics to rest */
    shoot: function (angle, power) {
      stopCpu();
      if (phase !== 'aim' || M.board.over) return null;
      aim.angle = angle; aim.power = power;
      startShot(angle, power);
      while (stepOnce()) { /* fast-forward */ }
      settle();
      return this.state();
    },
    state: function () {
      var b = M.board;
      return { turn: b.turn, colors: b.colors.slice(), scores: M.scores.slice(), queen: { st: b.queen.st, by: b.queen.by }, shots: b.shots,
        onBoard: { w: R.onBoard(b, 'w'), b: R.onBoard(b, 'b'), q: R.onBoard(b, 'q') }, boardOver: b.over, matchOver: M.over, boardNo: M.boardNo,
        last: b.last ? { msgs: b.last.msgs.map(function (m) { return m[0]; }), again: b.last.again, foul: b.last.foul, pocketed: b.last.pocketed.slice() } : null,
        striker: { x: striker().x, y: striker().y }, phase: phase, mode: M.mode };
    },
    setRandom: function (fn) { rnd = typeof fn === 'function' ? fn : Math.random; },
    physics: P, rules: R
  };
})();
