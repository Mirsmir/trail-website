/**
 * The "current fav minigame" page.
 *
 * Option A: show a game you love. Set `embedUrl` to something that allows
 * embedding (an itch.io embed link, for example), or just `link` to send
 * people to it.
 *
 * Option B: build your own. With no embedUrl, the page shows LogHop
 * (app/minigame/LogHop.tsx), a small starter game you can rip apart.
 */
export const minigame = {
  title: 'LogHop',
  blurb: 'Hop the logs, dodge the rocks, don’t case the landing. It gets faster.',
  howToPlay: 'Space, click, or tap to hop. Hold for a bigger hop.',
  /** e.g. 'https://itch.io/embed-upload/123456' */
  embedUrl: null as string | null,
  /** e.g. 'https://someone.itch.io/some-game' */
  link: null as string | null,
};
