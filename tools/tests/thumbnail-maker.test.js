/* Interaction test for YouTube Thumbnail Maker (run by tools/verify.js in en and hi).
   Type a headline -> canvas changes; highlight a word; export PNG is 1280x720 and under 2 MB; Shorts size is
   1080x1920; a saved version restores headline + size after changes; state survives a reload. */
const fs = require('fs');
module.exports = async function ({ page, lang, expect, t }) {
  const rev = () => page.evaluate(() => +document.getElementById('thumb').dataset.rev || 0);
  const waitRev = (r0) => page.waitForFunction((r) => (+document.getElementById('thumb').dataset.rev || 0) > r, r0, { timeout: 20000 });
  const sig = () => page.evaluate(() => {
    const c = document.getElementById('thumb'), x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let h = 0; for (let i = 0; i < x.length; i += 4 * 53) h = (Math.imul(h, 31) + x[i] + x[i + 1] * 3 + x[i + 2] * 7) >>> 0;
    return h;
  });
  const dims = () => page.evaluate(() => { const c = document.getElementById('thumb'); return { w: +c.dataset.w, h: +c.dataset.h, cw: c.width, ch: c.height }; });

  await page.waitForFunction(() => +document.getElementById('thumb').dataset.rev > 0, null, { timeout: 20000 });
  let d = await dims();
  expect(d.w === 1280 && d.h === 720 && d.cw === 1280 && d.ch === 720, 'default size is 1280x720, got ' + JSON.stringify(d));
  const nTpl = await page.$$eval('#tplList .tpl', (b) => b.length);
  expect(nTpl === 10, '10 templates listed, got ' + nTpl);

  // 1) a headline changes the canvas; word chips follow the text
  const headline = lang === 'hi' ? '7 दिन में Python मास्टर करें' : 'Master Python in 7 days';
  const s0 = await sig();
  let r = await rev();
  await page.fill('#headline', headline);
  await waitRev(r);
  expect((await sig()) !== s0, 'canvas pixels change after typing a headline');
  const chips = await page.$$eval('#hiChips .chip', (b) => b.map((x) => x.textContent));
  const nWords = headline.split(/\s+/).length;
  expect(chips.length === nWords + 1 && chips.indexOf('Python') >= 0, 'one chip per word plus None, got ' + chips.join('|'));
  const hint = await page.textContent('#wordsHint');
  expect(hint.indexOf(String(nWords)) >= 0, 'word count hint says ' + nWords + ' words, got ' + hint);

  // 2) highlighting a word changes the picture
  const s1 = await sig(); r = await rev();
  await page.click('#hiChips .chip[data-i="2"]');
  await waitRev(r);
  expect(await page.getAttribute('#hiChips .chip[data-i="2"]', 'aria-pressed') === 'true', 'word 3 is highlighted');
  expect((await sig()) !== s1, 'highlight changes the canvas');
  const ratio = await page.getAttribute('#thumb', 'data-contrast');
  expect(+ratio > 1, 'readability ratio computed, got ' + ratio);
  expect(/\d/.test(await page.textContent('#contrast')), 'readability line shows the ratio');

  // 3) PNG export: 1280x720 and under 2 MB
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('#dlPng')]);
  const fn = dl.suggestedFilename();
  expect(/^thumbnail-.*-1280x720\.(png|jpg)$/.test(fn), 'export file name has the size, got ' + fn);
  await page.waitForFunction(() => document.getElementById('thumb').dataset.lastBytes, null, { timeout: 20000 });
  const bytes = +(await page.getAttribute('#thumb', 'data-last-bytes'));
  expect(bytes > 5000 && bytes < 2 * 1024 * 1024, 'export under 2 MB, got ' + bytes);
  try { const p = await dl.path(); if (p) { const sz = fs.statSync(p).size; expect(sz === bytes && sz < 2 * 1024 * 1024, 'downloaded file size matches, got ' + sz); } } catch (e) { /* download path not available in this runner */ }
  expect(/KB|MB/.test(await page.textContent('#status')), 'status shows the file size');

  // 4) save a version, then change size + headline, then restore it
  await page.click('#varSave');
  await page.waitForSelector('#varList .variant', { timeout: 10000 });
  expect((await page.$$eval('#varList .variant', (f) => f.length)) === 1, 'one saved version');
  r = await rev();
  await page.click('#sizeSeg [data-size="shorts"]');
  await waitRev(r);
  d = await dims();
  expect(d.w === 1080 && d.h === 1920 && d.cw === 1080 && d.ch === 1920, 'Shorts cover is 1080x1920, got ' + JSON.stringify(d));
  const lay = await page.textContent('#layoutSeg [data-layout="left"]');
  expect(lay.trim() === t('lay_top'), 'layout label switches to "photo top" for Shorts, got ' + lay);
  r = await rev();
  await page.fill('#headline', 'Second title here');
  await waitRev(r);
  r = await rev();
  await page.click('#varList .variant .var-use');
  await waitRev(r);
  expect((await page.inputValue('#headline')) === headline, 'restored version brings the headline back');
  d = await dims();
  expect(d.w === 1280 && d.h === 720, 'restored version brings the size back');

  // 5) a JPG export is a JPG
  const [dl2] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('#dlJpg')]);
  expect(/\.jpg$/.test(dl2.suggestedFilename()), 'JPG download, got ' + dl2.suggestedFilename());

  // 6) reload keeps the headline, highlight and the saved version (device-only storage)
  await page.waitForTimeout(500);
  await page.reload();
  await page.waitForFunction(() => +document.getElementById('thumb').dataset.rev > 0, null, { timeout: 20000 });
  expect((await page.inputValue('#headline')) === headline, 'headline survives a reload');
  expect(await page.getAttribute('#hiChips .chip[data-i="2"]', 'aria-pressed') === 'true', 'highlight survives a reload');
  expect((await page.$$eval('#varList .variant', (f) => f.length)) === 1, 'saved version survives a reload');
};
