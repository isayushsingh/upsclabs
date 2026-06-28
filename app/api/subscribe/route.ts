import { NextResponse } from "next/server";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: Request) {
  let email = "";
  let message = "";
  try {
    const body = await req.json();
    email = body.email ?? "";
    message = body.message ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!email || !EMAIL.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  const key = process.env.NEWSLETTER_API_KEY;

  // No provider configured yet → accept so the form works in dev.
  // Add NEWSLETTER_API_KEY in Vercel → Settings → Environment Variables to go live.
  if (!key) {
    console.log("[subscribe] no provider configured:", email, message ? `· request: ${message}` : "");
    return NextResponse.json({ message: "Saved." });
  }

  // Example provider call (Buttondown). The optional `message` (tool request)
  // is attached as subscriber metadata — adjust for MailerLite / Web3Forms.
  try {
    const res = await fetch("https://api.buttondown.email/v1/subscribers", {
      method: "POST",
      headers: { Authorization: `Token ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email_address: email, notes: message || undefined }),
    });
    if (!res.ok && res.status !== 201) {
      return NextResponse.json({ error: "Could not subscribe right now." }, { status: 502 });
    }
    return NextResponse.json({ message: "Saved." });
  } catch {
    return NextResponse.json({ error: "Could not subscribe right now." }, { status: 502 });
  }
}
