import { coverCrop, type FrameSource, type View } from './types';

/**
 * A procedural misty pine forest with a winding singletrack, drawn in a virtual
 * 1920×1080 frame. It exists so the scroll physics, checkpoints and signs can be
 * built and tuned before real footage is extracted. Once
 * public/trail/manifest.json exists, this is never used.
 */

const W = 1920;
const H = 1080;
const WORLD_PER_SECOND = 20; // world units travelled per footage second
const FOCAL = 950;
const CAMERA_HEIGHT = 1.25;
const TREE_SPACING = 0.8;
const DRAW_DISTANCE = 95;

const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const trailX = (z: number) => 2.4 * Math.sin(z * 0.042) + 1.2 * Math.sin(z * 0.113 + 1.3);
const mix = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

export class PlaceholderSource implements FrameSource {
  readonly kind = 'placeholder' as const;
  readonly width = W;
  readonly height = H;
  onUpdate: (() => void) | null = null;

  constructor(readonly duration: number) {}

  draw(ctx: CanvasRenderingContext2D, t: number, view: View) {
    const c = coverCrop(W, H, view.w, view.h, view.zoom, view.vp);
    const kx = view.w / c.sw;
    const ky = view.h / c.sh;
    ctx.setTransform(kx, 0, 0, ky, -c.sx * kx, -c.sy * ky);
    ctx.globalAlpha = 1;

    const cx = view.vp.x * W;
    const hy = view.vp.y * H;
    const zc = t * WORLD_PER_SECOND;
    const camX = trailX(zc + 2);

    // Canopy to fog to forest floor.
    const sky = ctx.createLinearGradient(0, 0, 0, hy);
    sky.addColorStop(0, '#070b08');
    sky.addColorStop(0.55, '#1d2a22');
    sky.addColorStop(1, '#46574a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, hy + 1);
    const floor = ctx.createLinearGradient(0, hy, 0, H);
    floor.addColorStop(0, '#3a3a2e');
    floor.addColorStop(0.25, '#2a2219');
    floor.addColorStop(1, '#120e0a');
    ctx.fillStyle = floor;
    ctx.fillRect(0, hy, W, H - hy);

    const glow = ctx.createRadialGradient(cx, hy, 0, cx, hy, H * 0.7);
    glow.addColorStop(0, 'rgba(206, 222, 188, 0.34)');
    glow.addColorStop(1, 'rgba(206, 222, 188, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // The trail: a ribbon projected from far to near.
    const left: [number, number][] = [];
    const right: [number, number][] = [];
    for (let zr = DRAW_DISTANCE; zr > 0.3; zr *= 0.9) {
      const s = FOCAL / zr;
      const x = cx + (trailX(zc + zr) - camX) * s;
      const y = hy + CAMERA_HEIGHT * s;
      const hw = 0.95 * s;
      left.push([x - hw, y]);
      right.push([x + hw, y]);
    }
    ctx.beginPath();
    left.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
    ctx.closePath();
    const dirt = ctx.createLinearGradient(0, hy, 0, H);
    dirt.addColorStop(0, 'rgba(120, 110, 92, 0.2)');
    dirt.addColorStop(0.3, '#4f3c2c');
    dirt.addColorStop(1, '#6d5139');
    ctx.fillStyle = dirt;
    ctx.fill();

    // Roots crossing the trail give strong motion cues near the camera.
    const rootGap = 2.3;
    for (let z = Math.ceil(zc / rootGap) * rootGap; z < zc + 40; z += rootGap) {
      const zr = z - zc;
      if (zr < 0.35) continue;
      const s = FOCAL / zr;
      const x = cx + (trailX(z) - camX) * s;
      const y = hy + CAMERA_HEIGHT * s;
      const hw = 0.95 * s;
      const tilt = (hash(z) - 0.5) * 0.3 * s;
      ctx.strokeStyle = `rgba(28, 20, 14, ${0.55 * (1 - zr / 40)})`;
      ctx.lineWidth = Math.max(1, 0.07 * s);
      ctx.beginPath();
      ctx.moveTo(x - hw * 1.1, y - tilt);
      ctx.quadraticCurveTo(x, y + 0.05 * s, x + hw * 0.95, y + tilt);
      ctx.stroke();
    }

    // Trunks, far to near, fading into fog with distance.
    const first = Math.floor(zc / TREE_SPACING) - 1;
    const last = first + Math.ceil(DRAW_DISTANCE / TREE_SPACING);
    for (let i = last; i >= first; i--) {
      const z = i * TREE_SPACING + hash(i) * TREE_SPACING;
      const zr = z - zc;
      if (zr < 0.3 || zr > DRAW_DISTANCE) continue;
      const side = hash(i * 3.1) > 0.5 ? 1 : -1;
      const lateral = 1.55 + Math.pow(hash(i * 7.7), 1.4) * 10;
      const s = FOCAL / zr;
      const x = cx + (trailX(z) + side * lateral - camX) * s;
      const width = (0.2 + hash(i * 1.9) * 0.42) * s;
      if (x + width < -50 || x - width > W + 50) continue;
      const base = hy + CAMERA_HEIGHT * s * (1.02 + hash(i * 5.3) * 0.12);
      const top = hy - 40 * s;
      const fog = 1 - Math.exp(-zr / 24);
      const tone = hash(i * 2.3) * 0.25;
      ctx.fillStyle = `rgb(${mix(22 + tone * 30, 64, fog)}, ${mix(19 + tone * 24, 79, fog)}, ${mix(15 + tone * 16, 66, fog)})`;
      ctx.fillRect(x - width / 2, top, width, base - top);
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return true;
  }

  prepare() {}

  progress() {
    return 1;
  }

  destroy() {}
}
