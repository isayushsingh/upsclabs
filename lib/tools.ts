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
}

export const PAPERS: { id: Paper; topics: string }[] = [
  { id: "GS1", topics: "History · Geography" },
  { id: "GS2", topics: "Awaiting Presidential Assent. Coming Soon." },
  { id: "GS3", topics: "Caught in the Middle-Income Trap. Coming Soon." },
//   { id: "GS4", topics: "Ethics · Integrity" },
];

export const TOOLS: Tool[] = [
  {
    slug: "ancient-india-timeline",
    title: "Dynastic Timeline",
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
  },
  { slug: "modern-india-cards", title: "Modern India Timeline", blurb: "Active-recall flashcards for the freedom struggle.", paper: "GS1", topic: "History", state: "planned", accent: "#9C5A4A", preview: "cards" },
//   { slug: "world-geography-maps", title: "World Maps", blurb: "Place the world's physical features from memory.", paper: "GS1", topic: "Geography", state: "planned", accent: "#6B8F71", preview: "map" },

//   { slug: "constitution-explorer", title: "Constitution Explorer", blurb: "Navigate the Constitution by part, schedule, and article.", paper: "GS2", topic: "Polity", state: "planned", accent: "#5D6E8C", preview: "doc" },
//   { slug: "polity-quiz", title: "Polity Quiz", blurb: "Rapid-fire recall on articles and amendments.", paper: "GS2", topic: "Polity", state: "planned", accent: "#7A5C7E", preview: "quiz" },
//   { slug: "governance-cases", title: "Governance Cases", blurb: "Schemes and reforms, mapped to outcomes.", paper: "GS2", topic: "Governance", state: "planned", accent: "#8C6A4F", preview: "cards" },

//   { slug: "ramsar-sites-map", title: "Ramsar Sites Map", fullTitle: "Ramsar Wetlands — Active Recall", blurb: "Pin India's wetlands of international importance from memory.", paper: "GS3", topic: "Environment", state: "building", accent: "#3F7C7A", preview: "map" },
//   { slug: "economy-dashboards", title: "Economy Dashboards", blurb: "Core macro indicators, visualized and current.", paper: "GS3", topic: "Economy", state: "planned", accent: "#C08A3E", preview: "chart" },
//   { slug: "sci-tech-cards", title: "Sci-Tech Cards", blurb: "Recall current science & technology developments.", paper: "GS3", topic: "Sci-Tech", state: "planned", accent: "#6E7B8B", preview: "cards" },

//   { slug: "ethics-case-sims", title: "Ethics Case Sims", fullTitle: "Ethics Case Simulations", blurb: "Work through case studies with branching choices.", paper: "GS4", topic: "Ethics", state: "building", accent: "#80614C", preview: "scale" },
//   { slug: "thinkers-cards", title: "Thinkers Cards", blurb: "Match thinkers to their ideas and quotes.", paper: "GS4", topic: "Ethics", state: "planned", accent: "#7A5548", preview: "cards" },
];

export const toolsByPaper = (p: Paper): Tool[] => TOOLS.filter((t) => t.paper === p);

export const featuredTools = (): Tool[] => TOOLS.filter((t) => t.featured && t.state === "live");

export const coverageCounts = () => {
  const live = TOOLS.filter((t) => t.state === "live").length;
  const building = TOOLS.filter((t) => t.state === "building").length;
  const planned = TOOLS.filter((t) => t.state === "planned").length;
  return { live, building, planned, total: TOOLS.length };
};
