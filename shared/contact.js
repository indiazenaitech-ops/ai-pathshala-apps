/* "Contact" page (contact.html). Strings: shared/contact-strings.js (window.CONTACT_STRINGS).
   The address comes from EDU.SITE.contact (shared/edu.js), which joins it at run time so it never sits in plain text in a file. */
(function () {
  'use strict';
  EDU.init({ slug: 'contact', title: 'page_title', nav: 'contact', strings: window.CONTACT_STRINGS, waKey: 'wa_contact', sharePath: 'contact.html' });
  var $ = EDU.$, t = EDU.t;
  var CONF = EDU.SITE || {};
  var MAIL = CONF.contact || '';
  function setMeta(name, value) { var m = document.querySelector('meta[name="' + name + '"]'); if (m) m.setAttribute('content', value); }

  function render() {
    $('#mail-addr').textContent = MAIL;
    $('#mail-btn').href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(t('email_subject'));
    $('#yt').href = CONF.youtube || EDU.YOUTUBE;
    $('#wa-page').href = EDU.waLink(t('wa_contact', { url: EDU.shareUrl() }));
    $('#privacy').href = 'legal/privacy.html?lang=' + EDU.lang;
    document.title = t('doc_title');
    setMeta('description', t('doc_desc'));
  }
  $('#copy-mail').addEventListener('click', function () { EDU.copy(MAIL); });
  EDU.onLang(render);
  render();
})();
