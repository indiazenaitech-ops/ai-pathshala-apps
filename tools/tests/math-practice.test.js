/* Interaction test for Mental Maths Challenge (run by tools/verify.js in en and hi).
   ctx = { page, lang, expect(cond, msg), t(key, vars) -> string in ctx.lang, log } */
module.exports = async function ({ page, expect, t, log }) {
  const txt = async (sel) => ((await page.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const visible = (sel) => page.isVisible(sel);

  /* work out the answer from the question text, independently of the app */
  const solve = (raw) => {
    const s = raw.replace(/[\s ]+/g, ' ').replace(/=.*$/, '').trim();
    let m;
    if ((m = s.match(/^(\d+) ([+−×÷]) (\d+)$/))) {
      const a = +m[1], b = +m[3];
      return { '+': a + b, '−': a - b, '×': a * b, '÷': a / b }[m[2]];
    }
    if ((m = s.match(/^(\d+)²$/))) return (+m[1]) ** 2;
    if ((m = s.match(/^(\d+)³$/))) return (+m[1]) ** 3;
    if ((m = s.match(/^³√(\d+)$/))) return Math.round(Math.cbrt(+m[1]));
    if ((m = s.match(/^√(\d+)$/))) return Math.round(Math.sqrt(+m[1]));
    throw new Error('cannot parse question "' + s + '"');
  };
  /* wait until a question box shows a NEW question that accepts input */
  const waitQ = async (sel, prev) => {
    await page.waitForFunction(([s, p]) => {
      const e = document.querySelector(s);
      return e && e.dataset.state === 'ready' && e.dataset.qid !== String(p);
    }, [sel, prev], { timeout: 15000 });
    return page.$eval(sel, (e) => +e.dataset.qid);
  };
  const tapAnswer = async (padSel, value) => {
    for (const ch of String(value)) await page.click(`${padSel} button[data-k="${ch}"]`);
    await page.click(`${padSel} button[data-k="ok"]`);
  };
  const keyAnswer = async (value) => { await page.keyboard.type(String(value)); await page.keyboard.press('Enter'); };

  /* ---------------- setup screen ---------------- */
  expect(await page.getAttribute('#modes [data-mode="sprint"]', 'aria-pressed') === 'true', 'Speed sprint is the default game');
  expect((await page.$$('#sample span')).length === 4, 'four sample questions are shown');
  await page.click('#modes [data-mode="twenty"]');
  await page.click('#levels [data-level="d1"]');
  /* division only: every ÷ sample at every level must have a whole-number answer */
  await page.click('#ops [data-op="div"]');
  await page.click('#ops [data-op="add"]');
  await page.click('#ops [data-op="sub"]');
  let divCount = 0;
  for (const lvl of ['d1', 'd2', 'd3', 'tables']) {
    for (let r = 0; r < 6; r++) {
      await page.click(`#levels [data-level="${lvl}"]`);
      const qs = await page.$$eval('#sample span', (s) => s.map((x) => x.textContent));
      for (const q of qs) {
        expect(q.includes('÷'), 'division-only sample shows ÷: ' + q);
        const a = solve(q);
        expect(Number.isInteger(a) && a >= 1, `${lvl}: ${q} has a whole-number answer (${a})`);
        divCount++;
      }
    }
  }
  log('checked', divCount, 'division questions');
  await page.click('#levels [data-level="d1"]');
  await page.click('#ops [data-op="mul"]');
  await page.click('#ops [data-op="div"]');
  const pressed = await page.$$eval('#ops .chip[aria-pressed="true"]', (bs) => bs.map((b) => b.dataset.op));
  expect(pressed.join() === 'mul', 'only × is selected, got ' + pressed.join());
  await page.click('#ops [data-op="mul"]');           // last one cannot be switched off
  expect(await page.getAttribute('#ops [data-op="mul"]', 'aria-pressed') === 'true', 'the last operation stays selected');
  const samples = await page.$$eval('#sample span', (s) => s.map((x) => x.textContent));
  expect(samples.every((s) => s.includes('×')), 'sample questions are all multiplication: ' + samples.join(' | '));

  /* ---------------- table trainer: in order, a mistake, mistakes round ---------------- */
  await page.click('#modes [data-mode="table"]');
  expect(await visible('#table-wrap') && !(await visible('#level-wrap')), 'table picker replaces the level picker');
  await page.click('#tables [data-table="13"]');
  await page.click('#start');
  let qid = await waitQ('#qa', 0);
  expect((await txt('#q')).replace(/\s/g, '') === '13×1', 'table trainer starts with 13 × 1, got ' + await txt('#q'));
  await keyAnswer(13);
  qid = await waitQ('#qa', qid);
  expect((await txt('#q')).replace(/\s/g, '') === '13×2', 'then 13 × 2 (in order), got ' + await txt('#q'));
  await tapAnswer('#pad', 25);                          // deliberate mistake
  await page.waitForFunction(() => document.querySelector('#qa').dataset.state === 'bad');
  expect((await txt('#fb')).includes('26'), 'wrong answer shows the right answer 26: ' + await txt('#fb'));
  qid = await waitQ('#qa', qid);
  await tapAnswer('#pad', solve(await txt('#q')));
  await page.waitForFunction(() => document.querySelectorAll('#facts span').length === 3);
  expect((await page.$$('#facts span.bad')).length === 1, 'the table so far shows one wrong fact in red');
  await page.click('#end-play');
  await page.waitForSelector('#summary', { state: 'visible' });
  expect((await txt('#sum-correct')).replace(/\s/g, '') === '2/3', 'table summary: 2 of 3 correct, got ' + await txt('#sum-correct'));
  expect((await page.$$('#sum-mistakes tbody tr')).length === 1, 'one mistake listed');
  expect((await txt('#sum-mistakes tbody td.r')) === '26', 'mistake row shows correct answer 26');

  await page.click('#practise-mist');
  qid = await waitQ('#qa', 0);
  for (let i = 0; i < 2; i++) {
    const q = await txt('#q');
    expect(q.replace(/\s/g, '') === '13×2', 'mistakes round repeats 13 × 2, got ' + q);
    await tapAnswer('#pad', solve(q));
    if (i === 0) qid = await waitQ('#qa', qid);
  }
  await page.waitForSelector('#summary', { state: 'visible' });
  expect((await txt('#sum-correct')).replace(/\s/g, '') === '2/2', 'mistakes round: 2 of 2 correct');
  expect(await visible('#sum-nomist'), 'no-mistakes message shown');

  /* ---------------- two-player race ---------------- */
  await page.click('#to-setup');
  await page.click('#modes [data-mode="duel"]');
  await page.fill('#name0', 'Riya');
  await page.fill('#name1', 'Aman');
  await page.click('#targets [data-target="10"]');
  await page.click('#start');
  let q0 = await waitQ('#p0', 0);
  let q1 = await waitQ('#p1', 0);
  // Player 2: one wrong answer, then two right answers (on-screen pad)
  await tapAnswer('#p1 .mp-pad', solve(await txt('#p1 .mp-q')) + 1);
  q1 = await waitQ('#p1', q1);
  for (let i = 0; i < 2; i++) {
    await tapAnswer('#p1 .mp-pad', solve(await txt('#p1 .mp-q')));
    q1 = await waitQ('#p1', q1);
  }
  // Player 1: ten right answers (keyboard top-row digits + Enter, and the pad)
  for (let i = 0; i < 10; i++) {
    const a = solve(await txt('#p0 .mp-q'));
    if (i % 2) await keyAnswer(a); else await tapAnswer('#p0 .mp-pad', a);
    if (i < 9) q0 = await waitQ('#p0', q0);
  }
  await page.waitForSelector('#duel-result', { state: 'visible' });
  expect((await txt('#dres-title')).includes('Riya'), 'Riya wins the race: ' + await txt('#dres-title'));
  expect(await txt('#dres-row0 .c-ok') === '10', 'Riya has 10 correct');
  expect(await txt('#dres-row1 .c-ok') === '2' && await txt('#dres-row1 .c-bad') === '1', 'Aman has 2 correct and 1 wrong');

  /* ---------------- 20 questions: 18 right, 2 wrong ---------------- */
  await page.click('#duel-settings');
  await page.click('#modes [data-mode="twenty"]');
  await page.click('#start');
  qid = 0;
  const wrong = [];
  for (let i = 1; i <= 20; i++) {
    qid = await waitQ('#qa', qid);
    const q = await txt('#q');
    let a = solve(q);
    expect(Number.isInteger(a) && a >= 0, 'answer is a whole number: ' + q);
    if (i > 18) { wrong.push(a); a = a + 1; }
    if (i % 2) await keyAnswer(a); else await tapAnswer('#pad', a);
  }
  await page.waitForSelector('#summary', { state: 'visible', timeout: 15000 });
  expect((await txt('#sum-correct')).replace(/\s/g, '') === '18/20', '18 of 20 correct, got ' + await txt('#sum-correct'));
  expect(await txt('#sum-acc') === '90%', 'accuracy 90%, got ' + await txt('#sum-acc'));
  const rights = await page.$$eval('#sum-mistakes tbody td.r', (tds) => tds.map((x) => +x.textContent));
  expect(rights.length === 2 && rights[0] === wrong[0] && rights[1] === wrong[1], 'mistakes list shows the 2 correct answers ' + wrong + ', got ' + rights);
  const pts = +(await txt('#sum-points')).replace(/[^\d]/g, '');
  expect(pts >= 330 && pts <= 420, '18 right with a streak gives 330–420 points, got ' + pts);
  expect(await visible('#sum-best .mp-newbest'), 'first game sets a new personal best');
  const saved = await page.evaluate(() => {
    const s = EDU.store('math-practice');
    return { best: (s.get('best', {}) || {})['twenty|d1|mul'], hist: s.get('hist', []) };
  });
  expect(saved.best === pts, 'personal best saved for 20 questions · ×: ' + saved.best);
  expect(saved.hist.length === 2 && saved.hist[0].mode === 'twenty' && saved.hist[0].correct === 18, 'history has the table game and the 20-question game');
  log('points', pts, 'mistakes', wrong.join(','));
};
