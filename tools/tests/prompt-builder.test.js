/* Interaction test for Prompt Builder (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, lang, expect, t }) {
  await page.waitForSelector('#preview', { state: 'attached' });
  const C = await page.evaluate((L) => window.APP_CONTENT[L], lang);
  const score = async () => +(await page.textContent('#q-score')).trim();
  const preview = async () => (await page.textContent('#preview')) || '';
  const dialogs = [];
  page.on('dialog', (d) => dialogs.push(d.message()));
  const other = lang === 'ta' ? 'bn' : 'ta';   // a second page language for the switching checks

  // 1) First visit: the "explain" template is loaded in the UI language, prompt is assembled in that language.
  expect((await page.inputValue('#f-task')) === C.templates.explain.task, 'default template task loaded in ' + lang);
  let pv = await preview();
  expect(pv.includes(C.asm.lang), 'preview contains the answer-language line');
  expect(pv.includes(C.asm.audv.c6_8), 'preview contains the audience phrase');
  expect((await score()) === 85, 'template has all six parts but unfilled [blanks] → 85, got ' + (await score()));
  expect((await page.$$('#q-tips .tip-br')).length === 1, 'tip about [square brackets] is shown');
  // An untouched template follows the page language (re-localised), and comes back.
  await page.selectOption('#edu-lang', other);
  const O = await page.evaluate((L) => window.APP_CONTENT[L], other);
  expect((await page.inputValue('#f-task')) === O.templates.explain.task, 'untouched template re-localised to ' + other);
  expect((await page.inputValue('#f-lang')) === other, 'answer language follows the page language while untouched');
  await page.selectOption('#edu-lang', lang);
  expect((await page.inputValue('#f-task')) === C.templates.explain.task, 'template back in ' + lang);
  await page.fill('#f-task', C.templates.explain.task.replace(/\[[^\]]*\]/g, 'friction'));
  expect((await score()) === 100, 'filling the [blank] gives 100, got ' + (await score()));
  expect((await page.$$('#q-tips .tip-br')).length === 0, 'bracket tip disappears');

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

  // Switching the page language must not turn typed English into a mixed-language prompt.
  await page.selectOption('#edu-lang', other);
  expect((await page.inputValue('#f-lang')) === lang, 'typed prompt keeps its answer language when the page language changes');
  pv = await preview();
  expect(pv.includes(C.asm.role.replace('{x}', 'a friendly maths teacher')), 'scaffold stays in ' + lang + ' after the page language changes');
  await page.selectOption('#edu-lang', lang);

  // Numbered rules lose their "1." marker, but a decimal such as 3.5 is kept.
  await page.fill('#f-cons', ['1. Keep it short', '3.5 marks for each answer'].join(String.fromCharCode(10)));
  pv = await preview();
  expect(pv.includes('- Keep it short') && pv.includes('- 3.5 marks for each answer'), 'list markers stripped, decimals kept');
  await page.fill('#f-cons', '');

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
  expect(await page.isVisible('#preview-card #pii'), 'warning is shown next to the Copy button');
  await page.fill('#f-context', 'Aadhaar 2345 6789 0123, email ravi@example.com');
  const piiText = await page.textContent('#pii');
  expect(piiText.includes(t('pii_aadhaar')) && piiText.includes(t('pii_email')), 'Aadhaar-like number and email both named in the warning');
  await page.fill('#f-context', 'Class 6, NCERT Maths chapter on fractions');
  expect(await page.isHidden('#pii'), 'warning disappears when the number is removed');

  // 6) Save a favourite.
  await page.fill('#fav-name', 'Fractions table');
  await page.click('#btn-save');
  expect((await page.$$('#favs .fav')).length === 1, 'one favourite saved');
  expect((await page.textContent('#favs .fav-name')).includes('Fractions table'), 'favourite has its name');
  await page.click('#btn-save');
  expect((await page.$$('#favs .fav')).length === 1, 'pressing Save again does not add a copy');

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

  // 10) A shared link (#p=...) opens the same prompt on another device.
  const shared = { role: 'a Class 8 maths teacher', task: 'Make 5 word problems on percentages using Indian prices in Rs', context: 'Class 8, NCERT chapter Comparing Quantities', aud: 'c6_8', fmt: 'list', tone: 'friendly', len: 'short', cons: 'Give an answer key at the end.', ex: '', alang: lang };
  const packed = await page.evaluate((o) => EDU.pack(o), shared);
  const base = page.url().split('#')[0];
  // (a) pasted into a tab where the app is already open: only the #hash changes
  await page.goto(base + '#p=' + packed);
  await page.waitForTimeout(400);
  expect((await page.inputValue('#f-task')) === shared.task, 'shared link (same tab) fills the task');
  expect(dialogs.filter((m) => m === t('confirm_load')).length === 1, 'same-tab shared link asks before replacing an unsaved prompt');
  // (b) opened fresh (e.g. from WhatsApp) over an unsaved prompt: asks first, too
  await page.fill('#f-task', 'My unsaved work on fractions for Class 6 students');
  await page.goto('about:blank');
  await page.goto(base + '#p=' + packed, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  expect(dialogs.filter((m) => m === t('confirm_load')).length === 2, 'fresh page load of a shared link asks before replacing an unsaved prompt');
  expect((await page.inputValue('#f-task')) === shared.task, 'shared link fills the task');
  expect((await page.inputValue('#f-fmt')) === 'list', 'shared link sets the format');
  expect(!page.url().includes('#p='), 'share hash is removed after loading');
  expect((await score()) === 100, 'shared prompt scores 100, got ' + (await score()));

  // 11) A damaged favourite (bad timestamp, empty prompt) must not break the app.
  await page.evaluate(() => localStorage.setItem('edu.prompt-builder.favs', JSON.stringify([
    { id: 'a', name: 'old', at: 1e20, s: { task: 'Explain the water cycle to Class 5' } }, { id: 'b', s: 'broken' }, null])));
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(400);
  expect((await page.$$('#favs .fav')).length === 1, 'damaged favourites skipped, good one shown');
  expect((await preview()).includes(shared.task), 'prompt still renders with damaged storage');
};
