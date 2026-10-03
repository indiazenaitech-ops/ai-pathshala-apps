/* Classroom Noise Meter — a live, on-device loudness meter for the classroom.
   The microphone signal is only measured (RMS of each short window) and turned into a
   relative 0–100 level. No audio is recorded, stored or sent anywhere. */
(function () {
  'use strict';
  var SLUG = 'noise-meter';
  var store = EDU.store(SLUG);
  EDU.init({ slug: SLUG, title: 'app_title' });

  var $ = EDU.$, t = EDU.t, fmt = EDU.fmt, clamp = EDU.clamp;
  function noop() { }
  function num(x) { return typeof x === 'number' && isFinite(x); }

  /* ---------------- constants ---------------- */
  var PRESETS = [
    { th: 35, key: 'act_silent', icon: '🤫' },
    { th: 50, key: 'act_pair', icon: '🗣️' },
    { th: 65, key: 'act_group', icon: '👥' },
    { th: 80, key: 'act_play', icon: '🎨' }
  ];
  var GOALS = [1, 2, 3, 5, 10, 15, 20, 30];
  var RANGE_DB = 50;            // the 0–100 scale covers 50 dB above the "floor"
  var TICK_MS = 50;             // 20 measurements per second
  var HIST_STEP = 0.5, HIST_LEN = 240;   // chart: one point every 0.5 s → 2 minutes
  var ATTACK = 0.12, RELEASE = 0.7;      // smoothing time constants (seconds)
  var REARM_QUIET = 1.5;        // seconds below the line before a new "too loud" can count
  var ALERT_SHOW = 3000;        // ms the alert stays on screen at least

  /* ---------------- saved state ---------------- */
  var S = loadSettings();
  var sess = loadSession();
  var jar = Math.max(0, Math.floor(num(store.get('jar', 0)) ? store.get('jar', 0) : 0));

  function loadSettings() {
    var d = { threshold: 65, sens: 10, delay: 3, sound: false, flash: true, view: 'meter', goal: 5, deviceId: '' };
    var s = store.get('settings', null);
    if (s && typeof s === 'object') {
      if (num(s.threshold)) d.threshold = clamp(Math.round(s.threshold / 5) * 5, 20, 95);
      if (num(s.sens)) d.sens = clamp(Math.round(s.sens), 1, 20);
      if (num(s.delay)) d.delay = clamp(Math.round(s.delay), 1, 10);
      if (typeof s.sound === 'boolean') d.sound = s.sound;
      if (typeof s.flash === 'boolean') d.flash = s.flash;
      if (s.view === 'balls') d.view = 'balls';
      if (GOALS.indexOf(s.goal) >= 0) d.goal = s.goal;
      if (typeof s.deviceId === 'string') d.deviceId = s.deviceId;
    }
    return d;
  }
  function saveSettings() { store.set('settings', S); }

  function newSession() {
    return { t: 0, g: 0, y: 0, r: 0, sum: 0, peak: 0, alerts: 0, stars: 0, start: Date.now(),
      ch: { running: false, goal: S.goal, stars: 0, sec: 0, done: false } };
  }
  function loadSession() {
    var s = store.get('session', null), n = newSession();
    if (!s || typeof s !== 'object') return n;
    ['t', 'g', 'y', 'r', 'sum', 'peak', 'alerts', 'stars', 'start'].forEach(function (k) { if (num(s[k]) && s[k] >= 0) n[k] = s[k]; });
    n.alerts = Math.floor(n.alerts); n.stars = Math.floor(n.stars); n.peak = Math.min(100, n.peak);
    if (s.ch && typeof s.ch === 'object') {
      if (GOALS.indexOf(s.ch.goal) >= 0) n.ch.goal = s.ch.goal;
      n.ch.running = !!s.ch.running;
      n.ch.done = !!s.ch.done;
      n.ch.stars = clamp(Math.floor(num(s.ch.stars) ? s.ch.stars : 0), 0, n.ch.goal);
      n.ch.sec = clamp(num(s.ch.sec) ? s.ch.sec : 0, 0, 59.9);
    }
    return n;
  }
  var lastSave = 0;
  function saveSession() { store.set('session', sess); lastSave = performance.now(); }

  /* ---------------- DOM ---------------- */
  var E = {
    stage: $('#nm-stage'), statusTxt: $('#nm-status-txt'), face: $('#nm-face'), faceLabel: $('#nm-face-label'),
    level: $('#nm-level'), level2: $('#nm-level2'), needle: $('#nm-needle'), count: $('#nm-count'),
    mic: $('#nm-mic'), micIco: $('#nm-mic-ico'), micTxt: $('#nm-mic-txt'), msg: $('#nm-msg'), perm: $('#nm-perm'),
    banner: $('#nm-banner'), fs: $('#nm-fs'), fsTxt: $('#nm-fs-txt'),
    meterView: $('#nm-meter-view'), ballsView: $('#nm-balls-view'), balls: $('#nm-balls'),
    chStrip: $('#nm-chstrip'), stars: $('#nm-stars'), starsTxt: $('#nm-stars-txt'), chNext: $('#nm-ch-next'), chBar: $('#nm-ch-bar'),
    presets: $('#nm-presets'), actVal: $('#nm-act-val'),
    threshold: $('#nm-threshold'), thresholdVal: $('#nm-threshold-val'),
    sens: $('#nm-sens'), sensVal: $('#nm-sens-val'), calib: $('#nm-calib'), calibMsg: $('#nm-calib-msg'),
    delay: $('#nm-delay'), delayVal: $('#nm-delay-val'), sound: $('#nm-sound'), flash: $('#nm-flash'),
    deviceField: $('#nm-device-field'), device: $('#nm-device'),
    goal: $('#nm-goal'), chBtn: $('#nm-ch-btn'), chStatus: $('#nm-ch-status'), jar: $('#nm-jar'), jarEmpty: $('#nm-jar-empty'),
    sWhen: $('#nm-s-when'), sTime: $('#nm-s-time'), sAlerts: $('#nm-s-alerts'), sAvg: $('#nm-s-avg'), sPeak: $('#nm-s-peak'), sStars: $('#nm-s-stars'),
    zb: $('#nm-zonebar'), zbG: $('#nm-zb-g'), zbY: $('#nm-zb-y'), zbR: $('#nm-zb-r'), legend: $('#nm-legend'),
    chart: $('#nm-chart'), printMeta: $('#nm-print-meta')
  };

  /* ---------------- audio + measuring state ---------------- */
  var A = { state: 'idle', ctx: null, stream: null, src: null, an: null, buf: null, bytes: null, timer: 0, wake: null };
  var level = 0;                 // smoothed 0–100
  var lastTick = 0, loudFor = 0, quietFor = 0, armed = true, alertUntil = 0, alertOn = false, muteUntil = 0;
  var history = [], histAcc = 0, histMax = 0;
  var calib = null;              // { until, pow, n } while "Set quiet level" listens
  var msg = null;                // { key, vars } current error / info message
  var calibMsg = { key: 'calib_hint' };
  var banner = null;             // { key, vars, kind, until }
  var face = { k: '', since: 0 };
  var dispZone = 'idle', zoneCand = '', zoneCandSince = 0;   // shown zone, with a short hold so it doesn't flicker
  var permState = '';

  function yellowStart() { return Math.max(5, S.threshold - 15); }
  function zoneOf(v) { return v >= S.threshold ? 'red' : (v >= yellowStart() ? 'yellow' : 'green'); }
  function locale() { return EDU.langInfo(EDU.lang).tag + '-u-nu-latn'; }
  function clock(sec) {
    sec = Math.max(0, Math.floor(sec));
    var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    var ss = (s < 10 ? '0' : '') + s;
    return h ? h + ':' + (m < 10 ? '0' : '') + m + ':' + ss : m + ':' + ss;
  }
  function dateTime(ms) {
    try { return new Date(ms).toLocaleString(locale(), { dateStyle: 'medium', timeStyle: 'short' }); }
    catch (e) { return new Date(ms).toLocaleString(); }
  }

  /* Read one window of samples and return its loudness in dBFS (0 = full scale, quieter = more negative). */
  function readDb() {
    var an = A.an, n = an.fftSize, sum = 0, i, v;
    if (an.getFloatTimeDomainData) {
      an.getFloatTimeDomainData(A.buf);
      for (i = 0; i < n; i++) { v = A.buf[i]; sum += v * v; }
    } else {
      if (!A.bytes) A.bytes = new Uint8Array(n);
      an.getByteTimeDomainData(A.bytes);
      for (i = 0; i < n; i++) { v = (A.bytes[i] - 128) / 128; sum += v * v; }
    }
    var rms = Math.sqrt(sum / n);
    return rms > 1e-8 ? 20 * Math.log10(rms) : -160;
  }
  /* Sensitivity 1–20 picks the dB value that shows as 0 on the meter. */
  function floorDb() { return -40 - 2 * S.sens; }

  function tick() {
    var now = performance.now();
    var dt = Math.min(1.5, Math.max(0, (now - lastTick) / 1000));
    lastTick = now;
    if (!A.an) return;
    var db = readDb();
    if (calib) {
      calib.pow += Math.pow(10, db / 10); calib.n++;
      if (now >= calib.until) finishCalib();
      else { var left = Math.ceil((calib.until - now) / 1000); if (calibMsg.vars && calibMsg.vars.n !== fmt(left)) { calibMsg = { key: 'calib_run', vars: { n: fmt(left) } }; renderCalibMsg(); } }
    }
    var raw = clamp((db - floorDb()) / RANGE_DB * 100, 0, 100);
    if (now < muteUntil) raw = Math.min(raw, level);        // ignore our own chime
    var tau = raw > level ? ATTACK : RELEASE;
    level += (raw - level) * (1 - Math.exp(-dt / tau));
    step(dt, now);
    renderLive(now);
  }

  /* Statistics, alerts and the quiet challenge, all driven by the smoothed level. */
  function step(dt, now) {
    var z = zoneOf(level);
    sess.t += dt;
    sess[z === 'green' ? 'g' : (z === 'yellow' ? 'y' : 'r')] += dt;
    sess.sum += level * dt;
    if (level > sess.peak) sess.peak = level;

    if (z === 'red') { loudFor += dt; quietFor = 0; }
    else { loudFor = Math.max(0, loudFor - 2 * dt); quietFor += dt; }
    if (armed && loudFor >= S.delay) tooLoud(now);
    if (!armed && quietFor >= REARM_QUIET) armed = true;
    alertOn = now < alertUntil || (!armed && z === 'red');

    var ch = sess.ch;
    if (ch.running && z !== 'red') {
      ch.sec += dt;
      if (ch.sec >= 60) {
        ch.sec -= 60; ch.stars++; sess.stars++;
        jar++; store.set('jar', jar); renderJar();
        if (ch.stars >= ch.goal) finishChallenge();
        else { chime([783.99, 1046.5]); renderChallenge(); }
      }
    }

    histAcc += dt; if (level > histMax) histMax = level;
    if (histAcc >= HIST_STEP) {
      history.push(histMax); if (history.length > HIST_LEN) history.shift();
      histAcc = 0; histMax = 0; drawChart();
    }
    if (now - lastSave > 2000) saveSession();
  }

  function tooLoud(now) {
    armed = false;
    sess.alerts++;
    alertUntil = now + ALERT_SHOW;
    if (S.flash) flash();
    chime([659.25, 523.25]);
    if (sess.ch.running && sess.ch.sec > 0) {
      sess.ch.sec = 0;
      showBanner('ch_reset_min', null, 'warning', 3500);
    }
    saveSession();
    renderStats();
  }

  function flash() {
    E.stage.classList.remove('nm-flash');
    void E.stage.offsetWidth;                  // restart the animation
    E.stage.classList.add('nm-flash');
    clearTimeout(flash.tm);
    flash.tm = setTimeout(function () { E.stage.classList.remove('nm-flash'); }, 2900);
  }

  /* A soft two-note chime made with an oscillator (no sound files needed). */
  function chime(freqs) {
    if (!S.sound || !A.ctx || A.ctx.state !== 'running') return;
    try {
      var ctx = A.ctx, t0 = ctx.currentTime + 0.03;
      freqs.forEach(function (f, i) {
        var o = ctx.createOscillator(), g = ctx.createGain(), st = t0 + i * 0.28;
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, st);
        g.gain.exponentialRampToValueAtTime(0.18, st + 0.025);
        g.gain.exponentialRampToValueAtTime(0.0001, st + 1.1);
        o.connect(g); g.connect(ctx.destination);
        o.start(st); o.stop(st + 1.2);
      });
      muteUntil = performance.now() + freqs.length * 280 + 1400;
    } catch (e) { /* audio output not available: the visual alert is enough */ }
  }

  /* ---------------- microphone ---------------- */
  function errKey(e) {
    var n = (e && e.name) || '';
    if (n === 'NotAllowedError' || n === 'PermissionDeniedError' || n === 'SecurityError') return 'err_denied';
    if (n === 'NotFoundError' || n === 'DevicesNotFoundError' || n === 'OverconstrainedError') return 'err_nomic';
    if (n === 'NotReadableError' || n === 'TrackStartError' || n === 'AbortError') return 'err_busy';
    return 'err_other';
  }

  function startMic() {
    if (A.state !== 'idle') return Promise.resolve(A.state === 'live');
    setMsg(null);
    var md = navigator.mediaDevices;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!md || !md.getUserMedia) { setMsg(window.isSecureContext === false ? 'err_insecure' : 'err_unsupported'); return Promise.resolve(false); }
    if (!AC) { setMsg('err_unsupported'); return Promise.resolve(false); }
    try { if (!A.ctx) A.ctx = new AC(); } catch (e) { setMsg('err_unsupported'); return Promise.resolve(false); }
    if (A.ctx.state === 'suspended') A.ctx.resume().catch(noop);
    setState('wait');
    var audio = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };
    if (S.deviceId) audio.deviceId = { exact: S.deviceId };
    return md.getUserMedia({ audio: audio }).catch(function (e) {
      if (audio.deviceId && (e.name === 'OverconstrainedError' || e.name === 'NotFoundError')) {
        S.deviceId = ''; saveSettings(); delete audio.deviceId;     // saved mic is gone: use the default one
        return md.getUserMedia({ audio: audio });
      }
      throw e;
    }).then(function (stream) {
      if (A.state !== 'wait') { stream.getTracks().forEach(function (tr) { tr.stop(); }); return false; }
      A.stream = stream;
      A.src = A.ctx.createMediaStreamSource(stream);
      A.an = A.ctx.createAnalyser();
      A.an.fftSize = 4096;
      A.an.smoothingTimeConstant = 0;
      A.buf = new Float32Array(A.an.fftSize); A.bytes = null;
      A.src.connect(A.an);
      var tr = stream.getAudioTracks()[0];
      if (tr) tr.addEventListener('ended', function () { if (A.stream === stream) { stopMic(); setMsg('err_ended'); } });
      if (A.ctx.state !== 'running') A.ctx.resume().catch(noop);
      level = 0; loudFor = 0; quietFor = 0; armed = true; alertUntil = 0;
      lastTick = performance.now();
      A.timer = setInterval(tick, TICK_MS);
      permState = 'granted';
      setState('live');
      listDevices();
      wakeLock(true);
      return true;
    }).catch(function (e) {
      cleanup();
      setState('idle');
      var k = errKey(e);
      if (k === 'err_denied') permState = 'denied';
      setMsg(k, k === 'err_other' ? { name: (e && e.name) || 'Error' } : null);
      return false;
    });
  }

  function cleanup() {
    if (A.timer) { clearInterval(A.timer); A.timer = 0; }
    if (A.stream) A.stream.getTracks().forEach(function (tr) { try { tr.stop(); } catch (e) { } });
    if (A.src) { try { A.src.disconnect(); } catch (e) { } }
    A.stream = A.src = A.an = null;
    wakeLock(false);
  }

  function stopMic() {
    var was = A.state;
    cleanup();
    calib = null;
    if (calibMsg.key === 'calib_run') calibMsg = { key: 'calib_hint' };
    level = 0; alertOn = false; alertUntil = 0; loudFor = 0; quietFor = 0; armed = true;
    setState('idle');
    if (was === 'live') saveSession();
    renderCalibMsg();
    renderLive(performance.now());
    renderStats();
  }

  function toggleMic() { if (A.state === 'live') stopMic(); else if (A.state === 'idle') startMic(); }

  function listDevices() {
    var md = navigator.mediaDevices;
    if (!md || !md.enumerateDevices) return;
    md.enumerateDevices().then(function (list) {
      var mics = list.filter(function (d) { return d.kind === 'audioinput' && d.deviceId && d.deviceId !== 'default' && d.deviceId !== 'communications'; });
      E.deviceField.hidden = mics.length < 2;
      E.device.innerHTML = '';
      E.device.appendChild(EDU.el('option', { value: '', text: t('mic_default') }));
      mics.forEach(function (d, i) { E.device.appendChild(EDU.el('option', { value: d.deviceId, text: d.label || (t('mic_pick') + ' ' + (i + 1)) })); });
      E.device.value = mics.some(function (d) { return d.deviceId === S.deviceId; }) ? S.deviceId : '';
    }).catch(noop);
  }

  /* Keep the screen awake while the meter is on the projector. */
  function wakeLock(on) {
    try {
      if (on && !A.wake && navigator.wakeLock && navigator.wakeLock.request) {
        navigator.wakeLock.request('screen').then(function (w) {
          if (A.state !== 'live') { w.release().catch(noop); return; }
          A.wake = w; w.addEventListener('release', function () { if (A.wake === w) A.wake = null; });
        }).catch(noop);
      } else if (!on && A.wake) { var w = A.wake; A.wake = null; w.release().catch(noop); }
    } catch (e) { }
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden && A.state === 'live') wakeLock(true); });

  /* ---------------- "Set quiet level" (calibration) ---------------- */
  function startCalib() {
    function go() { calib = { until: performance.now() + 3000, pow: 0, n: 0 }; calibMsg = { key: 'calib_run', vars: { n: fmt(3) } }; renderCalibMsg(); }
    if (A.state === 'live') go();
    else if (A.state === 'idle') startMic().then(function (ok) { if (ok) go(); });
  }
  function finishCalib() {
    var c = calib; calib = null;
    var avgDb = c.n && c.pow > 0 ? 10 * Math.log10(c.pow / c.n) : -160;
    // make the measured quiet show as about 15 on the meter
    var s = Math.round((-40 - (avgDb - 7.5)) / 2);
    var noisy = s < 1;
    S.sens = clamp(s, 1, 20); saveSettings();
    calibMsg = noisy ? { key: 'calib_noisy' } : { key: 'calib_done', vars: { n: fmt(S.sens) } };
    renderSettings(); renderCalibMsg();
  }

  /* ---------------- quiet challenge ---------------- */
  function startChallenge() {
    sess.ch = { running: true, goal: S.goal, stars: 0, sec: 0, done: false };
    banner = null; renderBanner();
    saveSession(); renderChallenge();
    if (A.state === 'idle') startMic();
  }
  function stopChallenge() {
    sess.ch.running = false; sess.ch.sec = 0;
    saveSession(); renderChallenge();
  }
  function finishChallenge() {
    var ch = sess.ch;
    ch.running = false; ch.done = true; ch.sec = 0;
    chime([523.25, 659.25, 783.99, 1046.5]);
    showBanner('ch_done', { n: fmt(ch.stars) }, 'success', 0);
    saveSession(); renderChallenge(); renderStats();
  }

  /* ---------------- rendering ---------------- */
  function setState(s) { A.state = s; E.stage.dataset.state = s; renderState(); }

  function renderState() {
    var s = A.state;
    E.statusTxt.textContent = t(s === 'live' ? 'st_live' : (s === 'wait' ? 'st_wait' : 'st_idle'));
    E.micTxt.textContent = t(s === 'live' ? 'mic_stop' : (s === 'wait' ? 'st_wait' : 'mic_start'));
    E.micIco.textContent = s === 'live' ? '⏹' : (s === 'wait' ? '⏳' : '🎤');
    E.mic.disabled = s === 'wait';
    E.mic.classList.toggle('btn-primary', s !== 'live');
    E.mic.classList.toggle('btn-danger', s === 'live');
    E.perm.hidden = s === 'live' || permState === 'granted';
    renderChallenge();
    renderFace(performance.now(), true);
  }

  function faceFor() {
    if (A.state !== 'live') return A.state === 'wait' ? { e: '⏳', k: 'st_wait' } : { e: '🎙️', k: 'face_idle' };
    if (alertOn) return { e: '🙉', k: 'face_alert' };
    var z = zoneOf(level);
    if (z === 'red') return { e: '😟', k: 'face_loud' };
    if (z === 'yellow') return { e: '😐', k: 'face_mid' };
    if (level < Math.min(10, yellowStart() / 2)) return { e: '😌', k: 'face_vquiet' };
    return { e: '🙂', k: 'face_quiet' };
  }
  function renderFace(now, force) {
    var f = faceFor();
    // short hold time so the label (read by screen readers) doesn't flicker at a zone edge
    if (!force && f.k !== face.k && f.k !== 'face_alert' && now - face.since < 600) return;
    if (force || f.k !== face.k) {
      face = { k: f.k, since: now };
      E.face.textContent = f.e;
      E.faceLabel.textContent = t(f.k);
      E.faceLabel.dataset.k = f.k;
    }
  }

  var lastStats = 0;
  function renderLive(now) {
    var v = fmt(Math.round(level));
    if (E.level.textContent !== v) { E.level.textContent = v; E.level2.textContent = v; }
    E.needle.setAttribute('transform', 'rotate(' + ((level - 50) * 1.8).toFixed(1) + ' 120 120)');
    var z = A.state === 'live' ? zoneOf(level) : 'idle';
    if (z === dispZone) zoneCand = '';
    else if (z === 'idle' || dispZone === 'idle' || alertOn) dispZone = z;
    else if (zoneCand !== z) { zoneCand = z; zoneCandSince = now; }
    else if (now - zoneCandSince >= 250) dispZone = z;
    if (E.stage.dataset.zone !== dispZone) E.stage.dataset.zone = dispZone;
    E.stage.classList.toggle('nm-alert', alertOn);
    E.count.textContent = fmt(sess.alerts);
    renderFace(now, false);
    if (banner && banner.until && now > banner.until) { banner = null; renderBanner(); }
    renderChallengeLive();
    if (now - lastStats > 1000) { lastStats = now; renderStats(); }
  }

  function renderMsg() {
    E.msg.hidden = !msg;
    E.msg.textContent = msg ? t(msg.key, msg.vars) : '';
  }
  function setMsg(key, vars) { msg = key ? { key: key, vars: vars || null } : null; renderMsg(); }

  function renderCalibMsg() { E.calibMsg.textContent = t(calibMsg.key, calibMsg.vars); }

  function showBanner(key, vars, kind, ms) { banner = { key: key, vars: vars, kind: kind, until: ms ? performance.now() + ms : 0 }; renderBanner(); }
  function renderBanner() {
    if (!banner && sess.ch.done) banner = { key: 'ch_done', vars: { n: fmt(sess.ch.stars) }, kind: 'success', until: 0 };
    E.banner.hidden = !banner;
    if (!banner) return;
    E.banner.className = 'callout nm-banner ' + banner.kind;
    E.banner.textContent = t(banner.key, banner.vars);
  }

  function renderSettings() {
    E.threshold.value = S.threshold; E.thresholdVal.textContent = fmt(S.threshold);
    E.sens.value = S.sens; E.sensVal.textContent = fmt(S.sens);
    E.delay.value = S.delay; E.delayVal.textContent = t('sec_n', { n: fmt(S.delay) });
    E.sound.checked = S.sound; E.flash.checked = S.flash;
    var cur = null;
    EDU.$$('button', E.presets).forEach(function (b) {
      var on = +b.dataset.th === S.threshold;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) cur = b.dataset.key;
    });
    E.actVal.textContent = t(cur || 'act_custom');
    renderGauge();
  }

  function buildPresets() {
    E.presets.innerHTML = '';
    PRESETS.forEach(function (p) {
      E.presets.appendChild(EDU.el('button', { type: 'button', class: 'chip', dataset: { th: String(p.th), key: p.key }, 'aria-pressed': 'false',
        onclick: function () { S.threshold = p.th; saveSettings(); renderSettings(); renderLive(performance.now()); drawChart(); } },
        EDU.el('span', { 'aria-hidden': 'true', text: p.icon }), EDU.el('span', { text: t(p.key) }), EDU.el('span', { class: 'nm-th', text: fmt(p.th) })));
    });
  }

  function renderGoals() {
    E.goal.innerHTML = '';
    GOALS.forEach(function (g) { E.goal.appendChild(EDU.el('option', { value: String(g), text: t('min_n', { n: fmt(g) }) })); });
    E.goal.value = String(S.goal);
  }

  function renderChallenge() {
    var ch = sess.ch;
    E.chBtn.textContent = t(ch.running ? 'ch_stop' : 'ch_start');
    E.chBtn.classList.toggle('btn-accent', !ch.running);
    var st = '';
    if (ch.running && A.state !== 'live') st = t('ch_paused');
    else if (ch.done) st = t('ch_done', { n: fmt(ch.stars) });
    E.chStatus.textContent = st;
    E.chStatus.hidden = !st;
    var show = ch.running || ch.done;
    E.chStrip.hidden = !show;
    if (show) {
      E.stars.innerHTML = '';
      if (ch.goal <= 10) {
        for (var i = 0; i < ch.goal; i++) E.stars.appendChild(EDU.el('span', { class: i < ch.stars ? '' : 'off', text: '⭐' }));
      } else {
        E.stars.textContent = '⭐ ' + fmt(ch.stars) + ' / ' + fmt(ch.goal);
      }
      E.starsTxt.textContent = t('ch_stars', { n: fmt(ch.stars), goal: fmt(ch.goal) });
    }
    renderChallengeLive();
    renderBanner();
  }
  function renderChallengeLive() {
    var ch = sess.ch;
    if (E.chStrip.hidden) return;
    E.chStrip.dataset.sec = ch.sec.toFixed(1);
    E.chBar.style.width = (ch.done ? 100 : ch.sec / 60 * 100).toFixed(1) + '%';
    E.chNext.textContent = ch.done ? '' : t('ch_next', { t: clock(Math.ceil(60 - ch.sec)) });
  }

  function renderJar() { E.jar.textContent = fmt(jar); }

  function pct(x) { return fmt(Math.round(x)) + '%'; }
  function renderStats() {
    var T = sess.t;
    E.sWhen.textContent = dateTime(sess.start);
    E.sTime.textContent = clock(T);
    E.sAlerts.textContent = fmt(sess.alerts);
    E.sAvg.textContent = T >= 1 ? fmt(Math.round(sess.sum / T)) : '–';
    E.sPeak.textContent = T >= 1 ? fmt(Math.round(sess.peak)) : '–';
    E.sStars.textContent = fmt(sess.stars);
    var g = T ? sess.g / T * 100 : 0, y = T ? sess.y / T * 100 : 0, r = T ? sess.r / T * 100 : 0;
    E.zbG.style.width = g + '%'; E.zbY.style.width = y + '%'; E.zbR.style.width = r + '%';
    E.zb.dataset.g = g.toFixed(1); E.zb.dataset.y = y.toFixed(1); E.zb.dataset.r = r.toFixed(1);
    E.legend.innerHTML = '';
    [['g', 's_quiet', g], ['y', 's_mid', y], ['r', 's_loud', r]].forEach(function (z) {
      E.legend.appendChild(EDU.el('span', { class: 'nm-key ' + z[0], text: t(z[1]) + ': ' + (T ? pct(z[2]) : '–') }));
    });
    E.count.textContent = fmt(sess.alerts);
  }

  function renderPrintMeta() {
    var cur = PRESETS.filter(function (p) { return p.th === S.threshold; })[0];
    E.printMeta.textContent = t('report_meta', { d: dateTime(sess.start), a: t(cur ? cur.key : 'act_custom'), n: fmt(S.threshold) });
  }

  function renderView() {
    EDU.$$('button', $('#nm-view')).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.view === S.view ? 'true' : 'false'); });
    E.meterView.hidden = S.view !== 'meter';
    E.ballsView.hidden = S.view !== 'balls';
    if (S.view === 'balls') { sizeBalls(); startBalls(); } else stopBalls();
  }

  /* ---------------- gauge (SVG) ---------------- */
  var CX = 120, CY = 120, R = 96;
  function pt(v, r) { var a = Math.PI * (1 - v / 100); return [CX + r * Math.cos(a), CY - r * Math.sin(a)]; }
  function arc(v0, v1) {
    if (v1 - v0 < 0.01) return '';
    var p0 = pt(v0, R), p1 = pt(v1, R);
    return 'M' + p0[0].toFixed(2) + ' ' + p0[1].toFixed(2) + ' A' + R + ' ' + R + ' 0 0 1 ' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2);
  }
  function buildTicks() {
    var g = $('#nm-ticks'), ns = 'http://www.w3.org/2000/svg';
    for (var v = 0; v <= 100; v += 10) {
      var a = pt(v, 81), b = pt(v, v % 50 === 0 ? 70 : 75), l = document.createElementNS(ns, 'line');
      l.setAttribute('class', 'nm-tick');
      l.setAttribute('x1', a[0].toFixed(1)); l.setAttribute('y1', a[1].toFixed(1));
      l.setAttribute('x2', b[0].toFixed(1)); l.setAttribute('y2', b[1].toFixed(1));
      g.appendChild(l);
    }
  }
  function renderGauge() {
    var ys = yellowStart(), th = S.threshold;
    $('#nm-arc-g').setAttribute('d', arc(0, ys));
    $('#nm-arc-y').setAttribute('d', arc(ys, th));
    $('#nm-arc-r').setAttribute('d', arc(th, 100));
    var a = pt(th, 80), b = pt(th, 112), m = $('#nm-thmark');
    m.setAttribute('x1', a[0].toFixed(1)); m.setAttribute('y1', a[1].toFixed(1));
    m.setAttribute('x2', b[0].toFixed(1)); m.setAttribute('y2', b[1].toFixed(1));
  }

  /* ---------------- history chart (canvas) ---------------- */
  var colors = {};
  function readColors() {
    ['--text', '--muted', '--border', '--surface', '--surface-2', '--success', '--warning', '--danger', '--primary', '--accent',
      '--c1', '--c2', '--c3', '--c4', '--c5', '--c6', '--c7', '--c8'].forEach(function (k) { colors[k] = EDU.css(k) || '#888'; });
  }
  function fitCanvas(cv) {
    var r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { c: c, w: w, h: h };
  }
  function drawChart() {
    var cv = E.chart; if (!cv.getContext) return;
    var f = fitCanvas(cv), c = f.c, w = f.w, h = f.h, pad = 6;
    c.clearRect(0, 0, w, h);
    var Y = function (v) { return pad + (h - 2 * pad) * (1 - v / 100); };
    var ys = yellowStart(), th = S.threshold;
    c.globalAlpha = 0.13;
    c.fillStyle = colors['--success']; c.fillRect(0, Y(ys), w, Y(0) - Y(ys) + pad);
    c.fillStyle = colors['--warning']; c.fillRect(0, Y(th), w, Y(ys) - Y(th));
    c.fillStyle = colors['--danger']; c.fillRect(0, 0, w, Y(th));
    c.globalAlpha = 1;
    c.setLineDash([6, 5]); c.strokeStyle = colors['--danger']; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(0, Y(th)); c.lineTo(w, Y(th)); c.stroke(); c.setLineDash([]);
    if (history.length < 2) return;
    var dx = w / (HIST_LEN - 1), x0 = w - (history.length - 1) * dx;
    c.beginPath();
    history.forEach(function (v, i) { var x = x0 + i * dx; if (i) c.lineTo(x, Y(v)); else c.moveTo(x, Y(v)); });
    c.strokeStyle = colors['--text']; c.lineWidth = 2; c.lineJoin = 'round'; c.stroke();
    c.lineTo(w, Y(0)); c.lineTo(x0, Y(0)); c.closePath();
    c.globalAlpha = 0.12; c.fillStyle = colors['--primary']; c.fill(); c.globalAlpha = 1;
  }

  /* ---------------- bouncing balls (canvas) ---------------- */
  var balls = [], bctx = null, BW = 0, BH = 0, raf = 0, lastB = 0;
  function sizeBalls() {
    if (E.ballsView.hidden) return;
    var f = fitCanvas(E.balls);
    bctx = f.c; BW = f.w; BH = f.h;
    var n = BW < 520 ? 12 : 16, r = clamp(Math.min(BW / (n * 2.3), BH / 11), 10, 34);
    if (balls.length !== n || Math.abs((balls[0] || {}).r - r) > 0.5) {
      balls = [];
      for (var i = 0; i < n; i++) {
        balls.push({ x: (i + 0.5) * BW / n, y: 0, vy: 0, vx: (Math.random() - 0.5) * 30, r: r, c: '--c' + (i % 8 + 1) });
      }
    }
    drawBalls();
  }
  function startBalls() {
    if (raf) return;
    lastB = performance.now();
    var loop = function (now) {
      raf = 0;
      if (E.ballsView.hidden) return;
      var dt = Math.min(0.05, (now - lastB) / 1000); lastB = now;
      moveBalls(dt);
      drawBalls();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }
  function stopBalls() { if (raf) cancelAnimationFrame(raf); raf = 0; }
  function moveBalls(dt) {
    if (!BW) return;
    var room = BH - 8, gAcc = 2.6 * room, live = A.state === 'live', lv = live ? level : 0;
    balls.forEach(function (b) {
      var top = room - 2 * b.r;
      if (b.y <= 0 && b.vy <= 0) {
        b.y = 0; b.vy = 0;
        // jump more often and higher when the room is louder; peak height never goes above the level
        if (lv > 3 && Math.random() < dt * (1.5 + lv / 12)) {
          var hgt = top * (lv / 100) * (0.55 + 0.45 * Math.random());
          b.vy = Math.sqrt(2 * gAcc * hgt);
          b.vx = (Math.random() - 0.5) * (20 + lv * 2.5);
        }
      } else {
        b.vy -= gAcc * dt; b.y += b.vy * dt;
        if (b.y > top) { b.y = top; b.vy = -Math.abs(b.vy) * 0.3; }
        if (b.y < 0) { b.y = 0; b.vy = 0; }
      }
      b.x += b.vx * dt;
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); }
      if (b.x > BW - b.r) { b.x = BW - b.r; b.vx = -Math.abs(b.vx); }
      if (b.y === 0) b.vx *= Math.pow(0.2, dt);
    });
  }
  function drawBalls() {
    if (!bctx || !BW) return;
    var c = bctx, room = BH - 8, floorY = BH - 4;
    c.clearRect(0, 0, BW, BH);
    // line height = the level at which the top of a ball can reach it
    var r0 = balls.length ? balls[0].r : 12, lineY = floorY - 2 * r0 - (room - 2 * r0) * S.threshold / 100;
    c.globalAlpha = 0.14; c.fillStyle = colors['--danger']; c.fillRect(0, 0, BW, lineY); c.globalAlpha = 1;
    c.setLineDash([10, 7]); c.strokeStyle = colors['--danger']; c.lineWidth = 3;
    c.beginPath(); c.moveTo(0, lineY); c.lineTo(BW, lineY); c.stroke(); c.setLineDash([]);
    c.fillStyle = colors['--border']; c.fillRect(0, floorY, BW, 4);
    balls.forEach(function (b) {
      var x = b.x, y = floorY - b.r - b.y;
      c.beginPath(); c.arc(x, y, b.r, 0, Math.PI * 2); c.fillStyle = colors[b.c]; c.fill();
      // two friendly eyes
      var ex = b.r * 0.33, ey = y - b.r * 0.18, er = Math.max(2, b.r * 0.2);
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(x - ex, ey, er, 0, Math.PI * 2); c.arc(x + ex, ey, er, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#1b2a30';
      var look = b.vy > 0 ? -er * 0.35 : er * 0.25;
      c.beginPath(); c.arc(x - ex, ey + look, er * 0.5, 0, Math.PI * 2); c.arc(x + ex, ey + look, er * 0.5, 0, Math.PI * 2); c.fill();
    });
  }

  /* ---------------- full screen ---------------- */
  var pseudo = false;
  function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
  function isBig() { return pseudo || fsEl() === E.stage; }
  function toggleFs() {
    if (pseudo) { pseudo = false; afterFs(); return; }
    if (fsEl()) { EDU.fullscreen(); return; }
    var req = E.stage.requestFullscreen || E.stage.webkitRequestFullscreen;
    var fallback = function () { pseudo = true; afterFs(); };
    if (!req) return fallback();
    try { var p = req.call(E.stage); if (p && p.catch) p.catch(fallback); } catch (e) { fallback(); }
  }
  function afterFs() {
    var big = isBig();
    E.stage.classList.toggle('nm-big', big);
    E.stage.classList.toggle('nm-pseudo', pseudo);
    document.body.classList.toggle('nm-noscroll', pseudo);
    E.fsTxt.textContent = t(big ? 'fs_exit' : 'fullscreen');
    setTimeout(sizeBalls, 60);
  }
  document.addEventListener('fullscreenchange', afterFs);
  document.addEventListener('webkitfullscreenchange', afterFs);

  /* ---------------- events ---------------- */
  E.mic.addEventListener('click', toggleMic);
  E.fs.addEventListener('click', toggleFs);
  EDU.$$('button', $('#nm-view')).forEach(function (b) {
    b.addEventListener('click', function () { S.view = b.dataset.view === 'balls' ? 'balls' : 'meter'; saveSettings(); renderView(); });
  });
  E.threshold.addEventListener('input', function () {
    S.threshold = clamp(Math.round(+E.threshold.value / 5) * 5, 20, 95); saveSettings(); renderSettings(); renderLive(performance.now()); drawChart();
  });
  E.sens.addEventListener('input', function () {
    S.sens = clamp(Math.round(+E.sens.value), 1, 20); saveSettings(); renderSettings();
    if (calibMsg.key !== 'calib_run') { calibMsg = { key: 'calib_hint' }; renderCalibMsg(); }
  });
  E.delay.addEventListener('input', function () { S.delay = clamp(Math.round(+E.delay.value), 1, 10); saveSettings(); renderSettings(); });
  E.sound.addEventListener('change', function () { S.sound = E.sound.checked; saveSettings(); });
  E.flash.addEventListener('change', function () { S.flash = E.flash.checked; saveSettings(); });
  E.calib.addEventListener('click', startCalib);
  E.device.addEventListener('change', function () {
    S.deviceId = E.device.value; saveSettings();
    if (A.state === 'live') { stopMic(); startMic(); }
  });
  E.goal.addEventListener('change', function () {
    var g = +E.goal.value; if (GOALS.indexOf(g) < 0) return;
    S.goal = g; saveSettings();
    if (sess.ch.running) { sess.ch.goal = g; if (sess.ch.stars >= g) finishChallenge(); else { saveSession(); renderChallenge(); } }
  });
  E.chBtn.addEventListener('click', function () { if (sess.ch.running) stopChallenge(); else startChallenge(); });
  E.jarEmpty.addEventListener('click', function () {
    if (!confirm(t('jar_confirm'))) return;
    jar = 0; store.set('jar', jar); renderJar();
  });
  $('#nm-new').addEventListener('click', function () {
    if (!confirm(t('new_confirm'))) return;
    sess = newSession(); history = []; histAcc = 0; histMax = 0;
    loudFor = 0; quietFor = 0; armed = true; alertUntil = 0; alertOn = false; banner = null;
    saveSession(); renderAll();
  });
  $('#nm-print').addEventListener('click', function () { renderPrintMeta(); renderStats(); drawChart(); window.print(); });
  window.addEventListener('beforeprint', renderPrintMeta);

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    var tg = e.target || {}, tag = (tg.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea' || tg.isContentEditable) return;
    if ((e.key === ' ' || e.code === 'Space') && tag !== 'button' && tag !== 'summary' && tag !== 'a') { e.preventDefault(); toggleMic(); }
    else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFs(); }
    else if (e.key === 'Escape' && pseudo) { pseudo = false; afterFs(); }
  });

  var rsTimer = 0;
  window.addEventListener('resize', function () { clearTimeout(rsTimer); rsTimer = setTimeout(function () { sizeBalls(); drawChart(); }, 120); });
  EDU.onTheme(function () { setTimeout(function () { readColors(); drawChart(); drawBalls(); }, 30); });

  /* Ask the browser (quietly) whether the mic is already allowed or blocked. */
  try {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' }).then(function (p) {
        var upd = function () {
          permState = p.state;
          if (p.state === 'denied' && A.state === 'idle') setMsg('err_denied');
          else if (msg && msg.key === 'err_denied' && p.state !== 'denied') setMsg(null);
          renderState();
        };
        upd();
        p.onchange = upd;
      }).catch(noop);
    }
  } catch (e) { }

  function renderAll() {
    renderState(); renderSettings(); renderGoals(); renderChallenge(); renderJar(); renderStats();
    renderMsg(); renderCalibMsg(); renderBanner(); renderPrintMeta();
    E.fsTxt.textContent = t(isBig() ? 'fs_exit' : 'fullscreen');
    renderLive(performance.now());
    drawChart();
  }

  EDU.onLang(function () {
    EDU.$$('button', E.presets).forEach(function (b) { b.children[1].textContent = t(b.dataset.key); });
    if (!E.deviceField.hidden && E.device.options.length) E.device.options[0].textContent = t('mic_default');
    renderAll();
  });

  /* ---------------- start ---------------- */
  readColors();
  buildTicks();
  buildPresets();
  renderAll();
  renderView();
})();
