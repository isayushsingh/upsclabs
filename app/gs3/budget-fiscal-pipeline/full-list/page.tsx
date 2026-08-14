import ToolHeader from "@/components/site/ToolHeader";
import ToolPromoBanner from "@/components/site/ToolPromoBanner";
import ToolSummary from "@/components/site/ToolSummary";
import { pageMetadata } from "@/lib/seo";
import { TOOLS } from "@/lib/tools";
import { CLASSIFIER_ITEMS } from "@/lib/budget/classifier-data";
import { DEFICITS } from "@/lib/budget/deficit-data";

const TITLE = "Union Budget Concepts — Revenue/Capital & Deficits, Full List";
const DESCRIPTION =
  "The Revenue/Capital classification test applied to every major receipt and expenditure item, plus all four deficit definitions — the reference list behind UPSC Labs' interactive budget tool.";
const PATH = "/gs3/budget-fiscal-pipeline/full-list";
const TOOL = TOOLS.find((t) => t.href === "/gs3/budget-fiscal-pipeline")!;

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
  // Mirrors the parent tool page's noindex — see its own metadata comment.
  noindex: true,
});

export default function Page() {
  return (
    <>
      <ToolHeader
        crumbs={[
          { label: "UPSC Labs", href: "/" },
          { label: "GS3", href: "/gs3" },
          { label: "Concepts Of Budget", href: "/gs3/budget-fiscal-pipeline" },
          { label: "Full List" },
        ]}
        title="Budget concepts — full list"
        subtitle="Plain-text reference behind the interactive budget pipeline."
      />
      <ToolPromoBanner tool={TOOL} />
      <ToolSummary title="Receipts &amp; expenditure: Revenue or Capital?">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Receipt / expenditure</th>
              <th>Revenue / Capital</th>
              <th>Why</th>
            </tr>
          </thead>
          <tbody>
            {CLASSIFIER_ITEMS.map((item) => (
              <tr key={item.id}>
                <td>{item.label}</td>
                <td>{item.kind === "receipt" ? "Receipt" : "Expenditure"}</td>
                <td>{item.bucket === "revenue" ? "Revenue" : "Capital"}</td>
                <td>{item.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ToolSummary>
      <ToolSummary title="The four deficit definitions">
        <table>
          <thead>
            <tr>
              <th>Deficit</th>
              <th>Definition</th>
              <th>Formula</th>
            </tr>
          </thead>
          <tbody>
            {DEFICITS.map((d) => (
              <tr key={d.id}>
                <td>{d.title}</td>
                <td>{d.blurb}</td>
                <td>{d.formula}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ToolSummary>
    </>
  );
}
