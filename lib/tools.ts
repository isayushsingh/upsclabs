// The registry that powers the hub. Every page that lists tools reads from this.
// Adding a tool = append one entry here + create its route folder under app/.

export type Paper = "GS1" | "GS2" | "GS3" | "GS4" | "Essay";

export interface Tool {
  slug: string;
  href: string;
  title: string;
  blurb: string;
  paper: Paper;
  topic: string; // e.g. "History", "Geography"
  status?: "new" | "popular" | "disabled";
  accent: string; // a palette colour, used on the tool card
}

export const TOOLS: Tool[] = [
  {
    slug: "ancient-india-timeline",
    href: "/gs1/ancient-india-timeline",
    title: "Ancient India Dynastic Timeline",
    blurb:
      "Scrub through four millennia and watch dynasties rise and fall on a map of South Asia.",
    paper: "GS1",
    topic: "History",
    status: "new",
    accent: "#3E5C76",
  },
  {
    slug: "active-recall-ramsar-sites",
    href: "/",
    title: "Active Recall Interactive Ramsar Sites Map",
    blurb:
      "Coming Soon",
    paper: "GS3",
    topic: "Environment",
    status: "disabled",
    accent: "#3E5C76",
  },
];

export const PAPERS: { id: Paper; label: string }[] = [
  { id: "GS1", label: "History, Geography & Society" },
  { id: "GS2", label: "Polity & Governance" },
  { id: "GS3", label: "Economy, Environment & Sci-Tech" },
  { id: "GS4", label: "Ethics" },
  { id: "Essay", label: "Essay" },
];
