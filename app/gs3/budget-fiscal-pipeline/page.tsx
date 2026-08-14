import BudgetPipeline from "@/components/budget-pipeline/BudgetPipeline";
import ToolHeader from "@/components/site/ToolHeader";
import WipMarquee from "@/components/site/WipMarquee";
import ToolReferenceLink from "@/components/site/ToolReferenceLink";
import JsonLd from "@/components/site/JsonLd";
import { pageMetadata, toolJsonLd } from "@/lib/seo";

const TITLE = "Concepts Of Budget";
const DESCRIPTION =
  "Learn Revenue vs Capital classification through an animated balance sheet, then explore Fiscal/Revenue/Effective Revenue/Primary deficits on live bars — an interactive Union Budget pipeline for GS3 economy.";
const PATH = "/gs3/budget-fiscal-pipeline";

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
  // Buoyancy vs Elasticity is built but parked (see BudgetPipeline.tsx's
  // "Coming later" section) — keep this out of search results until it's
  // back in, same reasoning as world-map while it's mid-build.
  noindex: true,
  image: "/images/carousel/budget-fiscal-pipeline.jpg",
});

export default function Page() {
  return (
    <>
      <JsonLd data={toolJsonLd({ name: TITLE, description: DESCRIPTION, path: PATH })} />
      <ToolHeader
        crumbs={[
          { label: "UPSC Labs", href: "/" },
          { label: "GS3", href: "/gs3" },
          { label: "Concepts Of Budget" },
        ]}
        title="Concepts Of Budget"
        subtitle="Classify it, then compute it — two ways into the same Union Budget mechanics"
      />
      <div className="ul-main">
        <WipMarquee
          items={[
            "Work in progress",
            "Work in progress",
            "Work in progress",
            "Work in progress"
          ]}
        />
      </div>
      <BudgetPipeline />
      <ToolReferenceLink
        href={`${PATH}/full-list`}
        label="See the full list of classifications & deficit formulas"
      />
    </>
  );
}
