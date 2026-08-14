import ToolHeader from "@/components/site/ToolHeader";
import ToolPromoBanner from "@/components/site/ToolPromoBanner";
import ToolSummary from "@/components/site/ToolSummary";
import { pageMetadata } from "@/lib/seo";
import { TOOLS } from "@/lib/tools";
import { DYNASTIES, fmtRange } from "@/lib/timeline/dynasties";

const TITLE = "Ancient India Dynasties — Full List";
const DESCRIPTION =
  "Every dynasty and era of ancient India, with date ranges and notable rulers in succession — the reference list behind UPSC Labs' interactive dynastic timeline.";
const PATH = "/gs1/ancient-india-timeline/full-list";
const TOOL = TOOLS.find((t) => t.href === "/gs1/ancient-india-timeline")!;

export const metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: PATH });

export default function Page() {
  return (
    <>
      <ToolHeader
        crumbs={[
          { label: "UPSC Labs", href: "/" },
          { label: "GS1", href: "/gs1" },
          { label: "Ancient India Timeline", href: "/gs1/ancient-india-timeline" },
          { label: "Full List" },
        ]}
        title="Dynasties of ancient India — full list"
        subtitle="Plain-text reference: the dynasties, date ranges and rulers behind the interactive dynastic timeline."
      />
      <ToolPromoBanner tool={TOOL} />
      <ToolSummary
        title="Dynasties &amp; eras"
        intro="Ranges are conventional NCERT/UPSC dates; rulers are listed where the succession is well-established."
      >
        <table>
          <thead>
            <tr>
              <th>Dynasty / era</th>
              <th>Period</th>
              <th>Notable rulers</th>
            </tr>
          </thead>
          <tbody>
            {DYNASTIES.map((d) => (
              <tr key={d.id}>
                <td>{d.name}</td>
                <td>{fmtRange(d.start, d.end)}</td>
                <td>
                  {d.kings && d.kings.length > 0
                    ? d.kings.map((k) => `${k.name} (${fmtRange(k.start, k.end)})`).join(", ")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ToolSummary>
    </>
  );
}
