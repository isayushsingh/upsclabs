// lib/parks/types.ts
// Domain types for the National Parks & Tiger Reserves tool (GS3 · Environment).
// Data is stored keyed by state name in the sibling JSON files.

/** IUCN Red List category used in species tags. */
export type IUCNStatus = "CR" | "EN" | "VU" | "NT" | "LC";

/** Species annotation flags: "end" = endemic ✦, "state" = state animal/bird ◆. */
export type SpeciesFlag = "end" | "state";

/** [common name, IUCN category, flags]. Stored as a tuple in the JSON. */
export type Species = [name: string, iucn: IUCNStatus, flags: SpeciesFlag[]];

/** Terrain glyph: △ range/hill, ≈ desert/rann, "" plateau/plain/valley. */
export type TerrainSymbol = "△" | "≈" | "";

/** A feature placed by geographic coordinates (projected at runtime via projectPoint). */
interface GeoPoint {
  name: string;
  lon: number;
  lat: number;
}

/** National park — the primary, card-bearing marker. */
export interface Park extends GeoPoint {
  /** Also a tiger-reserve core → renders half-amber under the Tiger Reserves layer. */
  tr: boolean;
  bio?: boolean; // Biosphere Reserve badge
  whs?: boolean; // UNESCO World Heritage Site badge
  ramsar?: boolean; // Ramsar site badge
  river: string;
  veg: string;
  note: string; // UPSC significance
  species: Species[];
}

/** Standalone tiger reserve (no NP core) — amber marker, card-bearing. */
export interface TigerReserve extends GeoPoint {
  note: string;
  species: Species[];
}

/** Faint wetland context marker (teal droplet, no card). */
export type Wetland = GeoPoint;

/** Faint terrain / physical-feature label (brown, no card). */
export interface Terrain extends GeoPoint {
  sym: TerrainSymbol;
}

/** Faint river polyline: pre-projected SVG path + sampled points for label anchoring. */
export interface River {
  name: string;
  d: string; // SVG path, already in map viewBox units
  pts: [number, number][]; // sampled points for label placement
}

/** Per-state keyed datasets (keys are state/UT names, e.g. "Madhya Pradesh"). */
export type ParksByState = Record<string, Park[]>;
export type ReservesByState = Record<string, TigerReserve[]>;
export type WetlandsByState = Record<string, Wetland[]>;
export type TerrainByState = Record<string, Terrain[]>;
export type RiversByState = Record<string, River[]>;

/* ── india.json (derived from the validated map_inline.json) ── */

export interface StateShape {
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

export interface IndiaMap {
  viewBox: [number, number, number, number];
  proj: MapProjection;
  states: StateShape[];
}

/**
 * Pure projection helper: geographic lon/lat → [x, y] in map viewBox units.
 * Mirrors the equirectangular projection baked into the state geometry:
 *   x = (lon − minlon) · cos(lat₀) · scale
 *   y = (maxlat − lat) · scale
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
