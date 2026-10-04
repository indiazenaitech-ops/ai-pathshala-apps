/* Interaction test for Festival Greeting & Offer Poster (run by tools/verify.js in en and hi).
   Pick Diwali -> greeting fills in; type a business name -> canvas pixels change; WhatsApp status size ->
   1080 x 1920 canvas; Facebook -> 1200 x 630; PNG / JPG export fire downloads; UPI QR validates;
   "make in 3 languages" renders 3 posters; a double click saves one file; cross-language search; reload keeps the
   work; a multi-day festival (New Year on 3 Jan) stays "on now". */
module.exports = async function ({ page, lang, expect, t }) {
  const rev = () => page.evaluate(() => +document.getElementById('poster').dataset.rev || 0);
  const waitRev = (r0) => page.waitForFunction((r) => (+document.getElementById('poster').dataset.rev || 0) > r, r0, { timeout: 20000 });
  const sig = () => page.evaluate(() => {
    const c = document.getElementById('poster'), x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let h = 0; for (let i = 0; i < x.length; i += 4 * 53) h = (Math.imul(h, 31) + x[i] + x[i + 1] * 3 + x[i + 2] * 7) >>> 0;
    return h;
  });
  const dims = () => page.evaluate(() => { const c = document.getElementById('poster'); return { w: +c.dataset.w, h: +c.dataset.h, cw: c.width, ch: c.height }; });

  await page.waitForFunction(() => +document.getElementById('poster').dataset.rev > 0, null, { timeout: 20000 });

  // occasions are sorted by the next date: every festival card shows when it is
  const nOcc = await page.$$eval('#occFest .occ', (b) => b.length);
  expect(nOcc >= 25, 'festival templates listed, got ' + nOcc);

  // 1) pick Diwali: canvas switches template, greeting field gets the Diwali greeting for this language
  let r = await rev();
  await page.click('.occ[data-tpl="diwali"]');
  await waitRev(r);
  expect(await page.getAttribute('#poster', 'data-tpl') === 'diwali', 'poster template is diwali');
  expect(await page.getAttribute('.occ[data-tpl="diwali"]', 'aria-pressed') === 'true', 'Diwali card is selected');
  const want = await page.evaluate((L) => window.APP_CONTENT[L].tpl.diwali.greet, lang);
  const greet = await page.inputValue('#greet');
  expect(greet === want, 'greeting field = Diwali greeting (' + want + '), got ' + greet);

  // 2) typing a business name changes the canvas pixels
  const s1 = await sig();
  r = await rev();
  await page.fill('#bizName', 'Gupta Electronics, Lucknow');
  await waitRev(r);
  const s2 = await sig();
  expect(s1 !== s2, 'canvas pixels change after typing a business name');

  // 3) sizes: Facebook 1200x630, then WhatsApp status 1080x1920
  r = await rev();
  await page.click('#sizeSeg [data-size="fb"]');
  await waitRev(r);
  let d = await dims();
  expect(d.w === 1200 && d.h === 630 && d.cw === 1200 && d.ch === 630, 'facebook size 1200x630, got ' + JSON.stringify(d));
  r = await rev();
  await page.click('#sizeSeg [data-size="story"]');
  await waitRev(r);
  d = await dims();
  expect(d.w === 1080 && d.h === 1920 && d.cw === 1080 && d.ch === 1920, 'whatsapp status size 1080x1920, got ' + JSON.stringify(d));

  // 4) export fires downloads (PNG and JPG) with a sensible file name
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click('#dlPng')]);
  const fn = dl.suggestedFilename();
  expect(/\.png$/.test(fn) && fn.indexOf('diwali') >= 0 && fn.indexOf('story') >= 0, 'PNG download name, got ' + fn);
  const [dl2] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click('#dlJpg')]);
  expect(/\.jpg$/.test(dl2.suggestedFilename()), 'JPG download, got ' + dl2.suggestedFilename());

  // 5) UPI QR: a bad id shows an error, a good id draws a QR on the poster
  await page.click('#qrSeg [data-qr="upi"]');
  await page.fill('#upiId', 'gupta electronics');
  expect(await page.getAttribute('#qrMsg', 'data-state') === 'bad', 'bad UPI id is flagged');
  const s3 = await sig();
  r = await rev();
  await page.fill('#upiId', 'guptaelectronics@oksbi');
  await waitRev(r);
  expect(await page.getAttribute('#qrMsg', 'data-state') === 'ok', 'good UPI id accepted');
  expect((await sig()) !== s3, 'QR code drawn on the poster');

  // 6) make in 3 languages at once -> 3 posters
  await page.click('#multiCard summary');
  const picked = await page.$$eval('#multiLangs .chip[aria-pressed="true"]', (b) => b.length);
  expect(picked === 3, '3 languages picked by default, got ' + picked);
  await page.click('#multiMake');
  await page.waitForFunction(() => document.querySelectorAll('#multiOut .multi-item img').length === 3, null, { timeout: 60000 });
  const langs = await page.$$eval('#multiOut .multi-item', (f) => f.map((x) => x.dataset.lang));
  expect(langs.length === 3 && langs[0] === lang, 'three posters made, first in the poster language: ' + langs.join(','));

  // 7) a double tap on "Download" saves ONE file, and an emoji in the name doesn't leave junk in the file name
  r = await rev();
  await page.fill('#bizName', '🛍️ Gupta Store');
  await waitRev(r);
  let nDl = 0; const onDl = () => { nDl++; };
  page.on('download', onDl);
  const [dl3] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.dblclick('#dlPng')]);
  await page.waitForTimeout(1500);
  page.off('download', onDl);
  expect(nDl === 1, 'double click on Download PNG saves one file, got ' + nDl);
  const fn3 = dl3.suggestedFilename();
  expect(/^Gupta-Store-diwali-story-/.test(fn3) && !/[\uFE00-\uFE0F]/.test(fn3), 'clean file name for an emoji business name, got ' + JSON.stringify(fn3));

  // 8) search finds a festival typed in another language's script
  await page.fill('#occSearch', lang === 'en' ? 'दिवाली' : 'Diwali');
  const found = await page.$$eval('.occ', (b) => b.map((x) => x.dataset.tpl));
  expect(found.indexOf('diwali') >= 0 && found.length < 5, 'cross-language search finds Diwali, got ' + found.join(','));
  await page.fill('#occSearch', '');

  // 9) reload keeps the occasion, size and business name (saved on this device only)
  await page.waitForTimeout(500);
  await page.reload();
  await page.waitForFunction(() => +document.getElementById('poster').dataset.rev > 0, null, { timeout: 20000 });
  expect(await page.inputValue('#bizName') === '🛍️ Gupta Store', 'business name survives a reload, got ' + await page.inputValue('#bizName'));
  d = await dims();
  expect(await page.getAttribute('#poster', 'data-tpl') === 'diwali' && d.w === 1080 && d.h === 1920, 'template and size survive a reload');

  // 10) festivals that last several days stay on top while they are on: on 3 Jan 2027 New Year is "on now"
  //     (and its poster still says 2027, not 2028)
  await page.clock.setFixedTime(new Date(2027, 0, 3, 10, 0, 0));
  await page.fill('#occSearch', ' ');
  await page.fill('#occSearch', '');
  const top = await page.$eval('#occFest .occ', (b) => ({ id: b.dataset.tpl, when: b.querySelector('.occ-when').textContent }));
  expect(top.id === 'newyear' && top.when.indexOf(t('when_now')) === 0, 'New Year is "on now" on 3 Jan, got ' + JSON.stringify(top));
};
