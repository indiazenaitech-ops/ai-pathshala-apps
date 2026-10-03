/* Interaction test for tokenizer-lab (Token Explorer), run by tools/verify.js in en and hi. */
module.exports = async function ({ page, expect, t }) {
  const num = async (sel) => parseInt(String(await page.textContent(sel)).replace(/[^\d]/g, ''), 10);
  const setRange = (sel, v) => page.$eval(sel, (el, v) => { el.value = String(v); el.dispatchEvent(new Event('input', { bubbles: true })); }, v);
  const ids = () => page.$$eval('#chips .tk', els => els.map(e => +e.dataset.id));
  const cmp = async () => {
    const rows = await page.$$eval('#cmp-rows .cmp-row', els => els.map(e => ({ L: e.dataset.lang, en: +e.dataset.en, mu: +e.dataset.multi })));
    const by = {}; rows.forEach(r => { by[r.L] = r; });
    return { rows, by };
  };

  // 1) Defaults: BPE with up to 300 merges, the example sentence is tokenized and the 12-language chart is drawn.
  expect(await page.getAttribute('#mode-bpe', 'aria-pressed') === 'true', 'BPE is the default mode');
  const defN = await page.inputValue('#merges');
  expect(+defN > 100 && +defN <= 300, 'default merges = 300, or fewer if the training text allows fewer; got ' + defN);
  const tok0 = await num('#stat-tokens'), chars0 = await num('#stat-chars');
  expect(tok0 > 5 && tok0 < chars0, 'BPE should give fewer tokens than characters, got ' + tok0 + ' / ' + chars0);
  let c = await cmp();
  expect(c.rows.length === 12, 'comparison should have 12 languages, got ' + c.rows.length);
  expect(c.by.hi.en > 3 * c.by.en.en, 'English-only tokenizer: Hindi should need > 3x the English tokens, got ' + c.by.hi.en + ' vs ' + c.by.en.en);
  expect(c.by.ta.mu < c.by.ta.en && c.by.hi.mu < c.by.hi.en, 'multilingual tokenizer should need fewer tokens for Hindi and Tamil');
  const summary = (await page.textContent('#cmp-summary')).trim();
  expect(summary.length > 20 && !/\{\w+\}/.test(summary), 'fairness summary is filled in: ' + summary);
  // Shared vocabulary budget: the 12-language tokenizer needs more tokens for English.
  expect(c.by.en.mu > c.by.en.en && await page.isVisible('#cmp-budget'), 'budget note shown when English gets more tokens from the 12-language tokenizer');
  // Byte pieces: a token that is part of a character shows its raw bytes next to readable text.
  const pieces = await page.evaluate(() => JSON.stringify(window.TOKLAB.pieces([0xE0, 0xA4, 0xA8, 0xE0, 0xA4])));
  expect(pieces === JSON.stringify([{ s: 'न', raw: false }, { s: 'E0 A4', raw: true }]), 'pieces() splits full letters from leftover bytes: ' + pieces);

  // 2) 0 merges = raw UTF-8 bytes: tokens == bytes, both tokenizers identical.
  await setRange('#merges', 0);
  expect(await num('#stat-tokens') === await num('#stat-bytes'), 'at 0 merges every token is one byte');
  c = await cmp();
  const hiBytes = await page.evaluate(() => new TextEncoder().encode(window.APP_CONTENT.hi.sentence).length);
  expect(c.by.hi.en === hiBytes && c.by.hi.mu === hiBytes, 'at 0 merges the Hindi sentence = ' + hiBytes + ' byte tokens, got ' + c.by.hi.en + '/' + c.by.hi.mu);
  expect(await page.$$eval('#merge-list li', els => els.length) === 0, 'no merges listed at 0');

  // 3) Character mode: "नमस्ते" = 6 Unicode characters, 18 bytes, first ID = U+0928 = 2344.
  await page.click('#mode-char');
  await page.fill('#input', 'नमस्ते');
  expect(await num('#stat-tokens') === 6, 'नमस्ते has 6 code points, got ' + await page.textContent('#stat-tokens'));
  expect(await num('#stat-bytes') === 18, 'नमस्ते is 18 UTF-8 bytes');
  expect((await ids())[0] === 2344, 'first character ID should be 2344 (न)');

  // 4) Train BPE on our own text: "the the the then" allows exactly 3 merges (h+e, t+he, ␣+the).
  await page.click('#mode-bpe');
  await page.click('#src-own');
  expect(await page.getAttribute('#src-own', 'aria-pressed') === 'true', 'own text selected');
  await page.fill('#own-text', 'the the the then');
  await setRange('#merges', 3);
  expect(await page.$$eval('#merge-list li', els => els.length) === 3, 'merge list should show 3 merges');
  await page.fill('#input', 'the then');
  expect(await num('#stat-tokens') === 3, '"the then" should be 3 tokens after 3 merges, got ' + await page.textContent('#stat-tokens'));
  const bpeIds = await ids();
  expect(bpeIds.join(',') === '257,258,110', 'token IDs should be [257, 258, 110], got ' + bpeIds.join(','));
  expect((await page.textContent('#ids-box')).replace(/\s/g, '') === '[257,258,110]', 'ID list box matches');
  await setRange('#merges', 50);
  expect(await page.isVisible('#merges-early'), 'warning: this text allows only 3 merges');
  expect((await page.textContent('#vocab-size')).includes('259'), 'vocabulary = 256 + 3 = 259');
  await setRange('#merges', 0);
  expect(await num('#stat-tokens') === 8, '"the then" = 8 bytes at 0 merges');

  // 5) "Watch it learn" animates up to the 3 possible merges.
  await page.click('#play');
  await page.waitForTimeout(1200);
  expect(await page.inputValue('#merges') === '3', 'play should stop at 3 merges, got ' + await page.inputValue('#merges'));
  expect(await num('#stat-tokens') === 3, 'after playing, "the then" is 3 tokens again');

  // 6) Word mode: words not in the training word list become [UNK] (ID 0).
  await page.click('#mode-word');
  await page.fill('#input', 'the cat then');
  expect(await num('#stat-unk') === 1, 'one unknown word (cat)');
  expect((await ids()).join(',') === '1,0,2', 'word IDs should be [1, 0, 2], got ' + (await ids()).join(','));

  // 7) Bytes demo and context window estimate.
  await page.fill('#byte-in', 'aक😊');
  expect(await page.$$eval('#byte-body tr', els => els.length) === 3, 'byte table has 3 rows');
  expect((await page.textContent('#byte-total')).trim() === t('byte_total', { c: '3', b: '8' }), 'a + क + 😊 = 1 + 3 + 4 = 8 bytes');
  const fit = parseInt(await page.getAttribute('#ctx-out', 'data-fit'), 10);
  expect(fit > 0, 'context window estimate is computed');

  // 8) Settings and own text survive a reload.
  await page.waitForTimeout(400);
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(800);
  expect(await page.getAttribute('#mode-word', 'aria-pressed') === 'true', 'word mode persists');
  expect(await page.inputValue('#own-text') === 'the the the then', 'own training text persists');
  expect(await page.inputValue('#input') === 'the cat then', 'input text persists');
  expect(await num('#stat-unk') === 1, 'retrained from saved text after reload');

  // 9) Reset brings back the defaults.
  await page.click('#reset-btn');
  await page.waitForTimeout(300);
  expect(await page.getAttribute('#mode-bpe', 'aria-pressed') === 'true', 'reset: BPE mode');
  expect(await page.inputValue('#merges') === defN, 'reset: default merges ' + defN);
  expect(await page.getAttribute('#src-own', 'aria-pressed') === 'false', 'reset: default training text');
};
