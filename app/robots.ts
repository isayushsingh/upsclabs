import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /api/* is server plumbing (e.g. the newsletter signup endpoint) —
      // nothing there is a page worth a crawler's time, and no need to
      // list rivers-of-india here too: its own page metadata already sets
      // a noindex robots meta tag, which is the more targeted way to keep
      // one unfinished page out of results without a second place to edit.
      disallow: "/api/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
