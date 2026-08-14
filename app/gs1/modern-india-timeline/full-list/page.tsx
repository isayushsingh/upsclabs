import ToolHeader from "@/components/site/ToolHeader";
import ToolPromoBanner from "@/components/site/ToolPromoBanner";
import ToolSummary, { ToolSummaryDetails } from "@/components/site/ToolSummary";
import { pageMetadata } from "@/lib/seo";
import { TOOLS } from "@/lib/tools";
import { EVENTS } from "@/lib/timeline/modernIndia";

const TITLE = "Modern India Timeline (1857–1947) — Full List";
const DESCRIPTION =
  "The core milestones of India's freedom struggle, 1857 to 1947, decade by decade — the reference list behind UPSC Labs' interactive Modern India timeline.";
const PATH = "/gs1/modern-india-timeline/full-list";
const TOOL = TOOLS.find((t) => t.href === "/gs1/modern-india-timeline")!;

export const metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: PATH });

const decades = (() => {
  const core = EVENTS.filter((e) => e.tier === "core").sort((a, b) => a.year - b.year);
  const byDecade = new Map<number, typeof core>();
  for (const e of core) {
    const decade = Math.floor(e.year / 10) * 10;
    byDecade.set(decade, [...(byDecade.get(decade) ?? []), e]);
  }
  return [...byDecade.entries()]
    .sort(([a], [b]) => a - b)
    .map(([decade, events]) => ({ label: `${decade}s`, events }));
})();

export default function Page() {
  return (
    <>
      <ToolHeader
        crumbs={[
          { label: "UPSC Labs", href: "/" },
          { label: "GS1", href: "/gs1" },
          { label: "Modern India Timeline", href: "/gs1/modern-india-timeline" },
          { label: "Full List" },
        ]}
        title="Milestones, 1857–1947 — full list"
        subtitle="Plain-text reference: the core milestones of the freedom struggle behind the interactive Modern India timeline."
      />
      <ToolPromoBanner tool={TOOL} />
      <ToolSummary
        title="By decade"
        intro="The core, load-bearing events of the freedom struggle, grouped by decade. Open a decade for the full list with a one-line description of each."
      >
        {decades.map(({ label, events }) => (
          <ToolSummaryDetails key={label} summary={`${label} (${events.length} events)`}>
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Event</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id}>
                    <td>{e.year}</td>
                    <td>{e.title}</td>
                    <td>{e.event}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ToolSummaryDetails>
        ))}
      </ToolSummary>
    </>
  );
}
