// ========================================
// Animation Engine Module
// Handles GSAP timeline and animation control
// ========================================

export class AnimationEngine {
    constructor(chartEngine, config, audioEngine = null) {
        this.chartEngine = chartEngine;
        this.config = config;
        this.audioEngine = audioEngine;  // v4.0: Audio engine for fade out
        this.timeline = null;
        this.isPlaying = false;
        this.isPaused = false;
        this.currentPeriodIndex = 0;
        this.onProgressCallback = null;
        this.onCompleteCallback = null;
        this.fadeOutStarted = false;    // v4.0: Track fade out state
    }

    /**
     * Create GSAP timeline for animation
     * @param {Object} data - Normalized data
     */
    createTimeline(data) {
        if (!data || !data.periods) {
            throw new Error('Invalid data for animation');
        }

        this.data = data;

        // v7.0 Phase 3 FIXED: Force GSAP to run at 60 FPS for ultra-smooth updates
        gsap.ticker.fps(60);

        this.timeline = gsap.timeline({
            paused: true,
            onUpdate: () => this.handleUpdate(),
            onComplete: () => this.handleComplete()
        });

        const periodDuration = this.config.periodLength / 1000; // Convert to seconds
        const stepsPerPeriod = Math.ceil(this.config.fps * periodDuration);

        // v7.0 Phase 3 FIXED: Use expo easing for ultra-smooth motion (matches chartEngine)
        // Create animation for each period
        data.periods.forEach((period, index) => {
            this.timeline.to(this, {
                duration: periodDuration,
                ease: 'expo.inOut',  // v7.0 Phase 3: Exponential easing for smoothest motion
                onStart: () => {
                    this.currentPeriodIndex = index;

                    // v7.0 Phase 3 FIXED: Update chart ONCE at start of period
                    // Chart.js will smoothly animate to new state over periodDuration
                    // This eliminates 60fps re-sort jumps
                    this.chartEngine.updateChart(index, 1);  // progress=1 means show end state of this period
                },
                onUpdate: () => {
                    // Calculate progress within current period (0-1)
                    const timelineProgress = this.timeline.progress();
                    const periodProgress = (timelineProgress * data.periods.length) % 1;

                    // v4.0: Start audio fade out at 80% progress
                    if (!this.fadeOutStarted && timelineProgress >= 0.80) {
                        this.fadeOutStarted = true;
                        if (this.audioEngine && this.audioEngine.isLoaded()) {
                            this.audioEngine.startFadeOut(3); // 3 second fade out
                            console.log('🔉 Audio fade out started at 80% progress');
                        }
                    }

                    // v7.0 Phase 3 FIXED: Don't update chart every frame - let Chart.js animate smoothly
                    // Only update UI elements (timeline bar, period display)
                    if (this.onProgressCallback) {
                        this.onProgressCallback({
                            periodIndex: this.currentPeriodIndex,
                            period: period,
                            progress: timelineProgress,
                            periodProgress: periodProgress
                        });
                    }
                }
            });
        });

        // v4.0: Add 5-second freeze frame at the end
        this.timeline.to(this, {
            duration: 5,
            ease: 'none',
            onStart: () => {
                console.log('📸 Freeze frame: Showing final results for 5 seconds');
            },
            onUpdate: () => {
                // Keep showing the last frame
                const lastPeriodIndex = data.periods.length - 1;
                this.chartEngine.updateChart(lastPeriodIndex, 1);

                // Update progress for UI
                if (this.onProgressCallback) {
                    this.onProgressCallback({
                        periodIndex: lastPeriodIndex,
                        period: data.periods[lastPeriodIndex],
                        progress: this.timeline.progress(),
                        periodProgress: 1
                    });
                }
            }
        });

        return this.timeline;
    }

    /**
     * Play animation
     */
    play() {
        if (!this.timeline) {
            console.error('Timeline not created. Call createTimeline() first.');
            return;
        }

        this.isPlaying = true;
        this.isPaused = false;
        this.timeline.play();
    }

    /**
     * Pause animation
     */
    pause() {
        if (!this.timeline) return;

        this.isPlaying = false;
        this.isPaused = true;
        this.timeline.pause();
    }

    /**
     * Resume animation
     */
    resume() {
        if (!this.timeline || !this.isPaused) return;

        this.isPlaying = true;
        this.isPaused = false;
        this.timeline.resume();
    }

    /**
     * Reset animation to beginning
     */
    reset() {
        if (!this.timeline) return;

        this.isPlaying = false;
        this.isPaused = false;
        this.currentPeriodIndex = 0;
        this.fadeOutStarted = false;  // v4.0: Reset fade out flag

        // v4.0: Cancel any ongoing fade out
        if (this.audioEngine) {
            this.audioEngine.cancelFadeOut();
        }

        this.timeline.restart();
        this.timeline.pause();

        // Update to first frame
        this.chartEngine.updateChart(0, 0);

        if (this.onProgressCallback) {
            this.onProgressCallback({
                periodIndex: 0,
                period: this.data.periods[0],
                progress: 0,
                periodProgress: 0
            });
        }
    }

    /**
     * Seek to specific time/period
     * @param {Number} progress - Progress value (0-1)
     */
    seek(progress) {
        if (!this.timeline) return;

        this.timeline.progress(progress);
    }

    /**
     * Handle timeline update
     */
    handleUpdate() {
        // Additional update logic if needed
    }

    /**
     * Handle timeline completion
     */
    handleComplete() {
        this.isPlaying = false;
        this.isPaused = false;

        if (this.onCompleteCallback) {
            this.onCompleteCallback();
        }
    }

    /**
     * Set progress callback
     * @param {Function} callback - Callback function
     */
    onProgress(callback) {
        this.onProgressCallback = callback;
    }

    /**
     * Set complete callback
     * @param {Function} callback - Callback function
     */
    onComplete(callback) {
        this.onCompleteCallback = callback;
    }

    /**
     * Get current state
     * @returns {Object} Current state
     */
    getState() {
        return {
            isPlaying: this.isPlaying,
            isPaused: this.isPaused,
            currentPeriodIndex: this.currentPeriodIndex,
            currentPeriod: this.data?.periods[this.currentPeriodIndex],
            progress: this.timeline?.progress() || 0
        };
    }

    /**
     * Destroy timeline
     */
    destroy() {
        if (this.timeline) {
            this.timeline.kill();
            this.timeline = null;
        }
    }
}
