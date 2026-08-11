import PlaceholderImage from "./PlaceholderImage";

function Chip({ src }: { src: string }) {
  return (
    <span className="ul-purpose-chip">
      <PlaceholderImage src={src} />
    </span>
  );
}

export default function WhoWeAre() {
  return (
    <section className="ul-purpose">
      <div className="ul-cov-head">
        <span className="ul-cov-badge">Why upsc.labs</span>
      </div>
      <p className="ul-purpose-statement">
        From first-time aspirants just opening the NCERTs to veterans
        revising for their fifth attempt <Chip src="/images/purpose/chip-1.png" />,
        we build every tool around one idea — the syllabus sticks when you
        interact with it <Chip src="/images/purpose/chip-2.png" />, not when
        you just re-read it.
      </p>
    </section>
  );
}
