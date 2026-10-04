/* Interaction test for Python Playground (run by tools/verify.js in en and hi).
   Pyodide (~10 MB) comes from the CDN, so the first wait is long. */
module.exports = async function ({ page, lang, expect, t, log }) {
  // Our own dialog handler: answer input() prompts (null = press Cancel), accept confirms.
  page.removeAllListeners('dialog');
  const answers = [];
  let prompts = 0, confirms = 0;
  page.on('dialog', (d) => {
    if (d.type() === 'prompt') {
      prompts++;
      const a = answers.length ? answers.shift() : '';
      (a === null ? d.dismiss() : d.accept(a)).catch(() => { });
    } else { confirms++; d.accept().catch(() => { }); }
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

  // 8b) Code typed just before Ctrl+Enter is saved before Python runs (a frozen tab must not lose it)
  await page.fill('#code', 'print("saved first")');
  await page.focus('#code');
  await page.keyboard.press('End');
  await page.keyboard.type('  # v2');
  before = await page.evaluate(() => window.PP_STATE.runs);
  await page.keyboard.press('Control+Enter');
  await page.waitForFunction((b) => window.PP_STATE.runs > b && !window.PP_STATE.running, before, { timeout: 60000 });
  const saved2 = await page.evaluate(() => JSON.parse(localStorage.getItem('edu.python-playground.code') || 'null'));
  expect(saved2 === 'print("saved first")  # v2', 'code saved at Run time, got ' + JSON.stringify(saved2));

  // 8c) sys.stdin.readline() and help() work (Pyodide's own stdin used to fail)
  answers.push('42');
  await page.fill('#code', 'import sys\nline = sys.stdin.readline()\nprint(int(line) * 2)\nhelp(len)');
  out = await runAndWait();
  expect(out.includes('84'), 'sys.stdin.readline() reads the answer, got ' + JSON.stringify(out.slice(0, 200)));
  expect(out.includes('Help on built-in function len'), 'help(len) prints its help text, got ' + JSON.stringify(out.slice(0, 300)));

  // 8d) Cancel in the input box stops the program even inside "while True: try ... except:"
  answers.push(null, '5', '5');
  const p0 = prompts;
  await page.fill('#code', 'while True:\n    try:\n        n = int(input("Number: "))\n        break\n    except:\n        print("Not a number")\nprint("got", n)');
  out = await runAndWait();
  expect(prompts - p0 === 1, 'Cancel stops the program after one prompt, prompts asked: ' + (prompts - p0));
  expect(!out.includes('got 5'), 'program did not go on after Cancel');
  expect((await page.textContent('#hintText')).trim() === t('hint_cancelled'), 'cancel hint shown');
  answers.length = 0;

  // 8e) Loop guard: a never-ending loop is stopped after the confirm box (about 6 s)
  const c0 = confirms;
  await page.fill('#code', 'n = 0\nwhile n >= 0:\n    n = n + 1');
  out = await runAndWait(40000);
  expect(confirms - c0 === 1, 'loop guard asked once, asked ' + (confirms - c0));
  expect(out.includes('KeyboardInterrupt') && (await page.textContent('#hintText')).trim() === t('hint_stopped'), 'runaway loop stopped with the loop hint');

  // 8f) App notes inside the output follow the language picker
  await page.fill('#code', 'x = 1');
  out = await runAndWait();
  expect(out.trim() === t('no_output'), 'empty program shows the no-output note, got ' + JSON.stringify(out));
  const other = lang === 'ur' ? 'ta' : 'ur';
  await page.evaluate((L) => EDU.setLang(L), other);
  const switched = await page.evaluate((L) => [document.getElementById('out').textContent.trim(), window.APP_STRINGS[L].no_output], other);
  expect(switched[0] === switched[1], 'output note re-rendered after language switch, got ' + JSON.stringify(switched[0]));
  // Urdu gets taller text lines from edu.css; the code lines must still match the line-number gutter
  const lh = await page.evaluate(() => [getComputedStyle(document.getElementById('code')).lineHeight, getComputedStyle(document.querySelector('#gutter div')).lineHeight]);
  expect(lh[0] === lh[1], 'editor and gutter line heights match in ' + other + ', got ' + lh.join(' vs '));
  await page.evaluate((L) => EDU.setLang(L), lang);

  // 8g) A share link loads its code, and the student's own earlier code can be brought back
  await page.fill('#code', 'print("my homework")');
  await page.evaluate(() => document.getElementById('code').dispatchEvent(new Event('input')));
  await runAndWait();
  const shareUrl = await page.evaluate(() => location.href.split('#')[0] + '#py=' + EDU.pack({ c: 'print("from teacher")', e: '' }));
  const p2 = await page.context().newPage();
  const p2errs = [];
  p2.on('pageerror', (e) => p2errs.push(String(e)));
  await p2.goto(shareUrl, { waitUntil: 'load' });
  await p2.waitForFunction(() => window.PP_STATE, null, { timeout: 15000 });
  expect((await p2.inputValue('#code')) === 'print("from teacher")', 'shared link code loaded');
  expect(await p2.isVisible('#restoreBtn'), 'restore button offered after a link replaced own code');
  await p2.click('#restoreBtn');
  expect((await p2.inputValue('#code')) === 'print("my homework")' && !(await p2.isVisible('#linkNote')), 'own code restored');
  expect(!p2errs.length, 'no page errors on the shared link: ' + p2errs.join(' | '));
  await p2.close();

  // 9) matplotlib chart (downloads numpy + matplotlib on first use). Picking the example starts the
  //    download in the background; the status bar must say so (slowed down here so it is visible).
  await page.route(/matplotlib-[^/]*\.whl/, async (r) => { await new Promise((res) => setTimeout(res, 2000)); r.continue().catch(() => { }); });
  await page.selectOption('#exSel', 'bar');
  await page.waitForFunction(() => /matplotlib/.test(document.getElementById('ppStatusText').textContent), null, { timeout: 15000 });
  out = await runAndWait(100000);
  await page.unroute(/matplotlib-[^/]*\.whl/);
  const imgs = await page.$$eval('#out img', (els) => els.map((e) => e.naturalWidth));
  expect(imgs.length === 1 && imgs[0] > 200, 'bar chart example draws one chart image, got ' + JSON.stringify(imgs));
  const info = (await page.textContent('#runInfo')).trim();
  expect(info.startsWith('✓'), 'run finished without error, got ' + info);
  await page.evaluate(() => window.scrollTo(0, 0));   // clean full-page screenshot (sticky header)
  log('all steps done in ' + Math.round((Date.now() - t0) / 1000) + ' s');
};
