import { FrameStore, loadManifest, memoryBudget, type FrameManifest } from './frames';
import { PlaceholderSource } from './placeholder';
import { coverCrop, type FrameSource, type View } from './types';

export type { FrameSource, View } from './types';

class FootageSource implements FrameSource {
  readonly kind = 'footage' as const;
  readonly duration: number;
  readonly width: number;
  readonly height: number;
  onUpdate: (() => void) | null = null;

  constructor(private store: FrameStore) {
    this.duration = (store.count - 1) / store.fps;
    this.width = store.width;
    this.height = store.height;
    store.onUpdate = () => this.onUpdate?.();
  }

  draw(ctx: CanvasRenderingContext2D, t: number, view: View) {
    const s = this.store;
    const f = Math.min(s.count - 1, Math.max(0, t * s.fps));
    const i0 = Math.floor(f);
    const i1 = Math.min(i0 + 1, s.count - 1);
    const mix = f - i0;
    const c = coverCrop(s.width, s.height, view.w, view.h, view.zoom, view.vp);

    const a = s.get(i0);
    const b = s.get(i1);
    ctx.globalCompositeOperation = 'source-over';
    if (a && (b || mix < 0.02)) {
      // Cross-fade neighbouring frames so slow motion stays continuous.
      ctx.globalAlpha = 1;
      ctx.drawImage(a, c.sx, c.sy, c.sw, c.sh, 0, 0, view.w, view.h);
      if (b && mix > 0.02) {
        ctx.globalAlpha = mix;
        ctx.drawImage(b, c.sx, c.sy, c.sw, c.sh, 0, 0, view.w, view.h);
        ctx.globalAlpha = 1;
      }
      return true;
    }
    // Exact frames not decoded yet (e.g. mid fast-forward): use the closest one.
    const near = s.nearest(Math.round(f), 6);
    if (!near) return false;
    ctx.globalAlpha = 1;
    ctx.drawImage(near, c.sx, c.sy, c.sw, c.sh, 0, 0, view.w, view.h);
    return true;
  }

  prepare(t: number, rate: number) {
    this.store.setFocus(t * this.store.fps, rate * this.store.fps);
  }

  progress() {
    return this.store.progress();
  }

  destroy() {
    this.store.destroy();
  }
}

/**
 * Load the footage if `public/trail/manifest.json` exists, otherwise fall back to
 * a procedural placeholder trail so the whole experience works before you have
 * frames.
 */
export async function createSource(opts: {
  manifestUrl: string;
  startAt: number;
  placeholderDuration: number;
  signal?: AbortSignal;
}): Promise<FrameSource> {
  const manifest: FrameManifest | null = await loadManifest(opts.manifestUrl, opts.signal);
  if (!manifest) return new PlaceholderSource(opts.placeholderDuration);
  const store = new FrameStore(manifest, opts.manifestUrl, memoryBudget());
  const source = new FootageSource(store);
  const startFrame = Math.round(opts.startAt * (manifest.frameCount - 1));
  await store.start(startFrame);
  return source;
}
