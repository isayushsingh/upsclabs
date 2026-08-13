"use client";

// The mechanism, not the label — now with a baseline state in every box
// instead of empty rectangles, so there's something for the animation to
// visibly *change*:
//   Assets    — a 🏛️ building. Selling one shatters it into coins that fly
//               to the Fund; building one has the fund's coins fly in and
//               the building bounce-grow.
//   Liability — an ⚓ anchor (the existing debt stock). Borrowing drops a
//               brand-new 🧱 block on top of it, which then dissolves into
//               coins flowing to the Fund; repaying sends coins the other
//               way and the anchor visibly cracks.
//   Revenue   — a coin drops straight into the Fund while both boxes grey
//               out and padlock, live, in the same beat — "these zones
//               were deliberately bypassed," shown rather than stated.
//
// Keyed by item id + a replay nonce from the parent so every selection (or
// Replay click) is a fresh mount — CSS keyframes restart for free.

import type { ClassifierItem } from "@/lib/budget/classifier-data";

const BUCKET_LABEL: Record<ClassifierItem["bucket"], string> = {
  revenue: "Revenue",
  capital: "Capital",
};
const KIND_LABEL: Record<ClassifierItem["kind"], string> = {
  receipt: "Receipt",
  expenditure: "Expenditure",
};

const DELTA_TEXT: Record<ClassifierItem["effect"], { box: "asset" | "liability" | null; text: string; badge: string } | null> = {
  "asset-up": { box: "asset", text: "+ asset created", badge: "⬆️" },
  "asset-down": { box: "asset", text: "− asset reduced", badge: "⬇️" },
  "liability-up": { box: "liability", text: "+ liability created", badge: "⬆️" },
  "liability-down": { box: "liability", text: "− liability reduced", badge: "⬇️" },
  none: null,
};

const COIN_DIRECTION: Record<ClassifierItem["effect"], string | null> = {
  "asset-down": "asset-to-cf",
  "asset-up": "cf-to-asset",
  "liability-up": "liability-to-cf",
  "liability-down": "cf-to-liability",
  none: null,
};

export default function BalanceSheetExplainer({ item }: { item: ClassifierItem }) {
  const delta = DELTA_TEXT[item.effect];
  const assetHit = delta?.box === "asset";
  const liabilityHit = delta?.box === "liability";
  const locked = item.effect === "none";
  const coinDir = COIN_DIRECTION[item.effect];

  const assetIconClass =
    item.effect === "asset-down" ? "bpx-icon-shatter" : item.effect === "asset-up" ? "bpx-icon-grow" : "";
  const liabilityIconClass = item.effect === "liability-down" ? "bpx-icon-crack" : "";

  return (
    <div className="bpx-explain">
      <div className="bpx-explain-head">
        <span className="bpx-explain-icon" aria-hidden="true">
          {item.icon}
        </span>
        <div>
          <div className="bpx-explain-title">{item.label}</div>
          <div className="bpx-explain-kind">
            {KIND_LABEL[item.kind]} — money {item.kind === "receipt" ? "coming in" : "going out"}
          </div>
        </div>
      </div>

      <div className="bpx-flow">
        <div className={`bpx-box bpx-box-asset ${assetHit ? "bpx-box-hit" : ""} ${locked ? "bpx-box-locked" : ""}`}>
          <div className="bpx-box-label">Assets</div>
          <div className={`bpx-box-icon ${assetIconClass}`} aria-hidden="true">
            🏛️
          </div>
          {assetHit && (
            <span className="bpx-box-badge" aria-hidden="true">
              {delta!.badge}
            </span>
          )}
          {locked && (
            <span className="bpx-lock" aria-hidden="true">
              🔒
            </span>
          )}
          {assetHit && <div className="bpx-box-delta">{delta!.text}</div>}
        </div>

        <div className="bpx-box bpx-box-cash">
          <div className="bpx-box-label">Consolidated Fund</div>
          <div className="bpx-box-icon" aria-hidden="true">
            💰
          </div>
        </div>

        <div
          className={`bpx-box bpx-box-liability ${liabilityHit ? "bpx-box-hit" : ""} ${locked ? "bpx-box-locked" : ""}`}
        >
          <div className="bpx-box-label">Liabilities</div>
          <div className={`bpx-box-icon ${liabilityIconClass}`} aria-hidden="true">
            ⚓
          </div>
          {item.effect === "liability-up" && (
            <span className="bpx-debt-block" aria-hidden="true">
              🧱
            </span>
          )}
          {liabilityHit && (
            <span className="bpx-box-badge" aria-hidden="true">
              {delta!.badge}
            </span>
          )}
          {locked && (
            <span className="bpx-lock" aria-hidden="true">
              🔒
            </span>
          )}
          {liabilityHit && <div className="bpx-box-delta">{delta!.text}</div>}
        </div>

        {coinDir && (
          <div className={`bpx-coins bpx-coins-${coinDir}`} aria-hidden="true">
            🪙
          </div>
        )}
        {locked && (
          <div className="bpx-drop-cf" aria-hidden="true">
            🪙
          </div>
        )}
      </div>

      <div className="bpx-conclusion">
        <span className={`bpx-chip bpx-chip-${item.bucket}`}>
          → {BUCKET_LABEL[item.bucket]} {KIND_LABEL[item.kind]}
        </span>
        <p className="bpx-why">
          {locked ? "Neither box ever moved — that's the tell. " : ""}
          {item.why}
        </p>
      </div>
    </div>
  );
}
