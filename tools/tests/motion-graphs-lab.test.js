/* Interaction test for Motion Graphs Lab (run by tools/verify.js in en and hi).
   Expected numbers (worked by hand):
   - car preset: 0→20 m/s in 10 s (100 m, a = 2), 20 m/s for 20 s (400 m), 20→0 in 5 s (50 m, a = −4): 550 m in 35 s
   - row 2 stretched to 30 s: 100 + 600 + 50 = 750 m
   - ball thrown up (19.6 → −19.6 m/s in 4 s, a = −9.8): up 19.6 m and back: displacement 0, distance 39.2 m
   - equations: u=0, a=2, t=5 → v=10, s=25; u=0, a=10, s=20 → v=20, t=2; free fall t=2 → s=19.6 (Earth), 3.2 (Moon)
   - slope of d–t between 15 s and 25 s on the 20 m/s piece = 20 m/s; slope of v–t between 0 and 10 s = 2 m/s² */
module.exports = async function ({ page, expect, t, log }) {
  const near = (a, b, tol) => Math.abs(a - b) <= (tol || 0.01);
  const val = async (sel) => Number(await page.getAttribute(sel, 'data-v'));
  const rows = () => page.$$eval('#seg-body tr', trs => trs.map(tr => ({ a: Number(tr.dataset.a), dist: Number(tr.dataset.dist) })));
  const state = () => page.evaluate(() => JSON.parse(JSON.stringify(window.MotionLab.state())));
  const settle = (ms) => page.waitForTimeout(ms || 250);

  await page.waitForSelector('#ro-dist');

  // 1) default scenario (car): totals and the per-row maths
  expect(near(await val('#ro-dist'), 550), 'car preset distance = 100 + 400 + 50 = 550 m');
  expect(near(await val('#ro-disp'), 550), 'car preset displacement = 550 m (never moves back)');
  expect(near(await val('#ro-time'), 35), 'total time 35 s');
  expect(near(await val('#ro-avgs'), 550 / 35, 0.001) && near(await val('#ro-avgv'), 550 / 35, 0.001), 'average speed = average velocity = 550/35 m/s');
  let r = await rows();
  expect(r.length === 3 && near(r[0].a, 2) && near(r[1].a, 0) && near(r[2].a, -4), 'row accelerations 2, 0, −4 m/s², got ' + JSON.stringify(r));
  expect(near(r[0].dist, 100) && near(r[1].dist, 400) && near(r[2].dist, 50), 'row distances 100, 400, 50 m');
  expect((await page.getAttribute('#ro-note', 'data-back')) === '0', 'no "moved back" note for the car');
  expect(near(await val('#area-total'), 550), 'area legend: displacement 550 m');
  expect((await page.$$('#svg-v .mg-area.pos')).length === 3 && (await page.$$('#svg-v .mg-area.neg')).length === 0, 'v–t area shaded in 3 positive pieces');

  // 2) time slider moves the vehicle: at t ≈ 15 s the car is at 100 + 20 × 5 = 200 m, v = 20
  await page.evaluate(() => { const s = document.getElementById('scrub'); s.value = '429'; s.dispatchEvent(new Event('input', { bubbles: true })); });
  await settle(100);
  const now = await page.evaluate(() => ({ t: +document.getElementById('readnow').dataset.t, d: +document.getElementById('readnow').dataset.d, v: +document.getElementById('readnow').dataset.v }));
  expect(near(now.t, 15.015, 0.05) && near(now.d, 200.3, 1) && near(now.v, 20), 'scrub to 15 s: d ≈ 200 m, v = 20 m/s, got ' + JSON.stringify(now));
  expect(Number(await page.getAttribute('#road', 'width')) > 0, 'road canvas drawn');

  // 3) slope tool: d–t between 15 and 25 s reads 20 m/s; v–t between 0 and 10 s reads 2 m/s²
  await page.check('#slope-on');
  await settle(100);
  expect((await page.$$('#svg-d .mg-marker')).length === 2, 'two draggable markers on the d–t graph');
  expect(near(await val('#slope-out'), 20) && (await page.getAttribute('#slope-out', 'data-kind')) === 'd', 'slope of d–t between 15 s and 25 s = 20 m/s');
  await page.click('#slope-kind [data-k="v"]');
  await page.fill('#slope-t1', '0');
  await page.fill('#slope-t2', '10');
  await settle(100);
  expect(near(await val('#slope-out'), 2), 'slope of v–t between 0 and 10 s = 2 m/s²');
  // keyboard: arrow key moves marker 2 by 0.5 s
  await page.focus('#svg-v .mg-marker[data-m="2"]');
  await page.keyboard.press('ArrowRight');
  await settle(100);
  expect((await state()).lab.t2 === 10.5, 'ArrowRight moves marker 2 to 10.5 s');
  expect(near(await val('#slope-out'), 20 / 10.5, 0.001), 'slope recomputed after the keyboard move');
  // pointer drag on marker 1
  const box = await (await page.$('#svg-v .mg-marker[data-m="1"] .mg-dot')).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 4 });
  await page.mouse.up();
  await settle(100);
  const t1 = (await state()).lab.t1;
  expect(t1 > 0.5 && t1 < 10.5, 'dragging marker 1 changes t1, got ' + t1);
  await page.click('#slope-kind [data-k="d"]');
  await page.fill('#slope-t1', '15');
  await page.fill('#slope-t2', '25');
  await settle(100);
  expect(near(await val('#slope-out'), 20), 'back on d–t: 20 m/s again');

  // 4) edit the table: row 2 for 30 s → 750 m; add a piece; remove it again
  await page.fill('#seg-body tr:nth-child(2) .seg-t', '30');
  await settle(100);
  expect(near(await val('#ro-dist'), 750) && near(await val('#ro-time'), 45), 'row 2 at 30 s: distance 750 m in 45 s');
  await page.click('#add-const');
  await settle(100);
  expect((await rows()).length === 4, 'a 4th piece added');
  await page.click('#seg-body tr:nth-child(4) .seg-del');
  await settle(100);
  expect((await rows()).length === 3 && near(await val('#ro-dist'), 750), 'piece removed, 750 m again');

  // 5) reload keeps the segment table and the slope tool
  await page.reload();
  await page.waitForSelector('#ro-dist');
  expect(near(await val('#ro-dist'), 750) && (await rows()).length === 3, 'segment table survives a reload (750 m)');
  expect(await page.isChecked('#slope-on') && near(await val('#slope-out'), 20), 'slope tool state survives a reload');

  // 6) ball thrown up: displacement 0, distance 39.2 m, negative area shown
  await page.click('#preset-ball');
  await settle(150);
  expect(near(await val('#ro-disp'), 0) && near(await val('#ro-dist'), 39.2), 'ball: displacement 0 after the round trip, distance 39.2 m');
  expect((await page.getAttribute('#ro-note', 'data-back')) === '1', 'ball: "moved back" note');
  expect((await page.$$('#svg-v .mg-area.neg')).length === 1 && (await page.$$('#svg-v .mg-area.pos')).length === 1, 'v–t area: one positive and one negative piece');
  expect((await page.$$eval('#seg-body tr.turn', x => x.length)) === 1, 'the turning piece is highlighted');
  expect(near(await val('#ro-avgv'), 0) && near(await val('#ro-avgs'), 9.8), 'ball: average velocity 0, average speed 9.8 m/s');

  // 7) equations of motion
  await page.click('#tab-eq');
  await settle(100);
  expect(near(await val('#val-v'), 10) && near(await val('#val-s'), 25), 'u=0, a=2, t=5 → v=10, s=25');
  expect((await page.$$eval('#eq-steps .mg-step', s => s.map(x => x.dataset.eq))).join(',') === 'e1,e2', 'steps use v = u + at and s = ut + ½at²');
  await page.uncheck('#k-t');
  await page.check('#k-s');
  await page.fill('#in-a', '10');
  await page.fill('#in-s', '20');
  await settle(300);
  expect(near(await val('#val-v'), 20) && near(await val('#val-t'), 2), 'u=0, a=10, s=20 → v=20, t=2');
  expect((await page.$$eval('#eq-steps .mg-step', s => s.map(x => x.dataset.find))).join(',') === 'v,t', 'finds v then t');
  // only two knowns → error, no result
  await page.uncheck('#k-s');
  await settle(300);
  expect(!(await page.isHidden('#eq-err')) && (await page.getAttribute('#val-v', 'data-v')) === '', 'with 2 knowns an error is shown and v is blank');
  // free fall: u = 0, t = 2 → s = 19.6 on Earth, 3.2 on the Moon
  await page.click('#mode-ff');
  await page.check('#k-t');
  await page.fill('#in-u', '0');
  await page.fill('#in-t', '2');
  await settle(300);
  expect(await page.isDisabled('#in-a') && near(Number(await page.inputValue('#in-a')), 9.8), 'free fall locks a = 9.8');
  expect(near(await val('#val-s'), 19.6) && near(await val('#val-v'), 19.6), 'free fall t=2 → s = 19.6 m, v = 19.6 m/s');
  await page.click('#planets [data-g="moon"]');
  await settle(300);
  expect(near(await val('#val-s'), 3.2), 'on the Moon s = ½ × 1.6 × 4 = 3.2 m');
  await page.click('#ff-dir [data-d="up"]');
  await page.fill('#in-u', '19.6');
  await page.click('#planets [data-g="earth"]');
  await settle(300);
  expect(near(await val('#val-v'), 0) && near(await val('#val-s'), 19.6), 'thrown up at 19.6 m/s: after 2 s v = 0 at 19.6 m');
  await page.click('#mode-general');
  await settle(200);
  // km/h ⇄ m/s
  await page.fill('#conv-kmh', '72');
  expect(near(Number(await page.inputValue('#conv-ms')), 20), '72 km/h = 20 m/s');
  await page.fill('#conv-ms', '25');
  expect(near(Number(await page.inputValue('#conv-kmh')), 90), '25 m/s = 90 km/h');

  // 8) words: uniform circular motion v = 2πr/T
  await page.click('#tab-words');
  await page.fill('#circ-r', '2');
  await page.fill('#circ-T', '4');
  expect(near(await val('#circ-out'), Math.PI, 0.001), 'v = 2π × 2 / 4 = 3.1416 m/s');

  // 9) quiz: 12 story + 8 read questions, one answered wrongly, reload in the middle
  await page.click('#tab-quiz');
  await page.waitForSelector('#q-text');
  const total = await page.evaluate(() => MG_DATA.stories.length + MG_DATA.reads.length);
  expect(total === 20, '20 quiz questions');
  let qBefore = '';
  for (let i = 0; i < total; i++) {
    if (i === 5) {
      qBefore = await page.textContent('#q-text');
      await page.reload();
      await page.waitForSelector('#q-text');
      expect((await page.textContent('#q-text')) === qBefore, 'same question after reload');
      expect((await page.textContent('#quiz-score')).trim() === '4', 'score 4 kept after reload');
    }
    const wrong = i === 1;
    const info = await page.evaluate(() => { const q = window.MotionLab.state().quiz; const id = q.order[q.i]; return { id, ans: id[0] === 'r' ? MG_DATA.reads[+id.slice(1)].ans : null }; });
    if (info.ans === null) {
      const sel = wrong ? '#opts .mg-opt[data-correct="0"]' : '#opts .mg-opt[data-correct="1"]';
      if (i === 2) { const pos = await page.$eval(sel, b => b.id.slice(4)); await page.keyboard.press('abcd'[pos]); } else await page.click(sel);
    } else {
      await page.fill('#ans', String(wrong ? info.ans + 1000 : info.ans));
      await page.keyboard.press('Enter');
    }
    await page.waitForSelector('#quiz-reveal');
    expect((await page.getAttribute('#quiz-reveal', 'data-right')) === (wrong ? '0' : '1'), 'question ' + (i + 1) + ' (' + info.id + ') judged correctly');
    if (info.ans === null) { const sc = (await page.textContent('#quiz-score')).trim(); await page.keyboard.press('b'); await page.keyboard.press('c'); expect((await page.$$('#opts .mg-opt.picked')).length === 1 && (await page.textContent('#quiz-score')).trim() === sc, 'pressing a key after answering changes nothing'); }
    await page.click('#quiz-next');
  }
  await page.waitForSelector('#final-score');
  expect((await page.getAttribute('#final-score', 'data-score')) === '19', 'final score 19/20');
  expect((await page.getAttribute('#quiz-best', 'data-best')) === '19', 'best score 19 shown');

  // 10) printable worksheet: 6 questions and a key that matches the data
  await page.evaluate(() => { window.print = () => { }; });
  await page.click('#quiz-print');
  await settle(200);
  const ws = await page.evaluate(() => ({
    qs: document.querySelectorAll('#worksheet .ws-q').length,
    opts: document.querySelectorAll('#worksheet .ws-opts').length,
    key: [...document.querySelectorAll('#worksheet .ws-key tbody tr td:nth-child(2)')].map(td => td.textContent.trim())
  }));
  expect(ws.qs === 6 && ws.opts === 3 && ws.key.length === 6, 'worksheet: 6 questions (3 with graph options) + 6 key rows, got ' + JSON.stringify(ws));
  expect(/^[ABCD]$/.test(ws.key[0]) && ws.key[3].startsWith('5') && ws.key[4].startsWith('36') && ws.key[5].startsWith('90'), 'worksheet key: letters for stories, 5 m/s, 36 m, 90 m for the readings, got ' + ws.key.join(' | '));

  // 11) persistence of the finished quiz and best score, then reset
  await page.reload();
  await page.waitForSelector('#final-score');
  const st = await state();
  expect(st.best === 19 && st.quiz.done === true, 'finished quiz and best score survive a reload');
  await page.click('#quiz-again');
  await page.waitForSelector('#q-text');
  expect((await page.textContent('#quiz-score')).trim() === '0', 'Play again starts a new round');
  await page.click('#tab-lab');
  await page.click('#reset');
  await settle(200);
  const after = await state();
  expect(after.best === null && after.quiz === null && after.lab.vehicle === 'car' && after.lab.segs.length === 3 && !after.lab.slopeOn, 'reset forgets the quiz, the best score and the scenario');
  expect(near(await val('#ro-dist'), 550) && (await rows()).length === 3, 'reset restores the car preset (550 m)');
  await page.click('#tab-eq');
  expect(near(await val('#val-v'), 10), 'reset restores the sample equation (v = 10)');
  await page.click('#tab-lab');
  log('ok: 550 m, ball 0/39.2 m, slope 20 m/s, v=20 t=2, s=19.6, quiz 19/20');
};
