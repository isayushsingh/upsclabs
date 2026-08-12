// Modern India (1857–1947) timeline data + layout math.
// The event list itself (lib/timeline/modernIndia.json) is enriched with
// three things a plain chronology doesn't give you:
//   - `strand`   — which parallel thread of the freedom struggle this belongs to
//     (rendered as a card's colour, not a row — see ModernIndiaTimeline.tsx)
//   - `causedBy` / `leadsTo` — curated causal edges across strands (a seed set
//     of the highest-confidence, most-taught chains — not exhaustive)
//   - `tier`     — "core" (the load-bearing, grand-narrative milestones) vs
//     "context" (real, sourced, but second-tier: individual newspaper
//     launches, codification housekeeping, minor reform societies). Hand-
//     picked against the standard UPSC GS1 narrative, then any "context"
//     event that's causally linked to a "core" one was auto-promoted so a
//     causal chain never silently breaks when context events are hidden.
//
// Layout: one vertical column per *calendar* year (1857–1947, 91 of them,
// including years with zero events — an empty column is itself information,
// it says "quiet stretch"). A year is a real, fixed-width bucket now, not a
// point on a continuous scale, so there is no lane-packing/collision math
// left to get wrong: an event's x comes straight from its year's column
// index, and events sharing a year just stack top-to-bottom inside it.

import rawEvents from "./modernIndia.json";

export type StrandId =
  | "administrative-imperial-policy"
  | "nationalist-orgs-political-forums"
  | "mass-struggle-gandhian"
  | "revolutionary-movements"
  | "press-education-social-reform"
  | "revolts-uprisings";

export type Tier = "core" | "context";

export interface TimelineEvent {
  id: string;
  year: number;
  /** short, card-sized label (e.g. "Government of India Act, 1858") */
  title: string;
  /** full sourced description — shown only in the detail panel, never on a card */
  event: string;
  strand: StrandId;
  citations: number[];
  causedBy?: string[];
  leadsTo?: string[];
  tier: Tier;
}

export const EVENTS = rawEvents as TimelineEvent[];
export const CORE_COUNT = EVENTS.filter((e) => e.tier === "core").length;

export interface Strand {
  id: StrandId;
  label: string;
  short: string;
  color: string;
  /** one-line gloss shown in the legend/filter chip tooltip */
  blurb: string;
}

// Row order, top → bottom: state action first, then the widening circle of
// organised/mass/underground/associational response beneath it — roughly the
// order the mockup used, kept because it reads as "cause row on top".
export const STRANDS: Strand[] = [
  {
    id: "administrative-imperial-policy",
    label: "British State: Acts, Wars & Policy",
    short: "Admin & Policy",
    color: "#6B6350",
    blurb: "Legislation, commissions, viceroys, wars, durbars — the Crown's moves.",
  },
  {
    id: "nationalist-orgs-political-forums",
    label: "Nationalist Organisations & Political Forums",
    short: "Orgs & Forums",
    color: "#23268C",
    blurb: "Congress, League, provincial sabhas, trade unions, party splits.",
  },
  {
    id: "mass-struggle-gandhian",
    label: "Mass Struggles & Gandhian Campaigns",
    short: "Mass Struggle",
    color: "#3F6B4A",
    blurb: "Satyagrahas, Non-Cooperation, Civil Disobedience, Quit India.",
  },
  {
    id: "revolutionary-movements",
    label: "Revolutionary Movements",
    short: "Revolutionary",
    color: "#8C2F39",
    blurb: "Secret societies, armed action, political trials and executions.",
  },
  {
    id: "press-education-social-reform",
    label: "Press, Education & Social Reform",
    short: "Press & Reform",
    color: "#B08A2E",
    blurb: "Newspapers, reform societies, education policy, social legislation.",
  },
  {
    id: "revolts-uprisings",
    label: "Revolts & Peasant Uprisings",
    short: "Revolts",
    color: "#8C4A3B",
    blurb: "1857 and the agrarian/tribal risings that ran alongside organised politics.",
  },
];

export const STRAND_BY_ID: Record<StrandId, Strand> = Object.fromEntries(
  STRANDS.map((s) => [s.id, s])
) as Record<StrandId, Strand>;

export interface Era {
  id: string;
  name: string;
  short: string;
  start: number;
  end: number;
}

// Boundaries chosen so each band holds a roughly comparable event count
// (27–57 of 230) rather than a comparable span of years (14–30) — the
// syllabus's own phase names, used as the zoom/snap unit.
export const ERAS: Era[] = [
  { id: "foundations", name: "Crown Rule & Early Associations", short: "1857–85", start: 1857, end: 1885 },
  { id: "moderate", name: "The Moderate Congress Era", short: "1885–1905", start: 1885, end: 1905 },
  { id: "swadeshi", name: "Swadeshi, Split & Revolutionary Ferment", short: "1905–19", start: 1905, end: 1919 },
  { id: "gandhian", name: "Gandhian Mass Movements", short: "1919–35", start: 1919, end: 1935 },
  { id: "endgame", name: "Provincial Autonomy to Partition", short: "1935–47", start: 1935, end: 1948 },
];

export const T_MIN = 1857;
export const T_MAX = 1947;

/** Every calendar year in range — used only to enumerate candidate years;
    layoutTimeline drops any year with zero (visible) events, so the actual
    column list depends on the current tier filter. */
export const YEARS: number[] = Array.from({ length: T_MAX - T_MIN + 1 }, (_, i) => T_MIN + i);

export const COLUMN_WIDTH = 210;
export const COLUMN_GAP = 8;
export const CARD_HEIGHT = 34;
/** Vertical gap between two cards stacked in the same year's column. */
export const CARD_GAP_Y = 10;
/** Margin either side of the first/last column, so nothing clips the canvas edge. */
export const EDGE_MARGIN = 10;
/** Reserved strip at the top of every column for its year (and, on an
    era's first column, the era name) — cards never start until below this,
    so a label never competes with a card for the same pixels. */
export const HEADER_HEIGHT = 46;

export interface LaidOutEvent extends TimelineEvent {
  /** x centre in px — the centre of its year's column */
  x: number;
  /** y centre in px */
  y: number;
}

export interface ColumnMeta {
  year: number;
  left: number;
  count: number;
  /** true for a column that starts a new era — carries the era label */
  eraStart?: Era;
}

export interface TimelineLayout {
  events: LaidOutEvent[];
  /** only years with at least one (visible) event get a column — empty
      years are skipped entirely, so this list is not evenly spaced by
      calendar year, and depends on the current strand/tier filters */
  columns: ColumnMeta[];
  /** every active year's column-centre x, for scroll-to-year and jump-to-event */
  xForYear: Map<number, number>;
  width: number;
  height: number;
}

/**
 * Lay every event out deterministically (no DOM measurement needed): x comes
 * from the event's year — one fixed-width column per year *that has at
 * least one visible event*, packed left-to-right with no gap for the years
 * in between that don't — never shifted within its own column, because the
 * x-axis *is* the fact being taught. Events sharing a year simply stack
 * top-to-bottom inside that column, in the order they appear in the data;
 * there's no collision math left to get wrong, and (unlike the old
 * lane-stacking swimlane version) one crowded year only makes *that* column
 * tall, not the whole canvas, since every column shares one flat row of
 * card-stacks capped by the single busiest year (at most 8 events, ~290px)
 * rather than the busiest *stretch*.
 */
export function layoutTimeline(sourceEvents: TimelineEvent[] = EVENTS): TimelineLayout {
  const byYear = new Map<number, TimelineEvent[]>();
  for (const e of sourceEvents) {
    const arr = byYear.get(e.year) ?? [];
    arr.push(e);
    byYear.set(e.year, arr);
  }
  const activeYears = YEARS.filter((y) => byYear.has(y));

  // An era's own start year might have zero visible events and so no column
  // of its own — the header still needs a home, so it lands on the first
  // active year at or after that era's start (and before the next era's).
  const eraForCol = new Map<number, Era>();
  for (const era of ERAS) {
    const y = activeYears.find((yr) => yr >= era.start && yr < era.end);
    if (y != null) eraForCol.set(y, era);
  }

  let maxCount = 1;
  const xForYear = new Map<number, number>();
  const columns: ColumnMeta[] = activeYears.map((year, i) => {
    const left = EDGE_MARGIN + i * (COLUMN_WIDTH + COLUMN_GAP);
    const count = byYear.get(year)!.length;
    maxCount = Math.max(maxCount, count);
    xForYear.set(year, left + COLUMN_WIDTH / 2);
    return { year, left, count, eraStart: eraForCol.get(year) };
  });

  const height = HEADER_HEIGHT + maxCount * (CARD_HEIGHT + CARD_GAP_Y) - CARD_GAP_Y;
  const width =
    activeYears.length === 0
      ? EDGE_MARGIN * 2
      : EDGE_MARGIN * 2 + activeYears.length * (COLUMN_WIDTH + COLUMN_GAP) - COLUMN_GAP;

  const events: LaidOutEvent[] = [];
  for (const year of activeYears) {
    const x = xForYear.get(year)!;
    byYear.get(year)!.forEach((e, i) => {
      const y = HEADER_HEIGHT + i * (CARD_HEIGHT + CARD_GAP_Y) + CARD_HEIGHT / 2;
      events.push({ ...e, x, y });
    });
  }

  return { events, columns, xForYear, width, height };
}

export const EVENTS_BY_ID: Record<string, TimelineEvent> = Object.fromEntries(
  EVENTS.map((e) => [e.id, e])
);
