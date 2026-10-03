/* Interaction test, run by tools/verify.js in en and hi.
   ctx = { page, lang, expect(cond, msg), t(key) -> string in ctx.lang, log } */
module.exports = async function ({ page, expect, t }) {
  await page.click('#plus');
  await page.click('#plus');
  const txt = await page.textContent('#count');
  expect(txt.trim() === '2', 'counter should be 2 after two clicks, got ' + txt);
  const status = await page.textContent('#status');
  expect(status.includes('2'), 'status mentions the count');
};
