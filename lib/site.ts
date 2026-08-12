// Single source of truth for the site's public origin. Needed for
// metadataBase, sitemap.xml, robots.txt, canonical URLs, and absolute
// Open Graph image URLs — all of which break or silently no-op if left
// relative.
//
// Resolution order:
//   1. NEXT_PUBLIC_SITE_URL — set this once a custom domain exists.
//   2. VERCEL_PROJECT_PRODUCTION_URL — Vercel injects this automatically
//      for the Production environment (stable across redeploys, unlike
//      the per-deployment VERCEL_URL).
//   3. VERCEL_URL — falls back to whatever this specific deployment's URL
//      is (preview deployments, or production before a custom domain/env
//      var is set).
//   4. localhost — local dev.
function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercelHost) return `https://${vercelHost}`;
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();
export const SITE_NAME = "UPSC Labs";
