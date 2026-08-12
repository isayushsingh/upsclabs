"use client";

import { useRef, useState } from "react";

type State = "idle" | "loading" | "ok" | "error";

const MAX_LEN = 800;

export default function SuggestionForm() {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — real visitors never see or fill this
  const [state, setState] = useState<State>("idle");
  const [msg, setMsg] = useState("");
  // Belt-and-braces alongside the server's own rate limit: once a submit is
  // in flight, ignore repeat Enter/click until it resolves.
  const inFlight = useRef(false);

  async function submit() {
    if (inFlight.current) return;
    if (!message.trim()) {
      setState("error");
      setMsg("Add a line about what's missing or wrong first.");
      return;
    }
    inFlight.current = true;
    setState("loading");
    setMsg("");
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, email, website }),
      });
      const data = await res.json();
      if (res.ok) {
        setState("ok");
        setMsg("Thanks — sent. Genuinely appreciated.");
        setMessage("");
        setEmail("");
      } else {
        setState("error");
        setMsg(data.error || "Something went wrong.");
      }
    } catch {
      setState("error");
      setMsg("Network error — please try again.");
    } finally {
      inFlight.current = false;
    }
  }

  return (
    <div className="mit-suggest" id="suggest">
      <div className="mit-suggest-head">
        <span className="mit-suggest-eyebrow">Spot something off?</span>
        <p className="mit-suggest-sub">
          A missing event, a wrong year, a citation that doesn&apos;t hold up — tell us and
          we&apos;ll review it. Every event on this timeline is added by hand, so this is how it
          gets better.
        </p>
      </div>
      <div className="mit-suggest-form">
        <textarea
          className="mit-suggest-textarea"
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX_LEN))}
          placeholder={`e.g. "1866 — Dadabhai Naoroji founded the East India Association in London, this is missing"`}
          aria-label="Suggestion"
          maxLength={MAX_LEN}
          rows={3}
          disabled={state === "loading"}
        />
        {/* Honeypot: off-screen, unlabelled, tabIndex -1, autoComplete off —
            invisible and unreachable for a real visitor filling the form
            normally, but a generic form-filling bot often populates every
            field it can find in the DOM regardless. */}
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="mit-suggest-hp"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        <div className="mit-suggest-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email, if you'd like a reply (optional)"
            aria-label="Email address (optional)"
            disabled={state === "loading"}
          />
          <button onClick={submit} disabled={state === "loading"}>
            {state === "loading" ? "…" : "Send"}
          </button>
        </div>
        {msg && <p className={`mit-suggest-msg ${state}`}>{msg}</p>}
      </div>
    </div>
  );
}
