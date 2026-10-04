# Live Class Quiz: security, privacy and cost review

Date: 4 October 2026. Scope: `firebase/firestore.rules`, `shared/cloud.js`, `shared/cloud-mock.js`, `apps/live-quiz`,
`apps/quiz-join`, `legal/`. Spec: `LIVE_SPEC.md`.

The attackers considered:
- **A student** with a phone or laptop, browser devtools and scripts. They get an anonymous Firebase account in one click,
  and as many more as Firebase allows (about 100 new accounts per hour per IP address by default).
- **A curious teacher**: anyone with a Google account can sign in as a "teacher".
- **A code guesser**: someone who tries 6-digit codes to find other classes.

## 1. Summary

The core guarantees were already in place, and they still hold:
- Students cannot read the answer key, other students' answers or other players.
- Only the session owner can change scores.
- Teachers are isolated from each other.
- Nobody can list all session codes.

The review found and fixed **four holes** in the rules (two medium, two low), corrected the **cost estimate**, which was
about 3× too optimistic, removed some waste, and made deletion robust against a rules limit. Section 6 lists the
residual risks and what would reduce them.

| # | Finding | Severity | Status |
|---|---|---|---|
| F1 | Nicknames could contain invisible and text-reversing characters, so a student could look exactly like another one on the projector, or show reversed or blank names | Medium | Fixed (rules + client) |
| F2 | Ended sessions stayed readable for 30 days by anyone who guessed the code (title, questions, the teacher's uid, timestamps); a forgotten session stayed joinable for 30 days | Medium | Fixed (rules) |
| F3 | Anyone could read any nickname reservation `names/{nick}`, which showed whether a nickname was in a class and that student's anonymous uid | Low | Fixed (rules) |
| F4 | Nickname squatting: leave, keep the reservation, rejoin with another nickname, repeat | Low | Fixed (rules) |
| F5 | The cost estimate (≈1,000 reads and ≈470 writes per 40×10 class, ≈40 classes per day) was wrong. It is really ≈3,300 reads and ≈720 writes, or ≈15 classes per day. Some reads were wasted. | Medium (cost) | Measured, docs corrected, waste removed |
| F6 | Big delete batches could hit the rules' 20-look-ups-per-batch limit, depending on how Firestore counts repeated look-ups | Low (retention) | Fallback added |

## 2. How it was checked

- Every rule and every Firestore call in `cloud.js` was read line by line against LIVE_SPEC.md, together with all the
  places where the apps show student-written text.
- **`firebase/tests/rules.test.js`** (Firestore emulator) has a test for every fix (`ATTACK (fixed)`), next to the
  existing attack tests. **It had not been run at the time of this review** (no Java). It has been run since, with the
  updates-list tests: 122/122 pass (§7b). Run `cd firebase && npm run test:emulator` after every rules change.
- **`firebase/tests/firebase_mode.sim.js`** (new) runs the real `cloud.js` in Firebase mode against a fake Firebase SDK and
  an in-memory Firestore. That Firestore enforces a JavaScript port of the rules and counts what Firestore bills. The port
  takes the nickname character lists from `firestore.rules`, so the two cannot drift apart. It plays one teacher and 40
  students through 10 questions. Along the way it checks:
  - lock, kick, taken and look-alike nicknames;
  - that ended sessions are hidden from strangers;
  - reload, "Remove me", deleting the session and deleting the account, with nothing left behind.

  It prints the reads, writes, deletes and downloaded bytes of each phase. It needs no Java and no internet and takes
  about 10 seconds: `node firebase/tests/firebase_mode.sim.js` (options: `--students=N --questions=N --long --strict --verbose`).
  It is a model of the rules, not the rules themselves.
- Demo mode and the apps still pass: `node tools/verify.js live-quiz`, `node tools/verify.js quiz-join`,
  `node tools/tests/_cloud_mock.e2e.js` and `node tools/tests/_live_e2e.js`.

## 3. Threat checklist

| Question | Answer | Why |
|---|---|---|
| Can a student change any score (their own included)? | No | `players` update: session owner only, and only `score/last/lastQ/rank`. A join must start at `score == 0`. Scores are computed by the host from server timestamps. |
| Can a student fake a fast answer? | No | `answers.at == request.time` (server time). `ms` = `at` − `starts[i]` (server time). |
| Can a student read `sessions/*/private/key`? | No | `get` is for the owner only. Students are anonymous, so `isTeacher()` is false. There is no `list` rule, and no collection-group rule. |
| Can a student see correct answers before the reveal? | No | The public `questions` array has no `correct`. `reveal` is written in the same update that sets `state: 'reveal'`. Answers need `state == 'question'`, so nobody can answer after it is visible. `startQuestion` clears `reveal`. `quizzes/{quizId}` (named in the session) is owner-only. Other students' answers and player docs can't be read. |
| Can a student answer after the reveal, or answer twice, or change an answer? | No | Create needs `state == 'question'` and `current == i`. The doc id is `<uid>_<i>`, so a second create is an update, which is denied. A student may delete their answers only after the end. |
| Can a student answer for another uid, or join as another uid? | No | `uid == request.auth.uid` and `answerId == uid + '_' + i`. Player doc id = `request.auth.uid`. |
| Can a student flood nicknames (length / characters)? | Length: no. Characters: **yes before F1**, no now. One player per uid per session; nicknames unique per session (F1 also stops look-alikes). | |
| Can a student join a locked, ended or forgotten session, or rejoin after being removed? | No (forgotten = **F2**) | `isLive()`, `locked == false`, and `uid` not in `kicked`. |
| Can a student delete other players, nicknames or answers? | No | Delete is allowed only for yourself or the owner. Your own nickname can go only together with your player doc (**F4**). |
| Can a teacher read or change another teacher's quizzes or sessions? | Change: no. Read: quizzes no; sessions only by code while live (**F2**) | Owner checks everywhere. The session doc is readable by code during the class: students need that to join. |
| Can anyone list all sessions? | No | `list` needs `where('owner','==',myUid)` and a teacher account. Collection-group queries have no rule, so they are denied. |
| Does code guessing leak other classes' nicknames? | No | Player docs are owner + self only. Leaderboards appear only on the projector; they are never written to the session doc. Phones get only their own rank and `playerCount`. The `names/` oracle with the student's uid is closed (**F3**). Old sessions are hidden (**F2**). |
| Can a nickname attack the teacher's page (XSS) or the CSV? | No | Both apps render student and teacher text with `textContent` (`EDU.el({text})`). The only `innerHTML` uses are static SVG and the QR path built from numbers. The CSV export prefixes cells starting with `= + - @ TAB CR` with `'` (formula injection). |
| Can the Demo-mode or emulator switches be abused on the live site? | No | `?mock=1` only switches to Demo mode, which stays on the device. `?emulator=1` works only on localhost. `join/` and `teacher/` redirect to fixed paths and only append the query string. |

## 4. Fixes

**F1: look-alike and invisible nicknames.** `validName()` checked only the length, a `/` and the edges. A student could join
as `Asha` + U+200D (ZWJ), which looks like "Asha" but has a different `names/` id. They could also use U+202E (right-to-left
override) to show reversed or rude text, Hangul fillers for a blank name, or NBSP and zero-width spaces.
- Rules now refuse ASCII control characters, `/`, NBSP and other Unicode spaces, soft hyphen, ZWSP, LRM/RLM, bidi
  embeddings, overrides and isolates, the word joiner, BOM and fillers. They also refuse double spaces.
- The nickname id is now `nameKey()`: lower case, without ZWJ/ZWNJ and variation selectors. So "Asha", "ASHA" and
  "Asha"+ZWJ are the same nickname, while Indian-script conjuncts and emoji names still work.
- `normalizeName()` (both modes) removes or replaces the same characters before a join, so honest phones never hit the rule.
- The rule's regex contains the invisible characters **literally**, so no backslash escaping is involved. The comments
  list every code point.
- Tests: `nickname characters and look-alike nicknames` (5 tests); simulation: `ASHA 1`, `Asha`+ZWJ, `Asha`+U+FE0F → name-taken.

**F2: old and forgotten sessions readable or joinable by code guessers.** About 40 classes a day, kept 30 days, means about
1,200 readable codes among 900,000. A guesser therefore hits about one in 750 tries. Each hit showed the quiz title (which
can name the school or class), the questions, the teacher's uid (which links sessions of the same teacher) and the dates.
A session the teacher never ended stayed joinable.
- A session is now **live** while it is not ended and is less than 1 day old (`isLive()`). Anyone signed in can read a
  live session by code, and only a live session accepts joins.
- After that, only the owner and the session's own players can read it. That costs one rule read (`exists(player)`),
  and only for ended or stale sessions.
- `cloud.js` and the mock show such a session to a stranger as `state: 'ended'` with an empty title and questions, so
  the apps show "This quiz has ended" and never an error. A removed student keeps what they saw, marked ended.
- Tests: `session visibility (code guessing)` (5 tests); simulation: stranger, removed student, reload of a player.

**F3: `names/{nick}` readable by anyone.** It showed whether a nickname is in a class, and that student's anonymous uid.
Now `get` is allowed only for a free nickname (it reads as "missing") or your own reservation. `cloud.js` no longer reads
the nickname before joining (also a saving). When a join is refused, it reads to diagnose, and a refused read means
"taken". Tests: two tests in `players and nicknames`.

**F4: nickname squatting.** A student could delete their player doc, keep `names/{nick}`, rejoin under another nickname, and
repeat, to reserve many nicknames. Now a student may delete their player doc only if the reservation is gone after the
same write (`existsAfter`). They may delete the reservation only if their player doc is gone. `leaveSession()` does both in
one batch. Tests: `leaving releases the nickname` (4 tests).

**F5: cost.** Measured with the simulation (§5). Waste removed:
- `joinSession` no longer reads the session, the player and the nickname before writing. The page's `playerWatch()`
  already has the first two, and the nickname is read only when a join is refused. This saves 3 reads per student.
- The automatic 30-day clean-up (`autoPurge`) re-read **all** of the teacher's sessions on every page load. It now runs
  at most once per 12 hours per device. `listSessions()` still does the same clean-up for free whenever the dashboard
  opens.

Not wasteful, and kept:
- **Students' listeners.** A phone listens to two documents only: the session and its own player doc. It makes one query
  (its own answers) when the watch starts. No phone listens to a collection.
- **The host's listeners** on `players` and `answers`. The projector needs them.

**F6: delete batches and the rules' look-up limit.** Each owner delete in a 450-write batch runs `isSessionOwner()`. Firestore
allows 20 look-ups per batch, and documents that repeated look-ups of the same document are cached. If they ever count
separately, deleting a session, the score writes and "Remove me" would be refused. `commitOps()` now retries a refused big
batch in batches of 10. A player and its nickname stay in the same chunk, because the rules check them together. The
simulation's `--strict` mode counts every look-up and passes.

## 5. Cost per session (measured)

Simulation, 40 students, 10 short questions, from sign-in to deleting the session (`node firebase/tests/firebase_mode.sim.js`).
Reads include security-rule look-ups.

| Phase | Host reads / writes / deletes | Students reads / writes / deletes |
|---|---|---|
| Teacher signs in, saves the quiz, creates the session, opens the host screen | 9 / 4 / 0 | 0 / 0 / 0 |
| 40 students check the code (`playerWatch`) and join | 40 / 0 / 0 | 280 / 80 / 0 |
| 10 questions: start, ~36 answers, reveal, scores | 606 / 236 / 0 | 1,754 / 359 / 0 |
| End: rank for everyone, then `ended` | 42 / 41 / 0 | 121 / 0 / 0 |
| "Remove me" by 20 students (optional) | 0 / 0 / 0 | 319 / 0 / 219 |
| Teacher views results, lists sessions, deletes the session | 430 / 0 / 222 | 0 / 0 / 0 |
| **Total** | **3,601 reads, 720 writes, 441 deletes; 1.5 MB downloaded** | |

Other sizes, same scenario:

| Class | Reads | Writes | Deletes | Downloads | Classes per day on Spark |
|---|---|---|---|---|---|
| 20 students × 10 questions | 1,834 | 372 | 221 | 0.8 MB | ~27 |
| 30 × 15 | 3,809 | 772 | 465 | 2.1 MB | ~13 |
| 40 × 10 | 3,601 | 720 | 441 | 1.5 MB | ~13 (≈15 without "Remove me" and the results view) |
| 40 × 20, long Hindi questions (`--long`) | 6,505 | 1,317 | 801 | 25.4 MB | ~7 (downloads would allow ~13) |

The Spark limits are 50,000 reads, 20,000 writes and 20,000 deletes per day, and 10 GiB per month of downloads.
**Reads run out first.** LIVE_SPEC.md promised about 1,000 reads and 470 writes, or about 40 classes a day. The real
figure is **about 15 classes of 40 × 10 per day**. LIVE_SPEC.md, firebase/API.md and firebase/SETUP.md now give these numbers.

Where the reads go, for one student and one question (about 6 reads):
- The session doc is pushed to the phone twice, once at the start and once at the reveal.
- The answer write makes the rules look up the session and the student's own player doc (2).
- The host's `answers` listener reads the answer (1).
- When the answer scores, the score write is pushed to the phone and echoed to the host (≈0.6 + 0.6).

Fixed costs: about 8 reads per student to join, and about 12 to delete their data.

Options for more classes per day. None is implemented, because each one trades something away:

| Option | Effect | Cost of doing it |
|---|---|---|
| a. Drop `exists(players/uid)` from the answer rule. The host would ignore answers from non-players. | −1 read per answer (≈ −10 %) | An outsider who knows a live code can write junk answer docs, one per question per anonymous account. |
| b. Put the scores in the session doc as `{uid: points}`, written together with the reveal. | ≈ −15 % reads, ≈ −35 % writes | Every phone could see every uid's score (no names). "Remove me" would need a rule for removing your own entry. It changes the data model. |
| c. Move the question text out of the session doc into a doc read once. | Downloads down ≈10× for long quizzes (the session doc is re-sent on every change) | Does not raise the daily number of classes, since reads run out first. It is a data-model change. |
| d. Move to the Blaze plan with a small budget alert. | No daily cut-off | It is pay-as-you-go: roughly a few paise per class at Firestore's list prices (check the current pricing). TTL deletion becomes possible too. |

## 6. Privacy (DPDP Act 2023) check

**Student data.** Students give a nickname and get a random anonymous uid; that is all.
- The student app refuses nicknames that look like a phone number or an email address, and rude words.
- Answers carry no personal data.
- Nothing about students is in Firestore outside `sessions/{code}/…`.

**Deletion, verified end to end in the simulation:**
- `deleteSession` removes the session, the key, the players, the nicknames and the answers.
- "Remove me" removes the player, the nickname and that student's answers.
- `deleteTeacherAccount` removes the teacher's quizzes and sessions with all their subcollections, then `teachers/{uid}`,
  then the Auth user.
- The 30-day clean-up deletes sessions in the same deep way.

**TTL fields.** Every live-quiz document has `expireAt` (about 30 days ahead, checked by the rules): sessions,
`private/key`, players, names and answers. Teacher records and quizzes have none; they are kept until the teacher deletes
them, as the privacy policy says. TTL itself may need Blaze; the app-side clean-up does the job on Spark.

**Legal pages against behaviour.** Checked `legal/privacy-strings.js` and `terms-strings.js` (English). Every statement
still matches: what is collected, who sees what, the deletion paths, the honest note that sessions of a teacher who never
returns can stay longer, no analytics, Mumbai storage, and the daily limits in the terms. The fixes only tighten what
others can see, so no legal text changed. "Anyone with the join code can see the quiz questions" is now true only while
the quiz is live; the sentence is still correct as written.

**No analytics or tracking.**
- `cloud.js` loads only the three pinned compat SDK files from jsDelivr, and only in Firebase mode, when first needed.
- It strips `measurementId` from the config and uses no other Firebase product.
- Demo mode makes no network calls.
- The other external files are the QR library (jsDelivr, teacher app) and the shared site's Google Fonts for some
  languages. The privacy policy already names both.

## 7. Residual risks

| # | Risk | Mitigation now | What would reduce it |
|---|---|---|---|
| R1 | **Quota exhaustion (denial of service).** Any signed-in user, even anonymous, can loop `get`s on a session code or join/leave a live session. Any Google account can write quizzes. On Spark, the day's free quota then runs out for everyone. | Spark never charges money. The apps show "Today's free limit is used up" and Demo mode still works. | **App Check** with reCAPTCHA v3 / Play Integrity blocks scripts that are not our website. Raise or lower the Auth sign-up quota per IP. Blaze with a budget alert. |
| R2 | A live session (less than 1 day old, not ended) is readable by anyone signed in who guesses its code: title, questions, the owner's uid, `playerCount` and the anonymous uids of removed players. Nicknames are never exposed. | Short live window (F2). Locking stops joins. | Longer codes (8 digits) make guessing 100× harder, at the cost of usability. App Check. |
| R3 | Fairness: all question texts are in the session doc from the start, so a student with devtools can read the next questions early (never the answers). | None. | Release each question's text at `startQuestion`. Option c in §5 is the first step. |
| R4 | Homoglyph nicknames: a Cyrillic "а" looks like a Latin "a". | Invisible-character tricks are fixed. The teacher sees both names and can remove one. | A confusables "skeleton" in `nameKey`. That is heavy for the rules language. |
| R5 | Lobby flooding by scripted anonymous accounts. | Lock + kick. A removed uid can't rejoin. | App Check; a cap on players per session (needs a counter). |
| R6 | A teacher who never opens the app again keeps old sessions forever on Spark. | Stated honestly in the privacy policy ("deleted on request"). | Blaze + TTL (`expireAt` is already on every doc), or a scheduled Cloud Function. |
| R7 | Anonymous Auth records (uid plus creation time, no personal data) pile up in Firebase Authentication. | None needed for privacy. | Identity Platform's automatic clean-up of anonymous users, if the project is upgraded. |
| R8 | **The rules were not run against the real emulator in this review** (no Java). The simulation uses a JavaScript model of them. | `rules.test.js` has tests for every rule and every fix. **Update 4 Oct 2026:** a local Java runtime (`tools/jre`) now runs the emulator; all 122 tests pass (§7b). | Install Java 11+ and run `cd firebase && npm run test:emulator` before publishing the config. The console's rules editor also compiles the file on Publish. |
| R9 | A student can rejoin under a new nickname mid-quiz while the session is unlocked (leave, then join). Their answers stay, and their score starts again from 0. | The teacher locks the session once everyone has joined. | — |
| R10 | Large quizzes cost more downloads: the session doc, with every question, is re-sent to every phone on each change. With today's limits (200 questions of 1,000 characters) a single doc can reach ~0.5 MB. | Reads run out first for normal quizzes (§5). | Option c in §5, or lower `LIMITS.questions`. |

## 7b. Addendum (4 Oct 2026): `interest/{uid}`, the email updates list

The "Stay updated" form (`shared/signup.js` → `EDUCloud.registerInterest`) adds one document per sign-up to the collection
`interest`. It holds personal data of adults (email, optional name, organisation and place), so it was reviewed as its own
attack surface. Rules: `match /interest/{id}` at the end of `firestore.rules`. Tests: the `interest (updates list)` suite
in `firebase/tests/rules.test.js` (22 tests). The Firestore emulator run passed **122/122** (100 older tests + 22).

**What the rules allow.** Only `create`, and only when all of the following hold:
- **Signed in** (anonymous is enough). Signed-out writes are refused.
- **Document id == your own uid**, and `uid` in the record == your uid. Writing the same id again counts as an update,
  which is denied, so one Firebase account can add **exactly one** sign-up and can never overwrite one (its own or
  anyone else's).
- **Exact field set:** `keys().hasOnly/hasAll` on `{name, email, role, org, place, prefLang, topics, consent, lang, page,
  createdAt, uid}`. A missing or extra field is refused.
- **Field checks:**
  - `consent == true` (a bool; `'true'`, `1` or a missing field are refused);
  - `createdAt == request.time` (server time);
  - email: 6–254 characters, lower case, trimmed, no spaces or control characters, `x@y.zz` shape (Indian-script
    addresses pass);
  - name ≤ 60, org ≤ 80, place ≤ 60 characters: strings, may be empty, no control characters or line breaks;
  - `role` from `teacher principal student parent org other`;
  - `topics`: a list of 1–3 **different** values from `apps videos training`;
  - `prefLang` and `lang`: one of the 12 language codes;
  - `page`: `home schools business other`.
- The form allows exactly these values (`INTEREST` and `validateInterest()` in `shared/cloud-mock.js`), so a real sign-up
  never hits a rule.

**What the rules deny.** No `get`, `list`, `update` or `delete` rule exists, so for every website user (anonymous,
Google teacher or signed out) these are refused:
- reading your own sign-up;
- reading a missing id (no existence oracle);
- listing the collection or querying it by `uid` or `email`;
- changing or deleting any sign-up.

The owner reads and deletes in the Firebase console, which bypasses the rules.

**Cost.** The rule has no `get()`/`exists()`, so a sign-up is **1 write and 0 reads** (measured in the simulation). The
client also signs in one new anonymous account per sign-up (Firebase Auth, free).

| # | Threat | Result | Why / mitigation |
|---|---|---|---|
| I1 | **Email harvesting**: read or list the emails from a browser | Not possible | No read rule of any kind. Tests cover get (own, other, missing id), list, `where uid ==` and `where email ==` queries, as an anonymous user, a teacher and signed out. The page never reads the list back. |
| I2 | **Tampering**: change, overwrite or delete someone's sign-up, or unsubscribe them | Not possible | No update or delete rule. Ids are uids, and you can only create at your own uid. A second `set` on an existing id is an update, which is denied. |
| I3 | **Spam sign-ups** (junk entries) | Limited | Each document needs its own Firebase account, because the id must be the writer's uid. Firebase Auth limits new accounts per IP address (about 100 per hour by default; Authentication → Settings → sign-up quota). The form's hidden honeypot field stops simple bots before anything is sent. The field limits keep each entry small (< 1 KB). Junk can never be read by others, and it never changes real entries. |
| I4 | **Quota abuse** (use up the shared Spark write quota, 20,000 writes/day, which the Live Class Quiz needs too) | Reduced, not removed | Before this change, one anonymous account could loop writes until the day's quota was gone. Now one account = one write, so a flood from one IP is capped by the sign-up quota (≈2,400 writes/day per IP at the default). A botnet with many IPs could still use up the day's writes. Spark never charges money; the quiz shows "Today's free limit is used up" until the reset. The real fix is **App Check** (R1), which would cover this collection too. |
| I5 | **Signing up someone else's email** (no double opt-in) | Possible, like any open form | The owner's first email to a new address should be a short welcome/confirmation with a one-line "reply unsubscribe" note. Delete addresses that bounce or reply "unsubscribe", within 30 days. |
| I6 | **Formula / CSV injection** when the owner copies the list into a spreadsheet (a name such as `=HYPERLINK(...)`) | Owner-side risk | Text is single-line and length-limited, but may start with `=`, `+`, `-` or `@`. When pasting into Excel or Sheets, paste as plain text, or prefix such cells with `'`. Never enable macros or "update links" for this file. |
| I7 | **Linking a sign-up to a person's quiz or teacher account** | Not possible | Separate app instance `'edu-interest'` with its own **new** anonymous account per sign-up, signed out right after. It is never the teacher (Google) or quiz-player identity. No IP address is stored. |
| I8 | **Children** signing up | Text-only control | The consent text says 18+. Students in the quiz never see the form (it is only on home, schools.html and business.html). The rules cannot check age. Delete any entry that is clearly a child's. |

**Client changes that go with the rules** (`shared/cloud.js`, `shared/cloud-mock.js`):
- `registerInterest` writes `interest/{uid}` with `set()` on the new account's uid.
- Before each sign-up, the client signs out any left-over interest account (for example from a closed tab) and signs
  in anonymously **fresh**. It signs out again afterwards, whether the write succeeded or failed.
- Because of this, a second person on a shared school computer can sign up. A retry after a lost reply never runs into
  "already exists". No sign-up identity stays on the device.
- Calls run one after another, so two quick clicks cannot mix up accounts.
- Demo mode stores under the same kind of id (`anon-…`).
- The client's email check now also refuses control characters, like the rules.

**Verified:**
- `firebase/tests/firebase_mode.sim.js` (G) checks that a sign-up costs 1 write, that the id is the uid, and that the
  account is signed out afterwards.
- It also checks that 3 sign-ups from one device (two of them sent at the same moment) get 3 different ids, and that
  the quiz player's own id is never used.
- A scripted second write with the same account, or a write under another id, is refused.
- A mutation check (weakening the rules in a copy: no id check, duplicate topics allowed, a read rule added) made the
  matching emulator tests fail every time.

## 8. Changes made in this review

- `firebase/firestore.rules`: `nameKey()`, a stricter `validName()`, `isLive()`, session `get` for live sessions or the
  owner and players, joins only for live sessions, nickname reads limited to your own, leaving releases the nickname.
  Generated with literal invisible characters; the comments list them.
- `firebase/tests/rules.test.js`: one existing test updated (reading someone else's reservation is now refused) and 15 new tests.
- `firebase/tests/firebase_mode.sim.js`, `firebase/tests/sim/fake-backend.js`, `firebase/tests/sim/fake-sdk.js`: new.
- `shared/cloud-mock.js`:
  - `normalizeName()` handles more characters;
  - `nameKey()` ignores joiners and variation selectors;
  - new `isLive()` and `hiddenSession()`;
  - a stranger watching an ended session sees "ended";
  - joining a session that is not live → `session-ended`.
- `shared/cloud.js`:
  - `joinSession` without pre-reads, plus `diagnose()`;
  - `playerWatch` turns a refused session read into "ended";
  - `submitAnswer` and `leaveSession` understand hidden sessions;
  - `commitOps()` small-batch fallback;
  - `autoPurge` at most every 12 hours per device;
  - `nameIdOk()`.
- Docs: `LIVE_SPEC.md` (budget and a "Security review" section), `firebase/API.md`, `firebase/SETUP.md`.
- No change was needed in `apps/live-quiz`, `apps/quiz-join` or `legal/`.
