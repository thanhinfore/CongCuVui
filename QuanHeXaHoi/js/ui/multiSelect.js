/**
 * Contact Map v7.5 - Multi-Select UI
 */

import { multiSelectState, refs } from '../core/state.js';
import { getLayerById, addEdge, saveGraph } from '../core/graph.js';
import { EDGE_TYPES } from '../core/config.js';
import { showToast } from '../utils/toast.js';

/**
 * Toggle node selection
 */
export function toggleNodeSelection(nodeId, addToSelection = false) {
    if (!addToSelection) {
        multiSelectState.selectedNodes.clear();
    }

    if (multiSelectState.selectedNodes.has(nodeId)) {
        multiSelectState.selectedNodes.delete(nodeId);
    } else {
        multiSelectState.selectedNodes.add(nodeId);
    }

    updateMultiSelectUI();
    refs.renderer?.refresh();
}

/**
 * Select all nodes
 */
export function selectAllNodes() {
    const graph = refs.graph;
    multiSelectState.selectedNodes.clear();

    graph.forEachNode((nodeId) => {
        if (nodeId !== 'center') {
            multiSelectState.selectedNodes.add(nodeId);
        }
    });

    updateMultiSelectUI();
    refs.renderer?.refresh();
    showToast(`Đã chọn ${multiSelectState.selectedNodes.size} người`, 'info');
}

/**
 * Clear all selections
 */
export function clearSelection() {
    multiSelectState.selectedNodes.clear();
    multiSelectState.isActive = false;
    updateMultiSelectUI();
    refs.renderer?.refresh();
}

/**
 * Update multi-select toolbar UI
 */
export function updateMultiSelectUI() {
    const toolbar = document.getElementById('multi-select-toolbar');
    const countEl = document.getElementById('selected-count');
    const count = multiSelectState.selectedNodes.size;

    if (count > 0) {
        multiSelectState.isActive = true;
        toolbar?.classList.remove('hidden');
        if (countEl) countEl.textContent = count;
    } else {
        multiSelectState.isActive = false;
        toolbar?.classList.add('hidden');
    }
}

/**
 * Bulk assign tag/layer to selected nodes
 */
export function bulkAssignTag(layerId) {
    const graph = refs.graph;
    const nodes = Array.from(multiSelectState.selectedNodes);
    const layer = getLayerById(layerId);

    nodes.forEach(nodeId => {
        if (graph.hasNode(nodeId)) {
            graph.setNodeAttribute(nodeId, 'layer', layerId);
            graph.setNodeAttribute(nodeId, 'color', layer.color);
        }
    });

    saveGraph(graph);
    clearSelection();
    showToast(`Đã gán tag "${layer.name}" cho ${nodes.length} người`, 'success');
}

/**
 * Bulk connect selected nodes with each other
 */
export function bulkConnect() {
    const graph = refs.graph;
    const nodes = Array.from(multiSelectState.selectedNodes);

    if (nodes.length < 2) {
        showToast('Cần chọn ít nhất 2 người để kết nối', 'warning');
        return;
    }

    let connectionCount = 0;
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            if (!graph.hasEdge(nodes[i], nodes[j]) && !graph.hasEdge(nodes[j], nodes[i])) {
                graph.addEdge(nodes[i], nodes[j], {
                    relationship: 'other',
                    color: EDGE_TYPES.other.color,
                    label: '',
                    size: 2
                });
                connectionCount++;
            }
        }
    }

    if (connectionCount > 0) {
        saveGraph(graph);
        showToast(`Đã tạo ${connectionCount} kết nối`, 'success');
    } else {
        showToast('Tất cả đã được kết nối', 'info');
    }

    clearSelection();
}

/**
 * Bulk connect selected nodes to a hub node
 */
export function bulkConnectToHub(hubNodeId) {
    const graph = refs.graph;
    const nodes = Array.from(multiSelectState.selectedNodes);

    if (!graph.hasNode(hubNodeId)) {
        showToast('Không tìm thấy người này', 'error');
        return;
    }

    let count = 0;
    nodes.forEach(nodeId => {
        if (nodeId !== hubNodeId && !graph.hasEdge(hubNodeId, nodeId) && !graph.hasEdge(nodeId, hubNodeId)) {
            graph.addEdge(hubNodeId, nodeId, {
                relationship: 'other',
                color: EDGE_TYPES.other.color,
                label: '',
                size: 2
            });
            count++;
        }
    });

    if (count > 0) {
        const hubName = graph.getNodeAttribute(hubNodeId, 'label');
        saveGraph(graph);
        showToast(`Đã kết nối ${count} người với ${hubName}`, 'success');
    }

    clearSelection();
}

/**
 * Bulk delete selected nodes
 */
export function bulkDelete() {
    const graph = refs.graph;
    const nodes = Array.from(multiSelectState.selectedNodes);

    if (nodes.length === 0) return;

    if (!confirm(`Xóa ${nodes.length} người đã chọn? Hành động này không thể hoàn tác.`)) {
        return;
    }

    nodes.forEach(nodeId => {
        if (graph.hasNode(nodeId) && nodeId !== 'center') {
            graph.dropNode(nodeId);
        }
    });

    saveGraph(graph);
    clearSelection();
    showToast(`Đã xóa ${nodes.length} người`, 'success');

    return nodes.length;
}

/**
 * Get selected node count
 */
export function getSelectedCount() {
    return multiSelectState.selectedNodes.size;
}

/**
 * Check if a node is selected
 */
export function isNodeSelected(nodeId) {
    return multiSelectState.selectedNodes.has(nodeId);
}

/**
 * Setup multi-select event handlers
 */
export function setupMultiSelect(callbacks = {}) {
    document.getElementById('btn-clear-selection')?.addEventListener('click', clearSelection);

    document.getElementById('btn-bulk-tag')?.addEventListener('click', () => {
        if (callbacks.onBulkTag) {
            callbacks.onBulkTag();
        } else {
            const layerId = prompt('Nhập ID layer (family, work, friends, acquaintances, others):');
            if (layerId) bulkAssignTag(layerId);
        }
    });

    document.getElementById('btn-bulk-connect')?.addEventListener('click', bulkConnect);

    document.getElementById('btn-bulk-connect-hub')?.addEventListener('click', () => {
        if (callbacks.onBulkConnectHub) {
            callbacks.onBulkConnectHub();
        } else {
            const hubName = prompt('Nhập tên người làm trung tâm:');
            if (hubName) {
                const graph = refs.graph;
                let hubNodeId = null;
                graph.forEachNode((nodeId, attrs) => {
                    if (attrs.label.toLowerCase() === hubName.toLowerCase()) {
                        hubNodeId = nodeId;
                    }
                });
                if (hubNodeId) {
                    bulkConnectToHub(hubNodeId);
                } else {
                    showToast('Không tìm thấy người này', 'error');
                }
            }
        }
    });

    document.getElementById('btn-bulk-delete')?.addEventListener('click', () => {
        const deleted = bulkDelete();
        if (deleted && callbacks.onBulkDelete) {
            callbacks.onBulkDelete(deleted);
        }
    });
}
