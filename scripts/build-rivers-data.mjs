// One-off script: merges the per-state river segments in lib/parks/rivers.json
// (already pre-projected into india.json's viewBox units) into one national
// feature per river. Run with `node scripts/build-rivers-data.mjs`.
// Output: lib/geo/rivers.json — placeholder content (major/basin/origin/note
// filled in by hand afterwards from the user's notes).

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const riversByState = JSON.parse(
  readFileSync(join(root, "lib/parks/rivers.json"), "utf8")
);

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Rough path "length" proxy: number of sampled points, good enough to pick
    the longest segment for label placement without a real arc-length calc. */
function segmentWeight(seg) {
  return seg.pts?.length ?? 0;
}

function midpoint(pts) {
  const [x, y] = pts[Math.floor(pts.length / 2)];
  return [x, y];
}

const byName = new Map();

for (const [, rivers] of Object.entries(riversByState)) {
  for (const r of rivers) {
    if (!byName.has(r.name)) byName.set(r.name, []);
    byName.get(r.name).push(r);
  }
}

const features = [...byName.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, segments]) => {
    const longest = segments.reduce((a, b) =>
      segmentWeight(b) > segmentWeight(a) ? b : a
    );
    return {
      id: slugify(name),
      name,
      paths: segments.map((s) => s.d),
      anchor: midpoint(longest.pts),
      major: false,
      basin: null,
      origin: null,
      tributaries: [],
      note: null,
    };
  });

writeFileSync(
  join(root, "lib/geo/rivers.json"),
  JSON.stringify(features, null, 2) + "\n"
);

console.log(`Wrote ${features.length} rivers to lib/geo/rivers.json`);
