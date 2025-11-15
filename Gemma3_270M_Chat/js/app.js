/**
 * Gemma 3 Chat Application
 * Main entry point
 */

import { ModelLoader } from './modules/model-loader.js';
import { ChatManager } from './modules/chat-manager.js';
import { UIController } from './modules/ui-controller.js';
import { SettingsManager } from './modules/settings-manager.js';
import { StorageManager } from './modules/storage-manager.js';

class GemmaChatApp {
    constructor() {
        this.storageManager = null;
        this.settingsManager = null;
        this.modelLoader = null;
        this.chatManager = null;
        this.uiController = null;
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            console.log('Initializing Gemma Chat App...');

            // Check browser compatibility
            this.checkCompatibility();

            // Initialize storage manager
            console.log('Initializing storage...');
            this.storageManager = new StorageManager();
            await this.storageManager.initialize();

            // Initialize settings manager
            console.log('Initializing settings...');
            this.settingsManager = new SettingsManager(this.storageManager);
            await this.settingsManager.initialize();

            // Initialize model loader
            console.log('Initializing model loader...');
            this.modelLoader = new ModelLoader();

            // Initialize chat manager
            console.log('Initializing chat manager...');
            this.chatManager = new ChatManager(
                this.modelLoader,
                this.storageManager,
                this.settingsManager
            );
            await this.chatManager.initialize();

            // Initialize UI controller
            console.log('Initializing UI...');
            this.uiController = new UIController(this.chatManager, this.settingsManager);
            this.uiController.initialize();

            // Set up model loader callbacks
            this.modelLoader.setProgressCallback((progress) => {
                this.uiController.updateProgress(progress);
            });

            this.modelLoader.setStatusCallback((message, type) => {
                this.uiController.updateModelStatus(message, type);
                if (type === 'success') {
                    this.settingsManager.updateModelStatusInfo('Đã tải');
                } else if (type === 'error') {
                    this.settingsManager.updateModelStatusInfo('Lỗi');
                }
            });

            // Set up chat manager performance callback
            this.chatManager.setPerformanceCallback((perfData) => {
                this.uiController.updatePerformanceStats(perfData);
            });

            // Load the model
            console.log('Loading Gemma model...');
            await this.modelLoader.loadModel();

            console.log('Gemma Chat App initialized successfully!');

        } catch (error) {
            console.error('Error initializing app:', error);
            this.showInitError(error);
        }
    }

    /**
     * Check browser compatibility
     */
    checkCompatibility() {
        const compatibility = ModelLoader.checkCompatibility();

        console.log('Browser compatibility:', compatibility);

        if (!compatibility.isCompatible) {
            const missingFeatures = [];

            if (!compatibility.checks.wasm) {
                missingFeatures.push('WebAssembly');
            }

            if (!compatibility.checks.workers) {
                missingFeatures.push('Web Workers');
            }

            throw new Error(
                `Trình duyệt của bạn không hỗ trợ các tính năng cần thiết: ${missingFeatures.join(', ')}. ` +
                `Vui lòng sử dụng trình duyệt hiện đại như Chrome, Firefox, hoặc Edge.`
            );
        }

        // Show recommended device in console
        console.log(`Recommended device: ${compatibility.recommendedDevice}`);
    }

    /**
     * Show initialization error
     */
    showInitError(error) {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.innerHTML = `
                <div class="error-message" style="max-width: 600px; margin: auto;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <strong>Lỗi khởi tạo ứng dụng</strong>
                        <p style="margin-top: 8px;">${error.message}</p>
                        <button onclick="location.reload()" style="margin-top: 16px; padding: 8px 16px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer;">
                            Tải lại trang
                        </button>
                    </div>
                </div>
            `;
        }

        const modelStatus = document.getElementById('modelStatus');
        if (modelStatus) {
            modelStatus.classList.add('error');
            document.getElementById('statusText').textContent = 'Lỗi khởi tạo';
        }
    }

    /**
     * Handle app cleanup on unload
     */
    cleanup() {
        console.log('Cleaning up...');

        if (this.modelLoader) {
            this.modelLoader.unloadModel();
        }

        if (this.storageManager) {
            this.storageManager.close();
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

async function initApp() {
    const app = new GemmaChatApp();
    await app.initialize();

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        app.cleanup();
    });

    // Make app globally accessible for debugging
    window.gemmaChatApp = app;
}

// Handle unhandled errors
window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

console.log('Gemma Chat App script loaded');
