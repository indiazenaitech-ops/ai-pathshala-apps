# AI Pathshala Apps: build contract

A free library of classroom web apps for Indian schools and colleges, from the YouTube channel
**AI की पाठशाला** (https://www.youtube.com/@Apni_Pathshala_AI). The site is static HTML/CSS/JS. It is
published on GitHub Pages, and teachers can also download it as a ZIP and open it from disk with
no internet (`file://`). Students use it on smartboards, laptops, cheap Android phones and in every
browser. **No backend, no accounts, no fees, no API keys, no ads, no tracking.**

Project root: `C:\Claude\projects\edu_apps_library`

```
index.html, shared/home.js, shared/home-strings.js   library home (do NOT edit)
catalog.js                                           generated from apps/*/meta.json (do NOT edit)
shared/edu.css   design system (tokens + classes)   (do NOT edit)
shared/edu.js    window.EDU runtime: i18n, shell, helpers (do NOT edit)
apps/_template/  minimal example app: copy it
apps/<slug>/     ONE folder per app: index.html, app.js, strings.js, meta.json, optional content.js / data*.js
tools/verify.js  automated checks (static + 12 languages + interaction test + file:// + screenshots)
tools/tests/<slug>.test.js   Playwright interaction test for the app
```

## Hard rules
1. Only create or modify `apps/<your-slug>/**` and `tools/tests/<your-slug>.test.js`. Never touch
   `shared/`, `index.html`, `catalog.js`, other apps, or git. If you find a bug in `shared/`, work around it
   locally and report it in `shared_issues`.
2. Don't start servers with the preview tools and don't use any browser pane. `node tools/verify.js <slug>`
   runs headless Chrome for you. You can also write throwaway Playwright scripts in your scratchpad
   (`require('C:/Claude/projects/edu_apps_library/tools/node_modules/playwright-core')`, Chrome at
   `C:/Program Files/Google/Chrome/Application/chrome.exe`).
3. Use classic `<script src>` only. No ES modules, no bundlers, no npm in the app, and no `fetch()` of local
   files, because file:// would break. Put data in `.js` files that set `window.SOMETHING = ...`.
4. External libraries are allowed only when they really need to be there (ML, Python, SQLite, QR). Load
   them from `cdn.jsdelivr.net`, `unpkg.com` or `cdnjs.cloudflare.com` with a **pinned version**. Add
   `"internet"` to `meta.needs` and show a friendly translated "loading…" state and an offline/error message
   if the library can't load. Prefer zero dependencies; most apps need none.
5. Everything runs on the device. Never send user data anywhere. Persist with `EDU.store('<slug>')` only.
6. Script order in index.html: `../../shared/edu.js` → `strings.js` → (`content.js`/`data.js`) → `app.js`.
   `index.html` must have `<main id="app">` and link `../../shared/edu.css`. `app.js` calls
   `EDU.init({ slug: '<slug>', title: 'app_title' })` before rendering.

## Languages: all 12, always
`en hi bn mr gu pa or ta te kn ml ur` (Urdu is right-to-left).
- **Every** visible string (buttons, labels, headings, help text, placeholders, aria-labels, option labels,
  messages, chart labels, canvas text, sample/default content) comes from `strings.js` via
  `data-i18n="key"` / `data-i18n-placeholder` / `data-i18n-title` / `data-i18n-aria-label` /
  `data-i18n-html` attributes, or `EDU.t('key', {vars})` in JS.
- `strings.js` sets `window.APP_STRINGS = { en: {...}, hi: {...}, ... }` with **identical keys** in all 12
  languages. It must include `app_title` and `intro`. Use placeholders like `{n}`, with the same set in every language.
- Larger localized content (quiz questions, scenarios, sample texts, word lists, datasets labels) goes
  in `content.js`: `window.APP_CONTENT = { en: <shape>, hi: <same shape>, ... }`. verify.js checks that all
  12 languages have the same structure.
- Common words already exist in `EDU.COMMON` (you can use them directly via `t()` / `data-i18n`):
  library brand language theme print reset start stop pause resume next previous save download upload copy
  copied clear add delete edit close cancel done yes no help score correct wrong try_again share fullscreen
  import export loading settings search example result total saved_local needs_internet needs_camera
  needs_mic no_voice confirm_reset offline_ready.
- Write **natural, simple language** that a Class 6 student or a non-English-medium teacher understands.
  Don't translate word by word. Keep widely used English tech words in Latin script where Indians normally do
  (AI, Python, SQL, CSV, QR, URL, WhatsApp), and keep familiar loanwords (कंप्यूटर, डेटा). Use the correct
  script for each language; verify.js rejects, for example, Devanagari inside Bengali. Numbers use Latin
  digits (`EDU.fmt(n)`).
- Re-render all dynamic UI on language change: `EDU.onLang(render)`. User-typed content is never
  translated. Mark user content and code areas `class="no-i18n"` so the checker ignores them.
- RTL: use logical CSS (`margin-inline-start`, `padding-inline`, `inset-inline-end`, `text-align: start`)
  and never `left`/`right` for layout. Canvases aren't mirrored, and that's fine.

## EDU runtime API (shared/edu.js)
```
EDU.init({slug, title:'app_title', wide:false})   builds header (brand, ← All apps, title, language picker, theme) + footer
EDU.t(key, vars) · EDU.apply(rootEl) · EDU.onLang(fn) · EDU.lang · EDU.setLang(code) · EDU.LANGS · EDU.langInfo(code)
EDU.store(ns) → {get(k, default), set(k, v), remove(k)}        JSON in localStorage, never throws
EDU.el(tag, {class, text, i18n:'key', html, onclick, style:{}, dataset:{}, ...attrs}, ...children)
EDU.$(sel, root) · EDU.$$(sel, root) · EDU.esc(str)
EDU.toast(msg) · EDU.modal(contentElOrHtml, {title, onClose}) → close()
EDU.download(filename, textOrBlob, mime) · EDU.downloadCanvas(canvas, name) · EDU.pickFile(accept) → File · EDU.readText(file)
EDU.copy(text) · EDU.share(url, title) · EDU.pack(obj) → urlSafeString · EDU.unpack(str) → obj|null
EDU.csv.parse(text) → rows[][] · EDU.csv.stringify(rows) → text (with BOM, Excel-friendly)
EDU.fmt(number, Intl opts) · EDU.randInt(a,b) · EDU.shuffle(arr) · EDU.pick(arr) · EDU.clamp(v,lo,hi)
EDU.speak(text, {lang, rate, pitch, onend, onboundary}) → Promise<bool> (false = no voice for that language; show t('no_voice'))
EDU.stopSpeaking() · EDU.getVoices() · EDU.voiceFor(voices, code) · EDU.recognizer({lang, interim, continuous}) → SpeechRecognition|null
EDU.fullscreen(el?) · EDU.theme() → 'light'|'dark' · EDU.onTheme(fn) · EDU.css('--primary') → color string
```
Canvas apps read colors with `EDU.css('--text')`, `--primary`, `--accent`, `--c1`…`--c8`, `--border`, `--surface`
and redraw on `EDU.onTheme(...)`, so dark mode works.

## Design (shared/edu.css)
Use the classes below and don't restyle the shell:
`card panel callout(.accent/.success/.danger/.warning) btn(.btn-primary/.btn-accent/.btn-danger/.btn-ghost/.btn-sm/.btn-lg)
seg (segmented buttons with aria-pressed) tabs chip badge field check row stack grid grid-2 grid-3 split
table scroll-x stage big-number muted small tiny progress kbd present print-only no-print`.
Tokens: `--bg --surface --surface-2 --text --muted --border --primary --primary-soft --accent --accent-soft
--success --danger --warning --info --c1..--c8 --radius`.
- Design mobile-first. At 390 px wide nothing may scroll sideways; wrap tables in `.scroll-x`. Make touch
  targets ≥ 40 px and use pointer events (mouse + touch + stylus).
- It must also look good on a projector or smartboard: big, high-contrast, and fullscreen-friendly
  (`EDU.fullscreen()`) where useful.
- Add print styles for anything teachers print (worksheets, certificates, report cards, plans).
- Accessibility: real `<button>`s, `<label>` for inputs, `aria-live` on results, works from the keyboard.

## Pedagogy and quality bar
- It's a **complete, genuinely useful app**, not a demo. Sensible defaults and sample data make it useful
  within 5 seconds. Edge cases (empty input, huge numbers, bad files) never crash it.
- Top of page: a one-line `intro` explaining what students learn. Add a `<details class="card">` "How to use / Ideas for
  the classroom" section with 3–6 tips, including one classroom activity. AI apps also explain "what's happening inside"
  in simple words.
- Facts, formulas and terminology are correct and aligned with NCERT/CBSE where relevant. Content is age-appropriate.
  Use Indian context: names, places, ₹, examples.
- State is saved to `EDU.store` where users would expect it to survive a reload, and there's a Reset.

## meta.json
```json
{ "slug": "<slug>", "icon": "<one emoji>", "category": "learn-ai|teacher-tools|math|science|coding|languages|study-skills|digital-safety",
  "grades": "6-12" | "UG" | "all", "audience": ["student","teacher"], "needs": [] /* subset of camera, microphone, internet, speech */,
  "tags": ["english", "search", "keywords"],
  "title": { "en": "...", "hi": "...", ... all 12 },   /* ≤ 32 chars in en; same as app_title */
  "desc":  { "en": "...", ... all 12 } }               /* one sentence, ≤ 140 chars */
```

## Interaction test: tools/tests/<slug>.test.js
```js
module.exports = async ({ page, lang, expect, t, log }) => { /* drive the UI with ids/CSS selectors, not text */ };
```
verify.js runs it in `en` and `hi`, with dialogs auto-accepted, a fake camera and mic, and an empty localStorage.
Test the core workflow with at least 3 meaningful assertions on results (computed values, items created, state
changes), not just "element exists". For apps that load a CDN library, wait for it with a generous timeout.

## Definition of done
`node tools/verify.js <slug>` (run from the project root) prints **PASS**. Then **look at the screenshots** in
`tools/shots/<slug>/` (en-desktop, en-desktop-full, hi-mobile, ta-mobile, bn-mobile, ur-mobile, en-dark-mobile,
en-after-test) with the Read tool and fix anything ugly, cramped, clipped, unreadable in dark mode, or broken in RTL.
