# ElevateAI Blog System — Complete Guide

Everything you need to create, publish, and promote blog posts for elevateaisystem.com.

---

## Quick Start (3 Steps)

**Step 1** — Write your blog content in a simple markdown file (`.md`). Use `##` for section headings, `**bold**` for emphasis, `-` for bullet lists. That's it.

**Step 2** — Run the generator:

```bash
node generate-blog.js \
  --title "Your Blog Title Here" \
  --slug "your-url-slug" \
  --category "SEO" \
  --description "Your meta description for Google" \
  --keywords "keyword1, keyword2, keyword3" \
  --readtime "8 min read" \
  --file your-post.md
```

**Step 3** — Push to Cloudflare Pages:

```bash
git add . && git commit -m "New post: your-blog-title" && git push
```

That's it. The generator handles everything else automatically.

---

## What the Generator Does

When you run `generate-blog.js`, it automatically:

1. Converts your markdown into a fully styled HTML blog post matching your site's design
2. Adds the new post card to the top of your blog listing page (`blog.html`)
3. Adds the new URL to your sitemap (`sitemap.xml`) for Google indexing
4. Generates a ready-to-post LinkedIn version and saves it as `blog/linkedin-{slug}.txt`
5. Prints a preview of the LinkedIn post in your terminal

---

## Available Categories

| Category | Slug for --category | Card Color |
|----------|-------------------|------------|
| SEO | `SEO` | Green |
| AI | `AI` | Blue |
| Lead Generation | `Lead Generation` | Orange |
| Strategy | `Strategy` | Purple |
| Business | `Business` | Red |

---

## Markdown Formatting Guide

Your `.md` file supports:

```markdown
This is a regular paragraph. Just write naturally.

## Section Heading

Use ## for main sections. These become styled h2 headings.

**Bold text** for emphasis.

- Bullet point one
- Bullet point two
- Bullet point three

1. Numbered list item
2. Another numbered item

[Link text](https://example.com)

> This is a blockquote — great for callouts or client testimonials.
```

**Important**: Don't add a title (`# Title`) at the top of your markdown — the generator adds the title from the `--title` flag.

---

## All Available Flags

| Flag | Required | Description | Example |
|------|----------|-------------|---------|
| `--title` | Yes | Blog post title (shows in H1 and browser tab) | `"Why Coaches Need SEO"` |
| `--slug` | Yes | URL-friendly name (no spaces, lowercase) | `"why-coaches-need-seo"` |
| `--category` | Yes | One of the 5 categories above | `"SEO"` |
| `--description` | Yes | Meta description for Google (150-160 chars ideal) | `"Learn why SEO matters for coaches"` |
| `--keywords` | No | Comma-separated SEO keywords | `"seo, coaches, ranking"` |
| `--readtime` | No | Estimated read time (default: asks interactively) | `"8 min read"` |
| `--file` | Yes | Path to your markdown file | `"my-post.md"` |
| `--date` | No | Publish date (default: today) | `"2026-03-15"` |
| `--force` | No | Skip overwrite confirmation if slug exists | `y` |
| `--ctatitle` | No | Custom CTA box title | `"Ready to Grow?"` |
| `--ctatext` | No | Custom CTA box description | `"Book a free call"` |
| `--ctalink` | No | Custom CTA button link | `"/contact"` |
| `--ctabutton` | No | Custom CTA button text | `"Book Now"` |

---

## Interactive Mode

If you prefer not to use flags, just run:

```bash
node generate-blog.js
```

It will prompt you for each field one by one.

---

## LinkedIn Post Workflow

Every time you generate a blog post, a LinkedIn-ready version is automatically created at `site/blog/linkedin-{slug}.txt`.

**To post on LinkedIn:**

1. Open the generated `linkedin-{slug}.txt` file
2. Copy the entire contents
3. Paste into a new LinkedIn post
4. Post the blog URL as the **first comment** (not in the post body — LinkedIn penalizes posts with external links)
5. Done

**LinkedIn best practices baked into the generator:**
- Hook in the first 2 lines (what shows before "see more")
- Short paragraphs for mobile readability
- Arrow (→) bullet points for key takeaways
- Engagement question at the end
- Category-specific hashtags (5 per post)

**Best posting times:** Tuesday–Thursday, 8:00–9:30 AM in your audience's timezone.

---

## File Structure

After generating a post, your site directory looks like:

```
site/
├── blog.html                          ← Blog listing (auto-updated)
├── sitemap.xml                        ← Sitemap (auto-updated)
└── blog/
    ├── seo-for-coaches.html           ← Existing post
    ├── ai-for-coaches.html            ← Existing post
    ├── getting-clients-online.html    ← Existing post
    ├── coaches-need-systems-not-content.html
    ├── coaching-business-mistakes.html
    ├── your-new-post.html             ← NEW: Generated blog post
    └── linkedin-your-new-post.txt     ← NEW: LinkedIn version
```

---

## SEO Checklist (Built In)

The generator automatically handles all of these:

- [x] Proper `<title>` tag with site name
- [x] Meta description
- [x] Open Graph tags (for social sharing)
- [x] Twitter Card tags
- [x] Canonical URL (clean, no .html)
- [x] BreadcrumbList structured data (schema.org)
- [x] Article structured data (schema.org)
- [x] Internal links (back to blog listing, CTA to audit page)
- [x] Mobile-responsive design
- [x] Sitemap entry with correct priority and date

**What you should still do manually:**
- Add 2-3 internal links within your blog content to other posts or service pages
- Include your target keyword in the first 100 words of your markdown
- Use your keyword in at least one `##` heading
- Keep meta description between 150-160 characters

---

## Example: Full Workflow

```bash
# 1. Write your post
nano my-new-post.md

# 2. Generate everything
node generate-blog.js \
  --title "How to Price Your Coaching Services" \
  --slug "pricing-coaching-services" \
  --category "Business" \
  --description "Stop undercharging. Learn the 3 pricing models that help coaches earn what they're worth." \
  --keywords "coaching pricing, coaching rates, how to price coaching" \
  --readtime "7 min read" \
  --file my-new-post.md

# 3. Review the output
# - Check site/blog/pricing-coaching-services.html in browser
# - Check site/blog/linkedin-pricing-coaching-services.txt

# 4. Deploy
cd site
git add .
git commit -m "New post: How to Price Your Coaching Services"
git push

# 5. Post on LinkedIn
# Copy contents of linkedin-pricing-coaching-services.txt → paste into LinkedIn
# Add blog URL as first comment
```

---

## Troubleshooting

**"File not found" error** — Make sure the `--file` path is correct relative to where you're running the command.

**Blog listing not updating** — The script looks for `blog.html` in the `site/` directory. Make sure you're running the script from the project root (where `site/` folder is).

**Category not recognized** — Use one of the exact category names: `SEO`, `AI`, `Lead Generation`, `Strategy`, `Business`.

**Want to overwrite an existing post** — Add `--force y` to skip the confirmation prompt.

---

## AI-Citable Blog Framework (ELEVATE Method — LLMO)

Every blog post should be structured so AI systems (ChatGPT, Perplexity, Google AI Mode) can cite it. This is separate from SEO — ranking and citation are different systems. SEO ranking explains only 4-7% of AI citations.

### The 5-Zone Structure

**Zone 1: The First 30% — Front-Load Your Answer**
44.2% of all ChatGPT citations come from the first 30% of page text. Content buried deep is 2.5x less likely to be cited.
- Put your primary finding, thesis, or answer FIRST. Not background. Not "in this article we'll explore..."
- Lead with entity-dense language: name specific tools, frameworks, numbers
- Every sentence should be extractable on its own — no "as mentioned above"

**Zone 2: Answer Capsules — Question H2s + Declarative Answers**
72.4% of ChatGPT-cited posts use this pattern: a question as an H2, followed by a self-contained answer of 120-150 characters.
- Write H2s as real questions your audience asks
- Follow each H2 immediately with a declarative answer (1-2 sentences, no hedging)
- Repeat the key entity from the heading in the first word of the answer
- No links inside the answer capsule
- Target 10-17 words per sentence for key claims

**Zone 3: Self-Contained Sections — 120-180 Words Between H2s**
AI retrieval systems chunk pages and evaluate each chunk independently.
- Each section between H2s must make sense WITHOUT context from surrounding sections
- Optimal length: 120-180 words per section for ChatGPT, 100-150 for AI Mode
- Sections under 50 words get 70% fewer citations
- Never reference "the approach above" or "as we discussed"
- Focused 800-word posts outperform 4,000-word guides for AI grounding coverage

**Zone 4: Analyst Voice — Facts + Applied Analysis**
Not all writing styles get cited equally. The sweet spot is a subjectivity score of 0.47 (not pure facts, not pure opinion).
- Write like: "The data shows X, which means Y for coaches doing Z"
- Use definitive language: "X is defined as..." not "X could potentially be..."
- Match readability to intent: plain language for informational, precise terminology for technical
- Avoid corporate middle-ground (Flesch 50-59) — that's the dead zone for citations

**Zone 5: Technical Signals**
- Meta descriptions matter for AI — write them for the LLM, not just human searchers
- Generic schema markup (Article, Organization) actually HURTS citation rate (41.6% vs 59.8% with no schema)
- Only use attribute-rich schema with full specifications (Product/Review with pricing, ratings = 61.7%)
- URL slugs: 17-40 characters, descriptive, keyword-similar
- Page speed: FCP under 0.4 seconds = 3x more ChatGPT citations

### Quick Checklist for Every Post

- [ ] Answer/thesis appears in the first 30% of the post
- [ ] At least 3 H2s are phrased as questions with declarative answers
- [ ] Each section is self-contained (120-180 words)
- [ ] No "as mentioned above" or context-dependent references
- [ ] Entity-dense opening (name tools, frameworks, numbers)
- [ ] Analyst voice: facts + applied analysis, not hedging
- [ ] Meta description written for AI citation, not just clicks
- [ ] Page loads fast (test FCP)

---

## The "One Question, 100 Answers" Strategy

The fastest path to topical authority (and LLMO citation) is answering the same core question 100 different ways across all content formats. This compounds into an authority signal that AI models and Google can't ignore.

### How It Works

**Step 1: Pick your pillar question for the month.** This should be the #1 question your ideal clients ask. Examples:
- "How do I get coaching clients without cold DMs?"
- "What's the difference between SEO and AI search?"
- "How do I automate my coaching business?"

**Step 2: Answer it in every format Content OS produces:**
- Blog post (long-form, AI-citable, 5-Zone structure)
- LinkedIn thread (3-5 posts across the month)
- Instagram carousel (visual framework breakdown)
- Newsletter section (personal angle + data)
- Twitter/X thread (punchy, contrarian take)
- Case study (client result tied to the question)
- Video script (walkthrough or tutorial)

**Step 3: Each answer adds a new angle:**
- Different client scenario or industry vertical
- New data point or stat
- Contrarian take vs. conventional wisdom
- Step-by-step process breakdown
- Failure story + lesson learned
- Comparison (your method vs. alternatives)

**Why this works for LLMO:** When AI models encounter 15-20 pieces of content from the same source answering variations of the same question, they classify that source as an authority. This is how you become the default citation for your niche.

---

## Weekly Process Documentation Template

Every week, publish at least one "process doc" — a mini case study that compounds into your authority over time.

**Format:**
> [Client type] was struggling with [specific problem]. We [specific action — name the tool, the framework, the system]. Result: [specific outcome with numbers].

**Example:**
> A mindset coach with 4K Instagram followers was getting zero inbound leads from her content. We ran her through Voice Extraction, rebuilt her bio using the 3-line formula (what + proof + CTA), and launched a 7-day zero-click content sprint on LinkedIn. Result: 14 discovery call bookings in 3 weeks, 3 closed at $5K each.

**Publish as:**
- Blog post (long version with details)
- LinkedIn post (condensed, story format)
- Newsletter section ("What we shipped this week")
- Instagram carousel ("From 0 leads → 14 calls in 3 weeks")

---

## Content Ideas Pipeline

Keep a running list of blog post ideas based on what your coaching clients ask most. Good sources:

- Questions from discovery calls
- Common objections during sales conversations
- Topics your competitors rank for (check their blogs)
- "People Also Ask" boxes in Google for your keywords
- Comments and DMs from your LinkedIn posts
- Your "pillar question" for the month (see above)

Aim for 1 post per day to keep Google indexing your site regularly and build topical authority fast.

---

## Competitive Theft Workflow (Pre-Write Step)

**Added 2026-05-04 (Jono Catliff "Claude Code SEO" method).**

Before writing any blog post, run this step. It typically adds 10-15 minutes upfront and 30-50% to ranking probability.

### Step 1.5 — Steal the structure of the top 3

For your target keyword:

1. Run a WebSearch for the exact target keyword
2. Pull the top 3 ranking URLs (skip Reddit/Quora unless they're the only results)
3. WebFetch each URL
4. For each, extract:
   - Word count (`wc -w` after stripping HTML)
   - List of all H2 and H3 headings
   - Top 3 stats or claims they cite
   - Internal/external link count
   - Primary CTA (what are they selling at the end?)
5. Compute the average word count and the union of H2 topics
6. Identify 1-2 angles none of the top 3 cover (your differentiation)
7. Write a brief like:

```markdown
## Brief: [Target Keyword]

**Top 3 ranking URLs:**
1. [URL 1] — [word count] words — [primary angle]
2. [URL 2] — [word count] words — [primary angle]
3. [URL 3] — [word count] words — [primary angle]

**Average word count:** X
**Target word count for our post:** X * 1.2 (always 20% longer than average)

**H2 topics covered by all 3:**
- Topic A
- Topic B
- Topic C

**H2 topics covered by 1-2 of them (we should include):**
- Topic D
- Topic E

**Gaps (none of them cover, our wedge):**
- Angle F (our unique take)
- Angle G (our voice/story)

**Cluster:** [which of the 5 clusters this belongs to]
**Sibling links:** [2 related posts in the same cluster to internal-link to]
**Money page link:** [the cluster's primary money page]
```

8. Write the post using ElevateAI voice (resonance marketing, embodied tone, no AI corp-speak, no em-dashes)

### Why this works

The top 3 already proved which sub-topics Google considers relevant for that keyword. By covering all of them PLUS your differentiation, you give the SERP a longer, more comprehensive answer with a unique angle. Google rewards "satisfies the query better than alternatives," and this is the mechanical way to engineer that.

---

## The 80-Signal Pre-Publish Checklist

**Added 2026-05-04. Source: `memory/seo/seo-sop.md`.**

Before pushing any new post live, every signal must pass. The generator handles most automatically, but always verify:

### Title and Meta
- [ ] `<title>` 50-60 chars, primary keyword in first 30 chars
- [ ] Meta description 150-160 chars, includes primary keyword + verb-driven CTA
- [ ] `<link rel="canonical">` absolute www URL, no `.html`
- [ ] No duplicate title or meta description with any existing page

### Open Graph and Twitter
- [ ] og:image 1200x630 PNG exists at `/blog/images/{slug}-og.png`
- [ ] og:image:width=1200, og:image:height=630 declared
- [ ] og:image:alt and twitter:image:alt set
- [ ] og:type=article, og:site_name=ElevateAI System

### Schema
- [ ] JSON-LD `BlogPosting` schema with author, datePublished, image, mainEntityOfPage
- [ ] BreadcrumbList schema present
- [ ] Schema validates against schema.org

### Content
- [ ] Exactly one H1, contains primary keyword
- [ ] At least 3 H2s phrased as questions (Zone 2 AEO pattern)
- [ ] Each H2 followed by 120-150 char declarative answer
- [ ] Word count meets target from competitive theft brief (avg * 1.2)
- [ ] Primary keyword in first 100 words
- [ ] Sections 120-180 words each, self-contained (no "as mentioned above")

### Links
- [ ] At least 2 internal links to siblings in same cluster
- [ ] At least 1 internal link to cluster hub page
- [ ] At least 1 internal link to money page
- [ ] All external links open in new tab with rel="noopener"

### Images
- [ ] Hero image (1520x800), card bg image (1400x700), og image (1200x630) all generated
- [ ] All images have descriptive alt text
- [ ] No image over 200KB compressed

### Voice
- [ ] No em-dashes anywhere in body or meta
- [ ] No "could potentially" or hedging
- [ ] Analyst voice: facts plus applied analysis
- [ ] Sounds like Sunny across the table, not like a SaaS landing

### Final
- [ ] Cluster declared in front-matter
- [ ] Lighthouse mobile + desktop = 100/100/100/100
- [ ] Sitemap.xml updated
- [ ] LinkedIn version generated and reviewed

---

## Cluster Targeting (Required)

Every blog post must declare its cluster. The 5 clusters live in `memory/seo/keyword-clusters.md`:

1. **AI for Coaches** (top-funnel) → links to Brand OS Agent
2. **Building a Personal Brand** (mid-funnel) → links to Build Your Brand and Brand OS Agent
3. **Content and Distribution Systems** (mid-funnel) → links to Brand OS Agent and Build Your Brand
4. **Lead Generation and Funnels** (commercial intent) → links to Augmented Coach Cohort and Brand OS Agent
5. **The ElevateAI Stack** (bottom-funnel money pages, not for blog posts)

### Front-matter required at top of every markdown brief

```markdown
---
cluster: ai-for-coaches
target_keyword: "ChatGPT for coaches"
hub_page: /blog/ai-for-coaches
sibling_link_1: /blog/ai-tools-every-coach-needs
sibling_link_2: /blog/ai-marketing-for-coaches
money_page: /brand-os
brief_date: 2026-05-04
---
```

The generator should fail loudly if a post has no cluster front-matter or if the sibling links don't exist.
