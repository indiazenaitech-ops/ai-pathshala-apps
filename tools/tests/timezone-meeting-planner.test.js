/* Interaction test for Time Zone Meeting Planner (run by tools/verify.js in en and hi).
   ctx = { page, lang, expect(cond, msg), t(key, vars) -> string in ctx.lang, log, base } */
const fs = require('fs');

module.exports = async function ({ page, lang, expect, t, log, base }) {
  const txt = async (sel) => ((await page.textContent(sel)) || '').trim();
  const rows = () => page.$$eval('#people .prow', r => r.length);
  const rt = (tz) => txt(`#results li[data-tz="${tz}"] .rt`);
  const rd = (tz) => txt(`#results li[data-tz="${tz}"] .rd`);
  const C = await page.evaluate(() => window.APP_CONTENT[EDU.lang].cities);

  /* 1) opens useful: IST + New York, London, Dubai */
  expect(await rows() === 4, 'IST + 3 default cities, got ' + await rows());
  expect(await page.$$eval('#results li', r => r.length) === 4, '4 result rows');
  expect(await page.$$eval('#strip-wrap td.hc', c => c.length) === 96, '24 x 4 strip cells');

  /* 2) spec check: 15:00 IST on 1 Dec 2026 -> 04:30 New York (EST, UTC-5) */
  await page.click('#hseg button[data-h="24"]');
  await page.fill('#date', '2026-12-01');
  await page.fill('#time', '15:00');
  await page.waitForTimeout(150);
  expect((await rt('America/New_York')).startsWith('04:30'), 'NY 04:30 EST: ' + await rt('America/New_York'));
  expect((await txt('#results li[data-tz="America/New_York"] .rm')).includes('UTC−5'), 'NY offset UTC-5');
  expect((await rt('Europe/London')).startsWith('09:30'), 'London 09:30 GMT');
  expect((await txt('#results li[data-tz="Europe/London"] .rm')).includes('GMT'), 'London shows GMT in winter (Intl only says GMT+0)');
  expect((await rt('Asia/Dubai')).startsWith('13:30'), 'Dubai 13:30');

  /* 2b) midnight crossing: 23:30 IST for 1 h -> IST row shows an end-date arrow, Dubai stays same day */
  await page.fill('#time', '23:30');
  await page.waitForTimeout(150);
  expect(/[→←]/.test(await rd('Asia/Kolkata')), 'IST row shows the next-date arrow: ' + await rd('Asia/Kolkata'));
  expect((await rt('Asia/Dubai')).startsWith('22:00') && !(await rd('Asia/Dubai')).includes(t('next_day')), 'Dubai 22:00 same day');
  expect(await page.$$eval('#strip-wrap thead .hb.sel', b => b.map(x => x.dataset.h).join()) === '23', 'only hour 23 selected in the strip');
  await page.fill('#time', '15:00');
  await page.waitForTimeout(150);

  /* 3) .ics in UTC */
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#ics')]);
  const ics = fs.readFileSync(await dl.path(), 'utf8');
  expect(ics.includes('DTSTART:20261201T093000Z'), 'ics DTSTART 09:30Z');
  expect(ics.includes('DTEND:20261201T103000Z') && ics.includes('BEGIN:VEVENT'), 'ics DTEND + VEVENT');
  log('ics ' + ics.length + ' bytes');

  /* 4) DST: 1 Jul -> 05:30 EDT, London 10:30 BST */
  await page.fill('#date', '2026-07-01');
  await page.waitForTimeout(150);
  expect((await rt('America/New_York')).startsWith('05:30'), 'NY 05:30 EDT: ' + await rt('America/New_York'));
  expect((await txt('#results li[data-tz="America/New_York"] .rm')).includes('UTC−4'), 'NY offset UTC-4 in summer');
  expect((await rt('Europe/London')).startsWith('10:30'), 'London 10:30 BST');

  /* 5) add Kathmandu (+5:45) via search, Los Angeles via abbreviation */
  await page.fill('#city-q', 'kath');
  await page.waitForSelector('#city-results button[data-tz="Asia/Kathmandu"]');
  await page.click('#city-results button[data-tz="Asia/Kathmandu"]');
  expect(await rows() === 5, 'Kathmandu added');
  expect((await rt('Asia/Kathmandu')).startsWith('15:15'), 'Kathmandu 15:15: ' + await rt('Asia/Kathmandu'));
  expect((await txt('#results li[data-tz="Asia/Kathmandu"] .rm')).includes('UTC+5:45') && (await txt('#results li[data-tz="Asia/Kathmandu"] .rm')).includes('NPT'), 'Kathmandu UTC+5:45 NPT');
  expect((await txt('#strip-wrap tr[data-tz="Asia/Kathmandu"] td[data-h="0"]')).startsWith('00:15'), 'strip cell: midnight IST = 00:15 Kathmandu');
  expect((await txt('#strip-wrap tr[data-tz="Asia/Kolkata"] td[data-h="0"]')).startsWith('00:00'), 'strip cell 24 h shows 00:00');
  await page.fill('#city-q', 'pst');
  await page.waitForSelector('#city-results button[data-tz="America/Los_Angeles"]');
  await page.click('#city-results button[data-tz="America/Los_Angeles"]');
  expect((await rt('America/Los_Angeles')).startsWith('02:30'), 'LA 02:30 PDT');
  expect(await page.$$eval('#results li[data-tz="America/Los_Angeles"] .rate.bad', x => x.length) === 1, 'LA 02:30 is night');
  await page.fill('#city-q', 'kath');
  await page.click('#city-results button[data-tz="Asia/Kathmandu"]');
  expect(await rows() === 6, 'duplicate city is not added twice');

  /* 6) quick converter: 15:00 in New York -> IST 00:30 next day */
  await page.selectOption('#from', 'America/New_York');
  await page.waitForTimeout(150);
  expect((await rt('Asia/Kolkata')).startsWith('00:30'), 'IST 00:30 for 3 pm New York: ' + await rt('Asia/Kolkata'));
  expect((await txt('#results li[data-tz="America/New_York"] .shift')) === t('prev_day'), 'New York shows previous day badge');
  await page.selectOption('#from', 'Asia/Kolkata');
  await page.waitForTimeout(150);

  /* 7) strip: keyboard click on hour 10, mouse drag 14 -> 16 */
  await page.focus('#strip-wrap .hb[data-h="10"]');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
  expect(await page.inputValue('#time') === '10:00', 'strip Enter sets 10:00, got ' + await page.inputValue('#time'));
  expect(await page.inputValue('#date') === '2026-07-01', 'strip keeps the IST day');
  expect(await page.$$eval('#strip-wrap td.hc.sel', c => c.length) === 6, 'one selected column x 6 rows');
  await page.$eval('#strip-wrap .hb[data-h="15"]', e => e.scrollIntoView({ block: 'center', inline: 'center' }));
  const box = async (h) => page.$eval(`#strip-wrap .hb[data-h="${h}"]`, e => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  const a = await box(14), b = await box(16);
  await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(b.x, b.y, { steps: 6 }); await page.mouse.up();
  await page.waitForTimeout(150);
  expect(await page.inputValue('#time') === '14:00' && await page.$eval('#dur', s => s.value) === '180', 'drag sets 14:00 for 3 hours: ' + await page.inputValue('#time') + ' ' + await page.$eval('#dur', s => s.value));

  /* 8) best slots */
  expect(await page.$$eval('#best li', l => l.length) >= 1, 'best slots listed');
  const bt = await txt('#best li:first-child .bt');
  await page.click('#best li:first-child .use');
  await page.waitForTimeout(150);
  expect(bt.startsWith(await page.inputValue('#time')), 'Use sets the slot start: ' + bt + ' vs ' + await page.inputValue('#time'));

  /* 9) invite text + share link */
  await page.fill('#title', 'Demo call');
  const inv = await page.inputValue('#invite');
  expect(inv.startsWith('Demo call') && inv.includes(C['America/New_York']) && inv.includes(C['Asia/Kathmandu']), 'invite has title and cities');
  await page.click('#share');
  const url = await page.inputValue('#share-url');
  const packed = await page.evaluate(u => EDU.unpack(new URL(u).searchParams.get('s')), url);
  expect(packed && packed.d === '2026-07-01' && packed.p.length === 5 && packed.n === 'Demo call', 'share link packs the plan');

  /* 10) remove + persistence */
  await page.click('#people .prow[data-tz="America/Los_Angeles"] .del');
  expect(await rows() === 5, 'city removed');
  await page.waitForTimeout(300);
  await page.reload(); await page.waitForTimeout(900);
  expect(await rows() === 5 && await page.$eval('#dur', s => s.value) === '180' && await page.inputValue('#title') === 'Demo call', 'state restored after reload');

  /* 11) open a shared link */
  const s = await page.evaluate(() => EDU.pack({ v: 1, d: '2026-12-01', t: '15:00', z: 'Asia/Kolkata', u: 60, h: [9, 18], p: [['Asia/Tokyo', 9, 18]], c: 1, n: 'Tokyo sync' }));
  await page.goto(base + 'apps/timezone-meeting-planner/?lang=' + lang + '&s=' + s, { waitUntil: 'load' });
  await page.waitForTimeout(900);
  expect(await rows() === 2, 'link loads IST + Tokyo only');
  expect((await rt('Asia/Tokyo')).startsWith('18:30'), 'Tokyo 18:30 for 15:00 IST: ' + await rt('Asia/Tokyo'));
  expect(await page.inputValue('#title') === 'Tokyo sync', 'title from link');
  expect(!new URL(page.url()).searchParams.get('s'), 'share param is removed from the address bar after loading');

  /* 12) a corrupted share link never crashes: the saved plan (IST + Tokyo) still loads */
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  for (const bad of ['xxxx', '%ZZ', 'eyJhIjoxfQ']) {
    await page.goto(base + 'apps/timezone-meeting-planner/?lang=' + lang + '&s=' + bad, { waitUntil: 'load' });
    await page.waitForTimeout(500);
    expect(await rows() === 2, 'corrupted link "' + bad + '" keeps the saved plan, rows=' + await rows());
  }
  expect(errors.length === 0, 'no page errors on corrupted links: ' + errors.join(' | '));

  /* 13) leap day + four-digit year handling: 29 Feb 2028 is a Tuesday; years below 100 are not mapped to 19xx */
  await page.fill('#date', '2028-02-29');
  await page.waitForTimeout(150);
  expect((await txt('#res-date')).includes('2028') && (await rt('Asia/Tokyo')).startsWith('18:30'), '29 Feb 2028 accepted: ' + await txt('#res-date'));
  await page.fill('#date', '0050-06-15');
  await page.waitForTimeout(150);
  expect(!(await txt('#res-date')).includes('1950'), 'year 0050 is not shown as 1950: ' + await txt('#res-date'));
  await page.fill('#date', '2026-12-01');
  await page.waitForTimeout(150);
  expect((await rt('Asia/Tokyo')).startsWith('18:30'), 'back on 1 Dec 2026: Tokyo 18:30');
};
