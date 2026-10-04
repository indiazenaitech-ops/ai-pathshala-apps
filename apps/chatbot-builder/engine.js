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

  /* What the student sees in "the bot's thinking": small letters, no punctuation/emoji,
     but the word keeps its own spelling (দিবস, കാന്റീനിൽ, फ़ीस are not shown "damaged"). */
  function clean(text) {
    var s = nf(String(text == null ? '' : text), 'NFC').toLowerCase()
      .replace(/['‘’`ʼ]/g, '')
      .replace(PUNCT, ' ');
    return s.replace(/\s+/g, ' ').trim();
  }

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

  /* Word-keyed maps without a prototype, so words like "constructor" or "__proto__" are ordinary words. */
  function dict() { return Object.create(null); }
  function uniq(a) { var seen = dict(), out = []; a.forEach(function (x) { if (!seen[x]) { seen[x] = 1; out.push(x); } }); return out; }

  /* Text -> { keys: matching forms in order, show: key -> the word as the student typed it }. */
  function tokens(text, lang) {
    var keys = [], show = dict();
    words(clean(text), lang).forEach(function (w) {
      normalize(w).split(' ').forEach(function (k) {
        if (!k) return;
        keys.push(k);
        if (show[k] === undefined) show[k] = w;
      });
    });
    return { keys: keys, show: show };
  }

  /* "Similar word endings": book = books, छुट्टी = छुट्टियाँ, நூலகம் = நூலகத்தில். */
  function similar(a, b) {
    return a === b || simArr(Array.from(a), Array.from(b));
  }
  function simArr(A, B) {
    var s = Math.min(A.length, B.length), l = Math.max(A.length, B.length), cp = 0;
    if (s < 3) return false;
    while (cp < s && A[cp] === B[cp]) cp++;
    if (cp === s) return cp / l >= 0.5;                 // one word is the start of the other
    return s >= 6 && cp >= 4 && cp >= 0.6 * s;            // long words sharing most of their start
  }

  function stopSet(text, lang) {
    var set = dict();
    tokens(text || '', lang).keys.forEach(function (w) { set[w] = 1; });
    return set;
  }

  /* Prepare a bot once: clean and split every example phrase, and index the words
     (word -> examples that use it) so a message is compared only with examples that share a word. */
  function compile(bot) {
    var lang = (bot && bot.lang) || 'en';
    var stop = stopSet(bot && bot.stopwords, lang);
    var list = [], byWord = dict(), byPre = dict(), cps = dict();
    var intents = ((bot && bot.intents) || []).map(function (it) {
      var phrases = [];
      (it.examples || []).forEach(function (raw) {
        var tk = tokens(raw, lang), keys = tk.keys;
        if (!keys.length) return;
        var all = uniq(keys), imp = all.filter(function (w) { return !stop[w]; });
        var p = { id: list.length, raw: String(raw), all: all, imp: imp, onlyCommon: !imp.length, seq: keys.join(' '), show: tk.show };
        list.push(p); phrases.push(p);
        all.forEach(function (w) {
          if (!byWord[w]) { byWord[w] = []; cps[w] = Array.from(w); var k = cps[w].slice(0, 3).join(''); (byPre[k] = byPre[k] || []).push(w); }
          byWord[w].push(p.id);
        });
      });
      return { name: it.name, phrases: phrases };
    });
    return { lang: lang, stop: stop, intents: intents, byWord: byWord, byPre: byPre, cps: cps, size: list.length };
  }

  function better(sc, n, exact, best) {
    if (sc !== best.score) return sc > best.score;
    if (n !== best.matched.length) return n > best.matched.length;
    return exact && !best.exact;
  }

  /* Example words that a message word counts as: itself, plus similar words when "word endings" is on. */
  function likeWords(c, u, fuzzy) {
    if (!fuzzy) return c.byWord[u] ? [u] : [];
    var A = Array.from(u), out = [];
    (c.byPre[A.slice(0, 3).join('')] || []).forEach(function (w) { if (u === w || simArr(A, c.cps[w])) out.push(w); });
    return out;
  }
  /* For every example word: the first message word (in order) that is the same or similar. */
  function hits(U, like) {
    var h = dict();
    U.forEach(function (u) { like[u].forEach(function (w) { if (h[w] === undefined) h[w] = u; }); });
    return h;
  }

  /* Steps 3-5: drop common words, score every example, pick the best intent.
     opts: { threshold (0-100), useStop, fuzzy } */
  function match(c, text, opts) {
    opts = opts || {};
    var thr = opts.threshold == null ? 50 : +opts.threshold;
    var useStop = opts.useStop !== false, fuzzy = opts.fuzzy !== false;
    var tk = tokens(text, c.lang), U = tk.keys;
    var seq = ' ' + U.join(' ') + ' ';
    function sh(w) { return tk.show[w] || w; }
    var Uall = uniq(U);
    var Ui = useStop ? Uall.filter(function (w) { return !c.stop[w]; }) : Uall;
    var ignored = useStop ? Uall.filter(function (w) { return c.stop[w]; }) : [];
    var like = dict();
    Uall.forEach(function (u) { like[u] = likeWords(c, u, fuzzy); });
    var hitAll = hits(Uall, like), hitImp = useStop ? hits(Ui, like) : hitAll;
    /* Only examples sharing at least one word can score above 0. */
    var cand = new Array(c.size), w, ids, k;
    for (w in hitAll) for (ids = c.byWord[w], k = 0; k < ids.length; k++) cand[ids[k]] = 1;

    var scores = c.intents.map(function (it, i) {
      var best = { i: i, name: it.name, score: 0, matched: [], example: '', exact: false };
      it.phrases.forEach(function (p) {
        if (!cand[p.id]) return;
        var useAll = !useStop || p.onlyCommon;         // e.g. "how are you": use every word
        var P = useAll ? p.all : p.imp, H = useAll ? hitAll : hitImp;
        var n = 0, k;
        for (k = 0; k < P.length; k++) if (H[P[k]] !== undefined) n++;
        if (!n) return;
        /* The whole example inside the message? Only possible when every word was found. */
        var exact = n === P.length && seq.indexOf(' ' + p.seq + ' ') >= 0;
        var sc = exact ? 100 : Math.round(100 * n / P.length);
        if (!better(sc, n, exact, best)) return;
        var matched = [];
        P.forEach(function (w) {
          var u = H[w];
          if (u !== undefined) matched.push({ user: sh(u), ex: p.show[w] || w, same: u === w });
        });
        best = { i: i, name: it.name, score: sc, matched: matched, example: p.raw, exact: exact };
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
    /* Same score for two intents? Say why the winner won: more matching words, the whole phrase, or it comes first. */
    var tie = '', tieWith = null;
    if (win) scores.forEach(function (s) {
      if (s === win || tie || s.score !== win.score || (!s.matched.length && !s.exact)) return;
      tie = s.matched.length < win.matched.length ? 'words' : (win.exact && !s.exact ? 'exact' : 'order');
      tieWith = s.name;
    });
    return {
      intent: ok ? win.i : -1, score: win ? win.score : 0, best: win, scores: sorted, tie: tie, tieWith: tieWith,
      words: Ui.map(sh), ignored: ignored.map(sh), threshold: thr
    };
  }

  /* Bot check-up: missing parts, duplicates, and a self-test of every example. */
  function health(bot, opts) {
    var c = compile(bot), issues = [], ex = 0, rep = 0, names = dict(), seen = dict(), dupSeq = dict();
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

  root.CB_ENGINE = { normalize: normalize, clean: clean, tokens: tokens, words: words, similar: similar, compile: compile, match: match, health: health };
})(typeof window !== 'undefined' ? window : this);
