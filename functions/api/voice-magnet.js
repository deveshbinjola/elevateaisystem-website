// Cloudflare Pages Function — Find Your Voice lead magnet.
// Path: /api/voice-magnet  (POST)
//
// Body: { email: string, answers: [{ q: string, a: string }, ...] }
// On success: subscribes email to Beehiiv, writes a pending voice profile to
// Supabase, and returns { ok: true, voice_json, sample_posts }.
//
// Env vars (Cloudflare Pages → Settings → Environment variables):
//   ANTHROPIC_API_KEY          (already set)
//   AGENT_MODEL                (optional, default claude-sonnet-4-5)
//   BEEHIIV_API_KEY            (already set)
//   BEEHIIV_PUB_ID             (already set; default below)
//   SUPABASE_URL               (NEW — add)
//   SUPABASE_SERVICE_ROLE_KEY  (NEW — add)

const MIN_ANSWERS = 3;       // need >=3 substantive answers to extract a voice
const MIN_ANSWER_CHARS = 10; // an answer counts as substantive at >=10 chars
const MAX_ANSWER_CHARS = 1500;
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

export async function onRequestGet({ env }) {
  return json({
    status: "ok",
    endpoint: "/api/voice-magnet",
    hasAnthropicKey: Boolean(env.ANTHROPIC_API_KEY),
    hasSupabase: Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
  });
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
    return json({ ok: false, error: `Need at least ${MIN_ANSWERS} substantive answers.` }, 400);
  }

  // --- Anthropic: one call returns voice_json + 3 sample posts ---
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
      return json({ ok: false, error: "Generation failed. Try again." }, 502);
    }
    const data = await apiResp.json();
    const raw = Array.isArray(data.content)
      ? data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n")
      : "";
    parsed = parseResult(raw);
  } catch (err) {
    console.error("Anthropic network error", err);
    return json({ ok: false, error: "Generation failed. Try again." }, 502);
  }

  if (!parsed || !parsed.voice_json || !Array.isArray(parsed.sample_posts)) {
    return json({ ok: false, error: "Generation failed. Try again." }, 502);
  }
  const sample_posts = parsed.sample_posts.slice(0, 3).map((p) => String(p));

  // --- Beehiiv subscribe (soft-fail, skip placeholder emails) ---
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
            utm_source: "voice_magnet",
            utm_medium: "elevateaisystem",
            utm_campaign: "find_your_voice",
            referring_site: "elevateaisystem.com/find-your-voice",
            custom_fields: [{ name: "Source", value: "find_your_voice" }],
          }),
        },
      );
    } catch (err) {
      console.error("Beehiiv error (non-fatal)", err);
    }
  }

  // --- Supabase: write pending profile (soft-fail, skip placeholder) ---
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY && !isPlaceholder) {
    try {
      await fetch(`${env.SUPABASE_URL}/rest/v1/cp_pending_voice_profiles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          email,
          voice_json: parsed.voice_json,
          sample_messages: sample_posts,
          source: "find_your_voice_magnet",
        }),
      });
    } catch (err) {
      console.error("Supabase write error (non-fatal)", err);
    }
  }

  return json({ ok: true, voice_json: parsed.voice_json, sample_posts, archetype: parsed.archetype || null });
}

// Extract the combined JSON ({ voice_json, sample_posts }) from a possibly
// fenced model response. Mirrors voice-mine's extractJson approach.
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
  return `The coach answered these voice-revealing questions in their own words. Treat each answer as a writing sample — this is the coach in their natural voice. Mine the patterns and produce the output JSON.

INTERVIEW:

${answers.map((x, i) => `--- Q${i + 1} ---\n${x.q}\n\n--- A${i + 1} ---\n${x.a}`).join("\n\n")}

Output the JSON now.`;
}

const SYSTEM_PROMPT = `You analyze a coach's answers to voice-revealing interview questions and produce (1) a voice archetype, (2) a structured voice profile, and (3) three sample social posts written in that voice.

Pattern-match across the answers, find what's distinctive, and output JSON matching the schema below. Be specific. Generic descriptors like "friendly" or "professional" are useless — name the actual habits.

OUTPUT JSON SCHEMA (use these exact keys):
{
  "archetype": {
    "name": string,          // One of: "The Challenger", "The Guide", "The Provocateur", "The Sage", "The Alchemist", "The Mirror", "The Architect", "The Healer"
    "tagline": string,       // One punchy sentence that captures this archetype (e.g., "You don't inspire people. You interrupt them.")
    "description": string,   // 2-3 sentences about what makes this voice archetype distinctive
    "superpower": string,    // Their #1 voice strength in 3-5 words
    "blind_spot": string,    // Their likely voice blind spot in one sentence
    "energy": string         // One of: "fire", "earth", "water", "air" — the elemental energy of their communication style
  },
  "voice_json": {
    "tone": [string, ...],                 // 3-5 specific descriptors
    "sentence_rhythm": string,             // one-line description of cadence
    "vocabulary": { "use": [string, ...], "avoid": [string, ...] },
    "openers": [string, ...],              // 3-5 typical opener patterns
    "closers": [string, ...],              // 3-5 typical closer patterns
    "ctas": [string, ...],                 // 2-4 typical calls to action
    "emotional_register": string,
    "do_nots": [string, ...],              // 4-6 specific anti-patterns
    "ig_specific": { "hook_pattern": string, "hashtag_style": string, "post_length": string }
  },
  "sample_posts": [string, string, string] // exactly 3 Instagram-style posts, 60-120 words each, in THIS coach's voice, on themes implied by their answers, obeying do_nots
}

ARCHETYPE SELECTION GUIDE:
- The Challenger: Confrontational, direct, cuts through BS. Uses short punchy sentences. Names hard truths.
- The Guide: Warm authority, walks beside you. Uses "we" and "let's." Balances push with compassion.
- The Provocateur: Contrarian, playful edge, reframes everything. Uses questions as weapons. Makes you think.
- The Sage: Deep, philosophical, draws from traditions. Uses metaphor and story. Speaks in principles.
- The Alchemist: Transforms pain into power. Uses personal experience as proof. Raw and honest.
- The Mirror: Reflects back what clients can't see. Uses "you" language heavily. Observational, precise.
- The Architect: Systems thinker, frameworks, structure. Uses numbered lists and processes. Clear and methodical.
- The Healer: Somatic, embodied, nervous-system aware. Uses body language and sensation words. Gentle but firm.

Choose the archetype that BEST fits the coach's actual voice from their answers, not what sounds most flattering.

RULES:
- Output the JSON inside a single \\\`\\\`\\\`json fenced code block. Nothing else.
- Quote actual phrases from the answers in openers/closers when there's a clear pattern.
- do_nots must be specific (e.g., no "I hope this finds you well"), not vague.
- The 3 sample_posts are the payoff — they must sound unmistakably like this coach, not like generic AI. No hashtags unless the voice calls for them. No emojis unless the coach's answers use them.
- The archetype tagline must be sharp and specific to THIS coach, not a generic description of the archetype.`;
