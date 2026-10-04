/* Interaction test for Exam Study Planner (run by tools/verify.js in en and hi).
   ctx = { page, lang, expect(cond, msg), t(key, vars) -> string in ctx.lang, log } */
const fs = require('fs');

module.exports = async function ({ page, expect, t, log }) {
  const txt = async (sel) => ((await page.textContent(sel)) || '').trim();
  const count = (sel) => page.$$eval(sel, els => els.length);
  const reloadAt = async (date) => {
    await page.clock.setFixedTime(date);
    await page.reload();
    await page.waitForSelector('#cd-days');
    await page.waitForTimeout(400);
  };

  /* 0) fixed clock: Monday 5 Jan 2026, fresh sample */
  await page.evaluate(() => localStorage.removeItem('edu.study-planner.state'));
  await reloadAt(new Date(2026, 0, 5, 9, 0, 0));
  expect(await page.evaluate(() => new Date().getDate()) === 5, 'clock is fixed to 5 Jan');

  /* 1) sample plan: 4 subjects, English exam on 23 Jan = 18 days away */
  const total = await count('#plan-list .sess-cb');
  expect(total > 80, 'sample plan has many sessions, got ' + total);
  expect(await txt('#cd-days') === '18', 'countdown is 18 days, got ' + await txt('#cd-days'));
  expect(await txt('#done-of') === t('done_of', { done: '0', total: String(total) }), 'progress text: ' + await txt('#done-of'));
  const exams = await page.$$eval('#subj-list .subj', els => els.map(e => [e.getAttribute('data-sid'), e.getAttribute('data-exam')]));
  expect(exams.length === 4, '4 sample subjects, got ' + exams.length);
  const examOf = Object.fromEntries(exams);
  const sessOf = els => els.map(cb => { const e = cb.closest('.sess'); return { s: e.dataset.s, c: e.dataset.c, k: e.dataset.k, d: e.dataset.date }; });
  const all = await page.$$eval('#plan-list .sess-cb', sessOf);
  expect(all.every(x => x.d < examOf[x.s]), 'every session is before its own exam');
  expect(all.filter(x => x.d === '2026-01-23').length === 0, 'no study on the English exam day (rest after paper)');
  const light = all.filter(x => x.d === '2026-01-22');
  expect(light.length > 0 && light.every(x => x.k === 'rev2' && x.s === 's1'), 'light day before English has only final revision of English');
  const learnHardWeak = all.filter(x => x.c === 's2c3' && x.k === 'learn').length;
  const learnEasy = all.filter(x => x.c === 's2c1' && x.k === 'learn').length;
  expect(learnHardWeak === 6 && learnEasy === 2, 'hard+weak chapter gets 6 sessions, easy one 2: ' + learnHardWeak + '/' + learnEasy);
  expect(['learn', 'rev1', 'prac', 'rev2'].every(k => all.some(x => x.k === k)), 'plan has study, revision 1, practice and final revision');

  /* 2) tick two of today's sessions -> progress */
  const todayN = await count('#today-body .sess-cb');
  expect(todayN >= 4, 'several sessions today, got ' + todayN);
  await page.click('#today-body .sess-cb >> nth=0');
  await page.click('#today-body .sess-cb >> nth=1');
  expect(await txt('#done-of') === t('done_of', { done: '2', total: String(total) }), 'two done: ' + await txt('#done-of'));
  expect(await txt('#pct') === t('pct', { n: String(Math.round(2 / total * 100)) }), 'percent after 2 ticks: ' + await txt('#pct'));
  expect(await count('#plan-list .sess-cb:checked') === 2, 'list tick boxes are ticked too');
  expect(await count('#plan-list .sess') < total, 'repeated sessions of one chapter are grouped into one row');

  /* 3) three days later: missed sessions, then reschedule */
  await page.waitForTimeout(200);
  await reloadAt(new Date(2026, 0, 8, 9, 0, 0));
  const missed = parseInt(await txt('#missed-badge'), 10);
  expect(missed === 3 * todayN - 2 || missed > 10, 'missed sessions counted, got ' + missed);
  expect(await page.isVisible('#msg-missed'), 'missed message shown');
  await page.click('#reschedule');
  expect(await txt('#missed-badge') === '', 'no missed sessions after reschedule');
  expect(await txt('#done-of') === t('done_of', { done: '2', total: String(total) }), 'done kept, every task re-planned: ' + await txt('#done-of'));
  expect(await page.isVisible('#show-past'), 'earlier days are folded away');
  await page.click('#show-past');
  const after = await page.$$eval('#plan-list .sess-cb:not(:checked)', els => els.map(cb => cb.closest('.sess').dataset.date));
  expect(after.length > 0 && after.every(d => d >= '2026-01-08'), 'all open sessions are from today on');
  expect(await count('#plan-list .sess.missed') === 0 && await count('#plan-list .sess-cb:checked') === 2, 'no missed rows, done sessions kept on 5 Jan');

  /* 4) add a subject with one hard, weak chapter and make the plan */
  await page.click('#tab-exams');
  await page.click('#add-subject');
  expect(await count('#subj-list .subj') === 5, 'five subjects after adding');
  const card = '#subj-list .subj:last-child';
  const sid = await page.getAttribute(card, 'data-sid');
  await page.fill(card + ' .in-sname', 'Computer Applications');
  await page.fill(card + ' .ch-row .in-cname', 'HTML basics');
  await page.selectOption(card + ' .ch-row .in-d', 'h');
  await page.selectOption(card + ' .ch-row .in-c', 'l');
  await page.click('#make-plan');
  expect(await page.isVisible('#p-plan'), 'plan tab opens after making the plan');
  const mine = await page.$$eval('#plan-list .sess[data-s="' + sid + '"] .sess-cb', els => els.map(cb => cb.closest('.sess').dataset.k));
  expect(mine.filter(k => k === 'learn').length === 6, 'new hard+weak chapter: 6 study sessions, got ' + mine.filter(k => k === 'learn').length);
  expect(mine.length === 14, 'new subject: 6 study + 2 revision + 5 practice + 1 final = 14, got ' + mine.length);
  expect((await txt('#plan-list .sess[data-s="' + sid + '"] .sess-subj')) === 'Computer Applications', 'typed subject name shown in plan');

  /* 5) 50-minute sessions */
  await page.click('#tab-time');
  await page.click('#pomo-50');
  expect(await txt('#hours-hint-0') === t('n_sessions', { n: '3', m: '50' }), '3 h on Monday = 3 x 50 min: ' + await txt('#hours-hint-0'));
  await page.click('#tab-plan');
  expect(await page.isVisible('#msg-dirty'), 'plan asks to be updated');
  await page.click('#update-plan');
  expect(!(await page.isVisible('#msg-dirty')), 'update message gone');
  const meta = await txt('#plan-list .sess:not(.done) .sess-meta');
  expect(meta.includes(t('dur_m', { m: '50' })), 'sessions are now 50 minutes: ' + meta);

  /* 6) calendar view */
  await page.click('#view-cal');
  expect(await page.isVisible('#plan-cal') && !(await page.isVisible('#plan-list')), 'calendar view shown');
  expect(await page.$eval('.cal-day[data-date="2026-01-23"]', b => b.classList.contains('is-exam')), '23 Jan is an exam day in the calendar');
  await page.click('.cal-day[data-date="2026-01-22"]');
  const det = await page.$$eval('#cal-detail .sess-cb', els => els.map(cb => cb.closest('.sess').dataset.k));
  expect(det.length > 0 && det.every(k => k === 'rev2'), 'calendar detail of the light day shows final revision only');

  /* 7) exports */
  const [csvDl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#csv-btn')]);
  const csv = fs.readFileSync(await csvDl.path(), 'utf8');
  expect(csv.includes(t('csv_date')) && csv.includes('Computer Applications') && csv.includes('2026-01-23'), 'CSV has header, subject and exam date');
  const [icsDl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#ics-btn')]);
  const ics = fs.readFileSync(await icsDl.path(), 'utf8');
  expect(ics.startsWith('BEGIN:VCALENDAR') && ics.includes('DTSTART;VALUE=DATE:20260123') && ics.trim().endsWith('END:VCALENDAR'), 'ICS calendar with the exam day');
  expect(ics.split('\r\n').every(l => Buffer.byteLength(l, 'utf8') <= 75), 'ICS lines are folded to 75 bytes');
  log('csv ' + csv.length + ' bytes, ics ' + ics.length + ' bytes');

  /* 8) saved across reload */
  await page.waitForTimeout(200);
  await reloadAt(new Date(2026, 0, 8, 9, 0, 0));
  expect(await count('#subj-list .subj') === 5, 'five subjects after reload');
  expect(await page.getAttribute('#view-cal', 'aria-pressed') === 'true', 'calendar view remembered');
  expect(await page.getAttribute('#pomo-50', 'aria-pressed') === 'true', '50-minute setting remembered');
};
