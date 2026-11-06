import GovernorsGeneral from "@/components/governors/GovernorsGeneral";
import ToolHeader from "@/components/site/ToolHeader";
import ToolReferenceLink from "@/components/site/ToolReferenceLink";
import JsonLd from "@/components/site/JsonLd";
import { pageMetadata, toolJsonLd } from "@/lib/seo";

const TITLE = "Governors-General & Viceroys of India (1773–1947)";
const DESCRIPTION =
  "Every Governor-General and Viceroy of British India from Warren Hastings to Mountbatten on one proportional timeline — each block as wide as his tenure, each card sorting his events into the same eight slots, with a search to find who did what — for UPSC GS1 Modern History.";
const PATH = "/gs1/governors-general";

export const metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: PATH });

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd({ name: TITLE, description: DESCRIPTION, path: PATH })} />
      <ToolHeader
        crumbs={[
          { label: "UPSC Labs", href: "/" },
          { label: "GS1", href: "/gs1" },
          { label: "Governors-General" },
        ]}
        title="Governors-General & Viceroys"
        subtitle="Who ruled when, and what happened on his watch (1773–1947). Pick a tenure, or search an event to find who it belongs to."
      />
      <GovernorsGeneral />
      <ToolReferenceLink
        href={`${PATH}/full-list`}
        label="See the full list of Governors-General and their events"
      />
    </>
  );
}
