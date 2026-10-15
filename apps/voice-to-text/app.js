/* Voice Note to Text: WhatsApp voice notes, recordings and videos → text + subtitles, fully on the device.
   Engine: Whisper (OpenAI, MIT licence; ONNX ports in the Xenova repos on huggingface.co) run by Transformers.js
   in a Web Worker (worker.js). The audio is decoded here to 16 kHz mono, cut at quiet moments into pieces of
   up to ~28 s, and each piece is sent to the worker. Only the library and the model are downloaded. */
(function () {
  'use strict';
  var t = EDU.t, $ = function (s) { return EDU.$(s); };
  var store = EDU.store('voice-to-text');

  EDU.init({ slug: 'voice-to-text', title: 'app_title', waKey: 'shell_wa_tool' });

  var LIB = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0';
  var ENGINE_MB = 27;                                    // onnxruntime-web WASM, downloaded once with the first model
  var SR = 16000;
  var MAX_SEC = 30 * 60;                                 // 30 minutes
  var MAX_FILE = 400 * 1024 * 1024;
  var MODELS = [
    { id: 'tiny', repo: 'Xenova/whisper-tiny', icon: '🐇', bytes: 10124910 + 30727765, files: ['encoder_model_quantized', 'decoder_model_merged_quantized'] },
    { id: 'base', repo: 'Xenova/whisper-base', icon: '🦊', bytes: 23200850 + 53707539, files: ['encoder_model_quantized', 'decoder_model_merged_quantized'] },
    { id: 'small', repo: 'Xenova/whisper-small', icon: '🦉', bytes: 92324809 + 156780950, files: ['encoder_model_quantized', 'decoder_model_merged_quantized'] }
  ];
  /* Small needs about 4 GB of memory while it works (measured in Chrome, Oct 2026: Tiny ~1 GB, Base ~1.6 GB,
     Small ~3.7 GB), which most phones cannot give one page. So on phones we never pick it by default. */
  var LOW_MEM = !!((navigator.userAgentData && navigator.userAgentData.mobile) || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '') ||
    (navigator.deviceMemory && navigator.deviceMemory < 8));
  var WLANGS = ['en', 'hi', 'bn', 'mr', 'gu', 'pa', 'ta', 'te', 'kn', 'ml', 'ur'];   // Whisper knows these; not Odia
  var NATIVE = { en: 'English', hi: 'हिन्दी', bn: 'বাংলা', mr: 'मराठी', gu: 'ગુજરાતી', pa: 'ਪੰਜਾਬੀ', or: 'ଓଡ଼ିଆ', ta: 'தமிழ்', te: 'తెలుగు', kn: 'ಕನ್ನಡ', ml: 'മലയാളം', ur: 'اردو' };
  var SCRIPT = { hi: 'deva', mr: 'deva', bn: 'beng', pa: 'guru', gu: 'gujr', ta: 'taml', te: 'telu', kn: 'knda', ml: 'mlym', ur: 'arab', en: 'latn' };
  /* Which languages each model can write in their own letters (tested on our sample sentences, Oct 2026).
     Others come out in English letters ("Roman"), which is far better than the broken text they write otherwise. */
  var NATIVE_OK = {
    tiny: { en: 1, ta: 1, ur: 1 },
    base: { en: 1, ta: 1, ur: 1 },
    small: { en: 1, hi: 1, mr: 1, ta: 1, ur: 1 }
  };

  /* ---------------------------------------------------------------- state */
  var S = store.get('settings', {});
  (function sanitize() {
    if (S.lang !== 'auto' && WLANGS.indexOf(S.lang) < 0) S.lang = WLANGS.indexOf(EDU.lang) >= 0 && EDU.lang !== 'en' ? EDU.lang : 'auto';
    if (S.mode !== 'translate') S.mode = 'transcribe';
    if (!S.picked || !MODELS.some(function (m) { return m.id === S.model; })) { S.picked = false; S.model = recModel(S.lang); }
    if (S.view !== 'plain') S.view = 'times';
  })();
  /* The model we suggest for a language. Hindi and Marathi need Small for proper spelling (Base writes Hindi in
     Urdu letters, which we can only turn into rough Devanagari), so Small is the default for them until the
     person picks a model themselves. Everything else starts on Base. */
  function recModel(lang) {
    var L = lang === 'auto' || !lang ? (WLANGS.indexOf(EDU.lang) >= 0 ? EDU.lang : 'en') : lang;
    return (L === 'hi' || L === 'mr') && !LOW_MEM ? 'small' : 'base';
  }
  function autoModel() { if (!S.picked) S.model = recModel(S.lang); }
  function saveS() { store.set('settings', S); }

  var audio = null;          // { name, pcm (Float32Array 16 kHz), dur, url, cut (bool) }
  var R = store.get('last', null);   // result: { name, dur, segs:[{s,e,text}], lang, model, task, ms, at }
  if (R && (!R.segs || !R.segs.length)) R = null;
  var restored = !!R;
  var busy = false, cancelReq = false, lastStatus = null, lastError = null, cached = {};

  function show(el, on) { el.hidden = !on; }
  function modelDef(id) { for (var i = 0; i < MODELS.length; i++) if (MODELS[i].id === id) return MODELS[i]; return MODELS[1]; }
  function mbOf(bytes) { return Math.round(bytes / 1e6); }
  function langName(c) { return t('lang_' + c); }
  function baseName(n) { return String(n || 'voice-note').replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[\\/:*?"<>|\s]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'voice-note'; }
  function fmtClock(sec) {
    sec = Math.max(0, Math.round(sec || 0));
    var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }
  function stamp(sec, sep) {
    var ms = Math.max(0, Math.round((sec || 0) * 1000));
    var h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000), s = Math.floor(ms % 60000 / 1000), r = ms % 1000;
    function p(n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; }
    return p(h, 2) + ':' + p(m, 2) + ':' + p(s, 2) + sep + p(r, 3);
  }
  function durText(sec) {
    sec = Math.round(sec);
    if (sec < 60) return t('dur_s', { s: sec });
    return t('dur_ms', { m: Math.floor(sec / 60), s: sec % 60 });
  }

  /* ---------------------------------------------------------------- language + model UI */
  function renderLangs() {
    var sel = $('#langSel');
    sel.innerHTML = '';
    function opt(v, label, dis) { var o = document.createElement('option'); o.value = v; o.textContent = label; if (dis) o.disabled = true; sel.appendChild(o); }
    opt('auto', t('lang_auto'));
    ['hi', 'en', 'bn', 'mr', 'gu', 'pa', 'ta', 'te', 'kn', 'ml', 'ur'].forEach(function (c) {
      opt(c, langName(c) + (c !== EDU.lang && c !== 'en' ? ' · ' + NATIVE[c] : ''));
    });
    opt('or', t('lang_or_na'), true);
    sel.value = S.lang;
    renderLangNote();
  }
  function renderLangNote() {
    var n = $('#langNote');
    n.textContent = S.lang === 'auto' ? t('auto_note') : EDU.lang === 'or' ? t('odia_note') : '';
    show(n, !!n.textContent);
  }
  function renderModels() {
    var box = $('#models');
    box.innerHTML = '';
    var L = S.lang === 'auto' ? (WLANGS.indexOf(EDU.lang) >= 0 ? EDU.lang : null) : S.lang;
    var rec = recModel(S.lang), recL = rec === 'small' && L && L !== 'en' ? L : null;
    MODELS.forEach(function (m) {
      var b = EDU.el('button', { type: 'button', class: 'vt-model', 'aria-pressed': String(S.model === m.id), dataset: { model: m.id } },
        EDU.el('span', { class: 'ic', 'aria-hidden': 'true', text: m.icon }),
        EDU.el('span', { class: 'nm', text: t('model_' + m.id) }),
        EDU.el('span', { class: 'sz' + (cached[m.id] ? ' ok' : ''), text: cached[m.id] ? '✓ ' + t('downloaded') : t('size_mb', { n: mbOf(m.bytes) }) }),
        EDU.el('span', { class: 'ds', text: t('model_' + m.id + '_d') }),
        rec === m.id && recL ? EDU.el('span', { class: 'badge success vt-best', text: '★ ' + t('rec_badge', { lang: langName(recL) }) }) : null);
      box.appendChild(b);
    });
  }
  function renderMode() {
    EDU.$$('#modeSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === S.mode)); });
  }
  /* What will the text look like for this language + model? */
  function allowFor(model, lang, task) {
    if (task === 'translate' || lang === 'en') return ['latn'];
    if (NATIVE_OK[model][lang]) return [SCRIPT[lang]];
    if (lang === 'hi' && model === 'base') return ['arab'];   // Base hears Hindi well but writes it in Urdu letters: converted below
    return ['latn'];
  }
  function renderScriptNote() {
    var n = $('#scriptNote'), lang = S.lang;
    var L = lang === 'auto' ? (WLANGS.indexOf(EDU.lang) >= 0 ? EDU.lang : null) : lang;
    var roman = S.mode === 'transcribe' && L && L !== 'en' && !NATIVE_OK[S.model][L];
    n.innerHTML = '';
    if (roman && L === 'hi' && S.model === 'base') {
      n.appendChild(EDU.el('span', { text: t('note_rough') + ' ' }));
      n.appendChild(EDU.el('button', { type: 'button', class: 'btn btn-sm', id: 'useSmall', text: t('use_small') }));
    } else if (roman && NATIVE_OK.small[L]) {
      n.appendChild(EDU.el('span', { text: t('note_roman', { lang: langName(L) }) + ' ' }));
      n.appendChild(EDU.el('button', { type: 'button', class: 'btn btn-sm', id: 'useSmall', text: t('use_small') }));
    } else if (roman) {
      n.appendChild(EDU.el('span', { text: t('note_roman_all', { lang: langName(L) }) + ' ' + t('weak_tip', { lang: langName(L) }) + ' ' }));
      n.appendChild(EDU.el('button', { type: 'button', class: 'btn btn-sm', id: 'useTranslate', text: t('mode_translate') }));
    } else if (S.model === 'small') {
      n.textContent = t(LOW_MEM ? 'note_small_mem' : 'note_small_slow');
    }
    show(n, !!n.firstChild);
    var m = modelDef(S.model);
    $('#firstNote').textContent = cached[m.id] ? t('ready_offline') : t('first_note', { n: mbOf(m.bytes) + (cached.engine ? 0 : ENGINE_MB) });
  }

  /* ---------------------------------------------------------------- downloaded models (Cache API) */
  function fileUrl(m, f) { return 'https://huggingface.co/' + m.repo + '/resolve/main/onnx/' + f + '.onnx'; }
  function refreshCached() {
    if (!window.caches || !caches.open) return Promise.resolve();
    return caches.open('transformers-cache').then(function (c) {
      return Promise.all(MODELS.map(function (m) {
        return Promise.all(m.files.map(function (f) { return c.match(fileUrl(m, f)); })).then(function (rs) { cached[m.id] = rs.every(Boolean); });
      })).then(function () { return c.keys(); }).then(function (keys) {
        cached.engine = keys.some(function (k) { return /onnxruntime-web.*\.wasm/.test(k.url); });
      });
    }).catch(function () { /* file:// or private mode: no cache API */ }).then(function () { renderModels(); renderScriptNote(); renderStorage(); });
  }
  function renderStorage() {
    var mb = 0;
    MODELS.forEach(function (m) { if (cached[m.id]) mb += mbOf(m.bytes); });
    if (cached.engine) mb += ENGINE_MB;
    $('#storageText').textContent = mb ? t('storage_used', { n: mb }) : t('storage_none');
    show($('#storageClear'), mb > 0);
  }

  /* ---------------------------------------------------------------- status + errors */
  function setStatus(key, vars, frac, sub) {
    lastStatus = { key: key, vars: vars || {}, frac: frac, sub: sub || null };
    renderStatus();
  }
  function renderStatus() {
    var s = lastStatus;
    show($('#statusBox'), !!s);
    if (!s) return;
    $('#stText').textContent = t(s.key, s.vars);
    var bar = $('#stBar'), wrap = $('#stBarWrap');
    if (s.frac == null) { bar.className = 'vt-indet'; bar.style.width = '100%'; wrap.removeAttribute('aria-valuenow'); }
    else { bar.className = ''; var p = Math.round(Math.max(0, Math.min(1, s.frac)) * 100); bar.style.width = p + '%'; wrap.setAttribute('aria-valuenow', String(p)); }
    $('#stSub').textContent = s.sub ? t(s.sub.key, s.sub.vars) : '';
  }
  function showError(key, vars) {
    lastError = { key: key, vars: vars || {}, offline: navigator.onLine === false };
    renderError();
  }
  function renderError() {
    show($('#errBox'), !!lastError);
    if (!lastError) return;
    $('#errText').textContent = t(lastError.key, lastError.vars) + (lastError.offline ? ' ' + t('err_offline') : '');
  }
  function classify(msg) {
    msg = String(msg || '');
    if (/\b429\b|rate.?limit|Too Many/i.test(msg)) return 'err_busy';
    if (/fetch|network|Failed to load|load file|ERR_|Load failed|import|CORS|\b40[34]\b|\b50\d\b/i.test(msg) || navigator.onLine === false) return 'err_download';
    if (/memory|OOM|allocat|Aborted|RangeError|out of bounds/i.test(msg)) return 'err_memory';
    return 'err_engine';
  }

  /* ---------------------------------------------------------------- worker */
  var W = null, wLoaded = '', wLoad = null, wPend = {}, wSeq = 0, dlCb = null;
  function worker() {
    if (W) return W;
    var url = URL.createObjectURL(new Blob(['(' + window.VTT_WORKER.toString() + ')()'], { type: 'text/javascript' }));
    W = new Worker(url);
    W.onmessage = function (e) {
      var m = e.data || {};
      if (m.type === 'dl') { if (dlCb) dlCb(m.loaded); return; }
      if (m.type === 'ready' || (m.type === 'error' && m.stage === 'load')) {
        var l = wLoad; wLoad = null;
        if (l) { if (m.type === 'ready') l.resolve(m); else l.reject(new Error(m.msg)); }
        return;
      }
      var p = wPend[m.id]; if (!p) return;
      delete wPend[m.id];
      if (m.type === 'error') p.reject(new Error(m.msg)); else p.resolve(m);
    };
    W.onerror = function (e) {
      if (e && e.preventDefault) e.preventDefault();
      killWorker(new Error('worker: ' + ((e && e.message) || 'crashed')));
    };
    return W;
  }
  function killWorker(err) {
    if (W) { try { W.terminate(); } catch (e) { /* ignore */ } }
    W = null; wLoaded = '';
    var e = err || { cancelled: true };
    if (wLoad) { wLoad.reject(e); wLoad = null; }
    Object.keys(wPend).forEach(function (k) { wPend[k].reject(e); });
    wPend = {};
  }
  function loadModel(m, onDl) {
    var key = m.repo + '|wasm';
    if (W && wLoaded === key) return Promise.resolve();
    /* Another model is loaded: start a fresh worker, because the engine's memory never shrinks and two models
       in one worker can use gigabytes (too much for a phone). The library itself comes from the browser cache. */
    if (W && wLoaded) killWorker();
    return new Promise(function (resolve, reject) {
      var w;
      try { w = worker(); } catch (e) { reject(new Error('worker: ' + e.message)); return; }
      wLoad = { resolve: function () { wLoaded = key; dlCb = null; resolve(); }, reject: function (e) { dlCb = null; reject(e); } };
      dlCb = onDl;
      w.postMessage({ type: 'load', lib: LIB, model: m.repo, dtype: 'q8', device: 'wasm' });
    });
  }
  function call(type, data, transfer) {
    return new Promise(function (resolve, reject) {
      var id = ++wSeq;
      wPend[id] = { resolve: resolve, reject: reject };
      data.type = type; data.id = id;
      W.postMessage(data, transfer || []);
    });
  }

  /* ---------------------------------------------------------------- audio in */
  function decodeAudio(buf) {
    var AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!AC) return Promise.reject(new Error('no-audio-api'));
    var ctx, rate = SR;
    try { ctx = new AC(1, SR, SR); } catch (e) { rate = 44100; ctx = new AC(1, rate, rate); }
    return new Promise(function (resolve, reject) {
      var p = ctx.decodeAudioData(buf, resolve, reject);
      if (p && p.then) p.then(resolve, reject);
    }).then(function (ab) {
      var n = ab.length, ch = ab.numberOfChannels, out = new Float32Array(n);
      for (var c = 0; c < ch; c++) { var d = ab.getChannelData(c); for (var i = 0; i < n; i++) out[i] += d[i] / ch; }
      return ab.sampleRate === SR ? out : resample(out, ab.sampleRate);
    });
  }
  function resample(x, from) {
    var ratio = from / SR, n = Math.floor(x.length / ratio), out = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var a = Math.floor(i * ratio), b = Math.min(x.length, Math.floor((i + 1) * ratio)), s = 0;
      for (var j = a; j < b; j++) s += x[j];
      out[i] = b > a ? s / (b - a) : x[a] || 0;
    }
    return out;
  }
  function setAudio(name, blob, url) {
    clearFileErr();
    if (busy) return;
    if (blob.size > MAX_FILE) { fileErr('err_too_big', { n: mbOf(MAX_FILE) }); return; }
    if (blob.size < 100) { fileErr('err_decode'); return; }
    setStatus('st_reading', {}, null);
    show($('#errBox'), false); lastError = null;
    var readBuf = blob.arrayBuffer ? blob.arrayBuffer() : new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = rej; fr.readAsArrayBuffer(blob); });
    return readBuf.then(decodeAudio).then(function (pcm) {
      var cut = false;
      if (pcm.length > MAX_SEC * SR) { pcm = pcm.slice(0, MAX_SEC * SR); cut = true; }
      if (pcm.length < SR * 0.3) throw new Error('too-short');
      if (audio && audio.url && audio.url.indexOf('blob:') === 0) URL.revokeObjectURL(audio.url);
      audio = { name: name, pcm: pcm, dur: pcm.length / SR, url: url || URL.createObjectURL(blob), cut: cut };
      lastStatus = null; renderStatus();
      renderAudio();
      return true;
    }).catch(function (e) {
      lastStatus = null; renderStatus();
      fileErr(/too-short/.test(e && e.message) ? 'err_short' : 'err_decode');
      return false;
    });
  }
  function fileErr(key, vars) { var b = $('#fileErr'); b.textContent = t(key, vars); b.dataset.key = key; b.dataset.vars = JSON.stringify(vars || {}); show(b, true); }
  function clearFileErr() { var b = $('#fileErr'); b.dataset.key = ''; show(b, false); }
  function renderAudio() {
    show($('#fileBox'), !!audio);
    $('#runBtn').disabled = !audio || busy;
    if (!audio) return;
    $('#fileName').textContent = audio.name;
    $('#fileDur').textContent = durText(audio.dur);
    var pl = $('#player');
    if (pl.getAttribute('src') !== audio.url) pl.src = audio.url;
    var note = $('#fileNote');
    note.textContent = audio.cut ? t('note_cut', { n: 30 }) : '';
    show(note, audio.cut);
  }
  function pickFile() { var i = $('#fileInput'); i.value = ''; i.click(); }
  function useFile(f) { if (f) setAudio(f.name || 'audio', f); }
  function useSample(code) {
    var smp = window.VTT_SAMPLES && window.VTT_SAMPLES[code];
    if (!smp || busy) return;
    var bin = atob(smp.data), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    S.lang = smp.lang; autoModel(); saveS(); renderLangs(); renderModels(); renderScriptNote();
    setAudio(smp.name, new Blob([bytes], { type: 'audio/mpeg' }));
  }

  /* ---------------------------------------------------------------- recording */
  var rec = null;
  function startRec() {
    if (busy || rec) return;
    clearFileErr();
    var md = navigator.mediaDevices;
    if (!md || !md.getUserMedia || typeof window.MediaRecorder !== 'function') { fileErr('err_no_rec'); return; }
    md.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }).then(function (stream) {
      var types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'], type = '';
      for (var i = 0; i < types.length; i++) { try { if (MediaRecorder.isTypeSupported(types[i])) { type = types[i]; break; } } catch (e) { /* ignore */ } }
      var mr;
      try { mr = type ? new MediaRecorder(stream, { mimeType: type }) : new MediaRecorder(stream); } catch (e) { mr = new MediaRecorder(stream); }
      rec = { mr: mr, stream: stream, chunks: [], t0: Date.now(), cancel: false, timer: 0, ac: null, an: null };
      mr.ondataavailable = function (e) { if (e.data && e.data.size) rec.chunks.push(e.data); };
      mr.onstop = function () {
        var r = rec; rec = null;
        stopRecUi(r);
        if (r.cancel || !r.chunks.length) return;
        var mime = (r.chunks[0] && r.chunks[0].type) || type || 'audio/webm';
        var ext = /mp4/.test(mime) ? 'm4a' : /ogg/.test(mime) ? 'ogg' : 'webm';
        var d = new Date(), p2 = function (n) { return (n < 10 ? '0' : '') + n; };
        setAudio('recording-' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + '-' + p2(d.getHours()) + p2(d.getMinutes()) + '.' + ext, new Blob(r.chunks, { type: mime }));
      };
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        rec.ac = new AC(); rec.an = rec.ac.createAnalyser(); rec.an.fftSize = 512;
        rec.ac.createMediaStreamSource(stream).connect(rec.an);
      } catch (e) { rec.an = null; }
      mr.start(1000);
      show($('#recBox'), true); $('#recBtn').disabled = true;
      var buf = rec.an ? new Float32Array(rec.an.fftSize) : null;
      rec.timer = setInterval(function () {
        if (!rec) return;
        var sec = (Date.now() - rec.t0) / 1000;
        $('#recTime').textContent = fmtClock(sec);
        if (rec.an) { rec.an.getFloatTimeDomainData(buf); var m = 0; for (var i = 0; i < buf.length; i++) m = Math.max(m, Math.abs(buf[i])); $('#recLvl').style.width = Math.min(100, Math.round(m * 140)) + '%'; }
        if (sec >= MAX_SEC) stopRec(false);
      }, 120);
      $('#recStop').focus();
    }, function () { fileErr('err_mic'); });
  }
  function stopRec(cancel) {
    if (!rec) return;
    rec.cancel = !!cancel;
    try { if (rec.mr.state !== 'inactive') rec.mr.stop(); else rec.mr.onstop(); } catch (e) { var r = rec; rec = null; stopRecUi(r); }
  }
  function stopRecUi(r) {
    if (r) {
      clearInterval(r.timer);
      try { r.stream.getTracks().forEach(function (tr) { tr.stop(); }); } catch (e) { /* ignore */ }
      try { if (r.ac) r.ac.close(); } catch (e) { /* ignore */ }
    }
    show($('#recBox'), false); $('#recBtn').disabled = busy;
    $('#recTime').textContent = '0:00'; $('#recLvl').style.width = '0';
  }

  /* ---------------------------------------------------------------- cutting the audio into pieces */
  function plan(pcm, maxLen) {
    var F = 320, nF = Math.floor(pcm.length / F), rms = new Float32Array(nF), i, j;
    for (i = 0; i < nF; i++) { var s = 0; for (j = i * F; j < (i + 1) * F; j++) s += pcm[j] * pcm[j]; rms[i] = Math.sqrt(s / F); }
    var sorted = Array.prototype.slice.call(rms).sort(function (a, b) { return a - b; });
    var floor = sorted[Math.floor(sorted.length * 0.1)] || 0;
    /* "Loud" = 3x the quiet floor, but never above 0.02: with steady music or noise under the voice the floor is
       high, and a higher bar would skip real speech. Only truly quiet pieces are skipped. */
    var thr = Math.min(0.02, Math.max(0.008, floor * 3));
    var segs = [], start = 0, total = pcm.length, maxS = maxLen * SR, minS = Math.round(maxLen * 0.55) * SR;
    while (start < total) {
      var end;
      if (total - start <= maxS) end = total;
      else {
        var a = Math.floor((start + minS) / F), b = Math.floor((start + maxS) / F), best = b, bestV = Infinity;
        for (i = a; i < b; i++) {
          var v = 0; for (j = Math.max(0, i - 5); j < Math.min(nF, i + 5); j++) v += rms[j];
          if (v < bestV) { bestV = v; best = i; }
        }
        end = best * F;
      }
      var loud = 0;
      for (i = Math.floor(start / F); i < Math.floor(end / F); i++) if (rms[i] > thr) loud++;
      segs.push({ a: start, b: end, speech: loud * F / SR >= 0.25 });
      start = end;
    }
    return segs;
  }

  /* ---------------------------------------------------------------- text clean-up */
  function collapseRepeats(text) {
    var w = String(text).split(/\s+/).filter(Boolean);
    function same(i, j, n) { for (var k = 0; k < n; k++) if (w[i + k] !== w[j + k]) return false; return true; }
    for (var n = 1; n <= 6; n++) {
      var out = [], i = 0;
      while (i < w.length) {
        var reps = 1;
        while (i + (reps + 1) * n <= w.length && same(i, i + reps * n, n)) reps++;
        if (reps > 3) { for (var c = 0; c < 2; c++) for (var k = 0; k < n; k++) out.push(w[i + k]); i += reps * n; }
        else { out.push(w[i]); i++; }
      }
      w = out;
    }
    return w.join(' ').replace(/(.{1,12}?)\1{7,}/g, '$1$1$1');   // "ववववव…" loops inside one word
  }
  /* Whisper sometimes writes Telugu or Malayalam in CAPITAL English letters: make it Sentence case. */
  function fixCaps(text) {
    var letters = text.match(/[A-Za-z]/g) || [], caps = text.match(/[A-Z]/g) || [];
    if (letters.length < 12 || caps.length / letters.length < 0.7) return text;
    return text.toLowerCase().replace(/(^|[.!?]\s+)([a-z])/g, function (m, a, b) { return a + b.toUpperCase(); });
  }
  function degenerate(text) {
    var s = text.replace(/\s+/g, '');
    if (s.length < 40) return false;
    if (/(.{1,12}?)\1{7,}/.test(s)) return true;
    var uniq = {}; text.split(/\s+/).forEach(function (x) { uniq[x] = 1; });
    var words = text.split(/\s+/).filter(Boolean).length;
    return words > 12 && Object.keys(uniq).length / words < 0.25;
  }

  /* ---------------------------------------------------------------- run */
  function langOfDetect(scores) {
    var best = 'en', bv = -1;
    for (var c in scores) if (scores[c] > bv) { bv = scores[c]; best = c; }
    if (best === 'ur' || best === 'hi') best = EDU.lang === 'ur' ? 'ur' : 'hi';   // spoken Hindi and Urdu sound the same
    return best;
  }
  function run() {
    if (busy || !audio) return;
    busy = true; cancelReq = false; lastError = null; renderError();
    restored = false;
    var m = modelDef(S.model), task = S.mode, want = S.lang, t0 = Date.now();
    var res = { name: audio.name, dur: audio.dur, segs: [], lang: want === 'auto' ? null : want, model: m.id, task: task, ms: 0, at: Date.now(), roman: false, partial: true };
    R = res;
    renderBusy(); renderResult();
    setStatus(cached[m.id] ? 'st_loading' : 'st_engine', {}, null);
    function onDl(loaded) {
      if (cancelReq) return;
      setStatus('st_download', { model: t('model_' + m.id) }, Math.min(0.99, loaded / m.bytes), { key: 'mb_of', vars: { a: mbOf(loaded), b: mbOf(m.bytes) } });
    }
    loadModel(m, onDl).catch(function (e) {
      /* Hugging Face sometimes answers "429 Too Many Requests": wait a moment and try once more with a fresh worker. */
      if (cancelReq || classify(e && e.message) !== 'err_busy') throw e;
      killWorker();
      return new Promise(function (r) { setTimeout(r, 5000); }).then(function () {
        if (cancelReq) throw { cancelled: true };
        return loadModel(m, onDl);
      });
    }).then(function () {
      if (cancelReq) throw { cancelled: true };
      cached[m.id] = true; cached.engine = true; renderModels(); renderStorage();
      var langP;
      var pieces = null;
      if (want !== 'auto') langP = Promise.resolve(want);
      else {
        setStatus('st_detect', {}, null);
        pieces = plan(audio.pcm, 28);
        var first = pieces.filter(function (p) { return p.speech; })[0] || pieces[0];
        var clip = audio.pcm.slice(first.a, Math.min(first.b, first.a + 30 * SR));
        langP = call('detect', { audio: clip }, [clip.buffer]).then(function (r) { return langOfDetect(r.scores); });
      }
      return langP.then(function (lang) {
        res.lang = lang;
        var allow = allowFor(m.id, lang, task);
        res.roman = task === 'transcribe' && lang !== 'en' && allow[0] === 'latn';
        res.rough = task === 'transcribe' && lang === 'hi' && allow[0] === 'arab';
        var native = task === 'transcribe' && allow[0] !== 'latn' && lang !== 'en';
        pieces = plan(audio.pcm, native ? 20 : 28);
        var total = audio.dur, done = 0, computeMs = 0, idx = 0;
        renderResult();
        function step() {
          if (cancelReq) throw { cancelled: true };
          if (idx >= pieces.length) return null;
          var p = pieces[idx++], a = p.a / SR, b = p.b / SR;
          var eta = done > 0 ? (computeMs / 1000) / done * (total - done) : null;
          setStatus('st_working', { a: fmtClock(done), b: fmtClock(total) }, done / total, eta != null ? { key: 'time_left', vars: { t: fmtClock(eta) } } : { key: 'st_first_piece', vars: {} });
          if (!p.speech) { done = b; return Promise.resolve().then(step); }
          var clip = audio.pcm.slice(p.a, p.b), c0 = Date.now();
          var job = { audio: clip, language: lang, task: task, allow: allow };
          return call('run', job, [clip.buffer]).then(function (r) {
            if (degenerate(r.text)) {             // stuck repeating itself: try once more, with repeats blocked
              var clip2 = audio.pcm.slice(p.a, p.b);
              return call('run', { audio: clip2, language: lang, task: task, allow: allow, noRepeat: 3 }, [clip2.buffer]);
            }
            return r;
          }).then(function (r) {
            computeMs += Date.now() - c0;
            if (res.rough) r.chunks.forEach(function (c) { c.text = window.VTT_URDU_TO_HINDI(c.text); });
            addChunks(res, r.chunks, a, b);
            done = b;
            renderResult(true);
            return step();
          });
        }
        return step();
      });
    }).then(function () {
      res.partial = false;
      res.ms = Date.now() - t0;
      busy = false;
      setStatus('st_done', { t: fmtClock(res.ms / 1000) }, 1);
      finish();
      EDU.toast(t('st_done', { t: fmtClock(res.ms / 1000) }));
    }, function (e) {
      busy = false;
      if (e && e.cancelled) setStatus('st_stopped', {}, null);
      else {
        lastStatus = null; renderStatus();
        var k = classify(e && (e.message || e));
        if (k === 'err_engine' && (/worker/.test(String(e && e.message)) || !window.WebAssembly)) k = 'err_browser';
        showError(k, { msg: String((e && e.message) || e).slice(0, 120) });
        killWorker();          // a fresh worker next time, so Retry also works after a failed download
      }
      if (!res.segs.length) R = null;        // nothing written yet (failed or stopped): no empty "No speech" card
      finish();
    });
  }
  function addChunks(res, chunks, a, b) {
    (chunks || []).forEach(function (c) {
      var text = fixCaps(collapseRepeats(String(c.text || '').trim()));
      if (!text) return;
      var s = a + (typeof c.s === 'number' ? c.s : 0);
      var e = typeof c.e === 'number' ? a + c.e : b;
      s = Math.max(a, Math.min(s, b)); e = Math.max(s + 0.3, Math.min(e, b));
      var prev = res.segs[res.segs.length - 1];
      if (prev && prev.text === text && s - prev.e < 1) { prev.e = Math.max(prev.e, Math.round(e * 100) / 100); return; }   // the same line twice in a row
      if (prev && s < prev.e) { if (s > prev.s) prev.e = Math.round(s * 100) / 100; else s = prev.e; }   // subtitle cues must not overlap
      if (e <= s) e = s + 0.3;
      res.segs.push({ s: Math.round(s * 100) / 100, e: Math.round(e * 100) / 100, text: text });
    });
  }
  function stop() {
    if (!busy) return;
    cancelReq = true;
    killWorker();          // stops the work at once; the model stays in the browser cache
  }
  function finish() {
    renderBusy();
    if (R && R.segs.length) store.set('last', R); else store.remove('last');
    renderResult();
    refreshCached();
  }
  function renderBusy() {
    $('#runBtn').disabled = busy || !audio;
    show($('#stopBtn'), busy);
    ['#pickBtn', '#recBtn', '#sampleHi', '#sampleEn', '#clearFile', '#langSel'].forEach(function (s) { $(s).disabled = busy; });
    EDU.$$('#models button, #modeSeg button').forEach(function (b) { b.disabled = busy; });
    $('#drop').setAttribute('aria-disabled', String(busy));
  }

  /* ---------------------------------------------------------------- result */
  function plainText(r) {
    var out = '', prev = null;
    r.segs.forEach(function (s) {
      if (!/\S/.test(s.text)) return;          // a line the person deleted
      if (prev) out += s.s - prev.e > 1.5 ? '\n\n' : (/[\n]$/.test(out) ? '' : ' ');
      out += s.text; prev = s;
    });
    return out.trim();
  }
  function wrapLines(text) {
    var words = text.split(/\s+/), lines = [], cur = '';
    words.forEach(function (w) { if (cur && (cur + ' ' + w).length > 42) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; });
    if (cur) lines.push(cur);
    return lines.join('\n');
  }
  function cues(r) { return r.segs.filter(function (s) { return /\S/.test(s.text); }); }
  function toSrt(r) {
    return cues(r).map(function (s, i) { return (i + 1) + '\n' + stamp(s.s, ',') + ' --> ' + stamp(s.e, ',') + '\n' + wrapLines(s.text) + '\n'; }).join('\n');
  }
  function toVtt(r) {
    return 'WEBVTT\n\n' + cues(r).map(function (s) { return stamp(s.s, '.') + ' --> ' + stamp(s.e, '.') + '\n' + wrapLines(s.text) + '\n'; }).join('\n');
  }
  function wordCount(r) { return plainText(r).split(/\s+/).filter(Boolean).length; }
  var segsSig = '';
  function renderResult(append) {
    var card = $('#resCard');
    show(card, !!R);
    if (!R) return;
    show($('#restoredNote'), restored);
    EDU.$$('#viewSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.view === S.view)); });
    var list = $('#segs'), plain = $('#plain');
    show(list, S.view === 'times'); show(plain, S.view === 'plain');
    show($('#editHint'), S.view === 'times');
    // segments (keep rows that are already there, so typing is not interrupted)
    if (!append) { list.innerHTML = ''; segsSig = ''; }
    for (var i = list.children.length; i < R.segs.length; i++) {
      var s = R.segs[i];
      list.appendChild(EDU.el('div', { class: 'vt-seg', dataset: { i: String(i) } },
        EDU.el('button', { type: 'button', class: 'vt-ts', text: fmtClock(s.s), 'aria-label': t('play_from', { t: fmtClock(s.s) }) }),
        EDU.el('div', { class: 'vt-txt', contenteditable: busy ? 'false' : 'true', dir: 'auto', spellcheck: 'false', text: s.text })));
    }
    EDU.$$('.vt-txt', list).forEach(function (d) { d.setAttribute('contenteditable', busy ? 'false' : 'true'); });
    if (!R.segs.length) list.appendChild(EDU.el('p', { class: 'muted small', style: { margin: '8px' }, text: busy ? t('st_wait_text') : t('no_speech') }));
    else { var p = list.querySelector('p.muted'); if (p) p.remove(); }
    plain.textContent = plainText(R);
    // stats
    var st = $('#stats'); st.innerHTML = '';
    function badge(txt, cls) { st.appendChild(EDU.el('span', { class: 'badge' + (cls ? ' ' + cls : ''), text: txt })); }
    badge(t('words_n', { n: EDU.fmt(wordCount(R)) }), 'primary');
    badge(durText(R.dur || 0));
    if (R.lang) badge((R.task === 'translate' ? t('from_lang', { lang: langName(R.lang) }) : langName(R.lang)) + (R.roman ? ' · ' + t('roman_letters') : R.rough ? ' · ' + t('rough_spelling') : ''));
    badge(t('model_' + R.model));
    if (R.ms && !R.partial) badge(t('took', { t: fmtClock(R.ms / 1000) }), 'success');
    ['#copyBtn', '#dlTxt', '#dlSrt', '#dlVtt'].forEach(function (k) { $(k).disabled = !R.segs.length; });
    $('#clearText').disabled = busy;
  }
  function onEdit(e) {
    var d = e.target.closest('.vt-txt'); if (!d || !R) return;
    var i = +d.parentNode.dataset.i;
    if (!R.segs[i]) return;
    R.segs[i].text = d.textContent.replace(/\s+/g, ' ').trim();
    $('#plain').textContent = plainText(R);
    clearTimeout(onEdit.timer);
    onEdit.timer = setTimeout(function () { if (!busy) store.set('last', R); renderStats(); }, 600);
  }
  function renderStats() { if (R && !busy) { var cur = S.view; renderResult(true); S.view = cur; } }
  function highlight() {
    if (!R || !audio || audio.name !== R.name) return;
    var tm = $('#player').currentTime, rows = $('#segs').children;
    for (var i = 0; i < rows.length; i++) {
      var s = R.segs[i]; if (!s) continue;
      rows[i].classList.toggle('cur', tm >= s.s && tm < s.e && !$('#player').paused);
    }
  }

  /* ---------------------------------------------------------------- events */
  var drop = $('#drop');
  drop.addEventListener('click', function () { if (!busy) pickFile(); });
  drop.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && !busy) { e.preventDefault(); pickFile(); } });
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f && !busy) useFile(f); });
  $('#pickBtn').addEventListener('click', pickFile);
  $('#fileInput').addEventListener('change', function (e) { useFile(e.target.files && e.target.files[0]); });
  $('#sampleHi').addEventListener('click', function () { useSample('hi'); });
  $('#sampleEn').addEventListener('click', function () { useSample('en'); });
  $('#recBtn').addEventListener('click', startRec);
  $('#recStop').addEventListener('click', function () { stopRec(false); });
  $('#recCancel').addEventListener('click', function () { stopRec(true); });
  $('#clearFile').addEventListener('click', function () {
    if (busy) return;
    if (audio && audio.url && audio.url.indexOf('blob:') === 0) URL.revokeObjectURL(audio.url);
    audio = null; $('#player').removeAttribute('src'); renderAudio();
  });
  $('#langSel').addEventListener('change', function (e) { S.lang = e.target.value; autoModel(); saveS(); renderLangNote(); renderModels(); renderScriptNote(); });
  $('#modeSeg').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b || busy) return; S.mode = b.dataset.mode; saveS(); renderMode(); renderScriptNote(); });
  $('#models').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b || busy) return; S.model = b.dataset.model; S.picked = true; saveS(); renderModels(); renderScriptNote(); });
  $('#scriptNote').addEventListener('click', function (e) {
    if (busy) return;
    if (e.target.id === 'useSmall') { S.model = 'small'; S.picked = true; saveS(); renderModels(); renderScriptNote(); }
    if (e.target.id === 'useTranslate') { S.mode = 'translate'; saveS(); renderMode(); renderScriptNote(); }
  });
  $('#runBtn').addEventListener('click', run);
  $('#stopBtn').addEventListener('click', stop);
  $('#retryBtn').addEventListener('click', function () { lastError = null; renderError(); run(); });
  $('#viewSeg').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; S.view = b.dataset.view; saveS(); renderResult(true); });
  $('#segs').addEventListener('input', onEdit);
  $('#segs').addEventListener('click', function (e) {
    var b = e.target.closest('.vt-ts'); if (!b || !R) return;
    var s = R.segs[+b.parentNode.dataset.i], pl = $('#player');
    if (!s || !audio || audio.name !== R.name || !pl.getAttribute('src')) return;   // the text belongs to another file
    pl.currentTime = s.s; var p = pl.play(); if (p && p.catch) p.catch(function () { /* ignore */ });
  });
  $('#segs').addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.classList.contains('vt-txt')) { e.preventDefault(); e.target.blur(); } });
  $('#player').addEventListener('timeupdate', highlight);
  $('#player').addEventListener('pause', highlight);
  $('#copyBtn').addEventListener('click', function () { if (R) EDU.copy(plainText(R)); });
  $('#dlTxt').addEventListener('click', function () { if (R) EDU.download(baseName(R.name) + '.txt', plainText(R) + '\n', 'text/plain'); });
  $('#dlSrt').addEventListener('click', function () { if (R) EDU.download(baseName(R.name) + '.srt', toSrt(R), 'application/x-subrip'); });
  $('#dlVtt').addEventListener('click', function () { if (R) EDU.download(baseName(R.name) + '.vtt', toVtt(R), 'text/vtt'); });
  $('#clearText').addEventListener('click', function () {
    if (busy || !confirm(t('confirm_clear'))) return;
    R = null; store.remove('last'); lastStatus = null; renderStatus(); renderResult();
  });
  $('#storageClear').addEventListener('click', function () {
    if (busy || !confirm(t('confirm_storage'))) return;
    killWorker();
    var p = window.caches && caches.keys ? caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return /transformers/.test(k); }).map(function (k) { return caches.delete(k); })); }) : Promise.resolve();
    p.catch(function () { /* ignore */ }).then(function () { cached = {}; refreshCached(); EDU.toast(t('storage_cleared')); });
  });
  $('#resetAll').addEventListener('click', function () {
    if (busy || !confirm(t('confirm_reset'))) return;
    store.remove('settings'); store.remove('last');
    S = {}; R = null; restored = false;
    S.lang = WLANGS.indexOf(EDU.lang) >= 0 && EDU.lang !== 'en' ? EDU.lang : 'auto'; S.mode = 'transcribe'; S.picked = false; S.model = recModel(S.lang); S.view = 'times';
    lastStatus = null; lastError = null;
    renderAll();
  });
  window.addEventListener('beforeunload', function (e) { if (busy) { e.preventDefault(); e.returnValue = ''; } });

  function renderAll() {
    renderLangs(); renderMode(); renderModels(); renderScriptNote(); renderAudio(); renderStatus(); renderError(); renderResult(); renderBusy(); renderStorage();
    var fe = $('#fileErr');
    if (fe.dataset.key) fe.textContent = t(fe.dataset.key, JSON.parse(fe.dataset.vars || '{}'));
  }
  EDU.onLang(renderAll);
  renderAll();
  refreshCached();
  $('#app').setAttribute('data-ready', '1');
})();
