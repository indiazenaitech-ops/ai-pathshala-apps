/* Read Aloud: a text-to-speech reader with word/sentence highlighting, echo reading,
   click-a-word and voice help, using the browser's own voices (speechSynthesis).
   Text is spoken one sentence at a time, which keeps pause/resume, repeat and echo mode
   reliable on every browser and avoids the long-utterance cut-off in Chrome. */
(function () {
  'use strict';

  var SLUG = 'read-aloud';
  var store = EDU.store(SLUG);
  var t = EDU.t, $ = EDU.$, $$ = EDU.$$, el = EDU.el;
  var CODES = EDU.LANGS.map(function (l) { return l.code; });
  var CONTENT = window.APP_CONTENT || {};
  var synth = window.speechSynthesis || null;
  var HAS_TTS = !!(synth && typeof window.SpeechSynthesisUtterance === 'function');

  /* Same-script fallback voices (a Hindi voice can read Marathi text and vice versa). */
  var FALLBACK = { mr: 'hi', hi: 'mr' };
  /* Device menu names, shown exactly as they appear in the (usually English) settings app. */
  var UI_NAMES = {
    a1: 'Settings', a2: 'Text-to-speech', a3: 'Speech Services by Google', a4: 'Install voice data',
    w1: 'Settings', w2: 'Time & language', w3: 'Language & region', w4: 'Add a language', w5: 'Text-to-speech',
    i1: 'Settings', i2: 'Accessibility', i3: 'Spoken Content', i4: 'Voices'
  };
  var MAX_CHUNK = 220;                 // long sentences are split so no utterance gets cut off

  /* ---------------- settings ---------------- */
  function num(v, d, lo, hi) { v = parseFloat(v); return isFinite(v) ? EDU.clamp(v, lo, hi) : d; }
  function oneOf(v, list, d) { return list.indexOf(v) >= 0 ? v : d; }
  function defaultFont() { return window.innerWidth < 600 ? 24 : 30; }
  var cfg = {};
  function loadCfg() {
    cfg.rate = num(store.get('rate', 1), 1, 0.5, 1.5);
    cfg.pitch = num(store.get('pitch', 1), 1, 0.5, 1.5);
    cfg.font = num(store.get('font', defaultFont()), defaultFont(), 16, 72);
    cfg.line = num(store.get('line', 1.8), 1.8, 1.2, 2.8);
    cfg.hl = oneOf(store.get('hl', 'word'), ['word', 'sentence'], 'word');
    cfg.tap = oneOf(store.get('tap', 'hear'), ['hear', 'from'], 'hear');
    cfg.echo = store.get('echo', false) === true;
    cfg.echoWait = oneOf(store.get('echoWait', 'auto'), ['auto', 'tap'], 'auto');
    cfg.allVoices = store.get('allVoices', false) === true;
  }
  loadCfg();

  /* ---------------- state ---------------- */
  var S = {
    text: '', sample: null, detected: 'en', uiLang: EDU.lang,
    sampleLang: CONTENT[EDU.lang] ? EDU.lang : 'en',
    readAs: oneOf(store.get('readAs', 'auto'), ['auto'].concat(CODES), 'auto'),
    voicePref: (function (p) { return p && typeof p === 'object' ? p : {}; })(store.get('voicePref', {})),
    voices: [], voicesLoaded: !HAS_TTS, tryAnyway: {},
    doc: { sentences: [], paras: [], words: 0 }
  };
  /* player: state is idle | playing | echo | paused | done */
  var P = { state: 'idle', si: -1, wi: -1, gen: 0, utt: null, started: 0, gotBoundary: false, resumeNext: false,
            hlS: null, hlW: null, goT: 0, echoT: 0, watch: 0 };

  function sampleOf(lang, idx) { var c = CONTENT[lang]; return c && c.samples && c.samples[idx] || null; }

  /* initial text: saved text, or the first sample in the page language */
  (function () {
    var saved = store.get('text', null), smp = store.get('sample', null);
    if (typeof saved === 'string') {
      S.text = saved;
      if (smp && typeof smp === 'object' && sampleOf(smp.lang, smp.idx) && sampleOf(smp.lang, smp.idx).text === saved) {
        S.sample = { lang: smp.lang, idx: smp.idx, follow: !!smp.follow };
        // an untouched sample in the page language follows the page language
        if (smp.follow && smp.lang !== EDU.lang && sampleOf(EDU.lang, smp.idx)) { S.sample.lang = EDU.lang; S.text = sampleOf(EDU.lang, smp.idx).text; }
      }
    } else {
      var first = sampleOf(S.sampleLang, 0);
      if (first) { S.text = first.text; S.sample = { lang: S.sampleLang, idx: 0, follow: true }; }
    }
  })();

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ---------------- language detection ---------------- */
  var SCRIPTS = [
    ['hi', /[ऀ-ॣ०-ॿ]/], ['bn', /[ঀ-৿]/], ['pa', /[਀-੿]/], ['gu', /[઀-૿]/],
    ['or', /[଀-୿]/], ['ta', /[஀-௿]/], ['te', /[ఀ-౿]/], ['kn', /[ಀ-೿]/],
    ['ml', /[ഀ-ൿ]/], ['ur', /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/], ['en', /[A-Za-z]/]
  ];
  var MR_WORDS = ['आहे', 'आहेत', 'आणि', 'नाही', 'होते', 'होता', 'होती', 'मी', 'आम्ही', 'तुम्ही', 'आपण', 'आपल्याला', 'त्याला', 'तिला',
    'त्याने', 'तिने', 'केले', 'झाले', 'म्हणून', 'पण', 'खूप', 'चला', 'ती', 'हे', 'आता', 'किंवा', 'मध्ये', 'साठी'];
  var HI_WORDS = ['है', 'हैं', 'और', 'नहीं', 'था', 'थी', 'थे', 'का', 'की', 'के', 'में', 'को', 'से', 'ने', 'यह', 'वह', 'मैं', 'हम',
    'भी', 'पर', 'बहुत', 'लिए', 'क्या', 'या'];
  function detectLang(text) {
    var counts = {}, best = null, bestN = 0, s = String(text || '').slice(0, 4000);
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      if (/[\s\d.,!?;:'"()\-–—।॥]/.test(ch)) continue;
      for (var j = 0; j < SCRIPTS.length; j++) if (SCRIPTS[j][1].test(ch)) { counts[SCRIPTS[j][0]] = (counts[SCRIPTS[j][0]] || 0) + 1; break; }
    }
    Object.keys(counts).forEach(function (k) { if (counts[k] > bestN) { bestN = counts[k]; best = k; } });
    if (!best) return CODES.indexOf(EDU.lang) >= 0 ? EDU.lang : 'en';
    if (best === 'hi') return marathiOrHindi(s);
    return best;
  }
  function marathiOrHindi(s) {
    var words = s.split(/[\s।॥.,!?;:"'()\-–—]+/), mr = 0, hi = 0;
    words.forEach(function (w) { if (MR_WORDS.indexOf(w) >= 0) mr++; if (HI_WORDS.indexOf(w) >= 0) hi++; });
    mr += (s.match(/ळ/g) || []).length;
    if (mr > hi) return 'mr';
    if (mr === hi && mr === 0 && EDU.lang === 'mr') return 'mr';
    return 'hi';
  }
  function effLang() { return S.readAs !== 'auto' ? S.readAs : S.detected; }
  function langName(code) { return t('lang_' + code); }
  function langLabel(code) {
    var n = langName(code), nat = EDU.langInfo(code).native;
    return (code === EDU.lang || n === nat) ? n : n + ' · ' + nat;
  }

  /* ---------------- text → sentences → words ---------------- */
  /* Titles are never the end of a sentence ("Dr. Kalam", "Pvt. Ltd."); units and other short forms
     end a sentence when the next word starts with a capital letter ("It is 10 km. We walked."). */
  var TITLES = /^(mr|mrs|ms|dr|prof|sr|jr|st|mt|smt|shri|sh|kum|pvt|vs|e\.g|i\.e|डॉ|श्री|श्रीमती|कु|सौ|प्रो|ڈاکٹر)$/;
  var SHORTS = /^(rs|govt|dept|approx|fig|vol|ch|pg|pp|ltd|co|no|km|cm|mm|kg|gm|ft|sq|hrs|min|sec|a\.m|p\.m|etc)$/;
  var WORDISH = (function () { try { return new RegExp('[^\\s\\p{P}\\p{S}]', 'u'); } catch (e) { return /[A-Za-z0-9À-￿]/; } })();
  var EDGE_PUNCT = (function () { try { return new RegExp('^[\\p{P}\\p{S}]+|[\\p{P}\\p{S}]+$', 'gu'); } catch (e) { return /^[.,!?;:'"()\[\]{}\-–—।॥؟۔،“”‘’]+|[.,!?;:'"()\[\]{}\-–—।॥؟۔،“”‘’]+$/g; } })();

  function isAbbrev(line, i, end) {
    var w = (line.slice(0, i).match(/[^\s(“"'‘]+$/) || [''])[0];
    if (/^[A-Z]$/.test(w)) return true;                  // initials: A. P. J.
    w = w.toLowerCase();
    if (TITLES.test(w)) return true;
    if (!SHORTS.test(w)) return false;
    var next = line.slice(end).replace(/^\s+/, '').charAt(0);
    return /[a-z0-9,;:(₹$]/.test(next);                    // "Rs. 50", "approx. ten" go on; "km. We" ends
  }
  function splitSentences(line) {
    var out = [], start = 0, re = /[.!?…।॥|؟۔]+["'”’»)\]]*(?=\s|$)/g, m;
    function push(a, b) {
      while (a < b && /\s/.test(line.charAt(a))) a++;
      while (b > a && /\s/.test(line.charAt(b - 1))) b--;
      if (b > a) out.push([a, b]);
    }
    while ((m = re.exec(line))) {
      if (m[0] === '.' && isAbbrev(line, m.index, m.index + 1)) continue;
      var end = m.index + m[0].length;
      push(start, end); start = end;
    }
    push(start, line.length);
    return out;
  }
  function chunk(line, a, b) {
    var out = [];
    while (b - a > MAX_CHUNK) {
      var seg = line.slice(a, a + MAX_CHUNK), cut = -1, re = /[,;:،]\s/g, m;
      while ((m = re.exec(seg))) if (m.index > 40) cut = m.index + 1;
      if (cut < 0) { var sp = seg.lastIndexOf(' '); cut = sp > 40 ? sp : MAX_CHUNK; }
      out.push([a, a + cut]);
      a += cut;
      while (a < b && /\s/.test(line.charAt(a))) a++;
    }
    if (b > a) out.push([a, b]);
    return out;
  }
  function parse(text) {
    var sentences = [], paras = [], words = 0, lineRe = /[^\n\r]+/g, m;
    while ((m = lineRe.exec(text))) {
      var line = m[0], base = m.index;
      if (!line.trim()) continue;
      var para = [], lead = null;
      splitSentences(line).forEach(function (r) {
        chunk(line, r[0], r[1]).forEach(function (c) {
          var s = { start: base + c[0], end: base + c[1], words: [] }, real = 0;
          var seg = text.slice(s.start, s.end), wr = /\S+/g, w;
          while ((w = wr.exec(seg))) {
            s.words.push({ start: s.start + w.index, end: s.start + w.index + w[0].length, text: w[0] });
            if (WORDISH.test(w[0])) real++;
          }
          if (!s.words.length) return;
          words += real;
          var prev = para.length ? sentences[para[para.length - 1]] : null;
          if (!real && prev) {                       // "..." or "!!!" on its own joins the sentence before it
            prev.end = s.end; prev.words = prev.words.concat(s.words); return;
          }
          if (!real) { lead = lead ? { start: lead.start, words: lead.words.concat(s.words) } : s; return; }
          if (lead) { s.start = lead.start; s.words = lead.words.concat(s.words); lead = null; }
          para.push(sentences.length); sentences.push(s);
        });
      });
      if (lead) { para.push(sentences.length); sentences.push({ start: lead.start, end: lead.words[lead.words.length - 1].end, words: lead.words }); }
      if (para.length) paras.push(para);
    }
    return { sentences: sentences, paras: paras, words: words };
  }
  function cleanWord(w) { var c = String(w).replace(EDGE_PUNCT, ''); return c || ''; }

  /* ---------------- reading view ---------------- */
  var loadedFonts = {};
  function readerFont(code) {
    var info = EDU.langInfo(code);
    if (info.font && !loadedFonts[info.font] && navigator.onLine !== false) {
      loadedFonts[info.font] = 1;
      var l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=' + info.font.replace(/ /g, '+') + ':wght@400;600;700&display=swap';
      document.head.appendChild(l);
    }
    return (info.font ? '"' + info.font + '", ' : '') + '"Noto Sans", system-ui, "Segoe UI", "Nirmala UI", Roboto, sans-serif';
  }
  function renderReader() {
    var r = $('#reader');
    P.hlS = P.hlW = null;
    r.textContent = '';
    r.scrollTop = 0;
    var doc = S.doc, lang = effLang();
    r.dataset.lang = lang;
    if (!doc.sentences.length) {
      r.lang = EDU.lang; r.dir = EDU.langInfo(EDU.lang).dir; r.style.fontFamily = '';
      r.appendChild(el('p', { class: 'reader-empty', text: t('empty_text') }));
      return;
    }
    r.lang = lang;
    r.dir = EDU.langInfo(lang).dir;
    r.style.fontFamily = readerFont(lang);
    var frag = document.createDocumentFragment();
    doc.paras.forEach(function (para) {
      var p = document.createElement('p');
      para.forEach(function (si, k) {
        var s = doc.sentences[si];
        var se = document.createElement('span');
        se.className = 's'; se.dataset.s = si;
        s.words.forEach(function (w, wi) {
          if (wi) se.appendChild(document.createTextNode(' '));
          var we = document.createElement('span');
          we.className = 'w'; we.dataset.s = si; we.dataset.w = wi; we.textContent = w.text;
          w.el = we; se.appendChild(we);
        });
        s.el = se;
        if (k) p.appendChild(document.createTextNode(' '));
        p.appendChild(se);
      });
      frag.appendChild(p);
    });
    r.appendChild(frag);
  }
  /* Keep the word/sentence being read in the part of the reading view that is really on screen:
     not under the sticky page header, below the window edge or behind the "Your turn!" box. */
  function keepVisible(node, movePage) {
    if (!node) return;
    var r = $('#reader'), rr = r.getBoundingClientRect(), er = node.getBoundingClientRect();
    var fs = document.fullscreenElement || document.webkitFullscreenElement;
    var hdr = $('.edu-top'), head = hdr && !fs ? Math.max(0, hdr.getBoundingClientRect().bottom) : 0;
    var eb = $('#echo-box'), foot = window.innerHeight || rr.bottom;
    if (!eb.hidden && !fs) foot = Math.min(foot, eb.getBoundingClientRect().top);
    var top = Math.max(rr.top, head), bot = Math.min(rr.bottom, foot), onScreen = bot - top >= 80;
    if (!onScreen) { top = rr.top; bot = rr.bottom; }           // reading view is off-screen: keep the word inside it
    if (er.top >= top + 4 && er.bottom <= bot - 4) return;
    if (r.scrollHeight > r.clientHeight + 2) {
      r.scrollTop += (er.top - top) - Math.min((bot - top) * 0.25, 120);
      er = node.getBoundingClientRect();
    }
    // the end of the text can't scroll higher inside the view: move the page a little instead
    if (movePage && onScreen && er.bottom > bot - 4 && er.top > head + 8) window.scrollBy(0, Math.min(er.bottom - bot + 12, er.top - head - 8));
  }
  function clearWordHL() { if (P.hlW) P.hlW.classList.remove('on', 'tap'); P.hlW = null; }
  function clearHL() { clearWordHL(); if (P.hlS) P.hlS.classList.remove('cur'); P.hlS = null; }
  function hlSentence(si) {
    var s = S.doc.sentences[si];
    if (!s || !s.el) return;
    if (P.hlS !== s.el) { if (P.hlS) P.hlS.classList.remove('cur'); P.hlS = s.el; s.el.classList.add('cur'); }
    keepVisible(s.el);
  }
  function hlWord(si, wi, tap) {
    clearWordHL();
    var s = S.doc.sentences[si], w = s && s.words[wi];
    if (!w || !w.el) return;
    P.hlW = w.el;
    w.el.classList.add('on');
    if (tap) w.el.classList.add('tap');
    keepVisible(w.el, true);
  }
  function wordAt(s, idx) {
    for (var i = 0; i < s.words.length; i++) if (idx < s.words[i].end) return i;
    return s.words.length - 1;
  }

  /* ---------------- voices ---------------- */
  function normLang(v) { return String(v && v.lang || '').toLowerCase().replace(/_/g, '-'); }
  function voiceId(v) { return v.voiceURI || v.name; }
  function findVoice(id) { for (var i = 0; i < S.voices.length; i++) if (voiceId(S.voices[i]) === id) return S.voices[i]; return null; }
  function voicesFor(code) {
    var tag = EDU.langInfo(code).tag.toLowerCase();
    function score(v) { return (normLang(v) === tag ? 4 : 0) + (v.localService ? 1 : 0) + (v.default ? 0.5 : 0); }
    return S.voices.filter(function (v) { return normLang(v).split('-')[0] === code; })
      .sort(function (a, b) { return score(b) - score(a) || String(a.name).localeCompare(String(b.name)); });
  }
  /* → { voice, kind: pref | auto | fallback | none, other } */
  function resolveVoice(lang) {
    var pref = S.voicePref[lang], v = pref ? findVoice(pref) : null;
    if (v) return { voice: v, kind: 'pref' };
    var list = voicesFor(lang);
    if (list.length) return { voice: list[0], kind: 'auto' };
    var fb = FALLBACK[lang];
    if (fb && (list = voicesFor(fb)).length) return { voice: list[0], kind: 'fallback', other: fb };
    return { voice: null, kind: 'none' };
  }
  function fillVoices() {
    var sel = $('#voice-sel'), lang = effLang(), rv = resolveVoice(lang);
    sel.textContent = '';
    var list;
    if (cfg.allVoices) list = S.voices.slice().sort(function (a, b) { return normLang(a).localeCompare(normLang(b)) || String(a.name).localeCompare(String(b.name)); });
    else list = voicesFor(lang).concat(rv.kind === 'fallback' ? voicesFor(rv.other) : []);
    // a voice of another language picked from the full list stays visible (and selected) in the short list
    if (rv.kind === 'pref' && list.indexOf(rv.voice) < 0) list.unshift(rv.voice);
    var hasAny = list.length > 0 || !!rv.voice;
    sel.appendChild(el('option', { value: '', text: hasAny ? t('voice_auto') : t('voice_none') }));
    var group = null, groupLang = null;
    list.forEach(function (v) {
      var opt = el('option', { value: voiceId(v), text: v.name + (cfg.allVoices ? '' : ' (' + v.lang + ')') });
      if (cfg.allVoices) {
        if (normLang(v) !== groupLang) { groupLang = normLang(v); group = el('optgroup', { label: v.lang || '?' }); sel.appendChild(group); }
        group.appendChild(opt);
      } else sel.appendChild(opt);
    });
    var pref = S.voicePref[lang];
    sel.value = pref && findVoice(pref) ? pref : '';
    sel.disabled = !HAS_TTS;
    $('#voice-info').textContent = rv.voice ? '🔈 ' + rv.voice.name + ' · ' + rv.voice.lang : '';
    $('#all-voices').checked = cfg.allVoices;
  }

  function platform() {
    var ua = navigator.userAgent || '';
    if (/Android/i.test(ua)) return 'android';
    if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
    if (/Windows/i.test(ua)) return 'windows';
    return 'other';
  }
  function uiName(k) { return '<span class="ui no-i18n" dir="ltr">' + EDU.esc(UI_NAMES[k]) + '</span>'; }
  function stepHtml(kind, lang) {
    var vars = { lang: '<b>' + EDU.esc(langName(lang)) + '</b>' };
    Object.keys(UI_NAMES).forEach(function (k) { vars[k] = uiName(k); });
    return t('nv_' + kind, vars);
  }
  function renderVoiceNote() {
    var box = $('#voice-note');
    box.textContent = '';
    box.className = 'no-print';
    delete box.dataset.kind;
    if (!HAS_TTS) {
      box.className += ' callout danger nv';
      box.dataset.kind = 'nospeech';
      box.appendChild(el('p', { class: 'mb0', text: t('no_speech') }));
      box.hidden = false;
      return;
    }
    var lang = effLang(), rv = resolveVoice(lang);
    if (!S.voicesLoaded || !S.doc.sentences.length || rv.kind === 'auto' || rv.kind === 'pref') { box.hidden = true; return; }
    box.dataset.kind = rv.kind;
    if (rv.kind === 'fallback') {
      box.className += ' callout nv';
      box.appendChild(el('p', { class: 'mb0', text: t('nv_fallback', { lang: langName(lang), other: langName(rv.other) }) }));
      box.hidden = false;
      return;
    }
    // no voice at all for this language: explain how to add one for free
    box.className += ' callout warning nv';
    box.appendChild(el('h3', { id: 'nv-title', text: t('nv_title', { lang: langName(lang) }) }));
    box.appendChild(el('p', { text: t('nv_intro', { opt: t('all_voices') }) }));
    var plat = platform(), kinds = ['android', 'windows', 'ios'];
    var mine = kinds.indexOf(plat) >= 0 ? [plat] : kinds.slice();
    var others = kinds.filter(function (k) { return mine.indexOf(k) < 0; });
    var ul = el('ul');
    mine.forEach(function (k) {
      var li = el('li', { html: stepHtml(k, lang) });
      if (plat === k) li.appendChild(el('span', { class: 'badge accent', text: t('your_device') }));
      ul.appendChild(li);
    });
    box.appendChild(ul);
    if (others.length) {
      var d = el('details', {}, el('summary', { text: t('other_devices') }));
      var ul2 = el('ul');
      others.forEach(function (k) { ul2.appendChild(el('li', { html: stepHtml(k, lang) })); });
      d.appendChild(ul2);
      box.appendChild(d);
    }
    box.appendChild(el('p', { class: 'small', text: t('nv_edge') }));
    box.appendChild(el('button', { class: 'btn btn-sm', id: 'nv-try', type: 'button', text: '▶ ' + t('nv_try'), onclick: function () {
      S.tryAnyway[effLang()] = true;
      if (P.state === 'paused') resume(); else speakSentence(Math.max(0, P.si), 0);
    } }));
    box.hidden = false;
  }

  /* ---------------- speaking ---------------- */
  function clearTimers() { clearTimeout(P.goT); clearTimeout(P.echoT); clearInterval(P.watch); }

  /* Speak one piece of text. Every call gets a new generation number so events from a
     cancelled utterance are ignored. handlers: { onboundary(e), onend(ok, error) } */
  function say(text, lang, handlers) {
    handlers = handlers || {};
    var gen = ++P.gen;
    clearTimers();
    var rv = resolveVoice(lang);
    var u = new window.SpeechSynthesisUtterance(text);
    if (rv.voice) { u.voice = rv.voice; u.lang = rv.voice.lang; } else u.lang = EDU.langInfo(lang).tag;
    u.rate = cfg.rate; u.pitch = cfg.pitch;
    var ended = false;
    function finish(ok, err) {
      if (ended) return;
      ended = true;
      clearInterval(P.watch);
      if (gen !== P.gen) return;
      if (handlers.onend) handlers.onend(ok, err);
    }
    u.onstart = function () { if (gen === P.gen) P.started = Date.now(); };
    u.onboundary = function (e) { if (gen === P.gen && handlers.onboundary) handlers.onboundary(e); };
    u.onend = function () { finish(true); };
    u.onerror = function (e) {
      var er = e && e.error;
      if (er === 'interrupted' || er === 'canceled') { ended = true; return; }
      finish(false, er);
    };
    P.utt = u;                                  // keep a reference: Chrome can drop events of garbage-collected utterances
    var busy = synth.speaking || synth.pending;
    synth.cancel();
    // desktop Chrome's online "Google …" voices go silent after ~15 s and never send "end";
    // a quick pause + resume every 10 s keeps them talking (not on Android, where pause stops speech)
    var keepAlive = !!(rv.voice && rv.voice.localService === false && /^Google/i.test(rv.voice.name) && platform() !== 'android');
    function go() {
      if (gen !== P.gen) return;
      P.started = Date.now();
      synth.speak(u);
      // safety net: some Android voices never fire "end"
      var quiet = 0, kick = Date.now();
      P.watch = setInterval(function () {
        if (gen !== P.gen || ended) { clearInterval(P.watch); return; }
        if (!synth.speaking && !synth.pending) { if (++quiet >= 3 && Date.now() - P.started > 1500) finish(true); }
        else {
          quiet = 0;
          if (keepAlive && Date.now() - kick > 10000) { kick = Date.now(); try { synth.pause(); synth.resume(); } catch (e) { } }
        }
      }, 400);
    }
    if (busy) P.goT = setTimeout(go, 80); else go();
    return gen;
  }
  function silence() { P.gen++; clearTimers(); if (synth) synth.cancel(); }

  function canSpeak() {
    if (!HAS_TTS) { EDU.toast(t('no_speech')); return false; }
    if (!S.doc.sentences.length) { EDU.toast(t('empty_text')); $('#text').focus(); return false; }
    var lang = effLang(), rv = resolveVoice(lang);
    if (rv.kind === 'none' && S.voicesLoaded && S.voices.length && lang !== 'en' && !S.tryAnyway[lang]) {
      renderVoiceNote();
      EDU.toast(t('nv_title', { lang: langName(lang) }));
      var note = $('#voice-note');
      if (note.scrollIntoView) note.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return false;
    }
    return true;
  }

  function speakSentence(si, fromWord) {
    var n = S.doc.sentences.length;
    if (!n) { canSpeak(); return; }                 // nothing to read: explain, don't jump to "finished"
    if (si >= n) { finishAll(); return; }
    if (si < 0) si = 0;
    if (!canSpeak()) return;
    var s = S.doc.sentences[si];
    hideEcho();
    fromWord = fromWord > 0 && fromWord < s.words.length ? fromWord : 0;
    P.state = 'playing'; P.si = si; P.wi = fromWord; P.resumeNext = false; P.gotBoundary = false;
    clearWordHL();
    hlSentence(si);
    if (fromWord > 0) hlWord(si, fromWord);
    var off = s.words[fromWord].start;
    say(S.text.slice(off, s.end), effLang(), {
      onboundary: function (e) {
        if (e && e.name && e.name !== 'word') return;
        var wi = wordAt(s, off + (e && e.charIndex || 0));
        if (wi < 0) return;
        if (!P.gotBoundary) { P.gotBoundary = true; $('#boundary-note').hidden = true; }
        P.wi = wi;
        hlWord(si, wi);
      },
      onend: function (ok, err) {
        if (!ok) { P.state = 'paused'; P.resumeNext = false; renderPlayer(); EDU.toast(t('no_voice')); return; }
        clearWordHL();
        if (!P.gotBoundary && cfg.hl === 'word' && s.words.length - fromWord > 1) $('#boundary-note').hidden = false;
        if (cfg.echo) startEcho(si); else speakSentence(si + 1, 0);
      }
    });
    renderPlayer();
  }

  function speakWord(si, wi) {
    var s = S.doc.sentences[si], w = s && s.words[wi];
    if (!w) return;
    var word = cleanWord(w.text);
    if (!word || !canSpeak()) return;
    hideEcho();
    if (P.state !== 'idle' && P.state !== 'done') {
      P.state = 'paused'; P.si = si; P.wi = 0; P.resumeNext = false;
      hlSentence(si);
    }
    hlWord(si, wi, true);
    var node = w.el;
    say(word, effLang(), { onend: function () { if (P.hlW === node) clearWordHL(); } });
    P.lastWord = word;
    renderPlayer();
  }

  /* ---------------- echo reading ---------------- */
  function startEcho(si) {
    P.state = 'echo'; P.si = si; P.wi = 0; P.resumeNext = true;
    var box = $('#echo-box'), bar = $('#echo-prog'), wrap = $('#echo-prog-wrap');
    box.hidden = false;
    if (cfg.echoWait === 'auto') {
      var spoken = Date.now() - (P.started || Date.now());
      var wait = EDU.clamp(spoken * 1.3 + 1200, 2500, 20000);
      wrap.hidden = false;
      bar.style.transition = 'none'; bar.style.width = '0%';
      void bar.offsetWidth;
      bar.style.transition = 'width ' + wait + 'ms linear'; bar.style.width = '100%';
      P.echoT = setTimeout(echoDone, wait);
    } else {
      wrap.hidden = true;
      try { $('#echo-next').focus({ preventScroll: true }); } catch (e) { }
    }
    var s = S.doc.sentences[si];
    if (s) keepVisible(s.el, true);              // the sentence to repeat must not hide behind the prompt
    renderPlayer();
  }
  function hideEcho() { clearTimeout(P.echoT); $('#echo-box').hidden = true; }
  function echoDone() { hideEcho(); speakSentence(P.si + 1, 0); }

  /* ---------------- transport ---------------- */
  function play() {
    if (P.state === 'paused') return resume();
    speakSentence(0, 0);
  }
  function resume() {
    if (P.resumeNext) speakSentence(P.si + 1, 0);
    else speakSentence(Math.max(0, P.si), Math.max(0, P.wi));
  }
  function pause() {
    if (P.state === 'playing') { silence(); P.state = 'paused'; P.resumeNext = false; }
    else if (P.state === 'echo') { clearTimers(); hideEcho(); P.state = 'paused'; P.resumeNext = true; }
    renderPlayer();
  }
  function toggle() { if (P.state === 'playing' || P.state === 'echo') pause(); else play(); }
  function stop() {
    silence();
    hideEcho();
    clearHL();
    P.state = 'idle'; P.si = -1; P.wi = -1; P.resumeNext = false;
    renderPlayer();
  }
  function finishAll() {
    silence();
    hideEcho();
    clearHL();
    P.state = 'done'; P.si = S.doc.sentences.length - 1; P.wi = -1;
    renderPlayer();
  }
  function prevS() { if (S.doc.sentences.length) speakSentence(Math.max(0, P.si - 1), 0); }
  function nextS() {
    var n = S.doc.sentences.length;
    if (!n) return;
    if (P.si + 1 >= n) { finishAll(); return; }
    speakSentence(P.si + 1, 0);
  }
  function repeatS() { if (S.doc.sentences.length) speakSentence(Math.max(0, P.si), 0); }

  function renderPlayer() {
    var n = S.doc.sentences.length, st = P.state, has = n > 0 && HAS_TTS;
    var busy = st === 'playing' || st === 'echo';
    $('#play-ic').textContent = busy ? '⏸' : '▶';
    var lblKey = busy ? 'b_pause' : (st === 'paused' ? 'b_resume' : 'b_play');
    $('#play-lbl').setAttribute('data-i18n', lblKey);
    $('#play-lbl').textContent = t(lblKey);
    ['#play-btn', '#prev-btn', '#repeat-btn', '#next-btn'].forEach(function (s) { $(s).disabled = !has; });
    $('#stop-btn').disabled = !has || st === 'idle';
    var status = $('#status');
    status.dataset.state = st;
    var i = EDU.fmt(Math.max(0, P.si) + 1), nn = EDU.fmt(n);
    status.textContent = !n ? '' :
      st === 'playing' ? t('st_reading', { i: i, n: nn }) :
      st === 'paused' ? t('st_paused', { i: i, n: nn }) :
      st === 'echo' ? t('st_echo', { i: i, n: nn }) :
      st === 'done' ? '🎉 ' + t('st_done') : t('st_ready');
    var pct = !n ? 0 : st === 'done' ? 100 : st === 'idle' ? 0 : Math.round((P.si + 1) / n * 100);
    $('#prog').style.width = pct + '%';
    $('#echo-btn').setAttribute('aria-pressed', cfg.echo ? 'true' : 'false');
  }

  /* ---------------- text editing & samples ---------------- */
  function scriptGroup() { return S.text.trim() ? (S.detected === 'mr' ? 'hi' : S.detected) : null; }
  function analyse() {
    S.detected = detectLang(S.text);
    // a "Read as" choice belongs to the text it was made for: text in another script goes back to Auto
    var g = scriptGroup();
    if (g) {
      if (S.readAs !== 'auto' && S.group && g !== S.group) { S.readAs = 'auto'; store.set('readAs', 'auto'); }
      S.group = g;
    }
    S.doc = parse(S.text);
    P.state = 'idle'; P.si = -1; P.wi = -1;
    $('#boundary-note').hidden = true;
    renderReader();
    fillReadAs();
    fillVoices();
    renderVoiceNote();
    renderCounts();
    renderSampleBtns();
    renderPlayer();
  }
  function renderCounts() {
    var c = $('#counts');
    c.dataset.w = S.doc.words; c.dataset.s = S.doc.sentences.length;
    c.textContent = S.doc.sentences.length ? t('counts', { w: EDU.fmt(S.doc.words), s: EDU.fmt(S.doc.sentences.length) }) : '';
  }
  function setText(text, sample) {
    stop();
    S.text = text;
    S.sample = sample || null;
    $('#text').value = text;
    store.set('text', text);
    store.set('sample', S.sample);
    analyse();
  }
  function loadSample(lang, idx) {
    var smp = sampleOf(lang, idx);
    if (!smp) return;
    if (S.readAs !== 'auto') { S.readAs = 'auto'; store.set('readAs', 'auto'); }
    setText(smp.text, { lang: lang, idx: idx, follow: lang === EDU.lang });
  }
  function fillSampleLang() {
    var sel = $('#sample-lang');
    sel.textContent = '';
    CODES.forEach(function (c) { if (CONTENT[c]) sel.appendChild(el('option', { value: c, text: langLabel(c) })); });
    sel.value = S.sampleLang;
  }
  function renderSampleBtns() {
    var box = $('#sample-btns'), c = CONTENT[S.sampleLang];
    box.textContent = '';
    if (!c) return;
    c.samples.forEach(function (smp, idx) {
      var on = !!(S.sample && S.sample.lang === S.sampleLang && S.sample.idx === idx && S.text === smp.text);
      box.appendChild(el('button', {
        class: 'chip no-i18n', type: 'button', lang: S.sampleLang, dir: EDU.langInfo(S.sampleLang).dir,
        'aria-pressed': on ? 'true' : 'false', dataset: { idx: idx }, text: '📖 ' + smp.title,
        onclick: function () { loadSample(S.sampleLang, idx); }
      }));
    });
  }
  function fillReadAs() {
    var sel = $('#read-as');
    sel.textContent = '';
    sel.appendChild(el('option', { value: 'auto', text: t('auto_lang', { lang: langName(S.detected) }) }));
    CODES.forEach(function (c) { sel.appendChild(el('option', { value: c, text: langLabel(c) })); });
    sel.value = S.readAs;
  }

  /* ---------------- settings UI ---------------- */
  function applyCfg() {
    var r = $('#reader');
    r.style.setProperty('--ra-font', cfg.font + 'px');
    r.style.setProperty('--ra-line', String(cfg.line));
    r.classList.toggle('hl-sentence', cfg.hl === 'sentence');
    $('#rate').value = cfg.rate; $('#pitch').value = cfg.pitch; $('#font').value = cfg.font; $('#line').value = cfg.line;
    renderOutputs();
    $$('#hl-seg button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.hl === cfg.hl ? 'true' : 'false'); });
    $$('#tap-seg button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.tap === cfg.tap ? 'true' : 'false'); });
    $$('#wait-seg button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.wait === cfg.echoWait ? 'true' : 'false'); });
    $('#all-voices').checked = cfg.allVoices;
  }
  function renderOutputs() {
    $('#rate-out').textContent = EDU.fmt(cfg.rate, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '×';
    $('#pitch-out').textContent = EDU.fmt(cfg.pitch, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    $('#font-out').textContent = EDU.fmt(cfg.font) + ' px';
    $('#line-out').textContent = EDU.fmt(cfg.line, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }
  function bindRange(id, key, apply) {
    $(id).addEventListener('input', function () {
      var v = parseFloat(this.value);
      if (!isFinite(v)) return;
      cfg[key] = v;
      store.set(key, v);
      if (apply) apply();
      renderOutputs();
    });
  }
  bindRange('#rate', 'rate');
  bindRange('#pitch', 'pitch');
  bindRange('#font', 'font', function () { $('#reader').style.setProperty('--ra-font', cfg.font + 'px'); });
  bindRange('#line', 'line', function () { $('#reader').style.setProperty('--ra-line', String(cfg.line)); });
  function bindSeg(id, attr, key, after) {
    $(id).addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b || !b.dataset[attr]) return;
      cfg[key] = b.dataset[attr];
      store.set(key, cfg[key]);
      applyCfg();
      if (after) after();
    });
  }
  bindSeg('#hl-seg', 'hl', 'hl', function () { $('#boundary-note').hidden = true; });
  bindSeg('#tap-seg', 'tap', 'tap');
  bindSeg('#wait-seg', 'wait', 'echoWait', function () {
    if (P.state === 'echo') { clearTimeout(P.echoT); startEcho(P.si); }
  });

  $('#all-voices').addEventListener('change', function () {
    cfg.allVoices = this.checked;
    store.set('allVoices', cfg.allVoices);
    fillVoices();
  });
  $('#voice-sel').addEventListener('change', function () {
    var lang = effLang();
    if (this.value) S.voicePref[lang] = this.value; else delete S.voicePref[lang];
    store.set('voicePref', S.voicePref);
    fillVoices();
    renderVoiceNote();
  });
  $('#echo-btn').addEventListener('click', function () {
    cfg.echo = !cfg.echo;
    store.set('echo', cfg.echo);
    if (!cfg.echo && P.state === 'echo') echoDone();
    renderPlayer();
  });
  $('#echo-next').addEventListener('click', function () { if (P.state === 'echo') echoDone(); else nextS(); });

  /* ---------------- events ---------------- */
  var inputT = 0;
  $('#text').addEventListener('input', function () {
    // save at once (a reload right after typing must not lose the text); re-analyse after a short pause
    if (this.value !== S.text) { store.set('text', this.value); store.set('sample', null); }
    clearTimeout(inputT);
    inputT = setTimeout(function () {
      var v = $('#text').value;
      if (v === S.text) { store.set('text', v); store.set('sample', S.sample); return; }
      stop();
      S.text = v; S.sample = null;
      store.set('text', v); store.set('sample', null);
      analyse();
    }, 250);
  });
  $('#clear-btn').addEventListener('click', function () { setText('', null); $('#text').focus(); });
  $('#sample-lang').addEventListener('change', function () { S.sampleLang = this.value; renderSampleBtns(); });
  $('#read-as').addEventListener('change', function () {
    S.readAs = this.value;
    store.set('readAs', S.readAs);
    stop();
    $('#boundary-note').hidden = true;
    renderReader();
    fillVoices();
    renderVoiceNote();
    renderPlayer();
  });

  $('#play-btn').addEventListener('click', toggle);
  $('#stop-btn').addEventListener('click', stop);
  $('#prev-btn').addEventListener('click', prevS);
  $('#next-btn').addEventListener('click', nextS);
  $('#repeat-btn').addEventListener('click', repeatS);
  $('#print-btn').addEventListener('click', function () { window.print(); });
  var fsOK = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  $('#fs-btn').hidden = !fsOK;
  $('#fs-btn').addEventListener('click', function () { EDU.fullscreen($('#reader-card')); });
  function syncFs() {                          // the same button leaves full screen, so say so
    var on = !!(document.fullscreenElement || document.webkitFullscreenElement);
    var key = on ? 'exit_fs' : 'fullscreen';
    $('#fs-lbl').setAttribute('data-i18n', key);
    $('#fs-lbl').textContent = t(key);
    $('#fs-btn').setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  document.addEventListener('fullscreenchange', syncFs);
  document.addEventListener('webkitfullscreenchange', syncFs);

  $('#reader').addEventListener('click', function (e) {
    var w = e.target.closest && e.target.closest('.w');
    if (!w) return;
    var si = +w.dataset.s, wi = +w.dataset.w;
    if (cfg.tap === 'from') { speakSentence(si, wi); } else speakWord(si, wi);
  });

  $('#reset-btn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    stop();
    ['rate', 'pitch', 'font', 'line', 'hl', 'tap', 'echo', 'echoWait', 'allVoices', 'readAs', 'voicePref', 'text', 'sample'].forEach(function (k) { store.remove(k); });
    loadCfg();
    S.voicePref = {}; S.readAs = 'auto'; S.tryAnyway = {};
    S.sampleLang = CONTENT[EDU.lang] ? EDU.lang : 'en';
    fillSampleLang();
    applyCfg();
    loadSample(S.sampleLang, 0);
  });

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
    var tg = e.target || {}, tag = tg.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tg.isContentEditable) return;
    if (document.querySelector('.edu-modal-back')) return;
    var k = e.key;
    if (k === ' ' || k === 'Spacebar') {
      if (tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY') return;
      e.preventDefault(); toggle();
    } else if (k === 'Escape') {
      if (P.state !== 'idle') stop();
    } else if ((k === 'ArrowRight' || k === 'ArrowLeft') && S.doc.sentences.length) {
      var rtl = $('#reader').dir === 'rtl';
      e.preventDefault();
      if ((k === 'ArrowRight') !== rtl) nextS(); else prevS();
    } else if ((k === 'r' || k === 'R') && S.doc.sentences.length) {
      repeatS();
    }
  });
  window.addEventListener('pagehide', function () { if (synth) synth.cancel(); });

  /* ---------------- language change ---------------- */
  function renderStatic() {
    fillSampleLang();
    renderSampleBtns();
    fillReadAs();
    fillVoices();
    renderVoiceNote();
    renderCounts();
    renderOutputs();
    renderPlayer();
    if (!S.doc.sentences.length) renderReader();     // translated empty message
  }
  EDU.onLang(function (code) {
    var old = S.uiLang;
    S.uiLang = code;
    if (S.sampleLang === old && CONTENT[code]) S.sampleLang = code;
    if (S.sample && S.sample.follow && S.sample.lang === old && sampleOf(code, S.sample.idx) && S.text === sampleOf(old, S.sample.idx).text) {
      loadSample(code, S.sample.idx);          // an untouched sample follows the page language
    }
    // text without letters ("123") or ambiguous Devanagari falls back to the page language
    var d = detectLang(S.text);
    if (d !== S.detected && (P.state === 'idle' || P.state === 'done')) { S.detected = d; renderReader(); }
    renderStatic();
  });

  /* ---------------- start ---------------- */
  $('#text').value = S.text;
  applyCfg();
  S.detected = detectLang(S.text);
  S.group = scriptGroup();
  S.doc = parse(S.text);
  renderReader();
  renderStatic();

  if (HAS_TTS) {
    var onVoices = function (list) {
      if (list && list.length) S.voices = list;
      S.voicesLoaded = true;
      fillVoices();
      renderVoiceNote();
    };
    EDU.getVoices().then(onVoices);
    try { if (synth.addEventListener) synth.addEventListener('voiceschanged', function () { onVoices(synth.getVoices()); }); } catch (e) { }
  }

  // small hook for the automated test and for curious teachers
  window.READ_ALOUD = { parse: parse, detectLang: detectLang, state: function () { return { state: P.state, si: P.si, wi: P.wi, lang: effLang() }; } };
})();
