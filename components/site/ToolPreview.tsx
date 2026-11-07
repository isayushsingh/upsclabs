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
  // One copy per theme; CSS hides the one that doesn't match [data-theme].
  const cls = `ul-preview${className ? " " + className : ""}`;
  return (
    <>
      <span
        className={`${cls} ul-preview-light`}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: previewSvg(kind, accent, "light") }}
      />
      <span
        className={`${cls} ul-preview-dark`}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: previewSvg(kind, accent, "dark") }}
      />
    </>
  );
}
