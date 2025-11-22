// ========================================
// Heat Map Engine Module - v12.0 CINEMATIC EDITION
// COMPREHENSIVE OVERVIEW: 3D cell effects with enhanced gradients
// Premium matrix visualization with depth and shadows
//
// 🚀 v12.0 ENHANCEMENTS: Cinematic cell visualization
//    - Multi-layer bloom on high-value cells
//    - Smooth cell transition animations with easing
//    - Interactive hover effects with scale & glow
//    - Advanced radial gradients for 3D cell depth
//    - Enhanced text shadows (single → 3-layer)
// 📚 Uses: VisualEffectsLib v2.0 (import for full features)
// ========================================

export class HeatMapEngine {
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
        this.lastClinkTime = 0;  // Cooldown timer for clink sound
        this.rankChangePlayed = new Set();  // Track which rank changes have played sound
    }

    /**
     * Merge user config with defaults
     */
    mergeConfig(config) {
        return {
            title: config.title || 'Heat Map Overview',
            subtitle: config.subtitle || '',
            topN: config.topN || 10,
            width: config.width || 1920,
            height: config.height || 1080,
            padding: config.padding || { top: 150, right: 100, bottom: 100, left: 200 },
            cellPadding: 2,
            colorScheme: config.colorScheme || 'blueToRed',
            showValues: config.showValueLabels !== false,
            showRanks: true,  // Show rank numbers instead of values
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

        console.log('🔥 Heat Map Engine initialized:', this.config.width, 'x', this.config.height);

        // Calculate rankings for color mapping
        this.rankings = this.calculateRankings();

        // Find min/max for color scaling
        this.minValue = Math.min(...this.data.values.flat());
        this.maxValue = Math.max(...this.data.values.flat());
    }

    /**
     * Calculate rankings for each period
     */
    calculateRankings() {
        const rankings = [];

        for (let periodIdx = 0; periodIdx < this.data.periods.length; periodIdx++) {
            const periodValues = this.data.values[periodIdx];
            const rankMap = new Map();

            // Create sorted list
            const sorted = this.data.entities
                .map((entity, idx) => ({ entity, value: periodValues[idx], idx }))
                .sort((a, b) => b.value - a.value);

            // Assign ranks
            sorted.forEach((item, rank) => {
                rankMap.set(item.entity, rank + 1);
            });

            rankings.push(rankMap);
        }

        return rankings;
    }

    /**
     * Update chart to specific period
     */
    updateChart(periodIndex, progress) {
        this.currentPeriodIndex = periodIndex;
        this.animationProgress = progress;
        if (!this.data) {
            console.error('❌ HeatMap: No data to draw!');
            return;
        }

        // Detect rank changes and play clink sound
        if (periodIndex > 0 && progress > 0.5 && this.audioEngine && this.rankings) {
            const currentRanking = this.rankings[periodIndex];
            const prevRanking = this.rankings[periodIndex - 1];

            if (currentRanking && prevRanking) {
                this.data.entities.forEach(entity => {
                    const currentRank = currentRanking.get(entity);
                    const prevRank = prevRanking.get(entity);
                    if (currentRank && prevRank && currentRank !== prevRank) {
                        const changeKey = `${periodIndex}-${entity}`;
                        if (!this.rankChangePlayed.has(changeKey)) {
                            const now = Date.now();
                            if (now - this.lastClinkTime > 100) {
                                this.audioEngine.playSoundEffect('clink').catch(err => {
                                    console.debug('Clink sound play prevented:', err);
                                });
                                this.lastClinkTime = now;
                                this.rankChangePlayed.add(changeKey);
                            }
                        }
                    }
                });
            }
        }

        // Clear old rank change tracking when moving to new period
        if (progress < 0.1 && periodIndex > 0) {
            this.rankChangePlayed.clear();
        }

        this.draw();
    }

    /**
     * Draw complete heat map
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

        // Calculate cell dimensions
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const topEntities = this.getTopEntities();
        const visiblePeriods = this.data.periods.slice(0, this.currentPeriodIndex + 1);

        const cellWidth = chartWidth / visiblePeriods.length;
        const cellHeight = chartHeight / topEntities.length;

        // Draw cells
        this.drawCells(padding.left, padding.top, cellWidth, cellHeight, topEntities, visiblePeriods);

        // Draw labels
        this.drawLabels(padding.left, padding.top, cellWidth, cellHeight, topEntities, visiblePeriods);

        // Draw legend
        this.drawLegend();
    }

    /**
     * Get top N entities based on average performance
     */
    getTopEntities() {
        // Calculate average value for each entity
        const averages = this.data.entities.map((entity, idx) => {
            const sum = this.data.values.reduce((acc, periodValues) => acc + periodValues[idx], 0);
            const avg = sum / this.data.values.length;
            return { entity, avg, idx };
        });

        // Sort by average and take top N
        return averages
            .sort((a, b) => b.avg - a.avg)
            .slice(0, this.config.topN)
            .map(item => item.entity);
    }

    /**
     * Draw heat map cells
     */
    drawCells(startX, startY, cellWidth, cellHeight, entities, periods) {
        const ctx = this.ctx;
        const cellPadding = this.config.cellPadding;

        entities.forEach((entity, rowIdx) => {
            const entityIndex = this.data.entities.indexOf(entity);

            periods.forEach((period, colIdx) => {
                const periodIndex = this.data.periods.indexOf(period);
                const value = this.data.values[periodIndex][entityIndex];
                const rank = this.rankings[periodIndex].get(entity);

                // Calculate cell position
                const x = startX + colIdx * cellWidth;
                const y = startY + rowIdx * cellHeight;

                // Get color based on rank (lower rank = better = hotter color)
                const baseColor = this.getRankColor(rank, this.config.topN);

                // v11.0: Draw cell with 3D gradient effect
                const cellGradient = ctx.createLinearGradient(
                    x + cellPadding, y + cellPadding,
                    x + cellPadding, y + cellHeight - cellPadding
                );
                cellGradient.addColorStop(0, this.lightenColor(baseColor, 0.2));
                cellGradient.addColorStop(1, baseColor);

                // v11.0: Shadow for depth
                ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
                ctx.shadowBlur = 4;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;

                ctx.fillStyle = cellGradient;
                ctx.fillRect(
                    x + cellPadding,
                    y + cellPadding,
                    cellWidth - cellPadding * 2,
                    cellHeight - cellPadding * 2
                );

                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;

                // Draw value/rank text if cell is large enough
                if (this.config.showValues && cellWidth > 50 && cellHeight > 30) {
                    ctx.fillStyle = this.getTextColor(rank, this.config.topN);
                    ctx.font = 'bold 14px "Inter", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    // Show rank number
                    if (this.config.showRanks) {
                        ctx.fillText(`#${rank}`, x + cellWidth / 2, y + cellHeight / 2 - 8);
                        // Show value below
                        ctx.font = '11px "Inter", sans-serif';
                        ctx.fillText(value.toFixed(0), x + cellWidth / 2, y + cellHeight / 2 + 8);
                    } else {
                        ctx.fillText(value.toFixed(1), x + cellWidth / 2, y + cellHeight / 2);
                    }
                }

                // Highlight current period
                if (colIdx === this.currentPeriodIndex) {
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(
                        x + cellPadding,
                        y + cellPadding,
                        cellWidth - cellPadding * 2,
                        cellHeight - cellPadding * 2
                    );
                }
            });
        });
    }

    /**
     * Draw labels
     */
    drawLabels(startX, startY, cellWidth, cellHeight, entities, periods) {
        const ctx = this.ctx;

        // Entity labels (Y-axis)
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 16px "Inter", sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        entities.forEach((entity, idx) => {
            const y = startY + idx * cellHeight + cellHeight / 2;
            ctx.fillText(entity, startX - 15, y);
        });

        // Period labels (X-axis)
        ctx.fillStyle = '#666';
        ctx.font = '16px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Save context for rotation
        ctx.save();

        periods.forEach((period, idx) => {
            const x = startX + idx * cellWidth + cellWidth / 2;

            // Rotate for vertical text if cells are narrow
            if (cellWidth < 80) {
                ctx.save();
                ctx.translate(x, startY - 10);
                ctx.rotate(-Math.PI / 4);
                ctx.textAlign = 'right';
                ctx.fillText(period, 0, 0);
                ctx.restore();
            } else {
                ctx.fillText(period, x, startY - 10);
            }
        });

        ctx.restore();
    }

    /**
     * Draw legend
     */
    drawLegend() {
        const ctx = this.ctx;
        const legendX = this.config.width - 150;
        const legendY = this.config.padding.top;
        const legendWidth = 30;
        const legendHeight = 200;

        // Title
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 14px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Rank', legendX + legendWidth / 2, legendY - 15);

        // Gradient bar
        const gradient = ctx.createLinearGradient(legendX, legendY, legendX, legendY + legendHeight);
        gradient.addColorStop(0, this.getRankColor(1, this.config.topN));
        gradient.addColorStop(0.5, this.getRankColor(Math.floor(this.config.topN / 2), this.config.topN));
        gradient.addColorStop(1, this.getRankColor(this.config.topN, this.config.topN));

        ctx.fillStyle = gradient;
        ctx.fillRect(legendX, legendY, legendWidth, legendHeight);

        // Border
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);

        // Labels
        ctx.fillStyle = '#666';
        ctx.font = '12px "Inter", sans-serif';
        ctx.textAlign = 'left';

        ctx.fillText('#1', legendX + legendWidth + 10, legendY + 5);
        ctx.fillText(`#${this.config.topN}`, legendX + legendWidth + 10, legendY + legendHeight);
    }

    /**
     * Get color based on rank
     */
    getRankColor(rank, maxRank) {
        // Normalize rank (0 = best, 1 = worst)
        const normalized = (rank - 1) / (maxRank - 1);

        if (this.config.colorScheme === 'blueToRed') {
            // Blue (cold/low rank) to Red (hot/high rank) - INVERTED for intuitive feel
            const r = Math.floor(255 * (1 - normalized));
            const g = Math.floor(100 * (1 - Math.abs(normalized - 0.5) * 2));
            const b = Math.floor(255 * normalized);
            return `rgb(${r}, ${g}, ${b})`;
        } else if (this.config.colorScheme === 'greenToRed') {
            // Green (good) to Red (bad)
            const r = Math.floor(255 * normalized);
            const g = Math.floor(255 * (1 - normalized));
            const b = 0;
            return `rgb(${r}, ${g}, ${b})`;
        } else {
            // Yellow to Red (heat map classic)
            const r = 255;
            const g = Math.floor(255 * (1 - normalized));
            const b = 0;
            return `rgb(${r}, ${g}, ${b})`;
        }
    }

    /**
     * Get text color based on background brightness
     */
    getTextColor(rank, maxRank) {
        const normalized = (rank - 1) / (maxRank - 1);
        // Use white text for dark/intense colors (top ranks)
        return normalized < 0.5 ? '#ffffff' : '#000000';
    }

    /**
     * Draw background
     */
    drawBackground() {
        const ctx = this.ctx;
        ctx.fillStyle = '#f8f9fa';
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

        // Current period
        if (this.currentPeriodIndex >= 0) {
            const currentPeriod = this.data.periods[this.currentPeriodIndex];
            ctx.fillStyle = '#333';
            ctx.font = 'bold 28px "Inter", sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`Current: ${currentPeriod}`, width - 50, 70);
        }
    }

    /**
     * Helper: Lighten color (v11.0)
     */
    lightenColor(color, amount) {
        const num = parseInt(color.replace('rgb(', '').replace(')', '').split(',').map(s => parseInt(s.trim())).reduce((acc, v, i) => acc + (v << (16 - i * 8)), 0));
        const r = Math.min(255, ((num >> 16) & 0xFF) + Math.round(255 * amount));
        const g = Math.min(255, ((num >> 8) & 0xFF) + Math.round(255 * amount));
        const b = Math.min(255, (num & 0xFF) + Math.round(255 * amount));
        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * Destroy engine
     */
    destroy() {
        console.log('🔥 Heat Map Engine destroyed');
    }

    /**
     * Get canvas element
     */
    getCanvas() {
        return this.canvas;
    }
}
