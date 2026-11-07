"use client";

import { useEffect } from "react";

export const THEME_KEY = "ul-theme";

type Theme = "light" | "dark";

/**
 * Runs inline in <head> before first paint (see app/layout.tsx), so the page
 * never flashes the wrong theme. A stored choice wins; otherwise the OS
 * preference. Kept as a string because it must run before React loads.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="light"}})();`;

const current = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

/**
 * Sun/moon switch in the header. Both icons are always rendered and CSS
 * shows the right one from [data-theme], so the server markup never depends
 * on a theme only the browser knows (no hydration mismatch, no flash).
 */
export default function ThemeToggle() {
  // Until the visitor picks a theme, keep following the OS setting live.
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      try {
        if (localStorage.getItem(THEME_KEY)) return;
      } catch {
        // storage blocked: just follow the OS
      }
      apply(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    const next: Theme = current() === "dark" ? "light" : "dark";
    apply(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // storage blocked: the choice lasts for this page view only
    }
  };

  return (
    <button type="button" className="ul-theme-toggle" onClick={toggle} aria-label="Toggle dark mode" title="Toggle dark mode">
      {/* moon: shown in light mode */}
      <svg className="ul-theme-moon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
      {/* sun: shown in dark mode */}
      <svg className="ul-theme-sun" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
        <path
          d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
