import { coverCrop, type FrameSource } from './types';

export interface LookTuning {
  /** 0–1. Frame persistence at high speed (fast-forward). 0 disables. */
  motionBlur: number;
  /** How far the view pushes toward the vanishing point at speed. 0.05 = 5%. */
  speedZoom: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

const AMBIENT_W = 128;
const AMBIENT_H = 72;
const AMBIENT_FILTER = 'blur(5px) saturate(1.3) brightness(0.62)';

/**
 * Draws the footage into the video window, plus a tiny copy into the ambient
 * canvas that CSS blurs and stretches behind everything. The window stays
 * sharp because it is never rendered bigger than the footage allows; the
 * ambient glow keeps the whole screen immersive.
 */
export class StageRenderer {
  /** Vanishing point inside the current view, 0–1. Signs recede toward it. */
  vpx = 0.5;
  vpy = 0.5;

  private ctx: CanvasRenderingContext2D;
  private off: HTMLCanvasElement;
  private offCtx: CanvasRenderingContext2D;
  private ambCtx: CanvasRenderingContext2D;
  private w = 1;
  private h = 1;
  private lastT = Number.NaN;
  private lastZoom = Number.NaN;
  private dirty = true;
  private blurring = false;
  private hasFrame = false;
  private tick = 0;
  private ambientFiltered = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private ambient: HTMLCanvasElement,
    private source: FrameSource,
    private look: LookTuning,
    private vp: { x: number; y: number },
  ) {
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.off = document.createElement('canvas');
    this.offCtx = this.off.getContext('2d', { alpha: false })!;
    ambient.width = AMBIENT_W;
    ambient.height = AMBIENT_H;
    this.ambCtx = ambient.getContext('2d', { alpha: false })!;
    // Blur the glow inside this tiny canvas where it costs almost nothing, instead
    // of a full-screen CSS blur every frame. Browsers without canvas filters
    // (older Safari) fall back to the CSS blur in TrailExperience.module.css.
    this.ambientFiltered = typeof this.ambCtx.filter === 'string';
    if (this.ambientFiltered) ambient.dataset.filtered = 'true';
    source.onUpdate = () => {
      this.dirty = true;
    };
  }

  resize(cssW: number, cssH: number, dpr: number) {
    const crop = coverCrop(this.source.width, this.source.height, cssW, cssH, 1, this.vp);
    // Never render more pixels than the footage actually has; beyond that the
    // browser's scaling looks identical and costs nothing.
    const sourcePxPerCssPx = crop.sw / cssW;
    const cap = this.source.kind === 'footage' ? sourcePxPerCssPx : 2;
    const scale = Math.max(1, Math.min(dpr, cap));
    this.w = Math.max(1, Math.round(cssW * scale));
    this.h = Math.max(1, Math.round(cssH * scale));
    for (const c of [this.canvas, this.off]) {
      c.width = this.w;
      c.height = this.h;
    }
    for (const ctx of [this.ctx, this.offCtx, this.ambCtx]) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }
    this.vpx = crop.vpx;
    this.vpy = crop.vpy;
    this.dirty = true;
    this.hasFrame = false;
  }

  /** Returns true when something was drawn this frame. */
  render(t: number, rate: number, reducedMotion: boolean): boolean {
    const speed = Math.abs(rate);
    const zoom = reducedMotion ? 1 : 1 + this.look.speedZoom * smoothstep(0.2, 2.2, speed);
    const blur = reducedMotion ? 0 : this.look.motionBlur * smoothstep(0.45, 2.0, speed);
    const moved = Math.abs(t - this.lastT) > 1e-6 || Math.abs(zoom - this.lastZoom) > 1e-6;
    this.source.prepare(t, rate);
    if (!moved && !this.dirty && !this.blurring) return false;

    this.dirty = false;
    const drew = this.source.draw(this.offCtx, t, { w: this.w, h: this.h, zoom, vp: this.vp });
    if (!drew) return false; // keep the last good frame on screen

    // Motion blur: let a little of the previous frame persist when flying.
    this.ctx.globalAlpha = this.hasFrame ? 1 - blur : 1;
    this.ctx.drawImage(this.off, 0, 0);
    this.ctx.globalAlpha = 1;
    this.blurring = blur > 0.002;
    this.hasFrame = true;
    this.lastT = t;
    this.lastZoom = zoom;

    if (this.tick++ % 2 === 0 || !moved) {
      if (this.ambientFiltered) this.ambCtx.filter = AMBIENT_FILTER;
      this.ambCtx.drawImage(this.off, 0, 0, AMBIENT_W, AMBIENT_H);
    }
    return true;
  }
}
