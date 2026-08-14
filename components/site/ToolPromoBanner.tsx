import Link from "next/link";
import type { CSSProperties } from "react";
import type { Tool } from "@/lib/tools";
import "./ToolPromoBanner.css";

/**
 * The first thing on every /full-list page, right under the heading —
 * someone arriving here from a Google result or an AI answer landed on a
 * plain-text data dump, not the actual product. Without this they'd have
 * every reason to bounce; this is the invitation back to the interactive
 * tool that's the actual point of the site, styled like the hub's own tool
 * cards (ToolCard.tsx) so it reads as "the real thing", not another link
 * in a wall of text.
 */
export default function ToolPromoBanner({ tool }: { tool: Tool }) {
  const style = { "--accent": tool.accent } as CSSProperties;
  return (
    <Link href={tool.href!} className="ul-promo" style={style}>
      <span className="ul-promo-icon" aria-hidden="true">
        {tool.icon}
      </span>
      <span className="ul-promo-text">
        <span className="ul-promo-eyebrow">Try it yourself</span>
        <span className="ul-promo-title">{tool.fullTitle || tool.title}</span>
        <span className="ul-promo-blurb">{tool.blurb}</span>
      </span>
      <span className="ul-promo-cta">Open the interactive tool →</span>
    </Link>
  );
}
