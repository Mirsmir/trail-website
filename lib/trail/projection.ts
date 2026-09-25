import { smoothstep } from './renderer';

export interface SignPose {
  visible: boolean;
  x: number;
  y: number;
  scale: number;
  opacity: number;
  blur: number;
  rotate: number;
}

const HIDDEN: SignPose = { visible: false, x: 0, y: 0, scale: 1, opacity: 0, blur: 0, rotate: 0 };

/**
 * Where a sign sits on screen given how far ahead of the rider it is.
 *
 * `d` is distance in "approach units": 1 = the sign is just emerging from the
 * fog, 0 = you've stopped at it, negative = you're riding past it.
 *
 * Signs are projected with real perspective toward the footage's vanishing
 * point, so they grow and slide outward as you approach and pass them, the way
 * a trail marker beside the path would.
 */
export function signPose(
  d: number,
  anchor: { x: number; y: number },
  vp: { x: number; y: number },
  depth: number,
  side: number,
): SignPose {
  if (d > 1.02 || d < -0.42) return HIDDEN;
  const z = d * depth;
  const scale = 1 / (1 + z);
  const x = vp.x + (anchor.x - vp.x) * scale;
  const y = vp.y + (anchor.y - vp.y) * scale;
  const fadeIn = 1 - smoothstep(0.5, 1.0, d);
  const fadeOut = smoothstep(-0.36, -0.05, d);
  const opacity = fadeIn * fadeOut;
  // Depth of field: soft in the distance, softer still as it rushes past.
  const blur = Math.max(0, d - 0.22) * 5 + Math.max(0, -d - 0.04) * 14;
  // Signs angle toward the trail, and turn edge-on as you pass them.
  const rotate = side * (9 + 55 * smoothstep(0, 0.36, -d));
  return { visible: opacity > 0.003, x, y, scale, opacity, blur, rotate };
}
