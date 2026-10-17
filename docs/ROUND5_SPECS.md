# Round 5: 20 new apps (started 17 Oct 2026, cloud session)

Owner's instruction (17 Oct): "while the other session is building apps, make more apps". The other session (branch
`claude/round4-apps`) is finishing ai-dictionary, daily-english-words, workplace-scam-drill, barcode-label-maker and
recipe-finder and starting a `games` category. **Round 5 does not touch any of those**, and builds no games.

Every app follows [AGENTS.md](../AGENTS.md) and [CLAUDE.md](../CLAUDE.md). Branch: `claude/fable-round5-apps`
(cloud session: never push to `main`, never run `tools/publish.sh`; the catalog is rebuilt by `publish.sh` on the PC).

## Shared notes for every round-5 app

- Only `apps/<slug>/**` and `tools/tests/<slug>.test.js`. Never `shared/`, `index.html`, `catalog.js`, other apps, git.
- **No libraries** (`"needs": []` everywhere in this round). Draw with SVG/canvas by hand; read colours with
  `EDU.css('--c1')`…, redraw on `EDU.onTheme`. If an app really needs a QR code, copy `apps/qr-code-maker/qr.js` into the
  app folder (note the origin in a comment).
- Reference apps to copy patterns from: `apps/password-checker` (tabs with keyboard support, quiz, printable worksheet,
  a test with many assertions, `engine.js` split), `apps/projectile-motion` (canvas lab, `physics.js` + `view.js` split,
  dark-mode redraw, state cleaning on load), `apps/gst-calculator` and `apps/split-bill` (tools for adults:
  `waKey: 'shell_wa_tool'`, numbers kept left-to-right in Urdu, privacy line, print), `apps/chart-maker` (hand-drawn SVG),
  `apps/marks-report-card` (A4 print layouts).
- Top of page: one-line `intro`. A `<details class="card">` "How to use / Ideas" with 3–6 tips: school apps include one
  classroom activity, tools include one idea for work or home. Labs also get a short "What is happening inside" or
  "Words to know" card in simple language.
- State in `EDU.store('<slug>')` (clean it on load like projectile-motion does), a Reset button with `confirm_reset`,
  and print styles wherever a teacher or shopkeeper would print.
- Mobile-first at 390 px, nothing scrolls sideways, touch targets ≥ 40 px, real `<button>`s, `<label>`s, `aria-live`
  on results, keyboard works. Numbers: Western digits, `EDU.fmt`; in Urdu wrap numbers/amounts in an LTR span.
- Facts and formulas: NCERT/CBSE-aligned, checked by hand against an independent calculation. Money and legal tools say
  "estimate, not advice", show the month the rules/rates were checked (Oct 2026) and keep every rate editable.
- Languages: natural, simple sentences in all 12; keep AI, CSV, UPI, GST, PDF, QR, WhatsApp, PAN, HRA, CGPA, pH in Latin
  script; use the right script (verify.js rejects mixed scripts). `meta.title.en` ≤ 32 chars = `app_title`;
  `meta.desc.en` ≤ 140 chars; tags carry the real audience and search words (student, teacher, shop, office, exam…).
- `tools/tests/<slug>.test.js`: at least 10 meaningful assertions on computed values and state (select by id/CSS, never
  by text), including one reload-persistence check and one reset check.
- Definition of done: `node tools/verify.js <slug>` prints PASS with 0 errors (warnings only when justified), then every
  screenshot in `tools/shots/<slug>/` has been looked at and anything cramped, clipped, unreadable in dark mode or broken
  in RTL has been fixed. Then an independent QA pass (real inputs, Tamil + Urdu at 390 px, edge cases, maths checked).

Existing apps that must NOT be duplicated (link to them instead): form-photo-resizer, image-compressor, background-remover,
qr-code-maker, certificate-maker, worksheet-generator, math-practice, graph-plotter, statistics-calculator, unit-converter,
emi-savings-calculator, salary-tax-calculator, gst-invoice-maker, visiting-card-maker, festival-poster-maker,
thumbnail-maker, word-counter, read-aloud, speech-lab, indian-languages-phrasebook, phishing-spotter, password-checker.

## The 20 apps (slug · icon · category · grades · meta.audience)

| # | slug | icon | category | grades | audience | wave |
|---|---|---|---|---|---|---|
| 1 | trigonometry-lab | 📐 | math | 9-12 | student, teacher | 1 |
| 2 | equation-solver | 🧮 | math | 7-10 | student, teacher | 1 |
| 3 | motion-graphs-lab | 🚗 | science | 9-11 | student, teacher | 1 |
| 4 | acid-base-ph-lab | 🧪 | science | 7-10 | student, teacher | 1 |
| 5 | flowchart-maker | 🔀 | coding | 6-12 | student, teacher | 1 |
| 6 | lesson-plan-maker | 📝 | teacher-tools | all | teacher | 1 |
| 7 | fake-news-detective | 🕵️ | digital-safety | 6-12 | student, teacher | 1 |
| 8 | cgpa-percentage-calculator | 🎓 | study-skills | all | student, teacher | 1 |
| 9 | electricity-bill-calculator | 💡 | everyday | all | student, teacher | 1 |
| 10 | gold-jewellery-calculator | 💍 | everyday | all | student, teacher | 1 |
| 11 | rent-receipt-maker | 🏠 | everyday | all | student, teacher | 1 |
| 12 | menu-card-maker | 🍽️ | business | all | teacher | 1 |
| 13 | hcf-lcm-lab | 🌳 | math | 4-8 | student, teacher | 2 |
| 14 | solar-system-lab | 🪐 | science | 5-8 | student, teacher | 2 |
| 15 | data-structures-visualizer | 🧱 | coding | 11-12 | student, teacher | 2 |
| 16 | handwriting-practice-sheets | ✍️ | teacher-tools | 1-5 | teacher, student | 2 |
| 17 | passport-photo-sheet | 🪪 | everyday | all | student, teacher | 2 |
| 18 | food-calorie-calculator | 🍛 | science | all | student, teacher | 2 |
| 19 | colour-palette-maker | 🎨 | marketing | all | teacher | 2 |
| 20 | indic-typing-tool | ⌨️ | languages | all | student, teacher | 2 |

Apps in `everyday`, `business` and `marketing` pass `EDU.init({ ..., waKey: 'shell_wa_tool' })` and use
`"grades": "all"`. cgpa-percentage-calculator and food-calorie-calculator are used by adults too, so they also use
`"grades": "all"` and `waKey: 'shell_wa_tool'`.

---

## Wave 1

### 1. Trigonometry Lab (`trigonometry-lab`) 📐 · math · 9-12
Interactive trigonometry for CBSE Classes 9–12 (NCERT Class 10 Ch 8–9, Class 11 Ch 3).
- **Unit circle** (canvas): drag a point on the circle; see θ in degrees and radians, the right triangle inside, sin θ
  and cos θ as the vertical/horizontal legs, tan θ as the tangent-line length, the six ratios with signs, the quadrant
  rule (All-Sin-Tan-Cos), the reference angle. Snap button for standard angles (0, 30, 45, 60, 90 … 360). Projector
  fullscreen. Angles > 360° or negative are reduced; tan/sec at 90°, 270° show "not defined".
- **Ratio table and calculator**: the exact table for 0°, 30°, 45°, 60°, 90° with surds (the √0/2 … √4/2 memory trick
  shown), complementary pairs; a calculator that accepts degrees or radians (also text like `pi/6`, `2pi/3`) and gives all
  six ratios: exact surd/fraction form for standard angles (also 120°, 135°, 150°, 180°, 210° …), decimals otherwise;
  inverse functions with principal values; degree ↔ radian converter.
- **Heights and distances solver** with a live diagram (SVG): the NCERT Class 10 cases: (a) angle of elevation from a
  point at known distance → height; (b) angle of depression from a known height → distance; (c) two angles of elevation
  from two points on the same side/opposite sides → height and distance; (d) object on top of a tower (flagstaff) with
  two angles; (e) ladder against a wall. Optional observer eye height. Steps written out (tan 30° = 1/√3, so h = 30/√3 =
  10√3 ≈ 17.32 m), exact surd answer when the angle is standard, decimal always.
- **Identities and practice**: 10 identity MCQs (sin²θ + cos²θ = 1, 1 + tan²θ = sec²θ, 1 + cot²θ = cosec²θ,
  complementary angles, sign in each quadrant) with explanations, and a 10-question timed drill on standard values with
  score, best score and a printable worksheet (12 questions + answer key).
- content.js: the identity questions and 6 word problems (Indian context: temple gopuram, Qutub Minar 72.5 m, kite,
  lighthouse) in all 12 languages.
- Test: sin 30° = 0.5; tan 45° = 1; tan 90° shows "not defined"; sin 150° exact = 1/2; case (a) distance 30 m, 30° →
  10√3 and 17.32; case (c) two points 20 m apart, 30° and 60° → height 10√3 ≈ 17.32; drag sets the angle and the
  readout; identity quiz scores correctly; worksheet 12 rows + key; angle persists across reload; reset.

### 2. Equation Solver with Steps (`equation-solver`) 🧮 · math · 7-10
Solve and *show every step*, NCERT style. Own small parser (never `eval` user text): integers, decimals, fractions,
parentheses, implicit multiplication (`2x`, `3(x+1)`), `x^2`/`x²`, variables x and y. Bad input → friendly message.
- **Linear in one variable** (Class 7–8): `3x + 5 = 2x - 7`, `2(x-3) = 4x + 1`, `x/2 + 3 = 7`. Steps: expand, collect
  like terms, transpose, divide; then "Check" by substituting. Identities / no solution handled (`2x+1=2x+3`).
- **Pair of linear equations** (Class 10 Ch 3): two equations typed freely or as a₁x + b₁y = c₁ boxes. Consistency check
  a₁/a₂ vs b₁/b₂ vs c₁/c₂ → unique / infinitely many / no solution, with the sentence used in NCERT. Solve by the chosen
  method with every line: substitution, elimination, cross-multiplication (the standard layout). Small SVG graph with
  both lines and the intersection point (also shows parallel/coincident lines).
- **Quadratic** (Class 10 Ch 4): ax² + bx + c = 0 (accept `x^2 - 5x + 6 = 0`, also non-standard order). Discriminant and
  nature of roots; solve by factorisation (splitting the middle term: show p + q = b, pq = ac and the pairs tried),
  completing the square, quadratic formula; roots exact (reduced fractions, simplified surds like (2 ± √10)/2 → 1 ± √10/2)
  and decimal; parabola graph with roots and vertex; verify by substitution. Complex roots shown as "no real roots".
- **Word problems and practice**: 6 NCERT-style word problems per mode (content.js, localized) with a "set up the
  equation" hint; a generator for practice by level with "show steps"; printable worksheet (10 problems + answer key).
- Fraction arithmetic exact (gcd), surd simplification (√50 = 5√2), pretty printing (no `+ -3`).
- Test: 3x+5=2x−7 → x = −12; 2x+3y=12 & x−y=1 → (3, 2) by all three methods; 2x+3y=9 & 4x+6y=18 → infinitely many;
  x+2y=4 & 2x+4y=12 → no solution; x²−5x+6=0 → 2, 3 with p, q = −2, −3; x²+2x+5=0 → D = −16, no real roots;
  2x²−4x−3=0 → exact (2 ± √10)/2 and 2.58, −0.58; 4x²−12x+9 → equal roots 3/2; worksheet 10 rows + key; `3x+ = 5` shows
  an error and no page error; last problem persists after reload; reset.

### 3. Motion Graphs Lab (`motion-graphs-lab`) 🚗 · science · 9-11
NCERT Class 9 Ch 8 (Motion) and Class 11 Ch 3 (Motion in a straight line).
- **Scenario builder**: a vehicle on a straight road (canvas animation, choose car/bus/cycle/train emoji or shapes).
  Segment table: each row is "for t seconds: constant velocity v" or "accelerate from u to v in t". Three graphs drawn in
  sync (SVG or canvas): distance–time, velocity–time, acceleration–time, with the area under v–t shaded and labelled as
  displacement; readouts of distance, displacement, average speed, average velocity (negative velocity = moving back).
  Slope tool: drag two markers on the d–t or v–t graph to read slope = speed / acceleration. Presets: "bus between two
  stops", "cyclist uphill", "train leaving the station", "ball thrown up" (velocity changes sign).
- **Equations of motion solver**: tick the knowns among u, v, a, t, s → the unknowns with the equation used and steps
  (v = u + at, s = ut + ½at², v² = u² + 2as); free-fall mode (g = 9.8, Moon 1.6, Mars 3.7); a graphical-derivation card
  (why area under v–t gives s). Units m/s with km/h converter.
- **Graph quiz**: 12 "which graph matches the story?" items and 8 "read the graph" numeric questions (speed from a d–t
  line, distance from a v–t area), with explanation, score, best score. Printable worksheet (6 graph questions + key).
- **Words to know**: distance vs displacement, speed vs velocity, uniform/non-uniform, average speed (Delhi → Agra 200 km
  in 2.5 h), uniform circular motion v = 2πr/T.
- Test: segments (0→20 m/s in 10 s; 20 m/s for 20 s; 20→0 in 5 s) → distance 100 + 400 + 50 = 550 m; equations u=0, a=2,
  t=5 → v=10, s=25; u=0, a=10, s=20 → v=20; free fall t=2 → s=19.6; "ball thrown up" → displacement 0 after the round
  trip, distance > 0; slope tool reads 20 m/s on a 20 m/s segment; quiz scoring; worksheet rows; reload keeps the segment
  table; reset.

### 4. Acids, Bases & pH Lab (`acid-base-ph-lab`) 🧪 · science · 7-10
NCERT Class 7 Ch 5 and Class 10 Ch 2.
- **pH scale explorer**: a 0–14 colour bar; 24 everyday substances with approximate pH (lemon juice 2, soft drink 2.5,
  vinegar 3, tomato 4.2, curd 4.5, black coffee 5, tea 5.5, rain water 5.6, milk 6.5, saliva 6.8, pure water 7, blood
  7.4, sea water 8, baking soda solution 8.5, toothpaste 9, antacid 9.5, soap 10, milk of magnesia 10.5, ammonia 11.5,
  lime water 12.4, bleach 12.5, NaOH 1 M 14, HCl 1 M 1, gastric juice 1.2). Tap one → pH, acidic/basic/neutral, [H⁺] =
  10⁻ᵖᴴ mol/L, "10× more acidic than …" comparisons, and what each indicator shows.
- **Indicator lab**: choose a substance and an indicator: blue/red litmus, turmeric, phenolphthalein, methyl orange,
  universal indicator, china rose (shoe-flower) → the colour result drawn in a test tube with a one-line "why". A game:
  "guess the pH from the universal-indicator colour" (10 rounds, score).
- **Neutralisation (titration) simulator**: strong acid + strong base (default 25 mL of 0.1 M HCl, add 0.1 M NaOH drop by
  drop with a slider/button): live pH curve, pH computed from moles ([H⁺] = (n_acid − n_base)/V_total; at equivalence pH 7),
  phenolphthalein turns pink at the end point, the balanced equation HCl + NaOH → NaCl + H₂O. Also "antacid vs stomach
  acid" and "bee sting (formic acid) vs baking soda" stories.
- **Salts**: NaCl neutral, Na₂CO₃ basic, NH₄Cl acidic, CH₃COONa basic, with the "strong parent wins" rule; uses of common
  salt, washing soda, baking soda, bleaching powder, plaster of Paris (Class 10).
- **pH in daily life** cards (tooth decay below pH 5.5, acid rain below 5.6, soil pH, self-defence of animals) and a
  15-MCQ quiz with explanations; printable one-page summary.
- Test: lemon → acidic, pH 2, [H⁺] = 0.01; phenolphthalein in NaOH → pink, in HCl → colourless; red litmus in soap → blue;
  25 mL 0.1 M HCl needs 25 mL 0.1 M NaOH to reach pH 7 (pH < 7 at 20 mL, > 7 at 30 mL); universal-indicator game
  scores; quiz score; last selection persists; reset.

### 5. Flowchart & Algorithm Lab (`flowchart-maker`) 🔀 · coding · 6-12
CBSE Class 11 CS Ch 4 (algorithms, flowcharts, pseudocode, decomposition) and Class 6–8 computational thinking.
- **Structured block editor**: Start/End automatic; add Input, Output, Process (`total = a + b`), Decision (condition with
  Yes/No branches, each branch holds blocks), Loop (`while condition` and `for i = 1 to n`), nested freely; move up/down,
  edit, delete. The flowchart (SVG) redraws automatically with standard symbols: terminal (rounded), I/O (parallelogram),
  process (rectangle), decision (diamond), loops with a back arrow, arrows labelled Yes/No, clean top-down auto layout.
- **Pseudocode and Python** views of the same program (CBSE pseudocode style: INPUT, PRINT, IF…ELSE…END IF,
  WHILE…END WHILE, FOR…END FOR; Python read-only), synced live.
- **Run / dry run**: step-by-step execution highlighting the current symbol, a variable table, an output console, input
  prompts via a small panel (values can be pre-filled); own safe expression evaluator (+ − × ÷, %, **, comparisons,
  and/or/not, strings for printing; no `eval`). Guards: max 10,000 steps (infinite loop message), division by zero, unknown
  variable. Dry-run table export (CSV).
- **Examples** (content.js, localized names/prompts): sum of two numbers, largest of three, even or odd, factorial, table of
  n, grade from marks, sum 1..n, prime check, simple interest, ATM withdrawal with balance check, leap year, GCD.
- Export: PNG of the flowchart (canvas render of the SVG), print, save/load JSON, share link (`EDU.pack` in the URL).
- "Words to know": algorithm, flowchart, pseudocode, variable, condition, loop, dry run, decomposition.
- Test: load "largest of three" → the SVG contains 2 decision diamonds; run with 5, 9, 2 → output 9; factorial 5 → 120 and
  the variable table shows i and fact; editing a condition changes the output; infinite loop stopped with the message;
  division by zero message; PNG export triggers a download; JSON save/load round-trips; reload keeps the program; reset.

### 6. Lesson Plan Maker (`lesson-plan-maker`) 📝 · teacher-tools · all · ["teacher"]
Form → a clean printable A4 lesson plan (PDF via print), in the teacher's language.
- **Formats**: CBSE/NCERT classic (school, class, section, subject, chapter/topic, date, period and duration, learning
  outcomes, previous knowledge, teaching aids, introduction, presentation as a steps table "teacher activity / student
  activity / minutes", recapitulation, assessment, home assignment, reflection), 5E (Engage, Explore, Explain, Elaborate,
  Evaluate, each with activity + minutes + materials), and a weekly plan (Mon–Sat × up to 8 periods, each cell topic +
  homework).
- **Helpers**: learning-outcome builder with Bloom's verbs by level (remember … create) in the UI language, inserted with
  one tap; NEP competency tags (critical thinking, creativity, collaboration, communication, values, digital literacy);
  differentiation box (support / extension); materials checklist; a timing bar that totals step minutes against the
  period length and warns when over; a "student activity ideas" chip list by subject.
- **Samples** (content.js, short, all 12 languages): Maths Class 6 fractions, Science Class 8 cell, English Class 5 poem,
  Social Science Class 7 medieval India, Hindi/first-language Class 4 story, AI Class 9 "What is AI?".
- Save many plans (list with search, duplicate, delete), export/import JSON, print with a school header and signature
  lines (teacher / HOD / principal), share the plan text on WhatsApp.
- Test: fill fields → preview shows them; steps 15 + 20 + 15 against a 40-min period warns; switching format keeps common
  fields; save, list, duplicate, delete; Bloom verb insert appends to the outcome; weekly plan cell edit persists; JSON
  export/import round-trips; reload keeps the draft; reset.

### 7. Fake News Detective (`fake-news-detective`) 🕵️ · digital-safety · 6-12
Media literacy: a game plus a verification toolkit. All example messages are **fictional** (invented places, people,
brands, domains); never a real person.
- **Game**: 24 messages (content.js): WhatsApp forwards, social posts, headlines, "video" descriptions, screenshots of
  "news". For each decide Reliable / Fake or misleading / Verify first. Reveal shows the red flags present (urgency,
  "forward to 10 people", no source or date, ALL CAPS and emotion, misspelt look-alike domain, old photo reused, round
  numbers, miracle cure, free gift link, deepfake tells, satire taken literally, missing "who said it") and the one
  verification step that settles it (reverse image search, official site / PIB Fact Check, check the date, read the URL,
  call the bank on the number on the card). Score, streak, two levels (Classes 6–8 / 9–12).
- **Verify toolkit**: "5 questions before you forward" (Who, When, Where, Why, What proof); how to do a reverse image
  search on a phone and a PC (steps only, no external calls); Indian fact-check sources as names + plain URLs (PIB Fact
  Check, Alt News, BOOM, Factly, Vishvas News, The Quint WebQoof); cyber-crime helpline 1930 and cybercrime.gov.in;
  WhatsApp's "Forwarded many times" label explained.
- **Message checker**: paste any message → heuristic red-flag highlighter (urgency words, caps ratio, "forward", shortened
  links, many !!!, look-alike domains, money/OTP requests, "100% true") with per-language word lists (content.js) → a
  caution level with reasons and the clear disclaimer that only verification decides.
- **Class mode**: projector fullscreen one message at a time, class votes by show of hands, reveal; printable worksheet
  (8 messages + key) and a "Think before you forward" poster.
- Test: answer 5 rounds → score equals correct count; reveal lists ≥ 1 flag; checker flags "URGENT!!! forward to 10
  people bit.ly/xyz win ₹5000" with ≥ 3 flags and high caution, and a calm message with none; level switch changes the
  set; worksheet 8 rows + key; progress persists after reload; reset.

### 8. CGPA, Percentage & Grade Calculator (`cgpa-percentage-calculator`) 🎓 · study-skills · all
For school and college students in India (and parents). `waKey: 'shell_wa_tool'`.
- **CBSE**: CGPA ↔ percentage (× 9.5); subject grade from marks on the CBSE 9-point scale (A1 91–100 = 10, A2 81–90 = 9,
  B1 71–80 = 8, B2 61–70 = 7, C1 51–60 = 6, C2 41–50 = 5, D 33–40 = 4, E below 33), overall CGPA from five subjects;
  "marks needed in the remaining papers to reach a target %".
- **University SGPA/CGPA**: credits × grade points table (10-point letter grades O 10, A+ 9, A 8, B+ 7, B 6, C 5, P 4,
  F 0 — editable, 4-point option), several semesters → CGPA weighted by credits; percentage from CGPA by a chosen
  formula: × 10 (many universities), × 9.5 (CBSE, DU), (CGPA − 0.75) × 10 (VTU, older UGC), 7.1 × CGPA + 11 (Mumbai
  University, 10-point), 7.4 × CGPA + 12 (Mumbai University, 7-point), custom a × CGPA + b; always show the formula used
  and "check your university's rule".
- **Conversions**: percentage ↔ CGPA ↔ 4.0 GPA (approximate band mapping, clearly labelled approximate).
- **Marks**: percentage from marks, best-of-N aggregate, weighted average (internal + final weights), "what do I need in
  the final exam".
- Print a semester result sheet; save semesters; CSV export.
- Test: CGPA 8.2 → 77.9 %; 85 marks → A2, 9 points; credits (4, 3, 3, 2) with points (10, 9, 8, 7) → SGPA 8.75; CGPA across
  two semesters weighted by credits; Mumbai 10-point 7.5 → 64.25 %; VTU 7.5 → 67.5 %; target: 3 papers done with 70 %, need
  X % in the last two for 75 % overall; final-exam need with 30/70 weights; reload keeps semesters; reset.

### 9. Electricity Bill & Energy Calculator (`electricity-bill-calculator`) 💡 · everyday · all
Home energy audit and bill estimate; Class 10 Ch 12 (Electricity) corner. `waKey: 'shell_wa_tool'`.
- **Appliances**: 30 common Indian appliances with typical watts (editable): LED bulb 9, CFL 15, incandescent bulb 60,
  tube light 36, ceiling fan 75, BLDC fan 30, cooler 200, AC 1 ton 1000 / 1.5 ton 1500 (with a duty-cycle note), fridge
  (150 W, runs ~8 h effective), TV LED 32" 50, geyser 2000, iron 1000, washing machine 500, mixer 500, induction 1800,
  microwave 1200, kettle 1500, water pump 750, laptop 60, desktop 200, phone charger 10, Wi-Fi router 10, set-top box 20,
  room heater 2000, hair dryer 1200, toaster 800, rice cooker 700, vacuum cleaner 1000, inverter charging 300.
  Quantity × hours/day × days → units (kWh) per month, ranked list with share bars, top-3 guzzlers.
- **Bill estimate**: slab tariff with sample tables for 12 states (Delhi, Maharashtra, UP, Karnataka, Tamil Nadu, Gujarat,
  West Bengal, Rajasthan, MP, Telangana, Punjab, Kerala) marked "approximate, Oct 2026, check your DISCOM bill", all
  editable, plus custom slabs; telescopic vs non-telescopic toggle; fixed charge per kW sanctioned load; electricity
  duty %; fuel surcharge %; subsidy/free units toggle. The bill is shown slab by slab.
- **Savings coach**: what-if switches (LED for bulbs, AC at 24 °C instead of 18 °C ≈ 6 % per °C, 5-star fridge, BLDC fan,
  standby off) → kWh and ₹ saved per month and year, CO₂ at about 0.8 kg per unit (India grid average).
- **Meter and solar**: previous/current reading → units; rooftop solar quick estimate (1 kW ≈ 4 units/day ≈ 120 units/month,
  varies by city).
- **Science corner**: P = VI, E = P × t, 1 unit = 1 kWh = 3.6 × 10⁶ J; 6 NCERT-style practice questions with answers.
- Print the appliance audit sheet.
- Test: fan 75 W × 2 × 8 h × 30 d = 36 kWh; 250 units on a sample 3-slab table (0–100 @ 3, 101–200 @ 5, 201+ @ 7,
  telescopic) = 300 + 500 + 350 = 1150 + fixed charge; non-telescopic gives 250 × 7; LED swap saving for 4 bulbs × 5 h;
  meter 4520 − 4380 = 140; solar 3 kW → 360 units; NCERT: 100 W × 5 h × 30 = 15 units; reload keeps the list; reset.

### 10. Gold & Silver Jewellery Price Calculator (`gold-jewellery-calculator`) 💍 · everyday · all
A jeweller's estimate you can check before you buy. The app never fetches rates; the user types today's rate (remembered
with its date). `waKey: 'shell_wa_tool'`. "Estimate, not advice; rates differ by city and shop."
- Inputs: rate per 10 g (gold) or per kg / per 10 g (silver); purity 24K 99.9 %, 22K 91.6 %, 18K 75 %, 14K 58.5 %, custom;
  silver 999, 925 (sterling), 900; weight in grams (tola converter, 1 tola = 11.664 g); making charge as % of metal value,
  ₹ per gram or flat; wastage %; stone/diamond charges; GST 3 % on gold + making (toggle: making billed separately at
  5 %); hallmarking charge about ₹53 per piece (BIS ₹45 + 18 % GST), optional.
- Output: itemised estimate like a bill (rate per gram at purity, metal value, making, wastage, stones, GST, hallmark,
  total), big total, amount in words; **fair-price check**: paste the shop's quote → implied making charge % and the
  difference; **old-gold exchange**: weight, purity, deduction % → value credited against a new piece; **resale value**
  (metal value only, minus a typical 2–5 % deduction); purity helper (22K 10 g contains 9.16 g pure gold).
- Explainers: HUID (6-character hallmark ID), 916/750/585 stamps, why 22K for jewellery, buy-back terms to ask about.
- Print / WhatsApp share of the estimate text; save recent estimates.
- Test: rate 72,000/10 g, 22K, 10 g, making 12 %, GST 3 % → metal 65,952; making 7,914.24; subtotal 73,866.24; GST
  2,215.99; total 76,082.23 (hallmark off); with hallmark + 53; quote 80,000 → implied making ≈ 17.8 %; old gold 8 g 22K at
  5 % deduction → 50,123.52; silver 1 kg at 95,000/kg, 925 → 87,875 metal; purity grams 9.16; reload keeps the rate; reset.

### 11. Rent Receipt & HRA Helper (`rent-receipt-maker`) 🏠 · everyday · all
For tenants claiming HRA and for landlords. `waKey: 'shell_wa_tool'`. "Estimate, not tax advice; rules checked Oct 2026."
- **Receipts**: tenant, landlord (name, address, PAN optional), property address, monthly rent, payment mode (cash, UPI,
  bank transfer, cheque), date of payment; one receipt or a batch for a month range (e.g., Apr 2026 – Mar 2027, up to 36);
  each receipt numbered, amount in words (English and the chosen language), signature line, and a "₹1 revenue stamp" box
  shown automatically when paid in cash and above ₹5,000. Print A4 with 3 receipts per page or one per page; share one
  receipt as text on WhatsApp.
- **HRA exemption calculator** (old regime): basic + DA, HRA received, rent paid, metro (Delhi, Mumbai, Kolkata, Chennai →
  50 %) or other city (40 %) → exempt HRA = least of (actual HRA, rent − 10 % of salary, 50/40 % of salary), taxable
  HRA, monthly and yearly, with the three amounts shown. Notes: landlord PAN needed when rent > ₹1,00,000 a year
  (declaration if no PAN), Form 12BB to the employer, rent to parents is allowed only if really paid, no HRA exemption in
  the new regime.
- **Checklist**: what a rent agreement should contain (11-month term, deposit, notice period, maintenance, repairs,
  police verification where required) as a tick list; not a legal document.
- Test: batch Apr–Mar → 12 receipts numbered 1–12; words for 15,000 = "Fifteen Thousand"; stamp box for cash 6,000, not
  for UPI 6,000, not for cash 4,000; HRA basic 50,000, HRA 20,000, rent 18,000, metro → exempt 13,000 (yearly 1,56,000),
  taxable 7,000; non-metro → 13,000 still (40 % = 20,000 is not the least); PAN warning when rent 9,000 × 12 > 1 lakh;
  end before start → message; reload keeps the data; reset.

### 12. Restaurant Menu Card Maker (`menu-card-maker`) 🍽️ · business · all · ["teacher"]
For restaurants, dhabas, cafés, canteens, tiffin services, bakeries, food courts and caterers. `waKey: 'shell_wa_tool'`.
- **Details**: business name, tagline, logo (local image, never uploaded), phone/WhatsApp, address, FSSAI licence number
  (optional field, shown on the menu as FSSAI rules expect), "prices inclusive of GST" line, UPI ID → "Scan & Pay" QR,
  WhatsApp order link/QR (copy `qr.js` from apps/qr-code-maker).
- **Items**: categories (Starters, Main course, Breads, Rice & biryani, Chinese, South Indian, Thali & combos, Desserts,
  Beverages, Today's special; rename/add/reorder), items with name (any language), description, price, half/full prices,
  veg / non-veg mark drawn as the FSSAI symbols (green circle in a green square; brown triangle in a brown square), spice
  level, "chef's special" and "bestseller" badges, out-of-stock toggle. Sample menu (content.js, ~24 Indian items,
  localized). CSV import/export (name, category, price, veg, half price).
- **Designs** (6): classic cream, dhaba bold, café minimal, royal, South Indian green, modern dark. **Layouts**: A4 one or
  two columns, A5 booklet pages, table tent card, a 1080 × 1920 digital menu image for WhatsApp status / Instagram story
  (canvas render; multiple pages if long), and a "Scan for menu" QR poster.
- Export: print (A4/A5), PNG/JPG per page, save many menus, share the menu text on WhatsApp.
- Test: add 3 items → preview shows 3 rows with the right veg/non-veg marks; CSV import of 4 rows creates 4 items;
  half/full prices shown; ₹ formatting; design switch changes the class; story PNG download fires; FSSAI line appears when
  filled; menu persists after reload; reset.

---

## Wave 2

### 13. Factors, HCF & LCM Lab (`hcf-lcm-lab`) 🌳 · math · 4-8
- **Factor tree** (SVG, animated step by step) for 2–99,999 with the prime factorisation in index form (360 = 2³ × 3² × 5)
  and the division-ladder method; all factors, number of factors from the formula, prime/composite with the divisibility
  rules used (2, 3, 4, 5, 6, 8, 9, 10, 11 explained).
- **HCF and LCM** of 2–4 numbers: prime-factorisation method with common primes highlighted, Euclid's division method for
  HCF with steps (NCERT: 867 and 255 → 51), ladder method, LCM via HCF × LCM = a × b for two numbers, Venn diagram of
  prime factors.
- **Word problems** (12, content.js: bells ringing together, floor tiles, longest tape, traffic lights, parade rows) with
  an "HCF or LCM?" decision helper; timed drill with levels; printable worksheet + key; interactive Sieve of Eratosthenes
  1–100.
- Test: 360 → 2³·3²·5 and 24 factors; HCF(36, 48) = 12, LCM = 144; Euclid 867, 255 → 51 with 3 steps; HCF(12, 18, 24) = 6;
  LCM(4, 6, 8) = 24; sieve crosses out multiples of 2 after one tap; worksheet rows; 1 and 0 handled; reload; reset.

### 14. Solar System & Sky Lab (`solar-system-lab`) 🪐 · science · 5-8
NCERT Class 6 and Class 8 (Stars and the Solar System). No ephemeris, no dates: a model, not a planetarium.
- Orbit view (canvas) with speed control and separate "true size" / "true distance" toggles (explain why both at once is
  impossible); planet cards (Sun, 8 planets, Moon, Pluto as a dwarf planet) with distance in AU and km, diameter, day and
  year length, moons, gravity relative to Earth, temperature, and ISRO missions (Chandrayaan-1/2/3, Mangalyaan,
  Aditya-L1).
- Day & night and seasons: Earth's 23.5° tilt animated around the Sun; Moon phases: drag the Moon around Earth, see the
  phase as seen from Earth with English names and Indian names (Amavasya, Purnima, Shukla and Krishna paksha, the idea of
  tithi); solar and lunar eclipse alignment demo; "your weight on other planets"; 6 constellations drawn as dots and lines
  (Saptarishi / Ursa Major with the Pole Star, Orion / Mriga, Cassiopeia, Scorpius, Leo, Gemini); planet-order mnemonic
  written natively in each language; 15-question quiz.
- Test: planet order; Jupiter year ≈ 11.86 Earth years; Moon at 180° → full moon, 0° → new moon; weight on Moon = ⅙;
  June → northern summer; quiz score; weight persists; reset.

### 15. Data Structures Visualizer (`data-structures-visualizer`) 🧱 · coding · 11-12
CBSE Class 12 CS (stack, queue) and beyond. Every structure has an animated view, a Python code panel with the executing
line highlighted, an O() table and a "try it yourself" challenge with checking.
- Stack: push/pop/peek, overflow/underflow, applications: parentheses matching, infix → postfix conversion (step table),
  postfix evaluation. Queue: enqueue/dequeue, circular queue array with front/rear, deque. Linked list: insert at start /
  end / position, delete, traversal with pointer animation. Binary search tree: insert, search, delete, in/pre/post-order
  traversals animated. Searching: linear vs binary search with comparison counters. Hashing: modulo table with chaining.
- Test: push 1, 2, 3 then pop → 3; "(a+b]" → not balanced; A+B*C → ABC*+; "2 3 4 * +" → 14; circular queue wraps; BST
  in-order is sorted; binary search on 15 items ≤ 4 comparisons; linked-list delete middle; state persists; reset.

### 16. Handwriting Practice Sheets (`handwriting-practice-sheets`) ✍️ · teacher-tools · 1-5
Printable tracing worksheets rendered on canvas (A4 at 150 dpi) → print or PNG.
- Content: English capital/small letters and numbers; Hindi/Marathi varnamala (vowels, consonants, barakhadi), Bengali,
  Gujarati, Punjabi, Odia, Tamil, Telugu, Kannada, Malayalam, Urdu letters; native and Western digits; or any custom words
  and sentences (child's name, "My name is …").
- Options: guide lines (4-line English, 2-line, boxes, plain), size (large/medium/small), repetitions per row, tracing
  style (dotted outline via dashed `strokeText`, light grey to trace over, first solid then fading, blank copy rows),
  left-handed layout (model letter on the right), header with name/date/class, page numbers. Fonts: the Noto script fonts
  that `edu.js` loads (wait for `document.fonts` before drawing).
- Test: English A–Z → expected number of rows/pages; custom word → repetitions per row; Hindi vowels count; PNG download
  fires; left-handed flips the model position (pixel check); settings persist; reset.

### 17. Passport Photo Sheet Maker (`passport-photo-sheet`) 🪪 · everyday · all
`waKey: 'shell_wa_tool'`. Photos never leave the device. Links to background-remover and form-photo-resizer for those jobs.
- Upload or take a photo; crop with a head/face guide for the chosen standard: India passport 35 × 45 mm (head 25–35
  mm), PAN 25 × 35 mm, visa US 2 × 2 in, UK/Schengen 35 × 45, Canada 50 × 70, school ID 30 × 40, custom mm; zoom, pan,
  rotate, brightness/contrast; optional name + date strip (for exam forms).
- Sheet: 4 × 6 in (10 × 15 cm) or A4, auto count (8 × 35 × 45 on 4 × 6), cut lines and gaps, 300 dpi → JPG download and
  exact-size print (CSS mm); also a single photo JPG at exact pixels.
- Test: bundled sample → 4 × 6 sheet canvas 1200 × 1800 with 8 photos; A4 count; custom 30 × 40 → 12 on 4 × 6 (check the
  maths); JPG download fires; name strip drawn; settings persist; reset.

### 18. Indian Food Calorie & Balanced Diet Planner (`food-calorie-calculator`) 🍛 · science · all
Class 6 Ch 2 (Components of Food) and everyday use. `waKey: 'shell_wa_tool'`. "General information, not medical advice."
- 120 Indian foods (names localized in content.js; numbers in data.js, approximate per standard serving and per 100 g,
  based on ICMR-NIN tables): roti, rice, dals, sabzis, idli, dosa, poha, upma, paratha, chole, rajma, paneer, chicken,
  fish, egg, milk, curd, lassi, chai, coffee, samosa, pakora, jalebi, gulab jamun, laddoo, biscuits, bread, fruits, nuts…
- Plate builder: servings → kcal, protein, carbs, fat, fibre; macro pie; compared with daily need (ICMR-NIN 2020 RDA by
  age, sex, activity; editable); NIN "My Plate" proportions; BMI (Asian cut-offs 23/25 noted, calm wording); healthy
  swaps; weekly meal-plan print sheet.
- Class 6 corner: nutrients and deficiency diseases (scurvy, rickets, beriberi, anaemia, goitre, night blindness), food
  tests (iodine → blue-black for starch, copper sulphate + caustic soda → violet for protein, translucent paper for fat);
  12-MCQ quiz.
- Test: 2 roti + 1 cup dal + 1 cup rice total equals the data sum; RDA adult woman sedentary; BMI 70 kg, 1.75 m → 22.9;
  quiz score; swap suggestion; plate persists; reset.

### 19. Colour Palette & Contrast Checker (`colour-palette-maker`) 🎨 · marketing · all · ["teacher"]
`waKey: 'shell_wa_tool'`.
- Base colour (picker, hex, or dominant colours from an uploaded image via a simple k-means on canvas) → palettes
  (complementary, analogous, triadic, split, tetradic, shades/tints); Indian presets (Diwali, Holi, saffron-white-green,
  Rajasthani, Kerala, indigo block-print, Madhubani); WCAG contrast checker (ratio, AA/AAA for normal and large text, 3:1
  for UI) with live sample text in the UI language; colour-blind simulation (protanopia, deuteranopia, tritanopia); a
  poster/shop-sign mock preview; export CSS variables, JSON, PNG palette card, copy hex; nearest colour names; save palettes.
- Test: complementary hue is +180°; #000 on #fff = 21:1; AA pass/fail thresholds 4.5 and 3; hex ↔ rgb ↔ hsl; image → 5
  colours; CSS export contains `--c1`; save/load; reset.

### 20. Type in Indian Languages (`indic-typing-tool`) ⌨️ · languages · all
Phonetic Roman → script typing for all 11 non-English languages, offline and rule-based (an `engine.js` driven by per-script
tables), like an input tool: type `namaste` → नमस्ते, `bharat` → भारत, `sangeet` → संगीत, `vidyalaya` → विद्यालय.
- Scheme: ITRANS-like but forgiving (aa/A, ii/I, uu/U, T/D/N retroflex, sh/Sh, ch/chh, ng, ny, nukta z/f/x/q, `.` for
  halant, M anusvara, H visarga, `gy`/`dny` → ज्ञ, ksh → क्ष); conjuncts via virama; inherent-vowel deletion at the end of
  words for hi/mr/gu/pa/bn where usual; Tamil's smaller consonant set and grantha letters; Urdu with basic Nastaliq letter
  mapping. Up to 3 alternatives per word in a suggestion bar; on-screen keyboard of vowels, matras, consonants and special
  signs; copy, WhatsApp share, download .txt; a scheme cheat-sheet per language; practice mode (25 common words per
  language in content.js, checked against expected spellings).
- Quality gate: a built-in corpus (`tests.js`, ≥ 40 word pairs per language) that the interaction test runs through the
  engine; at least 90 % must match, and the Hindi/Bengali/Tamil/Urdu examples in the test must all match.
- Test: a dozen fixed mappings in hi, bn, ta, te, ur; suggestion bar shows alternatives; corpus pass rate ≥ 90 %; copy
  works; text persists; reset.
