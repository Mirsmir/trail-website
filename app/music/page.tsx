import type { Metadata } from 'next';
import PageShell from '@/components/page/PageShell';
import Section from '@/components/page/Section';
import { music } from '@/content/music';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Music' };

/*
 * TEMPLATE: music. Edit content/music.ts.
 */
export default function MusicPage() {
  return (
    <PageShell slug="music">
      {music.spotifyPlaylistId && (
        <div className={styles.player}>
          <iframe
            title="Spotify playlist"
            src={`https://open.spotify.com/embed/playlist/${music.spotifyPlaylistId}?theme=0`}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      )}

      {music.mixes.map((mix) => (
        <Section key={mix.title} title={mix.title} note={mix.note} aside>
          <ol className={styles.tracks}>
            {mix.tracks.map((t, i) => (
              <li key={`${t.title}-${t.artist}-${i}`} className={styles.track}>
                <span className={styles.num} aria-hidden>
                  {i + 1}
                </span>
                <div className={styles.meta}>
                  <p className={styles.title}>
                    {t.link ? (
                      <a href={t.link} target="_blank" rel="noreferrer">
                        {t.title}
                      </a>
                    ) : (
                      t.title
                    )}
                  </p>
                  <p className={styles.artist}>{t.artist}</p>
                </div>
                {t.note && <p className={styles.note}>{t.note}</p>}
              </li>
            ))}
          </ol>
        </Section>
      ))}
    </PageShell>
  );
}
