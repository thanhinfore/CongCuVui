import { utils } from './utils.js';

export class ControlPanel {
    constructor(DOM, state) {
        this.DOM = DOM;
        this.state = state;
        this.sections = DOM.sections;
        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.initializeSections();
        this.loadSettings();

        if (this.DOM.fontSelect) {
            this.DOM.fontSelect.style.fontFamily = this.DOM.fontSelect.value;
        }

        console.log('Control panel initialized');
    }

    setupEventListeners() {
        if (this.DOM.textInput) {
            this.DOM.textInput.addEventListener('input', () => {
                this.handleTextInput();
            });
        }

        if (this.DOM.imageLoader) {
            this.DOM.imageLoader.addEventListener('change', (e) => {
                this.handleImageUpload(e.target.files);
            });
        }

        const basicControls = [
            this.DOM.fontSelect,
            this.DOM.colorPicker,
            this.DOM.subColorPicker,
            this.DOM.positionPicker,
            this.DOM.bgColorPicker,
            this.DOM.bgOpacity,
            this.DOM.subtitleBgCheckbox,
            this.DOM.repeatBackgroundCheckbox
        ];

        basicControls.forEach(control => {
            if (control) {
                control.addEventListener('change', () => {
                    if (control === this.DOM.fontSelect) {
                        control.style.fontFamily = control.value;
                    }
                    // V10.1 DEBUG: Log position changes
                    if (control === this.DOM.positionPicker) {
                        console.log('[ControlPanel] Position changed to:', control.value);
                    }
                    this.handleStyleChange();
                    this.saveSettings();
                });

                if (control.type === 'color' || control.type === 'range') {
                    control.addEventListener('input', utils.debounce(() => {
                        this.handleStyleChange();
                    }, 100));
                }
            }
        });

        // Font Size
        if (this.DOM.mainFontSize) {
            this.DOM.mainFontSize.addEventListener('input', (e) => {
                if (this.DOM.mainFontSizeValue) {
                    this.DOM.mainFontSizeValue.textContent = `${e.target.value}px`;
                }
                this.handleStyleChange();
                this.saveSettings();
            });
        }

        if (this.DOM.subFontSize) {
            this.DOM.subFontSize.addEventListener('input', (e) => {
                if (this.DOM.subFontSizeValue) {
                    this.DOM.subFontSizeValue.textContent = `${e.target.value}px`;
                }
                this.handleStyleChange();
                this.saveSettings();
            });
        }

        // Font Effects
        const fontEffectControls = [
            this.DOM.fontWeightSelect,
            this.DOM.fontStyleSelect,
            this.DOM.textUnderlineCheckbox,
            this.DOM.textBorderCheckbox,
            this.DOM.textShadowCheckbox,
            this.DOM.borderWidth,
            this.DOM.shadowBlur
        ];

        fontEffectControls.forEach(control => {
            if (control) {
                control.addEventListener('change', () => {
                    this.handleStyleChange();
                    this.saveSettings();
                });

                if (control.type === 'range') {
                    control.addEventListener('input', utils.debounce(() => {
                        this.handleStyleChange();
                    }, 100));
                }
            }
        });

        // Toggle border width control
        if (this.DOM.textBorderCheckbox) {
            this.DOM.textBorderCheckbox.addEventListener('change', () => {
                if (this.DOM.borderWidthControl) {
                    this.DOM.borderWidthControl.style.display =
                        this.DOM.textBorderCheckbox.checked ? 'block' : 'none';
                }
                this.handleStyleChange();
                this.saveSettings();
            });
        }

        // Toggle shadow control
        if (this.DOM.textShadowCheckbox) {
            this.DOM.textShadowCheckbox.addEventListener('change', () => {
                if (this.DOM.shadowControl) {
                    this.DOM.shadowControl.style.display =
                        this.DOM.textShadowCheckbox.checked ? 'block' : 'none';
                }
                this.handleStyleChange();
                this.saveSettings();
            });
        }

        // Border width display
        if (this.DOM.borderWidth) {
            this.DOM.borderWidth.addEventListener('input', (e) => {
                if (this.DOM.borderWidthValue) {
                    this.DOM.borderWidthValue.textContent = `${e.target.value}px`;
                }
            });
        }

        // Shadow blur display
        if (this.DOM.shadowBlur) {
            this.DOM.shadowBlur.addEventListener('input', (e) => {
                if (this.DOM.shadowBlurValue) {
                    this.DOM.shadowBlurValue.textContent = `${e.target.value}px`;
                }
            });
        }

        // Credit
        if (this.DOM.creditInput) {
            this.DOM.creditInput.addEventListener('input', utils.debounce(() => {
                this.handleStyleChange();
                this.saveSettings();
            }, 500));
        }

        // Add Text Button
        if (this.DOM.addTextButton) {
            this.DOM.addTextButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleAddText();
            });
        }
    }

    setupDragAndDrop() {
        const uploadArea = this.DOM.uploadArea;
        if (!uploadArea) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, utils.events.preventDefault, false);
            document.body.addEventListener(eventName, utils.events.preventDefault, false);
        });

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
        if (this.sections.text) {
            this.sections.text.classList.add('active');
        }
        this.updateSectionsVisibility();
    }

    updateSectionsVisibility() {
        const hasText = this.DOM.textInput?.value?.trim() !== '';
        const hasImages = this.state.images.length > 0;

        if (hasText) {
            if (this.sections.upload) this.sections.upload.classList.add('active');
        } else {
            if (this.sections.upload) this.sections.upload.classList.remove('active');
            if (this.sections.style) this.sections.style.classList.remove('active');
            // V10.1: Export section (merged with credit) kept collapsed by default
        }

        if (hasText && hasImages) {
            if (this.sections.style) this.sections.style.classList.add('active');
            // V10.1: Export section (merged with credit) kept collapsed by default
        } else {
            if (this.sections.style) this.sections.style.classList.remove('active');
            // V10.1: Export section (merged with credit) kept collapsed by default
        }

        this.updateButtonState();
    }

    updateButtonState() {
        const hasText = this.DOM.textInput?.value?.trim() !== '';
        const hasImages = this.state.images.length > 0;

        if (this.DOM.addTextButton) {
            this.DOM.addTextButton.disabled = !(hasText && hasImages);
        }
    }

    handleTextInput() {
        this.updateSectionsVisibility();
    }

    async handleImageUpload(files) {
        if (!files || files.length === 0) return;

        try {
            this.showLoadingState(true);

            this.state.images = [];
            this.state.minWidth = Infinity;

            const imagePromises = Array.from(files).map(file =>
                utils.image.loadFromFile(file)
            );

            const loadedImages = await Promise.all(imagePromises);

            loadedImages.forEach(({ img, file }) => {
                this.state.images.push({ img, file });
                this.state.minWidth = Math.min(this.state.minWidth, img.width);
            });

            this.updateSectionsVisibility();
            this.showImageCount(this.state.images.length);

            if (this.DOM.textInput?.value?.trim()) {
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
        if (window.renderImages && this.state.images.length > 0) {
            window.renderImages();
        }
    }

    handleAddText() {
        if (!this.validateInputs()) return;

        this.saveSettings();
        this.handleStyleChange();
        this.showNotification('Text added to images!', 'success');

        if (window.innerWidth <= 768 && 'vibrate' in navigator) {
            navigator.vibrate(10);
        }
    }

    validateInputs() {
        const hasText = this.DOM.textInput?.value?.trim() !== '';
        const hasImages = this.state.images.length > 0;

        if (!hasText) {
            this.showNotification('Please enter some text', 'error');
            if (this.DOM.textInput) {
                this.DOM.textInput.focus();
            }
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
            uploadArea.innerHTML = `<div class="upload-content"><svg class="upload-icon spinning" viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="2" fill="none" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg><p>Loading images...</p></div>`;
        } else {
            uploadArea.classList.remove('loading');
            uploadArea.innerHTML = `<input type="file" id="imageLoader" class="file-input" multiple accept="image/*"><div class="upload-content"><svg class="upload-icon" viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="2" fill="none" d="M12 15V3M12 3l-4 4M12 3l4 4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/></svg><p class="upload-text">Drop images here or click to browse</p><p class="upload-hint">Support: JPG, PNG, GIF, WebP</p></div>`;

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
            uploadContent.innerHTML = `${count} image${count > 1 ? 's' : ''} loaded<br><small>Click or drop to replace</small>`;
        }
    }

    saveSettings() {
        const colorMode = document.querySelector('input[name="colorMode"]:checked')?.value || 'solid';
        const textAlign = document.querySelector('.align-btn.active')?.dataset.align || 'center';

        const settings = {
            text: this.DOM.textInput?.value || '',
            font: this.DOM.fontSelect?.value || 'Inter, sans-serif',
            colorMode,
            mainColor: this.DOM.colorPicker?.value || '#FFFFFF',
            subColor: this.DOM.subColorPicker?.value || '#FFFFFF',
            gradientColor1: document.getElementById('gradientColor1')?.value || '#FF6B6B',
            gradientColor2: document.getElementById('gradientColor2')?.value || '#4ECDC4',
            gradientAngle: document.getElementById('gradientAngle')?.value || '45',
            position: this.DOM.positionPicker?.value || 'bottom',
            mainFontSize: this.DOM.mainFontSize?.value || '48',
            subFontSize: this.DOM.subFontSize?.value || '32',
            fontWeight: this.DOM.fontWeightSelect?.value || '400',
            fontStyle: this.DOM.fontStyleSelect?.value || 'normal',
            textUnderline: this.DOM.textUnderlineCheckbox?.checked || false,
            textBorder: this.DOM.textBorderCheckbox?.checked || false,
            textShadow: this.DOM.textShadowCheckbox?.checked || false,
            borderWidth: this.DOM.borderWidth?.value || '2',
            shadowBlur: this.DOM.shadowBlur?.value || '4',
            textAlign,
            textRotation: document.getElementById('textRotation')?.value || '0',
            textOpacity: document.getElementById('textOpacity')?.value || '100',
            letterSpacing: document.getElementById('letterSpacing')?.value || '0',
            lineHeight: document.getElementById('lineHeight')?.value || '2',
            textTransform: document.getElementById('textTransform')?.value || 'none',
            textGlow: this.DOM.textGlowCheckbox?.checked || false,
            glowColor: this.DOM.glowColor?.value || '#FFD700',
            glowIntensity: this.DOM.glowIntensity?.value || '20',
            subtitleBg: this.DOM.subtitleBgCheckbox?.checked || false,
            bgColor: this.DOM.bgColorPicker?.value || '#000000',
            bgOpacity: this.DOM.bgOpacity?.value || '28',
            repeatBackground: this.DOM.repeatBackgroundCheckbox?.checked || false,
            credit: this.DOM.creditInput?.value || '',
            lastSaved: new Date().toISOString()
        };

        utils.storage.save('imageTextSettings', settings);
    }

    loadSettings() {
        const settings = utils.storage.load('imageTextSettings');
        if (!settings) return;

        if (this.DOM.textInput) this.DOM.textInput.value = settings.text || '';
        if (this.DOM.fontSelect) {
            this.DOM.fontSelect.value = settings.font || 'Inter, sans-serif';
            this.DOM.fontSelect.style.fontFamily = this.DOM.fontSelect.value;
        }

        // Color mode
        const colorMode = settings.colorMode || 'solid';
        const colorModeRadios = document.querySelectorAll('input[name="colorMode"]');
        colorModeRadios.forEach(radio => {
            radio.checked = radio.value === colorMode;
        });

        const solidColors = document.getElementById('solidColors');
        const gradientColors = document.getElementById('gradientColors');
        if (solidColors && gradientColors) {
            solidColors.style.display = colorMode === 'solid' ? 'grid' : 'none';
            gradientColors.style.display = colorMode === 'gradient' ? 'block' : 'none';
        }

        if (this.DOM.colorPicker) this.DOM.colorPicker.value = settings.mainColor || '#FFFFFF';
        if (this.DOM.subColorPicker) this.DOM.subColorPicker.value = settings.subColor || '#FFFFFF';

        // Gradient colors
        const gradientColor1 = document.getElementById('gradientColor1');
        const gradientColor2 = document.getElementById('gradientColor2');
        const gradientAngle = document.getElementById('gradientAngle');
        if (gradientColor1) gradientColor1.value = settings.gradientColor1 || '#FF6B6B';
        if (gradientColor2) gradientColor2.value = settings.gradientColor2 || '#4ECDC4';
        if (gradientAngle) {
            gradientAngle.value = settings.gradientAngle || '45';
            const angleValue = document.getElementById('gradientAngleValue');
            if (angleValue) angleValue.textContent = `${gradientAngle.value}°`;
        }

        if (this.DOM.positionPicker) this.DOM.positionPicker.value = settings.position || 'bottom';
        if (this.DOM.creditInput) this.DOM.creditInput.value = settings.credit || '';

        if (this.DOM.mainFontSize) {
            this.DOM.mainFontSize.value = settings.mainFontSize || '48';
            if (this.DOM.mainFontSizeValue) {
                this.DOM.mainFontSizeValue.textContent = `${this.DOM.mainFontSize.value}px`;
            }
        }

        if (this.DOM.subFontSize) {
            this.DOM.subFontSize.value = settings.subFontSize || '32';
            if (this.DOM.subFontSizeValue) {
                this.DOM.subFontSizeValue.textContent = `${this.DOM.subFontSize.value}px`;
            }
        }

        if (this.DOM.fontWeightSelect) this.DOM.fontWeightSelect.value = settings.fontWeight || '400';
        if (this.DOM.fontStyleSelect) this.DOM.fontStyleSelect.value = settings.fontStyle || 'normal';
        if (this.DOM.textUnderlineCheckbox) this.DOM.textUnderlineCheckbox.checked = settings.textUnderline || false;
        if (this.DOM.textBorderCheckbox) this.DOM.textBorderCheckbox.checked = settings.textBorder || false;
        if (this.DOM.textShadowCheckbox) this.DOM.textShadowCheckbox.checked = settings.textShadow || false;

        if (this.DOM.borderWidth) {
            this.DOM.borderWidth.value = settings.borderWidth || '2';
            if (this.DOM.borderWidthValue) {
                this.DOM.borderWidthValue.textContent = `${this.DOM.borderWidth.value}px`;
            }
        }

        if (this.DOM.shadowBlur) {
            this.DOM.shadowBlur.value = settings.shadowBlur || '4';
            if (this.DOM.shadowBlurValue) {
                this.DOM.shadowBlurValue.textContent = `${this.DOM.shadowBlur.value}px`;
            }
        }

        if (this.DOM.borderWidthControl) {
            this.DOM.borderWidthControl.style.display = settings.textBorder ? 'block' : 'none';
        }

        if (this.DOM.shadowControl) {
            this.DOM.shadowControl.style.display = settings.textShadow ? 'block' : 'none';
        }

        if (this.DOM.subtitleBgCheckbox) this.DOM.subtitleBgCheckbox.checked = settings.subtitleBg || false;
        if (this.DOM.bgColorPicker) this.DOM.bgColorPicker.value = settings.bgColor || '#000000';
        if (this.DOM.bgOpacity) this.DOM.bgOpacity.value = settings.bgOpacity || '28';
        if (this.DOM.repeatBackgroundCheckbox) this.DOM.repeatBackgroundCheckbox.checked = settings.repeatBackground || false;

        if (this.DOM.bgControls) {
            this.DOM.bgControls.style.display = settings.subtitleBg ? 'grid' : 'none';
        }

        // Text alignment
        const textAlign = settings.textAlign || 'center';
        const alignButtons = document.querySelectorAll('.align-btn');
        alignButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.align === textAlign);
        });

        // Advanced text controls
        const textRotation = document.getElementById('textRotation');
        if (textRotation) {
            textRotation.value = settings.textRotation || '0';
            const valueDisplay = document.getElementById('textRotationValue');
            if (valueDisplay) valueDisplay.textContent = `${textRotation.value}°`;
        }

        const textOpacity = document.getElementById('textOpacity');
        if (textOpacity) {
            textOpacity.value = settings.textOpacity || '100';
            const valueDisplay = document.getElementById('textOpacityValue');
            if (valueDisplay) valueDisplay.textContent = `${textOpacity.value}%`;
        }

        const letterSpacing = document.getElementById('letterSpacing');
        if (letterSpacing) {
            letterSpacing.value = settings.letterSpacing || '0';
            const valueDisplay = document.getElementById('letterSpacingValue');
            if (valueDisplay) valueDisplay.textContent = `${letterSpacing.value}px`;
        }

        const lineHeight = document.getElementById('lineHeight');
        if (lineHeight) {
            lineHeight.value = settings.lineHeight || '2';
            const valueDisplay = document.getElementById('lineHeightValue');
            if (valueDisplay) valueDisplay.textContent = settings.lineHeight || '2.0';
        }

        const textTransform = document.getElementById('textTransform');
        if (textTransform) textTransform.value = settings.textTransform || 'none';

        // Glow effect
        if (this.DOM.textGlowCheckbox) this.DOM.textGlowCheckbox.checked = settings.textGlow || false;
        if (this.DOM.glowColor) this.DOM.glowColor.value = settings.glowColor || '#FFD700';
        if (this.DOM.glowIntensity) {
            this.DOM.glowIntensity.value = settings.glowIntensity || '20';
            const valueDisplay = document.getElementById('glowIntensityValue');
            if (valueDisplay) valueDisplay.textContent = `${this.DOM.glowIntensity.value}px`;
        }
        if (this.DOM.glowControl) {
            this.DOM.glowControl.style.display = settings.textGlow ? 'block' : 'none';
        }

        this.updateSectionsVisibility();

        console.log('Settings loaded from:', settings.lastSaved);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: ${type === 'error' ? '#ef4444' : '#10b981'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}