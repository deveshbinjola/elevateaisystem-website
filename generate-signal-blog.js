#!/usr/bin/env node
/**
 * Signal Blog Generator — Enhanced 15-component template
 *
 * Generates the full HTML for a Signal blog post from a single markdown file
 * with YAML front-matter for config and custom component syntax inline.
 *
 * Usage:
 *   node generate-signal-blog.js path/to/post.md
 *
 * The .md file format:
 *   ---
 *   title: "Post Title"
 *   slug: "post-slug"
 *   category: strategy | marketing | tools
 *   date: 2026-05-14
 *   readTime: 12
 *   primaryKeyword: "main keyword"
 *   secondaryKeywords: ["kw1", "kw2"]
 *   description: "Meta description 150-160 chars"
 *   signalBox: "The thesis paragraph"
 *   toc:
 *     - { id: why, title: "Why X" }
 *   related:
 *     - { slug: post-slug, category: Strategy, title: "Title" }
 *   cta:
 *     heading: "..."
 *     description: "..."
 *   faq:
 *     - { q: "Question?", a: "Answer." }
 *   ---
 *
 *   ## H2 with id {#section-id}
 *
 *   Body markdown with custom syntax:
 *   [hl]highlighted[/hl]
 *   [stat:97M|description text]
 *   [takeaway]Takeaway text[/takeaway]
 *   [pullquote]Pull quote text[/pullquote]
 *   [deeper:Title]Body content[/deeper]
 *   [tools]
 *   green|AI|Claude|Description
 *   navy|CRM|Apollo|Description
 *   [/tools]
 *   [divider:Part 2]
 *   [link:Tag|Title|url]
 */

const fs = require('fs');
const path = require('path');

// ─── Configuration ───────────────────────────────────────────────────────────
const SITE_DIR = path.resolve(__dirname);
const BLOG_DIR = path.join(SITE_DIR, 'blog');
const BLOG_LISTING = path.join(SITE_DIR, 'blog.html');
const SITEMAP = path.join(SITE_DIR, 'sitemap.xml');
const BASE_URL = 'https://elevateaisystem.com';

// ─── Front-matter parser (minimal YAML subset) ───────────────────────────────
function parseFrontMatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('Missing front-matter (--- block at top)');
  const yaml = match[1];
  const body = match[2];

  const config = {};
  const lines = yaml.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) { i++; continue; }

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) { i++; continue; }

    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();

    // List notation (next lines start with " -" or " - ")
    if (val === '' && lines[i + 1] && lines[i + 1].match(/^\s+-/)) {
      const arr = [];
      i++;
      while (i < lines.length && lines[i].match(/^\s+-/)) {
        const item = lines[i].replace(/^\s+-\s*/, '').trim();
        if (item.startsWith('{') && item.endsWith('}')) {
          // Inline object
          const obj = {};
          item.slice(1, -1).split(',').forEach(pair => {
            const [k, ...rest] = pair.split(':');
            obj[k.trim()] = rest.join(':').trim().replace(/^["']|["']$/g, '');
          });
          arr.push(obj);
        } else {
          arr.push(item.replace(/^["']|["']$/g, ''));
        }
        i++;
      }
      config[key] = arr;
      continue;
    }

    // Nested object (next lines indented)
    if (val === '' && lines[i + 1] && lines[i + 1].match(/^\s+\w/)) {
      const obj = {};
      i++;
      while (i < lines.length && lines[i].match(/^\s+\w/)) {
        const sub = lines[i].trim();
        const subColon = sub.indexOf(':');
        if (subColon === -1) { i++; continue; }
        const sk = sub.slice(0, subColon).trim();
        const sv = sub.slice(subColon + 1).trim().replace(/^["']|["']$/g, '');
        obj[sk] = sv;
        i++;
      }
      config[key] = obj;
      continue;
    }

    // Inline array [a, b, c]
    if (val.startsWith('[') && val.endsWith(']')) {
      config[key] = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
      i++;
      continue;
    }

    config[key] = val.replace(/^["']|["']$/g, '');
    i++;
  }

  return { config, body };
}

// ─── Markdown → HTML (core paragraph/header/list logic) ──────────────────────
function markdownToHtml(md) {
  let html = md.replace(/\r\n/g, '\n');

  // Headings with optional {#id}
  html = html.replace(/^## (.+?)(?:\s*\{#([\w-]+)\})?$/gm, (m, t, id) =>
    id ? `\n<h2 id="${id}">${t}</h2>\n` : `\n<h2>${t}</h2>\n`);
  html = html.replace(/^### (.+?)(?:\s*\{#([\w-]+)\})?$/gm, (m, t, id) =>
    id ? `\n<h3 id="${id}">${t}</h3>\n` : `\n<h3>${t}</h3>\n`);
  html = html.replace(/^#### (.+)$/gm, '\n<h4>$1</h4>\n');

  // Bold, italic, links, inline code
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

  // Custom component syntax (process before paragraph wrapping)
  html = processComponents(html);

  // Ordered lists
  html = html.replace(/(^[ \t]*\d+\.\s+.+\n?)+/gm, (block) => {
    const items = block.trim().split('\n').map(l =>
      `<li>${l.replace(/^[ \t]*\d+\.\s+/, '')}</li>`).join('\n');
    return `\n<ol>\n${items}\n</ol>\n`;
  });

  // Unordered lists
  html = html.replace(/(^[ \t]*[-*]\s+.+\n?)+/gm, (block) => {
    const items = block.trim().split('\n').map(l =>
      `<li>${l.replace(/^[ \t]*[-*]\s+/, '')}</li>`).join('\n');
    return `\n<ul>\n${items}\n</ul>\n`;
  });

  // Split into paragraphs (blocks separated by blank lines)
  const blocks = html.split(/\n{2,}/);
  const out = blocks.map(b => {
    const trimmed = b.trim();
    if (!trimmed) return '';
    // Already a block-level element
    if (/^<(h[1-6]|ul|ol|div|blockquote|details|aside)/.test(trimmed)) return trimmed;
    return `<p>${trimmed}</p>`;
  }).filter(Boolean).join('\n\n');

  return out;
}

// ─── Custom component syntax processors ──────────────────────────────────────
function processComponents(html) {
  // [hl]text[/hl]
  html = html.replace(/\[hl\](.+?)\[\/hl\]/g, '<span class="hl">$1</span>');

  // [stat:VALUE|LABEL]
  html = html.replace(/\[stat:([^|]+)\|([^\]]+)\]/g, (m, value, label) => {
    const dataCount = value.replace(/[^\d]/g, '');
    return `<div class="stat-callout"><div class="stat-number"${dataCount ? ` data-count="${dataCount}"` : ''}>${value}</div><div class="stat-label">${label}</div></div>`;
  });

  // [takeaway]text[/takeaway]
  html = html.replace(/\[takeaway\]([\s\S]+?)\[\/takeaway\]/g, (m, text) =>
    `<div class="key-takeaway"><div class="kt-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>Key Takeaway</div><p>${text.trim()}</p></div>`);

  // [pullquote]text[/pullquote]
  html = html.replace(/\[pullquote\]([\s\S]+?)\[\/pullquote\]/g, (m, text) =>
    `<blockquote class="pull-quote"><p>${text.trim()}</p></blockquote>`);

  // [deeper:Title]content[/deeper]
  html = html.replace(/\[deeper:([^\]]+)\]([\s\S]+?)\[\/deeper\]/g, (m, title, content) => {
    const inner = content.trim().split(/\n{2,}/).map(p => `<p>${p.trim()}</p>`).join('\n');
    return `<details class="go-deeper"><summary>${title}</summary><div class="deeper-content">${inner}</div></details>`;
  });

  // [tools]
  // color|icon|name|desc
  // [/tools]
  html = html.replace(/\[tools\]([\s\S]+?)\[\/tools\]/g, (m, body) => {
    const cards = body.trim().split('\n').filter(Boolean).map(line => {
      const [color, icon, name, desc] = line.split('|').map(s => s.trim());
      return `<div class="tool-card"><div class="tc-icon ${color}">${icon}</div><div><div class="tc-name">${name}</div><div class="tc-desc">${desc}</div></div></div>`;
    }).join('');
    return `<div class="tool-cards-row">${cards}</div>`;
  });

  // [divider:Label]
  html = html.replace(/\[divider:([^\]]+)\]/g, (m, label) =>
    `<div class="section-divider"><span>${label}</span></div>`);

  // [link:Tag|Title|url]
  html = html.replace(/\[link:([^|]+)\|([^|]+)\|([^\]]+)\]/g, (m, tag, title, url) =>
    `<div class="link-card"><div class="tag">${tag}</div><h5>${title}</h5><p><a href="${url}">Read the deep dive &rarr;</a></p></div>`);

  return html;
}

// ─── HTML scaffold ───────────────────────────────────────────────────────────
function renderHtml(config, bodyHtml) {
  const {
    title, slug, category, date, readTime, primaryKeyword,
    secondaryKeywords = [], description, signalBox,
    toc = [], related = [], cta, faq = [], heroImage, heroAlt
  } = config;

  const dateObj = new Date(date);
  const dateFormatted = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const keywords = [primaryKeyword, ...secondaryKeywords].filter(Boolean).join(', ');
  const ogImage = `${BASE_URL}/blog/images/${heroImage || `${slug}-og.png`}`;
  const heroSrc = `images/${heroImage || `${slug}-og.png`}`;

  // FAQ schema
  const faqSchema = faq.length >= 2
    ? `<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faq.map(item => ({
    "@type": "Question",
    "name": item.q,
    "acceptedAnswer": { "@type": "Answer", "text": item.a }
  }))
}, null, 2)}
</script>`
    : '';

  // TOC sidebar
  const tocHtml = toc.length ? `
<aside class="sticky-toc" aria-label="Table of contents">
  <h4>In this guide</h4>
  <ol>
${toc.map(s => `    <li><a href="#${s.id}">${s.title}</a></li>`).join('\n')}
  </ol>
</aside>` : '';

  // Related posts
  const relatedHtml = related.length ? `
<div class="related-posts">
  <h3>Keep reading</h3>
  <div class="related-grid">
${related.map(r => `    <a href="/blog/${r.slug}" class="related-card"><span class="rc-cat">${r.category}</span><h4>${r.title}</h4><span class="rc-link">Read &rarr;</span></a>`).join('\n')}
  </div>
</div>` : '';

  // CTA block
  const ctaHtml = cta ? `
<div class="article-cta">
  <h3>${cta.heading}</h3>
  <p>${cta.description}</p>
  <a href="https://cal.com/sunny-binjola/ai-strategy-call">Book Your Free Call &rarr;</a>
</div>` : '';

  const urlEncodedTitle = encodeURIComponent(title);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} | ElevateAI System</title>
<meta name="description" content="${description}">
<meta name="keywords" content="${keywords}">
<link rel="canonical" href="${BASE_URL}/blog/${slug}">
<meta name="robots" content="index, follow">
<meta property="og:type" content="article">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${BASE_URL}/blog/${slug}">
<meta property="og:site_name" content="ElevateAI System">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${heroAlt || title}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${ogImage}">
<meta name="twitter:image:alt" content="${heroAlt || title}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"></noscript>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='24' fill='%2300FF41'/%3E%3Cpath d='M50 20 C35 20 25 35 25 55 C25 75 40 80 50 80 C60 80 75 75 75 55 C75 35 65 20 50 20 Z' fill='%23020802'/%3E%3Cpath d='M50 80 L50 85' stroke='%23020802' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E">
<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": title,
  "description": description,
  "url": `${BASE_URL}/blog/${slug}`,
  "datePublished": date,
  "dateModified": date,
  "author": { "@type": "Person", "name": "Sunny Binjola" },
  "publisher": { "@type": "Organization", "name": "ElevateAI System", "url": BASE_URL },
  "image": ogImage,
  "articleSection": category.charAt(0).toUpperCase() + category.slice(1)
}, null, 2)}
</script>
<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE_URL },
    { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${BASE_URL}/blog` },
    { "@type": "ListItem", "position": 3, "name": title, "item": `${BASE_URL}/blog/${slug}` }
  ]
}, null, 2)}
</script>
${faqSchema}
<script>function initApollo(){var n=Math.random().toString(36).substring(7),o=document.createElement("script");
o.src="https://assets.apollo.io/micro/website-tracker/tracker.iife.js?nocache="+n,o.async=!0,o.defer=!0,
o.onload=function(){window.trackingFunctions.onLoad({appId:"69af333ec98ca400116945f0"})},
document.head.appendChild(o)}initApollo();</script>
<style>${getStyles()}</style>
</head>
<body>

<div class="reading-progress" id="readingProgress"></div>
<div class="time-remaining" id="timeRemaining">${readTime} min left</div>

<script src="../navbar.js"></script>

<div class="article-hero">
  <img src="${heroSrc}" alt="${heroAlt || title}" loading="eager">
  <div class="hero-overlay">
    <span class="article-category ${category}">${category.charAt(0).toUpperCase() + category.slice(1)}</span>
    <h1>${title}</h1>
  </div>
</div>

<div class="article-layout">
<article class="article-main">
  <div class="author-byline">
    <div class="author-avatar">SB</div>
    <div class="author-info">
      <strong>Sunny Binjola</strong>
      Founder, ElevateAI System &middot; ${dateFormatted} &middot; ${readTime} min read
    </div>
  </div>

  <div class="signal-box">
    <p><strong>The Signal:</strong> ${signalBox}</p>
  </div>

${bodyHtml}

${ctaHtml}

  <div class="share-bar">
    <span>Share this post:</span>
    <a class="share-btn linkedin" href="https://www.linkedin.com/sharing/share-offsite/?url=${BASE_URL}/blog/${slug}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>LinkedIn</a>
    <a class="share-btn twitter" href="https://twitter.com/intent/tweet?url=${BASE_URL}/blog/${slug}&text=${urlEncodedTitle}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>X</a>
    <button class="share-btn copy" onclick="navigator.clipboard.writeText(window.location.href);this.textContent='Copied!'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copy link</button>
  </div>

${relatedHtml}

  <a href="/blog" class="back-link">&larr; Back to all posts</a>
</article>
${tocHtml}
</div>

${getFooter()}

<script src="../author-bio.js"></script>
<script src="../newsletter-popup.js"></script>
<script>${getJs(readTime)}</script>
</body>
</html>
`;
}

// ─── Styles (full CSS block) ─────────────────────────────────────────────────
function getStyles() {
  return `:root{--bg:#FAFAF8;--bg-alt:#F2F2EE;--green:#00FF41;--green-dark:#00CC34;--navy:#0A0F1C;--navy-light:#1A2035;--text:#1A1A2E;--text-muted:#5A5A6E;--border:#E0E0D8;--white:#FFFFFF;--card-bg:#FFFFFF;--radius:12px;--radius-lg:20px}*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}body{font-family:'Plus Jakarta Sans',sans-serif;background:var(--bg);color:var(--text);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}a{text-decoration:none;color:inherit}.article-category{display:inline-block;padding:.35rem .8rem;border-radius:20px;font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em}.article-category.strategy{background:rgba(139,92,246,.15);color:#7C3AED}.article-category.marketing{background:rgba(0,255,65,.12);color:#00CC34}.article-category.tools{background:rgba(59,130,246,.12);color:#3B82F6}.article-main h2{font-size:1.7rem;font-weight:800;color:var(--navy);margin:3rem 0 1rem;letter-spacing:-.01em}.article-main h3{font-size:1.3rem;font-weight:700;color:var(--navy);margin:2rem 0 .75rem}.article-main h4{font-size:1.05rem;font-weight:700;color:var(--navy);margin:1.5rem 0 .5rem}.article-main p{color:var(--text);font-size:1.05rem;line-height:1.8;margin-bottom:1.25rem}.article-main ul,.article-main ol{margin:1rem 0 1.5rem 1.5rem}.article-main li{color:var(--text);font-size:1.05rem;line-height:1.8;margin-bottom:.5rem}.article-main strong{color:var(--navy)}.signal-box{background:var(--navy);border-radius:var(--radius);padding:1.5rem 2rem;margin:2rem 0}.signal-box p{color:rgba(255,255,255,.85);margin:0;font-size:1rem}.signal-box strong{color:var(--green)}.article-cta{background:var(--navy);border-radius:var(--radius-lg);padding:3rem;text-align:center;margin:3rem 0}.article-cta h3{color:var(--white);font-size:1.5rem;margin-bottom:.75rem}.article-cta p{color:rgba(255,255,255,.7);margin-bottom:1.5rem}.article-cta a{display:inline-flex;align-items:center;gap:.5rem;background:var(--green);color:var(--navy);padding:.85rem 2rem;border-radius:50px;font-weight:800;font-size:.95rem;transition:all .3s}.article-cta a:hover{background:var(--green-dark);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,255,65,.3)}.link-card{background:var(--bg-alt);border-left:4px solid var(--green);border-radius:var(--radius);padding:1.25rem 1.5rem;margin:1.5rem 0}.link-card .tag{font-size:.65rem;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:var(--text-muted);margin-bottom:.35rem}.link-card h5{font-size:1.05rem;color:var(--navy);margin-bottom:.25rem}.link-card a{color:var(--green-dark);font-size:.85rem;font-weight:700}.back-link{display:inline-flex;align-items:center;gap:.5rem;color:var(--green-dark);font-weight:700;font-size:.9rem;margin-top:2rem;transition:gap .2s}.reading-progress{position:fixed;top:0;left:0;height:3px;background:var(--green);z-index:200;width:0;transition:width .1s linear}.time-remaining{position:fixed;top:3px;right:24px;z-index:201;background:var(--navy);color:rgba(255,255,255,.85);font-size:.7rem;font-weight:700;padding:.3rem .7rem;border-radius:0 0 8px 8px;opacity:0;transition:opacity .3s;letter-spacing:.02em}.time-remaining.visible{opacity:1}.article-hero{position:relative;width:100%;max-height:420px;overflow:hidden;margin-top:72px;background:var(--navy)}.article-hero img{width:100%;height:420px;object-fit:cover;opacity:.35}.hero-overlay{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:3rem 2rem;background:linear-gradient(transparent 20%,rgba(10,15,28,.85) 70%)}.hero-overlay .article-category{align-self:flex-start}.hero-overlay h1{font-size:2.8rem;font-weight:800;line-height:1.15;color:var(--white);letter-spacing:-.02em;margin:.75rem 0 0;max-width:820px}.author-byline{display:flex;align-items:center;gap:1rem;padding:1.5rem 0;margin-bottom:1rem;border-bottom:1px solid var(--border)}.author-avatar{width:44px;height:44px;border-radius:50%;background:var(--green);display:flex;align-items:center;justify-content:center;font-weight:800;color:var(--navy);font-size:1rem;flex-shrink:0}.author-info{font-size:.85rem;color:var(--text-muted);line-height:1.4}.author-info strong{color:var(--navy);display:block}.article-layout{max-width:1100px;margin:0 auto;padding:2rem 2rem 4rem;display:grid;grid-template-columns:1fr 240px;gap:3rem}.article-main{max-width:660px}.sticky-toc{position:sticky;top:90px;align-self:start;max-height:calc(100vh - 120px);overflow-y:auto}.sticky-toc h4{font-size:.65rem;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:var(--text-muted);margin-bottom:.75rem;padding-bottom:.5rem;border-bottom:2px solid var(--green)}.sticky-toc ol{list-style:none;margin:0;padding:0}.sticky-toc li{margin-bottom:.25rem}.sticky-toc a{display:block;padding:.4rem .75rem;font-size:.8rem;font-weight:500;color:var(--text-muted);border-left:2px solid transparent;border-radius:0 6px 6px 0;transition:all .2s}.sticky-toc a:hover{color:var(--navy);background:var(--bg-alt)}.sticky-toc a.active{color:var(--navy);font-weight:700;border-left-color:var(--green);background:rgba(0,255,65,.06)}.pull-quote{border:none;background:none;padding:2rem 0;margin:2.5rem 0;border-top:3px solid var(--green);border-bottom:1px solid var(--border);text-align:center}.pull-quote p{font-size:1.35rem;font-weight:700;color:var(--navy);line-height:1.45;font-style:normal;margin:0;letter-spacing:-.01em}.section-divider{display:flex;align-items:center;gap:1rem;margin:3rem 0 2rem}.section-divider::before,.section-divider::after{content:'';flex:1;height:1px;background:var(--border)}.section-divider span{font-size:.65rem;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:var(--text-muted);white-space:nowrap}.stat-callout{display:flex;align-items:center;gap:1.25rem;background:var(--navy);border-radius:var(--radius);padding:1.25rem 1.5rem;margin:2rem 0}.stat-callout .stat-number{font-size:2.4rem;font-weight:800;color:var(--green);line-height:1;white-space:nowrap;font-variant-numeric:tabular-nums}.stat-callout .stat-label{font-size:.85rem;color:rgba(255,255,255,.7);line-height:1.4}.hl{background:linear-gradient(transparent 55%,rgba(0,255,65,.18) 55%);padding:0 2px}.key-takeaway{background:var(--white);border:1px solid var(--border);border-left:4px solid var(--green);border-radius:0 var(--radius) var(--radius) 0;padding:1.25rem 1.5rem;margin:2rem 0}.key-takeaway .kt-label{font-size:.6rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:var(--green-dark);margin-bottom:.4rem;display:flex;align-items:center;gap:.4rem}.key-takeaway .kt-label svg{width:14px;height:14px}.key-takeaway p{font-size:.95rem;font-weight:600;color:var(--navy);line-height:1.55;margin:0}.go-deeper{border:1px solid var(--border);border-radius:var(--radius);margin:1.5rem 0;overflow:hidden}.go-deeper summary{display:flex;align-items:center;gap:.6rem;padding:1rem 1.25rem;font-size:.85rem;font-weight:700;color:var(--navy);cursor:pointer;background:var(--bg-alt);list-style:none;transition:background .2s}.go-deeper summary::-webkit-details-marker{display:none}.go-deeper summary::before{content:'+';display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:var(--green);color:var(--navy);font-weight:800;font-size:.85rem;flex-shrink:0;transition:transform .2s}.go-deeper[open] summary::before{content:'\\2212'}.go-deeper summary:hover{background:var(--border)}.go-deeper .deeper-content{padding:1.25rem;border-top:1px solid var(--border)}.go-deeper .deeper-content p{font-size:.95rem;margin-bottom:1rem}.go-deeper .deeper-content p:last-child{margin-bottom:0}.tool-card{display:inline-flex;align-items:center;gap:.75rem;background:var(--white);border:1px solid var(--border);border-radius:10px;padding:.65rem 1rem;margin:.5rem .5rem .5rem 0;transition:all .2s}.tool-card:hover{border-color:var(--green);box-shadow:0 4px 12px rgba(0,0,0,.05)}.tool-card .tc-icon{width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:800;flex-shrink:0}.tool-card .tc-icon.green{background:rgba(0,255,65,.15);color:var(--green-dark)}.tool-card .tc-icon.navy{background:rgba(10,15,28,.1);color:var(--navy)}.tool-card .tc-icon.blue{background:rgba(59,130,246,.12);color:#3B82F6}.tool-card .tc-name{font-size:.8rem;font-weight:700;color:var(--navy)}.tool-card .tc-desc{font-size:.7rem;color:var(--text-muted)}.tool-cards-row{display:flex;flex-wrap:wrap;margin:1rem 0 1.5rem}.share-bar{display:flex;align-items:center;gap:.75rem;padding:1.5rem 0;border-top:1px solid var(--border);margin-top:2rem;flex-wrap:wrap}.share-bar span{font-size:.85rem;font-weight:600;color:var(--text-muted)}.share-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 18px;border-radius:50px;font-size:.8rem;font-weight:700;transition:all .2s;border:none;cursor:pointer;text-decoration:none}.share-btn:hover{transform:translateY(-1px)}.share-btn svg{width:16px;height:16px;fill:currentColor}.share-btn.linkedin{background:#0A66C2;color:#fff}.share-btn.twitter{background:#000;color:#fff}.share-btn.copy{background:var(--bg-alt);color:var(--navy);border:1px solid var(--border)}.related-posts{margin:3rem 0}.related-posts h3{font-size:.75rem;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:var(--text-muted);margin-bottom:1.25rem}.related-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}.related-card{background:var(--white);border:1px solid var(--border);border-radius:var(--radius);padding:1.5rem;transition:all .2s;display:flex;flex-direction:column}.related-card:hover{border-color:var(--green);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.06)}.related-card .rc-cat{font-size:.65rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--green-dark);margin-bottom:.5rem}.related-card h4{font-size:.95rem;font-weight:700;color:var(--navy);line-height:1.35;margin-bottom:.5rem;flex:1}.related-card .rc-link{font-size:.8rem;font-weight:700;color:var(--green-dark)}@media (max-width:1024px){.article-layout{grid-template-columns:1fr}.sticky-toc{display:none}}@media (max-width:768px){.article-layout{padding:1.5rem 1rem 3rem}.article-main h1,.hero-overlay h1{font-size:1.8rem}.article-hero{max-height:300px}.article-hero img{height:300px}.hero-overlay{padding:2rem 1rem}.article-cta{padding:2rem 1.5rem}.related-grid{grid-template-columns:1fr}.pull-quote p{font-size:1.15rem}.stat-callout{flex-direction:column;text-align:center;gap:.75rem}.stat-callout .stat-number{font-size:2rem}.tool-cards-row{flex-direction:column}.tool-card{width:100%}.time-remaining{right:12px;font-size:.65rem}}`;
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function getFooter() {
  return `<footer style="background:#FFFFFF;border-top:1px solid #E0E0D8;padding:.9rem 3rem .7rem;margin-top:0;" role="contentinfo">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;max-width:1100px;margin:0 auto .5rem;gap:.6rem;flex-wrap:wrap;">
    <div style="text-align:left;">
      <p style="font-size:.5rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#0A0F1C;margin:0 0 .2rem">Services</p>
      <p style="margin:0"><a href="/brand-os" style="font-size:.58rem;color:#A0A0B4;text-decoration:none">Brand OS Agent</a></p>
      <p style="margin:0"><a href="/build-your-brand" style="font-size:.58rem;color:#A0A0B4;text-decoration:none">Build Your Brand</a></p>
      <p style="margin:0"><a href="/augmented-coach" style="font-size:.58rem;color:#A0A0B4;text-decoration:none">Augmented Coach Cohort</a></p>
      <p style="margin:0"><a href="/coach-platform" style="font-size:.58rem;color:#A0A0B4;text-decoration:none">Coach Platform</a></p>
      <p style="margin:0"><a href="/seo-audit-landing-page" style="font-size:.58rem;color:#A0A0B4;text-decoration:none">Search Visibility Audit</a></p>
      <p style="margin:0"><a href="/ai-strategy-hour" style="font-size:.58rem;color:#A0A0B4;text-decoration:none">AI Strategy Hour</a></p>
    </div>
    <div style="text-align:center;">
      <p style="font-size:.5rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#0A0F1C;margin:0 0 .2rem">Compare</p>
      <p style="margin:0"><a href="/elevateai-vs-hubspot" style="font-size:.58rem;color:#A0A0B4;text-decoration:none">ElevateAI vs HubSpot</a></p>
      <p style="margin:0"><a href="/elevateai-vs-coachvox" style="font-size:.58rem;color:#A0A0B4;text-decoration:none">ElevateAI vs Coachvox</a></p>
      <p style="margin:0"><a href="/elevateai-vs-diy" style="font-size:.58rem;color:#A0A0B4;text-decoration:none">ElevateAI vs DIY</a></p>
      <p style="font-size:.5rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#0A0F1C;margin:.3rem 0 .2rem">Free Tools</p>
      <p style="margin:0"><a href="/lead-clarity-score" style="font-size:.58rem;color:#A0A0B4;text-decoration:none">Lead Clarity Score</a></p>
      <p style="margin:0"><a href="/seo-audit-landing-page" style="font-size:.58rem;color:#A0A0B4;text-decoration:none">Free SEO Audit</a></p>
    </div>
    <div style="text-align:right;">
      <p style="font-size:.5rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#0A0F1C;margin:0 0 .2rem">Top Posts</p>
      <p style="margin:0"><a href="/blog/what-agents-cannot-do" style="font-size:.58rem;color:#A0A0B4;text-decoration:none">What Agents Cannot Do</a></p>
      <p style="margin:0"><a href="/blog/the-10k-coach-is-already-dead" style="font-size:.58rem;color:#A0A0B4;text-decoration:none">$10K Coach Is Dead</a></p>
      <p style="margin:0"><a href="/blog/visa-claude-agents-autonomous-coaches" style="font-size:.58rem;color:#A0A0B4;text-decoration:none">Visa + Agents</a></p>
      <p style="margin:0"><a href="/blog/4-pillar-search-visibility-framework" style="font-size:.58rem;color:#A0A0B4;text-decoration:none">4-Pillar Framework</a></p>
    </div>
  </div>
  <div style="border-top:1px solid #E0E0D8;padding-top:.45rem;text-align:center;max-width:1100px;margin:0 auto;">
    <p style="font-size:.68rem;color:#5A5A6E;font-weight:500;margin:0 0 .1rem">&copy; 2026 Elevate<span style="color:#00CC34">AI</span> System &middot; You Coach. We Handle Everything Else.</p>
    <p style="font-size:.56rem;color:#A0A0B4;margin:0 0 .1rem"><a href="mailto:sunny.binjola@gmail.com" style="color:#A0A0B4;text-decoration:none">sunny.binjola@gmail.com</a></p>
    <p style="font-size:.5rem;color:#B0B0C0;margin:0"><a href="/about" style="color:#B0B0C0;text-decoration:none">About</a> &middot; <a href="/blog" style="color:#B0B0C0;text-decoration:none">Blog</a> &middot; <a href="/the-signal" style="color:#B0B0C0;text-decoration:none">The Signal</a> &middot; <a href="/faq" style="color:#B0B0C0;text-decoration:none">FAQ</a> &middot; <a href="/privacy" style="color:#B0B0C0;text-decoration:none">Privacy</a> &middot; <a href="/terms" style="color:#B0B0C0;text-decoration:none">Terms</a></p>
  </div>
</footer>`;
}

// ─── JavaScript (reading progress + TOC + animated counters) ─────────────────
function getJs(readTime) {
  return `(function(){var bar=document.getElementById('readingProgress');var timeEl=document.getElementById('timeRemaining');var article=document.querySelector('.article-main');var totalMinutes=${readTime};if(bar&&article){window.addEventListener('scroll',function(){var top=article.getBoundingClientRect().top+window.scrollY-100;var height=article.scrollHeight;var progress=Math.min(Math.max((window.scrollY-top)/height,0),1);bar.style.width=(progress*100)+'%';if(timeEl){var remaining=Math.max(Math.ceil(totalMinutes*(1-progress)),0);if(progress>0.02&&progress<0.98){timeEl.classList.add('visible');timeEl.textContent=remaining+' min left';}else if(progress>=0.98){timeEl.classList.add('visible');timeEl.textContent='Done!';}else{timeEl.classList.remove('visible');}}});}var tocLinks=document.querySelectorAll('.sticky-toc a');var sections=[];tocLinks.forEach(function(link){var id=link.getAttribute('href').slice(1);var el=document.getElementById(id);if(el)sections.push({el:el,link:link});});if(sections.length){window.addEventListener('scroll',function(){var scrollY=window.scrollY+120;var active=sections[0];for(var i=0;i<sections.length;i++){if(sections[i].el.offsetTop<=scrollY)active=sections[i];}tocLinks.forEach(function(l){l.classList.remove('active');});if(active)active.link.classList.add('active');});}var animated=new Set();var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(!entry.isIntersecting||animated.has(entry.target))return;animated.add(entry.target);var el=entry.target;var final=el.textContent;var num=parseInt(el.getAttribute('data-count'));if(!num||isNaN(num))return;var duration=1200;var start=performance.now();function step(now){var t=Math.min((now-start)/duration,1);t=1-Math.pow(1-t,3);var current=Math.round(num*t);if(final.includes('M'))el.textContent=current+'M';else if(final.includes('B'))el.textContent=current+'B';else if(final.includes('%'))el.textContent=current+'%';else if(final.includes('$'))el.textContent='$'+current+'K+';else if(final.includes('x'))el.textContent=current+'x';else el.textContent=current;if(t<1)requestAnimationFrame(step);else el.textContent=final;}el.textContent=final.includes('$')?'$0':'0';requestAnimationFrame(step);});},{threshold:0.5});document.querySelectorAll('.stat-number[data-count]').forEach(function(el){observer.observe(el);});})();`;
}

// ─── Sitemap update ──────────────────────────────────────────────────────────
function updateSitemap(slug, date) {
  if (!fs.existsSync(SITEMAP)) {
    console.log('⚠️  sitemap.xml not found, skipping');
    return;
  }
  const sitemap = fs.readFileSync(SITEMAP, 'utf8');
  const newUrl = `${BASE_URL}/blog/${slug}`;
  if (sitemap.includes(newUrl)) {
    console.log('   sitemap already contains this URL');
    return;
  }
  const entry = `  <url>\n    <loc>${newUrl}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  const updated = sitemap.replace('</urlset>', entry + '</urlset>');
  fs.writeFileSync(SITEMAP, updated);
  console.log('✓ sitemap.xml updated');
}

// ─── Main ────────────────────────────────────────────────────────────────────
function main() {
  const inputFile = process.argv[2];
  if (!inputFile) {
    console.error('Usage: node generate-signal-blog.js path/to/post.md');
    process.exit(1);
  }

  const raw = fs.readFileSync(inputFile, 'utf8');
  const { config, body } = parseFrontMatter(raw);

  if (!config.slug) throw new Error('Missing slug in front-matter');
  if (!config.title) throw new Error('Missing title in front-matter');

  const bodyHtml = markdownToHtml(body);
  const html = renderHtml(config, bodyHtml);

  const outPath = path.join(BLOG_DIR, `${config.slug}.html`);
  fs.writeFileSync(outPath, html);
  console.log(`✓ Wrote ${outPath}`);

  updateSitemap(config.slug, config.date);

  console.log('\nNext steps:');
  console.log('  1. Generate hero image at blog/images/' + config.slug + '-og.png');
  console.log('  2. Update blog.html listing with the new post card');
  console.log('  3. Generate distribution assets (LinkedIn, X, newsletter, carousel)');
  console.log('  4. git add . && git commit && git push');
}

if (require.main === module) main();

module.exports = { parseFrontMatter, markdownToHtml, renderHtml };
