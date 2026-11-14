/* Interaction test for the Application & Letter Writer (run by tools/verify.js in en and hi).
   Day counts are worked out by hand here, not by the app. */
module.exports = async function ({ page, lang, expect }) {
  const ds = (k) => page.$eval('#letter', (e, k) => e.dataset[k], k);
  const text = () => page.evaluate(() => ALW.text());
  const set = async (sel, v) => { await page.fill(sel, String(v)); await page.waitForTimeout(40); };
  const hidden = (sel) => page.$eval(sel, (e) => e.hidden);

  /* 0) opens with a sample letter in the app language */
  await page.waitForSelector('#letter .lt', { timeout: 10000 });
  expect(await ds('sample') === '1', 'starts in sample mode');
  expect(!(await hidden('#sampleBanner')), 'sample banner is shown');
  expect(await ds('lang') === lang, 'letter language follows the app language at first, got ' + await ds('lang'));
  expect((await page.$$eval('#type option', (o) => o.length)) === 14, '14 letter types');
  expect((await page.$$eval('#letterLang option', (o) => o.length)) === 13, 'same-as-app + 12 letter languages');
  const sample = await text();
  expect(!/[{}]|undefined|__________/.test(sample), 'sample letter has no gaps: ' + sample.slice(0, 80));
  expect(!/\d{10}/.test(sample.replace(/0{6,}/g, '')), 'sample letter has no phone-like number');

  /* 1) typing a detail leaves sample mode; empty details become blank lines, optional lines vanish */
  await page.selectOption('#letterLang', 'en');
  await set('#f_name', 'Ravi Kumar');
  expect(await ds('sample') === '0', 'not a sample after typing');
  expect(await hidden('#sampleBanner'), 'sample banner hidden after typing');
  let tx = await text();
  expect(tx.includes('Ravi Kumar') && !tx.includes('Asha Example'), 'typed name is in the letter, sample name is gone');
  expect(tx.includes('__________') && !(await hidden('#blankNote')), 'empty details show as blank lines with a note');
  expect(!tx.includes('Roll No.'), 'no roll number line when the roll number is empty');
  await set('#f_org', 'Green Valley School');
  await set('#f_city', 'Pune');
  await set('#f_cls', '9-A');
  await set('#f_roll', '27');
  await set('#f_reason', 'fever');
  tx = await text();
  expect(tx.includes('Class 9-A') && tx.includes('Because of fever') && tx.includes('Roll No.: 27'), 'details are placed in the letter');
  expect(tx.startsWith('To,\nThe Principal,\nGreen Valley School,\nPune'), 'address block: ' + tx.slice(0, 60));
  expect(tx.includes('Yours obediently,\nRavi Kumar'), 'student closing and name');

  /* 2) leave period. 1, 2, 3 December = 3 days */
  await set('#f_from', '2026-12-01');
  await set('#f_todate', '2026-12-03');
  expect(await ds('days') === '3', '1 to 3 Dec is 3 days, got ' + await ds('days'));
  expect((await text()).includes('from 1 December 2026 to 3 December 2026 (3 days)'), 'period sentence in English');
  expect(!(await text()).includes('__________') && await hidden('#blankNote'), 'no blanks left once everything is filled');
  /* 27, 28 Feb, 1, 2 March 2027 (not a leap year) = 4 days */
  await set('#f_from', '2027-02-27');
  await set('#f_todate', '2027-03-02');
  expect(await ds('days') === '4', '27 Feb to 2 Mar 2027 is 4 days, got ' + await ds('days'));
  /* 28, 29 Feb, 1 March 2028 (leap year) = 3 days */
  await set('#f_from', '2028-02-28');
  await set('#f_todate', '2028-03-01');
  expect(await ds('days') === '3', '28 Feb to 1 Mar 2028 is 3 days, got ' + await ds('days'));
  /* dates the wrong way round: warning, same 3 days */
  await set('#f_from', '2028-03-01');
  await set('#f_todate', '2028-02-28');
  expect(!(await hidden('#dateWarn')) && await ds('days') === '3', 'swapped dates give a warning and still 3 days');
  expect((await text()).includes('from 28 February 2028 to 1 March 2028'), 'swapped dates are written in order');
  /* one day */
  await set('#f_todate', '2028-03-01');
  expect(await hidden('#dateWarn') && await ds('days') === '1', 'same date = 1 day');
  expect((await text()).includes('on 1 March 2028 (1 day)'), 'one-day wording');

  /* 3) letter language is separate from the app language */
  await page.selectOption('#letterLang', 'ta');
  expect(await ds('lang') === 'ta' && (await page.getAttribute('#letter', 'dir')) === 'ltr', 'Tamil letter');
  tx = await text();
  expect(tx.includes('பெறுநர்') && tx.includes('Ravi Kumar') && tx.includes('2028'), 'Tamil letter keeps the typed details');
  expect((await page.evaluate(() => document.documentElement.lang)) === lang, 'app language did not change');
  await page.selectOption('#letterLang', 'ur');
  expect((await page.getAttribute('#letter', 'dir')) === 'rtl', 'Urdu letter is right-to-left');
  expect((await page.evaluate(() => document.documentElement.dir)) === 'ltr', 'the app itself stays left-to-right');
  expect(!/[٠-٩۰-۹]/.test(await text()), 'Urdu letter uses Western digits');

  /* 4) every letter type in every language builds completely: no leftover {blank}, no "undefined" */
  const bad = await page.evaluate(() => {
    const out = [];
    for (const ty of ALW.types) for (const l of Object.keys(APP_CONTENT)) {
      const s = ALW.preview(ty, l);
      if (/[{}]|undefined|NaN/.test(s) || s.length < 150) out.push(ty + '/' + l);
    }
    return out;
  });
  expect(bad.length === 0, 'broken letters: ' + bad.join(', '));
  expect((await page.evaluate(() => ALW.types.length)) >= 12, 'at least 12 letter types');

  /* 5) bank letter: passbook or ATM card */
  await page.selectOption('#letterLang', 'en');
  await page.selectOption('#type', 'bank_passbook');
  await set('#f_acc', '123456');
  expect((await text()).includes('Request for a new passbook') && (await text()).includes('account number is 123456'), 'passbook letter');
  await page.selectOption('#f_item', 'atm');
  tx = await text();
  expect(tx.includes('Request for a new ATM card') && !tx.includes('passbook'), 'ATM card letter');
  expect(tx.includes('Yours faithfully,\nRavi Kumar\nAccount No.: 123456'), 'bank closing block: ' + tx.slice(-80));

  /* 6) resignation uses its own date; hostile and very long input is shown as plain text */
  await page.selectOption('#type', 'resignation');
  await set('#f_lastday', '2027-01-31');
  await set('#f_desig', '<img src=x onerror=alert(1)>');
  await set('#f_reason', 'x'.repeat(120));
  tx = await text();
  expect(tx.includes('treat 31 January 2027 as my last working day'), 'last working day in the letter');
  expect((await page.$$eval('#letter img', (i) => i.length)) === 0 && tx.includes('<img src=x'), 'typed HTML is not run');
  expect((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 2, 'long words do not widen the page');

  /* 7) print view holds only the letter; download gives a text file */
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  await page.emulateMedia({ media: 'print' });
  const pr = await page.evaluate(() => ({
    paper: !!document.querySelector('#printRoot .alw-paper') && document.querySelector('#printRoot .alw-paper').offsetHeight > 0,
    form: document.querySelector('#formCard').offsetHeight, same: document.querySelector('#printRoot').innerText.includes('31 January 2027')
  }));
  await page.emulateMedia({ media: 'screen' });
  expect(pr.paper && pr.form === 0 && pr.same, 'print shows the letter and hides the form: ' + JSON.stringify(pr));
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#downloadBtn')]);
  expect(dl.suggestedFilename() === 'letter-resignation.txt', 'download name: ' + dl.suggestedFilename());

  /* 8) saved on the device: a reload keeps the letter; clearing brings the sample back */
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#letter .lt', { timeout: 10000 });
  expect((await page.inputValue('#type')) === 'resignation' && (await page.inputValue('#f_name')) === 'Ravi Kumar', 'details kept after reload');
  expect((await text()).includes('31 January 2027'), 'letter kept after reload');
  await page.click('#clearBtn');
  await page.waitForTimeout(100);
  expect(await ds('sample') === '1' && (await page.inputValue('#f_name')) === '', 'clear brings back the sample');
};
