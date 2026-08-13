"use client";

import { useEffect } from "react";

// Registers /sw.js after the page has settled — deferred off the load
// event so it never competes with first-paint work for bandwidth/CPU.
// Client component because navigator.serviceWorker only exists in the
// browser; this renders nothing.
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installability/offline support is a progressive enhancement —
        // a failed registration (unsupported browser, blocked storage)
        // should never surface to the user.
      });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
