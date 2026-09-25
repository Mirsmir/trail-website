import type { Metadata } from 'next';
import Link from 'next/link';
import '@fontsource/anton/400.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource-variable/fraunces/standard.css';
import '@fontsource-variable/fraunces/standard-italic.css';
import '@fontsource-variable/inter-tight/index.css';
import GradeMark from '@/components/GradeMark';
import { checkpointBySlug, checkpoints, type Grade } from '@/content/checkpoints';
import { resume } from '@/content/resume';
import { site } from '@/content/site';
import SurveyLines from './SurveyLines';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Resume' };

/*
 * TEMPLATE: the resume page. All the words live in content/resume.ts.
 * It's styled like a trail survey sheet: contour lines, carved wood-grain
 * markers and a screen-printed forest. The pictures live in /public/resume.
 * It also prints cleanly (Ctrl/Cmd+P) if someone wants paper.
 */

/** Carved wood-grain blocks, one per section. */
const GRAIN = ['/resume/grain-1.png', '/resume/grain-2.png', '/resume/grain-3.png'];

/** Survey samples on the skills sheet. Swap in your own trail shots (square crops look best). */
const SAMPLES = [
  { src: '/resume/specimen-hardpack.jpg', label: 'Hardpack' },
  { src: '/resume/specimen-drivetrain-detail.jpg', label: 'Drivetrain' },
  { src: '/resume/specimen-scree.jpg', label: 'Scree' },
];

const GRADE_NAMES: Record<Grade, string> = {
  green: '',
  blue: '',
  black: '',
  'double-black': '',
  freeride: '',
};

const pad = (n: number) => String(n).padStart(2, '0');

function SectionHead({ n, title, elev }: { n: number; title: string; elev: string }) {
  return (
    <header className={styles.sectionHead}>
      <img className={styles.sectionGrain} src={GRAIN[(n - 1) % GRAIN.length]} alt="" width={212} height={213} />
      <div>
        <p className={styles.sectionMeta}>
          <span>Seg. {pad(n)}</span>
          <span>{elev}</span>
        </p>
        <h2 className={styles.sectionTitle} id={`${title.toLowerCase()}-title`}>
          {title}
        </h2>
      </div>
    </header>
  );
}

export default function ResumePage() {
  const cp = checkpointBySlug('resume');
  if (!cp) throw new Error('No checkpoint with slug "resume" in content/checkpoints.ts');
  const i = checkpoints.indexOf(cp);
  const prev = checkpoints[i - 1];
  const next = checkpoints[i + 1];

  // "The Atlantic Road" style stat row, worked out from content/resume.ts so it stays true.
  const years = resume.experience.map((j) => parseInt(j.start, 10)).filter((y) => !Number.isNaN(y));
  const toolCount = resume.skills.reduce((n, s) => n + s.items.length, 0);
  const stats = [
    years.length ? { big: String(Math.min(...years)), small: 'first ride on the clock' } : null,
    { big: `${resume.experience.length} stops`, small: 'on the work trail so far' },
    { big: `${resume.projects.length} builds`, small: 'shipped and still rolling' },
    { big: `${toolCount} tools`, small: 'packed in the hip bag' },
  ].filter((s) => s !== null);

  const [firstWord, ...rest] = cp.label.split(' ');

  return (
    <div className={styles.page}>
      {/* Depth: misty forest far back, survey lines in the middle, grain on top. */}
      <div className={styles.backdrop} aria-hidden />
      <SurveyLines className={styles.survey} />
      <div className={styles.grain} aria-hidden />

      <div className={styles.wrap}>
        <header className={styles.top}>
          <Link href={`/?at=${cp.slug}`} className={`${styles.board} ${styles.back}`}>
            Back to the trail
          </Link>
          <p className={styles.topMeta}>Trail survey / section {pad(i + 1)}</p>
          <Link href="/" className={styles.home}>
            {site.name}
          </Link>
        </header>

        <section className={styles.hero} aria-labelledby="resume-title">
          <p className={styles.spine} aria-hidden>
            {site.name}
          </p>

          <div className={styles.heroMain}>
            <p className={styles.grade}>
              <GradeMark grade={cp.grade} labelled />
              <span>{GRADE_NAMES[cp.grade]}</span>
            </p>
            <h1 className={styles.title} id="resume-title">
              <span className={styles.titleBig}>{firstWord}</span>
              {rest.length > 0 && <span className={styles.titleSerif}>{rest.join(' ')}.</span>}
            </h1>
            <p className={styles.intro}>{cp.intro}</p>

            <dl className={styles.coords}>
              <div>
                <dt>Jefferson</dt>
                <dd>
                  43.952° N
                  <br />
                  -79.421° W
                </dd>
              </div>
              <div>
                <dt>Elev.</dt>
                <dd>294 m</dd>
              </div>
            </dl>

            {site.resumePdf && (
              <div className={styles.actions}>
                <a className={styles.download} href={site.resumePdf} download>
                  Download PDF
                </a>
              </div>
            )}
          </div>

          <div className={styles.trunk} aria-hidden>
            {GRAIN.map((src) => (
              <img key={src} src={src} alt="" width={212} height={213} />
            ))}
            {/* <span className={styles.trunkSig}>“ride.”</span> */}
          </div>

          <aside className={styles.legend} aria-hidden>
            {/* <span className={styles.pill}></span> */}
            <span className={styles.year}>[{new Date().getFullYear()}]</span>
            <span className={styles.north}>
              <b>N</b>
              <svg viewBox="0 0 24 32">
                <path d="M12 1 22 31 12 23 2 31Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M12 1 12 23 2 31Z" fill="currentColor" />
              </svg>
            </span>
            {/* <svg viewBox="0 0 40 40" className={styles.icon}>
              <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <circle cx="20" cy="20" r="11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2 3" />
              <circle cx="20" cy="20" r="4" fill="none" stroke="currentColor" strokeWidth="1.4" />
            </svg> */}
            <span className={styles.checker} />
            {/* <svg viewBox="0 0 40 40" className={styles.icon}>
              <path d="M20 0v40M0 20h40" stroke="currentColor" strokeWidth="0.8" />
              <path d="M20 12 22 20 20 28 18 20Z" fill="currentColor" />
            </svg> */}
            <svg viewBox="0 0 20 16" className={styles.tri}>
              <path d="M0 0h20L10 16Z" fill="currentColor" />
            </svg>
          </aside>
        </section>

        <section className={styles.notes} aria-label="Summary">
          <p className={styles.kicker}>Field notes</p>
          <p className={styles.summary}>{resume.summary}</p>
          <p className={styles.byline}>by {site.name.toLowerCase()}</p>
        </section>

        <section className={styles.print} aria-label="At a glance">
          <ul className={styles.stats}>
            {stats.map((s) => (
              <li key={s.big}>
                <strong>{s.big}</strong>
                <span>{s.small}</span>
              </li>
            ))}
          </ul>
          <div className={styles.printArt} aria-hidden>
            <img src="/resume/trail-print.png" alt="" width={960} height={825} />
          </div>
        </section>

        <main className={styles.main}>
          <section className={styles.section} aria-labelledby="experience-title">
            <SectionHead n={1} title="Experience" elev="+860 m" />
            <ol className={styles.jobs}>
              {resume.experience.map((job, k) => (
                <li key={`${job.company}-${job.role}-${job.start}`} className={styles.job}>
                  <p className={styles.when}>
                    <span className={styles.waypoint} aria-hidden />
                    <span className={styles.wpId} aria-hidden>
                      WP-{pad(k + 1)}
                    </span>
                    {job.start}
                    {job.end !== job.start && <> to {job.end ?? 'now'}</>}
                  </p>
                  <div className={styles.card}>
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
                      <ul className={styles.tags}>
                        {job.tags.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.section} aria-labelledby="projects-title">
            <SectionHead n={2} title="Projects" elev="+720 m" />
            <div className={styles.projects}>
              {resume.projects.map((p, k) => (
                <article key={p.name} className={`${styles.card} ${styles.project}`}>
                  <p className={styles.projectNo} aria-hidden>
                    {pad(k + 1)}.
                  </p>
                  <h3 className={styles.projectName}>
                    {p.link ? (
                      <a href={p.link} target="_blank" rel="noreferrer">
                        {p.name}
                      </a>
                    ) : (
                      p.name
                    )}
                  </h3>
                  <p className={styles.projectBlurb}>{p.blurb}</p>
                  <ul className={styles.tags}>
                    {p.stack.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section className={`${styles.section} ${styles.sheet}`} aria-labelledby="skills-title">
            <SurveyLines className={styles.sheetLines} />
            <SectionHead n={3} title="Skills" elev="+540 m" />
            <dl className={styles.skills}>
              {resume.skills.map((s, k) => (
                <div key={s.group} className={styles.skillRow}>
                  <dt>
                    <span aria-hidden>{pad(k + 1)} / </span>
                    {s.group}
                  </dt>
                  <dd>{s.items.join(', ')}</dd>
                </div>
              ))}
            </dl>
            <div className={styles.samples} aria-hidden>
              {SAMPLES.map((s, k) => (
                <figure key={s.src} className={styles.sample}>
                  <img src={s.src} alt="" width={360} height={360} />
                  <figcaption>
                    <span>{pad(k + 1)}.</span>
                    <span>{s.label}</span>
                  </figcaption>
                </figure>
              ))}
              <p className={styles.gridRef}>
                Grid ref.
                <br />
                02 / X7 / 19
                <br />
                Zone 10U
              </p>
            </div>
          </section>

          <section className={styles.section} aria-labelledby="education-title">
            <SectionHead n={4} title="Education" elev="+380 m" />
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
          </section>
        </main>

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
          <span>Survey unit {pad(i + 1)}-A</span>
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
    </div>
  );
}
