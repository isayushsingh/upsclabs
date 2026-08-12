import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools";
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
    { url: `${SITE_URL}/gs3`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];

  const toolRoutes: MetadataRoute.Sitemap = TOOLS.filter((t) => t.state === "live" && t.href).map(
    (t) => ({
      url: `${SITE_URL}${t.href}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: t.featured ? 0.9 : 0.6,
    })
  );

  return [...staticRoutes, ...toolRoutes];
}
