/* Interaction test for WhatsApp Business Link Kit (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, expect, t }) {
  const link = () => page.inputValue('#linkOut');
  const kind = () => page.getAttribute('#phoneStatus', 'data-kind');

  // 0. starts on the link tab with a ready template and a "choose a chat" link (no number)
  await page.waitForSelector('#tab-link[aria-selected="true"]');
  let l = await link();
  expect(l.startsWith('https://wa.me/?text='), 'default link has no number, got ' + l.slice(0, 40));
  expect((await page.inputValue('#msg')).length > 20, 'a ready-made message is filled in');

  // 1. '098765 43210' + message -> exact wa.me link (newline %0A, emoji UTF-8)
  await page.fill('#cc', '91');
  await page.fill('#phone', '098765 43210');
  const msg = 'Hello Priya!\nYour order #42 is ready 🎉 & packed';
  await page.fill('#msg', msg);
  l = await link();
  expect(l === 'https://wa.me/919876543210?text=' + encodeURIComponent(msg), 'exact link, got ' + l);
  expect(l.includes('%0A'), 'newline encoded as %0A');
  expect(await kind() === 'mobile', 'Indian mobile recognised, got ' + (await kind()));
  expect((await page.getAttribute('#openWa', 'href')) === l, 'Open in WhatsApp uses the same link');
  // Ctrl+Enter = "Open in WhatsApp" once, and this page must stay (window.open + 'noopener' returns null)
  await page.evaluate(() => { window.__opened = 0; document.getElementById('openWa').addEventListener('click', (e) => { e.preventDefault(); window.__opened++; }); });
  await page.focus('#msg');
  await page.keyboard.press('Control+Enter');
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => window.__opened) === 1 && page.url().includes('whatsapp-business-kit'), 'Ctrl+Enter opens the chat once and keeps this page, url=' + page.url().slice(0, 50));

  // 2. other ways of writing the same number (incl. Devanagari digits and the 00 prefix)
  for (const v of ['+91 98765 43210', '98765-43210', '919876543210', '0091 9876543210', '(+91) 98765-43210', '+९१ ९८७६५ ४३२१०', '98765 43210 / 91234 56789']) {
    await page.fill('#phone', v);
    l = await link();
    expect(l.startsWith('https://wa.me/919876543210?text='), v + ' -> ' + l.slice(0, 40));
  }
  // landline warns, a short number is an error, a UAE number is international
  await page.fill('#phone', '011 2345 6789');
  expect(await kind() === 'landline', 'landline warning, got ' + (await kind()));
  await page.fill('#phone', '98765');
  expect(await kind() === 'len', 'too few digits, got ' + (await kind()));
  await page.fill('#phone', '+971 50 123 4567');
  expect(await kind() === 'intl' && (await link()).startsWith('https://wa.me/971501234567?'), 'UAE number kept as international');
  await page.fill('#phone', '98765 43210');

  // 3. WhatsApp formatting preview
  await page.fill('#msg', '*Sale* today _only_ ~₹999~ `code` ```mono```\n> quoted line\n- one\n- two\n1. first');
  expect((await page.textContent('#preview strong')) === 'Sale', '*Sale* renders <strong>');
  expect((await page.textContent('#preview em')) === 'only', '_only_ renders <em>');
  expect((await page.textContent('#preview s')) === '₹999', '~₹999~ renders <s>');
  expect(await page.$$eval('#preview .wa-list li', (e) => e.length) === 3, 'bullet + numbered list items');
  expect(await page.$$eval('#preview blockquote', (e) => e.length) === 1, 'quote block');
  expect(await page.$$eval('#preview .wa-mono, #preview .wa-ic', (e) => e.length) === 2, 'monospace + inline code');
  await page.fill('#msg', 'snake_case_name and 2*3*4 stay plain');
  expect(await page.$$eval('#preview strong, #preview em', (e) => e.length) === 0, 'markers inside words are not formatting');

  // 4. bold button wraps the selected word
  await page.fill('#msg', 'Big sale');
  await page.$eval('#msg', (ta) => { ta.focus(); ta.setSelectionRange(0, 3); });
  await page.click('#fmt-bold');
  expect((await page.inputValue('#msg')) === '*Big* sale', 'bold toolbar, got ' + (await page.inputValue('#msg')));

  // 5. template + fill-in details; empty UPI drops its line. Untouched details are grey examples (placeholders)
  expect((await page.inputValue('#f-shop')) === '' && (await page.getAttribute('#f-shop', 'placeholder')).length > 2, 'example shop name is a placeholder, not a value');
  await page.click('[data-tpl="payment"]');
  expect((await page.inputValue('#msg')).includes('{upi}'), 'payment template has {upi}');
  await page.fill('#f-name', 'Ravi');
  await page.fill('#f-amount', '₹12500');
  await page.fill('#f-upi', 'ravi.store@okaxis');
  let pv = await page.textContent('#preview');
  expect(pv.includes('Ravi') && pv.includes('12,500') && pv.includes('ravi.store@okaxis'), 'details filled in: ' + pv.slice(0, 120));
  await page.fill('#f-upi', '');
  pv = await page.textContent('#preview');
  expect(!pv.includes('{upi}') && !pv.includes('UPI'), 'empty UPI line left out');

  // 6. UTM tags on website links (not on WhatsApp links)
  await page.fill('#msg', 'See https://shop.example.in/offers. Chat: https://wa.me/919876543210');
  await page.$eval('#utmBox', (d) => { d.open = true; });
  await page.check('#utmOn');
  await page.fill('#utm-campaign', 'Diwali Sale');
  const text = decodeURIComponent((await link()).split('?text=')[1]);
  expect(text.includes('https://shop.example.in/offers?utm_source=whatsapp&utm_medium=social&utm_campaign=diwali_sale.'), 'utm tags added: ' + text);
  expect(text.includes('Chat: https://wa.me/919876543210') && !/wa\.me\/919876543210\?utm/.test(text), 'wa.me link untouched');
  await page.uncheck('#utmOn');

  // 7. very long Hindi message -> long-link warning
  await page.fill('#msg', 'नमस्ते '.repeat(160));
  expect(await page.isVisible('#longWarn'), 'long link warning visible');
  await page.fill('#msg', 'Hi {name}, ₹{amount} is due on {date}. — {shop}');
  expect(!(await page.isVisible('#longWarn')), 'warning hidden for a short message');

  // 8. customer list: 3 CSV rows -> 3 personal links
  await page.click('#tab-list');
  await page.fill('#listIn', 'Name,Phone,Amount,Due date\nKiran Mehta,98765 43210,1250,2026-10-15\nArjun Rao,+91 91234 56789,"2,500",20-10-2026\nFatima Khan,07000012345,800,25 Oct');
  await page.waitForFunction(() => (document.querySelector('#rows .lrow .lname') || {}).textContent.includes('Kiran Mehta'), null, { timeout: 5000 });
  expect(await page.$$eval('#rows .lrow', (e) => e.length) === 3, '3 rows from 3 CSV lines');
  const hrefs = await page.$$eval('#rows .lopen', (a) => a.map((x) => x.getAttribute('href') || ''));
  expect(hrefs.length === 3 && hrefs.every(Boolean), '3 personal links, got ' + hrefs.length);
  const waLinks = await page.evaluate(() => {
    const sel = document.getElementById('openMode'); sel.value = 'wa'; sel.dispatchEvent(new Event('change', { bubbles: true }));
    return Array.from(document.querySelectorAll('#rows .lopen')).map((a) => a.getAttribute('href'));
  });
  expect(waLinks[0].startsWith('https://wa.me/919876543210?text=') && waLinks[1].startsWith('https://wa.me/919123456789?text=') && waLinks[2].startsWith('https://wa.me/917000012345?text='), 'numbers normalised: ' + waLinks.map((x) => x.slice(0, 28)).join(' | '));
  const m1 = decodeURIComponent(waLinks[0].split('?text=')[1]), m2 = decodeURIComponent(waLinks[1].split('?text=')[1]);
  expect(m1.startsWith('Hi Kiran Mehta, ₹1,250 is due on '), 'row 1 personalised: ' + m1);
  expect(m2.startsWith('Hi Arjun Rao, ₹2,500 is due on 20-10-2026'), 'row 2 personalised: ' + m2);
  expect(m1.includes('2026') && !m1.includes('{date}'), 'ISO date formatted: ' + m1);
  expect(m1.endsWith('— {shop}') && !m1.includes(await page.getAttribute('#f-shop', 'placeholder').catch(() => '##')), 'the example shop name is never sent to a real list: ' + m1);
  expect(await page.$$eval('#rows .lrow .lwarn.soft', (e) => e.length) >= 3, 'each row warns that {shop} is missing');
  // first name only
  await page.check('#firstName');
  const m1b = decodeURIComponent((await page.getAttribute('#rows .lrow:first-child .lopen', 'href')).split('?text=')[1]);
  expect(m1b.startsWith('Hi Kiran, '), 'first name only: ' + m1b);

  // 9. "sent" tick is saved on this device and the next-chat button moves on
  expect((await page.getAttribute('#listProgress', 'data-done')) === '0', 'nothing sent yet');
  await page.check('#rows .lrow:first-child .lsent');
  expect((await page.getAttribute('#listProgress', 'data-done')) === '1', 'one ticked');
  expect((await page.getAttribute('#openNext', 'href')).startsWith('https://wa.me/919123456789'), 'next chat is row 2');
  await page.reload();
  await page.waitForSelector('#tab-list[aria-selected="true"]');
  await page.waitForFunction(() => document.querySelectorAll('#rows .lrow').length === 3, null, { timeout: 5000 });
  expect((await page.getAttribute('#listProgress', 'data-done')) === '1', 'tick survives a reload');
  expect(await page.isChecked('#rows .lrow:first-child .lsent'), 'row 1 still ticked');

  // 10. a bad number is flagged and gets no link
  await page.fill('#listIn', 'Name,Phone\nRaju,12345\nSeema,9.87654E+09\nMeena,9988776655');
  await page.waitForFunction(() => (document.querySelector('#rows .lrow .lname') || {}).textContent.includes('Raju'), null, { timeout: 5000 });
  expect(await page.$$eval('#rows .lrow', (e) => e.length) === 3, 'three rows');
  expect(await page.$$eval('#rows .lrow.bad', (e) => e.length) === 2, 'two rows need a check');
  expect(await page.$$eval('#rows .lopen[href]', (e) => e.length) === 1, 'only the valid row has a link');

  // 10b. typical Indian sheet: serial-number column first, "Fee Due", two numbers in one cell, a wrong date
  await page.fill('#listIn', 'Sr No,Name,Mobile No,Fee Due,Due Date\n1,Aarav Shah,98765 43210 / 91234 56789,1500,2026-02-30\n2,Diya Nair,9988776655,"2,000",2026-11-05\n3,Kabir Das,9000012345,750,2026-11-06');
  await page.waitForFunction(() => (document.querySelector('#rows .lrow .lname') || {}).textContent.includes('Aarav'), null, { timeout: 5000 });
  const map = await page.evaluate(() => ['name', 'phone', 'amount', 'date'].map((k) => document.getElementById('map-' + k).value).join(','));
  expect(map === '1,2,3,4', 'Sr No is not the phone or amount column, Fee Due is the amount: ' + map);
  expect(await page.$$eval('#rows .lrow.bad', (e) => e.length) === 0, 'no row flagged bad');
  const h3 = await page.$$eval('#rows .lopen', (a) => a.map((x) => x.getAttribute('href') || ''));
  expect(h3[0].startsWith('https://wa.me/919876543210?text='), 'first of two numbers used: ' + h3[0].slice(0, 30));
  const a3 = decodeURIComponent(h3[0].split('?text=')[1]);
  expect(a3.includes('₹1,500') && a3.includes('2026-02-30'), 'amount formatted, impossible date kept as typed: ' + a3);
  // CSV download keeps phone numbers as text for Excel ("+91 98765 43210", not +919876543210 -> 9.19877E+11)
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }), page.click('#exportCsv')]);
  const csvOut = require('fs').readFileSync(await dl.path(), 'utf8');
  expect(csvOut.split(/\r?\n/)[1].split(',')[2] === '+91 98765 43210', 'CSV phone stays text: ' + csvOut.split(/\r?\n/)[1].slice(0, 60));
  // a double-click on "Open next chat" opens ONE chat and ticks one customer, not the next one too
  await page.evaluate(() => document.addEventListener('click', (e) => { if (e.target.closest('#openNext')) e.preventDefault(); }));
  const click1 = () => page.$eval('#openNext', (a) => a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 })));
  await click1(); await page.waitForTimeout(150); await click1(); await page.waitForTimeout(150);
  expect((await page.getAttribute('#listProgress', 'data-done')) === '1', 'double-click ticks one row, got ' + (await page.getAttribute('#listProgress', 'data-done')));
  expect((await page.getAttribute('#openNext', 'href')).startsWith('https://wa.me/919988776655'), 'next chat is row 2');

  // 11. website button snippet
  await page.click('#tab-button');
  await page.fill('#b-phone', '98765 43210');
  let code = await page.textContent('#bCode');
  expect(code.includes('href="https://wa.me/919876543210?text=') && code.includes('right:20px'), 'snippet has the number and sits bottom right');
  await page.click('#b-pos [data-v="left"]');
  await page.click('#b-style [data-v="pill"]');
  code = await page.textContent('#bCode');
  expect(code.includes('left:20px') && code.includes('<span>'), 'left pill button snippet');
  expect(await page.isVisible('#contrastWarn'), 'white text on WhatsApp green warns about contrast');
  await page.click('#b-ink [data-v="dark"]');
  expect(!(await page.isVisible('#contrastWarn')), 'dark text clears the warning');
  expect((await page.getAttribute('#bPreview', 'href')).startsWith('https://wa.me/919876543210'), 'preview button links to the number');
  await page.click('#tab-link');
};
