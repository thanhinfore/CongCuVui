/* =====================================================
   PREVIEWPANEL.JS - Preview Panel Module (v4 - Markdown Bold + Fixed ZIP)
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
            alpha: true
        });

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const previewScale = canvas.width / img.width;
        this.renderTextCommon(ctx, canvas, config, previewScale);

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

    /**
     * Parse markdown-style bold text: **text** becomes bold
     */
    parseMarkdown(text) {
        const segments = [];
        let currentText = '';
        let inBold = false;
        let i = 0;

        while (i < text.length) {
            if (text[i] === '*' && text[i + 1] === '*') {
                if (currentText) {
                    segments.push({ text: currentText, bold: inBold });
                    currentText = '';
                }
                inBold = !inBold;
                i += 2;
            } else {
                currentText += text[i];
                i++;
            }
        }

        if (currentText) {
            segments.push({ text: currentText, bold: inBold });
        }

        return segments.length > 0 ? segments : [{ text: text, bold: false }];
    }

    /**
     * Wrap text with markdown bold support
     */
    wrapStyledText(ctx, text, maxWidth, fontSize, fontFamily, baseWeight, fontStyle) {
        const userLines = text.split('\\n');
        const wrappedLines = [];

        userLines.forEach(userLine => {
            if (!userLine.trim()) {
                wrappedLines.push({ segments: [{ text: '', bold: false }] });
                return;
            }

            const segments = this.parseMarkdown(userLine);
            let currentLine = [];
            let currentWidth = 0;

            segments.forEach(segment => {
                const words = segment.text.split(' ');

                words.forEach((word, wordIndex) => {
                    const isLastWord = wordIndex === words.length - 1;
                    const wordText = isLastWord ? word : word + ' ';

                    const weight = segment.bold ? 'bold' : baseWeight;
                    ctx.font = `${fontStyle} ${weight} ${fontSize}px ${fontFamily}`;
                    const wordWidth = ctx.measureText(wordText).width;

                    if (currentWidth + wordWidth > maxWidth && currentLine.length > 0) {
                        wrappedLines.push({ segments: this.mergeAdjacentSegments(currentLine) });
                        currentLine = [{ text: wordText, bold: segment.bold }];
                        currentWidth = wordWidth;
                    } else {
                        if (currentLine.length > 0 &&
                            currentLine[currentLine.length - 1].bold === segment.bold) {
                            currentLine[currentLine.length - 1].text += wordText;
                        } else {
                            currentLine.push({ text: wordText, bold: segment.bold });
                        }
                        currentWidth += wordWidth;
                    }
                });
            });

            if (currentLine.length > 0) {
                wrappedLines.push({ segments: this.mergeAdjacentSegments(currentLine) });
            }
        });

        return wrappedLines;
    }

    mergeAdjacentSegments(segments) {
        if (segments.length <= 1) return segments;

        const merged = [];
        let current = { ...segments[0] };

        for (let i = 1; i < segments.length; i++) {
            if (segments[i].bold === current.bold) {
                current.text += segments[i].text;
            } else {
                merged.push(current);
                current = { ...segments[i] };
            }
        }
        merged.push(current);

        return merged;
    }

    renderStyledLine(ctx, line, x, y, fontSize, color, effects, fontFamily, baseWeight, fontStyle) {
        let totalWidth = 0;
        line.segments.forEach(segment => {
            const weight = segment.bold ? 'bold' : baseWeight;
            ctx.font = `${fontStyle} ${weight} ${fontSize}px ${fontFamily}`;
            totalWidth += ctx.measureText(segment.text).width;
        });

        let currentX = x - totalWidth / 2;

        if (effects.textShadow) {
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = effects.shadowBlur;
            ctx.shadowOffsetX = effects.shadowOffsetX;
            ctx.shadowOffsetY = effects.shadowOffsetY;
        }

        ctx.fillStyle = color;
        ctx.textAlign = 'left';

        line.segments.forEach(segment => {
            const weight = segment.bold ? 'bold' : baseWeight;
            ctx.font = `${fontStyle} ${weight} ${fontSize}px ${fontFamily}`;

            if (effects.textBorder) {
                ctx.strokeText(segment.text, currentX, y);
            }

            ctx.fillText(segment.text, currentX, y);

            currentX += ctx.measureText(segment.text).width;
        });

        if (effects.textUnderline) {
            const startX = x - totalWidth / 2;
            const underlineY = y + fontSize * 0.25;

            ctx.strokeStyle = color;
            ctx.lineWidth = Math.max(1, fontSize * 0.1);
            ctx.beginPath();
            ctx.moveTo(startX, underlineY);
            ctx.lineTo(startX + totalWidth, underlineY);
            ctx.stroke();
        }
    }

    renderTextCommon(ctx, canvas, config, scaleFactor) {
        const lines = config.text.split(':');
        const mainText = lines[0].trim();
        const subtitle = lines[1]?.trim() || '';

        const baseMainFontSize = this.getMainFontSize();
        const baseSubFontSize = this.getSubFontSize();

        const mainFontSize = Math.round(baseMainFontSize * scaleFactor);
        const subFontSize = Math.round(baseSubFontSize * scaleFactor);

        const effects = this.getFontEffects();

        const LINE_SPACING = 2.0;
        const MAIN_PADDING = 1.5;

        let y;
        switch (config.position) {
            case 'top':
                y = mainFontSize * MAIN_PADDING;
                break;
            case 'upper-middle':
                y = canvas.height * 0.25 - mainFontSize;
                break;
            case 'middle':
                y = canvas.height * 0.5 - mainFontSize;
                break;
            case 'lower-middle':
                y = canvas.height * 0.75 - mainFontSize;
                break;
            case 'bottom':
            default:
                y = canvas.height - mainFontSize * (LINE_SPACING + 2);
                break;
        }

        ctx.textBaseline = 'middle';

        const selectedFont = this.DOM.fontSelect?.value || 'Inter, sans-serif';
        const canvasFont = selectedFont.replace(/['"]/g, '');

        const renderEffects = {
            textShadow: effects.textShadow,
            shadowBlur: Math.max(1, effects.shadowBlur * scaleFactor * 2),
            shadowOffsetX: Math.max(1, 3 * scaleFactor),
            shadowOffsetY: Math.max(1, 3 * scaleFactor),
            textBorder: effects.textBorder,
            borderWidth: Math.max(1, effects.borderWidth * scaleFactor * 2),
            textUnderline: effects.textUnderline
        };

        if (renderEffects.textBorder) {
            ctx.lineWidth = renderEffects.borderWidth;
            ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        }

        if (mainText) {
            const mainColor = this.DOM.colorPicker?.value || '#FFFFFF';
            const mainLines = this.wrapStyledText(
                ctx,
                mainText,
                canvas.width * 0.9,
                mainFontSize,
                canvasFont,
                effects.fontWeight,
                effects.fontStyle
            );

            mainLines.forEach((line, index) => {
                const lineY = y + (index * mainFontSize * LINE_SPACING);
                this.renderStyledLine(
                    ctx,
                    line,
                    canvas.width / 2,
                    lineY,
                    mainFontSize,
                    mainColor,
                    renderEffects,
                    canvasFont,
                    effects.fontWeight,
                    effects.fontStyle
                );
            });

            y += mainLines.length * mainFontSize * LINE_SPACING + mainFontSize * 0.5;
        }

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        if (subtitle) {
            const subColor = this.DOM.subColorPicker?.value || '#FFFFFF';
            const subLines = this.wrapStyledText(
                ctx,
                subtitle,
                canvas.width * 0.85,
                subFontSize,
                canvasFont,
                effects.fontWeight,
                effects.fontStyle
            );

            if (this.DOM.subtitleBgCheckbox?.checked) {
                const padding = Math.max(4, subFontSize * 0.5);

                let maxWidth = 0;
                subLines.forEach(line => {
                    let lineWidth = 0;
                    line.segments.forEach(segment => {
                        const weight = segment.bold ? 'bold' : effects.fontWeight;
                        ctx.font = `${effects.fontStyle} ${weight} ${subFontSize}px ${canvasFont}`;
                        lineWidth += ctx.measureText(segment.text).width;
                    });
                    maxWidth = Math.max(maxWidth, lineWidth);
                });

                const bgColor = utils.hexToRGBA(
                    this.DOM.bgColorPicker?.value || '#000000',
                    this.DOM.bgOpacity?.value || '28'
                );

                const bgHeight = subLines.length * subFontSize * 1.5 + padding * 2;
                const borderRadius = Math.max(2, subFontSize * 0.25);

                utils.canvas.drawRoundedRect(
                    ctx,
                    (canvas.width - maxWidth) / 2 - padding,
                    y - subFontSize * 0.5 - padding,
                    maxWidth + padding * 2,
                    bgHeight,
                    borderRadius,
                    bgColor
                );
            }

            subLines.forEach((line, index) => {
                const lineY = y + (index * subFontSize * 1.5);
                this.renderStyledLine(
                    ctx,
                    line,
                    canvas.width / 2,
                    lineY,
                    subFontSize,
                    subColor,
                    renderEffects,
                    canvasFont,
                    effects.fontWeight,
                    effects.fontStyle
                );
            });
        }

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }

    async downloadSingleImage(config, button) {
        button.disabled = true;
        button.innerHTML = 'Processing...';

        try {
            const canvas = await this.generateFullCanvas(config);
            const format = await this.getFormatPreference();

            const blob = await new Promise(resolve => {
                const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
                const quality = format === 'png' ? undefined : 0.85;
                canvas.toBlob(resolve, mimeType, quality);
            });

            // Create download link with proper DOM manipulation
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `image_${config.textIndex + 1}.${format}`;
            link.style.display = 'none';

            // Append to body, click, then remove
            document.body.appendChild(link);
            link.click();

            // Delay cleanup
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            }, 100);

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

        const maxWidth = 1080;
        const scaleFactor = img.width > maxWidth ? maxWidth / img.width : 1;

        const canvas = utils.canvas.createOffscreenCanvas(
            Math.min(img.width, maxWidth),
            Math.round(img.height * scaleFactor)
        );

        const ctx = canvas.getContext('2d', {
            willReadFrequently: false,
            alpha: true
        });

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const textScaleFactor = canvas.width / img.width;

        this.renderTextCommon(ctx, canvas, config, textScaleFactor);
        this.renderCredit(ctx, canvas, textScaleFactor);

        return canvas;
    }

    renderCredit(ctx, canvas, scaleFactor) {
        const credit = this.DOM.creditInput?.value?.trim() || '';
        if (!credit) return;

        const baseCreditSize = 28;
        const creditFontSize = Math.round(baseCreditSize * scaleFactor);

        const selectedFont = this.DOM.fontSelect?.value || 'Inter, sans-serif';
        const canvasFont = selectedFont.replace(/['"]/g, '');

        ctx.font = `bold ${creditFontSize}px ${canvasFont}`;
        ctx.fillStyle = this.DOM.subColorPicker?.value || '#FFFFFF';
        ctx.textAlign = 'right';
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = Math.max(1, creditFontSize * 0.12);

        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = Math.max(2, creditFontSize * 0.3);
        ctx.shadowOffsetX = Math.max(1, 2 * scaleFactor);
        ctx.shadowOffsetY = Math.max(1, 2 * scaleFactor);

        const padding = Math.max(10, creditFontSize * 0.8);

        ctx.strokeText(credit, canvas.width - padding, canvas.height - padding);
        ctx.fillText(credit, canvas.width - padding, canvas.height - padding);

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
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
                const previewScale = canvas.width / img.width;

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                this.renderTextCommon(ctx, canvas, config, previewScale);
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

                this.textConfigs[index].position = position;
                const canvas = container.querySelector('.preview-canvas');
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    const { img } = this.state.images[this.textConfigs[index].imageIndex];
                    const previewScale = canvas.width / img.width;

                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    this.renderTextCommon(ctx, canvas, this.textConfigs[index], previewScale);
                }
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

    async downloadAllAsZip(button) {
        const originalHTML = button.innerHTML;
        button.disabled = true;
        button.classList.add('loading');
        button.innerHTML = `
            <svg class="spinning" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-width="2" fill="none" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
            </svg>
            Initializing...
        `;

        try {
            // Show format dialog first
            button.innerHTML = `
                <svg class="spinning" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-width="2" fill="none" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                </svg>
                Choose format...
            `;

            const format = await this.showFormatDialog();

            console.log(`Creating ZIP with ${this.textConfigs.length} images in ${format} format`);

            button.innerHTML = `
                <svg class="spinning" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-width="2" fill="none" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                </svg>
                Processing 0%
            `;

            const zip = new JSZip();

            // Process each image
            for (let i = 0; i < this.textConfigs.length; i++) {
                const config = this.textConfigs[i];

                console.log(`Processing image ${i + 1}/${this.textConfigs.length}`);

                // Generate canvas
                const canvas = await this.generateFullCanvas(config);

                // Convert to blob
                const blob = await new Promise(resolve => {
                    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
                    const quality = format === 'png' ? undefined : 0.85;
                    canvas.toBlob(resolve, mimeType, quality);
                });

                // Add to ZIP
                const filename = `image_${String(i + 1).padStart(3, '0')}.${format}`;
                zip.file(filename, blob);

                // Update progress
                const progress = Math.round(((i + 1) / this.textConfigs.length) * 100);
                button.innerHTML = `
                    <svg class="spinning" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-width="2" fill="none" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                    </svg>
                    Processing ${progress}%
                `;
            }

            // Generate ZIP file
            console.log('Generating ZIP file...');
            button.innerHTML = `
                <svg class="spinning" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-width="2" fill="none" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                </svg>
                Creating ZIP file...
            `;

            const zipBlob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });

            console.log('ZIP file generated, size:', zipBlob.size, 'bytes');

            // Create download link with proper DOM handling
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipBlob);
            link.download = `images_${timestamp}.zip`;
            link.style.display = 'none';

            // CRITICAL: Append to body before clicking
            document.body.appendChild(link);

            console.log('Triggering download...');
            button.innerHTML = `
                <svg viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-width="2" fill="none" d="M5 13l4 4L19 7"/>
                </svg>
                Downloading...
            `;

            // Click to download
            link.click();

            console.log('Download triggered successfully');

            // Cleanup after delay
            setTimeout(() => {
                console.log('Cleaning up...');
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            }, 1000);

            // Show success message
            button.innerHTML = `
                <svg viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-width="2" fill="none" d="M5 13l4 4L19 7"/>
                </svg>
                Download Complete!
            `;

            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.disabled = false;
                button.classList.remove('loading');
            }, 2000);

        } catch (error) {
            console.error('Error creating ZIP:', error);
            alert(`Failed to create ZIP file: ${error.message}`);
            button.innerHTML = originalHTML;
            button.disabled = false;
            button.classList.remove('loading');
        }
    }
}