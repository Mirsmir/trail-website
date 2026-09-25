'use client';

import { useState, type FormEvent } from 'react';
import ui from '@/components/page/ui.module.css';
import styles from './page.module.css';

const TOPICS = ['A job', 'A project', 'Trail recommendations', 'Just saying hi'] as const;

type State = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'error'; message: string };

export default function ContactForm() {
  const [topic, setTopic] = useState<string>(TOPICS[0]);
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setState({ kind: 'sending' });
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, topic }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? 'Something went wrong.');
      form.reset();
      setState({ kind: 'sent' });
    } catch (err) {
      setState({ kind: 'error', message: err instanceof Error ? err.message : 'Something went wrong.' });
    }
  }

  if (state.kind === 'sent') {
    return (
      <div className={styles.sent} role="status">
        <p className={styles.sentTitle}>Message sent.</p>
        <p>Thanks for stopping. I’ll write back soon.</p>
        <button type="button" className={ui.button} onClick={() => setState({ kind: 'idle' })}>
          Send another
        </button>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate={false}>
      <fieldset className={styles.topics}>
        <legend className={styles.label}>What’s it about?</legend>
        <div className={styles.chips}>
          {TOPICS.map((t) => (
            <label key={t} className={styles.chip}>
              <input type="radio" name="topic-choice" value={t} checked={topic === t} onChange={() => setTopic(t)} />
              <span>{t}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className={styles.field}>
        <span className={styles.label}>Your name</span>
        <input name="name" required autoComplete="name" maxLength={120} />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Email</span>
        <input name="email" type="email" required autoComplete="email" maxLength={200} />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Message</span>
        <textarea name="message" required rows={6} maxLength={5000} />
      </label>

      {/* Spam trap: humans never see this field. */}
      <input className={styles.trap} name="website" tabIndex={-1} autoComplete="off" aria-hidden />

      <div className={styles.submitRow}>
        <button type="submit" className={`${ui.button} ${ui.primary}`} disabled={state.kind === 'sending'}>
          {state.kind === 'sending' ? 'Sending…' : 'Send message'}
        </button>
        {state.kind === 'error' && (
          <p className={styles.error} role="alert">
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
