/* =====================================================
   PREVIEWPANEL.JS - Preview Panel Module (v3 - Optimized ZIP)
   ===================================================== */

import { utils } from './utils.js';

export class PreviewPanel {
    constructor(DOM, state) {
        this.DOM = DOM;
        this.state = state;
        this.textConfigs = [];
        this.lazyLoadObserver = null;
        this.canvasPool = [];
        this.canvasCache = new Map(); // Cache cho canvas đã render

        this.initialize();
    }

    initialize() {
        this.setupLazyLoading();
        window.renderImages = () => this.render();
        console.log('Preview panel initialized');
    }

    render() {
        const textLines = this.getTextLines();
        if (!textLines.length || !this.state.images.length) {
            this.showEmptyState();
            return;
        }

        this.clearPreview();

        const repeatBackground = this.DOM.repeatBackgroundCheckbox?.checked || false;
        const totalImages = repeatBackground ? textLines.length : this.state.images.length;

        this.textConfigs = [];

        this.showPreviewActions();

        const container = this.createPreviewContainer(totalImages);

        for (let i = 0; i < totalImages; i++) {
            const imageIndex = i % this.state.images.length;
            const textIndex = repeatBackground ? i : 0;

            const config = {
                imageIndex,
                textIndex,
                text: textLines[textIndex] || textLines[0],
                position: this.DOM.positionPicker?.value || 'bottom',
                fileName: this.state.images[imageIndex].file.name
            };

            this.textConfigs.push(config);

            const previewItem = this.createPreviewItem(config, i + 1);
            container.appendChild(previewItem);
        }

        this.addDownloadAllButton();
        this.observePreviewItems();
    }

    getTextLines() {
        const text = this.DOM.textInput?.value?.trim() || '';
        return text ? text.split('\n').filter(line => line.trim()) : [];
    }

    clearPreview() {
        const container = this.DOM.canvasContainer;
        if (!container) return;

        container.innerHTML = '';

        this.canvasPool.forEach(canvas => {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
        this.canvasPool = [];

        if (this.lazyLoadObserver) {
            this.lazyLoadObserver.disconnect();
        }

        // Clear canvas cache khi render lại
        this.canvasCache.clear();
    }

    showEmptyState() {
        const container = this.DOM.canvasContainer;
        if (!container) return;

        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" class="empty-icon">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
                    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                    <path stroke="currentColor" stroke-width="2" fill="none" d="M21 15l-5-5L5 21"/>
                </svg>
                <p>Your edited images will appear here</p>
            </div>
        `;

        const previewActions = document.getElementById('previewActions');
        if (previewActions) {
            previewActions.style.display = 'none';
        }
    }

    showPreviewActions() {
        const previewActions = document.getElementById('previewActions');
        if (previewActions) {
            previewActions.style.display = 'flex';

            const globalPosition = document.getElementById('globalPosition');
            if (globalPosition) {
                globalPosition.value = this.DOM.positionPicker?.value || 'bottom';
            }

            const applyAllBtn = document.getElementById('applyAllPosition');
            if (applyAllBtn) {
                applyAllBtn.onclick = () => this.applyPositionToAll();
            }
        }
    }

    createPreviewContainer(totalImages) {
        const container = utils.dom.createElement('div', {
            className: 'preview-container'
        });

        const info = utils.dom.createElement('div', {
            className: 'image-count-info'
        });

        info.innerHTML = `
            <div class="info-content">
                <svg width="20" height="20" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
                <span><strong>${totalImages}</strong> image${totalImages > 1 ? 's' : ''} will be generated</span>
            </div>
        `;

        this.DOM.canvasContainer.appendChild(info);

        const grid = utils.dom.createElement('div', {
            className: 'preview-grid'
        });

        this.DOM.canvasContainer.appendChild(grid);

        return grid;
    }

    createPreviewItem(config, number) {
        const container = utils.dom.createElement('div', {
            className: 'image-container lazy-item',
            'data-config': JSON.stringify(config),
            'data-number': number
        });

        container.innerHTML = `
            <div class="image-label">#${number}</div>
            <div class="lazy-placeholder">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                </svg>
                <span>Loading...</span>
            </div>
        `;

        return container;
    }

    setupLazyLoading() {
        const options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.01
        };

        this.lazyLoadObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const container = entry.target;
                    if (!container.classList.contains('loaded')) {
                        this.loadPreviewItem(container);
                        container.classList.add('loaded');
                    }
                }
            });
        }, options);
    }

    observePreviewItems() {
        const items = this.DOM.canvasContainer.querySelectorAll('.lazy-item');
        items.forEach(item => {
            this.lazyLoadObserver.observe(item);
        });
    }

    loadPreviewItem(container) {
        const config = JSON.parse(container.dataset.config);
        const number = parseInt(container.dataset.number);
        const configIndex = number - 1;

        container.innerHTML = '';

        const label = utils.dom.createElement('div', {
            className: 'image-label',
            textContent: `#${number}`
        });
        container.appendChild(label);

        const canvas = this.createPreviewCanvas(this.textConfigs[configIndex]);
        container.appendChild(canvas);

        const controls = this.createImageControls(this.textConfigs[configIndex], canvas);
        controls.dataset.configIndex = configIndex;
        container.appendChild(controls);
    }

    createPreviewCanvas(config) {
        const { img } = this.state.images[config.imageIndex];

        const maxWidth = 200;
        const scale = Math.min(maxWidth / img.width, 0.3);

        const canvas = utils.canvas.createOffscreenCanvas(
            Math.round(img.width * scale),
            Math.round(img.height * scale)
        );

        canvas.className = 'preview-canvas';

        const ctx = canvas.getContext('2d', {
            willReadFrequently: false,
            alpha: false
        });

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        this.renderTextOnCanvas(ctx, canvas, config);

        return canvas;
    }

    getMainFontSize() {
        if (!this.DOM.mainFontSize) return 48;
        const value = parseInt(this.DOM.mainFontSize.value);
        return isNaN(value) ? 48 : value;
    }

    getSubFontSize() {
        if (!this.DOM.subFontSize) return 32;
        const value = parseInt(this.DOM.subFontSize.value);
        return isNaN(value) ? 32 : value;
    }

    getFontEffects() {
        return {
            fontWeight: this.DOM.fontWeightSelect?.value || '400',
            fontStyle: this.DOM.fontStyleSelect?.value || 'normal',
            textUnderline: this.DOM.textUnderlineCheckbox?.checked || false,
            textBorder: this.DOM.textBorderCheckbox?.checked || false,
            textShadow: this.DOM.textShadowCheckbox?.checked || false,
            borderWidth: this.DOM.textBorderCheckbox?.checked ? parseFloat(this.DOM.borderWidth?.value || '2') : 0,
            shadowBlur: this.DOM.textShadowCheckbox?.checked ? parseInt(this.DOM.shadowBlur?.value || '4') : 0
        };
    }

    renderTextOnCanvas(ctx, canvas, config) {
        const lines = config.text.split(':');
        const mainText = lines[0].trim();
        const subtitle = lines[1]?.trim() || '';

        const mainFontSizeValue = this.getMainFontSize();
        const subFontSizeValue = this.getSubFontSize();

        const scale = 200 / 1080;
        const mainFontSize = Math.round(mainFontSizeValue * scale);
        const subFontSize = Math.round(subFontSizeValue * scale);

        const effects = this.getFontEffects();

        let y;
        switch (config.position) {
            case 'top': y = mainFontSize * 1.5; break;
            case 'upper-middle': y = canvas.height * 0.25; break;
            case 'middle': y = canvas.height * 0.5; break;
            case 'lower-middle': y = canvas.height * 0.75; break;
            case 'bottom': y = canvas.height - mainFontSize * 2.5; break;
            default: y = canvas.height - mainFontSize * 2.5;
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const selectedFont = this.DOM.fontSelect?.value || 'Inter, sans-serif';
        const canvasFont = selectedFont.replace(/['"]/g, '');

        // ===== DRAW MAIN TEXT =====
        if (mainText) {
            const fontStr = `${effects.fontStyle} ${effects.fontWeight} ${mainFontSize}px ${canvasFont}`;
            ctx.font = fontStr;
            ctx.fillStyle = this.DOM.colorPicker?.value || '#FFFFFF';

            if (effects.textShadow) {
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = effects.shadowBlur;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
            } else {
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
            }

            if (effects.textBorder) {
                ctx.lineWidth = effects.borderWidth;
                ctx.strokeStyle = 'rgba(0,0,0,0.8)';
            }

            const mainLines = this.wrapText(ctx, mainText, canvas.width * 0.9);
            mainLines.forEach((line, index) => {
                const lineY = y + (index * mainFontSize * 1.8);

                if (effects.textBorder) {
                    ctx.strokeText(line, canvas.width / 2, lineY);
                }

                ctx.fillText(line, canvas.width / 2, lineY);

                if (effects.textUnderline) {
                    const metrics = ctx.measureText(line);
                    const startX = canvas.width / 2 - metrics.width / 2;
                    ctx.strokeStyle = this.DOM.colorPicker?.value || '#FFFFFF';
                    ctx.lineWidth = Math.max(1, mainFontSize * 0.08);
                    ctx.beginPath();
                    ctx.moveTo(startX, lineY + mainFontSize * 0.2);
                    ctx.lineTo(startX + metrics.width, lineY + mainFontSize * 0.2);
                    ctx.stroke();
                }
            });

            y += mainLines.length * mainFontSize * 1.8;
        }

        // ===== DRAW SUBTITLE =====
        if (subtitle) {
            const fontStr = `${effects.fontStyle} ${effects.fontWeight} ${subFontSize}px ${canvasFont}`;
            ctx.font = fontStr;

            if (this.DOM.subtitleBgCheckbox?.checked) {
                const bgColor = utils.hexToRGBA(
                    this.DOM.bgColorPicker?.value || '#000000',
                    this.DOM.bgOpacity?.value || '28'
                );

                const subLines = this.wrapText(ctx, subtitle, canvas.width * 0.85);
                const padding = Math.max(2, subFontSize * 0.3);
                let maxWidth = 0;

                subLines.forEach(line => {
                    maxWidth = Math.max(maxWidth, ctx.measureText(line).width);
                });

                utils.canvas.drawRoundedRect(
                    ctx,
                    (canvas.width - maxWidth) / 2 - padding,
                    y - padding,
                    maxWidth + padding * 2,
                    subLines.length * subFontSize * 1.5 + padding * 2,
                    Math.max(2, subFontSize * 0.2),
                    bgColor
                );
            }

            if (effects.textShadow) {
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = effects.shadowBlur;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
            }

            if (effects.textBorder) {
                ctx.lineWidth = effects.borderWidth;
                ctx.strokeStyle = 'rgba(0,0,0,0.8)';
            }

            ctx.fillStyle = this.DOM.subColorPicker?.value || '#FFFFFF';

            const subLines = this.wrapText(ctx, subtitle, canvas.width * 0.85);
            subLines.forEach((line, index) => {
                const lineY = y + subFontSize + (index * subFontSize * 1.5);

                if (effects.textBorder) {
                    ctx.strokeText(line, canvas.width / 2, lineY);
                }

                ctx.fillText(line, canvas.width / 2, lineY);

                if (effects.textUnderline) {
                    const metrics = ctx.measureText(line);
                    const startX = canvas.width / 2 - metrics.width / 2;
                    ctx.strokeStyle = this.DOM.subColorPicker?.value || '#FFFFFF';
                    ctx.lineWidth = Math.max(1, subFontSize * 0.08);
                    ctx.beginPath();
                    ctx.moveTo(startX, lineY + subFontSize * 0.2);
                    ctx.lineTo(startX + metrics.width, lineY + subFontSize * 0.2);
                    ctx.stroke();
                }
            });
        }

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }

    wrapText(ctx, text, maxWidth) {
        const userLines = text.split('\\n');
        const allLines = [];

        userLines.forEach(userLine => {
            const words = userLine.trim().split(' ');
            let currentLine = '';

            words.forEach(word => {
                const testLine = currentLine + word + ' ';
                const metrics = ctx.measureText(testLine);

                if (metrics.width > maxWidth && currentLine !== '') {
                    allLines.push(currentLine.trim());
                    currentLine = word + ' ';
                } else {
                    currentLine = testLine;
                }
            });

            if (currentLine.trim()) {
                allLines.push(currentLine.trim());
            }
        });

        return allLines;
    }

    async downloadSingleImage(config, button) {
        button.disabled = true;
        button.innerHTML = 'Processing...';

        try {
            const canvas = await this.generateFullCanvas(config);
            const format = await this.getFormatPreference();

            const blob = await new Promise(resolve => {
                const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
                const quality = format === 'png' ? undefined : 0.8; // Giảm từ 0.85
                canvas.toBlob(resolve, mimeType, quality);
            });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `image_${config.textIndex + 1}.${format}`;
            link.click();

            setTimeout(() => URL.revokeObjectURL(link.href), 100);

        } catch (error) {
            console.error('Download error:', error);
            this.showErrorNotification('Failed to download image');
        } finally {
            button.disabled = false;
            button.innerHTML = `
                <svg viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-width="2" fill="none" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Download
            `;
        }
    }

    getConfigHash(config) {
        // Tạo hash key cho cache
        return JSON.stringify({
            imageIndex: config.imageIndex,
            text: config.text,
            position: config.position,
            mainFont: this.getMainFontSize(),
            subFont: this.getSubFontSize(),
            effects: this.getFontEffects(),
            colors: {
                main: this.DOM.colorPicker?.value,
                sub: this.DOM.subColorPicker?.value,
                bg: this.DOM.bgColorPicker?.value
            }
        });
    }

    async generateFullCanvas(config) {
        // Check cache trước
        const cacheKey = this.getConfigHash(config);
        if (this.canvasCache.has(cacheKey)) {
            const cachedCanvas = this.canvasCache.get(cacheKey);
            // Clone canvas để tránh bị modify
            const clonedCanvas = utils.canvas.createOffscreenCanvas(cachedCanvas.width, cachedCanvas.height);
            const ctx = clonedCanvas.getContext('2d');
            ctx.drawImage(cachedCanvas, 0, 0);
            return clonedCanvas;
        }

        const { img } = this.state.images[config.imageIndex];

        const maxWidth = 1080;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;

        const canvas = utils.canvas.createOffscreenCanvas(
            Math.min(img.width, maxWidth),
            Math.round(img.height * scale)
        );

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        this.renderFullText(ctx, canvas, config);

        // Lưu vào cache
        this.canvasCache.set(cacheKey, canvas);

        return canvas;
    }

    renderFullText(ctx, canvas, config) {
        const lines = config.text.split(':');
        const mainText = lines[0].trim();
        const subtitle = lines[1]?.trim() || '';

        const mainFontSize = this.getMainFontSize();
        const subFontSize = this.getSubFontSize();

        const effects = this.getFontEffects();

        let y;
        switch (config.position) {
            case 'top': y = mainFontSize * 2; break;
            case 'upper-middle': y = canvas.height * 0.25; break;
            case 'middle': y = canvas.height * 0.5 - mainFontSize; break;
            case 'lower-middle': y = canvas.height * 0.75; break;
            case 'bottom': y = canvas.height - mainFontSize * 3; break;
            default: y = canvas.height - mainFontSize * 3;
        }

        const selectedFont = this.DOM.fontSelect?.value || 'Inter, sans-serif';
        const canvasFont = selectedFont.replace(/['"]/g, '');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // ===== DRAW MAIN TEXT (FULL RES) =====
        if (mainText) {
            const fontStr = `${effects.fontStyle} ${effects.fontWeight} ${mainFontSize}px ${canvasFont}`;
            ctx.font = fontStr;
            ctx.fillStyle = this.DOM.colorPicker?.value || '#FFFFFF';

            if (effects.textShadow) {
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = effects.shadowBlur * 2;
                ctx.shadowOffsetX = 4;
                ctx.shadowOffsetY = 4;
            } else {
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
            }

            if (effects.textBorder) {
                ctx.lineWidth = effects.borderWidth * 2;
                ctx.strokeStyle = 'rgba(0,0,0,0.96)';
            }

            const mainLines = this.wrapText(ctx, mainText, canvas.width * 0.9);
            mainLines.forEach((line, index) => {
                const lineY = y + (index * mainFontSize * 2);

                if (effects.textBorder) {
                    ctx.strokeText(line, canvas.width / 2, lineY);
                }

                ctx.fillText(line, canvas.width / 2, lineY);

                if (effects.textUnderline) {
                    const metrics = ctx.measureText(line);
                    const startX = canvas.width / 2 - metrics.width / 2;
                    ctx.strokeStyle = this.DOM.colorPicker?.value || '#FFFFFF';
                    ctx.lineWidth = Math.max(2, mainFontSize * 0.1);
                    ctx.beginPath();
                    ctx.moveTo(startX, lineY + mainFontSize * 0.25);
                    ctx.lineTo(startX + metrics.width, lineY + mainFontSize * 0.25);
                    ctx.stroke();
                }
            });

            y += mainLines.length * mainFontSize * 2.5;
        }

        // ===== DRAW SUBTITLE (FULL RES) =====
        if (subtitle) {
            const fontStr = `${effects.fontStyle} ${effects.fontWeight} ${subFontSize}px ${canvasFont}`;
            ctx.font = fontStr;

            const subLines = this.wrapText(ctx, subtitle, canvas.width * 0.85);

            if (this.DOM.subtitleBgCheckbox?.checked) {
                const padding = subFontSize * 0.8;
                let maxWidth = 0;

                subLines.forEach(line => {
                    maxWidth = Math.max(maxWidth, ctx.measureText(line).width);
                });

                const bgColor = utils.hexToRGBA(
                    this.DOM.bgColorPicker?.value || '#000000',
                    this.DOM.bgOpacity?.value || '28'
                );

                utils.canvas.drawRoundedRect(
                    ctx,
                    (canvas.width - maxWidth) / 2 - padding,
                    y - padding,
                    maxWidth + padding * 2,
                    subLines.length * subFontSize * 1.5 + padding * 2,
                    Math.max(4, subFontSize * 0.3),
                    bgColor
                );
            }

            if (effects.textShadow) {
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = effects.shadowBlur * 2;
                ctx.shadowOffsetX = 4;
                ctx.shadowOffsetY = 4;
            }

            if (effects.textBorder) {
                ctx.lineWidth = effects.borderWidth * 2;
                ctx.strokeStyle = 'rgba(0,0,0,0.96)';
            }

            ctx.fillStyle = this.DOM.subColorPicker?.value || '#FFFFFF';

            subLines.forEach((line, index) => {
                const lineY = y + subFontSize + (index * subFontSize * 1.5);

                if (effects.textBorder) {
                    ctx.strokeText(line, canvas.width / 2, lineY);
                }

                ctx.fillText(line, canvas.width / 2, lineY);

                if (effects.textUnderline) {
                    const metrics = ctx.measureText(line);
                    const startX = canvas.width / 2 - metrics.width / 2;
                    ctx.strokeStyle = this.DOM.subColorPicker?.value || '#FFFFFF';
                    ctx.lineWidth = Math.max(2, subFontSize * 0.1);
                    ctx.beginPath();
                    ctx.moveTo(startX, lineY + subFontSize * 0.25);
                    ctx.lineTo(startX + metrics.width, lineY + subFontSize * 0.25);
                    ctx.stroke();
                }
            });
        }

        this.renderCredit(ctx, canvas);

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }

    renderCredit(ctx, canvas) {
        const credit = this.DOM.creditInput?.value?.trim() || '';
        if (!credit) return;

        const creditFontSize = Math.min(canvas.width, canvas.height) * 0.04;
        const selectedFont = this.DOM.fontSelect?.value || 'Inter, sans-serif';
        const canvasFont = selectedFont.replace(/['"]/g, '');

        ctx.font = `bold ${creditFontSize}px ${canvasFont}`;
        ctx.fillStyle = this.DOM.subColorPicker?.value || '#FFFFFF';
        ctx.textAlign = 'right';
        ctx.strokeStyle = 'rgba(0,0,0,0.96)';
        ctx.lineWidth = creditFontSize * 0.1;

        const padding = creditFontSize;
        ctx.strokeText(credit, canvas.width - padding, canvas.height - padding);
        ctx.fillText(credit, canvas.width - padding, canvas.height - padding);
    }

    async getFormatPreference() {
        const lastFormat = localStorage.getItem('preferredImageFormat') || 'jpeg';

        if (!window.event || !window.event.shiftKey) {
            return lastFormat;
        }

        return await this.showFormatDialog();
    }

    showFormatDialog() {
        return new Promise((resolve) => {
            const dialog = utils.dom.createElement('div', {
                className: 'format-dialog'
            });

            const overlay = utils.dom.createElement('div', {
                className: 'dialog-overlay',
                onclick: () => {
                    overlay.remove();
                    dialog.remove();
                    resolve('jpeg');
                }
            });

            dialog.innerHTML = `
                <h3>Choose Format</h3>
                <div class="format-options">
                    <button class="format-btn" data-format="jpeg">
                        <strong>JPEG</strong>
                        <small>Smaller size, faster</small>
                    </button>
                    <button class="format-btn" data-format="png">
                        <strong>PNG</strong>
                        <small>Higher quality, larger size</small>
                    </button>
                </div>
            `;

            dialog.querySelectorAll('.format-btn').forEach(btn => {
                btn.onclick = () => {
                    const format = btn.dataset.format;
                    localStorage.setItem('preferredImageFormat', format);
                    overlay.remove();
                    dialog.remove();
                    resolve(format);
                };
            });

            document.body.appendChild(overlay);
            document.body.appendChild(dialog);
        });
    }

    createImageControls(config, canvas) {
        const controls = utils.dom.createElement('div', {
            className: 'image-controls'
        });

        const positionSelect = utils.dom.createElement('select', {
            className: 'select-input small',
            value: config.position,
            onchange: (e) => {
                config.position = e.target.value;

                const configIndex = parseInt(controls.dataset.configIndex);
                if (!isNaN(configIndex) && this.textConfigs[configIndex]) {
                    this.textConfigs[configIndex].position = e.target.value;
                }

                const ctx = canvas.getContext('2d');
                const { img } = this.state.images[config.imageIndex];

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                this.renderTextOnCanvas(ctx, canvas, config);
            }
        });

        ['top', 'upper-middle', 'middle', 'lower-middle', 'bottom'].forEach(value => {
            const option = utils.dom.createElement('option', {
                value: value
            }, [value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ')]);
            positionSelect.appendChild(option);
        });

        positionSelect.value = config.position;
        controls.appendChild(positionSelect);

        const downloadBtn = utils.dom.createElement('button', {
            className: 'download-button',
            innerHTML: `
                <svg viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-width="2" fill="none" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Download
            `,
            onclick: async (e) => {
                const configIndex = parseInt(controls.dataset.configIndex);
                const currentConfig = !isNaN(configIndex) && this.textConfigs[configIndex]
                    ? this.textConfigs[configIndex]
                    : config;
                await this.downloadSingleImage(currentConfig, e.target);
            }
        });

        controls.appendChild(downloadBtn);

        return controls;
    }

    applyPositionToAll() {
        const globalSelect = document.getElementById('globalPosition');
        if (!globalSelect) return;

        const position = globalSelect.value;

        this.textConfigs.forEach(config => {
            config.position = position;
        });

        const containers = this.DOM.canvasContainer.querySelectorAll('.image-container');
        containers.forEach((container, index) => {
            const select = container.querySelector('select');
            if (select && this.textConfigs[index]) {
                select.value = position;
                select.dispatchEvent(new Event('change'));
            }
        });

        const btn = document.getElementById('applyAllPosition');
        if (btn) {
            const originalText = btn.textContent;
            btn.textContent = 'Applied!';
            btn.style.background = 'var(--color-success)';

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 1500);
        }
    }

    addDownloadAllButton() {
        if (this.textConfigs.length === 0) return;

        const container = utils.dom.createElement('div', {
            className: 'download-all-container'
        });

        const button = utils.dom.createElement('button', {
            className: 'download-all-button',
            innerHTML: `
                <svg viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-width="2" fill="none" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Download All as ZIP
            `,
            onclick: async () => {
                await this.downloadAllAsZip(button);
            }
        });

        container.appendChild(button);
        this.DOM.canvasContainer.appendChild(container);
    }

    // ===== OPTIMIZED DOWNLOAD ALL AS ZIP =====
    async downloadAllAsZip(button) {
        button.disabled = true;
        button.classList.add('loading');
        button.innerHTML = `
            <svg class="spinning" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-width="2" fill="none" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
            </svg>
            Preparing...
        `;

        try {
            const format = await this.showFormatDialog();
            const zip = new JSZip();

            // === BƯỚC 1: Tạo tất cả canvas và blob SONG SONG ===
            const quality = format === 'png' ? undefined : 0.8;
            const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';

            let completed = 0;
            const total = this.textConfigs.length;

            const updateCanvasProgress = () => {
                completed++;
                const progress = Math.round((completed / total) * 70);
                button.innerHTML = `
                    <svg class="spinning" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-width="2" fill="none" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                    </svg>
                    Processing images... ${progress}%
                `;
            };

            // Tạo promises cho tất cả canvas và blob
            const blobPromises = this.textConfigs.map(async (config, i) => {
                try {
                    const canvas = await this.generateFullCanvas(config);

                    const blob = await new Promise((resolve, reject) => {
                        try {
                            canvas.toBlob((result) => {
                                if (result) {
                                    resolve(result);
                                } else {
                                    reject(new Error('Failed to create blob'));
                                }
                            }, mimeType, quality);
                        } catch (err) {
                            reject(err);
                        }
                    });

                    updateCanvasProgress();
                    return { blob, index: i, success: true };
                } catch (error) {
                    console.error(`Failed to process image ${i + 1}:`, error);
                    updateCanvasProgress();
                    return { blob: null, index: i, success: false, error };
                }
            });

            // Chờ tất cả hoàn thành (không fail-fast)
            const results = await Promise.allSettled(blobPromises);

            // Lọc kết quả thành công
            const successfulResults = results
                .filter(r => r.status === 'fulfilled' && r.value.success)
                .map(r => r.value);

            if (successfulResults.length === 0) {
                throw new Error('Failed to process any images');
            }

            // Thông báo nếu có ảnh bị lỗi
            if (successfulResults.length < total) {
                const failedCount = total - successfulResults.length;
                this.showWarningNotification(`${failedCount} image(s) failed to process`);
            }

            // Thêm tất cả blob vào ZIP
            successfulResults.forEach(({ blob, index }) => {
                zip.file(`image_${index + 1}.${format}`, blob);
            });

            // === BƯỚC 2: Nén ZIP với compression thấp và progress ===
            button.innerHTML = `
                <svg class="spinning" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-width="2" fill="none" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                </svg>
                Compressing ZIP... 70%
            `;

            const content = await zip.generateAsync(
                {
                    type: 'blob',
                    compression: 'DEFLATE',
                    compressionOptions: {
                        level: 1  // Nén thấp để nhanh hơn
                    },
                    streamFiles: true  // Tối ưu memory
                },
                (metadata) => {
                    // Progress callback cho nén ZIP (70% -> 100%)
                    const zipProgress = Math.round(70 + (metadata.percent * 0.3));
                    button.innerHTML = `
                        <svg class="spinning" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-width="2" fill="none" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                        </svg>
                        Compressing ZIP... ${zipProgress}%
                    `;
                }
            );

            // === BƯỚC 3: Download file ===
            const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `images_${timestamp}.zip`;
            link.click();

            // Cleanup sau 100ms
            setTimeout(() => URL.revokeObjectURL(link.href), 100);

            // Thông báo thành công
            this.showSuccessNotification(
                `Downloaded ${successfulResults.length} image${successfulResults.length > 1 ? 's' : ''} successfully!`
            );

        } catch (error) {
            console.error('Error creating zip:', error);
            this.showErrorNotification('Failed to create ZIP file. Please try again.');
        } finally {
            button.disabled = false;
            button.classList.remove('loading');
            button.innerHTML = `
                <svg viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-width="2" fill="none" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Download All as ZIP
            `;
        }
    }

    // ===== NOTIFICATION HELPERS =====
    showSuccessNotification(message) {
        this.showNotification(message, '#10b981', 3000);
    }

    showErrorNotification(message) {
        this.showNotification(message, '#ef4444', 4000);
    }

    showWarningNotification(message) {
        this.showNotification(message, '#f59e0b', 3500);
    }

    showNotification(message, backgroundColor, duration) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${backgroundColor};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            font-weight: 500;
            font-size: 14px;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
}