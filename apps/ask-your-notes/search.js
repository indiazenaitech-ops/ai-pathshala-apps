/* Ask Your Notes: the search engine that needs no download.
   - chunk(): notes (pages of plain text) → passages of about 3 sentences, each with its page number,
     section heading and sentence list.
   - BM25 keyword search: Unicode-aware tokens (works for every Indian script), a light English and
     Hindi/Marathi suffix trim, and prefix matching so "இலை" also finds "இலைகள்" (Tamil, Telugu,
     Kannada and Malayalam glue endings onto words).
   - cosine() and helpers for the AI (embedding) search in app.js.
   Pure functions, no DOM: window.AYN. */
(function () {
  'use strict';

  var TERM_END = /[.?!।॥۔؟]["'”’)\]]*$/;          // sentence-final punctuation (Latin, Indic danda, Urdu)
  var ABBR = /(?:^|\s)(?:mr|mrs|ms|dr|prof|st|no|fig|vs|etc|e\.g|i\.e|govt|approx|sr|jr|rs)\.$/i;
  var PAGE_MARK = /^\s*-{3,}[^\d\n]{0,24}?(\d{1,4})[^\d\n]{0,12}-{3,}\s*$/;
  var MAX_SENT = 420;

  /* ----------------------------------------------------------------- sentences */
  function splitSentences(text) {
    var s = String(text || '').replace(/\s+/g, ' ').trim();
    if (!s) return [];
    var out = [], re = /([.?!।॥۔؟]+["'”’)\]]*)\s+(?=\S)/g, last = 0, m;
    while ((m = re.exec(s))) {
      var end = m.index + m[1].length, piece = s.slice(last, end);
      if (ABBR.test(piece) || /(?:^|\s)\p{Lu}\.$/u.test(piece)) continue;   // "Dr." / "A. P. J." are not sentence ends
      out.push(piece.trim()); last = re.lastIndex;
    }
    if (last < s.length) out.push(s.slice(last).trim());
    /* very long "sentences" (lists, tables, text without full stops) are cut at a space */
    var res = [];
    out.forEach(function (x) {
      while (x.length > MAX_SENT) {
        var cut = x.lastIndexOf(' ', MAX_SENT);
        if (cut < MAX_SENT * 0.5) cut = MAX_SENT;
        res.push(x.slice(0, cut).trim()); x = x.slice(cut).trim();
      }
      if (x) res.push(x);
    });
    return res.filter(function (x) { return /[\p{L}\p{N}]/u.test(x); });
  }

  /* ----------------------------------------------------------------- pages */
  /* Text typed or pasted by the user may contain page marks like "--- Page 3 ---" (we write them when a
     PDF or the sample is loaded). Returns [{page: n|null, text}] */
  function splitPages(text) {
    var lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
    var pages = [], cur = { page: null, lines: [] };
    lines.forEach(function (ln) {
      var m = PAGE_MARK.exec(ln);
      if (m) {
        if (cur.lines.join('').trim()) pages.push({ page: cur.page, text: cur.lines.join('\n') });
        cur = { page: +m[1], lines: [] };
      } else cur.lines.push(ln);
    });
    if (cur.lines.join('').trim()) pages.push({ page: cur.page, text: cur.lines.join('\n') });
    return pages;
  }

  function isHeading(line, hasMore) {
    var l = line.trim();
    if (!hasMore || !l || l.length > 90) return false;
    if (TERM_END.test(l) || /[,;]$/.test(l)) return false;
    var words = l.split(/\s+/).length;
    return words <= 12;
  }

  /* ----------------------------------------------------------------- passages */
  /* pages: [{page, text}] → passages [{id, page, heading, text, sentences, block}] */
  function chunk(pages, opts) {
    opts = opts || {};
    var target = opts.target || 3, maxChars = opts.maxChars || 520, maxPassages = opts.max || 3000;
    var out = [], blockNo = 0, pendingHead = '';
    for (var p = 0; p < pages.length && out.length < maxPassages; p++) {
      var pg = pages[p];
      var blocks = String(pg.text || '').replace(/\r\n?/g, '\n').split(/\n[ \t]*\n+/);
      pendingHead = '';
      for (var b = 0; b < blocks.length && out.length < maxPassages; b++) {
        var lines = blocks[b].split('\n').map(function (x) { return x.replace(/\s+/g, ' ').trim(); }).filter(Boolean);
        if (!lines.length) continue;
        var head = pendingHead; pendingHead = '';
        /* a block that is one short line without a full stop is the heading of the next block */
        if (lines.length === 1 && isHeading(lines[0], true) && b < blocks.length - 1) { pendingHead = lines[0]; continue; }
        if (lines.length > 1 && isHeading(lines[0], true)) head = (head ? head + ' · ' : '') + lines.shift();
        /* join wrapped lines; "photo-\nsynthesis" → "photosynthesis" */
        var body = '';
        lines.forEach(function (ln) {
          if (!body) body = ln;
          else if (/\p{Ll}-$/u.test(body) && /^\p{Ll}/u.test(ln)) body = body.slice(0, -1) + ln;
          else body += ' ' + ln;
        });
        var sents = splitSentences(body);
        if (!sents.length) { if (head) pendingHead = head; continue; }
        blockNo++;
        var groups = [], g = [], len = 0;
        sents.forEach(function (s) {
          if (g.length && (g.length >= target || len + s.length > maxChars)) { groups.push(g); g = []; len = 0; }
          g.push(s); len += s.length + 1;
        });
        if (g.length) {
          /* don't leave a lonely short sentence at the end */
          var tail = g.join(' ');
          if (groups.length && g.length === 1 && tail.length < 140) groups[groups.length - 1] = groups[groups.length - 1].concat(g);
          else groups.push(g);
        }
        groups.forEach(function (gr, i) {
          if (out.length >= maxPassages) return;
          out.push({ id: out.length, page: pg.page, heading: i === 0 ? head : '', head: head, text: gr.join(' '), sentences: gr, block: blockNo });
        });
      }
    }
    return out;
  }

  /* ----------------------------------------------------------------- tokens */
  var STOP = {};
  ('a an the and or but if of to in on at by for with from as is are was were be been being am do does did done ' +
   'it its this that these those there here what which who whom whose why how when where can could shall should will ' +
   'would may might must has have had having i you he she we they me him her us them my your his our their not no so ' +
   'than then too very just also into about over under up down out more most some any each other such only own same ' +
   'tell explain describe define please').split(' ').forEach(function (w) { STOP[w] = 1; });
  ('का के की है हैं था थे थी में और से को यह वह ये वे एक पर भी तो क्या कैसे क्यों कौन कब कहाँ कहां होता होती होते ' +
   'हो होना जाता जाती जाते कर करते करती करता किया कि ने लिए इस उस इन उन बताइए बताओ बताएँ समझाइए ' +
   /* Marathi */ 'आहे आहेत होते होता असते असतात असतो काय कसे कसा कशी कोण कधी कुठे आणि व या हा ही हे ते ती तो त्या मध्ये साठी पण तर म्हणून ' +
   /* Bengali */ 'এবং ও আর কি কী কেন কীভাবে কোথায় কখন কে এই সেই এটা হয় হলো থাকে আছে ছিল করে জন্য দিয়ে থেকে না যে তা এর তার ' +
   /* Gujarati */ 'છે છો હતું હતા હતી અને કે શું કેમ કેવી રીતે ક્યાં ક્યારે કોણ આ તે એ નો ની નું ના માં થી માટે પણ હોય થાય જે ' +
   /* Punjabi */ 'ਹੈ ਹਨ ਸੀ ਸਨ ਦਾ ਦੇ ਦੀ ਦੀਆਂ ਨੂੰ ਵਿੱਚ ਤੋਂ ਨੇ ਅਤੇ ਤੇ ਕਿ ਕੀ ਕਿਉਂ ਕਿਵੇਂ ਕਿੱਥੇ ਕਦੋਂ ਕੌਣ ਇਹ ਉਹ ਇਸ ਉਸ ਹੁੰਦਾ ਹੁੰਦੀ ਹੁੰਦੇ ਜੋ ਵੀ ਲਈ ਨਾਲ ਉੱਤੇ ' +
   /* Odia */ 'ଓ ଏବଂ କି କଣ କାହିଁକି କିପରି କେଉଁଠି କେବେ କିଏ ଏହି ସେହି ଏହା ସେ ହୁଏ ଅଛି ଥାଏ ଥିଲା ପାଇଁ ମଧ୍ୟ ଯେ ନାହିଁ ' +
   /* Tamil */ 'ஏன் எப்படி என்ன எங்கே எப்போது யார் மற்றும் ஒரு இந்த அந்த இது அது உள்ளது உள்ளன என்று ஆகும் போது அல்லது ' +
   /* Telugu */ 'ఎందుకు ఎలా ఏమిటి ఏమి ఎక్కడ ఎప్పుడు ఎవరు మరియు ఒక ఈ ఆ ఇది అది ఉంటుంది ఉంటాయి ఉంది అని కూడా ' +
   /* Kannada */ 'ಏಕೆ ಹೇಗೆ ಏನು ಎಲ್ಲಿ ಯಾವಾಗ ಯಾರು ಮತ್ತು ಒಂದು ಈ ಆ ಇದು ಅದು ಇದೆ ಇವೆ ಇರುತ್ತದೆ ಇರುತ್ತವೆ ಎಂದು ಕೂಡ ' +
   /* Malayalam */ 'എന്തുകൊണ്ട് എങ്ങനെ എന്ത് എവിടെ എപ്പോൾ ആര് ഒരു ഈ ആ ഇത് അത് ഉണ്ട് ആണ് എന്ന് എന്നു ' +
   /* Urdu */ 'کا کے کی ہے ہیں تھا تھے تھی میں اور سے کو یہ وہ ایک پر بھی تو کیا کیسے کیوں کون کب کہاں ہوتا ہوتی ہوتے کہ نے لیے اس ان'
  ).split(' ').forEach(function (w) { STOP[w] = 1; });

  var DEVA_SUFFIX = ['ियाँ', 'ियां', 'ियों', 'ाओं', 'ाएँ', 'ाएं', 'ाने', 'ाना', 'ानी', 'ओं', 'ों', 'ें', 'ाँ', 'ां', 'ीं', 'ी', 'ा', 'े'];

  function stemLatin(w) {
    if (w.length > 4 && /ies$/.test(w)) return w.slice(0, -3) + 'y';
    if (w.length > 5 && /sses$/.test(w)) return w.slice(0, -2);
    if (w.length > 5 && /ing$/.test(w)) return w.slice(0, -3);
    if (w.length > 4 && /ed$/.test(w) && !/eed$/.test(w)) return w.slice(0, -2);
    if (w.length > 3 && /s$/.test(w) && !/(ss|us|is)$/.test(w)) return w.slice(0, -1);
    return w;
  }
  function stemDeva(w) {
    w = w.replace(/़/g, '');                       // nukta: ज़ → ज
    if (w.length < 4) return w;
    for (var i = 0; i < DEVA_SUFFIX.length; i++) {
      var s = DEVA_SUFFIX[i];
      if (w.length - s.length >= 2 && w.slice(-s.length) === s) return w.slice(0, -s.length);
    }
    return w;
  }
  function tokens(text) {
    var raw = String(text || '').normalize('NFC').toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) || [];
    var out = [];
    for (var i = 0; i < raw.length; i++) {
      var w = raw[i].replace(/[‌‍]/g, '');
      if (!w || STOP[w]) continue;
      if (/^[a-z]+$/.test(w)) { if (w.length < 2) continue; w = stemLatin(w); }
      else if (/[ऀ-ॿ]/.test(w)) w = stemDeva(w);
      else if (w.length < 2 && !/\d/.test(w)) continue;
      out.push(w);
    }
    return out;
  }

  /* ----------------------------------------------------------------- BM25 */
  function buildIndex(passages) {
    var df = Object.create(null), docs = [], total = 0;
    passages.forEach(function (p) {
      var tf = Object.create(null), toks = tokens((p.head ? p.head + ' ' : '') + p.text);
      toks.forEach(function (w) { tf[w] = (tf[w] || 0) + 1; });
      Object.keys(tf).forEach(function (w) { df[w] = (df[w] || 0) + 1; });
      docs.push({ tf: tf, len: toks.length });
      total += toks.length;
    });
    return { df: df, docs: docs, N: passages.length, avg: total / Math.max(1, passages.length), vocab: Object.keys(df) };
  }

  function commonPrefix(a, b) { var n = Math.min(a.length, b.length), i = 0; while (i < n && a.charCodeAt(i) === b.charCodeAt(i)) i++; return i; }

  /* query term → [{term, w}] : the exact term plus near forms (shared start of the word) */
  function expand(idx, q) {
    var out = [];
    if (idx.df[q]) out.push({ term: q, w: 1 });
    if (q.length >= 3 && !/^\d+$/.test(q)) {
      for (var i = 0; i < idx.vocab.length; i++) {
        var v = idx.vocab[i];
        if (v === q || v.length < 3) continue;
        var short = Math.min(v.length, q.length), long = Math.max(v.length, q.length), cp = commonPrefix(v, q);
        if (cp === short && short >= 0.5 * long) out.push({ term: v, w: 0.7 });
        else if (cp >= 4 && cp >= 0.75 * short && /[^\x00-\x7f]/.test(q)) out.push({ term: v, w: 0.5 });
      }
    }
    return out;
  }

  function idf(idx, term) { var n = idx.df[term] || 0; return Math.log(1 + (idx.N - n + 0.5) / (n + 0.5)); }

  /* → [{i, score, terms: {term: weight}}] sorted, best first (only passages that match something) */
  function bm25(idx, query, k) {
    var K1 = 1.2, B = 0.75;
    var qs = tokens(query), seen = {}, plan = [];
    qs.forEach(function (q) { if (!seen[q]) { seen[q] = 1; plan.push(expand(idx, q)); } });
    var res = [];
    for (var d = 0; d < idx.docs.length; d++) {
      var doc = idx.docs[d], score = 0, hit = null;
      for (var j = 0; j < plan.length; j++) {
        var best = 0, bestTerm = null;
        for (var e = 0; e < plan[j].length; e++) {
          var x = plan[j][e], tf = doc.tf[x.term];
          if (!tf) continue;
          var s = x.w * idf(idx, x.term) * tf * (K1 + 1) / (tf + K1 * (1 - B + B * doc.len / (idx.avg || 1)));
          if (s > best) { best = s; bestTerm = x.term; }
        }
        if (best > 0) { score += best; (hit = hit || {})[bestTerm] = 1; }
      }
      if (score > 0) res.push({ i: d, score: score, terms: hit });
    }
    res.sort(function (a, b) { return b.score - a.score; });
    return res.slice(0, k || 5);
  }

  /* which sentence of a passage holds the most (rare) query words */
  function bestSentenceBM25(idx, sentences, query) {
    if (!sentences || sentences.length < 2) return 0;
    var qs = tokens(query), plans = qs.map(function (q) { return expand(idx, q); });
    var best = 0, bestScore = -1;
    sentences.forEach(function (s, i) {
      var toks = {}; tokens(s).forEach(function (w) { toks[w] = 1; });
      var sc = 0;
      plans.forEach(function (pl) {
        var m = 0;
        pl.forEach(function (x) { if (toks[x.term]) m = Math.max(m, x.w * idf(idx, x.term)); });
        sc += m;
      });
      if (sc > bestScore + 1e-9) { bestScore = sc; best = i; }
    });
    return best;
  }

  /* ----------------------------------------------------------------- vectors */
  function cosine(a, b) {
    var dot = 0, na = 0, nb = 0;
    for (var i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
    return dot / (Math.sqrt(na * nb) || 1);
  }

  /* small stable hash for caching vectors by text */
  function hash(s) {
    var h1 = 0x811c9dc5, h2 = 0x01000193;
    for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619); h2 = Math.imul(h2 + c, 2246822519); }
    return (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36) + s.length.toString(36);
  }

  window.AYN = {
    splitSentences: splitSentences, splitPages: splitPages, chunk: chunk, tokens: tokens,
    buildIndex: buildIndex, bm25: bm25, bestSentenceBM25: bestSentenceBM25, cosine: cosine, hash: hash
  };
})();
