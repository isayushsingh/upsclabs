"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EVENTS,
  EVENTS_BY_ID,
  CORE_COUNT,
  STRANDS,
  STRAND_BY_ID,
  ANCHOR_IDS,
  buildLadder,
  eraOfYear,
  sideOf,
  type TimelineEvent,
  type Era,
} from "@/lib/timeline/modernIndia";
import SuggestionForm from "./SuggestionForm";
import "./ModernIndiaTimeline.css";

type Mode = "learn" | "revise";

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** "1862–65" / "1859" — the compact range style the era labels already use. */
function yearRange(from: number, to: number): string {
  if (from === to) return `${from}`;
  const a = String(from);
  const b = String(to);
  return a.slice(0, 2) === b.slice(0, 2) ? `${a}–${b.slice(2)}` : `${a}–${b}`;
}

const chipStyle = (e: TimelineEvent) =>
  ({ "--chip": STRAND_BY_ID[e.strand].color }) as React.CSSProperties;

export default function ModernIndiaTimeline() {
  const [mode, setMode] = useState<Mode>("learn");
  const [activeId, setActiveId] = useState<string | null>(null);
  // Hidden by default: second-tier events (individual newspaper launches,
  // codification housekeeping, minor reform societies) that add noise
  // without adding to the grand narrative. Toggle brings them back.
  const [showContext, setShowContext] = useState(false);

  const visibleEvents = useMemo(
    () => (showContext ? EVENTS : EVENTS.filter((e) => e.tier === "core")),
    [showContext]
  );
  const visibleIds = useMemo(() => new Set(visibleEvents.map((e) => e.id)), [visibleEvents]);
  const ladder = useMemo(() => buildLadder(visibleEvents), [visibleEvents]);

  const ladderRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef(new Map<string, HTMLElement>());

  // ── Revise mode state ── one era at a time: its chips leave the ladder
  // for a shuffled tray in the side panel, and go back by tapping the year
  // rung they belong on. Every other era stays as Learn shows it (dimmed).
  const [reviseEra, setReviseEra] = useState<Era | null>(null);
  const [reviseQueue, setReviseQueue] = useState<string[]>([]);
  const [revisePlaced, setRevisePlaced] = useState<Set<string>>(new Set());
  const [reviseSelected, setReviseSelected] = useState<string | null>(null);
  const [reviseStats, setReviseStats] = useState({ correct: 0, attempts: 0 });
  const [wrongFlashYear, setWrongFlashYear] = useState<number | null>(null);

  const active = mode === "learn" && activeId ? EVENTS_BY_ID[activeId] ?? null : null;
  // Context events linked to a core one were promoted to core (see
  // modernIndia.ts), so this filter only ever drops links across a hidden
  // context→context edge.
  const causedBy = useMemo(
    () => (active?.causedBy ?? []).map((id) => EVENTS_BY_ID[id]).filter((e) => e && visibleIds.has(e.id)),
    [active, visibleIds]
  );
  const leadsTo = useMemo(
    () => (active?.leadsTo ?? []).map((id) => EVENTS_BY_ID[id]).filter((e) => e && visibleIds.has(e.id)),
    [active, visibleIds]
  );
  const sameYear = useMemo(
    () => (active ? visibleEvents.filter((e) => e.year === active.year && e.id !== active.id) : []),
    [active, visibleEvents]
  );
  const causeIds = useMemo(() => new Set(causedBy.map((e) => e.id)), [causedBy]);
  const effectIds = useMemo(() => new Set(leadsTo.map((e) => e.id)), [leadsTo]);

  // Hiding context events can hide the open one — close it rather than
  // leave a detail panel pointing at nothing on the ladder.
  useEffect(() => {
    if (activeId && !visibleIds.has(activeId)) setActiveId(null);
  }, [activeId, visibleIds]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setActiveId(null);
      setReviseSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const scrollToEvent = (id: string) => {
    const el = ladderRef.current?.querySelector<HTMLElement>(`[data-id="${id}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  const jumpTo = (id: string) => {
    setActiveId(id);
    scrollToEvent(id);
  };

  // Deep link: /gs1/modern-india-timeline#e200 opens that milestone
  // (used by the homepage quiz). Context-tier events switch the tier on
  // first so the chip exists to scroll to.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    const e = EVENTS_BY_ID[id];
    if (!e) return;
    if (e.tier !== "core") setShowContext(true);
    setActiveId(id);
    const t = setTimeout(() => scrollToEvent(id), 120);
    return () => clearTimeout(t);
  }, []);
  const scrollToEra = (era: Era) =>
    sectionRefs.current.get(era.id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  // The era whose section has most recently scrolled past the upper part
  // of the viewport — "the one you're reading".
  const eraInView = useCallback((): Era => {
    let current = ladder[0]?.era;
    for (const { era } of ladder) {
      const el = sectionRefs.current.get(era.id);
      if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) current = era;
    }
    return current;
  }, [ladder]);

  const beginRevise = (era: Era) => {
    const ids = visibleEvents.filter((e) => e.year >= era.start && e.year < era.end).map((e) => e.id);
    setReviseEra(era);
    setReviseQueue(shuffled(ids));
    setRevisePlaced(new Set());
    setReviseSelected(null);
    setReviseStats({ correct: 0, attempts: 0 });
  };

  const enterRevise = (era?: Era) => {
    const target = era ?? (active ? eraOfYear(active.year) : eraInView());
    if (!target) return;
    beginRevise(target);
    setMode("revise");
    setActiveId(null);
    scrollToEra(target);
  };
  const exitRevise = () => {
    setMode("learn");
    setReviseEra(null);
  };

  const placeCard = (targetYear: number) => {
    if (!reviseSelected) return;
    const ev = EVENTS_BY_ID[reviseSelected];
    const right = ev.year === targetYear;
    setReviseStats((s) => ({ correct: s.correct + (right ? 1 : 0), attempts: s.attempts + 1 }));
    if (right) {
      setRevisePlaced((prev) => new Set(prev).add(ev.id));
      setReviseQueue((q) => q.filter((id) => id !== ev.id));
    } else {
      setWrongFlashYear(targetYear);
      setTimeout(() => setWrongFlashYear(null), 420);
    }
    setReviseSelected(null);
  };

  const reviseTrayEvents = useMemo(
    () => reviseQueue.map((id) => EVENTS_BY_ID[id]).filter(Boolean),
    [reviseQueue]
  );
  const reviseDone = mode === "revise" && reviseEra != null && reviseQueue.length === 0;
  const nextEra = useMemo(() => {
    if (!reviseEra) return null;
    const i = ladder.findIndex((s) => s.era.id === reviseEra.id);
    return ladder[i + 1]?.era ?? null;
  }, [ladder, reviseEra]);

  const renderChip = (e: TimelineEvent, revising: boolean) => {
    if (revising && !revisePlaced.has(e.id)) return null;
    const cls = [
      "mit-chip",
      ANCHOR_IDS.has(e.id) && "is-anchor",
      e.id === activeId && mode === "learn" && "is-active",
      causeIds.has(e.id) && "is-cause",
      effectIds.has(e.id) && "is-effect",
      revising && "is-placed",
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <button
        key={e.id}
        type="button"
        data-id={e.id}
        className={cls}
        style={chipStyle(e)}
        aria-pressed={mode === "learn" ? e.id === activeId : undefined}
        onClick={mode === "learn" ? () => setActiveId((cur) => (cur === e.id ? null : e.id)) : undefined}
      >
        {e.title}
      </button>
    );
  };

  const renderMini = (e: TimelineEvent, kind?: "cause" | "effect") => (
    <button
      key={e.id}
      type="button"
      className={`mit-mini ${kind ? `is-${kind}` : ""}`}
      style={chipStyle(e)}
      onClick={() => jumpTo(e.id)}
    >
      <span className="mit-mini-title">{e.title}</span>
      <span className="mit-mini-meta">
        {kind ? e.year : sideOf(e) === "british" ? "British state" : "Indian response"}
      </span>
    </button>
  );

  const sheetOpen = !!active || mode === "revise";

  return (
    <div className={`mit-root ${sheetOpen ? "has-sheet" : ""}`}>
      <section className="mit-controls">
        <div className="mit-modebar" role="group" aria-label="Mode">
          <button className={`mit-mode-btn ${mode === "learn" ? "on" : ""}`} onClick={exitRevise}>
            Learn
          </button>
          <button className={`mit-mode-btn ${mode === "revise" ? "on" : ""}`} onClick={() => enterRevise()}>
            Revise
          </button>
        </div>
        <button
          className="mit-tier-toggle"
          onClick={() => setShowContext((v) => !v)}
          disabled={mode === "revise"}
          title={
            showContext
              ? `Hide the ${EVENTS.length - CORE_COUNT} second-tier events again`
              : `Also show ${EVENTS.length - CORE_COUNT} second-tier events (individual newspapers, codification housekeeping, minor reform societies)`
          }
        >
          {showContext ? `Showing all ${EVENTS.length}` : `Core ${CORE_COUNT} only`}
        </button>
        <nav className="mit-eranav" aria-label="Jump to era">
          {ladder.map(({ era }) => (
            <button key={era.id} className="mit-eranav-btn" onClick={() => scrollToEra(era)} title={era.name}>
              {era.short}
            </button>
          ))}
        </nav>
      </section>

      <div className="mit-body">
        <div className="mit-ladder" ref={ladderRef}>
          <div className="mit-ladder-head" aria-hidden="true">
            <span className="mit-head-l">British state</span>
            <span />
            <span className="mit-head-r">Indian responses</span>
          </div>

          {ladder.map((section) => {
            const revising = mode === "revise" && reviseEra?.id === section.era.id;
            const dimmed = mode === "revise" && !revising;
            return (
              <section
                key={section.era.id}
                ref={(el) => {
                  if (el) sectionRefs.current.set(section.era.id, el);
                  else sectionRefs.current.delete(section.era.id);
                }}
                className={`mit-era ${revising ? "is-revising" : ""} ${dimmed ? "is-dimmed" : ""}`}
                aria-label={section.era.name}
              >
                <header className="mit-era-head">
                  <h2 className="mit-era-name">{section.era.name}</h2>
                  <span className="mit-era-range">{section.era.short}</span>
                  <span className="mit-era-count">· {section.count} milestones</span>
                </header>
                <ol className="mit-rungs">
                  {section.rungs.map((rung) => {
                    const all = [...rung.british, ...rung.indian];
                    const both = rung.british.length > 0 && rung.indian.length > 0;
                    const anchor = all.some((e) => ANCHOR_IDS.has(e.id));
                    const isTarget = revising && !!reviseSelected;
                    const fold = rung.foldedBefore;
                    return (
                      <li key={rung.year} className="mit-rung-wrap">
                        {fold && (
                          <div className="mit-rung mit-fold">
                            <span />
                            <span className="mit-rung-spine">
                              <span className="mit-rung-dot" />
                            </span>
                            <span className="mit-fold-text">
                              {yearRange(fold.from, fold.to)} · {fold.to - fold.from + 1} years, nothing{" "}
                              {showContext ? "" : "core "}recorded
                            </span>
                          </div>
                        )}
                        <div
                          className={[
                            "mit-rung",
                            both && "is-both",
                            anchor && "is-anchor",
                            isTarget && "is-target",
                            revising && wrongFlashYear === rung.year && "is-wrong",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onClick={isTarget ? () => placeCard(rung.year) : undefined}
                        >
                          <div className="mit-rung-side mit-rung-l">
                            {rung.british.map((e) => renderChip(e, revising))}
                          </div>
                          <div className="mit-rung-spine">
                            {isTarget ? (
                              <button type="button" className="mit-rung-year" aria-label={`Place in ${rung.year}`}>
                                {rung.year}
                              </button>
                            ) : (
                              <span className="mit-rung-year">{rung.year}</span>
                            )}
                            {both && !revising && <span className="mit-rung-tag">both</span>}
                            <span className="mit-rung-dot" />
                          </div>
                          <div className="mit-rung-side mit-rung-r">
                            {rung.indian.map((e) => renderChip(e, revising))}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>

        <aside className={`mit-aside ${sheetOpen ? "is-open" : ""}`}>
          {mode === "revise" && reviseEra ? (
            <div className="mit-card mit-revise">
              <div className="mit-eyebrow">Revising · {reviseEra.short}</div>
              <h3 className="mit-card-title">{reviseEra.name}</h3>
              <p className="mit-revise-status">
                {revisePlaced.size}/{revisePlaced.size + reviseQueue.length} placed
                {reviseStats.attempts > 0 && ` · ${reviseStats.correct}/${reviseStats.attempts} first-time right`}
              </p>
              {reviseDone ? (
                <div className="mit-revise-done">
                  <p>
                    <strong>
                      {reviseStats.correct}/{reviseStats.attempts}
                    </strong>{" "}
                    correct — every milestone back on its rung.
                  </p>
                  <div className="mit-revise-actions">
                    <button className="mit-btn" onClick={() => beginRevise(reviseEra)}>
                      Play again
                    </button>
                    {nextEra && (
                      <button className="mit-btn mit-btn-dark" onClick={() => enterRevise(nextEra)}>
                        Next era →
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <p className="mit-hint">
                    {reviseSelected
                      ? "Now tap the year on the ladder it belongs to."
                      : "Pick a card, then tap its year on the ladder."}
                  </p>
                  <div className="mit-tray" role="group" aria-label="Milestones to place">
                    {reviseTrayEvents.map((ev, i) => (
                      <button
                        key={ev.id}
                        className={`mit-tray-card ${reviseSelected === ev.id ? "is-selected" : ""}`}
                        style={{ animationDelay: `${i * 18}ms` }}
                        onClick={() => setReviseSelected((cur) => (cur === ev.id ? null : ev.id))}
                      >
                        {ev.title}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <button className="mit-btn mit-btn-ghost" onClick={exitRevise}>
                Back to Learn
              </button>
            </div>
          ) : active ? (
            <div className="mit-card mit-detail" role="region" aria-label="Milestone detail">
              <button className="mit-detail-close" onClick={() => setActiveId(null)} aria-label="Close">
                ×
              </button>
              <div className="mit-detail-meta">
                <span className="mit-eyebrow">{active.year}</span>
                <span className="mit-tag" style={chipStyle(active)}>
                  {STRAND_BY_ID[active.strand].short}
                </span>
                {ANCHOR_IDS.has(active.id) && <span className="mit-tag mit-tag-anchor">Anchor</span>}
              </div>
              <h3 className="mit-card-title">{active.title}</h3>
              <p className="mit-detail-text">{active.event}</p>

              {causedBy.length > 0 && (
                <div className="mit-detail-group">
                  <span className="mit-detail-label mit-label-cause">Caused by</span>
                  {causedBy.map((e) => renderMini(e, "cause"))}
                </div>
              )}
              {leadsTo.length > 0 && (
                <div className="mit-detail-group">
                  <span className="mit-detail-label mit-label-effect">Led to</span>
                  {leadsTo.map((e) => renderMini(e, "effect"))}
                </div>
              )}
              {causedBy.length === 0 && leadsTo.length === 0 && (
                <p className="mit-detail-nolinks">No curated causal link recorded yet for this milestone.</p>
              )}
              {sameYear.length > 0 && (
                <div className="mit-detail-group">
                  <span className="mit-detail-label">Also in {active.year}</span>
                  {sameYear.map((e) => renderMini(e))}
                </div>
              )}
            </div>
          ) : (
            <div className="mit-card mit-empty">
              <div className="mit-eyebrow">1857–1947</div>
              <h3 className="mit-card-title">Pick a rung</h3>
              <p className="mit-detail-text">
                Tap any milestone on the ladder to read what happened, what caused it, and what it led to.
              </p>
            </div>
          )}

          {mode === "learn" && (
            <>
              <div className="mit-rule">
                <div className="mit-eyebrow">Reading rule</div>
                <p>
                  Across the spine = the British move and the Indian answer in the same year. Down the spine =
                  order. Dark rungs = the anchor events everything else hangs off.
                </p>
                <ul className="mit-legend">
                  {STRANDS.map((s) => (
                    <li key={s.id} title={s.blurb}>
                      <span className="mit-legend-dot" style={{ background: s.color }} />
                      {s.short}
                    </li>
                  ))}
                </ul>
              </div>
              <button className="mit-btn mit-btn-dark mit-revise-cta" onClick={() => enterRevise()}>
                Revise {active ? eraOfYear(active.year).short : "this era"}
              </button>
            </>
          )}
        </aside>
      </div>

      <SuggestionForm />
      <footer className="mit-foot">
        Source: &ldquo;A Brief History of Modern India&rdquo; (Rajiv Ahir / Spectrum Books) ·{" "}
        {EVENTS.length} milestones, 1857–1947
      </footer>
    </div>
  );
}
