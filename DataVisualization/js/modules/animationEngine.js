// ========================================
// Animation Engine Module
// Handles GSAP timeline and animation control
// ========================================

export class AnimationEngine {
    constructor(chartEngine, config) {
        this.chartEngine = chartEngine;
        this.config = config;
        this.timeline = null;
        this.isPlaying = false;
        this.isPaused = false;
        this.currentPeriodIndex = 0;
        this.onProgressCallback = null;
        this.onCompleteCallback = null;
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
        this.timeline = gsap.timeline({
            paused: true,
            onUpdate: () => this.handleUpdate(),
            onComplete: () => this.handleComplete()
        });

        const periodDuration = this.config.periodLength / 1000; // Convert to seconds
        const stepsPerPeriod = Math.ceil(this.config.fps * periodDuration);

        // Create animation for each period
        data.periods.forEach((period, index) => {
            this.timeline.to(this, {
                duration: periodDuration,
                ease: 'none',
                onStart: () => {
                    this.currentPeriodIndex = index;
                },
                onUpdate: () => {
                    // Calculate progress within current period (0-1)
                    const timelineProgress = this.timeline.progress();
                    const periodProgress = (timelineProgress * data.periods.length) % 1;

                    // Update chart with interpolated values
                    this.chartEngine.updateChart(this.currentPeriodIndex, periodProgress);

                    // Callback for UI updates (timeline bar, period display)
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
