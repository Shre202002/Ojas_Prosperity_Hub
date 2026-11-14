// Server-only: import this from API routes / server code, never from a client component.
import nodemailer, { type Transporter } from 'nodemailer';
import { BRAND } from '@/lib/brand';
import { SITE } from '@/lib/site-config';

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

/** Branded, marketing-friendly OTP email. The code is in the subject so it shows in inbox previews. */
export function otpEmail(code: string, minutes: number) {
  const base = (process.env.APP_URL || '').trim().replace(/\/+$/, '');
  const logo = /^https?:/.test(BRAND.logo) ? BRAND.logo : base ? `${base}${BRAND.logo}` : '';
  const subject = `${code} is your ${BRAND.short} OTP`;
  const support = [SITE.email, SITE.phone].filter(Boolean).join(' · ');
  const text = `${code} is your ${BRAND.name} one-time password (OTP).

It is valid for ${minutes} minutes. Never share this code with anyone, our team will never ask for it.

Welcome to the ${BRAND.short} family: authentic Ayurvedic and neuro-wellness formulations, a transparent binary network and KYC-verified payouts.${base ? `

Explore our products: ${base}/shop` : ''}

Didn't request this? You can safely ignore this email.`;
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f1f5f2">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">Your one-time password is ${code}. Valid for ${minutes} minutes.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f2;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
  <tr><td align="center" style="background:#0b7a55;padding:28px 24px">
    ${logo ? `<img src="${logo}" width="64" height="64" alt="${BRAND.short}" style="border-radius:50%;border:2px solid rgba(255,255,255,.6);display:block;margin:0 auto 12px">` : ''}
    <div style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:.3px">${BRAND.name}</div>
    <div style="color:#bbf7d0;font-size:14px;margin-top:4px">${BRAND.tagline}</div>
  </td></tr>
  <tr><td style="padding:32px 28px 8px">
    <h1 style="margin:0 0 8px;font-size:22px;color:#0b7a55">Welcome to the ${BRAND.short} family 🌿</h1>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#4b5563">Use this one-time password to finish joining us. It is valid for <b>${minutes} minutes</b>.</p>
  </td></tr>
  <tr><td align="center" style="padding:20px 28px">
    <div style="display:inline-block;border:2px dashed #0b7a55;background:#f0fdf4;border-radius:12px;padding:16px 28px;font-size:34px;font-weight:bold;letter-spacing:10px;color:#064e3b">${code}</div>
    <p style="margin:14px 0 0;font-size:12px;color:#6b7280">🔒 Never share this code with anyone. Our team will never ask for it.</p>
  </td></tr>
  <tr><td style="padding:8px 28px 4px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8faf9;border-radius:12px"><tr><td style="padding:18px 20px;font-size:14px;line-height:1.7;color:#374151">
      <b style="color:#0b7a55">Why members love ${BRAND.short}</b><br>
      🌱 Authentic Ayurvedic and neuro-wellness formulations<br>
      🔗 A transparent binary network with clear matching income<br>
      ✅ KYC-verified payouts and a full ledger you can audit
    </td></tr></table>
  </td></tr>
  ${base ? `<tr><td align="center" style="padding:22px 28px 8px"><a href="${base}/shop" style="display:inline-block;background:#0b7a55;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:13px 28px;border-radius:999px">Explore our products</a></td></tr>` : ''}
  <tr><td style="padding:22px 28px 28px;text-align:center;font-size:12px;line-height:1.6;color:#9ca3af">
    Didn't request this? You can safely ignore this email.<br>${support ? `${support}<br>` : ''}© ${new Date().getFullYear()} ${BRAND.legalName}
  </td></tr>
</table></td></tr></table></body></html>`;
  return { subject, text, html };
}
