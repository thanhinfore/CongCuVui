/**
 * Contact Map v7.5 - Graph Core Module
 * Graph initialization and basic operations
 */

import Graph from 'https://cdn.jsdelivr.net/npm/graphology@0.25.4/+esm';
import { state, refs, setGraph } from './state.js';
import { DEFAULT_LAYERS, EDGE_TYPES } from './config.js';
import { generateId } from '../utils/helpers.js';
import { saveToIndexedDB } from './storage.js';

/**
 * Create and initialize the graph
 */
export function createGraph() {
    const graph = new Graph();
    setGraph(graph);
    return graph;
}

/**
 * Initialize graph with center node (TÔI)
 */
export function initializeWithCenter(graph) {
    if (!graph.hasNode('center')) {
        graph.addNode('center', {
            label: 'TÔI',
            x: 0,
            y: 0,
            size: 20,
            color: '#667eea',
            layer: 'center',
            isCenter: true,
            contact: {}
        });
    }
}

/**
 * Add a new node to the graph
 */
export function addNode(graph, label, layerId, contact = {}, parentNodeId = null) {
    const nodeId = generateId();
    const layer = getLayerById(layerId);

    // Calculate position
    let x, y;
    if (parentNodeId && graph.hasNode(parentNodeId)) {
        const parentAttrs = graph.getNodeAttributes(parentNodeId);
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 50;
        x = parentAttrs.x + Math.cos(angle) * distance;
        y = parentAttrs.y + Math.sin(angle) * distance;
    } else {
        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 100;
        x = Math.cos(angle) * distance;
        y = Math.sin(angle) * distance;
    }

    graph.addNode(nodeId, {
        label,
        x,
        y,
        size: 10,
        color: layer.color,
        layer: layerId,
        contact
    });

    // Connect to parent if specified
    if (parentNodeId && graph.hasNode(parentNodeId)) {
        const relationship = layerId === 'family' ? 'family' : 'other';
        graph.addEdge(parentNodeId, nodeId, {
            relationship,
            color: EDGE_TYPES[relationship].color,
            label: '',
            size: 2
        });
    }

    return nodeId;
}

/**
 * Update a node's attributes
 */
export function updateNode(graph, nodeId, label, layerId, contact = {}) {
    if (!graph.hasNode(nodeId)) return false;

    const layer = getLayerById(layerId);
    graph.setNodeAttribute(nodeId, 'label', label);
    graph.setNodeAttribute(nodeId, 'layer', layerId);
    graph.setNodeAttribute(nodeId, 'color', layer.color);
    graph.setNodeAttribute(nodeId, 'contact', contact);

    return true;
}

/**
 * Delete a node and its edges
 */
export function deleteNode(graph, nodeId) {
    if (!graph.hasNode(nodeId) || nodeId === 'center') return false;

    graph.dropNode(nodeId);
    return true;
}

/**
 * Add an edge between two nodes
 */
export function addEdge(graph, sourceId, targetId, relationship = 'other', label = '') {
    if (!graph.hasNode(sourceId) || !graph.hasNode(targetId)) return null;
    if (graph.hasEdge(sourceId, targetId) || graph.hasEdge(targetId, sourceId)) return null;

    const edgeType = EDGE_TYPES[relationship] || EDGE_TYPES.other;

    return graph.addEdge(sourceId, targetId, {
        relationship,
        color: edgeType.color,
        label,
        size: 2
    });
}

/**
 * Delete an edge
 */
export function deleteEdge(graph, edgeId) {
    if (!graph.hasEdge(edgeId)) return false;
    graph.dropEdge(edgeId);
    return true;
}

/**
 * Get layer by ID
 */
export function getLayerById(layerId) {
    const layer = state.layers.find(l => l.id === layerId);
    return layer || state.layers.find(l => l.id === 'others') || DEFAULT_LAYERS[4];
}

/**
 * Export graph data for saving
 */
export function exportGraphData(graph) {
    const nodes = [];
    const edges = [];

    graph.forEachNode((nodeId, attrs) => {
        nodes.push({ id: nodeId, ...attrs });
    });

    graph.forEachEdge((edgeId, attrs, source, target) => {
        edges.push({
            id: edgeId,
            source,
            target,
            ...attrs
        });
    });

    return {
        nodes,
        edges,
        layers: state.layers,
        version: '7.5',
        exportedAt: new Date().toISOString()
    };
}

/**
 * Import graph data
 */
export function importGraphData(graph, data) {
    // Clear existing data
    graph.clear();

    // Import layers
    if (data.layers) {
        state.layers = data.layers;
    }

    // Import nodes
    if (data.nodes) {
        data.nodes.forEach(node => {
            const { id, ...attrs } = node;
            graph.addNode(id, attrs);
        });
    }

    // Import edges
    if (data.edges) {
        data.edges.forEach(edge => {
            if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
                if (!graph.hasEdge(edge.source, edge.target)) {
                    graph.addEdge(edge.source, edge.target, {
                        relationship: edge.relationship || 'other',
                        color: edge.color || EDGE_TYPES.other.color,
                        label: edge.label || '',
                        size: edge.size || 2
                    });
                }
            }
        });
    }

    // Ensure center node exists
    initializeWithCenter(graph);
}

/**
 * Save graph to storage
 */
export async function saveGraph(graph) {
    const data = exportGraphData(graph);
    await saveToIndexedDB(data);
}

/**
 * Get node count (excluding center)
 */
export function getNodeCount(graph) {
    let count = 0;
    graph.forEachNode((nodeId) => {
        if (nodeId !== 'center') count++;
    });
    return count;
}

/**
 * Get edge count
 */
export function getEdgeCount(graph) {
    return graph.size;
}

/**
 * Get layer statistics
 */
export function getLayerStats(graph) {
    const stats = {};
    state.layers.forEach(layer => {
        stats[layer.id] = 0;
    });

    graph.forEachNode((nodeId, attrs) => {
        if (nodeId !== 'center' && attrs.layer) {
            stats[attrs.layer] = (stats[attrs.layer] || 0) + 1;
        }
    });

    return stats;
}
