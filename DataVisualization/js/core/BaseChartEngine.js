// ========================================
// Base Chart Engine - v15.0 Architecture Upgrade
// Abstract base class for all chart engines
// Implements Template Method pattern
// Eliminates constructor and initialization duplication
// ========================================

import { EventEmitter, ChartEvents } from './EventEmitter.js';
import { CanvasUtils } from '../utils/drawingUtilities.js';
import { ConfigUtils, getColorPalette } from '../utils/chartUtilities.js';

/**
 * BaseChartEngine - Abstract base class for all chart types
 *
 * Provides common functionality:
 * - Canvas setup with DPI scaling
 * - Configuration management
 * - Event system
 * - Lifecycle management
 * - Common drawing utilities
 *
 * Subclasses must implement:
 * - getDefaultConfig()
 * - updateChart(periodIndex, progress)
 */
export class BaseChartEngine extends EventEmitter {
    /**
     * Constructor
     * @param {string} canvasId - ID of canvas element
     * @param {Object} config - Chart configuration
     * @param {Object} audioEngine - Audio engine instance (optional)
     */
    constructor(canvasId, config = {}, audioEngine = null) {
        super(); // Initialize EventEmitter

        this.canvasId = canvasId;
        this.canvas = document.getElementById(canvasId);

        if (!this.canvas) {
            throw new Error(`Canvas element with id '${canvasId}' not found`);
        }

        // Merge config with defaults
        this.config = this.mergeConfig(config);

        // Audio engine reference
        this.audioEngine = audioEngine;

        // Chart data
        this.data = null;

        // Canvas context (will be set during initialize)
        this.ctx = null;

        // Chart area dimensions
        this.chartArea = null;

        // State
        this.initialized = false;
        this.destroyed = false;
    }

    /**
     * Get default configuration (must be implemented by subclasses)
     * @returns {Object} Default configuration object
     */
    getDefaultConfig() {
        return {
            // Common defaults
            title: 'Chart',
            subtitle: '',
            width: 1920,
            height: 1080,
            fps: 60,
            periodLength: 1000,
            palette: 'vibrant',

            // Padding
            padding: { top: 120, right: 100, bottom: 120, left: 100 },

            // Visual options
            showLabels: true,
            enableShadows: true,
            enable3DEffect: true,
            animatedBackground: false,

            // Font sizes
            fontSizes: null
        };
    }

    /**
     * Merge user config with defaults
     * @param {Object} userConfig - User-provided configuration
     * @returns {Object} Merged configuration
     */
    mergeConfig(userConfig) {
        const defaults = this.getDefaultConfig();
        return ConfigUtils.mergeConfig(defaults, userConfig);
    }

    /**
     * Initialize chart with data
     * @param {Object} data - Chart data { entities, periods, values }
     */
    initialize(data) {
        if (this.initialized) {
            console.warn('Chart already initialized');
            return;
        }

        this.data = data;

        // Setup canvas with DPI scaling
        this.ctx = CanvasUtils.setupCanvas(
            this.canvas,
            this.config.width,
            this.config.height
        );

        // Calculate chart area
        this.chartArea = CanvasUtils.calculateChartArea(
            this.config.width,
            this.config.height,
            this.config.padding
        );

        this.initialized = true;

        // Call subclass initialization hook
        this.onInitialize();

        // Emit initialization event
        this.emit(ChartEvents.INITIALIZED, {
            engine: this.constructor.name,
            data: this.data,
            config: this.config
        });

        console.log(`✨ ${this.constructor.name} initialized:`, {
            periods: data.periods.length,
            entities: data.entities.length,
            chartArea: this.chartArea
        });
    }

    /**
     * Hook for subclass-specific initialization
     * Override this in subclasses if needed
     */
    onInitialize() {
        // Override in subclasses
    }

    /**
     * Update chart for current period and progress
     * MUST be implemented by subclasses
     * @param {number} periodIndex - Current period index
     * @param {number} progress - Animation progress (0.0 to 1.0)
     */
    updateChart(periodIndex, progress) {
        throw new Error('updateChart() must be implemented by subclass');
    }

    /**
     * Resize chart
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        this.config.width = width;
        this.config.height = height;

        // Re-setup canvas
        this.ctx = CanvasUtils.setupCanvas(this.canvas, width, height);

        // Recalculate chart area
        this.chartArea = CanvasUtils.calculateChartArea(
            width,
            height,
            this.config.padding
        );

        this.emit(ChartEvents.RESIZE, { width, height });
    }

    /**
     * Update configuration
     * @param {Object} newConfig - New configuration values
     */
    updateConfig(newConfig) {
        const oldConfig = { ...this.config };
        this.config = ConfigUtils.mergeConfig(this.config, newConfig);

        this.emit(ChartEvents.CONFIG_CHANGE, {
            oldConfig,
            newConfig: this.config
        });
    }

    /**
     * Get color palette
     * @returns {Array<string>} Color palette
     */
    getColorPalette() {
        return getColorPalette(this.config.palette);
    }

    /**
     * Clear canvas
     * @param {string} backgroundColor - Background color (optional)
     */
    clearCanvas(backgroundColor = '#0a0e27') {
        CanvasUtils.clearCanvas(
            this.ctx,
            this.config.width,
            this.config.height,
            backgroundColor
        );
    }

    /**
     * Check if chart is initialized
     * @returns {boolean}
     */
    isInitialized() {
        return this.initialized && !this.destroyed;
    }

    /**
     * Destroy chart and clean up resources
     */
    destroy() {
        if (this.destroyed) return;

        // Call subclass cleanup hook
        this.onDestroy();

        // Clean up
        this.data = null;
        this.ctx = null;
        this.chartArea = null;
        this.destroyed = true;
        this.initialized = false;

        // Emit destroy event
        this.emit(ChartEvents.DESTROYED, {
            engine: this.constructor.name
        });

        // Remove all event listeners
        this.removeAllListeners();

        console.log(`🗑️ ${this.constructor.name} destroyed`);
    }

    /**
     * Hook for subclass-specific cleanup
     * Override this in subclasses if needed
     */
    onDestroy() {
        // Override in subclasses
    }

    /**
     * Get current data
     * @returns {Object} Chart data
     */
    getData() {
        return this.data;
    }

    /**
     * Get current config
     * @returns {Object} Chart configuration
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Get canvas context
     * @returns {CanvasRenderingContext2D}
     */
    getContext() {
        return this.ctx;
    }

    /**
     * Get chart area dimensions
     * @returns {Object} Chart area { x, y, width, height }
     */
    getChartArea() {
        return { ...this.chartArea };
    }
}

console.log('✨ Base Chart Engine v15.0 loaded - Abstract base class for all engines');
