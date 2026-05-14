#!/usr/bin/env python3
"""
Parse Lighthouse JSON reports and output a prioritized fix list.

Reads every .report.json in Website/deliverables/lighthouse/ and surfaces:
  - Failed audits (score < 1.0) per category, with potential savings
  - Common issues across pages (one fix lifts everything)
  - Per-page actionable items sorted by impact

Run from repo root:
    python3 Website/scripts/lighthouse-fix-list.py
"""
import json, sys
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
LH_DIR = ROOT / "deliverables" / "lighthouse"

# Audits to highlight in each category, in order of typical impact
PRIORITY_AUDITS = {
    "performance": [
        "largest-contentful-paint", "first-contentful-paint", "total-blocking-time",
        "cumulative-layout-shift", "speed-index", "interactive",
        "render-blocking-resources", "unused-css-rules", "unused-javascript",
        "modern-image-formats", "uses-optimized-images", "uses-text-compression",
        "uses-responsive-images", "efficient-animated-content",
        "preload-lcp-image", "uses-rel-preconnect", "font-display",
    ],
    "accessibility": [
        "color-contrast", "image-alt", "label", "button-name", "link-name",
        "aria-allowed-attr", "aria-required-attr", "aria-valid-attr",
        "html-has-lang", "html-lang-valid", "meta-viewport",
        "tabindex", "duplicate-id-active",
    ],
    "best-practices": [
        "errors-in-console", "deprecations", "no-vulnerable-libraries",
        "csp-xss", "is-on-https", "geolocation-on-start", "notification-on-start",
        "image-aspect-ratio", "image-size-responsive",
        "viewport", "doctype", "charset",
    ],
    "seo": [
        "meta-description", "document-title", "html-has-lang",
        "link-text", "is-crawlable", "robots-txt",
        "image-alt", "hreflang", "canonical", "structured-data",
        "tap-targets", "viewport",
    ],
}


def load_reports():
    if not LH_DIR.exists():
        print(f"No reports dir at {LH_DIR}")
        sys.exit(1)
    reports = []
    for p in sorted(LH_DIR.glob("*.report.json")):
        try:
            data = json.loads(p.read_text())
            stem = p.stem.replace(".report", "")
            # parse: 2026-05-05-home-mobile -> page="home", device="mobile"
            parts = stem.split("-")
            device = parts[-1]
            page = "-".join(parts[3:-1])
            reports.append({"path": p, "page": page, "device": device, "data": data})
        except Exception as e:
            print(f"skip {p.name}: {e}")
    return reports


def category_scores(report):
    cats = report["data"].get("categories", {})
    return {k: round(v.get("score", 0) * 100) if v.get("score") is not None else None for k, v in cats.items()}


def failed_audits(report, category):
    """Return failed audits in a category, sorted by displayValue/savings."""
    cat = report["data"].get("categories", {}).get(category, {})
    audit_refs = cat.get("auditRefs", [])
    audits = report["data"].get("audits", {})

    failed = []
    for ref in audit_refs:
        aid = ref["id"]
        a = audits.get(aid, {})
        score = a.get("score")
        if score is None or score >= 0.9:
            continue
        weight = ref.get("weight", 0)
        # Skip informational audits
        if a.get("scoreDisplayMode") in ("informative", "manual", "notApplicable"):
            continue
        savings_ms = a.get("details", {}).get("overallSavingsMs", 0)
        failed.append({
            "id": aid,
            "title": a.get("title", aid),
            "description": (a.get("description") or "")[:140],
            "score": score,
            "weight": weight,
            "displayValue": a.get("displayValue", ""),
            "savings_ms": savings_ms,
        })
    failed.sort(key=lambda x: (-x["weight"], -x["savings_ms"]))
    return failed


def main():
    reports = load_reports()
    if not reports:
        print("No reports found.")
        return

    print("=" * 70)
    print("LIGHTHOUSE FIX LIST  -  ElevateAI System")
    print("=" * 70)
    print()

    # 1. Common failed audits across all pages
    common = defaultdict(list)
    for r in reports:
        for cat in ("performance", "accessibility", "best-practices", "seo"):
            for fa in failed_audits(r, cat):
                common[(cat, fa["id"], fa["title"])].append(f"{r['page']}/{r['device']}")

    print("PART 1 - COMMON ISSUES (one fix helps every page)")
    print("-" * 70)
    items = sorted(common.items(), key=lambda kv: -len(kv[1]))
    for (cat, aid, title), pages in items[:15]:
        if len(pages) < 2:
            continue
        print(f"\n  [{cat}] {title}")
        print(f"      audit: {aid}")
        print(f"      affects {len(pages)}/{len(reports)} runs: {', '.join(pages[:6])}{'...' if len(pages)>6 else ''}")

    # 2. Per-page top fixes
    print("\n\nPART 2 - PER-PAGE TOP 5 OPPORTUNITIES")
    print("-" * 70)
    for r in reports:
        scores = category_scores(r)
        print(f"\n>>> {r['page']} / {r['device']}    "
              f"P:{scores.get('performance')} A:{scores.get('accessibility')} "
              f"BP:{scores.get('best-practices')} SEO:{scores.get('seo')}")
        all_failed = []
        for cat in ("performance", "accessibility", "best-practices"):
            for fa in failed_audits(r, cat):
                all_failed.append((cat, fa))
        all_failed.sort(key=lambda x: (-x[1]["weight"], -x[1]["savings_ms"]))
        for cat, fa in all_failed[:5]:
            saving = f" (save ~{fa['savings_ms']}ms)" if fa["savings_ms"] else ""
            disp = f" [{fa['displayValue']}]" if fa["displayValue"] else ""
            print(f"   - [{cat}] {fa['title']}{disp}{saving}")

    # 3. Performance metrics summary table
    print("\n\nPART 3 - CORE WEB VITALS")
    print("-" * 70)
    print(f"{'Page':<22} {'Dev':<8} {'FCP':<10} {'LCP':<10} {'TBT':<10} {'CLS':<8} {'SI':<10}")
    for r in reports:
        a = r["data"].get("audits", {})
        def get(aid):
            return a.get(aid, {}).get("displayValue", "?")
        print(f"{r['page']:<22} {r['device']:<8} {get('first-contentful-paint'):<10} "
              f"{get('largest-contentful-paint'):<10} {get('total-blocking-time'):<10} "
              f"{get('cumulative-layout-shift'):<8} {get('speed-index'):<10}")

    print("\n\nDone. Open the HTML reports for full details:")
    for r in reports:
        print(f"  open {r['path'].with_suffix('.html').relative_to(ROOT.parent)}")


if __name__ == "__main__":
    main()
