/* Interaction test for the Fee Receipt Maker (run by tools/verify.js in en and hi).
   Every figure below is worked out by hand, not by the app. */
module.exports = async function ({ page, lang, expect, t }) {
  const set = async (sel, v) => { await page.fill(sel, String(v)); await page.waitForTimeout(40); };
  const val = (id) => page.$eval(id, (e) => Number(e.dataset.value));
  const words = async () => (await page.textContent('#sumWords')).trim();
  const W = (en, hi) => (lang === 'hi' ? 'रुपये ' + hi + ' मात्र' : 'Rupees ' + en + ' Only');
  await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });

  await page.waitForSelector('#preview .rc', { timeout: 10000 });

  /* 0) opens with sample data: 2,500 + 300 + 800 = 3,600, all paid, nothing due */
  expect(await val('#sumTotal') === 3600 && await val('#sumPaid') === 3600 && await val('#sumBal') === 0, 'sample total 3,600 paid 3,600 balance 0');
  expect(await words() === W('Three Thousand Six Hundred', 'तीन हज़ार छह सौ'), 'sample words: ' + await words());
  expect(!(await page.$eval('#sampleBanner', (e) => e.hidden)), 'sample banner shows while no names are typed');
  expect((await page.textContent('#preview .rc-name')).trim() === t('s_inst'), 'sample institute name on the receipt');
  expect(await page.inputValue('#no') === 'R-0001', 'first receipt number R-0001, got ' + await page.inputValue('#no'));
  expect(await page.$$eval('#histTable tbody tr', (r) => r.length).catch(() => 0) === 0, 'no saved receipts at the start');

  /* saving needs a student name */
  await page.click('#saveBtn');
  expect(await page.evaluate(() => FRM.hist.length) === 0, 'nothing saved without a student name');

  /* 1) a real receipt. Fees 12,500 + 750 + 1,800 + 450 = 15,500; concession 1,500; late fee 200
        total = 15,500 - 1,500 + 200 = 14,200; paid 10,000; balance 4,200 */
  await set('#instName', 'Test Tuition Centre');
  await set('#instAddr', 'Lane 4, Test Colony');
  await set('#student', 'Asha Kumari');
  await set('#cls', 'Class 10 - B');
  await set('#roll', '17');
  await set('#parent', 'R. Kumar');
  expect(await page.$eval('#sampleBanner', (e) => e.hidden), 'sample banner hides after typing');
  const amts = await page.$$('#heads .head-amt');
  expect(amts.length === 3, '3 fee rows at the start, got ' + amts.length);
  await amts[0].fill('12500'); await amts[1].fill('750'); await amts[2].fill('1,800');
  await page.click('#addHead');
  await (await page.$$('#heads .head-name'))[3].fill('Library');
  await (await page.$$('#heads .head-amt'))[3].fill('450');
  await set('#concession', '1500');
  await set('#late', '200');
  await set('#paid', '10000');
  expect(await val('#sumTotal') === 14200, 'total 14,200, got ' + await val('#sumTotal'));
  expect(await val('#sumPaid') === 10000 && await val('#sumBal') === 4200, 'paid 10,000 balance 4,200, got ' + await val('#sumPaid') + ' / ' + await val('#sumBal'));
  expect(await words() === W('Ten Thousand', 'दस हज़ार'), 'words for 10,000: ' + await words());
  const rc = await page.textContent('#preview .rc');
  expect(rc.includes('Test Tuition Centre') && rc.includes('Asha Kumari') && rc.includes('Library'), 'receipt shows the typed details');
  expect((await page.textContent('#preview .rc-total')).includes('14,200'), 'receipt total 14,200 (Indian grouping)');
  expect((await page.textContent('#preview .rc-bal')).includes('4,200'), 'receipt balance 4,200');
  expect((await page.textContent('#preview .rc-w')).trim() === W('Ten Thousand', 'दस हज़ार'), 'receipt words');
  expect(await page.$$eval('#preview .rc-tbl tr.hd', (r) => r.length) === 4, '4 fee rows on the receipt');

  /* full payment when "amount paid" is empty: 14,200 */
  await set('#paid', '');
  expect(await val('#sumPaid') === 14200 && await val('#sumBal') === 0, 'empty paid = full payment');
  expect(await words() === W('Fourteen Thousand Two Hundred', 'चौदह हज़ार दो सौ'), 'words for 14,200: ' + await words());

  /* lakh: tuition 2,50,000 -> 2,50,000 + 750 + 1,800 + 450 = 2,53,000; - 1,500 + 200 = 2,51,700 */
  await (await page.$$('#heads .head-amt'))[0].fill('250000');
  expect(await val('#sumTotal') === 251700, 'total 2,51,700, got ' + await val('#sumTotal'));
  expect((await page.textContent('#sumTotal')).includes('2,51,700'), 'Indian grouping 2,51,700: ' + await page.textContent('#sumTotal'));
  expect(await words() === W('Two Lakh Fifty One Thousand Seven Hundred', 'दो लाख इक्यावन हज़ार सात सौ'), 'lakh words: ' + await words());
  /* crore, straight from the words function */
  const cr = await page.evaluate(() => FRM.words(12345678, 'en'));
  expect(cr === 'Rupees One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight Only', 'crore words: ' + cr);
  await (await page.$$('#heads .head-amt'))[0].fill('12500');

  /* bad input never breaks the sums: letters = 0, Devanagari digits work, concession cannot exceed the fees */
  await set('#late', 'abc');
  expect(await val('#sumTotal') === 14000, 'letters in late fee count as 0 (15,500 - 1,500), got ' + await val('#sumTotal'));
  await set('#late', '२००');
  expect(await val('#sumTotal') === 14200, 'Devanagari digits read as 200, got ' + await val('#sumTotal'));
  await set('#concession', '9999999');
  expect(await val('#sumTotal') === 200, 'concession capped at the fees: only the late fee 200 is left, got ' + await val('#sumTotal'));
  await set('#concession', '1500');
  /* overpayment: paid 15,000 against 14,200 -> 800 extra */
  await set('#paid', '15000');
  expect(await val('#sumBal') === -800, 'paid extra 800, got ' + await val('#sumBal'));
  expect((await page.textContent('#sumBalLabel')).trim() === t('r_advance'), 'label switches to "paid extra"');
  await set('#paid', '10000');

  /* 2) save, then a new receipt keeps class and fees and moves the number up */
  await page.click('#saveBtn');
  expect(await page.$$eval('#histTable tbody tr', (r) => r.length) === 1, '1 saved receipt');
  const row = await page.textContent('#histTable tbody tr');
  expect(row.includes('R-0001') && row.includes('Asha Kumari') && row.includes('10,000') && row.includes('4,200'), 'saved row: ' + row);
  await page.click('#saveBtn');
  expect(await page.$$eval('#histTable tbody tr', (r) => r.length) === 1, 'saving the same number again does not duplicate');
  await page.click('#newBtn');
  expect(await page.inputValue('#no') === 'R-0002', 'next number R-0002, got ' + await page.inputValue('#no'));
  expect(await page.inputValue('#student') === '' && await page.inputValue('#cls') === 'Class 10 - B', 'new receipt: student cleared, class kept');
  expect(await val('#sumTotal') === 15500 && await val('#sumBal') === 0, 'new receipt keeps the fee rows (15,500), concession and late fee cleared');
  const inc = await page.evaluate(() => [FRM.incNo('R-0009'), FRM.incNo('99'), FRM.incNo('2026/045'), FRM.incNo('A')]);
  expect(inc.join('|') === 'R-0010|100|2026/046|A1', 'number increments: ' + inc.join('|'));

  /* 3) print: saves the receipt and builds one A4 sheet with an office copy and a parent copy */
  await set('#student', 'Imran Shaikh <b>&');
  await page.click('#printBtn');
  expect(await page.evaluate(() => window.__printed) === 1, 'print dialog asked for once');
  expect(await page.$$eval('#printRoot .sheet .rc', (r) => r.length) === 2, 'two copies on the sheet');
  const copies = await page.$$eval('#printRoot .rc-copy', (r) => r.map((x) => x.textContent.trim()));
  expect(copies[0] === t('r_office') && copies[1] === t('r_parent'), 'office copy + parent copy: ' + copies.join(' / '));
  expect(await page.$$eval('#printRoot .rc-student b', (r) => r.length) === 0 && (await page.textContent('#printRoot .rc-student')).includes('<b>&'), 'typed HTML is shown as text, not run');
  expect(await page.$$eval('#histTable tbody tr', (r) => r.length) === 2, 'printing saved the second receipt');

  /* print layout: with 8 fee rows and long names both copies still fit on one A4 page */
  for (let i = 0; i < 6; i++) if (!(await page.$eval('#addHead', (b) => b.disabled))) await page.click('#addHead');
  expect(await page.$$eval('#heads .head-row', (r) => r.length) === 8 && await page.$eval('#addHead', (b) => b.disabled), 'at most 8 fee rows');
  await set('#instName', 'Shri Saraswati Vidya Niketan Higher Secondary School and Junior College');
  await set('#instAddr', 'Plot 221, Behind the Old Bus Stand, Near the Water Tank, Ward 14, Test Nagar, District Testpur');
  await set('#concession', '100'); await set('#late', '50'); await set('#ref', 'CHQ 000123');
  await page.click('#printBtn');
  await page.emulateMedia({ media: 'print' });
  const fit = await page.evaluate(() => {
    const sheet = document.querySelector('#printRoot .sheet');
    return { h: sheet.getBoundingClientRect().height, w: sheet.getBoundingClientRect().width,
      rc: [...document.querySelectorAll('#printRoot .sheet .rc')].map((r) => Math.round(r.lastElementChild.getBoundingClientRect().bottom - r.getBoundingClientRect().bottom)),
      formHidden: getComputedStyle(document.querySelector('.fr-split')).display === 'none' };
  });
  await page.emulateMedia({ media: 'screen' });
  expect(fit.formHidden, 'the form is hidden on paper');
  expect(Math.abs(fit.w - 793.7) < 2 && fit.h <= 1122.6, 'sheet is one A4 page: ' + JSON.stringify(fit));
  expect(fit.rc.length === 2 && fit.rc.every((d) => d <= 1), 'both copies fit without clipping: ' + JSON.stringify(fit.rc));

  /* 4) CSV: header + 2 receipts, numbers as plain numbers */
  const rows = await page.evaluate(() => FRM.csvRows());
  expect(rows.length === 3 && rows[0].length === 16, 'CSV has a header and 2 rows of 16 columns');
  const first = rows.find((r) => r[0] === 'R-0001');
  expect(first && first[2] === 'Asha Kumari' && first[8] === 1500 && first[9] === 200 && first[10] === 14200 && first[11] === 10000 && first[12] === 4200, 'CSV row for R-0001: ' + JSON.stringify(first));
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#csvBtn')]);
  expect(/^fee-receipts-\d{4}-\d{2}-\d{2}\.csv$/.test(dl.suggestedFilename()), 'CSV file name: ' + dl.suggestedFilename());

  /* 5) Hindi interface: the receipt can still be made in English */
  if (lang === 'hi') {
    await set('#paid', '10000');
    await page.check('#enReceipt');
    expect(await words() === 'Rupees Ten Thousand Only', 'English receipt words in the Hindi interface: ' + await words());
    expect((await page.textContent('#preview .rc-title')).trim() === 'Fee Receipt', 'English receipt title');
    await page.uncheck('#enReceipt');
    expect(await words() === 'रुपये दस हज़ार मात्र', 'back to Hindi words: ' + await words());
  }

  /* 6) everything is remembered after a reload; open and delete work */
  await page.reload();
  await page.waitForSelector('#preview .rc');
  await page.evaluate(() => { window.print = () => { }; });
  expect((await page.inputValue('#instName')).startsWith('Shri Saraswati'), 'institute name remembered');
  expect(await page.$$eval('#histTable tbody tr', (r) => r.length) === 2, 'saved receipts remembered');
  const opens = await page.$$('#histTable .h-open');
  await opens[opens.length - 1].click();                      // the oldest one: R-0001
  expect(await page.inputValue('#no') === 'R-0001' && await page.inputValue('#student') === 'Asha Kumari', 'opened R-0001 again');
  expect(await val('#sumTotal') === 14200 && await val('#sumBal') === 4200, 'opened receipt has the same sums');
  await (await page.$$('#histTable .h-del'))[0].click();      // dialogs are auto-accepted
  expect(await page.$$eval('#histTable tbody tr', (r) => r.length) === 1, 'one receipt deleted');
  await page.click('#newBtn');
  expect(await page.inputValue('#no') === 'R-0003', 'numbering continues after the last saved receipt: ' + await page.inputValue('#no'));
};
