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
  await settle();
  // the sample payee and shop names never end up on a real QR
  expect((await page.inputValue('#pn')) === '', 'typing a real UPI ID clears the sample payee name');
  expect(!(await page.textContent('#sheet')).includes(t('sample_shop')), 'sample shop name gone from the standee');
  expect(!(await payload()).includes('pn='), 'no sample pn in the link');
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
  expect((await page.inputValue('#note')) === '', 'the link has no note, so the old note is cleared');
  await page.fill('#note', 'Tuition fee');

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
  await page.waitForTimeout(300);
  expect((await page.evaluate(() => document.activeElement && document.activeElement.id)) === 'btnCounter', 'focus returns to the Counter mode button after full screen ends');

  // 11. image design + PNG download
  await page.click('#d-image');
  expect(await page.isVisible('#imgCanvas'), 'image canvas shown');
  expect(await page.$eval('#imgCanvas', (c) => c.width === 1080 && c.height === 1920), 'status size 1080x1920');
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#btnPng')]);
  expect(/^upi-qr-.+\.png$/.test(dl.suggestedFilename()), 'png download, got ' + dl.suggestedFilename());
  await page.click('#d-standee');

  // 12. a pasted link replaces every field: a fixed amount or note it does not carry is cleared; any-case parameter names
  await page.fill('#amt', '250'); await page.fill('#note', 'old note'); await settle();
  await page.fill('#vpa', 'UPI://PAY?PA=Shop.Static@OKAXIS&PN=Static%20Shop'); await settle();
  p = await payload();
  expect(p === 'upi://pay?pa=shop.static@okaxis&pn=Static%20Shop&cu=INR', 'link replaces amount and note, got ' + p);
  await page.fill('#amt', '₹1,250/-'); await settle();
  expect((await payload()).includes('&am=1250.00&'), '"₹1,250/-" read as 1250.00, got ' + (await payload()));

  // 13. worst case: logo, long Hindi shop name, long payee name, long UPI ID and an amount still fit every design,
  //     and each design prints on exactly ONE page with the sheet at the top (nothing pushed onto a second sheet)
  const png = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 300; c.height = 200; const x = c.getContext('2d'); x.fillStyle = '#c2410c'; x.fillRect(0, 0, 300, 200); x.fillStyle = '#1d4ed8'; x.fillRect(150, 50, 140, 100); return c.toDataURL('image/png').split(',')[1]; });
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#btnLogo')]);
  await fc.setFiles({ name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await page.waitForSelector('#sheet .st-logo', { timeout: 5000 });
  await page.fill('#vpa', 'lakshmi.textiles.chennai@okhdfcbank'); await page.fill('#pn', 'Lakshmi Textiles and Readymades');
  await page.fill('#shop', 'शर्मा जनरल स्टोर & शर्मा जनरल स्टोर'); await page.fill('#amt', '12,499.50');
  await page.selectOption('#slang', 'hi');
  await page.waitForTimeout(600);
  const pdfPages = async () => { const b = (await page.pdf({ preferCSSPageSize: true, printBackground: true })).toString('latin1'); const m = b.match(/\/Count (\d+)/); return m ? +m[1] : -1; };
  const fitAll = () => page.$eval('#sheet', (s) => {
    const list = s.classList.contains('d-tent') ? [...s.querySelectorAll('.tt-panel')] : s.classList.contains('d-stickers') ? [...s.querySelectorAll('.sk')] : [s];
    return list.every((n) => n.scrollHeight <= n.clientHeight + 1 && n.scrollWidth <= n.clientWidth + 1);
  });
  for (const [d, extra, minCm] of [['standee', '#paper-A5', 5], ['standee', '#paper-A4', 7], ['tent', null, 5], ['stickers', '#stk-6', 3], ['stickers', '#stk-12', 2.5]]) {
    await page.click('#d-' + d); if (extra) await page.click(extra);
    await settle();
    const name = d + (extra || '');
    const cmNow = +(await page.getAttribute('#sheet', 'data-cm'));
    expect(await fitAll(), name + ' content fits on screen');
    expect(cmNow >= minCm, name + ' QR stays at least ' + minCm + ' cm, got ' + cmNow);
    await page.emulateMedia({ media: 'print' });
    const top = await page.$eval('#sheet', (s) => Math.round(s.getBoundingClientRect().top));
    const fitPrint = await fitAll();
    await page.emulateMedia({ media: null });
    expect(top === 0, name + ' sheet starts at the top of the printed page, got ' + top);
    expect(fitPrint, name + ' content fits on paper');
    const n = await pdfPages();
    expect(n === 1, name + ' prints on exactly one page, got ' + n);
  }
  const hiScan = await page.evaluate(() => window.APP_STRINGS.hi.st_scan);
  expect((await page.textContent('#sheet .sk-scan')) === hiScan, 'sticker carries the full Hindi scan line');
  expect(!(await page.$('#sheet .sk-scan.clamp2')), 'sticker scan line is never cut with an ellipsis');

  // 14. the sticker layout does not depend on the window width (preview = print)
  await page.click('#stk-12'); await settle();
  const geo = async () => (await page.getAttribute('#sheet', 'data-qrw')) + '/' + (await page.getAttribute('#sheet', 'data-cm'));
  const wide = await geo(), vp = page.viewportSize();
  await page.setViewportSize({ width: 390, height: 800 }); await page.waitForTimeout(500);
  const narrow = await geo();
  await page.setViewportSize(vp); await page.waitForTimeout(500);
  expect(wide === narrow, 'same sticker QR size at 390 px and full width: ' + wide + ' vs ' + narrow);

  // 15. Urdu: Nastaliq lines are not line-clamped (Chrome's clamp drops parts of the letters)
  await page.selectOption('#slang', 'ur'); await settle();
  expect(await fitAll(), 'Urdu stickers fit');
  await page.click('#d-standee'); await settle();
  expect((await page.$eval('#sheet .st-shop', (e) => getComputedStyle(e).display)) === 'block', 'Urdu shop name not clamped');

  // tidy up for the after-test screenshot
  await page.click('#btnLogoDel');
  await page.selectOption('#slang', 'auto');
  await page.click('#paper-A5');
  await settle();
};
