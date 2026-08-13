"use client";

// The six-primitive slider group used by the Deficit Calculator — kept as
// its own component so any future widget that needs the same six Budget
// primitives (GCA, NDCR, etc.) reuses this markup instead of re-declaring it.

import { SEGMENTS, type SegKey } from "@/lib/budget/deficit-data";
import { fmtRupee } from "@/lib/budget/format";

export default function SegmentSliders({
  values,
  onChange,
  onReset,
  resetLabel = "Reset to illustrative Budget",
}: {
  values: Record<SegKey, number>;
  onChange: (key: SegKey, value: number) => void;
  onReset: () => void;
  resetLabel?: string;
}) {
  return (
    <div className="bpd-sliders-wrap">
      <div className="bpd-sliders">
        {SEGMENTS.map((s) => (
          <label className="bpd-slider" key={s.key}>
            <span className="bpd-slider-top">
              <span className={`bpd-dot bpd-dot-${s.flavor}`} aria-hidden="true" />
              {s.label}
              <span className="bpd-slider-value">{fmtRupee(values[s.key])}</span>
            </span>
            <input
              type="range"
              min={0}
              max={3000}
              step={50}
              value={values[s.key]}
              onChange={(e) => onChange(s.key, Number(e.target.value))}
            />
          </label>
        ))}
      </div>
      <button type="button" className="bp-reset" onClick={onReset}>
        {resetLabel}
      </button>
    </div>
  );
}
