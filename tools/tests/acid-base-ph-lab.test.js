/* Interaction test for Acids, Bases & pH Lab (run by tools/verify.js in en and hi, dialogs auto-accepted). */
module.exports = async function ({ page, expect, t, log }) {
  const ds = async (sel, k) => page.getAttribute(sel, 'data-' + k);
  const near = (a, b, eps) => Math.abs(a - b) < (eps || 1e-6);
  const setVb = async (v) => { await page.fill('#t-vb-num', String(v)); await page.dispatchEvent('#t-vb-num', 'change'); await page.waitForTimeout(60); };

  // --- pH scale: lemon juice is the default ---
  await page.waitForSelector('#sub-detail[data-sub]');
  expect((await ds('#sub-detail', 'sub')) === 'lemon', 'lemon juice selected by default');
  expect((await ds('#sub-detail', 'nature')) === 'acidic' && (await ds('#sub-detail', 'ph')) === '2', 'lemon → acidic, pH 2');
  expect(near(+(await ds('#sub-detail', 'h')), 0.01), 'lemon [H+] = 0.01 mol/L, got ' + (await ds('#sub-detail', 'h')));
  const cmps = await page.$$eval('#cmp li', a => a.map(x => [x.dataset.with, +x.dataset.factor]));
  expect(cmps.some(c => c[0] === 'vinegar' && c[1] === 10), '10 times more acidic than vinegar, got ' + JSON.stringify(cmps));
  expect(cmps.some(c => c[0] === 'water' && c[1] === 100000), '1,00,000 times more acidic than water');
  expect((await page.$eval('#sub-detail tr[data-ind="phenolphthalein"]', x => x.dataset.color)) === 'colourless', 'phenolphthalein stays colourless in lemon juice');
  expect((await page.$eval('#sub-detail tr[data-ind="blue_litmus"]', x => x.dataset.color + x.dataset.change)) === 'redyes', 'blue litmus turns red in lemon juice');

  // soap: basic, red litmus → blue
  await page.click('#sub-soap');
  expect((await ds('#sub-detail', 'sub')) === 'soap' && (await ds('#sub-detail', 'nature')) === 'basic' && (await ds('#sub-detail', 'ph')) === '10', 'soap → basic, pH 10');
  expect((await page.$eval('#sub-detail tr[data-ind="red_litmus"]', x => x.dataset.color + ':' + x.dataset.change)) === 'blue:yes', 'red litmus in soap → blue');
  expect(near(+(await ds('#sub-detail', 'h')), 1e-10, 1e-14), 'soap [H+] = 1e-10');
  expect((await page.$$eval('.sub-chip', a => a.length)) === 24, '24 substances listed');
  // a marker on the bar also selects
  await page.click('#mark-water');
  expect((await ds('#sub-detail', 'sub')) === 'water' && (await ds('#sub-detail', 'nature')) === 'neutral', 'pure water → neutral');
  await page.click('#sub-soap');

  // --- indicator lab ---
  await page.click('#tab-ind');
  await page.selectOption('#ind-sub', 'naoh');
  await page.click('#ind-phenolphthalein');
  let c = await ds('#ind-result', 'color');
  expect((c === 'pink' || c === 'dark_pink') && (await ds('#ind-result', 'change')) === 'yes', 'phenolphthalein in NaOH → pink, got ' + c);
  await page.selectOption('#ind-sub', 'hcl');
  expect((await ds('#ind-result', 'color')) === 'colourless' && (await ds('#ind-result', 'change')) === 'no', 'phenolphthalein in HCl → colourless');
  await page.selectOption('#ind-sub', 'soap');
  await page.click('#ind-red_litmus');
  expect((await ds('#ind-result', 'color')) === 'blue' && (await ds('#ind-result', 'change')) === 'yes', 'red litmus in soap → blue');
  await page.click('#ind-turmeric');
  expect((await ds('#ind-result', 'color')) === 'reddish_brown', 'turmeric in soap → reddish brown');
  await page.selectOption('#ind-sub', 'lemon');
  await page.click('#ind-china_rose');
  expect((await ds('#ind-result', 'color')) === 'dark_pink', 'china rose in lemon juice → dark pink');
  await page.click('#ind-universal');
  expect((await ds('#ind-result', 'color')) === 'red', 'universal indicator in lemon juice → red');
  await page.click('#ind-blue_litmus');
  expect((await ds('#ind-result', 'color')) === 'red' && (await ds('#ind-result', 'change')) === 'yes', 'blue litmus in lemon juice → red');

  // --- colour game: 10 rounds, one deliberate miss (off by one) ---
  await page.click('#game-start');
  await page.waitForSelector('#ph-key-0');
  for (let i = 0; i < 10; i++) {
    const ph = +(await ds('#game', 'ph'));
    const pick = i === 1 ? (ph === 14 ? 13 : ph + 1) : ph;
    await page.click('#ph-key-' + pick);
    await page.waitForSelector('#game-reveal');
    expect((await ds('#game-reveal', 'right')) === (i === 1 ? '0' : '1'), 'game round ' + (i + 1) + ' judged correctly');
    if (i === 4) {
      await page.reload();
      await page.waitForSelector('#game-reveal');
      expect((await page.textContent('#game-score')).trim() === '4', 'game score kept after reload, got ' + (await page.textContent('#game-score')));
    }
    await page.click('#game-next');
  }
  await page.waitForSelector('#game-final');
  expect((await ds('#game-final', 'score')) === '9', 'game final score 9/10');

  // --- neutralisation ---
  await page.click('#tab-titr');
  expect(near(+(await ds('#t-veq', 'veq')), 25), '25 mL of 0.1 M HCl needs 25 mL of 0.1 M NaOH');
  expect((await ds('#t-ph', 'ph')) === '1.00' && (await ds('#t-state', 'kind')) === 'acid', 'pH 1.00 before any base is added');
  await setVb(20);
  let ph = +(await ds('#t-ph', 'ph'));
  expect(ph < 7 && near(ph, 1.95, 0.011) && (await ds('#t-state', 'kind')) === 'acid', 'pH < 7 at 20 mL (1.95), got ' + ph);
  expect((await ds('#t-ph', 'color')) === 'colourless', 'phenolphthalein still colourless at 20 mL');
  await setVb(30);
  ph = +(await ds('#t-ph', 'ph'));
  expect(ph > 7 && near(ph, 11.96, 0.011) && (await ds('#t-state', 'kind')) === 'base', 'pH > 7 at 30 mL (11.96), got ' + ph);
  c = await ds('#t-ph', 'color');
  expect(c === 'pink' || c === 'dark_pink', 'phenolphthalein pink past the end point, got ' + c);
  await setVb(25);
  expect((await ds('#t-ph', 'ph')) === '7.00' && (await ds('#t-state', 'kind')) === 'equal', 'pH 7.00 at exactly 25 mL');
  const eng = await page.evaluate(() => [PHLAB.titration(25, 0.1, 25, 0.1).ph, PHLAB.titration(25, 0.1, 24.9, 0.1).ph, PHLAB.titration(25, 0.1, 25.1, 0.1).ph, PHLAB.titration(20, 0.2, 0, 0.1).vEq]);
  expect(near(eng[0], 7) && near(eng[1], 3.698, 0.001) && near(eng[2], 10.300, 0.001) && near(eng[3], 40), 'engine: pH 7 at equivalence, 3.70 at 24.9 mL, 10.30 at 25.1 mL, vEq 40 for 20 mL 0.2 M');
  // one drop at a time
  await setVb(24.95);
  await page.click('#t-drop');
  expect((await ds('#t-ph', 'vb')) === '25' && (await ds('#t-ph', 'ph')) === '7.00', '+1 drop (0.05 mL) reaches 25 mL and pH 7');
  await page.click('#t-1ml');
  expect((await ds('#t-ph', 'vb')) === '26' && +(await ds('#t-ph', 'ph')) > 7, '+1 mL → 26 mL, basic');
  await page.click('#t-empty');
  expect((await ds('#t-ph', 'vb')) === '0' && (await ds('#t-ph', 'ph')) === '1.00', 'start again empties the burette');
  await page.click('#t-5ml'); await page.click('#t-5ml');
  expect((await ds('#t-ph', 'vb')) === '10', '+5 mL twice → 10 mL');
  // stronger acid: end point moves to 50 mL
  await page.fill('#t-ca', '0.2'); await page.dispatchEvent('#t-ca', 'change'); await page.waitForTimeout(60);
  expect(near(+(await ds('#t-veq', 'veq')), 50), '0.2 M acid needs 50 mL of 0.1 M base, got ' + (await ds('#t-veq', 'veq')));
  await page.fill('#t-ca', '0.1'); await page.dispatchEvent('#t-ca', 'change'); await page.waitForTimeout(60);
  // methyl orange is red in the acid and yellow past the end point
  await page.selectOption('#t-ind', 'methyl_orange');
  expect((await ds('#t-ph', 'color')) === 'red', 'methyl orange red at pH ~1.4');
  await setVb(26);
  expect((await ds('#t-ph', 'color')) === 'yellow', 'methyl orange yellow at pH > 4.4');
  await page.selectOption('#t-ind', 'phenolphthalein');
  await setVb(10);

  // --- salts: three right, one wrong ---
  await page.click('#tab-salts');
  await page.click('#salt-nacl-neutral'); await page.click('#salt-na2co3-basic'); await page.click('#salt-nh4cl-acidic'); await page.click('#salt-ch3coona-acidic');
  expect((await ds('#salts-score', 'n')) === '3', 'salts: 3 of 4 guesses right, got ' + (await ds('#salts-score', 'n')));
  const natures = await page.$$eval('.salt-card', a => a.map(x => x.dataset.salt + ':' + x.dataset.nature));
  expect(natures.includes('nacl:neutral') && natures.includes('na2co3:basic') && natures.includes('nh4cl:acidic') && natures.includes('ch3coona:basic'), 'salt natures follow the strong-parent rule, got ' + natures);
  expect((await page.$eval('#salt-ch3coona-basic', b => b.className)) === 'hit' && (await page.$eval('#salt-ch3coona-acidic', b => b.className)) === 'miss', 'wrong guess shows the right answer');

  // --- quiz: all right except question 3; reload in the middle ---
  await page.click('#tab-quiz');
  await page.waitForSelector('#opt-0');
  const correct = await page.evaluate(() => PHLAB.QUIZ.map(q => q.correct));
  expect(correct.length === 15, '15 quiz questions');
  for (let i = 0; i < 15; i++) {
    const pick = i === 2 ? (correct[i] + 1) % 4 : correct[i];
    if (i === 6) await page.keyboard.press('abcd'.charAt(pick)); else await page.click('#opt-' + pick);
    await page.waitForSelector('#quiz-reveal');
    expect((await ds('#quiz-reveal', 'right')) === (i === 2 ? '0' : '1'), 'question ' + (i + 1) + ' judged correctly');
    if (i === 7) {
      await page.reload();
      await page.waitForSelector('#quiz-reveal');
      expect((await page.textContent('#quiz-score')).trim() === '7' && (await ds('#quiz', 'i')) === '7', 'quiz progress and score kept after reload');
    }
    await page.click('#quiz-next');
  }
  await page.waitForSelector('#final-score');
  expect((await ds('#final-score', 'score')) === '14', 'quiz final score 14/15');

  // --- persistence of every selection ---
  await page.reload();
  await page.waitForSelector('#final-score');
  const st = await page.evaluate(() => PHLabApp.state());
  expect(st.tab === 'quiz' && st.bestQuiz === 14 && st.bestGame === 9, 'tab, best quiz and best game scores persist, got ' + JSON.stringify([st.tab, st.bestQuiz, st.bestGame]));
  expect(st.sub === 'soap' && st.ind.sub === 'lemon' && st.ind.ind === 'blue_litmus', 'last substance and indicator selections persist');
  expect(near(st.titr.vb, 10) && st.salts.nacl === 'neutral' && st.salts.ch3coona === 'acidic', 'burette volume and salt guesses persist');
  await page.click('#tab-scale');
  expect((await ds('#sub-detail', 'sub')) === 'soap', 'soap still selected after reload');

  // --- printable summary ---
  await page.evaluate(() => { window.print = () => {}; });
  await page.click('#print-summary-2');
  await page.waitForTimeout(150);
  const sum = await page.evaluate(() => ({ subs: document.querySelectorAll('#summary .sum-subs > span').length, inds: document.querySelectorAll('#summary .sum-tbl tbody tr').length }));
  expect(sum.subs === 24 && sum.inds === 7 + 4, 'summary lists 24 substances, 7 indicators and 4 salts, got ' + JSON.stringify(sum));

  // --- garbage in storage never crashes the app ---
  await page.evaluate(() => localStorage.setItem('edu.acid-base-ph-lab.state', JSON.stringify({ tab: 'nope', sub: 42, ind: 'x', game: { rounds: [99, -1], i: 'a' }, titr: { va: -5, ca: 'big', vb: 1e9 }, quiz: { i: 99, score: -3 }, salts: { nacl: 'spicy' }, bestQuiz: 'x' })));
  await page.reload();
  await page.waitForSelector('#sub-detail[data-sub]');
  const st2 = await page.evaluate(() => PHLabApp.state());
  expect(st2.tab === 'scale' && st2.sub === 'lemon' && st2.game === null && st2.titr.va === 1 && st2.titr.ca === 0.1 && st2.titr.vb === 400 && st2.quiz.i === 0 && !('nacl' in st2.salts) && st2.bestQuiz === null, 'damaged state is cleaned on load, got ' + JSON.stringify(st2));

  // --- reset (confirm dialog is accepted by the runner) ---
  await page.click('#sub-soap');
  await page.click('#reset');
  await page.waitForTimeout(100);
  const st3 = await page.evaluate(() => PHLabApp.state());
  expect(st3.sub === 'lemon' && st3.titr.vb === 0 && st3.titr.va === 25 && st3.game === null && st3.bestGame === null, 'reset restores the defaults');
  expect((await ds('#sub-detail', 'sub')) === 'lemon' && !(await page.isHidden('#panel-scale')), 'reset shows lemon juice on the pH scale tab');
  log('cmps', JSON.stringify(cmps));
};
