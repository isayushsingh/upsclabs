import ModernIndiaTimeline from "@/components/modern-india-timeline/ModernIndiaTimeline";
import DesktopRecommendedModal from "@/components/site/DesktopRecommendedModal";
import ToolHeader from "@/components/site/ToolHeader";

export const metadata = {
  title: "Modern India Timeline · UPSC Labs",
  description:
    "230 milestones of the freedom struggle (1857–1947) on one zoomable, colour-coded timeline, with curated cause → effect links between them.",
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
        title="One struggle, every thread"
        subtitle="Zoom from era to event. Colour marks the thread. Trace what caused what."
      />
      <ModernIndiaTimeline />
    </>
  );
}
