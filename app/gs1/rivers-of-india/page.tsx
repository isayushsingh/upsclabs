import RiversOfIndiaMap from "@/components/rivers-of-india/RiversOfIndiaMap";
import DesktopRecommendedModal from "@/components/site/DesktopRecommendedModal";
import ToolHeader from "@/components/site/ToolHeader";

export const metadata = {
  title: "Rivers of India · UPSC Labs",
  description: "Active-recall map of India's major rivers, with a Learn ⇄ Recall toggle.",
};

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
