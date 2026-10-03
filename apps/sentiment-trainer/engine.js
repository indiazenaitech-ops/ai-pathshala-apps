/* Mood Detector engine: a multinomial Naive Bayes text classifier, written from scratch.
   Training = counting how often each word appears in each label's sentences.
   Predicting = start from how common each label is, multiply in the chance of every word,
   and compare (done with logarithms so long sentences do not underflow to 0).
   Works in the browser (window.MoodNB) and in Node (module.exports) for testing. */
(function (root) {
  'use strict';
  var ALPHA = 1;                                    // add-one (Laplace) smoothing
  var segCache = {};
  var EMOJI_RE = null, FALLBACK_RE = null;
  try {
    EMOJI_RE = new RegExp('\\p{Extended_Pictographic}', 'u');
    FALLBACK_RE = new RegExp('[\\p{L}\\p{M}\\p{N}]+(?:[\'’][\\p{L}\\p{M}\\p{N}]+)*|\\p{Extended_Pictographic}', 'gu');
  } catch (e) {
    EMOJI_RE = /[☀-➿]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDEFF]|\uD83E[\uDD00-\uDEFF]/;
    FALLBACK_RE = /[^\s.,!?;:"“”‘’()\[\]{}<>\/|।॥۔؟،\-–—…]+/g;
  }

  function getSeg(locale) {
    locale = locale || 'en';
    if (segCache[locale] === undefined) {
      segCache[locale] = null;
      try { if (typeof Intl !== 'undefined' && Intl.Segmenter) segCache[locale] = new Intl.Segmenter(locale, { granularity: 'word' }); } catch (e) { segCache[locale] = null; }
    }
    return segCache[locale];
  }

  /* The "key" of a word: same spelling in any case / Unicode form / with or without invisible joiners. */
  function norm(w) {
    var s = String(w);
    try { s = s.normalize('NFC'); } catch (e) { }
    return s.toLowerCase().replace(/[​-‍︎️]/g, '');
  }

  /* tokenize(text, locale) -> [{raw, tok, start, end}]  (words, numbers and emoji; punctuation dropped) */
  function tokenize(text, locale) {
    text = String(text == null ? '' : text);
    var out = [], seg = getSeg(locale);
    if (seg) {
      var it = seg.segment(text)[Symbol.iterator](), r, v;
      while (!(r = it.next()).done) {
        v = r.value;
        if (v.isWordLike || EMOJI_RE.test(v.segment)) {
          var k = norm(v.segment);
          if (k) out.push({ raw: v.segment, tok: k, start: v.index, end: v.index + v.segment.length });
        }
      }
    } else {
      FALLBACK_RE.lastIndex = 0;
      var m;
      while ((m = FALLBACK_RE.exec(text))) {
        var k2 = norm(m[0]);
        if (k2) out.push({ raw: m[0], tok: k2, start: m.index, end: m.index + m[0].length });
        if (m[0] === '') FALLBACK_RE.lastIndex++;
      }
    }
    return out;
  }

  /* Features = every word, plus (optionally) every pair of neighbouring words "not happy". */
  function features(tokens, pairs) {
    var f = tokens.map(function (t) { return t.tok; });
    if (pairs) for (var i = 0; i + 1 < tokens.length; i++) f.push(tokens[i].tok + ' ' + tokens[i + 1].tok);
    return f;
  }

  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  /* docs: [{feats:[...], label:id, raw?:{feature: display form}}], labelIds: [id...] */
  function train(docs, labelIds, opts) {
    opts = opts || {};
    var m = { labels: labelIds.slice(), pairs: !!opts.pairs, alpha: ALPHA, N: 0, docs: {}, total: {}, counts: {}, vocab: Object.create(null), V: 0, display: Object.create(null) };
    labelIds.forEach(function (c) { m.docs[c] = 0; m.total[c] = 0; m.counts[c] = Object.create(null); });
    docs.forEach(function (d) {
      if (!own(m.docs, d.label)) return;
      m.N++; m.docs[d.label]++;
      var cnt = m.counts[d.label];
      d.feats.forEach(function (f) {
        cnt[f] = (cnt[f] || 0) + 1;
        m.total[d.label]++;
        if (!m.vocab[f]) { m.vocab[f] = 0; m.V++; if (d.display && d.display[f]) m.display[f] = d.display[f]; }
        m.vocab[f]++;
      });
    });
    return m;
  }

  function count(m, f, c) { return m.counts[c][f] || 0; }
  /* P(word | label) with add-one smoothing */
  function prob(m, f, c) { return (count(m, f, c) + m.alpha) / (m.total[c] + m.alpha * m.V); }
  function logLik(m, f, c) { return Math.log(prob(m, f, c)); }
  function logPrior(m, c) { return m.docs[c] > 0 && m.N > 0 ? Math.log(m.docs[c] / m.N) : -Infinity; }

  function softmax(scores) {
    var mx = -Infinity;
    scores.forEach(function (s) { if (s > mx) mx = s; });
    if (mx === -Infinity) return scores.map(function () { return 1 / scores.length; });
    var ex = scores.map(function (s) { return s === -Infinity ? 0 : Math.exp(s - mx); });
    var sum = ex.reduce(function (a, b) { return a + b; }, 0);
    return ex.map(function (e) { return e / sum; });
  }
  function argmax(a) { var b = 0; for (var i = 1; i < a.length; i++) if (a[i] > a[b]) b = i; return b; }

  /* predict(model, feats) -> {scores, probs, best, known:[features in vocab], unknown:[...] } */
  function predict(m, feats) {
    var known = [], unknown = [];
    feats.forEach(function (f) { (m.vocab[f] ? known : unknown).push(f); });
    var scores = m.labels.map(function (c) {
      var s = logPrior(m, c);
      if (s === -Infinity) return s;
      for (var i = 0; i < known.length; i++) s += logLik(m, known[i], c);
      return s;
    });
    var probs = softmax(scores);
    return { scores: scores, probs: probs, best: argmax(probs), known: known, unknown: unknown };
  }

  /* How strongly one feature points to each label. push = how much more likely (log) in its best label
     than in the next-best label; ratio = e^push ("× more likely"). */
  function wordInfo(m, f) {
    if (!m.vocab[f]) return null;
    var live = m.labels.filter(function (c) { return m.docs[c] > 0; });
    var ll = m.labels.map(function (c) { return logLik(m, f, c); });
    var counts = m.labels.map(function (c) { return count(m, f, c); });
    var order = m.labels.map(function (c, i) { return i; }).filter(function (i) { return m.docs[m.labels[i]] > 0; })
      .sort(function (a, b) { return ll[b] - ll[a] || a - b; });
    var best = order[0], second = order.length > 1 ? order[1] : order[0];
    var push = live.length > 1 ? ll[best] - ll[second] : 0;
    return {
      ll: ll, counts: counts, best: best, second: second, push: push, ratio: Math.exp(push),
      probs: ll.map(Math.exp), num: counts.map(function (n) { return n + m.alpha; }),
      den: m.labels.map(function (c) { return m.total[c] + m.alpha * m.V; })
    };
  }

  /* Most telling words for label index li: highest "push" towards that label. */
  function topWords(m, li, k, wordsOnly) {
    var c = m.labels[li], res = [];
    var minCount = 2;
    for (var pass = 0; pass < 2 && res.length < k; pass++) {
      res = [];
      Object.keys(m.vocab).forEach(function (f) {
        if (wordsOnly && f.indexOf(' ') >= 0) return;
        var n = count(m, f, c);
        if (n < minCount) return;
        var mine = logLik(m, f, c), other = -Infinity;
        m.labels.forEach(function (d) { if (d !== c && m.docs[d] > 0) { var v = logLik(m, f, d); if (v > other) other = v; } });
        if (other === -Infinity) return;
        var push = mine - other;
        if (push > 0.01) res.push({ f: f, push: push, n: n });
      });
      minCount = 1;
    }
    res.sort(function (a, b) { return b.push - a.push || b.n - a.n || (a.f < b.f ? -1 : 1); });
    return res.slice(0, k);
  }

  /* Accuracy on the training sentences themselves, and a fair "leave-one-out" test:
     hide each sentence, use the counts of all the others, and guess the hidden one. */
  function evaluate(m, docs) {
    var trainOK = 0, fairOK = 0, mistakes = [], n = 0;
    docs.forEach(function (d, di) {
      var yi = m.labels.indexOf(d.label);
      if (yi < 0) return;
      n++;
      if (predict(m, d.feats).best === yi) trainOK++;
      // ---- leave this one out ----
      var rc = Object.create(null);
      d.feats.forEach(function (f) { rc[f] = (rc[f] || 0) + 1; });
      var keys = Object.keys(rc), Vp = m.V;
      keys.forEach(function (f) { if (m.vocab[f] === rc[f]) Vp--; });
      var Np = m.N - 1, len = d.feats.length;
      var scores = m.labels.map(function (c) {
        var dc = m.docs[c] - (c === d.label ? 1 : 0);
        if (dc <= 0 || Np <= 0) return -Infinity;
        var s = Math.log(dc / Np), tot = m.total[c] - (c === d.label ? len : 0);
        keys.forEach(function (f) {
          if (m.vocab[f] - rc[f] <= 0) return;                    // word only in the hidden sentence: unknown
          var cnt = count(m, f, c) - (c === d.label ? rc[f] : 0);
          s += rc[f] * Math.log((cnt + m.alpha) / (tot + m.alpha * Vp));
        });
        return s;
      });
      var allDead = scores.every(function (s) { return s === -Infinity; });
      var g = allDead ? -1 : argmax(scores);
      if (g === yi) fairOK++; else mistakes.push({ index: di, guess: g, label: yi });
    });
    return { n: n, trainAcc: n ? trainOK / n : 0, fairAcc: n ? fairOK / n : 0, mistakes: mistakes };
  }

  var NB = { tokenize: tokenize, features: features, norm: norm, train: train, predict: predict, prob: prob, logLik: logLik, logPrior: logPrior, wordInfo: wordInfo, topWords: topWords, evaluate: evaluate, count: count, softmax: softmax };
  if (typeof module !== 'undefined' && module.exports) module.exports = NB; else root.MoodNB = NB;
})(typeof window !== 'undefined' ? window : this);
