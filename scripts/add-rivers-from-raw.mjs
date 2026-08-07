// Reusable tool: pulls specific named rivers out of the raw 500MB WRIS
// dataset (lib/rivers/rivers.geojson — one Feature per line), projects them
// into india.json's viewBox, simplifies the geometry, and appends them to
// lib/geo/rivers.json as new entries (skipping names already present).
//
// Edit TARGETS below for each new batch, then: node scripts/add-rivers-from-raw.mjs
//
// Tips for building TARGETS:
//   grep -o '"rivname": "<Name>"[^}]*}' lib/rivers/rivers.geojson \
//     | grep -o '"ba_name": "[^"]*"\|"sub_basin": "[^"]*"'
//   — use ba_name/sub_basin to disambiguate rivers that share a name
//     across different basins (e.g. there are several rivers called "Kali").

import { createReadStream, readFileSync, writeFileSync, existsSync } from "fs";
import { createInterface } from "readline";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const india = JSON.parse(readFileSync(join(root, "lib/parks/india.json"), "utf8"));
const PROJ = india.proj;
const riversPath = join(root, "lib/geo/rivers.json");
const rivers = JSON.parse(readFileSync(riversPath, "utf8"));

// ── edit per batch ──────────────────────────────────────────────────────
// output name -> { match(properties) => boolean, content: {...RiverFeature fields} }
const TARGETS = {
  // "Sun Kosi": {
  //   match: (p) => p.rivname === "Sun Kosi",
  //   content: { basin: "Ganga (via the Kosi)", origin: "Nepal Himalaya" },
  // },
};
// ── end edit ────────────────────────────────────────────────────────────

if (Object.keys(TARGETS).length === 0) {
  console.log("No TARGETS configured — edit scripts/add-rivers-from-raw.mjs and re-run.");
  process.exit(0);
}

function slugify(name) {
  return name.toLowerCase().replace(/[()]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function projectPoint(lon, lat) {
  return [(lon - PROJ.minlon) * PROJ.coslat * PROJ.scale, (PROJ.maxlat - lat) * PROJ.scale];
}

/** Iterative Ramer-Douglas-Peucker on projected points — raw WRIS geometry
    is full survey resolution; curated rivers.json paths run a few hundred
    points per segment, so simplify down to match. */
function simplify(points, epsilon) {
  const n = points.length;
  if (n < 3) return points;
  const keep = new Uint8Array(n);
  keep[0] = 1;
  keep[n - 1] = 1;
  const stack = [[0, n - 1]];
  while (stack.length) {
    const [start, end] = stack.pop();
    if (end - start < 2) continue;
    const [x1, y1] = points[start];
    const [x2, y2] = points[end];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const norm = Math.sqrt(dx * dx + dy * dy) || 1;
    let maxDist = 0;
    let index = -1;
    for (let i = start + 1; i < end; i++) {
      const [x, y] = points[i];
      const dist = Math.abs(dy * x - dx * y + x2 * y1 - y2 * x1) / norm;
      if (dist > maxDist) {
        maxDist = dist;
        index = i;
      }
    }
    if (maxDist > epsilon && index !== -1) {
      keep[index] = 1;
      stack.push([start, index]);
      stack.push([index, end]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

function toPath(coords) {
  const projected = coords.map(([lon, lat]) => projectPoint(lon, lat));
  const simplified = simplify(projected, 0.35);
  return simplified.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

const rawPath = join(root, "lib/rivers/rivers.geojson");
if (!existsSync(rawPath)) {
  console.error(`Missing ${rawPath}`);
  process.exit(1);
}

const collected = {};
const rl = createInterface({ input: createReadStream(rawPath, "utf8"), crlfDelay: Infinity });

for await (const line of rl) {
  if (!line.startsWith('{ "type": "Feature"')) continue;
  let feature;
  try {
    feature = JSON.parse(line.trim().replace(/,$/, ""));
  } catch {
    continue;
  }
  const p = feature.properties;
  for (const [name, target] of Object.entries(TARGETS)) {
    if (!target.match(p)) continue;
    const geom = feature.geometry;
    if (!geom) continue;
    const lines =
      geom.type === "LineString" ? [geom.coordinates] : geom.type === "MultiLineString" ? geom.coordinates : [];
    for (const coords of lines) {
      if (coords.length < 2) continue;
      (collected[name] ??= []).push({ coords, len: coords.length });
    }
  }
}

let added = 0;
for (const [name, segments] of Object.entries(collected)) {
  if (rivers.some((r) => r.name === name)) {
    console.log(`skip "${name}" — already in rivers.json`);
    continue;
  }
  segments.sort((a, b) => b.len - a.len);
  const mid = segments[0].coords[Math.floor(segments[0].coords.length / 2)];
  const content = TARGETS[name].content ?? {};
  rivers.push({
    id: slugify(name),
    name,
    paths: segments.map((s) => toPath(s.coords)),
    anchor: projectPoint(mid[0], mid[1]),
    major: content.major ?? true,
    basin: content.basin ?? null,
    origin: content.origin ?? null,
    tributaries: content.tributaries ?? [],
    note: content.note ?? null,
  });
  added++;
}

for (const name of Object.keys(TARGETS)) {
  if (!collected[name]) console.log(`not found in raw data: "${name}"`);
}

rivers.sort((a, b) => a.name.localeCompare(b.name));
writeFileSync(riversPath, JSON.stringify(rivers, null, 2) + "\n");
console.log(`Added ${added} rivers. Total: ${rivers.length}`);
