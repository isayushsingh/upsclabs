// scripts/extract-real-rivers.mjs
// Pulls real river geometry out of Natural Earth's rivers_lake_centerlines
// dataset (same public-domain family as lib/orgs/world-50m.json, the source
// for every country border in the world-map tool) instead of hand-drawing
// approximate waypoints — see lib/worldmap/types.ts's header comment for
// which layers/continents have been upgraded this way so far.
//
// Source files live in lib/worldmap/sources/ (committed, a few MB — fetched
// once from https://github.com/nvkelso/natural-earth-vector, geojson/
// ne_{50m,10m}_rivers_lake_centerlines.geojson and ne_50m_lakes.geojson; the
// 10m tier is only needed for rivers too minor to appear at 50m, e.g. the
// Orinoco's Caroní tributary). Re-fetch with:
//   curl -o lib/worldmap/sources/ne_50m_rivers_lake_centerlines.geojson \
//     https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_rivers_lake_centerlines.geojson
//   (swap 50m -> 10m, or rivers_lake_centerlines -> lakes, for the others)
//
// Usage: edit CONTINENT/COUNTRIES/HARVEST below for the next continent,
// then `node scripts/extract-real-rivers.mjs` — it rewrites just that
// continent's block in lib/worldmap/rivers.json (and, if TITICACA-style
// lake lookups are added, lib/worldmap/lakes.json), leaving every other
// continent's data untouched.
//
// What it can't do: some rivers are too minor for even the 10m tier (the
// Orinoco's Caura, here) and Natural Earth's regions layers don't cover
// named vegetation/landform regions like the Amazon's Selvas or Venezuela's
// Llanos at all — those stay hand-placed from general knowledge, flagged
// with a comment wherever they're added to HARVEST_MANUAL below.

import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { feature } from "topojson-client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const SRC = join(root, "lib/worldmap/sources/");

// ── edit per continent ──────────────────────────────────────────────────
const CONTINENT = "south-america";
const COUNTRIES = [
  "Colombia", "Venezuela", "Guyana", "Suriname", "Ecuador", "Peru",
  "Brazil", "Bolivia", "Chile", "Paraguay", "Argentina", "Uruguay",
];
// [displayName, sourceTier ("50m" | "10m"), matchName] — matchName must be
// byte-exact against the dataset's "name" property (some carry odd spacing,
// e.g. Natural Earth's "São  Francisco" has a doubled space).
const HARVEST = [
  ["Amazon", "50m", "Amazonas"],
  ["Ucayali (Amazon headwater)", "50m", "Ucayali"],
  ["Marañón (Amazon headwater)", "50m", "Marañón"],
  ["Orinoco", "50m", "Orinoco"],
  ["Caroní", "10m", "Caroní"],
  ["Magdalena", "50m", "Magdalena"],
  ["Madeira", "50m", "Madeira"],
  ["São Francisco", "50m", "São  Francisco"],
  ["Paraná", "50m", "Paraná"],
];
// Ambiguous-name rivers needing a lat/lon guard so the wrong same-named
// river elsewhere in the world isn't picked up (e.g. Argentina also has its
// own, unrelated "Río Negro" in Patagonia — the Amazon-basin one is north
// of -10°).
const HARVEST_GUARDED = [
  { displayName: "Rio Negro", tier: "50m", matchName: "Negro", keep: (pt) => pt[1] > -10 },
];
// Real geometry with no `name` tag in either tier at this generalization
// (confirmed absent by name search) — kept as the closest bbox match
// instead, then relabeled by hand.
const HARVEST_UNNAMED_BBOX = [
  { displayName: "Paraguay River", tier: "10m", lon: [-61, -56], lat: [-28, -17] },
];
// No Natural Earth match at all (below both tiers' generalization
// threshold) — hand-placed from general knowledge, not extracted.
const MANUAL = {
  Venezuela: [{ name: "Caura", pts: [[-64.8, 5.0], [-64.85, 6.3], [-64.9, 7.4]] }],
  Argentina: [{ name: "Río de la Plata", pts: [[-58.5, -34.5], [-57.0, -35.0], [-55.5, -36.0]] }],
  Paraguay: [{ name: "Paraguay River", pts: [[-57.9, -22.0], [-58.0, -24.5], [-58.2, -27.4]] }],
};
// ── end edit ─────────────────────────────────────────────────────────────

const rivers50 = JSON.parse(fs.readFileSync(join(SRC, "ne_50m_rivers_lake_centerlines.geojson"), "utf8"));
const rivers10 = JSON.parse(fs.readFileSync(join(SRC, "ne_10m_rivers_lake_centerlines.geojson"), "utf8"));
const byTier = { "50m": rivers50, "10m": rivers10 };

const topo = JSON.parse(fs.readFileSync(join(root, "lib/orgs/world-50m.json"), "utf8"));
const collection = feature(topo, topo.objects.countries);
const countryPolys = COUNTRIES.map((name) => {
  const f = collection.features.find((f) => f.properties.name === name);
  if (!f) throw new Error(`Country not found in world-50m.json: ${name}`);
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  return { name, polys };
});

function pointInRing(pt, ring) {
  let inside = false;
  const [x, y] = pt;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
function countryOf(pt) {
  for (const c of countryPolys) if (c.polys.some((poly) => pointInRing(pt, poly[0]))) return c.name;
  return null;
}
// Majority vote over a segment's points; falls back to the nearest
// country's boundary (by any point) when every point is offshore, e.g. a
// river mouth/delta channel past the mapped coastline.
function assignSegment(pts) {
  const votes = {};
  for (const p of pts) { const c = countryOf(p); if (c) votes[c] = (votes[c] || 0) + 1; }
  const entries = Object.entries(votes);
  if (entries.length) return entries.sort((a, b) => b[1] - a[1])[0][0];
  const mid = pts[Math.floor(pts.length / 2)];
  let best = null, bestD = Infinity;
  for (const c of countryPolys) for (const poly of c.polys) for (const [x, y] of poly[0]) {
    const d = (x - mid[0]) ** 2 + (y - mid[1]) ** 2;
    if (d < bestD) { bestD = d; best = c.name; }
  }
  return best;
}
function flattenSegments(geom) {
  if (geom.type === "LineString") return [geom.coordinates];
  if (geom.type === "MultiLineString") return geom.coordinates;
  return [];
}
function round(pts) {
  return pts.map(([lon, lat]) => [Math.round(lon * 10000) / 10000, Math.round(lat * 10000) / 10000]);
}

// Keyed by "country|displayName" -> longest matching segment. Natural
// Earth often carries the *same* river twice at one tier — once as the
// river itself (featurecla "River") and once as a "Lake Centerline" where
// it briefly widens into a reservoir along its course (e.g. behind a dam) —
// so "River" is required, and country|name collisions keep whichever
// segment has the most points (the dominant continuous piece; smaller
// braids/forks are dropped rather than stitched, which is the right level
// of fidelity for a study map, not a surveyed one).
const best = {};
function offer(country, name, pts) {
  const key = `${country}|${name}`;
  if (!best[key] || pts.length > best[key].length) best[key] = pts;
}

for (const [displayName, tier, matchName] of HARVEST) {
  const feats = byTier[tier].features.filter(
    (f) => f.properties.name === matchName && f.properties.featurecla === "River"
  );
  for (const f of feats) for (const seg of flattenSegments(f.geometry)) {
    if (seg.length < 2) continue;
    const country = assignSegment(seg);
    if (country) offer(country, displayName, seg);
  }
}
for (const { displayName, tier, matchName, keep } of HARVEST_GUARDED) {
  const feats = byTier[tier].features.filter(
    (f) => f.properties.name === matchName && f.properties.featurecla === "River"
  );
  for (const f of feats) for (const seg of flattenSegments(f.geometry)) {
    if (seg.length < 2) continue;
    if (!keep(seg[Math.floor(seg.length / 2)])) continue;
    const country = assignSegment(seg);
    if (country) offer(country, displayName, seg);
  }
}
for (const { displayName, tier, lon, lat } of HARVEST_UNNAMED_BBOX) {
  for (const f of byTier[tier].features) {
    if (f.properties.name) continue;
    for (const seg of flattenSegments(f.geometry)) {
      if (seg.length < 2) continue;
      const inBox = seg.every(([x, y]) => x > lon[0] && x < lon[1] && y > lat[0] && y < lat[1]);
      if (!inBox) continue;
      const country = assignSegment(seg);
      if (country) offer(country, displayName, seg);
    }
  }
}

const out = {};
for (const [key, pts] of Object.entries(best)) {
  const [country, name] = key.split("|");
  (out[country] ??= []).push({ name, pts: round(pts) });
}
for (const [country, entries] of Object.entries(MANUAL)) {
  (out[country] ??= []).push(...entries);
}

const riversPath = join(root, "lib/worldmap/rivers.json");
const rivers = JSON.parse(fs.readFileSync(riversPath, "utf8"));
rivers[CONTINENT] = out;
fs.writeFileSync(riversPath, JSON.stringify(rivers, null, 2) + "\n");

console.log(`rivers.json["${CONTINENT}"] rewritten:`);
for (const [c, rs] of Object.entries(out)) console.log(" ", c, rs.map((r) => `${r.name}(${r.pts.length}pts)`).join(", "));
