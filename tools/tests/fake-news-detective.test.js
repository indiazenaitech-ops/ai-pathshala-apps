/* Interaction test for Fake News Detective (run by tools/verify.js in en and hi, dialogs auto-accepted). */
module.exports = async function ({ page, expect, t, log }) {
  const facts = async () => page.evaluate(() => { const o = {}; window.FND_MSGS.forEach(m => { o[m.id] = { ans: m.ans, lvl: m.lvl, flags: m.flags.length }; }); return o; });
  const F = await facts();
  const curId = async () => page.getAttribute('#game-play .msg', 'data-id');
  const score = async () => +(await page.getAttribute('#score', 'data-score'));

  // --- game: 5 rounds, 3 right + 2 wrong -> score 3 ---
  await page.waitForSelector('#start-btn');
  await page.click('#start-btn');
  await page.waitForSelector('#answers');
  const seen = [];
  for (let r = 0; r < 5; r++) {
    const id = await curId();
    seen.push(id);
    expect(F[id] && F[id].lvl === 'jr', 'junior round shows a junior message: ' + id);
    const right = F[id].ans;
    const pick = r < 3 ? right : (right === 'rel' ? 'fake' : 'rel');
    await page.click('#ans-' + pick);
    await page.waitForSelector('#verdict');
    const res = await page.getAttribute('#verdict', 'data-result');
    expect(r < 3 ? res === 'correct' : res !== 'correct', `round ${r + 1} verdict ${res}`);
    if (F[id].flags) {
      const n = await page.$$eval('#reveal-flags li', a => a.length);
      expect(n >= 1 && n === F[id].flags, `reveal lists ${F[id].flags} flags for ${id}, got ${n}`);
    } else expect(await page.$('.flags.safe li'), 'reliable message shows the good signs');
    expect(await page.$('.step-card[data-step]'), 'the one check is shown');
    expect((await score()) === Math.min(r + 1, 3), `score after round ${r + 1}`);
    await page.click('#next-btn');
    await page.waitForSelector('#answers');
  }
  expect(new Set(seen).size === 5, 'five different messages');
  expect((await score()) === 3, 'score equals correct count (3)');
  expect((await page.textContent('#q-pill')).includes('6'), 'now on message 6');

  // --- reload keeps progress ---
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#score');
  expect((await score()) === 3, 'score survives reload');
  expect((await page.textContent('#q-pill')).includes('6'), 'position survives reload');
  expect(seen.indexOf(await curId()) < 0, 'message 6 is a new message');

  // --- level switch changes the set (confirm dialog auto-accepted, round restarts) ---
  await page.click('#lvl-sr');
  await page.waitForSelector('#start-btn');
  await page.click('#start-btn');
  await page.waitForSelector('#answers');
  const srId = await curId();
  expect(F[srId].lvl === 'sr', 'senior level shows a senior message: ' + srId);

  // --- message checker ---
  await page.click('#tab-check');
  await page.fill('#chk-in', 'URGENT!!! forward to 10 people bit.ly/xyz win ₹5000');
  await page.waitForFunction(() => { const e = document.getElementById('chk-level'); return e && e.dataset.level === 'high'; }, null, { timeout: 5000 });
  const nf = +(await page.getAttribute('#chk-level', 'data-flags'));
  expect(nf >= 3, 'scam text has >= 3 flags, got ' + nf);
  const codes = await page.$$eval('#chk-flags li', a => a.map(x => x.dataset.flag));
  expect(codes.includes('urgent') && codes.includes('fwd') && codes.includes('shortlink'), 'urgent, fwd and shortlink flagged: ' + codes.join(','));
  expect((await page.$$eval('#chk-marked mark', a => a.length)) >= 3, 'red flags marked in the text');
  await page.fill('#chk-in', t('ex_calm'));
  await page.waitForFunction(() => { const e = document.getElementById('chk-level'); return e && e.dataset.level === 'low'; }, null, { timeout: 5000 });
  expect((await page.getAttribute('#chk-level', 'data-flags')) === '0', 'calm message has no flags');
  await page.fill('#chk-in', '');
  await page.waitForSelector('#chk-empty');

  // --- class mode: votes, reveal, verdict ---
  await page.click('#tab-class');
  await page.click('#class-start');
  await page.waitForSelector('#class-reveal');
  const cid = await page.getAttribute('#class-stage .msg', 'data-id');
  await page.click('#vote-' + F[cid].ans + '-plus');
  await page.click('#vote-' + F[cid].ans + '-plus');
  await page.click('#vote-' + (F[cid].ans === 'rel' ? 'fake' : 'rel') + '-plus');
  expect((await page.inputValue('#vote-' + F[cid].ans)) === '2', 'vote counter counts 2');
  await page.click('#class-reveal');
  await page.waitForSelector('#class-verdict');
  expect((await page.getAttribute('#class-verdict', 'data-verdict')) === 'right', 'class majority was right');
  expect((await page.getAttribute('#class-score', 'data-score')) === '1', 'class score 1');
  await page.click('#class-next');
  await page.waitForSelector('#class-reveal');

  // --- worksheet: 8 rows + key, level switch ---
  const rows = async () => page.$$eval('#worksheet .ws-q tbody tr', a => a.map(x => x.dataset.id));
  const keys = async () => page.$$eval('#worksheet .ws-k tbody tr', a => a.map(x => x.dataset.ans));
  expect((await rows()).length === 8, 'worksheet has 8 rows');
  expect((await keys()).length === 8, 'answer key has 8 rows');
  expect((await rows()).every(id => F[id].lvl === 'jr'), 'junior worksheet uses junior messages');
  await page.click('#ws-sr');
  await page.waitForTimeout(100);
  const sr = await rows();
  expect(sr.length === 8 && sr.every(id => F[id].lvl === 'sr'), 'senior worksheet uses senior messages');
  const k = await keys();
  expect(k.filter(a => a === 'fake').length === 4 && k.filter(a => a === 'rel').length === 2, 'key: 4 fake, 2 reliable');

  // --- reset ---
  await page.click('#reset');
  await page.waitForTimeout(200);
  await page.click('#tab-game');
  await page.waitForSelector('#start-btn');
  expect((await page.textContent('#stat-played')).trim() === '0', 'rounds played reset to 0');
  expect(!(await page.$('#game-play .msg')), 'no round in progress after reset');
  const left = await page.evaluate(() => Object.keys(localStorage).filter(k => k.includes('fake-news-detective') && /game|class|stats/.test(k)).length);
  expect(left === 0, 'saved progress removed: ' + left);
  await page.click('#tab-class');
  await page.waitForSelector('#class-start');
};
