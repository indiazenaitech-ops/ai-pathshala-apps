/* Interaction test for "Decision Tree Lab" (decision-tree-builder).
   Run by tools/verify.js in en and hi with an empty localStorage (dialogs auto-accepted). */
module.exports = async function ({ page, lang, expect, log }) {
  await page.waitForSelector('#tree .tnode[data-id="r"]', { timeout: 15000 });

  const stats = () => page.evaluate(() => {
    const s = document.querySelector('#stats');
    return { correct: Number(s.dataset.correct), total: Number(s.dataset.total), q: Number(s.dataset.q), leaves: Number(s.dataset.leaves) };
  });
  const runTest = async () => {
    await page.click('#run-test');
    await page.waitForTimeout(300);
    if (await page.isVisible('#skip-test')) await page.click('#skip-test');
    await page.waitForSelector('#test-summary[data-done="1"]', { timeout: 15000 });
    return Number(await page.getAttribute('#test-summary', 'data-correct'));
  };

  // 1) start: one root box with all 20 animals, no questions yet
  expect((await page.getAttribute('#tree .tnode[data-id="r"]', 'data-n')) === '20', 'root should hold 20 training animals');
  let s = await stats();
  expect(s.q === 0 && s.leaves === 1 && s.total === 20, 'empty tree should have 0 questions and 1 leaf, got ' + JSON.stringify(s));

  // 2) split the root on "How many legs?" → 3 groups (0 / 2 / 4 legs), 13 of 20 correct
  await page.click('#tree .tnode[data-id="r"]');
  await page.click('#split-3');
  await page.waitForSelector('#tree .tnode[data-id="r-2"]');
  const kids = await page.$$eval('#tree .tnode', (a) => a.map((b) => b.dataset.id + ':' + b.dataset.n));
  log('after legs split', kids.join(' '));
  expect(kids.length === 4, 'legs split should give root + 3 children, got ' + kids.length);
  expect(kids.includes('r-0:6') && kids.includes('r-1:6') && kids.includes('r-2:8'), 'groups should be 6 / 6 / 8 animals');
  s = await stats();
  expect(s.q === 1 && s.correct === 13, 'legs tree should get 13 of 20 training animals right, got ' + JSON.stringify(s));

  // 3) undo removes the question; then rebuild it
  await page.click('#undo');
  await page.waitForTimeout(100);
  s = await stats();
  expect(s.q === 0 && s.correct === 6, 'undo should return to the empty tree (6/20 = majority class), got ' + JSON.stringify(s));
  await page.click('#tree .tnode[data-id="r"]');
  await page.click('#split-3');
  await page.waitForSelector('#tree .tnode[data-id="r-2"]');

  // 4) split the 4-legged group on "Feeds milk?" → both children pure
  await page.click('#tree .tnode[data-id="r-2"]');
  await page.click('#split-0');
  await page.waitForSelector('#tree .tnode[data-id="r-2-1"]');
  s = await stats();
  expect(s.q === 2 && s.correct === 17, 'after milk split on 4 legs: 17/20 expected, got ' + JSON.stringify(s));
  const pureGini = Number(await page.getAttribute('#tree .tnode[data-id="r-2-0"]', 'data-n'));
  expect(pureGini === 4, '4-legged milk group should have 4 mammals');

  // 5) test on the 6 held-out animals: blue whale, eagle, hilsa, gharial, squirrel, sea snake
  //    my tree: whale→Fish ✗, eagle→Bird ✓, hilsa→Fish ✓, gharial→Reptile ✓, squirrel→Mammal ✓, sea snake→Fish ✗
  const mine = await runTest();
  expect(mine === 4, 'my tree should get 4 of 6 test animals right, got ' + mine);
  expect((await page.getAttribute('#trow-0', 'data-ok')) === '0' && (await page.getAttribute('#trow-3', 'data-ok')) === '1', 'whale wrong, gharial right');
  expect((await page.textContent('#cmp-test-mine')).includes('67'), 'compare table should show 67% for my tree');

  // 6) the computer's Gini tree: 5 questions, 100% on training, 5 of 6 on test
  await page.click('#mode-auto');
  await page.waitForTimeout(150);
  s = await stats();
  expect(s.q === 5 && s.correct === 20, 'computer tree should use 5 questions and get 20/20, got ' + JSON.stringify(s));
  expect((await page.getAttribute('#tree .tnode[data-id="r"]', 'data-f')) === '3', 'computer should ask about legs first (lowest Gini)');
  const auto = await runTest();
  expect(auto === 5, 'computer tree should get 5 of 6 test animals right, got ' + auto);
  expect((await page.textContent('#cmp-test-auto')).includes('83'), 'compare table should show 83% for the computer');

  // 6b) changing the computer's max depth must not throw away MY test result (bug fix)
  await page.click('#depth-2');
  await page.waitForTimeout(100);
  expect((await page.textContent('#cmp-test-mine')).includes('67'), 'my 67% must survive a change of the computer max depth');
  expect(!/\d/.test(await page.textContent('#cmp-test-auto')), 'the depth-2 computer tree has not been tested yet');
  await page.click('#depth-0');
  await page.waitForTimeout(100);
  expect((await page.textContent('#cmp-test-auto')).includes('83'), 'back at no limit the computer 83% is still valid');
  expect(!(await page.$eval('#walk', (w) => w.classList.contains('live'))), 'the caption is only sticky while an example walks down the tree');

  // 6c) replay one example: the token walks, Run test is blocked meanwhile, then everything is released
  await page.click('#trow-5 .replay');
  await page.waitForTimeout(150);
  expect(await page.$eval('#run-test', (b) => b.disabled), 'Run test is disabled during a replay');
  await page.waitForFunction(() => !document.querySelector('#run-test').disabled, null, { timeout: 15000 });
  expect(await page.$eval('#token', (t) => t.hidden), 'token hidden after the replay');

  // 7) step-by-step growing
  await page.click('#step-start');
  await page.waitForTimeout(100);
  expect((await stats()).q === 0, 'grow step by step starts with no questions');
  await page.click('#step-next');
  await page.click('#step-next');
  await page.waitForTimeout(100);
  expect((await stats()).q === 2, 'two steps should show two questions');
  await page.click('#step-all');

  // 8) cricket data: depth 2 beats an unlimited tree on the test days (overfitting to Day 15)
  await page.click('#ds-cricket');
  await page.waitForSelector('#tree .tnode[data-id="r"][data-n="16"]');
  await page.click('#depth-0');
  await page.waitForTimeout(100);
  const deep = await runTest();
  await page.click('#depth-2');
  await page.waitForTimeout(100);
  s = await stats();
  expect(s.correct === 15, 'depth-2 cricket tree should get 15/16 training days, got ' + JSON.stringify(s));
  const shallow = await runTest();
  log('cricket test: no limit', deep, 'depth 2', shallow);
  expect(deep === 4 && shallow === 6, 'depth 2 should score 6/6 and no limit 4/6 on test days');

  // 9) Learn tab: Gini basket and overfitting chart
  await page.click('#tab-learn');
  expect((await page.$$eval('#depth-chart .cg.best', (a) => a.map((g) => g.dataset.d))).join() === '2', 'cricket chart marks depth 2 as the best depth');
  expect((await page.textContent('#gini-ex .gx-f')).includes('(10/16)') && (await page.getAttribute('#gini-ex .gx-f', 'dir')) === 'ltr', 'worked Gini example for 10 play / 6 no play');
  await page.click('#apple-minus');
  await page.click('#apple-minus');   // 1 apple, 1 mango → Gini 0.5
  const g = Number(await page.getAttribute('#basket-res', 'data-g'));
  expect(Math.abs(g - 0.5) < 1e-9, 'basket 1 apple + 1 mango should have Gini 0.5, got ' + g);
  expect((await page.getAttribute('#depth-chart .cg[data-d="2"]', 'data-test')) === '100', 'chart: depth 2 test accuracy 100%');

  // animals data has no noise: no "best depth" is marked, so the chart does not contradict its note
  await page.click('#ds-animals');
  await page.waitForTimeout(100);
  expect((await page.$$eval('#depth-chart .cg.best', (a) => a.length)) === 0, 'animals chart should not mark a best depth');

  // the worked example stays readable in Urdu (names in a right-to-left line, formula left-to-right)
  await page.evaluate(() => EDU.setLang('ur'));
  await page.waitForTimeout(150);
  expect((await page.getAttribute('#gini-ex .gx-names', 'dir')) === 'rtl', 'Urdu class names line is right-to-left');
  expect((await page.getAttribute('#gini-ex .gx-f', 'dir')) === 'ltr', 'formula stays left-to-right');
  await page.evaluate((l) => EDU.setLang(l), lang);
  await page.waitForTimeout(150);

  // 10) my animals tree AND its test result survive a dataset switch and a reload
  await page.click('#tab-build');
  await page.click('#mode-mine');
  expect((await page.textContent('#cmp-test-mine')).includes('67'), 'my animals test result survives a trip to the cricket data');
  // max depth is kept per dataset: depth 2 on the cricket data does not limit the animals tree
  await page.click('#mode-auto');
  expect((await page.getAttribute('#depth-0', 'aria-pressed')) === 'true', 'animals tree is still "no limit"');
  expect((await page.textContent('#cmp-test-auto')).includes('83'), 'computer animals result (83%) is still valid');
  await page.click('#ds-cricket');
  expect((await page.getAttribute('#depth-2', 'aria-pressed')) === 'true', 'cricket remembers depth 2');
  await page.click('#ds-animals');
  await page.click('#mode-mine');
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#tree .tnode[data-id="r"]');
  s = await stats();
  expect(s.q === 2 && s.correct === 17, 'my tree should be saved across reload, got ' + JSON.stringify(s));
  expect((await page.getAttribute('#test-summary', 'data-done')) === '1' && (await page.getAttribute('#test-summary', 'data-correct')) === '4', 'my test result (4/6) is kept after a reload');
  expect((await page.getAttribute('#trow-5', 'data-ok')) === '0', 'sea snake row still marked wrong after reload');
  // editing the tree makes the old result stale; undo brings it back
  await page.click('#tree .tnode[data-id="r-0"]');
  await page.click('#split-2');
  await page.waitForSelector('#tree .tnode[data-id="r-0-1"]');
  expect((await page.getAttribute('#test-summary', 'data-done')) === '0', 'a changed tree must be tested again');
  await page.click('#undo');
  await page.waitForTimeout(100);
  expect((await page.getAttribute('#test-summary', 'data-done')) === '1', 'undo returns to the tested tree');
  await runTest();
  await page.evaluate(() => window.scrollTo(0, 0));
};
