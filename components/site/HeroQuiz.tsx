"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { HERO_QUESTIONS, type HeroQuestion } from "@/lib/heroQuiz";
import { track } from "@/lib/analytics";
import { VISITED_TOOLS_KEY } from "./VisitTracker";
import "./HeroQuiz.css";

const RECENT_KEY = "ul-hero-quiz-recent";
const RECENT_MAX = 10;

function readList(key: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function remember(id: string) {
  try {
    const next = [id, ...readList(RECENT_KEY).filter((x) => x !== id)].slice(0, RECENT_MAX);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable; repeats are possible, nothing breaks
  }
}

const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * Narrows the bank step by step and stops at the last non-empty pool:
 * not the current question → not seen recently → from a tool the visitor
 * hasn't opened → tough (only when they asked for "a harder one").
 */
function pickQuestion(currentId: string | null, harder: boolean): HeroQuestion {
  const recent = new Set(readList(RECENT_KEY));
  const visited = new Set(readList(VISITED_TOOLS_KEY));
  const filters: ((q: HeroQuestion) => boolean)[] = [
    (q) => q.id !== currentId,
    (q) => !recent.has(q.id),
    (q) => !visited.has(q.toolId),
  ];
  if (harder) filters.push((q) => q.difficulty === "tough");

  let pool = HERO_QUESTIONS;
  for (const f of filters) {
    const next = pool.filter(f);
    if (next.length) pool = next;
  }
  return pickRandom(pool);
}

const LETTERS = ["A", "B", "C", "D"];

function Tick() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Cross() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

type ReportState = "idle" | "sending" | "sent" | "failed";

export default function HeroQuiz() {
  // null until mounted: the server renders a skeleton so the random pick
  // never causes a hydration mismatch.
  const [q, setQ] = useState<HeroQuestion | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [report, setReport] = useState<ReportState>("idle");
  const questionRef = useRef<HTMLHeadingElement>(null);
  const focusOnNext = useRef(false);

  const load = (harder: boolean) => {
    const next = pickQuestion(q?.id ?? null, harder);
    setQ(next);
    setPicked(null);
    setReport("idle");
    track("quiz_view", { questionId: next.id, toolId: next.toolId });
  };

  useEffect(() => {
    // First pick only; later picks come from the buttons.
    load(false);
  }, []);

  // After "Try another", move focus to the new question so keyboard and
  // screen-reader users land on it instead of a button that's gone.
  useEffect(() => {
    if (q && picked === null && focusOnNext.current) {
      focusOnNext.current = false;
      questionRef.current?.focus();
    }
  }, [q, picked]);

  if (!q) {
    return (
      <div className="hq-card" aria-busy="true" aria-label="Loading a question">
        <div className="hq-head">
          <span className="hq-live">Live · loading</span>
        </div>
        <div className="hq-skel hq-skel-q" />
        <div className="hq-options">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="hq-skel hq-skel-opt" />
          ))}
        </div>
      </div>
    );
  }

  const answered = picked !== null;
  const correct = answered && picked === q.answerIndex;
  const answerText = q.options[q.answerIndex];

  const choose = (i: number) => {
    if (answered) return;
    setPicked(i);
    remember(q.id);
    track("quiz_answer", { questionId: q.id, toolId: q.toolId, correct: i === q.answerIndex });
  };

  const next = (harder: boolean) => {
    focusOnNext.current = true;
    load(harder);
  };

  const sendReport = async () => {
    setReport("sending");
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Hero quiz report: ${q.id}\nQ: ${q.question}\nMarked answer: ${answerText}\nSource: ${q.source}`,
        }),
      });
      setReport(res.ok ? "sent" : "failed");
    } catch {
      setReport("failed");
    }
  };

  return (
    <div className={`hq-card${answered ? (correct ? " is-correct" : " is-wrong") : ""}`}>
      <div className="hq-head">
        <span className="hq-live">Live · {q.toolName}</span>
        <span className="hq-tag">
          {q.paper} · {q.subject}
        </span>
      </div>

      <h2 className="hq-question" ref={questionRef} tabIndex={-1} id="hq-question">
        {q.question}
      </h2>

      <div className={`hq-options${q.options.length > 2 && q.options.some((o) => o.length > 34) ? " is-long" : ""}`} role="group" aria-labelledby="hq-question">
        {q.options.map((opt, i) => {
          const isAnswer = i === q.answerIndex;
          const isPicked = i === picked;
          const state = !answered ? "" : isAnswer ? " is-answer" : isPicked ? " is-picked-wrong" : " is-dim";
          return (
            <button
              key={opt}
              type="button"
              className={`hq-option${state}`}
              onClick={() => choose(i)}
              aria-disabled={answered}
            >
              <span className="hq-letter" aria-hidden="true">
                {answered && isAnswer ? <Tick /> : answered && isPicked ? <Cross /> : LETTERS[i]}
              </span>
              <span className="hq-option-text">{opt}</span>
              {answered && isAnswer && <span className="hq-sr"> (correct answer)</span>}
              {answered && isPicked && !isAnswer && <span className="hq-sr"> (your answer)</span>}
            </button>
          );
        })}
      </div>

      <div className="hq-live-region" aria-live="polite">
        {answered && (
          <div className={`hq-feedback ${correct ? "is-correct" : "is-wrong"}`}>
            <p className="hq-verdict">
              <span className="hq-verdict-icon" aria-hidden="true">
                {correct ? <Tick /> : <Cross />}
              </span>
              {correct ? "Good job." : `Not quite. It's ${answerText}.`}
            </p>
            <p className="hq-explain">{q.explanation}</p>
            {!correct && (
              <p className="hq-pressure">
                {q.pressureLine ?? `This one shows up in prelims. ${q.toolName} makes it stick in 2 minutes.`}
              </p>
            )}
            <div className="hq-actions">
              <Link
                href={q.toolHref}
                className="ul-hero-cta ul-hero-cta-primary hq-cta"
                onClick={() => track("quiz_cta_click", { questionId: q.id, toolId: q.toolId, correct })}
              >
                {correct ? `Go deeper in ${q.toolName}` : `Learn it in ${q.toolName}`} <span aria-hidden="true">→</span>
              </Link>
              <button type="button" className="hq-secondary" onClick={() => next(correct)}>
                {correct ? "Try a harder one" : "Try another"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="hq-foot">
        {!answered && (
          <button type="button" className="hq-skip" onClick={() => next(false)}>
            Skip this one
          </button>
        )}
        <button
          type="button"
          className="hq-report"
          onClick={sendReport}
          disabled={report === "sending" || report === "sent"}
        >
          {report === "sent"
            ? "Thanks, we'll check it."
            : report === "failed"
              ? "Couldn't send. Try again?"
              : report === "sending"
                ? "Sending…"
                : "Report this question"}
        </button>
      </div>
    </div>
  );
}
