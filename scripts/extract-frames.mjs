#!/usr/bin/env node
/**
 * Turns a POV clip into the image sequence the home page rides through.
 *
 *   npm run frames -- footage/my-ride.mp4
 *   npm run frames -- footage/my-ride.mp4 --interpolate 60 --start 1.5 --end 5
 *
 * Writes public/trail/frames/00000.webp, 00001.webp, … and public/trail/manifest.json.
 * Needs ffmpeg + ffprobe on your PATH (https://ffmpeg.org/download.html,
 * or `brew install ffmpeg`, `winget install ffmpeg`, `sudo apt install ffmpeg`).
 *
 * Options
 *   --width <px>         Output width. Default 1920. Never upscales.
 *   --fps <n>            Frames per second to keep. Default: the clip's own (max 60).
 *   --interpolate <n>    Invent in-between frames up to n fps with motion
 *                        interpolation. Great for short clips: smoother slow motion.
 *                        Slow to run (minutes), and can smear fast detail.
 *   --quality <0-100>    Image quality. Default 78.
 *   --format webp|jpg    Default webp (about half the size of jpg).
 *   --start <sec>        Skip the beginning of the clip.
 *   --end <sec>          Stop here.
 *   --out <dir>          Default public/trail.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const argv = process.argv.slice(2);
const opts = {
  width: 1920,
  fps: 0,
  interpolate: 0,
  quality: 78,
  format: 'webp',
  start: null,
  end: null,
  out: 'public/trail',
};
let input = null;

for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '-h' || a === '--help') {
    usage();
    process.exit(0);
  }
  if (a.startsWith('--')) {
    const key = a.slice(2);
    if (!(key in opts)) fail(`Unknown option ${a}. Run with --help to see the options.`);
    const value = argv[++i];
    if (value === undefined) fail(`${a} needs a value.`);
    if (key === 'format' || key === 'out') {
      opts[key] = value;
    } else {
      opts[key] = Number(value);
      if (!Number.isFinite(opts[key])) fail(`${a} needs a number.`);
    }
  } else if (!input) {
    input = a;
  } else {
    fail(`Unexpected argument "${a}".`);
  }
}

if (!input) {
  usage();
  process.exit(1);
}
if (!existsSync(input)) fail(`Can't find "${input}".`);
if (!['webp', 'jpg'].includes(opts.format)) fail('--format must be webp or jpg.');

// ---- Tools -----------------------------------------------------------------------------
for (const tool of ['ffmpeg', 'ffprobe']) {
  const r = spawnSync(tool, ['-version'], { encoding: 'utf8' });
  if (r.error || r.status !== 0) {
    fail(
      `${tool} isn't installed (or isn't on your PATH).\n` +
      '  Mac:     brew install ffmpeg\n' +
      '  Windows: winget install ffmpeg   (then open a new terminal)\n' +
      '  Linux:   sudo apt install ffmpeg',
    );
  }
}
if (opts.format === 'webp') {
  const enc = spawnSync('ffmpeg', ['-hide_banner', '-encoders'], { encoding: 'utf8' }).stdout ?? '';
  if (!/\blibwebp\b/.test(enc)) {
    console.log('Your ffmpeg has no WebP encoder, so using JPG instead.');
    opts.format = 'jpg';
  }
}

// ---- Probe -----------------------------------------------------------------------------
const probe = spawnSync(
  'ffprobe',
  ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate,avg_frame_rate:format=duration', '-of', 'json', input],
  { encoding: 'utf8' },
);
if (probe.status !== 0) fail(`ffprobe couldn't read "${input}":\n${probe.stderr}`);
const info = JSON.parse(probe.stdout);
const stream = info.streams?.[0];
if (!stream) fail(`"${input}" has no video in it.`);
const ratio = (s) => {
  const [n, d] = String(s).split('/').map(Number);
  return d ? n / d : n;
};
const srcFps = ratio(stream.avg_frame_rate) || ratio(stream.r_frame_rate) || 30;
const srcDuration = Number(info.format?.duration) || 0;

const outFps = opts.interpolate > 0 ? opts.interpolate : opts.fps > 0 ? opts.fps : Math.min(60, Math.round(srcFps * 1000) / 1000);

// ---- Extract -----------------------------------------------------------------------------
const outDir = resolve(opts.out);
const framesDir = join(outDir, 'frames');
rmSync(framesDir, { recursive: true, force: true });
mkdirSync(framesDir, { recursive: true });

const filters = [];
if (opts.interpolate > 0) {
  filters.push(`minterpolate=fps=${opts.interpolate}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1`);
} else if (opts.fps > 0) {
  filters.push(`fps=${opts.fps}`);
}
// Scale down only, keep even dimensions, high-quality resampling.
filters.push(`scale='min(${Math.round(opts.width)},iw)':-2:flags=lanczos`);

const ext = opts.format;
const codec =
  ext === 'webp'
    ? ['-c:v', 'libwebp', '-quality', String(opts.quality), '-compression_level', '4', '-preset', 'photo']
    : ['-q:v', String(Math.min(31, Math.max(2, Math.round((100 - opts.quality) / 6) + 1)))];

const args = ['-hide_banner', '-loglevel', 'error', '-stats', '-y'];
if (opts.start !== null) args.push('-ss', String(opts.start));
if (opts.end !== null) args.push('-to', String(opts.end));
args.push('-i', input, '-an', '-vf', filters.join(','), '-fps_mode', 'passthrough', '-start_number', '0', ...codec);
args.push(join(framesDir, `%05d.${ext}`));

console.log(`\nExtracting frames from ${input}`);
console.log(`  source: ${stream.width}×${stream.height}, ${srcFps.toFixed(2)} fps, ${srcDuration.toFixed(2)} s`);
console.log(`  output: up to ${opts.width}px wide, ${outFps} fps, ${ext} at quality ${opts.quality}`);
if (opts.interpolate > 0) console.log('  interpolating in-between frames. This can take a few minutes.');
console.log('');

const run = spawnSync('ffmpeg', args, { stdio: 'inherit' });
if (run.status !== 0) fail('ffmpeg failed (see above).');

const files = readdirSync(framesDir)
  .filter((f) => f.endsWith(`.${ext}`))
  .sort();
if (files.length < 2) fail('Got fewer than 2 frames. Check --start/--end.');

// Real output size (after rotation metadata and scaling).
const first = spawnSync(
  'ffprobe',
  ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'json', join(framesDir, files[0])],
  { encoding: 'utf8' },
);
const dims = JSON.parse(first.stdout).streams[0];

const manifest = {
  version: 1,
  frameCount: files.length,
  fps: outFps,
  width: dims.width,
  height: dims.height,
  pattern: `frames/{index}.${ext}`,
  pad: 5,
  rev: Date.now().toString(36),
};
writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

// ---- Report ----------------------------------------------------------------------------------
const bytes = files.reduce((sum, f) => sum + statSync(join(framesDir, f)).size, 0);
const mb = bytes / 1024 / 1024;
const duration = (files.length - 1) / outFps;
console.log(`\nDone. ${files.length} frames, ${dims.width}×${dims.height}, ${duration.toFixed(2)} s of trail.`);
console.log(`  ${mb.toFixed(1)} MB total, ${(bytes / files.length / 1024).toFixed(0)} KB per frame on average.`);
console.log(`  Manifest: ${join(opts.out, 'manifest.json')}`);

const tips = [];
if (mb > 60) tips.push('That is a lot to download on mobile. Try --quality 70, --width 1600, or a shorter --start/--end.');
if (dims.height > dims.width) tips.push('This clip is portrait. Landscape footage fills desktop screens much better.');
if (duration < 3 && opts.interpolate === 0)
  tips.push('Short clip. Adding --interpolate 60 makes the slow rolling stops noticeably smoother.');
if (tips.length) {
  console.log('\nTips:');
  for (const t of tips) console.log(`  - ${t}`);
}
console.log('\nNext: restart `npm run dev` if it is running, then move the checkpoints in content/checkpoints.ts');
console.log('(the `at` values) so each sign lands on a nice stretch of trail.\n');

function usage() {
  console.log('Usage: npm run frames -- <video file> [--width 1920] [--fps 30] [--interpolate 60]');
  console.log('                          [--quality 78] [--format webp|jpg] [--start 0] [--end 5] [--out public/trail]');
}

function fail(msg) {
  console.error(`\n${msg}\n`);
  process.exit(1);
}
