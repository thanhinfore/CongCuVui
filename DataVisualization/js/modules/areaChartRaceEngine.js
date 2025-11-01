// ========================================
// Area Chart Race Engine - STACKED AREA RACING VISUALIZATION v1.0
// Smooth stacked area chart showing composition and racing dynamics
// ========================================

export class AreaChartRaceEngine {
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
        this.historicalData = [];
        this.highlightEntity = null;
        this.waveOffset = 0;
    }

    mergeConfig(config) {
        return {
            title: config.title || 'Area Chart Race',
            subtitle: config.subtitle || '',
            topN: config.topN || 8,
            fps: config.fps || 60,
            periodLength: config.periodLength || 1000,
            palette: config.palette || 'vibrant',
            width: config.width || 1920,
            height: config.height || 1080,
            showLabels: config.showLabels !== false,
            showLegend: config.showLegend !== false,
            enableShadows: config.enableShadows !== false,
            enableGlow: config.enableGlow !== false,
            animatedBackground: config.animatedBackground !== false,
            smoothCurves: config.smoothCurves !== false,
            stackingMode: config.stackingMode || 'normal', // 'normal' or 'percentage'
            historyLength: config.historyLength || 20, // Number of periods to show
            padding: config.padding || { top: 120, right: 300, bottom: 100, left: 100 },
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

        console.log('Area Chart Race initialized:', {
            periods: data.periods.length,
            entities: data.entities.length,
            chartArea: this.chartArea
        });
    }

    updateChart(periodIndex, progress) {
        if (!this.data || periodIndex >= this.data.periods.length) return;

        const ctx = this.ctx;
        const periodName = this.data.periods[periodIndex];

        // Clear canvas with gradient background
        if (this.config.animatedBackground) {
            this.drawAnimatedBackground();
        } else {
            ctx.fillStyle = '#0a0e27';
            ctx.fillRect(0, 0, this.config.width, this.config.height);
        }

        // Get top N entities
        const currentData = this.getTopNData(periodIndex);
        const nextData = this.getTopNData(Math.min(periodIndex + 1, this.data.periods.length - 1));

        // Interpolate values
        const interpolatedData = this.interpolateData(currentData, nextData, progress);

        // Update historical data
        if (progress > 0.9) {
            this.updateHistoricalData(periodIndex, interpolatedData);
        }

        // Draw chart axes and grid
        this.drawAxesAndGrid();

        // Draw stacked areas
        this.drawStackedAreas(interpolatedData);

        // Draw legend
        if (this.config.showLegend) {
            this.drawLegend(interpolatedData);
        }

        // Draw title and period
        this.drawTitleAndPeriod(periodName);

        // Update wave animation
        this.waveOffset += 0.02;
    }

    drawAnimatedBackground() {
        const ctx = this.ctx;
        const gradient = ctx.createLinearGradient(0, 0, this.config.width, this.config.height);

        const hue = (Date.now() / 50) % 360;
        gradient.addColorStop(0, `hsl(${hue}, 50%, 10%)`);
        gradient.addColorStop(0.5, '#0a0e27');
        gradient.addColorStop(1, `hsl(${(hue + 90) % 360}, 50%, 10%)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.config.width, this.config.height);
    }

    getTopNData(periodIndex) {
        const periodValues = this.data.values[periodIndex];
        const entries = this.data.entities.map((entity, idx) => ({
            entity,
            value: parseFloat(periodValues[idx]) || 0
        }))
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
                value: current.value + (next.value - current.value) * easeProgress
            });
        }

        return result;
    }

    updateHistoricalData(periodIndex, data) {
        // Add current period data to history
        if (this.historicalData.length === 0 ||
            this.historicalData[this.historicalData.length - 1].periodIndex !== periodIndex) {
            this.historicalData.push({
                periodIndex: periodIndex,
                data: JSON.parse(JSON.stringify(data))
            });

            // Keep only recent history
            if (this.historicalData.length > this.config.historyLength) {
                this.historicalData.shift();
            }
        }
    }

    drawAxesAndGrid() {
        const ctx = this.ctx;
        const area = this.chartArea;

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        // Horizontal grid lines
        const gridLines = 5;
        for (let i = 0; i <= gridLines; i++) {
            const y = area.y + (area.height / gridLines) * i;
            ctx.beginPath();
            ctx.moveTo(area.x, y);
            ctx.lineTo(area.x + area.width, y);
            ctx.stroke();
        }

        // Vertical grid lines (time markers)
        if (this.historicalData.length > 1) {
            const timeSteps = Math.min(10, this.historicalData.length);
            for (let i = 0; i < timeSteps; i++) {
                const x = area.x + (area.width / (timeSteps - 1)) * i;
                ctx.beginPath();
                ctx.moveTo(x, area.y);
                ctx.lineTo(x, area.y + area.height);
                ctx.stroke();
            }
        }

        // Draw axes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(area.x, area.y);
        ctx.lineTo(area.x, area.y + area.height);
        ctx.lineTo(area.x + area.width, area.y + area.height);
        ctx.stroke();

        ctx.restore();
    }

    drawStackedAreas(currentData) {
        const ctx = this.ctx;
        const area = this.chartArea;
        const colors = this.getColorPalette();

        if (this.historicalData.length < 2) {
            // Not enough history yet, just show current state
            this.historicalData = [{ periodIndex: 0, data: currentData }];
        }

        // Calculate stacked values for all historical points
        const stackedHistory = this.calculateStackedHistory();

        // Find max total for scaling
        let maxTotal = 0;
        stackedHistory.forEach(period => {
            const total = period.stacked[period.stacked.length - 1]?.y1 || 0;
            maxTotal = Math.max(maxTotal, total);
        });

        if (this.config.stackingMode === 'percentage') {
            maxTotal = 100;
        }

        // Draw each entity's area
        const entities = currentData.map(d => d.entity);
        entities.forEach((entity, entityIndex) => {
            const color = colors[entityIndex % colors.length];

            // Create path for this entity's area
            ctx.save();
            ctx.beginPath();

            // Draw top edge (right to left)
            for (let i = stackedHistory.length - 1; i >= 0; i--) {
                const period = stackedHistory[i];
                const stack = period.stacked.find(s => s.entity === entity);
                if (!stack) continue;

                const x = area.x + (i / (stackedHistory.length - 1)) * area.width;
                const y1 = area.y + area.height - (stack.y1 / maxTotal) * area.height;

                if (i === stackedHistory.length - 1) {
                    ctx.moveTo(x, y1);
                } else {
                    if (this.config.smoothCurves) {
                        // Bezier curve for smooth transitions
                        const prevPeriod = stackedHistory[i + 1];
                        const prevStack = prevPeriod.stacked.find(s => s.entity === entity);
                        if (prevStack) {
                            const prevX = area.x + ((i + 1) / (stackedHistory.length - 1)) * area.width;
                            const prevY1 = area.y + area.height - (prevStack.y1 / maxTotal) * area.height;
                            const cpX = (x + prevX) / 2;
                            ctx.quadraticCurveTo(cpX, prevY1, x, y1);
                        } else {
                            ctx.lineTo(x, y1);
                        }
                    } else {
                        ctx.lineTo(x, y1);
                    }
                }
            }

            // Draw bottom edge (left to right)
            for (let i = 0; i < stackedHistory.length; i++) {
                const period = stackedHistory[i];
                const stack = period.stacked.find(s => s.entity === entity);
                if (!stack) continue;

                const x = area.x + (i / (stackedHistory.length - 1)) * area.width;
                const y0 = area.y + area.height - (stack.y0 / maxTotal) * area.height;

                if (this.config.smoothCurves && i > 0) {
                    const prevPeriod = stackedHistory[i - 1];
                    const prevStack = prevPeriod.stacked.find(s => s.entity === entity);
                    if (prevStack) {
                        const prevX = area.x + ((i - 1) / (stackedHistory.length - 1)) * area.width;
                        const prevY0 = area.y + area.height - (prevStack.y0 / maxTotal) * area.height;
                        const cpX = (x + prevX) / 2;
                        ctx.quadraticCurveTo(cpX, prevY0, x, y0);
                    } else {
                        ctx.lineTo(x, y0);
                    }
                } else {
                    ctx.lineTo(x, y0);
                }
            }

            ctx.closePath();

            // PREMIUM: Multi-layer gradient with depth
            const gradient = ctx.createLinearGradient(area.x, area.y, area.x + area.width, area.y + area.height);
            gradient.addColorStop(0, this.adjustColorOpacity(color, 0.75));
            gradient.addColorStop(0.3, this.adjustColorOpacity(color, 0.65));
            gradient.addColorStop(0.7, this.adjustColorOpacity(color, 0.55));
            gradient.addColorStop(1, this.adjustColorOpacity(color, 0.45));
            ctx.fillStyle = gradient;
            ctx.fill();

            // Add top highlight gradient
            const highlightGradient = ctx.createLinearGradient(
                area.x, area.y,
                area.x, area.y + area.height * 0.3
            );
            highlightGradient.addColorStop(0, this.adjustColorOpacity(this.adjustColorBrightness(color, 1.5), 0.3));
            highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = highlightGradient;
            ctx.fill();

            // Draw enhanced stroke with shadow
            if (this.config.enableShadows) {
                ctx.save();
                ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                ctx.shadowBlur = 8;
                ctx.shadowOffsetY = 2;
                ctx.strokeStyle = this.adjustColorBrightness(color, 0.8);
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.restore();
            }

            // Main stroke
            ctx.strokeStyle = this.adjustColorBrightness(color, 1.2);
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // PREMIUM: Enhanced glow with multiple layers
            if (this.config.enableGlow) {
                // Outer glow
                ctx.save();
                ctx.globalAlpha = 0.4;
                ctx.shadowColor = color;
                ctx.shadowBlur = 20;
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();

                // Inner highlight
                ctx.save();
                ctx.globalAlpha = 0.6;
                ctx.shadowColor = this.adjustColorBrightness(color, 1.5);
                ctx.shadowBlur = 10;
                ctx.strokeStyle = this.adjustColorBrightness(color, 1.3);
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.restore();
            }

            ctx.restore();

            // Draw label at the end
            if (this.config.showLabels) {
                const lastPeriod = stackedHistory[stackedHistory.length - 1];
                const lastStack = lastPeriod.stacked.find(s => s.entity === entity);
                if (lastStack) {
                    const y = area.y + area.height - ((lastStack.y0 + lastStack.y1) / 2 / maxTotal) * area.height;
                    this.drawLabel(area.x + area.width + 10, y, entity, lastStack.value, color);
                }
            }
        });

        // Draw scale labels
        this.drawScaleLabels(maxTotal);
    }

    calculateStackedHistory() {
        const result = [];

        this.historicalData.forEach(period => {
            const stacked = [];
            let cumulative = 0;

            // Get total for percentage mode
            let total = 0;
            if (this.config.stackingMode === 'percentage') {
                total = period.data.reduce((sum, d) => sum + d.value, 0);
            }

            period.data.forEach(item => {
                const value = this.config.stackingMode === 'percentage'
                    ? (item.value / total) * 100
                    : item.value;

                stacked.push({
                    entity: item.entity,
                    value: value,
                    y0: cumulative,
                    y1: cumulative + value
                });

                cumulative += value;
            });

            result.push({
                periodIndex: period.periodIndex,
                stacked: stacked
            });
        });

        return result;
    }

    drawLabel(x, y, entity, value, color) {
        const ctx = this.ctx;

        ctx.save();
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        // Draw background
        const text = `${entity} (${this.formatNumber(value)})`;
        const metrics = ctx.measureText(text);
        const padding = 6;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(x - padding, y - 12, metrics.width + padding * 2, 24);

        // Draw colored indicator
        ctx.fillStyle = color;
        ctx.fillRect(x - padding - 10, y - 8, 6, 16);

        // Draw text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, x, y);
        ctx.restore();
    }

    drawScaleLabels(maxValue) {
        const ctx = this.ctx;
        const area = this.chartArea;
        const steps = 5;

        ctx.save();
        ctx.font = '12px Inter, sans-serif';
        ctx.fillStyle = '#aaaaaa';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        for (let i = 0; i <= steps; i++) {
            const value = (maxValue / steps) * i;
            const y = area.y + area.height - (i / steps) * area.height;
            const label = this.config.stackingMode === 'percentage'
                ? `${value.toFixed(0)}%`
                : this.formatNumber(value);

            ctx.fillText(label, area.x - 10, y);
        }

        ctx.restore();
    }

    drawLegend(data) {
        const ctx = this.ctx;
        const colors = this.getColorPalette();
        const x = this.config.width - this.config.padding.right + 20;
        const y = this.config.padding.top;

        ctx.save();
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText('Entities:', x, y);

        data.forEach((item, index) => {
            const color = colors[index % colors.length];
            const itemY = y + 30 + index * 30;

            // Color box
            ctx.fillStyle = color;
            ctx.fillRect(x, itemY - 10, 20, 20);

            // Entity name
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px Inter, sans-serif';
            ctx.fillText(item.entity, x + 30, itemY);

            // Value
            ctx.fillStyle = '#aaaaaa';
            ctx.font = '12px Inter, sans-serif';
            ctx.fillText(this.formatNumber(item.value), x + 30, itemY + 15);
        });

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
        ctx.font = 'bold 36px Inter, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillText(`Period: ${periodName}`, this.chartArea.x, this.config.height - 40);
        ctx.restore();
    }

    getColorPalette() {
        const palettes = {
            vibrant: [
                '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
                '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
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
            pastel: [
                '#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#E0BBE4',
                '#FFDFD3', '#C7CEEA', '#B4F8C8', '#FBE7C6', '#A0E7E5'
            ]
        };

        return palettes[this.config.palette] || palettes.vibrant;
    }

    adjustColorOpacity(color, opacity) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
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
        this.historicalData = [];
        this.highlightEntity = null;
    }
}
