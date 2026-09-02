#!/usr/bin/env node
/**
 * ElevateAI Blog Generator
 *
 * Generates a blog post HTML file, updates blog.html listing, and updates sitemap.xml
 *
 * Usage:
 *   node generate-blog.js --title "Your Blog Title" --slug "your-blog-slug" --category "SEO" --description "Meta description" --readtime "8 min read" --file content.md
 *
 * Or interactively:
 *   node generate-blog.js
 *
 * Categories: SEO, AI, Lead Generation, Strategy, Business
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ─── Configuration ───────────────────────────────────────────────────────────
const SITE_DIR = path.resolve(__dirname, 'site');  // Change this to your site directory
const BLOG_DIR = path.join(SITE_DIR, 'blog');
const BLOG_LISTING = path.join(SITE_DIR, 'blog.html');
const SITEMAP = path.join(SITE_DIR, 'sitemap.xml');
const BASE_URL = 'https://elevateaisystem.com';

const CATEGORY_MAP = {
  'seo':             { class: 'seo',      label: 'SEO',             pillBg: 'rgba(0, 255, 65, 0.15)',  pillColor: 'var(--green-dark)' },
  'ai':              { class: 'ai',       label: 'AI',              pillBg: 'rgba(59, 130, 246, 0.15)', pillColor: '#3B82F6' },
  'lead generation': { class: 'lead-gen', label: 'Lead Generation', pillBg: 'rgba(249, 115, 22, 0.15)', pillColor: '#F97316' },
  'lead gen':        { class: 'lead-gen', label: 'Lead Generation', pillBg: 'rgba(249, 115, 22, 0.15)', pillColor: '#F97316' },
  'strategy':        { class: 'strategy', label: 'Strategy',        pillBg: 'rgba(139, 92, 246, 0.15)', pillColor: '#7C3AED' },
  'business':        { class: 'business', label: 'Business',        pillBg: 'rgba(239, 68, 68, 0.15)',  pillColor: '#DC2626' },
};

// ─── Parse CLI Arguments ─────────────────────────────────────────────────────
function parseArgs() {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      args[key] = argv[i + 1] || '';
      i++;
    }
  }
  return args;
}

// ─── Interactive Prompts ─────────────────────────────────────────────────────
async function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer.trim()); }));
}

// ─── Simple Markdown to HTML Converter ───────────────────────────────────────
function markdownToHtml(md) {
  let html = md;

  // Normalize line endings
  html = html.replace(/\r\n/g, '\n');

  // Process headings (## only — h2 for blog posts)
  html = html.replace(/^## (.+)$/gm, '</p>\n\n        <h2>$1</h2>\n        <p>');
  html = html.replace(/^### (.+)$/gm, '</p>\n\n        <h3>$1</h3>\n        <p>');

  // Process bold text
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Process italic text
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Process links [text](url)
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

  // Process unordered lists
  html = html.replace(/^[\s]*[-*] (.+)$/gm, '<li>$1</li>');
  // Group consecutive <li> into <ul>
  html = html.replace(/(<li>.*?<\/li>\n?)+/gs, (match) => {
    return '</p>\n        <ul>\n          ' + match.trim().replace(/\n/g, '\n          ') + '\n        </ul>\n        <p>';
  });

  // Split paragraphs by double newlines
  const blocks = html.split(/\n\n+/);
  let result = [];

  for (let block of blocks) {
    block = block.trim();
    if (!block) continue;

    // Skip blocks that are already wrapped in HTML tags
    if (block.startsWith('<h2>') || block.startsWith('<h3>') || block.startsWith('<ul>') || block.startsWith('</p>')) {
      result.push(block);
    } else {
      result.push(`<p>${block}</p>`);
    }
  }

  html = result.join('\n\n        ');

  // Clean up any <p></p> empty tags or nested issues
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>\s*<h2>/g, '<h2>');
  html = html.replace(/<\/h2>\s*<\/p>/g, '</h2>');
  html = html.replace(/<p>\s*<h3>/g, '<h3>');
  html = html.replace(/<\/h3>\s*<\/p>/g, '</h3>');
  html = html.replace(/<p>\s*<ul>/g, '<ul>');
  html = html.replace(/<\/ul>\s*<\/p>/g, '</ul>');
  html = html.replace(/<p>\s*<p>/g, '<p>');
  html = html.replace(/<\/p>\s*<\/p>/g, '</p>');

  return html;
}

// ─── Generate Blog Post HTML ─────────────────────────────────────────────────
function generateBlogHtml({ title, slug, category, description, keywords, readTime, date, bodyHtml, ctaTitle, ctaText, ctaLink, ctaButton }) {
  const cat = CATEGORY_MAP[category.toLowerCase()] || CATEGORY_MAP['strategy'];
  const url = `${BASE_URL}/blog/${slug}`;
  const formattedDate = new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | ElevateAI Blog</title>
  <meta name="description" content="${description}">
  <meta name="keywords" content="${keywords}">
  <meta name="canonical" content="${url}">

  <!-- OG Tags -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${BASE_URL}/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${url}">
  <meta property="og:locale" content="en_US">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${BASE_URL}/og-image.png">

  <!-- Favicon -->
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='24' fill='%2300FF41'/%3E%3Cpath d='M50 20 C35 20 25 35 25 55 C25 75 40 80 50 80 C60 80 75 75 75 55 C75 35 65 20 50 20 Z' fill='%23020802'/%3E%3Cpath d='M50 80 L50 85' stroke='%23020802' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E">

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <!-- Schema.org Markup -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "${BASE_URL}/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "${BASE_URL}/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "${title.replace(/"/g, '\\"')}",
        "item": "${url}"
      }
    ]
  }
  </script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${title.replace(/"/g, '\\"')}",
    "description": "${description.replace(/"/g, '\\"')}",
    "image": "${BASE_URL}/og-image.png",
    "datePublished": "${date}",
    "author": {
      "@type": "Person",
      "name": "Sunny Binjola"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ElevateAI System",
      "logo": {
        "@type": "ImageObject",
        "url": "${BASE_URL}/logo.png"
      }
    }
  }
  </script>

  <style>
    :root {
      --bg: #FAFAF8;
      --bg-alt: #F2F2EE;
      --green: #00FF41;
      --green-dark: #00CC34;
      --navy: #0A0F1C;
      --navy-light: #1A2035;
      --text: #1A1A2E;
      --text-muted: #5A5A6E;
      --border: #E0E0D8;
      --white: #FFFFFF;
      --card-bg: #FFFFFF;
      --radius: 12px;
      --radius-lg: 20px;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; }

    /* Navigation */
    .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(250, 250, 248, 0.85); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border-bottom: 1px solid var(--border); padding: 0 2rem; height: 72px; display: flex; align-items: center; justify-content: space-between; transition: all 0.3s; }
    .nav.scrolled { box-shadow: 0 2px 20px rgba(0, 0, 0, 0.06); }
    .nav-logo { font-size: 1.4rem; font-weight: 800; color: var(--navy); letter-spacing: -0.02em; display: flex; align-items: center; gap: 0.5rem; text-decoration: none; }
    .nav-logo-icon { width: 36px; height: 36px; background: var(--green); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--navy); flex-shrink: 0; }
    .nav-logo-text span { color: var(--green-dark); }
    .nav-links { display: flex; gap: 2rem; align-items: center; }
    .nav-links a { font-size: 0.85rem; font-weight: 700; color: var(--navy); letter-spacing: 0.08em; text-transform: uppercase; transition: color 0.2s; position: relative; text-decoration: none; }
    .nav-links a:hover, .nav-links a.active { color: var(--green-dark); }
    .nav-cta { background: var(--navy); color: var(--green) !important; padding: 0.6rem 1.4rem; border-radius: var(--radius); letter-spacing: 0.05em !important; transition: all 0.3s !important; }
    .nav-cta:hover { background: var(--navy-light); transform: translateY(-1px); }
    .nav-dropdown { position: relative; }
    .nav-dropdown > a { display: flex; align-items: center; gap: 0.3rem; }
    .nav-dropdown > a svg { width: 14px; height: 14px; transition: transform 0.2s; }
    .nav-dropdown:hover > a svg { transform: rotate(180deg); }
    .dropdown-menu { position: absolute; top: 100%; left: 50%; transform: translateX(-50%) translateY(10px); background: var(--white); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 0.75rem; min-width: 280px; opacity: 0; visibility: hidden; transition: all 0.2s; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08); }
    .nav-dropdown:hover .dropdown-menu { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(4px); }
    .dropdown-menu a { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-radius: var(--radius); text-transform: none !important; letter-spacing: 0 !important; font-weight: 500 !important; font-size: 0.9rem !important; color: var(--navy); text-decoration: none; transition: background 0.2s; }
    .dropdown-menu a:hover { background: var(--bg-alt); }
    .dropdown-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem; flex-shrink: 0; }
    .dropdown-desc { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.15rem; font-weight: 400 !important; }
    .mobile-menu { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 4px; }
    .mobile-menu span { width: 22px; height: 2px; background: var(--navy); border-radius: 2px; transition: all 0.3s; }
    .mobile-nav { position: fixed; top: 72px; left: 0; right: 0; background: var(--white); border-bottom: 1px solid var(--border); padding: 1rem 2rem; display: flex; flex-direction: column; gap: 0.5rem; transform: translateY(-100%); opacity: 0; transition: all 0.3s; z-index: 99; pointer-events: none; }
    .mobile-nav.open { transform: translateY(0); opacity: 1; pointer-events: all; }
    .mobile-nav a { font-size: 0.9rem; font-weight: 600; color: var(--navy); padding: 0.5rem 0; text-decoration: none; }
    .mobile-nav .mobile-sub { padding-left: 1rem; font-size: 0.85rem; color: var(--text-muted); }

    /* Main Content */
    main { margin-top: 72px; padding: 4rem 2rem; max-width: 1200px; margin-left: auto; margin-right: auto; }
    .back-link { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--text-muted); text-decoration: none; font-size: 0.9rem; font-weight: 600; margin-bottom: 2rem; transition: color 0.2s; }
    .back-link:hover { color: var(--navy); }
    .article-wrapper { max-width: 720px; margin: 0 auto; }
    .article-header { margin-bottom: 2rem; }
    .category-pill { display: inline-block; background: ${cat.pillBg}; color: ${cat.pillColor}; padding: 0.35rem 0.75rem; border-radius: var(--radius); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem; }
    .article-header h1 { font-size: 2.2rem; line-height: 1.3; color: var(--navy); margin-bottom: 1.5rem; font-weight: 800; }
    .article-meta { display: flex; align-items: center; gap: 1rem; color: var(--text-muted); font-size: 0.9rem; flex-wrap: wrap; }
    .article-meta span { display: flex; align-items: center; gap: 0.3rem; }
    .article-meta .separator { color: var(--border); }

    /* Article Body */
    .article-body { font-size: 1.1rem; line-height: 1.8; color: var(--text); }
    .article-body p { margin-bottom: 1.5rem; }
    .article-body h2 { font-size: 1.6rem; font-weight: 700; color: var(--navy); margin-top: 2.5rem; margin-bottom: 1rem; padding-left: 1rem; border-left: 4px solid var(--green); }
    .article-body h2:first-child { margin-top: 0; }
    .article-body h3 { font-size: 1.3rem; font-weight: 700; color: var(--navy); margin-top: 2rem; margin-bottom: 0.75rem; }
    .article-body ul { margin-left: 2rem; margin-bottom: 1.5rem; }
    .article-body li { margin-bottom: 0.5rem; }
    .article-body strong { color: var(--navy); font-weight: 700; }
    .article-body a { color: var(--green-dark); text-decoration: none; transition: color 0.2s; }
    .article-body a:hover { color: var(--green); }

    /* CTA Box */
    .cta-box { background: var(--white); border: 2px solid var(--green); border-radius: var(--radius-lg); padding: 2rem; margin-top: 3rem; text-align: center; animation: slideUp 0.6s ease-out 0.4s forwards; opacity: 0; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .cta-box h3 { font-size: 1.4rem; color: var(--navy); margin-bottom: 0.5rem; font-weight: 700; }
    .cta-box p { color: var(--text-muted); margin-bottom: 1.5rem; font-size: 1rem; }
    .cta-button { display: inline-block; background: var(--navy); color: var(--green); padding: 0.8rem 1.8rem; border-radius: var(--radius); text-decoration: none; font-weight: 700; font-size: 0.9rem; letter-spacing: 0.05em; transition: all 0.3s; border: none; cursor: pointer; }
    .cta-button:hover { background: var(--navy-light); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12); }

    /* Footer */
    .footer { text-align: center; padding: 3rem 2rem; border-top: 1px solid var(--border); color: var(--text-muted); font-size: 0.85rem; margin-top: 4rem; }
    .footer span { color: var(--green-dark); }
    .footer p { margin-bottom: 0.5rem; }
    .footer a { color: var(--text-muted); text-decoration: none; transition: color 0.2s; }
    .footer a:hover { color: var(--navy); }

    /* Responsive */
    @media (max-width: 768px) {
      .nav { padding: 0 1rem; }
      .nav-links { display: none; }
      .mobile-menu { display: flex; }
      main { padding: 2rem 1rem; margin-top: 72px; }
      .article-header h1 { font-size: 1.6rem; }
      .article-body { font-size: 1rem; }
      .article-body h2 { font-size: 1.3rem; }
      .cta-box { padding: 1.5rem; }
      .cta-box h3 { font-size: 1.2rem; }
    }
  </style>
</head>
<body>
  <!-- Navigation -->
  <nav class="nav" id="nav">
    <a href="/" class="nav-logo">
      <div class="nav-logo-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
      </div>
      <span class="nav-logo-text">Elevate<span>AI</span></span>
    </a>
    <div class="nav-links">
      <div class="nav-dropdown">
        <a href="/#services">Services <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg></a>
        <div class="dropdown-menu">
          <a href="/lead-os"><div class="dropdown-icon" style="background:rgba(0,204,52,.1);color:var(--green-dark);">LO</div><div><strong>Lead OS</strong><div class="dropdown-desc">AI-powered lead generation &amp; CRM</div></div></a>
          <a href="/content-os"><div class="dropdown-icon" style="background:rgba(59,130,246,.1);color:#3B82F6;">CO</div><div><strong>Content OS</strong><div class="dropdown-desc">120+ content pieces/month on autopilot</div></div></a>
          <a href="/growth-engine"><div class="dropdown-icon" style="background:rgba(249,115,22,.1);color:#F97316;">GE</div><div><strong>Growth Engine</strong><div class="dropdown-desc">Complete AI marketing infrastructure</div></div></a>
        </div>
      </div>
      <a href="/about">About</a>
      <a href="/blog">Blog</a>
      <a href="/seo-audit-landing-page" class="nav-cta">Free SEO Audit</a>
    </div>
    <button class="mobile-menu" onclick="toggleMobile()" aria-label="Menu"><span></span><span></span><span></span></button>
  </nav>
  <div class="mobile-nav" id="mobileNav">
    <a href="/#services" onclick="toggleMobile()">Services</a>
    <a href="/lead-os" class="mobile-sub" onclick="toggleMobile()">Lead OS</a>
    <a href="/content-os" class="mobile-sub" onclick="toggleMobile()">Content OS</a>
    <a href="/growth-engine" class="mobile-sub" onclick="toggleMobile()">Growth Engine</a>
    <a href="/about" onclick="toggleMobile()">About</a>
    <a href="/blog" onclick="toggleMobile()">Blog</a>
    <a href="/seo-audit-landing-page" class="nav-cta" onclick="toggleMobile()">Free SEO Audit</a>
  </div>

  <!-- Main Content -->
  <main>
    <a href="/blog" class="back-link">\u2190 Back to Blog</a>

    <article class="article-wrapper">
      <div class="article-header">
        <span class="category-pill">${cat.label}</span>
        <h1>${title}</h1>
        <div class="article-meta">
          <span>Sunny Binjola</span>
          <span class="separator">\u2022</span>
          <span>${formattedDate}</span>
          <span class="separator">\u2022</span>
          <span>${readTime}</span>
        </div>
      </div>

      <div class="article-body">
        ${bodyHtml}

        <!-- CTA Box -->
        <div class="cta-box">
          <h3>${ctaTitle}</h3>
          <p>${ctaText}</p>
          <a href="${ctaLink}" class="cta-button">${ctaButton}</a>
        </div>
      </div>
    </article>
  </main>

  <!-- Footer -->
  <footer class="footer">
    <p>&copy; 2026 Elevate<span>AI</span> System \u00B7 AI Systems for Coaches &amp; Creators</p>
    <p style="font-size:.75rem;margin-top:.5rem"><a href="/lead-os" style="color:var(--text-muted);text-decoration:none">Lead OS</a> \u00B7 <a href="/content-os" style="color:var(--text-muted);text-decoration:none">Content OS</a> \u00B7 <a href="/growth-engine" style="color:var(--text-muted);text-decoration:none">Growth Engine</a> \u00B7 <a href="/blog" style="color:var(--text-muted);text-decoration:none">Blog</a> \u00B7 <a href="/seo-audit-landing-page" style="color:var(--text-muted);text-decoration:none">Free SEO Audit</a></p>
  </footer>

  <script>
    function toggleMobile() {
      document.getElementById('mobileNav').classList.toggle('open');
    }
    document.addEventListener('click', function(event) {
      const mobileNav = document.getElementById('mobileNav');
      const mobileMenu = document.querySelector('.mobile-menu');
      if (!mobileNav.contains(event.target) && !mobileMenu.contains(event.target)) {
        mobileNav.classList.remove('open');
      }
    });
    window.addEventListener('scroll', function() {
      const nav = document.getElementById('nav');
      if (window.scrollY > 10) { nav.classList.add('scrolled'); } else { nav.classList.remove('scrolled'); }
    });
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.style.opacity = '1'; entry.target.style.transform = 'translateY(0)'; } });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.article-body h2').forEach(el => {
      el.style.opacity = '0'; el.style.transform = 'translateY(10px)'; el.style.transition = 'all 0.6s ease-out'; observer.observe(el);
    });
  </script>
</body>
</html>`;
}

// ─── Update blog.html ────────────────────────────────────────────────────────
function updateBlogListing({ title, slug, category, description, readTime, date }) {
  const cat = CATEGORY_MAP[category.toLowerCase()] || CATEGORY_MAP['strategy'];
  const formattedDate = new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const newCard = `      <article class="blog-card">
        <div class="blog-meta">
          <span class="blog-category ${cat.class}">${cat.label}</span>
        </div>
        <h3>${title}</h3>
        <p>${description}</p>
        <div class="blog-footer">
          <span class="blog-date">${formattedDate} \u00B7 ${readTime}</span>
          <a href="/blog/${slug}" class="blog-read-more">Read more \u2192</a>
        </div>
      </article>`;

  let blogHtml = fs.readFileSync(BLOG_LISTING, 'utf-8');

  // Insert new card at the TOP of the blog grid (right after <div class="blog-grid">)
  blogHtml = blogHtml.replace(
    '<div class="blog-grid">',
    `<div class="blog-grid">\n${newCard}\n`
  );

  // Update animation delays for all cards
  const cardCount = (blogHtml.match(/class="blog-card"/g) || []).length;
  // Remove old nth-child animation delay rules and add new ones
  const oldDelayRules = /\.blog-card:nth-child\(\d+\)\s*\{\s*animation-delay:\s*[\d.]+s;\s*\}\s*/g;
  blogHtml = blogHtml.replace(oldDelayRules, '');

  // Build new delay rules
  let delayRules = '';
  for (let i = 1; i <= cardCount; i++) {
    delayRules += `\n    .blog-card:nth-child(${i}) {\n      animation-delay: ${(i * 0.1).toFixed(1)}s;\n    }\n`;
  }

  // Insert before the .blog-card:hover rule
  blogHtml = blogHtml.replace(
    /(\s*\.blog-card:hover\s*\{)/,
    `${delayRules}\n$1`
  );

  fs.writeFileSync(BLOG_LISTING, blogHtml);
  console.log(`  \u2705 Updated blog.html — new card added at top`);
}

// ─── Generate LinkedIn Post ──────────────────────────────────────────────────
function generateLinkedInPost({ title, slug, category, markdown }) {
  const url = `${BASE_URL}/blog/${slug}`;

  // Extract key points from markdown — grab h2 headings and first sentence of each section
  const sections = markdown.split(/^## /gm).filter(Boolean);
  let keyPoints = [];

  for (const section of sections) {
    const lines = section.trim().split('\n');
    const heading = lines[0].trim();
    // Get first meaningful line after heading
    const content = lines.slice(1).join(' ').replace(/\*\*/g, '').replace(/\[.*?\]\(.*?\)/g, '').trim();
    const firstSentence = content.split(/\.\s/)[0];
    if (heading && firstSentence && !heading.includes('Bottom Line')) {
      keyPoints.push({ heading, excerpt: firstSentence });
    }
  }

  // Get the intro paragraph (text before first h2)
  const introMatch = markdown.match(/^([\s\S]*?)(?=\n## )/);
  const intro = introMatch ? introMatch[1].replace(/\*\*/g, '').trim() : '';
  const hookSentence = intro.split(/\.\s/)[0];

  // Build the LinkedIn post
  let post = '';
  post += `${hookSentence}.\n\n`;
  post += `Here's what most people get wrong:\n\n`;

  // Add 3-5 key points as a numbered or arrow list
  const pointsToUse = keyPoints.slice(0, 5);
  pointsToUse.forEach(p => {
    post += `→ ${p.heading} — ${p.excerpt.substring(0, 120)}${p.excerpt.length > 120 ? '...' : '.'}\n`;
  });

  post += `\nThe full breakdown is on the blog (link in comments).\n\n`;
  post += `What resonates most with you? Drop it below.\n\n`;

  // Add hashtags based on category
  const hashtagMap = {
    'seo': '#SEO #DigitalMarketing #CoachingBusiness #GoogleRanking #CoachesOfLinkedIn',
    'ai': '#AI #AIAutomation #CoachingBusiness #ContentCreation #CoachesOfLinkedIn',
    'lead generation': '#LeadGeneration #SalesStrategy #CoachingClients #OnlineCoaching #CoachesOfLinkedIn',
    'lead gen': '#LeadGeneration #SalesStrategy #CoachingClients #OnlineCoaching #CoachesOfLinkedIn',
    'strategy': '#BusinessStrategy #SystemsThinking #CoachingBusiness #Growth #CoachesOfLinkedIn',
    'business': '#BusinessGrowth #Entrepreneurship #CoachingBusiness #Revenue #CoachesOfLinkedIn',
  };
  post += (hashtagMap[category.toLowerCase()] || '#CoachingBusiness #CoachesOfLinkedIn');

  return { post, url };
}

// ─── Update sitemap.xml ──────────────────────────────────────────────────────
function updateSitemap({ slug, date }) {
  let sitemap = fs.readFileSync(SITEMAP, 'utf-8');

  const newEntry = `  <url>
    <loc>${BASE_URL}/blog/${slug}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;

  // Insert before </urlset>
  sitemap = sitemap.replace('</urlset>', `${newEntry}\n</urlset>`);

  // Update blog listing lastmod date
  sitemap = sitemap.replace(
    /(<loc>https:\/\/www\.elevateaisystem\.com\/blog<\/loc>\s*<lastmod>)\d{4}-\d{2}-\d{2}(<\/lastmod>)/,
    `$1${date}$2`
  );

  fs.writeFileSync(SITEMAP, sitemap);
  console.log(`  \u2705 Updated sitemap.xml — new URL added`);
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n\u2728 ElevateAI Blog Generator\n');

  const args = parseArgs();

  // Get values from args or prompt interactively
  const title       = args.title       || await prompt('Blog title: ');
  const slug        = args.slug        || await prompt('URL slug (e.g. my-new-post): ');
  const category    = args.category    || await prompt('Category (SEO / AI / Lead Generation / Strategy / Business): ');
  const description = args.description || await prompt('Meta description (1-2 sentences): ');
  const keywords    = args.keywords    || await prompt('Keywords (comma-separated): ');
  const readTime    = args.readtime    || args.readTime || await prompt('Read time (e.g. "8 min read"): ');
  const mdFile      = args.file        || await prompt('Markdown file path: ');

  // Optional CTA customization
  const ctaTitle  = args.ctatitle  || 'Want to Know Exactly Where Your Website Stands?';
  const ctaText   = args.ctatext   || "Get a free SEO audit and we'll show you what's working, what's broken, and what to fix first.";
  const ctaLink   = args.ctalink   || '/seo-audit-landing-page';
  const ctaButton = args.ctabutton || 'Get Your Free SEO Audit';

  const today = new Date().toISOString().split('T')[0];
  const date = args.date || today;

  // Validate
  if (!title || !slug || !category || !description || !mdFile) {
    console.error('\n\u274C Missing required fields. Run with --help for usage.');
    process.exit(1);
  }

  // Check if markdown file exists
  const mdPath = path.resolve(mdFile);
  if (!fs.existsSync(mdPath)) {
    console.error(`\n\u274C File not found: ${mdPath}`);
    process.exit(1);
  }

  // Read and convert markdown
  const markdown = fs.readFileSync(mdPath, 'utf-8');
  const bodyHtml = markdownToHtml(markdown);

  // Ensure blog directory exists
  if (!fs.existsSync(BLOG_DIR)) {
    fs.mkdirSync(BLOG_DIR, { recursive: true });
  }

  // Generate the blog post HTML
  const blogHtml = generateBlogHtml({
    title, slug, category, description, keywords: keywords || '', readTime, date, bodyHtml,
    ctaTitle, ctaText, ctaLink, ctaButton
  });

  const outputPath = path.join(BLOG_DIR, `${slug}.html`);

  // Check if file already exists
  if (fs.existsSync(outputPath)) {
    const overwrite = args.force || await prompt(`\n\u26A0\uFE0F  ${slug}.html already exists. Overwrite? (y/n): `);
    if (overwrite !== 'y' && overwrite !== 'yes' && overwrite !== true) {
      console.log('Cancelled.');
      process.exit(0);
    }
  }

  // Write the blog post
  fs.writeFileSync(outputPath, blogHtml);
  console.log(`  \u2705 Created blog/${slug}.html`);

  // Update blog listing
  if (fs.existsSync(BLOG_LISTING)) {
    updateBlogListing({ title, slug, category, description, readTime, date });
  } else {
    console.log(`  \u26A0\uFE0F  blog.html not found — skipping listing update`);
  }

  // Update sitemap
  if (fs.existsSync(SITEMAP)) {
    updateSitemap({ slug, date });
  } else {
    console.log(`  \u26A0\uFE0F  sitemap.xml not found — skipping sitemap update`);
  }

  // Generate LinkedIn post
  const { post: linkedInPost, url: postUrl } = generateLinkedInPost({ title, slug, category, markdown });
  const linkedInFile = path.join(BLOG_DIR, `linkedin-${slug}.txt`);
  fs.writeFileSync(linkedInFile, linkedInPost);
  console.log(`  \u2705 Generated LinkedIn post \u2192 blog/linkedin-${slug}.txt`);

  console.log(`\n\u2705 Done! Your new blog post is ready.`);
  console.log(`   URL: ${BASE_URL}/blog/${slug}`);
  console.log(`   File: blog/${slug}.html`);
  console.log(`   LinkedIn: blog/linkedin-${slug}.txt\n`);
  console.log(`Next steps:`);
  console.log(`   1. Review the generated file`);
  console.log(`   2. Push to Cloudflare Pages (git add, commit, push)`);
  console.log(`   3. Verify at ${BASE_URL}/blog/${slug}`);
  console.log(`   4. Copy/paste the LinkedIn post from blog/linkedin-${slug}.txt`);
  console.log(`   5. Post the blog URL as a comment on the LinkedIn post\n`);
  console.log(`\u2500\u2500 LinkedIn Post Preview \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`);
  console.log(linkedInPost);
  console.log(`\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
