/* =====================================================
   COLOR PICKER v11 - Smart Color Selection System
   Features: Palettes, History, Harmony, Quick Copy
   ===================================================== */

export class SmartColorPicker {
    constructor() {
        this.recentColors = this.loadRecentColors();
        this.favoriteColors = this.loadFavoriteColors();
        this.isOpen = false;
        this.currentTarget = null;
        this.palettes = this.initializePalettes();
        this.init();
    }

    initializePalettes() {
        return {
            material: {
                name: 'Material Design',
                colors: [
                    '#F44336', '#E91E63', '#9C27B0', '#673AB7',
                    '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
                    '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
                    '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'
                ]
            },
            tailwind: {
                name: 'Tailwind CSS',
                colors: [
                    '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
                    '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6',
                    '#F97316', '#84CC16', '#06B6D4', '#A855F7',
                    '#F43F5E', '#EAB308', '#22C55E', '#0EA5E9'
                ]
            },
            flatui: {
                name: 'Flat UI',
                colors: [
                    '#1ABC9C', '#2ECC71', '#3498DB', '#9B59B6',
                    '#34495E', '#F39C12', '#E74C3C', '#ECF0F1',
                    '#16A085', '#27AE60', '#2980B9', '#8E44AD',
                    '#2C3E50', '#F1C40F', '#E67E22', '#95A5A6'
                ]
            },
            gradients: {
                name: 'Gradient Combos',
                colors: [
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
                    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
                ]
            },
            monochrome: {
                name: 'Monochrome',
                colors: [
                    '#FFFFFF', '#F5F5F5', '#E0E0E0', '#BDBDBD',
                    '#9E9E9E', '#757575', '#616161', '#424242',
                    '#212121', '#000000', '#FAFAFA', '#EEEEEE',
                    '#E5E5E5', '#D4D4D4', '#A3A3A3', '#525252'
                ]
            }
        };
    }

    init() {
        this.createColorPickerUI();
        this.setupEventListeners();
        this.injectStyles();
    }

    createColorPickerUI() {
        const container = document.createElement('div');
        container.id = 'smartColorPicker';
        container.className = 'smart-color-picker-container';
        container.innerHTML = `
            <div class="smart-color-picker-panel">
                <div class="picker-header">
                    <h3>🎨 Smart Color Picker</h3>
                    <button class="picker-close" id="closeColorPicker">
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path stroke="currentColor" stroke-width="2" fill="none" d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                <div class="picker-tabs">
                    <button class="picker-tab active" data-tab="palettes">Palettes</button>
                    <button class="picker-tab" data-tab="recent">Recent</button>
                    <button class="picker-tab" data-tab="favorites">Favorites</button>
                    <button class="picker-tab" data-tab="harmony">Harmony</button>
                </div>

                <div class="picker-content">
                    <!-- Palettes Tab -->
                    <div class="picker-tab-content active" id="palettesTab">
                        ${this.renderPalettes()}
                    </div>

                    <!-- Recent Colors Tab -->
                    <div class="picker-tab-content" id="recentTab">
                        <div class="color-grid" id="recentColorsGrid">
                            ${this.renderRecentColors()}
                        </div>
                        ${this.recentColors.length > 0 ? '<button class="btn-clear-recent" id="clearRecentColors">Clear History</button>' : '<p class="empty-state">No recent colors yet</p>'}
                    </div>

                    <!-- Favorites Tab -->
                    <div class="picker-tab-content" id="favoritesTab">
                        <div class="color-grid" id="favoriteColorsGrid">
                            ${this.renderFavoriteColors()}
                        </div>
                        ${this.favoriteColors.length === 0 ? '<p class="empty-state">No favorite colors yet. Click ⭐ on any color to add to favorites.</p>' : ''}
                    </div>

                    <!-- Harmony Tab -->
                    <div class="picker-tab-content" id="harmonyTab">
                        <div class="harmony-section">
                            <label>Base Color:</label>
                            <input type="color" id="harmonyBaseColor" value="#3B82F6">
                            <div class="harmony-modes">
                                <button class="harmony-btn active" data-mode="complementary">Complementary</button>
                                <button class="harmony-btn" data-mode="analogous">Analogous</button>
                                <button class="harmony-btn" data-mode="triadic">Triadic</button>
                                <button class="harmony-btn" data-mode="monochromatic">Monochromatic</button>
                            </div>
                            <div class="harmony-result" id="harmonyResult"></div>
                        </div>
                    </div>
                </div>

                <div class="picker-footer">
                    <div class="current-color-display">
                        <span>Current:</span>
                        <div class="color-preview" id="currentColorPreview"></div>
                        <span id="currentColorHex">#FFFFFF</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(container);
        this.container = container;
        this.panel = container.querySelector('.smart-color-picker-panel');
    }

    renderPalettes() {
        let html = '';
        for (const [key, palette] of Object.entries(this.palettes)) {
            html += `
                <div class="palette-section">
                    <h4 class="palette-name">${palette.name}</h4>
                    <div class="color-grid">
                        ${palette.colors.map(color => this.renderColorSwatch(color, key === 'gradients')).join('')}
                    </div>
                </div>
            `;
        }
        return html;
    }

    renderColorSwatch(color, isGradient = false) {
        const style = isGradient ? `background: ${color}` : `background-color: ${color}`;
        const displayColor = isGradient ? 'Gradient' : color;
        return `
            <div class="color-swatch"
                 data-color="${color}"
                 style="${style}"
                 title="${displayColor}">
                <div class="swatch-actions">
                    <button class="swatch-action copy-color" title="Copy">
                        <svg viewBox="0 0 24 24" width="14" height="14">
                            <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
                            <path stroke="currentColor" stroke-width="2" fill="none" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                        </svg>
                    </button>
                    <button class="swatch-action favorite-color" title="Add to favorites">
                        <svg viewBox="0 0 24 24" width="14" height="14">
                            <path stroke="currentColor" stroke-width="2" fill="${this.favoriteColors.includes(color) ? 'currentColor' : 'none'}" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    renderRecentColors() {
        if (this.recentColors.length === 0) {
            return '';
        }
        return this.recentColors.map(color => this.renderColorSwatch(color)).join('');
    }

    renderFavoriteColors() {
        if (this.favoriteColors.length === 0) {
            return '';
        }
        return this.favoriteColors.map(color => this.renderColorSwatch(color)).join('');
    }

    setupEventListeners() {
        // Close button
        this.container.querySelector('#closeColorPicker').addEventListener('click', () => {
            this.close();
        });

        // Click outside to close
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.close();
            }
        });

        // Tab switching
        this.container.querySelectorAll('.picker-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Color swatch clicks
        this.container.addEventListener('click', (e) => {
            const swatch = e.target.closest('.color-swatch');
            if (swatch && !e.target.closest('.swatch-action')) {
                this.selectColor(swatch.dataset.color);
            }

            // Copy color
            if (e.target.closest('.copy-color')) {
                const swatch = e.target.closest('.color-swatch');
                this.copyColor(swatch.dataset.color);
            }

            // Favorite color
            if (e.target.closest('.favorite-color')) {
                const swatch = e.target.closest('.color-swatch');
                this.toggleFavorite(swatch.dataset.color);
            }
        });

        // Clear recent colors
        const clearBtn = this.container.querySelector('#clearRecentColors');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearRecentColors();
            });
        }

        // Harmony color generation
        const harmonyBaseColor = this.container.querySelector('#harmonyBaseColor');
        if (harmonyBaseColor) {
            harmonyBaseColor.addEventListener('input', () => {
                this.updateHarmony();
            });
        }

        this.container.querySelectorAll('.harmony-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.container.querySelectorAll('.harmony-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateHarmony();
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.isOpen && e.key === 'Escape') {
                this.close();
            }
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        this.container.querySelectorAll('.picker-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab content
        this.container.querySelectorAll('.picker-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        this.container.querySelector(`#${tabName}Tab`).classList.add('active');
    }

    selectColor(color) {
        this.addToRecentColors(color);

        if (this.currentTarget) {
            this.currentTarget.value = color;
            this.currentTarget.dispatchEvent(new Event('input', { bubbles: true }));
            this.currentTarget.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Update current color display
        const preview = this.container.querySelector('#currentColorPreview');
        const hex = this.container.querySelector('#currentColorHex');
        if (preview && hex) {
            if (color.startsWith('linear-gradient')) {
                preview.style.background = color;
                hex.textContent = 'Gradient';
            } else {
                preview.style.backgroundColor = color;
                hex.textContent = color;
            }
        }

        // Show toast
        this.showToast(`Color ${color} selected!`, 'success');

        // Close after selection
        setTimeout(() => this.close(), 300);
    }

    copyColor(color) {
        navigator.clipboard.writeText(color).then(() => {
            this.showToast(`${color} copied to clipboard!`, 'success');
        }).catch(() => {
            this.showToast('Failed to copy color', 'error');
        });
    }

    toggleFavorite(color) {
        const index = this.favoriteColors.indexOf(color);
        if (index > -1) {
            this.favoriteColors.splice(index, 1);
            this.showToast('Removed from favorites', 'info');
        } else {
            this.favoriteColors.push(color);
            this.showToast('Added to favorites!', 'success');
        }
        this.saveFavoriteColors();
        this.refreshFavoritesTab();
    }

    addToRecentColors(color) {
        // Remove if already exists
        this.recentColors = this.recentColors.filter(c => c !== color);

        // Add to beginning
        this.recentColors.unshift(color);

        // Keep only last 10
        if (this.recentColors.length > 10) {
            this.recentColors = this.recentColors.slice(0, 10);
        }

        this.saveRecentColors();
        this.refreshRecentTab();
    }

    clearRecentColors() {
        this.recentColors = [];
        this.saveRecentColors();
        this.refreshRecentTab();
        this.showToast('Recent colors cleared', 'info');
    }

    refreshRecentTab() {
        const grid = this.container.querySelector('#recentColorsGrid');
        if (grid) {
            grid.innerHTML = this.renderRecentColors();
        }
    }

    refreshFavoritesTab() {
        const grid = this.container.querySelector('#favoriteColorsGrid');
        if (grid) {
            grid.innerHTML = this.renderFavoriteColors();
        }
    }

    updateHarmony() {
        const baseColor = this.container.querySelector('#harmonyBaseColor').value;
        const activeMode = this.container.querySelector('.harmony-btn.active').dataset.mode;
        const colors = this.generateHarmony(baseColor, activeMode);

        const result = this.container.querySelector('#harmonyResult');
        result.innerHTML = `
            <div class="color-grid">
                ${colors.map(color => this.renderColorSwatch(color)).join('')}
            </div>
        `;
    }

    generateHarmony(baseColor, mode) {
        const hsl = this.hexToHSL(baseColor);
        let colors = [baseColor];

        switch (mode) {
            case 'complementary':
                colors.push(this.hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l));
                colors.push(this.hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 20, 100)));
                colors.push(this.hslToHex((hsl.h + 180) % 360, hsl.s, Math.min(hsl.l + 20, 100)));
                break;

            case 'analogous':
                colors.push(this.hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l));
                colors.push(this.hslToHex((hsl.h - 30 + 360) % 360, hsl.s, hsl.l));
                colors.push(this.hslToHex((hsl.h + 60) % 360, hsl.s, hsl.l));
                break;

            case 'triadic':
                colors.push(this.hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l));
                colors.push(this.hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l));
                break;

            case 'monochromatic':
                colors.push(this.hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 20, 0)));
                colors.push(this.hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 40, 0)));
                colors.push(this.hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 20, 100)));
                break;
        }

        return colors;
    }

    hexToHSL(hex) {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return { h: h * 360, s: s * 100, l: l * 100 };
    }

    hslToHex(h, s, l) {
        s /= 100;
        l /= 100;

        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r = 0, g = 0, b = 0;

        if (0 <= h && h < 60) {
            r = c; g = x; b = 0;
        } else if (60 <= h && h < 120) {
            r = x; g = c; b = 0;
        } else if (120 <= h && h < 180) {
            r = 0; g = c; b = x;
        } else if (180 <= h && h < 240) {
            r = 0; g = x; b = c;
        } else if (240 <= h && h < 300) {
            r = x; g = 0; b = c;
        } else if (300 <= h && h < 360) {
            r = c; g = 0; b = x;
        }

        const toHex = (n) => {
            const hex = Math.round((n + m) * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
    }

    open(targetInput) {
        this.currentTarget = targetInput;
        this.container.classList.add('active');
        this.isOpen = true;

        // Update current color display
        if (targetInput && targetInput.value) {
            const preview = this.container.querySelector('#currentColorPreview');
            const hex = this.container.querySelector('#currentColorHex');
            if (preview && hex) {
                preview.style.backgroundColor = targetInput.value;
                hex.textContent = targetInput.value;
            }
        }

        // Update harmony tab
        this.updateHarmony();
    }

    close() {
        this.container.classList.remove('active');
        this.isOpen = false;
        this.currentTarget = null;
    }

    showToast(message, type = 'info') {
        // Use V6UI toast if available
        if (window.imageTextApp?.components?.v6ui) {
            window.imageTextApp.components.v6ui.showToast(message, type, 2000);
        }
    }

    loadRecentColors() {
        try {
            const saved = localStorage.getItem('smartColorPicker_recent');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    }

    saveRecentColors() {
        try {
            localStorage.setItem('smartColorPicker_recent', JSON.stringify(this.recentColors));
        } catch (e) {
            console.error('Failed to save recent colors:', e);
        }
    }

    loadFavoriteColors() {
        try {
            const saved = localStorage.getItem('smartColorPicker_favorites');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    }

    saveFavoriteColors() {
        try {
            localStorage.setItem('smartColorPicker_favorites', JSON.stringify(this.favoriteColors));
        } catch (e) {
            console.error('Failed to save favorite colors:', e);
        }
    }

    injectStyles() {
        if (document.getElementById('smartColorPickerStyles')) return;

        const style = document.createElement('style');
        style.id = 'smartColorPickerStyles';
        style.textContent = `
            .smart-color-picker-container {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
                z-index: 10000;
                display: none;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.2s ease;
            }

            .smart-color-picker-container.active {
                display: flex;
            }

            .smart-color-picker-panel {
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                width: 90%;
                max-width: 600px;
                max-height: 80vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            @keyframes slideUp {
                from {
                    transform: translateY(30px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            .picker-header {
                padding: 20px;
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }

            .picker-header h3 {
                margin: 0;
                font-size: 1.25rem;
                font-weight: 600;
                color: white;
            }

            .picker-close {
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 8px;
                padding: 8px;
                cursor: pointer;
                color: white;
                transition: all 0.2s;
            }

            .picker-close:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: scale(1.1);
            }

            .picker-tabs {
                display: flex;
                gap: 8px;
                padding: 16px;
                background: #f9fafb;
                border-bottom: 1px solid #e5e7eb;
            }

            .picker-tab {
                flex: 1;
                padding: 10px 16px;
                border: none;
                background: white;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                color: #6b7280;
                transition: all 0.2s;
            }

            .picker-tab.active {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }

            .picker-tab:hover:not(.active) {
                background: #f3f4f6;
            }

            .picker-content {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }

            .picker-tab-content {
                display: none;
            }

            .picker-tab-content.active {
                display: block;
            }

            .palette-section {
                margin-bottom: 24px;
            }

            .palette-name {
                font-size: 0.875rem;
                font-weight: 600;
                color: #374151;
                margin: 0 0 12px 0;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .color-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
                gap: 12px;
            }

            .color-swatch {
                aspect-ratio: 1;
                border-radius: 8px;
                cursor: pointer;
                position: relative;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                transition: all 0.2s;
            }

            .color-swatch:hover {
                transform: scale(1.1);
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
                z-index: 10;
            }

            .swatch-actions {
                position: absolute;
                top: 4px;
                right: 4px;
                display: flex;
                gap: 4px;
                opacity: 0;
                transition: opacity 0.2s;
            }

            .color-swatch:hover .swatch-actions {
                opacity: 1;
            }

            .swatch-action {
                background: rgba(255, 255, 255, 0.9);
                border: none;
                border-radius: 4px;
                padding: 4px;
                cursor: pointer;
                color: #374151;
                transition: all 0.2s;
            }

            .swatch-action:hover {
                background: white;
                transform: scale(1.1);
            }

            .empty-state {
                text-align: center;
                color: #9ca3af;
                padding: 40px 20px;
                font-size: 0.875rem;
            }

            .btn-clear-recent {
                margin-top: 16px;
                padding: 8px 16px;
                background: #ef4444;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s;
            }

            .btn-clear-recent:hover {
                background: #dc2626;
                transform: translateY(-1px);
            }

            .harmony-section {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .harmony-section label {
                font-weight: 600;
                color: #374151;
            }

            .harmony-section input[type="color"] {
                width: 100%;
                height: 60px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
            }

            .harmony-modes {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
            }

            .harmony-btn {
                padding: 12px;
                border: 2px solid #e5e7eb;
                background: white;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                color: #6b7280;
                transition: all 0.2s;
            }

            .harmony-btn.active {
                border-color: #667eea;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            .harmony-btn:hover:not(.active) {
                border-color: #667eea;
                background: #f3f4f6;
            }

            .harmony-result {
                margin-top: 16px;
            }

            .picker-footer {
                padding: 16px 20px;
                border-top: 1px solid #e5e7eb;
                background: #f9fafb;
            }

            .current-color-display {
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 0.875rem;
                color: #6b7280;
            }

            .color-preview {
                width: 40px;
                height: 40px;
                border-radius: 8px;
                border: 2px solid #e5e7eb;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            #currentColorHex {
                font-family: 'Courier New', monospace;
                font-weight: 600;
                color: #374151;
            }

            @media (max-width: 768px) {
                .smart-color-picker-panel {
                    width: 95%;
                    max-height: 90vh;
                }

                .color-grid {
                    grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
                    gap: 8px;
                }

                .picker-tabs {
                    overflow-x: auto;
                }

                .picker-tab {
                    flex: 0 0 auto;
                    min-width: 100px;
                }
            }
        `;
        document.head.appendChild(style);
    }
}
