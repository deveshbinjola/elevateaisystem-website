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
#   4. Pages serves HTML uncached but caches /assets/* and navbar.js at the
#      edge for many hours, so an edited asset ships invisibly unless its URL
#      changes (bit us twice on 2026-09-02). Before upload, every reference to
#      a shared asset in the staged HTML is rewritten to ?v=<content hash>, so
#      the URL changes exactly when the file does. Source files may reference
#      assets with or without a ?v=; the rewrite normalizes both.
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

# Stamp content-hash versions onto shared-asset references (see header, #4).
/usr/bin/python3 - "$STAGE" <<'PYEOF'
import hashlib, os, re, sys
stage = sys.argv[1]

hashes = {}  # site-absolute path -> 8-char content hash
for rel in ['navbar.js'] + sorted(
        'assets/' + f for f in os.listdir(os.path.join(stage, 'assets'))
        if f.endswith(('.css', '.js'))):
    p = os.path.join(stage, rel)
    if os.path.isfile(p):
        hashes[rel] = hashlib.md5(open(p, 'rb').read()).hexdigest()[:8]

# Matches src/href to a known asset, with or without an existing ?v=,
# via "/assets/x.css", "assets/x.css" or "../navbar.js" style paths.
pat = re.compile(
    r'((?:src|href)=")((?:\.\./)*/?)((?:assets/[\w.-]+\.(?:css|js))|navbar\.js)(\?[^"]*)?(")')

def stamp(m):
    rel = m.group(3)
    if rel not in hashes:
        return m.group(0)
    return f'{m.group(1)}{m.group(2)}{rel}?v={hashes[rel]}{m.group(5)}'

count = 0
for root, dirs, files in os.walk(stage):
    dirs[:] = [d for d in dirs if not d.startswith('.')]
    for f in files:
        if not f.endswith('.html'):
            continue
        p = os.path.join(root, f)
        try:
            html = open(p, encoding='utf-8', errors='ignore').read()
        except OSError:
            continue
        new, n = pat.subn(stamp, html)
        if n:
            open(p, 'w', encoding='utf-8').write(new)
            count += n
print(f"Stamped {count} asset references with content-hash versions "
      f"({len(hashes)} assets).")
PYEOF

# Cloudflare Web Analytics: if analytics-token.txt exists (the site token
# from dash.cloudflare.com -> Analytics & Logs -> Web Analytics -> Add a
# site -> "use JS snippet"), inject the beacon into every staged page.
# The token is not a secret; it ships in page source by design. Prefer the
# dashboard's AUTOMATIC setup instead when available: it injects at the
# edge and this block then stays dormant (no token file, no injection).
if [ -f "$SRC/analytics-token.txt" ]; then
  CF_ANALYTICS_TOKEN=$(cat "$SRC/analytics-token.txt" | tr -d '[:space:]')
  /usr/bin/python3 - "$STAGE" "$CF_ANALYTICS_TOKEN" <<'PYEOF'
import os, sys
stage, token = sys.argv[1], sys.argv[2]
snippet = ('<script defer src="https://static.cloudflareinsights.com/beacon.min.js" '
           f'data-cf-beacon=\'{{"token": "{token}"}}\'></script>')
count = 0
for root, dirs, files in os.walk(stage):
    dirs[:] = [d for d in dirs if not d.startswith('.')]
    for f in files:
        if not f.endswith('.html'):
            continue
        p = os.path.join(root, f)
        html = open(p, encoding='utf-8', errors='ignore').read()
        if 'cloudflareinsights.com/beacon' in html or '</body>' not in html:
            continue
        open(p, 'w', encoding='utf-8').write(
            html.replace('</body>', snippet + '\n</body>', 1))
        count += 1
print(f"Injected Web Analytics beacon into {count} pages.")
PYEOF
fi

# Fail loudly rather than shipping something private.
if find "$STAGE" -name '*.md' | grep -q .; then
  echo "ABORT: markdown files reached the staging copy" >&2; exit 1
fi
for f in "${RETIRED[@]}"; do
  if [ -e "$STAGE/$f" ]; then echo "ABORT: retired page $f still staged" >&2; exit 1; fi
done

echo "Staged $(find "$STAGE" -type f | wc -l | tr -d ' ') files. Deploying to production..."
npx wrangler pages deploy "$STAGE" --project-name elevateai --branch main --commit-dirty=true
