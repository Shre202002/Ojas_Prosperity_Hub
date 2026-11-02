import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { collection } from '@/lib/mongodb';
import { sendMail } from '@/lib/mailer';
import { storeInbox } from '@/lib/site-config';
import { HOUR_MS, PHONE_PATTERN, clientIp, escapeHtml, hashIp, makeReference } from '@/lib/public-forms';

export const runtime = 'nodejs';

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(80),
  email: z.string().trim().email('Enter a valid email address.').max(120),
  phone: z.string().trim().regex(PHONE_PATTERN, 'Enter a valid phone number.').optional().or(z.literal('')),
  message: z.string().trim().min(10, 'Write at least a sentence so we can help.').max(2000),
  website: z.string().optional(), // honeypot
});

const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return fail('Send the message as JSON.');
  if (typeof body.website === 'string' && body.website.trim()) return NextResponse.json({ ref: 'MSG-RECEIVED' });

  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message || 'Check the details and try again.');
  const { name, email, phone, message } = parsed.data;

  const store = await collection<any>('contactMessages');
  const ipHash = hashIp(clientIp(request));
  if ((await store.countDocuments({ ipHash, createdAt: { $gte: new Date(Date.now() - HOUR_MS) } })) >= 5) {
    return fail('You have sent several messages recently. Please wait a while and try again.', 429);
  }

  const ref = makeReference('MSG');
  await store.insertOne({ ref, name, email, phone: phone || '', message, status: 'new', ipHash, createdAt: new Date() });

  const inbox = storeInbox();
  if (inbox) {
    const text = [`New message ${ref}`, '', `Name: ${name}`, `Email: ${email}`, `Phone: ${phone || '-'}`, '', message].join('\n');
    try { await sendMail({ to: inbox, subject: `Website message ${ref} from ${name}`, text, html: `<pre style="font-family:inherit;white-space:pre-wrap">${escapeHtml(text)}</pre>` }); }
    catch (error) { console.error('[contact] could not email the store:', error); }
  } else {
    console.info('[contact] STORE_EMAIL is not set; the message was saved to the database only.');
  }

  return NextResponse.json({ ref }, { status: 201 });
}
