// Builds a full, consistent Next.js Metadata object (title, description,
// canonical URL, Open Graph, Twitter card) from the handful of fields that
// actually differ page to page — so every route gets a real social-preview
// image and a canonical link without re-deriving that boilerplate six times.
import type { Metadata } from "next";
import { SITE_URL, SITE_NAME } from "./site";

export function pageMetadata({
  title,
  description,
  path,
  image,
  noindex,
}: {
  /** Page-specific title — the root layout's template appends " · UPSC Labs". */
  title: string;
  description: string;
  /** Route path starting with "/", e.g. "/gs1/modern-india-timeline". */
  path: string;
  /** Path under /public for a social-preview image; falls back to the site logo. */
  image?: string;
  /** For real, reachable-by-URL pages that aren't finished/verified yet
      (e.g. still "building" in lib/tools.ts) — keeps it out of search
      results without needing to take the route down. */
  noindex?: boolean;
}): Metadata {
  const url = `${SITE_URL}${path}`;
  const ogImage = image ?? "/logo_transparent.png";
  const fullTitle = `${title} · ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: ogImage }],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
  };
}

/** schema.org WebApplication JSON-LD for a live tool page — pass straight
    to <JsonLd data={...} />. Educational/free-tool fields are filled in
    since they're true for every tool here, not page-specific. */
export function toolJsonLd({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    description,
    url: `${SITE_URL}${path}`,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any (web browser)",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };
}

/** schema.org LearningResource JSON-LD for a PYQ breakdown page (app/pyq/...).
    Deliberately not FAQPage/QAPage — Google restricted those rich results to
    a narrow set of gov/health sites in 2023, so they no longer earn snippet
    real estate for a site like this one; LearningResource is still a
    correct, honest description of what the page is without overpromising a
    SERP feature it won't get. */
export function pyqJsonLd({
  name,
  description,
  path,
  educationalLevel = "UPSC Civil Services Preliminary Examination",
}: {
  name: string;
  description: string;
  path: string;
  educationalLevel?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name,
    description,
    url: `${SITE_URL}${path}`,
    educationalLevel,
    isAccessibleForFree: true,
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };
}
