/* Screen Recorder: record the screen, a window or a browser tab (with microphone, tab/system sound
   and a camera bubble), or a camera-only video message. Everything happens inside the browser:
   MediaRecorder writes the video in memory and it is saved straight to the Downloads folder. */
(function () {
  'use strict';
  var SLUG = 'screen-recorder';
  var store = EDU.store(SLUG);
  var $ = EDU.$, $$ = EDU.$$, t = EDU.t;
  function noop() { }

  /* ---------------------------------------------------------------- capabilities */
  var md = navigator.mediaDevices || null;
  var CAN_SCREEN = !!(md && md.getDisplayMedia);
  var CAN_CAM = !!(md && md.getUserMedia);
  var CAN_REC = typeof window.MediaRecorder === 'function';
  var CAN_PIP = 'documentPictureInPicture' in window;
  var IS_PHONE = !!((navigator.userAgentData && navigator.userAgentData.mobile) || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || ''));
  function typeOk(type) { try { return CAN_REC && !!MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type); } catch (e) { return false; } }
  var MP4_TEST = 'video/mp4;codecs=avc1.42E01E,mp4a.40.2';
  var HAS_MP4 = typeOk(MP4_TEST) || typeOk('video/mp4');
  var CAN_SHARE_FILES = (function () {
    try { return !!(navigator.canShare && navigator.share && navigator.canShare({ files: [new File([''], 'a.mp4', { type: 'video/mp4' })] })); } catch (e) { return false; }
  })();

  /* ---------------------------------------------------------------- settings */
  var DEF = {
    mode: CAN_SCREEN ? 'screen' : 'cam', cam: false, bubble: CAN_PIP ? 'float' : 'inside', corner: 'br', bsize: 'm', mirror: true,
    camId: '', micId: '', sys: true, q: IS_PHONE ? '720' : '1080', br: 'balanced', fps: 30, fmt: HAS_MP4 ? 'mp4' : 'webm', countdown: true
  };
  var S = Object.assign({}, DEF, store.get('settings', {}) || {});
  function oneOf(v, list, d) { return list.indexOf(v) >= 0 ? v : d; }
  S.mode = CAN_SCREEN ? oneOf(S.mode, ['screen', 'cam'], DEF.mode) : 'cam';
  S.bubble = CAN_PIP ? oneOf(S.bubble, ['float', 'inside'], DEF.bubble) : 'inside';
  S.corner = oneOf(S.corner, ['tl', 'tr', 'bl', 'br'], 'br');
  S.bsize = oneOf(S.bsize, ['s', 'm', 'l'], 'm');
  S.q = oneOf(String(S.q), ['720', '1080'], DEF.q);
  S.br = oneOf(S.br, ['small', 'balanced', 'high'], 'balanced');
  S.fps = oneOf(Number(S.fps), [15, 30, 60], 30);
  S.fmt = HAS_MP4 ? oneOf(S.fmt, ['mp4', 'webm'], DEF.fmt) : 'webm';
  S.cam = !!S.cam; S.mirror = S.mirror !== false; S.sys = S.sys !== false; S.countdown = S.countdown !== false;
  S.camId = typeof S.camId === 'string' ? S.camId : ''; S.micId = typeof S.micId === 'string' ? S.micId : '';
  function save() { store.set('settings', S); }

  var VBPS = { '720': { small: 1200000, balanced: 2500000, high: 5000000 }, '1080': { small: 2000000, balanced: 4500000, high: 8000000 } };
  function videoBps() { var v = VBPS[S.q][S.br]; return Math.round(S.fps === 60 ? v * 1.5 : S.fps === 15 ? v * 0.6 : v); }
  function audioBps() { return S.br === 'small' ? 96000 : 128000; }
  function box() { return S.q === '720' ? [1280, 720] : [1920, 1080]; }
  var BSIZE = { s: 0.2, m: 0.28, l: 0.38 };
  var BIG_BYTES = 1e9;

  /* ---------------------------------------------------------------- state */
  var app = EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });
  var st = 'idle';              /* idle | starting | countdown | recording | paused | saving | stopped */
  var R = null;                 /* the recording being made */
  var recs = [], current = null, seq = 0;
  var camStream = null, camKey = '', camPending = null, micStream = null, micKey = '';
  var actx = null, pip = null, wake = null, tickId = 0, freeBytes = null, noticeState = null, micTestTimer = 0;

  /* ---------------------------------------------------------------- helpers */
  function playSafe(v) { try { var p = v.play(); if (p && p.catch) p.catch(noop); } catch (e) { } }
  function live(tr) { return tr && tr.readyState === 'live'; }
  function stopStream(s) { if (s) s.getTracks().forEach(function (tr) { try { tr.stop(); } catch (e) { } }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmtTime(ms) {
    var s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60;
    return (h ? h + ':' + pad(m) : m + '') + ':' + pad(s % 60);
  }
  function fmtBytes(n) {
    if (n >= 1e9) return EDU.fmt(n / 1e9, { maximumFractionDigits: 2 }) + ' GB';
    if (n >= 1e6) return EDU.fmt(n / 1e6, { maximumFractionDigits: 1 }) + ' MB';
    return EDU.fmt(Math.max(1, Math.round(n / 1e3))) + ' KB';
  }
  function stamp(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes()); }
  function cleanName(s) { return String(s || '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '-').replace(/^[\s.]+|[\s.]+$/g, '').slice(0, 100); }
  /* a cleared or invalid name falls back to the take's own automatic name (with its -2/-3), never another take's */
  function fileNameOf(item) { return (cleanName(item.name) || item.auto || 'recording-' + stamp(item.when)) + '.' + item.ext; }
  function elapsed(sess) { return sess && sess.t0 ? Math.max(0, (sess.pausedAt || performance.now()) - sess.t0 - sess.pausedTotal) : 0; }
  function show(el, on) { if (el) el.hidden = !on; }
  function pressed(btns, attr, val) { btns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute(attr) === String(val))); }); }

  /* ---------------------------------------------------------------- notices (stay until closed; re-translated) */
  function notice(key, kind, vars) { noticeState = key ? { key: key, kind: kind || 'warning', vars: vars } : null; renderNotice(); }
  /* "no such device" (office desktops often have no webcam or mic) is different advice from "blocked or busy" */
  function missing(e) { return !!(e && /^(NotFoundError|DevicesNotFoundError|OverconstrainedError)$/.test(e.name || '')); }
  function camNotice(e, camMode) {
    if (camMode) notice(missing(e) ? 'cam_missing' : 'cam_needed', 'danger');
    else notice(missing(e) ? 'cam_missing_bubble' : 'cam_blocked');
  }
  function renderNotice() {
    var box = $('#notice');
    if (!noticeState) { box.hidden = true; return; }
    box.className = 'callout sr-notice ' + noticeState.kind;
    $('#noticeText').textContent = t(noticeState.key, noticeState.vars);
    box.hidden = false;
  }

  /* ---------------------------------------------------------------- audio */
  function ensureCtx() {
    if (!actx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { actx = new AC(); } catch (e) { return null; }
    }
    if (actx.state === 'suspended' && actx.resume) actx.resume().catch(noop);
    return actx;
  }
  function beep(freq) {
    var c = actx; if (!c || c.state !== 'running') return;
    try {
      var o = c.createOscillator(), g = c.createGain(), now = c.currentTime;
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.12, now + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
      o.connect(g); g.connect(c.destination);
      o.start(now); o.stop(now + 0.13);
    } catch (e) { }
  }

  /* microphone level meter */
  var meter = { src: null, an: null, buf: null, raf: 0 };
  function startMeter(stream) {
    stopMeter();
    var c = ensureCtx(); if (!c || !stream || !stream.getAudioTracks().length) return;
    try {
      meter.src = c.createMediaStreamSource(stream);
      meter.an = c.createAnalyser(); meter.an.fftSize = 512;
      meter.buf = new Uint8Array(meter.an.fftSize);
      meter.src.connect(meter.an);
    } catch (e) { stopMeter(); return; }
    document.body.classList.add('sr-metering');
    (function loop() {
      if (!meter.an) return;
      meter.an.getByteTimeDomainData(meter.buf);
      var sum = 0;
      for (var i = 0; i < meter.buf.length; i++) { var x = (meter.buf[i] - 128) / 128; sum += x * x; }
      var lvl = Math.min(1, Math.sqrt(sum / meter.buf.length) * 4.5);
      var pct = Math.round(lvl * 100) + '%';
      $$('.sr-meter > span').forEach(function (s) { s.style.width = pct; });
      meter.raf = requestAnimationFrame(loop);
    })();
  }
  function stopMeter() {
    cancelAnimationFrame(meter.raf);
    try { if (meter.src) meter.src.disconnect(); } catch (e) { }
    meter.src = meter.an = meter.buf = null;
    document.body.classList.remove('sr-metering');
    $$('.sr-meter > span').forEach(function (s) { s.style.width = '0'; });
  }

  /* ---------------------------------------------------------------- devices */
  function camConstraints() {
    var b = S.mode === 'cam' ? box() : [1280, 720];
    var v = { width: { ideal: b[0] }, height: { ideal: b[1] }, frameRate: { ideal: Math.min(S.fps, 30) } };
    if (S.camId) v.deviceId = { exact: S.camId }; else if (IS_PHONE) v.facingMode = 'user';
    return v;
  }
  function ensureCam() {
    if (!CAN_CAM) return Promise.reject(new Error('no camera api'));
    var key = S.camId + '|' + (S.mode === 'cam' ? S.q : 'b') + '|' + Math.min(S.fps, 30);
    if (camStream && camKey === key && camStream.getVideoTracks().some(live)) return Promise.resolve(camStream);
    if (camPending && camPending.key === key) return camPending.p;
    stopCam();
    var p = md.getUserMedia({ video: camConstraints() }).catch(function (e) {
      if (S.camId && e && (e.name === 'OverconstrainedError' || e.name === 'NotFoundError')) { S.camId = ''; save(); return md.getUserMedia({ video: camConstraints() }); }
      throw e;
    }).then(function (s) {
      if (!camPending || camPending.p !== p) { stopStream(s); return camStream || Promise.reject(new Error('superseded')); }
      camPending = null; camStream = s; camKey = key;
      var tr = s.getVideoTracks()[0];
      if (tr) tr.addEventListener('ended', function () { onCamEnded(s); });
      attachCam(); refreshDevices(); render();
      return s;
    }, function (e) { if (camPending && camPending.p === p) camPending = null; render(); throw e; });
    camPending = { key: key, p: p };
    return p;
  }
  function stopCam() {
    camPending = null;
    if (camStream) { stopStream(camStream); camStream = null; camKey = ''; }
    attachCam();
  }
  function camVideos() {
    var list = $$('.sr-camvid');
    if (pip && pip.video) list.push(pip.video);
    return list;
  }
  function attachCam() {
    camVideos().forEach(function (v) {
      v.classList.toggle('mirror', !!S.mirror);
      if (v.srcObject !== camStream) { v.srcObject = camStream; }
      if (camStream) playSafe(v);
    });
    $('#camVideo').onloadedmetadata = function () { render(); };
  }
  function onCamEnded(s) {
    if (s !== camStream) return;
    if (R && R.mode === 'cam' && (st === 'recording' || st === 'paused')) { R.camLost = true; stopRecording(); return; }
    camStream = null; camKey = ''; attachCam(); render();
  }

  function ensureMic() {
    if (S.micId === 'none' || !CAN_CAM) return Promise.resolve(null);
    var key = S.micId;
    if (micStream && micKey === key && micStream.getAudioTracks().some(live)) return Promise.resolve(micStream);
    stopMic();
    function ask() {
      var a = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
      if (S.micId) a.deviceId = { exact: S.micId };
      return md.getUserMedia({ audio: a });
    }
    return ask().catch(function (e) {
      if (S.micId && e && (e.name === 'OverconstrainedError' || e.name === 'NotFoundError')) { S.micId = ''; save(); return ask(); }
      throw e;
    }).then(function (s) { micStream = s; micKey = S.micId; refreshDevices(); return s; });
  }
  function stopMic() { if (micStream) { stopStream(micStream); micStream = null; micKey = ''; } }

  function refreshDevices() {
    if (!md || !md.enumerateDevices) return;
    md.enumerateDevices().then(function (list) {
      fillSelect($('#micSel'), list.filter(function (d) { return d.kind === 'audioinput'; }), 'mic');
      fillSelect($('#camSel'), list.filter(function (d) { return d.kind === 'videoinput'; }), 'cam');
    }).catch(noop);
  }
  var lastDevs = { mic: [], cam: [] };
  function fillSelect(sel, devs, kind) {
    if (devs) lastDevs[kind] = devs.filter(function (d) { return d.deviceId && d.deviceId !== 'default' && d.deviceId !== 'communications'; });
    devs = lastDevs[kind];
    var cur = kind === 'mic' ? S.micId : S.camId;
    sel.innerHTML = '';
    sel.appendChild(EDU.el('option', { value: '', text: t(kind === 'mic' ? 'mic_default' : 'camera_default') }));
    devs.forEach(function (d, i) {
      sel.appendChild(EDU.el('option', { value: d.deviceId, class: d.label ? 'no-i18n' : '', text: d.label || t(kind === 'mic' ? 'mic_n' : 'camera_n', { n: i + 1 }) }));
    });
    if (kind === 'mic') sel.appendChild(EDU.el('option', { value: 'none', text: t('mic_none') }));
    var ok = Array.prototype.some.call(sel.options, function (o) { return o.value === cur; });
    sel.value = ok ? cur : '';
  }

  /* ---------------------------------------------------------------- camera bubble window (Document Picture-in-Picture) */
  var PIP_CSS = 'html,body{margin:0;height:100%;background:#0b1418;overflow:hidden;font-family:system-ui,"Segoe UI",Roboto,sans-serif}' +
    'video{display:block;width:100%;height:100%;object-fit:cover;background:#0b1418}video.mirror{transform:scaleX(-1)}' +
    '.cnt{position:fixed;inset:0;display:grid;place-items:center;background:rgba(5,12,15,.55);color:#fff;font-size:min(42vw,42vh);font-weight:800}' +
    '.bar{position:fixed;inset-inline:8px;bottom:8px;display:none;align-items:center;justify-content:center;gap:8px;padding:6px 8px;border-radius:14px;background:rgba(10,15,20,.8);color:#fff;font-size:15px;font-weight:700;opacity:0;transition:opacity .15s}' +
    'body.rec .bar{display:flex}body.rec:hover .bar,.bar:focus-within{opacity:1}' +
    '.dot{width:10px;height:10px;border-radius:50%;background:#ff3b30;flex:none}body.paused .dot{background:#f5b301}' +
    '.time{font-variant-numeric:tabular-nums;min-width:4.2ch;text-align:center}' +
    'button{width:38px;height:38px;border-radius:10px;border:0;background:#fff;color:#111;font-size:15px;font-weight:800;cursor:pointer;flex:none}' +
    'button.stop{background:#e5252a;color:#fff}button:focus-visible{outline:3px solid #ffb547;outline-offset:2px}';

  function openPip() {
    if (!CAN_PIP) return Promise.resolve(false);
    if (pip) { try { pip.win.focus(); } catch (e) { } return Promise.resolve(true); }
    var req;
    try { req = window.documentPictureInPicture.requestWindow({ width: 260, height: 260 }); }
    catch (e) { notice('bubble_fail'); return Promise.resolve(false); }
    return req.then(function (win) {
      buildPip(win);
      render();
      return ensureCam().then(function () { attachCam(); render(); return true; }, function (e) { closePip(); camNotice(e, false); return false; });
    }, function () { notice('bubble_fail'); return false; });
  }
  function buildPip(win) {
    var d = win.document;
    var style = d.createElement('style'); style.textContent = PIP_CSS; d.head.appendChild(style);
    var v = d.createElement('video'); v.muted = true; v.autoplay = true; v.playsInline = true; v.setAttribute('playsinline', '');
    var cnt = d.createElement('div'); cnt.className = 'cnt'; cnt.hidden = true;
    var bar = d.createElement('div'); bar.className = 'bar';
    var dot = d.createElement('span'); dot.className = 'dot';
    var time = d.createElement('span'); time.className = 'time'; time.textContent = '0:00';
    var pp = d.createElement('button'); pp.type = 'button'; pp.addEventListener('click', togglePause);
    var stp = d.createElement('button'); stp.type = 'button'; stp.className = 'stop'; stp.textContent = '■'; stp.addEventListener('click', stopRecording);
    bar.appendChild(dot); bar.appendChild(time); bar.appendChild(pp); bar.appendChild(stp);
    d.body.appendChild(v); d.body.appendChild(cnt); d.body.appendChild(bar);
    d.addEventListener('keydown', onKey);
    pip = { win: win, doc: d, video: v, cnt: cnt, time: time, pp: pp, stp: stp };
    win.addEventListener('pagehide', function () { if (pip && pip.win === win) { pip = null; render(); } });
    updatePip();
  }
  function closePip() {
    if (!pip) return;
    var w = pip.win; pip = null;
    try { w.close(); } catch (e) { }
  }
  function updatePip() {
    if (!pip) return;
    var b = pip.doc.body, rec = st === 'recording' || st === 'paused';
    b.classList.toggle('rec', rec); b.classList.toggle('paused', st === 'paused');
    pip.doc.documentElement.lang = EDU.lang;
    pip.doc.title = t('bubble_title');
    pip.pp.textContent = st === 'paused' ? '▶' : '❚❚';
    pip.pp.setAttribute('aria-label', t(st === 'paused' ? 'resume' : 'pause'));
    pip.stp.setAttribute('aria-label', t('stop'));
    pip.video.classList.toggle('mirror', !!S.mirror);
    pip.time.textContent = fmtTime(elapsed(R));
  }

  /* ---------------------------------------------------------------- compositing (camera drawn into the video) */
  function startTicker(ms, fn) {
    /* A worker clock keeps ticking when this tab is in the background (page timers are slowed to 1/s). */
    try {
      var url = URL.createObjectURL(new Blob(['var i=0;onmessage=function(e){clearInterval(i);if(e.data>0)i=setInterval(function(){postMessage(1)},e.data)}'], { type: 'text/javascript' }));
      var w = new Worker(url);
      w.onmessage = fn; w.postMessage(ms);
      return { stop: function () { try { w.postMessage(0); w.terminate(); } catch (e) { } URL.revokeObjectURL(url); } };
    } catch (e) {
      var id = setInterval(fn, ms);
      return { stop: function () { clearInterval(id); } };
    }
  }
  function fitBox(w, h) {
    var b = box(), sc = Math.min(1, b[0] / w, b[1] / h);
    var even = function (n) { return Math.max(2, Math.round(n * sc / 2) * 2); };
    return [even(w), even(h)];
  }
  function composite(sess, dtrack) {
    var sv = document.createElement('video'); sv.muted = true; sv.playsInline = true;
    sv.srcObject = new MediaStream([dtrack]); playSafe(sv);
    var cv = document.createElement('video'); cv.muted = true; cv.playsInline = true;
    cv.srcObject = camStream; playSafe(cv);
    var set = (dtrack.getSettings && dtrack.getSettings()) || {};
    var dims = fitBox(set.width || box()[0], set.height || box()[1]);
    var canvas = document.createElement('canvas'); canvas.width = dims[0]; canvas.height = dims[1];
    var ctx = canvas.getContext('2d', { alpha: false });
    var mirror = !!S.mirror, corner = S.corner, size = BSIZE[S.bsize];
    function draw() {
      var W = canvas.width, H = canvas.height;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      var vw = sv.videoWidth, vh = sv.videoHeight;
      if (vw && vh) { var s = Math.min(W / vw, H / vh), dw = vw * s, dh = vh * s; ctx.drawImage(sv, (W - dw) / 2, (H - dh) / 2, dw, dh); }
      var cw = cv.videoWidth, ch = cv.videoHeight;
      if (cw && ch && camStream) {
        var short = Math.min(W, H), d = Math.round(short * size), m = Math.round(short * 0.035);
        var x = corner.charAt(1) === 'l' ? m : W - m - d, y = corner.charAt(0) === 't' ? m : H - m - d;
        var side = Math.min(cw, ch), sx = (cw - side) / 2, sy = (ch - side) / 2, r = d / 2;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = Math.round(d * 0.06);
        ctx.beginPath(); ctx.arc(x + r, y + r, r + Math.max(2, Math.round(d * 0.022)), 0, Math.PI * 2);
        ctx.fillStyle = '#fff'; ctx.fill();
        ctx.restore(); ctx.save();
        ctx.beginPath(); ctx.arc(x + r, y + r, r, 0, Math.PI * 2); ctx.clip();
        if (mirror) { ctx.translate(x + d, y); ctx.scale(-1, 1); ctx.drawImage(cv, sx, sy, side, side, 0, 0, d, d); }
        else ctx.drawImage(cv, sx, sy, side, side, x, y, d, d);
        ctx.restore();
      }
    }
    draw();
    sess.ticker = startTicker(Math.round(1000 / S.fps), draw);
    sess.compVideos = [sv, cv];
    /* The hidden <video>s need a moment before their first frame. Recording at once gave ~0.3 s of black at the
       start (and a black thumbnail), and a capture stream made before that hands its stale black frame to the
       recorder first. So wait for both sources (at most 1.5 s), draw, and only then start capturing the canvas.
       Resolves with the canvas video track, or null if this recording was cancelled meanwhile. */
    return new Promise(function (resolve) {
      var t0 = Date.now();
      (function check() {
        if (R !== sess || sess.cancelled) { resolve(null); return; }
        var ok = sv.readyState >= 2 && sv.videoWidth > 0 && (!camStream || (cv.readyState >= 2 && cv.videoWidth > 0));
        if (!ok && Date.now() - t0 < 1500) { setTimeout(check, 30); return; }
        draw();
        sess.canvasStream = canvas.captureStream(S.fps);
        resolve(sess.canvasStream.getVideoTracks()[0]);
      })();
    });
  }

  /* ---------------------------------------------------------------- recording */
  function pickMime(fmt, audio) {
    var mp4 = audio ? [MP4_TEST, 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4'] : ['video/mp4;codecs=avc1.42E01E', 'video/mp4;codecs=avc1', 'video/mp4'];
    var webm = audio ? ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'] : ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    var list = fmt === 'mp4' ? mp4.concat(webm) : webm.concat(mp4);
    for (var i = 0; i < list.length; i++) if (typeOk(list[i])) return list[i];
    return '';
  }

  function getDisplay() {
    var b = box();
    var video = { width: { max: b[0] }, height: { max: b[1] }, frameRate: { ideal: S.fps, max: S.fps } };
    if (S.cam && S.bubble === 'float' && pip) video.displaySurface = 'monitor';
    var opts = {
      video: video,
      audio: S.sys ? { echoCancellation: false, noiseSuppression: false, autoGainControl: false } : false,
      selfBrowserSurface: 'exclude', surfaceSwitching: 'include', systemAudio: S.sys ? 'include' : 'exclude', monitorTypeSurfaces: 'include'
    };
    return md.getDisplayMedia(opts).catch(function (e) {
      if (e && e.name === 'TypeError') return md.getDisplayMedia({ video: true, audio: !!S.sys });
      throw e;
    });
  }

  function startRecording() {
    if (!(st === 'idle' || st === 'stopped')) return;
    if (!CAN_REC) { notice('no_recorder', 'danger'); return; }
    if (S.mode === 'screen' && !CAN_SCREEN) { setMode('cam'); return; }
    if (S.mode === 'cam' && !CAN_CAM) { notice('cam_needed', 'danger'); return; }
    ensureCtx();
    notice(null);
    clearTimeout(micTestTimer); stopMeter();
    var sess = R = { id: ++seq, mode: S.mode, chunks: [], bytes: 0, pausedTotal: 0, pausedAt: 0, t0: 0, nodes: [] };
    setState('starting');
    var step = Promise.resolve();
    if (sess.mode === 'screen') {
      step = getDisplay().then(function (ds) {
        sess.display = ds;
        var tr = ds.getVideoTracks()[0];
        if (tr) tr.addEventListener('ended', function () { onShareEnded(sess); });
        if (R !== sess) stopStream(ds);
      }, function (e) { e = e || {}; e.sr = (e.name === 'NotAllowedError' && !/system/i.test(e.message || '')) ? 'cancelled' : 'share_failed'; throw e; });
    }
    step.then(function () {
      if (R !== sess) throw { sr: 'aborted' };
      var needCam = sess.mode === 'cam' || S.cam;
      if (!needCam) return null;
      return ensureCam().catch(function (e) {
        if (sess.mode === 'cam') { var x = { sr: missing(e) ? 'cam_missing' : 'cam_needed' }; throw x; }
        sess.noCam = true; camNotice(e, false);
      });
    }).then(function () {
      if (R !== sess) throw { sr: 'aborted' };
      return ensureMic().catch(function (e) { sess.micBlocked = true; notice(missing(e) ? 'mic_missing' : 'mic_blocked'); return null; });
    }).then(function (mic) {
      if (R !== sess) throw { sr: 'aborted' };
      sess.mic = mic;
      build(sess);
      /* wait (briefly) until the shared screen and camera give real frames, or the video starts with black frames */
      return sess.compReady;
    }).then(function () {
      if (R !== sess) throw { sr: 'aborted' };
      return S.countdown ? countdown(sess) : true;
    }).then(function (go) {
      if (R !== sess || !go) throw { sr: 'aborted' };
      begin(sess);
    }).catch(function (e) {
      var why = (e && e.sr) || 'share_failed';
      if (R === sess || !R) abort(sess);
      if (why === 'cancelled') { EDU.toast(t('cancelled')); }
      else if (why !== 'aborted') notice(why, /^cam_(needed|missing)$/.test(why) ? 'danger' : 'warning');
    });
  }

  function build(sess) {
    var vtrack, pending = null;
    if (sess.mode === 'cam') vtrack = camStream.getVideoTracks()[0];
    else {
      var dtrack = sess.display.getVideoTracks()[0], surface = '';
      try { surface = (dtrack.getSettings() || {}).displaySurface || ''; } catch (e) { }
      var wantCam = S.cam && camStream && !sess.noCam;
      var pipCaptured = !!pip && S.bubble === 'float' && surface === 'monitor';
      if (wantCam && !pipCaptured) {
        pending = composite(sess, dtrack);
        sess.composite = true;
        if (S.bubble === 'float' && CAN_PIP) notice('bubble_inside_used', 'accent');
      } else vtrack = dtrack;
    }
    var ins = [];
    if (sess.mic) ins.push({ s: sess.mic, mic: true });
    if (sess.display && sess.display.getAudioTracks().length) ins.push({ s: sess.display, mic: false });
    var audio = [], c = ins.length ? ensureCtx() : null;
    if (c && c.createMediaStreamDestination) {
      try {
        var dest = c.createMediaStreamDestination();
        ins.forEach(function (x) {
          var src = c.createMediaStreamSource(new MediaStream(x.s.getAudioTracks()));
          var g = c.createGain(); g.gain.value = 1;
          src.connect(g); g.connect(dest);
          sess.nodes.push(src, g);
          if (x.mic) sess.micGain = g;
        });
        audio = dest.stream.getAudioTracks();
      } catch (e) { audio = []; }
    }
    if (!audio.length && ins.length) audio = [ins[0].s.getAudioTracks()[0]];
    if (sess.mic) startMeter(sess.mic);
    sess.hasAudio = audio.length > 0;
    function assemble(v) { if (v) sess.stream = new MediaStream([v].concat(audio)); }
    /* composited video: its track exists only once both sources show frames (see composite) */
    if (pending) sess.compReady = pending.then(assemble); else assemble(vtrack);
  }

  function countdown(sess) {
    return new Promise(function (resolve) {
      var n = 3;
      setState('countdown');
      function done(v) {
        clearTimeout(sess.countTimer); sess.countDone = null;
        $('#countNum').textContent = '';
        if (pip) pip.cnt.hidden = true;
        resolve(v);
      }
      sess.countDone = done;
      (function step() {
        if (R !== sess || sess.cancelled) { done(false); return; }
        if (n === 0) { done(true); return; }
        $('#countNum').textContent = EDU.fmt(n);
        if (pip) { pip.cnt.textContent = String(n); pip.cnt.hidden = false; }
        document.title = n + ' · ' + t('app_title');
        beep(n === 1 ? 880 : 660);
        n--;
        sess.countTimer = setTimeout(step, 1000);
      })();
    });
  }
  function cancelStart() {
    var sess = R; if (!sess) return;
    sess.cancelled = true;
    if (sess.countDone) sess.countDone(false);
    else { abort(sess); }
  }

  function begin(sess) {
    if (!sess.stream) { abort(sess); return; }
    var mime = pickMime(S.fmt, sess.hasAudio);
    var opts = { videoBitsPerSecond: videoBps() };
    if (sess.hasAudio) opts.audioBitsPerSecond = audioBps();
    if (mime) opts.mimeType = mime;
    var rec;
    try { rec = new MediaRecorder(sess.stream, opts); }
    catch (e) {
      try { rec = new MediaRecorder(sess.stream); } catch (e2) { abort(sess); notice('rec_error_start', 'danger'); return; }
    }
    sess.rec = rec;
    sess.mime = rec.mimeType || mime || '';
    rec.ondataavailable = function (e) {
      if (!e.data || !e.data.size) return;
      sess.chunks.push(e.data); sess.bytes += e.data.size;
      if (R === sess) $('#liveSize').textContent = fmtBytes(sess.bytes);
      if (sess.bytes > BIG_BYTES && !sess.bigWarned) { sess.bigWarned = true; notice('big_warn'); EDU.toast(t('big_warn'), 6000); }
    };
    rec.onerror = function () { sess.failed = true; };
    rec.onstop = function () { finalize(sess); };
    sess.when = new Date();
    try { rec.start(1000); }
    catch (e) { abort(sess); notice('rec_error_start', 'danger'); return; }
    sess.t0 = performance.now();
    $('#liveSize').textContent = fmtBytes(0);
    setState('recording');
    startTick();
    try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(function (l) { wake = l; }, noop); } catch (e) { }
  }

  function togglePause() {
    var sess = R; if (!sess || !sess.rec) return;
    var now = performance.now();
    if (st === 'recording' && sess.rec.state === 'recording') {
      try { sess.rec.pause(); } catch (e) { return; }
      sess.pausedAt = now; setState('paused');
    } else if (st === 'paused') {
      try { sess.rec.resume(); } catch (e) { return; }
      sess.pausedTotal += now - sess.pausedAt; sess.pausedAt = 0; setState('recording');
    }
  }
  function toggleMute() {
    var sess = R; if (!sess || !sess.mic) return;
    sess.muted = !sess.muted;
    if (sess.micGain) sess.micGain.gain.value = sess.muted ? 0 : 1;
    else sess.mic.getAudioTracks().forEach(function (tr) { tr.enabled = !sess.muted; });
    renderLive();
  }
  function stopRecording() {
    var sess = R; if (!sess) return;
    if (st === 'starting' || st === 'countdown') { cancelStart(); return; }
    if (!sess.rec || sess.rec.state === 'inactive') return;
    sess.durMs = elapsed(sess);
    if (sess.pausedAt) { sess.pausedTotal += performance.now() - sess.pausedAt; sess.pausedAt = 0; }
    setState('saving');
    try { sess.rec.stop(); } catch (e) { finalize(sess); }
  }
  function onShareEnded(sess) {
    if (R !== sess) return;
    if (st === 'recording' || st === 'paused') { sess.shareEnded = true; stopRecording(); }
    else if (st === 'starting' || st === 'countdown') { cancelStart(); EDU.toast(t('cancelled')); }
  }

  function release(sess) {
    if (sess.ticker) { sess.ticker.stop(); sess.ticker = null; }
    stopStream(sess.display); stopStream(sess.canvasStream);
    (sess.compVideos || []).forEach(function (v) { v.srcObject = null; });
    sess.nodes.forEach(function (n) { try { n.disconnect(); } catch (e) { } });
    sess.nodes = [];
    stopMeter(); stopMic();
    stopTick();
    if (wake) { try { wake.release(); } catch (e) { } wake = null; }
  }
  function abort(sess) {
    if (!sess) return;
    sess.cancelled = true;
    release(sess);
    if (R === sess) R = null;
    setState('idle');
  }
  function finalize(sess) {
    if (sess.finalized) return;
    sess.finalized = true;
    var dur = sess.durMs || elapsed(sess);
    release(sess);
    if (R === sess) R = null;
    stopCam(); closePip();                    /* camera light off as soon as the recording ends */
    var type = (sess.mime || '').split(';')[0] || (S.fmt === 'mp4' && HAS_MP4 ? 'video/mp4' : 'video/webm');
    var blob = new Blob(sess.chunks, { type: type });
    sess.chunks = [];
    if (!blob.size) { setState('idle'); notice('nothing_recorded'); return; }
    var fix = /webm/i.test(type) && window.SR_fixWebmDuration ? window.SR_fixWebmDuration(blob, dur) : Promise.resolve(blob);
    fix.catch(function () { return blob; }).then(function (b) {
      var ext = /webm/i.test(type) ? 'webm' : 'mp4';
      var base = 'recording-' + stamp(sess.when || new Date()), name = base, k = 2;
      while (recs.some(function (r) { return r.name === name || r.auto === name; })) name = base + '-' + (k++);
      var item = { id: sess.id, name: name, auto: name, ext: ext, type: type, blob: b, url: URL.createObjectURL(b), dur: dur, size: b.size, when: sess.when || new Date(), w: 0, h: 0, downloaded: false };
      recs.unshift(item);
      showItem(item);
      if (sess.failed) notice('rec_error');
      else if (sess.camLost) notice('cam_lost');
      else if (sess.shareEnded) EDU.toast(t('source_ended'), 4000);
    });
  }

  /* ---------------------------------------------------------------- results */
  function showItem(item) {
    current = item;
    var v = $('#player');
    if (v.getAttribute('data-id') !== String(item.id)) {
      v.src = item.url; v.setAttribute('data-id', String(item.id));
    }
    v.setAttribute('data-bytes', String(item.size));
    $('#fileName').value = item.name;
    $('#fileExt').textContent = '.' + item.ext;
    setState('stopped');
    renderSession();
  }
  function downloadItem(item) {
    if (!item) return;
    EDU.download(fileNameOf(item), item.blob);
    item.downloaded = true;
    renderSession(); renderResult();
    EDU.toast(t('saved_to_downloads'));
  }
  function shareItem(item) {
    if (!item || !CAN_SHARE_FILES) return;
    try {
      var f = new File([item.blob], fileNameOf(item), { type: item.type });
      if (navigator.canShare({ files: [f] })) navigator.share({ files: [f], title: fileNameOf(item) }).catch(noop);
      else EDU.toast(t('share_unsupported'));
    } catch (e) { EDU.toast(t('share_unsupported')); }
  }
  function saveFrame() {
    var v = $('#player');
    if (!current || !v.videoWidth) return;
    var c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight;
    try { c.getContext('2d').drawImage(v, 0, 0); } catch (e) { return; }
    var s = Math.floor(v.currentTime || 0);
    EDU.downloadCanvas(c, (cleanName(current.name) || 'recording') + '-' + pad(Math.floor(s / 60)) + 'm' + pad(s % 60) + 's.png');
  }
  function deleteItem(item) {
    if (!item) return;
    if (!item.downloaded && !confirm(t('confirm_delete'))) return;
    recs = recs.filter(function (r) { return r !== item; });
    if (current === item) {
      current = null;
      var v = $('#player'); v.removeAttribute('src'); v.removeAttribute('data-id'); v.removeAttribute('data-bytes'); try { v.load(); } catch (e) { }
      if (st === 'stopped') setState('idle');
    }
    setTimeout(function () { URL.revokeObjectURL(item.url); }, 500);
    renderSession();
  }
  function newRecording() {
    if (st !== 'stopped') return;
    setState('idle');
    if (S.mode === 'screen' && S.cam && S.bubble === 'float' && CAN_PIP) openPip();
    else if (S.mode === 'cam' || S.cam) ensureCam().catch(noop);
  }

  /* ---------------------------------------------------------------- timer */
  function startTick() { stopTick(); tick(); tickId = setInterval(tick, 250); }
  function stopTick() { clearInterval(tickId); tickId = 0; document.title = t('app_title') + ' · ' + t('brand'); }
  function tick() {
    if (!R) return;
    var txt = fmtTime(elapsed(R));
    $('#liveTime').textContent = txt; $('#bigTime').textContent = txt; $('#pillTime').textContent = txt;
    if (pip) pip.time.textContent = txt;
    document.title = (st === 'paused' ? '❚❚ ' : '● ') + txt + ' · ' + t('app_title');
  }

  /* ---------------------------------------------------------------- rendering */
  function setState(s) {
    var prev = st;
    st = s;
    app.setAttribute('data-state', s);
    render();
    updatePip();
    var msg = { idle: 'status_idle', recording: 'status_rec', paused: 'status_paused', stopped: 'status_saved' }[s];
    if (msg) $('#status').textContent = t(msg);
    if (prev !== s) keepFocus();
  }
  /* The button a keyboard user pressed (Start, Stop, Cancel) is hidden by the new state, which dropped focus to
     the page body. Move it to the next useful control instead. Never steals focus from anything still visible. */
  function keepFocus() {
    var a = document.activeElement;
    if (a && a !== document.body && a.getClientRects().length) return;
    var sel = { idle: '#recBtn', countdown: '#countCancel', recording: '#pauseBtn', stopped: '#dlBtn' }[st];
    var el = sel && $(sel);
    if (el && el.getClientRects().length) { try { el.focus({ preventScroll: true }); } catch (e) { } }
  }

  function render() {
    var idleish = st === 'idle' || st === 'starting' || st === 'countdown';
    var recording = st === 'recording' || st === 'paused';
    var mode = R ? R.mode : S.mode;
    var stage = $('#stage');

    /* settings */
    $('#settings').disabled = !(st === 'idle' || st === 'stopped');
    pressed($$('[data-mode]'), 'data-mode', S.mode);
    $('#modeScreen').disabled = !CAN_SCREEN;
    show($('#noScreen'), !CAN_SCREEN);
    show($('#noRec'), !CAN_REC);
    $('#modeHint').textContent = t(S.mode === 'cam' ? 'mode_cam_hint' : 'mode_screen_hint');
    show($('#grpBubble'), S.mode === 'screen');
    $('#camOn').checked = S.cam;
    show($('#bubbleOpts'), S.cam);
    show($('#bubbleTypeRow'), CAN_PIP);
    pressed($$('[data-bubble]'), 'data-bubble', S.bubble);
    $('#bubbleHint').textContent = t(S.bubble === 'float' && CAN_PIP ? 'bubble_float_hint' : 'bubble_inside_hint');
    show($('#pipRow'), CAN_PIP && S.bubble === 'float');
    $('#pipBtn').textContent = t(pip ? 'bubble_close' : 'bubble_open');
    show($('#insideOpts'), S.bubble === 'inside' || !CAN_PIP);
    pressed($$('[data-corner]'), 'data-corner', S.corner);
    pressed($$('[data-bsize]'), 'data-bsize', S.bsize);
    show($('#grpCamera'), S.mode === 'cam' || S.cam);
    $('#mirror').checked = S.mirror;
    show($('#sysRow'), S.mode === 'screen');
    $('#sysAudio').checked = S.sys;
    pressed($$('[data-q]'), 'data-q', S.q);
    pressed($$('[data-br]'), 'data-br', S.br);
    pressed($$('[data-fps]'), 'data-fps', S.fps);
    pressed($$('[data-fmt]'), 'data-fmt', S.fmt);
    $('#fmtMp4').disabled = !HAS_MP4;
    $('#fmtHint').textContent = t(!HAS_MP4 ? 'fmt_no_mp4' : S.fmt === 'mp4' ? 'fmt_mp4_hint' : 'fmt_webm_hint');
    $('#optCountdown').checked = S.countdown;
    var mb = (videoBps() + audioBps()) * 60 / 8 / 1e6;
    $('#estLine').textContent = t('est_line', { mb: EDU.fmt(mb < 10 ? Math.round(mb * 10) / 10 : Math.round(mb)) });
    $('#sumLine').textContent = (S.fmt === 'mp4' && HAS_MP4 ? 'MP4' : 'WebM') + ' · ' + S.q + 'p · ' + S.fps + ' fps';
    if (freeBytes !== null) {
      var gb = EDU.fmt(Math.max(0, freeBytes) / 1e9, { maximumFractionDigits: 1 });
      var low = freeBytes < 2e9;
      $('#storageLine').textContent = t(low ? 'storage_low' : 'storage_line', { gb: gb });
      $('#storageLine').className = 'small ' + (low ? 'bad' : 'muted');
      show($('#storageLine'), true);
    }

    /* stage layers */
    var camVisible = mode === 'cam' && (idleish || recording);
    stage.classList.toggle('portrait', (camVisible && isPortrait($('#camVideo'))) || (st === 'stopped' && isPortrait($('#player'))));
    show($('#layerScreen'), mode === 'screen' && idleish);
    show($('#layerCam'), camVisible);
    show($('#layerLive'), mode === 'screen' && recording);
    show($('#layerSaving'), st === 'saving');
    show($('#layerResult'), st === 'stopped');
    show($('#layerCount'), st === 'countdown');
    show($('#recPill'), mode === 'cam' && recording);
    $('#recPill').classList.toggle('paused', st === 'paused');

    var hasCam = !!camStream;
    var bubble = $('#mockBubble');
    show(bubble, S.cam);
    bubble.className = 'sr-bubble c-' + S.corner + ' s-' + S.bsize + (pip ? ' popped' : '');
    show($('#bubbleVideo'), hasCam && !pip);
    show($('#bubblePh'), !hasCam || !!pip);
    $('#bubblePhText').textContent = t(pip ? 'bubble_popped' : 'bubble_off');
    show($('#bubbleStart'), !hasCam && !pip && !camPending);
    $('#mockCaption').textContent = t(S.cam && S.bubble === 'float' && CAN_PIP ? 'setup_screen_text_bubble' : 'setup_screen_text');
    show($('#camVideo'), hasCam);
    show($('#camPh'), !hasCam);
    $('#camStart').disabled = !!camPending || !CAN_CAM;
    $('#camStart').textContent = t(camPending ? 'cam_starting' : 'cam_turn_on');
    var lb = $('#liveBubble');
    show(lb, mode === 'screen' && recording && hasCam);
    lb.className = 'sr-bubble sr-livebubble c-' + S.corner + ' s-' + S.bsize;

    /* controls */
    show($('#ctlIdle'), st === 'idle');
    show($('#ctlBusy'), st === 'starting' || st === 'saving');
    $('#busyText').textContent = t(st === 'saving' ? 'saving' : (mode === 'screen' ? 'pick_hint' : 'starting'));
    show($('#busyCancel'), st === 'starting');      /* nothing to cancel while the file is being finished */
    show($('#ctlCount'), st === 'countdown');
    show($('#ctlRec'), recording);
    show($('#ctlDone'), st === 'stopped');
    $('#recBtn').disabled = !CAN_REC || (S.mode === 'screen' && !CAN_SCREEN);
    renderLive();
    renderResult();
    renderNotice();
  }
  function isPortrait(v) { return !!(v && v.videoWidth && v.videoHeight && v.videoHeight > v.videoWidth); }

  function renderLive() {
    var paused = st === 'paused';
    $('#pauseBtn').innerHTML = '';
    $('#pauseBtn').appendChild(EDU.el('span', { class: 'sr-ic', 'aria-hidden': 'true', text: paused ? '▶' : '❚❚' }));
    $('#pauseBtn').appendChild(EDU.el('span', { text: t(paused ? 'resume' : 'pause') }));
    var hasMic = !!(R && R.mic);
    show($('#muteBtn'), hasMic);
    var muted = !!(R && R.muted);
    $('#muteBtn').setAttribute('aria-pressed', String(muted));
    $('#muteText').textContent = t(muted ? 'unmute_mic' : 'mute_mic');
    $('#muteIc').textContent = muted ? '🔇' : '🎙';
    show($('#liveMuted'), muted);
    show($('#liveNoMic'), !!R && !hasMic);
    $('#liveLabel').textContent = t(paused ? 'rec_paused' : 'rec_live');
    $('#layerLive').classList.toggle('paused', paused);
    $('#pillLabel').textContent = t(paused ? 'rec_paused' : 'rec_live');
  }

  function renderResult() {
    if (!current) return;
    var v = $('#player');
    current.w = v.videoWidth || current.w; current.h = v.videoHeight || current.h;
    var parts = [fmtTime(current.dur), fmtBytes(current.size), current.ext === 'mp4' ? 'MP4' : 'WebM'];
    if (current.w) parts.push(current.w + '×' + current.h);
    $('#resultMeta').textContent = parts.join(' · ');
    show($('#shareBtn'), CAN_SHARE_FILES);
    $('#dlState').textContent = t(current.downloaded ? 'downloaded' : 'not_downloaded');
    $('#dlState').className = 'badge ' + (current.downloaded ? 'success' : 'accent');
  }

  function renderSession() {
    var list = $('#sessionList');
    /* the list is rebuilt: remember which take's button had keyboard focus and give it back afterwards */
    var a = document.activeElement, keep = null;
    if (a && list.contains(a) && a.closest('.sr-item')) {
      keep = { id: a.closest('.sr-item').getAttribute('data-id'), cls: a.classList.contains('sr-thumb') ? '.sr-thumb' : a.classList.contains('btn-danger') ? '.btn-danger' : '.sr-dl' };
    }
    list.innerHTML = '';
    show($('#sessionEmpty'), !recs.length);
    show($('#dlAllRow'), recs.length > 1);
    recs.forEach(function (item) {
      var thumb = EDU.el('button', { class: 'sr-thumb', type: 'button', 'aria-label': t('play_rec', { name: fileNameOf(item) }), onclick: function () { if (st === 'idle' || st === 'stopped') { showItem(item); playSafe($('#player')); } } },
        EDU.el('video', { muted: '', preload: 'metadata', src: item.url + '#t=0.1', tabindex: '-1', 'aria-hidden': 'true' }),
        EDU.el('span', { class: 'sr-dur', text: fmtTime(item.dur) }));
      var info = EDU.el('div', { class: 'sr-info' },
        EDU.el('bdi', { class: 'sr-iname no-i18n', text: fileNameOf(item) }),
        EDU.el('span', { class: 'small muted sr-imeta', dir: 'ltr', text: pad(item.when.getHours()) + ':' + pad(item.when.getMinutes()) + ' · ' + fmtBytes(item.size) + ' · ' + (item.ext === 'mp4' ? 'MP4' : 'WebM') }),
        EDU.el('span', { class: 'badge ' + (item.downloaded ? 'success' : 'accent'), text: t(item.downloaded ? 'downloaded' : 'not_downloaded') }));
      var acts = EDU.el('div', { class: 'sr-acts' },
        EDU.el('button', { class: 'btn btn-sm sr-dl', type: 'button', text: t('download'), onclick: function () { downloadItem(item); } }),
        EDU.el('button', { class: 'btn btn-sm btn-danger', type: 'button', text: t('delete'), onclick: function () { deleteItem(item); } }));
      list.appendChild(EDU.el('li', { class: 'sr-item' + (item === current && st === 'stopped' ? ' current' : ''), dataset: { id: String(item.id) } }, thumb, info, acts));
    });
    if (keep) {
      var back = $('.sr-item[data-id="' + keep.id + '"] ' + keep.cls, list);
      if (!back) back = $('.sr-thumb', list) || $('#sessTitle');   /* that take was deleted */
      if (back) { try { if (back.id === 'sessTitle') back.setAttribute('tabindex', '-1'); back.focus({ preventScroll: true }); } catch (e) { } }
    }
  }

  function renderDynamic() {
    fillSelect($('#micSel'), null, 'mic');
    fillSelect($('#camSel'), null, 'cam');
    render();
    renderSession();
    updatePip();
    if (R && (st === 'recording' || st === 'paused')) tick(); else if (st !== 'countdown') stopTick();
    var s = { idle: 'status_idle', recording: 'status_rec', paused: 'status_paused', stopped: 'status_saved' }[st];
    if (s) $('#status').textContent = t(s);
  }

  /* ---------------------------------------------------------------- events */
  function setMode(m) {
    if (m === 'screen' && !CAN_SCREEN) return;
    S.mode = m; save();
    if (m === 'cam') { closePip(); ensureCam().catch(function () { render(); }); }
    else if (!S.cam) stopCam();
    if (st === 'stopped') setState('idle'); else render();
  }
  $$('[data-mode]').forEach(function (b) { b.addEventListener('click', function () { setMode(b.getAttribute('data-mode')); }); });

  $('#camOn').addEventListener('change', function () {
    S.cam = this.checked; save();
    if (!S.cam) { closePip(); stopCam(); render(); return; }
    if (S.bubble === 'float' && CAN_PIP) openPip(); else ensureCam().catch(function (e) { camNotice(e, false); render(); });
    render();
  });
  $$('[data-bubble]').forEach(function (b) {
    b.addEventListener('click', function () {
      S.bubble = b.getAttribute('data-bubble'); save();
      if (S.bubble === 'inside') { closePip(); ensureCam().catch(noop); }
      else if (CAN_PIP && S.cam) openPip();
      render();
    });
  });
  $('#pipBtn').addEventListener('click', function () { if (pip) { closePip(); render(); } else openPip(); });
  $$('[data-corner]').forEach(function (b) { b.addEventListener('click', function () { S.corner = b.getAttribute('data-corner'); save(); render(); }); });
  $$('[data-bsize]').forEach(function (b) { b.addEventListener('click', function () { S.bsize = b.getAttribute('data-bsize'); save(); render(); }); });
  $('#mirror').addEventListener('change', function () { S.mirror = this.checked; save(); attachCam(); updatePip(); });
  $('#camSel').addEventListener('change', function () {
    S.camId = this.value; save();
    if (camStream) { stopCam(); ensureCam().catch(function (e) { camNotice(e, S.mode === 'cam'); }); }
    render();
  });
  $('#micSel').addEventListener('change', function () { S.micId = this.value; save(); stopMeter(); stopMic(); });
  $('#micTest').addEventListener('click', function () {
    ensureCtx();
    clearTimeout(micTestTimer);
    if (S.micId === 'none') { S.micId = ''; save(); fillSelect($('#micSel'), null, 'mic'); }
    ensureMic().then(function (s) {
      if (!s || R) return;
      startMeter(s);
      micTestTimer = setTimeout(function () { if (!R) { stopMeter(); stopMic(); } }, 15000);
    }, function (e) { notice(missing(e) ? 'mic_missing' : 'mic_blocked'); });
  });
  $('#sysAudio').addEventListener('change', function () { S.sys = this.checked; save(); });
  $$('[data-q]').forEach(function (b) { b.addEventListener('click', function () { S.q = b.getAttribute('data-q'); save(); render(); }); });
  $$('[data-br]').forEach(function (b) { b.addEventListener('click', function () { S.br = b.getAttribute('data-br'); save(); render(); }); });
  $$('[data-fps]').forEach(function (b) { b.addEventListener('click', function () { S.fps = Number(b.getAttribute('data-fps')); save(); render(); }); });
  $$('[data-fmt]').forEach(function (b) { b.addEventListener('click', function () { if (b.disabled) return; S.fmt = b.getAttribute('data-fmt'); save(); render(); }); });
  $('#optCountdown').addEventListener('change', function () { S.countdown = this.checked; save(); });

  $('#recBtn').addEventListener('click', startRecording);
  $('#camStart').addEventListener('click', function () { ensureCam().catch(function (e) { camNotice(e, true); }); render(); });
  $('#bubbleStart').addEventListener('click', function () { if (S.bubble === 'float' && CAN_PIP) openPip(); else ensureCam().catch(function (e) { camNotice(e, false); }); render(); });
  $('#countCancel').addEventListener('click', cancelStart);
  $('#busyCancel').addEventListener('click', function () { if (st === 'starting') cancelStart(); });
  $('#pauseBtn').addEventListener('click', togglePause);
  $('#stopBtn').addEventListener('click', stopRecording);
  $('#muteBtn').addEventListener('click', toggleMute);
  $('#dlBtn').addEventListener('click', function () { downloadItem(current); });
  $('#shareBtn').addEventListener('click', function () { shareItem(current); });
  $('#frameBtn').addEventListener('click', saveFrame);
  $('#newBtn').addEventListener('click', newRecording);
  $('#delBtn').addEventListener('click', function () { deleteItem(current); });
  /* update only this take's name in the list: rebuilding the list on every key press reloaded every thumbnail */
  $('#fileName').addEventListener('input', function () {
    if (!current) return;
    current.name = this.value;
    var li = $('#sessionList .sr-item[data-id="' + current.id + '"]');
    if (!li) { renderSession(); return; }
    $('.sr-iname', li).textContent = fileNameOf(current);
    $('.sr-thumb', li).setAttribute('aria-label', t('play_rec', { name: fileNameOf(current) }));
  });
  $('#fileName').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); downloadItem(current); } });
  $('#dlAll').addEventListener('click', function () {
    var list = recs.filter(function (r) { return !r.downloaded; });
    if (!list.length) list = recs.slice();
    list.forEach(function (r, i) { setTimeout(function () { downloadItem(r); }, i * 700); });
  });
  $('#noticeClose').addEventListener('click', function () { notice(null); });
  $('#player').addEventListener('loadedmetadata', function () { renderResult(); render(); });

  function onKey(e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    var tg = e.target, tag = tg && tg.tagName;
    if (e.key === 'Escape') { if (st === 'countdown' || st === 'starting') { e.preventDefault(); cancelStart(); } return; }
    var typing = tag === 'TEXTAREA' || tag === 'SELECT' || (tg && tg.isContentEditable) ||
      (tag === 'INPUT' && !/^(checkbox|radio|range|button|submit|color)$/i.test(tg.type || ''));
    if (typing) return;
    if (document.querySelector('.edu-modal-back')) return;
    var k = (e.key || '').toLowerCase();
    if (k === 'r') {
      e.preventDefault();
      if (st === 'idle' || st === 'stopped') startRecording();
      else if (st === 'recording' || st === 'paused') stopRecording();
      else if (st === 'countdown') cancelStart();
    } else if (k === 'p' && (st === 'recording' || st === 'paused')) { e.preventDefault(); togglePause(); }
    else if (k === 'm' && (st === 'recording' || st === 'paused')) { e.preventDefault(); toggleMute(); }
  }
  document.addEventListener('keydown', onKey);

  window.addEventListener('beforeunload', function (e) {
    var busy = st === 'recording' || st === 'paused' || st === 'saving';
    if (busy || recs.some(function (r) { return !r.downloaded; })) { e.preventDefault(); e.returnValue = ''; }
  });
  window.addEventListener('pagehide', function () { closePip(); });
  if (md && md.addEventListener) md.addEventListener('devicechange', refreshDevices);

  /* ---------------------------------------------------------------- start */
  try {
    if (navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then(function (e) {
      if (e && e.quota) { freeBytes = e.quota - (e.usage || 0); render(); }
    }, noop);
  } catch (e) { }
  refreshDevices();
  fillSelect($('#micSel'), null, 'mic');
  fillSelect($('#camSel'), null, 'cam');
  EDU.onLang(renderDynamic);
  setState('idle');
  renderSession();
})();
