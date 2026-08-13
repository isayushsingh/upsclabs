// lib/worldmap/types.ts
// Domain types for the World Mapping tool (GS1 · Geography): continent-by-
// continent political/physical maps with an active-recall Learn/Recall mode.
// Mirrors lib/parks/types.ts — same projection + card + layer shape, applied
// one level up (continent → country) instead of (India → state).
//
// Country *shapes* in each continent's JSON (e.g. south-america.json) are
// real borders (Natural Earth via world-50m.json — see lib/orgs/geo.ts for
// the same source used elsewhere in this repo), reprojected into that
// file's own equirectangular frame. Everything else here (cities, rivers,
// lakes, mountains, terrain, oceans) is real data too, keyed by country,
// and shares that same lon/lat → viewBox projection.

/** A feature placed by geographic coordinates (projected at runtime via projectPoint). */
interface GeoPoint {
  name: string;
  lon: number;
  lat: number;
}

/** Political layer: capital or major city — the primary, card-bearing marker. */
export interface City extends GeoPoint {
  capital: boolean;
  note: string; // UPSC-relevant "why this city matters"
}

/** Rivers & Lakes layer — river as a simple lon/lat polyline (see riverPath). */
export interface River {
  name: string;
  pts: [lon: number, lat: number][];
}

/** Rivers & Lakes layer — lake/lagoon/waterfall point (no card, click reveals name + note). */
export interface Lake extends GeoPoint {
  note: string;
  /** Defaults to "lake" when omitted — "waterfall" swaps the marker colour. */
  kind?: "lake" | "waterfall";
}

/** Mountains & Volcanoes layer. */
export interface Peak extends GeoPoint {
  volcano: boolean;
  note: string;
}

/** Physical-features layer: desert / plateau / grassland / forest, all in one toggle. */
export type TerrainKind = "desert" | "plateau" | "grassland" | "forest";
export interface Terrain extends GeoPoint {
  kind: TerrainKind;
  note: string;
}

/** Always-on background layer: oceans/seas around the continent — orientation
    context, not a toggle-gated layer, since a student needs it just to read
    the map (matches state boundaries always being visible in the parks tool). */
export type WaterKind = "ocean" | "sea";
export interface WaterBody extends GeoPoint {
  kind: WaterKind;
}

/** Per-country keyed datasets (keys are country names, e.g. "Brazil"). */
export type CitiesByCountry = Record<string, City[]>;
export type RiversByCountry = Record<string, River[]>;
export type LakesByCountry = Record<string, Lake[]>;
export type PeaksByCountry = Record<string, Peak[]>;
export type TerrainByCountry = Record<string, Terrain[]>;

/* ── per-continent map JSON (e.g. south-america.json) ── */

export interface CountryShape {
  name: string;
  d: string; // SVG path in viewBox units
  bbox: [number, number, number, number]; // [x, y, w, h] in viewBox units
}

export interface MapProjection {
  minlon: number;
  maxlat: number;
  coslat: number;
  scale: number;
}

export interface ContinentMap {
  viewBox: [number, number, number, number];
  proj: MapProjection;
  countries: CountryShape[];
}

export interface ContinentMeta {
  id: string;
  label: string;
  /** false = coming soon, disabled pill, no data file wired up yet. */
  ready: boolean;
}

/**
 * Pure projection helper: geographic lon/lat → [x, y] in map viewBox units.
 * Identical formula to lib/parks/types.ts's projectPoint — kept as its own
 * copy (not a shared import) so the two tools' geo pipelines stay decoupled.
 */
export function projectPoint(
  proj: MapProjection,
  lon: number,
  lat: number
): [number, number] {
  return [
    (lon - proj.minlon) * proj.coslat * proj.scale,
    (proj.maxlat - lat) * proj.scale,
  ];
}

/** River polyline → an SVG path string, projecting each [lon, lat] pair. */
export function riverPath(proj: MapProjection, pts: [number, number][]): string {
  return pts
    .map((pt, i) => {
      const [x, y] = projectPoint(proj, pt[0], pt[1]);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
}
