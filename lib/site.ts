// Single source of truth for the site's public origin. Needed for
// metadataBase, sitemap.xml, robots.txt, canonical URLs, and absolute
// Open Graph image URLs — all of which break or silently no-op if left
// relative.
//
// Resolution order:
//   1. NEXT_PUBLIC_SITE_URL — set this in Vercel's Production environment
//      to lock the canonical domain in explicitly rather than relying on
//      whatever Vercel happens to inject (must still be set there for this
//      to take effect — see the deploy note below).
//   2. VERCEL_PROJECT_PRODUCTION_URL — Vercel injects this automatically
//      for the Production environment (stable across redeploys, unlike
//      the per-deployment VERCEL_URL).
//   3. VERCEL_URL — falls back to whatever this specific deployment's URL
//      is (preview deployments, or production before a custom domain/env
//      var is set).
//   4. The production domain, if NODE_ENV is production — a last-resort
//      safety net so a misconfigured or non-Vercel production build never
//      leaks localhost into a live sitemap/robots/OG tag.
//   5. localhost — local dev only.
const PRODUCTION_DOMAIN = "https://upsclabs.com";

function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercelHost) return `https://${vercelHost}`;
  if (process.env.NODE_ENV === "production") return PRODUCTION_DOMAIN;
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();
export const SITE_NAME = "UPSC Labs";
