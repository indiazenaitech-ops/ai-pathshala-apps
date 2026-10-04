/* Interaction test for Name Picker & Groups (run by tools/verify.js in en and hi).
   Covers: fair no-repeat picking (wheel + card flip, pick N), restore, balanced groups by count and
   by size, themed group names, keep-apart pairs, new class + attendance, CSV import, persistence.
   Regression checks (QA pass): the wheel follows the pool after a mode switch and after a full round,
   card names follow a language switch made mid-flip, new classes are named in the current language,
   CSV import copes with a title row, "Name of the Student" / parent columns, First + Last name and
   quoted ';' cells, toasts stay visible in full screen. */
module.exports = async function ({ page, lang, expect, t, log }) {
  await page.emulateMedia({ reducedMotion: 'reduce' });          // short spins for the test
  const nums = (s) => (String(s).match(/\d+/g) || []).map(Number);
  const content = await page.evaluate((L) => window.APP_CONTENT[L], lang);
  const sample = content.names;
  const idle = (sel, n) => page.waitForFunction(([s, k]) => document.querySelectorAll(s).length === k && !document.querySelector('#spinBtn').disabled, [sel, n], { timeout: 20000 });
  const onWheel = async () => nums(await page.getAttribute('#wheel', 'aria-label'))[0];   // "Spinning wheel with {n} names"
  const other = lang === 'en' ? 'hi' : 'en';
  const otherNames = await page.evaluate((L) => window.APP_CONTENT[L].names, other);

  // 1) default sample class
  let info = await page.textContent('#classInfo');
  expect(nums(info)[0] === 20, 'sample class should have 20 students, got "' + info + '"');
  expect(await page.isChecked('#noRepeat'), '"remove picked names" should be on by default');
  expect(await onWheel() === 20, 'the wheel should show all 20 names, got ' + await onWheel());

  // 2) wheel: pick 3 at once
  await page.fill('#pickN', '3');
  await page.click('#spinBtn');
  await idle('#winner .winner-name', 3);
  const w1 = await page.$$eval('#winner .winner-name', (els) => els.map((e) => e.textContent.trim()));
  expect(new Set(w1).size === 3 && w1.every((n) => sample.includes(n)), 'wheel should pick 3 different sample names, got ' + w1.join(', '));
  let rem = nums(await page.textContent('#remaining'));
  expect(rem.includes(17) && rem.includes(20), 'remaining should be 17 of 20, got ' + rem);
  expect((await page.$$('#history .pchip')).length === 3, 'history should list 3 picks');

  // 3) card flip mode: 3 more, never repeating
  await page.click('#modeSeg [data-mode="cards"]');
  await page.click('#spinBtn');
  await idle('#cardsWrap .flip.flipped', 3);
  const w2 = await page.$$eval('#cardsWrap .flip .front', (els) => els.map((e) => e.textContent.trim()));
  expect(w2.length === 3 && w2.every((n) => n && sample.includes(n) && !w1.includes(n)), 'card picks must not repeat earlier picks: ' + w2.join(', '));
  rem = nums(await page.textContent('#remaining'));
  expect(rem.includes(14), 'remaining should be 14, got ' + rem);
  // back to the wheel: it must show the 14 who are left, not the 20 from the earlier spin
  await page.click('#modeSeg [data-mode="wheel"]');
  expect(await onWheel() === 14, 'after a mode switch the wheel should show the 14 remaining names, got ' + await onWheel());
  expect((await page.textContent('#spinIc')).includes('🎡'), 'wheel mode button icon');
  await page.click('#modeSeg [data-mode="cards"]');
  expect((await page.textContent('#spinIc')).includes('🃏'), 'card mode button icon');

  // 4) pick everyone who is left (asks for 20, only 14 remain)
  await page.fill('#pickN', '20');
  await page.click('#spinBtn');
  await idle('#cardsWrap .flip.flipped', 14);
  const hist = await page.$$eval('#history .pchip .no-i18n', (els) => els.map((e) => e.textContent.trim()));
  expect(hist.length === 20 && new Set(hist).size === 20, 'all 20 students should be picked exactly once, got ' + hist.length);
  rem = nums(await page.textContent('#remaining'));
  expect(rem.includes(0), 'nobody should be left, got ' + rem);
  // everyone had a turn: the wheel shows the whole class for the next round (not an empty wheel)
  await page.click('#modeSeg [data-mode="wheel"]');
  expect(await onWheel() === 20, 'after a full round the wheel should show all 20 names again, got ' + await onWheel());
  await page.click('#modeSeg [data-mode="cards"]');
  await page.click('#restoreBtn');
  rem = nums(await page.textContent('#remaining'));
  expect(rem.length === 2 && rem[0] === 20 && rem[1] === 20, 'restore should bring back all 20 names, got ' + rem);

  // 4b) language switch while the cards are flipping: the revealed names follow the new language
  await page.fill('#pickN', '2');
  await page.click('#spinBtn');
  await page.selectOption('#edu-lang', other);
  await idle('#cardsWrap .flip.flipped', 2);
  await page.waitForTimeout(300);
  const flipped = await page.$$eval('#cardsWrap .flip .front', (els) => els.map((e) => e.textContent.trim()));
  expect(flipped.length === 2 && flipped.every((n) => otherNames.includes(n)), 'cards should show names in the new language (' + other + '), got ' + flipped.join(', '));
  await page.selectOption('#edu-lang', lang);
  await page.waitForTimeout(200);
  const back = await page.$$eval('#cardsWrap .flip .front', (els) => els.map((e) => e.textContent.trim()));
  expect(back.every((n) => sample.includes(n)), 'cards should switch back to ' + lang + ' names, got ' + back.join(', '));

  // 4c) full screen: messages (here "new round") must be drawn inside the full-screen element
  await page.click('#restoreBtn');
  await page.click('#fsBtn');
  await page.waitForTimeout(300);
  if (await page.evaluate(() => !!document.fullscreenElement)) {
    await page.fill('#pickN', '20');
    await page.click('#spinBtn');
    await idle('#cardsWrap .flip.flipped', 20);
    await page.click('#spinBtn');                       // nobody left: "new round" toast
    await page.waitForTimeout(100);
    const host = await page.evaluate(() => { const w = document.querySelector('.edu-toast-wrap'); return w && w.parentNode.id; });
    expect(host === 'pickCard', 'toasts should live inside the full-screen picker, got ' + host);
    await idle('#cardsWrap .flip.flipped', 20);
    await page.evaluate(() => document.exitFullscreen());
    await page.waitForTimeout(300);
  } else log('full screen not available in this browser; toast check skipped');
  await page.click('#restoreBtn');
  await page.fill('#pickN', '1');
  await page.click('#modeSeg [data-mode="wheel"]');

  // 5) groups by number of groups (20 → 4 × 5)
  await page.click('#tab-groups');
  await page.click('#groupBySeg [data-by="count"]');
  await page.fill('#groupVal', '4');
  await page.click('#makeGroups');
  let sizes = await page.$$eval('#groups .gcard', (cs) => cs.map((c) => c.querySelectorAll('li').length));
  expect(sizes.length === 4 && sizes.every((s) => s === 5), '4 groups of 5 expected, got ' + sizes);
  let members = await page.$$eval('#groups li', (ls) => ls.map((l) => l.textContent.trim()));
  expect(members.length === 20 && new Set(members).size === 20, 'every student must be in exactly one group');

  // by group size: at most 3 per group → 7 groups (six of 3, one of 2)
  await page.click('#groupBySeg [data-by="size"]');
  await page.fill('#groupVal', '3');
  await page.click('#makeGroups');
  sizes = await page.$$eval('#groups .gcard', (cs) => cs.map((c) => c.querySelectorAll('li').length));
  expect(sizes.length === 7 && Math.max(...sizes) === 3 && Math.min(...sizes) === 2 && sizes.reduce((a, b) => a + b, 0) === 20, 'size 3 should give 7 balanced groups, got ' + sizes);

  // themed names
  await page.selectOption('#groupTheme', 'planets');
  const h = (await page.textContent('#groups .gcard h3')).trim();
  expect(h === content.planets[0], 'first group should be named after the first planet, got ' + h);

  // keep apart: first two sample students, groups of 2 (10 groups), many reshuffles
  await page.click('#apartBox summary');
  await page.selectOption('#apartA', '0');
  await page.selectOption('#apartB', '1');
  await page.click('#addPair');
  expect((await page.$$('#pairs li')).length === 1, 'one keep-apart pair should be listed');
  await page.fill('#groupVal', '2');
  for (let i = 0; i < 8; i++) {
    await page.click(i ? '#reshuffleBtn' : '#makeGroups');
    const together = await page.$$eval('#groups .gcard', (cs, pair) => cs.some((c) => {
      const n = [...c.querySelectorAll('li')].map((l) => l.textContent.trim());
      return n.includes(pair[0]) && n.includes(pair[1]);
    }), [sample[0], sample[1]]);
    expect(!together, 'keep-apart pair ended up in the same group');
  }
  expect(await page.isHidden('#apartWarn'), 'no keep-apart warning expected');

  // 6) a new class with our own names + attendance
  await page.click('#tab-list');
  await page.click('#newClass');
  expect(await page.inputValue('#className') === '', 'a new class has no stored name (shown as "New class 2" in the current language)');
  const opt = (await page.$eval('#classSel', (s) => s.options[s.selectedIndex].textContent)).trim();
  expect(opt === t('new_class_name', { n: '2' }), 'new class should be listed as "' + t('new_class_name', { n: '2' }) + '", got "' + opt + '"');
  await page.fill('#namesInput', 'Asha\n2. Bilal\nChetan\n\nDeepa\n  Eshan ');
  await page.click('#saveList');
  info = await page.textContent('#classInfo');
  expect(nums(info)[0] === 5, 'new class should have 5 students, got "' + info + '"');
  const typed = await page.inputValue('#namesInput');
  expect(typed === 'Asha\nBilal\nChetan\nDeepa\nEshan', 'names should be cleaned (numbering, blanks, spaces), got ' + JSON.stringify(typed));
  await page.locator('#attendance .att').first().click();
  info = nums(await page.textContent('#classInfo'));
  expect(info[0] === 5 && info[1] === 1, 'one student should be absent, got ' + info);
  await page.click('#tab-groups');
  await page.click('#groupBySeg [data-by="count"]');
  await page.fill('#groupVal', '2');
  await page.click('#makeGroups');
  sizes = await page.$$eval('#groups .gcard', (cs) => cs.map((c) => c.querySelectorAll('li').length));
  members = await page.$$eval('#groups li', (ls) => ls.map((l) => l.textContent.trim()));
  expect(sizes.join() === '2,2' && !members.includes('Asha'), 'absent student must be left out of 2 groups of 2, got ' + sizes + ' / ' + members);

  // absent student is never picked
  await page.click('#tab-pick');
  await page.fill('#pickN', '4');
  await page.click('#spinBtn');
  await idle('#winner .winner-name', 4);
  const w3 = await page.$$eval('#winner .winner-name', (els) => els.map((e) => e.textContent.trim()));
  expect(!w3.includes('Asha') && new Set(w3).size === 4, 'only the 4 present students can be picked, got ' + w3);

  // 7) CSV import: a register with a title line, "Name of the Student" and a father's-name column
  await page.click('#tab-list');
  let [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#importBtn')]);
  await fc.setFiles({ name: 'class-7b.csv', mimeType: 'text/csv', buffer: Buffer.from('\uFEFFClass 7 B register 2026,,\r\nS.No.,Name of the Student,Father\'s Name\r\n1,Gita Rao,Mohan\r\n2,Harish,Ram\r\n3,"Imran, Jr",Ali\r\n') });
  await page.waitForFunction(() => document.querySelector('#namesInput').value === 'Gita Rao\nHarish\nImran, Jr', null, { timeout: 10000 }).catch(() => {});
  let typedCsv = await page.inputValue('#namesInput');
  expect(typedCsv === 'Gita Rao\nHarish\nImran, Jr', 'CSV import should take the student-name column only, got ' + JSON.stringify(typedCsv));
  info = await page.textContent('#classInfo');
  expect(nums(info)[0] === 3, 'imported class should have 3 students, got "' + info + '"');
  const named = (await page.$eval('#classSel', (s) => s.options[s.selectedIndex].textContent)).trim();
  expect(named === 'class-7b', 'an unnamed class should be named after the CSV file, got "' + named + '"');
  // semicolon CSV with First Name + Last Name and a quoted cell containing ';'
  [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#importBtn')]);
  await fc.setFiles({ name: 'other.csv', mimeType: 'text/csv', buffer: Buffer.from('Roll;First Name;Last Name\r\n1;Gita;Rao\r\n2;"Harish; Jr";Mehta\r\n3;Imran;Khan\r\n') });
  await page.waitForFunction(() => document.querySelector('#namesInput').value.includes('Mehta'), null, { timeout: 10000 }).catch(() => {});
  typedCsv = await page.inputValue('#namesInput');
  expect(typedCsv === 'Gita Rao\nHarish; Jr Mehta\nImran Khan', 'First + Last name columns should be joined, got ' + JSON.stringify(typedCsv));
  const kept = (await page.$eval('#classSel', (s) => s.options[s.selectedIndex].textContent)).trim();
  expect(kept === 'class-7b', 'a class that already has a name keeps it on import, got "' + kept + '"');

  // 8) everything survives a reload
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(800);
  const classes = await page.$$eval('#classSel option', (os) => os.length);
  expect(classes === 2, 'two saved classes expected after reload, got ' + classes);
  info = await page.textContent('#classInfo');
  expect(nums(info)[0] === 3, 'current class should still have 3 students after reload, got "' + info + '"');
  log('picks', w1.concat(w2).join(', '));
};
