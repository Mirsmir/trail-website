import type { Grade } from '@/content/checkpoints';
import styles from './GradeMark.module.css';

const NAMES: Record<Grade, string> = {
  green: 'Green circle',
  blue: 'Blue square',
  black: 'Black diamond',
  'double-black': 'Double black diamond',
  freeride: 'Freeride',
};

/** Trail difficulty symbol. Decorative unless `labelled` is set. */
export default function GradeMark({ grade, labelled = false }: { grade: Grade; labelled?: boolean }) {
  const a11y = labelled ? { role: 'img', 'aria-label': NAMES[grade] } : { 'aria-hidden': true };
  return (
    <span className={styles.mark} data-grade={grade} {...a11y}>
      <span className={styles.shape} />
      {grade === 'double-black' && <span className={styles.shape} />}
    </span>
  );
}
