/* Interaction test for Spelling Bee, run by tools/verify.js in en and hi.
   The browser's speech engine is replaced by a silent fake that records every utterance, so the
   test "hears" each word exactly like a child would (and can switch the English voice off). */
function installFakeSpeech() {
  let noVoice = false;
  try { noVoice = sessionStorage.getItem('__sb_novoice') === '1'; } catch (e) { }
  const voices = noVoice ? [] : [
    { name: 'Test English India', lang: 'en-IN', voiceURI: 'test-en-in', localService: true, default: true },
    { name: 'Test English UK', lang: 'en-GB', voiceURI: 'test-en-gb', localService: true, default: false },
    { name: 'Test Hindi', lang: 'hi-IN', voiceURI: 'test-hi', localService: true, default: false }
  ];
  window.__spoken = [];
  const synth = {
    speaking: false, pending: false, paused: false, onvoiceschanged: null,
    getVoices: () => voices.slice(),
    addEventListener() { }, removeEventListener() { },
    speak(u) {
      window.__spoken.push({ text: u.text, lang: u.lang, voice: u.voice ? u.voice.name : null, rate: u.rate });
      setTimeout(() => { if (u.onend) u.onend({}); }, 5);
    },
    cancel() { }, pause() { }, resume() { }
  };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true, writable: true });
  window.SpeechSynthesisUtterance = function (text) { this.text = text; this.lang = ''; this.voice = null; this.rate = 1; this.pitch = 1; };
}

module.exports = async function ({ page, lang, expect, t, log }) {
  const txt = async (sel) => ((await page.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const attr = (sel, a) => page.getAttribute(sel, a);
  const count = (sel) => page.$$eval(sel, (e) => e.length);
  const spokenN = () => page.evaluate(() => window.__spoken.length);
  const lastSpoken = () => page.evaluate(() => window.__spoken[window.__spoken.length - 1]);
  const heardAfter = async (n) => {
    await page.waitForFunction((k) => window.__spoken.length > k, n, { timeout: 6000 });
    return (await lastSpoken()).text;
  };
  const waitState = (P, s) => page.waitForFunction(([p, x]) => { const w = document.getElementById(p + '-wp'); return w && w.dataset.state === x; }, [P, s], { timeout: 6000 });
  /* the teacher's ✓ ✗ and "Show answer" ignore taps in the first 350 ms of a new word (double-tap guard) */
  const settle = () => page.waitForTimeout(400);
  const reload = async () => {
    await page.reload({ waitUntil: 'load' });
    await page.waitForFunction(() => window.EDU_READY && document.querySelectorAll('#p-levels .lvl').length === 7);
  };
  /* confirm() answered by the test (verify.js would accept every dialog) */
  const confirmWith = (answer) => page.evaluate((a) => { window.__confirms = []; window.confirm = (m) => { window.__confirms.push(String(m)); return a; }; }, answer);
  const confirms = () => page.evaluate(() => window.__confirms || []);
  const content = await page.evaluate((l) => ({ words: window.SB_WORDS.levels.map((L) => L.words.map((x) => x.w)), sent: Object.fromEntries([].concat(...window.SB_WORDS.levels.map((L) => L.words.map((x) => [x.w, x.s])))), m: window.APP_CONTENT[l].m }), lang);
  const stat = (k) => txt(`#stats [data-stat="${k}"] b`);

  await page.addInitScript(installFakeSpeech);
  await reload();
  await page.waitForSelector('#voice-status[data-voice="ok"]', { timeout: 5000 });

  /* 1) Setup: 5 levels + my list + mistakes; level 1 picked; voices listed */
  expect(await attr('#p-levels [data-level="1"]', 'aria-pressed') === 'true', 'level 1 is selected by default');
  expect(await page.isDisabled('#p-levels [data-level="review"]'), 'mistakes card disabled while there are none');
  expect(await count('#voice-sel option') === 3, 'automatic + 2 English voices offered (Hindi voice filtered out)');
  expect(await stat('st_words') === '0', 'no words practised yet');
  await page.click('#p-levels [data-level="2"]');
  expect(await attr('#p-levels [data-level="2"]', 'aria-pressed') === 'true', 'level 2 selected');
  expect(await txt('#p-round-info') === t('round_info', { n: '10' }), 'round of 10 words: ' + await txt('#p-round-info'));

  /* 2) Start: the word is spoken in Indian English, meaning shown in the page language */
  let n0 = await spokenN();
  await page.click('#p-start');
  await waitState('p', 'ask');
  const w1 = await heardAfter(n0);
  const sp1 = await lastSpoken();
  expect(content.words[1].includes(w1), 'spoken word is from the level 2 list: ' + w1);
  expect(sp1.voice === 'Test English India' && sp1.lang === 'en-IN', 'Indian English voice used: ' + JSON.stringify(sp1));
  expect(await txt('#p-count') === t('word_x_of_y', { i: '1', n: '10' }), 'counter shows word 1 of 10');
  expect(await txt('#p-meaning') === content.m[w1], 'meaning in ' + lang + ' shown: ' + await txt('#p-meaning'));

  /* 3) Sentence + slow repeat */
  await page.click('#p-sent');
  const s1 = (await lastSpoken()).text;
  expect(s1 === content.sent[w1], 'example sentence spoken: ' + s1);
  expect(await page.isVisible('#p-sent-clue'), 'sentence shown after hearing it');
  expect(!(await txt('#p-sentence')).toLowerCase().includes(w1), 'the word is blanked out in the shown sentence');
  await page.click('#p-slow');
  const slow = await lastSpoken();
  expect(slow.text === w1 && slow.rate < 0.7, 'slow repeat is the word at a slower rate: ' + JSON.stringify(slow));

  /* 4) Wrong first try → letter-by-letter feedback (one missing letter), then right.
        A double click on Check must not use up the second try with the same answer. */
  const wrong1 = w1.slice(0, 1) + w1.slice(2);
  await page.fill('#p-input', wrong1);
  await page.dblclick('#p-check');
  await waitState('p', 'retry');
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => document.getElementById('p-wp').dataset.state) === 'retry', 'double click on Check keeps the second try');
  expect(await attr('#p-fb', 'data-kind') === 'retry', 'second-try feedback shown');
  expect(await count('#p-fb .tile.miss') === 1, 'exactly one missing-letter box for "' + wrong1 + '"');
  expect(await count('#p-fb .tile.ok') === wrong1.length, 'all typed letters marked right');
  expect(await txt('#p-fb .fb-msg') === '🤔 ' + t('fb_retry'), 'retry message translated');
  await page.fill('#p-input', w1);
  await page.press('#p-input', 'Enter');
  await waitState('p', 'done');
  expect(await attr('#p-wp', 'data-result') === 'ok' && await attr('#p-fb', 'data-kind') === 'ok2', 'correct on second try');
  expect(await txt('#p-score') === '1' && await attr('#p-play', 'data-streak') === '1', 'score 1, streak 1');

  /* 5) Next word with all three hints, spelt by tapping the jumbled tiles */
  n0 = await spokenN();
  await page.click('#p-next');
  await waitState('p', 'ask');
  const w2 = await heardAfter(n0);
  expect(w2 !== w1, 'a new word');
  await page.click('#p-h-len');
  expect(await count('#p-boxes .box') === w2.length, 'letter boxes = ' + w2.length);
  expect(await txt('#p-len-note') === t('letters_n', { n: String(w2.length) }), 'letter count note');
  await page.click('#p-h-first');
  expect(await txt('#p-first') === w2[0], 'first letter hint shows "' + w2[0] + '"');
  expect(await count('#p-boxes .box.ghost') === 1, 'first box shows the first letter as a ghost');
  await page.click('#p-h-jumble');
  const tiles = await page.$$eval('#p-jumble .jt', (b) => b.map((x) => x.textContent));
  expect(tiles.slice().sort().join('') === w2.split('').sort().join(''), 'jumbled tiles hold exactly the letters of the word: ' + tiles.join(''));
  for (const ch of w2) {
    const idx = await page.$$eval('#p-jumble .jt', (bs, c) => bs.findIndex((b) => !b.disabled && b.textContent === c), ch);
    await page.click(`#p-jumble .jt[data-i="${idx}"]`);
  }
  expect(await page.inputValue('#p-input') === w2, 'tapping tiles typed the word');
  expect(await count('#p-jumble .jt:not([disabled])') === 0, 'every tile used once');
  expect(await txt('#p-hint-note') === t('hints_used_n', { n: '3' }), 'three hints counted');
  await page.click('#p-check');
  await waitState('p', 'done');
  expect(await attr('#p-fb', 'data-kind') === 'ok' && await txt('#p-score') === '2' && await attr('#p-play', 'data-streak') === '2', 'score 2, streak 2');

  /* 6) A miss: two wrong tries reveal the right spelling, streak resets */
  n0 = await spokenN();
  await page.click('#p-next');
  await waitState('p', 'ask');
  const w3 = await heardAfter(n0);
  await page.fill('#p-input', 'zzz'); await page.press('#p-input', 'Enter');
  await waitState('p', 'retry');
  await page.fill('#p-input', 'zzzz'); await page.press('#p-input', 'Enter');
  await waitState('p', 'done');
  expect(await attr('#p-wp', 'data-result') === 'bad' && await attr('#p-fb', 'data-kind') === 'bad', 'second wrong try ends the word');
  const bottom = await page.$$eval('#p-fb .tiles', (r) => r.map((x) => x.textContent.replace(/·/g, '')));
  expect(bottom.length === 2 && bottom[1] === w3, 'comparison rows show the right spelling "' + w3 + '": ' + bottom.join(' / '));
  expect(await attr('#p-play', 'data-streak') === '0' && await txt('#p-score') === '2', 'streak reset, score stays 2');

  /* 6b) Reload in the middle of the round: the round goes on at word 4 with score 2 */
  await reload();
  expect(await page.isVisible('#p-play') && await page.isHidden('#p-setup'), 'the unfinished round is back after a reload');
  expect(await txt('#p-count') === t('word_x_of_y', { i: '4', n: '10' }), 'round continues at word 4: ' + await txt('#p-count'));
  expect(await txt('#p-score') === '2' && await attr('#p-play', 'data-streak') === '0', 'score 2 and streak 0 kept');
  expect(await stat('st_words') === '3', 'progress counted 3 words');
  n0 = await spokenN();
  await page.click('#p-hear');                                   // no auto-speech after a reload: the child taps 🔊
  const w4 = await heardAfter(n0);
  expect(![w1, w2, w3].includes(w4) && content.words[1].includes(w4), 'word 4 is a new level 2 word: ' + w4);
  await page.fill('#p-input', w4); await page.press('#p-input', 'Enter');
  await waitState('p', 'done');

  /* 7) Finish the round correctly → summary 9/10 with one word to practise */
  for (let i = 5; i <= 10; i++) {
    n0 = await spokenN();
    await page.click('#p-next');
    await waitState('p', 'ask');
    const w = await heardAfter(n0);
    await page.fill('#p-input', w); await page.press('#p-input', 'Enter');
    await waitState('p', 'done');
  }
  expect(await txt('#p-next-lbl') === t('see_result'), 'last word offers "see my score"');
  await page.click('#p-next');
  await page.waitForSelector('#p-summary', { state: 'visible' });
  expect(await txt('#sum-score') === t('sum_score', { c: '9', n: '10' }), 'summary 9 of 10: ' + await txt('#sum-score'));
  expect(await count('#sum-mist li') === 1 && (await txt('#sum-mist li .mw')) === w3, 'the missed word is listed: ' + w3);
  expect((await txt('#sum-streak')).includes(t('sum_streak', { n: '7' })), 'best streak 7: ' + await txt('#sum-streak'));
  expect(await stat('st_words') === '10' && await stat('st_review') === '1', 'progress: 10 words, 1 to review');
  expect(await page.evaluate(() => localStorage.getItem('edu.spelling-bee.run')) === null, 'a finished round is no longer kept for a reload');

  /* 8) Practise the mistake → perfect mini-round, mistakes list empties */
  n0 = await spokenN();
  await page.click('#sum-redo');
  await waitState('p', 'ask');
  const wr = await heardAfter(n0);
  expect(wr === w3, 'mistake round asks the missed word again');
  await page.fill('#p-input', wr); await page.press('#p-input', 'Enter');
  await waitState('p', 'done');
  await page.click('#p-next');
  await page.waitForSelector('#p-summary', { state: 'visible' });
  expect(await txt('#sum-score') === t('sum_score', { c: '1', n: '1' }) && await page.isVisible('#sum-perfect'), 'perfect mistake round');
  expect(await stat('st_review') === '0', 'mistakes list is empty again');

  /* 9) Teacher list pasted from a worksheet: 3 good words ("2) peacock" and "• constructor." are cleaned up;
        "constructor" is also a name on JS objects), a bad line skipped, a duplicate ignored */
  await page.click('#tab-lists');
  await page.fill('#l-text', 'giraffe | The giraffe has a long neck. | a tall animal\n2) peacock\n12345\nGiraffe\n• constructor.');
  await page.click('#l-save');
  const msg = await txt('#l-msg');
  expect(msg.includes(t('list_saved', { n: '3' })) && msg.includes(t('list_skipped', { n: '1' })), 'saved 3 words, skipped 1 line: ' + msg);
  expect(await count('#l-table tbody tr') === 3 && await attr('#l-levels [data-level="custom"]', 'aria-pressed') === 'true', 'my list shown in the table');
  expect(await txt('#l-table tbody tr:nth-child(3) td.m') === '', '"constructor" has no made-up meaning: "' + await txt('#l-table tbody tr:nth-child(3) td.m') + '"');
  expect(await page.$$eval('#print-area .test-sheet .key-list li', (l) => l.map((x) => x.textContent).join(',')) === 'giraffe,peacock,constructor', 'printable test has an answer key');
  expect(await page.$eval('#print-area .list-sheet tbody tr td:nth-child(4)', (td) => td.getAttribute('dir')) === 'ltr', 'printed English sentences are marked left-to-right (for Urdu pages)');

  /* 9b) "Example" asks before it replaces the teacher's own list */
  await confirmWith(false);
  await page.click('#l-example');
  expect((await confirms())[0] === t('confirm_replace_list', { n: '3' }), 'Example asks first: ' + (await confirms())[0]);
  expect((await page.inputValue('#l-text')).startsWith('giraffe') && await count('#l-table tbody tr') === 3, 'saying "no" keeps the list');
  await confirmWith(true);

  await page.click('#tab-practise');
  await page.click('#sum-levels');
  await page.click('#p-levels [data-level="custom"]');
  expect(await txt('#p-round-info') === t('round_info', { n: '3' }), 'my list gives a 3-word round');
  n0 = await spokenN();
  await page.click('#p-start');
  await waitState('p', 'ask');
  for (let i = 0; i < 3; i++) {
    const w = await heardAfter(n0);
    expect(['giraffe', 'peacock', 'constructor'].includes(w), 'custom word spoken: ' + w);
    if (w === 'giraffe') expect(await txt('#p-meaning') === 'a tall animal', 'teacher meaning shown');
    if (w === 'constructor') expect(await page.isHidden('#p-meaning'), 'no meaning row for a word without one');
    await page.fill('#p-input', w.toUpperCase()); await page.press('#p-input', 'Enter');
    await waitState('p', 'done');
    expect(await attr('#p-wp', 'data-result') === 'ok', 'capital letters still count as right');
    n0 = await spokenN();
    await page.click('#p-next');
    if (i < 2) await waitState('p', 'ask');
  }
  await page.waitForSelector('#p-summary', { state: 'visible' });
  expect(await txt('#sum-score') === t('sum_score', { c: '3', n: '3' }), 'custom round 3 of 3');

  /* 10) Class bee: two players, 2 words each, typing and teacher judging; the scoreboard survives a reload */
  await page.click('#tab-bee');
  await page.fill('#b-name0', 'Riya');
  await page.fill('#b-name1', 'Aman');
  await page.click('#b-per [data-per="2"]');
  await page.click('#b-levels [data-level="1"]');
  n0 = await spokenN();
  await page.click('#b-start');
  await waitState('b', 'ask');
  expect(await txt('#b-turn') === t('turn_of', { name: 'Riya' }), 'Riya goes first: ' + await txt('#b-turn'));
  let bw = await heardAfter(n0);
  expect(content.words[0].includes(bw), 'bee word from level 1: ' + bw);
  await page.fill('#b-input', bw); await page.press('#b-input', 'Enter');
  await waitState('b', 'done');
  expect(await txt('#b-board .sc[data-player="0"] .sc-score') === '1', 'Riya scores 1');
  await reload();
  expect(await page.isVisible('#b-stage') && await page.isHidden('#b-setup'), 'the class bee is still on screen after a reload');
  expect(await txt('#b-board .sc[data-player="0"] .sc-score') === '1' && await txt('#b-board .sc[data-player="1"] .sc-score') === '0', 'scores kept: Riya 1, Aman 0');
  await waitState('b', 'ask');
  expect(await txt('#b-turn') === t('turn_of', { name: 'Aman' }), 'then Aman (Riya\'s turn was already scored)');
  await settle();
  await page.click('#b-bad');                                     // spelt aloud, teacher marks wrong
  await waitState('b', 'done');
  expect(await attr('#b-wp', 'data-result') === 'bad' && await page.isHidden('#b-judge'), 'teacher marked Aman wrong');
  await page.click('#b-next');
  await waitState('b', 'ask');
  expect(await txt('#b-turn') === t('turn_of', { name: 'Riya' }), 'turns alternate back to Riya');
  await settle();
  await page.click('#b-ok');                                      // spelt aloud correctly
  await waitState('b', 'done');
  await page.click('#b-next');
  await waitState('b', 'ask');
  await page.fill('#b-input', 'qqq'); await page.press('#b-input', 'Enter');
  await waitState('b', 'done');
  expect(await txt('#b-next-lbl') === t('see_winner'), 'last turn offers "see the winner"');
  await page.click('#b-next');
  await page.waitForSelector('#b-endcard', { state: 'visible' });
  expect(await attr('#b-winner', 'data-winner') === '0' && await txt('#b-winner-title') === t('winner_is', { name: 'Riya' }), 'Riya wins: ' + await txt('#b-winner-title'));
  expect(await page.$$eval('#b-final .final-score', (c) => c.map((x) => x.textContent).join(',')) === '2,0', 'final scores 2 and 0');
  expect(await page.evaluate(() => localStorage.getItem('edu.spelling-bee.beeRun')) === null, 'a finished bee is not restored again');

  /* 10b) Knock-out: no word limit; Aman misses three times and is out, so Riya wins */
  await page.click('#b-settings');
  await page.click('#b-type [data-type="ko"]');
  expect(await page.isHidden('#b-per-field'), 'knock-out hides "words for each player"');
  for (let r = 0; r < 3; r++) {
    n0 = await spokenN();
    await page.click(r === 0 ? '#b-start' : '#b-next');
    await waitState('b', 'ask');
    expect(await txt('#b-turn') === t('turn_of', { name: 'Riya' }), 'knock-out round ' + (r + 1) + ': Riya');
    const kw = await heardAfter(n0);
    await page.fill('#b-input', kw); await page.press('#b-input', 'Enter');
    await waitState('b', 'done');
    await page.click('#b-next');
    await waitState('b', 'ask');
    expect(await txt('#b-turn') === t('turn_of', { name: 'Aman' }), 'then Aman');
    expect((await txt('#b-turn-sub')).startsWith(t('lives_n', { n: String(3 - r) })), 'Aman has ' + (3 - r) + ' lives: ' + await txt('#b-turn-sub'));
    await settle();
    await page.click('#b-bad');
    await waitState('b', 'done');
  }
  expect(await page.$eval('#b-board .sc[data-player="1"]', (e) => e.classList.contains('out')), 'Aman is out after 3 misses');
  expect(await txt('#b-next-lbl') === t('see_winner'), 'only Riya is left, so the game ends (3 words each, beyond any word limit)');
  await page.click('#b-next');
  await page.waitForSelector('#b-endcard', { state: 'visible' });
  expect(await attr('#b-winner', 'data-winner') === '0', 'Riya wins the knock-out');
  expect(await page.$$eval('#b-final .final-score', (c) => c.map((x) => x.textContent).join(',')) === '3,0', 'knock-out scores 3 and 0');

  /* 11) No English voice: meaning + sentence + jumbled letters appear by themselves */
  await page.evaluate(() => sessionStorage.setItem('__sb_novoice', '1'));
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.EDU_READY);
  await page.waitForSelector('#voice-status[data-voice="none"]', { state: 'attached', timeout: 6000 });
  await page.click('#tab-practise');
  expect(await page.isVisible('#nv-card'), 'no-voice help card shown');
  expect(await stat('st_words') === '14', 'progress survived the reload (14 words): ' + await stat('st_words'));
  expect((await page.inputValue('#l-text')).startsWith('giraffe | The giraffe has a long neck. | a tall animal'), 'teacher list survived the reload');
  await page.click('#p-levels [data-level="1"]');
  await page.click('#p-start');
  await waitState('p', 'ask');
  expect(await page.isVisible('#p-nv') && await page.isVisible('#p-jumble') && await page.isVisible('#p-sent-clue'), 'fallback clues visible without any click');
  const meaning = await txt('#p-meaning');
  const fw = content.words[0].find((w) => content.m[w] === meaning);
  expect(!!fw, 'the shown meaning belongs to a level 1 word: ' + meaning);
  const ftiles = await page.$$eval('#p-jumble .jt', (b) => b.map((x) => x.textContent).sort().join(''));
  expect(ftiles === fw.split('').sort().join(''), 'jumbled letters match that word');
  expect(await txt('#p-hint-note') === t('hint_free'), 'jumbled letters are free without a voice');
  await page.fill('#p-input', fw); await page.press('#p-input', 'Enter');
  await waitState('p', 'done');
  expect(await attr('#p-wp', 'data-result') === 'ok', 'word solved from meaning + jumble');
  await settle();
  await page.click('#p-quit');                                    // end the round after one word
  await page.waitForSelector('#p-summary', { state: 'visible' });

  /* 12) A list shared as a link: asks before replacing the saved list; two-word entries get a space tile */
  const link = await page.evaluate(() => EDU.pack({ v: 1, w: [['ice cream', 'We ate ice cream at the fair.', 'a cold sweet food'], ['tiger', '', '']] }));
  await confirmWith(true);
  await page.evaluate((h) => { location.hash = 'list=' + h; }, link);
  await page.waitForSelector('#l-shared', { state: 'visible' });
  expect(await txt('#l-shared-msg') === t('shared_found', { n: '2' }), 'shared list found: ' + await txt('#l-shared-msg'));
  await page.click('#l-shared-use');
  expect((await confirms())[0] === t('confirm_replace_list', { n: '3' }), 'asks before replacing the 3-word list');
  expect((await page.inputValue('#l-text')).startsWith('ice cream | We ate ice cream at the fair.') && await page.evaluate(() => location.hash) === '', 'shared list saved, link hash cleared');
  await page.click('#tab-practise');
  await page.click('#sum-levels');
  await page.click('#p-levels [data-level="custom"]');
  await page.click('#p-start');
  for (let i = 0; i < 2; i++) {
    await waitState('p', 'ask');
    const tl = await page.$$eval('#p-jumble .jt', (b) => b.map((x) => x.textContent));
    if (tl.includes('␣')) {
      for (const ch of ['i', 'c', 'e', '␣']) {
        const idx = await page.$$eval('#p-jumble .jt', (bs, c) => bs.findIndex((b) => !b.disabled && b.textContent === c), ch);
        await page.click(`#p-jumble .jt[data-i="${idx}"]`);
      }
      expect(await page.inputValue('#p-input') === 'ice ', 'tiles typed "ice "');
      expect(await page.$$eval('#p-jumble .jt', (bs) => bs.filter((b) => b.textContent === '␣')[0].disabled), 'the space tile stays used after tapping it');
      await page.fill('#p-input', 'Ice  Cream');
    } else await page.fill('#p-input', 'tiger');
    await page.press('#p-input', 'Enter');
    await waitState('p', 'done');
    expect(await attr('#p-wp', 'data-result') === 'ok', 'shared word ' + (i + 1) + ' spelt right');
    await page.click('#p-next');
  }
  await page.waitForSelector('#p-summary', { state: 'visible' });
  expect(await txt('#sum-score') === t('sum_score', { c: '2', n: '2' }), 'shared list round 2 of 2');

  /* leave a hinted second try on screen for the screenshot */
  await page.click('#sum-levels');
  await page.click('#p-levels [data-level="1"]');
  await page.click('#p-start');
  await waitState('p', 'ask');
  const m2 = await txt('#p-meaning');
  const fw2 = content.words[0].find((w) => content.m[w] === m2);
  await page.click('#p-h-len');
  await page.fill('#p-input', fw2.slice(0, -1) + 'x');
  await page.click('#p-check');
  await waitState('p', 'retry');
  await page.evaluate(() => window.scrollTo(0, 0));
  log('words', w1, w2, w3, w4, 'fallback', fw, fw2);
};
