/* Classroom Timer: countdown, stopwatch, Pomodoro and work-mode signs.
   Every timer is driven by wall-clock timestamps (Date.now), never by counting
   ticks, so the display stays correct when the tab is in the background, the
   screen sleeps or the page is reloaded. Alarms are scheduled ahead of time on
   the WebAudio clock, so they ring on time even in a background tab. */
(function () {
  'use strict';
  var SLUG = 'class-timer';
  var store = EDU.store(SLUG);
  EDU.init({ slug: SLUG, title: 'app_title' });
  var $ = EDU.$, $$ = EDU.$$, t = EDU.t;

  var MIN = 60000;
  var MAX_MS = (24 * 3600 - 1) * 1000;          // 23:59:59
  var RING_C = 2 * Math.PI * 90;                // circumference of the progress ring (r = 90)
  var TABS = ['countdown', 'stopwatch', 'pomodoro', 'signs'];
  var STAGES = ['cd-stage', 'sw-stage', 'po-stage', 'sg-stage'];
  var PRESETS = [1, 2, 3, 5, 10, 15, 20, 30];
  var PLANS = {
    classic: { work: 25, short: 5, long: 15, every: 4 },
    class: { work: 20, short: 5, long: 10, every: 2 },
    exam: { work: 50, short: 10, long: 30, every: 3 },
    young: { work: 10, short: 2, long: 10, every: 3 }
  };
  var PLAN_ORDER = ['classic', 'class', 'exam', 'young'];
  /* voice: classroom "voice level" 0 = silent … 3 = group voice (null = not shown) */
  var SIGNS = [
    { id: 'silent', icon: '🤫', color: 'var(--c3)', voice: 0 },
    { id: 'whisper', icon: '🔈', color: 'var(--c7)', voice: 1 },
    { id: 'partner', icon: '👫', color: 'var(--c4)', voice: 2 },
    { id: 'group', icon: '👥', color: 'var(--c2)', voice: 3 },
    { id: 'hands', icon: '✋', color: 'var(--c6)', voice: 0 },
    { id: 'listen', icon: '👀', color: 'var(--c1)', voice: 0 },
    { id: 'tidy', icon: '🧹', color: 'var(--c5)', voice: null },
    { id: 'stretch', icon: '🤸', color: 'var(--c8)', voice: null }
  ];
  var SIGN_BY = {};
  SIGNS.forEach(function (s) { SIGN_BY[s.id] = s; });
  var SOUNDS = ['bell', 'beeps', 'gong', 'off'];

  /* ------------------------------------------------------------ helpers */
  function now() { return Date.now(); }
  function num(v, d) { v = Number(v); return isFinite(v) ? v : d; }
  function clampInt(v, lo, hi, d) { return Math.min(hi, Math.max(lo, Math.round(num(v, d)))); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function hms(s) {
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return h ? h + ':' + pad(m) + ':' + pad(x) : pad(m) + ':' + pad(x);
  }
  /* countdowns round UP: "05:00" shows for the whole first second, "00:00" only when time is really up */
  function fmtDown(ms) { return hms(Math.max(0, Math.ceil(ms / 1000))); }
  function fmtUp(ms) { return hms(Math.max(0, Math.floor(ms / 1000))); }
  function fmtSw(ms) { ms = Math.max(0, ms); return fmtUp(ms) + '.' + pad(Math.floor(ms / 10) % 100); }
  function clockTime(ts) {
    try {
      return new Intl.DateTimeFormat(EDU.langInfo(EDU.lang).tag, { hour: 'numeric', minute: '2-digit', numberingSystem: 'latn' }).format(new Date(ts));
    } catch (e) { var d = new Date(ts); return d.getHours() + ':' + pad(d.getMinutes()); }
  }
  function setText(el, s) { if (el && el.__t !== s) { el.textContent = s; el.__t = s; } }
  function setRing(bar, frac) {
    frac = Math.max(0, Math.min(1, frac || 0));
    var off = (RING_C * (1 - frac)).toFixed(2);
    if (bar.__o === off) return;
    bar.__o = off;
    bar.setAttribute('stroke-dashoffset', off);
    bar.style.opacity = frac < 0.0008 ? '0' : '1';
  }

  var ICONS = {
    play: '<path d="M8 5.6v12.8a1 1 0 0 0 1.53.85l10-6.4a1 1 0 0 0 0-1.7l-10-6.4A1 1 0 0 0 8 5.6z" fill="currentColor" stroke="none"/>',
    pause: '<rect x="6" y="5" width="4.2" height="14" rx="1.2" fill="currentColor" stroke="none"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.2" fill="currentColor" stroke="none"/>',
    reset: '<path d="M4.6 12a7.4 7.4 0 1 0 2.2-5.25"/><path d="M4.5 4.2v4.3h4.3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    expand: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>',
    shrink: '<path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5"/>',
    flag: '<path d="M6 21V4"/><path d="M6 4.5h11l-2.4 3.8L17 12H6"/>',
    skip: '<path d="M6 5.8v12.4l8.6-6.2z" fill="currentColor"/><path d="M18 5v14"/>',
    sound: '<path d="M4 9.5v5h3.4l4.6 3.8V5.7L7.4 9.5z" fill="currentColor"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18.2 6.4a8 8 0 0 1 0 11.2"/>',
    print: '<path d="M7 8V3.5h10V8"/><rect x="3.5" y="8" width="17" height="8" rx="2"/><path d="M7 13.5h10v7H7z"/>',
    download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>'
  };
  function icon(name) {
    return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + ICONS[name] + '</svg>';
  }
  $$('[data-ico]').forEach(function (s) { s.outerHTML = icon(s.getAttribute('data-ico')); });

  /* ------------------------------------------------------------ sound (WebAudio, no files) */
  var AC = window.AudioContext || window.webkitAudioContext;
  var actx = null, sched = {}, ringing = [];
  function audio() {
    if (!AC) return null;
    if (!actx) {
      try {
        actx = new AC();
        actx.onstatechange = function () { if (actx.state === 'running') reschedule(); };
      } catch (e) { actx = null; }
    }
    return actx;
  }
  /* call from user gestures: browsers only allow sound after a tap / key press */
  function unlockAudio() {
    var a = audio();
    if (!a) return;
    if (a.state !== 'running' && a.resume) {
      try { a.resume().then(reschedule, function () { }); } catch (e) { }
    }
  }
  function tone(a, out, when, freq, dur, vol, type) {
    var o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g); g.connect(out);
    o.start(when); o.stop(when + dur + 0.05);
    return o;
  }
  /* build a sound starting at audio-clock time `when`; returns a handle that can be cancelled */
  function synth(a, kind, when) {
    var out = a.createGain();
    out.gain.value = 0.9;
    out.connect(a.destination);
    var o = [];
    if (kind === 'bell') {                    // soft descending school-bell arpeggio, twice
      [0, 2.3].forEach(function (d) {
        [1046.5, 784, 659.3, 523.3].forEach(function (f, i) {
          var w = when + d + i * 0.32;
          o.push(tone(a, out, w, f, 1.7, 0.3), tone(a, out, w, f * 2, 0.7, 0.07), tone(a, out, w, f * 3.01, 0.35, 0.025));
        });
      });
    } else if (kind === 'beeps') {             // classic 3 × 3 beeps, softened
      for (var g = 0; g < 3; g++) for (var b = 0; b < 3; b++) o.push(tone(a, out, when + g * 0.95 + b * 0.19, 988, 0.13, 0.22, 'triangle'));
    } else if (kind === 'gong') {              // deep temple-bell strike, twice
      [0, 2.8].forEach(function (d) {
        var w = when + d;
        o.push(tone(a, out, w, 261.6, 3.6, 0.42), tone(a, out, w, 523.8, 2.6, 0.18), tone(a, out, w, 722.1, 1.9, 0.1), tone(a, out, w, 1412, 0.9, 0.04));
      });
    } else if (kind === 'warn') {              // gentle "one minute left" double note
      o.push(tone(a, out, when, 660, 0.4, 0.18), tone(a, out, when + 0.42, 880, 0.55, 0.18));
    }
    return { out: out, osc: o };
  }
  function stopHandle(h) {
    try { h.out.disconnect(); } catch (e) { }
    h.osc.forEach(function (x) { try { x.stop(0); } catch (e) { } });
  }
  function cancel(key) { var s = sched[key]; if (s) { delete sched[key]; stopHandle(s.h); } }
  function schedule(key, at, kind) {
    cancel(key);
    if (!at || !kind || kind === 'off' || !actx || actx.state !== 'running') return;
    var delay = (at - now()) / 1000;
    if (delay < -0.3) return;
    try { sched[key] = { at: at, h: synth(actx, kind, actx.currentTime + Math.max(0.02, delay)) }; } catch (e) { }
  }
  function playNow(kind) {
    if (!kind || kind === 'off') return;
    var a = audio();
    if (!a) return;
    var go = function () { try { ringing.push(synth(a, kind, a.currentTime + 0.03)); } catch (e) { } };
    if (a.state === 'running') go();
    else if (a.resume) { try { a.resume().then(go, function () { }); } catch (e) { } }
  }
  /* a timer just ended: keep the pre-scheduled alarm ringing, or play one now if none was scheduled */
  function alarmFor(key, at) {
    var s = sched[key];
    if (s && s.at === at) { delete sched[key]; ringing.push(s.h); }
    else { cancel(key); playNow(sound); }
  }
  function silence() { ringing.forEach(stopHandle); ringing = []; }

  /* ------------------------------------------------------------ state (restored from this device) */
  var sound = store.get('sound', 'bell');
  if (SOUNDS.indexOf(sound) < 0) sound = 'bell';
  var warn1 = store.get('warn1', true) !== false;

  var c0 = store.get('cd', null) || {};
  var cd = {
    base: Math.max(1000, Math.min(MAX_MS, num(c0.base, 5 * MIN))),
    total: 0, remaining: 0,
    endAt: num(c0.endAt, 0), running: !!c0.running, started: !!c0.started,
    doneAt: num(c0.doneAt, 0), activity: typeof c0.activity === 'string' ? c0.activity.slice(0, 80) : ''
  };
  cd.total = Math.max(1000, Math.min(MAX_MS, num(c0.total, cd.base)));
  cd.remaining = Math.max(0, Math.min(cd.total, num(c0.remaining, cd.total)));
  if (cd.running && !(cd.endAt > 0)) cd.running = false;
  if (cd.running) cd.total = Math.max(cd.total, Math.min(MAX_MS, cd.endAt - now()));

  var s0 = store.get('sw', null) || {};
  var sw = {
    acc: Math.max(0, num(s0.acc, 0)), startAt: num(s0.startAt, 0), running: !!s0.running,
    laps: Array.isArray(s0.laps) ? s0.laps.map(function (v) { return Math.max(0, num(v, 0)); }).slice(0, 999) : []
  };
  if (sw.running && !(sw.startAt > 0)) sw.running = false;

  var p0 = store.get('po', null) || {};
  var po = {
    work: clampInt(p0.work, 1, 180, 25), short: clampInt(p0.short, 1, 60, 5), long: clampInt(p0.long, 1, 120, 15), every: clampInt(p0.every, 1, 12, 4),
    auto: p0.auto !== false,
    phase: ['work', 'short', 'long'].indexOf(p0.phase) >= 0 ? p0.phase : 'work',
    round: 0, running: !!p0.running, started: !!p0.started, endAt: num(p0.endAt, 0), remaining: 0,
    done: Math.max(0, Math.round(num(p0.done, 0))), focusMs: Math.max(0, num(p0.focusMs, 0))
  };
  po.round = clampInt(p0.round, 0, po.every, 0);
  po.remaining = Math.max(0, Math.min(phaseMs(po.phase), num(p0.remaining, phaseMs(po.phase))));
  if (po.running && !(po.endAt > 0)) po.running = false;
  if (!po.started && !po.running) po.remaining = phaseMs(po.phase);

  var sign = SIGN_BY[store.get('sign', 'silent')] ? store.get('sign', 'silent') : 'silent';
  var tab = TABS.indexOf(store.get('tab', 'countdown')) >= 0 ? store.get('tab', 'countdown') : 'countdown';

  function saveCd() { store.set('cd', cd); }
  function saveSw() { store.set('sw', sw); }
  function savePo() { store.set('po', po); }
  function phaseMs(p) { return (p === 'work' ? po.work : p === 'short' ? po.short : po.long) * MIN; }

  /* ------------------------------------------------------------ element cache */
  var E = {
    app: $('#app'),
    cdStage: $('#cd-stage'), cdRing: $('#cd-ring'), cdBar: $('#cd-ring .bar'), cdDigits: $('#cd-digits'), cdStatus: $('#cd-status'), cdOver: $('#cd-over'),
    cdToggle: $('#cd-toggle'), cdActivity: $('#cd-activity'), cdPresets: $('#cd-presets'), cdWarn: $('#cd-warn'),
    swDigits: $('#sw-digits'), swMain: $('#sw-main'), swCs: $('#sw-cs'), swBar: $('#sw-ring .bar'), swStatus: $('#sw-status'), swLast: $('#sw-last'),
    swToggle: $('#sw-toggle'), swLapBtn: $('#sw-lap'), swTbody: $('#sw-table tbody'), swWrap: $('#sw-wrap'), swEmpty: $('#sw-empty'), swSummary: $('#sw-summary'), swCsv: $('#sw-csv'),
    poStage: $('#po-stage'), poBar: $('#po-ring .bar'), poDigits: $('#po-digits'), poStatus: $('#po-status'), poPhase: $('#po-phase'), poDots: $('#po-dots'),
    poSession: $('#po-session'), poToggle: $('#po-toggle'), poStats: $('#po-stats'), poPlans: $('#po-plans'), poAuto: $('#po-auto'),
    sgBoard: $('#sg-board'), sgIcon: $('#sg-icon'), sgTitle: $('#sg-title'), sgDesc: $('#sg-desc'), sgVoice: $('#sg-voice'), sgVoiceTxt: $('#sg-voice-txt'),
    sgTimer: $('#sg-timer'), sgGrid: $('#sg-grid'), printBox: $('#ct-print')
  };

  function setToggle(btn, mode) {           // mode: start | pause | resume | again
    var key = { start: 'btn_start', pause: 'btn_pause', resume: 'btn_resume', again: 'start_again' }[mode];
    var sig = mode + '|' + EDU.lang;
    if (btn.__m === sig) return;
    btn.__m = sig;
    btn.innerHTML = icon(mode === 'pause' ? 'pause' : 'play') + '<span>' + EDU.esc(t(key)) + '</span>';
  }

  /* ------------------------------------------------------------ countdown */
  function cdLeft(n) { return cd.running ? Math.max(0, cd.endAt - n) : cd.remaining; }
  function cdState() {
    if (cd.running) return 'running';
    if (cd.remaining <= 0) return 'done';
    return cd.started ? 'paused' : 'ready';
  }
  function cdStart() {
    silence();
    if (cd.remaining <= 0) { cd.remaining = cd.base; cd.total = cd.base; }
    cd.doneAt = 0;
    cd.endAt = now() + cd.remaining;
    cd.running = true; cd.started = true;
    saveCd(); unlockAudio(); reschedule(); wake(); tick();
  }
  function cdPause() {
    cd.remaining = cdLeft(now());
    cd.running = false;
    saveCd(); reschedule(); wake(); tick();
  }
  function cdToggle() { if (cd.running) cdPause(); else cdStart(); }
  function cdReset() {
    silence();
    cd.running = false; cd.started = false; cd.doneAt = 0;
    cd.total = cd.remaining = cd.base;
    saveCd(); reschedule(); wake(); tick();
  }
  function cdSet(ms) {
    cd.base = Math.max(1000, Math.min(MAX_MS, Math.round(num(ms, 0) / 1000) * 1000));
    cdReset();
    syncCustom();
    labelDynamic();
  }
  function cdPlus() {
    silence(); unlockAudio();
    var n = now();
    if (cd.running) {
      var left = cd.endAt - n, add = Math.max(0, Math.min(MIN, MAX_MS - left));
      cd.endAt += add;
      cd.total = Math.max(left + add, Math.min(MAX_MS, cd.total + add));
    } else if (cd.remaining <= 0) {                 // "one more minute, please!"
      cd.total = cd.remaining = MIN;
      cd.doneAt = 0; cd.endAt = n + MIN; cd.running = true; cd.started = true;
    } else {
      cd.remaining = Math.min(MAX_MS, cd.remaining + MIN);
      cd.total = Math.max(cd.remaining, Math.min(MAX_MS, cd.total + MIN));
    }
    saveCd(); reschedule(); wake(); tick();
  }
  function syncCustom() {
    var s = Math.round(cd.base / 1000);
    $('#cd-h').value = Math.floor(s / 3600);
    $('#cd-m').value = Math.floor((s % 3600) / 60);
    $('#cd-s').value = s % 60;
  }

  /* ------------------------------------------------------------ stopwatch */
  function swElapsed(n) { return sw.acc + (sw.running ? Math.max(0, n - sw.startAt) : 0); }
  function swToggle() {
    var n = now();
    if (sw.running) { sw.acc = swElapsed(n); sw.running = false; }
    else { sw.startAt = n; sw.running = true; }
    saveSw(); wake(); loop(); tick();
  }
  function swLap() {
    if (!sw.running || sw.laps.length >= 999) return;
    sw.laps.push(swElapsed(now()));
    saveSw(); renderLaps(); tick();
  }
  function swReset() {
    sw.acc = 0; sw.startAt = 0; sw.running = false; sw.laps = [];
    saveSw(); renderLaps(); wake(); tick();
  }
  function splits() { return sw.laps.map(function (v, i) { return v - (i ? sw.laps[i - 1] : 0); }); }
  function renderLaps() {
    var L = sw.laps, sp = splits(), tb = E.swTbody;
    tb.innerHTML = '';
    E.swEmpty.hidden = L.length > 0;
    E.swWrap.hidden = !L.length;
    E.swSummary.hidden = !L.length;
    E.swCsv.disabled = !L.length;
    if (!L.length) { E.swSummary.textContent = ''; return; }
    var minI = -1, maxI = -1;
    if (L.length >= 2) {
      minI = 0; maxI = 0;
      sp.forEach(function (v, i) { if (v < sp[minI]) minI = i; if (v > sp[maxI]) maxI = i; });
    }
    for (var i = L.length - 1; i >= 0; i--) {
      var tag = i === minI ? '<span class="badge success">' + EDU.esc(t('fastest')) + '</span>' : i === maxI ? '<span class="badge danger">' + EDU.esc(t('slowest')) + '</span>' : '';
      var tr = document.createElement('tr');
      if (i === minI) tr.className = 'fast'; else if (i === maxI) tr.className = 'slow';
      tr.innerHTML = '<td>' + EDU.esc(t('lap_n', { n: EDU.fmt(i + 1) })) + tag + '</td><td class="num lap-t">' + fmtSw(sp[i]) + '</td><td class="num tot">' + fmtSw(L[i]) + '</td>';
      tb.appendChild(tr);
    }
    var avg = L[L.length - 1] / L.length;
    E.swSummary.innerHTML = '<span>' + EDU.esc(t('laps_count', { n: EDU.fmt(L.length) })) + '</span><span>' + EDU.esc(t('average', { t: fmtSw(avg) })) + '</span>';
  }
  function swCsv() {
    if (!sw.laps.length) return;
    var sp = splits();
    var rows = [[t('lap'), t('lap_time'), t('lap_secs'), t('total_time')]];
    sw.laps.forEach(function (v, i) { rows.push([i + 1, fmtSw(sp[i]), (sp[i] / 1000).toFixed(2), fmtSw(v)]); });
    EDU.download('stopwatch-laps.csv', EDU.csv.stringify(rows), 'text/csv');
  }

  /* ------------------------------------------------------------ pomodoro */
  function poLeft(n) { return po.running ? Math.max(0, po.endAt - n) : po.remaining; }
  function poAdvance(natural, elapsedWork) {
    if (po.phase === 'work') {
      po.round = Math.min(po.every, po.round + 1);
      po.focusMs += natural ? phaseMs('work') : Math.max(0, elapsedWork || 0);
      if (natural) po.done++;
      po.phase = po.round >= po.every ? 'long' : 'short';
    } else {
      if (po.phase === 'long') po.round = 0;
      po.phase = 'work';
    }
  }
  function poToggle() {
    var n = now();
    silence();
    if (po.running) { po.remaining = poLeft(n); po.running = false; }
    else {
      if (po.remaining <= 0) po.remaining = phaseMs(po.phase);
      po.endAt = n + po.remaining; po.running = true; po.started = true; unlockAudio();
    }
    savePo(); reschedule(); wake(); tick();
  }
  function poSkip() {
    var n = now(), wasRunning = po.running;
    silence();
    poAdvance(false, po.phase === 'work' ? phaseMs('work') - poLeft(n) : 0);
    po.remaining = phaseMs(po.phase);
    if (wasRunning) po.endAt = n + po.remaining;
    po.started = wasRunning;
    savePo(); reschedule(); tick();
  }
  function poReset() {
    silence();
    po.phase = 'work'; po.round = 0; po.running = false; po.started = false;
    po.remaining = phaseMs('work'); po.done = 0; po.focusMs = 0;
    savePo(); reschedule(); wake(); tick();
  }
  function poSyncInputs() {
    $('#po-work').value = po.work; $('#po-short').value = po.short; $('#po-long').value = po.long; $('#po-every').value = po.every;
    E.poAuto.checked = po.auto;
    $$('#po-plans button').forEach(function (b) {
      var p = PLANS[b.dataset.plan];
      b.setAttribute('aria-pressed', String(p.work === po.work && p.short === po.short && p.long === po.long && p.every === po.every));
    });
  }
  function poApplyPlan(id) {
    var p = PLANS[id];
    if (!p) return;
    silence();
    po.work = p.work; po.short = p.short; po.long = p.long; po.every = p.every;
    po.phase = 'work'; po.round = 0; po.running = false; po.started = false; po.remaining = phaseMs('work');
    savePo(); poSyncInputs(); reschedule(); wake(); tick();
  }
  function poReadInputs() {
    po.work = clampInt($('#po-work').value, 1, 180, po.work);
    po.short = clampInt($('#po-short').value, 1, 60, po.short);
    po.long = clampInt($('#po-long').value, 1, 120, po.long);
    po.every = clampInt($('#po-every').value, 1, 12, po.every);
    po.round = Math.min(po.round, po.every);
    if (!po.started && !po.running) po.remaining = phaseMs(po.phase);
    else EDU.toast(t('po_next_note'));
    savePo(); poSyncInputs(); tick();
  }

  /* ------------------------------------------------------------ work-mode signs */
  function setSign(id) {
    if (!SIGN_BY[id]) return;
    sign = id;
    store.set('sign', id);
    renderSigns();
  }
  function renderSigns() {
    var s = SIGN_BY[sign];
    E.sgBoard.style.setProperty('--sign', s.color);
    E.sgIcon.textContent = s.icon;
    setText(E.sgTitle, t('sign_' + s.id));
    setText(E.sgDesc, t('sign_' + s.id + '_d'));
    E.sgVoice.hidden = s.voice === null;
    if (s.voice !== null) {
      setText(E.sgVoiceTxt, t('voice_level', { n: EDU.fmt(s.voice) }));
      $$('.sg-bars i', E.sgVoice).forEach(function (b, i) { b.classList.toggle('on', i < s.voice); });
    }
    $$('.sg-btn', E.sgGrid).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.sign === sign)); });
  }
  function printSigns(all) {
    var box = E.printBox;
    box.innerHTML = '';
    (all ? SIGNS : [SIGN_BY[sign]]).forEach(function (s) {
      var page = EDU.el('div', { class: 'ps-page' },
        EDU.el('div', { class: 'ps-icon', text: s.icon }),
        EDU.el('div', { class: 'ps-title', text: t('sign_' + s.id) }),
        EDU.el('div', { class: 'ps-desc', text: t('sign_' + s.id + '_d') }),
        s.voice !== null ? EDU.el('div', { class: 'ps-voice', text: t('voice_level', { n: EDU.fmt(s.voice) }) }) : null);
      page.style.setProperty('--sign', EDU.css(s.color.slice(4, -1)) || '#5f3dc4');
      box.appendChild(page);
    });
    document.body.classList.add('ct-printing');
    try { window.print(); } catch (e) { }
  }
  window.addEventListener('afterprint', function () { document.body.classList.remove('ct-printing'); });

  /* ------------------------------------------------------------ alarm scheduling */
  function reschedule() {
    if (cd.running) {
      schedule('cd', cd.endAt, sound);
      var w = cd.endAt - MIN;
      schedule('cdwarn', warn1 && cd.total > MIN + 1000 && w > now() + 500 ? w : 0, 'warn');
    } else { cancel('cd'); cancel('cdwarn'); }
    if (po.running) schedule('po', po.endAt, sound); else cancel('po');
  }

  /* ------------------------------------------------------------ keep the screen awake while a timer runs */
  var wakeLock = null, wakeBusy = false;
  function anyRunning() { return cd.running || sw.running || po.running; }
  function wake() {
    var want = anyRunning() && !document.hidden;
    if (want && !wakeLock && !wakeBusy && navigator.wakeLock && navigator.wakeLock.request) {
      wakeBusy = true;
      try {
        navigator.wakeLock.request('screen').then(function (l) {
          wakeBusy = false; wakeLock = l;
          l.addEventListener('release', function () { if (wakeLock === l) wakeLock = null; });
          if (!anyRunning()) wake();
        }, function () { wakeBusy = false; });
      } catch (e) { wakeBusy = false; }
    } else if (!want && wakeLock) {
      var l = wakeLock; wakeLock = null;
      try { l.release().catch(function () { }); } catch (e) { }
    }
  }

  /* ------------------------------------------------------------ the clock */
  var booting = true;
  function tick() {
    var n = now();
    if (cd.running && n >= cd.endAt) {
      cd.running = false; cd.remaining = 0; cd.doneAt = cd.endAt;
      saveCd();
      cancel('cdwarn');
      if (booting) cancel('cd'); else alarmFor('cd', cd.doneAt);
      wake();
    }
    if (po.running && n >= po.endAt) {
      var firstEnd = po.endAt, endedWork = po.phase === 'work', guard = 0;
      while (po.running && n >= po.endAt && guard++ < 500) {   // catch up if several parts ended while away
        var end = po.endAt;
        endedWork = po.phase === 'work';
        poAdvance(true);
        if (po.auto) po.endAt = end + phaseMs(po.phase);
        else { po.running = false; po.started = false; po.remaining = phaseMs(po.phase); }
      }
      savePo();
      if (booting) cancel('po');
      else { alarmFor('po', firstEnd); EDU.toast(t(endedWork ? 'po_work_over' : 'po_break_over'), 4000); }
      reschedule(); wake();
    }
    renderCd(n); renderSw(n); renderPo(n); renderSignTimer(n); renderTitle(n);
  }

  function renderCd(n) {
    var st = cdState(), left = cdLeft(n), secs = Math.ceil(left / 1000), d = fmtDown(left);
    setText(E.cdDigits, d);
    E.cdDigits.classList.toggle('long', d.length > 5);
    E.cdRing.classList.toggle('warn', st !== 'done' && secs > 0 && secs < 60);
    E.cdRing.classList.toggle('done', st === 'done');
    E.cdStage.classList.toggle('is-done', st === 'done');
    setRing(E.cdBar, st === 'done' ? 0 : left / Math.max(1, cd.total));
    setText(E.cdStatus, st === 'ready' ? t('st_ready') : st === 'paused' ? t('st_paused') : st === 'done' ? t('times_up') : t('ends_at', { time: clockTime(cd.endAt) }));
    var over = st === 'done' && cd.doneAt ? n - cd.doneAt : -1;
    setText(E.cdOver, over >= 1000 && over < 3600000 ? t('over_by', { t: fmtUp(over) }) : '');
    setToggle(E.cdToggle, st === 'running' ? 'pause' : st === 'paused' ? 'resume' : st === 'done' ? 'again' : 'start');
  }
  function renderSw(n) {
    var el = swElapsed(n), f = fmtSw(el), dot = f.lastIndexOf('.');
    setText(E.swMain, f.slice(0, dot));
    setText(E.swCs, f.slice(dot));
    E.swDigits.classList.toggle('long', el >= 3600000);
    setRing(E.swBar, (el % MIN) / MIN);
    setText(E.swStatus, sw.running ? t('st_running') : el > 0 ? t('st_paused') : t('st_ready'));
    setToggle(E.swToggle, sw.running ? 'pause' : el > 0 ? 'resume' : 'start');
    E.swLapBtn.disabled = !sw.running;
    var L = sw.laps;
    setText(E.swLast, L.length ? t('lap_n', { n: EDU.fmt(L.length) }) + ' · ' + fmtSw(L[L.length - 1] - (L.length > 1 ? L[L.length - 2] : 0)) : '');
  }
  function renderPo(n) {
    var left = poLeft(n), d = fmtDown(left);
    setText(E.poDigits, d);
    E.poDigits.classList.toggle('long', d.length > 5);
    setRing(E.poBar, left / Math.max(1, phaseMs(po.phase)));
    E.poStage.classList.toggle('brk', po.phase !== 'work');
    setText(E.poPhase, t('phase_' + po.phase));
    var st = po.running ? 'running' : po.started ? 'paused' : 'ready';
    setText(E.poStatus, st === 'running' ? t('ends_at', { time: clockTime(po.endAt) }) : st === 'paused' ? t('st_paused') : t('st_ready'));
    setToggle(E.poToggle, st === 'running' ? 'pause' : st === 'paused' ? 'resume' : 'start');
    var sn = po.phase === 'work' ? po.round + 1 : po.phase === 'long' ? po.every : Math.max(1, po.round);
    setText(E.poSession, t('session_of', { n: EDU.fmt(Math.min(sn, po.every)), m: EDU.fmt(po.every) }));
    var filled = po.phase === 'long' ? po.every : po.round, sig = filled + '/' + po.every;
    if (E.poDots.__s !== sig) {
      E.poDots.__s = sig;
      E.poDots.innerHTML = '';
      for (var i = 0; i < po.every; i++) E.poDots.appendChild(EDU.el('i', { class: i < filled ? 'on' : '' }));
    }
    setText(E.poStats, t('po_stats', { n: EDU.fmt(po.done), m: EDU.fmt(Math.round(po.focusMs / MIN)) }));
  }
  function renderSignTimer(n) {
    var st = cdState(), el = E.sgTimer;
    var show = st === 'running' || st === 'paused' || (st === 'done' && cd.started);
    el.hidden = !show;
    if (!show) return;
    var left = cdLeft(n), secs = Math.ceil(left / 1000);
    setText(el, st === 'done' ? t('times_up') : t('time_left', { t: fmtDown(left) }));
    el.classList.toggle('warn', st !== 'done' && secs < 60);
    el.classList.toggle('done', st === 'done');
  }
  function renderTitle(n) {
    var cdActive = cd.started || cdState() === 'done';
    var parts = {
      countdown: cdActive ? (cdState() === 'done' ? '⏰ ' + t('times_up') : '⏳ ' + fmtDown(cdLeft(n))) : '',
      stopwatch: sw.running || swElapsed(n) > 0 ? '⏱ ' + fmtUp(swElapsed(n)) : '',
      pomodoro: po.started ? '🍅 ' + fmtDown(poLeft(n)) + ' ' + t('phase_' + po.phase) : ''
    };
    var pick = tab === 'signs' ? parts.countdown : parts[tab];
    if (!pick) pick = parts.countdown || parts.pomodoro || (sw.running ? parts.stopwatch : '');
    var full = pick ? pick + ' · ' + t('app_title') : t('app_title') + ' · ' + t('brand');
    if (document.title !== full) document.title = full;
  }

  /* smooth hundredths for the stopwatch while it is on screen */
  var raf = 0;
  function loop() {
    if (raf || !sw.running || tab !== 'stopwatch' || document.hidden) return;
    raf = requestAnimationFrame(function () { raf = 0; renderSw(now()); loop(); });
  }

  /* ------------------------------------------------------------ tabs */
  function showTab(name, focus) {
    if (TABS.indexOf(name) < 0) name = 'countdown';
    tab = name;
    store.set('tab', name);
    TABS.forEach(function (k) {
      var b = $('#tab-' + k), on = k === name;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      $('#panel-' + k).hidden = !on;
    });
    if (focus) $('#tab-' + name).focus();
    loop(); tick();
  }
  $$('#ct-tabs [role="tab"]').forEach(function (b) { b.addEventListener('click', function () { showTab(b.dataset.tab); }); });
  $('#ct-tabs').addEventListener('keydown', function (e) {
    var i = TABS.indexOf(tab), rtl = document.documentElement.dir === 'rtl', k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowLeft') {
      var step = (k === 'ArrowRight') !== rtl ? 1 : -1;
      showTab(TABS[(i + step + TABS.length) % TABS.length], true); e.preventDefault();
    } else if (k === 'Home') { showTab(TABS[0], true); e.preventDefault(); }
    else if (k === 'End') { showTab(TABS[TABS.length - 1], true); e.preventDefault(); }
  });

  /* ------------------------------------------------------------ full screen (with a fallback for phones without the API) */
  var pseudo = null;
  function fsElement() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
  function currentStage() { return $('#' + STAGES[TABS.indexOf(tab)]); }
  function setPseudo(stage) {
    pseudo = stage;
    document.documentElement.classList.toggle('ct-noscroll', !!stage);
    renderFs();
  }
  function toggleFs(stage) {
    unlockAudio();
    if (pseudo) { setPseudo(null); return; }
    if (fsElement()) {
      var ex = document.exitFullscreen || document.webkitExitFullscreen;
      try { var r = ex.call(document); if (r && r.catch) r.catch(function () { }); } catch (e) { }
      return;
    }
    if (!stage) return;
    var req = stage.requestFullscreen || stage.webkitRequestFullscreen;
    if (!req) { setPseudo(stage); return; }
    try {
      var p = req.call(stage);
      if (p && p.then) p.then(null, function () { setPseudo(stage); });
    } catch (e) { setPseudo(stage); }
  }
  function renderFs() {
    var fe = fsElement() || pseudo;
    STAGES.forEach(function (id) { var s = $('#' + id); s.classList.toggle('is-fs', fe === s); });
    $$('.ct-fs').forEach(function (b) {
      var on = !!fe && fe.id === b.dataset.stage;
      b.innerHTML = icon(on ? 'shrink' : 'expand') + '<span>' + EDU.esc(t(on ? 'exit_fullscreen' : 'fullscreen')) + '</span>';
      b.setAttribute('aria-pressed', String(on));
    });
  }
  document.addEventListener('fullscreenchange', renderFs);
  document.addEventListener('webkitfullscreenchange', renderFs);
  $$('.ct-fs').forEach(function (b) { b.addEventListener('click', function () { toggleFs($('#' + b.dataset.stage)); }); });

  /* ------------------------------------------------------------ build dynamic controls */
  PRESETS.forEach(function (m) {
    var b = EDU.el('button', { type: 'button', class: 'btn ct-preset', 'data-min': m, 'aria-pressed': 'false' },
      EDU.el('b', { text: EDU.fmt(m) }), EDU.el('small', { 'data-i18n': 'min_short', text: t('min_short') }));
    b.addEventListener('click', function () { cdSet(m * MIN); });
    E.cdPresets.appendChild(b);
  });
  PLAN_ORDER.forEach(function (id) {
    var b = EDU.el('button', { type: 'button', class: 'btn', 'data-plan': id, 'data-i18n': 'plan_' + id, text: t('plan_' + id), 'aria-pressed': 'false' });
    b.addEventListener('click', function () { poApplyPlan(id); });
    E.poPlans.appendChild(b);
  });
  SIGNS.forEach(function (s, i) {
    var b = EDU.el('button', { type: 'button', class: 'sg-btn', 'data-sign': s.id, 'aria-pressed': 'false' },
      EDU.el('span', { class: 'sg-btn-ico', 'aria-hidden': 'true', text: s.icon }),
      EDU.el('span', { class: 'sg-btn-txt', 'data-i18n': 'sign_' + s.id, text: t('sign_' + s.id) }),
      EDU.el('kbd', { class: 'sg-key', 'aria-hidden': 'true', text: String(i + 1) }));
    b.style.setProperty('--sign', s.color);
    b.addEventListener('click', function () { setSign(s.id); });
    E.sgGrid.appendChild(b);
  });
  function labelDynamic() {
    $$('.ct-preset').forEach(function (b) {
      var m = +b.dataset.min;
      b.setAttribute('aria-label', t('min_n', { n: EDU.fmt(m) }));
      b.setAttribute('aria-pressed', String(cd.base === m * MIN));
    });
  }

  /* ------------------------------------------------------------ wire up controls */
  E.cdToggle.addEventListener('click', cdToggle);
  $('#cd-plus').addEventListener('click', cdPlus);
  $('#cd-reset').addEventListener('click', cdReset);
  $('#cd-custom').addEventListener('submit', function (e) {
    e.preventDefault();
    var h = Math.max(0, Math.floor(num($('#cd-h').value, 0)));
    var m = Math.max(0, Math.floor(num($('#cd-m').value, 0)));
    var s = Math.max(0, Math.floor(num($('#cd-s').value, 0)));
    var ms = (h * 3600 + m * 60 + s) * 1000;
    if (!(ms > 0)) { EDU.toast(t('enter_time')); return; }
    cdSet(ms);
  });
  E.cdActivity.value = cd.activity;
  E.cdActivity.addEventListener('input', function () { cd.activity = E.cdActivity.value.slice(0, 80); saveCd(); });
  E.cdActivity.addEventListener('keydown', function (e) { if (e.key === 'Enter') E.cdActivity.blur(); });
  E.cdWarn.checked = warn1;
  E.cdWarn.addEventListener('change', function () { warn1 = E.cdWarn.checked; store.set('warn1', warn1); unlockAudio(); reschedule(); });
  $$('.ct-sound').forEach(function (sel) {
    sel.value = sound;
    sel.addEventListener('change', function () {
      sound = SOUNDS.indexOf(sel.value) >= 0 ? sel.value : 'bell';
      store.set('sound', sound);
      $$('.ct-sound').forEach(function (o) { o.value = sound; });
      unlockAudio(); reschedule();
    });
  });
  $$('.ct-test').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!audio()) { EDU.toast(t('no_audio')); return; }
      if (sound === 'off') { EDU.toast(t('sound_off')); return; }
      silence(); unlockAudio(); playNow(sound);
    });
  });

  E.swToggle.addEventListener('click', swToggle);
  E.swLapBtn.addEventListener('click', swLap);
  $('#sw-reset').addEventListener('click', swReset);
  E.swCsv.addEventListener('click', swCsv);

  E.poToggle.addEventListener('click', poToggle);
  $('#po-skip').addEventListener('click', poSkip);
  $('#po-reset').addEventListener('click', poReset);
  ['#po-work', '#po-short', '#po-long', '#po-every'].forEach(function (id) { $(id).addEventListener('change', poReadInputs); });
  E.poAuto.addEventListener('change', function () { po.auto = E.poAuto.checked; savePo(); });

  $('#sg-print').addEventListener('click', function () { printSigns(false); });
  $('#sg-print-all').addEventListener('click', function () { printSigns(true); });

  /* after a mouse / touch click, drop focus so Space works as the global start / pause key */
  E.app.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('button') : null;
    if (b && e.detail > 0) b.blur();
  });

  /* keyboard: Space start/pause · R reset · F full screen · L lap · 1–8 signs */
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
    var tg = e.target, tn = tg && tg.tagName;
    if (tn === 'INPUT' || tn === 'TEXTAREA' || tn === 'SELECT' || (tg && tg.isContentEditable)) return;
    if (document.querySelector('.edu-modal-back')) return;
    var k = e.key;
    if (k === ' ' || k === 'Spacebar') {
      if (tn === 'BUTTON' || tn === 'SUMMARY' || tn === 'A') return;   // let the focused control work normally
      e.preventDefault();
      if (tab === 'stopwatch') swToggle(); else if (tab === 'pomodoro') poToggle(); else cdToggle();
    } else if (k === 'r' || k === 'R') {
      if (tab === 'stopwatch') swReset(); else if (tab === 'pomodoro') poReset(); else cdReset();
    } else if (k === 'f' || k === 'F') {
      toggleFs(pseudo || fsElement() || currentStage());
    } else if ((k === 'l' || k === 'L') && tab === 'stopwatch') {
      swLap();
    } else if (tab === 'signs' && /^[1-8]$/.test(k)) {
      setSign(SIGNS[+k - 1].id);
    } else if (k === 'Escape' && pseudo) {
      setPseudo(null);
    }
  });

  document.addEventListener('visibilitychange', function () { tick(); loop(); wake(); });

  EDU.onLang(function () {
    labelDynamic();
    renderLaps();
    renderSigns();
    renderFs();
    tick();
  });

  /* ------------------------------------------------------------ start */
  syncCustom();
  poSyncInputs();
  labelDynamic();
  renderLaps();
  renderSigns();
  renderFs();
  if (po.running && now() - po.endAt > 3 * 3600000) {   // left running for hours (closed laptop): start fresh
    po.running = false; po.started = false; po.phase = 'work'; po.round = 0; po.remaining = phaseMs('work'); savePo();
  }
  tick();                                      // catches up timers that ended while the page was closed (silently)
  if (cdState() === 'done' && (!cd.doneAt || now() - cd.doneAt > 3600000)) cdReset();   // tidy a finish from long ago
  booting = false;
  showTab(tab);
  setInterval(tick, 200);
  /* after a reload with a timer running, the first tap anywhere re-arms the alarm sound */
  ['pointerdown', 'keydown'].forEach(function (ev) {
    document.addEventListener(ev, function () { if (cd.running || po.running) unlockAudio(); }, true);
  });
  wake();
})();
