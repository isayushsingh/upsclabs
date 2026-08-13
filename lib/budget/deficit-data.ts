// Data for the Deficit Calculator. Six primitives feed both bars; each of
// the four deficit definitions is just a different rule for which
// primitives count toward the total on each side — everything else follows
// from that (bar length, the marker position, the formula readout).
//
// status per segment, per deficit:
//   active — counted normally in this deficit's total
//   dim    — not part of this deficit at all (wrong side of the
//            revenue/capital line for what's being measured)
//   carve  — normally counted (it's revenue-flavoured), but this specific
//            deficit definition exists *to* pull it back out — Effective
//            Revenue Deficit carves out GCA, Primary Deficit carves out
//            interest payments. Kept visually distinct from "dim" so the
//            one-line reason each definition exists stays visible.

export type SegKey = "rr" | "ndcr" | "otherRE" | "gca" | "ip" | "ce";
export type SegBar = "receipts" | "expenditure";
export type SegFlavor = "revenue" | "capital";

export interface SegmentDef {
  key: SegKey;
  bar: SegBar;
  label: string;
  short: string;
  flavor: SegFlavor;
}

export const SEGMENTS: SegmentDef[] = [
  { key: "rr", bar: "receipts", label: "Revenue Receipts", short: "RR", flavor: "revenue" },
  { key: "ndcr", bar: "receipts", label: "Non-debt Capital Receipts", short: "NDCR", flavor: "capital" },
  { key: "otherRE", bar: "expenditure", label: "Other Revenue Expenditure", short: "Other RE", flavor: "revenue" },
  {
    key: "gca",
    bar: "expenditure",
    label: "Grants for Creation of Capital Assets",
    short: "GCA",
    flavor: "capital",
  },
  { key: "ip", bar: "expenditure", label: "Interest Payments", short: "IP", flavor: "revenue" },
  { key: "ce", bar: "expenditure", label: "Capital Expenditure", short: "CE", flavor: "capital" },
];

// Illustrative round numbers, not any actual year's Budget — chosen so
// Effective Revenue Deficit and Primary Deficit both land negative by
// default (a deliberate teaching moment: a "deficit" can compute to a
// surplus once you carve the right slice out).
export const DEFAULT_VALUES: Record<SegKey, number> = {
  rr: 2000,
  ndcr: 100,
  otherRE: 1300,
  gca: 150,
  ip: 650,
  ce: 400,
};

export type DeficitId = "fiscal" | "revenue" | "effective-revenue" | "primary";
export type SegStatus = "active" | "dim" | "carve";

export interface DeficitDef {
  id: DeficitId;
  title: string;
  blurb: string;
  status: Record<SegKey, SegStatus>;
  formula: string;
  receiptsLabel: string;
  expenditureLabel: string;
}

export const DEFICITS: DeficitDef[] = [
  {
    id: "fiscal",
    title: "Fiscal Deficit",
    blurb: "Everything spent, against everything received except fresh borrowing.",
    status: { rr: "active", ndcr: "active", otherRE: "active", gca: "active", ip: "active", ce: "active" },
    formula: "(Revenue Exp. + Capital Exp.) − (Revenue Receipts + Non-debt Capital Receipts)",
    receiptsLabel: "Total Receipts (excl. borrowings)",
    expenditureLabel: "Total Expenditure",
  },
  {
    id: "revenue",
    title: "Revenue Deficit",
    blurb: "Ignore the capital side completely — just the day-to-day account.",
    status: { rr: "active", ndcr: "dim", otherRE: "active", gca: "active", ip: "active", ce: "dim" },
    formula: "Revenue Expenditure − Revenue Receipts",
    receiptsLabel: "Revenue Receipts",
    expenditureLabel: "Revenue Expenditure",
  },
  {
    id: "effective-revenue",
    title: "Effective Revenue Deficit",
    blurb: "Revenue Deficit, minus the one slice of it that actually built an asset.",
    status: { rr: "active", ndcr: "dim", otherRE: "active", gca: "carve", ip: "active", ce: "dim" },
    formula: "Revenue Deficit − Grants for Creation of Capital Assets",
    receiptsLabel: "Revenue Receipts",
    expenditureLabel: "Revenue Expenditure (excl. GCA)",
  },
  {
    id: "primary",
    title: "Primary Deficit",
    blurb: "Fiscal Deficit, minus the interest bill on debt already taken on.",
    status: { rr: "active", ndcr: "active", otherRE: "active", gca: "active", ip: "carve", ce: "active" },
    formula: "Fiscal Deficit − Interest Payments",
    receiptsLabel: "Total Receipts (excl. borrowings)",
    expenditureLabel: "Total Expenditure (excl. Interest)",
  },
];
