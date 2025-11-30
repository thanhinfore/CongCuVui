/**
 * UX Enhancements for LamComic
 * Các tính năng nâng cao trải nghiệm người dùng
 */

// ==================== LIVE TEXT PREVIEW ====================

let livePreviewEnabled = true;
let previewTextObject = null;
let lastPreviewPosition = null;

/**
 * Khởi tạo Live Preview cho text
 */
function initLiveTextPreview() {
    const textContentInput = document.getElementById('textContent');
    if (!textContentInput) return;

    // Lắng nghe sự kiện input để cập nhật preview
    textContentInput.addEventListener('input', updateLivePreview);

    // Lắng nghe các thay đổi style
    const textColorInput = document.getElementById('textColor');
    const fontSizeInput = document.getElementById('fontSize');
    const fontFamilyInput = document.getElementById('fontFamily');
    const boldBtn = document.getElementById('boldBtn');
    const italicBtn = document.getElementById('italicBtn');

    [textColorInput, fontSizeInput, fontFamilyInput].forEach(input => {
        if (input) {
            input.addEventListener('change', updateLivePreview);
            input.addEventListener('input', updateLivePreview);
        }
    });

    [boldBtn, italicBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => setTimeout(updateLivePreview, 50));
        }
    });

    // Align buttons
    document.querySelectorAll('input[name="textAlign"]').forEach(btn => {
        btn.addEventListener('change', updateLivePreview);
    });

    console.log('Live text preview initialized');
}

/**
 * Cập nhật Live Preview
 */
function updateLivePreview() {
    if (!livePreviewEnabled || currentMode !== 'text') return;

    const text = document.getElementById('textContent')?.value;
    if (!text || !text.trim()) {
        clearLivePreview();
        return;
    }

    // Tạo preview object
    previewTextObject = {
        text: text,
        x: lastPreviewPosition?.x || canvas.width / 2,
        y: lastPreviewPosition?.y || canvas.height / 2,
        color: document.getElementById('textColor')?.value || '#000000',
        size: parseInt(document.getElementById('fontSize')?.value) || 24,
        font: document.getElementById('fontFamily')?.value || 'Inter, sans-serif',
        align: getTextAlign(),
        style: typeof getTextStyle === 'function' ? getTextStyle() : {},
        outline: typeof getOutlineOptions === 'function' ? getOutlineOptions() : null,
        shadow: typeof getShadowOptions === 'function' ? getShadowOptions() : null,
        lines: [],
        width: 0,
        height: 0,
        isPreview: true
    };

    // Tính toán kích thước
    if (typeof prepareTextObjectEnhanced === 'function') {
        prepareTextObjectEnhanced(previewTextObject);
    } else if (typeof prepareTextObject === 'function') {
        prepareTextObject(previewTextObject);
    }

    // Redraw với preview
    redrawWithPreview();
}

/**
 * Vẽ canvas với preview text
 */
function redrawWithPreview() {
    // Vẽ lại canvas bình thường
    if (typeof redrawCanvasEnhanced === 'function') {
        redrawCanvasEnhanced();
    } else if (typeof redrawCanvas === 'function') {
        redrawCanvas();
    }

    // Vẽ preview text với độ trong suốt
    if (previewTextObject && previewTextObject.text) {
        ctx.globalAlpha = 0.5;
        if (typeof drawTextObjectEnhanced === 'function') {
            drawTextObjectEnhanced(previewTextObject);
        } else if (typeof drawTextObject === 'function') {
            drawTextObject(previewTextObject);
        }
        ctx.globalAlpha = 1.0;

        // Vẽ border preview
        ctx.strokeStyle = '#4361ee';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
            previewTextObject.x - 2,
            previewTextObject.y - 2,
            previewTextObject.width + 4,
            previewTextObject.height + 4
        );
        ctx.setLineDash([]);
    }
}

/**
 * Xóa Live Preview
 */
function clearLivePreview() {
    previewTextObject = null;
    if (typeof redrawCanvasEnhanced === 'function') {
        redrawCanvasEnhanced();
    } else if (typeof redrawCanvas === 'function') {
        redrawCanvas();
    }
}

/**
 * Cập nhật vị trí preview khi di chuyển chuột
 */
function updatePreviewPosition(x, y) {
    lastPreviewPosition = { x, y };
    if (previewTextObject) {
        previewTextObject.x = x;
        previewTextObject.y = y;
        redrawWithPreview();
    }
}

// ==================== QUICK TOOLBAR ====================

let quickToolbar = null;

/**
 * Tạo Quick Toolbar floating
 */
function createQuickToolbar() {
    if (quickToolbar) return;

    quickToolbar = document.createElement('div');
    quickToolbar.id = 'quickToolbar';
    quickToolbar.className = 'quick-toolbar';
    quickToolbar.innerHTML = `
        <button class="quick-btn" data-action="edit" title="Sửa (Enter)">
            <i class="fas fa-edit"></i>
        </button>
        <button class="quick-btn" data-action="duplicate" title="Nhân đôi (Ctrl+D)">
            <i class="fas fa-copy"></i>
        </button>
        <button class="quick-btn quick-btn-danger" data-action="delete" title="Xóa (Delete)">
            <i class="fas fa-trash"></i>
        </button>
    `;

    document.body.appendChild(quickToolbar);

    // Event listeners
    quickToolbar.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', handleQuickToolbarAction);
    });

    console.log('Quick toolbar created');
}

/**
 * Xử lý action từ Quick Toolbar
 */
function handleQuickToolbarAction(e) {
    const action = e.currentTarget.dataset.action;

    switch (action) {
        case 'edit':
            if (typeof openEditTextModal === 'function') {
                openEditTextModal();
            }
            break;
        case 'duplicate':
            if (typeof duplicateSelectedText === 'function') {
                duplicateSelectedText();
            }
            break;
        case 'delete':
            if (typeof deleteSelectedText === 'function') {
                deleteSelectedText();
            }
            break;
    }

    hideQuickToolbar();
}

/**
 * Hiển thị Quick Toolbar tại vị trí text object
 */
function showQuickToolbar(textObj) {
    if (!quickToolbar || !textObj) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;

    // Tính vị trí hiển thị
    const objCenterX = textObj.x + textObj.width / 2;
    const objTop = textObj.y;

    const screenX = rect.left + objCenterX * scaleX;
    const screenY = rect.top + objTop * scaleY - 50; // 50px phía trên text

    // Đảm bảo toolbar không ra ngoài màn hình
    const toolbarWidth = 120;
    const finalX = Math.max(10, Math.min(screenX - toolbarWidth / 2, window.innerWidth - toolbarWidth - 10));
    const finalY = Math.max(10, screenY);

    quickToolbar.style.left = finalX + 'px';
    quickToolbar.style.top = finalY + 'px';
    quickToolbar.classList.add('visible');
}

/**
 * Ẩn Quick Toolbar
 */
function hideQuickToolbar() {
    if (quickToolbar) {
        quickToolbar.classList.remove('visible');
    }
}

// ==================== DOUBLE-CLICK TO EDIT ====================

let lastClickTime = 0;
let lastClickTarget = null;

/**
 * Xử lý double-click để edit text
 */
function handleDoubleClick(x, y) {
    // Tìm text object tại vị trí click
    for (let i = textObjects.length - 1; i >= 0; i--) {
        if (typeof isPointInTextObject === 'function' && isPointInTextObject(x, y, textObjects[i])) {
            selectedTextObject = textObjects[i];
            if (typeof openEditTextModal === 'function') {
                openEditTextModal();
            }
            return true;
        }
    }
    return false;
}

/**
 * Kiểm tra và xử lý double-click
 */
function checkDoubleClick(x, y, target) {
    const now = Date.now();
    const timeDiff = now - lastClickTime;

    if (timeDiff < 300 && lastClickTarget === target) {
        // Double click detected
        lastClickTime = 0;
        lastClickTarget = null;
        return handleDoubleClick(x, y);
    }

    lastClickTime = now;
    lastClickTarget = target;
    return false;
}

// ==================== ZOOM FUNCTIONALITY ====================

let zoomLevel = 1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

/**
 * Tạo Zoom Controls
 */
function createZoomControls() {
    const existingControls = document.getElementById('zoomControls');
    if (existingControls) return;

    const zoomControls = document.createElement('div');
    zoomControls.id = 'zoomControls';
    zoomControls.className = 'zoom-controls';
    zoomControls.innerHTML = `
        <button class="zoom-btn" data-action="zoom-out" title="Thu nhỏ (-)">
            <i class="fas fa-minus"></i>
        </button>
        <span class="zoom-level" id="zoomLevelDisplay">100%</span>
        <button class="zoom-btn" data-action="zoom-in" title="Phóng to (+)">
            <i class="fas fa-plus"></i>
        </button>
        <button class="zoom-btn" data-action="zoom-reset" title="Reset (0)">
            <i class="fas fa-compress-arrows-alt"></i>
        </button>
    `;

    const canvasContainer = document.querySelector('.canvas-container');
    if (canvasContainer) {
        canvasContainer.appendChild(zoomControls);
    }

    // Event listeners
    zoomControls.querySelectorAll('.zoom-btn').forEach(btn => {
        btn.addEventListener('click', handleZoomAction);
    });

    // Mouse wheel zoom
    if (canvasContainer) {
        canvasContainer.addEventListener('wheel', handleWheelZoom, { passive: false });
    }

    console.log('Zoom controls created');
}

/**
 * Xử lý Zoom action
 */
function handleZoomAction(e) {
    const action = e.currentTarget.dataset.action;

    switch (action) {
        case 'zoom-in':
            setZoom(zoomLevel + ZOOM_STEP);
            break;
        case 'zoom-out':
            setZoom(zoomLevel - ZOOM_STEP);
            break;
        case 'zoom-reset':
            setZoom(1);
            break;
    }
}

/**
 * Xử lý zoom bằng mouse wheel
 */
function handleWheelZoom(e) {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        setZoom(zoomLevel + delta);
    }
}

/**
 * Set zoom level
 */
function setZoom(level) {
    zoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, level));

    // Update display
    const display = document.getElementById('zoomLevelDisplay');
    if (display) {
        display.textContent = Math.round(zoomLevel * 100) + '%';
    }

    // Apply zoom to canvas
    applyZoom();
}

/**
 * Apply zoom to canvas
 */
function applyZoom() {
    if (!canvas) return;

    const canvasContainer = document.querySelector('.canvas-container');
    if (!canvasContainer) return;

    // Lấy kích thước gốc
    const containerWidth = canvasContainer.clientWidth;
    const containerHeight = canvasContainer.clientHeight;
    const canvasRatio = canvas.width / canvas.height;

    // Tính kích thước hiển thị cơ bản
    let baseWidth, baseHeight;
    if (containerWidth / canvasRatio <= containerHeight) {
        baseWidth = containerWidth - 20;
        baseHeight = baseWidth / canvasRatio;
    } else {
        baseHeight = containerHeight - 20;
        baseWidth = baseHeight * canvasRatio;
    }

    // Apply zoom
    const displayWidth = baseWidth * zoomLevel;
    const displayHeight = baseHeight * zoomLevel;

    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';

    // Update scale factor
    if (typeof canvasScaleFactor !== 'undefined') {
        canvasScaleFactor = canvas.width / displayWidth;
    }
}

// ==================== KEYBOARD SHORTCUTS ====================

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    console.log('Keyboard shortcuts initialized');
}

/**
 * Xử lý keyboard shortcuts
 */
function handleKeyboardShortcuts(e) {
    // Bỏ qua nếu đang focus vào input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
    }

    // Ctrl+D: Duplicate
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (selectedTextObject && typeof duplicateSelectedText === 'function') {
            duplicateSelectedText();
        }
        return;
    }

    // Enter: Edit selected text
    if (e.key === 'Enter' && selectedTextObject) {
        e.preventDefault();
        if (typeof openEditTextModal === 'function') {
            openEditTextModal();
        }
        return;
    }

    // Escape: Deselect / Cancel
    if (e.key === 'Escape') {
        if (selectedTextObject) {
            selectedTextObject = null;
            hideQuickToolbar();
            if (typeof updateSelectedTextInfo === 'function') {
                updateSelectedTextInfo();
            }
            if (typeof redrawCanvas === 'function') {
                redrawCanvas();
            }
        }
        clearLivePreview();
        return;
    }

    // +/-: Zoom
    if (e.key === '+' || e.key === '=') {
        setZoom(zoomLevel + ZOOM_STEP);
        return;
    }
    if (e.key === '-') {
        setZoom(zoomLevel - ZOOM_STEP);
        return;
    }
    if (e.key === '0') {
        setZoom(1);
        return;
    }

    // [/]: Brush size
    if (currentMode === 'erase' && typeof eraseMode !== 'undefined' && eraseMode === 'brush') {
        if (e.key === '[') {
            const newSize = Math.max(5, (typeof brushSize !== 'undefined' ? brushSize : 30) - 5);
            const brushSizeInput = document.getElementById('brushSize');
            if (brushSizeInput) {
                brushSizeInput.value = newSize;
                brushSizeInput.dispatchEvent(new Event('input'));
            }
            return;
        }
        if (e.key === ']') {
            const newSize = Math.min(100, (typeof brushSize !== 'undefined' ? brushSize : 30) + 5);
            const brushSizeInput = document.getElementById('brushSize');
            if (brushSizeInput) {
                brushSizeInput.value = newSize;
                brushSizeInput.dispatchEvent(new Event('input'));
            }
            return;
        }
    }

    // Tool shortcuts: 1, 2, 3
    if (e.key === '1') {
        document.getElementById('eraseModeButton')?.click();
        return;
    }
    if (e.key === '2') {
        document.getElementById('textModeButton')?.click();
        return;
    }
    if (e.key === '3') {
        document.getElementById('selectModeButton')?.click();
        return;
    }
}

// ==================== ENHANCED FEEDBACK ====================

/**
 * Hiển thị feedback animation khi thực hiện action
 */
function showActionFeedback(action, x, y) {
    const feedback = document.createElement('div');
    feedback.className = 'action-feedback';

    let icon = '';
    switch (action) {
        case 'add':
            icon = '<i class="fas fa-plus"></i>';
            break;
        case 'delete':
            icon = '<i class="fas fa-trash"></i>';
            break;
        case 'duplicate':
            icon = '<i class="fas fa-copy"></i>';
            break;
        case 'edit':
            icon = '<i class="fas fa-edit"></i>';
            break;
        case 'pick':
            icon = '<i class="fas fa-eye-dropper"></i>';
            break;
    }

    feedback.innerHTML = icon;
    feedback.style.left = x + 'px';
    feedback.style.top = y + 'px';

    document.body.appendChild(feedback);

    // Animate and remove
    setTimeout(() => {
        feedback.classList.add('fade-out');
        setTimeout(() => feedback.remove(), 300);
    }, 500);
}

// ==================== TOOLTIPS WITH SHORTCUTS ====================

/**
 * Cập nhật tooltips với keyboard shortcuts
 */
function updateTooltipsWithShortcuts() {
    const tooltips = {
        'eraseModeButton': 'Che chữ (1)',
        'textModeButton': 'Thêm chữ (2)',
        'selectModeButton': 'Di chuyển (3)',
        'undoButton': 'Hoàn tác (Ctrl+Z)',
        'redoButton': 'Làm lại (Ctrl+Y)',
        'saveButton': 'Lưu ảnh',
        'resetButton': 'Làm mới',
        'editSelectedTextBtn': 'Sửa (Enter)',
        'duplicateTextBtn': 'Nhân đôi (Ctrl+D)',
        'deleteSelectedTextBtn': 'Xóa (Delete)'
    };

    Object.entries(tooltips).forEach(([id, tooltip]) => {
        const el = document.getElementById(id);
        if (el) {
            el.setAttribute('title', tooltip);
        }
    });
}

// ==================== INITIALIZATION ====================

/**
 * Hook vào các hàm gốc để thêm UX enhancements
 */
function hookIntoOriginalFunctions() {
    // Hook vào handleInteractionStart để check double-click
    const originalInteractionStart = window.handleInteractionStartEnhanced || window.handleInteractionStart;
    if (originalInteractionStart) {
        window.handleInteractionStartEnhanced = function(event) {
            const pos = typeof getEventPosition === 'function' ? getEventPosition(event) : null;

            if (pos && currentMode !== 'erase') {
                // Check double-click
                if (checkDoubleClick(pos.x, pos.y, event.target)) {
                    return; // Double-click handled
                }
            }

            // Call original
            originalInteractionStart.call(this, event);

            // Update preview position for text mode
            if (pos && currentMode === 'text') {
                updatePreviewPosition(pos.x, pos.y);
            }

            // Show quick toolbar if text selected
            if (selectedTextObject) {
                setTimeout(() => showQuickToolbar(selectedTextObject), 100);
            } else {
                hideQuickToolbar();
            }
        };
    }

    // Hook vào handleInteractionMove để update preview
    const originalInteractionMove = window.handleInteractionMoveEnhanced || window.handleInteractionMove;
    if (originalInteractionMove) {
        window.handleInteractionMoveEnhanced = function(event) {
            originalInteractionMove.call(this, event);

            const pos = typeof getEventPosition === 'function' ? getEventPosition(event) : null;
            if (pos && currentMode === 'text' && !isDraggingText) {
                updatePreviewPosition(pos.x, pos.y);
            }
        };
    }

    // Hook vào mode change để clear preview
    const originalEraseModeClick = window.handleEraseModeClick;
    if (originalEraseModeClick) {
        window.handleEraseModeClick = function() {
            clearLivePreview();
            hideQuickToolbar();
            originalEraseModeClick.call(this);
        };
    }

    const originalSelectModeClick = window.handleSelectModeClick;
    if (originalSelectModeClick) {
        window.handleSelectModeClick = function() {
            clearLivePreview();
            originalSelectModeClick.call(this);
        };
    }
}

/**
 * Khởi tạo tất cả UX enhancements
 */
function initUXEnhancements() {
    console.log('Initializing UX enhancements...');

    // Create UI elements
    createQuickToolbar();
    createZoomControls();

    // Initialize features
    initLiveTextPreview();
    setupKeyboardShortcuts();
    updateTooltipsWithShortcuts();

    // Hook into original functions
    hookIntoOriginalFunctions();

    console.log('UX enhancements initialized successfully');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initUXEnhancements, 300);
});

// Fallback initialization
window.addEventListener('load', function() {
    setTimeout(() => {
        if (!quickToolbar) {
            initUXEnhancements();
        }
    }, 500);
});
