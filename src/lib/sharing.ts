import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { getDb } from './firebase';
import type { GameData } from '@/types';

const SHARED_COLLECTION = 'sharedGames';

export async function shareGame(game: GameData, userId: string): Promise<string> {
  if (game.userId !== userId) {
    throw new Error('You can only share your own games');
  }

  const db = getDb();
  if (!db) throw new Error('Firebase is not configured. Cannot share games without cloud storage.');

  const sharedData = {
    ...game,
    userId,
    sharedAt: new Date().toISOString(),
  };

  await setDoc(doc(collection(db, SHARED_COLLECTION), game.id), sharedData);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}/game/${game.id}`;
}

export async function getSharedGame(id: string): Promise<GameData | null> {
  const db = getDb();
  if (!db) return null;

  try {
    const snap = await getDoc(doc(collection(db, SHARED_COLLECTION), id));
    if (snap.exists()) return snap.data() as GameData;
  } catch (e) {
    console.warn('[Sharing] Failed to fetch shared game:', e);
  }
  return null;
}
