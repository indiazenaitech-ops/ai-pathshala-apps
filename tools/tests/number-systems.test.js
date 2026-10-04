/* Interaction test for Number System Converter (run by tools/verify.js in en and hi).
   ctx = { page, lang, expect(cond, msg), t(key, vars) -> string in ctx.lang, log } */
module.exports = async function ({ page, expect, t, log }) {
  const val = (sel) => page.getAttribute(sel, 'data-value');
  /* digit lists are wrapped in invisible LRI/PDI marks (U+2066/U+2069) so they stay left-to-right in Urdu */
  const txt = async (sel) => ((await page.textContent(sel)) || '').replace(/[⁦-⁩]/g, '').replace(/\s+/g, ' ').trim();
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

  /* a lone "+" is not a number (it used to be read as 0) */
  await setNum('+', 10);
  expect(!(await page.$('#res-2')) && (await txt('#conv-msg')) === t('err_empty'), 'a lone + asks for a number, got ' + await txt('#conv-msg'));
  /* digits typed on an Indian-language keyboard (Devanagari २५, Tamil ௨௫) are read as 25 */
  await setNum('२५', 10);
  expect(await val('#res-2') === '11001', 'Devanagari २५ → binary 11001, got ' + await val('#res-2'));
  await setNum('௨௫', 10);
  expect(await val('#res-16') === '19', 'Tamil ௨௫ → hex 19, got ' + await val('#res-16'));
  /* the allowed-digit list is isolated left-to-right (Urdu showed "9–0") */
  const iso = await page.$eval('#conv-msg', (e) => e.textContent);
  expect(/⁦0–9⁩/.test(iso), 'allowed digits are wrapped in LRI…PDI');
  /* keyboard focus stays on the target button that was chosen (buttons are rebuilt on each render) */
  await setNum('25', 10);
  await page.focus('#target [data-v="8"]');
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => document.activeElement && document.activeElement.dataset.v === '8' && document.activeElement.closest('#target') !== null), 'focus kept on the chosen target button');
  expect(await page.$$eval('#steps .ns-div td.r', (tds) => tds.map((x) => x.textContent.trim()).filter(Boolean).reverse().join('')) === '31', '25 ÷ 8 working reads 31 upward');

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
  /* typing a second character uses the newest one (it used to stay on the first) */
  await page.type('#bit-char-in', 'b');
  expect(await txt('#bit-dec') === '98' && (await page.inputValue('#bit-char-in')) === 'b', 'typing "b" after "a" gives 98, got ' + await txt('#bit-dec'));
  await page.fill('#bit-dec-in', '3.5');
  expect(await txt('#bit-dec') === '98' && (await txt('#bit-msg')) === t('dec_range'), '3.5 is rejected with the 0–255 note');
  /* overflow note is re-translated when the language changes */
  await page.fill('#bit-dec-in', '255');
  await page.click('#bit-inc');
  expect(await txt('#bit-dec') === '0' && (await txt('#bit-msg')) === t('wrap_note'), '255 + 1 wraps to 0 with the overflow note');
  const lang0 = await page.evaluate(() => EDU.lang);
  const other = lang0 === 'ta' ? 'bn' : 'ta';
  await page.evaluate((l) => EDU.setLang(l), other);
  const wrapOther = await page.evaluate(() => EDU.t('wrap_note'));
  expect((await txt('#bit-msg')) === wrapOther.replace(/\s+/g, ' ').trim() && wrapOther !== t('wrap_note'), 'bit note follows the language switch');
  await page.evaluate((l) => EDU.setLang(l), lang0);
  expect((await txt('#bit-msg')) === t('wrap_note'), 'bit note back in the test language');

  /* ---------------- binary addition ---------------- */
  await page.click('#tab-add');
  await page.fill('#add-a', '1011');
  await page.fill('#add-b', '111');
  expect(await page.getAttribute('#add-out', 'data-value') === '10010', '1011 + 111 = 10010');
  expect(await page.getAttribute('#add-check', 'data-sum') === '18', 'decimal check 11 + 7 = 18');
  const carries = await page.$$eval('#add-table tr.cy td.d', (tds) => tds.map((x) => x.textContent || '0').join(''));
  expect(carries === '11110', 'carry row 1 1 1 1 (none into the first column), got ' + carries);
  expect((await page.$$('#add-cols li')).length === 5, 'four columns explained + the extra-bit note');
  /* tapping a column step pins its highlight (touch smartboards have no hover) */
  await page.click('#add-cols li[data-col="2"]');
  await page.mouse.move(2, 2);
  const hl = await page.$$eval('#add-table tr', (trs) => trs.map((tr) => [...tr.children].findIndex((td) => td.classList.contains('hl'))));
  expect(hl.length === 4 && hl.every((i) => i === 4), 'column 2 (from the right) stays highlighted in all 4 rows, got ' + hl.join(','));
  /* empty input: a message for addition (not "convert") and no stale answer */
  await page.fill('#add-b', '');
  expect((await txt('#add-msg')) === t('add_empty') && !(await page.getAttribute('#add-out', 'data-value')), 'empty second number → add_empty, no stale sum');
  await page.fill('#add-b', '111');

  /* ---------------- text encoding ---------------- */
  await page.click('#tab-text');
  await page.fill('#enc-text', 'Aक😀');
  expect(await txt('#enc-n') === '3', '3 code points');
  expect(await txt('#enc-bytes') === '8', 'A(1) + क(3) + 😀(4) = 8 UTF-8 bytes, got ' + await txt('#enc-bytes'));
  const bytes = await page.$$eval('#enc-strip .ns-ch', (bs) => bs.map((b) => b.dataset.bytes));
  expect(bytes[1] === 'E0 A4 95', 'क is E0 A4 95, got ' + bytes[1]);
  expect(bytes[2] === 'F0 9F 98 80', '😀 is F0 9F 98 80, got ' + bytes[2]);
  expect((await txt('#enc-how-hex')) === 'E0 A4 95', 'worked example shows क by default');
  await page.click('#enc-strip .ns-ch[data-i="0"]');
  expect((await txt('#enc-how h2')).startsWith(t('enc_how_one', { u: 'U+0041' })), '1-byte heading uses the singular string, got ' + await txt('#enc-how h2'));
  expect((await txt('#enc-how-hex')) === '41', 'A is the single byte 41');

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
    if (i === 0) {
      /* a double tap on Check must not skip straight past the feedback */
      await page.click('#q-check');
      expect(await page.getAttribute('#q-fb', 'data-result') === 'ok' && (await page.getAttribute('#q-show', 'data-num')) === d.num, 'an instant second tap keeps the feedback on screen');
    }
    await page.waitForTimeout(750);
    await page.click('#q-check');
    expect(await page.getAttribute('#q-check', 'data-mode') === 'check' && !(await page.getAttribute('#q-fb', 'data-result')), 'Next shows a fresh question');
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
  const fbText = await txt('#q-fb');
  expect(fbText.startsWith(t('wrong')) && fbText.includes(t('right_answer')), 'wrong-answer feedback names the right answer');

  /* level ranges are numbers: they must stay left-to-right in Urdu ("2–31" showed as "31–2") */
  expect(await page.$$eval('#levels small', (s) => s.length === 4 && s.every((x) => x.getAttribute('dir') === 'ltr')), 'level ranges marked dir=ltr');

  /* fractions level: exact answers (with an extra trailing zero) are accepted */
  await page.waitForTimeout(750);
  await page.click('#q-check');
  await page.click('#levels [data-v="frac"]');
  const exact = (num, from, to) => {
    const [ip, fp = ''] = num.split('.');
    const D = '0123456789ABCDEF';
    let n = 0n; for (const c of ip + fp) n = n * BigInt(from) + BigInt(D.indexOf(c));
    const den = BigInt(from) ** BigInt(fp.length);
    let out = (n / den).toString(to).toUpperCase(), r = n % den, f = '';
    while (r > 0n && f.length < 30) { r *= BigInt(to); f += D[Number(r / den)]; r %= den; }
    return out + (f ? '.' + f : '');
  };
  for (let i = 0; i < 3; i++) {
    const fq = await page.$eval('#q-show', (e) => ({ num: e.dataset.num, from: +e.dataset.from, to: +e.dataset.to }));
    let a = exact(fq.num, fq.from, fq.to);
    if (a.includes('.')) a += '0';
    await page.fill('#q-ans', a);
    await page.press('#q-ans', 'Enter');
    expect(await page.getAttribute('#q-fb', 'data-result') === 'ok', `fractions: ${fq.num} (base ${fq.from}) → ${a} (base ${fq.to}) accepted`);
    await page.waitForTimeout(750);
    await page.click('#q-check');
  }

  /* worksheet: 12 questions + an answer key, built into the print area */
  await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
  await page.click('#ws-print');
  const ws = await page.evaluate(() => {
    const lists = document.querySelectorAll('#print-area .ns-ws ol');
    return { printed: window.__printed, q: lists[0] ? lists[0].children.length : 0, a: lists[1] ? lists[1].children.length : 0,
      uniq: new Set([...(lists[0] ? lists[0].children : [])].map((li) => li.textContent)).size };
  });
  expect(ws.printed === 1 && ws.q === 12 && ws.a === 12 && ws.uniq === 12, 'worksheet has 12 different questions and 12 answers, got ' + JSON.stringify(ws));
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  expect(await page.evaluate(() => !document.body.classList.contains('ns-printing') && !document.querySelector('#print-area').children.length), 'print area cleared after printing');
};
