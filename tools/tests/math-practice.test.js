/* Interaction test for Mental Maths Challenge (run by tools/verify.js in en and hi).
   ctx = { page, lang, expect(cond, msg), t(key, vars) -> string in ctx.lang, log } */
module.exports = async function ({ page, lang, expect, t, log }) {
  const ISO = /[⁦-⁩]/g;                       // bidi isolates around numbers in percentage questions
  const txt = async (sel) => ((await page.textContent(sel)) || '').replace(ISO, '').replace(/\s+/g, ' ').trim();
  const visible = (sel) => page.isVisible(sel);

  /* work out the answer from the question text, independently of the app */
  const solve = (raw) => {
    const s = raw.replace(ISO, '').replace(/[\s ]+/g, ' ').replace(/=.*$/, '').trim();
    let m;
    if ((m = s.match(/^(\d+) ([+−×÷]) (\d+)$/))) {
      const a = +m[1], b = +m[3];
      return { '+': a + b, '−': a - b, '×': a * b, '÷': a / b }[m[2]];
    }
    if ((m = s.match(/^(\d+)²$/))) return (+m[1]) ** 2;
    if ((m = s.match(/^(\d+)³$/))) return (+m[1]) ** 3;
    if ((m = s.match(/^³√(\d+)$/))) return Math.round(Math.cbrt(+m[1]));
    if ((m = s.match(/^√(\d+)$/))) return Math.round(Math.sqrt(+m[1]));
    if ((m = s.match(/^(\d+)% of (\d+)$/))) return (+m[1]) * (+m[2]) / 100;          // en: "{p}% of {n}"
    if ((m = s.match(/^(\d+)\D+?(\d+)%$/))) return (+m[2]) * (+m[1]) / 100;          // hi: "{n} का {p}%"
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
  const errs = () => page.evaluate(() => window.__mpErrors || []);
  await page.evaluate(() => { window.__mpErrors = []; window.addEventListener('error', (e) => window.__mpErrors.push(String(e.message))); });

  /* ---------------- damaged saved data never breaks the setup screen ---------------- */
  await page.evaluate(() => {
    localStorage.setItem('edu.math-practice.hist', '[null, 5, {"mode":"sprint","level":"zzz","ops":"x","points":"a"}, {"mode":"twenty"}]');
    localStorage.setItem('edu.math-practice.best', '"oops"');
  });
  await page.click('#modes [data-mode="practice"]');
  await page.click('#modes [data-mode="sprint"]');
  expect((await errs()).length === 0, 'damaged history does not throw: ' + (await errs()).join(' | '));
  expect(await visible('#recent-none') && !(await visible('#recent-wrap')), 'damaged history entries are ignored');
  expect((await page.textContent('#mute-setup')).trim().length > 0, 'the sound button is still drawn');

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
        expect(Number.isInteger(a) && a >= (lvl === 'tables' ? 2 : 1), `${lvl}: ${q} has a whole-number answer (${a})`);
        divCount++;
      }
    }
  }
  log('checked', divCount, 'division questions');

  /* ---------------- printable worksheet: answer key matches, no repeats ---------------- */
  await page.evaluate(() => { window.print = () => { window.__printed = (window.__printed || 0) + 1; }; });
  await page.click('#levels [data-level="d2"]');
  await page.click('#print-ws');
  let ws = await page.evaluate(() => ({ q: [...document.querySelectorAll('#ws .mp-ws-q bdi')].map((b) => b.textContent), a: [...document.querySelectorAll('#ws .mp-ws-key li')].map((l) => +l.textContent), printed: window.__printed, cls: document.body.classList.contains('mp-print-ws') }));
  expect(ws.printed === 1 && ws.cls, 'worksheet opens the print dialog in worksheet mode');
  expect(ws.q.length === 40 && ws.a.length === 40, '40 worksheet questions with 40 answers, got ' + ws.q.length);
  expect(ws.q.every((q, i) => solve(q) === ws.a[i] && Number.isInteger(ws.a[i])), 'every answer in the key is right: ' + ws.q.slice(0, 5).join(' | '));
  expect(new Set(ws.q).size === 40, 'no question repeats on the worksheet');
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  expect(!(await page.evaluate(() => document.body.classList.contains('mp-print-ws'))), 'worksheet mode ends after printing');
  await page.click('#levels [data-level="cubes"]');
  await page.click('#print-ws');
  ws = await page.evaluate(() => ({ q: [...document.querySelectorAll('#ws .mp-ws-q bdi')].map((b) => b.textContent), a: [...document.querySelectorAll('#ws .mp-ws-key li')].map((l) => +l.textContent) }));
  expect(ws.q.length === 28 && new Set(ws.q).size === 28, 'cubes worksheet lists the 28 different facts once each, got ' + ws.q.length + '/' + new Set(ws.q).size);
  expect(ws.q.every((q, i) => solve(q) === ws.a[i]), 'cube / cube-root answers are right');
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));

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
  expect((await txt('#play-prog')).replace(/\s/g, '') === '1/20' && await page.getAttribute('#play-prog', 'dir') === 'ltr', 'HUD shows question 1 / 20 (left-to-right)');
  /* a slow press on a touch screen / smartboard types the digit once */
  const k1 = await (await page.$('#pad button[data-k="1"]')).boundingBox();
  await page.mouse.move(k1.x + k1.width / 2, k1.y + k1.height / 2);
  await page.mouse.down(); await page.waitForTimeout(1100); await page.mouse.up();
  expect(await txt('#ans') === '1', 'a long press on 1 types "1" once, got ' + await txt('#ans'));
  await keyAnswer(3);                                   // "13"
  qid = await waitQ('#qa', qid);
  expect((await txt('#q')).replace(/\s/g, '') === '13×2', 'then 13 × 2 (in order), got ' + await txt('#q'));
  /* after using the language menu the keyboard still answers (focus stays on the <select>) */
  await page.focus('#edu-lang');
  await keyAnswer(25);                                  // deliberate mistake
  await page.waitForFunction(() => document.querySelector('#qa').dataset.state === 'bad');
  expect((await txt('#fb')).includes('26'), 'wrong answer shows the right answer 26: ' + await txt('#fb'));
  expect(await page.$eval('#edu-lang', (s) => s.value) === lang, 'typing digits did not change the language');
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  qid = await waitQ('#qa', qid);
  await tapAnswer('#pad', solve(await txt('#q')));
  await page.waitForFunction(() => document.querySelectorAll('#facts span').length === 3);
  expect((await page.$$('#facts span.bad')).length === 1, 'the table so far shows one wrong fact in red');
  await page.click('#end-play');
  await page.waitForSelector('#summary', { state: 'visible' });
  expect((await txt('#sum-correct')).replace(/\s/g, '') === '2/3', 'table summary: 2 of 3 correct, got ' + await txt('#sum-correct'));
  expect((await page.$$('#sum-mistakes tbody tr')).length === 1, 'one mistake listed');
  expect((await txt('#sum-mistakes tbody td.r')) === '26', 'mistake row shows correct answer 26');
  /* switching to Urdu (RTL) re-renders the summary; "2 / 3" must not flip to "3 / 2" */
  await page.evaluate(() => EDU.setLang('ur'));
  expect(await page.getAttribute('html', 'dir') === 'rtl', 'Urdu is right-to-left');
  expect(await txt('#sum-title') === await page.evaluate(() => EDU.t('finished')), 'summary title re-rendered in Urdu');
  expect(await page.getAttribute('#sum-correct', 'dir') === 'ltr' && (await txt('#sum-correct')).replace(/\s/g, '') === '2/3', 'score fraction stays left-to-right in Urdu');
  const order = await page.evaluate(() => {           // visual order of the two numbers
    const b = document.querySelector('#sum-correct'), r = document.createRange(), tn = b.firstChild, s = tn.textContent;
    r.setStart(tn, 0); r.setEnd(tn, 1); const x2 = r.getBoundingClientRect().left;
    r.setStart(tn, s.length - 1); r.setEnd(tn, s.length); const x3 = r.getBoundingClientRect().left;
    return x2 < x3;
  });
  expect(order, '"2" is drawn to the left of "3" in Urdu');
  await page.evaluate((l) => EDU.setLang(l), lang);

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

  /* ---------------- practice: percentages, best streak ---------------- */
  await page.click('#to-setup');
  await page.click('#modes [data-mode="practice"]');
  await page.click('#levels [data-level="percent"]');
  expect(!(await visible('#ops-wrap')), 'percentages hide the operation chips');
  await page.click('#start');
  expect(!(await visible('#time-pill')), 'Practice has no ticking clock');
  qid = 0;
  for (let i = 0; i < 3; i++) {
    qid = await waitQ('#qa', qid);
    const q = await txt('#q'), a = solve(q);
    expect(Number.isInteger(a) && a > 0, 'percentage answer is a whole number: ' + q + ' = ' + a);
    await keyAnswer(a);
  }
  await page.waitForFunction(() => document.querySelector('#play-streak').textContent.trim() === '3');
  await page.waitForFunction(() => document.querySelector('#qa').dataset.state === 'ready');
  await page.click('#end-play');
  await page.waitForSelector('#summary', { state: 'visible' });
  expect(await txt('#sum-acc') === '100%' && await txt('#sum-streak') === '3', 'practice: 100% and a streak of 3');
  const pbest = await page.evaluate(() => (EDU.store('math-practice').get('best', {}) || {})['practice|percent']);
  expect(pbest === 3, 'practice mode saves the best streak (3), got ' + pbest);

  /* ---------------- phone (360 × 640): table trainer keeps the pad still and on screen ---------------- */
  await page.click('#to-setup');
  const desk = page.viewportSize();
  await page.setViewportSize({ width: 360, height: 640 });
  await page.click('#modes [data-mode="table"]');
  await page.click('#tables [data-table="19"]');
  await page.click('#start');
  qid = 0;
  const padY = [];
  for (let i = 0; i < 10; i++) {
    qid = await waitQ('#qa', qid);
    padY.push(await page.$eval('#pad', (p) => Math.round(p.getBoundingClientRect().top + scrollY)));
    if (i === 9) {
      const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, ok: document.querySelector('#pad [data-k="ok"]').getBoundingClientRect().top, vh: innerHeight }));
      expect(m.sw <= m.cw, `no sideways scrolling on a 360 px phone (${m.sw} > ${m.cw})`);
      expect(m.ok < m.vh - 20, `the ✓ key is on screen on a 360 × 640 phone (top ${Math.round(m.ok)}, screen ${m.vh})`);
    }
    await keyAnswer(solve(await txt('#q')));
  }
  expect(new Set(padY).size === 1, 'the number pad does not jump while the table grows: ' + padY.join(','));
  await page.click('#end-play');
  await page.waitForSelector('#summary', { state: 'visible' });
  await page.setViewportSize(desk);

  /* ---------------- two-player race ---------------- */
  await page.click('#to-setup');
  await page.click('#modes [data-mode="duel"]');
  await page.click('#levels [data-level="d1"]');
  await page.fill('#name0', 'Riya');
  await page.fill('#name1', 'Aman');
  await page.click('#targets [data-target="10"]');
  await page.click('#start');
  let q0 = await waitQ('#p0', 0);
  let q1 = await waitQ('#p1', 0);
  expect(await page.getAttribute('#p1 .mp-pscore', 'dir') === 'ltr', 'race score is written left-to-right');
  // Player 2: one wrong answer, then two right answers (on-screen pad)
  await tapAnswer('#p1 .mp-pad', solve(await txt('#p1 .mp-q')) + 1);
  q1 = await waitQ('#p1', q1);
  for (let i = 0; i < 2; i++) {
    await tapAnswer('#p1 .mp-pad', solve(await txt('#p1 .mp-q')));
    q1 = await waitQ('#p1', q1);
  }
  expect((await txt('#p1 .mp-pscore')).replace(/\s/g, '') === '2/10', 'Player 2 shows 2 / 10');
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
  expect(saved.hist.length === 4 && saved.hist[0].mode === 'twenty' && saved.hist[0].correct === 18 && saved.hist[1].mode === 'table' && saved.hist[1].table === 19 &&
    saved.hist[2].mode === 'practice' && saved.hist[3].mode === 'table' && saved.hist[3].table === 13,
    'history has the table, practice, table and 20-question games (and no damaged entries): ' + saved.hist.map((h) => h && h.mode).join());
  await page.click('#to-setup');
  expect((await page.$$('#recent tbody tr')).length === 4, 'Recent games lists 4 games');
  expect((await txt('#best-line')).includes(String(pts)), 'setup shows the personal best ' + pts + ': ' + await txt('#best-line'));

  /* ---------------- 30-second speed sprint runs out of time ---------------- */
  await page.click('#modes [data-mode="sprint"]');
  await page.click('#durs [data-dur="30"]');
  await page.click('#start');
  expect(await txt('#play-time') === '0:30', 'sprint clock starts at 0:30, got ' + await txt('#play-time'));
  qid = 0;
  let answered = 0, warnSeen = false;
  for (;;) {
    const st = await (await page.waitForFunction((p) => {
      if (!document.querySelector('#summary').hidden) return 'end';
      const e = document.querySelector('#qa');
      return e.dataset.state === 'ready' && e.dataset.qid !== String(p) ? 'q' : false;
    }, qid, { timeout: 40000 })).jsonValue();
    if (st === 'end') break;
    qid = await page.$eval('#qa', (e) => +e.dataset.qid);
    const clockTxt = await txt('#play-time');
    if (/^0:0\d$/.test(clockTxt) && clockTxt !== '0:00') warnSeen = warnSeen || await page.$eval('#play-time', (e) => e.classList.contains('warn'));
    const a = solve(await txt('#q'));
    await keyAnswer(answered === 2 ? a + 1 : a);
    answered++;
    await page.waitForTimeout(700);
  }
  expect(await txt('#sum-title') === t('time_up'), 'sprint ends with "time up": ' + await txt('#sum-title'));
  expect(await txt('#sum-time') === '0:30', 'sprint lasted 0:30, got ' + await txt('#sum-time'));
  expect(warnSeen, 'the clock turns red in the last 10 seconds');
  const [sc, stot] = (await txt('#sum-correct')).split('/').map((x) => +x.trim());
  expect(stot >= 10 && stot <= answered && sc === stot - 1, `sprint: ${sc} / ${stot} with one mistake (answered ${answered})`);
  expect((await page.$$('#sum-mistakes tbody tr')).length === 1, 'sprint: one mistake to review');
  const spts = +(await txt('#sum-points')).replace(/[^\d]/g, '');
  const sbest = await page.evaluate(() => (EDU.store('math-practice').get('best', {}) || {})['sprint|d1|mul|30']);
  expect(sbest === spts && spts > 0, 'sprint best saved per mode, level, operation and duration: ' + sbest + ' vs ' + spts);
  const hist4 = await page.evaluate(() => EDU.store('math-practice').get('hist', []));
  expect(hist4.length === 5 && hist4[0].mode === 'sprint' && hist4[0].dur === 30, 'sprint added to Recent games');
  expect((await errs()).length === 0, 'no script errors: ' + (await errs()).join(' | '));
  log('points', pts, 'mistakes', wrong.join(','), '| sprint', sc + '/' + stot, spts + ' pts');
};
