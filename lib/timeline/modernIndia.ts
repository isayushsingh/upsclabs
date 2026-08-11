// Modern India (1857–1947) timeline data + layout math.
// The event list itself (lib/timeline/modernIndia.json) is enriched with
// three things a plain chronology doesn't give you:
//   - `strand`   — which parallel thread of the freedom struggle this belongs to
//   - `causedBy` / `leadsTo` — curated causal edges across strands (a seed set
//     of the highest-confidence, most-taught chains — not exhaustive)
//   - `tier`     — "core" (the load-bearing, grand-narrative milestones) vs
//     "context" (real, sourced, but second-tier: individual newspaper
//     launches, codification housekeeping, minor reform societies). Hand-
//     picked against the standard UPSC GS1 narrative, then any "context"
//     event that's causally linked to a "core" one was auto-promoted so a
//     causal chain never silently breaks when context events are hidden.
// This file turns that data into rows, eras and an era-piecewise x-scale, the
// same "equal width per era, not per year" trick used by the ancient-India
// timeline (see dynasties.ts) so 30 dense years don't get crushed next to 30
// sparse ones.

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

/** Fraction (0–1) across the full timeline for a given year, equal-width-per-era. */
export function yearToFrac(year: number): number {
  const y = Math.min(T_MAX, Math.max(T_MIN, year));
  for (let i = 0; i < ERAS.length; i++) {
    const er = ERAS[i];
    if (y >= er.start && y < er.end) {
      return (i + (y - er.start) / (er.end - er.start)) / ERAS.length;
    }
  }
  return 1;
}

export const ZOOM_LEVELS = ["overview", "labeled"] as const;
export type ZoomLevel = (typeof ZOOM_LEVELS)[number];

/** Scrollable canvas width in px — fixed per zoom level. Because x is always
    the event's true chronological position (see layoutTimeline below), this
    is the *only* thing that determines width; it never grows with density. */
export const CANVAS_WIDTH: Record<ZoomLevel, number> = {
  overview: 2600,
  labeled: 7200,
};

// Every event always renders as its own element — never merged into a
// cluster — because a merged marker has no single correct (x, y) for a
// causal-link arrow to land on, and never collapsed to a bare mark either —
// the "year · title" line is always on, no hover/tap needed to read it. At
// "overview" zoom (zoomed out to see the whole 90-year shape) it's still a
// small dot; at "labeled" zoom it's a narrow single-line card, kept short
// (not the two-line chip an earlier version used) specifically so the
// lane-packing below doesn't need to stack rows very tall to fit it.
// `CARD_WIDTH` is each zoom's *maximum* card width — at "labeled" zoom a
// card is actually sized to its own title (see estimateCardWidth) so short
// titles like "Surat Split" don't carry the same blank padding a long one
// like "Government of India Act, 1858" needs; this constant is what a card
// caps out at, and what edge padding is sized against.
export const CARD_WIDTH: Record<ZoomLevel, number> = {
  overview: 8,
  labeled: 200,
};
/** Floor on a "labeled"-zoom card's width, so even a one-word title ("Kakori
    Train Robbery") still reads as a proper card, not a sliver. */
export const CARD_WIDTH_MIN = 108;

// Rough per-character advances for the two fonts a card renders (Inter for
// the title, monospace for the year) at their actual CSS font-sizes — good
// enough to size a card without a DOM measurement pass, since the title is
// still clamped with text-overflow:ellipsis as a safety net if this
// estimate ever runs a little short.
const TITLE_CHAR_PX = 6.1;
const YEAR_CHAR_PX = 5.6;
const CARD_CHROME_PX = 8 /* left padding + colour bar */ + 7 /* right padding */ + 5; /* year↔title gap */

function estimateCardWidth(title: string): number {
  const raw = CARD_CHROME_PX + 4 * YEAR_CHAR_PX + title.length * TITLE_CHAR_PX;
  return Math.min(CARD_WIDTH.labeled, Math.max(CARD_WIDTH_MIN, Math.round(raw)));
}
export const CARD_HEIGHT: Record<ZoomLevel, number> = {
  overview: 8,
  labeled: 20,
};
export const CARD_GAP = 4;
export const LANE_GAP = 15;
/** Extra margin either side of a card's own half-width, so the first/last
    cards on the timeline don't get their edge clipped by the scroll container. */
export const EDGE_MARGIN = 4;
/** Reserved strip at the very top of the canvas for era-name headers, so a
    label never competes with the card lane directly beneath it for space. */
export const ERA_HEADER_HEIGHT = 28;

export interface LaidOutEvent extends TimelineEvent {
  /** x centre in px — always the true year position, never shifted */
  x: number;
  /** y centre in px */
  y: number;
  /** this card's own render width in px (see estimateCardWidth) */
  width: number;
}

export interface TimelineLayout {
  events: LaidOutEvent[];
  width: number;
  height: number;
}

/**
 * Lay every event out deterministically (no DOM measurement needed), all on
 * one shared timeline — a strand is a *color*, not a row. x is always the
 * event's true era-piecewise year position — it is never shifted, because
 * in a history timeline the x-axis *is* the fact being taught. When two
 * events (from any strand) collide at the card's footprint, the later one
 * drops into the next vertical "lane" — so a dense year grows the timeline
 * taller for that slice, not wider, and every single event keeps its own
 * real position for causal-link arrows to anchor to (nothing is ever merged
 * into a cluster marker). Pooling every strand into one shared set of lanes
 * — rather than each strand keeping its own separate lane stack — is
 * actually *more* space-efficient: a quiet strand's spare lanes get reused
 * by a busy one instead of sitting empty in a row nobody else can borrow.
 */
export function layoutTimeline(
  zoom: ZoomLevel,
  sourceEvents: TimelineEvent[] = EVENTS
): TimelineLayout {
  const contentWidth = CANVAS_WIDTH[zoom];
  const maxCardWidth = CARD_WIDTH[zoom];
  const cardHeight = CARD_HEIGHT[zoom];
  // Cards are centred on their x — without this margin, an event right at
  // the timeline's start/end has half its card hanging off the edge of the
  // scrollable canvas, clipped by its overflow boundary. Sized against the
  // *maximum* possible card width so it's enough no matter which event (long
  // title or short) ends up being first/last.
  const padX = maxCardWidth / 2 + EDGE_MARGIN;

  interface Placed {
    x: number;
    lane: number;
    width: number;
  }

  const placedById = new Map<string, Placed>();
  const sorted = [...sourceEvents].sort((a, b) => a.year - b.year);
  const laneRightEdge: number[] = []; // right edge of the last card placed in each lane
  for (const e of sorted) {
    const width = zoom === "overview" ? maxCardWidth : estimateCardWidth(e.title);
    const x = padX + yearToFrac(e.year) * contentWidth;
    const leftEdge = x - width / 2;
    let lane = laneRightEdge.findIndex((edge) => edge + CARD_GAP <= leftEdge);
    if (lane === -1) lane = laneRightEdge.length;
    laneRightEdge[lane] = x + width / 2;
    placedById.set(e.id, { x, lane, width });
  }
  const laneCount = Math.max(1, laneRightEdge.length);
  const height = ERA_HEADER_HEIGHT + laneCount * (cardHeight + LANE_GAP) - LANE_GAP;

  const events = sourceEvents.map((e) => {
    const placed = placedById.get(e.id)!;
    const y = ERA_HEADER_HEIGHT + placed.lane * (cardHeight + LANE_GAP) + cardHeight / 2;
    return { ...e, x: placed.x, y, width: placed.width };
  });

  return { events, width: contentWidth + padX * 2, height };
}

export const EVENTS_BY_ID: Record<string, TimelineEvent> = Object.fromEntries(
  EVENTS.map((e) => [e.id, e])
);
