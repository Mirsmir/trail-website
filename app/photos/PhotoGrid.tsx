'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Photo } from '@/content/photos';
import styles from './page.module.css';

export default function PhotoGrid({ photos }: { photos: Photo[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<number | null>(null);

  const show = useCallback((i: number) => {
    setOpen(i);
    const d = dialogRef.current;
    if (d && !d.open) d.showModal();
  }, []);

  const step = useCallback(
    (dir: 1 | -1) => setOpen((i) => (i === null ? i : (i + dir + photos.length) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    const onClose = () => setOpen(null);
    d.addEventListener('keydown', onKey);
    d.addEventListener('close', onClose);
    return () => {
      d.removeEventListener('keydown', onKey);
      d.removeEventListener('close', onClose);
    };
  }, [step]);

  const current = open === null ? null : photos[open];

  return (
    <>
      <ul className={styles.grid}>
        {photos.map((p, i) => (
          <li key={p.src} className={styles.cell}>
            <button type="button" className={styles.thumb} onClick={() => show(i)}>
              <Image
                src={p.src}
                alt={p.alt}
                width={p.width}
                height={p.height}
                sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 380px"
              />
            </button>
            {p.caption && <p className={styles.caption}>{p.caption}</p>}
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        className={styles.lightbox}
        aria-label="Photo viewer"
        onClick={(e) => e.target === e.currentTarget && dialogRef.current?.close()}
      >
        {current && (
          <figure className={styles.figure}>
            <Image
              key={current.src}
              src={current.src}
              alt={current.alt}
              width={current.width}
              height={current.height}
              sizes="92vw"
              className={styles.big}
              priority
            />
            <figcaption className={styles.bar}>
              <span>{current.caption}</span>
              <span className={styles.count}>
                {open! + 1} of {photos.length}
              </span>
            </figcaption>
          </figure>
        )}
        <button type="button" className={`${styles.nav} ${styles.navPrev}`} onClick={() => step(-1)} aria-label="Previous photo">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <button type="button" className={`${styles.nav} ${styles.navNext}`} onClick={() => step(1)} aria-label="Next photo">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button type="button" className={styles.close} onClick={() => dialogRef.current?.close()}>
          Close
        </button>
      </dialog>
    </>
  );
}
