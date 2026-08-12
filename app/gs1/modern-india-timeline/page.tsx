import ModernIndiaTimeline from "@/components/modern-india-timeline/ModernIndiaTimeline";
import DesktopRecommendedModal from "@/components/site/DesktopRecommendedModal";
import ToolHeader from "@/components/site/ToolHeader";
import JsonLd from "@/components/site/JsonLd";
import { pageMetadata, toolJsonLd } from "@/lib/seo";

const TITLE = "Modern India Timeline (1857–1947)";
const DESCRIPTION =
  "230 milestones of India's freedom struggle (1857–1947) on a year-by-year timeline, with curated cause → effect links between them, plus a Revise mode to test yourself with active recall — for UPSC GS1 Modern History.";
const PATH = "/gs1/modern-india-timeline";

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
  image: "/images/carousel/modern-india-timeline.jpg",
});

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd({ name: TITLE, description: DESCRIPTION, path: PATH })} />
      <DesktopRecommendedModal toolName="This modern India timeline" />
      <ToolHeader
        crumbs={[
          { label: "UPSC Labs", href: "/" },
          { label: "GS1", href: "/gs1" },
          { label: "Modern India Timeline" },
        ]}
        title="One struggle, every thread"
        subtitle="Scroll year by year. Trace what caused what — then revise with active recall."
      />
      <ModernIndiaTimeline />
    </>
  );
}
