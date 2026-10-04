# Firebase setup (owner's guide)

This turns on **teacher accounts + the online Live Class Quiz**. Until it is done, both apps run in **Demo mode**:
everything works on one device and nothing goes online. That is safe to publish.

You need about 20 minutes, the Google account that should own the project, and a computer browser.
You need no credit card. Stay on the free **Spark** plan, which cannot charge money.

---

## 1. Create the project

1. Open **https://console.firebase.google.com** and sign in with the owner's Google account.
2. Click **Create a project** (or **Add project**).
3. Project name: `apni-pathshala`. Under the name, Firebase shows the **Project ID**. If `apni-pathshala` is taken it adds
   a suffix such as `apni-pathshala-1a2b3`. Note the ID. Tick the terms box if asked and click **Continue**.
4. If a step offers **Gemini / AI assistance**, leave it off and click **Continue**.
5. **Google Analytics**: switch it **OFF**. We promise "no tracking", and Analytics is not needed.
6. Click **Create project**, wait, then click **Continue**.

## 2. Sign-in methods (Authentication)

1. In the left menu: **Build → Authentication → Get started**.
2. Tab **Sign-in method**:
   - Click **Google** and switch on **Enable**. Under **Project support email**, choose your email. Click **Save**.
   - Click **Add new provider → Anonymous** and switch on **Enable**. Click **Save**.
     (Students join with a nickname only. Anonymous sign-in gives each phone a random id, with no name, email or phone number.)
3. Tab **Settings → Authorized domains → Add domain**:
   - add `apnipathshala.ai`, then click **Add**
   - add `www.apnipathshala.ai`, then click **Add**
   - Keep `localhost` and the `…firebaseapp.com` entries that are already there.
4. If Firebase offers **"Upgrade to Identity Platform"**, do not do it. It is not needed.

## 3. Database (Firestore) in Mumbai

1. Left menu: **Build → Firestore Database → Create database**.
2. If asked for an edition, choose **Standard**.
3. **Database ID**: keep `(default)`. **Location**: choose **`asia-south1 (Mumbai)`**.
   *The location can never be changed later.* Mumbai keeps the data in India and makes the app fast here.
4. Choose **Start in production mode** and click **Create**.

## 4. Security rules

1. Firestore Database → tab **Rules**.
2. Delete all the text in the editor.
3. Open `firebase/firestore.rules` from this project (on GitHub:
   `https://github.com/indiazenaitech-ops/ai-pathshala-apps/blob/main/firebase/firestore.rules` → **Raw**), select all, copy,
   and paste it into the editor.
4. Click **Publish**. If it shows an error, send Claude a screenshot and don't change anything else.

Two lines of the rules (the nickname checks) contain **invisible characters on purpose**. They stop a student from
copying another student's nickname with hidden characters. Always copy the whole file from **Raw**; never retype it. If
the editor or GitHub warns about "hidden" or "bidirectional Unicode" characters, that is expected. The comments above
those lines list each character.

These rules decide what anyone can read or write. Students can never see answer keys, other students' answers or
other players. Nobody can change scores except the teacher who owns the session. Teachers see only their own quizzes.
A quiz session can be opened by its code only while it is running (less than 1 day old and not ended); after that only
the teacher and the students who played it can see it. Details: `firebase/SECURITY_REVIEW.md`.

### 4b. Re-paste the rules for the "Stay updated" form (4 Oct 2026, owner action)

`firestore.rules` now ends with a `match /interest/{id}` block for the email updates list. The rules running in the
console are the old ones, so until you publish the new file **every sign-up on apnipathshala.ai fails**. The form then
shows a friendly "sorry, please email us instead" message with a ready-made email link. Nothing else is affected: the
Live Class Quiz rules in the file are unchanged.

1. Open `https://github.com/indiazenaitech-ops/ai-pathshala-apps/blob/main/firebase/firestore.rules` → **Raw**.
   Check that it contains `match /interest/{id}` and the line `&& id == request.auth.uid`. If it does not, the
   auto-publisher has not pushed the new version yet: wait 15 minutes and reload.
2. Select all, copy. In the Firebase console: Firestore Database → **Rules** → select all the old text → paste →
   **Publish**. (As in step 4: always copy the whole file from Raw, never retype it; the "hidden characters" warning
   is expected.)
3. Test it: open **https://apnipathshala.ai/#updates**, fill in the form with your own email, tick the consent box and
   press the button. You should see the thank-you message. In Firestore Database → **Data** you will now see a
   collection `interest` with one document. Delete that test document afterwards if you like (see below).

The rules allow the website to **add** a sign-up and nothing else. Nobody can read, search, change or delete the list
from a browser, not even the person who signed up. Each sign-up uses its own new anonymous account, and each anonymous
account can add only one sign-up. Details: `firebase/SECURITY_REVIEW.md` §7b. Tests: `cd firebase && npm run test:emulator`
(122/122 passed on 4 Oct 2026).

### 4c. Working with the updates list (only you, in the console)

The console ignores the security rules, so you see everything. Treat the list as private: never share a screenshot.

- **See the list:** Firestore Database → **Data** → collection `interest`. Each document is one sign-up. Its id is a
  random code (the anonymous account that sent it). Fields:
  - `email`, `name`, `org` (school or organisation), `place`;
  - `role` (teacher, principal, student, parent, org, other);
  - `topics` (`apps` = new free apps, `videos` = Hindi AI video lessons, `training` = AI training for a school or
    organisation);
  - `prefLang` (language for your emails);
  - `lang` and `page` (where they signed up);
  - `createdAt`, `consent` (always true), `uid`.
- **Find a person:** above the document list, click the **filter** button (funnel icon) → field `email` → `==` → their
  address (lower case) → **Apply**. One person may have signed up more than once; each sign-up is its own document.
- **Unsubscribe / delete request:** find every document with that email (filter above). Open each one → **⋮** →
  **Delete document**. Do it within 30 days of the request; the privacy policy promises this. Also delete addresses that
  bounce.
- **Copy the emails:** the free plan has no "download as CSV" button for Firestore data. Google's managed export needs
  the paid Blaze plan, so don't use it. For a short list, copy the addresses from the Data tab into your email
  program's BCC field, or into a private Google Sheet. When the list grows, ask Claude for a small export script. It
  needs a service-account key, and that key must be kept **outside** `C:\Claude\projects\edu_apps_library`, because that
  folder is published to GitHub every 15 minutes.
- **Pasting into a spreadsheet:** paste as plain text. If a name or organisation starts with `=`, `+`, `-` or `@`, put
  a `'` in front of it, so the spreadsheet does not treat it as a formula. A bot could have typed one.
- **Sending emails:**
  - Always use **BCC**, never To/CC, so people don't see each other's addresses.
  - Make the first email to a new address a short welcome. Anyone can type someone else's email into the form.
  - End every email with a line like "Reply 'unsubscribe' and we will remove you."
  - Send in the person's `prefLang` where you can.
- **Clutter in Authentication → Users:** every sign-up (and every quiz student) leaves an anonymous user with no name
  or email. That is expected and harmless. Deleting them does not delete sign-ups.

## 5. Optional: automatic deletion by Google (TTL)

Our privacy policy promises that live-quiz data is deleted after 30 days. **The apps already do this themselves**:
when a teacher opens the teacher app, their sessions older than 30 days are deleted, and students can tap "Remove me".
A TTL policy adds a second safety net, because Google then also deletes data of teachers who never come back.
Every live-quiz document has an `expireAt` field (30 days ahead) for this.

1. Open **https://console.cloud.google.com/firestore/databases** (same Google account). At the top, pick the
   project `apni-pathshala` (the same Project ID as in step 1).
2. Click the database **(default)** → in its left menu click **Time-to-live** (TTL) → **Create policy**.
3. Collection group: `sessions`. Timestamp field: `expireAt`. Click **Create**.
4. Repeat **Create policy** for these collection groups, each with the field `expireAt`:
   `players`, `answers`, `names`, `private`.
5. Each policy shows "Creating…" for a few minutes and then "Serving".

**If this page asks you to enable billing or add a card, stop and skip this step.** Do not upgrade. Everything works
without it. In that case, data of a teacher who never opens the app again stays until it is deleted on request,
and the privacy policy says so.

## 6. Connect the website (web app config)

1. Firebase console → **Project Overview** (house icon) → **+ Add app** → the **Web `</>`** icon.
2. App nickname: `AI Pathshala website`. Do **not** tick "Also set up Firebase Hosting". Click **Register app**.
3. Firebase shows code with `const firebaseConfig = { apiKey: "...", authDomain: "...", projectId: "...", ... };`.
   Copy **that object** (from `{` to `}`) and **send it to Claude**. Click **Continue to console**.
   - This config is **public by design**. It is in every visitor's browser, and it is not a password. The security rules
     from step 4 protect the data.
   - If it contains `measurementId`, that means Analytics is on. Go back to step 1.5. cloud.js ignores it anyway.
4. Claude pastes it into `shared/firebase-config.js` as `window.EDU_FIREBASE = {...}` and publishes. After that, the
   apps go online automatically. A teacher can still try Demo mode by adding `?mock=1` to the URL.

## 7. Check that it works

1. On a computer, open **https://apnipathshala.ai/teacher/** and click **Sign in with Google**. Your name should appear.
2. Create a small quiz and click **Host**. A 6-digit code and a QR code appear.
3. On a phone (mobile data is fine), open **https://apnipathshala.ai/join/**, type the code and a nickname. The nickname
   appears on the computer.
4. Start a question, answer it on the phone, reveal it, and end the quiz.
5. Optional: in the Firebase console → Firestore Database → **Data**, you can see `sessions/<code>`. Delete the test session
   in the teacher app afterwards.

---

## Staying on the free Spark plan

- **Never click "Upgrade" or "Modify plan" (Blaze)** unless you have decided to pay. On Spark, Google cannot charge
  anything. When a daily limit is reached, the feature stops until the limit resets. Teachers then see:
  *"Today's free limit is used up. Please try again tomorrow, or use Demo mode."*
- Free limits per day for Firestore: **50,000 reads, 20,000 writes, 20,000 deletes**, plus 1 GiB stored and
  10 GiB/month downloaded. The limits reset around **midnight US Pacific time** (about 12:30–1:30 pm IST).
- One live quiz with 40 students and 10 questions uses about **3,300 reads, 720 writes and 480 deletes** from start
  to deletion (measured; reads include the security checks). That allows about **15 such quizzes per day** for free;
  reads run out first. With 20 students it is about 27 a day. (The earlier figure of 1,000 reads and 40 a day was too
  optimistic; see `firebase/SECURITY_REVIEW.md` §5.) If schools need more, the Blaze plan with a budget alert costs
  very little per quiz, but it is pay-as-you-go: decide that first.
- Google and Anonymous sign-in are free.
- Usage graphs: Firebase console → Firestore Database → **Usage**. You can also set a budget alert, but Spark has no bill anyway.
- **Many students on one school Wi-Fi**: Firebase limits how many new accounts one IP address can create per hour.
  If students in one school get the "free limit" message while joining, open Authentication → **Settings** →
  **Sign-up quota** and raise it for the day of a big event.

## Privacy checklist (DPDP Act 2023)

- Google Analytics: **off**. No other Firebase product (Analytics, Messaging, Crashlytics, Performance) is used.
- Students: nickname + random anonymous id only. Deleted after 30 days (by the teacher app, plus TTL if step 5 worked),
  when the teacher deletes the session, or right away with "Remove me" on the final screen.
- Teachers: their Google name and email stay in Firebase Authentication. Firestore stores only the name, their quizzes and
  sessions. "Delete my account and data" in the teacher app removes all of it.
- Data location: Firestore in `asia-south1` (Mumbai).
- Email updates list (adults only, with consent): `interest` collection, readable only by you in the console. Delete a
  person's documents within 30 days of an unsubscribe or delete request (step 4c).
- Grievance contact: `window.EDU_CONTACT_EMAIL` in `shared/firebase-config.js`, shown on `legal/privacy.html`.

## Optional hardening

- **Restrict the API key to our sites**: Google Cloud console → **APIs & Services → Credentials** → the key named
  "Browser key (auto created by Firebase)" → **Application restrictions: Websites** → add
  `https://apnipathshala.ai/*`, `https://www.apnipathshala.ai/*`, `https://<project-id>.firebaseapp.com/*` and
  `http://localhost/*` → **Save**. Missing the `firebaseapp.com` line breaks Google sign-in.
- **App Check** (blocks scripts that are not our website) can be added later. Ask Claude first, because it needs code changes.
  It is the main protection against someone who scripts thousands of requests to use up the day's free limit for
  everyone (see `firebase/SECURITY_REVIEW.md`, risk R1).

## Optional: test the rules / deploy from the command line

You need Node.js 20+ and **Java 11+** for the Firestore emulator.

```bash
cd firebase
npm install                 # rules-unit-testing, firebase, firebase-tools (local, ~400 MB; not part of the website)
npm run test:emulator       # = firebase emulators:exec --project demo-apni-pathshala --only firestore "npm test"
```

All tests must pass (122 on 4 Oct 2026). They cover every allow and deny case, including attacks such as a student
writing their own score, reading the answer key, answering twice or joining a locked session, and for the updates list:
reading or listing emails, a second sign-up from the same account, extra fields and too-long text.

On the project's Windows PC a portable Java is in `tools/jre/` (not published). In PowerShell:

```powershell
$env:JAVA_HOME = 'C:\Claude\projects\edu_apps_library\tools\jre\jdk-21.0.12.1+1-jre'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
$env:JAVA_TOOL_OPTIONS = '-Djdk.net.unixdomain.tmpdir=C:\Claude\tmp_uds'   # a short folder that exists
cd C:\Claude\projects\edu_apps_library\firebase; npm run test:emulator
```

Without Java you can still run `node firebase/tests/firebase_mode.sim.js` from the project root (no internet needed). It
runs the real `shared/cloud.js` in Firebase mode against a fake SDK and an in-memory database with a model of the rules,
plays a 40-student quiz, and prints the reads, writes and deletes. It does not test the real rules file: only the emulator does that.

To deploy the rules from the command line instead of copy-paste, sign in with `npx firebase login`. If your
Project ID is not `apni-pathshala`, fix the `"live"` entry in `firebase/.firebaserc`. Then run `npm run deploy:rules`.
`npm run deploy:indexes` is optional. It switches off indexing of large fields such as the question lists, so writes
cost less, and it also creates the TTL policies of step 5, so skip it if TTL needs billing.

## Switching it off

Set `window.EDU_FIREBASE = null;` in `shared/firebase-config.js` and publish. Everything goes back to Demo mode.
The stored data stays in Firebase (until TTL deletes it, if step 5 worked). To remove everything: Firebase console → ⚙ **Project settings** →
**Delete project**.

## Troubleshooting

| What you see | Fix |
|---|---|
| Sign-in popup closes and the app says "not set up" | Step 2.3: add the domain to **Authorized domains** |
| "not set up" when a student joins | Step 2.2: **Anonymous** provider not enabled |
| Everything says "No permission" | Step 4: rules not published, or published from an old copy |
| "Stay updated" form says "sorry, please email us instead" | Step 4b: the new rules (with `match /interest/{id}`) are not published yet |
| "Today's free limit is used up" | Spark daily limit reached. Wait for the reset (about 1 pm IST), or see Sign-up quota above |
| Works on Wi-Fi but not at school | The school network may block Google services. Try mobile data; Demo mode always works |
| Phone shows "open in browser" or sign-in fails inside WhatsApp | Open the link in Chrome (in-app browsers block Google sign-in) |
