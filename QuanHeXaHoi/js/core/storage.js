/**
 * Contact Map v7.5 - Storage Module
 * IndexedDB and localStorage handling
 */

import { STORAGE_KEYS } from './config.js';

const DB_NAME = 'ContactMapDB';
const DB_VERSION = 1;
const STORE_NAME = 'graphData';

let db = null;

/**
 * Initialize IndexedDB
 */
export function initIndexedDB() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            console.warn('IndexedDB not supported, falling back to localStorage');
            resolve(null);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('IndexedDB error:', request.error);
            resolve(null);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('IndexedDB initialized');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

/**
 * Save graph data to IndexedDB
 */
export function saveToIndexedDB(data) {
    return new Promise((resolve, reject) => {
        if (!db) {
            saveToLocalStorage(data);
            resolve();
            return;
        }

        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({ id: 'main', data });

        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error('Save error:', request.error);
            saveToLocalStorage(data);
            resolve();
        };
    });
}

/**
 * Load graph data from IndexedDB
 */
export function loadFromIndexedDB() {
    return new Promise((resolve, reject) => {
        if (!db) {
            resolve(loadFromLocalStorage());
            return;
        }

        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get('main');

        request.onsuccess = () => {
            if (request.result && request.result.data) {
                resolve(request.result.data);
            } else {
                resolve(loadFromLocalStorage());
            }
        };

        request.onerror = () => {
            console.error('Load error:', request.error);
            resolve(loadFromLocalStorage());
        };
    });
}

/**
 * Save to localStorage (fallback)
 */
export function saveToLocalStorage(data) {
    try {
        localStorage.setItem(STORAGE_KEYS.GRAPH_DATA, JSON.stringify(data));
    } catch (e) {
        console.error('LocalStorage save error:', e);
    }
}

/**
 * Load from localStorage (fallback)
 */
export function loadFromLocalStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.GRAPH_DATA);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('LocalStorage load error:', e);
        return null;
    }
}

/**
 * Clear all stored data
 */
export function clearStorage() {
    return new Promise((resolve) => {
        if (db) {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            store.delete('main');
        }
        localStorage.removeItem(STORAGE_KEYS.GRAPH_DATA);
        resolve();
    });
}

/**
 * Get storage type being used
 */
export function getStorageType() {
    return db ? 'IndexedDB' : 'localStorage';
}

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable() {
    return db !== null;
}
