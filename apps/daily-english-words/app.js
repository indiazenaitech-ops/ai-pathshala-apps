/* Daily English Words: 600 common English words in 60 daily lists of 10.
   Learn (meaning in your language, respelling, example + translation, audio) → practise (pick the meaning,
   type the word, listen and pick) → spaced repetition queue (again / hard / good / easy) with a daily goal,
   streak, packs, a printable worksheet and a shareable progress line. Everything stays on the device. */
(function () {
  'use strict';
  var SLUG = 'daily-english-words';
  var store = EDU.store(SLUG);
  var t = EDU.t, el = EDU.el, $ = EDU.$, $$ = EDU.$$;
  var DATA = window.DEW_WORDS || { themes: {}, lists: [] };
  var LISTS = DATA.lists || [];
  var N = LISTS.length, TOTAL = 0;
  LISTS.forEach(function (L) { TOTAL += L.words.length; });
  var GOALS = [5, 10, 20], MAX_IV = 180, PRACTICE_N = 10;
  var PACKS = [
    { id: 'all', icon: '📚', themes: null },
    { id: 'interview', icon: '🎯', themes: ['interview', 'office'] },
    { id: 'whatsapp', icon: '💬', themes: ['phone', 'greetings', 'feelings'] },
    { id: 'shop', icon: '🛒', themes: ['shop', 'money', 'numbers'] },
    { id: 'travel', icon: '🧳', themes: ['travel', 'nature', 'time'] },
    { id: 'school', icon: '🎒', themes: ['school', 'connectors', 'describing'] },
    { id: 'health', icon: '🩺', themes: ['health', 'home', 'food'] }
  ];

  EDU.init({ slug: SLUG, title: 'app_title', waKey: 'shell_wa_tool' });

  /* ================================================================ helpers */
  function today() { var d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); }
  function num(x) { return EDU.fmt(x); }
  function toast(k, vars) { EDU.toast(t(k, vars)); }
  function int(v, lo, hi, d) { v = parseInt(v, 10); return isNaN(v) ? d : Math.max(lo, Math.min(hi, v)); }
  function reduced() { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function scrollTo(node) { if (!node) return; try { node.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' }); } catch (e) { } }
  function focus(node) { if (node) try { node.focus({ preventScroll: true }); } catch (e) { node.focus(); } }
  function escRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function normEn(s) { return String(s || '').toLowerCase().replace(/[’‘`]/g, "'").replace(/[-\s]+/g, ' ').trim(); }
  /* the word as it appears in its sentence: "minute" also matches "minutes", "carry" matches "carries" */
  function formRe(w) {
    var b = escRe(w), alts = [b, b + 's', b + 'es', b + 'ed', b + 'd', b + 'ing'];
    if (/e$/.test(w)) alts.push(escRe(w.slice(0, -1)) + 'ing');
    if (/y$/.test(w)) { alts.push(escRe(w.slice(0, -1)) + 'ies'); alts.push(escRe(w.slice(0, -1)) + 'ied'); }
    alts.sort(function (a, b2) { return b2.length - a.length; });
    return new RegExp('(^|[^A-Za-z])(' + alts.join('|') + ')(?![A-Za-z])', 'i');
  }
  function lev(a, b) {
    var prev = [], cur, i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur = [i];
      for (j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[b.length];
  }

  /* content in the page language, falling back to English */
  function C() { var A = window.APP_CONTENT || {}; return A[EDU.lang] || A.en || { titles: [], lists: [] }; }
  function word(li, wi) {                      /* one word with everything the UI needs */
    var L = LISTS[li]; if (!L) return null;
    var w = L.words[wi]; if (!w) return null;
    var cur = C(), en = (window.APP_CONTENT || {}).en || { lists: [] };
    var m = (cur.lists[li] || [])[wi] || [], me = (en.lists[li] || [])[wi] || [];
    return { li: li, wi: wi, id: w[0], w: w[0], p: w[1], k: w[2], ex: w[3],
      m: m[0] || me[0] || '', tr: EDU.lang === 'en' ? '' : (m[1] || ''), mEn: me[0] || '' };
  }
  function listTitle(li) { return C().titles[li] || (LISTS[li] && LISTS[li].id) || ''; }
  function themeName(id) { return EDU.has('theme_' + id) ? t('theme_' + id) : id; }
  function posName(k) { return EDU.has('pos_' + k) ? t('pos_' + k) : k; }
  function whenText(day) {
    var diff = day - today();
    if (diff <= 0) return t('when_today');
    if (diff === 1) return t('when_tomorrow');
    return t('when_days', { n: num(diff) });
  }
  function ivText(days) { return days <= 0 ? t('when_today') : days === 1 ? t('iv_1') : t('iv_n', { n: num(days) }); }

  /* ================================================================ speech */
  var V = { ready: false, en: true };
  function onVoices(list) {
    V.ready = true;
    V.en = !list || !list.length || list.some(function (v) { return /^en([-_]|$)/i.test(String(v.lang || '')); });
  }
  if (window.speechSynthesis) {
    EDU.getVoices().then(onVoices);
    try { if (speechSynthesis.addEventListener) speechSynthesis.addEventListener('voiceschanged', function () { onVoices(speechSynthesis.getVoices()); }); } catch (e) { }
  } else onVoices(null);
  function say(text, rate) {
    text = String(text || '').trim();
    if (!text) return Promise.resolve(false);
    if (!window.speechSynthesis || (V.ready && !V.en)) { toast('no_voice'); return Promise.resolve(false); }
    return EDU.speak(text, { lang: 'en', rate: rate || 0.9 }).then(function (ok) { if (!ok) toast('no_voice'); return ok; });
  }

  /* ================================================================ state */
  var settings = store.get('settings', {}) || {};
  settings = {
    goal: GOALS.indexOf(settings.goal) >= 0 ? settings.goal : 10,
    mode: ['mcq', 'type', 'listen'].indexOf(settings.mode) >= 0 ? settings.mode : 'mcq',
    pool: settings.pool === 'learned' ? 'learned' : 'list',
    hide: !!settings.hide,
    pack: PACKS.some(function (p) { return p.id === settings.pack; }) ? settings.pack : 'all'
  };
  function saveSettings() { store.set('settings', settings); }

  var srs = store.get('srs', {});                   /* word -> {iv, due, n, bad} */
  if (!srs || typeof srs !== 'object' || Array.isArray(srs)) srs = {};
  (function cleanSrs() {
    var valid = {}; LISTS.forEach(function (L) { L.words.forEach(function (w) { valid[w[0]] = 1; }); });
    Object.keys(srs).forEach(function (k) {
      var c = srs[k];
      if (!valid[k] || !c || typeof c !== 'object') { delete srs[k]; return; }
      srs[k] = { iv: int(c.iv, 0, MAX_IV, 0), due: int(c.due, 0, 1e7, today()), n: int(c.n, 0, 1e6, 0), bad: int(c.bad, 0, 1e6, 0) };
    });
  })();
  function saveSrs() { if (!store.set('srs', srs)) toast('storage_full'); }

  var daily = store.get('daily', null);
  if (!daily || typeof daily !== 'object' || daily.day !== today()) daily = { day: today(), words: {}, reviews: 0 };
  if (!daily.words || typeof daily.words !== 'object') daily.words = {};
  var streak = store.get('streak', null);
  if (!streak || typeof streak !== 'object') streak = { last: -9, n: 0, best: 0 };
  streak = { last: int(streak.last, -9, 1e7, -9), n: int(streak.n, 0, 1e6, 0), best: int(streak.best, 0, 1e6, 0) };
  var totals = store.get('totals', {}) || {};
  totals = { reviews: int(totals.reviews, 0, 1e9, 0) };
  function saveDaily() { store.set('daily', daily); store.set('streak', streak); store.set('totals', totals); }

  var pin = store.get('pin', null);                 /* the list the user opened today */
  function learnedCount(li) { var n = 0; LISTS[li].words.forEach(function (w) { if (srs[w[0]]) n++; }); return n; }
  function firstUnlearned() {
    for (var i = 0; i < N; i++) if (learnedCount(i) < LISTS[i].words.length) return i;
    return N ? (today() % N) : 0;
  }
  var cur = (pin && pin.day === today() && typeof pin.i === 'number' && LISTS[pin.i]) ? pin.i : firstUnlearned();
  function setCur(i) {
    cur = Math.max(0, Math.min(N - 1, i));
    store.set('pin', { day: today(), i: cur });
  }

  var tab = store.get('tab', 'learn');
  if (['learn', 'practice', 'review', 'lists'].indexOf(tab) < 0) tab = 'learn';
  var prac = null, rev = null, revealed = {};

  /* ---- progress bookkeeping ---- */
  function streakNow() { var td = today(); return streak.last === td || streak.last === td - 1 ? streak.n : 0; }
  function goalCount() { return Object.keys(daily.words).length; }
  function touch(ids) {                             /* words worked on today → daily goal → streak */
    var before = goalCount(), td = today();
    if (daily.day !== td) daily = { day: td, words: {}, reviews: 0 };
    ids.forEach(function (id) { daily.words[id] = 1; });
    var after = goalCount();
    if (before < settings.goal && after >= settings.goal && streak.last !== td) {
      streak.n = streak.last === td - 1 ? streak.n + 1 : 1;
      streak.last = td;
      if (streak.n > streak.best) streak.best = streak.n;
      toast('goal_done', { n: num(streak.n) });
    }
    saveDaily();
  }
  function dueIds() {
    var td = today(), out = [];
    LISTS.forEach(function (L, li) { L.words.forEach(function (w, wi) { var c = srs[w[0]]; if (c && c.due <= td) out.push({ id: w[0], li: li, wi: wi, due: c.due }); }); });
    out.sort(function (a, b) { return (a.due - b.due) || (a.li - b.li) || (a.wi - b.wi); });
    return out.map(function (x) { return x.id; });
  }
  function nextDueDay() { var td = today(), m = Infinity; Object.keys(srs).forEach(function (k) { if (srs[k].due > td && srs[k].due < m) m = srs[k].due; }); return m === Infinity ? null : m; }
  function totalLearned() { return Object.keys(srs).length; }
  function findWord(id) {
    for (var li = 0; li < N; li++) for (var wi = 0; wi < LISTS[li].words.length; wi++) if (LISTS[li].words[wi][0] === id) return word(li, wi);
    return null;
  }

  /* ================================================================ today card */
  function renderToday() {
    var L = LISTS[cur]; if (!L) return;
    $('#dayBadge').textContent = t('day_n', { n: num(cur + 1) });
    $('#themeBadge').textContent = (DATA.themes[L.theme] || '') + ' ' + themeName(L.theme);
    $('#listTitle').textContent = listTitle(cur);
    var k = learnedCount(cur);
    $('#listSub').textContent = t('list_sub', { a: num(cur * 10 + 1), b: num(cur * 10 + L.words.length), n: num(TOTAL) }) + ' · ' + t('learned_k', { k: num(k), n: num(L.words.length) });
    $('#statStreak').textContent = '🔥 ' + num(streakNow());
    $('#statLearned').textContent = num(totalLearned());
    var due = dueIds().length;
    $('#statDue').textContent = num(due);
    var g = goalCount(), pct = Math.min(100, Math.round(g / settings.goal * 100));
    $('#goalText').textContent = g >= settings.goal ? '✓ ' + t('goal_met') : t('goal_progress', { n: num(g), goal: num(settings.goal) });
    $('#goalBar').style.width = pct + '%';
    $('#goalProg').setAttribute('aria-valuenow', String(pct));
    $('#goalProg').setAttribute('aria-label', t('goal_label'));
    $('#goalWrap').classList.toggle('done', g >= settings.goal);
    $$('#goalSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === String(settings.goal))); });
    $('#goReviewTxt').textContent = t('go_review', { n: num(due) });
    $('#goReview').classList.toggle('btn-accent', due > 0);
    $('#dueBadge').hidden = !due;
    $('#dueBadge').textContent = num(due);
  }
  $('#goalSeg').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-v]'); if (!b) return;
    settings.goal = parseInt(b.getAttribute('data-v'), 10) || 10; saveSettings(); renderToday();
  });
  $('#goLearn').addEventListener('click', function () { setTab('learn'); scrollTo($('#p-learn')); });
  $('#goPractice').addEventListener('click', function () { setTab('practice'); scrollTo($('#p-practice')); });
  $('#goReview').addEventListener('click', function () { setTab('review'); scrollTo($('#p-review')); });

  /* ================================================================ tabs */
  var TABS = ['learn', 'practice', 'review', 'lists'];
  function setTab(name) {
    tab = name; store.set('tab', tab);
    TABS.forEach(function (k) {
      var b = $('#tab-' + k), on = k === tab;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      $('#p-' + k).hidden = !on;
    });
    renderPanel(tab);
  }
  function renderPanel(k) {
    if (k === 'learn') renderLearn();
    else if (k === 'practice') renderPractice();
    else if (k === 'review') renderReview();
    else renderLists();
  }
  TABS.forEach(function (k, i) {
    var b = $('#tab-' + k);
    b.addEventListener('click', function () { setTab(k); });
    b.addEventListener('keydown', function (e) {
      var dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!dir) return;
      if (document.documentElement.dir === 'rtl') dir = -dir;
      var nk = TABS[(i + dir + TABS.length) % TABS.length];
      setTab(nk); $('#tab-' + nk).focus(); e.preventDefault();
    });
  });

  /* ================================================================ learn */
  function statusBadge(id) {
    var c = srs[id];
    if (!c) return el('span', { class: 'badge', text: t('status_new') });
    if (c.due <= today()) return el('span', { class: 'badge accent', text: t('status_due') });
    return el('span', { class: 'badge success', text: t('status_in', { when: whenText(c.due) }) });
  }
  function exNode(wd, cls) {                        /* the sentence with the word highlighted */
    var n = el('div', { class: 'dew-ex no-i18n ' + (cls || ''), lang: 'en', dir: 'ltr' }), m = wd.ex.match(formRe(wd.w));
    if (!m) { n.textContent = wd.ex; return n; }
    var i = m.index + m[1].length;
    n.appendChild(document.createTextNode(wd.ex.slice(0, i)));
    n.appendChild(el('b', { text: m[2] }));
    n.appendChild(document.createTextNode(wd.ex.slice(i + m[2].length)));
    return n;
  }
  function renderLearn() {
    var L = LISTS[cur], list = $('#wordList');
    list.innerHTML = '';
    if (!L) return;
    list.classList.toggle('dew-hidden', settings.hide);
    $('#hideChk').checked = settings.hide;
    $('#prevList').disabled = cur <= 0;
    $('#nextList').disabled = cur >= N - 1;
    var td = today();
    L.words.forEach(function (w, wi) {
      var wd = word(cur, wi), c = srs[wd.id];
      var li = el('li', { class: 'dew-word' + (c ? (c.due <= td ? ' due' : ' known') : '') + (revealed[wd.id] ? ' revealed' : ''), dataset: { w: wd.id } },
        el('span', { class: 'dew-num', 'aria-hidden': 'true', text: num(wi + 1) }),
        el('div', { class: 'dew-main' },
          el('div', { class: 'dew-wrow' },
            el('b', { class: 'dew-w no-i18n', lang: 'en', dir: 'ltr', text: wd.w }),
            el('span', { class: 'badge dew-pos', text: posName(wd.k) }),
            el('span', { class: 'dew-pron no-i18n', lang: 'en', dir: 'ltr', text: wd.p })),
          el('div', { class: 'dew-m', text: wd.m }),
          exNode(wd),
          el('div', { class: 'dew-tr', text: wd.tr }),
          el('button', { type: 'button', class: 'btn btn-sm dew-reveal', text: t('tap_reveal'), onclick: function () { revealed[wd.id] = !revealed[wd.id]; li.classList.toggle('revealed', !!revealed[wd.id]); } })),
        el('div', { class: 'dew-acts' },
          el('div', { class: 'row', style: { gap: '4px' } },
            el('button', { type: 'button', class: 'edu-iconbtn', 'aria-label': t('say_word'), title: t('say_word'), text: '🔊', onclick: function () { say(wd.w); } }),
            el('button', { type: 'button', class: 'edu-iconbtn', 'aria-label': t('say_sentence'), title: t('say_sentence'), text: '💬', onclick: function () { say(wd.ex); } })),
          statusBadge(wd.id)));
      list.appendChild(li);
    });
    var k = learnedCount(cur);
    $('#markTxt').textContent = k >= L.words.length ? t('all_added') : t('mark_learned', { n: num(L.words.length - k) });
    $('#markLearned').disabled = k >= L.words.length;
  }
  $('#hideChk').addEventListener('change', function () { settings.hide = this.checked; saveSettings(); revealed = {}; renderLearn(); });
  $('#prevList').addEventListener('click', function () { if (cur > 0) { setCur(cur - 1); revealed = {}; renderAll(); } });
  $('#nextList').addEventListener('click', function () { if (cur < N - 1) { setCur(cur + 1); revealed = {}; renderAll(); } });
  $('#playAll').addEventListener('click', function () { say(LISTS[cur].words.map(function (w) { return w[0]; }).join('. '), 0.85); });
  $('#fsBtn').addEventListener('click', function () { EDU.fullscreen($('#p-learn')); });
  $('#markLearned').addEventListener('click', function () {
    var L = LISTS[cur], td = today(), added = [];
    L.words.forEach(function (w) { if (!srs[w[0]]) { srs[w[0]] = { iv: 0, due: td, n: 0, bad: 0 }; added.push(w[0]); } });
    if (!added.length) return;
    saveSrs(); touch(added);
    toast('marked_toast', { n: num(added.length) });
    renderAll();
  });

  /* ================================================================ practice */
  function poolWords() {
    if (settings.pool === 'learned') {
      var out = [];
      Object.keys(srs).forEach(function (id) { var wd = findWord(id); if (wd) out.push(wd); });
      return EDU.shuffle(out).slice(0, PRACTICE_N);
    }
    return LISTS[cur].words.map(function (w, wi) { return word(cur, wi); });
  }
  function distractors(wd, n) {                     /* other words: same list first, then anywhere */
    var out = [], seen = {}; seen[wd.id] = 1;
    var same = LISTS[wd.li].words.map(function (w, wi) { return word(wd.li, wi); }).filter(function (x) { return x.id !== wd.id; });
    EDU.shuffle(same).forEach(function (x) { if (out.length < n && !seen[x.id]) { seen[x.id] = 1; out.push(x); } });
    var guard = 0;
    while (out.length < n && guard++ < 200 && TOTAL > n) {
      var li = EDU.randInt(0, N - 1), x = word(li, EDU.randInt(0, LISTS[li].words.length - 1));
      if (x && !seen[x.id] && x.m !== wd.m) { seen[x.id] = 1; out.push(x); }
    }
    return out;
  }
  function startPractice(only) {
    var pool = only || poolWords();
    if (pool.length < 1) return;
    prac = { mode: settings.mode, i: 0, score: 0, state: 'ask', results: [], items: EDU.shuffle(pool).map(function (wd) {
      var opts = EDU.shuffle([wd].concat(distractors(wd, 3)));
      return { wd: wd, opts: opts.map(function (x) { return x.id; }) };
    }) };
    $('#pracInput').value = '';
    renderPractice();
    scrollTo($('#pracRun'));
    if (prac.mode === 'type') focus($('#pracInput'));
    else if (prac.mode === 'listen') say(prac.items[0].wd.w);
  }
  function pracAnswer(given, skip) {
    if (!prac || prac.state !== 'ask') return;
    var it = prac.items[prac.i], wd = it.wd, ok = false, almost = false;
    if (!skip) {
      if (prac.mode === 'type') {
        var g = normEn(given), w = normEn(wd.w), m = wd.ex.match(formRe(wd.w));
        ok = g === w || (m && g === normEn(m[2]));
        if (!ok && w.length >= 6 && lev(g, w) <= 1) { ok = true; almost = true; }
      } else ok = given === wd.id;
    }
    prac.results.push({ wd: wd, ok: ok, given: given || '', skip: !!skip, almost: almost });
    if (ok) prac.score++;
    /* feed the spaced repetition queue: wrong → due today; right and new → tomorrow */
    var td = today(), c = srs[wd.id];
    if (!ok) { srs[wd.id] = { iv: 0, due: td, n: c ? c.n : 0, bad: (c ? c.bad : 0) + 1 }; }
    else if (!c) srs[wd.id] = { iv: 1, due: td + 1, n: 1, bad: 0 };
    saveSrs(); touch([wd.id]);
    prac.state = 'shown';
    renderPractice();
    focus($('#pracNext'));
    renderToday();
  }
  function pracNext() {
    if (!prac || prac.state !== 'shown') return;
    prac.i++;
    $('#pracInput').value = '';
    if (prac.i >= prac.items.length) { prac.state = 'done'; renderPractice(); focus($('#pracNew')); return; }
    prac.state = 'ask';
    renderPractice();
    if (prac.mode === 'type') focus($('#pracInput'));
    else { if (prac.mode === 'listen') say(prac.items[prac.i].wd.w); focus($('#pracOptions button')); }
  }
  function renderPractice() {
    $('#pracSetup').hidden = !!prac;
    $('#pracRun').hidden = !prac || prac.state === 'done';
    $('#pracResult').hidden = !prac || prac.state !== 'done';
    if (!prac) {
      $$('#modeSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === settings.mode)); });
      $$('#poolSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === settings.pool)); });
      var can = settings.pool === 'list' || totalLearned() >= 4;
      $('#poolWarn').hidden = can;
      $('#startPractice').disabled = !can;
      $('#pracHelp').textContent = settings.pool === 'list' ? t('practice_help_list', { title: listTitle(cur), n: num(cur + 1) }) : t('practice_help_learned', { n: num(Math.min(PRACTICE_N, totalLearned())) });
      return;
    }
    if (prac.state !== 'done') {
      var it = prac.items[prac.i], wd = it.wd, total = prac.items.length, shown = prac.state === 'shown';
      var res = shown ? prac.results[prac.results.length - 1] : null;
      $('#pracCount').textContent = t('q_of', { n: num(prac.i + 1), total: num(total) });
      $('#pracBar').style.width = Math.round(prac.i / total * 100) + '%';
      $('#pracScore').textContent = t('score') + ': ' + num(prac.score);
      $('#pracSpeak').hidden = prac.mode === 'type' && !shown;
      var pr = $('#pracPrompt');
      pr.innerHTML = '';
      pr.setAttribute('data-w', shown || prac.mode !== 'listen' ? wd.id : '');
      if (prac.mode === 'mcq') {
        pr.appendChild(el('p', { class: 'dew-ask', text: t('mcq_prompt') }));
        pr.appendChild(el('b', { class: 'dew-w no-i18n', lang: 'en', dir: 'ltr', text: wd.w }));
        pr.appendChild(el('span', { class: 'dew-pron no-i18n', lang: 'en', dir: 'ltr', text: wd.p + ' · ' + posName(wd.k) }));
        if (shown) { pr.appendChild(exNode(wd)); if (wd.tr) pr.appendChild(el('div', { class: 'dew-tr', text: wd.tr })); }
      } else if (prac.mode === 'type') {
        pr.appendChild(el('p', { class: 'dew-ask', text: t('type_prompt') }));
        pr.appendChild(el('div', { class: 'dew-m', text: wd.m }));
        var m = wd.ex.match(formRe(wd.w)), ex = el('div', { class: 'dew-ex no-i18n', lang: 'en', dir: 'ltr' });
        if (m && !shown) {
          var i = m.index + m[1].length;
          ex.appendChild(document.createTextNode(wd.ex.slice(0, i)));
          ex.appendChild(el('span', { class: 'dew-blank', 'aria-label': t('blank'), text: ' '.repeat(Math.max(4, m[2].length)) }));
          ex.appendChild(document.createTextNode(wd.ex.slice(i + m[2].length)));
          pr.appendChild(ex);
        } else pr.appendChild(exNode(wd));
        if (wd.tr) pr.appendChild(el('div', { class: 'dew-tr', text: wd.tr }));
        if (shown) pr.appendChild(el('b', { class: 'dew-w no-i18n', lang: 'en', dir: 'ltr', text: wd.w }));
      } else {
        pr.appendChild(el('p', { class: 'dew-ask', text: t('listen_prompt') }));
        pr.appendChild(el('button', { type: 'button', class: 'btn dew-listen', 'aria-label': t('tap_listen'), title: t('tap_listen'), text: '🔊', onclick: function () { say(wd.w); } }));
        pr.appendChild(el('span', { class: 'dew-pron no-i18n', lang: 'en', dir: 'ltr', text: V.ready && !V.en ? wd.p : (shown ? wd.p : '') }));
        if (shown) { pr.appendChild(el('b', { class: 'dew-w no-i18n', lang: 'en', dir: 'ltr', text: wd.w })); pr.appendChild(el('div', { class: 'dew-m', text: wd.m })); }
      }
      var box = $('#pracOptions');
      box.innerHTML = '';
      box.hidden = prac.mode === 'type';
      box.className = 'dew-options' + (prac.mode === 'listen' ? ' en' : '') + (prac.mode === 'mcq' ? ' one' : '');
      if (prac.mode !== 'type') {
        it.opts.forEach(function (id, k) {
          var x = findWord(id), cls = 'dew-opt' + (prac.mode === 'listen' ? ' en no-i18n' : '');
          if (shown && id === wd.id) cls += ' ok';
          if (shown && res && res.given === id && id !== wd.id) cls += ' bad';
          var b = el('button', { type: 'button', class: cls, dataset: { w: id }, disabled: shown, 'aria-pressed': shown && res && res.given === id ? 'true' : 'false',
            onclick: function () { pracAnswer(id, false); } },
            el('span', { class: 'k', 'aria-hidden': 'true', text: String(k + 1) }),
            el('span', { lang: prac.mode === 'listen' ? 'en' : undefined, dir: prac.mode === 'listen' ? 'ltr' : undefined, text: prac.mode === 'listen' ? x.w : x.m }));
          box.appendChild(b);
        });
      }
      $('#pracTypeWrap').hidden = prac.mode !== 'type';
      $('#pracInput').disabled = shown;
      $('#pracAskRow').hidden = shown;
      $('#pracNextRow').hidden = !shown;
      var fb = $('#pracFeedback');
      fb.innerHTML = ''; fb.className = '';
      if (res) {
        fb.className = 'callout ' + (res.ok ? 'success' : 'danger');
        fb.appendChild(el('strong', { text: res.ok ? (res.almost ? t('almost') : t('correct')) : (res.skip ? t('answer_label') : t('wrong')) }));
        if (!res.ok || res.almost) {
          fb.appendChild(document.createTextNode(' '));
          if (!res.ok && !res.skip) fb.appendChild(el('span', { text: t('answer_label') + ' ' }));
          fb.appendChild(el('b', { class: 'no-i18n', lang: 'en', dir: 'ltr', text: wd.w }));
          if (prac.mode !== 'mcq') fb.appendChild(el('span', { text: ' · ' + wd.m }));
        }
      }
      return;
    }
    var n = prac.results.length, k = prac.results.filter(function (r) { return r.ok; }).length;
    $('#pracFinal').textContent = num(k) + ' / ' + num(n);
    var p = n ? k / n : 0;
    $('#pracMsg').textContent = t(p >= 0.9 ? 'msg_great' : p >= 0.6 ? 'msg_good' : 'msg_try');
    var wrong = prac.results.filter(function (r) { return !r.ok; }), ul = $('#pracMist');
    ul.innerHTML = '';
    $('#mistHead').hidden = !wrong.length;
    wrong.forEach(function (r) {
      ul.appendChild(el('li', {}, el('b', { class: 'no-i18n', lang: 'en', dir: 'ltr', text: r.wd.w }), el('span', { class: 'muted', text: r.wd.p }), el('span', { text: r.wd.m })));
    });
    $('#pracRetry').hidden = !wrong.length;
  }
  $('#modeSeg').addEventListener('click', function (e) { var b = e.target.closest('button[data-v]'); if (!b) return; settings.mode = b.getAttribute('data-v'); saveSettings(); renderPractice(); });
  $('#poolSeg').addEventListener('click', function (e) { var b = e.target.closest('button[data-v]'); if (!b) return; settings.pool = b.getAttribute('data-v'); saveSettings(); renderPractice(); });
  $('#startPractice').addEventListener('click', function () { startPractice(); });
  $('#pracCheck').addEventListener('click', function () { var v = $('#pracInput').value; if (!v.trim()) { focus($('#pracInput')); return; } pracAnswer(v, false); });
  $('#pracSkip').addEventListener('click', function () { pracAnswer('', true); });
  $('#pracInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); var v = this.value; if (v.trim()) pracAnswer(v, false); } });
  $('#pracNext').addEventListener('click', pracNext);
  $('#pracSpeak').addEventListener('click', function () { if (prac && prac.items[prac.i]) say(prac.items[prac.i].wd.w); });
  $('#pracEnd').addEventListener('click', function () {
    if (!prac) return;
    if (!prac.results.length) { prac = null; renderPractice(); return; }
    prac.state = 'done'; renderPractice();
  });
  $('#pracRetry').addEventListener('click', function () { startPractice(prac.results.filter(function (r) { return !r.ok; }).map(function (r) { return r.wd; })); });
  $('#pracNew').addEventListener('click', function () { prac = null; renderPractice(); focus($('#startPractice')); });
  $('#pracToReview').addEventListener('click', function () { prac = null; renderPractice(); setTab('review'); scrollTo($('#p-review')); });
  document.addEventListener('keydown', function (e) {
    if (tab !== 'practice' || !prac || prac.state === 'done' || prac.mode === 'type' || $('#p-practice').hidden) return;
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.edu-modal-back')) return;
    var tg = e.target; if (tg && tg.closest && tg.closest('input, textarea, select')) return;
    if (prac.state === 'ask' && /^[1-4]$/.test(e.key)) { var b = $$('#pracOptions button')[+e.key - 1]; if (b) { e.preventDefault(); b.click(); } }
    else if (prac.state === 'shown' && e.key === 'Enter' && !(tg && tg.closest('button'))) { e.preventDefault(); pracNext(); }
  });

  /* ================================================================ review (spaced repetition) */
  function schedule(c, r) {                         /* r: again | hard | good | easy → next interval in days */
    var iv = c.iv || 0;
    if (r === 'again') return 0;
    if (r === 'hard') return Math.min(MAX_IV, Math.max(1, Math.round(iv * 1.2)));
    if (r === 'good') return Math.min(MAX_IV, iv === 0 ? 1 : iv === 1 ? 3 : Math.round(iv * 2.5));
    return Math.min(MAX_IV, iv === 0 ? 4 : Math.round(Math.max(iv, 1) * 4));
  }
  function startReview() {
    var ids = dueIds();
    if (!ids.length) return;
    rev = { queue: ids.slice(), total: ids.length, done: 0, again: 0, flipped: false, seen: {} };
    renderReview();
    scrollTo($('#revRun'));
    focus($('#revCard'));
  }
  function curRev() { return rev && rev.queue.length ? findWord(rev.queue[0]) : null; }
  function flip() { if (!rev || !rev.queue.length) return; rev.flipped = !rev.flipped; renderReview(); }
  function rate(r) {
    if (!rev || !rev.flipped) return;
    var wd = curRev(); if (!wd) return finishReview();
    var c = srs[wd.id] || { iv: 0, due: today(), n: 0, bad: 0 }, iv = schedule(c, r), td = today();
    c.iv = iv; c.due = td + iv; c.n++;
    if (r === 'again') c.bad++;
    srs[wd.id] = c;
    rev.queue.shift();
    if (!rev.seen[wd.id]) { rev.seen[wd.id] = 1; daily.reviews++; totals.reviews++; }
    if (r === 'again') { rev.again++; rev.queue.splice(Math.min(rev.queue.length, 2), 0, wd.id); }
    else rev.done++;
    saveSrs(); touch([wd.id]);
    rev.flipped = false;
    if (!rev.queue.length) finishReview(); else { renderReview(); focus($('#revCard')); }
    renderToday();
  }
  function finishReview() {
    if (!rev) return;
    if (!Object.keys(rev.seen).length) { rev = null; renderReview(); return; }
    rev.finished = true;
    renderReview();
    focus($('#revDoneBtn'));
  }
  function renderReview() {
    var due = dueIds();
    $('#revStart').hidden = !!rev;
    $('#revRun').hidden = !rev || !!rev.finished;
    $('#revDone').hidden = !rev || !rev.finished;
    if (!rev) {
      var any = totalLearned() > 0, nd = nextDueDay();
      $('#dueCount').textContent = num(due.length);
      $('#revEmpty').hidden = any;
      $('#revAllDone').hidden = !any || due.length > 0;
      $('#revNext').hidden = !(any && !due.length && nd !== null);
      $('#revNext').textContent = nd !== null ? t('next_due', { when: whenText(nd) }) : '';
      $('#startReview').hidden = !due.length;
      $('#revGoLearn').hidden = any && due.length > 0;
      return;
    }
    if (!rev.finished) {
      var wd = curRev(); if (!wd) { finishReview(); return; }
      var c = srs[wd.id] || { iv: 0 };
      $('#revCount').textContent = t('left_n', { n: num(rev.queue.length) });
      $('#revBar').style.width = Math.round(rev.done / rev.total * 100) + '%';
      var card = $('#revCard');
      card.innerHTML = '';
      card.classList.toggle('back', rev.flipped);
      card.setAttribute('data-w', wd.id);
      card.setAttribute('aria-label', rev.flipped ? t('show_answer') : t('tap_flip'));
      card.appendChild(el('span', { class: 'dew-side', text: rev.flipped ? t('side_back') : t('side_front') }));
      card.appendChild(el('b', { class: 'dew-w no-i18n', lang: 'en', dir: 'ltr', text: wd.w }));
      card.appendChild(el('span', { class: 'dew-pron no-i18n', lang: 'en', dir: 'ltr', text: wd.p + ' · ' + posName(wd.k) }));
      if (rev.flipped) {
        card.appendChild(el('div', { class: 'dew-m', text: wd.m }));
        card.appendChild(exNode(wd));
        if (wd.tr) card.appendChild(el('div', { class: 'dew-tr', text: wd.tr }));
      } else card.appendChild(el('span', { class: 'muted small', text: t('tap_flip') }));
      $('#revFlipRow').hidden = rev.flipped;
      $('#revRate').hidden = !rev.flipped;
      $('#ivAgain').textContent = ivText(schedule(c, 'again'));
      $('#ivHard').textContent = ivText(schedule(c, 'hard'));
      $('#ivGood').textContent = ivText(schedule(c, 'good'));
      $('#ivEasy').textContent = ivText(schedule(c, 'easy'));
      return;
    }
    $('#sumReviewed').textContent = num(Object.keys(rev.seen).length);
    $('#sumAgain').textContent = num(rev.again);
    $('#sumStreak').textContent = '🔥 ' + num(streakNow());
    var nd2 = nextDueDay();
    $('#sumNext').textContent = due.length ? t('more_due', { n: num(due.length) }) : nd2 !== null ? t('next_due', { when: whenText(nd2) }) : '';
  }
  $('#startReview').addEventListener('click', startReview);
  $('#revGoLearn').addEventListener('click', function () { setTab('learn'); scrollTo($('#p-learn')); });
  $('#revCard').addEventListener('click', flip);
  $('#revShow').addEventListener('click', function () { flip(); focus($('#revCard')); });
  $('#rateAgain').addEventListener('click', function () { rate('again'); });
  $('#rateHard').addEventListener('click', function () { rate('hard'); });
  $('#rateGood').addEventListener('click', function () { rate('good'); });
  $('#rateEasy').addEventListener('click', function () { rate('easy'); });
  $('#revSpeak').addEventListener('click', function () { var wd = curRev(); if (wd) say(rev.flipped ? wd.w + '. ' + wd.ex : wd.w); });
  $('#revEnd').addEventListener('click', finishReview);
  $('#revDoneBtn').addEventListener('click', function () { rev = null; renderReview(); focus($('#startReview').hidden ? $('#tab-learn') : $('#startReview')); });
  document.addEventListener('keydown', function (e) {
    if (tab !== 'review' || !rev || rev.finished || $('#p-review').hidden) return;
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.edu-modal-back')) return;
    var tg = e.target; if (tg && tg.closest && tg.closest('input, textarea, select')) return;
    if (e.key === ' ' || e.key === 'Enter') { if (tg && tg.closest && tg.closest('button, a, summary') && tg !== $('#revCard')) return; e.preventDefault(); flip(); }
    else if (rev.flipped && /^[1-4]$/.test(e.key)) { e.preventDefault(); rate(['again', 'hard', 'good', 'easy'][+e.key - 1]); }
  });

  /* ================================================================ lists & packs */
  function packLists(p) { return LISTS.map(function (L, i) { return i; }).filter(function (i) { return !p.themes || p.themes.indexOf(LISTS[i].theme) >= 0; }); }
  function renderLists() {
    var chips = $('#packChips');
    chips.innerHTML = '';
    PACKS.forEach(function (p) {
      chips.appendChild(el('button', { type: 'button', class: 'chip', 'aria-pressed': String(p.id === settings.pack), dataset: { pack: p.id },
        onclick: function () { settings.pack = p.id; saveSettings(); renderLists(); } },
        el('span', { 'aria-hidden': 'true', text: p.icon }), el('span', { text: t('pack_' + p.id) })));
    });
    var p = PACKS.filter(function (x) { return x.id === settings.pack; })[0] || PACKS[0], idx = packLists(p), td = today();
    var learnedIn = 0; idx.forEach(function (i) { learnedIn += learnedCount(i); });
    $('#packInfo').textContent = t('pack_info', { n: num(idx.length), w: num(idx.length * 10), k: num(learnedIn) });
    var grid = $('#listGrid');
    grid.innerHTML = '';
    idx.forEach(function (i) {
      var L = LISTS[i], k = learnedCount(i), due = 0;
      L.words.forEach(function (w) { var c = srs[w[0]]; if (c && c.due <= td) due++; });
      grid.appendChild(el('li', { class: 'dew-list' + (i === cur ? ' cur' : '') + (k >= L.words.length ? ' full' : ''), dataset: { i: String(i) } },
        el('div', { style: { minWidth: '0' } },
          el('div', { class: 'dew-list-t' }, el('span', { class: 'badge primary', text: t('day_n', { n: num(i + 1) }) }), el('span', { text: listTitle(i) })),
          el('div', { class: 'dew-list-s' },
            el('span', { text: (DATA.themes[L.theme] || '') + ' ' + themeName(L.theme) }),
            el('span', { text: t('learned_k', { k: num(k), n: num(L.words.length) }) }),
            due ? el('span', { class: 'badge accent', text: t('due_n', { n: num(due) }) }) : null)),
        el('button', { type: 'button', class: 'btn btn-sm' + (i === cur ? ' btn-primary' : ''), text: t('open_list'), 'aria-label': t('open_list') + ': ' + listTitle(i),
          onclick: function () { setCur(i); revealed = {}; renderAll(); setTab('learn'); scrollTo($('#todayCard')); } }),
        el('div', { class: 'progress', 'aria-hidden': 'true' }, el('span', { style: { width: Math.round(k / L.words.length * 100) + '%' } }))));
    });
    /* progress */
    var full = 0; LISTS.forEach(function (L, i) { if (learnedCount(i) >= L.words.length) full++; });
    $('#psWords').textContent = num(totalLearned()) + ' / ' + num(TOTAL);
    $('#psLists').textContent = num(full) + ' / ' + num(N);
    $('#psBest').textContent = '🔥 ' + num(Math.max(streak.best, streakNow()));
    $('#psReviews').textContent = num(totals.reviews);
    var txt = shareText();
    $('#waShare').href = 'https://wa.me/?text=' + encodeURIComponent(txt);
    $('#nativeShare').hidden = !navigator.share;
  }
  function pageUrl() { var u = location.href.split('#')[0].split('?')[0]; return u + '?lang=' + EDU.lang; }
  function shareText() { return t('share_text', { n: num(totalLearned()), d: num(cur + 1), s: num(streakNow()) }) + '\n' + pageUrl(); }
  $('#copyShare').addEventListener('click', function () { EDU.copy(shareText()); });
  $('#nativeShare').addEventListener('click', function () { EDU.share(pageUrl(), shareText()); });
  $('#backupBtn').addEventListener('click', function () {
    EDU.download('daily-english-words-progress.json', JSON.stringify({ app: SLUG, at: new Date().toISOString(), srs: srs, streak: streak, daily: daily, totals: totals, settings: settings }, null, 1), 'application/json');
  });
  $('#restoreBtn').addEventListener('click', function () {
    EDU.pickFile('.json,application/json').then(function (f) {
      if (!f) return;
      return EDU.readText(f).then(function (txt) {
        var d = null; try { d = JSON.parse(txt); } catch (e) { d = null; }
        if (!d || d.app !== SLUG || !d.srs || typeof d.srs !== 'object') { toast('restore_bad'); return; }
        srs = d.srs; store.set('srs', srs);
        if (d.streak && typeof d.streak === 'object') { streak = { last: int(d.streak.last, -9, 1e7, -9), n: int(d.streak.n, 0, 1e6, 0), best: int(d.streak.best, 0, 1e6, 0) }; }
        if (d.totals && typeof d.totals === 'object') totals = { reviews: int(d.totals.reviews, 0, 1e9, 0) };
        if (d.daily && typeof d.daily === 'object' && d.daily.day === today()) daily = { day: today(), words: d.daily.words || {}, reviews: int(d.daily.reviews, 0, 1e6, 0) };
        saveDaily();
        /* re-validate on next load; for now drop unknown words */
        Object.keys(srs).forEach(function (k) { if (!findWord(k)) delete srs[k]; else srs[k] = { iv: int(srs[k].iv, 0, MAX_IV, 0), due: int(srs[k].due, 0, 1e7, today()), n: int(srs[k].n, 0, 1e6, 0), bad: int(srs[k].bad, 0, 1e6, 0) }; });
        saveSrs();
        toast('restore_ok'); prac = null; rev = null; renderAll();
      });
    });
  });
  $('#resetBtn').addEventListener('click', function () {
    if (!confirm(t('confirm_reset'))) return;
    srs = {}; daily = { day: today(), words: {}, reviews: 0 }; streak = { last: -9, n: 0, best: 0 }; totals = { reviews: 0 };
    store.remove('srs'); store.remove('daily'); store.remove('streak'); store.remove('totals'); store.remove('pin');
    prac = null; rev = null; revealed = {}; cur = 0;
    toast('reset_done'); renderAll();
  });

  /* ================================================================ printable worksheet */
  function buildPrint() {
    var L = LISTS[cur], pa = $('#printArea');
    pa.innerHTML = '';
    if (!L) return;
    pa.appendChild(el('h1', {}, t('app_title') + ' · ' + t('day_n', { n: num(cur + 1) }) + ': ', el('span', { text: listTitle(cur) })));
    pa.appendChild(el('div', { class: 'pr-meta' },
      el('span', { text: t('print_name') + ': ______________________' }),
      el('span', { text: t('print_class') + ': ____________' }),
      el('span', { text: t('print_date') + ': ____________' })));
    pa.appendChild(el('h2', { text: t('print_a') }));
    var tbl = el('table', { class: 'pr-table' }, el('thead', {}, el('tr', {},
      el('th', { class: 'pr-n', text: '#' }), el('th', { text: t('print_col_word') }), el('th', { text: t('print_col_meaning') }),
      el('th', { text: t('print_col_ex') }), el('th', { class: 'pr-own', text: t('print_col_own') }))));
    var tb = el('tbody');
    L.words.forEach(function (w, wi) {
      var wd = word(cur, wi);
      tb.appendChild(el('tr', {},
        el('td', { class: 'pr-n', text: num(wi + 1) }),
        el('td', {}, el('div', { class: 'pr-w no-i18n', lang: 'en', dir: 'ltr', text: wd.w }), el('div', { class: 'pr-p no-i18n', lang: 'en', dir: 'ltr', text: wd.p })),
        el('td', {}, el('div', { text: wd.m }), wd.tr ? el('div', { class: 'small', style: { color: '#444', marginTop: '3pt' }, text: wd.tr }) : null),
        el('td', { class: 'no-i18n', lang: 'en', dir: 'ltr', text: wd.ex }),
        el('td', { class: 'pr-own' })));
    });
    tbl.appendChild(tb);
    pa.appendChild(tbl);
    pa.appendChild(el('h2', { text: t('print_b') }));
    pa.appendChild(el('div', { class: 'pr-bank' }, el('b', { text: t('print_word_bank') + ': ' }),
      el('span', { class: 'no-i18n', lang: 'en', dir: 'ltr', text: EDU.shuffle(L.words.map(function (w) { return w[0]; })).join(' · ') })));
    var ol = el('ol', { class: 'pr-blanks' });
    EDU.shuffle(L.words.map(function (w, wi) { return wi; })).forEach(function (wi) {
      var wd = word(cur, wi), m = wd.ex.match(formRe(wd.w)), li = el('li', { class: 'no-i18n', lang: 'en', dir: 'ltr' });
      if (m) { var i = m.index + m[1].length; li.textContent = wd.ex.slice(0, i) + '_______________' + wd.ex.slice(i + m[2].length); }
      else li.textContent = wd.ex;
      li.appendChild(el('span', { lang: EDU.lang, dir: 'auto', style: { color: '#444', fontSize: '10pt' }, text: '  (' + wd.m + ')' }));
      ol.appendChild(li);
    });
    pa.appendChild(ol);
    pa.appendChild(el('p', { class: 'tiny', style: { color: '#555', marginTop: '10pt' }, text: t('print_foot') }));
  }
  $('#printBtn').addEventListener('click', function () { buildPrint(); setTimeout(function () { window.print(); }, 60); });
  window.addEventListener('beforeprint', buildPrint);
  try {
    var printMq = matchMedia('print'), onPrintMq = function (e) { if (e.matches) buildPrint(); };
    if (printMq.addEventListener) printMq.addEventListener('change', onPrintMq); else printMq.addListener(onPrintMq);
  } catch (e) { }

  /* ================================================================ boot */
  function renderAll() {
    renderToday();
    renderPanel(tab);
    if (tab !== 'lists') { /* keep the share link fresh even when the panel is hidden */ var txt = shareText(); $('#waShare').href = 'https://wa.me/?text=' + encodeURIComponent(txt); }
  }
  setTab(tab);
  renderAll();
  EDU.onLang(function () {
    renderToday();
    renderPanel(tab);
    if (tab !== 'learn') renderLearn();
  });
})();
