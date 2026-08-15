import AncientSitesMap from "@/components/ancient-sites/AncientSitesMap";
import DesktopRecommendedModal from "@/components/site/DesktopRecommendedModal";
import ToolHeader from "@/components/site/ToolHeader";
import JsonLd from "@/components/site/JsonLd";
import { pageMetadata, toolJsonLd } from "@/lib/seo";

const TITLE = "Ancient India Mapping";
const DESCRIPTION =
  "Harappan/Indus Valley sites, Chalcolithic settlements, Megalithic sites and important ancient ports & towns, plotted on a map of India with toggleable layers — for UPSC GS1 Ancient History.";
const PATH = "/gs1/ancient-sites-map";

// No sites are loaded yet (lib/ancient-sites/sites.json is an empty
// skeleton) — keep this out of search results until real data is in,
// same reasoning as world-map/budget-fiscal-pipeline while mid-build.
export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
  noindex: true,
});

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd({ name: TITLE, description: DESCRIPTION, path: PATH })} />
      <DesktopRecommendedModal toolName="This ancient india mapping" />
      <ToolHeader
        crumbs={[
          { label: "UPSC Labs", href: "/" },
          { label: "GS1", href: "/gs1" },
          { label: "Ancient India Mapping" },
        ]}
        title="Ancient India Mapping"
        subtitle="Toggle a layer to reveal Harappan, Chalcolithic, Megalithic sites and ancient ports on the map."
      />
      <AncientSitesMap />
    </>
  );
}
