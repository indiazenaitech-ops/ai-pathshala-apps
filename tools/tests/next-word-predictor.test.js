/* Interaction test for next-word-predictor, run by tools/verify.js in en and hi. */
module.exports = async function ({ page, lang, expect, t }) {
  const num = async (sel) => parseInt(String(await page.textContent(sel)).replace(/[^\d]/g, ''), 10);
  const setRange = (sel, v) => page.$eval(sel, (el, val) => { el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); }, String(v));
  const dialogs = [];
  page.on('dialog', d => dialogs.push(d.message()));   // verify.js accepts every dialog

  // 1) The sample story is trained on load and gives guesses.
  const vocab0 = await num('#stat-vocab');
  expect(vocab0 > 40, 'sample story vocabulary should be > 40, got ' + vocab0);
  const nCands0 = await page.$$eval('#cands .cand', els => els.length);
  expect(nCands0 >= 1, 'sample story should give at least one guess, got ' + nCands0);
  expect(await page.isHidden('#lines-note'), 'the sample story is prose, not a poem');
  expect((await page.textContent('#hallu-text')).includes(await page.evaluate(() => window.APP_CONTENT[EDU.lang].fake)), 'hallucination example comes from content.js');

  // 2) Train on our own tiny text with known counts.
  await page.fill('#train-text', 'ram eats mango . sita eats rice . ram eats mango .');
  await page.click('#train-btn');
  await page.click('#n-1');
  const pressed = await page.getAttribute('#src-custom', 'aria-pressed');
  expect(pressed === 'true', 'editing the text switches the source to "our own text"');
  expect(await num('#stat-words') === 9, 'words read should be 9, got ' + await page.textContent('#stat-words'));
  expect(await num('#stat-vocab') === 5, 'vocabulary should be 5 (ram eats mango sita rice), got ' + await page.textContent('#stat-vocab'));
  expect(await num('#stat-ngrams') === 8, '8 distinct 2-word patterns expected, got ' + await page.textContent('#stat-ngrams'));

  // 3) Next-word guesses: after "eats" -> mango 2 of 3 times (67%), rice 1 of 3 (33%).
  await page.fill('#start-input', 'sita eats');
  await page.waitForTimeout(150);
  const w0 = (await page.textContent('#cands .cand:nth-child(1) .cand-w')).trim();
  const p0 = (await page.textContent('#cands .cand:nth-child(1) .cand-pct')).trim();
  const w1 = (await page.textContent('#cands .cand:nth-child(2) .cand-w')).trim();
  expect(w0 === 'mango', 'top guess after "eats" should be mango, got ' + w0);
  expect(p0.includes('67'), 'mango should be 67%, got ' + p0);
  expect(w1 === 'rice', 'second guess should be rice, got ' + w1);
  expect((await page.textContent('#cands .cand:nth-child(1) small')).trim() === t('seen', { c: '2', t: '3' }), '"seen 2 of 3 times" under mango');

  // 4) Auto-write with temperature 0 (always top word), 5 words: "mango . ram eats mango . ram"
  await setRange('#temp', 0);
  await setRange('#len', 5);
  await page.click('#write-btn');
  const gen = await page.$$eval('#output .w-gen:not(.w-end)', els => els.map(e => e.textContent.trim()));
  expect(gen.length === 5, 'auto-write should add 5 words, got ' + gen.length);
  expect(gen.join(' ') === 'mango Ram eats mango Ram', 'greedy output should be "mango Ram eats mango Ram", got ' + gen.join(' '));
  const outText = (await page.textContent('#output')).replace(/\s+/g, ' ').trim();
  expect(outText === 'Sita eats mango. Ram eats mango. Ram', 'output text should read "Sita eats mango. Ram eats mango. Ram", got "' + outText + '"');
  const pFirst = await page.getAttribute('#output .w-gen', 'data-p');
  expect(Math.abs(parseFloat(pFirst) - 2 / 3) < 0.001, 'first generated word probability should be 2/3, got ' + pFirst);
  expect(await page.getAttribute('#output .w-gen', 'class').then(c => c.includes('p-high')), 'a 67% word is coloured "very likely"');
  // "sita eats mango ." never appears in the text: the model invented it (1 of 2 judged sentences).
  const sumNew = await page.getAttribute('#sent-summary', 'data-new');
  const sumJudged = await page.getAttribute('#sent-summary', 'data-judged');
  expect(sumNew === '1' && sumJudged === '2', 'expected 1 of 2 sentences invented, got ' + sumNew + '/' + sumJudged);
  const sumText = (await page.textContent('#sent-summary')).trim();
  expect(sumText === t('sum_new', { a: '1', b: '2' }), 'summary text should be translated: ' + sumText);
  expect(await page.$$eval('#output .sent-new', els => els.length) === 1, 'one sentence should be marked as invented');
  expect((await page.textContent('#top-rate')).trim() === t('top_rate', { a: '5', b: '5' }), 'temperature 0 always takes the top guess');

  // 5) Clicking a guess appends it to the sentence; Undo takes it back.
  await page.click('#cands .cand:nth-child(1)');
  const startVal = await page.inputValue('#start-input');
  expect(startVal === 'sita eats mango', 'clicking a guess appends it, got "' + startVal + '"');
  const w0b = (await page.textContent('#cands .cand:nth-child(1) .cand-w')).trim();
  expect(w0b === '.', 'after "mango" the model expects the end of the sentence, got ' + w0b);
  await page.click('#cands .cand:nth-child(1)');
  expect(await page.inputValue('#start-input') === 'sita eats mango.', 'the full stop is added without a space');
  await page.click('#undo-btn');
  expect(await page.inputValue('#start-input') === 'sita eats mango', 'Undo removes the full stop');
  await page.fill('#start-input', 'sita eats mango');

  // 6) Settings and our own text survive a reload.
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(800);
  const taVal = await page.inputValue('#train-text');
  expect(taVal === 'ram eats mango . sita eats rice . ram eats mango .', 'own text should persist, got ' + taVal);
  expect(await page.getAttribute('#n-1', 'aria-pressed') === 'true', 'memory = 1 should persist');
  expect(await num('#stat-vocab') === 5, 'model retrained from saved text after reload');
  expect(await page.inputValue('#start-input') === 'sita eats mango', 'start text should persist');
  expect(await page.inputValue('#temp') === '0' && await page.inputValue('#len') === '5', 'sliders should persist');

  // 7) Write right after editing the text (before the 0.4 s auto-train): the new text is used and the output stays.
  await page.fill('#train-text', 'dogs bark loudly . cats sleep quietly . dogs bark loudly .');
  await page.fill('#start-input', 'cats');
  await page.click('#write-btn');
  const fresh = (await page.textContent('#output')).replace(/\s+/g, ' ').trim();
  expect(fresh.startsWith('Cats sleep quietly.'), 'write uses the text just typed, got "' + fresh + '"');
  await page.waitForTimeout(700);
  expect((await page.textContent('#output')).replace(/\s+/g, ' ').trim() === fresh, 'the output must not vanish when the delayed training runs');

  // 8) Poem mode: line breaks are learned as "end of line" tokens (class poems activity).
  await page.click('#n-2');
  await setRange('#len', 20);
  await page.fill('#train-text', 'Twinkle, twinkle, little star,\nHow I wonder what you are!\nUp above the world so high,\nLike a diamond in the sky.\nTwinkle, twinkle, little star,\nHow I wonder what you are!\n');
  await page.click('#train-btn');
  expect(await page.isVisible('#lines-note'), 'a poem shows the "line by line" note');
  expect((await page.textContent('#lines-note')).trim() === t('lines_note'), 'poem note is translated');
  await page.fill('#start-input', 'little star');
  await page.waitForTimeout(100);
  expect(await page.getAttribute('#cands .cand:nth-child(1)', 'data-w') === '\n', 'after "little star" the model expects the end of the line');
  expect((await page.textContent('#cands .cand:nth-child(1) small')).startsWith(t('end_line')), 'end-of-line guess is labelled');
  await page.click('#cands .cand:nth-child(1)');
  expect(await page.inputValue('#start-input') === 'little star ↵', 'end of line is added as ↵, got ' + await page.inputValue('#start-input'));
  expect((await page.textContent('#cands .cand:nth-child(1) .cand-w')).trim() === 'How', 'a new line starts with "How"');
  await page.fill('#start-input', '');
  await page.waitForTimeout(100);
  expect((await page.textContent('#ctx-chips')).trim() === t('line_start'), 'empty start in a poem = start of a line');
  await page.click('#write-btn');
  const poemLines = await page.$eval('#output', el => el.innerText.split('\n').map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean));
  expect(poemLines.length === 4, 'poem output should have 4 lines, got ' + JSON.stringify(poemLines));
  expect(poemLines[0] === 'How I wonder what you are! ↵', 'a line ending in "!" still ends the line, got ' + poemLines[0]);
  expect(poemLines[2] === 'Like a diamond in the sky. ↵', 'third line, got ' + poemLines[2]);
  expect(await page.getAttribute('#sent-summary', 'data-new') === '0', 'with memory 2 every poem line is copied');
  expect((await page.textContent('#peek-body')).includes(t('end_line')), 'peek table labels end of line');

  // 9) Clear asks before deleting the class's own text; then the model is empty and nothing crashes.
  await page.click('#clear-text');
  expect(dialogs.length === 1 && dialogs[0] === t('confirm_clear'), 'Clear must ask before deleting own text, got ' + JSON.stringify(dialogs));
  expect(await page.inputValue('#train-text') === '', 'text cleared after confirming');
  expect(await num('#stat-words') === 0 && await num('#stat-ngrams') === 0, 'empty model has 0 words and patterns');
  expect(await page.isVisible('#need-text'), 'empty text shows the "add at least 5 words" hint');
  expect(await page.isDisabled('#pick-btn'), 'Let AI pick is disabled with no guesses');
  await page.click('#write-btn');
  expect((await page.textContent('#peek-body')).trim() === t('peek_empty'), 'peek table says nothing learned');

  // 10) Broken saved values are clamped, not crashed on.
  await page.evaluate(() => {
    const p = 'edu.next-word-predictor.';
    localStorage.setItem(p + 'n', '99'); localStorage.setItem(p + 'temp', '-5'); localStorage.setItem(p + 'len', '"x"');
    localStorage.setItem(p + 'src', '"weird"'); localStorage.setItem(p + 'start', '{"text":5}');
  });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(600);
  expect(await page.getAttribute('#n-3', 'aria-pressed') === 'true', 'memory 99 is clamped to 3');
  expect(await page.inputValue('#temp') === '0' && await page.inputValue('#len') === '25', 'bad temperature/length are clamped');
  expect(await page.getAttribute('#src-sample', 'aria-pressed') === 'true' && await num('#stat-vocab') > 40, 'unknown source falls back to the sample story');
};
