/* Interaction test for sentiment-trainer (Train a Mood Detector), run by tools/verify.js in en and hi. */
const fs = require('fs');
module.exports = async function ({ page, lang, expect }) {
  const num = async (sel) => parseFloat(String(await page.textContent(sel)).replace(/[^\d.]/g, ''));
  const counts = () => page.$$eval('.lab-card', els => els.map(e => +e.dataset.count));
  const attr = (sel, a) => page.getAttribute(sel, a);
  const add = async (idx, text) => { await page.fill(`.lab-card[data-idx="${idx}"] .add-input`, text); await page.press(`.lab-card[data-idx="${idx}"] .add-input`, 'Enter'); };
  const near = (a, b, eps) => Math.abs(a - b) < (eps || 0.002);
  // A real paste of several lines into a one-line <input> loses the line breaks, so the app handles 'paste' itself.
  const paste = (sel, text) => page.$eval(sel, (inp, txt) => {
    const dt = new DataTransfer(); dt.setData('text/plain', txt); inp.focus();
    inp.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  }, text);

  // 1) Sample sentences are ready: two labels with 10 sentences each, model not trained yet.
  let c = await counts();
  expect(c.length === 2 && c[0] === 10 && c[1] === 10, 'two labels with 10 sample sentences each, got ' + c);
  expect(await page.isHidden('#model-view'), 'model stats are hidden before training');
  const id0 = await attr('.lab-card[data-idx="0"]', 'data-id'), id1 = await attr('.lab-card[data-idx="1"]', 'data-id');

  // 2) Train on the samples: stats appear, the default (happy) test sentence goes to label 1, the sad one to label 2.
  await page.click('#train-btn');
  expect(await num('#st-sentences') === 20, 'trained on 20 sentences, got ' + await page.textContent('#st-sentences'));
  const vocab = await num('#st-vocab');
  expect(vocab > 30, 'sample vocabulary should be > 30 words, got ' + vocab);
  const fair = parseFloat(await attr('#st-fair-acc', 'data-v'));
  expect(fair > 0.5 && fair <= 1, 'fair-test accuracy on samples should be > 50%, got ' + fair);
  expect(await attr('#result', 'data-label') === id0, 'default happy sentence should be guessed as label 1');
  await page.click('.try-chip[data-kind="sad"]');
  expect(await attr('#result', 'data-label') === id1, 'sad try sentence should be guessed as label 2');
  const shown = await page.$$eval('#result .bar-pct, #v-sure', els => els.map(e => e.textContent));
  expect(!shown.some(x => /100/.test(x)), 'a probability is never shown as a flat 100%, got ' + shown);
  expect(await page.$$eval('#words .wtok', els => els.length) >= 4, 'test sentence words are shown as coloured chips');

  // 3) Biased-data experiment raises the chance of the target label, adds 5 sentences, and Undo restores.
  await page.click('#exp2-btn');
  const before = parseFloat(await attr('#exp2-res .ba', 'data-before-p')), after = parseFloat(await attr('#exp2-res .ba', 'data-after-p'));
  expect(after > before + 0.2, `bias should push the test sentence towards label 2 (before ${before}, after ${after})`);
  expect(await attr('#exp2-res .ba', 'data-after-label') === id1, 'after adding biased data the happy sentence is guessed as label 2');
  c = await counts();
  expect(c[1] === 15, 'biased experiment adds 5 sentences to label 2, got ' + c);
  // Switching language re-translates the experiment's lesson and the ready-made test sentence, and back again.
  const msg = await page.textContent('#exp2-res .ba-msg');
  await page.evaluate(() => EDU.setLang('bn'));
  const msgBn = await page.textContent('#exp2-res .ba-msg');
  expect(msgBn !== msg && /[ঀ-৿]/.test(msgBn), 'experiment message follows the language switch, got ' + msgBn);
  expect(await page.inputValue('#test-input') === await page.evaluate(() => APP_CONTENT.bn.bias.test), 'ready-made test sentence switches language');
  await page.evaluate(L => EDU.setLang(L), lang);
  expect(await page.textContent('#exp2-res .ba-msg') === msg, 'experiment message back in the first language');
  // Undo puts the sentences back but keeps a label renamed after the experiment.
  await page.fill('.lab-card[data-idx="1"] .lab-name', 'Gloomy');
  await page.click('#undo-btn');
  c = await counts();
  expect(c[0] === 10 && c[1] === 10, 'undo restores 10 + 10 sentences, got ' + c);
  expect(await page.inputValue('.lab-card[data-idx="1"] .lab-name') === 'Gloomy', 'undo keeps the label name typed after the experiment');

  // 4) A tiny dataset with known answers: check the Naive Bayes maths exactly.
  await page.click('#clear-all-btn');
  c = await counts();
  expect(c[0] === 0 && c[1] === 0, 'clear all empties both labels, got ' + c);
  await add(0, 'good day'); await add(0, 'good food'); await add(1, 'bad day');
  c = await counts();
  expect(c[0] === 2 && c[1] === 1, 'added 2 + 1 sentences, got ' + c);
  await page.click('#train-btn');
  expect(await num('#st-sentences') === 3, '3 sentences trained');
  expect(await num('#st-vocab') === 4, 'vocabulary good/day/food/bad = 4, got ' + await page.textContent('#st-vocab'));
  await page.fill('#test-input', 'good');
  // P(H)=2/3*3/8=1/4, P(S)=1/3*1/6=1/18 -> 9/11
  expect(await attr('#result', 'data-label') === id0, '"good" -> label 1');
  expect(near(parseFloat(await attr('#result', 'data-p')), 9 / 11), '"good" should be 9/11 = 81.8%, got ' + await attr('#result', 'data-p'));
  expect(near(parseFloat(await attr('#words .wtok', 'data-ratio')), 2.25), '"good" is (3/8)/(1/6) = 2.25x more likely in label 1');
  expect((await page.textContent('#v-sure')).includes('82'), 'confidence shows 82%');
  await page.fill('#test-input', 'bad day');
  // P(H)=2/3*1/8*2/8=1/48, P(S)=1/3*2/6*2/6=1/27 -> 48/75 = 0.64
  expect(await attr('#result', 'data-label') === id1, '"bad day" -> label 2');
  expect(near(parseFloat(await attr('#result', 'data-p')), 0.64), '"bad day" should be 64%, got ' + await attr('#result', 'data-p'));
  await page.fill('#test-input', 'zebra');
  expect(near(parseFloat(await attr('#result', 'data-p')), 2 / 3), 'unknown word -> only the starting chance 2/3');
  // Leading spaces must not shift the coloured words (the sentence is rebuilt from token positions).
  await page.fill('#test-input', '   bad day!');
  expect(await page.textContent('#words') === '   bad day!', 'coloured-word view shows the sentence exactly, got ' + JSON.stringify(await page.textContent('#words')));
  expect(near(parseFloat(await attr('#result', 'data-p')), 0.64), 'leading spaces do not change the guess');
  // Pasting several lines adds one sentence per line; "constructor" is just a word (no Object.prototype leaks).
  await paste('.lab-card[data-idx="1"] .add-input', 'bad cat\r\nthe constructor\n\n');
  c = await counts();
  expect(c[0] === 2 && c[1] === 3, 'pasting 2 lines adds 2 sentences, got ' + c);
  await page.click('#train-btn');
  await page.fill('#test-input', 'constructor');
  expect(await page.textContent('#word-detail .wd-word') === '“constructor”', 'the word "constructor" is shown as itself, got ' + await page.textContent('#word-detail .wd-word'));
  // V = good, day, food, bad, cat, the, constructor = 7 words: (0+1)/(4+7) in label 1, (1+1)/(6+7) in label 2
  expect(near(parseFloat(await attr('#words .wtok', 'data-ratio')), (2 / 13) / (1 / 11)), '"constructor" is (2/13)/(1/11) = 1.69x more likely in label 2, got ' + await attr('#words .wtok', 'data-ratio'));
  // An Urdu sentence keeps right-to-left word order even on an English page (and the reverse).
  await page.fill('#test-input', 'میں خوش ہوں');
  expect(await attr('#words', 'dir') === 'rtl', 'Urdu test sentence is shown right-to-left');
  await page.fill('#test-input', 'good day');
  expect(await attr('#words', 'dir') === 'ltr', 'English test sentence is shown left-to-right');

  // 5) Add a third label: the Angry preset comes with 10 sample sentences.
  await page.click('#add-label-btn');
  c = await counts();
  expect(c.length === 3 && c[2] === 10, 'third label with 10 samples, got ' + c);

  // 6) Export CSV contains every sentence; two labels given the same name stay apart in the file.
  await page.fill('.lab-card[data-idx="1"] .lab-name', await page.inputValue('.lab-card[data-idx="0"] .lab-name'));
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#export-btn')]);
  const csv = fs.readFileSync(await dl.path(), 'utf8');
  const lines = csv.trim().split(/\r?\n/);
  expect(lines.length === 16 && csv.includes('good food') && csv.includes('the constructor') && /text,label,emoji/.test(lines[0]), 'CSV has a header + 15 rows, got ' + lines.length);
  const csvLabels = new Set(lines.slice(1).map(l => (l.match(/,([^,]*),[^,]*$/) || [])[1]));
  expect(csvLabels.size === 3, 'three different label names in the CSV, got ' + [...csvLabels]);

  // 7) Import a CSV with three new labels.
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#import-btn')]);
  await fc.setFiles({ name: 'moods.csv', mimeType: 'text/csv', buffer: Buffer.from('text,label\nyay cake,Yummy\nyuck soup,Yucky\nyay mango,Yummy\nmeh rice,Okay\n') });
  await page.waitForFunction(() => document.querySelectorAll('.lab-card').length === 3 && document.querySelector('.lab-card .lab-name').value === 'Yummy', null, { timeout: 5000 });
  c = await counts();
  expect(c.join() === '2,1,1', 'imported 2/1/1 sentences, got ' + c);
  const names = await page.$$eval('.lab-name', els => els.map(e => e.value));
  expect(names.join() === 'Yummy,Yucky,Okay', 'imported label names, got ' + names);
  await page.click('#train-btn');
  await page.fill('#test-input', 'yay');
  expect(await attr('#result', 'data-idx') === '0', '"yay" -> Yummy');
  expect(await page.isDisabled('#exp2-btn') && await page.isHidden('#tries-wrap'), 'Happy/Sad experiments and try chips are off for a custom dataset');

  // 8) Everything survives a reload (and the model is retrained).
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(700);
  c = await counts();
  expect(c.join() === '2,1,1', 'sentences persist after reload, got ' + c);
  expect(await num('#st-sentences') === 4, 'model retrained after reload');
  expect(await page.inputValue('#test-input') === 'yay', 'test sentence persists');

  // 9) "Sample sentences" brings Happy + Sad back in front of the custom labels and re-enables the experiments.
  await page.click('#samples-btn');
  c = await counts();
  expect(c.join() === '10,10,2,1,1', 'sample labels added in front of custom ones, got ' + c);
  expect(!(await page.isDisabled('#exp2-btn')), 'biased-data experiment is available again');
  await page.click('#train-btn');
  expect(await num('#st-sentences') === 24, 'trained on 10 + 10 + 2 + 1 + 1 = 24 sentences, got ' + await page.textContent('#st-sentences'));
  await page.click('.try-chip[data-kind="neg"]');
  expect(await page.$$eval('#result .bar-row', els => els.length) === 5, 'five probability bars for five labels');
};
