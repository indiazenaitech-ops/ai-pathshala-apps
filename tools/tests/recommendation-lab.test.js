/* Interaction test for Recommendation Lab. Run by tools/verify.js in en and hi. */
module.exports = async function ({ page, lang, expect, log }) {
  const dbg = () => page.evaluate(() => window.RECO_DEBUG());
  const star = (i, s) => page.click(`#v${i} .stars button[data-s="${s}"]`);

  // 0) example ratings are loaded on first visit, so all three lists are filled
  let s = await dbg();
  expect(s.rated >= 10 && s.pop.length === 5 && s.cb && s.cb.length === 5 && s.cf && s.cf.length === 5, 'example ratings fill all three lists');

  // 1) start empty: with fewer than 3 ratings the "People like you" column asks for more
  await page.click('#clearBtn');
  s = await dbg();
  expect(s.rated === 0 && s.cf === null && s.cb === null, 'cleared: no content / CF recommendations');
  expect(await page.isVisible('#cfNeed') && await page.isVisible('#cbNeed'), 'both "rate more" messages visible');
  expect(s.pop.length === 5, 'Popular still works for a brand-new user');

  // 2) rate 3 cricket videos 5 stars
  for (const i of [0, 1, 4]) await star(i, 5);
  s = await dbg();
  expect(s.rated === 3 && s.ratings[0] === 5 && s.ratings[4] === 5, '3 videos rated 5 stars');
  expect(s.profile.cricket === 6 && s.profile.comedy === 2 && s.profile.science === 2, 'taste profile: cricket +6, comedy +2, science +2');
  expect(s.cb[0].tags.includes('cricket') && s.cb[1].tags.includes('cricket'), 'Similar videos: the top two are cricket-tagged');
  expect(Math.abs(s.cb[0].cos - 6 / (Math.sqrt(44) * Math.SQRT2)) < 1e-9, 'cosine = 6 ÷ (√44 × √2) = ' + s.cb[0].cos.toFixed(4));
  expect(s.cf && s.cf[0].tags.includes('cricket'), 'People like you: the top suggestion is cricket-tagged');
  expect(s.neigh.length > 0 && s.neigh.every(n => n.sim > 0 && n.n >= 2), 'neighbour list is non-empty, all with similarity > 0 and ≥ 2 shared videos');
  expect((await page.$$('#neighbours li')).length === s.neigh.length, 'neighbours drawn');
  expect(!s.pop.some(r => [0, 1, 4].includes(r.i)), 'rated videos are never recommended');
  // ties: two cricket videos have the same cosine → second is marked "="
  expect(s.cb[1].tie === true && await page.isVisible('#tieHint'), 'tie is marked and explained');

  // 3) "Why?" opens the calculation
  await page.click('#recCb li:first-child .why-btn');
  const why = await page.$eval('#recCb li:first-child .why', e => e.textContent);
  expect(why.includes('0.64') || why.includes('0,64'), 'Why? shows the cosine 0.64, got: ' + why.slice(0, 80));

  // 4) a 5-star tap on the same star removes the rating
  await star(4, 5);
  s = await dbg();
  expect(s.rated === 2 && s.ratings[4] === 0 && s.cf === null, 'tapping the same star removes the rating; CF needs 3 again');
  await star(4, 5);

  // 5) a friend has separate ratings and joins the users
  await page.click('#raterSeg button[data-rater="friend"]');
  s = await dbg();
  expect(s.rater === 'friend' && s.rated === 0, 'friend starts with no ratings');
  for (const i of [0, 1, 4]) await star(i, 5);
  s = await dbg();
  expect(s.neigh.some(n => n.k === 'other' && Math.abs(n.sim - 1) < 1e-9), 'with the same ratings, "You" is the friend\'s perfect neighbour');
  await page.click('#raterSeg button[data-rater="you"]');

  // 6) filter bubble: 5 clicks on cricket videos → variety falls
  const v0 = +(await page.getAttribute('#varietyNum', 'data-value'));
  expect(v0 === 5 && (await page.getAttribute('#feedMsg', 'data-code')) === 'cold', 'new user: 5 different topics');
  for (let k = 0; k < 5; k++) {
    const btn = await page.$('#next li[data-genre="cricket"] .watch');
    expect(!!btn, 'a cricket video is in Up next (click ' + (k + 1) + ')');
    await btn.click();
  }
  s = await dbg();
  const v5 = +(await page.getAttribute('#varietyNum', 'data-value'));
  expect(s.hist.length === 5 && v5 < v0 && v5 <= 2, 'variety fell from ' + v0 + ' to ' + v5 + ' after 5 cricket clicks');
  expect((await page.getAttribute('#feedMsg', 'data-code')) === 'bubble', 'filter bubble warning shown');
  // explore mode mixes in 2 other topics
  await page.check('#exploreChk');
  const v6 = +(await page.getAttribute('#varietyNum', 'data-value'));
  expect(v6 > v5 && v6 >= 3 && (await page.$$('#next li.explore')).length === 2, 'explore mode adds 2 other topics, variety ' + v5 + ' → ' + v6);
  log('variety', v0, '→', v5, '→ explore', v6);

  // 7) survives a reload
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(300);
  s = await dbg();
  expect(s.rated === 3 && s.hist.length === 5, 'ratings and watch history are saved on this device');
};
