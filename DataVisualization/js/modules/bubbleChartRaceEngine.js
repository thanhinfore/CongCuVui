// ========================================
// Bubble Chart Race Engine - MULTI-DIMENSIONAL RACING BUBBLES v1.0
// Animated bubble chart showing size, position, and color dynamics
// ========================================

export class BubbleChartRaceEngine {
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
        this.bubblePositions = new Map();
        this.bubbleVelocities = new Map();
        this.previousValues = new Map();
        this.trails = new Map();
        this.pulsePhase = 0;
    }

    mergeConfig(config) {
        return {
            title: config.title || 'Bubble Chart Race',
            subtitle: config.subtitle || '',
            topN: config.topN || 15,
            fps: config.fps || 60,
            periodLength: config.periodLength || 1000,
            palette: config.palette || 'vibrant',
            width: config.width || 1920,
            height: config.height || 1080,
            showLabels: config.showLabels !== false,
            showTrails: config.showTrails !== false,
            enableShadows: config.enableShadows !== false,
            enable3DEffect: config.enable3DEffect !== false,
            animatedBackground: config.animatedBackground !== false,
            minBubbleSize: config.minBubbleSize || 20,
            maxBubbleSize: config.maxBubbleSize || 120,
            bubbleSpacing: config.bubbleSpacing || 1.5,
            padding: config.padding || { top: 120, right: 100, bottom: 120, left: 100 },
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

        console.log('Bubble Chart Race initialized:', {
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

        // Find max value for scaling
        const maxValue = Math.max(...interpolatedData.map(d => d.value), 1);

        // Update pulse phase
        this.pulsePhase += 0.05;

        // Calculate bubble positions using force-directed layout
        this.updateBubblePositions(interpolatedData, maxValue);

        // Draw trails
        if (this.config.showTrails) {
            this.drawTrails();
        }

        // Draw bubbles
        this.drawBubbles(interpolatedData, maxValue);

        // Draw title and period
        this.drawTitleAndPeriod(currentPeriod.name);

        // Draw legend
        this.drawLegend(interpolatedData, maxValue);
    }

    drawAnimatedBackground() {
        const ctx = this.ctx;
        const gradient = ctx.createLinearGradient(0, 0, this.config.width, this.config.height);

        const hue = (Date.now() / 50) % 360;
        gradient.addColorStop(0, `hsl(${hue}, 60%, 12%)`);
        gradient.addColorStop(0.5, '#0a0e27');
        gradient.addColorStop(1, `hsl(${(hue + 60) % 360}, 60%, 12%)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.config.width, this.config.height);
    }

    getTopNData(period) {
        const entries = Object.entries(period.values)
            .map(([entity, value]) => ({ entity, value: parseFloat(value) || 0 }))
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
                value: current.value + (next.value - current.value) * easeProgress,
                rank: i + 1
            });
        }

        return result;
    }

    updateBubblePositions(data, maxValue) {
        // Use a simple force-directed layout algorithm
        data.forEach((item, index) => {
            const radius = this.calculateBubbleRadius(item.value, maxValue);

            // Initialize position if not exists
            if (!this.bubblePositions.has(item.entity)) {
                // Arrange in a grid initially
                const cols = Math.ceil(Math.sqrt(this.config.topN));
                const row = Math.floor(index / cols);
                const col = index % cols;
                const x = this.chartArea.x + (col + 0.5) * (this.chartArea.width / cols);
                const y = this.chartArea.y + (row + 0.5) * (this.chartArea.height / Math.ceil(this.config.topN / cols));

                this.bubblePositions.set(item.entity, { x, y });
                this.bubbleVelocities.set(item.entity, { vx: 0, vy: 0 });
            }

            const pos = this.bubblePositions.get(item.entity);
            const vel = this.bubbleVelocities.get(item.entity);

            // Apply forces
            let fx = 0, fy = 0;

            // Repulsion from other bubbles
            data.forEach((other, otherIndex) => {
                if (other.entity !== item.entity) {
                    const otherPos = this.bubblePositions.get(other.entity);
                    if (otherPos) {
                        const dx = pos.x - otherPos.x;
                        const dy = pos.y - otherPos.y;
                        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                        const otherRadius = this.calculateBubbleRadius(other.value, maxValue);
                        const minDist = (radius + otherRadius) * this.config.bubbleSpacing;

                        if (dist < minDist) {
                            const force = (minDist - dist) / dist * 0.5;
                            fx += dx * force;
                            fy += dy * force;
                        }
                    }
                }
            });

            // Attraction to center
            const centerX = this.chartArea.x + this.chartArea.width / 2;
            const centerY = this.chartArea.y + this.chartArea.height / 2;
            fx += (centerX - pos.x) * 0.01;
            fy += (centerY - pos.y) * 0.01;

            // Boundary forces
            const margin = radius + 10;
            if (pos.x < this.chartArea.x + margin) fx += (this.chartArea.x + margin - pos.x) * 0.1;
            if (pos.x > this.chartArea.x + this.chartArea.width - margin) fx += (this.chartArea.x + this.chartArea.width - margin - pos.x) * 0.1;
            if (pos.y < this.chartArea.y + margin) fy += (this.chartArea.y + margin - pos.y) * 0.1;
            if (pos.y > this.chartArea.y + this.chartArea.height - margin) fy += (this.chartArea.y + this.chartArea.height - margin - pos.y) * 0.1;

            // Update velocity and position
            vel.vx = vel.vx * 0.85 + fx;
            vel.vy = vel.vy * 0.85 + fy;

            pos.x += vel.vx;
            pos.y += vel.vy;

            // Store trail
            if (this.config.showTrails) {
                if (!this.trails.has(item.entity)) {
                    this.trails.set(item.entity, []);
                }
                const trail = this.trails.get(item.entity);
                trail.push({ x: pos.x, y: pos.y, time: Date.now() });

                // Keep only recent trail points (last 1 second)
                const now = Date.now();
                this.trails.set(item.entity, trail.filter(p => now - p.time < 1000));
            }
        });
    }

    drawTrails() {
        const ctx = this.ctx;
        const now = Date.now();

        this.trails.forEach((trail, entity) => {
            if (trail.length < 2) return;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(trail[0].x, trail[0].y);

            for (let i = 1; i < trail.length; i++) {
                ctx.lineTo(trail[i].x, trail[i].y);
            }

            const age = (now - trail[0].time) / 1000;
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 * (1 - age)})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        });
    }

    drawBubbles(data, maxValue) {
        const ctx = this.ctx;
        const colors = this.getColorPalette();

        // Sort by size (draw larger bubbles first for proper layering)
        const sortedData = [...data].sort((a, b) => b.value - a.value);

        sortedData.forEach((item, index) => {
            const pos = this.bubblePositions.get(item.entity);
            if (!pos) return;

            const radius = this.calculateBubbleRadius(item.value, maxValue);
            const color = colors[data.findIndex(d => d.entity === item.entity) % colors.length];

            // Draw shadow
            if (this.config.enableShadows) {
                ctx.save();
                ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
                ctx.shadowBlur = 25;
                ctx.shadowOffsetX = 5;
                ctx.shadowOffsetY = 5;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.restore();
            }

            // PREMIUM: Ultra-realistic 3D bubble with multiple layers
            ctx.save();

            if (this.config.enable3DEffect) {
                // Main sphere gradient
                const gradient = ctx.createRadialGradient(
                    pos.x - radius * 0.4,
                    pos.y - radius * 0.4,
                    0,
                    pos.x,
                    pos.y,
                    radius
                );
                gradient.addColorStop(0, this.adjustColorBrightness(color, 2.2));
                gradient.addColorStop(0.1, this.adjustColorBrightness(color, 1.8));
                gradient.addColorStop(0.25, this.adjustColorBrightness(color, 1.3));
                gradient.addColorStop(0.5, color);
                gradient.addColorStop(0.75, this.adjustColorBrightness(color, 0.7));
                gradient.addColorStop(0.95, this.adjustColorBrightness(color, 0.4));
                gradient.addColorStop(1, this.adjustColorBrightness(color, 0.3));

                ctx.beginPath();
                ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();

                // Specular highlight (shiny spot)
                const highlight = ctx.createRadialGradient(
                    pos.x - radius * 0.35,
                    pos.y - radius * 0.35,
                    0,
                    pos.x - radius * 0.35,
                    pos.y - radius * 0.35,
                    radius * 0.4
                );
                highlight.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
                highlight.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
                highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = highlight;
                ctx.fill();

                // Ambient occlusion (bottom shadow)
                const shadow = ctx.createRadialGradient(
                    pos.x + radius * 0.2,
                    pos.y + radius * 0.3,
                    0,
                    pos.x + radius * 0.2,
                    pos.y + radius * 0.3,
                    radius * 0.6
                );
                shadow.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
                shadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = shadow;
                ctx.fill();

                // Glass rim effect
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 3;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(pos.x, pos.y, radius - 2, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 1;
                ctx.stroke();
            } else {
                // Simple gradient for non-3D mode
                const gradient = ctx.createRadialGradient(
                    pos.x - radius * 0.3,
                    pos.y - radius * 0.3,
                    0,
                    pos.x,
                    pos.y,
                    radius
                );
                gradient.addColorStop(0, color);
                gradient.addColorStop(1, this.adjustColorBrightness(color, 0.8));

                ctx.beginPath();
                ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            ctx.restore();

            // PREMIUM: Multi-ring pulsing effect
            const pulse = Math.sin(this.pulsePhase + index * 0.5) * 0.06 + 1;

            // Outer pulse ring
            ctx.save();
            ctx.globalAlpha = 0.15;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, radius * pulse * 1.1, 0, Math.PI * 2);
            const outerPulse = ctx.createRadialGradient(
                pos.x, pos.y, radius * pulse * 0.9,
                pos.x, pos.y, radius * pulse * 1.1
            );
            outerPulse.addColorStop(0, color);
            outerPulse.addColorStop(1, this.adjustColorBrightness(color, 0.5));
            ctx.strokeStyle = outerPulse;
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.restore();

            // Inner pulse ring
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, radius * pulse, 0, Math.PI * 2);
            ctx.strokeStyle = this.adjustColorBrightness(color, 1.3);
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();

            // Draw label
            if (this.config.showLabels && radius > 30) {
                ctx.save();
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                ctx.shadowBlur = 5;

                // Entity name
                ctx.font = `bold ${Math.min(radius / 3, 18)}px Inter, sans-serif`;
                ctx.fillText(item.entity, pos.x, pos.y - 8);

                // Value
                ctx.font = `${Math.min(radius / 4, 14)}px Inter, sans-serif`;
                ctx.fillStyle = '#dddddd';
                ctx.fillText(this.formatNumber(item.value), pos.x, pos.y + 10);
                ctx.restore();
            }

            // Draw rank badge
            if (item.rank <= 3) {
                this.drawRankBadge(pos.x + radius - 20, pos.y - radius + 20, item.rank);
            }
        });
    }

    drawRankBadge(x, y, rank) {
        const ctx = this.ctx;
        const size = 30;

        ctx.save();
        // Badge background
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Rank number
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(rank.toString(), x, y);
        ctx.restore();
    }

    calculateBubbleRadius(value, maxValue) {
        const normalized = value / maxValue;
        return this.config.minBubbleSize +
            (this.config.maxBubbleSize - this.config.minBubbleSize) * Math.sqrt(normalized);
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
        ctx.restore();

        // Draw period
        ctx.save();
        ctx.font = 'bold 72px Inter, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillText(periodName, this.config.width / 2, this.config.height - 60);
        ctx.restore();
    }

    drawLegend(data, maxValue) {
        const ctx = this.ctx;
        const x = this.config.width - this.config.padding.right + 20;
        const y = this.config.padding.top;

        ctx.save();
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText('Size Scale:', x, y);

        // Draw size reference circles
        const sizes = [
            { label: 'Max', value: maxValue },
            { label: 'Mid', value: maxValue / 2 },
            { label: 'Min', value: maxValue / 10 }
        ];

        sizes.forEach((size, index) => {
            const radius = this.calculateBubbleRadius(size.value, maxValue);
            const cy = y + 40 + index * 60;

            ctx.beginPath();
            ctx.arc(x, cy, radius / 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.stroke();

            ctx.fillStyle = '#aaaaaa';
            ctx.font = '12px Inter, sans-serif';
            ctx.fillText(this.formatNumber(size.value), x + radius / 2 + 10, cy + 5);
        });

        ctx.restore();
    }

    getColorPalette() {
        const palettes = {
            vibrant: [
                '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
                '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
                '#E74C3C', '#3498DB', '#9B59B6', '#1ABC9C', '#F39C12',
                '#FF6B9D', '#C44569', '#58B19F', '#3B3B98', '#FEA47F'
            ],
            neon: [
                '#FF006E', '#00F5FF', '#39FF14', '#FFFF00', '#FF10F0',
                '#00FFFF', '#FF4500', '#7FFF00', '#FF1493', '#00FF7F',
                '#FF00FF', '#00FF00', '#FF0000', '#0000FF', '#FFFF00'
            ],
            sunset: [
                '#FF6B35', '#F7931E', '#FDC830', '#F37335', '#FF5E5B',
                '#D64045', '#FF8C42', '#FFBA08', '#D62828', '#F77F00'
            ],
            ocean: [
                '#0077BE', '#00B4D8', '#90E0EF', '#00A6FB', '#0096C7',
                '#023E8A', '#48CAE4', '#00B4D8', '#0077B6', '#03045E'
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
        this.bubblePositions.clear();
        this.bubbleVelocities.clear();
        this.previousValues.clear();
        this.trails.clear();
    }
}
