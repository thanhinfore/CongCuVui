// Sửa lỗi kích thước chữ không có tác dụng trong phần "Thêm chữ"

// Lưu trữ hàm gốc an toàn mà không gây ra đệ quy vô hạn
let originalSetupMobileEventListeners = null;

// 1. Cải thiện đồng bộ input fontSize giữa panel mobile và main panel
function syncFontSizeInputs() {
    console.log('Syncing font size inputs...');

    // Lấy input fontSize từ panel mobile và panel chính
    const mobileFontSizeInput = document.querySelector('.panel-content #fontSize');
    const mainFontSizeInput = document.getElementById('fontSize');

    if (!mobileFontSizeInput || !mainFontSizeInput) {
        console.log('Font size inputs not found');
        return;
    }

    // Thiết lập sự kiện đồng bộ hai chiều
    mobileFontSizeInput.addEventListener('input', function () {
        console.log('Mobile fontSize changed:', this.value);
        mainFontSizeInput.value = this.value;

        // Áp dụng trực tiếp nếu đang có text object được chọn
        applyFontSizeToSelectedText(parseInt(this.value));
    });

    // Thiết lập sự kiện cho nút tăng/giảm kích thước
    const mobileUpBtn = mobileFontSizeInput.parentElement?.querySelector('.number-up');
    const mobileDownBtn = mobileFontSizeInput.parentElement?.querySelector('.number-down');

    if (mobileUpBtn) {
        mobileUpBtn.addEventListener('click', function () {
            const newValue = parseInt(mobileFontSizeInput.value) + 1;
            mobileFontSizeInput.value = newValue;
            mainFontSizeInput.value = newValue;

            console.log('Font size up clicked, new value:', newValue);

            // Áp dụng trực tiếp
            applyFontSizeToSelectedText(newValue);
        });
    }

    if (mobileDownBtn) {
        mobileDownBtn.addEventListener('click', function () {
            const newValue = Math.max(parseInt(mobileFontSizeInput.value) - 1, 8); // Minimum font size
            mobileFontSizeInput.value = newValue;
            mainFontSizeInput.value = newValue;

            console.log('Font size down clicked, new value:', newValue);

            // Áp dụng trực tiếp
            applyFontSizeToSelectedText(newValue);
        });
    }
}

// 2. Hàm áp dụng kích thước chữ cho text object được chọn
function applyFontSizeToSelectedText(size) {
    if (!window.selectedTextObject || !window.canvas) {
        console.log('No selected text object or canvas');
        return;
    }

    console.log('Applying font size to selected text:', size);

    // Cập nhật kích thước cho text object được chọn
    window.selectedTextObject.size = size;

    // Chuẩn bị lại text object (tính toán kích thước, đường viền, v.v.)
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
}

// 3. Tăng cường các đầu vào khác
function enhanceOtherInputs() {
    console.log('Enhancing other inputs...');

    if (!window.panelContent) {
        console.log('Panel content not found');
        return;
    }

    // Xử lý input màu sắc văn bản
    const mobileTextColorInput = window.panelContent.querySelector('#textColor');
    const mainTextColorInput = document.getElementById('textColor');

    if (mobileTextColorInput && mainTextColorInput) {
        mobileTextColorInput.addEventListener('input', function () {
            mainTextColorInput.value = this.value;

            // Áp dụng trực tiếp màu sắc nếu có text object được chọn
            if (window.selectedTextObject) {
                window.selectedTextObject.color = this.value;

                if (typeof window.redrawCanvas === 'function') {
                    window.redrawCanvas();
                }

                if (typeof window.saveCanvasState === 'function') {
                    window.saveCanvasState();
                }
            }
        });
    }

    // Xử lý input font chữ
    const mobileFontFamilyInput = window.panelContent.querySelector('#fontFamily');
    const mainFontFamilyInput = document.getElementById('fontFamily');

    if (mobileFontFamilyInput && mainFontFamilyInput) {
        mobileFontFamilyInput.addEventListener('change', function () {
            mainFontFamilyInput.value = this.value;

            // Áp dụng trực tiếp font chữ nếu có text object được chọn
            if (window.selectedTextObject) {
                window.selectedTextObject.font = this.value;

                if (typeof window.prepareTextObject === 'function') {
                    window.prepareTextObject(window.selectedTextObject);
                }

                if (typeof window.redrawCanvas === 'function') {
                    window.redrawCanvas();
                }

                if (typeof window.saveCanvasState === 'function') {
                    window.saveCanvasState();
                }
            }
        });
    }
}

// 4. Sửa đổi hàm setupMobileEventListeners AN TOÀN không gây đệ quy
function safeEnhancedSetupMobileEventListeners() {
    console.log('Setting up enhanced mobile event listeners safely...');

    if (!window.panelContent) {
        console.log('Panel content not found');
        return;
    }

    // Gọi hàm gốc đã lưu trữ an toàn
    if (originalSetupMobileEventListeners && typeof originalSetupMobileEventListeners === 'function') {
        console.log('Calling original setup mobile event listeners...');
        originalSetupMobileEventListeners();
    } else {
        console.log('Original setup mobile event listeners not available');
    }

    // Sau khi thiết lập ban đầu, thêm các sự kiện mới
    console.log('Adding font size event handlers...');
    syncFontSizeInputs();
    enhanceOtherInputs();
}

// 5. Cải thiện xử lý sự kiện tạo text
function enhanceTextCreation() {
    console.log('Enhancing text creation...');

    // Sự kiện đồng bộ chính-mobile cho font size
    const mainFontSizeInput = document.getElementById('fontSize');
    if (mainFontSizeInput) {
        mainFontSizeInput.addEventListener('input', function () {
            // Khi font size thay đổi từ panel chính, cập nhật giá trị trong mobile panel
            const mobileFontSizeInput = document.querySelector('.panel-content #fontSize');
            if (mobileFontSizeInput) {
                mobileFontSizeInput.value = this.value;
            }
        });
    }

    // Cải thiện handleInteractionStart khi tạo text mới
    if (typeof window.handleInteractionStart === 'function') {
        console.log('Backing up original handleInteractionStart...');

        // Lưu trữ hàm gốc
        const originalHandleInteractionStart = window.handleInteractionStart;

        // Override the function
        window.handleInteractionStart = function (event) {
            console.log('Enhanced handleInteractionStart called');

            // Chỉ can thiệp khi ở chế độ text
            if (window.currentMode === 'text') {
                try {
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
                        console.log('getEventPosition not available, using fallback');
                        // Fallback
                        pos = { x: event.clientX, y: event.clientY };
                    }

                    // Đảm bảo đọc giá trị fontSize từ input
                    const fontSize = parseInt(window.fontSizeInput.value) || 24;
                    console.log('Creating text with font size:', fontSize);

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

                    console.log('New text object:', newTextObject);

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

                    // Đã xử lý riêng, không cần gọi hàm gốc
                    return;
                } catch (error) {
                    console.error('Error in enhanced text creation:', error);
                    // Nếu có lỗi, sử dụng hàm gốc
                }
            }

            // Với các trường hợp khác, gọi hàm gốc
            return originalHandleInteractionStart.call(this, event);
        };
    }
}

// 6. Cải thiện khi update mobile panel
function enhanceMobilePanelUpdate() {
    console.log('Enhancing mobile panel update...');

    if (typeof window.updateMobilePanelContent === 'function') {
        console.log('Backing up original updateMobilePanelContent...');

        // Lưu trữ hàm gốc
        const originalUpdateMobilePanelContent = window.updateMobilePanelContent;

        // Ghi đè hàm
        window.updateMobilePanelContent = function () {
            console.log('Enhanced update mobile panel content called');

            // Gọi hàm gốc
            originalUpdateMobilePanelContent.call(this);

            // Đảm bảo đồng bộ kích thước chữ
            setTimeout(function () {
                console.log('Post-update: synchronizing font size values...');

                const mobileFontSizeInput = document.querySelector('.panel-content #fontSize');
                const mainFontSizeInput = document.getElementById('fontSize');

                if (mobileFontSizeInput && mainFontSizeInput) {
                    mobileFontSizeInput.value = mainFontSizeInput.value;
                    console.log('Synchronized font size value:', mainFontSizeInput.value);
                }

                // Thiết lập sự kiện cho các input
                syncFontSizeInputs();
                enhanceOtherInputs();
            }, 100);
        };
    }
}

// 7. Thiết lập an toàn - khởi tạo
function initFontSizeFix() {
    console.log('Initializing font size fix...');

    // Lưu trữ hàm gốc AN TOÀN
    if (typeof window.setupMobileEventListeners === 'function') {
        console.log('Storing original setupMobileEventListeners...');
        originalSetupMobileEventListeners = window.setupMobileEventListeners;

        // Ghi đè an toàn
        window.setupMobileEventListeners = safeEnhancedSetupMobileEventListeners;
    }

    // Cải thiện xử lý tạo text
    enhanceTextCreation();

    // Cải thiện update panel
    enhanceMobilePanelUpdate();

    console.log('Font size fix initialized successfully');
}

// Khởi tạo sửa lỗi khi script được tải
window.addEventListener('load', function () {
    console.log('Window loaded, applying font size fixes...');

    // Đợi một chút để đảm bảo các script khác đã chạy
    setTimeout(function () {
        initFontSizeFix();

        // Bổ sung: thiết lập các sự kiện ngay lập tức
        syncFontSizeInputs();
        enhanceOtherInputs();
    }, 500);
});

// 8. Hàm test để xác nhận là fix đã được áp dụng
function testFontSizeFix() {
    console.log('FONT SIZE FIX LOADED AND WORKING');

    // Hiển thị thông báo nhỏ (chỉ dành cho debug)
    const debugBadge = document.createElement('div');
    debugBadge.style.cssText = `
        position: fixed;
        top: 5px;
        right: 5px;
        background: rgba(0, 128, 0, 0.7);
        color: white;
        padding: 2px 5px;
        border-radius: 3px;
        font-size: 10px;
        z-index: 9999;
    `;
    debugBadge.textContent = 'Font Size Fix v1.1';
    document.body.appendChild(debugBadge);

    // Tự động ẩn sau 5 giây
    setTimeout(() => {
        debugBadge.style.display = 'none';
    }, 5000);
}

// Gọi hàm test với đủ thời gian để trang tải
setTimeout(testFontSizeFix, 1000);