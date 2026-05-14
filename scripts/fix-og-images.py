#!/usr/bin/env python3
"""
Bulk og:image fix for blog posts missing it.

Identifies blog posts in Website/blog/*.html that lack og:image meta and
inserts the standard OG/Twitter image tags. Default image used as fallback
is /og-image.png at site root. If a post-specific og image exists at
blog/images/{slug}-og.png, that path is used instead.

Run from repo root:
    python3 Website/scripts/fix-og-images.py --dry-run
    python3 Website/scripts/fix-og-images.py --apply
"""
import argparse, re, sys
from pathlib import Path

WEBSITE = Path(__file__).resolve().parent.parent  # Website/
BLOG = WEBSITE / "blog"
IMAGES = BLOG / "images"
SITE_BASE = "https://www.elevateaisystem.com"
DEFAULT_OG = f"{SITE_BASE}/og-image.png"


def resolve_og_image(slug: str) -> tuple[str, str]:
    """Return (og_url, alt) for a post slug."""
    slug_og = IMAGES / f"{slug}-og.png"
    if slug_og.exists():
        return f"{SITE_BASE}/blog/images/{slug}-og.png", f"{slug.replace('-', ' ').title()} | The Signal by ElevateAI System"
    return DEFAULT_OG, "ElevateAI System, AI for coaches and creators"


def has_og_image(head: str) -> bool:
    return bool(re.search(r'property=[\'"]og:image[\'"]', head, re.I))


def has_twitter_image(head: str) -> bool:
    return bool(re.search(r'name=[\'"]twitter:image[\'"]', head, re.I))


def get_title(head: str) -> str:
    m = re.search(r"<title>(.+?)</title>", head, re.I | re.S)
    return m.group(1).strip() if m else ""


def insert_og_block(html: str, slug: str) -> tuple[str, bool]:
    """Insert og:image and twitter:image into <head>. Returns (new_html, modified)."""
    head_match = re.search(r"(<head[^>]*>)(.*?)(</head>)", html, re.S | re.I)
    if not head_match:
        return html, False
    head = head_match.group(2)

    if has_og_image(head) and has_twitter_image(head):
        return html, False

    og_url, alt = resolve_og_image(slug)
    title = get_title(head) or alt

    # Build the block (only adding what's missing)
    additions = []
    if not has_og_image(head):
        additions.append(f'<meta property="og:image" content="{og_url}">')
        additions.append(f'<meta property="og:image:width" content="1200">')
        additions.append(f'<meta property="og:image:height" content="630">')
        additions.append(f'<meta property="og:image:alt" content="{alt}">')
    if not has_twitter_image(head):
        additions.append(f'<meta name="twitter:image" content="{og_url}">')
        additions.append(f'<meta name="twitter:image:alt" content="{alt}">')

    if not additions:
        return html, False

    block = "\n" + "\n".join(additions) + "\n"

    # Insert before </head>
    new_head = head.rstrip() + block
    new_html = html[:head_match.start()] + head_match.group(1) + new_head + head_match.group(3) + html[head_match.end():]
    return new_html, True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Write changes (default is dry-run)")
    parser.add_argument("--target", choices=["blog", "root", "both"], default="blog")
    args = parser.parse_args()

    targets: list[Path] = []
    if args.target in ("blog", "both"):
        targets.extend(sorted(BLOG.glob("*.html")))
    if args.target in ("root", "both"):
        targets.extend(p for p in sorted(WEBSITE.glob("*.html"))
                       if p.name not in {"404.html", "og-render.html", "elevateai-site-map.html"})

    fixed = 0
    skipped = 0
    for p in targets:
        slug = p.stem
        try:
            html = p.read_text(encoding="utf-8")
        except Exception as e:
            print(f"SKIP (read error): {p.name} ({e})", file=sys.stderr)
            skipped += 1
            continue

        new_html, modified = insert_og_block(html, slug)
        if not modified:
            continue

        if args.apply:
            p.write_text(new_html, encoding="utf-8")
            print(f"FIXED: {p.relative_to(WEBSITE)}")
        else:
            print(f"DRY-RUN would fix: {p.relative_to(WEBSITE)}")
        fixed += 1

    print(f"\n{'Applied' if args.apply else 'Dry-run'}: {fixed} files {'updated' if args.apply else 'would be updated'}, {skipped} skipped")
    if not args.apply and fixed:
        print("Re-run with --apply to write changes")


if __name__ == "__main__":
    main()
