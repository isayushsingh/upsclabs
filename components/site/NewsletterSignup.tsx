"use client";

import { useState } from "react";

type State = "idle" | "loading" | "ok" | "error";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [idea, setIdea] = useState("");
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
        body: JSON.stringify({ email, message: idea }),
      });
      const data = await res.json();
      if (res.ok) {
        setState("ok");
        setMsg(
          idea.trim()
            ? "Got it — noted your request. We'll be in touch."
            : "You're on the list."
        );
        setEmail("");
        setIdea("");
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
        <div className="ul-eyebrow">Newsletter · Requests</div>
        <h2 className="ul-news-title">Want a tool that doesn&apos;t exist yet?</h2>
        <p className="ul-news-sub">
          Tell us what&apos;s painful to revise and we&apos;ll put it on the bench. Or just leave
          your email — one ping each time a new tile turns live. No spam, promise.
        </p>
      </div>
      <div className="ul-news-form">
        <input
          className="ul-news-idea"
          type="text"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="What should we build next? (optional)"
          aria-label="Tool request"
          disabled={state === "loading"}
        />
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
            {state === "loading" ? "…" : idea.trim() ? "Send" : "Subscribe"}
          </button>
        </div>
        {msg && <p className={`ul-news-msg ${state}`}>{msg}</p>}
      </div>
    </div>
  );
}
