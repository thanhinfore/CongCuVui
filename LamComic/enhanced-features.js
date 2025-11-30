/**
 * Enhanced Features for LamComic
 * Các tính năng nâng cấp cho ứng dụng Sửa Truyện Tranh
 */

// ==================== STATE VARIABLES ====================
let eraseMode = 'rectangle'; // 'rectangle' hoặc 'brush'
let brushSize = 30;
let isPickingColor = false;
let isBold = false;
let isItalic = false;
let enableOutline = false;
let enableShadow = false;
let brushCursor = null;
let lastBrushX = null;
let lastBrushY = null;

// ==================== DOM REFERENCES ====================
let eraseModeButtons, brushSizeInput, brushSizeValue, brushSizeRow;
let pickColorBtn, eraseTip;
let boldBtn, italicBtn;
let enableOutlineCheckbox, enableShadowCheckbox;
let outlineSettings, shadowSettings;
let outlineColorInput, outlineWidthInput;
let shadowColorInput, shadowBlurInput, shadowOffsetXInput, shadowOffsetYInput;
let selectedTextInfo, editSelectedTextBtn, deleteSelectedTextBtn, duplicateTextBtn;

// ==================== INITIALIZATION ====================

function initEnhancedFeatures() {
    // Get DOM references
    initEnhancedDOMReferences();

    // Setup event listeners for new features
    setupEnhancedEventListeners();

    // Create brush cursor element
    createBrushCursor();

    console.log('Enhanced features initialized');
}

function initEnhancedDOMReferences() {
    // Erase mode elements
    eraseModeButtons = document.querySelectorAll('input[name="eraseMode"]');
    brushSizeInput = document.getElementById('brushSize');
    brushSizeValue = document.getElementById('brushSizeValue');
    brushSizeRow = document.getElementById('brushSizeRow');
    pickColorBtn = document.getElementById('pickColorBtn');
    eraseTip = document.getElementById('eraseTip');

    // Text format buttons
    boldBtn = document.getElementById('boldBtn');
    italicBtn = document.getElementById('italicBtn');

    // Outline settings
    enableOutlineCheckbox = document.getElementById('enableOutline');
    outlineSettings = document.getElementById('outlineSettings');
    outlineColorInput = document.getElementById('outlineColor');
    outlineWidthInput = document.getElementById('outlineWidth');

    // Shadow settings
    enableShadowCheckbox = document.getElementById('enableShadow');
    shadowSettings = document.getElementById('shadowSettings');
    shadowColorInput = document.getElementById('shadowColor');
    shadowBlurInput = document.getElementById('shadowBlur');
    shadowOffsetXInput = document.getElementById('shadowOffsetX');
    shadowOffsetYInput = document.getElementById('shadowOffsetY');

    // Selected text info
    selectedTextInfo = document.getElementById('selectedTextInfo');
    editSelectedTextBtn = document.getElementById('editSelectedTextBtn');
    deleteSelectedTextBtn = document.getElementById('deleteSelectedTextBtn');
    duplicateTextBtn = document.getElementById('duplicateTextBtn');
}

function setupEnhancedEventListeners() {
    // Erase mode toggle
    if (eraseModeButtons) {
        eraseModeButtons.forEach(btn => {
            btn.addEventListener('change', handleEraseModeChange);
        });
    }

    // Brush size slider
    if (brushSizeInput) {
        brushSizeInput.addEventListener('input', handleBrushSizeChange);
    }

    // Pick color button
    if (pickColorBtn) {
        pickColorBtn.addEventListener('click', toggleColorPicker);
    }

    // Bold/Italic buttons
    if (boldBtn) {
        boldBtn.addEventListener('click', toggleBold);
    }
    if (italicBtn) {
        italicBtn.addEventListener('click', toggleItalic);
    }

    // Outline checkbox
    if (enableOutlineCheckbox) {
        enableOutlineCheckbox.addEventListener('change', toggleOutlineSettings);
    }

    // Shadow checkbox
    if (enableShadowCheckbox) {
        enableShadowCheckbox.addEventListener('change', toggleShadowSettings);
    }

    // Selected text actions
    if (editSelectedTextBtn) {
        editSelectedTextBtn.addEventListener('click', openEditTextModal);
    }
    if (deleteSelectedTextBtn) {
        deleteSelectedTextBtn.addEventListener('click', deleteSelectedText);
    }
    if (duplicateTextBtn) {
        duplicateTextBtn.addEventListener('click', duplicateSelectedText);
    }

    // Setup number inputs for new fields
    setupEnhancedNumberInputs();
}

function setupEnhancedNumberInputs() {
    const containers = document.querySelectorAll('#outlineSettings .number-input-container, #shadowSettings .number-input-container');
    containers.forEach(container => {
        const input = container.querySelector('input[type="number"]');
        const upBtn = container.querySelector('.number-up');
        const downBtn = container.querySelector('.number-down');

        if (upBtn && input) {
            upBtn.addEventListener('click', () => {
                const max = parseInt(input.getAttribute('max')) || 100;
                input.value = Math.min(parseInt(input.value) + 1, max);
                input.dispatchEvent(new Event('change'));
            });
        }

        if (downBtn && input) {
            downBtn.addEventListener('click', () => {
                const min = parseInt(input.getAttribute('min')) || 0;
                input.value = Math.max(parseInt(input.value) - 1, min);
                input.dispatchEvent(new Event('change'));
            });
        }
    });
}

// ==================== ERASE MODE FUNCTIONS ====================

function handleEraseModeChange(e) {
    eraseMode = e.target.value;

    // Toggle brush size row visibility
    if (brushSizeRow) {
        if (eraseMode === 'brush') {
            brushSizeRow.classList.add('visible');
            if (eraseTip) eraseTip.textContent = 'Vẽ cọ để che phủ vùng chữ';
        } else {
            brushSizeRow.classList.remove('visible');
            if (eraseTip) eraseTip.textContent = 'Nhấp và kéo để che phủ vùng chữ';
        }
    }

    // Update cursor
    updateEraseCursor();
}

function handleBrushSizeChange(e) {
    brushSize = parseInt(e.target.value);
    if (brushSizeValue) {
        brushSizeValue.textContent = brushSize + 'px';
    }
    updateBrushCursorSize();
}

function createBrushCursor() {
    brushCursor = document.createElement('div');
    brushCursor.className = 'brush-cursor';
    brushCursor.style.display = 'none';
    brushCursor.style.width = brushSize + 'px';
    brushCursor.style.height = brushSize + 'px';
    document.body.appendChild(brushCursor);
}

function updateBrushCursorSize() {
    if (brushCursor) {
        brushCursor.style.width = brushSize + 'px';
        brushCursor.style.height = brushSize + 'px';
    }
}

function showBrushCursor(x, y) {
    if (brushCursor && eraseMode === 'brush' && currentMode === 'erase') {
        brushCursor.style.display = 'block';
        brushCursor.style.left = x + 'px';
        brushCursor.style.top = y + 'px';
    }
}

function hideBrushCursor() {
    if (brushCursor) {
        brushCursor.style.display = 'none';
    }
}

function updateEraseCursor() {
    if (currentMode === 'erase') {
        if (eraseMode === 'brush') {
            canvas.style.cursor = 'none';
        } else {
            canvas.style.cursor = 'crosshair';
        }
    }
}

// Brush painting function
function paintBrush(x, y) {
    if (!currentCanvasImageData && !originalImage) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw current state
    if (currentCanvasImageData) {
        tempCtx.putImageData(currentCanvasImageData, 0, 0);
    } else if (originalImage) {
        tempCtx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    }

    // Draw brush stroke
    tempCtx.fillStyle = eraseColorInput.value;
    tempCtx.beginPath();

    // If we have a last position, draw a line between points for smooth strokes
    if (lastBrushX !== null && lastBrushY !== null) {
        const dist = Math.sqrt(Math.pow(x - lastBrushX, 2) + Math.pow(y - lastBrushY, 2));
        const steps = Math.max(1, Math.floor(dist / (brushSize / 4)));

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const px = lastBrushX + (x - lastBrushX) * t;
            const py = lastBrushY + (y - lastBrushY) * t;
            tempCtx.beginPath();
            tempCtx.arc(px, py, brushSize / 2, 0, Math.PI * 2);
            tempCtx.fill();
        }
    } else {
        tempCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        tempCtx.fill();
    }

    lastBrushX = x;
    lastBrushY = y;

    // Update current state
    currentCanvasImageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);

    // Redraw
    redrawCanvas();
}

// ==================== COLOR PICKER FUNCTIONS ====================

function toggleColorPicker() {
    isPickingColor = !isPickingColor;

    if (pickColorBtn) {
        pickColorBtn.classList.toggle('active', isPickingColor);
    }

    if (isPickingColor) {
        document.body.classList.add('color-picker-mode');
        canvas.style.cursor = 'crosshair';
        showToast('Nhấp vào ảnh để lấy màu');
    } else {
        document.body.classList.remove('color-picker-mode');
        updateEraseCursor();
    }
}

function pickColorFromCanvas(x, y) {
    if (!currentCanvasImageData && !originalImage) return;

    // Get pixel data
    let imageData;
    if (currentCanvasImageData) {
        imageData = currentCanvasImageData;
    } else {
        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    const pixelIndex = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
    const r = imageData.data[pixelIndex];
    const g = imageData.data[pixelIndex + 1];
    const b = imageData.data[pixelIndex + 2];

    // Convert to hex
    const hex = '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');

    // Set erase color
    if (eraseColorInput) {
        eraseColorInput.value = hex;
    }

    // Exit pick mode
    toggleColorPicker();

    showToast(`Đã chọn màu: ${hex}`);
    redrawCanvas();
}

// ==================== TEXT FORMATTING FUNCTIONS ====================

function toggleBold() {
    isBold = !isBold;
    if (boldBtn) {
        boldBtn.classList.toggle('active', isBold);
    }
}

function toggleItalic() {
    isItalic = !isItalic;
    if (italicBtn) {
        italicBtn.classList.toggle('active', isItalic);
    }
}

function toggleOutlineSettings() {
    enableOutline = enableOutlineCheckbox?.checked || false;
    if (outlineSettings) {
        outlineSettings.classList.toggle('active', enableOutline);
    }
}

function toggleShadowSettings() {
    enableShadow = enableShadowCheckbox?.checked || false;
    if (shadowSettings) {
        shadowSettings.classList.toggle('active', enableShadow);
    }
}

function getTextStyle() {
    let fontWeight = isBold ? 'bold' : 'normal';
    let fontStyle = isItalic ? 'italic' : 'normal';
    return { fontWeight, fontStyle };
}

function getOutlineOptions() {
    if (!enableOutline) return null;
    return {
        color: outlineColorInput?.value || '#FFFFFF',
        width: parseInt(outlineWidthInput?.value) || 2
    };
}

function getShadowOptions() {
    if (!enableShadow) return null;
    return {
        color: shadowColorInput?.value || '#000000',
        blur: parseInt(shadowBlurInput?.value) || 3,
        offsetX: parseInt(shadowOffsetXInput?.value) || 2,
        offsetY: parseInt(shadowOffsetYInput?.value) || 2
    };
}

// ==================== ENHANCED TEXT DRAWING ====================

// Override the original drawTextObject function
const originalDrawTextObject = typeof drawTextObject === 'function' ? drawTextObject : null;

function drawTextObjectEnhanced(obj) {
    const style = obj.style || {};
    const outline = obj.outline;
    const shadow = obj.shadow;

    // Build font string
    let fontString = '';
    if (style.fontStyle === 'italic') fontString += 'italic ';
    if (style.fontWeight === 'bold') fontString += 'bold ';
    fontString += `${obj.size}px ${obj.font}`;

    ctx.font = fontString;
    ctx.textAlign = obj.align || 'left';
    ctx.textBaseline = 'top';

    const lineHeight = obj.size * LINE_HEIGHT_MULTIPLIER;

    obj.lines.forEach((line, index) => {
        let xPos = obj.x;

        // Adjust x position based on text alignment
        if (obj.align === 'center') {
            xPos = obj.x + obj.width / 2;
        } else if (obj.align === 'right') {
            xPos = obj.x + obj.width;
        }

        const yPos = obj.y + (index * lineHeight);

        // Apply shadow
        if (shadow) {
            ctx.shadowColor = shadow.color;
            ctx.shadowBlur = shadow.blur;
            ctx.shadowOffsetX = shadow.offsetX;
            ctx.shadowOffsetY = shadow.offsetY;
        }

        // Draw outline (stroke)
        if (outline) {
            ctx.strokeStyle = outline.color;
            ctx.lineWidth = outline.width * 2;
            ctx.lineJoin = 'round';
            ctx.miterLimit = 2;
            ctx.strokeText(line, xPos, yPos);
        }

        // Draw fill
        ctx.fillStyle = obj.color;
        ctx.fillText(line, xPos, yPos);

        // Reset shadow
        if (shadow) {
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }
    });
}

// ==================== TEXT EDITING FUNCTIONS ====================

function updateSelectedTextInfo() {
    if (selectedTextInfo) {
        if (selectedTextObject) {
            selectedTextInfo.classList.remove('hidden');
        } else {
            selectedTextInfo.classList.add('hidden');
        }
    }
}

function openEditTextModal() {
    if (!selectedTextObject) {
        showToast('Vui lòng chọn văn bản để chỉnh sửa');
        return;
    }

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'edit-modal-overlay';
    modal.innerHTML = `
        <div class="edit-modal">
            <div class="edit-modal-header">
                <h3><i class="fas fa-edit"></i> Chỉnh sửa văn bản</h3>
                <button class="edit-modal-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="edit-modal-body">
                <div class="option-row">
                    <label for="editTextContent">Nội dung:</label>
                    <textarea id="editTextContent" rows="4">${selectedTextObject.text}</textarea>
                </div>
                <div class="option-row style-options" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                    <div class="style-option">
                        <label for="editTextColor">Màu chữ:</label>
                        <input type="color" id="editTextColor" value="${selectedTextObject.color}">
                    </div>
                    <div class="style-option">
                        <label for="editFontSize">Cỡ chữ:</label>
                        <input type="number" id="editFontSize" value="${selectedTextObject.size}" min="8" max="150">
                    </div>
                </div>
            </div>
            <div class="edit-modal-footer">
                <button class="btn btn-secondary" id="cancelEditBtn">Hủy</button>
                <button class="btn btn-primary" id="saveEditBtn">Lưu thay đổi</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Focus on textarea
    setTimeout(() => {
        document.getElementById('editTextContent')?.focus();
    }, 100);

    // Event handlers
    modal.querySelector('.edit-modal-close').addEventListener('click', () => closeEditModal(modal));
    modal.querySelector('#cancelEditBtn').addEventListener('click', () => closeEditModal(modal));
    modal.querySelector('#saveEditBtn').addEventListener('click', () => saveTextEdit(modal));

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeEditModal(modal);
    });

    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeEditModal(modal);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

function closeEditModal(modal) {
    if (modal) {
        modal.remove();
    }
}

function saveTextEdit(modal) {
    if (!selectedTextObject) return;

    const newText = document.getElementById('editTextContent')?.value;
    const newColor = document.getElementById('editTextColor')?.value;
    const newSize = parseInt(document.getElementById('editFontSize')?.value);

    if (newText !== undefined) selectedTextObject.text = newText;
    if (newColor) selectedTextObject.color = newColor;
    if (newSize && !isNaN(newSize)) selectedTextObject.size = newSize;

    // Recalculate dimensions
    prepareTextObject(selectedTextObject);

    // Redraw
    redrawCanvas();
    saveCanvasState();

    closeEditModal(modal);
    showToast('Đã cập nhật văn bản');
}

function deleteSelectedText() {
    if (!selectedTextObject) {
        showToast('Vui lòng chọn văn bản để xóa');
        return;
    }

    textObjects = textObjects.filter(obj => obj !== selectedTextObject);
    selectedTextObject = null;
    updateSelectedTextInfo();
    redrawCanvas();
    saveCanvasState();
    showToast('Đã xóa văn bản');
}

function duplicateSelectedText() {
    if (!selectedTextObject) {
        showToast('Vui lòng chọn văn bản để nhân đôi');
        return;
    }

    const newObj = JSON.parse(JSON.stringify(selectedTextObject));
    newObj.id = Date.now();
    newObj.x += 20; // Offset position
    newObj.y += 20;

    textObjects.push(newObj);
    selectedTextObject = newObj;

    updateSelectedTextInfo();
    redrawCanvas();
    saveCanvasState();
    showToast('Đã nhân đôi văn bản');
}

// ==================== OVERRIDE ORIGINAL FUNCTIONS ====================

// Store original functions
const _originalHandleInteractionStart = typeof handleInteractionStart === 'function' ? handleInteractionStart : null;
const _originalHandleInteractionMove = typeof handleInteractionMove === 'function' ? handleInteractionMove : null;
const _originalHandleInteractionEnd = typeof handleInteractionEnd === 'function' ? handleInteractionEnd : null;
const _originalRedrawCanvas = typeof redrawCanvas === 'function' ? redrawCanvas : null;
const _originalPrepareTextObject = typeof prepareTextObject === 'function' ? prepareTextObject : null;

// Enhanced interaction start
function handleInteractionStartEnhanced(event) {
    if (event.type === 'touchstart') {
        event.preventDefault();
    }

    const pos = getEventPosition(event);
    if (!pos) return;

    // Handle color picking
    if (isPickingColor) {
        pickColorFromCanvas(pos.x, pos.y);
        return;
    }

    startX = pos.x;
    startY = pos.y;

    // Check if clicking on text object
    let foundObject = null;
    for (let i = textObjects.length - 1; i >= 0; i--) {
        if (isPointInTextObject(startX, startY, textObjects[i])) {
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
        updateSelectedTextInfo();
        redrawCanvas();
        return;
    }

    // Handle based on current mode
    if (currentMode === 'text') {
        const text = textContentInput.value;
        if (!text || !text.trim()) {
            showToast("Vui lòng nhập nội dung chữ!");
            return;
        }

        const style = getTextStyle();
        const outline = getOutlineOptions();
        const shadow = getShadowOptions();

        const newTextObject = {
            id: Date.now(),
            text: text,
            x: startX,
            y: startY,
            color: textColorInput.value,
            size: parseInt(fontSizeInput.value) || 24,
            font: fontFamilyInput.value,
            align: getTextAlign(),
            style: style,
            outline: outline,
            shadow: shadow,
            lines: [],
            width: 0,
            height: 0
        };

        prepareTextObjectEnhanced(newTextObject);
        textObjects.push(newTextObject);
        selectedTextObject = newTextObject;

        updateSelectedTextInfo();
        redrawCanvas();
        saveCanvasState();

    } else if (currentMode === 'erase') {
        isDrawing = true;
        lastBrushX = null;
        lastBrushY = null;

        // If brush mode, start painting immediately
        if (eraseMode === 'brush') {
            paintBrush(startX, startY);
        }
    } else if (currentMode === 'select') {
        selectedTextObject = null;
        updateSelectedTextInfo();
        redrawCanvas();
    }
}

// Enhanced interaction move
function handleInteractionMoveEnhanced(event) {
    if (event.type === 'touchmove') {
        event.preventDefault();
    }

    const pos = getEventPosition(event);
    if (!pos) return;

    const currentX = pos.x;
    const currentY = pos.y;

    // Update brush cursor position
    if (eraseMode === 'brush' && currentMode === 'erase') {
        const rect = canvas.getBoundingClientRect();
        showBrushCursor(event.clientX || (event.touches && event.touches[0]?.clientX),
                        event.clientY || (event.touches && event.touches[0]?.clientY));
    }

    // If dragging text
    if (isDraggingText && selectedTextObject) {
        selectedTextObject.x = currentX - dragOffsetX;
        selectedTextObject.y = currentY - dragOffsetY;
        redrawCanvas();
        return;
    }

    // Handle erase modes
    if (currentMode === 'erase' && isDrawing) {
        if (eraseMode === 'brush') {
            paintBrush(currentX, currentY);
        } else {
            // Rectangle preview
            drawErasePreview(
                Math.min(startX, currentX),
                Math.min(startY, currentY),
                Math.abs(currentX - startX),
                Math.abs(currentY - startY)
            );
        }
    } else if (!isDraggingText) {
        // Update cursor when hovering text
        let hoveringText = false;
        for (let i = textObjects.length - 1; i >= 0; i--) {
            if (isPointInTextObject(currentX, currentY, textObjects[i])) {
                hoveringText = true;
                break;
            }
        }

        if (hoveringText) {
            canvas.style.cursor = 'move';
        } else if (currentMode === 'erase') {
            updateEraseCursor();
        } else {
            canvas.style.cursor = currentMode === 'text' ? 'text' : 'default';
        }
    }
}

// Enhanced interaction end
function handleInteractionEndEnhanced(event) {
    if (event.type === 'touchend') {
        event.preventDefault();
    }

    // Hide brush cursor
    hideBrushCursor();

    let pos = null;
    if (event.changedTouches && event.changedTouches.length > 0) {
        pos = getEventPosition(event.changedTouches[0]);
    } else {
        pos = getEventPosition(event);
    }

    // If dragging text
    if (isDraggingText) {
        isDraggingText = false;
        if (selectedTextObject) {
            saveCanvasState();
            redrawCanvas();
        }
        canvas.style.cursor = currentMode === 'erase' ? (eraseMode === 'brush' ? 'none' : 'crosshair') :
            currentMode === 'text' ? 'text' : 'default';
        return;
    }

    // Handle erase mode
    if (currentMode === 'erase' && isDrawing) {
        isDrawing = false;
        lastBrushX = null;
        lastBrushY = null;

        if (eraseMode === 'brush') {
            // Brush mode - state already saved during painting
            saveCanvasState();
        } else if (pos) {
            // Rectangle mode
            const endX = pos.x;
            const endY = pos.y;

            if (Math.abs(endX - startX) > 3 && Math.abs(endY - startY) > 3) {
                applyErase(
                    Math.min(startX, endX),
                    Math.min(startY, endY),
                    Math.abs(endX - startX),
                    Math.abs(endY - startY)
                );
                saveCanvasState();
            } else {
                redrawCanvas();
            }
        }
    }
}

// Enhanced prepare text object
function prepareTextObjectEnhanced(obj) {
    // Build font string with style
    const style = obj.style || {};
    let fontString = '';
    if (style.fontStyle === 'italic') fontString += 'italic ';
    if (style.fontWeight === 'bold') fontString += 'bold ';
    fontString += `${obj.size}px ${obj.font}`;

    ctx.font = fontString;
    obj.lines = obj.text.split('\n');

    const lineHeight = obj.size * LINE_HEIGHT_MULTIPLIER;

    // Calculate maximum width
    obj.width = 0;
    obj.lines.forEach(line => {
        const lineWidth = ctx.measureText(line).width;
        if (lineWidth > obj.width) {
            obj.width = lineWidth;
        }
    });

    // Add padding for outline
    if (obj.outline) {
        obj.width += obj.outline.width * 2;
    }

    // Calculate total height
    obj.height = obj.lines.length * lineHeight;

    if (obj.lines.length > 0) {
        obj.height -= (lineHeight - obj.size);
    }
}

// Enhanced redraw canvas
function redrawCanvasEnhanced() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentCanvasImageData) {
        ctx.putImageData(currentCanvasImageData, 0, 0);
    } else if (originalImage) {
        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    } else {
        if (textObjects.length === 0) {
            drawInitialMessage();
            return;
        }
    }

    // Draw all text objects with enhanced rendering
    textObjects.forEach(obj => {
        drawTextObjectEnhanced(obj);
        if (obj === selectedTextObject) {
            drawSelectionBorder(obj);
        }
    });
}

// ==================== APPLY OVERRIDES ====================

function applyEnhancedOverrides() {
    // Replace original functions with enhanced versions
    if (typeof handleInteractionStart !== 'undefined') {
        // Store and replace
        window.handleInteractionStart = handleInteractionStartEnhanced;
    }

    if (typeof handleInteractionMove !== 'undefined') {
        window.handleInteractionMove = handleInteractionMoveEnhanced;
    }

    if (typeof handleInteractionEnd !== 'undefined') {
        window.handleInteractionEnd = handleInteractionEndEnhanced;
    }

    if (typeof redrawCanvas !== 'undefined') {
        window.redrawCanvas = redrawCanvasEnhanced;
    }

    if (typeof prepareTextObject !== 'undefined') {
        window.prepareTextObject = prepareTextObjectEnhanced;
    }

    if (typeof drawTextObject !== 'undefined') {
        window.drawTextObject = drawTextObjectEnhanced;
    }

    // Re-setup canvas event listeners with enhanced handlers
    if (canvas) {
        canvas.removeEventListener('mousedown', _originalHandleInteractionStart);
        canvas.removeEventListener('mousemove', _originalHandleInteractionMove);
        canvas.removeEventListener('mouseup', _originalHandleInteractionEnd);
        canvas.removeEventListener('touchstart', _originalHandleInteractionStart);
        canvas.removeEventListener('touchmove', _originalHandleInteractionMove);
        canvas.removeEventListener('touchend', _originalHandleInteractionEnd);

        canvas.addEventListener('mousedown', handleInteractionStartEnhanced);
        canvas.addEventListener('mousemove', handleInteractionMoveEnhanced);
        canvas.addEventListener('mouseup', handleInteractionEndEnhanced);
        canvas.addEventListener('touchstart', handleInteractionStartEnhanced, { passive: false });
        canvas.addEventListener('touchmove', handleInteractionMoveEnhanced, { passive: false });
        canvas.addEventListener('touchend', handleInteractionEndEnhanced, { passive: false });

        // Hide brush cursor when leaving canvas
        canvas.addEventListener('mouseleave', () => {
            hideBrushCursor();
            if (isDrawing && currentMode === 'erase') {
                isDrawing = false;
                lastBrushX = null;
                lastBrushY = null;
                redrawCanvasEnhanced();
            }
        });
    }
}

// ==================== INITIALIZATION ON LOAD ====================

document.addEventListener('DOMContentLoaded', function() {
    // Wait for main app to initialize
    setTimeout(() => {
        initEnhancedFeatures();
        applyEnhancedOverrides();
    }, 100);
});

// Also hook into window load for safety
window.addEventListener('load', function() {
    setTimeout(() => {
        if (!brushCursor) {
            initEnhancedFeatures();
            applyEnhancedOverrides();
        }
    }, 200);
});
