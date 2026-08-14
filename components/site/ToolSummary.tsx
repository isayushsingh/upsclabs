import type { ReactNode } from "react";
import "./ToolSummary.css";

/**
 * Plain-HTML rendering of a tool's underlying data — dynasties, parks,
 * member states, and so on — as a real table/list. Lives on each tool's own
 * /full-list page (app/gsN/.../full-list/page.tsx), not inline on the tool
 * page itself: the interactive canvas/map pages are almost entirely client
 * JS with no crawlable text, and stuffing this same content into them would
 * bury the tool under a wall of text. A dedicated, genuinely visible page —
 * linked from the tool via ToolReferenceLink — gets the content indexed by
 * search engines and AI crawlers without cluttering the tool or resorting
 * to hidden-from-users-but-not-bots markup (which is cloaking).
 */
export default function ToolSummary({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="ul-tool-summary">
      <h2>{title}</h2>
      {intro && <p className="ul-tool-summary-intro">{intro}</p>}
      {children}
    </section>
  );
}

/** A long list/table, native-HTML-collapsed behind <details> so the page
    stays skimmable — Google explicitly indexes content inside <details>
    even when collapsed, so this costs nothing for search/AI visibility. */
export function ToolSummaryDetails({
  summary,
  children,
  open,
}: {
  summary: ReactNode;
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <details className="ul-tool-summary-details" open={open}>
      <summary>{summary}</summary>
      <div className="ul-tool-summary-details-body">{children}</div>
    </details>
  );
}
