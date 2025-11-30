/**
 * Bản sửa lỗi tất cả trong một - giải quyết các vấn đề chính của ứng dụng Sửa Truyện Tranh trên mobile
 * Bao gồm:
 * 1. Sửa lỗi nút Tải ảnh lên không biến mất
 * 2. Sửa lỗi các công cụ không hoạt động sau khi tải ảnh
 * 3. Sửa lỗi thêm chữ không hoạt động khi tắt panel công cụ
 * 4. Sửa lỗi chuyển đổi chế độ trong panel mobile
 * 5. Sửa lỗi thông báo không biến mất
 * 6. Sửa lỗi chức năng Font Size không hoạt động
 * 7. Sửa lỗi các nút không hoạt động
 */

// Đảm bảo script chạy sau khi trang đã tải xong
document.addEventListener('DOMContentLoaded', function () {
    console.log("Bắt đầu áp dụng các bản sửa lỗi...");

    // Đợi một chút để đảm bảo tất cả script khác đã tải xong
    setTimeout(applyAllFixes, 500);
});

// Hàm áp dụng tất cả các bản sửa lỗi
function applyAllFixes() {
    console.log("Đang áp dụng tất cả các bản sửa lỗi...");

    // Lưu lại hàm gốc trước khi ghi đè
    backupOriginalFunctions();

    // Đồng bộ hóa DOM references
    reinitDOMReferences();

    // Áp dụng các bản sửa lỗi
    fixMobileHelper();
    fixButtonFunctions();
    fixMobilePanel();
    fixFontSize();
    fixNotifications();
    fixSaveFunction();

    // Thiết lập lại sự kiện cho các thành phần
    reattachEventListeners();

    // Sửa lỗi CSS
    applyFixedCSS();

    console.log("Tất cả các bản sửa lỗi đã được áp dụng thành công!");

    // Hiển thị badge xác nhận
    showFixConfirmation();
}

// 0. Lưu các hàm gốc trước khi ghi đè
function backupOriginalFunctions() {
    window._originalFunctions = {
        handleImageLoad: window.handleImageLoad,
        setupMobileHelper: window.setupMobileHelper,
        handleEraseModeClick: window.handleEraseModeClick,
        handleTextModeClick: window.handleTextModeClick,
        handleSelectModeClick: window.handleSelectModeClick,
        handleMobileToolbarToggle: window.handleMobileToolbarToggle,
        handleMobilePanelClose: window.handleMobilePanelClose,
        setupMobilePanel: window.setupMobilePanel,
        setupMobileEventListeners: window.setupMobileEventListeners,
        handleInteractionStart: window.handleInteractionStart,
        showToast: window.showToast,
        handleSave: window.handleSave
    };

    console.log("Đã sao lưu các hàm gốc");
}

// 1. Đồng bộ hóa DOM references
function reinitDOMReferences() {
    // Core elements
    window.imageLoader = document.getElementById('imageLoader');
    window.canvas = document.getElementById('imageCanvas');
    if (window.canvas) window.ctx = window.canvas.getContext('2d');

    // Tool buttons
    window.eraseModeButton = document.getElementById('eraseModeButton');
    window.textModeButton = document.getElementById('textModeButton');
    window.selectModeButton = document.getElementById('selectModeButton');
    window.undoButton = document.getElementById('undoButton');
    window.redoButton = document.getElementById('redoButton');
    window.saveButton = document.getElementById('saveButton');
    window.resetButton = document.getElementById('resetButton');

    // Tool options panels
    window.eraseOptions = document.getElementById('eraseOptions');
    window.textOptions = document.getElementById('textOptions');
    window.selectOptions = document.getElementById('selectOptions');

    // Form inputs
    window.eraseColorInput = document.getElementById('eraseColor');
    window.textContentInput = document.getElementById('textContent');
    window.textColorInput = document.getElementById('textColor');
    window.fontSizeInput = document.getElementById('fontSize');
    window.fontFamilyInput = document.getElementById('fontFamily');
    window.textAlignButtons = document.querySelectorAll('input[name="textAlign"]');

    // UI elements
    window.loadingIndicator = document.getElementById('loadingIndicator');
    window.statusMessage = document.getElementById('statusMessage');
    window.toastNotification = document.getElementById('toastNotification');

    // Mobile UI elements
    window.toolbarToggle = document.getElementById('toolbarToggle');
    window.mobileToolsPanel = document.getElementById('mobileToolsPanel');
    window.panelClose = document.querySelector('.panel-close');
    window.panelContent = document.querySelector('.panel-content');

    console.log("Đã khởi tạo lại DOM references");
}

// 2. Sửa lỗi Mobile Helper
function fixMobileHelper() {
    // Ghi đè hàm handleImageLoad
    window.handleImageLoad = function () {
        if (!window.imageLoader || !window.imageLoader.files || !window.imageLoader.files[0]) return;

        const file = window.imageLoader.files[0];
        if (!file.type.startsWith('image/')) {
            if (typeof window.showStatusMessage === 'function') {
                window.showStatusMessage("Tệp không hợp lệ. Vui lòng chọn một tệp ảnh.", 'error');
            }
            window.imageLoader.value = "";
            return;
        }

        if (window.loadingIndicator) window.loadingIndicator.classList.remove('hidden');
        if (typeof window.hideStatusMessage === 'function') window.hideStatusMessage();

        const reader = new FileReader();
        reader.onload = (e) => {
            window.originalImage = new Image();
            window.originalImage.onload = () => {
                // Reset state
                window.history = [];
                window.redoStack = [];
                window.textObjects = [];
                window.selectedTextObject = null;
                window.currentCanvasImageData = null;

                // Ẩn overlay khi ảnh được tải
                if (typeof window.hideInitialOverlay === 'function') window.hideInitialOverlay();

                // Ẩn mobile helper
                const mobileHelper = document.getElementById('mobileHelper');
                if (mobileHelper) {
                    mobileHelper.style.display = 'none';
                }

                // Resize canvas to match image dimensions
                window.canvas.width = window.originalImage.naturalWidth;
                window.canvas.height = window.originalImage.naturalHeight;

                // Initial draw
                if (typeof window.redrawCanvas === 'function') window.redrawCanvas();

                // Capture initial state
                window.ctx.drawImage(window.originalImage, 0, 0, window.canvas.width, window.canvas.height);
                window.currentCanvasImageData = window.ctx.getImageData(0, 0, window.canvas.width, window.canvas.height);

                // Adjust display for container
                if (typeof window.adjustCanvasDisplay === 'function') window.adjustCanvasDisplay();

                if (typeof window.saveCanvasState === 'function') window.saveCanvasState();

                // Update UI
                if (window.loadingIndicator) window.loadingIndicator.classList.add('hidden');
                if (typeof window.showStatusMessage === 'function') {
                    window.showStatusMessage("Ảnh đã được tải lên thành công!", 'success');
                }
                if (typeof window.enableAllTools === 'function') window.enableAllTools();
            };

            window.originalImage.onerror = () => {
                if (window.loadingIndicator) window.loadingIndicator.classList.add('hidden');
                if (typeof window.showStatusMessage === 'function') {
                    window.showStatusMessage("Không thể tải ảnh. Định dạng không được hỗ trợ hoặc tệp bị lỗi.", 'error');
                }
                window.imageLoader.value = "";
            };

            window.originalImage.src = e.target.result;
        };

        reader.onerror = () => {
            if (window.loadingIndicator) window.loadingIndicator.classList.add('hidden');
            if (typeof window.showStatusMessage === 'function') {
                window.showStatusMessage("Có lỗi xảy ra khi đọc tệp.", 'error');
            }
            window.imageLoader.value = "";
        };

        reader.readAsDataURL(file);
    };

    // Sửa hàm setupMobileHelper
    window.setupMobileHelper = function () {
        const mobileHelper = document.getElementById('mobileHelper');
        if (!mobileHelper) return;

        // Cập nhật hiển thị helper
        function updateHelperVisibility() {
            if (window.originalImage || (window.textObjects && window.textObjects.length > 0)) {
                mobileHelper.style.display = 'none';
            } else if (window.isMobileDevice) {
                mobileHelper.style.display = 'flex';
            }
        }

        // Thêm sự kiện click cho helper button
        const helperButton = mobileHelper.querySelector('.helper-button');
        if (helperButton) {
            helperButton.addEventListener('click', function () {
                const imageInput = document.getElementById('imageLoader');
                if (imageInput) {
                    imageInput.click();
                }
            });
        }

        // Cập nhật ban đầu
        updateHelperVisibility();

        // Theo dõi thay đổi
        if (window.imageLoader) {
            window.imageLoader.addEventListener('change', function () {
                // Thêm timeout để đảm bảo chạy sau khi ảnh đã thực sự được xử lý
                setTimeout(updateHelperVisibility, 500);
            });
        }
    };

    console.log("Đã sửa lỗi Mobile Helper");
}

// 3. Sửa lỗi các nút công cụ
function fixButtonFunctions() {
    // Ghi đè các hàm xử lý nút công cụ
    window.handleEraseModeClick = function () {
        clearNotifications();

        window.currentMode = 'erase';
        if (typeof window.hideAllOptionPanels === 'function') window.hideAllOptionPanels();
        if (window.eraseOptions) window.eraseOptions.classList.remove('hidden');
        if (window.canvas) window.canvas.style.cursor = 'crosshair';
        if (typeof window.setActiveButton === 'function') window.setActiveButton(window.eraseModeButton);
        window.selectedTextObject = null;
        if (typeof window.redrawCanvas === 'function') window.redrawCanvas();
        if (typeof window.showToast === 'function') window.showToast("Đã chọn công cụ Che Chữ");

        // Cập nhật panel mobile nếu đang mở
        if (window.isMobileDevice && window.mobileToolsPanel && window.mobileToolsPanel.classList.contains('active')) {
            updateMobilePanel();
        }
    };

    window.handleTextModeClick = function () {
        clearNotifications();

        window.currentMode = 'text';
        if (typeof window.hideAllOptionPanels === 'function') window.hideAllOptionPanels();
        if (window.textOptions) window.textOptions.classList.remove('hidden');
        if (window.canvas) window.canvas.style.cursor = 'text';
        if (typeof window.setActiveButton === 'function') window.setActiveButton(window.textModeButton);
        window.selectedTextObject = null;
        if (typeof window.redrawCanvas === 'function') window.redrawCanvas();
        if (typeof window.showToast === 'function') window.showToast("Đã chọn công cụ Thêm Chữ");

        // Cập nhật panel mobile nếu đang mở
        if (window.isMobileDevice && window.mobileToolsPanel && window.mobileToolsPanel.classList.contains('active')) {
            updateMobilePanel();
        }
    };

    window.handleSelectModeClick = function () {
        clearNotifications();

        window.currentMode = 'select';
        if (typeof window.hideAllOptionPanels === 'function') window.hideAllOptionPanels();
        if (window.selectOptions) window.selectOptions.classList.remove('hidden');
        if (window.canvas) window.canvas.style.cursor = 'default';
        if (typeof window.setActiveButton === 'function') window.setActiveButton(window.selectModeButton);
        if (typeof window.showToast === 'function') window.showToast("Đã chọn công cụ Chọn & Di Chuyển");

        // Cập nhật panel mobile nếu đang mở
        if (window.isMobileDevice && window.mobileToolsPanel && window.mobileToolsPanel.classList.contains('active')) {
            updateMobilePanel();
        }
    };

    console.log("Đã sửa lỗi các nút công cụ");
}

// 4. Sửa lỗi Mobile Panel
function fixMobilePanel() {
    // Ghi đè hàm toggle và đóng panel
    window.handleMobileToolbarToggle = function () {
        clearNotifications();

        updateMobilePanel();
        if (window.mobileToolsPanel) {
            window.mobileToolsPanel.classList.add('active');
            document.body.classList.add('panel-open');
        }
    };

    window.handleMobilePanelClose = function () {
        clearNotifications();

        // Đồng bộ giá trị input trước khi đóng panel
        syncMobileToMainInputs();

        // Đóng panel
        if (window.mobileToolsPanel) {
            window.mobileToolsPanel.classList.remove('active');
            document.body.classList.remove('panel-open');
        }
    };

    // Hàm cập nhật nội dung panel mobile
    window.updateMobilePanel = function () {
        if (!window.mobileToolsPanel || !window.panelContent) return;

        // Xóa nội dung hiện tại
        window.panelContent.innerHTML = '';

        try {
            // Thêm lại các nút công cụ
            const toolButtons = document.querySelector('.tool-buttons');
            if (toolButtons) {
                const clonedButtons = toolButtons.cloneNode(true);
                window.panelContent.appendChild(clonedButtons);

                // Đánh dấu nút active
                if (window.currentMode) {
                    const activeButton = clonedButtons.querySelector(`#${window.currentMode}ModeButton`);
                    if (activeButton) {
                        activeButton.classList.add('active');
                    }
                }
            }

            // Thêm lại nút lịch sử
            const historyControls = document.querySelector('.history-controls');
            if (historyControls) {
                window.panelContent.appendChild(historyControls.cloneNode(true));
            }

            // Hiển thị panel tùy chọn tương ứng với chế độ hiện tại
            let optionsPanel = null;
            if (window.currentMode === 'erase' && window.eraseOptions) {
                optionsPanel = window.eraseOptions;
            } else if (window.currentMode === 'text' && window.textOptions) {
                optionsPanel = window.textOptions;
            } else if (window.currentMode === 'select' && window.selectOptions) {
                optionsPanel = window.selectOptions;
            }

            if (optionsPanel) {
                const clonedPanel = optionsPanel.cloneNode(true);
                clonedPanel.classList.remove('hidden');
                window.panelContent.appendChild(clonedPanel);
            }

            // Thiết lập sự kiện cho các phần tử trong panel
            setupMobilePanelEventListeners();
        } catch (error) {
            console.error("Lỗi khi cập nhật mobile panel:", error);
            window.panelContent.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #ef4444;">
                    <p>Đã xảy ra lỗi khi tải công cụ. Vui lòng làm mới trang.</p>
                    <button id="reloadButton" style="padding: 10px; margin-top: 10px; background: #4361ee; color: white; border: none; border-radius: 4px;">Làm mới</button>
                </div>
            `;

            const reloadButton = window.panelContent.querySelector('#reloadButton');
            if (reloadButton) {
                reloadButton.addEventListener('click', function () {
                    window.location.reload();
                });
            }
        }
    };

    // Thiết lập sự kiện cho các phần tử trong panel mobile
    function setupMobilePanelEventListeners() {
        if (!window.panelContent) return;

        // Thiết lập sự kiện cho các nút công cụ
        const toolButtons = window.panelContent.querySelectorAll('.tool-btn');
        toolButtons.forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.id;
                const originalButton = document.getElementById(id);
                if (originalButton) {
                    originalButton.click();
                }
            });
        });

        // Thiết lập sự kiện cho các nút lịch sử
        const historyButtons = window.panelContent.querySelectorAll('.history-btn');
        historyButtons.forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.id;
                const originalButton = document.getElementById(id);
                if (originalButton) {
                    originalButton.click();
                }
            });
        });

        // Thiết lập sự kiện cho input text
        const mobileTextContent = window.panelContent.querySelector('#textContent');
        const mainTextContent = document.getElementById('textContent');
        if (mobileTextContent && mainTextContent) {
            mobileTextContent.addEventListener('input', function () {
                mainTextContent.value = this.value;
            });
        }

        // Thiết lập sự kiện cho font size
        const mobileFontSize = window.panelContent.querySelector('#fontSize');
        const mainFontSize = document.getElementById('fontSize');
        if (mobileFontSize && mainFontSize) {
            // Đồng bộ giá trị ban đầu
            mobileFontSize.value = mainFontSize.value;

            // Sự kiện input
            mobileFontSize.addEventListener('input', function () {
                mainFontSize.value = this.value;
                applyFontSizeToSelectedText(parseInt(this.value));
            });

            // Sự kiện tăng/giảm
            const upBtn = mobileFontSize.parentElement?.querySelector('.number-up');
            const downBtn = mobileFontSize.parentElement?.querySelector('.number-down');

            if (upBtn) {
                upBtn.addEventListener('click', function () {
                    const newValue = parseInt(mobileFontSize.value) + 1;
                    mobileFontSize.value = newValue;
                    mainFontSize.value = newValue;
                    applyFontSizeToSelectedText(newValue);
                });
            }

            if (downBtn) {
                downBtn.addEventListener('click', function () {
                    const newValue = Math.max(parseInt(mobileFontSize.value) - 1, 8);
                    mobileFontSize.value = newValue;
                    mainFontSize.value = newValue;
                    applyFontSizeToSelectedText(newValue);
                });
            }
        }

        // Thiết lập sự kiện cho màu chữ
        const mobileTextColor = window.panelContent.querySelector('#textColor');
        const mainTextColor = document.getElementById('textColor');
        if (mobileTextColor && mainTextColor) {
            mobileTextColor.addEventListener('input', function () {
                mainTextColor.value = this.value;

                // Áp dụng trực tiếp nếu có text object được chọn
                if (window.selectedTextObject) {
                    window.selectedTextObject.color = this.value;
                    if (typeof window.redrawCanvas === 'function') {
                        window.redrawCanvas();
                    }
                }
            });
        }

        // Thiết lập sự kiện cho font
        const mobileFontFamily = window.panelContent.querySelector('#fontFamily');
        const mainFontFamily = document.getElementById('fontFamily');
        if (mobileFontFamily && mainFontFamily) {
            mobileFontFamily.addEventListener('change', function () {
                mainFontFamily.value = this.value;

                // Áp dụng trực tiếp nếu có text object được chọn
                if (window.selectedTextObject) {
                    window.selectedTextObject.font = this.value;
                    if (typeof window.prepareTextObject === 'function') {
                        window.prepareTextObject(window.selectedTextObject);
                    }
                    if (typeof window.redrawCanvas === 'function') {
                        window.redrawCanvas();
                    }
                }
            });
        }

        // Thiết lập sự kiện cho căn lề
        const mobileAlignButtons = window.panelContent.querySelectorAll('input[name="textAlign"]');
        const mainAlignButtons = document.querySelectorAll('input[name="textAlign"]');

        mobileAlignButtons.forEach((btn, index) => {
            btn.addEventListener('change', function () {
                if (this.checked && mainAlignButtons[index]) {
                    mainAlignButtons[index].checked = true;

                    // Áp dụng trực tiếp nếu có text object được chọn
                    if (window.selectedTextObject) {
                        window.selectedTextObject.align = this.value;
                        if (typeof window.prepareTextObject === 'function') {
                            window.prepareTextObject(window.selectedTextObject);
                        }
                        if (typeof window.redrawCanvas === 'function') {
                            window.redrawCanvas();
                        }
                    }
                }
            });
        });
    }

    // Đồng bộ dữ liệu từ panel mobile sang panel chính
    function syncMobileToMainInputs() {
        if (!window.panelContent) return;

        // Đồng bộ nội dung text
        const mobileTextContent = window.panelContent.querySelector('#textContent');
        const mainTextContent = document.getElementById('textContent');
        if (mobileTextContent && mainTextContent && window.currentMode === 'text') {
            mainTextContent.value = mobileTextContent.value;
        }

        // Đồng bộ các giá trị khác nếu cần...
    }

    console.log("Đã sửa lỗi Mobile Panel");
}

// 5. Sửa lỗi Font Size
function fixFontSize() {
    // Hàm áp dụng kích thước chữ cho text object được chọn
    window.applyFontSizeToSelectedText = function (size) {
        if (!window.selectedTextObject || !window.canvas) return;

        // Cập nhật kích thước cho text object được chọn
        window.selectedTextObject.size = size;

        // Chuẩn bị lại text object
        if (typeof window.prepareTextObject === 'function') {
            window.prepareTextObject(window.selectedTextObject);
        }

        // Vẽ lại canvas để áp dụng thay đổi
        if (typeof window.redrawCanvas === 'function') {
            window.redrawCanvas();
        }

        // Lưu lại trạng thái mới
        if (typeof window.saveCanvasState === 'function') {
            window.saveCanvasState();
        }
    };

    // Cải thiện hàm handleInteractionStart để đọc đúng kích thước chữ
    const originalHandleInteractionStart = window.handleInteractionStart;

    window.handleInteractionStart = function (event) {
        if (window.currentMode === 'text') {
            const text = window.textContentInput.value;
            if (!text || !text.trim()) {
                if (typeof window.showToast === 'function') {
                    window.showToast("Vui lòng nhập nội dung chữ!");
                }
                return;
            }

            // Lấy vị trí
            let pos;
            if (typeof window.getEventPosition === 'function') {
                pos = window.getEventPosition(event);
                if (!pos) return;
            } else {
                // Fallback
                const rect = window.canvas.getBoundingClientRect();
                pos = {
                    x: (event.clientX - rect.left) * (window.canvas.width / rect.width),
                    y: (event.clientY - rect.top) * (window.canvas.height / rect.height)
                };
            }

            // Đảm bảo đọc giá trị fontSize từ input
            const fontSize = parseInt(window.fontSizeInput.value) || 24;

            // Tạo đối tượng text mới với size chính xác
            const newTextObject = {
                id: Date.now(),
                text: text,
                x: pos.x,
                y: pos.y,
                color: window.textColorInput.value,
                size: fontSize,
                font: window.fontFamilyInput.value,
                align: typeof window.getTextAlign === 'function' ? window.getTextAlign() : 'left',
                lines: [],
                width: 0,
                height: 0
            };

            // Chuẩn bị và thêm text object
            if (typeof window.prepareTextObject === 'function') {
                window.prepareTextObject(newTextObject);
            }

            window.textObjects.push(newTextObject);
            window.selectedTextObject = newTextObject;

            // Vẽ lại và lưu trạng thái
            if (typeof window.redrawCanvas === 'function') {
                window.redrawCanvas();
            }

            if (typeof window.saveCanvasState === 'function') {
                window.saveCanvasState();
            }

            return;
        }

        // Gọi hàm gốc cho các trường hợp khác
        if (originalHandleInteractionStart) {
            originalHandleInteractionStart.call(this, event);
        }
    };

    console.log("Đã sửa lỗi Font Size");
}

// 6. Sửa lỗi thông báo
function fixNotifications() {
    // Ghi đè hàm showToast để đảm bảo thông báo biến mất
    window.showToast = function (message) {
        // Xóa bỏ timer cũ nếu có
        clearTimeout(window.toastTimer);

        // Tìm toast element
        if (!window.toastNotification) return;

        const toastMsg = window.toastNotification.querySelector('.toast-message');
        if (toastMsg) {
            toastMsg.textContent = message;
        } else {
            window.toastNotification.textContent = message;
        }

        // Hiển thị toast
        window.toastNotification.classList.add('show');

        // Đặt timer để ẩn toast sau 2 giây
        window.toastTimer = setTimeout(() => {
            window.toastNotification.classList.remove('show');
        }, 2000);
    };

    // Thêm hàm mới để xóa bỏ tất cả thông báo
    window.clearNotifications = function () {
        clearNotifications();
    };

    function clearNotifications() {
        // Xóa toast notification
        if (window.toastNotification) {
            window.toastNotification.classList.remove('show');
        }

        // Xóa các thông báo khác nếu có
        const mobileNotifications = document.querySelectorAll('.mobile-notification');
        mobileNotifications.forEach(notification => {
            notification.remove();
        });
    }

    console.log("Đã sửa lỗi thông báo");
}

// 7. Sửa lỗi chức năng lưu
function fixSaveFunction() {
    // Cải thiện hàm lưu ảnh
    window.handleSave = function () {
        if (!window.originalImage && !window.currentCanvasImageData && (!window.textObjects || window.textObjects.length === 0)) {
            window.showToast("Chưa có gì để lưu!");
            return;
        }

        // Ẩn đường viền selection khi lưu
        const tempSelected = window.selectedTextObject;
        window.selectedTextObject = null;
        if (typeof window.redrawCanvas === 'function') window.redrawCanvas();

        setTimeout(() => {
            const imageName = prompt("Nhập tên file ảnh:", "comic_edited.png") || "comic_edited.png";
            try {
                const dataURL = window.canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = imageName.endsWith('.png') ? imageName : imageName + '.png';
                link.href = dataURL;
                link.click();
                window.showToast(`Ảnh "${link.download}" đã được lưu.`);
            } catch (e) {
                console.error("Lỗi khi lưu:", e);
                window.showToast("Lỗi khi lưu ảnh. Vui lòng thử lại!");
            }

            // Khôi phục selection
            window.selectedTextObject = tempSelected;
            if (window.selectedTextObject && typeof window.redrawCanvas === 'function') {
                window.redrawCanvas();
            }
        }, 50);
    };

    // Thêm nút lưu ảnh cho mobile
    addMobileSaveButton();

    function addMobileSaveButton() {
        // Kiểm tra nếu đã có nút lưu cho mobile
        if (document.querySelector('.mobile-save-button')) {
            return;
        }

        // Tạo nút lưu ảnh cho mobile
        const saveButton = document.createElement('button');
        saveButton.className = 'mobile-save-button';
        saveButton.innerHTML = '<i class="fas fa-save"></i>';
        saveButton.title = 'Lưu ảnh';

        // Thêm CSS inline
        saveButton.style.cssText = `
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background-color: #4361ee;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            border: none;
            z-index: 15;
        `;

        // Thêm sự kiện click
        saveButton.addEventListener('click', function () {
            if (typeof window.handleSave === 'function') {
                window.handleSave();
            }
        });

        // Thêm vào body
        document.body.appendChild(saveButton);
    }

    console.log("Đã sửa lỗi chức năng lưu");
}

// 8. Thiết lập lại sự kiện cho các thành phần
function reattachEventListeners() {
    // Gắn lại sự kiện cho các nút công cụ
    if (window.eraseModeButton) {
        window.eraseModeButton.addEventListener('click', window.handleEraseModeClick);
    }

    if (window.textModeButton) {
        window.textModeButton.addEventListener('click', window.handleTextModeClick);
    }

    if (window.selectModeButton) {
        window.selectModeButton.addEventListener('click', window.handleSelectModeClick);
    }

    // Gắn lại sự kiện cho các nút lịch sử
    if (window.undoButton && typeof window.undo === 'function') {
        window.undoButton.addEventListener('click', window.undo);
    }

    if (window.redoButton && typeof window.redo === 'function') {
        window.redoButton.addEventListener('click', window.redo);
    }

    if (window.resetButton && typeof window.handleReset === 'function') {
        window.resetButton.addEventListener('click', window.handleReset);
    }

    // Gắn lại sự kiện cho nút lưu
    if (window.saveButton) {
        window.saveButton.addEventListener('click', window.handleSave);
    }

    // Gắn lại sự kiện cho mobile toolbar
    if (window.toolbarToggle) {
        window.toolbarToggle.addEventListener('click', window.handleMobileToolbarToggle);
    }

    // Gắn lại sự kiện cho nút đóng panel
    if (window.panelClose) {
        window.panelClose.addEventListener('click', window.handleMobilePanelClose);
    }

    // Gắn lại sự kiện tương tác canvas
    if (window.canvas) {
        window.canvas.addEventListener('mousedown', window.handleInteractionStart);
        window.canvas.addEventListener('touchstart', window.handleInteractionStart, { passive: false });

        if (typeof window.handleInteractionMove === 'function') {
            window.canvas.addEventListener('mousemove', window.handleInteractionMove);
            window.canvas.addEventListener('touchmove', window.handleInteractionMove, { passive: false });
        }

        if (typeof window.handleInteractionEnd === 'function') {
            window.canvas.addEventListener('mouseup', window.handleInteractionEnd);
            window.canvas.addEventListener('touchend', window.handleInteractionEnd, { passive: false });
        }
    }

    console.log("Đã thiết lập lại sự kiện cho các thành phần");
}

// 9. Áp dụng CSS cố định
function applyFixedCSS() {
    // Kiểm tra xem đã có style fix chưa
    if (document.getElementById('all-in-one-fixed-styles')) {
        return;
    }

    // Tạo thẻ style mới
    const styleEl = document.createElement('style');
    styleEl.id = 'all-in-one-fixed-styles';

    // Thêm CSS
    styleEl.textContent = `
        /* Mobile panel styles */
        .mobile-tools-panel {
            display: block !important;
            height: auto;
            max-height: 80vh;
            transform: translateY(100%);
            transition: transform 0.3s ease;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            z-index: 9999 !important;
        }
        
        .mobile-tools-panel.active {
            transform: translateY(0) !important;
            bottom: 0 !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
        
        .panel-content {
            display: block !important;
            min-height: 200px;
            padding: 16px;
            overflow-y: auto;
            max-height: 60vh;
        }
        
        .panel-header {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 16px !important;
            background-color: white !important;
            position: sticky !important;
            top: 0 !important;
            z-index: 10 !important;
            border-bottom: 1px solid #e5e7eb !important;
        }
        
        /* Mobile tools */
        .panel-content .tool-buttons {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 8px !important;
            margin-bottom: 16px !important;
        }
        
        .panel-content .history-controls {
            display: flex !important;
            justify-content: center !important;
            gap: 16px !important;
            margin-bottom: 16px !important;
        }
        
        .panel-content .tool-options {
            display: block !important;
            margin-top: 16px !important;
        }
        
        /* Mobile save button */
        .mobile-save-button {
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background-color: #4361ee;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            border: none;
            z-index: 15;
            animation: fadeIn 0.3s ease;
        }
        
        .mobile-save-button:active {
            transform: scale(0.95);
        }
        
        /* Hiệu ứng xuất hiện */
        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
        }
        
        /* Cải thiện toast trên mobile */
        @media (max-width: 768px) {
            .toast-notification {
                padding: 10px 16px;
                border-radius: 8px;
                bottom: 150px !important; /* Đặt cao hơn các nút */
                width: auto;
                max-width: 90%;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 9999;
            }
            
            /* Đảm bảo toast không bị che khuất */
            .toast-notification.show {
                bottom: 150px !important;
            }
            
            /* Giúp căn giữa canvas trên mobile */
            .canvas-container {
                display: flex;
                align-items: center;
                justify-content: center;
            }
        }
        
        /* Fix cho Safari */
        @supports (-webkit-touch-callout: none) {
            .mobile-tools-panel {
                padding-bottom: 30px !important;
            }
        }
    `;

    // Thêm vào head
    document.head.appendChild(styleEl);

    console.log("Đã áp dụng CSS cố định");
}

// 10. Hiển thị xác nhận bản sửa lỗi đã được áp dụng
function showFixConfirmation() {
    // Badge cho bản sửa lỗi
    const badge = document.createElement('div');
    badge.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(16, 185, 129, 0.8);
        color: white;
        padding: 5px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: bold;
        z-index: 9999;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    `;
    badge.textContent = 'Tất cả sửa lỗi đã áp dụng';
    document.body.appendChild(badge);

    // Tự động ẩn sau 5 giây
    setTimeout(() => {
        badge.style.opacity = '0';
        badge.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            badge.remove();
        }, 500);
    }, 5000);

    console.log("Đã hiển thị xác nhận bản sửa lỗi");
}