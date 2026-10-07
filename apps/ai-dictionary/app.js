/* AI Dictionary: 120 AI / ML / GenAI terms in 12 languages. Term of the day, search in any script,
   topic + A–Z filters, detail panel with related terms, read aloud, WhatsApp share (?term= deep link),
   flashcards, meaning → term quiz, printable glossary. Everything stays on the device (EDU.store). */
(function () {
  'use strict';
  var SLUG = 'ai-dictionary';
  var TERMS = window.AID_TERMS || [];
  var BYID = {};
  TERMS.forEach(function (x) { BYID[x.id] = x; });
  var N = TERMS.length;
  var TOPICS = ['basics', 'ml', 'genai', 'safety', 'careers'];
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$;
  var WA_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2.2a9.8 9.8 0 0 0-8.5 14.7L2.2 21.8l5-1.3A9.8 9.8 0 1 0 12 2.2zm0 1.8a8 8 0 1 1-4.1 14.9l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 0 1 12 4z"/><path fill="currentColor" d="M8.7 7.3c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-.9.9-.9 2.2s1 2.6 1.1 2.8c.1.2 1.9 3 4.7 4.1 2.3.9 2.8.7 3.3.7.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3l-1.9-.9c-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.4.1-.6l.4-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.2z"/></svg>';

  /* ---------------- content helpers ---------------- */
  function C() { var A = window.APP_CONTENT || {}; return A[EDU.lang] || A.en || { tips: [], terms: {} }; }
  function tx(id) { var v = (C().terms || {})[id] || ((window.APP_CONTENT || {}).en || { terms: {} }).terms[id] || ['', '', '', '']; return { local: v[0], short: v[1], long: v[2], example: v[3] }; }
  function topicName(tp) { return t('topic_' + tp); }
  function sorted() { return TERMS.slice().sort(function (a, b) { return a.term.localeCompare(b.term, 'en'); }); }
  var SORTED = sorted();
  function letterOf(x) { return x.term.charAt(0).toUpperCase(); }

  /* term of the day: deterministic from the local date, 37 is coprime with 120 so every term gets a day */
  function dayNumber() { var d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); }
  function todId() { return TERMS[(dayNumber() * 37) % N].id; }
  function todayKey() { return String(dayNumber()); }
  function dateLabel() {
    var tag = EDU.langInfo(EDU.lang).tag;
    try { return new Intl.DateTimeFormat(tag + '-u-nu-latn', { day: 'numeric', month: 'long' }).format(new Date()); }
    catch (e) { return new Date().toLocaleDateString(); }
  }

  /* ---------------- state ---------------- */
  function defaults() { return { tab: 'dict', sel: todId(), topic: '', letter: '', qmode: 'm2t', qtopic: '', fcTopic: '', best: {}, known: [] }; }
  var S = defaults();
  (function load() {
    var tab = store.get('tab', S.tab); if (['dict', 'cards', 'quiz'].indexOf(tab) >= 0) S.tab = tab;
    /* the saved term is kept within the same day; on a new day the app opens on the new term of the day */
    var sel = store.get('sel', ''), when = store.get('selDate', '');
    if (BYID[sel] && when === todayKey()) S.sel = sel;
    var tp = store.get('topic', ''); if (tp === '' || TOPICS.indexOf(tp) >= 0) S.topic = tp;
    var qm = store.get('qmode', S.qmode); if (qm === 'm2t' || qm === 't2m') S.qmode = qm;
    var qt = store.get('qtopic', ''); if (qt === '' || TOPICS.indexOf(qt) >= 0) S.qtopic = qt;
    var ft = store.get('fcTopic', ''); if (ft === '' || TOPICS.indexOf(ft) >= 0) S.fcTopic = ft;
    var b = store.get('best', {}); if (b && typeof b === 'object') S.best = b;
    var k = store.get('known', []); if (Array.isArray(k)) S.known = k.filter(function (id) { return BYID[id]; });
    /* deep link: ?term=<id> (from a WhatsApp share) */
    try {
      var u = new URL(location.href), q = u.searchParams.get('term');
      if (q !== null) {
        if (BYID[q]) { S.sel = q; S.tab = 'dict'; store.set('sel', q); store.set('selDate', todayKey()); }
        /* consume the link once, so a later reload shows what the user picked, not the shared term again */
        u.searchParams.delete('term'); history.replaceState(history.state, '', u.toString());
      }
    } catch (e) { }
  })();
  var query = '';

  EDU.init({ slug: SLUG, title: 'app_title' });

  /* ---------------- tabs ---------------- */
  function showTab(name) {
    S.tab = name; store.set('tab', name);
    $$('#tabs [role="tab"]').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.tab === name)); b.tabIndex = b.dataset.tab === name ? 0 : -1; });
    $('#p-dict').hidden = name !== 'dict';
    $('#p-cards').hidden = name !== 'cards';
    $('#p-quiz').hidden = name !== 'quiz';
    if (name === 'quiz' && !Q.cur && !Q.done) newRound();
    if (name === 'cards' && !FC.queue.length && !FC.done) startCards(null);
  }
  $$('#tabs [role="tab"]').forEach(function (b) {
    b.addEventListener('click', function () { showTab(b.dataset.tab); });
    b.addEventListener('keydown', function (ev) {
      var tabs = $$('#tabs [role="tab"]'), i = tabs.indexOf(b);
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') {
        var dir = (ev.key === 'ArrowRight') === (document.documentElement.dir !== 'rtl') ? 1 : -1;
        var nb = tabs[(i + dir + tabs.length) % tabs.length]; nb.focus(); showTab(nb.dataset.tab); ev.preventDefault();
      }
    });
  });

  /* ---------------- search (any script) ---------------- */
  /* forgive the spelling variants people really type: chandrabindu = anusvara, nukta or not, ॉ = ा, Arabic vs Urdu letter forms, accents, ZWJ */
  var NORM_MAP = { 'ँ': 'ं', 'ঁ': 'ং', 'ਁ': 'ਂ', 'ੰ': 'ਂ', 'ઁ': 'ં', 'ଁ': 'ଂ',
    'ॉ': 'ा', 'ॅ': 'े', 'ऑ': 'आ', 'ऍ': 'ए', 'ॲ': 'आ',
    'ૉ': 'ા', 'ૅ': 'ે', 'ઑ': 'આ', 'ઍ': 'એ',
    'ي': 'ی', 'ى': 'ی', 'ك': 'ک', 'ه': 'ہ', 'ة': 'ہ' };
  var NORM_RE = /[ँঁਁੰઁଁॉॅऑऍॲૉૅઑઍيىكهة]/g;
  var STRIP_RE = /[​-‍⁠﻿̀-ًͯ-़়਼઼଼಼ْٰ]/g;
  function norm(s) {
    s = String(s == null ? '' : s).toLowerCase();
    try { s = s.normalize('NFD'); } catch (e) { }
    return s.replace(STRIP_RE, '').replace(NORM_RE, function (c) { return NORM_MAP[c]; }).replace(/[’']/g, '').replace(/\s+/g, ' ').trim();
  }
  var index = null, indexLang = '';
  function getIndex() {
    if (index && indexLang === EDU.lang) return index;
    indexLang = EDU.lang;
    index = TERMS.map(function (x) {
      var c = tx(x.id);
      return { x: x, term: norm(x.term), id: x.id.replace(/-/g, ' '), local: norm(c.local), short: norm(c.short), long: norm(c.long) };
    });
    return index;
  }
  function score(it, q) {
    var s = 0;
    if (it.term === q || it.local === q || it.id === q) return 100;
    if (it.term.indexOf(q) === 0 || it.local.indexOf(q) === 0) s = 90;
    else if (it.term.indexOf(' ' + q) >= 0 || it.term.indexOf('(' + q) >= 0 || it.local.indexOf(' ' + q) >= 0 || it.id.indexOf(q) === 0) s = 80;
    else if (q.length >= 2 && (it.term.indexOf(q) >= 0 || it.local.indexOf(q) >= 0 || it.id.indexOf(q) >= 0)) s = 60;
    else if (q.length >= 3 && it.short.indexOf(q) >= 0) s = 30;
    else if (q.length >= 4 && it.long.indexOf(q) >= 0) s = 15;
    return s;
  }
  function searchMatches(q) {
    q = norm(q);
    if (!q) return null;
    var res = [];
    getIndex().forEach(function (it) { var s = score(it, q); if (s) res.push({ x: it.x, score: s }); });
    res.sort(function (a, b) { return b.score - a.score || a.x.term.localeCompare(b.x.term, 'en'); });
    return res;
  }

  /* ---------------- filters + list ---------------- */
  function visibleTerms() {
    var m = searchMatches(query);
    var list = m ? m.map(function (r) { return r.x; }) : SORTED;
    return list.filter(function (x) { return (!S.topic || x.topic === S.topic) && (!S.letter || letterOf(x) === S.letter); });
  }
  function renderChips() {
    var box = $('#topic-chips'); box.innerHTML = '';
    [''].concat(TOPICS).forEach(function (tp) {
      var b = el('button', { type: 'button', class: 'chip' + (tp ? ' tp-' + tp : ''), 'aria-pressed': String(S.topic === tp), dataset: { topic: tp } },
        tp ? el('span', { class: 'dot', 'aria-hidden': 'true' }) : null, el('span', { text: tp ? topicName(tp) : t('topic_all') }));
      b.addEventListener('click', function () { S.topic = tp; store.set('topic', tp); renderChips(); renderAZ(); renderList(); });
      box.appendChild(b);
    });
  }
  function renderAZ() {
    var box = $('#az'); box.innerHTML = '';
    var present = {};
    SORTED.forEach(function (x) { if (!S.topic || x.topic === S.topic) present[letterOf(x)] = 1; });
    if (S.letter && !present[S.letter]) S.letter = '';
    var all = el('button', { type: 'button', class: 'az-all', 'aria-pressed': String(S.letter === ''), text: t('az_all') });
    all.addEventListener('click', function () { S.letter = ''; renderAZ(); renderList(); });
    box.appendChild(all);
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(function (L) {
      var b = el('button', { type: 'button', text: L, lang: 'en', 'aria-pressed': String(S.letter === L), 'aria-label': t('letter_aria', { l: L }), disabled: !present[L] });
      b.addEventListener('click', function () { S.letter = S.letter === L ? '' : L; renderAZ(); renderList(); });
      box.appendChild(b);
    });
  }
  function renderList() {
    var ul = $('#list'); ul.innerHTML = '';
    var items = visibleTerms();
    $('#ad-status').textContent = items.length ? t('n_terms', { n: EDU.fmt(items.length) }) : t('no_match');
    if (!items.length) { ul.appendChild(el('li', { class: 'ad-empty', text: t('no_match') })); return; }
    var hasSel = items.some(function (x) { return x.id === S.sel; });
    items.forEach(function (x, i) {
      var c = tx(x.id);
      var b = el('button', { type: 'button', class: 'ad-item tp-' + x.topic, dataset: { id: x.id }, 'aria-label': t('item_aria', { term: x.term, topic: topicName(x.topic) }) },
        el('span', { class: 'ad-item-main' },
          el('span', { class: 'ad-item-term no-i18n ltr', lang: 'en', text: x.term }),
          c.local && c.local !== x.term ? el('span', { class: 'ad-item-local', text: c.local }) : null,
          el('span', { class: 'ad-item-short', text: c.short })));
      var on = x.id === S.sel;
      if (on) b.setAttribute('aria-current', 'true');
      b.tabIndex = on || (!hasSel && i === 0) ? 0 : -1;
      b.addEventListener('click', function () { select(x.id, { scroll: true }); });
      ul.appendChild(el('li', {}, b));
    });
  }
  $('#list').addEventListener('keydown', function (ev) {
    var b = ev.target.closest('.ad-item'); if (!b) return;
    var items = $$('#list .ad-item'), i = items.indexOf(b), n = null;
    if (ev.key === 'ArrowDown') n = items[Math.min(i + 1, items.length - 1)];
    else if (ev.key === 'ArrowUp') n = items[Math.max(i - 1, 0)];
    else if (ev.key === 'Home') n = items[0];
    else if (ev.key === 'End') n = items[items.length - 1];
    else return;
    ev.preventDefault();
    if (n) { select(n.dataset.id); n.focus(); }
  });
  function markList() {
    $$('#list .ad-item').forEach(function (b) {
      var on = b.dataset.id === S.sel;
      if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      b.tabIndex = on ? 0 : -1;
    });
  }
  function isNarrow() { return window.matchMedia && matchMedia('(max-width: 899px)').matches; }

  var search = $('#ad-search');
  search.addEventListener('input', function () {
    query = search.value;
    renderList();
    var m = searchMatches(query);
    if (m && m.length && m[0].score >= 90 && m[0].x.id !== S.sel) select(m[0].x.id);
  });
  search.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Enter') return;
    ev.preventDefault();
    var items = visibleTerms();
    if (items.length) select(items[0].id, { scroll: true });
  });

  /* ---------------- selection + detail ---------------- */
  function select(id, opts) {
    if (!BYID[id]) return;
    opts = opts || {};
    S.sel = id; store.set('sel', id); store.set('selDate', todayKey());
    markList(); renderDetail();
    var b = $('#list .ad-item[data-id="' + id + '"]');
    if (b && !opts.scroll) { try { b.scrollIntoView({ block: 'nearest' }); } catch (e) { } }
    if (opts.scroll && isNarrow()) $('#detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function shareUrl(id) {
    var base = EDU.shareUrl();
    return base + (base.indexOf('?') >= 0 ? '&' : '?') + 'term=' + encodeURIComponent(id);
  }
  function shareText(x) { var c = tx(x.id); return t('share_text', { term: x.term + (c.local && c.local !== x.term ? ' (' + c.local + ')' : ''), meaning: c.short, url: shareUrl(x.id) }); }
  function speakTerm(x) {
    var c = tx(x.id);
    var text = x.term + '. ' + c.short;
    EDU.speak(text, { rate: 0.95 }).then(function (ok) {
      if (ok) return;
      /* no voice for this language: at least say the English term */
      if (EDU.lang !== 'en') return EDU.speak(x.term, { lang: 'en', rate: 0.9 }).then(function (ok2) { EDU.toast(t('no_voice')); return ok2; });
      EDU.toast(t('no_voice'));
    });
  }
  function termChip(id, extraClass) {
    var x = BYID[id], c = tx(id);
    var b = el('button', { type: 'button', class: 'chip tp-' + x.topic + (extraClass ? ' ' + extraClass : ''), dataset: { id: id } },
      el('span', { class: 'en no-i18n ltr', lang: 'en', text: x.term.replace(/\s*\(.*\)$/, '') }),
      c.local && c.local !== x.term ? el('span', { class: 'lc', text: '· ' + c.local }) : null);
    b.addEventListener('click', function () { select(id, { scroll: true }); });
    return b;
  }
  function renderDetail() {
    var x = BYID[S.sel] || TERMS[0], c = tx(x.id), box = $('#detail');
    var idx = SORTED.indexOf(x);
    box.innerHTML = '';
    var isTod = x.id === todId();
    var badges = el('div', { class: 'ad-badges' },
      el('span', { class: 'badge tp tp-' + x.topic, text: topicName(x.topic) }),
      isTod ? el('span', { class: 'badge accent', id: 'd-tod', text: '⭐ ' + t('tod_date', { date: dateLabel() }) }) : null);
    var speak = el('button', { type: 'button', class: 'btn', id: 'd-speak', 'aria-label': t('read_aloud'), title: t('read_aloud'), text: '🔊' });
    speak.addEventListener('click', function () { speakTerm(x); });
    var prev = el('button', { type: 'button', class: 'btn', id: 'd-prev', text: t('previous'), disabled: idx <= 0 });
    var next = el('button', { type: 'button', class: 'btn', id: 'd-next', text: t('next'), disabled: idx >= SORTED.length - 1 });
    prev.addEventListener('click', function () { select(SORTED[idx - 1].id); });
    next.addEventListener('click', function () { select(SORTED[idx + 1].id); });
    box.appendChild(el('div', { class: 'ad-dhead' },
      el('div', { class: 'grow' }, badges,
        el('h2', { class: 'ad-term no-i18n ltr', id: 'd-term', lang: 'en', text: x.term }),
        c.local && c.local !== x.term ? el('p', { class: 'ad-local', id: 'd-local', text: c.local }) : null),
      el('div', { class: 'row ad-dnav no-print' }, speak, prev, next)));
    box.appendChild(el('p', { class: 'ad-short', id: 'd-short', text: c.short }));
    box.appendChild(el('h3', { text: t('explain_label') }));
    box.appendChild(el('p', { class: 'ad-long', id: 'd-long', text: c.long }));
    box.appendChild(el('div', { class: 'callout accent ad-example' }, el('strong', { text: t('example_label') }), el('p', { id: 'd-example', text: c.example })));
    if (x.related.length) {
      box.appendChild(el('h3', { text: t('related_label') }));
      var rel = el('div', { class: 'ad-related', id: 'd-related' });
      x.related.forEach(function (id) { if (BYID[id]) rel.appendChild(termChip(id)); });
      box.appendChild(rel);
    }
    var wa = el('a', { class: 'btn btn-wa', id: 'd-wa', href: EDU.waLink(shareText(x)), target: '_blank', rel: 'noopener' }, el('span', { html: WA_ICON }), el('span', { text: t('share_wa') }));
    var copy = el('button', { type: 'button', class: 'btn', id: 'd-copy', text: t('copy_text') });
    copy.addEventListener('click', function () { EDU.copy(shareText(x)); });
    box.appendChild(el('div', { class: 'row ad-actions no-print' }, wa, copy));
  }
  $('#tod-btn').addEventListener('click', function () { select(todId(), { scroll: true }); });

  /* ---------------- printable glossary ---------------- */
  function renderGlossary() {
    var g = $('#glossary'); g.innerHTML = '';
    var items = visibleTerms();
    if (!items.length) items = SORTED;
    g.appendChild(el('h1', { text: t('glossary_title', { n: EDU.fmt(items.length) }) + (S.topic ? ' · ' + topicName(S.topic) : '') }));
    g.appendChild(el('p', { class: 'gl-note', text: t('glossary_note', { url: EDU.shareUrl().replace(/^https?:\/\//, ''), date: dateLabel() }) }));
    var tbl = el('table', { class: 'gl-table' });
    tbl.appendChild(el('thead', {}, el('tr', {}, el('th', { text: t('col_no') }), el('th', { text: t('col_term') }), el('th', { text: t('col_meaning') }))));
    var tb = el('tbody');
    items.forEach(function (x, i) {
      var c = tx(x.id);
      tb.appendChild(el('tr', {},
        el('td', { class: 'n', text: String(i + 1) }),
        el('td', { class: 't' }, el('div', { class: 'gl-term no-i18n ltr', lang: 'en', text: x.term }),
          c.local && c.local !== x.term ? el('div', { class: 'gl-local', text: c.local }) : null,
          el('div', { class: 'gl-topic', text: topicName(x.topic) })),
        el('td', {}, el('div', { text: c.short }), el('div', { class: 'gl-local', text: c.example }))));
    });
    tbl.appendChild(tb);
    g.appendChild(tbl);
  }
  $('#print-btn').addEventListener('click', function () { renderGlossary(); setTimeout(function () { window.print(); }, 30); });
  window.addEventListener('beforeprint', renderGlossary);

  /* ---------------- flashcards ---------------- */
  var FC = { queue: [], i: 0, again: [], flipped: false, done: false, knewN: 0 };
  function fcPool() { return TERMS.filter(function (x) { return !S.fcTopic || x.topic === S.fcTopic; }); }
  function startCards(ids) {
    FC.queue = ids ? ids.slice() : EDU.shuffle(fcPool().map(function (x) { return x.id; }));
    FC.i = 0; FC.again = []; FC.flipped = false; FC.done = false; FC.knewN = 0;
    renderCards();
  }
  function fcCur() { return BYID[FC.queue[FC.i]]; }
  function flip() { if (FC.done || !fcCur()) return; FC.flipped = !FC.flipped; renderCards(); }
  function rate(knew) {
    var x = fcCur(); if (!x || FC.done || !FC.flipped) return;
    if (knew) { FC.knewN++; if (S.known.indexOf(x.id) < 0) { S.known.push(x.id); store.set('known', S.known); } }
    else { FC.again.push(x.id); var k = S.known.indexOf(x.id); if (k >= 0) { S.known.splice(k, 1); store.set('known', S.known); } }
    FC.i++; FC.flipped = false;
    if (FC.i >= FC.queue.length) FC.done = true;
    renderCards();
    if (!FC.done) $('#fc-card').focus();
  }
  function renderFcTopicSeg() {
    var seg = $('#fc-topic'); seg.innerHTML = '';
    [''].concat(TOPICS).forEach(function (tp) {
      var b = el('button', { type: 'button', dataset: { v: tp }, 'aria-pressed': String(S.fcTopic === tp), text: tp ? topicName(tp) : t('topic_all') });
      b.addEventListener('click', function () { S.fcTopic = tp; store.set('fcTopic', tp); renderFcTopicSeg(); startCards(null); });
      seg.appendChild(b);
    });
  }
  function renderCards() {
    var pool = fcPool();
    var knownHere = S.known.filter(function (id) { return !S.fcTopic || BYID[id].topic === S.fcTopic; }).length;
    $('#fc-known').textContent = t('known_count', { k: EDU.fmt(knownHere), n: EDU.fmt(pool.length) });
    var total = FC.queue.length, done = Math.min(FC.i, total);
    $('#fc-count').textContent = t('card_count', { i: EDU.fmt(Math.min(FC.i + 1, total)), n: EDU.fmt(total) });
    $('#fc-bar').style.width = (total ? 100 * done / total : 0) + '%';
    $('#fc-prog').setAttribute('aria-valuenow', String(total ? Math.round(100 * done / total) : 0));
    $('#fc-stage').hidden = FC.done;
    $('#fc-done').hidden = !FC.done;
    if (FC.done) {
      $('#fc-done-n').textContent = t('score_val', { c: EDU.fmt(FC.knewN), n: EDU.fmt(total) });
      $('#fc-done-msg').textContent = t('cards_done_msg', { k: EDU.fmt(FC.knewN), a: EDU.fmt(FC.again.length) });
      var rv = $('#fc-review');
      rv.hidden = !FC.again.length;
      rv.textContent = t('review_again', { n: EDU.fmt(FC.again.length) });
      return;
    }
    var x = fcCur(); if (!x) return;
    var c = tx(x.id);
    var card = $('#fc-card');
    card.dataset.id = x.id;
    card.classList.toggle('flipped', FC.flipped);
    card.setAttribute('aria-label', FC.flipped ? c.short : x.term);
    var front = $('#fc-front'); front.innerHTML = '';
    front.appendChild(el('span', { class: 'fc-side', text: t('col_term') }));
    front.appendChild(el('span', { class: 'badge tp tp-' + x.topic, text: topicName(x.topic) }));
    front.appendChild(el('span', { class: 'fc-term no-i18n ltr', lang: 'en', text: x.term }));
    if (c.local && c.local !== x.term) front.appendChild(el('span', { class: 'fc-local', text: c.local }));
    var back = $('#fc-back'); back.innerHTML = '';
    back.appendChild(el('span', { class: 'fc-side', text: t('col_meaning') }));
    back.appendChild(el('span', { class: 'fc-meaning', text: c.short }));
    back.appendChild(el('span', { class: 'fc-ex', text: c.example }));
    back.setAttribute('aria-hidden', String(!FC.flipped));
    front.setAttribute('aria-hidden', String(FC.flipped));
    $('#fc-fliprow').hidden = FC.flipped;
    $('#fc-rate').hidden = !FC.flipped;
  }
  $('#fc-card').addEventListener('click', flip);
  $('#fc-flip').addEventListener('click', function () { flip(); $('#fc-card').focus(); });
  $('#fc-knew').addEventListener('click', function () { rate(true); });
  $('#fc-again').addEventListener('click', function () { rate(false); });
  $('#fc-review').addEventListener('click', function () { startCards(FC.again); });
  $('#fc-restart').addEventListener('click', function () { startCards(null); });
  $('#fc-speak').addEventListener('click', function () { var x = fcCur(); if (x) speakTerm(x); });
  $('#fc-forget').addEventListener('click', function () {
    if (!confirm(t('confirm_forget'))) return;
    S.known = []; store.set('known', S.known); renderCards();
  });

  /* ---------------- quiz ---------------- */
  var Q = { n: 10, i: 0, correct: 0, answered: 0, used: [], cur: null, done: false };
  function bestKey() { return S.qmode + '-' + (S.qtopic || 'all'); }
  function quizPool() { return TERMS.filter(function (x) { return !S.qtopic || x.topic === S.qtopic; }); }
  function newRound() { Q.i = 0; Q.correct = 0; Q.answered = 0; Q.used = []; Q.cur = null; Q.done = false; nextQuestion(); }
  function pickDistractors(x, pool) {
    var others = pool.filter(function (o) { return o.id !== x.id; });
    var pref = EDU.shuffle(others.filter(function (o) { return x.related.indexOf(o.id) >= 0; })).slice(0, 1);
    var same = EDU.shuffle(others.filter(function (o) { return o.topic === x.topic && pref.indexOf(o) < 0; }));
    var out = pref.concat(same).slice(0, 3);
    EDU.shuffle(others).forEach(function (o) { if (out.length < 3 && out.indexOf(o) < 0) out.push(o); });
    return out;
  }
  function nextQuestion() {
    if (Q.i >= Q.n) { finishRound(); return; }
    var pool = quizPool();
    var fresh = pool.filter(function (x) { return Q.used.indexOf(x.id) < 0; });
    var x = EDU.pick(fresh.length ? fresh : pool);
    Q.used.push(x.id);
    var opts = EDU.shuffle([x].concat(pickDistractors(x, pool))).map(function (o) { return o.id; });
    Q.cur = { id: x.id, opts: opts, picked: null };
    Q.i++;
    renderQuiz();
  }
  function answer(id) {
    if (!Q.cur || Q.cur.picked !== null) return;
    Q.cur.picked = id; Q.answered++;
    if (id === Q.cur.id) Q.correct++;
    renderQuiz();
    var nb = $('#q-next'); if (nb) nb.focus();
  }
  function finishRound() {
    Q.done = true; Q.cur = null;
    var k = bestKey();
    if (!(S.best[k] >= Q.correct)) { S.best[k] = Q.correct; store.set('best', S.best); }
    renderQuiz();
  }
  function renderQTopicSeg() {
    var seg = $('#q-topic'); seg.innerHTML = '';
    [''].concat(TOPICS).forEach(function (tp) {
      var b = el('button', { type: 'button', dataset: { v: tp }, 'aria-pressed': String(S.qtopic === tp), text: tp ? topicName(tp) : t('topic_all') });
      b.addEventListener('click', function () { S.qtopic = tp; store.set('qtopic', tp); renderQTopicSeg(); newRound(); });
      seg.appendChild(b);
    });
  }
  function renderQuiz() {
    $$('#q-mode button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === S.qmode)); });
    $('#q-score').textContent = t('score_val', { c: EDU.fmt(Q.correct), n: EDU.fmt(Q.answered) });
    var best = S.best[bestKey()];
    $('#q-best').textContent = best != null ? t('best_score', { b: EDU.fmt(best), n: EDU.fmt(Q.n) }) : '';
    $('#q-bar').style.width = (100 * (Q.done ? Q.n : Math.max(0, Q.i - (Q.cur && Q.cur.picked === null ? 1 : 0))) / Q.n) + '%';
    $('#q-progress').textContent = t('q_progress', { i: EDU.fmt(Math.min(Q.i, Q.n)), n: EDU.fmt(Q.n) });
    $('#q-stage').hidden = Q.done;
    $('#q-end').hidden = !Q.done;
    if (Q.done) {
      $('#q-end-score').textContent = t('score_val', { c: EDU.fmt(Q.correct), n: EDU.fmt(Q.n) });
      $('#q-end-msg').textContent = t('round_done', { c: EDU.fmt(Q.correct), n: EDU.fmt(Q.n) }) + ' ' + t(Q.correct === Q.n ? 'msg_perfect' : Q.correct >= 6 ? 'msg_good' : 'msg_try');
      $('#q-end-best').textContent = t('best_score', { b: EDU.fmt(S.best[bestKey()] || 0), n: EDU.fmt(Q.n) });
      return;
    }
    if (!Q.cur) return;
    var x = BYID[Q.cur.id], c = tx(x.id), qt = $('#q-text');
    qt.dataset.id = x.id;
    qt.innerHTML = '';
    if (S.qmode === 'm2t') { $('#q-ask').textContent = t('ask_m2t'); qt.textContent = c.short; }
    else { $('#q-ask').textContent = t('ask_t2m'); qt.appendChild(el('span', { class: 'en no-i18n ltr', lang: 'en', text: x.term })); if (c.local && c.local !== x.term) qt.appendChild(document.createTextNode(' · ' + c.local)); }
    var box = $('#q-options'); box.innerHTML = '';
    var picked = Q.cur.picked;
    Q.cur.opts.forEach(function (id, i) {
      var o = BYID[id], oc = tx(id);
      var b = el('button', { type: 'button', class: 'btn q-opt', dataset: { id: id } }, el('span', { class: 'q-key', 'aria-hidden': 'true', text: String(i + 1) }));
      if (S.qmode === 'm2t') {
        var inner = el('span', {}, el('span', { class: 'en no-i18n ltr', lang: 'en', text: o.term }));
        if (oc.local && oc.local !== o.term) inner.appendChild(el('span', { class: 'lc', text: ' · ' + oc.local }));
        b.appendChild(inner);
      } else b.appendChild(el('span', { text: oc.short }));
      if (picked !== null) {
        b.disabled = true;
        if (id === Q.cur.id) b.classList.add('ok'); else if (id === picked) b.classList.add('bad');
      }
      b.addEventListener('click', function () { answer(id); });
      box.appendChild(b);
    });
    var fb = $('#q-feedback'); fb.innerHTML = '';
    if (picked !== null) {
      var ok = picked === Q.cur.id, verdict = ok ? t('correct') : t('wrong');
      fb.appendChild(el('strong', { class: ok ? 'ok' : 'bad', text: verdict }));
      fb.appendChild(document.createTextNode(/[!?.।۔:]\s*$/.test(verdict) ? ' ' : ': '));
      fb.appendChild(el('span', { text: t('ans_fact', { term: x.term, meaning: c.short }) }));
    }
    $('#q-next').disabled = picked === null;
  }
  $$('#q-mode button').forEach(function (b) { b.addEventListener('click', function () { S.qmode = b.dataset.v; store.set('qmode', S.qmode); newRound(); }); });
  $('#q-next').addEventListener('click', nextQuestion);
  $('#q-again').addEventListener('click', newRound);
  $('#reset').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    ['best', 'qmode', 'qtopic'].forEach(function (k) { store.remove(k); });
    S.best = {}; S.qmode = 'm2t'; S.qtopic = '';
    renderQTopicSeg(); newRound();
  });

  /* keyboard: quiz 1–4 + Enter, flashcards Space / 1 / 2 (never while typing or inside a modal) */
  document.addEventListener('keydown', function (ev) {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (ev.target && /^(INPUT|SELECT|TEXTAREA)$/.test(ev.target.tagName)) return;
    if (document.querySelector('.edu-modal-back')) return;
    var onControl = ev.target && ev.target.closest && ev.target.closest('button, a, summary, [role="tab"]');
    if (S.tab === 'quiz' && !Q.done && Q.cur) {
      var n = parseInt(ev.key, 10);
      if (n >= 1 && n <= Q.cur.opts.length && Q.cur.picked === null) { answer(Q.cur.opts[n - 1]); ev.preventDefault(); }
      else if (ev.key === 'Enter' && Q.cur.picked !== null && !onControl) { nextQuestion(); ev.preventDefault(); }
    } else if (S.tab === 'cards' && !FC.done && fcCur()) {
      if (ev.key === ' ' || ev.key === 'Spacebar') { if (onControl) return; /* a focused button (the card itself) handles Space as a click */ ev.preventDefault(); flip(); }
      else if (ev.key === '1' && FC.flipped) { ev.preventDefault(); rate(true); }
      else if (ev.key === '2' && FC.flipped) { ev.preventDefault(); rate(false); }
    }
  });

  /* ---------------- tips + render all ---------------- */
  function renderTips() {
    var ul = $('#tips'); ul.innerHTML = '';
    (C().tips || []).forEach(function (s) { ul.appendChild(el('li', { text: s })); });
  }
  function renderAll() {
    index = null;
    renderTips(); renderChips(); renderAZ(); renderList(); renderDetail();
    renderFcTopicSeg(); renderCards(); renderQTopicSeg(); renderQuiz(); showTab(S.tab);
  }
  EDU.onLang(renderAll);
  renderAll();
})();
