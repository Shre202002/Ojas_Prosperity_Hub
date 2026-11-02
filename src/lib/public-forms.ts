// Helpers shared by the public (unauthenticated) form endpoints: contact messages and order enquiries.
import { createHash } from 'crypto';
import type { NextRequest } from 'next/server';

export const clientIp = (request: NextRequest) =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';

// Only a hash of the address is stored: enough to rate-limit, not enough to identify someone later.
export const hashIp = (ip: string) => createHash('sha256').update(`sjapl:${ip}`).digest('hex').slice(0, 32);

export const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

export const HOUR_MS = 60 * 60 * 1000;

/** Short human-readable reference such as ENQ-LX3K9-4F2A. */
export const makeReference = (prefix: string) =>
  `${prefix}-${Date.now().toString(36).toUpperCase().slice(-5)}-${createHash('sha256').update(String(Math.random())).digest('hex').slice(0, 4).toUpperCase()}`;

export const PHONE_PATTERN = /^\+?[\d\s-]{8,16}$/;
