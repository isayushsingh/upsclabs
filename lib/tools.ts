// The registry that powers the hub: coverage board, featured section, section pages.
// Adding a tool = append one entry. Set state:"live" + href once it ships.

export type Paper = "GS1" | "GS2" | "GS3" | "GS4";
export type ToolState = "live" | "building" | "planned";
export type PreviewKind =
  | "timeline"
  | "map"
  | "cards"
  | "quiz"
  | "chart"
  | "doc"
  | "scale";

export interface Tool {
  slug: string;
  /** short title for compact tiles */
  title: string;
  /** full title for featured / hero contexts */
  fullTitle?: string;
  blurb: string;
  paper: Paper;
  topic: string;
  state: ToolState;
  /** only present once the tool is live */
  href?: string;
  featured?: boolean;
  accent: string;
  preview: PreviewKind;
  /** One emoji (or short symbol) shown in the card's icon badge on section
      pages (ToolCard.tsx) — swap freely, it's just a glyph, not an asset. */
  icon: string;
}

export const PAPERS: { id: Paper; topics: string }[] = [
  { id: "GS1", topics: "History · Geography" },
  { id: "GS2", topics: "Polity · International Relations" },
  { id: "GS3", topics: "Environment" },
  { id: "GS4", topics: "Ethics · Integrity. Coming Soon." },
];

export const TOOLS: Tool[] = [
  {
    slug: "ancient-india-timeline",
    title: "Ancient India Timeline",
    fullTitle: "Ancient India Dynastic Timeline",
    blurb:
      "Scrub four millennia and watch dynasties rise, overlap, and fall on a map of South Asia.",
    paper: "GS1",
    topic: "History",
    state: "live",
    href: "/gs1/ancient-india-timeline",
    featured: true,
    accent: "#3E5C76",
    preview: "timeline",
    icon: "🏛️",
  },
  {
    slug: "ancient-sites-map",
    title: "Ancient India Mapping",
    fullTitle: "Ancient India Mapping",
    blurb:
      "Harappan cities, Chalcolithic settlements, Megalithic sites and ancient ports — plotted on a map of India, layer by layer.",
    paper: "GS1",
    topic: "History",
    state: "live",
    href: "/gs1/ancient-sites-map",
    // Not featured yet — lib/ancient-sites/sites.json is still an empty
    // skeleton (see that file's own header comment), so this shouldn't be
    // pushed on the homepage carousel until it actually has sites on it.
    featured: false,
    accent: "#B5732E",
    preview: "map",
    icon: "🏺",
  },
  {
    slug: "modern-india-timeline",
    title: "Modern India Timeline",
    fullTitle: "Modern India Timeline (1857–1947)",
    blurb:
      "230 milestones of the freedom struggle on a year-by-year timeline — trace curated cause → effect links between them, then revise with active recall.",
    paper: "GS1",
    topic: "History",
    state: "live",
    href: "/gs1/modern-india-timeline",
    featured: true,
    accent: "#23268C",
    preview: "timeline",
    icon: "🕊️",
  },
  {
    slug: "governors-general",
    title: "Governors-General & Viceroys",
    fullTitle: "Governors-General & Viceroys of India (1773–1947)",
    blurb:
      "Every Governor-General and Viceroy from Warren Hastings to Mountbatten on one timeline. Each tenure's events sit in the same eight slots, and a search tells you who did what.",
    paper: "GS1",
    topic: "History",
    state: "live",
    href: "/gs1/governors-general",
    featured: true,
    accent: "#0F6E56",
    preview: "timeline",
    icon: "🏃",
  },
  {
    slug: "national-parks",
    title: "Protected Areas & Wetlands Mapping",
    fullTitle: "Interactive Map: Protected Areas & Wetlands",
    blurb:
        "Active-recall map of India's national parks & tiger reserves, with wetland, river and terrain layers and a Learn ⇄ Recall toggle.",
    paper: "GS3",
    topic: "Environment",
    state: "live",
    href: "/gs3/national-parks",
    featured: true,
    accent: "#3E5C76",
    preview: "map",
    icon: "🐯",
  },
  {
    slug: "rivers-of-india",
    title: "Interactive Map: Rivers of India",
    fullTitle: "Interactive Map: Rivers of India",
    blurb:
      "Active-recall map of India's major rivers — trace each course, then switch to Recall and name it from memory.",
    paper: "GS1",
    topic: "Geography",
    state: "building",
    accent: "#3E5C76",
    preview: "map",
    icon: "🌊",
  },
  {
    slug: "world-map",
    title: "Interactive World Mapping",
    fullTitle: "Interactive World Map: Political & Physical Geography",
    blurb:
      "Active-recall map of the world, continent by continent — capitals, cities, rivers, lakes, mountains, volcanoes and physical features, with a Learn ⇄ Recall toggle. Still work in progress — country borders are placeholders for now.",
    paper: "GS1",
    topic: "Geography",
    state: "live",
    href: "/gs1/world-map",
    featured: true,
    accent: "#3E5C76",
    preview: "map",
    icon: "🗺️",
  },
  {
    slug: "international-organizations",
    title: "International Orgs. Mapping",
    fullTitle: "Interactive Map: International Organizations & Their Members",
    blurb:
      "Pick an organization — G7, G20, OECD, GCC, BIMSTEC and 14 more — and watch its member countries light up on the world map, with a Learn ⇄ Recall toggle.",
    paper: "GS2",
    topic: "International Relations",
    state: "live",
    href: "/gs2/international-organizations",
    featured: true,
    accent: "#2255A0",
    preview: "map",
    icon: "🌐",
  },
];

export const toolsByPaper = (p: Paper): Tool[] => TOOLS.filter((t) => t.paper === p);

export const featuredTools = (): Tool[] => TOOLS.filter((t) => t.featured && t.state === "live");

export const coverageCounts = () => {
  const live = TOOLS.filter((t) => t.state === "live").length;
  const building = TOOLS.filter((t) => t.state === "building").length;
  const planned = TOOLS.filter((t) => t.state === "planned").length;
  return { live, building, planned, total: TOOLS.length };
};
