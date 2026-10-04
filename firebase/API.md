# EDUCloud: how to use it in an app

`window.EDUCloud` (shared/cloud.js) is the only code that talks to Firebase. Apps never load Firebase
themselves. The spec is in [LIVE_SPEC.md](../LIVE_SPEC.md); the security rules are in [firestore.rules](firestore.rules).

## 1. Load it

```html
<script src="../../shared/edu.js"></script>
<script src="strings.js"></script>
<script src="../../shared/firebase-config.js"></script>   <!-- window.EDU_FIREBASE (null = Demo mode) -->
<script src="../../shared/cloud-mock.js"></script>        <!-- Demo mode + shared helpers (load it before cloud.js) -->
<script src="../../shared/cloud.js"></script>             <!-- window.EDUCloud -->
<script src="app.js"></script>
```

Loading the page loads nothing from the network. `EDUCloud.ready()` loads the pinned Firebase compat SDK
(12.19.0) from jsDelivr the first time something needs it. Add `"internet"` to `meta.needs`.

## 2. Two modes

| `EDUCloud.mode` | When | What happens |
|---|---|---|
| `'firebase'` | `EDU_FIREBASE` is set, the page is http(s), and the URL has no `?mock=1` | real Google sign-in, Firestore in Mumbai |
| `'mock'` (Demo mode) | everything else, including `file://` and `?mock=1` | no network; data stays in this browser; tabs of this browser see each other live |

In Demo mode (`EDUCloud.isDemo === true`), show a small banner such as "Demo mode: works on this one device
only; online live quiz is coming soon". `signInTeacher()` signs in a fake `{uid:'demo-teacher', name:'Demo Teacher', demo:true}`
(show a translated label instead of the English name). Each student **tab** is a separate player, so a teacher can try
the whole flow with one host tab and two student tabs. `EDUCloud.demoUrl()` gives the current URL with `?mock=1`,
for a "Use Demo mode instead" link.

## 3. Errors

Every async function returns a Promise. Failures reject with an `Error` whose `.code` is one of
`EDUCloud.ERRORS`:

| code | when | suggested message |
|---|---|---|
| `not-configured` | Firebase project not set up correctly (domain not authorised, provider off) | "Online quiz is not set up yet. Try Demo mode." |
| `offline` | no internet / SDK could not load / no reply in 20 s | "No internet. Check the connection and try again." |
| `quota-exceeded` | today's free Firebase limit is used up | "Today's free limit is used up. Please try again tomorrow, or use Demo mode." |
| `not-found` | wrong session code, quiz id | "No quiz with this code." |
| `permission-denied` | not signed in, not your session, removed by the teacher, question closed, answer already given | context-specific |
| `session-locked` | joining a locked session | "The teacher has locked this quiz." |
| `session-ended` | joining / answering after the end | "This quiz has ended." |
| `name-taken` | nickname used by someone else in this session (any letter case) | "Someone already uses this nickname." |
| `invalid-input` | bad quiz, nickname not 1–20 characters, bad choice | "Please check what you typed." |
| `unknown` | anything else | "Something went wrong. Please try again." |

If the user closes the Google sign-in window, the error has `code: 'unknown'` and `err.cancelled === true`.
Show nothing in that case. `err.message` is English and only for the console; show translated text from `strings.js`.

```js
function cloudMsg(err) {
  if (err && err.cancelled) return null;
  return EDU.t('err_' + String(err && err.code || 'unknown').replace(/-/g, '_'));   // keys err_offline, err_quota_exceeded, …
}
```

## 4. Teacher

```js
EDUCloud.ready().catch(showError);                 // start loading early, so the sign-in popup opens in the click
const offTeacher = EDUCloud.onTeacher(t => render(t)); // t = {uid, name, email, photo} | null; called now and on change

signInBtn.onclick = () => EDUCloud.signInTeacher().then(t => { /* t, or null when it switched to a full-page redirect */ }, showError);
signOutBtn.onclick = () => EDUCloud.signOut();
deleteBtn.onclick = () => EDUCloud.deleteTeacherAccount();   // call it straight from the click: it may need a re-login popup

const list = await EDUCloud.listQuizzes();          // [{id, title, count, updatedAt}] newest first
const quiz = await EDUCloud.getQuiz(list[0].id);    // {id, title, questions, lang, createdAt, updatedAt}
const id   = await EDUCloud.saveQuiz({ title, lang: EDU.lang, questions: [
  { q: 'Which planet is closest to the Sun?', options: ['Venus', 'Mercury', 'Mars'], correct: 1, explain: 'Optional', time: 20 }
]});                                                 // add id: to update an existing cloud quiz
await EDUCloud.deleteQuiz(id);
```

Quiz rules (same in both modes, `EDUCloud.LIMITS`): title 1–150 characters; 1–200 questions; question text up to 1000;
2–6 options, each up to 300; `correct` is an option index; `explain` up to 600; `time` is 5–600 s (it is clamped). Quiz Maker's
field names `text` and `answer` are accepted too. Quiz Maker's true/false questions have no `options`, so convert them
to two translated options first.

Sign-in opens a Google popup on every device. If the browser blocks it, or cannot open popups (some in-app
browsers), the page switches to a full-page redirect and comes back signed in. Call `signInTeacher()` directly in
the click handler, after `ready()` has finished, so the popup is allowed.

## 5. Host a live session (projector)

```js
const { code } = await EDUCloud.createSession(quiz, { timePerQ: 20, shuffle: false, shuffleOptions: false });
// join URL for the QR: 'https://apnipathshala.ai/join/?code=' + code

const stop = EDUCloud.hostWatch(code, state => render(state), err => showError(err));
// state = {
//   code,
//   session: {code, owner, title, lang, state:'lobby'|'question'|'reveal'|'ended', current, questionStartedAt, starts,
//             timePerQ, locked, createdAt, expireAt, questions:[{q, options, time}], reveal:{index, correct, explain}|null,
//             playerCount, kicked:[uid]},
//   players: [{id, name, score, joinedAt, last?, lastQ?, rank?}]   (in join order),
//   answers: {[i]: {[playerId]: {choice, ms, at}}},                (ms = time taken, from that question's start)
//   key:     {correct:[…], explain:[…]}                             (only the owner gets this)
// }
// session === null means the session was deleted.

await EDUCloud.lockSession(code, true);              // no new joins
await EDUCloud.kickPlayer(code, playerId);           // removes them; they cannot join this session again
await EDUCloud.startQuestion(code, 0);               // state 'question', current 0, questionStartedAt = server time

// countdown: always use EDUCloud.now() (school clocks are often wrong; questionStartedAt is server time)
const left = q.time - (EDUCloud.now() - state.session.questionStartedAt) / 1000;

const reveal = await EDUCloud.revealQuestion(code, 0);      // {index, correct, explain}; students now see it
const updates = EDUCloud.computeScores(latestState, 0);     // only players whose numbers change (no double counting)
await EDUCloud.writeScores(code, updates);                  // values: total score, or {score, last, lastQ, rank}
const board = EDUCloud.rankPlayers(latestState.players);    // sorted, with rank (equal scores share a rank)

// at the end: give everyone a rank so phones can show "You came 3rd"
const ranks = {}; board.forEach(p => { ranks[p.id] = { rank: p.rank }; });
await EDUCloud.writeScores(code, ranks);
await EDUCloud.endSession(code);
stop();

const sessions = await EDUCloud.listSessions();      // [{code, title, createdAt, players, state}] newest first
const removed = await EDUCloud.purgeExpired();       // deletes this teacher's sessions older than 30 days → count
const res = await EDUCloud.sessionResults(code);     // same shape as a hostWatch state (for CSV export)
await EDUCloud.deleteSession(code);                  // also deletes players, answers, nicknames, answer key
```

Scoring (`EDUCloud.points(isCorrect, ms, timeSec)`): correct gives `500 + round(500 × max(0, 1 − ms / (time × 1000)))`
points, wrong gives 0. `computeScores` uses it. `last` is the points from question `lastQ`, which students use for "+850".

## 6. Student (phone)

```js
try {
  const me = await EDUCloud.joinSession(codeInput.value, nickInput.value);   // {playerId, name, rejoined?}
} catch (e) { /* not-found, invalid-input, name-taken, session-locked, session-ended, permission-denied (removed) */ }

const stop = EDUCloud.playerWatch(code, st => render(st), err => showError(err));
// st = { code,
//        session: {code, title, lang, state, current, questionStartedAt, timePerQ, locked, createdAt, expireAt,
//                  questions:[{q, options, time}], reveal, playerCount} | null,     (no owner, no answers)
//        me: {id, name, score, joinedAt, last?, lastQ?, rank?} | null,            (null = left or removed)
//        myAnswers: {[i]: choice},
//        kicked: true|false }

await EDUCloud.submitAnswer(code, st.session.current, choiceIndex);   // once per question
await EDUCloud.leaveSession(code);   // during a quiz: leave (answers stay). After the end: "Remove me" (answers deleted too)
```

- After a reveal: correct = `st.myAnswers[i] === st.session.reveal.correct`. Points = `st.me.last` once
  `st.me.lastQ === i` (the host writes scores a moment after the reveal).
- **Reconnect**: save `{code, nickname}` with `EDU.store`. On reload, call `joinSession` again. The same device is the
  same player (`rejoined: true`, original nickname kept), even in a locked or ended session, and `myAnswers` comes back.
  Do not auto-rejoin when `kicked` is true.
- Submitting the same answer again (for example after a timeout) succeeds. A different answer for the same
  question is rejected with `permission-denied`.
- `EDUCloud.normalizeName(str)` returns the cleaned nickname, or `null` if it is not allowed. Use it to validate before calling.
  It removes control characters and invisible or text-reordering ones (zero-width space, bidi overrides…) and turns every
  kind of space into one plain space. Nicknames that only differ by letter case, invisible joiners (ZWJ/ZWNJ) or emoji
  variation selectors count as the same nickname (`name-taken`), so nobody can look exactly like another student.
- **Ended sessions are private.** A session is open to anyone with the code only while it is live (not ended, less than
  1 day old). After that only its owner and its own players can read it. For anyone else `playerWatch` reports
  `session.state === 'ended'` with an empty title and no questions (a removed student keeps what they saw, marked ended),
  and `joinSession` rejects with `session-ended`. Players still see the full session and their rank after the end.
- Firebase mode: the student's anonymous id is stored on the device and is separate from any teacher sign-in on the same
  browser. All tabs of one browser are the same player. Demo mode: each tab is a different player.

## 7. Keeping data for 30 days only

The free plan may not allow Google's automatic deletion (TTL), so the app deletes old data itself (LIVE_SPEC
"Retention on the FREE plan"):
- A signed-in teacher's sessions older than 30 days are deleted automatically, a few seconds after any page with
  cloud.js opens (at most once per 12 hours per device, because it reads all their sessions). `listSessions()` also
  leaves them out and deletes them every time, and `purgeExpired()` does it on demand.
  Nothing is deleted until the server's clock is known, so a computer with a wrong date never deletes fresh sessions.
- On the final screen, offer students **"Remove me"** = `leaveSession(code)`. After the end, it deletes their player,
  nickname and answers.
- Results stay viewable and exportable for 30 days. Tell teachers to download the CSV to keep them.

## 8. Cost (free Spark plan: 50k reads, 20k writes, 20k deletes per day)

Measured with `node firebase/tests/firebase_mode.sim.js` (reads include the documents that the security rules look up).
A class of **40 students × 10 questions** costs about **3,300 reads, 720 writes and 480 deletes** from sign-in to deleting the
session. That is **about 15 classes per day** on the free plan, and reads run out first. A class of 20 × 10 is about half of that.
Details per phase and other sizes: [SECURITY_REVIEW.md](SECURITY_REVIEW.md) §5.

- A student listens to 2 documents: the session and their own player document. The host listens to players and answers.
  Nobody polls.
- Join ≈ 7 reads and 2 writes per student, when the page checked the code with `playerWatch()` first: `joinSession` then
  reads nothing before writing. Each answer is 1 write plus 2 reads in the rules. Every start and reveal sends the session
  document to every phone (1 read each). Each score change is 1 write and 2 reads.
- Deleting a session reads and deletes every player, nickname and answer (≈ 12 per student).
- `listQuizzes` / `listSessions` read every quiz / session of the teacher. Call them when the list is opened, not in a loop.
  The automatic 30-day clean-up runs at most once per 12 hours per device.
- Unsubscribe watchers (`stop()`) when leaving a screen.

## 9. Helpers (same in both modes)

`EDUCloud.now()` (estimated server time, ms) · `ERRORS` · `LIMITS` · `normalizeName(s)` · `normalizeCode(s)`
("123 456" → "123456", else null) · `points()` · `computeScores(state, i)` · `rankPlayers(players)` · `demoUrl()` ·
`redirectError()` (error from a finished sign-in redirect, or null) · `purgeExpired()` · `isDemo` · `sdkVersion`.

## 10. "Stay updated" list (registerInterest)

The form in `shared/signup.js` (home, schools.html, business.html) is the only caller. Apps do not use it.

```js
await EDUCloud.registerInterest({
  email: 'asha@example.com',            // required; trimmed + lower-cased; EDUCloud.validEmail(s) → clean email | null
  name: '', org: '', place: '',         // optional; cut to 60 / 80 / 60 characters
  role: 'teacher',                      // EDUCloud.INTEREST.roles: teacher principal student parent org other
  prefLang: 'hi',                       // language for our emails (one of the 12)
  topics: ['apps', 'videos'],           // 1–3 of EDUCloud.INTEREST.topics: apps videos training
  consent: true,                        // must be exactly true (18+, agrees to occasional emails)
  lang: EDU.lang, page: 'home'          // UI language; page = home | schools | business
});   // → {id} (Firebase) or {id, demo:true} (Demo mode). Errors: invalid-input, offline, quota-exceeded,
      //   permission-denied (rules not published yet), not-configured, unknown.
```

- **Firebase mode:** a third app instance (`'edu-interest'`, never the teacher or quiz-player identity) signs in as a
  **new** anonymous account for every sign-up, then makes ONE write: `set()` on `interest/{that uid}` = exactly the
  fields above + `createdAt` (server time) + `uid`. Afterwards (saved or not) that account is signed out, so nothing
  stays on the device and the next sign-up on the same browser (a shared school computer) gets a new id. Calls run one
  after another. No reads. `firestore.rules` allows **create only**, with this exact shape, at your own uid, once per
  account: writing it again is an update, which is denied. Nobody can read, list, change or delete sign-ups from a
  browser. The owner works with them in the Firebase console (`firebase/SETUP.md` §4c).
- **Demo mode:** saved in this browser under `edu.cloudmock.interest/anon-…` (a new id per sign-up, the same as the
  record's `uid`) with `demo: true`; nothing is sent.
- The honeypot field, consent box, validation and translated messages live in `signup.js`, not here.
- Cost: 1 write per sign-up (+1 free anonymous Auth account per sign-up). No reads.
- Until the owner publishes the rules with `match /interest/{id}` (SETUP.md §4b), Firebase mode rejects with
  `permission-denied` and the form shows "please email us instead".

## 11. Testing

- `node tools/tests/_cloud_mock.e2e.js` runs the whole Demo-mode flow (host + 2 students in one browser, rule checks,
  reload, file://) and must print PASS.
- In an app's `tools/tests/<slug>.test.js`, verify.js runs in Demo mode automatically (`EDU_FIREBASE` is null). Use a second
  `page.context().newPage()` as a student tab.
- Firestore rules: see [SETUP.md](SETUP.md) § "Optional: test the rules" (needs Java for the emulator).
- `node firebase/tests/firebase_mode.sim.js` runs the real cloud.js in **Firebase mode** against a fake SDK and an in-memory
  Firestore with a model of the rules (no Java, no internet, ~10 s): one teacher, 40 students, 10 questions, lock, kick, nickname
  rules, ended sessions, reload, "Remove me", deletes. It prints the reads / writes / deletes / downloads of each phase.
- `node tools/tests/_signup.check.js` checks the sign-up form (Demo mode, 12 languages, validation, honeypot, errors).
- Firebase emulators from a local page: `http://localhost:…/apps/live-quiz/?emulator=1` (or `emulator: true` in the config)
  connects to Auth on 127.0.0.1:9099 and Firestore on 127.0.0.1:8080.
