# Memory — elevateaisystem.com

**Last refreshed:** 2026-05-04 (replaced stale Lead OS / Content OS / Growth Engine references; added SEO SOP)

## Me
Sunny Binjola, Founder of ElevateAI System. AI men's coach guiding brothers through breathwork, clarity, purpose, and integration into systems. Agency runway funds the mission.

## Core Products (the only two that exist)
| Product | Price | Length | Status |
|---------|-------|--------|--------|
| **Brand OS Agent** | $7 quick start, $2K full cohort | Self-serve + 8wk cohort | Live |
| **Build Your Brand** | $12K | 3 months | Live, flagship |

Augmented Coach Cohort ($2K, 8 weeks, max 10 coaches) is the cohort delivery container for Brand OS Agent. Coach Platform ($497 + $100/mo) is the productized system layer.

## Deprecated — never reference these
- ~~Lead OS~~ (collapsed into Brand OS Agent)
- ~~Content OS~~ (collapsed into Brand OS Agent)
- ~~Growth Engine~~ (collapsed into Build Your Brand)
- ~~SEO Audit Landing Page~~ (still has audit skill but no longer a public page)
- Sprint $497 (deprecated 2026-04-18)

## ICP
Men's coaches and creators doing $10K+/month (primary). Coaches and creators broadly (secondary). See `memory/seo/zipper-architecture.md` for the niche-specific landing page matrix.

## New Page Template Rules
Every new page MUST include:
1. **Leaf SVG logo** (not shield):
   ```html
   <div class="nav-logo-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg></div>
   <span class="nav-logo-text">Elevate<span>AI</span></span>
   ```
2. **Favicon (green leaf SVG data URI)**:
   ```html
   <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='24' fill='%2300FF41'/%3E%3Cpath d='M50 20 C35 20 25 35 25 55 C25 75 40 80 50 80 C60 80 75 75 75 55 C75 35 65 20 50 20 Z' fill='%23020802'/%3E%3Cpath d='M50 80 L50 85' stroke='%23020802' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E">
   ```
3. **All 80 SEO signals from `memory/seo/seo-sop.md`** — title, meta description (150-160 chars), canonical, og:image (1200x630 PNG), Twitter card, JSON-LD schema (right type — Service for product pages, BlogPosting for blogs), exactly one H1 with primary keyword.
4. **Apollo tracker** appId 69af333ec98ca400116945f0
5. **sunny.binjola@gmail.com** in footer
6. **Cluster membership** — every page belongs to one of the 5 clusters (see `memory/seo/keyword-clusters.md`). No standalone pages.
7. **Lighthouse 100/100** target across SEO, Accessibility, Best Practices, Performance before deploy.

## SEO Workflow
- **Strategy:** `memory/seo/seo-sop.md` (80-signal checklist + cluster + zipper rules)
- **Targeting:** `memory/seo/keyword-clusters.md` (5 clusters, hub-and-spoke)
- **Niche expansion:** `memory/seo/zipper-architecture.md` (product x niche matrix, 20+ pages)
- **Blog generation:** `Website/blog_skill.md` (with competitive theft + signal checklist)

Before creating any new page, read all four. Before publishing any page, run the 80-signal checklist + Lighthouse.

## Blog Rules
- Add one blog per day, always ADDING to list, NEVER removing existing posts
- Audience: coaches and creators (NOT general public)
- Each blog gets: SEO meta tags, JSON-LD BlogPosting, LinkedIn share button, category badge
- Structure: blog.html (listing at root), blog/*.html (individual posts)
- Newest posts appear first in the grid
- Every post belongs to one of the 5 clusters and links to 2 siblings + 1 hub + 1 money page
- **og:image required**: 1200x630 PNG at `blog/images/{slug}-og.png`, wired into og:image, twitter:image, JSON-LD `image`
- **Visuals required**: 2-3 inline charts/diagrams/comparison tables in brand colors (HTML/CSS/SVG, no external images)

## Blog Image Specs
Every new blog post MUST include 3 generated images:
1. **Hero** (`blog/images/{slug}-hero.png`, ~1520x800): Full image with title, tag, stat callout, brand bar. Used in article body below H1.
2. **Card background** (`blog/images/{slug}-bg.png`, ~1400x700): Visual data only, no title text. Used as CSS background on featured card with gradient overlay.
3. **OG/social** (`blog/images/{slug}-og.png`, 1200x630): Resized from hero. Referenced in og:image, twitter:image, JSON-LD image.

Design specs:
- Background: var(--navy) #0A0F1C with subtle 60px grid lines (#0D1425)
- Green accent line at top (3-4px, #00FF41)
- Stat cards: #141C30 bg, #1E2840 border, 12px radius, color-coded accents
- Fonts: InstrumentSans-Bold (titles/stats), GeistMono (labels/tags)
- Brand watermark: "ElevateAI System" bottom-right, subtle

When updating blog.html:
- Featured card uses bg image with gradient overlay
- Previous featured post moves to sidebar
- New post added to JSON-LD array, blog grid, and category column

## Voice Rules (sitewide)
- **No em-dashes anywhere** — they're an AI tell that undermines the "writes in your voice" positioning. Use commas, periods, parens, or colons instead.
- **No corp-speak hedging** — "could potentially" is dead. "X is defined as..." is alive.
- **Embodied, resonance-first language** — every product page should sound like Sunny across the table from a coach, not like a SaaS landing page.
- **Analyst voice in blogs** — facts plus applied analysis, subjectivity ~0.47 (Zone 4 of the AI-citable framework).

## Recommended AI Tools (when writing about tools for coaches)
1. **Wispr Flow** — voice-to-text. Always include referral: https://wisprflow.ai/r?SUNNY113
2. **Granola AI** (or Otter.ai / Fireflies) — AI meeting notes
3. **Claude Cowork** — AI business partner
4. **Notion AI** — second brain
5. **Apollo** — lead generation

## Credentials
| Service | Value |
|---------|-------|
| Supabase URL | https://modepuhwinzdngirlnkz.supabase.co |
| Supabase Anon Key | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZGVwdWh3aW56ZG5naXJsbmt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MDYxNTEsImV4cCI6MjA4ODA4MjE1MX0.1S2wC8CxE8_MCTmsGwoiOoqNYw_lXIM7_CT_-AG6DAI |
| Supabase Dashboard | https://supabase.com/dashboard/project/modepuhwinzdngirlnkz |
| Apollo appId | 69af333ec98ca400116945f0 |
| Beehiiv pub ID | f390a157-1409-46d7-8d9e-1eff7e3a4d64 |
| Beehiiv RSS | https://rss.beehiiv.com/feeds/jzWps6hDPD.xml |
| Beehiiv subdomain | the321.beehiiv.com |

## Preferences
- Cal.com (discovery): https://cal.com/sunny-binjola/discovery-call
- Cal.com (strategy hour): https://cal.com/sunny-binjola/ai-strategy-call
- Cal.com (SEO chat): https://cal.com/sunny-binjola/quick-seo-chat
- Site colors: --green:#00FF41, --navy:#0A0F1C, --bg:#FAFAF8
- Font: Plus Jakarta Sans
- Email (footer + support): sunny.binjola@gmail.com
