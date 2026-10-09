#!/usr/bin/env node
/* Builds catalog.js (window.EDU_CATALOG) + APPS.md + sitemap.xml + the apps JSON-LD block in index.html,
   all from apps/<slug>/meta.json.
   node tools/build_catalog.js [--zip <url>] [--only-passing]
   --only-passing: an app is "fresh" when tools/reports/<slug>.json says ok AND was written after the
   newest file in apps/<slug>/ (+ its test). Fresh apps are listed from the working tree and written to
   tools/.publish_stage for staging; apps already published (tracked in git HEAD) but not fresh right now
   (e.g. being edited) stay in the catalog using their committed meta.json and are not re-staged.
   Site outputs:
   - catalog.js also sets window.EDU_SITE = { zip, press? } (press = printable flyer/kit if press/ exists).
   - sitemap.xml lists home, schools.html, business.html, press/index.html (if present), every catalogued app and,
     if guides/index.html exists, every guide page (all 12 languages; folders starting with _ are skipped).
   - index.html: the block between <!-- build:apps-jsonld ... --> and <!-- /build:apps-jsonld --> is replaced with an
     ItemList of the apps (schema.org SoftwareApplication, free, 12 languages). Nothing else in index.html is touched. */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const SITE_URL = 'https://apnipathshala.ai/';
const DEFAULT_ZIP = 'https://github.com/indiazenaitech-ops/ai-pathshala-apps/archive/refs/heads/main.zip';
const LANGS = ['en', 'hi', 'bn', 'mr', 'gu', 'pa', 'or', 'ta', 'te', 'kn', 'ml', 'ur'];
const argv = process.argv.slice(2);
const zipIdx = argv.indexOf('--zip');
const zip = (zipIdx >= 0 ? argv[zipIdx + 1] : '') || DEFAULT_ZIP;
const onlyPassing = argv.includes('--only-passing');
const CATS = ['learn-ai', 'teacher-tools', 'math', 'science', 'coding', 'languages', 'study-skills', 'digital-safety', 'business', 'marketing', 'everyday', 'data'];
/* categories for work and everyday use (not school subjects): no class level in the JSON-LD */
const WORK_CATS = { business: 'BusinessApplication', marketing: 'BusinessApplication', everyday: 'UtilitiesApplication', data: 'BusinessApplication' };

function newestMtime(p) {
  let m = 0;
  if (!fs.existsSync(p)) return 0;
  const st = fs.statSync(p);
  if (!st.isDirectory()) return st.mtimeMs;
  for (const f of fs.readdirSync(p)) m = Math.max(m, newestMtime(path.join(p, f)));
  return m;
}
/* tools/.publish_hold: one slug per line (# comments ok). Apps another session is still building/QA-ing are
   never treated as publish-ready, even with a PASS report; already-published versions stay as they are. */
const HOLD = (() => { try { return new Set(fs.readFileSync(path.join(__dirname, '.publish_hold'), 'utf8').split(/\r?\n/).map(l => l.replace(/#.*/, '').trim()).filter(Boolean)); } catch (e) { return new Set(); } })();
function fresh(slug) {
  if (HOLD.has(slug)) return false;
  const rp = path.join(__dirname, 'reports', slug + '.json');
  if (!fs.existsSync(rp)) return false;
  const r = JSON.parse(fs.readFileSync(rp, 'utf8'));
  if (!r.ok || r.quick) return false;   /* a --quick run (3 languages) never counts as publish-ready */
  const verifiedAt = Date.parse(r.at) || fs.statSync(rp).mtimeMs;
  const changed = Math.max(newestMtime(path.join(ROOT, 'apps', slug)), newestMtime(path.join(__dirname, 'tests', slug + '.test.js')));
  return verifiedAt >= changed - 1000;
}
function committedMeta(slug) {
  try { return JSON.parse(cp.execSync(`git show HEAD:apps/${slug}/meta.json`, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString()); }
  catch (e) { return null; }
}
/* write only when the content changed (keeps mtimes and git diffs quiet); atomic rename so a reader never sees half a file */
function writeIfChanged(file, content) {
  try { if (fs.readFileSync(file, 'utf8') === content) return false; } catch (e) { }
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, file);
  return true;
}
const day = ms => new Date(ms || Date.now()).toISOString().slice(0, 10);
const xmlEsc = s => String(s).replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

const apps = [], skipped = [], stage = [], held = [], lastmod = {};
for (const slug of fs.readdirSync(path.join(ROOT, 'apps')).sort()) {
  if (slug.startsWith('_')) continue;
  const dir = path.join(ROOT, 'apps', slug);
  const mp = path.join(dir, 'meta.json');
  let m = null;
  if (onlyPassing) {
    if (fs.existsSync(mp) && fresh(slug)) { m = JSON.parse(fs.readFileSync(mp, 'utf8')); stage.push(slug); }
    else if ((m = committedMeta(slug))) held.push(slug);
    else { skipped.push(slug); continue; }
  } else {
    if (!fs.existsSync(mp) || !fs.existsSync(path.join(dir, 'index.html'))) { skipped.push(slug); continue; }
    m = JSON.parse(fs.readFileSync(mp, 'utf8'));
  }
  lastmod[m.slug] = day(newestMtime(dir));
  apps.push({ slug: m.slug, icon: m.icon, category: m.category, grades: m.grades, audience: m.audience, needs: m.needs || [], tags: m.tags || [], order: m.order, title: m.title, desc: m.desc });
}
apps.sort((a, b) => CATS.indexOf(a.category) - CATS.indexOf(b.category) || a.title.en.localeCompare(b.title.en));

/* printable flyer / press kit made by the social-kit step (optional) */
let press = null;
const pressDir = path.join(ROOT, 'press');
if (fs.existsSync(pressDir) && fs.statSync(pressDir).isDirectory()) {
  const files = [];
  (function walk(d, rel) { for (const f of fs.readdirSync(d)) { if (f.startsWith('.')) continue; const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p, rel + f + '/'); else files.push(rel + f); } })(pressDir, '');
  const pdfs = files.filter(f => /\.pdf$/i.test(f));
  const pick = re => pdfs.find(f => re.test(f));
  press = {};
  const hi = pick(/(one-?pager|flyer|brochure)[^/]*[-_]hi\.pdf$/i), en = pick(/(one-?pager|flyer|brochure)[^/]*[-_]en\.pdf$/i);
  const any = pick(/(one-?pager|flyer|brochure)/i) || pdfs[0];
  if (hi) press.flyer_hi = 'press/' + hi;
  if (en) press.flyer_en = 'press/' + en;
  if (any || hi || en) press.flyer = 'press/' + (en || any || hi);
  if (files.includes('index.html')) press.kit = 'press/index.html';
  if (!press.flyer && press.kit) press.flyer = press.kit;
  if (!Object.keys(press).length) press = null;
}

let out = '/* generated by tools/build_catalog.js — do not edit */\n';
out += 'window.EDU_CATALOG = ' + JSON.stringify(apps, null, 1) + ';\n';
out += 'window.EDU_SITE = ' + JSON.stringify(press ? { zip, press } : { zip }) + ';\n';
fs.writeFileSync(path.join(ROOT, 'catalog.js'), out);
if (onlyPassing) fs.writeFileSync(path.join(__dirname, '.publish_stage'), stage.join('\n'));
console.log(`catalog.js: ${apps.length} apps` + (onlyPassing ? ` (fresh: ${stage.length}, held at published version: ${held.join(' ') || '-'}, not ready: ${skipped.length})` : ''));

/* APPS.md (shown on GitHub): live links */
const rows = apps.map(a => `| ${a.icon} | [${a.title.en}](${SITE_URL}apps/${a.slug}/) | ${a.category} | ${a.grades} | ${a.desc.en.replace(/\|/g, '/')} |`);
writeIfChanged(path.join(ROOT, 'APPS.md'), `# App list (${apps.length})\n\nLive: ${SITE_URL} · For schools: ${SITE_URL}schools.html · Offline ZIP: ${zip}\n\n| | App | Category | Classes | What it does |\n|---|---|---|---|---|\n${rows.join('\n')}\n`);

/* sitemap.xml */
const newestApp = Object.values(lastmod).sort().pop() || day();
const urls = [{ loc: SITE_URL, lastmod: [day(newestMtime(path.join(ROOT, 'index.html'))), newestApp].sort().pop(), pri: '1.0' }];
if (fs.existsSync(path.join(ROOT, 'schools.html'))) urls.push({ loc: SITE_URL + 'schools.html', lastmod: day(Math.max(newestMtime(path.join(ROOT, 'schools.html')), newestMtime(path.join(ROOT, 'shared', 'schools-strings.js')))), pri: '0.9' });
if (fs.existsSync(path.join(ROOT, 'business.html'))) urls.push({ loc: SITE_URL + 'business.html', lastmod: day(Math.max(newestMtime(path.join(ROOT, 'business.html')), newestMtime(path.join(ROOT, 'shared', 'business-strings.js')))), pri: '0.9' });
for (const [pg, str] of [['about.html', 'about-strings.js'], ['contact.html', 'contact-strings.js'], ['videos.html', 'videos-strings.js']]) if (fs.existsSync(path.join(ROOT, pg))) urls.push({ loc: SITE_URL + pg, lastmod: day(Math.max(newestMtime(path.join(ROOT, pg)), newestMtime(path.join(ROOT, 'shared', str)))), pri: '0.6' });
if (press && press.kit) urls.push({ loc: SITE_URL + press.kit, lastmod: day(newestMtime(pressDir)), pri: '0.5' });
for (const a of apps) urls.push({ loc: `${SITE_URL}apps/${a.slug}/`, lastmod: lastmod[a.slug], pri: '0.8' });
/* language pages made by tools/build_lang_pages.js: <lang>/ and <lang>/apps/<slug>/ (only those that exist) */
for (const l of ['hi', 'bn', 'mr', 'gu', 'pa', 'or', 'ta', 'te', 'kn', 'ml', 'ur']) {
  if (fs.existsSync(path.join(ROOT, l, 'index.html'))) urls.push({ loc: `${SITE_URL}${l}/`, lastmod: urls[0].lastmod, pri: '0.9' });
  for (const a of apps) if (fs.existsSync(path.join(ROOT, l, 'apps', a.slug, 'index.html'))) urls.push({ loc: `${SITE_URL}${l}/apps/${a.slug}/`, lastmod: lastmod[a.slug], pri: '0.7' });
}
/* free how-to guides, one static page per language (guides/index.html, guides/<slug>/, guides/<lang>/, guides/<lang>/<slug>/;
   built by guides/_build/build.js). Folders starting with _ and the img/ i18n/ assets are skipped. */
const guidesDir = path.join(ROOT, 'guides');
if (fs.existsSync(path.join(guidesDir, 'index.html'))) {
  const pages = [];
  (function walk(dir, rel, depth) {
    if (fs.existsSync(path.join(dir, 'index.html'))) pages.push(rel);
    if (depth >= 2) return;
    for (const f of fs.readdirSync(dir).sort()) {
      if (f.startsWith('_') || f.startsWith('.') || f === 'img' || f === 'i18n') continue;
      if (fs.statSync(path.join(dir, f)).isDirectory()) walk(path.join(dir, f), rel + f + '/', depth + 1);
    }
  })(guidesDir, 'guides/', 0);
  for (const rel of pages) urls.push({ loc: SITE_URL + rel, lastmod: day(fs.statSync(path.join(ROOT, rel, 'index.html')).mtimeMs), pri: '0.7' });
}
const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(u => `  <url><loc>${xmlEsc(u.loc)}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.pri}</priority></url>`).join('\n') + '\n</urlset>\n';
writeIfChanged(path.join(ROOT, 'sitemap.xml'), sitemap);
console.log(`sitemap.xml: ${urls.length} urls`);

/* index.html: apps ItemList JSON-LD between the build markers */
const idx = path.join(ROOT, 'index.html');
try {
  const html = fs.readFileSync(idx, 'utf8');
  const re = /(<!-- build:apps-jsonld[^>]*-->)[\s\S]*?(<!-- \/build:apps-jsonld -->)/;
  if (!re.test(html)) console.log('index.html: no apps-jsonld markers, skipped');
  else {
    const level = g => (!g || g === 'all') ? 'Classes 1-12' : (g === 'UG' || g === 'PG') ? 'College' : 'Class ' + g;
    const ld = {
      '@context': 'https://schema.org', '@type': 'ItemList', name: 'Free AI, learning and work apps in 12 Indian languages', numberOfItems: apps.length,
      itemListElement: apps.map((a, i) => ({
        '@type': 'ListItem', position: i + 1,
        item: {
          '@type': 'SoftwareApplication', name: a.title.en, alternateName: a.title.hi, description: a.desc.en,
          url: `${SITE_URL}apps/${a.slug}/`, applicationCategory: WORK_CATS[a.category] || 'EducationalApplication', operatingSystem: 'Any (web browser)',
          isAccessibleForFree: true, inLanguage: LANGS,
          ...(WORK_CATS[a.category]
            ? { audience: { '@type': 'Audience', audienceType: a.category === 'everyday' ? 'Everyone' : a.category === 'data' ? 'Students, analysts and businesses' : 'Businesses, teams and creators' } }
            : { educationalLevel: level(a.grades), audience: { '@type': 'EducationalAudience', educationalRole: (a.audience || ['student']).join(', ') } }),
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
          publisher: { '@id': SITE_URL + '#org' }
        }
      }))
    };
    const block = '\n  <script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>\n  ';
    const next = html.replace(re, (m0, a, b) => a + block + b);
    if (writeIfChanged(idx, next)) console.log(`index.html: apps JSON-LD updated (${apps.length} apps)`);
  }
} catch (e) { console.log('index.html JSON-LD skipped: ' + e.message); }

/* index.html: a static, crawlable copy of the app grid inside #list (English), between <!-- build:apps-static --> markers.
   Search engines and no-JS visitors see real links to every app; shared/home.js replaces it with the live grid on load. */
try {
  const html = fs.readFileSync(idx, 'utf8');
  const re = /(<!-- build:apps-static[^>]*-->)[\s\S]*?(<!-- \/build:apps-static -->)/;
  if (!re.test(html)) console.log('index.html: no apps-static markers, skipped');
  else {
    const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const cards = apps.map(a => `<a class="app-card" href="apps/${a.slug}/"><div class="app-name"><span class="ic" aria-hidden="true">${esc(a.icon)}</span><h3>${esc(a.title.en)}</h3></div><p>${esc(a.desc.en)}</p></a>`).join('\n      ');
    const next = html.replace(re, (m0, a, b) => a + '\n      ' + cards + '\n      ' + b);
    if (writeIfChanged(idx, next)) console.log(`index.html: static app grid updated (${apps.length} apps)`);
  }
} catch (e) { console.log('index.html static grid skipped: ' + e.message); }
