// ========================================
// Event Emitter - v15.0 Architecture Upgrade
// Pub/Sub event system for decoupling components
// Enables loose coupling between modules
// ========================================

/**
 * EventEmitter class - Observer pattern implementation
 * Allows components to communicate without direct dependencies
 *
 * Usage example:
 *   const emitter = new EventEmitter();
 *   emitter.on('chartUpdate', (data) => console.log(data));
 *   emitter.emit('chartUpdate', { period: 5, value: 100 });
 */
export class EventEmitter {
    constructor() {
        this.events = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Function to call when event is emitted
     * @returns {Function} Unsubscribe function
     */
    on(eventName, callback) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }

        this.events.get(eventName).push(callback);

        // Return unsubscribe function
        return () => this.off(eventName, callback);
    }

    /**
     * Subscribe to an event (one-time only)
     * @param {string} eventName
     * @param {Function} callback
     */
    once(eventName, callback) {
        const onceWrapper = (...args) => {
            callback(...args);
            this.off(eventName, onceWrapper);
        };

        this.on(eventName, onceWrapper);
    }

    /**
     * Unsubscribe from an event
     * @param {string} eventName
     * @param {Function} callback - Specific callback to remove (optional)
     */
    off(eventName, callback = null) {
        if (!this.events.has(eventName)) return;

        if (callback === null) {
            // Remove all listeners for this event
            this.events.delete(eventName);
        } else {
            // Remove specific listener
            const callbacks = this.events.get(eventName);
            const index = callbacks.indexOf(callback);

            if (index !== -1) {
                callbacks.splice(index, 1);
            }

            // Clean up if no more listeners
            if (callbacks.length === 0) {
                this.events.delete(eventName);
            }
        }
    }

    /**
     * Emit an event to all subscribers
     * @param {string} eventName
     * @param {...any} args - Arguments to pass to callbacks
     */
    emit(eventName, ...args) {
        if (!this.events.has(eventName)) return;

        const callbacks = this.events.get(eventName);

        // Call all callbacks with provided arguments
        callbacks.forEach(callback => {
            try {
                callback(...args);
            } catch (error) {
                console.error(`Error in event handler for '${eventName}':`, error);
            }
        });
    }

    /**
     * Get count of listeners for an event
     * @param {string} eventName
     * @returns {number}
     */
    listenerCount(eventName) {
        return this.events.has(eventName) ? this.events.get(eventName).length : 0;
    }

    /**
     * Get all event names that have listeners
     * @returns {Array<string>}
     */
    eventNames() {
        return Array.from(this.events.keys());
    }

    /**
     * Remove all event listeners
     */
    removeAllListeners() {
        this.events.clear();
    }

    /**
     * Check if event has any listeners
     * @param {string} eventName
     * @returns {boolean}
     */
    hasListeners(eventName) {
        return this.events.has(eventName) && this.events.get(eventName).length > 0;
    }
}

/**
 * Standard chart events
 * Predefined event names for consistency across engines
 */
export const ChartEvents = {
    // Lifecycle events
    INITIALIZED: 'chart:initialized',
    DESTROYED: 'chart:destroyed',
    RESIZE: 'chart:resize',

    // Animation events
    ANIMATION_START: 'animation:start',
    ANIMATION_PAUSE: 'animation:pause',
    ANIMATION_RESUME: 'animation:resume',
    ANIMATION_STOP: 'animation:stop',
    ANIMATION_COMPLETE: 'animation:complete',

    // Period/Frame events
    PERIOD_CHANGE: 'period:change',
    PERIOD_COMPLETE: 'period:complete',
    FRAME_RENDER: 'frame:render',

    // Data events
    DATA_LOADED: 'data:loaded',
    DATA_UPDATED: 'data:updated',
    DATA_ERROR: 'data:error',

    // User interaction events
    ENTITY_CLICK: 'entity:click',
    ENTITY_HOVER: 'entity:hover',
    ENTITY_LEAVE: 'entity:leave',

    // Configuration events
    CONFIG_CHANGE: 'config:change',
    PALETTE_CHANGE: 'palette:change',

    // Audio events
    AUDIO_LOADED: 'audio:loaded',
    AUDIO_PLAY: 'audio:play',
    AUDIO_PAUSE: 'audio:pause',
    AUDIO_END: 'audio:end',

    // Recording events
    RECORDING_START: 'recording:start',
    RECORDING_STOP: 'recording:stop',
    RECORDING_COMPLETE: 'recording:complete',
    RECORDING_ERROR: 'recording:error'
};

console.log('✨ Event Emitter v15.0 loaded - Pub/Sub event system');
