/**
 * ElevateAI System — Newsletter Popup
 * The Signal by Sunny Binjola
 * Slides up from the bottom after 60% scroll. Dismissible for 3 days.
 * On subscribe: sends to Beehiiv + logs to Supabase newsletter_subscribers table.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'elevate_nl_dismissed';
  const DISMISS_DAYS = 3;
  const TRIGGER_PERCENT = 40;

  // Supabase config
  const SB_URL  = 'https://modepuhwinzdngirlnkz.supabase.co';
  const SB_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZGVwdWh3aW56ZG5naXJsbmt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MDYxNTEsImV4cCI6MjA4ODA4MjE1MX0.1S2wC8CxE8_MCTmsGwoiOoqNYw_lXIM7_CT_-AG6DAI';
  // Beehiiv publication ID
  const BH_PUB  = 'f390a157-1409-46d7-8d9e-1eff7e3a4d64';

  // Don't show if dismissed recently
  const dismissed = localStorage.getItem(STORAGE_KEY);
  if (dismissed && Date.now() < parseInt(dismissed, 10)) return;

  const CSS = `
    #nl-popup-overlay {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      z-index: 9999;
      display: flex;
      justify-content: center;
      padding: 0 1rem 1.5rem;
      pointer-events: none;
      transform: translateY(120%);
      transition: transform 0.45s cubic-bezier(0.34, 1.4, 0.64, 1);
    }
    #nl-popup-overlay.visible {
      transform: translateY(0);
      pointer-events: all;
    }
    #nl-popup {
      background: #0A0F1C;
      border: 1px solid rgba(0,255,65,0.25);
      border-radius: 16px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,255,65,0.08);
      width: 100%;
      max-width: 480px;
      overflow: hidden;
      position: relative;
    }
    #nl-popup-inner {
      padding: 1.5rem 1.75rem 1.25rem;
    }
    #nl-close {
      position: absolute;
      top: 0.75rem; right: 0.75rem;
      background: rgba(255,255,255,0.07);
      border: none;
      color: rgba(255,255,255,0.5);
      width: 28px; height: 28px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1rem;
      line-height: 28px;
      text-align: center;
      transition: all 0.2s;
      padding: 0;
      display: flex; align-items: center; justify-content: center;
    }
    #nl-close:hover {
      background: rgba(255,255,255,0.15);
      color: #fff;
    }
    #nl-badge {
      display: inline-block;
      background: rgba(0,255,65,0.12);
      color: #00CC34;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 0.2rem 0.65rem;
      border-radius: 20px;
      margin-bottom: 0.65rem;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    #nl-headline {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 1.25rem;
      font-weight: 800;
      color: #fff;
      line-height: 1.25;
      margin: 0 0 0.35rem;
      letter-spacing: -0.02em;
    }
    #nl-sub {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.85rem;
      color: rgba(255,255,255,0.55);
      margin: 0 0 1rem;
      line-height: 1.5;
    }
    #nl-form-wrap {
      display: flex;
      gap: 0.5rem;
    }
    #nl-email {
      flex: 1;
      padding: 0.65rem 0.85rem;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.06);
      color: #fff;
      font-size: 0.875rem;
      font-family: 'Plus Jakarta Sans', sans-serif;
      outline: none;
      transition: border-color 0.2s;
    }
    #nl-email::placeholder { color: rgba(255,255,255,0.3); }
    #nl-email:focus { border-color: rgba(0,255,65,0.5); }
    #nl-submit {
      background: #00FF41;
      color: #0A0F1C;
      border: none;
      padding: 0.65rem 1.1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 800;
      cursor: pointer;
      font-family: 'Plus Jakarta Sans', sans-serif;
      transition: all 0.2s;
      white-space: nowrap;
    }
    #nl-submit:hover {
      background: #00CC34;
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(0,255,65,0.3);
    }
    #nl-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    #nl-success {
      display: none;
      text-align: center;
      padding: 0.5rem 0 0.25rem;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    #nl-success .check {
      font-size: 1.75rem;
      display: block;
      margin-bottom: 0.4rem;
    }
    #nl-success p {
      color: #00CC34;
      font-weight: 700;
      font-size: 0.9rem;
      margin: 0;
    }
    #nl-success span {
      color: rgba(255,255,255,0.5);
      font-size: 0.8rem;
    }
    #nl-footer-note {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.7rem;
      color: rgba(255,255,255,0.25);
      text-align: center;
      margin-top: 0.75rem;
      padding-top: 0.65rem;
      border-top: 1px solid rgba(255,255,255,0.07);
    }
    @media (max-width: 520px) {
      #nl-popup-overlay { padding: 0 0 0; }
      #nl-popup { border-radius: 16px 16px 0 0; max-width: 100%; }
      #nl-form-wrap { flex-direction: column; }
      #nl-submit { width: 100%; padding: 0.75rem; }
    }
  `;

  function inject() {
    // Style
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    // Markup
    const overlay = document.createElement('div');
    overlay.id = 'nl-popup-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Subscribe to The Signal newsletter');
    overlay.innerHTML = `
      <div id="nl-popup">
        <div id="nl-popup-inner">
          <button id="nl-close" aria-label="Close newsletter signup">✕</button>
          <div id="nl-badge">Free Weekly Newsletter</div>
          <div id="nl-headline">The Signal by Sunny Binjola</div>
          <div id="nl-sub">3 AI technologies. 2 actionable ideas. 1 tool. Every Tuesday — built for coaches &amp; creators.</div>
          <div id="nl-form-wrap">
            <input id="nl-email" type="email" placeholder="your@email.com" autocomplete="email" />
            <button id="nl-submit">Subscribe →</button>
          </div>
          <div id="nl-success">
            <span class="check">✅</span>
            <p>You're in!</p>
            <span>Check your inbox to confirm.</span>
          </div>
        </div>
        <div id="nl-footer-note">No spam. Unsubscribe anytime. Sent every Tuesday.</div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Close
    document.getElementById('nl-close').addEventListener('click', dismiss);

    // Submit
    document.getElementById('nl-submit').addEventListener('click', handleSubmit);
    document.getElementById('nl-email').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') handleSubmit();
    });

    // Trigger on scroll
    let shown = false;
    function onScroll() {
      if (shown) return;
      const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrolled >= TRIGGER_PERCENT) {
        shown = true;
        overlay.classList.add('visible');
        window.removeEventListener('scroll', onScroll);
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function dismiss() {
    const overlay = document.getElementById('nl-popup-overlay');
    if (!overlay) return;
    overlay.classList.remove('visible');
    const expiry = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY, expiry.toString());
    setTimeout(() => overlay.remove(), 500);
  }

  function handleSubmit() {
    const emailInput = document.getElementById('nl-email');
    const submitBtn  = document.getElementById('nl-submit');
    const formWrap   = document.getElementById('nl-form-wrap');
    const success    = document.getElementById('nl-success');
    const email      = emailInput.value.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailInput.style.borderColor = 'rgba(239,68,68,0.6)';
      emailInput.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '...';

    const pageSlug = window.location.pathname.replace(/^\/blog\//, '').replace(/\.html$/, '') || 'unknown';

    // 1) Beehiiv subscribe
    const beehiivReq = fetch(
      'https://api.beehiiv.com/v2/publications/' + BH_PUB + '/subscriptions',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          utm_source: 'blog-popup',
          utm_medium: 'website',
          utm_campaign: 'newsletter-popup',
          utm_content: pageSlug
        })
      }
    );

    // 2) Supabase insert — logs email, source page, and timestamp
    const supabaseReq = fetch(
      SB_URL + '/rest/v1/newsletter_subscribers',
      {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'apikey':        SB_KEY,
          'Authorization': 'Bearer ' + SB_KEY,
          'Prefer':        'return=minimal'
        },
        body: JSON.stringify({
          email:    email,
          source:   'blog-popup',
          page_url: window.location.href
        })
      }
    );

    // Fire both in parallel — show success regardless of individual outcomes
    Promise.allSettled([beehiivReq, supabaseReq]).then(function (results) {
      const bhOk = results[0].status === 'fulfilled' && results[0].value.ok;
      if (!bhOk) {
        // Beehiiv API failed — open subscribe page as fallback
        window.open(
          'https://elevateaisystem.beehiiv.com/subscribe?email=' + encodeURIComponent(email),
          '_blank'
        );
      }
      showSuccess(formWrap, success);
    }).catch(function () {
      window.open(
        'https://elevateaisystem.beehiiv.com/subscribe?email=' + encodeURIComponent(email),
        '_blank'
      );
      showSuccess(formWrap, success);
    });
  }

  function showSuccess(formWrap, success) {
    formWrap.style.display = 'none';
    success.style.display = 'block';
    // Dismiss after 3.5s
    setTimeout(dismiss, 3500);
    // Mark as subscribed — don't show again for 30 days
    const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY, expiry.toString());
  }

  // Init after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
