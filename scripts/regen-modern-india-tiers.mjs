// Regenerates the `tier` field ("core" | "context") on every event in
// lib/timeline/modernIndia.json from one canonical rule, instead of relying
// on it staying correct across manual edits (it has silently drifted twice).
//
// Run: node scripts/regen-modern-india-tiers.mjs
//
// "context" = real, sourced, but second-tier for the standard UPSC GS1
// modern-India narrative: individual newspaper launches, codification
// housekeeping (IPC/CrPC/Civil Procedure Code), one-off frontier wars, and
// second-tier reform societies. Everything else defaults to "core".
//
// PROMOTED lists context events that are nonetheless a node in a curated
// causedBy/leadsTo chain — if hidden, the causal-overlay feature would
// silently lose that link, so these are always forced back to "core"
// regardless of the MINOR set below.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, "..", "lib", "timeline", "modernIndia.json");

const MINOR = new Set([
  "e2", "e3", "e8", "e9", "e10", "e12", "e13", "e14", "e15", "e16", "e17", "e18",
  "e21", "e23", "e26", "e29",
  "e40", "e41", "e42", "e43", "e44",
  "e49", "e52", "e53", "e54",
  "e56", "e57", "e58", "e59", "e60", "e61",
  "e63", "e65", "e66",
  "e70", "e73", "e74", "e75",
  "e78", "e80", "e81",
  "e85", "e88", "e89",
  "e92", "e96", "e97",
  "e99", "e101", "e103", "e104",
  "e106", "e107", "e110", "e111",
  "e113", "e114", "e116", "e117",
  "e123", "e126", "e127",
  "e134", "e137", "e141",
  "e146", "e147", "e149",
  "e153", "e154", "e155",
  "e157", "e158", "e159",
  "e169",
  "e182", "e183", "e184", "e185",
  "e189", "e191", "e193", "e195",
  "e202", "e209", "e212", "e216", "e224",
]);
const PROMOTED = new Set(["e96", "e97", "e216", "e224"]);

const events = JSON.parse(readFileSync(DATA_PATH, "utf8"));

for (const e of events) {
  e.tier = MINOR.has(e.id) && !PROMOTED.has(e.id) ? "context" : "core";
}

// Integrity check: every causedBy/leadsTo target must exist, and a core
// event's targets must also be core (or the causal overlay silently drops them).
const byId = Object.fromEntries(events.map((e) => [e.id, e]));
let issues = 0;
for (const e of events) {
  for (const id of [...(e.causedBy ?? []), ...(e.leadsTo ?? [])]) {
    if (!byId[id]) {
      console.error(`DANGLING: ${e.id} -> ${id}`);
      issues++;
    } else if (e.tier === "core" && byId[id].tier !== "core") {
      console.error(`CORE->CONTEXT LEAK: ${e.id} -> ${id}`);
      issues++;
    }
  }
}
if (issues > 0) {
  console.error(`${issues} integrity issue(s) found — not writing the file.`);
  process.exit(1);
}

writeFileSync(DATA_PATH, JSON.stringify(events, null, 2) + "\n");
const core = events.filter((e) => e.tier === "core").length;
console.log(`Wrote ${DATA_PATH}: ${events.length} events, ${core} core / ${events.length - core} context.`);
