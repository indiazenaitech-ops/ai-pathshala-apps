/* Interaction test for Ohm's Law & Circuits (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, lang, expect, t, log }) {
  const near = (a, b, tol) => Math.abs(a - b) <= (tol === undefined ? 0.011 : tol);
  const val = async (sel) => Number(await page.getAttribute(sel, 'data-value'));
  const rows = async () => (await page.$$('#exp-table tr.exp-row')).length;

  await page.waitForSelector('#preset-series2');

  // 1) series 10 Ω + 20 Ω on 6 V: R = 30 Ω, I = 0.2 A, V across R2 = 4 V; working and meters agree
  await page.click('#preset-series2');
  await page.fill('#v-num', '6');
  await page.fill('#r1-num', '10');
  await page.fill('#r2-num', '20');
  expect(near(await val('#out-req'), 30, 1e-9), 'series 10 + 20 = 30 Ω, got ' + await val('#out-req'));
  expect(near(await val('#out-i'), 0.2, 1e-9), 'I = 6 / 30 = 0.2 A, got ' + await val('#out-i'));
  expect(near(Number(await page.getAttribute('#calc-table tr[data-k="1"]', 'data-v')), 4, 1e-9), 'V across R2 = 0.2 × 20 = 4 V');
  const steps = (await page.textContent('#calc-steps')).replace(/ /g, ' ');
  expect(steps.includes('10 + 20 = 30 Ω') && steps.includes('6 / 30 = 0.2 A'), 'working shows the substituted values: ' + steps.slice(0, 160));
  const am = await page.textContent('#cv-lab .read.a');
  expect(am.includes('0.2') && am.includes('A'), 'ammeter in the diagram reads 0.2 A: ' + am);
  const pos = () => page.$eval('#cv-lab .dots circle', c => c.getAttribute('cx') + ',' + c.getAttribute('cy'));
  const d1 = await pos(); await page.waitForTimeout(500); const d2 = await pos();
  expect(d1 !== d2, 'current dots move while current flows (' + d1 + ' → ' + d2 + ')');

  // 2) parallel 10 ‖ 20 on 6 V: R = 6.67 Ω, I = 0.6 + 0.3 = 0.9 A
  await page.click('#preset-parallel2');
  expect(near(await val('#out-req'), 20 / 3, 1e-9), 'parallel 10 ‖ 20 = 6.67 Ω');
  expect(near(await val('#out-i'), 0.9, 1e-9), 'parallel total current 0.9 A');
  expect(await page.isVisible('#calc-check'), 'the branch-current check is shown');
  const pw = (await page.textContent('#calc-steps')).replace(/\u00a0/g, ' ');
  expect(pw.includes('1/10 + 1/20 = 2/20 + 1/20 = 3/20') && pw.includes('R = 20/3 ≈ 6.67 Ω'), 'parallel working adds fractions with a common denominator (NCERT way): ' + pw.slice(0, 200));
  expect(pw.includes('6 / 6.67 ≈ 0.9 A'), 'a step that uses a rounded number says ≈, not =');
  const speeds = async () => page.$$eval('#cv-lab polyline.wire', els => { const o = {}; els.forEach(e => { o[e.getAttribute('data-cur')] = Number(e.getAttribute('data-speed')); }); return o; });
  let sp = await speeds();
  expect(near(sp['0'] / sp['1'], 2, 0.01) && near(sp.T / sp['0'], 1.5, 0.01), 'dot speed ∝ current: 0.6 A branch twice as fast as 0.3 A, ' + JSON.stringify(sp));
  // big currents (12 V across 1 Ω ‖ 2 Ω = 12 A + 6 A): speeds stay in proportion instead of all hitting the cap
  await page.fill('#v-num', '12'); await page.fill('#r1-num', '1'); await page.fill('#r2-num', '2');
  sp = await speeds();
  expect(near(sp['0'] / sp['1'], 2, 0.01) && near(sp.T / sp['0'], 1.5, 0.01) && sp.T <= 300, 'large currents keep proportional dot speeds: ' + JSON.stringify(sp));
  await page.fill('#v-num', '6'); await page.fill('#r1-num', '10'); await page.fill('#r2-num', '20');

  // 3) mixed R1 + (R2 ‖ R3) with 10, 20, 30: R23 = 12, R = 22, I2 + I3 = I1
  await page.click('#preset-mixedA');
  await page.fill('#r3-num', '30');
  expect(near(await val('#out-req'), 22, 1e-9), 'mixed 10 + (20 ‖ 30) = 22 Ω, got ' + await val('#out-req'));
  const i2 = Number(await page.getAttribute('#calc-table tr[data-k="1"]', 'data-i'));
  const i3 = Number(await page.getAttribute('#calc-table tr[data-k="2"]', 'data-i'));
  expect(near(i2 + i3, 6 / 22, 1e-9), 'I2 + I3 equals the current through R1');

  // 4) bulbs: R1 (in the main line) glows brightest, R3 dimmest
  await page.click('#as-bulb');
  const glows = await page.$$eval('#cv-lab circle.bulb', els => els.map(e => Number(e.getAttribute('data-glow'))));
  expect(glows.length === 3 && glows[0] > glows[1] && glows[1] > glows[2], 'bulb brightness follows power: ' + glows.join(', '));
  expect(await page.isVisible('#bright-note'), 'brightest-bulb note is shown');

  // 5) tapping the switch in the diagram opens the circuit; the button closes it again
  await page.click('#cv-lab .hit');
  expect((await val('#out-i')) === 0 && await page.isVisible('#warn-open'), 'open switch: no current and a warning');
  await page.click('#btn-switch');
  expect((await val('#out-i')) > 0 && !(await page.isVisible('#warn-open')), 'closing the switch brings the current back');

  // 6) short circuit and near-short warnings
  await page.click('#btn-short');
  expect(await page.isVisible('#warn-short'), 'short-circuit warning shown');
  expect((await page.textContent('#out-i')).trim() === t('very_large'), 'total current reads “very large” in this language');
  await page.click('#btn-short');
  expect(!(await page.isVisible('#warn-short')), 'removing the short clears the warning');
  await page.click('#preset-parallel3');
  for (const id of ['#r1-num', '#r2-num', '#r3-num']) await page.fill(id, '1');
  expect(near(await val('#out-req'), 1 / 3, 1e-9) && await page.isVisible('#warn-low'), 'three 1 Ω in parallel = 0.33 Ω gives a near-short warning');
  expect(await page.getAttribute('#bright-note', 'data-top') === 'R₁,R₂,R₃', 'three equal bulbs glow equally');
  await page.fill('#r3-num', '2');
  expect(await page.getAttribute('#bright-note', 'data-top') === 'R₁,R₂', 'two equally bright bulbs are both named, got ' + await page.getAttribute('#bright-note', 'data-top'));
  expect((await page.textContent('#bright-note')).includes('R₁, R₂'), 'tie message lists R1 and R2');

  // full screen (smartboard) keeps the sliders next to the diagram
  if (await page.evaluate(() => document.fullscreenEnabled)) {
    await page.click('#btn-fs');
    await page.waitForTimeout(300);
    const fs = await page.evaluate(() => !!document.fullscreenElement && document.fullscreenElement.contains(document.getElementById('v-range')) && document.fullscreenElement.contains(document.getElementById('cv-lab')));
    await page.click('#btn-fs');
    await page.waitForTimeout(300);
    expect(fs, 'full screen shows the diagram together with the sliders');
  }

  // 7) V–I experiment: known 10 Ω, four readings → slope 10 Ω and a 4-point graph
  await page.click('#tab-exp');
  await page.waitForSelector('#exp-card', { state: 'visible' });
  await page.click('#exp-known');
  await page.fill('#exp-r-num', '10');
  await page.click('#exp-quick');
  expect(await rows() === 4, 'four readings recorded, got ' + await rows());
  expect(near(await val('#exp-slope'), 10, 1e-9), 'slope of V–I graph = 10 Ω, got ' + await val('#exp-slope'));
  expect((await page.$$('#exp-graph circle.pt')).length === 4, 'graph shows the four points');
  expect(await page.isDisabled('#exp-mystery'), 'resistor choice is locked while the table has readings');

  // meter errors on and the same number of cells twice: no slope yet (it would be meaningless), then a real one
  await page.click('#exp-clear');
  await page.check('#exp-noise');
  await page.focus('#exp-cells');
  await page.keyboard.press('Home');
  await page.click('#exp-record');
  await page.click('#exp-record');
  expect(await rows() === 2 && !(await page.$('#exp-slope')), 'two readings with 1 cell give no slope, even with meter errors');
  await page.focus('#exp-cells');
  await page.keyboard.press('End');
  await page.click('#exp-record');
  const ns = await val('#exp-slope');
  expect(ns > 8.5 && ns < 11.5, 'slope from 1 and 8 cells with meter errors is close to 10 Ω, got ' + ns);
  await page.uncheck('#exp-noise');
  await page.click('#exp-clear');
  for (let k = 0; k < 40; k++) await page.click('#exp-record');
  expect(await rows() === 40 && await page.isDisabled('#exp-record'), 'the table stops at 40 readings and the Record button is disabled');

  // mystery wire: clear, record 2 readings, reveal → slope matches the hidden R
  await page.click('#exp-clear');
  expect(await rows() === 0, 'table cleared');
  await page.click('#exp-mystery');
  expect((await page.textContent('#cv-exp')).includes('R = ?'), 'mystery wire value is hidden in the diagram');
  await page.click('#exp-record');
  await page.focus('#exp-cells');
  await page.keyboard.press('Home');
  await page.click('#exp-record');
  expect(await rows() === 2, 'two readings recorded');
  await page.click('#exp-reveal');
  const rTrue = Number(await page.getAttribute('#exp-reveal-out', 'data-r'));
  const slope = await val('#exp-slope');
  log('mystery R', rTrue, 'slope', slope);
  expect(rTrue > 0 && Math.abs(slope - rTrue) / rTrue < 0.02, 'graph slope finds the mystery R (' + slope + ' vs ' + rTrue + ')');

  // 8) practice: right then wrong answer, score and solution
  await page.click('#tab-prac');
  await page.waitForSelector('#prac-card', { state: 'visible' });
  const ans = await page.getAttribute('#prac-card', 'data-answer');
  log('practice', await page.getAttribute('#prac-card', 'data-type'), ans);
  await page.fill('#q-ans', ans);
  await page.click('#q-check');
  expect(await page.getAttribute('#q-feedback', 'data-result') === 'right', 'exact answer is marked right');
  expect(await page.getAttribute('#score', 'data-c') === '1' && await page.getAttribute('#score', 'data-n') === '1', 'score 1 / 1');
  expect(await page.isVisible('#q-solution'), 'worked solution shown after checking');
  await page.click('#q-new');
  const a2 = Number(await page.getAttribute('#prac-card', 'data-answer'));
  await page.fill('#q-ans', String(a2 * 3 + 7));
  await page.click('#q-check');
  expect(await page.getAttribute('#q-feedback', 'data-result') === 'wrong', 'far-off answer is marked wrong');
  expect(await page.getAttribute('#score', 'data-c') === '1' && await page.getAttribute('#score', 'data-n') === '2', 'score 1 / 2');
  // an answer typed as a fraction with a label in front ("= 12/40") is understood
  await page.click('#q-new');
  const a3 = Number(await page.getAttribute('#prac-card', 'data-answer'));
  const typed = '= ' + (a3 * 8) + '/8';
  await page.fill('#q-ans', typed);
  await page.click('#q-check');
  expect(await page.getAttribute('#q-feedback', 'data-result') === 'right', 'fraction answer "' + typed + '" accepted');
  expect(await page.getAttribute('#score', 'data-c') === '2' && await page.getAttribute('#score', 'data-n') === '3', 'score 2 / 3');

  // 9) worksheet with answer key
  await page.click('#ws-make');
  expect((await page.$$('#ws-list li')).length === 10 && (await page.$$('#ws-key li')).length === 10, 'worksheet has 10 problems and 10 answers');

  // 10) phone width in Tamil: long words never clipped, nothing scrolls sideways
  const vp = page.viewportSize();
  await page.click('#tab-lab');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => EDU.setLang('ta'));
  await page.waitForTimeout(250);
  const clipped = await page.$$eval('#presets .cl-preset .pt, #presets .cl-preset, .cl-sym > span, .cl-stat .k', els => els.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent.slice(0, 20)));
  expect(clipped.length === 0, 'no clipped labels in Tamil at 390 px: ' + clipped.join(' | '));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth) <= 0, 'no sideways scroll in Tamil at 390 px');
  await page.click('#tab-exp');
  expect(await page.evaluate(() => { const tb = document.getElementById('exp-table'); return tb.scrollWidth <= tb.parentNode.clientWidth + 1; }), 'observation table fits a 390 px phone in Tamil');
  await page.evaluate(L => EDU.setLang(L), lang);
  await page.setViewportSize(vp);
  await page.click('#tab-prac');

  // 11) everything survives a reload
  await page.waitForTimeout(200);
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#score');
  expect(await page.isVisible('#pane-prac'), 'practice tab remembered');
  expect(await page.getAttribute('#score', 'data-n') === '3', 'score remembered');
  await page.click('#tab-exp');
  expect(await rows() === 2, 'experiment readings remembered');
  await page.click('#tab-lab');
  expect(await page.getAttribute('#preset-parallel3', 'aria-pressed') === 'true' && await page.getAttribute('#as-bulb', 'aria-pressed') === 'true', 'circuit type and bulb view remembered');
};
