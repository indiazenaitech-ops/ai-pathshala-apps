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
for slug in $(cat tools/.publish_stage); do
  git add "apps/$slug"
  [ -f "tools/tests/$slug.test.js" ] && git add "tools/tests/$slug.test.js"
done
if git diff --cached --quiet; then echo "nothing to publish"; exit 0; fi
git commit -q -m "${1:-Update app library}"
git pull -q --rebase --autostash origin main || { git rebase --abort 2>/dev/null; echo "pull failed"; exit 1; }
git push -q origin main
git log --oneline -1
