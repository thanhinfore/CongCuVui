/* =====================================================
   PRESETS.JS - Preset Templates Module
   ===================================================== */

import { utils } from './utils.js';

export class PresetsManager {
    constructor(DOM, controlPanel) {
        this.DOM = DOM;
        this.controlPanel = controlPanel;
        this.currentPreset = null;

        this.builtInPresets = [
            {
                id: 'modern-gradient',
                name: 'Modern Gradient',
                description: 'Vibrant gradient with bold text',
                colors: ['#FF6B6B', '#4ECDC4'],
                settings: {
                    colorMode: 'gradient',
                    gradientColor1: '#FF6B6B',
                    gradientColor2: '#4ECDC4',
                    gradientAngle: 45,
                    mainFontSize: 72,
                    subFontSize: 40,
                    fontWeight: 'bold',
                    fontStyle: 'normal',
                    textAlign: 'center',
                    textShadow: true,
                    shadowBlur: 10,
                    textGlow: true,
                    glowColor: '#FF6B6B',
                    glowIntensity: 25,
                    position: 'middle',
                    textTransform: 'uppercase',
                    letterSpacing: 2
                }
            },
            {
                id: 'elegant-minimal',
                name: 'Elegant Minimal',
                description: 'Clean and professional',
                colors: ['#1a1a1a', '#1a1a1a'],
                settings: {
                    colorMode: 'solid',
                    mainColor: '#FFFFFF',
                    subColor: '#E0E0E0',
                    mainFontSize: 56,
                    subFontSize: 32,
                    fontWeight: '400',
                    fontStyle: 'normal',
                    textAlign: 'left',
                    textBorder: true,
                    borderWidth: 1.5,
                    position: 'bottom',
                    textTransform: 'none',
                    letterSpacing: 0,
                    lineHeight: 1.6
                }
            },
            {
                id: 'bold-impact',
                name: 'Bold Impact',
                description: 'Maximum visibility',
                colors: ['#FFD700', '#FFD700'],
                settings: {
                    colorMode: 'solid',
                    mainColor: '#FFD700',
                    subColor: '#FFFFFF',
                    mainFontSize: 84,
                    subFontSize: 48,
                    fontWeight: '800',
                    fontStyle: 'normal',
                    textAlign: 'center',
                    textBorder: true,
                    borderWidth: 4,
                    textShadow: true,
                    shadowBlur: 15,
                    position: 'middle',
                    textTransform: 'uppercase',
                    letterSpacing: 3
                }
            },
            {
                id: 'soft-pastel',
                name: 'Soft Pastel',
                description: 'Gentle and soothing',
                colors: ['#FFC3A0', '#FFAFBD'],
                settings: {
                    colorMode: 'gradient',
                    gradientColor1: '#FFC3A0',
                    gradientColor2: '#FFAFBD',
                    gradientAngle: 135,
                    mainFontSize: 60,
                    subFontSize: 36,
                    fontWeight: '600',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    textShadow: true,
                    shadowBlur: 8,
                    position: 'upper-middle',
                    textTransform: 'capitalize',
                    letterSpacing: 1,
                    textOpacity: 95
                }
            },
            {
                id: 'neon-glow',
                name: 'Neon Glow',
                description: 'Electric and eye-catching',
                colors: ['#00F0FF', '#FF00FF'],
                settings: {
                    colorMode: 'gradient',
                    gradientColor1: '#00F0FF',
                    gradientColor2: '#FF00FF',
                    gradientAngle: 90,
                    mainFontSize: 68,
                    subFontSize: 42,
                    fontWeight: 'bold',
                    fontStyle: 'normal',
                    textAlign: 'center',
                    textGlow: true,
                    glowColor: '#00F0FF',
                    glowIntensity: 35,
                    position: 'middle',
                    textTransform: 'uppercase',
                    letterSpacing: 2.5
                }
            },
            {
                id: 'classic-serif',
                name: 'Classic Serif',
                description: 'Timeless and refined',
                colors: ['#2C3E50', '#2C3E50'],
                settings: {
                    font: 'Georgia, serif',
                    colorMode: 'solid',
                    mainColor: '#FFFFFF',
                    subColor: '#ECF0F1',
                    mainFontSize: 64,
                    subFontSize: 38,
                    fontWeight: '400',
                    fontStyle: 'normal',
                    textAlign: 'center',
                    textBorder: true,
                    borderWidth: 2,
                    textShadow: true,
                    shadowBlur: 6,
                    position: 'bottom',
                    textTransform: 'capitalize',
                    letterSpacing: 0.5,
                    lineHeight: 1.8,
                    subtitleBg: true,
                    bgColor: '#000000',
                    bgOpacity: 35
                }
            },
            {
                id: 'playful-pop',
                name: 'Playful Pop',
                description: 'Fun and energetic',
                colors: ['#FF5733', '#FFC300'],
                settings: {
                    colorMode: 'gradient',
                    gradientColor1: '#FF5733',
                    gradientColor2: '#FFC300',
                    gradientAngle: 60,
                    mainFontSize: 76,
                    subFontSize: 44,
                    fontWeight: 'bold',
                    fontStyle: 'normal',
                    textAlign: 'center',
                    textRotation: -3,
                    textBorder: true,
                    borderWidth: 3.5,
                    textShadow: true,
                    shadowBlur: 12,
                    position: 'upper-middle',
                    textTransform: 'uppercase',
                    letterSpacing: 4
                }
            }
        ];

        this.initialize();
    }

    initialize() {
        this.renderPresets();
        this.setupEventListeners();
        console.log('Presets manager initialized');
    }

    renderPresets() {
        const grid = document.getElementById('presetsGrid');
        if (!grid) return;

        grid.innerHTML = '';

        // Render built-in presets
        this.builtInPresets.forEach(preset => {
            const card = this.createPresetCard(preset);
            grid.appendChild(card);
        });

        // Render custom presets
        const customPresets = this.getCustomPresets();
        customPresets.forEach(preset => {
            const card = this.createPresetCard(preset, true);
            grid.appendChild(card);
        });
    }

    createPresetCard(preset, isCustom = false) {
        const card = utils.dom.createElement('div', {
            className: `preset-card ${isCustom ? 'custom' : ''}`,
            'data-preset-id': preset.id,
            onclick: () => this.applyPreset(preset.id, isCustom)
        });

        // Set CSS variables for gradient preview
        card.style.setProperty('--preset-color-1', preset.colors[0]);
        card.style.setProperty('--preset-color-2', preset.colors[1]);

        const name = utils.dom.createElement('div', {
            className: 'preset-name',
            textContent: preset.name
        });

        const description = utils.dom.createElement('div', {
            className: 'preset-description',
            textContent: preset.description
        });

        const preview = utils.dom.createElement('div', {
            className: 'preset-preview'
        });
        preview.style.background = `linear-gradient(45deg, ${preset.colors[0]}, ${preset.colors[1]})`;
        preview.style.WebkitBackgroundClip = 'text';
        preview.style.WebkitTextFillColor = 'transparent';
        preview.style.backgroundClip = 'text';
        preview.textContent = 'Aa';

        card.appendChild(name);
        card.appendChild(description);
        card.appendChild(preview);

        // Add delete button for custom presets
        if (isCustom) {
            const deleteBtn = utils.dom.createElement('button', {
                className: 'preset-delete',
                innerHTML: '×',
                onclick: (e) => {
                    e.stopPropagation();
                    this.deleteCustomPreset(preset.id);
                }
            });
            card.appendChild(deleteBtn);
        }

        return card;
    }

    setupEventListeners() {
        const saveBtn = document.getElementById('saveCustomPreset');
        if (saveBtn) {
            saveBtn.onclick = () => this.saveCustomPreset();
        }
    }

    applyPreset(presetId, isCustom = false) {
        const preset = isCustom
            ? this.getCustomPresets().find(p => p.id === presetId)
            : this.builtInPresets.find(p => p.id === presetId);

        if (!preset) return;

        this.currentPreset = presetId;

        // Update all controls with preset settings
        const settings = preset.settings;

        // Font family
        if (settings.font && this.DOM.fontSelect) {
            this.DOM.fontSelect.value = settings.font;
            this.DOM.fontSelect.style.fontFamily = settings.font;
        }

        // Color mode
        const colorModeRadios = document.querySelectorAll('input[name="colorMode"]');
        colorModeRadios.forEach(radio => {
            radio.checked = radio.value === settings.colorMode;
            if (radio.checked) {
                this.handleColorModeChange(settings.colorMode);
            }
        });

        // Solid colors
        if (settings.colorMode === 'solid') {
            if (settings.mainColor && this.DOM.colorPicker) {
                this.DOM.colorPicker.value = settings.mainColor;
            }
            if (settings.subColor && this.DOM.subColorPicker) {
                this.DOM.subColorPicker.value = settings.subColor;
            }
        }

        // Gradient colors
        if (settings.colorMode === 'gradient') {
            const gradientColor1 = document.getElementById('gradientColor1');
            const gradientColor2 = document.getElementById('gradientColor2');
            const gradientAngle = document.getElementById('gradientAngle');

            if (gradientColor1) gradientColor1.value = settings.gradientColor1;
            if (gradientColor2) gradientColor2.value = settings.gradientColor2;
            if (gradientAngle) {
                gradientAngle.value = settings.gradientAngle;
                const angleValue = document.getElementById('gradientAngleValue');
                if (angleValue) angleValue.textContent = `${settings.gradientAngle}°`;
            }
        }

        // Font sizes
        if (settings.mainFontSize && this.DOM.mainFontSize) {
            this.DOM.mainFontSize.value = settings.mainFontSize;
            if (this.DOM.mainFontSizeValue) {
                this.DOM.mainFontSizeValue.textContent = `${settings.mainFontSize}px`;
            }
        }
        if (settings.subFontSize && this.DOM.subFontSize) {
            this.DOM.subFontSize.value = settings.subFontSize;
            if (this.DOM.subFontSizeValue) {
                this.DOM.subFontSizeValue.textContent = `${settings.subFontSize}px`;
            }
        }

        // Font effects
        if (settings.fontWeight && this.DOM.fontWeightSelect) {
            this.DOM.fontWeightSelect.value = settings.fontWeight;
        }
        if (settings.fontStyle && this.DOM.fontStyleSelect) {
            this.DOM.fontStyleSelect.value = settings.fontStyle;
        }

        // Text alignment
        const alignButtons = document.querySelectorAll('.align-btn');
        alignButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.align === (settings.textAlign || 'center'));
        });

        // Position
        if (settings.position && this.DOM.positionPicker) {
            this.DOM.positionPicker.value = settings.position;
        }

        // Advanced controls
        this.setRangeValue('textRotation', settings.textRotation, '°');
        this.setRangeValue('textOpacity', settings.textOpacity, '%');
        this.setRangeValue('letterSpacing', settings.letterSpacing, 'px');
        this.setRangeValue('lineHeight', settings.lineHeight, '');

        // Text transform
        const textTransform = document.getElementById('textTransform');
        if (textTransform && settings.textTransform) {
            textTransform.value = settings.textTransform;
        }

        // Checkboxes
        this.setCheckbox('textUnderlineCheckbox', settings.textUnderline);
        this.setCheckbox('textBorderCheckbox', settings.textBorder);
        this.setCheckbox('textShadowCheckbox', settings.textShadow);
        this.setCheckbox('textGlowCheckbox', settings.textGlow);
        this.setCheckbox('subtitleBgCheckbox', settings.subtitleBg);

        // Border width
        if (settings.textBorder) {
            this.setRangeValue('borderWidth', settings.borderWidth, 'px');
            const borderControl = document.getElementById('borderWidthControl');
            if (borderControl) borderControl.style.display = 'block';
        }

        // Shadow blur
        if (settings.textShadow) {
            this.setRangeValue('shadowBlur', settings.shadowBlur, 'px');
            const shadowControl = document.getElementById('shadowControl');
            if (shadowControl) shadowControl.style.display = 'block';
        }

        // Glow effect
        if (settings.textGlow) {
            const glowColor = document.getElementById('glowColor');
            const glowControl = document.getElementById('glowControl');
            if (glowColor) glowColor.value = settings.glowColor;
            if (glowControl) glowControl.style.display = 'block';
            this.setRangeValue('glowIntensity', settings.glowIntensity, 'px');
        }

        // Background
        if (settings.subtitleBg) {
            const bgColorPicker = this.DOM.bgColorPicker;
            const bgOpacity = this.DOM.bgOpacity;
            const bgControls = document.getElementById('bgControls');

            if (bgColorPicker && settings.bgColor) bgColorPicker.value = settings.bgColor;
            if (bgOpacity && settings.bgOpacity) bgOpacity.value = settings.bgOpacity;
            if (bgControls) bgControls.style.display = 'grid';
        }

        // Update active preset card
        document.querySelectorAll('.preset-card').forEach(card => {
            card.classList.toggle('active', card.dataset.presetId === presetId);
        });

        // Save and render
        this.controlPanel.saveSettings();
        this.controlPanel.handleStyleChange();

        console.log('Applied preset:', preset.name);
    }

    setRangeValue(id, value, suffix) {
        if (value === undefined) return;

        const input = document.getElementById(id);
        const valueDisplay = document.getElementById(`${id}Value`);

        if (input) input.value = value;
        if (valueDisplay) valueDisplay.textContent = `${value}${suffix}`;
    }

    setCheckbox(id, value) {
        const checkbox = this.DOM[id];
        if (checkbox && value !== undefined) {
            checkbox.checked = value;
        }
    }

    handleColorModeChange(mode) {
        const solidColors = document.getElementById('solidColors');
        const gradientColors = document.getElementById('gradientColors');

        if (solidColors) {
            solidColors.style.display = mode === 'solid' ? 'grid' : 'none';
        }
        if (gradientColors) {
            gradientColors.style.display = mode === 'gradient' ? 'block' : 'none';
        }
    }

    saveCustomPreset() {
        const name = prompt('Enter a name for this preset:');
        if (!name) return;

        const customPresets = this.getCustomPresets();
        const id = 'custom-' + Date.now();

        // Get current color mode
        const colorMode = document.querySelector('input[name="colorMode"]:checked')?.value || 'solid';

        // Determine colors for preview
        let colors = ['#2563eb', '#7c3aed'];
        if (colorMode === 'solid') {
            const mainColor = this.DOM.colorPicker?.value || '#FFFFFF';
            colors = [mainColor, mainColor];
        } else {
            const color1 = document.getElementById('gradientColor1')?.value || '#FF6B6B';
            const color2 = document.getElementById('gradientColor2')?.value || '#4ECDC4';
            colors = [color1, color2];
        }

        const preset = {
            id,
            name,
            description: 'Custom preset',
            colors,
            settings: this.getCurrentSettings()
        };

        customPresets.push(preset);
        localStorage.setItem('customPresets', JSON.stringify(customPresets));

        this.renderPresets();
        this.applyPreset(id, true);

        alert('Preset saved successfully!');
    }

    getCurrentSettings() {
        const colorMode = document.querySelector('input[name="colorMode"]:checked')?.value || 'solid';
        const textAlign = document.querySelector('.align-btn.active')?.dataset.align || 'center';

        const settings = {
            font: this.DOM.fontSelect?.value,
            colorMode,
            position: this.DOM.positionPicker?.value,
            mainFontSize: parseInt(this.DOM.mainFontSize?.value),
            subFontSize: parseInt(this.DOM.subFontSize?.value),
            fontWeight: this.DOM.fontWeightSelect?.value,
            fontStyle: this.DOM.fontStyleSelect?.value,
            textAlign,
            textUnderline: this.DOM.textUnderlineCheckbox?.checked,
            textBorder: this.DOM.textBorderCheckbox?.checked,
            textShadow: this.DOM.textShadowCheckbox?.checked,
            subtitleBg: this.DOM.subtitleBgCheckbox?.checked
        };

        if (colorMode === 'solid') {
            settings.mainColor = this.DOM.colorPicker?.value;
            settings.subColor = this.DOM.subColorPicker?.value;
        } else {
            settings.gradientColor1 = document.getElementById('gradientColor1')?.value;
            settings.gradientColor2 = document.getElementById('gradientColor2')?.value;
            settings.gradientAngle = parseInt(document.getElementById('gradientAngle')?.value);
        }

        // Advanced settings
        settings.textRotation = parseInt(document.getElementById('textRotation')?.value || 0);
        settings.textOpacity = parseInt(document.getElementById('textOpacity')?.value || 100);
        settings.letterSpacing = parseFloat(document.getElementById('letterSpacing')?.value || 0);
        settings.lineHeight = parseFloat(document.getElementById('lineHeight')?.value || 2);
        settings.textTransform = document.getElementById('textTransform')?.value;

        if (settings.textBorder) {
            settings.borderWidth = parseFloat(this.DOM.borderWidth?.value);
        }

        if (settings.textShadow) {
            settings.shadowBlur = parseInt(this.DOM.shadowBlur?.value);
        }

        const textGlowCheckbox = document.getElementById('textGlowCheckbox');
        if (textGlowCheckbox?.checked) {
            settings.textGlow = true;
            settings.glowColor = document.getElementById('glowColor')?.value;
            settings.glowIntensity = parseInt(document.getElementById('glowIntensity')?.value);
        }

        if (settings.subtitleBg) {
            settings.bgColor = this.DOM.bgColorPicker?.value;
            settings.bgOpacity = this.DOM.bgOpacity?.value;
        }

        return settings;
    }

    getCustomPresets() {
        try {
            const stored = localStorage.getItem('customPresets');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    deleteCustomPreset(presetId) {
        if (!confirm('Are you sure you want to delete this preset?')) return;

        let customPresets = this.getCustomPresets();
        customPresets = customPresets.filter(p => p.id !== presetId);
        localStorage.setItem('customPresets', JSON.stringify(customPresets));

        this.renderPresets();
        console.log('Deleted custom preset:', presetId);
    }
}
