// ========================================
// Bump Chart Engine Module - v11.0 Graphics Excellence
// RANK TRACKING VISUALIZATION: Premium graphics with gradients & smooth curves
// Enhanced with bezier curves, glow effects, and beautiful gradients
// ========================================

export class BumpChartEngine {
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
        this.currentPeriodIndex = 0;
        this.animationProgress = 0;
        this.hoveredEntity = null;
    }

    /**
     * Merge user config with defaults
     */
    mergeConfig(config) {
        const palettes = {
            vibrant: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'],
            professional: ['#2E86AB', '#A23B72', '#F18F01', '#C73E1D', '#6A994E', '#BC4B51', '#5E7CE2', '#8B7E74'],
            neon: ['#FF006E', '#FFBE0B', '#8338EC', '#3A86FF', '#FB5607', '#06FFA5', '#FF00FF', '#00FFFF'],
            pastel: ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFDFBA', '#E0BBE4', '#FFDFD3', '#C9E4CA']
        };
        const palette = config.palette || 'vibrant';
        const colors = palettes[palette] || palettes.vibrant;

        return {
            title: config.title || 'Rank Evolution',
            subtitle: config.subtitle || '',
            topN: config.topN || 10,
            width: config.width || 1920,
            height: config.height || 1080,
            padding: config.padding || { top: 120, right: 150, bottom: 100, left: 150 },
            lineWidth: 4,
            dotRadius: 8,
            colors: colors,
            showLabels: config.showValueLabels !== false,
            enableShadows: config.enableShadows !== false,
            ...config
        };
    }

    /**
     * Initialize chart with data
     */
    initialize(data) {
        this.data = data;

        // Set up canvas
        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        this.canvas.width = this.config.width * dpr;
        this.canvas.height = this.config.height * dpr;
        this.canvas.style.width = this.config.width + 'px';
        this.canvas.style.height = this.config.height + 'px';
        this.ctx.scale(dpr, dpr);

        console.log('📈 Bump Chart Engine initialized:', this.config.width, 'x', this.config.height);

        // Calculate rankings for all periods
        this.rankings = this.calculateRankings();
    }

    /**
     * Calculate rankings for each period
     */
    calculateRankings() {
        const rankings = [];

        for (let periodIdx = 0; periodIdx < this.data.periods.length; periodIdx++) {
            const periodValues = this.data.values[periodIdx];
            const ranked = this.data.entities.map((entity, idx) => ({
                entity,
                value: periodValues[idx],
                entityIndex: idx
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, this.config.topN)
            .map((item, rank) => ({
                ...item,
                rank: rank + 1
            }));

            rankings.push(ranked);
        }

        return rankings;
    }

    /**
     * Update chart to specific period and progress
     */
    updateChart(periodIndex, progress) {
        this.currentPeriodIndex = periodIndex;
        this.animationProgress = progress;
        if (!this.data) {
            console.error('❌ BumpChart: No data to draw!');
            return;
        }
        this.draw();
    }

    /**
     * Draw complete bump chart
     */
    draw() {
        const ctx = this.ctx;
        const width = this.config.width;
        const height = this.config.height;
        const padding = this.config.padding;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw background
        this.drawBackground();

        // Draw title
        this.drawTitle();

        // Calculate chart area
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        const chartLeft = padding.left;
        const chartTop = padding.top;

        // Draw axes
        this.drawAxes(chartLeft, chartTop, chartWidth, chartHeight);

        // Draw lines
        this.drawLines(chartLeft, chartTop, chartWidth, chartHeight);

        // Draw current period indicator
        this.drawCurrentPeriodIndicator(chartLeft, chartTop, chartWidth, chartHeight);
    }

    /**
     * Draw background with enhanced gradient
     */
    drawBackground() {
        const ctx = this.ctx;

        // v11.0: Enhanced multi-color gradient background
        const gradient = ctx.createLinearGradient(0, 0, this.config.width, this.config.height);
        gradient.addColorStop(0, '#f8f9fa');
        gradient.addColorStop(0.3, '#f1f3f5');
        gradient.addColorStop(0.6, '#e9ecef');
        gradient.addColorStop(1, '#dee2e6');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.config.width, this.config.height);

        // v11.0: Add subtle radial highlight
        const highlight = ctx.createRadialGradient(
            this.config.width / 2, this.config.height / 3, 0,
            this.config.width / 2, this.config.height / 3, this.config.height
        );
        highlight.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = highlight;
        ctx.fillRect(0, 0, this.config.width, this.config.height);
    }

    /**
     * Draw title and subtitle
     */
    drawTitle() {
        const ctx = this.ctx;
        const width = this.config.width;

        // Title
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 48px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.config.title, width / 2, 60);

        // Subtitle
        if (this.config.subtitle) {
            ctx.fillStyle = '#666';
            ctx.font = '24px "Inter", sans-serif';
            ctx.fillText(this.config.subtitle, width / 2, 95);
        }
    }

    /**
     * Draw axes (time and rank)
     */
    drawAxes(chartLeft, chartTop, chartWidth, chartHeight) {
        const ctx = this.ctx;
        const periods = this.data.periods;
        const topN = this.config.topN;

        // X-axis (time periods)
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(chartLeft, chartTop + chartHeight);
        ctx.lineTo(chartLeft + chartWidth, chartTop + chartHeight);
        ctx.stroke();

        // X-axis labels
        ctx.fillStyle = '#666';
        ctx.font = '18px "Inter", sans-serif';
        ctx.textAlign = 'center';

        periods.forEach((period, idx) => {
            const x = chartLeft + (chartWidth / (periods.length - 1)) * idx;
            ctx.fillText(period, x, chartTop + chartHeight + 35);
        });

        // Y-axis (ranks)
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;

        for (let rank = 1; rank <= topN; rank++) {
            const y = chartTop + ((rank - 1) / (topN - 1)) * chartHeight;

            // Grid line
            ctx.beginPath();
            ctx.moveTo(chartLeft, y);
            ctx.lineTo(chartLeft + chartWidth, y);
            ctx.stroke();

            // Rank label
            ctx.fillStyle = '#999';
            ctx.font = 'bold 16px "Inter", sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`#${rank}`, chartLeft - 15, y + 5);
        }
    }

    /**
     * Draw ranking lines with enhanced graphics (v11.0)
     */
    drawLines(chartLeft, chartTop, chartWidth, chartHeight) {
        const ctx = this.ctx;
        const periods = this.data.periods;
        const topN = this.config.topN;

        // Track all entities that appear in top N
        const allEntities = new Set();
        this.rankings.forEach(ranking => {
            ranking.forEach(item => allEntities.add(item.entity));
        });

        const entities = Array.from(allEntities);

        // Draw each entity's line
        entities.forEach((entity, idx) => {
            const baseColor = this.config.colors[idx % this.config.colors.length];
            const isHovered = this.hoveredEntity === entity;

            // v11.0: Enhanced opacity and width
            const baseOpacity = isHovered ? 1 : 0.8;
            const currentOpacity = this.hoveredEntity && !isHovered ? 0.15 : baseOpacity;
            const lineWidth = isHovered ? 8 : 5; // Thicker lines

            // Collect all points for this entity
            const points = [];
            for (let periodIdx = 0; periodIdx <= this.currentPeriodIndex; periodIdx++) {
                const ranking = this.rankings[periodIdx];
                const item = ranking.find(r => r.entity === entity);

                if (item) {
                    const x = chartLeft + (chartWidth / (periods.length - 1)) * periodIdx;
                    let y = chartTop + ((item.rank - 1) / (topN - 1)) * chartHeight;

                    // Interpolate current period
                    if (periodIdx === this.currentPeriodIndex && periodIdx > 0) {
                        const prevRanking = this.rankings[periodIdx - 1];
                        const prevItem = prevRanking.find(r => r.entity === entity);
                        if (prevItem) {
                            const prevY = chartTop + ((prevItem.rank - 1) / (topN - 1)) * chartHeight;
                            y = prevY + (y - prevY) * this.animationProgress;
                        }
                    }

                    points.push({ x, y, periodIdx });
                }
            }

            if (points.length < 2) return;

            // v11.0: Draw gradient stroke
            const gradient = ctx.createLinearGradient(
                points[0].x, points[0].y,
                points[points.length - 1].x, points[points.length - 1].y
            );
            gradient.addColorStop(0, this.lightenColor(baseColor, 0.2));
            gradient.addColorStop(0.5, baseColor);
            gradient.addColorStop(1, this.darkenColor(baseColor, 0.2));

            ctx.strokeStyle = gradient;
            ctx.lineWidth = lineWidth;
            ctx.globalAlpha = currentOpacity;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // v11.0: Enhanced shadow/glow
            if (this.config.enableShadows) {
                ctx.shadowColor = baseColor;
                ctx.shadowBlur = isHovered ? 25 : 12;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            }

            // v11.0: Draw smooth bezier curve
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);

            for (let i = 0; i < points.length - 1; i++) {
                const curr = points[i];
                const next = points[i + 1];

                // Calculate control points for smooth curve
                const cpX = (curr.x + next.x) / 2;
                const cpY = (curr.y + next.y) / 2;

                ctx.quadraticCurveTo(curr.x, curr.y, cpX, cpY);
            }

            // Final point
            const last = points[points.length - 1];
            ctx.lineTo(last.x, last.y);
            ctx.stroke();

            ctx.shadowBlur = 0;

            // v11.0: Draw enhanced dots
            points.forEach((point, i) => {
                const dotSize = point.periodIdx === this.currentPeriodIndex ? 12 : 10;

                // Outer glow
                const glowGradient = ctx.createRadialGradient(
                    point.x, point.y, 0,
                    point.x, point.y, dotSize + 6
                );
                glowGradient.addColorStop(0, baseColor + 'CC');
                glowGradient.addColorStop(1, baseColor + '00');

                ctx.fillStyle = glowGradient;
                ctx.beginPath();
                ctx.arc(point.x, point.y, dotSize + 6, 0, Math.PI * 2);
                ctx.fill();

                // White border
                ctx.fillStyle = '#fff';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
                ctx.shadowBlur = 4;
                ctx.beginPath();
                ctx.arc(point.x, point.y, dotSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Gradient dot
                const dotGradient = ctx.createRadialGradient(
                    point.x - 2, point.y - 2, 0,
                    point.x, point.y, dotSize
                );
                dotGradient.addColorStop(0, this.lightenColor(baseColor, 0.3));
                dotGradient.addColorStop(1, baseColor);

                ctx.fillStyle = dotGradient;
                ctx.beginPath();
                ctx.arc(point.x, point.y, dotSize - 2, 0, Math.PI * 2);
                ctx.fill();

                // v11.0: Enhanced label at current position
                if (point.periodIdx === this.currentPeriodIndex && this.config.showLabels) {
                    // Label background
                    ctx.font = 'bold 16px "Inter", sans-serif';
                    const textWidth = ctx.measureText(entity).width;
                    const padding = 8;

                    // Background with gradient
                    const labelGradient = ctx.createLinearGradient(
                        point.x + 20, point.y - 12,
                        point.x + 20, point.y + 12
                    );
                    labelGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
                    labelGradient.addColorStop(1, 'rgba(255, 255, 255, 0.85)');

                    ctx.fillStyle = labelGradient;
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
                    ctx.shadowBlur = 8;
                    ctx.shadowOffsetY = 2;

                    this.roundRect(ctx,
                        point.x + 20 - padding,
                        point.y - 12,
                        textWidth + padding * 2,
                        24,
                        6
                    );
                    ctx.fill();
                    ctx.shadowBlur = 0;

                    // Label text with gradient
                    const textGradient = ctx.createLinearGradient(
                        point.x + 20, point.y - 8,
                        point.x + 20, point.y + 8
                    );
                    textGradient.addColorStop(0, '#1a1a1a');
                    textGradient.addColorStop(1, '#4a4a4a');

                    ctx.fillStyle = textGradient;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(entity, point.x + 20, point.y);
                }
            });

            ctx.globalAlpha = 1;
        });
    }

    /**
     * Helper: Round rectangle
     */
    roundRect(ctx, x, y, width, height, radius) {
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
    }

    /**
     * Helper: Lighten color
     */
    lightenColor(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.min(255, (num >> 16) + Math.round(255 * amount));
        const g = Math.min(255, ((num >> 8) & 0x00FF) + Math.round(255 * amount));
        const b = Math.min(255, (num & 0x0000FF) + Math.round(255 * amount));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }

    /**
     * Helper: Darken color
     */
    darkenColor(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
        const g = Math.max(0, ((num >> 8) & 0x00FF) - Math.round(255 * amount));
        const b = Math.max(0, (num & 0x0000FF) - Math.round(255 * amount));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }

    /**
     * Draw current period indicator
     */
    drawCurrentPeriodIndicator(chartLeft, chartTop, chartWidth, chartHeight) {
        if (this.currentPeriodIndex === 0) return;

        const ctx = this.ctx;
        const periods = this.data.periods;
        const x = chartLeft + (chartWidth / (periods.length - 1)) * this.currentPeriodIndex;

        // Draw vertical line
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(x, chartTop);
        ctx.lineTo(x, chartTop + chartHeight);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    /**
     * Destroy engine
     */
    destroy() {
        console.log('📈 Bump Chart Engine destroyed');
    }

    /**
     * Get canvas element
     */
    getCanvas() {
        return this.canvas;
    }
}
