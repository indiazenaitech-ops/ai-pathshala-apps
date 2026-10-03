/* Interaction test for AI Project Cycle Canvas (run by tools/verify.js in en and hi). */
const fs = require('fs');

module.exports = async function ({ page, lang, expect, t }) {
  await page.waitForSelector('#stepper .step-btn');
  const C = await page.evaluate((L) => window.APP_CONTENT[L], lang);
  const count = () => page.$$eval('#proj-select option', (os) => os.length);
  const overall = async () => (await page.textContent('#overall')).trim();
  const ps = async () => (await page.textContent('#ps-preview')).trim();

  // 1) First visit: sample 1 (food waste) opens in the UI language and is 100% filled.
  const s0 = C.samples[0];
  expect((await count()) === 1, 'one project on first visit, got ' + (await count()));
  expect((await page.inputValue('#f-title')) === s0.title, 'sample title loaded in ' + lang);
  expect((await overall()) === t('overall', { p: 100 }), 'sample is 100% filled, got ' + (await overall()));
  expect((await ps()) === t('ps_sentence', { who: s0.ps_who, what: s0.ps_what, where: s0.ps_where, why: s0.ps_why }), 'sample problem statement assembled');
  expect(await page.isVisible('#sample-note'), 'sample note is shown');
  expect((await page.$$('#stepper .step-btn.done')).length === 7, 'all 7 stages ticked for the sample');

  // 2) New blank project; fill the 4Ws and use "Fill blanks from the 4Ws".
  await page.click('#btn-new');
  expect((await count()) === 2, 'two projects after New');
  expect((await overall()) === t('overall', { p: 0 }), 'blank project is 0%, got ' + (await overall()));
  expect(await page.isHidden('#sample-note'), 'no sample note on own project');
  await page.fill('#f-title', 'Clean Yamuna Ghat');
  await page.fill('#f-who', 'Boatmen and visitors at the ghat.\nShopkeepers');
  await page.fill('#f-what', 'Plastic waste floats in the river');
  await page.fill('#f-where', 'At the ghat after festivals');
  await page.fill('#f-why_value', 'Know when and where to send cleaning teams');
  await page.click('#ps-fill');
  expect((await page.inputValue('#f-ps_who')) === 'Boatmen and visitors at the ghat', 'first line copied without the full stop');
  expect((await ps()) === t('ps_sentence', { who: 'Boatmen and visitors at the ghat', what: 'Plastic waste floats in the river', where: 'At the ghat after festivals', why: 'Know when and where to send cleaning teams' }), 'statement built from the 4Ws');
  // 8 of 31 items filled → 26 %
  expect((await overall()) === t('overall', { p: 26 }), '8/31 filled = 26%, got ' + (await overall()));
  expect((await page.textContent('#proj-select option:checked')).includes('Clean Yamuna Ghat'), 'project list shows the new name');

  // 3) Step 2: data sources and features.
  await page.click('#btn-next');
  expect((await page.textContent('#stage-title')).trim() === t('st2'), 'stage 2 title shown');
  expect(await page.isVisible('#opts-sources'), 'sources visible on step 2');
  await page.click('#opt-sources-survey');
  await page.click('#opt-sources-sensor');
  expect((await page.getAttribute('#opt-sources-survey', 'aria-pressed')) === 'true', 'survey chip pressed');
  await page.fill('#f-features', 'Date\nKg of plastic\n\nLocation');
  expect((await page.textContent('#feat-count')).trim() === t('feat_count', { n: 3 }), 'blank lines are not counted as features');
  expect((await overall()) === t('overall', { p: 32 }), '10/31 filled = 32%, got ' + (await overall()));

  // 4) Step 4 via the stepper: approach changes the questions.
  await page.click('#step-4');
  await page.click('#ap-learn');
  expect(await page.isVisible('#task-wrap'), 'learning tasks appear for learning-based');
  expect((await page.textContent('#l-model_how')).trim() === t('q_model_how_learn'), 'training-data question for learning-based');
  await page.click('#tk-class');
  expect((await page.getAttribute('#tk-class', 'aria-pressed')) === 'true', 'classification chosen');
  await page.click('#ap-rule');
  expect(await page.isHidden('#task-wrap'), 'task options hidden for rule-based');
  expect((await page.textContent('#l-model_how')).trim() === t('q_model_how_rule'), 'rules question for rule-based');

  // 5) Step 7: ethics checklist score.
  await page.click('#step-7');
  await page.check('#ec-c1');
  await page.check('#ec-c4');
  expect((await page.textContent('#eth-score')).trim() === t('eth_score', { n: 2, total: 8 }), 'ethics score 2 of 8');

  // 6) Full canvas shows the answers; download as text.
  await page.click('#step-8');
  expect(await page.isVisible('#canvas'), 'canvas visible on step 8');
  const cv = await page.textContent('#canvas');
  expect(cv.includes('Clean Yamuna Ghat') && cv.includes(t('src_survey')) && cv.includes(t('ap_rule')) && cv.includes(t('ec4')), 'canvas shows typed text, sources, approach and ethics');
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#btn-txt')]);
  expect(dl.suggestedFilename() === 'Clean-Yamuna-Ghat.txt', 'text file name from the title, got ' + dl.suggestedFilename());
  const file = await dl.path();
  const txt = fs.readFileSync(file, 'utf8');
  expect(txt.includes('Plastic waste floats in the river') && txt.includes(t('st5')) && txt.includes('[x] ' + t('ec1')), 'downloaded text contains answers, stages and ticks');

  // 7) Everything survives a reload (autosave), including the current step.
  await page.waitForTimeout(500);
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(700);
  expect((await count()) === 2, 'two projects after reload');
  expect((await page.inputValue('#f-title')) === 'Clean Yamuna Ghat', 'current project restored');
  expect(await page.isVisible('#canvas'), 'returns to the Full canvas step');
  expect((await overall()) === t('overall', { p: 35 }), '11/31 filled after reload = 35%, got ' + (await overall()));

  // 8) Open sample 3 (rule-based water warning), then delete it.
  await page.click('#sample-2');
  expect((await count()) === 3, 'sample opened as a third project');
  expect((await page.inputValue('#f-title')) === C.samples[2].title, 'water sample title');
  expect((await page.getAttribute('#ap-rule', 'aria-pressed')) === 'true', 'water sample is rule-based');
  await page.click('#btn-del');
  expect((await count()) === 2, 'project deleted (confirm accepted)');
};
