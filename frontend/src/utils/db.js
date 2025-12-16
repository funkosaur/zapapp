import { openDB } from 'idb';

const DB_NAME = 'zapapp-db';
const DB_VERSION = 2;
const PENDING_STORE = 'pending-sightings';
const CACHE_STORE = 'cached-sightings';

/**
 * Initialize IndexedDB database for offline storage
 */
export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Create pending sightings store
      if (!db.objectStoreNames.contains(PENDING_STORE)) {
        const pendingStore = db.createObjectStore(PENDING_STORE, {
          keyPath: 'id',
          autoIncrement: true
        });
        pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Create cached sightings store (v2)
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        const cacheStore = db.createObjectStore(CACHE_STORE, {
          keyPath: 'id'
        });
        cacheStore.createIndex('created_at', 'created_at', { unique: false });
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
  const tx = db.transaction(PENDING_STORE, 'readwrite');
  const store = tx.objectStore(PENDING_STORE);

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
  const tx = db.transaction(PENDING_STORE, 'readonly');
  const store = tx.objectStore(PENDING_STORE);

  return store.getAll();
};

/**
 * Delete a pending sighting after successful upload
 * @param {number} id - ID of the sighting to delete
 */
export const deletePendingSighting = async (id) => {
  const db = await initDB();
  const tx = db.transaction(PENDING_STORE, 'readwrite');
  const store = tx.objectStore(PENDING_STORE);

  await store.delete(id);
  await tx.done;
};

/**
 * Clear all pending sightings
 */
export const clearPendingSightings = async () => {
  const db = await initDB();
  const tx = db.transaction(PENDING_STORE, 'readwrite');
  const store = tx.objectStore(PENDING_STORE);

  await store.clear();
  await tx.done;
};

// ============================================
// Cached Sightings Functions (for offline browsing)
// ============================================

/**
 * Cache sightings from API for offline viewing
 * Relies on service worker to cache images separately
 * @param {Array} sightings - Array of sightings to cache
 */
export const cacheSightings = async (sightings) => {
  const db = await initDB();
  const tx = db.transaction(CACHE_STORE, 'readwrite');
  const store = tx.objectStore(CACHE_STORE);

  // Clear old cache
  await store.clear();

  // Add new sightings (service worker will cache images when they load)
  for (const sighting of sightings) {
    await store.put(sighting);
  }

  await tx.done;
};

/**
 * Get cached sightings from IndexedDB
 * @returns {Array} Array of cached sightings
 */
export const getCachedSightings = async () => {
  const db = await initDB();
  const tx = db.transaction(CACHE_STORE, 'readonly');
  const store = tx.objectStore(CACHE_STORE);

  const sightings = await store.getAll();

  // Sort by created_at descending (newest first)
  return sightings.sort((a, b) =>
    new Date(b.created_at) - new Date(a.created_at)
  );
};
