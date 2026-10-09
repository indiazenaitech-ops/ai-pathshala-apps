/* Daily English Words: interaction test (run by tools/verify.js in en and hi).
   1) Day 1 opens with 10 word cards.  2) MCQ practice: 3 correct answers → score 3.
   3) "I have learnt these" → 10 words due → review: "Again" keeps the word due today (iv 0). */
module.exports = async function ({ page, expect, t, log }) {
  const SLUG = 'daily-english-words';
  const store = (k) => page.evaluate((key) => EDU.store('daily-english-words').get(key, null), k);

  /* ---- 1. today's list ---- */
  const cards = await page.$$('#wordList .dew-word');
  expect(cards.length === 10, 'Day 1 shows 10 word cards, got ' + cards.length);
  const day = await page.textContent('#dayBadge');
  expect(day.trim() === t('day_n', { n: '1' }), 'day badge says Day 1, got "' + day + '"');
  const firstWord = await page.getAttribute('#wordList .dew-word', 'data-w');
  expect(firstWord === 'hello', 'first word of day 1 is "hello", got ' + firstWord);
  const meaning = (await page.textContent('#wordList .dew-word .dew-m')).trim();
  expect(meaning.length > 2, 'meaning is shown for the first word');
  const title = (await page.textContent('#listTitle')).trim();
  expect(title.length > 0, 'list title is shown');

  /* ---- 2. MCQ practice: answer 3 questions correctly ---- */
  await page.click('#tab-practice');
  await page.click('#modeSeg button[data-v="mcq"]');
  await page.click('#poolSeg button[data-v="list"]');
  await page.click('#startPractice');
  await page.waitForSelector('#pracRun:not([hidden])');
  for (let i = 0; i < 3; i++) {
    const want = await page.getAttribute('#pracPrompt', 'data-w');
    expect(!!want, 'prompt carries the word id');
    const opts = await page.$$('#pracOptions button');
    expect(opts.length === 4, 'four options are offered, got ' + opts.length);
    await page.click('#pracOptions button[data-w="' + want + '"]');
    const fb = (await page.textContent('#pracFeedback')).trim();
    expect(fb.indexOf(t('correct')) >= 0, 'feedback says correct, got "' + fb + '"');
    await page.click('#pracNext');
  }
  const score = (await page.textContent('#pracScore')).trim();
  expect(/3/.test(score), 'score shows 3 after three correct answers, got "' + score + '"');
  const count = (await page.textContent('#pracCount')).trim();
  expect(count === t('q_of', { n: '4', total: '10' }), 'now on question 4 of 10, got "' + count + '"');
  await page.click('#pracEnd');
  await page.waitForSelector('#pracResult:not([hidden])');
  const final = (await page.textContent('#pracFinal')).trim();
  expect(final.replace(/\s/g, '') === '3/3', 'final score 3 / 3, got "' + final + '"');
  /* correct answers were new words → they entered the queue for tomorrow */
  const srs1 = await store('srs');
  expect(srs1 && Object.keys(srs1).length === 3, '3 words entered the spaced repetition store');

  /* ---- 3. mark the list learned → review → "again" keeps the word due today ---- */
  await page.click('#tab-learn');
  await page.click('#markLearned');
  const due = (await page.textContent('#statDue')).trim();
  expect(due === '7', '7 words due after marking the list learned (3 practised correctly are due tomorrow) — got ' + due);
  const srs2 = await store('srs');
  expect(Object.keys(srs2).length === 10, 'all 10 words of the list are in the store');
  await page.click('#tab-review');
  await page.click('#startReview');
  await page.waitForSelector('#revRun:not([hidden])');
  const w = await page.getAttribute('#revCard', 'data-w');
  expect(!!w, 'review card shows a word');
  const rateHidden = await page.getAttribute('#revRate', 'hidden');
  expect(rateHidden !== null, 'rating buttons hidden before the answer is shown');
  await page.click('#revShow');
  await page.waitForSelector('#revRate:not([hidden])');
  await page.click('#rateAgain');
  const today = await page.evaluate(() => { var d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); });
  const srs3 = await store('srs');
  expect(srs3[w] && srs3[w].due === today && srs3[w].iv === 0, '"again" schedules "' + w + '" for today (due ' + (srs3[w] && srs3[w].due) + ', today ' + today + ')');
  const stillDue = (await page.textContent('#statDue')).trim();
  expect(stillDue === '7', 'the word is still due today, count stays 7, got ' + stillDue);
  /* a "good" rating moves the next word to tomorrow */
  const w2 = await page.getAttribute('#revCard', 'data-w');
  expect(w2 && w2 !== w, 'the queue moved on to another word');
  await page.click('#revShow');
  await page.click('#rateGood');
  const srs4 = await store('srs');
  expect(srs4[w2] && srs4[w2].due === today + 1 && srs4[w2].iv === 1, '"good" on a new word schedules it for tomorrow');
  const dueNow = (await page.textContent('#statDue')).trim();
  expect(dueNow === '6', 'due count drops to 6, got ' + dueNow);
  const daily = await store('daily');
  expect(daily && Object.keys(daily.words).length >= 10, 'daily goal counts the words worked on today');
  const streak = await store('streak');
  expect(streak && streak.n === 1, 'daily goal of 10 met → streak 1, got ' + JSON.stringify(streak));
  log('practice, mark-learned and review flows OK');

  /* ---- 4. lists tab: pack filter + print area builds ---- */
  await page.click('#tab-lists');
  const all = await page.$$('#listGrid .dew-list');
  expect(all.length === 60, '60 lists shown, got ' + all.length);
  await page.click('#packChips .chip[data-pack="interview"]');
  const pack = await page.$$('#listGrid .dew-list');
  expect(pack.length === 10, 'interview pack has 10 lists, got ' + pack.length);
  await page.click('#packChips .chip[data-pack="all"]');
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  const rows = await page.$$('#printArea .pr-table tbody tr');
  expect(rows.length === 10, 'worksheet has 10 rows, got ' + rows.length);
  await page.click('#tab-learn');
};
