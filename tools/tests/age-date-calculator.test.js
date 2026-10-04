/* Interaction test for Age & Date Calculator (run by tools/verify.js in en and hi).
   Every result is checked against INDEPENDENT reference maths written here (Date.UTC day counts, brute-force
   month stepping, weekday from Date.UTC), never against the app's own ADC_DATES helpers.
   ctx = { page, lang, expect(cond, msg), t(key, vars) -> string in ctx.lang, log } */
module.exports = async function ({ page, expect, t, log }) {
  const txt = async (sel) => ((await page.textContent(sel)) || '').replace(/[⁦-⁩]/g, '').trim();
  const num = (s) => Number(String(s).replace(/[^\d]/g, ''));
  const settle = () => page.waitForTimeout(150);
  const fill = async (sel, v) => { await page.fill(sel, v); await settle(); };
  const click = async (sel) => { await page.click(sel); await settle(); };

  /* ---------------- independent reference maths ---------------- */
  const DAY = 86400000;
  const dim = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();                 /* last day of month m (1-based) */
  const days = (d) => Math.round(Date.UTC(d[0], d[1] - 1, d[2]) / DAY);          /* day number */
  const wday = (d) => new Date(Date.UTC(d[0], d[1] - 1, d[2])).getUTCDay();      /* 0 = Sunday */
  const fromDays = (n) => { const x = new Date(n * DAY); return [x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate()]; };
  const plusMonths = (d, k) => { const t0 = d[0] * 12 + d[1] - 1 + k, y = Math.floor(t0 / 12), m = t0 - y * 12 + 1; return [y, m, Math.min(d[2], dim(y, m))]; };
  const cmp = (a, b) => days(a) - days(b);
  /* whole months from a (clamped to month end once), then days */
  const refAge = (a, b) => { let k = 0; while (cmp(plusMonths(a, k + 1), b) <= 0) k++; return { y: Math.floor(k / 12), m: k % 12, d: days(b) - days(plusMonths(a, k)), days: days(b) - days(a), months: k }; };
  const fmt = (d) => String(d[2]).padStart(2, '0') + '-' + String(d[1]).padStart(2, '0') + '-' + String(d[0]).padStart(4, '0');
  const iso = (d) => String(d[0]).padStart(4, '0') + '-' + String(d[1]).padStart(2, '0') + '-' + String(d[2]).padStart(2, '0');
  const isWeekend = (d) => wday(d) === 0 || wday(d) === 6;
  const refWorkDays = (a, b, hol) => { let c = 0; for (let n = days(a); n <= days(b); n++) { const d = fromDays(n); if (!isWeekend(d) && !(hol || []).includes(iso(d))) c++; } return c; };
  const refAddWork = (a, k, hol) => { let n = days(a), left = k; while (left > 0) { n++; const d = fromDays(n); if (!isWeekend(d) && !(hol || []).includes(iso(d))) left--; } return fromDays(n); };
  const wdName = (d) => t('wd' + wday(d));

  /* sanity for the reference itself */
  expect(dim(2024, 2) === 29 && dim(2026, 2) === 28 && dim(1900, 2) === 28 && dim(2000, 2) === 29, 'reference leap-year rule');
  expect(wday([1990, 8, 15]) === 3, '15 Aug 1990 was a Wednesday');

  /* ================= AGE: spec example DOB 15-08-1990 as on 15-08-2026 -> 36 y 0 m 0 d */
  await click('#tab-age');
  await click('#asonMode button[data-v="custom"]');
  await fill('#dob', '1990-08-15');
  await fill('#ason', '2026-08-15');
  let ref = refAge([1990, 8, 15], [2026, 8, 15]);
  expect(ref.y === 36 && ref.m === 0 && ref.d === 0, 'reference says 36y 0m 0d');
  expect(num(await txt('#ageY')) === 36 && num(await txt('#ageM')) === 0 && num(await txt('#ageD')) === 0, 'age 15-08-1990 as on 15-08-2026 is 36 y 0 m 0 d, got ' + await txt('#ageY') + '/' + await txt('#ageM') + '/' + await txt('#ageD'));
  expect(num(await txt('#ageDays')) === ref.days, 'total days = ' + ref.days + ', got ' + await txt('#ageDays'));
  expect(num(await txt('#ageMonths')) === 432, 'total months = 432, got ' + await txt('#ageMonths'));
  expect((await txt('#dobHint')).includes(wdName([1990, 8, 15])), 'DOB hint shows the weekday (' + wdName([1990, 8, 15]) + '): ' + await txt('#dobHint'));
  expect((await txt('#ageRes')).includes(t('bday_today')), 'birthday falls on the as-on date');
  expect((await txt('#nextBday')).includes('15-08-2027'), 'next birthday after the 36th is 15-08-2027, got ' + await txt('#nextBday'));

  /* one day before the birthday: 35 y 11 m 30 d, next birthday tomorrow */
  await fill('#ason', '2026-08-14');
  ref = refAge([1990, 8, 15], [2026, 8, 14]);
  expect(ref.y === 35 && ref.m === 11 && ref.d === 30, 'reference 35y 11m 30d');
  expect(num(await txt('#ageY')) === 35 && num(await txt('#ageM')) === 11 && num(await txt('#ageD')) === 30, 'day before birthday: 35 y 11 m 30 d');
  expect(num(await txt('#nextBdayIn')) === 1, '1 day to the birthday, got ' + await txt('#nextBdayIn'));
  expect((await txt('#nextBday')).includes('15-08-2026') && (await txt('#nextBday')).includes(wdName([2026, 8, 15])), 'next birthday 15-08-2026 with weekday');

  /* 29 February birthday: clamped to 28 Feb in a non-leap year */
  await fill('#dob', '2004-02-29');
  await fill('#ason', '2026-02-28');
  ref = refAge([2004, 2, 29], [2026, 2, 28]);
  expect(ref.y === 22 && ref.m === 0 && ref.d === 0, 'reference: 29-02-2004 turns 22 on 28-02-2026');
  expect(num(await txt('#ageY')) === 22 && num(await txt('#ageM')) === 0 && num(await txt('#ageD')) === 0, '29 Feb birthday: 22 y 0 m 0 d on 28-02-2026');
  await fill('#ason', '2026-02-27');
  ref = refAge([2004, 2, 29], [2026, 2, 27]);
  expect(num(await txt('#ageY')) === ref.y && num(await txt('#ageM')) === ref.m && num(await txt('#ageD')) === ref.d, '29 Feb birthday on 27-02-2026: ' + ref.y + 'y ' + ref.m + 'm ' + ref.d + 'd');
  expect(ref.y === 21 && ref.m === 11 && ref.d === 29, 'reference 21y 11m 29d');
  expect((await txt('#nextBday')).includes('28-02-2026'), 'next birthday clamps to 28-02-2026');
  await fill('#ason', '2028-02-29');
  expect(num(await txt('#ageY')) === 24 && num(await txt('#ageM')) === 0 && num(await txt('#ageD')) === 0, 'leap day to leap day: 24 y exactly');
  expect((await txt('#ageRes')).includes(t('feb29_note')), '29 Feb note is shown');

  /* future DOB is flagged, not crashed */
  await fill('#dob', '2030-01-01');
  expect((await txt('#ageRes')).includes(t('err_future_dob')), 'future DOB shows an error');
  await fill('#dob', '1990-08-15');
  await fill('#ason', '2026-08-15');

  /* ================= ELIGIBILITY: min 21, max 32 as on 01-01-2027 */
  await fill('#eligMin', '21');
  await fill('#eligMax', '32');
  await fill('#eligRelax', '0');
  await fill('#cutoff', '2027-01-01');
  let cls = await page.getAttribute('#eligBox', 'class');
  expect(cls.includes('danger'), 'born 1990 is over 32 on 01-01-2027: not eligible');
  expect((await txt('#eligMsg')).includes('15-08-2022'), 'limit crossed on the 32nd birthday 15-08-2022: ' + await txt('#eligMsg'));
  let range = await txt('#eligRange');
  expect(range.includes('02-01-1995') && range.includes('01-01-2006'), 'qualifying births 02-01-1995 .. 01-01-2006, got ' + range);
  await fill('#eligRelax', '5');
  cls = await page.getAttribute('#eligBox', 'class');
  expect(cls.includes('success'), 'with 5 years relaxation (max 37) the person qualifies');
  expect((await txt('#eligRange')).includes('02-01-1990'), 'relaxed range starts 02-01-1990: ' + await txt('#eligRange'));
  const ageAtCut = refAge([1990, 8, 15], [2027, 1, 1]);
  expect((await txt('#eligMsg')).includes(String(ageAtCut.y)) && (await txt('#eligMsg')).includes('01-01-2027'), 'eligible message quotes the age and cut-off');
  await fill('#eligRelax', '0');
  /* too young: born 01-06-2006 becomes 21 on 01-06-2027 */
  await fill('#dob', '2006-06-01');
  cls = await page.getAttribute('#eligBox', 'class');
  expect(cls.includes('danger') && (await txt('#eligMsg')).includes('01-06-2027'), 'too young: eligible from 01-06-2027, got ' + await txt('#eligMsg'));
  /* exactly on the boundary: born 01-01-2006 qualifies, born 02-01-2006 does not */
  await fill('#dob', '2006-01-01');
  expect((await page.getAttribute('#eligBox', 'class')).includes('success'), 'born 01-01-2006 has completed 21 on 01-01-2027');
  await fill('#dob', '2006-01-02');
  expect((await page.getAttribute('#eligBox', 'class')).includes('danger'), 'born 02-01-2006 has not completed 21');
  await fill('#dob', '1995-01-02');
  expect((await page.getAttribute('#eligBox', 'class')).includes('success'), 'born 02-01-1995 is 31 y 11 m 30 d: still under 32');
  await fill('#dob', '1995-01-01');
  expect((await page.getAttribute('#eligBox', 'class')).includes('danger'), 'born 01-01-1995 has completed 32: not eligible');
  /* 29 Feb boundaries use the same rule as the age panel: born 29-02-2004 has completed 23 on 28-02-2027 (28 Feb in a common year) */
  await fill('#cutoff', '2027-02-28');
  await fill('#eligMin', '23');
  await fill('#eligMax', '40');
  await fill('#dob', '2004-02-29');
  expect(refAge([2004, 2, 29], [2027, 2, 28]).y === 23, 'reference: 23 completed on 28-02-2027');
  expect((await page.getAttribute('#eligBox', 'class')).includes('success'), '29-02-2004 is eligible with min 23 as on 28-02-2027: ' + await txt('#eligMsg'));
  expect((await txt('#eligRange')).includes('29-02-2004'), 'qualifying range ends 29-02-2004, got ' + await txt('#eligRange'));
  await fill('#eligMin', '18');
  await fill('#eligMax', '23');
  expect((await page.getAttribute('#eligBox', 'class')).includes('danger') && (await txt('#eligMsg')).includes('28-02-2027'), '29-02-2004 has completed max 23 on 28-02-2027: not eligible, got ' + await txt('#eligMsg'));
  expect((await txt('#eligRange')).includes('01-03-2004'), 'qualifying range starts 01-03-2004, got ' + await txt('#eligRange'));
  /* fractional relaxation is flagged, not silently treated as 0 */
  await fill('#eligRelax', '2.5');
  expect((await page.getAttribute('#eligRelax', 'aria-invalid')) === 'true' && (await txt('#eligOut')).includes(t('err_num')), 'fractional relaxation is flagged');
  await fill('#eligRelax', '0');
  /* DOB after the cut-off is "too young", not "enter a DOB" */
  await fill('#dob', '2030-01-01');
  expect((await page.getAttribute('#eligBox', 'class')).includes('danger') && (await txt('#eligMsg')).includes('01-01-2048'), 'born 01-01-2030 with min 18: eligible from 01-01-2048, got ' + await txt('#eligMsg'));
  await fill('#eligMin', '21');
  await fill('#eligMax', '32');
  await fill('#cutoff', '2027-01-01');
  await fill('#dob', '1990-08-15');

  /* ================= PEOPLE LIST: save, reload, persists */
  await fill('#pName', 'Aarav');
  await click('#pAdd');
  let items = await page.$$('#pList li .nm');
  expect(items.length === 1, 'one person saved, got ' + items.length);
  expect((await txt('#pList')).includes('Aarav') && (await txt('#pList')).includes('15-08-1990'), 'list shows the name and DOB');
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(900);
  items = await page.$$('#pList li .nm');
  expect(items.length === 1 && (await page.inputValue('#dob')) === '1990-08-15' && (await page.inputValue('#ason')) === '2026-08-15', 'people list and inputs survive a reload');
  const ageInList = refAge([1990, 8, 15], [2026, 8, 15]);
  expect((await txt('#pList .ag')).includes(String(ageInList.y)), 'list shows the age as on the chosen date');
  await click('#pList .btn-danger');
  expect((await page.$$('#pList li .nm')).length === 0, 'person deleted');

  /* ================= DIFFERENCE: month-end arithmetic 31-01-2026 -> 01-03-2026 */
  await click('#tab-diff');
  await fill('#d1', '2026-01-31');
  await fill('#d2', '2026-03-01');
  ref = refAge([2026, 1, 31], [2026, 3, 1]);
  expect(ref.y === 0 && ref.m === 1 && ref.d === 1 && ref.days === 29, 'reference: 0y 1m 1d, 29 days');
  let ymd = await txt('#diffYMD');
  expect(ymd === t('year_n', { n: '0' }) + ', ' + t('month_1') + ', ' + t('day_1'), '31 Jan -> 1 Mar = 0 years, 1 month, 1 day; got ' + ymd);
  expect(num(await txt('#diffDays')) === 29, '29 days between, got ' + await txt('#diffDays'));
  if (!(await page.isChecked('#dIncl'))) await click('#dIncl');
  expect(num(await txt('#diffDays')) === 30, 'counting both days gives 30');
  await click('#dIncl');
  /* reversed dates are swapped, not an error */
  await fill('#d1', '2026-03-01');
  await fill('#d2', '2026-01-31');
  expect(num(await txt('#diffDays')) === 29 && (await txt('#diffRes')).includes(t('diff_swapped')), 'reversed dates are swapped');
  /* working days in October 2026 (Sat + Sun off), both days counted, plus a holiday */
  await fill('#d1', '2026-10-01');
  await fill('#d2', '2026-10-31');
  await click('#dIncl');
  let refWork = refWorkDays([2026, 10, 1], [2026, 10, 31]);
  expect(refWork === 22, 'reference: 22 working days in Oct 2026');
  expect(num(await txt('#diffWork')) === refWork, 'working days Oct 2026 = ' + refWork + ', got ' + await txt('#diffWork'));
  expect(num(await txt('#diffDays')) === 31 && num(await txt('#diffWeeks')) === 43, '31 days = 4 weeks + 3 days, got ' + await txt('#diffWeeks'));
  await fill('#holidays', '02-10-2026\n2026/10/20\nrubbish line');
  expect((await txt('#holHint')).includes('2') && (await txt('#holHint')).includes(t('hol_bad', { n: '1' })), 'two holidays recognised, one bad line: ' + await txt('#holHint'));
  refWork = refWorkDays([2026, 10, 1], [2026, 10, 31], ['2026-10-02', '2026-10-20']);
  expect(refWork === 20 && num(await txt('#diffWork')) === 20, 'holidays reduce working days to 20, got ' + await txt('#diffWork'));
  /* Sunday-only weekly off: Saturdays count as working days (5 Saturdays in Oct 2026) */
  await click('#wkMode button[data-v="sun"]');
  expect(num(await txt('#diffWork')) === 25, 'Sunday-only off: 25 working days, got ' + await txt('#diffWork'));
  /* bank rule: 2nd & 4th Saturday (10 and 24 Oct 2026) are off too */
  await click('#wkMode button[data-v="bank"]');
  expect(num(await txt('#diffWork')) === 23, '2nd & 4th Saturday off: 23 working days, got ' + await txt('#diffWork'));
  await click('#wkMode button[data-v="satsun"]');
  await fill('#holidays', '');
  await click('#dIncl');

  /* ================= ADD / SUBTRACT */
  await click('#tab-add');
  await fill('#aStart', '2026-01-31');
  await click('#aOp button[data-v="add"]');
  await fill('#aN', '1');
  await page.selectOption('#aUnit', 'months');
  await settle();
  expect((await txt('#aOut')) === '28-02-2026', '31-01-2026 + 1 month = 28-02-2026, got ' + await txt('#aOut'));
  expect((await txt('#addRes')).includes(t('month_end_note')), 'month-end note is shown');
  await fill('#aStart', '2024-02-29');
  await page.selectOption('#aUnit', 'years');
  await settle();
  expect((await txt('#aOut')) === '28-02-2025', '29-02-2024 + 1 year = 28-02-2025');
  await fill('#aN', '4');
  expect((await txt('#aOut')) === '29-02-2028', '29-02-2024 + 4 years = 29-02-2028');
  await fill('#aStart', '2026-10-01');
  await page.selectOption('#aUnit', 'days');
  await fill('#aN', '30');
  expect((await txt('#aOut')) === '31-10-2026' && (await txt('#aOutWd')) === wdName([2026, 10, 31]), '01-10-2026 + 30 days = 31-10-2026 (' + wdName([2026, 10, 31]) + '), got ' + await txt('#aOut') + ' ' + await txt('#aOutWd'));
  await click('#aOp button[data-v="sub"]');
  expect((await txt('#aOut')) === fmt(fromDays(days([2026, 10, 1]) - 30)), '01-10-2026 - 30 days = 01-09-2026, got ' + await txt('#aOut'));
  await click('#aOp button[data-v="add"]');
  await fill('#aN', '365');
  expect((await txt('#aOut')) === fmt(fromDays(days([2026, 10, 1]) + 365)), '+365 days crosses the year correctly');
  /* working days: 5 from Thu 01-10-2026 -> Thu 08-10-2026; with 02-10 as a holiday -> Fri 09-10-2026 */
  await page.selectOption('#aUnit', 'work');
  await fill('#aN', '5');
  expect((await txt('#aOut')) === fmt(refAddWork([2026, 10, 1], 5)) && (await txt('#aOut')) === '08-10-2026', '+5 working days = 08-10-2026, got ' + await txt('#aOut'));
  await fill('#holidays', '02-10-2026');
  expect((await txt('#aOut')) === fmt(refAddWork([2026, 10, 1], 5, ['2026-10-02'])) && (await txt('#aOut')) === '09-10-2026', 'holiday pushes +5 working days to 09-10-2026, got ' + await txt('#aOut'));
  await fill('#holidays', '');
  /* quick chip */
  await click('#aChips .chip[data-n="90"]');
  expect((await page.inputValue('#aN')) === '90' && (await page.inputValue('#aUnit')) === 'days' && (await txt('#aOut')) === fmt(fromDays(days([2026, 10, 1]) + 90)), '90-day chip: 01-10-2026 + 90 = 30-12-2026, got ' + await txt('#aOut'));
  /* bad input is flagged */
  await fill('#aN', '2.5');
  expect((await page.getAttribute('#aN', 'aria-invalid')) === 'true' && (await txt('#addRes')).includes(t('err_num')), 'fractional count is flagged');
  await fill('#aN', '100001');
  expect((await page.getAttribute('#aN', 'aria-invalid')) === 'true' && (await txt('#addRes')).includes(t('err_range')), 'count above the limit says out of range');
  await page.selectOption('#aUnit', 'years');
  await fill('#aN', '8000');
  expect((await txt('#addRes')).includes(t('err_range')), '+8000 years leaves the calendar: out of range');
  await page.selectOption('#aUnit', 'days');
  await fill('#aN', '30');

  /* ================= NOTICE PERIOD: spec example 30 days from 01-10-2026 -> 31-10-2026 */
  await click('#tab-notice');
  await fill('#nStart', '2026-10-01');
  await fill('#nDays', '30');
  await click('#nMode button[data-v="cal"]');
  if (await page.isChecked('#nDay1')) await click('#nDay1');
  expect((await txt('#nOut')) === '31-10-2026', '30-day notice from 01-10-2026 ends 31-10-2026, got ' + await txt('#nOut'));
  expect((await txt('#nOutWd')) === wdName([2026, 10, 31]), 'weekday of the last day is ' + wdName([2026, 10, 31]));
  expect(wday([2026, 10, 31]) === 6 && (await txt('#nNote')).includes('30-10-2026'), '31-10-2026 is a Saturday: previous working day 30-10-2026 suggested, got ' + await txt('#nNote'));
  await click('#nDay1');
  expect((await txt('#nOut')) === '30-10-2026', 'counting the resignation day as day 1 gives 30-10-2026');
  await click('#nDay1');
  await click('#nChips .chip[data-n="90"]');
  expect((await page.inputValue('#nDays')) === '90' && (await txt('#nOut')) === fmt(fromDays(days([2026, 10, 1]) + 90)), '90-day chip: 30-12-2026, got ' + await txt('#nOut'));
  await fill('#nDays', '30');
  await click('#nMode button[data-v="work"]');
  expect((await txt('#nOut')) === fmt(refAddWork([2026, 10, 1], 30)) && (await txt('#nOut')) === '12-11-2026', '30 working days from 01-10-2026 ends 12-11-2026, got ' + await txt('#nOut'));
  await click('#nMode button[data-v="cal"]');

  /* ================= COUNTDOWN: 10 days from today, saved to the list */
  await click('#tab-count');
  const now = new Date(), today = [now.getFullYear(), now.getMonth() + 1, now.getDate()];
  const target = fromDays(days(today) + 10);
  await fill('#cName', 'Board exam');
  await fill('#cDate', iso(target));
  expect(num(await txt('#cOut')) === 10, '10 days left, got ' + await txt('#cOut'));
  expect((await txt('#cDateHint')).includes(fmt(target)) && (await txt('#cDateHint')).includes(wdName(target)), 'target shown as DD-MM-YYYY with weekday');
  await click('#cAdd');
  expect((await page.$$('#cList li .nm')).length === 1 && (await txt('#cList')).includes('Board exam') && (await txt('#cList')).includes(t('c_left', { n: '10' })), 'event saved with days left: ' + await txt('#cList'));
  await fill('#cDate', iso(fromDays(days(today) - 3)));
  expect((await txt('#cOutLbl')) === t('c_past', { n: '3' }), 'past date says 3 days ago, got ' + await txt('#cOutLbl'));
  await fill('#cDate', iso(today));
  expect((await txt('#cOutLbl')) === t('c_today'), 'today says it is today');

  /* ================= corrupted saved data never crashes the app */
  await page.evaluate(() => { const p = 'edu.age-date-calculator.'; localStorage.setItem(p + 'people', '"junk"'); localStorage.setItem(p + 'events', '[1,{"name":"x","date":"bad"}]'); localStorage.setItem(p + 'aN', '"abc"'); localStorage.setItem(p + 'tab', '"zzz"'); });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(900);
  expect((await page.getAttribute('#tab-age', 'aria-selected')) === 'true' && num(await txt('#ageY')) === 36, 'app recovers from corrupted localStorage (age still 36)');
  expect((await page.$$('#pList li .nm')).length === 0 && (await page.$$('#cList li .nm')).length === 0, 'junk list rows are dropped');

  /* ================= copy / share buttons exist with the result text */
  await click('#tab-age');
  const wa = await page.getAttribute('#ageWa', 'href');
  expect(/^https:\/\/wa\.me\/\?text=/.test(wa) && decodeURIComponent(wa).includes('15-08-1990'), 'WhatsApp link carries the result text');
  await click('#ageCopy');
  log('all date maths cross-checked against the reference');
};
