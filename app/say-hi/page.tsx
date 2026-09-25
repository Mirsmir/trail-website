import type { Metadata } from 'next';
import PageShell from '@/components/page/PageShell';
import { site } from '@/content/site';
import ContactForm from './ContactForm';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Say hi' };

/*
 * TEMPLATE: the contact page.
 * - The form posts to app/api/contact/route.ts. Hook that up to an email
 *   service (there's a Resend example in the file) and it's live.
 * - Links come from content/site.ts.
 */
export default function SayHiPage() {
  return (
    <PageShell slug="say-hi">
      <div className={styles.grid}>
        <ContactForm />

        <aside className={styles.direct}>
          <h2 className={styles.directTitle}>Or skip the form</h2>
          <a className={styles.email} href={`mailto:${site.email}`}>
            {site.email}
          </a>
          <ul className={styles.links}>
            {site.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noreferrer">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <p className={styles.fine}>I usually reply within a couple of days. Faster if it’s raining and I can’t ride.</p>
        </aside>
      </div>
    </PageShell>
  );
}
