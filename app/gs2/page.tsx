import { TOOLS } from "@/lib/tools";
import ToolCard from "@/components/site/ToolCard";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "GS2 · Polity, Governance & International Relations",
  description:
    "Interactive tools for UPSC General Studies Paper II — an active-recall world map of international organizations and their member countries.",
  path: "/gs2",
});

export default function GS2Page() {
  const tools = TOOLS.filter((t) => t.paper === "GS2");
  return (
    <main className="ul-main">
      <section className="ul-hero ul-hero-sm">
        <div className="ul-eyebrow">General Studies II</div>
        <h1 className="ul-hero-title">Polity, Governance &amp; International Relations</h1>
        <p className="ul-hero-sub">Tools for GS Paper II topics.</p>
      </section>
      <section className="ul-tools">
        <div className="ul-grid">
          {tools.length ? (
            tools.map((t) => <ToolCard key={t.slug} tool={t} />)
          ) : (
            <p className="ul-empty">No GS2 tools yet — check back soon.</p>
          )}
        </div>
      </section>
    </main>
  );
}
