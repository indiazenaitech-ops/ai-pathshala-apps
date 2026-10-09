/* Interaction test for Workplace Scam & Cyber Drill (run by tools/verify.js in en and hi).
   Plays the whole drill: every one of the scenarios is reached, answered and scored. */
module.exports = async function ({ page, expect, t }) {
  await page.waitForSelector('#card[data-id]', { timeout: 10000 });
  const data = await page.evaluate(() => window.DRILL_DATA.map((d) => ({ id: d.id, scam: d.scam, senderFlag: !!d.senderFlag })));
  const N = data.length;
  expect(N === 32, 'there are 32 scenarios, got ' + N);
  const byId = {};
  data.forEach((d) => { byId[d.id] = d; });
  expect(data.filter((d) => !d.scam).length >= 6, 'the drill mixes in genuine messages');

  const seen = new Set();
  let firstScamChecked = false;
  for (let i = 0; i < N; i++) {
    const id = await page.getAttribute('#card', 'data-id');
    expect(!seen.has(id), 'scenario shown twice: ' + id);
    seen.add(id);
    const d = byId[id];
    const title = (await page.textContent('#scTitle')).trim();
    expect(title.length > 5, 'scenario ' + id + ' has a title');

    // the very first scam: mark every red flag (sender line + flagged phrases) before answering
    if (d.scam && !firstScamChecked) {
      const codes = await page.$$eval('#card .chunk.live[data-code]', (els) => els.map((e) => e.getAttribute('data-key')));
      expect(new Set(codes).size === codes.length, 'tappable parts have unique keys: ' + codes.join(','));
      const parts = await page.$$('#card .chunk.live[data-code]');
      for (const h of parts) await h.click();
      const marked = await page.textContent('#markedN');
      expect(marked.includes(String(codes.length)), 'marked count shows ' + codes.length + ': ' + marked);
    }

    // answer: the first scenario wrongly on purpose, all others correctly
    const wrong = i === 0;
    const ans = (d.scam !== wrong) ? '#ansScam' : '#ansSafe';
    await page.click(ans);
    await page.waitForSelector('#verdict', { timeout: 5000 });
    const right = await page.getAttribute('#verdict', 'data-right');
    expect(right === (wrong ? '0' : '1'), `verdict for ${id} should be ${wrong ? 'wrong' : 'right'}, got ${right}`);
    expect(await page.isVisible('.callout.accent'), 'what-to-do advice shown for ' + id);

    if (d.scam) {
      const nFlags = await page.$$eval('#flagList li', (e) => e.length);
      expect(nFlags >= 1, 'scam ' + id + ' lists at least one red flag');
      if (!firstScamChecked) {
        firstScamChecked = true;
        const fr = await page.textContent('#flagsResult');
        expect(fr === t('flags_result', { found: String(nFlags), total: String(nFlags) }), 'all red flags found: ' + fr);
        // tapping a highlighted part explains that flag
        await page.click('#card .chunk.rf');
        expect(await page.isVisible('#flagExplain'), 'flag explanation opens');
      }
    }
    await page.click('#next');
  }
  expect(seen.size === N, 'every scenario was reached: ' + seen.size);

  // results: 31 of 32 correct
  await page.waitForSelector('#finalScore', { timeout: 5000 });
  const fs = (await page.textContent('#finalScore')).replace(/\s/g, '');
  expect(fs === `${N - 1}/${N}`, 'final score 31/32, got ' + fs);
  expect((await page.$$eval('#review .review-row', (e) => e.length)) === N, 'review lists every scenario');
  expect((await page.$$eval('#review .review-row.badr', (e) => e.length)) === 1, 'exactly one missed scenario in the review');

  // certificate picks up the score
  await page.click('#getCert');
  await page.fill('#certName', 'Asha Verma');
  const cert = await page.textContent('#cert');
  expect(cert.includes('Asha Verma'), 'name on the certificate');
  expect(cert.includes(t('cert_score', { score: String(N - 1), n: String(N), pct: '97' })), 'score on the certificate');
  expect(await page.isHidden('#certNoResult'), 'no "drill not done" warning');

  // what-to-do tab: six habits, 1930, printable checklist
  await page.click('#tab-todo');
  expect((await page.$$eval('#acts .act', (e) => e.length)) === 6, 'six habit cards');
  expect((await page.textContent('#panel-todo')).includes('1930'), '1930 helpline shown');
  await page.click('#printChecklist');
  expect((await page.getAttribute('#app', 'data-print')) === 'checklist', 'checklist print mode');
  await page.emulateMedia({ media: 'print' });
  expect(await page.isVisible('#acts') && !(await page.isVisible('#tabs')), 'only the checklist prints');
  await page.emulateMedia({ media: 'screen' });
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));

  // team quiz: 2 teams, 6 scenarios, award points, finish with a winner
  await page.click('#tab-team');
  await page.click('[data-n="2"]');
  await page.click('[data-count="6"]');
  await page.fill('#team0', 'Accounts');
  await page.click('#teamStart');
  const qIds = new Set();
  for (let q = 0; q < 6; q++) {
    await page.waitForSelector('#reveal', { timeout: 5000 });
    qIds.add(await page.getAttribute('#teamCard', 'data-id'));
    await page.click('#reveal');
    await page.click('#award [data-team="0"]');
    if (q % 2 === 0) await page.click('#award [data-team="1"]');
    await page.click('#teamNext');
  }
  expect(qIds.size === 6, 'six different quiz scenarios');
  await page.waitForSelector('#winner', { timeout: 5000 });
  expect((await page.textContent('#winner')).includes('Accounts'), 'team Accounts wins: ' + (await page.textContent('#winner')));
  const sc = await page.$$eval('#scoreboard .tscore', (e) => e.map((x) => x.textContent.trim()));
  expect(sc[0] === '6' && sc[1] === '3', 'team scores 6 and 3, got ' + sc.join(','));

  // progress survives a reload
  await page.reload();
  await page.waitForSelector('#teamDone', { timeout: 5000 });
  await page.click('#tab-drill');
  await page.waitForSelector('#finalScore', { timeout: 5000 });
  expect((await page.textContent('#finalScore')).replace(/\s/g, '') === `${N - 1}/${N}`, 'results kept after reload');
};
