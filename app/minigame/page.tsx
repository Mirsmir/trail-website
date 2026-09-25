import type { Metadata } from 'next';
import PageShell from '@/components/page/PageShell';
import ui from '@/components/page/ui.module.css';
import { minigame } from '@/content/minigame';
import LogHop from './LogHop';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Current fav minigame' };

/*
 * TEMPLATE: the minigame page. See content/minigame.ts to swap in any game.
 */
export default function MinigamePage() {
  return (
    <PageShell slug="minigame">
      <div className={styles.head}>
        <h2 className={styles.gameTitle}>{minigame.title}</h2>
        <p className={styles.blurb}>{minigame.blurb}</p>
      </div>

      {minigame.embedUrl ? (
        <div className={styles.embed}>
          <iframe src={minigame.embedUrl} title={minigame.title} allow="autoplay; fullscreen; gamepad" loading="lazy" />
        </div>
      ) : (
        <LogHop />
      )}

      <div className={styles.foot}>
        <p className={styles.how}>{minigame.howToPlay}</p>
        {minigame.link && (
          <a className={ui.button} href={minigame.link} target="_blank" rel="noreferrer">
            Play the full game
          </a>
        )}
      </div>
    </PageShell>
  );
}
