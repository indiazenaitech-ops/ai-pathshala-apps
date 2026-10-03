/* Build a Chatbot: the bot's "brain".
   A plain rule-based intent matcher (no AI model): clean the text, split it into words,
   drop common words, then score every example phrase by how many of its words appear
   in the message. Works for all 12 languages (Unicode-aware, Intl.Segmenter when present). */
(function (root) {
  'use strict';

  var PUNCT;
  try { PUNCT = new RegExp('[\\p{P}\\p{S}]', 'gu'); }
  catch (e) { PUNCT = /[!-\/:-@\[-`{-~¡-¿‐-‧‰-⁞।॥،؛؟٪-٭۔　-〿]/g; }

  /* Malayalam atomic chillu letters -> consonant + virama, so both ways of typing match. */
  var CHILLU = { 'ൺ': 'ണ്', 'ൻ': 'ന്', 'ർ': 'ര്', 'ൽ': 'ല്', 'ൾ': 'ള്', 'ൿ': 'ക്' };

  function nf(s, form) { try { return s.normalize(form); } catch (e) { return s; } }

  /* Step 1 "Clean": small letters, no punctuation/emoji, spelling-friendly forms. */
  function normalize(text) {
    var s = nf(String(text == null ? '' : text), 'NFD');
    s = s.replace(/[़়਼઼଼಼]/g, '');      // nukta: फ़ीस = फीस
    s = nf(s, 'NFC').toLowerCase()
      .replace(/[​-‍⁠﻿︀-️⃣]/g, '')  // zero-width joiners, emoji selectors
      .replace(/ँ/g, 'ं')                                    // chandrabindu = anusvara (हाँ = हां)
      .replace(/[ൺ-ൿ]/g, function (c) { return CHILLU[c]; })
      .replace(/[ً-ٰٟـ]/g, '')                     // Urdu/Arabic short-vowel marks
      .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک') // Arabic yeh/kaf = Urdu forms
      .replace(/['‘’`ʼ]/g, '')                          // don't = dont
      .replace(PUNCT, ' ');
    return s.replace(/\s+/g, ' ').trim();
  }

  var segs = {};
  function segmenter(lang) {
    if (!(root.Intl && root.Intl.Segmenter)) return null;
    if (!Object.prototype.hasOwnProperty.call(segs, lang)) {
      try { segs[lang] = new root.Intl.Segmenter(lang || 'en', { granularity: 'word' }); } catch (e) { segs[lang] = null; }
    }
    return segs[lang];
  }

  /* Step 2 "Split": cleaned text -> list of words. */
  function words(norm, lang) {
    if (!norm) return [];
    var seg = segmenter(lang || 'en'), out = [];
    if (seg) {
      try {
        var it = seg.segment(norm)[Symbol.iterator](), r;
        while (!(r = it.next()).done) if (r.value.isWordLike) out.push(r.value.segment);
        if (out.length) return out;
      } catch (e) { out = []; }
    }
    return norm.split(' ').filter(Boolean);
  }

  function uniq(a) { var seen = {}, out = []; a.forEach(function (x) { if (!seen[x]) { seen[x] = 1; out.push(x); } }); return out; }

  /* "Similar word endings": book = books, छुट्टी = छुट्टियाँ, நூலகம் = நூலகத்தில். */
  function similar(a, b) {
    if (a === b) return true;
    var A = Array.from(a), B = Array.from(b);
    var s = Math.min(A.length, B.length), l = Math.max(A.length, B.length), cp = 0;
    if (s < 3) return false;
    while (cp < s && A[cp] === B[cp]) cp++;
    if (cp === s) return cp / l >= 0.5;                 // one word is the start of the other
    return s >= 6 && cp >= 4 && cp >= 0.6 * s;            // long words sharing most of their start
  }

  function stopSet(text, lang) {
    var set = {};
    words(normalize(text || ''), lang).forEach(function (w) { set[w] = 1; });
    return set;
  }

  /* Prepare a bot once: clean and split every example phrase. */
  function compile(bot) {
    var lang = (bot && bot.lang) || 'en';
    var stop = stopSet(bot && bot.stopwords, lang);
    var intents = ((bot && bot.intents) || []).map(function (it) {
      var phrases = [];
      (it.examples || []).forEach(function (raw) {
        var norm = normalize(raw);
        if (!norm) return;
        var list = words(norm, lang);
        if (!list.length) return;
        var all = uniq(list);
        phrases.push({ raw: String(raw), all: all, imp: all.filter(function (w) { return !stop[w]; }), seq: list.join(' ') });
      });
      return { name: it.name, phrases: phrases };
    });
    return { lang: lang, stop: stop, intents: intents };
  }

  function better(sc, n, exact, best) {
    if (sc !== best.score) return sc > best.score;
    if (n !== best.matched.length) return n > best.matched.length;
    return exact && !best.exact;
  }

  /* Steps 3-5: drop common words, score every example, pick the best intent.
     opts: { threshold (0-100), useStop, fuzzy } */
  function match(c, text, opts) {
    opts = opts || {};
    var thr = opts.threshold == null ? 50 : +opts.threshold;
    var useStop = opts.useStop !== false, fuzzy = opts.fuzzy !== false;
    var U = words(normalize(text), c.lang);
    var seq = ' ' + U.join(' ') + ' ';
    var Uall = uniq(U);
    var Ui = useStop ? Uall.filter(function (w) { return !c.stop[w]; }) : Uall;
    var ignored = useStop ? Uall.filter(function (w) { return c.stop[w]; }) : [];

    var scores = c.intents.map(function (it, i) {
      var best = { i: i, name: it.name, score: 0, matched: [], example: '', exact: false };
      it.phrases.forEach(function (p) {
        var onlyCommon = !p.imp.length;                 // e.g. "how are you": use every word
        var P = useStop && !onlyCommon ? p.imp : p.all;
        var Uu = useStop && !onlyCommon ? Ui : Uall;
        var matched = [];
        P.forEach(function (w) {
          for (var k = 0; k < Uu.length; k++) {
            if (Uu[k] === w || (fuzzy && similar(Uu[k], w))) { matched.push({ user: Uu[k], ex: w }); return; }
          }
        });
        var exact = seq.indexOf(' ' + p.seq + ' ') >= 0;
        var sc = exact ? 100 : Math.round(100 * matched.length / P.length);
        if (!matched.length && !exact) sc = 0;
        if (better(sc, matched.length, exact, best)) {
          best = { i: i, name: it.name, score: sc, matched: matched, example: p.raw, exact: exact };
        }
      });
      return best;
    });

    var win = null;
    scores.forEach(function (s) {
      if (!s.matched.length && !s.exact) return;
      if (!win || better(s.score, s.matched.length, s.exact, win)) win = s;
    });
    var ok = !!win && win.score >= thr;
    var sorted = scores.slice().sort(function (a, b) { return b.score - a.score || b.matched.length - a.matched.length || a.i - b.i; });
    return {
      intent: ok ? win.i : -1, score: win ? win.score : 0, best: win, scores: sorted,
      words: Ui, ignored: ignored, threshold: thr
    };
  }

  /* Bot check-up: missing parts, duplicates, and a self-test of every example. */
  function health(bot, opts) {
    var c = compile(bot), issues = [], ex = 0, rep = 0, names = {}, seen = {}, dupSeq = {};
    var intents = bot.intents || [];
    if (!intents.length) issues.push({ k: 'h_no_intents', v: {} });
    intents.forEach(function (it) {
      ex += (it.examples || []).length;
      rep += Math.min(5, (it.replies || []).length);
      if (!(it.examples || []).length) issues.push({ k: 'h_no_examples', v: { name: it.name } });
      if (!(it.replies || []).length) issues.push({ k: 'h_no_replies', v: { name: it.name } });
      var nk = normalize(it.name);
      if (nk) { if (names[nk] === 1) issues.push({ k: 'h_dup_name', v: { name: it.name } }); names[nk] = (names[nk] || 0) + 1; }
    });
    c.intents.forEach(function (it, i) {
      it.phrases.forEach(function (p) {
        if (seen[p.seq] === undefined) seen[p.seq] = i;
        else if (seen[p.seq] !== i) {
          dupSeq[p.seq] = 1;
          issues.push({ k: 'h_dup_example', v: { x: p.raw, a: intents[seen[p.seq]].name, b: intents[i].name } });
        }
      });
    });
    var n = 0, ok = 0;
    c.intents.forEach(function (it, i) {
      it.phrases.forEach(function (p) {
        n++;
        var r = match(c, p.raw, opts);
        if (r.intent === i) ok++;
        else if (r.intent >= 0 && !dupSeq[p.seq]) issues.push({ k: 'h_wrong', v: { x: p.raw, a: intents[i].name, b: intents[r.intent].name } });
      });
    });
    return { intents: intents.length, examples: ex, replies: rep, n: n, ok: ok, issues: issues };
  }

  root.CB_ENGINE = { normalize: normalize, words: words, similar: similar, compile: compile, match: match, health: health };
})(typeof window !== 'undefined' ? window : this);
