import type { Metadata } from 'next';
import PageShell from '@/components/page/PageShell';
import Section from '@/components/page/Section';
import ui from '@/components/page/ui.module.css';
import { resume } from '@/content/resume';
import { site } from '@/content/site';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Resume' };

/*
 * TEMPLATE: the resume page. All the words live in content/resume.ts.
 * It also prints cleanly (Ctrl/Cmd+P) if someone wants paper.
 */
export default function ResumePage() {
  return (
    <PageShell
      slug="resume"
      actions={
        site.resumePdf ? (
          <a className={`${ui.button} ${ui.primary}`} href={site.resumePdf} download>
            Download PDF
          </a>
        ) : undefined
      }
    >
      <p className={styles.summary}>{resume.summary}</p>

      <Section title="Experience" id="experience" aside>
        <ol className={styles.jobs}>
          {resume.experience.map((job) => (
            <li key={`${job.company}-${job.role}-${job.start}`} className={styles.job}>
              <p className={styles.when}>
                {job.start}
                {job.end !== job.start && <> to {job.end ?? 'now'}</>}
              </p>
              <div>
                <h3 className={styles.role}>{job.role}</h3>
                <p className={styles.company}>
                  {job.company}
                  {job.where && <span className={styles.where}>, {job.where}</span>}
                </p>
                {job.summary && <p className={styles.jobSummary}>{job.summary}</p>}
                <ul className={styles.bullets}>
                  {job.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
                {job.tags && (
                  <ul className={ui.tags}>
                    {job.tags.map((t) => (
                      <li key={t} className={ui.tag}>
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Projects" id="projects" aside>
        <div className={styles.projects}>
          {resume.projects.map((p) => (
            <article key={p.name} className={styles.project}>
              <h3 className={styles.projectName}>
                {p.link ? (
                  <a href={p.link} target="_blank" rel="noreferrer">
                    {p.name}
                  </a>
                ) : (
                  p.name
                )}
              </h3>
              <p>{p.blurb}</p>
              <ul className={ui.tags}>
                {p.stack.map((t) => (
                  <li key={t} className={ui.tag}>
                    {t}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Skills" id="skills" aside>
        <dl className={styles.skills}>
          {resume.skills.map((s) => (
            <div key={s.group} className={styles.skillRow}>
              <dt>{s.group}</dt>
              <dd>{s.items.join(', ')}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Education" id="education" aside>
        {resume.education.map((e) => (
          <div key={e.school} className={styles.edu}>
            <h3 className={styles.role}>{e.credential}</h3>
            <p className={styles.company}>
              {e.school}
              <span className={styles.where}>, {e.years}</span>
            </p>
            {e.notes && <p className={styles.jobSummary}>{e.notes}</p>}
          </div>
        ))}
      </Section>
    </PageShell>
  );
}
