/* Interaction test for Certificate Maker (run by tools/verify.js in en and hi).
   Drives the UI with ids / data-* attributes only, so it works in every language. */
const fs = require('fs');
const PNG_1PX = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

module.exports = async function ({ page, lang, expect, t, log }) {
  const txt = (sel) => page.$eval(sel, (e) => e.textContent.trim());
  const attr = (sel, a) => page.getAttribute(sel, a);
  await page.waitForSelector('#scale .cert .c-name', { timeout: 10000 });

  /* 1) sample class: 6 certificates, the first one is a winner with a gold seal */
  expect(await attr('#count', 'data-n') === '6', 'sample list should make 6 certificates');
  expect(await txt('#scale .c-pos') === t('pos_1'), 'first sample person shows the translated first-place ribbon');
  expect(await attr('#scale .cert', 'data-rank') === '1', 'first sample person gets the gold (rank 1) seal');
  expect(await txt('#scale .c-title') === t('title_merit'), 'default title is the translated merit title');

  /* 2) own names: positions after a dash or |, blank lines skipped, "2." numbering removed */
  await page.fill('#names', 'Ravi Kumar - 1st\n\n2. Sita Devi\nJohn Mathew | 2nd prize\n');
  expect(await attr('#count', 'data-n') === '3', 'three names → 3 certificates, got ' + await attr('#count', 'data-n'));
  expect(await txt('#scale .c-name') === 'Ravi Kumar', 'first certificate is for Ravi Kumar');
  expect(await txt('#scale .c-pos') === t('pos_1'), '"1st" becomes the translated First Place');
  await page.click('#next');
  expect(await txt('#scale .c-name') === 'Sita Devi', 'numbering "2." is removed from the name');
  expect(await page.$('#scale .c-pos') === null, 'no position ribbon when no position is given');
  expect(await attr('#pos-label', 'data-i') === '2', 'preview counter moved to 2');
  await page.click('#next');
  expect(await txt('#scale .c-pos') === '2nd prize', 'a free-text position is kept as typed');
  expect(await attr('#scale .cert', 'data-rank') === '2', '"2nd prize" still gets the silver seal');
  expect(await page.$eval('#next', (b) => b.disabled), 'next is disabled on the last certificate');

  /* 3) type → title, event and custom message with placeholders */
  await page.selectOption('#type', 'participation');
  expect(await txt('#scale .c-title') === t('title_participation'), 'title follows the certificate type');
  expect(await page.inputValue('#title') === t('title_participation'), 'title box shows the new default title');
  await page.fill('#event', 'Inter-house Quiz');
  expect((await txt('#scale .c-msg')).includes('Inter-house Quiz'), 'default message mentions the event');
  await page.fill('#message', 'Well done {name} at {event}! ({position})');
  const msg = await txt('#scale .c-msg');
  expect(msg === 'Well done John Mathew at Inter-house Quiz! (2nd prize)', 'placeholders are filled per person, got: ' + msg);

  /* 4) keep the certificate in English while the app stays in its language */
  await page.selectOption('#certlang', 'en');
  expect(await txt('#scale .c-title') === 'Certificate of Participation', 'English certificate title');
  expect(await attr('#scale .cert', 'lang') === 'en', 'certificate is marked lang=en');

  /* 5) design + logo upload */
  await page.click('#designs .dbtn[data-d="2"]');
  expect(await page.$eval('#scale .cert', (e) => e.classList.contains('d-tiranga')), 'third design (tricolour) is applied');
  expect(await attr('#designs .dbtn[data-d="2"]', 'aria-pressed') === 'true', 'design button shows as pressed');
  const [fc] = await Promise.all([page.waitForEvent('filechooser', { timeout: 5000 }), page.click('#logo-add')]);
  await fc.setFiles({ name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from(PNG_1PX, 'base64') });
  await page.waitForSelector('#scale .c-logo', { timeout: 5000 });
  expect(await page.$eval('#scale .c-logo', (i) => /^data:image\/png/.test(i.src)), 'logo is shown on the certificate');

  /* 6) print all: one certificate per page (window.print stubbed) */
  await page.evaluate(() => { window.print = () => { window.__printed = (window.__printed || 0) + 1; }; });
  await page.click('#print-all');
  await page.waitForFunction(() => window.__printed === 1, null, { timeout: 5000 });
  const names = await page.$$eval('#print-root .cert .c-name', (els) => els.map((e) => e.textContent));
  expect(names.join('|') === 'Ravi Kumar|Sita Devi|John Mathew', 'print all builds one certificate per name: ' + names.join('|'));

  /* 7) save the current certificate as a 2x A4-landscape PNG */
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click('#png')]);
  const buf = fs.readFileSync(await dl.path());
  expect(buf.slice(1, 4).toString() === 'PNG', 'download is a PNG file');
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  expect(w === 2244 && h === 1586, 'PNG is 2244x1586, got ' + w + 'x' + h);
  expect(buf.length > 30000, 'PNG has real content (' + buf.length + ' bytes)');
  log('png ' + dl.suggestedFilename() + ' ' + buf.length + ' bytes');

  /* 8) settings survive a reload */
  await page.waitForTimeout(500);
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#scale .cert .c-name', { timeout: 10000 });
  expect(await attr('#count', 'data-n') === '3', 'names are remembered after reload');
  expect(await page.inputValue('#event') === 'Inter-house Quiz', 'event is remembered');
  expect(await page.$eval('#scale .cert', (e) => e.classList.contains('d-tiranga')), 'design is remembered');
  expect(await page.$('#scale .c-logo') !== null, 'logo is remembered');

  /* 9) empty list disables printing; reset brings the sample back */
  await page.fill('#names', '   \n  ');
  expect(await attr('#count', 'data-n') === '0', 'blank lines make no certificates');
  expect(await page.$eval('#print-all', (b) => b.disabled), 'print all is disabled with no names');
  await page.click('#reset');
  await page.waitForFunction(() => document.querySelector('#count').getAttribute('data-n') === '6', null, { timeout: 5000 });
  expect(await page.$('#scale .c-logo') === null, 'reset removes the logo');

  /* 10) more name formats: a dash without spaces before a rank splits, "Mary-Ann" does not, runner-up is 2nd (silver) */
  await page.fill('#names', 'Asha Rani-1st\nMary-Ann Thomas\nKaran Singh - First runner up\nNeha - 2nd runner-up');
  expect(await attr('#count', 'data-n') === '4', '4 names, got ' + await attr('#count', 'data-n'));
  expect(await txt('#scale .c-name') === 'Asha Rani' && await txt('#scale .c-pos') === t('pos_1'), '"Asha Rani-1st" → Asha Rani, First Place');
  await page.click('#next');
  expect(await txt('#scale .c-name') === 'Mary-Ann Thomas' && await page.$('#scale .c-pos') === null, 'a hyphenated name is kept whole');
  await page.click('#next');
  expect(await txt('#scale .c-pos') === 'First runner up' && await attr('#scale .cert', 'data-rank') === '2', '"First runner up" is 2nd place (silver), not gold');
  await page.click('#next');
  expect(await attr('#scale .cert', 'data-rank') === '3', '"2nd runner-up" is 3rd place (bronze)');

  /* 11) a long school name goes on 2 readable lines; logo and text stay clear of the Modern design's corner art */
  await page.click('#designs .dbtn[data-d="4"]');
  const [fc2] = await Promise.all([page.waitForEvent('filechooser', { timeout: 5000 }), page.click('#logo-add')]);
  await fc2.setFiles({ name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from(PNG_1PX, 'base64') });
  await page.waitForSelector('#scale .c-logo', { timeout: 5000 });
  await page.fill('#school', 'PM SHRI Kendriya Vidyalaya No. 2, Air Force Station Hindan, Ghaziabad (U.P.)');
  await page.fill('#sig2r', 'Principal & Chairperson, Examination Committee');
  const geo = await page.evaluate(() => {
    const c = document.querySelector('#scale .cert'), k = c.getBoundingClientRect().width / 1122, cb = c.getBoundingClientRect();
    const sc = c.querySelector('.c-school'), lg = c.querySelector('.c-logo').getBoundingClientRect();
    const lines = [...c.querySelectorAll('.c-sig-line')].map((e) => (e.getBoundingClientRect().top - cb.top) / k);
    return { wrap: sc.classList.contains('c-wrap'), fs: parseFloat(getComputedStyle(sc).fontSize), fits: sc.scrollHeight <= sc.clientHeight + 2 && sc.scrollWidth <= sc.clientWidth + 1,
      logoX: (lg.left - cb.left) / k, logoR: (lg.right - cb.left) / k, lines };
  });
  expect(geo.wrap && geo.fs >= 18 && geo.fits, 'long school name wraps to 2 lines at a readable size: ' + JSON.stringify(geo));
  expect(geo.logoX >= 185 && geo.logoR <= 1122 - 185, 'logo stays clear of the corner triangles: ' + JSON.stringify(geo));
  expect(Math.abs(geo.lines[0] - geo.lines[1]) < 1.5, 'both signature lines stay level when one designation wraps: ' + JSON.stringify(geo.lines));

  /* 12) Rangoli: the designation sits above the inner border lines (they start at y≈731) */
  await page.click('#designs .dbtn[data-d="3"]');
  const roleBottom = await page.evaluate(() => {
    const c = document.querySelector('#scale .cert'), k = c.getBoundingClientRect().width / 1122, top = c.getBoundingClientRect().top;
    return Math.max(...[...c.querySelectorAll('.c-sig-role')].map((e) => (e.getBoundingClientRect().bottom - top) / k));
  });
  expect(roleBottom <= 728, 'Rangoli designations do not touch the border lines, bottom at ' + roleBottom.toFixed(1));

  /* 13) "Print this one" prints only the current certificate, even if the browser fires beforeprint late (iOS / Android) */
  await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
  await page.click('#print-one');
  await page.waitForFunction(() => window.__printed === 1, null, { timeout: 5000 });
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  const one = await page.$$eval('#print-root .cert .c-name', (els) => els.map((e) => e.textContent));
  expect(one.length === 1 && one[0] === 'Neha', 'print this one → only the current certificate: ' + one.join('|'));
  await page.evaluate(() => { window.dispatchEvent(new Event('afterprint')); window.dispatchEvent(new Event('beforeprint')); });
  expect(await page.$$eval('#print-root .cert', (els) => els.length) === 4, 'a later Ctrl+P prints all certificates');

  /* 14) an emptied date stays hidden after a reload */
  await page.fill('#date', '');
  await page.dispatchEvent('#date', 'change');
  expect(await page.$('#scale .c-date') === null, 'empty date hides the date line');
  await page.waitForTimeout(500);
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#scale .cert .c-name', { timeout: 10000 });
  expect(await page.$('#scale .c-date') === null && await page.inputValue('#date') === '', 'empty date is remembered');
  expect(await page.$eval('#scale .cert', (e) => e.classList.contains('d-rangoli')) && await attr('#count', 'data-n') === '4', 'design and names remembered');

  /* 15) RTL: an Urdu certificate must be visible inside the preview box (not pushed out by dir=rtl) */
  const inside = await page.evaluate((back) => {
    EDU.setLang('ur');
    const box = document.querySelector('#scale').getBoundingClientRect();
    const nm = document.querySelector('#scale .c-name').getBoundingClientRect();
    const ok = { dir: document.querySelector('#scale .cert').getAttribute('dir'), inside: nm.width > 0 && nm.left >= box.left - 1 && nm.right <= box.right + 1 && nm.top >= box.top && nm.bottom <= box.bottom };
    EDU.setLang(back);
    return ok;
  }, lang);
  expect(inside.dir === 'rtl' && inside.inside, 'Urdu certificate is rtl and drawn inside the preview: ' + JSON.stringify(inside));
};
