import Link from "next/link";
import RiversOfIndiaMap from "@/components/rivers-of-india/RiversOfIndiaMap";
import DesktopRecommendedModal from "@/components/site/DesktopRecommendedModal";

export const metadata = {
  title: "Rivers of India · UPSC Labs",
  description: "Active-recall map of India's major rivers, with a Learn ⇄ Recall toggle.",
};

export default function Page() {
  return (
    <>
      <DesktopRecommendedModal toolName="This rivers of India map" />
      <nav className="ul-breadcrumb" aria-label="Breadcrumb">
        <span className="ul-breadcrumb-pill">
          <Link href="/">UPSC Labs</Link>
          <span>/</span>
          <Link href="/gs1">GS1</Link>
          <span>/</span>
          <span className="ul-breadcrumb-cur">Rivers of India</span>
        </span>
      </nav>
      <RiversOfIndiaMap />
    </>
  );
}
