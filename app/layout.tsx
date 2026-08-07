import type { Metadata } from "next";
import { Fraunces, Inter, Space_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css";
import "@/components/site/site.css";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";

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

export const metadata: Metadata = {
  title: "UPSC Labs · Interactive Tools for Civil Services",
  description:
    "Visual, interactive tools for UPSC civil services preparation — timelines, maps, and active-recall utilities across the General Studies syllabus.",
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
        <Analytics />
        {children}
        <SpeedInsights />
        <Footer />
      </body>
    </html>
  );
}
