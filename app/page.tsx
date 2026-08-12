import Link from "next/link";
import CoverageGrid from "@/components/site/CoverageGrid";
import FeaturedTools from "@/components/site/FeaturedTools";
import ToolCarousel from "@/components/site/ToolCarousel";
import WhoWeAre from "@/components/site/WhoWeAre";
import NewsletterSignup from "@/components/site/NewsletterSignup";
import JsonLd from "@/components/site/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { TOOLS } from "@/lib/tools";

export const metadata = pageMetadata({
  title: "Interactive Tools for UPSC Civil Services Exam Prep",
  description:
    "A hub of free, interactive UPSC tools — an Ancient India dynastic timeline you scrub through on a map, a Modern India timeline showing what caused what (1857–1947), and an active-recall map of India's national parks and protected areas.",
  path: "/",
});

export default function Home() {
  const liveTools = TOOLS.filter((t) => t.state === "live" && t.href);
  return (
    <main className="ul-main">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          url: SITE_URL,
          description:
            "Free, interactive tools for UPSC civil services preparation across the General Studies syllabus.",
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: liveTools.map((t, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_URL}${t.href}`,
            name: t.fullTitle ?? t.title,
          })),
        }}
      />
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
