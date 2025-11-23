import Graph from 'https://cdn.skypack.dev/graphology';
import Sigma from 'https://cdn.skypack.dev/sigma';
import forceAtlas2 from 'https://cdn.skypack.dev/graphology-layout-forceatlas2';

// ==========================================
// PHẦN 1: CẤU HÌNH & DỮ LIỆU
// ==========================================

const CONTAINER_ID = 'container';
const STORAGE_KEY = 'social_graph_v2_data';
const AUTOSAVE_BADGE = document.getElementById('autosave-status');

// ✨ NEW: Edge relationship types
const EDGE_TYPES = {
    family: { label: 'Họ hàng', color: '#E53935' },
    spouse: { label: 'Vợ/Chồng', color: '#D81B60' },
    friend: { label: 'Bạn bè', color: '#3949AB' },
    colleague: { label: 'Đồng nghiệp', color: '#1E88E5' },
    mentor: { label: 'Thầy/Trò', color: '#8E24AA' },
    partner: { label: 'Đối tác', color: '#00ACC1' },
    other: { label: 'Khác', color: '#999' }
};

// ✨ NEW: Node types for tabs
const NODE_TYPES = {
    family: 'Họ hàng',
    social: 'Xã hội'
};

// Helper: Màu sắc & Kích thước theo KHOẢNG CÁCH từ center
const getColorByDistance = (distance) => {
    const colors = [
        '#222',      // 0: Center (Tôi)
        '#E53935',   // 1: Rất gần
        '#D81B60',   // 2: Gần
        '#8E24AA',   // 3: Trung bình
        '#5E35B1',   // 4: Xa
        '#3949AB',   // 5: Rất xa
        '#1E88E5'    // 6+: Cực xa
    ];
    return colors[Math.min(distance, colors.length - 1)] || '#999';
};

const getSizeByDistance = (distance) => {
    if (distance === 0) return 25; // Center node
    return Math.max(8, 22 - (distance * 2.5));
};

// Khởi tạo đồ thị
let graph = new Graph();
let renderer = null;
let forceLayout = null;

let state = {
    selectedNode: null,
    selectedEdge: null,     // ✨ NEW: Selected edge
    parentNode: null,
    mode: 'NORMAL',
    draggedNode: null,
    isDragging: false,
    dragStartTime: 0,
    dragStartPos: null,
    hasMoved: false,
    selectedForExport: new Set(),
    lastSaved: null,
    currentTab: 'all',      // ✨ NEW: Current tab (all/family/social)
    forceRunning: false     // ✨ NEW: Force layout running status
};

// ==========================================
// ✨ BREADTH-FIRST SEARCH: Tính khoảng cách từ center
// ==========================================

function calculateDistancesFromCenter() {
    const distances = new Map();
    const queue = ['center'];
    distances.set('center', 0);

    while (queue.length > 0) {
        const current = queue.shift();
        const currentDist = distances.get(current);

        // Duyệt tất cả neighbors
        graph.forEachNeighbor(current, (neighbor) => {
            if (!distances.has(neighbor)) {
                distances.set(neighbor, currentDist + 1);
                queue.push(neighbor);
            }
        });
    }

    return distances;
}

// ✨ Apply colors based on distance from center
function applyColorsByDistance() {
    const distances = calculateDistancesFromCenter();

    graph.forEachNode((node) => {
        const distance = distances.get(node) || 6;
        graph.setNodeAttribute(node, 'distance', distance);
        graph.setNodeAttribute(node, 'color', getColorByDistance(distance));
        graph.setNodeAttribute(node, 'size', getSizeByDistance(distance));
    });

    renderer.refresh();
    showToast('Đã cập nhật màu sắc theo khoảng cách!', 'success');
}

// ==========================================
// ✨ TOAST NOTIFICATION SYSTEM
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
// PHẦN 2: QUẢN LÝ LƯU TRỮ
// ==========================================

function saveData() {
    const payload = {
        graph: graph.export(),
        selection: Array.from(state.selectedForExport)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    updateAutosaveBadge();
}

function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            const data = JSON.parse(raw);
            const graphData = data.graph || data;
            graph.import(graphData);
            if (Array.isArray(data.selection)) {
                state.selectedForExport = new Set(data.selection);
            }
            return true;
        } catch (e) {
            console.error("Lỗi dữ liệu save:", e);
            return false;
        }
    }
    return false;
}

function initDefaultData() {
    graph.clear();
    graph.addNode('center', {
        label: "TÔI",
        distance: 0,
        x: 0,
        y: 0,
        size: 25,
        color: getColorByDistance(0),
        type: 'social' // Default type
    });
    state.selectedForExport = new Set();
    saveData();
}

// Export functions
function downloadJSON() {
    const data = graph.export();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = "social_graph_" + Date.now() + ".json";
    a.click();
    showToast('Đã xuất file JSON thành công!', 'success');
}

function downloadSelectedJSON() {
    if (!state.selectedForExport.size) {
        showToast('Bạn chưa chọn người nào để xuất', 'warning');
        return;
    }

    const exportData = graph.export();
    const selectedSet = new Set(state.selectedForExport);
    const filtered = {
        attributes: exportData.attributes || {},
        options: exportData.options || {},
        nodes: exportData.nodes.filter(n => selectedSet.has(n.key)),
        edges: exportData.edges.filter(e => selectedSet.has(e.source) && selectedSet.has(e.target))
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filtered, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = "social_graph_selected_" + Date.now() + ".json";
    a.click();
    showToast(`Đã xuất ${state.selectedForExport.size} người thành công!`, 'success');
}

async function captureGraphImage() {
    showToast('Đang chụp ảnh...', 'info', 2000);
    const container = document.getElementById(CONTAINER_ID);
    const { default: html2canvas } = await import('https://cdn.skypack.dev/html2canvas');
    const canvas = await html2canvas(container, { scale: 2, useCORS: true });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `social_graph_${Date.now()}.png`;
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
            graph.import(data);
            applyColorsByDistance();
            state.selectedForExport = new Set();
            updateSelectionUI();
            saveData();
            showToast('Đã nhập dữ liệu thành công!', 'success');
        } catch (err) {
            showToast('File không hợp lệ!', 'error');
        }
    };
    reader.readAsText(file);
}

// ==========================================
// ✨ FORCE-DIRECTED LAYOUT
// ==========================================

function startForceLayout() {
    if (state.forceRunning) {
        stopForceLayout();
        return;
    }

    state.forceRunning = true;
    const btn = document.getElementById('btn-force-layout');
    btn.innerHTML = '<i class="fas fa-stop"></i> Dừng Force';
    btn.style.background = '#f44336';

    showToast('Đang chạy Force Layout...', 'info', 2000);

    // Configure ForceAtlas2
    const settings = {
        iterations: 100,
        settings: {
            barnesHutOptimize: true,
            strongGravityMode: true,
            gravity: 0.05,
            scalingRatio: 10,
            slowDown: 1
        }
    };

    // Run iterations
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

        // Update progress
        const progress = Math.round((iteration / settings.iterations) * 100);
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${progress}%`;
    }, 16); // ~60fps
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
// ✨ TAB FILTERING
// ==========================================

function switchTab(tab) {
    state.currentTab = tab;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        }
    });

    // Filter and display nodes
    if (tab === 'all') {
        // Show all nodes
        graph.forEachNode((node) => {
            graph.setNodeAttribute(node, 'hidden', false);
        });
    } else {
        // Show only nodes of selected type
        graph.forEachNode((node) => {
            const nodeType = graph.getNodeAttribute(node, 'type') || 'social';
            graph.setNodeAttribute(node, 'hidden', nodeType !== tab);
        });
    }

    // Hide edges if both source and target are hidden
    graph.forEachEdge((edge) => {
        const source = graph.source(edge);
        const target = graph.target(edge);
        const sourceHidden = graph.getNodeAttribute(source, 'hidden');
        const targetHidden = graph.getNodeAttribute(target, 'hidden');
        graph.setEdgeAttribute(edge, 'hidden', sourceHidden || targetHidden);
    });

    renderer.refresh();
}

// ==========================================
// PHẦN 3: UI & STATE
// ==========================================

const ui = {
    modal: document.getElementById('modal'),
    edgeModal: document.getElementById('edge-modal'),  // ✨ NEW: Edge modal
    overlay: document.getElementById('overlay'),
    inpLabel: document.getElementById('inp-label'),
    inpType: document.getElementById('inp-type'),      // ✨ NEW: Node type input
    title: document.getElementById('modal-title'),
    editActions: document.getElementById('edit-actions'),
    btnSave: document.getElementById('btn-save'),
    toggleSelection: document.getElementById('toggle-selection'),
    edgeType: document.getElementById('edge-type')     // ✨ NEW: Edge type select
};

function updateAutosaveBadge() {
    if (!AUTOSAVE_BADGE) return;
    const now = new Date();
    state.lastSaved = now;
    AUTOSAVE_BADGE.innerText = `Đã lưu lúc ${now.toLocaleTimeString()}`;
    AUTOSAVE_BADGE.classList.add('flash');
    setTimeout(() => AUTOSAVE_BADGE.classList.remove('flash'), 700);
}

function updateSelectionUI() {
    const count = state.selectedForExport.size;
    const selectionText = document.getElementById('selection-count');
    const exportBtn = document.getElementById('btn-export-selected');
    const clearBtn = document.getElementById('btn-clear-selection');

    if (selectionText) selectionText.innerText = count ? `${count} người đã chọn` : 'Chưa chọn';
    if (exportBtn) exportBtn.disabled = count === 0;
    if (clearBtn) clearBtn.disabled = count === 0;
}

function closeModal() {
    ui.modal.style.display = 'none';
    ui.overlay.style.display = 'none';
    ui.inpLabel.value = '';
    state.mode = 'NORMAL';
    state.selectedNode = null;
    state.parentNode = null;
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

        ui.inpType.value = "social";
        if (ui.toggleSelection) ui.toggleSelection.checked = true;
        ui.btnSave.innerHTML = '<i class="fas fa-plus"></i> Thêm';
        ui.editActions.style.display = 'none';
        setTimeout(() => ui.inpLabel.focus(), 100);
    } else {
        state.selectedNode = nodeId;
        const attr = graph.getNodeAttributes(nodeId);
        ui.title.innerText = attr.label;
        ui.inpLabel.value = attr.label;
        ui.inpType.value = attr.type || 'social';
        if (ui.toggleSelection) ui.toggleSelection.checked = state.selectedForExport.has(nodeId);
        ui.btnSave.innerHTML = '<i class="fas fa-save"></i> Lưu';

        const isCenter = (nodeId === 'center');
        document.getElementById('btn-delete').style.display = isCenter ? 'none' : 'block';
        ui.inpType.disabled = isCenter;
        ui.editActions.style.display = 'block';
    }
}

// ✨ NEW: Open Edge Modal
function openEdgeModal(edge) {
    state.selectedEdge = edge;
    ui.overlay.style.display = 'block';
    ui.edgeModal.style.display = 'block';

    const source = graph.source(edge);
    const target = graph.target(edge);
    const sourceLabel = graph.getNodeAttribute(source, 'label');
    const targetLabel = graph.getNodeAttribute(target, 'label');

    document.getElementById('edge-modal-title').innerText = `${sourceLabel} ↔ ${targetLabel}`;

    const edgeType = graph.getEdgeAttribute(edge, 'type') || 'other';
    ui.edgeType.value = edgeType;
}

// ==========================================
// ✨ DRAG & DROP LOGIC
// ==========================================

const camera = renderer ? renderer.getCamera() : null;

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

        if (dx > 0.5 || dy > 0.5) {
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
                if (dragDuration > 100) {
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
        if (nodeA !== nodeB) {
            const dx = posA.x - attrB.x;
            const dy = posA.y - attrB.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const sizeB = attrB.size || 10;
            const threshold = (sizeA + sizeB) / 2 + 3;

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
        graph.addEdge(nodeA, nodeB, { type: 'other', color: EDGE_TYPES.other.color });
        graph.setNodeAttribute(nodeA, 'x', posA.x + 12);
        graph.setNodeAttribute(nodeA, 'y', posA.y + 8);
        applyColorsByDistance(); // Update colors after new connection
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
// ✨ CLICK HANDLING
// ==========================================

function setupClickHandlers() {
    renderer.on('clickStage', () => {
        if (!state.hasMoved && !state.isDragging) {
            state.parentNode = null;
            openModal(null, 'ADD');
        }
    });

    renderer.on('clickNode', (e) => {
        setTimeout(() => {
            if (!state.isDragging && !state.hasMoved) {
                openModal(e.node, 'EDIT');
            }
        }, 150);
    });

    // ✨ NEW: Click on Edge
    renderer.on('clickEdge', (e) => {
        if (!state.isDragging) {
            openEdgeModal(e.edge);
        }
    });
}

// ==========================================
// PHẦN 4: BUTTON HANDLERS
// ==========================================

ui.btnSave.addEventListener('click', () => {
    const label = ui.inpLabel.value.trim();
    const type = ui.inpType.value;
    const shouldSelect = ui.toggleSelection ? ui.toggleSelection.checked : false;

    if (!label) {
        showToast('Vui lòng nhập tên!', 'warning');
        return;
    }

    if (state.mode === 'ADD') {
        const newId = 'n_' + Date.now();
        let initX = (Math.random() - 0.5) * 20;
        let initY = (Math.random() - 0.5) * 20;

        if (state.parentNode) {
            const pAttr = graph.getNodeAttributes(state.parentNode);
            initX = pAttr.x + 5;
            initY = pAttr.y + 5;
        }

        graph.addNode(newId, {
            label: label,
            type: type,
            distance: 0,
            size: 15,
            color: '#999',
            x: initX,
            y: initY
        });

        if (state.parentNode) {
            graph.addEdge(state.parentNode, newId, {
                type: type === 'family' ? 'family' : 'other',
                color: type === 'family' ? EDGE_TYPES.family.color : EDGE_TYPES.other.color
            });
        }

        if (shouldSelect) state.selectedForExport.add(newId);

        applyColorsByDistance();
        showToast(`Đã thêm "${label}"!`, 'success');
    } else {
        if (state.selectedNode) {
            graph.setNodeAttribute(state.selectedNode, 'label', label);
            if (state.selectedNode !== 'center') {
                graph.setNodeAttribute(state.selectedNode, 'type', type);
            }
            if (shouldSelect) {
                state.selectedForExport.add(state.selectedNode);
            } else {
                state.selectedForExport.delete(state.selectedNode);
            }
            showToast('Đã cập nhật!', 'success');
        }
    }

    updateSelectionUI();
    saveData();
    closeModal();
});

// ✨ NEW: Save Edge Type
document.getElementById('btn-save-edge').addEventListener('click', () => {
    if (!state.selectedEdge) return;

    const edgeType = ui.edgeType.value;
    graph.setEdgeAttribute(state.selectedEdge, 'type', edgeType);
    graph.setEdgeAttribute(state.selectedEdge, 'color', EDGE_TYPES[edgeType].color);

    saveData();
    closeEdgeModal();
    showToast(`Đã cập nhật loại quan hệ!`, 'success');
});

// ✨ NEW: Delete Edge
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
        applyColorsByDistance();
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

document.getElementById('btn-add-child').addEventListener('click', () => {
    state.parentNode = state.selectedNode;
    openModal(null, 'ADD');
});

document.getElementById('btn-start-link').addEventListener('click', () => {
    showToast('Mẹo: Kéo thả node đè lên node khác để nối nhanh!', 'info', 4000);
    closeModal();
});

document.getElementById('btn-delete').addEventListener('click', () => {
    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'link-confirmation';
    confirmDialog.innerHTML = `
        <div class="link-confirmation-content">
            <div class="link-icon danger">
                <i class="fas fa-trash-alt"></i>
            </div>
            <h3>Xác nhận xóa</h3>
            <p>Xóa người này?</p>
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
        state.selectedForExport.delete(state.selectedNode);
        applyColorsByDistance();
        updateSelectionUI();
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

// Other UI events
document.getElementById('btn-x-close').addEventListener('click', closeModal);
document.getElementById('btn-x-close-edge').addEventListener('click', closeEdgeModal);
ui.overlay.addEventListener('click', () => {
    closeModal();
    closeEdgeModal();
});

document.getElementById('btn-export').addEventListener('click', downloadJSON);
document.getElementById('btn-export-selected').addEventListener('click', downloadSelectedJSON);
document.getElementById('btn-import-trigger').addEventListener('click', () => document.getElementById('file-input').click());
document.getElementById('file-input').addEventListener('change', uploadJSON);

document.getElementById('btn-reset-data').addEventListener('click', () => {
    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'link-confirmation';
    confirmDialog.innerHTML = `
        <div class="link-confirmation-content">
            <div class="link-icon danger">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3>Reset toàn bộ?</h3>
            <p>Tất cả dữ liệu sẽ bị xóa!</p>
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
        location.reload();
    });

    document.getElementById('reset-cancel').addEventListener('click', () => {
        confirmDialog.classList.remove('show');
        setTimeout(() => confirmDialog.remove(), 300);
    });
});

document.getElementById('btn-clear-selection').addEventListener('click', () => {
    state.selectedForExport = new Set();
    updateSelectionUI();
    saveData();
    showToast('Đã bỏ chọn tất cả!', 'info');
});

document.getElementById('btn-capture').addEventListener('click', captureGraphImage);

// ✨ NEW: Force Layout Button
document.getElementById('btn-force-layout').addEventListener('click', startForceLayout);

// ✨ NEW: Recolor Button
document.getElementById('btn-recolor').addEventListener('click', applyColorsByDistance);

// ✨ NEW: Tab buttons
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// ==========================================
// INITIALIZATION
// ==========================================

if (!loadData()) initDefaultData();
applyColorsByDistance();
updateSelectionUI();
updateAutosaveBadge();

const container = document.getElementById(CONTAINER_ID);
renderer = new Sigma(graph, container, {
    renderEdgeLabels: false,
    defaultEdgeType: 'line',
    edgeProgramClasses: {},
});

setupDragAndDrop();
setupClickHandlers();

// Welcome message
setTimeout(() => {
    showToast('Kéo thả để nối, Click edge để sửa quan hệ!', 'info', 4000);
}, 500);
