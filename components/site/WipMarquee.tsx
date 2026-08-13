import "./WipMarquee.css";

const DEFAULT_ITEMS = [
  "Work in progress",
  "Borders are real now, the facts are still on probation",
  "Rivers are hand-traced for South America so far — the rest are a first draft",
];

/**
 * Loud red scrolling banner for tools that are live but visibly unfinished —
 * a deliberate tonal break from the calm parchment theme everywhere else, so
 * "this is real but not done" reads instantly instead of needing a caveat
 * paragraph nobody reads.
 */
export default function WipMarquee({ items = DEFAULT_ITEMS }: { items?: string[] }) {
  const seg = (
    <span className="wip-marquee-seg" aria-hidden="true">
      {items.map((t, i) => (
        <span className="wip-marquee-item" key={i}>
          {t}
        </span>
      ))}
    </span>
  );
  return (
    <div className="wip-marquee" role="status">
      <span className="sr-only">
        {items[0]} — this tool is still under construction.
      </span>
      <div className="wip-marquee-track">
        {seg}
        {seg}
      </div>
    </div>
  );
}
