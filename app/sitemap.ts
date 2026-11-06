import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools";
import { PYQS } from "@/lib/pyq";
import { SITE_URL } from "@/lib/site";

// Auto-derives from the same tool registry the hub renders from, so a new
// live tool gets a sitemap entry for free instead of needing a second,
// easy-to-forget edit here. Only "live" tools are listed — "building"/
// "planned" ones either aren't linked yet or are explicitly noindexed on
// their own page (see rivers-of-india's metadata), so leaving them out of
// the sitemap too avoids pointing crawlers at incomplete pages.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/gs1`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/gs2`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/gs3`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];

  const liveTools = TOOLS.filter((t) => t.state === "live" && t.href);

  const toolRoutes: MetadataRoute.Sitemap = liveTools.map((t) => ({
    url: `${SITE_URL}${t.href}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: t.featured ? 0.9 : 0.6,
  }));

  // Each tool's /full-list page (its underlying data as a plain-text
  // reference — see ToolSummary) — same registry-driven derivation as
  // toolRoutes above. A tool that's individually noindexed (e.g. world-map
  // — see its own page.tsx) sets noindex on its
  // full-list page too, so listing it here is harmless: that page's own
  // robots meta tag keeps it out of results regardless of sitemap presence.
  const toolReferenceRoutes: MetadataRoute.Sitemap = liveTools.map((t) => ({
    url: `${SITE_URL}${t.href}/full-list`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  // PYQ breakdown pages — same "derive from the registry" approach as
  // toolRoutes above, so a new entry in lib/pyq.ts gets a sitemap row for
  // free instead of a second, easy-to-forget edit here.
  const pyqRoutes: MetadataRoute.Sitemap = PYQS.map((p) => ({
    url: `${SITE_URL}/pyq/${p.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...toolRoutes, ...toolReferenceRoutes, ...pyqRoutes];
}
