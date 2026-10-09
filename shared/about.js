/* "About us" page (about.html). Strings: shared/about-strings.js (window.ABOUT_STRINGS). App count: catalog.js.
   Links come from EDU.SITE (shared/edu.js), the one config place. */
(function () {
  'use strict';
  var N = (window.EDU_CATALOG || []).length;
  EDU.init({ slug: 'about', title: 'page_title', nav: 'about', strings: window.ABOUT_STRINGS, waKey: 'wa_about', sharePath: 'about.html' });
  var $ = EDU.$, t = EDU.t;
  var CONF = EDU.SITE || {};
  function setHref(sel, href) { var e = $(sel); if (e) e.href = href; }
  function setMeta(name, value) { var m = document.querySelector('meta[name="' + name + '"]'); if (m) m.setAttribute('content', value); }

  function render() {
    var L = '?lang=' + EDU.lang;
    $('#hero-lead').textContent = t('hero_lead', { n: EDU.fmt(N) });
    $('#w-apps-t').textContent = t('w_apps_t', { n: EDU.fmt(N) });
    $('#v4').textContent = t('v4', { langs: EDU.LANGS.map(function (l) { return l.native; }).join(', ') });
    ['#browse', '#browse-2'].forEach(function (s) { setHref(s, 'index.html' + L); });
    ['#contact', '#contact-2'].forEach(function (s) { setHref(s, 'contact.html' + L); });
    setHref('#guides', EDU.ROOT + 'guides/index.html' + L);
    setHref('#yt', CONF.youtube || EDU.YOUTUBE);
    document.title = t('doc_title');
    setMeta('description', t('doc_desc'));
  }
  EDU.onLang(render);
  render();
})();
