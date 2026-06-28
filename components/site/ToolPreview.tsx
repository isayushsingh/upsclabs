import { previewSvg } from "./previews";
import type { PreviewKind } from "@/lib/tools";

export default function ToolPreview({
  kind,
  accent,
  className,
}: {
  kind: PreviewKind;
  accent: string;
  className?: string;
}) {
  return (
    <span
      className={`ul-preview${className ? " " + className : ""}`}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: previewSvg(kind, accent) }}
    />
  );
}
