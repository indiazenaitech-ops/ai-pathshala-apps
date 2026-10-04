# AI Pathshala Apps: free learning apps for schools

**Open the library:** https://apnipathshala.ai
**For principals and teachers:** https://apnipathshala.ai/schools.html (one-day roll-out plan, CBSE AI 417/843, CS and IP chapter list, FAQ, free teacher workshop)

These are free classroom web apps for schools and colleges. They teach AI, maths, science, coding,
languages, study skills and digital safety. The library comes from the YouTube channel
[AI की पाठशाला](https://www.youtube.com/@Apni_Pathshala_AI) ([subscribe](https://www.youtube.com/@Apni_Pathshala_AI?sub_confirmation=1)).

- **Free forever.** No sign-up for students, no ads, no tracking, no fees. Teachers can optionally sign in with Google
  to host the online Live Class Quiz.
- **12 languages.** English, हिन्दी, বাংলা, मराठी, ગુજરાતી, ਪੰਜਾਬੀ, ଓଡ଼ିଆ, தமிழ், తెలుగు, ಕನ್ನಡ, മലയാളം and اردو.
- **Runs anywhere.** Smartboards, laptops and low-cost Android phones, in any modern browser.
- **Private.** Every app except the Live Class Quiz runs on the device, and whatever students type stays there.
  The optional Live Class Quiz runs online (Google Firebase, Mumbai region): students join with a code and a
  nickname only, and their nicknames and answers are deleted after 30 days, when the teacher deletes the session, or
  when they tap "Remove me". Details: [privacy policy](https://apnipathshala.ai/legal/privacy.html).
- **Works offline.** An app keeps working without internet once it has been opened. A school with no internet can
  [download all apps as a ZIP](https://github.com/indiazenaitech-ops/ai-pathshala-apps/archive/refs/heads/main.zip)
  (or the green **Code** button → *Download ZIP*), unzip it and open `index.html`.
  A few apps (Python, SQL, image AI) need internet the first time to load their engine. The Live Class Quiz needs
  internet while it runs.
- **Easy to share.** Every app has a WhatsApp button in its header that sends the app's public link.

See [APPS.md](APPS.md) for the full list of apps.

## For developers
Each app lives in `apps/<slug>/` as plain HTML, CSS and JS. There's no build step.
The shared runtime (`shared/edu.js`) provides the i18n, the page shell and helper functions, and
`shared/edu.css` provides the design system. See [AGENTS.md](AGENTS.md) for the contract every app follows.

```bash
cd tools && npm install            # playwright-core (uses your installed Chrome)
node tools/verify.js <slug>        # static + 12-language + interaction + offline checks
node tools/verify.js home          # the library home page
node tools/verify_pages.js schools # the For-schools page (same checks)
node tools/build_catalog.js        # regenerate catalog.js, APPS.md, sitemap.xml and the apps JSON-LD in index.html
```

### Site settings, sharing and SEO
- **One config place:** `EDU.SITE` in `shared/edu.js` holds the public URL (`https://apnipathshala.ai/`), YouTube and
  subscribe links, the repository / ZIP links and the contact address (`CONTACT_EMAIL`, joined at run time so it is
  never plain text in a page).
- **Share buttons:** the shell adds a WhatsApp link to every header (`EDU.shareUrl()` always gives the public
  `https://apnipathshala.ai/...` address, also from a downloaded ZIP). Pages can pass `EDU.init({ waKey })` for their
  own message. The shell's own strings use the `shell_` prefix (`shell_wa`, `shell_wa_msg`, `shell_schools`); apps
  should not define keys with that prefix. The footer of every page links to `schools.html`.
- **Search engines:** `robots.txt`, `sitemap.xml` (generated), canonical URLs, Open Graph/Twitter tags and JSON-LD
  (Organization + WebSite + an ItemList of apps, generated between the `build:apps-jsonld` markers in `index.html`).
- **Social images:** `node tools/make_og.js` renders `shared/img/og-home.png` and `og-schools.png` (1200x630, under
  300 KB for WhatsApp). `--apps` also renders `shared/img/og/<slug>.png` per app.
- **Per-app share tags:** `node tools/inject_og.js` (dry run) / `--write` adds or refreshes a canonical + Open Graph
  block in each `apps/<slug>/index.html` from its `meta.json`. It edits app files, so run it only when no app is being
  edited, then re-run `node tools/verify.js <slug> --quick` for those apps.
- **No analytics, no tracking, no third-party cookies.** Keep it that way: the site is used by children.
- `tools/publish.sh` rebuilds the catalog and publishes verified apps plus the site files to GitHub Pages.

Code is released under the MIT License. Translations were drafted with AI help, so corrections from native
speakers are welcome. Please open an issue.
