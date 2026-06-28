import HeroVisual from "@/components/site/HeroVisual";
import CoverageGrid from "@/components/site/CoverageGrid";
import FeaturedTools from "@/components/site/FeaturedTools";
import NewsletterSignup from "@/components/site/NewsletterSignup";

export default function Home() {
  return (
    <main className="ul-main">
      <section className="ul-hero">
        <div className="ul-hero-text">
          <div className="ul-eyebrow">UPSC Labs · Coverage</div>
          <h1 className="ul-hero-title">
            Building UPSC syllabus,
            <br />
            one interactive tool at a time.
          </h1>
          <p className="ul-hero-sub">
            Every General Studies paper, mapped to a hands-on tool.
          </p>
        </div>
        <HeroVisual />
      </section>

      <CoverageGrid />

      <FeaturedTools />

      <section className="ul-news-wrap">
        <NewsletterSignup />
      </section>
    </main>
  );
}
