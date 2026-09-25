# Trail portfolio

A portfolio you ride through. The home page is first-person mountain-bike footage: scrolling pedals the bike, letting go coasts it to a stop, and trail signs standing in the forest link to the rest of the site.

## Run it

You need Node 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Until you add footage you'll see a placeholder forest, so everything works from the first minute.

## Add your footage

Put your clip anywhere (a `footage/` folder is git-ignored for this), then:

```bash
npm run frames -- footage/my-ride.mp4
```

That needs [ffmpeg](https://ffmpeg.org/download.html) installed (`brew install ffmpeg`, `winget install ffmpeg`, or `sudo apt install ffmpeg`). It writes an image sequence to `public/trail/frames/` and a `public/trail/manifest.json`. Restart `npm run dev` and you're riding your own trail.

Useful options:

| Option | What it does |
| --- | --- |
| `--interpolate 60` | Invents in-between frames. **Recommended for short clips**: slow rolling stops get much smoother. Takes a few minutes. |
| `--start 1.5 --end 4` | Use only part of the clip (seconds). |
| `--width 1920` | Output width. Default 1920, never upscales. |
| `--quality 78` | Image quality, 0–100. Lower = smaller download. |
| `--format jpg` | If your ffmpeg can't make WebP. |

Why an image sequence and not a `<video>`? Seeking a video on every animation frame stutters in most browsers. Frames drawn to a canvas scrub perfectly in both directions, can be cross-faded for silky slow motion, and never stall on keyframes.

**Tips for the clip itself.** Landscape, 1080p or better, as steady as possible (use your camera's stabilization or run it through a stabilizer first), riding at a steady pace without sharp turns. A gentle, flowy section beats a gnarly one here. Around 2–10 seconds is plenty: the ride plays in slow motion.

**Size.** Each 1080p WebP frame is usually 60–200 KB. 150 frames is roughly 10–25 MB, downloaded once and cached forever. The page shows "Loading trail N%" and is usable immediately; frames stream in coarse-to-fine so the whole trail is roughly visible early. If it's heavy, try `--quality 70 --width 1600`.

## Make it yours

Everything personal lives in `content/`. You rarely need to touch components.

| File | What's in it |
| --- | --- |
| `content/site.ts` | Your name, tagline, email, social links, resume PDF. |
| `content/checkpoints.ts` | The signs: label, blurb, button text, page, trail grade, which side they stand on, and where. |
| `content/trail.config.ts` | Every knob for how the ride looks and feels. |
| `content/resume.ts` | The resume page. |
| `content/favorites.ts` | The favourites page. |
| `content/photos.ts` | The photo gallery (images go in `public/photos/`). |
| `content/minigame.ts` | The game page: embed any game, or keep the built-in LogHop. |
| `content/music.ts` | The music page, with an optional Spotify playlist embed. |

### Placing the signs on your footage

Once your footage is in, open `content/checkpoints.ts` and tune each sign:

- `at`: where in the clip the rider stops, from 0 (first frame) to 1 (last frame). Leave it out to space signs evenly. Pick moments where the trail looks great.
- `anchor`: where the bottom of the sign rests on screen when you're stopped at it, as fractions of the video window. `{ x: 0.3, y: 0.58 }` is left of centre, a bit below the middle. Put it on the ground beside the trail, not on it.
- `side`: `'left'` or `'right'`. The sign's arrow points that way and it turns away on that side as you ride past.

Also set `footage.vanishingPoint` in `trail.config.ts` to where the trail disappears into the distance in your clip. Signs emerge from that point and grow toward you, so getting it right makes them feel like they're really standing in the forest.

You can link straight to any sign: `/?at=resume` starts the ride parked there. Pages use this for "Back to the trail".

### Tuning the ride

All in `content/trail.config.ts` under `ride`. Speeds are in *footage seconds per second*: 0.38 means the clip plays at 38% speed.

| Knob | What it does |
| --- | --- |
| `maxRate` | Top speed. Longer clips can go higher. |
| `cruiseRate` | Gravity: after leaving a sign, the bike never drops below this and rolls on to the next sign by itself. `0` lets you stall anywhere. |
| `accelTime` / `coastTime` | How heavy the bike feels speeding up and slowing down. |
| `pedalDecay` | How long one flick of the scroll wheel keeps pushing. |
| `arriveTime` | Seconds it takes to roll to a stop at a sign. Every stop is an eased glide ending exactly on the sign. Bigger = more dramatic. |
| `dockHoldMs` / `gestureGapMs` | How long you pause at a sign before scrolling moves you on, and how trackpad momentum is told apart from a fresh scroll. |
| `autopilot*` | How long trail-map fast travel takes. |

Under `input`, `wheel` and `touch` set how much a scroll or swipe pedals. Under `look`: `motionBlur` and `speedZoom` (only visible when fast-travelling), `signDepth` (how far away signs start), and `maxUpscale` (see below). Under `footage`: `speedKmh` for the speedometer, and `dim` for how dark the video is under the text.

### The video window

The footage is shown in a rounded window that is never blown up past its real resolution (times `look.maxUpscale`), so it stays crisp even on a 4K monitor. A tiny, heavily blurred copy of the same footage fills the rest of the screen, so the whole page still feels like the forest. On phones the window is tall and fills most of the screen, with the trail map as a strip underneath.

## Pages

Every subpage uses `components/page/PageShell.tsx`: the "Back to the trail" sign, the big title with its trail grade, and signs to the previous and next stops at the bottom. Titles, grades and intros come from `content/checkpoints.ts`.

To add a new stop:

1. Add an entry to `content/checkpoints.ts`.
2. Create `app/<slug>/page.tsx`:

```tsx
import PageShell from '@/components/page/PageShell';
import Section from '@/components/page/Section';

export default function Page() {
  return (
    <PageShell slug="<slug>">
      <Section title="Something" aside>
        <p>Your content.</p>
      </Section>
    </PageShell>
  );
}
```

It appears on the trail and in the trail map automatically.

Per page:

- **Say hi** (`app/say-hi`): the form posts to `app/api/contact/route.ts`, which validates and currently just logs. The file has a copy-paste example for sending real email with Resend.
- **resume bullshit** (`app/resume`): prints cleanly with Ctrl/Cmd+P. Set `site.resumePdf` to show a download button.
- **photos** (`app/photos`): masonry grid and a lightbox (arrow keys, Esc). Replace the placeholder images in `public/photos/`.
- **current fav minigame** (`app/minigame`): set `embedUrl` to embed any game that allows it, or build on `LogHop.tsx`, a small canvas game written as a clean update/draw/loop skeleton.
- **music** (`app/music`): tracks grouped into mixes, optional Spotify embed.

## Design system

Tokens are in `app/globals.css`: loam brown and birch white, grade colours for the signs, and flagging-tape pink used *only* for "you are here" and the thing you're about to press. One typeface, Mona Sans, used condensed and heavy for signage and normal for reading.

## Accessibility

- Keyboard: arrow keys, Page Up/Down and Space step between signs; Home/End jump to the trailhead and the end; Tab reaches the current sign’s button and every stop on the trail map.
- Reduced motion: with the system setting on, travel becomes a quick fade instead of a ride, and floating and motion blur are turned off.
- Screen readers get a plain list of the pages, and there's a no-JavaScript fallback.

## Deploying

Any Next.js host works; Vercel is the one-click option. Frames are served with a year-long immutable cache and cache-busted automatically each time you re-run `npm run frames`. If your host limits deployment size, keep the frames under about 50 MB or serve `public/trail` from a CDN and point `manifestUrl` in `trail.config.ts` at it.

## Project map

```
app/                   pages (one folder per stop) and the contact API
components/trail/      the ride: TrailExperience (stage, signs, loop) and TrailMap
components/page/       PageShell, Section, shared page styles
lib/trail/             physics, frame streaming, rendering, sign projection, input
content/               everything you edit
scripts/               extract-frames.mjs
public/photos/         gallery images
public/trail/          your frames (created by npm run frames)
```
