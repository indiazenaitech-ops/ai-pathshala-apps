/* Interaction test for background-remover, run by tools/verify.js in en and hi.
   Uses the small "Quick" model (MODNet, ~7 MB + ~6 MB engine) on the built-in person sample,
   then checks real pixels, the touch-up brush + undo, and a 1000×1000 product PNG download. */
const fs = require('fs');

module.exports = async function ({ page, expect, log }) {
  await page.check('#mModnet');
  await page.click('#samplePerson');
  await page.waitForSelector('#resultCard[data-state="photo"], #resultCard[data-state="busy"], #resultCard[data-state="done"]', { timeout: 15000 });
  const runEnabled = await page.isEnabled('#runBtn');
  if (runEnabled) await page.click('#runBtn');           // first time: the button starts the download
  await page.waitForSelector('#resultCard[data-state="done"]', { timeout: 110000 });
  const status = await page.textContent('#stText');
  log('status: ' + status.trim());

  /* 1. the AI kept a sensible part of the photo */
  const keep = parseFloat(await page.getAttribute('#resultCard', 'data-keep'));
  expect(keep > 10 && keep < 80, 'kept share should be 10-80 %, got ' + keep);

  /* 2. real pixels: background corner is transparent, the man's chest is opaque (right half = "after") */
  const px = await page.evaluate(() => {
    const c = document.getElementById('view'), x = c.getContext('2d');
    const corner = x.getImageData(c.width - 4, 4, 1, 1).data[3];
    const body = x.getImageData(Math.round(c.width * 0.66), Math.round(c.height * 0.82), 1, 1).data[3];
    return { corner, body };
  });
  expect(px.corner === 0, 'background corner should be transparent, alpha=' + px.corner);
  expect(px.body > 200, 'subject should stay opaque, alpha=' + px.body);

  /* 1b. the model is kept in Transformers.js's own cache, never in the site's offline-page cache (edu-apps-*),
         which a future cache-name bump in sw.js would wipe */
  const cache = await page.evaluate(async () => {
    if (typeof caches === 'undefined') return null;
    const out = { tjs: false, inSite: false };
    for (const k of await caches.keys()) {
      const urls = (await (await caches.open(k)).keys()).map(r => r.url);
      const hasModel = urls.some(u => /\/Xenova\/modnet\/resolve\/.*\.onnx$/.test(u));
      if (k === 'transformers-cache' && hasModel) out.tjs = true;
      if (k.indexOf('edu-apps-') === 0 && urls.some(u => /huggingface\.co/.test(u))) out.inSite = true;
    }
    return out;
  });
  if (cache) {
    expect(cache.tjs, 'the Quick model is saved in the transformers-cache cache');
    expect(!cache.inSite, 'no model file is stored in an edu-apps-* cache');
  }

  /* 3. Erase brush across the subject lowers the kept share; Undo brings it back */
  await page.click('#toolChips [data-tool="erase"]');
  await page.fill('#brushSize', '60');
  await page.dispatchEvent('#brushSize', 'input');
  const box = await page.locator('#view').boundingBox();
  await page.mouse.move(box.x + box.width * 0.58, box.y + box.height * 0.75);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(box.x + box.width * (0.58 + i * 0.02), box.y + box.height * 0.75);
  await page.mouse.up();
  await page.waitForTimeout(200);
  const keepErased = parseFloat(await page.getAttribute('#resultCard', 'data-keep'));
  expect(keepErased < keep - 1, `erase should lower the kept share (${keep} -> ${keepErased})`);
  expect(await page.getAttribute('#resultCard', 'data-edits') === '1', 'one touch-up stroke recorded');
  await page.click('#undoBtn');
  await page.waitForTimeout(200);
  const keepUndo = parseFloat(await page.getAttribute('#resultCard', 'data-keep'));
  expect(Math.abs(keepUndo - keep) < 0.2, `undo should restore the kept share (${keep} vs ${keepUndo})`);

  /* 4. Product preset: 1000×1000 white, downloaded PNG has those dimensions */
  await page.click('#sizeChips [data-size="product"]');
  expect(await page.getAttribute('#resultCard', 'data-out') === '1000x1000', 'product preset gives 1000x1000');
  expect(await page.getAttribute('#bgChips [data-bg="white"]', 'aria-pressed') === 'true', 'product preset switches to a white background');
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), page.click('#dlPng')]);
  const file = await dl.path();
  const buf = fs.readFileSync(file);
  expect(buf.slice(1, 4).toString() === 'PNG', 'download is a PNG');
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  expect(w === 1000 && h === 1000, `PNG should be 1000x1000, got ${w}x${h}`);
  expect(/-product\.png$/.test(dl.suggestedFilename()), 'file name ends with -product.png: ' + dl.suggestedFilename());
};
