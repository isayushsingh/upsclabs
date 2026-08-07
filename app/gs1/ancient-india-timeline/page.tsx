import Link from "next/link";
import AncientIndiaTimeline from "@/components/ancient-india-timeline/AncientIndiaTimeline";
import DesktopRecommendedModal from "@/components/site/DesktopRecommendedModal";

export const metadata = {
  title: "Ancient India Dynastic Timeline · UPSC Labs",
  description: "Scrub through ancient Indian dynasties on a map of South Asia.",
};

export default function Page() {
  return (
    <>
      <DesktopRecommendedModal toolName="This ancient India dynastic timeline" />
      <nav className="ul-breadcrumb" aria-label="Breadcrumb">
        <span className="ul-breadcrumb-pill">
          <Link href="/">UPSC Labs</Link>
          <span>/</span>
          <Link href="/gs1">GS1</Link>
          <span>/</span>
          <span className="ul-breadcrumb-cur">Ancient India Timeline</span>
        </span>
      </nav>
      <AncientIndiaTimeline />
    </>
  );
}
