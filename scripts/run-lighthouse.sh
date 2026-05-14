#!/usr/bin/env bash
# Run Lighthouse against priority pages on elevateaisystem.com
# Usage: bash Website/scripts/run-lighthouse.sh
# Requires: Node 18+ AND Chrome (or Chromium) installed locally

# Resolve script dir to absolute path so output path doesn't break
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
OUT_DIR="$SCRIPT_DIR/../deliverables/lighthouse"
mkdir -p "$OUT_DIR"
DATE=$(date +%Y-%m-%d)

echo "============================================"
echo "Lighthouse Audit: $DATE"
echo "Output: $OUT_DIR"
echo "============================================"
echo ""

# Detect Chrome on macOS / Linux
CHROME_PATH=""
for candidate in \
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  "/Applications/Chromium.app/Contents/MacOS/Chromium" \
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" \
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" \
  "$(which google-chrome 2>/dev/null)" \
  "$(which chromium 2>/dev/null)" \
  "$(which chrome 2>/dev/null)"; do
  if [ -n "$candidate" ] && [ -x "$candidate" ]; then
    CHROME_PATH="$candidate"
    break
  fi
done

if [ -z "$CHROME_PATH" ]; then
  echo "ERROR: No Chrome/Chromium found on this machine."
  echo ""
  echo "Lighthouse needs a Chromium browser to run. Install one:"
  echo "  Chrome:   https://www.google.com/chrome/"
  echo "  Brave:    https://brave.com/download/"
  echo "  Chromium: brew install --cask chromium"
  echo ""
  echo "Then re-run this script."
  exit 1
fi

echo "Found browser: $CHROME_PATH"
echo ""

# Pages to audit, in priority order
PAGES=(
  "https://www.elevateaisystem.com/|home"
  "https://www.elevateaisystem.com/brand-os|brand-os"
  "https://www.elevateaisystem.com/build-your-brand|build-your-brand"
  "https://www.elevateaisystem.com/augmented-coach|augmented-coach"
  "https://www.elevateaisystem.com/blog|blog-index"
)

SUCCESSES=0
FAILURES=0
SUMMARY_FILE="$OUT_DIR/$DATE-summary.txt"
echo "ElevateAI Lighthouse Summary  $DATE" > "$SUMMARY_FILE"
echo "Browser: $CHROME_PATH" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"
printf "%-22s %-10s %4s %4s %4s %4s\n" "Page" "Device" "P" "A" "BP" "SEO" >> "$SUMMARY_FILE"
printf "%-22s %-10s %4s %4s %4s %4s\n" "----" "------" "--" "--" "--" "---" >> "$SUMMARY_FILE"

run_one() {
  local url="$1"
  local slug="$2"
  local device="$3"   # mobile or desktop
  local extra=""
  if [ "$device" = "desktop" ]; then
    extra="--preset=desktop"
  else
    extra="--form-factor=mobile --throttling-method=simulate"
  fi

  local out_base="$OUT_DIR/$DATE-$slug-$device"
  echo "  -> $device run..."

  npx --yes lighthouse "$url" \
    $extra \
    --only-categories=performance,accessibility,best-practices,seo \
    --output=json \
    --output=html \
    --output-path="$out_base" \
    --chrome-path="$CHROME_PATH" \
    --chrome-flags="--headless=new --no-sandbox --disable-gpu"

  local status=$?
  if [ $status -ne 0 ]; then
    echo "  !! lighthouse exited with code $status for $slug $device"
    printf "%-22s %-10s %4s %4s %4s %4s\n" "$slug" "$device" "ERR" "ERR" "ERR" "ERR" >> "$SUMMARY_FILE"
    FAILURES=$((FAILURES+1))
    return
  fi

  if [ ! -f "$out_base.report.json" ]; then
    echo "  !! report not generated at $out_base.report.json"
    printf "%-22s %-10s %4s %4s %4s %4s\n" "$slug" "$device" "ERR" "ERR" "ERR" "ERR" >> "$SUMMARY_FILE"
    FAILURES=$((FAILURES+1))
    return
  fi

  # Extract scores
  local scores
  scores=$(node -e "
    try {
      const r = require('$out_base.report.json');
      const c = r.categories;
      const pct = (s) => s===null||s===undefined ? 'N/A' : Math.round(s*100);
      console.log([
        pct(c.performance && c.performance.score),
        pct(c.accessibility && c.accessibility.score),
        pct(c['best-practices'] && c['best-practices'].score),
        pct(c.seo && c.seo.score)
      ].join(' '));
    } catch (e) {
      console.log('ERR ERR ERR ERR');
    }
  ")
  echo "  scores P:$(echo $scores | awk '{print $1}') A:$(echo $scores | awk '{print $2}') BP:$(echo $scores | awk '{print $3}') SEO:$(echo $scores | awk '{print $4}')"
  printf "%-22s %-10s %4s %4s %4s %4s\n" "$slug" "$device" $scores >> "$SUMMARY_FILE"
  SUCCESSES=$((SUCCESSES+1))
}

for entry in "${PAGES[@]}"; do
  IFS="|" read -r url slug <<< "$entry"
  echo ">>> $slug ($url)"
  run_one "$url" "$slug" "mobile"
  run_one "$url" "$slug" "desktop"
  echo ""
done

echo "============================================"
echo "Done: $SUCCESSES succeeded, $FAILURES failed"
echo ""
echo "Summary table:"
cat "$SUMMARY_FILE"
echo ""
echo "Full HTML reports: $OUT_DIR"
echo "Open any .report.html in your browser for the full breakdown."
