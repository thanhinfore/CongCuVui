// Sửa lỗi hiển thị nội dung panel mobile không đầy đủ

// Cập nhật hàm xử lý mở panel công cụ
function handleMobileToolbarToggle() {
    // Xóa thông báo hiện tại (nếu có)
    if (typeof clearMobileNotifications === 'function') {
        clearMobileNotifications();
    }

    // Đảm bảo panel content được reset trước khi cập nhật nội dung
    if (panelContent) {
        panelContent.innerHTML = '';
    }

    // Đảm bảo mobileToolsPanel và panelContent đã được tham chiếu đúng
    if (!mobileToolsPanel || !panelContent) {
        console.error('Không thể tìm thấy panel hoặc panel content');
        // Thử lấy lại tham chiếu
        mobileToolsPanel = document.getElementById('mobileToolsPanel');
        panelContent = document.querySelector('.panel-content');

        if (!mobileToolsPanel || !panelContent) {
            console.error('Vẫn không thể tìm thấy panel sau khi thử lại');
            return;
        }
    }

    // Áp dụng các style để đảm bảo panel hiển thị đúng
    mobileToolsPanel.style.display = 'block';
    mobileToolsPanel.style.visibility = 'visible';
    mobileToolsPanel.style.opacity = '1';

    // Cập nhật nội dung panel
    updateMobilePanelContent();

    // Kích hoạt trạng thái active cho panel
    mobileToolsPanel.classList.add('active');
    document.body.classList.add('panel-open');

    // Log để debug
    console.log('Panel đã được mở, kích thước nội dung:', panelContent.children.length);
}

// Cập nhật hàm tạo nội dung panel để thêm kiểm tra lỗi và log
function updateMobilePanelContent() {
    if (!panelContent || !mobileToolsPanel) {
        console.error('Panel content hoặc mobile tools panel không tồn tại');
        return;
    }

    if (!mobileToolsPanel.classList.contains('active') && !document.body.classList.contains('panel-open')) {
        console.log('Đang cập nhật panel khi nó chưa active');
    }

    // Xóa nội dung hiện tại
    panelContent.innerHTML = '';
    console.log('Đã xóa nội dung panel cũ');

    try {
        // Thêm lại các nút công cụ
        const toolButtons = document.querySelector('.tool-buttons');
        if (toolButtons) {
            const clonedButtons = toolButtons.cloneNode(true);
            panelContent.appendChild(clonedButtons);
            console.log('Đã thêm nút công cụ');
        } else {
            console.error('Không tìm thấy .tool-buttons');
        }

        // Thêm lại nút lịch sử
        const historyControls = document.querySelector('.history-controls');
        if (historyControls) {
            const clonedHistory = historyControls.cloneNode(true);
            panelContent.appendChild(clonedHistory);
            console.log('Đã thêm nút lịch sử');
        } else {
            console.error('Không tìm thấy .history-controls');
        }

        // Đánh dấu nút công cụ đang active
        const activeToolButton = panelContent.querySelector(`#${currentMode}ModeButton`);
        if (activeToolButton) {
            activeToolButton.classList.add('active');
            console.log('Đã đánh dấu nút active:', currentMode);
        } else {
            console.log('Không tìm thấy nút active cho mode:', currentMode);
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
            console.log('Đã thêm panel tùy chọn:', optionsPanel.id);
        } else {
            console.log('Không tìm thấy panel tùy chọn cho mode:', currentMode);
        }

        // Đảm bảo panel có đủ kích thước tối thiểu
        if (panelContent.children.length === 0) {
            console.error('Không có phần tử nào được thêm vào panel content!');
            // Thêm nội dung mặc định nếu không có gì
            panelContent.innerHTML = `
                <div class="fallback-content" style="padding: 20px; text-align: center;">
                    <p>Không thể tải công cụ. Vui lòng làm mới trang.</p>
                    <button id="reloadButton" style="padding: 10px; margin-top: 10px; background: #4361ee; color: white; border: none; border-radius: 4px;">Làm mới</button>
                </div>
            `;

            // Thêm sự kiện cho nút reload
            const reloadButton = panelContent.querySelector('#reloadButton');
            if (reloadButton) {
                reloadButton.addEventListener('click', function () {
                    window.location.reload();
                });
            }
        }

        // Thiết lập lại event listeners cho các phần tử vừa thêm
        setupMobileEventListeners();

        // Thiết lập event listeners cho các tính năng nâng cấp
        setupEnhancedMobileListeners();

        console.log('Đã thiết lập event listeners');
    } catch (error) {
        console.error('Lỗi khi cập nhật nội dung panel:', error);
        // Hiển thị thông báo lỗi trong panel
        panelContent.innerHTML = `
            <div style="padding: 20px; color: #ef4444;">
                <p>Đã xảy ra lỗi: ${error.message}</p>
                <button id="reloadButton" style="padding: 10px; margin-top: 10px; background: #4361ee; color: white; border: none; border-radius: 4px;">Làm mới trang</button>
            </div>
        `;

        // Thêm sự kiện cho nút reload
        const reloadButton = panelContent.querySelector('#reloadButton');
        if (reloadButton) {
            reloadButton.addEventListener('click', function () {
                window.location.reload();
            });
        }
    }
}

// Sửa đổi CSS để đảm bảo nội dung panel hiển thị đúng
function fixMobilePanelStyles() {
    // Kiểm tra xem đã có style fix chưa
    if (document.getElementById('panel-content-fix-styles')) {
        return;
    }

    // Tạo thẻ style mới
    const styleEl = document.createElement('style');
    styleEl.id = 'panel-content-fix-styles';

    // Thêm CSS
    styleEl.textContent = `
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
        
        /* Đảm bảo các công cụ hiển thị đúng */
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
        
        /* Fix cho Safari */
        @supports (-webkit-touch-callout: none) {
            .mobile-tools-panel {
                padding-bottom: 30px !important;
            }
        }
    `;

    // Thêm vào head
    document.head.appendChild(styleEl);
}

// Cập nhật DOM khi tài liệu đã tải xong
document.addEventListener('DOMContentLoaded', function () {
    // Fix styles ngay khi trang tải xong
    fixMobilePanelStyles();

    // Ghi đè các hàm cần thiết
    window.handleMobileToolbarToggle = handleMobileToolbarToggle;
    window.updateMobilePanelContent = updateMobilePanelContent;
});

// Thực thi ngay lập tức để sửa lỗi cho trang đã tải xong
fixMobilePanelStyles();

// Thêm hàm khởi tạo lại DOM references nếu cần
function reinitDOMReferences() {
    // Core elements
    imageLoader = document.getElementById('imageLoader');
    canvas = document.getElementById('imageCanvas');
    if (canvas) ctx = canvas.getContext('2d');

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

    // Mobile UI elements - đặc biệt chú ý tới những phần tử này
    toolbarToggle = document.getElementById('toolbarToggle');
    mobileToolsPanel = document.getElementById('mobileToolsPanel');
    panelClose = document.querySelector('.panel-close');
    panelContent = document.querySelector('.panel-content');

    console.log("Đã khởi tạo lại DOM references:", {
        mobileToolsPanel: !!mobileToolsPanel,
        panelContent: !!panelContent,
        toolbarToggle: !!toolbarToggle
    });
}

// Gọi lại reinitDOMReferences sau khi trang đã tải xong
setTimeout(reinitDOMReferences, 500);

// Thêm một nút làm mới để khắc phục trường hợp lỗi
function addEmergencyReloadButton() {
    // Kiểm tra xem đã có nút emergency chưa
    if (document.getElementById('emergency-reload')) {
        return;
    }

    const button = document.createElement('button');
    button.id = 'emergency-reload';
    button.innerHTML = '<i class="fas fa-sync-alt"></i>';
    button.title = 'Làm mới trang nếu có lỗi';

    // Thêm CSS cho nút
    button.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: rgba(239, 68, 68, 0.9);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        z-index: 99999;
        font-size: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    `;

    // Thêm sự kiện click
    button.addEventListener('click', function () {
        window.location.reload();
    });

    // Thêm vào body
    document.body.appendChild(button);
}

// Thêm nút làm mới khẩn cấp
setTimeout(addEmergencyReloadButton, 1000);

// ==================== ENHANCED MOBILE LISTENERS ====================
// Hỗ trợ các tính năng nâng cấp trên mobile

function setupEnhancedMobileListeners() {
    if (!panelContent) return;

    // Erase mode buttons trong mobile panel
    const mobileEraseModeButtons = panelContent.querySelectorAll('input[name="eraseMode"]');
    mobileEraseModeButtons.forEach(btn => {
        btn.addEventListener('change', function(e) {
            // Sync với original
            const originalBtn = document.querySelector(`.controls-panel input[name="eraseMode"][value="${e.target.value}"]`);
            if (originalBtn) {
                originalBtn.checked = true;
                originalBtn.dispatchEvent(new Event('change'));
            }
        });
    });

    // Brush size slider
    const mobileBrushSize = panelContent.querySelector('#brushSize');
    if (mobileBrushSize) {
        mobileBrushSize.addEventListener('input', function(e) {
            const originalInput = document.querySelector('.controls-panel #brushSize');
            if (originalInput) {
                originalInput.value = e.target.value;
                originalInput.dispatchEvent(new Event('input'));
            }
            // Update display value
            const displayValue = panelContent.querySelector('#brushSizeValue');
            if (displayValue) {
                displayValue.textContent = e.target.value + 'px';
            }
        });
    }

    // Pick color button
    const mobilePickColorBtn = panelContent.querySelector('#pickColorBtn');
    if (mobilePickColorBtn) {
        mobilePickColorBtn.addEventListener('click', function() {
            // Close mobile panel first
            if (mobileToolsPanel) {
                mobileToolsPanel.classList.remove('active');
                document.body.classList.remove('panel-open');
            }
            // Then activate color picker
            const originalBtn = document.querySelector('.controls-panel #pickColorBtn');
            if (originalBtn) {
                originalBtn.click();
            } else if (typeof toggleColorPicker === 'function') {
                toggleColorPicker();
            }
        });
    }

    // Bold/Italic buttons
    const mobileBoldBtn = panelContent.querySelector('#boldBtn');
    if (mobileBoldBtn) {
        mobileBoldBtn.addEventListener('click', function() {
            const originalBtn = document.querySelector('.controls-panel #boldBtn');
            if (originalBtn) {
                originalBtn.click();
            } else if (typeof toggleBold === 'function') {
                toggleBold();
            }
            this.classList.toggle('active');
        });
    }

    const mobileItalicBtn = panelContent.querySelector('#italicBtn');
    if (mobileItalicBtn) {
        mobileItalicBtn.addEventListener('click', function() {
            const originalBtn = document.querySelector('.controls-panel #italicBtn');
            if (originalBtn) {
                originalBtn.click();
            } else if (typeof toggleItalic === 'function') {
                toggleItalic();
            }
            this.classList.toggle('active');
        });
    }

    // Outline checkbox
    const mobileOutlineCheckbox = panelContent.querySelector('#enableOutline');
    if (mobileOutlineCheckbox) {
        mobileOutlineCheckbox.addEventListener('change', function() {
            const originalCheckbox = document.querySelector('.controls-panel #enableOutline');
            if (originalCheckbox) {
                originalCheckbox.checked = this.checked;
                originalCheckbox.dispatchEvent(new Event('change'));
            }
            // Toggle settings visibility
            const settings = panelContent.querySelector('#outlineSettings');
            if (settings) {
                settings.classList.toggle('active', this.checked);
            }
        });
    }

    // Shadow checkbox
    const mobileShadowCheckbox = panelContent.querySelector('#enableShadow');
    if (mobileShadowCheckbox) {
        mobileShadowCheckbox.addEventListener('change', function() {
            const originalCheckbox = document.querySelector('.controls-panel #enableShadow');
            if (originalCheckbox) {
                originalCheckbox.checked = this.checked;
                originalCheckbox.dispatchEvent(new Event('change'));
            }
            // Toggle settings visibility
            const settings = panelContent.querySelector('#shadowSettings');
            if (settings) {
                settings.classList.toggle('active', this.checked);
            }
        });
    }

    // Selected text action buttons
    const mobileEditBtn = panelContent.querySelector('#editSelectedTextBtn');
    if (mobileEditBtn) {
        mobileEditBtn.addEventListener('click', function() {
            if (mobileToolsPanel) {
                mobileToolsPanel.classList.remove('active');
                document.body.classList.remove('panel-open');
            }
            if (typeof openEditTextModal === 'function') {
                openEditTextModal();
            }
        });
    }

    const mobileDeleteBtn = panelContent.querySelector('#deleteSelectedTextBtn');
    if (mobileDeleteBtn) {
        mobileDeleteBtn.addEventListener('click', function() {
            if (typeof deleteSelectedText === 'function') {
                deleteSelectedText();
            }
            // Update selected text info visibility
            const infoPanel = panelContent.querySelector('#selectedTextInfo');
            if (infoPanel) {
                infoPanel.classList.add('hidden');
            }
        });
    }

    const mobileDuplicateBtn = panelContent.querySelector('#duplicateTextBtn');
    if (mobileDuplicateBtn) {
        mobileDuplicateBtn.addEventListener('click', function() {
            if (typeof duplicateSelectedText === 'function') {
                duplicateSelectedText();
            }
        });
    }

    // Sync outline/shadow color inputs
    syncEnhancedInputs();

    // Setup number inputs for new fields
    setupEnhancedNumberInputsMobile();

    console.log('Enhanced mobile listeners setup complete');
}

function syncEnhancedInputs() {
    // Outline color
    const mobileOutlineColor = panelContent?.querySelector('#outlineColor');
    if (mobileOutlineColor) {
        mobileOutlineColor.addEventListener('input', function() {
            const original = document.querySelector('.controls-panel #outlineColor');
            if (original) original.value = this.value;
        });
    }

    // Outline width
    const mobileOutlineWidth = panelContent?.querySelector('#outlineWidth');
    if (mobileOutlineWidth) {
        mobileOutlineWidth.addEventListener('change', function() {
            const original = document.querySelector('.controls-panel #outlineWidth');
            if (original) original.value = this.value;
        });
    }

    // Shadow color
    const mobileShadowColor = panelContent?.querySelector('#shadowColor');
    if (mobileShadowColor) {
        mobileShadowColor.addEventListener('input', function() {
            const original = document.querySelector('.controls-panel #shadowColor');
            if (original) original.value = this.value;
        });
    }

    // Shadow blur
    const mobileShadowBlur = panelContent?.querySelector('#shadowBlur');
    if (mobileShadowBlur) {
        mobileShadowBlur.addEventListener('change', function() {
            const original = document.querySelector('.controls-panel #shadowBlur');
            if (original) original.value = this.value;
        });
    }

    // Shadow offset X
    const mobileShadowOffsetX = panelContent?.querySelector('#shadowOffsetX');
    if (mobileShadowOffsetX) {
        mobileShadowOffsetX.addEventListener('change', function() {
            const original = document.querySelector('.controls-panel #shadowOffsetX');
            if (original) original.value = this.value;
        });
    }

    // Shadow offset Y
    const mobileShadowOffsetY = panelContent?.querySelector('#shadowOffsetY');
    if (mobileShadowOffsetY) {
        mobileShadowOffsetY.addEventListener('change', function() {
            const original = document.querySelector('.controls-panel #shadowOffsetY');
            if (original) original.value = this.value;
        });
    }
}

function setupEnhancedNumberInputsMobile() {
    if (!panelContent) return;

    const containers = panelContent.querySelectorAll('#outlineSettings .number-input-container, #shadowSettings .number-input-container');
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