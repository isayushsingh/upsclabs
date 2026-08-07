"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import indiaRaw from "@/lib/parks/india.json";
import parksRaw from "@/lib/parks/parks.json";
import reservesRaw from "@/lib/parks/reserves.json";
import riversRaw from "@/lib/parks/rivers.json";
import wetlandsRaw from "@/lib/parks/wetlands.json";
import terrainRaw from "@/lib/parks/terrain.json";
import sanctuariesRaw from "@/lib/parks/sanctuaries.json";
import biosphereRaw from "@/lib/parks/biosphere.json";
import {
  clusterPoints,
  placeLabels,
  isBubble,
  type Cluster,
  type LabelInput,
  type LayoutPoint,
} from "@/lib/parks/layout";
import {
  projectPoint,
  type IndiaMap,
  type Park,
  type Species,
  type TigerReserve,
  type ParksByState,
  type ReservesByState,
  type RiversByState,
  type WetlandsByState,
  type TerrainByState,
  type SanctuariesByState,
  type BiosphereByState,
  type Biosphere,
} from "@/lib/parks/types";
import "./NationalParksMap.css";

const INDIA = indiaRaw as unknown as IndiaMap;
const PARKS = parksRaw as unknown as ParksByState;
const RESERVES = reservesRaw as unknown as ReservesByState;
const RIVERS = riversRaw as unknown as RiversByState;
const WETLANDS = wetlandsRaw as unknown as WetlandsByState;
const TERRAIN = terrainRaw as unknown as TerrainByState;
const SANCTUARIES = sanctuariesRaw as unknown as SanctuariesByState;
const BIOSPHERE = biosphereRaw as unknown as BiosphereByState;
const PROJ = INDIA.proj;

// Some reserves genuinely span multiple states (e.g. Nilgiri, Agasthyamala,
// Achanakmar-Amarkantak) and are duplicated — same name, same coordinates —
// under each state they touch, so the layer still shows up whichever of
// those states is active. Deduping by name collapses them back to one
// circle for the all-India view, where there's no single active state.
const ALL_BIOSPHERE: Biosphere[] = (() => {
  const seen = new Set<string>();
  const list: Biosphere[] = [];
  Object.values(BIOSPHERE).forEach((arr) =>
    arr.forEach((b) => {
      if (!seen.has(b.name)) {
        seen.add(b.name);
        list.push(b);
      }
    })
  );
  return list;
})();

interface SearchItem {
  id: string;
  type: "park" | "reserve" | "wetland" | "biosphere";
  name: string;
  state: string;
  /** Index within that state's array — reconstructs the id used elsewhere
      (e.g. `np:${state}:${idx}`) so the same lookups/reveal logic apply. */
  idx: number;
  mab?: boolean;
}

/** Flat, searchable index across every layer with a name — built once, not
    per-render. Biosphere reserves that span multiple states appear once per
    state (matching how the map itself keys them), which is a feature here:
    each row is a distinct jump-to-this-state destination. */
const SEARCH_INDEX: SearchItem[] = (() => {
  const items: SearchItem[] = [];
  Object.entries(PARKS).forEach(([state, arr]) =>
    arr.forEach((p, i) => items.push({ id: `np:${state}:${i}`, type: "park", name: p.name, state, idx: i }))
  );
  Object.entries(RESERVES).forEach(([state, arr]) =>
    arr.forEach((r, i) => items.push({ id: `tr:${state}:${i}`, type: "reserve", name: r.name, state, idx: i }))
  );
  Object.entries(WETLANDS).forEach(([state, arr]) =>
    arr.forEach((w, i) => items.push({ id: `wet:${state}:${i}`, type: "wetland", name: w.name, state, idx: i }))
  );
  Object.entries(BIOSPHERE).forEach(([state, arr]) =>
    arr.forEach((b, i) =>
      items.push({ id: `bio:${state}:${i}`, type: "biosphere", name: b.name, state, idx: i, mab: b.mab })
    )
  );
  return items;
})();

const SEARCH_TYPE_LABEL: Record<SearchItem["type"], string> = {
  park: "National Park",
  reserve: "Tiger Reserve",
  wetland: "Wetland",
  biosphere: "Biosphere Reserve",
};

type VB = [number, number, number, number];

const RAW_VB = INDIA.viewBox as VB;
const PANEL_ASPECT = 1.1; // must match .np-stage's CSS aspect-ratio exactly
const ASPECT = PANEL_ASPECT;
const BBOX_PAD = 0.08;

/** Pad a bbox then letterbox it to the panel's aspect ratio. */
function frameToAspect(
  [x, y, w, h]: [number, number, number, number],
  padFrac: number
): VB {
  const px = w * padFrac;
  const py = h * padFrac;
  let nx = x - px;
  let ny = y - py;
  let nw = w + 2 * px;
  let nh = h + 2 * py;
  if (nw / nh > ASPECT) {
    const t = nw / ASPECT;
    ny -= (t - nh) / 2;
    nh = t;
  } else {
    const t = nh * ASPECT;
    nx -= (t - nw) / 2;
    nw = t;
  }
  return [nx, ny, nw, nh];
}

/** Like frameToAspect, but crops the excess dimension (symmetric) instead of
    padding it — a "cover" fit rather than "contain". Used only for the
    initial all-India view: showing the whole outline with no cropping tends
    to add a lot of blank letterbox space once the panel gets taller/narrower
    than India's own bounding-box aspect ratio, whereas a touch of zoom (with
    panning to reach the cropped edges) reads better and fills the frame. */
function frameToCover(
  [x, y, w, h]: [number, number, number, number],
  padFrac: number
): VB {
  const px = w * padFrac;
  const py = h * padFrac;
  let nx = x - px;
  let ny = y - py;
  let nw = w + 2 * px;
  let nh = h + 2 * py;
  if (nw / nh > ASPECT) {
    const t = nh * ASPECT;
    nx += (nw - t) / 2;
    nw = t;
  } else {
    const t = nw / ASPECT;
    ny += (nh - t) / 2;
    nh = t;
  }
  return [nx, ny, nw, nh];
}
// FULL_VB is the true, uncropped fit — it's the pan boundary and the
// zoom-out ceiling, so every part of India must stay reachable through it.
const FULL_VB: VB = frameToAspect(RAW_VB, 0);
// LANDING_VB is what actually loads on screen: a touch of zoom into that
// same view (cropping instead of letterboxing), since panning is enabled
// on the India overview too — nothing becomes unreachable, it's just not
// all visible on the very first paint.
const LANDING_VB: VB = frameToCover(RAW_VB, 0.02);
const STATE_LABEL_FS = LANDING_VB[2] * 0.011; // India-overview label size (+2px)
const ZOOM_MS = 620;

// Marker / label sizes as a fraction of the current viewBox width, so they stay
// a constant on-screen size regardless of zoom level.
const R_FRAC = 0.008; // marker radius
const LFS_FRAC = 0.018; // park label font-size (+2px)
const LGAP_FRAC = 0.005; // marker→label gap
// Faint context layers — subordinate size hierarchy: park > river > wetland ≈ terrain.
const RIVER_FRAC = 0.0147; // river label font-size (+2px)
const WET_FRAC = 0.016; // wetland label font-size (+2px)
const HILL_FRAC = 0.0108; // terrain label font-size (enlarged for legibility)
const DROP_FRAC = 0.006; // wetland droplet size
const SANCT_FRAC = 0.0137; // sanctuary label font-size (+2px)
const SANCT_SQ_FRAC = 0.0095; // sanctuary square marker half-size
const BIO_FRAC = 0.0118; // biosphere hover-label font-size
// Invisible touch-target radius for every clickable marker (park, reserve,
// bubble, wetland) — comfortably bigger than any of their visual glyphs, so
// a finger on a phone/tablet doesn't have to land pixel-perfectly on a small
// or oddly-shaped icon (the wetland droplet's pointed tip was the worst case).
const TOUCH_R_FRAC = 0.02;
// Tuned so dense sets cluster exactly as the validated prototype did
// (Kerala's High-Range sholas → one 3-bubble; Telangana's Hyderabad trio → 3).
const CLUSTER_FRAC = 0.04;
const BUBBLE_R_FRAC = 0.0105; // counted-bubble radius
const LEAD_GAP_FRAC = 0.0015;

/** IUCN Red List category colours (official scheme). */
const IUCN_COLOR: Record<string, string> = {
  CR: "#D81E05",
  EN: "#FC7F3F",
  VU: "#F4DC1A",
  NT: "#CCE226",
  LC: "#60C659",
};
/** Dark text on the light VU/NT/LC pills. */
const IUCN_DARK = new Set(["VU", "NT", "LC"]);

type Mode = "learn" | "recall";

const easeInOut = (t: number): number =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

/** Semicircle path (top→bottom), left or right half of a circle. */
const halfCircle = (cx: number, cy: number, r: number, right: boolean): string =>
  `M${cx},${cy - r} A${r},${r} 0 0 ${right ? 1 : 0} ${cx},${cy + r} Z`;

/** Teardrop path centred on (x, y); w controls size. */
const dropletPath = (x: number, y: number, w: number): string =>
  `M${x},${y + w} C${x - 0.76 * w},${y + 0.3 * w} ${x - 0.76 * w},${y - 0.48 * w} ${x},${y - w} ` +
  `C${x + 0.76 * w},${y - 0.48 * w} ${x + 0.76 * w},${y + 0.3 * w} ${x},${y + w} Z`;

interface LayerState {
  np: boolean;
  tr: boolean;
  rivers: boolean;
  wetlands: boolean;
  terrain: boolean;
  sanctuaries: boolean;
  biosphere: boolean;
}

function LayerChip({
  on,
  onClick,
  variant,
  disabled = false,
  children,
}: {
  on: boolean;
  onClick: () => void;
  variant: "np" | "tr" | "riv" | "wet" | "hill" | "sanct" | "bios";
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      className={`np-chip np-chip-${variant} ${on ? "on" : ""}`}
      onClick={onClick}
      aria-pressed={on}
      disabled={disabled}
    >
      <span className="np-sw" aria-hidden="true" />
      {children}
    </button>
  );
}


interface SelectedInfo {
  id: string;
  name: string;
  kind: "park" | "reserve";
  state: string;
  park?: Park;
  reserve?: TigerReserve;
}

function SpeciesRow({ sp }: { sp: Species }) {
  const [name, iucn, flags] = sp;
  return (
    <li className="np-sp">
      <span className="np-sp-name">{name}</span>
      <span
        className={`np-pill ${IUCN_DARK.has(iucn) ? "np-pill-dark" : ""}`}
        style={{ background: IUCN_COLOR[iucn] }}
      >
        {iucn}
      </span>
      {flags.includes("end") && (
        <span className="np-flag" title="Endemic">
          ✦
        </span>
      )}
      {flags.includes("state") && (
        <span className="np-flag" title="State animal / bird">
          ◆
        </span>
      )}
    </li>
  );
}

function Card({
  sel,
  onClose,
  panelRef,
}: {
  sel: SelectedInfo;
  onClose: () => void;
  panelRef: React.Ref<HTMLElement>;
}) {
  const p = sel.park;
  const r = sel.reserve;
  const species = p?.species ?? r?.species ?? [];
  const note = p?.note ?? r?.note ?? "";
  const isTR = sel.kind === "reserve" || !!p?.tr;

  return (
    <aside
      ref={panelRef}
      className="np-card"
      role="dialog"
      aria-label={sel.name}
      tabIndex={-1}
    >
      <header className="np-card-head">
        <span
          className={`np-card-dot ${
            sel.kind === "reserve" ? "np-dot-amb" : p?.tr ? "np-dot-split" : "np-dot-np"
          }`}
          aria-hidden="true"
        />
        <div className="np-card-titles">
          <h2 className="np-card-title">{sel.name}</h2>
          <div className="np-card-sub">{sel.state}</div>
          <div className="np-card-tags">
            {sel.kind === "reserve" ? (
              <span className="np-tag np-tag-tr">Tiger Reserve</span>
            ) : (
              <>
                <span className="np-tag np-tag-np">National Park</span>
                {isTR && <span className="np-tag np-tag-tr">Tiger Reserve</span>}
              </>
            )}
          </div>
        </div>
        <button className="np-card-x" onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>

      {p && (p.bio || p.whs || p.ramsar || p.iba || p.elephant) && (
        <div className="np-badges">
          {p.whs && <span className="np-badge np-badge-whs">UNESCO WHS</span>}
          {p.bio && <span className="np-badge np-badge-bio">Biosphere Reserve</span>}
          {p.ramsar && <span className="np-badge np-badge-ram">Ramsar Site</span>}
          {p.elephant && <span className="np-badge np-badge-ele">Elephant Reserve</span>}
          {p.iba && (
            <span
              className="np-badge np-badge-iba"
              title="Important Bird and Biodiversity Area"
            >
              IBA
            </span>
          )}
        </div>
      )}

      <dl className="np-rows">
        {p && (
          <>
            <div className="np-row">
              <dt>River</dt>
              <dd>{p.river}</dd>
            </div>
            <div className="np-row">
              <dt>Vegetation</dt>
              <dd>{p.veg}</dd>
            </div>
          </>
        )}
        <div className="np-row">
          <dt>UPSC note</dt>
          <dd>{note}</dd>
        </div>
      </dl>

      {species.length > 0 && (
        <section className="np-species">
          <h3 className="np-species-h">Key species</h3>
          <ul className="np-sp-list">
            {species.slice(0, 7).map((sp) => (
              <SpeciesRow key={sp[0]} sp={sp} />
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}

const DEFAULT_LAYERS: LayerState = {
  np: true,
  tr: false,
  rivers: false,
  wetlands: false,
  terrain: false,
  sanctuaries: false,
  biosphere: false,
};

export default function NationalParksMap() {
  const [activeState, setActiveState] = useState<string | null>(null);
  const [vb, setVb] = useState<VB>(LANDING_VB);
  const [layers, setLayers] = useState<LayerState>(DEFAULT_LAYERS);
  const [mode, setMode] = useState<Mode>("learn");
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<SelectedInfo | null>(null);
  const [hoveredBio, setHoveredBio] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const vbRef = useRef<VB>(LANDING_VB);
  const rafRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);
  const fitVBRef = useRef<VB>(LANDING_VB); // the "fit" viewBox of the active state
  const activeStateRef = useRef<string | null>(null); // for long-lived listeners
  const movedRef = useRef(false); // drag exceeded threshold
  const suppressClickRef = useRef(false); // ignore click that ends a drag
  const reduceMotionRef = useRef(false);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const panBaseRef = useRef<{ x: number; y: number; vb: VB } | null>(null);
  const pinchBaseRef = useRef<{ d: number; mx: number; my: number; vb: VB } | null>(
    null
  );

  const toggle = useCallback(
    (k: keyof LayerState) => setLayers((l) => ({ ...l, [k]: !l[k] })),
    []
  );

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

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  // Detect reduced-motion preference (drives animateTo).
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotionRef.current = mq.matches;
    const h = () => (reduceMotionRef.current = mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  // Close the search dropdown on an outside click (but not on every
  // keystroke — typing keeps it open via onChange/onFocus below).
  useEffect(() => {
    if (!searchOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!searchRef.current?.contains(e.target as Node)) setSearchOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [searchOpen]);

  // Escape closes the card; focus moves into it on open.
  useEffect(() => {
    if (!selected) return;
    cardRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const hasData = useCallback((name: string) => name in PARKS, []);

  const enterState = useCallback(
    (name: string) => {
      // Re-clicking the already-active state's shape is easy to do by
      // accident while aiming for a nearby marker — it must not re-run the
      // "enter a state" reset (revealed markers, selected card) or the user
      // loses everything they've uncovered in Recall mode for a stray click.
      if (name === activeStateRef.current) return;
      const shape = INDIA.states.find((s) => s.name === name);
      if (!shape) return;
      const fit = frameToAspect(shape.bbox, BBOX_PAD);
      fitVBRef.current = fit;
      activeStateRef.current = name;
      setActiveState(name);
      setSelected(null);
      setRevealed(new Set());
      setHoveredBio(null);
      animateTo(fit);
    },
    [animateTo]
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [] as SearchItem[];
    return SEARCH_INDEX.filter(
      (it) => it.name.toLowerCase().includes(q) || it.state.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery]);

  /** Jump to a search result's state and surface the item itself — opens its
      card for parks/reserves, or reveals/hover-highlights it for the
      card-less wetland and biosphere layers (turning that layer on too). */
  const goToSearchResult = useCallback(
    (item: SearchItem) => {
      enterState(item.state);
      if (item.type === "park") {
        const park = (PARKS[item.state] ?? [])[item.idx];
        if (park) {
          setSelected({ id: item.id, name: item.name, kind: "park", state: item.state, park });
          setRevealed(new Set([item.id]));
        }
      } else if (item.type === "reserve") {
        const reserve = (RESERVES[item.state] ?? [])[item.idx];
        if (reserve) {
          setSelected({
            id: item.id,
            name: item.name,
            kind: "reserve",
            state: item.state,
            reserve,
          });
          setRevealed(new Set([item.id]));
        }
      } else if (item.type === "wetland") {
        setLayers((l) => ({ ...l, wetlands: true }));
        setRevealed(new Set([item.id]));
      } else {
        setLayers((l) => ({ ...l, biosphere: true }));
        setHoveredBio(item.id);
      }
      setSearchQuery("");
      setSearchOpen(false);
    },
    [enterState]
  );

  /** Clamp a viewBox width to the allowed zoom range (per active state). */
  const clampWidth = useCallback((w: number): number => {
    const fit = fitVBRef.current;
    const minVW = fit[2] * 0.16; // max zoom-in (~6× the state fit)
    const maxVW = FULL_VB[2]; // zoom-out ceiling is the whole-India view
    return Math.min(maxVW, Math.max(minVW, w));
  }, []);

  /** Clamp a viewBox: zoom-in depth is relative to the active state, but the
      user may zoom out all the way to the full India view and pan freely across
      neighbouring states (so a card overlapping a marker can be scrolled off). */
  const clampVB = useCallback((v: VB): VB => {
    const w = clampWidth(v[2]);
    const h = w / ASPECT;
    // Pan bounds = the full India frame, so panning is not locked to one state.
    const [bx, by, bw, bh] = FULL_VB;
    const maxX = bx + bw - w;
    const maxY = by + bh - h;
    const x = Math.min(Math.max(v[0], bx), Math.max(bx, maxX));
    const y = Math.min(Math.max(v[1], by), Math.max(by, maxY));
    return [x, y, w, h];
  }, [clampWidth]);

  /** Screen pixel → viewBox coordinates. */
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

  /** Zoom by `factor` about a point (factor<1 zooms in). Splits bubbles at 0.5. */
  const zoomAround = useCallback(
    (cx: number, cy: number, factor = 0.5, dur = 360) => {
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

  /** Pointer-down: starts a one-finger pan, or (on a second pointer) a pinch-zoom. */
  const onStagePointerDown = useCallback((e: React.PointerEvent) => {
    // A fresh gesture starts here — any suppression flag left over from an
    // earlier drag (whose resulting click landed on a button/chip that never
    // consumed it) must not bleed into this click. This must run even when
    // there's no active state (the India overview): otherwise a leftover
    // `movedRef=true` from a drag made just before hitting "Reset" can never
    // clear, and the window-level pointerup listener (unscoped to activeState)
    // keeps re-arming suppressClickRef on every subsequent click, silently
    // swallowing every state click until the page is refreshed.
    suppressClickRef.current = false;
    movedRef.current = false;
    // Pan/pinch work on the India overview too — the landing view is a
    // deliberate crop, and states outside it must stay reachable by drag,
    // not just by clicking one that's already visible.
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

  // Unified drag-to-pan / pinch-to-zoom (window listeners so a drag survives
  // leaving the SVG, and a second finger seamlessly promotes pan → pinch).
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
  // Trackpads fire dozens of wheel events per gesture, each with a small
  // deltaY (often single digits), while mouse wheels fire a handful of large
  // discrete jumps (deltaY ~100+). A linear normalization makes trackpad
  // deltas register as a tiny sliver of the mouse's per-notch zoom, so the
  // same physical scroll effort feels far weaker — a sqrt curve boosts small
  // deltas disproportionately while leaving large ones roughly where they
  // were, keeping both input types feeling similarly responsive.
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


  const exitToIndia = useCallback(() => {
    activeStateRef.current = null;
    fitVBRef.current = LANDING_VB;
    setActiveState(null);
    setSelected(null);
    setRevealed(new Set());
    setHoveredBio(null);
    setLayers(DEFAULT_LAYERS);
    animateTo(LANDING_VB);
  }, [animateTo]);

  // Project the point set for the active state. Parks appear when the National
  // Parks layer is on; reserves when the Tiger Reserves layer is on — so
  // clustering reacts to exactly the visible set.
  const points = useMemo<LayoutPoint[]>(() => {
    if (!activeState) return [];
    const parks: LayoutPoint[] = layers.np
      ? (PARKS[activeState] ?? []).map((p, i) => {
          const [x, y] = projectPoint(PROJ, p.lon, p.lat);
          return {
            id: `np:${activeState}:${i}`,
            name: p.name,
            x,
            y,
            priority: p.tr ? 3 : 2,
            kind: "park",
          };
        })
      : [];
    const reserves: LayoutPoint[] = layers.tr
      ? (RESERVES[activeState] ?? []).map((r, i) => {
          const [x, y] = projectPoint(PROJ, r.lon, r.lat);
          return {
            id: `tr:${activeState}:${i}`,
            name: r.name,
            x,
            y,
            priority: 1,
            kind: "reserve",
          };
        })
      : [];
    return [...parks, ...reserves];
  }, [activeState, layers.np, layers.tr]);

  /** Lookup from LayoutPoint id back to its source record (for styling). */
  const sourceById = useMemo(() => {
    const m = new Map<string, { tr: boolean; kind: "park" | "reserve" }>();
    if (!activeState) return m;
    (PARKS[activeState] ?? []).forEach((p, i) =>
      m.set(`np:${activeState}:${i}`, { tr: p.tr, kind: "park" })
    );
    (RESERVES[activeState] ?? []).forEach((_, i) =>
      m.set(`tr:${activeState}:${i}`, { tr: true, kind: "reserve" })
    );
    return m;
  }, [activeState]);

  // Cluster at the current zoom, then declutter the labels of singletons.
  const clusters = useMemo<Cluster[]>(
    () => clusterPoints(points, CLUSTER_FRAC * vb[2]),
    [points, vb]
  );

  /** In Recall mode every point (park and reserve) is masked until clicked. */
  const isMasked = useCallback(
    (id: string) => mode === "recall" && !revealed.has(id),
    [mode, revealed]
  );

  const openPoint = useCallback(
    (m: LayoutPoint) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }
      if (!activeState) return;
      setRevealed((prev) => {
        if (prev.has(m.id)) return prev;
        const next = new Set(prev);
        next.add(m.id);
        return next;
      });
      const idx = Number(m.id.split(":")[2]);
      if (m.kind === "park") {
        const park = (PARKS[activeState] ?? [])[idx];
        setSelected({
          id: m.id,
          name: m.name,
          kind: "park",
          state: activeState,
          park,
        });
      } else {
        const reserve = (RESERVES[activeState] ?? [])[idx];
        setSelected({
          id: m.id,
          name: m.name,
          kind: "reserve",
          state: activeState,
          reserve,
        });
      }
    },
    [activeState]
  );

  /** Reveal a masked context marker (e.g. wetland) without opening a card. */
  const revealOnly = useCallback((id: string) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setRevealed((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const switchMode = useCallback((m: Mode) => {
    setMode(m);
    setSelected(null);
    setRevealed(new Set());
  }, []);

  // Faint context layers (rivers pre-projected; wetlands/terrain projected here).
  // Rivers/wetlands/terrain/sanctuaries only make sense within a chosen state
  // (too dense to show nationwide); biosphere reserves are large enough and
  // few enough to show at the all-India level too, so that one isn't gated
  // on activeState — it falls back to a deduped nationwide list instead.
  const faint = useMemo(() => {
    const rivers = activeState
      ? (RIVERS[activeState] ?? []).map((r) => {
          const pts = r.pts;
          const anchor = pts.length
            ? pts[Math.floor(pts.length * 0.45)]
            : ([0, 0] as [number, number]);
          return { name: r.name, d: r.d, anchor };
        })
      : [];
    const wetlands = activeState
      ? (WETLANDS[activeState] ?? []).map((w, i) => ({
          id: `wet:${activeState}:${i}`,
          name: w.name,
          xy: projectPoint(PROJ, w.lon, w.lat),
        }))
      : [];
    const terrain = activeState
      ? (TERRAIN[activeState] ?? []).map((t, i) => ({
          id: `ter:${activeState}:${i}`,
          name: t.name,
          sym: t.sym,
          xy: projectPoint(PROJ, t.lon, t.lat),
        }))
      : [];
    const sanctuaries = activeState
      ? (SANCTUARIES[activeState] ?? []).map((s, i) => ({
          id: `sanct:${activeState}:${i}`,
          name: s.name,
          xy: projectPoint(PROJ, s.lon, s.lat),
        }))
      : [];
    // Rough circle, not a surveyed boundary: radius (in degrees) is scaled
    // the same way the projection scales lon/lat, so it reads as roughly
    // circular rather than a squashed ellipse at India's latitudes.
    const bioSource = activeState ? BIOSPHERE[activeState] ?? [] : ALL_BIOSPHERE;
    const biosphere = bioSource.map((b, i) => ({
      id: `bio:${activeState ?? "all"}:${i}`,
      name: b.name,
      mab: b.mab,
      xy: projectPoint(PROJ, b.lon, b.lat),
      rx: b.radius * PROJ.coslat * PROJ.scale,
      ry: b.radius * PROJ.scale,
    }));
    return { rivers, wetlands, terrain, sanctuaries, biosphere };
  }, [activeState]);

  // Unified label declutter — every currently-visible point layer (parks,
  // reserves, wetlands, sanctuaries, terrain) competes for label slots in one
  // pass, so a wetland label never overlaps a park label even though their
  // markers are drawn independently. Markers themselves never move — only
  // labels shift, gaining a leader line back to the true point when they do.
  const placements = useMemo(() => {
    // Masked points render a "?" instead of a name, so they don't enter declutter.
    const maskedNow = (id: string) => mode === "recall" && !revealed.has(id);

    const singles = clusters
      .filter((c) => !isBubble(c))
      .filter((c) => !maskedNow(c.members[0].id));
    const parkLabels: LabelInput[] = singles.map((c) => ({
      id: c.id,
      text: c.members[0].name,
      x: c.x,
      y: c.y,
      r: R_FRAC * vb[2],
      fontSize: LFS_FRAC * vb[2],
      priority: c.members[0].priority,
    }));

    const wetLabels: LabelInput[] = layers.wetlands
      ? faint.wetlands
          .filter((w) => !maskedNow(w.id))
          .map((w) => ({
            id: w.id,
            text: w.name,
            x: w.xy[0],
            y: w.xy[1],
            r: DROP_FRAC * vb[2],
            fontSize: WET_FRAC * vb[2],
            priority: 0.5,
          }))
      : [];

    const sanctLabels: LabelInput[] = layers.sanctuaries
      ? faint.sanctuaries.map((s) => ({
          id: s.id,
          text: s.name,
          x: s.xy[0],
          y: s.xy[1],
          r: SANCT_SQ_FRAC * vb[2],
          fontSize: SANCT_FRAC * vb[2],
          priority: 0.4,
        }))
      : [];

    const terrainLabels: LabelInput[] = layers.terrain
      ? faint.terrain.map((t) => ({
          id: t.id,
          text: t.sym ? `${t.sym} ${t.name}` : t.name,
          x: t.xy[0],
          y: t.xy[1],
          r: 0,
          fontSize: HILL_FRAC * vb[2],
          priority: 0.2,
        }))
      : [];

    return placeLabels(
      [...parkLabels, ...wetLabels, ...sanctLabels, ...terrainLabels],
      LGAP_FRAC * vb[2]
    );
  }, [clusters, vb, mode, revealed, layers.wetlands, layers.sanctuaries, layers.terrain, faint]);

  // Zoom-independent on-screen sizing.
  const R = R_FRAC * vb[2];
  const LFS = LFS_FRAC * vb[2];
  const LGAP = LGAP_FRAC * vb[2];
  const RIVER_FS = RIVER_FRAC * vb[2];
  const WET_FS = WET_FRAC * vb[2];
  const HILL_FS = HILL_FRAC * vb[2];
  const DROP = DROP_FRAC * vb[2];
  const SANCT_FS = SANCT_FRAC * vb[2];
  const SANCT_SQ = SANCT_SQ_FRAC * vb[2];
  const BIO_FS = BIO_FRAC * vb[2];
  const TOUCH_R = TOUCH_R_FRAC * vb[2];
  const BUB_R = BUBBLE_R_FRAC * vb[2];
  const LEAD_GAP = LEAD_GAP_FRAC * vb[2];

  return (
    <div className="np-root">
      {/* master controls: search + Learn/Recall, one row above the map —
          not sidebar-bound, since both apply to the whole tool. */}
      <div className="np-controlbar">
        <div className="np-modecard" role="group" aria-label="Study mode">
          <button
            className={`np-mode np-mode-learn ${
              mode === "learn" ? "np-mode-on" : ""
            }`}
            onClick={() => switchMode("learn")}
            aria-pressed={mode === "learn"}
          >
            Learn Mode
          </button>
          <button
            className={`np-mode np-mode-recall ${
              mode === "recall" ? "np-mode-on" : ""
            }`}
            onClick={() => switchMode("recall")}
            aria-pressed={mode === "recall"}
          >
            Recall Mode
          </button>
        </div>

        <div className="np-search" role="search" ref={searchRef}>
          <div className="np-search-box">
            <span className="np-search-ic" aria-hidden="true">
              ⚲
            </span>
            <input
              type="text"
              className="np-search-input"
              placeholder="Search parks, reserves, wetlands…"
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
              aria-label="Search parks, tiger reserves, wetlands and biosphere reserves"
            />
            {searchQuery && (
              <button
                type="button"
                className="np-search-clear"
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
          {searchQuery.trim() && searchOpen && (
            <ul className="np-search-results">
              {searchResults.length === 0 ? (
                <li className="np-search-empty">No matches</li>
              ) : (
                searchResults.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      className="np-search-result"
                      onClick={() => goToSearchResult(r)}
                    >
                      <span className="np-search-name">{r.name}</span>
                      <span className="np-search-meta">
                        {SEARCH_TYPE_LABEL[r.type]} · {r.state}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>

      <div className="np-workspace">
        {/* standalone left column — layer menu, reset — lives outside the
            map frame so it never overlaps markers/cards. */}
        <aside className="np-sidebar">
          <div className="np-layerbox">
            <span className="np-lyr-cap">Layers</span>
            <div className="np-lyr-col" role="group" aria-label="Map layers">
              <LayerChip
                variant="bios"
                on={layers.biosphere}
                onClick={() => toggle("biosphere")}
              >
                Biosphere Reserves
              </LayerChip>
              <LayerChip
                variant="np"
                on={layers.np}
                disabled={!activeState}
                onClick={() => toggle("np")}
              >
                National Parks
              </LayerChip>
              <LayerChip
                variant="tr"
                on={layers.tr}
                disabled={!activeState}
                onClick={() => toggle("tr")}
              >
                Tiger Reserves
              </LayerChip>
              <LayerChip
                variant="riv"
                on={layers.rivers}
                disabled={!activeState}
                onClick={() => toggle("rivers")}
              >
                Rivers
              </LayerChip>
              <LayerChip
                variant="wet"
                on={layers.wetlands}
                disabled={!activeState}
                onClick={() => toggle("wetlands")}
              >
                Wetlands
              </LayerChip>
              {/* Terrain toggle hidden from the menu — layer/data/rendering
                  code stays intact (layers.terrain, faint.terrain, etc.),
                  it's just not polished enough to expose yet. Re-add the
                  LayerChip below (variant="hill") when it's ready. */}
              <LayerChip
                variant="sanct"
                on={layers.sanctuaries}
                disabled={!activeState}
                onClick={() => toggle("sanctuaries")}
              >
                Wildlife Sanctuaries
              </LayerChip>
            </div>
          </div>

          <button
            className="np-lb-reset"
            onClick={exitToIndia}
            aria-label="Reset to All India view"
          >
            <span className="np-lb-reset-ic" aria-hidden="true">
              ↺
            </span>
            Reset to All India
          </button>
        </aside>

        <div className="np-mapcol">
        <div className="np-stage">
        <svg
          ref={svgRef}
          className="np-svg np-grab"
          viewBox={vb.join(" ")}
          onPointerDown={onStagePointerDown}
          role="img"
          aria-label={
            activeState ? `Map of ${activeState}` : "Map of India — pick a state"
          }
        >
          <g>
            {INDIA.states.map((s) => {
              const clickable = hasData(s.name);
              const isActive = s.name === activeState;
              return (
                <path
                  key={s.name}
                  d={s.d}
                  className={[
                    "np-state",
                    clickable ? "np-has-data" : "",
                    isActive ? "np-active" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={
                    clickable
                      ? () => {
                          if (suppressClickRef.current) {
                            suppressClickRef.current = false;
                            return;
                          }
                          enterState(s.name);
                        }
                      : undefined
                  }
                />
              );
            })}
          </g>

          {!activeState && (
            <g className="np-statelabels" aria-hidden="true">
              {INDIA.states.map((s) => {
                if (!hasData(s.name)) return null;
                const cx = s.bbox[0] + s.bbox[2] / 2;
                const cy = s.bbox[1] + s.bbox[3] / 2;
                return (
                  <text
                    key={s.name}
                    x={cx}
                    y={cy}
                    className="np-statelabel"
                    textAnchor="middle"
                    fontSize={STATE_LABEL_FS}
                  >
                    {s.name}
                  </text>
                );
              })}
            </g>
          )}

          {/* ── faint context layers (under markers) ── */}
          {layers.biosphere && (
            <g className="np-bioreserves">
              <defs>
                <radialGradient id="np-bio-grad">
                  <stop offset="0%" stopColor="var(--bio)" stopOpacity="0.28" />
                  <stop offset="70%" stopColor="var(--bio)" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="var(--bio)" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="np-bio-grad-mab">
                  <stop offset="0%" stopColor="var(--bio-mab)" stopOpacity="0.22" />
                  <stop offset="70%" stopColor="var(--bio-mab)" stopOpacity="0.11" />
                  <stop offset="100%" stopColor="var(--bio-mab)" stopOpacity="0" />
                </radialGradient>
              </defs>
              {faint.biosphere.map((b) => {
                const [cx, cy] = b.xy;
                return (
                  <ellipse
                    key={b.id}
                    cx={cx}
                    cy={cy}
                    rx={b.rx}
                    ry={b.ry}
                    className={`np-bio-circle ${b.mab ? "np-bio-mab" : ""}`}
                    fill={b.mab ? "url(#np-bio-grad-mab)" : "url(#np-bio-grad)"}
                    onMouseEnter={() => setHoveredBio(b.id)}
                    onMouseLeave={() =>
                      setHoveredBio((cur) => (cur === b.id ? null : cur))
                    }
                  />
                );
              })}
            </g>
          )}

          {activeState && layers.rivers && (
            <g className="np-rivers" aria-hidden="true">
              {faint.rivers.map((r) => (
                <g key={`riv-${r.name}`}>
                  <path d={r.d} className="np-river" />
                  <text
                    x={r.anchor[0]}
                    y={r.anchor[1] - LGAP}
                    fontSize={RIVER_FS}
                    className="np-riverlabel"
                  >
                    {r.name}
                  </text>
                </g>
              ))}
            </g>
          )}

          {activeState && layers.wetlands && (
            <g className="np-wetlands">
              {faint.wetlands.map((w) => {
                const [cx, cy] = w.xy;
                const masked = isMasked(w.id);
                const pl = placements.get(w.id);
                return (
                  <g
                    key={w.id}
                    className="np-wet-g"
                    onClick={() => revealOnly(w.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        revealOnly(w.id);
                      }
                    }}
                    aria-label={masked ? "Hidden wetland — click to reveal" : w.name}
                  >
                    <circle cx={cx} cy={cy} r={TOUCH_R} className="np-touch-target" />
                    <path d={dropletPath(cx, cy, DROP)} className="np-wet" />
                    {masked ? (
                      <text
                        x={cx}
                        y={cy + DROP + WET_FS}
                        fontSize={WET_FS}
                        textAnchor="middle"
                        className="np-wetlabel np-mask"
                      >
                        ?
                      </text>
                    ) : (
                      pl &&
                      !pl.hidden && (
                        <>
                          {pl.leader && (
                            <line
                              x1={cx}
                              y1={cy}
                              x2={pl.x}
                              y2={pl.y - LEAD_GAP}
                              className="np-lead"
                            />
                          )}
                          <text
                            x={pl.x}
                            y={pl.y}
                            fontSize={WET_FS}
                            textAnchor={pl.textAnchor}
                            className="np-wetlabel"
                          >
                            {w.name}
                          </text>
                        </>
                      )
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {activeState && layers.terrain && (
            <g className="np-terrain" aria-hidden="true">
              {faint.terrain.map((t) => {
                const [cx, cy] = t.xy;
                const pl = placements.get(t.id);
                const text = t.sym ? `${t.sym} ${t.name}` : t.name;
                if (!pl || pl.hidden) return null;
                return (
                  <g key={t.id}>
                    {pl.leader && (
                      <line
                        x1={cx}
                        y1={cy}
                        x2={pl.x}
                        y2={pl.y - LEAD_GAP}
                        className="np-lead"
                      />
                    )}
                    <text
                      x={pl.x}
                      y={pl.y}
                      fontSize={HILL_FS}
                      textAnchor={pl.textAnchor}
                      className="np-hilllabel"
                    >
                      {text}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {activeState && layers.sanctuaries && (
            <g className="np-sanctuaries" aria-hidden="true">
              {faint.sanctuaries.map((s) => {
                const [cx, cy] = s.xy;
                const pl = placements.get(s.id);
                return (
                  <g key={s.id}>
                    <rect
                      x={cx - SANCT_SQ}
                      y={cy - SANCT_SQ}
                      width={SANCT_SQ * 2}
                      height={SANCT_SQ * 2}
                      className="np-sanct"
                    />
                    {pl && !pl.hidden && (
                      <>
                        {pl.leader && (
                          <line
                            x1={cx}
                            y1={cy}
                            x2={pl.x}
                            y2={pl.y - LEAD_GAP}
                            className="np-lead"
                          />
                        )}
                        <text
                          x={pl.x}
                          y={pl.y}
                          fontSize={SANCT_FS}
                          textAnchor={pl.textAnchor}
                          className="np-sanctlabel"
                        >
                          {s.name}
                        </text>
                      </>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* ── markers (clustered) ── */}
          {activeState && (
            <g className="np-markers">
              {clusters.map((c) => {
                if (isBubble(c)) {
                  return (
                    <g
                      key={c.id}
                      className="np-bubble-g"
                      onClick={() => {
                        if (suppressClickRef.current) {
                          suppressClickRef.current = false;
                          return;
                        }
                        zoomAround(c.x, c.y);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          zoomAround(c.x, c.y);
                        }
                      }}
                      aria-label={`${c.members.length} parks here — zoom to split`}
                    >
                      <circle cx={c.x} cy={c.y} r={TOUCH_R} className="np-touch-target" />
                      <circle cx={c.x} cy={c.y} r={BUB_R} className="np-bubble" />
                      <text
                        x={c.x}
                        y={c.y}
                        fontSize={BUB_R * 1.15}
                        className="np-bubble-count"
                      >
                        {c.members.length}
                      </text>
                    </g>
                  );
                }

                const m = c.members[0];
                const src = sourceById.get(m.id);
                const split = layers.tr && src?.kind === "park" && src.tr;
                const isReserve = src?.kind === "reserve";
                const pl = placements.get(c.id);
                const masked = isMasked(m.id);
                const isSel = selected?.id === m.id;

                return (
                  <g
                    key={c.id}
                    className={`np-mrk-g ${isSel ? "np-mrk-sel" : ""}`}
                    onClick={() => openPoint(m)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openPoint(m);
                      }
                    }}
                    aria-label={masked ? "Hidden park — click to reveal" : m.name}
                  >
                    <circle cx={c.x} cy={c.y} r={TOUCH_R} className="np-touch-target" />
                    {split ? (
                      <>
                        <path d={halfCircle(c.x, c.y, R, false)} className="np-half-np" />
                        <path d={halfCircle(c.x, c.y, R, true)} className="np-half-amb" />
                        <circle cx={c.x} cy={c.y} r={R} className="np-mrk-ring" />
                      </>
                    ) : (
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r={R}
                        className={`np-mrk ${isReserve ? "np-mrk-amb" : "np-mrk-np"}`}
                      />
                    )}

                    {masked ? (
                      <text
                        x={c.x}
                        y={c.y - R - LGAP}
                        fontSize={LFS}
                        textAnchor="middle"
                        className="np-mrklabel np-mask"
                      >
                        ?
                      </text>
                    ) : (
                      pl &&
                      !pl.hidden && (
                        <>
                          {pl.leader && (
                            <line
                              x1={c.x}
                              y1={c.y}
                              x2={pl.x}
                              y2={pl.y - LEAD_GAP}
                              className="np-lead"
                            />
                          )}
                          <text
                            x={pl.x}
                            y={pl.y}
                            fontSize={LFS}
                            textAnchor={pl.textAnchor}
                            className="np-mrklabel"
                          >
                            {m.name}
                          </text>
                        </>
                      )
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* Biosphere hover label — rendered last so it paints above every
              marker/label layer, not just its own (backmost) circle layer. */}
          {layers.biosphere &&
            hoveredBio &&
            (() => {
              const b = faint.biosphere.find((x) => x.id === hoveredBio);
              if (!b) return null;
              const [cx, cy] = b.xy;
              return (
                <text
                  x={cx}
                  y={cy}
                  fontSize={BIO_FS}
                  textAnchor="middle"
                  className="np-biolabel"
                >
                  {b.name}
                  {b.mab ? " (UNESCO MAB)" : ""}
                </text>
              );
            })()}
        </svg>

        {activeState && (
          <div className="np-zoombtns">
            <button
              className="np-zoom"
              onClick={() => zoomButtons(0.8)}
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              className="np-zoom"
              onClick={() => zoomButtons(1.25)}
              aria-label="Zoom out"
            >
              −
            </button>
          </div>
        )}

        </div>

        {/* Card lives outside .np-stage (not clipped by its overflow:hidden)
            so that on mobile it can drop into normal document flow below the
            map frame instead of floating on top of it — see .np-card's
            mobile override in the CSS. */}
        {selected && (
          <Card
            sel={selected}
            onClose={() => setSelected(null)}
            panelRef={cardRef}
          />
        )}
        </div>
      </div>

      {/* ── legends: marker key + IUCN key — bottom of the whole page,
          horizontal, not tucked under the sidebar. ── */}
      <div className="np-footnote">
        <div className="np-fn-markers" aria-label="Marker key">
          <span>
            <i className="np-lg np-lg-np" />
            National Park
          </span>
          <span>
            <i className="np-lg np-lg-both" />
            NP + Tiger Reserve
          </span>
          <span>
            <i className="np-lg np-lg-amb" />
            Tiger Reserve
          </span>
        </div>

        <div className="np-fn-iucn" aria-label="IUCN Red List key">
          <b>IUCN Status</b>
          <div className="np-iucn-pills">
            {(["CR", "EN", "VU", "NT", "LC"] as const).map((k) => (
              <span
                key={k}
                className={`np-iucn ${IUCN_DARK.has(k) ? "np-pill-dark" : ""}`}
                style={{ background: IUCN_COLOR[k] }}
              >
                {k}
              </span>
            ))}
          </div>
          <span className="np-fn-flags">
            <span>✦ endemic</span>
            <span>◆ state animal</span>
          </span>
        </div>
      </div>
    </div>
  );
}
