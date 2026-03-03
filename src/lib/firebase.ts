import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth as firebaseGetAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

export function isFirebaseConfigured(): boolean {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId);
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;

  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return app;
}

export function getDb(): Firestore | null {
  if (!isFirebaseConfigured()) return null;

  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;

  if (!db) {
    db = getFirestore(firebaseApp);
  }
  return db;
}

export function getAuth(): Auth | null {
  if (!isFirebaseConfigured()) return null;

  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;

  if (!auth) {
    auth = firebaseGetAuth(firebaseApp);
  }
  return auth;
}
