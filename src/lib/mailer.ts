// Server-only: import this from API routes / server code, never from a client component.
import nodemailer, { type Transporter } from 'nodemailer';
import { BRAND } from '@/lib/brand';

type Mail = { to: string; subject: string; html: string; text: string };

const smtpConfigured = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

let transport: Transporter | undefined;
const getTransport = () =>
  (transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  }));

/** Sends an email through SMTP (Gmail by default). In local dev without SMTP settings it logs the message instead. */
export async function sendMail({ to, subject, html, text }: Mail) {
  if (!smtpConfigured()) {
    if (process.env.NODE_ENV === 'production') throw new Error('SMTP_USER and SMTP_PASS must be set to send email.');
    console.info(`[mailer] SMTP not configured, not sending. To: ${to} | ${subject}\n${text}`);
    return;
  }
  await getTransport().sendMail({
    from: process.env.SMTP_FROM || `${BRAND.name} <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text,
  });
}

export function passwordResetEmail(link: string, minutes: number) {
  const subject = `Reset your ${BRAND.short} password`;
  const text = `We received a request to reset your ${BRAND.name} password.\n\nOpen this link to choose a new password (valid for ${minutes} minutes):\n${link}\n\nIf you didn't ask for this, you can ignore this email; your password won't change.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#222">
  <h2 style="margin:0 0 12px">${BRAND.name}</h2>
  <p>We received a request to reset your password.</p>
  <p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#15803d;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">Choose a new password</a></p>
  <p style="font-size:13px;color:#555">This link is valid for ${minutes} minutes and can be used once. If the button doesn't work, paste this into your browser:<br><span style="word-break:break-all">${link}</span></p>
  <p style="font-size:13px;color:#555">If you didn't ask for this, you can ignore this email; your password won't change.</p>
</div>`;
  return { subject, text, html };
}
