'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './page.module.css';

/*
 * LogHop: a tiny starter game. The structure is the useful part:
 *   state    everything that changes, in one object
 *   update() moves the world forward by dt seconds
 *   draw()   paints the current state, nothing else
 *   loop()   requestAnimationFrame calling update then draw
 * Swap the insides for your own game and keep the skeleton.
 */

type Phase = 'ready' | 'riding' | 'crashed';

interface Obstacle {
  x: number;
  w: number;
  h: number;
  kind: 'log' | 'rock';
}

const GROUND = 0.8; // ground line, fraction of canvas height
const GRAVITY = 2600;
const HOP = 820;
const HOLD_GRAVITY = 0.45; // gravity multiplier while holding and still rising
const START_SPEED = 330;
const MAX_SPEED = 820;
const BEST_KEY = 'loghop-best';

export default function LogHop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>('ready');
  const [score, setScore] = useState({ now: 0, best: 0 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const box = boxRef.current!;
    const ctx = canvas.getContext('2d')!;
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = performance.now();

    let best = 0;
    try {
      best = Number(localStorage.getItem(BEST_KEY)) || 0;
    } catch {}
    setScore({ now: 0, best });

    const s = {
      phase: 'ready' as Phase,
      speed: START_SPEED,
      dist: 0, // pixels travelled
      y: 0, // rider height above ground (px, up is positive)
      vy: 0,
      holding: false,
      obstacles: [] as Obstacle[],
      nextGap: 600,
      wheel: 0,
    };

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const riderX = () => Math.max(90, w * 0.18);

    const setPhaseBoth = (p: Phase) => {
      s.phase = p;
      setPhase(p);
    };

    const start = () => {
      s.speed = START_SPEED;
      s.dist = 0;
      s.y = 0;
      s.vy = 0;
      s.obstacles = [];
      s.nextGap = 500;
      setPhaseBoth('riding');
    };

    const press = () => {
      if (s.phase !== 'riding') return start();
      if (s.y <= 0.5) s.vy = HOP;
      s.holding = true;
    };
    const release = () => {
      s.holding = false;
    };

    // ---- update ------------------------------------------------------------------
    const update = (dt: number) => {
      if (s.phase !== 'riding') {
        s.wheel += dt * 2;
        return;
      }
      s.speed = Math.min(MAX_SPEED, s.speed + dt * 9);
      const dx = s.speed * dt;
      s.dist += dx;
      s.wheel += dx / 16;

      const g = s.holding && s.vy > 0 ? GRAVITY * HOLD_GRAVITY : GRAVITY;
      s.vy -= g * dt;
      s.y = Math.max(0, s.y + s.vy * dt);
      if (s.y === 0) s.vy = Math.max(0, s.vy);

      for (const o of s.obstacles) o.x -= dx;
      s.obstacles = s.obstacles.filter((o) => o.x + o.w > -20);

      s.nextGap -= dx;
      if (s.nextGap <= 0) {
        const rock = Math.random() < 0.35;
        s.obstacles.push(
          rock
            ? { kind: 'rock', x: w + 20, w: 30 + Math.random() * 14, h: 24 + Math.random() * 12 }
            : { kind: 'log', x: w + 20, w: 40 + Math.random() * 50, h: 20 + Math.random() * 8 },
        );
        s.nextGap = s.speed * (0.9 + Math.random() * 0.9) + 120;
      }

      // Collision, a little forgiving.
      const rx = riderX();
      const ground = h * GROUND;
      const riderBottom = ground - s.y;
      for (const o of s.obstacles) {
        const overlapX = rx + 22 > o.x + 6 && rx - 22 < o.x + o.w - 6;
        if (overlapX && riderBottom > ground - o.h + 4) {
          setPhaseBoth('crashed');
          const now = Math.floor(s.dist / 40);
          if (now > best) {
            best = now;
            try {
              localStorage.setItem(BEST_KEY, String(best));
            } catch {}
          }
          setScore({ now, best });
          return;
        }
      }
    };

    // ---- draw ----------------------------------------------------------------------
    const trunks = (count: number, parallax: number, color: string, width: number) => {
      ctx.fillStyle = color;
      const spacing = w / count;
      const off = (s.dist * parallax) % spacing;
      for (let i = -1; i <= count + 1; i++) {
        const seed = Math.floor((s.dist * parallax) / spacing) + i;
        const jitter = ((Math.sin(seed * 12.9898) * 43758.5453) % 1) * spacing * 0.5;
        ctx.fillRect(i * spacing - off + jitter, 0, width * (0.7 + Math.abs(jitter / spacing)), h * GROUND);
      }
    };

    const draw = () => {
      const ground = h * GROUND;
      const sky = ctx.createLinearGradient(0, 0, 0, ground);
      sky.addColorStop(0, '#5d6b58');
      sky.addColorStop(1, '#2f3a2c');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      trunks(7, 0.15, 'rgba(36, 46, 34, 0.55)', 10);
      trunks(5, 0.35, 'rgba(28, 34, 25, 0.8)', 18);
      trunks(3, 0.7, '#1a1712', 30);

      // Dirt.
      ctx.fillStyle = '#3a2a1e';
      ctx.fillRect(0, ground, w, h - ground);
      ctx.fillStyle = '#4a3726';
      ctx.fillRect(0, ground, w, 4);

      for (const o of s.obstacles) {
        if (o.kind === 'log') {
          ctx.fillStyle = '#6b4a2e';
          ctx.beginPath();
          ctx.roundRect(o.x, ground - o.h, o.w, o.h, o.h / 2);
          ctx.fill();
          ctx.fillStyle = '#c9a06b';
          ctx.beginPath();
          ctx.ellipse(o.x + o.w - o.h / 2, ground - o.h / 2, o.h * 0.32, o.h * 0.42, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#7d7f78';
          ctx.beginPath();
          ctx.moveTo(o.x, ground);
          ctx.lineTo(o.x + o.w * 0.2, ground - o.h);
          ctx.lineTo(o.x + o.w * 0.75, ground - o.h * 0.9);
          ctx.lineTo(o.x + o.w, ground);
          ctx.fill();
        }
      }

      drawRider(riderX(), ground - s.y);
    };

    const drawRider = (x: number, bottom: number) => {
      const r = 13;
      const back = { x: x - 20, y: bottom - r };
      const front = { x: x + 20, y: bottom - r };
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      // Wheels with spinning spokes.
      for (const c of [back, front]) {
        ctx.strokeStyle = '#eeeae1';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
        for (let k = 0; k < 3; k++) {
          const a = s.wheel + (k * Math.PI) / 3;
          ctx.beginPath();
          ctx.moveTo(c.x - Math.cos(a) * r, c.y - Math.sin(a) * r);
          ctx.lineTo(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r);
          ctx.stroke();
        }
      }
      // Frame.
      const seat = { x: x - 6, y: bottom - 34 };
      const bars = { x: x + 14, y: bottom - 38 };
      ctx.strokeStyle = '#8da47a';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(back.x, back.y);
      ctx.lineTo(x, back.y);
      ctx.lineTo(seat.x, seat.y);
      ctx.moveTo(x, back.y);
      ctx.lineTo(bars.x, bars.y);
      ctx.lineTo(front.x, front.y);
      ctx.moveTo(seat.x, seat.y);
      ctx.lineTo(bars.x - 2, bars.y + 4);
      ctx.stroke();
      // Rider in flagging-tape pink, crouched when airborne.
      const air = Math.min(1, s.y / 60);
      const hip = { x: seat.x + 2, y: seat.y - 6 + air * 4 };
      const shoulder = { x: x + 8, y: bottom - 60 + air * 8 };
      ctx.strokeStyle = '#ff4f9a';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(hip.x, hip.y);
      ctx.lineTo(shoulder.x, shoulder.y);
      ctx.lineTo(bars.x, bars.y - 2);
      ctx.stroke();
      ctx.strokeStyle = '#241a13';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(hip.x, hip.y);
      ctx.lineTo(x + 4, bottom - 22);
      ctx.stroke();
      ctx.fillStyle = '#eeeae1';
      ctx.beginPath();
      ctx.arc(shoulder.x + 6, shoulder.y - 9, 7, 0, Math.PI * 2);
      ctx.fill();
    };

    // ---- loop ------------------------------------------------------------------------
    let lastShown = -1;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      update(dt);
      draw();
      const m = Math.floor(s.dist / 40);
      if (s.phase === 'riding' && m !== lastShown) {
        lastShown = m;
        setScore((sc) => ({ ...sc, now: m }));
      }
    };
    raf = requestAnimationFrame(loop);

    // ---- input -------------------------------------------------------------------------
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.code !== 'ArrowUp') return;
      if (document.activeElement !== box) return;
      e.preventDefault();
      if (!e.repeat) press();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') release();
    };
    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      box.focus({ preventScroll: true });
      press();
    };
    box.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', release);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      box.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  return (
    <div ref={boxRef} className={styles.game} tabIndex={0} role="application" aria-label="LogHop. Press space to hop.">
      <canvas ref={canvasRef} />
      <p className={styles.score}>
        <strong>{score.now} m</strong>
        best {score.best} m
      </p>
      {phase !== 'riding' && (
        <div className={styles.overlay}>
          <p className={styles.overlayTitle}>{phase === 'ready' ? 'Drop in' : 'Cased it'}</p>
          <p className={styles.overlayLine}>
            {phase === 'ready' ? 'Press space or tap to start' : `${score.now} m. Tap or press space to go again.`}
          </p>
        </div>
      )}
    </div>
  );
}
