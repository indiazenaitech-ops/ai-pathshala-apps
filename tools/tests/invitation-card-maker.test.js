/* Interaction test for Invitation Card Maker (run by tools/verify.js in en and hi).
   Sample card renders with example names -> type names + date -> they appear on the card -> PNG export > 50 KB ->
   switching the design keeps the data -> Google-Maps QR drawn -> sizes -> occasion switch keeps per-occasion wording ->
   card language switch -> drafts save/open -> reload keeps the work -> print A5 / 2-up builds the print images. */
const fs = require('fs');

module.exports = async function ({ page, lang, expect, t }) {
  const rev = () => page.evaluate(() => +document.getElementById('cardCanvas').dataset.rev || 0);
  const waitRev = (r0) => page.waitForFunction((r) => (+document.getElementById('cardCanvas').dataset.rev || 0) > r, r0, { timeout: 20000 });
  const text = () => page.evaluate(() => document.getElementById('cardCanvas').dataset.text || '');
  const dims = () => page.evaluate(() => { const c = document.getElementById('cardCanvas'); return { w: +c.dataset.w, h: +c.dataset.h }; });
  const sig = () => page.evaluate(() => {
    const c = document.getElementById('cardCanvas'), x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let h = 0; for (let i = 0; i < x.length; i += 4 * 53) h = (Math.imul(h, 31) + x[i] + x[i + 1] * 3 + x[i + 2] * 7) >>> 0;
    return h;
  });
  const content = (L, occ, f) => page.evaluate(([L, occ, f]) => window.APP_CONTENT[L].occ[occ][f], [L, occ, f]);

  await page.waitForFunction(() => +document.getElementById('cardCanvas').dataset.rev > 0, null, { timeout: 20000 });

  // 1) sample wedding card is drawn with the example names of this language
  const n1 = await content(lang, 'wedding', 'n1'), n2 = await content(lang, 'wedding', 'n2');
  let tx = await text();
  expect(tx.includes(n1) && tx.includes(n2), 'sample card shows the example couple ' + n1 + ' / ' + n2);
  expect(await page.$eval('#exampleNote', (e) => !e.hidden), 'example note is visible for the sample card');
  const nOcc = await page.$$eval('#occList .occ', (b) => b.length);
  expect(nOcc === 12, '12 occasions listed, got ' + nOcc);

  // 2) type names and a date: they appear on the card
  let r = await rev();
  await page.fill('#f_n1', 'Meera');
  await page.fill('#f_n2', 'Vikram');
  await page.fill('#f_date', '2026-12-20');
  await waitRev(r);
  await page.waitForTimeout(300);
  tx = await text();
  expect(tx.includes('Meera') && tx.includes('Vikram'), 'typed names are drawn on the card');
  expect(tx.includes('2026') && tx.includes('20'), 'date is drawn on the card: ' + tx.split('\n').filter((l) => /2026/.test(l)).join(' | '));
  expect(await page.$eval('#exampleNote', (e) => e.hidden), 'example note hides once names are typed');

  // 3) PNG export: a real file over 50 KB, named after the first name
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('#dlPng')]);
  const fn = dl.suggestedFilename();
  expect(/^Meera-wedding-wa-.*\.png$/.test(fn), 'PNG file name, got ' + fn);
  const p = await dl.path();
  const size = p ? fs.statSync(p).size : 0;
  expect(size > 50 * 1024, 'PNG export is over 50 KB, got ' + size);

  // 4) switching the design keeps the data
  r = await rev();
  await page.click('.design[data-design="peacock"]');
  await waitRev(r);
  expect(await page.getAttribute('#cardCanvas', 'data-design') === 'peacock', 'design switched to peacock');
  expect(await page.inputValue('#f_n1') === 'Meera' && await page.inputValue('#f_n2') === 'Vikram', 'names kept after a design switch');
  tx = await text();
  expect(tx.includes('Meera') && tx.includes('Vikram'), 'names still drawn after a design switch');

  // 5) Google Maps link becomes a QR code on the card
  const s1 = await sig();
  r = await rev();
  await page.fill('#mapUrl', 'not a link');
  expect(await page.getAttribute('#mapMsg', 'data-state') === 'bad', 'bad map link is flagged');
  await page.fill('#mapUrl', 'https://maps.app.goo.gl/AbC123xyz');
  await waitRev(r);
  expect(await page.getAttribute('#mapMsg', 'data-state') === 'ok', 'good map link accepted');
  expect((await sig()) !== s1, 'QR code changes the card pixels');
  tx = await text();
  const mapLabel = await page.evaluate((L) => window.APP_CONTENT[L].labels.map, lang);
  expect(tx.includes(mapLabel.split(' ')[0]), 'QR caption drawn on the card');
  // a long Google-Maps URL (57-module QR) must still be scannable: the exported QR grows instead of shrinking its modules
  const longUrl = 'https://www.google.com/maps/place/Shubh+Mangal+Garden/@26.9124,75.7873,17z/data=!3m1!4b1!4m6!3m5!1s0x396db4f1a2b3c4d5:0x1234567890abcdef!8m2!3d26.9124!4d75.7899!16s%2Fg%2F11abc12345?entry=ttu';
  r = await rev();
  await page.fill('#mapUrl', longUrl);
  await waitRev(r);
  await page.waitForTimeout(300);
  const qrPx = (await page.getAttribute('#cardCanvas', 'data-qr') || '0x0').split('x').map(Number);
  expect(qrPx[0] >= 49 && qrPx[1] >= qrPx[0] * 3.4 && qrPx[1] > 150, 'long-URL QR is drawn with modules of at least 3.4 px on the 1080 px card: ' + qrPx.join(' modules x ') + ' px');
  r = await rev();
  await page.fill('#mapUrl', 'https://maps.app.goo.gl/AbC123xyz');
  await waitRev(r);

  // 6) sizes
  r = await rev();
  await page.click('#sizeSeg [data-size="story"]');
  await waitRev(r);
  let d = await dims();
  expect(d.w === 1080 && d.h === 1920, 'story size 1080x1920, got ' + JSON.stringify(d));
  r = await rev();
  await page.click('#sizeSeg [data-size="a5"]');
  await waitRev(r);
  d = await dims();
  expect(d.w === 1748 && d.h === 2480, 'A5 size 1748x2480, got ' + JSON.stringify(d));
  r = await rev();
  await page.click('#sizeSeg [data-size="wa"]');
  await waitRev(r);

  // 7) occasion switch: birthday gets its own wording, wedding keeps the typed names
  r = await rev();
  await page.click('.occ[data-occ="birthday"]');
  await waitRev(r);
  const bh = await content(lang, 'birthday', 'heading');
  expect(await page.inputValue('#f_heading') === bh, 'birthday heading filled in: ' + bh);
  expect(await page.getAttribute('#cardCanvas', 'data-design') === 'balloons', 'birthday opens with the balloons design');
  r = await rev();
  await page.click('.occ[data-occ="wedding"]');
  await waitRev(r);
  expect(await page.inputValue('#f_n1') === 'Meera', 'wedding wording remembered per occasion');

  // 8) card language: Tamil card in a Tamil script with the invocation in Tamil too, UI language unchanged
  r = await rev();
  await page.selectOption('#cardLang', 'ta');
  await waitRev(r);
  await page.waitForTimeout(400);
  expect(await page.getAttribute('#cardCanvas', 'data-lang') === 'ta', 'card language is Tamil');
  const taN1 = await content('ta', 'wedding', 'n1');
  tx = await text();
  expect(tx.includes(taN1), 'Tamil example name drawn: ' + taN1);
  const taSym = await page.evaluate(() => window.APP_CONTENT.ta.labels.sym_ganesh);
  expect(tx.split('\n')[0] === taSym, 'Ganesh invocation is printed in Tamil script, got ' + tx.split('\n')[0]);
  expect(await page.evaluate(() => document.documentElement.lang) === lang, 'UI language unchanged');
  // Punjabi: Chrome has no Punjabi calendar data, the date must still be in Gurmukhi (not "2026 M12 20, Sun")
  r = await rev();
  await page.selectOption('#cardLang', 'pa');
  await waitRev(r);
  await page.waitForTimeout(400);
  const paMonth = await page.evaluate(() => window.APP_CONTENT.pa.labels.months[11]);
  const paDate = (await text()).split('\n').find((l) => /2026/.test(l)) || '';
  expect(paDate.includes(paMonth) && !/M12|Sun/.test(paDate), 'Punjabi date uses Gurmukhi month names, got ' + paDate);
  expect(await page.$eval('#symSeg [aria-pressed="true"]', (e) => e.dataset.sym) === 'ikonkar', 'Punjabi card defaults to Ik Onkar');
  r = await rev();
  await page.selectOption('#cardLang', lang);
  await waitRev(r);
  // the card language was pinned by typing: switching the UI language must not swap Meera for the sample name
  const other = lang === 'en' ? 'hi' : 'en';
  await page.selectOption('#edu-lang', other);
  await page.waitForTimeout(900);
  expect(await page.getAttribute('#cardCanvas', 'data-lang') === lang && (await text()).includes('Meera'), 'UI language switch keeps the typed card (card language pinned)');
  await page.evaluate((L) => { EDU.setLang(L); }, lang);
  await page.waitForTimeout(600);
  // only "Name 2" filled in: it is still printed
  r = await rev();
  await page.fill('#f_n1', '');
  await waitRev(r);
  await page.waitForTimeout(300);
  expect((await text()).includes('Vikram'), 'Name 2 alone is still drawn on the card');
  r = await rev();
  await page.fill('#f_n1', 'Meera');
  await waitRev(r);

  // 9) drafts: save, change, open -> restored
  await page.fill('#draftName', 'Test draft');
  await page.click('#draftSave');
  await page.waitForSelector('#draftList .draft-row', { timeout: 5000 });
  expect((await page.$$('#draftList .draft-row')).length === 1, 'one draft saved');
  r = await rev();
  await page.fill('#f_n1', 'Zoya');
  await waitRev(r);
  await page.click('#draftList .draft-row button:not(.btn-danger)');
  await page.waitForFunction(() => document.getElementById('f_n1').value === 'Meera', null, { timeout: 5000 });
  expect(await page.inputValue('#f_n1') === 'Meera', 'opening the draft restores the names');
  // at most 12 drafts are kept: a 13th save drops the oldest and says so
  for (let i = 2; i <= 13; i++) { await page.fill('#draftName', 'Draft ' + i); await page.click('#draftSave'); await page.waitForTimeout(80); }
  await page.waitForTimeout(300);
  const dn = await page.$$eval('#draftList .draft-name', (es) => es.map((e) => e.textContent));
  expect(dn.length === 12 && dn[0] === 'Draft 13' && dn.indexOf('Test draft') < 0, '13th draft keeps 12 and drops the oldest, got ' + dn.length + ' / ' + dn[0]);
  expect(await page.$$eval('.edu-toast', (es, want) => es.some((e) => e.textContent === want), t('draft_limit')), 'draft limit toast shown');

  // 10) reload keeps the work (saved on this device only): pick a design first, then reload
  r = await rev();
  await page.click('.design[data-design="lotus"]');
  await waitRev(r);
  await page.waitForTimeout(500);
  await page.reload();
  await page.waitForFunction(() => +document.getElementById('cardCanvas').dataset.rev > 0, null, { timeout: 20000 });
  expect(await page.inputValue('#f_n1') === 'Meera' && await page.inputValue('#f_date') === '2026-12-20', 'names and date survive a reload');
  expect(await page.getAttribute('#cardCanvas', 'data-design') === 'lotus', 'design survives a reload, got ' + await page.getAttribute('#cardCanvas', 'data-design'));

  // 11) print: A5 = one image, 2-up = two images (window.print stubbed)
  await page.evaluate(() => { window.print = () => { window.__printed = (window.__printed || 0) + 1; }; });
  await page.click('#printA5');
  await page.waitForFunction(() => window.__printed === 1, null, { timeout: 30000 });
  expect((await page.$$('#printArea img')).length === 1, 'A5 print area holds one card');
  await page.click('#print2up');
  await page.waitForFunction(() => window.__printed === 2, null, { timeout: 30000 });
  expect((await page.$$('#printArea img')).length === 2, '2-up print area holds two cards');
  expect(/A4 landscape/.test(await page.$eval('#pageStyle', (e) => e.textContent)), '2-up uses an A4 landscape page');
};
