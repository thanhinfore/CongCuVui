/* =====================================================
   PREVIEWPANEL.JS - Preview Panel Module (v9.0)
   Full Markdown Support + Emoji Support + Advanced Positioning
   ===================================================== */

import { utils } from './utils.js';
import { markdownParser } from './markdownParser.js';
import { getEmojiRenderer } from './emojiRenderer.js';

export class PreviewPanel {
    constructor(DOM, state) {
        this.DOM = DOM;
        this.state = state;
        this.textConfigs = [];
        this.lazyLoadObserver = null;
        this.canvasPool = [];
        this.emojiRenderer = getEmojiRenderer();
        this.textPositioning = null; // Will be set by app.js

        this.initialize();
    }

    setTextPositioning(textPositioning) {
        this.textPositioning = textPositioning;
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

        // V10.0: Knowledge Mode - each line = one image
        const knowledgeMode = document.getElementById('knowledgeModeCheckbox')?.checked || false;
        const repeatBackground = this.DOM.repeatBackgroundCheckbox?.checked || false;

        let totalImages;
        if (knowledgeMode) {
            // Knowledge Mode: one image per text line
            totalImages = textLines.length;
        } else {
            // Traditional mode
            totalImages = repeatBackground ? textLines.length : this.state.images.length;
        }

        this.textConfigs = [];

        this.showPreviewActions();

        const container = this.createPreviewContainer(totalImages);

        for (let i = 0; i < totalImages; i++) {
            let imageIndex, textIndex, text;

            if (knowledgeMode) {
                // Knowledge Mode: cycle through images, one text per image
                imageIndex = i % this.state.images.length;
                textIndex = i;
                text = textLines[i];
            } else {
                // Traditional mode
                imageIndex = i % this.state.images.length;
                textIndex = repeatBackground ? i : 0;
                text = textLines[textIndex] || textLines[0];
            }

            const config = {
                imageIndex,
                textIndex,
                text: text,
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

        // Apply filters using CSS filters on a temporary canvas
        const filterString = this.getFilterString();
        if (filterString && filterString.trim() !== '') {
            ctx.filter = filterString;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Reset filter for text rendering
        ctx.filter = 'none';

        const previewScale = canvas.width / img.width;
        this.renderTextCommon(ctx, canvas, config, previewScale);

        return canvas;
    }

    getFilterString() {
        // Get filter settings from advanced features component
        if (window.imageTextApp?.components?.advanced?.filters) {
            const filters = window.imageTextApp.components.advanced.filters;
            return `
                brightness(${filters.brightness}%)
                contrast(${filters.contrast}%)
                saturate(${filters.saturation}%)
                blur(${filters.blur}px)
                hue-rotate(${filters.hue}deg)
                grayscale(${filters.grayscale}%)
                sepia(${filters.sepia}%)
                invert(${filters.invert}%)
            `.trim();
        }
        return '';
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
            shadowBlur: this.DOM.textShadowCheckbox?.checked ? parseInt(this.DOM.shadowBlur?.value || '4') : 0,
            textGlow: this.DOM.textGlowCheckbox?.checked || false,
            glowColor: this.DOM.glowColor?.value || '#FFD700',
            glowIntensity: this.DOM.textGlowCheckbox?.checked ? parseInt(this.DOM.glowIntensity?.value || '20') : 0
        };
    }

    getAdvancedTextSettings() {
        const textAlign = document.querySelector('.align-btn.active')?.dataset.align || 'center';
        const textRotation = parseFloat(document.getElementById('textRotation')?.value || '0');
        const textOpacity = parseInt(document.getElementById('textOpacity')?.value || '100') / 100;
        const letterSpacing = parseFloat(document.getElementById('letterSpacing')?.value || '0');
        const lineHeight = parseFloat(document.getElementById('lineHeight')?.value || '2');
        const textTransform = document.getElementById('textTransform')?.value || 'none';

        return {
            textAlign,
            textRotation,
            textOpacity,
            letterSpacing,
            lineHeight,
            textTransform
        };
    }

    getColorSettings() {
        const colorMode = document.querySelector('input[name="colorMode"]:checked')?.value || 'solid';

        if (colorMode === 'gradient') {
            const color1 = document.getElementById('gradientColor1')?.value || '#FF6B6B';
            const color2 = document.getElementById('gradientColor2')?.value || '#4ECDC4';
            const angle = parseInt(document.getElementById('gradientAngle')?.value || '45');

            return {
                mode: 'gradient',
                color1,
                color2,
                angle
            };
        }

        return {
            mode: 'solid',
            mainColor: this.DOM.colorPicker?.value || '#FFFFFF',
            subColor: this.DOM.subColorPicker?.value || '#FFFFFF'
        };
    }

    applyTextTransform(text, transform) {
        switch (transform) {
            case 'uppercase':
                return text.toUpperCase();
            case 'lowercase':
                return text.toLowerCase();
            case 'capitalize':
                return text.split(' ').map(word =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ');
            default:
                return text;
        }
    }

    /**
     * Parse markdown with full support using markdownParser
     * This method now supports: bold, italic, code, strikethrough, highlight, links
     */
    parseMarkdown(text) {
        const parsed = markdownParser.parseLine(text);

        // Convert markdown segments to canvas-compatible segments
        return parsed.segments.map(segment => {
            const canvasSegment = {
                text: segment.text,
                bold: segment.styles.bold || false,
                italic: segment.styles.italic || false,
                code: segment.styles.code || false,
                strikethrough: segment.styles.strikethrough || false,
                highlight: segment.styles.highlight || false,
                link: segment.styles.link || false,
                url: segment.url
            };
            return canvasSegment;
        });
    }

    /**
     * Wrap text with full markdown support
     */
    wrapStyledText(ctx, text, maxWidth, fontSize, fontFamily, baseWeight, fontStyle) {
        const userLines = text.split('\\n');
        const wrappedLines = [];

        userLines.forEach(userLine => {
            if (!userLine.trim()) {
                wrappedLines.push({ segments: [{ text: '', bold: false, italic: false }] });
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

                    // Calculate font with proper weight and style
                    const weight = segment.bold ? 'bold' : baseWeight;
                    const style = segment.italic ? 'italic' : fontStyle;
                    ctx.font = `${style} ${weight} ${fontSize}px ${fontFamily}`;
                    const wordWidth = ctx.measureText(wordText).width;

                    if (currentWidth + wordWidth > maxWidth && currentLine.length > 0) {
                        wrappedLines.push({ segments: this.mergeAdjacentSegments(currentLine) });
                        currentLine = [{
                            text: wordText,
                            bold: segment.bold,
                            italic: segment.italic,
                            code: segment.code,
                            strikethrough: segment.strikethrough,
                            highlight: segment.highlight,
                            link: segment.link,
                            url: segment.url
                        }];
                        currentWidth = wordWidth;
                    } else {
                        if (currentLine.length > 0 && this.segmentsEqual(currentLine[currentLine.length - 1], segment)) {
                            currentLine[currentLine.length - 1].text += wordText;
                        } else {
                            currentLine.push({
                                text: wordText,
                                bold: segment.bold,
                                italic: segment.italic,
                                code: segment.code,
                                strikethrough: segment.strikethrough,
                                highlight: segment.highlight,
                                link: segment.link,
                                url: segment.url
                            });
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

    /**
     * Check if two segments have the same styles
     */
    segmentsEqual(seg1, seg2) {
        return seg1.bold === seg2.bold &&
               seg1.italic === seg2.italic &&
               seg1.code === seg2.code &&
               seg1.strikethrough === seg2.strikethrough &&
               seg1.highlight === seg2.highlight &&
               seg1.link === seg2.link;
    }

    mergeAdjacentSegments(segments) {
        if (segments.length <= 1) return segments;

        const merged = [];
        let current = { ...segments[0] };

        for (let i = 1; i < segments.length; i++) {
            if (this.segmentsEqual(segments[i], current)) {
                current.text += segments[i].text;
            } else {
                merged.push(current);
                current = { ...segments[i] };
            }
        }
        merged.push(current);

        return merged;
    }

    renderStyledLine(ctx, line, x, y, fontSize, color, effects, fontFamily, baseWeight, fontStyle, advanced = {}, canvas = null) {
        const letterSpacing = (advanced.letterSpacing || 0) * (fontSize / 48);

        // Calculate total width including letter spacing
        let totalWidth = 0;
        line.segments.forEach(segment => {
            const weight = segment.bold ? 'bold' : baseWeight;
            const style = segment.italic ? 'italic' : fontStyle;

            // Use EmojiRenderer to build font string with emoji fallbacks
            ctx.font = this.emojiRenderer.buildFontString(style, weight, fontSize, fontFamily);

            // Add letter spacing to width calculation
            const chars = segment.text.split('');
            chars.forEach((char, i) => {
                totalWidth += ctx.measureText(char).width;
                if (i < chars.length - 1) {
                    totalWidth += letterSpacing;
                }
            });
        });

        // Calculate starting X based on alignment
        let currentX;
        const textAlign = advanced.textAlign || 'center';
        if (textAlign === 'left') {
            currentX = x - (canvas?.width || 0) * 0.45;
        } else if (textAlign === 'right') {
            currentX = x + (canvas?.width || 0) * 0.45 - totalWidth;
        } else {
            currentX = x - totalWidth / 2;
        }

        const startX = currentX;

        // Apply opacity
        const opacity = advanced.textOpacity !== undefined ? advanced.textOpacity : 1;
        ctx.globalAlpha = opacity;

        // Apply glow effect
        if (effects.textGlow) {
            ctx.shadowColor = effects.glowColor;
            ctx.shadowBlur = effects.glowIntensity;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        } else if (effects.textShadow) {
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = effects.shadowBlur;
            ctx.shadowOffsetX = effects.shadowOffsetX;
            ctx.shadowOffsetY = effects.shadowOffsetY;
        }

        ctx.textAlign = 'left';

        line.segments.forEach(segment => {
            const weight = segment.bold ? 'bold' : baseWeight;
            const style = segment.italic ? 'italic' : fontStyle;

            // Use EmojiRenderer to build font string with emoji fallbacks
            ctx.font = this.emojiRenderer.buildFontString(style, weight, fontSize, fontFamily);

            // Draw highlight background if needed
            if (segment.highlight) {
                const segmentWidth = ctx.measureText(segment.text).width;
                ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
                ctx.fillRect(currentX - 2, y - fontSize * 0.7, segmentWidth + 4, fontSize * 1.1);
            }

            // Draw code background if needed
            if (segment.code) {
                const segmentWidth = ctx.measureText(segment.text).width;
                ctx.fillStyle = 'rgba(128, 128, 128, 0.2)';
                const codeRadius = fontSize * 0.15;
                utils.canvas.drawRoundedRect(
                    ctx,
                    currentX - 2,
                    y - fontSize * 0.7,
                    segmentWidth + 4,
                    fontSize * 1.1,
                    codeRadius,
                    'rgba(128, 128, 128, 0.2)'
                );
            }

            // Render each character with letter spacing
            const chars = segment.text.split('');
            const segmentStartX = currentX;

            chars.forEach((char, i) => {
                // Set color (gradient or solid)
                if (color.mode === 'gradient' && canvas) {
                    const gradient = this.createGradient(ctx, canvas, color);
                    ctx.fillStyle = gradient;
                    if (effects.textBorder) {
                        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
                    }
                } else {
                    // Use different color for code
                    if (segment.code) {
                        ctx.fillStyle = '#e74c3c';
                    } else if (segment.link) {
                        ctx.fillStyle = '#3498db';
                    } else {
                        ctx.fillStyle = color.mainColor || color;
                    }
                    if (effects.textBorder) {
                        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
                    }
                }

                if (effects.textBorder) {
                    ctx.strokeText(char, currentX, y);
                }

                ctx.fillText(char, currentX, y);

                currentX += ctx.measureText(char).width;
                if (i < chars.length - 1) {
                    currentX += letterSpacing;
                }
            });

            // Draw strikethrough if needed
            if (segment.strikethrough) {
                const segmentWidth = currentX - segmentStartX;
                ctx.strokeStyle = color.mainColor || color;
                ctx.lineWidth = Math.max(1, fontSize * 0.06);
                ctx.beginPath();
                ctx.moveTo(segmentStartX, y - fontSize * 0.2);
                ctx.lineTo(segmentStartX + segmentWidth, y - fontSize * 0.2);
                ctx.stroke();
            }

            // Draw underline for links
            if (segment.link) {
                const segmentWidth = currentX - segmentStartX;
                ctx.strokeStyle = '#3498db';
                ctx.lineWidth = Math.max(1, fontSize * 0.05);
                ctx.beginPath();
                ctx.moveTo(segmentStartX, y + fontSize * 0.25);
                ctx.lineTo(segmentStartX + segmentWidth, y + fontSize * 0.25);
                ctx.stroke();
            }
        });

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Draw underline
        if (effects.textUnderline) {
            const underlineY = y + fontSize * 0.25;

            // Use gradient for underline if gradient mode is active
            if (color.mode === 'gradient' && canvas) {
                ctx.strokeStyle = this.createGradient(ctx, canvas, color);
            } else {
                ctx.strokeStyle = color.mainColor || color;
            }

            ctx.lineWidth = Math.max(1, fontSize * 0.1);
            ctx.beginPath();
            ctx.moveTo(startX, underlineY);
            ctx.lineTo(startX + totalWidth, underlineY);
            ctx.stroke();
        }

        // Reset alpha
        ctx.globalAlpha = 1;
    }

    createGradient(ctx, canvas, colorSettings) {
        const angle = (colorSettings.angle || 45) * Math.PI / 180;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const length = Math.max(canvas.width, canvas.height);

        const x0 = centerX - Math.cos(angle) * length / 2;
        const y0 = centerY - Math.sin(angle) * length / 2;
        const x1 = centerX + Math.cos(angle) * length / 2;
        const y1 = centerY + Math.sin(angle) * length / 2;

        const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
        gradient.addColorStop(0, colorSettings.color1);
        gradient.addColorStop(1, colorSettings.color2);

        return gradient;
    }

    renderTextCommon(ctx, canvas, config, scaleFactor) {
        const lines = config.text.split(':');
        let mainText = lines[0].trim();
        let subtitle = lines[1]?.trim() || '';

        const baseMainFontSize = this.getMainFontSize();
        const baseSubFontSize = this.getSubFontSize();

        const mainFontSize = Math.round(baseMainFontSize * scaleFactor);
        const subFontSize = Math.round(baseSubFontSize * scaleFactor);

        const effects = this.getFontEffects();
        const advanced = this.getAdvancedTextSettings();
        const colorSettings = this.getColorSettings();

        // Apply text transform
        if (advanced.textTransform && advanced.textTransform !== 'none') {
            mainText = this.applyTextTransform(mainText, advanced.textTransform);
            subtitle = this.applyTextTransform(subtitle, advanced.textTransform);
        }

        const LINE_SPACING = advanced.lineHeight || 2.0;
        const MAIN_PADDING = 1.5;

        // V9.0: Check if free positioning mode is enabled
        let y;
        let mainCustomPos = null;
        let subCustomPos = null;

        if (this.textPositioning && this.textPositioning.positioning.freeMode) {
            // Use custom positioning from v9.0
            mainCustomPos = this.textPositioning.calculatePosition(canvas.width, canvas.height, 'main');
            subCustomPos = this.textPositioning.calculatePosition(canvas.width, canvas.height, 'subtitle');

            if (mainCustomPos) {
                y = mainCustomPos.y;
            } else {
                // Fallback to default
                y = canvas.height - mainFontSize * (LINE_SPACING + 2);
            }
        } else {
            // Use traditional position picker
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
        }

        ctx.textBaseline = 'middle';

        const selectedFont = this.DOM.fontSelect?.value || 'Inter, sans-serif';
        // Use EmojiRenderer for proper emoji font support
        const canvasFont = this.emojiRenderer.buildFontString('normal', '400', 16, selectedFont).split('16px ')[1];

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

        // Save context state
        ctx.save();

        // Apply rotation if specified
        if (advanced.textRotation && advanced.textRotation !== 0) {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate((advanced.textRotation * Math.PI) / 180);
            ctx.translate(-centerX, -centerY);
        }

        if (mainText) {
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
                    colorSettings,
                    renderEffects,
                    canvasFont,
                    effects.fontWeight,
                    effects.fontStyle,
                    advanced,
                    canvas
                );
            });

            y += mainLines.length * mainFontSize * LINE_SPACING + mainFontSize * 0.5;
        }

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        if (subtitle) {
            // V9.0: Use custom subtitle position if available
            let subtitleY = y;
            if (subCustomPos) {
                subtitleY = subCustomPos.y;
            }

            const subLines = this.wrapStyledText(
                ctx,
                subtitle,
                canvas.width * 0.85,
                subFontSize,
                canvasFont,
                effects.fontWeight,
                effects.fontStyle
            );

            // Use subtitle color from solid mode or gradient
            const subtitleColor = colorSettings.mode === 'solid'
                ? { mode: 'solid', mainColor: this.DOM.subColorPicker?.value || '#FFFFFF' }
                : colorSettings;

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
                    subtitleY - subFontSize * 0.5 - padding,
                    maxWidth + padding * 2,
                    bgHeight,
                    borderRadius,
                    bgColor
                );
            }

            subLines.forEach((line, index) => {
                const lineY = subtitleY + (index * subFontSize * 1.5);
                this.renderStyledLine(
                    ctx,
                    line,
                    canvas.width / 2,
                    lineY,
                    subFontSize,
                    subtitleColor,
                    renderEffects,
                    canvasFont,
                    effects.fontWeight,
                    effects.fontStyle,
                    advanced,
                    canvas
                );
            });
        }

        // Restore context state (rotation)
        ctx.restore();

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

        // Apply filters for full-size export
        const filterString = this.getFilterString();
        if (filterString && filterString.trim() !== '') {
            ctx.filter = filterString;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Reset filter for text rendering
        ctx.filter = 'none';

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
        // Use EmojiRenderer for proper emoji font support
        ctx.font = this.emojiRenderer.buildFontString('normal', 'bold', creditFontSize, selectedFont);
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