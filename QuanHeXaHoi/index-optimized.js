import Graph from 'https://cdn.skypack.dev/graphology';
import Sigma from 'https://cdn.skypack.dev/sigma';

// ==========================================
// PHẦN 1: CẤU HÌNH & DỮ LIỆU
// ==========================================

const CONTAINER_ID = 'container';
const STORAGE_KEY = 'social_graph_v1_data';
const AUTOSAVE_BADGE = document.getElementById('autosave-status');

// Helper: Màu sắc & Kích thước
const getLayerColor = (layer) => {
    const colors = ['#222', '#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#3949AB', '#1E88E5'];
    return colors[layer] || '#999';
};
const getLayerSize = (layer) => layer === 0 ? 25 : Math.max(5, 20 - (layer * 2.2));

// Khởi tạo đồ thị
let graph = new Graph();
let renderer = null;

let state = {
    selectedNode: null,
    parentNode: null,
    mode: 'NORMAL',
    draggedNode: null,
    isDragging: false,
    dragStartTime: 0,          // ✨ NEW: Thời điểm bắt đầu drag
    dragStartPos: null,        // ✨ NEW: Vị trí bắt đầu drag
    hasMoved: false,           // ✨ NEW: Đã di chuyển chưa
    selectedForExport: new Set(),
    lastSaved: null
};

// ==========================================
// ✨ NEW: TOAST NOTIFICATION SYSTEM
// ==========================================

function showToast(message, type = 'info', duration = 3000) {
    // Remove existing toasts
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

    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto remove
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
    graph.addNode('center', { label: "TÔI", layer: 0, x: 0, y: 0, size: 25, color: getLayerColor(0) });
    state.selectedForExport = new Set();
    saveData();
}

// Xuất/Nhập file JSON
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
            arrangeNodes();
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
// PHẦN 3: LOGIC VẼ VÀ SẮP XẾP
// ==========================================

function arrangeNodes() {
    const nodesByLayer = {};
    graph.forEachNode((node, attr) => {
        const layer = attr.layer;
        if (nodesByLayer[layer] === undefined) nodesByLayer[layer] = [];
        nodesByLayer[layer].push(node);
    });

    const baseRadius = 15;
    Object.keys(nodesByLayer).forEach(layerStr => {
        const layer = parseInt(layerStr);
        if (layer === 0) return;
        const nodes = nodesByLayer[layer];
        const count = nodes.length;
        const radius = (layer * baseRadius) + (count * 1.5);
        const angleStep = (2 * Math.PI) / count;

        nodes.forEach((nodeId, index) => {
            const attr = graph.getNodeAttributes(nodeId);
            if (attr.x === 0 && attr.y === 0) {
                const angle = index * angleStep;
                graph.setNodeAttribute(nodeId, 'x', radius * Math.cos(angle));
                graph.setNodeAttribute(nodeId, 'y', radius * Math.sin(angle));
            }
        });
    });
}

// Khởi chạy
if (!loadData()) initDefaultData();
arrangeNodes();
updateSelectionUI();
updateAutosaveBadge();

const container = document.getElementById(CONTAINER_ID);
renderer = new Sigma(graph, container);

// ==========================================
// PHẦN 4: UI & STATE
// ==========================================

const ui = {
    modal: document.getElementById('modal'),
    overlay: document.getElementById('overlay'),
    inpLabel: document.getElementById('inp-label'),
    inpLayer: document.getElementById('inp-layer'),
    title: document.getElementById('modal-title'),
    editActions: document.getElementById('edit-actions'),
    btnSave: document.getElementById('btn-save'),
    toggleSelection: document.getElementById('toggle-selection')
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

    if (selectionText) selectionText.innerText = count ? `${count} người đã chọn để xuất` : 'Chưa chọn người để xuất';
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

function openModal(nodeId, mode = 'EDIT') {
    state.mode = mode;
    ui.overlay.style.display = 'block';
    ui.modal.style.display = 'block';

    if (mode === 'ADD') {
        ui.title.innerText = state.parentNode
            ? `Thêm quan hệ từ: ${graph.getNodeAttribute(state.parentNode, 'label')}`
            : "Thêm người mới (Không liên kết)";

        ui.inpLayer.value = "1";
        if (ui.toggleSelection) ui.toggleSelection.checked = true;
        ui.btnSave.innerHTML = '<i class="fas fa-plus"></i> Thêm Node';
        ui.editActions.style.display = 'none';
        setTimeout(() => ui.inpLabel.focus(), 100);
    } else {
        state.selectedNode = nodeId;
        const attr = graph.getNodeAttributes(nodeId);
        ui.title.innerText = attr.label;
        ui.inpLabel.value = attr.label;
        ui.inpLayer.value = attr.layer || 1;
        if (ui.toggleSelection) ui.toggleSelection.checked = state.selectedForExport.has(nodeId);
        ui.btnSave.innerHTML = '<i class="fas fa-save"></i> Lưu thay đổi';

        const isCenter = (nodeId === 'center');
        document.getElementById('btn-delete').style.display = isCenter ? 'none' : 'block';
        ui.inpLayer.disabled = isCenter;
        ui.editActions.style.display = 'block';
    }
}

// ==========================================
// ✨ OPTIMIZED: DRAG & DROP LOGIC
// ==========================================

const camera = renderer.getCamera();
const captor = renderer.getMouseCaptor();

// Khi bắt đầu nhấn chuột vào node
renderer.on('downNode', (e) => {
    state.isDragging = true;
    state.draggedNode = e.node;
    state.dragStartTime = Date.now();
    state.hasMoved = false;

    // Lưu vị trí bắt đầu
    const attr = graph.getNodeAttributes(e.node);
    state.dragStartPos = { x: attr.x, y: attr.y };

    camera.disable();

    // ✨ Visual feedback: Highlight node đang drag
    graph.setNodeAttribute(e.node, 'highlighted', true);
    renderer.refresh();
});

// Khi di chuyển chuột (Logic kéo node)
captor.on('mousemovebody', (e) => {
    if (!state.isDragging || !state.draggedNode) return;

    const pos = renderer.viewportToGraph(e);

    // ✨ Check if actually moved (threshold 0.5 để tránh jitter)
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

// Khi thả chuột ra
captor.on('mouseup', () => {
    if (state.isDragging && state.draggedNode) {
        const nodeA = state.draggedNode;
        const posA = graph.getNodeAttributes(nodeA);

        // Remove highlight
        graph.removeNodeAttribute(nodeA, 'highlighted');

        // ✨ ONLY check collision if user actually dragged (moved > threshold)
        if (state.hasMoved) {
            const dragDuration = Date.now() - state.dragStartTime;

            // ✨ Chỉ check collision nếu kéo đủ lâu (> 100ms) và đã di chuyển
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
    camera.enable();
    renderer.refresh();
});

// ✨ NEW: Smart collision detection & linking
function checkAndLinkNodes(nodeA, posA) {
    let targetNode = null;
    let minDist = Infinity;

    // ✨ Threshold thông minh hơn: Tính theo size node
    const sizeA = posA.size || 10;

    graph.forEachNode((nodeB, attrB) => {
        if (nodeA !== nodeB) {
            const dx = posA.x - attrB.x;
            const dy = posA.y - attrB.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // ✨ Threshold = tổng size / 2 + 3 (chặt chẽ hơn)
            const sizeB = attrB.size || 10;
            const threshold = (sizeA + sizeB) / 2 + 3;

            // Chọn node gần nhất trong vùng threshold
            if (dist < threshold && dist < minDist) {
                targetNode = nodeB;
                minDist = dist;
            }
        }
    });

    // Nếu tìm thấy target node
    if (targetNode) {
        const labelA = graph.getNodeAttribute(nodeA, 'label');
        const labelB = graph.getNodeAttribute(targetNode, 'label');

        // ✨ Check if already connected
        if (graph.hasEdge(nodeA, targetNode) || graph.hasEdge(targetNode, nodeA)) {
            showToast(`"${labelA}" và "${labelB}" đã kết nối rồi!`, 'warning');
        } else {
            // ✨ Show confirmation dialog
            showLinkConfirmation(nodeA, targetNode, labelA, labelB, posA);
        }
    }
}

// ✨ NEW: Beautiful link confirmation dialog
function showLinkConfirmation(nodeA, nodeB, labelA, labelB, posA) {
    const dialog = document.createElement('div');
    dialog.className = 'link-confirmation';
    dialog.innerHTML = `
        <div class="link-confirmation-content">
            <div class="link-icon">
                <i class="fas fa-link"></i>
            </div>
            <h3>Kết nối quan hệ?</h3>
            <p>Bạn có muốn kết nối <strong>"${labelA}"</strong> với <strong>"${labelB}"</strong> không?</p>
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

    // Event listeners
    document.getElementById('link-confirm').addEventListener('click', () => {
        graph.addEdge(nodeA, nodeB);
        // ✨ Đẩy nhẹ node A ra xa để không trùng
        graph.setNodeAttribute(nodeA, 'x', posA.x + 12);
        graph.setNodeAttribute(nodeA, 'y', posA.y + 8);
        saveData();
        showToast(`Đã kết nối "${labelA}" với "${labelB}"!`, 'success');
        removeDialog();
    });

    document.getElementById('link-cancel').addEventListener('click', () => {
        removeDialog();
    });

    function removeDialog() {
        dialog.classList.remove('show');
        setTimeout(() => dialog.remove(), 300);
    }
}

// ==========================================
// ✨ OPTIMIZED: CLICK HANDLING
// ==========================================

// 1. CLICK VÀO NỀN TRỐNG
renderer.on('clickStage', () => {
    // ✨ Chỉ mở modal nếu KHÔNG phải drag
    if (!state.hasMoved && !state.isDragging) {
        state.parentNode = null;
        openModal(null, 'ADD');
    }
});

// 2. CLICK NODE ĐỂ SỬA
renderer.on('clickNode', (e) => {
    // ✨ Timeout lớn hơn và check hasMoved
    setTimeout(() => {
        if (!state.isDragging && !state.hasMoved) {
            openModal(e.node, 'EDIT');
        }
    }, 150); // Tăng từ 50ms -> 150ms
});

// ==========================================
// PHẦN 6: XỬ LÝ NÚT BẤM (MODAL ACTIONS)
// ==========================================

ui.btnSave.addEventListener('click', () => {
    const label = ui.inpLabel.value.trim();
    const layer = parseInt(ui.inpLayer.value);
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
            label: label, layer: layer,
            size: getLayerSize(layer), color: getLayerColor(layer),
            x: initX, y: initY
        });

        if (state.parentNode) {
            graph.addEdge(state.parentNode, newId);
        }

        if (shouldSelect) state.selectedForExport.add(newId);
        showToast(`Đã thêm "${label}" thành công!`, 'success');
    } else {
        if (state.selectedNode) {
            graph.setNodeAttribute(state.selectedNode, 'label', label);
            if (state.selectedNode !== 'center') {
                graph.setNodeAttribute(state.selectedNode, 'layer', layer);
                graph.setNodeAttribute(state.selectedNode, 'size', getLayerSize(layer));
                graph.setNodeAttribute(state.selectedNode, 'color', getLayerColor(layer));
            }
            if (shouldSelect) {
                state.selectedForExport.add(state.selectedNode);
            } else {
                state.selectedForExport.delete(state.selectedNode);
            }
            showToast('Đã cập nhật thành công!', 'success');
        }
    }

    updateSelectionUI();
    saveData();
    closeModal();
});

document.getElementById('btn-add-child').addEventListener('click', () => {
    state.parentNode = state.selectedNode;
    openModal(null, 'ADD');
});

document.getElementById('btn-start-link').addEventListener('click', () => {
    showToast('Mẹo: Kéo thả Node này đè lên Node khác để nối nhanh!', 'info', 4000);
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
            <p>Bạn có chắc muốn xóa người này không?</p>
            <div class="link-actions">
                <button class="btn-cancel" id="delete-cancel">
                    <i class="fas fa-times"></i> Hủy
                </button>
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
        updateSelectionUI();
        saveData();
        closeModal();
        showToast('Đã xóa thành công!', 'success');
        removeDialog();
    });

    document.getElementById('delete-cancel').addEventListener('click', removeDialog);

    function removeDialog() {
        confirmDialog.classList.remove('show');
        setTimeout(() => confirmDialog.remove(), 300);
    }
});

// UI Events khác
document.getElementById('btn-x-close').addEventListener('click', closeModal);
ui.overlay.addEventListener('click', closeModal);
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
            <h3>Reset toàn bộ dữ liệu?</h3>
            <p>Tất cả dữ liệu sẽ bị xóa và không thể khôi phục!</p>
            <div class="link-actions">
                <button class="btn-cancel" id="reset-cancel">
                    <i class="fas fa-times"></i> Hủy
                </button>
                <button class="btn-confirm danger" id="reset-confirm">
                    <i class="fas fa-trash"></i> Reset
                </button>
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

// ✨ Welcome message
setTimeout(() => {
    showToast('Kéo thả nodes để kết nối, click nền để thêm mới!', 'info', 4000);
}, 500);
