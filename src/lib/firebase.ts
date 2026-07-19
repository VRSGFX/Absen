// src/lib/firebase.ts
// Firebase is used ONLY for Authentication in this project.
// All application data (profiles, attendance, grades, announcements, events)
// lives in Supabase — see src/lib/supabase.ts

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

// Hardcoded fallback so the app still works even if the hosting
// environment doesn't pick up .env.local (e.g. some AI Studio preview
// setups only inject specific declared keys). If VITE_FIREBASE_* env
// vars ARE present, they take priority.
const FALLBACK_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyD29hI_0RGdjDVdWyssipioROOTNxrYpOw',
  authDomain: 'absensi-ca4e1.firebaseapp.com',
  projectId: 'absensi-ca4e1',
  storageBucket: 'absensi-ca4e1.firebasestorage.app',
  messagingSenderId: '489036105506',
  appId: '1:489036105506:web:310a1019ed7540ca7d877b',
  measurementId: 'G-D4HQ6ZC769',
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || FALLBACK_FIREBASE_CONFIG.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || FALLBACK_FIREBASE_CONFIG.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || FALLBACK_FIREBASE_CONFIG.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || FALLBACK_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || FALLBACK_FIREBASE_CONFIG.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || FALLBACK_FIREBASE_CONFIG.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || FALLBACK_FIREBASE_CONFIG.measurementId,
};

// Prevent re-initialization during HMR
export const firebaseApp: FirebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(firebaseApp);

/**
 * EduTrack logs users in with NISN/NIP instead of email.
 * Firebase Auth requires an email, so we derive a stable synthetic
 * email from the NISN/NIP: "<nisn>@edutrack.local".
 * This email is never shown to the user and is never emailed to.
 */
export function nisnToSyntheticEmail(nisn: string): string {
  const clean = nisn.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${clean}@edutrack.local`;
}
