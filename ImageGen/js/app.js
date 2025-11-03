/* =====================================================
   APP.JS - Main Application Entry Point (v9.1)
   Clean UI, Fixed Mode Switching
   ===================================================== */

import { ControlPanel } from './modules/controlPanel.js';
import { PreviewPanel } from './modules/previewPanel.js';
import { MobileHandler } from './modules/mobileHandler.js';
import { PresetsManager } from './modules/presets.js';
import { AdvancedFeatures } from './modules/advancedFeatures.js';
import { MarkdownUI, setupMarkdownKeyboardShortcuts } from './modules/markdownUI.js';
import { ImageBrowser } from './modules/imageBrowser.js';
import { SolidBackgroundGenerator } from './modules/solidBackground.js';
import { ModeManager } from './modules/modeManager.js';
import { TextPositioning } from './modules/textPositioning.js';
import { V6UI } from './v6-ui.js';
import { utils } from './modules/utils.js';
import { getFindReplace } from './modules/findReplace.js';

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
            this.initializeDOMReferences();
            this.components.controls = new ControlPanel(this.DOM, this.state);
            this.components.preview = new PreviewPanel(this.DOM, this.state);
            this.components.mobile = new MobileHandler();
            this.components.presets = new PresetsManager(this.DOM, this.components.controls);
            this.components.advanced = new AdvancedFeatures(this);
            this.components.markdown = new MarkdownUI(this.DOM);
            this.components.imageBrowser = new ImageBrowser(this.state);
            this.components.solidBg = new SolidBackgroundGenerator(this.state);
            this.components.modeManager = new ModeManager();
            this.components.textPositioning = new TextPositioning(this.DOM, this.state);
            this.components.v6ui = new V6UI();
            this.components.findReplace = getFindReplace();

            // V9.1: Connect state to mode manager for proper cleanup
            this.components.modeManager.setState(this.state);

            // Connect text positioning to preview panel
            this.components.preview.setTextPositioning(this.components.textPositioning);

            this.setupGlobalMethods();

            if (window.innerWidth <= 768) {
                this.components.mobile.init();
            }

            this.setupEventListeners();
            this.loadSavedState();

            // Setup markdown keyboard shortcuts
            setupMarkdownKeyboardShortcuts(this.components.markdown);

            // Initialize image browser
            await this.components.imageBrowser.init();
            this.setupImageBrowserHandlers();

            // Restore saved mode
            if (this.components.modeManager) {
                this.components.modeManager.restoreSavedMode();
            }

            this.initialized = true;
            console.log('✨ Knowledge Visualizer v10.1 Simplified initialized successfully');

            // Welcome toast
            setTimeout(() => {
                if (this.components.v6ui) {
                    this.components.v6ui.showToast('✨ v10.1 Simplified! Giao diện đơn giản, dễ sử dụng hơn bao giờ hết!', 'success', 5000);
                }
            }, 500);

        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    initializeDOMReferences() {
        this.DOM = {
            // Text inputs
            textInput: document.getElementById('textInput'),
            imageLoader: document.getElementById('imageLoader'),
            creditInput: document.getElementById('creditInput'),

            // Font family & size
            fontSelect: document.getElementById('fontSelect'),
            mainFontSize: document.getElementById('mainFontSize'),
            mainFontSizeValue: document.getElementById('mainFontSizeValue'),
            subFontSize: document.getElementById('subFontSize'),
            subFontSizeValue: document.getElementById('subFontSizeValue'),

            // Font effects
            fontWeightSelect: document.getElementById('fontWeightSelect'),
            fontStyleSelect: document.getElementById('fontStyleSelect'),
            textUnderlineCheckbox: document.getElementById('textUnderlineCheckbox'),
            textBorderCheckbox: document.getElementById('textBorderCheckbox'),
            textShadowCheckbox: document.getElementById('textShadowCheckbox'),
            borderWidth: document.getElementById('borderWidth'),
            borderWidthValue: document.getElementById('borderWidthValue'),
            shadowBlur: document.getElementById('shadowBlur'),
            shadowBlurValue: document.getElementById('shadowBlurValue'),
            borderWidthControl: document.getElementById('borderWidthControl'),
            shadowControl: document.getElementById('shadowControl'),

            // Colors
            colorPicker: document.getElementById('colorPicker'),
            subColorPicker: document.getElementById('subColorPicker'),

            // Position & background
            positionPicker: document.getElementById('positionPicker'),
            subtitleBgCheckbox: document.getElementById('subtitleBgCheckbox'),
            bgColorPicker: document.getElementById('bgColorPicker'),
            bgOpacity: document.getElementById('bgOpacity'),
            bgControls: document.getElementById('bgControls'),
            repeatBackgroundCheckbox: document.getElementById('repeatBackgroundCheckbox'),

            // Containers
            uploadArea: document.getElementById('uploadArea'),
            canvasContainer: document.getElementById('canvasContainer'),

            // Buttons
            addTextButton: document.getElementById('addTextButton'),
            insertFooterText: document.getElementById('insertFooterText'),
            insertLineBreak: document.getElementById('insertLineBreak'),

            // Advanced text controls
            textRotation: document.getElementById('textRotation'),
            textOpacity: document.getElementById('textOpacity'),
            letterSpacing: document.getElementById('letterSpacing'),
            lineHeight: document.getElementById('lineHeight'),
            textTransform: document.getElementById('textTransform'),
            textGlowCheckbox: document.getElementById('textGlowCheckbox'),
            glowColor: document.getElementById('glowColor'),
            glowIntensity: document.getElementById('glowIntensity'),
            glowControl: document.getElementById('glowControl'),

            // Sections
            sections: {
                text: document.getElementById('textSection'),
                upload: document.getElementById('uploadSection'),
                presets: document.getElementById('presetsSection'),
                style: document.getElementById('styleSection'),
                export: document.getElementById('exportSection')
            }
        };

        const missing = Object.entries(this.DOM)
            .filter(([key, element]) => !element && key !== 'sections')
            .map(([key]) => key);

        if (missing.length > 0) {
            throw new Error(`Missing DOM elements: ${missing.join(', ')}`);
        }
    }

    setupGlobalMethods() {
        window.renderImages = () => {
            if (this.components.preview) {
                this.components.preview.render();
            }
        };

        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
        });
    }

    setupEventListeners() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.initialized) {
                this.saveState();
            }
        });

        window.addEventListener('beforeunload', () => {
            if (this.state.images.length > 0 && !this.state.saved) {
                return 'You have unsaved work. Are you sure you want to leave?';
            }
        });

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveState();
                this.showNotification('Settings saved');
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                if (!this.DOM.addTextButton.disabled) {
                    this.DOM.addTextButton.click();
                }
            }
        });

        if (this.DOM.subtitleBgCheckbox) {
            this.DOM.subtitleBgCheckbox.addEventListener('change', () => {
                this.DOM.bgControls.style.display = this.DOM.subtitleBgCheckbox.checked ? 'grid' : 'none';
            });
        }

        if (this.DOM.bgOpacity) {
            this.DOM.bgOpacity.addEventListener('input', (e) => {
                const valueDisplay = e.target.nextElementSibling;
                if (valueDisplay) {
                    valueDisplay.textContent = `${e.target.value}%`;
                }
            });
        }

        if (this.DOM.textBorderCheckbox) {
            this.DOM.textBorderCheckbox.addEventListener('change', () => {
                this.DOM.borderWidthControl.style.display = this.DOM.textBorderCheckbox.checked ? 'block' : 'none';
            });
        }

        if (this.DOM.textShadowCheckbox) {
            this.DOM.textShadowCheckbox.addEventListener('change', () => {
                this.DOM.shadowControl.style.display = this.DOM.textShadowCheckbox.checked ? 'block' : 'none';
            });
        }

        if (this.DOM.borderWidth) {
            this.DOM.borderWidth.addEventListener('input', (e) => {
                if (this.DOM.borderWidthValue) {
                    this.DOM.borderWidthValue.textContent = `${e.target.value}px`;
                }
            });
        }

        if (this.DOM.shadowBlur) {
            this.DOM.shadowBlur.addEventListener('input', (e) => {
                if (this.DOM.shadowBlurValue) {
                    this.DOM.shadowBlurValue.textContent = `${e.target.value}px`;
                }
            });
        }

        if (this.DOM.insertFooterText) {
            this.DOM.insertFooterText.addEventListener('click', () => {
                const footerText = '🍀\\nMỗi ảnh là một prompt: Nếu bạn muốn tìm hiểu sâu hơn về kiến thức trong bất kỳ tấm ảnh nào bên trên, hãy sao chép ảnh và thả vào ChatGPT để hỏi đáp trực tiếp!';
                this.insertTextAtCursor(footerText);
            });
        }

        if (this.DOM.insertLineBreak) {
            this.DOM.insertLineBreak.addEventListener('click', () => {
                this.insertTextAtCursor('\\n');
            });
        }

        // V10.0: Knowledge Mode handlers
        const knowledgeModeCheckbox = document.getElementById('knowledgeModeCheckbox');
        const knowledgeModeInfo = document.getElementById('knowledgeModeInfo');
        const knowledgeStats = document.getElementById('knowledgeStats');
        const insertKnowledgeTemplate = document.getElementById('insertKnowledgeTemplate');

        if (knowledgeModeCheckbox) {
            knowledgeModeCheckbox.addEventListener('change', (e) => {
                const isEnabled = e.target.checked;

                // Toggle info display
                if (knowledgeModeInfo) {
                    knowledgeModeInfo.style.display = isEnabled ? 'block' : 'none';
                }
                if (knowledgeStats) {
                    knowledgeStats.style.display = isEnabled ? 'flex' : 'none';
                }
                if (insertKnowledgeTemplate) {
                    insertKnowledgeTemplate.style.display = isEnabled ? 'inline-flex' : 'none';
                }

                // Update stats
                this.updateKnowledgeStats();

                // Re-render if images are loaded
                if (this.state.images.length > 0) {
                    this.components.preview?.render();
                }

                // Show toast
                if (this.components.v6ui) {
                    if (isEnabled) {
                        this.components.v6ui.showToast('🎓 Knowledge Mode bật! Mỗi dòng sẽ tạo 1 ảnh riêng', 'success', 3000);
                    } else {
                        this.components.v6ui.showToast('Knowledge Mode tắt', 'info', 2000);
                    }
                }
            });
        }

        // Update stats on text input change
        if (this.DOM.textInput) {
            this.DOM.textInput.addEventListener('input', utils.debounce(() => {
                this.updateKnowledgeStats();
            }, 300));
        }

        // Insert knowledge template button
        if (insertKnowledgeTemplate) {
            insertKnowledgeTemplate.addEventListener('click', () => {
                this.insertKnowledgeTemplate();
            });
        }

        // Color mode selector
        const colorModeRadios = document.querySelectorAll('input[name="colorMode"]');
        colorModeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const solidColors = document.getElementById('solidColors');
                const gradientColors = document.getElementById('gradientColors');

                if (solidColors && gradientColors) {
                    if (e.target.value === 'solid') {
                        solidColors.style.display = 'grid';
                        gradientColors.style.display = 'none';
                    } else {
                        solidColors.style.display = 'none';
                        gradientColors.style.display = 'block';
                    }
                }

                this.components.controls?.saveSettings();
                this.components.controls?.handleStyleChange();
            });
        });

        // Gradient controls
        const gradientAngle = document.getElementById('gradientAngle');
        const gradientColor1 = document.getElementById('gradientColor1');
        const gradientColor2 = document.getElementById('gradientColor2');

        if (gradientAngle) {
            gradientAngle.addEventListener('input', (e) => {
                const valueDisplay = document.getElementById('gradientAngleValue');
                if (valueDisplay) {
                    valueDisplay.textContent = `${e.target.value}°`;
                }
                this.components.controls?.handleStyleChange();
            });
        }

        [gradientColor1, gradientColor2].forEach(input => {
            if (input) {
                input.addEventListener('change', () => {
                    this.components.controls?.saveSettings();
                    this.components.controls?.handleStyleChange();
                });
                input.addEventListener('input', utils.debounce(() => {
                    this.components.controls?.handleStyleChange();
                }, 100));
            }
        });

        // Alignment buttons
        const alignButtons = document.querySelectorAll('.align-btn');
        alignButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                alignButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.components.controls?.saveSettings();
                this.components.controls?.handleStyleChange();
            });
        });

        // Advanced text controls
        const advancedControls = [
            { id: 'textRotation', suffix: '°' },
            { id: 'textOpacity', suffix: '%' },
            { id: 'letterSpacing', suffix: 'px' },
            { id: 'lineHeight', suffix: '' },
            { id: 'glowIntensity', suffix: 'px' }
        ];

        advancedControls.forEach(({ id, suffix }) => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', (e) => {
                    const valueDisplay = document.getElementById(`${id}Value`);
                    if (valueDisplay) {
                        valueDisplay.textContent = `${e.target.value}${suffix}`;
                    }
                    this.components.controls?.handleStyleChange();
                });
            }
        });

        // Text transform
        if (this.DOM.textTransform) {
            this.DOM.textTransform.addEventListener('change', () => {
                this.components.controls?.saveSettings();
                this.components.controls?.handleStyleChange();
            });
        }

        // Glow effect
        if (this.DOM.textGlowCheckbox) {
            this.DOM.textGlowCheckbox.addEventListener('change', () => {
                if (this.DOM.glowControl) {
                    this.DOM.glowControl.style.display = this.DOM.textGlowCheckbox.checked ? 'block' : 'none';
                }
                this.components.controls?.saveSettings();
                this.components.controls?.handleStyleChange();
            });
        }

        if (this.DOM.glowColor) {
            this.DOM.glowColor.addEventListener('change', () => {
                this.components.controls?.saveSettings();
                this.components.controls?.handleStyleChange();
            });
        }

        // Reset button
        const resetBtn = document.getElementById('resetSettings');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Reset all settings to defaults?')) {
                    this.resetToDefaults();
                }
            });
        }
    }

    insertTextAtCursor(text) {
        const textarea = this.DOM.textInput;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        textarea.value = value.substring(0, start) + text + value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        textarea.focus();

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
            text: this.DOM.textInput?.value || '',
            font: this.DOM.fontSelect?.value || 'Inter, sans-serif',
            mainColor: this.DOM.colorPicker?.value || '#FFFFFF',
            subColor: this.DOM.subColorPicker?.value || '#FFFFFF',
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
            subtitleBg: this.DOM.subtitleBgCheckbox?.checked || false,
            bgColor: this.DOM.bgColorPicker?.value || '#000000',
            bgOpacity: this.DOM.bgOpacity?.value || '28',
            repeatBackground: this.DOM.repeatBackgroundCheckbox?.checked || false,
            credit: this.DOM.creditInput?.value || '',
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

            if (this.DOM.textInput) this.DOM.textInput.value = state.text || '';
            if (this.DOM.fontSelect) {
                this.DOM.fontSelect.value = state.font || 'Inter, sans-serif';
                this.DOM.fontSelect.style.fontFamily = this.DOM.fontSelect.value;
            }
            if (this.DOM.colorPicker) this.DOM.colorPicker.value = state.mainColor || '#FFFFFF';
            if (this.DOM.subColorPicker) this.DOM.subColorPicker.value = state.subColor || '#FFFFFF';
            if (this.DOM.positionPicker) this.DOM.positionPicker.value = state.position || 'bottom';
            if (this.DOM.creditInput) this.DOM.creditInput.value = state.credit || '';

            if (this.DOM.mainFontSize) {
                this.DOM.mainFontSize.value = state.mainFontSize || '48';
                if (this.DOM.mainFontSizeValue) {
                    this.DOM.mainFontSizeValue.textContent = `${this.DOM.mainFontSize.value}px`;
                }
            }

            if (this.DOM.subFontSize) {
                this.DOM.subFontSize.value = state.subFontSize || '32';
                if (this.DOM.subFontSizeValue) {
                    this.DOM.subFontSizeValue.textContent = `${this.DOM.subFontSize.value}px`;
                }
            }

            if (this.DOM.fontWeightSelect) this.DOM.fontWeightSelect.value = state.fontWeight || '400';
            if (this.DOM.fontStyleSelect) this.DOM.fontStyleSelect.value = state.fontStyle || 'normal';
            if (this.DOM.textUnderlineCheckbox) this.DOM.textUnderlineCheckbox.checked = state.textUnderline || false;
            if (this.DOM.textBorderCheckbox) this.DOM.textBorderCheckbox.checked = state.textBorder || false;
            if (this.DOM.textShadowCheckbox) this.DOM.textShadowCheckbox.checked = state.textShadow || false;

            if (this.DOM.borderWidth) {
                this.DOM.borderWidth.value = state.borderWidth || '2';
                if (this.DOM.borderWidthValue) {
                    this.DOM.borderWidthValue.textContent = `${this.DOM.borderWidth.value}px`;
                }
            }

            if (this.DOM.shadowBlur) {
                this.DOM.shadowBlur.value = state.shadowBlur || '4';
                if (this.DOM.shadowBlurValue) {
                    this.DOM.shadowBlurValue.textContent = `${this.DOM.shadowBlur.value}px`;
                }
            }

            if (this.DOM.borderWidthControl) {
                this.DOM.borderWidthControl.style.display = state.textBorder ? 'block' : 'none';
            }

            if (this.DOM.shadowControl) {
                this.DOM.shadowControl.style.display = state.textShadow ? 'block' : 'none';
            }

            if (this.DOM.subtitleBgCheckbox) this.DOM.subtitleBgCheckbox.checked = state.subtitleBg || false;
            if (this.DOM.bgColorPicker) this.DOM.bgColorPicker.value = state.bgColor || '#000000';
            if (this.DOM.bgOpacity) this.DOM.bgOpacity.value = state.bgOpacity || '28';
            if (this.DOM.repeatBackgroundCheckbox) this.DOM.repeatBackgroundCheckbox.checked = state.repeatBackground || false;

            if (this.DOM.bgControls) {
                this.DOM.bgControls.style.display = state.subtitleBg ? 'grid' : 'none';
            }

            console.log('State restored from:', state.lastSaved);

        } catch (error) {
            console.error('Failed to load saved state:', error);
        }
    }

    resetToDefaults() {
        // Reset all controls to default values
        if (this.DOM.fontSelect) {
            this.DOM.fontSelect.value = 'Inter, sans-serif';
            this.DOM.fontSelect.style.fontFamily = 'Inter, sans-serif';
        }

        // Reset color mode to solid
        const solidRadio = document.querySelector('input[name="colorMode"][value="solid"]');
        if (solidRadio) solidRadio.checked = true;
        const solidColors = document.getElementById('solidColors');
        const gradientColors = document.getElementById('gradientColors');
        if (solidColors) solidColors.style.display = 'grid';
        if (gradientColors) gradientColors.style.display = 'none';

        // Reset colors
        if (this.DOM.colorPicker) this.DOM.colorPicker.value = '#FFFFFF';
        if (this.DOM.subColorPicker) this.DOM.subColorPicker.value = '#FFFFFF';

        // Reset font sizes
        if (this.DOM.mainFontSize) {
            this.DOM.mainFontSize.value = 48;
            if (this.DOM.mainFontSizeValue) this.DOM.mainFontSizeValue.textContent = '48px';
        }
        if (this.DOM.subFontSize) {
            this.DOM.subFontSize.value = 32;
            if (this.DOM.subFontSizeValue) this.DOM.subFontSizeValue.textContent = '32px';
        }

        // Reset font effects
        if (this.DOM.fontWeightSelect) this.DOM.fontWeightSelect.value = '400';
        if (this.DOM.fontStyleSelect) this.DOM.fontStyleSelect.value = 'normal';
        if (this.DOM.textUnderlineCheckbox) this.DOM.textUnderlineCheckbox.checked = false;
        if (this.DOM.textBorderCheckbox) this.DOM.textBorderCheckbox.checked = false;
        if (this.DOM.textShadowCheckbox) this.DOM.textShadowCheckbox.checked = false;
        if (this.DOM.borderWidthControl) this.DOM.borderWidthControl.style.display = 'none';
        if (this.DOM.shadowControl) this.DOM.shadowControl.style.display = 'none';

        // Reset alignment to center
        const alignButtons = document.querySelectorAll('.align-btn');
        alignButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.align === 'center');
        });

        // Reset position
        if (this.DOM.positionPicker) this.DOM.positionPicker.value = 'bottom';

        // Reset advanced controls
        const textRotation = document.getElementById('textRotation');
        if (textRotation) {
            textRotation.value = 0;
            const valueDisplay = document.getElementById('textRotationValue');
            if (valueDisplay) valueDisplay.textContent = '0°';
        }

        const textOpacity = document.getElementById('textOpacity');
        if (textOpacity) {
            textOpacity.value = 100;
            const valueDisplay = document.getElementById('textOpacityValue');
            if (valueDisplay) valueDisplay.textContent = '100%';
        }

        const letterSpacing = document.getElementById('letterSpacing');
        if (letterSpacing) {
            letterSpacing.value = 0;
            const valueDisplay = document.getElementById('letterSpacingValue');
            if (valueDisplay) valueDisplay.textContent = '0px';
        }

        const lineHeight = document.getElementById('lineHeight');
        if (lineHeight) {
            lineHeight.value = 2;
            const valueDisplay = document.getElementById('lineHeightValue');
            if (valueDisplay) valueDisplay.textContent = '2.0';
        }

        const textTransform = document.getElementById('textTransform');
        if (textTransform) textTransform.value = 'none';

        // Reset glow
        if (this.DOM.textGlowCheckbox) this.DOM.textGlowCheckbox.checked = false;
        if (this.DOM.glowControl) this.DOM.glowControl.style.display = 'none';

        // Reset background
        if (this.DOM.subtitleBgCheckbox) this.DOM.subtitleBgCheckbox.checked = false;
        if (this.DOM.bgControls) this.DOM.bgControls.style.display = 'none';

        // Clear active preset
        document.querySelectorAll('.preset-card').forEach(card => {
            card.classList.remove('active');
        });

        this.components.controls?.saveSettings();
        this.components.controls?.handleStyleChange();
        this.showNotification('Settings reset to defaults');
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
            background: ${type === 'error' ? '#ef4444' : 'var(--color-success)'};
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

    showError(message) {
        this.showNotification(message, 'error');
    }

    updateKnowledgeStats() {
        const knowledgeModeCheckbox = document.getElementById('knowledgeModeCheckbox');
        const knowledgeLineCount = document.getElementById('knowledgeLineCount');
        const knowledgeImageCount = document.getElementById('knowledgeImageCount');

        if (!knowledgeModeCheckbox?.checked) return;

        const text = this.DOM.textInput?.value?.trim() || '';
        const lines = text ? text.split('\n').filter(line => line.trim()) : [];
        const lineCount = lines.length;
        const imageCount = this.state.images.length > 0 ? lineCount : 0;

        if (knowledgeLineCount) {
            knowledgeLineCount.textContent = lineCount;
        }
        if (knowledgeImageCount) {
            knowledgeImageCount.textContent = imageCount;
        }
    }

    insertKnowledgeTemplate() {
        const template = `**Tri thức 1:** Mô tả ngắn gọn về chủ đề đầu tiên
**Tri thức 2:** Giải thích một khái niệm quan trọng\\nCó thể xuống dòng với \\n
**Tri thức 3:** *Chia sẻ* một ==insight== hữu ích
**Tri thức 4:** Tổng kết hoặc call-to-action 🚀`;

        const textarea = this.DOM.textInput;
        if (textarea) {
            const currentValue = textarea.value.trim();
            textarea.value = currentValue ? currentValue + '\n\n' + template : template;
            textarea.focus();

            // Trigger input event to update stats
            textarea.dispatchEvent(new Event('input', { bubbles: true }));

            if (this.components.v6ui) {
                this.components.v6ui.showToast('✨ Template đã được chèn vào!', 'success', 2000);
            }
        }
    }

    setupImageBrowserHandlers() {
        // Random 1 image button
        const random1Btn = document.getElementById('randomImage1Btn');
        if (random1Btn) {
            random1Btn.addEventListener('click', () => {
                this.components.imageBrowser.selectRandomImages(1);
            });
        }

        // Random 3 images button
        const random3Btn = document.getElementById('randomImage3Btn');
        if (random3Btn) {
            random3Btn.addEventListener('click', () => {
                this.components.imageBrowser.selectRandomImages(3);
            });
        }

        // Select all button
        const selectAllBtn = document.getElementById('selectAllFolderBtn');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                this.components.imageBrowser.selectAllImages();
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new ImageTextApp();
    app.init();
    window.imageTextApp = app;
});

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