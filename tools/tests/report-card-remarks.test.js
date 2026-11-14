/* Interaction test for Report Card Remarks (run by tools/verify.js in en and hi).
   Checks: name filling and the blank line, copy, he/she/they only where needed, separate remark language,
   combining up to 3 remarks, favourites that survive a reload and a language change, odd names, reset. */
module.exports = async function ({ page, lang, expect }) {
  const texts = (sel) => page.$$eval(sel + ' .rcr-text', (b) => b.map((x) => x.textContent));
  const hidden = (sel) => page.$eval(sel, (e) => e.hidden);
  const last = () => page.evaluate(() => window.RCR.last);
  const pick = async (sel) => { await page.click(sel); await page.waitForTimeout(30); };

  await page.waitForSelector('#list .rcr-item', { timeout: 10000 });
  expect(await page.evaluate(() => window.RCR.rl()) === lang, 'remark language follows the app language at first');

  /* 1) every area and level has remarks; improve / wishes have no levels */
  let total = 0;
  for (const a of await page.evaluate(() => window.RCR.AREAS)) {
    await pick(`#areas [data-area="${a}"]`);
    const flat = await page.evaluate((x) => !!window.RCR.FLAT[x], a);
    expect(await hidden('#levelBox') === flat, a + ': level picker hidden only for flat areas');
    for (const lv of flat ? [null] : [0, 1, 2, 3]) {
      if (lv !== null) await pick(`#levels [data-level="${lv}"]`);
      const n = (await texts('#list')).length;
      expect(n >= 3, `${a}/${lv}: at least 3 remarks, got ${n}`);
      total += n;
    }
  }
  expect(total >= 120, 'at least 120 remarks in ' + lang + ', got ' + total);

  /* 2) no name = a blank line; a typed name goes into every remark, with no template marks left */
  await pick('#areas [data-area="overall"]');
  await pick('#levels [data-level="0"]');
  let t = await texts('#list');
  expect(t.every((x) => x.includes('______')), 'blank line shown while no name is typed');
  await page.fill('#name', 'Ravi');
  await page.waitForTimeout(60);
  t = await texts('#list');
  expect(t.every((x) => x.includes('Ravi') && !/[{}\[\]|]/.test(x)), 'name filled in, no {name} or [a|b|c] left: ' + t[0]);

  /* 3) tapping a remark copies the filled text */
  await page.click('#list .rcr-item:nth-child(2) .rcr-text');
  expect(await last() === t[1], 'tapping copies the remark: ' + (await last()));
  expect((await page.textContent('#status')).trim().length > 0, 'a "copied" message appears');

  /* 4) he / she / they: Hindi needs it, English does not */
  await page.selectOption('#rlang', 'hi');
  await page.waitForTimeout(60);
  expect(!(await hidden('#pronBox')), 'Hindi remarks show the boy / girl / respectful choice');
  await pick('#pron [data-g="1"]');
  t = await texts('#list');
  expect(t[1].includes('करती है') && /[ऀ-ॿ]/.test(t[1]), 'girl form in Hindi: ' + t[1]);
  await pick('#pron [data-g="0"]');
  expect((await texts('#list'))[1].includes('करता है'), 'boy form in Hindi');
  await pick('#pron [data-g="2"]');
  expect((await texts('#list'))[1].includes('करते हैं'), 'respectful form in Hindi');
  await page.selectOption('#rlang', 'en');
  await page.waitForTimeout(60);
  expect(await hidden('#pronBox'), 'English remarks need no he / she choice');
  t = await texts('#list');
  expect(t[0].startsWith('Ravi ') && /^[\x00-\x7F]+$/.test(t[0]), 'remark language switched to English while the app stays in ' + lang);
  expect((await page.textContent('#edu-title')).trim().length > 0 && await page.evaluate(() => document.documentElement.lang) === lang, 'app language unchanged');

  /* 5) combine up to 3 remarks */
  await pick('#list .rcr-item:nth-child(1) .rcr-add');
  await pick('#list .rcr-item:nth-child(3) .rcr-add');
  await pick('#areas [data-area="wishes"]');
  await pick('#list .rcr-item:nth-child(4) .rcr-add');
  const wish = (await texts('#list'))[3];
  await pick('#list .rcr-item:nth-child(5) .rcr-add');
  const combo = await page.inputValue('#comboText');
  expect(combo === [t[0], t[2], wish].join(' '), 'combined remark joins the 3 picks in order: ' + combo.slice(0, 90));
  expect((await page.$$('#picks .chip')).length === 3, 'a 4th pick is refused (max 3)');
  await page.click('#comboCopy');
  expect(await last() === combo, 'combined remark copied');
  await page.click('#picks .chip:nth-child(2)');
  expect((await page.$$('#picks .chip')).length === 2 && !(await page.inputValue('#comboText')).includes(t[2]), 'a pick can be removed');
  await page.click('#comboClear');
  expect((await page.inputValue('#comboText')) === '' && (await page.$$('#picks .chip')).length === 0, 'clear empties the combined remark');

  /* 6) favourites: saved on the device, shown in any remark language */
  await pick('#areas [data-area="maths"]');
  await pick('#levels [data-level="3"]');
  await pick('#list .rcr-item:nth-child(2) .rcr-fav');
  expect((await page.$$('#favs .rcr-item')).length === 1 && await hidden('#favEmpty'), 'one favourite saved');
  await page.reload();
  await page.waitForSelector('#favs .rcr-item', { timeout: 10000 });
  expect((await page.inputValue('#name')) === 'Ravi', 'name kept after reload');
  const favEn = (await texts('#favs'))[0];
  expect(favEn.startsWith('Ravi ') && favEn.includes('maths'), 'favourite kept after reload: ' + favEn);
  await page.selectOption('#rlang', 'ta');
  await page.waitForTimeout(60);
  const favTa = (await texts('#favs'))[0];
  expect(/[஀-௿]/.test(favTa) && favTa.includes('Ravi'), 'the same favourite in Tamil: ' + favTa);
  expect(await page.$eval('#favs .rcr-text', (e) => e.lang) === 'ta', 'remark marked lang=ta');
  await page.selectOption('#rlang', 'ur');
  await page.waitForTimeout(60);
  expect(await page.$eval('#list .rcr-text', (e) => e.dir) === 'rtl', 'Urdu remarks are right-to-left');
  await page.selectOption('#rlang', '');

  /* 7) odd names never break the template */
  await page.fill('#name', '{name} [a|b|c] ' + 'X'.repeat(200));
  await page.waitForTimeout(60);
  t = await texts('#list');
  expect(t.every((x) => !/[{}\[\]|]/.test(x)), 'brackets in a name are cleaned');
  expect(t[0].length < 400 && !t[0].includes('X'.repeat(61)), 'very long names are cut to 60 characters');
  await page.fill('#name', '   ');
  await page.waitForTimeout(60);
  expect((await texts('#list')).every((x) => x.includes('______')), 'spaces only = blank line');

  /* 8) reset clears favourites and the name (dialogs are auto-accepted) */
  await page.click('#resetBtn');
  await page.waitForTimeout(100);
  expect((await page.$$('#favs .rcr-item')).length === 0 && !(await hidden('#favEmpty')), 'reset clears favourites');
  expect((await page.inputValue('#name')) === '', 'reset clears the name');
};
