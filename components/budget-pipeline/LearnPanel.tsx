"use client";

// Learn mode: browse, don't get scored. Pick any item and watch the
// balance-sheet mechanism play out; nothing here is marked right or wrong.
// The drag-drop test (ReceiptsClassifier) is the separate, second pass —
// this panel's only job is building the intuition that test then checks.

import { useEffect, useState } from "react";
import { CLASSIFIER_ITEMS, type ClassifierItem } from "@/lib/budget/classifier-data";
import BalanceSheetExplainer from "./BalanceSheetExplainer";

export default function LearnPanel({ onSwitchToTest }: { onSwitchToTest: () => void }) {
  const [activeId, setActiveId] = useState(CLASSIFIER_ITEMS[0].id);
  const [visited, setVisited] = useState<Set<string>>(new Set([CLASSIFIER_ITEMS[0].id]));
  const [replayNonce, setReplayNonce] = useState(0);

  useEffect(() => {
    setVisited((v) => (v.has(activeId) ? v : new Set(v).add(activeId)));
  }, [activeId]);

  const active = CLASSIFIER_ITEMS.find((it) => it.id === activeId)!;
  const receipts = CLASSIFIER_ITEMS.filter((it) => it.kind === "receipt");
  const expenditure = CLASSIFIER_ITEMS.filter((it) => it.kind === "expenditure");
  const allExplored = visited.size === CLASSIFIER_ITEMS.length;

  const pick = (item: ClassifierItem) => {
    if (item.id === activeId) {
      setReplayNonce((n) => n + 1);
    } else {
      setActiveId(item.id);
    }
  };

  const goNext = () => {
    const idx = CLASSIFIER_ITEMS.findIndex((it) => it.id === activeId);
    const next = CLASSIFIER_ITEMS[(idx + 1) % CLASSIFIER_ITEMS.length];
    setActiveId(next.id);
  };

  return (
    <div className="bp-learn">
      <div className="bp-learn-progress" role="status">
        <div className="bp-progress-bar">
          <div
            className="bp-progress-fill bp-progress-fill-learn"
            style={{ width: `${(visited.size / CLASSIFIER_ITEMS.length) * 100}%` }}
          />
        </div>
        <span className="bp-progress-text">{visited.size}/{CLASSIFIER_ITEMS.length} explored</span>
      </div>

      <div className="bp-learn-body">
        <div className="bp-learn-list">
          <ItemGroup title="Receipts" items={receipts} activeId={activeId} visited={visited} onPick={pick} />
          <ItemGroup
            title="Expenditure"
            items={expenditure}
            activeId={activeId}
            visited={visited}
            onPick={pick}
          />
        </div>

        <div className="bp-learn-detail">
          <BalanceSheetExplainer key={`${activeId}-${replayNonce}`} item={active} />
          <div className="bp-learn-actions">
            <button type="button" className="bp-reset" onClick={() => setReplayNonce((n) => n + 1)}>
              ↻ Replay
            </button>
            <button type="button" className="bp-reset" onClick={goNext}>
              Next item →
            </button>
          </div>
        </div>
      </div>

      {allExplored && (
        <div className="bp-learn-done">
          <span>You've been through all {CLASSIFIER_ITEMS.length} — ready to test yourself?</span>
          <button type="button" className="bp-cta" onClick={onSwitchToTest}>
            Test yourself →
          </button>
        </div>
      )}
    </div>
  );
}

function ItemGroup({
  title,
  items,
  activeId,
  visited,
  onPick,
}: {
  title: string;
  items: ClassifierItem[];
  activeId: string;
  visited: Set<string>;
  onPick: (item: ClassifierItem) => void;
}) {
  return (
    <div className="bp-learn-group">
      <div className="bp-learn-group-title">{title}</div>
      <div className="bp-learn-group-items">
        {items.map((item) => {
          const isVisited = visited.has(item.id);
          const isActive = item.id === activeId;
          return (
            <button
              type="button"
              key={item.id}
              className={`bp-learn-item ${isActive ? "bp-learn-item-active" : ""}`}
              onClick={() => onPick(item)}
            >
              <span className="bp-card-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="bp-learn-item-label">{item.label}</span>
              {isVisited && (
                <span
                  className={`bp-learn-dot bp-learn-dot-${item.bucket}`}
                  title={item.bucket === "capital" ? "Capital" : "Revenue"}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
