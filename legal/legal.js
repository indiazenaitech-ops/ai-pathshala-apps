/* Privacy Policy + Terms of Use pages (legal/privacy.html, legal/terms.html).
 * The structure is in the HTML; every visible word comes from privacy-strings.js / terms-strings.js
 * (window.APP_STRINGS, 12 languages) through data-i18n.  This script adds what the HTML cannot:
 *   - the shell (EDU.init), the "On this page" list built from the section headings,
 *   - the grievance e-mail: window.EDU_CONTACT_EMAIL (shared/firebase-config.js), falling back to EDU.SITE.contact,
 *   - links that keep the chosen language, the translated meta description, print.
 * Nothing is sent anywhere.  Check: node tools/tests/_legal.check.js */
(function () {
  'use strict';
  var page = document.body.getAttribute('data-page') === 'terms' ? 'terms' : 'privacy';
  var other = page === 'terms' ? 'privacy' : 'terms';
  var P = page === 'terms' ? 't_' : 'p_';

  EDU.init({ slug: 'legal', title: page + '_title', waKey: 'wa_legal', sharePath: 'legal/' + page + '.html' });
  var $ = EDU.$, $$ = EDU.$$, t = EDU.t;

  function contactEmail() {
    var e = String(window.EDU_CONTACT_EMAIL || (EDU.SITE && EDU.SITE.contact) || '').trim();
    return /^[^\s@<>"'?&]+@[^\s@<>"'?&]+\.[a-z]{2,}$/i.test(e) ? e : '';
  }

  function setMeta(name, value) {
    var m = document.querySelector('meta[name="' + name + '"]');
    if (m) m.setAttribute('content', value);
  }

  function buildToc() {
    var ol = $('#toc');
    if (!ol) return;
    ol.innerHTML = '';
    $$('#legal > section[id]').forEach(function (sec) {
      if (sec.classList.contains('legal-short')) return;
      var h = sec.querySelector('h2');
      if (!h) return;
      ol.appendChild(EDU.el('li', null, EDU.el('a', { href: '#' + sec.id, text: h.textContent })));
    });
  }

  function render() {
    var L = EDU.lang;
    $$('a.other-page').forEach(function (a) { a.href = other + '.html?lang=' + L; });

    var mail = contactEmail();
    $('#contact-ok').hidden = !mail;
    $('#no-email').hidden = !!mail;
    if (mail) {
      var href = 'mailto:' + mail + '?subject=' + encodeURIComponent(t(P + 'mail_subject'));
      $('#email').textContent = mail;
      $('#email').href = href;
      $('#mail-btn').href = href;
    }
    $('#yt-link').href = (EDU.SITE && EDU.SITE.youtube) || EDU.YOUTUBE;

    buildToc();
    setMeta('description', t(P + 'doc_desc'));
  }

  $('#print-btn').addEventListener('click', function () { window.print(); });
  $('#copy-email').addEventListener('click', function () { var m = contactEmail(); if (m) EDU.copy(m); });

  /* "On this page": open beside the text on wide screens, folded on phones (closes after a jump). */
  var wide = window.matchMedia ? window.matchMedia('(min-width: 980px)') : null;
  function tocState() { $('#toc-box').open = !wide || wide.matches; }
  tocState();
  if (wide && wide.addEventListener) wide.addEventListener('change', tocState);
  $('#toc').addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('a') && wide && !wide.matches) $('#toc-box').open = false;
  });

  EDU.onLang(render);
  render();

  /* The text is filled in by script, so a link such as privacy.html#students may land too early: jump again
     once the page (and its web font) has settled. */
  if (location.hash.length > 1) {
    var jump = function () {
      var el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (el) el.scrollIntoView();
    };
    setTimeout(jump, 0);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(jump, 50); });
  }
})();
