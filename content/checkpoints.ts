/**
 * The signs along the trail, in the order you ride past them.
 * Each one links to a page in /app.
 */

export type Grade = 'green' | 'blue' | 'black' | 'double-black' | 'freeride';

export interface Checkpoint {
  /** URL-safe id. Also used for /?at=<slug> links that drop visitors back at this sign. */
  slug: string;
  /** Text on the sign and in the trail map. */
  label: string;
  /** Page the sign opens. */
  href: string;
  /** Trail difficulty symbol on the sign. Purely for fun. */
  grade: Grade;
  /** A short line on the sign. */
  blurb: string;
  /** The sign's button. Say exactly what happens when it's pressed. */
  cta: string;
  /** Opening line at the top of the page. */
  intro: string;
  /**
   * Where in the footage the rider stops for this sign: 0 = first frame, 1 = last.
   * Leave it out to space the signs evenly. Once your real footage is in, move
   * these so each sign shows up where the trail looks its best.
   */
  at?: number;
  /** Which side of the trail the sign stands on. Its arrow points that way. */
  side: 'left' | 'right';
  /** Where the bottom-centre of the sign rests when you stop at it (0–1 of the video window). */
  anchor: { x: number; y: number };
}

export const checkpoints: Checkpoint[] = [
  {
    slug: 'say-hi',
    label: 'Say hi',
    href: '/say-hi',
    grade: 'green',
    blurb: 'Job leads, questions, trail recommendations. All welcome.',
    cta: 'Send me a message',
    intro: 'The easiest trail on the mountain. Leave a note and I’ll get back to you.',
    side: 'left',
    anchor: { x: 0.3, y: 0.58 },
  },
  {
    slug: 'resume',
    label: 'resume bullshit',
    href: '/resume',
    grade: 'double-black',
    blurb: 'The serious part: where I’ve worked, what I’ve built, what I’m good at.',
    cta: 'Read my resume',
    intro: 'Where I’ve worked, what I’ve shipped, and the skills that pay for bike parts.',
    side: 'right',
    anchor: { x: 0.7, y: 0.56 },
  },
  {
    slug: 'favorites',
    label: 'my favorite things',
    href: '/favorites',
    grade: 'blue',
    blurb: 'Gear, books, tools, snacks, and whatever I’m obsessed with this month.',
    cta: 'See the list',
    intro: 'Things I love and recommend to anyone who’ll listen.',
    side: 'left',
    anchor: { x: 0.29, y: 0.6 },
  },
  {
    slug: 'photos',
    label: 'photos',
    href: '/photos',
    grade: 'green',
    blurb: 'Shots from the trail, and a few from off it.',
    cta: 'Browse photos',
    intro: 'Mostly dirt, trees and bikes. Some people too.',
    side: 'right',
    anchor: { x: 0.71, y: 0.57 },
  },
  {
    slug: 'minigame',
    label: 'current fav minigame',
    href: '/minigame',
    grade: 'freeride',
    blurb: 'The little game eating my lunch breaks right now.',
    cta: 'Play it',
    intro: 'What I’m playing when I should be doing something else.',
    side: 'left',
    anchor: { x: 0.3, y: 0.57 },
  },
  {
    slug: 'music',
    label: 'music',
    href: '/music',
    grade: 'blue',
    blurb: 'What’s in my ears on the long climbs.',
    cta: 'See what I’m listening to',
    intro: 'On repeat lately, for climbing, coding, and everything between.',
    side: 'right',
    anchor: { x: 0.7, y: 0.58 },
  },
];

export const checkpointBySlug = (slug: string) => checkpoints.find((c) => c.slug === slug);
