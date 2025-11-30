// Sửa lỗi 1: Cập nhật hàm handleImageLoad để đảm bảo mobile helper ẩn đi
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

            // Ẩn mobile helper (thêm dòng này)
            const mobileHelper = document.getElementById('mobileHelper');
            if (mobileHelper) {
                mobileHelper.style.display = 'none';
            }

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

// Sửa lỗi 2: Cải tiến hàm setupMobileHelper để đảm bảo cập nhật đúng trạng thái
function setupMobileHelper() {
    const mobileHelper = document.getElementById('mobileHelper');
    if (!mobileHelper) return;

    // Cải tiến hàm cập nhật hiển thị helper
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

    // Gọi hàm cập nhật khi ảnh tải lên
    if (imageLoader) {
        imageLoader.addEventListener('change', function () {
            // Thêm timeout để đảm bảo chạy sau khi ảnh đã thực sự được xử lý
            setTimeout(updateHelperVisibility, 500);
        });
    }

    // Thêm cả sự kiện khi trạng thái canvas thay đổi
    document.addEventListener('visibilitychange', updateHelperVisibility);
    window.addEventListener('resize', updateHelperVisibility);
}

// Sửa lỗi 3: Cải tiến hàm handleMobilePanelClose để lưu nội dung text khi đóng panel
function handleMobilePanelClose() {
    // Đồng bộ giá trị textarea trước khi đóng panel
    const mobileTextContent = panelContent.querySelector('#textContent');
    const mainTextContent = document.getElementById('textContent');

    if (mobileTextContent && mainTextContent && currentMode === 'text') {
        mainTextContent.value = mobileTextContent.value;
    }

    // Đồng bộ các tùy chọn khác
    syncMobileOptionsToMain();

    // Đóng panel
    mobileToolsPanel.classList.remove('active');
    document.body.classList.remove('panel-open');
}

// Thêm hàm mới để đồng bộ tùy chọn từ mobile panel về main panel
function syncMobileOptionsToMain() {
    if (!panelContent) return;

    // Đồng bộ màu chữ
    const mobileTextColor = panelContent.querySelector('#textColor');
    const mainTextColor = document.getElementById('textColor');
    if (mobileTextColor && mainTextColor) {
        mainTextColor.value = mobileTextColor.value;
    }

    // Đồng bộ cỡ chữ
    const mobileFontSize = panelContent.querySelector('#fontSize');
    const mainFontSize = document.getElementById('fontSize');
    if (mobileFontSize && mainFontSize) {
        mainFontSize.value = mobileFontSize.value;
    }

    // Đồng bộ font chữ
    const mobileFontFamily = panelContent.querySelector('#fontFamily');
    const mainFontFamily = document.getElementById('fontFamily');
    if (mobileFontFamily && mainFontFamily) {
        mainFontFamily.value = mobileFontFamily.value;
    }

    // Đồng bộ căn lề
    const mobileAlignOptions = panelContent.querySelectorAll('input[name="textAlign"]');
    const mainAlignOptions = document.querySelectorAll('input[name="textAlign"]');

    if (mobileAlignOptions.length > 0 && mainAlignOptions.length > 0) {
        mobileAlignOptions.forEach((opt, index) => {
            if (opt.checked && mainAlignOptions[index]) {
                mainAlignOptions[index].checked = true;
            }
        });
    }

    // Đồng bộ màu xóa
    const mobileEraseColor = panelContent.querySelector('#eraseColor');
    const mainEraseColor = document.getElementById('eraseColor');
    if (mobileEraseColor && mainEraseColor) {
        mainEraseColor.value = mobileEraseColor.value;
    }
}

// Cập nhật lại hàm setupMobileEventListeners để hỗ trợ đồng bộ hai chiều
function setupMobileEventListeners() {
    if (!panelContent) return;

    // Add click handlers to cloned tool buttons
    const mobileToolButtons = panelContent.querySelectorAll('.tool-btn');
    mobileToolButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.id;
            const originalButton = document.getElementById(id);
            if (originalButton) {
                // Nhấn nút gốc để kích hoạt logic chế độ tương ứng
                originalButton.click();

                // Sau khi kích hoạt nút, cập nhật lại panel mobile với nội dung mới
                updateMobilePanelContent();

                // Không đóng panel khi nhấn vào công cụ vì cần hiển thị tùy chọn
                // Chỉ đóng panel nếu là nút reset hoặc save
                if (id === 'resetButton' || id === 'saveButton') {
                    mobileToolsPanel.classList.remove('active');
                    document.body.classList.remove('panel-open');
                }
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

    // Thêm event listeners cho các input text trong panel mobile
    const mobileTextContent = panelContent.querySelector('#textContent');
    if (mobileTextContent) {
        mobileTextContent.addEventListener('input', function () {
            const mainTextContent = document.getElementById('textContent');
            if (mainTextContent) {
                mainTextContent.value = this.value;
            }
        });
    }

    // Setup number inputs in mobile panel
    setupNumberInputs(panelContent);

    // Setup color pickers in mobile panel
    setupColorInputs(panelContent);
}

// Thêm hàm mới để cập nhật nội dung panel mobile dựa trên chế độ hiện tại
function updateMobilePanelContent() {
    if (!panelContent || !mobileToolsPanel || !mobileToolsPanel.classList.contains('active')) return;

    // Xóa nội dung hiện tại
    panelContent.innerHTML = '';

    // Thêm lại các nút công cụ
    const toolButtons = document.querySelector('.tool-buttons').cloneNode(true);
    panelContent.appendChild(toolButtons);

    // Thêm lại nút lịch sử
    const historyControls = document.querySelector('.history-controls').cloneNode(true);
    panelContent.appendChild(historyControls);

    // Đánh dấu nút công cụ đang active
    const activeToolButton = panelContent.querySelector(`#${currentMode}ModeButton`);
    if (activeToolButton) {
        activeToolButton.classList.add('active');
    }

    // Hiển thị panel tùy chọn tương ứng với chế độ hiện tại
    let optionsPanel = null;
    if (currentMode === 'erase') {
        optionsPanel = document.getElementById('eraseOptions');
    } else if (currentMode === 'text') {
        optionsPanel = document.getElementById('textOptions');
    } else if (currentMode === 'select') {
        optionsPanel = document.getElementById('selectOptions');
    }

    if (optionsPanel) {
        const clonedOptionsPanel = optionsPanel.cloneNode(true);
        clonedOptionsPanel.classList.remove('hidden');
        panelContent.appendChild(clonedOptionsPanel);
    }

    // Thiết lập lại event listeners cho các phần tử vừa thêm
    setupMobileEventListeners();
}

// Thêm sự kiện đóng panel khi nhấp vào canvas sau khi thêm chữ
function setupCanvasPanelEvents() {
    const canvasPanel = document.querySelector('.canvas-panel');
    if (!canvasPanel) return;

    canvasPanel.addEventListener('click', function (e) {
        // Chỉ đóng panel mobile nếu đang mở và đang ở chế độ text
        if (isMobileDevice &&
            mobileToolsPanel &&
            mobileToolsPanel.classList.contains('active') &&
            currentMode === 'text') {

            // Kiểm tra nội dung text trước khi đóng
            const mobileTextContent = panelContent.querySelector('#textContent');
            const mainTextContent = document.getElementById('textContent');

            // Chỉ đóng panel khi đã có text
            if (mobileTextContent && mobileTextContent.value.trim() !== '') {
                // Đồng bộ giá trị
                if (mainTextContent) {
                    mainTextContent.value = mobileTextContent.value;
                }

                // Đóng panel
                handleMobilePanelClose();

                // Tạo text mới trên canvas
                const pos = {
                    x: canvas.width / 2 - 100, // Đặt mặc định ở giữa canvas
                    y: canvas.height / 2 - 50
                };

                handleInteractionStart({
                    type: 'mousedown',
                    clientX: pos.x,
                    clientY: pos.y,
                    preventDefault: function () { }
                });
            }
        }
    });
}

// Cập nhật hàm initializeApp để gọi hàm mới
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

    // Setup canvas panel events (thêm dòng này)
    setupCanvasPanelEvents();
}