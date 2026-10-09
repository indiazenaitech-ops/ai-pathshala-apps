/* Library home (library-first layout, 2026-10-07): a search box with a category picker at the top, then the whole
   catalog (window.EDU_CATALOG from catalog.js) as one grid of colour-coded cards. Audience tabs
   (Everyone · Schools & colleges · Work & business · Marketing & creators) narrow the categories.
   Link parameters: ?for=schools|business|marketing picks the audience, ?cat=<category id> a category, ?q= a search.
   The chosen audience is remembered on this device with EDU.store('home'). */
(function () {
  'use strict';
  var SITE = Object.assign({ zip: '' }, window.EDU_SITE || {});
  /* Category ids: keep in sync with tools/verify.js, tools/build_catalog.js and cat_<id> in home-strings.js.
     This order is the order of the category picker and of the "by category" sort. */
  var CATS = ['learn-ai', 'data', 'everyday', 'business', 'marketing', 'teacher-tools', 'math', 'science', 'coding', 'languages', 'study-skills', 'digital-safety'];
  var SCHOOL_CATS = ['learn-ai', 'data', 'teacher-tools', 'math', 'science', 'coding', 'languages', 'study-skills', 'digital-safety'];
  var CAT_ICON = { 'learn-ai': '🤖', data: '📊', everyday: '🧰', business: '💼', marketing: '📣', 'teacher-tools': '🧑‍🏫', math: '➗', science: '🔬', coding: '💻', languages: '🔤', 'study-skills': '📚', 'digital-safety': '🛡️' };
  var CAT_COLOR = { 'learn-ai': '--c3', data: '--c6', everyday: '--c4', business: '--c1', marketing: '--c5', 'teacher-tools': '--c2', math: '--c7', science: '--c4', coding: '--c3', languages: '--c6', 'study-skills': '--c1', 'digital-safety': '--c5' };
  /* Audiences: which categories each one shows. An audience with no published apps is hidden. */
  var AUDS = [
    { id: 'all', icon: '🌐', cats: CATS },
    { id: 'schools', icon: '🏫', cats: SCHOOL_CATS },
    { id: 'business', icon: '💼', cats: ['business', 'data', 'learn-ai', 'digital-safety'] },
    { id: 'marketing', icon: '📣', cats: ['marketing', 'everyday'] }
  ];
  var APPS = (window.EDU_CATALOG || []).filter(function (a) { return CATS.indexOf(a.category) >= 0; });
  var COUNTS = {}; APPS.forEach(function (a) { COUNTS[a.category] = (COUNTS[a.category] || 0) + 1; });

  EDU.init({ slug: 'home', title: null, home: true, nav: 'apps', strings: window.HOME_STRINGS, waKey: 'wa_home' });
  var $ = EDU.$, el = EDU.el, t = EDU.t;
  var CONF = EDU.SITE || {};
  var store = EDU.store('home');
  /* The home page has no app title, so the shell's header <h1> stays empty; the hero heading is the page's h1. */
  var shellH1 = document.getElementById('edu-title');
  if (shellH1 && !shellH1.textContent.trim()) shellH1.remove();

  function audById(id) { for (var i = 0; i < AUDS.length; i++) if (AUDS[i].id === id) return AUDS[i]; return null; }
  function audCount(au) { return APPS.filter(function (a) { return au.cats.indexOf(a.category) >= 0; }).length; }
  function usable(id) { var au = audById(id); return !!au && (au.id === 'all' || audCount(au) > 0); }

  var aud = 'all', cat = 'all', query = '';
  (function initialState() {
    var p = null;
    try { p = new URLSearchParams(location.search); } catch (e) { }
    var pFor = p && p.get('for'), pCat = p && p.get('cat'), pQ = p && p.get('q');
    if (usable(pFor)) { aud = pFor; store.set('aud', aud); }
    else { var saved = store.get('aud', 'all'); if (usable(saved)) aud = saved; }
    if (pCat && COUNTS[pCat]) { cat = pCat; if (audById(aud).cats.indexOf(cat) < 0) aud = 'all'; }
    if (pQ) { query = pQ.trim(); $('#q').value = query; }
  })();
  function audCats() { return audById(aud).cats; }

  /* Keep ?for=, ?cat= and ?q= in the address bar (bookmarks, links); edu.js keeps ?lang= the same way. */
  function syncUrl() {
    try {
      var u = new URL(location.href);
      if (aud === 'all') u.searchParams.delete('for'); else u.searchParams.set('for', aud);
      if (cat === 'all') u.searchParams.delete('cat'); else u.searchParams.set('cat', cat);
      if (!query) u.searchParams.delete('q'); else u.searchParams.set('q', query);
      if (u.toString() !== location.href) history.replaceState(history.state, '', u.toString());
    } catch (e) { }
  }

  function loc(obj) { return (obj && (obj[EDU.lang] || obj.en)) || ''; }
  function gradesLabel(a) {
    if (SCHOOL_CATS.indexOf(a.category) < 0) return t('grades_any');
    var g = a.grades;
    if (!g || g === 'all') return t('grades_all');
    if (g === 'UG' || g === 'PG') return t('grades_ug');
    return t('grades', { g: g });
  }
  function norm(s) { return String(s || '').toLowerCase(); }
  /* Search score: 0 = no match; title hits rank above description and tag hits. */
  function score(a) {
    if (!query) return 1;
    var q = norm(query), title = norm(loc(a.title) + ' ' + a.title.en);
    if (title.indexOf(q) === 0) return 4;
    if (title.indexOf(q) >= 0) return 3;
    if (norm((a.tags || []).join(' ') + ' ' + a.slug).indexOf(q) >= 0) return 2;
    return norm(loc(a.desc) + ' ' + a.desc.en + ' ' + t('cat_' + a.category)).indexOf(q) >= 0 ? 1 : 0;
  }
  function inView(a) {
    if (audCats().indexOf(a.category) < 0) return false;
    return cat === 'all' || a.category === cat;
  }

  /* AIxploria-style card: number + audience on top, centred icon and name, short description, one tag, one button. */
  /* App links go to the app's page in the chosen language: apps/<slug>/ for English, <lang>/apps/<slug>/ otherwise
     (on a language home page, /<lang>/, the relative apps/<slug>/ already is that page). index.html keeps the ZIP working. */
  function appHref(slug) {
    if (window.EDU_PAGE_LANG) return 'apps/' + slug + '/index.html';
    return (EDU.lang === 'en' ? '' : EDU.lang + '/') + 'apps/' + slug + '/index.html' + (EDU.lang === 'en' ? '?lang=en' : '');
  }
  function card(a, i) {
    var needs = (a.needs || []).map(function (n) { return t('badge_' + n); }).join(' · ');
    return el('a', { class: 'app-card', href: appHref(a.slug), style: { '--cat': 'var(' + (CAT_COLOR[a.category] || '--c1') + ')' } },
      el('div', { class: 'app-top' },
        el('span', { class: 'app-n', 'aria-hidden': 'true', text: EDU.fmt(i + 1) }),
        el('span', { class: 'app-aud', text: gradesLabel(a) })),
      el('div', { class: 'app-name' },
        el('span', { class: 'ic', 'aria-hidden': 'true', text: a.icon }),
        el('h3', { text: loc(a.title) })),
      el('p', { text: loc(a.desc) }),
      el('span', { class: 'cat-tag', text: '# ' + t('cat_' + a.category) + (needs ? ' · ' + needs : '') }),
      el('span', { class: 'app-open' }, el('span', { 'aria-hidden': 'true', text: '↗ ' }), t('open')));
  }

  function rerender() { syncUrl(); renderAud(); renderCats(); renderList(); }

  function renderAud() {
    var box = $('#aud'); if (!box) return;
    box.innerHTML = '';
    AUDS.forEach(function (au) {
      var n = au.id === 'all' ? APPS.length : audCount(au);
      if (au.id !== 'all' && !n) return;
      var b = el('button', { class: 'aud-btn', type: 'button', id: 'aud-' + au.id, 'aria-pressed': String(aud === au.id) },
        el('span', { class: 'aud-txt', text: t('aud_' + au.id) }),
        el('span', { class: 'aud-n', text: EDU.fmt(n) }));
      b.addEventListener('click', function () {
        if (aud === au.id) return;
        aud = au.id; cat = 'all';
        store.set('aud', aud);
        rerender();
      });
      box.appendChild(b);
    });
  }

  /* Category chips under the tabs and the category picker inside the search box show the same choice. */
  function renderCats() {
    var box = $('#cats'), sel = $('#cat-sel');
    box.innerHTML = ''; sel.innerHTML = '';
    var cats = audCats().filter(function (c) { return COUNTS[c]; });
    var total = cats.reduce(function (s, c) { return s + COUNTS[c]; }, 0);
    function mk(id, icon, label, n) {
      var b = el('button', { class: 'chip', type: 'button', 'aria-pressed': String(cat === id) },
        label, el('span', { class: 'tiny', text: EDU.fmt(n) }));
      b.addEventListener('click', function () { setCat(id); });
      box.appendChild(b);
      sel.appendChild(el('option', { value: id, text: (id === 'all' ? t('cat_all_opt') : label) + ' (' + EDU.fmt(n) + ')' }));
    }
    mk('all', '✨', t('all'), total);
    cats.forEach(function (c) { mk(c, CAT_ICON[c] || '•', t('cat_' + c), COUNTS[c]); });
    sel.value = cat;
  }
  function setCat(id) { cat = id; syncUrl(); renderCats(); renderList(); }

  /* "Everyone" with no filter mixes the categories (one app from each in turn), so the first screen
     shows the whole range: AI, everyday tools, work, teaching, maths... A category or search lists in order. */
  function mixed(list) {
    var by = {}, order = [];
    list.forEach(function (a) { if (!by[a.category]) { by[a.category] = []; order.push(a.category); } by[a.category].push(a); });
    var out = [], i = 0, left = list.length;
    while (left) { order.forEach(function (c) { if (by[c][i]) { out.push(by[c][i]); left--; } }); i++; }
    return out;
  }
  function renderList() {
    var list = $('#list'); list.innerHTML = '';
    var shown = APPS.filter(inView);
    var global = false;
    if (query) {
      var scored = function (arr) { return arr.map(function (a) { return [score(a), a]; }).filter(function (p) { return p[0] > 0; }); };
      var hits = scored(shown);
      /* A search that finds nothing for this audience or category looks in the whole library instead. */
      if (!hits.length) { hits = scored(APPS); global = hits.length > 0; }
      hits.sort(function (x, y) { return y[0] - x[0]; });
      shown = hits.map(function (p) { return p[1]; });
    } else if (cat === 'all') shown = mixed(shown);
    shown.forEach(function (a, i) { list.appendChild(card(a, i)); });
    $('#empty').hidden = shown.length > 0;
    $('#count').textContent = shown.length ? t(global ? 'count_all' : 'count_shown', { n: EDU.fmt(shown.length) }) : '';
  }

  function setHref(sel, href) { var e = $(sel); if (e) e.href = href; }
  function setMeta(name, value) { var m = document.querySelector('meta[name="' + name + '"]'); if (m) m.setAttribute('content', value); }

  function renderStatic() {
    var h1 = $('#home-title'), parts = t('lib_title', { n: '\u0000' }).split('\u0000');
    h1.textContent = '';
    h1.appendChild(document.createTextNode(parts[0]));
    if (parts.length > 1) { h1.appendChild(el('b', { text: EDU.fmt(APPS.length) })); h1.appendChild(document.createTextNode(parts[1])); }
    setHref('#subscribe', CONF.subscribe || EDU.YOUTUBE);
    setHref('#schools-link', EDU.ROOT + 'schools.html?lang=' + EDU.lang);
    setHref('#biz-link', EDU.ROOT + 'business.html?lang=' + EDU.lang);
    setHref('#contact-link', EDU.ROOT + 'contact.html?lang=' + EDU.lang);
    var zip = $('#zip'), zipUrl = SITE.zip || CONF.zip;
    if (zip && zipUrl) { zip.hidden = false; zip.href = zipUrl; }
    document.title = t('doc_title');
    setMeta('description', t('doc_desc'));
  }

  APPS.sort(function (a, b) { return CATS.indexOf(a.category) - CATS.indexOf(b.category) || (a.order || 999) - (b.order || 999) || a.title.en.localeCompare(b.title.en); });
  var typing = null;
  $('#q').addEventListener('input', function (e) {
    query = e.target.value.trim(); renderList();
    clearTimeout(typing); typing = setTimeout(syncUrl, 400);
  });
  $('#lib-search').addEventListener('submit', function (e) {
    e.preventDefault(); $('#q').blur();
    var first = $('#list .app-card'); if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  $('#cat-sel').addEventListener('change', function (e) { setCat(e.target.value); });
  $('#share-lib').addEventListener('click', function () { EDU.share(EDU.shareUrl(), t('doc_title')); });

  function renderAll() { renderStatic(); renderAud(); renderCats(); renderList(); }
  EDU.onLang(renderAll);
  renderAll();
  syncUrl();
})();
