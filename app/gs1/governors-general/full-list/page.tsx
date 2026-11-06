import ToolHeader from "@/components/site/ToolHeader";
import ToolPromoBanner from "@/components/site/ToolPromoBanner";
import ToolSummary, { ToolSummaryDetails } from "@/components/site/ToolSummary";
import { pageMetadata } from "@/lib/seo";
import { TOOLS } from "@/lib/tools";
import { ERAS, GOVERNORS, SLOTS, tenureLabel } from "@/lib/governors/governors";

const TITLE = "Governors-General & Viceroys of India (1773–1947) — Full List";
const DESCRIPTION =
  "Every Governor-General and Viceroy of British India with the wars, acts, reforms, annexations and movements of his tenure — the reference list behind UPSC Labs' interactive Governors-General & Viceroys tool.";
const PATH = "/gs1/governors-general/full-list";
const TOOL = TOOLS.find((t) => t.href === "/gs1/governors-general")!;

export const metadata = pageMetadata({ title: TITLE, description: DESCRIPTION, path: PATH });

export default function Page() {
  return (
    <>
      <ToolHeader
        crumbs={[
          { label: "UPSC Labs", href: "/" },
          { label: "GS1", href: "/gs1" },
          { label: "Governors-General", href: "/gs1/governors-general" },
          { label: "Full List" },
        ]}
        title="Governors-General & Viceroys — full list"
        subtitle="Plain-text reference: every Governor-General and Viceroy of British India and the events of his tenure, behind the interactive Governors-General & Viceroys tool."
      />
      <ToolPromoBanner tool={TOOL} />
      <ToolSummary
        title="By era"
        intro="Grouped into the three offices: Governors-General of Bengal, Governors-General of India, and Viceroys. Open an era for each tenure's events, sorted by category."
      >
        {ERAS.map((era) => {
          const members = GOVERNORS.filter((g) => g.era === era.id && g.events.length > 0);
          return (
            <ToolSummaryDetails key={era.id} summary={`${era.name}, ${era.range} (${members.length})`}>
              <table>
                <thead>
                  <tr>
                    <th>Governor-General</th>
                    <th>Tenure</th>
                    <th>Events</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((g) => (
                    <tr key={g.id}>
                      <td>
                        {g.name}
                        {g.hook ? <><br /><em>{g.hook}</em></> : null}
                      </td>
                      <td>{tenureLabel(g)}</td>
                      <td>
                        {SLOTS.map((slot) => {
                          const events = g.events.filter((e) => e.slot === slot.id);
                          return events.length ? (
                            <p key={slot.id}>
                              <strong>{slot.label}:</strong> {events
                                .map((e) => (e.under ? `${e.label} (under acting G-G ${e.under})` : e.label))
                                .join("; ")}
                            </p>
                          ) : null;
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ToolSummaryDetails>
          );
        })}
      </ToolSummary>
    </>
  );
}
