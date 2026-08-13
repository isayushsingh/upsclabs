"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import continentsRaw from "@/lib/worldmap/continents.json";
import southAmericaRaw from "@/lib/worldmap/south-america.json";
import northAmericaRaw from "@/lib/worldmap/north-america.json";
import africaRaw from "@/lib/worldmap/africa.json";
import europeRaw from "@/lib/worldmap/europe.json";
import asiaRaw from "@/lib/worldmap/asia.json";
import australiaOceaniaRaw from "@/lib/worldmap/australia-oceania.json";
import citiesRaw from "@/lib/worldmap/cities.json";
import riversRaw from "@/lib/worldmap/rivers.json";
import lakesRaw from "@/lib/worldmap/lakes.json";
import mountainsRaw from "@/lib/worldmap/mountains.json";
import terrainRaw from "@/lib/worldmap/terrain.json";
import oceansRaw from "@/lib/worldmap/oceans.json";
import {
  clusterPoints,
  placeLabels,
  isBubble,
  type Cluster,
  type LabelInput,
  type LayoutPoint,
} from "@/lib/worldmap/layout";
import {
  projectPoint,
  riverPath,
  type ContinentMap,
  type ContinentMeta,
  type City,
  type River,
  type Lake,
  type Peak,
  type Terrain,
  type WaterBody,
  type CitiesByCountry,
  type RiversByCountry,
  type LakesByCountry,
  type PeaksByCountry,
  type TerrainByCountry,
} from "@/lib/worldmap/types";
import "./WorldMap.css";

const CONTINENTS = continentsRaw as unknown as ContinentMeta[];

// Every continent's shape file is its own JSON (each needs its own
// projection/viewBox) — add a new one here and flip `ready: true` in
// continents.json once it's wired up. Country geometry throughout is real
// (Natural Earth borders via world-50m.json, the same source lib/orgs uses),
// reprojected per continent — remote overseas territories that would blow
// out a country's own zoom-to-fit bbox (Alaska/Hawaii, French Guiana,
// Svalbard, Prince Edward Islands, ...) are filtered out at generation time.
const MAPS: Record<string, ContinentMap | undefined> = {
  "south-america": southAmericaRaw as unknown as ContinentMap,
  "north-america": northAmericaRaw as unknown as ContinentMap,
  africa: africaRaw as unknown as ContinentMap,
  europe: europeRaw as unknown as ContinentMap,
  asia: asiaRaw as unknown as ContinentMap,
  "australia-oceania": australiaOceaniaRaw as unknown as ContinentMap,
};
// Layer data lives in one file per layer, nested by continent id — real
// content (not placeholder), and grows automatically as continents are added
// above without touching this lookup.
const CITIES = citiesRaw as unknown as Record<string, CitiesByCountry>;
const RIVERS = riversRaw as unknown as Record<string, RiversByCountry>;
const LAKES = lakesRaw as unknown as Record<string, LakesByCountry>;
const MOUNTAINS = mountainsRaw as unknown as Record<string, PeaksByCountry>;
const TERRAIN = terrainRaw as unknown as Record<string, TerrainByCountry>;
const OCEANS = oceansRaw as unknown as Record<string, WaterBody[]>;

interface SearchItem {
  id: string;
  type: "city" | "lake" | "peak" | "terrain";
  name: string;
  country: string;
  idx: number;
}

const SEARCH_TYPE_LABEL: Record<SearchItem["type"], string> = {
  city: "City",
  lake: "Lake",
  peak: "Peak / Volcano",
  terrain: "Physical Feature",
};

type VB = [number, number, number, number];

const PANEL_ASPECT = 1.1; // must match .wm-stage's CSS aspect-ratio exactly
const ASPECT = PANEL_ASPECT;
const BBOX_PAD = 0.1;

function frameToAspect([x, y, w, h]: VB, padFrac: number): VB {
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

const ZOOM_MS = 620;
const R_FRAC = 0.009; // city marker radius
const CAP_R_FRAC = 0.013; // capital marker radius
const LFS_FRAC = 0.019; // city label font-size
const LGAP_FRAC = 0.006;
const RIVER_FRAC = 0.015;
const LAKE_FRAC = 0.016;
const PEAK_FRAC = 0.0135;
const TERRAIN_FRAC = 0.0125;
const WATER_FRAC = 0.017;
const DROP_FRAC = 0.006;
const TOUCH_R_FRAC = 0.02;
const CLUSTER_FRAC = 0.045;
const BUBBLE_R_FRAC = 0.011;
const LEAD_GAP_FRAC = 0.0015;

type Mode = "learn" | "recall";

const easeInOut = (t: number): number =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

/** Small triangular peak glyph, apex up, centred on (x, y). */
const peakPath = (x: number, y: number, w: number): string =>
  `M${x},${y - w} L${x + w},${y + w * 0.8} L${x - w},${y + w * 0.8} Z`;

/** Teardrop path for lakes — same glyph language as the parks tool's wetlands. */
const dropletPath = (x: number, y: number, w: number): string =>
  `M${x},${y + w} C${x - 0.76 * w},${y + 0.3 * w} ${x - 0.76 * w},${y - 0.48 * w} ${x},${y - w} ` +
  `C${x + 0.76 * w},${y - 0.48 * w} ${x + 0.76 * w},${y + 0.3 * w} ${x},${y + w} Z`;

interface LayerState {
  political: boolean;
  rivers: boolean;
  mountains: boolean;
  terrain: boolean;
}

const DEFAULT_LAYERS: LayerState = {
  political: true,
  rivers: false,
  mountains: false,
  terrain: false,
};

function LayerChip({
  on,
  onClick,
  variant,
  disabled = false,
  children,
}: {
  on: boolean;
  onClick: () => void;
  variant: "pol" | "riv" | "mtn" | "ter";
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      className={`wm-chip wm-chip-${variant} ${on ? "on" : ""}`}
      onClick={onClick}
      aria-pressed={on}
      disabled={disabled}
    >
      <span className="wm-sw" aria-hidden="true" />
      {children}
    </button>
  );
}

interface SelectedInfo {
  id: string;
  name: string;
  country: string;
  city: City;
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
  return (
    <aside ref={panelRef} className="wm-card" role="dialog" aria-label={sel.name} tabIndex={-1}>
      <header className="wm-card-head">
        <span
          className={`wm-card-dot ${sel.city.capital ? "wm-dot-cap" : "wm-dot-city"}`}
          aria-hidden="true"
        />
        <div className="wm-card-titles">
          <h2 className="wm-card-title">{sel.name}</h2>
          <div className="wm-card-sub">{sel.country}</div>
          <div className="wm-card-tags">
            {sel.city.capital ? (
              <span className="wm-tag wm-tag-cap">Capital</span>
            ) : (
              <span className="wm-tag wm-tag-city">Major City</span>
            )}
          </div>
        </div>
        <button className="wm-card-x" onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>
      <dl className="wm-rows">
        <div className="wm-row">
          <dt>Why it matters</dt>
          <dd>{sel.city.note}</dd>
        </div>
      </dl>
    </aside>
  );
}

export default function WorldMap() {
  const [continent, setContinent] = useState<string>("south-america");
  const CONT_META = CONTINENTS.find((c) => c.id === continent) ?? CONTINENTS[0];
  const MAP = MAPS[continent];

  const RAW_VB = (MAP?.viewBox ?? [0, 0, 100, 100]) as VB;
  const FULL_VB = useMemo(() => frameToAspect(RAW_VB, 0.02), [RAW_VB]);
  const STATE_LABEL_FS = FULL_VB[2] * 0.013;

  const [activeCountry, setActiveCountry] = useState<string | null>(null);
  const [vb, setVb] = useState<VB>(FULL_VB);
  const [layers, setLayers] = useState<LayerState>(DEFAULT_LAYERS);
  const [mode, setMode] = useState<Mode>("learn");
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<SelectedInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const vbRef = useRef<VB>(FULL_VB);
  const rafRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);
  const fitVBRef = useRef<VB>(FULL_VB);
  const activeCountryRef = useRef<string | null>(null);
  const movedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const reduceMotionRef = useRef(false);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const panBaseRef = useRef<{ x: number; y: number; vb: VB } | null>(null);
  const pinchBaseRef = useRef<{ d: number; mx: number; my: number; vb: VB } | null>(null);

  // Reset the whole map state whenever the continent pill changes.
  const switchContinent = useCallback((id: string) => {
    const meta = CONTINENTS.find((c) => c.id === id);
    if (!meta?.ready) return;
    setContinent(id);
    setActiveCountry(null);
    activeCountryRef.current = null;
    setSelected(null);
    setRevealed(new Set());
    setLayers(DEFAULT_LAYERS);
    setMode("learn");
    setSearchQuery("");
  }, []);

  const CITIES_BY_COUNTRY = CITIES[continent] ?? {};
  const RIVERS_BY_COUNTRY = RIVERS[continent] ?? {};
  const LAKES_BY_COUNTRY = LAKES[continent] ?? {};
  const MOUNTAINS_BY_COUNTRY = MOUNTAINS[continent] ?? {};
  const TERRAIN_BY_COUNTRY = TERRAIN[continent] ?? {};
  const WATER = OCEANS[continent] ?? [];

  const SEARCH_INDEX: SearchItem[] = useMemo(() => {
    const items: SearchItem[] = [];
    Object.entries(CITIES_BY_COUNTRY).forEach(([country, arr]) =>
      arr.forEach((c, i) => items.push({ id: `city:${country}:${i}`, type: "city", name: c.name, country, idx: i }))
    );
    Object.entries(LAKES_BY_COUNTRY).forEach(([country, arr]) =>
      arr.forEach((l, i) => items.push({ id: `lake:${country}:${i}`, type: "lake", name: l.name, country, idx: i }))
    );
    Object.entries(MOUNTAINS_BY_COUNTRY).forEach(([country, arr]) =>
      arr.forEach((p, i) => items.push({ id: `peak:${country}:${i}`, type: "peak", name: p.name, country, idx: i }))
    );
    Object.entries(TERRAIN_BY_COUNTRY).forEach(([country, arr]) =>
      arr.forEach((t, i) => items.push({ id: `ter:${country}:${i}`, type: "terrain", name: t.name, country, idx: i }))
    );
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [continent]);

  const toggle = useCallback((k: keyof LayerState) => setLayers((l) => ({ ...l, [k]: !l[k] })), []);

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

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotionRef.current = mq.matches;
    const h = () => (reduceMotionRef.current = mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
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

  const hasData = useCallback((name: string) => name in CITIES_BY_COUNTRY, [CITIES_BY_COUNTRY]);

  const enterCountry = useCallback(
    (name: string) => {
      if (name === activeCountryRef.current || !MAP) return;
      const shape = MAP.countries.find((s) => s.name === name);
      if (!shape) return;
      const fit = frameToAspect(shape.bbox, BBOX_PAD);
      fitVBRef.current = fit;
      activeCountryRef.current = name;
      setActiveCountry(name);
      setSelected(null);
      setRevealed(new Set());
      animateTo(fit);
    },
    [animateTo, MAP]
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [] as SearchItem[];
    return SEARCH_INDEX.filter(
      (it) => it.name.toLowerCase().includes(q) || it.country.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery, SEARCH_INDEX]);

  const goToSearchResult = useCallback(
    (item: SearchItem) => {
      enterCountry(item.country);
      if (item.type === "city") {
        const city = (CITIES_BY_COUNTRY[item.country] ?? [])[item.idx];
        if (city) {
          setSelected({ id: item.id, name: item.name, country: item.country, city });
          setRevealed(new Set([item.id]));
        }
        setLayers((l) => ({ ...l, political: true }));
      } else if (item.type === "lake") {
        setLayers((l) => ({ ...l, rivers: true }));
        setRevealed(new Set([item.id]));
      } else if (item.type === "peak") {
        setLayers((l) => ({ ...l, mountains: true }));
        setRevealed(new Set([item.id]));
      } else {
        setLayers((l) => ({ ...l, terrain: true }));
        setRevealed(new Set([item.id]));
      }
      setSearchQuery("");
      setSearchOpen(false);
    },
    [enterCountry, CITIES_BY_COUNTRY]
  );

  const clampWidth = useCallback(
    (w: number): number => {
      const fit = fitVBRef.current;
      const minVW = fit[2] * 0.2;
      const maxVW = FULL_VB[2];
      return Math.min(maxVW, Math.max(minVW, w));
    },
    [FULL_VB]
  );

  const clampVB = useCallback(
    (v: VB): VB => {
      const w = clampWidth(v[2]);
      const h = w / ASPECT;
      const [bx, by, bw, bh] = FULL_VB;
      const maxX = bx + bw - w;
      const maxY = by + bh - h;
      const x = Math.min(Math.max(v[0], bx), Math.max(bx, maxX));
      const y = Math.min(Math.max(v[1], by), Math.max(by, maxY));
      return [x, y, w, h];
    },
    [clampWidth, FULL_VB]
  );

  const pxToVb = useCallback((clientX: number, clientY: number): [number, number] => {
    const el = svgRef.current;
    const v = vbRef.current;
    if (!el) return [v[0] + v[2] / 2, v[1] + v[3] / 2];
    const r = el.getBoundingClientRect();
    return [v[0] + ((clientX - r.left) / r.width) * v[2], v[1] + ((clientY - r.top) / r.height) * v[3]];
  }, []);

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

  const exitToContinent = useCallback(() => {
    activeCountryRef.current = null;
    fitVBRef.current = FULL_VB;
    setActiveCountry(null);
    setSelected(null);
    setRevealed(new Set());
    setLayers(DEFAULT_LAYERS);
    animateTo(FULL_VB);
  }, [animateTo, FULL_VB]);

  const proj = MAP?.proj;

  // Political layer: cities for the active country, or every country in the
  // continent when none is picked yet — unlike the parks tool, this layer
  // (and the others below) works at the whole-continent zoom level too, so
  // there's something to see before drilling into any one country.
  const points = useMemo<LayoutPoint[]>(() => {
    if (!layers.political || !proj) return [];
    const countries = activeCountry ? [activeCountry] : Object.keys(CITIES_BY_COUNTRY);
    const pts: LayoutPoint[] = [];
    for (const country of countries) {
      (CITIES_BY_COUNTRY[country] ?? []).forEach((c, i) => {
        const [x, y] = projectPoint(proj, c.lon, c.lat);
        pts.push({
          id: `city:${country}:${i}`,
          name: c.name,
          x,
          y,
          priority: c.capital ? 2 : 1,
          kind: c.capital ? "capital" : "city",
        });
      });
    }
    return pts;
  }, [activeCountry, layers.political, proj, CITIES_BY_COUNTRY]);

  const clusters = useMemo<Cluster[]>(() => clusterPoints(points, CLUSTER_FRAC * vb[2]), [points, vb]);

  const isMasked = useCallback((id: string) => mode === "recall" && !revealed.has(id), [mode, revealed]);

  const openPoint = useCallback(
    (m: LayoutPoint) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }
      // The id already carries its own country ("city:<country>:<idx>"),
      // set when the marker was built — reading it back here means this
      // works the same whether a country is active or not.
      const [, country, idxStr] = m.id.split(":");
      const idx = Number(idxStr);
      setRevealed((prev) => {
        if (prev.has(m.id)) return prev;
        const next = new Set(prev);
        next.add(m.id);
        return next;
      });
      const city = (CITIES_BY_COUNTRY[country] ?? [])[idx];
      if (city) setSelected({ id: m.id, name: m.name, country, city });
    },
    [CITIES_BY_COUNTRY]
  );

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

  // Rivers/lakes, mountains/volcanoes, terrain — for the active country, or
  // every country in the continent when none is picked yet (same reasoning
  // as `points` above).
  const faint = useMemo(() => {
    if (!proj) {
      return { rivers: [], lakes: [], peaks: [], terrain: [] as { id: string; name: string; kind: string; note: string; xy: [number, number] }[] };
    }
    const countries = activeCountry ? [activeCountry] : (MAP?.countries.map((c) => c.name) ?? []);

    const rivers = countries.flatMap((country) =>
      (RIVERS_BY_COUNTRY[country] ?? []).map((r: River, i: number) => {
        const mid = r.pts[Math.floor(r.pts.length * 0.5)] ?? r.pts[0];
        const anchor = mid ? projectPoint(proj, mid[0], mid[1]) : ([0, 0] as [number, number]);
        return { id: `riv:${country}:${i}`, name: r.name, d: riverPath(proj, r.pts), anchor };
      })
    );
    const lakes = countries.flatMap((country) =>
      (LAKES_BY_COUNTRY[country] ?? []).map((l: Lake, i: number) => ({
        id: `lake:${country}:${i}`,
        name: l.name,
        note: l.note,
        waterfall: l.kind === "waterfall",
        xy: projectPoint(proj, l.lon, l.lat),
      }))
    );
    const peaks = countries.flatMap((country) =>
      (MOUNTAINS_BY_COUNTRY[country] ?? []).map((p: Peak, i: number) => ({
        id: `peak:${country}:${i}`,
        name: p.name,
        volcano: p.volcano,
        note: p.note,
        xy: projectPoint(proj, p.lon, p.lat),
      }))
    );
    const terrain = countries.flatMap((country) =>
      (TERRAIN_BY_COUNTRY[country] ?? []).map((t: Terrain, i: number) => ({
        id: `ter:${country}:${i}`,
        name: t.name,
        kind: t.kind,
        note: t.note,
        xy: projectPoint(proj, t.lon, t.lat),
      }))
    );
    return { rivers, lakes, peaks, terrain };
  }, [activeCountry, proj, MAP, RIVERS_BY_COUNTRY, LAKES_BY_COUNTRY, MOUNTAINS_BY_COUNTRY, TERRAIN_BY_COUNTRY]);

  const waterLabels = useMemo(() => {
    if (!proj) return [];
    return WATER.map((w: WaterBody, i: number) => ({
      id: `water:${i}`,
      name: w.name,
      xy: projectPoint(proj, w.lon, w.lat),
    }));
  }, [WATER, proj]);

  const placements = useMemo(() => {
    const maskedNow = (id: string) => mode === "recall" && !revealed.has(id);

    const singles = clusters.filter((c) => !isBubble(c)).filter((c) => !maskedNow(c.members[0].id));
    const cityLabels: LabelInput[] = singles.map((c) => ({
      id: c.id,
      text: c.members[0].name,
      x: c.x,
      y: c.y,
      r: (c.members[0].kind === "capital" ? CAP_R_FRAC : R_FRAC) * vb[2],
      fontSize: LFS_FRAC * vb[2],
      priority: c.members[0].priority,
    }));

    const lakeLabels: LabelInput[] = layers.rivers
      ? faint.lakes
          .filter((l) => !maskedNow(l.id))
          .map((l) => ({ id: l.id, text: l.name, x: l.xy[0], y: l.xy[1], r: DROP_FRAC * vb[2], fontSize: LAKE_FRAC * vb[2], priority: 0.5 }))
      : [];

    const peakLabels: LabelInput[] = layers.mountains
      ? faint.peaks.map((p) => ({ id: p.id, text: (p.volcano ? "▲ " : "△ ") + p.name, x: p.xy[0], y: p.xy[1], r: 0, fontSize: PEAK_FRAC * vb[2], priority: 0.3 }))
      : [];

    const terrainLabels: LabelInput[] = layers.terrain
      ? faint.terrain.map((t) => ({ id: t.id, text: t.name, x: t.xy[0], y: t.xy[1], r: 0, fontSize: TERRAIN_FRAC * vb[2], priority: 0.2 }))
      : [];

    return placeLabels([...cityLabels, ...lakeLabels, ...peakLabels, ...terrainLabels], LGAP_FRAC * vb[2]);
  }, [clusters, vb, mode, revealed, layers.rivers, layers.mountains, layers.terrain, faint]);

  const R = R_FRAC * vb[2];
  const CAP_R = CAP_R_FRAC * vb[2];
  const LFS = LFS_FRAC * vb[2];
  const LGAP = LGAP_FRAC * vb[2];
  const RIVER_FS = RIVER_FRAC * vb[2];
  const LAKE_FS = LAKE_FRAC * vb[2];
  const PEAK_FS = PEAK_FRAC * vb[2];
  const TERRAIN_FS = TERRAIN_FRAC * vb[2];
  const WATER_FS = WATER_FRAC * vb[2];
  const DROP = DROP_FRAC * vb[2];
  const TOUCH_R = TOUCH_R_FRAC * vb[2];
  const BUB_R = BUBBLE_R_FRAC * vb[2];
  const LEAD_GAP = LEAD_GAP_FRAC * vb[2];
  const PEAK_R = PEAK_FRAC * vb[2] * 0.55;

  const ready = CONT_META?.ready && !!MAP;

  return (
    <div className="wm-root">
      {/* continent selector — page-level, above the mode/search controls */}
      <div className="wm-continentbar" role="group" aria-label="Choose a continent">
        {CONTINENTS.map((c) => (
          <button
            key={c.id}
            className={`wm-pill ${continent === c.id ? "wm-pill-on" : ""} ${!c.ready ? "wm-pill-soon" : ""}`}
            onClick={() => switchContinent(c.id)}
            disabled={!c.ready}
            aria-pressed={continent === c.id}
            title={c.ready ? undefined : "Coming soon"}
          >
            {c.label}
            {!c.ready && <span className="wm-pill-tag">Soon</span>}
          </button>
        ))}
      </div>

      <div className="wm-controlbar">
        <div className="wm-modecard" role="group" aria-label="Study mode">
          <button className={`wm-mode wm-mode-learn ${mode === "learn" ? "wm-mode-on" : ""}`} onClick={() => switchMode("learn")} aria-pressed={mode === "learn"}>
            Learn Mode
          </button>
          <button className={`wm-mode wm-mode-recall ${mode === "recall" ? "wm-mode-on" : ""}`} onClick={() => switchMode("recall")} aria-pressed={mode === "recall"}>
            Recall Mode
          </button>
        </div>

        <div className="wm-search" role="search" ref={searchRef}>
          <div className="wm-search-box">
            <span className="wm-search-ic" aria-hidden="true">⚲</span>
            <input
              type="text"
              className="wm-search-input"
              placeholder="Search cities, lakes, peaks…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => { if (searchQuery.trim()) setSearchOpen(true); }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchResults.length > 0) goToSearchResult(searchResults[0]);
                else if (e.key === "Escape") { setSearchQuery(""); setSearchOpen(false); }
              }}
              aria-label="Search cities, lakes, peaks and physical features"
            />
            {searchQuery && (
              <button type="button" className="wm-search-clear" onClick={() => { setSearchQuery(""); setSearchOpen(false); }} aria-label="Clear search">×</button>
            )}
          </div>
          {searchQuery.trim() && searchOpen && (
            <ul className="wm-search-results">
              {searchResults.length === 0 ? (
                <li className="wm-search-empty">No matches</li>
              ) : (
                searchResults.map((r) => (
                  <li key={r.id}>
                    <button type="button" className="wm-search-result" onClick={() => goToSearchResult(r)}>
                      <span className="wm-search-name">{r.name}</span>
                      <span className="wm-search-meta">{SEARCH_TYPE_LABEL[r.type]} · {r.country}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>

      <div className="wm-workspace">
        <aside className="wm-sidebar">
          <div className="wm-layerbox">
            <span className="wm-lyr-cap">Layers</span>
            <div className="wm-lyr-col" role="group" aria-label="Map layers">
              <LayerChip variant="pol" on={layers.political} onClick={() => toggle("political")}>Political (Capitals &amp; Cities)</LayerChip>
              <LayerChip variant="riv" on={layers.rivers} onClick={() => toggle("rivers")}>Rivers &amp; Lakes</LayerChip>
              <LayerChip variant="mtn" on={layers.mountains} onClick={() => toggle("mountains")}>Mountains &amp; Volcanoes</LayerChip>
              <LayerChip variant="ter" on={layers.terrain} onClick={() => toggle("terrain")}>Physical Features</LayerChip>
            </div>
          </div>

          <button className="wm-lb-reset" onClick={exitToContinent} aria-label={`Reset to ${CONT_META?.label ?? "continent"} overview`}>
            <span className="wm-lb-reset-ic" aria-hidden="true">↺</span>
            Reset to {CONT_META?.label ?? "Continent"}
          </button>
        </aside>

        <div className="wm-mapcol">
          <div className="wm-stage">
            {!ready ? (
              <div className="wm-soon">
                <p className="wm-soon-h">{CONT_META?.label} is coming soon</p>
                <p className="wm-soon-b">This continent&apos;s map hasn&apos;t been traced yet — pick South America for now.</p>
              </div>
            ) : (
              <svg
                ref={svgRef}
                className="wm-svg wm-grab"
                viewBox={vb.join(" ")}
                onPointerDown={onStagePointerDown}
                role="img"
                aria-label={activeCountry ? `Map of ${activeCountry}` : `Map of ${CONT_META?.label} — pick a country`}
              >
                <g>
                  {MAP!.countries.map((s) => {
                    const clickable = hasData(s.name);
                    const isActive = s.name === activeCountry;
                    return (
                      <path
                        key={s.name}
                        d={s.d}
                        className={["wm-country", clickable ? "wm-has-data" : "", isActive ? "wm-active" : ""].filter(Boolean).join(" ")}
                        onClick={
                          clickable
                            ? () => {
                                if (suppressClickRef.current) { suppressClickRef.current = false; return; }
                                enterCountry(s.name);
                              }
                            : undefined
                        }
                      />
                    );
                  })}
                </g>

                {!activeCountry && (
                  <g className="wm-countrylabels" aria-hidden="true">
                    {MAP!.countries.map((s) => {
                      if (!hasData(s.name)) return null;
                      const cx = s.bbox[0] + s.bbox[2] / 2;
                      const cy = s.bbox[1] + s.bbox[3] / 2;
                      return (
                        <text key={s.name} x={cx} y={cy} className="wm-countrylabel" textAnchor="middle" fontSize={STATE_LABEL_FS}>
                          {s.name}
                        </text>
                      );
                    })}
                  </g>
                )}

                {/* oceans/seas — always-on orientation layer, not gated by a chip */}
                <g className="wm-water" aria-hidden="true">
                  {waterLabels.map((w) => (
                    <text key={w.id} x={w.xy[0]} y={w.xy[1]} fontSize={WATER_FS} textAnchor="middle" className="wm-waterlabel">
                      {w.name}
                    </text>
                  ))}
                </g>

                {layers.rivers && (
                  <g className="wm-rivers" aria-hidden="true">
                    {faint.rivers.map((r) => (
                      <g key={r.id}>
                        <path d={r.d} className="wm-river" />
                        <text x={r.anchor[0]} y={r.anchor[1] - LGAP} fontSize={RIVER_FS} className="wm-riverlabel">{r.name}</text>
                      </g>
                    ))}
                  </g>
                )}

                {layers.rivers && (
                  <g className="wm-lakes">
                    {faint.lakes.map((l) => {
                      const [cx, cy] = l.xy;
                      const masked = isMasked(l.id);
                      const pl = placements.get(l.id);
                      return (
                        <g
                          key={l.id}
                          className="wm-lake-g"
                          onClick={() => revealOnly(l.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); revealOnly(l.id); } }}
                          aria-label={masked ? `Hidden ${l.waterfall ? "waterfall" : "lake"} — click to reveal` : l.name}
                        >
                          <circle cx={cx} cy={cy} r={TOUCH_R} className="wm-touch-target" />
                          <path d={dropletPath(cx, cy, DROP)} className={`wm-lake ${l.waterfall ? "wm-lake-waterfall" : ""}`} />
                          {masked ? (
                            <text x={cx} y={cy + DROP + LAKE_FS} fontSize={LAKE_FS} textAnchor="middle" className="wm-lakelabel wm-mask">?</text>
                          ) : (
                            pl && !pl.hidden && (
                              <>
                                {pl.leader && <line x1={cx} y1={cy} x2={pl.x} y2={pl.y - LEAD_GAP} className="wm-lead" />}
                                <text x={pl.x} y={pl.y} fontSize={LAKE_FS} textAnchor={pl.textAnchor} className="wm-lakelabel">{l.name}</text>
                              </>
                            )
                          )}
                        </g>
                      );
                    })}
                  </g>
                )}

                {layers.mountains && (
                  <g className="wm-peaks">
                    {faint.peaks.map((p) => {
                      const [cx, cy] = p.xy;
                      const pl = placements.get(p.id);
                      return (
                        <g key={p.id}>
                          <path d={peakPath(cx, cy, PEAK_R)} className={`wm-peak ${p.volcano ? "wm-peak-volcano" : ""}`} />
                          {pl && !pl.hidden && (
                            <>
                              {pl.leader && <line x1={cx} y1={cy} x2={pl.x} y2={pl.y - LEAD_GAP} className="wm-lead" />}
                              <text x={pl.x} y={pl.y} fontSize={PEAK_FS} textAnchor={pl.textAnchor} className="wm-peaklabel">
                                {(p.volcano ? "▲ " : "△ ") + p.name}
                              </text>
                            </>
                          )}
                        </g>
                      );
                    })}
                  </g>
                )}

                {layers.terrain && (
                  <g className="wm-terrain" aria-hidden="true">
                    {faint.terrain.map((t) => {
                      const [cx, cy] = t.xy;
                      const pl = placements.get(t.id);
                      if (!pl || pl.hidden) return null;
                      return (
                        <g key={t.id}>
                          {pl.leader && <line x1={cx} y1={cy} x2={pl.x} y2={pl.y - LEAD_GAP} className="wm-lead" />}
                          <text x={pl.x} y={pl.y} fontSize={TERRAIN_FS} textAnchor={pl.textAnchor} className={`wm-terrainlabel wm-terrain-${t.kind}`}>
                            {t.name}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                )}

                {layers.political && (
                  <g className="wm-markers">
                    {clusters.map((c) => {
                      if (isBubble(c)) {
                        return (
                          <g
                            key={c.id}
                            className="wm-bubble-g"
                            onClick={() => { if (suppressClickRef.current) { suppressClickRef.current = false; return; } zoomAround(c.x, c.y); }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); zoomAround(c.x, c.y); } }}
                            aria-label={`${c.members.length} cities here — zoom to split`}
                          >
                            <circle cx={c.x} cy={c.y} r={TOUCH_R} className="wm-touch-target" />
                            <circle cx={c.x} cy={c.y} r={BUB_R} className="wm-bubble" />
                            <text x={c.x} y={c.y} fontSize={BUB_R * 1.15} className="wm-bubble-count">{c.members.length}</text>
                          </g>
                        );
                      }

                      const m = c.members[0];
                      const isCapital = m.kind === "capital";
                      const pl = placements.get(c.id);
                      const masked = isMasked(m.id);
                      const isSel = selected?.id === m.id;
                      const r = isCapital ? CAP_R : R;

                      return (
                        <g
                          key={c.id}
                          className={`wm-mrk-g ${isSel ? "wm-mrk-sel" : ""}`}
                          onClick={() => openPoint(m)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPoint(m); } }}
                          aria-label={masked ? "Hidden city — click to reveal" : m.name}
                        >
                          <circle cx={c.x} cy={c.y} r={TOUCH_R} className="wm-touch-target" />
                          {isCapital ? (
                            <>
                              <circle cx={c.x} cy={c.y} r={r} className="wm-mrk wm-mrk-capital" />
                              <circle cx={c.x} cy={c.y} r={r * 0.4} className="wm-mrk-capital-dot" />
                            </>
                          ) : (
                            <circle cx={c.x} cy={c.y} r={r} className="wm-mrk wm-mrk-city" />
                          )}

                          {masked ? (
                            <text x={c.x} y={c.y - r - LGAP} fontSize={LFS} textAnchor="middle" className="wm-mrklabel wm-mask">?</text>
                          ) : (
                            pl && !pl.hidden && (
                              <>
                                {pl.leader && <line x1={c.x} y1={c.y} x2={pl.x} y2={pl.y - LEAD_GAP} className="wm-lead" />}
                                <text x={pl.x} y={pl.y} fontSize={LFS} textAnchor={pl.textAnchor} className="wm-mrklabel">{m.name}</text>
                              </>
                            )
                          )}
                        </g>
                      );
                    })}
                  </g>
                )}
              </svg>
            )}

            {ready && activeCountry && (
              <div className="wm-zoombtns">
                <button className="wm-zoom" onClick={() => zoomButtons(0.8)} aria-label="Zoom in">+</button>
                <button className="wm-zoom" onClick={() => zoomButtons(1.25)} aria-label="Zoom out">−</button>
              </div>
            )}
          </div>

          {selected && <Card sel={selected} onClose={() => setSelected(null)} panelRef={cardRef} />}
        </div>
      </div>

      <div className="wm-footnote">
        <div className="wm-fn-markers" aria-label="Marker key">
          <span><i className="wm-lg wm-lg-cap" />Capital</span>
          <span><i className="wm-lg wm-lg-city" />Major City</span>
          <span><i className="wm-lg wm-lg-lake" />Lake</span>
          <span><i className="wm-lg wm-lg-waterfall" />Waterfall</span>
          <span><i className="wm-lg wm-lg-peak" />Mountain</span>
          <span><i className="wm-lg wm-lg-volcano" />Volcano</span>
        </div>
      </div>
    </div>
  );
}
