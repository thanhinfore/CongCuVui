// ========================================
// Main Application
// Orchestrates all modules and handles UI interactions
// ========================================

import { DataHandler } from './modules/dataHandler.js';
import { ChartEngine } from './modules/chartEngine.js';
import { AnimationEngine } from './modules/animationEngine.js';

class TimeSeriesRacingApp {
    constructor() {
        this.dataHandler = new DataHandler();
        this.chartEngine = null;
        this.animationEngine = null;
        this.videoRecorder = null;
        this.isRecording = false;

        this.initializeUI();
        this.attachEventListeners();

        console.log('✅ TimeSeriesRacing Web Edition initialized');
    }

    /**
     * Initialize UI elements
     */
    initializeUI() {
        this.elements = {
            // File upload
            fileInput: document.getElementById('fileInput'),
            loadSampleBtn: document.getElementById('loadSampleBtn'),

            // Configuration
            titleInput: document.getElementById('titleInput'),
            topNInput: document.getElementById('topNInput'),
            fpsInput: document.getElementById('fpsInput'),
            periodLengthInput: document.getElementById('periodLengthInput'),
            paletteSelect: document.getElementById('paletteSelect'),

            // Controls
            playBtn: document.getElementById('playBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            resetBtn: document.getElementById('resetBtn'),
            exportBtn: document.getElementById('exportBtn'),

            // Display
            dataPreview: document.getElementById('dataPreview'),
            chartCanvas: document.getElementById('chartCanvas'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            infoPanel: document.getElementById('infoPanel'),
            timeline: document.getElementById('timeline'),
            timelineProgress: document.getElementById('timelineProgress'),
            currentPeriod: document.getElementById('currentPeriod')
        };
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // File upload
        this.elements.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileUpload(e.target.files[0]);
            }
        });

        // Load sample data
        this.elements.loadSampleBtn.addEventListener('click', () => {
            this.loadSampleData();
        });

        // Controls
        this.elements.playBtn.addEventListener('click', () => this.play());
        this.elements.pauseBtn.addEventListener('click', () => this.pause());
        this.elements.resetBtn.addEventListener('click', () => this.reset());
        this.elements.exportBtn.addEventListener('click', () => this.exportVideo());

        // Configuration changes - auto-update
        [this.elements.titleInput, this.elements.topNInput, this.elements.paletteSelect]
            .forEach(elem => {
                elem.addEventListener('change', () => {
                    if (this.chartEngine && this.dataHandler.normalizedData) {
                        this.reinitializeChart();
                    }
                });
            });

        // Drag & drop support
        const uploadLabel = document.querySelector('.upload-label');
        uploadLabel.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadLabel.style.borderColor = 'var(--primary-color)';
        });
        uploadLabel.addEventListener('dragleave', () => {
            uploadLabel.style.borderColor = 'var(--border-color)';
        });
        uploadLabel.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadLabel.style.borderColor = 'var(--border-color)';
            if (e.dataTransfer.files.length > 0) {
                this.handleFileUpload(e.dataTransfer.files[0]);
            }
        });
    }

    /**
     * Handle file upload
     * @param {File} file - Uploaded file
     */
    async handleFileUpload(file) {
        if (!file.name.endsWith('.csv')) {
            this.showError('Please upload a CSV file');
            return;
        }

        this.showLoading(true);

        try {
            // Parse CSV
            const data = await this.dataHandler.parseCSV(file);

            // Validate data
            DataHandler.validateData(data);

            // Show preview
            this.showDataPreview(data);

            // Update info
            this.updateInfo(data);

            // Initialize chart
            this.initializeChart(data);

            this.showLoading(false);
            this.showSuccess(`✅ Loaded: ${data.metadata.totalPeriods} periods, ${data.metadata.totalEntities} entities`);

        } catch (error) {
            this.showLoading(false);
            this.showError(`Error loading file: ${error.message}`);
            console.error(error);
        }
    }

    /**
     * Load sample data
     */
    loadSampleData() {
        this.showLoading(true);

        setTimeout(() => {
            try {
                const data = DataHandler.generateSampleData();

                // Show preview
                this.showDataPreview(data);

                // Update info
                this.updateInfo(data);

                // Initialize chart
                this.initializeChart(data);

                this.showLoading(false);
                this.showSuccess('✅ Sample data loaded: Programming Languages Popularity');

            } catch (error) {
                this.showLoading(false);
                this.showError(`Error loading sample: ${error.message}`);
                console.error(error);
            }
        }, 500);
    }

    /**
     * Show data preview
     * @param {Object} data - Normalized data
     */
    showDataPreview(data) {
        const html = DataHandler.getDataPreview(data, 10);
        this.elements.dataPreview.innerHTML = html;
    }

    /**
     * Update info panel
     * @param {Object} data - Normalized data
     */
    updateInfo(data) {
        const html = `
            <p><strong>Format:</strong> ${data.format}</p>
            <p><strong>Periods:</strong> ${data.metadata.totalPeriods} (${data.periods[0]} - ${data.periods[data.periods.length - 1]})</p>
            <p><strong>Entities:</strong> ${data.metadata.totalEntities}</p>
            ${data.metadata.timeColumn ? `<p><strong>Time Column:</strong> ${data.metadata.timeColumn}</p>` : ''}
            ${data.metadata.description ? `<p><strong>Description:</strong> ${data.metadata.description}</p>` : ''}
        `;
        this.elements.infoPanel.innerHTML = html;
    }

    /**
     * Initialize chart and animation
     * @param {Object} data - Normalized data
     */
    initializeChart(data) {
        const config = this.getConfig();

        // Destroy existing instances
        if (this.chartEngine) {
            this.chartEngine.destroy();
        }
        if (this.animationEngine) {
            this.animationEngine.destroy();
        }

        // Create chart engine
        this.chartEngine = new ChartEngine('chartCanvas', config);
        this.chartEngine.initialize(data);

        // Create animation engine
        this.animationEngine = new AnimationEngine(this.chartEngine, config);
        this.animationEngine.createTimeline(data);

        // Set up callbacks
        this.animationEngine.onProgress((state) => {
            this.updateTimeline(state.progress);
            this.updateCurrentPeriod(state.period);
        });

        this.animationEngine.onComplete(() => {
            this.handleAnimationComplete();
        });

        // Update to first frame
        this.chartEngine.updateChart(0, 0);
        this.updateCurrentPeriod(data.periods[0]);

        // Enable controls
        this.enableControls(true);
    }

    /**
     * Reinitialize chart with new config (without reloading data)
     */
    reinitializeChart() {
        if (!this.dataHandler.normalizedData) return;

        const wasPlaying = this.animationEngine?.isPlaying;

        this.initializeChart(this.dataHandler.normalizedData);

        if (wasPlaying) {
            this.play();
        }
    }

    /**
     * Get current configuration
     * @returns {Object} Configuration object
     */
    getConfig() {
        return {
            title: this.elements.titleInput.value || 'Data Evolution',
            topN: parseInt(this.elements.topNInput.value) || 10,
            fps: parseInt(this.elements.fpsInput.value) || 30,
            periodLength: parseInt(this.elements.periodLengthInput.value) || 1000,
            palette: this.elements.paletteSelect.value || 'vibrant',
            width: 1920,
            height: 1080
        };
    }

    /**
     * Play animation
     */
    play() {
        if (!this.animationEngine) return;

        const state = this.animationEngine.getState();

        if (state.isPaused) {
            this.animationEngine.resume();
        } else {
            this.animationEngine.play();
        }

        this.updateControlButtons(true);
    }

    /**
     * Pause animation
     */
    pause() {
        if (!this.animationEngine) return;

        this.animationEngine.pause();
        this.updateControlButtons(false);
    }

    /**
     * Reset animation
     */
    reset() {
        if (!this.animationEngine) return;

        this.animationEngine.reset();
        this.updateControlButtons(false);
        this.updateTimeline(0);
    }

    /**
     * Export video
     */
    async exportVideo() {
        if (!this.animationEngine || !this.chartEngine) return;

        try {
            this.elements.exportBtn.disabled = true;
            this.elements.exportBtn.textContent = '🎥 Recording...';
            this.isRecording = true;

            // Start recording
            await this.startRecording();

            // Reset and play animation
            this.animationEngine.reset();
            this.animationEngine.play();

        } catch (error) {
            this.showError(`Export failed: ${error.message}`);
            console.error(error);
            this.elements.exportBtn.disabled = false;
            this.elements.exportBtn.textContent = '💾 Export Video (WebM)';
            this.isRecording = false;
        }
    }

    /**
     * Start video recording
     */
    async startRecording() {
        const canvas = this.chartEngine.getCanvas();
        const stream = canvas.captureStream(this.getConfig().fps);

        const chunks = [];
        this.videoRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 8000000 // 8 Mbps
        });

        this.videoRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
            }
        };

        this.videoRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            this.downloadVideo(blob);

            this.elements.exportBtn.disabled = false;
            this.elements.exportBtn.textContent = '💾 Export Video (WebM)';
            this.isRecording = false;
        };

        // Override complete callback to stop recording
        this.animationEngine.onComplete(() => {
            this.handleAnimationComplete();
            if (this.isRecording && this.videoRecorder) {
                setTimeout(() => {
                    this.videoRecorder.stop();
                }, 500); // Small delay to ensure last frame is captured
            }
        });

        this.videoRecorder.start();
    }

    /**
     * Download video blob
     * @param {Blob} blob - Video blob
     */
    downloadVideo(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chart-race-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);

        this.showSuccess('✅ Video exported successfully!');
    }

    /**
     * Handle animation complete
     */
    handleAnimationComplete() {
        this.updateControlButtons(false);
    }

    /**
     * Update control buttons state
     * @param {Boolean} isPlaying - Is animation playing
     */
    updateControlButtons(isPlaying) {
        this.elements.playBtn.textContent = isPlaying ? '⏸️ Pause' : '▶️ Play';
        this.elements.pauseBtn.disabled = !isPlaying;
    }

    /**
     * Update timeline progress bar
     * @param {Number} progress - Progress value (0-1)
     */
    updateTimeline(progress) {
        this.elements.timelineProgress.style.width = `${progress * 100}%`;
    }

    /**
     * Update current period display
     * @param {String} period - Current period
     */
    updateCurrentPeriod(period) {
        this.elements.currentPeriod.textContent = period || '';
    }

    /**
     * Enable/disable controls
     * @param {Boolean} enabled - Enable or disable
     */
    enableControls(enabled) {
        this.elements.playBtn.disabled = !enabled;
        this.elements.pauseBtn.disabled = !enabled;
        this.elements.resetBtn.disabled = !enabled;
        this.elements.exportBtn.disabled = !enabled;
    }

    /**
     * Show loading overlay
     * @param {Boolean} show - Show or hide
     */
    showLoading(show) {
        this.elements.loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    /**
     * Show error message
     * @param {String} message - Error message
     */
    showError(message) {
        alert(`❌ ${message}`);
    }

    /**
     * Show success message
     * @param {String} message - Success message
     */
    showSuccess(message) {
        console.log(message);
        // Could implement a toast notification here
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TimeSeriesRacingApp();
});
