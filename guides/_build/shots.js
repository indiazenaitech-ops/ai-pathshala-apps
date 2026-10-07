#!/usr/bin/env node
/* Screenshots for the guides, taken from the LIVE site (https://apnipathshala.ai) in English and Hindi, saved as
 * guides/img/<guide slug>-<n>-<en|hi>.webp (ffmpeg + libwebp). Nothing is uploaded: the apps run in the browser and
 * the sample files are made inside the page.
 *   node guides/_build/shots.js [name-filter] [--base http://127.0.0.1:8080/]
 * Then run guides/_build/build.js (it reads the image sizes). */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const { chromium } = require(path.resolve(__dirname, '../../tools/node_modules/playwright-core'));
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'guides', 'img');
const argv = process.argv.slice(2);
const bi = argv.indexOf('--base');
const BASE = bi >= 0 ? argv[bi + 1] : 'https://apnipathshala.ai/';
const filter = argv.find((a, i) => !a.startsWith('--') && (bi < 0 || i !== bi + 1)) || '';
const CHROME = require('../../tools/chrome-path')();
const FFMPEG = process.env.FFMPEG || 'ffmpeg';

/* text typed into the apps for the screenshots (user content, so it follows the screenshot language) */
const Q = {
  en: { q: 'Which gas do plants take in to make their food?', o: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Hydrogen'], ex: 'Plants take in carbon dioxide and give out oxygen during photosynthesis.' },
  hi: { q: 'पौधे भोजन बनाने के लिए कौन-सी गैस लेते हैं?', o: ['ऑक्सीजन', 'कार्बन डाइऑक्साइड', 'नाइट्रोजन', 'हाइड्रोजन'], ex: 'प्रकाश-संश्लेषण में पौधे कार्बन डाइऑक्साइड लेते हैं और ऑक्सीजन छोड़ते हैं।' }
};

/* a 2-page "scanned" PDF made in the page with the app's own pdf-lib */
async function loadScannedPdf(page, inputSel) {
  await page.evaluate(async (sel) => {
    const jpg = async (w, h, hue, label) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d'); x.fillStyle = '#fbfaf6'; x.fillRect(0, 0, w, h);
      let seed = hue + 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      x.fillStyle = '#1f2a44'; x.font = `bold ${Math.round(h / 22)}px sans-serif`; x.fillText(label, w * 0.08, h * 0.1);
      x.font = `${Math.round(h / 48)}px sans-serif`; x.fillStyle = '#333';
      for (let l = 0; l < 32; l++) x.fillText('Line ' + (l + 1) + ': sample text of a scanned document.', w * 0.08, h * 0.16 + l * h / 40);
      const d = x.getImageData(0, 0, w, h);
      for (let i = 0; i < d.data.length; i += 4) { const n = (rnd() - 0.5) * 26; d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n; }
      x.putImageData(d, 0, 0);
      const bl = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.92));
      return new Uint8Array(await bl.arrayBuffer());
    };
    const doc = await PDFLib.PDFDocument.create();
    for (let i = 0; i < 2; i++) {
      const img = await doc.embedJpg(await jpg(1240, 1754, 30 + i * 60, 'Certificate - page ' + (i + 1)));
      doc.addPage([595.28, 841.89]).drawImage(img, { x: 0, y: 0, width: 595.28, height: 841.89 });
    }
    const dt = new DataTransfer();
    dt.items.add(new File([await doc.save()], 'certificate-scan.pdf', { type: 'application/pdf' }));
    const inp = document.querySelector(sel); inp.files = dt.files; inp.dispatchEvent(new Event('change', { bubbles: true }));
  }, inputSel);
}

/* name: <guide slug>-<n>. w: viewport width. run(page, L): get the app into the state to show.
   clip: CSS selector (or function returning {x,y,width,height} in page coordinates) + optional maxH. */
const SHOTS = [
  { name: 'ai-tools-for-teachers-1', app: 'prompt-builder', w: 390,
    run: async (p) => { await p.click('#tpls .tpl'); await p.waitForTimeout(600); },
    clip: '#preview-card', maxH: 720 },
  { name: 'ai-tools-for-teachers-2', app: 'worksheet-generator', w: 390, run: async () => { }, clip: '#paper', maxH: 760 },
  { name: 'quiz-maker-for-teachers-1', app: 'quiz-maker', w: 390,
    run: async (p, L) => {
      const q = Q[L];
      await p.fill('#qText', q.q);
      for (let i = 0; i < 4; i++) await p.fill('#opt' + i, q.o[i]);
      await p.check('#ans1');
      await p.fill('#qExplain', q.ex);
      await p.waitForTimeout(300);
    },
    clip: '#editor', maxH: 760 },
  { name: 'quiz-maker-for-teachers-2', app: 'quiz-maker', w: 1000, h: 700,
    run: async (p) => { await p.click('#tab-class'); await p.waitForTimeout(400); await p.click('#startClass'); await p.waitForTimeout(1500); },
    clip: '#p-class', maxH: 620 },
  { name: 'cbse-class-10-ai-project-1', app: 'ai-project-cycle', w: 390, run: async (p) => { await p.waitForTimeout(500); }, clip: '#work', maxH: 760 },
  { name: 'cbse-class-10-ai-project-2', app: 'confusion-matrix-lab', w: 390, run: async () => { },
    clip: async (p) => p.evaluate(() => { const a = document.querySelector('#cm-card').getBoundingClientRect(), b = document.querySelector('#card-precision').getBoundingClientRect(); return { x: a.left - 8, y: a.top + scrollY - 8, width: a.width + 16, height: b.bottom - a.top + 16 }; }), maxH: 900 },
  { name: 'merge-pdf-without-upload-1', app: 'pdf-merge-split', w: 390, engine: true,
    run: async (p) => { await p.click('#sampleBtn'); await p.waitForFunction(() => document.querySelectorAll('#grid > *').length >= 4, null, { timeout: 60000 }); await p.waitForTimeout(1500); },
    clip: async (p) => p.evaluate(() => { const a = document.querySelector('#toolbar').getBoundingClientRect(); return { x: a.left - 8, y: a.top + scrollY - 8, width: a.width + 16, height: 760 }; }), maxH: 760 },
  { name: 'merge-pdf-without-upload-2', app: 'pdf-merge-split', w: 390, engine: true,
    run: async (p, L) => { await p.click('#sampleBtn'); await p.waitForFunction(() => document.querySelectorAll('#grid > *').length >= 4, null, { timeout: 60000 }); await p.fill('#outName', L === 'hi' ? 'sare-documents' : 'all-documents'); await p.waitForTimeout(800); },
    clip: '#exportCard', maxH: 700 },
  { name: 'compress-pdf-to-100kb-1', app: 'pdf-compress-convert', w: 390, engine: true,
    run: async (p) => { await loadScannedPdf(p, '#cFile'); await p.waitForTimeout(2500); await p.click('#cT-200'); await p.waitForTimeout(700); },
    clip: async (p) => p.evaluate(() => { const a = document.querySelector('#cInfo').closest('.card').getBoundingClientRect(), b = document.querySelector('#cmLightL').getBoundingClientRect(); return { x: a.left - 8, y: a.top + scrollY - 8, width: a.width + 16, height: b.bottom - a.top + 16 }; }), maxH: 900 },
  { name: 'compress-pdf-to-100kb-2', app: 'pdf-compress-convert', w: 390, engine: true,
    run: async (p) => { await loadScannedPdf(p, '#cFile'); await p.waitForTimeout(2500); await p.click('#cT-200'); await p.waitForTimeout(400); await p.click('#cGo'); await p.waitForSelector('#cMsg', { timeout: 90000 }); await p.waitForTimeout(2500); },
    clip: '#cResult', maxH: 640 },
  { name: 'kruti-dev-to-unicode-1', app: 'krutidev-unicode', w: 1000, h: 800,
    run: async (p) => { await p.click('#sampleBtn'); await p.waitForTimeout(800); },
    clip: async (p) => p.evaluate(() => { const ps = [...document.querySelectorAll('.kd-pane')].map(e => e.getBoundingClientRect()); const top = Math.min(...ps.map(r => r.top)), bottom = Math.max(...ps.map(r => r.bottom)), left = Math.min(...ps.map(r => r.left)), right = Math.max(...ps.map(r => r.right)); return { x: left - 8, y: top + scrollY - 8, width: right - left + 16, height: bottom - top + 16 }; }), maxH: 640 },
  { name: 'kruti-dev-to-unicode-2', app: 'krutidev-unicode', w: 390,
    run: async (p) => { await p.click('#sampleBtn'); await p.waitForTimeout(500); if (!(await p.isChecked('#optKeep'))) await p.check('#optKeep'); await p.waitForTimeout(500); },
    clip: async (p) => p.evaluate(() => { const a = document.querySelector('#optKeep').closest('.card, details, section').getBoundingClientRect(); return { x: a.left - 8, y: a.top + scrollY - 8, width: a.width + 16, height: a.height + 16 }; }), maxH: 760 },
  { name: 'marriage-biodata-format-1', app: 'biodata-maker', w: 390, run: async () => { }, clip: '#sec-personal', maxH: 760 },
  { name: 'marriage-biodata-format-2', app: 'biodata-maker', w: 390,
    run: async (p) => { await p.click('#tabPreview'); await p.waitForTimeout(1200); }, clip: '#bdSheet', maxH: 900 },
  { name: 'gst-invoice-format-1', app: 'gst-invoice-maker', w: 1000, h: 800, run: async () => { }, clip: '#itemsCard', maxH: 600 },
  { name: 'gst-invoice-format-2', app: 'gst-invoice-maker', w: 1000, h: 800, run: async () => { }, clip: '#sheet', maxH: 660 },
  { name: 'upi-qr-code-for-shop-1', app: 'upi-qr-standee', w: 390, run: async (p) => { await p.waitForSelector('#sheet[data-ok="1"]', { timeout: 15000 }); },
    clip: async (p) => p.evaluate(() => { const a = document.querySelector('#vpa').closest('.card').getBoundingClientRect(); return { x: a.left - 8, y: a.top + scrollY - 8, width: a.width + 16, height: a.height + 16 }; }), maxH: 780 },
  { name: 'upi-qr-code-for-shop-2', app: 'upi-qr-standee', w: 390, run: async (p) => { await p.waitForSelector('#sheet[data-ok="1"]', { timeout: 15000 }); await p.waitForTimeout(500); }, clip: '#sheet', maxH: 820 },
  { name: 'in-hand-salary-calculator-1', app: 'salary-tax-calculator', w: 390,
    run: async (p) => { await p.fill('#ctc', '10L'); await p.waitForTimeout(800); },
    clip: async (p) => p.evaluate(() => { const a = document.querySelector('#ctc').closest('.card, section').getBoundingClientRect(); return { x: a.left - 8, y: a.top + scrollY - 8, width: a.width + 16, height: a.height + 16 }; }), maxH: 640 },
  { name: 'in-hand-salary-calculator-2', app: 'salary-tax-calculator', w: 390,
    run: async (p) => { await p.fill('#ctc', '15L'); await p.waitForTimeout(400); await p.click('#tab-compare'); await p.waitForTimeout(900); },
    clip: '#results', maxH: 760 }
];

async function rectOf(page, clip) {
  if (typeof clip === 'function') return clip(page);
  return page.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; const a = e.getBoundingClientRect(); return { x: a.left - 8, y: a.top + scrollY - 8, width: a.width + 16, height: a.height + 16 }; }, clip);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'gshots-'));
  let ok = 0, failed = 0;
  for (const s of SHOTS.filter(x => x.name.includes(filter))) {
    for (const L of ['en', 'hi']) {
      const dpr = s.w > 600 ? 1.5 : 2;
      const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h || 844 }, deviceScaleFactor: dpr, locale: L === 'hi' ? 'hi-IN' : 'en-IN', colorScheme: 'light' });
      const page = await ctx.newPage();
      try {
        await page.goto(BASE + 'apps/' + s.app + '/?lang=' + L, { waitUntil: 'load' });
        if (s.engine) await page.waitForSelector('#app[data-engine="ready"]', { timeout: 90000 }).catch(() => { });
        await page.waitForTimeout(1500);
        /* the sticky header would float over a clip lower down the page */
        await page.addStyleTag({ content: '.edu-top{position:static!important} .edu-toast,#edu-toast{display:none!important} *{caret-color:transparent!important}' });
        await s.run(page, L);
        await page.evaluate(() => { if (document.activeElement) document.activeElement.blur(); window.scrollTo(0, 0); });
        await page.waitForTimeout(300);
        const r = await rectOf(page, s.clip);
        if (!r) throw new Error('clip not found');
        const docW = await page.evaluate(() => document.documentElement.scrollWidth);
        const x = Math.max(0, r.x), width = Math.min(r.width, docW - x);
        const clip = { x, y: Math.max(0, r.y), width, height: Math.min(r.height, s.maxH || r.height) };
        const png = path.join(tmp, s.name + '-' + L + '.png');
        await page.screenshot({ path: png, fullPage: true, clip });
        const outW = Math.min(Math.round(clip.width * dpr), s.w > 600 ? 1200 : 660);
        const out = path.join(OUT, s.name + '-' + L + '.webp');
        cp.execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', png, '-vf', `scale=${outW}:-2:flags=lanczos`, '-c:v', 'libwebp', '-quality', '74', '-compression_level', '6', out]);
        console.log(`ok   ${s.name}-${L}  ${Math.round(clip.width)}x${Math.round(clip.height)} css  ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
        ok++;
      } catch (e) {
        console.log(`FAIL ${s.name}-${L}: ${String(e.message || e).split('\n')[0]}`);
        failed++;
      }
      await ctx.close();
    }
  }
  await browser.close();
  console.log(`${ok} screenshots, ${failed} failed → guides/img/`);
  process.exitCode = failed ? 1 : 0;
})();
