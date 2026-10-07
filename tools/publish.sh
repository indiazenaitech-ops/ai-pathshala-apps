#!/usr/bin/env bash
# Publish to GitHub Pages: rebuild the catalog from apps whose last verify PASSED,
# stage only those apps (+ shared files), commit and push.  Unfinished apps stay unpublished.
#   bash tools/publish.sh "commit message"
set -euo pipefail
cd "$(dirname "$0")/.."
ZIP="https://github.com/indiazenaitech-ops/ai-pathshala-apps/archive/refs/heads/main.zip"
node tools/build_catalog.js --only-passing --zip "$ZIP"

[ -f CNAME ] && git add CNAME
git add .gitignore .nojekyll README.md LICENSE AGENTS.md APPS.md index.html catalog.js manifest.webmanifest sw.js shared \
        tools/verify.js tools/build_catalog.js tools/publish.sh tools/package.json tools/package-lock.json \
        apps/_template tools/tests/_template.test.js
# site pages + SEO files + site tools (each only if present, so a missing file never stops a publish)
for f in schools.html business.html about.html contact.html robots.txt sitemap.xml tools/verify_pages.js tools/chrome-path.js CLAUDE.md tools/inject_og.js tools/make_og.js; do
  if [ -f "$f" ]; then git add "$f"; fi
done
# press kit / printable flyer (linked from schools.html via EDU_SITE.press in catalog.js)
if [ -d press ]; then git add press; fi
# free downloads: the "AI Classroom Starter Pack" PDFs (shared/signup.js links them; built by tools/make_starter_pack.js)
if [ -d downloads ]; then git add downloads; fi
if [ -d docs ]; then git add docs; fi
for f in tools/make_starter_pack.js tools/tests/_cta.check.js firebase/tests/signup.emulator.e2e.js; do if [ -f "$f" ]; then git add "$f"; fi; done
# free how-to guides (guides/: static pages in 12 languages + screenshots + strings, built by guides/_build/build.js)
# and the IndexNow key file (<32 hex>.txt at the root, its content = its name; used by tools/indexnow.js)
if [ -d guides ]; then git add guides; fi
for f in [0-9a-f]*.txt tools/indexnow.js; do
  if [ -f "$f" ] && { [ "$f" = tools/indexnow.js ] || [[ "$f" =~ ^[0-9a-f]{32}\.txt$ && "$(cat "$f")" == "${f%.txt}" ]]; }; then git add "$f"; fi
done
# Live Quiz: legal pages, short links, Firebase rules/tests (node_modules is gitignored), spec + e2e tests
for d in legal join teacher firebase; do if [ -d "$d" ]; then git add "$d"; fi; done
for f in LIVE_SPEC.md tools/tests/_live_e2e.js tools/tests/_cloud_mock.e2e.js tools/tests/_legal.check.js tools/tests/_signup.check.js; do if [ -f "$f" ]; then git add "$f"; fi; done
for slug in $(cat tools/.publish_stage); do
  git add "apps/$slug"
  [ -f "tools/tests/$slug.test.js" ] && git add "tools/tests/$slug.test.js"
done
if git diff --cached --quiet; then echo "nothing to publish"; exit 0; fi
git commit -q -m "${1:-Update app library}"
git pull -q --rebase --autostash origin main || { git rebase --abort 2>/dev/null; echo "pull failed"; exit 1; }
git push -q origin main
git log --oneline -1
