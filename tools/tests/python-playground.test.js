/* Interaction test for Python Playground (run by tools/verify.js in en and hi).
   Pyodide (~10 MB) comes from the CDN, so the first wait is long. */
module.exports = async function ({ page, expect, t, log }) {
  // Our own dialog handler: answer input() prompts, accept confirms.
  page.removeAllListeners('dialog');
  const answers = [];
  page.on('dialog', (d) => {
    if (d.type() === 'prompt') d.accept(answers.length ? answers.shift() : '').catch(() => { });
    else d.accept().catch(() => { });
  });

  // 1) Python loads (wait up to 90 s)
  const t0 = Date.now();
  await page.waitForFunction(() => window.PP_STATE && window.PP_STATE.ready, null, { timeout: 90000 });
  log('Pyodide ready in ' + Math.round((Date.now() - t0) / 1000) + ' s');
  const status = await page.textContent('#ppStatusText');
  expect(/3\.\d+/.test(status), 'status shows the Python version, got: ' + status);

  async function runAndWait(timeout) {
    const before = await page.evaluate(() => window.PP_STATE.runs);
    await page.click('#runBtn');
    await page.waitForFunction((b) => window.PP_STATE.runs > b && !window.PP_STATE.running, before, { timeout: timeout || 60000 });
    return (await page.textContent('#out')) || '';
  }

  // 2) print(2+3) -> 5
  await page.fill('#code', 'print(2+3)');
  let out = await runAndWait();
  expect(out.trim() === '5', 'print(2+3) should print 5, got ' + JSON.stringify(out));

  // 3) input() goes through a prompt dialog
  answers.push('Asha');
  await page.fill('#code', 'name = input("Your name? ")\nprint("Namaste", name.upper(), len(name))');
  out = await runAndWait();
  expect(out.includes('Your name? Asha'), 'input prompt and answer are echoed, got ' + JSON.stringify(out));
  expect(out.includes('Namaste ASHA 4'), 'input() value reaches the program, got ' + JSON.stringify(out));

  // 4) A runtime error shows the traceback, a localized hint and marks the line
  await page.fill('#code', 'marks = [10, 20]\ntotal = 0\nprint(marks[0] / total)');
  out = await runAndWait();
  expect(out.includes('ZeroDivisionError'), 'traceback names ZeroDivisionError, got ' + JSON.stringify(out));
  expect(out.includes('line 3'), 'traceback points at line 3');
  const hint = (await page.textContent('#hintText')).trim();
  expect(hint === t('hint_ZeroDivisionError', { n: 3 }), 'localized hint for line 3, got ' + hint);
  const marked = await page.textContent('#gutter .pp-eline');
  expect(marked && marked.trim() === '3', 'gutter marks line 3');

  // 5) Editor: auto-indent after ":" and Ctrl+Enter to run
  await page.fill('#code', '');
  await page.focus('#code');
  await page.keyboard.type('for i in range(4):');
  await page.keyboard.press('Enter');
  await page.keyboard.type('print(i * i)');
  const val = await page.inputValue('#code');
  expect(val === 'for i in range(4):\n    print(i * i)', 'auto-indent after ":" gives 4 spaces, got ' + JSON.stringify(val));
  let before = await page.evaluate(() => window.PP_STATE.runs);
  await page.keyboard.press('Control+Enter');
  await page.waitForFunction((b) => window.PP_STATE.runs > b && !window.PP_STATE.running, before, { timeout: 60000 });
  out = await page.textContent('#out');
  expect(out.trim().split(/\s+/).join(',') === '0,1,4,9', 'Ctrl+Enter ran the loop, got ' + JSON.stringify(out));

  // 6) Syntax error: missing colon
  await page.fill('#code', 'x = 5\nif x > 3\n    print("big")');
  out = await runAndWait();
  expect(out.includes('SyntaxError'), 'missing colon gives SyntaxError');
  expect((await page.textContent('#hintText')).trim() === t('hint_SyntaxError', { n: 2 }), 'syntax hint for line 2');

  // 7) Examples menu: load the loops example and run it
  await page.selectOption('#exSel', 'loops');
  const code = await page.inputValue('#code');
  expect(code.includes('range(1, 11)'), 'loops example loaded into the editor');
  out = await runAndWait();
  expect(out.includes('7 x 10 = 70') && out.includes('Sum of digits of 2026 = 10'), 'loops example output is correct');

  // 8) Code is saved on the device
  const savedCode = await page.evaluate(() => JSON.parse(localStorage.getItem('edu.python-playground.code') || 'null'));
  expect(savedCode && savedCode.includes('range(1, 11)'), 'code saved with EDU.store');

  // 9) matplotlib chart (downloads numpy + matplotlib on first use)
  await page.selectOption('#exSel', 'bar');
  out = await runAndWait(100000);
  const imgs = await page.$$eval('#out img', (els) => els.map((e) => e.naturalWidth));
  expect(imgs.length === 1 && imgs[0] > 200, 'bar chart example draws one chart image, got ' + JSON.stringify(imgs));
  const info = (await page.textContent('#runInfo')).trim();
  expect(info.startsWith('✓'), 'run finished without error, got ' + info);
  await page.evaluate(() => window.scrollTo(0, 0));   // clean full-page screenshot (sticky header)
  log('all steps done in ' + Math.round((Date.now() - t0) / 1000) + ' s');
};
