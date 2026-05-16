// Cloudflare Pages Function — quiz email capture.
// Path: /api/quiz-subscribe  (POST)
//
// Receives { email, archetype, score_breakdown } from the resonance quiz,
// subscribes the email to Beehiiv with the archetype as a custom field
// + tag, and returns { ok: true } so the frontend can reveal the result.
//
// Required env vars (set in Cloudflare Pages → Settings → Environment variables):
//   BEEHIIV_API_KEY  = your Beehiiv API key
//   BEEHIIV_PUB_ID   = f390a157-1409-46d7-8d9e-1eff7e3a4d64 (the Signal pub)

const ARCHETYPES = ["frame_setter", "mirror", "catalyst", "builder"];

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
  // Env check
  const apiKey = env.BEEHIIV_API_KEY;
  const pubId = env.BEEHIIV_PUB_ID || "f390a157-1409-46d7-8d9e-1eff7e3a4d64";
  if (!apiKey) {
    return json({ ok: false, error: "BEEHIIV_API_KEY not configured" }, 503);
  }

  // Parse body
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }
  const email = String(body?.email ?? "").trim().toLowerCase();
  const archetype = String(body?.archetype ?? "").toLowerCase();

  // Validate
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: "Valid email required" }, 400);
  }
  if (!ARCHETYPES.includes(archetype)) {
    return json({ ok: false, error: "Unknown archetype" }, 400);
  }

  // Subscribe via Beehiiv
  // Docs: https://developers.beehiiv.com/docs/v2/47ab137c2f30a-create-a-subscription
  try {
    const res = await fetch(
      `https://api.beehiiv.com/v2/publications/${pubId}/subscriptions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          reactivate_existing: true,
          send_welcome_email: false,  // we'll handle the welcome via Beehiiv's automation
          utm_source: "resonance_quiz",
          utm_medium: "elevateaisystem",
          utm_campaign: "voice_archetype",
          referring_site: "elevateaisystem.com/quiz",
          custom_fields: [
            { name: "Archetype", value: archetype },
          ],
        }),
      }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Soft-success on duplicate — Beehiiv returns 409 / specific error.
      // We still let the user see their result; we just log the error.
      console.error("[quiz-subscribe] Beehiiv error:", res.status, data);
      return json(
        {
          ok: true,
          subscribed: false,
          note: data?.errors?.[0]?.message ?? `Beehiiv ${res.status}`,
        },
        200
      );
    }

    return json({ ok: true, subscribed: true, archetype });
  } catch (err) {
    console.error("[quiz-subscribe] network error:", err);
    // Don't break the quiz UX — still return ok so the user sees their result.
    return json(
      { ok: true, subscribed: false, note: "Network error, result still shown." },
      200
    );
  }
}
