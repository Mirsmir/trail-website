/**
 * Ride physics.
 *
 * Position is measured in *footage seconds* (0 → clip duration) and velocity is a
 * *playback rate* (0.3 = the clip plays at 30% speed). That keeps every tuning
 * number meaningful relative to your actual video.
 *
 * The rider is always in exactly one mode:
 *   rolling   – scroll input is "pedaling"; the bike speeds up and coasts down smoothly
 *   arriving  – a checkpoint has caught the rider; they brake gently into it
 *   docked    – stopped at a checkpoint; waits for a fresh, deliberate scroll to leave
 *   autopilot – the trail map sent the rider somewhere; a smooth fast-forward ride
 */

export type RideMode = 'rolling' | 'arriving' | 'docked' | 'autopilot';

export interface RideTuning {
  /** Playback rate at full pedal. Below 1 is slow motion. */
  maxRate: number;
  /** Seconds a burst of scrolling keeps pushing after it stops. */
  pedalDecay: number;
  /** Time constant (s) for speeding up. Bigger feels heavier. */
  accelTime: number;
  /** Time constant (s) for rolling to a stop once you stop scrolling. */
  coastTime: number;
  /** Extra smoothing (s) layered on top so acceleration itself never jumps. */
  smoothing: number;
  /**
   * Seconds it takes to roll to a stop at a sign. The sign "catches" you exactly
   * this long before you'd reach it, and the braking eases in and out, so the
   * stop is always this long and always glass-smooth. Bigger = more dramatic.
   */
  arriveTime: number;
  /**
   * Gravity. Once you've set off from a sign the bike never fully stops between
   * signs: with no pedaling it coasts down to this rate and rolls on until the
   * next sign brakes it. 0 = you can stall anywhere.
   */
  cruiseRate: number;
  /** Minimum pause (ms) at a checkpoint before scrolling can move you on. */
  dockHoldMs: number;
  /** Scroll events closer together than this (ms) count as the same gesture (trackpad inertia). */
  gestureGapMs: number;
  /** How much fresh scrolling it takes to roll away from a checkpoint (pedal units). */
  undockThreshold: number;
  /** Autopilot trip time = base + perRootSecond × √(distance), capped at max. */
  autopilotBase: number;
  autopilotPerRootSecond: number;
  autopilotMax: number;
}

export interface RideEvents {
  onDock?(index: number): void;
  onLeave?(index: number): void;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
/** Frame-rate independent smoothing factor for a first-order low-pass. */
const follow = (dt: number, tau: number) => 1 - Math.exp(-dt / Math.max(tau, 1e-4));


/**
 * A quintic (minimum-jerk) move: starts at the current position, velocity and
 * acceleration, ends exactly at `to` completely at rest with zero acceleration.
 * Position, speed and acceleration are all continuous, so there is never a
 * visible bump when a move begins or ends.
 */
class Glide {
  private from = 0;
  private b1 = 0;
  private b2 = 0;
  private c3 = 0;
  private c4 = 0;
  private c5 = 0;
  T = 1;
  elapsed = 0;

  set(from: number, to: number, v0: number, a0: number, T: number) {
    this.from = from;
    this.T = T;
    this.elapsed = 0;
    this.b1 = v0 * T;
    this.b2 = (a0 * T * T) / 2;
    const P = to - from - this.b1 - this.b2;
    const V = -v0 * T - a0 * T * T;
    const A = -a0 * T * T;
    this.c3 = 10 * P - 4 * V + A / 2;
    this.c4 = -15 * P + 7 * V - A;
    this.c5 = 6 * P - 3 * V + A / 2;
  }

  /** Advance by dt; returns [position, velocity, done]. */
  step(dt: number): [number, number, boolean] {
    this.elapsed += dt;
    const s = Math.min(1, this.elapsed / this.T);
    const s2 = s * s;
    const s3 = s2 * s;
    const pos = this.from + this.b1 * s + this.b2 * s2 + this.c3 * s3 + this.c4 * s3 * s + this.c5 * s3 * s2;
    const vel = (this.b1 + 2 * this.b2 * s + 3 * this.c3 * s2 + 4 * this.c4 * s3 + 5 * this.c5 * s3 * s) / this.T;
    return [pos, vel, s >= 1];
  }
}

export class RidePhysics {
  pos = 0;
  vel = 0;
  mode: RideMode = 'docked';
  dockIndex = 0;
  /** Index of the checkpoint currently being arrived at / travelled to, else -1. */
  target = -1;

  private pedal = 0;
  private v1 = 0;
  private acc = 0;
  private lastDir = 1;
  private glide = new Glide();

  private dockedAt = -Infinity;
  private lastInputAt = -Infinity;
  private awaitingBreak = false;
  private intent = 0;
  private intentAt = 0;

  constructor(
    public readonly stops: number[],
    public tuning: RideTuning,
    private events: RideEvents = {},
  ) {}

  /** 0–1: how hard the rider is currently pedaling. */
  get throttle() {
    return Math.abs(Math.tanh(this.pedal));
  }

  /** Scroll/touch input. Positive = forward. `now` in ms (performance.now()). */
  input(amount: number, now: number) {
    const gap = now - this.lastInputAt;
    this.lastInputAt = now;

    switch (this.mode) {
      case 'autopilot':
        return;
      case 'arriving':
        // Absorb input while braking; the rider should feel the checkpoint catch them.
        this.awaitingBreak = true;
        return;
      case 'docked': {
        const decay = Math.exp(-(now - this.intentAt) / 350);
        this.intentAt = now;
        if (now - this.dockedAt < this.tuning.dockHoldMs) {
          this.awaitingBreak = true;
          this.intent = 0;
          return;
        }
        this.intent = this.intent * decay + amount;
        let need = this.tuning.undockThreshold;
        if (this.awaitingBreak) {
          if (gap >= this.tuning.gestureGapMs) {
            // A fresh gesture: the rider has taken in the sign and wants to go on.
            this.awaitingBreak = false;
            this.intent = amount;
          } else if (now - this.dockedAt < this.tuning.dockHoldMs * 3) {
            // Still the gesture that brought us here (e.g. trackpad momentum).
            return;
          } else {
            // Someone scrolling non-stop: let a strong, sustained push move on.
            need *= 3;
          }
        }
        if (Math.abs(this.intent) < need) return;

        const dir = Math.sign(this.intent);
        if (this.neighbor(this.dockIndex, dir) < 0) {
          this.intent = 0; // nothing that way (start or end of the trail)
          return;
        }
        const left = this.dockIndex;
        this.mode = 'rolling';
        this.pedal = this.intent;
        this.intent = 0;
        this.v1 = 0;
        this.vel = 0;
        this.lastDir = dir;
        this.events.onLeave?.(left);
        return;
      }
      case 'rolling':
        this.pedal = clamp(this.pedal + amount, -3, 3);
    }
  }

  /** Ride (fast, smoothly) to a checkpoint. Used by the trail map and keyboard. */
  travelTo(index: number, now: number) {
    index = clamp(index, 0, this.stops.length - 1);
    if (this.mode === 'docked' && this.dockIndex === index) return;
    const to = this.stops[index];
    const dist = Math.abs(to - this.pos);
    const wasDocked = this.mode === 'docked';
    if (dist < 1e-4) {
      this.dock(index, now);
      return;
    }
    const tn = this.tuning;
    const T = clamp(tn.autopilotBase + tn.autopilotPerRootSecond * Math.sqrt(dist), 0.8, tn.autopilotMax);
    // Starts from wherever and however fast you're going, so there's no seam.
    this.glide.set(this.pos, to, this.vel, 0, T);
    this.mode = 'autopilot';
    this.target = index;
    this.pedal = 0;
    if (wasDocked) this.events.onLeave?.(this.dockIndex);
  }

  /** Jump instantly (used behind a fade, e.g. returning from a page). */
  teleport(index: number, now: number) {
    this.pos = this.stops[clamp(index, 0, this.stops.length - 1)];
    this.dock(index, now);
  }

  step(dt: number, now: number) {
    if (dt <= 0) return;
    const tn = this.tuning;

    switch (this.mode) {
      case 'docked':
        this.pos = this.stops[this.dockIndex];
        this.vel = this.v1 = this.pedal = 0;
        return;

      case 'autopilot':
      case 'arriving': {
        const [pos, vel, done] = this.glide.step(dt);
        this.pos = pos;
        this.vel = this.v1 = vel;
        if (done) this.dock(this.target, now);
        return;
      }

      case 'rolling': {
        this.pedal *= Math.exp(-dt / tn.pedalDecay);
        let targetRate = tn.maxRate * Math.tanh(this.pedal);
        // Gravity: keep rolling toward the next sign unless actively braking.
        if (tn.cruiseRate > 0 && this.pedal * this.lastDir > -0.12) {
          const floor = tn.cruiseRate * this.lastDir;
          targetRate = this.lastDir > 0 ? Math.max(targetRate, floor) : Math.min(targetRate, floor);
        }
        const sameWay = Math.sign(targetRate) === Math.sign(this.v1) || this.v1 === 0;
        const tau = !sameWay
          ? tn.accelTime * 0.8 // scrolling backwards = braking
          : Math.abs(targetRate) > Math.abs(this.v1)
            ? tn.accelTime
            : tn.coastTime;
        this.v1 += (targetRate - this.v1) * follow(dt, tau);
        const before = this.vel;
        this.vel += (this.v1 - this.vel) * follow(dt, tn.smoothing);
        this.acc = (this.vel - before) / dt;
        this.pos += this.vel * dt;

        const end = this.stops[this.stops.length - 1];
        if (this.pos < 0 || this.pos > end) {
          this.dock(this.pos < 0 ? 0 : this.stops.length - 1, now);
          return;
        }

        if (Math.abs(this.vel) > 1e-4) this.lastDir = Math.sign(this.vel);
        const dir = this.lastDir;
        const next = this.nextStop(this.pos, dir);
        if (next < 0) return;

        const dist = Math.abs(this.stops[next] - this.pos);
        const toward = this.vel * dir;
        // Caught: a stop taking exactly arriveTime would end right at the sign.
        if (toward > 0 && dist <= (toward * tn.arriveTime) / 2) {
          this.beginArrive(next, dist / toward);
          return;
        }
        return;
      }
    }
  }

  /** Brake into a sign. `halfTime` = distance / speed, so the glide lasts 2×halfTime. */
  private beginArrive(index: number, halfTime: number) {
    const T = Math.max(0.35, 2 * halfTime);
    // Carry over a little of the current acceleration so the handover is seamless,
    // but never enough to make the glide overshoot or reverse.
    const aMax = Math.abs(this.vel) / T;
    const a0 = clamp(this.acc, -aMax, aMax);
    this.glide.set(this.pos, this.stops[index], this.vel, a0, T);
    this.mode = 'arriving';
    this.target = index;
    this.awaitingBreak = true;
    this.pedal = 0;
  }

  private dock(index: number, now: number) {
    this.mode = 'docked';
    this.dockIndex = index;
    this.target = -1;
    this.pos = this.stops[index];
    this.vel = this.v1 = this.pedal = this.acc = 0;
    this.dockedAt = now;
    this.awaitingBreak = true;
    this.intent = 0;
    this.events.onDock?.(index);
  }

  /** Next stop strictly ahead of `pos` in direction `dir`, or -1. */
  private nextStop(pos: number, dir: number) {
    const eps = 1e-4;
    if (dir > 0) {
      for (let i = 0; i < this.stops.length; i++) if (this.stops[i] > pos + eps) return i;
    } else {
      for (let i = this.stops.length - 1; i >= 0; i--) if (this.stops[i] < pos - eps) return i;
    }
    return -1;
  }

  private neighbor(index: number, dir: number) {
    const n = index + (dir > 0 ? 1 : -1);
    return n >= 0 && n < this.stops.length ? n : -1;
  }
}
