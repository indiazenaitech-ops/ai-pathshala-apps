/* Interaction test for Resume & CV Builder (run by tools/verify.js in en and hi). */
const fs = require('fs'), os = require('os'), path = require('path');

module.exports = async function ({ page, lang, expect, t, log }) {
  const pageText = () => page.textContent('#page');
  const cls = () => page.getAttribute('#page', 'class');
  const settle = () => page.waitForTimeout(150);

  /* 1. the example resume is shown at first */
  await page.waitForSelector('#page .rv-body');
  const sampleName = await page.evaluate(() => window.APP_CONTENT.en.sample.name);
  expect((await pageText()).includes(sampleName), 'example resume is in the preview');
  expect(await page.isVisible('#sampleNote'), 'example note is shown');
  expect((await page.textContent('#fitText')).trim().length > 0, 'page-fit meter shows a value');

  /* 2. start blank, fill a name and one job: the preview has both */
  await page.click('#startBlank');
  await settle();
  expect(!(await pageText()).includes(sampleName), 'blank resume has no example text');
  expect(!(await page.isVisible('#sampleNote')), 'example note hidden for a blank resume');
  await page.fill('#f-name', 'Arjun Mehta');
  await page.click('#add-experience');
  await page.fill('#f-experience-0-role', 'Sales Manager');
  await page.fill('#f-experience-0-org', 'Tata Motors');
  await page.fill('#f-experience-0-bullets', 'Grew dealer sales by 18% in 2023\nTrained new sales staff');
  await settle();
  let txt = await pageText();
  expect(txt.includes('Arjun Mehta') && txt.includes('Sales Manager') && txt.includes('Tata Motors'), 'preview contains the name and the job');
  expect(await page.locator('#page .rv-sec[data-sec="experience"] li').count() === 2, 'two bullet points in the preview');
  const hint = await page.textContent('#sec-experience .rb-hints');
  expect(hint.includes(t('hint_numbers', { n: 1, total: 2 })), 'add-a-number hint for the point without a number: ' + hint);

  /* +91 phone formatting */
  await page.fill('#f-phone', '09876543210');
  await page.press('#f-phone', 'Tab');
  await settle();
  expect(await page.inputValue('#f-phone') === '+91 98765 43210', 'phone formatted as +91 98765 43210');
  expect((await pageText()).includes('+91 98765 43210'), 'formatted phone in the preview');

  /* 3. switching template changes the layout class */
  expect((await cls()).includes('tpl-ats'), 'default template is ATS Classic');
  await page.click('label[for="tpl-modern"]');
  await settle();
  let c = await cls();
  expect(c.includes('tpl-modern') && !c.includes('tpl-ats'), 'template class changed to modern: ' + c);
  expect(await page.locator('#page .rv-side').count() === 1, 'modern template has a side column');
  await page.click('label[for="tpl-govt"]');
  await settle();
  expect((await cls()).includes('tpl-govt'), 'template class changed to govt');
  expect(await page.isVisible('#sec-declaration') && await page.locator('#page .rv-decl').count() === 1, 'Govt/PSU turns on the declaration');

  /* 4. reorder sections: move Skills above Work experience */
  await page.fill('#f-skills', 'Negotiation, CRM, Excel');
  await settle();
  const order = () => page.$$eval('#page .rv-sec[data-sec]', els => els.map(e => e.dataset.sec).filter(s => s === 'experience' || s === 'skills').join(','));
  expect(await order() === 'experience,skills', 'default order: experience before skills');
  for (let i = 0; i < 4; i++) await page.click('#sec-skills [data-act="up"]');
  await settle();
  expect(await order() === 'skills,experience', 'skills moved above experience, got ' + await order());

  /* 4b. drag a section by its handle with the mouse and let go over the preview (outside the list):
     the drag must end there, and later mouse moves without a button must not move anything */
  const formOrder = () => page.$$eval('#sections .rb-sec[data-movable]', els => els.map(e => e.dataset.sec).join(','));
  await page.evaluate(() => document.querySelector('#sec-certs').scrollIntoView({ block: 'center' }));
  const hb = await page.locator('#sec-languages .rb-handle').boundingBox();
  const cb = await page.locator('#sec-certs').boundingBox();
  const hx = hb.x + hb.width / 2, hy = hb.y + hb.height / 2;
  await page.mouse.move(hx, hy);
  await page.mouse.down();
  await page.mouse.move(hx, cb.y + 12, { steps: 8 });
  await page.mouse.move(1000, cb.y + 12, { steps: 4 });
  await page.mouse.up();
  await settle();
  let fo = await formOrder();
  expect(fo.indexOf('languages') === fo.indexOf('certs') - 'languages,'.length, 'dragged Languages above Certifications: ' + fo);
  expect(await page.locator('#sections .rb-sec.dragging').count() === 0, 'drag ended when the mouse was let go over the preview');
  await page.mouse.move(hx, 150, { steps: 6 });
  await settle();
  expect(await formOrder() === fo, 'moving the mouse afterwards (no button) does not move sections');

  /* 4c. marks: plain numbers get % or /10, anything else stays exactly as typed */
  await page.click('#add-education');
  await page.fill('#f-education-0-degree', 'Class 12');
  const eduText = () => page.textContent('#page .rv-sec[data-sec="education"]');
  await page.fill('#f-education-0-score', '88.5');
  await settle();
  expect((await eduText()).includes('88.5%'), '88.5 shown as 88.5%');
  await page.fill('#f-education-0-score', 'First Division');
  await settle();
  expect((await eduText()).includes('First Division') && !(await eduText()).includes('Division%'), 'a grade in words is not given a % sign');
  await page.selectOption('#f-education-0-type', 'cgpa');
  await page.fill('#f-education-0-score', '8.2');
  await settle();
  expect((await eduText()).includes('8.2/10'), 'CGPA 8.2 shown out of 10');
  await page.fill('#f-education-0-score', '9.1/10');
  await settle();
  expect(!(await eduText()).includes('9.1/10/10'), 'CGPA typed as 9.1/10 is not doubled');

  /* 4d. "Copy AI prompt" with no points says what to do */
  await page.click('#add-projects');
  await page.click('#sec-projects .rb-help-line button');
  await page.waitForTimeout(100);
  expect((await page.textContent('.edu-toast-wrap')).includes(t('ai_empty')), 'empty points: AI prompt asks to write points first');

  /* 5. headings language: headings change, the user's own text does not */
  await page.selectOption('#headLang', 'hi');
  await settle();
  const hiExp = await page.evaluate(() => window.APP_CONTENT.hi.h.experience);
  txt = await pageText();
  expect(txt.includes(hiExp) && txt.includes('Sales Manager'), 'Hindi headings with the English text kept');
  await page.selectOption('#headLang', 'ur');
  await settle();
  expect(await page.getAttribute('#page', 'dir') === 'rtl', 'Urdu resume is right-to-left');
  await page.selectOption('#headLang', 'en');
  await settle();

  /* 6. export JSON -> reset -> import restores it */
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#exportJson')]);
  const file = await dl.path();
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  expect(json.app === 'resume-builder' && json.resume.c.name === 'Arjun Mehta' && json.resume.tpl === 'govt', 'exported JSON holds the resume');
  await page.click('#resetAll');
  await settle();
  expect(!(await pageText()).includes('Arjun Mehta'), 'reset removed the resume');
  expect(await page.locator('#resumeSel option').count() === 1, 'one resume after reset');
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#importJson')]);
  await fc.setFiles(file);
  await page.waitForFunction(() => document.querySelector('#page').textContent.includes('Arjun Mehta'), null, { timeout: 5000 });
  expect(await page.locator('#resumeSel option').count() === 2, 'imported resume added to the list');
  expect((await cls()).includes('tpl-govt') && await order() === 'skills,experience', 'template and section order restored');
  expect((await pageText()).includes('Tata Motors'), 'job restored');

  /* 7. several resumes are kept on the device */
  await page.waitForTimeout(500);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('edu.resume-builder.resumes') || '[]').map(r => r.c.name));
  expect(stored.length === 2 && stored.includes('Arjun Mehta'), 'both resumes saved: ' + stored.join(' / '));

  /* 8. clear personal details keeps the rest */
  await page.click('#clearPersonal');
  await settle();
  txt = await pageText();
  expect(!txt.includes('98765') && txt.includes('Arjun Mehta'), 'phone removed, name kept');
  expect(await page.inputValue('#f-phone') === '', 'phone field emptied');

  /* 9. print copy is prepared for Save as PDF */
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  expect((await page.textContent('#print-root')).includes('Arjun Mehta'), 'print copy contains the resume');
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));

  /* 10. a hand-edited backup with a strange language code must not break the app (now or after a reload) */
  const odd = path.join(os.tmpdir(), 'rb-odd-' + lang + '-' + Date.now() + '.json');
  fs.writeFileSync(odd, JSON.stringify({ app: 'resume-builder', resume: { lang: 'toString', sample: 'constructor', tpl: 'nope', c: { name: 'Zoya Qureshi' }, order: ['__proto__', 'skills'] } }));
  const [fc2] = await Promise.all([page.waitForEvent('filechooser'), page.click('#importJson')]);
  await fc2.setFiles(odd);
  await page.waitForFunction(() => document.querySelector('#page').textContent.includes('Zoya Qureshi'), null, { timeout: 5000 });
  expect((await cls()).includes('tpl-ats'), 'unknown template falls back to ATS Classic');
  await page.waitForTimeout(500);
  await page.reload();
  await page.waitForSelector('#page .rv-body', { state: 'attached' });
  expect((await pageText()).includes('Zoya Qureshi'), 'app starts again after the odd import');
  fs.unlinkSync(odd);

  /* 11. the real PDF: A4 and as many pages as the page-fit meter says */
  await page.click('#loadExample');
  await page.click('label[for="tpl-ats2"]');
  await settle();
  const meterPages = +(await page.getAttribute('#page', 'data-pages'));
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  await page.emulateMedia({ media: 'print' });
  const pdf = (await page.pdf({ preferCSSPageSize: true, printBackground: true })).toString('latin1');
  await page.emulateMedia({ media: 'screen' });
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  const pdfPages = (pdf.match(/\/Type\s*\/Page[^s]/g) || []).length;
  expect(pdfPages === meterPages, `PDF has ${pdfPages} page(s), the meter said ${meterPages}`);
  expect(/\/MediaBox\s*\[\s*0 0 59[45](\.\d+)? 84[12](\.\d+)?\s*\]/.test(pdf), 'PDF page is A4');
};
