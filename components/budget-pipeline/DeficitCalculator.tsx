"use client";

// Deficit Calculator — the fix for "I can recite the formula but can't see
// what it's measuring." Six sliders feed two bars (Receipts, Expenditure);
// picking a deficit definition doesn't redraw the bars from scratch — it
// re-colors the *same* bars, dimming what that definition ignores and
// hatching the one slice it specifically carves back out, then drops a
// marker on each bar showing exactly how far that definition counts. The
// gap between the two markers, spelled out with live numbers, is the
// deficit — not a formula to memorize, a distance to look at.

import { useMemo, useState } from "react";
import {
  DEFAULT_VALUES,
  DEFICITS,
  SEGMENTS,
  type DeficitId,
  type SegKey,
  type SegStatus,
} from "@/lib/budget/deficit-data";
import { fmtRupee as fmt } from "@/lib/budget/format";
import SegmentSliders from "./SegmentSliders";

export default function DeficitCalculator() {
  const [values, setValues] = useState<Record<SegKey, number>>(DEFAULT_VALUES);
  const [metricId, setMetricId] = useState<DeficitId>("fiscal");

  const metric = DEFICITS.find((d) => d.id === metricId)!;

  const calc = useMemo(() => {
    const receiptsFull = values.rr + values.ndcr;
    const expenditureFull = values.otherRE + values.gca + values.ip + values.ce;
    const scale = Math.max(receiptsFull, expenditureFull, 1);

    const sumBar = (bar: "receipts" | "expenditure", statuses: SegStatus[]) =>
      SEGMENTS.filter((s) => s.bar === bar && statuses.includes(metric.status[s.key])).reduce(
        (acc, s) => acc + values[s.key],
        0,
      );

    const activeReceipts = sumBar("receipts", ["active"]);
    const activeExpenditure = sumBar("expenditure", ["active"]);
    const gap = activeExpenditure - activeReceipts;

    return { receiptsFull, expenditureFull, scale, activeReceipts, activeExpenditure, gap };
  }, [values, metric]);

  const setVal = (key: SegKey, v: number) => setValues((prev) => ({ ...prev, [key]: v }));

  const isDeficit = calc.gap >= 0;

  return (
    <div className="bpd-root">
      <div className="bpd-tabs" role="tablist" aria-label="Deficit definition">
        {DEFICITS.map((d) => (
          <button
            key={d.id}
            type="button"
            role="tab"
            aria-selected={metricId === d.id}
            className={`bpd-tab ${metricId === d.id ? "bpd-tab-active" : ""}`}
            onClick={() => setMetricId(d.id)}
          >
            {d.title}
          </button>
        ))}
      </div>
      <p className="bpd-blurb">{metric.blurb}</p>

      <div className="bpd-scale">
        <BarRow
          label="Receipts"
          bar="receipts"
          values={values}
          scale={calc.scale}
          status={metric.status}
          markerPct={(calc.activeReceipts / calc.scale) * 100}
          markerValue={calc.activeReceipts}
        />
        <BarRow
          label="Expenditure"
          bar="expenditure"
          values={values}
          scale={calc.scale}
          status={metric.status}
          markerPct={(calc.activeExpenditure / calc.scale) * 100}
          markerValue={calc.activeExpenditure}
        />
        <div className="bpd-gap-row">
          <div
            className="bpd-gap-span"
            style={{
              left: `${Math.min(calc.activeReceipts, calc.activeExpenditure) / calc.scale * 100}%`,
              width: `${Math.max(Math.abs(calc.activeExpenditure - calc.activeReceipts) / calc.scale * 100, 0.4)}%`,
            }}
          >
            <span className="bpd-gap-label">
              {isDeficit ? metric.title : "Surplus"}: {fmt(Math.abs(calc.gap))}
            </span>
          </div>
        </div>
      </div>

      <div className="bpd-formula">
        <div className="bpd-formula-symbolic">{metric.title} = {metric.formula}</div>
        <div className="bpd-formula-numeric">
          {metric.expenditureLabel} ({fmt(calc.activeExpenditure)}) − {metric.receiptsLabel} (
          {fmt(calc.activeReceipts)}) = <strong>{fmt(calc.gap)}</strong>
          {!isDeficit && <> → 0, a surplus of {fmt(Math.abs(calc.gap))}</>}
        </div>
      </div>

      <SegmentSliders values={values} onChange={setVal} onReset={() => setValues(DEFAULT_VALUES)} />
    </div>
  );
}

function BarRow({
  label,
  bar,
  values,
  scale,
  status,
  markerPct,
  markerValue,
}: {
  label: string;
  bar: "receipts" | "expenditure";
  values: Record<SegKey, number>;
  scale: number;
  status: Record<SegKey, SegStatus>;
  markerPct: number;
  markerValue: number;
}) {
  const segs = SEGMENTS.filter((s) => s.bar === bar);
  return (
    <div className="bpd-bar-row">
      <div className="bpd-bar-label">{label}</div>
      <div className="bpd-bar">
        {segs.map((s) => {
          const st = status[s.key];
          const widthPct = (values[s.key] / scale) * 100;
          return (
            <div
              key={s.key}
              className={`bpd-seg bpd-seg-${s.flavor} bpd-seg-${st}`}
              style={{ width: `${widthPct}%` }}
              title={`${s.label}: ${fmt(values[s.key])}${st === "dim" ? " — not part of this deficit" : st === "carve" ? " — carved out of this deficit" : ""}`}
            >
              {widthPct > 9 && <span className="bpd-seg-label">{s.short}</span>}
            </div>
          );
        })}
        <div className="bpd-marker" style={{ left: `${markerPct}%` }}>
          <span className="bpd-marker-flag">{fmt(markerValue)}</span>
        </div>
      </div>
    </div>
  );
}
