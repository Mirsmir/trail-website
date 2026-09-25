/**
 * The "my favorite things" page. Groups show up in this order.
 * `why` is the good part: one honest sentence beats a paragraph.
 */

export interface Favorite {
  name: string;
  why: string;
  link?: string;
}

export interface FavoriteGroup {
  title: string;
  note?: string;
  items: Favorite[];
}

export const favorites: FavoriteGroup[] = [
  {
    title: 'On the bike',
    note: 'Gear that has earned its place.',
    items: [
      { name: 'Your bike', why: 'What you ride and the one thing you love about it.' },
      { name: 'A trail', why: 'Your favourite local trail, and the best feature on it.' },
      { name: 'A piece of kit', why: 'The thing you never ride without.' },
    ],
  },
  {
    title: 'At the desk',
    items: [
      { name: 'An editor or tool', why: 'Why it makes your day better.', link: 'https://example.com' },
      { name: 'A keyboard, font, or theme', why: 'Tiny things, big feelings.' },
    ],
  },
  {
    title: 'Reading and watching',
    items: [
      { name: 'A book', why: 'The idea from it you still think about.' },
      { name: 'A film or series', why: 'Why you’d rewatch it.' },
    ],
  },
  {
    title: 'Fuel',
    note: 'Trailside snacks and post-ride food.',
    items: [
      { name: 'A snack', why: 'Pocket-proof and delicious.' },
      { name: 'A spot', why: 'Where you go after a big ride.' },
    ],
  },
];
