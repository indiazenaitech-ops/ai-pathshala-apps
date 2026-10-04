/* Interaction test for "Build a Chatbot" (run by tools/verify.js in en and hi). */
module.exports = async function ({ page, lang, expect }) {
  const C = await page.evaluate((L) => window.APP_CONTENT[L], lang);
  const S = C.sample;

  async function ask(q) {
    const before = await page.$$eval('#chatLog .msg.bot', (els) => els.length);
    await page.fill('#chatInput', q);
    await page.click('#sendBtn');
    await page.waitForFunction((n) => document.querySelectorAll('#chatLog .msg.bot').length > n, before, { timeout: 8000 });
    return page.$eval('#chatLog .msg.bot:last-child', (el) => ({
      intent: el.dataset.intent, score: +el.dataset.score,
      text: el.querySelector('.bubble').textContent,
      why: (el.querySelector('.why') || {}).textContent || ''
    }));
  }

  // 1. sample bot in this language is loaded and greets; self-test is 100 %
  await page.waitForSelector('#chatLog .msg.bot[data-intent="g"]');
  const greet = (await page.textContent('#chatLog .msg.bot .bubble')).trim();
  expect(greet === S.greeting.trim(), 'greeting of the sample bot is shown, got: ' + greet.slice(0, 60));
  const intents = await page.$$eval('#intentList .intent', (l) => l.length);
  expect(intents === 6, 'sample bot has 6 intents, got ' + intents);
  const hs = (await page.textContent('#healthScore')).trim();
  expect(hs.indexOf('100') === 0, 'bot check-up self-test is 100%, got ' + hs);

  // 2. a library question goes to the library intent, with a library reply and a "why" chip
  let r = await ask(S.intents[1].examples[3]);
  expect(r.intent === '1', 'library question -> intent 1, got ' + r.intent);
  expect(S.intents[1].replies.indexOf(r.text) >= 0, 'reply comes from the library replies: ' + r.text.slice(0, 50));
  expect(r.why.indexOf(S.intents[1].name) >= 0 && r.why.indexOf('100') >= 0, 'why chip shows intent + 100%: ' + r.why);
  expect(r.why.split('·').length >= 3, 'why chip also lists the matched words: ' + r.why);

  // 2b. two intents with the same score: the thinking panel says why the winner won
  r = await ask(S.intents[0].examples[0] + ' ' + S.intents[5].examples[0]);
  expect(r.intent === '0' && r.score === 100, 'tie between two keywords -> first intent wins, got ' + r.intent + ' ' + r.score);
  await page.click('#chatLog .msg.bot:last-child .why');
  const tieTxt = await page.$eval('#chatLog .msg.bot:last-child .why-panel', (e) => (e.querySelector('.why-tie') || {}).textContent || '');
  expect(tieTxt.indexOf(S.intents[5].name) >= 0, 'tie explained in the thinking panel: ' + tieTxt);

  // 3. something never taught -> fallback reply, and it is collected as an unanswered question
  r = await ask(C.tricky[1]);
  expect(r.intent === '-1', 'unknown question -> fallback, got ' + r.intent);
  expect(S.fallback.indexOf(r.text) >= 0, 'fallback text used');
  let missed = await page.$$eval('#missedList li', (l) => l.length);
  expect(missed === 1, 'unanswered question collected, got ' + missed);

  // 4. the "not" trick still matches fees (rule-based bots do not understand meaning)
  r = await ask(C.tricky[2]);
  expect(r.intent === '3', 'negation trick still matches the fees intent, got ' + r.intent);
  await page.click('#chatLog .msg.bot:last-child .why');
  const win = await page.$$eval('#chatLog .msg.bot:last-child .bar-row.win .bar-name', (l) => l.map((x) => x.textContent));
  expect(win.length === 1 && win[0] === S.intents[3].name, 'thinking panel highlights the winning intent bar, got ' + win.join('|'));

  // 5. teach the bot: add the unanswered question to intent 0, then ask again
  await page.click('#missedTitle');
  await page.selectOption('#missedList li:first-child select', '0');
  await page.click('#missedList li:first-child .missed-add');
  missed = await page.$$eval('#missedList li', (l) => l.length);
  expect(missed === 0, 'question removed from the unanswered list');
  r = await ask(C.tricky[1]);
  expect(r.intent === '0' && r.score === 100, 'after teaching, the question matches intent 0 at 100%, got ' + r.intent + ' ' + r.score);

  // 5b. natural questions that are not copied from the examples
  const natural = lang === 'hi'
    ? [['स्कूल कब शुरू होता है?', '0'], ['स्कूल का टाइम क्या है', '0'], ['फीस कहां जमा करें', '3']]
    : [['What time does school start?', '0'], ["Sorry, I can't come", '-1'], ['Where do I pay the fee?', '3']];
  for (const [q, want] of natural) {
    r = await ask(q);
    expect(r.intent === want, 'natural question "' + q + '" -> intent ' + want + ', got ' + r.intent + ' ' + r.why);
  }

  // 6. build a new intent in the editor and chat with it
  await page.click('#addIntent');
  const n = await page.$$eval('#intentList .intent', (l) => l.length);
  expect(n === 7, '7 intents after adding one, got ' + n);
  const last = '#intentList .intent:last-child';
  await page.fill(last + ' .in-name', 'Cricket');
  await page.fill(last + ' .in-ex', 'cricket\ncricket practice');
  await page.fill(last + ' .in-rep', 'Cricket practice is at 4 PM on the big ground.');
  r = await ask('when is cricket practice');
  expect(r.intent === '6' && r.text.indexOf('4 PM') >= 0, 'new intent answers, got ' + r.intent + ' ' + r.text);

  // 7. the threshold slider changes the decision: "practice" = 1 of 2 words = 50 %
  r = await ask('practice');
  expect(r.intent === '6' && r.score === 50, 'partial match 50% passes the 50% minimum, got ' + r.intent + ' ' + r.score);
  await page.$eval('#threshold', (el) => { el.value = '60'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  const lbl = await page.textContent('#thrLabel');
  expect(lbl.indexOf('60') >= 0, 'threshold label updated: ' + lbl);
  r = await ask('practice');
  expect(r.intent === '-1', 'with 60% minimum the same message falls back, got ' + r.intent);

  // 8. share link opens chat-only play mode with the same bot, in the sharer's language
  await page.click('#shareBtn');
  const link = await page.inputValue('#shareLink');
  expect(link.indexOf('#bot=') > 0, 'share link contains the packed bot');
  expect(link.indexOf('?lang=' + lang + '#') > 0, 'share link keeps the UI language: ' + link.slice(0, 120));
  await page.keyboard.press('Escape');
  await page.goto(link);
  await page.waitForSelector('body.cb-play', { timeout: 10000 });
  const editHidden = await page.$eval('#editCol', (e) => getComputedStyle(e).display === 'none');
  expect(editHidden, 'editor hidden in play mode');
  const name = (await page.textContent('#chatName')).trim();
  expect(name === S.name, 'play mode shows the shared bot name, got ' + name);
  r = await ask('when is cricket practice');
  expect(r.intent === '6', 'shared bot keeps the new intent, got ' + r.intent);
  const playLang = await page.evaluate(() => EDU.lang);
  expect(playLang === lang, 'play mode opens in the language of the link, got ' + playLang);
  await page.click('#playMake');
  await page.waitForSelector('body:not(.cb-play)');

  // 9. the edited bot survives a reload, even right after typing (no waiting for the autosave)
  await page.fill('#botName', 'Robo');
  await page.reload();
  await page.waitForSelector('#intentList .intent');
  const n2 = await page.$$eval('#intentList .intent', (l) => l.length);
  expect(n2 === 7, 'edited bot saved on this device, got ' + n2 + ' intents');
  const thr = await page.inputValue('#threshold');
  expect(thr === '60', 'threshold saved, got ' + thr);
  const savedName = await page.inputValue('#botName');
  expect(savedName === 'Robo', 'name typed just before reload is saved, got ' + savedName);

  // 10. a bot can have at most 40 intents: the add button turns off with a note
  for (let i = 0; i < 40; i++) {
    if (await page.$eval('#addIntent', (b) => b.disabled)) break;
    await page.click('#addIntent');
  }
  const full = await page.$$eval('#intentList .intent', (l) => l.length);
  const off = await page.$eval('#addIntent', (b) => b.disabled);
  const note = await page.isVisible('#maxNote');
  expect(full === 40 && off && note, 'max 40 intents, button disabled with a note: ' + full + ' ' + off + ' ' + note);

  // 11. an untrusted share link cannot break the layout or the matcher
  const bad = await page.evaluate(() => location.href.split('#')[0] + '#bot=' + EDU.pack({ n: 'X', a: 'ABCDEFGHIJKLMNOP', l: 'en', g: 'hi', f: ['?'], t: -40,
    i: [['js', ['constructor', 'toString valueOf'], ['ok']], ['proto', ['__proto__'], ['p']]] }));
  await page.goto(bad);
  await page.waitForSelector('body.cb-play');
  const av = (await page.textContent('#chatAvatar')).trim();
  expect(av === 'A', 'avatar from a link is one character, got ' + av);
  r = await ask('what is a constructor');
  expect(r.intent === '0' && r.score === 100, 'words like "constructor" are ordinary words, got ' + r.intent + ' ' + r.score);
  r = await ask('__proto__');
  expect(r.intent === '1', '"__proto__" matches its intent, got ' + r.intent);
  await page.click('#playMake');
  await page.waitForSelector('body:not(.cb-play)');
};
