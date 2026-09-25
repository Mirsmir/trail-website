import type { RideTuning } from '@/lib/trail/physics';

/**
 * Every knob for how the ride looks and feels.
 * Change a number, save, and the dev server hot-reloads it.
 */
export const trailConfig = {
  /** Written by `npm run frames`. If it doesn't exist, a placeholder trail is shown. */
  manifestUrl: '/trail/manifest.json',
  /** Length (footage seconds) of the placeholder trail used before you add footage. */
  placeholderDuration: 3.5,

  footage: {
    /** How fast you were actually riding in the clip. Drives the speed readout. */
    speedKmh: 24,
    /** Where the trail vanishes into the distance, 0–1 of the frame. Signs recede toward it. */
    vanishingPoint: { x: 0.5, y: 0.45 },
    /** How dark the video is under the text. 0 = untouched, 1 = black. */
    dim: 0.3,
  },

  /** How scrolling turns into riding. See lib/trail/physics.ts for what each one does. */
  ride: {
    maxRate: 0.38,
    pedalDecay: 0.55,
    accelTime: 0.45,
    coastTime: 1.0,
    smoothing: 0.14,
    cruiseRate: 0.14,
    arriveTime: 1.6,
    dockHoldMs: 420,
    gestureGapMs: 170,
    undockThreshold: 0.3,
    autopilotBase: 0.95,
    autopilotPerRootSecond: 1.15,
    autopilotMax: 4.2,
  } satisfies RideTuning,

  input: {
    /** Pedal per pixel of mouse wheel / trackpad scroll. */
    wheel: 0.0045,
    /** Pedal per pixel of finger swipe on phones. */
    touch: 0.007,
  },

  look: {
    /** Motion blur when fast-forwarding from the trail map. 0 disables it. */
    motionBlur: 0.6,
    /** Push toward the vanishing point at speed. 0.05 = 5%. */
    speedZoom: 0.05,
    /** How deep the forest feels: bigger = signs start smaller and rush past faster. */
    signDepth: 1.9,
    /**
     * The video window is never shown larger than the footage's own resolution
     * times this. 1 = pixel-perfect, 1.25 = a little softer but bigger.
     */
    maxUpscale: 1.2,
  },
};
