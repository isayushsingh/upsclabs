import Link from "next/link";
import type { CSSProperties } from "react";
import { featuredTools } from "@/lib/tools";
import ToolPreview from "./ToolPreview";

export default function FeaturedTools() {
  const tools = featuredTools();
  if (!tools.length) return null;
  return (
    <section className="ul-featured" id="featured">
      <div className="ul-section-head">
        <h2 className="ul-section-title">Featured Tools</h2>
        <span className="ul-section-meta">the newest, ready to use</span>
      </div>
      <div className="ul-feat-list">
        {tools.map((t) => (
          <Link
            href={t.href!}
            className="ul-feat"
            key={t.slug}
            style={{ "--accent": t.accent } as CSSProperties}
          >
            <div className="ul-feat-vis">
              <ToolPreview kind={t.preview} accent={t.accent} />
            </div>
            <div className="ul-feat-body">
              <h3 className="ul-feat-title">
                {t.fullTitle || t.title}
              </h3>
              <p className="ul-feat-blurb">{t.blurb}</p>
            </div>
            <span className="ul-feat-cta">
              Open tool <span aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
