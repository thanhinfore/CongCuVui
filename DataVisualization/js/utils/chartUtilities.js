// ========================================
// Chart Utilities - v15.0 Architecture Upgrade
// Shared utilities used across ALL chart engines
// Eliminates 320+ lines of duplication
// ========================================

/**
 * Number formatting utilities
 */
export const NumberFormatter = {
    /**
     * Format large numbers with K/M/B suffixes
     * Used in ALL 8 engines (100% duplication eliminated)
     * @param {number} num - Number to format
     * @param {number} decimals - Decimal places (default: 1)
     * @returns {string} Formatted string (e.g., "1.5M", "2.3B")
     */
    format(num, decimals = 1) {
        if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';
        return num.toFixed(0);
    },

    /**
     * Format number with thousands separator
     */
    formatWithSeparator(num, separator = ',') {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    },

    /**
     * Format as percentage
     */
    formatPercent(num, decimals = 1) {
        return (num * 100).toFixed(decimals) + '%';
    },

    /**
     * Format as currency
     */
    formatCurrency(num, currency = '$', decimals = 2) {
        return currency + num.toFixed(decimals);
    }
};

/**
 * Color palette definitions - v15.0 Premium Edition
 * Used in ALL 8 engines (100% duplication eliminated)
 * Enhanced with ultra-premium color schemes
 */
export const ColorPalettes = {
    // Classic palettes
    vibrant: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
        '#E74C3C', '#3498DB', '#9B59B6', '#1ABC9C', '#F39C12',
        '#FF6B9D', '#C44569', '#58B19F', '#3B3B98', '#FEA47F'
    ],
    neon: [
        '#FF006E', '#00F5FF', '#39FF14', '#FFFF00', '#FF10F0',
        '#00FFFF', '#FF4500', '#7FFF00', '#FF1493', '#00FF7F',
        '#FF00FF', '#00FF00', '#FF0000', '#0000FF', '#FFFF00'
    ],
    sunset: [
        '#FF6B35', '#F7931E', '#FDC830', '#F37335', '#FF5E5B',
        '#D64045', '#FF8C42', '#FFBA08', '#D62828', '#F77F00'
    ],
    ocean: [
        '#0077BE', '#00B4D8', '#90E0EF', '#00A6FB', '#0096C7',
        '#023E8A', '#48CAE4', '#00B4D8', '#0077B6', '#03045E'
    ],
    forest: [
        '#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2',
        '#B7E4C7', '#1B4332', '#081C15', '#52796F', '#84A98C'
    ],
    candy: [
        '#FF69B4', '#FFB6C1', '#FFC0CB', '#FF1493', '#C71585',
        '#DB7093', '#FFE4E1', '#FFF0F5', '#FFDAB9', '#FFE4B5'
    ],

    // ✨ v15.0: NEW PREMIUM PALETTES ✨

    // Aurora - Northern lights inspired
    aurora: [
        '#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe',
        '#43e97b', '#38f9d7', '#fa709a', '#fee140', '#30cfd0'
    ],

    // Cyberpunk - Futuristic neon
    cyberpunk: [
        '#ff006e', '#8338ec', '#3a86ff', '#fb5607', '#ffbe0b',
        '#06ffa5', '#ff006e', '#8338ec', '#3a86ff', '#fb5607'
    ],

    // Royal - Elegant and sophisticated
    royal: [
        '#667eea', '#764ba2', '#8b5cf6', '#6366f1', '#4f46e5',
        '#7c3aed', '#a855f7', '#9333ea', '#7e22ce', '#6b21a8'
    ],

    // Fire - Hot and energetic
    fire: [
        '#ff0844', '#ffb199', '#ff6b6b', '#ee5a6f', '#f06292',
        '#ff7675', '#ff6348', '#ff4757', '#e84118', '#c23616'
    ],

    // Ice - Cool and calm
    ice: [
        '#667eea', '#a8e6cf', '#3dc1d3', '#00d2d3', '#00adb5',
        '#38ada9', '#079992', '#006d77', '#005f73', '#0a9396'
    ],

    // Tropical - Vibrant and warm
    tropical: [
        '#f8b500', '#f69d3c', '#feca57', '#ff9ff3', '#ff6b6b',
        '#ee5a6f', '#48dbfb', '#0abde3', '#10ac84', '#00d2d3'
    ],

    // Pastel - Soft and gentle
    pastel: [
        '#a29bfe', '#fd79a8', '#fdcb6e', '#6c5ce7', '#fab1a0',
        '#ff7675', '#74b9ff', '#55efc4', '#81ecec', '#dfe6e9'
    ],

    // Deep Space - Dark and mysterious
    deepspace: [
        '#4a148c', '#6a1b9a', '#7b1fa2', '#8e24aa', '#9c27b0',
        '#ab47bc', '#ba68c8', '#ce93d8', '#e1bee7', '#f3e5f5'
    ],

    // Emerald - Rich greens
    emerald: [
        '#10b981', '#059669', '#047857', '#065f46', '#064e3b',
        '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#ecfdf5'
    ],

    // Crimson - Deep reds
    crimson: [
        '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#ef4444',
        '#f87171', '#fca5a5', '#fecaca', '#fee2e2', '#fef2f2'
    ]
};

/**
 * Get color palette by name
 * @param {string} paletteName - Name of palette (vibrant, neon, sunset, ocean, forest, candy)
 * @returns {Array<string>} Array of color hex codes
 */
export function getColorPalette(paletteName = 'vibrant') {
    return ColorPalettes[paletteName] || ColorPalettes.vibrant;
}

/**
 * Get color from palette by index (with wrapping)
 */
export function getColorByIndex(index, paletteName = 'vibrant') {
    const palette = getColorPalette(paletteName);
    return palette[index % palette.length];
}

/**
 * Color manipulation utilities
 */
export const ColorUtils = {
    /**
     * Adjust color brightness
     * Used in 4+ engines (100% duplication eliminated)
     * @param {string} color - Hex color (#RRGGBB)
     * @param {number} factor - Brightness multiplier (>1 = brighter, <1 = darker)
     * @returns {string} RGB color string
     */
    adjustBrightness(color, factor) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        return `rgb(${Math.min(255, Math.floor(r * factor))}, ${Math.min(255, Math.floor(g * factor))}, ${Math.min(255, Math.floor(b * factor))})`;
    },

    /**
     * Lighten a color by percentage
     */
    lighten(color, percent) {
        return this.adjustBrightness(color, 1 + percent / 100);
    },

    /**
     * Darken a color by percentage
     */
    darken(color, percent) {
        return this.adjustBrightness(color, 1 - percent / 100);
    },

    /**
     * Convert hex to RGBA
     */
    hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },

    /**
     * Parse any color to RGB components
     */
    parseColor(color) {
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            return {
                r: parseInt(hex.substr(0, 2), 16),
                g: parseInt(hex.substr(2, 2), 16),
                b: parseInt(hex.substr(4, 2), 16)
            };
        }
        // Handle rgb/rgba strings
        const matches = color.match(/\d+/g);
        if (matches) {
            return {
                r: parseInt(matches[0]),
                g: parseInt(matches[1]),
                b: parseInt(matches[2])
            };
        }
        return { r: 0, g: 0, b: 0 };
    }
};

/**
 * Animation easing functions
 * Used in 5+ engines (100% duplication eliminated)
 */
export const EasingFunctions = {
    /**
     * Ease in-out cubic (most common)
     */
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },

    /**
     * Ease in cubic
     */
    easeInCubic(t) {
        return t * t * t;
    },

    /**
     * Ease out cubic
     */
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    },

    /**
     * Linear (no easing)
     */
    linear(t) {
        return t;
    },

    /**
     * Ease in-out quadratic
     */
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    },

    /**
     * Ease in-out elastic (bouncy)
     */
    easeInOutElastic(t) {
        const c5 = (2 * Math.PI) / 4.5;
        return t === 0 ? 0
            : t === 1 ? 1
            : t < 0.5
            ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
            : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
    }
};

/**
 * Math utilities
 */
export const MathUtils = {
    /**
     * Clamp value between min and max
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    /**
     * Linear interpolation
     */
    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    /**
     * Map value from one range to another
     */
    map(value, inMin, inMax, outMin, outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    },

    /**
     * Normalize value to 0-1 range
     */
    normalize(value, min, max) {
        return (value - min) / (max - min);
    },

    /**
     * Calculate distance between two points
     */
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
};

/**
 * Configuration helpers
 */
export const ConfigUtils = {
    /**
     * Deep merge two config objects
     */
    mergeConfig(defaults, custom) {
        const result = { ...defaults };

        for (const key in custom) {
            if (custom[key] !== undefined) {
                if (typeof custom[key] === 'object' && !Array.isArray(custom[key]) && custom[key] !== null) {
                    result[key] = this.mergeConfig(defaults[key] || {}, custom[key]);
                } else {
                    result[key] = custom[key];
                }
            }
        }

        return result;
    },

    /**
     * Validate required config fields
     */
    validateConfig(config, requiredFields) {
        const missing = [];
        for (const field of requiredFields) {
            if (config[field] === undefined) {
                missing.push(field);
            }
        }
        if (missing.length > 0) {
            throw new Error(`Missing required config fields: ${missing.join(', ')}`);
        }
        return true;
    }
};

console.log('✨ Chart Utilities v15.0 loaded - Shared utilities for all chart engines');
