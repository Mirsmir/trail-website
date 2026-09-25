/**
 * The music page. Tracks are grouped into mixes; add as many as you like.
 *
 * `link` can be Spotify, Apple Music, Bandcamp, YouTube, anything.
 * Set `spotifyPlaylistId` (the part after /playlist/ in a Spotify link) to show
 * a playable Spotify embed at the top of the page.
 */

export interface Track {
  title: string;
  artist: string;
  note?: string;
  link?: string;
}

export interface Mix {
  title: string;
  note?: string;
  tracks: Track[];
}

export const music: { spotifyPlaylistId: string | null; mixes: Mix[] } = {
  spotifyPlaylistId: null,
  mixes: [
    {
      title: 'For the climb',
      note: 'Steady tempo. Head down, spin.',
      tracks: [
        { title: 'Song title', artist: 'Artist', note: 'Why it works on a long climb.' },
        { title: 'Song title', artist: 'Artist' },
        { title: 'Song title', artist: 'Artist' },
      ],
    },
    {
      title: 'For the descent',
      note: 'Loud. One earbud, always.',
      tracks: [
        { title: 'Song title', artist: 'Artist', note: 'The drop hits right at the rock garden.' },
        { title: 'Song title', artist: 'Artist' },
      ],
    },
    {
      title: 'For coding',
      tracks: [
        { title: 'Album or song', artist: 'Artist', note: 'No lyrics, all focus.' },
        { title: 'Song title', artist: 'Artist' },
      ],
    },
  ],
};
