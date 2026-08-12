"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  COUNTRY_SHAPES,
  COUNTRY_BY_ISO3,
  VIEW_WIDTH,
  VIEW_HEIGHT,
} from "@/lib/orgs/geo";
import { ORGANIZATIONS, ORG_CATEGORIES } from "@/lib/orgs/organizations";
import { CONTINENT_BY_ISO3, type Continent } from "@/lib/orgs/continents";
import type { Membership, MembershipTier, Organization } from "@/lib/orgs/types";
import SuggestionForm from "@/components/modern-india-timeline/SuggestionForm";
import "./OrgWorldMap.css";

type Mode = "learn" | "recall";
type VB = [number, number, number, number];

const TIER_LABEL: Record<MembershipTier, string> = {
  member: "Member",
  observer: "Observer",
  "dialogue-partner": "Dialogue partner",
};

const ASPECT = VIEW_WIDTH / VIEW_HEIGHT;
const FULL_VB: VB = [0, 0, VIEW_WIDTH, VIEW_HEIGHT];
const ZOOM_MS = 520;
// Below this fraction of the full-world viewBox width, country names start
// appearing — at the zoomed-out default there isn't room to letter every
// one of 241 shapes without it turning to noise, but once a student has
// zoomed into (say) the Gulf or the Baltics, the names are exactly what
// they're zooming in for.
const LABEL_ZOOM_FRACTION = 0.4;
// Constant on-screen size regardless of zoom (same technique as
// labelFontSize below) — a fixed vb-unit radius made the founding-member
// badge balloon to cover the country name once zoomed in.
const FOUNDING_R_FRAC = 0.0027;

const easeInOut = (t: number): number =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

/** One organization's roster, indexed for O(1) per-country lookup while painting. */
function membershipIndex(org: Organization): Map<string, Membership> {
  return new Map(org.members.map((m) => [m.iso3, m]));
}

/** The four legend rows, shared between the desktop overlay and the mobile
    static copy — only the swatch color (the selected org's) ever changes. */
function legendItems(color: string) {
  return (
    <>
      <span>
        <i className="io-legend-swatch io-legend-member" style={{ background: color }} />
        Member
      </span>
      <span>
        <i className="io-legend-swatch io-legend-observer" style={{ borderColor: color, background: color }} />
        Observer
      </span>
      <span>
        <i className="io-legend-swatch io-legend-partner" style={{ borderColor: color }} />
        Dialogue partner
      </span>
      <span>
        <i className="io-legend-dot">F</i>
        Founding member
      </span>
    </>
  );
}

export default function OrgWorldMap() {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    ORGANIZATIONS[0]?.slug ?? null
  );
  // Desktop/tablet only (see .io-tabs' mobile display:none) — which
  // category's pill row is showing under the tab bar. Mobile skips tabs
  // and pills entirely in favour of the search dropdown below.
  const [activeCategory, setActiveCategory] = useState<Organization["category"]>(
    ORGANIZATIONS[0]?.category ?? ORG_CATEGORIES[0]
  );
  const [mode, setMode] = useState<Mode>("learn");
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [activeIso3, setActiveIso3] = useState<string | null>(null);
  const [vb, setVb] = useState<VB>(FULL_VB);
  const searchRef = useRef<HTMLDivElement | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const vbRef = useRef<VB>(FULL_VB);
  const rafRef = useRef<number | null>(null);
  const reduceMotionRef = useRef(false);
  const movedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const panBaseRef = useRef<{ x: number; y: number; vb: VB } | null>(null);
  const pinchBaseRef = useRef<{ d: number; mx: number; my: number; vb: VB } | null>(
    null
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotionRef.current = mq.matches;
    const onChange = () => (reduceMotionRef.current = mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const animateTo = useCallback((to: VB, dur = ZOOM_MS) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (dur <= 0 || reduceMotionRef.current) {
      vbRef.current = to;
      setVb(to);
      return;
    }
    const from = vbRef.current;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = easeInOut(p);
      const cur: VB = [
        from[0] + (to[0] - from[0]) * e,
        from[1] + (to[1] - from[1]) * e,
        from[2] + (to[2] - from[2]) * e,
        from[3] + (to[3] - from[3]) * e,
      ];
      vbRef.current = cur;
      setVb(cur);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  /** Clamp a viewBox width to the allowed zoom range. */
  const clampWidth = useCallback((w: number): number => {
    const minVW = FULL_VB[2] * 0.06; // ~16x zoom-in ceiling — enough to tell GCC's six states apart
    const maxVW = FULL_VB[2]; // zoom-out ceiling is the whole world
    return Math.min(maxVW, Math.max(minVW, w));
  }, []);

  /** Clamp a viewBox: pan is bounded to the whole-world frame. */
  const clampVB = useCallback((v: VB): VB => {
    const w = clampWidth(v[2]);
    const h = w / ASPECT;
    const [bx, by, bw, bh] = FULL_VB;
    const maxX = bx + bw - w;
    const maxY = by + bh - h;
    const x = Math.min(Math.max(v[0], bx), Math.max(bx, maxX));
    const y = Math.min(Math.max(v[1], by), Math.max(by, maxY));
    return [x, y, w, h];
  }, [clampWidth]);

  const pxToVb = useCallback((clientX: number, clientY: number): [number, number] => {
    const el = svgRef.current;
    const v = vbRef.current;
    if (!el) return [v[0] + v[2] / 2, v[1] + v[3] / 2];
    const r = el.getBoundingClientRect();
    return [
      v[0] + ((clientX - r.left) / r.width) * v[2],
      v[1] + ((clientY - r.top) / r.height) * v[3],
    ];
  }, []);

  /** Zoom by `factor` about a point (factor<1 zooms in). */
  const zoomAround = useCallback(
    (cx: number, cy: number, factor = 0.5, dur = ZOOM_MS) => {
      const [x, y, w] = vbRef.current;
      const h = vbRef.current[3];
      const fx = (cx - x) / w;
      const fy = (cy - y) / h;
      const nw = w * factor;
      const nh = nw / ASPECT;
      animateTo(clampVB([cx - fx * nw, cy - fy * nh, nw, nh]), dur);
    },
    [animateTo, clampVB]
  );

  const zoomButtons = useCallback(
    (factor: number) => {
      const [x, y, w, h] = vbRef.current;
      zoomAround(x + w / 2, y + h / 2, factor, 260);
    },
    [zoomAround]
  );

  const onStagePointerDown = useCallback((e: React.PointerEvent) => {
    suppressClickRef.current = false;
    movedRef.current = false;
    if (e.button !== 0) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 1) {
      panBaseRef.current = { x: e.clientX, y: e.clientY, vb: vbRef.current };
      pinchBaseRef.current = null;
    } else if (pointersRef.current.size === 2) {
      const pts = [...pointersRef.current.values()];
      pinchBaseRef.current = {
        d: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
        mx: (pts[0].x + pts[1].x) / 2,
        my: (pts[0].y + pts[1].y) / 2,
        vb: vbRef.current,
      };
      panBaseRef.current = null;
    }
  }, []);

  // Unified drag-to-pan / pinch-to-zoom — window listeners so a drag survives
  // leaving the SVG, and a second finger seamlessly promotes pan → pinch.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!pointersRef.current.has(e.pointerId)) return;
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const el = svgRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();

      if (pointersRef.current.size >= 2 && pinchBaseRef.current) {
        const pts = [...pointersRef.current.values()];
        const nd = Math.max(1, Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y));
        const base = pinchBaseRef.current;
        const factor = base.d / nd;
        const mx = (base.mx - r.left) / r.width;
        const my = (base.my - r.top) / r.height;
        const nvw = clampWidth(base.vb[2] * factor);
        const nvh = nvw / ASPECT;
        const px = base.vb[0] + mx * base.vb[2];
        const py = base.vb[1] + my * base.vb[3];
        const nvb = clampVB([px - mx * nvw, py - my * nvh, nvw, nvh]);
        vbRef.current = nvb;
        setVb(nvb);
        movedRef.current = true;
        return;
      }

      if (pointersRef.current.size === 1 && panBaseRef.current) {
        const dx = e.clientX - panBaseRef.current.x;
        const dy = e.clientY - panBaseRef.current.y;
        if (!movedRef.current && Math.hypot(dx, dy) > 8) movedRef.current = true;
        if (!movedRef.current) return;
        const [x, y, w, h] = panBaseRef.current.vb;
        const nvb = clampVB([x - (dx / r.width) * w, y - (dy / r.height) * h, w, h]);
        vbRef.current = nvb;
        setVb(nvb);
      }
    };

    const onUp = (e: PointerEvent) => {
      pointersRef.current.delete(e.pointerId);
      if (pointersRef.current.size < 2) pinchBaseRef.current = null;
      if (pointersRef.current.size === 1) {
        const p = [...pointersRef.current.values()][0];
        panBaseRef.current = { x: p.x, y: p.y, vb: vbRef.current };
      } else if (pointersRef.current.size === 0) {
        panBaseRef.current = null;
        if (movedRef.current) suppressClickRef.current = true;
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [clampVB, clampWidth]);

  // Non-passive wheel-to-zoom (toward the cursor), bound once to the SVG.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const [cx, cy] = pxToVb(e.clientX, e.clientY);
      const mag = Math.sqrt(Math.min(Math.abs(e.deltaY), 100) / 100);
      const factor = e.deltaY > 0 ? 1 + 0.16 * mag : 1 - 0.14 * mag;
      zoomAround(cx, cy, factor, 0);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [pxToVb, zoomAround]);

  const selectedOrg = useMemo(
    () => ORGANIZATIONS.find((o) => o.slug === selectedSlug) ?? null,
    [selectedSlug]
  );
  const roster = useMemo(
    () => (selectedOrg ? membershipIndex(selectedOrg) : new Map<string, Membership>()),
    [selectedOrg]
  );
  const memberCount = selectedOrg
    ? selectedOrg.members.filter((m) => m.tier === "member").length
    : 0;
  const continentBreakdown = useMemo(() => {
    if (!selectedOrg) return [];
    const names = new Map<Continent, string[]>();
    for (const m of selectedOrg.members) {
      if (m.tier !== "member") continue;
      const cont = CONTINENT_BY_ISO3[m.iso3];
      if (!cont) continue;
      const name = COUNTRY_BY_ISO3.get(m.iso3)?.name ?? m.iso3;
      const list = names.get(cont);
      if (list) list.push(name);
      else names.set(cont, [name]);
    }
    return [...names.entries()]
      .map(([continent, list]) => [continent, list.sort((a, b) => a.localeCompare(b))] as const)
      .sort((a, b) => b[1].length - a[1].length);
  }, [selectedOrg]);
  const foundCount = selectedOrg
    ? selectedOrg.members.filter((m) => m.tier === "member" && revealed.has(m.iso3)).length
    : 0;

  const selectOrg = useCallback(
    (slug: string) => {
      setSelectedSlug(slug);
      setRevealed(new Set());
      setActiveIso3(null);
      const org = ORGANIZATIONS.find((o) => o.slug === slug);
      if (org) setActiveCategory(org.category);
      // A new org's members are rarely wherever the map was last zoomed
      // into — start every selection from the same whole-world framing
      // instead of leaving the student zoomed in on the previous org's region.
      animateTo(FULL_VB);
    },
    [animateTo]
  );

  const pickFromSearch = useCallback(
    (slug: string) => {
      selectOrg(slug);
      setQuery("");
      setSearchOpen(false);
    },
    [selectOrg]
  );

  // Close the search-results dropdown on an outside click — same behaviour
  // as the National Parks tool's search (typing/focusing opens it back up).
  useEffect(() => {
    if (!searchOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!searchRef.current?.contains(e.target as Node)) setSearchOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [searchOpen]);

  const setModeAndReset = useCallback((m: Mode) => {
    setMode(m);
    setRevealed(new Set());
    setActiveIso3(null);
  }, []);

  const handleCountryClick = useCallback(
    (iso3: string) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }
      if (!selectedOrg) return;
      if (mode === "recall") {
        setRevealed((prev) => {
          if (prev.has(iso3)) return prev;
          const next = new Set(prev);
          next.add(iso3);
          return next;
        });
      }
      setActiveIso3(iso3);
    },
    [mode, selectedOrg]
  );

  const revealAll = useCallback(() => {
    if (!selectedOrg) return;
    setRevealed(new Set(selectedOrg.members.map((m) => m.iso3)));
  }, [selectedOrg]);

  const q = query.trim().toLowerCase();
  const filteredOrgs = q
    ? ORGANIZATIONS.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.fullName.toLowerCase().includes(q) ||
          o.category.toLowerCase().includes(q)
      )
    : ORGANIZATIONS;

  const activeMembership = activeIso3 ? roster.get(activeIso3) : undefined;
  const activeName = activeIso3 ? COUNTRY_BY_ISO3.get(activeIso3)?.name : undefined;

  const zoomedIn = vb[2] < FULL_VB[2] * LABEL_ZOOM_FRACTION;
  // Only the selected org's own (shown) members get a name label — every
  // other country would just be noise, and in Recall mode a label appearing
  // on exactly the member countries would hand the answer away for free
  // before a click, so it's gated by the same reveal state as the fill.
  const labelShapes =
    zoomedIn && selectedOrg
      ? COUNTRY_SHAPES.filter((c) => {
          if (!roster.has(c.iso3)) return false;
          return mode === "learn" || revealed.has(c.iso3);
        })
      : [];
  const labelFontSize = Math.max(2.2, vb[2] * 0.007);
  const foundingR = Math.max(1.6, vb[2] * FOUNDING_R_FRAC);

  return (
    <div className="io-root">
      {/* ── controls: Learn/Recall then search, one row above the map —
          same order as the National Parks tool, so the two feel like one series. ── */}
      <div className="io-controls">
        <div className="io-modecard" role="group" aria-label="Study mode">
          <button
            type="button"
            className={`io-mode io-mode-learn ${mode === "learn" ? "io-mode-on" : ""}`}
            onClick={() => setModeAndReset("learn")}
            aria-pressed={mode === "learn"}
          >
            Learn Mode
          </button>
          <button
            type="button"
            className={`io-mode io-mode-recall ${mode === "recall" ? "io-mode-on" : ""}`}
            onClick={() => setModeAndReset("recall")}
            aria-pressed={mode === "recall"}
          >
            Recall Mode
          </button>
        </div>
        {/* On mobile this search box (with its dropdown of matches) is the
            *only* way to pick an organization — the tabs/pills below are
            desktop/tablet-only (see .io-tabs / .io-pillgroups' mobile
            display:none), since a full pill grid doesn't fit a phone
            screen without burying the map. */}
        <div className="io-search" role="search" ref={searchRef}>
          <svg viewBox="0 0 20 20" aria-hidden="true" className="io-search-icon">
            <circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <line x1="13.2" y1="13.2" x2="18" y2="18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search an organization…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => {
              if (query.trim()) setSearchOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && filteredOrgs.length > 0) {
                pickFromSearch(filteredOrgs[0].slug);
              } else if (e.key === "Escape") {
                setQuery("");
                setSearchOpen(false);
              }
            }}
            aria-label="Search international organizations"
          />
          {query && (
            <button
              type="button"
              className="io-search-clear"
              onClick={() => {
                setQuery("");
                setSearchOpen(false);
              }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
          {query.trim() && searchOpen && (
            <ul className="io-search-results">
              {filteredOrgs.length === 0 ? (
                <li className="io-search-empty">No matches</li>
              ) : (
                filteredOrgs.map((o) => (
                  <li key={o.slug}>
                    <button
                      type="button"
                      className="io-search-result"
                      onClick={() => pickFromSearch(o.slug)}
                    >
                      <span className="io-search-result-swatch" style={{ background: o.color }} />
                      <span className="io-search-result-name">{o.name}</span>
                      <span className="io-search-result-meta">{o.category}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>

      {/* ── category tabs + pill row — desktop/tablet browsing UI. Mobile
          relies on the search dropdown above instead (see .io-tabs' media
          query), so a category never needs to be picked to reach an org. ── */}
      <div className="io-tabs" role="tablist" aria-label="Organization category">
        {ORG_CATEGORIES.map((cat) => (
          <button
            type="button"
            key={cat}
            role="tab"
            aria-selected={activeCategory === cat}
            className={`io-tab ${activeCategory === cat ? "io-tab-on" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="io-pillgroups">
        <div className="io-pillrow">
          {ORGANIZATIONS.filter((o) => o.category === activeCategory).map((o) => (
            <button
              type="button"
              key={o.slug}
              className={`io-pill ${selectedSlug === o.slug ? "io-pill-on" : ""}`}
              onClick={() => selectOrg(o.slug)}
              aria-pressed={selectedSlug === o.slug}
              title={o.fullName}
            >
              <span className="io-pill-swatch" style={{ background: o.color }} />
              {o.name}
              <span className="io-pill-count">{o.members.length}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── header for the selected org ── */}
      {selectedOrg && (
        <div className="io-orghead">
          <div>
            <h2 style={{ color: selectedOrg.color }}>{selectedOrg.fullName}</h2>
            <p>
              {selectedOrg.blurb} Founded {selectedOrg.founded} ·{" "}
              {memberCount} member{memberCount === 1 ? "" : "s"}
              {selectedOrg.members.length > memberCount &&
                ` · ${selectedOrg.members.length - memberCount} observer/partner${
                  selectedOrg.members.length - memberCount === 1 ? "" : "s"
                }`}
            </p>
            {continentBreakdown.length > 0 && (
              <ul className="io-continents">
                {continentBreakdown.map(([continent, names]) => (
                  <li key={continent}>
                    <details className="io-continent-detail">
                      <summary>
                        {continent}: {names.length}
                      </summary>
                      <p className="io-continent-names">{names.join(", ")}</p>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {mode === "recall" && (
            <div className="io-recallstat">
              <span>
                {foundCount} / {memberCount} found
              </span>
              <button type="button" onClick={revealAll} className="io-revealall">
                Reveal all
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── the map ── */}
      <div className="io-mapwrap">
        <svg
          ref={svgRef}
          viewBox={vb.join(" ")}
          onPointerDown={onStagePointerDown}
          role="img"
          aria-label={
            selectedOrg
              ? `World map highlighting members of ${selectedOrg.fullName}`
              : "World map"
          }
          className="io-svg io-grab"
        >
          <rect x={0} y={0} width={VIEW_WIDTH} height={VIEW_HEIGHT} className="io-ocean" />
          <g>
            {COUNTRY_SHAPES.map((c) => {
              const m = roster.get(c.iso3);
              const isRevealed = mode === "learn" || revealed.has(c.iso3);
              const shown = isRevealed ? m : undefined;
              const tier = shown?.tier;

              let fill = "var(--io-panel)";
              let stroke = "var(--io-line)";
              let strokeWidth = 0.5;
              let fillOpacity = 1;
              let dash: string | undefined;

              if (selectedOrg && shown) {
                if (tier === "member") {
                  fill = selectedOrg.color;
                } else if (tier === "observer") {
                  fill = selectedOrg.color;
                  fillOpacity = 0.35;
                  stroke = selectedOrg.color;
                  strokeWidth = 1;
                  dash = "3,2";
                } else if (tier === "dialogue-partner") {
                  fill = "var(--io-panel)";
                  stroke = selectedOrg.color;
                  strokeWidth = 1;
                  dash = "1,2";
                }
              }

              return (
                <path
                  key={c.id}
                  d={c.d}
                  fill={fill}
                  fillOpacity={fillOpacity}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeDasharray={dash}
                  className="io-country"
                  onClick={() => handleCountryClick(c.iso3)}
                >
                  <title>{c.name}</title>
                </path>
              );
            })}
            {/* founding-member badges, drawn after fills so they sit on top —
                a bold "F", not a plain dot, and sized to stay a constant
                on-screen size at any zoom (see FOUNDING_R_FRAC) rather than
                the fixed vb-unit radius that used to balloon over the
                country's name once zoomed in. */}
            {selectedOrg &&
              selectedOrg.members
                .filter((m) => m.tier === "member" && m.founding)
                .map((m) => {
                  const isRevealed = mode === "learn" || revealed.has(m.iso3);
                  if (!isRevealed) return null;
                  const shape = COUNTRY_BY_ISO3.get(m.iso3);
                  if (!shape) return null;
                  return (
                    <g key={`founding-${m.iso3}`} className="io-founding-badge">
                      <circle
                        cx={shape.centroid[0]}
                        cy={shape.centroid[1]}
                        r={foundingR}
                      />
                      <text
                        x={shape.centroid[0]}
                        y={shape.centroid[1]}
                        fontSize={foundingR * 1.35}
                      >
                        F
                      </text>
                    </g>
                  );
                })}
            {/* country names — only the selected org's own (shown) members,
                only once zoomed in enough to have room for them. Nudged
                below the founding badge (when there is one) so the two
                don't sit on top of each other. */}
            {labelShapes.map((c) => {
              const isFounding = roster.get(c.iso3)?.founding;
              const dy = isFounding ? foundingR + labelFontSize * 1.1 : 0;
              return (
                <text
                  key={`label-${c.id}`}
                  x={c.centroid[0]}
                  y={c.centroid[1] + dy}
                  fontSize={labelFontSize}
                  className="io-country-label"
                >
                  {c.name}
                </text>
              );
            })}
          </g>
        </svg>

        <div className="io-zoombtns">
          <button
            type="button"
            className="io-zoom"
            onClick={() => zoomButtons(0.7)}
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            className="io-zoom"
            onClick={() => zoomButtons(1 / 0.7)}
            aria-label="Zoom out"
          >
            −
          </button>
        </div>

        {selectedOrg && <div className="io-legend">{legendItems(selectedOrg.color)}</div>}

        {activeIso3 && (
          <div className="io-card">
            <button
              type="button"
              className="io-card-close"
              onClick={() => setActiveIso3(null)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="io-card-name">{activeName ?? activeIso3}</div>
            {selectedOrg &&
              (activeMembership ? (
                <div className="io-card-body">
                  <span className="io-card-tier" style={{ color: selectedOrg.color }}>
                    {TIER_LABEL[activeMembership.tier]}
                    {activeMembership.founding && " · Founding"}
                    {activeMembership.joined && !activeMembership.founding &&
                      ` since ${activeMembership.joined}`}
                  </span>
                  {activeMembership.note && (
                    <p className="io-card-note">{activeMembership.note}</p>
                  )}
                </div>
              ) : (
                <div className="io-card-body">
                  <span className="io-card-not">Not a member of {selectedOrg.name}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Mobile-only duplicate of the legend, rendered in normal page flow
          below the map card instead of overlaid on top of it — an absolute
          overlay small enough to read on a laptop covers a real fraction of
          a phone-width map, so mobile gets its own static, smaller copy
          (see .io-legend-mobile's media query) rather than a repositioned
          version of the same overlay. */}
      {selectedOrg && (
        <div className="io-legend-mobile">{legendItems(selectedOrg.color)}</div>
      )}

      <div className="io-suggest-scope">
        <SuggestionForm
          intro="A wrong member, a missing organization, an outdated accession year — tell us and we'll review it. Every organization here is added and verified by hand, so this is how it gets better."
          examplePlaceholder={`e.g. "BRICS — Indonesia joined in January 2025, this is missing"`}
        />
      </div>
    </div>
  );
}
