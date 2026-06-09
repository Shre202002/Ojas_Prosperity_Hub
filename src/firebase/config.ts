'use client';

/**
 * Firebase Configuration
 * 
 * Validates that all required environment variables are present.
 * If variables are missing, it logs a clear error to the console.
 */

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Debug logging for environment variables (Remove in production)
if (process.env.NODE_ENV !== 'production') {
  console.log("Firebase Config Initialization", {
    apiKey: config.apiKey ? "PRESENT" : "MISSING",
    authDomain: config.authDomain ? "PRESENT" : "MISSING",
    projectId: config.projectId ? "PRESENT" : "MISSING",
  });
}

// Audit environment variables
const missingKeys = Object.entries(config)
  .filter(([_, value]) => !value)
  .map(([key]) => `NEXT_PUBLIC_FIREBASE_${key.replace(/[A-Z]/g, (m) => `_${m}`).toUpperCase()}`);

if (missingKeys.length > 0) {
  console.error("Firebase Configuration Error: Missing environment variables:", missingKeys.join(", "));
}

export const firebaseConfig = config;