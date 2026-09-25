'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import GradeMark from '@/components/GradeMark';
import { checkpoints } from '@/content/checkpoints';
import { site } from '@/content/site';
import { trailConfig } from '@/content/trail.config';
import { attachRideInput } from '@/lib/trail/input';
import { RidePhysics } from '@/lib/trail/physics';
import { signPose } from '@/lib/trail/projection';
import { StageRenderer, smoothstep } from '@/lib/trail/renderer';
import { createSource, type FrameSource } from '@/lib/trail/sources';
import { buildStops, mapGeometry, type Stop } from '@/lib/trail/stops';
import TrailMap from './TrailMap';
import styles from './TrailExperience.module.css';

const STOPS = buildStops(checkpoints);
const GEO = mapGeometry(STOPS);

interface Engine {
  travelTo(index: number): void;
  rideAgain(): void;
  navigate(href: string): void;
}

function anchorFor(stop: Stop, narrow: boolean) {
  if (stop.kind === 'trailhead') return narrow ? { x: 0.5, y: 0.92 } : { x: 0.37, y: 0.86 };
  if (stop.kind === 'end') return narrow ? { x: 0.5, y: 0.78 } : { x: 0.5, y: 0.72 };
  return narrow ? { x: 0.5, y: 0.93 } : stop.checkpoint.anchor;
}

/** Size the video window: as big as fits, but never blown up past the footage's resolution. */
function computeLayout(source: FrameSource) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  const narrow = vw < 760 || vw / vh < 1.05;
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const gutter = narrow ? 12 : clamp(Math.min(vw, vh) * 0.045, 18, 48);
  const mapW = narrow ? 0 : clamp(vw * 0.15, 180, 240);
  const mapBand = narrow ? 76 : 0;
  const availW = vw - gutter * 2 - (mapW ? mapW + gutter * 0.6 : 0);
  const availH = vh - gutter * 2 - mapBand;
  // Phones get a tall window (between 9:16 and 4:5) so the forest fills the screen.
  const aspect = narrow ? clamp(availW / availH, 9 / 16, 4 / 5) : source.width / source.height;
  let maxW = Infinity;
  if (source.kind === 'footage' && !narrow) {
    // On big screens, never blow the footage up past maxUpscale. (Phones skip this:
    // their pixels are so small that a little upscaling is invisible.)
    const srcA = source.width / source.height;
    const visibleSourceWidth = aspect < srcA ? source.height * aspect : source.width;
    maxW = (visibleSourceWidth * trailConfig.look.maxUpscale) / Math.min(dpr, 2);
  }
  const w = Math.max(200, Math.floor(Math.min(availW, availH * aspect, maxW)));
  return { narrow, w, h: Math.round(w / aspect), mapW, gutter, dpr };
}

export default function TrailExperience() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ambientRef = useRef<HTMLCanvasElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const poseRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mapItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const mapRef = useRef<HTMLElement>(null);
  const riderRef = useRef<HTMLSpanElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);

  const [docked, setDocked] = useState<number | null>(null);
  const [sourceKind, setSourceKind] = useState<FrameSource['kind'] | null>(null);

  useEffect(() => {
    const root = rootRef.current!;
    const stage = stageRef.current!;
    const fadeEl = fadeRef.current!;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const abort = new AbortController();
    let disposed = false;
    let raf = 0;
    let source: FrameSource | null = null;
    const cleanups: (() => void)[] = [];

    poseRefs.current.forEach((el) => el && (el.inert = true));

    const fade = (to: 0 | 1, ms: number) =>
      new Promise<void>((resolve) => {
        fadeEl.style.transitionDuration = `${ms}ms`;
        fadeEl.style.opacity = String(to);
        window.setTimeout(resolve, ms);
      });

    const requested = new URLSearchParams(window.location.search).get('at');
    const startIndex = Math.max(0, STOPS.findIndex((s) => s.slug === requested));

    (async () => {
      source = await createSource({
        manifestUrl: trailConfig.manifestUrl,
        startAt: STOPS[startIndex].at,
        placeholderDuration: trailConfig.placeholderDuration,
        signal: abort.signal,
      });
      if (disposed) {
        source.destroy();
        return;
      }
      const src = source;
      setSourceKind(src.kind);

      const duration = src.duration;
      const stopTimes = STOPS.map((s) => s.at * duration);
      let minGap = Infinity;
      for (let i = 1; i < stopTimes.length; i++) minGap = Math.min(minGap, stopTimes[i] - stopTimes[i - 1]);
      /** Footage-seconds over which a sign emerges from the fog and arrives. */
      const approach = minGap * 0.85;

      const syncUrl = (i: number) => {
        if (window.location.pathname !== '/') return;
        const slug = STOPS[i].slug;
        window.history.replaceState(null, '', slug ? `/?at=${slug}` : '/');
      };

      const physics = new RidePhysics(stopTimes, trailConfig.ride, {
        onDock: (i) => {
          setDocked(i);
          syncUrl(i);
        },
        onLeave: () => setDocked(null),
      });
      physics.teleport(startIndex, performance.now());

      const renderer = new StageRenderer(
        canvasRef.current!,
        ambientRef.current!,
        src,
        trailConfig.look,
        trailConfig.footage.vanishingPoint,
      );

      // ---- Layout ----------------------------------------------------------
      let layout = computeLayout(src);
      let columnH = 0;
      const poseCache: string[] = [];
      let mapCache = '';
      const onResize = () => {
        layout = computeLayout(src);
        root.dataset.narrow = String(layout.narrow);
        root.style.setProperty('--stage-w', `${layout.w}px`);
        root.style.setProperty('--stage-h', `${layout.h}px`);
        root.style.setProperty('--map-w', `${layout.mapW}px`);
        root.style.setProperty('--gutter', `${layout.gutter}px`);
        stage.style.width = `${layout.w}px`;
        stage.style.height = `${layout.h}px`;
        renderer.resize(layout.w, layout.h, layout.dpr);
        columnH = columnRef.current?.clientHeight ?? 0;
        poseCache.length = 0;
        mapCache = '';
      };
      onResize();
      window.addEventListener('resize', onResize);
      cleanups.push(() => window.removeEventListener('resize', onResize));

      // ---- Signs in the forest -------------------------------------------------
      const depth = trailConfig.look.signDepth;
      const layoutSigns = (t: number) => {
        const vp = { x: renderer.vpx * layout.w, y: renderer.vpy * layout.h };
        for (let i = 0; i < STOPS.length; i++) {
          const el = poseRefs.current[i];
          if (!el) continue;
          const stop = STOPS[i];
          const a = anchorFor(stop, layout.narrow);
          const side = stop.kind !== 'checkpoint' ? 0 : stop.checkpoint.side === 'right' ? -1 : 1;
          const d = (stopTimes[i] - t) / approach;
          const p = signPose(d, { x: a.x * layout.w, y: a.y * layout.h }, vp, depth, side);
          const key = p.visible
            ? `${p.x.toFixed(1)}|${p.y.toFixed(1)}|${p.scale.toFixed(4)}|${p.opacity.toFixed(3)}|${p.blur.toFixed(1)}|${p.rotate.toFixed(1)}`
            : 'hidden';
          if (poseCache[i] === key) continue;
          poseCache[i] = key;
          if (!p.visible) {
            el.style.visibility = 'hidden';
            el.inert = true;
            continue;
          }
          el.style.visibility = 'visible';
          el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) scale(${p.scale.toFixed(4)}) perspective(900px) rotateY(${p.rotate.toFixed(1)}deg)`;
          el.style.opacity = p.opacity.toFixed(3);
          el.style.filter = !reduced && p.blur > 0.15 ? `blur(${p.blur.toFixed(1)}px)` : 'none';
          el.inert = !(p.opacity > 0.8 && Math.abs(d) < 0.2);
        }
      };

      // ---- Trail map -------------------------------------------------------------
      const emphasisRadius = approach * 0.55;
      const updateMap = (t: number) => {
        const frac = t / duration;
        const key = frac.toFixed(5);
        if (key === mapCache) return;
        mapCache = key;
        mapRef.current?.style.setProperty('--ride', frac.toFixed(5));
        const p = GEO.pointAt(frac);
        if (riderRef.current) {
          riderRef.current.style.transform = `translate3d(${p.x.toFixed(2)}px, ${((p.y / GEO.height) * columnH).toFixed(2)}px, 0)`;
        }
        for (let i = 0; i < STOPS.length; i++) {
          const e = 1 - smoothstep(0, emphasisRadius, Math.abs(t - stopTimes[i]));
          mapItemRefs.current[i]?.style.setProperty('--e', e.toFixed(3));
        }
      };

      // ---- HUD ------------------------------------------------------------------
      let shownSpeed = -1;
      let lastStatusAt = 0;
      const updateHud = (rate: number, now: number) => {
        const kmh = Math.round(Math.abs(rate) * trailConfig.footage.speedKmh);
        if (kmh !== shownSpeed && speedRef.current) {
          speedRef.current.textContent = String(kmh);
          shownSpeed = kmh;
        }
        if (now - lastStatusAt > 250 && statusRef.current) {
          lastStatusAt = now;
          const pct = Math.round(src.progress() * 100);
          statusRef.current.textContent = pct < 100 ? `Loading trail ${pct}%` : '';
        }
      };

      // ---- Controls --------------------------------------------------------------
      const travelTo = (i: number) => {
        i = Math.max(0, Math.min(STOPS.length - 1, i));
        if (reduced) {
          fade(1, 160).then(() => {
            physics.teleport(i, performance.now());
            fade(0, 220);
          });
        } else {
          physics.travelTo(i, performance.now());
        }
      };
      const stepFrom = (dir: 1 | -1) => {
        if (physics.mode === 'docked') return travelTo(physics.dockIndex + dir);
        if (physics.target >= 0) return travelTo(physics.target + dir);
        const t = physics.pos;
        const i = dir > 0 ? stopTimes.findIndex((s) => s > t + 1e-4) : stopTimes.findLastIndex((s) => s < t - 1e-4);
        if (i >= 0) travelTo(i);
      };

      engineRef.current = {
        travelTo,
        rideAgain: () => {
          fade(1, reduced ? 0 : 520).then(() => {
            physics.teleport(0, performance.now());
            fade(0, reduced ? 0 : 900);
          });
        },
        navigate: (href: string) => {
          router.prefetch(href);
          fade(1, reduced ? 0 : 380).then(() => router.push(href));
        },
      };

      cleanups.push(
        attachRideInput(root, trailConfig.input, {
          pedal: (amount, now) => physics.input(amount, now),
          step: stepFrom,
          home: () => travelTo(0),
          end: () => travelTo(STOPS.length - 1),
        }),
      );

      // Coming back via the browser's back/forward cache: lift the fade.
      const onPageShow = (e: PageTransitionEvent) => e.persisted && fade(0, 300);
      window.addEventListener('pageshow', onPageShow);
      cleanups.push(() => window.removeEventListener('pageshow', onPageShow));

      // ---- The loop ---------------------------------------------------------------
      let last = performance.now();
      let revealed = false;
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        physics.step(dt, now);
        const drew = renderer.render(physics.pos, physics.vel, reduced);
        if (drew && !revealed) {
          revealed = true;
          root.dataset.ready = 'true';
          fade(0, reduced ? 0 : 1400);
        }
        layoutSigns(physics.pos);
        updateMap(physics.pos);
        updateHud(physics.vel, now);
      };
      raf = requestAnimationFrame(frame);
    })();

    return () => {
      disposed = true;
      abort.abort();
      cancelAnimationFrame(raf);
      cleanups.forEach((fn) => fn());
      source?.destroy();
      engineRef.current = null;
    };
  }, [router]);

  const onSignClick = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; // new tab etc.
    e.preventDefault();
    engineRef.current?.navigate(href);
  };

  return (
    <div
      ref={rootRef}
      className={styles.root}
      style={{ ['--dim' as string]: trailConfig.footage.dim }}
      data-docked={docked === null ? 'none' : STOPS[docked].kind}
    >
      <canvas ref={ambientRef} className={styles.ambient} aria-hidden />

      <div className={styles.layout}>
        <div ref={stageRef} className={styles.stage}>
          <canvas ref={canvasRef} className={styles.canvas} aria-hidden />
          <div className={styles.shade} aria-hidden />

          <div className={styles.signs}>
            {STOPS.map((stop, i) => (
              <div
                key={stop.slug ?? 'trailhead'}
                ref={(el) => {
                  poseRefs.current[i] = el;
                }}
                className={styles.pose}
              >
                <div className={styles.anchor}>
                  <div className={styles.float} data-active={docked === i}>
                    {stop.kind === 'trailhead' && (
                      <div className={styles.trailhead}>
                        <h1 className={styles.name}>{site.name}</h1>
                        <p className={styles.tagline}>{site.tagline}</p>
                        <p className={styles.hint}>
                          <span className={styles.hintPointer}>Scroll to start riding</span>
                          <span className={styles.hintTouch}>Swipe up to start riding</span>
                        </p>
                      </div>
                    )}

                    {stop.kind === 'checkpoint' && (
                      <Link
                        href={stop.checkpoint.href}
                        className={styles.sign}
                        data-side={stop.checkpoint.side}
                        onClick={(e) => onSignClick(e, stop.checkpoint.href)}
                      >
                        <span className={styles.signHead}>
                          <GradeMark grade={stop.checkpoint.grade} />
                          <span className={styles.signTitle}>{stop.checkpoint.label}</span>
                        </span>
                        <span className={styles.signBlurb}>{stop.checkpoint.blurb}</span>
                        <span className={styles.signCta}>{stop.checkpoint.cta}</span>
                      </Link>
                    )}

                    {stop.kind === 'end' && (
                      <div className={styles.trailEnd}>
                        <p className={styles.endTitle}>End of the trail</p>
                        <p className={styles.endLine}>Thanks for riding along. Pick any stop on the map, or go again from the top.</p>
                        <button type="button" className={styles.again} onClick={() => engineRef.current?.rideAgain()}>
                          Ride it again
                        </button>
                      </div>
                    )}
                  </div>
                  {stop.kind === 'checkpoint' && <span className={styles.shadow} aria-hidden />}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.hud} aria-hidden>
            <span ref={speedRef} className={styles.speed}>
              0
            </span>
            <span className={styles.unit}>km/h</span>
          </div>
          <p ref={statusRef} className={styles.status} aria-live="polite" />
          {sourceKind === 'placeholder' && process.env.NODE_ENV === 'development' && (
            <p className={styles.devNote}>Placeholder trail. Run npm run frames to add your footage.</p>
          )}
        </div>

        <TrailMap
          stops={STOPS}
          geo={GEO}
          current={docked}
          onSelect={(i) => engineRef.current?.travelTo(i)}
          mapRef={mapRef}
          columnRef={columnRef}
          riderRef={riderRef}
          itemRefs={mapItemRefs}
        />
      </div>

      <div ref={fadeRef} className={styles.fade} aria-hidden />

      <nav className="sr-only" aria-label="Pages">
        <ul>
          {checkpoints.map((cp) => (
            <li key={cp.slug}>
              <Link href={cp.href}>{cp.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
      <noscript>
        <div className={styles.noscript}>
          <p>{site.name}</p>
          <ul>
            {checkpoints.map((cp) => (
              <li key={cp.slug}>
                <a href={cp.href}>{cp.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </noscript>
    </div>
  );
}
