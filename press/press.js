/* AI Pathshala Apps: press kit page. Classic script (works from file:// too). */
(function () {
  'use strict';
  EDU.init({ slug: 'press', title: 'press_title', strings: window.PRESS_STRINGS, sharePath: 'press/index.html', waKey: 'wa_press' });

  var SHOTS = ['quiz-maker', 'attendance-register', 'neural-network-playground', 'worksheet-generator', 'python-playground', 'phishing-spotter'];
  var CAT = Array.isArray(window.EDU_CATALOG) ? window.EDU_CATALOG : [];

  function app(slug) {
    for (var i = 0; i < CAT.length; i++) if (CAT[i].slug === slug) return CAT[i];
    return null;
  }
  function appTitle(a, slug) {
    return a && a.title ? (a.title[EDU.lang] || a.title.en) : slug;
  }

  function render() {
    EDU.$('#pk-fact-apps').textContent = EDU.t('fact_apps', { n: EDU.fmt(CAT.length || 25) });
    var box = EDU.$('#pk-shots');
    box.innerHTML = '';
    SHOTS.forEach(function (slug) {
      var a = app(slug), title = appTitle(a, slug);
      box.appendChild(EDU.el('figure', {},
        EDU.el('a', { href: 'screenshots/' + slug + '-hi.png', target: '_blank', rel: 'noopener' },
          EDU.el('img', { src: 'screenshots/' + slug + '-hi-thumb.jpg', alt: title, width: 640, height: 400, loading: 'lazy' })),
        EDU.el('figcaption', {}, a ? EDU.el('span', { 'aria-hidden': 'true', text: a.icon }) : null, EDU.el('span', { text: title }))));
    });
  }

  EDU.$('#pk-copy').addEventListener('click', function () { EDU.copy(EDU.t('about_text')); });
  EDU.onLang(render);
  render();
})();
