import Link from 'next/link';
import type { ReactNode } from 'react';
import GradeMark from '@/components/GradeMark';
import { checkpointBySlug, checkpoints, type Grade } from '@/content/checkpoints';
import { site } from '@/content/site';
import Contours from './Contours';
import styles from './PageShell.module.css';

const GRADE_NAMES: Record<Grade, string> = {
  green: 'Green circle. Easy going.',
  blue: 'Blue square. A bit more to it.',
  black: 'Black diamond. Steep and technical.',
  'double-black': 'Double black. Experts only.',
  freeride: 'Freeride. Just for fun.',
};

interface Props {
  /** Which checkpoint this page belongs to (see content/checkpoints.ts). */
  slug: string;
  children: ReactNode;
  /** Replace the intro line from checkpoints.ts with something richer. */
  intro?: ReactNode;
  /** Extra things in the header, like a download button. */
  actions?: ReactNode;
}

/**
 * The frame every subpage shares: back-to-trail sign, big title with the trail
 * grade, the page's content, and signs to the neighbouring stops.
 *
 * To make a new page: add a checkpoint in content/checkpoints.ts, then create
 * app/<slug>/page.tsx that returns <PageShell slug="<slug>">…</PageShell>.
 */
export default function PageShell({ slug, children, intro, actions }: Props) {
  const cp = checkpointBySlug(slug);
  if (!cp) throw new Error(`No checkpoint with slug "${slug}" in content/checkpoints.ts`);
  const i = checkpoints.indexOf(cp);
  const prev = checkpoints[i - 1];
  const next = checkpoints[i + 1];

  return (
    <div className={styles.shell} data-grade={cp.grade}>
      <Contours seed={slug} className={styles.contours} />

      <header className={styles.top}>
        <Link href={`/?at=${cp.slug}`} className={`${styles.board} ${styles.back}`}>
          Back to the trail
        </Link>
        <Link href="/" className={styles.home}>
          {site.name}
        </Link>
      </header>

      <div className={styles.hero}>
        <p className={styles.grade}>
          <GradeMark grade={cp.grade} labelled />
          <span>{GRADE_NAMES[cp.grade]}</span>
        </p>
        <h1 className={styles.title}>{cp.label}</h1>
        <div className={styles.intro}>{intro ?? <p>{cp.intro}</p>}</div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>

      <main className={styles.main}>{children}</main>

      <nav className={styles.onward} aria-label="Other stops">
        {prev ? (
          <Link href={prev.href} className={`${styles.board} ${styles.prev}`}>
            <span className={styles.boardKicker}>Previous stop</span>
            <span className={styles.boardName}>
              <GradeMark grade={prev.grade} />
              {prev.label}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={next.href} className={`${styles.board} ${styles.next}`}>
            <span className={styles.boardKicker}>Next stop</span>
            <span className={styles.boardName}>
              <GradeMark grade={next.grade} />
              {next.label}
            </span>
          </Link>
        ) : (
          <Link href="/?at=end" className={`${styles.board} ${styles.next}`}>
            <span className={styles.boardKicker}>That’s every stop</span>
            <span className={styles.boardName}>Ride to the end</span>
          </Link>
        )}
      </nav>

      <footer className={styles.footer}>
        <span>{site.name}</span>
        <span className={styles.footerLinks}>
          <a href={`mailto:${site.email}`}>{site.email}</a>
          {site.links.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noreferrer">
              {l.label}
            </a>
          ))}
        </span>
      </footer>
    </div>
  );
}
