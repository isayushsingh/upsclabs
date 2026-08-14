import WorldMap from "@/components/world-map/WorldMap";
import DesktopRecommendedModal from "@/components/site/DesktopRecommendedModal";
import ToolHeader from "@/components/site/ToolHeader";
import WipMarquee from "@/components/site/WipMarquee";
import ToolReferenceLink from "@/components/site/ToolReferenceLink";
import JsonLd from "@/components/site/JsonLd";
import { pageMetadata, toolJsonLd } from "@/lib/seo";

const TITLE = "World Map: Political & Physical Geography";
const DESCRIPTION =
  "Active-recall map of the world, continent by continent — capitals, cities, rivers, lakes, mountains, volcanoes and physical features, with a Learn ⇄ Recall toggle.";
const PATH = "/gs1/world-map";

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
  image: "/images/carousel/world-map.jpg",
  // South America is the only continent wired up so far — keep this out of
  // search results until more continents are live, same as rivers-of-india
  // while it's "building" in lib/tools.ts.
  noindex: true,
});

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd({ name: TITLE, description: DESCRIPTION, path: PATH })} />
      <DesktopRecommendedModal toolName="This world map" />
      <ToolHeader
        crumbs={[
          { label: "UPSC Labs", href: "/" },
          { label: "GS1", href: "/gs1" },
          { label: "World Map • Political • Physical" },
        ]}
        title="Political • Physical • Mapping"
        subtitle="Pick a continent to explore"
      />
      <div className="ul-main">
        <WipMarquee />
      </div>
      <WorldMap />
      <ToolReferenceLink
        href={`${PATH}/full-list`}
        label="See the full list of cities, mountains & lakes"
      />
    </>
  );
}
