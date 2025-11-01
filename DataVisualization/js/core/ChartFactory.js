// ========================================
// Chart Factory - v15.0 Architecture Upgrade
// Factory pattern for creating chart engines
// Centralized chart engine instantiation
// Makes it easy to add new chart types
// ========================================

import { ChartEngine } from '../modules/chartEngine.js';
import { BubbleChartRaceEngine } from '../modules/bubbleChartRaceEngine.js';
import { BumpChartEngine } from '../modules/bumpChartEngine.js';
import { StreamGraphEngine } from '../modules/streamGraphEngine.js';
import { HeatMapEngine } from '../modules/heatMapEngine.js';
import { RadialBarChartEngine } from '../modules/radialBarChartEngine.js';
import { AreaChartRaceEngine } from '../modules/areaChartRaceEngine.js';
import { TreemapRaceEngine } from '../modules/treemapRaceEngine.js';

/**
 * Chart type enumeration
 * All available chart types in the system
 */
export const ChartType = {
    BAR_RACE: 'bar-race',
    BUBBLE_RACE: 'bubble-race',
    BUMP_CHART: 'bump-chart',
    STREAM_GRAPH: 'stream-graph',
    HEAT_MAP: 'heat-map',
    RADIAL_BAR: 'radial-bar',
    AREA_RACE: 'area-race',
    TREEMAP_RACE: 'treemap-race'
};

/**
 * Chart metadata
 * Information about each chart type
 */
export const ChartMetadata = {
    [ChartType.BAR_RACE]: {
        name: 'Bar Chart Race',
        description: 'Classic racing bar chart with smooth animations',
        icon: '📊',
        features: ['Racing animation', 'Rank tracking', 'Value labels'],
        category: 'Racing'
    },
    [ChartType.BUBBLE_RACE]: {
        name: 'Bubble Chart Race',
        description: 'Billiard table physics with mass-based collisions',
        icon: '🎱',
        features: ['Physics simulation', 'Smooth size transitions', 'Collision detection'],
        category: 'Racing'
    },
    [ChartType.BUMP_CHART]: {
        name: 'Bump Chart',
        description: 'Rank evolution over time',
        icon: '📈',
        features: ['Rank lines', 'Smooth transitions', 'Position tracking'],
        category: 'Evolution'
    },
    [ChartType.STREAM_GRAPH]: {
        name: 'Stream Graph',
        description: 'Flowing area chart showing proportions',
        icon: '🌊',
        features: ['Stacked areas', 'Smooth curves', 'Proportional display'],
        category: 'Distribution'
    },
    [ChartType.HEAT_MAP]: {
        name: 'Heat Map',
        description: 'Matrix visualization with color intensity',
        icon: '🔥',
        features: ['Color gradients', 'Matrix layout', 'Value intensity'],
        category: 'Matrix'
    },
    [ChartType.RADIAL_BAR]: {
        name: 'Radial Bar Chart',
        description: 'Circular bar chart with 3D effects',
        icon: '⭕',
        features: ['Circular layout', '3D rendering', 'Radial animation'],
        category: 'Racing'
    },
    [ChartType.AREA_RACE]: {
        name: 'Area Chart Race',
        description: 'Stacked area racing chart',
        icon: '🏔️',
        features: ['Stacked areas', 'Racing animation', 'Smooth transitions'],
        category: 'Racing'
    },
    [ChartType.TREEMAP_RACE]: {
        name: 'Treemap Race',
        description: 'Hierarchical rectangular chart with smooth morphing',
        icon: '🗺️',
        features: ['Treemap layout', 'Smooth morphing', 'Hierarchical display'],
        category: 'Racing'
    }
};

/**
 * ChartFactory - Factory for creating chart engines
 *
 * Usage:
 *   const engine = ChartFactory.create(ChartType.BUBBLE_RACE, 'myCanvas', config);
 */
export class ChartFactory {
    /**
     * Registry of chart engine classes
     * Maps chart type to engine class
     */
    static registry = new Map([
        [ChartType.BAR_RACE, ChartEngine],
        [ChartType.BUBBLE_RACE, BubbleChartRaceEngine],
        [ChartType.BUMP_CHART, BumpChartEngine],
        [ChartType.STREAM_GRAPH, StreamGraphEngine],
        [ChartType.HEAT_MAP, HeatMapEngine],
        [ChartType.RADIAL_BAR, RadialBarChartEngine],
        [ChartType.AREA_RACE, AreaChartRaceEngine],
        [ChartType.TREEMAP_RACE, TreemapRaceEngine]
    ]);

    /**
     * Create a chart engine
     * @param {string} chartType - Type of chart (use ChartType enum)
     * @param {string} canvasId - ID of canvas element
     * @param {Object} config - Chart configuration
     * @param {Object} audioEngine - Audio engine (optional)
     * @returns {BaseChartEngine} Chart engine instance
     */
    static create(chartType, canvasId, config = {}, audioEngine = null) {
        const EngineClass = this.registry.get(chartType);

        if (!EngineClass) {
            throw new Error(`Unknown chart type: ${chartType}. Available types: ${this.getAvailableTypes().join(', ')}`);
        }

        const engine = new EngineClass(canvasId, config, audioEngine);

        console.log(`🏭 ChartFactory created: ${chartType} (${EngineClass.name})`);

        return engine;
    }

    /**
     * Register a new chart type
     * Allows plugins to add new chart types
     * @param {string} chartType - Unique chart type identifier
     * @param {Class} EngineClass - Chart engine class (must extend BaseChartEngine)
     * @param {Object} metadata - Chart metadata
     */
    static register(chartType, EngineClass, metadata = {}) {
        if (this.registry.has(chartType)) {
            console.warn(`Chart type '${chartType}' already registered. Overwriting.`);
        }

        this.registry.set(chartType, EngineClass);

        if (metadata) {
            ChartMetadata[chartType] = metadata;
        }

        console.log(`📝 Registered chart type: ${chartType} (${EngineClass.name})`);
    }

    /**
     * Unregister a chart type
     * @param {string} chartType
     */
    static unregister(chartType) {
        if (!this.registry.has(chartType)) {
            console.warn(`Chart type '${chartType}' not registered`);
            return false;
        }

        this.registry.delete(chartType);
        delete ChartMetadata[chartType];

        console.log(`🗑️ Unregistered chart type: ${chartType}`);
        return true;
    }

    /**
     * Get all available chart types
     * @returns {Array<string>} Array of chart type identifiers
     */
    static getAvailableTypes() {
        return Array.from(this.registry.keys());
    }

    /**
     * Get metadata for a chart type
     * @param {string} chartType
     * @returns {Object} Chart metadata
     */
    static getMetadata(chartType) {
        return ChartMetadata[chartType] || null;
    }

    /**
     * Get all chart metadata
     * @returns {Object} All chart metadata
     */
    static getAllMetadata() {
        return { ...ChartMetadata };
    }

    /**
     * Check if chart type is registered
     * @param {string} chartType
     * @returns {boolean}
     */
    static isRegistered(chartType) {
        return this.registry.has(chartType);
    }

    /**
     * Get charts by category
     * @param {string} category - Category name
     * @returns {Array<Object>} Charts in category
     */
    static getChartsByCategory(category) {
        return Object.entries(ChartMetadata)
            .filter(([_, meta]) => meta.category === category)
            .map(([type, meta]) => ({ type, ...meta }));
    }

    /**
     * Get all categories
     * @returns {Array<string>} Unique categories
     */
    static getCategories() {
        const categories = new Set();
        Object.values(ChartMetadata).forEach(meta => {
            if (meta.category) categories.add(meta.category);
        });
        return Array.from(categories);
    }
}

/**
 * Convenience function to create a chart
 * @param {string} chartType
 * @param {string} canvasId
 * @param {Object} config
 * @param {Object} audioEngine
 * @returns {BaseChartEngine}
 */
export function createChart(chartType, canvasId, config, audioEngine) {
    return ChartFactory.create(chartType, canvasId, config, audioEngine);
}

console.log('✨ Chart Factory v15.0 loaded - Factory pattern for chart creation');
console.log(`📊 Registered chart types: ${ChartFactory.getAvailableTypes().join(', ')}`);
