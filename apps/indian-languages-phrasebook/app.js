/* Learn Indian Languages: phrasebook + trainer between any two of the 12 languages.
   Source ("I speak") = the UI language; target = any other language. Content comes from content.js
   (same shape in every language), script tables and number values from data.js. */
(function () {
  'use strict';
  var SLUG = 'indian-languages-phrasebook';
  var store = EDU.store(SLUG);
  var $ = EDU.$, el = EDU.el, t = EDU.t, fmt = EDU.fmt;
  var C = window.APP_CONTENT, TOPICS = window.PB_TOPICS, D = window.PB_DATA;
  var INTERVAL = [0, 1, 2, 4, 7, 15, 30];              // days until the next review, by box 0..6
  var LEARNED_BOX = 3;

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ---------------- state ---------------- */
  var src = EDU.lang;
  var target = store.get('target', null);
  var tab = store.get('tab', 'phrases');
  var topic = store.get('topic', 'greetings');
  var mode = store.get('mode', 'listen');
  var ptopic = store.get('ptopic', 'greetings');
  var progress = store.get('progress', {});     // progress[target][id] = {b: box, d: dueDay}
  var favs = store.get('favs', {});             // favs[target] = [ids]
  var daily = store.get('daily', {});           // {date, ids, i, ok, done, streak, last}
  var search = '';
  var practice = null;                          // current round state
  var rec = null;                               // speech recognition session

  function pickDefault() {
    var d = D.defaults[src] || 'hi';
    if (d === src) d = src === 'hi' ? 'ta' : 'hi';
    return d;
  }
  if (!target || target === src || !C[target]) target = pickDefault();

  function today() { return Math.floor((Date.now() + new Date().getTimezoneOffset() * -60000) / 86400000); }
  function langName(code) { return t('ln_' + code); }
  function nativeName(code) { return EDU.langInfo(code).native; }
  function dirOf(code) { return EDU.langInfo(code).dir; }
  function items(code) { return C[code].topics; }
  function allIds() { var out = []; TOPICS.forEach(function (tp) { items('en')[tp.id].items.forEach(function (_, i) { out.push(tp.id + ':' + i); }); }); return out; }
  function phrase(id, code) { var p = id.split(':'); var it = items(code)[p[0]].items[+p[1]]; return { id: id, topic: p[0], i: +p[1], text: it[0], tr: it[1] }; }
  function targetP(id) { return phrase(id, target); }
  function myP(id) { return phrase(id, src); }
  function topicName(tid, code) { return items(code || src)[tid].name; }
  function numVal(id) { var p = id.split(':'); return p[0] === 'numbers' ? D.numbers[+p[1]] : null; }
  function saveAll() { store.set('target', target); store.set('tab', tab); store.set('topic', topic); store.set('mode', mode); store.set('ptopic', ptopic); }

  /* ---------------- fonts for the target language ---------------- */
  var loadedFonts = {};
  function applyTargetFont() {
    document.documentElement.style.setProperty('--pb-font', D.fonts[target] || 'inherit');
    var info = EDU.langInfo(target);
    if (info.font && !loadedFonts[info.font] && !(location.protocol === 'file:' && !navigator.onLine)) {
      loadedFonts[info.font] = 1;
      var l = document.createElement('link'); l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=' + info.font.replace(/ /g, '+') + ':wght@400;600;700&display=swap';
      document.head.appendChild(l);
    }
  }

  /* ---------------- speech ---------------- */
  var speakFail = false;
  function say(text, slow) {
    return EDU.speak(text, { lang: target, rate: slow ? 0.6 : 0.9 }).then(function (ok) {
      if (!ok) { speakFail = true; EDU.toast(t('no_voice')); }
      return ok;
    });
  }
  function bdi(text, code) { return el('bdi', { dir: dirOf(code), lang: code, text: text }); }

  /* ---------------- header: speak / learn / stats ---------------- */
  function renderHeader() {
    $('#speak-name').textContent = nativeName(src) + ' · ' + langName(src);
    var sel = $('#target'); sel.innerHTML = '';
    EDU.LANGS.forEach(function (L) {
      if (L.code === src) return;
      sel.appendChild(el('option', { value: L.code, text: L.native + ' · ' + langName(L.code) }));
    });
    sel.value = target;
    renderStats();
  }
  function learnedCount() { var P = progress[target] || {}; return Object.keys(P).filter(function (k) { return P[k].b >= LEARNED_BOX; }).length; }
  function curStreak() { return daily.last != null && daily.last >= today() - 1 ? (daily.streak || 0) : 0; }
  function favList() { return favs[target] || []; }
  function renderStats() {
    var s = $('#stats'); s.innerHTML = '';
    s.appendChild(el('span', { text: t('stat_streak', { n: fmt(curStreak()) }) }));
    s.appendChild(el('span', { text: t('stat_learned', { n: fmt(learnedCount()) }) }));
    s.appendChild(el('span', { text: t('stat_favs', { n: fmt(favList().length) }) }));
  }
  $('#target').addEventListener('change', function (e) {
    var v = e.target.value;
    if (v === src) { EDU.toast(t('same_lang', { lang: langName(src) })); e.target.value = target; return; }
    target = v; practice = null; stopRec(); saveAll(); applyTargetFont(); renderAll();
  });
  $('#swap').addEventListener('click', function () {
    var oldSrc = src, oldTarget = target;
    target = oldSrc; saveAll();
    EDU.setLang(oldTarget);   /* setLang triggers onLang below: src becomes the old target, target the old source */
  });

  /* ---------------- tabs ---------------- */
  var TABS = ['phrases', 'practice', 'script', 'daily', 'favs'];
  function showTab(name) {
    tab = name; saveAll();
    EDU.$$('#tabs [role=tab]').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.tab === name)); });
    TABS.forEach(function (n) { $('#panel-' + n).hidden = n !== name; });
    stopRec(); EDU.stopSpeaking();
    renderTab();
  }
  EDU.$$('#tabs [role=tab]').forEach(function (b) { b.addEventListener('click', function () { showTab(b.dataset.tab); }); });
  $('#tabs').addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var i = TABS.indexOf(tab), n = (i + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length;
    showTab(TABS[n]); EDU.$$('#tabs [role=tab]')[n].focus();
  });
  function renderTab() {
    if (tab === 'phrases') renderPhrases();
    else if (tab === 'practice') renderPractice();
    else if (tab === 'script') renderScript();
    else if (tab === 'daily') renderDaily();
    else renderFavs();
  }

  /* ---------------- phrase cards ---------------- */
  function isFav(id) { return favList().indexOf(id) >= 0; }
  function toggleFav(id) {
    var list = favList().slice(); var i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1); else list.push(id);
    favs[target] = list; store.set('favs', favs); renderStats();
  }
  function waText(id) {
    var tp = targetP(id), mp = myP(id);
    return tp.text + (tp.tr ? '\n' + tp.tr : '') + '\n' + mp.text + '\n\n' + t('wa_tail', { url: EDU.shareUrl() });
  }
  function card(id) {
    var tp = targetP(id), mp = myP(id), nv = numVal(id);
    var c = el('article', { class: 'card pb-card', dataset: { id: id } });
    if (nv !== null) c.appendChild(el('div', { class: 'pb-num', 'aria-hidden': 'true', text: fmt(nv) }));
    c.appendChild(el('div', { class: 'pb-target', dataset: { lang: target } }, bdi(tp.text, target)));
    c.appendChild(el('div', { class: 'pb-tr' }, tp.tr ? el('bdi', { dir: 'ltr', text: tp.tr }) : null));
    c.appendChild(el('div', { class: 'pb-meaning' }, bdi(mp.text, src)));
    var acts = el('div', { class: 'pb-actions' });
    acts.appendChild(el('button', { class: 'btn', 'aria-label': t('listen'), title: t('listen'), onclick: function () { say(tp.text); } }, '🔊 ', el('span', { class: 'lbl', text: t('listen') })));
    acts.appendChild(el('button', { class: 'btn', 'aria-label': t('slow'), title: t('slow'), onclick: function () { say(tp.text, true); } }, '🐢 ', el('span', { class: 'lbl', text: t('slow') })));
    var fb = el('button', { class: 'btn btn-fav', 'aria-pressed': String(isFav(id)), 'aria-label': t(isFav(id) ? 'fav_remove' : 'fav_add'), title: t(isFav(id) ? 'fav_remove' : 'fav_add'), text: isFav(id) ? '★' : '☆' });
    fb.addEventListener('click', function () {
      toggleFav(id); var on = isFav(id);
      fb.textContent = on ? '★' : '☆'; fb.setAttribute('aria-pressed', String(on)); fb.setAttribute('aria-label', t(on ? 'fav_remove' : 'fav_add')); fb.title = fb.getAttribute('aria-label');
      if (tab === 'favs') renderFavs();
    });
    acts.appendChild(fb);
    acts.appendChild(el('button', { class: 'btn', 'aria-label': t('copy'), title: t('copy'), onclick: function () { EDU.copy(tp.text + (tp.tr ? ' (' + tp.tr + ')' : '')); EDU.toast(t('copied')); } }, '📋'));
    acts.appendChild(el('a', { class: 'btn btn-wa', href: EDU.waLink(waText(id)), target: '_blank', rel: 'noopener', 'aria-label': t('share_wa'), title: t('share_wa') }, 'WhatsApp'));
    c.appendChild(acts);
    return c;
  }
  function norm(s) { return String(s || '').toLowerCase().replace(/[।۔.,!?;:'"()\/\-–]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function matches(id, q) {
    var tp = targetP(id), mp = myP(id), nv = numVal(id);
    return norm(tp.text).indexOf(q) >= 0 || norm(tp.tr).indexOf(q) >= 0 || norm(mp.text).indexOf(q) >= 0 || (nv !== null && String(nv) === q);
  }
  function renderTopics() {
    var box = $('#topics'); box.innerHTML = '';
    TOPICS.forEach(function (tp) {
      var b = el('button', { class: 'chip', role: 'tab', 'aria-pressed': String(tp.id === topic && !search), 'aria-selected': String(tp.id === topic && !search), dataset: { topic: tp.id } },
        el('span', { class: 'ic', 'aria-hidden': 'true', text: tp.icon }), ' ', el('span', { text: topicName(tp.id) }));
      b.addEventListener('click', function () { topic = tp.id; search = ''; $('#search').value = ''; saveAll(); renderPhrases(); b.scrollIntoView({ block: 'nearest', inline: 'center' }); });
      box.appendChild(b);
    });
  }
  function renderPhrases() {
    renderTopics();
    var ids, title = $('#topic-title'); title.innerHTML = '';
    var cards = $('#cards'); cards.innerHTML = '';
    if (search) {
      var q = norm(search);
      ids = allIds().filter(function (id) { return matches(id, q); });
      title.appendChild(el('span', { text: '🔍 ' + search }));
      title.appendChild(el('span', { class: 'badge primary', text: t('phrases_n', { n: fmt(ids.length) }) }));
      if (!ids.length) cards.appendChild(el('p', { class: 'pb-empty', text: t('no_results') }));
    } else {
      var tp = TOPICS.filter(function (x) { return x.id === topic; })[0] || TOPICS[0];
      ids = items('en')[tp.id].items.map(function (_, i) { return tp.id + ':' + i; });
      title.appendChild(el('span', { 'aria-hidden': 'true', text: tp.icon }));
      title.appendChild(el('span', {}, bdi(topicName(tp.id), src)));
      title.appendChild(el('span', { class: 'badge primary', text: t('phrases_n', { n: fmt(ids.length) }) }));
    }
    ids.slice(0, 120).forEach(function (id) { cards.appendChild(card(id)); });
  }
  $('#search').addEventListener('input', function (e) { search = e.target.value.trim(); renderPhrases(); });
  function renderFavs() {
    var box = $('#favs'); box.innerHTML = '';
    var list = favList();
    if (!list.length) { box.appendChild(el('p', { class: 'pb-empty', text: t('favs_empty') })); return; }
    list.forEach(function (id) { box.appendChild(card(id)); });
  }

  /* ---------------- print sheet ---------------- */
  function printSheet(ids, heading) {
    var sh = $('#print-sheet'); sh.innerHTML = '';
    sh.appendChild(el('h1', { text: t('sheet_title', { from: langName(src), to: langName(target) }) }));
    sh.appendChild(el('p', { class: 'pb-sheet-sub', text: heading + ' · ' + nativeName(src) + ' → ' + nativeName(target) }));
    var tb = el('table'), thead = el('thead'), tr = el('tr');
    ['#', t('col_my'), t('col_target'), t('col_roman')].forEach(function (h) { tr.appendChild(el('th', { text: h })); });
    thead.appendChild(tr); tb.appendChild(thead);
    var tbody = el('tbody');
    ids.forEach(function (id, i) {
      var tp = targetP(id), mp = myP(id), r = el('tr');
      r.appendChild(el('td', { class: 'n', text: fmt(i + 1) }));
      r.appendChild(el('td', {}, bdi(mp.text, src)));
      r.appendChild(el('td', { class: 't' }, bdi(tp.text, target)));
      r.appendChild(el('td', { class: 'r', text: tp.tr }));
      tbody.appendChild(r);
    });
    tb.appendChild(tbody); sh.appendChild(tb);
    sh.appendChild(el('p', { class: 'pb-sheet-foot', text: t('sheet_foot') + ' · ' + EDU.shareUrl() }));
    window.print();
  }
  $('#print-btn').addEventListener('click', function () {
    var ids = search ? allIds().filter(function (id) { return matches(id, norm(search)); }) : items('en')[topic].items.map(function (_, i) { return topic + ':' + i; });
    printSheet(ids, search ? search : topicName(topic));
  });
  $('#print-favs').addEventListener('click', function () { if (favList().length) printSheet(favList(), t('tab_favs')); else EDU.toast(t('favs_empty')); });

  /* ---------------- practice ---------------- */
  function poolIds() {
    if (ptopic === '__all') return allIds();
    return items('en')[ptopic].items.map(function (_, i) { return ptopic + ':' + i; });
  }
  function renderPtopics() {
    var sel = $('#ptopic'); sel.innerHTML = '';
    sel.appendChild(el('option', { value: '__all', text: t('all_topics') }));
    TOPICS.forEach(function (tp) { sel.appendChild(el('option', { value: tp.id, text: tp.icon + ' ' + topicName(tp.id) })); });
    sel.value = ptopic;
  }
  $('#ptopic').addEventListener('change', function (e) { ptopic = e.target.value; practice = null; saveAll(); renderPractice(); });
  EDU.$$('#modes button').forEach(function (b) {
    b.addEventListener('click', function () { mode = b.dataset.mode; practice = null; stopRec(); saveAll(); renderPractice(); });
  });
  function renderPractice() {
    renderPtopics();
    EDU.$$('#modes button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === mode)); });
    var box = $('#practice'); box.innerHTML = '';
    if (mode === 'numbers') return renderNumbers(box);
    if (mode === 'match') return renderMatch(box);
    if (!practice) {
      box.appendChild(el('p', { class: 'pb-q', text: t(mode === 'listen' ? 'listen_q' : mode === 'type' ? 'type_q' : 'speak_q', { lang: langName(target) }) }));
      if (mode === 'speak' && !(window.SpeechRecognition || window.webkitSpeechRecognition)) box.appendChild(el('p', { class: 'callout warning', text: t('speak_none', { lang: langName(target) }) }));
      box.appendChild(el('button', { class: 'btn btn-primary btn-lg', id: 'start-round', text: t('start_round'), onclick: startRound }));
      return;
    }
    if (practice.i >= practice.q.length) {
      box.appendChild(el('p', { class: 'pb-q', role: 'status', text: t('round_done', { score: fmt(practice.score), n: fmt(practice.q.length) }) }));
      box.appendChild(el('button', { class: 'btn btn-primary btn-lg', id: 'start-round', text: t('play_again'), onclick: startRound }));
      return;
    }
    var id = practice.q[practice.i];
    var prog = el('div', { class: 'pb-progress' }, el('span', { text: t('q_progress', { i: fmt(practice.i + 1), n: fmt(practice.q.length) }) }),
      el('div', { class: 'progress' }, el('span', { style: { width: Math.round(practice.i / practice.q.length * 100) + '%' } })));
    box.appendChild(prog);
    if (mode === 'listen') renderListenQ(box, id);
    else if (mode === 'type') renderTypeQ(box, id);
    else renderSpeakQ(box, id);
  }
  function startRound() {
    var ids = EDU.shuffle(poolIds()).slice(0, 8);
    practice = { q: ids, i: 0, score: 0, answered: false };
    renderPractice();
    if (mode === 'listen') sayQ(ids[0]);
  }
  /* speak the listen question; with no voice for the target, show the text so the question can still be answered */
  function sayQ(id) {
    say(targetP(id).text).then(function (ok) {
      if (ok) return;
      var b = $('#listen-text'); if (b) b.hidden = false;
      var q = $('#practice .pb-q'); if (q) q.textContent = t('read_q');
    });
  }
  function nextQ() { practice.i++; practice.answered = false; renderPractice(); if (mode === 'listen' && practice.i < practice.q.length) sayQ(practice.q[practice.i]); }
  function distractors(id, n) {
    var pool = allIds().filter(function (x) { return x !== id && myP(x).text !== myP(id).text && targetP(x).text !== targetP(id).text; });
    var same = pool.filter(function (x) { return x.split(':')[0] === id.split(':')[0]; });
    var picks = EDU.shuffle(same).slice(0, n);
    if (picks.length < n) picks = picks.concat(EDU.shuffle(pool.filter(function (x) { return picks.indexOf(x) < 0; })).slice(0, n - picks.length));
    return picks;
  }
  function renderListenQ(box, id) {
    var tp = targetP(id);
    var noVoice = speakFail;
    box.appendChild(el('p', { class: 'pb-q', text: t(noVoice ? 'read_q' : 'listen_q') }));
    var big = el('div', { class: 'pb-big no-i18n', id: 'listen-text', hidden: !noVoice }, bdi(tp.text, target), ' ', el('span', { class: 'pb-tr', text: tp.tr }));
    box.appendChild(big);
    box.appendChild(el('div', { class: 'row', style: { marginBottom: '12px' } },
      el('button', { class: 'btn', text: t('replay'), onclick: function () { say(tp.text).then(function (ok) { if (!ok) big.hidden = false; }); } }),
      el('button', { class: 'btn btn-ghost', text: t('slow') + ' 🐢', onclick: function () { say(tp.text, true); } })));
    var opts = EDU.shuffle([id].concat(distractors(id, 3)));
    var grid = el('div', { class: 'pb-opts no-i18n' });
    var status = el('p', { class: 'pb-status', 'aria-live': 'polite', id: 'q-status' });
    opts.forEach(function (o) {
      var b = el('button', { class: 'btn pb-opt', dataset: { id: o } }, bdi(myP(o).text, src));
      b.addEventListener('click', function () {
        if (practice.answered) return; practice.answered = true;
        var ok = o === id; if (ok) practice.score++;
        b.classList.add(ok ? 'ok' : 'bad');
        EDU.$$('.pb-opt', grid).forEach(function (x) { if (x.dataset.id === id) x.classList.add('ok'); });
        big.hidden = false;
        status.textContent = ok ? t('correct') : t('wrong') + ' · ' + t('answer_is', { a: tp.text });
        setTimeout(nextQ, ok ? 900 : 1800);
      });
      grid.appendChild(b);
    });
    box.appendChild(grid); box.appendChild(status);
  }
  function lev(a, b) {
    var m = a.length, n = b.length, i, j, prev, cur = [];
    for (j = 0; j <= n; j++) cur[j] = j;
    for (i = 1; i <= m; i++) { prev = cur.slice(); cur[0] = i; for (j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); }
    return cur[n];
  }
  function similarity(a, b) { a = norm(a); b = norm(b); if (!a || !b) return 0; return 1 - lev(a, b) / Math.max(a.length, b.length); }
  function renderTypeQ(box, id) {
    var tp = targetP(id), mp = myP(id);
    box.appendChild(el('p', { class: 'pb-q', text: t('type_q', { lang: langName(target) }) }));
    box.appendChild(el('div', { class: 'pb-big no-i18n' }, bdi(mp.text, src)));
    var wrap = el('div', { class: 'pb-type' });
    var inp = el('input', { type: 'text', id: 'type-input', class: 'no-i18n', placeholder: t('type_ph'), 'aria-label': t('type_ph'), autocomplete: 'off', autocapitalize: 'off' });
    var status = el('p', { class: 'pb-status no-i18n', 'aria-live': 'polite', id: 'q-status' });
    var grid = el('div', { class: 'pb-opts no-i18n', style: { marginTop: '12px' } });
    function finish(ok, near) {
      if (practice.answered) return; practice.answered = true;
      if (ok) practice.score++;
      status.textContent = (ok ? t('correct') : near ? t('type_near') : t('wrong')) + ' ' + tp.text + (tp.tr ? ' · ' + tp.tr : '');
      status.className = 'pb-status no-i18n ' + (ok ? 'ok' : 'bad');
      EDU.$$('.pb-opt', grid).forEach(function (x) { if (x.dataset.id === id) x.classList.add('ok'); else x.disabled = true; });
      say(tp.text);
      setTimeout(nextQ, ok ? 1200 : 2200);
    }
    function check() {
      var v = inp.value; if (!v.trim()) return;
      var s = Math.max(similarity(v, tp.text), similarity(v, tp.tr));
      finish(s >= 0.8, s >= 0.6);
    }
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
    wrap.appendChild(inp);
    wrap.appendChild(el('div', { class: 'row' },
      el('button', { class: 'btn btn-primary', id: 'type-check', text: t('check'), onclick: check }),
      el('button', { class: 'btn btn-ghost', text: t('show_answer'), onclick: function () { finish(false, false); } }),
      el('span', { class: 'muted small', text: t('type_hint', { lang: langName(target) }) })));
    box.appendChild(wrap);
    EDU.shuffle([id].concat(distractors(id, 3))).forEach(function (o) {
      var b = el('button', { class: 'btn pb-opt', dataset: { id: o, lang: target } }, bdi(targetP(o).text, target), targetP(o).tr ? el('span', { class: 'pb-tr', text: ' ' + targetP(o).tr }) : null);
      b.addEventListener('click', function () { b.classList.add(o === id ? 'ok' : 'bad'); finish(o === id, false); });
      grid.appendChild(b);
    });
    box.appendChild(grid); box.appendChild(status);
    setTimeout(function () { inp.focus(); }, 50);
  }
  function stopRec() { if (rec) { try { rec.onend = null; rec.abort(); } catch (e) { } rec = null; } }
  function renderSpeakQ(box, id) {
    var tp = targetP(id);
    box.appendChild(el('p', { class: 'pb-q', text: t('speak_q') }));
    box.appendChild(el('div', { class: 'pb-big no-i18n' }, bdi(tp.text, target)));
    box.appendChild(el('p', { class: 'pb-tr no-i18n', text: tp.tr }));
    box.appendChild(el('p', { class: 'pb-meaning no-i18n' }, bdi(myP(id).text, src)));
    var status = el('div', { class: 'pb-status', 'aria-live': 'polite', id: 'q-status' });
    var heard = el('div', { class: 'pb-heard no-i18n' });
    var mic = el('button', { class: 'btn btn-primary btn-lg pb-mic', id: 'mic', 'aria-pressed': 'false', text: '🎤 ' + t('speak_btn') });
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { mic.disabled = true; status.textContent = t('speak_none', { lang: langName(target) }); }
    mic.addEventListener('click', function () {
      if (rec) { stopRec(); mic.setAttribute('aria-pressed', 'false'); return; }
      EDU.stopSpeaking();
      var r = EDU.recognizer({ lang: target, interim: true });
      if (!r) { status.textContent = t('speak_none', { lang: langName(target) }); return; }
      rec = r; mic.setAttribute('aria-pressed', 'true'); status.textContent = t('listening'); heard.textContent = '';
      var finalText = '', gotResult = false;
      r.onresult = function (e) {
        var txt = ''; for (var i = e.resultIndex; i < e.results.length; i++) { txt += e.results[i][0].transcript; if (e.results[i].isFinal) finalText += e.results[i][0].transcript; }
        gotResult = true; heard.textContent = t('heard', { text: finalText || txt });
      };
      r.onerror = function (e) {
        var code = (e && e.error) || '?'; if (code === 'aborted') return;
        status.textContent = code === 'not-allowed' || code === 'service-not-allowed' ? t('mic_denied') : code === 'no-speech' ? t('nothing_heard') : t('mic_err', { e: code });
      };
      r.onend = function () {
        rec = null; mic.setAttribute('aria-pressed', 'false');
        if (!gotResult) { if (status.textContent === t('listening')) status.textContent = t('nothing_heard'); return; }
        var said = finalText || heard.textContent.replace(/^[^:]*:\s*/, '');
        var pct = Math.round(Math.max(similarity(said, tp.text), similarity(said, tp.tr)) * 100);
        var ok = pct >= 70;
        if (!practice.answered) { practice.answered = true; if (ok) practice.score++; }
        status.innerHTML = '';
        status.appendChild(el('div', { class: 'pb-pct', text: t('match_pct', { pct: fmt(pct) }) }));
        status.appendChild(el('div', { text: ok ? t('speak_good') : t('speak_retry') }));
        if (!ok) say(tp.text, true);
      };
      try { r.start(); } catch (err) { rec = null; status.textContent = t('mic_err', { e: err.message || 'start' }); mic.setAttribute('aria-pressed', 'false'); }
    });
    box.appendChild(el('div', { class: 'row' }, mic,
      el('button', { class: 'btn', text: '🔊 ' + t('listen'), onclick: function () { say(tp.text); } }),
      el('button', { class: 'btn btn-ghost', id: 'next-q', text: t('next'), onclick: function () { stopRec(); if (!practice.answered) practice.answered = true; nextQ(); } })));
    box.appendChild(heard); box.appendChild(status);
  }

  /* match pairs */
  function renderMatch(box) {
    if (!practice || practice.kind !== 'match') {
      var ids = EDU.shuffle(poolIds()).slice(0, 6);
      practice = { kind: 'match', ids: ids, left: EDU.shuffle(ids.slice()), right: EDU.shuffle(ids.slice()), sel: null, matched: {}, moves: 0 };
    }
    var P = practice;
    box.appendChild(el('p', { class: 'pb-q', text: t('match_hint') }));
    var status = el('p', { class: 'pb-status', 'aria-live': 'polite', id: 'match-status', text: t('moves', { n: fmt(P.moves) }) });
    var grid = el('div', { class: 'pb-match no-i18n', id: 'match-grid' });
    var colL = el('div', { class: 'stack' }), colR = el('div', { class: 'stack' });
    function mk(id, side) {
      var tp = targetP(id);
      var b = el('button', { class: 'btn' + (P.matched[id] ? ' matched' : ''), dataset: { id: id, side: side } },
        side === 'l' ? [bdi(tp.text, target), tp.tr ? el('span', { class: 'pb-tr small', text: ' ' + tp.tr }) : null] : bdi(myP(id).text, src));
      b.addEventListener('click', function () { pick(b, id, side); });
      return b;
    }
    function pick(b, id, side) {
      if (P.matched[id]) return;
      if (!P.sel) { P.sel = { id: id, side: side, b: b }; b.classList.add('sel'); if (side === 'l') say(targetP(id).text); return; }
      if (P.sel.side === side) { P.sel.b.classList.remove('sel'); P.sel = { id: id, side: side, b: b }; b.classList.add('sel'); return; }
      P.moves++;
      if (P.sel.id === id) {
        P.matched[id] = 1; P.sel.b.classList.remove('sel'); P.sel.b.classList.add('matched'); b.classList.add('matched');
        if (Object.keys(P.matched).length === P.ids.length) { status.textContent = t('match_done', { n: fmt(P.moves) }); status.className = 'pb-status ok'; again.hidden = false; }
        else status.textContent = t('moves', { n: fmt(P.moves) });
      } else {
        b.classList.add('shake'); P.sel.b.classList.add('shake'); var old = P.sel.b;
        setTimeout(function () { b.classList.remove('shake'); old.classList.remove('shake', 'sel'); }, 350);
        status.textContent = t('moves', { n: fmt(P.moves) });
      }
      P.sel = null;
    }
    P.left.forEach(function (id) { colL.appendChild(mk(id, 'l')); });
    P.right.forEach(function (id) { colR.appendChild(mk(id, 'r')); });
    grid.appendChild(colL); grid.appendChild(colR);
    var again = el('button', { class: 'btn btn-primary', id: 'match-again', text: t('play_again'), hidden: Object.keys(P.matched).length < P.ids.length, onclick: function () { practice = null; renderPractice(); } });
    box.appendChild(grid); box.appendChild(status); box.appendChild(el('p', { class: 'row' }, again));
  }

  /* numbers trainer */
  var numRange = 0;
  function renderNumbers(box) {
    var ranges = [[1, 10], [11, 20], [21, 31]];
    var seg = el('div', { class: 'seg', role: 'group', style: { marginBottom: '12px' } });
    ['num_range_1', 'num_range_2', 'num_range_3'].forEach(function (k, i) {
      seg.appendChild(el('button', { 'aria-pressed': String(numRange === i), text: t(k), dataset: { r: i }, onclick: function () { numRange = i; practice = null; renderPractice(); } }));
    });
    box.appendChild(seg);
    box.appendChild(el('p', { class: 'muted small', text: t('num_hint') }));
    var grid = el('div', { class: 'pb-numgrid no-i18n', id: 'num-grid' });
    var r = ranges[numRange];
    for (var i = r[0]; i <= r[1]; i++) {
      (function (i) {
        var id = 'numbers:' + i, tp = targetP(id);
        grid.appendChild(el('button', { class: 'btn pb-numcell', dataset: { n: D.numbers[i] }, onclick: function () { say(tp.text); } },
          el('span', { class: 'd', text: fmt(D.numbers[i]) }), bdi(tp.text, target), el('span', { class: 'r', text: tp.tr })));
      })(i);
    }
    box.appendChild(grid);
    var quiz = el('div', { class: 'stack', id: 'num-quiz', style: { marginTop: '14px' } });
    var qbtn = el('button', { class: 'btn btn-primary', text: t('num_quiz'), onclick: function () { numQuiz(quiz, r); } });
    quiz.appendChild(qbtn); box.appendChild(quiz);
  }
  function numQuiz(wrap, r) {
    wrap.innerHTML = '';
    var i = EDU.randInt(r[0], r[1]), id = 'numbers:' + i, tp = targetP(id);
    wrap.appendChild(el('p', { class: 'pb-q', text: t('num_q') }));
    wrap.appendChild(el('div', { class: 'pb-big no-i18n' }, bdi(tp.text, target), ' ', el('span', { class: 'pb-tr', text: tp.tr })));
    wrap.appendChild(el('button', { class: 'btn', text: '🔊 ' + t('listen'), onclick: function () { say(tp.text); } }));
    var opts = [i]; while (opts.length < 4) { var k = EDU.randInt(r[0], r[1]); if (opts.indexOf(k) < 0) opts.push(k); }
    var grid = el('div', { class: 'pb-opts no-i18n', style: { marginTop: '10px' } }), st = el('p', { class: 'pb-status', 'aria-live': 'polite' });
    EDU.shuffle(opts).forEach(function (k) {
      var b = el('button', { class: 'btn pb-opt', text: fmt(D.numbers[k]) });
      b.addEventListener('click', function () { var ok = k === i; b.classList.add(ok ? 'ok' : 'bad'); st.textContent = ok ? t('correct') : t('wrong'); if (ok) setTimeout(function () { numQuiz(wrap, r); }, 900); });
      grid.appendChild(b);
    });
    wrap.appendChild(grid); wrap.appendChild(st);
    say(tp.text);
  }

  /* ---------------- script tables ---------------- */
  function letterBtn(g, r, code) {
    return el('button', { class: 'btn pb-letter', lang: code, dir: dirOf(code), onclick: function () { say(g); } }, el('span', { class: 'g', text: g }), el('span', { class: 'r', text: r }));
  }
  function renderScript() {
    var box = $('#script'); box.innerHTML = '';
    var S = D.scripts[target];
    box.appendChild(el('h2', { text: t('script_title', { lang: langName(target) }) }));
    box.appendChild(el('p', { class: 'muted small', text: t('script_hint') }));
    if (!S) return;
    function grid(list, code) { var g = el('div', { class: 'pb-letters no-i18n', dir: dirOf(code) }); list.forEach(function (p) { g.appendChild(letterBtn(p[0], p[1], code)); }); return g; }
    if (S.latin) {
      box.appendChild(el('p', { class: 'callout', text: t('script_latin_note') }));
      box.appendChild(el('h3', { text: t('vowels') })); box.appendChild(grid(S.vowels, target));
      box.appendChild(el('h3', { text: t('consonants') })); box.appendChild(grid(S.consonants, target));
      return;
    }
    if (S.rtl) {
      box.appendChild(el('p', { class: 'callout', text: t('script_rtl_note') }));
      box.appendChild(el('h3', { text: t('letters') })); box.appendChild(grid(S.letters, target));
      box.appendChild(el('h3', { text: t('vowel_marks') })); box.appendChild(grid(S.vowelMarks, target));
      return;
    }
    box.appendChild(el('p', { class: 'callout', text: t('script_caps_note') }));
    box.appendChild(el('h3', { text: t('vowels') })); box.appendChild(grid(S.vowels, target));
    box.appendChild(el('h3', { text: t('consonants') })); box.appendChild(grid(S.consonants, target));
    box.appendChild(el('h3', { text: t('vowel_signs', { base: S.base }) }));
    box.appendChild(grid(S.matras.map(function (m) { return [S.base + (m[0] === '_' ? '' : m[0]), m[1]]; }), target));
  }

  /* ---------------- daily 10 (Leitner) ---------------- */
  function prog(id) { var P = progress[target] || (progress[target] = {}); return P[id] || (P[id] = { b: 0, d: 0 }); }
  function dueIds() { var P = progress[target] || {}, td = today(); return Object.keys(P).filter(function (k) { return P[k].b > 0 && P[k].d <= td; }); }
  function newDaily() {
    var td = today(), P = progress[target] || {};
    var due = EDU.shuffle(dueIds()).slice(0, 10);
    var fresh = allIds().filter(function (id) { return !P[id] || P[id].b === 0; });
    var ids = due.concat(fresh.slice(0, 10 - due.length));
    if (ids.length < 10) ids = ids.concat(EDU.shuffle(allIds().filter(function (x) { return ids.indexOf(x) < 0; })).slice(0, 10 - ids.length));
    daily = { date: td, target: target, ids: ids, i: 0, ok: 0, done: false, revealed: false, streak: daily.streak || 0, last: daily.last };
    store.set('daily', daily);
  }
  function answer(knew) {
    var id = daily.ids[daily.i], p = prog(id);
    if (knew) { p.b = Math.min(INTERVAL.length - 1, p.b + 1); daily.ok++; } else p.b = 1;
    p.d = today() + INTERVAL[p.b];
    daily.i++; daily.revealed = false;
    if (daily.i >= daily.ids.length) {
      daily.done = true;
      var td = today();
      if (daily.last !== td) { daily.streak = daily.last === td - 1 ? (daily.streak || 0) + 1 : 1; daily.last = td; }
    }
    store.set('progress', progress); store.set('daily', daily); renderStats(); renderDaily();
  }
  function renderDaily() {
    var box = $('#daily'); box.innerHTML = '';
    var td = today();
    if (daily.date !== td || daily.target !== target) daily = { streak: daily.streak || 0, last: daily.last, fresh: true };
    var stats = el('div', { class: 'pb-daily-stats' },
      el('span', { text: t('streak_n', { n: fmt(curStreak()) }) }), el('span', { text: t('learned_n', { n: fmt(learnedCount()) }) }), el('span', { text: t('due_n', { n: fmt(dueIds().length) }) }));
    box.appendChild(stats);
    if (!daily.ids) {
      box.appendChild(el('p', { class: 'muted', text: t('daily_intro') }));
      box.appendChild(el('button', { class: 'btn btn-primary btn-lg', id: 'daily-start', text: t('daily_start'), onclick: function () { newDaily(); renderDaily(); } }));
      return;
    }
    if (daily.done) {
      box.appendChild(el('p', { class: 'callout success', role: 'status', id: 'daily-done', text: t('daily_done') + ' ' + t('daily_summary', { ok: fmt(daily.ok), n: fmt(daily.ids.length) }) }));
      return;
    }
    var id = daily.ids[daily.i], tp = targetP(id), mp = myP(id);
    box.appendChild(el('div', { class: 'pb-progress' }, el('span', { id: 'daily-progress', text: t('daily_progress', { i: fmt(daily.i + 1), n: fmt(daily.ids.length) }) }),
      el('div', { class: 'progress' }, el('span', { style: { width: Math.round(daily.i / daily.ids.length * 100) + '%' } }))));
    var flash = el('div', { class: 'pb-flash no-i18n', id: 'flash', tabindex: '0', role: 'button', 'aria-pressed': String(!!daily.revealed) });
    flash.appendChild(el('div', { class: 'pb-meaning', style: { fontSize: '1.2rem', color: 'var(--text)' } }, bdi(mp.text, src)));
    if (daily.revealed) {
      flash.appendChild(el('div', { class: 'pb-big' }, bdi(tp.text, target)));
      if (tp.tr) flash.appendChild(el('div', { class: 'pb-tr', text: tp.tr }));
    } else flash.appendChild(el('div', { class: 'hint', text: t('flip') }));
    function reveal() { if (daily.revealed) { say(tp.text); return; } daily.revealed = true; store.set('daily', daily); renderDaily(); say(tp.text); }
    flash.addEventListener('click', reveal);
    flash.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); reveal(); } });
    box.appendChild(flash);
    if (daily.revealed) {
      box.appendChild(el('div', { class: 'row', style: { marginTop: '10px' } },
        el('button', { class: 'btn', text: '🔊 ' + t('listen'), onclick: function () { say(tp.text); } }),
        el('button', { class: 'btn btn-ghost', text: '🐢 ' + t('slow'), onclick: function () { say(tp.text, true); } })));
      box.appendChild(el('div', { class: 'pb-answer-row' },
        el('button', { class: 'btn btn-danger', id: 'didnt', text: t('didnt'), onclick: function () { answer(false); } }),
        el('button', { class: 'btn btn-primary', id: 'knew', text: t('knew'), onclick: function () { answer(true); } })));
    }
  }

  /* ---------------- reset ---------------- */
  $('#reset-progress').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    progress = {}; favs = {}; daily = {}; practice = null;
    store.remove('progress'); store.remove('favs'); store.remove('daily');
    EDU.toast(t('reset_done')); renderAll();
  });

  /* ---------------- language change ---------------- */
  EDU.onLang(function (code) {
    var old = src; src = code;
    if (target === src) target = (old && old !== src && C[old]) ? old : pickDefault();
    stopRec(); practice = null; saveAll(); applyTargetFont(); renderAll();
  });

  function renderAll() {
    renderHeader();
    EDU.$$('#tabs [role=tab]').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.tab === tab)); });
    TABS.forEach(function (n) { $('#panel-' + n).hidden = n !== tab; });
    renderTab();
  }
  applyTargetFont();
  renderAll();
})();
