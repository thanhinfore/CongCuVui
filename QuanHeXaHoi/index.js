import Graph from 'https://cdn.skypack.dev/graphology';
import Sigma from 'https://cdn.skypack.dev/sigma';
import forceAtlas2 from 'https://cdn.skypack.dev/graphology-layout-forceatlas2';

// ==========================================
// PHẦN 1: CẤU HÌNH & CONSTANTS
// ==========================================

const CONTAINER_ID = 'container';
const STORAGE_KEY = 'social_graph_v3_data'; // Keep v3 for backwards compatibility
const AUTOSAVE_BADGE = document.getElementById('autosave-status');

// Node size configuration
const NODE_SIZES = {
    CENTER: 30,
    MIN: 10,
    BASE: 24,
    REDUCTION_FACTOR: 2
};

// Force layout configuration
const FORCE_LAYOUT_CONFIG = {
    ITERATIONS: 100,
    FRAME_RATE: 16,
    GRAVITY: 0.05,
    SCALING_RATIO: 10,
    SLOW_DOWN: 1
};

// Drag configuration
const DRAG_CONFIG = {
    MOVE_THRESHOLD: 0.5,
    MIN_DURATION: 100,
    LINK_OFFSET: { x: 15, y: 10 }
};

// Distance colors (from center)
const DISTANCE_COLORS = [
    '#1a1a2e',   // 0: Center (TÔI) - dark
    '#E53935',   // 1: Very close
    '#D81B60',   // 2: Close
    '#8E24AA',   // 3: Medium
    '#5E35B1',   // 4: Far
    '#3949AB',   // 5: Very far
    '#1E88E5',   // 6+: Distant
    '#00ACC1'    // 7+
];

// Edge relationship types with colors
const EDGE_TYPES = {
    family: { label: 'Gia đình', color: '#E53935' },
    spouse: { label: 'Vợ/Chồng', color: '#D81B60' },
    friend: { label: 'Bạn bè', color: '#3949AB' },
    colleague: { label: 'Đồng nghiệp', color: '#1E88E5' },
    mentor: { label: 'Thầy/Trò', color: '#8E24AA' },
    partner: { label: 'Đối tác', color: '#00ACC1' },
    other: { label: 'Khác', color: '#757575' }
};

// Default layers
const DEFAULT_LAYERS = [
    { id: 'family', name: 'Gia đình', color: '#E53935', icon: 'fa-home' },
    { id: 'work', name: 'Công việc', color: '#1E88E5', icon: 'fa-briefcase' },
    { id: 'friends', name: 'Bạn bè', color: '#4CAF50', icon: 'fa-users' },
    { id: 'others', name: 'Khác', color: '#9E9E9E', icon: 'fa-ellipsis-h' }
];

// ==========================================
// PHẦN 2: STATE & INITIALIZATION
// ==========================================

let graph = new Graph();
let renderer = null;

let state = {
    selectedNode: null,
    selectedEdge: null,
    parentNode: null,
    mode: 'NORMAL',
    draggedNode: null,
    isDragging: false,
    dragStartTime: 0,
    dragStartPos: null,
    hasMoved: false,
    lastSaved: null,
    currentLayer: 'all',
    forceRunning: false,
    editingLayerId: null,
    layers: [...DEFAULT_LAYERS],
    hoveredNode: null,
    detailNode: null,
    lastClickTime: 0
};

// ==========================================
// PHẦN 3: HELPER FUNCTIONS
// ==========================================

const getColorByDistance = (distance) => {
    return DISTANCE_COLORS[Math.min(distance, DISTANCE_COLORS.length - 1)] || '#999';
};

const getSizeByDistance = (distance) => {
    if (distance === 0) return NODE_SIZES.CENTER;
    return Math.max(NODE_SIZES.MIN, NODE_SIZES.BASE - (distance * NODE_SIZES.REDUCTION_FACTOR));
};

// Get initials from name (e.g., "Nguyễn Văn A" -> "NA")
const getInitials = (name) => {
    if (!name) return '?';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

// Get layer by ID
const getLayerById = (layerId) => {
    return state.layers.find(l => l.id === layerId) || { name: 'Khác', color: '#9E9E9E' };
};

// Format date for display
const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// BFS to calculate distances from center
function calculateDistancesFromCenter() {
    const distances = new Map();
    const queue = ['center'];
    distances.set('center', 0);

    while (queue.length > 0) {
        const current = queue.shift();
        const currentDist = distances.get(current);

        graph.forEachNeighbor(current, (neighbor) => {
            if (!distances.has(neighbor)) {
                distances.set(neighbor, currentDist + 1);
                queue.push(neighbor);
            }
        });
    }

    return distances;
}

// Apply colors based on distance
function applyColorsByDistance(showNotification = true) {
    const distances = calculateDistancesFromCenter();

    graph.forEachNode((node) => {
        const distance = distances.get(node) || 6;
        graph.setNodeAttribute(node, 'distance', distance);
        graph.setNodeAttribute(node, 'color', getColorByDistance(distance));
        graph.setNodeAttribute(node, 'size', getSizeByDistance(distance));
    });

    renderer.refresh();
    if (showNotification) {
        showToast('Đã cập nhật màu sắc theo khoảng cách!', 'success');
    }
}

// ==========================================
// PHẦN 4: TOAST NOTIFICATION SYSTEM
// ==========================================

function showToast(message, type = 'info', duration = 3000) {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ==========================================
// PHẦN 5: STORAGE MANAGEMENT
// ==========================================

function saveData() {
    const payload = {
        version: '3.1',
        graph: graph.export(),
        layers: state.layers,
        savedAt: new Date().toISOString()
    };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        updateAutosaveBadge();
    } catch (e) {
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            showToast('Dung lượng lưu trữ đã đầy! Hãy xuất dữ liệu để backup.', 'warning', 5000);
        } else {
            showToast('Lỗi khi lưu dữ liệu!', 'error');
        }
    }
}

function loadData() {
    // Try v3 format first
    let raw = localStorage.getItem(STORAGE_KEY);

    // Fallback to v2 format for migration
    if (!raw) {
        raw = localStorage.getItem('social_graph_v2_data');
        if (raw) {
            // Migrate from v2
            try {
                const v2Data = JSON.parse(raw);
                const graphData = v2Data.graph || v2Data;
                graph.import(graphData);
                migrateFromV2();
                showToast('Đã nâng cấp dữ liệu từ v2 lên v3!', 'success');
                saveData();
                return true;
            } catch (e) {
                return false;
            }
        }
    }

    if (raw) {
        try {
            const data = JSON.parse(raw);

            // Load layers
            if (data.layers && Array.isArray(data.layers)) {
                state.layers = data.layers;
            }

            // Load graph
            const graphData = data.graph || data;
            graph.import(graphData);

            // Ensure all nodes have required attributes
            ensureNodeAttributes();

            return true;
        } catch (e) {
            return false;
        }
    }
    return false;
}

function migrateFromV2() {
    // Migrate node attributes
    graph.forEachNode((node) => {
        const attrs = graph.getNodeAttributes(node);

        // Convert 'category' to 'layer'
        if (attrs.category) {
            graph.setNodeAttribute(node, 'layer', attrs.category === 'family' ? 'family' : 'others');
            graph.removeNodeAttribute(node, 'category');
        }

        // Convert 'type' to 'layer'
        if (attrs.type !== undefined) {
            graph.setNodeAttribute(node, 'layer', attrs.type === 'family' ? 'family' : 'others');
            graph.removeNodeAttribute(node, 'type');
        }

        // Initialize contact fields
        if (!attrs.contact) {
            graph.setNodeAttribute(node, 'contact', {
                email: '',
                phone: '',
                address: '',
                company: '',
                position: '',
                facebook: '',
                social: '',
                birthday: '',
                notes: ''
            });
        }
    });

    // Migrate edge attributes
    graph.forEachEdge((edge) => {
        const attrs = graph.getEdgeAttributes(edge);

        // Add label if not exists
        if (!attrs.label) {
            graph.setEdgeAttribute(edge, 'label', '');
        }

        // Convert 'type' to 'relationship'
        if (attrs.type !== undefined && !attrs.relationship) {
            graph.setEdgeAttribute(edge, 'relationship', attrs.type);
            graph.removeEdgeAttribute(edge, 'type');
        }
    });
}

function ensureNodeAttributes() {
    graph.forEachNode((node) => {
        const attrs = graph.getNodeAttributes(node);

        if (!attrs.layer) {
            graph.setNodeAttribute(node, 'layer', 'others');
        }

        if (!attrs.contact) {
            graph.setNodeAttribute(node, 'contact', {
                email: '',
                phone: '',
                address: '',
                company: '',
                position: '',
                facebook: '',
                social: '',
                birthday: '',
                notes: ''
            });
        }
    });

    graph.forEachEdge((edge) => {
        const attrs = graph.getEdgeAttributes(edge);

        if (!attrs.label) {
            graph.setEdgeAttribute(edge, 'label', '');
        }

        if (!attrs.relationship) {
            graph.setEdgeAttribute(edge, 'relationship', 'other');
        }

        // Ensure edges have size for visibility
        if (!attrs.size || attrs.size < 1) {
            graph.setEdgeAttribute(edge, 'size', 2);
        }

        // Ensure edges have color
        if (!attrs.color) {
            const rel = attrs.relationship || 'other';
            graph.setEdgeAttribute(edge, 'color', EDGE_TYPES[rel]?.color || '#999');
        }
    });
}

function initDefaultData() {
    graph.clear();
    state.layers = [...DEFAULT_LAYERS];

    graph.addNode('center', {
        label: "TÔI",
        distance: 0,
        x: 0,
        y: 0,
        size: NODE_SIZES.CENTER,
        color: getColorByDistance(0),
        layer: 'family',
        contact: {
            email: '',
            phone: '',
            address: '',
            company: '',
            position: '',
            facebook: '',
            social: '',
            birthday: '',
            notes: 'Đây là bạn - trung tâm của sơ đồ quan hệ'
        }
    });

    saveData();
}

// Export functions
function downloadJSON() {
    const data = {
        version: '3.1',
        exportedAt: new Date().toISOString(),
        layers: state.layers,
        graph: graph.export()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = "social_graph_v31_" + Date.now() + ".json";
    a.click();
    showToast('Đã xuất file JSON thành công!', 'success');
}

async function captureGraphImage() {
    showToast('Đang chụp ảnh...', 'info', 2000);
    const container = document.getElementById(CONTAINER_ID);
    const { default: html2canvas } = await import('https://cdn.skypack.dev/html2canvas');
    const canvas = await html2canvas(container, { scale: 2, useCORS: true });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `social_graph_v31_${Date.now()}.png`;
    link.click();
    showToast('Đã lưu ảnh thành công!', 'success');
}

function uploadJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            graph.clear();

            // Load layers if present
            if (data.layers && Array.isArray(data.layers)) {
                state.layers = data.layers;
                renderLayerFilters();
                renderLayersList();
            }

            // Load graph
            const graphData = data.graph || data;
            graph.import(graphData);
            ensureNodeAttributes();
            applyColorsByDistance(false);
            updateNodeCount();
            saveData();
            showToast('Đã nhập dữ liệu thành công!', 'success');
        } catch (err) {
            showToast('File không hợp lệ!', 'error');
        }
    };
    reader.readAsText(file);
}

// ==========================================
// PHẦN 6: LAYERS MANAGEMENT
// ==========================================

function renderLayerFilters() {
    const container = document.getElementById('layer-filters');

    // Clear and keep "All" button
    container.innerHTML = `
        <button class="layer-btn ${state.currentLayer === 'all' ? 'active' : ''}" data-layer="all">
            <i class="fas fa-globe"></i> Tất cả
        </button>
    `;

    // Add layer buttons
    state.layers.forEach(layer => {
        const btn = document.createElement('button');
        btn.className = `layer-btn ${state.currentLayer === layer.id ? 'active' : ''}`;
        btn.dataset.layer = layer.id;
        btn.style.setProperty('--layer-color', layer.color);
        btn.innerHTML = `<i class="fas ${layer.icon || 'fa-folder'}"></i> ${layer.name}`;
        container.appendChild(btn);
    });

    // Add click handlers
    container.querySelectorAll('.layer-btn').forEach(btn => {
        btn.addEventListener('click', () => switchLayer(btn.dataset.layer));
    });

    // Update layer select in modal
    updateLayerSelect();
}

function updateLayerSelect() {
    const select = document.getElementById('inp-layer');
    if (!select) return;

    select.innerHTML = state.layers.map(layer =>
        `<option value="${layer.id}">${layer.name}</option>`
    ).join('');
}

function renderLayersList() {
    const container = document.getElementById('layers-list');
    if (!container) return;

    container.innerHTML = state.layers.map(layer => {
        const nodeCount = countNodesInLayer(layer.id);
        return `
            <div class="layer-item" data-layer-id="${layer.id}">
                <div class="layer-color" style="background: ${layer.color};"></div>
                <div class="layer-info">
                    <span class="layer-name">${layer.name}</span>
                    <span class="layer-count">${nodeCount} người</span>
                </div>
                <div class="layer-actions">
                    <button class="btn-icon btn-edit-layer" data-layer-id="${layer.id}" title="Chỉnh sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Add click handlers
    container.querySelectorAll('.btn-edit-layer').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openLayerModal(btn.dataset.layerId);
        });
    });
}

function countNodesInLayer(layerId) {
    let count = 0;
    graph.forEachNode((node) => {
        if (graph.getNodeAttribute(node, 'layer') === layerId) {
            count++;
        }
    });
    return count;
}

function addLayer() {
    const nameInput = document.getElementById('new-layer-name');
    const colorInput = document.getElementById('new-layer-color');

    const name = nameInput.value.trim();
    if (!name) {
        showToast('Vui lòng nhập tên layer', 'warning');
        return;
    }

    const id = 'layer_' + Date.now();
    const color = colorInput.value;

    state.layers.push({
        id,
        name,
        color,
        icon: 'fa-folder'
    });

    nameInput.value = '';
    colorInput.value = '#667eea';

    renderLayerFilters();
    renderLayersList();
    saveData();
    showToast(`Đã thêm layer "${name}"`, 'success');
}

function openLayerModal(layerId) {
    const layer = state.layers.find(l => l.id === layerId);
    if (!layer) return;

    state.editingLayerId = layerId;
    document.getElementById('edit-layer-name').value = layer.name;
    document.getElementById('edit-layer-color').value = layer.color;

    document.getElementById('layer-modal').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

function closeLayerModal() {
    document.getElementById('layer-modal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
    state.editingLayerId = null;
}

function saveLayer() {
    if (!state.editingLayerId) return;

    const layer = state.layers.find(l => l.id === state.editingLayerId);
    if (!layer) return;

    layer.name = document.getElementById('edit-layer-name').value.trim();
    layer.color = document.getElementById('edit-layer-color').value;

    renderLayerFilters();
    renderLayersList();
    saveData();
    closeLayerModal();
    showToast('Đã lưu layer', 'success');
}

function deleteLayer() {
    if (!state.editingLayerId) return;

    // Don't allow deleting if it's the last layer
    if (state.layers.length <= 1) {
        showToast('Không thể xóa layer cuối cùng', 'warning');
        return;
    }

    // Move nodes to 'others' layer or first available layer
    const targetLayer = state.layers.find(l => l.id !== state.editingLayerId)?.id || 'others';

    graph.forEachNode((node) => {
        if (graph.getNodeAttribute(node, 'layer') === state.editingLayerId) {
            graph.setNodeAttribute(node, 'layer', targetLayer);
        }
    });

    state.layers = state.layers.filter(l => l.id !== state.editingLayerId);

    if (state.currentLayer === state.editingLayerId) {
        state.currentLayer = 'all';
    }

    renderLayerFilters();
    renderLayersList();
    saveData();
    closeLayerModal();
    renderer.refresh();
    showToast('Đã xóa layer', 'success');
}

function switchLayer(layerId) {
    state.currentLayer = layerId;

    // Update button states
    document.querySelectorAll('.layer-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.layer === layerId);
    });

    // Filter nodes
    if (layerId === 'all') {
        graph.forEachNode((node) => {
            graph.setNodeAttribute(node, 'hidden', false);
        });
    } else {
        graph.forEachNode((node) => {
            const nodeLayer = graph.getNodeAttribute(node, 'layer');
            graph.setNodeAttribute(node, 'hidden', nodeLayer !== layerId);
        });
    }

    // Hide edges where either node is hidden
    graph.forEachEdge((edge) => {
        const source = graph.source(edge);
        const target = graph.target(edge);
        const sourceHidden = graph.getNodeAttribute(source, 'hidden');
        const targetHidden = graph.getNodeAttribute(target, 'hidden');
        graph.setEdgeAttribute(edge, 'hidden', sourceHidden || targetHidden);
    });

    renderer.refresh();
}

function toggleLayersPanel() {
    const panel = document.getElementById('layers-panel');
    panel.classList.toggle('hidden');
}

// ==========================================
// PHẦN 7: UI & MODALS
// ==========================================

const ui = {
    modal: document.getElementById('modal'),
    edgeModal: document.getElementById('edge-modal'),
    layerModal: document.getElementById('layer-modal'),
    overlay: document.getElementById('overlay'),
    inpLabel: document.getElementById('inp-label'),
    inpLayer: document.getElementById('inp-layer'),
    inpEmail: document.getElementById('inp-email'),
    inpPhone: document.getElementById('inp-phone'),
    inpAddress: document.getElementById('inp-address'),
    inpCompany: document.getElementById('inp-company'),
    inpPosition: document.getElementById('inp-position'),
    inpFacebook: document.getElementById('inp-facebook'),
    inpSocial: document.getElementById('inp-social'),
    inpBirthday: document.getElementById('inp-birthday'),
    inpNotes: document.getElementById('inp-notes'),
    title: document.getElementById('modal-title'),
    editActions: document.getElementById('edit-actions'),
    btnSave: document.getElementById('btn-save'),
    edgeType: document.getElementById('edge-type'),
    edgeLabel: document.getElementById('edge-label')
};

function updateAutosaveBadge() {
    if (!AUTOSAVE_BADGE) return;
    const now = new Date();
    state.lastSaved = now;
    AUTOSAVE_BADGE.innerText = `Đã lưu lúc ${now.toLocaleTimeString()}`;
    AUTOSAVE_BADGE.classList.add('flash');
    setTimeout(() => AUTOSAVE_BADGE.classList.remove('flash'), 700);
}

function updateNodeCount() {
    const count = graph.order;
    const nodeCountEl = document.getElementById('node-count');
    if (nodeCountEl) {
        nodeCountEl.innerText = `${count} người`;
    }
    // Also update statistics
    updateStatistics();
}

function closeModal() {
    ui.modal.style.display = 'none';
    ui.overlay.style.display = 'none';
    clearModalForm();
    state.mode = 'NORMAL';
    state.selectedNode = null;
    state.parentNode = null;
}

function clearModalForm() {
    ui.inpLabel.value = '';
    if (ui.inpEmail) ui.inpEmail.value = '';
    if (ui.inpPhone) ui.inpPhone.value = '';
    if (ui.inpAddress) ui.inpAddress.value = '';
    if (ui.inpCompany) ui.inpCompany.value = '';
    if (ui.inpPosition) ui.inpPosition.value = '';
    if (ui.inpFacebook) ui.inpFacebook.value = '';
    if (ui.inpSocial) ui.inpSocial.value = '';
    if (ui.inpBirthday) ui.inpBirthday.value = '';
    if (ui.inpNotes) ui.inpNotes.value = '';
}

function closeEdgeModal() {
    ui.edgeModal.style.display = 'none';
    ui.overlay.style.display = 'none';
    state.selectedEdge = null;
}

function openModal(nodeId, mode = 'EDIT') {
    state.mode = mode;
    ui.overlay.style.display = 'block';
    ui.modal.style.display = 'block';

    if (mode === 'ADD') {
        ui.title.innerText = state.parentNode
            ? `Thêm từ: ${graph.getNodeAttribute(state.parentNode, 'label')}`
            : "Thêm người mới";

        clearModalForm();
        if (ui.inpLayer) ui.inpLayer.value = state.layers[0]?.id || 'others';
        ui.btnSave.innerHTML = '<i class="fas fa-plus"></i> Thêm';
        ui.editActions.style.display = 'none';
        setTimeout(() => ui.inpLabel.focus(), 100);
    } else {
        state.selectedNode = nodeId;
        const attr = graph.getNodeAttributes(nodeId);
        const contact = attr.contact || {};

        ui.title.innerText = attr.label;
        ui.inpLabel.value = attr.label;
        if (ui.inpLayer) ui.inpLayer.value = attr.layer || 'others';
        if (ui.inpEmail) ui.inpEmail.value = contact.email || '';
        if (ui.inpPhone) ui.inpPhone.value = contact.phone || '';
        if (ui.inpAddress) ui.inpAddress.value = contact.address || '';
        if (ui.inpCompany) ui.inpCompany.value = contact.company || '';
        if (ui.inpPosition) ui.inpPosition.value = contact.position || '';
        if (ui.inpFacebook) ui.inpFacebook.value = contact.facebook || '';
        if (ui.inpSocial) ui.inpSocial.value = contact.social || '';
        if (ui.inpBirthday) ui.inpBirthday.value = contact.birthday || '';
        if (ui.inpNotes) ui.inpNotes.value = contact.notes || '';

        ui.btnSave.innerHTML = '<i class="fas fa-save"></i> Lưu';

        const isCenter = (nodeId === 'center');
        document.getElementById('btn-delete').style.display = isCenter ? 'none' : 'block';
        ui.editActions.style.display = 'block';
    }
}

function openEdgeModal(edge) {
    state.selectedEdge = edge;
    ui.overlay.style.display = 'block';
    ui.edgeModal.style.display = 'block';

    const source = graph.source(edge);
    const target = graph.target(edge);
    const sourceLabel = graph.getNodeAttribute(source, 'label');
    const targetLabel = graph.getNodeAttribute(target, 'label');

    document.getElementById('edge-modal-title').innerText = `${sourceLabel} ↔ ${targetLabel}`;

    const edgeRelationship = graph.getEdgeAttribute(edge, 'relationship') || 'other';
    const edgeLabel = graph.getEdgeAttribute(edge, 'label') || '';

    ui.edgeType.value = edgeRelationship;
    ui.edgeLabel.value = edgeLabel;
}

// ==========================================
// PHẦN 8: FORCE LAYOUT
// ==========================================

function startForceLayout() {
    if (state.forceRunning) {
        stopForceLayout();
        return;
    }

    state.forceRunning = true;
    const btn = document.getElementById('btn-force-layout');
    btn.innerHTML = '<i class="fas fa-stop"></i> Dừng';
    btn.style.background = '#f44336';

    showToast('Đang chạy Force Layout...', 'info', 2000);

    const settings = {
        iterations: FORCE_LAYOUT_CONFIG.ITERATIONS,
        settings: {
            barnesHutOptimize: true,
            strongGravityMode: true,
            gravity: FORCE_LAYOUT_CONFIG.GRAVITY,
            scalingRatio: FORCE_LAYOUT_CONFIG.SCALING_RATIO,
            slowDown: FORCE_LAYOUT_CONFIG.SLOW_DOWN
        }
    };

    let iteration = 0;
    const interval = setInterval(() => {
        if (!state.forceRunning || iteration >= settings.iterations) {
            stopForceLayout();
            clearInterval(interval);
            return;
        }

        forceAtlas2.assign(graph, { iterations: 1, ...settings.settings });
        renderer.refresh();
        iteration++;

        const progress = Math.round((iteration / settings.iterations) * 100);
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${progress}%`;
    }, FORCE_LAYOUT_CONFIG.FRAME_RATE);
}

function stopForceLayout() {
    state.forceRunning = false;
    const btn = document.getElementById('btn-force-layout');
    btn.innerHTML = '<i class="fas fa-project-diagram"></i> Force Layout';
    btn.style.background = '#2196F3';
    saveData();
    showToast('Force Layout hoàn tất!', 'success');
}

// ==========================================
// PHẦN 9: DRAG & DROP
// ==========================================

function setupDragAndDrop() {
    const captor = renderer.getMouseCaptor();

    renderer.on('downNode', (e) => {
        state.isDragging = true;
        state.draggedNode = e.node;
        state.dragStartTime = Date.now();
        state.hasMoved = false;

        const attr = graph.getNodeAttributes(e.node);
        state.dragStartPos = { x: attr.x, y: attr.y };

        renderer.getCamera().disable();
        graph.setNodeAttribute(e.node, 'highlighted', true);
        renderer.refresh();
    });

    captor.on('mousemovebody', (e) => {
        if (!state.isDragging || !state.draggedNode) return;

        const pos = renderer.viewportToGraph(e);
        const dx = Math.abs(pos.x - state.dragStartPos.x);
        const dy = Math.abs(pos.y - state.dragStartPos.y);

        if (dx > DRAG_CONFIG.MOVE_THRESHOLD || dy > DRAG_CONFIG.MOVE_THRESHOLD) {
            state.hasMoved = true;
        }

        graph.setNodeAttribute(state.draggedNode, 'x', pos.x);
        graph.setNodeAttribute(state.draggedNode, 'y', pos.y);

        e.preventSigmaDefault();
        e.original.preventDefault();
        e.original.stopPropagation();
    });

    captor.on('mouseup', () => {
        if (state.isDragging && state.draggedNode) {
            const nodeA = state.draggedNode;
            const posA = graph.getNodeAttributes(nodeA);

            graph.removeNodeAttribute(nodeA, 'highlighted');

            if (state.hasMoved) {
                const dragDuration = Date.now() - state.dragStartTime;
                if (dragDuration > DRAG_CONFIG.MIN_DURATION) {
                    checkAndLinkNodes(nodeA, posA);
                }
            }

            saveData();
        }

        state.isDragging = false;
        state.draggedNode = null;
        state.hasMoved = false;
        state.dragStartPos = null;
        renderer.getCamera().enable();
        renderer.refresh();
    });
}

function checkAndLinkNodes(nodeA, posA) {
    let targetNode = null;
    let minDist = Infinity;
    const sizeA = posA.size || 10;

    graph.forEachNode((nodeB, attrB) => {
        if (nodeA !== nodeB && !attrB.hidden) {
            const dx = posA.x - attrB.x;
            const dy = posA.y - attrB.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const sizeB = attrB.size || 10;
            const threshold = (sizeA + sizeB) / 2 + 5;

            if (dist < threshold && dist < minDist) {
                targetNode = nodeB;
                minDist = dist;
            }
        }
    });

    if (targetNode) {
        const labelA = graph.getNodeAttribute(nodeA, 'label');
        const labelB = graph.getNodeAttribute(targetNode, 'label');

        if (graph.hasEdge(nodeA, targetNode) || graph.hasEdge(targetNode, nodeA)) {
            showToast(`"${labelA}" và "${labelB}" đã kết nối rồi!`, 'warning');
        } else {
            showLinkConfirmation(nodeA, targetNode, labelA, labelB, posA);
        }
    }
}

function showLinkConfirmation(nodeA, nodeB, labelA, labelB, posA) {
    const dialog = document.createElement('div');
    dialog.className = 'link-confirmation';
    dialog.innerHTML = `
        <div class="link-confirmation-content">
            <div class="link-icon">
                <i class="fas fa-link"></i>
            </div>
            <h3>Kết nối quan hệ?</h3>
            <p>Kết nối <strong>"${labelA}"</strong> với <strong>"${labelB}"</strong>?</p>
            <div class="link-label-input">
                <label>Nhãn quan hệ (tùy chọn):</label>
                <input type="text" id="quick-edge-label" placeholder="VD: Bố, Mẹ, Vợ, Bạn...">
            </div>
            <div class="link-actions">
                <button class="btn-cancel" id="link-cancel">
                    <i class="fas fa-times"></i> Không
                </button>
                <button class="btn-confirm" id="link-confirm">
                    <i class="fas fa-check"></i> Kết nối
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(dialog);
    setTimeout(() => dialog.classList.add('show'), 10);

    document.getElementById('link-confirm').addEventListener('click', () => {
        if (graph.hasEdge(nodeA, nodeB) || graph.hasEdge(nodeB, nodeA)) {
            showToast(`Đã có mối quan hệ!`, 'warning');
            removeDialog();
            return;
        }

        const edgeLabel = document.getElementById('quick-edge-label').value.trim();

        graph.addEdge(nodeA, nodeB, {
            relationship: 'other',
            color: EDGE_TYPES.other.color,
            label: edgeLabel,
            size: 2
        });
        graph.setNodeAttribute(nodeA, 'x', posA.x + DRAG_CONFIG.LINK_OFFSET.x);
        graph.setNodeAttribute(nodeA, 'y', posA.y + DRAG_CONFIG.LINK_OFFSET.y);
        applyColorsByDistance(false);
        updateNodeCount();
        saveData();
        showToast(`Đã kết nối "${labelA}" với "${labelB}"!`, 'success');
        removeDialog();
    });

    document.getElementById('link-cancel').addEventListener('click', removeDialog);

    function removeDialog() {
        dialog.classList.remove('show');
        setTimeout(() => dialog.remove(), 300);
    }
}

// ==========================================
// PHẦN 10: TOOLTIP FUNCTIONS
// ==========================================

function showNodeTooltip(nodeId, mouseX, mouseY) {
    const tooltip = document.getElementById('node-tooltip');
    if (!tooltip || !nodeId) return;

    const attrs = graph.getNodeAttributes(nodeId);
    const contact = attrs.contact || {};
    const layer = getLayerById(attrs.layer);

    // Update tooltip content
    document.getElementById('tooltip-avatar').textContent = getInitials(attrs.label);
    document.getElementById('tooltip-name').textContent = attrs.label;
    document.getElementById('tooltip-layer').querySelector('span').textContent = layer.name;
    document.getElementById('tooltip-phone').querySelector('span').textContent = contact.phone || '-';
    document.getElementById('tooltip-email').querySelector('span').textContent = contact.email || '-';
    document.getElementById('tooltip-company').querySelector('span').textContent = contact.company || '-';

    // Position tooltip
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = mouseX + 15;
    let top = mouseY + 15;

    // Adjust if tooltip goes off screen
    if (left + 280 > viewportWidth) {
        left = mouseX - 280 - 15;
    }
    if (top + 200 > viewportHeight) {
        top = mouseY - 200 - 15;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;

    // Show tooltip
    tooltip.classList.remove('tooltip-hidden');
    tooltip.classList.add('tooltip-visible');
}

function hideNodeTooltip() {
    const tooltip = document.getElementById('node-tooltip');
    if (tooltip) {
        tooltip.classList.remove('tooltip-visible');
        tooltip.classList.add('tooltip-hidden');
    }
}

// ==========================================
// PHẦN 11: SEARCH FUNCTIONS
// ==========================================

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    const searchResults = document.getElementById('search-results');

    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();

        // Toggle clear button
        searchClear.classList.toggle('visible', query.length > 0);

        if (query.length < 1) {
            searchResults.classList.remove('visible');
            return;
        }

        // Search nodes
        const results = [];
        graph.forEachNode((nodeId, attrs) => {
            const label = (attrs.label || '').toLowerCase();
            const contact = attrs.contact || {};
            const searchFields = [
                label,
                contact.phone || '',
                contact.email || '',
                contact.company || ''
            ].join(' ').toLowerCase();

            if (searchFields.includes(query)) {
                results.push({ nodeId, attrs });
            }
        });

        // Render results
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-no-results">Không tìm thấy kết quả</div>';
        } else {
            searchResults.innerHTML = results.slice(0, 10).map(({ nodeId, attrs }) => {
                const contact = attrs.contact || {};
                const layer = getLayerById(attrs.layer);
                const detail = contact.company || contact.phone || layer.name;
                return `
                    <div class="search-result-item" data-node-id="${nodeId}">
                        <div class="search-result-avatar" style="background: ${layer.color};">${getInitials(attrs.label)}</div>
                        <div class="search-result-info">
                            <div class="search-result-name">${attrs.label}</div>
                            <div class="search-result-detail">${detail}</div>
                        </div>
                    </div>
                `;
            }).join('');

            // Add click handlers
            searchResults.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const nodeId = item.dataset.nodeId;
                    focusOnNode(nodeId);
                    openDetailPanel(nodeId);
                    searchResults.classList.remove('visible');
                    searchInput.value = '';
                    searchClear.classList.remove('visible');
                });
            });
        }

        searchResults.classList.add('visible');
    });

    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.classList.remove('visible');
        searchResults.classList.remove('visible');
    });

    // Close results when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#search-container')) {
            searchResults.classList.remove('visible');
        }
    });
}

function focusOnNode(nodeId) {
    if (!graph.hasNode(nodeId)) return;

    const attrs = graph.getNodeAttributes(nodeId);
    const camera = renderer.getCamera();

    camera.animate({
        x: attrs.x,
        y: attrs.y,
        ratio: 0.5
    }, { duration: 500 });

    // Highlight the node briefly
    graph.setNodeAttribute(nodeId, 'highlighted', true);
    setTimeout(() => {
        graph.removeNodeAttribute(nodeId, 'highlighted');
        renderer.refresh();
    }, 2000);

    renderer.refresh();
}

// ==========================================
// PHẦN 12: STATISTICS FUNCTIONS
// ==========================================

function updateStatistics() {
    const totalNodes = graph.order;
    const totalEdges = graph.size;
    const totalLayers = state.layers.length;

    document.getElementById('stat-total').textContent = totalNodes;
    document.getElementById('stat-connections').textContent = totalEdges;
    document.getElementById('stat-layers').textContent = totalLayers;
}

// ==========================================
// PHẦN 13: DETAIL PANEL FUNCTIONS
// ==========================================

function openDetailPanel(nodeId) {
    if (!graph.hasNode(nodeId)) return;

    state.detailNode = nodeId;
    const panel = document.getElementById('detail-panel');
    const attrs = graph.getNodeAttributes(nodeId);
    const contact = attrs.contact || {};
    const layer = getLayerById(attrs.layer);

    // Update header
    document.getElementById('detail-avatar').textContent = getInitials(attrs.label);
    document.getElementById('detail-avatar').style.background = layer.color;
    document.getElementById('detail-name').textContent = attrs.label;
    document.getElementById('detail-layer-badge').textContent = layer.name;
    document.getElementById('detail-layer-badge').style.background = layer.color;

    // Update stats
    const distance = attrs.distance !== undefined ? attrs.distance : '-';
    const connections = graph.degree(nodeId);
    document.getElementById('detail-distance').textContent = distance === 0 ? 'Trung tâm' : distance;
    document.getElementById('detail-connections').textContent = connections;

    // Update contact info
    updateDetailField('detail-phone', contact.phone);
    updateDetailField('detail-email', contact.email);
    updateDetailField('detail-address', contact.address);
    updateDetailField('detail-company', contact.company);
    updateDetailField('detail-position', contact.position);

    // Update social links
    const fbField = document.getElementById('detail-facebook');
    if (contact.facebook) {
        fbField.querySelector('a').href = contact.facebook;
        fbField.querySelector('a').textContent = 'Facebook';
        fbField.style.display = 'flex';
    } else {
        fbField.querySelector('a').textContent = '-';
        fbField.querySelector('a').href = '#';
    }
    updateDetailField('detail-social', contact.social);

    // Update notes
    document.getElementById('detail-birthday').querySelector('span').textContent = formatDate(contact.birthday);
    document.getElementById('detail-notes').querySelector('p').textContent = contact.notes || '-';

    // Update relationships
    updateRelationshipList(nodeId);

    // Show panel
    panel.classList.remove('hidden');
}

function updateDetailField(fieldId, value) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.querySelector('span').textContent = value || '-';
    }
}

function updateRelationshipList(nodeId) {
    const listContainer = document.getElementById('relationship-list');
    if (!listContainer) return;

    const relationships = [];
    graph.forEachNeighbor(nodeId, (neighborId, neighborAttrs) => {
        // Get edge between nodes
        let edgeLabel = '';
        let edgeColor = '#667eea';

        graph.forEachEdge(nodeId, (edge, edgeAttrs, source, target) => {
            if (source === neighborId || target === neighborId) {
                edgeLabel = edgeAttrs.label || '';
                edgeColor = edgeAttrs.color || '#667eea';
            }
        });

        const layer = getLayerById(neighborAttrs.layer);
        relationships.push({
            nodeId: neighborId,
            name: neighborAttrs.label,
            label: edgeLabel,
            color: layer.color
        });
    });

    if (relationships.length === 0) {
        listContainer.innerHTML = '<div class="no-relationships">Chưa có kết nối</div>';
    } else {
        listContainer.innerHTML = relationships.map(rel => `
            <div class="relationship-item" data-node-id="${rel.nodeId}">
                <div class="relationship-avatar" style="background: ${rel.color};">${getInitials(rel.name)}</div>
                <div class="relationship-info">
                    <div class="relationship-name">${rel.name}</div>
                    <div class="relationship-label">${rel.label || 'Quan hệ'}</div>
                </div>
            </div>
        `).join('');

        // Add click handlers
        listContainer.querySelectorAll('.relationship-item').forEach(item => {
            item.addEventListener('click', () => {
                const targetNodeId = item.dataset.nodeId;
                focusOnNode(targetNodeId);
                openDetailPanel(targetNodeId);
            });
        });
    }
}

function closeDetailPanel() {
    const panel = document.getElementById('detail-panel');
    panel.classList.add('hidden');
    state.detailNode = null;
}

// ==========================================
// PHẦN 14: ZOOM CONTROLS
// ==========================================

function setupZoomControls() {
    const zoomIn = document.getElementById('btn-zoom-in');
    const zoomOut = document.getElementById('btn-zoom-out');
    const zoomReset = document.getElementById('btn-zoom-reset');
    const centerGraph = document.getElementById('btn-center-graph');

    if (zoomIn) {
        zoomIn.addEventListener('click', () => {
            const camera = renderer.getCamera();
            camera.animatedZoom({ duration: 300 });
        });
    }

    if (zoomOut) {
        zoomOut.addEventListener('click', () => {
            const camera = renderer.getCamera();
            camera.animatedUnzoom({ duration: 300 });
        });
    }

    if (zoomReset) {
        zoomReset.addEventListener('click', () => {
            const camera = renderer.getCamera();
            camera.animate({ ratio: 1 }, { duration: 300 });
        });
    }

    if (centerGraph) {
        centerGraph.addEventListener('click', () => {
            // Center on the "center" node (TÔI)
            if (graph.hasNode('center')) {
                focusOnNode('center');
            } else {
                // Reset camera to center
                const camera = renderer.getCamera();
                camera.animate({ x: 0, y: 0, ratio: 1 }, { duration: 300 });
            }
        });
    }
}

// ==========================================
// PHẦN 15: COPY FUNCTIONS
// ==========================================

function setupCopyButtons() {
    document.querySelectorAll('.btn-copy').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!state.detailNode) return;

            const copyType = btn.dataset.copy;
            const attrs = graph.getNodeAttributes(state.detailNode);
            const contact = attrs.contact || {};

            let textToCopy = '';
            if (copyType === 'phone') textToCopy = contact.phone || '';
            if (copyType === 'email') textToCopy = contact.email || '';

            if (textToCopy) {
                try {
                    await navigator.clipboard.writeText(textToCopy);
                    showToast('Đã copy!', 'success', 1500);
                } catch (err) {
                    showToast('Không thể copy', 'error');
                }
            }
        });
    });
}

// ==========================================
// PHẦN 16: CLICK HANDLERS
// ==========================================

function setupClickHandlers() {
    renderer.on('clickStage', () => {
        if (!state.hasMoved && !state.isDragging) {
            state.parentNode = null;
            openModal(null, 'ADD');
        }
    });

    renderer.on('clickNode', (e) => {
        const now = Date.now();
        const isDoubleClick = (now - state.lastClickTime) < 300;
        state.lastClickTime = now;

        setTimeout(() => {
            if (!state.isDragging && !state.hasMoved) {
                if (isDoubleClick) {
                    // Double click - open edit modal
                    openModal(e.node, 'EDIT');
                } else {
                    // Single click - open detail panel
                    openDetailPanel(e.node);
                }
            }
        }, 150);
    });

    renderer.on('clickEdge', (e) => {
        if (!state.isDragging) {
            openEdgeModal(e.edge);
        }
    });

    // Hover events for tooltip
    renderer.on('enterNode', (e) => {
        state.hoveredNode = e.node;
        const mousePosition = renderer.viewportToFramedGraph(e.event);
        const screenCoords = renderer.framedGraphToViewport(mousePosition);
        showNodeTooltip(e.node, e.event.clientX, e.event.clientY);
    });

    renderer.on('leaveNode', () => {
        state.hoveredNode = null;
        hideNodeTooltip();
    });
}

// ==========================================
// PHẦN 11: BUTTON HANDLERS
// ==========================================

// Save Node
ui.btnSave.addEventListener('click', () => {
    const label = ui.inpLabel.value.trim();
    const layer = ui.inpLayer?.value || 'others';

    if (!label) {
        showToast('Vui lòng nhập tên!', 'warning');
        return;
    }

    const contact = {
        email: ui.inpEmail?.value.trim() || '',
        phone: ui.inpPhone?.value.trim() || '',
        address: ui.inpAddress?.value.trim() || '',
        company: ui.inpCompany?.value.trim() || '',
        position: ui.inpPosition?.value.trim() || '',
        facebook: ui.inpFacebook?.value.trim() || '',
        social: ui.inpSocial?.value.trim() || '',
        birthday: ui.inpBirthday?.value || '',
        notes: ui.inpNotes?.value.trim() || ''
    };

    if (state.mode === 'ADD') {
        const newId = 'n_' + Date.now();
        let initX = (Math.random() - 0.5) * 20;
        let initY = (Math.random() - 0.5) * 20;

        if (state.parentNode) {
            const pAttr = graph.getNodeAttributes(state.parentNode);
            initX = pAttr.x + 8;
            initY = pAttr.y + 8;
        }

        graph.addNode(newId, {
            label: label,
            layer: layer,
            distance: 0,
            size: 15,
            color: '#999',
            x: initX,
            y: initY,
            contact: contact
        });

        if (state.parentNode) {
            graph.addEdge(state.parentNode, newId, {
                relationship: layer === 'family' ? 'family' : 'other',
                color: layer === 'family' ? EDGE_TYPES.family.color : EDGE_TYPES.other.color,
                label: '',
                size: 2
            });
        }

        applyColorsByDistance(false);
        updateNodeCount();
        showToast(`Đã thêm "${label}"!`, 'success');
    } else {
        if (state.selectedNode) {
            graph.setNodeAttribute(state.selectedNode, 'label', label);
            if (state.selectedNode !== 'center') {
                graph.setNodeAttribute(state.selectedNode, 'layer', layer);
            }
            graph.setNodeAttribute(state.selectedNode, 'contact', contact);
            showToast('Đã cập nhật!', 'success');
        }
    }

    saveData();
    closeModal();
    renderer.refresh();
});

// Save Edge
document.getElementById('btn-save-edge').addEventListener('click', () => {
    if (!state.selectedEdge) return;

    const edgeType = ui.edgeType.value;
    const edgeLabel = ui.edgeLabel.value.trim();

    graph.setEdgeAttribute(state.selectedEdge, 'relationship', edgeType);
    graph.setEdgeAttribute(state.selectedEdge, 'color', EDGE_TYPES[edgeType].color);
    graph.setEdgeAttribute(state.selectedEdge, 'label', edgeLabel);

    saveData();
    closeEdgeModal();
    renderer.refresh();
    showToast(`Đã cập nhật mối quan hệ!`, 'success');
});

// Delete Edge
document.getElementById('btn-delete-edge').addEventListener('click', () => {
    if (!state.selectedEdge) return;

    const source = graph.source(state.selectedEdge);
    const target = graph.target(state.selectedEdge);
    const sourceLabel = graph.getNodeAttribute(source, 'label');
    const targetLabel = graph.getNodeAttribute(target, 'label');

    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'link-confirmation';
    confirmDialog.innerHTML = `
        <div class="link-confirmation-content">
            <div class="link-icon danger">
                <i class="fas fa-unlink"></i>
            </div>
            <h3>Xóa mối quan hệ?</h3>
            <p>Ngắt kết nối giữa <strong>"${sourceLabel}"</strong> và <strong>"${targetLabel}"</strong>?</p>
            <div class="link-actions">
                <button class="btn-cancel" id="delete-edge-cancel">Hủy</button>
                <button class="btn-confirm danger" id="delete-edge-confirm">
                    <i class="fas fa-trash"></i> Xóa
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(confirmDialog);
    setTimeout(() => confirmDialog.classList.add('show'), 10);

    document.getElementById('delete-edge-confirm').addEventListener('click', () => {
        graph.dropEdge(state.selectedEdge);
        applyColorsByDistance(false);
        saveData();
        closeEdgeModal();
        showToast('Đã xóa mối quan hệ!', 'success');
        removeDialog();
    });

    document.getElementById('delete-edge-cancel').addEventListener('click', removeDialog);

    function removeDialog() {
        confirmDialog.classList.remove('show');
        setTimeout(() => confirmDialog.remove(), 300);
    }
});

// Preset buttons for relationship labels
document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        ui.edgeLabel.value = btn.dataset.label;
    });
});

// Add child node
document.getElementById('btn-add-child').addEventListener('click', () => {
    state.parentNode = state.selectedNode;
    openModal(null, 'ADD');
});

// Delete node
document.getElementById('btn-delete').addEventListener('click', () => {
    if (!state.selectedNode || state.selectedNode === 'center') return;

    const label = graph.getNodeAttribute(state.selectedNode, 'label');

    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'link-confirmation';
    confirmDialog.innerHTML = `
        <div class="link-confirmation-content">
            <div class="link-icon danger">
                <i class="fas fa-trash-alt"></i>
            </div>
            <h3>Xác nhận xóa</h3>
            <p>Xóa <strong>"${label}"</strong> và tất cả mối quan hệ liên quan?</p>
            <div class="link-actions">
                <button class="btn-cancel" id="delete-cancel">Hủy</button>
                <button class="btn-confirm danger" id="delete-confirm">
                    <i class="fas fa-trash"></i> Xóa
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(confirmDialog);
    setTimeout(() => confirmDialog.classList.add('show'), 10);

    document.getElementById('delete-confirm').addEventListener('click', () => {
        graph.dropNode(state.selectedNode);
        applyColorsByDistance(false);
        updateNodeCount();
        saveData();
        closeModal();
        showToast('Đã xóa!', 'success');
        removeDialog();
    });

    document.getElementById('delete-cancel').addEventListener('click', removeDialog);

    function removeDialog() {
        confirmDialog.classList.remove('show');
        setTimeout(() => confirmDialog.remove(), 300);
    }
});

// Close modals
document.getElementById('btn-x-close').addEventListener('click', closeModal);
document.getElementById('btn-x-close-edge').addEventListener('click', closeEdgeModal);
document.getElementById('btn-x-close-layer').addEventListener('click', closeLayerModal);
document.getElementById('close-layers-panel').addEventListener('click', toggleLayersPanel);
document.getElementById('close-detail-panel').addEventListener('click', closeDetailPanel);

// Edit from detail panel
document.getElementById('btn-edit-from-detail').addEventListener('click', () => {
    if (state.detailNode) {
        openModal(state.detailNode, 'EDIT');
    }
});

ui.overlay.addEventListener('click', () => {
    closeModal();
    closeEdgeModal();
    closeLayerModal();
});

// Toolbar buttons
document.getElementById('btn-export').addEventListener('click', downloadJSON);
document.getElementById('btn-import-trigger').addEventListener('click', () => document.getElementById('file-input').click());
document.getElementById('file-input').addEventListener('change', uploadJSON);
document.getElementById('btn-capture').addEventListener('click', captureGraphImage);
document.getElementById('btn-force-layout').addEventListener('click', startForceLayout);
document.getElementById('btn-recolor').addEventListener('click', () => applyColorsByDistance(true));
document.getElementById('btn-manage-layers').addEventListener('click', toggleLayersPanel);

// Layer management
document.getElementById('btn-add-layer').addEventListener('click', addLayer);
document.getElementById('btn-save-layer').addEventListener('click', saveLayer);
document.getElementById('btn-delete-layer').addEventListener('click', deleteLayer);

// Reset data
document.getElementById('btn-reset-data').addEventListener('click', () => {
    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'link-confirmation';
    confirmDialog.innerHTML = `
        <div class="link-confirmation-content">
            <div class="link-icon danger">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3>Reset toàn bộ?</h3>
            <p>Tất cả dữ liệu sẽ bị xóa vĩnh viễn!</p>
            <div class="link-actions">
                <button class="btn-cancel" id="reset-cancel">Hủy</button>
                <button class="btn-confirm danger" id="reset-confirm">Reset</button>
            </div>
        </div>
    `;

    document.body.appendChild(confirmDialog);
    setTimeout(() => confirmDialog.classList.add('show'), 10);

    document.getElementById('reset-confirm').addEventListener('click', () => {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('social_graph_v2_data');
        location.reload();
    });

    document.getElementById('reset-cancel').addEventListener('click', () => {
        confirmDialog.classList.remove('show');
        setTimeout(() => confirmDialog.remove(), 300);
    });
});

// ==========================================
// PHẦN 17: INITIALIZATION
// ==========================================

if (!loadData()) initDefaultData();

const container = document.getElementById(CONTAINER_ID);
renderer = new Sigma(graph, container, {
    renderEdgeLabels: true,
    defaultEdgeType: 'line',
    edgeLabelSize: 11,
    edgeLabelColor: { color: '#333' },
    edgeProgramClasses: {},
    labelRenderedSizeThreshold: 6,
    labelDensity: 0.1,
    labelGridCellSize: 60,
    labelFont: 'Segoe UI, sans-serif',
    defaultEdgeColor: '#999',
    nodeReducer: (node, data) => {
        const res = { ...data };
        if (state.hoveredNode === node || data.highlighted) {
            res.highlighted = true;
            res.zIndex = 1;
        }
        return res;
    },
    edgeReducer: (edge, data) => {
        const res = { ...data };
        // Ensure edges always have minimum size
        if (!res.size || res.size < 1.5) {
            res.size = 1.5;
        }
        // When hovering a node, highlight connected edges
        if (state.hoveredNode) {
            const source = graph.source(edge);
            const target = graph.target(edge);
            if (source === state.hoveredNode || target === state.hoveredNode) {
                res.highlighted = true;
                res.size = 3;
                res.zIndex = 1;
            } else {
                // Dim other edges instead of hiding
                res.color = '#e0e0e0';
            }
        }
        return res;
    }
});

// Initialize UI
renderLayerFilters();
renderLayersList();
updateNodeCount();
updateStatistics();
applyColorsByDistance(false);

// Setup new features
setupDragAndDrop();
setupClickHandlers();
setupSearch();
setupZoomControls();
setupCopyButtons();

// Welcome message
setTimeout(() => {
    showToast('SocialGraph v3.1 - Hover để xem nhanh, Click để xem chi tiết!', 'info', 4000);
}, 500);
