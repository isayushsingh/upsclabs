"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import indiaRaw from "@/lib/parks/india.json";
import parksRaw from "@/lib/parks/parks.json";
import reservesRaw from "@/lib/parks/reserves.json";
import riversRaw from "@/lib/parks/rivers.json";
import wetlandsRaw from "@/lib/parks/wetlands.json";
import terrainRaw from "@/lib/parks/terrain.json";
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
} from "@/lib/parks/types";
import "./NationalParksMap.css";

const INDIA = indiaRaw as unknown as IndiaMap;
const PARKS = parksRaw as unknown as ParksByState;
const RESERVES = reservesRaw as unknown as ReservesByState;
const RIVERS = riversRaw as unknown as RiversByState;
const WETLANDS = wetlandsRaw as unknown as WetlandsByState;
const TERRAIN = terrainRaw as unknown as TerrainByState;
const PROJ = INDIA.proj;

type VB = [number, number, number, number];

const RAW_VB = INDIA.viewBox as VB;
const PANEL_ASPECT = 1.32; // matches the framed map panel (HTML aesthetic)
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
const FULL_VB: VB = frameToAspect(RAW_VB, 0);
const STATE_LABEL_FS = FULL_VB[2] * 0.0082; // India-overview label size
const ZOOM_MS = 620;

// Marker / label sizes as a fraction of the current viewBox width, so they stay
// a constant on-screen size regardless of zoom level.
const R_FRAC = 0.008; // marker radius
const LFS_FRAC = 0.015; // park label font-size (enlarged for readability)
const LGAP_FRAC = 0.005; // marker→label gap
// Faint context layers — subordinate size hierarchy: park > river > wetland ≈ terrain.
const RIVER_FRAC = 0.0118; // river label font-size (enlarged for legibility)
const WET_FRAC = 0.0108; // wetland label font-size (enlarged for legibility)
const HILL_FRAC = 0.0108; // terrain label font-size (enlarged for legibility)
const DROP_FRAC = 0.006; // wetland droplet size
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
  variant: "np" | "tr" | "riv" | "wet" | "hill";
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

      {p && (p.bio || p.whs || p.ramsar) && (
        <div className="np-badges">
          {p.whs && <span className="np-badge np-badge-whs">UNESCO WHS</span>}
          {p.bio && <span className="np-badge np-badge-bio">Biosphere Reserve</span>}
          {p.ramsar && <span className="np-badge np-badge-ram">Ramsar Site</span>}
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
            {species.slice(0, 3).map((sp) => (
              <SpeciesRow key={sp[0]} sp={sp} />
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}

export default function NationalParksMap() {
  const [activeState, setActiveState] = useState<string | null>(null);
  const [vb, setVb] = useState<VB>(FULL_VB);
  const [layers, setLayers] = useState<LayerState>({
    np: true,
    tr: false,
    rivers: false,
    wetlands: false,
    terrain: false,
  });
  const [mode, setMode] = useState<Mode>("learn");
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<SelectedInfo | null>(null);
  const vbRef = useRef<VB>(FULL_VB);
  const rafRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);
  const fitVBRef = useRef<VB>(FULL_VB); // the "fit" viewBox of the active state
  const activeStateRef = useRef<string | null>(null); // for long-lived listeners
  const movedRef = useRef(false); // drag exceeded threshold
  const suppressClickRef = useRef(false); // ignore click that ends a drag
  const reduceMotionRef = useRef(false);

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
      const shape = INDIA.states.find((s) => s.name === name);
      if (!shape) return;
      const fit = frameToAspect(shape.bbox, BBOX_PAD);
      fitVBRef.current = fit;
      activeStateRef.current = name;
      setActiveState(name);
      setSelected(null);
      setRevealed(new Set());
      animateTo(fit);
    },
    [animateTo]
  );

  /** Clamp a viewBox: zoom-in depth is relative to the active state, but the
      user may zoom out all the way to the full India view and pan freely across
      neighbouring states (so a card overlapping a marker can be scrolled off). */
  const clampVB = useCallback((v: VB): VB => {
    const fit = fitVBRef.current;
    const minVW = fit[2] * 0.16; // max zoom-in (~6× the state fit)
    const maxVW = FULL_VB[2]; // zoom-out ceiling is the whole-India view
    const w = Math.min(maxVW, Math.max(minVW, v[2]));
    const h = w / ASPECT;
    // Pan bounds = the full India frame, so panning is not locked to one state.
    const [bx, by, bw, bh] = FULL_VB;
    const maxX = bx + bw - w;
    const maxY = by + bh - h;
    const x = Math.min(Math.max(v[0], bx), Math.max(bx, maxX));
    const y = Math.min(Math.max(v[1], by), Math.max(by, maxY));
    return [x, y, w, h];
  }, []);

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

  /** Drag-to-pan (window listeners so the drag survives leaving the SVG). */
  const onStagePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!activeStateRef.current || e.button !== 0) return;
      const start = { x: e.clientX, y: e.clientY, vb: vbRef.current };
      movedRef.current = false;
      const move = (ev: PointerEvent) => {
        const dx = ev.clientX - start.x;
        const dy = ev.clientY - start.y;
        if (!movedRef.current && Math.hypot(dx, dy) > 4) movedRef.current = true;
        if (!movedRef.current) return;
        const el = svgRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const [x, y, w, h] = start.vb;
        const nvb = clampVB([
          x - (dx / r.width) * w,
          y - (dy / r.height) * h,
          w,
          h,
        ]);
        vbRef.current = nvb;
        setVb(nvb);
      };
      const up = () => {
        if (movedRef.current) suppressClickRef.current = true;
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [clampVB]
  );

  // Non-passive wheel-to-zoom (toward the cursor), bound once to the SVG.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!activeStateRef.current) return;
      e.preventDefault();
      const [cx, cy] = pxToVb(e.clientX, e.clientY);
      zoomAround(cx, cy, e.deltaY > 0 ? 1.18 : 0.85, 0);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [pxToVb, zoomAround]);


  const exitToIndia = useCallback(() => {
    activeStateRef.current = null;
    fitVBRef.current = FULL_VB;
    setActiveState(null);
    setSelected(null);
    setRevealed(new Set());
    animateTo(FULL_VB);
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

  const placements = useMemo(() => {
    // Masked points render a "?" instead of a name, so they don't enter declutter.
    const maskedNow = (id: string) => mode === "recall" && !revealed.has(id);

    const singles = clusters
      .filter((c) => !isBubble(c))
      .filter((c) => !maskedNow(c.members[0].id));
    const labels: LabelInput[] = singles.map((c) => ({
      id: c.id,
      text: c.members[0].name,
      x: c.x,
      y: c.y,
      r: R_FRAC * vb[2],
      priority: c.members[0].priority,
    }));
    return placeLabels(labels, LFS_FRAC * vb[2], LGAP_FRAC * vb[2]);
  }, [clusters, vb, mode, revealed]);

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

  const switchMode = useCallback((m: Mode) => {
    setMode(m);
    setSelected(null);
    setRevealed(new Set());
  }, []);

  // Faint context layers (rivers pre-projected; wetlands/terrain projected here).
  const faint = useMemo(() => {
    if (!activeState)
      return {
        rivers: [] as { name: string; d: string; anchor: [number, number] }[],
        wetlands: [] as { name: string; xy: [number, number] }[],
        terrain: [] as { name: string; sym: string; xy: [number, number] }[],
      };
    const rivers = (RIVERS[activeState] ?? []).map((r) => {
      const pts = r.pts;
      const anchor = pts.length
        ? pts[Math.floor(pts.length * 0.45)]
        : ([0, 0] as [number, number]);
      return { name: r.name, d: r.d, anchor };
    });
    const wetlands = (WETLANDS[activeState] ?? []).map((w) => ({
      name: w.name,
      xy: projectPoint(PROJ, w.lon, w.lat),
    }));
    const terrain = (TERRAIN[activeState] ?? []).map((t) => ({
      name: t.name,
      sym: t.sym,
      xy: projectPoint(PROJ, t.lon, t.lat),
    }));
    return { rivers, wetlands, terrain };
  }, [activeState]);

  // Zoom-independent on-screen sizing.
  const R = R_FRAC * vb[2];
  const LFS = LFS_FRAC * vb[2];
  const LGAP = LGAP_FRAC * vb[2];
  const RIVER_FS = RIVER_FRAC * vb[2];
  const WET_FS = WET_FRAC * vb[2];
  const HILL_FS = HILL_FRAC * vb[2];
  const DROP = DROP_FRAC * vb[2];
  const BUB_R = BUBBLE_R_FRAC * vb[2];
  const LEAD_GAP = LEAD_GAP_FRAC * vb[2];

  return (
    <div className="np-root">
        <div className="np-headrow">
          <div className="np-headtext">
            <h1 className="np-title">
              National Parks &amp; Tiger Reserves
              <span className="np-wip">Work in progress</span>
            </h1>
            <p className="np-sub">
              Pick a state, then reveal the parks. Data is provisional and
              unverified — not for final revision.
            </p>
          </div>
          <div className="np-modes" role="group" aria-label="Study mode">
            <button
              className={`np-mode np-mode-learn ${
                mode === "learn" ? "np-mode-on" : ""
              }`}
              onClick={() => switchMode("learn")}
              aria-pressed={mode === "learn"}
            >
              Learn <em>read &amp; review</em>
            </button>
            <button
              className={`np-mode np-mode-recall ${
                mode === "recall" ? "np-mode-on" : ""
              }`}
              onClick={() => switchMode("recall")}
              aria-pressed={mode === "recall"}
            >
              Recall <em>test yourself</em>
            </button>
          </div>
        </div>

      <div className="np-workspace">
        <div className="np-stage">
          {/* floating layer menu (top-left of the frame) — inert until a state is picked */}
          <div className="np-layerbox">
            <div className="np-layerbox-head">
              <span className="np-lb-icon" aria-hidden="true">
                ▤
              </span>
              <span className="np-lb-title">{activeState ?? "All India Map"}</span>
              {activeState && (
                <button
                  className="np-lb-reset"
                  onClick={exitToIndia}
                  aria-label="Back to All India view"
                  title="Back to All India"
                >
                  ↺
                </button>
              )}
            </div>
            <div
              className={`np-lyr-col ${activeState ? "" : "np-lyr-off"}`}
              role="group"
              aria-label="Map layers"
            >
              <span className="np-lyr-cap">Map Layers</span>
              {!activeState && (
                <p className="np-lyr-hint">Select a state to interact</p>
              )}
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
              <LayerChip
                variant="hill"
                on={layers.terrain}
                disabled={!activeState}
                onClick={() => toggle("terrain")}
              >
                Terrain
              </LayerChip>
            </div>
          </div>

        <svg
          ref={svgRef}
          className={`np-svg ${activeState ? "np-grab" : ""}`}
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
                  onClick={clickable ? () => enterState(s.name) : undefined}
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
            <g className="np-wetlands" aria-hidden="true">
              {faint.wetlands.map((w) => {
                const [cx, cy] = w.xy;
                return (
                  <g key={`wet-${w.name}`}>
                    <path d={dropletPath(cx, cy, DROP)} className="np-wet" />
                    <text
                      x={cx}
                      y={cy + DROP + WET_FS}
                      fontSize={WET_FS}
                      className="np-wetlabel"
                    >
                      {w.name}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {activeState && layers.terrain && (
            <g className="np-terrain" aria-hidden="true">
              {faint.terrain.map((t) => {
                const [cx, cy] = t.xy;
                return (
                  <text
                    key={`ter-${t.name}`}
                    x={cx}
                    y={cy}
                    fontSize={HILL_FS}
                    className="np-hilllabel"
                  >
                    {t.sym ? `${t.sym} ${t.name}` : t.name}
                  </text>
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
        </svg>

        {activeState && (
          <div className="np-zoombtns">
            <button
              className="np-zoom"
              onClick={() => zoomButtons(0.7)}
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              className="np-zoom"
              onClick={() => zoomButtons(1.43)}
              aria-label="Zoom out"
            >
              −
            </button>
          </div>
        )}

        {selected && (
          <Card
            sel={selected}
            onClose={() => setSelected(null)}
            panelRef={cardRef}
          />
        )}
        </div>

        {/* ── footnote: legends live outside the map frame ── */}
        <div className="np-footnote">
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
        </div>
      </div>
    </div>
  );
}
