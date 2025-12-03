import { Dataset, KPI } from '../types';

const DB_NAME = 'DataMindDB';
const STORE_NAME = 'active_session';
const DB_VERSION = 1;

// Interface for what we store
interface StoredSession {
  id: string; // key, usually 'current'
  dataset: Dataset;
  kpis: KPI[];
  charts: any[];
  timestamp: number;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

export const saveSession = async (dataset: Dataset, kpis: KPI[], charts: any[]): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const session: StoredSession = {
      id: 'current',
      dataset,
      kpis,
      charts,
      timestamp: Date.now()
    };

    store.put(session);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error("Failed to save session to IndexedDB:", error);
  }
};

export const loadSession = async (): Promise<StoredSession | null> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get('current');

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as StoredSession | null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to load session from IndexedDB:", error);
    return null;
  }
};

export const clearSession = async (): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete('current');

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error("Failed to clear session:", error);
  }
};
