/* Talk & Listen (Speech AI): dictation, text-to-speech, pronunciation practice and a live spectrogram.
   Uses only the browser's Web Speech API + Web Audio. Nothing is recorded or stored by this app
   except the user's own text/scores in EDU.store (this device only). */
(function () {
  'use strict';
  var SLUG = 'speech-lab';
  var $ = EDU.$, $$ = EDU.$$, t = EDU.t;
  var store = EDU.store(SLUG);
  var CONTENT = window.APP_CONTENT || {};
  var CODES = EDU.LANGS.map(function (l) { return l.code; });
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var HAS_TTS = ('speechSynthesis' in window) && typeof window.SpeechSynthesisUtterance === 'function';
  var IS_ANDROID = /Android/i.test(navigator.userAgent || '');
  var FATAL = { 'not-allowed': 1, 'service-not-allowed': 1, 'audio-capture': 1, 'network': 1, 'language-not-supported': 1, 'bad-grammar': 1, 'start': 1 };

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ------------------------------------------------------------ state */
  function obj(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
  var S = {
    tab: store.get('tab', 'dict'),
    spLang: store.get('spLang', null),          // null = follow the page language
    dictText: String(store.get('dictText', '') || ''),
    ttsText: store.get('ttsText', null),        // null = show the sample text of the speech language
    rate: +store.get('rate', 1) || 1,
    pitch: store.get('pitch', 1),
    voice: obj(store.get('voice', {})),         // { lang: voiceURI }
    allVoices: !!store.get('allVoices', false),
    mode: store.get('mode', 'speak') === 'type' ? 'type' : 'speak',
    idx: obj(store.get('idx', {})),             // { lang: sentence index }
    best: obj(store.get('best', {})),           // { lang: { sentence: pct } }
    own: obj(store.get('own', {}))              // { lang: [sentence, ...] }
  };
  if (['dict', 'tts', 'prac', 'how'].indexOf(S.tab) < 0) S.tab = 'dict';
  if (typeof S.pitch !== 'number' || isNaN(S.pitch)) S.pitch = 1;
  S.rate = EDU.clamp(S.rate, 0.5, 2); S.pitch = EDU.clamp(S.pitch, 0, 2);

  function spLang() { return S.spLang && CODES.indexOf(S.spLang) >= 0 ? S.spLang : EDU.lang; }
  function tagOf(code) { return EDU.langInfo(code).tag; }
  function dirOf(code) { return EDU.langInfo(code).dir; }
  function langName(code) { return t('lang_' + code); }
  function content(code) { return CONTENT[code] || CONTENT.en || { sentences: [], tts_sample: '' }; }

  /* load a nice web font for the speech language's script when it differs from the page */
  var fontsAsked = {};
  function ensureFont(code) {
    var info = EDU.langInfo(code);
    if (!info.font || fontsAsked[info.font] || code === EDU.lang) return;
    fontsAsked[info.font] = 1;
    if (location.protocol === 'file:' && !navigator.onLine) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + info.font.replace(/ /g, '+') + ':wght@400;600;700&display=swap';
    document.head.appendChild(l);
  }
  function fontStack(code) {
    var info = EDU.langInfo(code);
    return info.font ? '"' + info.font + '", "Noto Sans", system-ui, "Nirmala UI", sans-serif' : '';
  }
  /* mark speech-language areas with lang/dir so fonts, line-height and RTL are right */
  function markLang() {
    var code = spLang();
    ensureFont(code);
    ['#dict-text', '#dict-interim', '#dict-guesses', '#tts-text', '#pr-target', '#pr-align', '#pr-heard', '#pr-typed', '#pr-new', '#pr-own'].forEach(function (sel) {
      var e = $(sel); if (!e) return;
      e.setAttribute('lang', code);
      e.setAttribute('dir', dirOf(code));
      e.style.fontFamily = code === EDU.lang ? '' : fontStack(code);
    });
    if ($('#pr-target').classList.contains('is-hidden')) { $('#pr-target').removeAttribute('lang'); $('#pr-target').removeAttribute('dir'); $('#pr-target').style.fontFamily = ''; }
  }

  /* ------------------------------------------------------------ text helpers */
  var SEG = (typeof Intl !== 'undefined' && Intl.Segmenter) ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  function countChars(s) {
    if (!s) return 0;
    if (SEG) { var n = 0; var it = SEG.segment(s)[Symbol.iterator](); while (!it.next().done) n++; return n; }
    return Array.from(s).length;
  }
  function countWords(s) { return String(s || '').split(/\s+/).filter(function (w) { return /[\p{L}\p{N}]/u.test(w); }).length; }

  var CHILLU = { 'ൺ': 'ണ്', 'ൻ': 'ന്', 'ർ': 'ര്', 'ൽ': 'ല്', 'ൾ': 'ള്', 'ൿ': 'ക്' };
  var CHANDRA = { 'ँ': 'ं', 'ঁ': 'ং', 'ਁ': 'ਂ', 'ੰ': 'ਂ', 'ઁ': 'ં', 'ଁ': 'ଂ', 'ఁ': 'ం' };
  var URDU = { 'ي': 'ی', 'ى': 'ی', 'ك': 'ک', 'ه': 'ہ' };
  /* Normalise one word so small spelling variants that a recogniser may produce still match:
     case, punctuation, nukta, chandrabindu/anusvara, Malayalam chillu forms, Arabic-script vowel marks. */
  function normWord(w) {
    var s = String(w || '').normalize('NFD');
    s = s.replace(/[​-‍⁠﻿]/g, '')
      .replace(/[़়਼઼଼಼]/g, '')
      .replace(/[ً-ٰٟ]/g, '');
    s = s.normalize('NFC')
      .replace(/[ൺ-ൿ]/g, function (c) { return CHILLU[c]; })
      .replace(/[ँঁਁੰઁଁఁ]/g, function (c) { return CHANDRA[c]; })
      .replace(/[يىكه]/g, function (c) { return URDU[c]; })
      .toLowerCase()
      .replace(/[\p{P}\p{S}]/gu, '');
    return s;
  }
  function tokens(text) {
    return String(text || '').trim().split(/\s+/).map(function (w) { return { disp: w, norm: normWord(w) }; })
      .filter(function (x) { return x.norm !== ''; });
  }
  function charSim(a, b) {
    var A = Array.from(a), B = Array.from(b), n = A.length, m = B.length;
    if (!n || !m) return 0;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= m; j++) prev[j] = j;
    for (i = 1; i <= n; i++) {
      cur = [i];
      for (j = 1; j <= m; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (A[i - 1] === B[j - 1] ? 0 : 1));
      prev = cur;
    }
    return 1 - prev[m] / Math.max(n, m);
  }
  /* Word-level Levenshtein alignment of what was heard against the target sentence. */
  function compare(target, heard) {
    var T = tokens(target), H = tokens(heard), n = T.length, m = H.length, i, j;
    var d = [];
    for (i = 0; i <= n; i++) { d[i] = [i]; }
    for (j = 0; j <= m; j++) d[0][j] = j;
    for (i = 1; i <= n; i++) for (j = 1; j <= m; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (T[i - 1].norm === H[j - 1].norm ? 0 : 1));
    }
    var ops = []; i = n; j = m;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (T[i - 1].norm === H[j - 1].norm ? 0 : 1)) {
        if (T[i - 1].norm === H[j - 1].norm) ops.push({ op: 'ok', t: T[i - 1].disp, h: H[j - 1].disp });
        else ops.push({ op: charSim(T[i - 1].norm, H[j - 1].norm) >= 0.6 ? 'close' : 'sub', t: T[i - 1].disp, h: H[j - 1].disp });
        i--; j--;
      } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) { ops.push({ op: 'miss', t: T[i - 1].disp }); i--; }
      else { ops.push({ op: 'extra', h: H[j - 1].disp }); j--; }
    }
    ops.reverse();
    var ok = 0, errs = 0;
    ops.forEach(function (o) { if (o.op === 'ok') ok++; else errs++; });
    var score = n ? Math.max(0, Math.round(100 * (n - errs) / n)) : 0;
    return { ops: ops, n: n, ok: ok, errors: errs, score: score, heard: heard };
  }
  /* expose the pure helpers (handy for teachers who open the console, and for tests) */
  window.SPEECH_LAB = { compare: compare, normWord: normWord, countWords: countWords };

  /* ------------------------------------------------------------ language bar + badges */
  function renderLangSelect() {
    var sel = $('#sp-lang'), cur = spLang();
    sel.innerHTML = '';
    EDU.LANGS.forEach(function (l) {
      var txt = l.native + (l.code === EDU.lang || langName(l.code) === l.native ? '' : ' (' + langName(l.code) + ')');
      sel.appendChild(EDU.el('option', { value: l.code, text: txt }));
    });
    sel.value = cur;
  }
  var voices = [];
  function voicesFor(code) {
    var tag = tagOf(code).toLowerCase();
    var list = voices.filter(function (v) {
      var l = String(v.lang || '').toLowerCase().replace('_', '-');
      return l.split('-')[0] === code;
    });
    list.sort(function (a, b) {
      var ea = String(a.lang).toLowerCase().replace('_', '-') === tag ? 0 : 1, eb = String(b.lang).toLowerCase().replace('_', '-') === tag ? 0 : 1;
      return ea - eb;
    });
    return list;
  }
  function renderBadges() {
    var b = $('#badge-sr');
    b.textContent = SR ? t('sr_yes') : t('sr_no');
    b.className = 'badge ' + (SR ? 'success' : 'danger');
    b.dataset.sr = SR ? 'yes' : 'no';
    var n = HAS_TTS ? voicesFor(spLang()).length : 0;
    var v = $('#badge-tts');
    v.textContent = t('tts_n', { n: EDU.fmt(n) });
    v.className = 'badge ' + (n ? 'success' : 'warn');
    v.dataset.n = String(n);
  }
  function setSpeechLang(code) {
    if (CODES.indexOf(code) < 0) return;
    stopAll();
    S.spLang = code; store.set('spLang', code);
    renderSpeechLang();
  }
  function renderSpeechLang() {
    $('#sp-lang').value = spLang();
    markLang();
    renderBadges();
    renderPunct();
    renderTtsText();
    renderVoices();
    renderPractice();
  }

  /* ------------------------------------------------------------ tabs */
  function renderTabs() {
    $$('[role="tab"]').forEach(function (b) {
      var on = b.dataset.tab === S.tab;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    ['dict', 'tts', 'prac', 'how'].forEach(function (k) { $('#panel-' + k).hidden = k !== S.tab; });
    if (S.tab === 'how') { setTimeout(sizeCanvases, 0); }
  }
  function setTab(k) {
    if (k === S.tab) return;
    if (S.tab === 'how') vizStop();
    stopRecognition();
    stopTts();
    S.tab = k; store.set('tab', k);
    renderTabs();
  }
  $$('[role="tab"]').forEach(function (b) {
    b.addEventListener('click', function () { setTab(b.dataset.tab); });
    b.addEventListener('keydown', function (e) {
      var tabs = $$('[role="tab"]'), i = tabs.indexOf(b), rtl = document.documentElement.dir === 'rtl', k = 0;
      if (e.key === 'ArrowRight') k = rtl ? -1 : 1; else if (e.key === 'ArrowLeft') k = rtl ? 1 : -1;
      else if (e.key === 'Home') k = -i; else if (e.key === 'End') k = tabs.length - 1 - i;
      if (!k) return;
      e.preventDefault();
      var nb = tabs[(i + k + tabs.length) % tabs.length];
      setTab(nb.dataset.tab); nb.focus();
    });
  });

  /* ------------------------------------------------------------ speech recognition sessions */
  var session = null;    // { r, owner, want, restarts, noSpeech, gotFinal, err }
  function errorText(code) {
    if (code === 'not-allowed' || code === 'service-not-allowed') return t('err_not_allowed');
    if (code === 'no-speech') return t('err_no_speech');
    if (code === 'network') return t('err_network');
    if (code === 'audio-capture') return t('err_audio');
    if (code === 'language-not-supported') return t('err_lang', { lang: langName(spLang()) });
    return t('err_other', { e: code || '?' });
  }
  function startRecognition(owner, opts) {
    stopRecognition(true);
    stopTts();
    var r = EDU.recognizer({ lang: spLang(), interim: true, continuous: !!opts.continuous, alternatives: opts.alternatives || 1 });
    if (!r) return null;
    var s = { r: r, owner: owner, want: true, restarts: 0, noSpeech: 0, gotFinal: false, err: null };
    r.onstart = function () { if (opts.onstart) opts.onstart(s); };
    r.onresult = function (e) { s.noSpeech = 0; if (opts.onresult) opts.onresult(e, s); };
    r.onerror = function (e) {
      var code = (e && e.error) || 'unknown';
      if (code === 'aborted') return;
      if (code === 'no-speech' && opts.keepAlive && s.want && ++s.noSpeech < 4) return;   // quiet pause: keep listening
      s.err = code;
      if (FATAL[code] || code === 'no-speech') s.want = false;
      if (opts.onerror) opts.onerror(code, s);
    };
    r.onend = function () {
      if (s.want && opts.keepAlive && !s.err && s.restarts < 200) {
        s.restarts++;
        try { r.start(); return; } catch (e) { /* fall through */ }
      }
      s.want = false;
      if (session === s) session = null;
      if (opts.onend) opts.onend(s);
    };
    session = s;
    try { r.start(); }
    catch (e) { session = null; s.err = 'start'; if (opts.onerror) opts.onerror('start', s); if (opts.onend) opts.onend(s); return null; }
    return s;
  }
  function stopRecognition(abort) {
    var s = session;
    if (!s) return;
    s.want = false;
    if (abort) { s.r.onstart = s.r.onresult = s.r.onerror = s.r.onend = null; }   // late events must not touch the new session
    try { if (abort) s.r.abort(); else s.r.stop(); } catch (e) { }
    if (abort) { session = null; if (s.owner === 'dict') { dict.state = 'idle'; renderDictState(); setInterim(''); } else { prac.listening = false; renderPracMic(); } }
  }
  function stopAll() { stopRecognition(true); stopTts(); }

  /* ------------------------------------------------------------ 1. dictation */
  var dict = { state: 'idle', errCode: null, guesses: null };
  var dictTA = $('#dict-text');
  var lastCaret = null;
  dictTA.value = S.dictText;

  function renderDictState() {
    var btn = $('#dict-mic'), on = dict.state === 'listening' || dict.state === 'starting';
    btn.classList.toggle('listening', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    $('#dict-mic-lbl').textContent = on ? t('mic_stop') : t('mic_start');
    btn.setAttribute('aria-disabled', SR ? 'false' : 'true');
    var st = $('#dict-status');
    st.dataset.state = dict.state;
    st.textContent = dict.state === 'error' ? errorText(dict.errCode)
      : dict.state === 'starting' ? t('st_starting')
      : dict.state === 'listening' ? t('st_listening')
      : SR ? t('st_idle') : t('unsupported_title');
  }
  function setInterim(txt) {
    $('#dict-interim').textContent = txt || '…';
    $('#dict-interim-wrap').classList.toggle('idle', !txt);
  }
  function saveDict() { S.dictText = dictTA.value; store.set('dictText', S.dictText); renderCount(); }
  function renderCount() {
    var v = dictTA.value, w = countWords(v), c = countChars(v), el = $('#dict-count');
    el.textContent = t('words_chars', { w: EDU.fmt(w), c: EDU.fmt(c) });
    el.dataset.w = String(w); el.dataset.c = String(c);
  }
  function appendFinal(txt) {
    txt = String(txt || '').trim();
    if (!txt) return;
    var v = dictTA.value;
    dictTA.value = v + (v && !/\s$/.test(v) ? ' ' : '') + txt;
    lastCaret = null;
    dictTA.scrollTop = dictTA.scrollHeight;
    saveDict();
  }
  function renderGuesses() {
    var ol = $('#dict-guesses');
    ol.innerHTML = '';
    var g = dict.guesses || [];
    $('#guesses-empty').hidden = g.length > 0;
    g.forEach(function (x) {
      var known = typeof x.conf === 'number' && x.conf > 0;
      var pct = known ? Math.round(x.conf * 100) : 0;
      ol.appendChild(EDU.el('li', {},
        EDU.el('span', { class: 'g-txt', text: x.text }),
        EDU.el('span', { class: 'g-meta' },
          EDU.el('span', { class: 'g-bar' }, EDU.el('span', { style: { width: (known ? pct : 0) + '%' } })),
          EDU.el('span', { class: 'g-conf', text: known ? t('confidence', { p: EDU.fmt(pct) }) : t('conf_unknown') }))));
    });
  }
  function startDict() {
    if (!SR) { showUnsupported(); return; }
    dict.state = 'starting'; dict.errCode = null; renderDictState();
    var s = startRecognition('dict', {
      continuous: !IS_ANDROID,          // Android Chrome repeats words in continuous mode; restart instead
      keepAlive: true, alternatives: 3,
      onstart: function () { if (dict.state !== 'error') { dict.state = 'listening'; renderDictState(); } },
      onresult: function (e) {
        var interim = '';
        for (var i = e.resultIndex; i < e.results.length; i++) {
          var res = e.results[i];
          if (!res || !res.length) continue;
          if (res.isFinal) {
            appendFinal(res[0].transcript);
            var g = [];
            for (var k = 0; k < res.length && k < 3; k++) if (res[k] && String(res[k].transcript || '').trim()) g.push({ text: String(res[k].transcript).trim(), conf: res[k].confidence });
            dict.guesses = g; renderGuesses();
          } else interim += res[0].transcript;
        }
        setInterim(interim);
        if (dict.state === 'starting') { dict.state = 'listening'; renderDictState(); }
      },
      onerror: function (code) { dict.state = 'error'; dict.errCode = code; renderDictState(); },
      onend: function () { setInterim(''); if (dict.state !== 'error') dict.state = 'idle'; renderDictState(); }
    });
    if (!s && dict.state !== 'error') { dict.state = 'idle'; renderDictState(); }
  }
  $('#dict-mic').addEventListener('click', function () {
    if (session && session.owner === 'dict' && session.want) {
      stopRecognition(false);
      dict.state = 'idle'; renderDictState();
      return;
    }
    startDict();
  });
  ['input', 'click', 'keyup', 'select'].forEach(function (ev) {
    dictTA.addEventListener(ev, function () { lastCaret = { s: dictTA.selectionStart, e: dictTA.selectionEnd }; if (ev === 'input') saveDict(); });
  });
  function punctChars(code) {
    var danda = { hi: 1, bn: 1, pa: 1, or: 1 };
    return {
      stop: code === 'ur' ? '۔' : danda[code] ? '।' : '.',
      comma: code === 'ur' ? '،' : ',',
      q: code === 'ur' ? '؟' : '?',
      nl: '↵'
    };
  }
  function renderPunct() {
    var p = punctChars(spLang());
    $$('#dict-punct [data-p]').forEach(function (b) { b.textContent = p[b.dataset.p]; });
  }
  $('#dict-punct').addEventListener('click', function (e) {
    var b = e.target.closest('[data-p]'); if (!b) return;
    var kind = b.dataset.p, ch = kind === 'nl' ? '\n' : punctChars(spLang())[kind];
    var v = dictTA.value;
    var atEnd = !lastCaret || lastCaret.s >= v.length;
    if (atEnd) {
      dictTA.value = kind === 'nl' ? v.replace(/[ \t]+$/, '') + '\n' : v.replace(/\s+$/, '') + ch + ' ';
      lastCaret = null;
    } else {
      dictTA.value = v.slice(0, lastCaret.s) + ch + v.slice(lastCaret.e);
      lastCaret = { s: lastCaret.s + ch.length, e: lastCaret.s + ch.length };
    }
    saveDict();
  });
  $('#dict-say').addEventListener('click', function () {
    var v = dictTA.value.trim(); if (!v) return;
    speakOrHelp(v, spLang(), { rate: S.rate, pitch: S.pitch });
  });
  $('#dict-copy').addEventListener('click', function () { if (dictTA.value.trim()) EDU.copy(dictTA.value); });
  $('#dict-dl').addEventListener('click', function () { if (dictTA.value.trim()) EDU.download('speech-text.txt', '﻿' + dictTA.value, 'text/plain;charset=utf-8'); });
  $('#dict-clear').addEventListener('click', function () {
    if (!dictTA.value) return;
    if (!confirm(t('confirm_clear'))) return;
    dictTA.value = ''; dict.guesses = null; renderGuesses(); saveDict();
  });
  $('#dict-fs').addEventListener('click', function () { EDU.fullscreen($('#dict-card')); });
  $('#dict-print').addEventListener('click', function () {
    var pa = $('#print-area'); pa.innerHTML = '';
    pa.appendChild(EDU.el('h1', { text: t('dict_title') }));
    pa.appendChild(EDU.el('p', { class: 'muted', text: t('app_title') + ' · ' + langName(spLang()) + ' · ' + new Date().toLocaleDateString() }));
    pa.appendChild(EDU.el('div', { class: 'pa-text', lang: spLang(), dir: dirOf(spLang()), text: dictTA.value }));
    doPrint();
  });

  /* ------------------------------------------------------------ 2. text to speech */
  var ttsRun = 0;
  function splitChunks(text) {
    var parts = String(text).match(/[^.!?।۔؟\n]+[.!?।۔؟]*\s*|\n+/g) || [];
    var out = [], buf = '';
    parts.forEach(function (p) {
      if (!p.trim()) { if (buf.trim()) { out.push(buf.trim()); buf = ''; } return; }
      if ((buf + p).length > 220 && buf.trim()) { out.push(buf.trim()); buf = ''; }
      buf += p;
      while (buf.length > 260) {              // very long text without punctuation: cut at a space
        var cut = buf.lastIndexOf(' ', 220); if (cut < 40) cut = 220;
        out.push(buf.slice(0, cut).trim()); buf = buf.slice(cut);
      }
    });
    if (buf.trim()) out.push(buf.trim());
    return out;
  }
  function pickVoice(code) {
    var uri = S.voice[code];
    if (uri) { var f = voices.filter(function (v) { return v.voiceURI === uri; })[0]; if (f) return f; }
    return voicesFor(code)[0] || EDU.voiceFor(voices, code);
  }
  /* returns false when there is no voice for the language (and force is not set) */
  function speakText(text, code, opts) {
    opts = opts || {};
    stopTts();
    if (!HAS_TTS) return false;
    var v = opts.force ? null : pickVoice(code);
    if (!v && !opts.force && code !== 'en') return false;
    var chunks = splitChunks(text);
    if (!chunks.length) return true;
    var run = ++ttsRun, i = 0;
    function next() {
      if (run !== ttsRun) return;
      if (i >= chunks.length) { if (opts.onend) opts.onend(); return; }
      var u = new SpeechSynthesisUtterance(chunks[i++]);
      u.lang = v ? v.lang : tagOf(code);
      if (v) u.voice = v;
      u.rate = opts.rate || 1;
      u.pitch = opts.pitch == null ? 1 : opts.pitch;
      u.onend = next;
      u.onerror = function (e) { if (run === ttsRun && e && e.error !== 'interrupted' && e.error !== 'canceled') next(); };
      if (opts.onchunk) opts.onchunk(i, chunks.length);
      window.speechSynthesis.speak(u);
    }
    next();
    return true;
  }
  function stopTts() {
    ttsRun++;
    if (HAS_TTS) { try { window.speechSynthesis.cancel(); } catch (e) { } }
    var st = $('#tts-status'); if (st) { st.textContent = ''; st.dataset.state = 'idle'; }
  }
  function speakOrHelp(text, code, opts) {
    if (!speakText(text, code, opts)) EDU.toast(t('no_voice'));
  }
  function renderTtsText() {
    var ta = $('#tts-text');
    if (S.ttsText === null || S.ttsText === undefined) ta.value = content(spLang()).tts_sample || '';
  }
  function renderVoices() {
    var sel = $('#tts-voice'), code = spLang();
    var list = S.allVoices ? voices.slice() : voicesFor(code);
    sel.innerHTML = '';
    sel.appendChild(EDU.el('option', { value: '', text: t('voice_auto') }));
    list.forEach(function (v) {
      sel.appendChild(EDU.el('option', { value: v.voiceURI, text: v.name + ' · ' + v.lang + (v.localService === false ? ' · ' + t('voice_online') : '') }));
    });
    var want = S.voice[code] || '';
    sel.value = list.some(function (v) { return v.voiceURI === want; }) ? want : '';
    $('#tts-all').checked = S.allVoices;
    var none = HAS_TTS && code !== 'en' && !pickVoice(code);
    $('#tts-novoice').hidden = !none && HAS_TTS;
    $('#tts-nv-title').textContent = HAS_TTS ? t('tts_none_title', { lang: langName(code) }) : t('no_voice');
    $('#tts-try').hidden = !HAS_TTS;
    renderBadges();
  }
  function renderRanges() {
    $('#tts-rate').value = String(S.rate); $('#tts-pitch').value = String(S.pitch);
    $('#tts-rate-out').textContent = EDU.fmt(S.rate, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '×';
    $('#tts-pitch-out').textContent = EDU.fmt(S.pitch, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }
  function loadVoices() {
    if (!HAS_TTS) { renderVoices(); return; }
    EDU.getVoices().then(function (v) { voices = (v || []).slice(); renderVoices(); renderPractice(); });
    try {
      window.speechSynthesis.addEventListener('voiceschanged', function () {
        voices = (window.speechSynthesis.getVoices() || []).slice(); renderVoices();
      });
    } catch (e) { }
  }
  function ttsPlay(force) {
    var text = $('#tts-text').value.trim();
    if (!text) { $('#tts-text').focus(); return; }
    var st = $('#tts-status');
    var ok = speakText(text, spLang(), {
      rate: S.rate, pitch: S.pitch, force: !!force,
      onchunk: function (i, n) { st.textContent = n > 1 ? t('tts_speaking', { i: EDU.fmt(i), n: EDU.fmt(n) }) : '🔊 …'; st.dataset.state = 'speaking'; },
      onend: function () { st.textContent = t('tts_done'); st.dataset.state = 'done'; }
    });
    if (!ok) { $('#tts-novoice').hidden = false; EDU.toast(t('no_voice')); }
  }
  $('#tts-text').addEventListener('input', function () { S.ttsText = $('#tts-text').value; store.set('ttsText', S.ttsText); });
  $('#tts-sample').addEventListener('click', function () { S.ttsText = null; store.remove('ttsText'); renderTtsText(); });
  $('#tts-from-dict').addEventListener('click', function () {
    if (!dictTA.value.trim()) { EDU.toast(t('dict_placeholder')); return; }
    $('#tts-text').value = dictTA.value; S.ttsText = dictTA.value; store.set('ttsText', S.ttsText);
  });
  $('#tts-voice').addEventListener('change', function () {
    var code = spLang();
    if ($('#tts-voice').value) S.voice[code] = $('#tts-voice').value; else delete S.voice[code];
    store.set('voice', S.voice); renderVoices();
  });
  $('#tts-all').addEventListener('change', function () { S.allVoices = $('#tts-all').checked; store.set('allVoices', S.allVoices); renderVoices(); });
  $('#tts-rate').addEventListener('input', function () { S.rate = +$('#tts-rate').value; store.set('rate', S.rate); renderRanges(); });
  $('#tts-pitch').addEventListener('input', function () { S.pitch = +$('#tts-pitch').value; store.set('pitch', S.pitch); renderRanges(); });
  $('#tts-play').addEventListener('click', function () { ttsPlay(false); });
  $('#tts-try').addEventListener('click', function () { ttsPlay(true); });
  $('#tts-stop').addEventListener('click', stopTts);

  /* ------------------------------------------------------------ 3. pronunciation practice */
  var prac = { listening: false, result: null, status: '', statusKey: null };
  function sentenceList(code) {
    var base = (content(code).sentences || []).map(function (s) { return { text: s, own: false }; });
    var own = (Array.isArray(S.own[code]) ? S.own[code] : []).map(function (s) { return { text: s, own: true }; });
    return base.concat(own);
  }
  function curIndex() {
    var code = spLang(), list = sentenceList(code);
    var i = +S.idx[code] || 0;
    return EDU.clamp(i, 0, Math.max(0, list.length - 1));
  }
  function curSentence() { var l = sentenceList(spLang()); return l[curIndex()] || { text: '', own: false }; }
  function bestFor(code, text) { var b = obj(S.best[code]); return typeof b[text] === 'number' ? b[text] : null; }
  function scoreClass(p) { return p >= 90 ? 'hi' : p >= 60 ? 'mid' : 'lo'; }
  function setIdx(i) {
    var code = spLang(), n = sentenceList(code).length;
    if (!n) return;
    stopRecognition(true); stopTts();
    S.idx[code] = (i + n) % n; store.set('idx', S.idx);
    prac.result = null; prac.statusKey = null; prac.status = '';
    $('#pr-typed').value = '';
    renderPractice();
  }
  function renderPracMic() {
    var b = $('#pr-mic');
    b.classList.toggle('listening', prac.listening);
    b.setAttribute('aria-pressed', prac.listening ? 'true' : 'false');
    $('#pr-mic-lbl').textContent = prac.listening ? t('stop') : t('speak_btn');
    b.setAttribute('aria-disabled', SR ? 'false' : 'true');
  }
  function setPracStatus(key, vars, state) {
    prac.statusKey = key; prac.statusVars = vars; prac.statusState = state || 'idle';
    renderPracStatus();
  }
  function renderPracStatus() {
    var st = $('#pr-status');
    st.dataset.state = prac.statusState || 'idle';
    if (!prac.statusKey) { st.textContent = ''; return; }
    st.textContent = prac.statusKey === '__err' ? errorText(prac.statusVars) : prac.statusKey === '__interim' ? '… ' + prac.statusVars : t(prac.statusKey, prac.statusVars);
  }
  function renderPractice() {
    var code = spLang(), list = sentenceList(code), i = curIndex(), cur = list[i] || { text: '' };
    var typeMode = S.mode === 'type';
    // mode
    $$('#pr-mode [data-mode]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.mode === S.mode ? 'true' : 'false'); });
    $('#pr-mode-hint').textContent = typeMode ? t('mode_type_hint') : t('mode_speak_hint');
    $('#pr-mic').hidden = typeMode;
    $('#pr-typebox').hidden = !typeMode;
    // chips
    var chips = $('#pr-chips'); chips.innerHTML = '';
    list.forEach(function (s, k) {
      var b = bestFor(code, s.text);
      var chip = EDU.el('button', {
        type: 'button', class: 'chip', dataset: { idx: String(k) }, 'aria-pressed': k === i ? 'true' : 'false',
        'aria-label': b === null ? t('sentence_n', { i: EDU.fmt(k + 1), n: EDU.fmt(list.length) }) : t('sentence_best', { i: EDU.fmt(k + 1), p: EDU.fmt(b) }),
        onclick: function () { setIdx(k); }
      }, s.own ? EDU.el('span', { class: 'own-star', 'aria-hidden': 'true', text: '★' }) : null, EDU.el('span', { text: EDU.fmt(k + 1) }),
        b === null ? null : EDU.el('span', { class: 'pc ' + scoreClass(b), text: EDU.fmt(b) + '%' }));
      chips.appendChild(chip);
    });
    $('#pr-pos').textContent = t('sentence_n', { i: EDU.fmt(i + 1), n: EDU.fmt(list.length) }) + (cur.own ? ' · ★ ' + t('own_badge') : '');
    // target
    var tg = $('#pr-target');
    var hide = typeMode && !(prac.result && prac.result.typed);
    tg.classList.toggle('is-hidden', hide);
    tg.dataset.hidden = hide ? 'true' : 'false';
    tg.textContent = hide ? t('hidden_sentence') : cur.text;
    markLang();
    renderPracMic();
    renderPracStatus();
    renderResult();
    renderProgress();
    renderOwn();
  }
  function renderResult() {
    var box = $('#pr-result'), r = prac.result;
    box.hidden = !r;
    if (!r) return;
    var sc = $('#pr-score');
    sc.textContent = EDU.fmt(r.score) + '%';
    sc.dataset.score = String(r.score);
    sc.className = 'big-number sc-' + scoreClass(r.score);
    $('#pr-line').textContent = t('score_line', { m: EDU.fmt(r.ok), n: EDU.fmt(r.n) });
    $('#pr-fb').textContent = r.score >= 90 ? t('fb_great') : r.score >= 60 ? t('fb_good') : t('fb_try');
    $('#pr-heard-lbl').textContent = r.typed ? t('you_typed') : t('heard');
    $('#pr-heard').textContent = r.heard || '—';
    var al = $('#pr-align'); al.innerHTML = '';
    r.ops.forEach(function (o) {
      if (o.op === 'ok') al.appendChild(EDU.el('span', { class: 'w w-ok', text: o.t }));
      else if (o.op === 'close' || o.op === 'sub') al.appendChild(EDU.el('span', { class: 'w ' + (o.op === 'close' ? 'w-close' : 'w-miss') }, EDU.el('span', { text: o.t }), EDU.el('span', { class: 'w-h', text: o.h })));
      else if (o.op === 'miss') al.appendChild(EDU.el('span', { class: 'w w-miss' }, EDU.el('span', { text: o.t }), EDU.el('span', { class: 'w-h', text: '—' })));
      else al.appendChild(EDU.el('span', { class: 'w w-extra', text: '+' + o.h }));
    });
  }
  function renderProgress() {
    var code = spLang(), list = sentenceList(code), done = 0, sum = 0;
    list.forEach(function (s) { var b = bestFor(code, s.text); if (b !== null) { done++; sum += b; } });
    var el = $('#pr-progress');
    el.textContent = t('practised', { a: EDU.fmt(done), n: EDU.fmt(list.length), p: EDU.fmt(done ? Math.round(sum / done) : 0) });
    el.dataset.done = String(done);
  }
  function renderOwn() {
    var code = spLang(), own = Array.isArray(S.own[code]) ? S.own[code] : [], ul = $('#pr-own');
    ul.innerHTML = '';
    own.forEach(function (s, k) {
      ul.appendChild(EDU.el('li', {}, EDU.el('span', { text: s }),
        EDU.el('button', { type: 'button', class: 'btn btn-sm btn-danger', text: t('remove_sentence'), 'aria-label': t('remove_sentence') + ': ' + s, onclick: function () { removeOwn(k); } })));
    });
    $('#pr-own-empty').hidden = own.length > 0;
  }
  function removeOwn(k) {
    var code = spLang(), own = (S.own[code] || []).slice();
    var base = (content(code).sentences || []).length;
    own.splice(k, 1); S.own[code] = own; store.set('own', S.own);
    var i = curIndex();
    if (i >= base + k && i > 0) S.idx[code] = i - (i === base + k ? 0 : 1);
    S.idx[code] = EDU.clamp(+S.idx[code] || 0, 0, Math.max(0, base + own.length - 1)); store.set('idx', S.idx);
    prac.result = null; renderPractice();
  }
  function recordResult(res) {
    var code = spLang(), text = curSentence().text;
    var b = obj(S.best[code]);
    if (typeof b[text] !== 'number' || res.score > b[text]) { b[text] = res.score; S.best[code] = b; store.set('best', S.best); }
    prac.result = res;
    renderPractice();
  }
  function finishSpoken(alts) {
    var target = curSentence().text, best = null;
    alts.forEach(function (a) { var r = compare(target, a); if (!best || r.score > best.score) best = r; });
    if (!best || !best.heard.trim()) { setPracStatus('no_heard', null, 'error'); return; }
    setPracStatus(null);
    recordResult(best);
  }
  function startPrac() {
    if (!SR) { showUnsupported(); return; }
    prac.result = null; renderResult();
    prac.listening = true; renderPracMic();
    setPracStatus('st_starting', null, 'idle');
    var alts = null;
    var s = startRecognition('prac', {
      continuous: false, keepAlive: false, alternatives: 5,
      onstart: function () { setPracStatus('st_listening', null, 'listening'); },
      onresult: function (e) {
        var interim = '';
        for (var i = e.resultIndex; i < e.results.length; i++) {
          var res = e.results[i];
          if (!res || !res.length) continue;
          if (res.isFinal) {
            alts = alts || [];
            var main = [];
            for (var k = 0; k < res.length; k++) if (res[k]) main.push(String(res[k].transcript || ''));
            if (!alts.length) alts = main;
            else alts = alts.map(function (a, k2) { return (a + ' ' + (main[k2] || main[0] || '')).trim(); });
          } else interim += res[0].transcript;
        }
        if (interim) { prac.statusKey = '__interim'; prac.statusVars = interim; prac.statusState = 'listening'; renderPracStatus(); }
      },
      onerror: function (code) { prac.listening = false; renderPracMic(); setPracStatus('__err', code, 'error'); },
      onend: function (s2) {
        prac.listening = false; renderPracMic();
        if (s2.err) return;
        if (alts && alts.length) finishSpoken(alts);
        else setPracStatus('no_heard', null, 'error');
      }
    });
    if (!s) { prac.listening = false; renderPracMic(); }
  }
  $('#pr-mic').addEventListener('click', function () {
    if (prac.listening && session && session.owner === 'prac') { stopRecognition(false); return; }
    startPrac();
  });
  $('#pr-listen').addEventListener('click', function () {
    var s = curSentence().text; if (!s) return;
    speakOrHelp(s, spLang(), { rate: Math.min(S.rate, 1) * 0.9, pitch: S.pitch });
  });
  function checkTyped() {
    var typed = $('#pr-typed').value.trim();
    if (!typed) { $('#pr-typed').focus(); return; }
    var r = compare(curSentence().text, typed); r.typed = true;
    setPracStatus(null);
    recordResult(r);
  }
  $('#pr-check').addEventListener('click', checkTyped);
  $('#pr-typed').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); checkTyped(); } });
  $('#pr-prev').addEventListener('click', function () { setIdx(curIndex() - 1); });
  $('#pr-next').addEventListener('click', function () { setIdx(curIndex() + 1); });
  $('#pr-next2').addEventListener('click', function () { setIdx(curIndex() + 1); });
  $('#pr-again').addEventListener('click', function () {
    prac.result = null; $('#pr-typed').value = ''; renderPractice();
    if (S.mode === 'speak') startPrac(); else $('#pr-typed').focus();
  });
  $('#pr-mode').addEventListener('click', function (e) {
    var b = e.target.closest('[data-mode]'); if (!b || b.dataset.mode === S.mode) return;
    stopRecognition(true); stopTts();
    S.mode = b.dataset.mode; store.set('mode', S.mode);
    prac.result = null; setPracStatus(null); renderPractice();
  });
  $('#pr-add').addEventListener('click', addOwn);
  $('#pr-new').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addOwn(); } });
  function addOwn() {
    var v = $('#pr-new').value.replace(/\s+/g, ' ').trim().slice(0, 200);
    if (!tokens(v).length) { $('#pr-new').focus(); return; }
    var code = spLang(), own = Array.isArray(S.own[code]) ? S.own[code].slice() : [];
    if (own.indexOf(v) < 0) own.push(v);
    S.own[code] = own; store.set('own', S.own);
    $('#pr-new').value = '';
    var i = sentenceList(code).map(function (s) { return s.text; }).lastIndexOf(v);
    S.idx[code] = i < 0 ? 0 : i; store.set('idx', S.idx);
    prac.result = null; renderPractice();
  }
  $('#pr-reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    stopAll();
    S.best = {}; S.own = {}; S.idx = {};
    store.remove('best'); store.remove('own'); store.remove('idx');
    prac.result = null; setPracStatus(null); $('#pr-typed').value = '';
    renderPractice();
  });
  $('#pr-fs').addEventListener('click', function () { EDU.fullscreen($('#prac-card')); });
  $('#pr-print').addEventListener('click', function () {
    var code = spLang(), pa = $('#print-area');
    pa.innerHTML = '';
    pa.appendChild(EDU.el('h1', { text: t('sheet_title') }));
    pa.appendChild(EDU.el('p', { text: t('sheet_lang', { lang: langName(code) }) + ' · ' + t('app_title') }));
    pa.appendChild(EDU.el('p', { text: t('sheet_fill') }));
    var ol = EDU.el('ol', { class: 'pa-list', lang: code, dir: dirOf(code) });
    sentenceList(code).forEach(function (s) {
      var b = bestFor(code, s.text);
      ol.appendChild(EDU.el('li', {}, EDU.el('span', { text: s.text }), EDU.el('span', { class: 'pa-score', lang: EDU.lang, dir: dirOf(EDU.lang), text: t('sheet_score') + ': ' + (b === null ? '______' : EDU.fmt(b) + '%') })));
    });
    pa.appendChild(ol);
    doPrint();
  });

  /* ------------------------------------------------------------ print helper */
  function doPrint() {
    document.body.classList.add('sl-printing');
    var done = function () { document.body.classList.remove('sl-printing'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(function () { window.print(); setTimeout(done, 1500); }, 50);
  }

  /* ------------------------------------------------------------ unsupported / file notes */
  function showUnsupported() {
    var w = $('#sr-warn'); w.hidden = false;
    w.scrollIntoView({ behavior: 'smooth', block: 'center' });
    EDU.toast(t('unsupported_title'));
  }
  $('#sr-warn').hidden = !!SR;
  $('#file-note').hidden = !(SR && location.protocol === 'file:');

  /* ------------------------------------------------------------ 4. how it works: live spectrogram */
  var viz = { ctx: null, an: null, stream: null, src: null, osc: [], raf: 0, mode: 'idle', frames: 0, col: null, timer: 0 };
  var waveC = $('#wave'), specC = $('#spec');
  function sizeCanvases() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    [[waveC, 70], [specC, 220]].forEach(function (p) {
      var c = p[0], w = Math.max(200, Math.round((c.clientWidth || 600) * dpr)), h = Math.round(p[1] * dpr);
      if (c.width === w && c.height === h) return;
      var keep = null;
      if (c === specC && +specC.dataset.frames > 0 && c.width && c.height) {   // keep the voice picture when the screen resizes or rotates
        keep = document.createElement('canvas'); keep.width = c.width; keep.height = c.height;
        keep.getContext('2d').drawImage(c, 0, 0);
      }
      c.width = w; c.height = h;
      if (c === specC) { clearSpec(); if (keep) specC.getContext('2d').drawImage(keep, 0, 0, keep.width, keep.height, w - keep.width, 0, keep.width, h); }
    });
    drawWave(null);
  }
  function clearSpec() {
    var g = specC.getContext('2d');
    g.fillStyle = '#0b1020'; g.fillRect(0, 0, specC.width, specC.height);
  }
  /* Mel scale: speech AI models look at sound on this scale (more room for low pitches, like our ears). */
  var MAXF = 8000;
  function mel(f) { return 2595 * Math.log(1 + f / 700) / Math.LN10; }
  function fromMel(m) { return 700 * (Math.pow(10, m / 2595) - 1); }
  function yFrac(f) { return mel(f) / mel(MAXF); }          // 0 = bottom, 1 = top
  (function buildAxis() {
    var ax = $('#spec-axis');
    [250, 500, 1000, 2000, 4000].forEach(function (f) {
      var lab = f < 1000 ? f + ' Hz' : (f / 1000) + ' kHz';
      ax.appendChild(EDU.el('span', { class: 'ax-line', style: { bottom: (yFrac(f) * 100).toFixed(2) + '%' } }, EDU.el('b', { text: lab })));
    });
  })();
  var rowBins = null, rowKey = '';
  function binsForRows(H, binHz, nBins) {
    var key = H + ':' + binHz + ':' + nBins;
    if (key === rowKey) return rowBins;
    var mMax = mel(MAXF), out = [];
    for (var y = 0; y < H; y++) {
      var fHi = fromMel((1 - y / H) * mMax), fLo = fromMel((1 - (y + 1) / H) * mMax);
      var lo = Math.max(0, Math.floor(fLo / binHz)), hi = Math.min(nBins - 1, Math.max(lo, Math.ceil(fHi / binHz)));
      out.push([lo, hi]);
    }
    rowKey = key; rowBins = out;
    return out;
  }
  var RAMP = [[0, [11, 16, 32]], [0.3, [59, 15, 112]], [0.55, [181, 54, 122]], [0.78, [251, 139, 60]], [1, [252, 253, 191]]];
  function ramp(x) {
    for (var k = 1; k < RAMP.length; k++) {
      if (x <= RAMP[k][0]) {
        var a = RAMP[k - 1], b = RAMP[k], f = (x - a[0]) / (b[0] - a[0]);
        return [a[1][0] + (b[1][0] - a[1][0]) * f, a[1][1] + (b[1][1] - a[1][1]) * f, a[1][2] + (b[1][2] - a[1][2]) * f];
      }
    }
    return RAMP[RAMP.length - 1][1];
  }
  function drawWave(data) {
    var g = waveC.getContext('2d'), W = waveC.width, H = waveC.height;
    g.clearRect(0, 0, W, H);
    g.fillStyle = EDU.css('--surface-2') || '#eee'; g.fillRect(0, 0, W, H);
    g.strokeStyle = EDU.css('--border') || '#ccc'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
    if (!data) return;
    g.strokeStyle = EDU.css('--primary') || '#0b4f5c'; g.lineWidth = Math.max(1.5, W / 600);
    g.beginPath();
    for (var i = 0; i < data.length; i++) {
      var x = i / (data.length - 1) * W, y = H / 2 + ((data[i] - 128) / 128) * (H / 2 - 3);
      if (i) g.lineTo(x, y); else g.moveTo(x, y);
    }
    g.stroke();
  }
  function vizEnsureCtx() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!viz.ctx || viz.ctx.state === 'closed') {
      viz.ctx = new AC();
      viz.an = viz.ctx.createAnalyser();
      viz.an.fftSize = 1024; viz.an.smoothingTimeConstant = 0.15;
      viz.an.minDecibels = -100; viz.an.maxDecibels = -20;
    }
    if (viz.ctx.state === 'suspended' && viz.ctx.resume) viz.ctx.resume().catch(function () { });
    return viz.ctx;
  }
  function vizLoop() {
    if (viz.mode === 'idle') return;
    var an = viz.an, ctx = viz.ctx;
    var freq = new Uint8Array(an.frequencyBinCount), time = new Uint8Array(an.fftSize);
    an.getByteFrequencyData(freq); an.getByteTimeDomainData(time);
    drawWave(time);
    var g = specC.getContext('2d'), W = specC.width, H = specC.height, step = Math.max(2, Math.round(W / 400));
    g.drawImage(specC, -step, 0);
    if (!viz.col || viz.col.width !== step || viz.col.height !== H) viz.col = g.createImageData(step, H);
    var px = viz.col.data, rows = binsForRows(H, ctx.sampleRate / an.fftSize, freq.length);
    for (var y = 0; y < H; y++) {
      var r = rows[y], v = 0;
      for (var b = r[0]; b <= r[1]; b++) if (freq[b] > v) v = freq[b];
      var c = ramp(v / 255);
      for (var x = 0; x < step; x++) { var o = (y * step + x) * 4; px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255; }
    }
    g.putImageData(viz.col, W - step, 0);
    viz.frames++;
    if (viz.frames % 2 === 0) specC.dataset.frames = String(viz.frames);
    viz.raf = requestAnimationFrame(vizLoop);
  }
  function vizBegin(mode) {
    viz.mode = mode; viz.frames = 0; specC.dataset.frames = '0';
    $('#see-empty').hidden = true;
    renderViz();
    cancelAnimationFrame(viz.raf);
    viz.raf = requestAnimationFrame(vizLoop);
  }
  function vizStop() {
    cancelAnimationFrame(viz.raf); clearTimeout(viz.timer);
    viz.osc.forEach(function (o) { try { o.stop(); } catch (e) { } try { o.disconnect(); } catch (e) { } });
    viz.osc = [];
    if (viz.src) { try { viz.src.disconnect(); } catch (e) { } viz.src = null; }
    if (viz.stream) { viz.stream.getTracks().forEach(function (tr) { tr.stop(); }); viz.stream = null; }
    if (viz.ctx && viz.ctx.state !== 'closed') { try { viz.ctx.close(); } catch (e) { } }
    viz.ctx = null; viz.an = null;
    var was = viz.mode; viz.mode = 'idle';
    if (was !== 'idle' && viz.status !== 'error') viz.status = null;
    renderViz();
  }
  function vizMic() {
    if (viz.mode === 'mic') { vizStop(); return; }
    vizStop();
    stopRecognition(true);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !vizEnsureCtx()) { viz.status = 'error'; renderViz(); return; }
    var ctx = viz.ctx;
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true } }).then(function (stream) {
      if (viz.ctx !== ctx) { stream.getTracks().forEach(function (tr) { tr.stop(); }); return; }
      viz.stream = stream;
      viz.src = ctx.createMediaStreamSource(stream);
      viz.src.connect(viz.an);
      viz.status = 'mic';
      vizBegin('mic');
    }).catch(function () { vizStop(); viz.status = 'error'; renderViz(); });
  }
  function vizDemo() {
    vizStop();
    stopRecognition(true); stopTts();
    var ctx = vizEnsureCtx();
    if (!ctx) { viz.status = 'error'; renderViz(); return; }
    var now = ctx.currentTime + 0.05;
    var out = ctx.createGain(), vol = ctx.createGain(), look = ctx.createGain(); vol.gain.value = 0.15; look.gain.value = 0.06;
    out.connect(look); look.connect(viz.an); out.connect(vol); vol.connect(ctx.destination);   // the picture sees full level, the speakers play it softly
    // 1) a "hum" like a voiced vowel: a buzzy tone at 140 Hz, shaped by two resonances (formants of "aa")
    var hum = ctx.createOscillator(); hum.type = 'sawtooth'; hum.frequency.setValueAtTime(140, now);
    hum.frequency.linearRampToValueAtTime(170, now + 1.6);
    var f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 750; f1.Q.value = 4;
    var f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1200; f2.Q.value = 5;
    var hg = ctx.createGain(); hg.gain.setValueAtTime(0, now); hg.gain.linearRampToValueAtTime(3, now + 0.1); hg.gain.setValueAtTime(3, now + 1.6); hg.gain.linearRampToValueAtTime(0, now + 1.75);
    hum.connect(f1); hum.connect(f2); f1.connect(hg); f2.connect(hg); hg.connect(out);
    var dry = ctx.createGain(); dry.gain.setValueAtTime(0.12, now); dry.gain.setValueAtTime(0.12, now + 1.6); dry.gain.linearRampToValueAtTime(0, now + 1.75);
    hum.connect(dry); dry.connect(out);
    hum.start(now); hum.stop(now + 1.8);
    // 2) a whistle sliding up and down
    var wh = ctx.createOscillator(); wh.type = 'sine';
    wh.frequency.setValueAtTime(900, now + 1.9); wh.frequency.exponentialRampToValueAtTime(3600, now + 2.9); wh.frequency.exponentialRampToValueAtTime(1200, now + 3.8);
    var wg = ctx.createGain(); wg.gain.setValueAtTime(0, now); wg.gain.setValueAtTime(0, now + 1.9); wg.gain.linearRampToValueAtTime(0.9, now + 2.0); wg.gain.setValueAtTime(0.9, now + 3.7); wg.gain.linearRampToValueAtTime(0, now + 3.85);
    wh.connect(wg); wg.connect(out);
    wh.start(now + 1.85); wh.stop(now + 3.9);
    viz.osc = [hum, wh];
    viz.status = 'demo';
    vizBegin('demo');
    viz.timer = setTimeout(function () { if (viz.mode === 'demo') { cancelAnimationFrame(viz.raf); viz.mode = 'idle'; viz.status = null; try { viz.ctx.close(); } catch (e) { } viz.ctx = null; viz.an = null; renderViz(); } }, 4300);
  }
  function renderViz() {
    $('#see-mic-lbl').textContent = viz.mode === 'mic' ? t('stop') : t('see_start');
    $('#see-mic').setAttribute('aria-pressed', viz.mode === 'mic' ? 'true' : 'false');
    var st = $('#see-status');
    st.dataset.state = viz.status === 'error' ? 'error' : viz.mode;
    st.textContent = viz.status === 'error' ? t('mic_denied') : viz.mode === 'mic' ? t('see_listening') : viz.mode === 'demo' ? t('see_demo_on') : '';
    $('#see-empty').hidden = viz.mode !== 'idle' || +specC.dataset.frames > 0;
  }
  $('#see-mic').addEventListener('click', vizMic);
  $('#see-demo').addEventListener('click', vizDemo);
  window.addEventListener('resize', function () { if (S.tab === 'how') sizeCanvases(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) { vizStop(); stopRecognition(true); } });
  EDU.onTheme(function () { if (viz.mode === 'idle') drawWave(null); });

  /* ------------------------------------------------------------ language changes */
  $('#sp-lang').addEventListener('change', function () { setSpeechLang($('#sp-lang').value); });
  function renderAll() {
    renderLangSelect();
    renderDictState();
    renderCount();
    renderGuesses();
    renderRanges();
    renderSpeechLang();
    renderViz();
    renderTabs();
  }
  EDU.onLang(function () {
    if (!S.spLang) stopAll();          // the speech language follows the page language
    renderAll();
  });

  setInterim('');
  renderAll();
  loadVoices();
})();
