import Link from "next/link";
import type { CSSProperties } from "react";
import { PAPERS, toolsByPaper, coverageCounts, type Tool } from "@/lib/tools";

function Tile({ t }: { t: Tool }) {
  const inner = (
    <>
      <span className="ul-tile-dot" />
      <span className="ul-tile-name">{t.title}</span>
    </>
  );
  const style = { "--accent": t.accent } as CSSProperties;
  if (t.state === "live" && t.href) {
    return (
      <Link href={t.href} className="ul-tile ul-tile-live" style={style}>
        {inner}
      </Link>
    );
  }
  return (
    <div className={`ul-tile ul-tile-${t.state}`} style={style} aria-disabled="true">
      {inner}
    </div>
  );
}

export default function CoverageGrid() {
  const c = coverageCounts();
  const w = (n: number) => `${(n / c.total) * 100}%`;
  return (
    <section className="ul-coverage" id="syllabus">
      <div className="ul-cov-head">
        {/* <div className="ul-cov-stats">
          <strong>{c.live} live</strong> · {c.building} in build · {c.planned} planned
        </div> */}
        {/* <div className="ul-cov-total">
          {c.total} tools across {PAPERS.length} papers
        </div> */}
      </div>
      {/* <div className="ul-cov-bar" role="img" aria-label={`${c.live} live, ${c.building} in build, ${c.planned} planned`}>
        <span className="ul-cov-seg seg-live" style={{ width: w(c.live) }} />
        <span className="ul-cov-seg seg-building" style={{ width: w(c.building) }} />
      </div> */}

      <div className="ul-cov-grid">
        {PAPERS.map((p) => (
          <div className="ul-cov-col" key={p.id}>
            <h3 className="ul-cov-paper">{p.id}</h3>
            <div className="ul-cov-topics">{p.topics}</div>
            <div className="ul-cov-tiles">
              {toolsByPaper(p.id).map((t) => (
                <Tile key={t.slug} t={t} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* <div className="ul-cov-legend">
        <span className="ul-leg">
          <span className="ul-leg-dot seg-live" /> Live
        </span>
        <span className="ul-leg">
          <span className="ul-leg-dot seg-building" /> In build
        </span>
        <span className="ul-leg">
          <span className="ul-leg-dot seg-planned" /> Planned
        </span>
      </div> */}
    </section>
  );
}
