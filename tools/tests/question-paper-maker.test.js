/* Interaction test for Question Paper Maker (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, t }) {
  const settle = () => page.waitForTimeout(260);                 // the paper view is debounced by 120 ms
  const tot = () => page.$eval('#total', (e) => ({ total: +e.dataset.total, state: e.dataset.state, n: +e.dataset.questions }));
  const nums = (sel) => page.$$eval(sel + ' .p-q', (els) => els.map((e) => e.querySelector('.n').textContent.trim()).join(' '));
  const paperText = () => page.$eval('#paperView', (e) => e.innerText);
  const keyText = () => page.$eval('#keyView', (e) => e.textContent);
  await page.evaluate(() => { window.__printed = []; window.print = () => { window.__printed.push(document.querySelector('#keyView').hidden ? 'paper' : 'key'); }; });

  // 1. opens with a short sample paper in the page language; total matches the maximum
  await page.waitForSelector('#paperView .p-q', { timeout: 15000 });
  expect(await page.isVisible('#sampleNote'), 'sample note shown');
  let s = await tot();
  expect(s.n === 6 && s.total === 10 && s.state === 'ok', 'sample: 6 questions, 10 marks, matches maximum: ' + JSON.stringify(s));
  expect((await nums('#paperView')) === '1. 2. 3. 4. 5. 6.', 'questions are numbered 1 to 6 across sections');
  let txt = await paperText();
  expect(txt.includes(t('s_school')) && txt.includes(t('s_mcq')) && txt.includes(t('p_section', { x: 'C' })), 'sample school, question and Section C on the paper');
  expect(txt.includes(t('p_marks_each', { n: 3, m: 1, t: 3 })) && txt.includes(t('p_or')), 'section marks line and OR choice printed');
  expect((await page.$$('#paperView .p-blank')).length === 1, 'underscores become a blank line');
  expect((await page.inputValue('#fMax')) === '10', 'maximum marks field shows 10');

  // 2. the answer key: MCQ letter, blank, true/false, match pairs follow the shuffled column
  await page.click('#view-key');
  let key = await keyText();
  expect(key.includes('(c) ' + t('s_mcq_c')) && key.includes('100') && key.includes(t('p_true')), 'key has (c), 100 and True: ' + key.slice(0, 160));
  await page.click('#view-paper');
  const match = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('#paperView .p-match tr')].slice(1).map((r) => [...r.children].map((c) => c.textContent.replace(/^\(\w+\)\s*/, '').trim()));
    const keyRow = [...document.querySelectorAll('#keyView .p-q')][4].querySelector('.p-ans').textContent;
    return { left: rows.map((r) => r[0]), right: rows.map((r) => r[1]), key: keyRow };
  });
  const want = [t('s_m1r'), t('s_m2r'), t('s_m3r')];
  expect(match.right.slice().sort().join('|') === want.slice().sort().join('|') && match.right.join('|') !== want.join('|'), 'right column holds the same answers in a mixed order: ' + match.right.join(','));
  const pairs = match.key.split(',').map((x) => x.trim().match(/\((\w+)\)\s*–\s*\((\w)\)/));
  expect(pairs.length === 3 && pairs.every((m, i) => match.right['abc'.indexOf(m[2])] === want[i]), 'answer key pairs point at the correct mixed rows: ' + match.key);

  // 3. changing marks per question breaks the total; the check says by how much
  await page.fill('#sec-2 [data-f="marks"]', '5');
  await settle();
  s = await tot();
  expect(s.total === 12 && s.state === 'over' && !(await page.isVisible('#sampleNote')), 'total 12 is 2 over the maximum, sample note gone');
  expect((await page.textContent('#total')).includes(t('tot_over', { n: 2 })), 'over message shown');
  await page.fill('#fMax', '15');
  await settle();
  s = await tot();
  expect(s.state === 'short' && (await page.textContent('#total')).includes(t('tot_short', { n: 3 })), '3 marks short of 15');

  // 4. add an MCQ in another script to section A: numbering shifts, the key shows the marked option
  await page.click('#sec-0 [data-add="mcq"]');
  expect(await page.isVisible('#q-0-3.open'), 'new question opens for editing');
  await settle();
  expect(+(await page.getAttribute('#warnEmpty', 'data-n')) === 1 && await page.isVisible('#warnEmpty'), 'empty question is flagged');
  await page.fill('#q-0-3 [data-f="text"]', 'தமிழ்நாட்டின் தலைநகரம் எது? کون سا؟');
  await page.fill('#q-0-3 [data-f="opt-0"]', 'மதுரை');
  await page.fill('#q-0-3 [data-f="opt-1"]', 'சென்னை');
  await page.fill('#q-0-3 [data-f="opt-3"]', 'கோவை');
  await page.check('#q-0-3 [data-f="ans-3"]');
  await settle();
  s = await tot();
  expect(s.n === 7 && s.total === 13 && (await nums('#paperView')) === '1. 2. 3. 4. 5. 6. 7.', '7 questions, 13 marks, renumbered');
  expect((await paperText()).includes('தமிழ்நாட்டின் தலைநகரம் எது?'), 'Tamil question printed as typed');
  expect((await keyText()).includes('(c) கோவை') && !(await page.isVisible('#warnEmpty')), 'empty option is skipped, so the 4th option is printed as (c) in the key');

  // 5. OR choice, reorder, duplicate, delete
  await page.check('#q-0-3 [data-f="or-on"]');
  await page.fill('#q-0-3 [data-f="or-text"]', 'Alternative question');
  await page.fill('#q-0-3 [data-f="or-opt-0"]', 'Yes');
  await page.check('#q-0-3 [data-f="or-ans-0"]');
  await settle();
  expect((await page.$$('#paperView .p-or')).length === 2 && (await tot()).total === 13, 'second OR printed; an OR pair counts once');
  await page.click('#q-0-3 [data-act="up"]');
  await settle();
  expect((await page.$eval('#paperView .p-q[data-n="3"]', (e) => e.textContent)).includes('தமிழ்நாட்டின்'), 'moved up to number 3');
  await page.click('#q-0-2 [data-act="dup"]');
  await settle();
  s = await tot();
  expect(s.n === 8 && s.total === 14 && (await page.$$('#sec-0 .qrow')).length === 5, 'copy adds a question and 1 mark');
  await page.click('#q-0-3 [data-act="del"]');
  await page.click('#q-1-0 [data-act="up"]');                    // first question of B jumps to the end of A
  await settle();
  s = await tot();
  expect(s.n === 7 && s.total === 12 && (await page.$$('#sec-0 .qrow')).length === 5 && (await page.$$('#sec-1 .qrow')).length === 1, 'delete, then move across sections (2-mark question becomes 1 mark): ' + JSON.stringify(s));
  await page.click('#sec-2 [data-act="sec-up"]');
  await settle();
  expect(await page.$eval('#sec-1 [data-f="marks"]', (e) => e.value) === '5' && (await nums('#paperView')) === '1. 2. 3. 4. 5. 6. 7.', 'section moved up and numbering stays continuous');
  await page.click('#sec-1 [data-act="sec-dup"]');
  await settle();
  s = await tot();
  expect(s.total === 17 && (await page.$$('#sections .sec')).length === 4, 'section copied with its question: total 17');
  await page.click('#sec-2 [data-act="sec-del"]');
  await settle();
  expect((await tot()).total === 12 && (await page.$$('#sections .sec')).length === 3, 'section deleted');

  // 6. labels on the paper can be in another language than the app
  await page.selectOption('#fLang', 'ta');
  await settle();
  txt = await paperText();
  expect(txt.includes('பிரிவு A') && txt.includes('அல்லது') && (await page.getAttribute('#paperView', 'dir')) === 'ltr', 'paper labels switch to Tamil');
  await page.selectOption('#fLang', 'ur');
  await settle();
  expect((await page.getAttribute('#paperView', 'dir')) === 'rtl' && (await paperText()).includes('حصہ A'), 'Urdu labels make the paper right-to-left');
  await page.selectOption('#fLang', '');
  await page.check('#optName');
  await settle();
  expect((await page.$$('#paperView .p-line')).length === 2, 'name and roll number lines added');

  // 7. print: paper only, then answer key only
  await page.click('#btnPrint');
  await page.click('#btnPrintKey');
  expect((await page.evaluate(() => window.__printed.join(','))) === 'paper,key', 'print buttons show the paper, then the key');
  await page.emulateMedia({ media: 'print' });
  const pr = await page.evaluate(() => ({ edit: getComputedStyle(document.querySelector('.qp-edit')).display, seg: getComputedStyle(document.querySelector('#viewSeg')).display,
    key: getComputedStyle(document.querySelector('#keyView')).display, paper: getComputedStyle(document.querySelector('#paperView')).display, intro: getComputedStyle(document.querySelector('.edu-intro')).display }));
  await page.emulateMedia({ media: 'screen' });
  expect(pr.edit === 'none' && pr.seg === 'none' && pr.intro === 'none' && pr.paper === 'none' && pr.key !== 'none', 'print shows only the answer key: ' + JSON.stringify(pr));
  await page.click('#view-paper');

  // 8. save to a file, start blank, open the file again
  const before = await paperText();
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 8000 }), page.click('#btnSave')]);
  expect(/^question-paper-.*\.json$/.test(dl.suggestedFilename()), 'file name: ' + dl.suggestedFilename());
  const fs = require('fs');
  const json = fs.readFileSync(await dl.path(), 'utf8');
  const saved = JSON.parse(json);
  expect(saved.app === 'question-paper-maker' && saved.paper.sections.length === 3 && saved.paper.head.max === '15', 'saved file holds the paper');
  await page.click('#btnNew');
  await settle();
  s = await tot();
  expect(s.n === 0 && s.total === 0 && s.state === 'nomax' && (await page.inputValue('#fSchool')) === '', 'blank paper has no questions');
  let [fc] = await Promise.all([page.waitForEvent('filechooser', { timeout: 5000 }), page.click('#btnOpen')]);
  await fc.setFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{"app":"other","paper":[1,2') });
  await settle();
  expect((await tot()).n === 0, 'a broken file is refused and changes nothing');
  [fc] = await Promise.all([page.waitForEvent('filechooser', { timeout: 5000 }), page.click('#btnOpen')]);
  await fc.setFiles({ name: 'paper.json', mimeType: 'application/json', buffer: Buffer.from(json) });
  await page.waitForFunction(() => +document.querySelector('#total').dataset.questions === 7, null, { timeout: 8000 });
  expect((await paperText()) === before, 'opened paper prints exactly like the saved one');

  // 9. survives a reload; the sample comes back on request
  await page.waitForTimeout(500);
  await page.reload();
  await page.waitForSelector('#paperView .p-q');
  s = await tot();
  expect(s.n === 7 && s.total === 12 && !(await page.isVisible('#sampleNote')), 'paper is remembered after a reload');
  await page.click('#btnReset');
  await settle();
  s = await tot();
  expect(s.n === 6 && s.total === 10 && s.state === 'ok' && await page.isVisible('#sampleNote'), 'sample paper is back');
};
