// Ambient, looping grid — tiles softly "fill in" with pigment colours,
// echoing the headline: the syllabus filling one tile at a time.
// Pure CSS animation (see site.css); respects prefers-reduced-motion.
export default function HeroVisual() {
  const cells = Array.from({ length: 36 });
  return (
    <div className="ul-herovis" aria-hidden="true">
      <div className="ul-hv-grid">
        {cells.map((_, i) => (
          <span key={i} className="ul-hv-cell" />
        ))}
      </div>
      <div className="ul-hv-glow" />
    </div>
  );
}
