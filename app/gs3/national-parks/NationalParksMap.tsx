"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import indiaRaw from "@/lib/parks/india.json";
import parksRaw from "@/lib/parks/parks.json";
import reservesRaw from "@/lib/parks/reserves.json";
import riversRaw from "@/lib/parks/rivers.json";
import wetlandsRaw from "@/lib/parks/wetlands.json";
import terrainRaw from "@/lib/parks/terrain.json";
import {
  projectPoint,
  type IndiaMap,
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

const FULL_VB = INDIA.viewBox as VB;
const BBOX_PAD = 0.08;
const ZOOM_MS = 620;

// Marker / label sizes as a fraction of the current viewBox width, so they stay
// a constant on-screen size regardless of zoom level.
const R_FRAC = 0.007; // marker radius
const LFS_FRAC = 0.0105; // park label font-size
const LGAP_FRAC = 0.004; // marker→label gap
// Faint context layers — subordinate size hierarchy: park > river > wetland ≈ terrain.
const RIVER_FRAC = 0.0082; // river label font-size
const WET_FRAC = 0.0068; // wetland label font-size
const HILL_FRAC = 0.0068; // terrain label font-size
const DROP_FRAC = 0.0052; // wetland droplet size

const easeInOut = (t: number): number =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

function frameBBox([x, y, w, h]: [number, number, number, number]): VB {
  const px = w * BBOX_PAD;
  const py = h * BBOX_PAD;
  let nx = x - px;
  let ny = y - py;
  let nw = w + 2 * px;
  let nh = h + 2 * py;
  const aspect = FULL_VB[2] / FULL_VB[3];
  if (nw / nh > aspect) {
    const t = nw / aspect;
    ny -= (t - nh) / 2;
    nh = t;
  } else {
    const t = nh * aspect;
    nx -= (t - nw) / 2;
    nw = t;
  }
  return [nx, ny, nw, nh];
}

/** Semicircle path (top→bottom), left or right half of a circle. */
const halfCircle = (cx: number, cy: number, r: number, right: boolean): string =>
  `M${cx},${cy - r} A${r},${r} 0 0 ${right ? 1 : 0} ${cx},${cy + r} Z`;

/** Teardrop path centred on (x, y); w controls size. */
const dropletPath = (x: number, y: number, w: number): string =>
  `M${x},${y + w} C${x - 0.76 * w},${y + 0.3 * w} ${x - 0.76 * w},${y - 0.48 * w} ${x},${y - w} ` +
  `C${x + 0.76 * w},${y - 0.48 * w} ${x + 0.76 * w},${y + 0.3 * w} ${x},${y + w} Z`;

interface LayerState {
  tr: boolean;
  rivers: boolean;
  wetlands: boolean;
  terrain: boolean;
  species: boolean;
}

function LayerChip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      className={`np-chip ${on ? "np-chip-on" : ""}`}
      onClick={onClick}
      aria-pressed={on}
    >
      {children}
    </button>
  );
}

export default function NationalParksMap() {
  const [activeState, setActiveState] = useState<string | null>(null);
  const [vb, setVb] = useState<VB>(FULL_VB);
  const [layers, setLayers] = useState<LayerState>({
    tr: false,
    rivers: false,
    wetlands: false,
    terrain: false,
    species: true,
  });
  const vbRef = useRef<VB>(FULL_VB);
  const rafRef = useRef<number | null>(null);

  const toggle = useCallback(
    (k: keyof LayerState) => setLayers((l) => ({ ...l, [k]: !l[k] })),
    []
  );

  const animateTo = useCallback((to: VB, dur = ZOOM_MS) => {
    const from = vbRef.current;
    const t0 = performance.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
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

  const hasData = useCallback((name: string) => name in PARKS, []);

  const enterState = useCallback(
    (name: string) => {
      const shape = INDIA.states.find((s) => s.name === name);
      if (!shape) return;
      setActiveState(name);
      animateTo(frameBBox(shape.bbox));
    },
    [animateTo]
  );

  const exitToIndia = useCallback(() => {
    setActiveState(null);
    animateTo(FULL_VB);
  }, [animateTo]);

  const activeShape = useMemo(
    () =>
      activeState
        ? INDIA.states.find((s) => s.name === activeState) ?? null
        : null,
    [activeState]
  );

  // Project markers once per state (coords are zoom-independent).
  const markers = useMemo(() => {
    if (!activeState) return { parks: [], reserves: [] };
    const parks = (PARKS[activeState] ?? []).map((p) => ({
      ...p,
      xy: projectPoint(PROJ, p.lon, p.lat),
    }));
    const reserves = (RESERVES[activeState] ?? []).map((r) => ({
      ...r,
      xy: projectPoint(PROJ, r.lon, r.lat),
    }));
    return { parks, reserves };
  }, [activeState]);

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

  return (
    <div className="np-root">
      <header className="np-head">
        <div className="np-crumb">
          <span>UPSC Labs</span>
          <span>/</span>
          <span>GS3</span>
          <span>/</span>
          <b>National Parks · Active Recall</b>
        </div>
        <h1 className="np-title">
          National Parks &amp; Tiger Reserves
          <span className="np-wip">Work in progress</span>
        </h1>
        <p className="np-sub">
          Pick a state, then reveal the parks. Data is provisional and unverified
          — not for final revision.
        </p>
      </header>

      <div className="np-stage">
        {activeState && (
          <div className="np-toolbar">
            <button className="np-back" onClick={exitToIndia}>
              ← India
            </button>
            <div className="np-chips">
              <LayerChip on={layers.tr} onClick={() => toggle("tr")}>
                Tiger Reserves
              </LayerChip>
              <LayerChip on={layers.rivers} onClick={() => toggle("rivers")}>
                Rivers
              </LayerChip>
              <LayerChip on={layers.wetlands} onClick={() => toggle("wetlands")}>
                Wetlands
              </LayerChip>
              <LayerChip on={layers.terrain} onClick={() => toggle("terrain")}>
                Terrain
              </LayerChip>
              <LayerChip on={layers.species} onClick={() => toggle("species")}>
                Key species
              </LayerChip>
            </div>
          </div>
        )}

        <svg
          className="np-svg"
          viewBox={vb.join(" ")}
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
                  >
                    {s.name}
                  </text>
                );
              })}
            </g>
          )}

          {activeShape && (
            <text
              x={activeShape.bbox[0] + activeShape.bbox[2] / 2}
              y={activeShape.bbox[1] + activeShape.bbox[3] / 2}
              className="np-watermark"
              textAnchor="middle"
              fontSize={Math.min(activeShape.bbox[2], activeShape.bbox[3]) * 0.16}
            >
              {activeState?.toUpperCase()}
            </text>
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

          {/* ── markers ── */}
          {activeState && (
            <g className="np-markers">
              {/* standalone tiger reserves (amber) — only under the TR layer */}
              {layers.tr &&
                markers.reserves.map((r) => {
                  const [cx, cy] = r.xy;
                  return (
                    <g key={`tr-${r.name}`}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={R}
                        className="np-mrk np-mrk-amb"
                      />
                      <text
                        x={cx}
                        y={cy - R - LGAP}
                        fontSize={LFS}
                        className="np-mrklabel"
                      >
                        {r.name}
                      </text>
                    </g>
                  );
                })}

              {/* national parks (green; half-amber if a tiger-reserve core) */}
              {markers.parks.map((p) => {
                const [cx, cy] = p.xy;
                const split = layers.tr && p.tr;
                return (
                  <g key={`np-${p.name}`}>
                    {split ? (
                      <>
                        <path
                          d={halfCircle(cx, cy, R, false)}
                          className="np-half-np"
                        />
                        <path
                          d={halfCircle(cx, cy, R, true)}
                          className="np-half-amb"
                        />
                        <circle cx={cx} cy={cy} r={R} className="np-mrk-ring" />
                      </>
                    ) : (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={R}
                        className="np-mrk np-mrk-np"
                      />
                    )}
                    <text
                      x={cx}
                      y={cy - R - LGAP}
                      fontSize={LFS}
                      className="np-mrklabel"
                    >
                      {p.name}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
