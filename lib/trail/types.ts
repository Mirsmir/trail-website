/** Shared types and crop math for everything that draws the trail. */

export interface View {
  /** Canvas backing size in device pixels. */
  w: number;
  h: number;
  /** >1 pushes in toward the vanishing point (used for the speed rush). */
  zoom: number;
  /** Vanishing point of the footage, 0–1 of the source frame. */
  vp: { x: number; y: number };
}

export interface FrameSource {
  readonly kind: 'footage' | 'placeholder';
  /** Length of the ride in footage seconds. */
  readonly duration: number;
  /** Native resolution, used to decide how big the video window may get. */
  readonly width: number;
  readonly height: number;
  onUpdate: (() => void) | null;
  /** Draw the frame at footage time `t`, cover-cropped to the view. False = nothing drawable yet. */
  draw(ctx: CanvasRenderingContext2D, t: number, view: View): boolean;
  /** Hint for preloading: where the rider is and how fast they're going (playback rate). */
  prepare(t: number, rate: number): void;
  /** 0–1 download progress. */
  progress(): number;
  destroy(): void;
}

export interface Crop {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  /** Where the vanishing point lands in the view, 0–1. */
  vpx: number;
  vpy: number;
}

/**
 * Cover-crop a W×H source into a w×h view, centred on the vanishing point where
 * possible, then zoom *around the vanishing point* so pushing in feels like speed.
 */
export function coverCrop(W: number, H: number, w: number, h: number, zoom: number, vp: { x: number; y: number }): Crop {
  const dstA = w / h;
  const srcA = W / H;
  let sw0: number;
  let sh0: number;
  if (dstA > srcA) {
    sw0 = W;
    sh0 = W / dstA;
  } else {
    sh0 = H;
    sw0 = H * dstA;
  }
  const px = vp.x * W;
  const py = vp.y * H;
  const sx0 = Math.min(W - sw0, Math.max(0, px - sw0 / 2));
  const sy0 = Math.min(H - sh0, Math.max(0, py - sh0 / 2));
  const vpx = (px - sx0) / sw0;
  const vpy = (py - sy0) / sh0;
  const sw = sw0 / zoom;
  const sh = sh0 / zoom;
  return { sx: px - vpx * sw, sy: py - vpy * sh, sw, sh, vpx, vpy };
}
