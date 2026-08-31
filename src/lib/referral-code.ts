import { doc, getDoc } from './app-db';
type Firestore = unknown;

const REFERRAL_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomPart(length = 7) {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => REFERRAL_ALPHABET[value % REFERRAL_ALPHABET.length]).join('');
}

/** Creates a readable referral code and verifies it is unused before returning it. */
export async function createUniqueReferralCode(db: Firestore, prefix = 'OJAS') {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = `${prefix}-${randomPart()}`;
    const existing = await getDoc(doc(db, 'referralCodes', code));
    if (!existing.exists()) return code;
  }

  throw new Error('Unable to create a unique referral code. Please try again.');
}

export async function createUniqueReferralCodes(db: Firestore, prefix = 'OJAS') {
  const left = await createUniqueReferralCode(db, `${prefix}-L`);
  const right = await createUniqueReferralCode(db, `${prefix}-R`);
  return { left, right };
}
