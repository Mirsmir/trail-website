import { NextResponse } from 'next/server';

/*
 * TEMPLATE: receives the "Say hi" form.
 *
 * Right now it validates the message and logs it on the server. To get real
 * emails, pick a provider and replace the TODO below. For example with Resend
 * (npm i resend, then set RESEND_API_KEY in .env.local):
 *
 *   import { Resend } from 'resend';
 *   const resend = new Resend(process.env.RESEND_API_KEY);
 *   await resend.emails.send({
 *     from: 'Portfolio <hi@your-domain.com>',
 *     to: site.email,
 *     replyTo: email,
 *     subject: `${topic}: ${name}`,
 *     text: message,
 *   });
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const str = (k: string, max: number) => (typeof body[k] === 'string' ? (body[k] as string).trim().slice(0, max) : '');
  const name = str('name', 120);
  const email = str('email', 200);
  const message = str('message', 5000);
  const topic = str('topic', 60) || 'Message';

  // Bots fill in the hidden field. Pretend it worked.
  if (str('website', 200)) return NextResponse.json({ ok: true });

  if (!name || !message) return NextResponse.json({ error: 'Please add your name and a message.' }, { status: 400 });
  if (!EMAIL.test(email)) return NextResponse.json({ error: 'That email address doesn’t look right.' }, { status: 400 });

  // TODO: send it somewhere (see the comment at the top of this file).
  console.log('[contact]', { topic, name, email, message });

  return NextResponse.json({ ok: true });
}
