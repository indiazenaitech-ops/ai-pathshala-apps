# Data & analytics apps (category `data`, started 7 Oct 2026)

Owner's instruction (7 Oct): "create apps related to data analytics / data science / data engineering as well into a new
category". The category id is `data` ("Data & analytics", 📊). It shows under Everyone, Schools & colleges and Work & business.

Every app follows `AGENTS.md`. Shared notes for this category:
- `meta.json`: `"category": "data"`, `"audience": ["teacher", "student"]`, `"needs": []`, `"grades": "all"` unless stated.
  Tags carry the real audience words (student, analyst, office, shop, excel, csv, data science, data engineering ...).
- Tools (not labs) pass `EDU.init({ ..., waKey: 'shell_wa_tool' })`.
- **No libraries.** Draw charts with SVG or canvas by hand (read colours with `EDU.css('--c1')` ... and redraw on
  `EDU.onTheme`). CSV only (tell users "Excel: File → Save as → CSV"); parse with `EDU.csv.parse`, auto-detect `,` `;` tab `|`.
- Files never leave the device: `EDU.pickFile` + drag and drop + paste. Big files: handle 50,000 rows × 30 columns without
  freezing (paginate tables, 100 rows a page; no DOM row per data row).
- Sample datasets are fictional, Indian context (₹, Indian names, states and cities), in `content.js` with the column headers and
  text values localized in all 12 languages (same shape). The user's own data is shown as-is in `class="no-i18n"`.
- Numbers: Western digits, Indian grouping is fine via `EDU.fmt`. Show "lakh/crore" only as an option.
- Every app: a "How to use / ideas" `<details class="card">` with an idea for office work AND one for a class, plus a short
  "What is happening inside" or "Words to know" section (dataset, row, column, missing value, mean, median ...).
- State (last dataset up to ~1 MB, settings) saved with `EDU.store('<slug>')`; Reset button.

## The 8 apps

### 1. Data Explorer (`csv-data-explorer`) 🔎
Open a CSV (pick, drop, or paste) or a sample (class marks, shop sales, rainfall by state). Detect column types (number, text,
date DD-MM-YYYY / YYYY-MM-DD, yes/no). Column profile cards: count, missing, unique, min, max, mean, median, standard deviation,
top 5 values, a small histogram or bar. Data table with paging, sort by any column, search, filters (text contains / equals,
number between, missing only), choose visible columns, export the filtered rows as CSV. Correlation matrix for number columns as
a coloured grid with plain-language reading ("strong positive"). Summary sentence ("1,240 rows, 8 columns, 3% missing").
Edge: empty file, one column, ragged rows, ₹ and commas inside numbers ("₹1,20,000" → 120000), 50,000 rows, Urdu RTL.
Test: sample → mean of a known column matches the hand value; a filter reduces rows to a known count; missing count is right.

### 2. Chart Maker (`chart-maker`) 📈
Type or paste data in a small grid (or CSV), pick bar, stacked bar, horizontal bar, line, area, pie, donut, scatter, histogram.
Title, axis labels, legend, data labels, sort, colour palettes (including a colour-blind-safe one), number format (plain, ₹,
%, lakh/crore). Export PNG (1200×675 and 1080×1080) and SVG. "Which chart should I use?" helper (compare → bar, change over time →
line, part of a whole → pie with ≤ 6 slices, relationship → scatter, spread → histogram) and gentle warnings (pie with many
slices, truncated axis). Edge: negative values, one value, 100 categories, long labels wrap or truncate, RTL text in titles.
Test: 3 rows → the SVG has 3 bars; switching to pie keeps the data (3 slices); PNG export has the chosen size.

### 3. Pivot Table Maker (`pivot-table-maker`) 🧮
CSV or sample (shop sales: date, month, region, product, salesperson, quantity, amount). Choose rows, columns (optional), value
column and summary (sum, count, average, min, max, count distinct), filters per field, grand totals, "% of total / row /
column", sort by value, top N, a bar chart of the pivot, export CSV, copy as a table for Excel/Sheets. A short "what is a pivot
table" explanation with the same example done by hand. Group dates by month/quarter/year. Edge: blank keys show as "(blank)",
non-number values in the value column are skipped and counted, 50,000 rows.
Test: sum of amount by region equals the hand-computed totals; count works; the grand total equals the column total.

### 4. Data Cleaning Lab (`data-cleaning-lab`) 🧹 (data engineering)
Load a messy sample customer list (extra spaces, MiXeD case, duplicate rows, dates in 4 formats, phone numbers with +91 / 0 /
spaces, "₹1,20,000" and "1.2 lakh" amounts, blanks, "N/A") or your own CSV. Data-quality report before and after (missing,
duplicates, invalid values per column, a 0–100 score). Cleaning steps: trim spaces, fix case, remove duplicates (whole row or by
key columns), fill blanks (value, previous row, mean/median) or drop rows, standardise dates (to DD-MM-YYYY or YYYY-MM-DD),
normalise Indian mobile numbers to 10 digits (flag invalid), parse money/number text, split a column (by a character) and merge
columns, find and replace, rename and delete columns. Every step goes into a **recipe** (a list you can reorder, switch off,
undo) that can be exported as JSON and replayed on next month's file: explain that this is what data engineers call a
pipeline / ETL. Show changed cells highlighted. Export clean CSV.
Test: sample → remove duplicates removes the known number; "+91 98765 43210" → "9876543210"; "5/3/2026" (D/M/Y) → "05-03-2026";
exported recipe replayed on the original sample gives the same output.

### 5. Join & Merge Files (`csv-join-merge`) 🔗
Two CSVs (or samples: students + marks, orders + customers). Pick key columns on each side (trim/ignore-case options), join type
inner / left / right / full outer with a small Venn diagram, preview, counts (matched, only left, only right), duplicate-key
warning (one-to-many), "this is VLOOKUP / XLOOKUP" explanation, unmatched rows report, choose output columns, export CSV.
Second mode: stack / append many files (union) with column matching by name and a "source file" column.
Edge: different column names, blank keys, numeric keys "007" vs "7" (option), huge files.
Test: samples → inner join count, left join keeps all left rows with blanks, union of 2 files has the sum of rows.

### 6. JSON ↔ CSV Converter (`json-csv-converter`) 🔄 (data engineering)
JSON → CSV with nested objects flattened to dot paths (address.city) and arrays either joined ("a; b") or exploded into rows;
CSV → JSON (array of objects, numbers and true/false typed, empty → null, option to keep all as text); JSON Lines in and out;
schema view (field, type, % present, example); pretty print / minify; validation with the error line and column in simple
words; download and copy. Samples: an API response (orders with items), a contacts CSV. Edge: top-level object vs array,
mixed types, keys with dots, 10 MB input stays responsive.
Test: nested sample flattens to an "address.city" column; CSV → JSON types numbers; invalid JSON shows an error with a position.

### 7. A/B Test Calculator (`ab-test-calculator`) 🆎
Visitors and conversions for A and B (and an optional C) → conversion rates, relative uplift, two-proportion z-test p-value,
95% confidence interval of the difference, a plain-language verdict ("B is better, and this is unlikely to be luck" / "not
enough evidence yet"), and "chance that B beats A" (Bayesian, Beta posteriors, seeded simulation or normal approximation).
Sample-size planner: baseline rate, minimum change to detect, power 80/90%, significance 5/1% → visitors per group and days
from daily visitors. Warnings: peeking, very small samples, unequal split. Examples: two WhatsApp message versions, a shop banner,
a school-notice reminder. Explain the words (conversion, p-value, significance) simply.
Test: A 200/1000 vs B 250/1000 → p-value about 0.008 (two-sided); sample size for 10% → 12% at 80% power and 5% significance is
about 3,840 per group (state the exact value your formula gives and check it against the standard formula).

### 8. Statistics & Sampling Lab (`sampling-lab`) 🎯 · grades "9-12"
Learn data science by experiment. Populations: heights of 10,000 fictional students, a skewed monthly-income population, dice
rolls. Take random samples of size n (seeded RNG with a "new seed" button), see the sample mean, build the sampling
distribution with many samples (central limit theorem: it turns bell-shaped even for skewed data), standard error = σ/√n shown
live, 95% confidence intervals drawn as lines (about 95 of 100 contain the true mean), sampling bias demo (survey only one
city / only people online), mean vs median with an outlier (one crorepati in the village). Projector mode, quiz of 8 questions.
Test: SE shown equals σ/√n for the chosen n; 100 intervals → coverage between 85 and 100; the outlier moves the mean more than
the median.
