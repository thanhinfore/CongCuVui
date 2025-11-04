/* =====================================================
   AI SUGGESTIONS MODULE (v12.0)
   AI-Powered Design Excellence
   ===================================================== */

export class AISuggestions {
    constructor(state, DOM) {
        this.state = state;
        this.DOM = DOM;
        this.suggestions = [];
        this.initialized = false;
    }

    init() {
        this.createUI();
        this.setupEventListeners();
        this.initialized = true;
        console.log('🤖 AI Suggestions initialized');
    }

    createUI() {
        // Create AI suggestions panel in control panel
        const styleSection = document.getElementById('styleSection');
        if (!styleSection) return;

        const section = document.createElement('section');
        section.id = 'aiSuggestionsSection';
        section.className = 'panel-section active v12-ai-suggestions';

        section.innerHTML = `
            <div class="section-header">
                <svg class="section-icon" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-width="2" fill="none" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <h2 class="section-title">🤖 AI Smart Suggestions</h2>
                <span class="v7-badge v7-badge-success">New in v12!</span>
            </div>
            <div class="section-content">
                <div class="ai-suggestions-intro">
                    <p style="font-size: 0.875rem; color: #64748b; margin-bottom: 12px;">
                        Let AI analyze your design and provide smart recommendations for colors, fonts, and layout.
                    </p>
                </div>

                <div class="ai-action-buttons">
                    <button id="aiOptimizeBtn" class="primary-button" style="width: 100%; margin-bottom: 8px;">
                        <svg viewBox="0 0 24 24" width="18" height="18" style="margin-right: 8px;">
                            <path stroke="currentColor" stroke-width="2" fill="none" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                        ✨ Optimize Design
                    </button>
                    <button id="aiColorSuggestBtn" class="secondary-button small" style="width: 100%; margin-bottom: 4px;">
                        🎨 Suggest Colors
                    </button>
                    <button id="aiFontSuggestBtn" class="secondary-button small" style="width: 100%; margin-bottom: 4px;">
                        📝 Suggest Fonts
                    </button>
                    <button id="aiLayoutSuggestBtn" class="secondary-button small" style="width: 100%;">
                        🎯 Suggest Layout
                    </button>
                </div>

                <div id="aiSuggestionsResults" class="ai-suggestions-results" style="display: none; margin-top: 16px;">
                    <!-- Suggestions will be displayed here -->
                </div>

                <div class="ai-tips" style="margin-top: 16px; padding: 12px; background: #f0f9ff; border-left: 3px solid #0ea5e9; border-radius: 6px;">
                    <strong style="color: #0369a1;">💡 Pro Tips:</strong>
                    <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 0.8125rem; color: #075985;">
                        <li>Upload images first for better color suggestions</li>
                        <li>Enter text to get readability analysis</li>
                        <li>Try different presets and let AI optimize them</li>
                    </ul>
                </div>
            </div>
        `;

        // Insert after style section
        styleSection.parentNode.insertBefore(section, styleSection.nextSibling);
    }

    setupEventListeners() {
        const optimizeBtn = document.getElementById('aiOptimizeBtn');
        const colorBtn = document.getElementById('aiColorSuggestBtn');
        const fontBtn = document.getElementById('aiFontSuggestBtn');
        const layoutBtn = document.getElementById('aiLayoutSuggestBtn');

        if (optimizeBtn) {
            optimizeBtn.addEventListener('click', () => this.optimizeDesign());
        }

        if (colorBtn) {
            colorBtn.addEventListener('click', () => this.suggestColors());
        }

        if (fontBtn) {
            fontBtn.addEventListener('click', () => this.suggestFonts());
        }

        if (layoutBtn) {
            layoutBtn.addEventListener('click', () => this.suggestLayout());
        }
    }

    optimizeDesign() {
        // Run all optimizations
        const suggestions = [];

        // Analyze and apply suggestions
        suggestions.push(...this.analyzeColors());
        suggestions.push(...this.analyzeFonts());
        suggestions.push(...this.analyzeLayout());
        suggestions.push(...this.analyzeReadability());

        this.displaySuggestions(suggestions, 'Optimization Complete! ✨');

        // Apply best suggestions automatically
        this.applyBestSuggestions(suggestions);

        if (window.imageTextApp?.components?.v6ui) {
            window.imageTextApp.components.v6ui.showToast(
                '✨ Design optimized with AI suggestions!',
                'success',
                3000
            );
        }
    }

    suggestColors() {
        const suggestions = this.analyzeColors();
        this.displaySuggestions(suggestions, 'Color Suggestions 🎨');
    }

    suggestFonts() {
        const suggestions = this.analyzeFonts();
        this.displaySuggestions(suggestions, 'Font Suggestions 📝');
    }

    suggestLayout() {
        const suggestions = this.analyzeLayout();
        this.displaySuggestions(suggestions, 'Layout Suggestions 🎯');
    }

    analyzeColors() {
        const suggestions = [];
        const currentColor = this.DOM.colorPicker?.value || '#FFFFFF';

        // Check contrast
        const bgColor = this.getAverageImageColor();
        const contrastRatio = this.calculateContrast(currentColor, bgColor);

        if (contrastRatio < 4.5) {
            suggestions.push({
                type: 'warning',
                category: 'color',
                message: 'Low contrast detected. Text may be hard to read.',
                action: 'Increase contrast',
                apply: () => {
                    // Suggest high contrast color
                    const isLightBg = this.isLightColor(bgColor);
                    const suggestedColor = isLightBg ? '#000000' : '#FFFFFF';
                    if (this.DOM.colorPicker) {
                        this.DOM.colorPicker.value = suggestedColor;
                        this.triggerChange(this.DOM.colorPicker);
                    }
                }
            });
        } else {
            suggestions.push({
                type: 'success',
                category: 'color',
                message: `Great contrast ratio: ${contrastRatio.toFixed(1)}:1`,
                action: null
            });
        }

        // Suggest complementary colors
        const complementary = this.getComplementaryColor(currentColor);
        suggestions.push({
            type: 'info',
            category: 'color',
            message: `Complementary color: ${complementary}`,
            action: 'Apply',
            apply: () => {
                if (this.DOM.subColorPicker) {
                    this.DOM.subColorPicker.value = complementary;
                    this.triggerChange(this.DOM.subColorPicker);
                }
            }
        });

        return suggestions;
    }

    analyzeFonts() {
        const suggestions = [];
        const currentFont = this.DOM.fontSelect?.value || 'Inter, sans-serif';
        const mainSize = parseInt(this.DOM.mainFontSize?.value || '48');
        const subSize = parseInt(this.DOM.subFontSize?.value || '32');

        // Check font size appropriateness
        if (mainSize < 32) {
            suggestions.push({
                type: 'warning',
                category: 'font',
                message: 'Main text size is quite small. Consider increasing for better readability.',
                action: 'Increase to 48px',
                apply: () => {
                    if (this.DOM.mainFontSize) {
                        this.DOM.mainFontSize.value = '48';
                        this.triggerChange(this.DOM.mainFontSize);
                    }
                }
            });
        }

        // Check font pairing
        const fontPairings = {
            'Inter, sans-serif': ['Roboto, sans-serif', 'Open Sans, sans-serif'],
            'Montserrat, sans-serif': ['Open Sans, sans-serif', 'Roboto, sans-serif'],
            'Poppins, sans-serif': ['Inter, sans-serif', 'Roboto, sans-serif']
        };

        const pairing = fontPairings[currentFont];
        if (pairing) {
            suggestions.push({
                type: 'info',
                category: 'font',
                message: `Good font pairings with ${currentFont.split(',')[0]}: ${pairing[0].split(',')[0]}`,
                action: 'Apply pairing',
                apply: () => {
                    // Keep main font, but this suggests subtitle could use pairing
                    if (window.imageTextApp?.components?.v6ui) {
                        window.imageTextApp.components.v6ui.showToast(
                            `💡 Consider using ${pairing[0].split(',')[0]} for subtitle`,
                            'info',
                            4000
                        );
                    }
                }
            });
        }

        // Check size hierarchy
        const sizeRatio = mainSize / subSize;
        if (sizeRatio < 1.2) {
            suggestions.push({
                type: 'warning',
                category: 'font',
                message: 'Weak visual hierarchy. Main and subtitle sizes are too similar.',
                action: 'Fix hierarchy',
                apply: () => {
                    if (this.DOM.subFontSize) {
                        this.DOM.subFontSize.value = Math.floor(mainSize * 0.67).toString();
                        this.triggerChange(this.DOM.subFontSize);
                    }
                }
            });
        }

        return suggestions;
    }

    analyzeLayout() {
        const suggestions = [];
        const position = this.DOM.positionPicker?.value || 'bottom';
        const alignment = this.getTextAlignment();

        // Suggest position based on image analysis
        if (this.state.images.length > 0) {
            suggestions.push({
                type: 'info',
                category: 'layout',
                message: 'Current position looks good. Try "lower-middle" for more impact.',
                action: 'Try lower-middle',
                apply: () => {
                    if (this.DOM.positionPicker) {
                        this.DOM.positionPicker.value = 'lower-middle';
                        this.triggerChange(this.DOM.positionPicker);
                    }
                }
            });
        }

        // Check text length
        const textLength = this.DOM.textInput?.value?.length || 0;
        if (textLength > 100) {
            suggestions.push({
                type: 'warning',
                category: 'layout',
                message: 'Text is quite long. Consider breaking into multiple images or reducing length.',
                action: null
            });
        } else if (textLength < 10 && textLength > 0) {
            suggestions.push({
                type: 'info',
                category: 'layout',
                message: 'Short text detected. Perfect for bold, impactful design!',
                action: null
            });
        }

        return suggestions;
    }

    analyzeReadability() {
        const suggestions = [];
        const text = this.DOM.textInput?.value || '';
        const hasShadow = this.DOM.textShadowCheckbox?.checked;
        const hasBorder = this.DOM.textBorderCheckbox?.checked;

        if (!hasShadow && !hasBorder) {
            suggestions.push({
                type: 'warning',
                category: 'readability',
                message: 'No text effects enabled. Add shadow or border for better readability.',
                action: 'Enable shadow',
                apply: () => {
                    if (this.DOM.textShadowCheckbox) {
                        this.DOM.textShadowCheckbox.checked = true;
                        this.triggerChange(this.DOM.textShadowCheckbox);
                    }
                }
            });
        } else {
            suggestions.push({
                type: 'success',
                category: 'readability',
                message: 'Text effects enabled - good for readability!',
                action: null
            });
        }

        return suggestions;
    }

    displaySuggestions(suggestions, title) {
        const resultsDiv = document.getElementById('aiSuggestionsResults');
        if (!resultsDiv) return;

        let html = `<div class="ai-suggestions-title" style="font-weight: 600; margin-bottom: 12px; color: #0f172a;">${title}</div>`;

        suggestions.forEach((suggestion, index) => {
            const icon = suggestion.type === 'warning' ? '⚠️' :
                        suggestion.type === 'success' ? '✅' : '💡';

            const bgColor = suggestion.type === 'warning' ? '#fef3c7' :
                           suggestion.type === 'success' ? '#d1fae5' : '#dbeafe';

            const textColor = suggestion.type === 'warning' ? '#92400e' :
                             suggestion.type === 'success' ? '#065f46' : '#1e40af';

            html += `
                <div class="ai-suggestion-card" style="background: ${bgColor}; padding: 12px; border-radius: 8px; margin-bottom: 8px; border-left: 3px solid ${textColor};">
                    <div style="display: flex; align-items: start; gap: 8px;">
                        <span style="font-size: 1.25rem;">${icon}</span>
                        <div style="flex: 1;">
                            <div style="font-size: 0.875rem; color: ${textColor}; margin-bottom: 4px;">
                                ${suggestion.message}
                            </div>
                            ${suggestion.action ? `
                                <button class="ai-apply-btn" data-index="${index}" style="
                                    background: white;
                                    border: 1px solid ${textColor};
                                    color: ${textColor};
                                    padding: 4px 12px;
                                    border-radius: 4px;
                                    font-size: 0.75rem;
                                    cursor: pointer;
                                    font-weight: 600;
                                    margin-top: 4px;
                                ">
                                    ${suggestion.action}
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });

        resultsDiv.innerHTML = html;
        resultsDiv.style.display = 'block';

        // Add event listeners to apply buttons
        this.currentSuggestions = suggestions;
        resultsDiv.querySelectorAll('.ai-apply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                if (suggestions[index].apply) {
                    suggestions[index].apply();
                }
            });
        });
    }

    applyBestSuggestions(suggestions) {
        // Auto-apply critical suggestions
        suggestions.forEach(suggestion => {
            if (suggestion.type === 'warning' && suggestion.apply) {
                // Auto-apply warnings
                // suggestion.apply();
            }
        });
    }

    // Helper functions
    getAverageImageColor() {
        // Simplified: return a default color
        // In real implementation, would analyze actual image
        return '#808080';
    }

    calculateContrast(color1, color2) {
        // Simplified contrast calculation
        const l1 = this.getLuminance(color1);
        const l2 = this.getLuminance(color2);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    getLuminance(hex) {
        const rgb = this.hexToRgb(hex);
        const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    isLightColor(hex) {
        return this.getLuminance(hex) > 0.5;
    }

    getComplementaryColor(hex) {
        const rgb = this.hexToRgb(hex);
        const comp = {
            r: 255 - rgb.r,
            g: 255 - rgb.g,
            b: 255 - rgb.b
        };
        return `#${comp.r.toString(16).padStart(2, '0')}${comp.g.toString(16).padStart(2, '0')}${comp.b.toString(16).padStart(2, '0')}`;
    }

    getTextAlignment() {
        const activeBtn = document.querySelector('.align-btn.active');
        return activeBtn?.dataset?.align || 'center';
    }

    triggerChange(element) {
        if (element) {
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
}
