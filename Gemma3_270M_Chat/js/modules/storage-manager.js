/**
 * Storage Manager Module
 * Handles data persistence using IndexedDB
 */

export class StorageManager {
    constructor() {
        this.dbName = 'GemmaChat';
        this.dbVersion = 1;
        this.db = null;
        this.stores = {
            chatHistory: 'chatHistory',
            settings: 'settings',
            sessions: 'sessions'
        };
    }

    /**
     * Initialize IndexedDB
     */
    async initialize() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Error opening database');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database opened successfully');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores if they don't exist
                if (!db.objectStoreNames.contains(this.stores.chatHistory)) {
                    db.createObjectStore(this.stores.chatHistory, { keyPath: 'id', autoIncrement: true });
                }

                if (!db.objectStoreNames.contains(this.stores.settings)) {
                    db.createObjectStore(this.stores.settings, { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains(this.stores.sessions)) {
                    db.createObjectStore(this.stores.sessions, { keyPath: 'id', autoIncrement: true });
                }

                console.log('Database upgraded successfully');
            };
        });
    }

    /**
     * Save chat history
     */
    async saveChatHistory(messages) {
        if (!this.db) {
            console.warn('Database not initialized');
            return;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.chatHistory], 'readwrite');
            const store = transaction.objectStore(this.stores.chatHistory);

            // Clear existing history
            const clearRequest = store.clear();

            clearRequest.onsuccess = () => {
                // Add all messages
                messages.forEach(message => {
                    store.add(message);
                });
            };

            transaction.oncomplete = () => {
                resolve();
            };

            transaction.onerror = () => {
                console.error('Error saving chat history');
                reject(transaction.error);
            };
        });
    }

    /**
     * Get chat history
     */
    async getChatHistory() {
        if (!this.db) {
            console.warn('Database not initialized');
            return [];
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.chatHistory], 'readonly');
            const store = transaction.objectStore(this.stores.chatHistory);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                console.error('Error getting chat history');
                reject(request.error);
            };
        });
    }

    /**
     * Clear chat history
     */
    async clearChatHistory() {
        if (!this.db) {
            console.warn('Database not initialized');
            return;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.chatHistory], 'readwrite');
            const store = transaction.objectStore(this.stores.chatHistory);
            const request = store.clear();

            request.onsuccess = () => {
                console.log('Chat history cleared');
                resolve();
            };

            request.onerror = () => {
                console.error('Error clearing chat history');
                reject(request.error);
            };
        });
    }

    /**
     * Save settings
     */
    async saveSettings(settings) {
        if (!this.db) {
            console.warn('Database not initialized');
            return;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.settings], 'readwrite');
            const store = transaction.objectStore(this.stores.settings);

            const settingsData = {
                id: 'app_settings',
                ...settings,
                updatedAt: new Date().toISOString()
            };

            const request = store.put(settingsData);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                console.error('Error saving settings');
                reject(request.error);
            };
        });
    }

    /**
     * Get settings
     */
    async getSettings() {
        if (!this.db) {
            console.warn('Database not initialized');
            return null;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.settings], 'readonly');
            const store = transaction.objectStore(this.stores.settings);
            const request = store.get('app_settings');

            request.onsuccess = () => {
                const result = request.result;
                if (result) {
                    // Remove metadata before returning
                    const { id, updatedAt, ...settings } = result;
                    resolve(settings);
                } else {
                    resolve(null);
                }
            };

            request.onerror = () => {
                console.error('Error getting settings');
                reject(request.error);
            };
        });
    }

    /**
     * Save session
     */
    async saveSession(session) {
        if (!this.db) {
            console.warn('Database not initialized');
            return;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.sessions], 'readwrite');
            const store = transaction.objectStore(this.stores.sessions);

            const sessionData = {
                ...session,
                savedAt: new Date().toISOString()
            };

            const request = store.add(sessionData);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('Error saving session');
                reject(request.error);
            };
        });
    }

    /**
     * Get all sessions
     */
    async getSessions() {
        if (!this.db) {
            console.warn('Database not initialized');
            return [];
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.sessions], 'readonly');
            const store = transaction.objectStore(this.stores.sessions);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                console.error('Error getting sessions');
                reject(request.error);
            };
        });
    }

    /**
     * Delete session
     */
    async deleteSession(sessionId) {
        if (!this.db) {
            console.warn('Database not initialized');
            return;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.sessions], 'readwrite');
            const store = transaction.objectStore(this.stores.sessions);
            const request = store.delete(sessionId);

            request.onsuccess = () => {
                console.log('Session deleted');
                resolve();
            };

            request.onerror = () => {
                console.error('Error deleting session');
                reject(request.error);
            };
        });
    }

    /**
     * Get storage usage
     */
    async getStorageUsage() {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            return {
                usage: estimate.usage,
                quota: estimate.quota,
                usageInMB: (estimate.usage / (1024 * 1024)).toFixed(2),
                quotaInMB: (estimate.quota / (1024 * 1024)).toFixed(2),
                percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(2)
            };
        }

        return null;
    }

    /**
     * Clear all data
     */
    async clearAllData() {
        if (!this.db) {
            console.warn('Database not initialized');
            return;
        }

        const stores = [this.stores.chatHistory, this.stores.settings, this.stores.sessions];

        return Promise.all(
            stores.map(storeName => {
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction([storeName], 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const request = store.clear();

                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            })
        );
    }

    /**
     * Export all data
     */
    async exportAllData() {
        const chatHistory = await this.getChatHistory();
        const settings = await this.getSettings();
        const sessions = await this.getSessions();

        return {
            chatHistory,
            settings,
            sessions,
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Import all data
     */
    async importAllData(data) {
        try {
            if (data.chatHistory) {
                await this.saveChatHistory(data.chatHistory);
            }

            if (data.settings) {
                await this.saveSettings(data.settings);
            }

            if (data.sessions) {
                for (const session of data.sessions) {
                    await this.saveSession(session);
                }
            }

            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    /**
     * Close database connection
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            console.log('Database closed');
        }
    }
}
