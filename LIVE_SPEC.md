# Teacher accounts + Live Class Quiz: spec (v1)

Goal: keep every student app free and sign-in-free. Add an **optional teacher account** (Google sign-in)
and a **Live Class Quiz**: the teacher hosts on a projector, and students join from phones with a 6-digit
code and a nickname. No student accounts and no student personal data. It runs on the Firebase free
"Spark" plan, which cannot charge money; when a daily quota runs out we show a friendly message.

## Files (new; do not edit shared/edu.js or shared/edu.css, which other agents own)
```
shared/firebase-config.js   window.EDU_FIREBASE = null  (owner pastes the web config later; it is public, not secret)
shared/cloud.js             window.EDUCloud: the ONLY place that talks to Firebase (loads the compat SDK from jsDelivr on demand)
shared/cloud-mock.js        same API, no network: localStorage + BroadcastChannel (works across tabs of one browser)
apps/live-quiz/             TEACHER app: sign in, cloud quizzes, host a live session (projector), results, account
apps/quiz-join/             STUDENT app: enter code + nickname, answer on phone (no sign-in visible)
join/index.html             short URL https://apnipathshala.ai/join/?code=123456 → redirects to apps/quiz-join/ keeping query
teacher/index.html          short URL → redirects to apps/live-quiz/
legal/privacy.html, legal/terms.html   privacy policy + terms (12 languages, DPDP-aware), linked from both apps
firebase/firestore.rules, firebase/firestore.indexes.json, firebase/firebase.json
firebase/tests/rules.test.js   @firebase/rules-unit-testing against the emulator (run when Java is available)
firebase/SETUP.md           owner's click-by-click Firebase console steps
```
Script order in apps: `../../shared/edu.js` → `strings.js` → `../../shared/firebase-config.js` → `../../shared/cloud-mock.js` →
`../../shared/cloud.js` → `app.js`. (verify.js checks only edu.js → strings.js → app.js order.)

## Modes
- `EDUCloud.mode`: `'firebase'` when `window.EDU_FIREBASE` is set, the page is http(s), and `?mock=1` is absent.
  Otherwise it is `'mock'`.
- Mock mode is a real feature, called **Demo mode**. It shows a small banner ("Demo mode: works on this one
  device only; online live quiz is coming soon"). It lets verify.js and teachers try the whole flow with
  two tabs. In mock mode `signInTeacher()` signs in a fake "Demo Teacher".

## EDUCloud API (async functions return Promises; errors reject with `Error` whose `.code` is one of:
`not-configured offline quota-exceeded not-found permission-denied session-locked session-ended name-taken invalid-input unknown`)
```
EDUCloud.mode                       'firebase' | 'mock'
EDUCloud.ready()                    → Promise<void> (loads SDK, inits app/auth/firestore; idempotent)
EDUCloud.onTeacher(cb)              cb(teacher|null) now and on change; teacher = {uid, name, email, photo}
EDUCloud.signInTeacher()            Google popup (redirect fallback on mobile/popup-blocked) → teacher
EDUCloud.signOut()
EDUCloud.deleteTeacherAccount()     deletes teachers/{uid}, all their quizzes + sessions (+subcollections), then the auth user
EDUCloud.listQuizzes()              → [{id, title, count, updatedAt}]   (teacher only)
EDUCloud.getQuiz(id)                → quiz
EDUCloud.saveQuiz(quiz)             → id      quiz = {id?, title, questions:[{q, options:[2..6 strings], correct:int, explain?, time?:sec}], lang}
EDUCloud.deleteQuiz(id)
EDUCloud.createSession(quiz, {timePerQ=20, shuffle=false}) → {code}   (6 digits, unique; state 'lobby')
EDUCloud.hostWatch(code, cb)        cb({session, players:[{id, name, score, joinedAt}], answers:{[qIndex]: {[playerId]: {choice, ms}}}}) → unsubscribe()
EDUCloud.startQuestion(code, i)     state 'question', current=i, questionStartedAt=serverTime
EDUCloud.revealQuestion(code, i)    state 'reveal', reveal={index:i, correct}, then host computes + writes scores
EDUCloud.writeScores(code, {[playerId]: score})
EDUCloud.lockSession(code, bool)    no new joins when locked
EDUCloud.kickPlayer(code, playerId)
EDUCloud.endSession(code)           state 'ended'
EDUCloud.listSessions()             teacher's past sessions → [{code, title, createdAt, players, state}]
EDUCloud.sessionResults(code)       → {session, players, answers} (for CSV export)
EDUCloud.deleteSession(code)
EDUCloud.joinSession(code, nickname) → {playerId}  (student; anonymous auth under the hood; nickname 1–20 chars, unique per session)
EDUCloud.playerWatch(code, cb)      cb({session (public fields only), me:{id,name,score}, myAnswers:{[i]:choice}}) → unsubscribe()
EDUCloud.submitAnswer(code, i, choice) (once per question; only while state 'question' and current===i)
EDUCloud.leaveSession(code)
```

## Firestore data model (region asia-south1)
```
teachers/{uid}                         {name, createdAt, plan:'free'}                         owner only
quizzes/{quizId}                       {owner, title, questions[], lang, createdAt, updatedAt} owner only
sessions/{code}                        PUBLIC to signed-in users (anonymous or teacher) while LIVE (not ended, < 1 day old);
                                       after that only the owner and the session's own players (security review):
    {owner, title, lang, state:'lobby'|'question'|'reveal'|'ended', current:int, questionStartedAt,
     timePerQ, locked:bool, createdAt, expireAt (createdAt + 30 days, used by a TTL policy),
     questions:[{q, options[], time}]   ← NO correct answers here
     reveal:{index, correct} | null, playerCount}
sessions/{code}/private/key            {correct:[int...], explain:[str...]}   owner only
sessions/{code}/players/{uid}          {name, score, joinedAt}  create: self only (uid == auth.uid), name validated, session not locked/ended;
                                       update: owner may set score; player may not change score; delete: owner or self
sessions/{code}/answers/{uid}_{i}      {uid, i, choice, at: serverTimestamp}  create only once by the player, only when session.state=='question'
                                       && session.current==i && players/{uid} exists; readable by owner + that player; no update/delete by player
```
Scoring (host computes): correct → `500 + round(500 * max(0, 1 - ms / (time*1000)))`, wrong → 0, where `ms = at - questionStartedAt`.

## Free-tier budget (Spark: 50k reads, 20k writes, 20k deletes per day)
One session with 40 students and 10 questions costs about **3,300 reads, 720 writes and 480 deletes** over its whole life
(join, play, end, delete), as measured by `firebase/tests/firebase_mode.sim.js`. That allows about **15 sessions a day**
for free, and reads run out first. (The first estimate here, 1,000 reads and 470 writes or about 40 sessions a day, left
out the security-rule look-ups, the session pushes to every phone and the score updates. See
firebase/SECURITY_REVIEW.md §5 for each phase and other class sizes.) Listeners must be minimal: a student listens to
1 doc (the session) plus their own player doc. The host listens to players + answers. Don't poll. If the quota runs
out, show `quota-exceeded`: "Today's free limit is used up. Please try again tomorrow, or use Demo mode."

## Privacy (DPDP Act 2023)
- Students: no accounts, no email, no phone, no photo. They give a nickname only; the UI says "Use a
  nickname, not your full name". They get an anonymous uid. Answers and nicknames are deleted after 30 days
  (TTL) or when the teacher deletes the session.
- Teachers (adults): Google name and email (email is only in Firebase Auth, not stored in Firestore), plus
  their quizzes and sessions. "Delete my account and data" is one button. Data stays in Google Firebase,
  region asia-south1 (Mumbai).
- No analytics, no ads, no tracking. Firebase Analytics is NOT enabled.
- legal/privacy.html states all of this plain-language in 12 languages, with a grievance contact (CONTACT_EMAIL
  constant, rendered by JS) and the effective date.

### Retention on the FREE plan (amendment 2026-10-04)
Firestore TTL policies may need billing, so do NOT rely on TTL on Spark. Keep the `expireAt` fields for later,
but implement app-side deletion:
1. Every time a teacher opens the teacher app (signed in), it deletes that teacher's sessions where
   `createdAt` is older than 30 days, including the `players`, `answers` and `private` subcollections.
2. Session results stay viewable and exportable for 30 days. The UI says "Results are deleted after 30 days.
   Download the CSV to keep them."
3. Students can delete their own player doc and answers through a "Remove me" link on the final screen.
4. Residual risk: if a teacher never returns, their sessions persist. legal/privacy.html must say so honestly
   ("deleted when the teacher next opens the app after 30 days, or on request"). If the owner later moves to
   Blaze, enable TTL and update the policy.
Students give a nickname only, never a roll number or a real name.
GitHub Pages terms forbid running a commercial SaaS. The free live quiz is fine there. If paid teacher plans
are introduced later, the teacher app moves to Cloudflare Pages (that's planned, so nothing to do now).

## UI musts
- Host (projector): giant join code + QR (qrcode-generator@1.4.4 from jsDelivr) pointing to
  https://apnipathshala.ai/join/?code=XXXXXX; live player list; question with countdown ring; live answer count;
  reveal with option bar chart and the correct answer; leaderboard (top 5) after each question; final podium;
  export CSV; next/skip/end controls; keyboard (Space = next).
- Student (phone): 4–6 big coloured answer buttons with shapes (▲ ◆ ● ■ ★ ⬟) plus the option text, a waiting
  screen between questions, "correct/wrong + points" feedback, final rank. It reconnects on reload (same
  anonymous uid, so the same player).
- All 12 languages through strings.js. Quiz content is whatever the teacher wrote, so it is not translated.
- It works with Quiz Maker: in the teacher app, import quizzes saved by Quiz Maker on the same device
  (localStorage via `EDU.store('quiz-maker')`; read apps/quiz-maker/app.js to find the key/shape, read-only)
  and from Quiz Maker's JSON/CSV export.

## Foundation as built (2026-10-04): additions and deviations
shared/cloud.js, shared/cloud-mock.js, shared/firebase-config.js and firebase/* are done. The usage guide for app
authors is **firebase/API.md**. The Demo-mode e2e test is `node tools/tests/_cloud_mock.e2e.js` and must PASS.
Everything above still holds, with these changes:

**Deviations**
1. **Sign-in uses a popup on every device, mobile included.** It falls back to a full-page redirect only when the
   popup is blocked or impossible (some in-app browsers), or when `signInTeacher({redirect:true})` is called.
   Reason: the redirect flow breaks on current Chrome and Safari, which partition third-party storage, when the
   authDomain (`*.firebaseapp.com`) differs from the site (`apnipathshala.ai`). Popups work on phones.
   `signInTeacher()` resolves `null` when it switched to a redirect.
2. **Unique nicknames are enforced by the rules** through a new subcollection
   `sessions/{code}/names/{nameKey(nickname)}` = `{uid, expireAt}` (lower case, without invisible joiners: see Security review). It is created in the same batch as the
   player doc, so a taken name cannot be created again. It is deleted when the player leaves or is removed.
3. **Removed players cannot rejoin**: `kickPlayer` adds the uid to `session.kicked:[uid]`, and the rules refuse joins
   from it. `joinSession` then rejects with `permission-denied`, and `playerWatch` gives `kicked: true`.
4. Players docs are readable only by **the player and the session owner**. Students never read other players.
   Leaderboards are shown on the projector, and the final rank reaches a phone via `rank` in its own player doc.
5. A cancelled Google popup rejects with `code: 'unknown'` plus `err.cancelled === true`. No new error code was
   added, so existing message tables keep working. Apps show nothing for it.
6. **Retention amendment**: students may delete their own answers only after the session has ended (or is gone).
   During a quiz they cannot, so nobody can take an answer back and answer again. `leaveSession()` after the
   end = "Remove me" (player + nickname + answers). Teachers' sessions older than 30 days are deleted by
   `purgeExpired()`, which also runs once per page load for a signed-in teacher and inside `listSessions()`. It
   uses the server clock only, so a PC with a wrong date never deletes fresh sessions.

**Additions** (backward compatible)
- Session doc: `starts:{[i]: serverTime}` gives each question's start, so `ms` stays right for earlier questions;
  `kicked:[uid]`; `quizId`. `reveal` = `{index, correct, explain}`. `private/key` also stores `owner`, `expireAt`.
- Player doc: optional `last` (points of question `lastQ`), `lastQ`, `rank`; `expireAt`. Answer doc: `expireAt`.
  `expireAt` is about now + 30 days in server time; the rules accept 25–35 days.
- `writeScores(code, {[id]: number | {score?, last?, lastQ?, rank?}})`. Players who left meanwhile are skipped.
- `hostWatch(code, cb, onError?)` state also has `code` and `key:{correct[], explain[]}` (owner only); answers are
  `{choice, ms, at}`. `playerWatch(code, cb, onError?)` state also has `code` and `kicked`; `me` may have
  `last/lastQ/rank`. `session:null` = deleted. `sessionResults` has the same shape as a hostWatch state.
- `joinSession` → `{playerId, name, rejoined?}`. Calling it again on the same device returns the same player, even
  when the session is locked or ended. In Firebase mode the anonymous student id lives in a separate Firebase app
  ('edu-student'), so a teacher and a student in one browser never mix; all tabs of a browser are one player.
  In Demo mode each tab is a new player.
- `submitAnswer` with the same choice again resolves (safe retry). A different choice → `permission-denied`.
- `createSession(quiz, {timePerQ, shuffle, shuffleOptions})`. `saveQuiz` also accepts Quiz Maker field names
  (`text`, `answer`). Limits are in `EDUCloud.LIMITS`.
- Helpers: `EDUCloud.now()` (estimated **server** time, from the page's Date header and our own writes; use it for
  countdowns), `isDemo`, `ERRORS`, `LIMITS`, `normalizeName`, `normalizeCode`, `points`, `computeScores(state, i)`
  (no double counting), `rankPlayers`, `demoUrl()` (adds `?mock=1`), `redirectError()`, `purgeExpired()`.
- Demo teacher = `{uid:'demo-teacher', name:'Demo Teacher', email:'', photo:'', demo:true}`. Show a translated label.
- `?emulator=1` on localhost connects to the Firebase emulators (Auth 9099, Firestore 8080).

## Integration check (2026-10-04)
`node tools/tests/_live_e2e.js` drives both real apps together and must PASS (about 1.5 minutes; `--no-fb` skips the
part that needs the internet, `--shots=<dir>` saves screenshots). Demo mode, one browser: a teacher tab hosts the sample
quiz and three phone tabs (hi / ta / ur) play all 5 questions, with lock, kick, unique nicknames, reloads, scores against
the formula above, leaderboard, podium, final ranks on the phones, CSV and "Remove me". Firebase mode with a fake config:
the SDK loads from jsDelivr and every failure is a translated message. No API changes came out of it. The button
labels "Delete my account and data" and "Remove me" now match the words quoted in legal/privacy-strings.js; keep them in
step when either side changes.

## Security review (2026-10-04): deviations
Full report: **firebase/SECURITY_REVIEW.md**. The EDUCloud API did not change; these are rule and behaviour changes,
the same in Demo mode:
1. **Nicknames**: besides 1–20 characters, the rules now refuse control characters, `/`, double spaces, every kind of
   Unicode space other than a plain space, and invisible or text-reordering characters (soft hyphen, ZWSP, LRM/RLM,
   bidi overrides and isolates, word joiner, BOM, fillers). `normalizeName()` removes or replaces them before a join.
   The `names/` id is `nameKey(nickname)`: lower case **without ZWJ/ZWNJ and variation selectors**, so look-alikes such
   as "Asha" + ZWJ count as taken. Indian-script conjuncts and emoji still work.
2. **Sessions are public only while live** (not ended and less than 1 day old). After that, only the owner and the
   session's own players can read them (`exists(players/uid)`, one rule read). Only live sessions accept joins. For anyone
   else, `playerWatch` shows the session as `state: 'ended'` with an empty title and questions (a removed student keeps
   what they saw), and `joinSession` gives `session-ended`.
3. **`names/{key}` can be read only when it is free (reads as missing) or your own**, so nobody learns another student's
   anonymous uid. `joinSession` no longer reads the nickname, session and player before writing (it uses the page's
   `playerWatch` data). When the join is refused, it reads them to give the right error: a refused nickname read = `name-taken`.
4. **Leaving releases the nickname**: a student may delete their player doc only together with their `names/` reservation
   (and the other way round), so nobody can collect nicknames by leaving and rejoining.
5. Automatic 30-day clean-up: at most once per 12 hours per device (`listSessions()` still does it on every dashboard open).
   Batches the rules refuse are retried in batches of 10 (rules allow 20 document look-ups per batch).
6. New: `node firebase/tests/firebase_mode.sim.js` runs the real cloud.js in Firebase mode against a fake SDK, a rules model
   and billing counters (no Java, no internet). `firebase/tests/rules.test.js` has a test for every fix; run it with the
   emulator (`cd firebase && npm run test:emulator`, needs Java 11+) before the online quiz goes live.
