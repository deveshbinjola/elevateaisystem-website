// Cloudflare Pages Function — Lead Magnet Diagnostic Quiz.
// Path: /api/lead-magnet-diagnostic  (POST)
//
// Body: { email: string, answers: [{ q: string, a: string }, ...] }
// On success: subscribes email to Beehiiv, and returns
// { ok: true, diagnostic }.
//
// Uses same env vars as voice-magnet:
//   ANTHROPIC_API_KEY, BEEHIIV_API_KEY, BEEHIIV_PUB_ID

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

  return json({ ok: true, diagnostic: parsed.diagnostic });
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
