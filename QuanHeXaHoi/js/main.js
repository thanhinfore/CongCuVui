/**
 * Contact Map v7.5 - Main Entry Point
 * Modular Architecture
 */

// Core imports
import { APP_INFO, DEFAULT_LAYERS, EDGE_TYPES, GRAPH_SETTINGS } from './core/config.js';
import { state, refs, setGraph, setRenderer, multiSelectState, connectionState, commandPaletteState } from './core/state.js';
import { initIndexedDB, loadFromIndexedDB, saveToIndexedDB, getStorageType } from './core/storage.js';
import {
    createGraph,
    initializeWithCenter,
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    deleteEdge,
    getLayerById,
    exportGraphData,
    importGraphData,
    saveGraph,
    getNodeCount,
    getEdgeCount,
    getLayerStats
} from './core/graph.js';

// UI imports
import { setupCommandPalette, openCommandPalette, closeCommandPalette } from './ui/commandPalette.js';
import { setupMultiSelect, toggleNodeSelection, selectAllNodes, clearSelection, isNodeSelected } from './ui/multiSelect.js';
import { initTheme, toggleTheme, setupThemeToggle } from './ui/theme.js';
import { setupKeyboardShortcuts } from './ui/keyboard.js';

// Utils imports
import { generateId, getInitials, highlightMatch, debounce, throttle } from './utils/helpers.js';
import { showToast, showSuccess, showError, showWarning, showInfo } from './utils/toast.js';

// External libraries (loaded via CDN)
import Graph from 'https://cdn.jsdelivr.net/npm/graphology@0.25.4/+esm';
import Sigma from 'https://cdn.jsdelivr.net/npm/sigma@3.0.0-beta.18/+esm';
import forceAtlas2 from 'https://cdn.jsdelivr.net/npm/graphology-layout-forceatlas2@0.10.1/+esm';

console.log(`${APP_INFO.name} v${APP_INFO.version} - Modular Architecture`);

/**
 * Initialize the application
 */
async function initApp() {
    console.log('Initializing Contact Map v7.5...');

    // Initialize storage
    await initIndexedDB();
    console.log(`Storage: ${getStorageType()}`);

    // Create graph
    const graph = new Graph();
    setGraph(graph);
    refs.graph = graph;

    // Load saved data
    const savedData = await loadFromIndexedDB();
    if (savedData) {
        importGraphData(graph, savedData);
        console.log(`Loaded ${getNodeCount(graph)} contacts`);
    } else {
        initializeWithCenter(graph);
        console.log('Created new graph with center node');
    }

    // Initialize renderer
    const container = document.getElementById('container');
    if (container) {
        const renderer = new Sigma(graph, container, {
            defaultNodeColor: '#999',
            defaultEdgeColor: '#ccc',
            labelDensity: GRAPH_SETTINGS.labelDensity,
            labelGridCellSize: GRAPH_SETTINGS.labelGridCellSize,
            renderEdgeLabels: true,
            labelRenderedSizeThreshold: GRAPH_SETTINGS.labelRenderedSizeThreshold,
            nodeReducer: createNodeReducer(),
            edgeReducer: createEdgeReducer()
        });
        setRenderer(renderer);
        refs.renderer = renderer;

        // Setup renderer events
        setupRendererEvents(renderer);
    }

    // Initialize UI
    initTheme();
    setupThemeToggle();

    // Setup v7.0 features
    setupCommandPalette({
        onSelectNode: (nodeId) => {
            focusOnNode(nodeId);
            openDetailPanel(nodeId);
        },
        onAction: handleCommandAction
    });

    setupMultiSelect({
        onBulkDelete: () => updateNodeCount()
    });

    setupKeyboardShortcuts({
        onAddPerson: () => openModal(null, 'ADD'),
        onEscape: () => closeDetailPanel()
    });

    // Update UI
    updateNodeCount();
    renderTagList();

    // Welcome toast
    setTimeout(() => {
        showInfo(`${APP_INFO.name} v${APP_INFO.version} - Nhấn Ctrl+K để mở Command Palette`, 4000);
    }, 500);

    console.log('Initialization complete!');
}

/**
 * Create node reducer for Sigma
 */
function createNodeReducer() {
    return (node, data) => {
        const res = { ...data };

        // Apply search filter
        if (state.searchFilterActive && state.searchFilteredNodes) {
            if (!state.searchFilteredNodes.has(node) && node !== 'center') {
                res.hidden = true;
                return res;
            }
        }

        // Highlight hovered node
        if (state.hoveredNode === node || data.highlighted) {
            res.highlighted = true;
            res.zIndex = 1;
        }

        // Highlight selected nodes (v7.0)
        if (multiSelectState.selectedNodes.has(node)) {
            res.highlighted = true;
            res.zIndex = 2;
            res.size = (res.size || 10) * 1.2;
        }

        return res;
    };
}

/**
 * Create edge reducer for Sigma
 */
function createEdgeReducer() {
    return (edge, data) => {
        const graph = refs.graph;
        const res = { ...data };
        const source = graph.source(edge);
        const target = graph.target(edge);

        // Hide edges for filtered nodes
        if (state.searchFilterActive && state.searchFilteredNodes) {
            const sourceVisible = state.searchFilteredNodes.has(source) || source === 'center';
            const targetVisible = state.searchFilteredNodes.has(target) || target === 'center';
            if (!sourceVisible || !targetVisible) {
                res.hidden = true;
                return res;
            }
        }

        // Ensure minimum size
        if (!res.size || res.size < 1.5) {
            res.size = 1.5;
        }

        // Highlight edges connected to hovered node
        if (state.hoveredNode) {
            if (source === state.hoveredNode || target === state.hoveredNode) {
                res.highlighted = true;
                res.size = 3;
                res.zIndex = 1;
            } else {
                res.color = '#e0e0e0';
            }
        }

        return res;
    };
}

/**
 * Setup Sigma renderer events
 */
function setupRendererEvents(renderer) {
    const graph = refs.graph;

    // Click on stage
    renderer.on('clickStage', () => {
        if (connectionState.isConnecting) {
            cancelConnection();
            showInfo('Đã hủy tạo kết nối');
            return;
        }

        if (!state.hasMoved && !state.isDragging) {
            state.selectedNode = null;
            closeDetailPanel();
        }
    });

    // Click on node
    renderer.on('clickNode', (e) => {
        hideHoverPanel(true);

        // Handle connection mode
        if (connectionState.isConnecting) {
            completeConnection(e.node);
            return;
        }

        // Multi-select with Ctrl/Cmd
        if (e.event.ctrlKey || e.event.metaKey) {
            toggleNodeSelection(e.node, true);
            return;
        }

        // Add to selection with Shift
        if (e.event.shiftKey && multiSelectState.selectedNodes.size > 0) {
            toggleNodeSelection(e.node, true);
            return;
        }

        const now = Date.now();
        const isDoubleClick = (now - state.lastClickTime) < 300;
        state.lastClickTime = now;

        setTimeout(() => {
            if (!state.isDragging && !state.hasMoved) {
                clearSelection();
                if (isDoubleClick) {
                    openModal(e.node, 'EDIT');
                } else {
                    openDetailPanel(e.node);
                }
            }
        }, 150);
    });

    // Hover events
    renderer.on('enterNode', (e) => {
        state.hoveredNode = e.node;
        showHoverPanel(e.node, e.event.clientX, e.event.clientY);
    });

    renderer.on('leaveNode', () => {
        state.hoveredNode = null;
        hideHoverPanel();
    });
}

/**
 * Handle command palette actions
 */
function handleCommandAction(action) {
    switch (action) {
        case 'add-person':
            openModal(null, 'ADD');
            break;
        case 'import':
            document.getElementById('import-modal')?.classList.remove('hidden');
            break;
        case 'export':
            exportJSON();
            break;
        case 'layout':
            applyRadialLayout();
            showInfo('Đang sắp xếp lại bản đồ...');
            break;
        case 'select-all':
            selectAllNodes();
            break;
        case 'toggle-theme':
            toggleTheme();
            break;
    }
}

// Placeholder functions for features that need full implementation
function openModal(nodeId, mode) { console.log('openModal', nodeId, mode); }
function openDetailPanel(nodeId) { console.log('openDetailPanel', nodeId); }
function closeDetailPanel() { console.log('closeDetailPanel'); }
function focusOnNode(nodeId) { console.log('focusOnNode', nodeId); }
function showHoverPanel(nodeId, x, y) { console.log('showHoverPanel', nodeId); }
function hideHoverPanel(immediate) { console.log('hideHoverPanel'); }
function cancelConnection() { connectionState.isConnecting = false; connectionState.sourceNode = null; }
function completeConnection(nodeId) { console.log('completeConnection', nodeId); }
function updateNodeCount() { console.log('updateNodeCount'); }
function renderTagList() { console.log('renderTagList'); }
function exportJSON() { console.log('exportJSON'); }
function applyRadialLayout() { console.log('applyRadialLayout'); }

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Export for use in other modules or console
export {
    initApp,
    state,
    refs,
    showToast,
    getLayerById,
    saveGraph,
    addNode,
    updateNode,
    deleteNode,
    selectAllNodes,
    clearSelection,
    toggleTheme,
    openCommandPalette
};
