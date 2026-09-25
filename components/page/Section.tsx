import type { ReactNode } from 'react';
import styles from './Section.module.css';

/**
 * A titled block of page content. Use as many as you like inside <PageShell>.
 * `aside` puts the title in a left column on wide screens (good for resumes).
 */
export default function Section({
  title,
  note,
  aside = false,
  id,
  children,
}: {
  title: string;
  note?: ReactNode;
  aside?: boolean;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.section} data-aside={aside} id={id} aria-labelledby={id ? `${id}-title` : undefined}>
      <header className={styles.head}>
        <h2 className={styles.title} id={id ? `${id}-title` : undefined}>
          {title}
        </h2>
        {note && <p className={styles.note}>{note}</p>}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
