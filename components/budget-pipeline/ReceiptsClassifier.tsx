"use client";

// The Receipts/Expenditure Classifier — a 2×2 sorting game (Revenue vs
// Capital × Receipt vs Expenditure). This is the fix for the "where does
// disinvestment go?" confusion: the axis nobody names out loud (Receipt vs
// Expenditure) is drawn as a real second axis here, not folded silently
// into the first one.
//
// Two ways to place a card, both routed through the same resolve() so the
// feedback logic never forks:
//  - real pointer drag (mouse or touch — Pointer Events unify both) with a
//    fixed-position ghost that tracks the cursor while held
//  - tap-to-select then tap-a-zone, for anyone who finds dragging fiddly
//
// Correct/wrong feedback is deliberately loud: a green scale-pop + zone glow
// on a hit, a red shake + snap-back + one-line "why" on a miss — see the
// bp-pop-correct / bp-shake keyframes in ReceiptsClassifier.css.

import { useEffect, useRef, useState } from "react";
import { CLASSIFIER_ITEMS, type ClassifierItem } from "@/lib/budget/classifier-data";

type ZoneId = `${ClassifierItem["bucket"]}-${ClassifierItem["kind"]}`;

const ZONES: { id: ZoneId; bucket: ClassifierItem["bucket"]; kind: ClassifierItem["kind"]; title: string }[] = [
  { id: "revenue-receipt", bucket: "revenue", kind: "receipt", title: "Revenue Receipts" },
  { id: "capital-receipt", bucket: "capital", kind: "receipt", title: "Capital Receipts" },
  { id: "revenue-expenditure", bucket: "revenue", kind: "expenditure", title: "Revenue Expenditure" },
  { id: "capital-expenditure", bucket: "capital", kind: "expenditure", title: "Capital Expenditure" },
];

const zoneIdOf = (item: ClassifierItem): ZoneId => `${item.bucket}-${item.kind}`;

// Drag never starts inside this radius — under it, a pointerup is read as a
// tap (select), not a drop. Keeps small, jittery presses from launching a
// drag by accident, on trackpad or touch alike.
const DRAG_THRESHOLD = 6;

type Phase = "idle" | "dragging" | "resolving-correct" | "resolving-wrong" | "returning";

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export default function ReceiptsClassifier() {
  const [placements, setPlacements] = useState<Record<string, ZoneId>>({});
  const [mistakes, setMistakes] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);
  const [zoneFlash, setZoneFlash] = useState<{ id: ZoneId; ok: boolean } | null>(null);
  const [tapFeedback, setTapFeedback] = useState<{ id: string; ok: boolean } | null>(null);

  const [dragId, setDragId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [pos, setPos] = useState<Rect>({ left: 0, top: 0, width: 0, height: 0 });

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragState = useRef<{
    id: string;
    pointerId: number;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    origin: Rect;
    started: boolean;
  } | null>(null);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const deck = CLASSIFIER_ITEMS.filter((it) => !placements[it.id]);
  const total = CLASSIFIER_ITEMS.length;
  const done = total - deck.length;

  const flashZone = (id: ZoneId, ok: boolean) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setZoneFlash({ id, ok });
    flashTimer.current = setTimeout(() => setZoneFlash(null), 600);
  };

  const showNote = (text: string, ok: boolean) => {
    if (noteTimer.current) clearTimeout(noteTimer.current);
    setNote({ text, ok });
    noteTimer.current = setTimeout(() => setNote(null), 3200);
  };

  const resolve = (item: ClassifierItem, targetZone: ZoneId, viaDrag: boolean) => {
    const correctZone = zoneIdOf(item);
    const ok = targetZone === correctZone;
    flashZone(targetZone, ok);
    showNote(item.why, ok);
    if (!ok) setMistakes((m) => m + 1);

    if (viaDrag) {
      setPhase(ok ? "resolving-correct" : "resolving-wrong");
      if (ok) {
        window.setTimeout(() => {
          setPlacements((p) => ({ ...p, [item.id]: correctZone }));
          setDragId(null);
          setPhase("idle");
        }, 300);
      } else {
        const origin = dragState.current?.origin;
        if (origin) setPos(origin);
        window.setTimeout(() => {
          setDragId(null);
          setPhase("idle");
        }, 520);
      }
    } else {
      // Tap path: no fixed overlay to move, so the feedback animation plays
      // directly on the card's own deck slot via tapFeedback (not the
      // dragId/phase/pos trio, which describes the drag ghost's position
      // and would be stale here).
      setSelectedId(null);
      setTapFeedback({ id: item.id, ok });
      window.setTimeout(
        () => {
          if (ok) setPlacements((p) => ({ ...p, [item.id]: correctZone }));
          setTapFeedback(null);
        },
        ok ? 300 : 520,
      );
    }
  };

  // ── pointer drag plumbing ──────────────────────────────────────────
  // dragState lives in a ref (not state) so pointermove doesn't cause a
  // render per pixel; listeners are attached imperatively on pointerdown
  // rather than via a useEffect keyed on the ref, since writing a ref
  // never itself triggers a re-render/effect run.
  useEffect(() => {
    return () => {
      if (noteTimer.current) clearTimeout(noteTimer.current);
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  const onCardPointerDown = (item: ClassifierItem) => (e: React.PointerEvent) => {
    if (e.button !== undefined && e.button !== 0) return;
    const el = cardRefs.current[item.id];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragState.current = {
      id: item.id,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      origin: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      started: false,
    };
    setPos({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
    attachListeners();
  };

  const attachListeners = () => {
    const onMove = (e: PointerEvent) => {
      const d = dragState.current;
      if (!d || d.pointerId !== e.pointerId) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (!d.started && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        d.started = true;
        setDragId(d.id);
        setPhase("dragging");
      }
      if (d.started) {
        setPos({
          left: e.clientX - d.offsetX,
          top: e.clientY - d.offsetY,
          width: d.origin.width,
          height: d.origin.height,
        });
      }
    };
    const onUp = (e: PointerEvent) => {
      const d = dragState.current;
      if (!d || d.pointerId !== e.pointerId) return;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      dragState.current = null;

      if (!d.started) {
        setSelectedId((cur) => (cur === d.id ? null : d.id));
        return;
      }
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const zoneEl = el?.closest<HTMLElement>("[data-zone]");
      const zoneId = zoneEl?.dataset.zone as ZoneId | undefined;
      const item = CLASSIFIER_ITEMS.find((it) => it.id === d.id)!;

      if (zoneId) {
        resolve(item, zoneId, true);
      } else {
        setPhase("returning");
        setPos(d.origin);
        window.setTimeout(() => {
          setDragId(null);
          setPhase("idle");
        }, 260);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const onZoneClick = (zoneId: ZoneId) => {
    if (!selectedId) return;
    const item = CLASSIFIER_ITEMS.find((it) => it.id === selectedId);
    if (!item) return;
    resolve(item, zoneId, false);
  };

  const dragItem = dragId ? CLASSIFIER_ITEMS.find((it) => it.id === dragId) : null;
  const complete = done === total;

  return (
    <div className="bp-classifier">
      <div className="bp-classifier-head">
        <div className="bp-rule">
          <span className="bp-rule-label">The one test:</span> does it{" "}
          <strong>create a liability</strong> or <strong>reduce an asset</strong>? Yes →
          Capital. No → Revenue. Separately — is money coming in, or going out? That's the
          Receipt / Expenditure axis. Every item below sits on both at once.
        </div>
        <div className="bp-progress" role="status">
          <div className="bp-progress-bar">
            <div className="bp-progress-fill" style={{ width: `${(done / total) * 100}%` }} />
          </div>
          <span className="bp-progress-text">
            {done}/{total} placed · {mistakes} mistake{mistakes === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className={`bp-note ${note ? (note.ok ? "bp-note-ok" : "bp-note-bad") : ""}`} role="status">
        {note ? (
          <>
            <span className="bp-note-mark">{note.ok ? "✓" : "✕"}</span> {note.text}
          </>
        ) : (
          "Drag a card into a bucket (or tap a card, then tap a bucket)."
        )}
      </div>

      <div className="bp-grid">
        <div />
        <div className="bp-col-label">Receipts</div>
        <div className="bp-col-label">Expenditure</div>

        <div className="bp-row-label">Revenue</div>
        <Zone id="revenue-receipt" onClick={onZoneClick} flash={zoneFlash} items={CLASSIFIER_ITEMS} placements={placements} title="Revenue Receipts" />
        <Zone id="revenue-expenditure" onClick={onZoneClick} flash={zoneFlash} items={CLASSIFIER_ITEMS} placements={placements} title="Revenue Expenditure" />

        <div className="bp-row-label">Capital</div>
        <Zone id="capital-receipt" onClick={onZoneClick} flash={zoneFlash} items={CLASSIFIER_ITEMS} placements={placements} title="Capital Receipts" />
        <Zone id="capital-expenditure" onClick={onZoneClick} flash={zoneFlash} items={CLASSIFIER_ITEMS} placements={placements} title="Capital Expenditure" />
      </div>

      <div className="bp-deck-wrap">
        <div className="bp-deck-label">
          {complete ? "All sorted! Reset to try again." : "Cards to sort"}
        </div>
        <div className="bp-deck">
          {deck.map((item) => (
            <div
              key={item.id}
              ref={(el) => {
                cardRefs.current[item.id] = el;
              }}
              className={[
                "bp-card",
                selectedId === item.id ? "bp-card-selected" : "",
                dragId === item.id ? "bp-card-ghost" : "",
                tapFeedback?.id === item.id ? (tapFeedback.ok ? "bp-pop-correct" : "bp-shake") : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onPointerDown={onCardPointerDown(item)}
              role="button"
              tabIndex={0}
              aria-pressed={selectedId === item.id}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedId((cur) => (cur === item.id ? null : item.id));
                }
              }}
            >
              <span className="bp-card-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="bp-card-label">{item.label}</span>
            </div>
          ))}
          {complete && <div className="bp-deck-empty">🎉 Every item is where it belongs.</div>}
        </div>
        {mistakes > 0 || done > 0 ? (
          <button
            type="button"
            className="bp-reset"
            onClick={() => {
              setPlacements({});
              setMistakes(0);
              setSelectedId(null);
              setNote(null);
            }}
          >
            Reset
          </button>
        ) : null}
      </div>

      {dragItem && phase !== "idle" && (
        <div
          className={[
            "bp-card",
            "bp-card-drag",
            phase === "dragging" ? "bp-drag-live" : "",
            phase === "resolving-correct" ? "bp-pop-correct" : "",
            phase === "resolving-wrong" ? "bp-shake bp-returning" : "",
            phase === "returning" ? "bp-returning" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{ left: pos.left, top: pos.top, width: pos.width, height: pos.height }}
          aria-hidden="true"
        >
          <span className="bp-card-icon">{dragItem.icon}</span>
          <span className="bp-card-label">{dragItem.label}</span>
        </div>
      )}
    </div>
  );
}

function Zone({
  id,
  title,
  items,
  placements,
  flash,
  onClick,
}: {
  id: ZoneId;
  title: string;
  items: ClassifierItem[];
  placements: Record<string, ZoneId>;
  flash: { id: ZoneId; ok: boolean } | null;
  onClick: (id: ZoneId) => void;
}) {
  const placed = items.filter((it) => placements[it.id] === id);
  const flashClass = flash?.id === id ? (flash.ok ? "bp-zone-flash-ok" : "bp-zone-flash-bad") : "";
  return (
    <div className={`bp-zone ${flashClass}`} data-zone={id} onClick={() => onClick(id)}>
      <div className="bp-zone-title">{title}</div>
      <div className="bp-zone-items">
        {placed.map((it) => (
          <div className="bp-zone-chip" key={it.id}>
            <span aria-hidden="true">{it.icon}</span> {it.label}
          </div>
        ))}
      </div>
    </div>
  );
}
