import { openDB } from 'idb';

const DB_NAME = 'zapapp-db';
const DB_VERSION = 1;
const STORE_NAME = 'pending-sightings';

/**
 * Initialize IndexedDB database for offline storage
 */
export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true
        });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    },
  });
};

/**
 * Save a sighting to IndexedDB for later upload
 * @param {Object} sighting - Sighting data to save
 */
export const savePendingSighting = async (sighting) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  await store.add({
    ...sighting,
    timestamp: Date.now(),
    synced: false
  });

  await tx.done;
};

/**
 * Get all pending sightings from IndexedDB
 * @returns {Array} Array of pending sightings
 */
export const getPendingSightings = async () => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);

  return store.getAll();
};

/**
 * Delete a pending sighting after successful upload
 * @param {number} id - ID of the sighting to delete
 */
export const deletePendingSighting = async (id) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  await store.delete(id);
  await tx.done;
};

/**
 * Clear all pending sightings
 */
export const clearPendingSightings = async () => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  await store.clear();
  await tx.done;
};
