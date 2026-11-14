/* Audio Recorder & Trimmer: record or open a sound, pick a part, trim / cut, fades + volume, download WAV or a
   smaller MediaRecorder file. Web Audio API only; nothing leaves the device. */
(function () {
  'use strict';
  var $ = EDU.$, t = EDU.t;
  var MAX_MIN = 30, MAX_SEC = MAX_MIN * 60, MAX_MB = 300, MIN_GAP = 0.02;
  var AC = window.AudioContext || window.webkitAudioContext;
  var app = $('#app');

  EDU.init({ slug: 'audio-recorder-trimmer', title: 'app_title', waKey: 'shell_wa_tool' });

  var S = {
    state: 'idle',            // idle | recording | paused | busy
    buf: null,                // { sr, ch: [Float32Array, ...] }
    undo: null, a: 0, b: 0,
    fadeIn: 0, fadeOut: 0, vol: 100,
    msg: null, edMsg: null, dlMsg: null,   // { key, vars, kind }
    limited: null, playing: false, encoding: false, encP: 0, autoName: ''
  };
  var R = {};                 // recorder bits
  var P = {};                 // player bits
  var ctx = null, peaks = null, peaksW = 0;
  window.ART_TEST = { lastBlob: null, lastName: '' };

  function ac() { if (!ctx) ctx = new AC(); if (ctx.state === 'suspended') ctx.resume(); return ctx; }
  function dur() { return S.buf ? S.buf.ch[0].length / S.buf.sr : 0; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmtT(s, tenths) {
    s = Math.max(0, s);
    var m = Math.floor(s / 60), r = s - m * 60;
    if (tenths) { var x = Math.floor(r * 10 + 1e-6) / 10; return m + ':' + (x < 10 ? '0' : '') + x.toFixed(1); }
    return m + ':' + pad(Math.floor(r));
  }
  function fmtSize(b) { return b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  function stamp() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes()); }

  /* ------------------------------------------------------------ messages */
  function showMsg(el, m) {
    if (!m) { el.hidden = true; el.textContent = ''; return; }
    el.hidden = false;
    el.className = 'callout ' + (m.kind || '');
    el.textContent = t(m.key, m.vars);
  }
  function setMsg(key, kind, vars) { S.msg = key ? { key: key, kind: kind || 'warning', vars: vars } : null; showMsg($('#msg'), S.msg); }
  function setEdMsg(key, kind, vars) { S.edMsg = key ? { key: key, kind: kind || 'warning', vars: vars } : null; showMsg($('#edMsg'), S.edMsg); }
  function setDlMsg(key, kind, vars) { S.dlMsg = key ? { key: key, kind: kind || 'success', vars: vars } : null; showMsg($('#dlMsg'), S.dlMsg); }

  /* ------------------------------------------------------------ recording */
  function recElapsed() { return (R.acc || 0) + (S.state === 'recording' ? (performance.now() - R.t0) / 1000 : 0); }
  function startRec() {
    if (S.state !== 'idle') return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder || !AC) { setMsg('err_unsupported', 'danger'); return; }
    stopPlay(); setMsg(null);
    S.state = 'busy'; renderState();
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      var mr;
      try { mr = new MediaRecorder(stream); } catch (e) { stream.getTracks().forEach(function (x) { x.stop(); }); S.state = 'idle'; renderState(); setMsg('err_unsupported', 'danger'); return; }
      R = { stream: stream, mr: mr, chunks: [], acc: 0, t0: performance.now(), hitMax: false };
      mr.ondataavailable = function (e) { if (e.data && e.data.size) R.chunks.push(e.data); };
      mr.onstop = function () {
        releaseMic();
        var blob = new Blob(R.chunks, { type: mr.mimeType || 'audio/webm' });
        var hit = R.hitMax;
        R.chunks = [];
        if (!blob.size) { S.state = 'idle'; renderState(); setMsg('err_empty'); return; }
        decodeBlob(blob, true, hit);
      };
      try {
        R.src = ac().createMediaStreamSource(stream);
        R.an = ac().createAnalyser(); R.an.fftSize = 1024;
        R.src.connect(R.an);
        R.data = new Float32Array(R.an.fftSize);
      } catch (e) { R.an = null; }
      mr.start(1000);
      S.state = 'recording'; renderState();
      R.raf = requestAnimationFrame(recTick);
    }).catch(function (e) {
      S.state = 'idle'; renderState();
      var n = (e && e.name) || '';
      if (n === 'NotFoundError' || n === 'DevicesNotFoundError' || n === 'OverconstrainedError' || n === 'NotReadableError') setMsg('err_nomic', 'danger');
      else setMsg('err_denied', 'danger');
    });
  }
  function releaseMic() {
    cancelAnimationFrame(R.raf);
    try { if (R.src) R.src.disconnect(); } catch (e) { /* already gone */ }
    if (R.stream) R.stream.getTracks().forEach(function (x) { x.stop(); });
    R.stream = null;
  }
  function recTick() {
    if (S.state !== 'recording' && S.state !== 'paused') return;
    var el = recElapsed();
    $('#recTime').textContent = fmtT(el);
    var lv = 0;
    if (R.an && S.state === 'recording') {
      R.an.getFloatTimeDomainData(R.data);
      var s = 0; for (var i = 0; i < R.data.length; i++) s += R.data[i] * R.data[i];
      var db = 20 * Math.log10(Math.sqrt(s / R.data.length) + 1e-7);
      lv = EDU.clamp((db + 60) / 60, 0, 1);
    }
    var f = $('#levelFill'); f.style.width = Math.round(lv * 100) + '%'; f.classList.toggle('hot', lv > 0.92);
    if (el >= MAX_SEC) { R.hitMax = true; stopRec(); return; }
    R.raf = requestAnimationFrame(recTick);
  }
  function togglePause() {
    if (!R.mr) return;
    if (S.state === 'recording') { R.acc = recElapsed(); try { R.mr.pause(); } catch (e) { return; } S.state = 'paused'; }
    else if (S.state === 'paused') { try { R.mr.resume(); } catch (e) { return; } R.t0 = performance.now(); S.state = 'recording'; }
    renderState();
  }
  function stopRec() {
    if (S.state !== 'recording' && S.state !== 'paused') return;
    R.acc = recElapsed();
    S.state = 'busy'; renderState();
    try { R.mr.stop(); } catch (e) { releaseMic(); S.state = 'idle'; renderState(); }
  }

  /* ------------------------------------------------------------ loading */
  function decodeBlob(blob, fromMic, hitMax) {
    S.state = 'busy'; renderState(); setMsg('working', 'accent');
    var fail = function (key, vars) { S.state = 'idle'; renderState(); setMsg(key, 'danger', vars); };
    if (!AC) { fail('err_unsupported'); return; }
    var fr = new FileReader();
    fr.onerror = function () { fail('err_notaudio'); };
    fr.onload = function () {
      var done = false;
      var ok = function (ab) {
        if (done) return; done = true;
        if (!ab || !ab.length || !ab.duration) { fail('err_empty'); return; }
        if (!fromMic && ab.duration > MAX_SEC + 1) { fail('err_long', { m: Math.ceil(ab.duration / 60), n: MAX_MIN }); return; }
        var n = Math.min(ab.length, Math.floor(MAX_SEC * ab.sampleRate)), ch = [];
        for (var c = 0; c < Math.min(2, ab.numberOfChannels); c++) { var d = ab.getChannelData(c); ch.push(d.length === n ? d : d.subarray(0, n)); }
        setBuffer({ sr: ab.sampleRate, ch: ch });
        setMsg(hitMax ? 'rec_max' : null, 'warning', { n: MAX_MIN });
      };
      var bad = function () { if (done) return; done = true; fail(fromMic ? 'err_empty' : 'err_notaudio'); };
      try { var p = ac().decodeAudioData(fr.result, ok, bad); if (p && p.then) p.then(ok, bad); } catch (e) { bad(); }
    };
    fr.readAsArrayBuffer(blob);
  }
  function openFile(file) {
    if (!file) return;
    stopPlay();
    if (!file.size) { setMsg('err_empty', 'danger'); return; }
    if (file.size > MAX_MB * 1048576) { setMsg('err_big', 'danger', { mb: Math.round(file.size / 1048576), max: MAX_MB }); return; }
    decodeBlob(file, false, false);
  }
  function sampleTone() {
    /* a short tune made with maths: 4 seconds, mono */
    var sr = 44100, n = sr * 4, d = new Float32Array(n), notes = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 261.63];
    var per = n / notes.length;
    for (var i = 0; i < n; i++) {
      var k = Math.floor(i / per), x = (i - k * per) / per, f = notes[k];
      var env = Math.min(1, x * 30) * Math.pow(1 - x, 1.4);
      d[i] = 0.42 * env * (Math.sin(2 * Math.PI * f * i / sr) + 0.35 * Math.sin(4 * Math.PI * f * i / sr));
    }
    stopPlay(); setMsg(null);
    setBuffer({ sr: sr, ch: [d] });
  }
  function setBuffer(b) {
    S.buf = b; S.undo = null; S.a = 0; S.b = dur(); peaks = null;
    S.state = 'idle'; S.autoName = 'audio-' + stamp();
    $('#fileName').value = S.autoName;
    setEdMsg(null); setDlMsg(null);
    renderState(); syncSel(); drawWave();
    try { $('#edCard').scrollIntoView({ block: 'nearest' }); } catch (e) { /* old browsers */ }
  }

  /* ------------------------------------------------------------ editing */
  function setSel(a, b) {
    var d = dur();
    a = EDU.clamp(a, 0, d); b = EDU.clamp(b, 0, d);
    if (b - a < MIN_GAP) { if (a + MIN_GAP <= d) b = a + MIN_GAP; else { b = d; a = Math.max(0, d - MIN_GAP); } }
    S.a = a; S.b = b;
    if (S.playing) stopPlay();
    syncSel(); drawWave();
  }
  function syncSel() {
    var d = dur(), A = $('#selA'), B = $('#selB');
    A.max = B.max = d.toFixed(2);
    A.value = S.a.toFixed(2); B.value = S.b.toFixed(2);
    $('#numA').textContent = fmtT(S.a, true); $('#numB').textContent = fmtT(S.b, true);
    $('#selInfo').textContent = t('sel_info', { sel: fmtT(S.b - S.a, true), total: fmtT(d, true) });
    app.setAttribute('data-dur', d.toFixed(3));
    app.setAttribute('data-sel', (S.b - S.a).toFixed(3));
    $('#undoBtn').disabled = !S.undo;
    S.limited = null; renderVol();
  }
  function idx(sec) { return EDU.clamp(Math.round(sec * S.buf.sr), 0, S.buf.ch[0].length); }
  function pushUndo() { S.undo = { buf: S.buf, a: S.a, b: S.b }; }
  function trim() {
    if (!S.buf) return; stopPlay();
    var i0 = idx(S.a), i1 = idx(S.b);
    if (i1 - i0 < 2) { setEdMsg('msg_sel_small'); return; }
    if (i0 === 0 && i1 === S.buf.ch[0].length) { setEdMsg('msg_trimmed', 'success', { t: fmtT(dur(), true) }); return; }
    pushUndo();
    S.buf = { sr: S.buf.sr, ch: S.buf.ch.map(function (c) { return c.slice(i0, i1); }) };
    afterEdit();
  }
  function cut() {
    if (!S.buf) return; stopPlay();
    var i0 = idx(S.a), i1 = idx(S.b), n = S.buf.ch[0].length;
    if (i1 - i0 >= n - 2) { setEdMsg('msg_cut_all'); return; }
    pushUndo();
    S.buf = { sr: S.buf.sr, ch: S.buf.ch.map(function (c) { var o = new Float32Array(n - (i1 - i0)); o.set(c.subarray(0, i0), 0); o.set(c.subarray(i1), i0); return o; }) };
    afterEdit();
  }
  function afterEdit() {
    peaks = null; S.a = 0; S.b = dur();
    syncSel(); drawWave();
    setEdMsg('msg_trimmed', 'success', { t: fmtT(dur(), true) });
  }
  function undo() {
    if (!S.undo) return; stopPlay();
    S.buf = S.undo.buf; S.a = S.undo.a; S.b = S.undo.b; S.undo = null; peaks = null;
    setEdMsg(null); syncSel(); drawWave();
  }

  /* the selected part with fades and volume: what you hear is what you download */
  function renderOut() {
    var sr = S.buf.sr, i0 = idx(S.a), i1 = idx(S.b), n = i1 - i0, g = S.vol / 100, peak = 0, c, i;
    for (c = 0; c < S.buf.ch.length; c++) { var d = S.buf.ch[c]; for (i = i0; i < i1; i++) { var v = d[i] < 0 ? -d[i] : d[i]; if (v > peak) peak = v; } }
    var limited = null;
    if (g > 1 && peak * g > 0.98) { g = Math.max(1, 0.98 / (peak || 1)); limited = Math.round(g * 100); }
    var fi = Math.min(Math.round(S.fadeIn * sr), Math.floor(n / 2)), fo = Math.min(Math.round(S.fadeOut * sr), Math.floor(n / 2));
    var out = [];
    for (c = 0; c < S.buf.ch.length; c++) {
      var o = new Float32Array(n), s = S.buf.ch[c];
      for (i = 0; i < n; i++) o[i] = s[i0 + i] * g;
      for (i = 0; i < fi; i++) o[i] *= i / fi;
      for (i = 0; i < fo; i++) o[n - 1 - i] *= i / fo;
      out.push(o);
    }
    S.limited = limited; renderVol();
    return { sr: sr, ch: out };
  }
  function toAudioBuffer(o) {
    var ab = ac().createBuffer(o.ch.length, o.ch[0].length, o.sr);
    for (var c = 0; c < o.ch.length; c++) ab.getChannelData(c).set(o.ch[c]);
    return ab;
  }

  /* ------------------------------------------------------------ playing */
  function play() {
    if (!S.buf || S.encoding) return;
    if (S.playing) { stopPlay(); return; }
    var o;
    try { o = renderOut(); if (o.ch[0].length < 2) { setEdMsg('msg_sel_small'); return; } P.src = ac().createBufferSource(); P.src.buffer = toAudioBuffer(o); }
    catch (e) { setEdMsg('err_mem', 'danger'); return; }
    P.src.connect(ac().destination);
    P.t0 = ac().currentTime; P.len = S.b - S.a;
    var me = P.src;
    me.onended = function () { if (P.src === me) stopPlay(); };
    P.src.start();
    S.playing = true; renderPlay();
    (function tick() { if (!S.playing) return; drawWave(); P.raf = requestAnimationFrame(tick); })();
  }
  function stopPlay() {
    if (!S.playing) return;
    S.playing = false; cancelAnimationFrame(P.raf);
    try { P.src.onended = null; P.src.stop(); P.src.disconnect(); } catch (e) { /* not started */ }
    P.src = null; renderPlay(); drawWave();
  }

  /* ------------------------------------------------------------ waveform */
  function buildPeaks(W) {
    var d = S.buf.ch[0], d2 = S.buf.ch[1], n = d.length, mn = new Float32Array(W), mx = new Float32Array(W);
    for (var x = 0; x < W; x++) {
      var s = Math.floor(x * n / W), e = Math.max(s + 1, Math.floor((x + 1) * n / W)), step = Math.max(1, Math.floor((e - s) / 160)), lo = 0, hi = 0;
      for (var i = s; i < e; i += step) { var v = d[i]; if (d2) v = (v + d2[i]) / 2; if (v < lo) lo = v; if (v > hi) hi = v; }
      mn[x] = lo; mx[x] = hi;
    }
    peaks = { mn: mn, mx: mx }; peaksW = W;
  }
  function drawWave() {
    var cv = $('#wave'); if (!S.buf || !cv.clientWidth) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.round(cv.clientWidth * dpr), H = Math.round(cv.clientHeight * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; peaks = null; }
    if (!peaks || peaksW !== W) buildPeaks(W);
    var g = cv.getContext('2d'), d = dur(), xa = S.a / d * W, xb = S.b / d * W, mid = H / 2, amp = H / 2 - 6 * dpr, x;
    g.clearRect(0, 0, W, H);
    g.fillStyle = EDU.css('--primary-soft') || 'rgba(60,120,255,.15)';
    g.fillRect(xa, 0, xb - xa, H);
    var cIn = EDU.css('--primary') || '#2563eb', cOut = EDU.css('--muted') || '#888';
    for (x = 0; x < W; x++) {
      g.fillStyle = (x >= xa && x <= xb) ? cIn : cOut;
      var y0 = mid - peaks.mx[x] * amp, y1 = mid - peaks.mn[x] * amp;
      g.fillRect(x, y0, 1, Math.max(1, y1 - y0));
    }
    /* handles */
    var hc = EDU.css('--accent') || '#f59e0b', hw = 3 * dpr, kw = 14 * dpr, kh = 44 * dpr;
    [xa, xb].forEach(function (hx, k) {
      var px = EDU.clamp(hx, hw / 2, W - hw / 2);
      g.fillStyle = hc; g.fillRect(px - hw / 2, 0, hw, H);
      var kx = k === 0 ? Math.min(px, W - kw) : Math.max(px - kw, 0);
      g.fillRect(kx, mid - kh / 2, kw, kh);
      g.fillStyle = '#fff'; g.fillRect(kx + kw / 2 - dpr, mid - kh / 4, 2 * dpr, kh / 2);
    });
    if (S.playing && P.len) {
      var px2 = (S.a + Math.min(P.len, ac().currentTime - P.t0)) / d * W;
      g.fillStyle = EDU.css('--text') || '#000'; g.fillRect(px2 - dpr, 0, 2 * dpr, H);
    }
  }
  var drag = null;
  function waveTime(e) { var r = $('#wave').getBoundingClientRect(); return EDU.clamp((e.clientX - r.left) / r.width, 0, 1) * dur(); }
  function onDown(e) {
    if (!S.buf || S.encoding) return;
    var tm = waveTime(e);
    drag = Math.abs(tm - S.a) <= Math.abs(tm - S.b) ? 'a' : 'b';
    try { e.target.setPointerCapture(e.pointerId); } catch (x) { /* fine */ }
    onMove(e); e.preventDefault();
  }
  function onMove(e) {
    if (!drag) return;
    var tm = waveTime(e);
    if (drag === 'a') setSel(Math.min(tm, S.b - MIN_GAP), S.b); else setSel(S.a, Math.max(tm, S.a + MIN_GAP));
  }
  function onUp() { drag = null; }

  /* ------------------------------------------------------------ export */
  function fileBase() {
    var v = ($('#fileName').value || '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().replace(/\.+$/, '');
    return v || S.autoName || ('audio-' + stamp());
  }
  function encodeWav(o) {
    var nch = o.ch.length, n = o.ch[0].length, bytes = n * nch * 2, ab = new ArrayBuffer(44 + bytes), dv = new DataView(ab);
    var str = function (p, s) { for (var i = 0; i < s.length; i++) dv.setUint8(p + i, s.charCodeAt(i)); };
    str(0, 'RIFF'); dv.setUint32(4, 36 + bytes, true); str(8, 'WAVE'); str(12, 'fmt ');
    dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, nch, true); dv.setUint32(24, o.sr, true);
    dv.setUint32(28, o.sr * nch * 2, true); dv.setUint16(32, nch * 2, true); dv.setUint16(34, 16, true);
    str(36, 'data'); dv.setUint32(40, bytes, true);
    var out = new Int16Array(ab, 44), p = 0;
    for (var i = 0; i < n; i++) for (var c = 0; c < nch; c++) { var v = o.ch[c][i]; v = v > 1 ? 1 : v < -1 ? -1 : v; out[p++] = v < 0 ? v * 32768 : v * 32767; }
    return new Blob([ab], { type: 'audio/wav' });
  }
  function deliver(blob, name) {
    window.ART_TEST.lastBlob = blob; window.ART_TEST.lastName = name;
    EDU.download(name, blob, blob.type);
    setDlMsg('saved_as', 'success', { name: name, size: fmtSize(blob.size) });
  }
  function dlWav() {
    if (!S.buf || S.encoding) return; stopPlay();
    try { deliver(encodeWav(renderOut()), fileBase() + '.wav'); }
    catch (e) { setDlMsg('err_mem', 'danger'); }
  }
  var FMT = (function () {
    if (!window.MediaRecorder || !MediaRecorder.isTypeSupported || !AC || !AC.prototype.createMediaStreamDestination) return null;
    var list = [['audio/webm;codecs=opus', 'webm', 'WebM'], ['audio/ogg;codecs=opus', 'ogg', 'OGG'], ['audio/mp4', 'm4a', 'M4A'], ['audio/webm', 'webm', 'WebM']];
    for (var i = 0; i < list.length; i++) { try { if (MediaRecorder.isTypeSupported(list[i][0])) return { mime: list[i][0], ext: list[i][1], label: list[i][2] }; } catch (e) { /* next */ } }
    return null;
  })();
  var E = {};
  function dlSmall() {
    if (!S.buf || S.encoding || !FMT) return; stopPlay();
    var o, mr, chunks = [], name = fileBase() + '.' + FMT.ext;
    try {
      o = renderOut();
      E.dest = ac().createMediaStreamDestination();
      E.src = ac().createBufferSource(); E.src.buffer = toAudioBuffer(o); E.src.connect(E.dest);
      mr = new MediaRecorder(E.dest.stream, { mimeType: FMT.mime, audioBitsPerSecond: 96000 });
    } catch (e) { setDlMsg('err_mem', 'danger'); return; }
    E.mr = mr; E.cancel = false; E.len = o.ch[0].length / o.sr; E.t0 = ac().currentTime;
    mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    mr.onstop = function () {
      clearInterval(E.iv); S.encoding = false;
      try { E.src.disconnect(); } catch (x) { /* fine */ }
      renderState();
      if (E.cancel) { setDlMsg(null); return; }
      var blob = new Blob(chunks, { type: FMT.mime.split(';')[0] });
      if (!blob.size) { setDlMsg('small_none', 'warning'); return; }
      deliver(blob, name);
    };
    E.src.onended = function () { setTimeout(function () { try { if (mr.state !== 'inactive') mr.stop(); } catch (x) { /* done */ } }, 200); };
    S.encoding = true; S.encP = 0; renderState();
    setDlMsg('small_busy', 'accent', { p: 0 });
    mr.start(); E.src.start();
    E.iv = setInterval(function () {
      S.encP = EDU.clamp(Math.round((ac().currentTime - E.t0) / E.len * 100), 0, 99);
      if (S.encoding) setDlMsg('small_busy', 'accent', { p: S.encP });
    }, 300);
  }
  function cancelSmall() {
    if (!S.encoding) return;
    E.cancel = true;
    try { E.src.onended = null; E.src.stop(); } catch (e) { /* fine */ }
    try { E.mr.stop(); } catch (e) { clearInterval(E.iv); S.encoding = false; renderState(); }
  }

  /* ------------------------------------------------------------ render */
  function renderPlay() {
    var b = $('#playBtn');
    b.textContent = (S.playing ? '⏹ ' : '▶ ') + t(S.playing ? 'btn_stop_play' : 'btn_play');
  }
  function renderVol() {
    $('#volNum').textContent = S.vol + '%';
    $('#volNote').textContent = S.limited ? t('vol_limited', { p: S.limited }) : '';
    $('#volNote').hidden = !S.limited;
  }
  function fillFades() {
    ['fadeIn', 'fadeOut'].forEach(function (id) {
      var sel = $('#' + id), cur = S[id];
      sel.innerHTML = '';
      [0, 0.5, 1, 2, 3, 5].forEach(function (v) { sel.appendChild(EDU.el('option', { value: String(v), text: v ? t('fade_sec', { n: v }) : t('fade_off') })); });
      sel.value = String(cur);
    });
  }
  function renderState() {
    var rec = S.state === 'recording' || S.state === 'paused', busy = S.state === 'busy';
    app.setAttribute('data-state', S.state);
    app.setAttribute('data-ready', S.buf ? '1' : '0');
    $('#recPanel').hidden = !rec;
    $('#srcBtns').hidden = rec;
    ['recBtn', 'openBtn', 'sampleBtn'].forEach(function (id) { $('#' + id).disabled = busy || S.encoding; });
    $('#recState').textContent = S.state === 'paused' ? t('rec_paused') : t('rec_now');
    $('#pauseBtn').textContent = S.state === 'paused' ? '▶ ' + t('resume') : '⏸ ' + t('pause');
    var show = !!S.buf && !rec;
    $('#edCard').hidden = $('#fxCard').hidden = $('#dlCard').hidden = !show;
    $('#limitNote').textContent = t('limit_note', { n: MAX_MIN });
    $('#smallBtn').hidden = !FMT || S.encoding;
    $('#cancelBtn').hidden = !S.encoding;
    $('#smallTxt').textContent = FMT ? t('dl_small', { fmt: FMT.label }) : '';
    $('#smallNote').textContent = FMT ? t('small_note') : t('small_none');
    ['wavBtn', 'trimBtn', 'cutBtn', 'playBtn', 'allBtn', 'newBtn', 'selA', 'selB'].forEach(function (id) { $('#' + id).disabled = S.encoding; });
    $('#undoBtn').disabled = S.encoding || !S.undo;
  }
  function renderAll() {
    fillFades(); renderState(); renderPlay(); renderVol();
    showMsg($('#msg'), S.msg); showMsg($('#edMsg'), S.edMsg); showMsg($('#dlMsg'), S.dlMsg);
    if (S.buf) { var l = S.limited; syncSel(); S.limited = l; renderVol(); drawWave(); }
  }

  /* ------------------------------------------------------------ events */
  $('#recBtn').addEventListener('click', startRec);
  $('#pauseBtn').addEventListener('click', togglePause);
  $('#stopBtn').addEventListener('click', stopRec);
  $('#openBtn').addEventListener('click', function () { $('#file').click(); });
  $('#file').addEventListener('change', function () { var f = this.files && this.files[0]; this.value = ''; openFile(f); });
  $('#sampleBtn').addEventListener('click', sampleTone);
  $('#selA').addEventListener('input', function () { setSel(Math.min(+this.value, S.b - MIN_GAP), S.b); });
  $('#selB').addEventListener('input', function () { setSel(S.a, Math.max(+this.value, S.a + MIN_GAP)); });
  var wv = $('#wave');
  wv.addEventListener('pointerdown', onDown); wv.addEventListener('pointermove', onMove);
  wv.addEventListener('pointerup', onUp); wv.addEventListener('pointercancel', onUp);
  $('#playBtn').addEventListener('click', play);
  $('#trimBtn').addEventListener('click', trim);
  $('#cutBtn').addEventListener('click', cut);
  $('#undoBtn').addEventListener('click', undo);
  $('#allBtn').addEventListener('click', function () { if (S.buf) setSel(0, dur()); });
  $('#fadeIn').addEventListener('change', function () { S.fadeIn = +this.value || 0; stopPlay(); });
  $('#fadeOut').addEventListener('change', function () { S.fadeOut = +this.value || 0; stopPlay(); });
  $('#vol').addEventListener('input', function () { S.vol = +this.value || 100; S.limited = null; renderVol(); stopPlay(); });
  $('#wavBtn').addEventListener('click', dlWav);
  $('#smallBtn').addEventListener('click', dlSmall);
  $('#cancelBtn').addEventListener('click', cancelSmall);
  $('#newBtn').addEventListener('click', function () {
    stopPlay(); S.buf = null; S.undo = null; peaks = null; S.fadeIn = S.fadeOut = 0; S.vol = 100; $('#vol').value = 100;
    setMsg(null); setEdMsg(null); setDlMsg(null); app.removeAttribute('data-dur'); renderAll();
    try { $('#srcCard').scrollIntoView({ block: 'nearest' }); } catch (e) { /* fine */ }
  });
  window.addEventListener('resize', function () { if (S.buf) drawWave(); });
  window.addEventListener('pagehide', function () { releaseMic(); });
  if (EDU.onTheme) EDU.onTheme(function () { if (S.buf) drawWave(); });
  EDU.onLang(renderAll);
  renderAll();
})();
