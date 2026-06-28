import { TOOLS } from "@/lib/tools";
import ToolCard from "@/components/site/ToolCard";

export const metadata = {
  title: "GS1 · History, Geography & Society · UPSC Labs",
  description: "Interactive tools for UPSC General Studies Paper I.",
};

export default function GS1Page() {
  const tools = TOOLS.filter((t) => t.paper === "GS1");
  return (
    <main className="ul-main">
      <section className="ul-hero ul-hero-sm">
        <div className="ul-eyebrow">General Studies I</div>
        <h1 className="ul-hero-title">History, Geography &amp; Society</h1>
        <p className="ul-hero-sub">Tools for GS Paper I topics.</p>
      </section>
      <section className="ul-tools">
        <div className="ul-grid">
          {tools.length ? (
            tools.map((t) => <ToolCard key={t.slug} tool={t} />)
          ) : (
            <p className="ul-empty">No GS1 tools yet — check back soon.</p>
          )}
        </div>
      </section>
    </main>
  );
}
