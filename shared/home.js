/* Library home: renders the catalog (window.EDU_CATALOG from catalog.js). */
(function () {
  'use strict';
  var SITE = Object.assign({ zip: '' }, window.EDU_SITE || {});
  var CATS = ['learn-ai', 'teacher-tools', 'math', 'science', 'coding', 'languages', 'study-skills', 'digital-safety'];
  var APPS = (window.EDU_CATALOG || []).slice();
  var cat = 'all', query = '';

  EDU.init({ slug: 'home', title: null, home: true, strings: window.HOME_STRINGS, waKey: 'wa_home' });
  var $ = EDU.$, el = EDU.el, t = EDU.t;
  var CONF = EDU.SITE || {};
  /* The home page has no app title, so the shell's header <h1> stays empty; the hero heading is the page's h1. */
  var shellH1 = document.getElementById('edu-title');
  if (shellH1 && !shellH1.textContent.trim()) shellH1.remove();

  try { var c0 = new URLSearchParams(location.search).get('cat'); if (CATS.indexOf(c0) >= 0) cat = c0; } catch (e) { }

  function loc(obj) { return (obj && (obj[EDU.lang] || obj.en)) || ''; }
  function gradesLabel(g) {
    if (!g || g === 'all') return t('grades_all');
    if (g === 'UG' || g === 'PG') return t('grades_ug');
    return t('grades', { g: g });
  }
  function norm(s) { return String(s || '').toLowerCase(); }
  function matches(a) {
    if (cat !== 'all' && a.category !== cat) return false;
    if (!query) return true;
    var hay = [loc(a.title), loc(a.desc), a.title.en, a.desc.en, (a.tags || []).join(' '), a.slug].join(' ');
    return norm(hay).indexOf(norm(query)) >= 0;
  }

  function card(a) {
    var meta = el('div', { class: 'meta' }, el('span', { class: 'badge primary', text: gradesLabel(a.grades) }));
    (a.needs || []).forEach(function (n) { meta.appendChild(el('span', { class: 'badge', text: t('badge_' + n) })); });
    return el('a', { class: 'card app-card', href: 'apps/' + a.slug + '/index.html?lang=' + EDU.lang },
      el('div', { class: 'ic', 'aria-hidden': 'true', text: a.icon }),
      el('h3', { text: loc(a.title) }),
      el('p', { text: loc(a.desc) }),
      meta);
  }

  function renderCats() {
    var box = $('#cats'); box.innerHTML = '';
    var counts = {}; APPS.forEach(function (a) { counts[a.category] = (counts[a.category] || 0) + 1; });
    function mk(id, label, n) {
      var b = el('button', { class: 'chip', type: 'button', 'aria-pressed': String(cat === id) }, label, el('span', { class: 'tiny', text: ' ' + EDU.fmt(n) }));
      b.addEventListener('click', function () { cat = id; renderCats(); renderList(); });
      return b;
    }
    box.appendChild(mk('all', t('all'), APPS.length));
    CATS.forEach(function (c) { if (counts[c]) box.appendChild(mk(c, t('cat_' + c), counts[c])); });
  }

  function renderList() {
    var list = $('#list'); list.innerHTML = '';
    var shown = APPS.filter(matches);
    var grouped = cat === 'all' && !query;
    (grouped ? CATS : [null]).forEach(function (g) {
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

  function renderStatic() {
    $('#home-sub').textContent = t('home_sub', { n: EDU.fmt(APPS.length) });
    $('#wa-home').href = EDU.waLink(t('wa_home', { url: EDU.shareUrl() }));
    $('#subscribe').href = CONF.subscribe || EDU.YOUTUBE;
    $('#subscribe-2').href = CONF.subscribe || EDU.YOUTUBE;
    $('#watch').href = CONF.youtube || EDU.YOUTUBE;
    $('#schools-link').href = 'schools.html?lang=' + EDU.lang;
    var zip = $('#zip'), zipUrl = SITE.zip || CONF.zip;
    if (zipUrl) { zip.hidden = false; zip.href = zipUrl; }
    document.title = t('doc_title');
    setMeta('description', t('doc_desc'));
  }

  APPS.sort(function (a, b) { return CATS.indexOf(a.category) - CATS.indexOf(b.category) || (a.order || 999) - (b.order || 999) || a.title.en.localeCompare(b.title.en); });
  $('#q').addEventListener('input', function (e) { query = e.target.value.trim(); renderList(); });
  $('#share-lib').addEventListener('click', function () { EDU.share(EDU.shareUrl(), t('home_title')); });

  function renderAll() { renderStatic(); renderCats(); renderList(); }
  EDU.onLang(renderAll);
  renderAll();
})();
