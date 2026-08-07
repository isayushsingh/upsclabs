// lib/geo/types.ts
// Domain types for GS1 Geography recall tools (Rivers, and later Mountains).

/** A named line feature (river course, mountain ridge) drawn on the India map.
    `paths` may hold multiple disjoint SVG subpaths — e.g. a river's course as
    it was originally split per-state before merging into one feature. */
export interface RiverFeature {
  id: string;
  name: string;
  paths: string[]; // pre-projected SVG path(s), india.json viewBox units
  anchor: [number, number]; // label position
  major: boolean; // primary river worth quizzing vs. minor/context only
  system: string; // top-level river system, e.g. "Ganga", "Godavari" — used to filter the map
  basin?: string | null;
  origin?: string | null;
  tributaries?: string[];
  note?: string | null; // UPSC significance
}
