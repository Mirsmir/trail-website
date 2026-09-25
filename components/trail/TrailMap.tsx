import type { RefObject } from 'react';
import GradeMark from '@/components/GradeMark';
import type { MapGeometry, Stop } from '@/lib/trail/stops';
import styles from './TrailMap.module.css';

interface Props {
  stops: Stop[];
  geo: MapGeometry;
  /** Index of the stop the rider is parked at, if any. */
  current: number | null;
  onSelect(index: number): void;
  mapRef: RefObject<HTMLElement | null>;
  columnRef: RefObject<HTMLDivElement | null>;
  riderRef: RefObject<HTMLSpanElement | null>;
  itemRefs: RefObject<(HTMLButtonElement | null)[]>;
}

const GRADE_STROKE: Record<string, string> = {
  green: 'var(--grade-green)',
  blue: 'var(--grade-blue)',
  black: 'var(--grade-black)',
  'double-black': 'var(--grade-black)',
  freeride: 'var(--grade-orange)',
};

/**
 * The side menu, drawn as a trail map. Items grow as the rider nears them
 * (driven every frame through the --e custom property), and clicking one rides
 * you there.
 */
export default function TrailMap({ stops, geo, current, onSelect, mapRef, columnRef, riderRef, itemRefs }: Props) {
  return (
    <nav ref={mapRef} className={styles.map} aria-label="Trail map">
      <div ref={columnRef} className={styles.column}>
        <svg
          className={styles.svg}
          viewBox={`0 0 ${geo.width} ${geo.height}`}
          preserveAspectRatio="none"
          aria-hidden
        >
          {geo.segments.map((d, i) => (
            <path key={`halo-${i}`} d={d} className={styles.halo} />
          ))}
          {geo.segments.map((d, i) => {
            const next = stops[i + 1];
            const stroke = next.kind === 'checkpoint' ? GRADE_STROKE[next.checkpoint.grade] : 'var(--birch)';
            return <path key={`line-${i}`} d={d} className={styles.line} style={{ stroke }} />;
          })}
        </svg>
        <span ref={riderRef} className={styles.rider} aria-hidden />
      </div>
      <div className={styles.straight} aria-hidden>
        <span className={styles.riderStraight} />
      </div>

      <ol className={styles.list}>
        {stops.map((stop, i) => {
          const p = geo.stops[i];
          return (
            <li key={stop.slug ?? 'trailhead'}>
              <button
                type="button"
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                className={styles.item}
                data-kind={stop.kind}
                style={
                  {
                    '--y': p.y / geo.height,
                    '--x': `${p.x}px`,
                    '--p': stop.at,
                  } as React.CSSProperties
                }
                aria-current={current === i ? 'location' : undefined}
                onClick={() => onSelect(i)}
              >
                <span className={styles.label}>{stop.label}</span>
                <span className={styles.marker}>
                  {stop.kind === 'checkpoint' ? <GradeMark grade={stop.checkpoint.grade} /> : <span className={styles.endpoint} />}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
