/* Interaction test for GST Invoice & Quotation Maker (run by tools/verify.js in en and hi).
   Drives the UI only through ids / data-* attributes, so it works in every language. */
const fs = require('fs');

module.exports = async function ({ page, lang, expect, t }) {
  const paise = (id) => page.$eval('#' + id, (e) => Number(e.dataset.paise));
  const hidden = (id) => page.$eval('#' + id, (e) => e.classList.contains('hide') || e.hidden);
  const rowIds = () => page.$$eval('#lines .ln[data-id]', (rows) => rows.map((r) => r.dataset.id));
  const cell = async (i, k) => `#lines .ln[data-id="${(await rowIds())[i]}"] input[data-k="${k}"]`;
  const fillLine = async (i, v) => { for (const k of Object.keys(v)) await page.fill(await cell(i, k), v[k]); };
  await page.waitForSelector('#lines .ln[data-id]', { timeout: 10000 });

  /* 0) the sample invoice: Pune (27) -> Bengaluru (29), so IGST; it is in the page language */
  expect(await page.inputValue('#custName') === t('sample_cust'), 'sample customer is in the page language');
  expect(await paise('sumIgst') === 334180, 'sample IGST should be 3,341.80, got ' + await paise('sumIgst'));
  expect(await paise('sumTotal') === 4285200, 'sample total rounds 42,851.80 up to 42,852.00, got ' + await paise('sumTotal'));
  expect(await paise('sumRound') === 20, 'round off +0.20');
  expect(await hidden('rowCgst'), 'no CGST row for an inter-state sample');
  const upi = await page.$eval('#sheet .sh-qrbox', (e) => e.dataset.upi);
  expect(/^upi:\/\/pay\?pa=sharma\.traders@example&.*am=42852\.00&cu=INR/.test(upi), 'UPI QR asks for the exact amount: ' + upi);
  expect(await page.$('#sheet #upiQr path') !== null, 'UPI QR is drawn on the invoice');
  expect(await page.$$eval('#sheet .sh-items > tbody > tr[data-line]', (r) => r.length) === 4, 'sample invoice shows 4 lines');

  /* 1) new invoice: number series per financial year */
  await page.click('#newDoc');
  await page.fill('#docDate', '2026-10-04');
  expect(await page.inputValue('#docNo') === 'INV/26-27/0001', 'first number of FY 2026-27, got ' + await page.inputValue('#docNo'));
  await page.fill('#docDate', '2027-03-31');
  expect(await page.inputValue('#docNo') === 'INV/26-27/0001', '31 March is still FY 2026-27');
  await page.fill('#docDate', '2027-04-01');
  expect(await page.inputValue('#docNo') === 'INV/27-28/0001', 'numbering resets on 1 April');
  await page.fill('#docDate', '2026-10-04');

  /* 2) Maharashtra buyer: same state as the (sample) seller -> CGST + SGST */
  await page.fill('#custName', 'Test Buyer Pvt Ltd');
  await page.fill('#custGstin', '27abcpm4321d1z5');
  expect(await page.$eval('#custGstinMsg', (e) => e.dataset.state) === 'ok', 'valid GSTIN accepted');
  expect(await page.inputValue('#custState') === '27' && await page.inputValue('#docPos') === '27', 'state and place of supply follow the GSTIN');
  await fillLine(0, { desc: 'Steel almirah', hsn: '9403', qty: '1', rate: '1000', gst: '18' });
  expect(await paise('sumCgst') === 9000 && await paise('sumSgst') === 9000, 'MH->MH Rs 1,000 at 18%: CGST 90 + SGST 90');
  expect(await hidden('rowIgst'), 'no IGST within the state');
  expect(await paise('sumTotal') === 118000, 'total 1,180.00');

  /* 3) place of supply Karnataka -> IGST */
  await page.selectOption('#docPos', '29');
  expect(await paise('sumIgst') === 18000, 'MH->KA: IGST 180, got ' + await paise('sumIgst'));
  expect(await hidden('rowCgst') && await hidden('rowSgst'), 'CGST/SGST rows hidden for IGST');
  expect(await page.$eval('#modeBadge', (e) => e.dataset.mode) === 'inter', 'tax mode badge says inter-state');

  /* 4) amount in words (Indian system) */
  await page.fill(await cell(0, 'qty'), '100');
  expect(await paise('sumTotal') === 11800000, 'total 1,18,000.00');
  const words = await page.textContent('#wordsEn');
  expect(words.trim() === 'Rupees One Lakh Eighteen Thousand Only', 'words for 118000, got ' + words);
  const printed = await page.waitForFunction(() => (document.querySelector('#sheet #shWords') || {}).textContent.includes('Rupees One Lakh Eighteen Thousand Only'), null, { timeout: 5000 }).then(() => true, () => false);
  expect(printed, 'words printed on the invoice preview');
  if (lang === 'hi') expect((await page.textContent('#wordsLocal')).includes('एक लाख अठारह हज़ार'), 'Hindi words for 118000');

  /* 5) a wrong GSTIN check character is caught */
  await page.fill('#custGstin', '27ABCPM4321D1Z6');
  expect(await page.$eval('#custGstinMsg', (e) => e.dataset.state) === 'check', 'bad check digit flagged');
  expect(await page.$eval('#custGstin', (e) => e.classList.contains('bad')), 'GSTIN field marked red');
  expect((await page.textContent('#custGstinMsg')).includes('5'), 'message tells the right check character (5)');
  await page.fill('#custGstin', '27ABCPM4321D1Z5');

  /* 6) save; register CSV for the accountant */
  await page.click('#saveDoc');
  expect(await page.$eval('#saveState', (e) => e.classList.contains('ok')), 'shows saved');
  await page.click('#tab-docs');
  expect(await page.$$eval('#docBody tr', (r) => r.length) === 1, 'one saved document');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#regCsv')]);
  const csv = fs.readFileSync(await dl.path(), 'utf8');
  const lines = csv.replace(/^﻿/, '').trim().split(/\r?\n/);
  expect(lines.length === 2, 'register has a header and one invoice, got ' + lines.length);
  expect(lines[1].includes('INV/26-27/0001') && lines[1].includes('04-10-2026') && lines[1].includes('27ABCPM4321D1Z5'), 'register row has number, date and GSTIN: ' + lines[1]);
  expect(lines[1].includes('29-Karnataka') && lines[1].includes('100000.00') && lines[1].includes('18000.00') && lines[1].includes('118000.00'), 'register row has POS, taxable, IGST, total: ' + lines[1]);

  /* 7) next invoice continues the series; a duplicate number cannot be saved */
  await page.click('#tab-make');
  await page.click('#newDoc');
  await page.fill('#docDate', '2026-10-05');
  expect(await page.inputValue('#docNo') === 'INV/26-27/0002', 'next number is 0002, got ' + await page.inputValue('#docNo'));
  await page.fill('#docNo', 'INV/26-27/0001');
  expect(await page.$eval('#noMsg', (e) => e.classList.contains('bad')), 'duplicate number flagged');
  await page.fill('#docNo', 'INV/26-27/0002');

  /* 8) keyboard: Enter in the item jumps to quantity, Enter again opens the next line */
  await page.focus(await cell(0, 'desc'));
  await page.keyboard.type('Plastic chair');
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => document.activeElement.dataset.k) === 'qty', 'Enter moves to quantity');
  await page.keyboard.type('4');
  await page.keyboard.press('Enter');
  expect((await rowIds()).length === 2 && await page.evaluate(() => document.activeElement.dataset.k) === 'desc', 'Enter opens a new line');
  await page.click(`#lines .ln[data-id="${(await rowIds())[1]}"] button.del`);

  /* 9) rate including GST is back-calculated (intra-state, sample seller in MH) */
  await page.fill('#custGstin', '27ABCPM4321D1Z5');
  await page.check('#optIncl');
  await fillLine(0, { qty: '1', rate: '1180', gst: '18', hsn: '9401' });
  expect(await paise('sumTaxable') === 100000 && await paise('sumCgst') === 9000, 'Rs 1,180 incl. 18% -> taxable 1,000 + CGST 90, got ' + await paise('sumTaxable'));
  await page.uncheck('#optIncl');

  /* 10) zero / negative quantity is refused, not counted */
  await page.fill(await cell(0, 'qty'), '0');
  expect(await page.$eval('#lines .ln[data-id]', (r) => r.classList.contains('has-err')), 'zero quantity marks the line');
  expect(await paise('sumTotal') === 0, 'an invalid line is not counted');
  await page.fill(await cell(0, 'qty'), '-2');
  expect(await page.$$eval('#checks li.err', (li) => li.length) >= 1, 'negative quantity listed as an error');
  await page.fill(await cell(0, 'qty'), '2');
  await page.fill(await cell(0, 'rate'), '499.50');

  /* 11) a long invoice: 55 lines */
  for (let i = 0; i < 54; i++) await page.click('#addLine');
  await page.evaluate(() => {
    const rows = [...document.querySelectorAll('#lines .ln[data-id]')].slice(1);
    rows.forEach((r, i) => {
      const set = (k, v) => { const inp = r.querySelector(`input[data-k="${k}"]`); inp.value = v; inp.dispatchEvent(new Event('input', { bubbles: true })); };
      set('desc', 'Item ' + (i + 2)); set('hsn', '3926'); set('qty', '3'); set('rate', '10.10'); set('gst', '5');
    });
  });
  expect((await rowIds()).length === 55, '55 lines in the form');
  await page.waitForFunction(() => document.querySelectorAll('#sheet .sh-items > tbody > tr[data-line]').length === 55, null, { timeout: 5000 });
  /* 2 x 499.50 = 999.00 at 18% (CGST 89.91 + SGST 89.91); 54 x 30.30 = 1636.20 at 5% (each line 0.76 + 0.76) */
  expect(await paise('sumTaxable') === 99900 + 54 * 3030, 'taxable of 55 lines, got ' + await paise('sumTaxable'));
  expect(await paise('sumCgst') === 8991 + 54 * 76, 'CGST of 55 lines, got ' + await paise('sumCgst'));
  expect(await page.$$eval('#sheet .sh-hsn tbody tr', (r) => r.length) === 3, 'HSN summary: 2 groups + total');

  /* 12) print three copies (window.print stubbed) */
  await page.evaluate(() => { window.print = () => { window.__printed = (window.__printed || 0) + 1; }; });
  await page.check('#copy1');
  await page.check('#copy2');
  await page.click('#printDoc');
  await page.waitForFunction(() => window.__printed === 1, null, { timeout: 5000 });
  const copies = await page.$$eval('#printRoot .copyset', (c) => c.map((x) => x.querySelector('.sheet .sh-copy').textContent));
  expect(copies.length === 3, 'three copies printed, got ' + copies.length);
  const pages = await page.$$eval('#printRoot .copyset', (c) => c.map((x) => x.querySelectorAll('.sheet').length));
  expect(pages[0] >= 2 && pages.every((n) => n === pages[0]), '55 lines need more than one A4 page per copy: ' + pages.join(','));
  expect(await page.$$eval('#printRoot .copyset:first-child .sheet', (sh) => sh.every((s) => s.querySelector('.sh-items thead th'))), 'every page repeats the column headings');
  expect(copies[0].includes('Original for Recipient') && copies[1].includes('Duplicate for Transporter') && copies[2].includes('Triplicate for Supplier'), 'copy labels: ' + copies.join(' | '));

  /* 13) WhatsApp text carries the amount */
  const wa = await page.getAttribute('#waDoc', 'href');
  expect(wa.startsWith('https://wa.me/') && decodeURIComponent(wa).includes(await page.$eval('#sumTotal', (e) => e.textContent.replace('₹', ''))), 'WhatsApp message has the total');

  /* 14) quotation -> invoice, receipt amount */
  await page.click('#type-qtn');
  expect((await page.inputValue('#docNo')).startsWith('QTN/26-27/'), 'quotation series');
  await page.click('#saveDoc');
  await page.click('#toInvoice');
  expect(await page.inputValue('#docRef') === 'QTN/26-27/0001' && (await page.inputValue('#docNo')).startsWith('INV/'), 'invoice made from the quotation');
  await page.click('#type-rcpt');
  await page.fill('#rcAmount', '1,180.50');
  expect(await paise('sumTotal') === 118050, 'receipt amount');

  /* 15) errors block saving: a receipt without an amount */
  const savedCount = () => page.evaluate(() => { const k = Object.keys(localStorage).find((x) => /gst-invoice-maker.*docs$/.test(x)); return k ? JSON.parse(localStorage.getItem(k)).length : 0; });
  const n0 = await savedCount();
  await page.fill('#rcAmount', '');
  await page.click('#saveDoc');
  expect(await savedCount() === n0, 'a receipt with no amount is not saved');

  /* 16) "rates include GST": a Rs 100 item bills exactly Rs 100.00 (taxable 84.74 + CGST 7.63 + SGST 7.63); "18%" is accepted */
  await page.click('#newDoc');
  await page.click('#type-inv');
  await page.fill('#custName', 'Retail Buyer');
  await page.fill('#custGstin', '27ABCPM4321D1Z5');
  await page.check('#optIncl');
  await fillLine(0, { desc: 'Pressure cooker', hsn: '7615', qty: '1', rate: '100', gst: '18%' });
  expect(await paise('sumTaxable') === 8474 && await paise('sumCgst') === 763 && await paise('sumSgst') === 763 && await paise('sumTotal') === 10000,
    'Rs 100 incl. 18% splits into 84.74 + 7.63 + 7.63 = 100.00, got ' + [await paise('sumTaxable'), await paise('sumCgst'), await paise('sumTotal')].join('/'));
  await page.selectOption('#docPos', '29');
  expect(await paise('sumTaxable') + await paise('sumIgst') === 10000, 'inter-state inclusive price also adds back to 100.00');
  await page.selectOption('#docPos', '27');
  await page.uncheck('#optIncl');

  /* 17) invalid line, empty date, huge amount: shown as errors and never saved */
  await fillLine(0, { qty: '1O' });
  await page.click('#saveDoc');
  expect(await savedCount() === n0, 'a document with a line that is not a number is not saved');
  await fillLine(0, { qty: '1' });
  await page.fill('#docDate', '');
  expect(await page.$eval('#docDate', (e) => e.classList.contains('bad')), 'empty date is marked');
  await page.click('#saveDoc');
  expect(await savedCount() === n0, 'a document without a date is not saved');
  await page.fill('#docDate', '2026-10-06');
  await fillLine(0, { qty: '100000', rate: '99999999999' });
  expect(await page.$$eval('#checks li.err', (li) => li.length) >= 1 && await paise('sumTotal') === 0, 'an absurd amount is an error, not a garbled number');
  await fillLine(0, { qty: '1', rate: '10000' });
  await page.click('#saveDoc');
  expect(await savedCount() === n0 + 1, 'valid invoice saved');
  const invNo = await page.inputValue('#docNo');

  /* 18) part payments add up and mark the invoice paid; the second receipt asks for the balance */
  await page.click('#toReceipt');
  expect(await page.inputValue('#rcAmount') === '11800.00', 'receipt prefilled with the invoice total, got ' + await page.inputValue('#rcAmount'));
  await page.fill('#rcAmount', '5000');
  await page.click('#saveDoc');
  const paidOf = () => page.$$eval('#docBody tr', (trs, no) => { const tr = trs.find((x) => x.querySelector('td').textContent === no); return tr ? tr.querySelector('.paid-cb').checked : null; }, invNo);
  await page.click('#tab-docs');
  expect(await paidOf() === false, 'part payment leaves the invoice unpaid');
  await page.$$eval('#docBody tr', (trs, no) => trs.find((x) => x.querySelector('td').textContent === no).querySelector('button[data-act="open"]').click(), invNo);
  await page.click('#toReceipt');
  expect(await page.inputValue('#rcAmount') === '6800.00', 'second receipt asks for the balance 6800.00, got ' + await page.inputValue('#rcAmount'));
  await page.click('#saveDoc');
  await page.click('#tab-docs');
  expect(await paidOf() === true, 'two part payments mark the invoice paid');

  /* 19) a picture picked as a CSV is refused; a real items CSV with "18%" imports cleanly */
  await page.click('#tab-masters');
  const custRows = await page.$$eval('#custBody tr', (r) => r.length);
  const pick = async (sel, file) => { const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click(sel)]); await fc.setFiles(file); };
  await pick('#mcImport', { name: 'photo.csv', mimeType: 'text/csv', buffer: Buffer.from('89504e470d0a1a0a0000000d49484452000000100000001008060000001ff3ff61', 'hex') });
  await page.waitForTimeout(300);
  expect(await page.$$eval('#custBody tr', (r) => r.length) === custRows, 'binary file adds no customers');
  await pick('#miImport', { name: 'items.csv', mimeType: 'text/csv', buffer: Buffer.from('name,hsn_sac,unit,rate,gst_percent\nCeiling fan 1200mm,8414,nos,"1,850.00",18%\n') });
  await page.waitForFunction(() => [...document.querySelectorAll('#itemBody tr')].some((r) => r.textContent.includes('Ceiling fan')), null, { timeout: 4000 });
  const fanRow = await page.$$eval('#itemBody tr', (r) => r.find((x) => x.textContent.includes('Ceiling fan')).textContent);
  expect(fanRow.includes('18%') && !fanRow.includes('%%') && fanRow.includes('NOS'), 'imported item: GST 18, unit NOS: ' + fanRow);

  /* 20) a hand-edited backup with wrong value types restores without breaking the page */
  await page.click('#tab-docs');
  const backup = { app: 'gst-invoice-maker', version: 1, profile: { name: 'Patel Stores', gstin: 24, logo: 'https://tracker.example/p.png', composition: 'yes' }, settings: { copies: 'all', prefixes: null },
    customers: [{ name: 42 }], items: [{ name: 'Soap', rate: 30, gst: 18 }], docs: [{ type: 'inv', no: 'PS/1', date: '2026-10-01', lines: [{ desc: 'Soap', qty: 2, rate: 30, gst: 18 }] }] };
  await pick('#restoreJson', { name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
  await page.waitForFunction(() => document.querySelectorAll('#docBody tr').length === 1, null, { timeout: 4000 }).catch(() => { });
  expect(await page.$$eval('#docBody tr', (r) => r.length) === 1, 'backup restored with one document');
  await page.click('#tab-make');
  expect(await page.$('#sheet .sheet') !== null && !(await page.$('#sheet img.sh-logo')), 'preview renders; a remote logo URL from a file is dropped');
};
