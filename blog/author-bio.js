/**
 * ElevateAI System — Author Bio Component
 * Injects a Sunny Binjola author card before </body> on every blog post.
 * Links cross-site: sunnybinjola.com ↔ elevateaisystem.com
 */
(function () {
  'use strict';

  const CSS = `
    #author-bio-section {
      max-width: 780px;
      margin: 3rem auto 2rem;
      padding: 0 1.5rem;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    #author-bio-card {
      display: flex;
      gap: 1.5rem;
      align-items: flex-start;
      background: #fff;
      border: 1px solid #e8e8e4;
      border-radius: 16px;
      padding: 1.75rem;
      box-shadow: 0 2px 16px rgba(0,0,0,0.05);
    }
    #author-bio-avatar {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
      border: 2px solid #00FF41;
    }
    #author-bio-avatar-fallback {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0A0F1C 0%, #1a2744 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      font-weight: 800;
      color: #00FF41;
      flex-shrink: 0;
      border: 2px solid #00FF41;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    #author-bio-body {
      flex: 1;
      min-width: 0;
    }
    #author-bio-label {
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #00CC34;
      margin-bottom: 0.3rem;
    }
    #author-bio-name {
      font-size: 1.1rem;
      font-weight: 800;
      color: #0A0F1C;
      margin: 0 0 0.1rem;
      letter-spacing: -0.02em;
    }
    #author-bio-titles {
      font-size: 0.8rem;
      color: #888;
      margin: 0 0 0.65rem;
    }
    #author-bio-titles a {
      color: #555;
      text-decoration: none;
      border-bottom: 1px solid #ddd;
      transition: color 0.2s, border-color 0.2s;
    }
    #author-bio-titles a:hover {
      color: #00CC34;
      border-color: #00CC34;
    }
    #author-bio-text {
      font-size: 0.875rem;
      color: #444;
      line-height: 1.65;
      margin: 0 0 1rem;
    }
    #author-bio-links {
      display: flex;
      gap: 0.65rem;
      flex-wrap: wrap;
    }
    .author-bio-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.8rem;
      font-weight: 700;
      padding: 0.4rem 0.85rem;
      border-radius: 20px;
      text-decoration: none;
      transition: all 0.2s;
    }
    .author-bio-link-primary {
      background: #00FF41;
      color: #0A0F1C;
    }
    .author-bio-link-primary:hover {
      background: #00CC34;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,255,65,0.3);
    }
    .author-bio-link-secondary {
      background: #f4f4f2;
      color: #0A0F1C;
      border: 1px solid #e0e0dc;
    }
    .author-bio-link-secondary:hover {
      background: #e8e8e4;
      transform: translateY(-1px);
    }
    @media (max-width: 540px) {
      #author-bio-card {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
      #author-bio-links {
        justify-content: center;
      }
    }
  `;

  function inject() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    const section = document.createElement('div');
    section.id = 'author-bio-section';

    // Try to load photo; fall back to initials monogram
    const avatarHtml = `
      <img id="author-bio-avatar"
           src="https://elevateaisystem.com/sunny.jpg"
           alt="Sunny Binjola"
           onerror="this.style.display='none'; document.getElementById('author-bio-avatar-fallback').style.display='flex';"
      />
      <div id="author-bio-avatar-fallback" style="display:none;">S</div>
    `;

    section.innerHTML = `
      <div id="author-bio-card" role="complementary" aria-label="About the author">
        <div style="display:flex;flex-direction:column;align-items:center;gap:0;">${avatarHtml}</div>
        <div id="author-bio-body">
          <div id="author-bio-label">Written by</div>
          <div id="author-bio-name">Sunny Binjola</div>
          <div id="author-bio-titles">
            Founder, <a href="https://elevateaisystem.com" target="_blank" rel="noopener">ElevateAI System</a>
            &nbsp;·&nbsp;
            <a href="https://sunnybinjola.com" target="_blank" rel="noopener">Men's Coach</a>
          </div>
          <p id="author-bio-text">Software engineer turned AI marketing strategist and men's coach. I build AI-powered marketing systems for coaches &amp; creators — and help men rebuild identity, purpose, and drive after major life transitions. Embodiment meets execution.</p>
          <div id="author-bio-links">
            <a href="https://elevateaisystem.com" class="author-bio-link author-bio-link-primary" target="_blank" rel="noopener">AI Marketing Systems ↗</a>
            <a href="https://sunnybinjola.com" class="author-bio-link author-bio-link-secondary" target="_blank" rel="noopener">Men's Coaching ↗</a>
          </div>
        </div>
      </div>
    `;

    // Insert before the newsletter popup or before </body>
    const popup = document.getElementById('nl-popup-overlay');
    if (popup) {
      document.body.insertBefore(section, popup);
    } else {
      document.body.appendChild(section);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
