// lib/ancient-sites/types.ts
// Domain types for the Ancient Sites tool (GS1 · Ancient History): a single
// all-India map — deliberately no per-state drill-down like the National
// Parks tool. There just aren't enough sites per state to make zooming into
// one useful; the whole point is seeing how few dozen sites relate to each
// other and to the rivers they sit on, at a glance, across the whole map.
//
// Toggleable category layers cover what UPSC actually asks about:
// Harappan/Indus Valley sites, Chalcolithic cultures, Megalithic sites, the
// important ancient towns/ports that don't fit neatly into either (e.g.
// early historic ports like Muziris, Arikamedu), and the 16 Mahajanapadas
// (c. 600–500 BCE) — each plotted at its capital city, since this map only
// renders point markers, not the shaded territory regions a Mahajanapadas
// map conventionally shows (that'd need a polygon layer, like the Ancient
// India Timeline tool's dynasty shapes — a bigger addition, not done here).

export type SiteCategory =
  | "palaeolithic"
  | "mesolithic"
  | "neolithic"
  | "harappan-early"
  | "harappan"
  | "harappan-late"
  | "chalcolithic"
  | "megalithic"
  | "port"
  | "mahajanapada"
  | "edict-rock"
  | "edict-pillar"
  | "kingdom"
  | "world-heritage"
  | "cave"
  | "jain"
  | "buddhist"
  | "temple";

/** Rock and Pillar Edicts are split into their own categories/pills — and
    within EACH of those, Major vs Minor is itself a recurring, specific
    exam distinction (not just "this is an edict somewhere"), so both
    categories vary marker shape AND colour per site by EdictType rather
    than every site in the category sharing one look. See
    EDICT_TYPE_META. */
export type EdictType = "major-rock" | "minor-rock" | "major-pillar" | "minor-pillar";

export interface Site {
  id: string;
  name: string;
  category: SiteCategory;
  /** Only meaningful (and required in practice) for categories "edict-rock"
      and "edict-pillar". */
  edictType?: EdictType;
  /** Only meaningful for category "kingdom" — which post-Mauryan dynasty
      this town belonged to (KUSHANAS, GUPTAS, SATAVAHANAS, ...), shown as
      a sub-tag on the card so the town reads as "belonging to" the
      kingdom, not just co-located with it. */
  kingdom?: string;
  lon: number;
  lat: number;
  /** Modern state — shown in the card; not used for map navigation. */
  state?: string;
  /** Associated river, when there is one — a recurring exam angle
      ("X is located on the bank of which river?"). */
  river?: string;
  /** Free text, not a parsed range — e.g. "c. 2600–1900 BCE". Precision and
      certainty vary a lot across periods/sources, so this stays a string
      rather than forcing every site into signed start/end years. */
  period?: string;
  /** Notable finds/features (Great Bath, dockyard, granary, megalithic
      burials, a specific artefact...) — short phrases, rendered as tags. */
  features?: string[];
  /** One-line UPSC-relevant significance/why-it-matters note. */
  note: string;
}

export interface EdictTypeMeta {
  label: string;
  shape: "circle" | "square";
  /** Marker fill for this specific sub-type — overrides the category's own
      default colour, since Major/Minor need to be visually distinct within
      the same pill, not just labelled differently in the card. */
  color: string;
}

// Circle = Major, square = Minor, consistently across both edict
// categories — one shape rule to remember instead of two. Colour-wise,
// Rock Edicts stay in the red family (matching this tool's original single
// "edict" colour) and Pillar Edicts get their own amber family, so the two
// categories read as related but distinct even before you check the shape.
export const EDICT_TYPE_META: Record<EdictType, EdictTypeMeta> = {
  "major-rock": { label: "Major Rock Edict", shape: "circle", color: "#B23A2E" },
  "minor-rock": { label: "Minor Rock Edict", shape: "square", color: "#6E2A22" },
  "major-pillar": { label: "Major Pillar Edict", shape: "circle", color: "#C9932E" },
  "minor-pillar": { label: "Minor Pillar Edict", shape: "square", color: "#8A6A2E" },
};

export interface CategoryMeta {
  /** Full label for the sidebar layer chip / card tag. */
  label: string;
  /** Short label for compact contexts (search results). */
  short: string;
  /** Marker fill + chip accent colour. */
  color: string;
}

export const CATEGORY_META: Record<SiteCategory, CategoryMeta> = {
  palaeolithic: { label: "Palaeolithic Sites", short: "Palaeolithic", color: "#4A5568" },
  mesolithic: { label: "Mesolithic Sites", short: "Mesolithic", color: "#7A5C74" },
  neolithic: { label: "Neolithic Sites", short: "Neolithic", color: "#5C8374" },
  // Three shades of the same terracotta hue — one Harappan "family",
  // bifurcated by phase rather than three unrelated colours, since that's
  // literally the same civilisation at three points in its life.
  "harappan-early": { label: "Early Harappan Sites", short: "Early Harappan", color: "#C98A4B" },
  harappan: { label: "Mature Harappan Sites", short: "Harappan", color: "#B5732E" },
  "harappan-late": { label: "Late Harappan Sites", short: "Late Harappan", color: "#8A4E24" },
  chalcolithic: { label: "Chalcolithic Sites", short: "Chalcolithic", color: "#8C6A4F" },
  megalithic: { label: "Megalithic Sites", short: "Megalithic", color: "#6E6B63" },
  port: { label: "Important Ports", short: "Port / Town", color: "#2A6F8E" },
  // Same fill as the "Mahajanapadas" era in lib/timeline/dynasties.ts (the
  // Ancient India Timeline tool) — one colour per historical entity across
  // both tools, not a coincidence.
  mahajanapada: { label: "Mahajanapadas", short: "Mahajanapada", color: "#8C8F86" },
  // Category-level colours here are just the pill swatch/fallback — actual
  // markers use EDICT_TYPE_META's per-Major/Minor colour instead (see
  // AncientSitesMap.tsx's marker rendering).
  "edict-rock": { label: "Rock Edicts of Ashoka", short: "Rock Edict", color: "#8A3226" },
  "edict-pillar": { label: "Pillar Edicts of Ashoka", short: "Pillar Edict", color: "#A67C2E" },
  "world-heritage": { label: "World Heritage Sites", short: "World Heritage", color: "#B8860B" },
  cave: { label: "Ancient Cave Sites", short: "Cave", color: "#5A3E36" },
  jain: { label: "Ancient Jain Sites", short: "Jain", color: "#5B4E8C" },
  buddhist: { label: "Ancient Buddhist Sites", short: "Buddhist", color: "#9C8A3D" },
  temple: { label: "Ancient Temple Sites", short: "Temple", color: "#8C3B5A" },
  kingdom: { label: "Important Kingdoms & Towns", short: "Kingdom town", color: "#4A7C59" },
};

export const CATEGORY_ORDER: SiteCategory[] = [
  "palaeolithic",
  "mesolithic",
  "neolithic",
  "harappan-early",
  "harappan",
  "harappan-late",
  "chalcolithic",
  "megalithic",
  "port",
  "mahajanapada",
  "edict-rock",
  "edict-pillar",
  "kingdom",
  "world-heritage",
  "cave",
  "jain",
  "buddhist",
  "temple",
];

/** Region label for a post-Mauryan kingdom (KUSHANAS, GUPTAS, ...) — not a
    Site: no card, no click, just a rendered uppercase/boxed text label
    marking roughly where that kingdom sat, so its towns visually read as
    "belonging to" it rather than merely co-located with an identical-
    looking dot. Positions are approximate centroids, same "representational,
    not to scale" spirit as the reference maps these tools are built from. */
export interface KingdomLabel {
  name: string;
  lon: number;
  lat: number;
}

export const KINGDOM_LABELS: KingdomLabel[] = [
  { name: "KUSHANAS", lon: 72.5, lat: 33.3 },
  { name: "SHAKAS", lon: 69.2, lat: 23.4 },
  { name: "VAKATAKAS", lon: 78.6, lat: 21.4 },
  { name: "GUPTAS", lon: 81.0, lat: 26.6 },
  { name: "SATAVAHANAS", lon: 76.3, lat: 19.0 },
  { name: "CHOLAS", lon: 79.4, lat: 11.7 },
  { name: "CHERAS", lon: 76.6, lat: 10.4 },
  { name: "PANDYAS", lon: 78.3, lat: 9.6 },
];
