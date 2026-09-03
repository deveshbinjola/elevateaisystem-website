#!/usr/bin/env bash
# Deploy elevateaisystem.com to Cloudflare Pages (project: elevateai).
#
# Why this script exists rather than a bare `wrangler pages deploy .`:
#
#   1. Pages uploads EVERY file in the directory, dotfiles included. Without
#      the excludes below, /CLAUDE.md, /blog/drafts/*.md and the .claude
#      worktree copies were publicly readable. Verified 2026-09-02.
#      `.assetsignore` does NOT work for Pages, only for Workers Assets.
#
#   2. Pages serves a matching static asset BEFORE consulting _redirects.
#      So a retired page can only be redirected if its .html is kept out of
#      the deploy. That is what RETIRED below does. The files stay in git,
#      so restoring one is a matter of deleting a line here.
#
#   3. Production is branch `main`; the local git branch is `master`. Omit
#      --branch and the deploy silently lands in Preview.
#
# Usage:  ./deploy.sh
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

# Retired products. Each has a 301 in _redirects; the rule only fires because
# the file is excluded here. Removing a line here re-publishes that page and
# silently disables its redirect.
RETIRED=(
  brand-os.html
  build-your-brand.html
  brand-os-session.html
  augmented-coach.html
  content-os.html
  growth-engine.html
  lead-os.html
)

EXCLUDES=(
  --exclude='*.md' --exclude='*.bak'
  --exclude='.claude/' --exclude='.wrangler/' --exclude='.git/'
  --exclude='.gitignore' --exclude='.DS_Store'
  --exclude='blog/drafts/' --exclude='blog/_drafts/'
  --exclude='deploy.sh'
  # Internal strategy docs. /deliverables/hermes-vugola-paperclip-playbook
  # was publicly readable and unlinked, naming a third party's stack.
  --exclude='deliverables/'
  # 30 coach-niche landing pages retired 2026-09-02: they marketed Lead OS /
  # Content OS / Growth Engine, all retired products. _redirects sends
  # /niches/* to /coach-platform; files stay in git.
  --exclude='niches/'
)
for f in "${RETIRED[@]}"; do EXCLUDES+=( --exclude="/$f" ); done

rsync -a "${EXCLUDES[@]}" "$SRC/" "$STAGE/"

# Fail loudly rather than shipping something private.
if find "$STAGE" -name '*.md' | grep -q .; then
  echo "ABORT: markdown files reached the staging copy" >&2; exit 1
fi
for f in "${RETIRED[@]}"; do
  if [ -e "$STAGE/$f" ]; then echo "ABORT: retired page $f still staged" >&2; exit 1; fi
done

echo "Staged $(find "$STAGE" -type f | wc -l | tr -d ' ') files. Deploying to production..."
npx wrangler pages deploy "$STAGE" --project-name elevateai --branch main --commit-dirty=true
