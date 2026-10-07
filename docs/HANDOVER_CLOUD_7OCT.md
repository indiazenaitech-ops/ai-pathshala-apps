# Handover from the cloud session (7 Oct 2026), branch `claude/gallant-brahmagupta-pjrnue`

Agent-reported verify PASS + QA done (re-run `node tools/verify.js <slug>` on the PC before publishing; screenshots not yet
reviewed by the orchestrating session):
- Round 3: sur-taal-trainer, contact-list-vcf, utm-link-builder, stock-register, pdf-sign-fill, spam-classifier-lab,
  live-poll (no word cloud / open text: shared/cloud.js only accepts a numbered choice), recommendation-lab,
  seating-chart-maker, sound-waves-lab, vedic-maths
- New category `data` (wired in shared/home.js, shared/home-strings.js, tools/verify.js, tools/build_catalog.js;
  specs in docs/DATA_APPS_SPECS.md): csv-data-explorer, chart-maker, pivot-table-maker, data-cleaning-lab,
  csv-join-merge (8 verify warnings: Excel/VLOOKUP/"append / union" kept in English, false positives),
  json-csv-converter, ab-test-calculator, sampling-lab

NOT finished (stopped mid-work when cloud credits ran out; put them in tools/.publish_hold until done):
- ai-dictionary, daily-english-words (QA was in progress, agent was rewriting the tips in all languages)
- workplace-scam-drill (was adding the checklist button + print CSS), barcode-label-maker
- recipe-finder (content being written language by language; was on Bengali)

Catalog (catalog.js, APPS.md, sitemap.xml) is NOT rebuilt on this branch: `tools/publish.sh` does that on the PC.
