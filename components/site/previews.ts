import type { PreviewKind } from "@/lib/tools";

// Minimalist vector previews, one per tool kind. Returns an inline SVG string.
// Neutral tones come from the brand palette; `accent` is the tool's colour.
// Extend by adding a new case keyed off PreviewKind.

const STONE = "#d7d1c1";
const EDGE = "#b3ab97";
const PAPER = "#efeae0";
const INK = "#5c5d52";

const wrap = (inner: string) =>
  `<svg viewBox="0 0 120 84" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" role="img">${inner}</svg>`;

function timeline(a: string): string {
  return wrap(`
    <rect x="20" y="30" width="30" height="13" rx="3" fill="${a}" opacity="0.85"/>
    <rect x="54" y="24" width="24" height="19" rx="3" fill="${a}" opacity="0.55"/>
    <rect x="82" y="33" width="18" height="10" rx="3" fill="${a}" opacity="0.7"/>
    <line x1="14" y1="56" x2="106" y2="56" stroke="${EDGE}" stroke-width="2"/>
    <g stroke="${EDGE}" stroke-width="2">
      <line x1="24" y1="53" x2="24" y2="59"/>
      <line x1="44" y1="53" x2="44" y2="59"/>
      <line x1="64" y1="53" x2="64" y2="59"/>
      <line x1="84" y1="53" x2="84" y2="59"/>
    </g>
    <line x1="64" y1="18" x2="64" y2="62" stroke="${a}" stroke-width="2"/>
    <circle cx="64" cy="18" r="4.5" fill="${PAPER}" stroke="${a}" stroke-width="2.5"/>
  `);
}

function map(a: string): string {
  return wrap(`
    <path d="M60 14 C49 14 41 25 41 39 C41 56 55 69 60 72 C65 69 79 56 79 39 C79 25 71 14 60 14 Z"
      fill="${STONE}" stroke="${EDGE}" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="54" cy="36" r="3.5" fill="${a}"/>
    <circle cx="67" cy="45" r="3.5" fill="${a}"/>
    <circle cx="58" cy="57" r="3.5" fill="${a}"/>
  `);
}

function cards(a: string): string {
  return wrap(`
    <rect x="42" y="26" width="48" height="40" rx="6" fill="${STONE}" stroke="${EDGE}" stroke-width="2"/>
    <rect x="34" y="20" width="48" height="40" rx="6" fill="${PAPER}" stroke="${EDGE}" stroke-width="2"/>
    <rect x="26" y="14" width="48" height="40" rx="6" fill="${PAPER}" stroke="${a}" stroke-width="2"/>
    <line x1="33" y1="26" x2="59" y2="26" stroke="${a}" stroke-width="3" stroke-linecap="round"/>
    <line x1="33" y1="34" x2="67" y2="34" stroke="${EDGE}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="33" y1="42" x2="62" y2="42" stroke="${EDGE}" stroke-width="2.5" stroke-linecap="round"/>
  `);
}

function quiz(a: string): string {
  const row = (y: number, on: boolean, w: number) => `
    <circle cx="34" cy="${y}" r="5" fill="${on ? a : "none"}" stroke="${on ? a : EDGE}" stroke-width="2"/>
    ${on ? `<path d="M31.5 ${y} l2 2 l3.5 -4" stroke="${PAPER}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
    <line x1="46" y1="${y}" x2="${46 + w}" y2="${y}" stroke="${EDGE}" stroke-width="3" stroke-linecap="round"/>`;
  return wrap(`${row(24, false, 50)}${row(42, true, 42)}${row(60, false, 56)}`);
}

function chart(a: string): string {
  const bar = (x: number, h: number, o: number) =>
    `<rect x="${x}" y="${64 - h}" width="13" height="${h}" rx="2" fill="${a}" opacity="${o}"/>`;
  return wrap(`
    <line x1="20" y1="64" x2="104" y2="64" stroke="${EDGE}" stroke-width="2"/>
    ${bar(26, 22, 0.55)}${bar(45, 36, 0.7)}${bar(64, 28, 0.85)}${bar(83, 44, 0.95)}
  `);
}

function doc(a: string): string {
  return wrap(`
    <path d="M38 14 H72 L84 26 V70 H38 Z" fill="${PAPER}" stroke="${EDGE}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M72 14 V26 H84" fill="none" stroke="${EDGE}" stroke-width="2" stroke-linejoin="round"/>
    <rect x="44" y="34" width="34" height="5" rx="2" fill="${a}" opacity="0.85"/>
    <line x1="44" y1="46" x2="78" y2="46" stroke="${EDGE}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="44" y1="54" x2="78" y2="54" stroke="${EDGE}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="44" y1="62" x2="66" y2="62" stroke="${EDGE}" stroke-width="2.5" stroke-linecap="round"/>
  `);
}

function scale(a: string): string {
  return wrap(`
    <line x1="60" y1="20" x2="60" y2="60" stroke="${a}" stroke-width="2.5"/>
    <line x1="38" y1="26" x2="82" y2="26" stroke="${a}" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="60" cy="20" r="3" fill="${a}"/>
    <path d="M30 26 L46 26 L42 40 Q38 43 34 40 Z" fill="${STONE}" stroke="${EDGE}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M74 26 L90 26 L86 38 Q82 41 78 38 Z" fill="${STONE}" stroke="${EDGE}" stroke-width="2" stroke-linejoin="round"/>
    <line x1="38" y1="26" x2="38" y2="33" stroke="${EDGE}" stroke-width="1.5"/>
    <line x1="82" y1="26" x2="82" y2="31" stroke="${EDGE}" stroke-width="1.5"/>
    <path d="M50 60 H70 L66 66 H54 Z" fill="${a}" opacity="0.8"/>
  `);
}

const KINDS: Record<PreviewKind, (a: string) => string> = {
  timeline,
  map,
  cards,
  quiz,
  chart,
  doc,
  scale,
};

export function previewSvg(kind: PreviewKind, accent: string): string {
  return (KINDS[kind] || cards)(accent);
}
