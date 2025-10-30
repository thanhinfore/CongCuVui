// ========================================
// Chart Engine Module - PREMIUM EDITION v2.0
// Enhanced graphics with gradients, shadows, stats panel, and value labels
// ========================================

export class ChartEngine {
    constructor(canvasId, config) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with id '${canvasId}' not found`);
        }

        this.ctx = this.canvas.getContext('2d', { alpha: false });
        // Enable high-quality rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        this.config = this.mergeConfig(config);
        this.chart = null;
        this.data = null;
        this.previousRanks = new Map(); // Track rank changes
        this.previousValues = new Map(); // Track value changes for growth rate
    }

    /**
     * Merge user config with defaults
     */
    mergeConfig(config) {
        return {
            title: config.title || 'Data Evolution',
            subtitle: config.subtitle || '',
            topN: config.topN || 10,
            fps: config.fps || 30,
            periodLength: config.periodLength || 1000,
            palette: config.palette || 'vibrant',
            width: config.width || 1920,
            height: config.height || 1080,
            showStatsPanel: config.showStatsPanel !== false,
            showValueLabels: config.showValueLabels !== false,
            showRankIndicators: config.showRankIndicators !== false,
            showGrowthRate: config.showGrowthRate !== false,
            barStyle: config.barStyle || 'gradient', // 'solid' or 'gradient'
            enableShadows: config.enableShadows !== false,
            ...config
        };
    }

    /**
     * Initialize chart with data
     */
    initialize(data) {
        this.data = data;

        // Set canvas size with higher DPI for better quality
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.config.width;
        this.canvas.height = this.config.height;

        // Scale for retina displays
        this.canvas.style.width = this.config.width + 'px';
        this.canvas.style.height = this.config.height + 'px';

        // Initialize rank tracking
        this.initializeRankTracking();

        // Create initial chart
        this.createChart();
    }

    /**
     * Initialize rank tracking for indicators
     */
    initializeRankTracking() {
        if (!this.data) return;

        // Get initial ranks from first period
        const firstPeriod = this.data.values[0];
        const pairs = this.data.entities.map((entity, i) => ({
            entity,
            value: firstPeriod[i]
        }));
        pairs.sort((a, b) => b.value - a.value);

        pairs.forEach((pair, rank) => {
            this.previousRanks.set(pair.entity, rank);
            this.previousValues.set(pair.entity, pair.value);
        });
    }

    /**
     * Create Chart.js instance with premium styling
     */
    createChart() {
        const colors = this.getColorPalette(this.config.palette);

        // Destroy existing chart if any
        if (this.chart) {
            this.chart.destroy();
        }

        // Import custom font
        this.loadCustomFont();

        this.chart = new Chart(this.ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Value',
                    data: [],
                    backgroundColor: this.config.barStyle === 'gradient' ?
                        colors.map(c => this.createGradient(c)) : colors,
                    borderColor: colors.map(c => this.darkenColor(c, 0.3)),
                    borderWidth: 3,
                    borderRadius: 12,
                    borderSkipped: false,
                    barPercentage: 0.85,
                    categoryPercentage: 0.9
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: false,
                maintainAspectRatio: false,
                animation: false,
                layout: {
                    padding: {
                        top: this.config.showStatsPanel ? 180 : 120,
                        right: 120,
                        bottom: 120,
                        left: 80
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.06)',
                            lineWidth: 2,
                            drawBorder: false
                        },
                        ticks: {
                            font: {
                                size: 20,
                                weight: '600',
                                family: "'Inter', -apple-system, sans-serif"
                            },
                            color: '#444',
                            padding: 10,
                            callback: function(value) {
                                return value >= 1000 ? (value/1000).toFixed(1) + 'K' : value;
                            }
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 26,
                                weight: '700',
                                family: "'Inter', -apple-system, sans-serif"
                            },
                            color: '#222',
                            padding: 15
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: this.config.title,
                        font: {
                            size: 56,
                            weight: '800',
                            family: "'Inter', -apple-system, sans-serif"
                        },
                        color: '#1a1a1a',
                        padding: {
                            top: 20,
                            bottom: this.config.subtitle ? 10 : 30
                        }
                    },
                    subtitle: {
                        display: !!this.config.subtitle,
                        text: this.config.subtitle,
                        font: {
                            size: 28,
                            weight: '500',
                            family: "'Inter', -apple-system, sans-serif"
                        },
                        color: '#666',
                        padding: {
                            bottom: 20
                        }
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                }
            },
            plugins: [{
                id: 'customElements',
                beforeDraw: (chart) => {
                    this.drawBackgroundGradient(chart);
                },
                afterDraw: (chart) => {
                    this.drawCustomElements(chart);
                }
            }]
        });
    }

    /**
     * Load custom Google Font
     */
    loadCustomFont() {
        if (!document.getElementById('google-fonts-inter')) {
            const link = document.createElement('link');
            link.id = 'google-fonts-inter';
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
            document.head.appendChild(link);
        }
    }

    /**
     * Create gradient for bar
     */
    createGradient(color) {
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, this.lightenColor(color, 0.3));
        return gradient;
    }

    /**
     * Draw background gradient
     */
    drawBackgroundGradient(chart) {
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;

        // Subtle gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, chart.height);
        gradient.addColorStop(0, '#f8f9fa');
        gradient.addColorStop(1, '#e9ecef');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, chart.width, chart.height);
    }

    /**
     * Update chart with data for specific period
     */
    updateChart(periodIndex, progress = 1) {
        if (!this.data || !this.chart) return;

        const currentPeriod = this.data.periods[periodIndex];
        const currentValues = this.data.values[periodIndex];

        // Interpolate with next period if available
        let displayValues = currentValues;
        if (progress < 1 && periodIndex < this.data.values.length - 1) {
            const nextValues = this.data.values[periodIndex + 1];
            displayValues = currentValues.map((val, i) => {
                return val + (nextValues[i] - val) * this.easeInOutCubic(progress);
            });
        }

        // Create pairs of [entity, value, index]
        const pairs = this.data.entities.map((entity, i) => ({
            entity,
            value: displayValues[i],
            originalIndex: i
        }));

        // Sort by value (descending)
        pairs.sort((a, b) => b.value - a.value);

        // Take top N
        const topN = pairs.slice(0, this.config.topN);

        // Calculate current ranks
        const currentRanks = new Map();
        topN.forEach((pair, rank) => {
            currentRanks.set(pair.entity, rank);
        });

        // Update chart data
        this.chart.data.labels = topN.map(p => p.entity);
        this.chart.data.datasets[0].data = topN.map(p => p.value);

        // Update colors with gradients
        const colors = this.getColorPalette(this.config.palette);
        if (this.config.barStyle === 'gradient') {
            this.chart.data.datasets[0].backgroundColor = topN.map(p =>
                this.createGradient(colors[p.originalIndex % colors.length])
            );
        } else {
            this.chart.data.datasets[0].backgroundColor = topN.map(p =>
                colors[p.originalIndex % colors.length]
            );
        }

        this.chart.data.datasets[0].borderColor = topN.map(p =>
            this.darkenColor(colors[p.originalIndex % colors.length], 0.3)
        );

        // Store current data for custom drawing
        this.currentPeriod = currentPeriod;
        this.currentTopN = topN;
        this.currentRanks = currentRanks;
        this.currentStats = this.calculateStats(topN);

        // Update chart without animation
        this.chart.update('none');
    }

    /**
     * Calculate statistics
     */
    calculateStats(topN) {
        if (!topN || topN.length === 0) return null;

        const values = topN.map(p => p.value);
        const total = values.reduce((sum, val) => sum + val, 0);
        const leader = values[0];
        const gap = values.length > 1 ? values[0] - values[1] : 0;
        const average = total / values.length;

        return { total, leader, gap, average };
    }

    /**
     * Draw all custom elements
     */
    drawCustomElements(chart) {
        const ctx = chart.ctx;

        // Draw value labels on bars
        if (this.config.showValueLabels) {
            this.drawValueLabels(chart);
        }

        // Draw rank change indicators
        if (this.config.showRankIndicators && this.currentTopN) {
            this.drawRankIndicators(chart);
        }

        // Draw growth rate
        if (this.config.showGrowthRate && this.currentTopN) {
            this.drawGrowthRate(chart);
        }

        // Draw stats panel
        if (this.config.showStatsPanel && this.currentStats) {
            this.drawStatsPanel(chart);
        }

        // Draw period label
        this.drawPeriodLabel(chart);

        // Add drop shadow to bars
        if (this.config.enableShadows) {
            ctx.shadowBlur = 0; // Reset after drawing
        }
    }

    /**
     * Draw value labels on bars
     */
    drawValueLabels(chart) {
        const ctx = chart.ctx;
        const meta = chart.getDatasetMeta(0);

        ctx.save();
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#1a1a1a';

        meta.data.forEach((bar, index) => {
            const value = this.currentTopN[index].value;
            const formattedValue = this.formatNumber(value);

            const x = bar.x + 15;
            const y = bar.y;

            // Draw white background for better readability
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            const textWidth = ctx.measureText(formattedValue).width;
            ctx.fillRect(x - 5, y - 15, textWidth + 10, 30);

            // Draw text
            ctx.fillStyle = '#1a1a1a';
            ctx.fillText(formattedValue, x, y);
        });

        ctx.restore();
    }

    /**
     * Draw rank change indicators
     */
    drawRankIndicators(chart) {
        const ctx = chart.ctx;
        const meta = chart.getDatasetMeta(0);
        const chartArea = chart.chartArea;

        ctx.save();
        ctx.font = 'bold 28px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        meta.data.forEach((bar, index) => {
            const entity = this.currentTopN[index].entity;
            const currentRank = index;
            const previousRank = this.previousRanks.get(entity);

            if (previousRank === undefined) return;

            const x = chartArea.left - 30;
            const y = bar.y;

            let indicator = '';
            let color = '#666';

            if (previousRank > currentRank) {
                indicator = '↑';
                color = '#4CAF50'; // Green for up
            } else if (previousRank < currentRank) {
                indicator = '↓';
                color = '#f44336'; // Red for down
            } else {
                indicator = '→';
                color = '#999'; // Gray for same
            }

            ctx.fillStyle = color;
            ctx.fillText(indicator, x, y);
        });

        ctx.restore();

        // Update previous ranks
        this.currentTopN.forEach((pair, rank) => {
            this.previousRanks.set(pair.entity, rank);
        });
    }

    /**
     * Draw growth rate
     */
    drawGrowthRate(chart) {
        const ctx = chart.ctx;
        const meta = chart.getDatasetMeta(0);
        const chartArea = chart.chartArea;

        ctx.save();
        ctx.font = '600 20px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        meta.data.forEach((bar, index) => {
            const entity = this.currentTopN[index].entity;
            const currentValue = this.currentTopN[index].value;
            const previousValue = this.previousValues.get(entity);

            if (!previousValue || previousValue === 0) {
                this.previousValues.set(entity, currentValue);
                return;
            }

            const growthRate = ((currentValue - previousValue) / previousValue) * 100;

            if (Math.abs(growthRate) < 0.1) return; // Skip if too small

            const x = chartArea.right + 100;
            const y = bar.y;

            const sign = growthRate > 0 ? '+' : '';
            const text = `${sign}${growthRate.toFixed(1)}%`;

            ctx.fillStyle = growthRate > 0 ? '#4CAF50' : '#f44336';
            ctx.fillText(text, x, y);
        });

        ctx.restore();

        // Update previous values
        this.currentTopN.forEach((pair) => {
            this.previousValues.set(pair.entity, pair.value);
        });
    }

    /**
     * Draw stats panel (Total, Leader, Gap, Average)
     */
    drawStatsPanel(chart) {
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;

        const panelX = chartArea.left;
        const panelY = 80;
        const panelWidth = chartArea.right - chartArea.left;
        const panelHeight = 80;

        ctx.save();

        // Draw panel background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 5;
        this.roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 12, true, false);
        ctx.shadowBlur = 0;

        // Draw border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 2;
        this.roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 12, false, true);

        // Draw stats
        const stats = [
            { label: 'TOTAL', value: this.formatNumber(this.currentStats.total), color: '#2196F3' },
            { label: 'LEADER', value: this.formatNumber(this.currentStats.leader), color: '#4CAF50' },
            { label: 'GAP', value: this.formatNumber(this.currentStats.gap), color: '#FF9800' },
            { label: 'AVERAGE', value: this.formatNumber(this.currentStats.average), color: '#9C27B0' }
        ];

        const itemWidth = panelWidth / stats.length;

        stats.forEach((stat, index) => {
            const x = panelX + itemWidth * index + itemWidth / 2;
            const y = panelY + panelHeight / 2;

            // Draw label
            ctx.font = '600 16px Inter, sans-serif';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(stat.label, x, y - 5);

            // Draw value
            ctx.font = 'bold 28px Inter, sans-serif';
            ctx.fillStyle = stat.color;
            ctx.textBaseline = 'top';
            ctx.fillText(stat.value, x, y + 5);
        });

        ctx.restore();
    }

    /**
     * Draw period label at bottom
     */
    drawPeriodLabel(chart) {
        if (!this.currentPeriod) return;

        const ctx = chart.ctx;
        const chartArea = chart.chartArea;

        ctx.save();
        ctx.font = '900 80px Inter, sans-serif';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const x = (chartArea.left + chartArea.right) / 2;
        const y = chartArea.bottom + 60;

        ctx.fillText(this.currentPeriod, x, y);
        ctx.restore();
    }

    /**
     * Ease in-out cubic function for smooth interpolation
     */
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /**
     * Format number for display
     */
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        } else if (num >= 100) {
            return num.toFixed(0);
        } else if (num >= 10) {
            return num.toFixed(1);
        } else {
            return num.toFixed(2);
        }
    }

    /**
     * Draw rounded rectangle
     */
    roundRect(ctx, x, y, width, height, radius, fill, stroke) {
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
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
    }

    /**
     * Get color palette
     */
    getColorPalette(paletteName) {
        const palettes = {
            vibrant: [
                '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
                '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
                '#FF8B94', '#A8E6CF', '#FFD3B6', '#FFAAA5', '#B4A7D6'
            ],
            professional: [
                '#2E4057', '#048A81', '#54C6EB', '#8FC93A', '#E4B363',
                '#E8871E', '#DA3E52', '#6C5B7B', '#355C7D', '#C06C84',
                '#1A535C', '#4ECDC4', '#F7FFF7', '#FFE66D', '#FF6B6B'
            ],
            neon: [
                '#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF',
                '#06FFA5', '#FF073A', '#39FF14', '#FFFF00', '#FF10F0',
                '#00F5FF', '#FF1493', '#7FFF00', '#FF4500', '#9400D3'
            ],
            gold: [
                '#FFD700', '#FFA500', '#FF8C00', '#FF7F50', '#FFB6C1',
                '#F0E68C', '#DAA520', '#B8860B', '#CD853F', '#DEB887',
                '#FFDF00', '#FFBF00', '#FFB347', '#FFA07A', '#FF8C69'
            ],
            ocean: [
                '#006994', '#0582CA', '#00A6FB', '#51C4D3', '#7DD3C0',
                '#A6F6FF', '#126E82', '#1A8FE3', '#4FC3F7', '#81D4FA',
                '#0077BE', '#00B4D8', '#90E0EF', '#CAF0F8', '#48CAE4'
            ],
            sunset: [
                '#FF6B35', '#F7931E', '#FDC830', '#F37335', '#C9485B',
                '#E84A5F', '#FF847C', '#FECEA8', '#F9A825', '#FF6F00',
                '#FF5722', '#FF9800', '#FFC107', '#FFEB3B', '#FF7043'
            ],
            pastel: [
                '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
                '#E0BBE4', '#FFDFD3', '#C7CEEA', '#B5EAD7', '#F8B195',
                '#FFDAC1', '#FF9AA2', '#FFB7B2', '#FFDAC1', '#E2F0CB'
            ]
        };

        return palettes[paletteName] || palettes.vibrant;
    }

    /**
     * Lighten a hex color
     */
    lightenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        const newR = Math.min(255, Math.floor(r + (255 - r) * amount));
        const newG = Math.min(255, Math.floor(g + (255 - g) * amount));
        const newB = Math.min(255, Math.floor(b + (255 - b) * amount));

        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    /**
     * Darken a hex color
     */
    darkenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        const newR = Math.floor(r * (1 - amount));
        const newG = Math.floor(g * (1 - amount));
        const newB = Math.floor(b * (1 - amount));

        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    /**
     * Get canvas element for recording
     */
    getCanvas() {
        return this.canvas;
    }

    /**
     * Destroy chart instance
     */
    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }
}
