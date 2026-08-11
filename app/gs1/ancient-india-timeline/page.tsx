import AncientIndiaTimeline from "@/components/ancient-india-timeline/AncientIndiaTimeline";
import DesktopRecommendedModal from "@/components/site/DesktopRecommendedModal";
import ToolHeader from "@/components/site/ToolHeader";

export const metadata = {
  title: "Ancient India Dynastic Timeline · UPSC Labs",
  description: "Scrub through ancient Indian dynasties on a map of South Asia.",
};

export default function Page() {
  return (
    <>
      <DesktopRecommendedModal toolName="This ancient India dynastic timeline" />
      <ToolHeader
        crumbs={[
          { label: "UPSC Labs", href: "/" },
          { label: "GS1", href: "/gs1" },
          { label: "Ancient India Timeline" },
        ]}
        title="Who ruled, and where"
        subtitle="Step kingdom by kingdom with the arrows, or drag the rule."
      />
      <AncientIndiaTimeline />
    </>
  );
}
