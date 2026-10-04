#!/usr/bin/env node
/* Builds the guide pages from guides/strings.js + guides/_build/structure.js:
 *   guides/labels.js                    app titles + button names in 12 languages (from apps/<slug>/strings.js, meta.json
 *                                       and EDU.COMMON), screenshot sizes, guide slugs
 *   guides/index.html                   all guides (English)      guides/<lang>/index.html   (other languages)
 *   guides/<slug>/index.html            one guide (English)       guides/<lang>/<slug>/index.html
 * Every page is complete static HTML in its own language (title, meta, canonical, hreflang, Open Graph, JSON-LD:
 * Article + BreadcrumbList + HowTo + FAQPage), and guides/guides.js switches language live with the EDU shell.
 *   node guides/_build/build.js [--langs en,hi]
 * Then: node guides/_build/verify.js */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const S = require('./structure.js');
const ROOT = path.resolve(__dirname, '..', '..');
const G = path.join(ROOT, 'guides');
const argv = process.argv.slice(2);
const li = argv.indexOf('--langs');
const TAGS = { en: 'en-IN', hi: 'hi-IN', bn: 'bn-IN', mr: 'mr-IN', gu: 'gu-IN', pa: 'pa-IN', or: 'or-IN', ta: 'ta-IN', te: 'te-IN', kn: 'kn-IN', ml: 'ml-IN', ur: 'ur-IN' };
const OG_LOCALE = { en: 'en_IN', hi: 'hi_IN', bn: 'bn_IN', mr: 'mr_IN', gu: 'gu_IN', pa: 'pa_IN', or: 'or_IN', ta: 'ta_IN', te: 'te_IN', kn: 'kn_IN', ml: 'ml_IN', ur: 'ur_IN' };
const YT_SUB = 'https://www.youtube.com/@Apni_Pathshala_AI?sub_confirmation=1';
const WA_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2.2a9.8 9.8 0 0 0-8.5 14.7L2.2 21.8l5-1.3A9.8 9.8 0 1 0 12 2.2zm0 1.8a8 8 0 1 1-4.1 14.9l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 0 1 12 4z"/><path fill="currentColor" d="M8.7 7.3c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-.9.9-.9 2.2s1 2.6 1.1 2.8c.1.2 1.9 3 4.7 4.1 2.3.9 2.8.7 3.3.7.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3l-1.9-.9c-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.4.1-.6l.4-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.2z"/></svg>';

/* ---------- inputs ---------- */
function runScript(file, extra) {
  const noop = () => { };
  const el = { setAttribute: noop, getAttribute: () => null, removeAttribute: noop, style: { setProperty: noop }, appendChild: noop, classList: { add: noop } };
  const sb = Object.assign({
    document: { currentScript: null, documentElement: el, createElement: () => el, addEventListener: noop, head: el, body: el, querySelector: () => null, querySelectorAll: () => [], getElementById: () => null },
    navigator: { languages: ['en'] }, location: { search: '', href: 'http://localhost/', protocol: 'http:' },
    localStorage: { getItem: () => null, setItem: noop, removeItem: noop }, URLSearchParams, console
  }, extra || {});
  sb.window = sb; sb.self = sb;
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), sb, { filename: file });
  return sb;
}
const STR = runScript(path.join(G, 'strings.js')).GUIDES_STRINGS;
const COMMON = runScript(path.join(ROOT, 'shared', 'edu.js')).EDU.COMMON;
const LANGS = (li >= 0 ? argv[li + 1].split(',') : S.LANGS).filter(L => STR[L]);
const problems = [];

const appCache = {};
function app(slug) {
  if (appCache[slug]) return appCache[slug];
  const dir = path.join(ROOT, 'apps', slug);
  if (!fs.existsSync(path.join(dir, 'meta.json'))) throw new Error('unknown app ' + slug);
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'));
  const strings = runScript(path.join(dir, 'strings.js')).APP_STRINGS;
  return (appCache[slug] = { meta, strings });
}

/* app slugs used anywhere: guide apps, CTAs and {app_x} placeholders in the strings */
const appSlugs = new Set();
for (const g of S.GUIDES) { g.apps.forEach(a => appSlugs.add(a)); if (g.cta.app) appSlugs.add(g.cta.app); }
for (const v of Object.values(STR.en)) for (const m of String(v).matchAll(/\{app_([a-z0-9_]+)\}/g)) appSlugs.add(m[1].replace(/_/g, '-'));
const appKey = slug => 'app_' + slug.replace(/-/g, '_');

/* labels per language */
const LAB = {};
for (const L of S.LANGS) {
  const o = {};
  for (const slug of [...appSlugs].sort()) { const t = app(slug).meta.title; o[appKey(slug)] = t[L] || t.en; }
  for (const [k, [slug, key]] of Object.entries(S.LABELS)) {
    const A = app(slug).strings;
    let v = (A[L] && A[L][key]) !== undefined ? A[L][key] : (COMMON[L] && COMMON[L][key]);
    if (v === undefined) v = (A.en && A.en[key]) !== undefined ? A.en[key] : COMMON.en[key];
    if (v === undefined) { problems.push(`label ${k}: ${slug}.${key} not found`); v = k; }
    o[k] = String(v);
  }
  LAB[L] = o;
}
/* screenshots: size of every guides/img/*.webp */
function webpSize(file) {
  const b = fs.readFileSync(file);
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return null;
  const ch = b.toString('ascii', 12, 16);
  if (ch === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (ch === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  if (ch === 'VP8L') { const n = b.readUInt32LE(21); return [1 + (n & 0x3fff), 1 + ((n >> 14) & 0x3fff)]; }
  return null;
}
const IMG = {};
const imgDir = path.join(G, 'img');
if (fs.existsSync(imgDir)) for (const f of fs.readdirSync(imgDir).sort()) if (f.endsWith('.webp')) { const s = webpSize(path.join(imgDir, f)); if (s) IMG[f.slice(0, -5)] = s; }
const SLUGS = Object.fromEntries(S.GUIDES.map(g => [g.id, g.slug]));

/* ---------- text ---------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mini = s => esc(s).replace(/&lt;(\/?)(b|i)&gt;/g, '<$1$2>');
const plain = s => String(s).replace(/<\/?(b|i)>/g, '');
/* "4 October 2026" with the month names from g_months (browsers do not all have month names for every Indian language) */
function fmtDate(L, iso) {
  const [y, m, d] = iso.split('-').map(Number), names = String((STR[L] || STR.en).g_months || STR.en.g_months).split(',');
  return d + ' ' + (names[m - 1] || m) + ' ' + y;
}
function t(L, key, vars) {
  let v = STR[L] && STR[L][key];
  if (v === undefined) { problems.push(`${L}: missing ${key}`); v = STR.en[key]; }
  if (v === undefined) { problems.push(`en: missing ${key}`); v = key; }
  const all = Object.assign({}, LAB[L], vars || {});
  return String(v).replace(/\{(\w+)\}/g, (m, k) => { if (all[k] === undefined) { problems.push(`${L}.${key}: unknown placeholder ${m}`); return m; } return all[k]; });
}
/* the same values guides.js computes from data-gv */
function gvVars(L, gv) {
  const o = {};
  for (const [k, v] of Object.entries(gv || {})) o[k] = typeof v === 'string' && v[0] === '@' ? LAB[L][v.slice(1)] : k === 'date' ? fmtDate(L, v) : String(v);
  return o;
}
/* <tag data-g="key">text</tag> */
function g(tag, L, key, attrs, gv) {
  const a = attrs ? ' ' + attrs : '';
  const val = key[0] === '@' ? LAB[L][key.slice(1)] : t(L, key, gvVars(L, gv));
  return `<${tag}${a} data-g="${esc(key)}"${gv ? ` data-gv="${esc(JSON.stringify(gv))}"` : ''}>${mini(val)}</${tag}>`;
}
const txt = (L, key, gv) => plain(t(L, key, gvVars(L, gv)));

/* ---------- pages ---------- */
function paths(id, L) {
  const depth = (L === 'en' ? 1 : 2) + (id ? 1 : 0);          // folders below the site root
  const up = '../'.repeat(depth);
  return { up, gbase: up + 'guides/', file: S.pageFile(id, L), url: S.pageUrl(id, L) };
}
function ogImage(id, L) {
  const name = 'og-' + (id ? SLUGS[id] : 'index') + '-' + (L === 'hi' ? 'hi' : 'en') + '.jpg';
  return fs.existsSync(path.join(imgDir, name)) ? { url: S.SITE + 'guides/img/' + name, w: 1200, h: 630 } : { url: S.SITE + 'shared/img/og-home.png', w: 1200, h: 630 };
}
const ld = o => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>';
const ORG = { '@type': 'Organization', '@id': S.SITE + '#org', name: 'AI Pathshala (AI की पाठशाला)', url: S.SITE, logo: { '@type': 'ImageObject', url: S.SITE + 'shared/img/icon-192.png' }, sameAs: ['https://www.youtube.com/@Apni_Pathshala_AI'] };

function head(id, L, P, title, desc, og, jsonld) {
  const alts = LANGS.map(x => `  <link rel="alternate" hreflang="${x}" href="${S.pageUrl(id, x)}">`).join('\n') +
    `\n  <link rel="alternate" hreflang="x-default" href="${S.pageUrl(id, 'en')}">`;
  return `<!doctype html>
<html lang="${L}" dir="${L === 'ur' ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script>/* this page is in ${L}: show it in ${L} unless the link asks for another language */(function(){try{var u=new URL(location.href);if(!u.searchParams.get('lang')){u.searchParams.set('lang','${L}');history.replaceState(history.state,'',u.toString());}}catch(e){}})();</script>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${P.url}">
${alts}
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="author" content="AI की पाठशाला (AI Pathshala)">
  <meta property="og:type" content="${id ? 'article' : 'website'}">
  <meta property="og:site_name" content="AI की पाठशाला · AI Pathshala">
  <meta property="og:url" content="${P.url}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image" content="${og.url}">
  <meta property="og:image:width" content="${og.w}">
  <meta property="og:image:height" content="${og.h}">
  <meta property="og:image:alt" content="${esc(title)}">
  <meta property="og:locale" content="${OG_LOCALE[L]}">${id ? `\n  <meta property="article:published_time" content="${S.PUBLISHED}">\n  <meta property="article:modified_time" content="${S.UPDATED}">` : ''}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${og.url}">
  <link rel="icon" href="${P.up}shared/img/icon-32.png">
  <link rel="apple-touch-icon" href="${P.up}shared/img/icon-192.png">
  <link rel="manifest" href="${P.up}manifest.webmanifest">
  <meta name="theme-color" content="#0b4f5c">
  <link rel="stylesheet" href="${P.up}shared/edu.css">
  <link rel="stylesheet" href="${P.gbase}guides.css">
  ${ld(jsonld)}
</head>
<body>
`;
}
function foot(P, bundle) {
  return `  <script src="${P.up}shared/edu.js"></script>
  <script src="${P.gbase}i18n/${bundle}.js"></script>
  <script src="${P.gbase}labels.js"></script>
  <script src="${P.gbase}guides.js"></script>
</body>
</html>
`;
}
const appHref = (P, slug, L) => `${P.up}apps/${slug}/${L === 'en' ? '' : '?lang=' + L}`;
const guideHref = (P, id, L) => `${P.gbase}${L === 'en' ? '' : L + '/'}${id ? SLUGS[id] + '/' : ''}`;
const homeHref = (P, L, hash, aud) => `${P.up}?${aud ? 'for=' + aud + '&' : ''}lang=${L}${hash || ''}`;
const icon = slug => app(slug).meta.icon;

function crumbs(id, L, P) {
  return `  <nav class="g-crumbs" data-g-aria="g_crumb_guides" aria-label="${esc(txt(L, 'g_crumb_guides'))}">` +
    `<a data-home="" href="${esc(homeHref(P, L))}">${g('span', L, 'g_crumb_home')}</a><span class="sep" aria-hidden="true">/</span>` +
    (id ? `<a data-guide="" href="${esc(guideHref(P, null, L))}">${g('span', L, 'g_crumb_guides')}</a><span class="sep" aria-hidden="true">/</span>${g('span', L, id + '_short')}`
      : g('span', L, 'g_crumb_guides')) + `</nav>\n`;
}
function endBlocks(L, P) {
  return `    <section class="g-sec g-end">
      <div class="card g-su">
        ${g('h2', L, 'g_su_h')}
        ${g('p', L, 'g_su_text')}
        <div class="g-btns"><a class="btn btn-accent btn-lg" data-home="#updates" href="${esc(homeHref(P, L, '#updates'))}"><span aria-hidden="true">✉️</span> ${g('span', L, 'g_su_btn')}</a></div>
        ${g('p', L, 'g_su_note', 'class="small muted"')}
      </div>
      <div class="card g-why">
        ${g('h2', L, 'g_why_h')}
        <ul class="g-list">${[1, 2, 3, 4].map(n => `<li>${g('span', L, 'g_why_' + n)}</li>`).join('')}</ul>
        ${g('p', L, 'g_yt_text')}
        <div class="g-btns"><a class="btn btn-yt" href="${YT_SUB}" target="_blank" rel="noopener"><span aria-hidden="true">▶</span> ${g('span', L, 'g_yt_btn')}</a></div>
      </div>
    </section>
`;
}
const NATIVE = { en: 'English', hi: 'हिन्दी', bn: 'বাংলা', mr: 'मराठी', gu: 'ગુજરાતી', pa: 'ਪੰਜਾਬੀ', or: 'ଓଡ଼ିଆ', ta: 'தமிழ்', te: 'తెలుగు', kn: 'ಕನ್ನಡ', ml: 'മലയാളം', ur: 'اردو' };
/* the same page in every language (plain links for people and search engines; names stay in their own script) */
function langLinks(id, L, P) {
  return `    <nav class="g-langs" aria-label="${esc(txt(L, 'g_langs'))}" data-g-aria="g_langs">${g('span', L, 'g_langs', 'class="g-langs-t"')}<span class="no-i18n">` +
    LANGS.map(x => x === L ? `<span lang="${x}" aria-current="page">${NATIVE[x]}</span>` : `<a lang="${x}" hreflang="${x}" data-guide="${id || ''}" data-glang="${x}" href="${esc(guideHref(P, id, x))}">${NATIVE[x]}</a>`).join('') + `</span></nav>
`;
}
function shareBlock(id, L, P) {
  const title = txt(L, id ? id + '_short' : 'g_ix_short');
  const msg = t(L, 'g_wa', { title, url: P.url });
  return `    <section class="g-sec card g-share">
      <div>${g('h2', L, 'g_share_h')}${g('p', L, 'g_share_text')}</div>
      <a class="btn btn-wa" id="g-wa" href="https://wa.me/?text=${esc(encodeURIComponent(msg))}" target="_blank" rel="noopener">${WA_SVG} <span data-i18n="shell_wa">${esc(COMMON[L].shell_wa)}</span></a>
    </section>
`;
}

function guidePage(gd, L) {
  const id = gd.id, P = paths(id, L), og = ogImage(id, L);
  const title = txt(L, id + '_doc'), desc = txt(L, id + '_desc');
  const shotName = n => SLUGS[id] + '-' + n;
  const imgFor = n => { const nm = shotName(n) + '-' + (L === 'hi' ? 'hi' : 'en'); return { nm, src: P.gbase + 'img/' + nm + '.webp', abs: S.SITE + 'guides/img/' + nm + '.webp', size: IMG[nm] }; };
  const ctaApp = gd.cta.app;
  /* JSON-LD */
  const steps = [];
  for (let i = 1; i <= gd.steps; i++) {
    const st = { '@type': 'HowToStep', position: i, name: txt(L, `${id}_s${i}_t`), text: txt(L, `${id}_s${i}`), url: P.url + '#step-' + i };
    if (gd.shots[i]) st.image = imgFor(gd.shots[i]).abs;
    steps.push(st);
  }
  const faq = [];
  for (let i = 1; i <= gd.faq; i++) faq.push({ '@type': 'Question', name: txt(L, `${id}_q${i}`), acceptedAnswer: { '@type': 'Answer', text: txt(L, `${id}_a${i}`) } });
  const jsonld = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'Article', '@id': P.url + '#article', headline: txt(L, id + '_h1').slice(0, 110), description: desc, inLanguage: L, url: P.url, mainEntityOfPage: P.url,
        datePublished: S.PUBLISHED, dateModified: S.UPDATED, image: [og.url], author: { '@id': S.SITE + '#org' }, publisher: ORG, isAccessibleForFree: true },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: txt(L, 'g_crumb_home'), item: S.SITE },
        { '@type': 'ListItem', position: 2, name: txt(L, 'g_crumb_guides'), item: S.pageUrl(null, L) },
        { '@type': 'ListItem', position: 3, name: txt(L, id + '_short'), item: P.url }] },
      { '@type': 'HowTo', name: txt(L, id + '_h1'), description: txt(L, id + '_quick'), inLanguage: L, step: steps,
        tool: gd.apps.slice(0, 3).map(s => ({ '@type': 'HowToTool', name: LAB[L][appKey(s)] })), estimatedCost: { '@type': 'MonetaryAmount', currency: 'INR', value: '0' } },
      { '@type': 'FAQPage', inLanguage: L, mainEntity: faq }
    ]
  };
  let h = head(id, L, P, title, desc, og, jsonld);
  h += `  <main id="app" class="g-page" data-guide="${id}" data-page-lang="${L}">\n`;
  h += crumbs(id, L, P);
  h += `    <header class="g-hero">
      ${g('span', L, 'g_kicker', 'class="g-kicker"')}
      ${g('h1', L, id + '_h1')}
      ${g('p', L, id + '_lead', 'class="g-lead"')}
      ${g('p', L, 'g_meta', 'class="g-meta small muted"', { date: S.UPDATED, min: gd.mins })}
      <div class="g-cta">
        ${ctaApp
      ? `<a class="btn btn-primary btn-lg" data-app="${ctaApp}" href="${esc(appHref(P, ctaApp, L))}"><span aria-hidden="true">${icon(ctaApp)}</span> ${g('span', L, 'g_open', '', { app: '@' + appKey(ctaApp) })}</a>`
      : `<a class="btn btn-primary btn-lg" data-home="" data-for="${gd.cta.home}" href="${esc(homeHref(P, L, '', gd.cta.home))}"><span aria-hidden="true">📚</span> ${g('span', L, 'g_open_lib')}</a>`}
        <a class="btn btn-lg" href="#steps">${g('span', L, 'g_see_steps')} <span aria-hidden="true">↓</span></a>
      </div>
    </header>
    <section class="card g-quick" aria-labelledby="g-quick-h">
      ${g('h2', L, 'g_quick_h', 'id="g-quick-h"')}
      ${g('p', L, id + '_quick')}
    </section>
    <section class="g-sec" id="steps" aria-labelledby="g-steps-h">
      ${g('h2', L, id + '_steps_h', 'id="g-steps-h"')}
      <ol class="g-steps">
`;
  for (let i = 1; i <= gd.steps; i++) {
    const n = gd.shots[i];
    let fig = '', wide = false;
    if (n) {
      const im = imgFor(n);
      if (!im.size) problems.push(`${L}/${id}: screenshot ${im.nm}.webp missing`);
      const wh = im.size ? ` width="${im.size[0]}" height="${im.size[1]}"` : '';
      wide = !!(im.size && im.size[0] > im.size[1]);   /* desktop screenshots: full width under the text */
      fig = `\n          <figure class="g-shot"><img data-shot="${shotName(n)}" src="${im.src}"${wh} loading="lazy" decoding="async" alt="${esc(txt(L, `${id}_shot${n}`))}" data-g-alt="${id}_shot${n}">${g('figcaption', L, `${id}_shot${n}`)}</figure>`;
    }
    h += `        <li class="card g-step${n ? ' has-shot' : ''}${wide ? ' is-wide' : ''}" id="step-${i}">
          <div>${g('h3', L, `${id}_s${i}_t`)}${g('p', L, `${id}_s${i}`)}</div>${fig}
        </li>
`;
  }
  h += `      </ol>
    </section>
    <section class="g-sec card" aria-labelledby="g-x-h">
      ${g('h2', L, id + '_x_h', 'id="g-x-h"')}
      <ul class="g-list">${Array.from({ length: gd.extras }, (_, k) => `\n        <li>${g('span', L, `${id}_x${k + 1}`)}</li>`).join('')}
      </ul>${gd.note ? `\n      ${g('p', L, gd.note, 'class="callout warning small g-note"')}` : ''}
    </section>
`;
  h += endBlocks(L, P);
  h += `    <section class="g-sec" id="faq" aria-labelledby="g-faq-h">
      ${g('h2', L, 'g_faq_h', 'id="g-faq-h"')}
`;
  for (let i = 1; i <= gd.faq; i++) h += `      <details class="card faq-item"${i === 1 ? ' open' : ''}>${g('summary', L, `${id}_q${i}`)}${g('p', L, `${id}_a${i}`)}</details>\n`;
  h += `    </section>
    <section class="g-sec g-related" aria-labelledby="g-apps-h">
      ${g('h2', L, 'g_apps_h', 'id="g-apps-h"')}
      <div class="g-chips">${gd.apps.map(s => `\n        <a class="chip" data-app="${s}" href="${esc(appHref(P, s, L))}"><span aria-hidden="true">${icon(s)}</span> ${g('span', L, '@' + appKey(s))}</a>`).join('')}
      </div>
    </section>
    <section class="g-sec g-related" aria-labelledby="g-more-h">
      ${g('h2', L, 'g_more_h', 'id="g-more-h"')}
      <div class="g-cards">${gd.related.map(r => card(r, L, P)).join('')}
      </div>
      <p class="g-all"><a data-guide="" href="${esc(guideHref(P, null, L))}">${g('span', L, 'g_all')}<span class="g-arr" aria-hidden="true"></span></a></p>
    </section>
`;
  h += shareBlock(id, L, P) + langLinks(id, L, P);
  h += `  </main>\n` + foot(P, SLUGS[id]);
  return { file: P.file, html: h };
}
function card(id, L, P) {
  const gd = S.GUIDES.find(x => x.id === id);
  return `\n        <a class="card g-card" data-guide="${id}" href="${esc(guideHref(P, id, L))}"><span class="g-ic" aria-hidden="true">${gd.icon}</span>${g('h3', L, id + '_short')}${g('p', L, id + '_card')}<span class="g-go">${g('span', L, 'g_read')}<span class="g-arr" aria-hidden="true"></span></span></a>`;
}
function indexPage(L) {
  const P = paths(null, L), og = ogImage(null, L);
  const title = txt(L, 'g_ix_doc'), desc = txt(L, 'g_ix_desc');
  const all = S.GROUPS.flatMap(gr => gr.ids);
  const jsonld = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'CollectionPage', '@id': P.url + '#page', url: P.url, name: txt(L, 'g_ix_h1'), description: desc, inLanguage: L, dateModified: S.UPDATED,
        isPartOf: { '@type': 'WebSite', '@id': S.SITE + '#website', url: S.SITE, name: 'AI Pathshala' }, publisher: ORG,
        mainEntity: { '@type': 'ItemList', numberOfItems: all.length, itemListElement: all.map((id, i) => ({ '@type': 'ListItem', position: i + 1, url: S.pageUrl(id, L), name: txt(L, id + '_h1') })) } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: txt(L, 'g_crumb_home'), item: S.SITE },
        { '@type': 'ListItem', position: 2, name: txt(L, 'g_crumb_guides'), item: P.url }] }
    ]
  };
  let h = head(null, L, P, title, desc, og, jsonld);
  h += `  <main id="app" class="g-page g-index" data-guide="" data-page-lang="${L}">\n`;
  h += crumbs(null, L, P);
  h += `    <header class="g-hero">
      ${g('span', L, 'g_ix_kicker', 'class="g-kicker"')}
      ${g('h1', L, 'g_ix_h1')}
      ${g('p', L, 'g_ix_lead', 'class="g-lead"')}
    </header>
`;
  S.GROUPS.forEach((gr, i) => {
    h += `    <section class="g-sec g-group" aria-labelledby="g-grp-${i + 1}">
      ${g('h2', L, gr.key, `id="g-grp-${i + 1}"`)}
      <div class="g-cards">${gr.ids.map(id => card(id, L, P)).join('')}
      </div>
    </section>
`;
  });
  h += endBlocks(L, P) + shareBlock(null, L, P) + langLinks(null, L, P);
  h += `  </main>\n` + foot(P, 'index');
  return { file: P.file, html: h };
}

/* ---------- write ---------- */
function writeIfChanged(rel, content) {
  const file = path.join(ROOT, rel);
  try { if (fs.readFileSync(file, 'utf8') === content) return false; } catch (e) { }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file + '.tmp', content); fs.renameSync(file + '.tmp', file);
  return true;
}
let changed = 0, pages = 0;
const labelsJs = '/* generated by guides/_build/build.js from apps/<slug>/meta.json + strings.js and EDU.COMMON: do not edit */\n' +
  'window.GUIDES_SLUGS = ' + JSON.stringify(SLUGS) + ';\n' +
  'window.GUIDES_IMG = ' + JSON.stringify(IMG) + ';\n' +
  'window.GUIDES_LABELS = {\n' + S.LANGS.map(L => '  ' + L + ': ' + JSON.stringify(LAB[L])).join(',\n') + '\n};\n';
if (writeIfChanged('guides/labels.js', labelsJs)) changed++;
/* per-page string bundles: only the keys a page shows (all 12 languages, for the live language switch),
   so a phone downloads about a tenth of guides/strings.js */
function bundle(name, keys) {
  const pick = {};
  for (const L of S.LANGS) if (STR[L]) pick[L] = Object.fromEntries(keys.filter(k => STR[L][k] !== undefined).map(k => [k, STR[L][k]]));
  const NL = String.fromCharCode(10);
  const js = '/* generated by guides/_build/build.js from guides/strings.js (edit that file, then rebuild): do not edit */' + NL +
    'window.GUIDES_STRINGS = {' + NL + Object.entries(pick).map(([L, o]) => '  ' + L + ': ' + JSON.stringify(o)).join(',' + NL) + NL + '};' + NL;
  if (writeIfChanged('guides/i18n/' + name + '.js', js)) changed++;
}
const cardKeys = id => [id + '_short', id + '_card'];
for (const gd of S.GUIDES) bundle(gd.slug, [...S.COMMON_KEYS, ...S.guideKeys(gd), ...gd.related.flatMap(cardKeys)]);
bundle('index', [...S.COMMON_KEYS, ...S.GUIDES.flatMap(g => cardKeys(g.id))]);
for (const L of LANGS) {
  for (const p of [indexPage(L), ...S.GUIDES.map(gd => guidePage(gd, L))]) { pages++; if (writeIfChanged(p.file, p.html)) changed++; }
}
console.log(`guides: ${pages} pages in ${LANGS.length} languages (${LANGS.join(' ')}), ${changed} files written, ${Object.keys(IMG).length} screenshots`);
const uniq = [...new Set(problems)];
if (uniq.length) { console.log(uniq.length + ' problems:\n' + uniq.slice(0, 60).join('\n')); process.exitCode = 1; }
