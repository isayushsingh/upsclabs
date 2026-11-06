import Link from "next/link";
import CoverageGrid from "@/components/site/CoverageGrid";
import FeaturedTools from "@/components/site/FeaturedTools";
import WhoWeAre from "@/components/site/WhoWeAre";
import HeroQuiz from "@/components/site/HeroQuiz";
import NewsletterSignup from "@/components/site/NewsletterSignup";
import JsonLd from "@/components/site/JsonLd";
import { pageMetadata } from "@/lib/seo";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { TOOLS } from "@/lib/tools";
import { PYQS } from "@/lib/pyq";

export const metadata = pageMetadata({
  title: "Interactive Tools for UPSC Civil Services Exam Prep",
  description:
    "A hub of free, interactive UPSC tools — an Ancient India dynastic timeline you scrub through on a map, a Modern India timeline showing what caused what (1857–1947), every Governor-General and Viceroy with the events of his tenure, and an active-recall map of India's national parks and protected areas.",
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
      <section className="ul-hero-split">
        <div className="ul-hero-copy">
          <span className="ul-hero-pill">For GS1–GS4 and Essay</span>
          <h1 className="ul-hero-split-title">Stop re-reading. Start remembering.</h1>
          <p className="ul-hero-split-sub">
            Maps, timelines and drills built on the UPSC syllabus and previous
            years&rsquo; questions. Try the one{" "}
            <span className="ul-hero-dir-side">on the right</span>
            <span className="ul-hero-dir-below">below</span>.
          </p>
          <div className="ul-hero-split-ctas">
            <Link href="/#featured" className="ul-hero-cta ul-hero-cta-primary">
              Try a tool, no signup <span aria-hidden="true">→</span>
            </Link>
            <Link href="/#syllabus" className="ul-hero-cta ul-hero-cta-secondary">
              Browse by GS paper
            </Link>
          </div>
          {/* TODO(ayush): add real numbers here once you have them, e.g.
              { value: "…", label: "aspirants this month" }. Keep each
              one computed or sourced; don't hard-code a guess. */}
          <ul className="ul-hero-proof">
            <li>
              <strong>{liveTools.length}</strong> live tools
            </li>
            <li>
              <strong>{PYQS.length}</strong> PYQ breakdowns
            </li>
            <li>Free, no signup</li>
          </ul>
        </div>
        <div className="ul-hero-quiz">
          <HeroQuiz />
        </div>
      </section>
      <WhoWeAre />
      <CoverageGrid />
      <FeaturedTools />
    </main>
  );
}
