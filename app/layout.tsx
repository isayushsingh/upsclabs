import type { Metadata } from "next";
import { Fraunces, Inter, Space_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next"
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

export const metadata: Metadata = {
  title: "UPSC Labs · Interactive Tools for Civil Services",
  description:
    "Visual, interactive tools for UPSC civil services preparation — timelines, maps, and active-recall utilities across the General Studies syllabus.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${spaceMono.variable}`}>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
