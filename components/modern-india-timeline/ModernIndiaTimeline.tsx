"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EVENTS,
  EVENTS_BY_ID,
  CORE_COUNT,
  ERAS,
  COLUMN_WIDTH,
  COLUMN_GAP,
  layoutTimeline,
  type TimelineEvent,
  type LaidOutEvent,
  type Era,
} from "@/lib/timeline/modernIndia";
import "./ModernIndiaTimeline.css";

type Mode = "learn" | "revise";

/** A gentle upward arc between two laid-out events — legible whether they're
    in the same column (a pure bow) or several years apart. */
function linkPath(a: { x: number; y: number }, b: { x: number; y: number }): string {
  const dx = b.x - a.x;
  const midX = (a.x + b.x) / 2;
  const bow = Math.max(26, Math.min(90, Math.abs(dx) * 0.16));
  const midY = (a.y + b.y) / 2 - bow;
  return `M ${a.x} ${a.y} Q ${midX} ${midY} ${b.x} ${b.y}`;
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ModernIndiaTimeline() {
  const [mode, setMode] = useState<Mode>("learn");
  const [activeId, setActiveId] = useState<string | null>(null);
  // Hidden by default: second-tier events (individual newspaper launches,
  // codification housekeeping, minor reform societies) that add noise
  // without adding to the grand narrative. Toggle brings them back.
  const [showContext, setShowContext] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [clientWidth, setClientWidth] = useState(0);

  const visibleEvents = useMemo(
    () => (showContext ? EVENTS : EVENTS.filter((e) => e.tier === "core")),
    [showContext]
  );
  const learnLayout = useMemo(() => layoutTimeline(visibleEvents), [visibleEvents]);

  // ── Revise mode state ──
  const [reviseEraId, setReviseEraId] = useState<string | null>(null);
  const [reviseQueue, setReviseQueue] = useState<string[]>([]);
  const [revisePlaced, setRevisePlaced] = useState<Set<string>>(new Set());
  const [reviseSelected, setReviseSelected] = useState<string | null>(null);
  const [reviseStats, setReviseStats] = useState({ correct: 0, attempts: 0 });
  const [wrongFlashYear, setWrongFlashYear] = useState<number | null>(null);
  const activeEra = reviseEraId ? ERAS.find((e) => e.id === reviseEraId) ?? null : null;

  // A revise round only ever shows *that era's* years — not the full
  // 90-year strip — so "unscramble" means the whole visible timeline, not
  // just whatever happened to be in view when you started scrolling.
  const eraEvents = useMemo(
    () => (activeEra ? visibleEvents.filter((e) => e.year >= activeEra.start && e.year < activeEra.end) : []),
    [activeEra, visibleEvents]
  );
  const reviseLayout = useMemo(
    () => (activeEra ? layoutTimeline(eraEvents) : null),
    [activeEra, eraEvents]
  );

  const layout = mode === "revise" && reviseLayout ? reviseLayout : learnLayout;
  const width = layout.width;
  const canvasHeight = layout.height;

  // Drag-to-pan for mouse/pen; touch keeps native scrolling. Declared before
  // the scroll/snap wiring below so the idle-snap can check "are we still
  // mid-drag" without fighting an in-progress gesture.
  const panState = useRef<{ x: number; scrollLeft: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    if ((e.target as HTMLElement).closest("[data-card]")) return;
    const el = scrollRef.current;
    if (!el) return;
    panState.current = { x: e.clientX, scrollLeft: el.scrollLeft };
    el.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!panState.current) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = panState.current.scrollLeft - (e.clientX - panState.current.x);
  };
  const endPan = () => {
    panState.current = null;
  };

  // Which column currently sits closest to the centre of the viewport.
  const centerColIndex = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !layout.columns.length) return 0;
    const centerX = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    layout.columns.forEach((col, i) => {
      const d = Math.abs(col.left + COLUMN_WIDTH / 2 - centerX);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  }, [layout.columns]);

  const scrollToColIndex = useCallback(
    (i: number, behavior: ScrollBehavior = "smooth") => {
      const el = scrollRef.current;
      const col = layout.columns[Math.max(0, Math.min(layout.columns.length - 1, i))];
      if (!el || !col) return;
      const target = col.left + COLUMN_WIDTH / 2 - el.clientWidth / 2;
      el.scrollTo({ left: Math.max(0, target), behavior });
    },
    [layout.columns]
  );

  // Scrolling itself is entirely native and free — drag, trackpad swipe,
  // momentum, whatever the platform does. The only custom behaviour is:
  // once it's been quiet for a beat (and we're not still mid-drag), ease
  // smoothly to whichever year is nearest the centre. That's "snap on
  // settle", not "fight every scroll tick" (which is what CSS
  // scroll-snap-type:mandatory was doing before — it kept trying to grab
  // the nearest boundary continuously, which felt like it was wrestling
  // the user's own drag instead of finishing it).
  const idleSnapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleIdleSnap = useCallback(() => {
    if (idleSnapTimer.current) clearTimeout(idleSnapTimer.current);
    idleSnapTimer.current = setTimeout(() => {
      if (panState.current) return; // still actively dragging — don't fight it
      scrollToColIndex(centerColIndex());
    }, 160);
  }, [centerColIndex, scrollToColIndex]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      setScrollLeft(el.scrollLeft);
      scheduleIdleSnap();
    };
    const ro = new ResizeObserver(() => setClientWidth(el.clientWidth));
    el.addEventListener("scroll", onScroll, { passive: true });
    ro.observe(el);
    setScrollLeft(el.scrollLeft);
    setClientWidth(el.clientWidth);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      if (idleSnapTimer.current) clearTimeout(idleSnapTimer.current);
    };
  }, [mode, scheduleIdleSnap]);

  // Starting (or replaying) a revise round swaps in a brand-new, much
  // narrower canvas (just that era) — always open it scrolled to its start.
  useEffect(() => {
    if (mode === "revise" && reviseEraId) scrollRef.current?.scrollTo({ left: 0 });
  }, [mode, reviseEraId]);

  // A plain (non-shift, non-ctrl) vertical wheel gesture pans the strip
  // horizontally — this is a horizontal timeline, so a mouse wheel should
  // move it. A trackpad's own horizontal swipe (deltaX) is left alone and
  // handled natively; overriding it here was swallowing it entirely.
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft += e.deltaY;
    e.preventDefault();
  };

  const pageBy = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const perPage = Math.max(1, Math.round(el.clientWidth / (COLUMN_WIDTH + COLUMN_GAP)));
    scrollToColIndex(centerColIndex() + dir * perPage);
  };

  const laidById = useMemo(() => new Map(layout.events.map((e) => [e.id, e])), [layout.events]);
  const active = mode === "learn" && activeId ? laidById.get(activeId) ?? null : null;
  const causedByLaid = useMemo(
    () =>
      (active?.causedBy ?? [])
        .map((id) => laidById.get(id))
        .filter((e): e is LaidOutEvent => !!e),
    [active, laidById]
  );
  const leadsToLaid = useMemo(
    () =>
      (active?.leadsTo ?? [])
        .map((id) => laidById.get(id))
        .filter((e): e is LaidOutEvent => !!e),
    [active, laidById]
  );
  const linkedIds = useMemo(
    () => new Set([...causedByLaid.map((e) => e.id), ...leadsToLaid.map((e) => e.id)]),
    [causedByLaid, leadsToLaid]
  );

  // Empty years have no column of their own (see layoutTimeline), so a
  // requested year may not have a column at that exact index — fall back to
  // the nearest one that does.
  const colIndexNearYear = useCallback(
    (year: number): number => {
      let best = 0;
      let bestDist = Infinity;
      layout.columns.forEach((col, i) => {
        const d = Math.abs(col.year - year);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      return best;
    },
    [layout.columns]
  );

  const jumpTo = (id: string) => {
    const ev = laidById.get(id);
    if (!ev) return;
    setActiveId(id);
    scrollToColIndex(colIndexNearYear(ev.year));
  };

  // ── minimap ── era bands use real column pixel positions, not a linear
  // calendar-year fraction — with empty years dropped, a "quiet" era's
  // columns take up proportionally less width than its calendar span would
  // suggest, and the minimap should reflect what's actually on the canvas.
  const eraPixelBands = useMemo(() => {
    if (mode === "revise") return [];
    return ERAS.map((era) => {
      const cols = layout.columns.filter((c) => c.year >= era.start && c.year < era.end);
      if (!cols.length || !width) return null;
      const left = cols[0].left;
      const right = cols[cols.length - 1].left + COLUMN_WIDTH;
      return { era, leftPct: (left / width) * 100, widthPct: ((right - left) / width) * 100 };
    }).filter((b): b is { era: Era; leftPct: number; widthPct: number } => b != null);
  }, [mode, layout.columns, width]);
  const viewFracLeft = width ? scrollLeft / width : 0;
  const viewFracWidth = width ? Math.min(1, clientWidth / width) : 1;
  const seekFromClientX = (clientX: number) => {
    const mm = minimapRef.current;
    const el = scrollRef.current;
    if (!mm || !el) return;
    const r = mm.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    el.scrollLeft = Math.max(0, frac * width - el.clientWidth / 2);
  };
  const onMinimapPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    seekFromClientX(e.clientX);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMinimapPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    seekFromClientX(e.clientX);
  };

  const startRevise = (era: Era) => {
    const ids = visibleEvents.filter((e) => e.year >= era.start && e.year < era.end).map((e) => e.id);
    setReviseEraId(era.id);
    setReviseQueue(shuffled(ids));
    setRevisePlaced(new Set());
    setReviseSelected(null);
    setReviseStats({ correct: 0, attempts: 0 });
  };
  const exitRevise = () => {
    setMode("learn");
    setReviseEraId(null);
  };

  const placeCard = (targetYear: number) => {
    if (!reviseSelected) return;
    const ev = EVENTS_BY_ID[reviseSelected];
    setReviseStats((s) => ({ correct: s.correct + (ev.year === targetYear ? 1 : 0), attempts: s.attempts + 1 }));
    if (ev.year === targetYear) {
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
  const reviseDone = mode === "revise" && activeEra && reviseQueue.length === 0;

  const renderCard = (ev: TimelineEvent & { x: number; y: number }) => {
    const isActive = ev.id === activeId;
    const isLinked = linkedIds.has(ev.id);
    return (
      <button
        key={ev.id}
        data-card
        className={`mit-card ${isActive ? "is-active" : ""} ${isLinked ? "is-linked" : ""} ${
          mode === "revise" ? "is-placed" : ""
        }`}
        style={{ left: ev.x, top: ev.y, width: COLUMN_WIDTH - 16 }}
        onClick={mode === "learn" ? () => setActiveId((cur) => (cur === ev.id ? null : ev.id)) : undefined}
        title={`${ev.year} — ${ev.title}`}
      >
        <span className="mit-card-title">{ev.title}</span>
      </button>
    );
  };

  return (
    <div className="mit-root">
      <section className="mit-controls">
        <div className="mit-modebar" role="group" aria-label="Mode">
          <button className={`mit-mode-btn ${mode === "learn" ? "on" : ""}`} onClick={() => setMode("learn")}>
            Learn
          </button>
          <button className={`mit-mode-btn ${mode === "revise" ? "on" : ""}`} onClick={() => setMode("revise")}>
            Revise
          </button>
        </div>
        {mode === "learn" ? (
          <>
            <button
              className="mit-tier-toggle"
              onClick={() => setShowContext((v) => !v)}
              title={
                showContext
                  ? `Hide the ${EVENTS.length - CORE_COUNT} second-tier events again`
                  : `Also show ${EVENTS.length - CORE_COUNT} second-tier events (individual newspapers, codification housekeeping, minor reform societies)`
              }
            >
              {showContext ? `Showing all ${EVENTS.length}` : `Core ${CORE_COUNT} only`}
            </button>
            <div className="mit-pager" role="group" aria-label="Scroll years">
              <button className="mit-zbtn" onClick={() => pageBy(-1)} aria-label="Earlier years">
                ← Earlier
              </button>
              <button className="mit-zbtn" onClick={() => pageBy(1)} aria-label="Later years">
                Later →
              </button>
            </div>
          </>
        ) : (
          <div className="mit-erabar" role="group" aria-label="Choose an era to revise">
            {ERAS.map((era) => (
              <button
                key={era.id}
                className={`mit-chip ${reviseEraId === era.id ? "on" : ""}`}
                onClick={() => startRevise(era)}
              >
                {era.name}
                <span className="mit-era-chip-range">{era.short}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {mode === "revise" && (
        <div className="mit-revise-bar">
          {!activeEra ? (
            <p className="mit-hint">Pick an era above to start a round.</p>
          ) : reviseDone ? (
            <div className="mit-revise-done">
              <strong>
                {reviseStats.correct}/{reviseStats.attempts} correct — {activeEra.name} placed.
              </strong>
              <button className="mit-tier-toggle" onClick={() => startRevise(activeEra)}>
                Play again
              </button>
              <button className="mit-tier-toggle" onClick={exitRevise}>
                Back to Learn
              </button>
            </div>
          ) : (
            <>
              <div className="mit-revise-status">
                <span>
                  {activeEra.name} · {revisePlaced.size}/{revisePlaced.size + reviseQueue.length} placed
                  {reviseStats.attempts > 0 && ` · ${reviseStats.correct}/${reviseStats.attempts} correct`}
                </span>
              </div>
              <div className="mit-tray" role="group" aria-label="Events to place">
                {reviseTrayEvents.map((ev) => (
                  <button
                    key={ev.id}
                    className={`mit-tray-card ${reviseSelected === ev.id ? "is-selected" : ""}`}
                    onClick={() => setReviseSelected((cur) => (cur === ev.id ? null : ev.id))}
                  >
                    {ev.title}
                  </button>
                ))}
              </div>
              <p className="mit-hint">
                {reviseSelected
                  ? "Now tap the year column you think it belongs to."
                  : "Tap a card above, then tap its year below."}
              </p>
            </>
          )}
        </div>
      )}

      <div
        className="mit-scroll"
        ref={scrollRef}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPan}
        onPointerLeave={endPan}
      >
        <div className="mit-canvas" style={{ width, height: canvasHeight }}>
          {layout.columns.map((col, i) => (
            <div
              key={col.year}
              data-card={mode === "revise" && reviseSelected ? "true" : undefined}
              className={`mit-col ${i % 2 === 1 ? "alt" : ""} ${
                mode === "revise" && reviseSelected ? "is-target" : ""
              } ${wrongFlashYear === col.year ? "is-wrong" : ""}`}
              style={{ left: col.left, width: COLUMN_WIDTH, height: canvasHeight }}
              onClick={mode === "revise" && reviseSelected ? () => placeCard(col.year) : undefined}
              role={mode === "revise" && reviseSelected ? "button" : undefined}
            >
              {col.eraStart && (
                <div className="mit-era-header">
                  <span className="mit-era-label">{col.eraStart.name}</span>
                  <span className="mit-era-range">{col.eraStart.short}</span>
                </div>
              )}
              <span className="mit-col-year">{col.year}</span>
            </div>
          ))}

          <svg className="mit-links" width={width} height={canvasHeight} aria-hidden="true">
            <defs>
              <marker
                id="mit-arrow-in"
                viewBox="0 0 10 10"
                refX="8.5"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L10,5 L0,10 z" className="mit-arrow-fill-in" />
              </marker>
              <marker
                id="mit-arrow-out"
                viewBox="0 0 10 10"
                refX="8.5"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L10,5 L0,10 z" className="mit-arrow-fill-out" />
              </marker>
            </defs>
            {active &&
              causedByLaid.map((src) => (
                <path
                  key={`in-${src.id}`}
                  d={linkPath(src, active)}
                  className="mit-link mit-link-in"
                  markerEnd="url(#mit-arrow-in)"
                />
              ))}
            {active &&
              leadsToLaid.map((dst) => (
                <path
                  key={`out-${dst.id}`}
                  d={linkPath(active, dst)}
                  className="mit-link mit-link-out"
                  markerEnd="url(#mit-arrow-out)"
                />
              ))}
          </svg>

          {layout.events.map((ev) => {
            if (mode === "revise" && !revisePlaced.has(ev.id)) return null;
            return renderCard(ev);
          })}
        </div>
      </div>

      {mode === "learn" && (
        <div
          className="mit-minimap"
          ref={minimapRef}
          onPointerDown={onMinimapPointerDown}
          onPointerMove={onMinimapPointerMove}
        >
          {eraPixelBands.map(({ era, leftPct, widthPct }) => (
            <div key={era.id} className="mit-mm-band" style={{ left: `${leftPct}%`, width: `${widthPct}%` }}>
              <span>{era.short}</span>
            </div>
          ))}
          <div
            className="mit-mm-view"
            style={{ left: `${viewFracLeft * 100}%`, width: `${viewFracWidth * 100}%` }}
          />
        </div>
      )}

      {mode === "learn" &&
        (active ? (
          <div className="mit-panel" role="dialog" aria-label="Event detail">
            <button className="mit-panel-close" onClick={() => setActiveId(null)} aria-label="Close">
              ×
            </button>
            <div className="mit-panel-year">{active.year}</div>
            <h3 className="mit-panel-title">{active.title}</h3>
            <p className="mit-panel-text">{active.event}</p>
            {causedByLaid.length > 0 || leadsToLaid.length > 0 ? (
              <div className="mit-panel-links">
                {causedByLaid.length > 0 && (
                  <div className="mit-panel-linkgroup">
                    <span className="mit-panel-linklabel">Caused by</span>
                    {causedByLaid.map((l) => (
                      <button key={l.id} className="mit-panel-linkchip" onClick={() => jumpTo(l.id)}>
                        {l.year} · {l.title}
                      </button>
                    ))}
                  </div>
                )}
                {leadsToLaid.length > 0 && (
                  <div className="mit-panel-linkgroup">
                    <span className="mit-panel-linklabel">Led to</span>
                    {leadsToLaid.map((l) => (
                      <button key={l.id} className="mit-panel-linkchip" onClick={() => jumpTo(l.id)}>
                        {l.year} · {l.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="mit-panel-nolinks">No curated causal link recorded yet for this event.</p>
            )}
          </div>
        ) : (
          <p className="mit-hint">
            Tap any milestone to open its full detail below and trace what caused it — and what it
            caused.
          </p>
        ))}

      <footer className="mit-foot">
        Source: &ldquo;A Brief History of Modern India&rdquo; (Rajiv Ahir / Spectrum Books) ·{" "}
        {EVENTS.length} milestones, 1857–1947
      </footer>
    </div>
  );
}
