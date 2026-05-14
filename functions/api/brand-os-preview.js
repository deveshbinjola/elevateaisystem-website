// Cloudflare Pages Function — Brand OS preview pushback.
// Path: /api/brand-os-preview (POST)
//
// The free 3-question taste of Brand OS that lives on the marketing
// sales page. Visitor answers one question, the model decides whether
// to push back or affirm, returns a short response.
//
// Required env var:
//   ANTHROPIC_API_KEY = sk-ant-…
// Optional:
//   PREVIEW_MODEL     = claude-haiku-4-5 (default — Haiku is cheap + fast)
//
// Rate-limit knob: client-side localStorage flag caps to 1 preview per
// browser per 24h. This isn't security — just enough friction to deter
// abuse. Real abuse would hit the Anthropic spend cap before it matters.

const DEFAULT_MODEL = 'claude-haiku-4-5';
const MAX_ANSWER_CHARS = 1500;

const PROMPTS = {
  positioning: {
    question: "In one sentence, who do you work with and what do you do for them?",
    hint: "Think about a real client. Be specific. Names, numbers, actual situations.",
    system: `You are the Brand OS Agent, the free taste of the full product on the marketing site.

The visitor just answered a positioning question. Your job is to either:
1. PUSH BACK if the answer reads generic (template-y, vague, every-other-coach language), OR
2. AFFIRM if the answer is specific, embodied, and real

GENERIC RED FLAGS (push back if 2+ present):
- "I help [type] go from [pain] to [outcome] in [time]" — the standard coach-landing-page template
- "transformation", "unlock", "limitless", "level up", "thrive", "fulfillment"
- Vague pronouns: "people who", "those who", "anyone who"
- Abstract outcomes: "success", "freedom", "confidence", "their best self"
- No specific person, revenue band, or context

SPECIFIC GREEN FLAGS (affirm if these show):
- A named persona type with concrete revenue or career stage
- A specific problem, not an abstract pain
- Their own vocabulary, not coaching jargon
- Body / situation specifics
- Honest "I don't fully know yet" energy is also good — better than fake confidence

OUTPUT FORMAT: Return STRICT JSON only, no prose around it:
{
  "verdict": "push_back" | "affirm",
  "headline": "string — 1 punchy line capturing what you noticed",
  "body": "string — 2–4 sentences. Specific. Quote their words back when relevant. No coaching jargon yourself.",
  "next_prompt": "string — one specific question or rewrite suggestion. If you pushed back, this is what they should try instead. If you affirmed, this is what to sharpen next.",
  "what_brand_os_would_do": "string — 1 sentence. What the full Brand OS would do with this answer in the next 90 minutes (e.g. 'pull this thread through all 6 modules and turn it into your signature line + 45 days of content angles')."
}

QUALITY BAR:
- Be honest, not mean. Specific, not vague.
- NO em dashes. Use commas, periods, or semicolons.
- Never use these words yourself: "transformation", "unlock", "elevate", "level up", "thrive"
- Write at a 9th-grade reading level. Coaches scan, they don't read.`,
  },
};

export async function onRequestPost({ request, env }) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (!env.ANTHROPIC_API_KEY) {
    return jsonError(503, 'Preview unavailable — ANTHROPIC_API_KEY not set on the site.', corsHeaders);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Body must be JSON.', corsHeaders);
  }

  const promptKey = typeof body.prompt === 'string' ? body.prompt : 'positioning';
  const config = PROMPTS[promptKey] ?? PROMPTS.positioning;

  const answer = typeof body.answer === 'string' ? body.answer.trim() : '';
  if (!answer) return jsonError(400, 'Answer is required.', corsHeaders);
  if (answer.length < 8) return jsonError(400, 'Answer is too short for the AI to read.', corsHeaders);
  const safeAnswer = answer.slice(0, MAX_ANSWER_CHARS);

  const model = env.PREVIEW_MODEL || DEFAULT_MODEL;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        system: config.system,
        messages: [
          { role: 'user', content: `QUESTION: ${config.question}\n\nANSWER: ${safeAnswer}` },
        ],
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      console.error('Anthropic error', resp.status, detail.slice(0, 300));
      return jsonError(502, 'Could not reach the Brand OS Agent right now. Try again in a minute.', corsHeaders);
    }

    const data = await resp.json();
    const raw = (data?.content?.[0]?.text ?? '').trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return jsonError(502, 'Got a response but could not parse it. Try once more.', corsHeaders);
    }

    let parsed;
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return jsonError(502, 'AI returned unexpected format. Try again.', corsHeaders);
    }

    return new Response(JSON.stringify({
      verdict: parsed.verdict === 'affirm' ? 'affirm' : 'push_back',
      headline: String(parsed.headline ?? '').slice(0, 200),
      body: String(parsed.body ?? '').slice(0, 1200),
      next_prompt: String(parsed.next_prompt ?? '').slice(0, 600),
      what_brand_os_would_do: String(parsed.what_brand_os_would_do ?? '').slice(0, 400),
    }), { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('Preview server error', err);
    return jsonError(500, 'Server hiccup. Try again.', corsHeaders);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function onRequestGet({ env }) {
  return new Response(JSON.stringify({
    status: 'ok',
    endpoint: '/api/brand-os-preview',
    has_anthropic_key: Boolean(env.ANTHROPIC_API_KEY),
    model: env.PREVIEW_MODEL || DEFAULT_MODEL,
    available_prompts: Object.keys(PROMPTS),
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function jsonError(status, message, headers) {
  return new Response(JSON.stringify({ error: message }), { status, headers });
}
