/* =====================================================
   EMOJI-RENDERER.JS - Version 8.0 Emoji Support
   Proper emoji rendering on canvas
   ===================================================== */

export class EmojiRenderer {
    constructor() {
        this.emojiFont = null;
        // Reordered for better Windows/cross-platform support
        this.fallbackFonts = [
            'Segoe UI Emoji',      // Windows 10/11 - Best support
            'Segoe UI Symbol',     // Windows fallback
            'Apple Color Emoji',   // macOS/iOS
            'Noto Color Emoji',    // Android/Linux/Chrome
            'Twemoji Mozilla',     // Firefox
            'EmojiOne Color',      // Generic fallback
            'Android Emoji'        // Android fallback
        ];
        this.initialize();
    }

    async initialize() {
        await this.loadEmojiFonts();
        console.log('✨ V8 Emoji Renderer initialized');
    }

    async loadEmojiFonts() {
        // Try to load system emoji fonts
        try {
            // Check if browser supports emoji fonts
            if ('fonts' in document) {
                for (const fontFamily of this.fallbackFonts) {
                    try {
                        await document.fonts.load(`16px "${fontFamily}"`);
                        console.log(`Loaded emoji font: ${fontFamily}`);
                    } catch (e) {
                        // Font not available, continue
                    }
                }
            }
        } catch (error) {
            console.warn('Could not preload emoji fonts:', error);
        }
    }

    /**
     * Get the best emoji font stack for canvas
     */
    getEmojiFontStack() {
        return this.fallbackFonts.map(f => `"${f}"`).join(', ') + ', sans-serif';
    }

    /**
     * Build complete font string with emoji support
     * V10.1: Emoji fonts FIRST for proper emoji rendering
     */
    buildFontString(style, weight, size, baseFont) {
        // Remove quotes from base font
        const cleanFont = baseFont.replace(/['"]/g, '');

        // Build font stack: EMOJI FONTS FIRST, then base font
        // This ensures emoji render properly before falling back to base font
        const fontStack = [
            ...this.fallbackFonts.map(f => `"${f}"`),
            cleanFont
        ].join(', ');

        return `${style} ${weight} ${size}px ${fontStack}`;
    }

    /**
     * Detect if text contains emoji
     */
    containsEmoji(text) {
        // Emoji regex pattern
        const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{FE00}-\u{FE0F}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}\u{00A9}\u{00AE}\u{203C}\u{2049}\u{2122}\u{2139}\u{2194}-\u{2199}\u{21A9}-\u{21AA}\u{231A}-\u{231B}\u{2328}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{24C2}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2600}-\u{2604}\u{260E}\u{2611}\u{2614}-\u{2615}\u{2618}\u{261D}\u{2620}\u{2622}-\u{2623}\u{2626}\u{262A}\u{262E}-\u{262F}\u{2638}-\u{263A}\u{2640}\u{2642}\u{2648}-\u{2653}\u{2660}\u{2663}\u{2665}-\u{2666}\u{2668}\u{267B}\u{267E}-\u{267F}\u{2692}-\u{2697}\u{2699}\u{269B}-\u{269C}\u{26A0}-\u{26A1}\u{26AA}-\u{26AB}\u{26B0}-\u{26B1}\u{26BD}-\u{26BE}\u{26C4}-\u{26C5}\u{26C8}\u{26CE}-\u{26CF}\u{26D1}\u{26D3}-\u{26D4}\u{26E9}-\u{26EA}\u{26F0}-\u{26F5}\u{26F7}-\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}\u{2712}\u{2714}\u{2716}\u{271D}\u{2721}\u{2728}\u{2733}-\u{2734}\u{2744}\u{2747}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}-\u{2764}\u{2795}-\u{2797}\u{27A1}\u{27B0}\u{27BF}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]/gu;
        return emojiRegex.test(text);
    }

    /**
     * Split text into segments with and without emoji
     */
    splitTextWithEmoji(text) {
        const segments = [];
        const emojiRegex = /([\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{FE00}-\u{FE0F}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}\u{00A9}\u{00AE}\u{203C}\u{2049}\u{2122}\u{2139}\u{2194}-\u{2199}\u{21A9}-\u{21AA}\u{231A}-\u{231B}\u{2328}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{24C2}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2600}-\u{2604}\u{260E}\u{2611}\u{2614}-\u{2615}\u{2618}\u{261D}\u{2620}\u{2622}-\u{2623}\u{2626}\u{262A}\u{262E}-\u{262F}\u{2638}-\u{263A}\u{2640}\u{2642}\u{2648}-\u{2653}\u{2660}\u{2663}\u{2665}-\u{2666}\u{2668}\u{267B}\u{267E}-\u{267F}\u{2692}-\u{2697}\u{2699}\u{269B}-\u{269C}\u{26A0}-\u{26A1}\u{26AA}-\u{26AB}\u{26B0}-\u{26B1}\u{26BD}-\u{26BE}\u{26C4}-\u{26C5}\u{26C8}\u{26CE}-\u{26CF}\u{26D1}\u{26D3}-\u{26D4}\u{26E9}-\u{26EA}\u{26F0}-\u{26F5}\u{26F7}-\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}\u{2712}\u{2714}\u{2716}\u{271D}\u{2721}\u{2728}\u{2733}-\u{2734}\u{2744}\u{2747}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}-\u{2764}\u{2795}-\u{2797}\u{27A1}\u{27B0}\u{27BF}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]+)/gu;

        const parts = text.split(emojiRegex);

        parts.forEach((part, index) => {
            if (part) {
                segments.push({
                    text: part,
                    isEmoji: index % 2 === 1
                });
            }
        });

        return segments;
    }

    /**
     * Measure text width including emoji
     */
    measureText(ctx, text, fontSize, fontFamily, fontWeight, fontStyle) {
        const segments = this.splitTextWithEmoji(text);
        let totalWidth = 0;

        segments.forEach(segment => {
            if (segment.isEmoji) {
                // Use emoji font for measurement
                ctx.font = this.buildFontString(fontStyle, fontWeight, fontSize, 'sans-serif');
            } else {
                // Use regular font
                ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
            }
            totalWidth += ctx.measureText(segment.text).width;
        });

        return totalWidth;
    }

    /**
     * Draw text with proper emoji rendering
     */
    drawText(ctx, text, x, y, fontSize, fontFamily, fontWeight, fontStyle, color) {
        const segments = this.splitTextWithEmoji(text);
        let currentX = x;

        segments.forEach(segment => {
            if (segment.isEmoji) {
                // Use emoji font stack
                ctx.font = this.buildFontString(fontStyle, fontWeight, fontSize * 1.1, 'sans-serif');
                // Slightly larger for emoji to be visible
            } else {
                // Use regular font
                ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
            }

            ctx.fillStyle = color;
            ctx.fillText(segment.text, currentX, y);
            currentX += ctx.measureText(segment.text).width;
        });

        return currentX;
    }

    /**
     * Check if emoji fonts are supported
     */
    async checkEmojiSupport() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Test rendering an emoji
        ctx.font = `32px ${this.getEmojiFontStack()}`;
        ctx.fillText('😀', 0, 32);

        // Check if something was drawn (very basic check)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hasPixels = imageData.data.some(value => value !== 0);

        return hasPixels;
    }
}

// Singleton instance
let emojiRendererInstance = null;

export function getEmojiRenderer() {
    if (!emojiRendererInstance) {
        emojiRendererInstance = new EmojiRenderer();
    }
    return emojiRendererInstance;
}
