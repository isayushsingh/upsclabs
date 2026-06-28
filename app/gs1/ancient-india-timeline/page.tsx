import Link from "next/link";
import AncientIndiaTimeline from "@/components/AncientIndiaTimeline";

export const metadata = {
  title: "Ancient India Dynastic Timeline · UPSC Labs",
  description: "Scrub through ancient Indian dynasties on a map of South Asia.",
};

export default function Page() {
  return (
    <>
      <nav className="ul-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">UPSC Labs</Link>
        <span>/</span>
        <Link href="/gs1">GS1</Link>
        <span>/</span>
        <span className="ul-breadcrumb-cur">Ancient India Timeline</span>
      </nav>
      <AncientIndiaTimeline />
    </>
  );
}
