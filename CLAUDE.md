# Notes for Claude sessions (local PC or cloud)

Read this first, then [AGENTS.md](AGENTS.md) (the build contract for apps) and [README.md](README.md).

## What this is
**apnipathshala.ai**: a free library of web tools for everyone in India (students, teachers, offices, shops, creators),
in 12 Indian languages, from the YouTube channel AI की पाठशाला (@Apni_Pathshala_AI). Static HTML/CSS/JS, no build step,
hosted on GitHub Pages from the `main` branch of this repo (custom domain in `CNAME`). Pushing to `main` = going live.

## Standing rules (from the owner)
- **Strictly non-commercial.** No ads, sponsorships, paid plans, donation/UPI buttons, affiliate links or paid workshops.
- **For everyone, not only schools.** Schools are one audience among several; don't write school-only copy for the site.
- **12 languages, always** (en hi bn mr gu pa or ta te kn ml ur; Urdu is right-to-left). Every visible string goes through
  the string tables; keys must match in all 12. Simple everyday language, Western digits.
- **Privacy.** Files and data stay on the user's device. Never add analytics, trackers or uploads.
- **Never commit secrets** (passwords, API keys other than the public Firebase web config, tokens). This repo is public.
- Contact address for the site: support@apnipathshala.ai, set in ONE place each: `CONTACT_EMAIL` in `shared/edu.js`
  and `EDU_CONTACT_EMAIL` in `shared/firebase-config.js` (privacy/terms grievance contact).

## Site structure (2026-10-07)
- `index.html` + `shared/home.js` + `shared/home-strings.js`: library-first home (search with a category picker, audience
  tabs, category chips, AIxploria-style app cards). Cards are built from `catalog.js` (generated, do not edit).
- Site pages with the top menu and 4-column footer: `schools.html`, `business.html`, `about.html`, `contact.html`
  (each `shared/<page>.js` + `shared/<page>-strings.js`; about/contact also use `shared/site-pages.css`).
  The menu/footer come from `EDU.init({ nav: '<page id>' })` in `shared/edu.js`; the shared calm look is the
  "One calm look for every site page" block in `shared/edu.css` (scoped to `body.edu-site`, so apps are unaffected).
- `apps/<slug>/`: one folder per app (see AGENTS.md). `guides/`: static how-to articles. `legal/`: privacy + terms.
- Live Class Quiz (`apps/live-quiz`, `/teacher/`, `/join/`) is the only online feature (Firebase, rules in `firebase/`).

## Checking your work
```bash
cd tools && npm ci && cd ..                 # playwright-core
# no Chrome on this machine (cloud/Linux)? get Playwright's Chromium once:
(cd tools && npx playwright-core install --with-deps chromium)
node tools/verify.js <slug>                 # one app: 12 languages at 390 px, interaction test, file://, screenshots
node tools/verify.js home                   # home page
node tools/verify_pages.js about            # also: contact, schools, business
node tools/tests/_legal.check.js            # privacy + terms
node tools/tests/_signup.check.js           # "Stay updated" form
```
The browser is found by `tools/chrome-path.js` (installed Chrome/Edge, Linux chromium, or Playwright's Chromium;
override with `EDU_CHROME=/path/to/chrome`). Screenshots land in `tools/shots/` and reports in `tools/reports/`
(both gitignored): look at the screenshots, don't just trust PASS.

## Publishing
- **From a cloud session: do NOT push to `main` and do NOT run `tools/publish.sh`.** Work on a branch, run the checks
  above, push the branch and open a pull request. The owner merges it, or a session on the PC publishes it.
- On the owner's PC, `bash tools/publish.sh "message"` rebuilds the catalog from apps whose latest verify PASSED,
  stages them plus the shared/site files, commits and pushes `main`. Apps listed in `tools/.publish_hold`
  (gitignored) are never published.

## Unfinished apps (round 3, paused by the owner on 4 Oct until Sat 10 Oct)
They are NOT on `main`. A backup of their folders and tests, plus the specs (`docs/ROUND3_SPECS.md`), is on the branch
**`wip/round3`**. To continue one in the cloud: branch from `wip/round3`, finish the app, run `node tools/verify.js <slug>`,
then do a QA pass (real inputs, Tamil + Urdu at 390 px, edge cases, maths checks, no network calls), and open a PR.

| Status on 7 Oct | Apps |
|---|---|
| Built, verify PASS, still needs QA | sur-taal-trainer, contact-list-vcf, utm-link-builder, stock-register, ai-dictionary, daily-english-words, pdf-sign-fill |
| Built, verify FAIL | spam-classifier-lab, live-poll |
| Partly built | recommendation-lab, seating-chart-maker, workplace-scam-drill, barcode-label-maker, sound-waves-lab, vedic-maths |
| Not started | recipe-finder |

## Not in this repo
The owner's notes (account setup, YouTube channel work, outreach email tooling) live on the owner's PC, not here.
Ask the owner before anything that touches accounts, DNS, email, YouTube or Firebase settings.
