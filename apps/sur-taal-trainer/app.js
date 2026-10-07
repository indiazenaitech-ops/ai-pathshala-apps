/* Sur & Taal Trainer — tanpura drone, swar meter, sargam riyaz, taal metronome and tuner.
   Every sound is synthesised with Web Audio; the microphone is analysed live and never recorded. */
(function () {
  'use strict';
  var SLUG = 'sur-taal-trainer';
  var store = EDU.store(SLUG);
  var t = EDU.t, $ = EDU.$, $$ = EDU.$$, el = EDU.el;
  var TAALS = window.APP_TAALS, ALK = window.APP_ALANKARS;
  function C() { var c = window.APP_CONTENT || {}; return c[EDU.lang] || c.en; }
  function noop() { }

  /* ================================================================ pure music maths (also used by the test) */
  var NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  var KEY_INFO = [['C', 'w', 1], ['C#', 'b', 1], ['D', 'w', 2], ['D#', 'b', 2], ['E', 'w', 3], ['F', 'w', 4], ['F#', 'b', 3], ['G', 'w', 5], ['G#', 'b', 4], ['A', 'w', 6], ['A#', 'b', 5], ['B', 'w', 7]];
  /* the 12 semitones above Sa: [index into the 7 swar names, variant '' | 'k' (komal) | 't' (teevra)] */
  var SWAR12 = [[0, ''], [1, 'k'], [1, ''], [2, 'k'], [2, ''], [3, ''], [3, 't'], [4, ''], [5, 'k'], [5, ''], [6, 'k'], [6, '']];
  var SA_OPTIONS = ['C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3', 'C4', 'C#4', 'D4'];
  var INSTRUMENTS = { guitar: [40, 45, 50, 55, 59, 64], ukulele: [67, 60, 64, 69], violin: [55, 62, 69, 76], any: [] };

  function midiToHz(m, a4) { return (a4 || 440) * Math.pow(2, (m - 69) / 12); }
  function hzToMidi(hz, a4) { return 69 + 12 * Math.log2(hz / (a4 || 440)); }
  function midiName(m) { return NOTE_NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1); }
  function noteName(hz, a4) { return midiName(Math.round(hzToMidi(hz, a4))); }
  function nameToMidi(name) { var m = /^([A-G]#?)(-?\d)$/.exec(name); if (!m) return 60; return NOTE_NAMES.indexOf(m[1]) + (parseInt(m[2], 10) + 1) * 12; }
  /* where a frequency sits relative to Sa: semitones (rounded), index 0–11, octave (0 = madhya), cents off (−50…50) */
  function swarOf(hz, sa) {
    var st = 12 * Math.log2(hz / sa), r = Math.round(st);
    return { semis: r, idx: ((r % 12) + 12) % 12, oct: Math.floor(r / 12), cents: (st - r) * 100 };
  }
  function foldCents(c) { return ((c % 1200) + 1800) % 1200 - 600; }

  /* YIN pitch detector: (Float32Array buffer, sampleRate) → { hz, confidence (0–1), rms }. hz = 0 when unsure. */
  function detectPitch(buf, sr, opts) {
    opts = opts || {};
    var fmin = opts.fmin || 55, fmax = opts.fmax || 1100, thr = opts.threshold || 0.2, minRms = opts.minRms === undefined ? 0.01 : opts.minRms;
    var n = buf.length, i, v, rms = 0;
    for (i = 0; i < n; i++) { v = buf[i]; rms += v * v; }
    rms = Math.sqrt(rms / n);
    if (!(rms > minRms)) return { hz: 0, confidence: 0, rms: rms };
    var W = n >> 1;
    var tauMin = Math.max(2, Math.floor(sr / fmax)), tauMax = Math.min(W - 2, Math.ceil(sr / fmin));
    if (tauMax <= tauMin + 2) return { hz: 0, confidence: 0, rms: rms };
    var d = new Float32Array(tauMax + 2), tau, j, s, diff;
    for (tau = 1; tau <= tauMax + 1; tau++) {
      s = 0;
      for (j = 0; j < W; j++) { diff = buf[j] - buf[j + tau]; s += diff * diff; }
      d[tau] = s;
    }
    var cm = new Float32Array(tauMax + 2), run = 0;
    cm[0] = 1;
    for (tau = 1; tau <= tauMax + 1; tau++) { run += d[tau]; cm[tau] = run > 0 ? d[tau] * tau / run : 1; }
    var best = -1;
    for (tau = tauMin; tau <= tauMax; tau++) {
      if (cm[tau] < thr) {
        /* take the lowest point of the whole dip below the threshold, not the first small ripple:
           noise makes wide low-pitch dips bumpy, and stopping at the first ripple reads sharp */
        best = tau;
        while (tau + 1 <= tauMax && cm[tau + 1] < thr) { tau++; if (cm[tau] < cm[best]) best = tau; }
        break;
      }
    }
    if (best < 0) { best = tauMin; for (tau = tauMin + 1; tau <= tauMax; tau++) if (cm[tau] < cm[best]) best = tau; }
    var x0 = cm[best - 1], x1 = cm[best], x2 = cm[best + 1];
    var den = x0 - 2 * x1 + x2, shift = den !== 0 ? 0.5 * (x0 - x2) / den : 0;
    if (shift > 1) shift = 1; else if (shift < -1) shift = -1;
    var hz = sr / (best + shift), conf = 1 - x1;
    if (conf < 0) conf = 0; if (conf > 1) conf = 1;
    if (!(hz >= fmin && hz <= fmax)) return { hz: 0, confidence: 0, rms: rms };
    return { hz: hz, confidence: conf, rms: rms };
  }

  /* Score sung notes. targets: [{hz, start, end}] (seconds), samples: [{t, hz, conf}] → { total 0–100, notes: [{cents|null, score}] }.
     Octave errors are forgiven (a Sa sung an octave lower is still Sa). */
  function scoreNotes(targets, samples, opts) {
    opts = opts || {};
    var minConf = opts.conf === undefined ? 0.5 : opts.conf, notes = [], sum = 0, i, k, tg, a, b, hzs, s, med, c, sc;
    for (i = 0; i < targets.length; i++) {
      tg = targets[i]; hzs = [];
      a = tg.start + (tg.end - tg.start) * 0.2; b = tg.end - (tg.end - tg.start) * 0.1;
      for (k = 0; k < samples.length; k++) {
        s = samples[k];
        if (s.t >= a && s.t <= b && s.hz > 0 && (s.conf === undefined || s.conf >= minConf)) hzs.push(s.hz);
      }
      if (hzs.length < 2) { notes.push({ cents: null, score: 0 }); continue; }
      hzs.sort(function (x, y) { return x - y; });
      med = hzs[hzs.length >> 1];
      c = foldCents(1200 * Math.log2(med / tg.hz));
      sc = Math.max(0, Math.min(100, 100 - Math.max(0, Math.abs(c) - 10) * 2.5));
      notes.push({ cents: Math.round(c), score: Math.round(sc) });
      sum += sc;
    }
    return { total: targets.length ? Math.round(sum / targets.length) : 0, notes: notes };
  }
  function zoneOf(cents) { var a = Math.abs(cents); return a <= 10 ? 'ok' : (a <= 25 ? 'near' : 'off'); }

  /* ================================================================ settings */
  var DEF = { sa: 'C#3', dtype: 'pa', vol: 70, taal: 'teentaal', bpm: 80, a4: 440, inst: 'guitar', noise: 'normal', alk: 0, speed: 'medium', hold: 0, tab: 'sur', guide: true, best: {}, holdBest: 0 };
  var S = Object.assign({}, DEF, store.get('settings', {}) || {});
  (function sanitize() {
    if (SA_OPTIONS.indexOf(S.sa) < 0) S.sa = DEF.sa;
    if (!TAALS[S.taal]) S.taal = DEF.taal;
    S.bpm = EDU.clamp(parseInt(S.bpm, 10) || DEF.bpm, 40, 200);
    S.vol = EDU.clamp(parseInt(S.vol, 10) || 0, 0, 100);
    S.a4 = EDU.clamp(parseInt(S.a4, 10) || 440, 415, 466);
    if (!INSTRUMENTS[S.inst]) S.inst = 'guitar';
    if (['quiet', 'normal', 'noisy'].indexOf(S.noise) < 0) S.noise = 'normal';
    if (['slow', 'medium', 'fast'].indexOf(S.speed) < 0) S.speed = 'medium';
    if (['pa', 'ma'].indexOf(S.dtype) < 0) S.dtype = 'pa';
    S.alk = EDU.clamp(parseInt(S.alk, 10) || 0, 0, ALK.length - 1);
    S.hold = EDU.clamp(parseInt(S.hold, 10) || 0, 0, 12);
    if (['sur', 'sargam', 'taal', 'tuner'].indexOf(S.tab) < 0) S.tab = 'sur';
    if (!S.best || typeof S.best !== 'object') S.best = {};
    S.holdBest = EDU.clamp(parseFloat(S.holdBest) || 0, 0, 3);
  })();
  function save() { store.set('settings', S); }
  function saHz() { return midiToHz(nameToMidi(S.sa), S.a4); }
  var NOISE = { quiet: { minRms: 0.004, conf: 0.6 }, normal: { minRms: 0.01, conf: 0.72 }, noisy: { minRms: 0.025, conf: 0.85 } };

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ================================================================ audio engine */
  var AC = window.AudioContext || window.webkitAudioContext;
  var A = { ctx: null, master: null, droneBus: null, taalBus: null, guideBus: null, noise: null, stringWave: null, guideWave: null };
  function audio() {
    if (!AC) return null;
    if (!A.ctx) {
      try { A.ctx = new AC(); } catch (e) { A.ctx = null; return null; }
      var c = A.ctx;
      A.master = c.createGain(); A.master.connect(c.destination);
      A.droneBus = c.createGain(); A.droneBus.gain.value = 0.55; A.droneBus.connect(A.master);
      A.taalBus = c.createGain(); A.taalBus.gain.value = 0.9; A.taalBus.connect(A.master);
      A.guideBus = c.createGain(); A.guideBus.gain.value = 0.5; A.guideBus.connect(A.master);
      var i, n, real, imag;
      // tanpura string: many harmonics with a "jawari" brightness around the 5th–8th
      real = new Float32Array(24); imag = new Float32Array(24);
      for (n = 1; n < 24; n++) imag[n] = (1 / Math.pow(n, 0.95)) * (1 + 0.7 * Math.exp(-Math.pow(n - 6.5, 2) / 10));
      A.stringWave = c.createPeriodicWave(real, imag, { disableNormalization: false });
      // guide / reference tone: soft flute-like
      real = new Float32Array(6); imag = new Float32Array(6);
      imag[1] = 1; imag[2] = 0.45; imag[3] = 0.18; imag[4] = 0.06; imag[5] = 0.03;
      A.guideWave = c.createPeriodicWave(real, imag);
      // one second of white noise for tabla strokes
      A.noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
      var data = A.noise.getChannelData(0);
      for (i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      applyVolume();
    }
    if (A.ctx.state === 'suspended' && A.ctx.resume) { try { A.ctx.resume().catch(noop); } catch (e) { } }
    return A.ctx;
  }
  function applyVolume() { if (A.master) A.master.gain.value = Math.pow(S.vol / 100, 1.5); }
  function now() { return A.ctx ? A.ctx.currentTime : 0; }

  /* ---------------- tanpura ---------------- */
  var drone = { on: false, timer: 0, next: 0, step: 0, voices: [] };
  function droneFreqs() {
    var sa = saHz();
    var first = S.dtype === 'ma' ? sa * 2 / 3 : sa * 0.75;        // mandra Ma or mandra Pa
    return [first, sa, sa * 1.0015, sa / 2];                        // Pa/Ma · Sa · Sa (jodi) · kharaj Sa
  }
  function pluck(when, f, vol) {
    var c = A.ctx, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
    o.setPeriodicWave(A.stringWave); o2.setPeriodicWave(A.stringWave);
    o.frequency.value = f; o2.frequency.value = f; o2.detune.value = 4;
    lp.type = 'lowpass'; lp.Q.value = 0.8;
    lp.frequency.setValueAtTime(Math.min(5000, f * 24), when);
    lp.frequency.exponentialRampToValueAtTime(Math.max(600, f * 5), when + 3.2);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.025);
    g.gain.exponentialRampToValueAtTime(vol * 0.4, when + 0.7);
    g.gain.exponentialRampToValueAtTime(0.0004, when + 4.2);
    o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(A.droneBus);
    o.start(when); o2.start(when); o.stop(when + 4.4); o2.stop(when + 4.4);
    var v = { g: g, o: [o, o2], end: when + 4.5 };
    drone.voices.push(v);
    drone.voices = drone.voices.filter(function (x) { return x.end > c.currentTime; });
  }
  function droneTick() {
    var c = A.ctx; if (!c) return;
    var fr = droneFreqs();
    while (drone.next < c.currentTime + 0.6) {
      pluck(drone.next, fr[drone.step], drone.step === 0 ? 0.42 : (drone.step === 3 ? 0.5 : 0.36));
      drone.step = (drone.step + 1) % 4;
      drone.next += 0.95;
    }
  }
  function droneKillVoices() {
    var c = A.ctx; if (!c) return;
    drone.voices.forEach(function (v) {
      try { v.g.gain.cancelScheduledValues(c.currentTime); v.g.gain.setValueAtTime(Math.max(v.g.gain.value, 0.0005), c.currentTime); v.g.gain.exponentialRampToValueAtTime(0.0004, c.currentTime + 0.18); } catch (e) { }
      v.o.forEach(function (o) { try { o.stop(c.currentTime + 0.2); } catch (e) { } });
    });
    drone.voices = [];
  }
  function droneStart() {
    var c = audio(); if (!c) { EDU.toast(t('err_unsupported')); return; }
    if (drone.on) return;
    drone.on = true; drone.step = 0; drone.next = c.currentTime + 0.05;
    droneTick();
    drone.timer = setInterval(droneTick, 150);
    renderTransport();
  }
  function droneStop() {
    if (drone.timer) { clearInterval(drone.timer); drone.timer = 0; }
    drone.on = false; droneKillVoices(); renderTransport();
  }
  function droneRetune() { if (!drone.on) return; droneKillVoices(); drone.step = 0; drone.next = A.ctx.currentTime + 0.05; droneTick(); }
  function droneToggle() { if (drone.on) droneStop(); else droneStart(); }

  /* ---------------- tabla-like strokes ---------------- */
  function env(g, when, peak, decay, attack) {
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), when + (attack || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, when + decay);
  }
  function sine(when, f0, f1, glide, peak, decay, bus) {
    var c = A.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f0, when);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, when + glide);
    env(g, when, peak, decay);
    o.connect(g); g.connect(bus || A.taalBus);
    o.start(when); o.stop(when + decay + 0.05);
  }
  function burst(when, type, freq, q, peak, decay) {
    var c = A.ctx, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = A.noise; src.loop = true;
    f.type = type; f.frequency.value = freq; f.Q.value = q || 1;
    env(g, when, peak, decay, 0.002);
    src.connect(f); f.connect(g); g.connect(A.taalBus);
    src.start(when, Math.random() * 0.8); src.stop(when + decay + 0.03);
  }
  function bassHz() { return EDU.clamp(saHz() / 2, 68, 125); }
  function dayanHz() { return EDU.clamp(saHz() * 2, 240, 520); }
  function bayan(when, v, open, high) {
    var f = bassHz() * (high ? 1.35 : 1);
    sine(when, f * 1.9, f, 0.09, 0.9 * v, open ? 0.5 : 0.12);
    burst(when, 'lowpass', 300, 0.7, 0.25 * v, 0.03);
  }
  function stroke(kind, when, v) {
    var d = dayanHz();
    if (kind === 'na') { burst(when, 'bandpass', 2600, 1.2, 0.35 * v, 0.035); sine(when, d, d, 0, 0.4 * v, 0.22); sine(when, d * 2.76, d * 2.76, 0, 0.1 * v, 0.09); }
    else if (kind === 'tin') { burst(when, 'bandpass', 3000, 1.5, 0.18 * v, 0.025); sine(when, d, d, 0, 0.36 * v, 0.55); sine(when, d * 2.0, d * 2.0, 0, 0.12 * v, 0.28); }
    else if (kind === 'ti') { burst(when, 'bandpass', 3600, 1, 0.4 * v, 0.03); sine(when, d * 1.5, d * 1.5, 0, 0.16 * v, 0.06); }
    else if (kind === 'ka') { burst(when, 'lowpass', 520, 0.8, 0.6 * v, 0.055); sine(when, 115, 80, 0.05, 0.4 * v, 0.07); }
    else if (kind === 'tun') { sine(when, d, d, 0, 0.34 * v, 0.75); sine(when, d * 1.5, d * 1.5, 0, 0.08 * v, 0.3); }
  }
  function playBol(key, when, v, beatDur) {
    switch (key) {
      case 'dha': bayan(when, v, true); stroke('na', when, v); break;
      case 'dhin': bayan(when, v, true); stroke('tin', when, v); break;
      case 'dhi': bayan(when, v, true); stroke('tin', when, v * 0.8); break;
      case 'na': stroke('na', when, v); break;
      case 'ta': stroke('na', when, v * 0.9); break;
      case 'tin': stroke('tin', when, v); break;
      case 'ti': stroke('ti', when, v); break;
      case 'ge': bayan(when, v, true); break;
      case 'ka': case 'kat': stroke('ka', when, v); break;
      case 'tu': bayan(when, v, true, true); stroke('tun', when, v); break;
      case 'dhage': bayan(when, v, true); stroke('na', when, v); bayan(when + beatDur / 2, v * 0.8, true); break;
      case 'tirakita': stroke('ti', when, v); stroke('ti', when + beatDur / 4, v * 0.7); stroke('ka', when + beatDur / 2, v * 0.8); stroke('na', when + beatDur * 3 / 4, v * 0.8); break;
      default: stroke('na', when, v);
    }
  }

  /* ---------------- taal metronome (look-ahead scheduler) ---------------- */
  var met = { on: false, timer: 0, next: 0, beat: 0, cycle: 0, queue: [], raf: 0, shown: -1 };
  function signAt(taal, beat1) { for (var i = 0; i < taal.vibhag.length; i++) if (taal.vibhag[i][0] === beat1) return taal.vibhag[i][1]; return ''; }
  function metTick() {
    var c = A.ctx; if (!c) return;
    var taal = TAALS[S.taal], dur = 60 / S.bpm;
    while (met.next < c.currentTime + 0.15) {
      var sign = signAt(taal, met.beat + 1);
      var v = sign === 'x' ? 1.3 : (sign === '0' ? 0.75 : (sign ? 1.1 : 0.95));
      playBol(taal.beats[met.beat], met.next, v, dur);
      met.queue.push({ t: met.next, b: met.beat, c: met.cycle });
      met.beat++;
      if (met.beat >= taal.beats.length) { met.beat = 0; met.cycle++; }
      met.next += dur;
    }
  }
  function metLoop() {
    met.raf = 0;
    if (!met.on) return;
    var c = A.ctx, cur = null;
    while (met.queue.length && met.queue[0].t <= c.currentTime + 0.02) cur = met.queue.shift();
    if (cur) showBeat(cur.b, cur.c);
    met.raf = requestAnimationFrame(metLoop);
  }
  function metStart() {
    var c = audio(); if (!c) { EDU.toast(t('err_unsupported')); return; }
    if (met.on) return;
    met.on = true; met.beat = 0; met.cycle = 0; met.queue = []; met.shown = -1;
    met.next = c.currentTime + 0.08;
    metTick();
    met.timer = setInterval(metTick, 40);
    metLoop();
    renderTransport();
  }
  function metStop() {
    if (met.timer) { clearInterval(met.timer); met.timer = 0; }
    if (met.raf) { cancelAnimationFrame(met.raf); met.raf = 0; }
    met.on = false; met.queue = [];
    showBeat(-1, met.cycle);
    renderTransport();
  }
  function metToggle() { if (met.on) metStop(); else metStart(); }
  function metRestartIfOn() { if (met.on) { metStop(); metStart(); } }

  /* ---------------- guide / reference tones ---------------- */
  var guideVoices = [];
  function guideTone(hz, when, dur, vol) {
    var c = A.ctx, o = c.createOscillator(), g = c.createGain();
    o.setPeriodicWave(A.guideWave); o.frequency.value = hz;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.03);
    g.gain.setValueAtTime(vol, when + Math.max(0.04, dur - 0.09));
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g); g.connect(A.guideBus);
    o.start(when); o.stop(when + dur + 0.05);
    guideVoices.push({ o: o, g: g, end: when + dur });
  }
  function guideStopAll() {
    var c = A.ctx; if (!c) return;
    guideVoices.forEach(function (v) { try { v.g.gain.cancelScheduledValues(c.currentTime); v.g.gain.setValueAtTime(0.0001, c.currentTime); v.o.stop(c.currentTime + 0.01); } catch (e) { } });
    guideVoices = [];
  }
  function hzOfSemis(semis) { return saHz() * Math.pow(2, semis / 12); }

  /* ================================================================ microphone */
  var mic = { state: 'idle', stream: null, src: null, an: null, sink: null, buf: null, timer: 0, msg: null };
  var hist = [];
  function errKey(e) {
    var n = (e && e.name) || '';
    if (n === 'NotAllowedError' || n === 'PermissionDeniedError' || n === 'SecurityError') return 'err_denied';
    if (n === 'NotFoundError' || n === 'DevicesNotFoundError' || n === 'OverconstrainedError') return 'err_nomic';
    if (n === 'NotReadableError' || n === 'TrackStartError' || n === 'AbortError') return 'err_busy';
    return 'err_other';
  }
  function setMsg(key, vars) { mic.msg = key ? { key: key, vars: vars } : null; renderMic(); }
  function micSetState(s) { mic.state = s; renderMic(); }
  function startMic() {
    if (mic.state !== 'idle') return Promise.resolve(mic.state === 'live');
    setMsg(null);
    var md = navigator.mediaDevices;
    if (!md || !md.getUserMedia) { setMsg(window.isSecureContext === false ? 'err_insecure' : 'err_unsupported'); return Promise.resolve(false); }
    var c = audio();
    if (!c) { setMsg('err_unsupported'); return Promise.resolve(false); }
    micSetState('wait');
    var gum = function () { return new Promise(function (res) { res(md.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })); }); };
    return gum().then(function (stream) {
      if (mic.state !== 'wait') { stream.getTracks().forEach(function (tr) { tr.stop(); }); return false; }
      mic.stream = stream;
      mic.src = c.createMediaStreamSource(stream);
      mic.an = c.createAnalyser(); mic.an.fftSize = 4096; mic.an.smoothingTimeConstant = 0;
      mic.buf = new Float32Array(mic.an.fftSize);
      mic.src.connect(mic.an);
      try { mic.sink = c.createGain(); mic.sink.gain.value = 0; mic.an.connect(mic.sink); mic.sink.connect(c.destination); } catch (e) { mic.sink = null; }
      var tr = stream.getAudioTracks()[0];
      if (tr) tr.addEventListener('ended', function () { if (mic.stream === stream) { stopMic(); setMsg('err_ended'); } });
      if (c.state !== 'running' && c.resume) c.resume().catch(noop);
      hist = [];
      mic.timer = setInterval(micFrame, 50);
      micSetState('live');
      return true;
    }).catch(function (e) {
      micCleanup(); micSetState('idle');
      var k = errKey(e);
      setMsg(k, k === 'err_other' ? { name: (e && e.name) || 'Error' } : null);
      return false;
    });
  }
  function micCleanup() {
    if (mic.timer) { clearInterval(mic.timer); mic.timer = 0; }
    if (mic.stream) mic.stream.getTracks().forEach(function (tr) { try { tr.stop(); } catch (e) { } });
    [mic.src, mic.an, mic.sink].forEach(function (n) { if (n) { try { n.disconnect(); } catch (e) { } } });
    mic.stream = mic.src = mic.an = mic.sink = null;
  }
  function stopMic() { micCleanup(); micSetState('idle'); hist = []; onPitch({ hz: 0, confidence: 0 }, true); }
  function micToggle() { if (mic.state === 'live') stopMic(); else if (mic.state === 'idle') startMic(); }
  function micFrame() {
    if (!mic.an) return;
    mic.an.getFloatTimeDomainData(mic.buf);
    var r = detectPitch(mic.buf, A.ctx.sampleRate, { minRms: NOISE[S.noise].minRms });
    if (r.confidence < NOISE[S.noise].conf) r = { hz: 0, confidence: r.confidence, rms: r.rms };
    onPitch(r);
  }
  /* Smooth with a short median and hand the pitch to the active views. */
  function onPitch(r, quiet) {
    var hz = r && r.hz > 0 ? r.hz : 0;
    hist.push(hz); if (hist.length > 5) hist.shift();
    var valid = hist.filter(function (x) { return x > 0; });
    var shown = 0;
    if (valid.length >= 3) { valid.sort(function (a, b) { return a - b; }); shown = valid[valid.length >> 1]; }
    else if (hist.length < 3 && hz > 0) shown = hz;
    var tm = A.ctx ? A.ctx.currentTime : performance.now() / 1000;
    if (alk.phase === 'sing' && hz > 0) alk.samples.push({ t: tm - alk.t0, hz: hz, conf: 1 });
    renderSur(shown, quiet);
    renderTuner(shown, quiet);
    holdStep(shown);
  }

  /* ================================================================ DOM: elements */
  var E = {
    sa: $('#st-sa'), drone: $('#st-drone'), droneTxt: $('#st-drone-txt'), taal: $('#st-taal'), taalTxt: $('#st-taal-txt'), vol: $('#st-vol'),
    pill: $('#st-beatpill'), pillTxt: $('#st-beatpill-txt'), tabs: $('#st-tabs'),
    stage: $('#st-stage'), swar: $('#st-swar'), tags: $('#st-swar-tags'), meter: $('#st-meter'), judge: $('#st-judge'), note: $('#st-note'), hz: $('#st-hz'), cents: $('#st-cents'),
    msg: $('#st-msg'), tipHead: $('#st-tip-head'), noise: $('#st-noise'), dtype: $('#st-dtype'),
    alkSel: $('#st-alk'), speed: $('#st-speed'), seq: $('#st-seq'), alkPhase: $('#st-alk-phase'), alkGo: $('#st-alk-go'), alkGoTxt: $('#st-alk-go-txt'), alkStop: $('#st-alk-stop'), alkGuide: $('#st-alk-guide'),
    alkScore: $('#st-alk-score'), alkVerdict: $('#st-alk-verdict'), alkBest: $('#st-alk-best'),
    holdSel: $('#st-hold-sel'), holdHear: $('#st-hold-hear'), holdBar: $('#st-hold-bar'), holdStatus: $('#st-hold-status'), holdBest: $('#st-hold-best'),
    circle: $('#st-circle'), bols: $('#st-bols'), beatTxt: $('#st-beat-txt'), taal2: $('#st-taal2'), taal2Txt: $('#st-taal2-txt'), taalSel: $('#st-taalsel'),
    bpm: $('#st-bpm'), bpmVal: $('#st-bpm-val'), laya: $('#st-laya'), bpmMinus: $('#st-bpm-minus'), bpmPlus: $('#st-bpm-plus'),
    tstage: $('#st-tstage'), tnote: $('#st-tnote'), tmeter: $('#st-tmeter'), tjudge: $('#st-tjudge'), thz: $('#st-thz'), tcents: $('#st-tcents'), tnear: $('#st-tnear'),
    inst: $('#st-inst'), strings: $('#st-strings'), a4: $('#st-a4'), reset: $('#st-reset')
  };
  var tab = S.tab;

  /* ---------------- swar labels ---------------- */
  function swarText(semis) {
    var idx = ((semis % 12) + 12) % 12, oct = Math.floor(semis / 12), w = SWAR12[idx], c = C();
    var name = c.swar[w[0]];
    if (EDU.lang === 'en' && w[1] === 'k') name = name.toLowerCase();
    return { name: name, variant: w[1], oct: oct };
  }
  function swarFull(semis) {
    var s = swarText(semis), extra = [];
    if (s.variant === 'k') extra.push(t('komal'));
    if (s.variant === 't') extra.push(t('teevra'));
    if (s.oct > 0) extra.push(t('octave_taar'));
    if (s.oct < 0) extra.push(t('octave_mandra'));
    return s.name + (extra.length ? ' (' + extra.join(', ') + ')' : '');
  }
  function swarCell(semis, extraClass) {
    var s = swarText(semis);
    var cell = el('span', { class: 'st-cell no-i18n' + (extraClass ? ' ' + extraClass : '') }, el('span', null, s.name, s.oct > 0 ? el('small', null, '•') : null));
    if (s.variant === 'k') cell.title = t('komal');
    if (s.variant === 't') cell.title = t('teevra');
    return cell;
  }

  /* ---------------- cents meter (SVG) ---------------- */
  function buildMeter(svg) {
    var W = 520, x0 = 30, x1 = 490, mid = 260, px = (x1 - x0) / 100, y = 36, h = 36;
    var NS = 'http://www.w3.org/2000/svg';
    function n(tag, attrs) { var e = document.createElementNS(NS, tag); Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); }); return e; }
    var title = svg.querySelector('title');
    while (svg.lastChild && svg.lastChild !== title) svg.removeChild(svg.lastChild);
    svg.appendChild(n('rect', { class: 'zone-off', x: x0, y: y, width: 25 * px, height: h, rx: 8 }));
    svg.appendChild(n('rect', { class: 'zone-off', x: mid + 25 * px, y: y, width: 25 * px, height: h, rx: 8 }));
    svg.appendChild(n('rect', { class: 'zone-near', x: mid - 25 * px, y: y, width: 15 * px, height: h }));
    svg.appendChild(n('rect', { class: 'zone-near', x: mid + 10 * px, y: y, width: 15 * px, height: h }));
    svg.appendChild(n('rect', { class: 'zone-ok', x: mid - 10 * px, y: y, width: 20 * px, height: h }));
    svg.appendChild(n('rect', { class: 'frame', x: x0, y: y, width: x1 - x0, height: h, rx: 8 }));
    for (var c = -50; c <= 50; c += 10) {
      var x = mid + c * px;
      svg.appendChild(n('line', { class: 'tick', x1: x, y1: y + h, x2: x, y2: y + h + (c % 25 === 0 ? 8 : 4) }));
    }
    [-50, -25, 0, 25, 50].forEach(function (c) {
      var tx = n('text', { x: mid + c * px, y: y + h + 22, 'text-anchor': 'middle' });
      tx.textContent = c > 0 ? '+' + c : String(c);
      svg.appendChild(tx);
    });
    svg.appendChild(n('line', { class: 'center', x1: mid, y1: y - 8, x2: mid, y2: y + h + 8 }));
    var needle = n('g', { class: 'needle-g' });
    needle.appendChild(n('line', { class: 'needle', x1: mid, y1: y - 10, x2: mid, y2: y + h + 10 }));
    needle.appendChild(n('circle', { class: 'needle-cap', cx: mid, cy: y - 14, r: 6 }));
    svg.appendChild(needle);
    svg._needle = needle; svg._px = px;
    svg.setAttribute('viewBox', '0 0 ' + W + ' 110');
  }
  function setNeedle(svg, cents) {
    if (!svg._needle) buildMeter(svg);
    var c = cents === null ? 0 : EDU.clamp(cents, -50, 50);
    svg._needle.style.transform = 'translate(' + (c * svg._px) + 'px, 0)';
    svg._needle.style.opacity = cents === null ? 0.25 : 1;
  }

  /* ================================================================ transport + quick strip */
  function fillSa() {
    E.sa.innerHTML = '';
    SA_OPTIONS.forEach(function (name) {
      var m = nameToMidi(name), k = KEY_INFO[((m % 12) + 12) % 12];
      var label = name + ' · ' + t(k[1] === 'w' ? 'key_white' : 'key_black', { n: k[2] }) + ' · ' + t('hz_n', { n: Math.round(midiToHz(m, S.a4)) });
      E.sa.appendChild(el('option', { value: name, text: label }));
    });
    E.sa.value = S.sa;
  }
  function renderTransport() {
    E.drone.setAttribute('aria-pressed', drone.on ? 'true' : 'false');
    E.droneTxt.textContent = t(drone.on ? 'drone_stop' : 'drone_play');
    E.drone.firstChild.textContent = drone.on ? '■ ' : '▶ ';
    [[E.taal, E.taalTxt], [E.taal2, E.taal2Txt]].forEach(function (p) {
      p[0].setAttribute('aria-pressed', met.on ? 'true' : 'false');
      p[1].textContent = t(met.on ? 'taal_stop' : 'taal_play');
      p[0].firstChild.textContent = met.on ? '■ ' : '▶ ';
    });
    E.pill.hidden = !met.on;
    if (!met.on) { E.pill.dataset.on = '0'; E.pillTxt.textContent = ''; }
    E.tipHead.dataset.show = (mic.state === 'live' && (drone.on || met.on)) ? '1' : '0';
  }

  /* ================================================================ SUR pane */
  function renderSur(hz, quiet) {
    var live = mic.state === 'live';
    if (!hz) {
      E.swar.textContent = '—'; E.swar.dataset.empty = '1'; E.tags.innerHTML = ''; E.stage.dataset.zone = ''; E.judge.dataset.zone = '';
      E.judge.textContent = live && !quiet ? t('no_note') : '';
      E.note.textContent = '—'; E.hz.textContent = '—'; E.cents.textContent = '—';
      setNeedle(E.meter, null);
      return;
    }
    var w = swarOf(hz, saHz()), s = swarText(w.semis), zone = zoneOf(w.cents);
    E.swar.innerHTML = ''; E.swar.dataset.empty = '0';
    E.swar.appendChild(document.createTextNode(s.name));
    if (s.oct > 0) E.swar.appendChild(el('small', null, '•'));
    E.tags.innerHTML = '';
    if (s.variant === 'k') E.tags.appendChild(el('span', { class: 'badge accent', text: t('komal') }));
    if (s.variant === 't') E.tags.appendChild(el('span', { class: 'badge accent', text: t('teevra') }));
    if (s.oct > 0) E.tags.appendChild(el('span', { class: 'badge', text: t('octave_taar') }));
    if (s.oct < 0) E.tags.appendChild(el('span', { class: 'badge', text: t('octave_mandra') }));
    E.stage.dataset.zone = zone; E.judge.dataset.zone = zone;
    E.judge.textContent = t(zone === 'ok' ? 'in_tune' : (w.cents < 0 ? 'flat' : 'sharp'));
    E.note.textContent = noteName(hz, S.a4);
    E.hz.textContent = t('hz_n', { n: EDU.fmt(Math.round(hz)) });
    E.cents.textContent = (w.cents > 0 ? '+' : '') + Math.round(w.cents);
    setNeedle(E.meter, w.cents);
  }
  function renderMic() {
    $$('.st-mic').forEach(function (b) {
      b.dataset.mic = mic.state;
      b.setAttribute('aria-pressed', mic.state === 'live' ? 'true' : 'false');
      b.disabled = mic.state === 'wait';
      $('.st-mic-txt', b).textContent = t(mic.state === 'live' ? 'mic_stop' : (mic.state === 'wait' ? 'st_wait' : 'mic_start'));
    });
    var txt = mic.msg ? t(mic.msg.key, mic.msg.vars) : '';
    $$('.st-msg').forEach(function (m) { m.textContent = txt; });
    $('#st-perm-hint').hidden = mic.state !== 'idle' || !!mic.msg;
    renderTransport();
  }

  /* ================================================================ SARGAM pane */
  var alk = { phase: 'ready', notes: [], t0: 0, samples: [], timer: 0, raf: 0, result: null };
  var SPEED = { slow: 0.9, medium: 0.6, fast: 0.4 };
  function buildNotes(def, beat) {
    var notes = [], tm = 0, gi, ni, g;
    for (gi = 0; gi < def.groups.length; gi++) {
      g = def.groups[gi];
      for (ni = 0; ni < g.length; ni++) { notes.push({ semis: g[ni], hz: hzOfSemis(g[ni]), start: tm, end: tm + beat * def.hold, group: gi }); tm += beat * def.hold; }
      tm += beat * 0.35;
    }
    return notes;
  }
  function fillAlk() {
    E.alkSel.innerHTML = '';
    ALK.forEach(function (d, i) { E.alkSel.appendChild(el('option', { value: String(i), text: (i + 1) + '. ' + t('alk_' + (i + 1)) })); });
    E.alkSel.value = String(S.alk);
  }
  function renderSeq() {
    var def = ALK[S.alk], res = alk.result;
    E.seq.innerHTML = '';
    var k = 0;
    def.groups.forEach(function (g, gi) {
      if (gi) E.seq.appendChild(el('span', { class: 'st-sep', text: '·' }));
      g.forEach(function (semis) {
        var cell = swarCell(semis);
        cell.dataset.i = k;
        if (res && res.notes[k]) {
          var r = res.notes[k];
          cell.dataset.grade = r.cents === null ? 'none' : zoneOf(r.cents);
          cell.appendChild(el('small', null, r.cents === null ? '—' : (r.cents > 0 ? '+' + r.cents : String(r.cents))));
        }
        E.seq.appendChild(cell);
        k++;
      });
    });
  }
  function alkHighlight(i) {
    $$('.st-cell', E.seq).forEach(function (c) { c.dataset.now = (+c.dataset.i === i) ? '1' : '0'; });
  }
  function alkLoop() {
    alk.raf = 0;
    if (alk.phase !== 'listen' && alk.phase !== 'sing') return;
    var rel = now() - alk.t0, cur = -1;
    for (var i = 0; i < alk.notes.length; i++) if (rel >= alk.notes[i].start && rel < alk.notes[i].end) { cur = i; break; }
    alkHighlight(cur);
    alk.raf = requestAnimationFrame(alkLoop);
  }
  function alkRenderPhase() {
    E.alkPhase.textContent = t(alk.phase === 'listen' ? 'alk_phase_listen' : (alk.phase === 'sing' ? 'alk_phase_sing' : (alk.phase === 'done' ? 'alk_phase_done' : 'alk_phase_ready')));
    E.alkGoTxt.textContent = t(alk.phase === 'ready' || alk.phase === 'done' ? 'alk_listen' : (alk.phase === 'listen' ? 'alk_skip' : 'alk_listen'));
    E.alkGo.disabled = alk.phase === 'sing';
    E.alkStop.disabled = alk.phase === 'ready' || alk.phase === 'done';
    var res = alk.result;
    E.alkScore.textContent = res ? EDU.fmt(res.total) : '—';
    E.alkVerdict.textContent = res ? (res.noMic ? t('alk_mic_needed') : t(res.total >= 80 ? 'alk_good' : (res.total >= 50 ? 'alk_ok' : 'alk_poor'))) : '';
    E.alkVerdict.dataset.zone = res && !res.noMic ? (res.total >= 80 ? 'ok' : (res.total >= 50 ? 'near' : 'off')) : '';
    var best = S.best[S.alk];
    E.alkBest.textContent = best !== undefined ? t('alk_best', { n: EDU.fmt(best) }) : '';
    E.alkBest.hidden = best === undefined;
  }
  function alkStart() {
    var c = audio(); if (!c) { EDU.toast(t('err_unsupported')); return; }
    if (alk.phase === 'listen') { alkSing(); return; }          // "skip": go straight to singing
    if (alk.phase === 'sing') return;
    if (mic.state === 'idle') startMic();                         // a button press: the permission prompt is fine here
    alk.result = null; renderSeq();
    alk.notes = buildNotes(ALK[S.alk], SPEED[S.speed]);
    alk.phase = 'listen';
    alk.t0 = c.currentTime + 0.3;
    guideStopAll();
    alk.notes.forEach(function (n) { guideTone(n.hz, alk.t0 + n.start, n.end - n.start - 0.03, 0.8); });
    var total = alk.notes[alk.notes.length - 1].end;
    clearTimeout(alk.timer);
    alk.timer = setTimeout(alkSing, (total + 0.9) * 1000);
    alkRenderPhase();
    if (!alk.raf) alkLoop();
  }
  function alkSing() {
    var c = A.ctx; if (!c) return;
    clearTimeout(alk.timer); guideStopAll();
    alk.phase = 'sing'; alk.samples = [];
    alk.t0 = c.currentTime + 0.7;
    if (E.alkGuide.checked) alk.notes.forEach(function (n) { guideTone(n.hz, alk.t0 + n.start, n.end - n.start - 0.03, 0.22); });
    var total = alk.notes[alk.notes.length - 1].end;
    alk.timer = setTimeout(alkFinish, (total + 0.7 + 0.3) * 1000);
    alkRenderPhase();
    if (!alk.raf) alkLoop();
  }
  function alkFinish() {
    clearTimeout(alk.timer);
    var res = scoreNotes(alk.notes, alk.samples);
    res.noMic = mic.state !== 'live' && !alk.samples.length;
    alk.result = res; alk.phase = 'done';
    if (!res.noMic && (S.best[S.alk] === undefined || res.total > S.best[S.alk])) { S.best[S.alk] = res.total; save(); }
    alkHighlight(-1); renderSeq(); alkRenderPhase();
  }
  function alkStop() {
    clearTimeout(alk.timer); guideStopAll();
    alk.phase = 'ready'; alk.result = null;
    alkHighlight(-1); renderSeq(); alkRenderPhase();
  }

  /* ---------------- hold the swar ---------------- */
  var hold = { steady: 0, last: 0, offSince: 0, done: false };
  function fillHold() {
    E.holdSel.innerHTML = '';
    for (var s = 0; s <= 12; s++) E.holdSel.appendChild(el('option', { value: String(s), text: swarFull(s) }));
    E.holdSel.value = String(S.hold);
  }
  function holdRender() {
    var frac = Math.min(1, hold.steady / 3);
    E.holdBar.firstChild.style.width = (frac * 100).toFixed(1) + '%';
    E.holdBar.dataset.done = hold.done ? '1' : '0';
    E.holdStatus.dataset.zone = hold.done ? 'ok' : (hold.steady > 0 ? 'near' : '');
    E.holdStatus.textContent = hold.done ? t('hold_done') : (mic.state === 'live' ? t('hold_progress', { n: hold.steady.toFixed(1) }) : t('hold_hint'));
    E.holdBest.textContent = S.holdBest > 0 ? t('hold_best', { n: S.holdBest.toFixed(1) }) : '';
  }
  function holdStep(hz) {
    if (tab !== 'sargam') return;
    var tm = performance.now() / 1000;
    if (hz > 0) {
      var c = foldCents(1200 * Math.log2(hz / hzOfSemis(S.hold)));
      if (Math.abs(c) <= 20) {
        if (hold.last) hold.steady = Math.min(3, hold.steady + Math.min(0.3, tm - hold.last));
        hold.last = tm; hold.offSince = 0;
        if (hold.steady >= 3 && !hold.done) { hold.done = true; if (hold.steady > S.holdBest) { S.holdBest = 3; save(); } }
        if (hold.steady > S.holdBest) { S.holdBest = Math.round(hold.steady * 10) / 10; save(); }
        holdRender();
        return;
      }
    }
    hold.last = 0;
    if (!hold.offSince) hold.offSince = tm;
    else if (tm - hold.offSince > 0.6 && (hold.steady > 0 || hold.done)) { hold.steady = 0; hold.done = false; hold.offSince = 0; holdRender(); }
  }

  /* ================================================================ TAAL pane */
  var circleBeads = [];
  function buildCircle() {
    var svg = E.circle, taal = TAALS[S.taal], N = taal.beats.length, NS = 'http://www.w3.org/2000/svg';
    function n(tag, attrs) { var e = document.createElementNS(NS, tag); Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); }); return e; }
    var title = svg.querySelector('title');
    while (svg.lastChild && svg.lastChild !== title) svg.removeChild(svg.lastChild);
    var cx = 180, cy = 180, R = 132, r = N > 12 ? 15 : (N > 8 ? 17 : 20);
    svg.appendChild(n('circle', { class: 'ring', cx: cx, cy: cy, r: R }));
    circleBeads = [];
    for (var i = 0; i < N; i++) {
      var ang = -Math.PI / 2 + (i / N) * Math.PI * 2, x = cx + R * Math.cos(ang), y = cy + R * Math.sin(ang);
      var sign = signAt(taal, i + 1);
      var bead = n('circle', { class: 'bead' + (sign === 'x' ? ' sam' : '') + (sign === '0' ? ' khali' : ''), cx: x, cy: y, r: r });
      svg.appendChild(bead);
      var num = n('text', { class: 'num', x: x, y: y }); num.textContent = String(i + 1); svg.appendChild(num);
      if (sign) { var v = n('text', { class: 'vib', x: cx + (R + 34) * Math.cos(ang), y: cy + (R + 34) * Math.sin(ang) }); v.textContent = sign === 'x' ? '×' : sign; svg.appendChild(v); }
      circleBeads.push(bead);
    }
    var midBol = n('text', { class: 'mid-bol no-i18n', x: cx, y: cy - 8 }); midBol.textContent = ''; svg.appendChild(midBol);
    var midNum = n('text', { class: 'mid-num no-i18n', x: cx, y: cy + 30 }); svg.appendChild(midNum);
    svg._midBol = midBol; svg._midNum = midNum;
    svg.dataset.beat = '0';
  }
  function buildBols() {
    var taal = TAALS[S.taal], bols = C().bols;
    E.bols.innerHTML = '';
    taal.beats.forEach(function (key, i) {
      var sign = signAt(taal, i + 1);
      if (sign) E.bols.appendChild(el('span', { class: 'st-vsep no-i18n', text: (i ? '| ' : '') + (sign === 'x' ? '×' : sign) }));
      E.bols.appendChild(el('span', { class: 'st-bol no-i18n' + (sign === 'x' ? ' sam' : '') + (sign === '0' ? ' khali' : ''), dataset: { i: i } }, bols[key] || key, el('small', null, String(i + 1))));
    });
    E.beatTxt.textContent = met.on ? E.beatTxt.textContent : t('taal_ready', { n: taal.beats.length });
  }
  function showBeat(b, cycle) {
    var taal = TAALS[S.taal], N = taal.beats.length;
    circleBeads.forEach(function (bead, i) { bead.classList.toggle('on', i === b); });
    $$('.st-bol', E.bols).forEach(function (x) { x.dataset.on = (+x.dataset.i === b) ? '1' : '0'; });
    E.circle.dataset.beat = String(b + 1);
    E.circle.dataset.cycle = String(cycle || 0);
    if (b >= 0) {
      E.circle._midBol.textContent = C().bols[taal.beats[b]] || taal.beats[b];
      E.circle._midNum.textContent = (b + 1) + ' / ' + N;
      E.beatTxt.textContent = t('beat_of', { n: b + 1, total: N });
      E.pillTxt.textContent = t('beat_of', { n: b + 1, total: N });
      E.pill.dataset.on = (b === 0 || signAt(taal, b + 1)) ? '1' : '0';
    } else {
      E.circle._midBol.textContent = ''; E.circle._midNum.textContent = '';
      E.beatTxt.textContent = t('taal_ready', { n: N });
    }
  }
  function layaKey(bpm) { return bpm < 80 ? 'laya_vilambit' : (bpm <= 140 ? 'laya_madhya' : 'laya_drut'); }
  function renderTempo() {
    E.bpm.value = S.bpm;
    E.bpmVal.textContent = t('bpm_n', { n: EDU.fmt(S.bpm) });
    E.laya.textContent = '· ' + t(layaKey(S.bpm));
  }
  function setBpm(v) { S.bpm = EDU.clamp(Math.round(v), 40, 200); save(); renderTempo(); }

  /* ================================================================ TUNER pane */
  var tunerPlaying = -1;
  function stringMidis() { return INSTRUMENTS[S.inst]; }
  function fillStrings() {
    E.strings.innerHTML = '';
    stringMidis().forEach(function (m, i) {
      var b = el('button', { type: 'button', class: 'st-tuner-str no-i18n', dataset: { i: i }, title: t('play_ref') },
        el('b', null, midiName(m)), el('small', null, t('hz_n', { n: midiToHz(m, S.a4).toFixed(1) })));
      b.addEventListener('click', function () { playRef(i); });
      E.strings.appendChild(b);
    });
    E.strings.hidden = !stringMidis().length;
  }
  function playRef(i) {
    var c = audio(); if (!c) return;
    guideStopAll();
    guideTone(midiToHz(stringMidis()[i], S.a4), c.currentTime + 0.02, 1.4, 0.8);
    tunerPlaying = i;
    $$('.st-tuner-str', E.strings).forEach(function (b) { b.dataset.play = (+b.dataset.i === i) ? '1' : '0'; });
    setTimeout(function () { if (tunerPlaying === i) { tunerPlaying = -1; $$('.st-tuner-str', E.strings).forEach(function (b) { b.dataset.play = '0'; }); } }, 1500);
  }
  function renderTuner(hz, quiet) {
    var live = mic.state === 'live';
    if (!hz) {
      E.tnote.textContent = '—'; E.tnote.dataset.empty = '1'; E.tstage.dataset.zone = ''; E.tjudge.dataset.zone = '';
      E.tjudge.textContent = live && !quiet ? t('tuner_wait') : '';
      E.thz.textContent = '—'; E.tcents.textContent = '—'; E.tnear.textContent = '—';
      setNeedle(E.tmeter, null);
      $$('.st-tuner-str', E.strings).forEach(function (b) { b.dataset.near = '0'; });
      return;
    }
    var m = hzToMidi(hz, S.a4), target, near = -1, cents;
    var mids = stringMidis();
    if (mids.length) {
      var best = Infinity;
      mids.forEach(function (sm, i) { var d = Math.abs(m - sm); if (d < best) { best = d; near = i; } });
      target = mids[near];
    } else target = Math.round(m);
    cents = (m - target) * 100;
    var zone = Math.abs(cents) > 50 ? 'off' : zoneOf(cents);
    E.tnote.textContent = midiName(target); E.tnote.dataset.empty = '0';
    E.tstage.dataset.zone = zone; E.tjudge.dataset.zone = zone;
    E.tjudge.textContent = t(zone === 'ok' ? 'in_tune' : (cents < 0 ? 'flat' : 'sharp'));
    E.thz.textContent = t('hz_n', { n: hz.toFixed(1) });
    E.tcents.textContent = (cents > 0 ? '+' : '') + Math.round(cents);
    E.tnear.textContent = near >= 0 ? midiName(target) + ' (' + t('string_n', { n: near + 1 }) + ')' : noteName(hz, S.a4);
    setNeedle(E.tmeter, EDU.clamp(cents, -50, 50));
    $$('.st-tuner-str', E.strings).forEach(function (b) { b.dataset.near = (+b.dataset.i === near) ? '1' : '0'; });
  }

  /* ================================================================ tabs */
  function showTab(name) {
    tab = name; S.tab = name; save();
    $$('[role="tab"]', E.tabs).forEach(function (b) {
      var on = b.dataset.tab === name;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      $('#' + b.getAttribute('aria-controls')).hidden = !on;
    });
    if (name !== 'sargam' && alk.phase !== 'ready' && alk.phase !== 'done') alkStop();
    hold.steady = 0; hold.done = false; hold.last = 0; holdRender();
  }
  E.tabs.addEventListener('click', function (e) { var b = e.target.closest('[role="tab"]'); if (b) showTab(b.dataset.tab); });
  E.tabs.addEventListener('keydown', function (e) {
    var tabs = $$('[role="tab"]', E.tabs), i = tabs.findIndex(function (b) { return b.getAttribute('aria-selected') === 'true'; });
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      var dir = (e.key === 'ArrowRight') === (document.documentElement.dir !== 'rtl') ? 1 : -1;
      var nb = tabs[(i + dir + tabs.length) % tabs.length];
      showTab(nb.dataset.tab); nb.focus();
    }
  });

  /* ================================================================ events */
  function segInit(seg, get, set) {
    $$('button', seg).forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.v === get() ? 'true' : 'false');
      b.addEventListener('click', function () { set(b.dataset.v); $$('button', seg).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); });
    });
  }
  E.sa.addEventListener('change', function () { S.sa = E.sa.value; save(); droneRetune(); renderSur(0, true); fillHold(); });
  E.drone.addEventListener('click', droneToggle);
  E.taal.addEventListener('click', metToggle);
  E.taal2.addEventListener('click', metToggle);
  E.vol.value = S.vol;
  E.vol.addEventListener('input', function () { S.vol = +E.vol.value; save(); applyVolume(); });
  segInit(E.dtype, function () { return S.dtype; }, function (v) { S.dtype = v; save(); droneRetune(); });
  segInit(E.noise, function () { return S.noise; }, function (v) { S.noise = v; save(); });
  $$('.st-mic').forEach(function (b) { b.addEventListener('click', micToggle); });

  E.alkSel.addEventListener('change', function () { S.alk = +E.alkSel.value; save(); alkStop(); });
  segInit(E.speed, function () { return S.speed; }, function (v) { S.speed = v; save(); if (alk.phase !== 'ready') alkStop(); });
  E.alkGo.addEventListener('click', alkStart);
  E.alkStop.addEventListener('click', alkStop);
  E.alkGuide.checked = !!S.guide;
  E.alkGuide.addEventListener('change', function () { S.guide = E.alkGuide.checked; save(); });
  E.holdSel.addEventListener('change', function () { S.hold = +E.holdSel.value; save(); hold.steady = 0; hold.done = false; holdRender(); });
  E.holdHear.addEventListener('click', function () { var c = audio(); if (!c) return; guideStopAll(); guideTone(hzOfSemis(S.hold), c.currentTime + 0.02, 1.6, 0.8); });

  E.taalSel.value = S.taal;
  E.taalSel.addEventListener('change', function () { S.taal = E.taalSel.value; save(); buildCircle(); buildBols(); metRestartIfOn(); });
  E.bpm.addEventListener('input', function () { setBpm(+E.bpm.value); });
  E.bpmMinus.addEventListener('click', function () { setBpm(S.bpm - 5); });
  E.bpmPlus.addEventListener('click', function () { setBpm(S.bpm + 5); });

  segInit(E.inst, function () { return S.inst; }, function (v) { S.inst = v; save(); fillStrings(); renderTuner(0, true); });
  E.a4.value = S.a4;
  E.a4.addEventListener('change', function () { S.a4 = EDU.clamp(parseInt(E.a4.value, 10) || 440, 415, 466); E.a4.value = S.a4; save(); fillSa(); fillStrings(); droneRetune(); });

  E.reset.addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    droneStop(); metStop(); alkStop();
    S = Object.assign({}, DEF, { best: {} }); store.remove('settings');
    renderAll(); droneRetune(); renderTransport();
    EDU.toast(t('done'));
  });

  /* after a mouse / touch click, drop focus so Space works as the global start / stop key */
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('button') : null;
    if (b && e.detail > 0) b.blur();
  });
  /* keyboard: Space = start / stop (taal on the Taal tab, otherwise the microphone) · D = tanpura · T = taal */
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
    var tg = e.target, tn = tg && tg.tagName;
    if (tn === 'INPUT' || tn === 'TEXTAREA' || tn === 'SELECT' || (tg && tg.isContentEditable)) return;
    if (document.querySelector('.edu-modal-back')) return;
    var k = e.key;
    if (e.repeat) { if (k === ' ' || k === 'Spacebar') e.preventDefault(); return; }
    if (k === ' ' || k === 'Spacebar') {
      if (tn === 'BUTTON' || tn === 'SUMMARY' || tn === 'A') return;
      e.preventDefault();
      if (tab === 'taal') metToggle(); else micToggle();
    } else if (k === 'd' || k === 'D') droneToggle();
    else if (k === 't' || k === 'T') metToggle();
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { if (met.on && !met.raf) metLoop(); if ((alk.phase === 'listen' || alk.phase === 'sing') && !alk.raf) alkLoop(); } });

  /* ================================================================ render everything (also on language change) */
  function renderAll() {
    fillSa(); fillAlk(); fillHold(); fillStrings();
    E.vol.value = S.vol; E.taalSel.value = S.taal; E.a4.value = S.a4; E.alkGuide.checked = !!S.guide;
    $$('button', E.dtype).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === S.dtype ? 'true' : 'false'); });
    $$('button', E.noise).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === S.noise ? 'true' : 'false'); });
    $$('button', E.speed).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === S.speed ? 'true' : 'false'); });
    $$('button', E.inst).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === S.inst ? 'true' : 'false'); });
    buildMeter(E.meter); buildMeter(E.tmeter);
    buildCircle(); buildBols(); renderTempo();
    renderSeq(); alkRenderPhase(); holdRender();
    renderMic(); renderSur(0, true); renderTuner(0, true);
    showTab(S.tab);
  }
  EDU.onLang(renderAll);
  renderAll();

  /* exposed for the interaction test and for curious students (console) */
  window.SurTaal = { detectPitch: detectPitch, swarOf: swarOf, noteName: noteName, scoreNotes: scoreNotes, midiToHz: midiToHz, foldCents: foldCents,
    _onPitch: function (r) { onPitch(r); }, state: function () { return { drone: drone.on, met: met.on, mic: mic.state, alk: alk.phase, tab: tab, sa: saHz(), bpm: S.bpm }; },
    _alkTargets: function () { return alk.notes.map(function (n) { return { hz: n.hz, start: n.start, end: n.end }; }); }, _alkRel: function () { return now() - alk.t0; } };
})();
