// Validates the homepage hero quiz bank (lib/heroQuiz.ts) against the tool
// registry and the app's routes. Run with `npm test`.
//
// Loads the .ts files directly through Node's built-in type stripping
// (Node 22.18+ / 23.6+), so there's no test framework or build step to add.

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { HERO_QUESTIONS } from "../lib/heroQuiz.ts";
import { TOOLS } from "../lib/tools.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const MIN_PER_TOOL = 5;

const errors = [];
const fail = (q, msg) => errors.push(`${q?.id ?? "?"}: ${msg}`);

const liveTools = new Map(TOOLS.filter((t) => t.state === "live" && t.href).map((t) => [t.slug, t]));
const seen = new Set();
const perTool = new Map();

for (const q of HERO_QUESTIONS) {
  if (seen.has(q.id)) fail(q, "duplicate id");
  seen.add(q.id);

  if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 4)
    fail(q, `needs 2–4 options, has ${q.options?.length}`);
  if (new Set(q.options).size !== q.options.length) fail(q, "duplicate option text");
  if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex >= q.options.length)
    fail(q, `answerIndex ${q.answerIndex} out of range`);

  for (const field of ["question", "explanation", "source", "toolName", "subject"])
    if (!q[field]?.trim()) fail(q, `missing ${field}`);

  const tool = liveTools.get(q.toolId);
  if (!tool) fail(q, `toolId "${q.toolId}" is not a live tool in lib/tools.ts`);

  const path = q.toolHref.split(/[?#]/)[0];
  if (tool && path !== tool.href) fail(q, `toolHref ${path} doesn't match the tool's href ${tool.href}`);
  if (!existsSync(join(root, "app", path, "page.tsx"))) fail(q, `toolHref ${path} has no app/${path}/page.tsx`);

  perTool.set(q.toolId, (perTool.get(q.toolId) ?? 0) + 1);
}

for (const [id, n] of perTool) if (n < MIN_PER_TOOL) errors.push(`${id}: only ${n} questions (want ${MIN_PER_TOOL}+)`);

// Answer-position spread: a bank where the right answer is always "B"
// is gameable. Warn (don't fail) if one slot holds over half the answers.
const slots = [0, 0, 0, 0];
for (const q of HERO_QUESTIONS) if (q.options.length === 4) slots[q.answerIndex]++;
const fourOpt = slots.reduce((a, b) => a + b, 0);
const skewed = Math.max(...slots) > fourOpt / 2;

if (errors.length) {
  console.error(`✗ hero quiz: ${errors.length} problem(s)\n  ` + errors.join("\n  "));
  process.exit(1);
}
console.log(
  `✓ hero quiz: ${HERO_QUESTIONS.length} questions across ${perTool.size} tools ` +
    `(${[...perTool].map(([id, n]) => `${id} ${n}`).join(", ")})`
);
console.log(`  answer slots A–D on 4-option questions: ${slots.join(" / ")}${skewed ? "  ⚠ skewed" : ""}`);
const untested = [...liveTools.keys()].filter((id) => !perTool.has(id));
if (untested.length) console.log(`  live tools with no questions: ${untested.join(", ")}`);
