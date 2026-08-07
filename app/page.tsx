import Link from "next/link";
import CoverageGrid from "@/components/site/CoverageGrid";
import FeaturedTools from "@/components/site/FeaturedTools";
import ToolCarousel from "@/components/site/ToolCarousel";
import WhoWeAre from "@/components/site/WhoWeAre";
import NewsletterSignup from "@/components/site/NewsletterSignup";

export default function Home() {
  return (
    <main className="ul-main">
      <section className="ul-hero">
        <span className="ul-hero-kicker">upsc.labs</span>
        <h1 className="ul-hero-title">
          Visualising UPSC syllabus, one interactive tool at a time.
        </h1>
        <p className="ul-hero-sub">
          Every General Studies paper, mapped to a hands-on, interactive
          tool.
        </p>
        <div className="ul-hero-ctas">
          <Link href="/#featured" className="ul-hero-cta ul-hero-cta-primary">
            Get Started <span aria-hidden="true">→</span>
          </Link>
          <Link href="/#syllabus" className="ul-hero-cta ul-hero-cta-secondary">
            View Syllabus <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
      <ToolCarousel />
      <WhoWeAre />
      <CoverageGrid />
      <FeaturedTools />
    </main>
  );
}
