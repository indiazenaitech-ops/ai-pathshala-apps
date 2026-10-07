/* "For schools" page (schools.html): roll-out guide for principals, CBSE alignment, FAQ; the "Stay updated" form
   (#updates) is shared/signup.js.
   Strings: shared/schools-strings.js (window.SCHOOLS_STRINGS). Apps: catalog.js (window.EDU_CATALOG).
   Contact address and links come from EDU.SITE (shared/edu.js), the one config place. */
(function () {
  'use strict';
  var APPS = window.EDU_CATALOG || [];
  var BY = {}; APPS.forEach(function (a) { BY[a.slug] = a; });
  var SITE = Object.assign({}, window.EDU_SITE || {});

  EDU.init({ slug: 'schools', title: 'page_title', nav: 'schools', strings: window.SCHOOLS_STRINGS, waKey: 'wa_schools', sharePath: 'schools.html' });
  var $ = EDU.$, el = EDU.el, t = EDU.t;
  var CONF = EDU.SITE || {};

  /* Suggested CBSE mapping (session 2026-27 curricula on cbseacademic.nic.in). Rows list app slugs, including
     apps still being built: only apps that are live in catalog.js are shown, and empty rows are hidden. */
  var ALIGN = [
    { subj: 'subj_ai417', cls: 9, rows: [
      [1, 'u9_1', ['ai-around-us', 'ai-project-cycle', 'ai-ethics-dilemmas', 'ai-basics-quiz']],
      [2, 'u9_2', ['statistics-calculator']],
      [3, 'u9_3', ['statistics-calculator', 'probability-lab']],
      [4, 'u9_4', ['prompt-builder', 'next-word-predictor', 'tokenizer-lab']],
      [5, 'u9_5', ['python-playground']]] },
    { subj: 'subj_ai417', cls: 10, rows: [
      [1, 'u10_1', ['ai-project-cycle', 'ai-ethics-dilemmas']],
      [2, 'u10_2', ['teachable-machine', 'decision-tree-builder', 'kmeans-clustering', 'neural-network-playground', 'qlearning-robot']],
      [3, 'u10_3', ['confusion-matrix-lab']],
      [4, 'u10_4', ['statistics-calculator']],
      [5, 'u10_5', ['image-pixels-filters', 'teachable-machine']],
      [6, 'u10_6', ['chatbot-builder', 'tokenizer-lab', 'sentiment-trainer', 'speech-lab']],
      [7, 'u10_7', ['python-playground']]] },
    { subj: 'subj_ai843', cls: 11, rows: [
      [3, 'u11_3', ['python-playground']],
      [4, 'u11_4', ['ai-project-cycle']],
      [5, 'u11_5', ['statistics-calculator']],
      [6, 'u11_6', ['linear-regression-lab', 'kmeans-clustering', 'decision-tree-builder']],
      [7, 'u11_7', ['chatbot-builder', 'sentiment-trainer', 'tokenizer-lab']],
      [8, 'u11_8', ['ai-ethics-dilemmas']]] },
    { subj: 'subj_ai843', cls: 12, rows: [
      [1, 'u12_1', ['python-playground']],
      [3, 'u12_3', ['image-pixels-filters', 'teachable-machine']],
      [6, 'u12_6', ['neural-network-playground']],
      [7, 'u12_7', ['next-word-predictor', 'prompt-builder', 'tokenizer-lab']]] },
    { subj: 'subj_cs', cls: 11, rows: [
      [1, 'cs11_1', ['logic-gates', 'number-systems']],
      [2, 'cs11_2', ['python-playground']],
      [3, 'cs11_3', ['phishing-spotter', 'password-checker']]] },
    { subj: 'subj_cs', cls: 12, rows: [
      [1, 'cs12_1', ['python-playground']],
      [3, 'cs12_3', ['sql-playground']]] },
    { subj: 'subj_ip', cls: 11, rows: [
      [2, 'u9_5', ['python-playground']],
      [3, 'ip11_3', ['sql-playground']],
      [4, 'ip11_4', ['ai-basics-quiz', 'teachable-machine', 'chatbot-builder']]] },
    { subj: 'subj_ip', cls: 12, rows: [
      [1, 'ip12_1', ['python-playground']],
      [2, 'ip12_2', ['sql-playground']],
      [4, 'ip12_4', ['phishing-spotter', 'password-checker']]] }
  ];

  function loc(obj) { return (obj && (obj[EDU.lang] || obj.en)) || ''; }
  function appTitle(slug) { return BY[slug] ? loc(BY[slug].title) : slug; }
  function appHref(slug) { return 'apps/' + slug + '/index.html?lang=' + EDU.lang; }
  function libUrl() { return CONF.url + (EDU.lang !== 'en' ? '?lang=' + EDU.lang : ''); }
  function setMeta(name, value) { var m = document.querySelector('meta[name="' + name + '"]'); if (m) m.setAttribute('content', value); }

  function renderAlign() {
    var box = $('#align'); box.innerHTML = '';
    ALIGN.forEach(function (c) {
      var rows = c.rows.map(function (r) { return { n: r[0], key: r[1], apps: r[2].filter(function (s) { return BY[s]; }) }; })
        .filter(function (r) { return r.apps.length; });
      if (!rows.length) return;
      var tbody = el('tbody');
      rows.forEach(function (r) {
        var chips = el('div', { class: 'app-chips' });
        r.apps.forEach(function (s) {
          chips.appendChild(el('a', { class: 'chip app-chip', href: appHref(s) }, el('span', { 'aria-hidden': 'true', text: BY[s].icon }), ' ', appTitle(s)));
        });
        tbody.appendChild(el('tr', null,
          el('td', null, el('span', { class: 'unit-n', text: t('unit_n', { n: EDU.fmt(r.n) }) }), el('span', { class: 'unit-name', text: t(r.key) })),
          el('td', null, chips)));
      });
      box.appendChild(el('section', { class: 'card course' },
        el('h3', null, t(c.subj), ' · ', el('span', { class: 'cls', text: t('class_n', { n: EDU.fmt(c.cls) }) })),
        el('div', { class: 'scroll-x' }, el('table', { class: 'table align-table' },
          el('thead', null, el('tr', null, el('th', { text: t('col_unit') }), el('th', { text: t('col_apps') }))),
          tbody))));
    });
  }

  function renderFaq() {
    var box = $('#faq'); box.innerHTML = '';
    var keys = ['cost', 'data', 'net', 'android', 'lang', 'who', 'cbse', 'req'];
    keys.forEach(function (k, i) {
      box.appendChild(el('details', { class: 'card faq-item', open: i === 0 },
        el('summary', { text: t('faq_' + k + '_q') }),
        el('p', { text: t('faq_' + k + '_a') })));
    });
    /* FAQPage structured data in the current language (matches the visible text). */
    var old = document.getElementById('faq-jsonld'); if (old) old.remove();
    var ld = { '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: EDU.lang, mainEntity: keys.map(function (k) {
      return { '@type': 'Question', name: t('faq_' + k + '_q'), acceptedAnswer: { '@type': 'Answer', text: t('faq_' + k + '_a') } };
    }) };
    var s = document.createElement('script'); s.type = 'application/ld+json'; s.id = 'faq-jsonld';
    s.textContent = JSON.stringify(ld).replace(/</g, '\\u003c');
    document.head.appendChild(s);
  }

  function render() {
    var n = EDU.fmt(APPS.length);
    $('#hero-lead').textContent = t('hero_lead', { n: n });
    $('#stat-apps').textContent = n;
    $('#open-lib').href = 'index.html?lang=' + EDU.lang;
    $('#wa-page').href = EDU.waLink(t('wa_schools', { url: EDU.shareUrl() }));
    $('#wa-page-2').href = $('#wa-page').href;
    $('#day-1').textContent = t('day_1', { timer: appTitle('class-timer'), picker: appTitle('name-picker') });
    var msg = t('parents_msg', { url: libUrl() });
    $('#parents-msg').value = msg;
    $('#wa-parents').href = EDU.waLink(msg);
    $('#subscribe').href = CONF.subscribe || EDU.YOUTUBE;
    var press = SITE.press || null;
    var flyer = press && ((EDU.lang === 'hi' || EDU.lang === 'mr' ? press.flyer_hi : press.flyer_en) || press.flyer);
    $('#flyer').hidden = !flyer;
    if (flyer) $('#flyer-link').href = flyer;
    renderAlign();
    renderFaq();
    document.title = t('doc_title');
    setMeta('description', t('doc_desc'));
  }

  $('#copy-msg').addEventListener('click', function () { EDU.copy($('#parents-msg').value); });
  EDU.onLang(render);
  render();
})();
