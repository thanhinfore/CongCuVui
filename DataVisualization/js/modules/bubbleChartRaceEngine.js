// ========================================
// Bubble Chart Race Engine - REALISTIC PHYSICS v2.0
// Animated bubble chart with REAL physics simulation
// Elastic collisions, mass-based dynamics, smooth movement
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
        this.bubbleMasses = new Map();
        this.bubbleRadii = new Map();
        this.previousValues = new Map();
        this.trails = new Map();
        this.pulsePhase = 0;

        // Physics constants
        this.FRICTION = 0.98; // Air resistance
        this.DAMPING = 0.95; // Velocity damping
        this.COLLISION_RESTITUTION = 0.85; // Bounciness (0-1)
        this.MAX_VELOCITY = 15; // Maximum speed limit
        this.ATTRACTION_STRENGTH = 0.008; // Center attraction
        this.BOUNDARY_FORCE = 0.15; // Wall push force
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
            bubbleSpacing: config.bubbleSpacing || 1.3,
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

        console.log('🎱 Bubble Chart Race v2.0 - Realistic Physics Engine initialized:', {
            periods: data.periods.length,
            entities: data.entities.length,
            chartArea: this.chartArea,
            physicsEnabled: true
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

        // Find max value for scaling
        const maxValue = Math.max(...interpolatedData.map(d => d.value), 1);

        // Update pulse phase
        this.pulsePhase += 0.05;

        // Update bubble physics (REALISTIC PHYSICS ENGINE)
        this.updatePhysics(interpolatedData, maxValue);

        // Draw trails
        if (this.config.showTrails) {
            this.drawTrails();
        }

        // Draw bubbles
        this.drawBubbles(interpolatedData, maxValue);

        // Draw title and period
        this.drawTitleAndPeriod(periodName);

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
                value: current.value + (next.value - current.value) * easeProgress,
                rank: i + 1
            });
        }

        return result;
    }

    /**
     * ========================================
     * REALISTIC PHYSICS ENGINE v2.0
     * Mass-based elastic collisions
     * Momentum conservation
     * Smooth damping and friction
     * ========================================
     */
    updatePhysics(data, maxValue) {
        // Step 1: Update radii and masses for all bubbles
        data.forEach((item) => {
            const radius = this.calculateBubbleRadius(item.value, maxValue);
            this.bubbleRadii.set(item.entity, radius);

            // Mass proportional to volume (radius^2 for 2D visualization)
            const mass = radius * radius * 0.01; // Scale factor for better physics
            this.bubbleMasses.set(item.entity, mass);
        });

        // Step 2: Initialize positions and velocities for new bubbles
        data.forEach((item, index) => {
            if (!this.bubblePositions.has(item.entity)) {
                // Arrange in an optimized grid
                const cols = Math.ceil(Math.sqrt(this.config.topN));
                const row = Math.floor(index / cols);
                const col = index % cols;
                const x = this.chartArea.x + (col + 0.5) * (this.chartArea.width / cols);
                const y = this.chartArea.y + (row + 0.5) * (this.chartArea.height / Math.ceil(this.config.topN / cols));

                this.bubblePositions.set(item.entity, { x, y });
                this.bubbleVelocities.set(item.entity, { vx: 0, vy: 0 });
            }
        });

        // Step 3: Apply forces (attraction to center, boundary forces)
        data.forEach((item) => {
            const pos = this.bubblePositions.get(item.entity);
            const vel = this.bubbleVelocities.get(item.entity);
            const radius = this.bubbleRadii.get(item.entity);

            let fx = 0, fy = 0;

            // Gentle attraction to center (keeps bubbles together)
            const centerX = this.chartArea.x + this.chartArea.width / 2;
            const centerY = this.chartArea.y + this.chartArea.height / 2;
            const dcx = centerX - pos.x;
            const dcy = centerY - pos.y;
            fx += dcx * this.ATTRACTION_STRENGTH;
            fy += dcy * this.ATTRACTION_STRENGTH;

            // Strong boundary forces (soft walls)
            const margin = radius + 5;
            const leftDist = pos.x - (this.chartArea.x + margin);
            const rightDist = (this.chartArea.x + this.chartArea.width - margin) - pos.x;
            const topDist = pos.y - (this.chartArea.y + margin);
            const bottomDist = (this.chartArea.y + this.chartArea.height - margin) - pos.y;

            if (leftDist < 0) fx += -leftDist * this.BOUNDARY_FORCE;
            if (rightDist < 0) fx -= -rightDist * this.BOUNDARY_FORCE;
            if (topDist < 0) fy += -topDist * this.BOUNDARY_FORCE;
            if (bottomDist < 0) fy -= -bottomDist * this.BOUNDARY_FORCE;

            // Apply forces to velocity
            vel.vx += fx;
            vel.vy += fy;
        });

        // Step 4: Detect and resolve elastic collisions
        const entities = Array.from(data);
        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                this.handleCollision(entities[i], entities[j]);
            }
        }

        // Step 5: Apply damping and update positions
        data.forEach((item) => {
            const pos = this.bubblePositions.get(item.entity);
            const vel = this.bubbleVelocities.get(item.entity);
            const radius = this.bubbleRadii.get(item.entity);

            // Apply friction (air resistance)
            vel.vx *= this.FRICTION;
            vel.vy *= this.FRICTION;

            // Apply velocity damping
            vel.vx *= this.DAMPING;
            vel.vy *= this.DAMPING;

            // Limit maximum velocity (prevent too fast movement)
            const speed = Math.sqrt(vel.vx * vel.vx + vel.vy * vel.vy);
            if (speed > this.MAX_VELOCITY) {
                const scale = this.MAX_VELOCITY / speed;
                vel.vx *= scale;
                vel.vy *= scale;
            }

            // Update position
            pos.x += vel.vx;
            pos.y += vel.vy;

            // Hard boundary constraints (prevent escape)
            const margin = radius;
            pos.x = Math.max(this.chartArea.x + margin, Math.min(this.chartArea.x + this.chartArea.width - margin, pos.x));
            pos.y = Math.max(this.chartArea.y + margin, Math.min(this.chartArea.y + this.chartArea.height - margin, pos.y));

            // Store trail
            if (this.config.showTrails) {
                if (!this.trails.has(item.entity)) {
                    this.trails.set(item.entity, []);
                }
                const trail = this.trails.get(item.entity);
                trail.push({ x: pos.x, y: pos.y, time: Date.now() });

                // Keep only recent trail points (last 1.5 seconds)
                const now = Date.now();
                this.trails.set(item.entity, trail.filter(p => now - p.time < 1500));
            }
        });
    }

    /**
     * Handle elastic collision between two bubbles
     * Uses realistic physics: conservation of momentum and energy
     */
    handleCollision(item1, item2) {
        const pos1 = this.bubblePositions.get(item1.entity);
        const pos2 = this.bubblePositions.get(item2.entity);
        const vel1 = this.bubbleVelocities.get(item1.entity);
        const vel2 = this.bubbleVelocities.get(item2.entity);
        const radius1 = this.bubbleRadii.get(item1.entity);
        const radius2 = this.bubbleRadii.get(item2.entity);
        const mass1 = this.bubbleMasses.get(item1.entity);
        const mass2 = this.bubbleMasses.get(item2.entity);

        if (!pos1 || !pos2 || !vel1 || !vel2) return;

        // Calculate distance between centers
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check for collision
        const minDistance = (radius1 + radius2) * this.config.bubbleSpacing;

        if (distance < minDistance && distance > 0) {
            // Normalize collision vector
            const nx = dx / distance;
            const ny = dy / distance;

            // Relative velocity
            const dvx = vel2.vx - vel1.vx;
            const dvy = vel2.vy - vel1.vy;

            // Relative velocity in collision normal direction
            const dvn = dvx * nx + dvy * ny;

            // Do not resolve if bubbles are separating
            if (dvn > 0) return;

            // Calculate impulse scalar (elastic collision formula)
            const impulse = -(1 + this.COLLISION_RESTITUTION) * dvn / (1/mass1 + 1/mass2);

            // Apply impulse to velocities (conservation of momentum)
            vel1.vx -= (impulse * nx) / mass1;
            vel1.vy -= (impulse * ny) / mass1;
            vel2.vx += (impulse * nx) / mass2;
            vel2.vy += (impulse * ny) / mass2;

            // Separate overlapping bubbles (positional correction)
            const overlap = minDistance - distance;
            const separationRatio = overlap / (distance * 2);

            // Weighted separation based on mass (heavier bubbles move less)
            const totalMass = mass1 + mass2;
            const move1 = (mass2 / totalMass) * overlap * 0.5;
            const move2 = (mass1 / totalMass) * overlap * 0.5;

            pos1.x -= nx * move1;
            pos1.y -= ny * move1;
            pos2.x += nx * move2;
            pos2.y += ny * move2;
        }
    }

    drawTrails() {
        const ctx = this.ctx;
        const now = Date.now();

        this.trails.forEach((trail, entity) => {
            if (trail.length < 2) return;

            ctx.save();

            // Draw trail as smooth curve with fading
            for (let i = 1; i < trail.length; i++) {
                const p1 = trail[i - 1];
                const p2 = trail[i];

                const age = (now - p1.time) / 1500; // 1.5 seconds fade
                const alpha = (1 - age) * 0.3;

                if (alpha <= 0) continue;

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);

                const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
                gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.5})`);
                gradient.addColorStop(1, `rgba(255, 255, 255, ${alpha})`);

                ctx.strokeStyle = gradient;
                ctx.lineWidth = 3 * (1 - age);
                ctx.lineCap = 'round';
                ctx.stroke();
            }

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

            const radius = this.bubbleRadii.get(item.entity);
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

            // PREMIUM: Multi-ring pulsing effect (smoother)
            const pulse = Math.sin(this.pulsePhase + index * 0.5) * 0.04 + 1;

            // Outer pulse ring
            ctx.save();
            ctx.globalAlpha = 0.12;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, radius * pulse * 1.08, 0, Math.PI * 2);
            const outerPulse = ctx.createRadialGradient(
                pos.x, pos.y, radius * pulse * 0.9,
                pos.x, pos.y, radius * pulse * 1.08
            );
            outerPulse.addColorStop(0, color);
            outerPulse.addColorStop(1, this.adjustColorBrightness(color, 0.5));
            ctx.strokeStyle = outerPulse;
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();

            // Inner pulse ring (subtle)
            ctx.save();
            ctx.globalAlpha = 0.25;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, radius * pulse, 0, Math.PI * 2);
            ctx.strokeStyle = this.adjustColorBrightness(color, 1.2);
            ctx.lineWidth = 1.5;
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
        this.bubbleMasses.clear();
        this.bubbleRadii.clear();
        this.previousValues.clear();
        this.trails.clear();
    }
}
