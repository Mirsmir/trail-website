/**
 * Survey-map linework for the resume page: contour lines that stream diagonally
 * across the page and bunch up around a summit, like a geological survey sheet.
 * Drawn once on the server; purely decorative.
 */

type Pt = [number, number];

const toPath = (pts: Pt[], close = false) =>
  pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('') + (close ? 'Z' : '');

/** The summit the lines wrap around, in viewBox units. */
const KNOT: Pt = [560, 470];

function flowLines() {
  // Lines run along `dir`, stacked along `nrm`, and part around the knot.
  const dir: Pt = [0.5, 0.866];
  const nrm: Pt = [0.866, -0.5];
  const lines: { d: string; dotted: boolean; index: boolean }[] = [];
  for (let i = -8; i <= 8; i++) {
    const off = i * 44 + (i % 2 ? 9 : 0);
    const pts: Pt[] = [];
    for (let s = -700; s <= 700; s += 14) {
      const along = s / 700;
      // Push each line away from the summit, harder the closer it passes.
      const push = Math.sign(off || 1) * 150 * Math.exp(-(along * along) / 0.07) * Math.exp(-Math.abs(off) / 260);
      const wobble = Math.sin(s * 0.009 + i * 1.7) * 14 + Math.sin(s * 0.023 + i) * 5;
      const n = off + push + wobble;
      pts.push([KNOT[0] + dir[0] * s + nrm[0] * n, KNOT[1] + dir[1] * s + nrm[1] * n]);
    }
    lines.push({ d: toPath(pts), dotted: i % 4 === 3 || i === -6, index: i % 4 === 0 });
  }
  return lines;
}

function rings() {
  const out: string[] = [];
  for (let r = 1; r <= 6; r++) {
    const pts: Pt[] = [];
    for (let k = 0; k < 72; k++) {
      const a = (k / 72) * Math.PI * 2;
      const wob = 1 + 0.12 * Math.sin(a * 3 + r * 0.6) + 0.06 * Math.sin(a * 5 - r);
      const rx = (18 + r * 21) * wob;
      const ry = (30 + r * 27) * wob;
      // Tilt the ellipse to follow the flow of the lines.
      const t = -0.52;
      const x = Math.cos(a) * rx;
      const y = Math.sin(a) * ry;
      pts.push([KNOT[0] + x * Math.cos(t) - y * Math.sin(t), KNOT[1] + x * Math.sin(t) + y * Math.cos(t)]);
    }
    out.push(toPath(pts, true));
  }
  return out;
}

const MARKERS: { at: Pt; label: string; drop: number }[] = [
  { at: [740, 128], label: '+980', drop: 60 },
  { at: [470, 210], label: '+860', drop: 90 },
  { at: [350, 560], label: '+720', drop: -70 },
  { at: [850, 780], label: '+540', drop: 110 },
];

export default function SurveyLines({ className }: { className?: string }) {
  const lines = flowLines();
  return (
    <svg className={className} viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <g fill="none" stroke="currentColor" vectorEffect="non-scaling-stroke">
        {lines.map((l, i) => (
          <path
            key={i}
            d={l.d}
            strokeWidth={l.index ? 1.6 : 1}
            strokeDasharray={l.dotted ? '1 6' : undefined}
            strokeLinecap="round"
            opacity={l.dotted ? 0.8 : l.index ? 0.9 : 0.5}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {rings().map((d, i) => (
          <path key={`r${i}`} d={d} strokeWidth={i === 5 ? 1.6 : 1} opacity={0.75} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
      <g fill="currentColor" stroke="currentColor">
        {MARKERS.map((m) => (
          <g key={m.label}>
            <line
              x1={m.at[0]}
              y1={m.at[1]}
              x2={m.at[0]}
              y2={m.at[1] + m.drop}
              strokeDasharray="2 4"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            <rect x={m.at[0] - 4} y={m.at[1] - 4} width={8} height={8} fill="none" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
            <rect x={m.at[0] - 1.5} y={m.at[1] - 1.5} width={3} height={3} stroke="none" />
            <text x={m.at[0] + 10} y={m.at[1] - 10} stroke="none" fontSize={17} fontWeight={600} style={{ fontFamily: 'var(--mono)' }}>
              {m.label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
