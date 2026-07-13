import Logo from "./Logo";

// Large decorative brand mark, mirroring the wordmark's logo at hero scale.
export default function HeroVisual() {
  return (
    <div className="ul-herovis" aria-hidden="true">
      <Logo size={220} className="ul-hv-logo" />
    </div>
  );
}
