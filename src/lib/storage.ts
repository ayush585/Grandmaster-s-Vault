import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { getDb, isFirebaseConfigured } from './firebase';
import type { GameData } from '@/types';

const IDB_NAME = 'grandmasters-vault';
const IDB_VERSION = 2;
const IDB_STORE = 'games';

// Rate limiting
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_WRITES_PER_WINDOW = 30;

const writeTimestamps: Map<string, number[]> = new Map();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = writeTimestamps.get(userId) || [];
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
  
  if (recent.length >= MAX_WRITES_PER_WINDOW) {
    console.warn('[Storage] Rate limit exceeded for user:', userId);
    return false;
  }
  
  recent.push(now);
  writeTimestamps.set(userId, recent);
  return true;
}

function cleanupOldTimestamps(): void {
  const now = Date.now();
  for (const [userId, timestamps] of writeTimestamps.entries()) {
    const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
    if (recent.length === 0) {
      writeTimestamps.delete(userId);
    } else {
      writeTimestamps.set(userId, recent);
    }
  }
}

if (typeof window !== 'undefined') {
  setInterval(cleanupOldTimestamps, RATE_LIMIT_WINDOW);
}

// IndexedDB helpers
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        const store = db.createObjectStore(IDB_STORE, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('savedAt', 'savedAt', { unique: false });
      } else {
        const tx = (e.target as IDBOpenDBRequest).transaction!;
        const store = tx.objectStore(IDB_STORE);
        if (!store.indexNames.contains('userId')) {
          store.createIndex('userId', 'userId', { unique: false });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function generateId(): string {
  return `game_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export function isCloudEnabled(): boolean {
  return isFirebaseConfigured();
}

function validateGameData(game: GameData): void {
  if (game.moves && game.fens) {
    if (game.fens.length !== game.moves.length + 1) {
      console.warn(`[Storage] Data integrity warning: fens.length (${game.fens.length}) should be moves.length + 1 (${game.moves.length + 1})`);
    }
  }
}

// Firestore path: users/{userId}/games/{gameId}
function userGamesCollection(userId: string) {
  const db = getDb();
  if (!db) return null;
  return collection(db, 'users', userId, 'games');
}

async function saveToIDB(game: GameData): Promise<string> {
  const idb = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(JSON.parse(JSON.stringify(game)));
    tx.oncomplete = () => resolve(game.id);
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveGame(game: GameData, userId: string): Promise<string> {
  if (!checkRateLimit(userId)) {
    throw new Error('Too many requests. Please wait a moment before saving again.');
  }

  game.id = game.id || generateId();
  game.savedAt = game.savedAt || new Date().toISOString();
  game.userId = userId;

  validateGameData(game);

  // Firebase — save to users/{userId}/games/{gameId}
  const col = userGamesCollection(userId);
  if (col) {
    try {
      await setDoc(doc(col, game.id), game);
    } catch (e) {
      console.warn('[Storage] Cloud save failed:', e);
    }
  }

  // IndexedDB with 1 retry
  try {
    return await saveToIDB(game);
  } catch (firstError) {
    console.warn('[Storage] First IDB save attempt failed, retrying:', firstError);
    try {
      await new Promise((r) => setTimeout(r, 200));
      return await saveToIDB(game);
    } catch (retryError) {
      throw new Error(`Failed to save game after retry: ${retryError}`);
    }
  }
}

export async function getGame(id: string, userId?: string): Promise<GameData | null> {
  // Try user's subcollection first
  if (userId) {
    const col = userGamesCollection(userId);
    if (col) {
      try {
        const snap = await getDoc(doc(col, id));
        if (snap.exists()) return snap.data() as GameData;
      } catch (e) {
        console.warn('[Storage] Cloud fetch failed:', e);
      }
    }
  }

  // Fallback to IndexedDB
  const idb = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllGames(userId?: string): Promise<GameData[]> {
  if (userId) {
    const col = userGamesCollection(userId);
    if (col) {
      try {
        const q = query(col, orderBy('savedAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map((d) => d.data() as GameData);
      } catch (e) {
        console.warn('[Storage] Cloud list failed, falling back to local:', e);
      }
    }
  }

  // Fallback to IndexedDB (filter by userId if provided)
  const idb = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).getAll();
    req.onsuccess = () => {
      let games = (req.result || []) as GameData[];
      if (userId) {
        games = games.filter((g) => g.userId === userId);
      }
      games.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
      resolve(games);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function searchGames(queryStr: string, userId?: string): Promise<GameData[]> {
  const all = await getAllGames(userId);
  if (!queryStr?.trim()) return all;
  const q = queryStr.toLowerCase().trim();
  return all.filter(
    (g) =>
      g.whiteName?.toLowerCase().includes(q) ||
      g.blackName?.toLowerCase().includes(q) ||
      g.tournament?.toLowerCase().includes(q) ||
      g.date?.includes(q) ||
      g.timeControl?.toLowerCase().includes(q)
  );
}

export async function deleteGame(id: string, userId?: string): Promise<void> {
  if (userId) {
    if (!checkRateLimit(userId)) {
      throw new Error('Too many requests. Please wait a moment before trying again.');
    }

    const col = userGamesCollection(userId);
    if (col) {
      try {
        await deleteDoc(doc(col, id));
      } catch (e) {
        console.warn('[Storage] Cloud delete failed:', e);
      }
    }
  }

  const idb = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
