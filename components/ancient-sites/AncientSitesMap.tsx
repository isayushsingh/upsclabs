"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { Feature } from "geojson";
import southAsiaRaw from "@/lib/timeline/southAsia.json";
import bordersRaw from "@/lib/timeline/borders.json";
import indiaStatesRaw from "@/lib/parks/india.json";
import sitesRaw from "@/lib/ancient-sites/sites.json";
import { useMapViewport, type VB } from "@/lib/geo/useMapViewport";
import { placeLabels, type LabelInput } from "@/lib/parks/layout";
import type { IndiaMap } from "@/lib/parks/types";
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  EDICT_TYPE_META,
  KINGDOM_LABELS,
  type Site,
  type SiteCategory,
} from "@/lib/ancient-sites/types";
import "./AncientSitesMap.css";

const SITES = sitesRaw as unknown as Site[];
const INDIA_STATES = indiaStatesRaw as unknown as IndiaMap;

// Same South Asia landmass + modern-border geometry the Ancient India
// Timeline tool uses (lib/timeline/southAsia.json / borders.json) — not
// lib/parks/india.json's modern-India-only outline. Ancient sites this
// tool cares about aren't confined to today's India: Harappa and
// Mohenjodaro are in Pakistan, Shortugai is in Afghanistan. A basemap that
// only draws modern India's borders can't show them on solid ground.
const BASE_LAND = southAsiaRaw as unknown as Feature;
const BORDERS = bordersRaw as unknown as Feature;

type Mode = "learn" | "recall";

// Fixed projection canvas — d3's fitExtent bakes the padding/aspect in
// directly, so there's no separate frameToAspect step like the India-only
// tools need for their own custom equirectangular projection.
const VIEW_W = 880;
// Taller than wide-ish (was 800, a squatter 1.1) — gives the map more
// vertical screen real estate. Must match .as-stage's CSS aspect-ratio
// exactly (kept as a "W / H" ratio in both places, not a decimal, so there's
// no float-rounding mismatch between the two).
const VIEW_H = 860;
const ASPECT = VIEW_W / VIEW_H;

const PROJECTION = geoMercator().fitExtent(
  [
    [24, 24],
    [VIEW_W - 24, VIEW_H - 24],
  ],
  BASE_LAND
);
const PATH_GEN = geoPath(PROJECTION);
const LAND_PATH = PATH_GEN(BASE_LAND) ?? "";
const BORDER_PATH = PATH_GEN(BORDERS) ?? "";

/** lon/lat → this map's fixed pixel space. */
function project(lon: number, lat: number): [number, number] {
  const p = PROJECTION([lon, lat]) as [number, number];
  return [Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100];
}

/** India's outline + state boundaries, reprojected from lib/parks/india.json
    — that file has no raw lon/lat, only paths already projected into its
    own India-only equirectangular pixel space (via its `proj` block).
    Every M/L point gets un-projected back to lon/lat with the inverse of
    that same formula, then re-projected through this map's Mercator
    `project` — the one raw-coordinate source available turns into a layer
    that lines up with this map instead of a second, incompatible
    projection.
    Rendered TWICE further down: once filled (as land, replacing
    BASE_LAND's own approximation of India specifically) and once as thin
    stroke-only internal state lines. The fill matters, not just the
    lines: BASE_LAND (the South Asia dataset) turns out to have almost no
    real vertex detail east of ~67°E in the 25–30°N latitude band — all of
    Northeast India is just a crude straight-line simplification in that
    dataset, cutting off real territory (Arunachal Pradesh alone reaches
    97.4°E). This dataset is properly detailed there, so its fill replaces
    BASE_LAND's for India's own shape; BASE_LAND still supplies Pakistan,
    Afghanistan, Bangladesh, Nepal, Myanmar, Sri Lanka, since there's no
    equivalent detailed source for those here. */
const INDIA_PATH = (() => {
  const { minlon, maxlat, coslat, scale } = INDIA_STATES.proj;
  // String.replace's callback is (fullMatch, group1, group2, ...) — the
  // leading fullMatch param is easy to drop by accident and shifts every
  // group after it (cmd got the full "M12.3,45.6" match, x got "M", …).
  const reproject = (_fullMatch: string, cmd: string, xs: string, ys: string) => {
    const x = parseFloat(xs);
    const y = parseFloat(ys);
    const lon = x / (coslat * scale) + minlon;
    const lat = maxlat - y / scale;
    const [px, py] = project(lon, lat);
    return `${cmd}${px},${py}`;
  };
  return INDIA_STATES.states
    .map((s) => s.d.replace(/([ML])(-?[\d.]+),(-?[\d.]+)/g, reproject))
    .join(" ");
})();

/** Pad a bbox then letterbox/pillarbox it to the panel's aspect ratio,
    symmetrically on every side. */
function frameToAspect(
  [x0, y0, x1, y1]: [number, number, number, number],
  padFrac: number
): VB {
  const w = x1 - x0;
  const h = y1 - y0;
  const px = w * padFrac;
  const py = h * padFrac;
  let vx = x0 - px;
  let vy = y0 - py;
  let vw = w + px * 2;
  let vh = h + py * 2;
  const vAspect = vw / vh;
  if (vAspect < ASPECT) {
    const targetW = vh * ASPECT;
    vx -= (targetW - vw) / 2;
    vw = targetW;
  } else if (vAspect > ASPECT) {
    const targetH = vw / ASPECT;
    vy -= (targetH - vh) / 2;
    vh = targetH;
  }
  return [vx, vy, vw, vh];
}

// The one viewing window this map ever shows — both the default/landing
// view AND the outer pan/zoom-out limit. Deliberately NOT derived from the
// South Asia dataset's own bounding box: that box is set by a pair of
// single-vertex outliers sitting at the exact same latitude (37.2°N,
// spanning the full 60–98° longitude range in one straight line) — almost
// certainly a simplification artifact in the underlying polygon, not real
// coastline/border detail. Fitting tightly to it (or padding it, at any
// fraction) left visible sea-coloured gaps on multiple edges, because the
// real "wide" part of the landmass sits well inside those extremes on every
// side, not just the north.
// Zooming out to see the whole dataset (deep into Central Asia) was the
// original reason FULL_VB was ever wider than the landing view — but that
// meant the fully-zoomed-out state always had the same blue-fringe problem
// the landing view used to have, so there's only one box now, sized to
// contain every current site EXCEPT ONE (Kamboja at 34.94°N and Sutkagan
// Dor at 61.6°E are the two that push this window's north/west edges —
// trimming either back in "for a cleaner box" cuts a real site off the
// map, which happened once already).
// The one deliberate exception is Shortugai (37.35°N, Afghanistan) — a
// couple tenths of a degree past the same 37.2°N artifact latitude
// described above, so including it would reintroduce that exact bug at
// the very top edge. Its own note already frames it as "an isolated
// outpost far to the north", and it's in the Harappan layer (off by
// default), so this is a real, known gap being left as-is rather than
// re-breaking the rest of the map to chase one outlier — not an
// oversight. If a future site falls further outside this window than
// Shortugai already does, these bounds need widening to match: a site
// with no way to pan or zoom to it isn't reachable even via search, since
// search only opens
// its card, it doesn't move the viewport.
// East bound widened to 98°E (was 94°) once the INDIA_PATH fill above made
// Northeast India's real shape available — Arunachal Pradesh alone reaches
// 97.4°E, so anything tighter cropped real Indian territory out of the
// default view, not just an outlier site.
const LANDING_LON: [number, number] = [60.5, 97.5];
const LANDING_LAT: [number, number] = [6, 37];
const landingNW = project(LANDING_LON[0], LANDING_LAT[1]);
const landingSE = project(LANDING_LON[1], LANDING_LAT[0]);
const FULL_VB: VB = frameToAspect(
  [
    Math.min(landingNW[0], landingSE[0]),
    Math.min(landingNW[1], landingSE[1]),
    Math.max(landingNW[0], landingSE[0]),
    Math.max(landingNW[1], landingSE[1]),
  ],
  0.02
);

// Marker/label sizes as a fraction of the current viewBox width, so they
// stay a constant on-screen size regardless of zoom level.
const R_FRAC = 0.0085;
const LFS_FRAC = 0.013;
const LGAP_FRAC = 0.005;
const TOUCH_R_FRAC = 0.02;

const SEARCH_INDEX = [...SITES].sort((a, b) => a.name.localeCompare(b.name));

/** A site's own marker. Plain circle, coloured by the active category, for
    almost everything — single-select layers mean no marker on screen is
    ever ambiguous about which category it's in, so there's no need for a
    shape-per-category legend (dropped along with the old per-category
    marker silhouettes).
    The two edict categories are the deliberate exception: Major vs Minor
    is itself a specific, tested distinction *within* "Rock Edicts" or
    "Pillar Edicts", not just a different category, so those two vary
    shape (circle = Major, square = Minor) and colour by EdictType, via
    inline style rather than the category's CSS class. */
function SiteMark({ site, x, y, r }: { site: Site; x: number; y: number; r: number }) {
  if (site.edictType) {
    const meta = EDICT_TYPE_META[site.edictType];
    // className="as-mark" is still applied — inline style only overrides
    // its fill, the shared stroke/hover-scale rules still apply.
    if (meta.shape === "square") {
      const s = r * 1.05;
      return (
        <rect
          x={x - s}
          y={y - s}
          width={s * 2}
          height={s * 2}
          className="as-mark"
          style={{ fill: meta.color }}
        />
      );
    }
    return <circle cx={x} cy={y} r={r} className="as-mark" style={{ fill: meta.color }} />;
  }
  return <circle cx={x} cy={y} r={r} className="as-mark" />;
}

function CategoryPill({
  active,
  onClick,
  category,
  count,
}: {
  active: boolean;
  onClick: () => void;
  category: SiteCategory;
  count: number;
}) {
  const meta = CATEGORY_META[category];
  return (
    <button
      type="button"
      className={`as-pill ${active ? "on" : ""}`}
      style={{ "--pill-color": meta.color } as React.CSSProperties}
      onClick={onClick}
      aria-pressed={active}
    >
      {meta.label}
      <span className="as-pill-count">{count}</span>
    </button>
  );
}

function SiteCard({
  site,
  onClose,
  panelRef,
}: {
  site: Site;
  onClose: () => void;
  panelRef: React.Ref<HTMLElement>;
}) {
  const meta = CATEGORY_META[site.category];
  return (
    <aside ref={panelRef} className="as-card" role="dialog" aria-label={site.name} tabIndex={-1}>
      <header className="as-card-head">
        <span className="as-card-dot" style={{ background: meta.color }} aria-hidden="true" />
        <div className="as-card-titles">
          <h2 className="as-card-title">{site.name}</h2>
          {site.state && <div className="as-card-sub">{site.state}</div>}
          <div className="as-card-tags">
            <span className="as-tag" style={{ background: meta.color }}>
              {meta.label}
            </span>
            {site.edictType && (
              <span className="as-tag as-tag-sub">{EDICT_TYPE_META[site.edictType].label}</span>
            )}
            {site.kingdom && <span className="as-tag as-tag-sub">{site.kingdom}</span>}
          </div>
        </div>
        <button type="button" className="as-card-x" onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>

      <dl className="as-rows">
        {site.period && (
          <div className="as-row">
            <dt>Period</dt>
            <dd>{site.period}</dd>
          </div>
        )}
        {site.river && (
          <div className="as-row">
            <dt>River</dt>
            <dd>{site.river}</dd>
          </div>
        )}
        <div className="as-row">
          <dt>UPSC note</dt>
          <dd>{site.note}</dd>
        </div>
      </dl>

      {site.features && site.features.length > 0 && (
        <section className="as-features">
          <h3 className="as-features-h">Notable finds / features</h3>
          <ul className="as-feature-list">
            {site.features.map((f) => (
              <li key={f} className="as-feature">
                {f}
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}

export default function AncientSitesMap() {
  const [mode, setMode] = useState<Mode>("learn");
  const [activeCategory, setActiveCategory] = useState<SiteCategory>("port");
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<Site | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);

  const { vb, svgRef, suppressClickRef, onStagePointerDown, zoomButtons, reset } =
    useMapViewport(FULL_VB, FULL_VB, ASPECT);

  const switchMode = useCallback((m: Mode) => {
    setMode(m);
    setSelected(null);
    setRevealed(new Set());
  }, []);

  const isMasked = useCallback(
    (id: string) => mode === "recall" && !revealed.has(id),
    [mode, revealed]
  );

  const visibleSites = useMemo(
    () => SITES.filter((s) => s.category === activeCategory),
    [activeCategory]
  );

  const chooseCategory = useCallback((cat: SiteCategory) => {
    setActiveCategory(cat);
    setSelected(null);
  }, []);

  /** Closes the open card on any stage click that isn't on a site marker
      (those call e.stopPropagation() in clickSite/onClick below) — but not
      after a pan/zoom drag, which also ends in a "click" that
      suppressClickRef is there to swallow. */
  const clickStageBackground = useCallback(() => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setSelected(null);
  }, [suppressClickRef]);

  const clickSite = useCallback(
    (s: Site) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }
      setRevealed((prev) => (prev.has(s.id) ? prev : new Set(prev).add(s.id)));
      setSelected(s);
    },
    [suppressClickRef]
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [] as Site[];
    return SEARCH_INDEX.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 8);
  }, [searchQuery]);

  const goToSearchResult = useCallback((s: Site) => {
    setActiveCategory(s.category);
    setSelected(s);
    setRevealed((prev) => (prev.has(s.id) ? prev : new Set(prev).add(s.id)));
    setSearchQuery("");
    setSearchOpen(false);
  }, []);

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

  const R = R_FRAC * vb[2];
  const LFS = LFS_FRAC * vb[2];
  const LGAP = LGAP_FRAC * vb[2];
  const TOUCH_R = TOUCH_R_FRAC * vb[2];

  const placements = useMemo(() => {
    const labels: LabelInput[] = visibleSites.map((s) => {
      const [x, y] = project(s.lon, s.lat);
      const masked = isMasked(s.id);
      return {
        id: s.id,
        text: masked ? "?" : s.name,
        x,
        y,
        r: R,
        fontSize: LFS,
        priority: 0,
      };
    });
    return placeLabels(labels, LGAP);
  }, [visibleSites, isMasked, R, LFS, LGAP]);

  const countsByCategory = useMemo(() => {
    const counts: Record<SiteCategory, number> = {
      palaeolithic: 0,
      mesolithic: 0,
      neolithic: 0,
      "harappan-early": 0,
      harappan: 0,
      "harappan-late": 0,
      chalcolithic: 0,
      megalithic: 0,
      port: 0,
      mahajanapada: 0,
      "edict-rock": 0,
      "edict-pillar": 0,
      kingdom: 0,
      "world-heritage": 0,
      cave: 0,
      jain: 0,
      buddhist: 0,
      temple: 0,
    };
    SITES.forEach((s) => counts[s.category]++);
    return counts;
  }, []);

  return (
    <div className="as-root">
      <div className="as-workspace">
        <aside className="as-sidebar">
          <div className="as-search" role="search" ref={searchRef}>
            <div className="as-search-box">
              <span className="as-search-ic" aria-hidden="true">
                ⚲
              </span>
              <input
                type="text"
                className="as-search-input"
                placeholder="Search sites…"
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
                aria-label="Search ancient sites"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="as-search-clear"
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
              <ul className="as-search-results">
                {searchResults.length ? (
                  searchResults.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        className="as-search-result"
                        onClick={() => goToSearchResult(s)}
                      >
                        <span className="as-search-name">{s.name}</span>
                        <span className="as-search-meta">{CATEGORY_META[s.category].short}</span>
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="as-search-empty">No sites match &quot;{searchQuery}&quot;</li>
                )}
              </ul>
            )}
          </div>

          <div className="as-modecard" role="group" aria-label="Study mode">
            <button
              type="button"
              className={`as-mode as-mode-learn ${mode === "learn" ? "as-mode-on" : ""}`}
              onClick={() => switchMode("learn")}
              aria-pressed={mode === "learn"}
            >
              Learn Mode
            </button>
            <button
              type="button"
              className={`as-mode as-mode-recall ${mode === "recall" ? "as-mode-on" : ""}`}
              onClick={() => switchMode("recall")}
              aria-pressed={mode === "recall"}
            >
              Recall Mode
            </button>
          </div>

          <div className="as-layerbox">
            <span className="as-lyr-cap">Show</span>
            <div className="as-lyr-col" role="radiogroup" aria-label="Site layer">
              {CATEGORY_ORDER.map((cat) => (
                <CategoryPill
                  key={cat}
                  category={cat}
                  active={activeCategory === cat}
                  count={countsByCategory[cat]}
                  onClick={() => chooseCategory(cat)}
                />
              ))}
            </div>
          </div>

          <button type="button" className="as-lb-reset" onClick={reset} aria-label="Reset view">
            <span className="as-lb-reset-ic" aria-hidden="true">
              ↺
            </span>
            Reset view
          </button>
        </aside>

        <div className="as-mapcol">
          <div className="as-stage">
            <svg
              ref={svgRef}
              className="as-svg as-grab"
              viewBox={vb.join(" ")}
              onPointerDown={onStagePointerDown}
              onClick={clickStageBackground}
              role="img"
              aria-label="Map of ancient South Asia — Harappan, Chalcolithic, Megalithic sites and ports"
            >
              <path d={LAND_PATH} className="as-land" />
              <path d={INDIA_PATH} className="as-india-fill" aria-hidden="true" />
              <path d={INDIA_PATH} className="as-state-border" />
              <path d={BORDER_PATH} className="as-border" />

              {activeCategory === "kingdom" && (
                <g className="as-kingdom-labels" aria-hidden="true">
                  {KINGDOM_LABELS.map((k) => {
                    const [x, y] = project(k.lon, k.lat);
                    const fs = LFS * 0.95;
                    const w = k.name.length * fs * 0.62 + fs * 1.4;
                    const h = fs * 1.9;
                    return (
                      <g key={k.name} className="as-kingdom-label">
                        <rect
                          x={x - w / 2}
                          y={y - h / 2}
                          width={w}
                          height={h}
                          rx={h * 0.18}
                          className="as-kingdom-label-box"
                        />
                        <text x={x} y={y} fontSize={fs} className="as-kingdom-label-text">
                          {k.name}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}

              <g className="as-sites">
                {visibleSites.map((s) => {
                  const [x, y] = project(s.lon, s.lat);
                  const masked = isMasked(s.id);
                  const isHovered = hovered === s.id;
                  const pl = placements.get(s.id);
                  return (
                    <g
                      key={s.id}
                      className={[
                        "as-site-g",
                        `as-cat-${s.category}`,
                        isHovered ? "as-hover" : "",
                        masked ? "as-masked" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onMouseEnter={() => setHovered(s.id)}
                      onMouseLeave={() => setHovered((cur) => (cur === s.id ? null : cur))}
                      onClick={(e) => {
                        e.stopPropagation();
                        clickSite(s);
                      }}
                    >
                      <circle cx={x} cy={y} r={TOUCH_R} className="as-hit" />
                      <SiteMark site={s} x={x} y={y} r={R} />
                      {pl && !pl.hidden && (
                        <>
                          {pl.leader && (
                            <line
                              x1={x}
                              y1={y}
                              x2={pl.x}
                              y2={pl.y - LGAP}
                              className="as-lead"
                            />
                          )}
                          <text
                            x={pl.x}
                            y={pl.y}
                            fontSize={LFS}
                            textAnchor={pl.textAnchor}
                            className={`as-label ${masked ? "as-label-mask" : ""}`}
                          >
                            {masked ? "?" : s.name}
                          </text>
                        </>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>

            {SITES.length === 0 && (
              <div className="as-empty-hint">
                <p>
                  Sites will appear here as they&apos;re added — the map and layer toggles are
                  ready and waiting.
                </p>
              </div>
            )}

            <div className="as-zoombtns">
              <button type="button" className="as-zoom" onClick={() => zoomButtons(0.8)} aria-label="Zoom in">
                +
              </button>
              <button type="button" className="as-zoom" onClick={() => zoomButtons(1.25)} aria-label="Zoom out">
                −
              </button>
            </div>

            {(activeCategory === "edict-rock" || activeCategory === "edict-pillar") && (
              <div className="as-edict-key" aria-label="Major vs Minor key">
                <span className="as-edict-key-dot as-edict-key-circle" aria-hidden="true" />
                Major
                <span className="as-edict-key-dot as-edict-key-square" aria-hidden="true" />
                Minor
              </div>
            )}

            {selected && <SiteCard site={selected} onClose={() => setSelected(null)} panelRef={cardRef} />}
          </div>
        </div>
      </div>
    </div>
  );
}
