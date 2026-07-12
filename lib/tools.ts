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
  {
    slug: "national-parks",
    title: "National Parks & Tiger Reserves",
    fullTitle: "National Parks & Tiger Reserves",
    blurb:
        "Active-recall map of India's national parks & tiger reserves, with wetland, river and terrain layers and a Learn ⇄ Recall toggle.",
    paper: "GS3",
    topic: "Environment",
    state: "live",
    href: "/gs3/national-parks",
    featured: true,
    accent: "#3E5C76",
    preview: "timeline",
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
