"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ERAS,
  ERA_BY_ID,
  GOVERNORS,
  NAMESAKES,
  SERIES_BY_ID,
  SLOTS,
  durationLabel,
  isSliver,
  tenureLabel,
  tenureYears,
  seriesChain,
  toYear,
  type Era,
  type GGEvent,
  type Governor,
  type SeriesId,
} from "@/lib/governors/governors";
import "./GovernorsGeneral.css";

// Zoomed strip geometry, in "units" (≈ years). A labelled block never drops
// below MIN_BLOCK so its name stays readable; slivers get MIN_SLIVER. Strips
// that don't fit at PX_PER_UNIT scroll sideways instead of truncating names.
const MIN_BLOCK = 5.5;
const MIN_SLIVER = 1.2;
const PX_PER_UNIT = 18;

const DEFAULT_ID = "warren-hastings";
const INDEX_BY_ID = new Map(GOVERNORS.map((g, i) => [g.id, i]));

/** "1888–94": the strip's compact form of tenureLabel. */
const shortTenure = (g: Governor) => {
  const label = tenureLabel(g);
  const [a, b] = label.split("–");
  return b && a.slice(0, 2) === b.slice(0, 2) ? `${a}–${b.slice(2)}` : label;
};

/** lower-case, punctuation-free, accent-free — for forgiving search */
const norm = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

interface Hit {
  g: Governor;
  /** undefined when the governor himself matched by name */
  e?: GGEvent;
}

const SEARCH_INDEX: { g: Governor; e?: GGEvent; text: string }[] = GOVERNORS.flatMap((g) => [
  { g, text: norm(`${g.name} ${g.short}`) },
  ...g.events.map((e) => ({ g, e, text: norm(`${e.label} ${e.under ?? ""}`) })),
]);

function search(q: string): Hit[] {
  const terms = norm(q).split(" ").filter(Boolean);
  if (!terms.length) return [];
  return SEARCH_INDEX.filter((r) => terms.every((t) => r.text.includes(t))).slice(0, 8);
}

const eraStyle = (era: Era) => ({ "--era": era.color }) as React.CSSProperties;

interface StripBlock {
  g: Governor;
  units: number;
  from: number;
}

/** Lays one era out on the zoomed strip and maps decade years onto it. */
function layoutEra(era: Era) {
  const members = GOVERNORS.filter((g) => g.era === era.id);
  let acc = 0;
  const blocks: StripBlock[] = members.map((g) => {
    const units = Math.max(tenureYears(g), isSliver(g) ? MIN_SLIVER : MIN_BLOCK);
    const b = { g, units, from: acc };
    acc += units;
    return b;
  });
  const total = acc;

  const first = toYear(members[0].start);
  const last = toYear(members[members.length - 1].end);
  const ticks: { year: number; pct: number }[] = [];
  for (let y = Math.ceil(first / 10) * 10; y < last; y += 10) {
    const b = blocks.find((b) => y >= toYear(b.g.start) && y < toYear(b.g.end));
    if (!b) continue;
    const t = (y - toYear(b.g.start)) / tenureYears(b.g);
    ticks.push({ year: y, pct: ((b.from + t * b.units) / total) * 100 });
  }
  return { blocks, total, ticks };
}

const ERA_LAYOUTS = Object.fromEntries(ERAS.map((e) => [e.id, layoutEra(e)])) as Record<
  Era["id"],
  ReturnType<typeof layoutEra>
>;

export default function GovernorsGeneral() {
  const [activeId, setActiveId] = useState(DEFAULT_ID);
  const [series, setSeries] = useState<SeriesId | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  /** label of the chip a search just jumped to; pulses briefly */
  const [found, setFound] = useState<string | null>(null);
  const hits = useMemo(() => search(query), [query]);

  const index = INDEX_BY_ID.get(activeId) ?? 0;
  const active = GOVERNORS[index];
  const era = ERA_BY_ID[active.era];
  const prev = GOVERNORS[index - 1];
  const next = GOVERNORS[index + 1];
  const layout = ERA_LAYOUTS[active.era];
  const namesake = NAMESAKES[active.id] ? GOVERNORS[INDEX_BY_ID.get(NAMESAKES[active.id])!] : null;

  // Deep link: /gs1/governors-general#dalhousie
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (INDEX_BY_ID.has(id)) setActiveId(id);
  }, []);

  const select = useCallback((id: string) => {
    setActiveId(id);
    window.history.replaceState(null, "", `#${id}`);
  }, []);

  const pick = (h: Hit) => {
    select(h.g.id);
    setFound(h.e?.label ?? null);
    setQuery("");
    setCursor(0);
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (!found) return;
    const t = setTimeout(() => setFound(null), 2600);
    return () => clearTimeout(t);
  }, [found]);

  // ←/→ steps to the previous / next Governor-General.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      const g = GOVERNORS[index + step];
      if (!step || !g) return;
      e.preventDefault();
      select(g.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, select]);

  // Keep the selected block in view when the zoomed strip scrolls sideways.
  useEffect(() => {
    const strip = stripRef.current;
    const el = strip?.querySelector<HTMLElement>(`[data-id="${activeId}"]`);
    if (!strip || !el) return;
    const left = el.offsetLeft - (strip.clientWidth - el.offsetWidth) / 2;
    strip.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [activeId]);

  const chain = useMemo(() => (series ? seriesChain(series) : []), [series]);

  // The chain strip belongs to the card: close it on moving to a
  // Governor-General with no event in that series.
  useEffect(() => {
    if (series && !active.events.some((e) => e.series?.id === series)) setSeries(null);
  }, [active, series]);

  const toggleSeries = (id: SeriesId) => setSeries((cur) => (cur === id ? null : id));

  return (
    <div className="gg-root">
      {/* ── every tenure, 1773–1947 ── */}
      <div className="gg-track">
        {ERAS.map((e) => {
          const members = GOVERNORS.filter((g) => g.era === e.id);
          const years = toYear(members[members.length - 1].end) - toYear(members[0].start);
          return (
            <div className="gg-track-era" key={e.id} style={{ ...eraStyle(e), flexGrow: years }}>
              <div className="gg-track-bar">
                {members.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className={`gg-track-block${g.id === activeId ? " is-active" : ""}`}
                    style={{ flexGrow: tenureYears(g) }}
                    onClick={() => select(g.id)}
                    title={`${g.name}, ${tenureLabel(g)}`}
                    aria-label={`${g.name}, ${tenureLabel(g)}`}
                    aria-pressed={g.id === activeId}
                  />
                ))}
              </div>
              <button type="button" className="gg-track-label" onClick={() => select(members[0].id)}>
                <span className="gg-track-name" title={`${e.name}, ${e.range}`}>
                  {e.name}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* ── the selected era, zoomed ── */}
      <section className="gg-zoom" style={eraStyle(era)}>
        <header className="gg-zoom-head">
          <h2 className="gg-zoom-title">
            {era.name} <span className="gg-zoom-range">{era.range}</span>
          </h2>
          {/* reverse lookup: event → who */}
          <div className="gg-search">
            <input
              className="gg-search-input"
              type="search"
              value={query}
              placeholder="Who did it? e.g. Vernacular Press Act"
              aria-label="Search events and Governors-General"
              aria-controls="gg-search-results"
              aria-expanded={hits.length > 0}
              onChange={(e) => {
                setQuery(e.target.value);
                setCursor(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setCursor((c) => Math.min(c + 1, hits.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setCursor((c) => Math.max(c - 1, 0));
                } else if (e.key === "Enter" && hits[cursor]) {
                  pick(hits[cursor]);
                } else if (e.key === "Escape") {
                  setQuery("");
                }
              }}
            />
            {query.trim() && (
              <ul className="gg-search-results" id="gg-search-results" role="listbox">
                {hits.length ? (
                  hits.map((h, i) => (
                    <li key={`${h.g.id}-${h.e?.label ?? ""}`} role="option" aria-selected={i === cursor}>
                      <button
                        type="button"
                        className={`gg-search-hit${i === cursor ? " is-cursor" : ""}`}
                        style={eraStyle(ERA_BY_ID[h.g.era])}
                        onMouseEnter={() => setCursor(i)}
                        onClick={() => pick(h)}
                      >
                        <span className="gg-search-what">{h.e ? h.e.label : h.g.name}</span>
                        <span className="gg-search-who">
                          {h.g.short} · {tenureLabel(h.g)}
                        </span>
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="gg-search-none">No match. Try a shorter word.</li>
                )}
              </ul>
            )}
          </div>
        </header>
        <div className="gg-strip-scroll" ref={stripRef}>
          <div className="gg-strip-inner" style={{ minWidth: layout.total * PX_PER_UNIT }}>
            <div className="gg-strip">
              {layout.blocks.map(({ g, units }) => {
                const sliver = isSliver(g);
                return (
                  <button
                    key={g.id}
                    data-id={g.id}
                    type="button"
                    className={`gg-block${sliver ? " is-sliver" : ""}${
                      g.id === activeId ? " is-active" : ""
                    }`}
                    style={{ flexGrow: units }}
                    onClick={() => select(g.id)}
                    title={`${g.name}, ${tenureLabel(g)}`}
                    aria-label={`${g.name}, ${tenureLabel(g)}`}
                    aria-pressed={g.id === activeId}
                  >
                    {!sliver && (
                      <>
                        <span className="gg-block-name">{g.short}</span>
                        <span className="gg-block-years">{shortTenure(g)}</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="gg-axis" aria-hidden="true">
              {layout.ticks.map((t) => (
                <span key={t.year} className="gg-tick" style={{ left: `${t.pct}%` }}>
                  {t.year}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── the card: same eight slots every time ── */}
      <article className="gg-card" style={eraStyle(era)} ref={cardRef}>
        <header className="gg-card-head">
          <div className="gg-card-id">
            <div className="gg-eyebrow">
              {era.name}
            </div>
            <h2 className="gg-card-name">{active.name}</h2>
            <div className="gg-card-meta">
              <span className="gg-card-years">{tenureLabel(active)}</span>
              <span className="gg-card-dur">· {durationLabel(active)}</span>
            </div>
            {active.hook && <p className="gg-card-hook">{active.hook}</p>}
            {namesake && (
              <button type="button" className="gg-namesake" onClick={() => select(namesake.id)}>
                Don&rsquo;t confuse with <strong>{namesake.name}</strong> ({tenureLabel(namesake)}) →
              </button>
            )}
          </div>
          <nav className="gg-succession" aria-label="Neighbouring Governors-General">
            {prev && (
              <button type="button" className="gg-succession-btn" onClick={() => select(prev.id)}>
                <span className="gg-succession-label">Preceded by</span>
                <span className="gg-succession-name">← {prev.short}</span>
              </button>
            )}
            {next && (
              <button type="button" className="gg-succession-btn is-next" onClick={() => select(next.id)}>
                <span className="gg-succession-label">Succeeded by</span>
                <span className="gg-succession-name">{next.short} →</span>
              </button>
            )}
          </nav>
        </header>

        {/* ── a series traced across tenures, opened from a chip ── */}
        {series && chain.length > 0 && (
          <div className="gg-chain" role="region" aria-label={`${SERIES_BY_ID[series].label}, in order`}>
            <span className="gg-chain-title">{SERIES_BY_ID[series].label}</span>
            <ol className="gg-chain-steps">
              {chain.map(({ g, e, year }, i) => (
                <li key={`${g.id}-${e.label}`}>
                  {i > 0 && (
                    <span className="gg-chain-arrow" aria-hidden="true">
                      →
                    </span>
                  )}
                  <button
                    type="button"
                    className={`gg-chain-step${g.id === activeId ? " is-here" : ""}`}
                    onClick={() => select(g.id)}
                    aria-current={g.id === activeId ? "step" : undefined}
                    title={e.label}
                  >
                    <span className="gg-chain-year">{year}</span> {g.short}
                  </button>
                </li>
              ))}
            </ol>
            <button type="button" className="gg-chain-close" onClick={() => setSeries(null)} aria-label="Close">
              ×
            </button>
          </div>
        )}

        <div className="gg-slots">
          {SLOTS.map((slot) => {
            const events = active.events.filter((e) => e.slot === slot.id);
            return (
              <section key={slot.id} className={`gg-slot${events.length ? "" : " is-empty"}`}>
                <header className="gg-slot-head">
                  <h3 className="gg-slot-title">{slot.label}</h3>
                  {events.length > 0 && <span className="gg-slot-count">{events.length}</span>}
                </header>
                {events.length ? (
                  <ul className="gg-chips">
                    {events.map((e) => (
                      <li key={e.label}>
                        <EventChip e={e} tracing={series} found={found === e.label} onSeries={toggleSeries} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="gg-slot-dash">—</span>
                )}
              </section>
            );
          })}
        </div>
      </article>
    </div>
  );
}

function EventChip({
  e,
  tracing,
  found,
  onSeries,
}: {
  e: GGEvent;
  tracing: SeriesId | null;
  found: boolean;
  onSeries: (id: SeriesId) => void;
}) {
  const foundCls = found ? " is-found" : "";
  const under = e.under && <span className="gg-chip-under">under acting G-G {e.under}</span>;
  if (!e.series)
    return (
      <span className={`gg-chip${foundCls}`}>
        <span>
          {e.label}
          {under}
        </span>
      </span>
    );
  const sr = SERIES_BY_ID[e.series.id];
  const total = sr.ordinal ? seriesChain(sr.id).length : 0;
  const on = tracing === sr.id;
  return (
    <button
      type="button"
      className={`gg-chip is-series${on ? " is-traced" : ""}${foundCls}`}
      onClick={() => onSeries(sr.id)}
      aria-expanded={on}
      title={`See all ${sr.label} in order`}
    >
      <span>
        {e.label}
        {total > 0 && (
          <span className="gg-chip-of">
            {" "}
            · {e.series.n} of {total}
          </span>
        )}
      </span>
      <span className="gg-chip-trace" aria-hidden="true">
        ⇢
      </span>
    </button>
  );
}
