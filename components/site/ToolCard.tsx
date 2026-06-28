import Link from "next/link";
import type { CSSProperties } from "react";
import type { Tool } from "@/lib/tools";
import ToolPreview from "./ToolPreview";

const STATE_LABEL: Record<Tool["state"], string> = {
  live: "Live",
  building: "In build",
  planned: "Planned",
};

export default function ToolCard({ tool }: { tool: Tool }) {
  const live = tool.state === "live" && !!tool.href;
  const inner = (
    <>
      <div className="ul-card-vis">
        <ToolPreview kind={tool.preview} accent={tool.accent} />
      </div>
      <div className="ul-card-body">
        <div className="ul-card-top">
          <span className="ul-card-paper">
            {tool.paper} · {tool.topic}
          </span>
          <span className={`ul-badge ul-badge-${tool.state}`}>{STATE_LABEL[tool.state]}</span>
        </div>
        <h3 className="ul-card-title">{tool.fullTitle || tool.title}</h3>
        <p className="ul-card-blurb">{tool.blurb}</p>
        {live && <span className="ul-card-cta">Open tool →</span>}
      </div>
    </>
  );
  const style = { "--accent": tool.accent } as CSSProperties;
  return live ? (
    <Link href={tool.href!} className="ul-card" style={style}>
      {inner}
    </Link>
  ) : (
    <div className="ul-card ul-card-disabled" style={style} aria-disabled="true">
      {inner}
    </div>
  );
}
