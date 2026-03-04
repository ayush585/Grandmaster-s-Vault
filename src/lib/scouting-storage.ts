import type { FetchedGame, WeaknessReport, CachedGameEntry, CachedReport } from '@/types';

const IDB_NAME = 'grandmasters-vault';
const IDB_VERSION = 4;
const GAMES_CACHE_STORE = 'fetched_games_cache';
const REPORTS_STORE = 'scouting_reports';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function openScoutingIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      const oldVersion = (e as IDBVersionChangeEvent).oldVersion;

      // Version 1 – main games store
      if (oldVersion < 1) {
        const store = db.createObjectStore('games', { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('savedAt', 'savedAt', { unique: false });
      }
      if (oldVersion < 2) {
        const tx = (e.target as IDBOpenDBRequest).transaction!;
        const store = tx.objectStore('games');
        if (!store.indexNames.contains('userId')) {
          store.createIndex('userId', 'userId', { unique: false });
        }
        if (!store.indexNames.contains('savedAt')) {
          store.createIndex('savedAt', 'savedAt', { unique: false });
        }
      }
      if (oldVersion < 3) {
        const tx = (e.target as IDBOpenDBRequest).transaction!;
        const store = tx.objectStore('games');
        if (!store.indexNames.contains('date')) {
          store.createIndex('date', 'date', { unique: false });
        }
      }
      // Version 4 – scouting stores
      if (oldVersion < 4) {
        if (!db.objectStoreNames.contains(GAMES_CACHE_STORE)) {
          const cacheStore = db.createObjectStore(GAMES_CACHE_STORE, { keyPath: 'id' });
          cacheStore.createIndex('platform', 'platform', { unique: false });
          cacheStore.createIndex('username', 'username', { unique: false });
          cacheStore.createIndex('fetchedAt', 'fetchedAt', { unique: false });
        }
        if (!db.objectStoreNames.contains(REPORTS_STORE)) {
          const reportStore = db.createObjectStore(REPORTS_STORE, { keyPath: 'id' });
          reportStore.createIndex('platform', 'platform', { unique: false });
          reportStore.createIndex('username', 'username', { unique: false });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ── Game cache ──────────────────────────────────────────────────────────────

export async function getCachedGames(
  platform: string,
  username: string
): Promise<FetchedGame[] | null> {
  const db = await openScoutingIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(GAMES_CACHE_STORE, 'readonly');
    const store = tx.objectStore(GAMES_CACHE_STORE);
    const index = store.index('username');
    const req = index.getAll(username.toLowerCase());

    req.onsuccess = () => {
      const entries = (req.result || []) as CachedGameEntry[];
      const valid = entries.filter(
        (e) =>
          e.platform === platform &&
          Date.now() - new Date(e.fetchedAt).getTime() < CACHE_TTL_MS
      );
      if (valid.length === 0) {
        resolve(null);
        return;
      }
      resolve(valid.map((e) => e.game));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function cacheGames(
  platform: string,
  username: string,
  games: FetchedGame[]
): Promise<void> {
  const db = await openScoutingIDB();
  const now = new Date().toISOString();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(GAMES_CACHE_STORE, 'readwrite');
    const store = tx.objectStore(GAMES_CACHE_STORE);

    for (const game of games) {
      const entry: CachedGameEntry = {
        id: `${platform}_${username.toLowerCase()}_${game.id}`,
        platform: platform as CachedGameEntry['platform'],
        username: username.toLowerCase(),
        game,
        fetchedAt: now,
      };
      store.put(entry);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Reports ─────────────────────────────────────────────────────────────────

export async function getCachedReport(
  platform: string,
  username: string
): Promise<WeaknessReport | null> {
  const db = await openScoutingIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(REPORTS_STORE, 'readonly');
    const id = `${platform}_${username.toLowerCase()}`;
    const req = tx.objectStore(REPORTS_STORE).get(id);
    req.onsuccess = () => {
      const entry = req.result as CachedReport | undefined;
      resolve(entry?.report || null);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveReport(
  platform: string,
  username: string,
  report: WeaknessReport
): Promise<void> {
  const db = await openScoutingIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(REPORTS_STORE, 'readwrite');
    const entry: CachedReport = {
      id: `${platform}_${username.toLowerCase()}`,
      platform: platform as CachedReport['platform'],
      username: username.toLowerCase(),
      report,
      savedAt: new Date().toISOString(),
    };
    tx.objectStore(REPORTS_STORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Cleanup expired cache ───────────────────────────────────────────────────

export async function cleanupExpiredCache(): Promise<void> {
  const db = await openScoutingIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(GAMES_CACHE_STORE, 'readwrite');
    const store = tx.objectStore(GAMES_CACHE_STORE);
    const req = store.getAll();

    req.onsuccess = () => {
      const entries = (req.result || []) as CachedGameEntry[];
      for (const entry of entries) {
        if (Date.now() - new Date(entry.fetchedAt).getTime() > CACHE_TTL_MS) {
          store.delete(entry.id);
        }
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
