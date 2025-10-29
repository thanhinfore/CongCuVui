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
            // ===== PREMIUM EDITION - BRAND QUALITY PRESETS =====

            // 🍎 APPLE INSPIRED - Minimal Perfection
            {
                id: 'apple-minimal',
                name: 'Apple Minimal',
                description: 'Cupertino minimalism - clean & bold',
                colors: ['#000000', '#000000'],
                settings: {
                    font: 'Inter, sans-serif',
                    colorMode: 'solid',
                    mainColor: '#000000',
                    subColor: '#86868b',
                    mainFontSize: 88,
                    subFontSize: 36,
                    fontWeight: '700',
                    fontStyle: 'normal',
                    textAlign: 'center',
                    textBorder: false,
                    textShadow: false,
                    position: 'middle',
                    textTransform: 'none',
                    letterSpacing: -2.5,
                    lineHeight: 1.05,
                    textOpacity: 100
                }
            },

            // ✔️ NIKE INSPIRED - Bold Impact
            {
                id: 'nike-bold',
                name: 'Nike Bold',
                description: 'Just do it - maximum impact',
                colors: ['#000000', '#000000'],
                settings: {
                    font: 'Inter, sans-serif',
                    colorMode: 'solid',
                    mainColor: '#000000',
                    subColor: '#000000',
                    mainFontSize: 96,
                    subFontSize: 42,
                    fontWeight: '900',
                    fontStyle: 'normal',
                    textAlign: 'left',
                    textBorder: false,
                    textShadow: false,
                    position: 'bottom',
                    textTransform: 'uppercase',
                    letterSpacing: -1.5,
                    lineHeight: 0.95,
                    textOpacity: 100
                }
            },

            // 🎨 SWISS DESIGN - Mathematical Precision
            {
                id: 'swiss-precision',
                name: 'Swiss Precision',
                description: 'Helvetica perfection - grid based',
                colors: ['#000000', '#000000'],
                settings: {
                    font: 'Inter, sans-serif',
                    colorMode: 'solid',
                    mainColor: '#000000',
                    subColor: '#404040',
                    mainFontSize: 72,
                    subFontSize: 38,
                    fontWeight: '500',
                    fontStyle: 'normal',
                    textAlign: 'left',
                    textBorder: false,
                    textShadow: false,
                    position: 'bottom',
                    textTransform: 'none',
                    letterSpacing: 0,
                    lineHeight: 1.25,
                    textOpacity: 100
                }
            },

            // 📰 EDITORIAL LUXURY - Magazine Quality
            {
                id: 'editorial-luxury',
                name: 'Editorial Luxury',
                description: 'Vogue-inspired sophistication',
                colors: ['#1a1a1a', '#1a1a1a'],
                settings: {
                    font: 'Georgia, serif',
                    colorMode: 'solid',
                    mainColor: '#1a1a1a',
                    subColor: '#666666',
                    mainFontSize: 76,
                    subFontSize: 32,
                    fontWeight: '400',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    textBorder: false,
                    textShadow: false,
                    position: 'bottom',
                    textTransform: 'capitalize',
                    letterSpacing: 1,
                    lineHeight: 1.4,
                    textOpacity: 100
                }
            },

            // 🏗️ BRUTALIST - Raw Power
            {
                id: 'brutalist-power',
                name: 'Brutalist Power',
                description: 'Raw, bold, uncompromising',
                colors: ['#000000', '#000000'],
                settings: {
                    font: 'Inter, sans-serif',
                    colorMode: 'solid',
                    mainColor: '#000000',
                    subColor: '#000000',
                    mainFontSize: 104,
                    subFontSize: 48,
                    fontWeight: '900',
                    fontStyle: 'normal',
                    textAlign: 'left',
                    textBorder: false,
                    textShadow: false,
                    position: 'top',
                    textTransform: 'uppercase',
                    letterSpacing: -2,
                    lineHeight: 0.9,
                    textOpacity: 100
                }
            },

            // 💼 CORPORATE ELITE - Executive Level
            {
                id: 'corporate-elite',
                name: 'Corporate Elite',
                description: 'Fortune 500 presentation quality',
                colors: ['#1e293b', '#1e293b'],
                settings: {
                    font: 'Inter, sans-serif',
                    colorMode: 'solid',
                    mainColor: '#1e293b',
                    subColor: '#64748b',
                    mainFontSize: 68,
                    subFontSize: 34,
                    fontWeight: '600',
                    fontStyle: 'normal',
                    textAlign: 'left',
                    textBorder: false,
                    textShadow: false,
                    position: 'bottom',
                    textTransform: 'none',
                    letterSpacing: -0.8,
                    lineHeight: 1.3,
                    textOpacity: 100
                }
            },

            // 🚀 TECH STARTUP - Silicon Valley
            {
                id: 'tech-startup',
                name: 'Tech Startup',
                description: 'Y Combinator pitch-ready',
                colors: ['#0f172a', '#6366f1'],
                settings: {
                    font: 'Inter, sans-serif',
                    colorMode: 'gradient',
                    gradientColor1: '#0f172a',
                    gradientColor2: '#6366f1',
                    gradientAngle: 135,
                    mainFontSize: 80,
                    subFontSize: 38,
                    fontWeight: '800',
                    fontStyle: 'normal',
                    textAlign: 'center',
                    textBorder: false,
                    textShadow: false,
                    position: 'middle',
                    textTransform: 'none',
                    letterSpacing: -1.5,
                    lineHeight: 1.1,
                    textOpacity: 100
                }
            },

            // 🎯 IMPACT RED - Bloomberg Terminal
            {
                id: 'bloomberg-red',
                name: 'Bloomberg Red',
                description: 'Financial news impact',
                colors: ['#dc2626', '#dc2626'],
                settings: {
                    font: 'Inter, sans-serif',
                    colorMode: 'solid',
                    mainColor: '#dc2626',
                    subColor: '#7f1d1d',
                    mainFontSize: 92,
                    subFontSize: 40,
                    fontWeight: '900',
                    fontStyle: 'normal',
                    textAlign: 'left',
                    textBorder: false,
                    textShadow: false,
                    position: 'middle',
                    textTransform: 'uppercase',
                    letterSpacing: -1,
                    lineHeight: 1.0,
                    textOpacity: 100
                }
            },

            // 💎 LUXURY GOLD - Tiffany & Co
            {
                id: 'luxury-gold',
                name: 'Luxury Gold',
                description: 'Fifth Avenue sophistication',
                colors: ['#1a1a1a', '#c4a962'],
                settings: {
                    font: 'Georgia, serif',
                    colorMode: 'solid',
                    mainColor: '#1a1a1a',
                    subColor: '#c4a962',
                    mainFontSize: 82,
                    subFontSize: 36,
                    fontWeight: '400',
                    fontStyle: 'normal',
                    textAlign: 'center',
                    textBorder: false,
                    textShadow: false,
                    position: 'middle',
                    textTransform: 'uppercase',
                    letterSpacing: 4,
                    lineHeight: 1.5,
                    textOpacity: 100
                }
            },

            // 🌊 OCEAN GRADIENT - Modern Tech
            {
                id: 'ocean-gradient',
                name: 'Ocean Gradient',
                description: 'Deep blue sophistication',
                colors: ['#0c4a6e', '#0ea5e9'],
                settings: {
                    font: 'Inter, sans-serif',
                    colorMode: 'gradient',
                    gradientColor1: '#0c4a6e',
                    gradientColor2: '#0ea5e9',
                    gradientAngle: 135,
                    mainFontSize: 76,
                    subFontSize: 38,
                    fontWeight: '800',
                    fontStyle: 'normal',
                    textAlign: 'center',
                    textBorder: false,
                    textShadow: false,
                    position: 'bottom',
                    textTransform: 'none',
                    letterSpacing: -1.2,
                    lineHeight: 1.2,
                    textOpacity: 100
                }
            },

            // 🔥 FIRE GRADIENT - Energy Brand
            {
                id: 'fire-gradient',
                name: 'Fire Gradient',
                description: 'Red Bull energy style',
                colors: ['#991b1b', '#f97316'],
                settings: {
                    font: 'Inter, sans-serif',
                    colorMode: 'gradient',
                    gradientColor1: '#991b1b',
                    gradientColor2: '#f97316',
                    gradientAngle: 90,
                    mainFontSize: 88,
                    subFontSize: 42,
                    fontWeight: '900',
                    fontStyle: 'normal',
                    textAlign: 'center',
                    textBorder: false,
                    textShadow: false,
                    position: 'middle',
                    textTransform: 'uppercase',
                    letterSpacing: 0,
                    lineHeight: 1.05,
                    textOpacity: 100
                }
            },

            // 🌿 ECO MINIMAL - Patagonia Style
            {
                id: 'eco-minimal',
                name: 'Eco Minimal',
                description: 'Sustainable brand aesthetic',
                colors: ['#14532d', '#14532d'],
                settings: {
                    font: 'Inter, sans-serif',
                    colorMode: 'solid',
                    mainColor: '#14532d',
                    subColor: '#16a34a',
                    mainFontSize: 72,
                    subFontSize: 36,
                    fontWeight: '600',
                    fontStyle: 'normal',
                    textAlign: 'left',
                    textBorder: false,
                    textShadow: false,
                    position: 'bottom',
                    textTransform: 'none',
                    letterSpacing: -0.5,
                    lineHeight: 1.35,
                    textOpacity: 100
                }
            },

            // 🎨 CREATIVE PURPLE - Figma Style
            {
                id: 'creative-purple',
                name: 'Creative Purple',
                description: 'Design tool aesthetic',
                colors: ['#581c87', '#a855f7'],
                settings: {
                    font: 'Inter, sans-serif',
                    colorMode: 'gradient',
                    gradientColor1: '#581c87',
                    gradientColor2: '#a855f7',
                    gradientAngle: 135,
                    mainFontSize: 78,
                    subFontSize: 38,
                    fontWeight: '700',
                    fontStyle: 'normal',
                    textAlign: 'center',
                    textBorder: false,
                    textShadow: false,
                    position: 'bottom',
                    textTransform: 'none',
                    letterSpacing: -1,
                    lineHeight: 1.2,
                    textOpacity: 100
                }
            },

            // 📱 APP GRADIENT - Uber/Spotify Style
            {
                id: 'app-gradient',
                name: 'App Gradient',
                description: 'Modern app brand style',
                colors: ['#1e3a8a', '#8b5cf6'],
                settings: {
                    font: 'Inter, sans-serif',
                    colorMode: 'gradient',
                    gradientColor1: '#1e3a8a',
                    gradientColor2: '#8b5cf6',
                    gradientAngle: 120,
                    mainFontSize: 84,
                    subFontSize: 40,
                    fontWeight: '800',
                    fontStyle: 'normal',
                    textAlign: 'center',
                    textBorder: false,
                    textShadow: false,
                    position: 'middle',
                    textTransform: 'none',
                    letterSpacing: -1.5,
                    lineHeight: 1.1,
                    textOpacity: 100
                }
            },

            // 🏆 CHAMPION GOLD - Winner Style
            {
                id: 'champion-gold',
                name: 'Champion Gold',
                description: 'Victory & achievement',
                colors: ['#78350f', '#eab308'],
                settings: {
                    font: 'Montserrat, sans-serif',
                    colorMode: 'gradient',
                    gradientColor1: '#78350f',
                    gradientColor2: '#eab308',
                    gradientAngle: 135,
                    mainFontSize: 86,
                    subFontSize: 40,
                    fontWeight: '800',
                    fontStyle: 'normal',
                    textAlign: 'center',
                    textBorder: false,
                    textShadow: false,
                    position: 'middle',
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    lineHeight: 1.15,
                    textOpacity: 100
                }
            },

            // 🌃 MIDNIGHT - Dark Sophisticated
            {
                id: 'midnight-dark',
                name: 'Midnight',
                description: 'Dark mode elegance',
                colors: ['#0f172a', '#1e293b'],
                settings: {
                    font: 'Inter, sans-serif',
                    colorMode: 'solid',
                    mainColor: '#0f172a',
                    subColor: '#475569',
                    mainFontSize: 74,
                    subFontSize: 36,
                    fontWeight: '700',
                    fontStyle: 'normal',
                    textAlign: 'center',
                    textBorder: false,
                    textShadow: false,
                    position: 'bottom',
                    textTransform: 'none',
                    letterSpacing: -0.8,
                    lineHeight: 1.3,
                    textOpacity: 100
                }
            },

            // 🎯 RETRO BOLD - 70s Modern
            {
                id: 'retro-bold',
                name: 'Retro Bold',
                description: '70s aesthetic, modern execution',
                colors: ['#dc2626', '#facc15'],
                settings: {
                    font: 'Poppins, sans-serif',
                    colorMode: 'solid',
                    mainColor: '#dc2626',
                    subColor: '#ea580c',
                    mainFontSize: 94,
                    subFontSize: 44,
                    fontWeight: '900',
                    fontStyle: 'normal',
                    textAlign: 'center',
                    textBorder: false,
                    textShadow: false,
                    position: 'middle',
                    textTransform: 'uppercase',
                    letterSpacing: 1.5,
                    lineHeight: 1.0,
                    textOpacity: 100
                }
            },

            // 🌊 GRADIENT TEAL - Airbnb Style
            {
                id: 'airbnb-teal',
                name: 'Airbnb Teal',
                description: 'Travel & hospitality vibes',
                colors: ['#0f766e', '#14b8a6'],
                settings: {
                    font: 'Inter, sans-serif',
                    colorMode: 'gradient',
                    gradientColor1: '#0f766e',
                    gradientColor2: '#14b8a6',
                    gradientAngle: 135,
                    mainFontSize: 80,
                    subFontSize: 38,
                    fontWeight: '700',
                    fontStyle: 'normal',
                    textAlign: 'center',
                    textBorder: false,
                    textShadow: false,
                    position: 'bottom',
                    textTransform: 'none',
                    letterSpacing: -1,
                    lineHeight: 1.25,
                    textOpacity: 100
                }
            },

            // ⚡ ELECTRIC BLUE - Tesla Style
            {
                id: 'electric-blue',
                name: 'Electric Blue',
                description: 'Future tech aesthetic',
                colors: ['#1e40af', '#3b82f6'],
                settings: {
                    font: 'Inter, sans-serif',
                    colorMode: 'gradient',
                    gradientColor1: '#1e40af',
                    gradientColor2: '#3b82f6',
                    gradientAngle: 90,
                    mainFontSize: 90,
                    subFontSize: 42,
                    fontWeight: '800',
                    fontStyle: 'normal',
                    textAlign: 'center',
                    textBorder: false,
                    textShadow: false,
                    position: 'middle',
                    textTransform: 'none',
                    letterSpacing: -1.8,
                    lineHeight: 1.05,
                    textOpacity: 100
                }
            },

            // 🖤 ULTRA MINIMAL - Japanese Zen
            {
                id: 'zen-minimal',
                name: 'Zen Minimal',
                description: 'Japanese minimalism perfection',
                colors: ['#171717', '#171717'],
                settings: {
                    font: 'Inter, sans-serif',
                    colorMode: 'solid',
                    mainColor: '#171717',
                    subColor: '#737373',
                    mainFontSize: 64,
                    subFontSize: 32,
                    fontWeight: '300',
                    fontStyle: 'normal',
                    textAlign: 'left',
                    textBorder: false,
                    textShadow: false,
                    position: 'bottom',
                    textTransform: 'none',
                    letterSpacing: 0.5,
                    lineHeight: 1.6,
                    textOpacity: 100
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
