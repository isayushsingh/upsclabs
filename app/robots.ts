import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /api/* is server plumbing (e.g. the newsletter signup endpoint) —
        // nothing there is a page worth a crawler's time, and no need to
        // list rivers-of-india here too: its own page metadata already sets
        // a noindex robots meta tag, which is the more targeted way to keep
        // one unfinished page out of results without a second place to edit.
        disallow: "/api/",
      },
      // Explicit (not just implied by "*") allow rules for the crawlers
      // behind AI answer engines/assistants, so a future tightening of the
      // default rule can't silently cut this site out of AI Overviews,
      // ChatGPT/Perplexity search, or Claude's web search without someone
      // noticing this list too.
      { userAgent: "GPTBot", allow: "/" }, // ChatGPT (crawling for search/answers)
      { userAgent: "OAI-SearchBot", allow: "/" }, // ChatGPT search
      { userAgent: "ClaudeBot", allow: "/" }, // Claude web search
      { userAgent: "Claude-Web", allow: "/" },
      { userAgent: "anthropic-ai", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" }, // Gemini / AI Overviews training+grounding
      { userAgent: "Applebot-Extended", allow: "/" }, // Apple Intelligence / Siri
      { userAgent: "CCBot", allow: "/" }, // Common Crawl — feeds many models' training sets
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
