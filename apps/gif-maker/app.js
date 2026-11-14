/* GIF Maker: 2 to 50 photos, or a video clip of up to 15 seconds, made into an animated GIF on the device.
   The GIF is encoded by gif-encoder.js (this app's own encoder) inside a Web Worker built from a Blob URL, so the
   page stays responsive; if a worker can't start, the same encoder runs on the page between frames.
   Photos are read again only while the GIF is being made (one at a time), so 50 big photos don't fill a phone's
   memory. The same frames can also be saved as an MP4 / WebM video with MediaRecorder where the browser can. */
(function () {
  'use strict';
  var SLUG = 'gif-maker';
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$;
  var MAX_PHOTOS = 50, MAX_CLIP = 15, MAX_FILE = 100 * 1024 * 1024, BIG_GIF = 5 * 1024 * 1024;
  var PW = [320, 480, 640, 800], VW = [240, 320, 480], COLS = [256, 128, 64, 32], SPEEDS = [0.5, 1, 2];
  var SHAPES = { square: 1, portrait: 0.8, story: 9 / 16, wide: 16 / 9 };
  var SWATCHES = ['#ffffff', '#111111', '#fff3c4', '#ffd9e1', '#d9ecff', '#dff5e1'];
  var FONT = 'system-ui, "Segoe UI", Roboto, "Noto Sans", "Nirmala UI", sans-serif';
  var CANCEL = { cancelled: true };
  function noop() { }

  var REC = (function () {
    var ok = typeof window.MediaRecorder === 'function' && typeof HTMLCanvasElement === 'function' &&
      typeof HTMLCanvasElement.prototype.captureStream === 'function' && typeof MediaRecorder.isTypeSupported === 'function';
    function first(list) {
      if (!ok) return '';
      for (var i = 0; i < list.length; i++) { try { if (MediaRecorder.isTypeSupported(list[i])) return list[i]; } catch (e) { /* ignore */ } }
      return '';
    }
    return { mp4: first(['video/mp4;codecs=avc1.42E01E', 'video/mp4;codecs=avc1', 'video/mp4']), webm: first(['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']) };
  })();

  var DEF = { mode: 'photos', wp: 480, wv: 320, loop: 'forever', times: 3, colours: 256, dither: true, caption: '', pos: 'bottom',
    shape: 'first', fit: 'contain', bg: '#ffffff', allTime: 1, fps: 10, speed: 1, vfmt: REC.mp4 ? 'mp4' : 'webm' };

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ---------------------------------------------------------------- settings */
  function num(v, lo, hi, d) { v = Number(v); return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; }
  function cleanSet(o) {
    o = o && typeof o === 'object' ? o : {};
    var one = function (v, list, d) { return list.indexOf(v) >= 0 ? v : d; };
    return {
      mode: one(o.mode, ['photos', 'video'], DEF.mode), wp: one(Number(o.wp), PW, DEF.wp), wv: one(Number(o.wv), VW, DEF.wv),
      loop: one(o.loop, ['forever', 'times'], DEF.loop), times: Math.round(num(o.times, 1, 20, DEF.times)),
      colours: one(Number(o.colours), COLS, DEF.colours), dither: o.dither === undefined ? DEF.dither : !!o.dither,
      caption: typeof o.caption === 'string' ? o.caption.slice(0, 60) : '', pos: one(o.pos, ['top', 'bottom'], DEF.pos),
      shape: one(o.shape, ['first', 'square', 'portrait', 'story', 'wide'], DEF.shape), fit: one(o.fit, ['contain', 'cover'], DEF.fit),
      bg: /^#[0-9a-f]{6}$/i.test(o.bg) ? String(o.bg).toLowerCase() : DEF.bg, allTime: round1(num(o.allTime, 0.1, 10, DEF.allTime)),
      fps: Math.round(num(o.fps, 5, 15, DEF.fps)), speed: one(Number(o.speed), SPEEDS, DEF.speed),
      vfmt: REC[o.vfmt] ? o.vfmt : DEF.vfmt
    };
  }
  function round1(v) { return Math.round(v * 10) / 10; }
  var S = cleanSet(store.get('set', null));
  function save() { store.set('set', S); }

  /* ---------------------------------------------------------------- sample frames: a kite flying (drawn, no photo) */
  function makeSample(f) {
    var c = document.createElement('canvas'); c.width = c.height = 800;
    var x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 800);
    g.addColorStop(0, '#6cc4ff'); g.addColorStop(1, '#e6f6ff'); x.fillStyle = g; x.fillRect(0, 0, 800, 800);
    x.fillStyle = 'rgba(255, 255, 230, .45)'; x.beginPath(); x.arc(650, 140, 100, 0, 6.3); x.fill();
    x.fillStyle = '#ffd54a'; x.beginPath(); x.arc(650, 140, 70, 0, 6.3); x.fill();
    function cloud(cx, cy, s) { x.fillStyle = 'rgba(255,255,255,.92)'; [[0, 0, 46], [40, -18, 40], [80, 0, 44], [40, 12, 42]].forEach(function (b) { x.beginPath(); x.arc(cx + b[0] * s, cy + b[1] * s, b[2] * s, 0, 6.3); x.fill(); }); }
    cloud(70 + f * 26, 170, 1); cloud(380 + f * 14, 300, 0.75);
    x.fillStyle = '#5bb55b'; x.beginPath(); x.moveTo(0, 800); x.lineTo(0, 640); x.bezierCurveTo(220, 560, 420, 700, 800, 610); x.lineTo(800, 800); x.fill();
    x.fillStyle = '#3d8f45'; x.beginPath(); x.moveTo(0, 800); x.lineTo(0, 720); x.bezierCurveTo(260, 660, 520, 780, 800, 700); x.lineTo(800, 800); x.fill();
    var kx = 250 + f * 62, ky = 500 - f * 52 + (f % 2) * 14, rot = (f % 2 ? 0.16 : -0.08);
    x.strokeStyle = 'rgba(60,60,60,.8)'; x.lineWidth = 3; x.beginPath(); x.moveTo(kx, ky + 80);
    x.quadraticCurveTo(kx - 120, ky + 260, 70, 790); x.stroke();
    x.save(); x.translate(kx, ky); x.rotate(rot);
    x.strokeStyle = '#a04000'; x.lineWidth = 4; x.beginPath(); x.moveTo(0, 80);
    for (var k = 1; k <= 6; k++) x.quadraticCurveTo((k % 2 ? 26 : -26) * (f % 2 ? -1 : 1), 80 + k * 26 - 13, 0, 80 + k * 26);
    x.stroke();
    [1, 3, 5].forEach(function (k) { var ty = 80 + k * 26; x.fillStyle = k === 3 ? '#2f80ed' : '#ffb000'; x.beginPath(); x.moveTo(0, ty); x.lineTo(-16, ty - 11); x.lineTo(-16, ty + 11); x.closePath(); x.fill(); x.beginPath(); x.moveTo(0, ty); x.lineTo(16, ty - 11); x.lineTo(16, ty + 11); x.closePath(); x.fill(); });
    x.fillStyle = '#ff5a5f'; x.beginPath(); x.moveTo(0, -80); x.lineTo(56, 0); x.lineTo(0, 80); x.closePath(); x.fill();
    x.fillStyle = '#ffb000'; x.beginPath(); x.moveTo(0, -80); x.lineTo(-56, 0); x.lineTo(0, 80); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(80,40,0,.7)'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, -80); x.lineTo(0, 80); x.moveTo(-56, 0); x.lineTo(56, 0); x.stroke();
    x.restore();
    return { src: c, w: 800, h: 800, thumb: thumbOf(c, 800, 800), delay: 0.3, sample: true };
  }
  function thumbOf(img, w, h) {
    var c = document.createElement('canvas'); c.width = c.height = 120; c.className = 'ph-th';
    var x = c.getContext('2d'), k = Math.max(120 / w, 120 / h);
    x.imageSmoothingQuality = 'high';
    x.drawImage(img, (120 - w * k) / 2, (120 - h * k) / 2, w * k, h * k);
    return c;
  }
  var samples = [];
  for (var sf = 0; sf < 6; sf++) samples.push(makeSample(sf));
  var items = samples.slice();
  function hasSamples() { return items.some(function (p) { return p.sample; }); }
  function userCount() { return items.filter(function (p) { return !p.sample; }).length; }

  /* ---------------------------------------------------------------- reading pictures */
  function looksImage(f) { return f.type ? /^image\//i.test(f.type) : /\.(jpe?g|png|gif|webp|bmp|avif|heic|heif|svg|ico)$/i.test(f.name || ''); }
  function decode(file) {
    function viaImg() {
      return new Promise(function (res) {
        var url = URL.createObjectURL(file), img = new Image();
        img.onload = function () {
          var w = img.naturalWidth, h = img.naturalHeight;
          if (!w || !h) { URL.revokeObjectURL(url); return res(null); }
          res({ img: img, w: w, h: h, close: function () { URL.revokeObjectURL(url); } });
        };
        img.onerror = function () { URL.revokeObjectURL(url); res(null); };
        img.src = url;
      });
    }
    if (typeof createImageBitmap === 'function' && !/svg/i.test(file.type || '')) {
      return createImageBitmap(file).then(function (b) {
        if (!b.width || !b.height) return viaImg();
        return { img: b, w: b.width, h: b.height, close: function () { try { b.close(); } catch (e) { /* ignore */ } } };
      }, viaImg);
    }
    return viaImg();
  }
  var loading = false;
  async function addFiles(list) {
    var files = Array.prototype.slice.call(list || []);
    if (!files.length || loading) return;
    loading = true;
    var replace = hasSamples(), room = MAX_PHOTOS - (replace ? 0 : items.length), over = Math.max(0, files.length - room);
    files = files.slice(0, Math.max(0, room));
    var fresh = [], bad = 0, msg = $('#loadMsg');
    msg.hidden = false; renderInfo();
    for (var i = 0; i < files.length; i++) {
      msg.textContent = t('st_loading', { n: i + 1, total: files.length });
      var f = files[i];
      if (!looksImage(f) || f.size > MAX_FILE || !f.size) { bad++; continue; }
      var d = null;
      try { d = await decode(f); } catch (e) { d = null; }
      if (!d) { bad++; continue; }
      var th = null;
      try { th = thumbOf(d.img, d.w, d.h); } catch (e) { th = null; }
      d.close();
      if (!th) { bad++; continue; }
      fresh.push({ file: f, w: d.w, h: d.h, thumb: th, delay: S.allTime, sample: false });
    }
    msg.hidden = true; loading = false;
    if (fresh.length) items = replace ? fresh : items.concat(fresh);
    if (over > 0) EDU.toast(t('msg_max', { max: MAX_PHOTOS }));
    else if (bad) EDU.toast(t('msg_bad_files', { n: bad }));
    renderAll();
  }

  /* ---------------------------------------------------------------- drawing one frame */
  function drawFit(x, W, H, img, iw, ih, fit, bg) {
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    var k = fit === 'cover' ? Math.max(W / iw, H / ih) : Math.min(W / iw, H / ih), dw = iw * k, dh = ih * k;
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  }
  function chars(s) { return Array.from ? Array.from(s) : s.split(''); }
  function isRtl(s) { var m = /[A-Za-z֐-ࣿऀ-෿]/.exec(s); return !!m && /[֐-ࣿ]/.test(m[0]); }
  function wrapText(x, text, maxW) {
    var words = text.split(' '), lines = [], cur = '';
    words.forEach(function (w) {
      var test = cur ? cur + ' ' + w : w;
      if (!cur || x.measureText(test).width <= maxW) cur = test; else { lines.push(cur); cur = w; }
    });
    if (cur) lines.push(cur);
    return lines;
  }
  function ellipsize(x, s, maxW) {
    if (x.measureText(s).width <= maxW) return s;
    var c = chars(s);
    while (c.length > 1 && x.measureText(c.join('') + '…').width > maxW) c.pop();
    return c.join('').trim() + '…';
  }
  function drawCaption(x, W, H, text, pos) {
    text = String(text || '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    var base = Math.min(W, H), size = Math.max(12, Math.round(base * 0.085)), maxW = W * 0.92, lines;
    for (;;) {
      x.font = '800 ' + size + 'px ' + FONT;
      lines = wrapText(x, text, maxW);
      var ok = lines.length <= 2 && lines.every(function (l) { return x.measureText(l).width <= maxW; });
      if (ok || size <= 11) break;
      size = Math.max(11, Math.floor(size * 0.88));
    }
    if (lines.length > 2) { lines = [lines[0], lines.slice(1).join(' ')]; }
    lines = lines.map(function (l) { return ellipsize(x, l, maxW); });
    var lh = size * 1.25, pad = Math.round(base * 0.04), y0 = pos === 'top' ? pad + lh / 2 : H - pad - lh * lines.length + lh / 2;
    x.save();
    x.textAlign = 'center'; x.textBaseline = 'middle';
    try { x.direction = isRtl(text) ? 'rtl' : 'ltr'; } catch (e) { /* older browsers */ }
    x.lineJoin = 'round'; x.lineWidth = Math.max(2, size * 0.2); x.strokeStyle = 'rgba(0,0,0,.85)'; x.fillStyle = '#ffffff';
    lines.forEach(function (l, i) { var y = y0 + i * lh; x.strokeText(l, W / 2, y); x.fillText(l, W / 2, y); });
    x.restore();
  }

  /* ---------------------------------------------------------------- photo and video plans */
  function photoDims() {
    var a;
    if (S.shape === 'first') { var f = items[0]; a = f ? f.w / f.h : 1; a = Math.min(2, Math.max(0.5, a)); }
    else a = SHAPES[S.shape];
    return [S.wp, Math.max(16, Math.round(S.wp / a))];
  }
  function loopValue() { return S.loop === 'forever' ? 0 : S.times <= 1 ? -1 : S.times - 1; }
  function videoDelays(n, fps, speed) {
    var per = 100 / (fps * speed), out = [];
    for (var i = 0; i < n; i++) out.push(Math.max(2, Math.round((i + 1) * per) - Math.round(i * per)));
    return out;
  }
  function photoPlan() {
    var list = items.slice();
    if (list.length < 2) return null;
    var d = photoDims(), W = d[0], H = d[1], cap = S.caption, pos = S.pos, fit = S.fit, bg = S.bg;
    async function paint(x, i) {
      var it = list[i];
      if (it.sample) { drawFit(x, W, H, it.src, it.w, it.h, fit, bg); }
      else {
        var dd = null;
        try { dd = await decode(it.file); } catch (e) { dd = null; }
        if (!dd) { var er = new Error('photo'); er.photo = i + 1; throw er; }
        try { drawFit(x, W, H, dd.img, dd.w, dd.h, fit, bg); } finally { dd.close(); }
      }
      drawCaption(x, W, H, cap, pos);
    }
    return { kind: 'photos', W: W, H: H, n: list.length, paint: paint, samples: [],
      delays: list.map(function (p) { return Math.max(2, Math.round(p.delay * 100)); }),
      opts: { w: W, h: H, colours: S.colours, dither: S.dither ? 'fs' : 'none', global: false, loop: loopValue() }, loop: S.loop, times: S.times };
  }
  var vid = $('#vid'), V = { ok: false, url: '', dur: 0, w: 0, h: 0, start: 0, end: 0, token: 0 };
  function vDims() { var W = Math.min(S.wv, V.w || S.wv); return [W, Math.max(2, Math.round(W * (V.h || 9) / (V.w || 16)))]; }
  function clipFrames() { return Math.max(1, Math.round((V.end - V.start) * S.fps)); }
  function seekTo(time) {
    return new Promise(function (res) {
      var done = false, tm = null;
      function fin() { if (done) return; done = true; clearTimeout(tm); vid.removeEventListener('seeked', fin); res(); }
      vid.addEventListener('seeked', fin); tm = setTimeout(fin, 5000);
      try { vid.currentTime = time; } catch (e) { fin(); }
    });
  }
  function videoPlan() {
    if (!V.ok) return null;
    var d = vDims(), W = d[0], H = d[1], n = clipFrames(), fps = S.fps, start = V.start, cap = S.caption, pos = S.pos, token = V.token;
    var maxT = V.dur > 0 ? Math.max(0, V.dur - 0.02) : Infinity;
    async function paint(x, i) {
      if (token !== V.token) throw CANCEL;
      await seekTo(Math.min(maxT, start + i / fps));
      x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
      x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
      x.drawImage(vid, 0, 0, W, H);
      drawCaption(x, W, H, cap, pos);
    }
    var k = Math.min(n, 10), samplesIdx = [];
    for (var j = 0; j < k; j++) samplesIdx.push(k === 1 ? 0 : Math.round(j * (n - 1) / (k - 1)));
    return { kind: 'video', W: W, H: H, n: n, paint: paint, samples: samplesIdx, token: token, delays: videoDelays(n, fps, S.speed),
      opts: { w: W, h: H, colours: S.colours, dither: S.dither ? 'bayer' : 'none', global: true, loop: loopValue() }, loop: S.loop, times: S.times };
  }

  /* ---------------------------------------------------------------- encoder: worker, or the page as a fallback */
  var workerUrl = null;
  function workerURL() {
    if (!workerUrl) workerUrl = URL.createObjectURL(new Blob(['(' + window.GIFMAKER_LIB.toString() + ')(self, true);'], { type: 'text/javascript' }));
    return workerUrl;
  }
  function directEncoder(o) {
    var s = new window.GIFMAKER.Session(o), dead = false;
    function later(fn) {
      return new Promise(function (res, rej) {
        setTimeout(function () { if (dead) return rej(CANCEL); try { res(fn()); } catch (e) { rej(e); } }, 0);
      });
    }
    return {
      worker: false,
      sample: function (px) { return later(function () { s.sample(px); }); },
      frame: function (px, d) { return later(function () { return { bytes: s.frame(px, d) }; }); },
      finish: function () { return later(function () { return s.finish(); }); },
      kill: function () { dead = true; }
    };
  }
  function openEncoder(o) {
    return new Promise(function (resolve) {
      var w = null;
      try { w = new Worker(workerURL()); } catch (e) { w = null; }
      if (!w) return resolve(directEncoder(o));
      var waiting = {}, seq = 0, dead = false, started = false, settled = false;
      function settle(api) { if (settled) return; settled = true; resolve(api); }
      function call(msg, transfer) {
        return new Promise(function (res, rej) {
          if (dead) return rej(CANCEL);
          msg.id = ++seq; waiting[msg.id] = { res: res, rej: rej };
          try { w.postMessage(msg, transfer || []); } catch (e) { delete waiting[msg.id]; rej(e); }
        });
      }
      function failAll(err) {
        dead = true;
        Object.keys(waiting).forEach(function (k) { waiting[k].rej(err); });
        waiting = {};
        try { w.terminate(); } catch (e) { /* ignore */ }
      }
      w.onmessage = function (e) {
        var m = e.data || {}, cb = waiting[m.id];
        if (!cb) return;
        delete waiting[m.id];
        if (m.t === 'error') cb.rej(new Error(m.msg)); else cb.res(m);
      };
      w.onerror = function (ev) {
        if (ev && ev.preventDefault) ev.preventDefault();
        if (!started) { failAll(new Error('worker')); settle(directEncoder(o)); } else failAll(new Error('worker'));
      };
      var api = {
        worker: true,
        sample: function (px) { return call({ t: 'sample', px: px.buffer }, [px.buffer]); },
        frame: function (px, d) { return call({ t: 'frame', px: px.buffer, d: d }, [px.buffer]); },
        finish: function () { return call({ t: 'end' }).then(function (m) { return new Uint8Array(m.buf); }); },
        kill: function () { failAll(CANCEL); }
      };
      var timer = setTimeout(function () { if (!started) { failAll(new Error('timeout')); settle(directEncoder(o)); } }, 5000);
      call({ t: 'begin', o: o }).then(function () { started = true; clearTimeout(timer); settle(api); }, noop);
    });
  }

  /* ---------------------------------------------------------------- making the GIF */
  var job = null, R = null, made = 0;
  function workCanvas(W, H) {
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    return c.getContext('2d', { willReadFrequently: true });
  }
  function check(me) { if (me.cancelled) throw CANCEL; }
  function setBusy(on) {
    $('#busy').hidden = !on; $('#makeBtn').disabled = on || !canMake();
    $$('#srcCard button, #srcCard input, #setCard .seg button, #setCard input, #resetBtn').forEach(function (b) { if (on) { b.dataset.wasOff = b.disabled ? '1' : ''; b.disabled = true; } else if (b.dataset.wasOff !== undefined) { b.disabled = b.dataset.wasOff === '1'; delete b.dataset.wasOff; } });
    $('#photoFile').disabled = on; $('#videoFile').disabled = on;
    vid.controls = !on;
    if (!on) renderAll();
  }
  function progress(p, msg) {
    p = Math.max(0, Math.min(100, Math.round(p)));
    $('#progBar').style.width = p + '%'; $('#prog').setAttribute('aria-valuenow', String(p));
    if (msg) $('#busyMsg').textContent = msg;
  }
  function showDone(msg, bad) { var d = $('#doneMsg'); d.hidden = !msg; d.textContent = msg || ''; d.style.color = bad ? 'var(--danger)' : ''; }
  function buildPlan() { return S.mode === 'photos' ? photoPlan() : videoPlan(); }
  async function make() {
    if (job || !canMake()) return;
    var plan = buildPlan();
    if (!plan) return;
    var me = job = { cancelled: false, enc: null };
    showDone(''); setBusy(true);
    var x = workCanvas(plan.W, plan.H), N = plan.n, grabbed = 0, encoded = 0, total = plan.samples.length + 2 * N;
    function upd() { progress((plan.samples.length + grabbed + encoded) / total * 100, encoded ? t('st_encode', { n: encoded, total: N }) : t('st_grab', { n: grabbed, total: N })); }
    progress(0, t('st_grab', { n: 0, total: N }));
    try {
      var enc = me.enc = await openEncoder(plan.opts);
      check(me);
      for (var s = 0; s < plan.samples.length; s++) {
        await plan.paint(x, plan.samples[s]); check(me);
        await enc.sample(x.getImageData(0, 0, plan.W, plan.H).data); check(me);
        progress((s + 1) / total * 100, t('st_palette'));
      }
      var inflight = [];
      for (var i = 0; i < N; i++) {
        await plan.paint(x, i); check(me);
        var px = x.getImageData(0, 0, plan.W, plan.H).data;
        grabbed++; upd();
        if (inflight.length >= 2) { await inflight.shift(); check(me); }
        var p = enc.frame(px, plan.delays[i]).then(function () { encoded++; upd(); });
        p.catch(noop);
        inflight.push(p);
      }
      await Promise.all(inflight); check(me);
      var bytes = await enc.finish(); check(me);
      progress(100);
      showResult(new Blob([bytes], { type: 'image/gif' }), plan);
      showDone(t('st_done'));
    } catch (e) {
      if (e === CANCEL || me.cancelled) showDone(t('st_cancelled'));
      else if (e && e.photo) showDone(t('st_photo_fail', { n: e.photo }), true);
      else showDone(t('st_error'), true);
    } finally {
      if (me.enc) me.enc.kill();
      job = null; setBusy(false);
    }
  }
  /* wrapped in left-to-right isolate marks so "35.4 MB" stays in one piece inside Urdu (right-to-left) sentences */
  function sizeText(b) {
    return '⁦' + (b < 1024 * 1024 ? t('size_kb', { n: EDU.fmt(Math.max(1, Math.round(b / 1024))) }) : t('size_mb', { n: EDU.fmt(b / 1048576, { maximumFractionDigits: 1 }) })) + '⁩';
  }
  function loopText(loop, times) { return loop === 'forever' ? t('res_loop_forever') : times <= 1 ? t('res_loop_once') : t('res_loop_n', { n: times }); }
  function showResult(blob, plan) {
    if (R && R.url) URL.revokeObjectURL(R.url);
    var sec = plan.delays.reduce(function (a, b) { return a + b; }, 0) / 100;
    R = { blob: blob, url: URL.createObjectURL(blob), plan: plan, sec: sec, id: ++made };
    $('#resImg').src = R.url;
    $('#resultCard').hidden = false;
    renderResult();
    try { $('#resultCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) { /* ignore */ }
  }
  function renderResult() {
    if (!R) return;
    $('#resInfo').textContent = t('res_info', { size: sizeText(R.blob.size), w: R.plan.W, h: R.plan.H, n: R.plan.n, sec: EDU.fmt(R.sec, { maximumFractionDigits: 1 }) });
    $('#resLoop').textContent = loopText(R.plan.loop, R.plan.times);
    $('#resBig').hidden = R.blob.size < BIG_GIF;
    var can = !!(REC.mp4 || REC.webm);
    $('#vfmtSeg').hidden = !(REC.mp4 && REC.webm);
    $$('#vfmtSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.vfmt === S.vfmt)); });
    $('#vidOutBtn').hidden = !can;
    $('#vidOutLbl').textContent = t('btn_video_out', { fmt: S.vfmt === 'mp4' ? 'MP4' : 'WebM' });
    $('#vidOutNote').textContent = !can ? t('video_out_unsupported') : t('video_out_note') + (S.vfmt === 'webm' ? ' ' + t('webm_note') : '');
  }
  function stamp() { var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()); }
  $('#dlGif').addEventListener('click', function () { if (R) EDU.download('gif-' + stamp() + '.gif', R.blob); });

  /* ---------------------------------------------------------------- the same frames as a video file */
  var vjob = null;
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, Math.max(0, ms)); }); }
  function vprogress(p, msg) {
    p = Math.max(0, Math.min(100, Math.round(p)));
    $('#vprogBar').style.width = p + '%'; $('#vprog').setAttribute('aria-valuenow', String(p));
    if (msg) $('#vbusyMsg').textContent = msg;
  }
  async function recordVideo() {
    if (!R || vjob || job) return;
    var plan = R.plan, fmt = S.vfmt, mime = REC[fmt];
    if (!mime) return;
    if (plan.kind === 'video' && plan.token !== V.token) { EDU.toast(t('vid_changed')); return; }
    var me = vjob = { cancelled: false, rec: null, frames: [] };
    $('#vbusy').hidden = false; $('#vidOutBtn').disabled = true; $('#makeBtn').disabled = true;
    vprogress(0, t('st_grab', { n: 0, total: plan.n }));
    var cv = $('#recCv'); cv.width = plan.W; cv.height = plan.H;
    var rx = cv.getContext('2d'), pc = document.createElement('canvas'); pc.width = plan.W; pc.height = plan.H;
    var px = pc.getContext('2d'), stream = null;
    var pre = typeof createImageBitmap === 'function' && plan.W * plan.H * 4 * plan.n <= 150e6;
    try {
      if (pre) {
        for (var i = 0; i < plan.n; i++) {
          await plan.paint(px, i); check(me);
          me.frames.push(await createImageBitmap(pc)); check(me);
          vprogress((i + 1) / plan.n * 30, t('st_grab', { n: i + 1, total: plan.n }));
        }
      }
      var frame = async function (k) { if (pre) { rx.drawImage(me.frames[k], 0, 0); } else { await plan.paint(px, k); check(me); rx.drawImage(pc, 0, 0); } };
      stream = cv.captureStream(0);
      var track = stream.getVideoTracks()[0];
      if (!track || typeof track.requestFrame !== 'function') { stream.getTracks().forEach(function (x) { x.stop(); }); stream = cv.captureStream(30); track = null; }
      var chunks = [], rec = me.rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4000000 });
      rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      var stopped = new Promise(function (res) { rec.onstop = res; });
      await frame(0);
      rec.start();
      if (track) track.requestFrame();
      var T0 = performance.now(), at = 0;
      for (var k = 1; k < plan.n; k++) {
        at += plan.delays[k - 1] * 10;
        var wait = T0 + at - performance.now();
        if (!pre) { await frame(k); wait = T0 + at - performance.now(); }
        if (wait > 0) await sleep(wait); else T0 -= wait;
        check(me);
        if (pre) await frame(k);
        if (track) track.requestFrame();
        vprogress(30 + k / plan.n * 70, t('st_rec', { n: k + 1, total: plan.n }));
      }
      at += plan.delays[plan.n - 1] * 10;
      await sleep(T0 + at - performance.now()); check(me);
      if (track) track.requestFrame();
      await sleep(150);
      rec.stop(); await stopped; check(me);
      var blob = new Blob(chunks, { type: mime.split(';')[0] });
      if (!blob.size) throw new Error('empty');
      if (fmt === 'webm' && window.SR_fixWebmDuration) blob = await window.SR_fixWebmDuration(blob, at);
      vprogress(100, t('vid_saved', { size: sizeText(blob.size) }));
      me.done = true;
      EDU.download('gif-video-' + stamp() + '.' + fmt, blob);
    } catch (e) {
      vprogress(0, me.cancelled || e === CANCEL ? t('st_cancelled') : t('vid_error'));
      try { if (me.rec && me.rec.state !== 'inactive') me.rec.stop(); } catch (er) { /* ignore */ }
    } finally {
      if (stream) stream.getTracks().forEach(function (x) { x.stop(); });
      me.frames.forEach(function (b) { try { b.close(); } catch (e) { /* ignore */ } });
      vjob = null;
      $('#vcancelBtn').hidden = true; $('#vidOutBtn').disabled = false; $('#makeBtn').disabled = !canMake();
      setTimeout(function () { if (!vjob) { $('#vbusy').hidden = true; $('#vcancelBtn').hidden = false; } }, me.done ? 6000 : 3000);
    }
  }
  $('#vidOutBtn').addEventListener('click', function () { $('#vcancelBtn').hidden = false; recordVideo(); });
  $('#vcancelBtn').addEventListener('click', function () { if (vjob) vjob.cancelled = true; });
  $('#vfmtSeg').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b || !REC[b.dataset.vfmt]) return; S.vfmt = b.dataset.vfmt; save(); renderResult(); });

  /* ---------------------------------------------------------------- video file */
  function looksVideo(f) { return f.type ? /^video\//i.test(f.type) : /\.(mp4|m4v|webm|mov|mkv|3gp|ogv|avi)$/i.test(f.name || ''); }
  function waitMeta(tok) {
    return new Promise(function (res) {
      var done = false, tm = null;
      function fin(ok) { if (done) return; done = true; clearTimeout(tm); vid.removeEventListener('loadeddata', onOk); vid.removeEventListener('error', onBad); res(ok && tok === V.token); }
      function onOk() { fin(true); } function onBad() { fin(false); }
      vid.addEventListener('loadeddata', onOk); vid.addEventListener('error', onBad);
      tm = setTimeout(function () { fin(vid.readyState >= 1); }, 15000);
    });
  }
  function probeDuration() {
    return new Promise(function (res) {
      var done = false, tm = null;
      function fin() { if (done) return; done = true; clearTimeout(tm); vid.removeEventListener('durationchange', ch); res(); }
      function ch() { if (isFinite(vid.duration)) fin(); }
      vid.addEventListener('durationchange', ch); tm = setTimeout(fin, 4000);
      try { vid.currentTime = 1e7; } catch (e) { fin(); }
    });
  }
  async function pickVideo(file) {
    if (!file || job) return;
    var tok = ++V.token;
    V.ok = false; V.err = false; V.loading = true;
    if (V.url) URL.revokeObjectURL(V.url);
    V.url = '';
    vid.hidden = true; $('#clipBox').hidden = true;
    if (!looksVideo(file) || !file.size) { V.loading = false; V.err = true; try { vid.removeAttribute('src'); vid.load(); } catch (e) { /* ignore */ } renderAll(); return; }
    V.url = URL.createObjectURL(file);
    renderAll();
    vid.src = V.url;
    try { vid.load(); } catch (e) { /* ignore */ }
    var ok = await waitMeta(tok);
    if (tok !== V.token) return;
    if (!ok || !vid.videoWidth || !vid.videoHeight) {
      V.ok = false; V.loading = false; V.err = true;
      vid.removeAttribute('src'); try { vid.load(); } catch (e) { /* ignore */ }
      URL.revokeObjectURL(V.url); V.url = '';
      renderAll(); return;
    }
    var dur = vid.duration;
    if (!isFinite(dur) || !(dur > 0)) { await probeDuration(); if (tok !== V.token) return; dur = vid.duration; await seekTo(0); }
    V.dur = isFinite(dur) && dur > 0 ? dur : 0;
    V.w = vid.videoWidth; V.h = vid.videoHeight; V.ok = true; V.loading = false;
    V.start = 0; V.end = V.dur ? Math.min(V.dur, 4) : 4;
    vid.hidden = false; $('#clipBox').hidden = false;
    renderAll();
  }
  function renderVideoMsg() {
    var m = $('#videoMsg');
    m.style.color = V.err ? 'var(--danger)' : '';
    m.textContent = V.err ? t('video_bad') : V.loading ? t('loading') : !V.ok ? t('video_none')
      : V.dur ? t('video_info', { len: EDU.fmt(round1(V.dur), { maximumFractionDigits: 1 }), w: V.w, h: V.h }) : t('video_info_nolen', { w: V.w, h: V.h });
  }
  function setClip(start, end, which) {
    var dur = V.dur || Infinity, note = false;
    start = round1(Math.max(0, Number(start) || 0)); end = round1(Math.max(0, Number(end) || 0));
    if (start > dur) start = Math.max(0, round1(dur - 0.2));
    if (end > dur) end = dur;
    if (end - start > MAX_CLIP) { note = true; if (which === 'end') start = round1(end - MAX_CLIP); else end = start + MAX_CLIP; }
    if (end - start < 0.2) {
      if (which === 'end') { start = Math.max(0, round1(end - 0.2)); if (end - start < 0.2) end = Math.min(dur, start + 0.2); }
      else { end = Math.min(dur, start + 0.2); if (end - start < 0.2) start = Math.max(0, round1(end - 0.2)); }
    }
    V.start = start; V.end = end;
    renderClip(note);
    save();
  }

  /* ---------------------------------------------------------------- rendering the interface */
  function canMake() { return S.mode === 'photos' ? items.length >= 2 && !loading : V.ok; }
  function renderList() {
    var ol = $('#phList'), focusKey = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.fk : '';
    ol.innerHTML = '';
    items.forEach(function (it, i) {
      var li = el('li', { class: 'ph', 'aria-label': t('photo_n', { n: i + 1 }) });
      var top = el('div', { class: 'ph-top' });
      top.appendChild(it.thumb);
      top.appendChild(el('span', { class: 'ph-n', text: String(i + 1), 'aria-hidden': 'true' }));
      var inp = el('input', { type: 'number', min: '0.1', max: '10', step: '0.1', inputmode: 'decimal', value: String(it.delay), 'aria-label': t('f_photo_time_n', { n: i + 1 }), dataset: { fk: 't' + i } });
      inp.addEventListener('change', function () { it.delay = round1(num(inp.value, 0.1, 10, it.delay)); inp.value = String(it.delay); renderInfo(); });
      var lab = el('label', { class: 'ph-time' }, el('span', { text: t('f_photo_time') }), inp);
      var prev = el('button', { type: 'button', class: 'btn btn-sm', title: t('move_earlier'), 'aria-label': t('move_earlier'), disabled: i === 0, dataset: { fk: 'p' + i }, html: '<span class="flip" aria-hidden="true">◀</span>' });
      var next = el('button', { type: 'button', class: 'btn btn-sm', title: t('move_later'), 'aria-label': t('move_later'), disabled: i === items.length - 1, dataset: { fk: 'n' + i }, html: '<span class="flip" aria-hidden="true">▶</span>' });
      var del = el('button', { type: 'button', class: 'btn btn-sm btn-ghost', title: t('remove_photo'), 'aria-label': t('remove_photo'), dataset: { fk: 'x' + i }, html: '<span aria-hidden="true">✕</span>' });
      prev.addEventListener('click', function () { move(i, -1, 'p'); });
      next.addEventListener('click', function () { move(i, 1, 'n'); });
      del.addEventListener('click', function () { items.splice(i, 1); renderAll(); var f = $('[data-fk="x' + Math.min(i, items.length - 1) + '"]'); if (f) f.focus(); });
      li.appendChild(top); li.appendChild(lab); li.appendChild(el('div', { class: 'ph-btns' }, prev, next, del));
      ol.appendChild(li);
    });
    if (focusKey) { var f = $('[data-fk="' + focusKey + '"]'); if (f && !f.disabled) f.focus(); }
  }
  function move(i, d, kind) {
    var j = i + d;
    if (j < 0 || j >= items.length) return;
    var tmp = items[i]; items[i] = items[j]; items[j] = tmp;
    renderAll();
    var f = $('[data-fk="' + kind + j + '"]');
    if (f && f.disabled) f = $('[data-fk="' + (kind === 'p' ? 'n' : 'p') + j + '"]');
    if (f) f.focus();
  }
  function renderSwatches() {
    var box = $('#swatches'); box.innerHTML = '';
    SWATCHES.forEach(function (c, i) {
      var b = el('button', { type: 'button', class: 'sw', 'aria-pressed': String(S.bg === c), 'aria-label': t('colour_n', { n: i + 1 }), title: t('colour_n', { n: i + 1 }), style: { background: c }, dataset: { color: c } });
      b.addEventListener('click', function () { S.bg = c; save(); renderSwatches(); });
      box.appendChild(b);
    });
    var inp = el('input', { type: 'color', id: 'bgPick', value: S.bg, 'aria-label': t('bg_pick'), title: t('bg_pick') });
    inp.addEventListener('input', function () { S.bg = inp.value.toLowerCase(); save(); $$('#swatches .sw').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.color === S.bg)); }); });
    box.appendChild(inp);
  }
  function renderWidths() {
    var seg = $('#widthSeg'), list = S.mode === 'photos' ? PW : VW, cur = S.mode === 'photos' ? S.wp : S.wv;
    seg.innerHTML = '';
    list.forEach(function (w) { seg.appendChild(el('button', { type: 'button', 'aria-pressed': String(w === cur), text: String(w), dataset: { w: w } })); });
  }
  function pressed(sel, attr, val) { $$(sel + ' button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset[attr] === String(val))); }); }
  function renderClip(note) {
    if (!V.ok) return;
    $('#startIn').value = String(V.start); $('#endIn').value = String(round1(V.end));
    if (V.dur) { $('#startIn').max = String(round1(V.dur)); $('#endIn').max = String(round1(V.dur)); }
    $('#clipInfo').textContent = t('clip_len', { len: EDU.fmt(round1(V.end - V.start), { maximumFractionDigits: 1 }), n: clipFrames() }) + (note ? ' ' + t('clip_max', { max: MAX_CLIP }) : '');
    $('#clipInfo').style.color = note ? 'var(--warning)' : '';
    renderInfo();
  }
  function renderInfo() {
    var photos = S.mode === 'photos', d, n, sec;
    if (photos) { d = photoDims(); n = items.length; sec = items.reduce(function (a, p) { return a + Math.max(0.02, p.delay); }, 0); }
    else { d = vDims(); n = V.ok ? clipFrames() : 0; sec = V.ok ? videoDelays(n, S.fps, S.speed).reduce(function (a, b) { return a + b; }, 0) / 100 : 0; }
    $('#sizePx').textContent = photos || V.ok ? t('size_px', { w: d[0], h: d[1] }) : '';
    $('#frameInfo').textContent = n ? t('frame_info', { n: n, sec: EDU.fmt(round1(sec), { maximumFractionDigits: 1 }) }) : '';
    var can = canMake(), hint = $('#makeHint');
    hint.hidden = can || !!job;
    hint.textContent = photos ? t('need_photos') : t('need_video');
    if (!job) $('#makeBtn').disabled = !can;
  }
  function renderAll() {
    var photos = S.mode === 'photos';
    pressed('#modeSeg', 'mode', S.mode);
    $('#photosPane').hidden = !photos; $('#videoPane').hidden = photos;
    var u = userCount();
    $('#photoCount').textContent = t('photos_count', { n: u, max: MAX_PHOTOS });
    $('#clearPhotos').disabled = !u;
    $('#sampleNote').hidden = !hasSamples();
    $('#allTime').value = String(S.allTime);
    pressed('#shapeSeg', 'shape', S.shape); pressed('#fitSeg', 'fit', S.fit);
    $('#bgWrap').hidden = S.fit === 'cover';
    renderList();
    renderVideoMsg();
    $('#fpsLbl').textContent = t('f_fps', { n: S.fps }); $('#fps').value = String(S.fps);
    pressed('#speedSeg', 'speed', S.speed);
    renderWidths();
    pressed('#loopSeg', 'loop', S.loop); $('#timesWrap').hidden = S.loop !== 'times'; $('#times').value = String(S.times);
    pressed('#colSeg', 'col', S.colours);
    $('#dither').checked = S.dither;
    pressed('#posSeg', 'pos', S.pos);
    if ($('#caption').value !== S.caption) $('#caption').value = S.caption;
    renderClip(false);
    renderInfo();
    renderResult();
  }

  /* ---------------------------------------------------------------- events */
  function segClick(sel, fn) { $(sel).addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b || b.disabled) return; fn(b); save(); renderAll(); }); }
  segClick('#modeSeg', function (b) { S.mode = b.dataset.mode; showDone(''); });
  segClick('#shapeSeg', function (b) { S.shape = b.dataset.shape; });
  segClick('#fitSeg', function (b) { S.fit = b.dataset.fit; });
  segClick('#speedSeg', function (b) { S.speed = Number(b.dataset.speed); });
  segClick('#widthSeg', function (b) { if (S.mode === 'photos') S.wp = Number(b.dataset.w); else S.wv = Number(b.dataset.w); });
  segClick('#loopSeg', function (b) { S.loop = b.dataset.loop; });
  segClick('#colSeg', function (b) { S.colours = Number(b.dataset.col); });
  segClick('#posSeg', function (b) { S.pos = b.dataset.pos; });
  $('#times').addEventListener('change', function () { S.times = Math.round(num(this.value, 1, 20, S.times)); this.value = String(S.times); save(); });
  $('#dither').addEventListener('change', function () { S.dither = this.checked; save(); });
  $('#caption').addEventListener('input', function () { S.caption = this.value.slice(0, 60); save(); });
  $('#fps').addEventListener('input', function () { S.fps = Math.round(num(this.value, 5, 15, S.fps)); save(); $('#fpsLbl').textContent = t('f_fps', { n: S.fps }); renderClip(false); });
  $('#allTime').addEventListener('change', function () { S.allTime = round1(num(this.value, 0.1, 10, S.allTime)); this.value = String(S.allTime); save(); });
  $('#applyAll').addEventListener('click', function () {
    S.allTime = round1(num($('#allTime').value, 0.1, 10, S.allTime)); save();
    items.forEach(function (p) { p.delay = S.allTime; });
    renderAll(); EDU.toast(t('msg_applied', { s: EDU.fmt(S.allTime, { maximumFractionDigits: 1 }) }));
  });
  $('#photoFile').addEventListener('change', function () { var f = this.files; addFiles(f).then(function () { $('#photoFile').value = ''; }); });
  $('#clearPhotos').addEventListener('click', function () { items = samples.slice(); renderAll(); });
  $('#videoFile').addEventListener('change', function () { var f = this.files && this.files[0]; this.value = ''; pickVideo(f); });
  $('#startIn').addEventListener('change', function () { setClip(this.value, V.end, 'start'); });
  $('#endIn').addEventListener('change', function () { setClip(V.start, this.value, 'end'); });
  $('#setStart').addEventListener('click', function () { if (V.ok) setClip(vid.currentTime, Math.max(V.end, vid.currentTime + 0.2), 'start'); });
  $('#setEnd').addEventListener('click', function () { if (V.ok) setClip(V.start, vid.currentTime, 'end'); });
  $('#makeBtn').addEventListener('click', function () { try { vid.pause(); } catch (e) { /* ignore */ } make(); });
  $('#cancelBtn').addEventListener('click', function () { if (job) { job.cancelled = true; if (job.enc) job.enc.kill(); } });
  $('#resetBtn').addEventListener('click', function () {
    if (job || !confirm(t('confirm_reset'))) return;
    S = cleanSet(null); save(); items = samples.slice();
    V.token++; V.ok = false; V.err = false; V.loading = false; if (V.url) URL.revokeObjectURL(V.url); V.url = ''; vid.removeAttribute('src'); vid.hidden = true; $('#clipBox').hidden = true;
    if (R && R.url) URL.revokeObjectURL(R.url); R = null; $('#resultCard').hidden = true; $('#resImg').removeAttribute('src');
    showDone(''); renderSwatches(); renderAll();
  });
  /* drop files on the left card */
  var src = $('#srcCard');
  src.addEventListener('dragover', function (e) { e.preventDefault(); });
  src.addEventListener('drop', function (e) {
    e.preventDefault();
    var fl = e.dataTransfer && e.dataTransfer.files;
    if (!fl || !fl.length || job) return;
    if (S.mode === 'video') pickVideo(fl[0]); else addFiles(fl);
  });

  EDU.onLang(function () { renderSwatches(); renderAll(); });
  renderSwatches(); renderAll();

  /* for the interaction test */
  window.GIFM = {
    get set() { return S; }, get busy() { return !!job; }, get vbusy() { return !!vjob; }, get made() { return made; },
    items: function () { return items.map(function (p) { return { sample: !!p.sample, w: p.w, h: p.h, delay: p.delay, name: p.file ? p.file.name : '' }; }); },
    video: function () { return { ok: V.ok, dur: V.dur, w: V.w, h: V.h, start: V.start, end: V.end, frames: V.ok ? clipFrames() : 0 }; },
    result: function () { return R ? { size: R.blob.size, w: R.plan.W, h: R.plan.H, n: R.plan.n, delays: R.plan.delays.slice(), kind: R.plan.kind } : null; },
    resultBase64: function () {
      if (!R) return Promise.resolve('');
      return R.blob.arrayBuffer().then(function (ab) { var u = new Uint8Array(ab), s = '', CH = 0x8000; for (var i = 0; i < u.length; i += CH) s += String.fromCharCode.apply(null, u.subarray(i, i + CH)); return btoa(s); });
    },
    rec: REC
  };
})();
