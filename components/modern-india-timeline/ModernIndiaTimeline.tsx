"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  EVENTS,
  CORE_COUNT,
  STRANDS,
  STRAND_BY_ID,
  ERAS,
  ZOOM_LEVELS,
  CARD_WIDTH,
  CARD_HEIGHT,
  EDGE_MARGIN,
  layoutTimeline,
  yearToFrac,
  type ZoomLevel,
  type StrandId,
  type LaidOutEvent,
} from "@/lib/timeline/modernIndia";
import "./ModernIndiaTimeline.css";

const ZOOM_NAMES: Record<ZoomLevel, string> = {
  overview: "Era view",
  labeled: "Timeline view",
};

/** A gentle upward arc between two laid-out events — legible whether they're
    in the same row (a pure bow) or several rows apart. */
function linkPath(a: { x: number; y: number }, b: { x: number; y: number }): string {
  const dx = b.x - a.x;
  const midX = (a.x + b.x) / 2;
  const bow = Math.max(26, Math.min(90, Math.abs(dx) * 0.16));
  const midY = (a.y + b.y) / 2 - bow;
  return `M ${a.x} ${a.y} Q ${midX} ${midY} ${b.x} ${b.y}`;
}

export default function ModernIndiaTimeline() {
  const [zoomIdx, setZoomIdx] = useState(1); // start at "labeled"
  const zoom: ZoomLevel = ZOOM_LEVELS[zoomIdx];
  const [selected, setSelected] = useState<Set<StrandId>>(
    () => new Set(STRANDS.map((s) => s.id))
  );
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
  const layout = useMemo(() => layoutTimeline(zoom, visibleEvents), [zoom, visibleEvents]);
  const laid = layout.events;
  const laidById = useMemo(() => new Map(laid.map((e) => [e.id, e])), [laid]);
  const width = layout.width;
  const canvasHeight = layout.height;
  const cardWidth = CARD_WIDTH[zoom];
  const cardHeight = CARD_HEIGHT[zoom];

  // ── zoom, holding the on-screen year roughly steady ──
  const pendingCenterFrac = useRef<number | null>(null);
  const changeZoom = useCallback(
    (nextIdx: number) => {
      const clamped = Math.min(ZOOM_LEVELS.length - 1, Math.max(0, nextIdx));
      if (clamped === zoomIdx) return;
      const el = scrollRef.current;
      if (el) {
        const centerPx = el.scrollLeft + el.clientWidth / 2;
        pendingCenterFrac.current = centerPx / width;
      }
      setZoomIdx(clamped);
    },
    [width, zoomIdx]
  );

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && pendingCenterFrac.current != null) {
      const targetPx = pendingCenterFrac.current * width;
      el.scrollLeft = Math.max(0, targetPx - el.clientWidth / 2);
      pendingCenterFrac.current = null;
      setScrollLeft(el.scrollLeft);
    }
  }, [zoom, width]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrollLeft(el.scrollLeft);
    const ro = new ResizeObserver(() => setClientWidth(el.clientWidth));
    el.addEventListener("scroll", onScroll, { passive: true });
    ro.observe(el);
    setScrollLeft(el.scrollLeft);
    setClientWidth(el.clientWidth);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [zoom]);

  // Ctrl/Cmd + wheel to zoom (trackpad pinch is reported as ctrlKey+wheel by browsers).
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    changeZoom(zoomIdx + (e.deltaY < 0 ? 1 : -1));
  };

  // Drag-to-pan for mouse/pen; touch keeps native scrolling.
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

  const toggleStrand = (id: StrandId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next.size ? next : new Set(STRANDS.map((s) => s.id));
    });
  };
  const isolateStrand = (id: StrandId) => setSelected(new Set([id]));
  const showAll = () => setSelected(new Set(STRANDS.map((s) => s.id)));

  const active = activeId ? laidById.get(activeId) ?? null : null;
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

  const jumpTo = (id: string) => {
    const ev = laidById.get(id);
    const el = scrollRef.current;
    if (!ev || !el) return;
    setActiveId(id);
    el.scrollTo({ left: Math.max(0, ev.x - el.clientWidth / 2), behavior: "smooth" });
  };

  // ── minimap ──
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

  return (
    <div className="mit-root">
      <section className="mit-controls">
        {/* <div className="mit-strandbar" role="group" aria-label="Filter by strand">
          <button
            className={`mit-chip mit-chip-all ${selected.size === STRANDS.length ? "on" : ""}`}
            onClick={showAll}
          >
            All strands
          </button>
          {STRANDS.map((s) => (
            <button
              key={s.id}
              className={`mit-chip ${selected.has(s.id) ? "on" : ""}`}
              onClick={() => toggleStrand(s.id)}
              onDoubleClick={() => isolateStrand(s.id)}
              title={`${s.blurb} — double-click to isolate`}
            >
              <span className="mit-swatch" style={{ background: s.color }} />
              {s.short}
            </button>
          ))}
        </div> */}
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
        <div className="mit-zoom" role="group" aria-label="Zoom level">
          <button
            className="mit-zbtn"
            onClick={() => changeZoom(zoomIdx - 1)}
            disabled={zoomIdx === 0}
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="mit-zlabel">{ZOOM_NAMES[zoom]}</span>
          <button
            className="mit-zbtn"
            onClick={() => changeZoom(zoomIdx + 1)}
            disabled={zoomIdx === ZOOM_LEVELS.length - 1}
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
      </section>

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
          <div className="mit-eras" style={{ height: canvasHeight }}>
            {ERAS.map((er) => {
              // Cards are inset by padX so the first/last don't clip on the
              // canvas edge (see layoutTimeline) — era bands share that same
              // inset so their boundaries line up with the cards under them.
              const padX = cardWidth / 2 + EDGE_MARGIN;
              const contentWidth = width - padX * 2;
              const left = padX + yearToFrac(er.start) * contentWidth;
              const right = padX + yearToFrac(Math.min(er.end, 1947)) * contentWidth;
              return (
                <div key={er.id} className="mit-era-band" style={{ left, width: right - left }}>
                  <div className="mit-era-header">
                    <span className="mit-era-label">{er.name}</span>
                    <span className="mit-era-range">{er.short}</span>
                  </div>
                </div>
              );
            })}
          </div>

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

          {laid.map((ev) => {
            const strand = STRAND_BY_ID[ev.strand];
            const dim = !selected.has(ev.strand);
            const isActive = ev.id === activeId;
            const isLinked = linkedIds.has(ev.id);
            return (
              <button
                key={ev.id}
                data-card
                className={`mit-card mit-card-${zoom} ${dim ? "is-dim" : ""} ${
                  isActive ? "is-active" : ""
                } ${isLinked ? "is-linked" : ""}`}
                style={
                  {
                    left: ev.x,
                    top: ev.y,
                    width: ev.width,
                    height: cardHeight,
                    "--sc": strand.color,
                  } as React.CSSProperties
                }
                onClick={() => setActiveId((cur) => (cur === ev.id ? null : ev.id))}
                title={`${ev.year} — ${ev.title}`}
              >
                {zoom !== "overview" && (
                  <span className="mit-card-line">
                    <span className="mit-card-year">{ev.year}</span>
                    <span className="mit-card-title">{ev.title}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="mit-minimap"
        ref={minimapRef}
        onPointerDown={onMinimapPointerDown}
        onPointerMove={onMinimapPointerMove}
      >
        {ERAS.map((er) => {
          const left = yearToFrac(er.start) * 100;
          const w = (yearToFrac(Math.min(er.end, 1947)) - yearToFrac(er.start)) * 100;
          return (
            <div key={er.id} className="mit-mm-band" style={{ left: `${left}%`, width: `${w}%` }}>
              <span>{er.short}</span>
            </div>
          );
        })}
        <div
          className="mit-mm-view"
          style={{ left: `${viewFracLeft * 100}%`, width: `${viewFracWidth * 100}%` }}
        />
      </div>

      {active ? (
        <div className="mit-panel" role="dialog" aria-label="Event detail">
          <button className="mit-panel-close" onClick={() => setActiveId(null)} aria-label="Close">
            ×
          </button>
          <div className="mit-panel-strand" style={{ color: STRAND_BY_ID[active.strand].color }}>
            <span className="mit-swatch" style={{ background: STRAND_BY_ID[active.strand].color }} />
            {STRAND_BY_ID[active.strand].label}
          </div>
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
            <p className="mit-panel-nolinks">
              No curated causal link recorded yet for this event.
            </p>
          )}
        </div>
      ) : (
        <p className="mit-hint">
          Tap any milestone to open its full detail below and trace what caused it — and what it
          caused.
        </p>
      )}

      <footer className="mit-foot">
        Source: &ldquo;A Brief History of Modern India&rdquo; (Rajiv Ahir / Spectrum Books) ·{" "}
        {EVENTS.length} milestones, 1857–1947
      </footer>
    </div>
  );
}
