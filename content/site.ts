/**
 * Everything personal about the site. Edit freely.
 */
export const site = {
  name: 'Your Name',
  /** One line under your name at the trailhead. */
  tagline: 'I build software, and on weekends I ride bikes down hills in the woods.',
  /** Used for the browser tab and link previews. */
  description: 'Portfolio of Your Name: software, projects, photos, and a lot of mountain biking.',
  email: 'hello@example.com',
  links: [
    { label: 'GitHub', href: 'https://github.com/your-handle' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/your-handle' },
    { label: 'Strava', href: 'https://www.strava.com/athletes/your-id' },
  ],
  /** Put your PDF in /public and set this to e.g. '/resume.pdf'. null hides the download button. */
  resumePdf: null as string | null,
};
