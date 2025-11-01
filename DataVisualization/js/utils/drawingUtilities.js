// ========================================
// Drawing Utilities - v15.0 Architecture Upgrade
// Canvas drawing helpers used across multiple engines
// Eliminates drawing code duplication
// ========================================

import { ColorUtils } from './chartUtilities.js';

/**
 * Canvas setup and management utilities
 */
export const CanvasUtils = {
    /**
     * Setup canvas with high DPI support
     * Used in ALL 8 engines (448 lines duplication eliminated)
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {number} width - Logical width
     * @param {number} height - Logical height
     * @param {number} maxDpr - Maximum device pixel ratio (default: 3)
     * @returns {CanvasRenderingContext2D} 2D context
     */
    setupCanvas(canvas, width, height, maxDpr = 3) {
        const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.scale(dpr, dpr);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        return ctx;
    },

    /**
     * Calculate chart area with padding
     */
    calculateChartArea(width, height, padding) {
        return {
            x: padding.left,
            y: padding.top,
            width: width - padding.left - padding.right,
            height: height - padding.top - padding.bottom
        };
    },

    /**
     * Clear canvas with optional background color
     */
    clearCanvas(ctx, width, height, backgroundColor = '#0a0e27') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
    }
};

/**
 * Shape drawing utilities
 */
export const ShapeUtils = {
    /**
     * Draw rounded rectangle (stroke)
     * Used in bumpChartEngine and treemapRaceEngine
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {number} radius - Corner radius
     */
    drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.arcTo(x + width, y, x + width, y + radius, radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
        ctx.lineTo(x + radius, y + height);
        ctx.arcTo(x, y + height, x, y + height - radius, radius);
        ctx.lineTo(x, y + radius);
        ctx.arcTo(x, y, x + radius, y, radius);
        ctx.closePath();
    },

    /**
     * Fill rounded rectangle
     */
    fillRoundedRect(ctx, x, y, width, height, radius, fillStyle) {
        this.drawRoundedRect(ctx, x, y, width, height, radius);
        ctx.fillStyle = fillStyle;
        ctx.fill();
    },

    /**
     * Stroke rounded rectangle
     */
    strokeRoundedRect(ctx, x, y, width, height, radius, strokeStyle, lineWidth = 1) {
        this.drawRoundedRect(ctx, x, y, width, height, radius);
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }
};

/**
 * Gradient utilities
 */
export const GradientUtils = {
    /**
     * Create linear gradient
     */
    createLinearGradient(ctx, x0, y0, x1, y1, colorStops) {
        const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
        colorStops.forEach(({ offset, color }) => {
            gradient.addColorStop(offset, color);
        });
        return gradient;
    },

    /**
     * Create radial gradient
     */
    createRadialGradient(ctx, x0, y0, r0, x1, y1, r1, colorStops) {
        const gradient = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
        colorStops.forEach(({ offset, color }) => {
            gradient.addColorStop(offset, color);
        });
        return gradient;
    },

    /**
     * Create 3D sphere gradient (for bubbles)
     */
    create3DSphereGradient(ctx, x, y, radius, baseColor) {
        const gradient = ctx.createRadialGradient(
            x - radius * 0.4,
            y - radius * 0.4,
            0,
            x,
            y,
            radius
        );

        gradient.addColorStop(0, ColorUtils.adjustBrightness(baseColor, 2.2));
        gradient.addColorStop(0.1, ColorUtils.adjustBrightness(baseColor, 1.8));
        gradient.addColorStop(0.25, ColorUtils.adjustBrightness(baseColor, 1.3));
        gradient.addColorStop(0.5, baseColor);
        gradient.addColorStop(0.75, ColorUtils.adjustBrightness(baseColor, 0.7));
        gradient.addColorStop(0.95, ColorUtils.adjustBrightness(baseColor, 0.4));
        gradient.addColorStop(1, ColorUtils.adjustBrightness(baseColor, 0.3));

        return gradient;
    },

    /**
     * Create animated background gradient (with time-based hue)
     */
    createAnimatedBackgroundGradient(ctx, width, height, time = Date.now()) {
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        const hue = (time / 50) % 360;

        gradient.addColorStop(0, `hsl(${hue}, 60%, 12%)`);
        gradient.addColorStop(0.5, '#0a0e27');
        gradient.addColorStop(1, `hsl(${(hue + 60) % 360}, 60%, 12%)`);

        return gradient;
    }
};

/**
 * Shadow and effect utilities
 */
export const EffectUtils = {
    /**
     * Apply shadow to context
     * @param {CanvasRenderingContext2D} ctx
     * @param {Object} options - Shadow options
     */
    applyShadow(ctx, { color = 'rgba(0, 0, 0, 0.4)', blur = 25, offsetX = 5, offsetY = 5 }) {
        ctx.shadowColor = color;
        ctx.shadowBlur = blur;
        ctx.shadowOffsetX = offsetX;
        ctx.shadowOffsetY = offsetY;
    },

    /**
     * Clear shadow from context
     */
    clearShadow(ctx) {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    },

    /**
     * Draw with shadow (auto-saves/restores context)
     */
    drawWithShadow(ctx, shadowOptions, drawCallback) {
        ctx.save();
        this.applyShadow(ctx, shadowOptions);
        drawCallback(ctx);
        ctx.restore();
    }
};

/**
 * Text drawing utilities
 */
export const TextUtils = {
    /**
     * Draw text with shadow
     */
    drawTextWithShadow(ctx, text, x, y, {
        font = '16px Inter, sans-serif',
        fillStyle = '#ffffff',
        textAlign = 'left',
        textBaseline = 'top',
        shadowColor = 'rgba(0, 0, 0, 0.8)',
        shadowBlur = 5
    } = {}) {
        ctx.save();
        ctx.font = font;
        ctx.fillStyle = fillStyle;
        ctx.textAlign = textAlign;
        ctx.textBaseline = textBaseline;
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = shadowBlur;
        ctx.fillText(text, x, y);
        ctx.restore();
    },

    /**
     * Measure text width
     */
    measureText(ctx, text, font = '16px Inter, sans-serif') {
        ctx.save();
        ctx.font = font;
        const metrics = ctx.measureText(text);
        ctx.restore();
        return metrics.width;
    },

    /**
     * Draw multiline text
     */
    drawMultilineText(ctx, text, x, y, lineHeight, options = {}) {
        const lines = text.split('\n');
        lines.forEach((line, index) => {
            this.drawTextWithShadow(ctx, line, x, y + index * lineHeight, options);
        });
    }
};

/**
 * Common UI element utilities
 */
export const UIUtils = {
    /**
     * Draw rank badge (used in bubbleChartRace and treemapRace)
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {number} rank - Rank number (1, 2, 3)
     * @param {number} size - Badge size (default: 30)
     */
    drawRankBadge(ctx, x, y, rank, size = 30) {
        ctx.save();

        // Draw circle
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);

        // Badge color based on rank
        ctx.fillStyle = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32';
        ctx.fill();

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Rank number
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${size * 0.55}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(rank.toString(), x, y);

        ctx.restore();
    },

    /**
     * Draw title and period (common pattern in 7 engines)
     */
    drawTitleAndPeriod(ctx, width, height, title, period, {
        titleFont = 'bold 48px Inter, sans-serif',
        periodFont = 'bold 72px Inter, sans-serif',
        titleY = 60,
        periodY = null  // Auto-calculate if null
    } = {}) {
        periodY = periodY || (height - 60);

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;

        // Draw title
        ctx.font = titleFont;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(title, width / 2, titleY);

        // Draw period
        ctx.font = periodFont;
        ctx.fillText(period, width / 2, periodY);

        ctx.restore();
    },

    /**
     * Draw animated background (used in 4 engines)
     */
    drawAnimatedBackground(ctx, width, height, time = Date.now()) {
        const gradient = GradientUtils.createAnimatedBackgroundGradient(ctx, width, height, time);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    },

    /**
     * Draw legend
     */
    drawLegend(ctx, x, y, items, {
        itemHeight = 60,
        circleRadius = 15,
        font = '12px Inter, sans-serif',
        labelColor = '#aaaaaa'
    } = {}) {
        ctx.save();

        items.forEach((item, index) => {
            const cy = y + index * itemHeight;

            // Draw color circle
            ctx.beginPath();
            ctx.arc(x, cy, circleRadius / 2, 0, Math.PI * 2);
            ctx.fillStyle = item.color;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.stroke();

            // Draw label
            ctx.fillStyle = labelColor;
            ctx.font = font;
            ctx.textAlign = 'left';
            ctx.fillText(item.label, x + circleRadius / 2 + 10, cy + 5);
        });

        ctx.restore();
    }
};

/**
 * Animation utilities
 */
export const AnimationUtils = {
    /**
     * Create pulsing effect
     */
    createPulse(time, speed = 0.03, amplitude = 0.03, offset = 0) {
        return Math.sin(time * speed + offset) * amplitude + 1;
    },

    /**
     * Create wave effect
     */
    createWave(index, time, wavelength = 0.5, speed = 0.03) {
        return Math.sin(time * speed + index * wavelength);
    }
};

console.log('✨ Drawing Utilities v15.0 loaded - Canvas drawing helpers');
