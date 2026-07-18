
import * as admin from 'firebase-admin';

/**
 * Safe initialization of the Firebase Admin SDK.
 * Bypasses security rules for critical server-side operations.
 */
export function getFirebaseAdmin() {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
  return {
    db: admin.firestore(),
    auth: admin.auth(),
  };
}
