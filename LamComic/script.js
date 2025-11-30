// script.js - ComicTune Editor (Chức năng nâng cao)

// DOM Elements
const imageLoader = document.getElementById('imageLoader');
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');

const eraseModeButton = document.getElementById('eraseModeButton');
const textModeButton = document.getElementById('textModeButton');
const selectModeButton = document.getElementById('selectModeButton');
const undoButton = document.getElementById('undoButton');
const saveButton = document.getElementById('saveButton');
const resetButton = document.getElementById('resetButton');

const eraseOptions = document.getElementById('eraseOptions');
const textOptions = document.getElementById('textOptions');
const selectOptions = document.getElementById('selectOptions');

const eraseColorInput = document.getElementById('eraseColor');
const textContentInput = document.getElementById('textContent');
const textColorInput = document.getElementById('textColor');
const fontSizeInput = document.getElementById('fontSize');
const fontFamilyInput = document.getElementById('fontFamily');
const textAlignButtons = document.querySelectorAll('input[name="textAlign"]');

const loadingIndicator = document.getElementById('loadingIndicator');
const statusMessage = document.getElementById('statusMessage');
const toastNotification = document.getElementById('toastNotification');

// State variables
let currentMode = null; // 'erase', 'text', 'select'
let originalImage = null;
let currentCanvasImageData = null; // Store the current canvas image data (for fast drawing during erase)
let isDrawing = false;
let isDraggingText = false;
let startX, startY;
let history = [];
let redoStack = [];
const MAX_HISTORY_STATES = 20;

let textObjects = []; // [{id, text, x, y, color, size, font, align, lines: [], width, height}]
let selectedTextObject = null;
let dragOffsetX, dragOffsetY;

const LINE_HEIGHT_MULTIPLIER = 1.2;

// --- Utility Functions ---
function showToast(message) {
    toastNotification.textContent = message;
    toastNotification.classList.add('show');
    setTimeout(() => {
        toastNotification.classList.remove('show');
    }, 3000);
}

function showStatusMessage(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message';

    if (type === 'success') {
        statusMessage.classList.add('status-success');
    } else if (type === 'error') {
        statusMessage.classList.add('status-error');
    } else {
        statusMessage.classList.add('status-info');
    }

    statusMessage.classList.remove('hidden');
}

function hideStatusMessage() {
    statusMessage.classList.add('hidden');
}

// Get current text alignment from radio buttons
function getTextAlign() {
    let align = 'left'; // default
    textAlignButtons.forEach(button => {
        if (button.checked) {
            align = button.value;
        }
    });
    return align;
}

// --- Canvas & Text Object Functions ---
function redrawCanvas() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw current image data
    if (currentCanvasImageData) {
        ctx.putImageData(currentCanvasImageData, 0, 0);
    } else if (originalImage) {
        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    } else {
        // Show initial message if no image and no text
        if (textObjects.length === 0) {
            drawInitialMessage();
            return;
        }
    }

    // Draw all text objects
    textObjects.forEach(obj => {
        drawTextObject(obj);
        if (obj === selectedTextObject) {
            drawSelectionBorder(obj);
        }
    });
}

// Draw preview during erase operation
function drawErasePreview(x, y, width, height) {
    // Restore the current canvas state (without preview)
    if (currentCanvasImageData) {
        ctx.putImageData(currentCanvasImageData, 0, 0);
    } else if (originalImage) {
        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    }

    // Draw the erase preview rectangle
    ctx.fillStyle = eraseColorInput.value;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(x, y, width, height);
    ctx.globalAlpha = 1.0;

    // Draw text objects
    textObjects.forEach(obj => {
        drawTextObject(obj);
        if (obj === selectedTextObject) {
            drawSelectionBorder(obj);
        }
    });
}

function drawTextObject(obj) {
    ctx.fillStyle = obj.color;
    ctx.font = `${obj.size}px ${obj.font}`;
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

        ctx.fillText(line, xPos, obj.y + (index * lineHeight));
    });
}

function prepareTextObject(obj) {
    ctx.font = `${obj.size}px ${obj.font}`;
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

    // Calculate total height
    obj.height = obj.lines.length * lineHeight;

    // Small adjustment for cleaner look
    if (obj.lines.length > 0) {
        obj.height -= (lineHeight - obj.size);
    }
}

function drawSelectionBorder(obj) {
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);

    const padding = 4;
    ctx.strokeRect(
        obj.x - padding,
        obj.y - padding,
        obj.width + padding * 2,
        obj.height + padding * 2
    );

    ctx.setLineDash([]);
}

function isPointInTextObject(px, py, obj) {
    return px >= obj.x && px <= obj.x + obj.width &&
        py >= obj.y && py <= obj.y + obj.height;
}

function drawInitialMessage() {
    const message = "Tải ảnh lên hoặc thêm chữ để bắt đầu";

    ctx.font = "16px 'Inter', sans-serif";
    ctx.fillStyle = "#6b7280";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

// Apply erase action (final, not preview)
function applyErase(x, y, width, height) {
    // Hide text objects temporarily
    const tempTextObjects = [...textObjects];
    textObjects = [];

    // Redraw canvas without text objects to capture current background
    redrawCanvas();

    // Apply erase rectangle
    ctx.fillStyle = eraseColorInput.value;
    ctx.fillRect(x, y, width, height);

    // Store the updated canvas image data
    currentCanvasImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Restore text objects
    textObjects = tempTextObjects;

    // Redraw everything
    redrawCanvas();
}

// --- History Management ---
function saveCanvasState() {
    if (history.length >= MAX_HISTORY_STATES) {
        history.shift();
    }

    // Temporarily remove text objects to capture background
    const tempTextObjects = [...textObjects];
    const tempSelectedTextObject = selectedTextObject;
    textObjects = [];
    selectedTextObject = null;

    // Redraw to get clean background
    redrawCanvas();

    // Capture current canvas state
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Restore text objects
    textObjects = tempTextObjects;
    selectedTextObject = tempSelectedTextObject;
    redrawCanvas();

    // Save state
    const state = {
        imageData: imageData,
        textObjects: JSON.parse(JSON.stringify(textObjects))
    };

    history.push(state);
    // Clear redo stack when new action is performed
    redoStack = [];

    updateUndoRedoButtonState();
}

function undo() {
    if (history.length > 1) {
        // Remove current state and add to redo stack
        const currentState = history.pop();
        redoStack.push(currentState);

        // Get previous state
        const prevState = history[history.length - 1];

        // Restore text objects
        textObjects = JSON.parse(JSON.stringify(prevState.textObjects));

        // Restore image data
        currentCanvasImageData = prevState.imageData;

        // Reset selection
        selectedTextObject = null;

        // Redraw canvas with restored state
        redrawCanvas();

        updateUndoRedoButtonState();
        showToast("Đã hoàn tác thao tác cuối cùng");
    } else {
        showToast("Không thể hoàn tác thêm");
    }
}

function redo() {
    if (redoStack.length > 0) {
        // Get the last redo state
        const redoState = redoStack.pop();
        history.push(redoState);

        // Restore text objects
        textObjects = JSON.parse(JSON.stringify(redoState.textObjects));

        // Restore image data
        currentCanvasImageData = redoState.imageData;

        // Reset selection
        selectedTextObject = null;

        // Redraw canvas with restored state
        redrawCanvas();

        updateUndoRedoButtonState();
        showToast("Đã làm lại thao tác");
    } else {
        showToast("Không thể làm lại thêm");
    }
}

function updateUndoRedoButtonState() {
    undoButton.disabled = history.length <= 1;
    // Update any redo button UI if available
    const redoButton = document.getElementById('redoButton');
    if (redoButton) {
        redoButton.disabled = redoStack.length === 0;
    }
}

// --- Event Handlers ---
imageLoader.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showStatusMessage("Tệp không hợp lệ. Vui lòng chọn một tệp ảnh.", 'error');
        imageLoader.value = "";
        return;
    }

    loadingIndicator.classList.remove('hidden');
    hideStatusMessage();

    const reader = new FileReader();
    reader.onload = (e) => {
        originalImage = new Image();
        originalImage.onload = () => {
            // Reset state
            history = [];
            redoStack = [];
            textObjects = [];
            selectedTextObject = null;
            currentCanvasImageData = null;

            // Resize canvas to match image dimensions
            canvas.width = originalImage.naturalWidth;
            canvas.height = originalImage.naturalHeight;

            // Initial draw
            redrawCanvas();

            // Capture initial state
            ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
            currentCanvasImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            saveCanvasState();

            // Update UI
            loadingIndicator.classList.add('hidden');
            showStatusMessage("Ảnh đã được tải lên thành công!", 'success');
            enableAllTools();
        };

        originalImage.onerror = () => {
            loadingIndicator.classList.add('hidden');
            showStatusMessage("Không thể tải ảnh. Định dạng không được hỗ trợ hoặc tệp bị lỗi.", 'error');
            imageLoader.value = "";
        };

        originalImage.src = e.target.result;
    };

    reader.onerror = () => {
        loadingIndicator.classList.add('hidden');
        showStatusMessage("Có lỗi xảy ra khi đọc tệp.", 'error');
        imageLoader.value = "";
    };

    reader.readAsDataURL(file);
});

function enableAllTools() {
    eraseModeButton.disabled = false;
    textModeButton.disabled = false;
    selectModeButton.disabled = false;
    undoButton.disabled = false;
    saveButton.disabled = false;
    resetButton.disabled = false;
    updateUndoRedoButtonState();
}

function setActiveButton(activeButton) {
    [eraseModeButton, textModeButton, selectModeButton].forEach(button => {
        button.classList.remove('active');
    });

    if (activeButton) {
        activeButton.classList.add('active');
    }
}

function hideAllOptionPanels() {
    eraseOptions.classList.add('hidden');
    textOptions.classList.add('hidden');
    selectOptions.classList.add('hidden');
}

// Tool button event listeners
eraseModeButton.addEventListener('click', () => {
    currentMode = 'erase';
    hideAllOptionPanels();
    eraseOptions.classList.remove('hidden');
    canvas.style.cursor = 'crosshair';
    setActiveButton(eraseModeButton);
    selectedTextObject = null;
    redrawCanvas();
    showToast("Đã chọn công cụ Che Chữ");
});

textModeButton.addEventListener('click', () => {
    currentMode = 'text';
    hideAllOptionPanels();
    textOptions.classList.remove('hidden');
    canvas.style.cursor = 'text';
    setActiveButton(textModeButton);
    selectedTextObject = null;
    redrawCanvas();
    showToast("Đã chọn công cụ Thêm Chữ");
});

selectModeButton.addEventListener('click', () => {
    currentMode = 'select';
    hideAllOptionPanels();
    selectOptions.classList.remove('hidden');
    canvas.style.cursor = 'default';
    setActiveButton(selectModeButton);
    showToast("Đã chọn công cụ Chọn & Di Chuyển");
});

// Add undo button listener
undoButton.addEventListener('click', undo);

// Add redo button listener if it exists
const redoButton = document.getElementById('redoButton');
if (redoButton) {
    redoButton.addEventListener('click', redo);
}

// Save button
saveButton.addEventListener('click', () => {
    if (!originalImage && !currentCanvasImageData && textObjects.length === 0) {
        showToast("Chưa có gì để lưu!");
        return;
    }

    // Hide selection border before saving
    const tempSelected = selectedTextObject;
    selectedTextObject = null;
    redrawCanvas();

    // Wait a moment for the canvas to update before saving
    setTimeout(() => {
        const imageName = prompt("Nhập tên file ảnh:", "comic_edited.png");
        if (imageName) {
            const dataURL = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = imageName;
            link.href = dataURL;
            link.click();
            showToast(`Ảnh "${imageName}" đã được lưu.`);
        }

        // Restore selection
        selectedTextObject = tempSelected;
        if (selectedTextObject) redrawCanvas();
    }, 50);
});

// Reset button
resetButton.addEventListener('click', () => {
    if (!originalImage && !currentCanvasImageData && textObjects.length === 0) {
        showToast("Không có gì để làm mới.");
        return;
    }

    if (confirm("Bạn có chắc muốn làm mới tất cả thay đổi? Mọi thay đổi chưa lưu sẽ bị mất.")) {
        history = [];
        redoStack = [];
        textObjects = [];
        selectedTextObject = null;

        if (originalImage) {
            canvas.width = originalImage.naturalWidth;
            canvas.height = originalImage.naturalHeight;

            // Reset to original image
            ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
            currentCanvasImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            redrawCanvas();
            saveCanvasState();
        } else {
            // Default canvas size if no image
            canvas.width = 600;
            canvas.height = 400;
            currentCanvasImageData = null;
            redrawCanvas();
            saveCanvasState();
        }

        // Reset UI
        currentMode = null;
        hideAllOptionPanels();
        setActiveButton(null);
        canvas.style.cursor = 'default';
        textContentInput.value = '';
        hideStatusMessage();
        showToast("Đã làm mới tất cả.");
        updateUndoRedoButtonState();
    }
});

// Canvas Interaction (Mouse & Touch support)
function getEventPosition(event) {
    const rect = canvas.getBoundingClientRect();
    const clientX = event.clientX || (event.touches && event.touches[0].clientX);
    const clientY = event.clientY || (event.touches && event.touches[0].clientY);

    if (clientX === undefined || clientY === undefined) return null;

    return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
    };
}

function handleInteractionStart(event) {
    // For touch events, prevent default to avoid scrolling when drawing
    if (event.type === 'touchstart') {
        event.preventDefault();
    }

    const pos = getEventPosition(event);
    if (!pos) return;

    startX = pos.x;
    startY = pos.y;

    // Check if clicking on any text object first (regardless of mode)
    let foundObject = null;
    for (let i = textObjects.length - 1; i >= 0; i--) {
        if (isPointInTextObject(startX, startY, textObjects[i])) {
            foundObject = textObjects[i];
            break;
        }
    }

    // If clicking on a text object, start drag operation (even in text mode)
    if (foundObject) {
        selectedTextObject = foundObject;
        isDraggingText = true;
        dragOffsetX = startX - selectedTextObject.x;
        dragOffsetY = startY - selectedTextObject.y;
        canvas.style.cursor = 'move';
        redrawCanvas();
        return;
    }

    // If not clicking on text, handle based on current mode
    if (currentMode === 'text') {
        const text = textContentInput.value;
        if (!text.trim()) {
            showToast("Vui lòng nhập nội dung chữ!");
            return;
        }

        const newTextObject = {
            id: Date.now(),
            text: text,
            x: startX,
            y: startY,
            color: textColorInput.value,
            size: parseInt(fontSizeInput.value),
            font: fontFamilyInput.value,
            align: getTextAlign(),
            lines: [],
            width: 0,
            height: 0
        };

        prepareTextObject(newTextObject);
        textObjects.push(newTextObject);
        selectedTextObject = newTextObject;

        redrawCanvas();
        saveCanvasState();

    } else if (currentMode === 'erase') {
        isDrawing = true;

        // Store a snapshot of the current canvas for smooth preview
        if (!currentCanvasImageData) {
            // If somehow we don't have imageData yet
            if (originalImage) {
                ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
            }
            currentCanvasImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }

    } else if (currentMode === 'select') {
        // If we got here, we're not clicking on any text
        selectedTextObject = null;
        redrawCanvas();
    }
}

function handleInteractionMove(event) {
    // Prevent scrolling on touch devices
    if (event.type === 'touchmove') {
        event.preventDefault();
    }

    const pos = getEventPosition(event);
    if (!pos) return;

    const currentX = pos.x;
    const currentY = pos.y;

    // If dragging text, handle that first (regardless of mode)
    if (isDraggingText && selectedTextObject) {
        selectedTextObject.x = currentX - dragOffsetX;
        selectedTextObject.y = currentY - dragOffsetY;
        redrawCanvas();
        return;
    }

    // Handle other modes
    if (currentMode === 'erase' && isDrawing) {
        // Show preview using fast preview method
        drawErasePreview(
            Math.min(startX, currentX),
            Math.min(startY, currentY),
            Math.abs(currentX - startX),
            Math.abs(currentY - startY)
        );
    } else if (!isDraggingText) {
        // Update cursor when hovering over text objects (in any mode)
        let hoveringText = false;

        for (let i = textObjects.length - 1; i >= 0; i--) {
            if (isPointInTextObject(currentX, currentY, textObjects[i])) {
                hoveringText = true;
                break;
            }
        }

        canvas.style.cursor = hoveringText ? 'move' : (currentMode === 'erase' ? 'crosshair' :
            currentMode === 'text' ? 'text' : 'default');
    }
}

function handleInteractionEnd(event) {
    if (event.type === 'touchend') {
        event.preventDefault();
    }

    const pos = getEventPosition(event.changedTouches ? event.changedTouches[0] : event);

    // If dragging text was happening, save state
    if (isDraggingText) {
        isDraggingText = false;

        if (selectedTextObject) {
            saveCanvasState();
            // Keep text selected after drag
            redrawCanvas();
        }

        // Return to appropriate cursor
        canvas.style.cursor = currentMode === 'erase' ? 'crosshair' :
            currentMode === 'text' ? 'text' : 'default';
        return;
    }

    // Handle other mode interactions
    if (currentMode === 'erase' && isDrawing) {
        isDrawing = false;

        if (!pos) return;

        const endX = pos.x;
        const endY = pos.y;

        // Apply erase action (not preview anymore)
        applyErase(
            Math.min(startX, endX),
            Math.min(startY, endY),
            Math.abs(endX - startX),
            Math.abs(endY - startY)
        );

        // Save canvas state after erasing
        saveCanvasState();
    }
}

// Add event listeners for both mouse and touch
canvas.addEventListener('mousedown', handleInteractionStart);
canvas.addEventListener('touchstart', handleInteractionStart, { passive: false });

canvas.addEventListener('mousemove', handleInteractionMove);
canvas.addEventListener('touchmove', handleInteractionMove, { passive: false });

canvas.addEventListener('mouseup', handleInteractionEnd);
canvas.addEventListener('touchend', handleInteractionEnd, { passive: false });

canvas.addEventListener('mouseleave', () => {
    if (isDrawing && currentMode === 'erase') {
        isDrawing = false;
        redrawCanvas();
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', (event) => {
    // Ctrl+Z for Undo
    if (event.ctrlKey && event.key === 'z') {
        event.preventDefault();
        undo();
    }

    // Ctrl+Y for Redo
    if (event.ctrlKey && event.key === 'y') {
        event.preventDefault();
        redo();
    }

    // Delete key to remove selected text
    if ((event.key === 'Delete' || event.key === 'Backspace') && selectedTextObject) {
        // Don't delete if we're in a textarea 
        if (event.target.tagName.toLowerCase() === 'textarea' ||
            event.target.tagName.toLowerCase() === 'input') {
            return;
        }

        // Remove the selected text object
        textObjects = textObjects.filter(obj => obj !== selectedTextObject);
        selectedTextObject = null;
        redrawCanvas();
        saveCanvasState();
        showToast("Đã xóa văn bản đã chọn");

        // Prevent backspace from navigating back
        if (event.key === 'Backspace') {
            event.preventDefault();
        }
    }
});

// Initialize
function initializeApp() {
    // Set default canvas size
    canvas.width = 600;
    canvas.height = 400;

    // Draw initial message
    drawInitialMessage();

    // Disable tools until image is loaded
    eraseModeButton.disabled = true;
    textModeButton.disabled = true;
    selectModeButton.disabled = true;
    undoButton.disabled = true;
    saveButton.disabled = true;
    resetButton.disabled = true;

    // Enable text tool by default (can add text without image)
    textModeButton.disabled = false;

    // Set initial history state
    saveCanvasState();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);