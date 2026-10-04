/* Interaction test, run by tools/verify.js in en and hi. */
module.exports = async function ({ page, lang, expect, log }) {
  // 1) source = UI language, target = Tamil -> greeting card shows Tamil script + Roman transliteration
  await page.selectOption('#target', 'ta');
  await page.waitForTimeout(300);
  const first = await page.textContent('#cards .pb-card:first-child .pb-target');
  expect(/[஀-௿]/.test(first), 'greeting card shows Tamil script, got ' + first);
  const tr = await page.textContent('#cards .pb-card:first-child .pb-tr');
  expect(/^[A-Za-z]/.test(tr.trim()), 'transliteration is in Roman letters, got ' + tr);
  const cards = await page.$$eval('#cards .pb-card', (n) => n.length);
  expect(cards === 12, 'greetings topic has 12 cards, got ' + cards);

  // 2) favourite toggle persists in the stats line
  await page.click('#cards .pb-card:first-child .btn-fav');
  const stats = await page.textContent('#stats');
  expect(stats.includes('1'), 'stats show 1 favourite after starring, got ' + stats);

  // 3) numbers trainer shows 1-10
  await page.click('#tabs [data-tab="practice"]');
  await page.click('#modes [data-mode="numbers"]');
  const nums = await page.$$eval('#num-grid .pb-numcell .d', (n) => n.map((x) => x.textContent.trim()));
  expect(nums.length === 10 && nums[0] === '1' && nums[9] === '10', 'numbers trainer shows 1-10, got ' + nums.join(','));
  const tamilNum = await page.textContent('#num-grid .pb-numcell:first-child bdi');
  expect(/[஀-௿]/.test(tamilNum), 'number words are in Tamil, got ' + tamilNum);

  // 4) match pairs: match every pair -> done message with moves
  await page.click('#modes [data-mode="match"]');
  const ids = await page.$$eval('#match-grid [data-side="l"]', (n) => n.map((x) => x.dataset.id));
  expect(ids.length === 6, '6 pairs on the board');
  for (const id of ids) {
    await page.click(`#match-grid [data-side="l"][data-id="${id}"]`);
    await page.click(`#match-grid [data-side="r"][data-id="${id}"]`);
  }
  const matched = await page.$$eval('#match-grid .matched', (n) => n.length);
  expect(matched === 12, 'all 12 tiles matched, got ' + matched);
  const ms = await page.textContent('#match-status');
  expect(ms.includes('6'), 'match status reports 6 moves, got ' + ms);

  // 5) daily 10: start, flip, answer -> progress advances, finishing sets streak 1
  await page.click('#tabs [data-tab="daily"]');
  await page.click('#daily-start');
  await page.click('#flash');
  await page.click('#knew');
  const prog = await page.textContent('#daily-progress');
  expect(prog.includes('2'), 'daily progress moved to card 2, got ' + prog);
  for (let i = 0; i < 9; i++) { await page.click('#flash'); await page.click('#knew'); }
  const done = await page.$('#daily-done');
  expect(!!done, 'daily 10 completes with a done message');
  const st = await page.textContent('#stats');
  expect(st.includes('1'), 'streak shows 1 day');

  // 6) switching the UI language keeps the chosen target (ta)
  const other = lang === 'en' ? 'hi' : 'en';
  await page.selectOption('#edu-lang', other);
  await page.waitForTimeout(400);
  const tv = await page.inputValue('#target');
  expect(tv === 'ta', 'target stays ta after UI language switch, got ' + tv);
  await page.click('#tabs [data-tab="phrases"]');
  const first2 = await page.textContent('#cards .pb-card:first-child .pb-target');
  expect(/[஀-௿]/.test(first2), 'greeting still Tamil after switch');
  await page.selectOption('#edu-lang', lang);
  await page.waitForTimeout(300);
  // 7) swap: "I speak" and "I want to learn" trade places
  await page.click('#swap');
  await page.waitForTimeout(400);
  const ui2 = await page.inputValue('#edu-lang'), tg2 = await page.inputValue('#target');
  expect(ui2 === 'ta' && tg2 === lang, 'swap gives UI ta and target ' + lang + ', got ' + ui2 + '/' + tg2);
  await page.selectOption('#edu-lang', lang);
  log('phrasebook core workflow ok');
};
