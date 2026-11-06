"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { TOOLS } from "@/lib/tools";

export const VISITED_TOOLS_KEY = "ul-visited-tools";

/**
 * Remembers which tools this browser has opened, so the homepage quiz can
 * prefer questions from tools the visitor hasn't tried yet. localStorage
 * only: nothing leaves the device.
 */
export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const tool = TOOLS.find((t) => t.href && (pathname === t.href || pathname.startsWith(`${t.href}/`)));
    if (!tool) return;
    try {
      const seen: string[] = JSON.parse(localStorage.getItem(VISITED_TOOLS_KEY) ?? "[]");
      if (!seen.includes(tool.slug)) localStorage.setItem(VISITED_TOOLS_KEY, JSON.stringify([...seen, tool.slug]));
    } catch {
      // storage unavailable (private mode, blocked); nothing to remember
    }
  }, [pathname]);

  return null;
}
