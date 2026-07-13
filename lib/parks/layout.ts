// lib/parks/layout.ts
// Pure geometry for the parks map: point clustering + greedy label declutter.
// Everything works in *viewBox units*. Because all sizes are expressed as a
// fraction of the current viewBox width, distances here are zoom-independent
// on screen — no DOM measurement required, which keeps this module pure and
// unit-testable.

export interface LayoutPoint {
  id: string;
  name: string;
  x: number;
  y: number;
  /** Higher wins when deciding cluster representatives and label priority. */
  priority: number;
  kind: "park" | "reserve";
}

export interface Cluster {
  id: string;
  x: number;
  y: number;
  members: LayoutPoint[];
}

/** A cluster of one member renders as a normal marker; >1 renders as a bubble. */
export const isBubble = (c: Cluster): boolean => c.members.length > 1;

const dist2 = (ax: number, ay: number, bx: number, by: number): number => {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
};

/**
 * Single-link agglomerative clustering: merge any points closer than `radius`.
 * Deterministic — input order and the reduction are both stable, so the same
 * input always yields the same clusters (important for stable React keys).
 */
export function clusterPoints(
  points: LayoutPoint[],
  radius: number
): Cluster[] {
  if (points.length === 0) return [];
  const r2 = radius * radius;

  // Union-find over the point indices.
  const parent = points.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[Math.max(ra, rb)] = Math.min(ra, rb);
  };

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (dist2(points[i].x, points[i].y, points[j].x, points[j].y) <= r2) {
        union(i, j);
      }
    }
  }

  const groups = new Map<number, LayoutPoint[]>();
  points.forEach((p, i) => {
    const root = find(i);
    const g = groups.get(root);
    if (g) g.push(p);
    else groups.set(root, [p]);
  });

  return [...groups.values()].map((members) => {
    // Centroid anchors the bubble; a singleton keeps its exact position.
    const x = members.reduce((s, m) => s + m.x, 0) / members.length;
    const y = members.reduce((s, m) => s + m.y, 0) / members.length;
    const id =
      members.length === 1
        ? members[0].id
        : `cl:${[...members]
            .map((m) => m.id)
            .sort()
            .join("|")}`;
    return { id, x, y, members };
  });
}

/* ────────────────────────── label declutter ────────────────────────── */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LabelInput {
  id: string;
  text: string;
  /** Anchor (the marker centre). */
  x: number;
  y: number;
  /** Marker radius — labels must clear this disc. */
  r: number;
  /** This label's own font size — layers render at different sizes, so
      declutter must measure each label with its own, not a shared one. */
  fontSize: number;
  priority: number;
}

export interface LabelPlacement {
  id: string;
  /** Text anchor position. */
  x: number;
  y: number;
  textAnchor: "start" | "middle" | "end";
  /** True when the label sits off its default (above) slot → draw a leader. */
  leader: boolean;
  hidden: boolean;
}

const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/** Approximate text width; 0.52em per char is a good fit for this UI font. */
export const estTextWidth = (text: string, fontSize: number): number =>
  text.length * fontSize * 0.52;

interface Candidate {
  dx: number;
  dy: number;
  anchor: "start" | "middle" | "end";
  leader: boolean;
}

/** 8 slots, best-first: above, below, right, left, then diagonals. */
const CANDIDATES: Candidate[] = [
  { dx: 0, dy: -1, anchor: "middle", leader: false },
  { dx: 0, dy: 1, anchor: "middle", leader: false },
  { dx: 1, dy: 0, anchor: "start", leader: true },
  { dx: -1, dy: 0, anchor: "end", leader: true },
  { dx: 1, dy: -1, anchor: "start", leader: true },
  { dx: -1, dy: -1, anchor: "end", leader: true },
  { dx: 1, dy: 1, anchor: "start", leader: true },
  { dx: -1, dy: 1, anchor: "end", leader: true },
];

/**
 * Greedy placement by descending priority. Each label takes the first candidate
 * slot that collides with neither a placed label nor any marker disc; if every
 * slot collides the label is hidden (the marker + card still expose the name).
 */
export function placeLabels(
  labels: LabelInput[],
  gap: number
): Map<string, LabelPlacement> {
  const out = new Map<string, LabelPlacement>();
  const placed: Rect[] = [];

  // Marker discs are permanent obstacles — labels never sit on a marker.
  const discs: Rect[] = labels.map((l) => ({
    x: l.x - l.r,
    y: l.y - l.r,
    w: 2 * l.r,
    h: 2 * l.r,
  }));

  const ordered = [...labels].sort(
    (a, b) => b.priority - a.priority || a.id.localeCompare(b.id)
  );

  for (const l of ordered) {
    const w = estTextWidth(l.text, l.fontSize);
    const h = l.fontSize;
    let done = false;

    for (const c of CANDIDATES) {
      const cx = l.x + c.dx * (l.r + gap + (c.dx !== 0 ? w / 2 : 0));
      const cy = l.y + c.dy * (l.r + gap + h * 0.5);

      // Convert the anchor point into the text's bounding box.
      const bx =
        c.anchor === "middle" ? cx - w / 2 : c.anchor === "start" ? cx : cx - w;
      const by = cy - h * 0.8;
      const rect: Rect = { x: bx, y: by, w, h };

      const hitsLabel = placed.some((p) => overlaps(p, rect));
      const hitsDisc = discs.some((d) => overlaps(d, rect));
      if (hitsLabel || hitsDisc) continue;

      placed.push(rect);
      out.set(l.id, {
        id: l.id,
        x: cx,
        y: cy,
        textAnchor: c.anchor,
        leader: c.leader,
        hidden: false,
      });
      done = true;
      break;
    }

    if (!done) {
      out.set(l.id, {
        id: l.id,
        x: l.x,
        y: l.y,
        textAnchor: "middle",
        leader: false,
        hidden: true,
      });
    }
  }

  return out;
}