/* Interaction test for AI Ethics Discussion Cards (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, lang, expect, t, log }) {
  const count = async (k) => (await page.textContent(`#opts .opt:nth-child(${k}) .vcount`)).trim();
  const counts = async () => page.$$eval('#opts .vcount', (e) => e.map((x) => x.textContent.trim()).join(','));
  const width = async (k) => page.$eval(`#opts .opt:nth-child(${k}) .bar > span`, (s) => s.style.width);
  /* is the control really tappable (not covered by another element, e.g. a tall Nastaliq title)? */
  const tappable = async (sel) => page.$eval(sel, (e) => {
    const r = e.getBoundingClientRect();
    const h = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return !!h && (h === e || e.contains(h));
  });
  const overlap = async (a, b) => page.evaluate(([a, b]) => {
    const r1 = document.querySelector(a).getBoundingClientRect(), r2 = document.querySelector(b).getBoundingClientRect();
    return r1.right > r2.left && r1.left < r2.right && r1.bottom > r2.top && r1.top < r2.bottom;
  }, [a, b]);

  // 1) starts on card 1; Next moves to card 2 and shows that card's localized story
  expect((await page.inputValue('#jump')) === '0', 'starts on card 1');
  await page.click('#nextBtn');
  expect((await page.inputValue('#jump')) === '1', 'Next should select card 2');
  const want = await page.evaluate((L) => window.APP_CONTENT[L].cards[1], lang);
  expect((await page.textContent('#sceneTitle')).trim() === want.title, 'card 2 title shown in ' + lang);
  expect((await page.textContent('#story')).trim() === want.story, 'card 2 story shown in ' + lang);
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
  expect(await page.$eval('#opts .opt:nth-child(1)', (e) => e.classList.contains('lead')), 'leading option is highlighted');

  // minus button and keyboard shortcut ("2" adds to option 2) -> tie 2 : 2
  await page.click('#opts .opt:nth-child(1) .minus');
  await page.focus('#nextBtn');
  await page.keyboard.press('2');
  expect((await count(1)) === '2' && (await count(2)) === '2', 'after minus and key "2" both options have 2 votes');
  sum = (await page.textContent('#voteSum')).trim();
  expect(sum.includes(t('tie', { list: '1, 2' })), 'summary reports a tie: ' + sum);
  // Shift+digit removes a vote; a vote can never go below 0
  await page.keyboard.press('Shift+2');
  await page.keyboard.press('Shift+4');
  expect((await counts()) === '2,1,0,0,0', 'Shift+2 removes one vote, Shift+4 stays at 0: ' + (await counts()));
  await page.keyboard.press('2');

  // 3) reveal things to consider -> card counts as discussed
  expect(await page.isHidden('#considerList'), 'things to consider hidden at first');
  await page.click('#revealBtn');
  expect(await page.isVisible('#considerList'), 'things to consider revealed');
  expect((await page.$$('#considerList li')).length === 3, 'three points to consider');
  expect((await page.textContent('#progText')).trim() === t('progress_n', { n: '1', total: '12' }), 'progress shows 1 of 12 discussed');
  expect((await page.getAttribute('#discussedBtn', 'aria-pressed')) === 'true', 'discussed toggle is on');
  expect((await page.textContent('#discussedLabel')).trim() === t('discussed'), 'toggle label says "discussed"');

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
  expect((await page.textContent('#timerStartLabel')).trim() === t('resume'), 'paused timer offers Resume');

  // 5) principle filter: 5 cards are about privacy
  await page.click('#filters [data-f="privacy"]');
  expect((await page.$$('#tiles .tile')).length === 5, 'privacy filter shows 5 cards');
  await page.click('#filters [data-f="all"]');
  expect((await page.$$('#tiles .tile')).length === 12, 'all filter shows 12 cards');
  expect((await page.textContent('#tiles .tile[data-i="1"]')).includes(t('votes_n', { n: '4' })), 'tile of card 2 shows its 4 votes');

  // 6) random card never repeats the current card and skips discussed ones
  await page.click('#randomBtn');
  const r = await page.inputValue('#jump');
  expect(r !== '1', 'random card moved away from the discussed card 2');

  // 6b) the manual "mark as discussed" toggle: its label must change, so the button is not ambiguous
  const sameLabel = await page.evaluate(() => Object.keys(window.APP_STRINGS).filter((L) => window.APP_STRINGS[L].mark_discussed === window.APP_STRINGS[L].discussed));
  expect(!sameLabel.length, '"mark as discussed" and "discussed" must differ in every language, same in: ' + sameLabel.join(','));
  expect((await page.textContent('#discussedLabel')).trim() === t('mark_discussed'), 'new card offers "mark as discussed"');
  await page.click('#discussedBtn');
  expect((await page.textContent('#progText')).trim() === t('progress_n', { n: '2', total: '12' }), 'manual toggle counts the card: 2 of 12');
  await page.click('#discussedBtn');
  expect((await page.textContent('#progText')).trim() === t('progress_n', { n: '1', total: '12' }), 'toggle off again: 1 of 12');

  // 7) printing: current card by default; dialog can print all 12 with teacher notes and ground rules
  expect((await page.$$('#printArea .pcard')).length === 1, 'print area holds the current card');
  await page.evaluate(() => { window.print = () => { window.__printed = document.querySelectorAll('#printArea .pcard').length; }; });
  await page.click('#printBtn');
  await page.click('#printScope-all');
  await page.check('#printTeacher');
  await page.click('#printGo');
  await page.waitForTimeout(250);
  expect((await page.evaluate(() => window.__printed)) === 12, 'printing "all" sends 12 cards to the printer');
  expect((await page.$$('#printArea .pc-consider')).length === 12, 'teacher copy adds "things to consider" to every card');
  expect((await page.$$('#printArea .p-head .p-rules li')).length === 4, 'all-cards print starts with the 4 ground rules');
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  expect((await page.$$('#printArea .pcard')).length === 1, 'after printing the print area is back to the current card');

  // 8) present mode: the exit button never covers the toolbar, also with long labels (Malayalam)
  await page.click('#presentBtn');
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => document.documentElement.classList.contains('presenting')), 'present mode on');
  expect(await page.isVisible('#exitPresentBtn'), 'exit button shown');
  expect(!(await overlap('#exitPresentBtn', '#randomBtn')) && (await tappable('#randomBtn')), 'exit button does not cover Random card');
  await page.evaluate(() => EDU.setLang('ml'));
  await page.waitForTimeout(200);
  for (const sel of ['#randomBtn', '#nextBtn', '#exitPresentBtn']) expect(await tappable(sel), 'present mode (ml): ' + sel + ' can be tapped');
  await page.click('#exitPresentBtn');
  await page.waitForTimeout(300);
  expect(!(await page.evaluate(() => document.documentElement.classList.contains('presenting'))), 'exit leaves present mode');

  // 9) Urdu (RTL): the big Nastaliq title must not swallow taps on "Read aloud"
  await page.evaluate(() => EDU.setLang('ur'));
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => document.documentElement.dir === 'rtl'), 'Urdu is right-to-left');
  expect(await tappable('#readBtn'), 'Read aloud can be tapped in Urdu');
  await page.evaluate((L) => EDU.setLang(L), lang);
  await page.waitForTimeout(300);
  expect((await page.textContent('#discussedLabel')).trim() === t('mark_discussed'), 'labels re-rendered after switching back to ' + lang);

  // 10) everything survives a reload
  await page.reload();
  await page.waitForTimeout(800);
  expect((await page.inputValue('#jump')) === r, 'current card remembered');
  expect((await page.textContent('#timerDisplay')).trim() === '02:00', 'timer choice (2 min) remembered');
  await page.click('#tiles .tile[data-i="1"]');
  await page.waitForTimeout(300);
  expect((await count(1)) === '2' && (await count(2)) === '2', 'votes for card 2 were saved');
  expect(await page.isVisible('#considerList'), 'revealed state saved');

  // 11) Reset clears votes and progress (the confirm dialog is accepted by the runner)
  await page.click('#resetBtn');
  await page.waitForTimeout(200);
  expect((await page.inputValue('#jump')) === '0', 'reset goes back to card 1');
  expect((await page.textContent('#progText')).trim() === t('progress_n', { n: '0', total: '12' }), 'reset clears progress');
  await page.click('#nextBtn');
  expect((await counts()) === '0,0,0,0,0', 'reset clears votes: ' + (await counts()));
  await page.click('#prevBtn');
  // leave a realistic state for the after-test screenshot
  for (let i = 0; i < 4; i++) await page.click('#opts .opt:nth-child(4) .plus');
  for (let i = 0; i < 2; i++) await page.click('#opts .opt:nth-child(3) .plus');
  await page.click('#revealBtn');
  await page.evaluate(() => window.scrollTo(0, 0));
  log('votes, Shift-remove, reveal, discussed toggle, timer, filter, random, print all + teacher, present mode, Urdu tap target, persistence and reset OK');
};
