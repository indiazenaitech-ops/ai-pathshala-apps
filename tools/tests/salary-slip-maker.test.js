/* Interaction test for the Salary Slip Maker (run by tools/verify.js in en and hi).
   Every figure is checked against maths worked out by hand here, not by the app. */
module.exports = async function ({ page, lang, expect }) {
  const d = (k) => page.$eval('#netPay', (e, k) => Number(e.dataset[k]), k);
  const set = async (sel, v) => { await page.fill(sel, String(v)); await page.waitForTimeout(60); };

  /* 0) sample slip: basic 12,000 + HRA 4,800 + DA 1,200 + conveyance 1,600 + special 400 = gross 20,000
        PF 12% of (12,000 + 1,200) = 1,584; ESI = ceil(0.75% of 20,000) = 150; Maharashtra PT above 10,000 = 200 (not February) */
  await page.waitForSelector('#pages .sheet', { timeout: 10000 });
  await page.selectOption('#month', '9');            // September: 30 days, no February extra
  await set('#year', '2026');
  expect(await d('gross') === 20000, 'sample gross 20,000, got ' + await d('gross'));
  expect(await d('pf') === 1584, 'sample PF 12% of 13,200 = 1,584, got ' + await d('pf'));
  expect(await d('esi') === 150, 'sample ESI 150, got ' + await d('esi'));
  expect(await d('pt') === 200, 'Maharashtra professional tax 200, got ' + await d('pt'));
  expect(await d('value') === 20000 - 1584 - 150 - 200, 'sample net 18,066, got ' + await d('value'));
  expect(!(await page.$eval('#sampleBanner', (e) => e.hidden)), 'sample banner shown while company and employee are empty');
  expect((await page.$$eval('#pages .sheet', (s) => s.length)) === 1, 'one slip in the preview');

  /* 1) the spec case: basic 20,000 + HRA 8,000, PF on, no ceiling -> PF 2,400; gross 28,000 > 21,000 so no ESI; PT 200 -> net 25,400 */
  for (const k of ['da', 'conv', 'special', 'ot', 'bonus']) await set('#e_' + k, '0');
  await set('#e_basic', '20000');
  await set('#e_hra', '8,000');
  await page.uncheck('#pfCap');
  expect(await d('gross') === 28000, 'gross 28,000');
  expect(await d('pf') === 2400, 'PF 2,400, got ' + await d('pf'));
  expect(await d('esi') === 0, 'no ESI above 21,000');
  expect(await d('value') === 25400, 'net 25,400, got ' + await d('value'));
  const wEn = (await page.textContent('#wordsEn')).trim();
  expect(wEn === 'Rupees Twenty Five Thousand Four Hundred Only', 'English words: ' + wEn);
  if (lang === 'hi') expect((await page.textContent('#wordsLocal')).includes('पच्चीस हज़ार चार सौ'), 'Hindi words: ' + await page.textContent('#wordsLocal'));
  expect((await page.textContent('#pages .sh-words')).includes('Twenty Five Thousand Four Hundred'), 'words printed on the slip');
  expect((await page.textContent('#pages .sh-netv')).replace(/\s/g, '').includes('25,400'), 'net printed on the slip');

  /* 2) PF ceiling: 12% of 15,000 = 1,800 */
  await page.check('#pfCap');
  expect(await d('pf') === 1800, 'PF with ceiling 1,800, got ' + await d('pf'));
  await page.uncheck('#pfCap');

  /* 3) LOP proration: 3 of 30 days -> 27/30; basic 18,000, HRA 7,200, PF 2,160 */
  await set('#lop', '3');
  expect(await d('paid') === 27, 'paid days 27');
  expect(await d('gross') === 25200, 'prorated gross 25,200, got ' + await d('gross'));
  expect(await d('pf') === 2160, 'PF on prorated basic 2,160, got ' + await d('pf'));
  /* LOP more than the month: warning, paid days 0, net 0, no crash */
  await set('#lop', '45');
  expect(!(await page.$eval('#lopWarn', (e) => e.hidden)), 'LOP > days warning shown');
  expect(await d('paid') === 0 && await d('gross') === 0 && await d('value') === 0, 'full LOP gives zero pay, got ' + await d('value'));
  await set('#lop', '0');

  /* 4) professional tax follows the state: Karnataka 0 up to 25,000, 200 above; a typed amount wins; the state change restores the table */
  await page.click('#tab-company');
  await page.selectOption('#cState', 'KA');
  expect(await d('pt') === 200, 'Karnataka PT at 28,000 = 200, got ' + await d('pt'));
  await page.click('#tab-slip');
  await set('#e_hra', '4000');                        // gross 24,000
  expect(await d('pt') === 0, 'Karnataka PT at 24,000 = 0, got ' + await d('pt'));
  await set('#pt', '150');
  expect(await d('pt') === 150 && await d('value') === 24000 - 2400 - 150, 'typed PT 150 used, net ' + await d('value'));
  await page.click('#tab-company');
  await page.selectOption('#cState', 'TN');           // half-yearly 1,250 -> 208 a month
  expect(await d('pt') === 208, 'Tamil Nadu PT 1,250 per half year = 208 a month, got ' + await d('pt'));
  await page.selectOption('#cState', 'DL');
  expect(await d('pt') === 0, 'Delhi has no professional tax');
  await page.click('#tab-slip');
  /* February extra in Maharashtra: 300 instead of 200 */
  const feb = await page.evaluate(() => [SSM.ptFor('MH', 28000, 2).amt, SSM.ptFor('MH', 28000, 3).amt, SSM.ptFor('MH', 9000, 5).amt, SSM.ptFor('MH', 7000, 5).amt, SSM.ptFor('KL', 20000, 5).amt, SSM.ptFor('BR', 50000, 5).amt]);
  expect(JSON.stringify(feb) === JSON.stringify([300, 200, 175, 0, 167, 167]), 'PT table: ' + JSON.stringify(feb));

  /* 5) zero deductions: everything off -> net = gross, slip shows one "none" row */
  await page.uncheck('#pfOn');
  await page.uncheck('#esiOn');
  expect(await d('ded') === 0 && await d('value') === 24000, 'no deductions -> net = gross 24,000, got ' + await d('value'));
  expect((await page.$$eval('#pages .sh-pay tbody tr', (r) => r.length)) >= 2, 'slip still lists the earnings rows');
  await page.check('#pfOn');
  await page.check('#esiOn');

  /* 6) ESI rounds UP: basic 10,000 + HRA 4,001 = 14,001 -> 0.75% = 105.0075 -> 106 */
  await set('#e_basic', '10000');
  await set('#e_hra', '4001');
  expect(await d('esi') === 106, 'ESI rounded up to 106, got ' + await d('esi'));

  /* 7) lakh words + a custom deduction + negative net warning */
  await set('#e_basic', '100000');
  await set('#e_hra', '18000');
  await set('#pt', '');
  expect((await page.textContent('#wordsEn')).startsWith('Rupees One Lakh'), 'lakh in words: ' + await page.textContent('#wordsEn'));
  await page.click('#addDed');
  const xd = await page.$$('#xDed input[type=text]');
  await xd[0].fill('Canteen');
  await xd[1].fill('500000');
  await page.waitForTimeout(80);
  expect(await d('value') < 0 && !(await page.$eval('#netNeg', (e) => e.hidden)), 'deductions above earnings show the warning');
  await page.click('#xDed .del');
  await page.waitForTimeout(60);
  expect(await d('ded') === 12000, 'custom row removed; PF 12,000 remains (12% of 1,00,000), got ' + await d('ded'));

  /* 8) a very long name does not break the slip */
  await set('#eName', 'Venkatanarasimharajuvaripeta Subrahmanyam Chakravarthy Ramanujan');
  expect((await page.textContent('#pages .sh-emp')).includes('Venkatanarasimharajuvaripeta'), 'long name rendered');
  expect(await page.$eval('#sampleBanner', (e) => e.hidden), 'typing a name hides the sample banner');

  /* 9) save employee, reload from the list */
  await set('#eId', 'EMP-777');
  await page.click('#empSave');
  const opts = await page.$$eval('#empPick option', (o) => o.map((x) => x.textContent));
  expect(opts.some((o) => o.includes('EMP-777')), 'saved employee appears in the list: ' + opts.join(' | '));
  await set('#eName', 'Someone Else');
  await page.selectOption('#empPick', { index: 1 });
  await page.waitForTimeout(80);
  expect((await page.inputValue('#eName')).startsWith('Venkata'), 'loading the saved employee restores the name');
  expect(await d('gross') === 118000, 'loading restores the pay structure, got ' + await d('gross'));

  /* 10) templates and WhatsApp text */
  await page.click('[data-tpl="bi"]');
  expect((await page.$$eval('#pages .sheet .lc', (n) => n.length)) > 5, 'bilingual slip has second-language labels');
  await page.click('[data-tpl="simple"]');
  expect(await page.$('#pages .sheet.tpl-simple') !== null, 'simple template applied');
  await page.click('[data-paper="A5"]');
  expect(await page.$('#pages.a5') !== null, 'A5 preview');
  await page.click('[data-paper="A4"]');
  const wa = decodeURIComponent(await page.getAttribute('#waBtn', 'href'));
  expect(wa.startsWith('https://wa.me/?text=') && /1,0[0-9],[0-9]{3}/.test(wa) && !wa.includes('EMP-777') && !wa.includes('4821'), 'WhatsApp text has the amount, no ID or bank digits: ' + wa);

  /* 11) print: window.print stubbed; print root gets one sheet, page size follows the paper */
  await page.evaluate(() => { window.print = () => { window.__printed = (window.__printed || 0) + 1; }; });
  await page.click('#printBtn');
  expect(await page.evaluate(() => window.__printed === 1), 'print called once');
  expect((await page.$$eval('#printRoot .sheet', (s) => s.length)) === 1, 'one sheet in the print root');
  expect((await page.textContent('#pageStyle')).includes('A4'), '@page size A4');

  /* 12) batch: 3 CSV rows -> 3 slips; first row checked by hand (Sept 2026, 30 days, Delhi so PT 0, pf yes esi no):
        basic 15,000 + hra 6,000 + da 1,500 + conv 1,600 + special 900 = 25,000; PF 12% of 16,500 = 1,980; net 23,020 */
  await page.click('#tab-batch');
  await page.fill('#csvText', 'name,id,basic,hra,da,conveyance,special,lop,pf,esi\nAmit Kumar,E1,15000,6000,1500,1600,900,0,yes,no\nSunita Devi,E2,10000,4000,1000,1600,400,2,yes,yes\nMohammed Irfan,E3,25000,10000,2500,1600,5900,0,yes,no\n');
  await page.click('#batchMake');
  await page.waitForTimeout(150);
  expect((await page.$$eval('#batchPages .sheet', (s) => s.length)) === 3, '3 slips from 3 CSV rows');
  const first = await page.$eval('#batchPages .sheet', (s) => s.querySelector('.sh-netv').textContent.replace(/\s/g, ''));
  expect(first.includes('23,020'), 'first batch slip net 23,020, got ' + first);
  /* second row: 2 LOP days of 30 -> 28/30: basic 9,333 + hra 3,733 + da 933 + conv 1,493 + special 373 = 15,865; PF 12% of 10,266 = 1,232; ESI ceil(118.99) = 119; net 14,514 */
  const second = await page.$$eval('#batchPages .sheet', (s) => s[1].querySelector('.sh-netv').textContent.replace(/\s/g, ''));
  expect(second.includes('14,514'), 'second batch slip (LOP 2, ESI) net 14,514, got ' + second);
  await page.click('#batchPrint');
  expect((await page.$$eval('#printRoot .sheet', (s) => s.length)) === 3 && await page.evaluate(() => window.__printed === 2), 'print all prints 3 sheets');
  /* bad CSV: header without basic -> friendly message, no crash */
  await page.fill('#csvText', 'name,salary\nX,100\n');
  await page.click('#batchMake');
  expect((await page.textContent('#batchMsg')).trim().length > 0 && (await page.$eval('#batchCard', (e) => e.hidden)), 'CSV without basic is refused with a message');

  /* 13) nothing scrolls sideways at phone width even with the long name */
  await page.setViewportSize({ width: 390, height: 844 });
  await page.click('#tab-slip');
  await page.waitForTimeout(200);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(over <= 2, 'no horizontal overflow at 390px, got ' + over);
  await page.setViewportSize({ width: 1280, height: 800 });
};
