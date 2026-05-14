#!/usr/bin/env python3
"""
Rebuild Website/sitemap.xml from actual pages on disk.

Scans Website/*.html and Website/blog/*.html, excludes drafts/internal/noindex
pages, and writes a fresh sitemap with file mtime as lastmod.

Run from repo root:
    python3 Website/scripts/rebuild-sitemap.py
"""
import re
from pathlib import Path
from datetime import datetime

WEBSITE = Path(__file__).resolve().parent.parent
BLOG = WEBSITE / "blog"
SITE_BASE = "https://www.elevateaisystem.com"

EXCLUDE = {
    "404.html", "og-render.html", "elevateai-site-map.html",
    "brand-os-agent.html",  # internal app, noindex
    "brand-os-workbook.html", "brand-os-workbook-read.html",
    "cohort-application.html",
    "command-center.html",
    "dashboard.html",
}

PRIORITY = {
    "index.html": "1.0",
    "brand-os.html": "0.95",
    "build-your-brand.html": "0.95",
    "augmented-coach.html": "0.9",
    "coach-platform.html": "0.9",
    "blog.html": "0.85",
    "about.html": "0.7",
    "faq.html": "0.6",
    "privacy.html": "0.3",
    "terms.html": "0.3",
}


def slug_url(filename: str) -> str:
    if filename == "index.html":
        return "/"
    return "/" + filename.replace(".html", "")


def is_noindex(p: Path) -> bool:
    try:
        head = p.read_text(encoding="utf-8", errors="ignore")[:3000]
    except Exception:
        return True
    return "noindex" in head.lower()


def main():
    urls = []

    for p in sorted(WEBSITE.glob("*.html")):
        name = p.name
        if name in EXCLUDE or name.endswith(".bak"):
            continue
        if is_noindex(p):
            continue
        urls.append({
            "loc": f"{SITE_BASE}{slug_url(name)}",
            "lastmod": datetime.fromtimestamp(p.stat().st_mtime).strftime("%Y-%m-%d"),
            "changefreq": "weekly",
            "priority": PRIORITY.get(name, "0.7"),
        })

    for p in sorted(BLOG.glob("*.html")):
        if p.name.startswith("linkedin-") or is_noindex(p):
            continue
        urls.append({
            "loc": f"{SITE_BASE}/blog/{p.stem}",
            "lastmod": datetime.fromtimestamp(p.stat().st_mtime).strftime("%Y-%m-%d"),
            "changefreq": "monthly",
            "priority": "0.6",
        })

    def key(u):
        if u["loc"].endswith(".com/"):
            return (0, "")
        if "/blog/" in u["loc"]:
            return (2, u["loc"])
        return (1, -float(u["priority"]), u["loc"])

    urls.sort(key=key)

    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        lines.append("  <url>")
        lines.append(f'    <loc>{u["loc"]}</loc>')
        lines.append(f'    <lastmod>{u["lastmod"]}</lastmod>')
        lines.append(f'    <changefreq>{u["changefreq"]}</changefreq>')
        lines.append(f'    <priority>{u["priority"]}</priority>')
        lines.append("  </url>")
    lines.append("</urlset>")

    out = WEBSITE / "sitemap.xml"
    out.write_text("\n".join(lines) + "\n")
    print(f"Wrote {len(urls)} URLs to {out.relative_to(WEBSITE.parent)}")
    print(f"  Root pages:  {sum(1 for u in urls if '/blog/' not in u['loc'])}")
    print(f"  Blog posts:  {sum(1 for u in urls if '/blog/' in u['loc'])}")


if __name__ == "__main__":
    main()
