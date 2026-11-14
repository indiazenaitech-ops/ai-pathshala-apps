/* Interaction test for Text to Handwriting (run by tools/verify.js in en and hi).
   Drives the UI with ids / data-* attributes only, so it works in every language. */
const fs = require('fs');

module.exports = async function ({ page, lang, expect, t, log }) {
  const attr = (a) => page.getAttribute('#page', a);
  const num = async (a) => parseInt(await attr(a), 10);
  const settle = () => page.waitForTimeout(220);
  /* count ink pixels on the preview canvas: blue-ish, dark, and where the ink sits (left / right half) */
  const ink = () => page.evaluate(() => {
    const c = document.getElementById('page'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let blue = 0, dark = 0, left = 0, right = 0, hash = 0;
    for (let y = 0; y < c.height; y += 2) for (let x = 0; x < c.width; x += 2) {
      const i = (y * c.width + x) * 4, r = d[i], g = d[i + 1], b = d[i + 2];
      const isBlue = b > r + 70 && b > 120 && r < 120, isDark = r < 70 && g < 70 && b < 80;
      if (isBlue) blue++;
      if (isDark) dark++;
      if (isBlue || isDark) { if (x < c.width / 2) left++; else right++; hash = (hash * 31 + x * 7 + y) >>> 0; }
    }
    return { blue, dark, left, right, hash };
  });

  await page.waitForFunction(() => window.TTH_READY === true, null, { timeout: 15000 });

  /* 1) opens with the translated sample, written in the bundled handwriting font */
  expect(await attr('data-font') === 'kalam', 'bundled Kalam font should load without any network, got ' + await attr('data-font'));
  expect(await page.inputValue('#txt') === t('sample_text'), 'text box starts with the translated sample text');
  expect(await page.inputValue('#heading') === t('sample_heading'), 'heading starts with the translated sample heading');
  expect(await attr('data-pages') === '1', 'sample fits on one page');
  expect(await num('data-words') > 40, 'sample words are drawn, got ' + await attr('data-words'));
  const glyph = await page.evaluate((s) => document.fonts.check('40px "TTH Kalam"', s), lang === 'hi' ? 'पानी' : 'Water');
  expect(glyph, 'handwriting font covers the sample script');
  const a0 = await ink();
  expect(a0.blue > 3000, 'blue ink is on the page, got ' + a0.blue);

  /* 2) own text → exact word and line count; empty text never crashes */
  await page.fill('#txt', 'Hello world from Bharat');
  await settle();
  expect(await attr('data-words') === '4', '4 words drawn, got ' + await attr('data-words'));
  expect(await attr('data-lines') === '1', 'one line of text');
  await page.fill('#txt', '');
  await settle();
  expect(await attr('data-words') === '0' && await attr('data-pages') === '1', 'empty text gives one empty page');
  await page.fill('#heading', ''); await page.fill('#date', '');
  await settle();
  const empty = await ink();
  expect(empty.blue < 50, 'no ink left when text, heading and date are empty, got ' + empty.blue);

  /* 3) seeded variation: the same settings always give the same picture; shuffle changes it */
  await page.fill('#txt', 'The quick brown fox jumps over the lazy dog.\nकल सुबह स्कूल में खेल दिवस है।');
  await settle();
  const p1 = await ink();
  await page.click('#paper [data-v="plain"]'); await page.click('#paper [data-v="margin"]');
  const p2 = await ink();
  expect(p1.hash === p2.hash && p1.blue === p2.blue, 'preview is stable (seeded) across re-renders');
  const seed = await attr('data-seed');
  await page.click('#shuffle');
  const p3 = await ink();
  expect(await attr('data-seed') !== seed && p3.hash !== p1.hash, 'shuffle gives a new pattern');
  await page.click('#vary [data-v="0"]');
  const p4 = await ink();
  await page.click('#shuffle');                       /* turns variation back on */
  expect(await page.getAttribute('#vary [data-v="1"]', 'aria-pressed') === 'true', 'shuffle switches variation on again');
  expect(p4.hash !== p3.hash, 'variation off looks different from variation on');

  /* 4) ink colour */
  await page.click('#ink [data-v="black"]');
  const k = await ink();
  expect(k.blue < 50 && k.dark > 500, 'black ink replaces blue ink, blue=' + k.blue + ' dark=' + k.dark);
  await page.click('#ink [data-v="blue"]');

  /* 5) Urdu is written right to left, starting at the right edge */
  await page.fill('#txt', 'یہ اردو ہے');
  await settle();
  expect(await attr('data-rtl') === '1', 'Urdu line is laid out right-to-left');
  const u = await ink();
  expect(u.right > 200 && u.left === 0, 'short Urdu line sits on the right half, left=' + u.left + ' right=' + u.right);
  await page.fill('#txt', 'Short line');
  await settle();
  const e = await ink();
  expect(e.left > 200 && e.right === 0, 'short English line sits on the left half, left=' + e.left + ' right=' + e.right);

  /* 6) long text → page breaks, pager, bigger writing → more pages */
  const long = Array.from({ length: 70 }, (_, i) => 'Line ' + (i + 1) + ' of my notes about the monsoon in India.').join('\n');
  await page.fill('#txt', long);
  await settle();
  const pages = await num('data-pages');
  expect(pages >= 3, '70 lines need 3 or more pages, got ' + pages);
  expect(await attr('data-lines') === '70', 'every line is kept, got ' + await attr('data-lines'));
  expect(await page.$eval('#prev', (b) => b.disabled), 'previous is disabled on page 1');
  expect(!(await page.$eval('#dl-all', (b) => b.hidden)), '"download all pages" shows for multi-page text');
  await page.click('#next');
  expect(await attr('data-page') === '2', 'next moves to page 2');
  const perPage = await num('data-page-lines');
  expect(perPage * (pages - 1) < 70 && perPage * pages >= 70, 'lines are split across pages without loss');
  await page.$eval('#size', (el) => { el.value = '72'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  expect(await num('data-pages') > pages, 'bigger writing needs more pages');
  await page.$eval('#size', (el) => { el.value = '42'; el.dispatchEvent(new Event('input', { bubbles: true })); });

  /* 7) download gives a real PNG of the A4 page */
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), page.click('#dl')]);
  expect(/^handwriting-page-\d\d\.png$/.test(dl.suggestedFilename()), 'file name, got ' + dl.suggestedFilename());
  const file = await dl.path();
  const buf = fs.readFileSync(file);
  expect(buf.slice(1, 4).toString() === 'PNG' && buf.readUInt32BE(16) === 1240 && buf.readUInt32BE(20) === 1754, 'download is a 1240 x 1754 PNG');
  expect(buf.length > 20000, 'PNG has content, bytes=' + buf.length);

  /* 8) print: one image per page */
  await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
  await page.click('#print');
  await page.waitForFunction(() => window.__printed === 1, null, { timeout: 20000 });
  const imgs = await page.$$eval('#print-pages img', (a) => a.filter((i) => i.naturalWidth === 1240).length);
  expect(imgs === pages, 'print area has one page image per page, got ' + imgs + ' for ' + pages);

  /* 9) state survives a reload; reset brings the sample back */
  await page.reload();
  await page.waitForFunction(() => window.TTH_READY === true, null, { timeout: 15000 });
  expect(await page.inputValue('#txt') === long, 'text is kept after reload');
  await page.click('#reset');
  await settle();
  expect(await page.inputValue('#txt') === t('sample_text'), 'reset restores the sample text');
  expect(await attr('data-pages') === '1' && await attr('data-page') === '1', 'reset goes back to one page');
  log('pages for 70 lines: ' + pages + ', lines per page: ' + perPage);
};
