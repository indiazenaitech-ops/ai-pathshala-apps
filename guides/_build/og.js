#!/usr/bin/env node
/* Share images (Open Graph, 1200x630 JPEG) for the guides, in English and Hindi:
 *   guides/img/og-<guide slug>-<en|hi>.jpg and guides/img/og-index-<en|hi>.jpg
 * Text comes from guides/strings.js, the picture is the guide's first screenshot (run shots.js first).
 *   node guides/_build/og.js   then   node guides/_build/build.js */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { chromium } = require(path.resolve(__dirname, '../../tools/node_modules/playwright-core'));
const S = require('./structure.js');
const ROOT = path.resolve(__dirname, '..', '..');
const IMG = path.join(ROOT, 'guides', 'img');
const CHROME = require('../../tools/chrome-path')();
const sb = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'guides', 'strings.js'), 'utf8'), sb);
const STR = sb.window.GUIDES_STRINGS;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/&lt;(\/?)(b|i)&gt;/g, '');
const dataUrl = f => 'data:' + (f.endsWith('.png') ? 'image/png' : 'image/webp') + ';base64,' + fs.readFileSync(f).toString('base64');
const icon = dataUrl(path.join(ROOT, 'shared', 'img', 'icon-192.png'));
/* {app_x}/{label} placeholders do not appear in the short title and card line; strip any just in case */
const clean = s => String(s).replace(/\{\w+\}/g, '').replace(/\s+/g, ' ').trim();

function html(L, title, sub, kicker, shots) {
  const font = L === 'hi' ? '"Noto Sans Devanagari", "Noto Sans"' : '"Noto Sans"';
  const pics = shots.map((s, i) => `<img class="shot s${i}" src="${s}">`).join('');
  return `<!doctype html><html lang="${L}"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@500;700;800&family=Noto+Sans+Devanagari:wght@500;700;800&display=block" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;background:#faf6f0;font-family:${font},sans-serif;color:#1b2a30;position:relative}
.band{position:absolute;inset:0 auto 0 0;width:14px;background:#0b4f5c}
.left{position:absolute;left:70px;top:58px;width:${shots.length ? 620 : 1060}px;bottom:52px;display:flex;flex-direction:column}
.wide .left{width:560px}
.wide h1{font-size:54px}
.brand{display:flex;align-items:center;gap:14px;font-weight:800;font-size:30px;color:#0b4f5c}
.brand img{width:62px;height:62px;border-radius:14px}
.kicker{align-self:flex-start;margin-top:34px;background:#fde6da;color:#b33d12;font-weight:800;font-size:26px;padding:6px 18px;border-radius:999px}
h1{margin-top:20px;font-size:${title.length > 34 ? 56 : 66}px;line-height:1.16;font-weight:800;letter-spacing:-.5px}
p{margin-top:18px;font-size:29px;line-height:1.4;color:#4a5a60;font-weight:500}
.foot{margin-top:auto;font-size:24px;font-weight:700;color:#0b4f5c}
.right{position:absolute;right:56px;top:40px;bottom:40px;width:420px}
.shot{position:absolute;border-radius:18px;border:2px solid #e3d8c9;box-shadow:0 18px 40px rgba(20,30,35,.18);background:#fff;object-fit:cover;object-position:top}
.s0{right:0;top:0;width:400px;height:550px}
.s1{right:250px;top:120px;width:300px;height:400px;opacity:.97}
.wide .s0{width:500px;height:400px;top:110px;right:0;object-position:left top}
</style></head><body>
<div class="band"></div>
<div class="left">
  <div class="brand"><img src="${icon}">AI की पाठशाला · AI Pathshala</div>
  <div class="kicker">${esc(kicker)}</div>
  <h1>${esc(title)}</h1>
  <p>${esc(sub)}</p>
  <div class="foot">apnipathshala.ai/guides</div>
</div>
<div class="right">${pics}</div>
</body></html>`;
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })).newPage();
  const jobs = [];
  for (const L of ['en', 'hi']) {
    const T = STR[L];
    for (const g of S.GUIDES) {
      const shot = path.join(IMG, `${g.slug}-1-${L}.webp`);
      jobs.push({ out: `og-${g.slug}-${L}.jpg`, L, title: clean(T[g.id + '_short']), sub: clean(T[g.id + '_card']), kicker: clean(T.g_kicker), shots: fs.existsSync(shot) ? [dataUrl(shot)] : [] });
    }
    const picks = ['in-hand-salary-calculator-1'].map(n => path.join(IMG, `${n}-${L}.webp`)).filter(f => fs.existsSync(f));
    jobs.push({ out: `og-index-${L}.jpg`, L, title: clean(T.g_ix_h1), sub: clean(T.g_ix_kicker), kicker: clean(T.g_ix_short), shots: picks.map(dataUrl) });
  }
  for (const j of jobs) {
    await page.setContent(html(j.L, j.title, j.sub, j.kicker, j.shots), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    /* a wide (desktop) screenshot gets a landscape frame */
    await page.evaluate(() => { const i = document.querySelector('.s0'); if (i && document.querySelectorAll('.shot').length === 1 && i.naturalWidth > i.naturalHeight) document.body.classList.add('wide'); });
    const out = path.join(IMG, j.out);
    await page.screenshot({ path: out, type: 'jpeg', quality: 84 });
    console.log(j.out, (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
  }
  await browser.close();
})();
