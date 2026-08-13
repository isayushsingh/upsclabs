"use client";

// Learn / Test yourself toggle. Learn (BalanceSheetExplainer via LearnPanel)
// is the default and the one that actually teaches the mechanism; the
// drag-drop game (ReceiptsClassifier) is the second-pass check, reached
// deliberately rather than being the first thing a student meets.

import { useState } from "react";
import LearnPanel from "./LearnPanel";
import ReceiptsClassifier from "./ReceiptsClassifier";

export default function ClassifierWidget() {
  const [mode, setMode] = useState<"learn" | "test">("learn");

  return (
    <div className="bp-widget">
      <div className="bp-mode-toggle" role="tablist" aria-label="Learn or test yourself">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "learn"}
          className={`bp-mode-btn ${mode === "learn" ? "bp-mode-btn-active" : ""}`}
          onClick={() => setMode("learn")}
        >
          Learn
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "test"}
          className={`bp-mode-btn ${mode === "test" ? "bp-mode-btn-active" : ""}`}
          onClick={() => setMode("test")}
        >
          Test yourself
        </button>
      </div>

      {mode === "learn" ? (
        <LearnPanel onSwitchToTest={() => setMode("test")} />
      ) : (
        <ReceiptsClassifier />
      )}
    </div>
  );
}
