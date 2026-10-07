#!/usr/bin/env node
/* Renders the 1200x630 social-sharing (Open Graph) images with headless Chrome.
 *   node tools/make_og.js                 -> shared/img/og-home.png + shared/img/og-schools.png
 *   node tools/make_og.js --apps          -> also shared/img/og/<slug>.png for every app in catalog.js
 *   node tools/make_og.js --apps --only quiz-maker,flashcards [--out <dir>]
 * Needs internet once (Google Fonts: Baloo 2 + Mukta, both have Devanagari). Uses playwright-core + system Chrome,
 * like tools/verify.js. WhatsApp shows previews only for images under ~300 KB, so the script reports file sizes.
 * tools/inject_og.js points each app's og:image at shared/img/og/<slug>.png when that file exists. */
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const OUT = path.resolve(opt('--out') || path.join(ROOT, 'shared', 'img'));
const ONLY = (opt('--only') || '').split(',').filter(Boolean);
const CHROME = require('./chrome-path')();

const LOGO = 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'shared', 'img', 'icon-512.png')).toString('base64');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const BASE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Mukta:wght@500;600;700&display=block');
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1200px;height:630px;overflow:hidden}
body{font-family:'Mukta','Nirmala UI',sans-serif;color:#fff;position:relative;background:#0b4f5c}
.dots{position:absolute;right:-140px;top:-160px;width:620px;height:620px;border-radius:50%;background:#0f5d6b}
.bar{position:absolute;left:0;right:0;bottom:0;height:14px;background:#d9501c}
.wrap{position:absolute;inset:0;padding:54px 60px 40px}
.brand{display:flex;align-items:center;gap:18px}
.brand img{width:84px;height:84px;border-radius:20px;}
.brand b{font-family:'Baloo 2';font-weight:800;font-size:40px;line-height:1}
.brand span{display:block;font-size:22px;color:#bfe3e8;font-weight:600;margin-top:4px}
h1{font-family:'Baloo 2';font-weight:800;line-height:1.08;letter-spacing:-.5px}
h2{font-weight:600;color:#ffd7c4;line-height:1.2}
.chips{display:flex;flex-wrap:wrap;gap:12px}
.chip{background:#16606d;border:2px solid #2f7a86;border-radius:999px;padding:5px 16px 3px;font-size:24px;font-weight:600;white-space:nowrap}
.chip i{font-style:normal;color:#ffb38f;margin-right:8px}
.url{position:absolute;left:60px;bottom:40px;background:#d9501c;color:#fff;font-weight:700;font-size:30px;border-radius:14px;padding:6px 22px 4px}
.tiles{position:absolute;right:46px;top:118px;display:grid;grid-template-columns:repeat(3,112px);gap:16px;transform:rotate(-6deg)}
.tile{width:112px;height:112px;border-radius:26px;background:#faf6f0;display:grid;place-items:center;font-size:62px;font-family:'Segoe UI Emoji','Noto Color Emoji','Apple Color Emoji',sans-serif}
.tile:nth-child(3n+2){transform:translateY(26px)}
.tile.o{background:#d9501c}.tile.t{background:#5cc0cf}
`;

function page(body, extraCss) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}${extraCss || ''}</style></head><body><div class="dots"></div>${body}<div class="bar"></div></body></html>`;
}
const brand = `<div class="brand"><img src="${LOGO}" alt=""><div><b>AI की पाठशाला</b><span>AI Pathshala · YouTube @Apni_Pathshala_AI</span></div></div>`;
function tiles(icons) { return `<div class="tiles">${icons.slice(0, 9).map((ic, i) => `<div class="tile${i === 4 ? ' o' : i === 0 || i === 8 ? ' t' : ''}">${esc(ic)}</div>`).join('')}</div>`; }

function homeHtml(icons) {
  return page(`<div class="wrap">${brand}
  <h1 style="font-size:78px;margin-top:34px;max-width:720px">स्कूलों के लिए<br>मुफ़्त AI ऐप्स</h1>
  <h2 style="font-size:38px;margin-top:10px;max-width:720px">Free AI &amp; learning apps for schools</h2>
  <div class="chips" style="margin-top:26px;max-width:720px">
    <span class="chip"><i>✓</i>12 भाषाएँ</span><span class="chip"><i>✓</i>न साइन-अप, न विज्ञापन</span><span class="chip"><i>✓</i>ऑफ़लाइन भी</span>
  </div></div>${tiles(icons)}<div class="url">apnipathshala.ai</div>`);
}
function schoolsHtml(icons) {
  return page(`<div class="wrap">${brand}
  <h1 style="font-size:70px;margin-top:34px;max-width:700px">एक दिन में पूरे स्कूल में मुफ़्त AI ऐप्स</h1>
  <h2 style="font-size:34px;margin-top:12px;max-width:700px">Guide for principals &amp; teachers</h2>
  <div class="chips" style="margin-top:22px;max-width:760px">
    <span class="chip"><i>✓</i>CBSE AI 417/843 · CS · IP</span><span class="chip"><i>✓</i>मुफ़्त टीचर वर्कशॉप</span><span class="chip"><i>✓</i>₹0</span>
  </div></div>${tiles(icons)}<div class="url">apnipathshala.ai/schools</div>`);
}
/* English cards (default link previews for the site pages since 2026-10-07: WhatsApp shows ONE card per URL, so it is English) */
const brandEn = `<div class="brand"><img src="${LOGO}" alt=""><div><b>AI Pathshala</b><span>AI की पाठशाला · YouTube @Apni_Pathshala_AI</span></div></div>`;
function enCard(icons, title, sub, chips, url) {
  return page(`<div class="wrap">${brandEn}
  <h1 style="font-size:74px;margin-top:34px;max-width:720px">${title}</h1>
  <h2 style="font-size:34px;margin-top:12px;max-width:720px">${sub}</h2>
  <div class="chips" style="margin-top:24px;max-width:740px">${chips.map(c => `<span class="chip"><i>✓</i>${c}</span>`).join('')}</div>
  </div>${tiles(icons)}<div class="url">${url}</div>`);
}
function appHtml(a) {
  const hi = (a.title && a.title.hi) || '', en = (a.title && a.title.en) || a.slug;
  const desc = (a.desc && a.desc.hi) || '';
  return page(`<div class="wrap">${brand}
  <div style="display:flex;gap:40px;align-items:center;margin-top:46px">
    <div class="tile" style="width:210px;height:210px;font-size:126px;border-radius:44px;flex:none">${esc(a.icon || '📘')}</div>
    <div style="min-width:0">
      <h1 style="font-size:${hi.length > 22 ? 58 : 70}px">${esc(hi)}</h1>
      <h2 style="font-size:38px;margin-top:8px">${esc(en)}</h2>
      <p style="font-size:27px;margin-top:16px;color:#d8eef1;line-height:1.35;max-height:110px;overflow:hidden">${esc(desc)}</p>
    </div></div>
  <div class="chips" style="position:absolute;right:60px;bottom:40px"><span class="chip"><i>✓</i>मुफ़्त · 12 भाषाएँ</span></div>
  </div><div class="url">apnipathshala.ai</div>`);
}

(async () => {
  if (!CHROME) throw new Error('no Chrome/Edge found');
  const sandbox = { window: {} };
  require('vm').runInNewContext(fs.readFileSync(path.join(ROOT, 'catalog.js'), 'utf8'), sandbox);
  const apps = sandbox.window.EDU_CATALOG || [];
  const pickIcons = (prefer) => {
    const seen = new Set(), out = [];
    for (const s of prefer) { const a = apps.find(x => x.slug === s); if (a && !seen.has(a.icon)) { seen.add(a.icon); out.push(a.icon); } }
    for (const a of apps) if (out.length < 9 && !seen.has(a.icon)) { seen.add(a.icon); out.push(a.icon); }
    while (out.length < 9) out.push('📘');
    return out;
  };
  const icons = pickIcons(['chatbot-builder', 'neural-network-playground', 'python-playground', 'teachable-machine', 'quiz-maker', 'math-practice', 'graph-plotter', 'read-aloud', 'phishing-spotter']);
  const jobs = [];
  if (!ONLY.length) {
    jobs.push({ file: path.join(OUT, 'og-home.png'), html: homeHtml(icons) });
    jobs.push({ file: path.join(OUT, 'og-schools.png'), html: schoolsHtml(pickIcons(['ai-project-cycle', 'confusion-matrix-lab', 'sql-playground', 'attendance-register', 'marks-report-card', 'class-timer', 'tokenizer-lab', 'whiteboard', 'flashcards'])) });
  }
  if (!ONLY.length) {
    const n = apps.length >= 100 ? '100+' : String(apps.length);
    jobs.push({ file: path.join(OUT, 'og-everyone-en.png'), html: enCard(icons, `${n} free AI tools<br>for everyone`, 'Learn, teach and work: in 12 Indian languages',
      ['No sign-up', 'No ads', 'Works offline'], 'apnipathshala.ai') });
    jobs.push({ file: path.join(OUT, 'og-schools-en.png'), html: enCard(pickIcons(['ai-project-cycle', 'teachable-machine', 'python-playground', 'sql-playground', 'live-quiz', 'marks-report-card', 'attendance-register', 'worksheet-generator', 'certificate-maker']),
      'Free AI apps for<br>your whole school', 'CBSE AI (417/843), CS and IP · guide for principals', ['No sign-up for students', 'No ads', '₹0'], 'apnipathshala.ai/schools') });
    jobs.push({ file: path.join(OUT, 'og-business-en.png'), html: enCard(pickIcons(['gst-invoice-maker', 'salary-slip-maker', 'pdf-merge-split', 'stock-register', 'udhaar-khata', 'chart-maker', 'resume-builder', 'upi-qr-standee', 'image-compressor']),
      'Free, private tools<br>for your team', 'GST, salary slips, PDFs, data: files never uploaded', ['No sign-up', 'Works offline', '12 languages'], 'apnipathshala.ai/business') });
  }
  if (argv.includes('--apps') || ONLY.length) {
    for (const a of apps) if (!ONLY.length || ONLY.includes(a.slug)) jobs.push({ file: path.join(OUT, 'og', a.slug + '.png'), html: appHtml(a) });
  }
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const pg = await ctx.newPage();
  for (const j of jobs) {
    await pg.setContent(j.html, { waitUntil: 'networkidle' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.waitForTimeout(300);
    fs.mkdirSync(path.dirname(j.file), { recursive: true });
    await pg.screenshot({ path: j.file, type: 'png' });
    const kb = fs.statSync(j.file).size / 1024;
    console.log(`${path.relative(ROOT, j.file)}  ${kb.toFixed(0)} KB${kb > 300 ? '  (over 300 KB: WhatsApp may skip the preview)' : ''}`);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
