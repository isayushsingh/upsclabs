import Link from "next/link";
import NationalParksMap from "@/components/national-parks/NationalParksMap";
import DesktopRecommendedModal from "@/components/site/DesktopRecommendedModal";

export const metadata = {
  title: "",
  description: "",
};

export default function Page() {
  return (
    <>
      <DesktopRecommendedModal toolName="This national parks & tiger reserves map" />
      <nav className="ul-breadcrumb np-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">UPSC Labs</Link>
        <span>/</span>
        <Link href="/gs1">GS3</Link>
        <span>/</span>
        <span className="ul-breadcrumb-cur">Protected Areas • Wetlands • BR • Mapping</span>
      </nav>
      <NationalParksMap />
    </>
  );
}
