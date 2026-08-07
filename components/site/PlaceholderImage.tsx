"use client";

import { useEffect, useState } from "react";

// Shared <img> for spots where real photography hasn't been dropped in yet
// (carousel cards, syllabus cards, purpose-section chips). Renders nothing
// until mounted, then nothing again if the load 404s — so the element's own
// CSS background (a gradient placeholder) shows through instead of a
// broken-image icon. The mount delay matters: `error`/`load` on <img> don't
// bubble, so if the request resolves before React finishes hydrating and
// attaches its listeners, onError is silently missed; starting the fetch
// only in an effect (after hydration) avoids that race. Drop a file at
// `src` and it just starts working.
export default function PlaceholderImage({
  src,
  alt = "",
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
