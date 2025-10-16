/* =====================================================
   PREVIEWPANEL.JS - Preview Panel Module
   ===================================================== */

import { utils } from './utils.js';

export class PreviewPanel {
    constructor(DOM, state) {
        this.DOM = DOM;
        this.state = state;
        this.textConfigs = [];
        this.lazyLoadObserver = null;
        this.canvasPool = [];

        this.initialize();
    }

    initialize() {
        // Setup lazy loading observer
        this.setupLazyLoading();

        // Add render method to window
        window.renderImages = () => this.render();

        console.log('Preview panel initialized');
    }

    render() {
        const textLines = this.getTextLines();
        if (!textLines.length || !this.state.images.length) {
            this.showEmptyState();
            return;
        }

        // Clear previous content
        this.clearPreview();

        // Determine total images to generate
        const repeatBackground = this.DOM.repeatBackgroundCheckbox.checked;
        const totalImages = repeatBackground ? textLines.length : this.state.images.length;

        // Reset text configs
        this.textConfigs = [];

        // Show preview actions
        this.showPreviewActions();

        // Create preview container
        const container = this.createPreviewContainer(totalImages);

        // Generate preview items
        for (let i = 0; i < totalImages; i++) {
            const imageIndex = i % this.state.images.length;
            const textIndex = repeatBackground ? i : 0;

            const config = {
                imageIndex,
                textIndex,
                text: textLines[textIndex] || textLines[0],
                position: this.DOM.positionPicker.value,
                fileName: this.state.images[imageIndex].file.name
            };

            this.textConfigs.push(config);

            const previewItem = this.createPreviewItem(config, i + 1);
            container.appendChild(previewItem);
        }

        // Add download all button
        this.addDownloadAllButton();

        // Start observing for lazy loading
        this.observePreviewItems();
    }

    getTextLines() {
        const text = this.DOM.textInput.value.trim();
        return text ? text.split('\n').filter(line => line.trim()) : [];
    }

    clearPreview() {
        const container = this.DOM.canvasContainer;
        container.innerHTML = '';

        // Clear canvas pool
        this.canvasPool.forEach(canvas => {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
        this.canvasPool = [];

        // Disconnect observer
        if (this.lazyLoadObserver) {
            this.lazyLoadObserver.disconnect();
        }
    }

    showEmptyState() {
        const container = this.DOM.canvasContainer;
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

        // Hide preview actions
        const previewActions = document.getElementById('previewActions');
        if (previewActions) {
            previewActions.style.display = 'none';
        }
    }

    showPreviewActions() {
        const previewActions = document.getElementById('previewActions');
        if (previewActions) {
            previewActions.style.display = 'flex';

            // Update global position selector
            const globalPosition = document.getElementById('globalPosition');
            if (globalPosition) {
                globalPosition.value = this.DOM.positionPicker.value;
            }

            // Setup apply all button
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

        // Add image count info
        const info = utils.dom.createElement('div', {
            className: 'image-count-info'
        });

        info.innerHTML = `
            <div class="info-content">
                <svg width="20" height="20" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
                    <text x="12" y="16" text-anchor="middle" fill="currentColor" stroke="none" font-size="12" font-weight="bold">${totalImages}</text>
                </svg>
                <span><strong>${totalImages}</strong> image${totalImages > 1 ? 's' : ''} will be generated</span>
            </div>
        `;

        this.DOM.canvasContainer.appendChild(info);

        // Create grid container
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

        // Create placeholder content
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
        const configIndex = number - 1; // Index in textConfigs array

        // Clear placeholder
        container.innerHTML = '';

        // Add label
        const label = utils.dom.createElement('div', {
            className: 'image-label',
            textContent: `#${number}`
        });
        container.appendChild(label);

        // Create preview canvas with reference to the correct config
        const canvas = this.createPreviewCanvas(this.textConfigs[configIndex]);
        container.appendChild(canvas);

        // Create controls with reference to the correct config
        const controls = this.createImageControls(this.textConfigs[configIndex], canvas);
        controls.dataset.configIndex = configIndex; // Store index for reference
        container.appendChild(controls);
    }

    createPreviewCanvas(config) {
        const { img } = this.state.images[config.imageIndex];

        // Create small preview (max 200px width)
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

        // Draw image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Draw text
        this.renderTextOnCanvas(ctx, canvas, config);

        return canvas;
    }

    createImageControls(config, canvas) {
        const controls = utils.dom.createElement('div', {
            className: 'image-controls'
        });

        // Position selector
        const positionSelect = utils.dom.createElement('select', {
            className: 'select-input small',
            value: config.position,
            onchange: (e) => {
                config.position = e.target.value;

                // Update the main textConfigs array
                // Use the stored index if available
                const configIndex = parseInt(controls.dataset.configIndex);
                if (!isNaN(configIndex) && this.textConfigs[configIndex]) {
                    this.textConfigs[configIndex].position = e.target.value;
                }

                const ctx = canvas.getContext('2d');
                const { img } = this.state.images[config.imageIndex];

                // Redraw
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

        // Download button
        const downloadBtn = utils.dom.createElement('button', {
            className: 'download-button',
            innerHTML: `
                <svg viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-width="2" fill="none" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Download
            `,
            onclick: async (e) => {
                // Use the config from textConfigs array
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

    renderTextOnCanvas(ctx, canvas, config) {
        const lines = config.text.split(':');
        const mainText = lines[0].trim();
        const subtitle = lines[1]?.trim() || '';

        // Calculate font size based on canvas size
        const baseFontSize = Math.max(10, canvas.width * 0.06);

        // Get position
        let y;
        switch (config.position) {
            case 'top': y = baseFontSize * 2; break;
            case 'upper-middle': y = canvas.height * 0.25; break;
            case 'middle': y = canvas.height * 0.5; break;
            case 'lower-middle': y = canvas.height * 0.75; break;
            case 'bottom': y = canvas.height - baseFontSize * 2; break;
        }

        // Setup text style
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Get font family and remove quotes for canvas context
        const selectedFont = this.DOM.fontSelect.value || 'Inter, sans-serif';
        const canvasFont = selectedFont.replace(/['"]/g, '');

        // Draw main text
        if (mainText) {
            ctx.font = `bold ${baseFontSize * 1.5}px ${canvasFont}`;
            ctx.fillStyle = this.DOM.colorPicker.value;
            ctx.strokeStyle = 'rgba(0,0,0,0.8)';
            ctx.lineWidth = baseFontSize * 0.1;

            const mainLines = this.wrapText(ctx, mainText, canvas.width * 0.9);
            mainLines.forEach((line, index) => {
                const lineY = y + (index * baseFontSize * 1.8);
                ctx.strokeText(line, canvas.width / 2, lineY);
                ctx.fillText(line, canvas.width / 2, lineY);
            });

            y += mainLines.length * baseFontSize * 1.8;
        }

        // Draw subtitle
        if (subtitle) {
            ctx.font = `bold ${baseFontSize}px ${canvasFont}`;

            // Background if enabled
            if (this.DOM.subtitleBgCheckbox.checked) {
                const bgColor = utils.hexToRGBA(
                    this.DOM.bgColorPicker.value,
                    this.DOM.bgOpacity.value
                );

                const subLines = this.wrapText(ctx, subtitle, canvas.width * 0.85);
                const padding = baseFontSize * 0.4;
                let maxWidth = 0;

                subLines.forEach(line => {
                    maxWidth = Math.max(maxWidth, ctx.measureText(line).width);
                });

                utils.canvas.drawRoundedRect(
                    ctx,
                    (canvas.width - maxWidth) / 2 - padding,
                    y - padding,
                    maxWidth + padding * 2,
                    subLines.length * baseFontSize * 1.5 + padding * 2,
                    baseFontSize * 0.3,
                    bgColor
                );
            }

            // Draw subtitle text
            ctx.fillStyle = this.DOM.subColorPicker.value;
            const subLines = this.wrapText(ctx, subtitle, canvas.width * 0.85);
            subLines.forEach((line, index) => {
                const lineY = y + baseFontSize + (index * baseFontSize * 1.5);
                ctx.strokeText(line, canvas.width / 2, lineY);
                ctx.fillText(line, canvas.width / 2, lineY);
            });
        }
    }

    wrapText(ctx, text, maxWidth) {
        // Handle user line breaks
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
            // Generate full resolution canvas
            const canvas = await this.generateFullCanvas(config);

            // Get format preference
            const format = await this.getFormatPreference();

            // Convert to blob
            const blob = await new Promise(resolve => {
                const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
                const quality = format === 'png' ? undefined : 0.85;
                canvas.toBlob(resolve, mimeType, quality);
            });

            // Download
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `image_${config.textIndex + 1}.${format}`;
            link.click();

            URL.revokeObjectURL(link.href);

        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download image');
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

    async generateFullCanvas(config) {
        const { img } = this.state.images[config.imageIndex];

        // Limit to 1080px width
        const maxWidth = 1080;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;

        const canvas = utils.canvas.createOffscreenCanvas(
            Math.min(img.width, maxWidth),
            Math.round(img.height * scale)
        );

        const ctx = canvas.getContext('2d');

        // Draw image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Setup for full resolution text
        const fullConfig = {
            ...config,
            baseFontSize: Math.min(canvas.width, canvas.height) * 0.05
        };

        // Render text at full resolution
        this.renderFullText(ctx, canvas, fullConfig);

        return canvas;
    }

    renderFullText(ctx, canvas, config) {
        const lines = config.text.split(':');
        const mainText = lines[0].trim();
        const subtitle = lines[1]?.trim() || '';
        const baseFontSize = config.baseFontSize;

        // Calculate position
        let y;
        switch (config.position) {
            case 'top': y = baseFontSize * 2; break;
            case 'upper-middle': y = canvas.height * 0.25; break;
            case 'middle': y = canvas.height * 0.5 - baseFontSize; break;
            case 'lower-middle': y = canvas.height * 0.75; break;
            case 'bottom': y = canvas.height - baseFontSize * 3; break;
        }

        const selectedFont = this.DOM.fontSelect.value || 'Inter, sans-serif';
        const canvasFont = selectedFont.replace(/['"]/g, '');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Main text
        if (mainText) {
            ctx.font = `bold ${baseFontSize * 1.5}px ${canvasFont}`;
            ctx.fillStyle = this.DOM.colorPicker.value;
            ctx.strokeStyle = 'rgba(0,0,0,0.96)';
            ctx.lineWidth = baseFontSize * 0.2;

            const mainLines = this.wrapText(ctx, mainText, canvas.width * 0.9);
            mainLines.forEach((line, index) => {
                const lineY = y + (index * baseFontSize * 2);
                ctx.strokeText(line, canvas.width / 2, lineY);
                ctx.fillText(line, canvas.width / 2, lineY);
            });

            y += mainLines.length * baseFontSize * 2.5;
        }

        // Subtitle
        if (subtitle) {
            ctx.font = `bold ${baseFontSize}px ${canvasFont}`;

            const subLines = this.wrapText(ctx, subtitle, canvas.width * 0.85);

            // Background
            if (this.DOM.subtitleBgCheckbox.checked) {
                const padding = baseFontSize * 0.8;
                let maxWidth = 0;

                subLines.forEach(line => {
                    maxWidth = Math.max(maxWidth, ctx.measureText(line).width);
                });

                const bgColor = utils.hexToRGBA(
                    this.DOM.bgColorPicker.value,
                    this.DOM.bgOpacity.value
                );

                utils.canvas.drawRoundedRect(
                    ctx,
                    (canvas.width - maxWidth) / 2 - padding,
                    y - padding,
                    maxWidth + padding * 2,
                    subLines.length * baseFontSize * 1.5 + padding * 2,
                    baseFontSize * 0.3,
                    bgColor
                );
            }

            // Text
            ctx.fillStyle = this.DOM.subColorPicker.value;
            ctx.strokeStyle = 'rgba(0,0,0,0.96)';
            ctx.lineWidth = baseFontSize * 0.1;

            subLines.forEach((line, index) => {
                const lineY = y + baseFontSize + (index * baseFontSize * 1.5);
                ctx.strokeText(line, canvas.width / 2, lineY);
                ctx.fillText(line, canvas.width / 2, lineY);
            });
        }

        // Credit
        this.renderCredit(ctx, canvas);
    }

    renderCredit(ctx, canvas) {
        const credit = this.DOM.creditInput.value.trim();
        if (!credit) return;

        const creditFontSize = Math.min(canvas.width, canvas.height) * 0.04;
        const selectedFont = this.DOM.fontSelect.value || 'Inter, sans-serif';
        const canvasFont = selectedFont.replace(/['"]/g, '');

        ctx.font = `bold ${creditFontSize}px ${canvasFont}`;
        ctx.fillStyle = this.DOM.subColorPicker.value;
        ctx.textAlign = 'right';
        ctx.strokeStyle = 'rgba(0,0,0,0.96)';
        ctx.lineWidth = creditFontSize * 0.1;

        const padding = creditFontSize;
        ctx.strokeText(credit, canvas.width - padding, canvas.height - padding);
        ctx.fillText(credit, canvas.width - padding, canvas.height - padding);
    }

    async getFormatPreference() {
        // Check if user wants to choose format
        const lastFormat = localStorage.getItem('preferredImageFormat') || 'jpeg';

        if (!window.event || !window.event.shiftKey) {
            return lastFormat;
        }

        // Show format dialog
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

            // Add event listeners
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

    applyPositionToAll() {
        const globalSelect = document.getElementById('globalPosition');
        if (!globalSelect) return;

        const position = globalSelect.value;

        // Update all configs
        this.textConfigs.forEach(config => {
            config.position = position;
        });

        // Update all position selects and trigger change event
        const containers = this.DOM.canvasContainer.querySelectorAll('.image-container');
        containers.forEach((container, index) => {
            const select = container.querySelector('select');
            if (select && this.textConfigs[index]) {
                select.value = position;
                // Trigger change event to update canvas
                select.dispatchEvent(new Event('change'));
            }
        });

        // Show feedback
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

    async downloadAllAsZip(button) {
        button.disabled = true;
        button.classList.add('loading');
        button.innerHTML = `
            <svg class="spinning" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-width="2" fill="none" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
            </svg>
            Processing...
        `;

        try {
            const format = await this.showFormatDialog();
            const zip = new JSZip();

            // Process all images
            for (let i = 0; i < this.textConfigs.length; i++) {
                const config = this.textConfigs[i];
                const canvas = await this.generateFullCanvas(config);

                const blob = await new Promise(resolve => {
                    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
                    const quality = format === 'png' ? undefined : 0.85;
                    canvas.toBlob(resolve, mimeType, quality);
                });

                zip.file(`image_${i + 1}.${format}`, blob);

                // Update progress
                const progress = ((i + 1) / this.textConfigs.length) * 100;
                button.innerHTML = `Processing... ${Math.round(progress)}%`;
            }

            // Generate zip
            const content = await zip.generateAsync({ type: 'blob' });

            // Download
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'images.zip';
            link.click();

            URL.revokeObjectURL(link.href);

        } catch (error) {
            console.error('Error creating zip:', error);
            alert('Failed to create zip file');
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
}