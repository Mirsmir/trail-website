import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <main className={styles.wrap}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>You’re off the trail.</h1>
      <p className={styles.line}>This page doesn’t exist, or it got washed out in the last storm.</p>
      <Link href="/" className={styles.back}>
        Back to the trailhead
      </Link>
    </main>
  );
}
