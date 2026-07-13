"use client";

import { useEffect, useState } from "react";
import "./DesktopRecommendedModal.css";

const STORAGE_KEY = "ul-desktop-nudge-dismissed";
const MOBILE_QUERY = "(max-width: 899px)";

/**
 * One-time nudge shown on mobile-width screens for tools that are genuinely
 * hard to use on a small screen (dense interactive maps, timelines). Not a
 * hard block — dismissible, and the choice is remembered in localStorage so
 * returning mobile visitors aren't nagged on every visit.
 */
export default function DesktopRecommendedModal({
  toolName,
}: {
  toolName: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      // localStorage unavailable (private mode, etc.) — just don't persist.
    }
    if (!dismissed && window.matchMedia(MOBILE_QUERY).matches) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  if (!visible) return null;

  return (
    <div
      className="drm-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Best viewed on a larger screen"
      onClick={dismiss}
    >
      <div className="drm-card" onClick={(e) => e.stopPropagation()}>
        <button className="drm-close" onClick={dismiss} aria-label="Continue on mobile">
          ×
        </button>
        <div className="drm-ic" aria-hidden="true">
          🖥️
        </div>
        <h2 className="drm-title">Best viewed on a bigger screen</h2>
        <p className="drm-body">
          {toolName} is a dense, interactive tool — it's built for a desktop,
          laptop, or tablet screen. Mobile will work, but it'll feel cramped.
        </p>
        <button className="drm-cta" onClick={dismiss}>
          Continue on mobile
        </button>
      </div>
    </div>
  );
}
