/* Library home: renders the catalog (window.EDU_CATALOG from catalog.js) with an audience switcher
   (Everyone · Schools & colleges · Work & business · Marketing & creators).
   Link parameters: ?for=schools|business|marketing picks the audience, ?cat=<category id> a category.
   The chosen audience is remembered on this device with EDU.store('home'). */
(function () {
  'use strict';
  var SITE = Object.assign({ zip: '' }, window.EDU_SITE || {});
  /* Category ids: keep in sync with tools/verify.js, tools/build_catalog.js and cat_<id> in home-strings.js.
     This order is the display order of the "Everyone" view. */
  var CATS = ['learn-ai', 'everyday', 'business', 'marketing', 'teacher-tools', 'math', 'science', 'coding', 'languages', 'study-skills', 'digital-safety'];
  var SCHOOL_CATS = ['learn-ai', 'teacher-tools', 'math', 'science', 'coding', 'languages', 'study-skills', 'digital-safety'];
  /* Audiences: which categories each one shows (in this order). An audience with no published apps is hidden. */
  var AUDS = [
    { id: 'all', icon: '🌐', cats: CATS },
    { id: 'schools', icon: '🏫', cats: SCHOOL_CATS },
    { id: 'business', icon: '💼', cats: ['business', 'learn-ai', 'digital-safety'] },
    { id: 'marketing', icon: '📣', cats: ['marketing', 'everyday'] }
  ];
  var APPS = (window.EDU_CATALOG || []).filter(function (a) { return CATS.indexOf(a.category) >= 0; });
  var COUNTS = {}; APPS.forEach(function (a) { COUNTS[a.category] = (COUNTS[a.category] || 0) + 1; });

  EDU.init({ slug: 'home', title: null, home: true, strings: window.HOME_STRINGS, waKey: 'wa_home' });
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
    var pFor = p && p.get('for'), pCat = p && p.get('cat');
    if (usable(pFor)) { aud = pFor; store.set('aud', aud); }
    else { var saved = store.get('aud', 'all'); if (usable(saved)) aud = saved; }
    if (pCat && COUNTS[pCat]) { cat = pCat; if (audById(aud).cats.indexOf(cat) < 0) aud = 'all'; }
  })();
  function audCats() { return audById(aud).cats; }

  /* Keep ?for= and ?cat= in the address bar (bookmarks, links); edu.js keeps ?lang= the same way. */
  function syncUrl() {
    try {
      var u = new URL(location.href);
      if (aud === 'all') u.searchParams.delete('for'); else u.searchParams.set('for', aud);
      if (cat === 'all') u.searchParams.delete('cat'); else u.searchParams.set('cat', cat);
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
  function matchesQuery(a) {
    if (!query) return true;
    var hay = [loc(a.title), loc(a.desc), a.title.en, a.desc.en, (a.tags || []).join(' '), a.slug].join(' ');
    return norm(hay).indexOf(norm(query)) >= 0;
  }
  function matches(a) {
    if (audCats().indexOf(a.category) < 0) return false;
    if (cat !== 'all' && a.category !== cat) return false;
    return matchesQuery(a);
  }

  function card(a) {
    var meta = el('div', { class: 'meta' }, el('span', { class: 'badge primary', text: gradesLabel(a) }));
    (a.needs || []).forEach(function (n) { meta.appendChild(el('span', { class: 'badge', text: t('badge_' + n) })); });
    return el('a', { class: 'card app-card', href: 'apps/' + a.slug + '/index.html?lang=' + EDU.lang },
      el('div', { class: 'ic', 'aria-hidden': 'true', text: a.icon }),
      el('h3', { text: loc(a.title) }),
      el('p', { text: loc(a.desc) }),
      meta);
  }

  function rerender() { syncUrl(); renderAud(); renderCta(); renderCats(); renderList(); }

  function renderAud() {
    var box = $('#aud'); if (!box) return;
    box.innerHTML = '';
    AUDS.forEach(function (au) {
      var n = au.id === 'all' ? APPS.length : audCount(au);
      if (au.id !== 'all' && !n) return;
      var b = el('button', { class: 'aud-btn', type: 'button', id: 'aud-' + au.id, 'aria-pressed': String(aud === au.id) },
        el('span', { class: 'aud-ic', 'aria-hidden': 'true', text: au.icon }),
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

  /* "For schools" and "For businesses & teams" cards: both for Everyone, otherwise the one that fits. */
  function renderCta() {
    var s = $('#schools-cta'), b = $('#biz-cta'), wrap = $('#ctas');
    var showS = aud === 'all' || aud === 'schools', showB = aud !== 'schools';
    if (s) s.hidden = !showS;
    if (b) b.hidden = !showB;
    if (wrap) wrap.classList.toggle('two', showS && showB);
  }

  function renderCats() {
    var box = $('#cats'); box.innerHTML = '';
    var cats = audCats().filter(function (c) { return COUNTS[c]; });
    var total = cats.reduce(function (s, c) { return s + COUNTS[c]; }, 0);
    function mk(id, label, n) {
      var b = el('button', { class: 'chip', type: 'button', 'aria-pressed': String(cat === id) }, label, el('span', { class: 'tiny', text: ' ' + EDU.fmt(n) }));
      b.addEventListener('click', function () { cat = id; syncUrl(); renderCats(); renderList(); });
      return b;
    }
    box.appendChild(mk('all', t('all'), total));
    cats.forEach(function (c) { box.appendChild(mk(c, t('cat_' + c), COUNTS[c])); });
  }

  function renderList() {
    var list = $('#list'); list.innerHTML = '';
    var shown = APPS.filter(matches);
    /* A search that finds nothing for this audience looks in the whole library instead. */
    if (query && !shown.length) shown = APPS.filter(matchesQuery);
    var grouped = cat === 'all' && !query;
    (grouped ? audCats() : [null]).forEach(function (g) {
      var items = shown.filter(function (a) { return !g || a.category === g; });
      if (!items.length) return;
      if (grouped) list.appendChild(el('div', { class: 'cat-head' }, el('h2', { text: t('cat_' + g) }), el('span', { class: 'badge', text: t('count_apps', { n: EDU.fmt(items.length) }) })));
      var grid = el('div', { class: 'apps', style: grouped ? null : { marginTop: '14px' } });
      items.forEach(function (a) { grid.appendChild(card(a)); });
      list.appendChild(grid);
    });
    $('#empty').hidden = shown.length > 0;
  }

  function setMeta(name, value) { var m = document.querySelector('meta[name="' + name + '"]'); if (m) m.setAttribute('content', value); }
  function setHref(sel, href) { var e = $(sel); if (e) e.href = href; }

  function renderStatic() {
    $('#home-sub').textContent = t('home_sub', { n: EDU.fmt(APPS.length) });
    setHref('#wa-home', EDU.waLink(t('wa_home', { url: EDU.shareUrl() })));
    setHref('#subscribe', CONF.subscribe || EDU.YOUTUBE);
    setHref('#subscribe-2', CONF.subscribe || EDU.YOUTUBE);
    setHref('#watch', CONF.youtube || EDU.YOUTUBE);
    setHref('#schools-link', 'schools.html?lang=' + EDU.lang);
    setHref('#biz-link', 'business.html?lang=' + EDU.lang);
    var zip = $('#zip'), zipUrl = SITE.zip || CONF.zip;
    if (zip && zipUrl) { zip.hidden = false; zip.href = zipUrl; }
    document.title = t('doc_title');
    setMeta('description', t('doc_desc'));
  }

  APPS.sort(function (a, b) { return CATS.indexOf(a.category) - CATS.indexOf(b.category) || (a.order || 999) - (b.order || 999) || a.title.en.localeCompare(b.title.en); });
  $('#q').addEventListener('input', function (e) { query = e.target.value.trim(); renderList(); });
  $('#share-lib').addEventListener('click', function () { EDU.share(EDU.shareUrl(), t('home_title')); });

  function renderAll() { renderStatic(); renderAud(); renderCta(); renderCats(); renderList(); }
  EDU.onLang(renderAll);
  renderAll();
  syncUrl();
})();
