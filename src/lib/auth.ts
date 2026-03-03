import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import { getAuth } from './firebase';

export async function signIn(email: string, password: string): Promise<User> {
  const auth = getAuth();
  if (!auth) throw new Error('Firebase is not configured');
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signUp(email: string, password: string, displayName: string): Promise<User> {
  const auth = getAuth();
  if (!auth) throw new Error('Firebase is not configured');
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  return cred.user;
}

export async function signOutUser(): Promise<void> {
  const auth = getAuth();
  if (!auth) return;
  await signOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void): Unsubscribe | null {
  const auth = getAuth();
  if (!auth) {
    callback(null);
    return null;
  }
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): User | null {
  const auth = getAuth();
  return auth?.currentUser ?? null;
}
