// lib/orgs/geo.ts
// Converts the pre-baked world-50m.json (Natural Earth borders via
// world-atlas, ISO3 codes attached at prep time — see world-50m.json's
// origin in the tool's data-pipeline notes) into SVG path data, once, at
// module load. A flat Equal Earth-family projection (geoNaturalEarth1) so
// the whole world reads in one glance — unlike the per-continent tool, an
// org's members can land on any continent, so there's no "zoom to region"
// to fall back on.
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry, MultiPolygon } from "geojson";
import worldTopo from "./world-50m.json";
import indiaClaimGeometry from "./india-claim.json";

export interface CountryProps {
  name: string;
  iso3: string | null;
}

export const VIEW_WIDTH = 960;
export const VIEW_HEIGHT = 500;

const topology = worldTopo as unknown as Parameters<typeof feature>[0];
const countriesObject = (topology as any).objects.countries;

const collection = feature(
  topology,
  countriesObject
) as unknown as FeatureCollection<Geometry, CountryProps>;

// Natural Earth draws India's northern edge along the Line of Control,
// dropping Jammu & Kashmir's India-administered north, Aksai Chin, and the
// Shaksgam Valley into Pakistan's/China's polygons instead — accurate to
// on-the-ground control, but not to India's own (and this site's) official
// boundary. Swap in a composite claim polygon compiled specifically for that
// purpose (India + Aksai Chin from the US State Dept's LSIB dataset, PoK
// from Pakistan's own admin boundaries, Shaksgam Valley from Natural
// Earth's disputed-areas layer — datameet/maps, CC-0) instead of patching
// the coastline/mainland shape by hand.
const INDIA_CLAIM = indiaClaimGeometry as unknown as MultiPolygon;

// Antarctica swamps the projection's scale (it's a huge, org-irrelevant
// landmass at the bottom of every map) — drop it before fitting so the rest
// of the world fills the frame instead of shrinking to make room for it.
// The stock "India" polygon and the standalone "Siachen Glacier" sliver (a
// separate feature in this dataset, split out for the same LoC reason) are
// both replaced/absorbed by INDIA_CLAIM above.
//
// INDIA_CLAIM geographically overlaps China's and Pakistan's own stock
// polygons in Aksai Chin / PoK (Natural Earth draws those as plain Chinese/
// Pakistani territory, same area INDIA_CLAIM also covers) — two <path>s
// painting the same pixels. Whichever is later in this array (later in the
// SVG) wins the overlap visually; India happened to land before China in
// the topology's own feature order, so China's neutral fill was silently
// painting over India's claim there. Moving India to the very end fixes it
// regardless of any other reordering upstream.
export const COUNTRIES: FeatureCollection<Geometry, CountryProps> = {
  type: "FeatureCollection",
  features: (() => {
    const rest: typeof collection.features = [];
    let india: typeof collection.features[number] | null = null;
    for (const f of collection.features) {
      if (f.properties?.iso3 === "ATA" || f.properties?.name === "Siachen Glacier") continue;
      if (f.properties?.iso3 === "IND") {
        india = { ...f, geometry: INDIA_CLAIM };
      } else {
        rest.push(f);
      }
    }
    return india ? [...rest, india] : rest;
  })(),
};

const projection = geoNaturalEarth1().fitSize(
  [VIEW_WIDTH, VIEW_HEIGHT],
  COUNTRIES
);

const pathGenerator = geoPath(projection);

export interface CountryShape {
  /** Unique per feature — a couple of ISO3 codes cover more than one
      geometry (e.g. Australia plus an outlying uninhabited territory both
      carry "AUS"), so this, not iso3, is the React key. */
  id: string;
  iso3: string;
  name: string;
  /** Precomputed once at module load — geometry never changes per render,
      only fill/stroke do, so there's no reason to re-run geoPath per paint. */
  d: string;
  centroid: [number, number];
}

/** For a country whose territory is split across several disconnected
    polygons (mainland + overseas departments/islands, e.g. France's
    mainland + French Guiana + Réunion...), `pathGenerator.centroid` on the
    whole MultiPolygon averages across *all* of them — France's own came
    out sitting over Spain, pulled there by French Guiana's projected
    weight. A label/marker needs one on-screen point that's recognizably
    "in" the country, so use the centroid of the single largest sub-polygon
    instead of a combined average nobody's territory actually occupies. */
function bestCentroid(f: (typeof COUNTRIES.features)[number]): [number, number] {
  if (f.geometry.type !== "MultiPolygon" || f.geometry.coordinates.length <= 1) {
    return pathGenerator.centroid(f);
  }
  let largest = f.geometry.coordinates[0];
  let largestArea = 0;
  for (const poly of f.geometry.coordinates) {
    const area = Math.abs(
      pathGenerator.area({ type: "Polygon", coordinates: poly })
    );
    if (area > largestArea) {
      largestArea = area;
      largest = poly;
    }
  }
  return pathGenerator.centroid({ type: "Polygon", coordinates: largest });
}

/** One ISO3 code — "AUS" — is shared by two features here: Australia
    itself, and Ashmore and Cartier Islands (an uninhabited external
    territory Natural Earth draws as its own polygon). Every shape still
    needs the *country's* own name and every iso3-keyed lookup (the
    founding-member badge, the click-to-open-card name) still needs to land
    on the country proper — so for each iso3, find its largest-area feature
    once and treat that as canonical for the whole code. */
const canonicalByIso3 = new Map<
  string,
  { name: string; area: number; feature: (typeof COUNTRIES.features)[number] }
>();
for (const f of COUNTRIES.features) {
  const iso3 = f.properties?.iso3;
  if (!iso3) continue;
  const area = Math.abs(pathGenerator.area(f));
  const existing = canonicalByIso3.get(iso3);
  if (!existing || area > existing.area) {
    canonicalByIso3.set(iso3, { name: f.properties!.name, area, feature: f });
  }
}

/** Ordered list of every renderable country, geometry pre-baked. Multi-part
    countries with a null/degenerate centroid (rare, e.g. some archipelagos)
    still render — the centroid is only used for the small founding-member
    ring marker, and a slightly-off marker beats no marker at all. */
export const COUNTRY_SHAPES: CountryShape[] = COUNTRIES.features
  .filter((f) => f.properties?.iso3)
  .map((f, i) => ({
    id: `${f.properties!.iso3}-${i}`,
    iso3: f.properties!.iso3 as string,
    name: canonicalByIso3.get(f.properties!.iso3 as string)!.name,
    d: pathGenerator(f) ?? "",
    centroid: bestCentroid(f),
  }));

/** iso3 → shape, for O(1) lookups when painting a selected org's members —
    always the *largest* shape for that code (mainland Australia, not
    Ashmore and Cartier Is.), so a founding-member badge or the country-card
    name lands on the country proper regardless of which sub-territory a
    click actually landed on. */
export const COUNTRY_BY_ISO3: Map<string, CountryShape> = new Map(
  [...canonicalByIso3.entries()].map(([iso3, { name, feature: f }]) => [
    iso3,
    {
      id: `${iso3}-canonical`,
      iso3,
      name,
      d: pathGenerator(f) ?? "",
      centroid: bestCentroid(f),
    },
  ])
);
