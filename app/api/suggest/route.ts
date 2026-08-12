import { NextResponse } from "next/server";

// Suggestions for the Modern India Timeline's data (missing/incorrect
// events) — deliberately email-only, no database. The text here is never
// stored and never rendered back into any page (not even an admin view),
// which is what actually closes off stored-XSS/injection risk: there's no
// "later render" step for a payload to exploit. It just becomes an email
// you read like any other, in Resend's structured JSON fields (not raw
// SMTP string concatenation), which is what keeps a crafted "message" from
// being able to inject its own headers/recipients.

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MAX_MESSAGE_LEN = 800;
const MAX_EMAIL_LEN = 200;

// Best-effort per-IP throttle. This resets whenever the serverless instance
// recycles and doesn't coordinate across instances/regions — it is not a
// real rate limiter. It doesn't need to be: expected volume here is a
// handful of submissions total, and this only exists to blunt a bot
// hammering the endpoint in a single burst, not to hold a determined
// attacker. Not worth standing up Redis/Vercel KV for ~10 emails.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  // Keep the map from growing unbounded over the instance's lifetime.
  if (hits.size > 500) {
    for (const [key, times] of hits) {
      if (!times.some((t) => now - t < WINDOW_MS)) hits.delete(key);
    }
  }
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(req: Request) {
  let message = "";
  let email = "";
  let honeypot = "";

  try {
    const body = await req.json();
    message = typeof body.message === "string" ? body.message.trim() : "";
    email = typeof body.email === "string" ? body.email.trim() : "";
    // Hidden field a real visitor never sees or fills — a filled honeypot
    // means a bot filled every field it could find. Reject, but with the
    // same "Saved" response a real submission gets, so a bot scanning
    // responses can't distinguish "caught" from "accepted" and adjust.
    honeypot = typeof body.website === "string" ? body.website.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (honeypot) {
    return NextResponse.json({ message: "Saved." });
  }

  if (!message) {
    return NextResponse.json({ error: "Please describe what's missing or incorrect." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LEN) {
    return NextResponse.json({ error: `Keep it under ${MAX_MESSAGE_LEN} characters.` }, { status: 400 });
  }
  if (email && (email.length > MAX_EMAIL_LEN || !EMAIL.test(email))) {
    return NextResponse.json({ error: "That email doesn't look valid." }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many submissions — try again later." }, { status: 429 });
  }

  const key = process.env.RESEND_API_KEY;
  const to = process.env.SUGGESTION_TO_EMAIL;

  // No provider configured yet → accept so the form works in dev, and so
  // the feature can ship before email is wired up. Set RESEND_API_KEY and
  // SUGGESTION_TO_EMAIL in Vercel → Settings → Environment Variables to
  // actually start receiving these.
  if (!key || !to) {
    console.log("[suggest] no provider configured:", { message, email, ip });
    return NextResponse.json({ message: "Saved." });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        // onboarding@resend.dev works out of the box, with no domain to
        // verify, as long as `to` is the same address that owns the Resend
        // account — exactly the case here (you, receiving your own site's
        // suggestions). Swap once/if a verified sending domain exists.
        from: "UPSC Labs <onboarding@resend.dev>",
        to: [to],
        reply_to: email || undefined,
        subject: "Modern India Timeline — suggestion",
        text: [
          `Message:\n${message}`,
          email ? `\nFrom: ${email}` : "\n(no reply email given)",
          `\nSubmitted: ${new Date().toISOString()}`,
        ].join("\n"),
      }),
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Could not send right now." }, { status: 502 });
    }
    return NextResponse.json({ message: "Saved." });
  } catch {
    return NextResponse.json({ error: "Could not send right now." }, { status: 502 });
  }
}
