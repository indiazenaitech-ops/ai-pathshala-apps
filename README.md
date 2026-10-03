# AI Pathshala Apps: free learning apps for schools

**Open the library:** https://indiazenaitech-ops.github.io/ai-pathshala-apps/

These are free classroom web apps for schools and colleges. They teach AI, maths, science, coding,
languages, study skills and digital safety. The library comes from the YouTube channel
[AI की पाठशाला](https://www.youtube.com/@Apni_Pathshala_AI).

- **Free forever.** No sign-up, no ads, no tracking, no fees.
- **12 languages.** English, हिन्दी, বাংলা, मराठी, ગુજરાતી, ਪੰਜਾਬੀ, ଓଡ଼ିଆ, தமிழ், తెలుగు, ಕನ್ನಡ, മലയാളം and اردو.
- **Runs anywhere.** Smartboards, laptops and low-cost Android phones, in any modern browser.
- **Private.** Everything runs on the device, and whatever students type stays there.
- **Works offline.** An app keeps working without internet once it has been opened. A school with no internet can download this
  repository as a ZIP (green **Code** button → *Download ZIP*), unzip it and open `index.html`.
  A few apps (Python, SQL, image AI, QR) need internet the first time to load their engine.

See [APPS.md](APPS.md) for the full list of apps.

## For developers
Each app lives in `apps/<slug>/` as plain HTML, CSS and JS. There's no build step.
The shared runtime (`shared/edu.js`) provides the i18n, the page shell and helper functions, and
`shared/edu.css` provides the design system. See [AGENTS.md](AGENTS.md) for the contract every app follows.

```bash
cd tools && npm install            # playwright-core (uses your installed Chrome)
node tools/verify.js <slug>        # static + 12-language + interaction + offline checks
node tools/build_catalog.js        # regenerate catalog.js from apps/*/meta.json
```

Code is released under the MIT License. Translations were drafted with AI help, so corrections from native
speakers are welcome. Please open an issue.
