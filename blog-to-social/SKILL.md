---
name: blog-to-social
description: "Convert ElevateAI blog posts into Twitter/X and LinkedIn content. Use this skill whenever Sunny asks to create social posts from a blog, repurpose blog content for social, generate tweets or threads from a blog post, create LinkedIn posts from blog content, or says 'convert this blog' or 'make social posts from this'. Also trigger when a new blog post is added and social distribution is needed."
---

# Blog to Social

## Purpose

This skill reads an ElevateAI blog post (HTML file from Website/blog/) and generates:
1. **1 single tweet** (under 280 chars)
2. **1 Twitter thread** (5-7 tweets)
3. **1 LinkedIn post** (500-1200 chars)
4. **3 micro-value tweets** (standalone insights from the blog, each under 280 chars)

All content follows ElevateAI brand voice guidelines: direct, thought-leading, zero corporate buzzwords, and tailored for coaches, consultants, and creators doing $10K+/month.

---

## Input

- A blog post file path (e.g., `Website/blog/distribution-is-the-moat.html`)
- OR a blog topic/title to find the matching file
- OR "all blogs" to batch-process every blog in Website/blog/

---

## Process

### Step 1: Locate and Read the Blog Post
- If a file path is given, read that HTML file
- If a title is given, search Website/blog/ for a matching .html file
- Extract: `<title>`, `<meta name="description">`, all `<h2>` and `<h3>` headings, key paragraphs, any stats, numbers, frameworks, or quotes

### Step 2: Identify the Core Insight
- What is the ONE thing that makes this post shareable?
- What would a coach or creator *do differently* after reading it?
- What pattern, framework, or counterintuitive take is at the center?
- This becomes the hook for all social content

### Step 3: Reference the Templates
- Open and read `references/twitter-templates.md` before generating Twitter content
- Open and read `references/linkedin-templates.md` before generating LinkedIn content
- Follow the formulas exactly — they are tested

### Step 4: Generate Content
- Write the single tweet first (it forces clarity)
- Expand into a thread (tweet 1 = hook, 2-5 = value, 6-7 = CTA)
- Write the LinkedIn post (different hook, story/insight, framework, question)
- Extract 3 micro-value tweets (standalone insights)
- All content should feel original — not like summaries

### Step 5: Save Output
- Save to `Website/social-posts/[blog-slug]-social.md`
- Create the directory if it doesn't exist
- Use the exact output format shown below

---

## Output Format

Save all content to a markdown file at `Website/social-posts/[blog-slug]-social.md`:

```markdown
# Social Content: [Blog Title]
Source: Website/blog/[filename]
Generated: [YYYY-MM-DD]

## Single Tweet
[tweet text, under 280 chars]
Hashtags: #tag1 #tag2 #tag3
Link: elevateaisystem.com/blog/[slug]

## Twitter Thread
**Tweet 1 (Hook):**
[text]

**Tweet 2:**
[text]

**Tweet 3:**
[text]

**Tweet 4:**
[text]

**Tweet 5:**
[text]

**Tweet 6 (CTA):**
[text + link to blog]

## LinkedIn Post
[full post text, 500-1200 chars]

Hashtags: #tag1 #tag2 #tag3 #tag4 #tag5

## Micro-Value Tweets
1. [tweet under 280 chars]
2. [tweet under 280 chars]
3. [tweet under 280 chars]
```

---

## Writing Rules (CRITICAL — Read Every Time)

### Brand Voice (Non-Negotiable)
- **Author**: Sunny Binjola, Founder of ElevateAI System
- **Audience**: Coaches, consultants, creators doing $10K+/month
- **Tone**: Thought leader. Direct. Confident but not arrogant.
- **Goal**: Share insights, not pitches. Build authority, not hype.

### What TO Do
- Use short sentences. One idea per line.
- Reference the **ELEVATE Method** (SEO + AEO + GEO + LLMO) when relevant
- Reference **Content OS**, **Lead OS**, **Growth Engine**, **Build Your Brand** naturally
- Use specific numbers and results from the blog
- Include personal angles ("When I built...", "I see this with every coach...")
- End with questions that drive engagement
- Link to `elevateaisystem.com/blog/[slug]` in CTAs
- Newsletter CTA: "Join The 3-2-1 newsletter" when appropriate

### What NOT to Do (CRITICAL)
- **No emojis** — ever
- **No buzzwords**: "game-changer", "unlock", "leverage", "disrupt", "synergy", "circle back"
- **No generic motivation** ("Believe in yourself!", "You've got this!")
- **No threads starting with "Thread:"** or numbered like "1/"
- **No "Let me explain..."** or "Let's talk about..."
- **No hashtag stuffing** (Twitter: 2-3 tags; LinkedIn: 3-5 tags)
- **No salesy CTAs** ("Book a call NOW!", "Limited spots available")
- **No walls of text** on LinkedIn without line breaks
- **No tagging random people** for engagement bait
- **No emoji-heavy formatting** or ASCII art

---

## Reference Materials

Before generating ANY content, read these files:
- `references/twitter-templates.md` — Twitter/X formulas and examples
- `references/linkedin-templates.md` — LinkedIn formulas and post types

---

## Batch Mode

When asked to process multiple blogs or "all blogs":
1. Loop through each .html file in Website/blog/
2. For each file, run steps 1-5 above
3. Save all outputs to Website/social-posts/
4. Output a summary: "Processed [X] blogs. Social content saved to Website/social-posts/"

---

## Trigger Phrases

Use this skill when:
- "Create social posts from this blog"
- "Convert this blog to social content"
- "Make tweets from this blog"
- "Turn this blog into LinkedIn posts"
- "Generate social media from [blog title]"
- "Make social posts for all blogs"
- A new blog post is published and social distribution is needed
- Sunny asks for tweets or threads from a blog post
