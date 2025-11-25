import Graph from 'https://cdn.skypack.dev/graphology';
import Sigma from 'https://cdn.skypack.dev/sigma';
// Note: ForceAtlas2 replaced with custom Radial Layout in v3.2
// v4.0: Added IndexedDB, VCF Parser, Encryption, Merge Engine

// ==========================================
// PHẦN 1: CẤU HÌNH & CONSTANTS
// ==========================================

const CONTAINER_ID = 'container';
const STORAGE_KEY = 'social_graph_v3_data'; // Keep v3 for backwards compatibility
const INDEXEDDB_NAME = 'SocialGraphDB';
const INDEXEDDB_VERSION = 1;
const AUTOSAVE_BADGE = document.getElementById('autosave-status');
const STORAGE_STATUS = document.getElementById('storage-status');

// Node size configuration
const NODE_SIZES = {
    CENTER: 30,
    MIN: 10,
    BASE: 24,
    REDUCTION_FACTOR: 2
};

// Radial layout configuration
const RADIAL_LAYOUT_CONFIG = {
    RING_SPACING: 80,         // Distance between rings
    MIN_RADIUS: 60,           // Minimum radius for first ring
    ANIMATION_DURATION: 50,   // Animation frame duration (ms)
    ANIMATION_STEPS: 30       // Number of animation steps
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
    lastClickTime: 0,
    // v4.0 additions
    useIndexedDB: false,
    db: null,
    vcfContacts: [],
    vcfSelected: new Set(),
    pendingImportData: null,
    mergeConflicts: [],
    encryptedFileData: null,
    // Performance optimization state
    saveDataTimeout: null,
    vcfRenderLimit: 50,      // Initial render limit for VCF
    vcfScrollListener: null,
    vcfFilteredIndices: [],   // Filtered contact indices for lazy loading
    // Search filter state (v4.2)
    searchFilteredNodes: null,  // Set of nodeIds to show when filtering, null = show all
    searchFilterActive: false   // Whether search filter mode is active
};

// ==========================================
// PHẦN 2A: PERFORMANCE UTILITIES
// ==========================================

// Debounce function - delays execution until after wait ms have passed
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function - limits execution to once per wait ms
function throttle(func, wait) {
    let lastTime = 0;
    return function executedFunction(...args) {
        const now = Date.now();
        if (now - lastTime >= wait) {
            lastTime = now;
            func(...args);
        }
    };
}

// Process items in batches using requestAnimationFrame to prevent UI freeze
async function processBatch(items, processFunc, batchSize = 50, onProgress = null) {
    const total = items.length;
    let processed = 0;

    return new Promise((resolve) => {
        function processBatchChunk() {
            const start = processed;
            const end = Math.min(processed + batchSize, total);

            for (let i = start; i < end; i++) {
                processFunc(items[i], i);
            }

            processed = end;

            if (onProgress) {
                onProgress(processed, total);
            }

            if (processed < total) {
                requestAnimationFrame(processBatchChunk);
            } else {
                resolve();
            }
        }

        requestAnimationFrame(processBatchChunk);
    });
}

// ==========================================
// PHẦN 2B: INDEXEDDB STORAGE (v4.0)
// ==========================================

async function initIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(INDEXEDDB_NAME, INDEXEDDB_VERSION);

        request.onerror = () => {
            console.warn('IndexedDB not available, using localStorage');
            state.useIndexedDB = false;
            updateStorageStatus('localStorage');
            resolve(false);
        };

        request.onsuccess = (event) => {
            state.db = event.target.result;
            state.useIndexedDB = true;
            updateStorageStatus('IndexedDB');
            resolve(true);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Create object stores
            if (!db.objectStoreNames.contains('graph')) {
                db.createObjectStore('graph', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('layers')) {
                db.createObjectStore('layers', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('metadata')) {
                db.createObjectStore('metadata', { keyPath: 'key' });
            }
        };
    });
}

function updateStorageStatus(type) {
    if (STORAGE_STATUS) {
        STORAGE_STATUS.textContent = type;
        STORAGE_STATUS.title = type === 'IndexedDB'
            ? 'Sử dụng IndexedDB - hỗ trợ 10k+ contacts'
            : 'Sử dụng localStorage - giới hạn ~5MB';
    }
}

async function saveToIndexedDB() {
    if (!state.db) return false;

    return new Promise((resolve, reject) => {
        const transaction = state.db.transaction(['graph', 'layers', 'metadata'], 'readwrite');

        // Save graph data
        const graphStore = transaction.objectStore('graph');
        graphStore.clear();
        const graphData = graph.export();
        graphStore.put({ id: 'main', data: graphData });

        // Save layers
        const layersStore = transaction.objectStore('layers');
        layersStore.clear();
        state.layers.forEach((layer, index) => {
            layersStore.put({ ...layer, id: layer.id || `layer_${index}` });
        });

        // Save metadata
        const metaStore = transaction.objectStore('metadata');
        metaStore.put({ key: 'version', value: '4.0' });
        metaStore.put({ key: 'savedAt', value: new Date().toISOString() });

        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => reject(transaction.error);
    });
}

async function loadFromIndexedDB() {
    if (!state.db) return false;

    return new Promise((resolve, reject) => {
        const transaction = state.db.transaction(['graph', 'layers'], 'readonly');

        const graphStore = transaction.objectStore('graph');
        const graphRequest = graphStore.get('main');

        const layersStore = transaction.objectStore('layers');
        const layersRequest = layersStore.getAll();

        transaction.oncomplete = () => {
            if (graphRequest.result?.data) {
                graph.import(graphRequest.result.data);

                if (layersRequest.result?.length > 0) {
                    state.layers = layersRequest.result;
                }

                ensureNodeAttributes();
                resolve(true);
            } else {
                resolve(false);
            }
        };

        transaction.onerror = () => reject(transaction.error);
    });
}

// ==========================================
// PHẦN 2C: VCF PARSER (v4.0)
// ==========================================

function parseVCF(vcfText) {
    const contacts = [];
    const vcards = vcfText.split(/(?=BEGIN:VCARD)/i).filter(v => v.trim());

    vcards.forEach(vcard => {
        const contact = parseVCard(vcard);
        if (contact && contact.name) {
            contacts.push(contact);
        }
    });

    return contacts;
}

function parseVCard(vcardText) {
    const lines = vcardText.split(/\r?\n/);
    const contact = {
        name: '',
        phones: [],
        emails: [],
        addresses: [],
        company: '',
        position: '',
        birthday: '',
        notes: '',
        groups: []
    };

    let currentField = null;
    let currentValue = '';

    lines.forEach(line => {
        // Handle line folding (lines starting with space/tab are continuations)
        if (line.startsWith(' ') || line.startsWith('\t')) {
            currentValue += line.substring(1);
            return;
        }

        // Process previous field if exists
        if (currentField) {
            processVCardField(contact, currentField, currentValue);
        }

        // Parse new field
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            currentField = line.substring(0, colonIndex);
            currentValue = line.substring(colonIndex + 1);
        }
    });

    // Process last field
    if (currentField) {
        processVCardField(contact, currentField, currentValue);
    }

    return contact;
}

function processVCardField(contact, field, value) {
    // Decode quoted-printable if needed
    if (field.includes('ENCODING=QUOTED-PRINTABLE')) {
        value = decodeQuotedPrintable(value);
    }

    // Remove parameters to get base field name
    const baseField = field.split(';')[0].toUpperCase();
    const params = field.toUpperCase();

    switch (baseField) {
        case 'FN': // Formatted Name
            contact.name = decodeVCardValue(value);
            break;

        case 'N': // Structured Name (fallback)
            if (!contact.name) {
                const parts = value.split(';').map(p => decodeVCardValue(p));
                // N: Last;First;Middle;Prefix;Suffix
                const [last, first, middle] = parts;
                contact.name = [first, middle, last].filter(Boolean).join(' ').trim();
            }
            break;

        case 'TEL': // Phone
            const phoneValue = value.replace(/[^\d+\-\s]/g, '').trim();
            if (phoneValue) {
                let phoneType = 'OTHER';
                if (params.includes('CELL') || params.includes('MOBILE')) phoneType = 'MOBILE';
                else if (params.includes('HOME')) phoneType = 'HOME';
                else if (params.includes('WORK')) phoneType = 'WORK';

                contact.phones.push({ type: phoneType, number: phoneValue });
            }
            break;

        case 'EMAIL':
            const emailValue = decodeVCardValue(value);
            if (emailValue && emailValue.includes('@')) {
                let emailType = 'OTHER';
                if (params.includes('HOME')) emailType = 'HOME';
                else if (params.includes('WORK')) emailType = 'WORK';

                contact.emails.push({ type: emailType, email: emailValue });
            }
            break;

        case 'ADR': // Address
            const addrParts = value.split(';').map(p => decodeVCardValue(p));
            // ADR: PO Box;Ext;Street;City;State;ZIP;Country
            const addrStr = addrParts.filter(Boolean).join(', ').trim();
            if (addrStr) {
                contact.addresses.push(addrStr);
            }
            break;

        case 'ORG': // Organization
            contact.company = decodeVCardValue(value.split(';')[0]);
            break;

        case 'TITLE': // Job Title
            contact.position = decodeVCardValue(value);
            break;

        case 'BDAY': // Birthday
            contact.birthday = formatBirthday(value);
            break;

        case 'NOTE':
            contact.notes = decodeVCardValue(value);
            break;

        case 'CATEGORIES':
        case 'X-ABGROUPS':
            contact.groups = value.split(',').map(g => decodeVCardValue(g).trim());
            break;
    }
}

function decodeVCardValue(value) {
    if (!value) return '';
    // Decode escaped characters
    return value
        .replace(/\\n/gi, '\n')
        .replace(/\\,/g, ',')
        .replace(/\\;/g, ';')
        .replace(/\\\\/g, '\\')
        .trim();
}

function decodeQuotedPrintable(str) {
    return str.replace(/=([0-9A-F]{2})/gi, (match, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
    });
}

function formatBirthday(value) {
    // Handle various date formats: YYYYMMDD, YYYY-MM-DD, --MMDD
    if (!value) return '';

    value = value.replace(/[^\d-]/g, '');

    if (value.startsWith('--')) {
        // Only month-day
        const month = value.substring(2, 4);
        const day = value.substring(4, 6);
        return `--${month}-${day}`;
    }

    if (value.length === 8) {
        // YYYYMMDD
        return `${value.substring(0,4)}-${value.substring(4,6)}-${value.substring(6,8)}`;
    }

    return value;
}

// ==========================================
// PHẦN 2D: ENCRYPTION MODULE (v4.0)
// ==========================================

async function deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

async function encryptData(data, password) {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await deriveKey(password, salt);
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encoder.encode(JSON.stringify(data))
    );

    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    return combined;
}

async function decryptData(encryptedData, password) {
    const salt = encryptedData.slice(0, 16);
    const iv = encryptedData.slice(16, 28);
    const data = encryptedData.slice(28);

    const key = await deriveKey(password, salt);

    try {
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            data
        );

        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decrypted));
    } catch (e) {
        throw new Error('Mật khẩu không đúng hoặc file bị hỏng');
    }
}

function checkPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 1) return 'weak';
    if (score <= 2) return 'fair';
    if (score <= 3) return 'good';
    return 'strong';
}

// ==========================================
// PHẦN 2E: PRIVACY MASKING (v4.0)
// ==========================================

function maskPhone(phone) {
    if (!phone || phone.length < 6) return phone;
    const len = phone.length;
    return phone.substring(0, 3) + '****' + phone.substring(len - 3);
}

function maskEmail(email) {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    const maskedLocal = local.substring(0, 3) + '***';
    return maskedLocal + '@' + domain;
}

function applyPrivacyMasking(data, options) {
    const masked = JSON.parse(JSON.stringify(data));

    if (masked.graph?.nodes) {
        masked.graph.nodes.forEach(node => {
            if (node.attributes?.contact) {
                const contact = node.attributes.contact;

                if (options.maskPhone && contact.phone) {
                    contact.phone = maskPhone(contact.phone);
                }
                if (options.maskEmail && contact.email) {
                    contact.email = maskEmail(contact.email);
                }
                if (options.maskAddress && contact.address) {
                    contact.address = '[Đã ẩn]';
                }
                if (options.maskNotes) {
                    contact.notes = '';
                }
            }
        });
    }

    return masked;
}

// ==========================================
// PHẦN 2F: MERGE ENGINE (v4.0)
// ==========================================

function findDuplicates(newNodes, existingNodes) {
    const duplicates = [];
    const newItems = [];

    newNodes.forEach(newNode => {
        const existing = existingNodes.find(ex => {
            // Match by name (normalized)
            const nameMatch = normalizeString(ex.attributes?.label) ===
                             normalizeString(newNode.attributes?.label);

            // Match by phone
            const phoneMatch = ex.attributes?.contact?.phone &&
                              newNode.attributes?.contact?.phone &&
                              normalizePhone(ex.attributes.contact.phone) ===
                              normalizePhone(newNode.attributes.contact.phone);

            // Match by email
            const emailMatch = ex.attributes?.contact?.email &&
                              newNode.attributes?.contact?.email &&
                              ex.attributes.contact.email.toLowerCase() ===
                              newNode.attributes.contact.email.toLowerCase();

            return nameMatch || phoneMatch || emailMatch;
        });

        if (existing) {
            duplicates.push({ existing, new: newNode });
        } else {
            newItems.push(newNode);
        }
    });

    return { duplicates, newItems };
}

function normalizeString(str) {
    if (!str) return '';
    return str.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .trim();
}

function normalizePhone(phone) {
    if (!phone) return '';
    return phone.replace(/[^\d]/g, '');
}

function mergeContacts(existing, newContact, strategy) {
    if (strategy === 'skip') {
        return existing;
    }

    if (strategy === 'overwrite') {
        return { ...newContact, key: existing.key };
    }

    // merge-fields: Keep existing values, fill empty with new
    const merged = { ...existing };

    if (merged.attributes?.contact && newContact.attributes?.contact) {
        const existingContact = merged.attributes.contact;
        const newContactInfo = newContact.attributes.contact;

        Object.keys(newContactInfo).forEach(key => {
            if (!existingContact[key] && newContactInfo[key]) {
                existingContact[key] = newContactInfo[key];
            }
        });
    }

    return merged;
}

// ==========================================
// PHẦN 2G: CLASSIFICATION MODULE (v4.1)
// ==========================================

let classificationState = {
    isActive: false,
    selectedNodes: new Set(),
    draggedNodeId: null
};

function enterClassificationMode() {
    classificationState.isActive = true;
    classificationState.selectedNodes.clear();

    // Show layer drop zones
    renderLayerDropZones();
    document.getElementById('layer-drop-zones').classList.remove('hidden');
    document.getElementById('classify-indicator').classList.remove('hidden');
    document.body.classList.add('classifying');

    // Show quick classify panel
    openQuickClassifyPanel();

    showToast('Chế độ phân loại: Kéo node vào vùng Layer để phân loại!', 'info', 3000);
}

function exitClassificationMode() {
    classificationState.isActive = false;
    classificationState.selectedNodes.clear();
    classificationState.draggedNodeId = null;

    // Hide elements
    document.getElementById('layer-drop-zones').classList.add('hidden');
    document.getElementById('classify-indicator').classList.add('hidden');
    document.body.classList.remove('classifying');
}

function renderLayerDropZones() {
    const container = document.getElementById('layer-drop-zones');
    const layerCounts = getLayerCounts();

    container.innerHTML = state.layers.map(layer => `
        <div class="layer-drop-zone" data-layer="${layer.id}" style="color: ${layer.color}; border-color: ${layer.color};">
            <i class="fas fa-folder"></i>
            <span>${layer.name}</span>
            <span class="drop-count">${layerCounts[layer.id] || 0} người</span>
        </div>
    `).join('');

    // Add event listeners for drop zones
    container.querySelectorAll('.layer-drop-zone').forEach(zone => {
        zone.addEventListener('dragover', handleZoneDragOver);
        zone.addEventListener('dragleave', handleZoneDragLeave);
        zone.addEventListener('drop', handleZoneDrop);
    });
}

function getLayerCounts() {
    const counts = {};
    graph.forEachNode((nodeId, attrs) => {
        if (nodeId !== 'center' && attrs.layer) {
            counts[attrs.layer] = (counts[attrs.layer] || 0) + 1;
        }
    });
    return counts;
}

function handleZoneDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleZoneDragLeave(e) {
    e.currentTarget.classList.remove('dragover');
}

function handleZoneDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');

    const targetLayer = e.currentTarget.dataset.layer;
    const nodeId = classificationState.draggedNodeId;

    if (nodeId && targetLayer) {
        assignNodeToLayer(nodeId, targetLayer);
        classificationState.draggedNodeId = null;
        renderLayerDropZones(); // Update counts
        updateQuickClassifyList();
    }
}

function assignNodeToLayer(nodeId, layerId) {
    if (!graph.hasNode(nodeId) || nodeId === 'center') return;

    const layer = state.layers.find(l => l.id === layerId);
    if (!layer) return;

    graph.setNodeAttribute(nodeId, 'layer', layerId);
    graph.setNodeAttribute(nodeId, 'color', layer.color);

    saveData();
    showToast(`Đã gán "${graph.getNodeAttribute(nodeId, 'label')}" vào ${layer.name}`, 'success', 2000);
}

function assignMultipleNodesToLayer(nodeIds, layerId) {
    const layer = state.layers.find(l => l.id === layerId);
    if (!layer) return;

    let count = 0;
    nodeIds.forEach(nodeId => {
        if (graph.hasNode(nodeId) && nodeId !== 'center') {
            graph.setNodeAttribute(nodeId, 'layer', layerId);
            graph.setNodeAttribute(nodeId, 'color', layer.color);
            count++;
        }
    });

    saveData();
    renderLayerDropZones();
    updateQuickClassifyList();
    renderLayerFilters();

    showToast(`Đã gán ${count} người vào ${layer.name}`, 'success');
}

// Quick Classify Panel Functions
function openQuickClassifyPanel() {
    document.getElementById('quick-classify-panel').classList.remove('hidden');

    // Populate layer select
    const select = document.getElementById('bulk-layer-select');
    select.innerHTML = state.layers.map(l =>
        `<option value="${l.id}" style="color: ${l.color}">${l.name}</option>`
    ).join('');

    updateQuickClassifyList();
}

function closeQuickClassifyPanel() {
    document.getElementById('quick-classify-panel').classList.add('hidden');
    exitClassificationMode();
}

function getUnconnectedNodes() {
    const unconnected = [];
    graph.forEachNode((nodeId, attrs) => {
        if (nodeId === 'center') return;

        // Check if connected to center
        const isConnected = graph.hasEdge(nodeId, 'center') || graph.hasEdge('center', nodeId);

        if (!isConnected) {
            unconnected.push({
                id: nodeId,
                label: attrs.label || '',
                layer: attrs.layer || '',
                layerName: state.layers.find(l => l.id === attrs.layer)?.name || 'Chưa phân loại'
            });
        }
    });

    return unconnected.sort((a, b) => a.label.localeCompare(b.label, 'vi'));
}

function updateQuickClassifyList(filterText = '') {
    const list = document.getElementById('classify-list');
    const unconnected = getUnconnectedNodes();
    const filter = filterText.toLowerCase();

    // Update count
    document.getElementById('unclassified-count').textContent = unconnected.length;

    // Filter nodes
    const filtered = filter
        ? unconnected.filter(n => n.label.toLowerCase().includes(filter))
        : unconnected;

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="classify-empty">
                <i class="fas fa-check-circle"></i>
                <p>${filter ? 'Không tìm thấy' : 'Tất cả đã được kết nối!'}</p>
            </div>
        `;
        return;
    }

    // Show max 100 items for performance
    const displayItems = filtered.slice(0, 100);

    list.innerHTML = displayItems.map(node => `
        <div class="classify-item" data-node-id="${node.id}">
            <input type="checkbox" data-node-id="${node.id}">
            <div class="classify-item-avatar">${getInitials(node.label)}</div>
            <div class="classify-item-info">
                <div class="classify-item-name">${node.label}</div>
                <div class="classify-item-layer">${node.layerName}</div>
            </div>
            <div class="classify-item-assign">
                ${state.layers.slice(0, 3).map(l => `
                    <button style="background: ${l.color}; color: white;" title="${l.name}" data-layer="${l.id}" data-node="${node.id}">
                        ${l.name.charAt(0)}
                    </button>
                `).join('')}
            </div>
        </div>
    `).join('');

    if (filtered.length > 100) {
        list.innerHTML += `<div class="classify-item" style="justify-content: center; color: #999;">...và ${filtered.length - 100} người khác</div>`;
    }

    // Add click handlers
    list.querySelectorAll('.classify-item').forEach(item => {
        const nodeId = item.dataset.nodeId;
        if (!nodeId) return;

        // Checkbox click
        item.querySelector('input[type="checkbox"]')?.addEventListener('change', (e) => {
            if (e.target.checked) {
                classificationState.selectedNodes.add(nodeId);
                item.classList.add('selected');
            } else {
                classificationState.selectedNodes.delete(nodeId);
                item.classList.remove('selected');
            }
        });

        // Quick assign buttons
        item.querySelectorAll('.classify-item-assign button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const layerId = btn.dataset.layer;
                const targetNodeId = btn.dataset.node;
                assignNodeToLayer(targetNodeId, layerId);
                item.remove();
                updateUnconnectedCount();
            });
        });

        // Click item to focus on graph
        item.addEventListener('click', (e) => {
            if (e.target.type === 'checkbox' || e.target.tagName === 'BUTTON') return;
            focusOnNode(nodeId);
        });
    });
}

function updateUnconnectedCount() {
    const count = getUnconnectedNodes().length;
    document.getElementById('unclassified-count').textContent = count;
}

function focusOnNode(nodeId) {
    if (!graph.hasNode(nodeId)) return;

    const attrs = graph.getNodeAttributes(nodeId);
    const camera = renderer.getCamera();

    camera.animate(
        { x: attrs.x, y: attrs.y, ratio: 0.3 },
        { duration: 300 }
    );

    // Highlight node
    state.selectedNode = nodeId;
    graph.setNodeAttribute(nodeId, 'highlighted', true);
    renderer.refresh();

    setTimeout(() => {
        graph.setNodeAttribute(nodeId, 'highlighted', false);
        renderer.refresh();
    }, 2000);
}

function bulkAssignSelectedNodes() {
    const layerId = document.getElementById('bulk-layer-select').value;
    const selectedNodes = Array.from(classificationState.selectedNodes);

    if (selectedNodes.length === 0) {
        showToast('Chưa chọn người nào!', 'warning');
        return;
    }

    assignMultipleNodesToLayer(selectedNodes, layerId);
    classificationState.selectedNodes.clear();
}

// ==========================================
// PHẦN 2H: SMART CONNECT MODULE (v4.2)
// ==========================================

let smartConnectState = {
    isActive: false,
    hubNode: null,           // Node trung tâm để kết nối
    selectedNodes: new Set(), // Các node được chọn để kết nối
    groups: [],              // Các nhóm được phát hiện
    currentGroupType: 'company' // 'company' | 'email_domain' | 'phone_prefix'
};

// Mở panel Smart Connect
function openSmartConnectPanel() {
    const panel = document.getElementById('smart-connect-panel');
    if (panel) {
        panel.classList.remove('hidden');
        smartConnectState.isActive = true;
        smartConnectState.selectedNodes.clear();
        smartConnectState.hubNode = null;
        analyzeAndGroupContacts();
    }
}

// Đóng panel Smart Connect
function closeSmartConnectPanel() {
    const panel = document.getElementById('smart-connect-panel');
    if (panel) {
        panel.classList.add('hidden');
    }
    smartConnectState.isActive = false;
    smartConnectState.selectedNodes.clear();
    smartConnectState.hubNode = null;

    // Clear highlights
    graph.forEachNode((nodeId, attrs) => {
        graph.setNodeAttribute(nodeId, 'highlighted', false);
    });
    if (renderer) renderer.refresh();
}

// Phân tích và nhóm contacts theo tiêu chí
function analyzeAndGroupContacts() {
    const groups = {
        byCompany: new Map(),
        byEmailDomain: new Map(),
        byPhonePrefix: new Map()
    };

    graph.forEachNode((nodeId, attrs) => {
        if (nodeId === 'center') return;

        const contact = attrs.contact || {};
        const label = attrs.label || '';

        // Group by company
        if (contact.company && contact.company.trim()) {
            const company = contact.company.trim().toLowerCase();
            if (!groups.byCompany.has(company)) {
                groups.byCompany.set(company, []);
            }
            groups.byCompany.get(company).push({ nodeId, label, attrs });
        }

        // Group by email domain
        if (contact.email && contact.email.includes('@')) {
            const domain = contact.email.split('@')[1].toLowerCase();
            if (!groups.byEmailDomain.has(domain)) {
                groups.byEmailDomain.set(domain, []);
            }
            groups.byEmailDomain.get(domain).push({ nodeId, label, attrs });
        }

        // Group by phone prefix (first 4 digits)
        if (contact.phone) {
            const phoneClean = contact.phone.replace(/\D/g, '');
            if (phoneClean.length >= 4) {
                const prefix = phoneClean.substring(0, 4);
                if (!groups.byPhonePrefix.has(prefix)) {
                    groups.byPhonePrefix.set(prefix, []);
                }
                groups.byPhonePrefix.get(prefix).push({ nodeId, label, attrs });
            }
        }
    });

    // Filter groups with 2+ members and sort by size
    smartConnectState.groups = {
        byCompany: [...groups.byCompany.entries()]
            .filter(([_, nodes]) => nodes.length >= 2)
            .sort((a, b) => b[1].length - a[1].length),
        byEmailDomain: [...groups.byEmailDomain.entries()]
            .filter(([_, nodes]) => nodes.length >= 2)
            .sort((a, b) => b[1].length - a[1].length),
        byPhonePrefix: [...groups.byPhonePrefix.entries()]
            .filter(([_, nodes]) => nodes.length >= 2)
            .sort((a, b) => b[1].length - a[1].length)
    };

    renderSmartConnectGroups();
}

// Render danh sách nhóm
function renderSmartConnectGroups() {
    const groupList = document.getElementById('smart-connect-groups');
    const groupType = smartConnectState.currentGroupType;

    let groups;
    let groupLabel;
    let icon;

    switch (groupType) {
        case 'company':
            groups = smartConnectState.groups.byCompany;
            groupLabel = 'Công ty';
            icon = 'fa-building';
            break;
        case 'email_domain':
            groups = smartConnectState.groups.byEmailDomain;
            groupLabel = 'Domain Email';
            icon = 'fa-envelope';
            break;
        case 'phone_prefix':
            groups = smartConnectState.groups.byPhonePrefix;
            groupLabel = 'Đầu số ĐT';
            icon = 'fa-phone';
            break;
    }

    if (!groups || groups.length === 0) {
        groupList.innerHTML = `
            <div class="smart-connect-empty">
                <i class="fas fa-search"></i>
                <p>Không tìm thấy nhóm nào theo ${groupLabel}</p>
            </div>
        `;
        return;
    }

    groupList.innerHTML = groups.map(([key, nodes]) => {
        const connectedCount = countExistingConnections(nodes.map(n => n.nodeId));
        const totalPossible = (nodes.length * (nodes.length - 1)) / 2;
        const percentage = totalPossible > 0 ? Math.round((connectedCount / totalPossible) * 100) : 0;

        return `
            <div class="smart-group-item" data-group-key="${key}">
                <div class="smart-group-header">
                    <div class="smart-group-info">
                        <i class="fas ${icon}"></i>
                        <span class="smart-group-name">${escapeHtml(key)}</span>
                        <span class="smart-group-count">${nodes.length} người</span>
                    </div>
                    <div class="smart-group-status">
                        <span class="connection-status ${percentage === 100 ? 'complete' : ''}">${percentage}% kết nối</span>
                    </div>
                </div>
                <div class="smart-group-members">
                    ${nodes.slice(0, 5).map(n => `<span class="member-chip">${escapeHtml(n.label)}</span>`).join('')}
                    ${nodes.length > 5 ? `<span class="member-chip more">+${nodes.length - 5}</span>` : ''}
                </div>
                <div class="smart-group-actions">
                    <button class="btn-view-group" onclick="viewGroupOnGraph('${escapeHtml(key)}', '${groupType}')">
                        <i class="fas fa-eye"></i> Xem
                    </button>
                    <button class="btn-connect-group" onclick="connectAllInGroup('${escapeHtml(key)}', '${groupType}')"
                            ${percentage === 100 ? 'disabled' : ''}>
                        <i class="fas fa-link"></i> Kết nối tất cả
                    </button>
                    <button class="btn-select-hub" onclick="openHubSelector('${escapeHtml(key)}', '${groupType}')">
                        <i class="fas fa-star"></i> Chọn Hub
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Đếm số kết nối đã có trong nhóm
function countExistingConnections(nodeIds) {
    let count = 0;
    for (let i = 0; i < nodeIds.length; i++) {
        for (let j = i + 1; j < nodeIds.length; j++) {
            if (graph.hasEdge(nodeIds[i], nodeIds[j]) || graph.hasEdge(nodeIds[j], nodeIds[i])) {
                count++;
            }
        }
    }
    return count;
}

// Xem nhóm trên graph (filter + highlight)
function viewGroupOnGraph(groupKey, groupType) {
    let groups;
    switch (groupType) {
        case 'company': groups = smartConnectState.groups.byCompany; break;
        case 'email_domain': groups = smartConnectState.groups.byEmailDomain; break;
        case 'phone_prefix': groups = smartConnectState.groups.byPhonePrefix; break;
    }

    const group = groups.find(([key]) => key === groupKey);
    if (!group) return;

    const nodeIds = group[1].map(n => n.nodeId);

    // Apply search filter to show only this group
    applySearchFilter(nodeIds);

    // Close panel temporarily to see the graph
    document.getElementById('smart-connect-panel').classList.add('minimized');

    showToast(`Đang hiển thị ${nodeIds.length} người thuộc "${groupKey}"`, 'info');
}

// Kết nối tất cả trong nhóm với nhau
function connectAllInGroup(groupKey, groupType) {
    let groups;
    switch (groupType) {
        case 'company': groups = smartConnectState.groups.byCompany; break;
        case 'email_domain': groups = smartConnectState.groups.byEmailDomain; break;
        case 'phone_prefix': groups = smartConnectState.groups.byPhonePrefix; break;
    }

    const group = groups.find(([key]) => key === groupKey);
    if (!group) return;

    const nodes = group[1];
    const nodeIds = nodes.map(n => n.nodeId);

    // Determine relationship type based on group type
    let relationType = 'colleague';
    if (groupType === 'company') relationType = 'colleague';
    else if (groupType === 'email_domain') relationType = 'colleague';
    else relationType = 'other';

    let newConnections = 0;

    // Connect all pairs
    for (let i = 0; i < nodeIds.length; i++) {
        for (let j = i + 1; j < nodeIds.length; j++) {
            if (!graph.hasEdge(nodeIds[i], nodeIds[j]) && !graph.hasEdge(nodeIds[j], nodeIds[i])) {
                graph.addEdge(nodeIds[i], nodeIds[j], {
                    relationship: relationType,
                    color: EDGE_TYPES[relationType].color,
                    label: groupKey,
                    size: 2
                });
                newConnections++;
            }
        }
    }

    if (newConnections > 0) {
        applyColorsByDistance(false);
        saveData();
        renderSmartConnectGroups();
        showToast(`Đã tạo ${newConnections} kết nối mới cho nhóm "${groupKey}"`, 'success');
    } else {
        showToast('Tất cả đã được kết nối!', 'info');
    }

    if (renderer) renderer.refresh();
}

// Mở selector để chọn hub node
function openHubSelector(groupKey, groupType) {
    let groups;
    switch (groupType) {
        case 'company': groups = smartConnectState.groups.byCompany; break;
        case 'email_domain': groups = smartConnectState.groups.byEmailDomain; break;
        case 'phone_prefix': groups = smartConnectState.groups.byPhonePrefix; break;
    }

    const group = groups.find(([key]) => key === groupKey);
    if (!group) return;

    const nodes = group[1];

    // Create hub selector modal
    const modal = document.createElement('div');
    modal.className = 'hub-selector-modal';
    modal.innerHTML = `
        <div class="hub-selector-content">
            <h3><i class="fas fa-star"></i> Chọn Hub cho "${escapeHtml(groupKey)}"</h3>
            <p class="hub-description">Hub là người trung tâm, tất cả người khác sẽ kết nối với Hub.</p>
            <div class="hub-list">
                ${nodes.map(n => {
                    const layer = getLayerById(n.attrs.layer);
                    const connections = graph.degree(n.nodeId);
                    return `
                        <div class="hub-option" data-node-id="${n.nodeId}">
                            <div class="hub-avatar" style="background: ${layer.color}">${getInitials(n.label)}</div>
                            <div class="hub-info">
                                <div class="hub-name">${escapeHtml(n.label)}</div>
                                <div class="hub-connections">${connections} kết nối hiện có</div>
                            </div>
                            <button class="btn-select-as-hub">Chọn làm Hub</button>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="hub-actions">
                <button class="btn-cancel-hub">Hủy</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Event handlers
    modal.querySelectorAll('.btn-select-as-hub').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const hubNodeId = e.target.closest('.hub-option').dataset.nodeId;
            connectGroupToHub(groupKey, groupType, hubNodeId);
            modal.remove();
        });
    });

    modal.querySelector('.btn-cancel-hub').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Kết nối tất cả trong nhóm với Hub
function connectGroupToHub(groupKey, groupType, hubNodeId) {
    let groups;
    switch (groupType) {
        case 'company': groups = smartConnectState.groups.byCompany; break;
        case 'email_domain': groups = smartConnectState.groups.byEmailDomain; break;
        case 'phone_prefix': groups = smartConnectState.groups.byPhonePrefix; break;
    }

    const group = groups.find(([key]) => key === groupKey);
    if (!group) return;

    const nodeIds = group[1].map(n => n.nodeId).filter(id => id !== hubNodeId);

    let relationType = groupType === 'company' ? 'colleague' : 'other';
    let newConnections = 0;

    nodeIds.forEach(nodeId => {
        if (!graph.hasEdge(hubNodeId, nodeId) && !graph.hasEdge(nodeId, hubNodeId)) {
            graph.addEdge(hubNodeId, nodeId, {
                relationship: relationType,
                color: EDGE_TYPES[relationType].color,
                label: groupKey,
                size: 2
            });
            newConnections++;
        }
    });

    if (newConnections > 0) {
        applyColorsByDistance(false);
        saveData();
        renderSmartConnectGroups();

        const hubLabel = graph.getNodeAttribute(hubNodeId, 'label');
        showToast(`Đã kết nối ${newConnections} người với Hub "${hubLabel}"`, 'success');
    } else {
        showToast('Tất cả đã được kết nối với Hub!', 'info');
    }

    if (renderer) renderer.refresh();
}

// Thay đổi loại nhóm hiển thị
function changeGroupType(type) {
    smartConnectState.currentGroupType = type;

    // Update tab active state
    document.querySelectorAll('.smart-connect-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.type === type);
    });

    renderSmartConnectGroups();
}

// Batch Connect Mode - Chọn nhiều node và kết nối với TÔI hoặc node khác
function openBatchConnectMode() {
    smartConnectState.isActive = true;
    smartConnectState.selectedNodes.clear();

    const panel = document.getElementById('batch-connect-panel');
    if (panel) {
        panel.classList.remove('hidden');
        renderBatchConnectList();
    }

    showToast('Chọn các node cần kết nối, sau đó chọn đích kết nối', 'info');
}

function closeBatchConnectPanel() {
    const panel = document.getElementById('batch-connect-panel');
    if (panel) {
        panel.classList.add('hidden');
    }
    smartConnectState.selectedNodes.clear();

    // Clear highlights
    graph.forEachNode((nodeId) => {
        graph.setNodeAttribute(nodeId, 'highlighted', false);
    });
    if (renderer) renderer.refresh();
}

function renderBatchConnectList() {
    const list = document.getElementById('batch-connect-list');
    const searchInput = document.getElementById('batch-search-input');
    const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';

    const nodes = [];
    graph.forEachNode((nodeId, attrs) => {
        if (nodeId === 'center') return;

        const label = (attrs.label || '').toLowerCase();
        const company = (attrs.contact?.company || '').toLowerCase();

        if (!searchQuery || label.includes(searchQuery) || company.includes(searchQuery)) {
            nodes.push({ nodeId, attrs });
        }
    });

    // Sort by label
    nodes.sort((a, b) => (a.attrs.label || '').localeCompare(b.attrs.label || ''));

    list.innerHTML = nodes.slice(0, 100).map(({ nodeId, attrs }) => {
        const layer = getLayerById(attrs.layer);
        const isSelected = smartConnectState.selectedNodes.has(nodeId);
        const company = attrs.contact?.company || '';

        return `
            <div class="batch-node-item ${isSelected ? 'selected' : ''}" data-node-id="${nodeId}">
                <input type="checkbox" ${isSelected ? 'checked' : ''}>
                <div class="batch-node-avatar" style="background: ${layer.color}">${getInitials(attrs.label)}</div>
                <div class="batch-node-info">
                    <div class="batch-node-name">${escapeHtml(attrs.label)}</div>
                    ${company ? `<div class="batch-node-company">${escapeHtml(company)}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    if (nodes.length > 100) {
        list.innerHTML += `<div class="batch-more">Hiển thị 100/${nodes.length}. Dùng tìm kiếm để lọc.</div>`;
    }

    // Add click handlers
    list.querySelectorAll('.batch-node-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.type === 'checkbox') return;

            const nodeId = item.dataset.nodeId;
            const checkbox = item.querySelector('input[type="checkbox"]');

            if (smartConnectState.selectedNodes.has(nodeId)) {
                smartConnectState.selectedNodes.delete(nodeId);
                item.classList.remove('selected');
                checkbox.checked = false;
            } else {
                smartConnectState.selectedNodes.add(nodeId);
                item.classList.add('selected');
                checkbox.checked = true;
            }

            updateBatchConnectCount();
            highlightSelectedNodes();
        });

        item.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
            const nodeId = item.dataset.nodeId;

            if (e.target.checked) {
                smartConnectState.selectedNodes.add(nodeId);
                item.classList.add('selected');
            } else {
                smartConnectState.selectedNodes.delete(nodeId);
                item.classList.remove('selected');
            }

            updateBatchConnectCount();
            highlightSelectedNodes();
        });
    });

    updateBatchConnectCount();
}

function updateBatchConnectCount() {
    const countEl = document.getElementById('batch-selected-count');
    if (countEl) {
        countEl.textContent = smartConnectState.selectedNodes.size;
    }
}

function highlightSelectedNodes() {
    graph.forEachNode((nodeId) => {
        const isSelected = smartConnectState.selectedNodes.has(nodeId);
        graph.setNodeAttribute(nodeId, 'highlighted', isSelected);
    });
    if (renderer) renderer.refresh();
}

// Kết nối tất cả selected nodes với TÔI (center)
function batchConnectToCenter() {
    const selectedNodes = Array.from(smartConnectState.selectedNodes);

    if (selectedNodes.length === 0) {
        showToast('Chưa chọn node nào!', 'warning');
        return;
    }

    let newConnections = 0;

    selectedNodes.forEach(nodeId => {
        if (!graph.hasEdge('center', nodeId) && !graph.hasEdge(nodeId, 'center')) {
            graph.addEdge('center', nodeId, {
                relationship: 'other',
                color: EDGE_TYPES.other.color,
                label: '',
                size: 2
            });
            newConnections++;
        }
    });

    if (newConnections > 0) {
        applyColorsByDistance(false);
        saveData();
        showToast(`Đã kết nối ${newConnections} người với TÔI`, 'success');
    } else {
        showToast('Tất cả đã được kết nối với TÔI!', 'info');
    }

    smartConnectState.selectedNodes.clear();
    renderBatchConnectList();
    if (renderer) renderer.refresh();
}

// Kết nối selected nodes với nhau (all pairs)
function batchConnectAllPairs() {
    const selectedNodes = Array.from(smartConnectState.selectedNodes);

    if (selectedNodes.length < 2) {
        showToast('Cần chọn ít nhất 2 node!', 'warning');
        return;
    }

    let newConnections = 0;

    for (let i = 0; i < selectedNodes.length; i++) {
        for (let j = i + 1; j < selectedNodes.length; j++) {
            if (!graph.hasEdge(selectedNodes[i], selectedNodes[j]) &&
                !graph.hasEdge(selectedNodes[j], selectedNodes[i])) {
                graph.addEdge(selectedNodes[i], selectedNodes[j], {
                    relationship: 'other',
                    color: EDGE_TYPES.other.color,
                    label: '',
                    size: 2
                });
                newConnections++;
            }
        }
    }

    if (newConnections > 0) {
        applyColorsByDistance(false);
        saveData();
        showToast(`Đã tạo ${newConnections} kết nối giữa ${selectedNodes.length} người`, 'success');
    } else {
        showToast('Tất cả đã được kết nối với nhau!', 'info');
    }

    smartConnectState.selectedNodes.clear();
    renderBatchConnectList();
    if (renderer) renderer.refresh();
}

// Select all visible nodes
function batchSelectAll() {
    const list = document.getElementById('batch-connect-list');
    list.querySelectorAll('.batch-node-item').forEach(item => {
        const nodeId = item.dataset.nodeId;
        smartConnectState.selectedNodes.add(nodeId);
        item.classList.add('selected');
        item.querySelector('input[type="checkbox"]').checked = true;
    });
    updateBatchConnectCount();
    highlightSelectedNodes();
}

// Deselect all
function batchDeselectAll() {
    smartConnectState.selectedNodes.clear();
    const list = document.getElementById('batch-connect-list');
    list.querySelectorAll('.batch-node-item').forEach(item => {
        item.classList.remove('selected');
        item.querySelector('input[type="checkbox"]').checked = false;
    });
    updateBatchConnectCount();
    highlightSelectedNodes();
}

// Escape HTML helper
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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

// Debounced save to prevent excessive writes
let saveDataPending = false;
function saveData() {
    // Clear any pending save
    if (state.saveDataTimeout) {
        clearTimeout(state.saveDataTimeout);
    }

    // Schedule save after 500ms of inactivity
    state.saveDataTimeout = setTimeout(() => {
        saveDataImmediate();
    }, 500);
}

// Immediate save for critical operations
async function saveDataImmediate() {
    if (state.saveDataTimeout) {
        clearTimeout(state.saveDataTimeout);
        state.saveDataTimeout = null;
    }

    const payload = {
        version: '4.0',
        graph: graph.export(),
        layers: state.layers,
        savedAt: new Date().toISOString()
    };

    // Try IndexedDB first
    if (state.useIndexedDB && state.db) {
        try {
            await saveToIndexedDB();
            updateAutosaveBadge();
            return;
        } catch (e) {
            console.warn('IndexedDB save failed, falling back to localStorage:', e);
        }
    }

    // Fallback to localStorage
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

async function loadData() {
    // Try IndexedDB first
    if (state.useIndexedDB && state.db) {
        try {
            const loaded = await loadFromIndexedDB();
            if (loaded) {
                return true;
            }
        } catch (e) {
            console.warn('IndexedDB load failed:', e);
        }
    }

    // Try v3/v4 format from localStorage
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
                showToast('Đã nâng cấp dữ liệu từ v2 lên v4!', 'success');
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

// Export functions (v4.0)
function openExportModal() {
    const modal = document.getElementById('export-modal');
    const overlay = document.getElementById('overlay');

    // Populate layer checkboxes
    const layerCheckboxes = document.getElementById('export-layers');
    layerCheckboxes.innerHTML = state.layers.map(layer => `
        <label class="checkbox-item">
            <input type="checkbox" class="export-layer-cb" value="${layer.id}" checked>
            <span style="color: ${layer.color}">${layer.name}</span>
        </label>
    `).join('');

    modal.style.display = 'block';
    overlay.style.display = 'block';
}

function closeExportModal() {
    document.getElementById('export-modal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

function getExportData() {
    const exportAll = document.getElementById('export-all').checked;
    const selectedLayers = exportAll
        ? state.layers.map(l => l.id)
        : Array.from(document.querySelectorAll('.export-layer-cb:checked')).map(cb => cb.value);

    // Filter graph data by selected layers
    const graphData = graph.export();

    if (!exportAll) {
        graphData.nodes = graphData.nodes.filter(node =>
            node.key === 'center' || selectedLayers.includes(node.attributes?.layer)
        );

        const nodeKeys = new Set(graphData.nodes.map(n => n.key));
        graphData.edges = graphData.edges.filter(edge =>
            nodeKeys.has(edge.source) && nodeKeys.has(edge.target)
        );
    }

    return {
        version: '4.0',
        exportedAt: new Date().toISOString(),
        layers: state.layers.filter(l => selectedLayers.includes(l.id)),
        graph: graphData
    };
}

function downloadJSON() {
    let data = getExportData();

    // Apply privacy masking if selected
    const options = {
        maskPhone: document.getElementById('mask-phone')?.checked,
        maskEmail: document.getElementById('mask-email')?.checked,
        maskAddress: document.getElementById('mask-address')?.checked,
        maskNotes: document.getElementById('mask-notes')?.checked
    };

    if (options.maskPhone || options.maskEmail || options.maskAddress || options.maskNotes) {
        data = applyPrivacyMasking(data, options);
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = "social_graph_v4_" + Date.now() + ".json";
    a.click();

    closeExportModal();
    showToast('Đã xuất file JSON thành công!', 'success');
}

async function downloadEncrypted() {
    const password = document.getElementById('export-password').value;
    const confirm = document.getElementById('export-password-confirm').value;

    if (!password) {
        showToast('Vui lòng nhập mật khẩu!', 'warning');
        return;
    }

    if (password !== confirm) {
        showToast('Mật khẩu xác nhận không khớp!', 'warning');
        return;
    }

    if (password.length < 6) {
        showToast('Mật khẩu phải có ít nhất 6 ký tự!', 'warning');
        return;
    }

    try {
        let data = getExportData();

        // Apply privacy masking if selected
        const options = {
            maskPhone: document.getElementById('mask-phone')?.checked,
            maskEmail: document.getElementById('mask-email')?.checked,
            maskAddress: document.getElementById('mask-address')?.checked,
            maskNotes: document.getElementById('mask-notes')?.checked
        };

        if (options.maskPhone || options.maskEmail || options.maskAddress || options.maskNotes) {
            data = applyPrivacyMasking(data, options);
        }

        showToast('Đang mã hóa...', 'info', 2000);
        const encrypted = await encryptData(data, password);

        // Download as .sgraph file
        const blob = new Blob([encrypted], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "social_graph_encrypted_" + Date.now() + ".sgraph";
        a.click();
        URL.revokeObjectURL(url);

        closeExportModal();
        showToast('Đã xuất file mã hóa thành công!', 'success');
    } catch (e) {
        showToast('Lỗi khi mã hóa: ' + e.message, 'error');
    }
}

async function captureGraphImage() {
    showToast('Đang chụp ảnh...', 'info', 2000);
    const container = document.getElementById(CONTAINER_ID);
    const { default: html2canvas } = await import('https://cdn.skypack.dev/html2canvas');
    const canvas = await html2canvas(container, { scale: 2, useCORS: true });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `social_graph_v32_${Date.now()}.png`;
    link.click();
    showToast('Đã lưu ảnh thành công!', 'success');
}

function uploadJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const importMode = document.querySelector('input[name="import-mode"]:checked')?.value || 'replace';

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);

            if (importMode === 'merge') {
                // Store for merge process
                state.pendingImportData = data;
                performMergeAnalysis(data);
            } else {
                // Replace mode
                graph.clear();

                // Load layers if present
                if (data.layers && Array.isArray(data.layers)) {
                    state.layers = data.layers;
                    renderLayerFilters();
                    renderLayersList();
    renderTagList();
                }

                // Load graph
                const graphData = data.graph || data;
                graph.import(graphData);
                ensureNodeAttributes();
                applyColorsByDistance(false);
                updateNodeCount();
                saveData();

                closeImportModal();
                showToast('Đã nhập dữ liệu thành công!', 'success');
            }
        } catch (err) {
            showToast('File không hợp lệ!', 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
}

// Import Modal Functions (v4.0)
function openImportModal() {
    const modal = document.getElementById('import-modal');
    document.getElementById('overlay').style.display = 'block';
    modal.style.display = 'block';

    // Reset state
    state.pendingImportData = null;
    state.vcfContacts = [];
    state.vcfSelected.clear();
    document.getElementById('btn-confirm-import').disabled = true;
}

function closeImportModal() {
    document.getElementById('import-modal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

function switchImportTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabId);
    });
}

// VCF Import Functions (v4.0)
function uploadVCF(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const contacts = parseVCF(e.target.result);
        if (contacts.length === 0) {
            showToast('Không tìm thấy contacts trong file VCF!', 'warning');
            return;
        }

        state.vcfContacts = contacts;
        state.vcfSelected = new Set(contacts.map((_, i) => i)); // Select all by default
        openVCFModal();
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
}

function openVCFModal() {
    closeImportModal();

    const modal = document.getElementById('vcf-modal');
    document.getElementById('overlay').style.display = 'block';
    modal.style.display = 'block';

    // Update target layer select
    const layerSelect = document.getElementById('vcf-target-layer');
    layerSelect.innerHTML = state.layers.map(l =>
        `<option value="${l.id}">${l.name}</option>`
    ).join('');

    renderVCFContacts();
    updateVCFStats();
}

function closeVCFModal() {
    document.getElementById('vcf-modal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

// VCF contact item HTML generator
function createVCFContactHTML(contact, index) {
    const isSelected = state.vcfSelected.has(index);
    const phone = contact.phones[0]?.number || '';
    const email = contact.emails[0]?.email || '';
    const detail = contact.company || phone || email;

    return `
        <div class="vcf-contact-item ${isSelected ? 'selected' : ''}" data-index="${index}">
            <input type="checkbox" ${isSelected ? 'checked' : ''} data-index="${index}">
            <div class="vcf-contact-avatar">${getInitials(contact.name)}</div>
            <div class="vcf-contact-info">
                <div class="vcf-contact-name">${contact.name}</div>
                <div class="vcf-contact-detail">${detail}</div>
                ${contact.phones.length > 1 ? `
                    <div class="vcf-contact-phones">
                        ${contact.phones.slice(0, 3).map(p => `<span class="vcf-phone-badge">${p.type}: ${p.number}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Lazy loading for VCF contacts - only render visible items + buffer
function renderVCFContacts(filterText = '') {
    const list = document.getElementById('vcf-contacts-list');
    const filter = filterText.toLowerCase();

    // Filter contacts first
    state.vcfFilteredIndices = [];
    state.vcfContacts.forEach((contact, index) => {
        if (!filter || contact.name.toLowerCase().includes(filter)) {
            state.vcfFilteredIndices.push(index);
        }
    });

    // Reset render limit for new filter
    state.vcfRenderLimit = 50;

    // Render only first batch
    renderVCFBatch();

    // Setup scroll listener for lazy loading
    if (state.vcfScrollListener) {
        list.removeEventListener('scroll', state.vcfScrollListener);
    }

    state.vcfScrollListener = throttle(() => {
        const scrollTop = list.scrollTop;
        const scrollHeight = list.scrollHeight;
        const clientHeight = list.clientHeight;

        // Load more when near bottom (100px threshold)
        if (scrollTop + clientHeight >= scrollHeight - 100) {
            if (state.vcfRenderLimit < state.vcfFilteredIndices.length) {
                state.vcfRenderLimit += 50;
                renderVCFBatch(true); // Append mode
            }
        }
    }, 100);

    list.addEventListener('scroll', state.vcfScrollListener);
}

// Render a batch of VCF contacts
function renderVCFBatch(append = false) {
    const list = document.getElementById('vcf-contacts-list');
    const indices = state.vcfFilteredIndices || [];
    const limit = Math.min(state.vcfRenderLimit, indices.length);

    if (indices.length === 0) {
        list.innerHTML = '<div class="no-results">Không tìm thấy kết quả</div>';
        return;
    }

    const startIndex = append ? list.children.length : 0;
    const html = [];

    for (let i = startIndex; i < limit; i++) {
        const index = indices[i];
        html.push(createVCFContactHTML(state.vcfContacts[index], index));
    }

    if (append) {
        list.insertAdjacentHTML('beforeend', html.join(''));
    } else {
        list.innerHTML = html.join('');
    }

    // Show load more indicator if there are more items
    if (limit < indices.length) {
        const remaining = indices.length - limit;
        const existingIndicator = list.querySelector('.vcf-load-more');
        if (!existingIndicator) {
            list.insertAdjacentHTML('beforeend',
                `<div class="vcf-load-more">Cuộn xuống để xem thêm ${remaining} contacts...</div>`
            );
        } else {
            existingIndicator.textContent = `Cuộn xuống để xem thêm ${remaining} contacts...`;
        }
    } else {
        const existingIndicator = list.querySelector('.vcf-load-more');
        if (existingIndicator) existingIndicator.remove();
    }

    // Use event delegation for better performance
    setupVCFClickHandlers();
}

// Event delegation for VCF contact clicks
function setupVCFClickHandlers() {
    const list = document.getElementById('vcf-contacts-list');

    // Remove old listener if exists
    if (list._vcfClickHandler) {
        list.removeEventListener('click', list._vcfClickHandler);
    }

    // Single event listener for all items
    list._vcfClickHandler = (e) => {
        const item = e.target.closest('.vcf-contact-item');
        if (!item) return;

        const index = parseInt(item.dataset.index);
        if (isNaN(index)) return;

        if (e.target.type !== 'checkbox') {
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox) checkbox.checked = !checkbox.checked;
        }

        toggleVCFSelection(index);
        item.classList.toggle('selected', state.vcfSelected.has(index));
    };

    list.addEventListener('click', list._vcfClickHandler);
}

function toggleVCFSelection(index) {
    if (state.vcfSelected.has(index)) {
        state.vcfSelected.delete(index);
    } else {
        state.vcfSelected.add(index);
    }
    updateVCFStats();
}

function selectAllVCF() {
    // Select all filtered contacts
    const indices = state.vcfFilteredIndices || [];
    indices.forEach(i => state.vcfSelected.add(i));

    // Update UI without full re-render
    document.querySelectorAll('.vcf-contact-item').forEach(item => {
        item.classList.add('selected');
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox) checkbox.checked = true;
    });

    updateVCFStats();
}

function deselectAllVCF() {
    // Deselect all filtered contacts
    const indices = state.vcfFilteredIndices || [];
    indices.forEach(i => state.vcfSelected.delete(i));

    // Update UI without full re-render
    document.querySelectorAll('.vcf-contact-item').forEach(item => {
        item.classList.remove('selected');
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox) checkbox.checked = false;
    });

    updateVCFStats();
}

function updateVCFStats() {
    const total = state.vcfContacts.length;
    const filtered = state.vcfFilteredIndices?.length || total;
    const selected = state.vcfSelected.size;

    document.getElementById('vcf-total').textContent =
        filtered === total ? total : `${filtered}/${total}`;
    document.getElementById('vcf-selected').textContent = selected;
}

async function importSelectedVCF() {
    if (state.vcfSelected.size === 0) {
        showToast('Vui lòng chọn ít nhất một contact!', 'warning');
        return;
    }

    const targetLayer = document.getElementById('vcf-target-layer').value;
    const selectedIndices = Array.from(state.vcfSelected);
    const total = selectedIndices.length;

    // Close modal and show progress
    closeVCFModal();
    showToast(`Đang import ${total} contacts...`, 'info', 10000);

    // Disable graph refresh during import
    const timestamp = Date.now();

    // Process in batches using requestAnimationFrame
    await processBatch(
        selectedIndices,
        (index, i) => {
            const contact = state.vcfContacts[index];
            const nodeId = 'vcf_' + timestamp + '_' + index;

            // Distribute in spiral pattern for better initial layout
            const spiralAngle = (i / total) * Math.PI * 8;
            const radius = 80 + (i / total) * 200;

            graph.addNode(nodeId, {
                label: contact.name,
                layer: targetLayer,
                distance: 0,
                size: 15,
                color: '#999',
                x: radius * Math.cos(spiralAngle),
                y: radius * Math.sin(spiralAngle),
                contact: {
                    email: contact.emails[0]?.email || '',
                    phone: contact.phones[0]?.number || '',
                    address: contact.addresses[0] || '',
                    company: contact.company || '',
                    position: contact.position || '',
                    facebook: '',
                    social: '',
                    birthday: contact.birthday || '',
                    notes: contact.notes || ''
                }
            });
        },
        100, // Batch size
        (processed, totalItems) => {
            // Update progress every batch
            if (processed % 200 === 0 || processed === totalItems) {
                renderer.refresh();
            }
        }
    );

    // Final updates
    applyColorsByDistance(false);
    updateNodeCount();
    saveDataImmediate(); // Use immediate save after import
    showToast(`Đã import ${total} contacts!`, 'success');
}

// Merge Functions (v4.0)
function performMergeAnalysis(data) {
    const newNodes = data.graph?.nodes || [];
    const existingNodes = graph.export().nodes;

    const { duplicates, newItems } = findDuplicates(newNodes, existingNodes);

    state.mergeConflicts = duplicates;

    // Update merge stats
    document.getElementById('merge-new').textContent = newItems.length;
    document.getElementById('merge-duplicate').textContent = duplicates.length;
    document.getElementById('merge-update').textContent = duplicates.length;

    // Render conflicts
    const conflictsEl = document.getElementById('merge-conflicts');
    conflictsEl.innerHTML = duplicates.slice(0, 20).map(d => `
        <div class="conflict-item">
            <i class="fas fa-exclamation-triangle"></i>
            <div class="conflict-info">
                <div class="conflict-name">${d.new.attributes?.label || 'Không tên'}</div>
                <div class="conflict-detail">Trùng với: ${d.existing.attributes?.label || ''}</div>
            </div>
        </div>
    `).join('');

    if (duplicates.length > 20) {
        conflictsEl.innerHTML += `<div class="conflict-item"><i class="fas fa-ellipsis-h"></i><div class="conflict-info">...và ${duplicates.length - 20} mục khác</div></div>`;
    }

    // Show merge modal
    closeImportModal();
    document.getElementById('merge-modal').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

function closeMergeModal() {
    document.getElementById('merge-modal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
    state.pendingImportData = null;
    state.mergeConflicts = [];
}

function confirmMerge() {
    if (!state.pendingImportData) return;

    const strategy = document.querySelector('input[name="merge-strategy"]:checked')?.value || 'skip';
    const data = state.pendingImportData;
    const newNodes = data.graph?.nodes || [];
    const existingNodes = graph.export().nodes;

    const { duplicates, newItems } = findDuplicates(newNodes, existingNodes);

    // Add new items
    newItems.forEach(node => {
        if (!graph.hasNode(node.key) && node.key !== 'center') {
            const angle = Math.random() * 2 * Math.PI;
            const radius = 50 + Math.random() * 150;

            graph.addNode(node.key, {
                ...node.attributes,
                x: node.attributes?.x || radius * Math.cos(angle),
                y: node.attributes?.y || radius * Math.sin(angle)
            });
        }
    });

    // Handle duplicates based on strategy
    duplicates.forEach(({ existing, new: newNode }) => {
        if (strategy === 'skip') {
            // Do nothing
        } else if (strategy === 'overwrite') {
            if (graph.hasNode(existing.key)) {
                graph.setNodeAttributes(existing.key, newNode.attributes);
            }
        } else if (strategy === 'merge-fields') {
            if (graph.hasNode(existing.key)) {
                const currentAttrs = graph.getNodeAttributes(existing.key);
                const merged = mergeContacts(
                    { attributes: currentAttrs },
                    newNode,
                    'merge-fields'
                );
                graph.setNodeAttributes(existing.key, merged.attributes);
            }
        }
    });

    // Add new edges
    const newEdges = data.graph?.edges || [];
    newEdges.forEach(edge => {
        if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
            if (!graph.hasEdge(edge.source, edge.target) && !graph.hasEdge(edge.target, edge.source)) {
                graph.addEdge(edge.source, edge.target, edge.attributes || { size: 2 });
            }
        }
    });

    // Merge layers
    if (data.layers && Array.isArray(data.layers)) {
        data.layers.forEach(newLayer => {
            if (!state.layers.find(l => l.id === newLayer.id)) {
                state.layers.push(newLayer);
            }
        });
        renderLayerFilters();
        renderLayersList();
    renderTagList();
    }

    ensureNodeAttributes();
    applyColorsByDistance(false);
    updateNodeCount();
    saveData();

    closeMergeModal();
    showToast(`Đã gộp dữ liệu: ${newItems.length} mới, ${duplicates.length} xử lý trùng!`, 'success');
}

// Encrypted file import (v4.0)
async function uploadEncrypted(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        state.encryptedFileData = new Uint8Array(e.target.result);
        document.getElementById('decrypt-section').style.display = 'block';
        document.getElementById('encrypted-drop-zone').style.display = 'none';
    };
    reader.readAsArrayBuffer(file);
    event.target.value = ''; // Reset input
}

async function decryptAndImport() {
    const password = document.getElementById('decrypt-password').value;
    if (!password) {
        showToast('Vui lòng nhập mật khẩu!', 'warning');
        return;
    }

    if (!state.encryptedFileData) {
        showToast('Không có file để giải mã!', 'error');
        return;
    }

    try {
        showToast('Đang giải mã...', 'info', 2000);
        const data = await decryptData(state.encryptedFileData, password);

        // Import decrypted data
        graph.clear();

        if (data.layers && Array.isArray(data.layers)) {
            state.layers = data.layers;
            renderLayerFilters();
            renderLayersList();
    renderTagList();
        }

        const graphData = data.graph || data;
        graph.import(graphData);
        ensureNodeAttributes();
        applyColorsByDistance(false);
        updateNodeCount();
        saveData();

        closeImportModal();
        state.encryptedFileData = null;
        showToast('Đã giải mã và nhập dữ liệu thành công!', 'success');
    } catch (e) {
        showToast(e.message, 'error');
    }
}

// ==========================================
// PHẦN 6: LAYERS MANAGEMENT
// ==========================================

function renderLayerFilters() {
    const container = document.getElementById('layer-filters');
    if (!container) return;  // v5.0: Element may not exist in new UI

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

// v5.0: Render tags in sidebar
function renderTagList() {
    const container = document.getElementById('tag-list');
    if (!container) return;

    // Build tag list HTML
    let html = `
        <div class="tag-item ${state.currentLayer === 'all' ? 'active' : ''}" data-layer="all">
            <div class="tag-color" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>
            <span class="tag-name">Tất cả</span>
            <span class="tag-count">${graph.order}</span>
        </div>
    `;

    state.layers.forEach(layer => {
        const nodeCount = countNodesInLayer(layer.id);
        html += `
            <div class="tag-item ${state.currentLayer === layer.id ? 'active' : ''}" data-layer="${layer.id}">
                <div class="tag-color" style="background: ${layer.color};"></div>
                <span class="tag-name">${layer.name}</span>
                <span class="tag-count">${nodeCount}</span>
            </div>
        `;
    });

    container.innerHTML = html;

    // Add click handlers for filtering
    container.querySelectorAll('.tag-item').forEach(item => {
        item.addEventListener('click', () => {
            const layerId = item.dataset.layer;
            switchLayer(layerId);

            // Update active state visually
            container.querySelectorAll('.tag-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
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
    renderTagList();
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
    renderTagList();
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
    renderTagList();
    saveData();
    closeLayerModal();
    renderer.refresh();
    showToast('Đã xóa layer', 'success');
}

function switchLayer(layerId) {
    state.currentLayer = layerId;

    // Update button states (old toolbar)
    document.querySelectorAll('.layer-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.layer === layerId);
    });

    // v5.0: Update tag list active state in sidebar
    document.querySelectorAll('#tag-list .tag-item').forEach(item => {
        item.classList.toggle('active', item.dataset.layer === layerId);
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
    if (ui.modal) ui.modal.style.display = 'none';
    if (ui.overlay) ui.overlay.style.display = 'none';
    clearModalForm();
    state.mode = 'NORMAL';
    state.selectedNode = null;
    state.parentNode = null;
}

function clearModalForm() {
    if (ui.inpLabel) ui.inpLabel.value = '';
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
    if (ui.edgeModal) ui.edgeModal.style.display = 'none';
    if (ui.overlay) ui.overlay.style.display = 'none';
    state.selectedEdge = null;
}

function openModal(nodeId, mode = 'EDIT') {
    state.mode = mode;
    if (ui.overlay) ui.overlay.style.display = 'block';
    if (ui.modal) ui.modal.style.display = 'block';

    if (mode === 'ADD') {
        if (ui.title) ui.title.innerText = state.parentNode
            ? `Thêm từ: ${graph.getNodeAttribute(state.parentNode, 'label')}`
            : "Thêm người mới";

        clearModalForm();
        if (ui.inpLayer) ui.inpLayer.value = state.layers[0]?.id || 'others';
        if (ui.btnSave) ui.btnSave.innerHTML = '<i class="fas fa-plus"></i> Thêm';
        if (ui.editActions) ui.editActions.style.display = 'none';
        setTimeout(() => ui.inpLabel?.focus(), 100);
    } else {
        state.selectedNode = nodeId;
        const attr = graph.getNodeAttributes(nodeId);
        const contact = attr.contact || {};

        if (ui.title) ui.title.innerText = attr.label;
        if (ui.inpLabel) ui.inpLabel.value = attr.label;
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

        if (ui.btnSave) ui.btnSave.innerHTML = '<i class="fas fa-save"></i> Lưu';

        const isCenter = (nodeId === 'center');
        const deleteBtn = document.getElementById('btn-delete');
        if (deleteBtn) deleteBtn.style.display = isCenter ? 'none' : 'block';
        if (ui.editActions) ui.editActions.style.display = 'block';
    }
}

function openEdgeModal(edge) {
    state.selectedEdge = edge;
    if (ui.overlay) ui.overlay.style.display = 'block';
    if (ui.edgeModal) ui.edgeModal.style.display = 'block';

    const source = graph.source(edge);
    const target = graph.target(edge);
    const sourceLabel = graph.getNodeAttribute(source, 'label');
    const targetLabel = graph.getNodeAttribute(target, 'label');

    const edgeTitle = document.getElementById('edge-modal-title');
    if (edgeTitle) edgeTitle.innerText = `${sourceLabel} ↔ ${targetLabel}`;

    const edgeRelationship = graph.getEdgeAttribute(edge, 'relationship') || 'other';
    const edgeLabelVal = graph.getEdgeAttribute(edge, 'label') || '';

    if (ui.edgeType) ui.edgeType.value = edgeRelationship;
    if (ui.edgeLabel) ui.edgeLabel.value = edgeLabelVal;
}

// ==========================================
// PHẦN 8: LAYOUT ALGORITHMS
// ==========================================

// Levenshtein Edit Distance - tính độ khác biệt giữa 2 chuỗi
function levenshteinDistance(str1, str2) {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    if (s1 === s2) return 0;
    if (s1.length === 0) return s2.length;
    if (s2.length === 0) return s1.length;

    const matrix = [];

    // Initialize first column
    for (let i = 0; i <= s1.length; i++) {
        matrix[i] = [i];
    }

    // Initialize first row
    for (let j = 0; j <= s2.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= s1.length; i++) {
        for (let j = 1; j <= s2.length; j++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    return matrix[s1.length][s2.length];
}

// Normalize name for better similarity matching
function normalizeName(name) {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s]/g, '')
        .trim();
}

// Calculate similarity score (0-1, higher is more similar)
function nameSimilarity(name1, name2) {
    const n1 = normalizeName(name1);
    const n2 = normalizeName(name2);
    const maxLen = Math.max(n1.length, n2.length);
    if (maxLen === 0) return 1;
    const distance = levenshteinDistance(n1, n2);
    return 1 - (distance / maxLen);
}

// Layout: Name Similarity - group similar names together (optimized)
function calculateSimilarityPositions() {
    const positions = new Map();
    const nodes = [];

    // Collect all nodes except center with pre-computed normalized names
    graph.forEachNode((nodeId) => {
        if (nodeId !== 'center') {
            const attrs = graph.getNodeAttributes(nodeId);
            const label = attrs.label || nodeId;
            nodes.push({
                id: nodeId,
                label: label,
                normalized: normalizeName(label),
                prefix: normalizeName(label).substring(0, 3) // First 3 chars for fast grouping
            });
        }
    });

    // Place center at origin
    positions.set('center', { x: 0, y: 0 });

    if (nodes.length === 0) return positions;

    // OPTIMIZATION: Group by prefix first to reduce O(n²) comparisons
    const prefixGroups = new Map();
    nodes.forEach(node => {
        const prefix = node.prefix;
        if (!prefixGroups.has(prefix)) {
            prefixGroups.set(prefix, []);
        }
        prefixGroups.get(prefix).push(node);
    });

    // Cluster within prefix groups (much smaller O(n²) in small groups)
    const clusters = [];
    const assigned = new Set();
    const SIMILARITY_THRESHOLD = 0.4;

    // Sort by name to ensure consistent grouping
    nodes.sort((a, b) => a.label.localeCompare(b.label));

    nodes.forEach(node => {
        if (assigned.has(node.id)) return;

        const cluster = [node];
        assigned.add(node.id);

        // Only check nodes with similar prefixes (optimization)
        const prefixesToCheck = [node.prefix];

        // Also check adjacent prefixes (for names like "An" vs "Ann")
        const prefixChars = node.prefix.split('');
        if (prefixChars.length >= 2) {
            prefixesToCheck.push(prefixChars.slice(0, 2).join(''));
        }

        prefixesToCheck.forEach(prefix => {
            const candidates = prefixGroups.get(prefix) || [];
            candidates.forEach(other => {
                if (assigned.has(other.id)) return;

                // Quick length check - skip if lengths differ too much
                const lenDiff = Math.abs(node.normalized.length - other.normalized.length);
                const maxLen = Math.max(node.normalized.length, other.normalized.length);
                if (maxLen > 0 && lenDiff / maxLen > 0.6) return;

                const similarity = nameSimilarity(node.label, other.label);
                if (similarity >= SIMILARITY_THRESHOLD) {
                    cluster.push(other);
                    assigned.add(other.id);
                }
            });
        });

        clusters.push(cluster);
    });

    // Position clusters in a spiral around center
    const CLUSTER_RADIUS = 120;
    let currentAngle = -Math.PI / 2;
    let currentRadius = CLUSTER_RADIUS;

    clusters.forEach((cluster, clusterIndex) => {
        const clusterX = currentRadius * Math.cos(currentAngle);
        const clusterY = currentRadius * Math.sin(currentAngle);

        if (cluster.length === 1) {
            positions.set(cluster[0].id, { x: clusterX, y: clusterY });
        } else {
            const subRadius = Math.max(30, cluster.length * 8);
            cluster.forEach((node, nodeIndex) => {
                const subAngle = (nodeIndex / cluster.length) * 2 * Math.PI - Math.PI / 2;
                positions.set(node.id, {
                    x: clusterX + subRadius * Math.cos(subAngle),
                    y: clusterY + subRadius * Math.sin(subAngle)
                });
            });
        }

        currentAngle += Math.PI / 4;
        if (clusterIndex % 8 === 7) {
            currentRadius += CLUSTER_RADIUS * 0.8;
            currentAngle = -Math.PI / 2;
        }
    });

    return positions;
}

// Layout: By Layer - group by layer category
function calculateLayerPositions() {
    const positions = new Map();

    // Place center at origin
    positions.set('center', { x: 0, y: 0 });

    // Group nodes by layer
    const layerGroups = new Map();
    graph.forEachNode((nodeId) => {
        if (nodeId === 'center') return;
        const attrs = graph.getNodeAttributes(nodeId);
        const layer = attrs.layer || 'others';
        if (!layerGroups.has(layer)) {
            layerGroups.set(layer, []);
        }
        layerGroups.get(layer).push(nodeId);
    });

    // Position each layer in a sector
    const layerCount = layerGroups.size;
    const anglePerLayer = (2 * Math.PI) / Math.max(layerCount, 1);
    let layerIndex = 0;

    const BASE_RADIUS = 150;
    const RING_SPACING = 60;
    const MIN_ARC_SPACING = 40;

    layerGroups.forEach((nodes, layerId) => {
        const layerAngle = layerIndex * anglePerLayer - Math.PI / 2;
        const halfSpread = anglePerLayer * 0.4;

        // Sort nodes by label for consistent ordering
        nodes.sort((a, b) => {
            const labelA = graph.getNodeAttributes(a).label || '';
            const labelB = graph.getNodeAttributes(b).label || '';
            return labelA.localeCompare(labelB);
        });

        // Distribute nodes in concentric arcs within the sector
        const nodesPerRing = Math.max(3, Math.floor(anglePerLayer * BASE_RADIUS / MIN_ARC_SPACING));

        nodes.forEach((nodeId, nodeIndex) => {
            const ring = Math.floor(nodeIndex / nodesPerRing);
            const indexInRing = nodeIndex % nodesPerRing;
            const nodesInThisRing = Math.min(nodesPerRing, nodes.length - ring * nodesPerRing);

            const radius = BASE_RADIUS + ring * RING_SPACING;
            const angleSpread = halfSpread * 2 * (nodesInThisRing / nodesPerRing);
            const startAngle = layerAngle - angleSpread / 2;
            const angleStep = nodesInThisRing > 1 ? angleSpread / (nodesInThisRing - 1) : 0;
            const angle = startAngle + indexInRing * angleStep;

            positions.set(nodeId, {
                x: radius * Math.cos(angle),
                y: radius * Math.sin(angle)
            });
        });

        layerIndex++;
    });

    return positions;
}

// Layout: Grid - arrange in rows and columns
function calculateGridPositions() {
    const positions = new Map();
    const nodes = [];

    graph.forEachNode((nodeId) => {
        if (nodeId !== 'center') {
            const attrs = graph.getNodeAttributes(nodeId);
            nodes.push({ id: nodeId, label: attrs.label || nodeId });
        }
    });

    // Sort alphabetically
    nodes.sort((a, b) => a.label.localeCompare(b.label));

    // Calculate grid dimensions
    const count = nodes.length;
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);

    const CELL_WIDTH = 80;
    const CELL_HEIGHT = 70;
    const offsetX = -(cols - 1) * CELL_WIDTH / 2;
    const offsetY = -(rows - 1) * CELL_HEIGHT / 2 + 80; // Leave space for center

    // Place center above the grid
    positions.set('center', { x: 0, y: offsetY - 100 });

    nodes.forEach((node, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        positions.set(node.id, {
            x: offsetX + col * CELL_WIDTH,
            y: offsetY + row * CELL_HEIGHT
        });
    });

    return positions;
}

// Layout: Circular - all nodes in a circle around center
function calculateCircularPositions() {
    const positions = new Map();
    const nodes = [];

    graph.forEachNode((nodeId) => {
        if (nodeId !== 'center') {
            nodes.push(nodeId);
        }
    });

    // Place center at origin
    positions.set('center', { x: 0, y: 0 });

    if (nodes.length === 0) return positions;

    // Sort by label for consistent ordering
    nodes.sort((a, b) => {
        const labelA = graph.getNodeAttributes(a).label || '';
        const labelB = graph.getNodeAttributes(b).label || '';
        return labelA.localeCompare(labelB);
    });

    // Calculate radius based on node count
    const MIN_RADIUS = 150;
    const NODE_ARC = 50; // Minimum arc length per node
    const radius = Math.max(MIN_RADIUS, (nodes.length * NODE_ARC) / (2 * Math.PI));

    nodes.forEach((nodeId, index) => {
        const angle = (index / nodes.length) * 2 * Math.PI - Math.PI / 2;
        positions.set(nodeId, {
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        });
    });

    return positions;
}

// Layout: Radial Tree - original layout based on graph distance
function calculateRadialTreePositions() {
    const positions = new Map();

    // Place center node at origin
    positions.set('center', { x: 0, y: 0 });

    // Get direct connections to center (distance 1)
    const directConnections = [];
    graph.forEachNeighbor('center', (neighborId) => {
        directConnections.push(neighborId);
    });

    if (directConnections.length === 0) return positions;

    // Calculate angle for each direct connection (branch)
    const anglePerBranch = (2 * Math.PI) / directConnections.length;

    // For each direct connection, build its subtree
    directConnections.forEach((branchRoot, branchIndex) => {
        const branchAngle = branchIndex * anglePerBranch - Math.PI / 2; // Start from top

        // BFS to find all nodes in this branch (excluding center and other branches)
        const branchNodes = new Map(); // nodeId -> depth in branch
        const visited = new Set(['center', ...directConnections]);
        const queue = [{ nodeId: branchRoot, depth: 1 }];

        branchNodes.set(branchRoot, 1);
        visited.add(branchRoot);

        while (queue.length > 0) {
            const { nodeId, depth } = queue.shift();

            graph.forEachNeighbor(nodeId, (neighborId) => {
                if (!visited.has(neighborId)) {
                    visited.add(neighborId);
                    branchNodes.set(neighborId, depth + 1);
                    queue.push({ nodeId: neighborId, depth: depth + 1 });
                }
            });
        }

        // Group nodes by depth within this branch
        const nodesByDepth = new Map();
        branchNodes.forEach((depth, nodeId) => {
            if (!nodesByDepth.has(depth)) {
                nodesByDepth.set(depth, []);
            }
            nodesByDepth.get(depth).push(nodeId);
        });

        // Calculate angular spread for this branch (narrower as we go out)
        const maxDepth = Math.max(...nodesByDepth.keys());
        const branchSpread = anglePerBranch * 0.8; // Use 80% of allocated angle

        // Position nodes in this branch
        nodesByDepth.forEach((nodes, depth) => {
            const radius = RADIAL_LAYOUT_CONFIG.MIN_RADIUS +
                          (depth - 1) * RADIAL_LAYOUT_CONFIG.RING_SPACING;

            if (nodes.length === 1) {
                // Single node - place on branch angle
                const angle = branchAngle;
                positions.set(nodes[0], {
                    x: radius * Math.cos(angle),
                    y: radius * Math.sin(angle)
                });
            } else {
                // Multiple nodes - spread within branch sector
                const spreadFactor = Math.min(1, 2 / depth); // Narrow spread at deeper levels
                const actualSpread = branchSpread * spreadFactor;
                const startAngle = branchAngle - actualSpread / 2;
                const angleStep = actualSpread / (nodes.length - 1 || 1);

                nodes.forEach((nodeId, index) => {
                    const angle = nodes.length === 1
                        ? branchAngle
                        : startAngle + index * angleStep;
                    positions.set(nodeId, {
                        x: radius * Math.cos(angle),
                        y: radius * Math.sin(angle)
                    });
                });
            }
        });
    });

    // Handle orphan nodes (not connected to center at all)
    graph.forEachNode((nodeId) => {
        if (!positions.has(nodeId)) {
            // Place orphans in outer ring
            const orphanAngle = Math.random() * 2 * Math.PI;
            const orphanRadius = RADIAL_LAYOUT_CONFIG.MIN_RADIUS +
                                RADIAL_LAYOUT_CONFIG.RING_SPACING * 4;
            positions.set(nodeId, {
                x: orphanRadius * Math.cos(orphanAngle),
                y: orphanRadius * Math.sin(orphanAngle)
            });
        }
    });

    return positions;
}

// Layout names for toast messages
const LAYOUT_NAMES = {
    radial: 'Cây Tỏa (Radial)',
    similarity: 'Tên Giống Nhau',
    layer: 'Theo Layer',
    grid: 'Lưới (Grid)',
    circular: 'Vòng Tròn'
};

function openLayoutModal() {
    document.getElementById('layout-modal').style.display = 'block';
}

function closeLayoutModal() {
    document.getElementById('layout-modal').style.display = 'none';
}

function startForceLayout(layoutType = 'radial') {
    if (state.forceRunning) {
        stopForceLayout();
        return;
    }

    state.forceRunning = true;
    const btn = document.getElementById('btn-force-layout');
    btn.innerHTML = '<i class="fas fa-stop"></i> Dừng';
    btn.style.background = '#f44336';

    const layoutName = LAYOUT_NAMES[layoutType] || layoutType;
    showToast(`Đang sắp xếp: ${layoutName}...`, 'info', 2000);

    // Calculate target positions based on layout type
    let targetPositions;
    switch (layoutType) {
        case 'similarity':
            targetPositions = calculateSimilarityPositions();
            break;
        case 'layer':
            targetPositions = calculateLayerPositions();
            break;
        case 'grid':
            targetPositions = calculateGridPositions();
            break;
        case 'circular':
            targetPositions = calculateCircularPositions();
            break;
        case 'radial':
        default:
            targetPositions = calculateRadialTreePositions();
            break;
    }

    // Store selected layout type for toast
    state.currentLayoutType = layoutType;

    // Store current positions
    const startPositions = new Map();
    graph.forEachNode((nodeId) => {
        const attrs = graph.getNodeAttributes(nodeId);
        startPositions.set(nodeId, { x: attrs.x || 0, y: attrs.y || 0 });
    });

    let step = 0;
    const totalSteps = RADIAL_LAYOUT_CONFIG.ANIMATION_STEPS;

    const interval = setInterval(() => {
        if (!state.forceRunning || step >= totalSteps) {
            // Final position update
            targetPositions.forEach((pos, nodeId) => {
                graph.setNodeAttribute(nodeId, 'x', pos.x);
                graph.setNodeAttribute(nodeId, 'y', pos.y);
            });
            stopForceLayout();
            clearInterval(interval);
            return;
        }

        // Ease-out animation
        const progress = step / totalSteps;
        const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out

        // Interpolate positions
        graph.forEachNode((nodeId) => {
            const start = startPositions.get(nodeId);
            const target = targetPositions.get(nodeId);

            if (start && target) {
                const x = start.x + (target.x - start.x) * easedProgress;
                const y = start.y + (target.y - start.y) * easedProgress;
                graph.setNodeAttribute(nodeId, 'x', x);
                graph.setNodeAttribute(nodeId, 'y', y);
            }
        });

        renderer.refresh();
        step++;

        const progressPercent = Math.round((step / totalSteps) * 100);
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${progressPercent}%`;
    }, RADIAL_LAYOUT_CONFIG.ANIMATION_DURATION);
}

function stopForceLayout() {
    state.forceRunning = false;
    const btn = document.getElementById('btn-force-layout');
    btn.innerHTML = '<i class="fas fa-project-diagram"></i> Sắp xếp';
    btn.style.background = '#2196F3';
    renderer.refresh();
    saveData();
    const layoutName = LAYOUT_NAMES[state.currentLayoutType] || 'Cây Tỏa';
    showToast(`Đã sắp xếp: ${layoutName}!`, 'success');
}

// ==========================================
// PHẦN 9: DRAG & DROP
// ==========================================

function setupDragAndDrop() {
    const captor = renderer.getMouseCaptor();

    renderer.on('downNode', (e) => {
        // Hide hover panel when starting drag
        hideHoverPanel(true);

        state.isDragging = true;
        state.draggedNode = e.node;
        state.dragStartTime = Date.now();
        state.hasMoved = false;

        const attr = graph.getNodeAttributes(e.node);
        state.dragStartPos = { x: attr.x, y: attr.y };

        // Set for classification drag detection
        if (classificationState.isActive) {
            classificationState.draggedNodeId = e.node;
        }

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

        // Check if hovering over a layer drop zone during classification mode
        if (classificationState.isActive && state.hasMoved) {
            checkLayerDropZoneHover(e.original);
        }

        e.preventSigmaDefault();
        e.original.preventDefault();
        e.original.stopPropagation();
    });

    captor.on('mouseup', (e) => {
        if (state.isDragging && state.draggedNode) {
            const nodeA = state.draggedNode;
            const posA = graph.getNodeAttributes(nodeA);

            graph.removeNodeAttribute(nodeA, 'highlighted');

            // Check if dropped on a layer zone during classification
            if (classificationState.isActive && state.hasMoved) {
                const droppedOnLayer = checkLayerDropZoneDrop(e.original);
                if (droppedOnLayer) {
                    assignNodeToLayer(nodeA, droppedOnLayer);
                    renderLayerDropZones();
                    updateQuickClassifyList();
                }
            } else if (state.hasMoved) {
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
        classificationState.draggedNodeId = null;

        // Clear hover state from all zones
        document.querySelectorAll('.layer-drop-zone').forEach(zone => {
            zone.classList.remove('dragover');
        });

        renderer.getCamera().enable();
        renderer.refresh();
    });
}

function checkLayerDropZoneHover(event) {
    const zones = document.querySelectorAll('.layer-drop-zone');
    zones.forEach(zone => {
        const rect = zone.getBoundingClientRect();
        const isOver = event.clientX >= rect.left && event.clientX <= rect.right &&
                       event.clientY >= rect.top && event.clientY <= rect.bottom;
        zone.classList.toggle('dragover', isOver);
    });
}

function checkLayerDropZoneDrop(event) {
    const zones = document.querySelectorAll('.layer-drop-zone');
    for (const zone of zones) {
        const rect = zone.getBoundingClientRect();
        if (event.clientX >= rect.left && event.clientX <= rect.right &&
            event.clientY >= rect.top && event.clientY <= rect.bottom) {
            return zone.dataset.layer;
        }
    }
    return null;
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
// PHẦN 10: NODE HOVER PANEL (Quick Actions - Phase 4)
// ==========================================

let hoverPanelTimeout = null;
let currentHoveredNodeId = null;

function showHoverPanel(nodeId, mouseX, mouseY) {
    const panel = document.getElementById('node-hover-panel');
    if (!panel || !nodeId) return;

    // Clear any pending hide timeout
    if (hoverPanelTimeout) {
        clearTimeout(hoverPanelTimeout);
        hoverPanelTimeout = null;
    }

    currentHoveredNodeId = nodeId;
    const attrs = graph.getNodeAttributes(nodeId);
    const contact = attrs.contact || {};
    const layer = getLayerById(attrs.layer);

    // Update panel content
    const avatarEl = document.getElementById('hover-avatar');
    const nameEl = document.getElementById('hover-name');
    const metaEl = document.getElementById('hover-meta');

    if (avatarEl) {
        avatarEl.textContent = getInitials(attrs.label);
        avatarEl.style.background = layer.color;
    }
    if (nameEl) nameEl.textContent = attrs.label;
    if (metaEl) {
        const company = contact.company ? contact.company : '';
        metaEl.textContent = company || layer.name;
    }

    // Position panel near mouse but ensure it stays in viewport
    const panelWidth = 240;
    const panelHeight = 130;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = mouseX + 20;
    let top = mouseY - 30;

    // Adjust if panel goes off screen
    if (left + panelWidth > viewportWidth - 20) {
        left = mouseX - panelWidth - 20;
    }
    if (top + panelHeight > viewportHeight - 20) {
        top = viewportHeight - panelHeight - 20;
    }
    if (top < 80) {
        top = 80; // Below top bar
    }

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;

    // Show panel
    panel.classList.remove('hidden');
}

function hideHoverPanel(immediate = false) {
    if (immediate) {
        const panel = document.getElementById('node-hover-panel');
        if (panel) panel.classList.add('hidden');
        currentHoveredNodeId = null;
        return;
    }

    // Delay hiding so user can move mouse to panel
    hoverPanelTimeout = setTimeout(() => {
        const panel = document.getElementById('node-hover-panel');
        if (panel) panel.classList.add('hidden');
        currentHoveredNodeId = null;
    }, 200);
}

function setupHoverPanelEvents() {
    const panel = document.getElementById('node-hover-panel');
    if (!panel) return;

    // ESC key cancels connection mode
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && connectionState.isConnecting) {
            cancelConnection();
            showToast('Đã hủy tạo kết nối', 'info');
        }
    });

    // Keep panel visible when mouse enters it
    panel.addEventListener('mouseenter', () => {
        if (hoverPanelTimeout) {
            clearTimeout(hoverPanelTimeout);
            hoverPanelTimeout = null;
        }
    });

    // Hide panel when mouse leaves it
    panel.addEventListener('mouseleave', () => {
        hideHoverPanel();
    });

    // Quick action handlers
    document.getElementById('hover-view')?.addEventListener('click', () => {
        if (currentHoveredNodeId) {
            openDetailPanel(currentHoveredNodeId);
            hideHoverPanel(true);
        }
    });

    document.getElementById('hover-edit')?.addEventListener('click', () => {
        if (currentHoveredNodeId) {
            editNode(currentHoveredNodeId);
            hideHoverPanel(true);
        }
    });

    document.getElementById('hover-connect')?.addEventListener('click', () => {
        if (currentHoveredNodeId && !connectionState.isConnecting) {
            startConnection(currentHoveredNodeId);
            hideHoverPanel(true);
            showToast('Chọn người muốn kết nối', 'info');
        }
    });

    document.getElementById('hover-delete')?.addEventListener('click', () => {
        if (currentHoveredNodeId) {
            const nodeId = currentHoveredNodeId;
            const attrs = graph.getNodeAttributes(nodeId);
            if (confirm(`Xóa "${attrs.label}"? Hành động này không thể hoàn tác.`)) {
                deleteNode(nodeId);
                hideHoverPanel(true);
            }
        }
    });
}

// Helper functions for hover panel actions
function editNode(nodeId) {
    openModal(nodeId, 'EDIT');
}

function deleteNode(nodeId) {
    if (!graph.hasNode(nodeId)) return;

    // Remove all edges connected to this node
    graph.forEachEdge(nodeId, (edge) => {
        graph.dropEdge(edge);
    });

    // Remove the node
    graph.dropNode(nodeId);

    // Update UI
    applyColorsByDistance(false);
    updateNodeCount();
    saveGraph();
    showToast('Đã xóa người này', 'success');
}

// Connection state for quick connect
const connectionState = {
    isConnecting: false,
    sourceNode: null
};

function startConnection(sourceNodeId) {
    connectionState.isConnecting = true;
    connectionState.sourceNode = sourceNodeId;

    // Highlight the source node
    graph.setNodeAttribute(sourceNodeId, 'highlighted', true);
    renderer.refresh();

    // Change cursor
    document.getElementById('container').style.cursor = 'crosshair';
}

function completeConnection(targetNodeId) {
    if (!connectionState.isConnecting || !connectionState.sourceNode) return;
    if (connectionState.sourceNode === targetNodeId) {
        cancelConnection();
        return;
    }

    const sourceId = connectionState.sourceNode;

    // Check if edge already exists
    if (!graph.hasEdge(sourceId, targetNodeId) && !graph.hasEdge(targetNodeId, sourceId)) {
        graph.addEdge(sourceId, targetNodeId, {
            relationship: 'other',
            color: EDGE_TYPES.other.color,
            label: '',
            size: 2
        });
        saveGraph();
        showToast('Đã tạo kết nối', 'success');
    } else {
        showToast('Kết nối đã tồn tại', 'warning');
    }

    cancelConnection();
}

function cancelConnection() {
    if (connectionState.sourceNode) {
        graph.setNodeAttribute(connectionState.sourceNode, 'highlighted', false);
    }
    connectionState.isConnecting = false;
    connectionState.sourceNode = null;

    document.getElementById('container').style.cursor = 'default';
    renderer.refresh();
}

// Legacy compatibility
function showNodeTooltip(nodeId, mouseX, mouseY) {
    showHoverPanel(nodeId, mouseX, mouseY);
}

function hideNodeTooltip() {
    hideHoverPanel();
}

// ==========================================
// PHẦN 11: SEARCH FUNCTIONS
// ==========================================

// Clear search filter and show all nodes
function clearSearchFilter() {
    state.searchFilterActive = false;
    state.searchFilteredNodes = null;

    // Update filter indicator (v5.0: using new ID)
    const filterIndicator = document.getElementById('filter-indicator');
    if (filterIndicator) {
        filterIndicator.classList.add('hidden');
    }

    // Refresh renderer to show all nodes
    if (renderer) {
        renderer.refresh();
    }
}

// Apply search filter to show only matching nodes
function applySearchFilter(nodeIds) {
    state.searchFilteredNodes = new Set(nodeIds);
    state.searchFilterActive = true;

    // Update filter indicator (v5.0: using new IDs)
    const filterIndicator = document.getElementById('filter-indicator');
    if (filterIndicator) {
        filterIndicator.classList.remove('hidden');
        const countSpan = document.getElementById('filter-count');
        if (countSpan) {
            countSpan.textContent = nodeIds.length;
        }
    }

    // Refresh renderer to apply filter
    if (renderer) {
        renderer.refresh();
    }

    showToast(`Đang hiển thị ${nodeIds.length} node khớp với tìm kiếm`, 'info');
}

// Toggle hub selector dropdown (v5.0: using new ID)
function toggleHubSelectorDropdown() {
    const dropdown = document.getElementById('hub-dropdown');
    if (!dropdown) return;

    const isHidden = dropdown.classList.contains('hidden');

    if (isHidden) {
        // Render the list of filtered nodes
        renderHubDropdownList();
        dropdown.classList.remove('hidden');
    } else {
        dropdown.classList.add('hidden');
    }
}

// Close hub selector dropdown (v5.0: using new ID)
function closeHubSelectorDropdown() {
    const dropdown = document.getElementById('hub-dropdown');
    if (dropdown) {
        dropdown.classList.add('hidden');
    }
}

// Render list of filtered nodes in the hub dropdown (v5.0: updated CSS classes)
function renderHubDropdownList() {
    const list = document.getElementById('hub-dropdown-list');
    if (!list || !state.searchFilteredNodes) return;

    const filteredNodes = Array.from(state.searchFilteredNodes);

    // Build list items with v5.0 CSS classes
    list.innerHTML = filteredNodes.map(nodeId => {
        const attrs = graph.getNodeAttributes(nodeId);
        const label = attrs.label || nodeId;
        const layer = getLayerById(attrs.layer);
        const connections = graph.degree(nodeId);

        return `
            <div class="hub-dropdown-item" data-node-id="${nodeId}">
                <div class="avatar" style="background: ${layer.color}">${getInitials(label)}</div>
                <span class="name">${label}</span>
            </div>
        `;
    }).join('');

    // Add click handlers
    list.querySelectorAll('.hub-dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            const hubNodeId = item.dataset.nodeId;
            connectFilteredNodesToHub(hubNodeId);
            closeHubSelectorDropdown();
        });
    });
}

// Connect all filtered nodes to selected hub
function connectFilteredNodesToHub(hubNodeId) {
    if (!state.searchFilterActive || !state.searchFilteredNodes) {
        showToast('Chưa có node nào được lọc!', 'warning');
        return;
    }

    const filteredNodes = Array.from(state.searchFilteredNodes);
    const hubLabel = graph.getNodeAttribute(hubNodeId, 'label') || hubNodeId;
    let newConnections = 0;

    filteredNodes.forEach(nodeId => {
        // Skip hub node itself
        if (nodeId === hubNodeId) return;

        // Check if edge already exists
        if (!graph.hasEdge(hubNodeId, nodeId) && !graph.hasEdge(nodeId, hubNodeId)) {
            graph.addEdge(hubNodeId, nodeId, {
                relationship: 'other',
                color: EDGE_TYPES.other.color,
                label: '',
                size: 2
            });
            newConnections++;
        }
    });

    if (newConnections > 0) {
        applyColorsByDistance(false);
        saveData();
        showToast(`Đã kết nối ${newConnections} người với "${hubLabel}"`, 'success');
    } else {
        showToast(`Tất cả đã được kết nối với "${hubLabel}"!`, 'info');
    }

    if (renderer) renderer.refresh();
}

// v5.0: Updated setupSearch for Google Maps-style UI with keyboard navigation
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    const searchResults = document.getElementById('search-results');

    if (!searchInput) return;

    // Store current search results and selected index for keyboard navigation
    let currentSearchResults = [];
    let selectedIndex = -1;

    // Helper to update visual selection
    function updateSelectedItem() {
        const items = searchResults.querySelectorAll('.search-result-item[data-node-id]');
        items.forEach((item, i) => {
            item.classList.toggle('selected', i === selectedIndex);
            if (i === selectedIndex) {
                item.scrollIntoView({ block: 'nearest' });
            }
        });
    }

    // Helper to select current item
    function selectCurrentItem() {
        const items = searchResults.querySelectorAll('.search-result-item[data-node-id]');
        if (selectedIndex >= 0 && selectedIndex < items.length) {
            const nodeId = items[selectedIndex].dataset.nodeId;
            focusOnNode(nodeId);
            openDetailPanel(nodeId);
            searchResults.classList.remove('active');
            searchInput.value = '';
            if (searchClear) searchClear.classList.add('hidden');
            selectedIndex = -1;
        }
    }

    // Keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
        const items = searchResults.querySelectorAll('.search-result-item[data-node-id]');
        const itemCount = items.length;

        if (!searchResults.classList.contains('active') || itemCount === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, itemCount - 1);
                updateSelectedItem();
                break;
            case 'ArrowUp':
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, 0);
                updateSelectedItem();
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) {
                    selectCurrentItem();
                } else if (currentSearchResults.length > 0) {
                    // If no selection, apply filter
                    const nodeIds = currentSearchResults.map(r => r.nodeId);
                    applySearchFilter(nodeIds);
                    searchResults.classList.remove('active');
                }
                break;
            case 'Escape':
                searchResults.classList.remove('active');
                selectedIndex = -1;
                break;
        }
    });

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        selectedIndex = -1;  // Reset selection on new search

        // Toggle clear button (v5.0: using hidden class)
        if (searchClear) {
            searchClear.classList.toggle('hidden', query.length === 0);
        }

        if (query.length < 1) {
            searchResults.classList.remove('active');
            currentSearchResults = [];
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

        currentSearchResults = results;

        // Render results with v5.0 CSS classes
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-result-item" style="justify-content:center;color:var(--text-muted);">Không tìm thấy kết quả</div>';
        } else {
            // Filter action bar at top
            const filterBar = `
                <div class="search-result-item search-action-bar" style="background: var(--primary-light); justify-content: space-between;">
                    <span style="color: var(--primary); font-weight: 500;">${results.length} kết quả</span>
                    <button class="btn btn-primary" id="apply-filter-btn" style="padding: 6px 12px; font-size: 12px;">
                        <i class="fas fa-filter"></i> Lọc
                    </button>
                </div>
            `;

            const resultItems = results.slice(0, 10).map(({ nodeId, attrs }, index) => {
                const contact = attrs.contact || {};
                const layer = getLayerById(attrs.layer);
                const detail = contact.company || contact.phone || layer.name;
                return `
                    <div class="search-result-item" data-node-id="${nodeId}" data-index="${index}">
                        <div class="avatar" style="background: ${layer.color};">${getInitials(attrs.label)}</div>
                        <div class="info">
                            <div class="name">${highlightMatch(attrs.label, query)}</div>
                            <div class="meta">${detail}</div>
                        </div>
                    </div>
                `;
            }).join('');

            searchResults.innerHTML = filterBar + resultItems;

            if (results.length > 10) {
                searchResults.innerHTML += `<div class="search-result-item search-more" style="justify-content:center;color:var(--text-muted);font-size:12px;">... và ${results.length - 10} kết quả khác</div>`;
            }

            // Add filter button click handler
            const applyFilterBtn = searchResults.querySelector('#apply-filter-btn');
            if (applyFilterBtn) {
                applyFilterBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const nodeIds = currentSearchResults.map(r => r.nodeId);
                    applySearchFilter(nodeIds);
                    searchResults.classList.remove('active');
                });
            }

            // Add click and hover handlers for result items
            searchResults.querySelectorAll('.search-result-item[data-node-id]').forEach((item, i) => {
                item.addEventListener('click', () => {
                    const nodeId = item.dataset.nodeId;
                    focusOnNode(nodeId);
                    openDetailPanel(nodeId);
                    searchResults.classList.remove('active');
                    searchInput.value = '';
                    if (searchClear) searchClear.classList.add('hidden');
                });
                item.addEventListener('mouseenter', () => {
                    selectedIndex = i;
                    updateSelectedItem();
                });
            });
        }

        searchResults.classList.add('active');
    });

    if (searchClear) {
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            searchClear.classList.add('hidden');
            searchResults.classList.remove('active');
            currentSearchResults = [];
            selectedIndex = -1;
            // Also clear filter when clearing search
            if (state.searchFilterActive) {
                clearSearchFilter();
            }
        });
    }

    // v5.0: Clear filter button handler (new ID)
    const clearFilterBtn = document.getElementById('btn-clear-filter');
    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', () => {
            clearSearchFilter();
            searchInput.value = '';
            if (searchClear) searchClear.classList.add('hidden');
        });
    }

    // v5.0: Hub selector button handler (new ID)
    const connectHubBtn = document.getElementById('btn-connect-hub');
    if (connectHubBtn) {
        connectHubBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleHubSelectorDropdown();
        });
    }

    // Close results and hub dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#top-bar')) {
            searchResults.classList.remove('active');
            selectedIndex = -1;
        }
        if (!e.target.closest('#filter-indicator')) {
            closeHubSelectorDropdown();
        }
    });
}

// Helper function to highlight matched text
function highlightMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background:var(--warning);padding:0 2px;border-radius:2px;">$1</mark>');
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
    const statTags = document.getElementById('stat-tags');
    if (statTags) statTags.textContent = totalLayers;
}

// ==========================================
// PHẦN 13: DETAIL PANEL FUNCTIONS
// ==========================================

// v5.0: Updated openDetailPanel for new UI structure
function openDetailPanel(nodeId) {
    if (!graph.hasNode(nodeId)) return;

    state.detailNode = nodeId;
    const panel = document.getElementById('detail-panel');
    const attrs = graph.getNodeAttributes(nodeId);
    const contact = attrs.contact || {};
    const layer = getLayerById(attrs.layer);

    // Update header
    const avatarEl = document.getElementById('detail-avatar');
    if (avatarEl) {
        avatarEl.textContent = getInitials(attrs.label);
        avatarEl.style.background = `linear-gradient(135deg, ${layer.color} 0%, ${adjustColor(layer.color, 30)} 100%)`;
    }

    const nameEl = document.getElementById('detail-name');
    if (nameEl) nameEl.textContent = attrs.label;

    // v5.0: Update tags instead of single badge
    const tagsContainer = document.getElementById('detail-tags');
    if (tagsContainer) {
        tagsContainer.innerHTML = `<span class="detail-tag" style="background: ${layer.color}20; color: ${layer.color}">${layer.name}</span>`;
    }

    // Update stats
    const distance = attrs.distance !== undefined ? attrs.distance : '-';
    const connections = graph.degree(nodeId);
    const distanceEl = document.getElementById('detail-distance');
    const connectionsEl = document.getElementById('detail-connections');
    if (distanceEl) distanceEl.textContent = distance === 0 ? 'Trung tâm' : distance;
    if (connectionsEl) connectionsEl.textContent = connections;

    // Update contact info
    updateDetailField('detail-phone', contact.phone);
    updateDetailField('detail-email', contact.email);
    updateDetailField('detail-address', contact.address);
    updateDetailField('detail-company', contact.company);
    updateDetailField('detail-position', contact.position);

    // Update social links
    const fbField = document.getElementById('detail-facebook');
    if (fbField) {
        const fbLink = fbField.querySelector('a');
        if (fbLink) {
            if (contact.facebook) {
                fbLink.href = contact.facebook;
                fbLink.textContent = 'Facebook';
            } else {
                fbLink.textContent = '-';
                fbLink.href = '#';
            }
        }
    }
    updateDetailField('detail-social', contact.social);

    // Update notes
    const birthdayEl = document.getElementById('detail-birthday');
    if (birthdayEl) {
        const span = birthdayEl.querySelector('span');
        if (span) span.textContent = formatDate(contact.birthday);
    }

    const notesEl = document.getElementById('detail-notes');
    if (notesEl) {
        const p = notesEl.querySelector('p');
        if (p) p.textContent = contact.notes || '-';
    }

    // Update relationships
    updateRelationshipList(nodeId);

    // Show panel
    if (panel) panel.classList.remove('hidden');
}

// Helper function to adjust color brightness
function adjustColor(color, amount) {
    const clamp = (num) => Math.min(255, Math.max(0, num));
    const hex = color.replace('#', '');
    const r = clamp(parseInt(hex.substr(0, 2), 16) + amount);
    const g = clamp(parseInt(hex.substr(2, 2), 16) + amount);
    const b = clamp(parseInt(hex.substr(4, 2), 16) + amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function updateDetailField(fieldId, value) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.querySelector('span').textContent = value || '-';
    }
}

// v5.0: Updated for new CSS classes
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
        listContainer.innerHTML = '<div class="empty-state"><i class="fas fa-link"></i><p>Chưa có kết nối</p></div>';
    } else {
        // v5.0: Using new CSS class names
        listContainer.innerHTML = relationships.map(rel => `
            <div class="relationship-item" data-node-id="${rel.nodeId}">
                <div class="avatar" style="background: ${rel.color};">${getInitials(rel.name)}</div>
                <div class="info">
                    <div class="name">${rel.name}</div>
                    <div class="relation">${rel.label || 'Quan hệ'}</div>
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
    if (panel) panel.classList.add('hidden');
    state.detailNode = null;
}

// ==========================================
// PHẦN 14: ZOOM CONTROLS
// ==========================================

function setupZoomControls() {
    const addNode = document.getElementById('btn-add-node');
    const zoomIn = document.getElementById('btn-zoom-in');
    const zoomOut = document.getElementById('btn-zoom-out');
    const zoomReset = document.getElementById('btn-zoom-reset');
    const centerGraph = document.getElementById('btn-center-graph');

    // Add new node button
    if (addNode) {
        addNode.addEventListener('click', () => {
            state.parentNode = null;
            openModal(null, 'ADD');
        });
    }

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
        // Cancel connection mode on stage click
        if (connectionState.isConnecting) {
            cancelConnection();
            showToast('Đã hủy tạo kết nối', 'info');
            return;
        }

        // Click on empty canvas - just deselect/clear state (no longer opens add modal)
        if (!state.hasMoved && !state.isDragging) {
            state.selectedNode = null;
            closeDetailPanel();
        }
    });

    renderer.on('clickNode', (e) => {
        // Hide hover panel on click
        hideHoverPanel(true);

        // Handle connection mode
        if (connectionState.isConnecting) {
            completeConnection(e.node);
            return;
        }

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
ui.btnSave?.addEventListener('click', () => {
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
document.getElementById('btn-save-edge')?.addEventListener('click', () => {
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
document.getElementById('btn-delete-edge')?.addEventListener('click', () => {
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
document.getElementById('btn-add-child')?.addEventListener('click', () => {
    state.parentNode = state.selectedNode;
    openModal(null, 'ADD');
});

// Delete node
document.getElementById('btn-delete')?.addEventListener('click', () => {
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

// Close modals (v5.0: add null checks for changed IDs)
document.getElementById('btn-x-close')?.addEventListener('click', closeModal);
document.getElementById('btn-x-close-edge')?.addEventListener('click', closeEdgeModal);
document.getElementById('btn-x-close-layer')?.addEventListener('click', closeLayerModal);
document.getElementById('close-layers-panel')?.addEventListener('click', toggleLayersPanel);
document.getElementById('close-detail-panel')?.addEventListener('click', closeDetailPanel);

// Edit from detail panel (v5.0: button moved to detail-quick-actions)
document.getElementById('btn-edit-from-detail')?.addEventListener('click', () => {
    if (state.detailNode) {
        openModal(state.detailNode, 'EDIT');
    }
});
// v5.0: Quick action edit button
document.getElementById('btn-edit')?.addEventListener('click', () => {
    if (state.detailNode) {
        openModal(state.detailNode, 'EDIT');
    }
});

ui.overlay?.addEventListener('click', () => {
    closeModal();
    closeEdgeModal();
    closeLayerModal();
});

// Toolbar buttons (v5.0: add null checks - some buttons moved to sidebar)
document.getElementById('btn-export')?.addEventListener('click', openExportModal);
document.getElementById('btn-import-trigger')?.addEventListener('click', openImportModal);
document.getElementById('btn-import-vcf')?.addEventListener('click', () => document.getElementById('vcf-input')?.click());
document.getElementById('vcf-input')?.addEventListener('change', uploadVCF);
document.getElementById('file-input')?.addEventListener('change', uploadJSON);
document.getElementById('btn-capture')?.addEventListener('click', captureGraphImage);
document.getElementById('btn-force-layout')?.addEventListener('click', () => {
    if (state.forceRunning) {
        stopForceLayout();
    } else {
        openLayoutModal();
    }
});
document.getElementById('btn-recolor')?.addEventListener('click', () => applyColorsByDistance(true));

// Layout Modal handlers
document.getElementById('btn-x-close-layout')?.addEventListener('click', closeLayoutModal);
document.querySelectorAll('.layout-option').forEach(option => {
    option.addEventListener('click', () => {
        const layoutType = option.dataset.layout;
        closeLayoutModal();
        startForceLayout(layoutType);
    });
});
document.getElementById('btn-manage-layers')?.addEventListener('click', toggleLayersPanel);

// Classification Mode handlers (v4.1)
document.getElementById('btn-quick-classify')?.addEventListener('click', enterClassificationMode);
document.getElementById('btn-exit-classify')?.addEventListener('click', exitClassificationMode);
document.getElementById('close-quick-classify')?.addEventListener('click', closeQuickClassifyPanel);
document.getElementById('classify-filter')?.addEventListener('input', (e) => {
    updateQuickClassifyList(e.target.value);
});
document.getElementById('btn-bulk-assign')?.addEventListener('click', bulkAssignSelectedNodes);

// Smart Connect & Batch Connect handlers (v4.2)
document.getElementById('btn-smart-connect')?.addEventListener('click', openSmartConnectPanel);
document.getElementById('btn-batch-connect')?.addEventListener('click', openBatchConnectMode);

// Export Modal handlers (v4.0)
document.getElementById('btn-x-close-export')?.addEventListener('click', closeExportModal);
document.getElementById('btn-export-json')?.addEventListener('click', downloadJSON);
document.getElementById('btn-export-encrypted')?.addEventListener('click', downloadEncrypted);
document.getElementById('enable-encryption')?.addEventListener('change', (e) => {
    document.getElementById('export-password-fields').style.display = e.target.checked ? 'block' : 'none';
});
document.getElementById('export-password')?.addEventListener('input', (e) => {
    const strength = checkPasswordStrength(e.target.value);
    const strengthEl = document.getElementById('password-strength');
    strengthEl.className = 'password-strength ' + strength;
});

// Import Modal handlers (v4.0)
document.getElementById('btn-x-close-import')?.addEventListener('click', closeImportModal);
document.getElementById('btn-cancel-import')?.addEventListener('click', closeImportModal);
document.getElementById('btn-select-json')?.addEventListener('click', () => document.getElementById('file-input').click());
document.getElementById('btn-select-vcf')?.addEventListener('click', () => document.getElementById('vcf-input').click());
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchImportTab(btn.dataset.tab));
});

// VCF Modal handlers (v4.0)
document.getElementById('btn-x-close-vcf')?.addEventListener('click', closeVCFModal);
document.getElementById('btn-cancel-vcf')?.addEventListener('click', closeVCFModal);
document.getElementById('btn-import-vcf-confirm')?.addEventListener('click', importSelectedVCF);
document.getElementById('vcf-select-all')?.addEventListener('click', selectAllVCF);
document.getElementById('vcf-deselect-all')?.addEventListener('click', deselectAllVCF);
document.getElementById('vcf-search')?.addEventListener('input', (e) => {
    renderVCFContacts(e.target.value);
});

// Merge Modal handlers (v4.0)
document.getElementById('btn-x-close-merge')?.addEventListener('click', closeMergeModal);
document.getElementById('btn-cancel-merge')?.addEventListener('click', closeMergeModal);
document.getElementById('btn-confirm-merge')?.addEventListener('click', confirmMerge);

// Encrypted file handlers (v4.0)
document.getElementById('btn-select-encrypted')?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.sgraph';
    input.onchange = uploadEncrypted;
    input.click();
});
document.getElementById('btn-decrypt')?.addEventListener('click', decryptAndImport);

// Layer management (v5.0: add null checks)
document.getElementById('btn-add-layer')?.addEventListener('click', addLayer);
document.getElementById('btn-save-layer')?.addEventListener('click', saveLayer);
document.getElementById('btn-delete-layer')?.addEventListener('click', deleteLayer);

// Reset data
document.getElementById('btn-reset-data')?.addEventListener('click', () => {
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

    document.getElementById('reset-confirm').addEventListener('click', async () => {
        // Clear localStorage
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('social_graph_v2_data');

        // Clear IndexedDB
        if (state.db) {
            state.db.close();
        }
        try {
            await new Promise((resolve, reject) => {
                const deleteReq = indexedDB.deleteDatabase(INDEXEDDB_NAME);
                deleteReq.onsuccess = resolve;
                deleteReq.onerror = reject;
            });
        } catch (e) {
            console.warn('Could not delete IndexedDB:', e);
        }

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

// Initialize storage and load data
async function initApp() {
    // Try to initialize IndexedDB
    await initIndexedDB();

    // Load data
    const loaded = await loadData();
    if (!loaded) {
        initDefaultData();
    }
}

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

        // Hide nodes not in search filter (when filter is active)
        if (state.searchFilterActive && state.searchFilteredNodes) {
            if (!state.searchFilteredNodes.has(node)) {
                res.hidden = true;
                return res;
            }
        }

        if (state.hoveredNode === node || data.highlighted) {
            res.highlighted = true;
            res.zIndex = 1;
        }
        return res;
    },
    edgeReducer: (edge, data) => {
        const res = { ...data };
        const source = graph.source(edge);
        const target = graph.target(edge);

        // Hide edges not connected to filtered nodes (when filter is active)
        if (state.searchFilterActive && state.searchFilteredNodes) {
            const sourceVisible = state.searchFilteredNodes.has(source);
            const targetVisible = state.searchFilteredNodes.has(target);
            if (!sourceVisible || !targetVisible) {
                res.hidden = true;
                return res;
            }
        }

        // Ensure edges always have minimum size
        if (!res.size || res.size < 1.5) {
            res.size = 1.5;
        }
        // When hovering a node, highlight connected edges
        if (state.hoveredNode) {
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

// ==========================================
// PHẦN v5.0: NEW UI HANDLERS
// ==========================================

function setupV5UI() {
    // Menu toggle (sidebar)
    const menuToggle = document.getElementById('menu-toggle');
    const leftSidebar = document.getElementById('left-sidebar');
    const sidebarClose = document.getElementById('sidebar-close');

    if (menuToggle && leftSidebar) {
        menuToggle.addEventListener('click', () => {
            leftSidebar.classList.toggle('collapsed');
        });
    }

    if (sidebarClose && leftSidebar) {
        sidebarClose.addEventListener('click', () => {
            leftSidebar.classList.add('collapsed');
        });
    }

    // Detail panel close
    const detailClose = document.getElementById('detail-close');
    if (detailClose) {
        detailClose.addEventListener('click', () => {
            closeDetailPanel();
        });
    }

    // FAB - Add new person
    const fabAdd = document.getElementById('fab-add');
    if (fabAdd) {
        fabAdd.addEventListener('click', () => {
            openModal(null, 'ADD');
        });
    }

    // Map controls
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnCenter = document.getElementById('btn-center');
    const btnFit = document.getElementById('btn-fit');

    if (btnZoomIn && renderer) {
        btnZoomIn.addEventListener('click', () => {
            const camera = renderer.getCamera();
            camera.animatedZoom({ duration: 200 });
        });
    }

    if (btnZoomOut && renderer) {
        btnZoomOut.addEventListener('click', () => {
            const camera = renderer.getCamera();
            camera.animatedUnzoom({ duration: 200 });
        });
    }

    if (btnCenter && renderer) {
        btnCenter.addEventListener('click', () => {
            const camera = renderer.getCamera();
            // Try to focus on TÔI node (center)
            if (graph.hasNode('me')) {
                const attrs = graph.getNodeAttributes('me');
                camera.animate({ x: attrs.x, y: attrs.y, ratio: 1 }, { duration: 300 });
            } else {
                camera.animate({ x: 0, y: 0, ratio: 1 }, { duration: 300 });
            }
        });
    }

    if (btnFit && renderer) {
        btnFit.addEventListener('click', () => {
            const camera = renderer.getCamera();
            camera.animatedReset({ duration: 300 });
        });
    }

    // Sidebar action buttons
    const btnImport = document.getElementById('btn-import');
    const btnExport = document.getElementById('btn-export');
    const btnLayout = document.getElementById('btn-layout');
    const btnSettings = document.getElementById('btn-settings');

    if (btnImport) {
        btnImport.addEventListener('click', () => {
            // Trigger import modal
            const importModal = document.getElementById('import-modal');
            if (importModal) {
                importModal.classList.remove('hidden');
                document.getElementById('overlay')?.classList.remove('hidden');
            }
        });
    }

    if (btnExport) {
        btnExport.addEventListener('click', () => {
            // Trigger export
            exportJSON();
        });
    }

    if (btnLayout) {
        btnLayout.addEventListener('click', () => {
            // Apply radial layout
            applyRadialLayout();
            showToast('Đang sắp xếp lại bản đồ...', 'info');
        });
    }

    // Add tag button
    const btnAddTag = document.getElementById('btn-add-tag');
    if (btnAddTag) {
        btnAddTag.addEventListener('click', () => {
            const layerModal = document.getElementById('layer-modal');
            if (layerModal) {
                layerModal.classList.remove('hidden');
                document.getElementById('overlay')?.classList.remove('hidden');
            }
        });
    }

    // Theme toggle (Phase 5)
    const btnThemeToggle = document.getElementById('btn-theme-toggle');
    if (btnThemeToggle) {
        btnThemeToggle.addEventListener('click', toggleTheme);
    }

    // Initialize theme from localStorage
    initTheme();
}

// Theme functions (Phase 5)
function initTheme() {
    const savedTheme = localStorage.getItem('contactmap-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Use saved theme or system preference
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(theme);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('contactmap-theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);

    // Update graph background if renderer exists
    if (renderer) {
        const bgColor = theme === 'dark' ? '#1a1a1a' : '#f8f9fa';
        renderer.setSetting('renderEdgeLabels', true);
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    localStorage.setItem('contactmap-theme', newTheme);
    setTheme(newTheme);
    showToast(`Đã chuyển sang chế độ ${newTheme === 'dark' ? 'tối' : 'sáng'}`, 'info');
}

function updateThemeIcon(theme) {
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// Initialize application
initApp().then(() => {
    // Initialize UI after data is loaded
    renderLayerFilters();
    renderLayersList();
    renderTagList();  // v5.0: Render tags in sidebar
    updateNodeCount();
    updateStatistics();
    applyColorsByDistance(false);

    // Setup new features
    setupDragAndDrop();
    setupClickHandlers();
    setupSearch();
    setupZoomControls();
    setupCopyButtons();

    // v5.0: Setup new UI handlers
    setupV5UI();

    // Phase 4: Setup hover panel events
    setupHoverPanelEvents();

    // Welcome message
    setTimeout(() => {
        const storageType = state.useIndexedDB ? 'IndexedDB' : 'localStorage';
        showToast(`Contact Map v5.0 - Bản đồ quan hệ của bạn!`, 'info', 4000);
    }, 500);
});
