/**
 * Drag & Drop và Cải thiện Workflow Thêm Chữ
 * Các tính năng nâng cao UX cho LamComic
 */

// ==================== DRAG & DROP IMAGE ====================

/**
 * Khởi tạo Drag & Drop cho upload ảnh
 */
function initDragDropUpload() {
    const uploadArea = document.querySelector('.upload-area');
    const canvasContainer = document.querySelector('.canvas-container');
    const canvasPanel = document.querySelector('.canvas-panel');

    // Tạo drop overlay
    createDropOverlay();

    // Thêm drag & drop cho upload area
    if (uploadArea) {
        setupDropZone(uploadArea);
    }

    // Thêm drag & drop cho canvas panel (khi chưa có ảnh)
    if (canvasPanel) {
        setupDropZone(canvasPanel);
    }

    // Thêm drag & drop cho toàn bộ document
    setupGlobalDragDrop();

    console.log('Drag & Drop initialized');
}

/**
 * Tạo overlay hiển thị khi kéo file vào
 */
function createDropOverlay() {
    if (document.getElementById('dropOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'dropOverlay';
    overlay.className = 'drop-overlay';
    overlay.innerHTML = `
        <div class="drop-content">
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Thả ảnh vào đây</p>
            <span>Hỗ trợ: JPG, PNG, GIF, WebP</span>
        </div>
    `;
    document.body.appendChild(overlay);
}

/**
 * Setup drop zone cho một element
 */
function setupDropZone(element) {
    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('dragenter', handleDragEnter);
    element.addEventListener('dragleave', handleDragLeave);
    element.addEventListener('drop', handleDrop);
}

/**
 * Setup global drag & drop
 */
function setupGlobalDragDrop() {
    let dragCounter = 0;

    document.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dragCounter++;
        if (isImageDrag(e)) {
            showDropOverlay();
        }
    });

    document.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter === 0) {
            hideDropOverlay();
        }
    });

    document.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    document.addEventListener('drop', (e) => {
        e.preventDefault();
        dragCounter = 0;
        hideDropOverlay();

        if (isImageDrag(e)) {
            handleImageDrop(e);
        }
    });
}

/**
 * Kiểm tra có phải kéo ảnh không
 */
function isImageDrag(e) {
    if (e.dataTransfer.types) {
        for (let type of e.dataTransfer.types) {
            if (type === 'Files') {
                return true;
            }
        }
    }
    return false;
}

/**
 * Xử lý khi drag over
 */
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
}

/**
 * Xử lý khi drag enter
 */
function handleDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.add('drag-over');
}

/**
 * Xử lý khi drag leave
 */
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('drag-over');
}

/**
 * Xử lý khi drop
 */
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('drag-over');
    hideDropOverlay();

    handleImageDrop(e);
}

/**
 * Xử lý khi drop ảnh
 */
function handleImageDrop(e) {
    const files = e.dataTransfer.files;

    if (files.length > 0) {
        const file = files[0];

        // Kiểm tra có phải file ảnh không
        if (!file.type.startsWith('image/')) {
            showToast('Vui lòng chọn file ảnh (JPG, PNG, GIF, WebP)');
            return;
        }

        // Load ảnh
        loadImageFromFile(file);
    }
}

/**
 * Load ảnh từ file
 */
function loadImageFromFile(file) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) loadingIndicator.classList.remove('hidden');

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            // Reset state
            history = [];
            redoStack = [];
            textObjects = [];
            selectedTextObject = null;
            currentCanvasImageData = null;

            // Ẩn overlay
            if (typeof hideInitialOverlay === 'function') {
                hideInitialOverlay();
            }

            // Set original image
            originalImage = img;

            // Resize canvas
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            // Draw image
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            currentCanvasImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Adjust display
            if (typeof adjustCanvasDisplay === 'function') {
                adjustCanvasDisplay();
            }

            // Save state
            if (typeof saveCanvasState === 'function') {
                saveCanvasState();
            }

            // Enable tools
            if (typeof enableAllTools === 'function') {
                enableAllTools();
            }

            // Hide loading
            if (loadingIndicator) loadingIndicator.classList.add('hidden');

            // Show success message
            showToast('Ảnh đã được tải lên thành công!');

            // Hide mobile helper
            const mobileHelper = document.getElementById('mobileHelper');
            if (mobileHelper) mobileHelper.style.display = 'none';
        };

        img.onerror = () => {
            if (loadingIndicator) loadingIndicator.classList.add('hidden');
            showToast('Không thể tải ảnh. Định dạng không được hỗ trợ.');
        };

        img.src = e.target.result;
    };

    reader.onerror = () => {
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        showToast('Có lỗi xảy ra khi đọc file.');
    };

    reader.readAsDataURL(file);
}

/**
 * Hiển thị drop overlay
 */
function showDropOverlay() {
    const overlay = document.getElementById('dropOverlay');
    if (overlay) {
        overlay.classList.add('visible');
    }
}

/**
 * Ẩn drop overlay
 */
function hideDropOverlay() {
    const overlay = document.getElementById('dropOverlay');
    if (overlay) {
        overlay.classList.remove('visible');
    }
}

// ==================== INLINE TEXT INPUT ====================

let inlineTextInput = null;
let pendingTextPosition = null;

/**
 * Tạo inline text input element
 */
function createInlineTextInput() {
    if (inlineTextInput) return;

    inlineTextInput = document.createElement('div');
    inlineTextInput.id = 'inlineTextInput';
    inlineTextInput.className = 'inline-text-input';
    inlineTextInput.innerHTML = `
        <div class="inline-text-header">
            <span>Nhập văn bản</span>
            <button class="inline-close" title="Đóng"><i class="fas fa-times"></i></button>
        </div>
        <textarea id="inlineTextArea" placeholder="Nhập văn bản tại đây..." rows="3"></textarea>
        <div class="inline-text-actions">
            <button class="btn btn-secondary inline-cancel">Hủy</button>
            <button class="btn btn-primary inline-confirm">Thêm</button>
        </div>
    `;

    document.body.appendChild(inlineTextInput);

    // Event listeners
    inlineTextInput.querySelector('.inline-close').addEventListener('click', hideInlineTextInput);
    inlineTextInput.querySelector('.inline-cancel').addEventListener('click', hideInlineTextInput);
    inlineTextInput.querySelector('.inline-confirm').addEventListener('click', confirmInlineText);

    // Enter key để confirm (Shift+Enter để xuống dòng)
    inlineTextInput.querySelector('#inlineTextArea').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            confirmInlineText();
        }
        if (e.key === 'Escape') {
            hideInlineTextInput();
        }
    });
}

/**
 * Hiển thị inline text input tại vị trí click
 */
function showInlineTextInput(x, y, screenX, screenY) {
    if (!inlineTextInput) {
        createInlineTextInput();
    }

    pendingTextPosition = { x, y };

    // Tính vị trí hiển thị
    const inputWidth = 280;
    const inputHeight = 150;

    let left = screenX - inputWidth / 2;
    let top = screenY - inputHeight - 20;

    // Đảm bảo không ra ngoài màn hình
    left = Math.max(10, Math.min(left, window.innerWidth - inputWidth - 10));
    top = Math.max(10, top);

    // Nếu không đủ chỗ phía trên, hiển thị phía dưới
    if (top < 10) {
        top = screenY + 20;
    }

    inlineTextInput.style.left = left + 'px';
    inlineTextInput.style.top = top + 'px';
    inlineTextInput.classList.add('visible');

    // Focus và clear text area
    const textArea = inlineTextInput.querySelector('#inlineTextArea');
    textArea.value = '';
    setTimeout(() => textArea.focus(), 50);
}

/**
 * Ẩn inline text input
 */
function hideInlineTextInput() {
    if (inlineTextInput) {
        inlineTextInput.classList.remove('visible');
        pendingTextPosition = null;
    }
}

/**
 * Xác nhận thêm text từ inline input
 */
function confirmInlineText() {
    const textArea = inlineTextInput.querySelector('#inlineTextArea');
    const text = textArea.value.trim();

    if (!text) {
        showToast('Vui lòng nhập nội dung văn bản');
        return;
    }

    if (!pendingTextPosition) {
        hideInlineTextInput();
        return;
    }

    // Tạo text object
    const style = typeof getTextStyle === 'function' ? getTextStyle() : {};
    const outline = typeof getOutlineOptions === 'function' ? getOutlineOptions() : null;
    const shadow = typeof getShadowOptions === 'function' ? getShadowOptions() : null;

    const newTextObject = {
        id: Date.now(),
        text: text,
        x: pendingTextPosition.x,
        y: pendingTextPosition.y,
        color: document.getElementById('textColor')?.value || '#000000',
        size: parseInt(document.getElementById('fontSize')?.value) || 24,
        font: document.getElementById('fontFamily')?.value || 'Inter, sans-serif',
        align: typeof getTextAlign === 'function' ? getTextAlign() : 'left',
        style: style,
        outline: outline,
        shadow: shadow,
        lines: [],
        width: 0,
        height: 0
    };

    // Chuẩn bị text object
    if (typeof prepareTextObjectEnhanced === 'function') {
        prepareTextObjectEnhanced(newTextObject);
    } else if (typeof prepareTextObject === 'function') {
        prepareTextObject(newTextObject);
    }

    // Thêm vào danh sách
    textObjects.push(newTextObject);
    selectedTextObject = newTextObject;

    // Cập nhật UI
    if (typeof updateSelectedTextInfo === 'function') {
        updateSelectedTextInfo();
    }

    // Redraw
    if (typeof redrawCanvasEnhanced === 'function') {
        redrawCanvasEnhanced();
    } else if (typeof redrawCanvas === 'function') {
        redrawCanvas();
    }

    // Save state
    if (typeof saveCanvasState === 'function') {
        saveCanvasState();
    }

    // Cập nhật text content input nếu có
    const mainTextInput = document.getElementById('textContent');
    if (mainTextInput) {
        mainTextInput.value = text;
    }

    hideInlineTextInput();
    showToast('Đã thêm văn bản');
}

// ==================== ENHANCED TEXT MODE ====================

/**
 * Override text mode click để hiển thị inline input
 */
function setupEnhancedTextMode() {
    // Lưu handler gốc
    const originalHandler = window.handleInteractionStartEnhanced || window.handleInteractionStart;

    window.handleInteractionStartEnhanced = function(event) {
        if (event.type === 'touchstart') {
            event.preventDefault();
        }

        const pos = typeof getEventPosition === 'function' ? getEventPosition(event) : null;
        if (!pos) return;

        // Nếu đang ở chế độ pick color
        if (typeof isPickingColor !== 'undefined' && isPickingColor) {
            if (typeof pickColorFromCanvas === 'function') {
                pickColorFromCanvas(pos.x, pos.y);
            }
            return;
        }

        // Kiểm tra double-click
        if (typeof checkDoubleClick === 'function' && currentMode !== 'erase') {
            if (checkDoubleClick(pos.x, pos.y, event.target)) {
                return;
            }
        }

        startX = pos.x;
        startY = pos.y;

        // Kiểm tra click vào text object
        let foundObject = null;
        for (let i = textObjects.length - 1; i >= 0; i--) {
            if (typeof isPointInTextObject === 'function' && isPointInTextObject(startX, startY, textObjects[i])) {
                foundObject = textObjects[i];
                break;
            }
        }

        if (foundObject) {
            selectedTextObject = foundObject;
            isDraggingText = true;
            dragOffsetX = startX - selectedTextObject.x;
            dragOffsetY = startY - selectedTextObject.y;
            canvas.style.cursor = 'move';

            if (typeof updateSelectedTextInfo === 'function') {
                updateSelectedTextInfo();
            }
            if (typeof showQuickToolbar === 'function') {
                setTimeout(() => showQuickToolbar(selectedTextObject), 100);
            }

            if (typeof redrawCanvasEnhanced === 'function') {
                redrawCanvasEnhanced();
            } else if (typeof redrawCanvas === 'function') {
                redrawCanvas();
            }
            return;
        }

        // Xử lý theo mode
        if (currentMode === 'text') {
            // Lấy vị trí màn hình
            const rect = canvas.getBoundingClientRect();
            const scaleX = rect.width / canvas.width;
            const scaleY = rect.height / canvas.height;
            const screenX = rect.left + pos.x * scaleX;
            const screenY = rect.top + pos.y * scaleY;

            // Kiểm tra xem có text trong input chính không
            const mainTextInput = document.getElementById('textContent');
            const hasTextInInput = mainTextInput && mainTextInput.value.trim();

            if (hasTextInInput) {
                // Nếu có text sẵn, thêm ngay
                addTextAtPosition(pos.x, pos.y, mainTextInput.value.trim());
            } else {
                // Nếu chưa có, hiển thị inline input
                showInlineTextInput(pos.x, pos.y, screenX, screenY);
            }
            return;

        } else if (currentMode === 'erase') {
            isDrawing = true;
            if (typeof eraseMode !== 'undefined' && eraseMode === 'brush') {
                lastBrushX = null;
                lastBrushY = null;
                if (typeof paintBrush === 'function') {
                    paintBrush(startX, startY);
                }
            }

        } else if (currentMode === 'select') {
            selectedTextObject = null;
            if (typeof updateSelectedTextInfo === 'function') {
                updateSelectedTextInfo();
            }
            if (typeof hideQuickToolbar === 'function') {
                hideQuickToolbar();
            }
            if (typeof redrawCanvasEnhanced === 'function') {
                redrawCanvasEnhanced();
            } else if (typeof redrawCanvas === 'function') {
                redrawCanvas();
            }
        }
    };
}

/**
 * Thêm text tại vị trí chỉ định
 */
function addTextAtPosition(x, y, text) {
    const style = typeof getTextStyle === 'function' ? getTextStyle() : {};
    const outline = typeof getOutlineOptions === 'function' ? getOutlineOptions() : null;
    const shadow = typeof getShadowOptions === 'function' ? getShadowOptions() : null;

    const newTextObject = {
        id: Date.now(),
        text: text,
        x: x,
        y: y,
        color: document.getElementById('textColor')?.value || '#000000',
        size: parseInt(document.getElementById('fontSize')?.value) || 24,
        font: document.getElementById('fontFamily')?.value || 'Inter, sans-serif',
        align: typeof getTextAlign === 'function' ? getTextAlign() : 'left',
        style: style,
        outline: outline,
        shadow: shadow,
        lines: [],
        width: 0,
        height: 0
    };

    if (typeof prepareTextObjectEnhanced === 'function') {
        prepareTextObjectEnhanced(newTextObject);
    } else if (typeof prepareTextObject === 'function') {
        prepareTextObject(newTextObject);
    }

    textObjects.push(newTextObject);
    selectedTextObject = newTextObject;

    if (typeof updateSelectedTextInfo === 'function') {
        updateSelectedTextInfo();
    }

    if (typeof redrawCanvasEnhanced === 'function') {
        redrawCanvasEnhanced();
    } else if (typeof redrawCanvas === 'function') {
        redrawCanvas();
    }

    if (typeof saveCanvasState === 'function') {
        saveCanvasState();
    }

    showToast('Đã thêm văn bản');
}

// ==================== QUICK TEXT PRESETS ====================

/**
 * Tạo các preset văn bản phổ biến
 */
function createTextPresets() {
    const textOptions = document.getElementById('textOptions');
    if (!textOptions) return;

    // Kiểm tra đã có chưa
    if (textOptions.querySelector('.text-presets')) return;

    const presetsDiv = document.createElement('div');
    presetsDiv.className = 'text-presets';
    presetsDiv.innerHTML = `
        <label>Mẫu nhanh:</label>
        <div class="preset-buttons">
            <button type="button" class="preset-btn" data-preset="sfx">SFX</button>
            <button type="button" class="preset-btn" data-preset="dialog">Thoại</button>
            <button type="button" class="preset-btn" data-preset="thought">Suy nghĩ</button>
            <button type="button" class="preset-btn" data-preset="narrator">Người kể</button>
        </div>
    `;

    // Chèn sau textarea
    const textareaRow = textOptions.querySelector('.option-row');
    if (textareaRow && textareaRow.nextSibling) {
        textareaRow.parentNode.insertBefore(presetsDiv, textareaRow.nextSibling);
    } else {
        textOptions.appendChild(presetsDiv);
    }

    // Event listeners
    presetsDiv.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => applyTextPreset(btn.dataset.preset));
    });
}

/**
 * Áp dụng preset văn bản
 */
function applyTextPreset(preset) {
    const fontSizeInput = document.getElementById('fontSize');
    const fontFamilyInput = document.getElementById('fontFamily');
    const textColorInput = document.getElementById('textColor');
    const boldBtn = document.getElementById('boldBtn');
    const italicBtn = document.getElementById('italicBtn');
    const enableOutlineCheckbox = document.getElementById('enableOutline');
    const outlineColorInput = document.getElementById('outlineColor');
    const outlineWidthInput = document.getElementById('outlineWidth');

    // Reset
    if (boldBtn) boldBtn.classList.remove('active');
    if (italicBtn) italicBtn.classList.remove('active');
    if (typeof isBold !== 'undefined') isBold = false;
    if (typeof isItalic !== 'undefined') isItalic = false;

    switch (preset) {
        case 'sfx': // Sound effects - to, đậm, có viền
            if (fontSizeInput) fontSizeInput.value = '48';
            if (fontFamilyInput) fontFamilyInput.value = 'Impact, fantasy';
            if (textColorInput) textColorInput.value = '#FF0000';
            if (boldBtn) {
                boldBtn.classList.add('active');
                if (typeof isBold !== 'undefined') isBold = true;
            }
            if (enableOutlineCheckbox) {
                enableOutlineCheckbox.checked = true;
                enableOutlineCheckbox.dispatchEvent(new Event('change'));
            }
            if (outlineColorInput) outlineColorInput.value = '#FFFFFF';
            if (outlineWidthInput) outlineWidthInput.value = '3';
            break;

        case 'dialog': // Thoại thông thường
            if (fontSizeInput) fontSizeInput.value = '20';
            if (fontFamilyInput) fontFamilyInput.value = 'Arial, sans-serif';
            if (textColorInput) textColorInput.value = '#000000';
            if (enableOutlineCheckbox) {
                enableOutlineCheckbox.checked = false;
                enableOutlineCheckbox.dispatchEvent(new Event('change'));
            }
            break;

        case 'thought': // Suy nghĩ - nghiêng
            if (fontSizeInput) fontSizeInput.value = '18';
            if (fontFamilyInput) fontFamilyInput.value = 'Georgia, serif';
            if (textColorInput) textColorInput.value = '#555555';
            if (italicBtn) {
                italicBtn.classList.add('active');
                if (typeof isItalic !== 'undefined') isItalic = true;
            }
            if (enableOutlineCheckbox) {
                enableOutlineCheckbox.checked = false;
                enableOutlineCheckbox.dispatchEvent(new Event('change'));
            }
            break;

        case 'narrator': // Người kể chuyện
            if (fontSizeInput) fontSizeInput.value = '16';
            if (fontFamilyInput) fontFamilyInput.value = 'Times New Roman, serif';
            if (textColorInput) textColorInput.value = '#333333';
            if (italicBtn) {
                italicBtn.classList.add('active');
                if (typeof isItalic !== 'undefined') isItalic = true;
            }
            if (enableOutlineCheckbox) {
                enableOutlineCheckbox.checked = false;
                enableOutlineCheckbox.dispatchEvent(new Event('change'));
            }
            break;
    }

    // Cập nhật live preview
    if (typeof updateLivePreview === 'function') {
        updateLivePreview();
    }

    showToast(`Đã áp dụng mẫu: ${preset.toUpperCase()}`);
}

// ==================== INITIALIZATION ====================

function initDragDropAndTextEnhancements() {
    console.log('Initializing Drag & Drop and Text enhancements...');

    // Drag & Drop
    initDragDropUpload();

    // Inline text input
    createInlineTextInput();

    // Text presets
    createTextPresets();

    // Enhanced text mode
    setupEnhancedTextMode();

    console.log('Drag & Drop and Text enhancements initialized');
}

// ==================== HELP BUTTON & GUIDE ====================

/**
 * Tạo nút trợ giúp và hướng dẫn sử dụng
 */
function createHelpButton() {
    // Kiểm tra đã có chưa
    if (document.getElementById('helpButton')) return;

    // Tạo nút Help
    const helpBtn = document.createElement('button');
    helpBtn.id = 'helpButton';
    helpBtn.className = 'help-btn';
    helpBtn.title = 'Hướng dẫn sử dụng (?)';
    helpBtn.innerHTML = '<i class="fas fa-question"></i>';

    // Thêm vào header actions
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
        headerActions.insertBefore(helpBtn, headerActions.firstChild);
    }

    // Event listener
    helpBtn.addEventListener('click', showHelpModal);

    // Thêm CSS cho nút
    addHelpStyles();
}

/**
 * Thêm CSS cho help (enhanced version)
 */
function addHelpStyles() {
    if (document.getElementById('helpStyles')) return;

    const style = document.createElement('style');
    style.id = 'helpStyles';
    style.textContent = `
        .help-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(17, 24, 39, 0.7);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
            animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .help-modal {
            background: white;
            border-radius: 24px;
            max-width: 560px;
            width: 100%;
            max-height: 85vh;
            overflow: hidden;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
            animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px) scale(0.98);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .help-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 24px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
        }

        .help-modal-header h2 {
            margin: 0;
            font-size: 1.2rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
            color: white;
        }

        .help-modal-header h2 i {
            font-size: 1.1rem;
        }

        .help-modal-header .help-close {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            cursor: pointer;
            transition: all 0.2s ease;
            border: none;
        }

        .help-modal-header .help-close:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.05);
        }

        .help-modal-body {
            padding: 24px;
            overflow-y: auto;
            max-height: calc(85vh - 70px);
        }

        .help-section {
            margin-bottom: 20px;
            padding: 16px;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 14px;
            border: 1px solid #e2e8f0;
        }

        .help-section:last-child {
            margin-bottom: 0;
        }

        .help-section h3 {
            font-size: 0.95rem;
            font-weight: 700;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin: 0 0 14px 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .help-section h3 i {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .help-section ul {
            margin: 0;
            padding-left: 0;
            list-style: none;
        }

        .help-section li {
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            align-items: flex-start;
            gap: 10px;
            font-size: 0.9rem;
            color: #475569;
            line-height: 1.5;
        }

        .help-section li:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }

        .help-section li i {
            color: #22c55e;
            margin-top: 4px;
            font-size: 0.75rem;
        }

        .help-section li strong {
            color: #1e293b;
            font-weight: 600;
        }

        .help-kbd {
            display: inline-block;
            padding: 3px 8px;
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-family: 'SF Mono', Monaco, 'Courier New', monospace;
            font-size: 0.8rem;
            font-weight: 600;
            color: #374151;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        @media (max-width: 768px) {
            .help-modal {
                max-height: 90vh;
                border-radius: 20px;
            }

            .help-modal-header {
                padding: 16px 20px;
            }

            .help-modal-body {
                padding: 16px;
                max-height: calc(90vh - 60px);
            }

            .help-section {
                padding: 14px;
                margin-bottom: 14px;
            }

            .help-section li {
                font-size: 0.85rem;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Hiển thị modal hướng dẫn
 */
function showHelpModal() {
    // Xóa modal cũ nếu có
    const existingModal = document.querySelector('.help-modal-overlay');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'help-modal-overlay';
    modal.innerHTML = `
        <div class="help-modal">
            <div class="help-modal-header">
                <h2><i class="fas fa-book-open"></i> Hướng dẫn sử dụng</h2>
                <button class="inline-close help-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="help-modal-body">
                <div class="help-section">
                    <h3><i class="fas fa-image"></i> Bước 1: Tải ảnh</h3>
                    <ul>
                        <li><i class="fas fa-check"></i> <span>Nhấp vào "Tải ảnh lên" hoặc <strong>kéo thả ảnh</strong> vào trang</span></li>
                        <li><i class="fas fa-check"></i> <span>Hỗ trợ: JPG, PNG, GIF, WebP</span></li>
                    </ul>
                </div>

                <div class="help-section">
                    <h3><i class="fas fa-eraser"></i> Bước 2: Che chữ gốc</h3>
                    <ul>
                        <li><i class="fas fa-check"></i> <span>Chọn công cụ <strong>"Che chữ"</strong> (phím <span class="help-kbd">1</span>)</span></li>
                        <li><i class="fas fa-check"></i> <span><strong>Vùng chọn:</strong> Kéo để tạo vùng chữ nhật</span></li>
                        <li><i class="fas fa-check"></i> <span><strong>Cọ vẽ:</strong> Vẽ tự do để che vùng bất kỳ</span></li>
                        <li><i class="fas fa-check"></i> <span>Nhấn <strong>"Lấy màu"</strong> rồi click vào ảnh để chọn màu che phù hợp</span></li>
                    </ul>
                </div>

                <div class="help-section">
                    <h3><i class="fas fa-font"></i> Bước 3: Thêm chữ mới</h3>
                    <ul>
                        <li><i class="fas fa-check"></i> <span>Chọn công cụ <strong>"Thêm chữ"</strong> (phím <span class="help-kbd">2</span>)</span></li>
                        <li><i class="fas fa-check"></i> <span>Nhấp vào vị trí muốn thêm chữ → Nhập nội dung</span></li>
                        <li><i class="fas fa-check"></i> <span>Sử dụng <strong>Mẫu nhanh</strong> để tạo style nhanh (SFX, Thoại, Suy nghĩ...)</span></li>
                        <li><i class="fas fa-check"></i> <span>Tùy chỉnh: màu chữ, font, cỡ chữ, viền, đổ bóng...</span></li>
                    </ul>
                </div>

                <div class="help-section">
                    <h3><i class="fas fa-arrows-alt"></i> Bước 4: Di chuyển & Chỉnh sửa</h3>
                    <ul>
                        <li><i class="fas fa-check"></i> <span>Chọn công cụ <strong>"Di chuyển"</strong> (phím <span class="help-kbd">3</span>)</span></li>
                        <li><i class="fas fa-check"></i> <span>Nhấp vào chữ để chọn, kéo để di chuyển</span></li>
                        <li><i class="fas fa-check"></i> <span><strong>Double-click</strong> vào chữ để sửa nội dung</span></li>
                        <li><i class="fas fa-check"></i> <span>Nhấn <span class="help-kbd">Delete</span> để xóa chữ đã chọn</span></li>
                    </ul>
                </div>

                <div class="help-section">
                    <h3><i class="fas fa-keyboard"></i> Phím tắt</h3>
                    <ul>
                        <li><i class="fas fa-check"></i> <span><span class="help-kbd">1</span> <span class="help-kbd">2</span> <span class="help-kbd">3</span> Chuyển công cụ</span></li>
                        <li><i class="fas fa-check"></i> <span><span class="help-kbd">Ctrl+Z</span> Hoàn tác | <span class="help-kbd">Ctrl+Y</span> Làm lại</span></li>
                        <li><i class="fas fa-check"></i> <span><span class="help-kbd">Ctrl+D</span> Nhân đôi chữ | <span class="help-kbd">Enter</span> Sửa chữ</span></li>
                        <li><i class="fas fa-check"></i> <span><span class="help-kbd">+</span> <span class="help-kbd">-</span> <span class="help-kbd">0</span> Zoom ảnh</span></li>
                        <li><i class="fas fa-check"></i> <span><span class="help-kbd">[</span> <span class="help-kbd">]</span> Thay đổi kích thước cọ</span></li>
                    </ul>
                </div>

                <div class="help-section">
                    <h3><i class="fas fa-save"></i> Bước 5: Lưu ảnh</h3>
                    <ul>
                        <li><i class="fas fa-check"></i> <span>Nhấn nút <strong>"Lưu"</strong> để tải ảnh đã chỉnh sửa về máy</span></li>
                    </ul>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    modal.querySelector('.help-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    // Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// ==================== INITIALIZATION ====================

function initDragDropAndTextEnhancements() {
    console.log('Initializing Drag & Drop and Text enhancements...');

    // Drag & Drop
    initDragDropUpload();

    // Inline text input
    createInlineTextInput();

    // Text presets
    createTextPresets();

    // Enhanced text mode
    setupEnhancedTextMode();

    // Help button
    createHelpButton();

    console.log('Drag & Drop and Text enhancements initialized');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initDragDropAndTextEnhancements, 400);
});

// Fallback
window.addEventListener('load', () => {
    setTimeout(() => {
        if (!document.getElementById('dropOverlay')) {
            initDragDropAndTextEnhancements();
        }
    }, 600);
});
