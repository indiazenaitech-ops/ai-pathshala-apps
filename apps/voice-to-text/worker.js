/* Voice Note to Text: the speech engine. This function is turned into a Web Worker (from a blob, so it also
   works from a downloaded folder opened with file://). It loads Transformers.js + a Whisper model from the CDN
   and turns 16 kHz mono audio into text with timestamps. Nothing is sent anywhere: the audio stays in memory. */
window.VTT_WORKER = function () {
  'use strict';
  var lib = null, asr = null, loadedKey = '', scriptOf = null, sot = 0, langIds = {};

  function post(m) { self.postMessage(m); }
  function msg(e) { return String((e && (e.message || e.name)) || e || 'error').slice(0, 400); }

  /* GPT-2 byte-level BPE: every token string maps back to raw UTF-8 bytes. */
  function byteDecoder() {
    var bs = [], cs, n = 0, b, map = {};
    for (b = 33; b <= 126; b++) bs.push(b);
    for (b = 161; b <= 172; b++) bs.push(b);
    for (b = 174; b <= 255; b++) bs.push(b);
    cs = bs.slice();
    for (b = 0; b < 256; b++) if (bs.indexOf(b) < 0) { bs.push(b); cs.push(256 + n); n++; }
    for (b = 0; b < bs.length; b++) map[String.fromCharCode(cs[b])] = bs[b];
    return map;
  }

  /* For each token, note which writing systems its bytes clearly belong to. Used to stop the model from
     writing Hindi in Urdu letters (and the other way round), which small Whisper models often do. */
  var BLOCKS = { deva: [0xA4, 0xA5], beng: [0xA6, 0xA7], guru: [0xA8, 0xA9], gujr: [0xAA, 0xAB], orya: [0xAC, 0xAD],
    taml: [0xAE, 0xAF], telu: [0xB0, 0xB1], knda: [0xB2, 0xB3], mlym: [0xB4, 0xB5] };
  function buildScripts() {
    var dec = byteDecoder(), vocab = asr.tokenizer.get_vocab(), out = {}, utf8 = new TextDecoder('utf-8', { fatal: true });
    vocab.forEach(function (id, tok) {
      if (id >= 50257) return;                      // special / timestamp tokens are handled by Whisper itself
      var bytes = [], i, ch, s = {};
      for (i = 0; i < tok.length; i++) { ch = dec[tok[i]]; if (ch === undefined) return; bytes.push(ch); }
      /* A token that starts in the middle of a character: two continuation bytes first means the first one
         is the 2nd byte of a 3-byte character (E0 xx yy), which tells us the Indian script. */
      var lead = 0; while (lead < bytes.length && bytes[lead] >= 0x80 && bytes[lead] < 0xC0) lead++;
      if (lead === 2) {
        var hit0 = '';
        for (var k0 in BLOCKS) if (BLOCKS[k0].indexOf(bytes[0]) >= 0) hit0 = k0;
        s[hit0 || 'other'] = 1;
      } else if (lead >= 3) s.other = 1;
      for (i = 0; i < bytes.length; i++) {
        var x = bytes[i];
        if ((x >= 0x41 && x <= 0x5A) || (x >= 0x61 && x <= 0x7A)) { s.latn = 1; continue; }
        if (x < 0xC0) continue;                     // digits, punctuation or a continuation byte
        if (x === 0xC2 || x === 0xC3) continue;     // Latin-1 letters and symbols
        if (x >= 0xD8 && x <= 0xDD) { s.arab = 1; continue; }
        if (x === 0xE0) {
          if (i + 1 < bytes.length) {
            var y = bytes[i + 1], hit = '';
            for (var k in BLOCKS) if (BLOCKS[k].indexOf(y) >= 0) hit = k;
            s[hit || 'other'] = 1;
          }
          continue;
        }
        if (x === 0xE2) continue;                   // punctuation, ₹ and other symbols
        if (x === 0xEF) { s.ef = 1; continue; }     // Arabic presentation forms, full-width forms
        s.other = 1;                                // Greek, Cyrillic, CJK, emoji, …
      }
      /* For "English letters only": anything that is not complete, plain Latin text is blocked too. */
      if (bytes.some(function (b) { return b >= 0x80; })) {
        try {
          var str = utf8.decode(new Uint8Array(bytes));
          for (i = 0; i < str.length; i++) { var c = str.charCodeAt(i); if (c > 0x24F && (c < 0x2000 || c > 0x20CF)) { s.part = 1; break; } }
        } catch (e) { s.part = 1; }
      }
      if (Object.keys(s).length) out[id] = s;
    });
    return out;
  }
  /* allow: the writing systems the text may use, e.g. ['deva'] or ['latn']. Tokens of other scripts are blocked. */
  var suppressCache = {};
  function suppressFor(allow) {
    var key = allow.join('+');
    if (suppressCache[key]) return suppressCache[key];
    if (!scriptOf) scriptOf = buildScripts();
    var base = (asr.model.generation_config && asr.model.generation_config.suppress_tokens) || [];
    var list = base.slice(), ok = {};
    allow.forEach(function (a) { ok[a] = 1; if (a === 'arab') ok.ef = 1; });
    if (key !== 'latn') ok.part = 1;            // own-script text is a nudge only; partial tokens stay allowed
    for (var id in scriptOf) {
      var s = scriptOf[id];
      for (var k in s) if (!ok[k]) { list.push(+id); break; }
    }
    return (suppressCache[key] = list);
  }

  function load(m) {
    var key = m.model + '|' + m.device;
    if (asr && loadedKey === key) { post({ type: 'ready', device: m.device }); return; }
    (lib ? Promise.resolve(lib) : import(m.lib)).then(function (L) {
      lib = L;
      L.env.allowLocalModels = false;
      try { if (!self.crossOriginIsolated) L.env.backends.onnx.wasm.numThreads = 1; } catch (e) { /* older builds */ }
      var files = {};
      var opts = {
        device: m.device, dtype: m.dtype,
        progress_callback: function (p) {
          if (p && p.status === 'progress' && p.file && /\.onnx/.test(p.file)) {
            files[p.file] = p.loaded || 0;
            var sum = 0; for (var f in files) sum += files[f];
            post({ type: 'dl', loaded: sum });
          }
        }
      };
      var old = asr; asr = null; scriptOf = null; suppressCache = {};
      return Promise.resolve(old && old.dispose ? old.dispose() : null).catch(function () { /* ignore */ }).then(function () {
        return L.pipeline('automatic-speech-recognition', m.model, opts);
      });
    }).then(function (p) {
      asr = p; loadedKey = key;
      var gc = asr.model.generation_config || {};
      sot = gc.decoder_start_token_id || 50258;
      langIds = {};
      ['en', 'hi', 'bn', 'mr', 'gu', 'pa', 'ta', 'te', 'kn', 'ml', 'ur'].forEach(function (c) {
        var id = gc.lang_to_id && gc.lang_to_id['<|' + c + '|>']; if (id !== undefined) langIds[c] = id;
      });
      post({ type: 'ready', device: m.device });
    }, function (e) { post({ type: 'error', stage: 'load', msg: msg(e) }); });
  }

  /* Which language is spoken? One encoder + one decoder step, then compare the language tokens. */
  function detect(m) {
    asr.processor(m.audio).then(function (feat) {
      var T = lib.Tensor;
      return asr.model({ input_features: feat.input_features, decoder_input_ids: new T('int64', BigInt64Array.from([BigInt(sot)]), [1, 1]) });
    }).then(function (out) {
      var logits = out.logits.data, V = out.logits.dims[out.logits.dims.length - 1], off = logits.length - V;
      var scores = {}, max = -Infinity, c;
      for (c in langIds) { scores[c] = logits[off + langIds[c]]; if (scores[c] > max) max = scores[c]; }
      var sum = 0; for (c in scores) { scores[c] = Math.exp(scores[c] - max); sum += scores[c]; }
      for (c in scores) scores[c] /= sum;
      post({ type: 'detected', id: m.id, scores: scores });
    }).catch(function (e) { post({ type: 'error', stage: 'detect', id: m.id, msg: msg(e) }); });
  }

  function run(m) {
    var t0 = Date.now();
    var o = { return_timestamps: true, task: m.task, language: m.language };
    if (m.allow && m.allow.length) o.suppress_tokens = suppressFor(m.allow);
    if (m.noRepeat) { o.no_repeat_ngram_size = m.noRepeat; o.repetition_penalty = 1.2; }
    asr(m.audio, o).then(function (r) {
      var chunks = (r.chunks || []).map(function (c) { return { s: c.timestamp[0], e: c.timestamp[1], text: c.text }; });
      post({ type: 'result', id: m.id, text: r.text || '', chunks: chunks, ms: Date.now() - t0 });
    }, function (e) { post({ type: 'error', stage: 'run', id: m.id, msg: msg(e) }); });
  }

  self.onmessage = function (e) {
    var m = e.data || {};
    try {
      if (m.type === 'load') load(m);
      else if (!asr) post({ type: 'error', stage: m.type, id: m.id, msg: 'not loaded' });
      else if (m.type === 'detect') detect(m);
      else if (m.type === 'run') run(m);
    } catch (err) { post({ type: 'error', stage: m.type, id: m.id, msg: msg(err) }); }
  };
};
