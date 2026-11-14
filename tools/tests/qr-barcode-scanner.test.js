/* Interaction test for QR & Barcode Scanner (run by tools/verify.js in en and hi).
   Test pictures are made in the page with the site's own QR encoder (apps/qr-code-maker/qr.js) and then
   handed to the scanner as picked files, so the real decode path (BarcodeDetector or bundled jsQR) is used. */
const path = require('path');
module.exports = async function ({ page, expect, t }) {
  const settle = (ms) => page.waitForTimeout(ms || 150);
  await page.addScriptTag({ path: path.join(__dirname, '..', '..', 'apps', 'qr-code-maker', 'qr.js') });
  const qrPng = async (text) => {
    const url = await page.evaluate((text) => {
      const q = window.QRGen.encode(text, 'M', { mask: -1 });
      const s = 8, m = 4, n = q.size, cv = document.createElement('canvas');
      cv.width = cv.height = (n + 2 * m) * s;
      const c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, cv.width, cv.height); c.fillStyle = '#000';
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.modules[y][x]) c.fillRect((x + m) * s, (y + m) * s, s, s);
      return cv.toDataURL('image/png');
    }, text);
    return Buffer.from(url.split(',')[1], 'base64');
  };
  const blankPng = async () => Buffer.from((await page.evaluate(() => {
    const cv = document.createElement('canvas'); cv.width = 300; cv.height = 200;
    const c = cv.getContext('2d'); c.fillStyle = '#eee'; c.fillRect(0, 0, 300, 200); c.fillStyle = '#369'; c.fillRect(40, 40, 90, 60);
    return cv.toDataURL('image/png');
  })).split(',')[1], 'base64');
  const scan = async (text) => {
    await page.setInputFiles('#fileIn', { name: 'code.png', mimeType: 'image/png', buffer: await qrPng(text) });
    await page.waitForFunction((want) => { const r = document.querySelector('#resRaw'); return r && r.textContent === want; }, text, { timeout: 15000 });
    return page.getAttribute('#result', 'data-type');
  };
  const field = (name) => page.textContent('#result [data-field="' + name + '"]');
  const startUrl = page.url();
  let popups = 0; page.context().on('page', () => { popups++; });

  expect(await page.isHidden('#result'), 'no result at the start');
  expect(!(await page.isChecked('#keep')), 'history is off by default');

  // 1. a link: shown in full with a warning and an explicit open button; never opened by itself
  const link = 'https://example.com/offers/free-recharge?id=42';
  expect((await scan(link)) === 'link', 'link type');
  expect((await page.textContent('#resUrl')) === link, 'full address shown');
  expect((await field('host')) === 'example.com', 'site name shown');
  expect((await page.textContent('#linkWarn')).trim() === t('link_warn'), 'warning line shown');
  expect(await page.isVisible('#btnOpen'), 'open button present');
  expect((await page.$$('#result a')).length === 0, 'no clickable link in the result');
  await settle(400);
  expect(page.url() === startUrl && popups === 0, 'link was not opened automatically');

  // 2. a UPI string: payee and amount as text, no pay button or upi: link
  expect((await scan('upi://pay?pa=asha@okbank&pn=Asha%20Kirana&am=250.00&cu=INR&tn=Milk')) === 'upi', 'upi type');
  expect((await field('payee')) === 'Asha Kirana' && (await field('upi-id')) === 'asha@okbank' && (await field('amount')) === '₹250.00', 'upi fields: ' + await field('payee') + ' / ' + await field('amount'));
  expect((await page.$$('#result a, #result #btnOpen')).length === 0, 'no pay or open control for UPI');
  expect((await page.$$('#result button')).length === 2, 'only copy and share buttons');

  // 3. Wi-Fi (with an escaped ;), contact, number and plain text (Hindi)
  expect((await scan('WIFI:T:WPA;S:Ghar WiFi;P:chai\\;1234;;')) === 'wifi', 'wifi type');
  expect((await field('wifi-name')) === 'Ghar WiFi' && (await field('wifi-pass')) === 'chai;1234' && (await field('wifi-sec')) === 'WPA', 'wifi fields');
  expect((await scan('BEGIN:VCARD\nVERSION:3.0\nFN:Meera Nair\nTEL;TYPE=CELL:+91 12345 67890\nEMAIL:meera@example.com\nEND:VCARD')) === 'contact', 'contact type');
  expect((await field('c-name')) === 'Meera Nair' && (await field('c-phone')) === '+91 12345 67890' && (await field('c-email')) === 'meera@example.com', 'contact fields');
  expect((await scan('8901234567890')) === 'number', 'number type');
  expect((await scan('नमस्ते, यह एक सादा संदेश है')) === 'text', 'text type');
  expect((await page.textContent('#resType')).trim() === t('type_text'), 'type label translated');
  expect((await page.$$('#histList .qs-hist')).length === 0, 'nothing saved while history is off');

  // 4. a file that is not a picture, and a picture with no code
  await page.setInputFiles('#fileIn', { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
  await page.waitForFunction(() => document.querySelector('#msg').dataset.key === 'not_image', null, { timeout: 5000 });
  await page.setInputFiles('#fileIn', { name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('this is not really a png') });
  await page.waitForFunction(() => document.querySelector('#msg').dataset.key === 'not_image', null, { timeout: 5000 });
  await page.setInputFiles('#fileIn', { name: 'blank.png', mimeType: 'image/png', buffer: await blankPng() });
  await page.waitForFunction(() => document.querySelector('#msg').dataset.key === 'no_code', null, { timeout: 15000 });
  expect((await page.textContent('#msg')).trim() === t('no_code'), 'no-code message');

  // 5. optional history: on, two scans, reopen one, clear all
  await page.check('#keep');
  await scan('first scan'); await scan('8901234567890');
  expect((await page.$$('#histList .qs-hist')).length === 2, 'two scans saved');
  await page.click('#histList .qs-hist:last-child'); await settle();
  expect((await page.textContent('#resRaw')) === 'first scan', 'history item reopened');
  await page.click('#btnClear'); await settle();
  expect((await page.$$('#histList .qs-hist')).length === 0 && await page.isHidden('#btnClear'), 'history cleared');

  // 6. camera: starts (fake camera in the test browser), shows the stop button, and stops
  await page.click('#btnCam');
  await page.waitForSelector('#btnStop:not([hidden])', { timeout: 10000 });
  expect(await page.isVisible('#camWrap'), 'camera view visible');
  expect(await page.$eval('#video', v => !!v.srcObject && v.srcObject.getVideoTracks().length === 1), 'camera stream attached');
  await settle(600);
  await page.click('#btnStop'); await settle();
  expect(await page.isHidden('#camWrap') && await page.isVisible('#btnCam'), 'camera stopped');
  expect(await page.$eval('#video', v => v.srcObject === null), 'camera stream released');
};
