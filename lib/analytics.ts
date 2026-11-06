import { track as vercelTrack } from "@vercel/analytics";

type Props = Record<string, string | number | boolean | null>;

/** Custom event via Vercel Analytics. Never throws: analytics must not break a page. */
export function track(name: string, props?: Props) {
  try {
    vercelTrack(name, props);
  } catch {
    // blocked by an extension, or analytics not loaded; ignore
  }
}
