/* Interaction test for QR Code Maker (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, t }) {
  const attr = (n) => page.getAttribute('#qrCanvas', 'data-' + n);
  const payload = async () => (await page.textContent('#payload')).trim();
  const count = () => page.$$eval('#sheetGrid .sheet-item', (els) => els.length);

  // 1. the sample link code renders straight away
  await page.waitForSelector('#qrCanvas[data-ok="1"]', { timeout: 15000 });
  expect(+(await attr('version')) >= 1, 'default code has a version');
  expect((await payload()).startsWith('https://'), 'default payload is a link: ' + (await payload()));
  const w = await page.$eval('#qrCanvas', (c) => c.width);
  expect(w >= 200, 'canvas was drawn, width ' + w);

  // 1b. links: https:// is added, but a school server "IP:port" gets http:// (not read as a scheme)
  await page.fill('#f-url', 'ncert.nic.in/textbook.php');
  expect((await payload()) === 'https://ncert.nic.in/textbook.php', 'https added, got ' + (await payload()));
  await page.fill('#f-url', '192.168.4.1:8080/kolibri');
  expect((await payload()) === 'http://192.168.4.1:8080/kolibri', 'local server gets http, got ' + (await payload()));
  await page.fill('#f-url', 'localhost:8000');
  expect((await payload()) === 'http://localhost:8000', 'host:port is not a scheme, got ' + (await payload()));

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

  // 5. too long -> error shown and download disabled; at level L the advice is not "choose level L"
  await page.fill('#f-text', 'a'.repeat(3000));
  expect(await page.isVisible('#qrStatus .callout.danger'), 'too-long error is shown');
  expect(await page.isDisabled('#btnPng'), 'download disabled for too-long text');
  const errH = await page.textContent('#qrStatus .callout.danger');
  await page.click('#ecl-L');
  const errL = await page.textContent('#qrStatus .callout.danger');
  expect(errL === t('err_too_long_l', { b: '3,000', max: '2,953' }), 'level L message, got ' + errL);
  expect(errH !== errL, 'level H and L messages differ');
  await page.click('#ecl-M');
  await page.fill('#f-text', 'Hello class 7');
  expect(!(await page.isDisabled('#btnPng')), 'download enabled again');

  // 6. low-contrast colours warn; "black on white" clears it
  await page.$eval('#o-fg', (el) => { el.value = '#dddddd'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  expect(await page.isVisible('#colorWarn'), 'low contrast warning visible');
  await page.click('#o-bw');
  expect(!(await page.isVisible('#colorWarn')), 'warning cleared after black on white');

  // 7. phone and WhatsApp normalisation (incl. digits typed on a Hindi keyboard and the 00 prefix)
  await page.click('#type-phone');
  const telH = await page.$eval('#f-phone', (e) => e.getBoundingClientRect().height);
  expect(telH >= 38, 'phone box is styled like the other inputs, height ' + telH);
  await page.fill('#f-phone', '+91 98765-43210');
  expect((await payload()) === 'tel:+919876543210', 'tel payload, got ' + (await payload()));
  await page.fill('#f-phone', '+९१ ९८७६५ ४३२१०');
  expect((await payload()) === 'tel:+919876543210', 'Devanagari digits, got ' + (await payload()));
  await page.click('#type-wa');
  await page.fill('#f-wamsg', '');
  await page.fill('#f-wanum', '98765 43210');
  expect((await payload()) === 'https://wa.me/919876543210', 'wa.me payload, got ' + (await payload()));
  await page.fill('#f-wanum', '0091 98765 43210');
  expect((await payload()) === 'https://wa.me/919876543210', '00 prefix dropped, got ' + (await payload()));
  await page.fill('#f-wanum', '௯௮௭௬௫ ௪௩௨௧௦');
  expect((await payload()) === 'https://wa.me/919876543210', 'Tamil digits, got ' + (await payload()));

  // 8. contact card
  await page.click('#type-vcard');
  await page.fill('#f-name', 'Ravi Kumar');
  await page.fill('#f-org', 'GSSS, Jaipur');
  p = await payload();
  expect(p.startsWith('BEGIN:VCARD') && p.includes('FN:Ravi Kumar') && p.includes('ORG:GSSS\\, Jaipur') && p.endsWith('END:VCARD'), 'vcard payload, got ' + p);

  // 9. poster sheet: add, sample, delete, persists after reload
  await page.fill('#f-caption', 'Ravi sir');
  await page.click('#btnAdd');
  expect((await page.textContent('#sheetCount')) === t('sheet_count_one', { n: '1' }), 'singular count, got ' + (await page.textContent('#sheetCount')));
  await page.click('#type-link');
  await page.$eval('#o-margin', (e) => { e.value = 0; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.click('#btnAdd');
  expect((await count()) === 2, 'two codes on the sheet');
  expect((await page.inputValue('#sheetGrid .sheet-item .si-title-input')) === 'Ravi sir', 'first title is the caption');
  await page.click('#btnSheetSample');
  expect((await count()) === 6, 'treasure hunt adds four codes, got ' + (await count()));
  expect(await page.$eval('#sheetGrid .sheet-item:nth-child(3) .si-qr svg path', (e) => e.getAttribute('d').length > 50), 'sheet code drawn as SVG');
  // treasure-hunt clues are shown to the teacher but never printed (or nobody would need to scan)
  expect((await page.$$eval('#sheetGrid .si-text.si-secret.no-print', (e) => e.length)) === 4, 'four secret clues');
  expect(await page.isVisible('#sheetSecret'), 'secret-clue note shown');
  await page.emulateMedia({ media: 'print' });
  expect((await page.$$eval('#sheetGrid .si-text', (els) => els.filter((e) => getComputedStyle(e).display !== 'none').length)) === 2, 'only the two normal codes print their text');
  await page.emulateMedia({ media: 'screen' });
  await page.click('#sheetGrid .sheet-item:last-child .si-del');
  expect((await count()) === 5, 'one code deleted');
  await page.click('#cols-4');
  expect((await page.$eval('#sheetGrid', (g) => g.style.getPropertyValue('--cols'))) === '4', 'four columns chosen');

  // 10. print buttons choose the layout, and it stays while the browser prints
  await page.click('#btnSheetPrint');
  expect(await page.evaluate(() => document.body.classList.contains('pm-sheet')), 'sheet print layout');
  await page.waitForTimeout(900);
  expect(await page.evaluate(() => document.body.classList.contains('pm-sheet')), 'sheet layout not reset by a timer');
  await page.click('#btnPrint');
  expect(await page.evaluate(() => document.body.classList.contains('pm-single')), 'single print layout');

  await page.waitForTimeout(400);
  await page.reload();
  await page.waitForSelector('#qrCanvas[data-ok="1"]', { timeout: 15000 });
  expect((await count()) === 5, 'sheet survives reload, got ' + (await count()));
  expect((await page.getAttribute('#type-link', 'aria-pressed')) === 'true', 'chosen type survives reload');
  const d0 = await page.getAttribute('#sheetGrid .sheet-item:nth-child(2) .si-qr svg path', 'd');
  const d1 = await page.getAttribute('#sheetGrid .sheet-item:nth-child(1) .si-qr svg path', 'd');
  expect(d0.startsWith('M0 0h7') && d1.startsWith('M4 4h7'), 'margin 0 kept after reload: ' + d0.slice(0, 8) + ' / ' + d1.slice(0, 8));
  expect((await page.$$eval('#sheetGrid .si-secret', (e) => e.length)) === 3, 'secret clues stay secret after reload');

  // 11. big-screen view opens, Esc closes it and focus returns to its button
  await page.click('#btnBig');
  expect(await page.isVisible('#bigView'), 'big view open');
  expect(await page.$eval('#bigCanvas', (c) => c.width >= 600), 'big canvas drawn');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  expect(!(await page.isVisible('#bigView')), 'big view closed by Esc');
  expect((await page.evaluate(() => document.activeElement && document.activeElement.id)) === 'btnBig', 'focus back on the big-screen button');

  // 12. PNG download produces a file
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#btnPng')]);
  expect(/\.png$/.test(dl.suggestedFilename()), 'png download, got ' + dl.suggestedFilename());
};
