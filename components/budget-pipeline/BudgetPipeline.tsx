import "./BudgetPipeline.css";
import ClassifierWidget from "./ClassifierWidget";
import DeficitCalculator from "./DeficitCalculator";

/**
 * Concepts Of Budget — GS3 Economy tool. Two sections shipped: the
 * Receipts/Expenditure Classifier (behind a Learn/Test toggle) and the
 * Deficit Calculator. A Buoyancy vs Elasticity Explorer exists
 * (BuoyancyExplorer.tsx) but was pulled from the page for being too much
 * at once — parked for a later pass rather than deleted. (A Sankey flow
 * section was tried before that and pulled outright for reading as
 * confusing rather than clarifying.)
 */
export default function BudgetPipeline() {
  return (
    <div className="bp-root">
      <div className="ul-main bp-shell">
        <section className="bp-section">
          <h2 className="bp-section-title">1. Revenue vs Capital: Receipts/Expenditure Classifier</h2>
          <p className="bp-section-sub">
            Start in <strong>Learn</strong> — watch what each item actually does to the
            government's balance sheet. Switch to <strong>Test yourself</strong> only once
            that clicks.
          </p>
          <ClassifierWidget />
        </section>

        <section className="bp-section">
          <h2 className="bp-section-title">2. Deficit Calculator</h2>
          <p className="bp-section-sub">
            Six sliders build the same two bars every time — Receipts and Expenditure.
            Switching the deficit definition doesn't redraw them, it re-colors them: dims what
            that definition ignores, hatches the one slice it specifically carves back out, and
            drops a marker showing exactly how far each bar counts. The gap between the two
            markers is the deficit.
          </p>
          <DeficitCalculator />
        </section>

        <section className="bp-section bp-section-next">
          <h2 className="bp-section-title">Coming later</h2>
          <ul className="bp-next-list">
            <li>
              <strong>Buoyancy vs Elasticity Explorer</strong> — parked for now, not dropped:
              a slider for the tax system's underlying elasticity, and a toggle for a
              discretionary tax change that pulls Buoyancy away from it.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
