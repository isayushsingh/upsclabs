import { TOOLS } from "@/lib/tools";
import PlaceholderImage from "./PlaceholderImage";

// Auto-scrolling marquee of tool preview images below the hero.
// Images are placeholders — drop a matching file into public/images/carousel/
// (named after each tool's slug, e.g. rivers-of-india.jpg) and it'll pick it
// up automatically; nothing else needs to change here.
const CARD_LABEL: Record<string, string> = {
  "ancient-india-timeline": "Ancient India",
  "national-parks": "Wildlife Map",
  "rivers-of-india": "Rivers Map",
};

// How many times the card list repeats in the track. The loop always scrolls
// by exactly one copy-width (see @keyframes ulCarouselScroll in site.css,
// -100%/REPEAT — keep the two in sync), so this only controls how much total
// track width exists; too few repeats and, with only a handful of tools, one
// copy is narrower than the viewport, exposing blank space right before the
// seamless reset. 6 keeps that from happening up to very wide monitors.
const REPEAT = 6;

export default function ToolCarousel() {
  const cards = TOOLS.filter((t) => t.state !== "planned");
  if (!cards.length) return null;
  const looped = Array.from({ length: REPEAT }, () => cards).flat();

  return (
    <div className="ul-carousel-wrap" aria-hidden="true">
      <div className="ul-carousel-track">
        {looped.map((t, i) => (
          <div className="ul-carousel-card" key={`${t.slug}-${i}`}>
            <span className="ul-carousel-pill">{CARD_LABEL[t.slug] ?? t.title}</span>
            <PlaceholderImage
              className="ul-carousel-img"
              src={`/images/carousel/${t.slug}.jpg`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
