/* Interaction test for Password Strength Lab (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, t, log }) {
  const lvl = async () => +(await page.getAttribute('#level', 'data-level'));
  const bits = async () => +(await page.getAttribute('#stat-bits', 'data-bits'));
  const kinds = async () => page.$$eval('#pieces .piece', a => a.map(x => x.dataset.kind));
  const fbKeys = async () => page.$$eval('#feedback li', a => a.map(x => x.dataset.key));
  const type = async (pw) => { await page.fill('#pw', pw); await page.waitForTimeout(150); };

  // --- checker: default example + common password ---
  await page.waitForSelector('#level');
  await type('india@123');
  expect((await lvl()) === 0, 'india@123 should be very weak');
  expect((await page.textContent('#crack-time')).trim() === t('time_instant'), 'india@123 is guessed instantly');
  expect((await fbKeys()).includes('fb_common_whole'), 'common-password warning shown');

  // name + year pattern
  await type('Rahul2008');
  const k1 = await kinds();
  expect(k1.join(',') === 'name,year', 'Rahul2008 splits into name + year, got ' + k1);
  expect((await fbKeys()).includes('fb_name_year'), 'name + year feedback');

  // common Indian names are on the attacker's list too (not "random letters")
  for (const pw of ['Shubham@123', 'Saurabh@123', 'Sakshi2010']) {
    await type(pw);
    expect((await kinds())[0] === 'name' && (await lvl()) === 0, pw + ' starts with a name and is very weak, got ' + (await kinds()) + ' level ' + (await lvl()));
  }
  // everyday English words are spotted as words
  await type('mylifemyrules');
  expect((await kinds()).filter(k => k === 'word').length === 2 && (await lvl()) === 0, 'mylifemyrules: life + rules are words, very weak');

  // leetspeak
  await type('P@ssw0rd');
  expect((await fbKeys()).includes('fb_leet'), 'leetspeak feedback for P@ssw0rd');
  expect((await bits()) < 10, 'P@ssw0rd is recognised as "password"');

  // a number like 123456 inside a passphrase is called a common password, never "an English word"
  await type('apple-mango-river-123456');
  expect((await fbKeys()).filter(k => k === 'fb_common_part').length === 2, 'apple + 123456 flagged as common passwords, got ' + (await fbKeys()));

  // random 12 characters: strong, all 4 character types
  await type('Kh9#mQ2v!xL7');
  const b = await bits();
  expect(b > 78 && b < 80, '12 random chars ≈ 78.8 bits, got ' + b);
  expect((await lvl()) >= 3, 'random 12 chars is strong');
  expect((await page.$$eval('#types .ctype.on', a => a.length)) === 4, '4 character types used');

  // very long input (up to maxlength 256): a repeated common password stays very weak
  await page.fill('#pw', 'india@123'.repeat(30));
  await page.waitForTimeout(300);
  expect((await page.inputValue('#pw')).length === 256, 'input is limited to 256 characters');
  expect((await lvl()) === 0 && (await kinds())[0] === 'repeat', 'india@123 typed 28 times is a repeat and very weak, got level ' + (await lvl()));

  // capitalising every word is ONE rule, not one extra choice per word
  const capsGap = await page.evaluate(() => PWLAB.analyze('Lock-Artist-Printer-Igloo').bits - PWLAB.analyze('lock-artist-printer-igloo').bits);
  expect(Math.abs(capsGap - 1) < 0.01, 'Capital First Letters adds 1 bit, got ' + capsGap);

  // words typed in an Indian script count as dictionary words, never as random letters
  await type('राहुल2008');
  expect((await kinds()).join(',') === 'script,year', 'राहुल2008 splits into script word + year, got ' + (await kinds()));
  expect((await fbKeys()).includes('fb_script') && (await lvl()) === 0, 'Indian-script word is flagged and weak');

  // show / hide: typing over the example hides it, examples are shown openly, the toggle works
  expect((await page.getAttribute('#pw', 'type')) === 'password', 'typing your own password hides it automatically');
  expect((await page.textContent('#pieces')).includes('•'), 'pieces are masked when hidden');
  await page.click('#toggle');
  expect((await page.getAttribute('#pw', 'type')) === 'text', 'Show reveals the password');
  await page.click('#ex-8');
  expect((await page.inputValue('#pw')) === 'Kh9#mQ2v!xL7' && (await page.getAttribute('#pw', 'type')) === 'text', 'examples are shown openly');
  await page.click('#toggle');
  expect((await page.getAttribute('#pw', 'type')) === 'password', 'hide toggles to type=password');
  await page.click('#clear');
  expect((await page.inputValue('#pw')) === '' && (await page.$('#empty-hint')) !== null, 'clear empties the box');
  const ls = await page.evaluate(() => JSON.stringify(Object.assign({}, localStorage)));
  expect(!ls.includes('Kh9#mQ2v') && !ls.includes('Rahul2008') && !ls.includes('Shubham'), 'passwords never stored in localStorage');

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
  const winner = () => page.evaluate(() => { const a = document.querySelector('#opt-a .opw').textContent, b = document.querySelector('#opt-b .opw').textContent; return PWLAB.analyze(a).bits > PWLAB.analyze(b).bits ? 'a' : 'b'; });
  let qBefore = '';
  for (let i = 0; i < 8; i++) {
    if (i === 3) {
      // reload in the middle of the quiz: the same question, score and progress come back
      qBefore = await page.textContent('#opt-a .opw');
      await page.reload();
      await page.waitForSelector('#opt-a');
      expect((await page.textContent('#opt-a .opw')) === qBefore, 'same question after reload');
      expect((await page.textContent('#quiz-score')).trim() === '2', 'score kept after reload');
      expect((await page.textContent('#quiz-progress')).includes('4'), 'progress kept after reload (question 4)');
    }
    const win = await winner();
    const pick = i === 1 ? (win === 'a' ? 'b' : 'a') : win;   // answer Q2 wrongly
    if (i === 2) await page.keyboard.press(pick === 'a' ? 'a' : 'b'); else await page.click('#opt-' + pick);
    await page.waitForSelector('#quiz-reveal');
    expect((await page.getAttribute('#quiz-reveal', 'data-right')) === (i === 1 ? '0' : '1'), 'question ' + (i + 1) + ' judged correctly');
    // pressing A/B again after answering changes nothing
    await page.keyboard.press('a'); await page.keyboard.press('b');
    await page.click('#quiz-next');
  }
  await page.waitForSelector('#final-score');
  expect((await page.textContent('#final-score')).trim().startsWith('7'), 'final score 7/8');

  // --- worksheet: 12 pairs + an answer key that matches the estimator ---
  await page.evaluate(() => { window.print = () => {}; });
  await page.click('#quiz-print');
  const ws = await page.evaluate(() => ({
    rows: document.querySelectorAll('#worksheet .ws-q tbody tr').length,
    key: [...document.querySelectorAll('#worksheet .ws-k tbody tr td:nth-child(2)')].map(td => td.textContent.trim()),
    want: PW_DATA.pairs.map(p => p.win.toUpperCase())
  }));
  expect(ws.rows === 12 && ws.key.join('') === ws.want.join(''), 'worksheet has 12 pairs and a correct answer key, got ' + ws.key.join(''));

  // --- persistence of settings, the finished quiz and best score (never the password) ---
  await page.reload();
  await page.waitForSelector('#final-score');
  expect((await page.textContent('#final-score')).trim().startsWith('7'), 'finished quiz still shown after reload');
  const best = await page.evaluate(() => EDU.store('password-checker').get('best', null));
  expect(best === 7, 'best score saved, got ' + best);
  await page.click('#quiz-again');
  expect((await page.textContent('#quiz-progress')).includes('1') && (await page.textContent('#quiz-score')).trim() === '0', 'Play again starts a new round');
  await page.click('#tab-gen');
  expect((await page.getAttribute('#w-5', 'aria-pressed')) === 'true', 'word count remembered');
  expect((await page.getAttribute('#sep-dot', 'aria-pressed')) === 'true', 'separator remembered');

  // --- reset (the confirm dialog is accepted by the runner) ---
  await page.click('#tab-quiz');
  await page.click('#reset');
  await page.waitForTimeout(100);
  const after = await page.evaluate(() => ({ best: EDU.store('password-checker').get('best', null), gen: EDU.store('password-checker').get('gen', null) }));
  expect(after.best === null && after.gen === null, 'reset forgets the best score and settings');
  await page.click('#tab-gen');
  expect((await page.getAttribute('#w-6', 'aria-pressed')) === 'true' && (await page.getAttribute('#sep-dash', 'aria-pressed')) === 'true', 'reset restores default settings');
  await page.click('#tab-check');
  log('generated', phrase);
};
