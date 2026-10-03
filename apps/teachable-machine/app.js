/* Teach the Computer (Image AI) — a Teachable-Machine-style image classifier.
   MobileNet v2 (TF.js) turns each camera frame into 1,280 numbers (features);
   a K-nearest-neighbours classifier compares new frames with the saved examples.
   Everything runs in the browser; no picture ever leaves the device. */
(function () {
  'use strict';
  var SLUG = 'teachable-machine';
  var store = EDU.store(SLUG);
  var $ = EDU.$, t = EDU.t;

  var MIN = 2, MAX = 5, SIZE = 224, THUMB = 64, MAX_THUMBS = 24, TICK_MS = 100, MAX_UPLOAD = 300;
  var MODEL_ID = 'mobilenet_v2_050_224';
  var LIBS = [
    { test: function () { return !!window.tf; }, src: 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js' },
    { test: function () { return !!window.mobilenet; }, src: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js' },
    { test: function () { return !!window.knnClassifier; }, src: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/knn-classifier@1.2.6/dist/knn-classifier.min.js' }
  ];
  var PRESETS = [
    { icon: '👍', keys: ['n_thumbs_up', 'n_thumbs_down'] },
    { icon: '✊', keys: ['n_rock', 'n_paper', 'n_scissors', 'n_nothing'] },
    { icon: '😀', keys: ['n_happy', 'n_sad', 'n_surprised', 'n_nothing'] },
    { icon: '✏️', keys: ['n_pen', 'n_pencil', 'n_eraser', 'n_nothing'] },
    { icon: '♻️', keys: ['n_plastic', 'n_paper', 'n_metal', 'n_nothing'] }
  ];

  /* ---------------- state ---------------- */
  var classes = loadClasses();          // [{id, key, custom, color}]
  var counts = {};                      // class id -> number of examples
  var thumbs = {};                      // class id -> [jpeg data URLs], newest first
  var net = null, knn = null, embDim = 0;
  var modelState = 'loading', modelErr = '';
  var stream = null, camState = 'off', camMsgKey = '', multiCam = false;
  var facing = store.get('facing', 'user') === 'environment' ? 'environment' : 'user';
  var recId = null, recKey = null;
  var busy = false, frozen = false, loopTimer = null;
  var lastPred = null, smooth = {};
  var K = EDU.clamp(parseInt(store.get('k', 10), 10) || 10, 1, 20);
  var speakOn = !!store.get('speak', false);
  var spoken = '', stableId = '', stableSince = 0;

  var cap = document.createElement('canvas'); cap.width = cap.height = SIZE;
  var capCtx = cap.getContext('2d', { willReadFrequently: true });
  var thumbCanvas = document.createElement('canvas'); thumbCanvas.width = thumbCanvas.height = THUMB;

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ---------------- classes ---------------- */
  function uid() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function newClass(key, color) { return { id: uid(), key: key || null, custom: null, color: color }; }
  function defaultClasses() { return [newClass('n_thumbs_up', 0), newClass('n_thumbs_down', 1)]; }
  function validKey(k) { return typeof k === 'string' && /^n_/.test(k) && EDU.has(k) ? k : null; }
  function cleanName(s) { return typeof s === 'string' && s.trim() ? s.trim().slice(0, 40) : null; }

  function sanitize(list) {
    if (!Array.isArray(list) || list.length < MIN || list.length > MAX) return null;
    var used = {}, out = [];
    list.forEach(function (c) {
      if (!c || typeof c !== 'object') return;
      var id = typeof c.id === 'string' && /^[\w-]{1,40}$/.test(c.id) && !used[c.id] ? c.id : uid();
      used[id] = 1;
      out.push({ id: id, key: validKey(c.key), custom: cleanName(c.custom), color: c.color });
    });
    if (out.length < MIN) return null;
    var colors = {};
    out.forEach(function (c) { var n = parseInt(c.color, 10); c.color = (n >= 0 && n < MAX && !colors[n]) ? n : -1; if (c.color >= 0) colors[c.color] = 1; });
    out.forEach(function (c) { if (c.color < 0) { for (var i = 0; i < MAX; i++) if (!colors[i]) { c.color = i; colors[i] = 1; break; } } });
    return out;
  }
  function loadClasses() { return sanitize(store.get('classes', null)) || defaultClasses(); }
  function saveClasses() { store.set('classes', classes.map(function (c) { return { id: c.id, key: c.key, custom: c.custom, color: c.color }; })); }
  function freeColor() { for (var i = 0; i < MAX; i++) if (!classes.some(function (c) { return c.color === i; })) return i; return 0; }
  function colorOf(c) { return 'var(--c' + (c.color + 1) + ')'; }
  function indexOf(id) { for (var i = 0; i < classes.length; i++) if (classes[i].id === id) return i; return -1; }
  function byId(id) { var i = indexOf(id); return i < 0 ? null : classes[i]; }
  function nameOf(c) {
    if (!c) return '';
    return c.custom || (c.key ? t(c.key) : t('class_n', { n: EDU.fmt(indexOf(c.id) + 1) }));
  }
  function totalExamples() { return classes.reduce(function (s, c) { return s + (counts[c.id] || 0); }, 0); }
  function trainedCount() { return classes.filter(function (c) { return (counts[c.id] || 0) > 0; }).length; }

  /* ---------------- model loading ---------------- */
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src; s.async = false;
      s.onload = function () { resolve(); };
      s.onerror = function () { s.remove(); reject(new Error('could not load ' + src)); };
      document.head.appendChild(s);
    });
  }
  function loadLibs() {
    return LIBS.reduce(function (p, lib) {
      return p.then(function () { return lib.test() ? null : loadScript(lib.src); });
    }, Promise.resolve());
  }
  function initModel() {
    modelState = 'loading'; modelErr = '';
    renderModelState(); renderPrediction();
    loadLibs().then(function () {
      if (!window.tf || !window.mobilenet || !window.knnClassifier) throw new Error('libraries missing');
      return window.mobilenet.load({ version: 2, alpha: 0.5 });
    }).then(function (m) {
      net = m;
      if (!knn) knn = window.knnClassifier.create();
      capCtx.fillStyle = '#808080'; capCtx.fillRect(0, 0, SIZE, SIZE);
      var e = net.infer(cap, true);
      embDim = e.shape[e.shape.length - 1];
      e.dispose();
      modelState = 'ready';
      renderModelState(); renderPrediction(); drawFp(null);
      startLoop();
    }).catch(function (err) {
      console.warn('[' + SLUG + '] AI model failed to load:', err && err.message);
      modelState = 'error';
      modelErr = navigator.onLine === false ? 'offline' : 'error';
      renderModelState(); renderPrediction();
    });
  }

  function renderModelState() {
    var box = $('#modelState');
    box.setAttribute('data-state', modelState);
    box.className = 'callout' + (modelState === 'ready' ? ' success' : modelState === 'error' ? ' danger' : '');
    $('#msSpin').hidden = modelState !== 'loading';
    $('#msRetry').hidden = modelState !== 'error';
    $('#msText').textContent = t(modelState === 'ready' ? 'ms_ready' : modelState === 'error' ? (modelErr === 'offline' ? 'ms_offline' : 'ms_error') : 'ms_loading');
  }

  /* ---------------- capture helpers ---------------- */
  function drawSquare(src, w, h) {
    var s = Math.min(w, h);
    capCtx.drawImage(src, (w - s) / 2, (h - s) / 2, s, s, 0, 0, SIZE, SIZE);
  }
  function makeThumb(mirror) {
    var c = thumbCanvas.getContext('2d');
    c.save();
    if (mirror) { c.translate(THUMB, 0); c.scale(-1, 1); }
    c.drawImage(cap, 0, 0, THUMB, THUMB);
    c.restore();
    return thumbCanvas.toDataURL('image/jpeg', 0.7);
  }
  /* turn whatever is on the capture canvas into features and store them as an example */
  function addFromCap(id, mirror) {
    var emb = net.infer(cap, true);
    try { knn.addExample(emb, id); } finally { emb.dispose(); }
    counts[id] = (counts[id] || 0) + 1;
    var list = thumbs[id] || (thumbs[id] = []);
    var url = makeThumb(mirror);
    list.unshift(url);
    if (list.length > MAX_THUMBS) list.length = MAX_THUMBS;
    return url;
  }
  function videoReady() {
    var v = $('#video');
    return camState === 'on' && v.readyState >= 2 && v.videoWidth > 0;
  }

  /* ---------------- live loop: record or predict ~10 times a second ---------------- */
  function startLoop() { if (!loopTimer) tick(); }
  function tick() {
    loopTimer = setTimeout(tick, TICK_MS);
    if (busy || !net || document.hidden || !videoReady()) return;
    var v = $('#video');
    busy = true;
    try {
      drawSquare(v, v.videoWidth, v.videoHeight);
      if (recId) {
        var url = addFromCap(recId, facing === 'user');
        updateClassCard(recId, url);
        busy = false;
        return;
      }
      if (frozen) { busy = false; return; }
      predictCap().then(function () { busy = false; }, function (e) { busy = false; console.warn(e); });
    } catch (e) { busy = false; console.warn(e); }
  }

  function predictCap() {
    if (!net || !knn || trainedCount() < 2 || !knn.getNumExamples()) { lastPred = null; renderPrediction(); return Promise.resolve(null); }
    var emb = net.infer(cap, true);
    var wantFp = $('#insideBox').open;
    return Promise.all([knn.predictClass(emb, K), wantFp ? emb.data() : Promise.resolve(null)]).then(function (r) {
      emb.dispose();
      lastPred = r[0];
      if (r[1]) drawFp(r[1]);
      updatePrediction();
      return lastPred;
    }, function (e) { emb.dispose(); throw e; });
  }

  function notReady() { EDU.toast(t(modelState === 'error' ? (modelErr === 'offline' ? 'ms_offline' : 'ms_error') : 'model_wait')); }

  /* ---------------- recording ---------------- */
  function startRec(id) {
    if (recId) return;
    if (!net) { notReady(); return; }
    if (!videoReady()) { EDU.toast(t('need_camera_rec')); return; }
    if (indexOf(id) < 0) return;
    recId = id; frozen = false;
    $('#testPrev').hidden = true;
    try {   // capture one frame right away so even a quick tap adds an example
      var v = $('#video');
      drawSquare(v, v.videoWidth, v.videoHeight);
      updateClassCard(id, addFromCap(id, facing === 'user'));
    } catch (e) { console.warn(e); }
    renderRecState();
  }
  function stopRec() {
    if (!recId) return;
    recId = null; recKey = null;
    renderRecState();
    lastPred = null; smooth = {};
    renderPrediction();
  }
  function renderRecState() {
    EDU.$$('.cls').forEach(function (card) {
      var on = card.getAttribute('data-id') === recId;
      card.classList.toggle('rec', on);
      var b = $('.hold-btn', card);
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      $('.hold-txt', b).textContent = on ? t('recording') + '…' : t('hold_record');
    });
    $('#recDot').hidden = !recId;
  }

  /* ---------------- uploads ---------------- */
  function pickImages(multiple) {
    return new Promise(function (resolve) {
      var inp = EDU.el('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });
      inp.multiple = !!multiple;
      inp.addEventListener('change', function () { resolve(Array.prototype.slice.call(inp.files || [])); inp.remove(); });
      document.body.appendChild(inp);
      inp.click();
    });
  }
  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      if (!file || (file.type && !/^image\//.test(file.type))) { reject(new Error('not an image')); return; }
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () { resolve({ img: img, url: url }); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('bad image')); };
      img.src = url;
    });
  }
  function drawImageFile(o) {
    var w = o.img.naturalWidth || o.img.width, h = o.img.naturalHeight || o.img.height;
    if (!w || !h) throw new Error('empty image');
    capCtx.fillStyle = '#fff'; capCtx.fillRect(0, 0, SIZE, SIZE);
    drawSquare(o.img, w, h);
  }
  function uploadTo(id) {
    if (!net) { notReady(); return; }
    pickImages(true).then(function (files) {
      files = files.slice(0, MAX_UPLOAD);
      if (!files.length) return;
      var added = 0, failed = 0, i = 0;
      (function next() {
        if (i >= files.length || indexOf(id) < 0) {
          if (added) EDU.toast(t('added_n', { n: EDU.fmt(added), name: nameOf(byId(id)) }));
          if (failed) EDU.toast(t('img_failed', { n: EDU.fmt(failed) }));
          lastPred = null; renderPrediction();
          return;
        }
        var f = files[i++];
        loadImage(f).then(function (o) {
          try { drawImageFile(o); updateClassCard(id, addFromCap(id, false)); added++; } catch (e) { failed++; }
          URL.revokeObjectURL(o.url);
        }, function () { failed++; }).then(function () { setTimeout(next, 0); });
      })();
    });
  }
  function testWithPhoto() {
    if (!net) { notReady(); return; }
    if (trainedCount() < 2) { EDU.toast(t('need_two')); return; }
    pickImages(false).then(function (files) {
      if (!files[0]) return;
      loadImage(files[0]).then(function (o) {
        try { drawImageFile(o); } catch (e) { URL.revokeObjectURL(o.url); EDU.toast(t('img_failed', { n: EDU.fmt(1) })); return; }
        frozen = true; smooth = {};
        var img = $('#testImg');
        if (img.src && img.src.indexOf('blob:') === 0) URL.revokeObjectURL(img.src);
        img.src = o.url;
        $('#testPrev').hidden = false;
        busy = true;
        predictCap().then(function () { busy = false; }, function () { busy = false; });
      }, function () { EDU.toast(t('img_failed', { n: EDU.fmt(1) })); });
    });
  }
  function backToLive() {
    frozen = false; smooth = {}; lastPred = null;
    $('#testPrev').hidden = true;
    renderPrediction();
  }

  /* ---------------- camera ---------------- */
  function stopStream() {
    if (stream) stream.getTracks().forEach(function (tr) { try { tr.stop(); } catch (e) { } });
    stream = null;
    var v = $('#video'); v.srcObject = null;
  }
  function startCamera() {
    camMsgKey = '';
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { camMsgKey = 'cam_none'; renderCam(); return; }
    stopStream();
    camState = 'starting'; renderCam();
    navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } }, audio: false })
      .then(function (s) {
        stream = s;
        var v = $('#video');
        v.srcObject = s;
        var p = v.play(); if (p && p.catch) p.catch(function () { });
        camState = 'on'; store.set('cam', true);
        renderCam(); renderPrediction(); checkCameras();
      }).catch(function (err) {
        var n = err && err.name;
        camMsgKey = (n === 'NotAllowedError' || n === 'SecurityError' || n === 'PermissionDeniedError') ? 'cam_denied'
          : (n === 'NotFoundError' || n === 'DevicesNotFoundError' || n === 'OverconstrainedError' || n === 'NotSupportedError') ? 'cam_none' : 'cam_error';
        camState = 'off';
        renderCam(); renderPrediction();
      });
  }
  function stopCamera() {
    stopRec();
    stopStream();
    camState = 'off'; store.set('cam', false);
    lastPred = null;
    renderCam(); renderPrediction();
  }
  function checkCameras() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    navigator.mediaDevices.enumerateDevices().then(function (list) {
      multiCam = list.filter(function (d) { return d.kind === 'videoinput'; }).length > 1;
      renderCam();
    }).catch(function () { });
  }
  function renderCam() {
    var on = camState === 'on';
    var v = $('#video');
    v.hidden = !on;
    v.classList.toggle('mirror', facing === 'user');
    $('#camOff').hidden = on;
    $('#camOffMsg').textContent = t(camState === 'starting' ? 'cam_starting' : 'cam_off_msg');
    $('#camStart').disabled = camState === 'starting';
    $('#camStop').hidden = !on;
    $('#camFlip').hidden = !(on && multiCam);
    $('#camCard').classList.toggle('sticky', on);
    var msg = $('#camMsg');
    msg.hidden = !camMsgKey;
    msg.textContent = camMsgKey ? t(camMsgKey) : '';
    if (!on) $('#camLabel').hidden = true;
    setHeaderVar();
  }

  /* ---------------- rendering: classes ---------------- */
  function renderPresets() {
    var sel = $('#preset');
    sel.innerHTML = '';
    sel.appendChild(EDU.el('option', { value: '', text: t('preset_choose') }));
    PRESETS.forEach(function (p, i) {
      sel.appendChild(EDU.el('option', { value: String(i), text: p.icon + ' ' + p.keys.map(function (k) { return t(k); }).join(' / ') }));
    });
    sel.value = '';
    sel.setAttribute('aria-label', t('preset_label'));
  }

  function renderClasses() {
    var wrap = $('#classes');
    wrap.innerHTML = '';
    classes.forEach(function (c, i) {
      var n = counts[c.id] || 0;
      var input = EDU.el('input', { type: 'text', class: 'cls-name', maxlength: '40', 'aria-label': t('class_name_label', { n: EDU.fmt(i + 1) }), autocomplete: 'off', spellcheck: 'false' });
      input.value = nameOf(c);
      input.addEventListener('input', function () {
        c.custom = cleanName(input.value);
        saveClasses();
        renameEverywhere();
      });
      input.addEventListener('change', function () { if (!cleanName(input.value)) { c.custom = null; input.value = nameOf(c); saveClasses(); renameEverywhere(); } });
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') input.blur(); });

      var hold = EDU.el('button', { type: 'button', class: 'btn btn-primary hold hold-btn', 'aria-pressed': 'false' },
        EDU.el('span', { class: 'ico', 'aria-hidden': 'true', text: '●' }), EDU.el('span', { class: 'hold-txt', text: t('hold_record') }));
      bindHold(hold, c.id);

      var card = EDU.el('div', { class: 'cls', 'data-id': c.id },
        EDU.el('div', { class: 'cls-head' },
          EDU.el('span', { class: 'cls-dot', 'aria-hidden': 'true' }), input,
          EDU.el('span', { class: 'badge cls-count' + (n ? ' has' : ''), 'data-n': String(n), 'aria-live': 'polite', text: t('n_examples', { n: EDU.fmt(n) }) })),
        thumbStrip(c.id),
        EDU.el('div', { class: 'cls-actions' }, hold,
          EDU.el('button', { type: 'button', class: 'btn upl-btn', onclick: function () { uploadTo(c.id); } },
            EDU.el('span', { 'aria-hidden': 'true', text: '🖼️' }), EDU.el('span', { text: t('upload_imgs') }))),
        EDU.el('div', { class: 'cls-more' },
          EDU.el('button', { type: 'button', class: 'btn btn-sm btn-ghost clr-btn', text: '🧹 ' + t('clear_class'), onclick: function () { clearClass(c.id); } }),
          EDU.el('button', { type: 'button', class: 'btn btn-sm btn-ghost btn-danger del-btn', text: '✕ ' + t('remove_class'), disabled: classes.length <= MIN, onclick: function () { removeClass(c.id); } })));
      card.style.setProperty('--cc', colorOf(c));
      wrap.appendChild(card);
    });
    $('#addClass').disabled = classes.length >= MAX;
    renderRecState();
  }
  function thumbStrip(id) {
    var strip = EDU.el('div', { class: 'thumbs' });
    var list = thumbs[id] || [];
    if (!list.length) strip.appendChild(EDU.el('span', { class: 'empty', text: t('no_examples') }));
    list.forEach(function (u) { strip.appendChild(EDU.el('img', { src: u, alt: '' })); });
    return strip;
  }
  /* cheap update of one card while recording */
  function updateClassCard(id, newThumb) {
    var card = $('.cls[data-id="' + id + '"]');
    if (!card) return;
    var n = counts[id] || 0;
    var badge = $('.cls-count', card);
    badge.textContent = t('n_examples', { n: EDU.fmt(n) });
    badge.setAttribute('data-n', String(n));
    badge.classList.toggle('has', n > 0);
    var strip = $('.thumbs', card);
    if (!n) { card.replaceChild(thumbStrip(id), strip); return; }
    var empty = $('.empty', strip); if (empty) empty.remove();
    if (newThumb) {
      strip.insertBefore(EDU.el('img', { src: newThumb, alt: '' }), strip.firstChild);
      while (strip.children.length > MAX_THUMBS) strip.lastChild.remove();
      strip.scrollLeft = 0;
    }
  }
  function renameEverywhere() {
    EDU.$$('.bar-row').forEach(function (row) { var c = byId(row.getAttribute('data-id')); if (c) $('.bar-name', row).textContent = nameOf(c); });
    updatePrediction();
  }

  function bindHold(btn, id) {
    btn.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      try { btn.setPointerCapture(e.pointerId); } catch (x) { }
      startRec(id);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) { btn.addEventListener(ev, stopRec); });
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    btn.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) startRec(id); }
    });
    btn.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); stopRec(); } });
    btn.addEventListener('blur', stopRec);
  }

  function addClass() {
    if (classes.length >= MAX) { EDU.toast(t('max_classes', { n: EDU.fmt(MAX) })); return; }
    classes.push(newClass(null, freeColor()));
    saveClasses(); renderClasses(); renderPrediction();
  }
  function forgetExamples(id) {
    if ((counts[id] || 0) > 0 && knn) { try { knn.clearClass(id); } catch (e) { } }
    delete counts[id]; delete thumbs[id]; delete smooth[id];
  }
  function removeClass(id) {
    var c = byId(id); if (!c) return;
    if (classes.length <= MIN) { EDU.toast(t('min_classes', { n: EDU.fmt(MIN) })); return; }
    if ((counts[id] || 0) > 0 && !confirm(t('confirm_remove_class', { name: nameOf(c) }))) return;
    if (recId === id) stopRec();
    forgetExamples(id);
    classes.splice(indexOf(id), 1);
    lastPred = null;
    saveClasses(); renderClasses(); renderPrediction();
  }
  function clearClass(id) {
    var c = byId(id); if (!c || !(counts[id] || 0)) return;
    if (!confirm(t('confirm_clear_class', { name: nameOf(c) }))) return;
    if (recId === id) stopRec();
    forgetExamples(id);
    lastPred = null;
    updateClassCard(id); renderPrediction();
  }
  function clearAllExamples() {
    stopRec();
    if (knn) { try { knn.dispose(); } catch (e) { } knn = window.knnClassifier ? window.knnClassifier.create() : null; }
    counts = {}; thumbs = {}; smooth = {}; lastPred = null;
  }
  function applyPreset(i) {
    var p = PRESETS[i]; if (!p) return;
    if (totalExamples() > 0 && !confirm(t('confirm_preset'))) return;
    clearAllExamples();
    classes = p.keys.map(function (k, j) { return newClass(k, j); });
    saveClasses(); renderClasses(); renderPrediction();
  }
  function resetAll() {
    if (!confirm(t('confirm_reset'))) return;
    clearAllExamples();
    classes = defaultClasses();
    K = 10; store.set('k', K);
    frozen = false; $('#testPrev').hidden = true;
    saveClasses(); renderAll();
  }

  /* ---------------- rendering: prediction ---------------- */
  function idleKey() {
    if (modelState !== 'ready') return modelState === 'error' ? 'ms_error' : 'need_model';
    if (trainedCount() < 2) return 'need_two';
    if (!frozen && camState !== 'on') return 'show_cam';
    return '';
  }
  function renderPrediction() {
    var bars = $('#bars');
    bars.innerHTML = '';
    classes.forEach(function (c) {
      var row = EDU.el('div', { class: 'bar-row', 'data-id': c.id },
        EDU.el('span', { class: 'bar-name no-i18n', text: nameOf(c) }),
        EDU.el('span', { class: 'bar-pct', text: EDU.fmt(0) + '%' }),
        EDU.el('div', { class: 'bar-track', 'aria-hidden': 'true' }, EDU.el('div', { class: 'bar-fill' })));
      row.style.setProperty('--cc', colorOf(c));
      bars.appendChild(row);
    });
    $('#votesNote').textContent = t('votes_note', { k: EDU.fmt(K) });
    updatePrediction();
  }
  function updatePrediction() {
    var key = idleKey();
    var winBox = $('#winnerBox'), win = $('#winner'), sub = $('#winnerSub'), camLabel = $('#camLabel');
    if (key || !lastPred) {
      win.className = 'winner idle';
      win.textContent = t(key || 'need_model');
      if (!key) win.textContent = '…';
      win.removeAttribute('data-id');
      sub.textContent = '';
      $('#winnerCap').hidden = true;
      winBox.style.removeProperty('--cc');
      camLabel.hidden = true;
      EDU.$$('.bar-row').forEach(function (row) { $('.bar-fill', row).style.width = '0%'; $('.bar-pct', row).textContent = EDU.fmt(0) + '%'; });
      return;
    }
    var conf = lastPred.confidences || {};
    var best = null, bestP = -1;
    classes.forEach(function (c) {
      var raw = conf[c.id] || 0;
      var prev = smooth[c.id] === undefined ? raw : smooth[c.id];
      var s = frozen ? raw : prev * 0.5 + raw * 0.5;
      smooth[c.id] = s;
      if (s > bestP) { bestP = s; best = c; }
    });
    EDU.$$('.bar-row').forEach(function (row) {
      var p = smooth[row.getAttribute('data-id')] || 0;
      $('.bar-fill', row).style.width = (p * 100).toFixed(1) + '%';
      $('.bar-pct', row).textContent = EDU.fmt(Math.round(p * 100)) + '%';
    });
    var pct = EDU.fmt(Math.round(bestP * 100));
    $('#winnerCap').hidden = false;
    if (bestP < 0.5) {
      win.className = 'winner idle';
      win.textContent = t('not_sure');
      win.removeAttribute('data-id');
      winBox.style.removeProperty('--cc');
    } else {
      win.className = 'winner no-i18n';
      win.textContent = nameOf(best);
      win.setAttribute('data-id', best.id);
      winBox.style.setProperty('--cc', colorOf(best));
    }
    sub.textContent = t('sure_pct', { p: pct });
    if (camState === 'on' && !frozen && best) {
      camLabel.hidden = false;
      camLabel.style.setProperty('--cc', colorOf(best));
      $('#camLabelTxt').textContent = (bestP < 0.5 ? t('not_sure') : nameOf(best)) + ' · ' + pct + '%';
    } else camLabel.hidden = true;
    maybeSpeak(bestP >= 0.7 ? best : null);
  }
  function maybeSpeak(c) {
    if (!speakOn) return;
    var id = c ? c.id : '';
    var now = Date.now();
    if (id !== stableId) { stableId = id; stableSince = now; return; }
    if (!id || id === spoken || now - stableSince < 900) return;
    spoken = id;
    EDU.speak(nameOf(c)).then(function (ok) {
      if (!ok) { EDU.toast(t('no_voice')); speakOn = false; store.set('speak', false); $('#speakChk').checked = false; }
    });
  }

  /* ---------------- feature fingerprint ---------------- */
  var lastFp = null;
  function drawFp(data) {
    if (data) lastFp = data;
    data = lastFp;
    var cv = $('#fp'), ctx = cv.getContext('2d');
    var n = data ? data.length : (embDim || 1280), cols = 64, rows = Math.ceil(n / cols), cell = 10;
    if (cv.height !== rows * cell) cv.height = rows * cell;
    ctx.fillStyle = EDU.css('--surface') || '#fff';
    ctx.fillRect(0, 0, cv.width, cv.height);
    var max = 0;
    if (data) for (var i = 0; i < n; i++) if (data[i] > max) max = data[i];
    ctx.fillStyle = EDU.css('--primary') || '#0b4f5c';
    for (var j = 0; j < n; j++) {
      var a = data && max > 0 ? Math.max(0, data[j]) / max : 0.06;
      ctx.globalAlpha = Math.max(0.06, Math.min(1, Math.sqrt(a)));
      ctx.fillRect((j % cols) * cell + 1, Math.floor(j / cols) * cell + 1, cell - 2, cell - 2);
    }
    ctx.globalAlpha = 1;
  }

  /* ---------------- save / open a model file ---------------- */
  function f32ToB64(f32) {
    var u8 = new Uint8Array(f32.buffer, f32.byteOffset, f32.byteLength), s = '', CH = 0x8000;
    for (var i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
    return btoa(s);
  }
  function b64ToF32(b64) {
    var s = atob(b64), u8 = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
    if (u8.length % 4) throw new Error('bad length');
    return new Float32Array(u8.buffer);
  }
  function saveModel() {
    if (!knn || !totalExamples()) { EDU.toast(t('nothing_to_save')); return; }
    var ds = knn.getClassifierDataset();
    var out = {
      app: SLUG, v: 1, model: MODEL_ID, dim: embDim, k: K, saved: new Date().toISOString(),
      classes: classes.map(function (c) {
        var n = counts[c.id] || 0;
        return { id: c.id, key: c.key, custom: c.custom, color: c.color, n: n,
          data: n && ds[c.id] ? f32ToB64(ds[c.id].dataSync()) : '', thumbs: (thumbs[c.id] || []).slice(0, 8) };
      })
    };
    var d = new Date(), stamp = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    EDU.download('image-ai-model-' + stamp + '.json', JSON.stringify(out), 'application/json');
  }
  function openModel() {
    if (!net) { notReady(); return; }
    EDU.pickFile('.json,application/json').then(function (file) {
      if (!file) return;
      return EDU.readText(file).then(function (txt) {
        var m = JSON.parse(txt);
        if (!m || m.app !== SLUG || m.model !== MODEL_ID || m.dim !== embDim) throw new Error('wrong file');
        var list = sanitize(m.classes);
        if (!list) throw new Error('bad classes');
        var tensors = {}, newCounts = {}, newThumbs = {};
        list.forEach(function (c, i) {
          var src = m.classes[i] || {}, n = parseInt(src.n, 10) || 0;
          if (n > 0) {
            var arr = b64ToF32(String(src.data || ''));
            if (arr.length !== n * embDim) throw new Error('bad data');
            tensors[c.id] = window.tf.tensor2d(arr, [n, embDim]);
            newCounts[c.id] = n;
          }
          newThumbs[c.id] = (Array.isArray(src.thumbs) ? src.thumbs : []).filter(function (u) { return typeof u === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(u); }).slice(0, MAX_THUMBS);
        });
        clearAllExamples();
        if (Object.keys(tensors).length) knn.setClassifierDataset(tensors);
        classes = list; counts = newCounts; thumbs = newThumbs;
        if (m.k) { K = EDU.clamp(parseInt(m.k, 10) || 10, 1, 20); store.set('k', K); }
        saveClasses(); renderAll();
        EDU.toast(t('model_opened', { n: EDU.fmt(totalExamples()) }));
      });
    }).catch(function (e) { console.warn(e); EDU.toast(t('bad_file')); });
  }

  /* ---------------- misc UI ---------------- */
  function renderK() {
    $('#kRange').value = String(K);
    $('#kLabel').textContent = t('k_label', { k: EDU.fmt(K) });
    $('#votesNote').textContent = t('votes_note', { k: EDU.fmt(K) });
  }
  function renderWorksheet() {
    var body = $('#wsRows');
    if (body.children.length) return;
    for (var i = 1; i <= 5; i++) body.appendChild(EDU.el('tr', {}, EDU.el('td', { text: EDU.fmt(i) }), EDU.el('td'), EDU.el('td'), EDU.el('td'), EDU.el('td')));
  }
  function setHeaderVar() {
    var top = $('.edu-top');
    if (top) document.documentElement.style.setProperty('--hdr', top.offsetHeight + 'px');
  }
  function renderAll() {
    renderModelState(); renderCam(); renderPresets(); renderClasses(); renderPrediction(); renderK(); renderWorksheet(); drawFp(null);
    $('#speakChk').checked = speakOn;
  }

  /* ---------------- events ---------------- */
  $('#msRetry').addEventListener('click', initModel);
  $('#camStart').addEventListener('click', startCamera);
  $('#camStop').addEventListener('click', stopCamera);
  $('#camFlip').addEventListener('click', function () { facing = facing === 'user' ? 'environment' : 'user'; store.set('facing', facing); startCamera(); });
  $('#fsBtn').addEventListener('click', function () { EDU.fullscreen($('#lab')); });
  $('#addClass').addEventListener('click', addClass);
  $('#preset').addEventListener('change', function (e) { var v = e.target.value; e.target.value = ''; if (v !== '') applyPreset(parseInt(v, 10)); });
  $('#testPhoto').addEventListener('click', testWithPhoto);
  $('#backLive').addEventListener('click', backToLive);
  $('#speakChk').addEventListener('change', function (e) { speakOn = e.target.checked; spoken = ''; store.set('speak', speakOn); if (!speakOn) EDU.stopSpeaking(); });
  $('#kRange').addEventListener('input', function (e) { K = EDU.clamp(parseInt(e.target.value, 10) || 10, 1, 20); store.set('k', K); renderK(); });
  $('#saveModel').addEventListener('click', saveModel);
  $('#openModel').addEventListener('click', openModel);
  $('#resetAll').addEventListener('click', resetAll);
  $('#insideBox').addEventListener('toggle', function () { drawFp(null); });

  var printState = null;
  function beforePrint() {
    if (printState) return;
    printState = { inside: $('#insideBox').open, ws: $('#wsBox').open };
    $('#insideBox').open = true; $('#wsBox').open = true;
  }
  function afterPrint() {
    document.body.classList.remove('print-ws');
    if (!printState) return;
    $('#insideBox').open = printState.inside; $('#wsBox').open = printState.ws;
    printState = null;
  }
  window.addEventListener('beforeprint', beforePrint);
  window.addEventListener('afterprint', afterPrint);
  $('#printWs').addEventListener('click', function () {
    document.body.classList.add('print-ws');
    beforePrint();
    window.print();
    setTimeout(afterPrint, 1000);
  });

  /* hold the number keys 1–5 to record into that class (smartboards / keyboards) */
  function typingTarget(el) { return el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)); }
  document.addEventListener('keydown', function (e) {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || typingTarget(e.target)) return;
    var d = parseInt(e.key, 10);
    if (d >= 1 && d <= classes.length) { recKey = e.key; startRec(classes[d - 1].id); }
  });
  document.addEventListener('keyup', function (e) { if (recKey && e.key === recKey) stopRec(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) stopRec(); });
  window.addEventListener('resize', setHeaderVar);
  window.addEventListener('pagehide', function () { stopStream(); });
  EDU.onTheme(function () { drawFp(null); });
  EDU.onLang(function () { renderAll(); setHeaderVar(); });

  renderAll();
  initModel();

  /* reopen the camera automatically if it was on last time and permission is already granted */
  if (store.get('cam', false) && navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: 'camera' }).then(function (p) { if (p.state === 'granted') startCamera(); }).catch(function () { });
  }
})();
