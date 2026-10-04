/* Interaction test for Unit Converter (run by tools/verify.js in en and hi).
   ctx = { page, lang, expect(cond, msg), t(key, vars) -> string in ctx.lang, log } */
module.exports = async function ({ page, lang, expect, t, log }) {
  const val = (sel) => page.inputValue(sel);
  const txt = async (sel) => ((await page.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const num = (s) => Number(String(s).replace(/,/g, ''));
  const setup = async (cat, a, b) => {
    await page.click(`#cats [data-cat="${cat}"]`);
    await page.selectOption('#unit-a', a);
    await page.selectOption('#unit-b', b);
  };

  /* ---------- length: 5 km → 5000 m, then type in the right box (two-way) ---------- */
  await page.click('#tab-convert');
  await setup('length', 'km', 'm');
  await page.fill('#in-a', '5');
  expect(num(await val('#in-b')) === 5000, '5 km should be 5000 m, got ' + await val('#in-b'));
  expect((await txt('#result')).includes('5,000'), 'result line shows 5,000 m: ' + await txt('#result'));
  expect((await txt('#steps')).includes('× 1,000'), 'steps multiply by 1,000: ' + await txt('#steps'));
  await page.fill('#in-b', '2500');
  expect(num(await val('#in-a')) === 2.5, '2500 m typed on the right gives 2.5 km on the left, got ' + await val('#in-a'));
  expect((await txt('#steps')).includes('÷ 1,000'), 'reverse steps divide by 1,000: ' + await txt('#steps'));
  expect((await txt('#hint')) === t('hint_smaller'), 'hint says smaller unit → bigger unit');

  /* ft → m uses the textbook relation 1 ft = 0.3048 m */
  await setup('length', 'm', 'ft');
  await page.fill('#in-a', '3.048');
  expect(num(await val('#in-b')) === 10, '3.048 m = 10 ft, got ' + await val('#in-b'));
  expect((await txt('#steps')).includes('÷ 0.3048'), 'm → ft divides by 0.3048: ' + await txt('#steps'));

  /* ---------- temperature formulas + absolute zero ---------- */
  await setup('temp', 'c', 'f');
  await page.fill('#in-a', '100');
  expect(num(await val('#in-b')) === 212, '100 °C = 212 °F, got ' + await val('#in-b'));
  expect((await txt('#steps')).includes('9/5'), 'temperature steps show the 9/5 formula');
  await page.selectOption('#unit-a', 'f');
  await page.selectOption('#unit-b', 'c');
  await page.fill('#in-a', '98.6');
  expect(num(await val('#in-b')) === 37, '98.6 °F = 37 °C, got ' + await val('#in-b'));
  await page.selectOption('#unit-a', 'k');
  await page.fill('#in-a', '-5');
  expect((await txt('#err')) === t('below_zero'), 'negative kelvin is refused');
  expect((await val('#in-b')) === '', 'no answer below absolute zero');

  /* ---------- speed: 72 km/h → 20 m/s with the 5/18 shortcut ---------- */
  await setup('speed', 'kmh', 'mps');
  await page.fill('#in-a', '72');
  expect(num(await val('#in-b')) === 20, '72 km/h = 20 m/s, got ' + await val('#in-b'));
  expect((await txt('#steps')).includes('5/18'), 'speed steps use 5/18');

  /* ---------- data: 1 GiB = 1024 MiB, swap gives the reverse ---------- */
  await setup('data', 'gib', 'mib');
  await page.fill('#in-a', '1');
  expect(num(await val('#in-b')) === 1024, '1 GiB = 1024 MiB, got ' + await val('#in-b'));
  await page.click('#swap');
  expect(await page.inputValue('#unit-a') === 'mib' && await page.inputValue('#unit-b') === 'gib', 'swap exchanges the units');
  await page.fill('#in-a', '2048');
  expect(num(await val('#in-b')) === 2, '2048 MiB = 2 GiB, got ' + await val('#in-b'));
  const rows = await page.$$eval('#all-units tbody tr', (r) => r.length);
  expect(rows === 11, 'all-units table lists 11 data units, got ' + rows);

  /* example chip loads a preset */
  await page.click('#cats [data-cat="area"]');
  await page.click('#examples [data-ex="ex_farm"]');
  const acres = num(await val('#in-b'));
  expect(Math.abs(acres - 4.942108) < 1e-5, '2 ha ≈ 4.942 acres, got ' + acres);

  /* light-year and astronomical unit (science) */
  await setup('length', 'au', 'km');
  await page.fill('#in-a', '1');
  expect(num(await val('#in-b')) === 149597870.7, '1 AU = 149,597,870.7 km, got ' + await val('#in-b'));
  const lenRows = await page.$$eval('#all-units tbody tr', (r) => r.length);
  expect(lenRows === 14, 'length table lists 14 units, got ' + lenRows);

  /* ---------- practice: right answer, wrong answer with steps, worksheet ---------- */
  await page.click('#tab-practice');
  expect(await page.isVisible('#pr-q-math'), 'practice question is visible');
  await page.selectOption('#pr-topic', 'length');
  await page.click('#pr-easy');
  const readQ = () => page.$eval('#pr-q-math', (e) => ({ cat: e.dataset.cat, from: e.dataset.from, to: e.dataset.to, v: Number(e.dataset.v) }));
  const solve = (q) => page.evaluate((q) => {
    const c = window.UC_UNITS.find((x) => x.id === q.cat);
    const f = (id) => c.units.find((u) => u.id === id).f;
    return Number((q.v * f(q.from) / f(q.to)).toPrecision(12));
  }, q);
  const q1 = await readQ();
  expect(q1.cat === 'length' && ['km', 'm', 'cm', 'mm'].includes(q1.from), 'question is about length: ' + JSON.stringify(q1));
  await page.fill('#pr-ans', String(await solve(q1)));
  await page.click('#pr-check');
  expect(await page.getAttribute('#pr-msg', 'data-res') === 'exact', 'correct answer is accepted');
  expect(await txt('#pr-score') === t('pr_score', { c: '1', n: '1' }), 'score 1 of 1: ' + await txt('#pr-score'));
  expect(await page.isDisabled('#pr-ans'), 'answer box locks after checking');
  await page.click('#pr-next');
  await readQ();
  expect(await txt('#pr-qno') === t('pr_q', { n: '2' }), 'question number moves to 2');
  await page.fill('#pr-ans', '0');
  await page.click('#pr-check');
  expect(await page.getAttribute('#pr-msg', 'data-res') === 'wrong', 'wrong answer is marked wrong');
  const stepCount = await page.$$eval('#pr-steps li', (l) => l.length);
  expect(stepCount >= 3 && await page.isVisible('#pr-steps'), 'a wrong answer shows the steps, got ' + stepCount);
  expect(await txt('#pr-score') === t('pr_score', { c: '1', n: '2' }), 'score 1 of 2: ' + await txt('#pr-score'));
  /* speed questions are checked with the 5/18 rule */
  await page.click('#pr-next');
  await page.selectOption('#pr-topic', 'speed');
  const qs = await readQ();
  const want = qs.from === 'kmh' ? qs.v * 5 / 18 : qs.v * 18 / 5;
  await page.fill('#pr-ans', String(Number(want.toPrecision(12))));
  await page.click('#pr-check');
  expect(await page.getAttribute('#pr-msg', 'data-res') === 'exact', 'speed answer by the 5/18 rule is accepted: ' + JSON.stringify(qs));
  const wsItems = await page.$$eval('#ws-list li', (l) => l.length);
  expect(wsItems === 10, 'worksheet has 10 questions, got ' + wsItems);
  expect(!(await page.isVisible('#ws-list .wsa')), 'worksheet answers start hidden');
  await page.check('#ws-show');
  expect(await page.isVisible('#ws-list .wsa'), 'Show answers reveals the worksheet answers');
  await page.uncheck('#ws-show');

  /* ---------- Indian & international number systems ---------- */
  await page.click('#tab-numbers');
  await page.fill('#num-in', '12345678');
  expect(await txt('#in-group') === '1,23,45,678', 'Indian grouping 1,23,45,678, got ' + await txt('#in-group'));
  expect(await txt('#intl-group') === '12,345,678', 'international grouping 12,345,678, got ' + await txt('#intl-group'));
  expect((await txt('#in-en')) === 'one crore twenty-three lakh forty-five thousand six hundred seventy-eight', 'English Indian words: ' + await txt('#in-en'));
  expect((await txt('#intl-en')).startsWith('twelve million three hundred forty-five thousand'), 'English international words: ' + await txt('#intl-en'));
  expect((await txt('#in-hi')) === 'एक करोड़ तेईस लाख पैंतालीस हज़ार छह सौ अठहत्तर', 'Hindi words: ' + await txt('#in-hi'));
  expect((await txt('#in-short')).includes(t('w_crore')), 'short form uses the word for crore in this language');
  expect(await txt('#pv-in td[data-place="7"]') === '1' && await txt('#pv-in td[data-place="0"]') === '8', 'place value chart: crore digit 1, ones digit 8');
  await page.fill('#num-in', '12.5');
  expect((await txt('#num-err')) === t('num_invalid'), 'decimal point is rejected in the number tab');

  /* quiz mode hides answers until revealed */
  await page.check('#quiz');
  await page.click('#num-rand');
  const hidden = await page.$eval('#in-group', (e) => getComputedStyle(e).visibility);
  expect(hidden === 'hidden', 'quiz mode hides the answer');
  const rnd = await page.inputValue('#num-in');
  expect(/^[1-9]\d{7}$/.test(rnd), 'random number has 8 digits by default, got ' + rnd);
  await page.click('#reveal');
  expect(await page.$eval('#in-group', (e) => getComputedStyle(e).visibility) === 'visible', 'Show answer reveals it');
  await page.uncheck('#quiz');

  /* state survives a reload */
  await page.fill('#num-in', '384400');
  await page.reload();
  await page.waitForTimeout(600);
  expect(await page.inputValue('#num-in') === '384400', 'number survives reload');
  expect(await page.getAttribute('#tab-numbers', 'aria-selected') === 'true', 'numbers tab stays open after reload');
  expect(await txt('#in-group') === '3,84,400', 'Moon distance in Indian commas');
  await page.click('#tab-practice');
  expect(await txt('#pr-score') === t('pr_score', { c: '2', n: '3' }), 'practice score survives reload: ' + await txt('#pr-score'));

  /* ---------- ± button: phone number pads have no minus key ---------- */
  await page.click('#tab-convert');
  await setup('temp', 'c', 'f');
  await page.fill('#in-a', '−40');                       /* typographic minus sign */
  expect(num(await val('#in-b')) === -40, '−40 °C (Unicode minus) = −40 °F, got ' + await val('#in-b'));
  await page.click('#pm-a');
  expect(await val('#in-a') === '40' && num(await val('#in-b')) === 104, '± turns −40 into 40 (= 104 °F), got ' + await val('#in-a') + ' / ' + await val('#in-b'));
  await page.click('#pm-a');
  expect(await val('#in-a') === '-40', '± again gives -40, got ' + await val('#in-a'));

  /* practice: negative temperature answers can be typed with the ± button */
  await page.click('#tab-practice');
  await page.selectOption('#pr-topic', 'temp');
  await page.click('#pr-hard');
  const tempAns = (q) => {
    const c = q.from === 'c' ? q.v : q.from === 'f' ? (q.v - 32) * 5 / 9 : q.v - 273.15;
    return Number((q.to === 'c' ? c : q.to === 'f' ? c * 9 / 5 + 32 : c + 273.15).toPrecision(12));
  };
  let neg = null;
  for (let i = 0; i < 80 && !neg; i++) {
    const q = await readQ();
    if (tempAns(q) < 0) neg = q; else await page.click('#pr-next');
  }
  expect(neg, 'a harder temperature question with a negative answer turns up');
  expect(await page.isVisible('#pr-pm'), '± button is shown for temperature questions');
  await page.fill('#pr-ans', String(Math.abs(tempAns(neg))));
  await page.click('#pr-pm');
  expect(num(await val('#pr-ans')) === tempAns(neg), '± makes the typed answer negative: ' + await val('#pr-ans'));
  await page.click('#pr-check');
  expect(await page.getAttribute('#pr-msg', 'data-res') === 'exact', 'negative answer typed with ± is accepted: ' + JSON.stringify(neg));
  expect(await page.isDisabled('#pr-pm'), '± is locked once the answer is checked');
  await page.selectOption('#pr-topic', 'length');
  expect(!(await page.isVisible('#pr-pm')), '± is hidden for length questions');

  /* harder data questions never ask for parts of a bit or of a byte */
  await page.selectOption('#pr-topic', 'data');
  await page.check('#ws-show');
  const dataItems = [];
  for (let i = 0; i < 8; i++) {
    await page.click('#ws-new');
    dataItems.push(...await page.$$eval('#ws-list li', (l) => l.map((x) => x.textContent.replace(/\s+/g, ' ').trim())));
  }
  const badData = dataItems.filter((s) => {
    const m = s.match(/^([\d,.]+) (\S+) = ([\d,.]+) (\S+)$/);
    if (!m) return true;
    const whole = (n, u) => !(u === 'bit' || u === 'B') || Number.isInteger(num(n));
    return !(whole(m[1], m[2]) && whole(m[3], m[4]));
  });
  expect(dataItems.length === 80 && !badData.length, 'data worksheet uses whole bits and bytes: ' + badData.slice(0, 3).join(' | '));
  await page.uncheck('#ws-show');

  /* ---------- numbers tab: empty box is not an error; comparison row shows the number ---------- */
  await page.click('#tab-numbers');
  await page.fill('#num-in', '');
  expect((await txt('#num-err')) === '' && await page.isHidden('#num-out'), 'an empty number box shows no error message');
  await page.fill('#num-in', '5');
  await page.click('#cmp tbody tr[data-n="10000000"] .rowbtn');
  expect(await page.inputValue('#num-in') === '10000000' && await txt('#in-group') === '1,00,00,000', 'comparison row loads 1 crore');
  expect(await page.evaluate(() => document.activeElement.id !== 'num-in'), 'comparison row does not pop up the keyboard (input not focused)');
  await page.fill('#num-in', '123456789');

  /* ---------- Urdu (right-to-left): symbols, brackets and the place value chart stay readable ---------- */
  await page.selectOption('#edu-lang', 'ur');
  await page.waitForTimeout(300);
  const pvOrder = await page.$$eval('#pv-in td', (tds) => tds.map((td) => [td.textContent, td.getBoundingClientRect().left]).sort((a, b) => a[1] - b[1]).map((x) => x[0]).join(''));
  expect(pvOrder === '123456789', 'Urdu place value chart reads 123456789 from left to right, got ' + pvOrder);
  await page.click('#tab-convert');
  await page.click('#cats [data-cat="temp"]');
  const optC = await page.$eval('#unit-a option[value="c"]', (o) => o.textContent);
  expect(optC.includes('‎°C'), 'Urdu unit list keeps "°C" left-to-right: ' + JSON.stringify(optC));
  const noteRuns = await page.$$eval('#note .uc-ltr', (s) => s.map((x) => x.textContent));
  const balanced = (s) => (s.match(/\(/g) || []).length === (s.match(/\)/g) || []).length;
  expect(noteRuns.length >= 3 && noteRuns.every(balanced), 'Urdu note keeps each bracket pair inside one left-to-right island: ' + JSON.stringify(noteRuns));
  await page.click('#tab-practice');
  await page.selectOption('#pr-topic', 'temp');
  const lblRuns = await page.$$eval('#pr-ans-lbl .uc-ltr', (s) => s.map((x) => x.textContent));
  expect(lblRuns.length === 1 && !/[()]/.test(lblRuns[0]), 'Urdu answer label isolates only the unit symbol: ' + JSON.stringify(lblRuns));
  await page.selectOption('#edu-lang', lang);
  await page.waitForTimeout(300);
  expect(await txt('#pr-qno') === t('pr_q', { n: await page.$eval('#pr-qno', (e) => e.textContent.replace(/\D+/g, '')) }), 'practice re-renders after switching back from Urdu');

  await page.click('#tab-convert');
  log('unit-converter test ok');
};
