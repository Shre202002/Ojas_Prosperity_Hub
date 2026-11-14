'use client';

// Phone OTP via Firebase Phone Auth. Firebase is used only to send/check the SMS code; our server verifies the
// resulting ID token (see /api/auth/verify-phone). To switch providers later, reimplement sendOtp/confirmOtp only.
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, signOut, type ConfirmationResult } from 'firebase/auth';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isOtpConfigured = () => Boolean(config.apiKey && config.projectId && config.appId);

let verifier: RecaptchaVerifier | null = null;
let confirmation: ConfirmationResult | null = null;

const auth = () => getAuth(getApps().length ? getApp() : initializeApp(config));

export async function sendOtp(phone: string, containerId: string) {
  if (!isOtpConfigured()) throw new Error('Phone verification is not configured yet.');
  verifier?.clear();
  verifier = new RecaptchaVerifier(auth(), containerId, { size: 'invisible' });
  try {
    confirmation = await signInWithPhoneNumber(auth(), phone, verifier);
  } catch (error) {
    verifier?.clear(); verifier = null;
    throw error;
  }
}

/** Confirms the SMS code and returns a Firebase ID token for the server to verify. */
export async function confirmOtp(code: string) {
  if (!confirmation) throw new Error('Please request a new code.');
  const credential = await confirmation.confirm(code);
  const idToken = await credential.user.getIdToken();
  await signOut(auth()).catch(() => undefined); // Firebase session is not used for login
  return idToken;
}

export function otpErrorMessage(error: any) {
  switch (error?.code) {
    case 'auth/invalid-verification-code': return 'That code is incorrect. Please try again.';
    case 'auth/code-expired': return 'This code has expired. Request a new one.';
    case 'auth/too-many-requests': return 'Too many attempts. Please wait a few minutes and try again.';
    case 'auth/invalid-phone-number': return 'This phone number is not valid.';
    case 'auth/quota-exceeded': return 'SMS limit reached. Please try again later.';
    default: return error?.message || 'Could not verify the phone number.';
  }
}
