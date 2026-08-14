import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Space_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css";
import "@/components/site/site.css";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import ServiceWorkerRegistration from "@/components/site/ServiceWorkerRegistration";
import FeatureAnnouncement from "@/components/site/FeatureAnnouncement";
import { SITE_URL, SITE_NAME } from "@/lib/site";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});
// General Sans (Fontshare, free for commercial use) — closest self-hosted
// match to the rounded-terminal display sans in the reference hero; used
// only for the homepage hero title.
const generalSans = localFont({
  src: [
    { path: "../public/fonts/general-sans/GeneralSans-Semibold.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/general-sans/GeneralSans-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-general-sans",
  display: "swap",
});

const DEFAULT_TITLE = "UPSC Labs · Interactive Tools for Civil Services Exam Prep";
const DEFAULT_DESCRIPTION =
  "Free interactive tools for UPSC civil services preparation — a dynastic timeline you scrub through on a map, an active-recall map of India's national parks and protected areas, a cause-and-effect timeline of Modern India (1857–1947), and more across the General Studies syllabus.";

export const metadata: Metadata = {
  // Everything else in this file computes absolute URLs from this — without
  // it, Open Graph images, canonical links, and sitemap/robots entries
  // silently resolve to relative or wrong paths.
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    // Individual pages set title:"Ancient India Timeline" etc. and this
    // template appends the brand, so every <title> and OG title stays
    // "<page> · UPSC Labs" without repeating the suffix on every route.
    template: `%s · ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "UPSC preparation",
    "UPSC interactive tools",
    "Indian history timeline",
    "Modern India timeline",
    "Ancient India dynasties map",
    "National parks map India",
    "UPSC GS1 GS3",
    "civil services exam prep",
    "active recall UPSC",
  ],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  manifest: "/manifest.webmanifest",
  icons: {
    // app/icon.png (square, Next.js App Router auto-detects it) supplies the
    // primary <link rel="icon"> tag; favicon.ico stays here too since Google
    // still checks that root path directly, independent of the HTML.
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [{ url: "/logo_transparent.png" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/logo_transparent.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#f2efe2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${spaceMono.variable} ${generalSans.variable}`}
    >
      <body>
        {/* Faint vertical column rules behind the entire page (not just the
            hero) — position:fixed means it never needs to match document
            height, since a purely vertical pattern looks identical whether
            it scrolls with content or not. */}
        <div className="ul-gridlines" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <Header />
        <ServiceWorkerRegistration />
        <Analytics />
        {children}
        <SpeedInsights />
        <Footer />
        {/* Swap id/copy/href here for each new feature — a new id shows
            again even to visitors who dismissed a previous announcement. */}
        <FeatureAnnouncement
          id="kings-lineage-2026-08"
          title="Notable Kings added to the Ancient India timeline"
          body="Scrub the Ancient India Timeline and see each dynasty's ruler lineage, with the current king spotlighted."
          href="/gs1/ancient-india-timeline"
          cta="See it"
        />
      </body>
    </html>
  );
}
