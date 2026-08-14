import Link from "next/link";
import "./ToolReferenceLink.css";

/**
 * One quiet line under a tool, pointing at its companion /full-list page —
 * the actual data behind the map/timeline as plain text (see ToolSummary).
 * Deliberately just a real, visible link and nothing more: the SEO/AI-
 * crawler value of that page comes from it being genuinely reachable by a
 * normal click, not from stuffing its content into this page. Hiding that
 * content here-but-not-there (e.g. visually-hidden-but-in-the-DOM) would be
 * cloaking — same page, different experience for bots vs people — which is
 * exactly what this pattern avoids.
 */
export default function ToolReferenceLink({ href, label }: { href: string; label: string }) {
  return (
    <p className="ul-tool-reference-link">
      <Link href={href}>{label} →</Link>
    </p>
  );
}
