/* Flashcards: decks + Leitner spaced repetition (boxes 1-5), a typing quiz with a
   forgiving answer check, a match-the-pairs game, a card editor with small pictures,
   bulk add, CSV import/export, share links (deck packed in the URL hash), a JSON
   backup and a printable fold-over sheet. Everything stays on the device (EDU.store). */
(function () {
  'use strict';
  var SLUG = 'flashcards';
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$;

  var INTERVAL = [0, 1, 2, 4, 7, 14];                       // days until the next review, by box
  var EVERY = ['', 'every_1', 'every_2', 'every_4', 'every_7', 'every_14'];
  var MAX_CARDS = 500, MAX_DECKS = 60, MAX_TXT = 400, MAX_NAME = 80;
  var IMG_MAX = 60000, IMG_TOTAL = 1500000;                 // characters of a data: URL
  var SIZES = [10, 20, 50, 0], QCOUNTS = [10, 20, 0], PAIRS = [4, 6, 8];

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ================================================================ helpers */
  function today() { var d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function str(v, max) { return String(v == null ? '' : v).replace(/\r\n?/g, '\n').trim().slice(0, max || MAX_TXT); }
  function int(v, lo, hi, d) { v = parseInt(v, 10); return isNaN(v) ? d : Math.max(lo, Math.min(hi, v)); }
  function num(x) { return EDU.fmt(x); }
  function toast(k, vars) { EDU.toast(t(k, vars)); }
  function reduced() { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function scrollTo(node) {
    if (!node) return;
    try { node.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' }); } catch (e) { }
  }
  function focus(node) { if (node) try { node.focus({ preventScroll: true }); } catch (e) { node.focus(); } }

  /* Which voice should read this text? Guess from the script it is written in. */
  var SCRIPT_LANG = [
    [/[ऀ-ॿ]/g, 'deva'], [/[ঀ-৿]/g, 'bn'], [/[਀-੿]/g, 'pa'], [/[઀-૿]/g, 'gu'],
    [/[଀-୿]/g, 'or'], [/[஀-௿]/g, 'ta'], [/[ఀ-౿]/g, 'te'], [/[ಀ-೿]/g, 'kn'],
    [/[ഀ-ൿ]/g, 'ml'], [/[؀-ۿ]/g, 'ur'], [/[A-Za-z]/g, 'en']
  ];
  function speechLang(txt) {
    var best = null, most = 0;
    SCRIPT_LANG.forEach(function (p) { var m = String(txt).match(p[0]); if (m && m.length > most) { most = m.length; best = p[1]; } });
    if (best === 'deva') return EDU.lang === 'mr' ? 'mr' : 'hi';
    return best || EDU.lang;
  }
  function say(txt) {
    txt = String(txt || '').trim();
    if (!txt) return;
    EDU.speak(txt, { lang: speechLang(txt), rate: 0.9 }).then(function (ok) { if (!ok) toast('no_voice'); });
  }

  /* Forgiving answer check: ignores case, accents, punctuation, extra spaces,
     accepts "a / b" alternatives and text in brackets, and small typos. */
  var PUNCT;
  try { PUNCT = new RegExp('[\\p{P}\\p{S}]', 'gu'); } catch (e) { PUNCT = /[!-\/:-@\[-`{-~‐-‧।॥،۔]/g; }
  function norm(s) {
    s = String(s == null ? '' : s);
    try { s = s.normalize('NFKD'); } catch (e) { }
    s = s.toLowerCase().replace(/[̀-ͯ]/g, '').replace(/[​-‍﻿]/g, '');
    s = s.replace(PUNCT, ' ').replace(/\s+/g, ' ').trim();
    return s.replace(/^(the|a|an|to) /, '');
  }
  function variants(ans) {
    var raw = [ans, ans.replace(/\([^)]*\)/g, ' ')];
    String(ans).split(/\s*[\/;|\n]\s*|\s+or\s+/).forEach(function (p) { raw.push(p); raw.push(p.replace(/\([^)]*\)/g, ' ')); });
    (String(ans).match(/\(([^)]*)\)/g) || []).forEach(function (m) { raw.push(m.slice(1, -1)); });
    var out = [];
    raw.forEach(function (r) { var v = norm(r); if (v && out.indexOf(v) < 0) out.push(v); });
    return out;
  }
  function lev(a, b) {
    a = Array.from(a).slice(0, 200); b = Array.from(b).slice(0, 200);
    var prev = [], cur, i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur = [i];
      for (j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[b.length];
  }
  /* 2 = right, 1 = right with a small spelling slip, 0 = wrong */
  function grade(given, ans) {
    var g = norm(given);
    var vs = variants(ans);
    if (!vs.length) return String(given).trim() === String(ans).trim() && String(given).trim() ? 2 : 0;
    if (!g) return 0;
    var gs = g.replace(/ /g, ''), best = 0;
    for (var i = 0; i < vs.length; i++) {
      var v = vs[i];
      if (g === v || gs === v.replace(/ /g, '')) return 2;
      var L = Array.from(v).length, tol = L <= 3 ? 0 : L <= 6 ? 1 : L <= 12 ? 2 : Math.floor(L * 0.2);
      if (tol && lev(gs, v.replace(/ /g, '')) <= tol) best = 1;
    }
    return best;
  }

  /* ================================================================ model */
  function normCard(c) {
    if (!c || typeof c !== 'object') return null;
    var f = str(c.f), b = str(c.b), img = !!c.img;
    if (!b || (!f && !img)) return null;
    return {
      id: typeof c.id === 'string' && c.id ? c.id.slice(0, 40) : uid(), f: f, b: b, img: img,
      box: int(c.box, 1, 5, 1), due: int(c.due, 0, 1e7, today()),
      seen: int(c.seen, 0, 1e6, 0), ok: int(c.ok, 0, 1e6, 0), bad: int(c.bad, 0, 1e6, 0)
    };
  }
  function newCard(f, b) { return { id: uid(), f: str(f), b: str(b), img: false, box: 1, due: today(), seen: 0, ok: 0, bad: 0 }; }
  function normDeck(d) {
    if (!d || typeof d !== 'object') return null;
    var seen = {}, cards = [];
    (Array.isArray(d.cards) ? d.cards : []).forEach(function (c) {
      c = normCard(c);
      if (!c || cards.length >= MAX_CARDS) return;
      if (seen[c.id]) c.id = uid();
      seen[c.id] = 1; cards.push(c);
    });
    var out = { id: typeof d.id === 'string' && d.id ? d.id.slice(0, 40) : uid(), name: str(d.name, MAX_NAME), cards: cards,
      side: d.side === 'f' || d.side === 'b' ? d.side : '', best: {} };
    if (d.best && typeof d.best === 'object') PAIRS.forEach(function (p) { var v = parseInt(d.best[p], 10); if (v > 0) out.best[p] = v; });
    if (d.sample && typeof d.sample === 'object' && typeof d.sample.i === 'number') out.sample = { i: d.sample.i, lang: String(d.sample.lang || 'en') };
    return out;
  }
  function sampleSet(lang) { var C = window.APP_CONTENT || {}; return ((C[lang] || C.en || {}).decks) || []; }
  function makeSample(i, lang) {
    var src = sampleSet(lang)[i];
    if (!src) return null;
    var d = normDeck({ name: src.name, cards: src.cards.map(function (p) { return { f: p[0], b: p[1] }; }) });
    d.sample = { i: i, lang: lang };
    return d;
  }
  /* Untouched sample decks follow the page language (progress is kept). */
  function relocalize() {
    var changed = false;
    decks.forEach(function (d) {
      if (!d.sample || d.sample.lang === EDU.lang) return;
      var src = sampleSet(EDU.lang)[d.sample.i];
      if (!src || src.cards.length !== d.cards.length) return;
      d.name = src.name;
      d.cards.forEach(function (c, j) { c.f = src.cards[j][0]; c.b = src.cards[j][1]; });
      d.sample.lang = EDU.lang;
      changed = true;
    });
    if (changed) saveDecks();
  }
  function touch(d) { if (d && d.sample) delete d.sample; }
  function cardById(d, id) { for (var i = 0; i < d.cards.length; i++) if (d.cards[i].id === id) return d.cards[i]; return null; }
  function dueCards(d) { var td = today(); return d.cards.filter(function (c) { return c.due <= td; }); }
  function nextDue(d) { var td = today(), m = Infinity; d.cards.forEach(function (c) { if (c.due > td && c.due < m) m = c.due; }); return m === Infinity ? null : m; }
  function whenText(day) {
    var diff = day - today();
    if (diff <= 0) return t('when_today');
    if (diff === 1) return t('when_tomorrow');
    return t('when_days', { n: num(diff) });
  }
  function deckName(d) { return d.name || t('untitled'); }
  function sizeCls(txt) { var L = Array.from(String(txt)).length; return L <= 18 ? 'xl' : L <= 50 ? 'l' : L <= 120 ? 'm' : 's'; }

  /* ================================================================ state */
  var decks = store.get('decks', null);
  decks = Array.isArray(decks) ? decks.map(normDeck).filter(Boolean) : [];
  if (!decks.length) {
    sampleSet(EDU.lang).forEach(function (s, i) { var d = makeSample(i, EDU.lang); if (d) decks.push(d); });
    if (!decks.length) decks.push(normDeck({ name: t('new_deck_name', { n: 1 }), cards: [] }));
  }
  var imgs = store.get('imgs', {});
  if (!imgs || typeof imgs !== 'object' || Array.isArray(imgs)) imgs = {};
  (function cleanImgs() {
    var used = {};
    decks.forEach(function (d) { d.cards.forEach(function (c) { c.img = c.img && typeof imgs[c.id] === 'string'; if (c.img) used[c.id] = 1; }); });
    Object.keys(imgs).forEach(function (k) { if (!used[k]) delete imgs[k]; });
  })();
  var curId = store.get('current', '');
  var settings = store.get('settings', {}) || {};
  settings = {
    size: SIZES.indexOf(settings.size) >= 0 ? settings.size : 20,
    reverse: !!settings.reverse,
    qcount: QCOUNTS.indexOf(settings.qcount) >= 0 ? settings.qcount : 10,
    pairs: PAIRS.indexOf(settings.pairs) >= 0 ? settings.pairs : 6
  };
  var streak = store.get('streak', null);
  if (!streak || typeof streak !== 'object') streak = { last: -9, n: 0 };
  var tab = store.get('tab', 'study');
  if (['study', 'quiz', 'match', 'edit'].indexOf(tab) < 0) tab = 'study';

  var study = null, quiz = null, match = null, matchTimer = null;
  var editId = null, pendingImg;          // pendingImg: undefined = unchanged, null = remove, string = new picture
  var pending = null;                     // deck waiting in the import preview
  var lastDeleted = null, undoTimer = null;

  function deck() {
    for (var i = 0; i < decks.length; i++) if (decks[i].id === curId) return decks[i];
    curId = decks[0].id;
    return decks[0];
  }
  function saveDecks() { store.set('decks', decks); store.set('current', curId); }
  function saveSettings() { store.set('settings', settings); }
  function saveImgs() {
    store.set('imgs', imgs);
    var back = store.get('imgs', {}) || {};
    if (Object.keys(back).length !== Object.keys(imgs).length) { toast('storage_full'); return false; }
    return true;
  }
  function imgTotal() { var s = 0; Object.keys(imgs).forEach(function (k) { s += String(imgs[k]).length; }); return s; }
  function bumpStreak() {
    var td = today();
    if (streak.last === td) return;
    streak = { last: td, n: streak.last === td - 1 ? streak.n + 1 : 1 };
    store.set('streak', streak);
  }
  function streakNow() { var td = today(); return streak.last === td || streak.last === td - 1 ? streak.n : 0; }
  function resetModes() {
    study = null; quiz = null; stopMatch(); match = null;
    editId = null; pendingImg = undefined;
  }

  /* ================================================================ deck bar */
  function renderDeckBar() {
    var sel = $('#deckSel'), td = today();
    sel.innerHTML = '';
    decks.forEach(function (d) {
      var due = d.cards.filter(function (c) { return c.due <= td; }).length;
      sel.appendChild(el('option', { value: d.id, text: deckName(d) + '  ·  📇 ' + num(d.cards.length) + (due ? '  ⏰ ' + num(due) : '') }));
    });
    var d = deck();
    sel.value = d.id;

    var st = $('#deckStats');
    st.innerHTML = '';
    [['📇', d.cards.length, 'stat_cards', 'statCards'], ['⏰', dueCards(d).length, 'stat_due', 'statDue'], ['🔥', streakNow(), 'stat_streak', 'statStreak']].forEach(function (s) {
      st.appendChild(el('div', { class: 'fc-stat' },
        el('b', { id: s[3] }, el('span', { class: 'fc-ic', 'aria-hidden': 'true', text: s[0] + ' ' }), num(s[1])),
        el('span', { text: t(s[2]) })));
    });

    var counts = [0, 0, 0, 0, 0, 0];
    d.cards.forEach(function (c) { counts[c.box]++; });
    var bx = $('#boxes');
    bx.innerHTML = '';
    for (var b = 1; b <= 5; b++) {
      var pct = d.cards.length ? Math.round(counts[b] / d.cards.length * 100) : 0;
      bx.appendChild(el('div', { class: 'fc-box b' + b, id: 'box' + b, title: t('box_n', { n: b }) + ' · ' + t(EVERY[b]) },
        el('div', { class: 'fc-box-n', text: num(counts[b]) }),
        el('div', { class: 'fc-box-l', text: t('box_n', { n: b }) }),
        el('div', { class: 'fc-box-e', text: t(EVERY[b]) }),
        el('div', { class: 'fc-box-bar', 'aria-hidden': 'true' }, el('span', { style: { width: pct + '%' } }))));
    }
  }

  /* ================================================================ tabs */
  var TABS = ['study', 'quiz', 'match', 'edit'];
  function setTab(name) {
    tab = name;
    store.set('tab', tab);
    renderTabs();
    if (tab === 'match' && !match) dealMatch();
    renderPanel(tab);
  }
  function renderTabs() {
    TABS.forEach(function (k) {
      var b = $('#tab-' + k), on = k === tab;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      $('#p-' + k).hidden = !on;
    });
  }
  function renderPanel(k) {
    if (k === 'study') renderStudy();
    else if (k === 'quiz') renderQuiz();
    else if (k === 'match') renderMatch();
    else renderEdit();
  }
  TABS.forEach(function (k, i) {
    var b = $('#tab-' + k);
    b.addEventListener('click', function () { setTab(k); });
    b.addEventListener('keydown', function (e) {
      var dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!dir) return;
      if (document.documentElement.dir === 'rtl') dir = -dir;
      var nk = TABS[(i + dir + TABS.length) % TABS.length];
      setTab(nk);
      $('#tab-' + nk).focus();
      e.preventDefault();
    });
  });

  function segPress(id, attr, value) {
    $$('#' + id + ' button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute(attr)) === String(value) ? 'true' : 'false'); });
  }

  /* ================================================================ study (Leitner) */
  function startStudy(mode, onlyIds) {
    var d = deck(), td = today(), pool;
    if (onlyIds) pool = d.cards.filter(function (c) { return onlyIds.indexOf(c.id) >= 0; });
    else if (mode === 'cram') pool = EDU.shuffle(d.cards);
    else pool = EDU.shuffle(d.cards.filter(function (c) { return c.due <= td; })).sort(function (a, b) { return (a.box - b.box) || (a.due - b.due); });
    if (!onlyIds && settings.size) pool = pool.slice(0, settings.size);
    pool = EDU.shuffle(pool);
    if (!pool.length) return;
    study = { deckId: d.id, queue: pool.map(function (c) { return c.id; }), total: pool.length, known: 0, first: {},
      cram: mode === 'cram' || !!onlyIds, flipped: false, up: 0, down: 0, done: false };
    renderStudy();
    scrollTo($('#studySession'));
    focus($('#card'));
  }
  function curStudyCard() {
    var d = deck();
    while (study && study.queue.length) {
      var c = cardById(d, study.queue[0]);
      if (c) return c;
      study.queue.shift(); study.total = Math.max(study.known, study.total - 1);
    }
    return null;
  }
  function faces(c) {
    var rev = settings.reverse;
    return {
      front: { label: t(rev ? 'back' : 'front'), text: rev ? c.b : c.f, img: !rev && c.img ? imgs[c.id] : null },
      back: { label: t(rev ? 'front' : 'back'), text: rev ? c.f : c.b, img: rev && c.img ? imgs[c.id] : null }
    };
  }
  function fillFace(face, f) {
    face.innerHTML = '';
    face.appendChild(el('span', { class: 'fc-side', text: f.label }));
    if (f.img) face.appendChild(el('img', { class: 'fc-img', src: f.img, alt: '' }));
    if (f.text) face.appendChild(el('span', { class: 'fc-text no-i18n ' + sizeCls(f.text), dir: 'auto', text: f.text }));
  }
  function updateFlip() {
    var on = !!(study && study.flipped);
    $('#card').classList.toggle('flipped', on);
    $('#faceFront').setAttribute('aria-hidden', on ? 'true' : 'false');
    $('#faceBack').setAttribute('aria-hidden', on ? 'false' : 'true');
    $('#rateRow').hidden = !on;
    $('#flipRow').hidden = on;
  }
  function flip() {
    if (!study || study.done) return;
    study.flipped = !study.flipped;
    updateFlip();
  }
  function rate(knew) {
    if (!study || study.done || !study.flipped) return;
    var c = curStudyCard();
    if (!c) return finishStudy();
    study.queue.shift();
    if (!(c.id in study.first)) {                 // the first answer decides the box
      study.first[c.id] = knew ? 1 : 0;
      if (!study.cram) {
        c.seen++;
        if (knew) { c.ok++; var nb = Math.min(5, c.box + 1); if (nb > c.box) study.up++; c.box = nb; c.due = today() + INTERVAL[nb]; }
        else { c.bad++; if (c.box > 1) study.down++; c.box = 1; c.due = today() + INTERVAL[1]; }
        saveDecks();
      }
      bumpStreak();
    }
    if (knew) study.known++;
    else study.queue.splice(Math.min(study.queue.length, 3), 0, c.id);   // see it again soon
    study.flipped = false;
    if (!study.queue.length) finishStudy();
    else { renderStudy(); focus($('#card')); }
    renderDeckBar();
  }
  function finishStudy() {
    if (!study) return;
    if (!Object.keys(study.first).length) { study = null; renderStudy(); return; }
    study.done = true;
    renderStudy();
    renderDeckBar();
    focus($('#studyDone'));
  }
  function renderStudy() {
    var d = deck(), due = dueCards(d).length, empty = !d.cards.length;
    $('#studyStart').hidden = !!study;
    $('#studySession').hidden = !study || study.done;
    $('#studySummary').hidden = !study || !study.done;
    if (!study) {
      $('#studyEmpty').hidden = !empty;
      $('#studyReady').hidden = empty;
      $('#dueCount').textContent = num(due);
      $('#startStudy').disabled = !due;
      $('#startStudy').hidden = !due;
      $('#allDone').hidden = !!due;
      var nd = nextDue(d);
      $('#nextDue').textContent = !due && nd !== null ? t('next_due', { when: whenText(nd) }) : '';
      $('#nextDue').hidden = !(!due && nd !== null);
      $('#cramBtn').classList.toggle('btn-primary', !due);
      $('#cramBtn').classList.toggle('btn-lg', !due);
      segPress('sizeSeg', 'data-v', settings.size);
      $('#reverseChk').checked = settings.reverse;
      return;
    }
    if (!study.done) {
      var c = curStudyCard();
      if (!c) { finishStudy(); return; }
      var fs = faces(c);
      fillFace($('#faceFront'), fs.front);
      fillFace($('#faceBack'), fs.back);
      $('#card').setAttribute('data-id', c.id);
      updateFlip();
      $('#sessCount').textContent = num(study.known) + ' / ' + num(study.total);
      var pct = Math.round(study.known / study.total * 100);
      $('#sessBar').style.width = pct + '%';
      $('#sessProg').setAttribute('aria-valuenow', String(pct));
      $('#sessProg').setAttribute('aria-label', t('progress_label'));
      $('#cramBadge').hidden = !study.cram;
      $('#boxInfo').textContent = study.cram ? '' : t('box_n', { n: c.box }) + ' · ' + t(EVERY[c.box]);
      return;
    }
    var ids = Object.keys(study.first), n = ids.length;
    var k = ids.filter(function (id) { return study.first[id]; }).length;
    $('#sumKnew').textContent = num(k);
    $('#sumAgain').textContent = num(n - k);
    $('#sumScore').textContent = num(n ? Math.round(k / n * 100) : 0) + '%';
    $('#sumMoved').textContent = study.cram ? t('cram_badge') : t('sum_moved', { up: num(study.up), down: num(study.down) });
    var nd2 = nextDue(d), left = dueCards(d).length;
    $('#sumNext').textContent = study.cram ? '' : left ? t('more_due', { n: num(left) }) : nd2 !== null ? t('next_due', { when: whenText(nd2) }) : '';
    $('#studyAgain').hidden = n - k === 0;
  }

  $('#card').addEventListener('click', flip);
  $('#flipBtn').addEventListener('click', function () { flip(); focus($('#card')); });
  $('#knewBtn').addEventListener('click', function () { rate(true); });
  $('#againBtn').addEventListener('click', function () { rate(false); });
  $('#endStudy').addEventListener('click', finishStudy);
  $('#startStudy').addEventListener('click', function () { startStudy('due'); });
  $('#cramBtn').addEventListener('click', function () { startStudy('cram'); });
  $('#goEdit').addEventListener('click', function () { setTab('edit'); focus($('#cardFront')); });
  $('#studyAgain').addEventListener('click', function () {
    var ids = Object.keys(study.first).filter(function (id) { return !study.first[id]; });
    startStudy('cram', ids);
  });
  $('#studyDone').addEventListener('click', function () { study = null; renderStudy(); focus($('#startStudy').hidden ? $('#cramBtn') : $('#startStudy')); });
  $('#speakBtn').addEventListener('click', function () {
    var c = curStudyCard();
    if (!c) return;
    var fs = faces(c);
    say(study.flipped ? fs.back.text : fs.front.text);
  });
  $('#fsStudy').addEventListener('click', function () { EDU.fullscreen($('#studySession')); });
  $('#sizeSeg').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-v]');
    if (!b) return;
    settings.size = parseInt(b.getAttribute('data-v'), 10) || 0;
    saveSettings(); renderStudy();
  });
  $('#reverseChk').addEventListener('change', function () { settings.reverse = this.checked; saveSettings(); });

  document.addEventListener('keydown', function (e) {
    if (tab !== 'study' || !study || study.done || $('#p-study').hidden) return;
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.edu-modal-back')) return;
    var tg = e.target;
    if (tg && tg.closest && tg.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (e.key === ' ' || e.key === 'Enter') {
      if (tg && tg.closest && tg.closest('button, a, summary')) return;   // the focused button handles it
      e.preventDefault(); flip();
    } else if (e.key === '1') { e.preventDefault(); rate(true); }
    else if (e.key === '2') { e.preventDefault(); rate(false); }
  });

  /* ================================================================ quiz */
  function quizSide(d) {
    if (d.side) return d.side;
    var lf = 0, lb = 0;
    d.cards.forEach(function (c) { lf += c.f.length; lb += c.b.length; });
    return lb > lf * 2 ? 'f' : 'b';
  }
  function startQuiz(onlyIds) {
    var d = deck(), side = quizSide(d);
    var pool = d.cards.filter(function (c) { return side === 'f' ? !!c.f : true; });
    if (onlyIds) pool = pool.filter(function (c) { return onlyIds.indexOf(c.id) >= 0; });
    pool = EDU.shuffle(pool);
    if (!onlyIds && settings.qcount) pool = pool.slice(0, settings.qcount);
    if (!pool.length) return;
    quiz = {
      deckId: d.id, side: side, i: 0, score: 0, state: 'ask', results: [],
      items: pool.map(function (c) { return { id: c.id, prompt: side === 'b' ? c.f : c.b, answer: side === 'b' ? c.b : c.f, img: side === 'b' && c.img ? c.id : null }; })
    };
    $('#quizInput').value = '';
    renderQuiz();
    scrollTo($('#quizRun'));
    focus($('#quizInput'));
  }
  function quizCheck(skip) {
    if (!quiz || quiz.state !== 'ask') return;
    var it = quiz.items[quiz.i], given = skip ? '' : $('#quizInput').value;
    if (!skip && !given.trim()) { focus($('#quizInput')); return; }
    var r = skip ? 0 : grade(given, it.answer);
    quiz.results.push({ id: it.id, prompt: it.prompt, img: it.img, answer: it.answer, given: given.trim(), ok: r > 0, skip: !!skip, grade: r });
    if (r > 0) quiz.score++;
    quiz.state = 'shown';
    renderQuiz();
    focus($('#quizNext'));
  }
  function quizNext() {
    if (!quiz || quiz.state !== 'shown') return;
    quiz.i++;
    $('#quizInput').value = '';
    if (quiz.i >= quiz.items.length) { quiz.state = 'done'; renderQuiz(); focus($('#quizNew')); return; }
    quiz.state = 'ask';
    renderQuiz();
    focus($('#quizInput'));
  }
  function renderQuiz() {
    var d = deck(), side = quizSide(d);
    $('#quizStart').hidden = !!quiz;
    $('#quizRun').hidden = !quiz || quiz.state === 'done';
    $('#quizResult').hidden = !quiz || quiz.state !== 'done';
    if (!quiz) {
      segPress('sideSeg', 'data-side', side);
      segPress('qcountSeg', 'data-v', settings.qcount);
      var can = d.cards.some(function (c) { return side === 'f' ? !!c.f : true; });
      $('#quizEmpty').hidden = can;
      $('#quizEmpty').textContent = t('need_cards', { n: num(1) });
      $('#startQuiz').disabled = !can;
      return;
    }
    if (quiz.state !== 'done') {
      var it = quiz.items[quiz.i], total = quiz.items.length;
      $('#quizCount').textContent = t('q_of', { n: num(quiz.i + 1), total: num(total) });
      $('#quizBar').style.width = Math.round(quiz.i / total * 100) + '%';
      $('#quizScore').textContent = t('score') + ': ' + num(quiz.score);
      var im = $('#quizImg');
      if (it.img && imgs[it.img]) { im.src = imgs[it.img]; im.hidden = false; } else { im.removeAttribute('src'); im.hidden = true; }
      var pr = $('#quizPrompt');
      pr.textContent = it.prompt;
      pr.className = 'fc-qprompt-t no-i18n ' + sizeCls(it.prompt);
      $('#quizAsk').textContent = t(quiz.side === 'b' ? 'type_back' : 'type_front');
      var shown = quiz.state === 'shown', res = shown ? quiz.results[quiz.results.length - 1] : null;
      $('#quizInput').disabled = shown;
      $('#askRow').hidden = shown;
      $('#nextRow').hidden = !shown;
      $('#quizOverride').hidden = !(res && !res.ok && !res.skip);
      var fb = $('#quizFeedback');
      fb.innerHTML = '';
      fb.className = '';
      if (res) {
        fb.className = 'callout ' + (res.ok ? 'success' : 'danger');
        fb.appendChild(el('strong', { text: res.ok ? (res.grade === 1 ? t('almost') : t('correct')) : (res.skip ? t('answer_label') : t('wrong')) }));
        if (!res.ok || res.grade === 1) {
          fb.appendChild(document.createTextNode(' '));
          if (!res.ok && !res.skip) fb.appendChild(el('span', { text: t('answer_label') + ' ' }));
          fb.appendChild(el('b', { class: 'no-i18n', dir: 'auto', text: res.answer }));
        }
      }
      return;
    }
    var n = quiz.results.length, k = quiz.results.filter(function (r) { return r.ok; }).length;
    $('#quizFinal').textContent = num(k) + ' / ' + num(n);
    var p = n ? k / n : 0;
    $('#quizMsg').textContent = t(p >= 0.9 ? 'msg_great' : p >= 0.6 ? 'msg_good' : 'msg_try');
    var rv = $('#quizReview');
    rv.innerHTML = '';
    var wrong = quiz.results.filter(function (r) { return !r.ok; });
    $('#reviewHead').hidden = !wrong.length;
    wrong.forEach(function (r) {
      rv.appendChild(el('li', { class: 'fc-review' },
        el('div', { class: 'fc-review-q no-i18n', dir: 'auto', text: r.prompt || '🖼' }),
        el('div', {}, el('span', { class: 'muted', text: t('answer_label') + ' ' }), el('b', { class: 'no-i18n ok', dir: 'auto', text: r.answer })),
        r.skip ? el('div', { class: 'muted small', text: t('skipped') }) :
          el('div', { class: 'small' }, el('span', { class: 'muted', text: t('you_wrote') + ' ' }), el('span', { class: 'no-i18n bad', dir: 'auto', text: r.given }))));
    });
    $('#quizRetry').hidden = !wrong.length;
  }
  $('#sideSeg').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-side]');
    if (!b) return;
    var d = deck();
    d.side = b.getAttribute('data-side');
    saveDecks(); renderQuiz();
  });
  $('#qcountSeg').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-v]');
    if (!b) return;
    settings.qcount = parseInt(b.getAttribute('data-v'), 10) || 0;
    saveSettings(); renderQuiz();
  });
  $('#startQuiz').addEventListener('click', function () { startQuiz(); });
  $('#quizCheck').addEventListener('click', function () { quizCheck(false); });
  $('#quizSkip').addEventListener('click', function () { quizCheck(true); });
  $('#quizInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); quizCheck(false); } });
  $('#quizNext').addEventListener('click', quizNext);
  $('#quizOverride').addEventListener('click', function () {
    var r = quiz && quiz.results[quiz.results.length - 1];
    if (!r || r.ok) return;
    r.ok = true; r.grade = 2; quiz.score++;
    renderQuiz();
    focus($('#quizNext'));
  });
  $('#quizEnd').addEventListener('click', function () {
    if (!quiz) return;
    if (!quiz.results.length) { quiz = null; renderQuiz(); return; }
    quiz.state = 'done'; renderQuiz();
  });
  $('#quizRetry').addEventListener('click', function () {
    var ids = quiz.results.filter(function (r) { return !r.ok; }).map(function (r) { return r.id; });
    startQuiz(ids);
  });
  $('#quizNew').addEventListener('click', function () { quiz = null; renderQuiz(); focus($('#startQuiz')); });
  $('#quizSpeak').addEventListener('click', function () { if (quiz && quiz.items[quiz.i]) say(quiz.items[quiz.i].prompt); });

  /* ================================================================ match game */
  function matchPool(d) {
    var seenF = {}, seenB = {}, pool = [];
    EDU.shuffle(d.cards).forEach(function (c) {
      var kf = norm(c.f) || (c.img ? 'img:' + c.id : ''), kb = norm(c.b) || c.b;
      if (!kf || seenF[kf] || seenB[kb]) return;
      seenF[kf] = 1; seenB[kb] = 1; pool.push(c);
    });
    return pool;
  }
  function stopMatch() { if (matchTimer) { clearInterval(matchTimer); matchTimer = null; } }
  function dealMatch() {
    stopMatch();
    var d = deck(), pool = matchPool(d).slice(0, settings.pairs);
    if (pool.length < 2) { match = null; return; }
    var tiles = [];
    pool.forEach(function (c, i) {
      tiles.push({ pair: i, side: 'f', text: c.f, img: c.img ? c.id : null });
      tiles.push({ pair: i, side: 'b', text: c.b, img: null });
    });
    match = { deckId: d.id, tiles: EDU.shuffle(tiles), pairs: pool.length, sel: -1, matched: 0, tries: 0, start: 0, end: 0, best: false };
  }
  function elapsed() { if (!match || !match.start) return 0; return Math.round(((match.end || Date.now()) - match.start) / 1000); }
  function tapTile(i) {
    var m = match;
    if (!m || m.end) return;
    var tile = m.tiles[i];
    if (!tile || tile.gone) return;
    if (!m.start) {
      m.start = Date.now();
      stopMatch();
      matchTimer = setInterval(function () { if (match && !match.end) $('#matchTime').textContent = '⏱ ' + t('time_s', { n: num(elapsed()) }); }, 500);
    }
    if (m.sel === -1) { m.sel = i; renderTiles(); return; }
    if (m.sel === i) { m.sel = -1; renderTiles(); return; }
    var a = m.tiles[m.sel];
    m.tries++;
    if (a.pair === tile.pair && a.side !== tile.side) {
      a.gone = tile.gone = true;
      m.matched++;
      m.sel = -1;
      if (m.matched === m.pairs) {
        m.end = Date.now();
        stopMatch();
        var d = deck(), s = Math.max(1, elapsed()), prev = d.best[m.pairs];
        if (!prev || s < prev) { d.best[m.pairs] = s; m.best = !!prev; saveDecks(); }
      }
    } else {
      var j = m.sel;
      m.sel = -1;
      m.wrong = [i, j];
      setTimeout(function () { if (match === m) { m.wrong = null; renderTiles(); } }, 650);
    }
    renderMatch();
  }
  function renderTiles() {
    var box = $('#tiles'), m = match;
    box.innerHTML = '';
    if (!m) return;
    m.tiles.forEach(function (tile, i) {
      var txt = tile.text || '', long = Array.from(txt).length > 40;
      var b = el('button', {
        type: 'button', class: 'fc-tile' + (long ? ' sm' : '') + (tile.gone ? ' gone' : '') + (m.wrong && m.wrong.indexOf(i) >= 0 ? ' bad' : ''),
        'aria-pressed': m.sel === i ? 'true' : 'false', disabled: tile.gone || !!m.end,
        dataset: { pair: String(tile.pair), side: tile.side, i: String(i) },
        onclick: function () { tapTile(i); }
      });
      if (tile.img && imgs[tile.img]) b.appendChild(el('img', { src: imgs[tile.img], alt: '' }));
      if (txt) b.appendChild(el('span', { class: 'no-i18n', dir: 'auto', text: txt }));
      box.appendChild(b);
    });
  }
  function renderMatch() {
    var d = deck(), can = matchPool(d).length >= 2;
    segPress('pairsSeg', 'data-v', settings.pairs);
    $('#matchEmpty').hidden = can;
    $('#matchEmpty').textContent = t('need_cards', { n: num(2) });
    $('#startMatch').disabled = !can;
    $('#matchStats').hidden = !can;
    if (can && !match) dealMatch();
    var m = match;
    $('#matchTime').textContent = '⏱ ' + t('time_s', { n: num(elapsed()) });
    $('#matchTries').textContent = t('tries_n', { n: num(m ? m.tries : 0) });
    var best = d.best[m ? m.pairs : settings.pairs];
    $('#matchBest').hidden = !best;
    $('#matchBest').textContent = best ? '🏆 ' + t('best_s', { n: num(best) }) : '';
    var done = !!(m && m.end);
    $('#matchDone').hidden = !done;
    if (done) {
      $('#matchDone').textContent = t('match_done', { s: num(elapsed()), n: num(m.tries) }) + (m.best ? ' ' + t('new_best') : '');
    }
    renderTiles();
  }
  $('#pairsSeg').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-v]');
    if (!b) return;
    settings.pairs = parseInt(b.getAttribute('data-v'), 10) || 6;
    saveSettings(); dealMatch(); renderMatch();
  });
  $('#startMatch').addEventListener('click', function () { dealMatch(); renderMatch(); });
  $('#fsMatch').addEventListener('click', function () { EDU.fullscreen($('#matchWrap')); });

  /* ================================================================ editor */
  function formImg() {
    if (typeof pendingImg === 'string') return pendingImg;
    if (pendingImg === null || !editId) return null;
    var c = cardById(deck(), editId);
    return c && c.img ? imgs[c.id] : null;
  }
  function clearForm() {
    editId = null; pendingImg = undefined;
    $('#cardFront').value = ''; $('#cardBack').value = '';
  }
  function renderForm() {
    var d = deck(), c = editId ? cardById(d, editId) : null;
    if (editId && !c) editId = null;
    $('#formTitle').textContent = editId ? t('edit_card_title', { n: num(d.cards.indexOf(c) + 1) }) : t('add_card_title');
    $('#addCardTxt').textContent = t(editId ? 'save_card' : 'add_card');
    $('#cancelEdit').hidden = !editId;
    var src = formImg(), pv = $('#cardImgPrev');
    if (src) { pv.src = src; pv.hidden = false; } else { pv.removeAttribute('src'); pv.hidden = true; }
    $('#cardImgDel').hidden = !src;
  }
  function addOrSave() {
    var d = deck(), f = str($('#cardFront').value), b = str($('#cardBack').value), hasImg = !!formImg();
    if (!b || (!f && !hasImg)) { toast('need_both'); focus(!f && !hasImg ? $('#cardFront') : $('#cardBack')); return; }
    var c;
    if (editId) {
      c = cardById(d, editId);
      if (!c) { clearForm(); renderEdit(); return; }
      c.f = f; c.b = b;
    } else {
      if (d.cards.length >= MAX_CARDS) { toast('deck_full', { n: num(MAX_CARDS) }); return; }
      c = newCard(f, b);
      d.cards.push(c);
    }
    if (pendingImg === null) { delete imgs[c.id]; c.img = false; saveImgs(); }
    else if (typeof pendingImg === 'string') { imgs[c.id] = pendingImg; c.img = true; if (!saveImgs()) { delete imgs[c.id]; c.img = false; } }
    toast(editId ? 'card_saved' : 'card_added');
    touch(d); saveDecks();
    clearForm();
    if (quiz && quiz.deckId === d.id && quiz.state !== 'done') quiz = null;
    match = null;
    renderDeckBar(); renderEdit();
    focus($('#cardFront'));
  }
  function startEdit(id) {
    var c = cardById(deck(), id);
    if (!c) return;
    editId = id; pendingImg = undefined;
    $('#cardFront').value = c.f; $('#cardBack').value = c.b;
    renderEdit();
    scrollTo($('#cardForm'));
    focus($('#cardFront'));
  }
  function deleteCard(id) {
    var d = deck(), i = -1;
    d.cards.forEach(function (c, k) { if (c.id === id) i = k; });
    if (i < 0) return;
    var c = d.cards.splice(i, 1)[0];
    lastDeleted = { deckId: d.id, card: c, index: i, img: imgs[c.id] || null };
    delete imgs[c.id];
    if (c.img) saveImgs();
    if (editId === id) clearForm();
    touch(d); saveDecks();
    match = null;
    $('#undoBar').hidden = false;
    clearTimeout(undoTimer);
    undoTimer = setTimeout(function () { $('#undoBar').hidden = true; lastDeleted = null; }, 8000);
    renderDeckBar(); renderEdit();
  }
  $('#undoBtn').addEventListener('click', function () {
    var u = lastDeleted;
    $('#undoBar').hidden = true;
    lastDeleted = null;
    if (!u) return;
    var d = null;
    decks.forEach(function (x) { if (x.id === u.deckId) d = x; });
    if (!d) return;
    d.cards.splice(Math.min(u.index, d.cards.length), 0, u.card);
    if (u.img) { imgs[u.card.id] = u.img; saveImgs(); }
    saveDecks(); match = null;
    renderDeckBar(); renderEdit();
  });

  function renderList() {
    var d = deck(), q = norm($('#cardSearch').value), list = $('#cardList');
    list.innerHTML = '';
    $('#cardsTitle').textContent = t('cards_title') + ' (' + num(d.cards.length) + ')';
    $('#cardSearch').hidden = d.cards.length < 6 && !q;
    var shown = 0;
    d.cards.forEach(function (c, i) {
      if (q && norm(c.f + ' ' + c.b).indexOf(q) < 0) return;
      shown++;
      var isNew = !c.seen && c.box === 1;
      list.appendChild(el('li', { class: 'fc-item' + (c.id === editId ? ' editing' : ''), dataset: { id: c.id } },
        el('span', { class: 'fc-num', 'aria-hidden': 'true', text: num(i + 1) }),
        el('div', { class: 'fc-item-main' },
          el('div', { class: 'fc-item-f' },
            c.img && imgs[c.id] ? el('img', { class: 'fc-thumb', src: imgs[c.id], alt: '' }) : null,
            c.f ? el('span', { class: 'no-i18n', dir: 'auto', text: c.f }) : null),
          el('div', { class: 'fc-item-b no-i18n', dir: 'auto', text: c.b })),
        el('div', { class: 'fc-item-side' },
          el('span', { class: 'badge bx' + c.box, text: isNew ? t('card_new') : t('card_box', { n: c.box, when: whenText(c.due) }) }),
          el('div', { class: 'fc-item-act' },
            el('button', { type: 'button', class: 'edu-iconbtn', 'data-act': 'say', 'aria-label': t('read_aloud'), title: t('read_aloud'), text: '🔊', onclick: function () { say(c.f || c.b); } }),
            el('button', { type: 'button', class: 'edu-iconbtn', 'data-act': 'edit', 'aria-label': t('edit'), title: t('edit'), text: '✎', onclick: function () { startEdit(c.id); } }),
            el('button', { type: 'button', class: 'edu-iconbtn fc-del', 'data-act': 'del', 'aria-label': t('delete'), title: t('delete'), text: '🗑', onclick: function () { deleteCard(c.id); } })))));
    });
    $('#listEmpty').hidden = shown > 0;
    $('#listEmpty').textContent = d.cards.length ? t('no_results') : t('list_empty');
  }
  function renderEdit() {
    var d = deck(), nameIn = $('#deckName');
    if (document.activeElement !== nameIn) nameIn.value = d.name;
    renderForm();
    renderList();
    updateBulkCount();
    if (!$('#shareBox').hidden) showShare();
  }

  $('#addCard').addEventListener('click', addOrSave);
  $('#cardFront').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); focus($('#cardBack')); } });
  $('#cardBack').addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addOrSave(); } });
  $('#cancelEdit').addEventListener('click', function () { clearForm(); renderEdit(); });
  $('#cardSearch').addEventListener('input', renderList);
  $('#deckName').addEventListener('input', function () {
    var d = deck();
    d.name = str(this.value, MAX_NAME);
    touch(d); saveDecks(); renderDeckBar();
  });
  $('#deckName').addEventListener('blur', function () { if (!deck().name) { deck().name = t('untitled'); this.value = deck().name; saveDecks(); renderDeckBar(); } });

  /* pictures: shrink on a canvas to a small JPEG so many fit on the device */
  function shrink(im) {
    var W = im.naturalWidth || 300, H = im.naturalHeight || 300, dims = [480, 360, 260, 200], qs = [0.8, 0.7, 0.6, 0.5];
    for (var i = 0; i < dims.length; i++) {
      var s = Math.min(1, dims[i] / Math.max(W, H)), w = Math.max(1, Math.round(W * s)), h = Math.max(1, Math.round(H * s));
      var cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      var x = cv.getContext('2d');
      x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h);
      x.drawImage(im, 0, 0, w, h);
      var data = cv.toDataURL('image/jpeg', qs[i]);
      if (data.length <= IMG_MAX) return data;
    }
    return null;
  }
  $('#cardImgBtn').addEventListener('click', function () {
    EDU.pickFile('image/*').then(function (file) {
      if (!file) return;
      if (file.size > 20e6 || !/^image\//.test(file.type || 'image/')) { toast('img_bad'); return; }
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var data = null;
        try { data = shrink(im); } catch (e) { data = null; }
        URL.revokeObjectURL(url);
        if (!data) { toast('img_bad'); return; }
        var old = editId && imgs[editId] ? imgs[editId].length : 0;
        if (imgTotal() - old + data.length > IMG_TOTAL) { toast('img_full'); return; }
        pendingImg = data;
        renderForm();
      };
      im.onerror = function () { URL.revokeObjectURL(url); toast('img_bad'); };
      im.src = url;
    });
  });
  $('#cardImgDel').addEventListener('click', function () { pendingImg = null; renderForm(); });

  /* bulk add: "front - back" or "front<TAB>back", one per line */
  var SEPS = ['\t', ' - ', ' – ', ' — ', ' = ', ' : ', ': '];
  function parseLines(text) {
    var cards = [], skipped = 0;
    String(text || '').split(/\r?\n/).forEach(function (line) {
      line = line.replace(/^\s*(\d{1,3}[.)]|[-*•])\s+/, '');
      if (!line.trim()) return;
      for (var i = 0; i < SEPS.length; i++) {
        var k = line.indexOf(SEPS[i]);
        if (k <= 0) continue;
        var f, b;
        if (SEPS[i] === '\t') { var parts = line.split('\t'); f = str(parts[0]); b = str(parts[1]); }
        else { f = str(line.slice(0, k)); b = str(line.slice(k + SEPS[i].length)); }
        if (f && b) { cards.push([f, b]); return; }
      }
      skipped++;
    });
    return { cards: cards, skipped: skipped };
  }
  function updateBulkCount() {
    var r = parseLines($('#bulkText').value), parts = [];
    if (r.cards.length) parts.push(t('bulk_found', { n: num(r.cards.length) }));
    if (r.skipped) parts.push(t('bulk_skipped', { n: num(r.skipped) }));
    $('#bulkCount').textContent = parts.join(' · ');
    $('#bulkAdd').disabled = !r.cards.length;
  }
  $('#bulkText').addEventListener('input', updateBulkCount);
  $('#bulkAdd').addEventListener('click', function () {
    var r = parseLines($('#bulkText').value), d = deck(), added = 0;
    r.cards.forEach(function (p) { if (d.cards.length < MAX_CARDS) { d.cards.push(newCard(p[0], p[1])); added++; } });
    if (!added) { toast(r.cards.length ? 'deck_full' : 'bad_file', { n: num(MAX_CARDS) }); return; }
    touch(d); saveDecks();
    $('#bulkText').value = '';
    match = null; quiz = null;
    toast('bulk_added', { n: num(added) });
    renderDeckBar(); renderEdit();
  });

  /* ================================================================ decks */
  $('#deckSel').addEventListener('change', function () {
    curId = this.value;
    store.set('current', curId);
    resetModes();
    $('#shareBox').hidden = true;
    renderAll();
  });
  $('#newDeck').addEventListener('click', function () {
    if (decks.length >= MAX_DECKS) { toast('too_many_decks', { n: num(MAX_DECKS) }); return; }
    var d = normDeck({ name: t('new_deck_name', { n: num(decks.length + 1) }), cards: [] });
    decks.push(d);
    curId = d.id;
    saveDecks(); resetModes();
    $('#shareBox').hidden = true;
    renderDeckBar();
    setTab('edit');
    var nm = $('#deckName');
    focus(nm);
    try { nm.select(); } catch (e) { }
  });
  $('#deleteDeck').addEventListener('click', function () {
    var d = deck();
    if (!confirm(t('confirm_delete', { name: deckName(d) }))) return;
    d.cards.forEach(function (c) { delete imgs[c.id]; });
    saveImgs();
    decks = decks.filter(function (x) { return x !== d; });
    if (!decks.length) decks.push(normDeck({ name: t('new_deck_name', { n: num(1) }), cards: [] }));
    curId = decks[0].id;
    saveDecks(); resetModes();
    $('#shareBox').hidden = true;
    toast('deck_deleted');
    renderAll();
  });
  $('#resetProgress').addEventListener('click', function () {
    var d = deck();
    if (!confirm(t('confirm_progress'))) return;
    var td = today();
    d.cards.forEach(function (c) { c.box = 1; c.due = td; c.seen = 0; c.ok = 0; c.bad = 0; });
    d.best = {};
    saveDecks(); resetModes();
    toast('progress_reset');
    renderAll();
  });
  $('#addSamples').addEventListener('click', function () {
    var have = {}, added = 0;
    decks.forEach(function (d) { if (d.sample) have[d.sample.i] = 1; });
    sampleSet(EDU.lang).forEach(function (s, i) {
      if (have[i] || decks.length >= MAX_DECKS) return;
      var d = makeSample(i, EDU.lang);
      if (d) { decks.push(d); added++; }
    });
    if (!added) { toast('samples_present'); return; }
    saveDecks();
    toast('samples_added', { n: num(added) });
    renderDeckBar();
  });

  /* ================================================================ share / import / export */
  function shareUrl() {
    var d = deck();
    var data = { v: 1, n: d.name, c: d.cards.filter(function (c) { return c.f; }).map(function (c) { return [c.f, c.b]; }) };
    var base = location.href.split('#')[0];
    try { var u = new URL(base); u.searchParams.set('lang', EDU.lang); base = u.toString(); } catch (e) { }
    return base + '#deck=' + EDU.pack(data);
  }
  function showShare() {
    var d = deck(), url = shareUrl();
    $('#shareBox').hidden = false;
    $('#shareUrl').value = url;
    $('#waLink').href = 'https://wa.me/?text=' + encodeURIComponent(deckName(d) + '\n' + url);
    $('#nativeShare').hidden = !navigator.share;
    var notes = $('#shareNotes');
    notes.innerHTML = '';
    notes.appendChild(el('li', { text: t('link_ready') }));
    if (location.protocol === 'file:') notes.appendChild(el('li', { class: 'bad', text: t('link_file') }));
    if (url.length > 6000) notes.appendChild(el('li', { class: 'bad', text: t('link_long') }));
    if (d.cards.some(function (c) { return c.img; })) notes.appendChild(el('li', { text: t('no_img_note') }));
  }
  $('#shareBtn').addEventListener('click', function () {
    if (!deck().cards.length) { toast('need_cards', { n: num(1) }); return; }
    showShare();
    var u = $('#shareUrl');
    focus(u);
    try { u.select(); } catch (e) { }
  });
  $('#copyShare').addEventListener('click', function () { EDU.copy($('#shareUrl').value); });
  $('#nativeShare').addEventListener('click', function () { EDU.share($('#shareUrl').value, deckName(deck())); });
  function fileName(d) { return (d.name || 'flashcards').replace(/[\\\/:*?"<>|#%]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'flashcards'; }
  $('#exportCsv').addEventListener('click', function () {
    var d = deck();
    if (!d.cards.length) { toast('need_cards', { n: num(1) }); return; }
    var rows = [['front', 'back']].concat(d.cards.map(function (c) { return [c.f, c.b]; }));
    EDU.download(fileName(d) + '.csv', EDU.csv.stringify(rows), 'text/csv');
  });
  function isHeader(f, b) {
    var F = norm(f), B = norm(b);
    return ['front', 'question', 'term', 'word', 'q', 'side 1', norm(t('front'))].indexOf(F) >= 0 &&
      ['back', 'answer', 'definition', 'meaning', 'a', 'side 2', norm(t('back'))].indexOf(B) >= 0;
  }
  function parseTable(text) {
    text = String(text || '').replace(/^﻿/, '');
    var first = text.split(/\r?\n/)[0] || '', rows;
    if (first.indexOf('\t') >= 0) rows = text.split(/\r?\n/).map(function (l) { return l.split('\t'); });
    else if (first.indexOf(',') >= 0 || first.indexOf('"') >= 0) rows = EDU.csv.parse(text);
    else if (first.indexOf(';') >= 0) rows = text.split(/\r?\n/).map(function (l) { return l.split(';'); });
    else return parseLines(text).cards.slice(0, MAX_CARDS);
    var out = [];
    rows.forEach(function (r, i) {
      var f = str(r[0]), b = str(r[1]);
      if (!f || !b) return;
      if (i === 0 && isHeader(f, b)) return;
      out.push([f, b]);
    });
    return out.slice(0, MAX_CARDS);
  }
  function restoreBackup(obj) {
    var list = obj && Array.isArray(obj.decks) ? obj.decks : Array.isArray(obj) ? obj : null;
    if (!list || !list.length) { toast('bad_file'); return; }
    list = list.filter(function (x) { return x && typeof x === 'object'; }).slice(0, Math.max(0, MAX_DECKS - decks.length));
    if (!list.length) { toast('too_many_decks', { n: num(MAX_DECKS) }); return; }
    if (!confirm(t('restore_q', { n: num(list.length) }))) return;
    var budget = IMG_TOTAL - imgTotal(), added = 0, firstId = null;
    list.forEach(function (raw) {
      var cards = [];
      (Array.isArray(raw.cards) ? raw.cards : []).forEach(function (rc) {
        if (!rc || typeof rc !== 'object' || cards.length >= MAX_CARDS) return;
        var pic = typeof rc.image === 'string' && /^data:image\/(jpeg|png|webp|gif);base64,/.test(rc.image) && rc.image.length <= IMG_MAX * 2 && rc.image.length <= budget ? rc.image : null;
        var c = normCard(Object.assign({}, rc, { id: uid(), img: !!pic }));
        if (!c) return;
        if (pic) { imgs[c.id] = pic; budget -= pic.length; }
        cards.push(c);
      });
      var d = normDeck({ name: raw.name, cards: [], side: raw.side, best: raw.best });
      d.cards = cards;
      if (!d.name) d.name = t('untitled');
      decks.push(d); added++;
      if (!firstId) firstId = d.id;
    });
    if (firstId) curId = firstId;
    saveImgs(); saveDecks(); resetModes();
    toast('restored', { n: num(added) });
    renderAll();
  }
  $('#importBtn').addEventListener('click', function () {
    EDU.pickFile('.csv,.tsv,.txt,.json,text/csv,text/plain,application/json').then(function (file) {
      if (!file) return;
      if (file.size > 10e6) { toast('bad_file'); return; }
      EDU.readText(file).then(function (text) {
        if (/^\s*[\[{]/.test(text.replace(/^﻿/, ''))) {
          var obj = null;
          try { obj = JSON.parse(text.replace(/^﻿/, '')); } catch (e) { obj = null; }
          restoreBackup(obj);
          return;
        }
        var cards = parseTable(text);
        if (!cards.length) { toast('bad_file'); return; }
        showImport({ name: str(String(file.name || '').replace(/\.[^.]+$/, '').replace(/[_]+/g, ' '), MAX_NAME), cards: cards.map(function (p) { return { f: p[0], b: p[1] }; }) });
      }, function () { toast('bad_file'); });
    });
  });
  $('#backupBtn').addEventListener('click', function () {
    var data = { app: SLUG, v: 1, saved: new Date().toISOString(), decks: decks.map(function (d) {
      return { name: d.name, side: d.side, best: d.best, cards: d.cards.map(function (c) {
        var o = { f: c.f, b: c.b, box: c.box, due: c.due, seen: c.seen, ok: c.ok, bad: c.bad };
        if (c.img && imgs[c.id]) o.image = imgs[c.id];
        return o;
      }) };
    }) };
    EDU.download('flashcards-backup.json', JSON.stringify(data), 'application/json');
  });

  /* the import preview (from a share link or a CSV file) */
  function sameDeck(d, p) {
    return d.name === p.name && d.cards.length === p.cards.length &&
      d.cards.every(function (c, i) { return c.f === p.cards[i].f && c.b === p.cards[i].b; });
  }
  function showImport(p) {
    pending = p;
    $('#badLink').hidden = true;
    renderImport();
    $('#importPreview').hidden = false;
    scrollTo($('#importPreview'));
    focus($('#importSave'));
  }
  function renderImport() {
    var p = pending, box = $('#importPreview');
    if (!p) { box.hidden = true; return; }
    $('#impName').textContent = p.name || t('untitled');
    $('#impCount').textContent = t('import_count', { n: num(p.cards.length) });
    var dup = decks.filter(function (d) { return sameDeck(d, p); })[0];
    $('#impDup').hidden = !dup;
    $('#openCopy').onclick = dup ? function () { closeImport(); curId = dup.id; saveDecks(); resetModes(); renderAll(); setTab('study'); } : null;
    var tb = $('#impTable');
    tb.innerHTML = '';
    tb.appendChild(el('thead', {}, el('tr', {}, el('th', { text: '#' }), el('th', { text: t('front') }), el('th', { text: t('back') }))));
    var body = el('tbody', {});
    p.cards.slice(0, 8).forEach(function (c, i) {
      body.appendChild(el('tr', {}, el('td', { text: num(i + 1) }), el('td', { class: 'no-i18n', dir: 'auto', text: c.f }), el('td', { class: 'no-i18n', dir: 'auto', text: c.b })));
    });
    tb.appendChild(body);
    $('#impMore').textContent = p.cards.length > 8 ? t('import_more', { n: num(p.cards.length - 8) }) : '';
    $('#importMerge').disabled = deck().cards.length >= MAX_CARDS;
  }
  function closeImport() {
    pending = null;
    $('#importPreview').hidden = true;
    if (/^#deck=/.test(location.hash || '')) {
      try { history.replaceState(history.state, '', location.href.split('#')[0]); } catch (e) { location.hash = ''; }
    }
  }
  $('#importSave').addEventListener('click', function () {
    var p = pending;
    if (!p) return;
    if (decks.length >= MAX_DECKS) { toast('too_many_decks', { n: num(MAX_DECKS) }); return; }
    var d = normDeck({ name: p.name || t('untitled'), cards: p.cards.map(function (c) { return { f: c.f, b: c.b }; }) });
    decks.push(d);
    curId = d.id;
    closeImport(); saveDecks(); resetModes();
    toast('import_saved');
    renderAll(); setTab('study');
  });
  $('#importMerge').addEventListener('click', function () {
    var p = pending, d = deck(), added = 0;
    if (!p) return;
    p.cards.forEach(function (c) { if (d.cards.length < MAX_CARDS) { d.cards.push(newCard(c.f, c.b)); added++; } });
    touch(d);
    closeImport(); saveDecks(); resetModes();
    toast('bulk_added', { n: num(added) });
    renderAll(); setTab('study');
  });
  $('#importCancel').addEventListener('click', function () { closeImport(); });
  function readHash() {
    var m = (location.hash || '').match(/^#deck=([A-Za-z0-9_\-]+)/);
    if (!m) return;
    var data = EDU.unpack(m[1]);
    var cards = data && Array.isArray(data.c) ? data.c.map(function (p) {
      return Array.isArray(p) ? { f: str(p[0]), b: str(p[1]) } : null;
    }).filter(function (c) { return c && c.f && c.b; }).slice(0, MAX_CARDS) : [];
    if (!cards.length) {
      $('#badLink').hidden = false;
      closeImport();
      return;
    }
    $('#badLink').hidden = true;
    showImport({ name: str(data.n, MAX_NAME), cards: cards });
  }
  window.addEventListener('hashchange', readHash);

  /* ================================================================ print */
  $('#printBtn').addEventListener('click', function () {
    var d = deck(), pa = $('#printArea');
    if (!d.cards.length) { toast('need_cards', { n: num(1) }); return; }
    pa.innerHTML = '';
    pa.appendChild(el('h1', { class: 'no-i18n', text: deckName(d) }));
    pa.appendChild(el('div', { class: 'pr-lines' },
      el('span', { text: t('print_name') + ': ______________________' }),
      el('span', { text: t('print_class') + ': ________' }),
      el('span', { text: t('print_date') + ': ____________' })));
    pa.appendChild(el('p', { class: 'pr-tip', text: '✂ ' + t('print_tip') }));
    var tb = el('table', { class: 'pr-table' },
      el('thead', {}, el('tr', {}, el('th', { class: 'pr-n', text: '#' }), el('th', { text: t('front') }), el('th', { class: 'pr-b', text: t('back') }))));
    var body = el('tbody', {});
    d.cards.forEach(function (c, i) {
      body.appendChild(el('tr', {},
        el('td', { class: 'pr-n', text: num(i + 1) }),
        el('td', { class: 'pr-f' }, c.img && imgs[c.id] ? el('img', { src: imgs[c.id], alt: '' }) : null, c.f ? el('span', { dir: 'auto', text: c.f }) : null),
        el('td', { class: 'pr-b', dir: 'auto', text: c.b })));
    });
    tb.appendChild(body);
    pa.appendChild(tb);
    setTimeout(function () { window.print(); }, 60);
  });

  /* ================================================================ all */
  function renderAll() {
    renderDeckBar();
    renderTabs();
    renderStudy();
    renderQuiz();
    if (tab === 'match' && !match) dealMatch();
    renderMatch();
    renderEdit();
    renderImport();
  }
  EDU.onLang(function () { relocalize(); renderAll(); });

  relocalize();
  saveDecks();
  renderAll();
  readHash();
})();
