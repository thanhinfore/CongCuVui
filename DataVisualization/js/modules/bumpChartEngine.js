// ========================================
// Bump Chart Engine Module - v10.0
// RANK TRACKING VISUALIZATION: Focus on ranking changes over time
// Perfect for seeing who's winning and trajectory analysis
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
        return {
            title: config.title || 'Rank Evolution',
            subtitle: config.subtitle || '',
            topN: config.topN || 10,
            width: config.width || 1920,
            height: config.height || 1080,
            padding: config.padding || { top: 120, right: 150, bottom: 100, left: 150 },
            lineWidth: 4,
            dotRadius: 8,
            colors: this.getColorPalette(config.palette || 'vibrant'),
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
     * Draw background
     */
    drawBackground() {
        const ctx = this.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, this.config.height);
        gradient.addColorStop(0, '#f8f9fa');
        gradient.addColorStop(1, '#e9ecef');
        ctx.fillStyle = gradient;
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
     * Draw ranking lines
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
            const color = this.config.colors[idx % this.config.colors.length];
            const isHovered = this.hoveredEntity === entity;

            // Determine line opacity
            const baseOpacity = isHovered ? 1 : 0.7;
            const currentOpacity = this.hoveredEntity && !isHovered ? 0.2 : baseOpacity;

            ctx.strokeStyle = color;
            ctx.lineWidth = isHovered ? 6 : this.config.lineWidth;
            ctx.globalAlpha = currentOpacity;

            // Draw line segments
            ctx.beginPath();
            let firstPoint = true;

            for (let periodIdx = 0; periodIdx < periods.length; periodIdx++) {
                const ranking = this.rankings[periodIdx];
                const item = ranking.find(r => r.entity === entity);

                if (item) {
                    const x = chartLeft + (chartWidth / (periods.length - 1)) * periodIdx;
                    const y = chartTop + ((item.rank - 1) / (topN - 1)) * chartHeight;

                    // Stop at current period if animating
                    if (periodIdx > this.currentPeriodIndex) break;

                    // Interpolate if on current period
                    if (periodIdx === this.currentPeriodIndex && this.currentPeriodIndex > 0) {
                        const prevRanking = this.rankings[periodIdx - 1];
                        const prevItem = prevRanking.find(r => r.entity === entity);

                        if (prevItem) {
                            const prevY = chartTop + ((prevItem.rank - 1) / (topN - 1)) * chartHeight;
                            const interpolatedY = prevY + (y - prevY) * this.animationProgress;

                            if (firstPoint) {
                                ctx.moveTo(x, interpolatedY);
                                firstPoint = false;
                            } else {
                                ctx.lineTo(x, interpolatedY);
                            }
                        }
                    } else {
                        if (firstPoint) {
                            ctx.moveTo(x, y);
                            firstPoint = false;
                        } else {
                            ctx.lineTo(x, y);
                        }
                    }
                }
            }

            // Draw line
            if (this.config.enableShadows && isHovered) {
                ctx.shadowColor = color;
                ctx.shadowBlur = 15;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Draw dots at each period
            for (let periodIdx = 0; periodIdx <= this.currentPeriodIndex; periodIdx++) {
                const ranking = this.rankings[periodIdx];
                const item = ranking.find(r => r.entity === entity);

                if (item) {
                    const x = chartLeft + (chartWidth / (periods.length - 1)) * periodIdx;
                    const y = chartTop + ((item.rank - 1) / (topN - 1)) * chartHeight;

                    // Draw dot
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(x, y, this.config.dotRadius + 2, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(x, y, this.config.dotRadius, 0, Math.PI * 2);
                    ctx.fill();

                    // Draw label at end
                    if (periodIdx === this.currentPeriodIndex && this.config.showLabels) {
                        ctx.fillStyle = '#1a1a1a';
                        ctx.font = 'bold 16px "Inter", sans-serif';
                        ctx.textAlign = 'left';
                        ctx.fillText(entity, x + 15, y + 5);
                    }
                }
            }

            ctx.globalAlpha = 1;
        });
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
     * Get color palette
     */
    getColorPalette(paletteName) {
        const palettes = {
            vibrant: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'],
            professional: ['#2E86AB', '#A23B72', '#F18F01', '#C73E1D', '#6A994E', '#BC4B51', '#5E7CE2', '#8B7E74'],
            neon: ['#FF006E', '#FFBE0B', '#8338EC', '#3A86FF', '#FB5607', '#06FFA5', '#FF00FF', '#00FFFF'],
            pastel: ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFDFBA', '#E0BBE4', '#FFDFD3', '#C9E4CA']
        };
        return palettes[paletteName] || palettes.vibrant;
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
