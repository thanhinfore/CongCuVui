/**
 * Model Cache Module
 * Handles persistent caching of model files using Cache API and IndexedDB
 */

export class ModelCache {
    constructor() {
        this.cacheName = 'gemma-model-cache-v1';
        this.dbName = 'GemmaModelCache';
        this.dbVersion = 1;
        this.db = null;
        this.storeName = 'modelFiles';
    }

    /**
     * Initialize the cache system
     */
    async initialize() {
        try {
            // Initialize IndexedDB for metadata
            await this.initIndexedDB();
            console.log('Model cache initialized');
            return true;
        } catch (error) {
            console.error('Error initializing model cache:', error);
            return false;
        }
    }

    /**
     * Initialize IndexedDB for storing model metadata
     */
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Error opening cache database');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object store for model metadata
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, { keyPath: 'url' });
                    objectStore.createIndex('modelId', 'modelId', { unique: false });
                    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    /**
     * Intercept and cache fetch requests for model files
     */
    async cacheModelFile(url, response) {
        try {
            const cache = await caches.open(this.cacheName);

            // Clone response before caching (response can only be used once)
            await cache.put(url, response.clone());

            // Store metadata in IndexedDB
            await this.saveMetadata(url);

            console.log(`✓ Cached: ${url}`);
            return response;
        } catch (error) {
            console.error('Error caching model file:', error);
            return response;
        }
    }

    /**
     * Get cached model file
     */
    async getCachedFile(url) {
        try {
            const cache = await caches.open(this.cacheName);
            const cachedResponse = await cache.match(url);

            if (cachedResponse) {
                console.log(`✓ Using cached file: ${url}`);
                return cachedResponse;
            }

            return null;
        } catch (error) {
            console.error('Error getting cached file:', error);
            return null;
        }
    }

    /**
     * Save metadata about cached file
     */
    async saveMetadata(url) {
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            const metadata = {
                url,
                timestamp: Date.now(),
                cachedAt: new Date().toISOString()
            };

            const request = store.put(metadata);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all cached files metadata
     */
    async getAllCachedFiles() {
        if (!this.db) return [];

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Check if model is cached
     */
    async isModelCached(modelId) {
        try {
            const files = await this.getAllCachedFiles();
            return files.some(file => file.url.includes(modelId));
        } catch (error) {
            console.error('Error checking cache:', error);
            return false;
        }
    }

    /**
     * Clear all cached model files
     */
    async clearCache() {
        try {
            // Clear Cache API
            const deleted = await caches.delete(this.cacheName);

            // Clear IndexedDB metadata
            if (this.db) {
                await new Promise((resolve, reject) => {
                    const transaction = this.db.transaction([this.storeName], 'readwrite');
                    const store = transaction.objectStore(this.storeName);
                    const request = store.clear();

                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            }

            console.log('Model cache cleared');
            return deleted;
        } catch (error) {
            console.error('Error clearing cache:', error);
            return false;
        }
    }

    /**
     * Get cache size estimate
     */
    async getCacheSize() {
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
     * Custom fetch with caching
     * This intercepts fetch requests and caches model files
     */
    async fetchWithCache(url, options = {}) {
        try {
            // Check if file is already cached
            const cachedResponse = await this.getCachedFile(url);
            if (cachedResponse) {
                return cachedResponse;
            }

            // Fetch from network
            console.log(`Downloading: ${url}`);
            const response = await fetch(url, options);

            // Cache if successful
            if (response.ok) {
                return await this.cacheModelFile(url, response);
            }

            return response;
        } catch (error) {
            console.error('Error in fetchWithCache:', error);
            throw error;
        }
    }

    /**
     * Prefetch and cache model files
     */
    async prefetchModel(modelId) {
        try {
            console.log(`Prefetching model: ${modelId}`);

            // Common model file patterns from Hugging Face
            const baseUrl = `https://huggingface.co/${modelId}/resolve/main`;
            const files = [
                'config.json',
                'tokenizer.json',
                'tokenizer_config.json',
                'model.onnx',
                'model_quantized.onnx'
            ];

            const prefetchPromises = files.map(async (file) => {
                const url = `${baseUrl}/${file}`;
                try {
                    await this.fetchWithCache(url);
                } catch (error) {
                    // Some files might not exist, that's okay
                    console.log(`Skipped: ${file}`);
                }
            });

            await Promise.allSettled(prefetchPromises);
            console.log('Model prefetch completed');
        } catch (error) {
            console.error('Error prefetching model:', error);
        }
    }

    /**
     * Close database connection
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}

// Create singleton instance
export const modelCache = new ModelCache();
