/* =====================================================
   APP.JS - Main Application Entry Point
   ===================================================== */

import { ControlPanel } from './modules/controlPanel.js';
import { PreviewPanel } from './modules/previewPanel.js';
import { MobileHandler } from './modules/mobileHandler.js';
import { utils } from './modules/utils.js';

class ImageTextApp {
    constructor() {
        this.state = {
            imageFiles: [],
            images: [],
            minWidth: Infinity,
            isProcessing: false
        };

        this.components = {};
        this.initialized = false;
    }

    async init() {
        try {
            // Initialize DOM references
            this.initializeDOMReferences();

            // Initialize components
            this.components.controls = new ControlPanel(this.DOM, this.state);
            this.components.preview = new PreviewPanel(this.DOM, this.state);
            this.components.mobile = new MobileHandler();

            // Setup global methods
            this.setupGlobalMethods();

            // Initialize mobile if needed
            if (window.innerWidth <= 768) {
                this.components.mobile.init();
            }

            // Setup event listeners
            this.setupEventListeners();

            // Load saved settings
            this.loadSavedState();

            this.initialized = true;
            console.log('Image Text App initialized successfully');

        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    initializeDOMReferences() {
        // Cache all DOM references
        this.DOM = {
            // Inputs
            textInput: document.getElementById('textInput'),
            imageLoader: document.getElementById('imageLoader'),
            creditInput: document.getElementById('creditInput'),

            // Style controls
            fontSelect: document.getElementById('fontSelect'),
            colorPicker: document.getElementById('colorPicker'),
            subColorPicker: document.getElementById('subColorPicker'),
            positionPicker: document.getElementById('positionPicker'),

            // Background controls
            subtitleBgCheckbox: document.getElementById('subtitleBgCheckbox'),
            bgColorPicker: document.getElementById('bgColorPicker'),
            bgOpacity: document.getElementById('bgOpacity'),
            bgControls: document.getElementById('bgControls'),

            // Options
            repeatBackgroundCheckbox: document.getElementById('repeatBackgroundCheckbox'),

            // Containers
            uploadArea: document.getElementById('uploadArea'),
            canvasContainer: document.getElementById('canvasContainer'),

            // Buttons
            addTextButton: document.getElementById('addTextButton'),
            insertFooterText: document.getElementById('insertFooterText'),
            insertLineBreak: document.getElementById('insertLineBreak'),

            // Sections
            sections: {
                text: document.getElementById('textSection'),
                upload: document.getElementById('uploadSection'),
                style: document.getElementById('styleSection'),
                credit: document.getElementById('creditSection')
            }
        };

        // Validate DOM references
        const missing = Object.entries(this.DOM)
            .filter(([key, element]) => !element && key !== 'sections')
            .map(([key]) => key);

        if (missing.length > 0) {
            throw new Error(`Missing DOM elements: ${missing.join(', ')}`);
        }
    }

    setupGlobalMethods() {
        // Make render method globally available for other components
        window.renderImages = () => {
            if (this.components.preview) {
                this.components.preview.render();
            }
        };

        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.showError('An unexpected error occurred');
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showError('An unexpected error occurred');
        });
    }

    setupEventListeners() {
        // Window resize handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });

        // Visibility change handler
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.initialized) {
                // Save state when tab becomes visible
                this.saveState();
            }
        });

        // Before unload handler
        window.addEventListener('beforeunload', () => {
            if (this.state.images.length > 0 && !this.state.saved) {
                return 'You have unsaved work. Are you sure you want to leave?';
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S to save settings
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveState();
                this.showNotification('Settings saved');
            }

            // Ctrl/Cmd + Enter to add text
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                if (!this.DOM.addTextButton.disabled) {
                    this.DOM.addTextButton.click();
                }
            }
        });

        // Background controls toggle
        this.DOM.subtitleBgCheckbox.addEventListener('change', () => {
            this.DOM.bgControls.style.display =
                this.DOM.subtitleBgCheckbox.checked ? 'grid' : 'none';
        });

        // Opacity slider value update
        this.DOM.bgOpacity.addEventListener('input', (e) => {
            const value = e.target.value;
            const valueDisplay = e.target.nextElementSibling;
            if (valueDisplay) {
                valueDisplay.textContent = `${value}%`;
            }
        });

        // Helper buttons
        this.DOM.insertFooterText.addEventListener('click', () => {
            const footerText = '🍀\\nMỗi ảnh là một prompt: Nếu bạn muốn tìm hiểu sâu hơn về kiến thức trong bất kỳ tấm ảnh nào bên trên, hãy sao chép ảnh và thả vào ChatGPT để hỏi đáp trực tiếp. Đây chính là phương pháp học AI miễn phí hàng ngày mà chương trình Luyện AI xin dành tặng bạn!';
            this.insertTextAtCursor(footerText);
        });

        this.DOM.insertLineBreak.addEventListener('click', () => {
            this.insertTextAtCursor('\\n');
        });
    }

    insertTextAtCursor(text) {
        const textarea = this.DOM.textInput;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        textarea.value = value.substring(0, start) + text + value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        textarea.focus();

        // Trigger input event
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    handleResize() {
        const isMobile = window.innerWidth <= 768;

        if (isMobile && !this.components.mobile.initialized) {
            this.components.mobile.init();
        } else if (!isMobile && this.components.mobile.initialized) {
            this.components.mobile.destroy();
        }
    }

    saveState() {
        const state = {
            text: this.DOM.textInput.value,
            font: this.DOM.fontSelect.value,
            mainColor: this.DOM.colorPicker.value,
            subColor: this.DOM.subColorPicker.value,
            position: this.DOM.positionPicker.value,
            subtitleBg: this.DOM.subtitleBgCheckbox.checked,
            bgColor: this.DOM.bgColorPicker.value,
            bgOpacity: this.DOM.bgOpacity.value,
            repeatBackground: this.DOM.repeatBackgroundCheckbox.checked,
            credit: this.DOM.creditInput.value,
            lastSaved: new Date().toISOString()
        };

        try {
            localStorage.setItem('imageTextAppState', JSON.stringify(state));
            this.state.saved = true;
        } catch (error) {
            console.error('Failed to save state:', error);
        }
    }

    loadSavedState() {
        try {
            const saved = localStorage.getItem('imageTextAppState');
            if (!saved) return;

            const state = JSON.parse(saved);

            // Restore values
            if (state.text) this.DOM.textInput.value = state.text;
            if (state.font) this.DOM.fontSelect.value = state.font;
            if (state.mainColor) this.DOM.colorPicker.value = state.mainColor;
            if (state.subColor) this.DOM.subColorPicker.value = state.subColor;
            if (state.position) this.DOM.positionPicker.value = state.position;
            if (state.credit) this.DOM.creditInput.value = state.credit;

            this.DOM.subtitleBgCheckbox.checked = state.subtitleBg || false;
            this.DOM.bgColorPicker.value = state.bgColor || '#000000';
            this.DOM.bgOpacity.value = state.bgOpacity || '28';
            this.DOM.repeatBackgroundCheckbox.checked = state.repeatBackground || false;

            // Update UI
            this.DOM.bgControls.style.display = state.subtitleBg ? 'grid' : 'none';
            const opacityDisplay = this.DOM.bgOpacity.nextElementSibling;
            if (opacityDisplay) {
                opacityDisplay.textContent = `${state.bgOpacity || 28}%`;
            }

            console.log('State restored from:', state.lastSaved);

        } catch (error) {
            console.error('Failed to load saved state:', error);
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: ${type === 'error' ? 'var(--color-error)' : 'var(--color-success)'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new ImageTextApp();
    app.init();

    // Make app instance available globally for debugging
    window.imageTextApp = app;
});

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);