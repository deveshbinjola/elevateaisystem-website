/**
 * ElevateAI Shared Navbar Component
 * Include this script on any page to get the standard navbar.
 * Usage: <script src="navbar.js"></script> (or "../navbar.js" from /blog/ subfolder)
 *
 * The script auto-detects the page path to set correct relative links.
 * For pages that need a custom CTA (like product pages), those pages
 * keep their own inline nav and do NOT include this script.
 */
(function () {
  // Detect if we're in a subfolder (e.g., /blog/)
  const path = window.location.pathname;
  const isSubfolder = path.includes('/blog/') && !path.endsWith('/blog/') && !path.endsWith('/blog');
  const prefix = isSubfolder ? '../' : '';
  const absPrefix = '/'; // Use absolute paths for nav links

  // ── Nav links (simplified 2026-09-02) ──
  // Previously this switched between a coach nav and an ops nav based on the
  // path. That existed only because the ops links were vertical-specific
  // ("Behavioral Health", "The Five Leaks") and looked wrong to a coach.
  // With Brand OS and Build Your Brand removed and the ops page labelled
  // "Ops Engine", both audiences want the same two products, so the branching
  // is gone. One nav, everywhere. Do not reintroduce audience switching
  // without a reason that survives being said out loud.
  //
  // "Ops Engine" is deliberately broader than the /behavioral-health URL it
  // points at, so it still fits when a second vertical lands.
  const links = [
    { href: '/behavioral-health',                  label: 'Ops Engine' },
    { href: 'https://app.elevateaisystem.com',     label: 'Coach Assistant' },
    { href: '/about',                              label: 'About' },
    { href: '/blog',                               label: 'Blog' }
  ];
  const linkHTML = links.map(function (l) {
    return '<a href="' + l.href + '">' + l.label + '</a>';
  }).join('\n      ');

  // ── Inject Navbar CSS ──
  const style = document.createElement('style');
  style.textContent = `
/* GLOBAL MOBILE SAFETY (prevents horizontal overflow everywhere) */
html, body { max-width: 100vw; overflow-x: hidden; }
*, *::before, *::after { max-width: 100%; }
img, svg, video, canvas, iframe { max-width: 100%; height: auto; }

/* NAVBAR STYLES (injected by navbar.js) */
.nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(250,250,248,.85); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border-bottom: 1px solid var(--border, #E0E0D8); padding: 0 2rem; height: 72px; display: flex; align-items: center; justify-content: space-between; transition: all .3s; box-sizing: border-box; width: 100%; }
.nav.scrolled { box-shadow: 0 2px 20px rgba(0,0,0,.06); }
.nav-logo { font-size: 1.4rem; font-weight: 800; color: var(--navy, #0A0F1C); letter-spacing: -.02em; display: flex; align-items: center; gap: .5rem; text-decoration: none; }
.nav-logo-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.nav-logo-text span { color: var(--green-dark, #00CC34); }
.nav-links { display: flex; gap: 2rem; align-items: center; }
.nav-links a { font-size: .85rem; font-weight: 700; color: var(--navy, #0A0F1C); letter-spacing: .08em; text-transform: uppercase; transition: color .2s; position: relative; text-decoration: none; }
.nav-links a:hover { color: var(--navy, #0A0F1C); }
.nav-links a::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 2px; background: var(--green, #00FF41); transition: width .3s; }
.nav-links a:hover::after { width: 100%; }
.nav-cta { background: var(--green, #00FF41); color: var(--navy, #0A0F1C) !important; padding: .65rem 1.6rem; border-radius: 50px; font-size: .85rem; font-weight: 800; transition: all .3s; letter-spacing: .02em; }
.nav-cta:hover { background: var(--green-dark, #00CC34); transform: translateY(-1px); box-shadow: 0 4px 15px rgba(0,255,65,.25); }
.nav-cta::after { display: none !important; }
.nav-dropdown { position: relative; }
.nav-dropdown > a::after { display: none !important; }
.nav-dropdown > a { cursor: pointer; display: flex; align-items: center; gap: 4px; }
.nav-dropdown > a svg { width: 12px; height: 12px; transition: transform .2s; }
.nav-dropdown:hover > a svg { transform: rotate(180deg); }
.dropdown-menu { position: absolute; top: calc(100% + 12px); left: 50%; transform: translateX(-50%); background: var(--white, #FFFFFF); border: 1px solid var(--border, #E0E0D8); border-radius: 12px; padding: .5rem; min-width: 220px; box-shadow: 0 12px 40px rgba(0,0,0,.08); opacity: 0; visibility: hidden; transition: all .2s; }
.nav-dropdown:hover .dropdown-menu { opacity: 1; visibility: visible; }
.dropdown-menu a { display: flex; align-items: center; gap: .75rem; padding: .75rem 1rem; border-radius: 8px; font-size: .82rem; font-weight: 600; text-transform: none; letter-spacing: 0; color: var(--text, #1A1A2E); transition: background .2s; }
.dropdown-menu a:hover { background: var(--bg-alt, #F2F2EE); }
.dropdown-menu a::after { display: none !important; }
.dropdown-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: .75rem; font-weight: 800; flex-shrink: 0; }
.dropdown-desc { font-size: .72rem; font-weight: 400; color: var(--text-muted, #5A5A6E); margin-top: 2px; }
.mobile-menu { display: none; flex-direction: column; gap: 5px; cursor: pointer; background: none; border: none; padding: 12px; z-index: 101; -webkit-tap-highlight-color: transparent; }
.mobile-menu span { display: block; width: 26px; height: 3px; background: var(--navy, #0A0F1C); border-radius: 2px; transition: all .3s; }
.mobile-nav { display: none; position: fixed; top: 72px; left: 0; right: 0; background: var(--white, #FFFFFF); border-bottom: 1px solid var(--border, #E0E0D8); padding: 1.5rem 2rem; z-index: 99; flex-direction: column; gap: .75rem; box-shadow: 0 8px 30px rgba(0,0,0,.08); }
.mobile-nav.open { display: flex; }
.mobile-nav a { font-size: .95rem; font-weight: 600; color: var(--text, #1A1A2E); padding: .5rem 0; text-decoration: none; }
.mobile-nav .mobile-sub { padding-left: 1rem; font-size: .85rem; color: var(--text-muted, #5A5A6E); }
.mobile-nav .nav-cta { text-align: center; margin-top: .5rem; }
@media (max-width: 768px) {
  .nav { padding: 0 1rem; }
  .nav-links { display: none; }
  .mobile-menu { display: flex; margin-right: -4px; }
  .mobile-nav { padding: 1.25rem 1rem; }
  .nav-logo { font-size: 1.2rem; }
}
@media (max-width: 380px) {
  .nav { padding: 0 .75rem; }
  .nav-logo-text { font-size: 1rem; }
}
`;
  document.head.appendChild(style);

  // ── Leaf SVG icon for logo (canonical — matches coach app BrandIcon) ──
  const leafSVG = '<svg width="36" height="36" viewBox="0 0 48 48" fill="none"><rect x="3" y="4" width="39" height="39" rx="9.8" fill="#00F33D"/><path d="M14.2 30.5C13.6 24 15.2 18.8 19.9 15.6C23.5 13.2 27.7 13.4 32.1 10.2C33.9 18.5 31.6 25.6 25.7 28.8C21.9 30.9 18 30.7 15.4 29.6L14.2 30.5Z" fill="#071126"/><path d="M13.4 32.1C15.8 26.9 19.8 22.9 25.3 20.1" stroke="#071126" stroke-width="2.7" stroke-linecap="round"/></svg>';

  // ── Chevron SVG for dropdown ──
  const chevronSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>';

  // ── Build Desktop Nav ──
  const nav = document.createElement('nav');
  nav.className = 'nav';
  nav.id = 'nav';
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Main navigation');
  nav.innerHTML = `
    <a href="/" class="nav-logo">
      <div class="nav-logo-icon">${leafSVG}</div>
      <span class="nav-logo-text">Elevate<span>AI</span></span>
    </a>
    <div class="nav-links">
      ${linkHTML}
      <a href="https://cal.com/sunny-binjola/discovery-call" class="nav-cta" target="_blank" rel="noopener">Book a Call</a>
    </div>
    <button class="mobile-menu" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>
  `;

  // ── Build Mobile Nav ──
  const mobileNav = document.createElement('div');
  mobileNav.className = 'mobile-nav';
  mobileNav.id = 'mobileNav';
  mobileNav.innerHTML = `
    <a href="/">Home</a>
    ${linkHTML}
    <a href="https://cal.com/sunny-binjola/discovery-call" class="nav-cta" target="_blank" rel="noopener">Book a Call</a>
  `;

  // ── Insert into DOM ──
  const body = document.body;
  body.insertBefore(mobileNav, body.firstChild);
  body.insertBefore(nav, body.firstChild);

  // ── Mobile toggle ──
  const mobileBtn = nav.querySelector('.mobile-menu');
  mobileBtn.addEventListener('click', function () {
    mobileNav.classList.toggle('open');
  });

  // Close mobile nav when a link is clicked
  mobileNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      mobileNav.classList.remove('open');
    });
  });

  // ── Scroll effect ──
  window.addEventListener('scroll', function () {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  });
})();
