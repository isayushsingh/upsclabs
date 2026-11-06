// Modern India (1857–1947) timeline data + ladder grouping.
// The event list itself (lib/timeline/modernIndia.json) is enriched with
// three things a plain chronology doesn't give you:
//   - `strand`   — which parallel thread of the freedom struggle this belongs to
//     (rendered as a chip's tint — see ModernIndiaTimeline.tsx)
//   - `causedBy` / `leadsTo` — curated causal edges across strands (a seed set
//     of the highest-confidence, most-taught chains — not exhaustive)
//   - `tier`     — "core" (the load-bearing, grand-narrative milestones) vs
//     "context" (real, sourced, but second-tier: individual newspaper
//     launches, codification housekeeping, minor reform societies). Hand-
//     picked against the standard UPSC GS1 narrative, then any "context"
//     event that's causally linked to a "core" one was auto-promoted so a
//     causal chain never silently breaks when context events are hidden.
//
// Layout: a vertical "anchor ladder" — one rung per year that has a visible
// event, read top to bottom. Each rung splits across a central spine: the
// British state's move on the left, the Indian response on the right (see
// sideOf). Years with nothing visible are folded into a single quiet row
// rather than given an empty rung each.

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

// Legend order: state action first, then the widening circle of organised/
// mass/underground/associational response — "cause" before "response".
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
// syllabus's own phase names, used as the ladder's sections and as the
// unit a Revise round covers.
export const ERAS: Era[] = [
  { id: "foundations", name: "Crown Rule & Early Associations", short: "1857–85", start: 1857, end: 1885 },
  { id: "moderate", name: "The Moderate Congress Era", short: "1885–1905", start: 1885, end: 1905 },
  { id: "swadeshi", name: "Swadeshi, Split & Revolutionary Ferment", short: "1905–19", start: 1905, end: 1919 },
  { id: "gandhian", name: "Gandhian Mass Movements", short: "1919–35", start: 1919, end: 1935 },
  { id: "endgame", name: "Provincial Autonomy to Partition", short: "1935–47", start: 1935, end: 1948 },
];

export const T_MIN = 1857;
export const T_MAX = 1947;

export type Side = "british" | "indian";

// Strand says what an event is *about*; side says who acted. They mostly
// agree — the administrative/imperial strand is the Crown's moves, every
// other strand is the Indian side — but not always: the admin strand also
// files Indian actions that answer it (Swadeshi, 'Simon Go Back', the
// Nehru Report…), and the thematic strands file British acts on their
// subject (the Factory Acts, education commissions, the Press Act, the
// conspiracy trials). Those are moved across the spine here rather than
// re-stranded in the JSON.
const SIDE_OVERRIDES: Record<string, Side> = {
  e16: "indian", // First Indian to Qualify ICS
  e24: "indian", // Birth of Mahatma Gandhi
  e67: "indian", // Constitution of India Bill (Tilak)
  e76: "indian", // Anti-Partition Campaign Begins
  e83: "indian", // Swadeshi & Boycott Movement
  e116: "indian", // Gandhi Prepares to Leave South Africa
  e155: "indian", // Assassination of Swami Shraddhanand
  e160: "indian", // 'Simon Go Back' Protests
  e161: "indian", // Nehru Report
  e192: "indian", // Provincial Elections; Congress Wins
  e197: "indian", // Congress Ministries Resign
  e211: "indian", // C.R. Formula
  e212: "indian", // Desai-Liaqat Pact Proposals
  e229: "indian", // Indian Independence

  e45: "british", // First Indian Factory Act, 1881
  e49: "british", // Hunter Education Commission
  e63: "british", // Second Factory Act, 1891
  e74: "british", // Universities Commission
  e77: "british", // Indian Universities Act, 1904
  e94: "british", // Alipore Conspiracy Case
  e97: "british", // Incitement & Explosives Acts, 1908
  e105: "british", // Indian Press Act, 1910
  e113: "british", // Education Policy Resolution, 1913
  e126: "british", // Sadler University Commission
  e144: "british", // Gandhi's 'Great Trial' of 1922
  e147: "british", // Kanpur Bolshevik Conspiracy Case
  e153: "british", // Indian Trade Union Act, 1926
  e166: "british", // Meerut Conspiracy Case
  e169: "british", // Hartog Committee Report
  e175: "british", // Sarda Act (Child Marriage Restraint)
  e178: "british", // Bhagat Singh, Rajguru & Sukhdev Hanged
  e204: "british", // Cripps Mission
  e215: "british", // INA Trials Begin (Red Fort)
};

export function sideOf(e: TimelineEvent): Side {
  return SIDE_OVERRIDES[e.id] ?? (e.strand === "administrative-imperial-policy" ? "british" : "indian");
}

/** The watershed milestones the rest of the narrative hangs off — drawn as
    solid "anchor" rungs on the ladder. Hand-picked, not derived: causal
    link counts favour well-linked minor events over the turning points. */
export const ANCHOR_IDS = new Set([
  "e1", // Revolt of 1857
  "e4", // GoI Act, 1858
  "e55", // Indian National Congress Founded
  "e82", // Partition of Bengal
  "e132", // Jallianwala Bagh Massacre
  "e135", // Non-Cooperation & Khilafat Movements
  "e165", // Lahore Session: 'Purna Swaraj' Adopted
  "e172", // Salt Satyagraha (Dandi March)
  "e188", // Government of India Act, 1935
  "e205", // 'Quit India' Resolution
  "e226", // Indian Independence Act, 1947
]);

export interface Rung {
  year: number;
  british: TimelineEvent[];
  indian: TimelineEvent[];
  /** years with no visible event immediately before this rung, if any */
  foldedBefore?: { from: number; to: number };
}

export interface EraSection {
  era: Era;
  rungs: Rung[];
  count: number;
}

/** Group visible events into era sections of year rungs, in data order
    within a year. An era with no visible event is dropped. */
export function buildLadder(sourceEvents: TimelineEvent[] = EVENTS): EraSection[] {
  const byYear = new Map<number, TimelineEvent[]>();
  for (const e of sourceEvents) {
    const arr = byYear.get(e.year) ?? [];
    arr.push(e);
    byYear.set(e.year, arr);
  }
  const years = [...byYear.keys()].sort((a, b) => a - b);

  let prev: number | null = null;
  const rungs: Rung[] = years.map((year) => {
    const evs = byYear.get(year)!;
    const rung: Rung = {
      year,
      british: evs.filter((e) => sideOf(e) === "british"),
      indian: evs.filter((e) => sideOf(e) === "indian"),
    };
    // A single skipped year isn't worth a row of its own; two or more is
    // a quiet stretch worth naming.
    if (prev != null && year - prev > 2) rung.foldedBefore = { from: prev + 1, to: year - 1 };
    prev = year;
    return rung;
  });

  return ERAS.map((era) => {
    const eraRungs = rungs.filter((r) => r.year >= era.start && r.year < era.end);
    const count = eraRungs.reduce((n, r) => n + r.british.length + r.indian.length, 0);
    return { era, rungs: eraRungs, count };
  }).filter((s) => s.rungs.length > 0);
}

export function eraOfYear(year: number): Era {
  return ERAS.find((e) => year >= e.start && year < e.end) ?? ERAS[ERAS.length - 1];
}

export const EVENTS_BY_ID: Record<string, TimelineEvent> = Object.fromEntries(
  EVENTS.map((e) => [e.id, e])
);
