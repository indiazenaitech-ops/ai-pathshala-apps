/* Interaction test for Letter & Application Writer (run by tools/verify.js in en and hi).
   bank mobile-number letter: typed name + new number appear with the subject; letter language English while the UI
   stays in the app language; exam format; last-4-digit guard; draft saved -> reload restores it; .txt download. */
module.exports = async function ({ page, expect, lang }) {
  const settle = () => page.waitForTimeout(300);
  const sheet = async () => ((await page.textContent('#sheet')) || '').replace(/\s+/g, ' ');
  const C = await page.evaluate(() => window.APP_CONTENT);

  // pick Bank -> change mobile number
  await page.click('#groups [data-g="bank"]');
  await settle();
  await page.click('#tpls [data-tpl="mobile_change"]');
  await settle();
  expect((await page.getAttribute('#tpls [data-tpl="mobile_change"]', 'aria-pressed')) === 'true', 'mobile_change template is selected');
  await page.fill('#f-name', 'Anjali Verma');
  await page.fill('#f-new_mobile', '91234 56789');
  await page.fill('#f-acct4', '12ab345678');
  await settle();
  expect((await page.inputValue('#f-acct4')) === '1234', 'account field keeps only 4 digits, got ' + (await page.inputValue('#f-acct4')));
  let txt = await sheet();
  expect(txt.includes('Anjali Verma'), 'preview contains the typed name');
  expect(txt.includes('91234 56789'), 'preview contains the new mobile number');
  expect(txt.includes('1234'), 'preview contains the last 4 digits');
  const subj = C[lang].tpl.mobile_change.subject;
  expect(txt.includes(subj), 'preview contains the subject line in ' + lang + ': ' + subj);
  expect((await page.getAttribute('#sheet', 'lang')) === lang, 'letter language follows the app language');

  // letter language -> English (the UI stays in the app language)
  await page.selectOption('#letterLang', 'en');
  await settle();
  txt = await sheet();
  expect(txt.includes(C.en.tpl.mobile_change.subject) && txt.includes(C.en.fmt.sal_dear), 'preview is in English after switching the letter language');
  expect(txt.includes('Anjali Verma') && txt.includes('91234 56789'), 'typed values survive the language switch');
  expect((await page.getAttribute('#sheet', 'lang')) === 'en', 'sheet lang = en');
  const label = ((await page.textContent('label[for="f-name"]')) || '').trim();
  expect(label === (await page.evaluate(() => EDU.t('f_name'))), 'form labels stay in the app language');

  // exam format
  await page.click('#laySeg [data-lay="exam"]');
  await settle();
  txt = await sheet();
  expect(txt.includes(C.en.fmt.exam_hall) && !txt.includes(C.en.fmt.from), 'exam format starts with Examination Hall, no From block');
  await page.click('#laySeg [data-lay="std"]');
  await settle();

  // .txt download
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }), page.click('#btnTxt')]);
  expect(/\.txt$/.test(dl.suggestedFilename()), 'downloads a .txt file');

  // save a draft, reload, it is restored
  await page.click('#btnSave');
  await settle();
  expect((await page.$$('#drafts .draft')).length === 1, 'one draft listed');
  await page.reload();
  await page.waitForFunction(() => window.EDU_READY && document.querySelector('#sheet p'));
  await settle();
  expect((await page.$$('#drafts .draft')).length === 1, 'draft still listed after reload');
  expect((await page.inputValue('#f-name')) === 'Anjali Verma', 'name restored after reload');
  txt = await sheet();
  expect(txt.includes('91234 56789') && txt.includes(C.en.tpl.mobile_change.subject), 'letter restored after reload (English, new number)');

  // change something, reopen the draft
  await page.fill('#f-name', 'Someone Else');
  await page.click('#groups [data-g="school"]');
  await page.click('#tpls [data-tpl="sick_leave"]');
  await settle();
  expect((await sheet()).includes(C.en.tpl.sick_leave.subject), 'switched to sick leave');
  await page.click('#drafts .d-open');
  await settle();
  txt = await sheet();
  expect(txt.includes('Anjali Verma') && txt.includes(C.en.tpl.mobile_change.subject), 'opening the draft restores the bank letter');
};
