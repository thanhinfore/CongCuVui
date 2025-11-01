// ========================================
// VISUAL EFFECTS LIBRARY v2.0
// Universal library for premium visual effects across all visualization engines
// Includes: Advanced easing, particle systems, bloom effects, motion blur
// ========================================

export class VisualEffectsLib {

    // ========================================
    // ADVANCED EASING FUNCTIONS
    // ========================================

    static easing = {
        // Existing cubic
        easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

        // Quart easing
        easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,

        // Quint easing
        easeInOutQuint: (t) => t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2,

        // Elastic easing
        easeOutElastic: (t) => {
            const c5 = (2 * Math.PI) / 4.5;
            return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c5) + 1;
        },

        easeInElastic: (t) => {
            const c5 = (2 * Math.PI) / 4.5;
            return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c5);
        },

        // Bounce easing
        easeOutBounce: (t) => {
            const n1 = 7.5625, d1 = 2.75;
            if (t < 1 / d1) return n1 * t * t;
            if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
            if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        },

        easeInBounce: (t) => 1 - VisualEffectsLib.easing.easeOutBounce(1 - t),

        // Expo easing
        easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
        easeInExpo: (t) => t === 0 ? 0 : Math.pow(2, 10 * t - 10),

        // Back easing (overshoot)
        easeOutBack: (t) => {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        },

        easeInOutBack: (t) => {
            const c1 = 1.70158;
            const c2 = c1 * 1.525;
            return t < 0.5
                ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
                : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
        }
    };

    // ========================================
    // PARTICLE SYSTEM
    // ========================================

    static createParticleSystem() {
        return {
            particles: [],

            emit(x, y, color, options = {}) {
                const count = options.count || 5;
                const speed = options.speed || 2;
                const size = options.size || 2;
                const spread = options.spread || Math.PI * 2;
                const direction = options.direction || 0;
                const gravity = options.gravity !== undefined ? options.gravity : 0.1;

                for (let i = 0; i < count; i++) {
                    const angle = direction + (spread * (i / count)) - spread / 2 + (Math.random() - 0.5) * 0.3;
                    const particleSpeed = speed + Math.random() * speed * 0.5;

                    this.particles.push({
                        x: x + (Math.random() - 0.5) * 10,
                        y: y + (Math.random() - 0.5) * 10,
                        vx: Math.cos(angle) * particleSpeed,
                        vy: Math.sin(angle) * particleSpeed,
                        life: 1,
                        maxLife: 1,
                        color: color,
                        size: size + Math.random() * size * 0.5,
                        rotation: Math.random() * Math.PI * 2,
                        rotationSpeed: (Math.random() - 0.5) * 0.2,
                        gravity: gravity,
                        decay: 0.02 + Math.random() * 0.01
                    });
                }
            },

            update() {
                this.particles = this.particles.filter(p => {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += p.gravity;
                    p.vx *= 0.99;
                    p.vy *= 0.99;
                    p.life -= p.decay;
                    p.size *= 0.98;
                    p.rotation += p.rotationSpeed;

                    return p.life > 0;
                });
            },

            draw(ctx) {
                this.particles.forEach(p => {
                    ctx.save();
                    ctx.globalAlpha = p.life * 0.7;
                    ctx.fillStyle = p.color;
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rotation);
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                });
            },

            clear() {
                this.particles = [];
            }
        };
    }

    // ========================================
    // BLOOM / GLOW EFFECTS
    // ========================================

    static drawBloom(ctx, x, y, radius, color, intensity = 1) {
        ctx.save();

        // Layer 1: Intense inner glow
        ctx.globalAlpha = 0.5 * intensity;
        ctx.shadowColor = VisualEffectsLib.adjustColorBrightness(color, 1.8);
        ctx.shadowBlur = 30 * intensity;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = VisualEffectsLib.adjustColorBrightness(color, 1.5);
        ctx.fill();

        // Layer 2: Mid bloom
        ctx.globalAlpha = 0.3 * intensity;
        ctx.shadowColor = color;
        ctx.shadowBlur = 40 * intensity;
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.1, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Layer 3: Outer soft halo
        ctx.globalAlpha = 0.15 * intensity;
        ctx.shadowColor = color;
        ctx.shadowBlur = 60 * intensity;
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.4, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.restore();
    }

    static drawRectBloom(ctx, x, y, width, height, color, intensity = 1) {
        ctx.save();

        // Multi-layer rectangular bloom
        const layers = [
            { blur: 40, alpha: 0.3, offset: 8 },
            { blur: 25, alpha: 0.4, offset: 4 },
            { blur: 12, alpha: 0.5, offset: 2 }
        ];

        layers.forEach(layer => {
            ctx.globalAlpha = layer.alpha * intensity;
            ctx.shadowColor = color;
            ctx.shadowBlur = layer.blur * intensity;
            ctx.fillStyle = color;
            ctx.fillRect(
                x - layer.offset,
                y - layer.offset,
                width + layer.offset * 2,
                height + layer.offset * 2
            );
        });

        ctx.restore();
    }

    // ========================================
    // ADVANCED GRADIENT CREATORS
    // ========================================

    static createAdvancedLinearGradient(ctx, x1, y1, x2, y2, color, stops = 7) {
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);

        for (let i = 0; i < stops; i++) {
            const position = i / (stops - 1);
            let brightness;

            if (position < 0.15) brightness = 0.85;
            else if (position < 0.35) brightness = 0.7;
            else if (position < 0.5) brightness = 1.0;
            else if (position < 0.7) brightness = 0.8;
            else if (position < 0.85) brightness = 0.55;
            else brightness = 0.35;

            gradient.addColorStop(position, VisualEffectsLib.adjustColorOpacity(
                VisualEffectsLib.adjustColorBrightness(color, brightness),
                0.75 - position * 0.35
            ));
        }

        return gradient;
    }

    static createAdvancedRadialGradient(ctx, x, y, innerRadius, outerRadius, color) {
        const gradient = ctx.createRadialGradient(
            x - outerRadius * 0.3,
            y - outerRadius * 0.3,
            innerRadius,
            x, y,
            outerRadius
        );

        gradient.addColorStop(0, VisualEffectsLib.adjustColorBrightness(color, 2.2));
        gradient.addColorStop(0.1, VisualEffectsLib.adjustColorBrightness(color, 1.8));
        gradient.addColorStop(0.25, VisualEffectsLib.adjustColorBrightness(color, 1.4));
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(0.75, VisualEffectsLib.adjustColorBrightness(color, 0.7));
        gradient.addColorStop(0.9, VisualEffectsLib.adjustColorBrightness(color, 0.4));
        gradient.addColorStop(1, VisualEffectsLib.adjustColorBrightness(color, 0.25));

        return gradient;
    }

    // ========================================
    // MULTI-LAYER SHADOW SYSTEM
    // ========================================

    static drawMultiLayerShadow(ctx, drawFunction, options = {}) {
        const layers = options.layers || [
            { blur: 25, offsetX: 4, offsetY: 6, alpha: 0.15 },
            { blur: 15, offsetX: 2, offsetY: 4, alpha: 0.25 },
            { blur: 8, offsetX: 1, offsetY: 2, alpha: 0.35 }
        ];

        ctx.save();

        layers.forEach(layer => {
            ctx.shadowColor = `rgba(0, 0, 0, ${layer.alpha})`;
            ctx.shadowBlur = layer.blur;
            ctx.shadowOffsetX = layer.offsetX;
            ctx.shadowOffsetY = layer.offsetY;
            drawFunction(ctx);
        });

        ctx.restore();
    }

    // ========================================
    // COLOR MANIPULATION UTILITIES
    // ========================================

    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    static adjustColorBrightness(color, factor) {
        const rgb = VisualEffectsLib.hexToRgb(color);
        if (!rgb) return color;

        const r = Math.min(255, Math.max(0, Math.round(rgb.r * factor)));
        const g = Math.min(255, Math.max(0, Math.round(rgb.g * factor)));
        const b = Math.min(255, Math.max(0, Math.round(rgb.b * factor)));

        return VisualEffectsLib.rgbToHex(r, g, b);
    }

    static adjustColorOpacity(color, opacity) {
        const rgb = VisualEffectsLib.hexToRgb(color);
        if (!rgb) return color;

        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    }

    // ========================================
    // MOTION BLUR SYSTEM
    // ========================================

    static createMotionBlurTracker() {
        return {
            positions: new Map(),

            track(id, x, y) {
                this.positions.set(id, { x, y, timestamp: Date.now() });
            },

            get(id) {
                return this.positions.get(id) || null;
            },

            drawMotionBlur(ctx, id, currentX, currentY, drawFunction, options = {}) {
                const prev = this.get(id);
                if (!prev) return;

                const dx = currentX - prev.x;
                const dy = currentY - prev.y;
                const distance = Math.hypot(dx, dy);

                const threshold = options.threshold || 3;
                const frames = options.frames || 3;
                const alpha = options.alpha || 0.15;

                if (distance > threshold) {
                    for (let i = 1; i < frames; i++) {
                        const t = i / frames;
                        const blurX = prev.x + dx * t;
                        const blurY = prev.y + dy * t;

                        ctx.save();
                        ctx.globalAlpha = alpha * (1 - t);
                        drawFunction(ctx, blurX, blurY, t);
                        ctx.restore();
                    }
                }
            },

            clear() {
                // Remove old entries (older than 1 second)
                const now = Date.now();
                this.positions.forEach((value, key) => {
                    if (now - value.timestamp > 1000) {
                        this.positions.delete(key);
                    }
                });
            }
        };
    }

    // ========================================
    // PERFORMANCE MONITORING
    // ========================================

    static createPerformanceMonitor() {
        return {
            frameCount: 0,
            frameTimes: [],
            lastTime: performance.now(),
            fps: 60,
            averageFrameTime: 0,

            update() {
                const now = performance.now();
                const deltaTime = now - this.lastTime;
                this.frameTimes.push(deltaTime);

                // Keep last 60 frames
                if (this.frameTimes.length > 60) {
                    this.frameTimes.shift();
                }

                // Calculate average
                this.averageFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
                this.fps = Math.round(1000 / this.averageFrameTime);

                this.frameCount++;
                this.lastTime = now;
            },

            draw(ctx, x = 10, y = 20) {
                ctx.save();
                ctx.font = '12px monospace';
                ctx.fillStyle = this.fps >= 55 ? '#00ff00' : this.fps >= 30 ? '#ffaa00' : '#ff0000';
                ctx.fillText(`FPS: ${this.fps}`, x, y);
                ctx.fillStyle = '#ffffff';
                ctx.fillText(`Frame: ${this.averageFrameTime.toFixed(1)}ms`, x, y + 15);
                ctx.restore();
            },

            reset() {
                this.frameCount = 0;
                this.frameTimes = [];
                this.lastTime = performance.now();
            }
        };
    }

    // ========================================
    // ENHANCED TYPOGRAPHY
    // ========================================

    static drawEnhancedText(ctx, text, x, y, options = {}) {
        const fontSize = options.fontSize || 24;
        const fontFamily = options.fontFamily || 'Inter, sans-serif';
        const fontWeight = options.fontWeight || 'bold';
        const color = options.color || '#ffffff';
        const shadowLayers = options.shadowLayers || 3;
        const useGradient = options.useGradient || false;

        ctx.save();
        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.textAlign = options.align || 'center';
        ctx.textBaseline = options.baseline || 'middle';

        // Multi-layer shadow
        for (let i = shadowLayers; i > 0; i--) {
            ctx.shadowColor = `rgba(0, 0, 0, ${0.4 * (i / shadowLayers)})`;
            ctx.shadowBlur = 12 - (shadowLayers - i) * 3;
            ctx.shadowOffsetY = 2 + i;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.7 + i * 0.08})`;
            ctx.fillText(text, x, y);
        }

        // Final bright text with optional gradient
        ctx.shadowBlur = 0;
        if (useGradient) {
            const textGradient = ctx.createLinearGradient(x, y - fontSize / 2, x, y + fontSize / 2);
            textGradient.addColorStop(0, VisualEffectsLib.adjustColorBrightness(color, 1.3));
            textGradient.addColorStop(0.5, color);
            textGradient.addColorStop(1, VisualEffectsLib.adjustColorBrightness(color, 0.8));
            ctx.fillStyle = textGradient;
        } else {
            ctx.fillStyle = color;
        }
        ctx.fillText(text, x, y);

        ctx.restore();
    }
}
