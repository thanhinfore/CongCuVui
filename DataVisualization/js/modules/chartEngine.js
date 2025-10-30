// ========================================
// Chart Engine Module
// Handles Chart.js integration and bar chart racing visualization
// ========================================

export class ChartEngine {
    constructor(canvasId, config) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with id '${canvasId}' not found`);
        }

        this.ctx = this.canvas.getContext('2d');
        this.config = this.mergeConfig(config);
        this.chart = null;
        this.data = null;
    }

    /**
     * Merge user config with defaults
     * @param {Object} config - User configuration
     * @returns {Object} Merged configuration
     */
    mergeConfig(config) {
        return {
            title: config.title || 'Data Evolution',
            topN: config.topN || 10,
            fps: config.fps || 30,
            periodLength: config.periodLength || 1000,
            palette: config.palette || 'vibrant',
            width: config.width || 1920,
            height: config.height || 1080,
            ...config
        };
    }

    /**
     * Initialize chart with data
     * @param {Object} data - Normalized data from DataHandler
     */
    initialize(data) {
        this.data = data;

        // Set canvas size
        this.canvas.width = this.config.width;
        this.canvas.height = this.config.height;

        // Create initial chart
        this.createChart();
    }

    /**
     * Create Chart.js instance
     */
    createChart() {
        const colors = this.getColorPalette(this.config.palette);

        // Destroy existing chart if any
        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(this.ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Value',
                    data: [],
                    backgroundColor: colors,
                    borderColor: colors.map(c => this.darkenColor(c, 0.2)),
                    borderWidth: 2,
                    borderRadius: 8,
                    barPercentage: 0.9
                }]
            },
            options: {
                indexAxis: 'y', // Horizontal bars
                responsive: false,
                maintainAspectRatio: false,
                animation: false, // We control animation with GSAP
                layout: {
                    padding: {
                        top: 80,
                        right: 50,
                        bottom: 80,
                        left: 50
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: {
                                size: 18,
                                weight: 'bold'
                            }
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 22,
                                weight: 'bold'
                            }
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: this.config.title,
                        font: {
                            size: 42,
                            weight: 'bold'
                        },
                        padding: {
                            top: 10,
                            bottom: 30
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
                id: 'customText',
                afterDraw: (chart) => {
                    this.drawCustomElements(chart);
                }
            }]
        });
    }

    /**
     * Update chart with data for specific period
     * @param {Number} periodIndex - Index of the period to display
     * @param {Number} progress - Progress within period (0-1) for smooth interpolation
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
                return val + (nextValues[i] - val) * progress;
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

        // Update chart data
        this.chart.data.labels = topN.map(p => p.entity);
        this.chart.data.datasets[0].data = topN.map(p => p.value);

        // Update colors to match original indices
        const colors = this.getColorPalette(this.config.palette);
        this.chart.data.datasets[0].backgroundColor = topN.map(p => colors[p.originalIndex % colors.length]);
        this.chart.data.datasets[0].borderColor = topN.map(p =>
            this.darkenColor(colors[p.originalIndex % colors.length], 0.2)
        );

        // Store current period for custom drawing
        this.currentPeriod = currentPeriod;

        // Update chart without animation
        this.chart.update('none');
    }

    /**
     * Draw custom elements (period label, etc.)
     * @param {Chart} chart - Chart.js instance
     */
    drawCustomElements(chart) {
        if (!this.currentPeriod) return;

        const ctx = chart.ctx;
        const chartArea = chart.chartArea;

        // Draw period label at bottom
        ctx.save();
        ctx.font = 'bold 64px sans-serif';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const x = (chartArea.left + chartArea.right) / 2;
        const y = chartArea.bottom + 50;

        ctx.fillText(this.currentPeriod, x, y);
        ctx.restore();
    }

    /**
     * Get color palette
     * @param {String} paletteName - Name of the palette
     * @returns {Array} Array of color strings
     */
    getColorPalette(paletteName) {
        const palettes = {
            vibrant: [
                '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
                '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
            ],
            professional: [
                '#2E4057', '#048A81', '#54C6EB', '#8FC93A', '#E4B363',
                '#E8871E', '#DA3E52', '#6C5B7B', '#355C7D', '#C06C84'
            ],
            neon: [
                '#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF',
                '#06FFA5', '#FF073A', '#39FF14', '#FFFF00', '#FF10F0'
            ],
            gold: [
                '#FFD700', '#FFA500', '#FF8C00', '#FF7F50', '#FFB6C1',
                '#F0E68C', '#DAA520', '#B8860B', '#CD853F', '#DEB887'
            ],
            ocean: [
                '#006994', '#0582CA', '#00A6FB', '#51C4D3', '#7DD3C0',
                '#A6F6FF', '#126E82', '#1A8FE3', '#4FC3F7', '#81D4FA'
            ],
            sunset: [
                '#FF6B35', '#F7931E', '#FDC830', '#F37335', '#C9485B',
                '#E84A5F', '#FF847C', '#FECEA8', '#F9A825', '#FF6F00'
            ],
            pastel: [
                '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
                '#E0BBE4', '#FFDFD3', '#C7CEEA', '#B5EAD7', '#F8B195'
            ]
        };

        return palettes[paletteName] || palettes.vibrant;
    }

    /**
     * Darken a hex color
     * @param {String} color - Hex color string
     * @param {Number} amount - Amount to darken (0-1)
     * @returns {String} Darkened hex color
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
     * @returns {HTMLCanvasElement} Canvas element
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
