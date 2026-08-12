import RiversOfIndiaMap from "@/components/rivers-of-india/RiversOfIndiaMap";
import DesktopRecommendedModal from "@/components/site/DesktopRecommendedModal";
import ToolHeader from "@/components/site/ToolHeader";
import { pageMetadata } from "@/lib/seo";

// Still "building" in lib/tools.ts — the tool's own subtitle says the data
// is "provisional and unverified", so this stays out of search results
// (noindex) until it's actually ready, rather than letting Google index and
// judge the finished site by an admittedly-incomplete page.
export const metadata = pageMetadata({
  title: "Rivers of India",
  description: "Active-recall map of India's major rivers, with a Learn ⇄ Recall toggle.",
  path: "/gs1/rivers-of-india",
  image: "/images/carousel/rivers-of-india.jpg",
  noindex: true,
});

export default function Page() {
  return (
    <>
      <DesktopRecommendedModal toolName="This rivers of India map" />
      <ToolHeader
        crumbs={[
          { label: "UPSC Labs", href: "/" },
          { label: "GS1", href: "/gs1" },
          { label: "Rivers of India" },
        ]}
        title="Rivers of India • Mapping"
        subtitle="Pick a river system, then reveal the rivers. Data is provisional and unverified — not for final revision."
      />
      <RiversOfIndiaMap />
    </>
  );
}
