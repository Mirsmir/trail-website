import type { Metadata } from 'next';
import PageShell from '@/components/page/PageShell';
import Section from '@/components/page/Section';
import { favorites } from '@/content/favorites';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'My favorite things' };

/*
 * TEMPLATE: favourites. Edit content/favorites.ts.
 * Want pictures? Add an `image` field to Favorite and render a next/image here.
 */
export default function FavoritesPage() {
  return (
    <PageShell slug="favorites">
      {favorites.map((group) => (
        <Section key={group.title} title={group.title} note={group.note} aside>
          <ul className={styles.list}>
            {group.items.map((item) => (
              <li key={item.name} className={styles.item}>
                <h3 className={styles.name}>
                  {item.link ? (
                    <a href={item.link} target="_blank" rel="noreferrer">
                      {item.name}
                    </a>
                  ) : (
                    item.name
                  )}
                </h3>
                <p className={styles.why}>{item.why}</p>
              </li>
            ))}
          </ul>
        </Section>
      ))}
    </PageShell>
  );
}
