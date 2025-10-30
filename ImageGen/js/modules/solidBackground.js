/* =====================================================
   SOLID-BACKGROUND.JS - Solid Color Background Generator (v7.0)
   Create images with solid color backgrounds
   ===================================================== */

import { utils } from './utils.js';

export class SolidBackgroundGenerator {
    constructor(state) {
        this.state = state;
        this.defaultColors = [
            { name: 'Instagram Gradient', colors: ['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888'] },
            { name: 'Sunset', colors: ['#ff6b6b', '#ee5a6f', '#c44569', '#913d88'] },
            { name: 'Ocean', colors: ['#12c2e9', '#c471ed', '#f64f59'] },
            { name: 'Forest', colors: ['#134e5e', '#71b280'] },
            { name: 'Purple Dream', colors: ['#c471f5', '#fa71cd'] },
            { name: 'Warm Flame', colors: ['#ff9a56', '#ff6a88', '#ff99ac'] },
            { name: 'Night Fade', colors: ['#a18cd1', '#fbc2eb'] },
            { name: 'Spring Warmth', colors: ['#fad0c4', '#ffd1ff'] },
        ];

        this.sizes = [
            { name: 'Instagram Square', width: 1080, height: 1080 },
            { name: 'Instagram Story', width: 1080, height: 1920 },
            { name: 'Facebook Post', width: 1200, height: 630 },
            { name: 'Twitter Post', width: 1200, height: 675 },
            { name: 'YouTube Thumbnail', width: 1280, height: 720 },
            { name: 'Custom', width: 1080, height: 1080 }
        ];

        this.initialize();
    }

    initialize() {
        this.setupUI();
        console.log('✨ Solid Background Generator initialized');
    }

    setupUI() {
        const container = document.getElementById('solidBackgroundSection');
        if (!container) return;

        const contentDiv = container.querySelector('.section-content') || container;

        contentDiv.innerHTML = `
            <div class="v7-solid-bg-controls">
                <!-- Size Selection -->
                <div class="v7-form-group">
                    <label class="v7-label">Canvas Size</label>
                    <select id="solidBgSize" class="v7-select">
                        ${this.sizes.map((size, idx) => `
                            <option value="${idx}">${size.name} (${size.width}×${size.height})</option>
                        `).join('')}
                    </select>
                </div>

                <!-- Custom Size (hidden by default) -->
                <div id="customSizeControls" class="v7-form-group" style="display: none;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label class="v7-label-sm">Width (px)</label>
                            <input type="number" id="customWidth" class="v7-input" value="1080" min="100" max="4000">
                        </div>
                        <div>
                            <label class="v7-label-sm">Height (px)</label>
                            <input type="number" id="customHeight" class="v7-input" value="1080" min="100" max="4000">
                        </div>
                    </div>
                </div>

                <!-- Background Type -->
                <div class="v7-form-group">
                    <label class="v7-label">Background Type</label>
                    <div class="v7-radio-group">
                        <label class="v7-radio-label">
                            <input type="radio" name="solidBgType" value="solid" checked>
                            <span>Solid Color</span>
                        </label>
                        <label class="v7-radio-label">
                            <input type="radio" name="solidBgType" value="gradient">
                            <span>Gradient</span>
                        </label>
                    </div>
                </div>

                <!-- Solid Color Picker -->
                <div id="solidColorControls" class="v7-form-group">
                    <label class="v7-label">Background Color</label>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <input type="color" id="solidBgColor" class="v7-color-input" value="#6366f1">
                        <input type="text" id="solidBgColorHex" class="v7-input" value="#6366f1" style="flex: 1;">
                    </div>
                </div>

                <!-- Gradient Controls -->
                <div id="gradientControls" class="v7-form-group" style="display: none;">
                    <label class="v7-label">Gradient Colors</label>
                    <div style="display: grid; gap: 8px;">
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <input type="color" id="gradientColor1" class="v7-color-input-sm" value="#f09433">
                            <span style="font-size: 0.875rem; color: var(--v6-text-secondary);">Start</span>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <input type="color" id="gradientColor2" class="v7-color-input-sm" value="#bc1888">
                            <span style="font-size: 0.875rem; color: var(--v6-text-secondary);">End</span>
                        </div>
                    </div>

                    <label class="v7-label" style="margin-top: 12px;">Direction</label>
                    <div class="v7-gradient-direction">
                        <button type="button" class="v7-dir-btn active" data-angle="135" title="Diagonal ↗">↗</button>
                        <button type="button" class="v7-dir-btn" data-angle="90" title="Up ↑">↑</button>
                        <button type="button" class="v7-dir-btn" data-angle="180" title="Right →">→</button>
                        <button type="button" class="v7-dir-btn" data-angle="0" title="Down ↓">↓</button>
                    </div>

                    <!-- Gradient Presets -->
                    <label class="v7-label" style="margin-top: 12px;">Quick Presets</label>
                    <div class="v7-gradient-presets">
                        ${this.defaultColors.map((preset, idx) => `
                            <button type="button" class="v7-gradient-preset" data-preset="${idx}" title="${preset.name}"
                                style="background: linear-gradient(135deg, ${preset.colors.join(', ')})">
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="v7-btn-group" style="margin-top: 16px;">
                    <button id="generateSolidBg" class="v7-btn v7-btn-primary" style="flex: 1;">
                        <svg class="v7-btn-icon" viewBox="0 0 24 24">
                            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
                            <path stroke="currentColor" stroke-width="2" d="M12 8v8M8 12h8"/>
                        </svg>
                        Generate Background
                    </button>
                </div>

                <div class="v7-help-text" style="margin-top: 12px;">
                    💡 Tip: Generate solid color backgrounds and add text without uploading images!
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Size selector
        const sizeSelect = document.getElementById('solidBgSize');
        if (sizeSelect) {
            sizeSelect.addEventListener('change', (e) => {
                const customControls = document.getElementById('customSizeControls');
                if (customControls) {
                    customControls.style.display = e.target.value === '5' ? 'block' : 'none';
                }
            });
        }

        // Background type toggle
        document.querySelectorAll('input[name="solidBgType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const solidControls = document.getElementById('solidColorControls');
                const gradientControls = document.getElementById('gradientControls');

                if (solidControls && gradientControls) {
                    if (e.target.value === 'solid') {
                        solidControls.style.display = 'block';
                        gradientControls.style.display = 'none';
                    } else {
                        solidControls.style.display = 'none';
                        gradientControls.style.display = 'block';
                    }
                }
            });
        });

        // Solid color sync
        const colorInput = document.getElementById('solidBgColor');
        const colorHex = document.getElementById('solidBgColorHex');
        if (colorInput && colorHex) {
            colorInput.addEventListener('input', (e) => {
                colorHex.value = e.target.value;
            });
            colorHex.addEventListener('input', (e) => {
                if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                    colorInput.value = e.target.value;
                }
            });
        }

        // Gradient direction buttons
        document.querySelectorAll('.v7-dir-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.v7-dir-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Gradient presets
        document.querySelectorAll('.v7-gradient-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const presetIdx = parseInt(e.target.dataset.preset);
                const preset = this.defaultColors[presetIdx];
                if (preset && preset.colors.length >= 2) {
                    const color1Input = document.getElementById('gradientColor1');
                    const color2Input = document.getElementById('gradientColor2');
                    if (color1Input) color1Input.value = preset.colors[0];
                    if (color2Input) color2Input.value = preset.colors[preset.colors.length - 1];
                }
            });
        });

        // Generate button
        const generateBtn = document.getElementById('generateSolidBg');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateBackground());
        }
    }

    generateBackground() {
        const sizeSelect = document.getElementById('solidBgSize');
        const bgType = document.querySelector('input[name="solidBgType"]:checked')?.value || 'solid';

        // Get size
        let width, height;
        const sizeIdx = parseInt(sizeSelect.value);
        if (sizeIdx === 5) { // Custom
            width = parseInt(document.getElementById('customWidth')?.value) || 1080;
            height = parseInt(document.getElementById('customHeight')?.value) || 1080;
        } else {
            width = this.sizes[sizeIdx].width;
            height = this.sizes[sizeIdx].height;
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Draw background
        if (bgType === 'solid') {
            const color = document.getElementById('solidBgColor')?.value || '#6366f1';
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, width, height);
        } else {
            const color1 = document.getElementById('gradientColor1')?.value || '#f09433';
            const color2 = document.getElementById('gradientColor2')?.value || '#bc1888';
            const angle = parseInt(document.querySelector('.v7-dir-btn.active')?.dataset.angle || '135');

            const gradient = this.createGradient(ctx, width, height, color1, color2, angle);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        }

        // Convert to blob and add to state
        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], `background-${Date.now()}.png`, { type: 'image/png' });
                this.addToState(file, canvas);
            }
        }, 'image/png');
    }

    createGradient(ctx, width, height, color1, color2, angle) {
        const angleRad = (angle * Math.PI) / 180;
        const centerX = width / 2;
        const centerY = height / 2;
        const length = Math.max(width, height);

        const x0 = centerX - Math.cos(angleRad) * length / 2;
        const y0 = centerY - Math.sin(angleRad) * length / 2;
        const x1 = centerX + Math.cos(angleRad) * length / 2;
        const y1 = centerY + Math.sin(angleRad) * length / 2;

        const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);

        return gradient;
    }

    async addToState(file, canvas) {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.onload = () => {
                this.state.imageFiles.push(file);
                this.state.images.push({
                    img: img,
                    file: file
                });

                // Update UI
                if (window.imageTextApp?.components?.controls) {
                    window.imageTextApp.components.controls.updateUploadedImages();
                }

                // Show success
                if (window.imageTextApp?.components?.v6ui) {
                    window.imageTextApp.components.v6ui.showToast(
                        `✨ Background created (${canvas.width}×${canvas.height})`,
                        'success',
                        3000
                    );
                }
            };
            img.src = e.target.result;
        };

        reader.readAsDataURL(file);
    }
}
