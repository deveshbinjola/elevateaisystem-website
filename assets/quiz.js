/* Resonance Diagnostic quiz.
   Renamed from "Brand OS" 2026-09-02 (that product was retired). The
   brandOS_* keys and the brand_os_* Supabase columns are deliberately NOT
   renamed: they are the live table schema and renaming them silently breaks
   the write.
   Extracted from index.html 2026-09-02: it was 14.9 KB of inline script on
   every homepage load for what is now the third-priority funnel.

   Loaded with `defer`, so it runs after the DOM is parsed. qzOpen() stays a
   global because the markup calls it via inline onclick handlers.

   The Supabase key below is the PUBLISHABLE (anon) key. Public by design,
   protected by row-level security, not a secret. */

// ============================================
  // 🟢 BRAND OS QUIZ LOGIC, drop this script block into your site too
  // ============================================

  // SUPABASE CONFIG (live, table: brand_os_quiz_submissions)
  const QZ_SUPABASE_URL = 'https://modepuhwinzdngirlnkz.supabase.co';
  const QZ_SUPABASE_KEY = 'sb_publishable_cmok-dqlnfySxmdJVfv1CA_ESioiu0B';
  const QZ_TABLE = 'brand_os_quiz_submissions';

  // BOOKING LINK, routes through /apply.html qualifier (3 questions),
  // which then sends qualified leads to Cal.com. Keeps the funnel gated.
  const QZ_APPLY_BASE = '/apply.html';
  const QZ_CAL_LINK = QZ_APPLY_BASE; // legacy alias kept for safety

  // ============================================
  // State
  // ============================================
  const qzAnswers = {
    archetype: null,
    revenue: null,
    revenueTier: 0,
    brandOS_message: null,
    brandOS_audience: null,
    contentOS: null,
    leadOS: null,
    salesOS: null,
    opsOS: null,
    bottleneck: null,
    readiness: null,
    readinessTier: 0,
    name: '',
    email: ''
  };

  const qzSlides = ['intro','q1','q2','q3','q4','q5','q6','q7','q8','q9','q10','email'];
  let qzIndex = 0;
  const QZ_TOTAL = 10;

  // ============================================
  // Modal open / close
  // ============================================
  function qzOpen() {
    document.getElementById('qzModal').classList.add('qz-open');
    document.body.style.overflow = 'hidden';
    qzGoToSlide(0);
  }
  function qzClose() {
    document.getElementById('qzModal').classList.remove('qz-open');
    document.body.style.overflow = '';
  }

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('qzModal').classList.contains('qz-open')) qzClose();
  });

  // ============================================
  // Navigation
  // ============================================
  function qzGoToSlide(idx) {
    document.querySelectorAll('.qz-slide').forEach(s => s.classList.remove('qz-active'));
    document.getElementById('qzLoading').classList.remove('qz-active');
    document.getElementById('qzResults').classList.remove('qz-active');

    const slide = qzSlides[idx];
    const el = document.querySelector(`.qz-slide[data-slide="${slide}"]`);
    if (el) el.classList.add('qz-active');

    qzUpdateProgress(idx);
    const body = document.querySelector('.qz-body');
    if (body) body.scrollTop = 0;
  }

  function qzUpdateProgress(idx) {
    const pct = idx === 0 ? 0 : Math.min((idx / (qzSlides.length - 1)) * 100, 100);
    document.getElementById('qzProgressFill').style.width = pct + '%';
    const t = document.getElementById('qzProgressText');
    if (idx === 0) t.innerHTML = 'Ready';
    else if (idx === qzSlides.length - 1) t.innerHTML = 'Final step';
    else t.innerHTML = `Q <span class="num">${idx}</span> / ${QZ_TOTAL}`;
  }

  function qzStart() { qzIndex = 1; qzGoToSlide(qzIndex); }
  function qzNext() { if (qzIndex < qzSlides.length - 1) { qzIndex++; qzGoToSlide(qzIndex); } }
  function qzBack() { if (qzIndex > 0) { qzIndex--; qzGoToSlide(qzIndex); } }

  // ============================================
  // Option / scale button setup
  // ============================================
  // Auto-advance on selection: hide the Next button and fire qzNext() after a brief delay
  // so the user sees their selection register before moving forward.
  function qzSetupOptions(qId, answerKey, tierKey) {
    const container = document.getElementById(`qz-${qId}-options`);
    const nextBtn = document.getElementById(`qz-${qId}-next`);
    if (!container) return;
    if (nextBtn) nextBtn.style.display = 'none'; // auto-advance: no manual Next needed
    container.querySelectorAll('.qz-option').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.qz-option').forEach(b => b.classList.remove('qz-selected'));
        btn.classList.add('qz-selected');
        qzAnswers[answerKey] = btn.dataset.value;
        if (tierKey && btn.dataset.tier) qzAnswers[tierKey] = parseInt(btn.dataset.tier);
        setTimeout(() => qzNext(), 350); // 350ms delay so user sees the selected state
      });
    });
  }

  function qzSetupScale(qId, answerKey) {
    const container = document.getElementById(`qz-${qId}-scale`);
    const nextBtn = document.getElementById(`qz-${qId}-next`);
    if (!container) return;
    if (nextBtn) nextBtn.style.display = 'none'; // auto-advance: no manual Next needed
    container.querySelectorAll('.qz-scale-option').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.qz-scale-option').forEach(b => b.classList.remove('qz-selected'));
        btn.classList.add('qz-selected');
        qzAnswers[answerKey] = parseInt(btn.dataset.score);
        setTimeout(() => qzNext(), 350); // 350ms delay so user sees the selected state
      });
    });
  }

  qzSetupOptions('q1', 'archetype');
  qzSetupOptions('q2', 'revenue', 'revenueTier');
  qzSetupOptions('q9', 'bottleneck');
  qzSetupOptions('q10', 'readiness', 'readinessTier');
  qzSetupScale('q3', 'brandOS_message');
  qzSetupScale('q4', 'brandOS_audience');
  qzSetupScale('q5', 'contentOS');
  qzSetupScale('q6', 'leadOS');
  qzSetupScale('q7', 'salesOS');
  qzSetupScale('q8', 'opsOS');

  // ============================================
  // Submit
  // ============================================
  function qzSubmit() {
    const name = document.getElementById('qz-name').value.trim();
    const email = document.getElementById('qz-email').value.trim();
    if (!name || !email || !email.includes('@')) {
      alert('Please enter your name and a valid email.');
      return;
    }
    qzAnswers.name = name;
    qzAnswers.email = email;

    // Hide slide, show loader
    document.querySelectorAll('.qz-slide').forEach(s => s.classList.remove('qz-active'));
    document.getElementById('qzLoading').classList.add('qz-active');

    // Compute scores
    const pillarKeys = ['brandOS_message','brandOS_audience','contentOS','leadOS','salesOS','opsOS'];
    const pillarScores = pillarKeys.map(k => qzAnswers[k] || 0);
    const overall = Math.round(pillarScores.reduce((a,b) => a+b, 0) / pillarKeys.length);

    const leadScore = qzAnswers.revenueTier + qzAnswers.readinessTier;
    let tier = 'COLD';
    if (leadScore >= 6) tier = 'HOT';
    else if (leadScore >= 3) tier = 'WARM';

    // Build Supabase payload (snake_case to match table columns)
    const payload = {
      name: qzAnswers.name,
      email: qzAnswers.email,
      archetype: qzAnswers.archetype,
      revenue: qzAnswers.revenue,
      revenue_tier: qzAnswers.revenueTier,
      brand_os_message: qzAnswers.brandOS_message,
      brand_os_audience: qzAnswers.brandOS_audience,
      content_os: qzAnswers.contentOS,
      lead_os: qzAnswers.leadOS,
      sales_os: qzAnswers.salesOS,
      ops_os: qzAnswers.opsOS,
      overall_score: overall,
      bottleneck: qzAnswers.bottleneck,
      readiness: qzAnswers.readiness,
      readiness_tier: qzAnswers.readinessTier,
      lead_tier: tier,
      source: 'quiz-modal'
    };

    // POST to Supabase
    fetch(`${QZ_SUPABASE_URL}/rest/v1/${QZ_TABLE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': QZ_SUPABASE_KEY,
        'Authorization': `Bearer ${QZ_SUPABASE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    }).catch(err => console.warn('Supabase submission failed (non-blocking):', err));

    // Simulate processing for UX (and render results)
    setTimeout(() => {
      document.getElementById('qzLoading').classList.remove('qz-active');
      qzRenderResults(overall, tier);
    }, 1600);
  }

  // ============================================
  // Render results
  // ============================================
  const QZ_PILLARS = [
    { key: 'brandOS_message',  name: 'Message clarity',     os: 'Foundation', week: 'Week 1' },
    { key: 'brandOS_audience', name: 'Audience clarity',    os: 'Foundation', week: 'Week 1' },
    { key: 'contentOS',        name: 'Content engine',      os: 'Content OS', week: 'Week 2' },
    { key: 'leadOS',           name: 'Lead generation',     os: 'Lead OS',    week: 'Week 3' },
    { key: 'salesOS',          name: 'Sales & follow-up',   os: 'Sales OS',   week: 'Week 4' },
    { key: 'opsOS',            name: 'Ops & AI integration',os: 'Ops OS',     week: 'Week 5' }
  ];

  const QZ_GAP_COPY = {
    brandOS_message:  'Your message isn\'t landing. When people ask what you do, the answer shifts. Fix: get the foundation in writing, who you serve and exactly how you say it.',
    brandOS_audience: 'Your audience is blurry. You\'re writing to "men who want more" instead of ONE specific man. Fix: name one real person and write only to them.',
    contentOS:        'Content is inconsistent because there\'s no system. Every post is a one-off. Fix: Content OS, prompt library + 30-day calendar + repurposing workflow.',
    leadOS:           'Your leads are random. You\'re depending on content alone or cold hustling. Fix: Lead OS, AI-powered LinkedIn outbound + lead magnets + landing pages.',
    salesOS:          'Warm leads are going cold because your follow-up is slow. Fix: Sales OS, 60-second AI DM responder + 5-touch automated sequences.',
    opsOS:            'You\'re the bottleneck. Operations eat the hours you should be coaching. Fix: Ops OS, onboarding automation + AI session notes + scheduling.'
  };

  const QZ_ARCHETYPES = {
    'mens-embodiment': "Men's Embodiment Coach",
    'womens-embodiment': "Women's Embodiment Coach",
    'mindset': 'Mindset Coach',
    'business': 'Business Coach',
    'fitness': 'Fitness Coach',
    'spiritual': 'Spiritual Coach',
    'creator': 'Creator',
    'other': 'Coach'
  };

  const QZ_BOTTLENECK_COPY = {
    'leads': 'You told me your biggest bottleneck is leads, which lines up with your Lead OS gap.',
    'conversion': 'You told me conversion is the problem, that maps directly to Sales OS.',
    'ops': 'You told me ops are eating you alive, that\'s exactly what Ops OS solves.',
    'burnout': 'You told me you\'re burning out, that\'s a systems problem, not a willpower problem.',
    'content-direction': 'You told me you\'re unclear on what to post. That is a foundation problem, not a content problem. Direction comes FROM clarity on who you serve and how you speak. Fix the foundation and what to post becomes obvious.',
    'direction': 'You told me you\'re unsure what to build next, which usually means the foundation isn\'t dialed yet.'
  };

  function qzRenderResults(overall, tier) {
    const firstName = qzAnswers.name || 'friend';
    const archetype = QZ_ARCHETYPES[qzAnswers.archetype] || 'Coach';

    // Verdict
    let verdict = '';
    if (overall >= 80) verdict = 'Your machine is mostly running. Tighten the final 20%.';
    else if (overall >= 60) verdict = 'Foundation is there, you\'re leaking revenue in specific places.';
    else if (overall >= 40) verdict = 'You have the coaching. You don\'t have the systems yet.';
    else if (overall >= 20) verdict = 'Raw talent, zero machine. Let\'s build the foundation.';
    else verdict = 'You\'re hustling. Time to install real systems.';

    document.getElementById('qzScoreVerdict').textContent = verdict;
    document.getElementById('qzScoreTier').textContent = tier + ' LEAD';
    qzAnimateScore(overall);

    // Pillars
    const pillarList = document.getElementById('qzPillarList');
    pillarList.innerHTML = '';
    QZ_PILLARS.forEach(p => {
      const score = qzAnswers[p.key] || 0;
      const colorClass = score < 40 ? 'qz-low' : score < 70 ? 'qz-mid' : '';
      pillarList.insertAdjacentHTML('beforeend', `
        <div class="qz-pillar-item">
          <div class="qz-pillar-row">
            <div class="qz-pillar-name">${p.name}<small>${p.os} · ${p.week}</small></div>
            <div class="qz-pillar-score">${score}</div>
          </div>
          <div class="qz-pillar-bar"><div class="qz-pillar-fill ${colorClass}" style="width: 0%"></div></div>
        </div>
      `);
    });
    setTimeout(() => {
      document.querySelectorAll('.qz-pillar-fill').forEach((bar, i) => {
        bar.style.width = (qzAnswers[QZ_PILLARS[i].key] || 0) + '%';
      });
    }, 120);

    // Top 3 gaps
    const sorted = QZ_PILLARS.map(p => ({ ...p, score: qzAnswers[p.key] || 0 })).sort((a,b) => a.score - b.score);
    const topGaps = sorted.slice(0, 3);
    const gapsList = document.getElementById('qzGapsList');
    gapsList.innerHTML = '';
    topGaps.forEach((g, i) => {
      gapsList.insertAdjacentHTML('beforeend', `
        <div class="qz-gap-item">
          <div class="qz-gap-num">0${i+1}</div>
          <div>
            <div class="qz-gap-name">${g.name}</div>
            <div class="qz-gap-map">Fixed in · ${g.os} · ${g.week}</div>
            <div class="qz-gap-desc">${QZ_GAP_COPY[g.key]}</div>
          </div>
        </div>
      `);
    });

    // Diagnosis
    const primaryGap = topGaps[0];
    document.getElementById('qzDiagnosisHeadline').innerHTML =
      `${firstName}, you\'re running a ${archetype.toLowerCase()} business with a <strong>${primaryGap.os.toLowerCase()} problem</strong>.`;

    const bottleneckSentence = QZ_BOTTLENECK_COPY[qzAnswers.bottleneck] || '';
    const foundationAvg = Math.round(((qzAnswers.brandOS_message || 0) + (qzAnswers.brandOS_audience || 0)) / 2);
    const systemsAvg = Math.round(((qzAnswers.contentOS || 0) + (qzAnswers.leadOS || 0) + (qzAnswers.salesOS || 0) + (qzAnswers.opsOS || 0)) / 4);

    document.getElementById('qzDiagnosisBody').innerHTML = `
      <p>Out of 100, you scored <strong>${overall}</strong>. Your foundation averages <strong>${foundationAvg}</strong>, your systems (Content/Lead/Sales/Ops OS) average <strong>${systemsAvg}</strong>.</p>
      <p>${bottleneckSentence}</p>
      <p>The move: book a free call. We map your foundation live, who you serve, how you speak and what to post, and I show you exactly which system to build next.</p>
    `;

    // Route CTA → /apply.html with score + tier + name + email pre-filled
    const applyParams = new URLSearchParams({
      score: overall,
      tier: tier,
      email: qzAnswers.email || '',
      name: qzAnswers.name || ''
    });
    const ctaBtn = document.querySelector('.qz-cta-button');
    if (ctaBtn) {
      ctaBtn.href = `${QZ_APPLY_BASE}?${applyParams.toString()}`;
      ctaBtn.removeAttribute('target');
      ctaBtn.removeAttribute('rel');
    }

    document.getElementById('qzResults').classList.add('qz-active');
    const body = document.querySelector('.qz-body');
    if (body) body.scrollTop = 0;
  }

  function qzAnimateScore(target) {
    const el = document.getElementById('qzScoreNum');
    let current = 0;
    const steps = 48;
    const inc = target / steps;
    const tick = 1400 / steps;
    const iv = setInterval(() => {
      current += inc;
      if (current >= target) { current = target; clearInterval(iv); }
      el.textContent = Math.round(current);
    }, tick);
  }

  // Init
  qzUpdateProgress(0);
