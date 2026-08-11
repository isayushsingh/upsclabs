"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import indiaRaw from "@/lib/parks/india.json";
import riversRaw from "@/lib/geo/rivers.json";
import { useMapViewport, type VB } from "@/lib/geo/useMapViewport";
import { placeLabels, type LabelInput } from "@/lib/parks/layout";
import type { IndiaMap } from "@/lib/parks/types";
import type { RiverFeature } from "@/lib/geo/types";
import "./RiversOfIndiaMap.css";

const INDIA = indiaRaw as unknown as IndiaMap;
const RIVERS = riversRaw as unknown as RiverFeature[];

type Mode = "learn" | "recall";

const ASPECT = 1.1;

/** Pad a bbox then letterbox it to the panel's aspect ratio — same recipe as
    the National Parks tool's frameToAspect. */
function frameToAspect(
  [x, y, w, h]: [number, number, number, number],
  padFrac: number
): VB {
  const px = w * padFrac;
  const py = h * padFrac;
  const bx = x - px;
  const by = y - py;
  const bw = w + px * 2;
  const bh = h + py * 2;
  const bAspect = bw / bh;
  if (bAspect > ASPECT) {
    const nh = bw / ASPECT;
    return [bx, by - (nh - bh) / 2, bw, nh];
  }
  const nw = bh * ASPECT;
  return [bx - (nw - bw) / 2, by, nw, bh];
}

const FULL_VB: VB = frameToAspect(INDIA.viewBox as VB, 0.03);
const LABEL_FRAC = 0.0125; // river label font-size, fraction of viewBox width
const LGAP_FRAC = 0.006; // gap between a label and its anchor/other labels

// Pedagogical grouping order (source → mouth, roughly west to east / north
// to south), not alphabetical — matches how these are usually taught.
const SYSTEM_ORDER = [
  "Indus",
  "Ganga",
  "Yamuna",
  "Brahmaputra",
  "Barak",
  "Narmada",
  "Tapi",
  "Mahi",
  "Godavari",
  "Krishna",
  "Cauvery",
  "Mahanadi",
  "Brahmani-Baitarani",
  "East Flowing Peninsular Rivers",
  "West Flowing Peninsular Rivers",
  "Kaladan",
];
const SYSTEMS = SYSTEM_ORDER.filter((s) => RIVERS.some((r) => r.system === s));

/** Bounding box (in viewBox units) of every M/L point in an SVG path string. */
function pathBBox(d: string): [number, number, number, number] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const re = /[ML](-?[\d.]+),(-?[\d.]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d))) {
    const x = parseFloat(m[1]);
    const y = parseFloat(m[2]);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return [minX, minY, maxX, maxY];
}

/** Each system's framed viewBox, computed once from its rivers' geometry —
    this is what the map animates to when a system is selected. */
const SYSTEM_VB: Record<string, VB> = (() => {
  const boxes: Record<string, [number, number, number, number]> = {};
  for (const r of RIVERS) {
    for (const d of r.paths) {
      const [minX, minY, maxX, maxY] = pathBBox(d);
      const cur = boxes[r.system];
      if (!cur) {
        boxes[r.system] = [minX, minY, maxX, maxY];
        continue;
      }
      cur[0] = Math.min(cur[0], minX);
      cur[1] = Math.min(cur[1], minY);
      cur[2] = Math.max(cur[2], maxX);
      cur[3] = Math.max(cur[3], maxY);
    }
  }
  const out: Record<string, VB> = {};
  for (const [system, [minX, minY, maxX, maxY]] of Object.entries(boxes)) {
    out[system] = frameToAspect([minX, minY, maxX - minX, maxY - minY], 0.2);
  }
  return out;
})();

const SEARCH_INDEX = [...RIVERS].sort((a, b) => a.name.localeCompare(b.name));

export default function RiversOfIndiaMap() {
  const [mode, setMode] = useState<Mode>("learn");
  const [riversOn, setRiversOn] = useState(true);
  const [system, setSystem] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<RiverFeature | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);

  const { vb, svgRef, suppressClickRef, onStagePointerDown, zoomButtons, goTo } =
    useMapViewport(FULL_VB, FULL_VB, ASPECT);

  const visibleRivers = useMemo(
    () =>
      riversOn && system
        ? [...RIVERS.filter((r) => r.system === system)].sort(
            (a, b) => Number(a.major) - Number(b.major)
          )
        : [],
    [riversOn, system]
  );

  const chooseSystem = useCallback(
    (sys: string | null, dur?: number) => {
      setSystem(sys);
      setSelected(null);
      setRevealed(new Set());
      setHovered(null);
      goTo(sys ? SYSTEM_VB[sys] : FULL_VB, dur);
    },
    [goTo]
  );

  const resetToIndia = useCallback(() => chooseSystem(null), [chooseSystem]);

  const switchMode = useCallback((m: Mode) => {
    setMode(m);
    setSelected(null);
    setRevealed(new Set());
  }, []);

  const isMasked = useCallback(
    (id: string) => mode === "recall" && !revealed.has(id),
    [mode, revealed]
  );

  const clickRiver = useCallback((r: RiverFeature) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setRevealed((prev) => (prev.has(r.id) ? prev : new Set(prev).add(r.id)));
    setSelected(r);
  }, [suppressClickRef]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [] as RiverFeature[];
    return SEARCH_INDEX.filter((r) => r.name.toLowerCase().includes(q)).slice(0, 8);
  }, [searchQuery]);

  const goToSearchResult = useCallback(
    (r: RiverFeature) => {
      setRiversOn(true);
      chooseSystem(r.system);
      setSelected(r);
      setRevealed((prev) => (prev.has(r.id) ? prev : new Set(prev).add(r.id)));
      setSearchQuery("");
      setSearchOpen(false);
    },
    [chooseSystem]
  );

  useEffect(() => {
    if (!searchOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!searchRef.current?.contains(e.target as Node)) setSearchOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [searchOpen]);

  useEffect(() => {
    if (!selected) return;
    cardRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const LFS = LABEL_FRAC * vb[2];
  const LGAP = LGAP_FRAC * vb[2];

  // Greedy label declutter (shared with the National Parks tool) — masked
  // "?" labels are much narrower than real names, so this must recompute
  // whenever mode/revealed changes, not just when the system changes.
  const placements = useMemo(() => {
    const labels: LabelInput[] = visibleRivers.map((r) => {
      const masked = isMasked(r.id);
      return {
        id: r.id,
        text: masked ? "?" : r.name,
        x: r.anchor[0],
        y: r.anchor[1],
        r: 0,
        fontSize: LFS,
        priority: r.major ? 1 : 0,
      };
    });
    return placeLabels(labels, LGAP);
  }, [visibleRivers, isMasked, LFS, LGAP]);

  return (
    <div className="riv-root">
      <div className="riv-workspace">
        <aside className="riv-sidebar">
          <div className="riv-search" role="search" ref={searchRef}>
            <div className="riv-search-box">
              <span className="riv-search-ic" aria-hidden="true">⚲</span>
              <input
                type="text"
                className="riv-search-input"
                placeholder="Search a river…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => {
                  if (searchQuery.trim()) setSearchOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchResults.length > 0) {
                    goToSearchResult(searchResults[0]);
                  } else if (e.key === "Escape") {
                    setSearchQuery("");
                    setSearchOpen(false);
                  }
                }}
                aria-label="Search rivers"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="riv-search-clear"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchOpen(false);
                  }}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            {searchOpen && searchQuery.trim() && (
              <ul className="riv-search-results">
                {searchResults.length ? (
                  searchResults.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        className="riv-search-result"
                        onClick={() => goToSearchResult(r)}
                      >
                        <span className="riv-search-name">{r.name}</span>
                        <span className="riv-search-meta">{r.system} system</span>
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="riv-search-empty">No rivers match &quot;{searchQuery}&quot;</li>
                )}
              </ul>
            )}
          </div>

          <div className="riv-modecard" role="group" aria-label="Study mode">
            <button
              type="button"
              className={`riv-mode riv-mode-learn ${mode === "learn" ? "riv-mode-on" : ""}`}
              onClick={() => switchMode("learn")}
              aria-pressed={mode === "learn"}
            >
              Learn Mode
            </button>
            <button
              type="button"
              className={`riv-mode riv-mode-recall ${mode === "recall" ? "riv-mode-on" : ""}`}
              onClick={() => switchMode("recall")}
              aria-pressed={mode === "recall"}
            >
              Recall Mode
            </button>
          </div>

          <div className="riv-layerbox">
            <span className="riv-lyr-cap">Layers</span>
            <div className="riv-lyr-col" role="group" aria-label="Map layers">
              <LayerChip variant="riv" on={riversOn} onClick={() => setRiversOn((v) => !v)}>
                Rivers
              </LayerChip>
              <LayerChip variant="mtn" on={false} disabled>
                Mountains <em>Soon</em>
              </LayerChip>
            </div>

            {riversOn && (
              <select
                className="riv-systemselect"
                value={system ?? ""}
                onChange={(e) => chooseSystem(e.target.value || null)}
                aria-label="Choose a river system"
              >
                <option value="">Choose a river system…</option>
                {SYSTEMS.map((s) => (
                  <option key={s} value={s}>
                    {s} System
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            type="button"
            className="riv-lb-reset"
            onClick={resetToIndia}
            aria-label="Reset to All India view"
          >
            <span className="riv-lb-reset-ic" aria-hidden="true">↺</span>
            Reset to All India
          </button>

          <div className="riv-footnote">
            <span className="riv-fn-cap">River key</span>
            <div className="riv-fn-rivers" aria-label="River key">
              <span><i className="riv-lg riv-lg-major" />Major river</span>
              <span><i className="riv-lg riv-lg-minor" />Minor / context river</span>
            </div>
          </div>
        </aside>

        <div className="riv-mapcol">
          <div className="riv-stage">
            <svg
              ref={svgRef}
              className="riv-svg riv-grab"
              viewBox={vb.join(" ")}
              onPointerDown={onStagePointerDown}
              role="img"
              aria-label={system ? `Map of the ${system} river system` : "Map of India"}
            >
              <g>
                {INDIA.states.map((s) => (
                  <path key={s.name} d={s.d} className="riv-state" />
                ))}
              </g>

              <g className="riv-rivers">
                {visibleRivers.map((r) => {
                  const masked = isMasked(r.id);
                  const isHovered = hovered === r.id;
                  const pl = placements.get(r.id);
                  return (
                    <g
                      key={r.id}
                      className={[
                        "riv-river-g",
                        r.major ? "riv-major" : "riv-minor",
                        isHovered ? "riv-hover" : "",
                        masked ? "riv-masked" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onMouseEnter={() => setHovered(r.id)}
                      onMouseLeave={() =>
                        setHovered((cur) => (cur === r.id ? null : cur))
                      }
                      onClick={() => clickRiver(r)}
                    >
                      {r.paths.map((d, i) => (
                        <path key={`hit-${i}`} d={d} className="riv-river-hit" />
                      ))}
                      {r.paths.map((d, i) => (
                        <path
                          key={`line-${i}`}
                          d={d}
                          className="riv-river-line"
                          aria-hidden="true"
                        />
                      ))}
                      {pl && !pl.hidden && (
                        <>
                          {pl.leader && (
                            <line
                              x1={r.anchor[0]}
                              y1={r.anchor[1]}
                              x2={pl.x}
                              y2={pl.y - LGAP}
                              className="riv-lead"
                            />
                          )}
                          <text
                            x={pl.x}
                            y={pl.y}
                            fontSize={LFS}
                            textAnchor={pl.textAnchor}
                            className={`riv-label ${masked ? "riv-label-mask" : ""}`}
                          >
                            {masked ? "?" : r.name}
                          </text>
                        </>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>

            {(!riversOn || !system) && (
              <div className="riv-empty-hint">
                <p>
                  {riversOn
                    ? "Choose a river system in the sidebar to begin."
                    : "Turn on the Rivers layer in the sidebar to begin."}
                </p>
              </div>
            )}

            <div className="riv-zoombtns">
              <button
                type="button"
                className="riv-zoom"
                onClick={() => zoomButtons(0.8)}
                aria-label="Zoom in"
              >
                +
              </button>
              <button
                type="button"
                className="riv-zoom"
                onClick={() => zoomButtons(1.25)}
                aria-label="Zoom out"
              >
                −
              </button>
            </div>

            {selected && (
              <RiverCard
                river={selected}
                masked={isMasked(selected.id)}
                onClose={() => setSelected(null)}
                panelRef={cardRef}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LayerChip({
  on,
  onClick,
  variant,
  disabled = false,
  children,
}: {
  on: boolean;
  onClick?: () => void;
  variant: "riv" | "mtn";
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`riv-chip riv-chip-${variant} ${on ? "on" : ""}`}
      onClick={onClick}
      aria-pressed={on}
      disabled={disabled}
    >
      <span className="riv-sw" aria-hidden="true" />
      {children}
    </button>
  );
}

function RiverCard({
  river,
  masked,
  onClose,
  panelRef,
}: {
  river: RiverFeature;
  masked: boolean;
  onClose: () => void;
  panelRef: React.Ref<HTMLElement>;
}) {
  return (
    <aside
      ref={panelRef}
      className="riv-card"
      role="dialog"
      aria-label={masked ? "River" : river.name}
      tabIndex={-1}
    >
      <header className="riv-card-head">
        <div className="riv-card-titles">
          <h2 className="riv-card-title">{masked ? "?" : river.name}</h2>
          {river.major && <span className="riv-tag">Major river</span>}
        </div>
        <button className="riv-card-x" onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>

      {!masked && (
        <dl className="riv-rows">
          <div className="riv-row">
            <dt>Basin</dt>
            <dd>{river.basin || "—"}</dd>
          </div>
          <div className="riv-row">
            <dt>Origin</dt>
            <dd>{river.origin || "—"}</dd>
          </div>
          {river.tributaries && river.tributaries.length > 0 && (
            <div className="riv-row">
              <dt>Tributaries</dt>
              <dd>{river.tributaries.join(", ")}</dd>
            </div>
          )}
          <div className="riv-row">
            <dt>UPSC note</dt>
            <dd>{river.note || "Notes coming soon."}</dd>
          </div>
        </dl>
      )}
    </aside>
  );
}
