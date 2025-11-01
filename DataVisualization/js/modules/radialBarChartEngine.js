// ========================================
// Radial Bar Chart Engine - CIRCULAR RACING VISUALIZATION v1.0
// Beautiful polar bar chart with animated racing bars radiating from center
// ========================================

export class RadialBarChartEngine {
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
        this.previousValues = new Map();
        this.particles = [];
        this.rotationOffset = 0;
        this.pulsePhase = 0;
        this.glowIntensity = new Map();
    }

    mergeConfig(config) {
        return {
            title: config.title || 'Radial Racing Chart',
            subtitle: config.subtitle || '',
            topN: config.topN || 10,
            fps: config.fps || 60,
            periodLength: config.periodLength || 1000,
            palette: config.palette || 'vibrant',
            width: config.width || 1920,
            height: config.height || 1080,
            showValueLabels: config.showValueLabels !== false,
            enableShadows: config.enableShadows !== false,
            enableParticles: config.enableParticles !== false,
            animatedBackground: config.animatedBackground !== false,
            enableGlow: config.enableGlow !== false,
            autoRotate: config.autoRotate !== false,
            innerRadius: config.innerRadius || 0.15,  // 15% of available space
            outerRadius: config.outerRadius || 0.75,  // 75% of available space
            padding: config.padding || { top: 100, right: 100, bottom: 100, left: 100 },
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

        // Calculate center and radius
        this.centerX = this.config.width / 2;
        this.centerY = this.config.height / 2;
        this.maxRadius = Math.min(
            this.config.width - this.config.padding.left - this.config.padding.right,
            this.config.height - this.config.padding.top - this.config.padding.bottom
        ) / 2;
        this.innerRadiusValue = this.maxRadius * this.config.innerRadius;
        this.outerRadiusValue = this.maxRadius * this.config.outerRadius;

        console.log('Radial Bar Chart initialized:', {
            periods: data.periods.length,
            entities: data.entities.length,
            center: { x: this.centerX, y: this.centerY },
            maxRadius: this.maxRadius
        });
    }

    updateChart(periodIndex, progress) {
        if (!this.data || periodIndex >= this.data.periods.length) return;

        const ctx = this.ctx;
        const periodName = this.data.periods[periodIndex];
        const nextPeriodName = periodIndex < this.data.periods.length - 1
            ? this.data.periods[periodIndex + 1]
            : periodName;

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

        // Find max value for scaling
        const maxValue = Math.max(...interpolatedData.map(d => d.value), 1);

        // Update rotation and pulse
        if (this.config.autoRotate) {
            this.rotationOffset += 0.001;
        }
        this.pulsePhase += 0.05;

        // Draw radial bars
        this.drawRadialBars(interpolatedData, maxValue, periodName);

        // Draw center circle with stats
        this.drawCenterCircle(interpolatedData, periodName);

        // Draw title and period
        this.drawTitleAndPeriod(periodName);

        // Draw particles
        if (this.config.enableParticles) {
            this.updateAndDrawParticles();
        }
    }

    drawAnimatedBackground() {
        const ctx = this.ctx;
        const gradient = ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, this.maxRadius * 1.5
        );

        const hue = (Date.now() / 50) % 360;
        gradient.addColorStop(0, `hsl(${hue}, 70%, 15%)`);
        gradient.addColorStop(0.5, '#0a0e27');
        gradient.addColorStop(1, '#050815');

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

    drawRadialBars(data, maxValue, periodName) {
        const ctx = this.ctx;
        const angleStep = (Math.PI * 2) / data.length;
        const colors = this.getColorPalette();

        data.forEach((item, index) => {
            const angle = angleStep * index + this.rotationOffset - Math.PI / 2;
            const normalizedValue = item.value / maxValue;
            const barRadius = this.innerRadiusValue +
                (this.outerRadiusValue - this.innerRadiusValue) * normalizedValue;

            const color = colors[index % colors.length];

            // Calculate bar width (in radians)
            const barWidth = angleStep * 0.8; // 80% of available space

            // Draw bar shadow
            if (this.config.enableShadows) {
                ctx.save();
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 20;
                ctx.shadowOffsetX = 5;
                ctx.shadowOffsetY = 5;
                this.drawRadialBar(angle, barWidth, this.innerRadiusValue, barRadius, color);
                ctx.restore();
            }

            // Draw main bar with gradient
            ctx.save();
            this.drawRadialBar(angle, barWidth, this.innerRadiusValue, barRadius, color, true);
            ctx.restore();

            // PREMIUM: Multi-layer glow effect
            if (this.config.enableGlow) {
                const glowValue = this.glowIntensity.get(item.entity) || 0;
                this.glowIntensity.set(item.entity, glowValue * 0.95 + normalizedValue * 0.05);

                // Layer 1: Outer glow
                ctx.save();
                ctx.globalAlpha = 0.2 + Math.sin(this.pulsePhase) * 0.1;
                ctx.shadowColor = color;
                ctx.shadowBlur = 50 * glowValue;
                this.drawRadialBar(angle, barWidth, this.innerRadiusValue, barRadius, color);
                ctx.restore();

                // Layer 2: Inner glow
                ctx.save();
                ctx.globalAlpha = 0.4;
                ctx.shadowColor = this.adjustColorBrightness(color, 1.5);
                ctx.shadowBlur = 25 * glowValue;
                this.drawRadialBar(angle, barWidth * 0.9, this.innerRadiusValue, barRadius, color);
                ctx.restore();

                // Layer 3: Highlight edge
                ctx.save();
                ctx.globalAlpha = 0.6 + Math.sin(this.pulsePhase * 2) * 0.2;
                ctx.strokeStyle = this.adjustColorBrightness(color, 1.8);
                ctx.lineWidth = 2;
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(this.centerX, this.centerY, barRadius,
                    angle - barWidth / 2, angle + barWidth / 2);
                ctx.stroke();
                ctx.restore();
            }

            // Draw value label
            if (this.config.showValueLabels) {
                this.drawValueLabel(angle, barRadius, item.entity, item.value);
            }

            // Emit particles for growing bars
            if (this.config.enableParticles) {
                const prevValue = this.previousValues.get(item.entity) || 0;
                if (item.value > prevValue) {
                    if (Math.random() < 0.3) {
                        this.emitParticle(angle, barRadius, color);
                    }
                }
                this.previousValues.set(item.entity, item.value);
            }
        });
    }

    drawRadialBar(angle, barWidth, innerRadius, outerRadius, color, useGradient = false) {
        const ctx = this.ctx;

        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, innerRadius,
            angle - barWidth / 2, angle + barWidth / 2);
        ctx.arc(this.centerX, this.centerY, outerRadius,
            angle + barWidth / 2, angle - barWidth / 2, true);
        ctx.closePath();

        if (useGradient) {
            // PREMIUM: Multi-stop gradient for depth
            const gradient = ctx.createRadialGradient(
                this.centerX, this.centerY, innerRadius,
                this.centerX, this.centerY, outerRadius
            );
            gradient.addColorStop(0, this.adjustColorBrightness(color, 0.5));
            gradient.addColorStop(0.3, this.adjustColorBrightness(color, 0.8));
            gradient.addColorStop(0.6, color);
            gradient.addColorStop(0.85, this.adjustColorBrightness(color, 1.2));
            gradient.addColorStop(1, this.adjustColorBrightness(color, 0.9));
            ctx.fillStyle = gradient;

            // Add shimmer effect
            const shimmerGradient = ctx.createRadialGradient(
                this.centerX + Math.cos(angle) * (innerRadius + (outerRadius - innerRadius) * 0.3),
                this.centerY + Math.sin(angle) * (innerRadius + (outerRadius - innerRadius) * 0.3),
                0,
                this.centerX, this.centerY, outerRadius
            );
            shimmerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
            shimmerGradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.1)');
            shimmerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fill();
            ctx.fillStyle = shimmerGradient;
            ctx.fill();
        } else {
            ctx.fillStyle = color;
            ctx.fill();
        }
    }

    drawValueLabel(angle, radius, entity, value) {
        const ctx = this.ctx;
        const labelRadius = radius + 30;
        const x = this.centerX + Math.cos(angle) * labelRadius;
        const y = this.centerY + Math.sin(angle) * labelRadius;

        ctx.save();
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw label background
        const text = `${entity}: ${this.formatNumber(value)}`;
        const metrics = ctx.measureText(text);
        const padding = 8;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(
            x - metrics.width / 2 - padding,
            y - 12,
            metrics.width + padding * 2,
            24
        );

        // Draw text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, x, y);
        ctx.restore();
    }

    drawCenterCircle(data, periodName) {
        const ctx = this.ctx;

        // PREMIUM: Multi-layer center circle with depth
        ctx.save();

        // Outer glow ring
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.innerRadiusValue - 5, 0, Math.PI * 2);
        const outerGlow = ctx.createRadialGradient(
            this.centerX, this.centerY, this.innerRadiusValue - 20,
            this.centerX, this.centerY, this.innerRadiusValue - 5
        );
        outerGlow.addColorStop(0, 'rgba(100, 150, 255, 0)');
        outerGlow.addColorStop(1, 'rgba(100, 150, 255, 0.3)');
        ctx.fillStyle = outerGlow;
        ctx.fill();

        // Main center circle with enhanced gradient
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.innerRadiusValue - 10, 0, Math.PI * 2);

        const gradient = ctx.createRadialGradient(
            this.centerX - this.innerRadiusValue * 0.3,
            this.centerY - this.innerRadiusValue * 0.3,
            0,
            this.centerX, this.centerY, this.innerRadiusValue
        );
        gradient.addColorStop(0, 'rgba(80, 80, 100, 0.3)');
        gradient.addColorStop(0.4, 'rgba(40, 45, 60, 0.7)');
        gradient.addColorStop(0.8, 'rgba(10, 14, 30, 0.9)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
        ctx.fillStyle = gradient;
        ctx.fill();

        if (this.config.enableShadows) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 30;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 5;
        }

        // Premium border with dual ring
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.5)';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.innerRadiusValue - 15, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();

        // Draw stats in center with enhanced styling
        const total = data.reduce((sum, d) => sum + d.value, 0);
        const leader = data[0];

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 10;

        if (leader) {
            // Leader crown icon
            ctx.font = '32px Inter, sans-serif';
            ctx.fillStyle = '#FFD700';
            ctx.textAlign = 'center';
            ctx.fillText('👑', this.centerX, this.centerY - 40);

            // Leader name with gradient
            const nameGradient = ctx.createLinearGradient(
                this.centerX - 50, this.centerY - 10,
                this.centerX + 50, this.centerY - 10
            );
            nameGradient.addColorStop(0, '#ffffff');
            nameGradient.addColorStop(0.5, '#e0e0ff');
            nameGradient.addColorStop(1, '#ffffff');

            ctx.font = 'bold 26px Inter, sans-serif';
            ctx.fillStyle = nameGradient;
            ctx.textBaseline = 'middle';
            ctx.fillText(leader.entity, this.centerX, this.centerY - 5);

            // Value with pulsing effect
            const pulseScale = 1 + Math.sin(this.pulsePhase * 2) * 0.05;
            ctx.save();
            ctx.translate(this.centerX, this.centerY + 25);
            ctx.scale(pulseScale, pulseScale);
            ctx.font = 'bold 20px Inter, sans-serif';
            ctx.fillStyle = '#00ff88';
            ctx.fillText(this.formatNumber(leader.value), 0, 0);
            ctx.restore();
        }
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
        ctx.fillText(this.config.title, this.centerX, 60);
        ctx.restore();

        // Draw period
        ctx.save();
        ctx.font = 'bold 72px Inter, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillText(periodName, this.centerX, this.config.height - 60);
        ctx.restore();
    }

    emitParticle(angle, radius, color) {
        const speed = 2 + Math.random() * 3;
        const spreadAngle = angle + (Math.random() - 0.5) * 0.3;

        this.particles.push({
            x: this.centerX + Math.cos(angle) * radius,
            y: this.centerY + Math.sin(angle) * radius,
            vx: Math.cos(spreadAngle) * speed,
            vy: Math.sin(spreadAngle) * speed,
            life: 1,
            color: color,
            size: 3 + Math.random() * 3
        });
    }

    updateAndDrawParticles() {
        const ctx = this.ctx;

        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            p.size *= 0.98;

            if (p.life > 0) {
                ctx.save();
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                return true;
            }
            return false;
        });
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
            ]
        };

        return palettes[this.config.palette] || palettes.vibrant;
    }

    adjustColorBrightness(color, factor) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        return `rgb(${Math.floor(r * factor)}, ${Math.floor(g * factor)}, ${Math.floor(b * factor)})`;
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
        this.particles = [];
        this.previousValues.clear();
        this.glowIntensity.clear();
    }
}
