import localFont from 'next/font/local';

/*
 * The resume page's typefaces, bundled with the page so nothing depends on
 * font packages. All four are SIL Open Font License (see ./fonts/LICENSE-*).
 */

export const display = localFont({
  src: './fonts/anton-latin-400-normal.woff2',
  weight: '400',
  variable: '--font-display',
  fallback: ['Impact', 'Arial Narrow', 'sans-serif'],
});

export const serif = localFont({
  src: [
    { path: './fonts/fraunces-latin-standard-normal.woff2', weight: '100 900', style: 'normal' },
    { path: './fonts/fraunces-latin-standard-italic.woff2', weight: '100 900', style: 'italic' },
  ],
  variable: '--font-serif',
  fallback: ['Georgia', 'serif'],
});

export const mono = localFont({
  src: [
    { path: './fonts/jetbrains-mono-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/jetbrains-mono-latin-600-normal.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-mono',
  fallback: ['ui-monospace', 'Menlo', 'monospace'],
});

export const sans = localFont({
  src: './fonts/inter-tight-latin-wght-normal.woff2',
  weight: '100 900',
  variable: '--font-sans',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
});
