/* Interaction test for UPI QR & Payment Standee (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, t }) {
  const payload = async () => (await page.textContent('#payload')).trim();
  const ok = () => page.getAttribute('#sheet', 'data-ok');
  const settle = () => page.waitForTimeout(120);                 // input renders are debounced by 30 ms

  // 1. the sample renders straight away, flagged as a sample
  await page.waitForSelector('#sheet[data-ok="1"]', { timeout: 15000 });
  expect(await page.isVisible('#sampleNote'), 'sample UPI ID note shown');

  // 2. VPA + name + amount 250 -> exact UPI link; note is URL-encoded
  await page.fill('#vpa', 'Ramesh.Kirana@okbank ');
  await page.fill('#pn', 'Ramesh Kirana Store');
  await page.fill('#amt', '250');
  await page.fill('#note', '');
  await settle();
  let p = await payload();
  expect(p === 'upi://pay?pa=ramesh.kirana@okbank&pn=Ramesh%20Kirana%20Store&am=250.00&cu=INR', 'payload for 250, got ' + p);
  expect(!(await page.isVisible('#sampleNote')), 'sample note gone for a real UPI ID');
  await page.fill('#note', 'Bill #42 & tea');
  await settle();
  p = await payload();
  expect(p.endsWith('&cu=INR&tn=Bill%20%2342%20%26%20tea'), 'note encoded, got ' + p);

  // 3. QR matrix rendered into the sheet
  const size = +(await page.getAttribute('#sheet', 'data-size'));
  expect(size >= 21, 'QR matrix size ' + size);
  expect(await page.$eval('#sheet .qrbox svg path', (e) => e.getAttribute('d').length > 100), 'QR drawn as SVG');
  const cm = +(await page.getAttribute('#sheet', 'data-cm'));
  expect(cm >= 2.5, 'standee QR prints at least 2.5 cm, got ' + cm);

  // 4. amount edge cases: 0, negative, 3 decimals, Indian digits and commas
  for (const [bad, key] of [['0', 'err_amt_neg'], ['-5', 'err_amt_neg'], ['12.345', 'err_amt_dec'], ['12a', 'err_amt_bad']]) {
    await page.fill('#amt', bad);
    await settle();
    expect(await page.isVisible('#amtErr'), 'amount error for ' + bad);
    expect((await page.textContent('#amtErr')) === t(key), 'message for ' + bad + ': ' + (await page.textContent('#amtErr')));
    expect((await ok()) === '0', 'no QR for amount ' + bad);
  }
  await page.fill('#amt', '1,25,000.5');
  await settle();
  expect((await payload()).includes('&am=125000.50&'), 'commas removed + 2 decimals, got ' + (await payload()));
  expect(await page.isVisible('#amtWarn'), 'over 1 lakh warning');
  await page.fill('#amt', '२५०');
  await settle();
  expect((await payload()).includes('&am=250.00&'), 'Devanagari digits, got ' + (await payload()));
  await page.fill('#amt', '');
  await settle();
  expect(!(await payload()).includes('&am='), 'empty amount leaves am out');

  // 5. bad VPA -> error shown, QR and downloads off
  await page.fill('#vpa', 'ramesh kirana');
  await settle();
  expect(await page.isVisible('#vpaErr'), 'bad UPI ID error shown');
  expect((await ok()) === '0' && (await page.isDisabled('#btnPng')), 'QR off and PNG disabled for a bad UPI ID');
  await page.fill('#vpa', 'ramesh@okbank');
  await settle();
  expect(!(await page.isVisible('#vpaErr')) && (await ok()) === '1', 'valid again');

  // 6. non-Latin payee name warns; long note is cut to 50 characters
  await page.fill('#pn', 'रमेश किराना');
  await settle();
  expect(await page.isVisible('#pnWarn'), 'Indian-script name warning');
  await page.fill('#pn', 'Ramesh Kirana');
  await page.fill('#note', 'x'.repeat(70));
  await settle();
  expect((await payload()).endsWith('&tn=' + 'x'.repeat(50)), 'note trimmed to 50');
  expect(await page.isVisible('#noteCut'), 'note cut message');
  await page.fill('#note', 'Tuition fee');

  // 7. pasted upi:// link fills the fields
  await page.fill('#vpa', 'upi://pay?pa=Priya.Tuition@okhdfc&pn=Priya%20Sharma&cu=INR');
  await settle();
  expect((await page.inputValue('#vpa')) === 'priya.tuition@okhdfc', 'pa read from link');
  expect((await page.inputValue('#pn')) === 'Priya Sharma', 'pn read from link');

  // 8. designs: table tent has two panels (one upside down), sticker sheet has 12 codes
  await page.click('#d-tent');
  expect((await page.$$eval('#sheet .tt-panel', (e) => e.length)) === 2, 'two tent panels');
  expect(await page.$eval('#sheet .tt-panel.flip', (e) => getComputedStyle(e).transform !== 'none'), 'top panel rotated');
  await page.click('#d-stickers');
  await page.click('#stk-12');
  expect((await page.$$eval('#sheet .sk', (e) => e.length)) === 12, '12 stickers');
  const fitsAll = await page.$$eval('#sheet .sk', (els) => els.every((e) => e.scrollHeight <= e.clientHeight + 1));
  expect(fitsAll, 'sticker content fits its cell');
  await page.click('#d-standee');
  await page.click('#paper-A4');
  expect(await page.$eval('#sheet', (e) => e.classList.contains('p-A4')), 'A4 standee');

  // 9. save the UPI ID, it survives a reload
  await page.click('#btnSave');
  expect((await page.$$eval('#savedRow .sv', (e) => e.length)) === 1, 'one saved UPI ID');
  await page.waitForTimeout(400);
  await page.reload();
  await page.waitForSelector('#sheet[data-ok="1"]', { timeout: 15000 });
  expect((await page.$$eval('#savedRow .sv', (e) => e.length)) === 1, 'saved UPI ID after reload');
  expect((await page.inputValue('#vpa')) === 'priya.tuition@okhdfc', 'UPI ID kept after reload');

  // 10. counter mode: type the bill, QR + amount for the customer, Esc closes
  await page.click('#btnCounter');
  expect(await page.isVisible('#counter'), 'counter mode open');
  await page.fill('#cmAmt', '99.5');
  expect((await page.textContent('#cmAmount')).includes('99.50'), 'big amount shown: ' + (await page.textContent('#cmAmount')));
  const cp = await page.getAttribute('#cmQr', 'data-payload');
  expect(cp === 'upi://pay?pa=priya.tuition@okhdfc&pn=Priya%20Sharma&am=99.50&cu=INR&tn=Tuition%20fee', 'counter payload, got ' + cp);
  expect(await page.$eval('#cmQr svg path', (e) => e.getAttribute('d').length > 100), 'counter QR drawn');
  await page.fill('#cmAmt', '0');
  expect((await page.textContent('#cmMsg')) === t('err_amt_neg'), 'counter rejects 0');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  expect(!(await page.isVisible('#counter')), 'counter closed by Esc');

  // 11. image design + PNG download
  await page.click('#d-image');
  expect(await page.isVisible('#imgCanvas'), 'image canvas shown');
  expect(await page.$eval('#imgCanvas', (c) => c.width === 1080 && c.height === 1920), 'status size 1080x1920');
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#btnPng')]);
  expect(/^upi-qr-.+\.png$/.test(dl.suggestedFilename()), 'png download, got ' + dl.suggestedFilename());
  await page.click('#d-standee');
};
