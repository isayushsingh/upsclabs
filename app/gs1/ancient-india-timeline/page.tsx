import AncientIndiaTimeline from "@/components/ancient-india-timeline/AncientIndiaTimeline";
import DesktopRecommendedModal from "@/components/site/DesktopRecommendedModal";
import ToolHeader from "@/components/site/ToolHeader";
import JsonLd from "@/components/site/JsonLd";
import { pageMetadata, toolJsonLd } from "@/lib/seo";

const TITLE = "Ancient India Dynastic Timeline";
const DESCRIPTION =
  "Scrub through four millennia of ancient Indian dynasties on a map of South Asia — watch kingdoms rise, overlap, and fall, year by year, for UPSC GS1 History.";
const PATH = "/gs1/ancient-india-timeline";

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
  image: "/images/carousel/ancient-india-timeline.jpg",
});

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd({ name: TITLE, description: DESCRIPTION, path: PATH })} />
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
