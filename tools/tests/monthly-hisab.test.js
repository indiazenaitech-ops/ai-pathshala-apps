/* Interaction test for Monthly Hisab (run by tools/verify.js in en and hi). Every expected amount is worked out by hand.
   Per-day rule under test: 1 day's pay = monthly salary ÷ days in that month, rounded to the paisa;
   absent days above the allowed leaves are cut at that rate. */
const fs = require('fs');

module.exports = async function ({ page, lang, expect, t, log }) {
  const wait = (ms) => page.waitForTimeout(ms || 80);
  const dp = async (sel) => Number(await page.getAttribute(sel, 'data-p'));
  const txt = async (sel) => (await page.textContent(sel)).trim();
  const chips = () => page.$$eval('#itemChips .mh-chip', (b) => b.map((x) => ({ id: x.dataset.id, p: Number(x.dataset.p), name: x.querySelector('b span').textContent })));
  const goTo = async (ym) => {
    for (let i = 0; i < 400; i++) {
      const cur = await page.getAttribute('#monthLabel', 'data-ym');
      if (cur === ym) return;
      await page.click(cur < ym ? '#btnNext' : '#btnPrev');
    }
    throw new Error('could not reach ' + ym);
  };
  const tapDays = async (brush, days) => {
    await page.click('#brushes [data-b="' + brush + '"]');
    for (const d of days) { await page.click('#cal .day[data-d="' + d + '"]'); await wait(30); }
  };
  const pick = (buffer, name) => ({ name, mimeType: 'application/json', buffer: Buffer.from(buffer, 'utf8') });

  // 0) a clearly marked, made-up sample month: 4 items; the sample house help is 6,000 with 3 absences and 2 leaves allowed,
  //    so exactly 1 day is cut at 6,000 ÷ (days in this month), plus a 500 festival bonus
  expect(await page.isVisible('#sampleNote'), 'sample note shown on first open');
  let c = await chips();
  expect(c.length === 4, '4 sample items, got ' + c.length);
  const days = Number(await page.getAttribute('#monthLabel', 'data-days'));
  const maidSample = c[2];
  expect(maidSample.p === 600000 - Math.round(600000 / days) + 50000, 'sample maid bill = 6000 - 1 day + 500 bonus, got ' + maidSample.p);
  expect(maidSample.name === t('tpl_maid'), 'sample names follow the language: ' + maidSample.name);
  // the first edit (a tap on a sample day) clears the whole example
  await page.click('#cal .day[data-d="4"]');
  await wait(150);
  expect(!(await page.isVisible('#sampleNote')) && (await chips()).length === 0 && (await page.isVisible('#noItems')), 'first edit cleared the example');

  // 1) January 2027 has 31 days. Milk 1 L a day at ₹62: day 9 not delivered, days 5 and 12 got 1.5 L
  //    -> 28 × 1 + 2 × 1.5 = 31 L × 62 = ₹1,922
  await goTo('2027-01');
  expect((await page.getAttribute('#monthLabel', 'data-days')) === '31', 'January has 31 days');
  await page.click('#btnAdd');
  await page.waitForSelector('#ed-form');
  await page.click('#ed-tpl [data-t="milk"]');
  await page.fill('#ed-rate', '-62');
  await page.click('#ed-save');
  expect((await txt('#ed-err')).includes(t('err_neg')), 'negative rate refused: ' + (await txt('#ed-err')));
  await page.fill('#ed-rate', '62');
  await page.fill('#ed-dq', '1');
  await page.click('#ed-save');
  await wait(150);
  c = await chips();
  expect(c.length === 1 && c[0].p === 31 * 6200, 'new milk item, 31 days × ₹62 = 1922 before marks, got ' + JSON.stringify(c));
  await tapDays('0', [9]);
  await tapDays('150', [5, 12]);
  expect((await dp('#itBill')) === 192200, 'milk bill = ₹1,922, got ' + (await dp('#itBill')));
  expect((await page.textContent('#itBill .num')).trim() === '₹1,922', 'Indian format ₹1,922: ' + (await page.textContent('#itBill .num')));
  expect((await page.getAttribute('#cal .day[data-d="9"]', 'data-v')) === '0' && (await page.getAttribute('#cal .day[data-d="5"]', 'data-v')) === '150', 'calendar marks stored');
  // tapping a marked day again with the same mark puts it back to usual
  await page.click('#cal .day[data-d="12"]'); await wait();
  expect((await dp('#itBill')) === 192200 - 3100, 'day 12 back to 1 L: 1922 - 31 = 1891');
  await page.click('#cal .day[data-d="12"]'); await wait();
  expect((await dp('#itBill')) === 192200, 'day 12 at 1.5 L again: 1922');
  // "Other…" quantity: 0.25 L on day 20, then undo with "Usual"
  await page.click('#brushes [data-b="x"]');
  await page.fill('#otherQty', '1.555');
  await page.click('#otherUse');
  expect((await txt('#otherErr')) === t('err_dec'), '3 decimals refused for quantity');
  await page.fill('#otherQty', '0.25');
  await page.click('#otherUse');
  await page.click('#cal .day[data-d="20"]'); await wait();
  expect((await dp('#itBill')) === 192200 - Math.round(75 * 6200 / 100), '0.25 L on day 20: 1922 - 46.50 = 1875.50, got ' + (await dp('#itBill')));
  await tapDays('u', [20]);
  expect((await dp('#itBill')) === 192200, 'usual again: 1922');

  // 2) House help ₹6,000 a month, 2 leaves allowed, absent on 3, 10, 17 -> 1 extra day cut
  //    1 day's pay = 6000 ÷ 31 = 193.548… -> ₹193.55, bill = 6000 - 193.55 = ₹5,806.45
  await page.click('#btnAdd');
  await page.waitForSelector('#ed-form');
  await page.click('#ed-tpl [data-t="maid"]');
  expect((await page.inputValue('#ed-lv')) === '2', 'house help starts with 2 leaves allowed');
  await page.fill('#ed-sal', '6,000');
  await page.click('#ed-save');
  await wait(150);
  await tapDays('a', [3, 10, 17]);
  expect((await dp('#itBill')) === 580645, 'house help bill = ₹5,806.45, got ' + (await dp('#itBill')));
  const billText = await txt('#bill');
  expect(billText.includes('₹193.55') && billText.includes('31') && billText.includes('₹5,806.45'), 'per-day rule shown with ÷ 31 = ₹193.55: ' + billText.slice(0, 200));
  expect((await txt('#itRule')) === t('rule_month'), 'the per-day rule text is shown');
  // a holiday you give is not leave; a half day counts ½
  await tapDays('o', [24]);
  expect((await dp('#itBill')) === 580645, 'holiday does not change the bill');
  await tapDays('h', [25]);
  expect((await dp('#itBill')) === 600000 - Math.round(19355 * 1.5), 'half day: 1.5 days cut = 290.33 -> 5,709.67, got ' + (await dp('#itBill')));
  await page.click('#cal .day[data-d="25"]'); await wait();
  expect((await dp('#itBill')) === 580645, 'half day removed again');
  // payments: bad inputs are refused, ₹2,000 advance leaves 3,806.45
  for (const [bad, key] of [['-500', 'err_neg'], ['12.345', 'err_dec'], ['abc', 'err_num'], ['99999999999', 'err_big']]) {
    await page.fill('#inPaid', bad); await wait(40);
    expect((await txt('#paidErr')) === t(key), bad + ' refused with ' + key + ', got ' + (await txt('#paidErr')));
  }
  await page.fill('#inPaid', '2,000'); await wait();
  expect((await txt('#paidErr')) === '' && (await dp('#itBal')) === 380645, 'balance after ₹2,000 = 3,806.45, got ' + (await dp('#itBal')));
  expect((await dp('#totBill')) === 192200 + 580645, 'month total bill 1,922 + 5,806.45 = 7,728.45, got ' + (await dp('#totBill')));
  expect((await dp('#totBal')) === 192200 + 380645, 'month balance 1,922 + 3,806.45 = 5,728.45');

  // 3) rate change from 16 Jan: milk ₹64 -> days 1–15: 15 L × 62 = 930, days 16–31: 16 L × 64 = 1024, total ₹1,954
  const milkId = c[0].id;
  await page.click('#itemChips .mh-chip[data-id="' + milkId + '"]');
  await page.click('#ratesBox summary');
  await page.fill('#rcDate', '2027-01-16');
  await page.fill('#rcRate', '64');
  await page.click('#rcSave'); await wait(120);
  expect((await dp('#itBill')) === 195400, 'milk with mid-month rate change = ₹1,954, got ' + (await dp('#itBill')));

  // 4) February 2027 (28 days): dues carry forward; milk 28 × 64 = 1,792; house help full 6,000
  await page.click('#btnNext'); await wait(120);
  expect((await page.getAttribute('#monthLabel', 'data-days')) === '28', 'February 2027 has 28 days');
  c = await chips();
  const feb = Object.fromEntries(c.map((x) => [x.id, x.p]));
  expect(feb[milkId] === 179200, 'Feb milk 28 × ₹64 = 1,792, got ' + feb[milkId]);
  const rows = await page.$$eval('#sumTable tbody tr', (trs) => trs.map((tr) => Array.from(tr.querySelectorAll('td[data-p]')).map((td) => Number(td.dataset.p))));
  expect(rows.length === 2 && rows[0][1] === 195400 && rows[1][1] === 380645, 'previous dues carried: milk 1,954, house help 3,806.45: ' + JSON.stringify(rows));
  expect((await dp('#totBal')) === 195400 + 179200 + 380645 + 600000, 'Feb balance = 13,551.45, got ' + (await dp('#totBal')));

  // 5) leap year: February 2028 has 29 days; 3 absences with 2 leaves -> 6000 ÷ 29 = ₹206.90 cut
  await goTo('2028-02');
  expect((await page.getAttribute('#monthLabel', 'data-days')) === '29' && (await page.$$eval('#cal .day[data-d]', (b) => b.length)) === 29, 'Feb 2028 has 29 days');
  const maidId = (await chips())[1].id;
  await page.click('#itemChips .mh-chip[data-id="' + maidId + '"]');
  await tapDays('a', [1, 2, 3]);
  expect((await dp('#itBill')) === 600000 - 20690, 'leap Feb cut = 206.90, bill 5,793.10, got ' + (await dp('#itBill')));
  await page.click('#btnResetMarks'); await wait();
  expect((await dp('#itBill')) === 600000, 'reset marks gives the full salary');

  // 6) WhatsApp text for January
  await goTo('2027-01');
  await page.click('#btnShareMonth');
  await page.waitForSelector('#sh-text');
  const share = await page.inputValue('#sh-text');
  expect(share.includes('₹1,954') && share.includes('₹5,806.45') && share.includes('₹193.55'), 'share text has the bills: ' + share.slice(0, 160));
  const href = await page.getAttribute('#sh-wa', 'href');
  expect(href.startsWith('https://wa.me/?text=') && decodeURIComponent(href).includes('₹5,806.45'), 'wa.me link carries the text');
  await page.keyboard.press('Escape'); await wait();
  expect((await page.textContent('#printSum')).includes('₹5,806.45'), 'one-page print summary is filled');

  // 7) CSV of the month: title, header, 2 item rows with 31 day columns
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#btnCsv')]);
  const csv = fs.readFileSync(await dl.path(), 'utf8').replace(/^﻿/, '');
  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  expect(lines.length === 4, 'CSV has 4 lines, got ' + lines.length);
  const milkRow = lines[2].split(',');
  expect(milkRow.length === 2 + 31 + 7 && milkRow[2 + 4] === '1.5' && milkRow[2 + 8] === '0' && milkRow.includes('1954.00'), 'milk CSV row: ' + lines[2].slice(0, 160));
  expect(lines[3].includes('5806.45') && lines[3].includes('3806.45'), 'house help CSV row: ' + lines[3].slice(-80));

  // 8) backup -> reset -> restore brings everything back; a crafted file cannot break the app
  const [bk] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#btnBackup')]);
  const backup = fs.readFileSync(await bk.path(), 'utf8');
  const parsed = JSON.parse(backup);
  expect(parsed.app === 'monthly-hisab' && parsed.data.items.length === 2, 'backup has 2 items');
  await page.click('#btnReset'); await wait(150);
  expect((await chips()).length === 0, 'reset clears everything');
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#btnRestore')]);
  await fc.setFiles(pick(backup, 'backup.json'));
  await wait(400);
  await goTo('2027-01');
  expect((await dp('#totBill')) === 195400 + 580645 && (await dp('#totBal')) === 195400 + 380645, 'restored January totals, got ' + (await dp('#totBill')));
  const evil = JSON.stringify({ app: 'monthly-hisab', data: { items: [{ id: '__proto__', tpl: 'toString', kind: 'staff', plan: [{ from: 'x', pay: 'day' }, { pay: 'month', sal: '1e400' }], rates: [{ from: '', r: -5 }] }, 'junk', null],
    months: { '2027-01': { __proto__: { d: { 99: 5 } } }, bad: {} } } });
  const [fc2] = await Promise.all([page.waitForEvent('filechooser'), page.click('#btnRestore')]);
  await fc2.setFiles(pick(evil, 'evil.json'));
  await wait(300);
  const after = await page.evaluate(() => document.querySelectorAll('#itemChips .mh-chip, #inactive button').length);
  expect(after === 1, 'crafted backup restored safely as one harmless item, got ' + after);
  const [fc3] = await Promise.all([page.waitForEvent('filechooser'), page.click('#btnRestore')]);
  await fc3.setFiles(pick('not json at all', 'x.json'));
  await wait(200);
  log('monthly-hisab flows ok (' + lang + ')');
};
