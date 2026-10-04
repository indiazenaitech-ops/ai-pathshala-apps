/* "For business & teams" page (business.html): why teams use the tools, use cases, "suggest a tool", FAQ; the
   "Stay updated" form (#updates) is shared/signup.js. Strings: shared/business-strings.js (window.BUSINESS_STRINGS). Apps: catalog.js (window.EDU_CATALOG).
   Contact address and links come from EDU.SITE (shared/edu.js), the one config place. No prices on this page. */
(function () {
  'use strict';
  var APPS = window.EDU_CATALOG || [];
  var BY = {}; APPS.forEach(function (a) { BY[a.slug] = a; });

  EDU.init({ slug: 'business', title: 'page_title', strings: window.BUSINESS_STRINGS, waKey: 'wa_business', sharePath: 'business.html' });
  var $ = EDU.$, el = EDU.el, t = EDU.t;
  var CONF = EDU.SITE || {};

  /* Use-case cards. Apps of the listed categories (and business apps whose slug/tags match `tags`) come first, so
     new work tools appear here as soon as they are published; then the hand-picked slugs. Only live apps are shown.
     more: link to the home page filtered for that audience + category (shown only when that category has apps). */
  var MAX = 8;
  var USES = [
    { key: 'train', icon: '🎓', slugs: ['live-quiz', 'quiz-maker', 'flashcards', 'certificate-maker', 'prompt-builder', 'ai-basics-quiz'] },
    { key: 'office', icon: '🗂️', cats: ['business'], slugs: ['class-timer', 'name-picker', 'whiteboard', 'mind-map', 'timetable-maker'], more: ['business', 'business'] },
    { key: 'mkt', icon: '📣', cats: ['marketing'], slugs: ['prompt-builder', 'word-counter', 'qr-code-maker'], more: ['marketing', 'marketing'] },
    { key: 'shop', icon: '🏪', cats: ['everyday'], tags: /invoice|gst|bill|shop|upi|price|stock|receipt|khata|udhaar|customer/i, slugs: ['qr-code-maker', 'unit-converter', 'certificate-maker'], more: ['marketing', 'everyday'] },
    { key: 'safe', icon: '🛡️', cats: ['digital-safety'], slugs: ['phishing-spotter', 'password-checker'] }
  ];

  function loc(obj) { return (obj && (obj[EDU.lang] || obj.en)) || ''; }
  function appHref(slug) { return 'apps/' + slug + '/index.html?lang=' + EDU.lang; }
  function setMeta(name, value) { var m = document.querySelector('meta[name="' + name + '"]'); if (m) m.setAttribute('content', value); }
  function count(cat) { return APPS.filter(function (a) { return a.category === cat; }).length; }

  function appsFor(u) {
    var out = [];
    function add(slug) { if (BY[slug] && out.indexOf(slug) < 0 && out.length < MAX) out.push(slug); }
    APPS.forEach(function (a) {
      var inCat = (u.cats || []).indexOf(a.category) >= 0;
      var tagged = u.tags && a.category === 'business' && u.tags.test([a.slug].concat(a.tags || []).join(' '));
      if (inCat || tagged) add(a.slug);
    });
    (u.slugs || []).forEach(add);
    return out;
  }

  function renderUses() {
    var box = $('#uses'); box.innerHTML = '';
    USES.forEach(function (u) {
      var slugs = appsFor(u);
      var chips = el('div', { class: 'app-chips' });
      slugs.forEach(function (s) {
        chips.appendChild(el('a', { class: 'chip app-chip', href: appHref(s) }, el('span', { 'aria-hidden': 'true', text: BY[s].icon }), ' ', loc(BY[s].title)));
      });
      var more = u.more && count(u.more[1]) ? el('a', { class: 'more', href: 'index.html?for=' + u.more[0] + '&cat=' + u.more[1] + '&lang=' + EDU.lang },
        el('span', { text: t('see_all') }), ' ', el('span', { class: 'arrow', 'aria-hidden': 'true', text: '→' })) : null;
      box.appendChild(el('section', { class: 'card use', id: 'use-' + u.key },
        el('h3', null, el('span', { class: 'use-ic', 'aria-hidden': 'true', text: u.icon }), el('span', { text: t('use_' + u.key + '_t') })),
        el('p', { class: 'muted', text: t('use_' + u.key) }),
        slugs.length ? chips : null,
        more));
    });
  }

  function renderFaq() {
    var box = $('#faq'); box.innerHTML = '';
    var keys = ['data', 'net', 'it', 'cost', 'custom', 'lang', 'who'];
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

  function mailto(subjectKey, bodyKey) {
    return 'mailto:' + (CONF.contact || '') + '?subject=' + encodeURIComponent(t(subjectKey)) + '&body=' + encodeURIComponent(t(bodyKey));
  }

  function render() {
    var n = EDU.fmt(APPS.length);
    $('#hero-lead').textContent = t('hero_lead', { n: n });
    $('#stat-tools').textContent = n;
    $('#open-tools').href = 'index.html?for=business&lang=' + EDU.lang;
    $('#wa-page').href = EDU.waLink(t('wa_business', { url: EDU.shareUrl() }));
    $('#wa-page-2').href = $('#wa-page').href;
    $('#custom-mail').href = mailto('custom_subject', 'custom_body');
    $('#subscribe').href = CONF.subscribe || EDU.YOUTUBE;
    renderUses();
    renderFaq();
    document.title = t('doc_title');
    setMeta('description', t('doc_desc'));
  }

  EDU.onLang(render);
  render();
})();
