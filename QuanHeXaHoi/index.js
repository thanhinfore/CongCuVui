import Graph from 'https://cdn.skypack.dev/graphology';
import Sigma from 'https://cdn.skypack.dev/sigma';

// ==========================================
// PHẦN 1: CẤU HÌNH & DỮ LIỆU
// ==========================================

const CONTAINER_ID = 'container';
const STORAGE_KEY = 'social_graph_v1_data';

// Helper: Màu sắc & Kích thước
const getLayerColor = (layer) => {
    const colors = ['#222', '#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#3949AB', '#1E88E5'];
    return colors[layer] || '#999';
};
const getLayerSize = (layer) => layer === 0 ? 25 : Math.max(5, 20 - (layer * 2.2));

// Khởi tạo đồ thị
let graph = new Graph();
let renderer = null;

// ==========================================
// PHẦN 2: QUẢN LÝ LƯU TRỮ
// ==========================================

function saveData() {
    const data = graph.export();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            const data = JSON.parse(raw);
            graph.import(data);
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
            saveData();
            alert("Đã nhập dữ liệu thành công!");
        } catch (err) {
            alert("File lỗi!");
        }
    };
    reader.readAsText(file);
}

// ==========================================
// PHẦN 3: LOGIC VẼ VÀ SẮP XẾP
// ==========================================

function arrangeNodes() {
    // Chỉ sắp xếp lại nếu người dùng muốn (tạm thời gọi hàm này thủ công)
    // Hoặc khi mới load. Logic Drag&Drop sẽ thay đổi vị trí node nên ta hạn chế gọi lại cái này liên tục.
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
            // Chỉ xếp lại nếu node chưa có tọa độ hoặc đang ở 0,0
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

const container = document.getElementById(CONTAINER_ID);
renderer = new Sigma(graph, container);

// ==========================================
// PHẦN 4: UI & STATE
// ==========================================

let state = {
    selectedNode: null,
    parentNode: null,   // Node cha khi tạo mới (nếu có)
    mode: 'NORMAL',
    draggedNode: null,  // Node đang được kéo
    isDragging: false   // Cờ kiểm tra đang kéo
};

const ui = {
    modal: document.getElementById('modal'),
    overlay: document.getElementById('overlay'),
    inpLabel: document.getElementById('inp-label'),
    inpLayer: document.getElementById('inp-layer'),
    title: document.getElementById('modal-title'),
    editActions: document.getElementById('edit-actions'),
    btnSave: document.getElementById('btn-save')
};

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
        ui.btnSave.innerHTML = '<i class="fas fa-plus"></i> Thêm Node';
        ui.editActions.style.display = 'none';
        setTimeout(() => ui.inpLabel.focus(), 100);
    } else {
        state.selectedNode = nodeId;
        const attr = graph.getNodeAttributes(nodeId);
        ui.title.innerText = attr.label;
        ui.inpLabel.value = attr.label;
        ui.inpLayer.value = attr.layer || 1;
        ui.btnSave.innerHTML = '<i class="fas fa-save"></i> Lưu thay đổi';

        const isCenter = (nodeId === 'center');
        document.getElementById('btn-delete').style.display = isCenter ? 'none' : 'block';
        ui.inpLayer.disabled = isCenter;
        ui.editActions.style.display = 'block';
    }
}

// ==========================================
// PHẦN 5: TƯƠNG TÁC NÂNG CAO (CLICK NỀN & KÉO THẢ)
// ==========================================

// 1. CLICK VÀO NỀN TRỐNG -> TẠO NODE MỚI
renderer.on('clickStage', () => {
    // Chỉ mở khi không đang kéo node
    if (!state.isDragging) {
        state.parentNode = null; // Không có cha
        openModal(null, 'ADD');
    }
});

// 2. KÉO THẢ NODE (DRAG & DROP) & TỰ ĐỘNG NỐI
const camera = renderer.getCamera();
const captor = renderer.getMouseCaptor();

// Khi bắt đầu nhấn chuột vào node
renderer.on('downNode', (e) => {
    state.isDragging = true;
    state.draggedNode = e.node;
    camera.disable(); // Tắt di chuyển bản đồ để kéo node
});

// Khi di chuyển chuột (Logic kéo node)
captor.on('mousemovebody', (e) => {
    if (!state.isDragging || !state.draggedNode) return;

    // Lấy tọa độ chuột trong không gian đồ thị
    const pos = renderer.viewportToGraph(e);

    graph.setNodeAttribute(state.draggedNode, 'x', pos.x);
    graph.setNodeAttribute(state.draggedNode, 'y', pos.y);

    // Ngăn chặn sự kiện clickStage kích hoạt nhầm
    e.preventSigmaDefault();
    e.original.preventDefault();
    e.original.stopPropagation();
});

// Khi thả chuột ra (Kết thúc kéo -> Kiểm tra va chạm để nối)
captor.on('mouseup', () => {
    if (state.isDragging && state.draggedNode) {
        const nodeA = state.draggedNode;
        const posA = graph.getNodeAttributes(nodeA);

        // KIỂM TRA VA CHẠM (COLLISION DETECT)
        // Duyệt qua tất cả các node khác để xem node A có đang đè lên ai không
        let targetNode = null;
        const threshold = 5; // Khoảng cách coi như là chạm (đơn vị graph)

        graph.forEachNode((nodeB, attrB) => {
            if (nodeA !== nodeB) {
                const dx = posA.x - attrB.x;
                const dy = posA.y - attrB.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Nếu khoảng cách đủ gần -> Coi như thả vào nodeB
                if (dist < (attrB.size / 3 + threshold)) {
                    targetNode = nodeB;
                }
            }
        });

        // Nếu thả vào một node khác -> Hỏi nối
        if (targetNode) {
            const labelA = graph.getNodeAttribute(nodeA, 'label');
            const labelB = graph.getNodeAttribute(targetNode, 'label');

            if (graph.hasEdge(nodeA, targetNode) || graph.hasEdge(targetNode, nodeA)) {
                alert(`"${labelA}" và "${labelB}" đã kết nối rồi!`);
            } else {
                if (confirm(`Bạn có muốn kết nối "${labelA}" với "${labelB}" không?`)) {
                    graph.addEdge(nodeA, targetNode);
                    saveData();
                    // Đẩy nhẹ node A ra xa một chút để không bị trùng lặp vị trí hoàn toàn
                    graph.setNodeAttribute(nodeA, 'x', posA.x + 10);
                }
            }
        }

        saveData(); // Lưu vị trí mới sau khi kéo
    }

    state.isDragging = false;
    state.draggedNode = null;
    camera.enable(); // Bật lại di chuyển bản đồ
});

// 3. CLICK NODE ĐỂ SỬA (Vẫn giữ logic cũ)
renderer.on('clickNode', (e) => {
    // Sử dụng timeout nhỏ để tránh conflict với sự kiện drag
    setTimeout(() => {
        if (!state.isDragging) {
            openModal(e.node, 'EDIT');
        }
    }, 50);
});


// ==========================================
// PHẦN 6: XỬ LÝ NÚT BẤM (MODAL ACTIONS)
// ==========================================

ui.btnSave.addEventListener('click', () => {
    const label = ui.inpLabel.value.trim();
    const layer = parseInt(ui.inpLayer.value);

    if (!label) return alert("Vui lòng nhập tên!");

    if (state.mode === 'ADD') {
        const newId = 'n_' + Date.now();
        // Nếu không có cha (click nền), node sẽ nằm ở vị trí ngẫu nhiên gần tâm
        // Nếu có cha, node sẽ nằm trùng vị trí cha (sau đó user kéo ra)
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

        // Chỉ tạo cạnh nếu có parentNode
        if (state.parentNode) {
            graph.addEdge(state.parentNode, newId);
        }
    } else {
        if (state.selectedNode) {
            graph.setNodeAttribute(state.selectedNode, 'label', label);
            if (state.selectedNode !== 'center') {
                graph.setNodeAttribute(state.selectedNode, 'layer', layer);
                graph.setNodeAttribute(state.selectedNode, 'size', getLayerSize(layer));
                graph.setNodeAttribute(state.selectedNode, 'color', getLayerColor(layer));
            }
        }
    }

    saveData();
    closeModal();
});

document.getElementById('btn-add-child').addEventListener('click', () => {
    state.parentNode = state.selectedNode;
    openModal(null, 'ADD');
});

// Nút nối thủ công (Vẫn giữ để ai không thích kéo thả thì dùng)
document.getElementById('btn-start-link').addEventListener('click', () => {
    alert("Mẹo: Bạn có thể kéo thả Node này đè lên Node khác để nối nhanh!");
    closeModal();
});

document.getElementById('btn-delete').addEventListener('click', () => {
    if (confirm("Xóa người này?")) {
        graph.dropNode(state.selectedNode);
        saveData();
        closeModal();
    }
});

// UI Events khác
document.getElementById('btn-x-close').addEventListener('click', closeModal);
ui.overlay.addEventListener('click', closeModal);
document.getElementById('btn-export').addEventListener('click', downloadJSON);
document.getElementById('btn-import-trigger').addEventListener('click', () => document.getElementById('file-input').click());
document.getElementById('file-input').addEventListener('change', uploadJSON);
document.getElementById('btn-reset-data').addEventListener('click', () => {
    if (confirm("Xóa sạch dữ liệu?")) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
});