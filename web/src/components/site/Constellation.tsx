"use client";

import { useEffect, useMemo, useState } from "react";
import { samplePoints } from "@/components/hero/sample";

type Star = { x: number; y: number; m: number };
type Edge = [number, number];

type Frame = { x: number; y: number; w: number; h: number };

/**
 * An atlas plate figure: the real mark drawn as the engraved animal, with the
 * constellation traced over it. Stars are sampled from the mark in the browser;
 * when `labels` are given, well-spread bright stars take those names and the
 * roster becomes the figure's legend; `active` lights one of them.
 */
export function Constellation({
  src,
  stars = 42,
  className = "",
  seed = 3,
  labels = [],
  active = null,
  onHover,
}: {
  src: string;
  stars?: number;
  className?: string;
  seed?: number;
  labels?: string[];
  active?: number | null;
  onHover?: (index: number | null) => void;
}) {
  const [figure, setFigure] = useState<{ stars: Star[]; edges: Edge[]; frame: Frame } | null>(null);

  useEffect(() => {
    let alive = true;
    samplePoints(src, { count: stars, resolution: 160, fit: 0.78, seed })
      .then(({ positions, frame }) => {
        if (!alive) return;
        const pts: Star[] = [];
        for (let i = 0; i < stars; i++) {
          pts.push({ x: 120 + positions[i * 3] * 110, y: 120 - positions[i * 3 + 1] * 110, m: ((i * 7919) % 100) / 100 });
        }
        const edges: Edge[] = [];
        const seen = new Set<string>();
        const add = (a: number, b: number) => {
          const k = a < b ? `${a}-${b}` : `${b}-${a}`;
          if (!seen.has(k)) {
            seen.add(k);
            edges.push([a, b]);
          }
        };
        const d2 = (a: Star, b: Star) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
        for (let i = 0; i < pts.length; i++) {
          let best = -1, bd = Infinity;
          for (let j = 0; j < pts.length; j++) {
            if (i === j) continue;
            const d = d2(pts[i], pts[j]);
            if (d < bd) { bd = d; best = j; }
          }
          if (best >= 0) add(i, best);
        }
        const inTree = new Array(pts.length).fill(false);
        inTree[0] = true;
        for (let n = 1; n < pts.length; n++) {
          let bi = -1, bj = -1, bd = Infinity;
          for (let i = 0; i < pts.length; i++) {
            if (!inTree[i]) continue;
            for (let j = 0; j < pts.length; j++) {
              if (inTree[j]) continue;
              const d = d2(pts[i], pts[j]);
              if (d < bd) { bd = d; bi = i; bj = j; }
            }
          }
          if (bj >= 0) { inTree[bj] = true; add(bi, bj); }
        }
        setFigure({ stars: pts, edges, frame });
      })
      .catch(() => setFigure({ stars: [], edges: [], frame: { x: -1, y: 1, w: 2, h: 2 } }));
    return () => {
      alive = false;
    };
  }, [src, stars, seed]);

  // Named stars: farthest-point picks among the figure so labels spread around it.
  const named = useMemo(() => {
    if (!figure || labels.length === 0 || figure.stars.length === 0) return [] as number[];
    const pts = figure.stars;
    const chosen: number[] = [];
    let first = 0;
    for (let i = 1; i < pts.length; i++) if (pts[i].m > pts[first].m) first = i;
    chosen.push(first);
    while (chosen.length < Math.min(labels.length, pts.length)) {
      let best = -1, bd = -1;
      for (let i = 0; i < pts.length; i++) {
        if (chosen.includes(i)) continue;
        let md = Infinity;
        for (const c of chosen) md = Math.min(md, (pts[i].x - pts[c].x) ** 2 + (pts[i].y - pts[c].y) ** 2);
        if (md > bd) { bd = md; best = i; }
      }
      chosen.push(best);
    }
    return chosen;
  }, [figure, labels.length]);

  // Label placement: each label runs out along its star's radial until it clears the figure,
  // is clamped inside the plate frame, then labels on the same side are separated vertically.
  const placed = useMemo(() => {
    if (!figure) return [] as { ex: number; ey: number; right: boolean }[];
    const outer = figure.stars.reduce((m, q) => Math.max(m, Math.hypot(q.x - 120, q.y - 120)), 0);
    const out = named.map((si, li) => {
      const s = figure.stars[si];
      const dx = s.x - 120, dy = s.y - 120;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      const reach = Math.max(len + 22, outer + 10);
      const textW = (labels[li] ?? "").length * 6.2;
      const right = ux >= 0;
      const minX = -62 + (right ? 0 : textW), maxX = 302 - (right ? textW : 0);
      return {
        ex: Math.min(maxX, Math.max(minX, 120 + ux * reach)),
        ey: Math.min(256, Math.max(-14, 120 + uy * reach)),
        right,
        li,
      };
    });
    // Separate any two labels whose text boxes overlap, whichever side they sit on: push the
    // pair apart along y, the lower one down and the upper one up, a few passes until clear.
    const box = (o: (typeof out)[number]) => {
      const w = (labels[o.li] ?? "").length * 6.2 + 8;
      const x0 = o.right ? o.ex : o.ex - w;
      return { x0, x1: x0 + w, y0: o.ey - 7, y1: o.ey + 7 };
    };
    for (let pass = 0; pass < 4; pass++) {
      let moved = false;
      for (let i = 0; i < out.length; i++) {
        for (let j = i + 1; j < out.length; j++) {
          const a = box(out[i]), b = box(out[j]);
          const overlapX = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
          const overlapY = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
          if (overlapX > 0 && overlapY > 0) {
            const push = overlapY / 2 + 1;
            if (out[i].ey <= out[j].ey) { out[i].ey -= push; out[j].ey += push; }
            else { out[i].ey += push; out[j].ey -= push; }
            moved = true;
          }
        }
      }
      if (!moved) break;
    }
    for (const o of out) o.ey = Math.min(256, Math.max(-14, o.ey));
    return out.sort((a, b) => a.li - b.li);
  }, [figure, named, labels]);

  return (
    <svg viewBox="-70 -24 380 288" className={className} aria-hidden="true" onMouseLeave={() => onHover?.(null)}>
      {figure?.edges.map(([a, b], i) => (
        <line key={i} className="constellation-edge" x1={figure.stars[a].x} y1={figure.stars[a].y} x2={figure.stars[b].x} y2={figure.stars[b].y} />
      ))}
      {figure?.stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={1.2 + s.m * 1.8} fill="currentColor" opacity={0.8 + s.m * 0.2} />
      ))}
      {figure &&
        placed.map((pl, li) => {
          const s = figure.stars[named[li]];
          const lit = active === li;
          return (
            <g
              key={li}
              className="cursor-pointer transition-opacity duration-200"
              opacity={active === null || lit ? 1 : 0.45}
              onMouseEnter={() => onHover?.(li)}
            >
              <line x1={s.x} y1={s.y} x2={pl.ex} y2={pl.ey} stroke="var(--color-lavender)" strokeOpacity={lit ? 0.95 : 0.6} strokeWidth="0.9" />
              <circle cx={s.x} cy={s.y} r={lit ? 7.5 : 6} fill="var(--color-sky)" fillOpacity="0.85" />
              <circle cx={s.x} cy={s.y} r={lit ? 5 : 3.8} fill="var(--color-white)" />
              <circle cx={s.x} cy={s.y} r={lit ? 9.5 : 7.5} fill="none" stroke="var(--color-white)" strokeOpacity={lit ? 0.7 : 0.45} strokeWidth="0.9" />
              <text
                x={pl.ex + (pl.right ? 4 : -4)}
                y={pl.ey + 3}
                textAnchor={pl.right ? "start" : "end"}
                fontSize="11"
                fontStyle="italic"
                fontFamily="var(--font-text)"
                fill={lit ? "var(--color-white)" : "var(--color-lavender)"}
              >
                {labels[li]}
              </text>
            </g>
          );
        })}
    </svg>
  );
}
