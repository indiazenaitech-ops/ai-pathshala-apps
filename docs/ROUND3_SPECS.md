# Round 3: 77 → 100 apps (started 4 Oct 2026)

Owner's instruction: "get it to a 100 apps", then (17:20) "deploy all remaining apps, ok to go >100". 26 new apps → 103. Every app follows `C:\Claude\projects\edu_apps_library\AGENTS.md`
and the "Shared build notes" in `SHORTLIST.md` (QR: copy apps/qr-code-maker/qr.js; PDFs: pdf-lib 1.17.1 + pdfjs-dist 3.11.174
with a Blob worker; Indic text in PDFs via canvas PNG or HTML print CSS; money apps show the date rates were checked and
"estimate, not advice"; `meta.audience` may only contain "student"/"teacher": use ["teacher"] for adult tools and put the real
audience words in `tags`; `grades: "all"` for non-school apps).

Firebase is LIVE for the site (shared/firebase-config.js is set). On localhost and in verify, shared/cloud.js stays in Demo
mode unless `?live=1`, so tests never touch the real project.

## The 23 (slug · category · audience · needs)

Specs 1–8 are sections 17–24 of `SHORTLIST.md` (read them there in full).

| # | slug | category | meta.audience | needs | spec |
|---|---|---|---|---|---|
| 1 | visiting-card-maker | business | ["teacher"] | [] | SHORTLIST §17 |
| 2 | udhaar-khata | business | ["teacher"] | [] | SHORTLIST §18 |
| 3 | live-poll | business | ["teacher"] | ["internet"] | SHORTLIST §19 (EDUCloud API, no API/rules changes; participant URL apps/live-poll/?code=) |
| 4 | contact-list-vcf | marketing | ["teacher"] | [] | SHORTLIST §20 |
| 5 | utm-link-builder | marketing | ["teacher"] | [] | SHORTLIST §21 |
| 6 | timezone-meeting-planner | business | ["teacher"] | [] | SHORTLIST §22 |
| 7 | pdf-sign-fill | business | ["teacher"] | ["internet"] | SHORTLIST §23 |
| 8 | workplace-scam-drill | digital-safety | ["teacher"] | [] | SHORTLIST §24 |
| 9 | salary-slip-maker | business | ["teacher"] | [] | below |
| 10 | stock-register | business | ["teacher"] | [] | below |
| 11 | age-date-calculator | everyday | ["student","teacher"] | [] | below |
| 12 | split-bill | everyday | ["student","teacher"] | [] | below |
| 13 | invitation-card-maker | everyday | ["teacher"] | [] | below |
| 14 | social-post-resizer | marketing | ["teacher"] | [] | below |
| 15 | thumbnail-maker | marketing | ["teacher"] | [] | below |
| 16 | recipe-finder | everyday | ["student","teacher"] grades "all" | [] | below (owner's idea: what is in my kitchen → recipes) |
| 17 | spam-classifier-lab | learn-ai | ["student","teacher"] grades "8-12" | [] | below |
| 18 | recommendation-lab | learn-ai | ["student","teacher"] grades "8-12" | [] | below |
| 19 | ai-dictionary | learn-ai | ["student","teacher"] grades "all" | [] | below |
| 20 | daily-english-words | languages | ["student","teacher"] grades "all" | [] | below |
| 21 | seating-chart-maker | teacher-tools | ["teacher"] grades "all" | [] | below |
| 22 | sur-taal-trainer | everyday | ["student","teacher"] grades "all" | ["microphone"] | below (owner's idea: music) |
| 23 | indian-languages-phrasebook | languages | ["student","teacher"] grades "all" | ["speech"] | below (owner's idea: language learning) |
| 24 | barcode-label-maker | business | ["teacher"] | [] (or ["internet"] if a CDN lib is used) | below |
| 25 | sound-waves-lab | science | ["student","teacher"] grades "8-10" | ["microphone"] only if the optional mic mode is built | below |
| 26 | vedic-maths | math | ["student","teacher"] grades "5-10" | [] | below |

Existing apps that must NOT be duplicated (reuse or link instead): qr-code-maker, certificate-maker, class-timer, word-counter,
read-aloud, speech-lab, quiz-maker, live-quiz, attendance-register, image-compressor, festival-poster-maker, resume-builder,
biodata-maker, salary-tax-calculator, gst-invoice-maker, gst-calculator, emi-savings-calculator, math-practice, typing-tutor,
flashcards, study-planner, phishing-spotter, password-checker, screen-recorder, pdf-merge-split, pdf-compress-convert.

## Specs 9–23

### 9. Salary Slip Maker (`salary-slip-maker`) · business
Monthly payslip generator for small businesses and HR. Company block (name, address, logo upload, optional GSTIN/PAN shown
masked), employee block (name, employee ID, designation, department, date of joining, bank account last 4 digits, UAN and PAN
masked), pay month, paid days / LOP days (prorate). Earnings: basic, HRA, DA, conveyance, special allowance, overtime, bonus,
custom rows. Deductions: employee PF 12% of basic (toggle; note the ₹15,000 wage ceiling option), ESI 0.75% when gross ≤ ₹21,000
(toggle), professional tax from a state table (Maharashtra, Karnataka, West Bengal, Tamil Nadu, Gujarat, Andhra, Telangana,
Madhya Pradesh, Odisha, Kerala, Bihar; others = manual), TDS manual, salary advance, custom rows. Net pay in figures and in words
(English and Hindi, lakh/crore). Three templates (simple, formal, bilingual English + chosen language). Batch mode: CSV of
employees (name, id, basic, hra, …) → one slip each, print all. Save company and employees in EDU.store; print A4 and A5 with
"Save as PDF"; WhatsApp share text (amount only, no bank details). All rates in one data object with "rates checked Oct 2026;
estimate, not legal or tax advice". Edge: zero deductions, LOP greater than days, very long names, Urdu RTL slip, dark mode never
affects print. Test: basic 20,000 + HRA 8,000 with PF on → PF 2,400 and net correct; words correct; CSV with 3 rows → 3 slips.

### 10. Stock Register (`stock-register`) · business
Inventory register for shops and small godowns; data stays in this browser. Items: name, SKU or barcode text, category, unit
(pcs, kg, litre, box; decimals allowed), purchase price, selling price, GST %, minimum stock, supplier, optional expiry date.
Entries: stock in, stock out, adjustment, each with date, quantity, note. Views: current stock with low-stock and out-of-stock
highlights, search and category filter, stock value at cost and at sale price, daily and monthly movement report, "expiring in
30 days" list. Barcode-scanner friendly: a focused input that accepts keyboard-wedge scanners (text + Enter) to find or add an
item. CSV import and export, JSON backup and restore, 7-day backup reminder, navigator.storage.persist() request, undo delete,
quota warning near 4 MB. Print a stock-take sheet. Edge: negative stock warning, 5,000 items, duplicate SKUs, RTL. Test: item
with min 5, in 10, out 7 → stock 3 and low-stock flag; CSV export has the item; backup → reset → restore equality.

### 11. Age & Date Calculator (`age-date-calculator`) · everyday
Exact age (years, months, days) as on today or an "as on" date (exam or job cut-off, e.g. 01-01-2027), age in months, weeks and
days, next birthday and weekday of birth. Eligibility check: minimum and maximum age limits → eligible or not, by how much, and
the date range of birth that qualifies. Date difference between two dates. Add or subtract days, weeks, months, and working days
(skip Saturday/Sunday, optional pasted holiday list). Notice-period and last-working-day calculator. Countdown to a date.
Several people in a list, saved locally. Indian DD-MM-YYYY display with a native date picker, copy result as text, WhatsApp
share. Edge: 29 February, month-end arithmetic, future date of birth, local dates only (no timezone drift). Test: DOB 15-08-1990
as on 15-08-2026 → 36 years 0 months 0 days; 30-day notice from 01-10-2026 → 31-10-2026; working days between two dates.

### 12. Split Bill & Trip Expenses (`split-bill`) · everyday
Members, expenses (who paid, amount, split equally, by shares, exact amounts or percent), running balance per member, minimal
settlement plan (fewest transfers), UPI deep link per settlement (upi://pay with pa, pn, am, cu=INR, UPI ID entered by the
member) and a WhatsApp reminder text in 12 languages. Restaurant mode: items assigned to people, GST and service charge split in
proportion. Several groups saved locally, CSV export, summary as text and as a PNG card. Edge: paise rounding so totals match,
members with zero share, removing a member who still owes, 50 expenses. Test: 3 members, A pays 900 split equally → B and C owe
300 each and the settlement plan has 2 transfers; restaurant bill with 5% GST splits in proportion.

### 13. Invitation Card Maker (`invitation-card-maker`) · everyday
Invitations for WhatsApp and print: wedding, engagement, birthday, housewarming (griha pravesh), naming ceremony, pooja /
Satyanarayan katha, retirement, school annual day, shop opening. Twelve or more templates with Indian motifs drawn as SVG or
canvas (borders, diya, kalash, floral, geometric; no copyrighted images), colour themes. Fields per occasion: names, date and
time, venue, map link, RSVP phone, "with best compliments" family line, Ganesh/Om symbol toggle, optional photo. Text in any of
the 12 languages with the right font (Google Fonts when online, system fallback). Sizes: WhatsApp 1080×1350, story 1080×1920,
A5 print at 300 dpi, 2-up A4. Export PNG from canvas, print, save drafts, WhatsApp share. Edge: long venue text shrinks to fit,
Urdu RTL, photo crop, offline fonts. Test: fill names and date → PNG export over 50 KB and the preview contains the names;
switching template keeps the data.

### 14. Social Post Resizer (`social-post-resizer`) · marketing
One image or poster → every platform size: Instagram post 1080×1080, portrait 1080×1350, story and reel 1080×1920, YouTube
thumbnail 1280×720 and banner 2560×1440 (safe area 1546×423 shown), WhatsApp DP 640×640 and status 1080×1920, Facebook post and
cover, LinkedIn banner, X header, Google Business photo. Drag to reposition, wheel or pinch to zoom, "fit" (blurred or solid
background) or "fill" (crop), safe-area overlays, optional caption band and logo corner. Export selected sizes as PNG or JPG with
a quality slider, one by one (keep needs empty; jszip only if it is worth it, then needs internet). Everything on the device.
Edge: HEIC shows a message, 20-megapixel photo is downscaled first, RTL. Test: 2000×1000 image → the 1080×1080 export is
1080×1080 and the 1080×1920 export is 1080×1920; fit and fill outputs differ.

### 15. Thumbnail Maker (`thumbnail-maker`) · marketing
YouTube thumbnail (1280×720) and Shorts cover (1080×1920) maker. Upload a photo or screenshot; layouts: photo left, right, full,
split; a big 3–6 word headline with outline and shadow in Hindi and regional fonts (Google Fonts when online, system fallback),
one highlighted word in a second colour, drawn stickers (arrow, circle, badge, emoji), brand strip with channel name and logo.
Ten templates in the style of Indian education, news and vlog channels, a contrast check and a "readable at 160 px" mini
preview, export PNG or JPG under 2 MB with the size shown, saved variants for A/B, all on the device. Edge: long text auto-fit,
Urdu RTL, dark mode canvas colours. Test: type a headline → export is 1280×720 and under 2 MB; a saved variant restores.

### 17. Spam Classifier Lab (`spam-classifier-lab`) · learn-ai · Class 8–12
Naive Bayes spam-vs-ham trainer, a CBSE AI classic. Forty labelled sample SMS per language in content.js (fake lottery, OTP
fraud, offers vs friends, school notices, delivery updates). Show tokens, word counts per class, P(word | spam) with Laplace
smoothing, then classify a new message with the maths shown step by step (log-odds bar per word). Add your own labelled
examples and retrain live, accuracy on a held-out set, confusion matrix, "why did it get this wrong?" explanations, "what is
happening inside" in simple words, projector mode. Edge: empty message, unseen words, Indic tokenising on spaces and
punctuation. Test: with the samples, "You won 10 lakh lottery, click link" = spam and "Class cancelled tomorrow" = ham; adding 3
ham examples changes a probability.

### 18. Recommendation Lab (`recommendation-lab`) · learn-ai · Class 8–12 and everyone
"Why does YouTube recommend this?" Rate 12 of 30 fictional videos (1–5 stars) and compare three recommenders side by side:
popularity, content-based (tag cosine similarity) and collaborative filtering (user–user similarity against 40 built-in fictional
users), with the similar users and the maths shown. Filter-bubble demo: keep clicking one genre and watch a diversity meter drop.
Add a friend's ratings. Simple explanations and discussion questions about bias and privacy. Edge: fewer than 3 ratings, ties.
Test: rating 3 cricket videos 5 stars → top recommendations are cricket-tagged; the neighbour list is non-empty; the diversity
meter falls after 5 same-genre clicks.

### 19. AI Dictionary (`ai-dictionary`) · learn-ai · all
"AI शब्दावली": 120 AI, ML and GenAI terms (algorithm, bias, chatbot, dataset, deepfake, embedding, hallucination, LLM, prompt,
token, training, fine-tuning, overfitting, neural network, computer vision, NLP, RAG, agent, and so on). Each entry: one-line
meaning, a two-line simple explanation with an everyday Indian example, related terms, the English term kept in Latin script.
Content in all 12 languages (content.js, same shape). Search (any script), A–Z, topics (basics, ML, GenAI, safety, careers),
term of the day, flashcard mode, quiz mode (meaning → term MCQ), read aloud with EDU.speak, WhatsApp share of a term, printable
glossary. Test: searching "token" finds the entry; the quiz scores; switching language keeps the open term.

### 20. Daily English Words (`daily-english-words`) · languages · all
Six hundred common English words in 60 daily lists of 10 (greetings, office, shop, travel, interview, school, health, money)
with the meaning in each of the 11 Indian languages, pronunciation respelling, an example sentence in English with its
translation, audio with EDU.speak. Learn → practice (MCQ, type the word, listen and pick) → spaced repetition queue (again,
hard, good, easy; due dates in EDU.store), streak and daily goal, packs (interview, WhatsApp, shop), printable worksheet, share
progress. Edge: missing speech voice shows no_voice; Urdu RTL meanings. Test: day 1 has 10 words; 3 MCQ answers → score;
"again" schedules the word for today.

### 21. Seating Chart Maker (`seating-chart-maker`) · teacher-tools · all
Classroom and exam seating planner. Paste names or CSV (name, roll number, gender, needs: front row, glasses, left-handed).
Room layouts: rows × columns, pairs, groups of 4, U-shape, exam hall with gaps. Arrangements: alphabetical, roll number,
random (fair shuffle), mixed ability (paste marks), boy–girl alternate, keep-apart pairs, must-sit-in-front list. Drag to swap.
Exam mode: roll-number desk slips, question-paper sets A/B alternating, invigilator list. Print an A4 chart (big enough for the
projector) and desk name labels. Save several rooms and classes. Edge: more students than seats, Urdu RTL names, 120 students.
Test: 30 names into 5×6 → 30 seats filled; a keep-apart pair is never adjacent; sets A/B alternate.

### 16. Recipe Finder: what is in my kitchen? (`recipe-finder`) · everyday (owner's idea, 4 Oct)
"Ghar mein kya hai?" → what can I cook. Content in content.js, same shape in all 12 languages: at least 120 Indian home
recipes across regions (North, South, East, West), meal types (breakfast, dal, sabzi, rice, roti/paratha, snacks, tiffin for
kids, sweets, drinks, 10-minute, festival) with canonical ingredient ids, quantities for 2 people (scale to 1/2/4/6), steps,
time, difficulty, diet (veg, vegan, egg, non-veg, Jain / no onion-garlic), region and tags. Ingredient picker: search in any of
the 12 languages and in romanised Hindi (dahi, pyaaz, aloo), synonyms (curd/dahi/yogurt), quick pantry presets ("I have the
basics: oil, salt, spices, atta, rice"), tap chips for what you have. Matching: rank recipes by share of ingredients you have,
show "you are missing: X" with substitutes (no curd → lemon), filters (diet, time, meal, region), "aaj kya banayein?" random
pick, favourites, "cook now" mode with big steps, per-step timers and read-aloud via EDU.speak, shopping list of missing
items (copy / WhatsApp), print a recipe, share a recipe link (EDU.pack). Explain in one line how the matching works (a simple
recommender). No images needed (emoji per category is fine). Edge: no ingredients selected (show quick recipes), plural and
spelling variants, 120 recipes × 12 languages is a lot of text: generate it carefully and keep every language natural. Test:
select aloo, pyaaz, tamatar, oil, salt → aloo-tamatar sabzi ranks in the top 3 with 100% match; a recipe missing one
ingredient shows it as missing; scaling 2 → 4 doubles quantities; shopping list contains the missing item.

### 22. Sur & Taal Trainer (`sur-taal-trainer`) · everyday (owner's idea, 4 Oct: music)
Sing in tune and keep the beat. Tanpura drone synthesised with Web Audio (Sa–Pa–Sa, choose Sa from C to B, volume).
Pitch detector from the microphone (autocorrelation or YIN on the AnalyserNode time-domain buffer, 20–1000 Hz) that shows
the swar you are singing (Sa Re Ga Ma Pa Dha Ni, komal/teevra marked) relative to the chosen Sa, a cents meter (flat / in
tune / sharp), and a western note name too. Sargam practice: 12 alankars (Sa Re Ga Ma…, Sa Re Sa Re Ga…) played by the app,
then you repeat and get a score per note; hold-the-note exercise (stay within ±20 cents for 3 seconds). Taal metronome:
Teentaal (16), Keherwa (8), Dadra (6), Rupak (7), Jhaptaal (10), Ektaal (12) with sam and khali accents, synthesised bol-like
sounds (no samples), tempo 40–200, visual beat circle with the bols written in the chosen language. Instrument tuner mode
(guitar, ukulele, violin standard tunings, A4 = 440 Hz adjustable). Start audio only on a button press; mic permission
explained; works without a mic for drone and metronome (needs ["microphone"]). Explain in simple words how a computer hears
pitch. Edge: noisy room (confidence threshold), octave errors, no microphone, headphone advice to avoid feedback. Test:
feed a synthesised 261.6 Hz tone through the fake mic (verify.js provides a fake mic; otherwise test the detector function
directly with a generated sine buffer) → detected note C4 / Sa within ±10 cents; metronome at 120 bpm Teentaal cycles in 8 s;
alankar scoring returns a number.

### 23. Learn any Indian language (`indian-languages-phrasebook`) · languages (owner's idea, 4 Oct)
A phrasebook and trainer between any two of the 12 languages. Content in content.js with the SAME shape in all 12 languages:
at least 400 phrases and words in 40 topics (greetings, yes/no/please, numbers 1–100, days and time, family, food and
ordering, market and bargaining, auto/bus/train, directions, doctor and pharmacy, bank and office, school, home, festivals,
emergencies, small talk), each with the phrase in its own script plus a romanised transliteration (Latin letters, readable by
an Indian learner). The UI language is "I speak"; "I want to learn" picks any other language. Each card: target phrase, its
transliteration, meaning in my language, audio via EDU.speak in the target language (slow replay; show no_voice when the
device lacks that voice). Practice modes: listen and pick, match pairs, type or choose, and speak-and-compare with
EDU.recognizer in the target language when available. Script basics for the target language: vowel and consonant tables
with audio. Daily 10 with spaced repetition in EDU.store, streak, favourites, print a phrase sheet (my language + target +
transliteration), WhatsApp share of a phrase. Edge: same source and target (block), RTL Urdu as target or source, missing
voices, long Malayalam/Tamil strings on 390 px. Test: source en target ta → the greeting card shows Tamil script and a
transliteration; the matching game scores; the numbers trainer shows 1–10; switching the UI language keeps the chosen target.

### 24. Barcode & MRP Label Maker (`barcode-label-maker`) · business
Code 128 and EAN-13 (check digit computed and validated) barcodes. Prefer a small built-in encoder; if a library is used, pin
JsBarcode on jsDelivr (confirm the version exists) and set needs ["internet"]. Label fields: product name, MRP in ₹ with the
"inclusive of all taxes" line, net quantity, packed date, batch, best-before, FSSAI number, "Mfd by / Mkt by". Sheet presets: A4
65 per sheet (38×21 mm), 24 per sheet, 50×25 mm 2-column roll, custom mm. Batch from CSV (name, code, MRP, qty) → sheet; print at
100% tip; PNG export; optional QR (copy qr.js) for a product link or UPI. Edge: invalid EAN, long names, printer margins, RTL.
Test: 890123456789 → check digit 0 → 8901234567890; CSV 3 rows → 3 labels; a Code 128 SVG or canvas is present.

### 25. Sound & Waves Lab (`sound-waves-lab`) · science · Class 8–10
Web Audio tone generator (20–20,000 Hz, amplitude, waveform) with a live oscilloscope and spectrum (AnalyserNode), pitch vs
loudness, a hearing-range test with a safe volume cap and a headphones warning, beats from two tones, an echo animation
(distance → delay at 343 m/s), wavelength = v/f calculator, musical notes (A4 = 440 Hz), string and pipe harmonics, optional
microphone mode to see your own voice (then needs ["microphone"]), a quiz aligned with the NCERT Class 8/9 Sound chapters.
Start only on a button press (autoplay rules). Keep it distinct from sur-taal-trainer (that one is singing practice; this one
is the physics of sound). Test: 440 Hz → wavelength about 0.78 m; 440 + 444 Hz → 4 beats per second; quiz scoring.

### 26. Vedic Maths (`vedic-maths`) · math · Class 5–10
Mental-maths tricks with animated steps and drills: multiply by 11, by 9s, by 5 and 25; squares ending in 5; squares near a base
(Nikhilam: 98², 103²); vertically and crosswise 2×2 and 3×2 multiplication; division by 9; cube roots of perfect cubes; percentage
tricks; digit-sum checking. Each trick: simple explanation, step animation with an example, "try yourself" with instant check,
a timed drill with a best time, progress per trick in EDU.store, printable worksheet, projector mode. Edge: large inputs,
keyboard entry. Test: 97 × 96 by Nikhilam → 9312 with the steps shown; a 5-question drill is scored; the worksheet has 20
problems.
