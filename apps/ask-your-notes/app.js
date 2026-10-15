/* Ask Your Notes (AI Search): load notes or a PDF, ask a question in any language, see the passages that answer it.
   - Keyword search (BM25, search.js) works at once, offline, with no download.
   - AI search uses the multilingual sentence-embedding model intfloat/multilingual-e5-small (MIT licence;
     ONNX q8 weights from Xenova/multilingual-e5-small on huggingface.co, about 135 MB with the tokenizer) through
     Transformers.js 4.3.0 from jsDelivr. It is downloaded only after the user agrees, then the browser keeps it.
     We run it on WASM: with these 8-bit weights WebGPU was slower in our tests (and its fp16 file is 235 MB).
   - Scoring: cosine similarity between the question and every passage; the best 10 are checked again sentence by
     sentence (score = the better of passage and best sentence), which also gives the highlighted best sentence.
   - Notes, questions and vectors never leave the device. Notes are kept in EDU.store (capped). */
(function () {
  'use strict';
  var SLUG = 'ask-your-notes';
  var t = EDU.t, $ = EDU.$, el = EDU.el;
  var store = EDU.store(SLUG);
  var C = window.APP_CONTENT, AYN = window.AYN;
  var CODES = ['en', 'hi', 'bn', 'mr', 'gu', 'pa', 'or', 'ta', 'te', 'kn', 'ml', 'ur'];

  var TF_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0';
  var PDF_LIB = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
  var PDF_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  var MODEL = {
    id: 'Xenova/multilingual-e5-small', name: 'multilingual-e5-small', by: 'intfloat (Microsoft Research)', lic: 'MIT',
    bytes: 135392016, dims: 384, q: 'query: ', p: 'passage: ', file: 'onnx/model_quantized.onnx',
    weak: 0.78                                   // e5 scores sit high (0.7–0.9); below this the notes probably don't answer it
  };
  var MB = Math.round(MODEL.bytes / 1e6);
  var MAX_CHARS = 300000, MAX_FILE_MB = 60, MAX_PDF_PAGES = 400, BATCH = 4, RERANK = 10, VIZ_N = 48;

  /* ------------------------------------------------------------------ state */
  var S = Object.assign({ mode: 'kw', k: 3, q: '', src: null }, store.get('state', {}));
  if (S.mode !== 'ai') S.mode = 'kw';
  if (S.k !== 5) S.k = 3;
  var notes = String(store.get('notes', '') || '').slice(0, MAX_CHARS);
  var firstVisit = store.get('state', null) === null;
  var passages = [], idx = null, lastRes = null, lastViz = null, searchSeq = 0, fileErr = null, aiErr = null;
  var vecs = new Map();                          // hash(prefixed text) → Float32Array
  var ai = { state: 'off', ext: null, T: null, ctl: null, cancelled: false, phase: null, got: 0, total: 0, n: 0, of: 0, cached: false };
  var pdf = { libP: null, worker: null };

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  function saveState() { store.set('state', { mode: S.mode, k: S.k, q: S.q, src: S.src }); }
  function show(node, on) { node.hidden = !on; }
  function fmt1(n) { return EDU.fmt(n, { maximumFractionDigits: 1 }); }
  function yieldUI() { return new Promise(function (r) { setTimeout(r, 0); }); }

  /* ------------------------------------------------------------------ samples */
  /* page marks are written in the notes' own language, so a sample stays the same text whatever the page language */
  function markFor(lang, n) { var s = window.APP_STRINGS[lang] || window.APP_STRINGS.en; return String(s.page_mark).replace('{n}', n); }
  function sampleText(lang) {
    var c = C[lang] || C.en;
    return c.pages.map(function (p, i) { return markFor(lang, i + 1) +'\n' + (i === 0 ? c.title + '\n\n' : '') + p; }).join('\n\n');
  }
  function fillSampleSelect() {
    var sel = $('#sampleLang'), cur = sel.value || (S.src && S.src.kind === 'sample' ? S.src.lang : EDU.lang);
    sel.innerHTML = '';
    CODES.forEach(function (c) { sel.appendChild(el('option', { value: c, text: EDU.langInfo(c).native })); });
    sel.value = CODES.indexOf(cur) >= 0 ? cur : 'en';
  }
  function loadSample(lang, auto) {
    notes = sampleText(lang);
    S.src = { kind: 'sample', lang: lang, auto: !!auto };
    $('#notes').value = notes;
    clearFileMsgs();
    notesChanged(true);
  }

  /* ------------------------------------------------------------------ notes → passages */
  function reindex() {
    passages = AYN.chunk(AYN.splitPages(notes), { max: 4000 });
    idx = AYN.buildIndex(passages);
    renderStats();
  }
  function renderStats() {
    var box = $('#stats');
    box.innerHTML = '';
    if (!notes.trim()) { box.appendChild(el('span', { class: 'small muted', text: t('notes_empty') })); return; }
    var pages = {}, np = 0;
    passages.forEach(function (p) { if (p.page != null && !pages[p.page]) { pages[p.page] = 1; np++; } });
    var words = (notes.match(/[\p{L}\p{N}][\p{L}\p{M}\p{N}]*/gu) || []).length;
    box.appendChild(el('span', { class: 'badge primary', text: t('n_passages', { n: EDU.fmt(passages.length) }) }));
    if (np) box.appendChild(el('span', { class: 'badge', text: t('n_pages', { n: EDU.fmt(np) }) }));
    box.appendChild(el('span', { class: 'badge', text: t('n_words', { n: EDU.fmt(words) }) }));
    if (notes.length >= MAX_CHARS) box.appendChild(el('span', { class: 'small muted', text: t('too_long', { n: EDU.fmt(MAX_CHARS) }) }));
  }
  var indexTimer = 0;
  function notesChanged(now) {
    clearTimeout(indexTimer);
    var go = function () {
      indexTimer = 0;
      reindex();
      store.set('notes', notes);
      saveState();
      renderTry();
      if (S.q.trim()) runSearch(false); else renderResults();
    };
    if (now) go(); else indexTimer = setTimeout(go, 400);
  }
  $('#notes').addEventListener('input', function () {
    var v = this.value;
    if (v.length > MAX_CHARS) { v = v.slice(0, MAX_CHARS); this.value = v; }
    notes = v;
    if (S.src) S.src.auto = false;
    /* the sample's suggested questions only make sense while the sample is still in the box */
    if (S.src && S.src.kind === 'sample' && notes.indexOf((C[S.src.lang] || C.en).title) < 0) { S.src = null; renderTry(); }
    notesChanged(false);
  });

  /* ------------------------------------------------------------------ files: .txt / .pdf */
  function clearFileMsgs() { fileErr = null; renderFileErr(); show($('#fileStatus'), false); }
  function renderFileErr() {
    show($('#fileErr'), !!fileErr);
    if (!fileErr) return;
    $('#fileErrText').textContent = t(fileErr.key, fileErr.vars || {}) + (fileErr.offline ? ' ' + t('ai_offline') : '');
    show($('#ocrLinkWrap'), fileErr.key === 'pdf_scanned');
  }
  function fileStage(key, vars, frac) {
    show($('#fileStatus'), true);
    $('#fileText').textContent = t(key, vars || {});
    var bar = $('#fileBar'), indet = frac == null;
    bar.classList.toggle('an-indet', indet);
    bar.style.width = (indet ? 100 : Math.round(EDU.clamp(frac, 0, 1) * 100)) + '%';
  }
  function setNotesFromFile(text, name) {
    text = String(text || '').replace(/\u0000/g, '');
    if (text.length > MAX_CHARS) { text = text.slice(0, MAX_CHARS); EDU.toast(t('too_long', { n: EDU.fmt(MAX_CHARS) })); }
    notes = text;
    $('#notes').value = notes;
    S.src = { kind: 'file', name: String(name || '').slice(0, 80) };
    notesChanged(true);
    EDU.toast(t('loaded_file', { name: S.src.name }));
  }
  function isPdf(f) { return f.type === 'application/pdf' || /\.pdf$/i.test(f.name || ''); }
  function isText(f) { return /^text\//.test(f.type || '') || /\.(txt|text|md|csv|tsv|srt|vtt)$/i.test(f.name || ''); }
  function handleFile(f) {
    if (!f) return;
    clearFileMsgs();
    if (f.size > MAX_FILE_MB * 1024 * 1024) { fileErr = { key: 'file_big', vars: { n: MAX_FILE_MB } }; return renderFileErr(); }
    if (isPdf(f)) return readPdf(f);
    if (!isText(f)) { fileErr = { key: 'file_bad' }; return renderFileErr(); }
    EDU.readText(f).then(function (txt) { setNotesFromFile(txt, f.name); }, function () { fileErr = { key: 'file_bad' }; renderFileErr(); });
  }
  $('#openBtn').addEventListener('click', function () { $('#fileInput').value = ''; $('#fileInput').click(); });
  $('#fileInput').addEventListener('change', function () { handleFile(this.files && this.files[0]); });
  var card = $('#notesCard');
  function hasFiles(e) { return e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0; }
  window.addEventListener('dragover', function (e) { if (hasFiles(e)) { e.preventDefault(); card.classList.add('over'); } });
  window.addEventListener('dragleave', function (e) { if (!e.relatedTarget) card.classList.remove('over'); });
  window.addEventListener('drop', function (e) {
    if (!hasFiles(e)) return;
    e.preventDefault(); card.classList.remove('over');
    handleFile(e.dataTransfer.files && e.dataTransfer.files[0]);
  });

  function loadScript(src, test) {
    return new Promise(function (resolve, reject) {
      if (test()) return resolve();
      var s = document.createElement('script');
      s.src = src; s.async = true; s.crossOrigin = 'anonymous';
      var timer = setTimeout(function () { s.remove(); reject(new Error('timeout')); }, 60000);
      s.onload = function () { clearTimeout(timer); test() ? resolve() : reject(new Error('not loaded')); };
      s.onerror = function () { clearTimeout(timer); s.remove(); reject(new Error('failed')); };
      document.head.appendChild(s);
    });
  }
  function ensurePdf() {
    if (!pdf.libP) {
      pdf.libP = loadScript(PDF_LIB, function () { return !!window.pdfjsLib; }).then(function () {
        var lib = window.pdfjsLib;
        lib.GlobalWorkerOptions.workerSrc = PDF_WORKER;
        /* a Blob worker that imports the CDN worker works on https and from a downloaded folder (file://) */
        try {
          var url = URL.createObjectURL(new Blob(["importScripts('" + PDF_WORKER + "');"], { type: 'application/javascript' }));
          pdf.worker = new lib.PDFWorker({ port: new Worker(url, { name: 'ayn-pdf' }) });
        } catch (e) { pdf.worker = null; }
        return lib;
      });
      pdf.libP.catch(function () { pdf.libP = null; });
    }
    return pdf.libP;
  }
  /* text items → lines; a big jump down the page starts a new paragraph */
  function pageText(tc) {
    var out = '', lastY = null, lastH = 0, lastEnd = null;
    tc.items.forEach(function (it) {
      if (typeof it.str !== 'string') return;
      var tr = it.transform || [1, 0, 0, 1, 0, 0], y = tr[5], x = tr[4], h = Math.abs(tr[3]) || it.height || 10;
      if (lastY !== null && Math.abs(y - lastY) > 0.6 * Math.max(h, lastH)) {
        out = out.replace(/[ \t]+$/, '');
        out += Math.abs(y - lastY) > 1.9 * Math.max(h, lastH) ? '\n\n' : '\n';
      } else if (lastEnd !== null && x - lastEnd > 0.12 * h && out && !/\s$/.test(out) && !/^\s/.test(it.str)) out += ' ';
      out += it.str;
      lastY = y; lastH = h; lastEnd = x + (it.width || 0);
    });
    return out.trim();
  }
  function readPdf(f) {
    fileStage('pdf_loading', null, null);
    var parts = [], total = 0, chars = 0;
    ensurePdf().then(function (lib) {
      return f.arrayBuffer().then(function (buf) {
        var opts = { data: new Uint8Array(buf), isEvalSupported: false };
        if (pdf.worker) opts.worker = pdf.worker;
        return lib.getDocument(opts).promise;
      }, function () { throw { key: 'pdf_error' }; });
    }, function () { throw { key: 'pdf_lib', offline: navigator.onLine === false }; }).then(function (doc) {
      total = Math.min(doc.numPages, MAX_PDF_PAGES);
      var chain = Promise.resolve();
      for (var n = 1; n <= total; n++) {
        (function (n) {
          chain = chain.then(function () {
            if (chars >= MAX_CHARS) return;
            fileStage('pdf_reading', { n: EDU.fmt(n), total: EDU.fmt(total) }, (n - 1) / total);
            return doc.getPage(n).then(function (pg) { return pg.getTextContent(); }).then(function (tc) {
              var txt = pageText(tc);
              chars += txt.length;
              if (txt) parts.push(markFor(EDU.lang, n) +'\n' + txt);
            }).then(yieldUI);
          });
        })(n);
      }
      return chain.then(function () { try { doc.destroy(); } catch (e) { } });
    }).then(function () {
      show($('#fileStatus'), false);
      var letters = (parts.join(' ').match(/\p{L}/gu) || []).length;
      if (letters < 20) { fileErr = { key: 'pdf_scanned' }; return renderFileErr(); }
      setNotesFromFile(parts.join('\n\n'), f.name);
    }).catch(function (e) {
      show($('#fileStatus'), false);
      if (e && e.key) fileErr = e;
      else if (e && (e.name === 'PasswordException' || /password/i.test(e.message || ''))) fileErr = { key: 'pdf_password' };
      else fileErr = { key: 'pdf_error' };
      if (e && !e.key) console.warn('[' + SLUG + '] pdf:', e && e.message);
      renderFileErr();
    });
  }

  $('#sampleBtn').addEventListener('click', function () {
    var lang = $('#sampleLang').value || EDU.lang;
    loadSample(lang, false);
    var qs = (C[lang] || C.en).questions;
    S.q = qs[0]; $('#q').value = S.q;
    runSearch(true);
  });
  $('#clearBtn').addEventListener('click', function () {
    notes = ''; $('#notes').value = ''; S.src = null; lastRes = null;
    clearFileMsgs();
    notesChanged(true);
    $('#notes').focus();
  });

  /* ------------------------------------------------------------------ suggested questions */
  function renderTry() {
    var box = $('#tryChips');
    box.innerHTML = '';
    var on = !!(S.src && S.src.kind === 'sample' && notes.trim());
    show($('#tryRow'), on);
    if (!on) return;
    (C[S.src.lang] || C.en).questions.forEach(function (q) {
      box.appendChild(el('button', { type: 'button', class: 'chip', text: q, onclick: function () { S.q = q; $('#q').value = q; runSearch(true); } }));
    });
  }

  /* ------------------------------------------------------------------ mode + top-k */
  function renderMode() {
    $('#modeKw').setAttribute('aria-pressed', String(S.mode === 'kw'));
    $('#modeAi').setAttribute('aria-pressed', String(S.mode === 'ai'));
    EDU.$$('#kSeg button').forEach(function (b) {
      b.textContent = t('top_n', { n: EDU.fmt(+b.dataset.k) });
      b.setAttribute('aria-pressed', String(+b.dataset.k === S.k));
    });
    renderAI();
  }
  $('#modeKw').addEventListener('click', function () { S.mode = 'kw'; saveState(); renderMode(); runSearch(false); });
  $('#modeAi').addEventListener('click', function () {
    S.mode = 'ai'; saveState(); renderMode();
    if (ai.state === 'ready') runSearch(false);
    else { runSearch(false); $('#aiBox').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  });
  EDU.$$('#kSeg button').forEach(function (b) {
    b.addEventListener('click', function () { S.k = +b.dataset.k; saveState(); renderMode(); runSearch(false); });
  });

  /* ------------------------------------------------------------------ AI model */
  function devName() { return t('run_wasm'); }
  function renderAI() {
    var box = $('#aiBox'), on = S.mode === 'ai' && ai.state !== 'ready';
    var embedding = ai.state === 'ready' && ai.phase === 'embed';
    show(box, on || embedding || (S.mode === 'ai' && !!aiErr));
    show($('#aiAsk'), ai.state === 'off' && !aiErr);
    $('#aiBody').textContent = t('ai_body', { mb: EDU.fmt(MB) });
    $('#aiGet').textContent = ai.cached ? t('ai_get_cached') : t('ai_get', { mb: EDU.fmt(MB) });
    show($('#aiCachedNote'), ai.cached);
    var busy = ai.state === 'loading' || embedding;
    show($('#aiStatus'), busy);
    if (busy) {
      var txt, frac = null;
      if (ai.phase === 'dl') { txt = t('ai_dl', { got: EDU.fmt(Math.round(ai.got / 1e6)), total: EDU.fmt(Math.round(ai.total / 1e6)) }); frac = ai.total ? ai.got / ai.total : 0; }
      else if (ai.phase === 'embed') { txt = t('ai_reading', { n: EDU.fmt(ai.n), total: EDU.fmt(ai.of) }); frac = ai.of ? ai.n / ai.of : 0; }
      else txt = t('ai_starting');
      if ($('#aiText').textContent !== txt) $('#aiText').textContent = txt;
      var bar = $('#aiBar');
      bar.classList.toggle('an-indet', frac == null);
      bar.style.width = (frac == null ? 100 : Math.round(EDU.clamp(frac, 0, 1) * 100)) + '%';
      if (frac == null) $('#aiBarWrap').removeAttribute('aria-valuenow'); else $('#aiBarWrap').setAttribute('aria-valuenow', String(Math.round(frac * 100)));
      show($('#aiPhone'), ai.phase === 'embed' || ai.phase === 'dl');
    }
    show($('#aiErr'), !!aiErr);
    if (aiErr) $('#aiErrText').textContent = t(aiErr.key) + ' ' + t(aiErr.hint);
    show($('#aiOn'), S.mode === 'ai' && ai.state === 'ready' && ai.phase !== 'embed');
    $('#aiOn').textContent = '✓ ' + t('ai_ready');
    renderFacts();
  }
  function modelCached() {
    try {
      if (!window.caches) return Promise.resolve(false);
      return caches.open('transformers-cache').then(function (c) {
        return c.match('https://huggingface.co/' + MODEL.id + '/resolve/main/' + MODEL.file);
      }).then(function (r) { return !!r; }).catch(function () { return false; });
    } catch (e) { return Promise.resolve(false); }
  }
  function browserCacheWorks() {
    try {
      if (!window.caches) return Promise.resolve(false);
      return caches.open('transformers-cache').then(function () { return true; }, function () { return false; });
    } catch (e) { return Promise.resolve(false); }
  }
  var importer = null, tfP = null, tfTries = 0;
  function importTF() {
    /* dynamic import() kept out of the classic script's syntax so very old browsers can still run keyword search */
    if (!importer) { try { importer = new Function('u', 'return import(u)'); } catch (e) { return Promise.reject(e); } }
    if (tfP) return tfP;
    /* the browser remembers a failed import() of a URL for the whole page, so a retry after the internet comes back
       asks for the same pinned file with a fresh query string */
    var url = TF_URL + (tfTries++ ? '?retry=' + tfTries : '');
    tfP = importer(url);
    tfP.catch(function () { tfP = null; });
    return tfP;
  }
  function loadModel() {
    if (ai.state === 'loading' || ai.state === 'ready') return;
    aiErr = null;
    ai.state = 'loading'; ai.phase = 'init'; ai.got = 0; ai.total = MODEL.bytes; ai.cancelled = false;
    ai.ctl = window.AbortController ? new AbortController() : null;
    renderAI();
    var files = {};
    Promise.all([importTF(), browserCacheWorks()]).then(function (r) {
      var T = r[0], cacheOK = r[1];
      if (ai.cancelled) throw { cancelled: true };
      ai.T = T;
      T.env.allowLocalModels = false;
      /* Run the model in ONNX Runtime's own Web Worker, so the page never freezes while the AI reads the notes
         (on a slow phone one batch can take seconds). The worker can't start from a downloaded folder (file://),
         so there, or if it failed once in this browser, the model runs on the page in small batches instead. */
      ai.proxied = false;
      try {
        var ow = T.env.backends.onnx.wasm;
        if (ow && window.Worker && /^https?:$/.test(location.protocol) && !store.get('noProxy', false)) { ow.proxy = true; ai.proxied = true; }
      } catch (e) { }
      if (!cacheOK) { T.env.useBrowserCache = false; T.env.useWasmCache = false; }
      var base = T.env.fetch || fetch.bind(window);
      T.env.fetch = function (url, opts) { return base(url, Object.assign({}, opts || {}, ai.ctl ? { signal: ai.ctl.signal } : {})); };
      return T.pipeline('feature-extraction', MODEL.id, {
        dtype: 'q8', device: 'wasm',
        progress_callback: function (p) {
          if (!p || ai.cancelled) return;
          if (p.status === 'progress' && p.file) {
            files[p.file] = { got: p.loaded || 0, total: p.total || 0 };
            var got = 0, tot = 0;
            Object.keys(files).forEach(function (k) { got += files[k].got; tot += files[k].total; });
            ai.got = got; ai.total = Math.max(tot, MODEL.bytes); ai.phase = 'dl';
            renderAIThrottled();
          } else if (p.status === 'ready') { ai.phase = 'init'; renderAI(); }
        }
      });
    }).then(function (ext) {
      if (ai.cancelled) throw { cancelled: true };
      ai.ext = ext; ai.state = 'ready'; ai.phase = null; ai.cached = true;
      store.set('aiOk', true);
      renderAI();
      if (S.mode === 'ai') runSearch(false);
    }).catch(function (e) {
      ai.state = 'off'; ai.phase = null; ai.ext = null;
      if (ai.cancelled || (e && (e.cancelled || e.name === 'AbortError'))) { EDU.toast(t('ai_stopped')); renderAI(); return; }
      var msg = String(e && (e.message || e) || '');
      console.warn('[' + SLUG + '] model:', msg.slice(0, 200));
      /* ONNX Runtime can't start twice on one page: remember to skip the worker next time, and reload on retry */
      if (/backend|wasm|worker/i.test(msg)) {
        ai.needReload = true;
        /* the worker itself failed (not the internet): run on the page from now on */
        if (ai.proxied && !/fetch|network|internet/i.test(msg)) store.set('noProxy', true);
      }
      aiErr = { key: 'ai_error', hint: navigator.onLine === false ? 'ai_offline' : /\b429\b/.test(msg) ? 'ai_busy' : 'ai_check_net' };
      renderAI();
    });
  }
  var rTimer = 0;
  function renderAIThrottled() { if (!rTimer) rTimer = setTimeout(function () { rTimer = 0; renderAI(); }, 120); }
  $('#aiGet').addEventListener('click', loadModel);
  $('#aiRetry').addEventListener('click', function () { if (ai.needReload) { store.set('resume', true); location.reload(); return; } aiErr = null; loadModel(); });
  $('#aiCancel').addEventListener('click', function () {
    if (ai.state === 'loading') { ai.cancelled = true; if (ai.ctl) try { ai.ctl.abort(); } catch (e) { } ai.state = 'off'; ai.phase = null; renderAI(); EDU.toast(t('ai_stopped')); }
    else if (ai.phase === 'embed') { embedStop = true; }
  });

  /* ------------------------------------------------------------------ embeddings */
  var embedStop = false, embedChain = Promise.resolve();
  function passageText(p) { return MODEL.p + (p.head ? p.head + '. ' : '') + p.text; }
  function embedTexts(texts) {
    return ai.ext(texts, { pooling: 'mean', normalize: true }).then(function (out) {
      var d = out.dims[out.dims.length - 1], data = out.data, res = [];
      for (var i = 0; i < texts.length; i++) res.push(Float32Array.from(data.subarray(i * d, (i + 1) * d)));
      return res;
    });
  }
  /* embed every text that has no vector yet; progress for long jobs. Resolves false if stopped. */
  function ensureVecs(texts, showProgress) {
    var job = embedChain.then(function () {
      var todo = [], seen = {};
      texts.forEach(function (s) { var h = AYN.hash(s); if (!vecs.has(h) && !seen[h]) { seen[h] = 1; todo.push(s); } });
      if (!todo.length) return true;
      embedStop = false;
      var big = showProgress && todo.length > BATCH;
      if (big) { ai.phase = 'embed'; ai.n = 0; ai.of = todo.length; renderAI(); }
      /* on the page (no worker) each batch blocks the screen: start small and keep each batch under ~0.3 s */
      var i = 0, size = ai.proxied ? BATCH : 1;
      function step() {
        if (embedStop) return false;
        if (i >= todo.length) return true;
        var part = todo.slice(i, i + size), t0 = performance.now();
        return embedTexts(part).then(function (vs) {
          part.forEach(function (s, j) { vecs.set(AYN.hash(s), vs[j]); });
          i += part.length;
          if (!ai.proxied && part.length === size && performance.now() - t0 < 120 && size < BATCH) size++;
          if (big) { ai.n = i; renderAI(); }
          return yieldUI().then(step);
        });
      }
      return Promise.resolve(step()).then(function (ok) {
        if (big) { ai.phase = null; renderAI(); }
        return ok;
      }, function (e) { if (big) { ai.phase = null; renderAI(); } throw e; });
    });
    embedChain = job.catch(function () { });
    return job;
  }
  function vecOf(s) { return vecs.get(AYN.hash(s)); }

  /* ------------------------------------------------------------------ search */
  function setInfo(txt) { $('#searchInfo').textContent = txt || ''; }
  function runSearch(fromUser) {
    if (indexTimer) { clearTimeout(indexTimer); indexTimer = 0; reindex(); store.set('notes', notes); renderTry(); }   // notes typed a moment ago
    var q = S.q.trim(), seq = ++searchSeq;
    saveState();
    if (!notes.trim() || !passages.length) { lastRes = { msg: 'need_notes' }; return renderResults(); }
    if (!q) { lastRes = fromUser ? { msg: 'need_q' } : null; return renderResults(); }
    var t0 = performance.now();
    if (S.mode === 'ai' && ai.state === 'ready') {
      /* a newer search replaces the old one: stop reading old notes (vectors made so far are kept) */
      if (ai.phase === 'embed') embedStop = true;
      /* the AI still has to read (part of) the notes: show keyword answers for the new notes meanwhile,
         so old answers never stay on screen next to new notes */
      if (passages.some(function (p) { return !vecs.has(AYN.hash(passageText(p))); })) kwSearch(q, t0, true);
      return aiSearch(q, seq, t0).catch(function (e) {
        if (seq !== searchSeq) return;
        console.warn('[' + SLUG + '] ai search:', e && e.message);
        aiErr = { key: 'ai_error_run', hint: 'ai_check_net' };
        renderAI();
        kwSearch(q, t0, true);
      });
    }
    kwSearch(q, t0, S.mode === 'ai');
  }
  function kwSearch(q, t0, meanwhile) {
    var hits = AYN.bm25(idx, q, S.k).map(function (h) {
      return { i: h.i, score: h.score, terms: h.terms, best: AYN.bestSentenceBM25(idx, passages[h.i].sentences, q) };
    });
    lastRes = { q: q, mode: 'kw', hits: hits, max: hits.length ? hits[0].score : 1, ms: performance.now() - t0, meanwhile: meanwhile };
    renderResults();
  }
  function aiSearch(q, seq, t0) {
    var ptexts = passages.map(passageText);
    return ensureVecs(ptexts, true).then(function (ok) {
      if (seq !== searchSeq) return;
      if (!ok) { kwSearch(q, t0, true); return; }
      var qtext = MODEL.q + q;
      return ensureVecs([qtext], false).then(function () {
        if (seq !== searchSeq) return;
        var qv = vecOf(qtext);
        var sc = passages.map(function (p, i) { return { i: i, s: AYN.cosine(qv, vecOf(ptexts[i])) }; });
        sc.sort(function (a, b) { return b.s - a.s; });
        var cand = sc.slice(0, Math.max(RERANK, S.k));
        var stexts = [];
        cand.forEach(function (c) { var ss = passages[c.i].sentences; if (ss.length > 1) ss.forEach(function (s) { stexts.push(MODEL.p + s); }); });
        return ensureVecs(stexts, false).then(function () {
          if (seq !== searchSeq) return;
          cand.forEach(function (c) {
            var ss = passages[c.i].sentences, best = 0, bs = -2;
            if (ss.length > 1) ss.forEach(function (s, j) { var v = AYN.cosine(qv, vecOf(MODEL.p + s)); if (v > bs) { bs = v; best = j; } });
            c.best = best; c.pass = c.s; c.s = Math.max(c.s, bs);
          });
          cand.sort(function (a, b) { return b.s - a.s; });
          var hits = cand.slice(0, S.k).map(function (c) { return { i: c.i, score: c.s, best: c.best }; });
          lastRes = { q: q, mode: 'ai', hits: hits, ms: performance.now() - t0 };
          if (hits.length) lastViz = { qv: qv, pv: vecOf(ptexts[hits[0].i]), sim: AYN.cosine(qv, vecOf(ptexts[hits[0].i])) };
          renderResults(); renderViz();
        });
      });
    });
  }
  $('#askForm').addEventListener('submit', function (e) {
    e.preventDefault();
    S.q = $('#q').value.slice(0, 500);
    runSearch(true);
  });
  $('#q').addEventListener('input', function () { S.q = this.value.slice(0, 500); });

  /* ------------------------------------------------------------------ results */
  function hitHTML(p, hit, terms) {
    var termSet = terms || null;
    return p.sentences.map(function (s, j) {
      var html;
      if (termSet) {
        html = s.replace(/[\p{L}\p{M}\p{N}]+|[^\p{L}\p{M}\p{N}]+/gu, function (w) {
          if (!/[\p{L}\p{N}]/u.test(w)) return EDU.esc(w);
          var tk = AYN.tokens(w)[0];
          return tk && termSet[tk] ? '<b>' + EDU.esc(w) + '</b>' : EDU.esc(w);
        });
      } else html = EDU.esc(s);
      return j === hit.best && p.sentences.length > 1 ? '<mark>' + html + '</mark>' : html;
    }).join(' ');
  }
  function plainHit(p) { return (p.head ? p.head + '\n' : '') + p.text + (p.page != null ? '\n(' + t('page_n', { n: p.page }) + ')' : ''); }
  function renderResults() {
    var list = $('#results'), msg = $('#resMsg');
    list.innerHTML = ''; msg.innerHTML = '';
    show($('#copyAll'), false);
    var r = lastRes;
    $('#hRes').classList.toggle('no-i18n', !!(r && r.q));
    if (!r) { $('#hRes').textContent = t('results_h'); msg.appendChild(emptyBox('💬', t('ask_hint'))); setInfo(''); return; }
    if (r.msg) { $('#hRes').textContent = t('results_h'); msg.appendChild(emptyBox('📝', t(r.msg))); setInfo(''); return; }
    $('#hRes').textContent = t('results_for', { q: r.q });
    setInfo(t('search_info', { n: EDU.fmt(passages.length), ms: EDU.fmt(Math.max(1, Math.round(r.ms))) }));
    if (r.meanwhile && S.mode === 'ai') msg.appendChild(el('p', { class: 'callout small mb0', text: t('ai_kw_meanwhile') }));
    if (!r.hits.length) {
      var box = emptyBox('🔍', t(r.mode === 'kw' ? 'no_match_kw' : 'no_match_ai'));
      if (r.mode === 'kw' && S.mode !== 'ai') box.appendChild(el('button', { type: 'button', class: 'btn btn-sm btn-primary', text: t('use_ai'), onclick: function () { $('#modeAi').click(); } }));
      msg.appendChild(box);
      return;
    }
    if (r.mode === 'ai' && r.hits[0].score < MODEL.weak) msg.appendChild(el('p', { class: 'callout warning small mb0', text: t('weak_match') }));
    r.hits.forEach(function (h, n) {
      var p = passages[h.i];
      if (!p) return;
      var bar = el('div', { class: 'an-hitbar' },
        el('span', { class: 'badge primary', text: '#' + EDU.fmt(n + 1) }),
        p.page != null ? el('span', { class: 'badge', text: t('page_n', { n: EDU.fmt(p.page) }) }) : null,
        r.mode === 'ai'
          ? el('span', { class: 'badge success', title: t('sim_title'), text: t('sim_v', { v: EDU.fmt(h.score, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }) })
          : el('span', { class: 'badge success', title: t('kw_title'), text: t('kw_v', { v: fmt1(h.score) }) }),
        el('span', { class: 'an-meter', 'aria-hidden': 'true' }, el('span', { style: { width: Math.round(meter(r, h) * 100) + '%' } })),
        el('span', { class: 'grow' }),
        el('button', { type: 'button', class: 'btn btn-sm btn-ghost', 'aria-label': t('copy') + ' #' + (n + 1), onclick: function () { EDU.copy(plainHit(p)); } },
          el('span', { 'aria-hidden': 'true', text: '📋' }), ' ', el('span', { text: t('copy') }))
      );
      var li = el('li', { class: 'an-hit' + (n === 0 ? ' top' : '') }, bar);
      if (p.head) li.appendChild(el('p', { class: 'an-head no-i18n', text: p.head }));
      li.appendChild(el('p', { class: 'an-text no-i18n', html: hitHTML(p, h, r.mode === 'kw' ? h.terms : null) }));
      list.appendChild(li);
    });
    show($('#copyAll'), true);
  }
  function meter(r, h) {
    if (r.mode === 'kw') return EDU.clamp(h.score / (r.max || 1), 0.05, 1);
    return EDU.clamp((h.score - 0.70) / 0.20, 0.05, 1);    // e5 cosines: ~0.70 unrelated … ~0.90 very close
  }
  function emptyBox(icon, text) {
    return el('div', { class: 'an-empty' }, el('span', { class: 'ic', 'aria-hidden': 'true', text: icon }), el('span', { class: 'small muted', text: text }));
  }
  $('#copyAll').addEventListener('click', function () {
    if (!lastRes || !lastRes.hits) return;
    var out = t('results_for', { q: lastRes.q }) + '\n\n' + lastRes.hits.map(function (h, n) { return (n + 1) + '. ' + plainHit(passages[h.i]); }).join('\n\n');
    EDU.copy(out);
  });

  /* ------------------------------------------------------------------ inside: vectors + facts */
  function renderViz() {
    var on = !!lastViz;
    show($('#viz'), on); show($('#vizEmpty'), !on);
    $('#lgPos').style.background = 'var(--primary)';
    $('#lgNeg').style.background = 'var(--accent)';
    $('#vizNote').textContent = t('viz_note', { n: EDU.fmt(VIZ_N), d: EDU.fmt(MODEL.dims) });
    if (!on) return;
    var m = 1e-6, i;
    for (i = 0; i < VIZ_N; i++) m = Math.max(m, Math.abs(lastViz.qv[i]), Math.abs(lastViz.pv[i]));
    [['#vizQ', lastViz.qv], ['#vizP', lastViz.pv]].forEach(function (x) {
      var box = $(x[0]); box.innerHTML = '';
      for (var j = 0; j < VIZ_N; j++) {
        var v = x[1][j], pct = Math.round(15 + 85 * Math.abs(v) / m);
        box.appendChild(el('i', { title: EDU.fmt(v, { maximumFractionDigits: 3 }), style: { background: v >= 0 ? 'var(--primary)' : 'var(--accent)', opacity: String(pct / 100) } }));
      }
    });
    $('#vizSim').textContent = t('viz_sim', { s: EDU.fmt(lastViz.sim, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) });
  }
  function renderFacts() {
    $('#fModel').textContent = MODEL.name + ' · ' + MODEL.by;
    $('#fLic').textContent = t('lic_v', { lic: MODEL.lic });
    $('#fSize').textContent = t('size_v', { mb: EDU.fmt(MB) });
    $('#fDims').textContent = EDU.fmt(MODEL.dims);
    $('#fRun').textContent = ai.state === 'ready' ? devName() : t('run_none');
  }

  /* ------------------------------------------------------------------ reset + language */
  $('#resetBtn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    store.remove('notes'); store.remove('state');
    S = { mode: S.mode === 'ai' && ai.state === 'ready' ? 'ai' : 'kw', k: 3, q: '', src: null };
    lastRes = null; lastViz = null;
    startWithSample();
    renderMode(); renderViz();
  });
  function startWithSample() {
    $('#sampleLang').value = EDU.lang;
    loadSample(EDU.lang, true);
    S.q = (C[EDU.lang] || C.en).questions[0];
    $('#q').value = S.q;
    runSearch(false);
  }

  var shownLang = EDU.lang;
  function render() {
    /* the untouched default sample follows the page language */
    if (S.src && S.src.kind === 'sample' && S.src.auto && shownLang !== EDU.lang && notes === sampleText(S.src.lang)) {
      var oldQs = (C[S.src.lang] || C.en).questions, qi = oldQs.indexOf(S.q);
      loadSample(EDU.lang, true);
      if (qi >= 0 || !S.q.trim()) { S.q = C[EDU.lang].questions[Math.max(0, qi)]; $('#q').value = S.q; }
      $('#sampleLang').value = EDU.lang;
      runSearch(false);
    }
    shownLang = EDU.lang;
    fillSampleSelect();
    renderStats(); renderTry(); renderMode(); renderResults(); renderViz(); renderFileErr();
    if (ai.state === 'off' && S.mode === 'ai') renderAI();
  }
  EDU.onLang(render);

  /* ------------------------------------------------------------------ start */
  fillSampleSelect();
  if (firstVisit || (!notes.trim() && !S.src)) startWithSample();
  else {
    $('#notes').value = notes;
    $('#q').value = S.q;
    reindex(); renderTry();
    if (S.q.trim()) runSearch(false); else renderResults();
  }
  renderMode(); renderViz();
  modelCached().then(function (yes) {
    ai.cached = yes;
    /* came back with AI search on and the model already on this device: start it without asking again */
    var resume = store.get('resume', false);
    store.remove('resume');
    if (S.mode === 'ai' && (resume || (yes && store.get('aiOk', false)))) loadModel(); else renderAI();
  });
  document.getElementById('app').setAttribute('data-ready', '1');
})();
