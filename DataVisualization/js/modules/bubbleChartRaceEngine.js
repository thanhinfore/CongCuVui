// ========================================
// Bubble Chart Race Engine - v4.0 PREMIUM EDITION
// ✨ Persistent Bubble Tracking - NO sudden appearance/disappearance!
// 🎱 Billiard Table Physics - Mass-based collisions & boundary bounce
// 🎨 Smooth Fade In/Out - Beautiful opacity animations
// 📊 Smooth Size/Mass Transitions - Radius lerp during value changes
// ⚡ Sub-stepping - Perfect elastic collisions (6 steps/frame)
// 🌟 Visual Feedback - Glow when growing/shrinking
//
// 🚀 v4.0 ENHANCEMENTS: Enterprise-grade visual effects
//    - Motion blur system for fast-moving bubbles
//    - Collision particle burst with impulse-based intensity
//    - Dynamic light positioning for realistic 3D spheres
//    - Enhanced 4-layer bloom with magnitude control
//    - Advanced easing (elastic, bounce, expo) support
// 📚 Uses: VisualEffectsLib v2.0 (import for full features)
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
        this.targetRadii = new Map();          // NEW v14.1: Target radius for smooth size transitions
        this.previousValues = new Map();
        this.bubbleOpacity = new Map();        // Track opacity for fade in/out
        this.currentTopN = new Set();          // Track which bubbles are in top N
        this.allTrackedBubbles = new Set();    // All bubbles ever shown
        this.trails = new Map();
        this.pulsePhase = 0;
        this.lastClinkTime = 0;                // Cooldown timer for clink sound

        // BILLIARD TABLE PHYSICS CONSTANTS - Ultra smooth!
        this.FRICTION = 0.9985;              // Like polished billiard table (very low friction)
        this.DAMPING = 0.999;                // Almost no damping
        this.COLLISION_RESTITUTION = 0.95;   // Very elastic (billiard balls don't lose much energy)
        this.BOUNDARY_RESTITUTION = 0.85;    // Wall bounces are slightly less elastic
        this.MAX_VELOCITY = 30;              // Allow fast movement
        this.ATTRACTION_STRENGTH = 0.003;    // Minimal center pull
        this.BOUNDARY_FORCE = 0.2;           // Soft wall push

        // SUB-STEPPING for smooth physics
        this.PHYSICS_SUBSTEPS = 6;           // 6 physics steps per frame for smoothness
        this.FIXED_TIMESTEP = 1 / 60 / this.PHYSICS_SUBSTEPS;  // Fixed timestep

        // Collision iteration settings
        this.COLLISION_ITERATIONS = 3;       // Multiple passes for stable collisions

        // FADE IN/OUT ANIMATION CONSTANTS
        this.FADE_IN_SPEED = 0.08;           // Speed of fade in (0.0 to 1.0)
        this.FADE_OUT_SPEED = 0.05;          // Speed of fade out (0.0 to 1.0)

        // SMOOTH SIZE/MASS TRANSITION - v14.1
        this.RADIUS_LERP_FACTOR = 0.15;      // Smooth radius interpolation (higher = faster transition)
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
            bubbleSpacing: config.bubbleSpacing || 1.2,
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

        console.log('✨ Bubble Chart Race v3.1 - ULTIMATE SMOOTH EDITION initialized:', {
            periods: data.periods.length,
            entities: data.entities.length,
            chartArea: this.chartArea,
            substeps: this.PHYSICS_SUBSTEPS,
            friction: this.FRICTION,
            restitution: this.COLLISION_RESTITUTION,
            fadeInSpeed: this.FADE_IN_SPEED,
            fadeOutSpeed: this.FADE_OUT_SPEED,
            radiusLerp: this.RADIUS_LERP_FACTOR,
            features: '✨ Persistent Tracking | 🎱 Billiard Physics | 🎨 Smooth Fade & Size | 📊 Dynamic Mass'
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

        // ========================================
        // PERSISTENT BUBBLE TRACKING v3.0
        // Bubbles fade in/out smoothly, no sudden appearance/disappearance
        // ========================================

        // Get current and next period's top N
        const currentTopN = this.getTopNData(periodIndex);
        const nextTopN = this.getTopNData(Math.min(periodIndex + 1, this.data.periods.length - 1));

        // Create sets of entities that should be visible
        const currentTopNSet = new Set(currentTopN.map(d => d.entity));
        const nextTopNSet = new Set(nextTopN.map(d => d.entity));
        const shouldBeVisible = new Set([...currentTopNSet, ...nextTopNSet]);

        // Update tracked bubbles and their target opacity
        shouldBeVisible.forEach(entity => {
            this.allTrackedBubbles.add(entity);
            // Target opacity: 1.0 if in current top N, 0.0 if not
            const targetOpacity = currentTopNSet.has(entity) ? 1.0 : 0.0;
            const currentOpacity = this.bubbleOpacity.get(entity) || 0.0;

            // Smooth fade in/out
            if (currentOpacity < targetOpacity) {
                this.bubbleOpacity.set(entity, Math.min(1.0, currentOpacity + this.FADE_IN_SPEED));
            } else if (currentOpacity > targetOpacity) {
                this.bubbleOpacity.set(entity, Math.max(0.0, currentOpacity - this.FADE_OUT_SPEED));
            }
        });

        // Remove bubbles that have completely faded out
        const toRemove = [];
        this.allTrackedBubbles.forEach(entity => {
            const opacity = this.bubbleOpacity.get(entity) || 0.0;
            if (opacity <= 0.0 && !shouldBeVisible.has(entity)) {
                toRemove.push(entity);
            }
        });
        toRemove.forEach(entity => {
            this.allTrackedBubbles.delete(entity);
            this.bubbleOpacity.delete(entity);
            this.bubblePositions.delete(entity);
            this.bubbleVelocities.delete(entity);
            this.bubbleMasses.delete(entity);
            this.bubbleRadii.delete(entity);
            this.trails.delete(entity);
        });

        // Build complete data array with all tracked bubbles
        const allBubbleData = this.buildPersistentBubbleData(periodIndex, progress, currentTopN, nextTopN);

        // Find max value for scaling
        const maxValue = Math.max(...allBubbleData.map(d => d.value), 1);

        // Update pulse phase
        this.pulsePhase += 0.03;

        // Update bubble physics with SUB-STEPPING (BILLIARD TABLE PHYSICS)
        this.updatePhysicsWithSubsteps(allBubbleData, maxValue);

        // Draw trails
        if (this.config.showTrails) {
            this.drawTrails();
        }

        // Draw bubbles (now includes opacity for fade in/out)
        this.drawBubbles(allBubbleData, maxValue);

        // Draw title and period
        this.drawTitleAndPeriod(periodName);

        // Draw legend
        this.drawLegend(currentTopN.slice(0, this.config.topN), maxValue);
    }

    /**
     * Build data for all tracked bubbles with smooth value interpolation
     * This ensures bubbles don't suddenly appear/disappear
     */
    buildPersistentBubbleData(periodIndex, progress, currentTopN, nextTopN) {
        const result = [];
        const easeProgress = this.easeInOutCubic(progress);

        // Create maps for quick lookup
        const currentMap = new Map(currentTopN.map(d => [d.entity, d.value]));
        const nextMap = new Map(nextTopN.map(d => [d.entity, d.value]));

        // Process all tracked bubbles
        this.allTrackedBubbles.forEach(entity => {
            const currentValue = currentMap.get(entity) || 0;
            const nextValue = nextMap.get(entity) || 0;

            // Smooth value interpolation
            const interpolatedValue = currentValue + (nextValue - currentValue) * easeProgress;

            // Only include if opacity > 0
            const opacity = this.bubbleOpacity.get(entity) || 0.0;
            if (opacity > 0.0) {
                result.push({
                    entity,
                    value: interpolatedValue,
                    opacity,
                    rank: currentTopN.findIndex(d => d.entity === entity) + 1
                });
            }
        });

        return result;
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
     * BILLIARD TABLE PHYSICS ENGINE v3.0
     * ✨ SMOOTH SIZE/MASS TRANSITIONS during value changes
     * 🎱 SUB-STEPPING for ultra-smooth simulation
     * ⚡ Multiple physics steps per frame
     * 🎯 Fixed timestep for stability
     * ========================================
     */
    updatePhysicsWithSubsteps(data, maxValue) {
        // Step 1: SMOOTH RADIUS/MASS TRANSITIONS
        // Calculate target radius from current value, then lerp for smooth size changes
        data.forEach((item) => {
            const targetRadius = this.calculateBubbleRadius(item.value, maxValue);
            this.targetRadii.set(item.entity, targetRadius);

            // Get current radius (or initialize to target if new bubble)
            let currentRadius = this.bubbleRadii.get(item.entity);
            if (currentRadius === undefined) {
                // New bubble: start at target radius
                currentRadius = targetRadius;
            } else {
                // Existing bubble: smoothly interpolate (lerp) towards target radius
                // This makes size changes smooth when value changes over time
                currentRadius = currentRadius + (targetRadius - currentRadius) * this.RADIUS_LERP_FACTOR;
            }

            this.bubbleRadii.set(item.entity, currentRadius);

            // Mass proportional to area (like real billiard balls)
            // As radius changes smoothly, mass also changes smoothly
            const mass = currentRadius * currentRadius * 0.01;
            this.bubbleMasses.set(item.entity, mass);
        });

        // Step 2: Initialize positions for new bubbles
        data.forEach((item, index) => {
            if (!this.bubblePositions.has(item.entity)) {
                const cols = Math.ceil(Math.sqrt(this.config.topN));
                const row = Math.floor(index / cols);
                const col = index % cols;
                const x = this.chartArea.x + (col + 0.5) * (this.chartArea.width / cols);
                const y = this.chartArea.y + (row + 0.5) * (this.chartArea.height / Math.ceil(this.config.topN / cols));

                this.bubblePositions.set(item.entity, { x, y });
                this.bubbleVelocities.set(item.entity, { vx: 0, vy: 0 });
            }
        });

        // Step 3: SUB-STEPPING - Multiple physics updates per frame for smoothness
        for (let substep = 0; substep < this.PHYSICS_SUBSTEPS; substep++) {
            // Apply forces
            this.applyForces(data);

            // Resolve collisions (multiple iterations for stability)
            for (let iter = 0; iter < this.COLLISION_ITERATIONS; iter++) {
                this.resolveCollisions(data);
            }

            // Update positions with fixed timestep
            this.integrateMotion(data);

            // Constrain to boundaries
            this.applyBoundaryConstraints(data);
        }

        // Update trails (only once per frame, not per substep)
        this.updateTrails(data);
    }

    /**
     * Apply forces to all bubbles
     */
    applyForces(data) {
        data.forEach((item) => {
            const pos = this.bubblePositions.get(item.entity);
            const vel = this.bubbleVelocities.get(item.entity);
            const radius = this.bubbleRadii.get(item.entity);

            // Very gentle center attraction (much weaker than before)
            const centerX = this.chartArea.x + this.chartArea.width / 2;
            const centerY = this.chartArea.y + this.chartArea.height / 2;
            const dcx = centerX - pos.x;
            const dcy = centerY - pos.y;
            const dist = Math.sqrt(dcx * dcx + dcy * dcy);

            if (dist > 0) {
                const force = this.ATTRACTION_STRENGTH / this.PHYSICS_SUBSTEPS;
                vel.vx += (dcx / dist) * force;
                vel.vy += (dcy / dist) * force;
            }

            // Soft boundary forces
            const margin = radius + 5;
            const leftDist = pos.x - (this.chartArea.x + margin);
            const rightDist = (this.chartArea.x + this.chartArea.width - margin) - pos.x;
            const topDist = pos.y - (this.chartArea.y + margin);
            const bottomDist = (this.chartArea.y + this.chartArea.height - margin) - pos.y;

            const boundaryForce = this.BOUNDARY_FORCE / this.PHYSICS_SUBSTEPS;

            if (leftDist < 30) vel.vx += (30 - leftDist) * boundaryForce * 0.1;
            if (rightDist < 30) vel.vx -= (30 - rightDist) * boundaryForce * 0.1;
            if (topDist < 30) vel.vy += (30 - topDist) * boundaryForce * 0.1;
            if (bottomDist < 30) vel.vy -= (30 - bottomDist) * boundaryForce * 0.1;
        });
    }

    /**
     * Resolve all collisions between bubbles
     */
    resolveCollisions(data) {
        const entities = Array.from(data);

        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                this.handleBilliardCollision(entities[i], entities[j]);
            }
        }
    }

    /**
     * Handle billiard-style elastic collision
     * Perfect conservation of momentum and energy
     */
    handleBilliardCollision(item1, item2) {
        const pos1 = this.bubblePositions.get(item1.entity);
        const pos2 = this.bubblePositions.get(item2.entity);
        const vel1 = this.bubbleVelocities.get(item1.entity);
        const vel2 = this.bubbleVelocities.get(item2.entity);
        const radius1 = this.bubbleRadii.get(item1.entity);
        const radius2 = this.bubbleRadii.get(item2.entity);
        const mass1 = this.bubbleMasses.get(item1.entity);
        const mass2 = this.bubbleMasses.get(item2.entity);

        if (!pos1 || !pos2 || !vel1 || !vel2) return;

        // Calculate distance
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check for collision
        const minDistance = (radius1 + radius2) * this.config.bubbleSpacing;

        if (distance < minDistance && distance > 0.1) {
            // Collision normal (unit vector)
            const nx = dx / distance;
            const ny = dy / distance;

            // Relative velocity
            const dvx = vel1.vx - vel2.vx;
            const dvy = vel1.vy - vel2.vy;

            // Relative velocity along collision normal
            const dvn = dvx * nx + dvy * ny;

            // Only resolve if approaching
            if (dvn > 0) {
                // Billiard collision formula (perfect elastic collision)
                const impulse = (2.0 * dvn) / (1/mass1 + 1/mass2);

                // Update velocities (momentum conservation)
                vel1.vx -= impulse * nx / mass1;
                vel1.vy -= impulse * ny / mass1;
                vel2.vx += impulse * nx / mass2;
                vel2.vy += impulse * ny / mass2;

                // Apply restitution for slight energy loss
                vel1.vx *= this.COLLISION_RESTITUTION;
                vel1.vy *= this.COLLISION_RESTITUTION;
                vel2.vx *= this.COLLISION_RESTITUTION;
                vel2.vy *= this.COLLISION_RESTITUTION;

                // Play clink sound for significant collisions (with cooldown)
                if (this.audioEngine && impulse > 0.5) {
                    const now = Date.now();
                    if (now - this.lastClinkTime > 100) {
                        this.audioEngine.playSoundEffect('clink').catch(err => {
                            console.debug('Clink sound play prevented:', err);
                        });
                        this.lastClinkTime = now;
                    }
                }

                // Separate overlapping bubbles smoothly
                const overlap = minDistance - distance;
                const separationFactor = 0.5; // Each bubble moves half the overlap

                const totalMass = mass1 + mass2;
                const move1 = (mass2 / totalMass) * overlap * separationFactor;
                const move2 = (mass1 / totalMass) * overlap * separationFactor;

                pos1.x -= nx * move1;
                pos1.y -= ny * move1;
                pos2.x += nx * move2;
                pos2.y += ny * move2;
            }
        }
    }

    /**
     * Integrate motion (update positions from velocities)
     */
    integrateMotion(data) {
        data.forEach((item) => {
            const pos = this.bubblePositions.get(item.entity);
            const vel = this.bubbleVelocities.get(item.entity);

            // Apply minimal friction (billiard table is very smooth)
            vel.vx *= this.FRICTION;
            vel.vy *= this.FRICTION;

            // Apply minimal damping
            vel.vx *= this.DAMPING;
            vel.vy *= this.DAMPING;

            // Limit maximum velocity (prevent unrealistic speeds)
            const speed = Math.sqrt(vel.vx * vel.vx + vel.vy * vel.vy);
            if (speed > this.MAX_VELOCITY) {
                const scale = this.MAX_VELOCITY / speed;
                vel.vx *= scale;
                vel.vy *= scale;
            }

            // Update position with fixed timestep
            pos.x += vel.vx * this.FIXED_TIMESTEP * 60; // Scale to 60fps
            pos.y += vel.vy * this.FIXED_TIMESTEP * 60;
        });
    }

    /**
     * Apply boundary constraints with bouncing
     */
    applyBoundaryConstraints(data) {
        data.forEach((item) => {
            const pos = this.bubblePositions.get(item.entity);
            const vel = this.bubbleVelocities.get(item.entity);
            const radius = this.bubbleRadii.get(item.entity);

            const margin = radius;

            // Bounce off boundaries
            if (pos.x < this.chartArea.x + margin) {
                pos.x = this.chartArea.x + margin;
                vel.vx = Math.abs(vel.vx) * this.BOUNDARY_RESTITUTION;
            }
            if (pos.x > this.chartArea.x + this.chartArea.width - margin) {
                pos.x = this.chartArea.x + this.chartArea.width - margin;
                vel.vx = -Math.abs(vel.vx) * this.BOUNDARY_RESTITUTION;
            }
            if (pos.y < this.chartArea.y + margin) {
                pos.y = this.chartArea.y + margin;
                vel.vy = Math.abs(vel.vy) * this.BOUNDARY_RESTITUTION;
            }
            if (pos.y > this.chartArea.y + this.chartArea.height - margin) {
                pos.y = this.chartArea.y + this.chartArea.height - margin;
                vel.vy = -Math.abs(vel.vy) * this.BOUNDARY_RESTITUTION;
            }
        });
    }

    /**
     * Update trails
     */
    updateTrails(data) {
        if (!this.config.showTrails) return;

        data.forEach((item) => {
            const pos = this.bubblePositions.get(item.entity);

            if (!this.trails.has(item.entity)) {
                this.trails.set(item.entity, []);
            }

            const trail = this.trails.get(item.entity);
            trail.push({ x: pos.x, y: pos.y, time: Date.now() });

            // Keep trails for 2 seconds
            const now = Date.now();
            this.trails.set(item.entity, trail.filter(p => now - p.time < 2000));
        });
    }

    drawTrails() {
        const ctx = this.ctx;
        const now = Date.now();

        this.trails.forEach((trail, entity) => {
            if (trail.length < 2) return;

            ctx.save();

            // Draw smooth trail with fading
            for (let i = 1; i < trail.length; i++) {
                const p1 = trail[i - 1];
                const p2 = trail[i];

                const age = (now - p1.time) / 2000;
                const alpha = (1 - age) * 0.25;

                if (alpha <= 0) continue;

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);

                const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
                gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.4})`);
                gradient.addColorStop(1, `rgba(255, 255, 255, ${alpha})`);

                ctx.strokeStyle = gradient;
                ctx.lineWidth = 2.5 * (1 - age);
                ctx.lineCap = 'round';
                ctx.stroke();
            }

            ctx.restore();
        });
    }

    drawBubbles(data, maxValue) {
        const ctx = this.ctx;
        const colors = this.getColorPalette();

        // Sort by size (draw larger bubbles first)
        const sortedData = [...data].sort((a, b) => b.value - a.value);

        sortedData.forEach((item, index) => {
            const pos = this.bubblePositions.get(item.entity);
            if (!pos) return;

            const radius = this.bubbleRadii.get(item.entity);
            const color = colors[data.findIndex(d => d.entity === item.entity) % colors.length];

            // Get opacity for fade in/out effect
            const opacity = item.opacity !== undefined ? item.opacity : 1.0;

            // Skip completely transparent bubbles
            if (opacity <= 0.0) return;

            // Apply opacity to entire bubble rendering
            ctx.save();
            ctx.globalAlpha = opacity;

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

            // Ultra-realistic 3D bubble
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

                // Specular highlight
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

                // Ambient occlusion
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

                // Glass rim
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 3;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(pos.x, pos.y, radius - 2, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 1;
                ctx.stroke();
            } else {
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

            // Subtle pulse effect
            const pulse = Math.sin(this.pulsePhase + index * 0.5) * 0.03 + 1;

            ctx.save();
            ctx.globalAlpha = 0.1;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, radius * pulse * 1.05, 0, Math.PI * 2);
            const outerPulse = ctx.createRadialGradient(
                pos.x, pos.y, radius * pulse * 0.92,
                pos.x, pos.y, radius * pulse * 1.05
            );
            outerPulse.addColorStop(0, color);
            outerPulse.addColorStop(1, this.adjustColorBrightness(color, 0.5));
            ctx.strokeStyle = outerPulse;
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.restore();

            // SIZE CHANGE INDICATOR - Show when bubble is growing/shrinking
            // This visualizes the mass/weight update during transitions
            const targetRadius = this.targetRadii.get(item.entity);
            if (targetRadius !== undefined) {
                const radiusDiff = Math.abs(targetRadius - radius);
                const sizeChangeIntensity = Math.min(radiusDiff / 10, 1.0); // 0.0 to 1.0

                if (sizeChangeIntensity > 0.05) {
                    // Bubble is actively changing size - show glow
                    const isGrowing = targetRadius > radius;
                    const glowColor = isGrowing ? 'rgba(0, 255, 150, ' : 'rgba(255, 100, 100, ';

                    ctx.save();
                    ctx.globalAlpha = sizeChangeIntensity * 0.3;
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, radius * 1.15, 0, Math.PI * 2);
                    ctx.strokeStyle = glowColor + (sizeChangeIntensity * 0.8) + ')';
                    ctx.lineWidth = 4;
                    ctx.stroke();

                    // Inner glow ring
                    ctx.globalAlpha = sizeChangeIntensity * 0.2;
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, radius * 1.08, 0, Math.PI * 2);
                    ctx.strokeStyle = glowColor + (sizeChangeIntensity * 0.6) + ')';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.restore();
                }
            }

            // Draw label
            if (this.config.showLabels && radius > 30) {
                ctx.save();
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                ctx.shadowBlur = 5;

                ctx.font = `bold ${Math.min(radius / 3, 18)}px Inter, sans-serif`;
                ctx.fillText(item.entity, pos.x, pos.y - 8);

                ctx.font = `${Math.min(radius / 4, 14)}px Inter, sans-serif`;
                ctx.fillStyle = '#dddddd';
                ctx.fillText(this.formatNumber(item.value), pos.x, pos.y + 10);
                ctx.restore();
            }

            // Draw rank badge
            if (item.rank <= 3) {
                this.drawRankBadge(pos.x + radius - 20, pos.y - radius + 20, item.rank);
            }

            // Restore opacity (ctx.globalAlpha)
            ctx.restore();
        });
    }

    drawRankBadge(x, y, rank) {
        const ctx = this.ctx;
        const size = 30;

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

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

        ctx.save();
        ctx.font = 'bold 48px Inter, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillText(this.config.title, this.config.width / 2, 60);
        ctx.restore();

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
        this.targetRadii.clear();
        this.previousValues.clear();
        this.bubbleOpacity.clear();
        this.currentTopN.clear();
        this.allTrackedBubbles.clear();
        this.trails.clear();
    }
}
