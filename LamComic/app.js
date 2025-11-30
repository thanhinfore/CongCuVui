/**
 * Ứng dụng Sửa Truyện Tranh 
 * Hỗ trợ cả PC và Mobile
 */

// ----------------- DOM Elements -----------------
let imageLoader, canvas, ctx;
let eraseModeButton, textModeButton, selectModeButton;
let undoButton, redoButton, saveButton, resetButton;
let eraseOptions, textOptions, selectOptions;
let eraseColorInput, textContentInput, textColorInput, fontSizeInput, fontFamilyInput;
let textAlignButtons;
let loadingIndicator, statusMessage, toastNotification;
let toolbarToggle, mobileToolsPanel, panelClose, panelContent;

// ----------------- State Variables -----------------
let currentMode = null; // 'erase', 'text', 'select'
let originalImage = null;
let currentCanvasImageData = null;
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
let canvasScaleFactor = 1; // Tỷ lệ hiển thị của canvas
let isMobileDevice = false;

// ----------------- Initialization Functions -----------------

// Khởi tạo DOM references - đảm bảo có các tham chiếu đầy đủ
function initDOMReferences() {
    // Core elements
    imageLoader = document.getElementById('imageLoader');
    canvas = document.getElementById('imageCanvas');
    ctx = canvas.getContext('2d');

    // Tool buttons
    eraseModeButton = document.getElementById('eraseModeButton');
    textModeButton = document.getElementById('textModeButton');
    selectModeButton = document.getElementById('selectModeButton');
    undoButton = document.getElementById('undoButton');
    redoButton = document.getElementById('redoButton');
    saveButton = document.getElementById('saveButton');
    resetButton = document.getElementById('resetButton');

    // Tool options panels
    eraseOptions = document.getElementById('eraseOptions');
    textOptions = document.getElementById('textOptions');
    selectOptions = document.getElementById('selectOptions');

    // Form inputs
    eraseColorInput = document.getElementById('eraseColor');
    textContentInput = document.getElementById('textContent');
    textColorInput = document.getElementById('textColor');
    fontSizeInput = document.getElementById('fontSize');
    fontFamilyInput = document.getElementById('fontFamily');
    textAlignButtons = document.querySelectorAll('input[name="textAlign"]');

    // UI elements
    loadingIndicator = document.getElementById('loadingIndicator');
    statusMessage = document.getElementById('statusMessage');
    toastNotification = document.getElementById('toastNotification');

    // Mobile UI elements
    toolbarToggle = document.getElementById('toolbarToggle');
    mobileToolsPanel = document.getElementById('mobileToolsPanel');
    panelClose = document.querySelector('.panel-close');
    panelContent = document.querySelector('.panel-content');
}

// Hàm khởi tạo chính của ứng dụng
function initializeApp() {
    // Đảm bảo tham chiếu DOM đầy đủ
    initDOMReferences();

    // Kiểm tra thiết bị
    checkDeviceType();

    // Set default canvas size
    canvas.width = 600;
    canvas.height = 400;

    // Draw initial message
    drawInitialMessage();

    // Initial canvas scaling
    adjustCanvasDisplay();

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

    // Setup all event listeners
    setupEventListeners();

    // Setup mobile helper
    setupMobileHelper();
}
// 2. Sửa lại hàm setupMobileHelper() để không gọi trực tiếp click vào uploadLabel
function setupMobileHelper() {
    const mobileHelper = document.getElementById('mobileHelper');
    if (!mobileHelper) return;

    // Ẩn helper khi có ảnh hoặc text
    function updateHelperVisibility() {
        if (originalImage || textObjects.length > 0) {
            mobileHelper.style.display = 'none';
        } else if (isMobileDevice) {
            mobileHelper.style.display = 'flex';
        }
    }

    // Thêm sự kiện click cho helper button
    const helperButton = mobileHelper.querySelector('.helper-button');
    if (helperButton) {
        helperButton.addEventListener('click', function () {
            // Kích hoạt input file trực tiếp thay vì qua label
            const imageInput = document.getElementById('imageLoader');
            if (imageInput) {
                imageInput.click();
            }
        });
    }

    // Cập nhật ban đầu
    updateHelperVisibility();

    // Theo dõi thay đổi
    if (imageLoader) {
        imageLoader.addEventListener('change', updateHelperVisibility);
    }
}
// Kiểm tra loại thiết bị để áp dụng các tối ưu hóa
function checkDeviceType() {
    // Check if mobile device
    isMobileDevice = window.innerWidth <= 768;

    // Apply mobile-specific optimizations
    if (isMobileDevice) {
        document.body.classList.add('mobile-device');
    } else {
        document.body.classList.remove('mobile-device');
    }
}

// ----------------- Utility Functions -----------------

// Hiển thị thông báo popup
function showToast(message) {
    const toastMsg = toastNotification.querySelector('.toast-message');
    if (toastMsg) {
        toastMsg.textContent = message;
    } else {
        toastNotification.textContent = message;
    }

    toastNotification.classList.add('show');
    setTimeout(() => {
        toastNotification.classList.remove('show');
    }, 3000);
}

// Hiển thị thông báo trạng thái
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

// Ẩn thông báo trạng thái
function hideStatusMessage() {
    statusMessage.classList.add('hidden');
}

// Lấy giá trị căn lề văn bản hiện tại
function getTextAlign() {
    let align = 'left'; // default
    textAlignButtons.forEach(button => {
        if (button.checked) {
            align = button.value;
        }
    });
    return align;
}

// ----------------- Canvas Scaling & Display -----------------

// Điều chỉnh hiển thị canvas để vừa với container
function adjustCanvasDisplay() {
    const canvasContainer = document.querySelector('.canvas-container');
    if (!canvas || !canvasContainer || canvas.width === 0 || canvas.height === 0) return;

    // Get container dimensions
    const containerWidth = canvasContainer.clientWidth;
    const containerHeight = canvasContainer.clientHeight;
    const canvasRatio = canvas.width / canvas.height;

    // Calculate optimal display size
    let displayWidth, displayHeight;

    if (containerWidth / canvasRatio <= containerHeight) {
        // Width constrained
        displayWidth = containerWidth - 20; // Subtract padding
        displayHeight = displayWidth / canvasRatio;
    } else {
        // Height constrained
        displayHeight = containerHeight - 20; // Subtract padding
        displayWidth = displayHeight * canvasRatio;
    }

    // Update scale factor for touch/mouse events
    canvasScaleFactor = canvas.width / displayWidth;

    // Apply CSS dimensions (doesn't change actual canvas dimensions)
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
}

// Tính toán tọa độ chuột/touch trên canvas
function getEventPosition(event) {
    if (!event) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;

    // Handle different event types safely
    if (event.type) {
        if (event.type.includes('touch')) {
            if (event.touches && event.touches.length > 0) {
                clientX = event.touches[0].clientX;
                clientY = event.touches[0].clientY;
            } else if (event.changedTouches && event.changedTouches.length > 0) {
                clientX = event.changedTouches[0].clientX;
                clientY = event.changedTouches[0].clientY;
            } else {
                return null; // No touch points available
            }
        } else {
            // Mouse event
            clientX = event.clientX;
            clientY = event.clientY;
        }
    } else {
        // Direct coordinates
        clientX = event.clientX;
        clientY = event.clientY;
    }

    if (clientX === undefined || clientY === undefined) return null;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    return { x, y };
}

// ----------------- Canvas Drawing Functions -----------------

// Vẽ lại toàn bộ canvas với nội dung hiện tại
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

// Vẽ hiệu ứng xem trước khi xóa (erase)
function drawErasePreview(x, y, width, height) {
    // Use temporary canvas for preview for better performance
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

    // Draw the erase preview rectangle
    tempCtx.fillStyle = eraseColorInput.value;
    tempCtx.globalAlpha = 0.5;
    tempCtx.fillRect(x, y, width, height);
    tempCtx.globalAlpha = 1.0;

    // Clear main canvas and draw the preview
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);

    // Draw text objects
    textObjects.forEach(obj => {
        drawTextObject(obj);
        if (obj === selectedTextObject) {
            drawSelectionBorder(obj);
        }
    });
}

// Vẽ đối tượng văn bản
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

// Chuẩn bị đối tượng văn bản (tính toán kích thước, đường viền, v.v.)
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

// Vẽ đường viền xung quanh đối tượng văn bản được chọn
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

// Kiểm tra xem điểm có nằm trong đối tượng văn bản không
function isPointInTextObject(px, py, obj) {
    return px >= obj.x && px <= obj.x + obj.width &&
        py >= obj.y && py <= obj.y + obj.height;
}

// Vẽ thông báo ban đầu
function drawInitialMessage() {
    // Chỉ vẽ trên canvas khi cần
    ctx.font = "16px 'Inter', sans-serif";
    ctx.fillStyle = "#6b7280";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Tải ảnh lên hoặc thêm chữ để bắt đầu", canvas.width / 2, canvas.height / 2);

    // Hiển thị overlay cho mobile để hướng dẫn người dùng
    if (isMobileDevice) {
        showInitialOverlay();
    }
}

// Thêm hàm mới để hiển thị overlay
function showInitialOverlay() {
    let existingOverlay = document.getElementById('initialOverlay');

    if (!existingOverlay) {
        const overlay = document.createElement('div');
        overlay.id = 'initialOverlay';
        overlay.className = 'initial-overlay';

        // Tạo nội dung overlay
        overlay.innerHTML = `
            <div class="overlay-content">
                <i class="fas fa-arrow-up animate-bounce"></i>
                <p>Nhấn vào "Tải ảnh lên" ở trên để bắt đầu</p>
                <button class="btn-start">Bắt đầu</button>
            </div>
        `;

        // Thêm vào canvas container
        const canvasContainer = document.querySelector('.canvas-container');
        if (canvasContainer) {
            canvasContainer.appendChild(overlay);

            // Xử lý sự kiện click cho nút bắt đầu
            const startButton = overlay.querySelector('.btn-start');
            if (startButton) {
                startButton.addEventListener('click', function () {
                    // Kích hoạt input file trực tiếp thay vì qua label
                    const imageInput = document.getElementById('imageLoader');
                    if (imageInput) {
                        imageInput.click();
                    }

                    // Ẩn overlay
                    overlay.style.display = 'none';
                });
            }

            // Xử lý click trực tiếp vào overlay
            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) {
                    overlay.style.display = 'none';
                }
            });
        }
    } else {
        existingOverlay.style.display = 'flex';
    }
}

// Thêm hàm để ẩn overlay khi có ảnh
function hideInitialOverlay() {
    const overlay = document.getElementById('initialOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Áp dụng thao tác xóa (erase)
function applyErase(x, y, width, height) {
    if (width < 1 || height < 1) return; // Ngăn chặn erase không hợp lệ

    // Tạo canvas tạm thời để thực hiện thao tác
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Vẽ trạng thái hiện tại lên canvas tạm thời
    if (currentCanvasImageData) {
        tempCtx.putImageData(currentCanvasImageData, 0, 0);
    } else if (originalImage) {
        tempCtx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    }

    // Thực hiện xóa trên canvas tạm thời
    tempCtx.fillStyle = eraseColorInput.value;
    tempCtx.fillRect(x, y, width, height);

    // Lưu lại trạng thái mới
    currentCanvasImageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);

    // Vẽ lại canvas
    redrawCanvas();
}

// ----------------- Mobile UI Setup -----------------

// Thiết lập bảng điều khiển cho thiết bị di động
function setupMobilePanel() {
    if (!mobileToolsPanel || !panelContent) return;

    // Clear existing content
    panelContent.innerHTML = '';

    // Clone tool buttons
    const toolButtons = document.querySelector('.tool-buttons').cloneNode(true);
    panelContent.appendChild(toolButtons);

    // Clone history controls
    const historyControls = document.querySelector('.history-controls').cloneNode(true);
    panelContent.appendChild(historyControls);

    // Clone active tool options
    const activeToolOptions = document.querySelector('.tool-options:not(.hidden)');
    if (activeToolOptions) {
        panelContent.appendChild(activeToolOptions.cloneNode(true));
    }

    // Setup event listeners for cloned elements
    setupMobileEventListeners();
}

// Thiết lập sự kiện cho bảng điều khiển di động
function setupMobileEventListeners() {
    if (!panelContent) return;

    // Add click handlers to cloned tool buttons
    const mobileToolButtons = panelContent.querySelectorAll('.tool-btn');
    mobileToolButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.id;
            const originalButton = document.getElementById(id);
            if (originalButton) {
                originalButton.click();
                mobileToolsPanel.classList.remove('active');
                document.body.classList.remove('panel-open');
            }
        });
    });

    // Add click handlers to cloned history buttons
    const mobileHistoryButtons = panelContent.querySelectorAll('.history-btn');
    mobileHistoryButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.id;
            const originalButton = document.getElementById(id);
            if (originalButton) {
                originalButton.click();
            }
        });
    });

    // Setup number inputs in mobile panel
    setupNumberInputs(panelContent);

    // Setup color pickers in mobile panel
    setupColorInputs(panelContent);
}

// Thiết lập các input dạng số
function setupNumberInputs(container) {
    const numberInputs = container.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
        const upBtn = input.parentElement.querySelector('.number-up');
        const downBtn = input.parentElement.querySelector('.number-down');

        if (upBtn && downBtn) {
            upBtn.addEventListener('click', function () {
                const max = parseInt(input.getAttribute('max')) || 100;
                const newValue = Math.min(parseInt(input.value) + 1, max);
                input.value = newValue;

                // Sync with original input if this is a clone
                if (container === panelContent) {
                    const originalInput = document.getElementById(input.id);
                    if (originalInput && originalInput !== input) {
                        originalInput.value = newValue;
                    }
                }

                input.dispatchEvent(new Event('change'));
            });

            downBtn.addEventListener('click', function () {
                const min = parseInt(input.getAttribute('min')) || 0;
                const newValue = Math.max(parseInt(input.value) - 1, min);
                input.value = newValue;

                // Sync with original input if this is a clone
                if (container === panelContent) {
                    const originalInput = document.getElementById(input.id);
                    if (originalInput && originalInput !== input) {
                        originalInput.value = newValue;
                    }
                }

                input.dispatchEvent(new Event('change'));
            });
        }
    });
}

// Thiết lập các input dạng màu sắc
function setupColorInputs(container) {
    const colorInputs = container.querySelectorAll('input[type="color"]');
    colorInputs.forEach(input => {
        input.addEventListener('input', function () {
            // Sync with original input if this is a clone
            if (container === panelContent) {
                const originalInput = document.getElementById(input.id);
                if (originalInput && originalInput !== input) {
                    originalInput.value = input.value;
                    originalInput.dispatchEvent(new Event('input'));
                }
            }
        });
    });
}

// ----------------- History Management -----------------

// Lưu trạng thái canvas hiện tại
function saveCanvasState() {
    if (history.length >= MAX_HISTORY_STATES) {
        history.shift(); // Remove oldest state if at max capacity
    }

    // Tạo canvas tạm thời để lưu trạng thái không có text
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    if (currentCanvasImageData) {
        tempCtx.putImageData(currentCanvasImageData, 0, 0);
    } else if (originalImage) {
        tempCtx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    }

    // Lưu trạng thái
    const state = {
        imageData: tempCtx.getImageData(0, 0, canvas.width, canvas.height),
        textObjects: JSON.parse(JSON.stringify(textObjects))
    };

    history.push(state);
    // Xóa redo stack khi thực hiện thao tác mới
    redoStack = [];

    updateUndoRedoButtonState();
}

// Hoàn tác
function undo() {
    if (history.length > 1) {
        // Di chuyển state hiện tại vào redo stack
        const currentState = history.pop();
        redoStack.push(currentState);

        // Lấy state trước đó
        const prevState = history[history.length - 1];

        // Khôi phục text objects
        textObjects = JSON.parse(JSON.stringify(prevState.textObjects));

        // Khôi phục image data
        currentCanvasImageData = prevState.imageData;

        // Bỏ chọn text object
        selectedTextObject = null;

        // Vẽ lại canvas với state cũ
        redrawCanvas();

        updateUndoRedoButtonState();
        showToast("Đã hoàn tác thao tác cuối cùng");
    } else {
        showToast("Không thể hoàn tác thêm");
    }
}

// Làm lại
function redo() {
    if (redoStack.length > 0) {
        // Lấy state gần nhất từ redo stack
        const redoState = redoStack.pop();
        history.push(redoState);

        // Khôi phục text objects
        textObjects = JSON.parse(JSON.stringify(redoState.textObjects));

        // Khôi phục image data
        currentCanvasImageData = redoState.imageData;

        // Bỏ chọn text object
        selectedTextObject = null;

        // Vẽ lại canvas với state đã restored
        redrawCanvas();

        updateUndoRedoButtonState();
        showToast("Đã làm lại thao tác");
    } else {
        showToast("Không thể làm lại thêm");
    }
}

// Cập nhật trạng thái nút Undo/Redo
function updateUndoRedoButtonState() {
    if (undoButton) undoButton.disabled = history.length <= 1;
    if (redoButton) redoButton.disabled = redoStack.length === 0;
}

// ----------------- Tool Management -----------------

// Thiết lập trạng thái active cho nút
function setActiveButton(activeButton) {
    [eraseModeButton, textModeButton, selectModeButton].forEach(button => {
        if (button) button.classList.remove('active');
    });

    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// Ẩn tất cả các panel tùy chọn
function hideAllOptionPanels() {
    if (eraseOptions) eraseOptions.classList.add('hidden');
    if (textOptions) textOptions.classList.add('hidden');
    if (selectOptions) selectOptions.classList.add('hidden');
}

// Bật tất cả các công cụ
function enableAllTools() {
    if (eraseModeButton) eraseModeButton.disabled = false;
    if (textModeButton) textModeButton.disabled = false;
    if (selectModeButton) selectModeButton.disabled = false;
    if (undoButton) undoButton.disabled = false;
    if (saveButton) saveButton.disabled = false;
    if (resetButton) resetButton.disabled = false;
    updateUndoRedoButtonState();
}

// ----------------- Event Handlers -----------------

// Xử lý tải ảnh
function handleImageLoad() {
    if (!imageLoader || !imageLoader.files || !imageLoader.files[0]) return;

    const file = imageLoader.files[0];
    if (!file.type.startsWith('image/')) {
        showStatusMessage("Tệp không hợp lệ. Vui lòng chọn một tệp ảnh.", 'error');
        imageLoader.value = "";
        return;
    }

    if (loadingIndicator) loadingIndicator.classList.remove('hidden');
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

            // Ẩn overlay khi ảnh được tải
            hideInitialOverlay();

            // Resize canvas to match image dimensions
            canvas.width = originalImage.naturalWidth;
            canvas.height = originalImage.naturalHeight;

            // Initial draw
            redrawCanvas();

            // Capture initial state
            ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
            currentCanvasImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Adjust display for container
            adjustCanvasDisplay();

            saveCanvasState();

            // Update UI
            if (loadingIndicator) loadingIndicator.classList.add('hidden');
            showStatusMessage("Ảnh đã được tải lên thành công!", 'success');
            enableAllTools();
        };

        originalImage.onerror = () => {
            if (loadingIndicator) loadingIndicator.classList.add('hidden');
            showStatusMessage("Không thể tải ảnh. Định dạng không được hỗ trợ hoặc tệp bị lỗi.", 'error');
            imageLoader.value = "";
        };

        originalImage.src = e.target.result;
    };

    reader.onerror = () => {
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        showStatusMessage("Có lỗi xảy ra khi đọc tệp.", 'error');
        imageLoader.value = "";
    };

    reader.readAsDataURL(file);
}

// Xử lý bắt đầu tương tác (mouse down/touch start)
function handleInteractionStart(event) {
    // Ngăn chặn cuộn trang trên thiết bị di động
    if (event.type === 'touchstart') {
        event.preventDefault();
    }

    const pos = getEventPosition(event);
    if (!pos) return;

    startX = pos.x;
    startY = pos.y;

    // Kiểm tra xem có click vào text object nào không
    let foundObject = null;
    for (let i = textObjects.length - 1; i >= 0; i--) {
        if (isPointInTextObject(startX, startY, textObjects[i])) {
            foundObject = textObjects[i];
            break;
        }
    }

    // Nếu click vào text object, bắt đầu kéo
    if (foundObject) {
        selectedTextObject = foundObject;
        isDraggingText = true;
        dragOffsetX = startX - selectedTextObject.x;
        dragOffsetY = startY - selectedTextObject.y;
        canvas.style.cursor = 'move';
        redrawCanvas();
        return;
    }

    // Nếu không click vào text, xử lý dựa trên mode hiện tại
    if (currentMode === 'text') {
        const text = textContentInput.value;
        if (!text || !text.trim()) {
            showToast("Vui lòng nhập nội dung chữ!");
            return;
        }

        const newTextObject = {
            id: Date.now(),
            text: text,
            x: startX,
            y: startY,
            color: textColorInput.value,
            size: parseInt(fontSizeInput.value) || 24,
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
    } else if (currentMode === 'select') {
        // Nếu không click vào text object, bỏ chọn
        selectedTextObject = null;
        redrawCanvas();
    }
}

// Xử lý di chuyển (mouse move/touch move)
function handleInteractionMove(event) {
    // Ngăn chặn cuộn trang trên thiết bị di động
    if (event.type === 'touchmove') {
        event.preventDefault();
    }

    const pos = getEventPosition(event);
    if (!pos) return;

    const currentX = pos.x;
    const currentY = pos.y;

    // Nếu đang kéo text object
    if (isDraggingText && selectedTextObject) {
        selectedTextObject.x = currentX - dragOffsetX;
        selectedTextObject.y = currentY - dragOffsetY;
        redrawCanvas();
        return;
    }

    // Xử lý các mode khác
    if (currentMode === 'erase' && isDrawing) {
        // Hiển thị preview xóa
        drawErasePreview(
            Math.min(startX, currentX),
            Math.min(startY, currentY),
            Math.abs(currentX - startX),
            Math.abs(currentY - startY)
        );
    } else if (!isDraggingText) {
        // Cập nhật con trỏ khi hover lên text object
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

// Xử lý kết thúc tương tác (mouse up/touch end)
function handleInteractionEnd(event) {
    if (event.type === 'touchend') {
        event.preventDefault();
    }

    // Xử lý touch event an toàn
    let pos = null;
    if (event.changedTouches && event.changedTouches.length > 0) {
        pos = getEventPosition(event.changedTouches[0]);
    } else {
        pos = getEventPosition(event);
    }

    // Nếu đang kéo text
    if (isDraggingText) {
        isDraggingText = false;

        if (selectedTextObject) {
            saveCanvasState();
            redrawCanvas();
        }

        // Trở về con trỏ thích hợp
        canvas.style.cursor = currentMode === 'erase' ? 'crosshair' :
            currentMode === 'text' ? 'text' : 'default';
        return;
    }

    // Xử lý mode erase
    if (currentMode === 'erase' && isDrawing) {
        isDrawing = false;

        if (!pos) {
            redrawCanvas();
            return;
        }

        const endX = pos.x;
        const endY = pos.y;

        // Thực hiện xóa nếu có kích thước hợp lệ
        if (Math.abs(endX - startX) > 3 && Math.abs(endY - startY) > 3) {
            applyErase(
                Math.min(startX, endX),
                Math.min(startY, endY),
                Math.abs(endX - startX),
                Math.abs(endY - startY)
            );

            // Lưu trạng thái sau khi xóa
            saveCanvasState();
        } else {
            // Vẽ lại nếu kích thước quá nhỏ
            redrawCanvas();
        }
    }
}

// Xử lý thao tác lưu
function handleSave() {
    if (!originalImage && !currentCanvasImageData && textObjects.length === 0) {
        showToast("Chưa có gì để lưu!");
        return;
    }

    // Ẩn đường viền selection khi lưu
    const tempSelected = selectedTextObject;
    selectedTextObject = null;
    redrawCanvas();

    setTimeout(() => {
        const imageName = prompt("Nhập tên file ảnh:", "comic_edited.png") || "comic_edited.png";
        try {
            const dataURL = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = imageName.endsWith('.png') ? imageName : imageName + '.png';
            link.href = dataURL;
            link.click();
            showToast(`Ảnh "${link.download}" đã được lưu.`);
        } catch (e) {
            console.error("Lỗi khi lưu:", e);
            showToast("Lỗi khi lưu ảnh. Vui lòng thử lại!");
        }

        // Khôi phục selection
        selectedTextObject = tempSelected;
        if (selectedTextObject) redrawCanvas();
    }, 50);
}

// Xử lý thao tác reset
function handleReset() {
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

            // Reset về ảnh gốc
            ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
            currentCanvasImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            redrawCanvas();
            adjustCanvasDisplay();
            saveCanvasState();
        } else {
            // Kích thước mặc định nếu không có ảnh
            canvas.width = 600;
            canvas.height = 400;
            currentCanvasImageData = null;
            redrawCanvas();
            adjustCanvasDisplay();
            saveCanvasState();
        }

        // Reset UI
        currentMode = null;
        hideAllOptionPanels();
        setActiveButton(null);
        canvas.style.cursor = 'default';
        if (textContentInput) textContentInput.value = '';
        hideStatusMessage();
        showToast("Đã làm mới tất cả.");
        updateUndoRedoButtonState();
    }
}

// Xử lý nút chế độ xóa (erase)
function handleEraseModeClick() {
    currentMode = 'erase';
    hideAllOptionPanels();
    if (eraseOptions) eraseOptions.classList.remove('hidden');
    canvas.style.cursor = 'crosshair';
    setActiveButton(eraseModeButton);
    selectedTextObject = null;
    redrawCanvas();
    showToast("Đã chọn công cụ Che Chữ");
}

// Xử lý nút chế độ thêm chữ (text)
function handleTextModeClick() {
    currentMode = 'text';
    hideAllOptionPanels();
    if (textOptions) textOptions.classList.remove('hidden');
    canvas.style.cursor = 'text';
    setActiveButton(textModeButton);
    selectedTextObject = null;
    redrawCanvas();
    showToast("Đã chọn công cụ Thêm Chữ");
}

// Xử lý nút chế độ chọn (select)
function handleSelectModeClick() {
    currentMode = 'select';
    hideAllOptionPanels();
    if (selectOptions) selectOptions.classList.remove('hidden');
    canvas.style.cursor = 'default';
    setActiveButton(selectModeButton);
    showToast("Đã chọn công cụ Chọn & Di Chuyển");
}

// Xử lý phím tắt
function handleKeyDown(event) {
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
        // Chỉ xóa nếu không đang focus vào input hoặc textarea
        if (event.target.tagName && (
            event.target.tagName.toLowerCase() === 'textarea' ||
            event.target.tagName.toLowerCase() === 'input')) {
            return;
        }

        // Xóa text object đã chọn
        textObjects = textObjects.filter(obj => obj !== selectedTextObject);
        selectedTextObject = null;
        redrawCanvas();
        saveCanvasState();
        showToast("Đã xóa văn bản đã chọn");

        // Ngăn chặn backspace gây navigate back
        if (event.key === 'Backspace') {
            event.preventDefault();
        }
    }
}

// Xử lý hiển thị bảng điều khiển mobile
function handleMobileToolbarToggle() {
    setupMobilePanel();
    mobileToolsPanel.classList.add('active');
    document.body.classList.add('panel-open');
}

// Xử lý đóng bảng điều khiển mobile
function handleMobilePanelClose() {
    mobileToolsPanel.classList.remove('active');
    document.body.classList.remove('panel-open');
}

// Xử lý thay đổi kích thước cửa sổ
function handleWindowResize() {
    // Sử dụng debounce để tránh gọi quá nhiều lần
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(function () {
        isMobileDevice = window.innerWidth <= 768;
        adjustCanvasDisplay();
    }, 250);
}

// Xử lý thay đổi hướng thiết bị
function handleOrientationChange() {
    setTimeout(function () {
        adjustCanvasDisplay();
    }, 300);
}

// ----------------- Event Listener Setup -----------------

// Thiết lập các sự kiện cho ứng dụng
function setupEventListeners() {
    // Image loader
    if (imageLoader) {
        imageLoader.addEventListener('change', handleImageLoad);
    }

    // Tool buttons
    if (eraseModeButton) {
        eraseModeButton.addEventListener('click', handleEraseModeClick);
    }

    if (textModeButton) {
        textModeButton.addEventListener('click', handleTextModeClick);
    }

    if (selectModeButton) {
        selectModeButton.addEventListener('click', handleSelectModeClick);
    }

    // History buttons
    if (undoButton) {
        undoButton.addEventListener('click', undo);
    }

    if (redoButton) {
        redoButton.addEventListener('click', redo);
    }

    // Action buttons
    if (saveButton) {
        saveButton.addEventListener('click', handleSave);
    }

    if (resetButton) {
        resetButton.addEventListener('click', handleReset);
    }

    // Canvas interaction - for mouse
    if (canvas) {
        canvas.addEventListener('mousedown', handleInteractionStart);
        canvas.addEventListener('mousemove', handleInteractionMove);
        canvas.addEventListener('mouseup', handleInteractionEnd);
        canvas.addEventListener('mouseleave', function () {
            if (isDrawing && currentMode === 'erase') {
                isDrawing = false;
                redrawCanvas();
            }
        });

        // Canvas interaction - for touch
        canvas.addEventListener('touchstart', handleInteractionStart, { passive: false });
        canvas.addEventListener('touchmove', handleInteractionMove, { passive: false });
        canvas.addEventListener('touchend', handleInteractionEnd, { passive: false });
        canvas.addEventListener('touchcancel', function () {
            if (isDrawing) {
                isDrawing = false;
                redrawCanvas();
            }
            if (isDraggingText) {
                isDraggingText = false;
                redrawCanvas();
            }
        });
    }
    

    // Thêm xử lý cho safari bug - tap delay
    document.addEventListener('touchstart', function () { }, { passive: false });
    // Mobile panel toggle
    if (toolbarToggle && mobileToolsPanel) {
        toolbarToggle.addEventListener('click', handleMobileToolbarToggle);

        if (panelClose) {
            panelClose.addEventListener('click', handleMobilePanelClose);
        }

        // Close panel when clicking on canvas (on mobile)
        const canvasPanel = document.querySelector('.canvas-panel');
        if (canvasPanel) {
            canvasPanel.addEventListener('click', function () {
                if (isMobileDevice && mobileToolsPanel.classList.contains('active')) {
                    mobileToolsPanel.classList.remove('active');
                    document.body.classList.remove('panel-open');
                }
            });
        }
    }

    // Window events
    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Setup number inputs
    setupNumberInputs(document);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyDown);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Tối ưu hiệu suất bằng cách giải phóng bộ nhớ khi không cần thiết
window.addEventListener('beforeunload', function () {
    currentCanvasImageData = null;
    originalImage = null;
    history = [];
    redoStack = [];
    textObjects = [];
});