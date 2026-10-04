/* Typing Tutor: lessons, free practice and "type in your language".
   The <textarea> value is the single source of truth, so it works with physical keyboards,
   phone on-screen keyboards and Indian-language IMEs (Gboard, INSCRIPT, phonetic). Text is compared
   grapheme by grapheme (Intl.Segmenter), so क्षि or கொ count as one character each. */
(function () {
  'use strict';
  var SLUG = 'typing-tutor';
  var store = EDU.store(SLUG);
  var D = window.TT_DATA;
  var CONTENT = window.APP_CONTENT || {};
  var LESSONS = D.lessons;
  var LANG_CODES = EDU.LANGS.map(function (l) { return l.code; });
  var MAX_FREE = 3000;
  var FINGER_VAR = { L5: '--c5', L4: '--c3', L3: '--c4', L2: '--c7', T: '--c8', R2: '--c2', R3: '--c4', R4: '--c3', R5: '--c5' };
  var KEY_SYM = { bksp: '⌫', tab: '⇥', caps: '⇪', enter: '↵', shiftL: '⇧', shiftR: '⇧' };

  EDU.init({ slug: SLUG, title: 'app_title' });

  var $ = EDU.$, $$ = EDU.$$, t = EDU.t, el = EDU.el;
  var ta = $('#typein'), target = $('#target');

  function obj(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
  var S = {
    tab: store.get('tab', 'lessons'),
    prog: obj(store.get('prog', {})),
    hist: store.get('hist', []),
    langBest: obj(store.get('langBest', {})),
    limit: +store.get('limit', 0) || 0,
    easy: !!store.get('easy', false),
    showKbd: store.get('showKbd', true) !== false,
    langCode: store.get('langCode', null),
    name: String(store.get('name', '') || '')
  };
  if (!Array.isArray(S.hist)) S.hist = [];
  if ([0, 60, 120, 300].indexOf(S.limit) < 0) S.limit = 0;

  /* ---------------------------------------------------------------- text helpers */
  var segCache = {};
  function segmenter(lang) {
    if (typeof Intl === 'undefined' || !Intl.Segmenter) return null;
    var k = lang || 'und';
    if (!segCache[k]) {
      try { segCache[k] = new Intl.Segmenter(lang || undefined, { granularity: 'grapheme' }); }
      catch (e) { segCache[k] = new Intl.Segmenter(undefined, { granularity: 'grapheme' }); }
    }
    return segCache[k];
  }
  var MARK;
  try { MARK = new RegExp('^[\\p{M}]$', 'u'); } catch (e) { MARK = /^[̀-ͯऀ-ःऺ-ॏঁ-ঃ়-্ਁ-ਃ਼-੍ઁ-ઃ઼-્ଁ-ଃ଼-୍ஂா-்ఀ-ఄా-్ಁ-ಃ಼-್ഀ-ഃാ-്ً-ٟ]$/; }
  /* split into user-perceived characters (grapheme clusters) */
  function graphemes(s, lang) {
    if (!s) return [];
    var sg = segmenter(lang), out = [];
    if (sg) {
      var it = sg.segment(s)[Symbol.iterator](), r;
      while (!(r = it.next()).done) out.push(r.value.segment);
      return out;
    }
    Array.from(s).forEach(function (c) { if (out.length && MARK.test(c)) out[out.length - 1] += c; else out.push(c); });
    return out;
  }
  /* make text from any keyboard / IME comparable: one Unicode form, plain quotes and dashes,
     old Malayalam chillu sequences, Arabic → Urdu letters, no invisible joiners */
  function normCommon(s) {
    s = String(s == null ? '' : s);
    try { s = s.normalize('NFC'); } catch (e) { }
    return s
      .replace(/ന്‍/g, 'ൻ').replace(/ണ്‍/g, 'ൺ').replace(/ര്‍/g, 'ർ')
      .replace(/ല്‍/g, 'ൽ').replace(/ള്‍/g, 'ൾ').replace(/ക്‍/g, 'ൿ')
      .replace(/[​‌‍⁠﻿­]/g, '')
      .replace(/[‘’‚‛′]/g, '\'').replace(/[“”„‟″]/g, '"')
      .replace(/[‐-―−]/g, '-').replace(/…/g, '...')
      .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک')
      .replace(/[  -   　\t\r\n]/g, ' ');
  }
  function normTarget(s) { return normCommon(s).replace(/ {2,}/g, ' ').trim(); }
  function normTyped(s) { return normCommon(s); }
  function easify(s) {
    var out;
    try { out = s.toLowerCase().replace(new RegExp('[^\\p{L}\\p{M}\\p{N} ]', 'gu'), ''); }
    catch (e) { out = s.toLowerCase().replace(/[!-\/:-@\[-`{-~]/g, ''); }
    return out.replace(/ {2,}/g, ' ').trim();
  }
  function fmtTime(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }
  function fmtDate(ts) {
    try { return new Date(ts).toLocaleString(EDU.langInfo(EDU.lang).tag, { numberingSystem: 'latn', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return new Date(ts).toLocaleString(); }
  }
  function starsEl(n, big) {
    n = EDU.clamp(n || 0, 0, 3);
    var s = el('span', { class: 'tt-stars', role: 'img', 'aria-label': t('stars_aria', { n: n }), dataset: { stars: String(n) } });
    for (var i = 0; i < 3; i++) s.appendChild(el('span', { class: i < n ? 'on' : 'off', 'aria-hidden': 'true', text: '★' }));
    return s;
  }
  function lessonById(id) { for (var i = 0; i < LESSONS.length; i++) if (LESSONS[i].id === id) return LESSONS[i]; return null; }
  function lessonNo(id) { for (var i = 0; i < LESSONS.length; i++) if (LESSONS[i].id === id) return i + 1; return 0; }
  function lessonName(id) { return t('lesson_n', { n: EDU.fmt(lessonNo(id)) }) + ' · ' + t('les_' + id); }
  function passages(code) { var c = CONTENT[code]; return (c && Array.isArray(c.passages)) ? c.passages : []; }
  function langFont(code) {
    var info = EDU.langInfo(code);
    if (info.font && !langFont.loaded[info.font] && /^https?:$/.test(location.protocol)) {
      langFont.loaded[info.font] = 1;
      document.head.appendChild(el('link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=' + info.font.replace(/ /g, '+') + ':wght@400;700&display=swap' }));
    }
    return (info.font ? '"' + info.font + '", ' : '') + '"Noto Sans", system-ui, "Nirmala UI", sans-serif';
  }
  langFont.loaded = {};

  /* ---------------------------------------------------------------- keyboard + hands */
  var KEYMAP = { ' ': { k: 'space', shift: false } }, KEYFINGER = {};
  D.rows.forEach(function (row) {
    row.forEach(function (k) {
      KEYFINGER[k[0]] = k[3];
      if (k[0].length === 1) {
        KEYMAP[k[0]] = { k: k[0], shift: false };
        if (k[1].length === 1) KEYMAP[k[1]] = { k: k[0], shift: true };
      }
    });
  });
  function shiftFor(k) { return (KEYFINGER[k] || '').charAt(0) === 'L' ? 'shiftR' : 'shiftL'; }
  function fingerName(f) { return f === 'T' ? t('fn_T') : t('fn_' + f); }

  function buildKeyboard(box) {
    box.innerHTML = '';
    D.rows.forEach(function (row) {
      var r = el('div', { class: 'kb-row' });
      row.forEach(function (k) {
        var id = k[0], f = k[3];
        var e = el('span', { class: 'key', dataset: { k: id }, style: { '--w': String(k[2]), '--fc': f ? 'var(' + FINGER_VAR[f] + ')' : 'transparent' } });
        if (id === 'gap') e.classList.add('gap');
        else if (id === 'space') e.classList.add('wordy');
        else if (id.length > 1) { e.classList.add('wordy'); e.appendChild(el('span', { class: 'sym', text: KEY_SYM[id] })); e.appendChild(el('span', { class: 'kw', text: k[1] })); }
        else if (/[a-z]/.test(id)) e.textContent = k[1];
        else { e.appendChild(el('span', { class: 'sh', text: k[1] })); e.appendChild(el('span', { text: id })); }
        if (id === 'f' || id === 'j') e.classList.add('home');
        r.appendChild(e);
      });
      box.appendChild(r);
    });
  }

  var SVGNS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function buildHands(box) {
    box.innerHTML = '';
    var s = svg('svg', { viewBox: '0 0 440 172', 'aria-hidden': 'true', focusable: 'false' });
    var FING = [[12, 62, 28, '5'], [46, 34, 30, '4'], [82, 22, 30, '3'], [118, 38, 30, '2']];
    var HOME = { L5: 'A', L4: 'S', L3: 'D', L2: 'F', R2: 'J', R3: 'K', R4: 'L', R5: ';' };
    ['L', 'R'].forEach(function (side) {
      var g = svg('g', side === 'R' ? { transform: 'translate(440,0) scale(-1,1)' } : {});
      FING.forEach(function (fg) {
        var code = side + fg[3];
        var r = svg('rect', { x: fg[0], y: fg[1], width: fg[2], height: 122 - fg[1], rx: 14, class: 'finger', 'data-f': code });
        r.style.setProperty('--fc', 'var(' + FINGER_VAR[code] + ')');
        g.appendChild(r);
      });
      g.appendChild(svg('rect', { x: 8, y: 96, width: 146, height: 70, rx: 28, class: 'palm' }));
      var th = svg('rect', { x: 146, y: 92, width: 28, height: 62, rx: 14, transform: 'rotate(38 160 150)', class: 'finger', 'data-f': 'T' });
      th.style.setProperty('--fc', 'var(--c8)');
      g.appendChild(th);
      s.appendChild(g);
      FING.forEach(function (fg) {
        var code = side + fg[3], cx = fg[0] + fg[2] / 2;
        var tx = svg('text', { x: side === 'L' ? cx : 440 - cx, y: fg[1] + 24 });
        tx.textContent = HOME[code];
        s.appendChild(tx);
      });
    });
    box.appendChild(s);
    box.appendChild(el('div', { class: 'hand-lbls' }, el('span', { text: t('left_hand') }), el('span', { text: t('right_hand') })));
  }
  function buildLegend(box) {
    box.innerHTML = '';
    var items = [['lg_pinky', '--c5'], ['lg_ring', '--c3'], ['lg_middle', '--c4'], ['fn_L2', '--c7'], ['fn_R2', '--c2'], ['lg_thumb', '--c8']];
    box.appendChild(el('h3', { text: t('legend_h') }));
    var ul = el('ul');
    items.forEach(function (it) {
      ul.appendChild(el('li', {}, el('span', { class: 'sw', style: { '--fc': 'var(' + it[1] + ')' } }), el('span', { text: t(it[0]) })));
    });
    box.appendChild(ul);
    box.appendChild(el('p', { class: 'small muted', text: t('legend_note') }));
  }

  /* ---------------------------------------------------------------- typing engine */
  var R = null, tick = null;

  function startRun(cfg) {
    stopTick();
    var lang = cfg.mode === 'lang' ? cfg.lang : 'en';
    var text = normTarget(cfg.text);
    if (cfg.easy) text = easify(text);
    R = { cfg: cfg, lang: lang, text: text, T: graphemes(text, lang), st: [], shown: [], committed: [], typedLen: 0,
      strokes: 0, errors: 0, start: 0, end: 0, done: false, composing: false, cur: -1 };
    showTrainer();
    var isLang = cfg.mode === 'lang', nonLatin = /[^\u0000-ɏ\s]/.test(text);
    target.dir = isLang ? EDU.langInfo(lang).dir : (nonLatin ? 'auto' : 'ltr');
    target.lang = isLang ? lang : (nonLatin ? '' : 'en');
    target.classList.toggle('lang', isLang || nonLatin);
    target.style.setProperty('--tt-font', isLang ? langFont(lang) : 'inherit');
    ta.dir = target.dir; ta.lang = target.lang;
    ta.classList.toggle('lang', isLang || nonLatin);
    ta.style.setProperty('--tt-font', target.style.getPropertyValue('--tt-font'));
    ta.setAttribute('inputmode', 'text');
    /* English drills: no autocorrect or suggestions. Own-language mode: keep them, transliteration keyboards need the suggestion strip. */
    if (isLang) { ta.removeAttribute('autocomplete'); ta.removeAttribute('autocorrect'); ta.removeAttribute('spellcheck'); ta.setAttribute('autocapitalize', 'off'); }
    else { ta.setAttribute('autocomplete', 'off'); ta.setAttribute('autocorrect', 'off'); ta.setAttribute('spellcheck', 'false'); ta.setAttribute('autocapitalize', 'off'); }
    target.dataset.text = text;
    $('#trainer').dataset.mode = cfg.mode;
    $('#trainer').dataset.lesson = cfg.lessonId || '';
    renderTarget();
    ta.value = ''; ta.disabled = false;
    target.classList.remove('done');
    $('#result').hidden = true;
    renderTrainerChrome();
    updateStats(); updateHint();
    try { ta.focus({ preventScroll: true }); } catch (e) { ta.focus(); }
    var tr = $('#trainer');
    if (tr.getBoundingClientRect().top < 0 || tr.getBoundingClientRect().top > window.innerHeight * 0.5) tr.scrollIntoView({ block: 'start' });
  }

  function renderTarget() {
    var frag = document.createDocumentFragment();
    R.spans = R.T.map(function (g, i) {
      var s = document.createElement('span');
      s.className = g === ' ' ? 'ch sp' : 'ch';
      s.dataset.i = i;
      s.textContent = g;
      frag.appendChild(s);
      return s;
    });
    target.innerHTML = '';
    target.appendChild(frag);
    target.scrollTop = 0;
    R.shown = [];
    paint();
  }

  function onInput() {
    if (!R || R.done) return;
    var G = graphemes(normTyped(ta.value), R.lang), T = R.T;
    if (G.length && !R.start) { R.start = Date.now(); startTick(); }
    var n = Math.min(G.length, T.length), st = new Array(n);
    for (var i = 0; i < n; i++) {
      if (G[i] === T[i]) st[i] = 'ok';
      else if (i === G.length - 1 && T[i].length > G[i].length && T[i].indexOf(G[i]) === 0) st[i] = 'pend';   /* IME still building this letter */
      else st[i] = 'bad';
    }
    R.st = st; R.typedLen = G.length;
    if (!R.composing) commit(st);
    if (T.length && G.length >= T.length && st[T.length - 1] !== 'pend') { commit(st); finish('done'); return; }
    paint(); updateStats(); updateHint();
  }

  /* count a keystroke each time a position becomes right or wrong; a wrong one is a mistake */
  function commit(st) {
    var c = R.committed, len = Math.max(c.length, st.length);
    for (var i = 0; i < len; i++) {
      var ns = st[i];
      if (ns === 'ok' || ns === 'bad') {
        if (c[i] !== ns) { R.strokes++; if (ns === 'bad') R.errors++; c[i] = ns; }
      } else c[i] = undefined;
    }
    c.length = st.length;
  }

  function paint() {
    var st = R.st, T = R.T, cur = -1;
    if (!R.done) {
      if (st.length && st[st.length - 1] === 'pend') cur = st.length - 1;
      else if (R.typedLen < T.length) cur = R.typedLen;
    }
    for (var i = 0; i < T.length; i++) {
      var cls = (T[i] === ' ' ? 'ch sp' : 'ch') + (st[i] ? ' ' + st[i] : '') + (i === cur ? ' cur' : '');
      if (R.shown[i] !== cls) { R.spans[i].className = cls; R.shown[i] = cls; }
    }
    if (cur >= 0 && cur !== R.cur) {
      var sp = R.spans[cur], top = sp.offsetTop, h = target.clientHeight;
      if (top < target.scrollTop + 4 || top > target.scrollTop + h * 0.6) target.scrollTop = Math.max(0, top - h * 0.3);
    }
    R.cur = cur;
  }

  function elapsed() { if (!R || !R.start) return 0; return (R.done ? R.end : Date.now()) - R.start; }
  function correctCount() { var n = 0; for (var i = 0; i < R.st.length; i++) if (R.st[i] === 'ok') n++; return n; }
  function speedNow(ms) {
    var min = Math.max(ms, 1000) / 60000, c = correctCount();
    return R.cfg.mode === 'lang' ? c / min : c / 5 / min;
  }
  function accuracy() { return R.strokes ? (R.strokes - R.errors) / R.strokes * 100 : 100; }
  function accShown(a) { var r = Math.round(a); if (r === 100 && R.errors > 0) r = 99; return r; }

  function updateStats() {
    if (!R) return;
    var ms = elapsed(), limit = R.cfg.limit || 0;
    $('#st-speed').textContent = EDU.fmt(ms >= 2000 || R.done ? Math.round(speedNow(ms)) : 0);
    $('#st-acc').textContent = EDU.fmt(accShown(accuracy())) + '%';
    var e = $('#st-err');
    e.textContent = EDU.fmt(R.errors);
    e.classList.toggle('bad', R.errors > 0);
    $('#st-time').textContent = limit && !R.done ? fmtTime(Math.max(0, limit * 1000 - ms) + 999) : fmtTime(R.done ? ms + 500 : ms);
    var pct = R.T.length ? Math.min(100, R.typedLen / R.T.length * 100) : 0;
    if (limit && !R.done) pct = Math.max(pct, 0);
    $('#st-bar').style.width = (R.done && R.reason === 'done' ? 100 : pct) + '%';
  }
  function startTick() {
    stopTick();
    tick = setInterval(function () {
      if (!R || R.done) return stopTick();
      if (R.cfg.limit && elapsed() >= R.cfg.limit * 1000) { commit(R.st); finish('time'); return; }
      updateStats();
    }, 250);
  }
  function stopTick() { if (tick) { clearInterval(tick); tick = null; } }

  function starsFor(acc, wpm, goal) {
    if (acc >= 97 && wpm >= goal) return 3;
    if (acc >= 92 && wpm >= Math.ceil(goal / 2)) return 2;
    if (acc >= 80) return 1;
    return 0;
  }

  function finish(reason) {
    if (!R || R.done) return;
    var now = Date.now();
    if (!R.start) R.start = now;
    R.end = reason === 'time' ? R.start + R.cfg.limit * 1000 : now;
    R.done = true; R.reason = reason;
    stopTick();
    var ms = R.end - R.start, acc = accuracy();
    var res = { speed: Math.round(speedNow(ms)), acc: acc, accShown: accShown(acc), errors: R.errors, ms: ms, correct: correctCount(), stars: null, best: false };
    var cfg = R.cfg;
    if (cfg.mode === 'lesson') {
      var L = lessonById(cfg.lessonId), p = obj(S.prog[cfg.lessonId]);
      res.stars = starsFor(acc, res.speed, L.goal);
      res.best = (p.tries || 0) > 0 && res.speed > (p.best || 0) && acc >= 80;
      S.prog[cfg.lessonId] = { stars: Math.max(p.stars || 0, res.stars), best: Math.max(p.best || 0, res.speed),
        acc: Math.max(p.acc || 0, res.accShown), tries: (p.tries || 0) + 1, last: now };
      store.set('prog', S.prog);
    } else if (cfg.mode === 'lang') {
      var prev = +S.langBest[cfg.lang] || 0;
      res.best = prev > 0 && res.speed > prev && acc >= 80;
      if (acc >= 80 || !prev) S.langBest[cfg.lang] = Math.max(prev, res.speed);
      store.set('langBest', S.langBest);
    }
    S.hist.unshift({ ts: now, mode: cfg.mode, ref: cfg.mode === 'lesson' ? cfg.lessonId : (cfg.mode === 'lang' ? cfg.lang : ''),
      idx: cfg.idx || 0, speed: res.speed, unit: cfg.mode === 'lang' ? 'cpm' : 'wpm', acc: res.accShown, err: res.errors, ms: ms });
    S.hist = S.hist.slice(0, 30);
    store.set('hist', S.hist);
    R.res = res;
    ta.disabled = true;
    target.classList.add('done');
    paint(); updateStats(); updateHint();
    showResult();
    var r = $('#result');
    try { $('#again').focus({ preventScroll: true }); } catch (e) { }
    if (r.getBoundingClientRect().top < 0 || r.getBoundingClientRect().bottom > window.innerHeight) r.scrollIntoView({ block: 'nearest' });
  }

  /* ---------------------------------------------------------------- trainer UI */
  function showResult() {
    var res = R.res, cfg = R.cfg;
    $('#result').hidden = false;
    $('#res-title').textContent = t(R.reason === 'time' ? 'res_time_up' : 'res_done');
    var old = $('#res-stars'), ns;
    if (res.stars === null) ns = el('span', { id: 'res-stars', hidden: true });
    else { ns = starsEl(res.stars); ns.id = 'res-stars'; }
    old.parentNode.replaceChild(ns, old);
    var b = $('#res-best');
    b.innerHTML = '';
    if (res.best) b.appendChild(el('span', { class: 'badge success tt-newbest', text: '🏆 ' + t('new_best') }));
    $('#res-speed').textContent = EDU.fmt(res.speed);
    $('#res-speed-lbl').textContent = t(cfg.mode === 'lang' ? 'speed_cpm' : 'speed_wpm');
    $('#res-acc').textContent = EDU.fmt(res.accShown) + '%';
    $('#res-err').textContent = EDU.fmt(res.errors);
    $('#res-time').textContent = fmtTime(res.ms + 500);
    var msg;
    if (cfg.mode === 'lesson') msg = 'res_msg' + res.stars;
    else msg = res.acc >= 95 ? 'res_msg_ok' : (res.acc >= 85 ? 'res_msg1' : 'res_msg0');
    $('#res-msg').textContent = t(msg);
    var det = $('#res-detail');
    det.dataset.correct = String(res.correct);
    det.dataset.total = String(R.T.length);
    det.textContent = t('res_detail', { n: EDU.fmt(res.correct), total: EDU.fmt(R.T.length) }) +
      (cfg.mode === 'lesson' ? ' · ' + t('goal_line', { goal: EDU.fmt(lessonById(cfg.lessonId).goal) }) : '');
    var idx = LESSONS.indexOf(lessonById(cfg.lessonId));
    $('#next-lesson').hidden = !(cfg.mode === 'lesson' && idx >= 0 && idx < LESSONS.length - 1);
    $('#new-text').hidden = cfg.mode === 'free';
  }

  function renderTrainerChrome() {
    if (!R) return;
    var cfg = R.cfg, title = $('#run-title'), sub = $('#run-sub');
    title.innerHTML = ''; sub.innerHTML = '';
    if (cfg.mode === 'lesson') {
      var L = lessonById(cfg.lessonId);
      title.textContent = lessonName(L.id);
      sub.textContent = t('goal_line', { goal: EDU.fmt(L.goal) });
    } else if (cfg.mode === 'free') {
      title.textContent = t('tab_free');
      sub.textContent = cfg.limit ? t('time_limit') + ': ' + t('min_n', { n: EDU.fmt(cfg.limit / 60) }) : t('time_limit') + ': ' + t('no_limit');
    } else {
      var P = passages(cfg.lang)[cfg.idx] || {};
      title.appendChild(el('span', { text: EDU.langInfo(cfg.lang).native + ' · ' }));
      title.appendChild(el('span', { lang: cfg.lang, dir: EDU.langInfo(cfg.lang).dir, text: P.title || '' }));
      sub.textContent = t('lang_hint_short');
    }
    var isLang = cfg.mode === 'lang';
    $('#st-speed-lbl').textContent = t(isLang ? 'speed_cpm' : 'speed_wpm');
    $('#st-time-lbl').textContent = t(cfg.limit && !R.done ? 'time_left' : 'time');
    $('#kb-area').hidden = isLang;
    $('#lang-note').hidden = !isLang;
    $('#hint').hidden = isLang;
    $('#kb-box').hidden = !S.showKbd;
    $('#show-kbd').checked = S.showKbd;
    if (R.done) showResult();
  }

  function kbdLabel(k, ch) {
    if (k === 'space') return t('key_space');
    if (k === 'shiftL' || k === 'shiftR') return t('key_shift');
    if (k === 'bksp') return t('key_backspace');
    return ch;
  }
  function fingPart(k, ch) {
    var f = KEYFINGER[k];
    return el('span', { class: 'fing', style: { '--fc': 'var(' + FINGER_VAR[f] + ')' } },
      el('kbd', { class: 'no-i18n', dir: 'ltr', text: kbdLabel(k, ch) }), el('span', { class: 'dot', 'aria-hidden': 'true' }), el('span', { text: fingerName(f) }));
  }
  function keyEl(box, k) {
    var all = box.querySelectorAll('.key');
    for (var i = 0; i < all.length; i++) if (all[i].dataset.k === k) return all[i];
    return null;
  }
  function updateHint() {
    var hint = $('#hint'), kbd = $('#kbd'), hands = $('#hands');
    $$('.key.next', kbd).forEach(function (e) { e.classList.remove('next'); });
    $$('.finger.on', hands).forEach(function (e) { e.classList.remove('on'); });
    hands.classList.remove('active');
    hint.innerHTML = '';
    if (!R || R.done || R.cfg.mode === 'lang') return;
    var keys = [], last = R.typedLen - 1;
    if (last >= 0 && last < R.st.length && R.st[last] === 'bad') {
      keys = [['bksp', '']];
      hint.appendChild(el('span', { class: 'warn', text: t('hint_fix') }));
    } else {
      var ch = R.T[R.typedLen];
      if (ch === undefined) return;
      var m = KEYMAP[ch];
      hint.appendChild(el('span', { class: 'muted', text: t('next_key') }));
      if (!m) { hint.appendChild(el('span', { text: t('hint_nokey') })); return; }
      if (m.shift) keys.push([shiftFor(m.k), '']);
      keys.push([m.k, /[a-z]/.test(ch) ? ch.toUpperCase() : ch]);
    }
    keys.forEach(function (kc, i) {
      if (i) hint.appendChild(el('span', { 'aria-hidden': 'true', text: '+' }));
      hint.appendChild(fingPart(kc[0], kc[1]));
      var ke = keyEl(kbd, kc[0]);
      if (ke) ke.classList.add('next');
      $$('.finger[data-f="' + KEYFINGER[kc[0]] + '"]', hands).forEach(function (fe) { fe.classList.add('on'); hands.classList.add('active'); });
    });
  }

  function showTrainer() {
    $$('.tt-panel').forEach(function (p) { p.hidden = true; });
    $('#trainer').hidden = false;
  }
  function leaveTrainer() {
    stopTick();
    R = null;
    $('#trainer').hidden = true;
  }
  function restart() { if (R) startRun(R.cfg); }

  /* ---------------------------------------------------------------- tabs */
  var TABS = ['lessons', 'free', 'lang', 'progress'];
  function setTab(tab) {
    if (TABS.indexOf(tab) < 0) tab = 'lessons';
    S.tab = tab; store.set('tab', tab);
    leaveTrainer();
    $$('#tabs [role="tab"]').forEach(function (b) {
      var on = b.dataset.tab === tab;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    TABS.forEach(function (x) { $('#panel-' + x).hidden = x !== tab; });
    renderPanel(tab);
  }
  function renderPanel(tab) {
    if (tab === 'lessons') renderLessons();
    else if (tab === 'free') renderFree();
    else if (tab === 'lang') renderLang();
    else renderProgress();
  }

  /* ---------------------------------------------------------------- lessons */
  function nextLessonId() {
    for (var i = 0; i < LESSONS.length; i++) if (!(obj(S.prog[LESSONS[i].id]).stars >= 1)) return LESSONS[i].id;
    for (var j = 0; j < LESSONS.length; j++) if ((obj(S.prog[LESSONS[j].id]).stars || 0) < 3) return LESSONS[j].id;
    return LESSONS[LESSONS.length - 1].id;
  }
  function renderLessons() {
    var box = $('#lesson-list'), nx = nextLessonId();
    box.innerHTML = '';
    D.stages.forEach(function (stage) {
      var list = LESSONS.filter(function (L) { return L.stage === stage; });
      var got = list.reduce(function (a, L) { return a + (obj(S.prog[L.id]).stars || 0); }, 0);
      var sec = el('div', { class: 'tt-stage' },
        el('h3', {}, el('span', { text: t('stage_' + stage) }), el('span', { class: 'badge', text: EDU.fmt(got) + '/' + EDU.fmt(list.length * 3) + ' ★' })));
      var grid = el('div', { class: 'tt-lessons' });
      list.forEach(function (L) {
        var p = obj(S.prog[L.id]), n = lessonNo(L.id);
        var small = el('small');
        if (L.keys) {
          var ks = el('span', { class: 'tt-keys no-i18n' });
          L.keys.split(' ').forEach(function (k) { ks.appendChild(el('kbd', { text: k })); });
          small.appendChild(ks);
        }
        small.appendChild(el('span', { text: t('goal_wpm', { n: EDU.fmt(L.goal) }) }));
        if (p.tries) small.appendChild(el('span', { text: '· ' + t('best_n', { n: EDU.fmt(p.best || 0) }) }));
        if (L.id === nx) small.appendChild(el('span', { class: 'badge accent tt-upnext', text: t('up_next') }));
        var btn = el('button', { type: 'button', class: 'tt-lesson' + (L.id === nx ? ' is-next' : '') + (p.stars ? ' done' : ''), dataset: { lesson: L.id } },
          el('span', { class: 'num', text: EDU.fmt(n) }),
          el('span', { class: 'txt' }, el('b', { text: t('les_' + L.id) }), small),
          starsEl(p.stars || 0));
        btn.addEventListener('click', function () { startLesson(L.id); });
        grid.appendChild(btn);
      });
      sec.appendChild(grid);
      box.appendChild(sec);
    });
    $('#continue').textContent = '▶ ' + t('continue_btn', { n: EDU.fmt(lessonNo(nx)) });
    $('#continue').dataset.lesson = nx;
    $('#star-rule').textContent = t('star_rule');
  }
  function startLesson(id, idx) {
    var L = lessonById(id);
    if (!L) return;
    if (idx === undefined) idx = (obj(S.prog[id]).tries || 0) % L.texts.length;
    startRun({ mode: 'lesson', lessonId: id, idx: idx, text: L.texts[idx], limit: 0 });
  }

  /* ---------------------------------------------------------------- free practice */
  var freeTA = $('#free-text');
  function renderFree() {
    $$('#limit button').forEach(function (b) {
      var v = +b.dataset.limit;
      b.textContent = v ? t('min_n', { n: EDU.fmt(v / 60) }) : t('no_limit');
      b.setAttribute('aria-pressed', v === S.limit ? 'true' : 'false');
    });
    $('#easy').checked = S.easy;
    updateFreeCount();
  }
  function updateFreeCount() {
    var n = graphemes(normTarget(freeTA.value)).length;
    $('#free-count').textContent = n ? t('chars_n', { n: EDU.fmt(n) }) : '';
  }
  function startFree() {
    var clean = normTarget(freeTA.value);
    if (!clean) { EDU.toast(t('free_empty')); freeTA.focus(); return; }
    if (clean.length > MAX_FREE) {
      clean = clean.slice(0, MAX_FREE).replace(/\s+\S*$/, '');
      EDU.toast(t('too_long', { n: EDU.fmt(MAX_FREE) }));
    }
    if (S.easy && !easify(clean)) { EDU.toast(t('free_empty')); return; }
    startRun({ mode: 'free', text: clean, limit: S.limit, easy: S.easy, idx: 0 });
  }

  /* ---------------------------------------------------------------- type in your language */
  function curLangCode() {
    if (S.langCode && LANG_CODES.indexOf(S.langCode) >= 0) return S.langCode;
    return EDU.lang !== 'en' ? EDU.lang : 'hi';
  }
  function renderLang() {
    var sel = $('#lang-sel'), code = curLangCode();
    if (!sel.options.length) {
      EDU.LANGS.forEach(function (l) { sel.appendChild(el('option', { value: l.code, text: l.native + (l.code === 'en' ? '' : ' · ' + l.name) })); });
    }
    sel.value = code;
    var box = $('#passages');
    box.innerHTML = '';
    var font = langFont(code), dir = EDU.langInfo(code).dir;
    passages(code).forEach(function (P, i) {
      var n = graphemes(normTarget(P.text), code).length;
      var btn = el('button', { type: 'button', class: 'tt-passage', dataset: { idx: String(i) } },
        el('b', { lang: code, dir: dir, class: 'no-i18n', style: { fontFamily: font }, text: P.title }),
        el('span', { class: 'pv no-i18n', lang: code, dir: dir, style: { fontFamily: font }, text: P.text }),
        el('span', { class: 'meta' }, el('span', { class: 'badge', text: t('chars_n', { n: EDU.fmt(n) }) }), el('span', { class: 'badge primary', text: '▶ ' + t('start') })));
      btn.addEventListener('click', function () { startRun({ mode: 'lang', lang: code, idx: i, text: P.text, limit: 0 }); });
      box.appendChild(btn);
    });
    var best = +S.langBest[code] || 0;
    $('#lang-best').textContent = best ? t('lang_best', { n: EDU.fmt(best) }) : t('lang_best_none');
    renderTips($('#tips-main'));
  }
  function renderTips(box) {
    box.innerHTML = '';
    var ol = el('ol');
    var rtl = EDU.langInfo(EDU.lang).dir === 'rtl';
    ['tip_gboard', 'tip_windows', 'tip_inscript', 'tip_apple', 'tip_count'].forEach(function (k) {
      var li = el('li'), s = t(k), re = /[A-Za-z][A-Za-z0-9&+→ ]*[A-Za-z0-9]/g, m, last = 0;
      if (!rtl) { li.textContent = s; ol.appendChild(li); return; }
      /* Urdu: keep English menu paths like "Settings → Keyboard" in left-to-right order */
      while ((m = re.exec(s))) {
        if (m.index > last) li.appendChild(document.createTextNode(s.slice(last, m.index)));
        li.appendChild(el('bdi', { dir: 'ltr', text: m[0] }));
        last = m.index + m[0].length;
      }
      if (last < s.length) li.appendChild(document.createTextNode(s.slice(last)));
      ol.appendChild(li);
    });
    box.appendChild(ol);
  }

  /* ---------------------------------------------------------------- progress */
  function histTitle(h) {
    if (h.mode === 'lesson') return lessonById(h.ref) ? lessonName(h.ref) : t('tab_lessons');
    if (h.mode === 'free') return t('tab_free');
    var P = passages(h.ref)[h.idx] || {};
    return EDU.langInfo(h.ref).native + (P.title ? ' · ' + P.title : '');
  }
  function summary() {
    var done = 0, stars = 0, best = 0;
    LESSONS.forEach(function (L) { var p = obj(S.prog[L.id]); if (p.stars >= 1) done++; stars += p.stars || 0; best = Math.max(best, p.best || 0); });
    var accs = S.hist.map(function (h) { return +h.acc || 0; });
    var avg = accs.length ? Math.round(accs.reduce(function (a, b) { return a + b; }, 0) / accs.length) : 0;
    return { done: done, stars: stars, best: best, avg: avg, n: accs.length };
  }
  function buildProgTable(tb) {
    tb.innerHTML = '';
    tb.appendChild(el('thead', {}, el('tr', {}, el('th', { class: 'n', text: '#' }), el('th', { text: t('col_lesson') }), el('th', { text: t('col_stars') }),
      el('th', { class: 'n', text: t('col_best') }), el('th', { class: 'n', text: t('col_acc') }), el('th', { class: 'n', text: t('col_tries') }))));
    var body = el('tbody');
    LESSONS.forEach(function (L, i) {
      var p = obj(S.prog[L.id]);
      body.appendChild(el('tr', { dataset: { lesson: L.id } }, el('td', { class: 'n', text: EDU.fmt(i + 1) }), el('td', { text: t('les_' + L.id) }),
        el('td', {}, starsEl(p.stars || 0)), el('td', { class: 'n', text: p.tries ? EDU.fmt(p.best || 0) : '–' }),
        el('td', { class: 'n', text: p.tries ? EDU.fmt(p.acc || 0) + '%' : '–' }), el('td', { class: 'n', text: EDU.fmt(p.tries || 0) })));
    });
    tb.appendChild(body);
  }
  function buildHistTable(tb, max) {
    tb.innerHTML = '';
    if (!S.hist.length) return;
    tb.appendChild(el('thead', {}, el('tr', {}, el('th', { text: t('col_when') }), el('th', { text: t('col_mode') }), el('th', { class: 'n', text: t('col_speed') }),
      el('th', { class: 'n', text: t('accuracy') }), el('th', { class: 'n', text: t('errors') }))));
    var body = el('tbody');
    S.hist.slice(0, max || 30).forEach(function (h) {
      body.appendChild(el('tr', { dataset: { mode: h.mode } }, el('td', { text: fmtDate(h.ts) }), el('td', { text: histTitle(h) }),
        el('td', { class: 'n', text: EDU.fmt(h.speed || 0) + ' ' + t(h.unit === 'cpm' ? 'unit_cpm' : 'unit_wpm') }),
        el('td', { class: 'n', text: EDU.fmt(h.acc || 0) + '%' }), el('td', { class: 'n', text: EDU.fmt(h.err || 0) })));
    });
    tb.appendChild(body);
  }
  function renderProgress() {
    var s = summary(), box = $('#prog-sum');
    box.innerHTML = '';
    [[EDU.fmt(s.done) + '/' + EDU.fmt(LESSONS.length), 'sum_done'], [EDU.fmt(s.stars) + '/' + EDU.fmt(LESSONS.length * 3), 'sum_stars'],
      [s.best ? EDU.fmt(s.best) : '–', 'sum_best'], [s.n ? EDU.fmt(s.avg) + '%' : '–', 'sum_acc']].forEach(function (x, i) {
      box.appendChild(el('div', { id: 'sum-' + i }, el('b', { text: x[0] }), el('span', { text: t(x[1]) })));
    });
    buildProgTable($('#prog-table'));
    buildHistTable($('#hist-table'), 15);
    $('#hist-none').hidden = S.hist.length > 0;
    var nm = $('#student-name');
    if (document.activeElement !== nm) nm.value = S.name;
  }

  /* ---------------------------------------------------------------- printing */
  function doPrint(build) {
    var area = $('#print-area');
    area.innerHTML = '';
    build(area);
    document.body.classList.add('tt-printing');
    var done = false;
    function clean() { if (done) return; done = true; document.body.classList.remove('tt-printing'); area.innerHTML = ''; }
    window.addEventListener('afterprint', clean, { once: true });
    setTimeout(function () { window.print(); setTimeout(clean, 1500); }, 60);
  }
  function printReport() {
    doPrint(function (a) {
      var s = summary(), name = S.name.trim();
      a.appendChild(el('h1', { text: '⌨️ ' + t('report_title') }));
      a.appendChild(el('div', { class: 'pmeta' },
        el('span', { text: t('student_name_short') + ': ' + (name || '______________________') }),
        el('span', { text: t('report_date', { d: new Date().toLocaleDateString(EDU.langInfo(EDU.lang).tag, { numberingSystem: 'latn', day: 'numeric', month: 'long', year: 'numeric' }) }) })));
      a.appendChild(el('p', { text: t('sum_done') + ': ' + s.done + '/' + LESSONS.length + ' · ' + t('sum_stars') + ': ' + s.stars + '/' + (LESSONS.length * 3) +
        ' · ' + t('sum_best') + ': ' + (s.best || '–') + ' · ' + t('sum_acc') + ': ' + (s.n ? s.avg + '%' : '–') }));
      var tb = el('table', { class: 'table tt-table' }); buildProgTable(tb); a.appendChild(tb);
      if (S.hist.length) {
        a.appendChild(el('h2', { text: t('recent_h'), style: { marginTop: '14pt' } }));
        var hb = el('table', { class: 'table tt-table' }); buildHistTable(hb, 10); a.appendChild(hb);
      }
      a.appendChild(el('p', { class: 'small', style: { marginTop: '18pt' }, text: t('report_sign') }));
    });
  }
  function printChart() {
    doPrint(function (a) {
      a.appendChild(el('h1', { text: '⌨️ ' + t('chart_title') }));
      a.appendChild(el('p', { text: t('legend_note') }));
      var k = el('div', { class: 'tt-kbd' }); buildKeyboard(k); a.appendChild(k);
      var hands = el('div', { class: 'tt-hands' }); buildHands(hands);
      var leg = el('div', { class: 'tt-legend' }); buildLegend(leg);
      a.appendChild(el('div', { class: 'tt-handrow' }, hands, leg));
      a.appendChild(el('h2', { text: t('posture_h'), style: { marginTop: '12pt' } }));
      var ul = el('ul', { class: 'tt-posture' });
      ['posture1', 'posture2', 'posture3', 'posture4', 'posture5'].forEach(function (p) { ul.appendChild(el('li', { text: t(p) })); });
      a.appendChild(ul);
    });
  }

  /* ---------------------------------------------------------------- events */
  $$('#tabs [role="tab"]').forEach(function (b) {
    b.addEventListener('click', function () { setTab(b.dataset.tab); });
    b.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var i = TABS.indexOf(b.dataset.tab), rtl = document.documentElement.dir === 'rtl';
      var d = (e.key === 'ArrowRight') !== rtl ? 1 : -1, nt = TABS[(i + d + TABS.length) % TABS.length];
      setTab(nt); $('#tab-' + nt).focus(); e.preventDefault();
    });
  });
  $('#continue').addEventListener('click', function () { startLesson(this.dataset.lesson || nextLessonId()); });

  ta.addEventListener('input', onInput);
  ta.addEventListener('compositionstart', function () { if (R) R.composing = true; });
  ta.addEventListener('compositionend', function () { if (R) { R.composing = false; onInput(); } });
  ta.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); restart(); }
    else if (e.key === 'Enter' && !e.isComposing) e.preventDefault();
  });
  ['paste', 'drop'].forEach(function (ev) { ta.addEventListener(ev, function (e) { e.preventDefault(); EDU.toast(t('no_paste')); }); });
  ta.addEventListener('focus', function () { target.classList.add('focus'); });
  ta.addEventListener('blur', function () { target.classList.remove('focus'); });
  target.addEventListener('click', function () { if (R && !R.done) ta.focus(); });

  $('#back').addEventListener('click', function () { setTab(S.tab); });
  $('#restart').addEventListener('click', restart);
  $('#again').addEventListener('click', restart);
  $('#fs').addEventListener('click', function () { EDU.fullscreen(); if (R && !R.done) ta.focus(); });
  $('#next-lesson').addEventListener('click', function () {
    var i = LESSONS.indexOf(lessonById(R && R.cfg.lessonId));
    if (i >= 0 && i < LESSONS.length - 1) startLesson(LESSONS[i + 1].id);
  });
  $('#new-text').addEventListener('click', function () {
    if (!R) return;
    var cfg = R.cfg;
    if (cfg.mode === 'lesson') { var L = lessonById(cfg.lessonId); startLesson(L.id, (cfg.idx + 1) % L.texts.length); }
    else if (cfg.mode === 'lang') {
      var ps = passages(cfg.lang), i = (cfg.idx + 1) % ps.length;
      startRun({ mode: 'lang', lang: cfg.lang, idx: i, text: ps[i].text, limit: 0 });
    }
  });
  $('#show-kbd').addEventListener('change', function () { S.showKbd = this.checked; store.set('showKbd', S.showKbd); $('#kb-box').hidden = !S.showKbd; });

  freeTA.addEventListener('input', function () { store.set('free', freeTA.value.slice(0, 20000)); updateFreeCount(); });
  $('#free-sample').addEventListener('click', function () { freeTA.value = D.freeSample; store.set('free', freeTA.value); updateFreeCount(); });
  $('#free-clear').addEventListener('click', function () { freeTA.value = ''; store.set('free', ''); updateFreeCount(); freeTA.focus(); });
  $$('#limit button').forEach(function (b) {
    b.addEventListener('click', function () { S.limit = +b.dataset.limit; store.set('limit', S.limit); renderFree(); });
  });
  $('#easy').addEventListener('change', function () { S.easy = this.checked; store.set('easy', S.easy); });
  $('#free-start').addEventListener('click', startFree);

  $('#lang-sel').addEventListener('change', function () { S.langCode = this.value; store.set('langCode', S.langCode); renderLang(); });

  $('#student-name').addEventListener('input', function () { S.name = this.value; store.set('name', S.name); });
  $('#print-report').addEventListener('click', printReport);
  $('#print-chart').addEventListener('click', printChart);
  $('#reset-progress').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    S.prog = {}; S.hist = []; S.langBest = {};
    store.set('prog', S.prog); store.set('hist', S.hist); store.set('langBest', S.langBest);
    renderProgress();
    EDU.toast(t('progress_cleared'));
  });

  /* ---------------------------------------------------------------- start */
  var savedFree = store.get('free', null);
  freeTA.value = typeof savedFree === 'string' ? savedFree : D.freeSample;

  function renderStatic() {
    buildKeyboard($('#kbd'));
    buildHands($('#hands'));
    buildLegend($('#legend'));
    renderTips($('#tips-mini'));
  }
  EDU.onLang(function () {
    renderStatic();
    if (R) { renderTrainerChrome(); updateStats(); updateHint(); }
    else renderPanel(S.tab);
  });
  renderStatic();
  setTab(S.tab);
})();
