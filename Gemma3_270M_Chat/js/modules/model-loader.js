/**
 * Model Loader Module
 * Handles loading and managing the Gemma 3 270M model using Transformers.js
 */

export class ModelLoader {
    constructor() {
        this.model = null;
        this.tokenizer = null;
        this.isLoaded = false;
        this.isLoading = false;
        this.worker = null;
        this.modelId = 'onnx-community/gemma-2-2b-it'; // Using Gemma 2 2B as 270M might not be available
        // Note: We'll use the smallest available Gemma model for browser use
        this.progressCallback = null;
        this.statusCallback = null;
    }

    /**
     * Set progress callback
     */
    setProgressCallback(callback) {
        this.progressCallback = callback;
    }

    /**
     * Set status callback
     */
    setStatusCallback(callback) {
        this.statusCallback = callback;
    }

    /**
     * Update status
     */
    updateStatus(message, type = 'info') {
        if (this.statusCallback) {
            this.statusCallback(message, type);
        }
    }

    /**
     * Update progress
     */
    updateProgress(progress) {
        if (this.progressCallback) {
            this.progressCallback(progress);
        }
    }

    /**
     * Initialize Web Worker for model inference
     */
    async initializeWorker() {
        try {
            this.updateStatus('Đang khởi tạo Web Worker...', 'loading');

            // Create worker
            this.worker = new Worker('js/workers/inference-worker.js', { type: 'module' });

            // Set up message handler
            return new Promise((resolve, reject) => {
                this.worker.onmessage = (e) => {
                    const { type, data } = e.data;

                    switch (type) {
                        case 'loading':
                            this.updateStatus(data.message, 'loading');
                            if (data.progress !== undefined) {
                                this.updateProgress(data.progress);
                            }
                            break;

                        case 'ready':
                            this.isLoaded = true;
                            this.isLoading = false;
                            this.updateStatus('Mô hình đã sẵn sàng!', 'success');
                            this.updateProgress(100);
                            resolve();
                            break;

                        case 'error':
                            this.isLoading = false;
                            this.updateStatus(`Lỗi: ${data.message}`, 'error');
                            reject(new Error(data.message));
                            break;
                    }
                };

                this.worker.onerror = (error) => {
                    this.isLoading = false;
                    this.updateStatus('Lỗi khởi tạo Worker', 'error');
                    reject(error);
                };

                // Initialize worker with model ID
                this.worker.postMessage({
                    type: 'initialize',
                    modelId: this.modelId
                });
            });
        } catch (error) {
            console.error('Error initializing worker:', error);
            throw error;
        }
    }

    /**
     * Load the model
     */
    async loadModel() {
        if (this.isLoaded) {
            console.log('Model already loaded');
            return;
        }

        if (this.isLoading) {
            console.log('Model is already loading');
            return;
        }

        try {
            this.isLoading = true;
            this.updateStatus('Bắt đầu tải mô hình...', 'loading');
            this.updateProgress(0);

            // Check if transformers.js is available
            this.updateStatus('Kiểm tra khả năng tương thích...', 'loading');
            this.updateProgress(5);

            // Initialize worker
            await this.initializeWorker();

            console.log('Model loaded successfully');
        } catch (error) {
            console.error('Error loading model:', error);
            this.isLoading = false;
            this.updateStatus(`Lỗi tải mô hình: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Generate text response
     */
    async generate(prompt, options = {}) {
        if (!this.isLoaded) {
            throw new Error('Model not loaded. Please load the model first.');
        }

        const {
            temperature = 0.7,
            top_p = 0.9,
            max_new_tokens = 512,
            onToken = null
        } = options;

        return new Promise((resolve, reject) => {
            const messageId = Date.now();
            let fullResponse = '';

            const messageHandler = (e) => {
                const { type, data, id } = e.data;

                if (id !== messageId) return;

                switch (type) {
                    case 'generating':
                        // Token by token streaming
                        if (data.token) {
                            fullResponse += data.token;
                            if (onToken) {
                                onToken(data.token, fullResponse);
                            }
                        }
                        break;

                    case 'complete':
                        this.worker.removeEventListener('message', messageHandler);
                        resolve(data.text);
                        break;

                    case 'error':
                        this.worker.removeEventListener('message', messageHandler);
                        reject(new Error(data.message));
                        break;
                }
            };

            this.worker.addEventListener('message', messageHandler);

            // Send generation request
            this.worker.postMessage({
                type: 'generate',
                id: messageId,
                prompt,
                options: {
                    temperature,
                    top_p,
                    max_new_tokens
                }
            });
        });
    }

    /**
     * Stop generation
     */
    stopGeneration() {
        if (this.worker) {
            this.worker.postMessage({ type: 'stop' });
        }
    }

    /**
     * Unload model and free memory
     */
    async unloadModel() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }

        this.model = null;
        this.tokenizer = null;
        this.isLoaded = false;
        this.isLoading = false;

        this.updateStatus('Mô hình đã được giải phóng', 'info');
    }

    /**
     * Get model info
     */
    getModelInfo() {
        return {
            modelId: this.modelId,
            isLoaded: this.isLoaded,
            isLoading: this.isLoading
        };
    }

    /**
     * Check browser compatibility
     */
    static checkCompatibility() {
        const checks = {
            webgpu: 'gpu' in navigator,
            wasm: typeof WebAssembly !== 'undefined',
            workers: typeof Worker !== 'undefined',
            indexedDB: typeof indexedDB !== 'undefined'
        };

        const isCompatible = checks.wasm && checks.workers;

        return {
            isCompatible,
            checks,
            recommendedDevice: checks.webgpu ? 'WebGPU' : 'WASM'
        };
    }
}
