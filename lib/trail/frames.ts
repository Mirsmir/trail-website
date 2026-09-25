/**
 * Footage as an image sequence.
 *
 * Why not a <video> tag? Seeking a video element on every animation frame is
 * jittery in most browsers, can't blend between frames, and stalls on keyframes.
 * An image sequence drawn to <canvas> gives frame-exact scrubbing, cross-fading
 * between neighbouring frames (buttery slow motion), and motion blur.
 *
 * Memory: a decoded 1920×1080 frame is ~8 MB, so we never decode them all.
 * Compressed files (≈100–250 KB each) are all kept in memory as Blobs; only a
 * window of frames around the rider is decoded into ImageBitmaps, and frames
 * far from the rider are released.
 * i genuinely dont know wt happened to my git thing omg help i don tknow if i like claude very much sorry claude you
 * are a bit scary just don't scare me hahahahahha
 * WHY R CAN I NOT SEE MY CHANGES/??????/ WHY CANT I PUSH??? 
 */

export interface FrameManifest {
  version: 1;
  frameCount: number;
  fps: number;
  width: number;
  height: number;
  /** Relative to the manifest, with `{index}` replaced by the zero-padded frame number. */
  pattern: string;
  pad: number;
  /** Changes every time frames are re-extracted; used to bust caches. */
  rev?: string;
}

export async function loadManifest(url: string, signal?: AbortSignal): Promise<FrameManifest | null> {
  try {
    const res = await fetch(url, { cache: 'no-cache', signal });
    if (!res.ok) return null;
    const m = (await res.json()) as FrameManifest;
    if (!m || !(m.frameCount > 1) || !(m.fps > 0) || !m.pattern) return null;
    return m;
  } catch {
    return null;
  }
}

/** Load order: a block around the start frame, then coarse-to-fine across the whole clip. */
function loadOrder(count: number, first: number): number[] {
  const seen = new Uint8Array(count);
  const order: number[] = [];
  const add = (i: number) => {
    if (i >= 0 && i < count && !seen[i]) {
      seen[i] = 1;
      order.push(i);
    }
  };
  add(first);
  for (let r = 1; r <= 10; r++) {
    add(first + r);
    add(first - r);
  }
  for (let stride = 64; stride >= 1; stride >>= 1) {
    for (let i = 0; i < count; i += stride) add(i);
  }
  add(count - 1);
  return order;
}

export class FrameStore {
  readonly count: number;
  readonly width: number;
  readonly height: number;
  readonly fps: number;
  /** Called whenever a newly decoded frame could improve what's on screen. */
  onUpdate: (() => void) | null = null;

  private urls: string[];
  private blobs: (Blob | undefined)[];
  private bitmaps = new Map<number, ImageBitmap>();
  private decoding = new Set<number>();
  private queue: number[] = [];
  private inflight = 0;
  private loaded = 0;
  private maxBitmaps: number;
  private focus = 0;
  private dir = 1;
  private stride = 1;
  private abort = new AbortController();
  private destroyed = false;
  private firstReady: Promise<void>;
  private resolveFirst!: () => void;

  constructor(manifest: FrameManifest, manifestUrl: string, memoryBudgetBytes: number) {
    this.count = manifest.frameCount;
    this.width = manifest.width;
    this.height = manifest.height;
    this.fps = manifest.fps;
    const base = new URL(manifestUrl, window.location.href);
    const rev = manifest.rev ? `?v=${encodeURIComponent(manifest.rev)}` : '';
    this.urls = Array.from({ length: this.count }, (_, i) => {
      const file = manifest.pattern.replace('{index}', String(i).padStart(manifest.pad ?? 4, '0'));
      return new URL(file, base).toString() + rev;
    });
    this.blobs = new Array(this.count);
    const frameBytes = Math.max(1, this.width * this.height * 4);
    this.maxBitmaps = Math.max(10, Math.min(120, Math.floor(memoryBudgetBytes / frameBytes)));
    this.firstReady = new Promise((r) => (this.resolveFirst = r));
  }

  /** Begin downloading. Resolves once the first frame is decoded and drawable. */
  start(firstFrame: number): Promise<void> {
    this.focus = firstFrame;
    this.queue = loadOrder(this.count, firstFrame);
    for (let i = 0; i < 6; i++) this.pumpFetch();
    return this.firstReady;
  }

  /** 0–1 share of frames downloaded. */
  progress() {
    return this.loaded / this.count;
  }

  /** Tell the store where the rider is and how fast (frames/sec) so it can decode ahead. */
  setFocus(frame: number, framesPerSecond: number) {
    this.focus = frame;
    if (Math.abs(framesPerSecond) > 0.5) this.dir = Math.sign(framesPerSecond);
    // When flying past, decoding every frame is wasted work; skip some.
    this.stride = Math.max(1, Math.min(4, Math.floor(Math.abs(framesPerSecond) / 90) + 1));
    this.pumpDecode();
  }

  get(i: number): ImageBitmap | undefined {
    return this.bitmaps.get(i);
  }

  /** Closest decoded frame within `radius` frames of `i`. */
  nearest(i: number, radius: number): ImageBitmap | undefined {
    for (let r = 0; r <= radius; r++) {
      const a = this.bitmaps.get(i + r);
      if (a) return a;
      const b = this.bitmaps.get(i - r);
      if (b) return b;
    }
    return undefined;
  }

  destroy() {
    this.destroyed = true;
    this.abort.abort();
    this.bitmaps.forEach((b) => b.close());
    this.bitmaps.clear();
    this.blobs = [];
    this.onUpdate = null;
  }

  private pumpFetch() {
    if (this.destroyed) return;
    const i = this.queue.shift();
    if (i === undefined) return;
    this.inflight++;
    fetch(this.urls[i], { signal: this.abort.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Frame ${i} failed to load (${res.status})`);
        return res.blob();
      })
      .then((blob) => {
        if (this.destroyed) return;
        this.blobs[i] = blob;
        this.loaded++;
        this.pumpDecode();
      })
      .catch((err) => {
        if (!this.destroyed && err?.name !== 'AbortError') console.warn(err);
      })
      .finally(() => {
        this.inflight--;
        this.pumpFetch();
      });
  }

  /** Frames we want decoded right now, most important first. */
  private wanted(): number[] {
    const ahead = Math.min(this.maxBitmaps - 4, 18 * this.stride);
    const behind = 4 * this.stride;
    const center = Math.round(this.focus);
    const out: number[] = [];
    const push = (i: number) => {
      if (i >= 0 && i < this.count) out.push(i);
    };
    push(center);
    push(center + this.dir);
    for (let k = 1; k * this.stride <= Math.max(ahead, behind); k++) {
      if (k * this.stride <= ahead) push(center + this.dir * k * this.stride);
      if (k * this.stride <= behind) push(center - this.dir * k * this.stride);
    }
    return out;
  }

  private pumpDecode() {
    if (this.destroyed) return;
    const maxParallel = 3;
    if (this.decoding.size >= maxParallel) return;
    for (const i of this.wanted()) {
      if (this.decoding.size >= maxParallel) break;
      if (this.bitmaps.has(i) || this.decoding.has(i)) continue;
      const blob = this.blobs[i];
      if (!blob) continue;
      this.decoding.add(i);
      createImageBitmap(blob)
        .then((bmp) => {
          if (this.destroyed) {
            bmp.close();
            return;
          }
          this.bitmaps.set(i, bmp);
          this.evict();
          if (this.bitmaps.size === 1) this.resolveFirst();
          this.onUpdate?.();
        })
        .catch((err) => console.warn(`Frame ${i} could not be decoded`, err))
        .finally(() => {
          this.decoding.delete(i);
          this.pumpDecode();
        });
    }
  }

  private evict() {
    while (this.bitmaps.size > this.maxBitmaps) {
      let worst = -1;
      let worstScore = -Infinity;
      this.bitmaps.forEach((_, i) => {
        const off = (i - this.focus) * this.dir;
        // Frames behind the rider are cheaper to drop than frames ahead.
        const score = off < 0 ? -off * 2 : off;
        if (score > worstScore) {
          worstScore = score;
          worst = i;
        }
      });
      if (worst < 0) return;
      this.bitmaps.get(worst)?.close();
      this.bitmaps.delete(worst);
    }
  }
}

/** A sensible decoded-frame memory budget for this device. */
export function memoryBudget(): number {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const lowMem = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4;
  return (coarse || lowMem ? 180 : 380) * 1024 * 1024;
}
