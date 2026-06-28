"use client";

import { useState } from "react";

type State = "idle" | "loading" | "ok" | "error";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [msg, setMsg] = useState("");

  async function submit() {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setState("error");
      setMsg("Please enter a valid email.");
      return;
    }
    setState("loading");
    setMsg("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setState("ok");
        setMsg(data.message || "You're on the list.");
        setEmail("");
      } else {
        setState("error");
        setMsg(data.error || "Something went wrong.");
      }
    } catch {
      setState("error");
      setMsg("Network error — please try again.");
    }
  }

  return (
    <div className="ul-news" id="newsletter">
      <div className="ul-news-text">
        <div className="ul-eyebrow">Newsletter</div>
        <h2 className="ul-news-title">New tools, in your inbox</h2>
        <p className="ul-news-sub">
          Occasional updates when a new tool ships. Coming Soon.
        </p>
      </div>
      <div className="ul-news-form">
        <div className="ul-news-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="you@example.com"
            aria-label="Email address"
            disabled={state === "loading"}
          />
          <button onClick={submit} disabled={state === "loading"}>
            {state === "loading" ? "…" : "Subscribe"}
          </button>
        </div>
        {msg && <p className={`ul-news-msg ${state}`}>{msg}</p>}
      </div>
    </div>
  );
}
