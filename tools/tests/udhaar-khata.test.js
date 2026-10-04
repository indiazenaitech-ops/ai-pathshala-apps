/* Interaction test for Udhaar Khata (run by tools/verify.js in en and hi). */
const fs = require('fs');

module.exports = async function ({ page, lang, expect, t, log }) {
  const pick = (buffer, name, mime) => ({ name, mimeType: mime, buffer: Buffer.from(buffer, 'utf8') });
  const txt = async (sel) => (await page.textContent(sel)).trim();
  const wait = (ms) => page.waitForTimeout(ms);
  const rowsOf = () => page.$$eval('#k-rows .prow', (r) => r.map((x) => x.querySelector('.pname').textContent));

  // 0) three example people on first load, flagged as examples; the dashboard adds up their balances
  let rows = await rowsOf();
  expect(rows.length === 3, '3 sample people on first load, got ' + rows.length);
  expect(await page.isVisible('#sample-note'), 'sample note shown');
  // Ramesh: 1250 - 500 + 320.50 = 1070.50 ; Sunita: 800 (overdue) ; Gupta: got 15000 - gave 5000 => you give 10000
  expect((await txt('#d-collect')) === '₹1,870.50', 'to collect = ₹1,870.50 (lakh grouping, paise exact), got ' + (await txt('#d-collect')));
  expect((await txt('#d-pay')) === '₹10,000.00', 'to pay = ₹10,000.00, got ' + (await txt('#d-pay')));
  expect((await txt('#d-overdue')) === '₹800.00', 'overdue = ₹800.00, got ' + (await txt('#d-overdue')));

  // 1) add a customer (modal form), then "you gave 500" + "you got 200" -> balance 300
  await page.click('#k-add');
  await page.waitForSelector('#pf-name');
  await page.fill('#pf-name', 'Priya Sharma');
  await page.fill('#pf-phone', '98765 43210');
  await page.click('#pf-save');
  await page.waitForSelector('#k-detail:not([hidden])');
  expect((await txt('#pd-name')) === 'Priya Sharma', 'detail view opens for the new customer');
  expect((await txt('#pd-bal')) === '₹0.00', 'new customer starts settled');
  expect(await page.isDisabled('#k-wa'), 'WhatsApp reminder disabled while nothing is pending');

  await page.click('#e-gave');
  await page.fill('#e-amt', '500');
  await page.fill('#e-note', 'Atta 10 kg');
  await page.click('#e-save');
  await wait(100);
  expect((await txt('#pd-bal')) === '₹500.00', 'balance 500 after you gave 500, got ' + (await txt('#pd-bal')));
  await page.click('#e-got');
  await page.fill('#e-amt', '₹200/-');
  await page.click('#e-save');
  await wait(100);
  expect((await txt('#pd-bal')) === '₹300.00', 'balance 300 after you got 200, got ' + (await txt('#pd-bal')));
  expect((await txt('#pd-bal-l')) === t('you_get'), 'label says "you will get"');
  const ledger = await page.$$eval('#pd-table tbody tr', (trs) => trs.map((tr) => [tr.querySelector('.g').textContent, tr.querySelector('.r').textContent, tr.querySelector('.b').textContent]));
  expect(ledger.length === 2 && ledger[0][0] === '₹500.00' && ledger[1][1] === '₹200.00' && ledger[1][2] === '₹300.00', 'ledger rows with running balance: ' + JSON.stringify(ledger));
  // paise are exact: 0.10 + 0.20 is 0.30, not 0.30000000000000004
  await page.click('#e-gave'); await page.fill('#e-amt', '0.10'); await page.click('#e-save'); await wait(60);
  await page.click('#e-gave'); await page.fill('#e-amt', '0.20'); await page.click('#e-save'); await wait(60);
  expect((await txt('#pd-bal')) === '₹300.30', 'paise arithmetic exact: ' + (await txt('#pd-bal')));
  // bad amounts are refused with a message
  await page.click('#e-gave'); await page.fill('#e-amt', '12.345'); await page.click('#e-save'); await wait(60);
  expect(await page.isVisible('#e-err') && (await txt('#e-err')) === t('err_amt_dec'), '3 decimals refused');
  await page.fill('#e-amt', 'abc'); await page.click('#e-save'); await wait(60);
  expect((await txt('#e-err')) === t('err_amt_bad'), 'letters refused');
  await page.click('#e-cancel');

  // 2) WhatsApp reminder: wa.me link with the number and the amount in the message
  await page.click('#k-wa');
  await page.waitForSelector('#wa-text');
  const waText = await page.inputValue('#wa-text');
  expect(waText.includes('300.30') && waText.includes('Priya Sharma'), 'reminder text has amount and name: ' + waText);
  const href = await page.getAttribute('#wa-open', 'href');
  expect(href.startsWith('https://wa.me/919876543210?text=') && decodeURIComponent(href).includes('300.30'), 'wa.me link with 91 + number and amount, got ' + href.slice(0, 60));
  // switching the message language re-writes the message in that language and remembers it for the person
  await page.selectOption('#wa-lang', 'ta');
  const taText = await page.inputValue('#wa-text');
  expect(/[஀-௿]/.test(taText) && taText.includes('300.30'), 'Tamil reminder text: ' + taText.slice(0, 40));
  await page.keyboard.press('Escape');
  await wait(100);

  // 3) UPI QR needs a UPI ID; set it in settings, then the QR carries the balance
  await page.click('#k-qr');
  await page.waitForSelector('.edu-modal');
  expect((await page.textContent('.edu-modal')).includes(t('qr_no_upi')), 'asks for a UPI ID first');
  await page.keyboard.press('Escape'); await wait(100);
  await page.click('#tab-set');
  await page.fill('#st-shop', 'Sharma General Store');
  await page.fill('#st-upi', 'Sharma.Store@okbank');
  await page.dispatchEvent('#st-upi', 'blur');
  await page.click('#tab-khata');
  await page.click('#k-qr');
  await page.waitForSelector('#qr-box svg');
  const payload = await page.getAttribute('#qr-box', 'data-payload');
  expect(payload === 'upi://pay?pa=sharma.store@okbank&pn=Sharma%20General%20Store&am=300.30&cu=INR&tn=Khata', 'UPI payload, got ' + payload);
  expect((await txt('#qr-amt')) === '₹300.30', 'QR amount shown');
  await page.keyboard.press('Escape'); await wait(100);

  // 4) statement CSV: header + 4 entries (gave 500, got 200, gave 0.10, gave 0.20) with running balance
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#k-csv')]);
  const csv = fs.readFileSync(await dl.path(), 'utf8');
  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  expect(lines.length === 6, 'CSV = title + header + 4 entry rows, got ' + lines.length + ': ' + lines.join(' | ').slice(0, 200));
  expect(lines[2].includes('500.00') && lines[3].includes('200.00') && lines[3].includes('300.00') && lines[5].endsWith('300.30,'), 'CSV amounts and running balance: ' + lines.slice(2).join(' | '));
  log('csv ok, ' + csv.length + ' bytes');

  // 5) edit an entry and undo it; delete an entry and undo it
  await page.click('#pd-table tbody tr:nth-child(1) .edit');
  await page.fill('#e-amt', '600');
  await page.click('#e-save'); await wait(100);
  expect((await txt('#pd-bal')) === '₹400.30', 'edit 500 -> 600 gives 400.30: ' + (await txt('#pd-bal')));
  expect(await page.isVisible('#undo-bar'), 'undo bar shown after an edit');
  await page.click('#undo-btn'); await wait(100);
  expect((await txt('#pd-bal')) === '₹300.30', 'undo restores 300.30: ' + (await txt('#pd-bal')));
  await page.click('#pd-table tbody tr:nth-child(2) .edit');
  await page.click('#e-delete'); await wait(100);
  expect((await txt('#pd-bal')) === '₹500.30', 'deleting the 200 payment gives 500.30: ' + (await txt('#pd-bal')));
  await page.click('#undo-btn'); await wait(100);
  expect((await txt('#pd-bal')) === '₹300.30', 'undo brings the payment back');

  // 6) due date -> overdue list; the list filter finds the person
  await page.click('#e-gave');
  await page.fill('#e-amt', '100');
  await page.fill('#e-due', '2026-01-15');
  await page.click('#e-save'); await wait(100);
  expect(!(await page.$eval('#pd-due', (e) => e.hidden)) && (await page.$eval('#pd-due', (e) => e.classList.contains('late'))), 'overdue line shown');
  await page.click('#k-back');
  await page.click('#k-filter button[data-v="overdue"]');
  rows = await rowsOf();
  expect(rows.length === 2 && rows.includes('Priya Sharma'), 'overdue filter shows Priya and the sample Sunita: ' + JSON.stringify(rows));
  await page.click('#k-filter button[data-v="all"]');
  await page.fill('#k-search', 'priya');
  rows = await rowsOf();
  expect(rows.length === 1 && rows[0] === 'Priya Sharma', 'search finds Priya: ' + JSON.stringify(rows));
  await page.fill('#k-search', '43210');
  expect((await rowsOf()).length === 1, 'search by phone digits');
  await page.fill('#k-search', '');

  // 7) cash book: opening (sample 2,000 + 1,850 - 400 = 3,450 today), add in 1000 + out 250 -> closing +750
  await page.click('#tab-cash');
  const open0 = await txt('#c-open-v'), close0 = await txt('#c-close-v');
  expect(open0 === '₹2,000.00' && close0 === '₹3,450.00', 'sample cash day: opening 2,000 closing 3,450, got ' + open0 + ' / ' + close0);
  await page.click('#c-in'); await page.fill('#c-amt', '1,000'); await page.fill('#c-note', 'Sales'); await page.click('#c-save'); await wait(80);
  await page.click('#c-out'); await page.fill('#c-amt', '250'); await page.click('#c-save'); await wait(80);
  expect((await txt('#c-close-v')) === '₹4,200.00', 'closing 3,450 + 1,000 - 250 = 4,200, got ' + (await txt('#c-close-v')));
  await page.click('#c-next');
  expect((await txt('#c-open-v')) === '₹4,200.00', 'next day opens with yesterday\'s closing');
  await page.click('#c-open'); await page.fill('#o-amt', '5000'); await page.click('#o-form button[type="submit"]'); await wait(80);
  expect((await txt('#c-open-v')) === '₹5,000.00', 'opening balance set to 5,000');
  await page.click('#c-today');
  expect((await txt('#c-close-v')) === '₹5,000.00', 'earlier days shift so today closes at 5,000');

  // 8) summary tab: this month's totals include the new entries
  await page.click('#tab-sum');
  expect((await txt('#s-overdue-n')) === '2', 'two overdue people in the summary');
  expect((await page.$$eval('#s-top .prow', (r) => r.length)) >= 2, 'biggest balances listed');

  // 9) backup -> reset -> restore: the khata comes back exactly
  await page.click('#tab-set');
  const [bk] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#bk-json')]);
  const backup = fs.readFileSync(await bk.path(), 'utf8');
  const parsed = JSON.parse(backup);
  expect(parsed.app === 'udhaar-khata' && parsed.parties.length === 4 && parsed.entries.length === 11 && parsed.cash.length === 4, 'backup has 4 people, 11 entries, 4 cash rows: ' + parsed.parties.length + '/' + parsed.entries.length + '/' + parsed.cash.length);
  expect((await txt('#bk-last')) !== t('bk_never'), 'last backup date recorded');
  await page.click('#reset-btn'); await wait(200);
  expect((await txt('#d-collect')) === '₹0.00', 'reset clears the dashboard');
  await page.click('#tab-khata');
  expect((await rowsOf()).length === 0, 'reset clears the list');
  await page.click('#tab-set');
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#bk-restore')]);
  await fc.setFiles(pick(backup, 'backup.json', 'application/json'));
  await wait(400);
  expect((await txt('#d-collect')) === '₹2,270.80', 'restored: to collect 1,870.50 + 300.30 + 100 = 2,270.80, got ' + (await txt('#d-collect')));
  expect((await page.inputValue('#st-upi')) === 'sharma.store@okbank', 'restored shop settings');
  const [bk2] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#bk-json')]);
  const again = JSON.parse(fs.readFileSync(await bk2.path(), 'utf8'));
  const strip = (o) => JSON.stringify({ p: o.parties, e: o.entries, c: o.cash, m: o.meta });
  expect(strip(again) === strip(parsed), 'backup after restore equals the original backup');

  // a crafted backup cannot break the app
  const evil = JSON.stringify({ app: 'udhaar-khata', meta: { cashStart: 'x' }, parties: [{ id: '__proto__', name: { a: 1 } }, { id: 'toString', name: 'Ghost' }, { id: 'zed1', name: 'Zed', type: 'alien' }], entries: [{ pid: 'zed1', kind: 'gave', paise: '1e400', date: '2026-02-30' }, { pid: 'toString', kind: 'gave', paise: 500, date: '2026-03-01' }, { pid: 'zed1', kind: 'got', paise: 250, date: '2026-03-01' }], cash: [{ kind: 'in', paise: -5, date: '2026-03-01' }] });
  const [fc2] = await Promise.all([page.waitForEvent('filechooser'), page.click('#bk-restore')]);
  await fc2.setFiles(pick(evil, 'evil.json', 'application/json'));
  await wait(300);
  await page.click('#tab-khata');
  rows = await rowsOf();
  expect(rows.length === 2 && rows.includes('Zed') && rows.includes('Ghost'), 'crafted backup restored safely (ids re-issued, nameless row dropped): ' + JSON.stringify(rows));
  expect((await txt('#d-pay')) === '₹2.50', 'only the valid 250 paise entry survived: ' + (await txt('#d-pay')));
  await page.click('#tab-set');
  const [fc3] = await Promise.all([page.waitForEvent('filechooser'), page.click('#bk-restore')]);
  await fc3.setFiles(pick(backup, 'backup.json', 'application/json'));
  await wait(300);

  // 10) encrypted backup round trip (WebCrypto PBKDF2 + AES-GCM) with a passphrase modal
  const encOk = await page.evaluate(() => !!(window.crypto && window.crypto.subtle));
  if (encOk) {
    await page.click('#bk-enc');
    await page.waitForSelector('#pp-input');
    await page.fill('#pp-input', 'short');
    await page.click('#pp-ok');
    expect((await page.textContent('.edu-modal')).includes(t('pp_short')), 'short passphrase refused');
    await page.fill('#pp-input', 'dukaan-2026-secret');
    const [enc] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click('#pp-ok')]);
    const encFile = JSON.parse(fs.readFileSync(await enc.path(), 'utf8'));
    expect(encFile.enc === 1 && encFile.kdf.name === 'PBKDF2' && typeof encFile.data === 'string' && !encFile.data.includes('Priya'), 'encrypted file has no plain text');
    await page.click('#reset-btn'); await wait(200);
    const [fc4] = await Promise.all([page.waitForEvent('filechooser'), page.click('#bk-restore')]);
    await fc4.setFiles(pick(JSON.stringify(encFile), 'backup.encrypted.json', 'application/json'));
    await page.waitForSelector('#pp-input');
    await page.fill('#pp-input', 'wrong-passphrase');
    await page.click('#pp-ok');
    await wait(1500);
    expect((await txt('#d-collect')) === '₹0.00', 'wrong passphrase restores nothing');
    const [fc5] = await Promise.all([page.waitForEvent('filechooser'), page.click('#bk-restore')]);
    await fc5.setFiles(pick(JSON.stringify(encFile), 'backup.encrypted.json', 'application/json'));
    await page.waitForSelector('#pp-input');
    await page.fill('#pp-input', 'dukaan-2026-secret');
    await page.click('#pp-ok');
    await wait(1500);
    expect((await txt('#d-collect')) === '₹2,270.80', 'encrypted backup restored: ' + (await txt('#d-collect')));
    log('encrypted backup round trip ok');
  } else log('crypto.subtle unavailable, encrypted backup skipped');

  // 11) PIN: set, reload -> lock screen, wrong PIN rejected, right PIN unlocks, remove
  await page.click('#pin-set');
  await page.waitForSelector('#pin-in1');
  await page.fill('#pin-in1', '2468'); await page.fill('#pin-in2', '2486'); await page.click('#pin-ok');
  expect((await page.textContent('.edu-modal')).includes(t('pin_mismatch')), 'mismatching PINs refused');
  await page.fill('#pin-in2', '2468'); await page.click('#pin-ok'); await wait(300);
  expect((await txt('#pin-status')) === t('pin_on'), 'PIN on');
  await wait(400);
  await page.reload(); await wait(900);
  expect(await page.isVisible('#lock'), 'lock screen after reload');
  await page.fill('#lock-pin', '0000'); await page.click('#lock-ok'); await wait(300);
  expect(await page.isVisible('#lock') && (await txt('#lock-err')) === t('lock_wrong'), 'wrong PIN rejected');
  // digits typed on an Urdu / Hindi keyboard (Arabic-Indic, Devanagari) must open the same PIN
  await page.fill('#lock-pin', '٢٤٦٨'); await page.click('#lock-ok'); await wait(300);
  expect(!(await page.isVisible('#lock')), 'unlocked with Arabic-Indic digits for 2468');
  expect((await txt('#d-collect')) === '₹2,270.80', 'data intact after reload');
  await page.click('#tab-set');
  await page.click('#pin-remove'); await wait(100);
  expect((await txt('#pin-status')) === t('pin_off'), 'PIN removed');

  // 12) sample removal + undo, language switch keeps sample names localized
  await page.click('#rm-samples'); await wait(100);
  await page.click('#tab-khata');
  rows = await rowsOf();
  expect(rows.length === 1 && rows[0] === 'Priya Sharma', 'examples removed, real customer stays: ' + JSON.stringify(rows));
  await page.click('#undo-btn'); await wait(100);
  expect((await rowsOf()).length === 4, 'undo brings the examples back');
  const other = lang === 'hi' ? 'en' : 'hi';
  const before = await page.$eval('#k-rows .prow:has(.badge.ex) .pname', (e) => e.textContent);
  await page.selectOption('#edu-lang', other); await wait(200);
  const after = await page.$eval('#k-rows .prow:has(.badge.ex) .pname', (e) => e.textContent);
  await page.selectOption('#edu-lang', lang); await wait(200);
  expect(before !== after, 'sample names follow the language: ' + before + ' / ' + after);
  // 13) lakh grouping in every language (CLDR ur-IN / kn-IN group by thousands) and a language switch mid-entry
  await page.click('#k-rows .prow:has(.pname:text-is("Priya Sharma"))');
  await page.waitForSelector('#k-detail:not([hidden])');
  await page.click('#e-gave'); await page.fill('#e-amt', '1,50,000');
  await page.selectOption('#edu-lang', 'ur'); await wait(250);
  expect((await page.inputValue('#e-amt')) === '1,50,000' && (await txt('#e-title')) === 'نیا اندراج: آپ نے دیے', 'open entry form keeps its value and re-titles in Urdu: ' + (await txt('#e-title')));
  await page.click('#e-save'); await wait(100);
  expect((await txt('#pd-bal')) === '₹1,50,400.30' && (await txt('#d-collect')) === '₹1,52,270.80', 'Urdu page shows lakh grouping: ' + (await txt('#pd-bal')) + ' / ' + (await txt('#d-collect')));
  await page.click('#k-wa'); await page.waitForSelector('#wa-text');
  await page.selectOption('#wa-lang', 'kn'); await wait(50);
  expect((await page.inputValue('#wa-text')).includes('₹1,50,400.30'), 'Kannada reminder uses lakh grouping too');
  await page.keyboard.press('Escape'); await wait(100);
  await page.selectOption('#edu-lang', lang); await wait(250);
  await page.click('#pd-table tbody tr:last-child .edit'); await page.click('#e-delete'); await wait(100);
  expect((await txt('#d-collect')) === '₹2,270.80', 'test entry removed again');
  await page.click('#k-back');
  // tidy for the after-test screenshot
  await page.click('#k-rows .prow');
};
