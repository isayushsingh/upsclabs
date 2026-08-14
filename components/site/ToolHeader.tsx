import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import JsonLd from "./JsonLd";
import { SITE_URL } from "@/lib/site";

export interface Crumb {
  label: string;
  /** Omit for the current page (rendered as plain text, not a link). */
  href?: string;
}

/**
 * Shared breadcrumb + title + subtitle for every tool page (Ancient India
 * Timeline, National Parks, Rivers of India, and future ones) — one place
 * for the font, sizing and alignment so they can't drift apart the way the
 * old per-tool copies did (serif vs sans titles, 880px vs 1280px columns).
 * Rendered by the page (app/.../page.tsx), above the tool component itself.
 */
export default function ToolHeader({
  crumbs,
  title,
  subtitle,
  breadcrumbClassName,
}: {
  crumbs: Crumb[];
  title: string;
  subtitle?: ReactNode;
  /** Extra class on the breadcrumb <nav>, e.g. for a tool-specific
      truncation rule on an unusually long current-page segment. */
  breadcrumbClassName?: string;
}) {
  return (
    <div className="ul-toolhead">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          // The current page (last crumb, no href) is still a valid
          // ListItem without an "item" URL per schema.org/Google's own
          // guidance — it just doesn't link anywhere.
          itemListElement: crumbs.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.label,
            ...(c.href ? { item: `${SITE_URL}${c.href}` } : {}),
          })),
        }}
      />
      <nav
        className={`ul-breadcrumb${breadcrumbClassName ? ` ${breadcrumbClassName}` : ""}`}
        aria-label="Breadcrumb"
      >
        <span className="ul-breadcrumb-pill">
          {crumbs.map((c, i) => (
            <Fragment key={i}>
              {c.href ? (
                <Link href={c.href}>{c.label}</Link>
              ) : (
                <span className="ul-breadcrumb-cur">{c.label}</span>
              )}
              {i < crumbs.length - 1 && <span aria-hidden="true">/</span>}
            </Fragment>
          ))}
        </span>
      </nav>
      <h1 className="ul-tool-title">{title}</h1>
      {subtitle && <p className="ul-tool-sub">{subtitle}</p>}
    </div>
  );
}
