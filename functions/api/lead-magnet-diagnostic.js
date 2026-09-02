// Cloudflare Pages Function — Lead Magnet Diagnostic Quiz.
// Path: /api/lead-magnet-diagnostic  (POST)
//
// Body: { email: string, answers: [{ q: string, a: string }, ...] }
// On success: subscribes email to Beehiiv, stores results in Supabase,
// sends follow-up email via Resend, and returns { ok: true, diagnostic }.
//
// Env vars:
//   ANTHROPIC_API_KEY, BEEHIIV_API_KEY, BEEHIIV_PUB_ID
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   RESEND_API_KEY

const MIN_ANSWERS = 4;
const MIN_ANSWER_CHARS = 5;
const MAX_ANSWER_CHARS = 2000;
const DEFAULT_PUB_ID = "f390a157-1409-46d7-8d9e-1eff7e3a4d64";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function onRequestPost({ request, env }) {
  if (!env.ANTHROPIC_API_KEY) return json({ ok: false, error: "Server not configured" }, 503);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: "Valid email required" }, 400);
  }

  const rawAnswers = Array.isArray(body?.answers) ? body.answers : [];
  const answers = rawAnswers
    .filter((x) => x && typeof x.q === "string" && typeof x.a === "string")
    .map((x) => ({ q: x.q.trim(), a: x.a.trim().slice(0, MAX_ANSWER_CHARS) }))
    .filter((x) => x.a.length >= MIN_ANSWER_CHARS);

  if (answers.length < MIN_ANSWERS) {
    return json({ ok: false, error: `Need at least ${MIN_ANSWERS} answers.` }, 400);
  }

  // --- Anthropic: diagnose their lead magnet ---
  const model = env.AGENT_MODEL || "claude-sonnet-4-5";
  let parsed;
  try {
    const apiResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 2500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserPrompt(answers) }],
      }),
    });
    if (!apiResp.ok) {
      console.error("Anthropic error", apiResp.status, await apiResp.text());
      return json({ ok: false, error: "Diagnosis failed. Try again." }, 502);
    }
    const data = await apiResp.json();
    const raw = Array.isArray(data.content)
      ? data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n")
      : "";
    parsed = parseResult(raw);
  } catch (err) {
    console.error("Anthropic network error", err);
    return json({ ok: false, error: "Diagnosis failed. Try again." }, 502);
  }

  if (!parsed || !parsed.diagnostic) {
    return json({ ok: false, error: "Diagnosis failed. Try again." }, 502);
  }

  // --- Beehiiv subscribe (soft-fail, skip placeholder) ---
  const isPlaceholder = email === "pending@elevateaisystem.com";
  if (env.BEEHIIV_API_KEY && !isPlaceholder) {
    try {
      await fetch(
        `https://api.beehiiv.com/v2/publications/${env.BEEHIIV_PUB_ID || DEFAULT_PUB_ID}/subscriptions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.BEEHIIV_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            reactivate_existing: true,
            send_welcome_email: false,
            utm_source: "lead_magnet_diagnostic",
            utm_medium: "elevateaisystem",
            utm_campaign: "lead_magnet_quiz",
            referring_site: "elevateaisystem.com/lead-magnet-diagnostic",
            custom_fields: [{ name: "Source", value: "lead_magnet_diagnostic" }],
          }),
        },
      );
    } catch (err) {
      console.error("Beehiiv error (non-fatal)", err);
    }
  }

  // --- Supabase: store diagnostic results (soft-fail, skip placeholder) ---
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY && !isPlaceholder) {
    try {
      await fetch(`${env.SUPABASE_URL}/rest/v1/cp_lead_magnet_diagnostics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          email,
          overall_score: parsed.diagnostic.overall_score,
          verdict: parsed.diagnostic.verdict,
          diagnostic_json: parsed.diagnostic,
          source: "lead_magnet_diagnostic",
        }),
      });
    } catch (err) {
      console.error("Supabase write error (non-fatal)", err);
    }
  }

  // --- Resend: send follow-up email with Playbook link (soft-fail, skip placeholder) ---
  if (env.RESEND_API_KEY && !isPlaceholder) {
    try {
      const d = parsed.diagnostic;
      const verdictColor = d.verdict === "Critical" ? "#C1282B"
        : d.verdict === "Fragile" ? "#F59E0B"
        : d.verdict === "Functional" ? "#F59E0B"
        : "#00CC34";
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Sunny from ElevateAI <sunny@elevateaisystem.com>",
          to: [email],
          subject: `Your Lead Magnet Score: ${d.overall_score}/100 (${d.verdict})`,
          html: buildFollowUpEmail(d),
        }),
      });
    } catch (err) {
      console.error("Resend error (non-fatal)", err);
    }
  }

  return json({ ok: true, diagnostic: parsed.diagnostic });
}

function buildFollowUpEmail(d) {
  const dims = (d.dimensions || []).map((dim) => {
    const barColor = dim.status === "Broken" ? "#C1282B"
      : dim.status === "Weak" ? "#F59E0B"
      : dim.status === "Decent" ? "#F59E0B"
      : "#00CC34";
    return `<tr>
      <td style="padding:8px 0;font-weight:700;color:#1A1A2E;width:90px">${dim.name}</td>
      <td style="padding:8px 0">
        <div style="background:#E5E7EB;border-radius:99px;height:8px;width:100%">
          <div style="background:${barColor};border-radius:99px;height:8px;width:${(dim.score/20)*100}%"></div>
        </div>
      </td>
      <td style="padding:8px 0;text-align:right;font-weight:700;color:${barColor};width:50px">${dim.score}/20</td>
    </tr>`;
  }).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#FAFAF8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:40px 20px">

<div style="text-align:center;margin-bottom:32px">
  <div style="font-weight:800;font-size:18px;color:#0A0F1C;letter-spacing:-.02em">Elevate<span style="color:#00CC34">AI</span></div>
</div>

<div style="background:#fff;border-radius:16px;padding:36px 28px;border:1px solid #E0E0D8">
  <h1 style="font-size:22px;font-weight:800;color:#0A0F1C;margin:0 0 6px;line-height:1.2">Your Lead Magnet Score</h1>
  <p style="color:#5A5A6E;font-size:14px;margin:0 0 24px">${d.headline || ""}</p>

  <div style="text-align:center;margin:0 0 28px">
    <div style="display:inline-block;font-size:56px;font-weight:800;color:#0A0F1C;line-height:1">${d.overall_score}</div>
    <div style="font-size:14px;color:#5A5A6E;margin-top:2px">/100 &middot; <strong>${d.verdict}</strong></div>
  </div>

  <table style="width:100%;border-collapse:collapse;font-size:13px">
    ${dims}
  </table>

  <div style="margin-top:28px;padding:20px;background:rgba(0,204,52,.06);border-radius:12px;border:1px solid rgba(0,204,52,.15)">
    <div style="font-weight:800;font-size:13px;color:#0A0F1C;margin-bottom:6px">Your Quick Win</div>
    <p style="margin:0;font-size:13px;color:#1A1A2E;line-height:1.5">${d.quick_win || ""}</p>
  </div>
</div>

<div style="margin-top:24px;background:#fff;border-radius:16px;padding:28px;border:1px solid #E0E0D8;text-align:center">
  <h2 style="font-size:17px;font-weight:800;color:#0A0F1C;margin:0 0 8px">The Lead Magnet Playbook</h2>
  <p style="font-size:13px;color:#5A5A6E;margin:0 0 18px;line-height:1.5">The full breakdown: what converts in 2026, hook formulas, gating strategies, and the psychology behind 40%+ conversion rates.</p>
  <a href="https://elevateaisystem.com/lead-magnet-playbook" style="display:inline-block;background:#00CC34;color:#0A0F1C;padding:12px 28px;border-radius:99px;font-weight:700;font-size:14px;text-decoration:none">Read the Playbook &rarr;</a>
</div>

<div style="margin-top:24px;background:#0A0F1C;border-radius:16px;padding:28px;text-align:center">
  <h2 style="font-size:17px;font-weight:800;color:#fff;margin:0 0 8px">Want us to fix it for you?</h2>
  <p style="font-size:13px;color:rgba(255,255,255,.55);margin:0 0 18px;line-height:1.5">Book a free strategy call. We'll rebuild your lead magnet into something that converts.</p>
  <a href="https://cal.com/sunny-binjola/ai-strategy-call" style="display:inline-block;background:#00CC34;color:#0A0F1C;padding:12px 28px;border-radius:99px;font-weight:700;font-size:14px;text-decoration:none">Book Your Free Call &rarr;</a>
</div>

<div style="margin-top:32px;text-align:center;font-size:12px;color:#8A8A9A;line-height:1.5">
  <p>ElevateAI System &middot; <a href="https://elevateaisystem.com" style="color:#00CC34;text-decoration:none">elevateaisystem.com</a></p>
</div>

</div></body></html>`;
}

function parseResult(raw) {
  if (typeof raw !== "string") return null;
  let text = raw;
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    text = fenced[1].trim();
  } else {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) text = raw.slice(start, end + 1);
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function buildUserPrompt(answers) {
  return `A coach answered these questions about their current lead magnet strategy. Diagnose what's working, what's broken, and give them a clear path forward.

THEIR ANSWERS:

${answers.map((x, i) => `--- Q${i + 1} ---\n${x.q}\n\n--- A${i + 1} ---\n${x.a}`).join("\n\n")}

Output the JSON now.`;
}

const SYSTEM_PROMPT = `You are a lead magnet strategist for coaches. You analyze a coach's answers about their current lead magnet setup and produce a scored diagnostic with specific, actionable recommendations.

You have deep knowledge of 2026 lead magnet conversion data:
- AI-adaptive quizzes convert at 47.3%
- Interactive quizzes at 40.1%
- Assessments/scorecards at 30-50%
- Templates at 20-35%
- Static PDFs at 3-10% (60-70% never opened)
- Newsletter signups at 1-3%
- Personalized CTAs convert 202% better than generic
- Single-field forms: 23.4% conversion (3x four-field forms)
- Social proof on landing page: +17% conversion minimum
- Video testimonials: +80% vs text
- Identity hooks outperform benefit hooks for coaching niches
- The best lead magnets combine identity + specificity in their hooks
- Gate the transformation, not the information
- 80% of conversions happen after the 5th touchpoint

OUTPUT JSON SCHEMA (use these exact keys):
{
  "diagnostic": {
    "overall_score": number,        // 0-100, be honest and calibrated
    "verdict": string,              // One of: "Critical", "Fragile", "Functional", "Strong", "Elite"
    "headline": string,             // One punchy sentence summarizing their situation (e.g., "You have a great offer hidden behind a dead format.")
    "dimensions": [
      {
        "name": string,             // "Format", "Hook", "Gating", "Follow-Up", or "Bridge"
        "score": number,            // 0-20 each
        "status": string,           // "Broken", "Weak", "Decent", "Strong"
        "finding": string,          // 1-2 sentence diagnosis specific to their answer
        "fix": string               // One specific, actionable fix they can do this week
      }
    ],
    "biggest_leak": string,         // Which dimension is losing them the most leads (name)
    "quick_win": string,            // The single highest-impact change they can make today (2-3 sentences, specific)
    "recommended_format": string,   // What format their lead magnet should be based on their situation
    "recommended_hook": string      // A rewritten hook for their lead magnet based on their answers
  }
}

SCORING GUIDE:
- Format (0-20): PDF/ebook = 2-4, checklist = 6-8, template = 8-12, webinar = 10-14, quiz/assessment = 14-18, AI-powered tool = 16-20, none = 0
- Hook (0-20): No hook/generic = 0-4, benefit-only = 6-10, identity-only = 8-12, loss-aversion = 10-14, combined identity+specificity = 16-20
- Gating (0-20): Too much info asked = 2-6, email+name = 8-12, email only = 14-16, smart gating (diagnosis free, prescription gated) = 18-20, no gate = 4-8
- Follow-Up (0-20): Nothing = 0-2, single email = 4-8, basic sequence = 10-14, personalized sequence based on answers = 16-20
- Bridge (0-20): No connection to paid = 0-4, loose connection = 6-10, clear next step = 12-16, lead magnet IS the sales conversation = 18-20

Verdict thresholds: 0-25 Critical, 26-45 Fragile, 46-65 Functional, 66-80 Strong, 81-100 Elite

RULES:
- Output the JSON inside a single \`\`\`json fenced code block. Nothing else.
- Be brutally honest. Most coaches score 20-45. Don't inflate.
- The recommended_hook must be specific to THEIR niche/offer, not generic.
- The quick_win must be something they can literally do today, not vague advice.
- If they don't have a lead magnet at all, score Format as 0 and make the headline reflect that.`;
