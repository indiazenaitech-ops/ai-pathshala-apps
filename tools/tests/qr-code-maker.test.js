/* Interaction test for QR Code Maker (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect }) {
  const attr = (n) => page.getAttribute('#qrCanvas', 'data-' + n);
  const payload = async () => (await page.textContent('#payload')).trim();
  const count = () => page.$$eval('#sheetGrid .sheet-item', (els) => els.length);

  // 1. the sample link code renders straight away
  await page.waitForSelector('#qrCanvas[data-ok="1"]', { timeout: 15000 });
  expect(+(await attr('version')) >= 1, 'default code has a version');
  expect((await payload()).startsWith('https://'), 'default payload is a link: ' + (await payload()));
  const w = await page.$eval('#qrCanvas', (c) => c.width);
  expect(w >= 200, 'canvas was drawn, width ' + w);

  // 2. Wi-Fi: special characters are escaped, open network drops the password
  await page.click('#type-wifi');
  await page.fill('#f-ssid', 'Class 8 Lab');
  await page.fill('#f-pass', 'abc;123:xy');
  let p = await payload();
  expect(p === 'WIFI:T:WPA;S:Class 8 Lab;P:abc\\;123\\:xy;;', 'wifi payload escaped, got ' + p);
  await page.selectOption('#f-sec', 'nopass');
  p = await payload();
  expect(p === 'WIFI:T:nopass;S:Class 8 Lab;;', 'open wifi payload, got ' + p);

  // 3. UTF-8: Hindi + Tamil + Urdu text is counted in UTF-8 bytes
  await page.click('#type-text');
  const msg = 'नमस्ते கல்வி اردو 123';
  await page.fill('#f-text', msg);
  const bytes = +(await attr('bytes'));
  expect(bytes === Buffer.byteLength(msg, 'utf8'), 'utf-8 byte count ' + bytes + ' vs ' + Buffer.byteLength(msg, 'utf8'));

  // 4. higher error correction never makes the code smaller
  const vM = +(await attr('version'));
  await page.click('#ecl-H');
  const vH = +(await attr('version'));
  expect((await attr('ecl')) === 'H' && vH >= vM, 'level H version ' + vH + ' >= ' + vM);

  // 5. too long -> error shown and download disabled; short text fixes it
  await page.fill('#f-text', 'a'.repeat(3000));
  expect(await page.isVisible('#qrStatus .callout.danger'), 'too-long error is shown');
  expect(await page.isDisabled('#btnPng'), 'download disabled for too-long text');
  await page.fill('#f-text', 'Hello class 7');
  expect(!(await page.isDisabled('#btnPng')), 'download enabled again');

  // 6. low-contrast colours warn; "black on white" clears it
  await page.$eval('#o-fg', (el) => { el.value = '#dddddd'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  expect(await page.isVisible('#colorWarn'), 'low contrast warning visible');
  await page.click('#o-bw');
  expect(!(await page.isVisible('#colorWarn')), 'warning cleared after black on white');

  // 7. phone and WhatsApp normalisation
  await page.click('#type-phone');
  await page.fill('#f-phone', '+91 98765-43210');
  expect((await payload()) === 'tel:+919876543210', 'tel payload, got ' + (await payload()));
  await page.click('#type-wa');
  await page.fill('#f-wanum', '98765 43210');
  await page.fill('#f-wamsg', '');
  expect((await payload()) === 'https://wa.me/919876543210', 'wa.me payload, got ' + (await payload()));

  // 8. contact card
  await page.click('#type-vcard');
  await page.fill('#f-name', 'Ravi Kumar');
  await page.fill('#f-org', 'GSSS, Jaipur');
  p = await payload();
  expect(p.startsWith('BEGIN:VCARD') && p.includes('FN:Ravi Kumar') && p.includes('ORG:GSSS\\, Jaipur') && p.endsWith('END:VCARD'), 'vcard payload, got ' + p);

  // 9. poster sheet: add, sample, delete, persists after reload
  await page.fill('#f-caption', 'Ravi sir');
  await page.click('#btnAdd');
  await page.click('#type-link');
  await page.click('#btnAdd');
  expect((await count()) === 2, 'two codes on the sheet');
  expect((await page.inputValue('#sheetGrid .sheet-item .si-title-input')) === 'Ravi sir', 'first title is the caption');
  await page.click('#btnSheetSample');
  expect((await count()) === 6, 'treasure hunt adds four codes, got ' + (await count()));
  expect(await page.$eval('#sheetGrid .sheet-item:nth-child(3) .si-qr svg path', (e) => e.getAttribute('d').length > 50), 'sheet code drawn as SVG');
  await page.click('#sheetGrid .sheet-item:last-child .si-del');
  expect((await count()) === 5, 'one code deleted');
  await page.click('#cols-4');
  expect((await page.$eval('#sheetGrid', (g) => g.style.getPropertyValue('--cols'))) === '4', 'four columns chosen');
  await page.waitForTimeout(400);
  await page.reload();
  await page.waitForSelector('#qrCanvas[data-ok="1"]', { timeout: 15000 });
  expect((await count()) === 5, 'sheet survives reload, got ' + (await count()));
  expect((await page.getAttribute('#type-link', 'aria-pressed')) === 'true', 'chosen type survives reload');

  // 10. PNG download produces a file
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#btnPng')]);
  expect(/\.png$/.test(dl.suggestedFilename()), 'png download, got ' + dl.suggestedFilename());
};
