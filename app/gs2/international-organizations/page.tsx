import OrgWorldMap from "@/components/orgs/OrgWorldMap";
import ToolHeader from "@/components/site/ToolHeader";
import JsonLd from "@/components/site/JsonLd";
import { pageMetadata, toolJsonLd } from "@/lib/seo";

const TITLE = "International Organizations Map";
const DESCRIPTION =
  "Pick an organization — G7, G20, OECD, GCC, BIMSTEC and 14 more — and watch its member countries light up on the world map, with a Learn ⇄ Recall toggle.";
const PATH = "/gs2/international-organizations";

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
  image: "/images/carousel/world-map.jpg",
});

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd({ name: TITLE, description: DESCRIPTION, path: PATH })} />
      <ToolHeader
        crumbs={[
          { label: "UPSC Labs", href: "/" },
          { label: "GS2", href: "/gs2" },
          { label: "International Organizations" },
        ]}
        title="International Organizations"
        subtitle="Pick an organization to see its members on the map"
      />
      <OrgWorldMap />
    </>
  );
}
