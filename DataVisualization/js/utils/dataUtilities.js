// ========================================
// Data Utilities - v15.0 Architecture Upgrade
// Data processing helpers used across racing chart engines
// Eliminates data processing code duplication
// ========================================

import { EasingFunctions } from './chartUtilities.js';

/**
 * Data processing utilities for racing charts
 */
export const RacingDataUtils = {
    /**
     * Get top N entities for a given period
     * Used in 6+ racing engines (95% duplication eliminated)
     * @param {Object} data - Full dataset with entities, periods, values
     * @param {number} periodIndex - Index of the period
     * @param {number} topN - Number of top entities to return
     * @returns {Array} Sorted array of top N entities with values
     */
    getTopNData(data, periodIndex, topN) {
        const periodValues = data.values[periodIndex];

        const entries = data.entities.map((entity, idx) => ({
            entity,
            value: parseFloat(periodValues[idx]) || 0
        }))
            .sort((a, b) => b.value - a.value)
            .slice(0, topN);

        return entries;
    },

    /**
     * Interpolate data between two periods with easing
     * Used in 4+ engines
     * @param {Array} currentData - Current period data
     * @param {Array} nextData - Next period data
     * @param {number} progress - Animation progress (0.0 to 1.0)
     * @param {Function} easingFn - Easing function (default: easeInOutCubic)
     * @returns {Array} Interpolated data
     */
    interpolateData(currentData, nextData, progress, easingFn = EasingFunctions.easeInOutCubic) {
        const result = [];
        const easeProgress = easingFn(progress);

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
    },

    /**
     * Calculate rankings for entities
     */
    calculateRankings(data) {
        const sorted = [...data].sort((a, b) => b.value - a.value);
        return sorted.map((item, index) => ({
            ...item,
            rank: index + 1
        }));
    },

    /**
     * Find rank changes between periods
     */
    findRankChanges(currentData, previousData) {
        const changes = [];

        currentData.forEach((current, index) => {
            const previousIndex = previousData.findIndex(p => p.entity === current.entity);

            if (previousIndex !== -1) {
                const rankChange = previousIndex - index;
                if (rankChange !== 0) {
                    changes.push({
                        entity: current.entity,
                        rankChange,
                        rising: rankChange > 0
                    });
                }
            }
        });

        return changes;
    }
};

/**
 * Data validation utilities
 */
export const DataValidation = {
    /**
     * Validate chart data structure
     * @param {Object} data - Data to validate
     * @returns {Object} Validation result { valid: boolean, errors: Array }
     */
    validateChartData(data) {
        const errors = [];

        if (!data) {
            errors.push('Data is null or undefined');
            return { valid: false, errors };
        }

        if (!data.entities || !Array.isArray(data.entities)) {
            errors.push('Missing or invalid entities array');
        }

        if (!data.periods || !Array.isArray(data.periods)) {
            errors.push('Missing or invalid periods array');
        }

        if (!data.values || !Array.isArray(data.values)) {
            errors.push('Missing or invalid values array');
        }

        if (data.values && data.periods) {
            if (data.values.length !== data.periods.length) {
                errors.push(`Values length (${data.values.length}) != periods length (${data.periods.length})`);
            }
        }

        if (data.values && data.entities) {
            const firstPeriodLength = data.values[0]?.length;
            if (firstPeriodLength !== data.entities.length) {
                errors.push(`Values per period (${firstPeriodLength}) != entities count (${data.entities.length})`);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    },

    /**
     * Check if data has values for all periods
     */
    hasCompleteData(data) {
        return data.values.every(periodValues =>
            periodValues.length === data.entities.length
        );
    }
};

/**
 * Data transformation utilities
 */
export const DataTransform = {
    /**
     * Normalize values to 0-1 range
     */
    normalizeValues(values, min = null, max = null) {
        if (min === null) min = Math.min(...values);
        if (max === null) max = Math.max(...values);

        const range = max - min;
        if (range === 0) return values.map(() => 0);

        return values.map(v => (v - min) / range);
    },

    /**
     * Scale values to specific range
     */
    scaleValues(values, targetMin, targetMax) {
        const normalized = this.normalizeValues(values);
        const range = targetMax - targetMin;

        return normalized.map(v => targetMin + v * range);
    },

    /**
     * Calculate cumulative values (for stream graphs, area charts)
     */
    calculateCumulative(data) {
        const cumulative = [];

        for (let period = 0; period < data.periods.length; period++) {
            cumulative[period] = [];
            let sum = 0;

            for (let entity = 0; entity < data.entities.length; entity++) {
                sum += parseFloat(data.values[period][entity]) || 0;
                cumulative[period][entity] = sum;
            }
        }

        return cumulative;
    },

    /**
     * Calculate percentages (for proportion-based charts)
     */
    calculatePercentages(data) {
        const percentages = [];

        for (let period = 0; period < data.periods.length; period++) {
            const periodValues = data.values[period].map(v => parseFloat(v) || 0);
            const total = periodValues.reduce((sum, v) => sum + v, 0);

            percentages[period] = periodValues.map(v => total > 0 ? v / total : 0);
        }

        return percentages;
    }
};

/**
 * Data aggregation utilities
 */
export const DataAggregation = {
    /**
     * Group data by categories
     */
    groupByCategory(data, categoryMap) {
        const grouped = {};

        data.entities.forEach((entity, index) => {
            const category = categoryMap[entity] || 'Other';

            if (!grouped[category]) {
                grouped[category] = {
                    entities: [],
                    values: Array(data.periods.length).fill(0)
                };
            }

            grouped[category].entities.push(entity);

            for (let period = 0; period < data.periods.length; period++) {
                grouped[category].values[period] += parseFloat(data.values[period][index]) || 0;
            }
        });

        return grouped;
    },

    /**
     * Calculate moving average
     */
    movingAverage(values, windowSize) {
        const result = [];

        for (let i = 0; i < values.length; i++) {
            const start = Math.max(0, i - Math.floor(windowSize / 2));
            const end = Math.min(values.length, i + Math.ceil(windowSize / 2));

            const window = values.slice(start, end);
            const avg = window.reduce((sum, v) => sum + v, 0) / window.length;

            result.push(avg);
        }

        return result;
    },

    /**
     * Find peaks in data
     */
    findPeaks(values, threshold = 0.8) {
        const peaks = [];
        const max = Math.max(...values);

        values.forEach((value, index) => {
            if (value >= max * threshold) {
                peaks.push({
                    index,
                    value,
                    percentOfMax: value / max
                });
            }
        });

        return peaks;
    }
};

/**
 * Statistics utilities
 */
export const Statistics = {
    /**
     * Calculate mean (average)
     */
    mean(values) {
        return values.reduce((sum, v) => sum + v, 0) / values.length;
    },

    /**
     * Calculate median
     */
    median(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);

        return sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
    },

    /**
     * Calculate standard deviation
     */
    standardDeviation(values) {
        const avg = this.mean(values);
        const squareDiffs = values.map(v => Math.pow(v - avg, 2));
        const avgSquareDiff = this.mean(squareDiffs);

        return Math.sqrt(avgSquareDiff);
    },

    /**
     * Find min and max values
     */
    minMax(values) {
        return {
            min: Math.min(...values),
            max: Math.max(...values)
        };
    }
};

console.log('✨ Data Utilities v15.0 loaded - Data processing helpers');
