/* =====================================================
   CONTROLPANEL.JS - Control Panel Module
   ===================================================== */

import { utils } from './utils.js';

export class ControlPanel {
    constructor(DOM, state) {
        this.DOM = DOM;
        this.state = state;
        this.sections = DOM.sections;

        this.initialize();
    }

    initialize() {
        // Setup event listeners
        this.setupEventListeners();

        // Setup drag and drop
        this.setupDragAndDrop();

        // Initialize sections
        this.initializeSections();

        // Load saved settings
        this.loadSettings();

        // Initialize font select style
        if (this.DOM.fontSelect) {
            this.DOM.fontSelect.style.fontFamily = this.DOM.fontSelect.value;
        }

        console.log('Control panel initialized');
    }

    setupEventListeners() {
        // Text input
        this.DOM.textInput.addEventListener('input', () => {
            this.handleTextInput();
        });

        // Image upload
        this.DOM.imageLoader.addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files);
        });

        // Style controls
        const styleControls = [
            this.DOM.fontSelect,
            this.DOM.colorPicker,
            this.DOM.subColorPicker,
            this.DOM.positionPicker,
            this.DOM.bgColorPicker,
            this.DOM.bgOpacity,
            this.DOM.subtitleBgCheckbox,
            this.DOM.repeatBackgroundCheckbox
        ];

        styleControls.forEach(control => {
            if (control) {
                control.addEventListener('change', () => {
                    // Special handling for font select
                    if (control === this.DOM.fontSelect) {
                        // Update the select element's font
                        control.style.fontFamily = control.value;
                    }

                    this.handleStyleChange();
                    this.saveSettings();
                });

                // For color pickers and range, also listen to input event
                if (control.type === 'color' || control.type === 'range') {
                    control.addEventListener('input', utils.debounce(() => {
                        this.handleStyleChange();
                    }, 100));
                }
            }
        });

        // Credit input
        this.DOM.creditInput.addEventListener('input', utils.debounce(() => {
            this.handleStyleChange();
            this.saveSettings();
        }, 500));

        // Add text button
        this.DOM.addTextButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleAddText();
        });
    }

    setupDragAndDrop() {
        const uploadArea = this.DOM.uploadArea;
        if (!uploadArea) return;

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, utils.events.preventDefault, false);
            document.body.addEventListener(eventName, utils.events.preventDefault, false);
        });

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('drag-over');
            }, false);
        });

        // Handle dropped files
        uploadArea.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files).filter(file =>
                utils.isValidImageFile(file)
            );

            if (files.length > 0) {
                this.handleImageUpload(files);
            } else {
                this.showNotification('Please drop only image files', 'error');
            }
        }, false);
    }

    initializeSections() {
        // Text section is always active
        this.sections.text.classList.add('active');

        // Check if we should activate other sections
        this.updateSectionsVisibility();
    }

    updateSectionsVisibility() {
        const hasText = this.DOM.textInput.value.trim() !== '';
        const hasImages = this.state.images.length > 0;

        // Upload section active when text is entered
        if (hasText) {
            this.sections.upload.classList.add('active');
        } else {
            this.sections.upload.classList.remove('active');
            this.sections.style.classList.remove('active');
            this.sections.credit.classList.remove('active');
        }

        // Style and credit sections active when both text and images exist
        if (hasText && hasImages) {
            this.sections.style.classList.add('active');
            this.sections.credit.classList.add('active');
        } else {
            this.sections.style.classList.remove('active');
            this.sections.credit.classList.remove('active');
        }

        // Update button state
        this.updateButtonState();
    }

    updateButtonState() {
        const hasText = this.DOM.textInput.value.trim() !== '';
        const hasImages = this.state.images.length > 0;

        this.DOM.addTextButton.disabled = !(hasText && hasImages);
    }

    handleTextInput() {
        this.updateSectionsVisibility();
    }

    async handleImageUpload(files) {
        if (!files || files.length === 0) return;

        try {
            // Show loading state
            this.showLoadingState(true);

            // Reset state
            this.state.images = [];
            this.state.minWidth = Infinity;

            // Load all images
            const imagePromises = Array.from(files).map(file =>
                utils.image.loadFromFile(file)
            );

            const loadedImages = await Promise.all(imagePromises);

            // Update state
            loadedImages.forEach(({ img, file }) => {
                this.state.images.push({ img, file });
                this.state.minWidth = Math.min(this.state.minWidth, img.width);
            });

            // Update UI
            this.updateSectionsVisibility();
            this.showImageCount(this.state.images.length);

            // Trigger render if text exists
            if (this.DOM.textInput.value.trim()) {
                this.handleStyleChange();
            }

            console.log(`Loaded ${this.state.images.length} images`);

        } catch (error) {
            console.error('Error loading images:', error);
            this.showNotification('Failed to load some images', 'error');
        } finally {
            this.showLoadingState(false);
        }
    }

    handleStyleChange() {
        // Trigger preview render
        if (window.renderImages && this.state.images.length > 0) {
            window.renderImages();
        }
    }

    handleAddText() {
        if (!this.validateInputs()) return;

        // Save current state
        this.saveSettings();

        // Trigger render
        this.handleStyleChange();

        // Show success notification
        this.showNotification('Text added to images!', 'success');

        // Vibrate on mobile
        if (window.innerWidth <= 768 && 'vibrate' in navigator) {
            navigator.vibrate(10);
        }
    }

    validateInputs() {
        const hasText = this.DOM.textInput.value.trim() !== '';
        const hasImages = this.state.images.length > 0;

        if (!hasText) {
            this.showNotification('Please enter some text', 'error');
            this.DOM.textInput.focus();
            return false;
        }

        if (!hasImages) {
            this.showNotification('Please upload at least one image', 'error');
            return false;
        }

        return true;
    }

    showLoadingState(show) {
        const uploadArea = this.DOM.uploadArea;
        if (!uploadArea) return;

        if (show) {
            uploadArea.classList.add('loading');
            uploadArea.innerHTML = `
                <div class="upload-content">
                    <svg class="upload-icon spinning" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-width="2" fill="none" 
                              d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                    </svg>
                    <p>Loading images...</p>
                </div>
            `;
        } else {
            uploadArea.classList.remove('loading');
            uploadArea.innerHTML = `
                <input type="file" id="imageLoader" class="file-input" multiple accept="image/*">
                <div class="upload-content">
                    <svg class="upload-icon" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-width="2" fill="none" 
                              d="M12 15V3M12 3l-4 4M12 3l4 4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/>
                    </svg>
                    <p class="upload-text">Drop images here or click to browse</p>
                    <p class="upload-hint">Support: JPG, PNG, GIF, WebP</p>
                </div>
            `;

            // Re-attach file input listener
            const newInput = uploadArea.querySelector('#imageLoader');
            if (newInput) {
                newInput.addEventListener('change', (e) => {
                    this.handleImageUpload(e.target.files);
                });
            }
        }
    }

    showImageCount(count) {
        const uploadContent = this.DOM.uploadArea.querySelector('.upload-content p');
        if (uploadContent) {
            uploadContent.innerHTML = `${count} image${count > 1 ? 's' : ''} loaded<br>
                                     <small>Click or drop to replace</small>`;
        }
    }

    saveSettings() {
        const settings = {
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

        utils.storage.save('imageTextSettings', settings);
    }

    loadSettings() {
        const settings = utils.storage.load('imageTextSettings');
        if (!settings) return;

        // Apply saved settings
        if (settings.text) this.DOM.textInput.value = settings.text;
        if (settings.font) {
            this.DOM.fontSelect.value = settings.font;
            this.DOM.fontSelect.style.fontFamily = settings.font;
        }
        if (settings.mainColor) this.DOM.colorPicker.value = settings.mainColor;
        if (settings.subColor) this.DOM.subColorPicker.value = settings.subColor;
        if (settings.position) this.DOM.positionPicker.value = settings.position;
        if (settings.credit) this.DOM.creditInput.value = settings.credit;

        this.DOM.subtitleBgCheckbox.checked = settings.subtitleBg || false;
        this.DOM.bgColorPicker.value = settings.bgColor || '#000000';
        this.DOM.bgOpacity.value = settings.bgOpacity || '28';
        this.DOM.repeatBackgroundCheckbox.checked = settings.repeatBackground || false;

        // Update sections visibility
        this.updateSectionsVisibility();

        console.log('Settings loaded from:', settings.lastSaved);
    }

    showNotification(message, type = 'info') {
        // Create or use existing notification system
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Auto remove
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}