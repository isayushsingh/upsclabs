import { TOOLS } from "@/lib/tools";
import ToolCard from "@/components/site/ToolCard";
import NewsletterSignup from "@/components/site/NewsletterSignup";

export default function Home() {
  const featured = TOOLS.filter((t) => t.status);
  const list = featured.length ? featured : TOOLS;

  return (
    <main className="ul-main">
      <section className="ul-hero">
        <div className="ul-eyebrow">UPSC Labs</div>
        <h1 className="ul-hero-title">
          Interactive Tools for
          <br />
          UPSC
        </h1>
        <p className="ul-hero-sub">
          Visual, hands-on utilities that turn dense syllabus topics into things you can see,
          scrub, and actually remember. Built by an aspirant, for aspirants.
        </p>
      </section>

      <section className="ul-tools" id="tools">
        <div className="ul-section-head">
          <h2 className="ul-section-title">Tools</h2>
          <span className="ul-section-meta">
            {TOOLS.length} tool{TOOLS.length > 1 ? "s" : ""} · more coming
          </span>
        </div>
        <div className="ul-grid">
          {list.map((t) => (
            <ToolCard key={t.slug} tool={t} />
          ))}
        </div>
      </section>

      <section className="ul-news-wrap">
        <NewsletterSignup />
      </section>
    </main>
  );
}
