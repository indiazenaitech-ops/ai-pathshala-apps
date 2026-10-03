/* Token Explorer engine: byte-level BPE (like GPT tokenizers), word and character
   tokenizers. Pure functions, no DOM. Exposes window.TOKLAB. */
(function (root) {
  'use strict';
  var K = 4096;                 // pair key = a * K + b  (ids stay < 256 + 600)
  var CORPUS_CAP = 40000;       // characters of training text used (keeps training fast)
  var ENC = new TextEncoder();
  var DEC = null;
  try { DEC = new TextDecoder('utf-8', { fatal: true }); } catch (e) { DEC = null; }

  /* GPT-2 style pre-tokenizer: a word with its leading space, numbers, punctuation, spaces.
     Merges never cross these chunk borders. */
  var PRE, WORDRE;
  try {
    PRE = new RegExp(String.raw` ?[\p{L}\p{M}\u200c\u200d]+| ?\p{N}+| ?[^\s\p{L}\p{M}\p{N}\u200c\u200d]+|\s+(?!\S)|\s+`, 'gu');
    WORDRE = new RegExp(String.raw`[\p{L}\p{M}\p{N}\u200c\u200d]+|[^\s\p{L}\p{M}\p{N}\u200c\u200d]`, 'gu');
  } catch (e) { PRE = / ?[^\s]+|\s+/g; WORDRE = /[^\s]+/g; }
  var MARK;
  try { MARK = new RegExp(String.raw`^\p{M}`, 'u'); } catch (e) { MARK = /^[̀-ͯऀ-ःऺ-ॏ॑-ॗॢॣ]/; }

  function pretok(text) { return String(text || '').match(PRE) || []; }
  function utf8(s) { return Array.prototype.slice.call(ENC.encode(String(s))); }
  function hex(b) { return (b < 16 ? '0' : '') + b.toString(16).toUpperCase(); }

  /* Decode bytes to text if they form complete UTF-8 characters, else null. */
  function decode(bytes) {
    if (!DEC) return null;
    try { return DEC.decode(new Uint8Array(bytes)); } catch (e) { return null; }
  }

  /* Train byte-level BPE: start from 256 byte tokens, repeatedly join the most frequent
     neighbouring pair. Pair counts are updated only for words that contain the merged pair. */
  function train(text, maxMerges) {
    text = String(text || '');
    var chars = Array.from(text);
    if (chars.length > CORPUS_CAP) text = chars.slice(0, CORPUS_CAP).join('');
    var counts = new Map();
    pretok(text).forEach(function (w) { counts.set(w, (counts.get(w) || 0) + 1); });
    var words = [], wc = [];
    counts.forEach(function (c, w) { words.push(utf8(w)); wc.push(c); });
    var pairs = new Map();
    function add(w, c) {
      for (var i = 0; i < w.length - 1; i++) { var k = w[i] * K + w[i + 1]; pairs.set(k, (pairs.get(k) || 0) + c); }
    }
    function sub(w, c) {
      for (var i = 0; i < w.length - 1; i++) {
        var k = w[i] * K + w[i + 1], v = (pairs.get(k) || 0) - c;
        if (v > 0) pairs.set(k, v); else pairs.delete(k);
      }
    }
    for (var j = 0; j < words.length; j++) add(words[j], wc[j]);
    var merges = [], vocab = [];
    for (var b = 0; b < 256; b++) vocab.push([b]);
    var best, bestC;
    var pick = function (c, k) { if (c > bestC || (c === bestC && k < best)) { best = k; bestC = c; } };
    for (var m = 0; m < maxMerges; m++) {
      best = -1; bestC = 1;               // a pair must appear at least twice
      pairs.forEach(pick);
      if (best < 0) break;
      var a = Math.floor(best / K), bb = best % K, id = 256 + m;
      merges.push({ a: a, b: bb, id: id, count: bestC });
      vocab.push(vocab[a].concat(vocab[bb]));
      for (j = 0; j < words.length; j++) {
        var w = words[j], has = false, i;
        for (i = 0; i < w.length - 1; i++) if (w[i] === a && w[i + 1] === bb) { has = true; break; }
        if (!has) continue;
        sub(w, wc[j]);
        var nw = [];
        for (i = 0; i < w.length; i++) {
          if (i < w.length - 1 && w[i] === a && w[i + 1] === bb) { nw.push(id); i++; } else nw.push(w[i]);
        }
        words[j] = nw;
        add(nw, wc[j]);
      }
    }
    var rank = new Map();
    merges.forEach(function (mm, i) { rank.set(mm.a * K + mm.b, i); });
    return {
      merges: merges, vocab: vocab, rank: rank, text: text,
      chars: Array.from(text).length, bytes: ENC.encode(text).length, chunks: words.length,
      wordVocab: null, cache: {}
    };
  }

  /* Encode one pre-token chunk using only the first n merges (lowest rank first, like GPT). */
  function encodeChunk(model, n, chunk) {
    var ids = utf8(chunk);
    if (n <= 0) return ids;
    while (ids.length > 1) {
      var bestR = Infinity, i;
      for (i = 0; i < ids.length - 1; i++) {
        var r = model.rank.get(ids[i] * K + ids[i + 1]);
        if (r !== undefined && r < n && r < bestR) bestR = r;
      }
      if (bestR === Infinity) break;
      var mm = model.merges[bestR], out = [];
      for (i = 0; i < ids.length; i++) {
        if (i < ids.length - 1 && ids[i] === mm.a && ids[i + 1] === mm.b) { out.push(mm.id); i++; } else out.push(ids[i]);
      }
      ids = out;
    }
    return ids;
  }

  function encode(model, n, text) {
    if (!model.cache[n] && Object.keys(model.cache).length >= 12) model.cache = {};   // keep memory small while sliding
    var res = [], cache = model.cache[n] || (model.cache[n] = new Map());
    pretok(text).forEach(function (ch) {
      var ids = cache.get(ch);
      if (!ids) { ids = encodeChunk(model, n, ch); if (cache.size < 20000) cache.set(ch, ids); }
      for (var i = 0; i < ids.length; i++) res.push(ids[i]);
    });
    return res;
  }

  /* Words: the browser's word splitter (Intl.Segmenter), punctuation kept as its own token. */
  function words(text, tag) {
    text = String(text || '');
    var out = [];
    try {
      if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        var seg = new Intl.Segmenter(tag || 'en', { granularity: 'word' });
        Array.from(seg.segment(text)).forEach(function (s) { if (s.segment.trim()) out.push({ text: s.segment, word: !!s.isWordLike }); });
        return out;
      }
    } catch (e) { out = []; }
    (text.match(WORDRE) || []).forEach(function (w) { out.push({ text: w, word: /[0-9A-Za-zÀ-￿]/.test(w) && !/^[ -⁯₠-⃏]$/.test(w) }); });
    return out;
  }

  /* Word list made from the training text: most frequent word gets ID 1. ID 0 = [UNK]. */
  function wordVocab(model, tag) {
    if (model.wordVocab) return model.wordVocab;
    var cnt = new Map(), order = [];
    words(model.text, tag).forEach(function (w) {
      var k = w.text.toLowerCase();
      if (!cnt.has(k)) { cnt.set(k, 0); order.push(k); }
      cnt.set(k, cnt.get(k) + 1);
    });
    order.sort(function (x, y) { return cnt.get(y) - cnt.get(x); });  // stable: ties keep first-seen order
    var map = new Map();
    order.forEach(function (k, i) { map.set(k, i + 1); });
    model.wordVocab = map;
    return map;
  }

  function isMark(s) { return MARK.test(s); }

  root.TOKLAB = {
    MAX_MERGES: 600, K: K, CORPUS_CAP: CORPUS_CAP,
    pretok: pretok, utf8: utf8, hex: hex, decode: decode, train: train,
    encode: encode, encodeChunk: encodeChunk, words: words, wordVocab: wordVocab, isMark: isMark
  };
})(typeof window !== 'undefined' ? window : this);
