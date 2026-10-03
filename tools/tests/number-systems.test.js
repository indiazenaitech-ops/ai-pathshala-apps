/* Interaction test for Number System Converter (run by tools/verify.js in en and hi).
   ctx = { page, lang, expect(cond, msg), t(key, vars) -> string in ctx.lang, log } */
module.exports = async function ({ page, expect, t, log }) {
  const val = (sel) => page.getAttribute(sel, 'data-value');
  const txt = async (sel) => ((await page.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const setNum = async (v, base) => {
    await page.click(`#from [data-v="${base}"]`);
    await page.fill('#num-in', v);
    await page.waitForTimeout(60);
  };

  /* ---------------- converter: decimal 25 ---------------- */
  await page.click('#tab-convert');
  await setNum('25', 10);
  expect(await val('#res-2') === '11001', '25 → binary 11001, got ' + await val('#res-2'));
  expect(await val('#res-8') === '31', '25 → octal 31, got ' + await val('#res-8'));
  expect(await val('#res-16') === '19', '25 → hex 19, got ' + await val('#res-16'));
  await page.click('#target [data-v="2"]');
  const rems = await page.$$eval('#steps .ns-div td.r', (tds) => tds.map((x) => x.textContent.trim()).filter(Boolean));
  expect(rems.join('') === '10011', 'division table remainders 1,0,0,1,1 (read upward = 11001), got ' + rems.join(','));

  /* decimal fraction, exact and approximate */
  await setNum('10.625', 10);
  expect(await val('#res-2') === '1010.101', '10.625 → 1010.101, got ' + await val('#res-2'));
  expect(await page.getAttribute('#res-2', 'data-exact') === 'true', '10.625 in binary is exact');
  const mulDigits = await page.$$eval('#steps .ns-mul td.d', (tds) => tds.map((x) => x.textContent.trim()).join(''));
  expect(mulDigits === '101', 'multiplication table gives digits 1,0,1, got ' + mulDigits);
  await setNum('0.1', 10);
  await page.fill('#places', '8');
  await page.waitForTimeout(60);
  expect(await val('#res-2') === '0.00011001', '0.1 → 0.00011001 (8 places), got ' + await val('#res-2'));
  expect(await page.getAttribute('#res-2', 'data-exact') === 'false', '0.1 in binary is approximate');

  /* binary → decimal / hex with fraction; grouping working */
  await setNum('1011.101', 2);
  expect(await val('#res-10') === '11.625', '1011.101₂ → 11.625, got ' + await val('#res-10'));
  expect(await val('#res-16') === 'B.A', '1011.101₂ → B.A, got ' + await val('#res-16'));
  expect(await val('#res-8') === '13.5', '1011.101₂ → 13.5, got ' + await val('#res-8'));
  await page.click('#target [data-v="16"]');
  const groups = await page.$$eval('#steps .ns-g .dig', (ds) => ds.map((d) => d.textContent).join(''));
  expect(groups === 'BA', 'grouping into 4 bits shows B and A, got ' + groups);
  await page.click('#target [data-v="10"]');
  const sum = await txt('#steps .ns-step:nth-child(2) .ns-formula b');
  expect(sum === '11.625', 'place-value sum is 11.625, got ' + sum);

  /* hex → decimal, big numbers stay exact */
  await setNum('FFFFFFFFFFFFFFFF', 16);
  expect(await val('#res-10') === '18446744073709551615', '2^64 − 1 exact, got ' + await val('#res-10'));

  /* validation: 9 is not an octal digit */
  await setNum('19', 8);
  const msg = await txt('#conv-msg');
  expect(msg.includes('9') && msg === t('err_digit', { c: '9', base: t('base8'), d: '0–7' }), 'octal error message, got ' + msg);
  expect(!(await page.$('#res-2')), 'no results for an invalid number');

  /* ---------------- 8-bit switches ---------------- */
  await page.click('#tab-bits');
  await page.click('#bit-clear');
  await page.click('#bits button[data-bit="6"]');
  await page.click('#bits button[data-bit="0"]');
  expect(await txt('#bit-dec') === '65', 'bits 64 + 1 = 65, got ' + await txt('#bit-dec'));
  expect(await txt('#bit-char') === 'A', '65 is the letter A');
  expect(await txt('#bit-hex') === '41', '65 is 41 in hex');
  await page.click('#bit-inc');
  expect(await txt('#bit-char') === 'B', '+1 gives B');
  await page.click('#bit-shl');
  expect(await txt('#bit-dec') === '132', '66 shifted left = 132, got ' + await txt('#bit-dec'));
  await page.click('#bit-not');
  expect(await txt('#bit-dec') === '123', 'NOT 132 = 123, got ' + await txt('#bit-dec'));
  await page.fill('#bit-char-in', 'a');
  expect(await txt('#bit-dec') === '97', 'typing "a" gives 97');

  /* ---------------- binary addition ---------------- */
  await page.click('#tab-add');
  await page.fill('#add-a', '1011');
  await page.fill('#add-b', '111');
  expect(await page.getAttribute('#add-out', 'data-value') === '10010', '1011 + 111 = 10010');
  expect(await page.getAttribute('#add-check', 'data-sum') === '18', 'decimal check 11 + 7 = 18');
  const carries = await page.$$eval('#add-table tr.cy td.d', (tds) => tds.map((x) => x.textContent || '0').join(''));
  expect(carries === '11110', 'carry row 1 1 1 1 (none into the first column), got ' + carries);
  expect((await page.$$('#add-cols li')).length === 5, 'four columns explained + the extra-bit note');

  /* ---------------- text encoding ---------------- */
  await page.click('#tab-text');
  await page.fill('#enc-text', 'Aक😀');
  expect(await txt('#enc-n') === '3', '3 code points');
  expect(await txt('#enc-bytes') === '8', 'A(1) + क(3) + 😀(4) = 8 UTF-8 bytes, got ' + await txt('#enc-bytes'));
  const bytes = await page.$$eval('#enc-strip .ns-ch', (bs) => bs.map((b) => b.dataset.bytes));
  expect(bytes[1] === 'E0 A4 95', 'क is E0 A4 95, got ' + bytes[1]);
  expect(bytes[2] === 'F0 9F 98 80', '😀 is F0 9F 98 80, got ' + bytes[2]);
  expect((await txt('#enc-how-hex')) === 'E0 A4 95', 'worked example shows क by default');

  /* ---------------- practice quiz ---------------- */
  await page.click('#tab-quiz');
  await page.click('#levels [data-v="med"]');
  const solve = (num, from, to) => {
    const n = parseInt(num, from);
    return n.toString(to).toUpperCase();
  };
  for (let i = 0; i < 3; i++) {
    const d = await page.$eval('#q-show', (e) => ({ num: e.dataset.num, from: +e.dataset.from, to: +e.dataset.to }));
    await page.fill('#q-ans', solve(d.num, d.from, d.to));
    await page.press('#q-ans', 'Enter');
    expect(await page.getAttribute('#q-fb', 'data-result') === 'ok', `quiz: ${d.num} (base ${d.from}) → base ${d.to} accepted`);
    expect(await page.getAttribute('#q-check', 'data-mode') === 'next', 'after answering, the Check button becomes Next');
    await page.click('#q-check');
  }
  const d = await page.$eval('#q-show', (e) => ({ num: e.dataset.num, from: +e.dataset.from, to: +e.dataset.to }));
  const right = solve(d.num, d.from, d.to);
  await page.fill('#q-ans', right === '1' ? '10' : '1');
  await page.click('#q-check');
  expect(await page.getAttribute('#q-fb', 'data-result') === 'bad', 'wrong answer is rejected');
  expect(await page.isVisible('#q-work .ns-step'), 'wrong answer shows the working');
  const sc = await page.$eval('#q-score-n', (e) => e.dataset.c + '/' + e.dataset.n);
  expect(sc === '3/4', 'score 3 of 4, got ' + sc);
  const saved = await page.evaluate(() => EDU.store('number-systems').get('quiz', {}));
  expect(saved.c === 3 && saved.n === 4 && saved.best === 3, 'score saved on this device');
  log('quiz ok, last question', d.num, d.from, '→', d.to);
};
