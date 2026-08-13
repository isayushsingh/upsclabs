"use client";

// Buoyancy vs Elasticity — the fix for "these look like the same ratio."
// One slider ("Underlying Tax Elasticity") *is* the Elasticity line by
// construction: automatic tax growth is defined as GDP growth × that
// number, every year, so Elasticity sits exactly on the slider's value —
// flat, boring, on purpose. Buoyancy is the same automatic growth *plus*
// whatever a discretionary policy change (a new cess, a rate hike) added
// on top, so it only ever diverges from Elasticity in the one year that
// shock is switched on. Turn the shock off and the two lines snap back
// together — that identity, not a formula, is the whole lesson.

import { useMemo, useState } from "react";

const YEARS = [1, 2, 3, 4, 5];
// Purely cosmetic variation so five years of bars/lines don't sit dead
// flat — the underlying relationship (elasticity × GDP growth = automatic
// tax growth) holds regardless of these multipliers.
const GDP_PATTERN = [0.92, 1.08, 0.85, 1.15, 1.0];

const GDP0 = 10000;
const TAX0 = 1200; // a 12% illustrative starting Tax-to-GDP ratio

const fmtPct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;

export default function BuoyancyExplorer() {
  const [gdpGrowthRate, setGdpGrowthRate] = useState(7);
  const [elasticity, setElasticity] = useState(1.0);
  const [shockOn, setShockOn] = useState(true);
  const [shockYear, setShockYear] = useState(3);
  const [shockPoints, setShockPoints] = useState(4);

  const years = useMemo(() => {
    let gdpLevel = GDP0;
    let taxLevel = TAX0;
    return YEARS.map((yr, i) => {
      const gdpGrowth = gdpGrowthRate * GDP_PATTERN[i];
      const automaticTaxGrowth = gdpGrowth * elasticity;
      const discretionary = shockOn && yr === shockYear ? shockPoints : 0;
      const observedTaxGrowth = automaticTaxGrowth + discretionary;
      const buoyancy = gdpGrowth !== 0 ? observedTaxGrowth / gdpGrowth : 0;
      const elasticityVal = gdpGrowth !== 0 ? automaticTaxGrowth / gdpGrowth : 0;
      gdpLevel *= 1 + gdpGrowth / 100;
      taxLevel *= 1 + observedTaxGrowth / 100;
      return {
        yr,
        gdpGrowth,
        automaticTaxGrowth,
        discretionary,
        observedTaxGrowth,
        buoyancy,
        elasticityVal,
        ratio: (taxLevel / gdpLevel) * 100,
      };
    });
  }, [gdpGrowthRate, elasticity, shockOn, shockYear, shockPoints]);

  const shockRow = years.find((y) => y.yr === shockYear)!;

  return (
    <div className="bpb-root">
      <div className="bpb-controls">
        <label className="bpd-slider">
          <span className="bpd-slider-top">
            GDP Growth Rate
            <span className="bpd-slider-value">{fmtPct(gdpGrowthRate)}</span>
          </span>
          <input
            type="range"
            min={3}
            max={11}
            step={0.5}
            value={gdpGrowthRate}
            onChange={(e) => setGdpGrowthRate(Number(e.target.value))}
          />
        </label>
        <label className="bpd-slider">
          <span className="bpd-slider-top">
            Underlying Tax Elasticity
            <span className="bpd-slider-value">{elasticity.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={0.4}
            max={1.8}
            step={0.05}
            value={elasticity}
            onChange={(e) => setElasticity(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="bpb-shock">
        <label className="bpb-shock-toggle">
          <input type="checkbox" checked={shockOn} onChange={(e) => setShockOn(e.target.checked)} />
          Add a discretionary tax change (new cess / rate hike)
        </label>
        {shockOn && (
          <div className="bpb-shock-controls">
            <div className="bpb-year-pick">
              {YEARS.map((yr) => (
                <button
                  key={yr}
                  type="button"
                  className={`bpb-year-btn ${shockYear === yr ? "bpb-year-btn-active" : ""}`}
                  onClick={() => setShockYear(yr)}
                >
                  Year {yr}
                </button>
              ))}
            </div>
            <label className="bpd-slider">
              <span className="bpd-slider-top">
                Extra points it adds to tax growth
                <span className="bpd-slider-value">+{fmtPct(shockPoints)}</span>
              </span>
              <input
                type="range"
                min={0}
                max={8}
                step={0.5}
                value={shockPoints}
                onChange={(e) => setShockPoints(Number(e.target.value))}
              />
            </label>
          </div>
        )}
      </div>

      <LineChart years={years} shockYear={shockOn ? shockYear : null} />

      <div className="bpb-formula">
        <div className="bpb-formula-col">
          <span className="bpb-formula-label bpb-formula-label-buoyancy">
            Buoyancy (Year {shockRow.yr})
          </span>
          <div className="bpb-formula-numeric">
            Observed Tax Growth ({fmtPct(shockRow.observedTaxGrowth)}) ÷ GDP Growth (
            {fmtPct(shockRow.gdpGrowth)}) = <strong>{shockRow.buoyancy.toFixed(2)}</strong>
          </div>
        </div>
        <div className="bpb-formula-col">
          <span className="bpb-formula-label bpb-formula-label-elasticity">
            Elasticity (Year {shockRow.yr})
          </span>
          <div className="bpb-formula-numeric">
            Automatic Tax Growth ({fmtPct(shockRow.automaticTaxGrowth)}) ÷ GDP Growth (
            {fmtPct(shockRow.gdpGrowth)}) = <strong>{shockRow.elasticityVal.toFixed(2)}</strong>
          </div>
        </div>
      </div>
      <p className="bpb-note">
        {shockRow.discretionary > 0
          ? `Year ${shockRow.yr}'s observed tax growth includes ${fmtPct(shockRow.discretionary)} that came from the policy change itself, not the economy growing — Elasticity strips that back out, Buoyancy doesn't.`
          : "No discretionary change this year, so Buoyancy and Elasticity are identical — turn the toggle on to watch them split."}
      </p>

      <RatioChart years={years} />
    </div>
  );
}

function scaleFor(values: number[], padFrac = 0.15) {
  const min = Math.min(...values, 0);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = span * padFrac;
  return { min: min - pad, max: max + pad };
}

const CHART_W = 640;
const CHART_H = 170;
const PAD_X = 30;
const PAD_Y = 14;

function xFor(i: number) {
  return PAD_X + (i * (CHART_W - PAD_X * 2)) / (YEARS.length - 1);
}
function yFor(v: number, scale: { min: number; max: number }) {
  const t = (v - scale.min) / (scale.max - scale.min);
  return CHART_H - PAD_Y - t * (CHART_H - PAD_Y * 2);
}

function LineChart({
  years,
  shockYear,
}: {
  years: { yr: number; buoyancy: number; elasticityVal: number }[];
  shockYear: number | null;
}) {
  const scale = scaleFor([...years.map((y) => y.buoyancy), ...years.map((y) => y.elasticityVal)]);
  const buoyPts = years.map((y, i) => `${xFor(i)},${yFor(y.buoyancy, scale)}`).join(" ");
  const elasPts = years.map((y, i) => `${xFor(i)},${yFor(y.elasticityVal, scale)}`).join(" ");

  return (
    <div className="bpb-chart-wrap">
      <div className="bpb-chart-title">Buoyancy vs Elasticity</div>
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="bpb-svg" role="img" aria-label="Buoyancy vs elasticity over five years">
        {shockYear && (
          <rect
            x={xFor(shockYear - 1) - 16}
            y={0}
            width={32}
            height={CHART_H}
            className="bpb-shock-band"
          />
        )}
        <polyline points={elasPts} className="bpb-line bpb-line-elasticity" />
        <polyline points={buoyPts} className="bpb-line bpb-line-buoyancy" />
        {years.map((y, i) => (
          <g key={`e${y.yr}`}>
            <circle cx={xFor(i)} cy={yFor(y.elasticityVal, scale)} r={3.5} className="bpb-dot bpb-dot-elasticity">
              <title>Elasticity Year {y.yr}: {y.elasticityVal.toFixed(2)}</title>
            </circle>
          </g>
        ))}
        {years.map((y, i) => (
          <g key={`b${y.yr}`}>
            <circle cx={xFor(i)} cy={yFor(y.buoyancy, scale)} r={3.5} className="bpb-dot bpb-dot-buoyancy">
              <title>Buoyancy Year {y.yr}: {y.buoyancy.toFixed(2)}</title>
            </circle>
          </g>
        ))}
        {years.map((y, i) => (
          <text key={`t${y.yr}`} x={xFor(i)} y={CHART_H - 1} className="bpb-axis-label" textAnchor="middle">
            Y{y.yr}
          </text>
        ))}
      </svg>
      <div className="bpb-legend">
        <span className="bpb-legend-item">
          <span className="bpb-swatch bpb-swatch-elasticity" /> Elasticity (automatic response only)
        </span>
        <span className="bpb-legend-item">
          <span className="bpb-swatch bpb-swatch-buoyancy" /> Buoyancy (includes policy changes)
        </span>
      </div>
    </div>
  );
}

function RatioChart({ years }: { years: { yr: number; ratio: number }[] }) {
  const scale = scaleFor(years.map((y) => y.ratio), 0.25);
  const pts = years.map((y, i) => `${xFor(i)},${yFor(y.ratio, scale)}`).join(" ");
  return (
    <div className="bpb-chart-wrap">
      <div className="bpb-chart-title">Tax-to-GDP Ratio</div>
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="bpb-svg" role="img" aria-label="Tax to GDP ratio over five years">
        <polyline points={pts} className="bpb-line bpb-line-ratio" />
        {years.map((y, i) => (
          <g key={y.yr}>
            <circle cx={xFor(i)} cy={yFor(y.ratio, scale)} r={3.5} className="bpb-dot bpb-dot-ratio">
              <title>Tax-to-GDP Year {y.yr}: {y.ratio.toFixed(1)}%</title>
            </circle>
            <text x={xFor(i)} y={yFor(y.ratio, scale) - 10} className="bpb-point-label" textAnchor="middle">
              {y.ratio.toFixed(1)}%
            </text>
          </g>
        ))}
        {years.map((y, i) => (
          <text key={`t${y.yr}`} x={xFor(i)} y={CHART_H - 1} className="bpb-axis-label" textAnchor="middle">
            Y{y.yr}
          </text>
        ))}
      </svg>
      <p className="bpb-ratio-note">
        Rises whenever tax revenue grows faster than GDP — exactly the years Buoyancy sits above Elasticity.
      </p>
    </div>
  );
}
