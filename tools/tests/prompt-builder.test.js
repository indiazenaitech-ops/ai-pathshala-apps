/* Interaction test for Prompt Builder (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, lang, expect }) {
  await page.waitForSelector('#preview', { state: 'attached' });
  const C = await page.evaluate((L) => window.APP_CONTENT[L], lang);
  const score = async () => +(await page.textContent('#q-score')).trim();
  const preview = async () => (await page.textContent('#preview')) || '';

  // 1) First visit: the "explain" template is loaded in the UI language, prompt is assembled in that language.
  expect((await page.inputValue('#f-task')) === C.templates.explain.task, 'default template task loaded in ' + lang);
  let pv = await preview();
  expect(pv.includes(C.asm.lang), 'preview contains the answer-language line');
  expect(pv.includes(C.asm.audv.c6_8), 'preview contains the audience phrase');
  expect((await score()) === 90, 'template has all six parts but unfilled [blanks] → 90, got ' + (await score()));
  expect((await page.$$('#q-tips .tip-br')).length === 1, 'tip about [square brackets] is shown');

  // 2) Clear the form (confirm is auto-accepted).
  await page.click('#btn-reset');
  expect((await page.inputValue('#f-task')) === '', 'task cleared');
  expect(await page.isHidden('#preview'), 'preview hidden when the form is empty');
  expect((await score()) === 0, 'score 0 after clearing');

  // 3) Build a prompt by hand; the quality meter adds up the parts.
  await page.fill('#f-role', 'a friendly maths teacher');
  await page.fill('#f-task', 'Explain fractions with 3 examples from an Indian market');
  expect((await score()) === 45, 'role + task = 45, got ' + (await score()));
  await page.selectOption('#f-aud', 'c6_8');
  await page.selectOption('#f-fmt', 'table');
  expect((await score()) === 75, 'role + task + audience + format = 75, got ' + (await score()));
  pv = await preview();
  expect(pv.includes(C.asm.role.replace('{x}', 'a friendly maths teacher')), 'role sentence assembled in ' + lang);
  expect(pv.includes(C.asm.fmt.table), 'table format sentence in preview');

  await page.click('#chips .chip[data-chip="0"]');
  expect((await page.inputValue('#f-cons')).trim() === C.chips[0].text, 'quick-add chip inserts its rule');
  expect((await page.getAttribute('#chips .chip[data-chip="0"]', 'aria-pressed')) === 'true', 'chip shows as pressed');
  await page.fill('#f-context', 'Class 6, NCERT Maths chapter on fractions');
  expect((await score()) === 100, 'all six parts = 100, got ' + (await score()));
  expect((await page.$$('#q-list li.ok')).length === 6, 'six ticks in the checklist');

  // 4) Answer language: Tamil, then Urdu (right-to-left preview).
  await page.selectOption('#f-lang', 'ta');
  const TA = await page.evaluate(() => window.APP_CONTENT.ta.asm);
  pv = await preview();
  expect(pv.includes(TA.lang) && pv.includes(TA.audv.c6_8), 'prompt re-assembled in Tamil');
  expect(pv.includes(TA.role.replace('{x}', 'a friendly maths teacher')), 'Tamil role frame used');
  await page.selectOption('#f-lang', 'ur');
  expect((await page.getAttribute('#preview', 'dir')) === 'rtl', 'Urdu preview is right-to-left');

  // 5) Personal-data warning.
  await page.fill('#f-context', 'Call Ramesh on 98765 43210 about the test');
  expect(await page.isVisible('#pii'), 'phone number triggers the personal-data warning');
  await page.fill('#f-context', 'Class 6, NCERT Maths chapter on fractions');
  expect(await page.isHidden('#pii'), 'warning disappears when the number is removed');

  // 6) Save a favourite.
  await page.fill('#fav-name', 'Fractions table');
  await page.click('#btn-save');
  expect((await page.$$('#favs .fav')).length === 1, 'one favourite saved');
  expect((await page.textContent('#favs .fav-name')).includes('Fractions table'), 'favourite has its name');

  // 7) Template gallery fills the form in the answer language (Urdu).
  await page.click('.tpl[data-tpl="mcq10"]');
  const UR = await page.evaluate(() => window.APP_CONTENT.ur);
  expect((await page.inputValue('#f-fmt')) === 'quiz', 'MCQ template sets the quiz format');
  expect((await page.inputValue('#f-task')) === UR.templates.mcq10.task, 'template text is in the answer language');

  // 8) Everything survives a reload.
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(600);
  expect((await page.$$('#favs .fav')).length === 1, 'favourite persists after reload');
  expect((await page.inputValue('#f-fmt')) === 'quiz', 'draft persists after reload');
  expect((await page.inputValue('#f-lang')) === 'ur', 'answer language persists after reload');

  // 9) Load the favourite back, switch the answer language back, copy.
  await page.click('#favs .fav-load');
  expect((await page.inputValue('#f-task')) === 'Explain fractions with 3 examples from an Indian market', 'favourite loads back');
  await page.selectOption('#f-lang', lang);
  pv = await preview();
  expect(pv.includes(C.asm.rules) && pv.includes(C.chips[0].text), 'rules section assembled');
  await page.click('#btn-copy');
  await page.waitForSelector('.edu-toast', { timeout: 3000 });
};
