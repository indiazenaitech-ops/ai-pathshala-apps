/* Sound & Waves Lab: tone generator with oscilloscope + spectrum, beats, echo, string/pipe harmonics,
   hearing-range test, microphone view and an NCERT quiz. Web Audio only; nothing is recorded or sent. */
(function () {
  'use strict';
  var $ = EDU.$, $$ = EDU.$$, t = EDU.t;
  var store = EDU.store('sound-waves-lab');
  var V_ECHO = 343;                                   // m/s used for the echo tab (air at about 20 °C)
  var TABS = ['tone', 'beats', 'echo', 'harm', 'hear', 'mic', 'quiz'];
  var WAVES = ['sine', 'square', 'triangle', 'sawtooth'];
  var SPEEDS = [343, 1498, 5960];
  var DEF = { tab: 'tone', f: 440, amp: 60, wave: 'sine', v: 343, b1: 440, b2: 444, d: 50, f0: 220, htype: 'string', hn: 1 };

  function num(x, lo, hi, d) { x = Number(x); return isFinite(x) && x >= lo && x <= hi ? x : d; }
  function load() {
    var o = store.get('state', {}) || {}, s = {};
    s.tab = TABS.indexOf(o.tab) >= 0 ? o.tab : DEF.tab;
    s.f = Math.round(num(o.f, 20, 20000, DEF.f));
    s.amp = Math.round(num(o.amp, 0, 100, DEF.amp));
    s.wave = WAVES.indexOf(o.wave) >= 0 ? o.wave : DEF.wave;
    s.v = SPEEDS.indexOf(o.v) >= 0 ? o.v : DEF.v;
    s.b1 = num(o.b1, 20, 5000, DEF.b1); s.b2 = num(o.b2, 20, 5000, DEF.b2);
    s.d = num(o.d, 1, 5000, DEF.d);
    s.f0 = Math.round(num(o.f0, 20, 2000, DEF.f0));
    s.htype = ['string', 'open', 'closed'].indexOf(o.htype) >= 0 ? o.htype : DEF.htype;
    s.hn = Math.round(num(o.hn, 1, 11, 1));
    return s;
  }
  var S = load();
  var quizBest = store.get('quizBest', null);
  if (!quizBest || typeof quizBest.s !== 'number') quizBest = null;
  function save() { store.set('state', S); }

  EDU.init({ slug: 'sound-waves-lab', title: 'app_title' });

  /* ------------------------------------------------------------ helpers */
  function f1(x, d) { return EDU.fmt(x, { maximumFractionDigits: d === undefined ? 2 : d }); }
  function sig(x, n) { return Number(x.toPrecision(n || 3)); }
  var NOTES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  function noteOf(f) {
    var n = Math.round(12 * Math.log2(f / 440)), midi = 69 + n;
    var cents = Math.round(1200 * Math.log2(f / (440 * Math.pow(2, n / 12))));
    return NOTES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1) + (cents ? ' ' + (cents > 0 ? '+' : '−') + Math.abs(cents) + '¢' : '');
  }
  function lenText(m) { return m >= 0.1 ? f1(m, 2) + ' m' : f1(m * 100, 1) + ' cm'; }
  function f2slider(f) { return Math.round(1000 * Math.log(f / 20) / Math.log(1000)); }
  function slider2f(x) { return Math.round(20 * Math.pow(1000, x / 1000)); }
  function wave(type, ph) {
    var fr = ph - Math.floor(ph);
    if (type === 'square') return fr < 0.5 ? 1 : -1;
    if (type === 'triangle') return 2 / Math.PI * Math.asin(Math.sin(2 * Math.PI * ph));
    if (type === 'sawtooth') return fr < 0.5 ? 2 * fr : 2 * fr - 2;
    return Math.sin(2 * Math.PI * ph);
  }
  function col(name) { return EDU.css(name) || '#888'; }
  function ctxOf(id) {                                   // k scales canvas text so it stays readable on a phone
    var c = document.getElementById(id), cw = c.clientWidth || c.width;
    return { c: c, x: c.getContext('2d'), w: c.width, h: c.height, k: EDU.clamp(c.width / cw, 1, 2) };
  }
  function clear(g) {
    g.x.clearRect(0, 0, g.w, g.h);
    g.x.fillStyle = col('--surface-2'); g.x.fillRect(0, 0, g.w, g.h);
  }
  function grid(g, nx, ny) {
    var x = g.x; x.strokeStyle = col('--border'); x.lineWidth = 1; x.beginPath();
    for (var i = 1; i < nx; i++) { var X = Math.round(g.w * i / nx) + 0.5; x.moveTo(X, 0); x.lineTo(X, g.h); }
    for (var j = 1; j < ny; j++) { var Y = Math.round(g.h * j / ny) + 0.5; x.moveTo(0, Y); x.lineTo(g.w, Y); }
    x.stroke();
  }
  function label(g, txt, X, Y, align, color, size) {
    g.x.fillStyle = color || col('--muted'); g.x.font = Math.round((size || 15) * (g.k || 1)) + 'px "Noto Sans", system-ui, sans-serif';
    g.x.textAlign = align || 'left'; g.x.textBaseline = 'middle'; g.x.fillText(txt, X, Y);
  }

  /* ------------------------------------------------------------ audio graph */
  var AC = null, master = null, analyser = null, tbuf = null, fbuf = null;
  function audio() {
    if (!AC) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) { EDU.toast(t('no_audio')); return null; }
      try { AC = new C(); } catch (e) { EDU.toast(t('no_audio')); return null; }
      master = AC.createGain(); master.gain.value = 0.8;
      analyser = AC.createAnalyser(); analyser.fftSize = 16384; analyser.smoothingTimeConstant = 0.5;
      master.connect(analyser); analyser.connect(AC.destination);
      tbuf = new Float32Array(analyser.fftSize); fbuf = new Float32Array(analyser.frequencyBinCount);
    }
    if (AC.state === 'suspended' && AC.resume) AC.resume();
    return AC;
  }
  function voice(type, f, gain) {                       // oscillator → gain → master, with a soft start
    var o = AC.createOscillator(), g = AC.createGain(), now = AC.currentTime;
    o.type = type; o.frequency.value = f; g.gain.value = 0;
    g.gain.setTargetAtTime(gain, now, 0.02);
    o.connect(g); g.connect(master); o.start();
    return { o: o, g: g };
  }
  function kill(v) {
    if (!v || !AC) return;
    var now = AC.currentTime;
    try { v.g.gain.cancelScheduledValues(now); v.g.gain.setTargetAtTime(0, now, 0.02); v.o.stop(now + 0.2); } catch (e) { }
  }

  /* ------------------------------------------------------------ animation loop */
  var raf = 0;
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  function frame(ts) {
    raf = 0;
    var more = false;
    if (S.tab === 'tone') { drawTone(); more = !!tone; }
    else if (S.tab === 'beats') { drawBeats(ts); more = !!beats; }
    else if (S.tab === 'echo') { more = drawEcho(ts); }
    else if (S.tab === 'harm') { drawHarm(ts); more = true; }
    else if (S.tab === 'mic') { drawMic(); more = !!mic; }
    if (more && !document.hidden) kick();
  }

  /* ============================================================ 1. TONE */
  var tone = null;
  function toneGain() { return 0.3 * S.amp / 100 * (S.wave === 'square' || S.wave === 'sawtooth' ? 0.55 : 1); }
  function scopeWindow(f) { return f < 100 ? 50 : f < 2000 ? 10 : f < 10000 ? 2 : 0.5; }   // ms across the screen
  function renderTone() {
    $('#freq-range').value = f2slider(S.f);
    if (document.activeElement !== $('#freq-num')) $('#freq-num').value = S.f;
    $('#amp-range').value = S.amp;
    $('#amp-val').textContent = S.amp + '%';
    $$('#wave-seg button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.wave === S.wave ? 'true' : 'false'); });
    $('#medium').value = String(S.v);
    var lam = S.v / S.f, T = 1000 / S.f;
    $('#r-wavelength').textContent = lenText(lam); $('#r-wavelength').dataset.value = sig(lam, 4);
    $('#r-period').textContent = f1(sig(T, 3), 3) + ' ms'; $('#r-period').dataset.value = sig(T, 4);
    $('#r-note').textContent = noteOf(S.f);
    $('#tone-play').setAttribute('aria-pressed', tone ? 'true' : 'false');
    $('#tone-play').firstChild.textContent = tone ? '■ ' : '▶ ';
    $('#tone-play-txt').textContent = tone ? t('stop_tone') : t('play_tone');
    $('#tone-status').textContent = tone ? t('status_on') : t('status_off');
    $('#tone-status').className = 'badge' + (tone ? ' success' : '');
    $('#scope-note').textContent = t('scope_note', { ms: f1(scopeWindow(S.f), 1) });
    if (tone) { tone.o.type = S.wave; tone.o.frequency.setTargetAtTime(S.f, AC.currentTime, 0.01); tone.g.gain.setTargetAtTime(toneGain(), AC.currentTime, 0.03); }
    drawTone();
  }
  function setF(f) { S.f = EDU.clamp(Math.round(f), 20, 20000); save(); renderTone(); }
  $('#freq-range').addEventListener('input', function () { setF(slider2f(+this.value)); });
  $('#freq-num').addEventListener('change', function () { var v = +this.value; if (isFinite(v) && this.value !== '') setF(v); this.value = S.f; });
  $('#freq-num').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); this.blur(); } });
  $('#amp-range').addEventListener('input', function () { S.amp = +this.value; save(); renderTone(); });
  $$('#wave-seg button').forEach(function (b) { b.addEventListener('click', function () { S.wave = b.dataset.wave; save(); renderTone(); }); });
  $$('#tone-presets button').forEach(function (b) { b.addEventListener('click', function () { setF(+b.dataset.f); }); });
  $('#medium').addEventListener('change', function () { S.v = +this.value; save(); renderTone(); });
  $('#tone-play').addEventListener('click', function () {
    if (tone) { kill(tone); tone = null; renderTone(); return; }
    stopAll();
    if (!audio()) return;
    tone = voice(S.wave, S.f, toneGain());
    renderTone(); kick();
  });
  $('#tone-fs').addEventListener('click', function () { EDU.fullscreen($('#tone-stage')); });

  function drawTone() {
    var g = ctxOf('cv-scope'), x = g.x, mid = g.h / 2, A = g.h * 0.42;
    clear(g); grid(g, 10, 4);
    x.strokeStyle = col('--muted'); x.globalAlpha = .6; x.beginPath(); x.moveTo(0, mid + .5); x.lineTo(g.w, mid + .5); x.stroke(); x.globalAlpha = 1;
    var win = scopeWindow(S.f) / 1000;
    x.strokeStyle = col('--primary'); x.lineWidth = 3; x.lineJoin = 'round'; x.beginPath();
    if (tone && analyser) {
      analyser.getFloatTimeDomainData(tbuf);
      var sr = AC.sampleRate, N = Math.max(8, Math.round(win * sr)), start = 0, peak = 0.3 * 0.8;
      for (var i = 1; i < tbuf.length - N; i++) { if (tbuf[i - 1] < 0 && tbuf[i] >= 0) { start = i; break; } }
      for (var k = 0; k <= N && start + k < tbuf.length; k++) {
        var X = k / N * g.w, Y = mid - EDU.clamp(tbuf[start + k] / peak, -1.1, 1.1) * A;
        if (k) x.lineTo(X, Y); else x.moveTo(X, Y);
      }
    } else {
      var cyc = S.f * win, amp = S.amp / 100, steps = Math.min(4000, Math.max(400, Math.round(cyc * 40)));
      for (var s = 0; s <= steps; s++) {
        var X2 = s / steps * g.w, Y2 = mid - wave(S.wave, cyc * s / steps) * amp * A;
        if (s) x.lineTo(X2, Y2); else x.moveTo(X2, Y2);
      }
    }
    x.stroke(); x.lineWidth = 1;
    drawSpectrum('cv-spec', tone && analyser ? analyser : null, theoryBars());
  }
  function theoryBars() {
    var out = [], amp = S.amp / 100;
    if (!amp) return out;
    for (var n = 1; n * S.f <= 20000 && n <= 40; n++) {
      var a = S.wave === 'sine' ? (n === 1 ? 1 : 0) : S.wave === 'square' ? (n % 2 ? 1 / n : 0) : S.wave === 'triangle' ? (n % 2 ? 1 / (n * n) : 0) : 1 / n;
      if (a) out.push({ f: n * S.f, a: a * amp });
    }
    return out;
  }
  function fx(f, w) { return Math.log(f / 20) / Math.log(1000) * w; }
  function drawSpectrum(id, an, bars) {
    var g = ctxOf(id), x = g.x, base = g.h - 26;
    clear(g);
    x.strokeStyle = col('--border'); x.beginPath();
    [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000].forEach(function (f) { var X = Math.round(fx(f, g.w)) + .5; x.moveTo(X, 0); x.lineTo(X, base); });
    x.moveTo(0, base + .5); x.lineTo(g.w, base + .5); x.stroke();
    [[20, '20'], [100, '100'], [1000, '1k'], [10000, '10k'], [20000, '20k']].forEach(function (p, i) {
      label(g, p[1], EDU.clamp(fx(p[0], g.w), 4, g.w - 4), base + 14, i === 0 ? 'left' : i === 4 ? 'right' : 'center', null, 14);
    });
    var H = base - 8;
    if (an) {
      var buf = an === analyser ? fbuf : micF;
      an.getFloatFrequencyData(buf);
      var sr = an.context.sampleRate, binHz = sr / an.fftSize;
      x.fillStyle = col('--primary'); x.globalAlpha = .75; x.beginPath(); x.moveTo(0, base);
      for (var X = 0; X <= g.w; X += 2) {
        var f = 20 * Math.pow(1000, X / g.w), b = Math.min(buf.length - 1, Math.round(f / binHz));
        var db = buf[b], y = base - EDU.clamp((db + 100) / 90, 0, 1) * H;
        x.lineTo(X, y);
      }
      x.lineTo(g.w, base); x.closePath(); x.fill(); x.globalAlpha = 1;
    } else {
      x.fillStyle = col('--primary');
      bars.forEach(function (b, i) {
        var db = 20 * Math.log10(b.a), hh = EDU.clamp((db + 60) / 60, 0.02, 1) * H, X2 = fx(b.f, g.w);
        x.globalAlpha = i ? .7 : 1; x.fillRect(X2 - 3, base - hh, 6, hh);
      });
      x.globalAlpha = 1;
      if (bars.length) label(g, f1(bars[0].f, 0) + ' Hz', EDU.clamp(fx(bars[0].f, g.w) + 8, 4, g.w - 90), 16, 'left', col('--text'), 15);
    }
  }

  /* ============================================================ 2. BEATS */
  var beats = null, beatsT0 = 0;
  function bClamp(v) { return Math.round(EDU.clamp(v, 20, 5000) * 10) / 10; }
  function renderBeats() {
    $('#b1-range').value = EDU.clamp(S.b1, 100, 1000); $('#b2-range').value = EDU.clamp(S.b2, 100, 1000);
    if (document.activeElement !== $('#b1-num')) $('#b1-num').value = S.b1;
    if (document.activeElement !== $('#b2-num')) $('#b2-num').value = S.b2;
    var df = Math.round(Math.abs(S.b1 - S.b2) * 10) / 10;
    $('#beats-val').textContent = f1(df, 1); $('#beats-val').dataset.value = df;
    $('#beats-msg').textContent = df === 0 ? t('beats_none') : df <= 15 ? t('beats_slow', { n: f1(df, 1) }) : t('beats_fast', { n: f1(df, 1) });
    $('#beats-play').setAttribute('aria-pressed', beats ? 'true' : 'false');
    $('#beats-play').firstChild.textContent = beats ? '■ ' : '▶ ';
    $('#beats-play-txt').textContent = beats ? t('stop') : t('play_beats');
    if (beats) { beats[0].o.frequency.setTargetAtTime(S.b1, AC.currentTime, 0.01); beats[1].o.frequency.setTargetAtTime(S.b2, AC.currentTime, 0.01); }
    drawBeats(performance.now());
  }
  function setB(k, v) { S[k] = bClamp(v); save(); renderBeats(); }
  $('#b1-range').addEventListener('input', function () { setB('b1', +this.value); });
  $('#b2-range').addEventListener('input', function () { setB('b2', +this.value); });
  ['b1', 'b2'].forEach(function (k) {
    var e = $('#' + k + '-num');
    e.addEventListener('change', function () { if (this.value !== '' && isFinite(+this.value)) setB(k, +this.value); this.value = S[k]; });
    e.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); this.blur(); } });
  });
  $('#beats-play').addEventListener('click', function () {
    if (beats) { kill(beats[0]); kill(beats[1]); beats = null; renderBeats(); return; }
    stopAll();
    if (!audio()) return;
    beats = [voice('sine', S.b1, 0.13), voice('sine', S.b2, 0.13)];
    beatsT0 = performance.now(); renderBeats(); kick();
  });
  function drawBeats(ts) {
    var g = ctxOf('cv-beats'), x = g.x, top = 20, base = g.h - 34, mid = (top + base) / 2, A = (base - top) / 2 - 4;
    clear(g); grid(g, 10, 4);
    var df = Math.abs(S.b1 - S.b2), N = 1600;
    x.fillStyle = col('--primary'); x.globalAlpha = .25; x.beginPath();
    for (var i = 0; i <= N; i++) { var tt = i / N, e = df ? Math.abs(Math.cos(Math.PI * df * tt)) : 1; x.lineTo(tt * g.w, mid - e * A); }
    for (var j = N; j >= 0; j--) { var t2 = j / N, e2 = df ? Math.abs(Math.cos(Math.PI * df * t2)) : 1; x.lineTo(t2 * g.w, mid + e2 * A); }
    x.closePath(); x.fill(); x.globalAlpha = 1;
    x.strokeStyle = col('--primary'); x.lineWidth = 2.5;
    [-1, 1].forEach(function (sgn) {
      x.beginPath();
      for (var i = 0; i <= N; i++) { var tt = i / N, e = df ? Math.abs(Math.cos(Math.PI * df * tt)) : 1; var Y = mid - sgn * e * A; if (i) x.lineTo(tt * g.w, Y); else x.moveTo(tt * g.w, Y); }
      x.stroke();
    });
    if (df && df <= 40) {                               // a dot on every loud moment: count them = beats per second
      x.fillStyle = col('--accent');
      for (var k = 0; k <= df + 1e-9; k++) { var X = k / df * g.w; if (X <= g.w + 1) { x.beginPath(); x.arc(EDU.clamp(X, 6, g.w - 6), mid - A, 6, 0, 7); x.fill(); } }
    }
    label(g, t('beat_loud'), 8, top + 2, 'left', col('--text'), 14);
    label(g, '0 s', 4, g.h - 14, 'left', null, 14); label(g, '0.5 s', g.w / 2, g.h - 14, 'center', null, 14); label(g, '1 s', g.w - 4, g.h - 14, 'right', null, 14);
    if (beats) {
      var p = ((ts - beatsT0) / 1000) % 1, PX = p * g.w;
      x.strokeStyle = col('--danger'); x.lineWidth = 3; x.beginPath(); x.moveTo(PX, top - 10); x.lineTo(PX, base + 4); x.stroke(); x.lineWidth = 1;
    }
  }

  /* ============================================================ 3. ECHO */
  var echoAnim = null;
  function echoTime() { return 2 * S.d / V_ECHO; }
  function renderEcho() {
    $('#echo-range').value = EDU.clamp(Math.round(S.d), 1, 500);
    if (document.activeElement !== $('#echo-num')) $('#echo-num').value = S.d;
    var te = echoTime(), minD = V_ECHO * 0.1 / 2;
    $('#echo-time').textContent = te < 10 ? f1(te, 2) : f1(te, 1);
    $('#echo-time').dataset.value = Math.round(te * 1000) / 1000;
    $('#echo-msg').textContent = te >= 0.1 ? t('echo_msg_echo', { d: f1(minD, 1) }) : t('echo_msg_merge', { d: f1(minD, 1) });
    $('#echo-msg').className = 'small ' + (te >= 0.1 ? '' : 'swl-warn-txt');
    var A = animDur(te), fac = A / te;
    $('#echo-slow').textContent = fac > 1.05 ? t('echo_slow', { x: f1(fac, fac < 10 ? 1 : 0) }) : fac < 0.95 ? t('echo_fast', { x: f1(1 / fac, 1) }) : t('echo_real');
    if (!echoAnim) drawEcho(performance.now());
  }
  function animDur(te) { return EDU.clamp(te, 1.6, 4); }
  function setD(v) { S.d = Math.round(EDU.clamp(v, 1, 5000) * 10) / 10; save(); renderEcho(); }
  $('#echo-range').addEventListener('input', function () { setD(+this.value); });
  $('#echo-num').addEventListener('change', function () { if (this.value !== '' && isFinite(+this.value)) setD(+this.value); this.value = S.d; });
  $('#echo-num').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); this.blur(); } });
  function clapAt(when, gain) {                         // a short noise burst = a clap
    var len = Math.round(AC.sampleRate * 0.06), b = AC.createBuffer(1, len, AC.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    var src = AC.createBufferSource(), g = AC.createGain(); src.buffer = b; g.gain.value = gain;
    src.connect(g); g.connect(master); src.start(when);
  }
  $('#echo-clap').addEventListener('click', function () {
    stopAll();
    var te = echoTime();
    if (audio()) { var now = AC.currentTime + 0.05; clapAt(now, 0.6); clapAt(now + te, 0.25); }
    echoAnim = { t0: performance.now(), te: te, dur: animDur(te) * 1000 };
    kick();
  });
  function drawEcho(ts) {
    var g = ctxOf('cv-echo'), x = g.x, gy = g.h - 60, x0 = 70, xw = g.w - 70;
    clear(g);
    x.fillStyle = col('--success'); x.globalAlpha = .25; x.fillRect(0, gy, g.w, g.h - gy); x.globalAlpha = 1;
    x.fillStyle = col('--muted'); x.fillRect(xw, 30, 26, gy - 30);
    x.strokeStyle = col('--surface-2'); x.lineWidth = 2;
    for (var r = 40; r < gy; r += 22) { x.beginPath(); x.moveTo(xw, r); x.lineTo(xw + 26, r); x.stroke(); }
    x.font = Math.round(44 * g.k) + 'px system-ui, "Noto Color Emoji", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillText('🧍', x0 - 20, gy - 4);
    label(g, t('echo_you'), x0 - 20, gy + 18, 'center', col('--text'), 15);
    label(g, t('echo_wall'), xw + 13, gy + 18, 'center', col('--text'), 15);
    x.strokeStyle = col('--text'); x.fillStyle = col('--text'); x.lineWidth = 1.5;
    var ay = gy + 40; x.beginPath(); x.moveTo(x0, ay); x.lineTo(xw, ay); x.stroke();
    [[x0, 1], [xw, -1]].forEach(function (p) { x.beginPath(); x.moveTo(p[0], ay); x.lineTo(p[0] + 10 * p[1], ay - 6); x.lineTo(p[0] + 10 * p[1], ay + 6); x.fill(); });
    var dl = (S.d >= 100 ? f1(S.d, 0) : f1(S.d, 1)) + ' m';
    x.fillStyle = col('--surface-2'); var tw = x.measureText(dl).width + 60; x.fillRect((x0 + xw) / 2 - tw / 2, ay - 12, tw, 24);
    label(g, dl, (x0 + xw) / 2, ay, 'center', col('--text'), 17);
    var more = false;
    if (echoAnim) {
      var p = (ts - echoAnim.t0) / echoAnim.dur;
      if (p >= 1.25) echoAnim = null;
      else {
        more = true;
        var going = p < 0.5, q = going ? p * 2 : Math.min(1, (p - 0.5) * 2), X = going ? x0 + (xw - x0) * q : xw - (xw - x0) * q;
        var c = going ? col('--primary') : col('--accent'), cy = gy / 2 + 10;
        x.strokeStyle = c; x.lineWidth = 4;
        for (var k = 0; k < 3; k++) {
          x.globalAlpha = 1 - k * .3; x.beginPath();
          var R = 40 + k * 14, cx = going ? X - k * 14 : X + k * 14;
          if (going) x.arc(cx - R, cy, R, -0.6, 0.6); else x.arc(cx + R, cy, R, Math.PI - 0.6, Math.PI + 0.6);
          x.stroke();
        }
        x.globalAlpha = 1; x.lineWidth = 1;
        if (!going && q >= 1) label(g, '👂 ' + f1(echoAnim.te, 2) + ' s', x0 + 30, 24, 'left', col('--accent'), 20);
      }
    } else {
      label(g, 't = 2 × ' + dl + ' ÷ 343 m/s = ' + f1(echoTime(), 2) + ' s', g.w / 2, 18, 'center', col('--text'), 16);
    }
    return more;
  }

  /* ============================================================ 4. HARMONICS */
  var harm = null;
  function harmList() { var out = []; for (var n = 1; out.length < 6; n++) { if (S.htype === 'closed' && n % 2 === 0) continue; out.push(n); } return out; }
  function renderHarm() {
    $$('#harm-seg button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.type === S.htype ? 'true' : 'false'); });
    $('#f0-range').value = EDU.clamp(S.f0, 60, 600);
    if (document.activeElement !== $('#f0-num')) $('#f0-num').value = S.f0;
    $('#harm-hint').textContent = t('harm_hint_' + S.htype);
    var list = harmList();
    if (list.indexOf(S.hn) < 0) S.hn = 1;
    var box = $('#harm-list'); box.innerHTML = '';
    list.forEach(function (n) {
      var f = n * S.f0;
      var b = EDU.el('button', { type: 'button', 'aria-pressed': n === S.hn ? 'true' : 'false', dataset: { n: n } },
        EDU.el('span', { class: 'hn no-i18n', text: n + '×' }), EDU.el('span', { text: t('harm_n', { n: n }) }), EDU.el('span', { class: 'hf num no-i18n', text: f1(f, 0) + ' Hz' }));
      b.addEventListener('click', function () {
        S.hn = n; save(); renderHarm();
        if (f > 20000) return;
        stopAll();
        if (!audio()) return;
        harm = voice('sine', f, 0.16); kick();
      });
      box.appendChild(b);
    });
    $('#harm-canvas-note').textContent = t('harm_canvas_note', { n: S.hn, f: f1(S.hn * S.f0, 0) });
    if (harm) harm.o.frequency.setTargetAtTime(S.hn * S.f0, AC.currentTime, 0.01);
    kick();
  }
  $$('#harm-seg button').forEach(function (b) { b.addEventListener('click', function () { S.htype = b.dataset.type; save(); renderHarm(); }); });
  function setF0(v) { S.f0 = Math.round(EDU.clamp(v, 20, 2000)); save(); renderHarm(); }
  $('#f0-range').addEventListener('input', function () { setF0(+this.value); });
  $('#f0-num').addEventListener('change', function () { if (this.value !== '' && isFinite(+this.value)) setF0(+this.value); this.value = S.f0; });
  $('#f0-num').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); this.blur(); } });
  $('#harm-stop').addEventListener('click', function () { kill(harm); harm = null; });
  function drawHarm(ts) {
    var g = ctxOf('cv-harm'), x = g.x, L = 60, R = g.w - 60, mid = g.h / 2 - 10, A = 70, n = S.hn, type = S.htype;
    clear(g);
    var ph = Math.cos(ts / 1000 * 2 * Math.PI * 0.8);
    function shape(u) {                                 // u from 0 (left) to 1 (right)
      if (type === 'string') return Math.sin(n * Math.PI * u);
      if (type === 'open') return Math.cos(n * Math.PI * u);
      return Math.sin(n * Math.PI * u / 2);              // closed at left: node there, antinode at the open right end
    }
    if (type !== 'string') {
      x.strokeStyle = col('--text'); x.lineWidth = 4; x.beginPath();
      x.moveTo(L, mid - A - 14); x.lineTo(R, mid - A - 14); x.moveTo(L, mid + A + 14); x.lineTo(R, mid + A + 14); x.stroke();
      if (type === 'closed') { x.beginPath(); x.moveTo(L, mid - A - 14); x.lineTo(L, mid + A + 14); x.stroke(); }
    } else {
      x.fillStyle = col('--text'); x.fillRect(L - 10, mid - 30, 10, 60); x.fillRect(R, mid - 30, 10, 60);
    }
    x.lineWidth = 1;
    x.strokeStyle = col('--muted'); x.globalAlpha = .45; x.setLineDash([6, 6]);
    [-1, 1].forEach(function (s) { x.beginPath(); for (var i = 0; i <= 300; i++) { var u = i / 300, X = L + (R - L) * u, Y = mid - s * shape(u) * A; if (i) x.lineTo(X, Y); else x.moveTo(X, Y); } x.stroke(); });
    x.setLineDash([]); x.globalAlpha = 1;
    x.strokeStyle = col('--primary'); x.lineWidth = 4; x.beginPath();
    for (var i = 0; i <= 300; i++) { var u = i / 300, X = L + (R - L) * u, Y = mid - shape(u) * A * ph; if (i) x.lineTo(X, Y); else x.moveTo(X, Y); }
    x.stroke(); x.lineWidth = 1;
    for (var k = 0; k <= 400; k++) {                    // label nodes (N) and antinodes (A)
      var u2 = k / 400, v = Math.abs(shape(u2)), X2 = L + (R - L) * u2;
      var prev = Math.abs(shape(Math.max(0, u2 - 1 / 400))), next = Math.abs(shape(Math.min(1, u2 + 1 / 400)));
      if (v < 0.008 || (v <= prev && v <= next && v < 0.02)) { x.fillStyle = col('--danger'); x.beginPath(); x.arc(X2, mid, 6, 0, 7); x.fill(); label(g, 'N', X2, g.h - 22, 'center', col('--danger'), 17); k += 8; }
      else if (v > 0.995 && v >= prev && v >= next) { label(g, 'A', X2, g.h - 22, 'center', col('--success'), 17); k += 8; }
    }
  }

  /* ============================================================ 5. HEARING TEST */
  var HIGH = [4000, 8000, 10000, 12000, 14000, 15000, 16000, 17000, 18000, 19000, 20000];
  var LOW = [250, 125, 80, 60, 40, 30, 25, 20];
  var H = { on: false, phase: 'high', i: 0, hi: null, lo: null, v: null, timer: 0 };
  function hearBeep(f) {
    if (!audio()) return;
    if (H.v) kill(H.v);
    var o = AC.createOscillator(), g = AC.createGain(), now = AC.currentTime;
    o.type = 'sine'; o.frequency.value = f; g.gain.value = 0;
    g.gain.setTargetAtTime(0.12, now, 0.05); g.gain.setTargetAtTime(0, now + 1.3, 0.08);
    o.connect(g); g.connect(master); o.start(now); o.stop(now + 1.9);
    H.v = { o: o, g: g };
  }
  function hearShow() {
    $('#hear-idle').hidden = H.on || H.done; $('#hear-run').hidden = !H.on; $('#hear-done').hidden = !H.done || H.on;
    if (H.on) {
      var f = H.phase === 'high' ? HIGH[H.i] : LOW[H.i];
      $('#hear-step').textContent = t(H.phase === 'high' ? 'hear_step_high' : 'hear_step_low', { i: H.i + 1 });
      $('#hear-now').textContent = f1(f, 0) + ' Hz'; $('#hear-now').dataset.f = f;
    }
    if (H.done) {
      $('#hear-result').textContent = t('hear_result', { lo: H.lo ? f1(H.lo, 0) : '—', hi: H.hi ? f1(H.hi, 0) : '—' });
      $('#hear-result').dataset.lo = H.lo || ''; $('#hear-result').dataset.hi = H.hi || '';
      var lp = function (f) { return Math.log(f / 20) / Math.log(1000) * 100; };
      var a = lp(H.lo || 250), b = lp(H.hi || 4000);
      $('#hear-fill').style.left = a + '%'; $('#hear-fill').style.width = Math.max(1, b - a) + '%';
    }
  }
  function hearStep() { hearShow(); hearBeep(H.phase === 'high' ? HIGH[H.i] : LOW[H.i]); }
  function hearAnswer(yes) {
    if (!H.on) return;
    if (H.phase === 'high') {
      if (yes) H.hi = HIGH[H.i];
      if (yes && H.i < HIGH.length - 1) { H.i++; return hearStep(); }
      H.phase = 'low'; H.i = 0; return hearStep();
    }
    if (yes) H.lo = LOW[H.i];
    if (yes && H.i < LOW.length - 1) { H.i++; return hearStep(); }
    H.on = false; H.done = true; kill(H.v); H.v = null;
    store.set('hearing', { lo: H.lo, hi: H.hi });
    hearShow();
  }
  function hearStart() { stopAll(); H = { on: true, phase: 'high', i: 0, hi: null, lo: null, v: null, done: false }; hearStep(); }
  $('#hear-start').addEventListener('click', hearStart);
  $('#hear-again').addEventListener('click', hearStart);
  $('#hear-yes').addEventListener('click', function () { hearAnswer(true); });
  $('#hear-no').addEventListener('click', function () { hearAnswer(false); });
  $('#hear-now').addEventListener('click', function () { if (H.on) hearBeep(+this.dataset.f); });
  $('#hear-stop').addEventListener('click', function () { kill(H.v); H.v = null; H.on = false; hearShow(); });

  /* ============================================================ 6. MICROPHONE */
  var mic = null, micT = null, micF = null;
  function renderMic() {
    $('#mic-btn').setAttribute('aria-pressed', mic ? 'true' : 'false');
    $('#mic-btn').firstChild.textContent = mic ? '■ ' : '🎤 ';
    $('#mic-txt').textContent = mic ? t('mic_stop') : t('mic_start');
    $('#mic-status').textContent = mic ? t('mic_on') : '';
    $('#mic-status').hidden = !mic;
    if (!mic) { drawScopeIdle('cv-mic-scope'); drawSpectrum('cv-mic-spec', null, []); }
  }
  function drawScopeIdle(id) { var g = ctxOf(id); clear(g); grid(g, 10, 4); g.x.strokeStyle = col('--muted'); g.x.beginPath(); g.x.moveTo(0, g.h / 2 + .5); g.x.lineTo(g.w, g.h / 2 + .5); g.x.stroke(); }
  function micStop() {
    if (!mic) return;
    try { mic.stream.getTracks().forEach(function (tr) { tr.stop(); }); mic.src.disconnect(); } catch (e) { }
    mic = null; renderMic();
  }
  $('#mic-btn').addEventListener('click', function () {
    if (mic) { micStop(); return; }
    $('#mic-msg').textContent = '';
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { $('#mic-msg').textContent = t('mic_unsupported'); return; }
    stopAll();
    if (!audio()) return;
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }).then(function (stream) {
      var src = AC.createMediaStreamSource(stream), an = AC.createAnalyser();
      an.fftSize = 8192; an.smoothingTimeConstant = 0.6; src.connect(an);
      var mute = AC.createGain(); mute.gain.value = 0; an.connect(mute); mute.connect(AC.destination);   // silent: no feedback, but keeps the analyser running
      micT = new Float32Array(an.fftSize); micF = new Float32Array(an.frequencyBinCount);
      mic = { stream: stream, src: src, an: an };
      if (S.tab !== 'mic') { micStop(); return; }
      renderMic(); kick();
    }).catch(function (e) {
      $('#mic-msg').textContent = e && (e.name === 'NotAllowedError' || e.name === 'SecurityError') ? t('mic_denied') : t('mic_unsupported');
    });
  });
  function drawMic() {
    if (!mic) return;
    var an = mic.an, sr = AC.sampleRate;
    an.getFloatTimeDomainData(micT);
    var g = ctxOf('cv-mic-scope'), x = g.x, mid = g.h / 2, N = Math.round(0.02 * sr), start = 0, rms = 0;
    for (var i = 0; i < micT.length; i++) rms += micT[i] * micT[i];
    rms = Math.sqrt(rms / micT.length);
    for (var j = 1; j < micT.length - N; j++) { if (micT[j - 1] < 0 && micT[j] >= 0) { start = j; break; } }
    clear(g); grid(g, 10, 4);
    var gain = 0.45 / Math.max(0.02, Math.min(0.5, rms * 3));
    x.strokeStyle = col('--accent'); x.lineWidth = 2.5; x.beginPath();
    for (var k = 0; k <= N; k++) { var X = k / N * g.w, Y = mid - EDU.clamp(micT[start + k] * gain, -1, 1) * mid * 0.9; if (k) x.lineTo(X, Y); else x.moveTo(X, Y); }
    x.stroke(); x.lineWidth = 1;
    drawSpectrum('cv-mic-spec', an, []);
    var binHz = sr / an.fftSize, lo = Math.ceil(60 / binHz), hi = Math.floor(5000 / binHz), bi = -1, bv = -Infinity;
    for (var b = lo; b <= hi; b++) if (micF[b] > bv) { bv = micF[b]; bi = b; }
    var level = Math.round(EDU.clamp(rms * 400, 0, 100));
    $('#mic-level').textContent = level + '%';
    if (bi > 0 && bv > -75 && level > 1) {
      var a = micF[bi - 1], c = micF[bi + 1], off = (a - c) / (2 * (a - 2 * bv + c)) || 0;
      var pf = (bi + EDU.clamp(off, -0.5, 0.5)) * binHz;
      $('#mic-peak').textContent = f1(pf, 0) + ' Hz'; $('#mic-note').textContent = noteOf(pf);
    } else { $('#mic-peak').textContent = '—'; $('#mic-note').textContent = '—'; }
  }

  /* ============================================================ 7. QUIZ */
  var QN = 10, Q = null;
  function bank() { var c = window.APP_CONTENT || {}; return (c[EDU.lang] || c.en).quiz; }
  function quizNew() {
    var n = bank().length, order = EDU.shuffle(Array.from({ length: n }, function (_, i) { return i; })).slice(0, Math.min(QN, n));
    Q = { order: order, opt: order.map(function () { return EDU.shuffle([0, 1, 2, 3]); }), i: 0, score: 0, answered: -1 };
    renderQuiz();
  }
  function renderQuiz() {
    if (!Q) return quizNew();
    $('#quiz-best').textContent = quizBest ? t('quiz_best', { s: quizBest.s, n: quizBest.n }) : t('quiz_none_best');
    var done = Q.i >= Q.order.length;
    $('#quiz-run').hidden = done; $('#quiz-done').hidden = !done;
    if (done) {
      $('#quiz-score').textContent = t('quiz_score', { s: Q.score, n: Q.order.length });
      $('#quiz-score').dataset.score = Q.score;
      var r = Q.score / Q.order.length;
      $('#quiz-remark').textContent = r >= 0.8 ? t('quiz_great') : r >= 0.5 ? t('quiz_good') : t('quiz_more');
      return;
    }
    var qi = Q.order[Q.i], item = bank()[qi];
    $('#quiz-prog').textContent = t('quiz_prog', { i: Q.i + 1, n: Q.order.length });
    $('#quiz-q').textContent = item.q; $('#quiz-q').dataset.idx = qi;
    var box = $('#quiz-opts'); box.innerHTML = '';
    Q.opt[Q.i].forEach(function (oi) {
      var st = Q.answered < 0 ? '' : oi === item.a ? 'right' : oi === Q.answered ? 'wrong' : '';
      var b = EDU.el('button', { type: 'button', text: item.opts[oi], dataset: { i: oi, state: st } });
      if (Q.answered >= 0) b.disabled = true;
      b.addEventListener('click', function () { quizAnswer(oi); });
      box.appendChild(b);
    });
    if (Q.answered >= 0) {
      var ok = Q.answered === item.a;
      $('#quiz-why').textContent = (ok ? '✓ ' + t('correct') : '✗ ' + t('wrong')) + ' · ' + item.why;
      $('#quiz-why').style.color = ok ? 'var(--success)' : 'var(--danger)';
    } else $('#quiz-why').textContent = '';
    $('#quiz-next').hidden = Q.answered < 0;
  }
  function quizAnswer(oi) {
    if (!Q || Q.answered >= 0) return;
    Q.answered = oi;
    if (oi === bank()[Q.order[Q.i]].a) Q.score++;
    renderQuiz();
    $('#quiz-next').focus({ preventScroll: true });
  }
  $('#quiz-next').addEventListener('click', function () {
    if (!Q || Q.answered < 0) return;
    Q.i++; Q.answered = -1;
    if (Q.i >= Q.order.length && (!quizBest || Q.score > quizBest.s)) { quizBest = { s: Q.score, n: Q.order.length }; store.set('quizBest', quizBest); }
    renderQuiz();
  });
  $('#quiz-restart').addEventListener('click', quizNew);

  /* ============================================================ tabs, reset, language */
  function stopAll() {
    if (tone) { kill(tone); tone = null; }
    if (beats) { kill(beats[0]); kill(beats[1]); beats = null; }
    if (harm) { kill(harm); harm = null; }
    if (H.v) { kill(H.v); H.v = null; }
    if (H.on) { H.on = false; }
    echoAnim = null;
  }
  function showTab(name) {
    if (name !== S.tab) { stopAll(); if (name !== 'mic') micStop(); }
    S.tab = name; save();
    $$('.swl-tabs [role="tab"]').forEach(function (b) { var on = b.dataset.tab === name; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
    TABS.forEach(function (k) { $('#pane-' + k).hidden = k !== name; });
    renderCurrent();
  }
  $$('.swl-tabs [role="tab"]').forEach(function (b, i, all) {
    b.addEventListener('click', function () { showTab(b.dataset.tab); });
    b.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (document.documentElement.dir === 'rtl') d = -d;
      if (!d) return;
      e.preventDefault(); var nb = all[(i + d + all.length) % all.length]; nb.focus(); showTab(nb.dataset.tab);
    });
  });
  function renderCurrent() {
    renderTone(); renderBeats(); renderEcho(); renderHarm(); hearShow(); renderMic(); renderQuiz();
    kick();
  }
  $('#reset-all').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    stopAll(); micStop();
    store.remove('state'); store.remove('quizBest'); store.remove('hearing');
    S = load(); quizBest = null; Q = null; H = { on: false, phase: 'high', i: 0, hi: null, lo: null, v: null, done: false };
    showTab('tone');
  });
  var lastH = store.get('hearing', null);
  if (lastH && (lastH.lo || lastH.hi)) { H.lo = lastH.lo; H.hi = lastH.hi; H.done = true; }

  /* Urdu: keep "100 Hz", "343 m/s", "20 Hz → 20 kHz" in left-to-right order inside right-to-left text */
  var NU = '\\d[\\d,.]*\\s?(?:kHz|Hz|ms|m/s|cm|dB|m|s)(?![A-Za-z])';
  var FC = '[0-9A-Za-zλ₀-₉¢%().,/ ]';
  var FORMULA = '[0-9A-Za-zλ(]' + FC + '*(?:\\s*[=÷×+−≈]\\s*' + FC + '*[0-9A-Za-zλ₀-₉%)])+';
  var NU_RE = new RegExp(FORMULA + '|(?:\\(?' + NU + '\\)?)(?:\\s?[→–-]\\s?' + NU + ')*', 'g');
  function bidiFix(root) {
    if (document.documentElement.dir !== 'rtl') return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n, list = [];
    while ((n = w.nextNode())) if (/\d/.test(n.nodeValue) && n.nodeValue.indexOf('\u2066') < 0 && !(n.parentNode.closest && n.parentNode.closest('.no-i18n, script, style'))) list.push(n);
    list.forEach(function (node) { var v = node.nodeValue.replace(NU_RE, function (m) { return '\u2066' + m + '\u2069'; }); if (v !== node.nodeValue) node.nodeValue = v; });
  }
  var bidiBusy = false;
  if (window.MutationObserver) new MutationObserver(function () {
    if (bidiBusy) return; bidiBusy = true; try { bidiFix($('#app')); } finally { bidiBusy = false; }
  }).observe($('#app'), { childList: true, subtree: true, characterData: true });

  EDU.onLang(renderCurrent);
  EDU.onTheme(function () { renderCurrent(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) { stopAll(); micStop(); renderCurrent(); } });
  window.addEventListener('pagehide', function () { stopAll(); micStop(); });
  showTab(S.tab);
})();
