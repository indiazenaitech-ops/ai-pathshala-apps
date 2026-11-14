/* Interaction test for the Cash Counter (run by tools/verify.js in en and hi). All expected amounts are hand-worked. */
module.exports = async function ({ page, lang, expect, t }) {
  const settle = () => page.waitForTimeout(120);
  const txt = async sel => (await page.textContent(sel)).trim();
  const data = (sel, k) => page.$eval(sel, (e, k2) => e.dataset[k2], k);
  const total = () => data('#grand', 'total');
  const count = async (id, v) => { await page.fill('.den[data-id="' + id + '"] .den-in', v); await settle(); };
  const val = id => page.inputValue('.den[data-id="' + id + '"] .den-in');

  // 1. opens empty but explained, with the default Indian notes and coins (no ₹2000)
  await page.waitForSelector('#denList .den');
  const ids = await page.$$eval('#denList .den', els => els.map(e => e.dataset.id).join(','));
  expect(ids === 'n500,n200,n100,n50,n20,n10,c20,c10,c5,c2,c1', 'default denominations, got ' + ids);
  expect(await total() === '0' && await page.isVisible('#emptyHelp') && await txt('#grandWords') === '', 'starts empty with the help note');

  // 2. typing and + / −: 3 × 500 + 2 × 100 + 4 × 5 = 1720
  await count('n500', '3');
  await page.click('.den[data-id="n100"] .den-plus'); await page.click('.den[data-id="n100"] .den-plus');
  await count('c5', '4');
  expect(await total() === '1720', '3×500 + 2×100 + 4×5 = 1720, got ' + await total());
  expect(await data('.den[data-id="n500"] .den-total', 'amt') === '1500', 'line total 3 × 500 = 1500');
  expect(await data('#nNotes', 'n') === '5' && await data('#nCoins', 'n') === '4', '5 notes and 4 coins');
  expect(!(await page.isVisible('#emptyHelp')), 'help note hides once cash is counted');
  await page.click('.den[data-id="n100"] .den-minus'); await settle();
  expect(await total() === '1620' && await val('n100') === '1', 'minus takes one ₹100 away: 1620');
  await page.click('.den[data-id="n200"] .den-minus'); await settle();
  expect(await total() === '1620' && await val('n200') === '', 'minus never goes below zero');
  const w = await page.evaluate(() => window.CASH_WORDS.say(1620, EDU.lang));
  expect(await txt('#grandWords') === t('words_rs', { w }), 'amount in words: ' + await txt('#grandWords'));
  if (lang === 'en') expect(await txt('#grandWords') === 'Rupees One Thousand Six Hundred Twenty Only', 'English words for 1620');
  if (lang === 'hi') expect(await txt('#grandWords') === 'रुपये एक हज़ार छह सौ बीस मात्र', 'Hindi words for 1620: ' + await txt('#grandWords'));

  // 3. bad input never breaks the total
  await count('n20', '-5'); expect(await val('n20') === '' && await total() === '1620', 'negative count is refused');
  await count('n20', '2.7'); expect(await val('n20') === '2' && await total() === '1660', 'decimals are cut to the whole part');
  await count('n20', 'abc'); expect(await val('n20') === '' && await total() === '1620', 'letters are refused');
  await count('n20', '12345678'); expect(await val('n20') === '123456' && await total() === String(1620 + 123456 * 20), 'huge count is capped at 6 digits');
  await count('n20', '');

  // 4. expected amount: excess, short, exact, bad
  await page.fill('#expected', '1600'); await settle();
  expect(await data('#diff', 'diff') === '2000' && await txt('#diff') === t('diff_excess', { amt: '₹20' }), 'excess by ₹20: ' + await txt('#diff'));
  await page.fill('#expected', '2000.50'); await settle();
  expect(await data('#diff', 'diff') === '-38050', 'short by ₹380.50');
  await page.fill('#expected', '1,620'); await settle();
  expect(await data('#diff', 'diff') === '0' && await txt('#diff') === t('diff_match'), 'exact match (commas allowed)');
  await page.fill('#expected', '-5'); await settle();
  expect(await txt('#expErr') === t('err_amount') && await txt('#diff') === '', 'negative expected amount is refused');
  await page.fill('#expected', ''); await settle();

  // 5. another denomination: ₹2000 note
  await page.click('#addDen summary');
  await page.fill('#newVal', '2000'); await page.click('#btnAddDen'); await settle();
  expect(await page.$('.den[data-id="n2000"]') !== null, '₹2000 row added');
  await count('n2000', '2');
  expect(await total() === '5620', '1620 + 2 × 2000 = 5620');
  await page.fill('#newVal', '2000'); await page.click('#btnAddDen'); await settle();
  expect(await txt('#denErr') === t('err_denom'), 'duplicate denomination is refused');
  for (const bad of ['0', '500', '2.5', '-10', 'x']) {
    await page.fill('#newVal', bad); await page.click('#btnAddDen'); await settle();
    expect(await txt('#denErr') === t('err_denom'), 'bad denomination "' + bad + '" is refused');
  }
  await page.fill('#newVal', '');
  await page.click('.den[data-id="n2000"] .den-rm'); await settle();
  expect(await page.$('.den[data-id="n2000"]') === null && await total() === '1620', 'removing ₹2000 takes its amount away');

  // 6. one-tap example: notes 3000+800+1200+350+200+150 = 5700 (54 notes), coins 80+55+18+6 = 159 (34 coins) -> 5859; expected 5900 -> short 41
  await page.click('#btnClear'); await settle();
  expect(await total() === '0' && await page.isVisible('#emptyHelp'), 'clear empties the counts');
  await page.click('#btnSample'); await settle();
  expect(await total() === '5859', 'example total 5859, got ' + await total());
  expect(await data('#nNotes', 'n') === '54' && await data('#nCoins', 'n') === '34', 'example has 54 notes and 34 coins');
  expect(await data('#diff', 'diff') === '-4100' && await txt('#diff') === t('diff_short', { amt: '₹41' }), 'example is short by ₹41');
  expect(await page.inputValue('#by') === t('s_by'), 'example fills counted-by');
  expect((await page.$$('#slip tbody tr')).length === 10, 'slip lists the 10 denominations counted');
  const slip = await page.evaluate(() => window.CASH.slipText());
  expect(slip.includes(t('slip_title')) && slip.includes('5,859') && slip.includes(t('s_by')) && slip.includes(t('diff_short', { amt: '₹41' })), 'share text has title, total, name and difference');

  // 7. history + CSV
  await page.click('#btnSave'); await settle();
  await page.click('#tabHistory'); await settle();
  expect((await page.$$('#histList .h-item')).length === 1 && await data('#histList .h-item', 'total') === '5859', 'saved to history');
  const csv = await page.evaluate(() => window.CASH.historyCsv());
  const line = csv.split(/\r?\n/)[1] || '';
  expect(line.includes(',5859,5900,-41,54,34,') && line.includes('500x6; 200x4; 100x12; 50x7; 20x10; 10x15; 10cx8; 5cx11; 2cx9; 1cx6'), 'CSV row: ' + line);

  // 8. change to return
  await page.click('#tabChange'); await settle();
  expect(await txt('#chEmpty') === t('ch_empty'), 'change tab explains itself when empty');
  const breakup = () => page.$$eval('#chList li', els => els.map(e => e.dataset.k + e.dataset.v + 'x' + e.dataset.n).join(' '));
  await page.fill('#due', '347'); await page.fill('#given', '500'); await settle();
  expect(await data('#chAmt', 'change') === '15300', '500 − 347 = 153');
  expect(await breakup() === 'n100x1 n50x1 c2x1 c1x1' && await data('#chPieces', 'n') === '4', '153 = 100 + 50 + 2 + 1, got ' + await breakup());
  await page.fill('#due', '347.50'); await settle();
  expect(await data('#chAmt', 'change') === '15250' && await breakup() === 'n100x1 n50x1 c2x1', '152.50 -> 100 + 50 + 2 and 50 paise over');
  expect(await txt('#chPaise') === t('ch_paise', { amt: '₹0.50' }), 'paise note: ' + await txt('#chPaise'));
  await page.click('#givenChips .chip[data-v="2000"]'); await settle();
  expect(await page.inputValue('#given') === '2000' && await data('#chAmt', 'change') === '165250', '2000 − 347.50 = 1652.50');
  expect(await breakup() === 'n500x3 n100x1 n50x1 c2x1' && await data('#chPieces', 'n') === '6', '1652 = 3×500 + 100 + 50 + 2');
  await page.fill('#given', '300'); await settle();
  expect(await txt('#chInfo') === t('ch_less', { amt: '₹47.50' }) && !(await page.isVisible('#chBody')), 'less than the bill: ' + await txt('#chInfo'));
  await page.fill('#given', '347.5'); await settle();
  expect(await txt('#chInfo') === t('ch_exact'), 'exact amount');
  await page.fill('#given', '-20'); await settle();
  expect(await txt('#chErr') === t('err_amount'), 'negative amount is refused');
  await page.fill('#given', '99999999999999'); await settle();
  expect(await txt('#chErr') === t('err_amount'), 'absurdly large amount is refused');
  await page.fill('#given', '500'); await settle();

  // 9. everything survives a reload; history entries can be deleted
  await page.reload(); await page.waitForSelector('#denList .den', { state: 'attached' }); await page.waitForTimeout(400);
  expect(await total() === '5859' && await page.inputValue('#due') === '347.50', 'counts and change inputs survive a reload');
  expect(await page.$eval('#tabChange', e => e.getAttribute('aria-selected')) === 'true', 'open tab is remembered');
  await page.click('#tabHistory'); await settle();
  expect((await page.$$('#histList .h-item')).length === 1, 'history survives a reload');
  await page.click('#histList .h-del'); await settle();
  expect((await page.$$('#histList .h-item')).length === 0 && await txt('#histEmpty') === t('hist_empty'), 'history entry deleted');
  await page.click('#tabCount'); await settle();
};
