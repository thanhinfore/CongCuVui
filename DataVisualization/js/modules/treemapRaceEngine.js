// ========================================
// Treemap Race Engine - ANIMATED RECTANGULAR TILES v1.0
// Dynamic treemap showing proportional rectangles with smooth transitions
// ========================================

export class TreemapRaceEngine {
    constructor(canvasId, config, audioEngine = null) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with id '${canvasId}' not found`);
        }

        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        this.config = this.mergeConfig(config);
        this.audioEngine = audioEngine;
        this.data = null;
        this.rectangles = new Map();
        this.previousValues = new Map();
        this.pulsePhase = 0;
        this.hoverEntity = null;
    }

    mergeConfig(config) {
        return {
            title: config.title || 'Treemap Race',
            subtitle: config.subtitle || '',
            topN: config.topN || 12,
            fps: config.fps || 60,
            periodLength: config.periodLength || 1000,
            palette: config.palette || 'vibrant',
            width: config.width || 1920,
            height: config.height || 1080,
            showLabels: config.showLabels !== false,
            showValues: config.showValues !== false,
            enableShadows: config.enableShadows !== false,
            enable3DEffect: config.enable3DEffect !== false,
            animatedBackground: config.animatedBackground !== false,
            borderWidth: config.borderWidth || 3,
            borderRadius: config.borderRadius || 8,
            layout: config.layout || 'squarified', // 'squarified' or 'slice-and-dice'
            padding: config.padding || { top: 120, right: 80, bottom: 80, left: 80 },
            fontSizes: config.fontSizes || null,
            ...config
        };
    }

    initialize(data) {
        this.data = data;

        // Set canvas dimensions with high DPI support
        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        this.canvas.width = this.config.width * dpr;
        this.canvas.height = this.config.height * dpr;
        this.canvas.style.width = this.config.width + 'px';
        this.canvas.style.height = this.config.height + 'px';
        this.ctx.scale(dpr, dpr);

        // Calculate chart area
        this.chartArea = {
            x: this.config.padding.left,
            y: this.config.padding.top,
            width: this.config.width - this.config.padding.left - this.config.padding.right,
            height: this.config.height - this.config.padding.top - this.config.padding.bottom
        };

        console.log('Treemap Race initialized:', {
            periods: data.periods.length,
            entities: data.entities.length,
            chartArea: this.chartArea
        });
    }

    updateChart(periodIndex, progress) {
        if (!this.data || periodIndex >= this.data.periods.length) return;

        const ctx = this.ctx;
        const currentPeriod = this.data.periods[periodIndex];
        const nextPeriod = periodIndex < this.data.periods.length - 1
            ? this.data.periods[periodIndex + 1]
            : currentPeriod;

        // Clear canvas with gradient background
        if (this.config.animatedBackground) {
            this.drawAnimatedBackground();
        } else {
            ctx.fillStyle = '#0a0e27';
            ctx.fillRect(0, 0, this.config.width, this.config.height);
        }

        // Get top N entities
        const currentData = this.getTopNData(currentPeriod);
        const nextData = this.getTopNData(nextPeriod);

        // Interpolate values
        const interpolatedData = this.interpolateData(currentData, nextData, progress);

        // Calculate treemap layout
        const layout = this.calculateTreemap(interpolatedData);

        // Draw rectangles
        this.drawTreemap(layout, interpolatedData);

        // Draw title and period
        this.drawTitleAndPeriod(currentPeriod.name);

        // Update pulse phase
        this.pulsePhase += 0.05;
    }

    drawAnimatedBackground() {
        const ctx = this.ctx;
        const gradient = ctx.createRadialGradient(
            this.config.width / 2, this.config.height / 2, 0,
            this.config.width / 2, this.config.height / 2, this.config.width
        );

        const hue = (Date.now() / 50) % 360;
        gradient.addColorStop(0, `hsl(${hue}, 40%, 8%)`);
        gradient.addColorStop(1, '#05080f');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.config.width, this.config.height);
    }

    getTopNData(period) {
        const entries = Object.entries(period.values)
            .map(([entity, value]) => ({ entity, value: parseFloat(value) || 0 }))
            .filter(d => d.value > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, this.config.topN);
        return entries;
    }

    interpolateData(currentData, nextData, progress) {
        const result = [];
        const easeProgress = this.easeInOutCubic(progress);

        for (let i = 0; i < currentData.length; i++) {
            const current = currentData[i];
            const next = nextData.find(d => d.entity === current.entity) || current;

            result.push({
                entity: current.entity,
                value: Math.max(0, current.value + (next.value - current.value) * easeProgress),
                rank: i + 1
            });
        }

        return result.filter(d => d.value > 0);
    }

    calculateTreemap(data) {
        const total = data.reduce((sum, d) => sum + d.value, 0);
        if (total === 0) return [];

        // Normalize data
        const normalized = data.map(d => ({
            ...d,
            normalizedValue: d.value / total
        }));

        // Use squarified treemap algorithm
        if (this.config.layout === 'squarified') {
            return this.squarify(normalized, this.chartArea);
        } else {
            return this.sliceAndDice(normalized, this.chartArea);
        }
    }

    squarify(data, bounds) {
        // Squarified treemap algorithm for better aspect ratios
        const result = [];
        const sortedData = [...data].sort((a, b) => b.value - a.value);

        const squarifyRecursive = (items, x, y, width, height) => {
            if (items.length === 0) return;

            if (items.length === 1) {
                result.push({
                    ...items[0],
                    x, y, width, height
                });
                return;
            }

            // Choose direction based on aspect ratio
            const isWide = width > height;
            const totalValue = items.reduce((sum, d) => sum + d.normalizedValue, 0);

            // Split into two groups
            let splitIndex = 1;
            let bestRatio = Infinity;

            for (let i = 1; i <= items.length; i++) {
                const leftValue = items.slice(0, i).reduce((sum, d) => sum + d.normalizedValue, 0);
                const ratio = Math.abs(leftValue - (totalValue - leftValue));

                if (ratio < bestRatio) {
                    bestRatio = ratio;
                    splitIndex = i;
                }
            }

            const leftItems = items.slice(0, splitIndex);
            const rightItems = items.slice(splitIndex);

            const leftValue = leftItems.reduce((sum, d) => sum + d.normalizedValue, 0);
            const leftRatio = leftValue / totalValue;

            if (isWide) {
                const leftWidth = width * leftRatio;
                this.layoutRow(leftItems, x, y, leftWidth, height, result);
                squarifyRecursive(rightItems, x + leftWidth, y, width - leftWidth, height);
            } else {
                const leftHeight = height * leftRatio;
                this.layoutRow(leftItems, x, y, width, leftHeight, result);
                squarifyRecursive(rightItems, x, y + leftHeight, width, height - leftHeight);
            }
        };

        squarifyRecursive(sortedData, bounds.x, bounds.y, bounds.width, bounds.height);
        return result;
    }

    layoutRow(items, x, y, width, height, result) {
        const totalValue = items.reduce((sum, d) => sum + d.normalizedValue, 0);
        const isWide = width > height;

        let offset = 0;
        items.forEach(item => {
            const ratio = item.normalizedValue / totalValue;

            if (isWide) {
                const itemHeight = height * ratio;
                result.push({
                    ...item,
                    x, y: y + offset,
                    width, height: itemHeight
                });
                offset += itemHeight;
            } else {
                const itemWidth = width * ratio;
                result.push({
                    ...item,
                    x: x + offset, y,
                    width: itemWidth, height
                });
                offset += itemWidth;
            }
        });
    }

    sliceAndDice(data, bounds) {
        // Simple slice-and-dice algorithm
        const result = [];
        let y = bounds.y;

        data.forEach((item, index) => {
            const height = bounds.height * item.normalizedValue;
            result.push({
                ...item,
                x: bounds.x,
                y: y,
                width: bounds.width,
                height: height
            });
            y += height;
        });

        return result;
    }

    drawTreemap(layout, data) {
        const ctx = this.ctx;
        const colors = this.getColorPalette();

        layout.forEach((rect, index) => {
            const color = colors[data.findIndex(d => d.entity === rect.entity) % colors.length];
            const padding = 2;

            // Smooth transition for existing rectangles
            const prevRect = this.rectangles.get(rect.entity);
            if (prevRect) {
                rect.x = prevRect.x + (rect.x - prevRect.x) * 0.2;
                rect.y = prevRect.y + (rect.y - prevRect.y) * 0.2;
                rect.width = prevRect.width + (rect.width - prevRect.width) * 0.2;
                rect.height = prevRect.height + (rect.height - prevRect.height) * 0.2;
            }
            this.rectangles.set(rect.entity, { ...rect });

            const x = rect.x + padding;
            const y = rect.y + padding;
            const width = rect.width - padding * 2;
            const height = rect.height - padding * 2;

            // Skip if too small
            if (width < 10 || height < 10) return;

            // Draw shadow
            if (this.config.enableShadows) {
                ctx.save();
                ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
                ctx.shadowBlur = 15;
                ctx.shadowOffsetX = 3;
                ctx.shadowOffsetY = 3;
                this.drawRoundedRect(x, y, width, height, this.config.borderRadius, color);
                ctx.restore();
            }

            // PREMIUM: Enhanced 3D rectangle with depth and lighting
            ctx.save();
            if (this.config.enable3DEffect) {
                // Main gradient - diagonal lighting
                const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
                gradient.addColorStop(0, this.adjustColorBrightness(color, 1.5));
                gradient.addColorStop(0.2, this.adjustColorBrightness(color, 1.2));
                gradient.addColorStop(0.5, color);
                gradient.addColorStop(0.8, this.adjustColorBrightness(color, 0.8));
                gradient.addColorStop(1, this.adjustColorBrightness(color, 0.6));
                this.drawRoundedRect(x, y, width, height, this.config.borderRadius, gradient);

                // Top-left highlight (simulated light source)
                const highlightGradient = ctx.createRadialGradient(
                    x + width * 0.3, y + height * 0.3, 0,
                    x + width * 0.3, y + height * 0.3, Math.max(width, height) * 0.6
                );
                highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
                highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
                highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                ctx.save();
                this.drawRoundedRect(x, y, width, height, this.config.borderRadius, highlightGradient);
                ctx.restore();

                // Bottom-right shadow (depth effect)
                const depthShadow = ctx.createLinearGradient(
                    x + width * 0.5, y + height * 0.5,
                    x + width, y + height
                );
                depthShadow.addColorStop(0, 'rgba(0, 0, 0, 0)');
                depthShadow.addColorStop(1, 'rgba(0, 0, 0, 0.3)');

                ctx.save();
                this.drawRoundedRect(x, y, width, height, this.config.borderRadius, depthShadow);
                ctx.restore();
            } else {
                this.drawRoundedRect(x, y, width, height, this.config.borderRadius, color);
            }
            ctx.restore();

            // PREMIUM: Multi-layer border
            ctx.save();
            // Outer glow border
            ctx.strokeStyle = this.adjustColorBrightness(color, 1.5);
            ctx.lineWidth = this.config.borderWidth + 1;
            ctx.globalAlpha = 0.3;
            this.strokeRoundedRect(x - 1, y - 1, width + 2, height + 2, this.config.borderRadius + 1);

            // Main border
            ctx.globalAlpha = 0.6;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = this.config.borderWidth;
            this.strokeRoundedRect(x, y, width, height, this.config.borderRadius);

            // Inner border
            ctx.globalAlpha = 0.4;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            this.strokeRoundedRect(x + 2, y + 2, width - 4, height - 4, this.config.borderRadius - 1);
            ctx.restore();

            // PREMIUM: Multi-ring pulse effect for growing rectangles
            const prevValue = this.previousValues.get(rect.entity) || 0;
            if (rect.value > prevValue) {
                const pulseIntensity = Math.sin(this.pulsePhase * 2);

                // Outer pulse ring
                ctx.save();
                ctx.globalAlpha = 0.2 + pulseIntensity * 0.15;
                const outerGlow = ctx.createLinearGradient(x, y, x + width, y + height);
                outerGlow.addColorStop(0, this.adjustColorBrightness(color, 1.8));
                outerGlow.addColorStop(1, '#ffffff');
                ctx.strokeStyle = outerGlow;
                ctx.lineWidth = 5;
                ctx.shadowColor = color;
                ctx.shadowBlur = 15;
                this.strokeRoundedRect(x - 3, y - 3, width + 6, height + 6, this.config.borderRadius + 3);
                ctx.restore();

                // Middle pulse ring
                ctx.save();
                ctx.globalAlpha = 0.3 + pulseIntensity * 0.2;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 10;
                this.strokeRoundedRect(x - 2, y - 2, width + 4, height + 4, this.config.borderRadius + 2);
                ctx.restore();

                // Inner highlight
                ctx.save();
                ctx.globalAlpha = 0.4 + pulseIntensity * 0.3;
                ctx.strokeStyle = this.adjustColorBrightness(color, 2.0);
                ctx.lineWidth = 2;
                this.strokeRoundedRect(x - 1, y - 1, width + 2, height + 2, this.config.borderRadius + 1);
                ctx.restore();
            }
            this.previousValues.set(rect.entity, rect.value);

            // Draw label and value
            if (width > 60 && height > 40) {
                this.drawRectLabel(x, y, width, height, rect.entity, rect.value, rect.rank);
            }
        });
    }

    drawRoundedRect(x, y, width, height, radius, fillStyle) {
        const ctx = this.ctx;

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();

        ctx.fillStyle = fillStyle;
        ctx.fill();
    }

    strokeRoundedRect(x, y, width, height, radius) {
        const ctx = this.ctx;

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();

        ctx.stroke();
    }

    drawRectLabel(x, y, width, height, entity, value, rank) {
        const ctx = this.ctx;

        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;

        const centerX = x + width / 2;
        const centerY = y + height / 2;

        // Draw rank badge for top 3
        if (rank <= 3 && width > 80 && height > 60) {
            this.drawRankBadge(x + 10, y + 10, rank);
        }

        // Calculate font sizes based on rectangle size
        const maxFontSize = Math.min(width / 6, height / 3, 24);
        const entityFontSize = Math.max(12, maxFontSize);
        const valueFontSize = Math.max(10, maxFontSize * 0.7);

        // Draw entity name
        if (this.config.showLabels) {
            ctx.font = `bold ${entityFontSize}px Inter, sans-serif`;

            // Truncate text if too long
            let displayText = entity;
            let textWidth = ctx.measureText(displayText).width;
            while (textWidth > width - 20 && displayText.length > 3) {
                displayText = displayText.slice(0, -1);
                textWidth = ctx.measureText(displayText + '...').width;
            }
            if (displayText !== entity) {
                displayText += '...';
            }

            ctx.fillText(displayText, centerX, centerY - entityFontSize / 2);
        }

        // Draw value
        if (this.config.showValues) {
            ctx.font = `${valueFontSize}px Inter, sans-serif`;
            ctx.fillStyle = '#dddddd';
            ctx.fillText(this.formatNumber(value), centerX, centerY + entityFontSize / 2);
        }

        ctx.restore();
    }

    drawRankBadge(x, y, rank) {
        const ctx = this.ctx;
        const size = 28;

        ctx.save();
        // Badge background
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Rank number
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'transparent';
        ctx.fillText(rank.toString(), x + size / 2, y + size / 2 + 1);
        ctx.restore();
    }

    drawTitleAndPeriod(periodName) {
        const ctx = this.ctx;

        // Draw title
        ctx.save();
        ctx.font = 'bold 48px Inter, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillText(this.config.title, this.config.width / 2, 60);

        // Draw subtitle if exists
        if (this.config.subtitle) {
            ctx.font = '24px Inter, sans-serif';
            ctx.fillStyle = '#aaaaaa';
            ctx.fillText(this.config.subtitle, this.config.width / 2, 95);
        }
        ctx.restore();

        // Draw period
        ctx.save();
        ctx.font = 'bold 56px Inter, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillText(periodName, this.config.width / 2, this.config.height - 40);
        ctx.restore();
    }

    getColorPalette() {
        const palettes = {
            vibrant: [
                '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
                '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
                '#E74C3C', '#3498DB', '#9B59B6', '#1ABC9C', '#F39C12'
            ],
            neon: [
                '#FF006E', '#00F5FF', '#39FF14', '#FFFF00', '#FF10F0',
                '#00FFFF', '#FF4500', '#7FFF00', '#FF1493', '#00FF7F'
            ],
            sunset: [
                '#FF6B35', '#F7931E', '#FDC830', '#F37335', '#FF5E5B',
                '#D64045', '#FF8C42', '#FFBA08', '#D62828', '#F77F00'
            ],
            ocean: [
                '#0077BE', '#00B4D8', '#90E0EF', '#00A6FB', '#0096C7',
                '#023E8A', '#48CAE4', '#00B4D8', '#0077B6', '#03045E'
            ],
            professional: [
                '#2C3E50', '#E74C3C', '#3498DB', '#1ABC9C', '#F39C12',
                '#9B59B6', '#34495E', '#E67E22', '#16A085', '#27AE60'
            ]
        };

        return palettes[this.config.palette] || palettes.vibrant;
    }

    adjustColorBrightness(color, factor) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        return `rgb(${Math.min(255, Math.floor(r * factor))}, ${Math.min(255, Math.floor(g * factor))}, ${Math.min(255, Math.floor(b * factor))})`;
    }

    formatNumber(num) {
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return num.toFixed(0);
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    destroy() {
        this.rectangles.clear();
        this.previousValues.clear();
    }
}
