/* Interaction test for Equation Solver with Steps (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, log }) {
  const attr = (sel, a) => page.getAttribute(sel, a);
  const solveLin = async (eq) => { await page.fill('#lin-eq', eq); await page.click('#lin-solve'); await page.waitForTimeout(80); };
  const solvePair = async (e1, e2, method) => {
    await page.click('#pim-type'); await page.click('#pm-' + method);
    await page.fill('#pair-eq1', e1); await page.fill('#pair-eq2', e2); await page.click('#pair-solve'); await page.waitForTimeout(80);
  };
  const solveQuad = async (eq, method) => { await page.click('#qm-' + method); await page.fill('#quad-eq', eq); await page.click('#quad-solve'); await page.waitForTimeout(80); };
  const stepKeys = async (sel) => page.$$eval(sel + ' .step', a => a.map(x => x.dataset.key));
  await page.evaluate(() => { window.print = function () { }; });

  // default example solved on load
  await page.waitForSelector('#lin-result .step');
  expect((await attr('#lin-result', 'data-x')) === '-12', '3x+5=2x-7 → x = −12 (default), got ' + (await attr('#lin-result', 'data-x')));

  // --- linear ---
  await solveLin('2(x-3) = 4x + 1');
  expect((await attr('#lin-result', 'data-x')) === '-7/2', '2(x−3)=4x+1 → x = −7/2');
  expect((await stepKeys('#lin-result')).includes('step_expand'), 'brackets produce an expand step');
  await solveLin('x/2 + 3 = 7');
  expect((await attr('#lin-result', 'data-x')) === '8' && (await stepKeys('#lin-result')).includes('step_clear_fractions'), 'x/2+3=7 → 8 with clear-fractions step');
  await solveLin('2x+1=2x+3');
  expect((await attr('#lin-result', 'data-status')) === 'none', '2x+1=2x+3 has no solution');
  await solveLin('3(x-1) = 3x - 3');
  expect((await attr('#lin-result', 'data-status')) === 'identity', '3(x−1)=3x−3 is an identity');
  await solveLin('3x+ = 5');
  expect((await attr('#lin-result', 'data-status')) === 'error' && (await page.$('#lin-result .err')) !== null, 'bad input shows a friendly error');
  await solveLin('x^2 + 1 = 5');
  expect((await attr('#lin-result', 'data-status')) === 'error', 'quadratic typed in linear tab gives an error message');
  // the check step appears for a real solution
  await solveLin('3x + 5 = 2x - 7');
  expect((await stepKeys('#lin-result')).slice(-1)[0] === 'step_check', 'last step is the substitution check');

  // --- pair of linear equations: all three methods ---
  await page.click('#tab-pair');
  for (const m of ['substitution', 'elimination', 'cross']) {
    await solvePair('2x+3y=12', 'x-y=1', m);
    expect((await attr('#pair-result', 'data-x')) === '3' && (await attr('#pair-result', 'data-y')) === '2', m + ': (3, 2), got ' + (await attr('#pair-result', 'data-x')) + ',' + (await attr('#pair-result', 'data-y')));
    expect((await attr('#pair-result', 'data-method')) === m, 'method recorded as ' + m);
  }
  expect((await page.$$('#pair-result .cross-block')).length === 3, 'cross-multiplication layout has 3 blocks');
  expect((await page.$$('#pair-graph svg line.l1')).length === 1 && (await page.$$('#pair-graph circle.pt')).length === 1, 'graph shows line (1) and the intersection point');
  await solvePair('2x+3y=9', '4x+6y=18', 'substitution');
  expect((await attr('#pair-result', 'data-status')) === 'infinite' && (await page.$('#pair-result .consist.k-infinite')) !== null, '2x+3y=9 & 4x+6y=18 → infinitely many');
  await solvePair('x+2y=4', '2x+4y=12', 'elimination');
  expect((await attr('#pair-result', 'data-status')) === 'none' && (await page.$('#pair-result .consist.k-none')) !== null, 'x+2y=4 & 2x+4y=12 → no solution');
  expect((await page.$$('#pair-graph circle.pt')).length === 0, 'parallel lines: no intersection point drawn');
  // boxes input
  await page.click('#pim-boxes');
  for (const [id, v] of [['p-a1', '1'], ['p-b1', '1'], ['p-c1', '14'], ['p-a2', '1'], ['p-b2', '-1'], ['p-c2', '4']]) await page.fill('#' + id, v);
  await page.click('#pair-solve'); await page.waitForTimeout(80);
  expect((await attr('#pair-result', 'data-x')) === '9' && (await attr('#pair-result', 'data-y')) === '5', 'boxes x+y=14, x−y=4 → (9, 5)');
  await page.fill('#p-c2', 'abc'); await page.click('#pair-solve'); await page.waitForTimeout(80);
  expect((await attr('#pair-result', 'data-status')) === 'error', 'bad box value gives an error');

  // --- quadratic ---
  await page.click('#tab-quad');
  await solveQuad('x^2 - 5x + 6 = 0', 'factor');
  expect((await attr('#quad-result', 'data-roots')) === '2,3', 'x²−5x+6 → 2, 3, got ' + (await attr('#quad-result', 'data-roots')));
  expect((await attr('#quad-result', 'data-p')) === '-2' && (await attr('#quad-result', 'data-q')) === '-3', 'middle term split p, q = −2, −3');
  expect((await attr('#quad-result', 'data-d')) === '1', 'D = 1');
  await solveQuad('x^2 + 2x + 5 = 0', 'formula');
  expect((await attr('#quad-result', 'data-d')) === '-16' && (await attr('#quad-result', 'data-status')) === 'none', 'x²+2x+5 → D = −16, no real roots');
  expect((await page.$$('#quad-graph circle.pt')).length === 0, 'no roots marked on the parabola when D < 0');
  await solveQuad('2x^2 - 4x - 3 = 0', 'formula');
  expect((await attr('#quad-result', 'data-roots')) === '2.581,-0.581', '2x²−4x−3 → 2.58, −0.58, got ' + (await attr('#quad-result', 'data-roots')));
  const exact = await page.$eval('#quad-result .ans-big', e => e.textContent);
  expect(exact.replace(/\s/g, '') === 'x=(2±√10)/2', 'exact roots (2 ± √10)/2, got ' + exact);
  await solveQuad('2x^2 - 4x - 3 = 0', 'square');
  expect((await stepKeys('#quad-result')).includes('step_sq_square'), 'completing the square shows the perfect-square step');
  await solveQuad('4x^2 - 12x + 9 = 0', 'factor');
  expect((await attr('#quad-result', 'data-status')) === 'equal' && (await attr('#quad-result', 'data-roots')) === '3/2', '4x²−12x+9 → equal roots 3/2');
  await solveQuad('6 = x^2 + 5x', 'factor');
  expect((await attr('#quad-result', 'data-roots')) === '-6,1', 'non-standard order 6 = x²+5x → −6, 1');
  expect((await page.$$('#quad-graph circle.pt')).length === 2 && (await page.$$('#quad-graph circle.vx')).length === 1, 'parabola marks 2 roots and the vertex');

  // --- word problems ---
  await page.click('#tab-word');
  await page.click('#wm-quad');
  expect((await page.$$('#word-list .wp')).length === 6, '6 quadratic word problems');
  await page.click('#wp-quad-0 .btn-primary'); await page.waitForTimeout(120);
  expect(!(await page.$eval('#panel-quad', e => e.hidden)) && (await attr('#quad-result', 'data-roots')) === '-18,17', 'word problem opens in the solver: x(x+1)=306 → −18, 17');

  // --- practice + worksheet ---
  await page.click('#tab-practice');
  await page.click('#prm-linear'); await page.click('#lv-easy');
  const p = await page.evaluate(() => JSON.parse(localStorage.getItem('edu.equation-solver.state')).pr.problem);
  const ans = p.answer.x.d === 1 ? String(p.answer.x.n) : p.answer.x.n + '/' + p.answer.x.d;
  await page.fill('#pr-x', ans); await page.click('#pr-check');
  expect((await attr('#pr-feedback', 'data-ok')) === 'ok', 'typing the generated answer ' + ans + ' is marked correct');
  await page.click('#pr-new'); await page.fill('#pr-x', '99999'); await page.click('#pr-check');
  expect((await attr('#pr-feedback', 'data-ok')) === 'bad', 'wrong answer is marked wrong');
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem('edu.equation-solver.state')).pr);
  expect(st.solved === 2 && st.correct === 1 && st.streak === 0, 'stats: 2 attempted, 1 correct, streak 0');
  await page.click('#pr-worksheet'); await page.waitForTimeout(200);
  expect((await page.$$('#worksheet .ws-q')).length === 10 && (await page.$$('#worksheet .ws-k')).length === 10, 'worksheet has 10 problems and 10 answer-key rows');

  // --- persistence after reload ---
  await page.click('#tab-quad');
  await solveQuad('x^2 - 7x + 12 = 0', 'formula');
  await page.reload({ waitUntil: 'load' }); await page.waitForSelector('#quad-result .step');
  expect((await page.inputValue('#quad-eq')) === 'x^2 - 7x + 12 = 0' && (await attr('#quad-result', 'data-roots')) === '3,4', 'last quadratic persists after reload and is re-solved');
  expect(!(await page.$eval('#panel-quad', e => e.hidden)), 'active tab persists after reload');

  // --- reset ---
  await page.click('#reset'); await page.waitForTimeout(100);
  expect((await page.inputValue('#quad-eq')) === 'x^2 - 5x + 6 = 0' && (await page.inputValue('#lin-eq')) === '3x + 5 = 2x - 7', 'reset restores the default equations');
  expect(!(await page.$eval('#panel-linear', e => e.hidden)), 'reset returns to the linear tab');
  log('equation-solver assertions passed');
};
