import Link from "next/link";
import type { CSSProperties } from "react";
import type { Tool } from "@/lib/tools";

export default function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      href={tool.href}
      className="ul-card"
      style={{ "--accent": tool.accent } as CSSProperties}
    >
      <div className="ul-card-top">
        <span className="ul-card-paper">
          {tool.paper} · {tool.topic}
        </span>
        {tool.status && (
          <span className={`ul-badge ul-badge-${tool.status}`}>{tool.status}</span>
        )}
      </div>
      <h3 className="ul-card-title">{tool.title}</h3>
      <p className="ul-card-blurb">{tool.blurb}</p>
      <span className="ul-card-cta">Open tool →</span>
    </Link>
  );
}
