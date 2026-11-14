/* Interaction test for Handwriting Practice Sheets (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, lang, expect, log }) {
  const rows = () => page.$$eval('#pages g.row', rs => rs.map(r => ({
    text: r.dataset.text, traces: +r.dataset.traces,
    model: r.querySelectorAll('text.model').length, tr: r.querySelectorAll('text.tr').length, dots: r.querySelectorAll('circle.sd').length,
    lines: r.querySelectorAll('line.gl').length,
    xs: [...r.querySelectorAll('text.model'), ...r.querySelectorAll('text.tr')].map(t => +t.getAttribute('x'))
  })));
  const pages = () => page.$$eval('#pages svg.page', p => p.length);

  /* 1. opens with a sample sheet in the script of the interface language */
  let R = await rows();
  expect(await pages() >= 1 && R.length >= 10, 'a sample sheet is shown on load');
  expect(await page.$eval('#script', s => s.value) === (lang === 'hi' ? 'deva_hi' : 'en_caps'), 'default script follows the language');
  expect(R[0].text === (lang === 'hi' ? 'अ' : 'A'), 'first row is the first letter, got ' + R[0].text);
  expect(R.every(r => r.model === 1 && r.tr === r.traces && r.tr >= 1), 'every row has one solid model letter and traceable copies');
  expect(R[0].lines === 4, 'four guide lines per row');
  expect((await page.textContent('#pages svg.page .ttl')).trim().length > 3, 'sheet has a heading');

  /* 2. numbers: 10 rows 0..9, medium size, half the row is left empty */
  await page.selectOption('#script', 'nums');
  R = await rows();
  expect(R.length === 10 && R.map(r => r.text).join('') === '0123456789', 'numbers 0-9 give 10 rows in order');
  const perPageM = await page.$$eval('#pages svg.page', p => p[0].querySelectorAll('g.row').length);
  expect(R[0].xs.every((x, i, a) => i === 0 || x > a[i - 1]), 'English rows run left to right');
  expect(Math.max(...R[0].xs) < 125, 'half the row stays empty for free writing (last copy at x=' + Math.max(...R[0].xs) + ')');
  expect(R.every(r => r.dots === r.traces), 'one starting dot on each traceable number');
  const d0 = await page.$eval('#pages g.row circle.sd', c => ({ x: +c.getAttribute('cx'), y: +c.getAttribute('cy') }));
  expect(d0.x > 13 && d0.x < 197 && d0.y > 20 && d0.y < 284, 'starting dot is inside the page');

  /* 3. options: bigger letters -> fewer rows per page; full row; grey style; no start dots */
  await page.click('#size button[data-v="xl"]');
  const perPageXL = await page.$$eval('#pages svg.page', p => p[0].querySelectorAll('g.row').length);
  expect(perPageXL < perPageM, 'very large letters give fewer rows per page (' + perPageXL + ' < ' + perPageM + ')');
  expect(await pages() === Math.ceil(10 / perPageXL), 'pages = rows / rows per page');
  expect((await page.textContent('#status')).includes('10'), 'status shows the row count');
  await page.selectOption('#fill', 'full');
  R = await rows();
  expect(Math.max(...R[0].xs) > 160, 'full rows have copies up to the end');
  expect(await page.$eval('#pages text.tr', t => t.getAttribute('fill') === '#fff' && !!t.getAttribute('stroke-dasharray')), 'default trace style is dotted outline');
  await page.click('#style button[data-v="grey"]');
  expect(await page.$eval('#pages text.tr', t => t.getAttribute('fill') === '#c6c9ce' && !t.getAttribute('stroke')), 'grey style fills the letters light grey');
  await page.uncheck('#startDot');
  expect(await page.$$eval('#pages circle.sd', c => c.length) === 0, 'starting dots can be turned off');
  await page.selectOption('#fill', 'model');
  R = await rows();
  expect(R.every(r => r.model === 1 && r.tr === 0), 'model-only rows have no copies');
  await page.selectOption('#fill', 'half');

  /* 4. rows per page and rows per letter */
  await page.click('#size button[data-v="s"]');
  await page.selectOption('#rows', '5');
  await page.selectOption('#repeat', '2');
  R = await rows();
  expect(R.length === 20 && R[0].text === '0' && R[1].text === '0' && R[2].text === '1', 'two rows for each number');
  expect(await pages() === 4, '20 rows at 5 per page = 4 pages, got ' + await pages());
  await page.selectOption('#repeat', '1');
  await page.selectOption('#rows', 'auto');

  /* 5. choosing letters */
  await page.selectOption('#script', 'en_small');
  await page.click('#selNone');
  expect((await rows()).every(r => r.text === ''), 'no letters -> blank writing lines');
  expect(await page.$$eval('#msg .callout', c => c.length) === 1, 'a note explains the empty sheet');
  await page.click('#letters button[data-i="0"]');
  await page.click('#letters button[data-i="25"]');
  R = await rows();
  expect(R.length === 2 && R[0].text === 'a' && R[1].text === 'z', 'only the tapped letters are on the sheet');
  await page.click('#selAll');
  expect((await rows()).length === 26, 'All brings back 26 letters');

  /* 6. Urdu rows run right to left */
  await page.selectOption('#script', 'arab');
  R = await rows();
  expect(R.length === 39 && R[0].text === 'ا', 'Urdu alphabet has 39 rows');
  expect(R[0].xs.length >= 2 && R[0].xs.every((x, i, a) => i === 0 || x < a[i - 1]) && R[0].xs[0] > 150, 'Urdu model letter is on the right, copies go left');
  expect(await page.$eval('#pages g.row text.model', t => t.getAttribute('direction') === 'rtl'), 'Urdu text is marked rtl');

  /* 7. Devanagari: vowels only, head-line guides */
  await page.selectOption('#script', 'deva_hi');
  await page.click('#selVow');
  R = await rows();
  expect(R.length === 13 && R[0].text === 'अ' && R[12].text === 'अः', 'Hindi vowels: 13 rows');

  /* 8. own words: a name, a very long word, empty input */
  await page.selectOption('#script', 'custom');
  await page.fill('#customText', 'Asha\n\n   \nKavya Nair');
  R = await rows();
  expect(R.length === 2 && R[0].text === 'Asha' && R[1].text === 'Kavya Nair', 'each typed line becomes a row');
  expect(R[0].traces >= 1, 'short name gets copies to trace');
  await page.fill('#customText', 'Thiruvananthapuram Thiruvananthapuram Th');
  const box = await page.$eval('#pages g.row text.model', t => { const b = t.getBBox(); return { x: b.x, r: b.x + b.width }; });
  expect(box.x >= 12 && box.r <= 198, 'a very long word is made smaller to stay on the page (' + box.x.toFixed(1) + '..' + box.r.toFixed(1) + ')');
  await page.fill('#customText', 'नमस्ते\nسلام');
  R = await rows();
  expect(R.length === 2 && R[1].xs[0] > 100, 'mixed scripts: the Urdu word starts from the right');
  await page.fill('#customText', '');
  R = await rows();
  expect(R.length >= 4 && R.every(r => r.text === '' && r.lines >= 3), 'empty text gives blank ruled rows');
  await page.fill('#customText', '<b>Ravi</b> & "Tara"');
  expect((await rows())[0].text === '<b>Ravi</b> & "Tara"', 'typed text is shown as text, not HTML');

  /* 9. heading */
  await page.fill('#title', 'Class 1 B');
  expect((await page.textContent('#pages svg.page .ttl')).trim() === 'Class 1 B', 'heading is editable');

  /* 10. print layout: only the sheets, each exactly one A4 page */
  await page.selectOption('#script', 'en_caps');
  await page.emulateMedia({ media: 'print' });
  const pr = await page.evaluate(() => {
    const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const s = document.querySelector('#pages svg.page').getBoundingClientRect();
    return { form: vis(document.querySelector('#form')), top: vis(document.querySelector('.edu-top')), w: s.width, h: s.height, x: s.left, n: document.querySelectorAll('#pages svg.page').length };
  });
  expect(!pr.form && !pr.top, 'controls and header are hidden in print');
  expect(Math.abs(pr.w - 793.7) < 2 && Math.abs(pr.h - 1120.6) < 3, 'each sheet is one A4 page in print (' + pr.w.toFixed(1) + ' x ' + pr.h.toFixed(1) + ')');
  const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true }).catch(() => null);
  if (pdf) {
    const n = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    expect(n === pr.n, 'PDF has one page per sheet (' + n + ' vs ' + pr.n + ')');
    log('pdf pages', n);
  }
  await page.emulateMedia({ media: 'screen' });

  /* 11. settings survive a reload; reset brings the sample back */
  await page.reload();
  await page.waitForFunction(() => window.EDU_READY);
  expect(await page.$eval('#script', s => s.value) === 'en_caps' && await page.$eval('#title', i => i.value) === 'Class 1 B', 'settings are remembered');
  await page.click('#resetBtn');
  expect(await page.$eval('#title', i => i.value) !== 'Class 1 B' && await page.$eval('#startDot', c => c.checked), 'reset restores the defaults');
  expect((await rows()).length >= 10, 'sample sheet is back after reset');
};
