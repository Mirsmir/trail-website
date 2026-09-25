/**
 * Topographic contour lines, drawn once on the server. Each page gets its own
 * hill (seeded by the page slug), so the pages feel related but not identical.
 */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export default function Contours({ seed, className }: { seed: string; className?: string }) {
  const rand = rng(seed);
  const cx = 520 + rand() * 160;
  const cy = 250 + rand() * 120;
  const phases = Array.from({ length: 4 }, () => rand() * Math.PI * 2);
  const amps = [0.16, 0.09, 0.05, 0.03].map((a) => a * (0.7 + rand() * 0.6));
  const rings = 15;
  const paths: string[] = [];
  for (let r = 1; r <= rings; r++) {
    const base = 22 + r * r * 2.1 + r * 16;
    let d = '';
    const steps = 96;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      let k = 1;
      for (let h = 0; h < 4; h++) k += amps[h] * (1 + r * 0.04) * Math.sin(a * (h + 2) + phases[h] + r * 0.09 * h);
      const x = cx + Math.cos(a) * base * k * 1.35;
      const y = cy + Math.sin(a) * base * k;
      d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    paths.push(d + 'Z');
  }
  return (
    <svg className={className} viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden>
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={i % 5 === 4 ? 1.4 : 0.8}
          opacity={i % 5 === 4 ? 0.9 : 0.55}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
