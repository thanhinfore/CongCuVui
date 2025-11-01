// ========================================
// Main Application - v14.1 Ultimate Smooth Edition
// ✨ Persistent Bubble Tracking - NO sudden appearance/disappearance!
// 🎱 Billiard Table Physics - Mass-based collisions & boundary bounce
// 📊 Smooth Size/Mass Transitions - Dynamic weight updates during animation
// 🎨 Gorgeous UI/UX with Perfect Mobile & Desktop Support
// Orchestrates all modules and handles UI interactions
// Supports 8 visualization modes: Bar Race, Bump Chart, Stream Graph, Heat Map,
// Radial Bar, Bubble Race (v3.1 BILLIARD!), Area Race, Treemap Race
// ========================================

import { DataHandler } from './modules/dataHandler.js';
import { ChartEngine } from './modules/chartEngine.js';
import { BumpChartEngine } from './modules/bumpChartEngine.js';
import { StreamGraphEngine } from './modules/streamGraphEngine.js';
import { HeatMapEngine } from './modules/heatMapEngine.js';
import { RadialBarChartEngine } from './modules/radialBarChartEngine.js';
import { BubbleChartRaceEngine } from './modules/bubbleChartRaceEngine.js';
import { AreaChartRaceEngine } from './modules/areaChartRaceEngine.js';
import { TreemapRaceEngine } from './modules/treemapRaceEngine.js';
import { AnimationEngine } from './modules/animationEngine.js';
import { AudioEngine } from './modules/audioEngine.js';
import { UIController } from './modules/uiController.js';
import { VIDEO_RATIOS, PLATFORM_PRESETS, calculateFontSizes, getPresetConfig } from './modules/videoRatios.js';

class TimeSeriesRacingApp {
    constructor() {
        this.dataHandler = new DataHandler();
        this.chartEngine = null;
        this.animationEngine = null;
        this.audioEngine = null;
        this.uiController = null;
        this.videoRecorder = null;
        this.isRecording = false;
        this.currentRatioConfig = VIDEO_RATIOS.youtube_hd; // Default
        this.currentVisualizationMode = 'bar-race'; // v10.0: Default mode

        this.initializeAudio();
        this.initializeUI();
        this.attachEventListeners();
        this.tryLoadDefaultAudio();

        console.log('✨ TimeSeriesRacing Web Edition v14.1 Ultimate Smooth Edition initialized - Billiard Table Physics with Dynamic Mass Updates! 🎱');
    }

    /**
     * Initialize Audio Engine
     */
    initializeAudio() {
        this.audioEngine = new AudioEngine();
        console.log('🎵 Audio Engine initialized');
    }

    /**
     * Initialize UI elements
     */
    initializeUI() {
        this.elements = {
            // File upload
            fileInput: document.getElementById('fileInput'),
            loadSampleBtn: document.getElementById('loadSampleBtn'),

            // Audio (NEW v3.0)
            audioInput: document.getElementById('audioInput'),
            volumeSlider: document.getElementById('volumeSlider'),
            volumeValue: document.getElementById('volumeValue'),
            showAudioVisualizerCheck: document.getElementById('showAudioVisualizerCheck'),
            audioReactiveCheck: document.getElementById('audioReactiveCheck'),
            audioStatus: document.getElementById('audioStatus'),

            // Video Ratio (NEW v3.0)
            platformPresetSelect: document.getElementById('platformPresetSelect'),
            videoRatioSelect: document.getElementById('videoRatioSelect'),
            ratioInfo: document.getElementById('ratioInfo'),

            // Visualization Mode (NEW v10.0)
            visualizationModeSelect: document.getElementById('visualizationModeSelect'),
            modeInfo: document.getElementById('modeInfo'),
            modeTitle: document.getElementById('modeTitle'),
            modeDesc: document.getElementById('modeDesc'),
            modeUseCase: document.getElementById('modeUseCase'),

            // Configuration
            titleInput: document.getElementById('titleInput'),
            subtitleInput: document.getElementById('subtitleInput'),
            topNInput: document.getElementById('topNInput'),
            fpsInput: document.getElementById('fpsInput'),
            periodLengthInput: document.getElementById('periodLengthInput'),
            paletteSelect: document.getElementById('paletteSelect'),
            barStyleSelect: document.getElementById('barStyleSelect'),

            // Visual Effects (v2.0)
            showStatsPanelCheck: document.getElementById('showStatsPanelCheck'),
            showValueLabelsCheck: document.getElementById('showValueLabelsCheck'),
            showRankIndicatorsCheck: document.getElementById('showRankIndicatorsCheck'),
            showGrowthRateCheck: document.getElementById('showGrowthRateCheck'),
            enableShadowsCheck: document.getElementById('enableShadowsCheck'),

            // Advanced Effects (NEW v3.0)
            enableParticlesCheck: document.getElementById('enableParticlesCheck'),
            animatedBackgroundCheck: document.getElementById('animatedBackgroundCheck'),
            enableBloomCheck: document.getElementById('enableBloomCheck'),
            smoothTransitionsCheck: document.getElementById('smoothTransitionsCheck'),

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

        // Initialize UI Controller for collapsible sections (v12.0)
        this.uiController = new UIController();
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

        // Audio upload (NEW v3.0)
        this.elements.audioInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleAudioUpload(e.target.files[0]);
            }
        });

        // Volume slider (NEW v3.0)
        this.elements.volumeSlider.addEventListener('input', (e) => {
            const volume = parseInt(e.target.value);
            this.elements.volumeValue.textContent = volume;
            this.audioEngine.setVolume(volume / 100);
        });

        // Platform preset selector (NEW v3.0)
        this.elements.platformPresetSelect.addEventListener('change', (e) => {
            this.handlePlatformPresetChange(e.target.value);
        });

        // Video ratio selector (NEW v3.0)
        this.elements.videoRatioSelect.addEventListener('change', (e) => {
            this.handleVideoRatioChange(e.target.value);
        });

        // Visualization mode selector (NEW v10.0)
        this.elements.visualizationModeSelect.addEventListener('change', (e) => {
            this.handleVisualizationModeChange(e.target.value);
        });

        // Controls
        this.elements.playBtn.addEventListener('click', () => this.play());
        this.elements.pauseBtn.addEventListener('click', () => this.pause());
        this.elements.resetBtn.addEventListener('click', () => this.reset());
        this.elements.exportBtn.addEventListener('click', () => this.exportVideo());

        // Configuration changes - auto-update
        [
            this.elements.titleInput,
            this.elements.subtitleInput,
            this.elements.topNInput,
            this.elements.paletteSelect,
            this.elements.barStyleSelect,
            this.elements.showStatsPanelCheck,
            this.elements.showValueLabelsCheck,
            this.elements.showRankIndicatorsCheck,
            this.elements.showGrowthRateCheck,
            this.elements.enableShadowsCheck,
            // NEW v3.0 toggles
            this.elements.showAudioVisualizerCheck,
            this.elements.audioReactiveCheck,
            this.elements.enableParticlesCheck,
            this.elements.animatedBackgroundCheck,
            this.elements.enableBloomCheck,
            this.elements.smoothTransitionsCheck
        ].forEach(elem => {
            elem.addEventListener('change', () => {
                if (this.chartEngine && this.dataHandler.normalizedData) {
                    this.reinitializeChart();
                }
            });
        });

        // Drag & drop support for CSV (Fixed)
        const uploadLabel = document.querySelector('.upload-label');

        // Prevent default behavior for dragenter
        uploadLabel.addEventListener('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadLabel.style.borderColor = 'var(--primary-color)';
        });

        // Prevent default behavior for dragover
        uploadLabel.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadLabel.style.borderColor = 'var(--primary-color)';
        });

        // Restore styling on dragleave
        uploadLabel.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadLabel.style.borderColor = 'var(--border-color)';
        });

        // Handle drop
        uploadLabel.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadLabel.style.borderColor = 'var(--border-color)';

            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                this.handleFileUpload(file);
            }
        });

        // Prevent default drag behavior on document level
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
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
     * Try to load default background audio (NEW v3.0)
     */
    async tryLoadDefaultAudio() {
        try {
            await this.audioEngine.loadAudio('../background.wav');
            this.updateAudioStatus('loaded', '✅ Default audio loaded: background.wav');
            console.log('🎵 Default background.wav loaded');
        } catch (error) {
            // Default audio not found - this is fine
            this.updateAudioStatus('info', 'ℹ️ No audio loaded. Upload audio or use default background.wav');
            console.log('ℹ️ No default background.wav found (optional)');
        }
    }

    /**
     * Handle audio file upload (NEW v3.0)
     * @param {File} file - Audio file
     */
    async handleAudioUpload(file) {
        const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
        if (!validTypes.includes(file.type)) {
            this.showError('Please upload a valid audio file (MP3, WAV, OGG)');
            return;
        }

        try {
            this.updateAudioStatus('loading', '⏳ Loading audio...');

            // Create object URL for the file
            const audioURL = URL.createObjectURL(file);
            await this.audioEngine.loadAudio(audioURL);

            this.updateAudioStatus('loaded', `✅ Audio loaded: ${file.name}`);
            this.showSuccess(`✅ Audio loaded: ${file.name}`);
            console.log(`🎵 Audio loaded: ${file.name}`);
        } catch (error) {
            this.updateAudioStatus('error', `❌ Failed to load audio: ${error.message}`);
            this.showError(`Failed to load audio: ${error.message}`);
            console.error(error);
        }
    }

    /**
     * Update audio status display (NEW v3.0)
     * @param {String} status - Status type (info, loading, loaded, error)
     * @param {String} message - Status message
     */
    updateAudioStatus(status, message) {
        const statusEl = this.elements.audioStatus;
        statusEl.className = 'audio-status';

        if (status === 'loaded') {
            statusEl.classList.add('loaded');
        } else if (status === 'error') {
            statusEl.classList.add('error');
        }

        statusEl.innerHTML = `<small>${message}</small>`;
    }

    /**
     * Handle platform preset selection (NEW v3.0)
     * @param {String} presetKey - Platform preset key
     */
    handlePlatformPresetChange(presetKey) {
        if (!presetKey) return; // Custom mode selected

        const preset = PLATFORM_PRESETS[presetKey];
        if (!preset) return;

        // Apply preset to video ratio selector
        this.elements.videoRatioSelect.value = preset.ratioKey;

        // Update ratio config
        this.handleVideoRatioChange(preset.ratioKey);

        console.log(`📱 Platform preset applied: ${preset.name}`);
    }

    /**
     * Handle video ratio selection (NEW v3.0)
     * @param {String} ratioKey - Video ratio key
     */
    handleVideoRatioChange(ratioKey) {
        const ratioConfig = VIDEO_RATIOS[ratioKey];
        if (!ratioConfig) return;

        this.currentRatioConfig = ratioConfig;

        // Update info display
        this.elements.ratioInfo.textContent = ratioConfig.description ||
            `${ratioConfig.platform} ${ratioConfig.ratio} - ${ratioConfig.width}x${ratioConfig.height}`;

        // Reinitialize chart with new dimensions if data loaded
        if (this.chartEngine && this.dataHandler.normalizedData) {
            this.reinitializeChart();
        }

        console.log(`📐 Video ratio changed: ${ratioConfig.platform} ${ratioConfig.ratio} (${ratioConfig.width}x${ratioConfig.height})`);
    }

    /**
     * Handle visualization mode selection (NEW v10.0)
     * @param {String} mode - Visualization mode
     */
    handleVisualizationModeChange(mode) {
        this.currentVisualizationMode = mode;

        // Mode descriptions
        const modeDescriptions = {
            'bar-race': {
                title: 'Bar Chart Race:',
                desc: 'Best for viral videos and social media. Shows dramatic ranking changes with smooth animations.',
                useCase: 'Video content, presentations, storytelling',
                info: 'Engaging animated bars - perfect for video content'
            },
            'bump-chart': {
                title: 'Bump Chart:',
                desc: 'Focus on ranking changes over time. Perfect for tracking who\'s winning and trajectory analysis.',
                useCase: 'Rank tracking, sports leagues, search rankings',
                info: 'Clear rank visualization - best for analytical insights'
            },
            'stream-graph': {
                title: 'Stream Graph:',
                desc: 'Beautiful flowing visualization showing composition over time. Organic, artistic feel.',
                useCase: 'Composition analysis, music trends, social media activity',
                info: 'Artistic flow chart - perfect for aesthetic appeal'
            },
            'heat-map': {
                title: 'Heat Map:',
                desc: 'Matrix view showing all data at once. Excellent for pattern detection and comprehensive overview.',
                useCase: 'Pattern analysis, dashboards, reports',
                info: 'Comprehensive matrix view - ideal for static analysis'
            },
            'radial-bar': {
                title: 'Radial Bar Chart:',
                desc: 'Stunning circular visualization with bars radiating from center. Eye-catching and unique perspective.',
                useCase: 'Premium presentations, artistic visualizations, modern dashboards',
                info: 'Circular racing bars - mesmerizing and premium look'
            },
            'bubble-race': {
                title: 'Bubble Chart Race:',
                desc: 'Multi-dimensional animated bubbles with dynamic sizing and positioning. Engaging and playful.',
                useCase: 'Multi-metric analysis, portfolio visualization, market share tracking',
                info: 'Animated bubbles - perfect for multi-dimensional data'
            },
            'area-race': {
                title: 'Area Chart Race:',
                desc: 'Smooth stacked area chart showing composition changes over time. Elegant and informative.',
                useCase: 'Market share evolution, composition tracking, cumulative trends',
                info: 'Stacked areas - ideal for composition analysis'
            },
            'treemap-race': {
                title: 'Treemap Race:',
                desc: 'Animated rectangular tiles showing proportions. Modern and space-efficient visualization.',
                useCase: 'Market capitalization, disk usage, hierarchical data',
                info: 'Animated rectangles - efficient space utilization'
            }
        };

        const desc = modeDescriptions[mode];
        if (desc) {
            this.elements.modeInfo.textContent = desc.info;
            this.elements.modeTitle.textContent = desc.title;
            this.elements.modeDesc.textContent = desc.desc;
            this.elements.modeUseCase.innerHTML = `<strong>Use for:</strong> ${desc.useCase}`;
        }

        // Reinitialize chart with new mode if data loaded
        if (this.chartEngine && this.dataHandler.normalizedData) {
            this.reinitializeChart();
        }

        console.log(`🎨 Visualization mode changed: ${mode}`);
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
     * Initialize chart and animation (v10.0 Multi-Visualization)
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

        // v10.0: Create appropriate engine based on visualization mode
        console.log(`🎨 Creating visualization engine: ${this.currentVisualizationMode}`);

        switch (this.currentVisualizationMode) {
            case 'bump-chart':
                console.log('📈 Initializing Bump Chart Engine...');
                this.chartEngine = new BumpChartEngine('chartCanvas', config, this.audioEngine);
                break;
            case 'stream-graph':
                console.log('🌊 Initializing Stream Graph Engine...');
                this.chartEngine = new StreamGraphEngine('chartCanvas', config, this.audioEngine);
                break;
            case 'heat-map':
                console.log('🔥 Initializing Heat Map Engine...');
                this.chartEngine = new HeatMapEngine('chartCanvas', config, this.audioEngine);
                break;
            case 'radial-bar':
                console.log('🎯 Initializing Radial Bar Chart Engine...');
                this.chartEngine = new RadialBarChartEngine('chartCanvas', config, this.audioEngine);
                break;
            case 'bubble-race':
                console.log('🫧 Initializing Bubble Chart Race Engine...');
                this.chartEngine = new BubbleChartRaceEngine('chartCanvas', config, this.audioEngine);
                break;
            case 'area-race':
                console.log('📊 Initializing Area Chart Race Engine...');
                this.chartEngine = new AreaChartRaceEngine('chartCanvas', config, this.audioEngine);
                break;
            case 'treemap-race':
                console.log('🗺️ Initializing Treemap Race Engine...');
                this.chartEngine = new TreemapRaceEngine('chartCanvas', config, this.audioEngine);
                break;
            case 'bar-race':
            default:
                console.log('🏆 Initializing Bar Chart Race Engine...');
                this.chartEngine = new ChartEngine('chartCanvas', config, this.audioEngine);
                break;
        }

        console.log('📊 Initializing engine with data...');
        this.chartEngine.initialize(data);
        console.log('✅ Engine initialized successfully!');

        // Create animation engine (only for bar-race mode - others handle animation internally)
        if (this.currentVisualizationMode === 'bar-race') {
            this.animationEngine = new AnimationEngine(this.chartEngine, config, this.audioEngine);
            this.animationEngine.createTimeline(data);

            // Set up callbacks
            this.animationEngine.onProgress((state) => {
                this.updateTimeline(state.progress);
                this.updateCurrentPeriod(state.period);
            });

            this.animationEngine.onComplete(() => {
                this.handleAnimationComplete();
            });
        } else {
            // v10.0: For other modes, create simple animation timeline
            this.createSimpleAnimationEngine(data);
        }

        // Update to first frame
        this.chartEngine.updateChart(0, 0);
        this.updateCurrentPeriod(data.periods[0]);

        // Enable controls
        this.enableControls(true);
    }

    /**
     * Create simple animation engine for non-bar-race modes (v10.0)
     * @param {Object} data - Normalized data
     */
    createSimpleAnimationEngine(data) {
        const self = this; // Store reference to app instance

        // Simple animation controller without GSAP dependency
        this.animationEngine = {
            isPlaying: false,
            currentPeriod: 0,
            totalPeriods: data.periods.length,
            data: data,
            progressCallbacks: [],
            completeCallbacks: [],
            animationFrameId: null,
            startTime: null,
            pauseTime: null,

            onProgress(callback) {
                this.progressCallbacks.push(callback);
            },

            onComplete(callback) {
                this.completeCallbacks.push(callback);
            },

            play() {
                console.log('🎬 Simple animation engine: play()');
                this.isPlaying = true;
                this.startTime = performance.now();
                this.animate();
            },

            pause() {
                console.log('⏸️ Simple animation engine: pause()');
                this.isPlaying = false;
                this.pauseTime = performance.now();
                if (this.animationFrameId) {
                    cancelAnimationFrame(this.animationFrameId);
                    this.animationFrameId = null;
                }
            },

            resume() {
                console.log('▶️ Simple animation engine: resume()');
                if (this.pauseTime) {
                    const pauseDuration = performance.now() - this.pauseTime;
                    this.startTime += pauseDuration;
                    this.pauseTime = null;
                }
                this.play();
            },

            reset() {
                console.log('⏮️ Simple animation engine: reset()');
                this.isPlaying = false;
                this.currentPeriod = 0;
                this.startTime = null;
                this.pauseTime = null;
                if (this.animationFrameId) {
                    cancelAnimationFrame(this.animationFrameId);
                    this.animationFrameId = null;
                }
                if (self.chartEngine) {
                    self.chartEngine.updateChart(0, 0);
                }
            },

            animate() {
                if (!this.isPlaying) return;

                const elapsed = performance.now() - this.startTime;
                const config = self.getConfig();
                const periodDuration = config.periodLength || 2000;
                const newPeriod = Math.floor(elapsed / periodDuration);
                const progress = (elapsed % periodDuration) / periodDuration;

                if (newPeriod >= this.totalPeriods) {
                    // Animation complete
                    console.log('✅ Animation complete!');
                    this.isPlaying = false;
                    this.currentPeriod = this.totalPeriods - 1;

                    if (self.chartEngine) {
                        self.chartEngine.updateChart(this.currentPeriod, 1);
                    }

                    this.completeCallbacks.forEach(cb => cb());
                    return;
                }

                // Update current period
                if (newPeriod !== this.currentPeriod) {
                    this.currentPeriod = newPeriod;
                    console.log(`📊 Period ${newPeriod + 1}/${this.totalPeriods}: ${this.data.periods[newPeriod]}`);
                }

                // Update chart
                if (self.chartEngine) {
                    self.chartEngine.updateChart(newPeriod, progress);
                }

                // Call progress callbacks
                this.progressCallbacks.forEach(cb => {
                    cb({
                        period: this.data.periods[newPeriod],
                        progress: (newPeriod + progress) / this.totalPeriods
                    });
                });

                // Continue animation
                this.animationFrameId = requestAnimationFrame(() => this.animate());
            },

            getState() {
                return {
                    isPaused: !this.isPlaying,
                    currentPeriod: this.currentPeriod
                };
            },

            destroy() {
                console.log('🗑️ Simple animation engine: destroy()');
                this.pause();
                this.currentPeriod = 0;
                this.progressCallbacks = [];
                this.completeCallbacks = [];
            }
        };

        // Bind animate function to preserve this context
        this.animationEngine.animate = this.animationEngine.animate.bind(this.animationEngine);

        // Set up callbacks
        this.animationEngine.onProgress((state) => {
            this.updateTimeline(state.progress);
            this.updateCurrentPeriod(state.period);
        });

        this.animationEngine.onComplete(() => {
            this.handleAnimationComplete();
        });

        console.log('✅ Simple animation engine created');
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
     * Get current configuration (v3.0 Enhanced)
     * @returns {Object} Configuration object
     */
    getConfig() {
        // Apply ratio configuration
        const ratioConfig = this.currentRatioConfig || VIDEO_RATIOS.youtube_hd;
        const fontSizes = calculateFontSizes(ratioConfig);

        return {
            // Basic settings
            title: this.elements.titleInput.value || 'Data Evolution',
            subtitle: this.elements.subtitleInput.value || '',
            topN: parseInt(this.elements.topNInput.value) || 10,
            fps: parseInt(this.elements.fpsInput.value) || 30,
            periodLength: parseInt(this.elements.periodLengthInput.value) || 1000,
            palette: this.elements.paletteSelect.value || 'vibrant',
            barStyle: this.elements.barStyleSelect.value || 'gradient',

            // Visual effects (v2.0)
            showStatsPanel: this.elements.showStatsPanelCheck.checked,
            showValueLabels: this.elements.showValueLabelsCheck.checked,
            showRankIndicators: this.elements.showRankIndicatorsCheck.checked,
            showGrowthRate: this.elements.showGrowthRateCheck.checked,
            enableShadows: this.elements.enableShadowsCheck.checked,

            // Audio settings (NEW v3.0)
            showAudioVisualizer: this.elements.showAudioVisualizerCheck.checked,
            audioReactive: this.elements.audioReactiveCheck.checked,

            // Advanced effects (NEW v3.0)
            enableParticles: this.elements.enableParticlesCheck.checked,
            animatedBackground: this.elements.animatedBackgroundCheck.checked,
            enableBloom: this.elements.enableBloomCheck.checked,
            smoothTransitions: this.elements.smoothTransitionsCheck.checked,

            // Video ratio configuration (NEW v3.0)
            width: ratioConfig.width,
            height: ratioConfig.height,
            padding: ratioConfig.padding,
            fontSizes: fontSizes,
            ratioInfo: {
                ratio: ratioConfig.ratio,
                platform: ratioConfig.platform,
                orientation: ratioConfig.orientation
            }
        };
    }

    /**
     * Play animation (v3.0 with audio)
     */
    play() {
        if (!this.animationEngine) return;

        const state = this.animationEngine.getState();

        if (state.isPaused) {
            this.animationEngine.resume();
        } else {
            this.animationEngine.play();
        }

        // Play audio if loaded (NEW v3.0)
        if (this.audioEngine && this.audioEngine.isLoaded()) {
            this.audioEngine.play();
        }

        this.updateControlButtons(true);
    }

    /**
     * Pause animation (v3.0 with audio)
     */
    pause() {
        if (!this.animationEngine) return;

        this.animationEngine.pause();

        // Pause audio (NEW v3.0)
        if (this.audioEngine && this.audioEngine.isLoaded()) {
            this.audioEngine.pause();
        }

        this.updateControlButtons(false);
    }

    /**
     * Reset animation (v3.0 with audio)
     */
    reset() {
        if (!this.animationEngine) return;

        this.animationEngine.reset();

        // Stop and reset audio (NEW v3.0)
        if (this.audioEngine && this.audioEngine.isLoaded()) {
            this.audioEngine.stop();
        }

        this.updateControlButtons(false);
        this.updateTimeline(0);
    }

    /**
     * Export video (v3.0 with audio support)
     */
    async exportVideo() {
        if (!this.animationEngine || !this.chartEngine) return;

        try {
            this.elements.exportBtn.disabled = true;
            this.elements.exportBtn.textContent = '🎥 Recording...';
            this.isRecording = true;

            // Start recording
            await this.startRecording();

            // Reset animation and audio
            this.animationEngine.reset();
            if (this.audioEngine && this.audioEngine.isLoaded()) {
                this.audioEngine.stop();
            }

            // Play animation and audio together
            this.animationEngine.play();
            if (this.audioEngine && this.audioEngine.isLoaded()) {
                this.audioEngine.play();
            }

        } catch (error) {
            this.showError(`Export failed: ${error.message}`);
            console.error(error);
            this.elements.exportBtn.disabled = false;
            this.elements.exportBtn.textContent = '💾 Export Video (WebM)';
            this.isRecording = false;
        }
    }

    /**
     * Start video recording with audio (v3.0 CRITICAL FIX)
     */
    async startRecording() {
        const canvas = this.chartEngine.getCanvas();
        const fps = this.getConfig().fps;

        // Get canvas stream
        const canvasStream = canvas.captureStream(fps);
        const videoTrack = canvasStream.getVideoTracks()[0];

        let combinedStream;
        let mimeType;

        // CRITICAL: Combine video + audio streams if audio is loaded
        if (this.audioEngine && this.audioEngine.isLoaded()) {
            try {
                // Get audio stream from audio element
                const audioElement = this.audioEngine.getAudioElement();
                const audioStream = audioElement.captureStream();
                const audioTrack = audioStream.getAudioTracks()[0];

                // Create combined stream with both video and audio
                combinedStream = new MediaStream([videoTrack, audioTrack]);
                mimeType = 'video/webm;codecs=vp9,opus'; // VP9 video + Opus audio

                console.log('🎥 Recording with audio: VP9 + Opus');
            } catch (error) {
                console.warn('⚠️ Audio stream capture failed, recording video only:', error);
                combinedStream = canvasStream;
                mimeType = 'video/webm;codecs=vp9';
            }
        } else {
            // No audio loaded, record video only
            combinedStream = canvasStream;
            mimeType = 'video/webm;codecs=vp9';
            console.log('🎥 Recording video only (no audio loaded)');
        }

        // Check if browser supports the mimeType
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            console.warn(`⚠️ ${mimeType} not supported, falling back to default`);
            mimeType = 'video/webm';
        }

        const chunks = [];
        this.videoRecorder = new MediaRecorder(combinedStream, {
            mimeType: mimeType,
            videoBitsPerSecond: 8000000, // 8 Mbps for video
            audioBitsPerSecond: 128000   // 128 kbps for audio
        });

        this.videoRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
            }
        };

        this.videoRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            this.downloadVideo(blob);

            // Stop audio
            if (this.audioEngine && this.audioEngine.isLoaded()) {
                this.audioEngine.stop();
            }

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
        console.log('🎬 Recording started');
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
