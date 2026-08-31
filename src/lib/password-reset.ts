'use client';

type ActionCodeSettings = { url: string; handleCodeInApp?: boolean };

export function getPasswordResetActionSettings(): ActionCodeSettings {
  if (typeof window === 'undefined') {
    throw new Error('Password reset links can only be created in the browser.');
  }

  return {
    url: `${window.location.origin}/reset-password`,
    handleCodeInApp: true,
  };
}

export function getAuthErrorMessage(error: unknown, fallback: string) {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
      return 'No account was found for that email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'auth/expired-action-code':
      return 'This reset link has expired. Please request a new one.';
    case 'auth/invalid-action-code':
      return 'This reset link is invalid or has already been used.';
    case 'auth/weak-password':
      return 'Choose a password with at least 6 characters.';
    default:
      return fallback;
  }
}
