"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./FeatureAnnouncement.css";

const STORAGE_PREFIX = "ul-announce-seen:";
const SHOW_DELAY_MS = 1400;

/**
 * A single site-wide "what's new" toast. Reaches anyone browsing the site —
 * new visitors and returning ones alike — without any backend or login:
 * the seen/dismissed state just lives in localStorage, keyed by `id` so a
 * later announcement (different id) shows again even to someone who
 * dismissed this one. Swap the props below when shipping the next feature;
 * only one announcement is ever mounted/shown at a time.
 */
export default function FeatureAnnouncement({
  id,
  eyebrow = "New",
  title,
  body,
  href,
  cta = "Take a look",
}: {
  id: string;
  eyebrow?: string;
  title: string;
  body: string;
  href: string;
  cta?: string;
}) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const storageKey = `${STORAGE_PREFIX}${id}`;

  useEffect(() => {
    // Don't announce the page the visitor is already standing on.
    if (pathname === href) return;
    let seen = false;
    try {
      seen = localStorage.getItem(storageKey) === "1";
    } catch {
      // localStorage unavailable (private mode, etc.) — show every time
      // rather than never; a repeat toast is better than a silent feature.
    }
    if (seen) return;
    const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [pathname, href, storageKey]);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      // ignore
    }
  };

  if (!visible) return null;

  return (
    <div className="fan-toast" role="status">
      <button className="fan-close" onClick={dismiss} aria-label="Dismiss">
        ×
      </button>
      <div className="fan-eyebrow">✨ {eyebrow}</div>
      <p className="fan-title">{title}</p>
      <p className="fan-body">{body}</p>
      <Link href={href} className="fan-cta" onClick={dismiss}>
        {cta} <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
