// lib/geo/useMapViewport.ts
// Pan/zoom/pinch viewport for a single, national-scale SVG map — no
// per-state drill-down (that's specific to the parks tool). Ported and
// trimmed from components/national-parks/NationalParksMap.tsx's viewport
// machinery so Rivers (and later Mountains) can reuse it without depending
// on that component.

import { useCallback, useEffect, useRef, useState } from "react";

export type VB = [number, number, number, number];

const ZOOM_MS = 620;
const MIN_ZOOM_FRAC = 0.16; // max zoom-in, relative to the full viewBox
const easeInOut = (t: number): number =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

export function useMapViewport(fullVB: VB, landingVB: VB, aspect: number) {
  const [vb, setVb] = useState<VB>(landingVB);
  const vbRef = useRef<VB>(landingVB);
  const rafRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const reduceMotionRef = useRef(false);
  const movedRef = useRef(false); // drag exceeded threshold
  const suppressClickRef = useRef(false); // ignore click that ends a drag
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const panBaseRef = useRef<{ x: number; y: number; vb: VB } | null>(null);
  const pinchBaseRef = useRef<{ d: number; mx: number; my: number; vb: VB } | null>(
    null
  );

  const animateTo = useCallback((to: VB, dur = ZOOM_MS) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (dur <= 0 || reduceMotionRef.current) {
      vbRef.current = to;
      setVb(to);
      return;
    }
    const from = vbRef.current;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = easeInOut(p);
      const cur: VB = [
        from[0] + (to[0] - from[0]) * e,
        from[1] + (to[1] - from[1]) * e,
        from[2] + (to[2] - from[2]) * e,
        from[3] + (to[3] - from[3]) * e,
      ];
      vbRef.current = cur;
      setVb(cur);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotionRef.current = mq.matches;
    const h = () => (reduceMotionRef.current = mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  const clampWidth = useCallback(
    (w: number): number => {
      const minVW = fullVB[2] * MIN_ZOOM_FRAC;
      const maxVW = fullVB[2];
      return Math.min(maxVW, Math.max(minVW, w));
    },
    [fullVB]
  );

  const clampVB = useCallback(
    (v: VB): VB => {
      const w = clampWidth(v[2]);
      const h = w / aspect;
      const [bx, by, bw, bh] = fullVB;
      const maxX = bx + bw - w;
      const maxY = by + bh - h;
      const x = Math.min(Math.max(v[0], bx), Math.max(bx, maxX));
      const y = Math.min(Math.max(v[1], by), Math.max(by, maxY));
      return [x, y, w, h];
    },
    [fullVB, aspect, clampWidth]
  );

  const pxToVb = useCallback((clientX: number, clientY: number): [number, number] => {
    const el = svgRef.current;
    const v = vbRef.current;
    if (!el) return [v[0] + v[2] / 2, v[1] + v[3] / 2];
    const r = el.getBoundingClientRect();
    return [
      v[0] + ((clientX - r.left) / r.width) * v[2],
      v[1] + ((clientY - r.top) / r.height) * v[3],
    ];
  }, []);

  const zoomAround = useCallback(
    (cx: number, cy: number, factor = 0.5, dur = 360) => {
      const [x, y, w] = vbRef.current;
      const h = vbRef.current[3];
      const fx = (cx - x) / w;
      const fy = (cy - y) / h;
      const nw = w * factor;
      const nh = nw / aspect;
      animateTo(clampVB([cx - fx * nw, cy - fy * nh, nw, nh]), dur);
    },
    [animateTo, clampVB, aspect]
  );

  const zoomButtons = useCallback(
    (factor: number) => {
      const [x, y, w, h] = vbRef.current;
      zoomAround(x + w / 2, y + h / 2, factor, 260);
    },
    [zoomAround]
  );

  const reset = useCallback(() => animateTo(landingVB), [animateTo, landingVB]);

  /** Animate to an arbitrary viewBox (e.g. a river system's bounding box),
      clamped the same as pan/zoom gestures. */
  const goTo = useCallback(
    (to: VB, dur = ZOOM_MS) => animateTo(clampVB(to), dur),
    [animateTo, clampVB]
  );

  const onStagePointerDown = useCallback((e: React.PointerEvent) => {
    suppressClickRef.current = false;
    movedRef.current = false;
    if (e.button !== 0) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 1) {
      panBaseRef.current = { x: e.clientX, y: e.clientY, vb: vbRef.current };
      pinchBaseRef.current = null;
    } else if (pointersRef.current.size === 2) {
      const pts = [...pointersRef.current.values()];
      pinchBaseRef.current = {
        d: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
        mx: (pts[0].x + pts[1].x) / 2,
        my: (pts[0].y + pts[1].y) / 2,
        vb: vbRef.current,
      };
      panBaseRef.current = null;
    }
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!pointersRef.current.has(e.pointerId)) return;
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const el = svgRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();

      if (pointersRef.current.size >= 2 && pinchBaseRef.current) {
        const pts = [...pointersRef.current.values()];
        const nd = Math.max(1, Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y));
        const base = pinchBaseRef.current;
        const factor = base.d / nd;
        const mx = (base.mx - r.left) / r.width;
        const my = (base.my - r.top) / r.height;
        const nvw = clampWidth(base.vb[2] * factor);
        const nvh = nvw / aspect;
        const px = base.vb[0] + mx * base.vb[2];
        const py = base.vb[1] + my * base.vb[3];
        const nvb = clampVB([px - mx * nvw, py - my * nvh, nvw, nvh]);
        vbRef.current = nvb;
        setVb(nvb);
        movedRef.current = true;
        return;
      }

      if (pointersRef.current.size === 1 && panBaseRef.current) {
        const dx = e.clientX - panBaseRef.current.x;
        const dy = e.clientY - panBaseRef.current.y;
        if (!movedRef.current && Math.hypot(dx, dy) > 8) movedRef.current = true;
        if (!movedRef.current) return;
        const [x, y, w, h] = panBaseRef.current.vb;
        const nvb = clampVB([x - (dx / r.width) * w, y - (dy / r.height) * h, w, h]);
        vbRef.current = nvb;
        setVb(nvb);
      }
    };

    const onUp = (e: PointerEvent) => {
      pointersRef.current.delete(e.pointerId);
      if (pointersRef.current.size < 2) pinchBaseRef.current = null;
      if (pointersRef.current.size === 1) {
        const p = [...pointersRef.current.values()][0];
        panBaseRef.current = { x: p.x, y: p.y, vb: vbRef.current };
      } else if (pointersRef.current.size === 0) {
        panBaseRef.current = null;
        if (movedRef.current) suppressClickRef.current = true;
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [clampVB, clampWidth, aspect]);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const [cx, cy] = pxToVb(e.clientX, e.clientY);
      const mag = Math.sqrt(Math.min(Math.abs(e.deltaY), 100) / 100);
      const factor = e.deltaY > 0 ? 1 + 0.16 * mag : 1 - 0.14 * mag;
      zoomAround(cx, cy, factor, 0);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [pxToVb, zoomAround]);

  return {
    vb,
    svgRef,
    suppressClickRef,
    onStagePointerDown,
    zoomButtons,
    reset,
    goTo,
  };
}
