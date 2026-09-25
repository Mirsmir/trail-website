import type { Checkpoint } from '@/content/checkpoints';

export type Stop =
  | { kind: 'trailhead'; slug: null; at: number; label: string }
  | { kind: 'checkpoint'; slug: string; at: number; label: string; checkpoint: Checkpoint }
  | { kind: 'end'; slug: 'end'; at: number; label: string };

/** Trailhead at the first frame, your checkpoints in between, trail's end at the last frame. */
export function buildStops(cps: Checkpoint[]): Stop[] {
  const n = cps.length;
  const inner: Stop[] = cps
    .map((cp, i) => ({
      kind: 'checkpoint' as const,
      slug: cp.slug,
      at: Math.min(0.98, Math.max(0.02, cp.at ?? (i + 1) / (n + 1))),
      label: cp.label,
      checkpoint: cp,
    }))
    .sort((a, b) => a.at - b.at);
  return [
    { kind: 'trailhead', slug: null, at: 0, label: 'Trailhead' },
    ...inner,
    { kind: 'end', slug: 'end', at: 1, label: "Trail's end" },
  ];
}

export interface MapGeometry {
  width: number;
  height: number;
  /** One SVG path per section of trail, leading into stop i+1. */
  segments: string[];
  stops: { x: number; y: number }[];
  pointAt(frac: number): { x: number; y: number };
}

/**
 * A gently winding line for the trail map. Stops are placed by distance along
 * the line, so the rider marker moves at the same pace as the ride itself.
 */
export function mapGeometry(stops: Stop[], width = 56, height = 480): MapGeometry {
  const N = 240;
  const pad = 10;
  const pts: { x: number; y: number; len: number }[] = [];
  let len = 0;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const y = pad + u * (height - pad * 2);
    const amp = width * 0.34 * (0.55 + 0.45 * Math.sin(u * Math.PI * 1.3 + 0.4));
    const x = width / 2 + amp * Math.sin(u * Math.PI * 3.1 + 0.5);
    if (i > 0) len += Math.hypot(x - pts[i - 1].x, y - pts[i - 1].y);
    pts.push({ x, y, len });
  }
  const total = len;

  const pointAt = (frac: number) => {
    const target = Math.min(1, Math.max(0, frac)) * total;
    let lo = 0;
    let hi = N;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (pts[mid].len < target) lo = mid;
      else hi = mid;
    }
    const a = pts[lo];
    const b = pts[hi];
    const t = b.len === a.len ? 0 : (target - a.len) / (b.len - a.len);
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  };

  const segments: string[] = [];
  for (let s = 0; s < stops.length - 1; s++) {
    const from = stops[s].at * total;
    const to = stops[s + 1].at * total;
    const p0 = pointAt(stops[s].at);
    let d = `M${p0.x.toFixed(2)} ${p0.y.toFixed(2)}`;
    for (const p of pts) if (p.len > from && p.len < to) d += `L${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    const p1 = pointAt(stops[s + 1].at);
    d += `L${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
    segments.push(d);
  }

  return { width, height, segments, stops: stops.map((s) => pointAt(s.at)), pointAt };
}
