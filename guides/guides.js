/* Guide pages (every guides/.../index.html page): the EDU shell and the live language switch.
 * The pages are pre-rendered in their own language by guides/_build/build.js (so search engines and slow phones get
 * the full text at once). This script re-renders the same keys when someone picks another language:
 *   data-g="key"         innerHTML = text (only <b> and <i> are kept, everything else is escaped)
 *   data-g="@label"      a label from guides/labels.js (app title or button name)
 *   data-gv='{"x":..}'   placeholder values ("@label" = a label, "date" = yyyy-mm-dd shown in the page language)
 *   data-g-alt="key"     alt text
 *   data-app="slug" · data-guide="id" ("" = all guides) · data-home="#hash" (data-for="schools")   links
 *   data-shot="name"     screenshot: guides/img/<name>-hi.webp for Hindi, -en.webp otherwise
 * Strings: guides/strings.js (window.GUIDES_STRINGS); labels: guides/labels.js (GUIDES_LABELS, GUIDES_IMG, GUIDES_SLUGS). */
(function () {
  'use strict';
  if (!window.EDU) return;
  var main = document.getElementById('app');
  if (!main) return;
  var GID = main.getAttribute('data-guide') || '';
  var PAGE_LANG = main.getAttribute('data-page-lang') || 'en';
  var LAB = window.GUIDES_LABELS || {};
  var IMG = window.GUIDES_IMG || {};
  var SLUGS = window.GUIDES_SLUGS || {};
  var TITLE_KEY = GID ? GID + '_short' : 'g_ix_short';
  var DOC_KEY = GID ? GID + '_doc' : 'g_ix_doc';
  var DESC_KEY = GID ? GID + '_desc' : 'g_ix_desc';

  EDU.init({
    slug: 'guides', title: TITLE_KEY, strings: window.GUIDES_STRINGS, waKey: 'g_wa',
    sharePath: 'guides/' + (PAGE_LANG === 'en' ? '' : PAGE_LANG + '/') + (GID && SLUGS[GID] ? SLUGS[GID] + '/' : '')
  });
  var ROOT = EDU.ROOT, FILE = location.protocol === 'file:';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function mini(s) { return esc(s).replace(/&lt;(\/?)(b|i)&gt;/g, '<$1$2>'); }
  function plain(s) { return String(s).replace(/<\/?(b|i)>/g, ''); }
  function labels() {
    var base = LAB.en || {}, cur = LAB[EDU.lang] || {}, v = {};
    Object.keys(base).forEach(function (k) { v[k] = cur[k] !== undefined ? cur[k] : base[k]; });
    return v;
  }
  /* "4 October 2026" with month names from the strings (g_months), the same text the static page has */
  function fmtDate(iso) {
    var p = String(iso).split('-'), names = String(EDU.t('g_months')).split(',');
    return +p[2] + ' ' + (names[+p[1] - 1] || p[1]) + ' ' + p[0];
  }
  function text(key, gv) {
    var L = labels();
    if (key.charAt(0) === '@') return L[key.slice(1)] || '';
    var vars = Object.assign({}, L);
    if (gv) {
      var o = null;
      try { o = JSON.parse(gv); } catch (e) { }
      if (o) Object.keys(o).forEach(function (k) {
        var v = o[k];
        if (typeof v === 'string' && v.charAt(0) === '@') v = L[v.slice(1)] || '';
        else if (k === 'date') v = fmtDate(v);
        else if (typeof v === 'number') v = EDU.fmt(v);
        vars[k] = v;
      });
    }
    return EDU.t(key, vars);
  }
  function guideHref(id, lang) {
    return ROOT + 'guides/' + (lang === 'en' ? '' : lang + '/') + (id && SLUGS[id] ? SLUGS[id] + '/' : '') + (FILE ? 'index.html' : '');
  }
  function appHref(slug, lang) { return ROOT + 'apps/' + slug + '/' + (FILE ? 'index.html' : '') + (lang === 'en' ? '' : '?lang=' + lang); }
  function homeHref(lang, hash, aud) {
    return ROOT + (FILE ? 'index.html' : '') + '?' + (aud ? 'for=' + aud + '&' : '') + 'lang=' + lang + (hash || '');
  }

  function render() {
    var lang = EDU.lang;
    EDU.$$('[data-g]').forEach(function (el) { el.innerHTML = mini(text(el.getAttribute('data-g'), el.getAttribute('data-gv'))); });
    EDU.$$('[data-g-alt]').forEach(function (el) { el.setAttribute('alt', plain(text(el.getAttribute('data-g-alt')))); });
    EDU.$$('[data-g-aria]').forEach(function (el) { el.setAttribute('aria-label', plain(text(el.getAttribute('data-g-aria')))); });
    EDU.$$('a[data-app]').forEach(function (a) { a.href = appHref(a.getAttribute('data-app'), lang); });
    EDU.$$('a[data-guide]').forEach(function (a) { a.href = guideHref(a.getAttribute('data-guide'), a.getAttribute('data-glang') || lang) + (a.getAttribute('data-hash') || ''); });
    EDU.$$('a[data-home]').forEach(function (a) { a.href = homeHref(lang, a.getAttribute('data-home'), a.getAttribute('data-for')); });
    EDU.$$('img[data-shot]').forEach(function (img) {
      var name = img.getAttribute('data-shot') + '-' + (lang === 'hi' ? 'hi' : 'en');
      var src = ROOT + 'guides/img/' + name + '.webp';
      if (img.src !== src) img.src = src;
      if (IMG[name]) { img.width = IMG[name][0]; img.height = IMG[name][1]; }
    });
    var wa = document.getElementById('g-wa');
    if (wa) wa.href = EDU.waLink(EDU.t('g_wa', { title: EDU.t(TITLE_KEY), url: EDU.shareUrl() }));
    document.title = plain(text(DOC_KEY));
    var d = document.querySelector('meta[name="description"]');
    if (d) d.setAttribute('content', plain(text(DESC_KEY)));
  }

  EDU.onLang(render);
  render();
})();
