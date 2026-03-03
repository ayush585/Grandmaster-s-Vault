import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { getDb } from './firebase';
import type { GameData } from '@/types';

const SHARED_COLLECTION = 'sharedGames';

const SHARE_RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_SHARES_PER_WINDOW = 10;
const MAX_READS_PER_WINDOW = 60;
const shareTimestamps: Map<string, number[]> = new Map();
const readTimestamps: Map<string, number[]> = new Map();

function checkShareRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = shareTimestamps.get(userId) || [];
  const recent = timestamps.filter(t => now - t < SHARE_RATE_LIMIT_WINDOW);
  
  if (recent.length >= MAX_SHARES_PER_WINDOW) {
    console.warn('[Sharing] Rate limit exceeded for user:', userId);
    return false;
  }
  
  recent.push(now);
  shareTimestamps.set(userId, recent);
  return true;
}

function checkReadRateLimit(): boolean {
  const now = Date.now();
  const clientKey = typeof navigator !== 'undefined' ? navigator.userAgent : 'anonymous';
  const timestamps = readTimestamps.get(clientKey) || [];
  const recent = timestamps.filter(t => now - t < SHARE_RATE_LIMIT_WINDOW);
  
  if (recent.length >= MAX_READS_PER_WINDOW) {
    console.warn('[Sharing] Read rate limit exceeded for client');
    return false;
  }
  
  recent.push(now);
  readTimestamps.set(clientKey, recent);
  return true;
}

export async function shareGame(game: GameData, userId: string): Promise<string> {
  if (game.userId !== userId) {
    throw new Error('You can only share your own games');
  }

  if (!checkShareRateLimit(userId)) {
    throw new Error('Too many share requests. Please wait a moment.');
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
  if (!checkReadRateLimit()) {
    console.warn('[Sharing] Read rate limit exceeded');
    return null;
  }

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
