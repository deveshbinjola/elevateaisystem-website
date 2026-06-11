# SEO + AEO + GEO Audit — elevateaisystem.com
**Date:** May 14, 2026  
**Auditor:** Jarvis  
**Site:** elevateaisystem.com (static, Cloudflare Pages) + app.elevateaisystem.com (Next.js SaaS)

---

## Executive Summary

**Overall:** Strong foundation with serious blind spots. The homepage is well-optimized (5 JSON-LD blocks, full OG/Twitter cards, FAQ schema, canonical, hreflang). Blog posts are consistently solid (82 posts, all with meta descriptions, canonicals, OG images, and JSON-LD). However, **three critical issues** are bleeding authority: a www/non-www canonical mismatch, a pricing page stripped of nearly all SEO signals, and zero AEO-specific schema (Speakable, HowTo) across the entire site. The GEO layer (llms.txt) exists but is outdated with wrong pricing.

**Biggest strengths:**
- Homepage has 5 JSON-LD blocks (WebSite, Organization, Person, Service, FAQPage) — best-in-class
- 82 blog posts, all with complete meta tags, OG images, and BlogPosting schema
- 30 niche landing pages + 3 comparison pages — strong long-tail SEO play
- robots.txt explicitly allows ALL AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.)
- llms.txt exists with structured AI-readable business info

**Top 3 priorities (do these first):**
1. Fix www vs non-www canonical mismatch — you're splitting authority between two domains
2. Add structured data + full meta tags to pricing.html — it's invisible to search engines
3. Add Speakable + HowTo schema to blog posts — you're missing AI Overview/Featured Snippet eligibility

---

## 1. CRITICAL: www vs. non-www Canonical Mismatch

| Page | Canonical URL | Sitemap URL |
|------|--------------|-------------|
| Homepage | `https://www.elevateaisystem.com/` | `https://www.elevateaisystem.com/` |
| Pricing | `https://elevateaisystem.com/pricing` | `https://www.elevateaisystem.com/pricing` |
| Coach Platform | `https://elevateaisystem.com/coach-platform` | `https://www.elevateaisystem.com/coach-platform` |
| Blog posts | `https://www.elevateaisystem.com/blog/...` | `https://www.elevateaisystem.com/blog/...` |

**Problem:** Homepage and blog posts use `www`. Pricing and coach-platform use non-`www`. The sitemap uses `www` everywhere. Google sees these as two different URLs and splits your ranking signals.

**Fix:** Every canonical must use `https://www.elevateaisystem.com/...` (matching the sitemap). Update pricing.html and coach-platform.html canonicals.

**Severity:** CRITICAL — directly hurts rankings.

---

## 2. On-Page SEO Audit

### Homepage ✅ (Score: 9/10)
- Title: 56 chars ✅
- Meta description: 185 chars ⚠️ (slightly over 160 limit, may get truncated)
- H1: "AI Marketing Trained On Your Actual Voice" ✅
- Canonical: ✅ (www)
- Hreflang: ✅
- OG image with dimensions: ✅
- JSON-LD: 5 blocks (WebSite, Organization, Person, Service, FAQPage) ✅
- Keywords meta: ✅
- robots meta: ✅

**Only issue:** Meta description is ~25 chars over. Trim to under 160.

### Pricing Page ❌ (Score: 3/10)
- Title: ✅ (62 chars, good)
- Meta description: ✅
- **Missing:** hreflang, robots meta, og:image:width/height, og:site_name, twitter:image (uses og:image fallback only), author, keywords meta
- **Missing:** ALL structured data (0 JSON-LD blocks)
- **Missing:** FAQPage schema (pricing pages are FAQ goldmines)
- Canonical: ⚠️ non-www (should be www)
- OG image: generic `og-default.png` (should be pricing-specific)

**Fix priority:** HIGH. This is a money page. Needs full meta suite + PricingTable or Service schema + FAQ schema.

### Coach Platform Page ✅ (Score: 7/10)
- Title: ✅ (55 chars)
- Meta description: ✅
- Keywords: ✅
- OG image: ✅ (coach-platform-og.png with dimensions + alt)
- JSON-LD: 1 block ✅
- Canonical: ⚠️ non-www (should be www)
- **Missing:** FAQPage schema, hreflang

### Blog Posts ✅ (Score: 8/10)
- All 82 posts have: meta description ✅, canonical ✅, OG image ✅, JSON-LD ✅
- BlogPosting schema with proper article metadata ✅
- Internal linking: ~2 links per post average (162 total / 82 posts) — could be higher

**Blog improvement:** Increase internal links to 3-5 per post. Add "Related reads" sections. Add FAQ schema to posts that answer questions.

### Niche Pages (30 pages) — Spot Check Needed
- 30 niche-specific landing pages (adhd-coaches, business-coaches, etc.)
- 3 comparison pages (vs/diy-marketing, vs/freelancer, vs/marketing-agency)
- These are excellent for long-tail SEO — verify each has unique meta description + canonical + JSON-LD

### Sitemap Health ⚠️
- Sitemap lists **98 URLs**
- Actual pages: **82 blog + 41 top-level = 123 HTML files**
- **~25 pages may be missing from sitemap** (likely niche pages, vs pages, or utility pages)
- Sitemap lastmod dates should be updated when pages change

---

## 3. AEO (Answer Engine Optimization) Audit

AEO targets Google's Featured Snippets, AI Overviews, and People Also Ask boxes.

### Current State: WEAK ❌

| AEO Signal | Count | Where |
|------------|-------|-------|
| FAQPage schema | 1 | Homepage only |
| Speakable schema | 0 | Nowhere |
| HowTo schema | 0 | Nowhere |
| VideoObject schema | 0 | Nowhere |
| ClaimReview schema | 0 | Nowhere |

### What's Missing and Why It Matters

**1. Speakable Schema — Priority: HIGH**
Google uses Speakable to identify content suitable for voice assistants and AI Overviews. Without it, your content is less likely to be read aloud or cited in voice search.

**Add to:** Homepage (key value props), coach-platform (feature descriptions), top 10 blog posts by traffic.

**2. HowTo Schema — Priority: HIGH**
Your blog posts explain processes (how to use AI for coaching, how to build a brand, etc.). HowTo schema makes these eligible for rich results with step-by-step formatting.

**Add to:** Any blog post with step-by-step instructions. Candidates:
- "The 2026 Coach's Operating System" (pillar post)
- Posts about Brand OS workflow
- Posts about content creation with AI

**3. FAQPage Schema Expansion — Priority: HIGH**
Only the homepage has FAQ schema. Every page with questions should have it:
- **Pricing page:** "What's included in the free tier?" "When do I need to upgrade?" "Is there a contract?"
- **Coach platform page:** "How does voice AI work?" "What data do you store?" "Can I import existing leads?"
- **Blog posts:** Add 2-3 FAQ items per post targeting People Also Ask queries

**4. Question-Based H2s in Blog Posts — Priority: MEDIUM**
Blog headings should mirror PAA (People Also Ask) queries:
- Instead of: "The AI Advantage"
- Use: "How Does AI Help Coaches Get More Clients?"

This is the single biggest lever for appearing in AI Overviews.

---

## 4. GEO (Generative Engine Optimization) Audit

GEO targets AI chatbots: ChatGPT, Perplexity, Claude, Gemini.

### Current State: GOOD FOUNDATION, STALE DATA ⚠️

**What's working:**
- `robots.txt` allows ALL AI crawlers ✅ (GPTBot, ChatGPT-User, ClaudeBot, PerplexityBot, CCBot, etc.)
- `llms.txt` exists with structured business info ✅
- Sitemap referenced in robots.txt ✅

**What's broken:**

**1. llms.txt is OUTDATED — Priority: CRITICAL**
- Last updated: March 30, 2026
- Lists old agency pricing: Lead OS $375/mo, Content OS $1,500/mo, Growth Engine $5,000+/mo
- Current pricing: Free tier, Voice Engine $79/mo, Client OS $179/mo
- **AI models citing your pricing will give WRONG NUMBERS to potential customers**

**2. No llms-full.txt — Priority: HIGH**
- `llms.txt` is the summary. `llms-full.txt` is the detailed version AI models prefer for deep context.
- Should include: full service descriptions, detailed case studies, complete FAQ, blog topic index

**3. No .well-known/ai-plugin.json — Priority: MEDIUM**
- Emerging standard for AI agent discovery
- Tells ChatGPT plugins, Perplexity, etc. what your site offers programmatically

**4. Citation-Optimized Content Formatting — Priority: MEDIUM**
AI models cite content that follows predictable patterns:
- **Definition blocks:** "ElevateAI System is..." (first sentence of key pages)
- **Stat callouts:** Numbers in bold or standalone sentences are cited more
- **Comparison tables:** AI models love structured comparisons
- **Entity-first paragraphs:** Start paragraphs with the entity name, not pronouns

**5. Entity Consistency — Priority: MEDIUM**
- Some pages say "ElevateAI System" (singular), others "ElevateAI Systems" (plural)
- llms.txt says "Elevate AI System" (with space)
- Pick ONE and use it everywhere. AI models get confused by variants.

---

## 5. Technical SEO Checklist

| Check | Status | Details |
|-------|--------|---------|
| HTTPS | ✅ Pass | Full HTTPS with HSTS (31536000s) |
| Security Headers | ✅ Pass | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| Mobile Viewport | ✅ Pass | All pages have viewport meta |
| Sitemap | ⚠️ Warning | Exists but missing ~25 pages (niche/vs pages likely missing) |
| robots.txt | ✅ Pass | Well-structured, allows all crawlers, references sitemap |
| Canonical Tags | ❌ Fail | www/non-www mismatch on pricing + coach-platform |
| Hreflang | ⚠️ Warning | Only on homepage, missing from inner pages |
| Image Alt Text | ✅ Pass | Homepage: 1 img, 0 missing alt |
| Page Speed | ✅ Pass | Homepage loads in <1s (Cloudflare CDN) |
| Structured Data | ⚠️ Mixed | Homepage excellent (5 blocks), pricing zero, blog good |
| Broken Links | ❓ Unchecked | Need to run a full crawl to verify |
| Cache Headers | ⚠️ Warning | `cache-control: public, max-age=0, must-revalidate` — no browser caching for static assets |

---

## 6. Content Gap Analysis

### Missing Content Types

| Gap | Why It Matters | Priority | Effort |
|-----|---------------|----------|--------|
| **Glossary page** | AI models LOVE glossaries for definitions. "What is Brand OS?" "What is LLMO?" — you coined terms, own the definitions | HIGH | Half day |
| **Pillar page for ELEVATE Method** | You have the framework but no dedicated deep-dive page. This should be your #1 ranking target | HIGH | Full day |
| **Case study pages** (standalone) | Currently buried in homepage. Dedicated `/case-studies/` pages rank independently | HIGH | Half day each |
| **Tool/calculator page** | "AI Readiness Score" or "Marketing ROI Calculator" — link magnets | MEDIUM | 1-2 days |
| **Video content** | Zero VideoObject schema. Even embedding 1 YouTube video per key page helps | MEDIUM | Ongoing |
| **Comparison pages** (expand) | You have 3 vs/ pages. Add: vs/chatgpt, vs/jasper, vs/copy-ai, vs/generic-ai-tools | MEDIUM | Half day each |

### Funnel Gaps

| Stage | Current Coverage | Gap |
|-------|-----------------|-----|
| Awareness | Blog (82 posts) ✅ | Need more "what is" and "how to" posts for top-funnel |
| Consideration | Coach platform page ✅, niche pages ✅ | Need dedicated case study pages, ROI calculator |
| Decision | Pricing ✅ | Need comparison pages vs competitors, testimonial page |
| Retention | App (coach-app) ✅ | N/A |

---

## 7. Keyword Opportunity Table

| Keyword | Est. Difficulty | Opportunity | Intent | Recommended Content |
|---------|----------------|-------------|--------|-------------------|
| AI for coaches | Hard | HIGH | Commercial | Coach platform page (already have — optimize) |
| AI coaching platform | Hard | HIGH | Commercial | Coach platform page + comparison pages |
| Brand OS for coaches | Easy | HIGH | Navigational | Dedicated Brand OS landing page |
| AI marketing for coaches | Medium | HIGH | Commercial | Blog pillar + coach platform |
| coaching business automation | Medium | HIGH | Commercial | Blog post + case study |
| AI lead generation for coaches | Medium | HIGH | Commercial | Niche page + blog |
| how to use AI as a coach | Easy | HIGH | Informational | HowTo blog post (add schema!) |
| AI content creation for coaches | Medium | MEDIUM | Commercial | Blog + feature page |
| coach CRM with AI | Medium | MEDIUM | Commercial | Coach platform page |
| LLMO optimization | Easy | HIGH | Informational | Blog pillar — you can OWN this term |
| what is generative engine optimization | Easy | HIGH | Informational | Glossary + blog post |
| AI voice marketing | Medium | MEDIUM | Informational | Blog + coach platform |
| coaching business growth strategies | Hard | MEDIUM | Informational | Blog cluster |
| best AI tools for coaches 2026 | Medium | HIGH | Commercial | Comparison/listicle blog post |
| AI email response for coaches | Easy | HIGH | Commercial | Feature page for lead reply |

---

## 8. Prioritized Action Plan

### Quick Wins (This Week) ⚡

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 1 | **Fix www/non-www canonical mismatch** on pricing.html + coach-platform.html | CRITICAL | 10 min |
| 2 | **Update llms.txt** with current Coach Platform pricing ($0/$79/$179) | CRITICAL | 30 min |
| 3 | **Add full meta suite to pricing.html** (robots, hreflang, og:site_name, twitter:image, author, keywords, og:image dimensions) | HIGH | 30 min |
| 4 | **Add FAQPage schema to pricing.html** (5-7 pricing questions) | HIGH | 45 min |
| 5 | **Add FAQPage schema to coach-platform.html** | HIGH | 45 min |
| 6 | **Trim homepage meta description** to under 160 chars | LOW | 5 min |
| 7 | **Fix entity name consistency** — pick "ElevateAI System" or "Elevate AI System", use everywhere | MEDIUM | 1 hour |
| 8 | **Update sitemap.xml** to include all niche pages + vs pages (~25 missing URLs) | HIGH | 30 min |

### Strategic Investments (This Quarter) 🏗️

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 1 | **Add Speakable schema** to homepage, coach-platform, and top 10 blog posts | HIGH | 2-3 hours |
| 2 | **Add HowTo schema** to 10+ blog posts with step-by-step content | HIGH | 3-4 hours |
| 3 | **Create llms-full.txt** with complete business context for AI models | HIGH | Half day |
| 4 | **Build ELEVATE Method pillar page** — dedicated deep-dive on your 4-pillar framework | HIGH | Full day |
| 5 | **Build glossary page** — define Brand OS, LLMO, GEO, AEO, ELEVATE Method | HIGH | Half day |
| 6 | **Create standalone case study pages** — 2-3 dedicated URLs with full stories | MEDIUM | Half day each |
| 7 | **Rewrite blog H2s as questions** — mirror People Also Ask format for AI Overview eligibility | MEDIUM | 2-3 hours |
| 8 | **Add "Related Reads" sections** to all blog posts (increase internal links from ~2 to 4-5 per post) | MEDIUM | 3-4 hours |
| 9 | **Add comparison pages**: vs/chatgpt-marketing, vs/jasper-for-coaches, vs/generic-ai-tools | MEDIUM | Half day each |
| 10 | **Create pricing-og.png** — custom OG image for pricing (currently using generic og-default.png) | LOW | 1 hour |
| 11 | **Set browser cache headers** for static assets (CSS, JS, images) — currently `max-age=0` | MEDIUM | Config change |

---

## Score Card

| Dimension | Score | Notes |
|-----------|-------|-------|
| **SEO — On-Page** | 7/10 | Homepage excellent, pricing weak, blog solid |
| **SEO — Technical** | 6/10 | Canonical mismatch + sitemap gaps hurt |
| **SEO — Content** | 8/10 | 82 blog posts + 30 niche pages is strong |
| **AEO** | 3/10 | Only FAQPage on homepage. No Speakable, HowTo, VideoObject |
| **GEO** | 5/10 | llms.txt exists but outdated. robots.txt perfect. No llms-full.txt |
| **Overall** | 6/10 | Strong content engine, weak structured data + AEO layer |

---

## Next Steps

The fastest path to improvement:
1. Fix the 8 quick wins above (2-3 hours total)
2. Then tackle Speakable + HowTo schema (the AEO gap is your biggest missed opportunity)
3. Then update llms.txt + create llms-full.txt (AI models are citing wrong pricing)

Would you like me to:
- **Fix the quick wins now?** (canonical, pricing meta, FAQ schema, llms.txt update)
- **Draft the Speakable/HowTo schema** for your top pages?
- **Create llms-full.txt** with current pricing and full business context?
- **Build the ELEVATE Method pillar page?**
- **Run a competitor comparison** against specific competitors?
