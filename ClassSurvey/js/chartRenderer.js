/**
 * ChartRenderer
 * Renders survey data using Chart.js
 */
class ChartRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.chart = null;
        this.currentChartType = 'bar';
        this.currentColorScheme = 'vibrant';

        // Color schemes
        this.colorSchemes = {
            vibrant: [
                '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
                '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
                '#F8B739', '#52B788', '#EF476F', '#06FFA5'
            ],
            pastel: [
                '#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA',
                '#FFD9BA', '#E0BBE4', '#FFDFD3', '#C9E4DE',
                '#F7D8BA', '#D4F1F4', '#F5E6E8', '#D5F4E6'
            ],
            professional: [
                '#2C3E50', '#3498DB', '#E74C3C', '#F39C12',
                '#27AE60', '#8E44AD', '#16A085', '#D35400',
                '#C0392B', '#2980B9', '#7F8C8D', '#1ABC9C'
            ],
            ocean: [
                '#006494', '#0582CA', '#00A6FB', '#13293D',
                '#0090C1', '#247BA0', '#1E6091', '#094074',
                '#4FB3D4', '#508AA8', '#80CED7', '#63C2C9'
            ],
            sunset: [
                '#FF6F59', '#FF9671', '#FFC75F', '#F9F871',
                '#FF6B9D', '#C06C84', '#F67280', '#F8B195',
                '#FFB88C', '#DE6FA1', '#FC8D62', '#E15759'
            ],
            neon: [
                '#FF006E', '#FB5607', '#FFBE0B', '#8338EC',
                '#3A86FF', '#06FFA5', '#FF006E', '#00F5FF',
                '#FFFD77', '#FF0080', '#00FF9F', '#D600FF'
            ]
        };
    }

    /**
     * Get colors for current color scheme
     * @param {number} count - Number of colors needed
     * @returns {Array} - Array of color strings
     */
    getColors(count) {
        const scheme = this.colorSchemes[this.currentColorScheme] || this.colorSchemes.vibrant;
        const colors = [];

        for (let i = 0; i < count; i++) {
            colors.push(scheme[i % scheme.length]);
        }

        return colors;
    }

    /**
     * Set color scheme
     * @param {string} schemeName - Name of color scheme
     */
    setColorScheme(schemeName) {
        if (this.colorSchemes[schemeName]) {
            this.currentColorScheme = schemeName;
        }
    }

    /**
     * Destroy existing chart
     */
    destroyChart() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    /**
     * Render a chart for a question
     * @param {Object} question - Question data from SurveyManager
     * @param {string} chartType - Type of chart (bar, pie, line, etc.)
     */
    render(question, chartType = 'bar') {
        if (!this.ctx) {
            console.error('Canvas context not available');
            return;
        }

        this.currentChartType = chartType;
        this.destroyChart();

        // Prepare data
        const labels = question.options.map(opt => this.truncateLabel(opt.option, 50));
        const data = question.options.map(opt => opt.count);
        const colors = this.getColors(labels.length);

        // Chart configuration
        const config = {
            type: this.getChartJsType(chartType),
            data: {
                labels: labels,
                datasets: [{
                    label: 'Số lượng phản hồi',
                    data: data,
                    backgroundColor: chartType === 'line' ? 'rgba(99, 102, 241, 0.2)' : colors,
                    borderColor: chartType === 'line' ? '#6366f1' : colors.map(c => this.darkenColor(c)),
                    borderWidth: 2,
                    fill: chartType === 'line',
                    tension: 0.4
                }]
            },
            options: this.getChartOptions(chartType, question)
        };

        // Create chart
        try {
            this.chart = new Chart(this.ctx, config);
        } catch (error) {
            console.error('Error creating chart:', error);
        }
    }

    /**
     * Get Chart.js type from our chart type
     * @param {string} chartType - Our chart type
     * @returns {string} - Chart.js type
     */
    getChartJsType(chartType) {
        const typeMap = {
            'horizontalBar': 'bar',
            'bar': 'bar',
            'pie': 'pie',
            'doughnut': 'doughnut',
            'line': 'line',
            'radar': 'radar'
        };

        return typeMap[chartType] || 'bar';
    }

    /**
     * Get chart options based on chart type
     * @param {string} chartType - Type of chart
     * @param {Object} question - Question data
     * @returns {Object} - Chart.js options
     */
    getChartOptions(chartType, question) {
        const baseOptions = {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: ['pie', 'doughnut', 'radar'].includes(chartType),
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12,
                            family: 'Inter, sans-serif'
                        }
                    }
                },
                title: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        family: 'Inter, sans-serif'
                    },
                    bodyFont: {
                        size: 13,
                        family: 'Inter, sans-serif'
                    },
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
                            const total = question.totalResponses;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        };

        // Type-specific options
        if (chartType === 'horizontalBar') {
            baseOptions.indexAxis = 'y';
            baseOptions.scales = {
                x: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        font: {
                            family: 'Inter, sans-serif'
                        }
                    },
                    grid: {
                        display: true
                    }
                },
                y: {
                    ticks: {
                        font: {
                            family: 'Inter, sans-serif'
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            };
        } else if (chartType === 'bar') {
            baseOptions.scales = {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        font: {
                            family: 'Inter, sans-serif'
                        }
                    },
                    grid: {
                        display: true
                    }
                },
                x: {
                    ticks: {
                        font: {
                            family: 'Inter, sans-serif'
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            };
        } else if (chartType === 'line') {
            baseOptions.scales = {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        font: {
                            family: 'Inter, sans-serif'
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            family: 'Inter, sans-serif'
                        }
                    }
                }
            };
        } else if (chartType === 'radar') {
            baseOptions.scales = {
                r: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        font: {
                            family: 'Inter, sans-serif'
                        }
                    }
                }
            };
        }

        return baseOptions;
    }

    /**
     * Truncate label to maximum length
     * @param {string} label - Label text
     * @param {number} maxLength - Maximum length
     * @returns {string} - Truncated label
     */
    truncateLabel(label, maxLength) {
        if (!label) return '';
        if (label.length <= maxLength) return label;
        return label.substring(0, maxLength - 3) + '...';
    }

    /**
     * Darken a color for borders
     * @param {string} color - Hex color
     * @returns {string} - Darkened color
     */
    darkenColor(color) {
        // Simple darkening by reducing each RGB component
        if (!color.startsWith('#')) return color;

        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        const darken = (val) => Math.max(0, Math.floor(val * 0.8));

        return `#${darken(r).toString(16).padStart(2, '0')}${darken(g).toString(16).padStart(2, '0')}${darken(b).toString(16).padStart(2, '0')}`;
    }

    /**
     * Update chart with new data
     * @param {Object} question - Question data
     */
    update(question) {
        if (!this.chart) {
            this.render(question, this.currentChartType);
            return;
        }

        const labels = question.options.map(opt => this.truncateLabel(opt.option, 50));
        const data = question.options.map(opt => opt.count);
        const colors = this.getColors(labels.length);

        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = data;
        this.chart.data.datasets[0].backgroundColor = colors;
        this.chart.data.datasets[0].borderColor = colors.map(c => this.darkenColor(c));

        this.chart.update();
    }

    /**
     * Change chart type
     * @param {string} newType - New chart type
     * @param {Object} question - Current question data
     */
    changeType(newType, question) {
        this.render(question, newType);
    }

    /**
     * Get available chart types
     * @returns {Array} - Array of chart type objects
     */
    getAvailableTypes() {
        return [
            { value: 'bar', label: 'Cột dọc (Bar)' },
            { value: 'horizontalBar', label: 'Cột ngang (Horizontal)' },
            { value: 'pie', label: 'Tròn (Pie)' },
            { value: 'doughnut', label: 'Donut (Doughnut)' },
            { value: 'line', label: 'Đường (Line)' },
            { value: 'radar', label: 'Radar' }
        ];
    }

    /**
     * Get available color schemes
     * @returns {Array} - Array of color scheme names
     */
    getAvailableColorSchemes() {
        return Object.keys(this.colorSchemes);
    }
}
