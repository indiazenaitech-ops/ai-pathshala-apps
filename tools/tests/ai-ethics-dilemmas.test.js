/* Interaction test for AI Ethics Discussion Cards (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, lang, expect, t, log }) {
  const count = async (k) => (await page.textContent(`#opts .opt:nth-child(${k}) .vcount`)).trim();
  const width = async (k) => page.$eval(`#opts .opt:nth-child(${k}) .bar > span`, (s) => s.style.width);

  // 1) starts on card 1; Next moves to card 2 and shows that card's localized story
  expect((await page.inputValue('#jump')) === '0', 'starts on card 1');
  await page.click('#nextBtn');
  expect((await page.inputValue('#jump')) === '1', 'Next should select card 2');
  const want = await page.evaluate((L) => window.APP_CONTENT[L].cards[1], lang);
  expect((await page.textContent('#sceneTitle')).trim() === want.title, 'card 2 title shown in ' + lang);
  expect((await page.$$('#opts .opt')).length === want.options.length + 1, 'all options plus "another idea" are listed');
  expect((await page.$$('#questions li')).length === 3, 'three discussion questions');

  // 2) class vote: 3 votes for option 1, 1 vote for option 2 -> 75% / 25%
  for (let i = 0; i < 3; i++) await page.click('#opts .opt:nth-child(1) .plus');
  await page.click('#opts .opt:nth-child(2) .plus');
  expect((await count(1)) === '3' && (await count(2)) === '1', 'vote counters 3 and 1, got ' + (await count(1)) + '/' + (await count(2)));
  expect((await width(1)) === '75%', 'bar for option 1 is 75%, got ' + (await width(1)));
  expect((await width(2)) === '25%', 'bar for option 2 is 25%');
  let sum = (await page.textContent('#voteSum')).trim();
  expect(sum.includes(t('total_votes', { n: '4' })) && sum.includes(t('most_chosen', { n: '1' })), 'summary shows total 4 and option 1 leading: ' + sum);

  // minus button and keyboard shortcut ("2" adds to option 2) -> tie 2 : 2
  await page.click('#opts .opt:nth-child(1) .minus');
  await page.focus('#nextBtn');
  await page.keyboard.press('2');
  expect((await count(1)) === '2' && (await count(2)) === '2', 'after minus and key "2" both options have 2 votes');
  sum = (await page.textContent('#voteSum')).trim();
  expect(sum.includes(t('tie', { list: '1, 2' })), 'summary reports a tie: ' + sum);

  // 3) reveal things to consider -> card counts as discussed
  expect(await page.isHidden('#considerList'), 'things to consider hidden at first');
  await page.click('#revealBtn');
  expect(await page.isVisible('#considerList'), 'things to consider revealed');
  expect((await page.$$('#considerList li')).length === 3, 'three points to consider');
  expect((await page.textContent('#progText')).trim() === t('progress_n', { n: '1', total: '12' }), 'progress shows 1 of 12 discussed');
  expect((await page.getAttribute('#discussedBtn', 'aria-pressed')) === 'true', 'discussed toggle is on');

  // 4) group timer: choose 2 minutes, start, it counts down, pause
  await page.click('#timerSeg [data-min="2"]');
  expect((await page.textContent('#timerDisplay')).trim() === '02:00', 'timer set to 02:00');
  await page.click('#timerStart');
  await page.waitForTimeout(1500);
  const shown = (await page.textContent('#timerDisplay')).trim();
  expect(shown === '01:59' || shown === '01:58', 'timer counts down, shows ' + shown);
  await page.click('#timerStart');
  const paused = (await page.textContent('#timerDisplay')).trim();
  await page.waitForTimeout(1200);
  expect((await page.textContent('#timerDisplay')).trim() === paused, 'pause stops the timer');

  // 5) principle filter: 5 cards are about privacy
  await page.click('#filters [data-f="privacy"]');
  expect((await page.$$('#tiles .tile')).length === 5, 'privacy filter shows 5 cards');
  await page.click('#filters [data-f="all"]');
  expect((await page.$$('#tiles .tile')).length === 12, 'all filter shows 12 cards');

  // 6) random card never repeats the current card and skips discussed ones
  await page.click('#randomBtn');
  const r = await page.inputValue('#jump');
  expect(r !== '1', 'random card moved away from the discussed card 2');

  // 7) printable card for the current card
  expect((await page.$$('#printArea .pcard')).length === 1, 'print area holds the current card');

  // 8) everything survives a reload
  await page.reload();
  await page.waitForTimeout(800);
  expect((await page.inputValue('#jump')) === r, 'current card remembered');
  await page.click('#tiles .tile[data-i="1"]');
  await page.waitForTimeout(300);
  expect((await count(1)) === '2' && (await count(2)) === '2', 'votes for card 2 were saved');
  expect(await page.isVisible('#considerList'), 'revealed state saved');
  log('votes, reveal, timer, filter, random, print area and persistence OK');
};
