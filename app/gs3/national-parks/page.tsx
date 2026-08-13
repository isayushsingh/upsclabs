import NationalParksMap from "@/components/national-parks/NationalParksMap";
import DesktopRecommendedModal from "@/components/site/DesktopRecommendedModal";
import ToolHeader from "@/components/site/ToolHeader";
import JsonLd from "@/components/site/JsonLd";
import { pageMetadata, toolJsonLd } from "@/lib/seo";

const TITLE = "National Parks & Tiger Reserves Map of India";
const DESCRIPTION =
  "Active-recall map of India's national parks, tiger reserves, wetlands and biosphere reserves. Learn state by state, then switch to Recall mode and name them from memory.";
const PATH = "/gs3/national-parks";

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
  image: "/images/carousel/national-parks.jpg",
});

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd({ name: TITLE, description: DESCRIPTION, path: PATH })} />
      <DesktopRecommendedModal toolName="This national parks & tiger reserves map" />
      <ToolHeader
        crumbs={[
          { label: "UPSC Labs", href: "/" },
          { label: "GS3", href: "/gs3" },
          { label: "Protected Areas • Wetlands • BR • Mapping" },
        ]}
        title="Protected Areas • Wetlands • Mapping"
        subtitle="Choose a state to discover its national parks and wetlands"
        breadcrumbClassName="np-breadcrumb"
      />
      <NationalParksMap />
    </>
  );
}
