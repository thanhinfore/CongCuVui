// ========================================
// Chart Engine Module - ULTIMATE DATA STORYTELLING v7.0
// Professional Cinematography: Intelligent pauses, leader crowns, overtake effects, vibrant colors
// ========================================

export class ChartEngine {
    constructor(canvasId, config, audioEngine = null) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with id '${canvasId}' not found`);
        }

        this.ctx = this.canvas.getContext('2d', { alpha: false });
        // Enable high-quality rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        this.config = this.mergeConfig(config);
        this.audioEngine = audioEngine;
        this.chart = null;
        this.data = null;
        this.previousRanks = new Map(); // Track rank changes
        this.previousValues = new Map(); // Track value changes for growth rate
        this.particles = []; // Particle effects
        this.gradientOffset = 0; // For animated gradients
        this.currentRanks = new Map(); // v4.5: Current rankings
        this.movingBars = new Set(); // v4.5: Bars currently changing position
        this.rankChangeTimers = new Map(); // v4.5: Timers for highlight duration

        // v5.5: Advanced visual tracking
        this.previousBarPositions = new Map(); // Track bar Y positions for motion trails
        this.ghostBars = new Map(); // Ghost/afterimage at previous positions
        this.movementTrails = []; // Motion trail particles
        this.barAnimationStart = new Map(); // Track when each bar started moving
        this.rankChangeDirection = new Map(); // Track direction of rank changes (up/down)

        // v6.0: Professional visualization enhancements
        this.anticipationFlashes = new Map(); // Pre-movement flash effects
        this.rankBadges = new Map(); // Rank number badges for each entity
        this.floatingLabels = new Map(); // Floating labels that follow bars
        this.changeMagnitudes = new Map(); // Size of rank change for each entity
        this.dramaticChanges = new Set(); // Entities with 5+ position changes
        this.midPointPauses = new Map(); // Mid-animation pause tracking
        this.colorBoosts = new Map(); // Enhanced saturation for moving bars

        // v7.0: Ultimate data storytelling
        this.currentLeader = null; // Track current #1 entity
        this.previousLeader = null; // Track previous #1 for overtake detection
        this.overtakeFlashes = new Map(); // Overtake flash effects
        this.leaderTransitions = []; // Leader change history
        this.isPaused = false; // Intelligent pause state
        this.pauseTimer = null; // Pause timer
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
            palette: config.palette || 'vibrant',  // v7.0: Default to vibrant (NOT pastel!)
            width: config.width || 1920,
            height: config.height || 1080,
            showStatsPanel: config.showStatsPanel === true,  // v7.0: Hidden by default (clutter!)
            showValueLabels: config.showValueLabels !== false,
            showRankIndicators: config.showRankIndicators !== false,
            showGrowthRate: config.showGrowthRate !== false,
            barStyle: config.barStyle || 'gradient',
            enableShadows: config.enableShadows !== false,
            enableParticles: config.enableParticles !== false,
            showAudioVisualizer: config.showAudioVisualizer === true,  // v7.0: Hidden by default (distracting!)
            animatedBackground: config.animatedBackground !== false,
            // v7.0: Ultimate data storytelling features
            enableLeaderCrown: config.enableLeaderCrown !== false,  // Crown for #1
            enableOvertakeFlash: config.enableOvertakeFlash !== false,  // Flash on overtakes
            intelligentPause: config.intelligentPause !== false,  // Pause on dramatic moments
            pauseDuration: config.pauseDuration || 1500,  // 1.5s pause on leader changes
            padding: config.padding || { top: 100, right: 120, bottom: 120, left: 80 },  // v7.0: Less top padding (no stats)
            fontSizes: config.fontSizes || null,
            ...config
        };
    }

    /**
     * Initialize chart with data (v5.0 Enhanced - 4K Quality)
     */
    initialize(data) {
        this.data = data;

        // v5.0: Ultra-high DPI for premium quality (2x or 3x on retina)
        const dpr = Math.min(window.devicePixelRatio || 1, 3); // Cap at 3x for performance

        // Set physical canvas size (actual pixels)
        this.canvas.width = this.config.width * dpr;
        this.canvas.height = this.config.height * dpr;

        // Set CSS display size (visual size)
        this.canvas.style.width = this.config.width + 'px';
        this.canvas.style.height = this.config.height + 'px';

        // Scale context to match DPI
        this.ctx.scale(dpr, dpr);

        // v5.0: Premium rendering quality settings
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        // v5.0: Font rendering optimization
        this.ctx.textRendering = 'optimizeLegibility';
        this.ctx.fontKerning = 'normal';

        console.log(`🎨 v7.0 Canvas initialized: ${this.canvas.width}x${this.canvas.height} (${dpr}x DPI) - Ultimate Data Storytelling`);

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
                    borderColor: colors.map(c => this.darkenColor(c, 0.4)),  // v5.0: Deeper border
                    borderWidth: 1.5,            // v5.0: Ultra-thin for glass effect
                    borderRadius: 20,            // v5.0: Maximum roundness for premium feel
                    borderSkipped: false,
                    barPercentage: 0.90,         // v5.0: Larger bars for impact
                    categoryPercentage: 0.94,    // v5.0: Optimized spacing
                    // v5.0: Multi-layer shadow for depth
                    shadowOffsetX: 0,
                    shadowOffsetY: 6,
                    shadowBlur: 20,
                    shadowColor: 'rgba(0, 0, 0, 0.25)',
                    // v5.0: Smooth edges
                    tension: 0.4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: false,
                maintainAspectRatio: false,
                // v6.0: Adaptive ultra-slow animations with anticipation
                animation: {
                    duration: (context) => {
                        // v6.0: Adaptive duration based on change magnitude
                        if (!context || !context.chart) return 2500;  // Default 2500ms

                        const dataIndex = context.dataIndex;
                        const entity = context.chart.data.labels[dataIndex];
                        const currentRank = dataIndex;
                        const previousRank = this.previousRanks.get(entity);

                        if (previousRank === undefined) return 2500;

                        const rankChange = Math.abs(currentRank - previousRank);

                        // v6.0: Dramatic changes get 2x slower (5+ positions)
                        if (rankChange >= 5) {
                            return 5000;  // 5 seconds for dramatic changes!
                        } else if (rankChange >= 3) {
                            return 3500;  // 3.5 seconds for significant changes
                        } else {
                            return 2500;  // 2.5 seconds for normal changes
                        }
                    },
                    easing: 'easeInOutQuart',  // v5.5: Slower acceleration/deceleration
                    delay: (context) => {
                        // v6.0: Anticipation delay + stagger
                        if (!context.chart) return 300;  // v6.0: Default 300ms anticipation
                        const dataIndex = context.dataIndex;
                        const entity = context.chart.data.labels[dataIndex];

                        // Get rank change distance
                        const currentRank = dataIndex;
                        const previousRank = this.previousRanks.get(entity);

                        if (previousRank === undefined) return 300;

                        const rankChange = Math.abs(currentRank - previousRank);

                        // v6.0: 300ms anticipation + 50ms per position (increased from 30ms)
                        return 300 + (rankChange * 50);
                    },
                    // v6.0: Adaptive axis animations
                    x: {
                        duration: 2000,  // v6.0: Slower value changes
                        easing: 'easeOutQuart',  // Smooth value growth
                        from: (ctx) => ctx.chart ? ctx.chart.scales.x.min : 0
                    },
                    y: {
                        duration: (context) => {
                            // v6.0: Adaptive Y-axis duration (matches main duration)
                            if (!context || !context.chart) return 2500;

                            const dataIndex = context.dataIndex;
                            const entity = context.chart.data.labels[dataIndex];
                            const currentRank = dataIndex;
                            const previousRank = this.previousRanks.get(entity);

                            if (previousRank === undefined) return 2500;

                            const rankChange = Math.abs(currentRank - previousRank);

                            if (rankChange >= 5) {
                                return 5000;  // Match main duration for consistency
                            } else if (rankChange >= 3) {
                                return 3500;
                            } else {
                                return 2500;
                            }
                        },
                        easing: 'easeInOutQuint',  // Ultra smooth ranking shifts
                        from: (ctx) => {
                            // Smooth entrance from below
                            return ctx.chart ? ctx.chart.chartArea.bottom : 0;
                        }
                    },
                    // v5.5: Progressive reveal for new bars
                    borderRadius: {
                        duration: 1000,  // v5.5: Slower shape morphing
                        easing: 'easeOutBack'  // Subtle bounce effect
                    },
                    // v5.5: Animation callbacks for tracking
                    onProgress: (animation) => {
                        // Update motion trails during animation
                        this.updateMotionTrails();
                    },
                    onComplete: (animation) => {
                        // Clean up ghost bars after animation
                        this.cleanupGhostBars();
                    }
                },
                // v5.0: Advanced transitions for interaction states
                transitions: {
                    active: {
                        animation: {
                            duration: 600,
                            easing: 'easeOutQuint'
                        }
                    },
                    resize: {
                        animation: {
                            duration: 800,
                            easing: 'easeInOutQuart'
                        }
                    },
                    show: {
                        animation: {
                            duration: 1000,
                            easing: 'easeOutCubic'
                        }
                    },
                    hide: {
                        animation: {
                            duration: 400,
                            easing: 'easeInCubic'
                        }
                    }
                },
                layout: {
                    padding: {
                        top: this.config.showStatsPanel ? this.config.padding.top : this.config.padding.top - 60,
                        right: this.config.padding.right,
                        bottom: this.config.padding.bottom,
                        left: this.config.padding.left
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
            plugins: [
                {
                    // v5.0: Multi-layer shadow system for premium depth
                    id: 'barShadows',
                    beforeDatasetsDraw: (chart) => {
                        if (!this.config.enableShadows) return;

                        const ctx = chart.ctx;
                        ctx.save();

                        // v5.0: Layer 1 - Deep ambient shadow (far)
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
                        ctx.shadowBlur = 30;
                        ctx.shadowOffsetX = 0;
                        ctx.shadowOffsetY = 10;

                        // Note: Chart.js will render bars here, then we add more in after
                    },
                    afterDatasetsDraw: (chart) => {
                        if (!this.config.enableShadows) return;

                        const ctx = chart.ctx;
                        const meta = chart.getDatasetMeta(0);

                        // v5.0: Layer 2 - Contact shadow (close)
                        meta.data.forEach((bar) => {
                            if (!bar) return;

                            ctx.save();
                            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                            ctx.shadowBlur = 8;
                            ctx.shadowOffsetX = 0;
                            ctx.shadowOffsetY = 2;

                            // Draw invisible stroke to create shadow only
                            ctx.strokeStyle = 'transparent';
                            ctx.lineWidth = 0.5;
                            ctx.strokeRect(bar.x, bar.y, bar.width, bar.height);

                            ctx.restore();
                        });

                        chart.ctx.restore();
                    }
                },
                {
                    // v6.0: Anticipation Flash - Pre-movement warning
                    id: 'anticipationFlash',
                    beforeDatasetsDraw: (chart) => {
                        if (this.anticipationFlashes.size === 0) return;

                        const ctx = chart.ctx;
                        const meta = chart.getDatasetMeta(0);
                        ctx.save();

                        // Draw flash for each entity about to move
                        this.anticipationFlashes.forEach((flashData, entity) => {
                            const { intensity, startTime } = flashData;
                            const elapsed = Date.now() - startTime;

                            // Flash for 300ms
                            if (elapsed > 300) {
                                this.anticipationFlashes.delete(entity);
                                return;
                            }

                            // Find bar
                            const barIndex = chart.data.labels.indexOf(entity);
                            if (barIndex === -1) return;

                            const bar = meta.data[barIndex];
                            if (!bar) return;

                            // Pulsing flash (0 → 1 → 0 over 300ms)
                            const progress = elapsed / 300;
                            const flashIntensity = Math.sin(progress * Math.PI) * 0.8;

                            // Draw bright flash around bar
                            ctx.shadowColor = `rgba(255, 255, 100, ${flashIntensity})`;
                            ctx.shadowBlur = 40;
                            ctx.strokeStyle = `rgba(255, 255, 100, ${flashIntensity})`;
                            ctx.lineWidth = 6;
                            ctx.strokeRect(
                                bar.x - 10,
                                bar.y - 10,
                                bar.width + 20,
                                bar.height + 20
                            );
                        });

                        ctx.restore();
                    }
                },
                {
                    // v5.5/v6.0 Enhanced: Ghost bars with higher visibility
                    id: 'ghostBars',
                    beforeDatasetsDraw: (chart) => {
                        if (this.ghostBars.size === 0) return;

                        const ctx = chart.ctx;
                        ctx.save();

                        // Draw each ghost bar
                        this.ghostBars.forEach((ghostData, entity) => {
                            const { y, height, width, x, color, opacity } = ghostData;

                            // Fade out ghost over time
                            const fadeOpacity = Math.max(0, opacity - 0.03);  // v6.0: Slower fade (was 0.05)
                            this.ghostBars.set(entity, { ...ghostData, opacity: fadeOpacity });

                            if (fadeOpacity <= 0) return;

                            // v6.0: Draw ghost bar with higher opacity (50% max vs 30%)
                            ctx.globalAlpha = fadeOpacity * 0.5;  // v6.0: Increased from 0.3
                            ctx.fillStyle = color;
                            ctx.strokeStyle = this.darkenColor(color, 0.4);
                            ctx.lineWidth = 1.5;

                            // Draw rounded rectangle for ghost
                            ctx.beginPath();
                            const radius = 20;
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
                            ctx.fill();
                            ctx.stroke();

                            // Add dashed outline to emphasize it's a ghost
                            ctx.globalAlpha = fadeOpacity * 0.5;
                            ctx.setLineDash([5, 5]);
                            ctx.strokeStyle = 'rgba(102, 126, 234, 0.6)';
                            ctx.lineWidth = 2;
                            ctx.stroke();
                            ctx.setLineDash([]);
                        });

                        ctx.globalAlpha = 1;
                        ctx.restore();
                    }
                },
                {
                    // v6.0: Enhanced Motion trails - Thicker, brighter with glow
                    id: 'motionTrails',
                    beforeDatasetsDraw: (chart) => {
                        if (this.movementTrails.length === 0) return;

                        const ctx = chart.ctx;
                        ctx.save();

                        // Draw each motion trail
                        this.movementTrails.forEach((trail) => {
                            const { fromY, toY, x, progress, color, entity } = trail;

                            // Calculate current position along the path
                            const currentY = fromY + (toY - fromY) * this.easeInOutQuint(progress);

                            // v6.0: Thicker line width (4px → 10px)
                            const lineWidth = 10;

                            // v6.0: Add glow effect
                            ctx.shadowColor = color;
                            ctx.shadowBlur = 20;

                            // Draw trail as gradient line
                            const trailGradient = ctx.createLinearGradient(x, fromY, x, currentY);
                            // v6.0: Higher opacity (0.25 → 0.4, 0.5 → 0.7)
                            trailGradient.addColorStop(0, this.rgbToRgba(color, 0));      // Transparent at start
                            trailGradient.addColorStop(0.5, this.rgbToRgba(color, 0.4));  // Semi-transparent middle
                            trailGradient.addColorStop(1, this.rgbToRgba(color, 0.7));    // More visible at current position

                            ctx.strokeStyle = trailGradient;
                            ctx.lineWidth = lineWidth;
                            ctx.lineCap = 'round';

                            // Draw curved path
                            ctx.beginPath();
                            ctx.moveTo(x, fromY);

                            // Control point for smooth curve
                            const controlX = x - 40;  // v6.0: More curve (30 → 40)
                            const controlY = (fromY + currentY) / 2;

                            ctx.quadraticCurveTo(controlX, controlY, x, currentY);
                            ctx.stroke();

                            // v6.0: Larger arrow at current position (8px → 12px)
                            const arrowSize = 12;
                            const direction = toY > fromY ? 1 : -1;  // Down or up
                            ctx.shadowBlur = 15;
                            ctx.fillStyle = this.rgbToRgba(color, 0.8);
                            ctx.beginPath();
                            ctx.moveTo(x, currentY);
                            ctx.lineTo(x - arrowSize, currentY - arrowSize * direction);
                            ctx.lineTo(x + arrowSize, currentY - arrowSize * direction);
                            ctx.closePath();
                            ctx.fill();
                        });

                        ctx.shadowBlur = 0;
                        ctx.restore();
                    }
                },
                {
                    // v4.5/v5.5 Enhanced: Moving bars highlight plugin with direction arrows
                    id: 'movingBarsHighlight',
                    afterDatasetsDraw: (chart) => {
                        if (this.movingBars.size === 0) return;

                        const ctx = chart.ctx;
                        const chartArea = chart.chartArea;
                        const meta = chart.getDatasetMeta(0);

                        ctx.save();

                        // Highlight each moving bar
                        this.movingBars.forEach((entity) => {
                            const barIndex = chart.data.labels.indexOf(entity);
                            if (barIndex === -1) return;

                            const bar = meta.data[barIndex];
                            if (!bar) return;

                            // Pulsing glow effect
                            const time = Date.now() / 1000;
                            const pulse = 0.7 + Math.sin(time * 4) * 0.3; // 0.4 to 1.0

                            // Draw outer glow
                            ctx.shadowColor = `rgba(102, 126, 234, ${pulse * 0.6})`;
                            ctx.shadowBlur = 20 * pulse;
                            ctx.strokeStyle = `rgba(102, 126, 234, ${pulse * 0.8})`;
                            ctx.lineWidth = 4;
                            ctx.strokeRect(
                                bar.x,
                                bar.y - 5,
                                bar.width,
                                bar.height + 10
                            );

                            // Inner highlight line
                            ctx.shadowBlur = 0;
                            ctx.strokeStyle = `rgba(255, 255, 255, ${pulse * 0.9})`;
                            ctx.lineWidth = 2;
                            ctx.strokeRect(
                                bar.x + 2,
                                bar.y - 3,
                                bar.width - 4,
                                bar.height + 6
                            );

                            // v6.0: Enhanced directional arrow with pulsing animation
                            const direction = this.rankChangeDirection.get(entity);
                            if (direction) {
                                const arrowX = bar.x - 60;  // v6.0: Further left for larger arrow
                                const arrowY = bar.y + bar.height / 2;
                                const arrowSize = 25;  // v6.0: Much larger (15 → 25)

                                // v6.0: Pulsing size animation
                                const time = Date.now() / 1000;
                                const pulseScale = 1 + Math.sin(time * 5) * 0.2;  // 0.8 to 1.2

                                ctx.fillStyle = direction === 'up' ? '#4CAF50' : '#f44336';
                                ctx.shadowBlur = 20 * pulseScale;  // v6.0: Larger glow
                                ctx.shadowColor = ctx.fillStyle;

                                ctx.save();
                                ctx.translate(arrowX, arrowY);
                                ctx.scale(pulseScale, pulseScale);
                                ctx.translate(-arrowX, -arrowY);

                                ctx.beginPath();
                                if (direction === 'up') {
                                    // Upward arrow (triangle)
                                    ctx.moveTo(arrowX, arrowY - arrowSize);
                                    ctx.lineTo(arrowX - arrowSize / 2, arrowY);
                                    ctx.lineTo(arrowX + arrowSize / 2, arrowY);
                                } else {
                                    // Downward arrow (triangle)
                                    ctx.moveTo(arrowX, arrowY + arrowSize);
                                    ctx.lineTo(arrowX - arrowSize / 2, arrowY);
                                    ctx.lineTo(arrowX + arrowSize / 2, arrowY);
                                }
                                ctx.closePath();
                                ctx.fill();

                                // v6.0: Add white stroke for better visibility
                                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                                ctx.lineWidth = 2;
                                ctx.stroke();

                                ctx.restore();
                            }
                        });

                        ctx.restore();
                    }
                },
                {
                    // v6.0: Rank Number Badges
                    id: 'rankBadges',
                    afterDatasetsDraw: (chart) => {
                        const ctx = chart.ctx;
                        const meta = chart.getDatasetMeta(0);
                        const chartArea = chart.chartArea;

                        ctx.save();

                        // Draw rank badge for each bar
                        chart.data.labels.forEach((entity, index) => {
                            const bar = meta.data[index];
                            if (!bar) return;

                            const rank = index + 1;  // 1-indexed

                            // Badge position (left side of bar)
                            const badgeX = chartArea.left - 100;
                            const badgeY = bar.y + bar.height / 2;
                            const badgeRadius = 22;  // Circle radius

                            // Badge colors based on rank
                            let badgeColor, textColor;
                            if (rank === 1) {
                                badgeColor = '#FFD700';  // Gold
                                textColor = '#000000';
                            } else if (rank === 2) {
                                badgeColor = '#C0C0C0';  // Silver
                                textColor = '#000000';
                            } else if (rank === 3) {
                                badgeColor = '#CD7F32';  // Bronze
                                textColor = '#FFFFFF';
                            } else {
                                badgeColor = '#667eea';  // Purple
                                textColor = '#FFFFFF';
                            }

                            // Draw circle background
                            ctx.fillStyle = badgeColor;
                            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                            ctx.shadowBlur = 10;
                            ctx.shadowOffsetY = 3;
                            ctx.beginPath();
                            ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
                            ctx.fill();

                            // Draw rank number
                            ctx.shadowBlur = 0;
                            ctx.fillStyle = textColor;
                            ctx.font = 'bold 20px Inter, sans-serif';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(`#${rank}`, badgeX, badgeY);

                            // v7.0: Leader Crown Effect
                            if (rank === 1 && this.config.enableLeaderCrown) {
                                // Draw pulsing crown above #1
                                const time = Date.now() / 1000;
                                const pulse = 1 + Math.sin(time * 3) * 0.15;  // 0.85-1.15 scale
                                const crownX = bar.x + bar.width + 20;
                                const crownY = bar.y - 15;
                                const crownSize = 30 * pulse;

                                // Enhanced glow
                                ctx.shadowColor = '#FFD700';
                                ctx.shadowBlur = 20 * pulse;
                                ctx.font = `${crownSize}px Arial`;
                                ctx.textAlign = 'left';
                                ctx.textBaseline = 'middle';
                                ctx.fillText('👑', crownX, crownY);

                                // Highlight leader bar with golden glow
                                ctx.shadowBlur = 0;
                                ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
                                ctx.lineWidth = 5;
                                ctx.strokeRect(bar.x - 5, bar.y - 5, bar.width + 10, bar.height + 10);
                            }
                        });

                        ctx.restore();
                    }
                },
                {
                    // v6.0: Floating Entity Labels
                    id: 'floatingLabels',
                    afterDatasetsDraw: (chart) => {
                        // Only show for moving bars
                        if (this.movingBars.size === 0) return;

                        const ctx = chart.ctx;
                        const meta = chart.getDatasetMeta(0);

                        ctx.save();

                        this.movingBars.forEach((entity) => {
                            const barIndex = chart.data.labels.indexOf(entity);
                            if (barIndex === -1) return;

                            const bar = meta.data[barIndex];
                            if (!bar) return;

                            // Label position (above bar)
                            const labelX = bar.x + bar.width / 2;
                            const labelY = bar.y - 30;

                            // Background pill shape
                            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                            ctx.shadowBlur = 10;
                            ctx.shadowOffsetY = 2;

                            const text = entity;
                            ctx.font = 'bold 16px Inter, sans-serif';
                            const textWidth = ctx.measureText(text).width;

                            // Draw rounded rectangle
                            const padding = 12;
                            const rectX = labelX - textWidth / 2 - padding;
                            const rectY = labelY - 12;
                            const rectWidth = textWidth + padding * 2;
                            const rectHeight = 24;
                            const radius = 12;

                            ctx.beginPath();
                            ctx.moveTo(rectX + radius, rectY);
                            ctx.lineTo(rectX + rectWidth - radius, rectY);
                            ctx.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + radius);
                            ctx.lineTo(rectX + rectWidth, rectY + rectHeight - radius);
                            ctx.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - radius, rectY + rectHeight);
                            ctx.lineTo(rectX + radius, rectY + rectHeight);
                            ctx.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - radius);
                            ctx.lineTo(rectX, rectY + radius);
                            ctx.quadraticCurveTo(rectX, rectY, rectX + radius, rectY);
                            ctx.closePath();
                            ctx.fill();

                            // Draw text
                            ctx.shadowBlur = 0;
                            ctx.fillStyle = '#FFFFFF';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(text, labelX, labelY);
                        });

                        ctx.restore();
                    }
                },
                {
                    // v5.0: Glass morphism overlay effect
                    id: 'glassMorphism',
                    afterDatasetsDraw: (chart) => {
                        const ctx = chart.ctx;
                        const meta = chart.getDatasetMeta(0);

                        ctx.save();

                        meta.data.forEach((bar, index) => {
                            if (!bar) return;

                            // v5.0: Glass highlight on top edge
                            const highlightGradient = ctx.createLinearGradient(
                                bar.x, bar.y,
                                bar.x, bar.y + 10
                            );
                            highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
                            highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                            ctx.fillStyle = highlightGradient;
                            ctx.fillRect(bar.x, bar.y, bar.width, 10);

                            // v5.0: Subtle inner glow
                            const innerGlow = ctx.createLinearGradient(
                                bar.x, bar.y,
                                bar.x, bar.y + bar.height
                            );
                            innerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
                            innerGlow.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
                            innerGlow.addColorStop(1, 'rgba(0, 0, 0, 0.1)');

                            ctx.fillStyle = innerGlow;
                            ctx.fillRect(bar.x + 2, bar.y + 2, bar.width - 4, bar.height - 4);

                            // v5.0: Specular highlight (light reflection)
                            const specular = ctx.createRadialGradient(
                                bar.x + bar.width * 0.3,
                                bar.y + bar.height * 0.2,
                                0,
                                bar.x + bar.width * 0.3,
                                bar.y + bar.height * 0.2,
                                bar.width * 0.4
                            );
                            specular.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
                            specular.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
                            specular.addColorStop(1, 'rgba(255, 255, 255, 0)');

                            ctx.fillStyle = specular;
                            ctx.fillRect(bar.x, bar.y, bar.width, bar.height * 0.5);
                        });

                        ctx.restore();
                    }
                },
                {
                    id: 'customElements',
                    beforeDraw: (chart) => {
                        // v3.0: Animated background
                        this.drawAnimatedBackground(chart);
                    },
                    afterDraw: (chart) => {
                        this.drawCustomElements(chart);
                        // v3.0: Audio visualizer
                        this.drawAudioVisualizer(chart);
                        // v3.0: Particle effects
                        this.drawParticles(chart);
                    }
                }
            ]
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
     * Create advanced gradient for bar (v5.0 Ultra Premium - 7-stop mesh-like gradient)
     */
    createGradient(color) {
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);

        // v5.0: Ultra-smooth 7-stop gradient for glass-like depth
        gradient.addColorStop(0, this.lightenColor(color, 0.6));      // Bright highlight
        gradient.addColorStop(0.15, this.lightenColor(color, 0.45));  // Soft transition
        gradient.addColorStop(0.35, this.lightenColor(color, 0.25));  // Light area
        gradient.addColorStop(0.5, color);                             // Core color
        gradient.addColorStop(0.65, this.darkenColor(color, 0.15));   // Start shadow
        gradient.addColorStop(0.85, this.darkenColor(color, 0.3));    // Deep shadow
        gradient.addColorStop(1, this.darkenColor(color, 0.4));       // Edge shadow

        return gradient;
    }

    /**
     * Darken color (v4.0 New Helper)
     */
    darkenColor(color, factor) {
        const rgb = this.hexToRgb(color);
        if (!rgb) return color;

        const r = Math.max(0, Math.floor(rgb.r * (1 - factor)));
        const g = Math.max(0, Math.floor(rgb.g * (1 - factor)));
        const b = Math.max(0, Math.floor(rgb.b * (1 - factor)));

        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * Draw background gradient (v4.0 Enhanced - More Premium Look)
     */
    drawBackgroundGradient(chart) {
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;

        // v4.0: Premium multi-stop gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, chart.height);
        gradient.addColorStop(0, '#fafbfc');
        gradient.addColorStop(0.5, '#f0f3f7');
        gradient.addColorStop(1, '#e8ecf1');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, chart.width, chart.height);

        // v4.0: Add subtle vignette effect
        const vignette = ctx.createRadialGradient(
            chart.width / 2, chart.height / 2, 0,
            chart.width / 2, chart.height / 2, chart.width * 0.8
        );
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.03)');

        ctx.fillStyle = vignette;
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

        // v6.0: Detect ranking changes with anticipation flash
        topN.forEach((pair) => {
            const entity = pair.entity;
            const newRank = currentRanks.get(entity);
            const oldRank = this.currentRanks.get(entity);

            // If rank changed, mark as moving
            if (oldRank !== undefined && oldRank !== newRank) {
                const rankChange = Math.abs(newRank - oldRank);

                // v6.0: Trigger anticipation flash
                this.anticipationFlashes.set(entity, {
                    intensity: 1.0,
                    startTime: Date.now()
                });

                // v6.0: Mark dramatic changes (5+ positions)
                if (rankChange >= 5) {
                    this.dramaticChanges.add(entity);
                    // Remove after adaptive duration (5 seconds)
                    setTimeout(() => this.dramaticChanges.delete(entity), 5000);
                }

                // v6.0: Store change magnitude
                this.changeMagnitudes.set(entity, rankChange);

                this.movingBars.add(entity);

                // v5.5: Store rank change direction
                if (newRank < oldRank) {
                    this.rankChangeDirection.set(entity, 'up');
                } else {
                    this.rankChangeDirection.set(entity, 'down');
                }

                // v5.5: Create ghost bar at previous position
                if (this.chart && this.chart.chartArea) {
                    const chartArea = this.chart.chartArea;
                    const barHeight = (chartArea.bottom - chartArea.top) / this.config.topN;
                    const oldY = chartArea.top + oldRank * barHeight;
                    const newY = chartArea.top + newRank * barHeight;

                    // Get color for this entity
                    const colors = this.getColorPalette(this.config.palette);
                    const color = colors[pair.originalIndex % colors.length];

                    // Store ghost bar data
                    const meta = this.chart.getDatasetMeta(0);
                    const currentBarIndex = topN.findIndex(p => p.entity === entity);
                    if (currentBarIndex !== -1 && meta.data[currentBarIndex]) {
                        const bar = meta.data[currentBarIndex];
                        this.ghostBars.set(entity, {
                            x: bar.x || chartArea.left,
                            y: oldY,
                            width: bar.width || 100,
                            height: barHeight - 10,
                            color: color,
                            opacity: 1.0
                        });

                        // v5.5: Create motion trail
                        // Convert hex to rgb for trail gradient
                        const rgb = this.hexToRgb(color);
                        const rgbColor = rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : color;

                        this.movementTrails.push({
                            entity: entity,
                            fromY: oldY + barHeight / 2,
                            toY: newY + barHeight / 2,
                            x: chartArea.left - 60,
                            progress: 0,
                            color: rgbColor,
                            startTime: Date.now()
                        });
                    }
                }

                // Clear any existing timer
                if (this.rankChangeTimers.has(entity)) {
                    clearTimeout(this.rankChangeTimers.get(entity));
                }

                // v6.0: Adaptive timeout based on change magnitude
                let animationDuration;
                if (rankChange >= 5) {
                    animationDuration = 5000;  // 5 seconds for dramatic changes
                } else if (rankChange >= 3) {
                    animationDuration = 3500;  // 3.5 seconds for significant changes
                } else {
                    animationDuration = 2500;  // 2.5 seconds for normal changes
                }

                // Remove from movingBars after animation completes
                const timer = setTimeout(() => {
                    this.movingBars.delete(entity);
                    this.rankChangeTimers.delete(entity);
                    this.rankChangeDirection.delete(entity);
                    this.changeMagnitudes.delete(entity);
                }, animationDuration);

                this.rankChangeTimers.set(entity, timer);

                // v4.5: Create particles for dramatic rank changes (3+ positions)
                if (Math.abs(newRank - oldRank) >= 3 && this.config.enableParticles) {
                    // Find bar position for particles
                    const barIndex = topN.findIndex(p => p.entity === entity);
                    if (barIndex !== -1 && this.chart.chartArea) {
                        const chartArea = this.chart.chartArea;
                        const barHeight = (chartArea.bottom - chartArea.top) / this.config.topN;
                        const y = chartArea.top + (barIndex + 0.5) * barHeight;
                        const x = chartArea.left + 50;

                        // Get color for this entity
                        const colors = this.getColorPalette(this.config.palette);
                        const color = colors[pair.originalIndex % colors.length];

                        // Create burst of particles
                        this.createParticles(x, y, color, 15);
                    }
                }
            }
        });

        // Update current ranks for next comparison
        this.currentRanks = new Map(currentRanks);

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
                // v3.0: Create particles for rank up
                this.createParticles(bar.x, bar.y, color, 5);
            } else if (previousRank < currentRank) {
                indicator = '↓';
                color = '#f44336'; // Red for down
                // v3.0: Create particles for rank down
                this.createParticles(bar.x, bar.y, color, 5);
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
    /**
     * Draw period label (v4.0 Enhanced - Much More Visible)
     */
    drawPeriodLabel(chart) {
        if (!this.currentPeriod) return;

        const ctx = chart.ctx;
        const chartArea = chart.chartArea;

        ctx.save();

        // v4.0: Larger, bolder font
        ctx.font = '900 100px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const x = (chartArea.left + chartArea.right) / 2;
        const y = chartArea.bottom + 70;

        // v4.0: Measure text for background
        const textMetrics = ctx.measureText(this.currentPeriod);
        const textWidth = textMetrics.width;
        const textHeight = 100;

        // v4.0: Draw background with gradient
        const bgGradient = ctx.createLinearGradient(
            x - textWidth / 2 - 40, y - textHeight / 2,
            x + textWidth / 2 + 40, y + textHeight / 2
        );
        bgGradient.addColorStop(0, 'rgba(102, 126, 234, 0.15)');
        bgGradient.addColorStop(0.5, 'rgba(118, 75, 162, 0.15)');
        bgGradient.addColorStop(1, 'rgba(102, 126, 234, 0.15)');

        ctx.fillStyle = bgGradient;
        ctx.fillRect(
            x - textWidth / 2 - 40,
            y - textHeight / 2 - 10,
            textWidth + 80,
            textHeight + 20
        );

        // v4.0: Multiple shadow layers for depth
        ctx.shadowColor = 'rgba(102, 126, 234, 0.5)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        // v4.0: Draw text with gradient fill
        const textGradient = ctx.createLinearGradient(
            x - textWidth / 2, y - textHeight / 2,
            x + textWidth / 2, y + textHeight / 2
        );
        textGradient.addColorStop(0, 'rgba(102, 126, 234, 0.85)');
        textGradient.addColorStop(0.5, 'rgba(118, 75, 162, 0.95)');
        textGradient.addColorStop(1, 'rgba(102, 126, 234, 0.85)');

        ctx.fillStyle = textGradient;
        ctx.fillText(this.currentPeriod, x, y);

        // v4.0: Add stroke for extra clarity
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = 'rgba(118, 75, 162, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeText(this.currentPeriod, x, y);

        ctx.restore();
    }

    /**
     * Ease in-out cubic function for smooth interpolation
     */
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /**
     * v5.5: Ease in-out quint function for ultra-smooth interpolation
     */
    easeInOutQuint(t) {
        return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
    }

    /**
     * v5.5: Update motion trails progress
     */
    updateMotionTrails() {
        const now = Date.now();
        const trailDuration = 2000;  // 2 seconds to match animation

        this.movementTrails = this.movementTrails.filter(trail => {
            const elapsed = now - trail.startTime;
            trail.progress = Math.min(1, elapsed / trailDuration);

            // Keep trail until animation completes
            return trail.progress < 1;
        });
    }

    /**
     * v5.5: Clean up ghost bars that have fully faded
     */
    cleanupGhostBars() {
        // Remove ghost bars with zero opacity
        this.ghostBars.forEach((ghostData, entity) => {
            if (ghostData.opacity <= 0) {
                this.ghostBars.delete(entity);
            }
        });
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
     * Convert hex color to RGB object (v5.5 Helper)
     */
    hexToRgb(hex) {
        // Remove # if present
        hex = hex.replace('#', '');

        // Handle 3-digit hex codes
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('');
        }

        if (hex.length !== 6) {
            return null;
        }

        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        return { r, g, b };
    }

    /**
     * Convert rgb()/rgba() string to rgba() with specified alpha (v5.5 Helper)
     */
    rgbToRgba(colorStr, alpha) {
        // If already rgba, extract RGB values and replace alpha
        if (colorStr.startsWith('rgba')) {
            // Extract rgb values: rgba(r, g, b, a) -> [r, g, b]
            const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (match) {
                return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
            }
        }

        // If rgb, add alpha
        if (colorStr.startsWith('rgb')) {
            // Extract rgb values: rgb(r, g, b) -> rgba(r, g, b, alpha)
            const match = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (match) {
                return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
            }
        }

        // Fallback: if it's a hex color, convert it
        if (colorStr.startsWith('#')) {
            const rgb = this.hexToRgb(colorStr);
            if (rgb) {
                return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
            }
        }

        // Default fallback
        return `rgba(0, 0, 0, ${alpha})`;
    }

    /**
     * Get canvas element for recording
     */
    getCanvas() {
        return this.canvas;
    }

    // ========================================
    // NEW v3.0 FEATURES
    // ========================================

    /**
     * Draw audio visualizer (NEW v3.0)
     */
    drawAudioVisualizer(chart) {
        if (!this.config.showAudioVisualizer || !this.audioEngine || !this.audioEngine.isPlaying) {
            return;
        }

        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        const freqData = this.audioEngine.getFrequencyData();
        if (!freqData) return;

        // Visualizer at bottom
        const vizHeight = 60;
        const vizY = chart.height - vizHeight - 20;
        const barWidth = (chartArea.right - chartArea.left) / freqData.length;

        ctx.save();

        // Draw frequency bars
        for (let i = 0; i < freqData.length; i++) {
            const barHeight = (freqData[i] / 255) * vizHeight;
            const x = chartArea.left + i * barWidth;
            const y = vizY + (vizHeight - barHeight);

            // Gradient color based on frequency
            const hue = (i / freqData.length) * 360;
            ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.7)`;
            ctx.fillRect(x, y, barWidth - 1, barHeight);
        }

        ctx.restore();
    }

    /**
     * Create particle effect for rank changes (NEW v3.0)
     */
    createParticles(x, y, color, count = 10) {
        if (!this.config.enableParticles) return;

        for (let i = 0; i < count; i++) {
            this.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4 - 2,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.02,
                size: 2 + Math.random() * 3,
                color
            });
        }
    }

    /**
     * Update particle positions (NEW v3.0)
     */
    updateParticles() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // Gravity
            p.life -= p.decay;
            return p.life > 0;
        });
    }

    /**
     * Draw particles (NEW v3.0)
     */
    drawParticles(chart) {
        if (!this.config.enableParticles || this.particles.length === 0) return;

        const ctx = chart.ctx;
        ctx.save();

        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.globalAlpha = 1;
        ctx.restore();

        this.updateParticles();
    }

    /**
     * Draw animated background gradient (NEW v3.0)
     */
    drawAnimatedBackground(chart) {
        if (!this.config.animatedBackground) {
            // Fallback to static gradient
            this.drawBackgroundGradient(chart);
            return;
        }

        const ctx = chart.ctx;

        // Animate gradient offset
        this.gradientOffset += 0.001;
        if (this.gradientOffset > 1) this.gradientOffset = 0;

        // Create animated gradient
        const gradient = ctx.createLinearGradient(
            0,
            chart.height * this.gradientOffset,
            0,
            chart.height * (1 + this.gradientOffset)
        );

        // Color based on audio if available
        let color1 = '#f8f9fa';
        let color2 = '#e9ecef';

        if (this.audioEngine && this.audioEngine.isPlaying) {
            const bass = this.audioEngine.getBass();
            const intensity = bass / 255;

            // Subtle color shift based on bass
            const r1 = Math.floor(248 - intensity * 20);
            const g1 = Math.floor(249 - intensity * 20);
            const b1 = Math.floor(250 - intensity * 20);

            color1 = `rgb(${r1}, ${g1}, ${b1})`;
            color2 = '#e9ecef';
        }

        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, chart.width, chart.height);
    }

    /**
     * Add glow effect to bars based on audio (NEW v3.0)
     */
    addAudioReactiveGlow(chart) {
        if (!this.audioEngine || !this.audioEngine.isPlaying) return;

        const ctx = chart.ctx;
        const meta = chart.getDatasetMeta(0);
        const bass = this.audioEngine.getBass();
        const glowIntensity = (bass / 255) * 20;

        if (glowIntensity < 5) return; // Skip if too weak

        ctx.save();
        ctx.shadowBlur = glowIntensity;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';

        // Redraw bars with glow (simplified)
        meta.data.forEach((bar, index) => {
            const colors = this.getColorPalette(this.config.palette);
            const color = colors[index % colors.length];
            ctx.shadowColor = color;
            // Note: Actual glow is handled by Chart.js shadow settings
        });

        ctx.restore();
    }

    /**
     * Auto-scale font sizes based on canvas dimensions (NEW v3.0)
     */
    getFontSize(baseSize) {
        if (this.config.fontSizes) {
            // Use pre-calculated font sizes from ratio config
            return baseSize;
        }

        // Auto-scale based on resolution
        const baseWidth = 1920;
        const scale = this.config.width / baseWidth;
        return Math.max(12, baseSize * scale);
    }

    /**
     * Destroy chart instance
     */
    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        this.particles = [];

        // v5.5: Clean up visual tracking structures
        this.previousBarPositions.clear();
        this.ghostBars.clear();
        this.movementTrails = [];
        this.barAnimationStart.clear();
        this.rankChangeDirection.clear();
        this.movingBars.clear();
        this.rankChangeTimers.forEach(timer => clearTimeout(timer));
        this.rankChangeTimers.clear();

        // v6.0: Clean up professional visualization structures
        this.anticipationFlashes.clear();
        this.rankBadges.clear();
        this.floatingLabels.clear();
        this.changeMagnitudes.clear();
        this.dramaticChanges.clear();
        this.midPointPauses.clear();
        this.colorBoosts.clear();
    }
}
