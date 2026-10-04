/* Interaction test for "AI or Not? Sorting Game" (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, lang, expect, log }) {
  const answers = await page.evaluate(() => {
    const m = {};
    window.AIAU.items.forEach(function (i) { m[i.id] = i.ai ? 'ai' : 'no'; });
    return m;
  });
  const ids0 = Object.keys(answers);
  expect(ids0.length >= 24, 'at least 24 cards exist, got ' + ids0.length);
  expect(ids0.filter((id) => answers[id] === 'ai').length === 13, '13 AI cards and 13 non-AI cards');
  const noHScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);

  /* ---------- Class vote mode (projector) ---------- */
  await page.click('#tab-class');
  const firstId = await page.getAttribute('#class-stage', 'data-id');
  expect(!!answers[firstId], 'class stage shows a known card: ' + firstId);
  const right = answers[firstId];
  const wrong = right === 'ai' ? 'no' : 'ai';
  for (let i = 0; i < 3; i++) await page.click('#vote-' + right + '-plus');
  await page.click('#vote-' + wrong + '-plus');
  expect((await page.textContent('#votes-' + right)).trim() === '3', 'majority vote count is 3');
  // Teacher clicked "+" with the mouse, then presses Space: it must reveal, not add a 4th vote.
  await page.keyboard.press(' ');
  expect(await page.isVisible('#class-answer'), 'Space after clicking + reveals the answer');
  expect((await page.textContent('#votes-' + right)).trim() === '3', 'Space did not add another vote');
  const score1 = (await page.textContent('#class-score')).trim();
  expect(/1\D+1/.test(score1), 'class score shows 1 of 1 after a correct majority, got ' + score1);
  expect((await page.textContent('#verdict')).trim().length > 5, 'majority verdict is shown');
  await page.click('#next');
  const secondId = await page.getAttribute('#class-stage', 'data-id');
  expect(secondId && secondId !== firstId, 'next shows a different card');
  expect((await page.textContent('#votes-ai')).trim() === '0', 'votes reset for the next card');
  // Keyboard shortcuts: A / N vote, Space reveals, Space again goes to the next card.
  const a2 = answers[secondId], w2 = a2 === 'ai' ? 'n' : 'a';
  await page.keyboard.press(w2); await page.keyboard.press(w2);
  await page.keyboard.press(a2 === 'ai' ? 'a' : 'n');
  expect((await page.textContent('#votes-' + (a2 === 'ai' ? 'no' : 'ai'))).trim() === '2', 'keyboard votes are counted');
  await page.keyboard.press(' ');
  expect(await page.isVisible('#class-answer'), 'Space reveals the second card');
  const score2 = (await page.textContent('#class-score')).trim();
  const nums2 = (score2.match(/\d+/g) || []).sort().join(',');   // "1 of 2" (en) or "2 में से 1" (hi)
  expect(nums2 === '1,2', 'wrong majority keeps the class score at 1 of 2, got ' + score2);
  await page.keyboard.press(' ');
  expect(/(^|\D)3(\D|$)/.test(await page.textContent('#card-counter')), 'Space moves on to card 3');

  /* ---------- Play: sort a round with exactly 3 mistakes ---------- */
  await page.click('#tab-play');
  const ids = await page.$$eval('#tray .sort-card', (els) => els.map((e) => e.getAttribute('data-id')));
  expect(ids.length === 10, 'round has 10 cards, got ' + ids.length);
  expect(await page.isDisabled('#check'), 'check is disabled before all cards are sorted');
  let n = 0;
  for (const id of ids) {
    const want = answers[id];
    const bin = n < 3 ? (want === 'ai' ? 'no' : 'ai') : want;   // first 3 wrong on purpose
    await page.click('#tray .sort-card[data-id="' + id + '"]');
    await page.click('#bin-' + bin + '-btn');
    n++;
  }
  const left = await page.$$eval('#tray .sort-card', (els) => els.length);
  expect(left === 0, 'tray is empty after sorting, left ' + left);
  const inBins = await page.$$eval('.bin .chip-card', (els) => els.length);
  expect(inBins === 10, 'all 10 cards are in the bins, got ' + inBins);
  // A card picked from a box goes back to the tray when the tray is clicked, then back into its box.
  const back = ids[5];
  await page.click('.bin .chip-card[data-id="' + back + '"]');
  await page.click('#tray-wrap .tray-label');
  expect(await page.$$eval('#tray .sort-card', (els) => els.length) === 1, 'clicking the tray returns the picked card');
  expect(await page.isDisabled('#check'), 'check is disabled again with one card in the tray');
  await page.click('#tray .sort-card[data-id="' + back + '"]');
  await page.click('#bin-' + answers[back] + '-btn');
  await page.click('#check');
  const score = (await page.textContent('#score-num')).trim();
  expect(score === '7', 'score is 7 of 10 after 3 deliberate mistakes, got ' + score);
  const bad = await page.$$eval('#results .res.bad', (els) => els.length);
  expect(bad === 3, 'three wrong answers are explained, got ' + bad);
  const firstThree = await page.$$eval('#results .res', (els) => els.slice(0, 3).map((e) => e.classList.contains('bad')));
  expect(firstThree.every(Boolean), 'wrong answers are listed first');
  const reasons = await page.$$eval('#results .res p', (els) => els.filter((e) => e.textContent.trim().length > 20).length);
  expect(reasons === 10, 'every card shows a reason, got ' + reasons);
  const stars = await page.$$eval('#results .stars .on', (els) => els.length);
  expect(stars === 2, '7/10 earns 2 stars, got ' + stars);
  const best = await page.textContent('#best');
  expect(best.includes('7') && await page.isVisible('#best'), 'best score badge shows 7: ' + best);
  expect(/1/.test(await page.textContent('#rounds')), 'one round counted');

  /* ---------- Language switch on a phone: everything re-renders, nothing scrolls sideways ---------- */
  const vp = page.viewportSize();
  await page.setViewportSize({ width: 360, height: 760 });
  await page.selectOption('#edu-lang', 'ta');
  await page.waitForTimeout(150);
  expect(/[஀-௿]/.test(await page.textContent('#score-text')), 'score text re-rendered in Tamil');
  expect(/[஀-௿]/.test(await page.textContent('#results .res p')), 'reasons re-rendered in Tamil');
  expect((await page.textContent('#score-num')).trim() === '7', 'score kept after language switch');
  // A round full of "Follows fixed rules" cards (the longest Tamil tag) must still fit a 360 px phone.
  await page.evaluate(() => {
    const ids = ['calculator', 'traffic_light', 'microwave', 'alarm_clock', 'tv_remote', 'translate', 'fraud', 'chatbot', 'maps_traffic', 'crop_doctor'];
    const place = {}; ids.forEach((id, i) => { place[id] = i < 5 ? 'ai' : 'no'; });   // all wrong: every badge shows
    localStorage.setItem('edu.ai-around-us.round', JSON.stringify({ ids, place, order: ids.slice(), checked: true }));
  });
  await page.reload();
  await page.waitForSelector('#results .res');
  expect((await page.textContent('#score-num')).trim() === '0', 'a stored checked round survives a reload');
  expect(await noHScroll(), 'no sideways scroll at 360 px in Tamil results');
  await page.click('#tab-cards');
  expect(await page.$$eval('#gallery .g-card', (els) => els.length) === 26, 'gallery shows all 26 cards');
  await page.click('#f-no');
  expect(await page.$$eval('#gallery .g-card', (els) => els.length) === 13, 'No AI filter shows 13 cards');
  expect(await noHScroll(), 'no sideways scroll at 360 px in the Tamil gallery');
  await page.click('#f-all');
  await page.click('#tab-play');
  await page.selectOption('#edu-lang', lang);
  await page.setViewportSize(vp);
  await page.waitForTimeout(150);

  /* ---------- New round gives a fresh, balanced shuffled set ---------- */
  await page.click('#new-round');
  const ids2 = await page.$$eval('#tray .sort-card', (els) => els.map((e) => e.getAttribute('data-id')));
  expect(ids2.length === 10, 'new round has 10 cards');
  const balance = ids2.filter((id) => answers[id] === 'ai').length;
  expect(balance === 5, 'new round has 5 AI and 5 non-AI cards, got ' + balance);
  expect(await page.isHidden('#results'), 'results are hidden in a new round');

  /* Placements survive a reload mid-round. */
  for (const id of ids2.slice(0, 4)) {
    await page.click('#tray .sort-card[data-id="' + id + '"]');
    await page.click('#bin-' + answers[id] + '-btn');
  }
  await page.reload();
  await page.waitForSelector('#tray .sort-card');
  expect(await page.$$eval('.bin .chip-card', (els) => els.length) === 4, 'four placed cards are kept after reload');
  expect(await page.$$eval('#tray .sort-card', (els) => els.length) === 6, 'six cards are still in the tray after reload');

  /* Leave the screen on a checked round for the after-test screenshot. */
  for (const id of ids2.slice(4)) {
    await page.click('#tray .sort-card[data-id="' + id + '"]');
    await page.click('#bin-' + answers[id] + '-btn');
  }
  await page.click('#check');
  expect((await page.textContent('#score-num')).trim() === '10', 'perfect sort scores 10');
  expect(await page.$$eval('#results .stars .on', (els) => els.length) === 3, '10/10 earns 3 stars');
  expect((await page.textContent('#best')).includes('10'), 'best score badge updates to 10');
  await page.evaluate(() => window.scrollTo(0, 0));
  log && log('ai-around-us test done');
};
