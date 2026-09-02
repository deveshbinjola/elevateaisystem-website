// Cloudflare Pages Function — operations lead capture.
// Path: /api/ops-subscribe  (POST)
//
// Receives { email, source } from the ops pages (behavioral-health, five-leaks,
// the-ten-second-run) and subscribes the address to Beehiiv tagged as an
// OPERATIONS lead, so this audience can be segmented away from the coach
// newsletter stream. Mirrors functions/api/quiz-subscribe.js deliberately:
// same CORS helpers, same soft-success behaviour on Beehiiv errors.
//
// Required env vars (Cloudflare Pages -> Settings -> Environment variables):
//   BEEHIIV_API_KEY  = Beehiiv API key
//   BEEHIIV_PUB_ID   = f390a157-1409-46d7-8d9e-1eff7e3a4d64 (optional, defaulted)
//
// IMPORTANT: the frontend reveals the checklist regardless of what this
// returns. Capture failing must never withhold something the visitor was
// promised, so `subscribed:false` is a normal, non-blocking outcome.

const SOURCES = ["behavioral-health", "five-leaks", "ten-second-run", "home"];

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
  const apiKey = env.BEEHIIV_API_KEY;
  const pubId = env.BEEHIIV_PUB_ID || "f390a157-1409-46d7-8d9e-1eff7e3a4d64";

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const email = String(body?.email ?? "").trim().toLowerCase();
  let source = String(body?.source ?? "").trim().toLowerCase();
  if (!SOURCES.includes(source)) source = "home";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: "Valid email required" }, 400);
  }

  // Not configured yet. Report it honestly rather than pretending to capture,
  // but keep ok:true so the page still hands over the checklist.
  if (!apiKey) {
    console.error("[ops-subscribe] BEEHIIV_API_KEY not configured");
    return json({ ok: true, subscribed: false, note: "Capture not configured" }, 200);
  }

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
          send_welcome_email: false,
          utm_source: "ops_" + source,
          utm_medium: "elevateaisystem",
          utm_campaign: "leak_checklist",
          referring_site: "elevateaisystem.com/" + source,
          custom_fields: [
            { name: "Segment", value: "Operations" },
            { name: "Source Page", value: source },
          ],
        }),
      }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Duplicates and similar are not user-facing failures.
      console.error("[ops-subscribe] Beehiiv error:", res.status, data);
      return json(
        { ok: true, subscribed: false, note: data?.errors?.[0]?.message ?? `Beehiiv ${res.status}` },
        200
      );
    }

    return json({ ok: true, subscribed: true });
  } catch (err) {
    console.error("[ops-subscribe] network error:", err);
    return json({ ok: true, subscribed: false, note: "Network error" }, 200);
  }
}
