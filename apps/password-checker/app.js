/* Password Strength Lab: UI. The estimator lives in engine.js (window.PWLAB), word lists in data.js.
   Privacy: the password typed into #pw is never stored, logged or sent anywhere. Only settings and the quiz
   best score are saved (EDU.store). */
(function () {
  'use strict';
  var SLUG = 'password-checker';
  var store = EDU.store(SLUG);
  var P = window.PWLAB, DATA = window.PW_DATA;
  var $ = EDU.$, $$ = EDU.$$, el = EDU.el, t = EDU.t;

  EDU.init({ slug: SLUG, title: 'app_title' });

  var EXAMPLES = ['india@123', 'Password@123', 'Rahul@2008', 'P@ssw0rd', 'qwerty123', '15081947', 'aaaaaa111',
    'tiger-mango-river-42', 'Kh9#mQ2v!xL7', 'otter-kettle-violin-meadow-sock-73'];
  var TYPES = [['lower', 'type_lower', 26], ['upper', 'type_upper', 26], ['digit', 'type_digit', 10], ['symbol', 'type_symbol', 33], ['other', 'type_other', 100]];

  var state = {
    tab: store.get('tab', 'check'),
    show: true,                       /* examples are shown openly; typing your own (or Clear) hides it again */
    gen: cleanGen(store.get('gen', null)),
    phrase: null,
    quiz: null,
    best: (function (b) { return typeof b === 'number' && b >= 0 && b <= 8 ? b : null; })(store.get('best', null))
  };
  if (['check', 'gen', 'quiz', 'tips'].indexOf(state.tab) < 0) state.tab = 'check';

  /* settings from an old or damaged save fall back to the defaults, one by one */
  function cleanGen(g) {
    g = g && typeof g === 'object' ? g : {};
    return {
      count: [4, 5, 6, 7, 8].indexOf(+g.count) >= 0 ? +g.count : 6,
      list: ['en', 'hi', 'both'].indexOf(g.list) >= 0 ? g.list : 'en',
      sep: ['-', '.', '_', ' ', ''].indexOf(g.sep) >= 0 ? g.sep : '-',
      number: g.number === undefined ? true : !!g.number,
      caps: !!g.caps
    };
  }

  /* ---------------- helpers ---------------- */
  function sup(n) { return String(n).replace(/[0-9-]/g, function (d) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'.charAt('0123456789'.indexOf(d)) || '⁻'; }); }
  function fmtGuesses(bits) {
    var g = P.guessParts(bits);
    return g.small !== undefined ? EDU.fmt(g.small) : g.mant + ' × 10' + sup(g.exp);
  }
  function fmtCount(x) { return fmtGuesses(Math.log2(Math.max(1, x))); }
  function timeText(bits) { var tp = P.timeParts(bits); return t(tp.key, { n: EDU.fmt(tp.n || 0) }); }
  function bitsText(b) { return EDU.fmt(Math.round(b)); }
  function mask(s) { return Array.from(s).map(function (c) { return c === ' ' ? ' ' : '•'; }).join(''); }
  function debounce(fn, ms) { var h; return function () { clearTimeout(h); h = setTimeout(fn, ms); }; }

  /* ---------------- tabs ---------------- */
  function showTab(name) {
    state.tab = name; store.set('tab', name);
    $$('#tabs [role="tab"]').forEach(function (b) {
      var on = b.id === 'tab-' + name;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      $('#' + b.getAttribute('data-panel')).hidden = !on;
    });
    if (name === 'gen' && !state.phrase) newPhrase();
    if (name === 'quiz' && !state.quiz) startQuiz();
  }
  $$('#tabs [role="tab"]').forEach(function (b, i, all) {
    b.addEventListener('click', function () { showTab(b.id.slice(4)); });
    b.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      if (document.documentElement.dir === 'rtl') d = -d;
      var nx = all[(i + d + all.length) % all.length]; nx.focus(); nx.click();
    });
  });

  /* ================= CHECKER ================= */
  var pw = $('#pw');
  function setShow(on) {
    state.show = !!on;
    pw.type = on ? 'text' : 'password';
    $('#toggle').setAttribute('aria-pressed', on ? 'true' : 'false');
    $('#toggle-txt').textContent = t(on ? 'hide' : 'show');
  }
  /* Examples and generated passphrases are shown openly. As soon as someone types over one (their own
     password, maybe on a projector), the box switches back to hidden dots. Show is always one tap away. */
  var demo = null;
  function setPassword(v, show) {
    pw.value = v;
    demo = show ? v : null;
    if (show !== undefined) setShow(show);
    renderResult();
  }
  function guardDemo() {
    if (demo === null || !state.show) return;
    var v = pw.value;
    if (v.indexOf(demo) !== 0 && demo.indexOf(v) !== 0) { demo = null; setShow(false); }
  }

  function renderExamples() {
    var box = $('#examples'); box.innerHTML = '';
    EXAMPLES.forEach(function (x, i) {
      box.appendChild(el('button', { type: 'button', class: 'chip', id: 'ex-' + i, dir: 'ltr', text: x, onclick: function () { setPassword(x, true); } }));
    });
  }

  function feedback(res, lvl) {
    var segs = res.segments, probs = [], good = [], tips = [], by = {};
    segs.forEach(function (s) { (by[s.kind] = by[s.kind] || []).push(s); });
    var tok = function (s) { return state.show ? s.token : mask(s.token); };
    var add = function (list, key, vars) { list.push({ key: key, vars: vars || {} }); };
    var words = (by.word || []).concat(by.hindi || []);
    /* common passwords that are plain words ("tiger") count as words in a passphrase; "123456" never does */
    var wordCommon = (by.common || []).filter(function (s) { return !s.leet && /^[a-z]+$/.test(s.word || ''); });
    var nWords = words.length + wordCommon.length + (by.name || []).length + (by.place || []).length;
    var passphrase = nWords >= 3 && words.length >= 2;
    var whole = segs.length === 1 && segs[0].kind === 'common';
    var personal = false;

    if (whole) add(probs, 'fb_common_whole');
    else (by.common || []).slice(0, 2).forEach(function (s) { add(probs, 'fb_common_part', { x: tok(s) }); });
    var nums = (by.year || []).concat(by.date || [], by.number || []);
    if (by.name && nums.length) { add(probs, 'fb_name_year'); personal = true; }
    (by.name || []).slice(0, 2).forEach(function (s) { add(probs, 'fb_name', { x: tok(s) }); personal = true; });
    (by.place || []).slice(0, 1).forEach(function (s) { add(probs, 'fb_place', { x: tok(s) }); });
    if (!passphrase) {
      (by.word || []).slice(0, 2).forEach(function (s) { add(probs, 'fb_word', { x: tok(s) }); });
      (by.hindi || []).slice(0, 2).forEach(function (s) { add(probs, 'fb_hindi', { x: tok(s) }); });
    }
    (by.script || []).slice(0, 1).forEach(function (s) { add(probs, 'fb_script', { x: tok(s) }); });
    if (res.flags && res.flags.phone) { add(probs, 'fb_phone'); personal = true; }
    (by.date || []).slice(0, 1).forEach(function (s) { add(probs, s.famous ? 'fb_famous_date' : 'fb_date', { x: tok(s) }); personal = true; });
    if (!by.name) (by.year || []).slice(0, 1).forEach(function (s) { add(probs, 'fb_year', { x: tok(s) }); personal = true; });
    (by.seq || []).slice(0, 2).forEach(function (s) { add(probs, 'fb_seq', { x: tok(s) }); });
    (by.keyboard || []).slice(0, 2).forEach(function (s) { add(probs, 'fb_keyboard', { x: tok(s) }); });
    (by.repeat || []).slice(0, 2).forEach(function (s) { add(probs, 'fb_repeat', { x: tok(s) }); });
    if (segs.some(function (s) { return s.leet; })) add(probs, 'fb_leet');
    segs.filter(function (s) { return s.reversed; }).slice(0, 1).forEach(function (s) { add(probs, 'fb_reversed', { x: tok(s) }); });
    var firstDict = segs[0] && ['common', 'word', 'hindi', 'name', 'place'].indexOf(segs[0].kind) >= 0 ? segs[0] : null;
    if (firstDict && firstDict.caps === 'first' && lvl <= 2 && !passphrase) add(probs, 'fb_caps');
    if (res.flags && res.flags.digitsOnly && res.length >= 4 && !res.flags.phone) add(probs, 'fb_digits_only');
    if (res.length < 12 && lvl < 3) add(probs, 'fb_short', { n: EDU.fmt(res.length) });
    probs = probs.slice(0, 7);

    var ntypes = Object.keys(res.classes).length;
    if (passphrase && lvl >= 2) add(good, 'good_passphrase', { n: EDU.fmt(nWords) });
    if (res.length >= 16 && lvl >= 2) add(good, 'good_long', { n: EDU.fmt(res.length) });
    if (ntypes >= 3 && lvl >= 2) add(good, 'good_mix', { n: EDU.fmt(ntypes) });
    if (segs.every(function (s) { return s.kind === 'random'; }) && res.length >= 8) add(good, 'good_nopattern');

    if (lvl <= 2) add(tips, passphrase || words.length ? 'tip_more_words' : 'tip_longer');
    if (lvl <= 1 && !passphrase && !words.length) add(tips, 'tip_more_words');
    if (personal) add(tips, 'tip_personal');
    if (lvl >= 3) add(tips, 'tip_unique');
    return { probs: probs, good: good, tips: tips };
  }

  function fbList(cls, icon, items) {
    return el('ul', { class: 'fb ' + cls }, items.map(function (f) {
      return el('li', { dataset: { key: f.key } }, el('span', { class: 'ic', 'aria-hidden': 'true', text: icon }), el('span', { text: t(f.key, f.vars) }));
    }));
  }

  /* Screen readers hear a short summary once typing pauses, not the whole result card on every key press */
  var announce = (function () {
    var h;
    return function (msg) { clearTimeout(h); h = setTimeout(function () { $('#result-live').textContent = msg; }, 700); };
  })();

  function renderResult() {
    var box = $('#result'), v = pw.value;
    box.innerHTML = '';
    if (!v) {
      announce('');
      box.removeAttribute('data-level');
      box.appendChild(el('div', { class: 'meter', 'aria-hidden': 'true' }, [0, 1, 2, 3, 4].map(function () { return el('span'); })));
      box.appendChild(el('p', { class: 'result-empty', id: 'empty-hint', text: t('empty_hint') }));
      return;
    }
    var res = P.analyze(v), lvl = P.level(res.bits);
    announce(t('level' + lvl) + '. ' + t('time_label') + ' ' + timeText(res.bits));
    box.setAttribute('data-level', String(lvl));
    box.className = 'card stack lv' + lvl;

    box.appendChild(el('div', { class: 'meter', id: 'meter', role: 'img', 'aria-label': t('level' + lvl) },
      [0, 1, 2, 3, 4].map(function (i) { return el('span', { class: i <= lvl ? 'on' : '' }); })));
    box.appendChild(el('div', { class: 'level-row' },
      el('span', { class: 'level-label', id: 'level', dataset: { level: String(lvl) }, text: t('level' + lvl) })));
    box.appendChild(el('div', { class: 'crack' },
      el('p', { class: 'small muted', text: t('time_label') }),
      el('div', { class: 'crack-time', id: 'crack-time', text: timeText(res.bits) })));
    box.appendChild(el('div', { class: 'stats' },
      el('div', { class: 'stat' }, el('b', { id: 'stat-len', text: EDU.fmt(res.length) }), el('span', { text: t('stat_len') })),
      el('div', { class: 'stat' }, el('b', { id: 'stat-bits', dataset: { bits: res.bits.toFixed(2) }, text: bitsText(res.bits) }), el('span', { text: t('stat_bits') })),
      el('div', { class: 'stat' }, el('b', { id: 'stat-guesses', text: fmtGuesses(res.bits) }), el('span', { text: t('stat_guesses') }))));

    /* character types */
    box.appendChild(el('div', { class: 'stack' },
      el('h3', { class: 'h-sec', text: t('types_label') }),
      el('div', { class: 'types', id: 'types' }, TYPES.map(function (ty) {
        var on = !!res.classes[ty[0]];
        return el('span', { class: 'ctype' + (on ? ' on' : ''), dataset: { type: ty[0] } }, (on ? '✓ ' : '') + t(ty[1]), el('b', { dir: 'ltr', text: '+' + EDU.fmt(ty[2]) }));
      }))));

    /* pieces */
    var pieces = el('div', { class: 'pieces no-i18n', id: 'pieces', dir: 'ltr' }, res.segments.map(function (s) {
      return el('div', { class: 'piece', dataset: { kind: s.kind } },
        el('span', { class: 'tok', text: s.kind === 'sep' && s.token === ' ' ? '␣' : (state.show ? s.token : mask(s.token)) }),
        el('span', { class: 'knd', dir: 'auto', text: t('kind_' + s.kind) }),
        el('span', { class: 'gx', text: '×' + fmtCount(s.g) }));
    }));
    box.appendChild(el('div', { class: 'stack' },
      el('h3', { class: 'h-sec', text: t('pieces_title') }),
      el('p', { class: 'small muted mb0', text: t('pieces_hint') + (state.show ? '' : ' ' + t('pieces_hidden')) }),
      pieces));

    /* feedback */
    var fb = feedback(res, lvl), fbBox = el('div', { class: 'stack', id: 'feedback' });
    if (fb.probs.length) fbBox.appendChild(el('div', { class: 'stack' }, el('h3', { class: 'h-sec', text: t('fb_problems') }), fbList('fbx-bad', '⚠️', fb.probs)));
    if (fb.good.length) fbBox.appendChild(el('div', { class: 'stack' }, el('h3', { class: 'h-sec', text: t('fb_good') }), fbList('fbx-good', '✅', fb.good)));
    if (fb.tips.length) fbBox.appendChild(el('div', { class: 'stack' }, el('h3', { class: 'h-sec', text: t('fb_tips') }), fbList('fbx-tip', '💡', fb.tips)));
    box.appendChild(fbBox);

    /* simple maths vs patterns */
    var max = Math.max(res.simpleBits, 1);
    box.appendChild(el('div', { class: 'bars', id: 'compare' },
      el('h3', { class: 'h-sec', text: t('compare_title') }),
      el('div', { class: 'bar-lbl' }, el('span', { text: t('compare_simple', { pool: EDU.fmt(res.pool), len: EDU.fmt(res.length) }) }), el('b', { text: t('compare_bits', { n: bitsText(res.simpleBits) }) })),
      el('div', { class: 'bar simple' }, el('span', { style: { width: '100%' } })),
      el('div', { class: 'bar-lbl' }, el('span', { text: t('compare_real') }), el('b', { id: 'real-bits', text: t('compare_bits', { n: bitsText(res.bits) }) })),
      el('div', { class: 'bar real' }, el('span', { style: { width: Math.max(1, Math.round(res.bits / max * 100)) + '%' } })),
      res.simpleBits - res.bits > 8 ? el('p', { class: 'small muted mb0', text: t('compare_note') }) : null));
  }
  var renderSoon = debounce(renderResult, 70);

  pw.addEventListener('input', function () { guardDemo(); if (pw.value.length > 40) renderSoon(); else renderResult(); });
  $('#toggle').addEventListener('click', function () { demo = null; setShow(!state.show); renderResult(); pw.focus(); });
  $('#clear').addEventListener('click', function () { setPassword('', false); pw.focus(); });
  $('#fs').addEventListener('click', function () { EDU.fullscreen($('#panel-check')); });

  function renderScale() {
    var tb = $('#scale tbody'); tb.innerHTML = '';
    for (var i = 0; i < 5; i++) {
      tb.appendChild(el('tr', { class: 'lv' + i }, el('td', {}, el('span', { class: 'dot', 'aria-hidden': 'true' }), t('level' + i)), el('td', { text: t('scale_' + i) })));
    }
  }

  /* ================= GENERATOR ================= */
  var segWords = $('#seg-words');
  [4, 5, 6, 7, 8].forEach(function (n) { segWords.appendChild(el('button', { type: 'button', id: 'w-' + n, dataset: { v: String(n) }, text: EDU.fmt(n) })); });
  function syncOpts() {
    var g = state.gen;
    $$('#seg-words button').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.v === g.count)); });
    $$('#seg-list button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === g.list)); });
    $$('#seg-sep button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === g.sep)); });
    $('#opt-num').checked = !!g.number;
    $('#opt-caps').checked = !!g.caps;
  }
  function saveGen() { store.set('gen', state.gen); }
  segWords.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; state.gen.count = +b.dataset.v; saveGen(); syncOpts(); newPhrase(); });
  $('#seg-list').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; state.gen.list = b.dataset.v; saveGen(); syncOpts(); newPhrase(); });
  $('#seg-sep').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    state.gen.sep = b.dataset.v; saveGen(); syncOpts();
    if (state.phrase) { state.phrase.sep = state.gen.sep; state.phrase.text = state.phrase.parts.join(state.gen.sep); renderPhrase(); } else newPhrase();
  });
  $('#opt-num').addEventListener('change', function () { state.gen.number = this.checked; saveGen(); newPhrase(); });
  $('#opt-caps').addEventListener('change', function () { state.gen.caps = this.checked; saveGen(); newPhrase(); });

  function newPhrase() { state.phrase = P.generate(state.gen); renderPhrase(); }
  function renderPhrase() {
    var ph = state.phrase, box = $('#phrase');
    box.innerHTML = '';
    if (!ph) return;
    box.setAttribute('data-value', ph.text);
    ph.parts.forEach(function (p, i) {
      if (i) box.appendChild(el('span', { class: 's', text: ph.sep }));
      box.appendChild(el('span', { class: /^\d+$/.test(p) ? 'num' : 'w', text: p }));
    });
    renderGenStrength();
  }
  function renderGenStrength() {
    var g = state.gen, bits = P.genBits(g), lvl = P.level(bits), N = P.listSize(g.list);
    var box = $('#gen-strength'); box.innerHTML = '';
    box.className = 'stack lv' + lvl;
    box.appendChild(el('div', { class: 'meter', 'aria-hidden': 'true' }, [0, 1, 2, 3, 4].map(function (i) { return el('span', { class: i <= lvl ? 'on' : '' }); })));
    box.appendChild(el('div', { class: 'level-row' },
      el('span', { class: 'level-label', id: 'gen-level', dataset: { level: String(lvl) }, text: t('level' + lvl) }),
      el('span', { class: 'badge', dir: 'ltr', id: 'gen-bits', dataset: { bits: bits.toFixed(2) }, text: t('compare_bits', { n: bitsText(bits) }) })));
    box.appendChild(el('div', { class: 'crack' },
      el('p', { class: 'small muted', text: t('time_label') }),
      el('div', { class: 'crack-time', id: 'gen-time', text: timeText(bits) })));
    var math = el('div', { class: 'math panel' },
      el('p', { text: t('gen_each', { N: EDU.fmt(N), w: EDU.fmt(g.count) }) }),
      g.number ? el('p', { text: t('gen_num', { p: EDU.fmt(g.count + 1) }) }) : null,
      el('p', { class: 'mb0' }, el('strong', { text: t('gen_total', { g: fmtGuesses(bits), bits: bitsText(bits) }) })));
    box.appendChild(math);
  }
  $('#gen-new').addEventListener('click', newPhrase);
  $('#gen-copy').addEventListener('click', function () { if (state.phrase) EDU.copy(state.phrase.text); });
  $('#gen-test').addEventListener('click', function () {
    if (!state.phrase) return;
    showTab('check');
    setPassword(state.phrase.text, true);
    $('#result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ================= QUIZ ================= */
  var QN = 8;
  function lesson(id) {
    var C = window.APP_CONTENT || {}, L = C[EDU.lang] || C.en || {};
    return (L.lessons && L.lessons[id]) || (C.en && C.en.lessons && C.en.lessons[id]) || '';
  }
  function makePair(p, swap) {
    var a = swap ? p.b : p.a, b = swap ? p.a : p.b;
    var ba = P.analyze(a).bits, bb = P.analyze(b).bits;
    return { id: p.id, swap: !!swap, a: a, b: b, ba: ba, bb: bb, win: ba > bb ? 'a' : 'b' };
  }
  /* The quiz in progress survives a reload (it holds only the fixed quiz pairs, never anything typed). */
  function saveQuiz() {
    var q = state.quiz; if (!q) return;
    store.set('quiz', { ids: q.pairs.map(function (p) { return p.id + (p.swap ? '~' : ''); }), i: q.i, score: q.score, picked: q.picked, done: q.done });
  }
  function loadQuiz() {
    var sv = store.get('quiz', null), byId = {};
    if (!sv || !Array.isArray(sv.ids) || !sv.ids.length || sv.ids.length > DATA.pairs.length) return null;
    DATA.pairs.forEach(function (p) { byId[p.id] = p; });
    var pairs = [];
    for (var k = 0; k < sv.ids.length; k++) {
      var id = String(sv.ids[k]), sw = id.slice(-1) === '~', p = byId[sw ? id.slice(0, -1) : id];
      if (!p) return null;
      pairs.push(makePair(p, sw));
    }
    var i = sv.i | 0;
    if (i < 0 || i >= pairs.length) return null;
    return { pairs: pairs, i: i, score: Math.max(0, Math.min(i + 1, sv.score | 0)), picked: sv.picked === 'a' || sv.picked === 'b' ? sv.picked : null, done: !!sv.done };
  }
  function startQuiz() {
    var pairs = EDU.shuffle(DATA.pairs).slice(0, QN).map(function (p) { return makePair(p, Math.random() < 0.5); });
    state.quiz = { pairs: pairs, i: 0, score: 0, picked: null, done: false };
    saveQuiz();
    renderQuiz();
  }
  function answer(side) {
    var q = state.quiz; if (!q || q.done || q.picked) return;
    q.picked = side;
    if (side === q.pairs[q.i].win) q.score++;
    saveQuiz();
    renderQuiz();
    var nx = $('#quiz-next'); if (nx) nx.focus();
  }
  function nextQ() {
    var q = state.quiz; if (!q || !q.picked) return;
    if (q.i + 1 >= q.pairs.length) {
      q.done = true;
      if (state.best === null || q.score > state.best) { state.best = q.score; store.set('best', q.score); }
    } else { q.i++; q.picked = null; }
    saveQuiz();
    renderQuiz();
    var f = $('#opt-a') || $('#quiz-again'); if (f) f.focus();
  }
  function renderQuiz() {
    var q = state.quiz, box = $('#quiz'); if (!q) return;
    box.innerHTML = '';
    if (q.done) {
      var pct = q.score / q.pairs.length;
      box.appendChild(el('h2', { text: t('quiz_title') }));
      box.appendChild(el('div', { class: 'final-score', id: 'final-score', text: EDU.fmt(q.score) + ' / ' + EDU.fmt(q.pairs.length) }));
      box.appendChild(el('p', { class: 'mb0', text: t('quiz_result', { score: EDU.fmt(q.score), total: EDU.fmt(q.pairs.length) }) }));
      box.appendChild(el('p', { class: 'callout ' + (pct === 1 ? 'success' : pct >= 0.6 ? '' : 'warning'), text: t(pct === 1 ? 'quiz_perfect' : pct >= 0.6 ? 'quiz_good' : 'quiz_keep') }));
      if (state.best !== null) box.appendChild(el('p', { class: 'muted', id: 'quiz-best', text: t('quiz_best', { n: EDU.fmt(state.best) + ' / ' + EDU.fmt(QN) }) }));
      box.appendChild(el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'quiz-again', onclick: function () { startQuiz(); var f = $('#opt-a'); if (f) f.focus(); } }, '🔁 ', t('quiz_again'))));
      return;
    }
    var p = q.pairs[q.i];
    box.appendChild(el('div', { class: 'qtop' },
      el('h2', { class: 'mb0', text: t('quiz_title') }),
      el('div', { class: 'row' },
        el('span', { class: 'pill', id: 'quiz-progress', text: t('quiz_progress', { n: EDU.fmt(q.i + 1), total: EDU.fmt(q.pairs.length) }) }),
        el('span', { class: 'pill' }, t('score') + ': ', el('b', { id: 'quiz-score', text: EDU.fmt(q.score) })))));
    box.appendChild(el('div', { class: 'progress', 'aria-hidden': 'true' }, el('span', { style: { width: Math.round((q.i + (q.picked ? 1 : 0)) / q.pairs.length * 100) + '%' } })));
    if (!q.picked) box.appendChild(el('p', { class: 'muted small mb0', text: t('quiz_hint') }));
    var pair = el('div', { class: 'pair', id: 'pair', dataset: { win: q.picked ? p.win : '' } });
    ['a', 'b'].forEach(function (side) {
      var bits = side === 'a' ? p.ba : p.bb, lvl = P.level(bits);
      var cls = 'opt' + (q.picked ? (side === p.win ? ' win' : ' lose') + (side === q.picked ? ' picked' : '') : '');
      var btn = el('button', { type: 'button', class: cls, id: 'opt-' + side, disabled: !!q.picked, onclick: function () { answer(side); } },
        el('span', { class: 'ol', 'aria-hidden': 'true', text: side.toUpperCase() }),
        el('span', { class: 'opw no-i18n', text: side === 'a' ? p.a : p.b }));
      if (q.picked) {
        btn.appendChild(el('span', { class: 'ores lv' + lvl },
          side === p.win ? el('span', { class: 'badge success', text: '✓ ' + t('quiz_stronger') }) : null,
          el('span', { style: { display: 'block', color: 'var(--lv)', fontWeight: '800' }, text: t('level' + lvl) }),
          el('span', { style: { display: 'block' }, text: timeText(bits) }),
          el('span', { class: 'small muted', dir: 'ltr', text: t('compare_bits', { n: bitsText(bits) }) })));
      }
      pair.appendChild(btn);
    });
    box.appendChild(pair);
    if (q.picked) {
      var right = q.picked === p.win;
      box.appendChild(el('div', { class: 'stack', id: 'quiz-reveal', dataset: { right: right ? '1' : '0' } },
        el('p', { class: 'verdict ' + (right ? 'ok' : 'bad'), id: 'quiz-verdict', text: right ? t('correct') : t('wrong') }),
        el('p', { class: 'callout', text: lesson(p.id) }),
        el('div', { class: 'row' }, el('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'quiz-next', onclick: nextQ }, t('next'), ' ', el('span', { 'aria-hidden': 'true', class: 'arr', text: document.documentElement.dir === 'rtl' ? '←' : '→' })))));
    }
  }
  document.addEventListener('keydown', function (e) {
    if (state.tab !== 'quiz' || !state.quiz || e.ctrlKey || e.metaKey || e.altKey) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    var k = e.key.toLowerCase();
    if (!state.quiz.picked && (k === 'a' || k === '1')) { e.preventDefault(); answer('a'); }
    else if (!state.quiz.picked && (k === 'b' || k === '2')) { e.preventDefault(); answer('b'); }
  });

  /* ---------------- printing ---------------- */
  function printAs(cls) {
    document.body.classList.add(cls);
    var done = function () { document.body.classList.remove(cls); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(function () { window.print(); setTimeout(done, 1500); }, 60);
  }
  function buildWorksheet() {
    var ws = $('#worksheet'); ws.innerHTML = '';
    ws.appendChild(el('h2', { text: t('ws_title') }));
    ws.appendChild(el('p', { text: t('ws_name') }));
    ws.appendChild(el('p', { text: t('ws_instr') }));
    var tbl = el('table', { class: 'ws-table ws-q' },
      el('thead', {}, el('tr', {}, el('th', { text: '#' }), el('th', { text: 'A' }), el('th', { text: 'B' }), el('th', { text: t('ws_why') }))));
    var tb = el('tbody'), key = el('tbody');
    DATA.pairs.forEach(function (p, i) {
      tb.appendChild(el('tr', {}, el('td', { text: EDU.fmt(i + 1) }),
        el('td', {}, el('span', { class: 'ws-box' }), el('span', { class: 'pw', text: p.a })),
        el('td', {}, el('span', { class: 'ws-box' }), el('span', { class: 'pw', text: p.b })),
        el('td', { class: 'ws-why' })));
      var ba = P.analyze(p.a).bits, bb = P.analyze(p.b).bits, w = ba > bb ? 'A' : 'B';
      key.appendChild(el('tr', {}, el('td', { text: EDU.fmt(i + 1) }), el('td', {}, el('strong', { text: w })),
        el('td', { text: 'A: ' + timeText(ba) + ' · B: ' + timeText(bb) }), el('td', { text: lesson(p.id) })));
    });
    tbl.appendChild(tb);
    ws.appendChild(tbl);
    var k = el('div', { class: 'ws-key' }, el('h2', { text: t('ws_key') }),
      el('table', { class: 'ws-table ws-k' }, el('thead', {}, el('tr', {}, el('th', { text: '#' }), el('th', { text: '✓' }), el('th', { text: t('scale_time') }), el('th', { text: t('ws_why') }))), key));
    ws.appendChild(k);
  }
  $('#quiz-print').addEventListener('click', function () { buildWorksheet(); printAs('printing-ws'); });
  $('#print-poster').addEventListener('click', function () { printAs('printing-poster'); });

  /* Reset: forget the best score, the quiz in progress and the passphrase settings (nothing else is ever saved) */
  $('#reset').addEventListener('click', function () {
    if (!window.confirm(t('confirm_reset'))) return;
    ['best', 'quiz', 'gen'].forEach(function (k) { store.remove(k); });
    state.best = null;
    state.gen = cleanGen(null);
    syncOpts();
    if (state.phrase) newPhrase();
    startQuiz();
  });

  /* ---------------- render all ---------------- */
  function renderAll() {
    $('#toggle-txt').textContent = t(state.show ? 'hide' : 'show');
    renderScale();
    renderResult();
    syncOpts();
    if (state.phrase) renderPhrase();
    renderQuiz();
  }
  EDU.onLang(renderAll);

  renderExamples();
  state.quiz = loadQuiz();
  pw.value = demo = 'Rahul@2008';
  setShow(true);
  showTab(state.tab);
  renderAll();
})();
