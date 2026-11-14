/* Interaction test for Shagun Register (run by tools/verify.js in en and hi). All totals are worked out by hand. */
const fs = require('fs');

module.exports = async function ({ page, lang, expect, t, log }) {
  const wait = (ms) => page.waitForTimeout(ms || 80);
  const txt = async (sel) => (await page.textContent(sel)).trim();
  const attr = async (sel, a) => Number(await page.getAttribute(sel, a));
  const rows = () => page.$$eval('#rList .rrow', (r) => r.map((x) => ({ id: x.dataset.id, amt: Number(x.dataset.amt), name: x.querySelector('.nm').textContent, hist: !!x.querySelector('.hist') })));
  const pick = (buffer, name) => ({ name, mimeType: 'application/json', buffer: Buffer.from(buffer, 'utf8') });
  const add = async ({ name = '', city = '', phone = '', side = null, gift = 'cash', amt = '', wt = '', desc = '' }) => {
    await page.fill('#fName', name); await page.fill('#fCity', city); await page.fill('#fPhone', phone);
    if (side) await page.selectOption('#fSide', side);
    await page.click('#fGift [data-g="' + gift + '"]');
    await page.fill('#fAmt', amt);
    if (gift === 'gold' || gift === 'silver') await page.fill('#fWt', wt);
    if (gift !== 'cash') await page.fill('#fDesc', desc);
    await page.click('#fSave'); await wait();
  };
  const cash = () => attr('#tCash', 'data-p');

  // 0) a clearly marked made-up example: our wedding + one function we attended
  expect(await page.isVisible('#sampleNote'), 'sample note shown');
  expect((await page.$$eval('#evSel option', (o) => o.length)) === 2, 'two sample functions');
  // cash 5100 + 2100 + 1100 + 501 = 8,801; 7 entries; gold 1 (4 g), silver 1 (10 g), other 1
  expect((await cash()) === 880100 && (await attr('#tCount', 'data-n')) === 7, 'sample totals: ₹8,801 in 7 entries, got ' + (await cash()));
  expect((await attr('#tGold', 'data-w')) === 400 && (await attr('#tSilver', 'data-w')) === 1000, 'sample gold 4 g, silver 10 g');
  expect((await page.getAttribute('#tSides tr[data-side="bride"] td[data-p]', 'data-p')) === '510000', 'bride side cash ₹5,100');
  let r = await rows();
  expect(r.some((x) => x.name.includes(t('sample_g3')) && x.hist), 'sample Mehta family row shows the earlier gift we gave them');
  await page.fill('#lQ', t('sample_g3').slice(0, 4));
  expect((await page.$$eval('#lRes .lgroup', (g) => g.length)) === 1, 'look-up finds the Mehta family');
  expect((await txt('#lRes')).includes(t('l_they_gave', { amt: '₹1,100', n: 1 })) && (await txt('#lRes')).includes(t('l_we_gave', { amt: '₹2,100', n: 1 })), 'look-up shows both directions: ' + (await txt('#lRes')).slice(0, 120));
  await page.fill('#lQ', '');
  // the first edit (opening a sample entry) clears the whole example
  await page.click('#rList .rrow');
  await wait(150);
  expect(!(await page.isVisible('#sampleNote')) && (await page.isVisible('#noEvents')), 'first edit cleared the example');

  // 1) our own function
  await page.click('#evNew');
  await page.waitForSelector('#ev-form');
  await page.click('#ev-save');
  expect((await txt('#ev-err')) === t('err_event_name'), 'a function needs a name');
  await page.fill('#ev-name', 'Riya weds Kabir');
  await page.fill('#ev-date', '2026-12-05');
  await page.selectOption('#ev-kind', 'wedding');
  await page.click('#ev-save'); await wait(150);
  expect((await page.$$eval('#evSel option', (o) => o.length)) === 1 && (await page.isVisible('#formCard')), 'function created and selected');

  // 2) the full form, with bad inputs refused
  for (const [bad, key] of [['-100', 'err_neg'], ['12.345', 'err_dec'], ['abc', 'err_num'], ['', 'err_amount']]) {
    await add({ name: 'Test', amt: bad });
    expect((await txt('#fErr')) === t(key), bad + ' refused with ' + key + ': ' + (await txt('#fErr')));
  }
  await add({ name: 'Test', amt: '100', phone: '12345' });
  expect((await txt('#fErr')) === t('err_phone'), 'short phone refused');
  await add({ name: 'Sharma family', city: 'Jaipur', phone: '98765 43210', side: 'bride', amt: '5,100' });
  await add({ name: 'Verma uncle', city: 'Lucknow', side: 'groom', amt: '₹2100/-' });
  await add({ name: 'Nani', side: 'bride', gift: 'gold', wt: '4.5', desc: 'Gold earrings' });
  await add({ name: 'Office team', side: 'office', gift: 'other', amt: '4500', desc: '' });
  expect((await txt('#fErr')) === t('err_desc'), 'other gift needs a description');
  await page.fill('#fDesc', 'Dinner set'); await page.click('#fSave'); await wait();
  // a custom side
  await page.fill('#fName', 'Kapoor ji');
  await page.selectOption('#fSide', '__new');
  await page.fill('#fSideNew', "Mama's side");
  await page.click('#fGift [data-g="cash"]');
  await page.fill('#fAmt', '1100');
  await page.click('#fSave'); await wait();
  // cash 5100 + 2100 + 1100 = 8,300 in 5 entries; gold 4.5 g; other gift worth 4,500
  expect((await cash()) === 830000 && (await attr('#tCount', 'data-n')) === 5, 'cash ₹8,300 in 5 entries, got ' + (await cash()));
  expect((await attr('#tGold', 'data-w')) === 450, 'gold weight 4.5 g');
  expect((await txt('#tOtherV')).includes('₹4,500'), 'other gift value shown: ' + (await txt('#tOtherV')));
  expect((await page.getAttribute('#tSides tr[data-side="Mama\'s side"] td[data-p]', 'data-p')) === '110000', 'custom side total ₹1,100');
  expect((await page.getAttribute('#tSides tr[data-side="groom"] td[data-p]', 'data-p')) === '210000', 'groom side total ₹2,100');
  // duplicate warning while typing a name that is already in this function
  await page.fill('#fName', 'sharma  FAMILY');
  expect(await page.isVisible('#fHint.dup'), 'duplicate warning for the same name (case and spaces ignored)');
  await page.fill('#fName', '');

  // 3) quick envelope counting: 501 (Joshi family, groom side), 1,100 (no name), 2,151 typed, 1,25,000 then undo
  await page.click('#btnQuick');
  await page.waitForSelector('#quickCard:not([hidden])');
  await page.fill('#qName', 'Joshi family');
  await page.click('#qSides [data-s="groom"]');
  await page.click('#qAmts [data-amt="501"]'); await wait();
  expect((await page.inputValue('#qName')) === '', 'name box cleared for the next envelope');
  await page.click('#qAmts [data-amt="1100"]'); await wait();
  await page.fill('#qOther', '2,151'); await page.press('#qOther', 'Enter'); await wait();
  expect((await attr('#qTotal', 'data-p')) === 830000 + 50100 + 110000 + 215100, 'quick total ₹12,052, got ' + (await attr('#qTotal', 'data-p')));
  expect((await txt('#qCount')) === '6', 'six envelopes');
  await page.fill('#qOther', '-5'); await page.click('#qAdd');
  expect((await txt('#qErr')) === t('err_neg'), 'negative quick amount refused');
  await page.fill('#qOther', '125000'); await page.click('#qAdd'); await wait();
  expect((await txt('#qFlash')).includes('₹1,25,000'), 'lakh grouping ₹1,25,000: ' + (await txt('#qFlash')));
  await page.click('#qUndo'); await wait();
  await page.click('#qUndo'); await wait();
  expect((await attr('#qTotal', 'data-p')) === 830000 + 50100 + 110000, 'two undos remove 1,25,000 and 2,151: ₹9,901');
  await page.click('#qClose'); await wait();

  // 4) register: search, filter, sort, edit, delete
  r = await rows();
  expect(r.length === 7, '7 entries, got ' + r.length);
  await page.fill('#rSearch', 'sharma');
  expect((await rows()).length === 1, 'search finds Sharma');
  await page.fill('#rSearch', '43210');
  expect((await rows()).length === 1, 'search by phone digits');
  await page.fill('#rSearch', '');
  await page.selectOption('#rGift', 'gold');
  expect((await rows()).length === 1, 'gift filter: 1 gold');
  await page.selectOption('#rGift', '');
  await page.selectOption('#rSort', 'amt');
  r = await rows();
  expect(r[0].amt === 510000 && r[1].amt === 450000, 'sorted by amount: 5,100 then the 4,500 gift');
  await page.selectOption('#rSort', 'order');
  const verma = (await rows()).find((x) => x.name.includes('Verma'));
  await page.click('#rList .rrow[data-id="' + verma.id + '"]');
  expect((await page.inputValue('#fAmt')) === '2100' && (await page.inputValue('#fSide')) === 'groom', 'edit form loaded');
  await page.fill('#fAmt', '2500'); await page.click('#fSave'); await wait();
  expect((await cash()) === 990100 + 40000, 'edit 2,100 -> 2,500: cash ₹10,301');
  const kapoor = (await rows()).find((x) => x.name.includes('Kapoor'));
  await page.click('#rList .rrow[data-id="' + kapoor.id + '"]');
  await page.click('#fDel'); await wait();
  expect((await cash()) === 1030100 - 110000 && (await rows()).length === 6, 'deleting Kapoor ji: cash ₹9,201, 6 entries');

  // 5) a function we attended: the host's name is filled in; the look-up shows both directions
  await page.click('#evNew'); await page.waitForSelector('#ev-form');
  await page.fill('#ev-name', 'Sharma griha pravesh');
  await page.selectOption('#ev-kind', 'griha');
  await page.click('#ev-dir [data-v="theirs"]');
  await page.fill('#ev-host', 'Sharma family');
  await page.click('#ev-save'); await wait(150);
  expect((await page.inputValue('#fName')) === 'Sharma family', 'host name filled in for what we gave');
  expect(await page.isVisible('#fHint'), 'earlier gift from the Sharma family is shown before writing');
  await page.fill('#fAmt', '3100'); await page.click('#fSave'); await wait();
  expect((await cash()) === 310000 && (await txt('#totHead')) === t('tot_theirs'), 'we gave ₹3,100');
  expect((await rows())[0].hist, 'history shown in the register row');
  await page.fill('#lQ', 'sharma');
  const look = await txt('#lRes');
  expect(look.includes(t('l_they_gave', { amt: '₹5,100', n: 1 })) && look.includes(t('l_we_gave', { amt: '₹3,100', n: 1 })), 'look-up: they gave 5,100, we gave 3,100: ' + look.slice(0, 160));

  // 6) print and CSV
  const evs = await page.$$eval('#evSel option', (o) => o.map((x) => x.value));
  await page.selectOption('#evSel', evs[evs.length - 1] === (await page.inputValue('#evSel')) ? evs[0] : evs[evs.length - 1]);
  await wait();
  const pr = await page.textContent('#printReg');
  expect(pr.includes('Riya weds Kabir') && pr.includes('Sharma family') && pr.includes('₹5,100') && pr.includes('₹9,201'), 'print register filled: ' + pr.slice(0, 120));
  const [d1] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#btnCsv')]);
  const csv1 = fs.readFileSync(await d1.path(), 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  expect(csv1.length === 7 && csv1[1].includes('Sharma family') && csv1[1].includes('5100.00'), 'CSV of the wedding: header + 6 rows: ' + csv1.slice(0, 2).join(' | '));
  const [d2] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#btnCsvAll')]);
  const csv2 = fs.readFileSync(await d2.path(), 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  expect(csv2.length === 8 && csv2.some((l) => l.includes('3100.00')), 'CSV of all functions: header + 7 rows, got ' + csv2.length);

  // 7) backup -> reset -> restore; a crafted file is harmless; a broken file is refused
  const [bk] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#btnBackup')]);
  const backup = fs.readFileSync(await bk.path(), 'utf8');
  const parsed = JSON.parse(backup);
  expect(parsed.app === 'shagun-register' && parsed.data.events.length === 2 && parsed.data.entries.length === 7, 'backup has 2 functions and 7 entries');
  await page.click('#btnReset'); await wait(150);
  expect(await page.isVisible('#noEvents'), 'reset clears everything');
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#btnRestore')]);
  await fc.setFiles(pick(backup, 'backup.json'));
  await wait(400);
  await page.fill('#lQ', 'sharma');
  expect((await txt('#lRes')).includes(t('l_we_gave', { amt: '₹3,100', n: 1 })), 'restored data answers the look-up');
  const evil = JSON.stringify({ app: 'shagun-register', data: { events: [{ id: '__proto__', name: { x: 1 } }, { id: 'zz01', name: 'Ghost party', kind: 'alien', dir: 'x', date: '2026-02-30' }],
    entries: [{ eid: 'zz01', gift: 'cash', amt: '1e400' }, { eid: 'zz01', gift: 'gold', wt: -5, name: 'Ok' }, { eid: '__proto__', amt: 100 }, { eid: 'nope', amt: 100 }], sides: ['', 'bride', 'x'.repeat(99)] } });
  const [fc2] = await Promise.all([page.waitForEvent('filechooser'), page.click('#btnRestore')]);
  await fc2.setFiles(pick(evil, 'evil.json'));
  await wait(300);
  expect((await page.$$eval('#evSel option', (o) => o.length)) === 1 && (await rows()).length === 1, 'crafted backup: 1 function, 1 harmless entry');
  const [fc3] = await Promise.all([page.waitForEvent('filechooser'), page.click('#btnRestore')]);
  await fc3.setFiles(pick('{oops', 'x.json'));
  await wait(200);
  log('shagun flows ok (' + lang + ')');
};
