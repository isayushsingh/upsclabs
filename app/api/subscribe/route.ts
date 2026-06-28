import { NextResponse } from "next/server";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: Request) {
  let email = "";
  try {
    ({ email } = await req.json());
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
    console.log("[subscribe] no provider configured, captured:", email);
    return NextResponse.json({ message: "You're on the list." });
  }

  // Example provider call (Buttondown). Swap the URL/headers/body for
  // MailerLite, Web3Forms, etc. as you prefer.
  try {
    const res = await fetch("https://api.buttondown.email/v1/subscribers", {
      method: "POST",
      headers: { Authorization: `Token ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email_address: email }),
    });
    if (!res.ok && res.status !== 201) {
      return NextResponse.json({ error: "Could not subscribe right now." }, { status: 502 });
    }
    return NextResponse.json({ message: "You're on the list." });
  } catch {
    return NextResponse.json({ error: "Could not subscribe right now." }, { status: 502 });
  }
}
