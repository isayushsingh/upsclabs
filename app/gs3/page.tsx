import type { Metadata } from "next";
import { TOOLS } from "@/lib/tools";
import ToolCard from "@/components/site/ToolCard";

export const metadata: Metadata = {
  title: "GS3 · Environment & Ecology · UPSC Labs",
  description: "Interactive tools for UPSC General Studies Paper III.",
};

export default function GS3Page() {
  const tools = TOOLS.filter((t) => t.paper === "GS3");
  return (
    <main className="ul-main">
      <section className="ul-hero ul-hero-sm">
        <div className="ul-eyebrow">General Studies III</div>
        <h1 className="ul-hero-title"> Environment & Ecology</h1>
        <p className="ul-hero-sub">Tools for GS Paper III topics.</p>
      </section>
      <section className="ul-tools">
        <div className="ul-grid">
          {tools.length ? (
            tools.map((t) => <ToolCard key={t.slug} tool={t} />)
          ) : (
            <p className="ul-empty">No GS3 tools yet — check back soon.</p>
          )}
        </div>
      </section>
    </main>
  );
}