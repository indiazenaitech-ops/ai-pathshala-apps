/* Interaction test for Password Strength Lab (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, t, log }) {
  const lvl = async () => +(await page.getAttribute('#level', 'data-level'));
  const bits = async () => +(await page.getAttribute('#stat-bits', 'data-bits'));
  const kinds = async () => page.$$eval('#pieces .piece', a => a.map(x => x.dataset.kind));
  const fbKeys = async () => page.$$eval('#feedback li', a => a.map(x => x.dataset.key));

  // --- checker: default example + common password ---
  await page.waitForSelector('#level');
  await page.fill('#pw', 'india@123');
  await page.waitForTimeout(150);
  expect((await lvl()) === 0, 'india@123 should be very weak');
  expect((await page.textContent('#crack-time')).trim() === t('time_instant'), 'india@123 is guessed instantly');
  expect((await fbKeys()).includes('fb_common_whole'), 'common-password warning shown');

  // name + year pattern
  await page.fill('#pw', 'Rahul2008');
  await page.waitForTimeout(150);
  const k1 = await kinds();
  expect(k1.join(',') === 'name,year', 'Rahul2008 splits into name + year, got ' + k1);
  expect((await fbKeys()).includes('fb_name_year'), 'name + year feedback');

  // leetspeak
  await page.fill('#pw', 'P@ssw0rd');
  await page.waitForTimeout(150);
  expect((await fbKeys()).includes('fb_leet'), 'leetspeak feedback for P@ssw0rd');
  expect((await bits()) < 10, 'P@ssw0rd is recognised as "password"');

  // random 12 characters: strong, all 4 character types
  await page.fill('#pw', 'Kh9#mQ2v!xL7');
  await page.waitForTimeout(150);
  const b = await bits();
  expect(b > 78 && b < 80, '12 random chars ≈ 78.8 bits, got ' + b);
  expect((await lvl()) >= 3, 'random 12 chars is strong');
  expect((await page.$$eval('#types .ctype.on', a => a.length)) === 4, '4 character types used');

  // show / hide toggle, and the typed password is never stored
  expect((await page.getAttribute('#pw', 'type')) === 'text', 'examples are shown openly');
  await page.click('#toggle');
  expect((await page.getAttribute('#pw', 'type')) === 'password', 'hide toggles to type=password');
  expect((await page.textContent('#pieces')).includes('•'), 'pieces are masked when hidden');
  await page.click('#clear');
  expect((await page.inputValue('#pw')) === '' && (await page.$('#empty-hint')) !== null, 'clear empties the box');
  const ls = await page.evaluate(() => JSON.stringify(Object.assign({}, localStorage)));
  expect(!ls.includes('Kh9#mQ2v') && !ls.includes('Rahul2008'), 'passwords never stored in localStorage');

  // --- passphrase generator ---
  await page.click('#tab-gen');
  await page.click('#w-5');
  await page.click('#sep-dot');
  await page.click('#gen-new');
  const phrase = await page.getAttribute('#phrase', 'data-value');
  const parts = phrase.split('.');
  const nums = parts.filter(p => /^\d+$/.test(p));
  expect(parts.length === 6 && nums.length === 1, '5 words + 1 number joined with ".", got ' + phrase);
  const gb = +(await page.getAttribute('#gen-bits', 'data-bits'));
  const n = await page.evaluate(() => PWLAB.listSize('en'));
  const want = 5 * Math.log2(n) + Math.log2(90) + Math.log2(6);
  expect(Math.abs(gb - want) < 0.01, 'generator bits = 5·log2(N) + log2(90) + log2(6)');
  await page.click('#gen-new');
  expect((await page.getAttribute('#phrase', 'data-value')) !== phrase, 'a new passphrase is different');
  await page.click('#gen-test');
  const tested = await page.inputValue('#pw');
  expect(tested.split('.').length === 6, 'Check it copies the passphrase into the checker');
  expect(!(await page.isHidden('#panel-check')), 'checker tab is shown');

  // --- quiz: estimator agrees with every pair's expected answer ---
  const agree = await page.evaluate(() => PW_DATA.pairs.every(p => (PWLAB.analyze(p.a).bits > PWLAB.analyze(p.b).bits ? 'a' : 'b') === p.win));
  expect(agree, 'estimator agrees with all quiz answers');
  await page.click('#tab-quiz');
  await page.waitForSelector('#opt-a');
  for (let i = 0; i < 8; i++) {
    const win = await page.evaluate(() => { const a = document.querySelector('#opt-a .opw').textContent, b = document.querySelector('#opt-b .opw').textContent; return PWLAB.analyze(a).bits > PWLAB.analyze(b).bits ? 'a' : 'b'; });
    const pick = i === 1 ? (win === 'a' ? 'b' : 'a') : win;   // answer Q2 wrongly
    if (i === 2) await page.keyboard.press(pick === 'a' ? 'a' : 'b'); else await page.click('#opt-' + pick);
    await page.waitForSelector('#quiz-reveal');
    expect((await page.getAttribute('#quiz-reveal', 'data-right')) === (i === 1 ? '0' : '1'), 'question ' + (i + 1) + ' judged correctly');
    await page.click('#quiz-next');
  }
  await page.waitForSelector('#final-score');
  expect((await page.textContent('#final-score')).trim().startsWith('7'), 'final score 7/8');

  // --- persistence of settings and best score (never the password) ---
  await page.reload();
  await page.waitForSelector('#opt-a');
  await page.click('#tab-gen');
  expect((await page.getAttribute('#w-5', 'aria-pressed')) === 'true', 'word count remembered');
  expect((await page.getAttribute('#sep-dot', 'aria-pressed')) === 'true', 'separator remembered');
  const best = await page.evaluate(() => EDU.store('password-checker').get('best', null));
  expect(best === 7, 'best score saved, got ' + best);
  await page.click('#tab-check');
  log('generated', phrase);
};
