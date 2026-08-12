import Link from "next/link";
import { PAPERS, toolsByPaper, type Paper } from "@/lib/tools";
import PlaceholderImage from "./PlaceholderImage";

// Only papers with a dedicated section page get a real "view all" link.
const PAPER_HREF: Partial<Record<Paper, string>> = {
  GS1: "/gs1",
  GS2: "/gs2",
  GS3: "/gs3",
};

function ViewAll({ paper }: { paper: Paper }) {
  const href = PAPER_HREF[paper];
  if (!href) {
    return (
      <span className="ul-cov-viewall ul-cov-viewall-off" aria-disabled="true">
        view all <span aria-hidden="true">↗</span>
      </span>
    );
  }
  return (
    <Link href={href} className="ul-cov-viewall">
      view all <span aria-hidden="true">↗</span>
    </Link>
  );
}

export default function CoverageGrid() {
  return (
    <section className="ul-coverage" id="syllabus">
      <div className="ul-cov-head">
        <span className="ul-cov-badge">General Studies</span>
        <h2 className="ul-cov-title">Syllabus Wise Tools</h2>
      </div>
      <div className="ul-cov-grid">
        {PAPERS.map((p) => {
          const live = toolsByPaper(p.id).filter((t) => t.state === "live");
          return (
            <div className="ul-cov-col" key={p.id}>
              {PAPER_HREF[p.id] ? (
                <Link href={PAPER_HREF[p.id]!} className="ul-cov-img" aria-label={`Open ${p.id}`}>
                  <PlaceholderImage src={`/images/syllabus/${p.id.toLowerCase()}.jpg`} />
                </Link>
              ) : (
                <div className="ul-cov-img">
                  <PlaceholderImage src={`/images/syllabus/${p.id.toLowerCase()}.jpg`} />
                </div>
              )}
              {live.length > 0 ? (
                <>
                  {/* <h3 className="ul-cov-paper">{p.id}</h3> */}
                  <div className="ul-cov-pills">
                    {live.slice(0, 3).map((t) => (
                      <Link key={t.slug} href={t.href!} className="ul-cov-pill">
                        {t.title + ' ->'}
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {/* <h3 className="ul-cov-paper">{p.id}</h3> */}
                  <p className="ul-cov-note">{p.topics}</p>
                </>
              )}
              <div className="ul-cov-foot">
                <ViewAll paper={p.id} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
