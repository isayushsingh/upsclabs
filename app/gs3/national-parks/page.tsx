import NationalParksMap from "@/components/national-parks/NationalParksMap";
import DesktopRecommendedModal from "@/components/site/DesktopRecommendedModal";
import ToolHeader from "@/components/site/ToolHeader";

export const metadata = {
  title: "",
  description: "",
};

export default function Page() {
  return (
    <>
      <DesktopRecommendedModal toolName="This national parks & tiger reserves map" />
      <ToolHeader
        crumbs={[
          { label: "UPSC Labs", href: "/" },
          { label: "GS3", href: "/gs3" },
          { label: "Protected Areas • Wetlands • BR • Mapping" },
        ]}
        title="Protected Areas • Wetlands • Mapping"
        // subtitle="select state"
        breadcrumbClassName="np-breadcrumb"
      />
      <NationalParksMap />
    </>
  );
}
