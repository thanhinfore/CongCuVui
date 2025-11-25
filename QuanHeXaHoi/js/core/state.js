/**
 * Contact Map v7.5 - State Management
 * Centralized application state
 */

import { DEFAULT_LAYERS } from './config.js';

// Main application state
export const state = {
    mode: 'VIEW',           // VIEW, ADD, EDIT
    selectedNode: null,
    draggedNode: null,
    isDragging: false,
    hasMoved: false,
    dragStartPos: null,
    dragStartTime: null,
    useIndexedDB: true,
    forceRunning: false,
    editingLayerId: null,
    layers: [...DEFAULT_LAYERS],
    hoveredNode: null,
    detailNode: null,
    lastClickTime: 0,
    searchFilterActive: false,
    searchFilteredNodes: null,
    parentNode: null
};

// Connection mode state
export const connectionState = {
    isConnecting: false,
    sourceNode: null
};

// Multi-select state (v7.0)
export const multiSelectState = {
    isActive: false,
    selectedNodes: new Set()
};

// Command palette state (v7.0)
export const commandPaletteState = {
    isOpen: false,
    selectedIndex: 0,
    items: []
};

// Classification mode state
export const classificationState = {
    isActive: false,
    draggedNodeId: null
};

// Global references (will be set during initialization)
export const refs = {
    graph: null,
    renderer: null,
    db: null
};

// Set global references
export function setGraph(g) {
    refs.graph = g;
}

export function setRenderer(r) {
    refs.renderer = r;
}

export function setDB(database) {
    refs.db = database;
}

// State update helpers
export function updateState(updates) {
    Object.assign(state, updates);
}

export function resetSelection() {
    multiSelectState.selectedNodes.clear();
    multiSelectState.isActive = false;
}
