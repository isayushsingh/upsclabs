import Link from "next/link";
import NationalParksMap from "@/components/national-parks/NationalParksMap";

export const metadata = {
  title: "",
  description: "",
};

export default function Page() {
  return (
    <>
      <nav className="ul-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">UPSC Labs</Link>
        <span>/</span>
        <Link href="/gs1">GS3</Link>
        <span>/</span>
        <span className="ul-breadcrumb-cur">National Parks, Tiger Reserves Interactive Map</span>
      </nav>
      <NationalParksMap />
    </>
  );
}
