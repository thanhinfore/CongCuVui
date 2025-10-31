// ========================================
// Stream Graph Engine Module - v10.0
// FLOW VISUALIZATION: Beautiful stacked area chart with organic feel
// Perfect for composition analysis and viral video content
// ========================================

export class StreamGraphEngine {
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
            title: config.title || 'Data Flow',
            subtitle: config.subtitle || '',
            topN: config.topN || 10,
            width: config.width || 1920,
            height: config.height || 1080,
            padding: config.padding || { top: 120, right: 100, bottom: 100, left: 100 },
            colors: colors,
            smoothing: 0.3,  // Bezier curve smoothing
            centerBaseline: true,  // Center the stream vertically
            enableShadows: config.enableShadows !== false,
            showLabels: config.showValueLabels !== false,
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

        console.log('🌊 Stream Graph Engine initialized:', this.config.width, 'x', this.config.height);

        // Pre-calculate stacked values
        this.stackedValues = this.calculateStackedValues();
    }

    /**
     * Calculate stacked values for stream layout
     */
    calculateStackedValues() {
        const stacked = [];
        const topN = this.config.topN;

        for (let periodIdx = 0; periodIdx < this.data.periods.length; periodIdx++) {
            const periodValues = this.data.values[periodIdx];

            // Get top N entities for this period
            const ranked = this.data.entities.map((entity, idx) => ({
                entity,
                value: Math.max(0, periodValues[idx]),  // Only positive values
                entityIndex: idx
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, topN);

            // Calculate total
            const total = ranked.reduce((sum, item) => sum + item.value, 0);

            // Calculate stacked positions (centered baseline)
            let cumulative = 0;
            const stackedPeriod = ranked.map(item => {
                const bottom = cumulative;
                cumulative += item.value;
                return {
                    entity: item.entity,
                    entityIndex: item.entityIndex,
                    value: item.value,
                    bottom: bottom,
                    top: cumulative
                };
            });

            stacked.push({
                items: stackedPeriod,
                total: total
            });
        }

        return stacked;
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
     * Draw complete stream graph
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

        // Draw stream layers
        this.drawStreamLayers(chartLeft, chartTop, chartWidth, chartHeight);

        // Draw axes
        this.drawAxes(chartLeft, chartTop, chartWidth, chartHeight);

        // Draw current period indicator
        this.drawCurrentPeriod(chartLeft, chartTop, chartWidth, chartHeight);
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
     * Draw stream layers
     */
    drawStreamLayers(chartLeft, chartTop, chartWidth, chartHeight) {
        const ctx = this.ctx;
        const periods = this.data.periods;

        // Find max total for scaling
        const maxTotal = Math.max(...this.stackedValues.map(sv => sv.total));

        // Track all entities across all periods
        const allEntities = new Set();
        this.stackedValues.forEach(sv => {
            sv.items.forEach(item => allEntities.add(item.entity));
        });

        const entities = Array.from(allEntities);

        // Draw each entity as a stream layer
        entities.forEach((entity, idx) => {
            const color = this.config.colors[idx % this.config.colors.length];

            ctx.fillStyle = color;
            ctx.strokeStyle = this.darkenColor(color, 0.2);
            ctx.lineWidth = 1;

            if (this.config.enableShadows) {
                ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
                ctx.shadowBlur = 5;
                ctx.shadowOffsetY = 2;
            }

            // Build path for this entity's stream
            ctx.beginPath();

            // Top edge (forward)
            let firstPoint = true;
            for (let periodIdx = 0; periodIdx <= this.currentPeriodIndex; periodIdx++) {
                const sv = this.stackedValues[periodIdx];
                const item = sv.items.find(it => it.entity === entity);

                if (item) {
                    const x = chartLeft + (chartWidth / (periods.length - 1)) * periodIdx;
                    const centerY = chartTop + chartHeight / 2;
                    const scale = chartHeight / (maxTotal * 1.2);  // 1.2 for padding

                    // Calculate Y position (centered baseline)
                    const halfTotal = sv.total / 2;
                    const yTop = centerY - (halfTotal - item.top) * scale;

                    if (firstPoint) {
                        ctx.moveTo(x, yTop);
                        firstPoint = false;
                    } else {
                        ctx.lineTo(x, yTop);
                    }
                }
            }

            // Bottom edge (backward)
            for (let periodIdx = this.currentPeriodIndex; periodIdx >= 0; periodIdx--) {
                const sv = this.stackedValues[periodIdx];
                const item = sv.items.find(it => it.entity === entity);

                if (item) {
                    const x = chartLeft + (chartWidth / (periods.length - 1)) * periodIdx;
                    const centerY = chartTop + chartHeight / 2;
                    const scale = chartHeight / (maxTotal * 1.2);

                    const halfTotal = sv.total / 2;
                    const yBottom = centerY - (halfTotal - item.bottom) * scale;

                    ctx.lineTo(x, yBottom);
                }
            }

            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.shadowBlur = 0;

            // Draw label at current period
            if (this.config.showLabels && this.currentPeriodIndex > 0) {
                const sv = this.stackedValues[this.currentPeriodIndex];
                const item = sv.items.find(it => it.entity === entity);

                if (item) {
                    const x = chartLeft + (chartWidth / (periods.length - 1)) * this.currentPeriodIndex;
                    const centerY = chartTop + chartHeight / 2;
                    const scale = chartHeight / (maxTotal * 1.2);
                    const halfTotal = sv.total / 2;
                    const yTop = centerY - (halfTotal - item.top) * scale;
                    const yBottom = centerY - (halfTotal - item.bottom) * scale;
                    const yMid = (yTop + yBottom) / 2;

                    // Only show label if layer is thick enough
                    if (Math.abs(yTop - yBottom) > 25) {
                        ctx.fillStyle = '#fff';
                        ctx.font = 'bold 14px "Inter", sans-serif';
                        ctx.textAlign = 'left';
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                        ctx.shadowBlur = 3;
                        ctx.fillText(entity, x + 10, yMid + 5);
                        ctx.shadowBlur = 0;
                    }
                }
            }
        });
    }

    /**
     * Draw axes
     */
    drawAxes(chartLeft, chartTop, chartWidth, chartHeight) {
        const ctx = this.ctx;
        const periods = this.data.periods;

        // X-axis labels
        ctx.fillStyle = '#666';
        ctx.font = '18px "Inter", sans-serif';
        ctx.textAlign = 'center';

        periods.forEach((period, idx) => {
            if (idx <= this.currentPeriodIndex) {
                const x = chartLeft + (chartWidth / (periods.length - 1)) * idx;
                ctx.fillText(period, x, chartTop + chartHeight + 35);
            }
        });

        // Center line
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(chartLeft, chartTop + chartHeight / 2);
        ctx.lineTo(chartLeft + chartWidth, chartTop + chartHeight / 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    /**
     * Draw current period indicator
     */
    drawCurrentPeriod(chartLeft, chartTop, chartWidth, chartHeight) {
        if (this.currentPeriodIndex === 0) return;

        const ctx = this.ctx;
        const periods = this.data.periods;
        const currentPeriod = periods[this.currentPeriodIndex];

        // Draw period label
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.font = 'bold 32px "Inter", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(currentPeriod, this.config.width - 50, chartTop + 50);
    }

    /**
     * Darken color
     */
    darkenColor(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
        const g = Math.max(0, ((num >> 8) & 0x00FF) - Math.round(255 * amount));
        const b = Math.max(0, (num & 0x0000FF) - Math.round(255 * amount));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }

    /**
     * Destroy engine
     */
    destroy() {
        console.log('🌊 Stream Graph Engine destroyed');
    }

    /**
     * Get canvas element
     */
    getCanvas() {
        return this.canvas;
    }
}
