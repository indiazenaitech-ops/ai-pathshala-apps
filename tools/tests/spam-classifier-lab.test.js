/* Interaction test for Spam Classifier Lab (run by tools/verify.js in en and hi, empty localStorage).
 * Covers the spec checks: the lottery message = spam, "Class cancelled tomorrow" = ham, Laplace smoothing maths
 * (checked against the raw counts), unseen words skipped, empty message, adding 3 real (ham) messages changes a
 * probability, adding your own message retrains, the confusion matrix adds up to the test set. */
'use strict';
module.exports = async function ({ page, lang, expect, t, log }) {
  const wf = (fn, arg) => page.waitForFunction(fn, arg, { timeout: 10000 });
  await page.waitForSelector('#verdict');
  const tries = await page.evaluate(L => window.APP_CONTENT[L].tries, lang);

  /* 1. the default message is the lottery one: spam */
  expect((await page.inputValue('#msg')) === tries.spam, 'lottery message preloaded');
  await wf(() => document.querySelector('#verdict').dataset.label === 'spam');
  const pSpam = parseFloat(await page.getAttribute('#verdict', 'data-p'));
  expect(pSpam > 0.9, 'lottery message is spam, p = ' + pSpam);

  /* 2. "Class cancelled tomorrow" = ham */
  await page.click('.try-chip[data-kind="ham"]');
  await wf(() => document.querySelector('#verdict').dataset.label === 'ham');
  expect(parseFloat(await page.getAttribute('#verdict', 'data-p')) < 0.5, 'class cancelled = not spam');

  /* 3. Laplace smoothing by hand for every word in the maths table */
  await page.fill('#msg', tries.spam);
  await wf(() => document.querySelectorAll('#maths-table tbody tr').length > 0);
  const check = await page.evaluate(() => {
    const NB = window.SpamNB, out = [];
    const st = JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => /spam-classifier-lab/.test(k))) || 'null');
    // rebuild the training counts independently from the visible training lists (badge "test" = held out)
    const docs = [];
    ['spam', 'ham'].forEach(k => document.querySelectorAll('#list-' + k + ' li[data-id]').forEach(li => {
      if (li.querySelector('.badge')) return;
      docs.push({ label: k, tokens: NB.tokenize(li.querySelector('.msg-text').textContent) });
    }));
    const counts = { spam: {}, ham: {} }, nw = { spam: 0, ham: 0 }, vocab = new Set();
    docs.forEach(d => d.tokens.forEach(w => { counts[d.label][w] = (counts[d.label][w] || 0) + 1; nw[d.label]++; vocab.add(w); }));
    const V = vocab.size;
    document.querySelectorAll('#maths-table tbody tr').forEach(tr => {
      const w = tr.dataset.word;
      const ps = ((counts.spam[w] || 0) + 1) / (nw.spam + V), ph = ((counts.ham[w] || 0) + 1) / (nw.ham + V);
      const shownS = parseFloat(tr.querySelector('.ps .num').textContent), shownH = parseFloat(tr.querySelector('.ph .num').textContent);
      out.push({ w, ok: Math.abs(shownS - ps) / ps < 0.01 && Math.abs(shownH - ph) / ph < 0.01, ps, shownS, ph, shownH });
    });
    return { rows: out, V, st: !!st };
  });
  expect(check.rows.length >= 3 && check.rows.every(r => r.ok), 'P(word|class) = (count+1)/(words+V) for every word, V=' + check.V + ': ' + JSON.stringify(check.rows.filter(r => !r.ok)));

  /* 4. unseen word skipped, empty message */
  await page.fill('#msg', tries.spam + ' qwzxv');
  await wf(() => !!document.querySelector('#bars .ev-row.unk[data-word="qwzxv"]'));
  expect((await page.textContent('#maths-body')).includes('qwzxv') && !(await page.$('#maths-table tr[data-word="qwzxv"]')), 'unseen word is listed as skipped, not in the maths');
  await page.fill('#msg', '');
  await wf(() => document.querySelector('#result').hidden && !document.querySelector('#check-status').hidden);
  expect((await page.textContent('#check-status')).trim() === t('empty_msg'), 'empty message handled');

  /* 5. experiment: adding 3 real messages changes the tricky message's probability */
  const nHam = parseInt(await page.getAttribute('#cnt-ham', 'data-n'), 10);
  await page.click('#exp-btn');
  await page.waitForSelector('#exp-res .ba');
  const ba = await page.evaluate(() => { const d = document.querySelector('#exp-res .ba').dataset; return [parseFloat(d.before), parseFloat(d.after)]; });
  expect(ba[1] < ba[0] - 0.01, 'adding 3 ham examples lowers P(spam) of the tricky message: ' + ba.join(' → '));
  expect(parseInt(await page.getAttribute('#cnt-ham', 'data-n'), 10) === nHam + 3, '3 ham messages added');
  await page.click('#undo-btn');
  await wf(n => parseInt(document.querySelector('#cnt-ham').dataset.n, 10) === n, nHam);

  /* 6. add your own spam message and retrain */
  const before = parseInt(await page.getAttribute('#cnt-spam', 'data-n'), 10);
  await page.click('#add-spam');
  await page.fill('#add-input', 'zorbo zorbo prize');
  await page.press('#add-input', 'Enter');
  await wf(n => parseInt(document.querySelector('#cnt-spam').dataset.n, 10) === n + 1, before);
  await page.fill('#msg', 'zorbo');
  await wf(() => document.querySelector('#verdict').dataset.label === 'spam');
  expect(true, 'own message retrains: "zorbo" is now a spam word');

  /* 7. confusion matrix adds up to the test set */
  const cm = await page.evaluate(() => ['tp', 'fp', 'fn', 'tn'].map(k => parseInt(document.querySelector('#cm-' + k).dataset.n, 10)));
  const nTest = parseInt((await page.textContent('#st-test')).trim(), 10);
  expect(cm.reduce((a, b) => a + b, 0) === nTest && nTest === 10, 'confusion matrix sums to ' + nTest + ': ' + cm.join(','));
  log('spam ok p=' + pSpam.toFixed(4) + ' exp ' + ba.map(x => x.toFixed(3)).join('→') + ' cm ' + cm.join(','));
};
