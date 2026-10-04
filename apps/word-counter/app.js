/* Essay & Word Counter: live counts that work for every script (Intl.Segmenter with a regex
   fallback), a word-limit bar with exam presets, long-sentence and repeated-word checks,
   English readability, autosave, and localized format guides. Everything stays on the device. */
(function () {
  'use strict';
  var SLUG = 'word-counter';
  var store = EDU.store(SLUG);
  EDU.init({ slug: SLUG, title: 'app_title' });

  var $ = EDU.$, t = EDU.t, fmt = EDU.fmt, esc = EDU.esc;

  /* ---------------- settings ---------------- */
  var READ_WPM = 200, SPEAK_WPM = 130;          // average silent reading / speaking speeds
  var LONG = 26, VLONG = 36;                    // sentence length (words) that is long / very long
  var READ_MIN = 30;                            // English words needed before showing readability
  var FONT_MIN = 14, FONT_MAX = 44, FONT_DEF = 18;
  var MARKS = '. ? ! । ॥ ۔ ؟';
  var PRESETS = [
    { id: 'none' },
    { id: 'notice', min: 40, max: 50 },
    { id: 'para', min: 100, max: 120 },
    { id: 'letter', min: 100, max: 120 },
    { id: 'l12', min: 120, max: 150 },
    { id: 'speech', min: 150, max: 200 },
    { id: 'essay', min: 250, max: 300 },
    { id: 'custom' }
  ];
  var GUIDE_PRESET = ['notice', 'letter', 'letter', 'l12', 'l12'];   // notice, formal, informal, article, report
  var GUIDE_ICON = ['📌', '✉️', '💌', '📰', '📝'];

  /* Small "function words" skipped in the repeated-words list (English, Hindi and a few common ones per language). */
  var STOP = Object.create(null);
  ('the a an and or but if of to in on at by for with from as is am are was were be been being it its this that these those there here ' +
   'i me my we our us you your he him his she her they them their what which who whom will would shall should can could may might must ' +
   'do does did has have had not no so very too also than then all any some such into about up out over only just more most each both ' +
   'how when where why because while after before again let one ' +
   'का के की को में से है हैं था थे थी थीं और या पर ने भी तो ही यह वह ये वे इस उस इन उन एक कि जो कर करना करते करती किया हो होता होती होते ' +
   'होना हुआ हुई हुए लिए साथ तक अपना अपने अपनी मैं हम आप तुम मेरा मेरी मेरे हमारा हमारी हमारे नहीं न जा जाता जाती जाते रहा रही रहे ' +
   'सकता सकती सकते गया गई गए दिया अब जब तब कुछ सब बहुत क्या क्यों कैसे कौन किसी किस द्वारा लेकिन परंतु किंतु तथा एवं व वाले वाली वाला ' +
   'आणि आहे आहेत होते होता होती हे ही हा ते ती तो या की पण मध्ये चा ची चे च्या ला ना नाही मी आम्ही तुम्ही त्या साठी असे केले ' +
   'এবং ও এই সেই যে না করে হয় আর থেকে জন্য তার এর ছিল আছে কিন্তু একটি একটা আমি আমরা তুমি আপনি সে তারা কি কী হবে মধ্যে সব খুব বা যা এক আমাদের তোমাদের আপনার তাদের ' +
   'અને છે હતું હતી હતા તે આ એ માં પણ ના ની નો નું ને થી એક હું અમે તમે કે જે પર માટે સાથે નથી ' +
   'ਅਤੇ ਹੈ ਹਨ ਸੀ ਦੇ ਦੀ ਦਾ ਦੀਆਂ ਨੂੰ ਵਿੱਚ ਇਹ ਉਹ ਤੋਂ ਨੇ ਵੀ ਇੱਕ ਕਿ ਜੋ ਮੈਂ ਅਸੀਂ ਤੁਸੀਂ ਲਈ ਨਾਲ ਨਹੀਂ ਤਾਂ ਹੀ ਕੇ ਜਾਂ ' +
   'ଓ ଏବଂ ଏହି ସେହି ଯେ ନାହିଁ କରି ହୁଏ ଆଉ ପାଇଁ ତାର ଏକ ମୁଁ ଆମେ ତୁମେ ସେ କି ଥିଲା ଅଛି ସହ ବା ' +
   'மற்றும் ஒரு இந்த அந்த என்று இது அது நான் நாம் நாங்கள் நீங்கள் அவர் அவர்கள் உள்ள மிகவும் ஆனால் அல்லது என் தான் ' +
   'మరియు ఒక ఈ ఆ అని ఇది అది నేను మేము మనం మీరు అతను ఆమె వారు కూడా చాలా కానీ లేదా ఉంది నా మా ' +
   'ಮತ್ತು ಒಂದು ಈ ಆ ಎಂದು ಇದು ಅದು ನಾನು ನಾವು ನೀವು ಅವರು ಹಾಗೂ ತುಂಬಾ ಆದರೆ ಅಥವಾ ಇದೆ ನನ್ನ ನಮ್ಮ ಸಹ ಕೂಡ ' +
   'ഒരു ഈ ആ ഇത് അത് ഞാൻ ഞങ്ങൾ നമ്മൾ നിങ്ങൾ അവൻ അവൾ അവർ വളരെ പക്ഷേ ഉണ്ട് ആണ് എന്റെ നമ്മുടെ കൂടി ' +
   'کا کے کی کو میں سے ہے ہیں تھا تھے تھی اور یا پر نے بھی تو ہی یہ وہ اس ان ایک کہ جو کر ہو لیے ساتھ تک اپنا اپنے اپنی ہم آپ تم نہیں گیا گئی گئے کیا بہت لیکن جب اب'
  ).split(/\s+/).forEach(function (w) { if (w) STOP[w.normalize ? w.normalize('NFC') : w] = 1; });

  /* Abbreviations whose full stop does not end a sentence. */
  var ABBR = Object.create(null);
  ('mr mrs ms dr prof sr jr st mt no nos vs etc eg ie govt dept rd co ltd pvt jan feb mar apr jun jul aug sep sept oct nov dec ' +
   'approx fig vol ch pp smt shri sh kum rs std hon col gen lt capt sgt ave est misc ref sec ' +
   'डॉ प्रो पं स्व कु सौ श्री ई पू क्र ता दि रु').split(' ').forEach(function (w) { ABBR[w] = 1; });

  /* ---------------- regex helpers (Unicode classes with fallbacks for old browsers) ---------------- */
  function rx(src, flags, fallback) { try { return new RegExp(src, flags); } catch (e) { return fallback; } }
  var IND = '\\u0900-\\u0DFF\\u0600-\\u06FF\\u0750-\\u077F';
  var RE_WORDCHAR = rx('[\\p{L}\\p{N}]', 'u', new RegExp('[A-Za-z0-9\\u00C0-\\u024F' + IND + ']'));
  var RE_LM = rx('[\\p{L}\\p{M}]', 'u', new RegExp('[A-Za-z\\u00C0-\\u024F' + IND + ']'));
  var RE_NONLETTER = rx('[^\\p{L}]', 'gu', new RegExp('[^A-Za-z\\u00C0-\\u024F' + IND + ']', 'g'));
  var RE_WORDS_FB = rx("[\\p{L}\\p{M}\\p{N}\\u200C\\u200D]+(?:['’\\-‐‑./:@_]+[\\p{L}\\p{M}\\p{N}\\u200C\\u200D]+)*", 'gu', /\S+/g);
  var RE_NUM = rx('^[\\p{N}.,:/\\-]+$', 'u', /^[0-9.,:/\-]+$/);
  var RE_LISTNO = rx('^\\s*(?:\\p{Nd}{1,3}|[ivxIVX]{1,4})$', 'u', /^\s*(?:[0-9०-९]{1,3}|[ivxIVX]{1,4})$/);
  var TERM_LAT = '.!?…', TERM_IND = '।॥۔؟', CLOSE = '"\'”’)]}»›';
  var JOIN = { '-': 1, '‐': 1, '‑': 1, "'": 1, '’': 1, '.': 1, '/': 1, ':': 1, '@': 1, '_': 1 };

  var segCache = {};
  function segmenter(gran) {
    if (!window.Intl || !Intl.Segmenter) return null;
    var tag = EDU.langInfo(EDU.lang).tag, k = tag + ':' + gran;
    if (segCache[k] === undefined) { try { segCache[k] = new Intl.Segmenter(tag, { granularity: gran }); } catch (e) { segCache[k] = null; } }
    return segCache[k];
  }

  /* ---------------- text analysis ---------------- */
  /* Words with their offsets. Word-like pieces joined by a hyphen, apostrophe, dot, slash, colon, @ or _
     with no space (well-known, don't, U.S.A, e.g, and/or, 10:30, www.cbse.gov.in) or touching each other
     with no gap (10वीं) count as ONE word, the way students and word processors count. */
  function isJoin(seg) {
    for (var k = 0; k < seg.length; k++) if (!JOIN[seg[k]]) return false;
    return seg.length > 0;
  }
  function getWords(text) {
    var out = [], sg = segmenter('word');
    if (sg) {
      var it = sg.segment(text)[Symbol.iterator](), r, last = null, joinAt = -1;
      while (!(r = it.next()).done) {
        var g = r.value, end = g.index + g.segment.length;
        if (g.isWordLike) {
          if (last && (g.index === last.e || g.index === joinAt)) last.e = end;
          else { last = { s: g.index, e: end }; out.push(last); }
          joinAt = -1;
        } else if (last && (g.index === last.e || g.index === joinAt) && isJoin(g.segment)) joinAt = end;
        else joinAt = -1;
      }
      return out;
    }
    RE_WORDS_FB.lastIndex = 0;
    var m;
    while ((m = RE_WORDS_FB.exec(text))) {
      if (RE_WORDCHAR.test(m[0])) out.push({ s: m.index, e: m.index + m[0].length });
      if (!m[0].length) RE_WORDS_FB.lastIndex++;
    }
    return out;
  }

  /* Characters as the eye sees them (grapheme clusters: कि = 1). Line breaks are not counted. */
  function countChars(text) {
    var all = 0, ns = 0, sg = segmenter('grapheme');
    var add = function (c) {
      if (c === '\n' || c === '\r' || c === '\r\n') return;
      all++;
      if (!/^\s+$/.test(c)) ns++;
    };
    if (sg) {
      var it = sg.segment(text)[Symbol.iterator](), r;
      while (!(r = it.next()).done) add(r.value.segment);
    } else Array.from(text).forEach(add);
    return { all: all, ns: ns };
  }

  function prevWord(line, i) { var j = i; while (j > 0 && RE_LM.test(line[j - 1])) j--; return line.slice(j, i); }
  function isSpace(c) { return /\s/.test(c); }

  /* Sentences: end at . ! ? … । ॥ ۔ ؟ (and | typed as a danda). Every line is split separately, so a
     heading without a full stop is one sentence. Abbreviations (Dr., Mr., Rs., डॉ.), initials (A. P. J.),
     list numbers at the start of a line (1. ii.), decimals (5.30) and a full stop followed by a small
     letter do not end a sentence. */
  function splitSentences(text) {
    var out = [], lineRe = /[^\r\n]+/g, m;
    function push(s, e) {
      while (s < e && isSpace(text[s])) s++;
      while (e > s && isSpace(text[e - 1])) e--;
      if (s < e && RE_WORDCHAR.test(text.slice(s, e))) out.push({ s: s, e: e, w: 0 });
    }
    while ((m = lineRe.exec(text))) {
      var line = m[0], base = m.index, n = line.length, start = 0, i = 0;
      while (i < n) {
        var ch = line[i];
        var ind = TERM_IND.indexOf(ch) >= 0, lat = TERM_LAT.indexOf(ch) >= 0, pipe = ch === '|';
        if (!ind && !lat && !pipe) { i++; continue; }
        var j = i + 1, onlyLat = lat;
        while (j < n) {
          var c = line[j];
          if (TERM_IND.indexOf(c) >= 0 || c === '|') { onlyLat = false; ind = ind || c !== '|'; j++; }
          else if (TERM_LAT.indexOf(c) >= 0 || CLOSE.indexOf(c) >= 0) j++;
          else break;
        }
        var atEnd = j >= n, spaceAfter = !atEnd && isSpace(line[j]), boundary;
        if (ind) boundary = true;
        else if (!atEnd && !spaceAfter) boundary = false;          // 5.30, www.site.in, a|b
        else if (pipe) boundary = true;
        else {
          boundary = true;
          if (onlyLat && !atEnd) {
            var k = j; while (k < n && isSpace(line[k])) k++;
            if (k < n && /[a-z]/.test(line[k])) boundary = false;  // "etc. and", "Wait... what"
          }
          if (boundary && ch === '.' && j === i + 1 && !atEnd) {
            var w = prevWord(line, i);
            if (w && (ABBR[w.toLowerCase()] || /^[A-Za-z]$/.test(w))) boundary = false;
            else if (RE_LISTNO.test(line.slice(0, i))) boundary = false;            // "1. Introduction", "ii. Body"
          }
        }
        if (boundary) { push(base + start, base + j); start = j; }
        i = j;
      }
      if (start < n) push(base + start, base + n);
    }
    return out;
  }

  function norm(w) {
    if (w.normalize) w = w.normalize('NFC');
    return w.toLocaleLowerCase().replace(/['’]s$/, '').replace(/’/g, "'");
  }

  /* English syllables (estimate) for the Flesch formulas. */
  function syllables(word) {
    var w = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!w || w.length <= 3) return 1;
    if (!/[^aeiouy]le$/.test(w) && /e$/.test(w) && !/[aeiouy]e$/.test(w)) w = w.slice(0, -1);   // silent e: make, love
    if (/[^aeiouytd]ed$/.test(w)) w = w.slice(0, -2);                                            // jumped, used
    else if (/[^aeiouysxzhcg]es$/.test(w)) w = w.slice(0, -2);                                   // makes, rides
    w = w.replace(/^y/, '');
    var m = w.match(/[aeiouy]+/g);
    return Math.max(1, m ? m.length : 1);
  }

  function readability(text, words, nSent) {
    var letters = text.replace(RE_NONLETTER, '').length;
    var latin = text.replace(/[^A-Za-z]/g, '').length;
    if (!letters || latin / letters < 0.8) return { state: 'na' };
    if (words.length < READ_MIN || !nSent) return { state: 'few' };
    var syl = 0;
    for (var i = 0; i < words.length; i++) syl += syllables(text.slice(words[i].s, words[i].e));
    var wps = words.length / nSent, spw = syl / words.length;
    return { state: 'ok', fre: 206.835 - 1.015 * wps - 84.6 * spw, fk: 0.39 * wps + 11.8 * spw - 15.59 };
  }

  function analyze(text) {
    var words = getWords(text), freq = Object.create(null), uniq = 0, i;
    for (i = 0; i < words.length; i++) {
      var w = words[i];
      w.n = norm(text.slice(w.s, w.e));
      if (!freq[w.n]) { freq[w.n] = { c: 0, first: i }; uniq++; }
      freq[w.n].c++;
    }
    var ch = countChars(text);
    var sents = splitSentences(text), si = 0;
    for (i = 0; i < words.length; i++) {
      var ws = words[i].s;
      while (si < sents.length && ws >= sents[si].e) si++;
      if (si < sents.length && ws >= sents[si].s) sents[si].w++;
    }
    sents = sents.filter(function (s) { return s.w > 0; });
    var paras = 0, lr = /[^\r\n]+/g, m;
    while ((m = lr.exec(text))) if (RE_WORDCHAR.test(m[0])) paras++;
    return { text: text, words: words, freq: freq, uniq: uniq, chars: ch.all, charsNS: ch.ns, sents: sents, paras: paras,
             read: readability(text, words, sents.length) };
  }

  /* ---------------- state ---------------- */
  var C = function () { var A = window.APP_CONTENT || {}; return A[EDU.lang] || A.en; };
  var savedText = store.get('text', null);
  var S = {
    text: typeof savedText === 'string' ? savedText : C().sample,
    isSample: typeof savedText === 'string' ? !!store.get('sample', false) : true,
    view: 'write',
    font: EDU.clamp(Number(store.get('font', FONT_DEF)) || FONT_DEF, FONT_MIN, FONT_MAX),
    preset: store.get('preset', 'para'),
    cmin: Number(store.get('cmin', 100)) || 0,
    cmax: Number(store.get('cmax', 150)) || 1,
    unit: store.get('unit', 'w') === 'c' ? 'c' : 'w',
    skip: store.get('skip', true) !== false,
    guide: EDU.clamp(Number(store.get('guide', 0)) || 0, 0, 4),
    hl: null, undo: null, saveOk: true, savedAt: null, restored: typeof savedText === 'string'
  };
  if (!PRESETS.some(function (p) { return p.id === S.preset; })) S.preset = 'para';
  var A = analyze(S.text);

  var ta = $('#text');
  ta.value = S.text;

  /* ---------------- word-limit target ---------------- */
  function range() {
    if (S.preset === 'none') return null;
    if (S.preset === 'custom') {
      var lo = Math.max(0, Math.round(S.cmin) || 0), hi = Math.max(1, Math.round(S.cmax) || 1);
      if (lo > hi) { var x = lo; lo = hi; hi = x; }
      return { min: lo, max: hi, unit: S.unit };
    }
    var p = PRESETS.filter(function (q) { return q.id === S.preset; })[0];
    return { min: p.min, max: p.max, unit: 'w' };
  }

  function targetState(v, r) {
    if (v < r.min) return v >= Math.ceil(r.min * 0.8) && r.min - v <= Math.max(2, Math.ceil(r.min * 0.2)) ? 'near' : 'short';
    if (v <= r.max) return 'ok';
    return v <= Math.ceil(r.max * 1.1) ? 'over' : 'way';
  }

  function buildPresetOptions() {
    var sel = $('#preset');
    sel.innerHTML = '';
    PRESETS.forEach(function (p) {
      var label = t('p_' + p.id) + (p.min !== undefined ? ' · ' + p.min + '–' + p.max : '');
      sel.appendChild(EDU.el('option', { value: p.id, text: label }));
    });
    sel.value = S.preset;
  }

  function renderMeter() {
    var r = range(), meter = $('#meter'), bar = $('#bar');
    $('#custom-row').hidden = S.preset !== 'custom';
    $('#unit-w').setAttribute('aria-pressed', String(S.unit === 'w'));
    $('#unit-c').setAttribute('aria-pressed', String(S.unit === 'c'));
    var unit = r ? r.unit : 'w', v = unit === 'c' ? A.chars : A.words.length;
    $('#m-value').textContent = fmt(v);
    $('#m-unit').textContent = t(unit === 'c' ? 'unit_chars' : 'unit_words');
    meter.dataset.value = String(v);
    if (!r) {
      meter.dataset.state = 'none';
      bar.hidden = true;
      $('#target-msg').textContent = t('msg_none');
      return;
    }
    var st = targetState(v, r);
    meter.dataset.state = st;
    bar.hidden = false;
    var scale = Math.max(r.max * 1.25, v * 1.03, 1);
    $('#fill').style.width = Math.min(100, v / scale * 100).toFixed(2) + '%';
    var zone = $('#zone');
    zone.style.insetInlineStart = (r.min / scale * 100).toFixed(2) + '%';
    zone.style.width = Math.max(0.6, (r.max - r.min) / scale * 100).toFixed(2) + '%';
    $('#zone-lo').textContent = r.min === r.max ? '' : fmt(r.min);
    $('#zone-hi').textContent = fmt(r.max);
    bar.setAttribute('aria-valuemax', String(r.max));
    bar.setAttribute('aria-valuenow', String(v));
    bar.setAttribute('aria-valuetext', fmt(v) + ' / ' + fmt(r.min) + '–' + fmt(r.max));
    var n = st === 'short' || st === 'near' ? r.min - v : st === 'ok' ? 0 : v - r.max;
    $('#target-msg').textContent = (st === 'ok' ? '✓ ' : st === 'way' || st === 'over' ? '✂️ ' : '✏️ ') +
      t('msg_' + st + '_' + unit, { n: fmt(n), min: fmt(r.min), max: fmt(r.max) });
  }

  /* ---------------- stats ---------------- */
  var STAT_DEFS = [
    { id: 'words', k: 's_words', wide: true },
    { id: 'chars', k: 's_chars' }, { id: 'charsns', k: 's_chars_ns' },
    { id: 'sents', k: 's_sent' }, { id: 'paras', k: 's_paras' },
    { id: 'avg', k: 's_avg' }, { id: 'unique', k: 's_unique' },
    { id: 'read', k: 's_read', time: true }, { id: 'speak', k: 's_speak', time: true }
  ];
  function buildStats() {
    var box = $('#stats');
    box.innerHTML = '';
    STAT_DEFS.forEach(function (d) {
      box.appendChild(EDU.el('div', { class: 'wc-stat' + (d.wide ? ' wide' : ''), id: 'st-' + d.id },
        EDU.el('div', { class: 'v' + (d.time ? ' time' : ''), text: '0' }),
        EDU.el('div', { class: 'l', 'data-i18n': d.k, text: t(d.k) }),
        EDU.el('div', { class: 'h' })));
    });
  }
  function duration(words, wpm) {
    var sec = Math.round(words / wpm * 60);
    if (sec < 60) return t('dur_s', { s: fmt(sec) });
    var m = Math.floor(sec / 60), s = sec % 60;
    if (m >= 60) return t('dur_hm', { h: fmt(Math.floor(m / 60)), m: fmt(m % 60) });
    return s ? t('dur_ms', { m: fmt(m), s: fmt(s) }) : t('dur_m', { m: fmt(m) });
  }
  function setStat(id, raw, shown, hint) {
    var el = $('#st-' + id);
    el.dataset.value = String(raw);
    el.querySelector('.v').textContent = shown;
    el.querySelector('.h').textContent = hint || '';
  }
  function renderStats() {
    var W = A.words.length, ns = A.sents.length;
    var avg = ns ? Math.round(W / ns * 10) / 10 : 0;
    setStat('words', W, fmt(W));
    setStat('chars', A.chars, fmt(A.chars));
    setStat('charsns', A.charsNS, fmt(A.charsNS));
    setStat('sents', ns, fmt(ns));
    setStat('paras', A.paras, fmt(A.paras));
    setStat('avg', avg, fmt(avg, { maximumFractionDigits: 1 }), t('avg_hint'));
    setStat('unique', A.uniq, fmt(A.uniq), W ? t('unique_pct', { p: fmt(Math.round(A.uniq / W * 100)) }) : '');
    setStat('read', W, duration(W, READ_WPM), t('per_min', { n: fmt(READ_WPM) }));
    setStat('speak', W, duration(W, SPEAK_WPM), t('per_min', { n: fmt(SPEAK_WPM) }));
  }

  /* ---------------- readability ---------------- */
  function renderRead() {
    var R = A.read, card = $('#read-card'), body = $('#read-body');
    card.dataset.state = R.state;
    if (R.state !== 'ok') {
      delete card.dataset.fre;
      body.innerHTML = '<p class="muted small mb0">' + esc(R.state === 'na' ? t('read_na') : t('read_few', { n: fmt(READ_MIN) })) + '</p>';
      return;
    }
    var score = Math.round(R.fre), shown = EDU.clamp(score, 0, 100);
    var band = score >= 90 ? 1 : score >= 80 ? 2 : score >= 70 ? 3 : score >= 60 ? 4 : score >= 50 ? 5 : score >= 30 ? 6 : 7;
    var cls = Math.round(R.fk);
    var lvl = cls > 12 ? t('fk_college') : t('fk_class', { n: fmt(Math.max(1, cls)) });
    card.dataset.fre = String(score);
    body.innerHTML =
      '<div class="wc-fre"><span class="score" id="fre-score">' + esc(fmt(shown)) + '</span>' +
      '<div><strong id="fre-band">' + esc(t('fre_' + band)) + '</strong><div class="muted small">' + esc(lvl) + '</div></div></div>' +
      '<div class="wc-scale" aria-hidden="true"><span class="dot" style="inset-inline-start:' + shown + '%"></span></div>' +
      '<p class="tiny muted">' + esc(t('fre_label')) + '</p>' +
      '<p class="small mb0">' + esc(t('read_tip')) + '</p>';
  }

  /* ---------------- longest sentences ---------------- */
  function excerpt(s) {
    s = s.replace(/\s+/g, ' ');
    if (s.length <= 120) return s;
    var cut = s.lastIndexOf(' ', 105);
    return s.slice(0, cut > 60 ? cut : 105) + ' …';
  }
  function nWords(n) { return n === 1 ? t('one_word') : t('n_words', { n: fmt(n) }); }
  function renderLong() {
    var list = $('#long-list'), msg = $('#long-msg');
    list.innerHTML = '';
    var order = A.sents.map(function (s, i) { return i; }).sort(function (a, b) { return A.sents[b].w - A.sents[a].w || a - b; });
    var top = order.slice(0, 3), longCount = A.sents.filter(function (s) { return s.w >= LONG; }).length;
    top.forEach(function (i) {
      var s = A.sents[i], lvl = s.w >= VLONG ? 'vlong' : s.w >= LONG ? 'long' : 'ok';
      var badge = EDU.el('span', { class: 'badge ' + (lvl === 'vlong' ? 'danger' : lvl === 'long' ? 'warn' : 'success'), text: nWords(s.w) });
      var btn = EDU.el('button', { type: 'button', class: 'long-item', 'data-words': String(s.w), 'data-level': lvl, 'data-i': String(i),
        onclick: function () { showSentence(i); } },
        badge, EDU.el('span', { class: 'ex no-i18n', dir: 'auto', text: excerpt(A.text.slice(s.s, s.e)) }));
      list.appendChild(EDU.el('li', {}, btn));
    });
    msg.className = 'small wc-note';
    if (!A.sents.length) { msg.textContent = t('long_empty'); msg.classList.add('muted'); }
    else if (!longCount) { msg.textContent = '✓ ' + t('long_none'); msg.classList.add('ok'); }
    else msg.textContent = longCount === 1 ? t('long_one') : t('long_some', { n: fmt(longCount) });
  }

  /* ---------------- repeated words ---------------- */
  function renderRepeated() {
    var box = $('#rep-list'), rows = [];
    Object.keys(A.freq).forEach(function (w) {
      var f = A.freq[w];
      if (f.c < 2 || RE_NUM.test(w) || Array.from(w).length < 2) return;
      if (S.skip && STOP[w]) return;
      rows.push({ w: w, c: f.c, first: f.first });
    });
    rows.sort(function (a, b) { return b.c - a.c || a.first - b.first; });
    rows = rows.slice(0, 10);
    if (S.hl && !rows.some(function (r) { return r.w === S.hl; })) S.hl = null;
    box.innerHTML = '';
    if (!rows.length) { box.appendChild(EDU.el('p', { class: 'muted small mb0', text: t('rep_empty') })); return; }
    rows.forEach(function (r) {
      box.appendChild(EDU.el('button', { type: 'button', class: 'chip', 'data-word': r.w, 'data-count': String(r.c), 'aria-pressed': String(S.hl === r.w),
        onclick: function () { S.hl = S.hl === r.w ? null : r.w; if (S.hl) setView('check'); renderRepeated(); renderCheck(); } },
        EDU.el('span', { class: 'no-i18n', dir: 'auto', text: r.w }), EDU.el('span', { class: 'n', text: '×' + fmt(r.c) })));
    });
  }

  /* ---------------- check view (sentences coloured by length) ---------------- */
  function renderCheck() {
    if (S.view !== 'check') return;
    var box = $('#check'), text = A.text;
    if (!text.trim()) { box.innerHTML = '<p class="muted mb0">' + esc(t('check_empty')) + '</p>'; return; }
    var html = '', pos = 0, wi = 0, words = A.words, hl = S.hl;
    A.sents.forEach(function (s, i) {
      html += esc(text.slice(pos, s.s));
      var cls = s.w >= VLONG ? ' s-vlong' : s.w >= LONG ? ' s-long' : '';
      html += '<span class="snt' + cls + '" data-i="' + i + '" data-words="' + s.w + '">';
      var p = s.s;
      if (hl) {
        while (wi < words.length && words[wi].s < s.s) wi++;
        while (wi < words.length && words[wi].s < s.e) {
          var w = words[wi];
          if (w.n === hl) { html += esc(text.slice(p, w.s)) + '<mark>' + esc(text.slice(w.s, w.e)) + '</mark>'; p = w.e; }
          wi++;
        }
      }
      html += esc(text.slice(p, s.e)) + '</span>';
      pos = s.e;
    });
    html += esc(text.slice(pos));
    box.innerHTML = html;
  }

  function setView(v) {
    S.view = v;
    $('#view-write').setAttribute('aria-pressed', String(v === 'write'));
    $('#view-check').setAttribute('aria-pressed', String(v === 'check'));
    ta.hidden = v !== 'write';
    $('#check').hidden = v !== 'check';
    $('#check-legend').hidden = v !== 'check';
    if (v === 'check') renderCheck();
  }

  function showSentence(i) {
    setView('check');
    var sp = $('#check .snt[data-i="' + i + '"]');
    if (!sp) return;
    sp.classList.remove('flash'); void sp.offsetWidth; sp.classList.add('flash');
    sp.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  /* Put the caret on a sentence in the textarea and scroll it into view (mirror-measure the text above it). */
  function editRange(s, e) {
    setView('write');
    ta.focus();
    ta.setSelectionRange(s, e);
    try {
      var cs = getComputedStyle(ta), m = document.createElement('div');
      ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'wordSpacing', 'paddingTop', 'paddingLeft', 'paddingRight', 'direction', 'textAlign'].forEach(function (p) { m.style[p] = cs[p]; });
      m.style.cssText += ';position:fixed;top:-99999px;visibility:hidden;white-space:pre-wrap;overflow-wrap:break-word;box-sizing:border-box;border:0;width:' + ta.clientWidth + 'px';
      m.textContent = ta.value.slice(0, s) || '.';
      document.body.appendChild(m);
      var h = m.scrollHeight;
      m.remove();
      ta.scrollTop = Math.max(0, h - ta.clientHeight / 3);
    } catch (err) { }
    ta.scrollIntoView({ block: 'nearest' });
  }

  /* ---------------- status / autosave ---------------- */
  function timeNow(d) {
    try { return new Intl.DateTimeFormat(EDU.langInfo(EDU.lang).tag, { hour: 'numeric', minute: '2-digit', numberingSystem: 'latn' }).format(d); }
    catch (e) { return d.toTimeString().slice(0, 5); }
  }
  function renderStatus() {
    var msg;
    if (S.isSample) msg = t('st_sample');
    else if (!S.saveOk) msg = '⚠️ ' + t('st_not_saved');
    else if (S.undo !== null && !S.text) msg = t('st_cleared');
    else if (S.savedAt) msg = '💾 ' + t('st_saved', { time: timeNow(S.savedAt) });
    else msg = '💾 ' + t('st_draft');
    $('#status-txt').textContent = msg;
    $('#undo').hidden = S.undo === null;
  }
  var saveTimer = null;
  function save() {
    clearTimeout(saveTimer); saveTimer = null;
    S.saveOk = store.set('text', S.text) !== false;
    store.set('sample', S.isSample);
    if (S.saveOk) S.savedAt = new Date();
    renderStatus();
  }
  function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 600); }
  window.addEventListener('pagehide', function () { if (saveTimer) save(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && saveTimer) save(); });

  var srTimer = null;
  function announce() {
    clearTimeout(srTimer);
    srTimer = setTimeout(function () {
      $('#sr-live').textContent = t('sr_summary', { w: fmt(A.words.length), s: fmt(A.sents.length), msg: $('#target-msg').textContent.replace(/^\S+\s/, '') });
    }, 1500);
  }

  /* ---------------- update pipeline ---------------- */
  function renderAll() {
    renderMeter(); renderStats(); renderRead(); renderLong(); renderRepeated(); renderCheck(); renderStatus();
  }
  function recompute() { A = analyze(S.text); renderAll(); announce(); }
  var pending = null;
  function scheduleRecompute() {
    if (pending) return;
    if (S.text.length > 20000) pending = setTimeout(function () { pending = null; recompute(); }, 250);
    else pending = (window.requestAnimationFrame || setTimeout)(function () { pending = null; recompute(); });
  }

  function setText(text, isSample, keepUndo) {
    if (!keepUndo) S.undo = null;
    S.text = text; S.isSample = !!isSample; S.hl = null;
    ta.value = text;
    A = analyze(text);
    renderAll();
    save();
  }
  /* Replace the text, keeping the old text for Undo. */
  function replaceText(text, isSample) {
    var old = S.text;
    S.undo = (!S.isSample && old.trim()) ? old : null;
    setText(text, isSample, true);
  }
  function needsConfirm() { return !S.isSample && S.text.trim().length > 0; }

  ta.addEventListener('input', function () {
    S.text = ta.value; S.isSample = false;
    if (S.undo !== null) { S.undo = null; }
    scheduleRecompute();
    scheduleSave();
  });

  /* ---------------- controls ---------------- */
  $('#view-write').addEventListener('click', function () { setView('write'); });
  $('#view-check').addEventListener('click', function () { setView('check'); });
  $('#check').addEventListener('click', function (e) {
    var sp = e.target.closest ? e.target.closest('.snt') : null;
    if (!sp) return;
    var s = A.sents[Number(sp.dataset.i)];
    if (s) editRange(s.s, s.e);
  });

  function applyFont() {
    $('#editor-card').style.setProperty('--wc-fs', S.font + 'px');
    $('#font-down').disabled = S.font <= FONT_MIN;
    $('#font-up').disabled = S.font >= FONT_MAX;
  }
  $('#font-down').addEventListener('click', function () { S.font = Math.max(FONT_MIN, S.font - 2); store.set('font', S.font); applyFont(); });
  $('#font-up').addEventListener('click', function () { S.font = Math.min(FONT_MAX, S.font + 2); store.set('font', S.font); applyFont(); });

  $('#preset').addEventListener('change', function () {
    S.preset = this.value; store.set('preset', S.preset);
    if (S.preset === 'custom') { $('#cmin').value = S.cmin; $('#cmax').value = S.cmax; }
    renderMeter(); announce();
  });
  function readCustom() {
    var lo = parseInt($('#cmin').value, 10), hi = parseInt($('#cmax').value, 10);
    if (!isNaN(lo)) S.cmin = EDU.clamp(lo, 0, 1000000);
    if (!isNaN(hi)) S.cmax = EDU.clamp(hi, 1, 1000000);
    store.set('cmin', S.cmin); store.set('cmax', S.cmax);
    renderMeter();
  }
  $('#cmin').addEventListener('input', readCustom);
  $('#cmax').addEventListener('input', readCustom);
  $('#unit-w').addEventListener('click', function () { S.unit = 'w'; store.set('unit', 'w'); renderMeter(); });
  $('#unit-c').addEventListener('click', function () { S.unit = 'c'; store.set('unit', 'c'); renderMeter(); });

  $('#skip-small').checked = S.skip;
  $('#skip-small').addEventListener('change', function () { S.skip = this.checked; store.set('skip', S.skip); renderRepeated(); renderCheck(); });

  $('#example').addEventListener('click', function () {
    if (needsConfirm() && !confirm(t('confirm_replace'))) return;
    replaceText(C().sample, true);
    setView('write');
  });
  $('#copy').addEventListener('click', function () {
    if (!S.text.trim()) { EDU.toast(t('nothing_yet')); return; }
    EDU.copy(S.text);
  });
  $('#download').addEventListener('click', function () {
    if (!S.text.trim()) { EDU.toast(t('nothing_yet')); return; }
    var d = new Date(), pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var name = 'writing-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '.txt';
    EDU.download(name, '﻿' + S.text.replace(/\r?\n/g, '\r\n'), 'text/plain');
  });
  function fillPrint() {
    $('#print-stats').textContent = t('print_stats', { w: fmt(A.words.length), c: fmt(A.chars), s: fmt(A.sents.length), p: fmt(A.paras) });
    $('#print-text').textContent = S.text;
  }
  window.addEventListener('beforeprint', fillPrint);
  window.addEventListener('afterprint', function () { document.body.classList.remove('wc-pg'); });
  $('#print').addEventListener('click', function () {
    if (!S.text.trim()) { EDU.toast(t('nothing_yet')); return; }
    document.body.classList.remove('wc-pg');
    fillPrint();
    window.print();
  });
  $('#fullscreen').addEventListener('click', function () { EDU.fullscreen(); });
  $('#clear').addEventListener('click', function () {
    if (!S.text) { ta.focus(); return; }
    if (needsConfirm() && !confirm(t('confirm_clear'))) return;
    replaceText('', false);
    setView('write');
    ta.focus();
  });
  $('#undo').addEventListener('click', function () {
    if (S.undo === null) return;
    var u = S.undo;
    S.undo = null;
    setText(u, false);
    setView('write');
  });

  /* ---------------- format guides ---------------- */
  function buildGuideTabs() {
    var tabs = $('#guide-tabs');
    tabs.innerHTML = '';
    C().guides.forEach(function (g, i) {
      tabs.appendChild(EDU.el('button', { type: 'button', role: 'tab', id: 'gtab-' + i, 'aria-controls': 'guide-panel',
        'aria-selected': String(i === S.guide), tabindex: i === S.guide ? '0' : '-1', text: GUIDE_ICON[i] + ' ' + g.name,
        onclick: function () { selectGuide(i, false); } }));
    });
    renderGuide();
  }
  function selectGuide(i, focus) {
    S.guide = (i + 5) % 5; store.set('guide', S.guide);
    EDU.$$('#guide-tabs [role="tab"]').forEach(function (b, k) {
      b.setAttribute('aria-selected', String(k === S.guide));
      b.tabIndex = k === S.guide ? 0 : -1;
    });
    if (focus) $('#gtab-' + S.guide).focus();
    renderGuide();
  }
  $('#guide-tabs').addEventListener('keydown', function (e) {
    var rtl = document.documentElement.dir === 'rtl';
    var d = e.key === 'ArrowRight' ? (rtl ? -1 : 1) : e.key === 'ArrowLeft' ? (rtl ? 1 : -1) : 0;
    if (e.key === 'Home') { e.preventDefault(); selectGuide(0, true); }
    else if (e.key === 'End') { e.preventDefault(); selectGuide(4, true); }
    else if (d) { e.preventDefault(); selectGuide(S.guide + d, true); }
  });
  function renderGuide() {
    var g = C().guides[S.guide], panel = $('#guide-panel');
    var pr = PRESETS.filter(function (p) { return p.id === GUIDE_PRESET[S.guide]; })[0];
    panel.setAttribute('aria-labelledby', 'gtab-' + S.guide);
    panel.innerHTML = '';
    var pts = EDU.el('ol', { class: 'wc-points' });
    g.points.forEach(function (p) { pts.appendChild(EDU.el('li', { text: p })); });
    panel.appendChild(EDU.el('div', { class: 'wc-guide' },
      EDU.el('div', {},
        EDU.el('h3', { id: 'guide-title', text: g.name }),
        EDU.el('p', { class: 'wc-limit' }, EDU.el('span', { class: 'badge primary', text: t('g_limit') }), EDU.el('span', { text: g.limit })),
        pts,
        EDU.el('p', { class: 'callout accent mb0' }, EDU.el('strong', { text: t('g_tip') + ': ' }), g.tip)),
      EDU.el('div', {},
        EDU.el('h4', { text: t('g_layout') }),
        EDU.el('pre', { class: 'wc-outline', id: 'guide-outline', text: g.outline }),
        EDU.el('div', { class: 'wc-guide-actions' },
          EDU.el('button', { type: 'button', class: 'btn btn-primary', id: 'use-layout', onclick: useLayout }, EDU.el('span', { 'aria-hidden': 'true', text: '📋' }), ' ', t('g_use')),
          EDU.el('button', { type: 'button', class: 'btn', id: 'set-limit', 'data-preset': pr.id, onclick: function () { setLimitFromGuide(pr); } },
            EDU.el('span', { 'aria-hidden': 'true', text: '🎯' }), ' ', t('g_set') + ' · ' + pr.min + '–' + pr.max)))));
  }
  function useLayout() {
    if (needsConfirm() && !confirm(t('confirm_replace'))) return;
    replaceText(C().guides[S.guide].outline, false);
    setLimitFromGuide(PRESETS.filter(function (p) { return p.id === GUIDE_PRESET[S.guide]; })[0], true);
    setView('write');
    ta.focus();
    ta.setSelectionRange(0, 0);
    ta.scrollTop = 0;
    $('#editor-card').scrollIntoView({ block: 'start', behavior: 'smooth' });
    EDU.toast(t('toast_layout'));
  }
  function setLimitFromGuide(pr, quiet) {
    S.preset = pr.id; store.set('preset', S.preset);
    $('#preset').value = S.preset;
    renderMeter();
    if (!quiet) EDU.toast(t('toast_limit', { min: fmt(pr.min), max: fmt(pr.max) }));
  }
  $('#print-guide').addEventListener('click', function () {
    document.body.classList.add('wc-pg');
    window.print();
    setTimeout(function () { document.body.classList.remove('wc-pg'); }, 1000);
  });

  /* ---------------- language-dependent text ---------------- */
  function renderTexts() {
    $('#count-how').textContent = t('count_how', { marks: MARKS });
    $('#leg-long').textContent = t('leg_long', { a: fmt(LONG), b: fmt(VLONG - 1) });
    $('#leg-vlong').textContent = t('leg_vlong', { a: fmt(VLONG) });
  }

  EDU.onLang(function () {
    segCache = {};
    if (S.isSample) { S.text = C().sample; ta.value = S.text; store.set('text', S.text); }
    A = analyze(S.text);
    renderTexts();
    buildPresetOptions();
    buildGuideTabs();
    renderAll();
  });

  /* ---------------- start ---------------- */
  buildStats();
  buildPresetOptions();
  $('#cmin').value = S.cmin; $('#cmax').value = S.cmax;
  applyFont();
  renderTexts();
  buildGuideTabs();
  setView('write');
  renderAll();
})();
