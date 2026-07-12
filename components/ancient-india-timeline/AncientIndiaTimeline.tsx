"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import { geoMercator, geoPath, geoArea, geoCentroid } from "d3-geo";
import type { Feature } from "geojson";
import {
  DYNASTIES,
  ERAS,
  AXIS,
  T_MIN,
  T_MAX,
  fmtYear,
  fmtRange,
  type Dynasty,
} from "@/lib/timeline/dynasties";
import southAsiaRaw from "@/lib/timeline/southAsia.json"
import bordersRaw from "@/lib/timeline/borders.json";
import "./AncientIndiaTimeline.css";

const BASE_LAND = southAsiaRaw as unknown as Feature;
const BORDERS = bordersRaw as unknown as Feature;

const W = 760;
const H = 824;

type Projected = Dynasty & { d: string; centroid: [number, number]; area: number };

export default function AncientIndiaTimeline() {
  const [year, setYear] = useState(-250);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const { pathGen, project } = useMemo(() => {
  const projection = geoMercator().fitExtent(
    [
      [22, 18],
      [W - 22, H - 30],
    ],
    BASE_LAND
  );
  const round = (n: number) => Math.round(n * 100) / 100;
  const project = (lng: number, lat: number): [number, number] => {
    const p = projection([lng, lat]) as [number, number];
    return [round(p[0]), round(p[1])];
  };
  return { pathGen: geoPath(projection), project };
}, []);

  const basePath = useMemo(() => pathGen(BASE_LAND) ?? "", [pathGen]);
  const borderPath = useMemo(() => pathGen(BORDERS) ?? "", [pathGen]);

  // CCW-normalized polygon (d3-geo treats clockwise rings as the complement).
  const polyFeature = (coords: number[][]): Feature => {
    let f: Feature = {
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [coords] },
    };
    if (geoArea(f) > 2 * Math.PI) {
      f = {
        type: "Feature",
        properties: {},
        geometry: { type: "Polygon", coordinates: [[...coords].reverse()] },
      };
    }
    return f;
  };

  const dynPaths = useMemo<Projected[]>(
    () =>
      DYNASTIES.map((d) => {
        const f = polyFeature(d.coords);
        return {
          ...d,
          d: pathGen(f) ?? "",
          centroid: geoCentroid(f) as [number, number],
          area: geoArea(f),
        };
      }),
    [pathGen]
  );

  // Render fills largest-first so small/subordinate kingdoms stay visible on top.
  const fillOrder = useMemo(
    () => [...dynPaths].sort((a, b) => b.area - a.area),
    [dynPaths]
  );

  const active = useMemo(
    () => DYNASTIES.filter((d) => year >= d.start && year <= d.end),
    [year]
  );
  const activeIds = useMemo(() => new Set(active.map((d) => d.id)), [active]);
  const eraIdx = ERAS.findIndex((er) => year >= er.s && year < er.e);
  const currentEra = ERAS[eraIdx] || ERAS[ERAS.length - 1];
  const rulingNames = active.map((d) => d.short || d.name).join("  \u00b7  ");

  // Distinct dynasty start years — the "a new kingdom arises" stepping points.
  const STARTS = useMemo(
    () => Array.from(new Set(DYNASTIES.map((d) => d.start))).sort((a, b) => a - b),
    []
  );

  // ── piecewise (equal-width-per-era) scale ──
  const yearToFrac = useCallback((y: number): number => {
    if (y <= T_MIN) return 0;
    if (y >= T_MAX) return 1;
    for (let i = 0; i < ERAS.length; i++) {
      const er = ERAS[i];
      if (y >= er.s && y < er.e) return (i + (y - er.s) / (er.e - er.s)) / ERAS.length;
    }
    return 1;
  }, []);

  const fracToYear = useCallback((f: number): number => {
    const pos = Math.min(ERAS.length - 1e-9, Math.max(0, f * ERAS.length));
    const i = Math.min(ERAS.length - 1, Math.floor(pos));
    const er = ERAS[i];
    return Math.round(er.s + (pos - i) * (er.e - er.s));
  }, []);

  const pct = (y: number) => yearToFrac(y) * 100;

  const yearFromClientX = useCallback(
    (clientX: number): number => {
      const el = trackRef.current;
      if (!el) return year;
      const r = el.getBoundingClientRect();
      return fracToYear(Math.min(1, Math.max(0, (clientX - r.left) / r.width)));
    },
    [year, fracToYear]
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setYear(yearFromClientX(e.clientX));
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragging.current) setYear(yearFromClientX(e.clientX));
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  // Step to the next / previous year a new kingdom appears.
  const goStep = (dir: number) => {
    if (dir > 0) {
      const nx = STARTS.find((s) => s > year);
      setYear(nx != null ? nx : T_MAX);
    } else {
      const ps = STARTS.filter((s) => s < year);
      setYear(ps.length ? ps[ps.length - 1] : T_MIN);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      goStep(-1);
      e.preventDefault();
    }
    if (e.key === "ArrowRight") {
      goStep(1);
      e.preventDefault();
    }
  };

  const zeroPct = pct(0);

  return (
    <div className="ait-root">
      <header className="ait-head">
        {/* <div className="ait-eyebrow">Outline of Ancient India · interactive atlas</div> */}
        <h1 className="ait-title">Who ruled, and where</h1>
        <p className="ait-sub">
          Step kingdom by kingdom with the arrows, or drag the rule.
        </p>
      </header>

      <section className="ait-readout">
        <button className="ait-step" onClick={() => goStep(-1)} aria-label="Previous kingdom">
          ‹
        </button>
        <div className="ait-readout-mid">
          <div className="ait-rtop">
            <span className="ait-year">{fmtYear(year)}</span>
            <span className="ait-era">{currentEra.n}</span>
            {currentEra.wip && <span className="ait-soon">coming soon</span>}
          </div>
          <div className="ait-ruling">
            {active.length ? (
              <>
                <span className="ait-ruling-k">Ruling</span>
                {rulingNames}
              </>
            ) : (
              <span className="ait-ruling-empty">
                A fragmented interregnum — no dominant power mapped here
              </span>
            )}
          </div>
        </div>
        <button className="ait-step" onClick={() => goStep(1)} aria-label="Next kingdom">
          ›
        </button>
      </section>

      <section className="ait-timeline" aria-label="Timeline">
        <div
          className="ait-track"
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-valuemin={T_MIN}
          aria-valuemax={T_MAX}
          aria-valuenow={year}
          aria-valuetext={`${fmtYear(year)}, ${currentEra.n} era`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onKeyDown={onKeyDown}
        >
          {ERAS.map((er, i) => {
            const left = pct(er.s);
            const width = pct(er.e) - pct(er.s);
            const isCur = er.n === currentEra.n;
            return (
              <div
                key={er.n}
                className={`ait-band ${isCur ? "is-cur " : ""}${i % 2 ? "alt" : ""}`}
                style={{ left: `${left}%`, width: `${width}%` }}
              >
                <span className="ait-band-tick">{er.n}</span>
              </div>
            );
          })}
          <div className="ait-zero" style={{ left: `${zeroPct}%` }} />
          <div className="ait-handle" style={{ left: `${pct(year)}%` }} aria-hidden="true">
            <div className="ait-handle-stem" />
            <div className="ait-handle-knob" />
          </div>
        </div>
        <div className="ait-axis">
          {AXIS.map((y) => (
            <span
              key={y}
              className={`ait-tick${y === -600 || y === 600 ? " minor" : ""}`}
              style={{ left: `${pct(y)}%` }}
            >
              {y === 0 ? "1 CE" : y < 0 ? `${Math.abs(y)} BCE` : `${y} CE`}
            </span>
          ))}
        </div>
      </section>

      <section className="ait-mapwrap">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="ait-svg"
          role="img"
          aria-label={`Map of South Asia, ${fmtYear(year)}`}
        >
          <defs>
            <clipPath id="land-clip">
              <path d={basePath} />
            </clipPath>
          </defs>
          <path d={basePath} className="ait-land" />
          <path d={borderPath} className="ait-border" />
          <g clipPath="url(#land-clip)">
            {fillOrder.map((d) => {
              const on = activeIds.has(d.id);
              return (
                <path
                  key={d.id}
                  d={d.d}
                  className="ait-region"
                  style={{
                    fill: d.fill,
                    opacity: on ? 0.82 : 0,
                    pointerEvents: on ? "auto" : "none",
                  }}
                />
              );
            })}
          </g>
          <g>
            {dynPaths.map((d) => {
              if (!d.label.lead || !activeIds.has(d.id)) return null;
              const [lx, ly] = project(d.label.lng, d.label.lat);
              const [cx, cy] = project(d.centroid[0], d.centroid[1]);
              return <line key={d.id} x1={lx} y1={ly} x2={cx} y2={cy} className="ait-lead" />;
            })}
          </g>
          <g>
            {dynPaths.map((d) => {
              if (!activeIds.has(d.id)) return null;
              const [lx, ly] = project(d.label.lng, d.label.lat);
              return (
                <text
                  key={d.id}
                  y={ly}
                  className="ait-label"
                  textAnchor={d.label.anchor}
                  style={{ fill: d.fill }}
                >
                  <tspan x={lx}>{d.short || d.name}</tspan>
                  <tspan x={lx} dy="1.2em" className="ait-period">
                    ({fmtRange(d.start, d.end)})
                  </tspan>
                </text>
              );
            })}
          </g>
        </svg>

        {!active.length && (
          <div className="ait-empty">
            <span>{currentEra.n} era</span>
            <span className="ait-empty-sub">— a fragmented interregnum —</span>
          </div>
        )}
      </section>

      <section className="ait-legend" aria-label="Dynasties">
        {DYNASTIES.map((d) => {
          const on = activeIds.has(d.id);
          return (
            <button
              key={d.id}
              className={`ait-chip ${on ? "on" : ""}`}
              onClick={() => setYear(d.start)}
              title={fmtRange(d.start, d.end)}
            >
              <span className="ait-swatch" style={{ background: d.fill }} />
              {d.name}
            </button>
          );
        })}
      </section>

      <footer className="ait-foot">
        Outline of Ancient India · Built for chronological familiarity, not exact borders.
      </footer>
    </div>
  );
}
