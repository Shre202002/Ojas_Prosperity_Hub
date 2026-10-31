import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

export const hashPassword = (password: string, salt = randomBytes(16).toString('hex')) =>
  `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;

export const verifyPassword = (password: string, stored = '') => {
  const [salt, digest] = stored.split(':');
  return Boolean(salt && digest) && timingSafeEqual(Buffer.from(digest, 'hex'), scryptSync(password, salt, 64));
};
