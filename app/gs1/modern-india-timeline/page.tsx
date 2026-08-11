import ModernIndiaTimeline from "@/components/modern-india-timeline/ModernIndiaTimeline";
import DesktopRecommendedModal from "@/components/site/DesktopRecommendedModal";
import ToolHeader from "@/components/site/ToolHeader";

export const metadata = {
  title: "Modern India Timeline · UPSC Labs",
  description:
    "Six parallel strands of the freedom struggle (1857–1947) on one zoomable timeline, with curated cause → effect links across strands.",
};

export default function Page() {
  return (
    <>
      <DesktopRecommendedModal toolName="This modern India timeline" />
      <ToolHeader
        crumbs={[
          { label: "UPSC Labs", href: "/" },
          { label: "GS1", href: "/gs1" },
          { label: "Modern India Timeline" },
        ]}
        title="Six strands, one struggle"
        subtitle="Zoom from era to event. Filter a strand. Trace what caused what."
      />
      <ModernIndiaTimeline />
    </>
  );
}
