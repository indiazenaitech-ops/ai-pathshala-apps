/* Spelling Bee: English spelling practice with text-to-speech, hints, a class bee and teacher lists.
   Everything runs in the browser; progress is saved with EDU.store('spelling-bee'). */
(function () {
  'use strict';
  var SLUG = 'spelling-bee';
  var ROUND = 10;
  var LEVEL_IDS = ['1', '2', '3', '4', '5'];
  var PCOL = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6', '--c7', '--c8'];
  var store = EDU.store(SLUG);
  var DATA = window.SB_WORDS || { levels: [], example: '' };
  var LEVELS = DATA.levels || [];

  EDU.init({ slug: SLUG, title: 'app_title' });

  var t = EDU.t, el = EDU.el;
  function $(id) { return document.getElementById(id); }
  function fmt(n) { return EDU.fmt(n); }
  var finePointer = !!(window.matchMedia && matchMedia('(pointer: fine)').matches);

  /* ---------------- helpers ---------------- */
  function obj(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function str(v) { return typeof v === 'string' ? v : ''; }
  function num(v, d) { v = Number(v); return isFinite(v) ? v : d; }
  function norm(s) { return String(s || '').toLowerCase().replace(/[‘’`]/g, "'").replace(/\s+/g, ' ').trim(); }
  function escRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function validWord(w) { return typeof w === 'string' && w.length > 0 && w.length <= 40 && /^[A-Za-z](?:[A-Za-z' -]*[A-Za-z])?$/.test(w); }
  function cleanItems(v) {
    var seen = {}, out = [];
    arr(v).forEach(function (x) {
      if (!x || !validWord(x.w) || seen[x.w.toLowerCase()]) return;
      seen[x.w.toLowerCase()] = 1;
      out.push({ w: x.w, s: str(x.s).slice(0, 200), m: str(x.m).slice(0, 120), lv: x.lv === undefined ? '' : String(x.lv) });
    });
    return out;
  }
  function setText(node, txt) { if (node) node.textContent = txt; }
  function setKey(node, key) { if (!node) return; node.setAttribute('data-i18n', key); node.textContent = t(key); }

  /* every built-in word, so a teacher's list can reuse our sentences and meanings */
  var BUILTIN = {};
  LEVELS.forEach(function (L) {
    arr(L.words).forEach(function (x) { BUILTIN[x.w.toLowerCase()] = { w: x.w, s: x.s, alt: arr(x.alt), lv: String(L.id) }; });
  });

  /* ---------------- saved state (validated: storage may hold anything) ---------------- */
  var cfg = Object.assign({ level: '1', second: true, auto: true, voice: '', rate: 0.9, tab: 'practise', listView: '1' }, obj(store.get('cfg', {})));
  cfg.level = String(cfg.level); cfg.listView = String(cfg.listView);
  cfg.rate = EDU.clamp(num(cfg.rate, 0.9), 0.5, 1.2);
  cfg.second = cfg.second !== false; cfg.auto = cfg.auto !== false;
  if (['practise', 'bee', 'lists'].indexOf(cfg.tab) < 0) cfg.tab = 'practise';
  var stats = Object.assign({ words: 0, correct: 0, bestStreak: 0, rounds: 0 }, obj(store.get('stats', {})));
  ['words', 'correct', 'bestStreak', 'rounds'].forEach(function (k) { stats[k] = Math.max(0, Math.floor(num(stats[k], 0))); });
  var best = obj(store.get('best', {}));
  var recent = obj(store.get('recent', {}));
  var custom = cleanItems(store.get('custom', []));
  var review = cleanItems(store.get('review', []));
  var beeCfg = Object.assign({ names: ['', ''], level: '1', per: 3, type: 'points' }, obj(store.get('bee', {})));
  beeCfg.names = arr(beeCfg.names).map(str).slice(0, 8); if (!beeCfg.names.length) beeCfg.names = ['', ''];
  beeCfg.level = String(beeCfg.level); beeCfg.per = [2, 3, 5, 10].indexOf(+beeCfg.per) >= 0 ? +beeCfg.per : 3;
  beeCfg.type = beeCfg.type === 'ko' ? 'ko' : 'points';
  if (!validLevel(cfg.level)) cfg.level = '1';
  if (!validLevel(cfg.listView) || cfg.listView === 'review') cfg.listView = '1';
  if (!validLevel(beeCfg.level) || beeCfg.level === 'review') beeCfg.level = '1';

  function saveCfg() { store.set('cfg', cfg); }
  function saveBee() { store.set('bee', beeCfg); }
  function validLevel(id) { return LEVEL_IDS.indexOf(id) >= 0 || id === 'custom' || id === 'review'; }

  /* ---------------- word pools ---------------- */
  function withData(x) {
    var b = BUILTIN[x.w.toLowerCase()];
    return { w: x.w, s: x.s || (b ? b.s : ''), alt: b ? b.alt : [], m: x.m || '', lv: x.lv || (b ? b.lv : 'custom') };
  }
  function poolFor(id) {
    id = String(id);
    if (id === 'custom') return custom.map(withData);
    if (id === 'review') return review.map(withData);
    var L = LEVELS[+id - 1];
    return L ? arr(L.words).map(function (x) { return { w: x.w, s: x.s, alt: arr(x.alt), m: '', lv: String(L.id) }; }) : [];
  }
  function levelInfo(id) {
    id = String(id);
    if (id === 'custom') return { icon: '✍️', name: t('my_list'), sub: '' };
    if (id === 'review') return { icon: '🔁', name: t('review_lvl'), sub: '' };
    var L = LEVELS[+id - 1] || { icon: '', grades: '' };
    return { icon: L.icon, name: t('level_n', { n: id }), sub: t('class_n', { n: L.grades }) };
  }
  function levelLabel(id) { var li = levelInfo(id); return li.name + (li.sub ? ' · ' + li.sub : ''); }
  /* meaning in the page language; a teacher's own meaning is shown as typed */
  function meaningOf(item) {
    if (item.m) return { text: item.m, user: true };
    var C = window.APP_CONTENT || {}, key = item.w.toLowerCase();
    var v = C[EDU.lang] && C[EDU.lang].m && C[EDU.lang].m[key];
    return v ? { text: v, user: false } : null;
  }

  /* ---------------- speech ---------------- */
  var V = { list: [], ready: false, ok: true };
  function enVoices() { return V.list.filter(function (v) { return /^en([-_]|$)/i.test(String(v.lang || '')); }); }
  function pickVoice() {
    var en = enVoices();
    if (cfg.voice) for (var i = 0; i < en.length; i++) if ((en[i].voiceURI || en[i].name) === cfg.voice) return en[i];
    return en.length ? (EDU.voiceFor(en, 'en') || en[0]) : null;
  }
  function say(text, rate) {
    var synth = window.speechSynthesis;
    if (!synth || typeof window.SpeechSynthesisUtterance !== 'function') { EDU.toast(t('nv_title')); return false; }
    try {
      synth.cancel();
      var u = new window.SpeechSynthesisUtterance(text);
      var v = pickVoice();
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-IN';
      u.rate = rate || cfg.rate; u.pitch = 1;
      synth.speak(u);
      return true;
    } catch (e) { return false; }
  }
  function noVoice() { return V.ready && !V.ok; }
  function onVoices(list) {
    V.list = arr(list); V.ready = true; V.ok = enVoices().length > 0;
    renderVoice();
    panels.forEach(function (p) { p.render(); });
  }

  /* ---------------- letter-by-letter comparison (edit distance + backtrace) ---------------- */
  function align(a, b) {
    a = Array.from(a); b = Array.from(b);
    var n = a.length, m = b.length, D = [], i, j;
    for (i = 0; i <= n; i++) { D[i] = [i]; }
    for (j = 0; j <= m; j++) D[0][j] = j;
    for (i = 1; i <= n; i++) for (j = 1; j <= m; j++) {
      D[i][j] = Math.min(D[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1), D[i - 1][j] + 1, D[i][j - 1] + 1);
    }
    var ops = []; i = n; j = m;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && D[i][j] === D[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) {
        ops.push({ t: a[i - 1] === b[j - 1] ? 'ok' : 'sub', a: a[i - 1], b: b[j - 1] }); i--; j--;
      } else if (i > 0 && D[i][j] === D[i - 1][j] + 1) { ops.push({ t: 'extra', a: a[i - 1] }); i--; }
      else { ops.push({ t: 'miss', b: b[j - 1] }); j--; }
    }
    return ops.reverse();
  }
  function tileChar(c) { return c === ' ' ? '␣' : c; }
  function tilesRow(ops, mode) {
    var row = el('div', { class: 'tiles no-i18n', dir: 'ltr' });
    ops.forEach(function (o) {
      var ch, cls;
      if (mode === 'bottom') {
        if (o.t === 'ok') { ch = o.b; cls = 'ok'; } else if (o.t === 'extra') { ch = '·'; cls = 'gap'; } else { ch = o.b; cls = 'fix'; }
      } else {
        if (o.t === 'ok') { ch = o.a; cls = 'ok'; } else if (o.t === 'sub') { ch = o.a; cls = 'bad'; }
        else if (o.t === 'extra') { ch = o.a; cls = 'bad extra'; } else { ch = mode === 'try' ? '?' : '·'; cls = 'miss'; }
      }
      row.appendChild(el('span', { class: 'tile ' + cls, text: tileChar(ch) }));
    });
    return row;
  }
  function wordTiles(word, cls) {
    var row = el('div', { class: 'tiles no-i18n', dir: 'ltr' });
    Array.from(word).forEach(function (c) { row.appendChild(el('span', { class: 'tile ' + cls, text: tileChar(c) })); });
    return row;
  }
  function legend(withMiss) {
    return el('p', { class: 'legend' },
      el('i', { class: 'l-ok' }), t('lg_ok'), el('i', { class: 'l-bad' }), t('lg_bad'),
      withMiss ? [el('i', { class: 'l-miss' }), t('lg_miss')] : null);
  }

  /* ---------------- the word panel (used by Practise and Class bee) ---------------- */
  var panels = [];
  function makePanel(root, P, opts) {
    var st = { item: null, state: 'idle', tries: 0, hints: {}, jumble: [], used: [], freeJumble: false, fb: null, sentHeard: false };
    function id(s) { return P + '-' + s; }
    function icon(ch) { return el('span', { class: 'ic', 'aria-hidden': 'true', text: ch }); }
    var bHear = el('button', { type: 'button', class: 'btn btn-primary aud', id: id('hear'), onclick: function () { hear(); } }, icon('🔊'), el('span', { i18n: 'hear_word' }));
    var bSent = el('button', { type: 'button', class: 'btn aud', id: id('sent'), onclick: function () { hearSentence(); } }, icon('💬'), el('span', { i18n: 'hear_sent' }));
    var bSlow = el('button', { type: 'button', class: 'btn aud', id: id('slow'), onclick: function () { hearSlow(); } }, icon('🐢'), el('span', { i18n: 'hear_slow' }));
    var nv = el('div', { class: 'callout warning nv-box small', id: id('nv'), hidden: true }, el('strong', { i18n: 'nv_title' }), el('span', { i18n: 'nv_short' }));
    var meaningVal = el('span', { class: 'clue-val', id: id('meaning') });
    var meaningClue = el('div', { class: 'clue' }, el('span', { class: 'clue-lbl', i18n: 'meaning' }), meaningVal);
    var sentVal = el('span', { class: 'clue-val en no-i18n', id: id('sentence'), dir: 'ltr', lang: 'en' });
    var sentClue = el('div', { class: 'clue sent', id: id('sent-clue'), hidden: true }, el('span', { class: 'clue-lbl', i18n: 'sentence_lbl' }), sentVal);
    var firstVal = el('span', { class: 'clue-val first-letter no-i18n', id: id('first'), dir: 'ltr', lang: 'en' });
    var firstClue = el('div', { class: 'clue first', id: id('first-clue'), hidden: true }, el('span', { class: 'clue-lbl', i18n: 'starts_with' }), firstVal);
    function hintBtn(k, ic, key) {
      return el('button', { type: 'button', class: 'btn btn-sm', id: id('h-' + k), 'aria-pressed': 'false', onclick: function () { useHint(k); } },
        el('span', { 'aria-hidden': 'true', text: ic }), el('span', { i18n: key }));
    }
    var hFirst = hintBtn('first', '🔤', 'hint_first'), hLen = hintBtn('len', '🔢', 'hint_len'), hJum = hintBtn('jumble', '🔀', 'hint_jumble');
    var hintNote = el('span', { class: 'hint-free', id: id('hint-note') });
    var hintsRow = el('div', { class: 'hints', id: id('hints') },
      el('span', { class: 'lbl' }, el('span', { 'aria-hidden': 'true', text: '💡 ' }), el('span', { i18n: 'hints' })), hFirst, hLen, hJum, hintNote);
    var lenNote = el('p', { class: 'len-note', id: id('len-note'), hidden: true });
    var boxes = el('div', { class: 'boxes no-i18n', id: id('boxes'), dir: 'ltr', hidden: true, 'aria-hidden': 'true' });
    var jumble = el('div', { class: 'jumble no-i18n', id: id('jumble'), dir: 'ltr', role: 'group', hidden: true });
    var input = el('input', { type: 'text', id: id('input'), class: 'answer no-i18n', dir: 'ltr', lang: 'en', autocomplete: 'off', autocapitalize: 'none',
      autocorrect: 'off', spellcheck: 'false', maxlength: '40', enterkeyhint: 'done', 'data-i18n-placeholder': 'answer_ph', placeholder: t('answer_ph') });
    var bk = el('button', { type: 'button', class: 'btn bksp', id: id('bksp'), 'data-i18n-aria-label': 'backspace', 'aria-label': t('backspace'),
      'data-i18n-title': 'backspace', title: t('backspace'), text: '⌫', onclick: backspace });
    var chk = el('button', { type: 'submit', class: 'btn btn-accent btn-lg check-btn', id: id('check') }, el('span', { 'aria-hidden': 'true', text: '✓' }), el('span', { i18n: 'check' }));
    var form = el('form', { class: 'answer-row', id: id('form'), autocomplete: 'off' },
      el('label', { class: 'sr-only', for: id('input'), i18n: 'your_spelling' }), input, bk, chk);
    form.addEventListener('submit', function (e) { e.preventDefault(); check(); });
    var fb = el('div', { class: 'fb', id: id('fb'), 'aria-live': 'polite' });
    var showBtn = el('button', { type: 'button', class: 'btn btn-sm btn-ghost', id: id('show'), hidden: !opts.showAnswer, onclick: function () { reveal(); } },
      el('span', { 'aria-hidden': 'true', text: '👁' }), el('span', { i18n: 'show_answer' }));
    var wrap = el('div', { class: 'wp', id: id('wp'), 'data-state': 'idle' },
      el('div', { class: 'wp-audio' }, bHear, bSent, bSlow), nv,
      el('div', { class: 'clues' }, meaningClue, sentClue, firstClue),
      hintsRow, lenNote, boxes, jumble, form, fb, el('div', { class: 'row after' }, showBtn));
    root.appendChild(wrap);
    input.addEventListener('input', function () { syncTiles(); renderBoxes(); });

    function focusInput() { if (finePointer && !input.readOnly) try { input.focus({ preventScroll: true }); } catch (e) { } }
    function hintsUsed() { return (st.hints.first ? 1 : 0) + (st.hints.len ? 1 : 0) + (st.hints.jumble && !st.freeJumble ? 1 : 0); }

    function setWord(item, auto) {
      st.item = item; st.state = 'ask'; st.tries = 0; st.hints = {}; st.jumble = []; st.used = []; st.freeJumble = false;
      st.fb = null; st.sentHeard = false; st.typed = '';
      input.value = ''; input.readOnly = false;
      delete wrap.dataset.result;
      render();
      if (auto && cfg.auto) setTimeout(function () { if (st.item === item && st.state !== 'done') hear(); }, 300);
      focusInput();
    }
    function hear() { if (st.item) say(st.item.w, cfg.rate); }
    function hearSlow() { if (st.item) say(st.item.w, Math.max(0.35, cfg.rate * 0.5)); }
    function hearSentence() {
      if (!st.item || !st.item.s) return;
      st.sentHeard = true; render();
      say(st.item.s, cfg.rate);
    }
    function useHint(k) {
      if (!st.item || st.state === 'done' || st.hints[k]) return;
      st.hints[k] = true;
      if (k === 'jumble' && !st.jumble.length) makeJumble(false);
      render();
      if (k !== 'jumble') focusInput();
    }
    function makeJumble(free) {
      var letters = Array.from(norm(st.item.w)), out = letters.slice();
      for (var k = 0; k < 25 && out.join('') === letters.join(''); k++) out = EDU.shuffle(letters);
      st.jumble = out; st.freeJumble = !!free; st.jDirty = true;
    }
    function syncTiles() {
      var typed = Array.from(norm(input.value)), used = st.jumble.map(function () { return false; });
      typed.forEach(function (ch) {
        for (var i = 0; i < st.jumble.length; i++) if (!used[i] && st.jumble[i] === ch) { used[i] = true; break; }
      });
      st.used = used;
      Array.prototype.forEach.call(jumble.children, function (b, i) { b.disabled = !!used[i]; });
    }
    function tapTile(i) {
      if (st.state === 'done' || st.used[i]) return;
      input.value = input.value + st.jumble[i];
      syncTiles(); renderBoxes();
      var nextBtn = Array.prototype.filter.call(jumble.children, function (b) { return !b.disabled; })[0];
      if (nextBtn) nextBtn.focus(); else chk.focus();
    }
    function backspace() {
      if (st.state === 'done') return;
      input.value = input.value.slice(0, -1);
      syncTiles(); renderBoxes(); focusInput();
    }

    function check() {
      if (!st.item || st.state === 'done') return;
      var typed = norm(input.value);
      if (!typed) { st.fb = { k: 'empty' }; renderFb(); focusInput(); return; }
      st.tries++;
      var target = norm(st.item.w);
      if (typed === target) return finish(true, typed, false);
      if (arr(st.item.alt).map(norm).indexOf(typed) >= 0) return finish(true, typed, true);
      if (st.tries < 2 && opts.second()) {
        st.state = 'retry'; st.typed = typed;
        st.fb = { k: 'retry', ops: align(typed, target) };
        render();
        try { input.select(); } catch (e) { }
        return;
      }
      finish(false, typed, false);
    }
    function finish(ok, typed, alt, how) {
      st.state = 'done'; st.typed = typed || '';
      var target = norm(st.item.w);
      st.fb = { k: ok ? (st.tries > 1 ? 'ok2' : 'ok') : (how || 'bad'), alt: alt ? typed : '', ops: typed && !ok ? align(typed, target) : null };
      wrap.dataset.result = ok ? 'ok' : 'bad';
      render();
      opts.onDone({ ok: ok, tries: st.tries, hints: hintsUsed(), item: st.item, typed: st.typed });
    }
    function reveal() { if (st.item && st.state !== 'done') finish(false, norm(input.value), false, 'shown'); }
    function judge(ok) { if (st.item && st.state !== 'done') finish(ok, ok ? '' : norm(input.value), false, ok ? '' : 'judged'); }

    function renderSentence(show) {
      var s = st.item.s, w = st.item.w;
      sentVal.textContent = '';
      var m = new RegExp('\\b' + escRe(w) + '\\b', 'i').exec(s) || new RegExp(escRe(w), 'i').exec(s);
      if (!m) { sentVal.textContent = s; return; }
      sentVal.appendChild(document.createTextNode(s.slice(0, m.index)));
      sentVal.appendChild(show ? el('b', { text: m[0] }) : el('span', { class: 'blank', text: ' ' }));
      sentVal.appendChild(document.createTextNode(s.slice(m.index + m[0].length)));
    }
    function renderBoxes() {
      var done = st.state === 'done', show = !!st.hints.len && !done;
      boxes.hidden = !show; lenNote.hidden = !show;
      if (!show || !st.item) return;
      var target = Array.from(norm(st.item.w)), typed = Array.from(input.value.toLowerCase());
      lenNote.textContent = t('letters_n', { n: fmt(target.length) });
      boxes.textContent = '';
      for (var i = 0; i < Math.max(target.length, typed.length); i++) {
        var ch = typed[i] || '', cls = 'box';
        if (i >= target.length) cls += ' over';
        else if (ch) cls += ' filled';
        else if (i === 0 && st.hints.first) { ch = target[0]; cls += ' ghost'; }
        boxes.appendChild(el('span', { class: cls, text: tileChar(ch) }));
      }
    }
    function renderJumble() {
      var show = st.jumble.length > 0 && st.state !== 'done';
      jumble.hidden = !show;
      jumble.setAttribute('aria-label', t('jumble_aria'));
      if (!show) return;
      if (st.jDirty || jumble.children.length !== st.jumble.length) {
        jumble.textContent = '';
        st.jumble.forEach(function (ch, i) {
          jumble.appendChild(el('button', { type: 'button', class: 'jt', 'data-i': i, text: tileChar(ch), onclick: function () { tapTile(i); } }));
        });
        st.jDirty = false;
      }
      Array.prototype.forEach.call(jumble.children, function (b, i) {
        b.setAttribute('aria-label', st.jumble[i] === ' ' ? t('space_key') : t('tap_letter', { l: st.jumble[i] }));
      });
      syncTiles();
    }
    function renderFb() {
      fb.textContent = ''; fb.className = 'fb';
      var f = st.fb;
      fb.dataset.kind = f ? f.k : '';
      if (!f || !st.item) return;
      var target = norm(st.item.w);
      if (f.k === 'empty') { fb.classList.add('try'); fb.appendChild(el('p', { class: 'fb-msg', text: t('fb_empty') })); return; }
      if (f.k === 'retry') {
        var miss = f.ops.filter(function (o) { return o.t === 'miss'; }).length;
        fb.classList.add('try');
        fb.appendChild(el('p', { class: 'fb-msg' }, el('span', { 'aria-hidden': 'true', text: '🤔 ' }), t('fb_retry')));
        fb.appendChild(tilesRow(f.ops, 'try'));
        if (miss) fb.appendChild(el('p', { class: 'fb-sub center', text: t('fb_missing', { n: fmt(miss) }) }));
        fb.appendChild(legend(miss > 0));
        return;
      }
      if (f.k === 'ok' || f.k === 'ok2') {
        fb.classList.add('ok');
        fb.appendChild(el('p', { class: 'fb-msg' }, el('span', { 'aria-hidden': 'true', text: '🎉 ' }), t(f.k === 'ok2' ? 'fb_ok2' : 'fb_ok')));
        fb.appendChild(wordTiles(st.item.w.toLowerCase(), 'win'));
        if (f.alt) fb.appendChild(el('p', { class: 'fb-sub', text: t('fb_alt', { alt: f.alt, w: target }) }));
        return;
      }
      fb.classList.add('bad');
      fb.appendChild(el('p', { class: 'fb-msg' }, el('span', { 'aria-hidden': 'true', text: f.k === 'shown' ? '👁 ' : '✗ ' }), t(f.k === 'shown' ? 'fb_shown' : 'fb_bad')));
      if (f.ops) {
        fb.appendChild(el('p', { class: 'row-lbl', text: t('you_wrote') }));
        fb.appendChild(tilesRow(f.ops, 'top'));
        fb.appendChild(el('p', { class: 'row-lbl', text: t('right_spelling') }));
        fb.appendChild(tilesRow(f.ops, 'bottom'));
        fb.appendChild(el('p', { class: 'legend', text: t('fb_learn') }));
      } else fb.appendChild(wordTiles(st.item.w.toLowerCase(), 'ok'));
    }
    function render() {
      var it = st.item;
      if (!it) return;
      var done = st.state === 'done';
      nv.hidden = !noVoice();
      if (noVoice() && !st.jumble.length && !done) makeJumble(true);
      var m = meaningOf(it);
      meaningClue.hidden = !m;
      if (m) { meaningVal.textContent = m.text; meaningVal.classList.toggle('no-i18n', m.user); if (m.user) meaningVal.setAttribute('dir', 'auto'); else meaningVal.removeAttribute('dir'); }
      bSent.disabled = !it.s;
      var showSent = !!it.s && (st.sentHeard || noVoice() || done);
      sentClue.hidden = !showSent;
      if (showSent) renderSentence(done);
      firstClue.hidden = !st.hints.first || done;
      firstVal.textContent = norm(it.w).charAt(0);
      [['first', hFirst], ['len', hLen], ['jumble', hJum]].forEach(function (p) {
        var on = !!st.hints[p[0]] || (p[0] === 'jumble' && st.jumble.length > 0);
        p[1].setAttribute('aria-pressed', on ? 'true' : 'false');
        p[1].disabled = on;
      });
      hintsRow.hidden = done;
      var hu = hintsUsed();
      hintNote.textContent = hu ? t('hints_used_n', { n: fmt(hu) }) : (st.freeJumble ? t('hint_free') : '');
      renderBoxes();
      renderJumble();
      input.readOnly = done; chk.disabled = done; bk.disabled = done; form.hidden = done;
      showBtn.hidden = done || !opts.showAnswer;
      renderFb();
      wrap.dataset.state = st.state;
    }
    var api = { setWord: setWord, render: render, judge: judge, reveal: reveal, hear: hear, state: function () { return st; }, wrap: wrap, input: input };
    panels.push(api);
    return api;
  }

  /* ======================================================================
     PRACTISE
     ====================================================================== */
  var PR = null;
  var pPanel = makePanel($('p-panel'), 'p', { second: function () { return cfg.second; }, showAnswer: true, onDone: onPractiseDone });

  function renderLevels() {
    if (cfg.level === 'review' && !review.length) cfg.level = '1';
    var box = $('p-levels');
    box.textContent = '';
    LEVEL_IDS.concat(['custom', 'review']).forEach(function (id) {
      var pool = poolFor(id), li = levelInfo(id), b = obj(best[id]);
      var meta;
      if (id === 'review') meta = pool.length ? t('n_words', { n: fmt(pool.length) }) : t('review_none');
      else if (id === 'custom') meta = pool.length ? t('n_words', { n: fmt(pool.length) }) : t('custom_none');
      else meta = t('n_words', { n: fmt(pool.length) });
      var hasBest = b.n > 0 && id !== 'review';
      box.appendChild(el('button', {
        type: 'button', class: 'lvl', 'data-level': id, 'aria-pressed': cfg.level === id ? 'true' : 'false',
        disabled: id === 'review' && !pool.length,
        onclick: function () {
          if (id === 'custom' && !custom.length) { showTab('lists'); $('l-text').focus(); EDU.toast(t('custom_none')); return; }
          cfg.level = id; saveCfg(); renderLevels(); renderRoundInfo();
        }
      },
        el('span', { class: 'ic', 'aria-hidden': 'true', text: li.icon }),
        el('span', { class: 'nm', text: li.name }),
        li.sub ? el('span', { class: 'gr', text: li.sub }) : null,
        el('span', { class: 'meta' }, meta, hasBest ? [' · ', el('span', { class: 'best', text: t('best_n', { s: fmt(b.s), n: fmt(b.n) }) })] : null)));
    });
  }
  function renderRoundInfo() {
    var n = Math.min(ROUND, poolFor(cfg.level).length);
    setText($('p-round-info'), n ? t('round_info', { n: fmt(n) }) : '');
    $('p-start').disabled = !n;
  }
  function renderStats() {
    var box = $('stats');
    box.textContent = '';
    var acc = stats.words ? Math.round(100 * stats.correct / stats.words) : 0;
    [[fmt(stats.words), 'st_words'], [stats.words ? fmt(acc) + '%' : '–', 'st_acc'], [fmt(stats.bestStreak), 'st_streak'], [fmt(review.length), 'st_review']].forEach(function (p) {
      box.appendChild(el('div', { class: 'stat', 'data-stat': p[1] }, el('b', { text: p[0] }), el('span', { text: t(p[1]) })));
    });
  }

  function startRound(id, items) {
    id = String(id);
    var pool = items || poolFor(id);
    if (!pool.length) { EDU.toast(t(id === 'custom' ? 'custom_none' : 'review_none')); return; }
    var list = EDU.shuffle(pool);
    if (!items) {
      var rec = arr(recent[id]);
      list = list.filter(function (x) { return rec.indexOf(x.w) < 0; }).concat(list.filter(function (x) { return rec.indexOf(x.w) >= 0; }));
    }
    list = list.slice(0, ROUND);
    if (!items) { recent[id] = list.map(function (x) { return x.w; }); store.set('recent', recent); }
    PR = { id: id, base: items ? (PR ? PR.base : cfg.level) : id, redo: !!items, list: list, i: 0, score: 0, streak: 0, bestStreak: 0, hints: 0, results: [] };
    $('p-setup').hidden = true; $('p-summary').hidden = true; $('p-play').hidden = false;
    showWord();
    scrollToTabs();
  }
  function scrollToTabs() {
    var r = $('tabs').getBoundingClientRect();
    if (r.top < 0 || r.top > window.innerHeight * 0.5) try { $('tabs').scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) { }
  }
  function showWord() {
    $('p-next').hidden = true;
    renderPlayHead();
    pPanel.setWord(PR.list[PR.i], true);
  }
  function renderPlayHead(bump) {
    if (!PR) return;
    var n = PR.list.length;
    setText($('p-count'), t('word_x_of_y', { i: fmt(Math.min(PR.i + 1, n)), n: fmt(n) }));
    setText($('p-level-badge'), PR.redo ? t('review_lvl') : levelLabel(PR.id));
    setText($('p-score'), fmt(PR.score));
    setText($('p-streak'), fmt(PR.streak));
    $('p-play').dataset.score = PR.score; $('p-play').dataset.streak = PR.streak;
    $('p-prog').style.width = (100 * PR.results.length / n) + '%';
    var sp = $('p-streak-pill');
    sp.classList.remove('hot');
    if (bump && PR.streak > 1) { void sp.offsetWidth; sp.classList.add('hot'); }
  }
  function onPractiseDone(res) {
    if (!PR) return;
    stats.words++;
    if (res.ok) {
      stats.correct++; PR.score++; PR.streak++;
      if (PR.streak > PR.bestStreak) PR.bestStreak = PR.streak;
      if (PR.streak > stats.bestStreak) stats.bestStreak = PR.streak;
      dropReview(res.item.w);
    } else { PR.streak = 0; addReview(res.item); }
    PR.hints += res.hints;
    PR.results.push(res);
    store.set('stats', stats);
    renderPlayHead(res.ok);
    renderStats();
    setKey($('p-next-lbl'), PR.i >= PR.list.length - 1 ? 'see_result' : 'next_word');
    $('p-next').hidden = false;
    $('p-next').focus({ preventScroll: true });
  }
  function nextWord() {
    if (!PR) return;
    PR.i++;
    if (PR.i >= PR.list.length) finishRound(); else showWord();
  }
  function addReview(item) {
    var k = item.w.toLowerCase();
    if (review.some(function (x) { return x.w.toLowerCase() === k; })) return;
    review.push({ w: item.w, s: BUILTIN[k] ? '' : (item.s || ''), m: item.m || '', lv: item.lv || '' });
    if (review.length > 100) review.shift();
    store.set('review', review);
  }
  function dropReview(w) {
    var k = w.toLowerCase(), before = review.length;
    review = review.filter(function (x) { return x.w.toLowerCase() !== k; });
    if (review.length !== before) store.set('review', review);
  }
  function finishRound() {
    if (!PR) return;
    stats.rounds++; store.set('stats', stats);
    var n = PR.results.length;
    PR.list = PR.list.slice(0, n);
    PR.newBest = false;
    if (!PR.redo && PR.id !== 'review' && n > 0 && n >= Math.min(ROUND, poolFor(PR.id).length)) {
      var b = obj(best[PR.id]);
      if (!b.n || PR.score / n > b.s / b.n) { PR.newBest = PR.score > 0; best[PR.id] = { s: PR.score, n: n }; store.set('best', best); }
    }
    $('p-play').hidden = true; $('p-setup').hidden = true; $('p-summary').hidden = false;
    renderSummary();
    renderLevels(); renderRoundInfo(); renderStats();
    EDU.stopSpeaking();
    scrollToTabs();
  }
  function renderSummary() {
    if (!PR) return;
    var n = PR.results.length, c = PR.score, ratio = n ? c / n : 0;
    $('p-summary').dataset.score = c; $('p-summary').dataset.total = n;
    setText($('sum-score'), t('sum_score', { c: fmt(c), n: fmt(n) }));
    setText($('sum-emoji'), ratio >= 0.9 ? '🏆' : ratio >= 0.6 ? '🎉' : ratio >= 0.3 ? '🙂' : '💪');
    setText($('sum-praise'), t(ratio >= 0.9 ? 'praise_3' : ratio >= 0.6 ? 'praise_2' : 'praise_1'));
    var ss = $('sum-stats'); ss.textContent = '';
    ss.appendChild(el('span', { class: 'pill streak', id: 'sum-streak' }, el('span', { 'aria-hidden': 'true', text: '🔥' }), t('sum_streak', { n: fmt(PR.bestStreak) })));
    ss.appendChild(el('span', { class: 'pill', id: 'sum-hints' }, el('span', { 'aria-hidden': 'true', text: '💡' }), t('sum_hints', { n: fmt(PR.hints) })));
    if (PR.newBest) ss.appendChild(el('span', { class: 'new-best', text: '⭐ ' + t('new_best') }));
    var mist = PR.results.filter(function (r) { return !r.ok; });
    var ul = $('sum-mist'); ul.textContent = '';
    mist.forEach(function (r) {
      var mm = meaningOf(r.item);
      ul.appendChild(el('li', {},
        el('button', { type: 'button', class: 'btn btn-sm', 'aria-label': t('listen_to', { w: r.item.w }), title: t('listen_to', { w: r.item.w }), text: '🔊', onclick: function () { say(r.item.w, cfg.rate); } }),
        el('span', { class: 'mw no-i18n', dir: 'ltr', text: r.item.w }),
        r.typed ? el('span', { class: 'mt no-i18n', dir: 'ltr', text: r.typed }) : null,
        mm ? el('span', { class: 'mm' + (mm.user ? ' no-i18n' : ''), text: mm.text }) : null));
    });
    $('sum-mist-wrap').hidden = !mist.length;
    $('sum-redo').hidden = !mist.length;
    $('sum-perfect').hidden = !!mist.length || !n;
  }
  function backToSetup() {
    EDU.stopSpeaking();
    PR = null;
    $('p-play').hidden = true; $('p-summary').hidden = true; $('p-setup').hidden = false;
    renderLevels(); renderRoundInfo();
  }

  $('opt-second').checked = cfg.second;
  $('opt-auto').checked = cfg.auto;
  $('opt-second').addEventListener('change', function () { cfg.second = this.checked; saveCfg(); });
  $('opt-auto').addEventListener('change', function () { cfg.auto = this.checked; saveCfg(); });
  $('p-start').addEventListener('click', function () { startRound(cfg.level); });
  $('p-next').addEventListener('click', nextWord);
  $('p-quit').addEventListener('click', function () {
    if (!PR) return;
    if (PR.results.length) finishRound(); else backToSetup();
  });
  $('sum-redo').addEventListener('click', function () {
    if (!PR) return;
    var items = PR.results.filter(function (r) { return !r.ok; }).map(function (r) { return r.item; });
    if (items.length) startRound('review', items);
  });
  $('sum-again').addEventListener('click', function () { var base = PR ? PR.base : cfg.level; startRound(validLevel(base) ? base : cfg.level); });
  $('sum-levels').addEventListener('click', backToSetup);
  $('reset-btn').addEventListener('click', function () {
    if (!confirm(t('confirm_progress'))) return;
    stats = { words: 0, correct: 0, bestStreak: 0, rounds: 0 }; best = {}; review = []; recent = {};
    ['stats', 'best', 'review', 'recent'].forEach(function (k) { store.remove(k); });
    if (cfg.level === 'review') cfg.level = '1';
    backToSetup(); renderStats();
    EDU.toast(t('reset_done'));
  });

  /* ---------------- voice card ---------------- */
  function renderVoice() {
    var sel = $('voice-sel'), en = enVoices();
    sel.textContent = '';
    sel.appendChild(el('option', { value: '', text: t('voice_auto') }));
    en.forEach(function (v) { sel.appendChild(el('option', { value: v.voiceURI || v.name, text: v.name + ' (' + v.lang + ')' })); });
    sel.value = cfg.voice && en.some(function (v) { return (v.voiceURI || v.name) === cfg.voice; }) ? cfg.voice : '';
    sel.disabled = !en.length;
    var r = $('rate'); r.value = cfg.rate;
    setText($('rate-out'), fmt(Math.round(cfg.rate * 100) / 100) + '×');
    var box = $('voice-status'); box.textContent = '';
    box.dataset.voice = !V.ready ? 'loading' : V.ok ? 'ok' : 'none';
    if (!V.ready) box.appendChild(el('p', { class: 'muted small mb0', text: t('loading') }));
    else if (V.ok) {
      var v = pickVoice();
      box.appendChild(el('p', { class: 'voice-ok small' }, el('span', { text: '✓ ' + t('voice_using') + ' ' }), el('span', { class: 'no-i18n', dir: 'ltr', text: v ? v.name : '' })));
    } else {
      box.appendChild(el('div', { class: 'callout warning small', id: 'nv-card' }, el('strong', { text: t('nv_title') }), el('br'), t('nv_help')));
    }
  }
  $('voice-sel').addEventListener('change', function () { cfg.voice = this.value; saveCfg(); renderVoice(); say('Hello! Let us play the spelling bee.', cfg.rate); });
  $('rate').addEventListener('input', function () { cfg.rate = EDU.clamp(num(this.value, 0.9), 0.5, 1.2); saveCfg(); setText($('rate-out'), fmt(Math.round(cfg.rate * 100) / 100) + '×'); });
  $('rate').addEventListener('change', function () { say('Spelling', cfg.rate); });
  $('voice-test').addEventListener('click', function () { say('Hello! Let us play the spelling bee.', cfg.rate); });

  /* ======================================================================
     CLASS BEE (projector mode, turn-taking)
     ====================================================================== */
  var BE = null;
  var bPanel = makePanel($('b-panel'), 'b', { second: function () { return false; }, showAnswer: false, onDone: onBeeDone });

  function pname(p) { return p.name || t('player_n', { n: fmt(p.idx + 1) }); }
  function renderBeeSetup() {
    var box = $('b-players');
    box.textContent = '';
    beeCfg.names.forEach(function (nm, i) {
      var inp = el('input', { type: 'text', id: 'b-name' + i, class: 'no-i18n', maxlength: '24', 'aria-label': t('player_n', { n: fmt(i + 1) }), placeholder: t('player_n', { n: fmt(i + 1) }) });
      inp.value = nm;
      inp.addEventListener('input', function () { beeCfg.names[i] = inp.value; saveBee(); });
      box.appendChild(el('div', { class: 'player-row' },
        el('span', { class: 'pn', 'aria-hidden': 'true', style: { background: 'var(' + PCOL[i % 8] + ')', color: 'var(--surface)' }, text: fmt(i + 1) }),
        inp,
        el('button', { type: 'button', class: 'btn btn-ghost', 'aria-label': t('remove_player', { n: fmt(i + 1) }), title: t('remove_player', { n: fmt(i + 1) }),
          disabled: beeCfg.names.length <= 1, text: '✕',
          onclick: function () { beeCfg.names.splice(i, 1); saveBee(); renderBeeSetup(); } })));
    });
    $('b-add').disabled = beeCfg.names.length >= 8;
    var seg = $('b-levels'); seg.textContent = '';
    LEVEL_IDS.concat(['custom']).forEach(function (id) {
      var li = levelInfo(id);
      seg.appendChild(el('button', { type: 'button', 'data-level': id, 'aria-pressed': beeCfg.level === id ? 'true' : 'false', title: li.sub || t('n_words', { n: fmt(custom.length) }),
        disabled: id === 'custom' && !custom.length, text: li.name,
        onclick: function () { beeCfg.level = id; saveBee(); renderBeeSetup(); } }));
    });
    if (beeCfg.level === 'custom' && !custom.length) { beeCfg.level = '1'; seg.querySelector('[data-level="1"]').setAttribute('aria-pressed', 'true'); }
    EDU.$$('#b-per button').forEach(function (b) { b.setAttribute('aria-pressed', +b.dataset.per === beeCfg.per ? 'true' : 'false'); });
    EDU.$$('#b-type button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.type === beeCfg.type ? 'true' : 'false'); });
    setText($('b-type-help'), t(beeCfg.type === 'ko' ? 'type_ko_help' : 'type_points_help'));
    $('b-per-field').hidden = beeCfg.type === 'ko';   /* knock-out goes on until one player is left */
  }
  $('b-add').addEventListener('click', function () {
    if (beeCfg.names.length >= 8) return;
    beeCfg.names.push(''); saveBee(); renderBeeSetup();
    var last = $('b-name' + (beeCfg.names.length - 1)); if (last) last.focus();
  });
  EDU.$$('#b-per button').forEach(function (b) { b.addEventListener('click', function () { beeCfg.per = +b.dataset.per; saveBee(); renderBeeSetup(); }); });
  EDU.$$('#b-type button').forEach(function (b) { b.addEventListener('click', function () { beeCfg.type = b.dataset.type; saveBee(); renderBeeSetup(); }); });

  function startBee() {
    var pool = poolFor(beeCfg.level);
    if (!pool.length) { EDU.toast(t('custom_none')); return; }
    BE = {
      players: beeCfg.names.map(function (nm, i) { return { name: String(nm || '').trim(), idx: i, score: 0, lives: 3, out: false, outAt: 0, turns: 0 }; }),
      pool: pool, queue: EDU.shuffle(pool), cur: -1, ko: beeCfg.type === 'ko', per: beeCfg.per, level: beeCfg.level, done: false, item: null, knocked: 0
    };
    $('b-setup').hidden = true; $('b-endcard').hidden = true; $('b-stage').hidden = false;
    nextTurn();
    scrollToTabs();
  }
  function nextIndex() {
    var n = BE.players.length;
    var active = BE.players.filter(function (p) { return !p.out; });
    if (!active.length || (BE.ko && n > 1 && active.length <= 1)) return -1;
    for (var k = 1; k <= n; k++) {
      var j = (BE.cur + k + n) % n, p = BE.players[j];
      if (!p.out && (BE.ko || p.turns < BE.per)) return j;
    }
    return -1;
  }
  function nextTurn() {
    var j = nextIndex();
    if (j < 0) return endBee();
    BE.cur = j;
    if (!BE.queue.length) BE.queue = EDU.shuffle(BE.pool);
    BE.item = BE.queue.shift();
    $('b-next').hidden = true; $('b-judge').hidden = false;
    renderBoard(); renderTurn();
    bPanel.setWord(BE.item, true);
  }
  function onBeeDone(res) {
    if (!BE || BE.done) return;
    var p = BE.players[BE.cur];
    p.turns++;
    if (res.ok) p.score++;
    else if (BE.ko) { p.lives--; if (p.lives <= 0) { p.out = true; p.outAt = ++BE.knocked; } }
    $('b-judge').hidden = true;
    renderBoard(); renderTurn();
    setKey($('b-next-lbl'), nextIndex() < 0 ? 'see_winner' : 'next_player');
    $('b-next').hidden = false;
    $('b-next').focus({ preventScroll: true });
  }
  function renderBoard() {
    if (!BE) return;
    var box = $('b-board'); box.textContent = '';
    BE.players.forEach(function (p, i) {
      var hearts = BE.ko ? el('span', { class: 'hearts', 'aria-label': t('lives_n', { n: fmt(Math.max(0, p.lives)) }), text: '♥'.repeat(Math.max(0, p.lives)) + '♡'.repeat(3 - Math.max(0, p.lives)) }) : null;
      box.appendChild(el('span', { class: 'sc' + (i === BE.cur && !BE.done ? ' cur' : '') + (p.out ? ' out' : ''), 'data-player': i, 'aria-current': i === BE.cur && !BE.done ? 'true' : null },
        el('span', { class: 'dot', style: { background: 'var(' + PCOL[i % 8] + ')' } }),
        el('span', { class: 'sc-name no-i18n', text: pname(p) }),
        el('span', { class: 'sc-score', 'data-score': p.score, text: fmt(p.score) }),
        hearts));
    });
  }
  function renderTurn() {
    if (!BE || BE.cur < 0) return;
    var p = BE.players[BE.cur];
    setText($('b-turn'), t('turn_of', { name: pname(p) }));
    var sub = (BE.ko ? t('lives_n', { n: fmt(Math.max(0, p.lives)) })
      : t('bee_round', { i: fmt(Math.min(p.turns + (bPanel.state().state === 'done' ? 0 : 1), BE.per)), n: fmt(BE.per) })) + ' · ' + levelLabel(BE.level);
    setText($('b-turn-sub'), sub);
  }
  function endBee() {
    if (!BE) return;
    BE.done = true;
    EDU.stopSpeaking();
    if (document.fullscreenElement || document.webkitFullscreenElement) EDU.fullscreen();
    $('b-stage').hidden = true; $('b-endcard').hidden = false;
    renderBeeEnd();
    scrollToTabs();
  }
  function ranked() {
    /* knock-out: players still in first (most lives, then most correct); the later someone was knocked out, the higher */
    return BE.players.slice().sort(function (a, b) {
      if (BE.ko) return (a.out - b.out) || (b.outAt - a.outAt) || (b.lives - a.lives) || (b.score - a.score) || (a.idx - b.idx);
      return (b.score - a.score) || (a.idx - b.idx);
    });
  }
  function renderBeeEnd() {
    if (!BE || !BE.done) return;
    var r = ranked(), top = r[0];
    var same = function (a, b) { return BE.ko ? (a.out === b.out && a.outAt === b.outAt && a.lives === b.lives && a.score === b.score) : a.score === b.score; };
    var winners = r.filter(function (p) { return same(p, top); });
    var box = $('b-winner'); box.textContent = '';
    box.dataset.winner = winners.length === 1 ? String(top.idx) : 'tie';
    box.appendChild(el('div', { class: 'trophy', 'aria-hidden': 'true', text: winners.length === 1 ? '🏆' : '🤝' }));
    box.appendChild(el('h2', { id: 'b-winner-title', text: winners.length === 1 ? t('winner_is', { name: pname(top) }) : t('winners_tie', { names: winners.map(pname).join(', ') }) }));
    box.appendChild(el('p', { class: 'muted mb0', text: t('final_note') }));
    var tb = $('b-final'); tb.textContent = '';
    tb.appendChild(el('thead', {}, el('tr', {}, el('th', { class: 'num', text: '#' }), el('th', { text: t('col_player') }), el('th', { class: 'num', text: t('score') }), BE.ko ? el('th', { text: t('col_lives') }) : null)));
    var tbody = el('tbody');
    var rank = 0;
    r.forEach(function (p, i) {
      if (i === 0 || !same(p, r[i - 1])) rank = i + 1;
      tbody.appendChild(el('tr', { 'data-player': p.idx },
        el('td', { class: 'num', text: fmt(rank) }),
        el('td', {}, el('span', { class: 'no-i18n', text: pname(p) })),
        el('td', { class: 'num final-score', text: fmt(p.score) }),
        BE.ko ? el('td', { text: p.out ? t('out') : '♥'.repeat(Math.max(0, p.lives)) }) : null));
    });
    tb.appendChild(tbody);
  }
  $('b-start').addEventListener('click', startBee);
  $('b-next').addEventListener('click', function () { if (BE && !BE.done) nextTurn(); });
  $('b-ok').addEventListener('click', function () { bPanel.judge(true); });
  $('b-bad').addEventListener('click', function () { bPanel.judge(false); });
  $('b-end').addEventListener('click', function () { if (BE && confirm(t('confirm_end'))) endBee(); });
  $('b-fs').addEventListener('click', function () { EDU.fullscreen($('b-stage')); });
  $('b-again').addEventListener('click', startBee);
  $('b-settings').addEventListener('click', function () { BE = null; $('b-endcard').hidden = true; $('b-stage').hidden = true; $('b-setup').hidden = false; renderBeeSetup(); });

  /* ======================================================================
     WORD LISTS (teacher list, share link, print)
     ====================================================================== */
  var lmsg = [];          // last message lines, re-rendered on language change
  var shared = null;      // a list opened from a share link, waiting for "Use this list"

  function parseList(text) {
    var lines = String(text || '').split(/\r?\n/);
    var nonEmpty = lines.filter(function (l) { return l.trim(); });
    if (nonEmpty.length === 1 && nonEmpty[0].indexOf('|') < 0 && /[,;]/.test(nonEmpty[0])) lines = nonEmpty[0].split(/[,;]/);
    var items = [], seen = {}, skipped = 0;
    lines.forEach(function (line) {
      if (!line.trim()) return;
      var parts = line.replace(/\t/g, '|').split('|');
      var w = parts[0].replace(/[‘’`]/g, "'").replace(/\s+/g, ' ').trim();
      if (!validWord(w) || items.length >= 300) { skipped++; return; }
      var k = w.toLowerCase();
      if (seen[k]) return;
      seen[k] = 1;
      items.push({ w: w, s: (parts[1] || '').trim().slice(0, 200), m: parts.slice(2).join('|').trim().slice(0, 120), lv: 'custom' });
    });
    return { items: items, skipped: skipped };
  }
  function listToText(items) {
    return items.map(function (x) { return x.w + (x.s || x.m ? ' | ' + x.s : '') + (x.m ? ' | ' + x.m : ''); }).join('\n');
  }
  function renderLMsg() {
    var box = $('l-msg'); box.textContent = '';
    lmsg.forEach(function (m) {
      if (m.url) {
        box.appendChild(el('p', { class: 'share-url no-i18n mb0', dir: 'ltr', text: m.url }));
        box.appendChild(el('p', { class: 'mb0', style: { marginTop: '6px' } },
          el('a', { class: 'btn btn-sm btn-wa', href: EDU.waLink(t('wa_list', { n: fmt(m.n), url: m.url })), target: '_blank', rel: 'noopener', text: '💬 ' + t('wa_share') })));
      } else box.appendChild(el('p', { class: 'mb0 ' + (m.cls || ''), text: t(m.k, m.v) }));
    });
  }
  function setMsg(lines) { lmsg = lines; renderLMsg(); }
  function saveCustom(items) {
    custom = cleanItems(items);
    store.set('custom', custom);
    renderLevels(); renderRoundInfo(); renderBeeSetup(); renderListView();
  }
  function saveFromBox() {
    var r = parseList($('l-text').value);
    saveCustom(r.items);
    $('l-text').value = listToText(custom);
    var lines = [];
    lines.push(custom.length ? { k: 'list_saved', v: { n: fmt(custom.length) }, cls: 'msg-ok' } : { k: 'list_empty', v: {}, cls: 'msg-warn' });
    if (r.skipped) lines.push({ k: 'list_skipped', v: { n: fmt(r.skipped) }, cls: 'msg-warn' });
    setMsg(lines);
    if (custom.length) { cfg.listView = 'custom'; saveCfg(); renderListView(); }
  }
  $('l-text').value = listToText(custom);
  $('l-save').addEventListener('click', saveFromBox);
  $('l-example').addEventListener('click', function () { $('l-text').value = DATA.example || ''; saveFromBox(); });
  $('l-clear').addEventListener('click', function () {
    if (!custom.length && !$('l-text').value.trim()) return;
    if (!confirm(t('confirm_clear_list'))) return;
    $('l-text').value = '';
    saveCustom([]);
    if (cfg.level === 'custom') { cfg.level = '1'; renderLevels(); renderRoundInfo(); }
    if (cfg.listView === 'custom') { cfg.listView = '1'; renderListView(); }
    saveCfg();
    setMsg([{ k: 'list_cleared', v: {}, cls: 'msg-ok' }]);
  });
  $('l-share').addEventListener('click', function () {
    if (!custom.length) { setMsg([{ k: 'list_empty', v: {}, cls: 'msg-warn' }]); return; }
    var url = EDU.shareUrl() + '#list=' + EDU.pack({ v: 1, w: custom.map(function (x) { return [x.w, x.s || '', x.m || '']; }) });
    EDU.copy(url);
    setMsg([{ k: 'share_done', v: {}, cls: 'msg-ok' }, { url: url, n: custom.length }]);
  });

  function readShared() {
    var m = /[#&]list=([A-Za-z0-9_-]+)/.exec(location.hash || '');
    if (!m) return;
    var data = EDU.unpack(m[1]);
    var items = cleanItems(arr(data && data.w).map(function (r) {
      return Array.isArray(r) ? { w: String(r[0] || '').trim(), s: str(r[1]), m: str(r[2]), lv: 'custom' } : null;
    }).filter(Boolean)).slice(0, 300);
    if (!items.length) return;
    shared = items;
    cfg.tab = 'lists';
  }
  function renderShared() {
    $('l-shared').hidden = !shared;
    if (shared) setText($('l-shared-msg'), t('shared_found', { n: fmt(shared.length) }));
  }
  function clearHash() { try { history.replaceState(history.state, '', location.href.split('#')[0]); } catch (e) { } }
  $('l-shared-use').addEventListener('click', function () {
    if (!shared) return;
    saveCustom(shared);
    $('l-text').value = listToText(custom);
    shared = null; clearHash(); renderShared();
    cfg.listView = 'custom'; saveCfg(); renderListView();
    setMsg([{ k: 'list_saved', v: { n: fmt(custom.length) }, cls: 'msg-ok' }]);
  });
  $('l-shared-no').addEventListener('click', function () { shared = null; clearHash(); renderShared(); });
  /* a share link pasted into a tab that already has the app open only changes the #hash */
  window.addEventListener('hashchange', function () {
    readShared();
    if (shared) { showTab('lists'); renderShared(); }
  });

  function renderListView() {
    var id = cfg.listView;
    var seg = $('l-levels'); seg.textContent = '';
    LEVEL_IDS.concat(['custom']).forEach(function (lid) {
      var li = levelInfo(lid);
      seg.appendChild(el('button', { type: 'button', 'data-level': lid, 'aria-pressed': lid === id ? 'true' : 'false', title: li.sub || null, text: li.name,
        onclick: function () { cfg.listView = lid; saveCfg(); renderListView(); } }));
    });
    var pool = poolFor(id);
    setText($('l-count'), levelLabel(id) + ' · ' + t('n_words', { n: fmt(pool.length) }));
    var tb = $('l-table'); tb.textContent = '';
    tb.appendChild(el('thead', {}, el('tr', {}, el('th', { text: '#' }), el('th', { text: t('col_word') }), el('th', { text: t('meaning') }),
      el('th', { text: t('col_sentence') }), el('th', {}, el('span', { class: 'sr-only', text: t('col_listen') })))));
    var body = el('tbody');
    if (!pool.length) body.appendChild(el('tr', {}, el('td', { colspan: '5', class: 'muted', text: t('custom_none') })));
    pool.forEach(function (x, i) {
      var mm = meaningOf(x);
      body.appendChild(el('tr', {},
        el('td', { class: 'n', text: fmt(i + 1) }),
        el('td', { class: 'w no-i18n', dir: 'ltr', text: x.w }),
        el('td', { class: 'm' + (mm && mm.user ? ' no-i18n' : ''), text: mm ? mm.text : '' }),
        el('td', { class: 's no-i18n', dir: 'ltr', text: x.s || '' }),
        el('td', {}, el('button', { type: 'button', class: 'btn btn-sm', 'aria-label': t('listen_to', { w: x.w }), title: t('listen_to', { w: x.w }), text: '🔊', onclick: function () { say(x.w, cfg.rate); } }))));
    });
    tb.appendChild(body);
    renderPrint();
  }
  /* the printed test asks the words in a shuffled order (made fresh each time "Print spelling test" is pressed);
     the answer key follows the same order */
  var testOrder = null;
  function testItems(id, pool) {
    var o = testOrder;
    if (!o || o.id !== id || o.words.length !== pool.length) return pool;
    var byW = {};
    pool.forEach(function (x) { byW[x.w] = x; });
    var out = o.words.map(function (w) { return byW[w]; }).filter(Boolean);
    return out.length === pool.length ? out : pool;
  }
  function renderPrint() {
    var id = cfg.listView, pool = poolFor(id), lvl = levelLabel(id), testPool = testItems(id, pool);
    var area = $('print-area'); area.textContent = '';
    var rows = pool.map(function (x, i) {
      var mm = meaningOf(x);
      return el('tr', {}, el('td', { text: fmt(i + 1) }), el('td', { style: { fontWeight: '700' }, text: x.w }), el('td', { text: mm ? mm.text : '' }), el('td', { text: x.s || '' }));
    });
    area.appendChild(el('div', { class: 'print-sheet list-sheet' },
      el('h1', { text: t('print_title', { level: lvl }) }),
      el('p', { class: 'print-sub', text: t('brand') + ' · ' + t('app_title') }),
      el('table', { class: 'table' }, el('thead', {}, el('tr', {}, el('th', { text: '#' }), el('th', { text: t('col_word') }), el('th', { text: t('meaning') }), el('th', { text: t('col_sentence') }))), el('tbody', {}, rows))));
    area.appendChild(el('div', { class: 'print-sheet test-sheet' },
      el('h1', { text: t('test_title', { level: lvl }) }),
      el('p', { class: 'print-sub', text: t('brand') + ' · ' + t('app_title') }),
      el('div', { class: 'print-fill' },
        el('span', { text: t('print_name') + ': ______________________' }),
        el('span', { text: t('print_class') + ': ________' }),
        el('span', { text: t('print_date') + ': ____________' })),
      el('p', { text: t('test_instr') }),
      el('ol', { class: 'test-lines' }, testPool.map(function (x) { var mm = meaningOf(x); return el('li', {}, el('div', { class: 'tl' }, el('span', { class: 'line' }), el('span', { class: 'clue-p', text: mm ? mm.text : '' }))); })),
      el('div', { class: 'answer-key' }, el('h2', { text: t('answer_key') }), el('ol', { class: 'key-list' }, testPool.map(function (x) { return el('li', { text: x.w }); })))));
  }
  function doPrint(test) {
    if (test) testOrder = { id: cfg.listView, words: EDU.shuffle(poolFor(cfg.listView)).map(function (x) { return x.w; }) };
    renderPrint();
    document.body.classList.toggle('sb-print-test', !!test);
    try { window.print(); } catch (e) { }
  }
  window.addEventListener('afterprint', function () { document.body.classList.remove('sb-print-test'); });
  $('l-print-list').addEventListener('click', function () { doPrint(false); });
  $('l-print-test').addEventListener('click', function () { doPrint(true); });

  /* ---------------- tabs ---------------- */
  var TABS = ['practise', 'bee', 'lists'];
  function showTab(name, focus) {
    TABS.forEach(function (n) {
      var on = n === name;
      $('view-' + n).hidden = !on;
      var b = $('tab-' + n);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
    if (cfg.tab !== name) { cfg.tab = name; saveCfg(); }
    if (focus) $('tab-' + name).focus();
  }
  TABS.forEach(function (n, i) {
    var b = $('tab-' + n);
    b.addEventListener('click', function () { showTab(n); });
    b.addEventListener('keydown', function (e) {
      var rtl = document.documentElement.dir === 'rtl', d = 0;
      if (e.key === 'ArrowRight') d = rtl ? -1 : 1; else if (e.key === 'ArrowLeft') d = rtl ? 1 : -1;
      if (e.key === 'Home') { e.preventDefault(); showTab(TABS[0], true); return; }
      if (e.key === 'End') { e.preventDefault(); showTab(TABS[TABS.length - 1], true); return; }
      if (d) { e.preventDefault(); showTab(TABS[(i + d + TABS.length) % TABS.length], true); }
    });
  });

  /* Enter moves on after a result (the Next button already has focus; this covers clicks elsewhere) */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.defaultPrevented) return;
    var tg = e.target && e.target.tagName;
    if (tg === 'BUTTON' || tg === 'A' || tg === 'TEXTAREA' || tg === 'SELECT') return;
    if (!$('view-practise').hidden && !$('p-next').hidden && !$('p-play').hidden) { e.preventDefault(); nextWord(); }
    else if (!$('view-bee').hidden && !$('b-next').hidden && !$('b-stage').hidden) { e.preventDefault(); if (BE && !BE.done) nextTurn(); }
  });

  /* ---------------- start ---------------- */
  function renderAll() {
    renderLevels(); renderRoundInfo(); renderStats(); renderVoice();
    panels.forEach(function (p) { p.render(); });
    if (PR && !$('p-play').hidden) renderPlayHead();
    if (PR && !$('p-summary').hidden) renderSummary();
    renderBeeSetup();
    if (BE) { renderBoard(); renderTurn(); renderBeeEnd(); }
    renderListView(); renderLMsg(); renderShared();
  }
  readShared();
  showTab(cfg.tab);
  renderAll();
  EDU.onLang(renderAll);

  if (window.speechSynthesis) {
    EDU.getVoices().then(onVoices);
    try {
      if (speechSynthesis.addEventListener) speechSynthesis.addEventListener('voiceschanged', function () { onVoices(speechSynthesis.getVoices()); });
    } catch (e) { }
  } else onVoices([]);
})();
