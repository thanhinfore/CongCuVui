// Khôi phục chức năng các nút công cụ
(function () {
    console.log("Đang áp dụng bản sửa lỗi khôi phục các nút công cụ...");

    // Đảm bảo trang đã tải xong
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initButtonFix);
    } else {
        initButtonFix();
    }

    function initButtonFix() {
        // Đợi một chút để các script khác tải xong
        setTimeout(restoreButtonFunctions, 500);
    }

    function restoreButtonFunctions() {
        console.log("Khôi phục chức năng các nút công cụ...");

        // Lưu trữ tham chiếu đến các nút
        const eraseModeButton = document.getElementById('eraseModeButton');
        const textModeButton = document.getElementById('textModeButton');
        const selectModeButton = document.getElementById('selectModeButton');

        // Kiểm tra xem các nút có tồn tại không
        if (!eraseModeButton || !textModeButton || !selectModeButton) {
            console.error("Không thể tìm thấy các nút công cụ!");
            return;
        }

        // Khôi phục chức năng cho các nút
        eraseModeButton.addEventListener('click', function () {
            console.log("Nút Che chữ được nhấn");
            // Thiết lập mode
            window.currentMode = 'erase';

            // Cập nhật UI
            setActiveButton(eraseModeButton);
            hideAllOptionPanels();
            showOptionsPanel('eraseOptions');

            // Thiết lập con trỏ
            if (window.canvas) window.canvas.style.cursor = 'crosshair';

            // Cập nhật trạng thái
            if (window.selectedTextObject !== null) {
                window.selectedTextObject = null;
                if (typeof window.redrawCanvas === 'function') {
                    window.redrawCanvas();
                }
            }

            // Hiển thị thông báo
            if (typeof window.showToast === 'function') {
                window.showToast("Đã chọn công cụ Che Chữ");
            }
        });

        textModeButton.addEventListener('click', function () {
            console.log("Nút Thêm chữ được nhấn");
            // Thiết lập mode
            window.currentMode = 'text';

            // Cập nhật UI
            setActiveButton(textModeButton);
            hideAllOptionPanels();
            showOptionsPanel('textOptions');

            // Thiết lập con trỏ
            if (window.canvas) window.canvas.style.cursor = 'text';

            // Cập nhật trạng thái
            if (window.selectedTextObject !== null) {
                window.selectedTextObject = null;
                if (typeof window.redrawCanvas === 'function') {
                    window.redrawCanvas();
                }
            }

            // Hiển thị thông báo
            if (typeof window.showToast === 'function') {
                window.showToast("Đã chọn công cụ Thêm Chữ");
            }
        });

        selectModeButton.addEventListener('click', function () {
            console.log("Nút Di chuyển được nhấn");
            // Thiết lập mode
            window.currentMode = 'select';

            // Cập nhật UI
            setActiveButton(selectModeButton);
            hideAllOptionPanels();
            showOptionsPanel('selectOptions');

            // Thiết lập con trỏ
            if (window.canvas) window.canvas.style.cursor = 'default';

            // Hiển thị thông báo
            if (typeof window.showToast === 'function') {
                window.showToast("Đã chọn công cụ Chọn & Di Chuyển");
            }
        });

        // Phục hồi chức năng lưu ảnh
        const saveButton = document.getElementById('saveButton');
        if (saveButton) {
            saveButton.addEventListener('click', function () {
                if (typeof window.handleSave === 'function') {
                    window.handleSave();
                } else {
                    saveImage();
                }
            });
        }

        // Phục hồi chức năng các nút lịch sử
        const undoButton = document.getElementById('undoButton');
        const redoButton = document.getElementById('redoButton');
        const resetButton = document.getElementById('resetButton');

        if (undoButton) {
            undoButton.addEventListener('click', function () {
                if (typeof window.undo === 'function') {
                    window.undo();
                }
            });
        }

        if (redoButton) {
            redoButton.addEventListener('click', function () {
                if (typeof window.redo === 'function') {
                    window.redo();
                }
            });
        }

        if (resetButton) {
            resetButton.addEventListener('click', function () {
                if (typeof window.handleReset === 'function') {
                    window.handleReset();
                }
            });
        }

        // Phục hồi toolbar toggle cho mobile
        const toolbarToggle = document.getElementById('toolbarToggle');
        if (toolbarToggle) {
            toolbarToggle.addEventListener('click', function () {
                toggleMobileToolsPanel();
            });
        }

        // Phục hồi nút đóng panel mobile
        const panelClose = document.querySelector('.panel-close');
        if (panelClose) {
            panelClose.addEventListener('click', function () {
                closeMobileToolsPanel();
            });
        }

        console.log("Khôi phục chức năng các nút công cụ thành công!");
    }

    // Hàm hỗ trợ
    function setActiveButton(activeButton) {
        const buttons = [
            document.getElementById('eraseModeButton'),
            document.getElementById('textModeButton'),
            document.getElementById('selectModeButton')
        ];

        buttons.forEach(button => {
            if (button) button.classList.remove('active');
        });

        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    function hideAllOptionPanels() {
        const panels = [
            document.getElementById('eraseOptions'),
            document.getElementById('textOptions'),
            document.getElementById('selectOptions')
        ];

        panels.forEach(panel => {
            if (panel) panel.classList.add('hidden');
        });
    }

    function showOptionsPanel(panelId) {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.remove('hidden');
        }
    }

    function toggleMobileToolsPanel() {
        const mobilePanel = document.getElementById('mobileToolsPanel');
        if (!mobilePanel) return;

        // Xóa nội dung hiện tại
        const panelContent = mobilePanel.querySelector('.panel-content');
        if (panelContent) {
            panelContent.innerHTML = '';

            // Thêm lại các nút công cụ
            const toolButtons = document.querySelector('.tool-buttons');
            if (toolButtons) {
                panelContent.appendChild(toolButtons.cloneNode(true));
            }

            // Thêm lại nút lịch sử
            const historyControls = document.querySelector('.history-controls');
            if (historyControls) {
                panelContent.appendChild(historyControls.cloneNode(true));
            }

            // Thêm panel tùy chọn hiện tại
            let optionsPanel;
            if (window.currentMode === 'erase') {
                optionsPanel = document.getElementById('eraseOptions');
            } else if (window.currentMode === 'text') {
                optionsPanel = document.getElementById('textOptions');
            } else if (window.currentMode === 'select') {
                optionsPanel = document.getElementById('selectOptions');
            }

            if (optionsPanel) {
                const clonedPanel = optionsPanel.cloneNode(true);
                clonedPanel.classList.remove('hidden');
                panelContent.appendChild(clonedPanel);
            }

            // Thiết lập sự kiện cho các phần tử trong panel
            setupPanelEventListeners(panelContent);
        }

        // Hiển thị panel
        mobilePanel.classList.add('active');
        document.body.classList.add('panel-open');
    }

    function closeMobileToolsPanel() {
        const mobilePanel = document.getElementById('mobileToolsPanel');
        if (mobilePanel) {
            mobilePanel.classList.remove('active');
            document.body.classList.remove('panel-open');
        }
    }

    function setupPanelEventListeners(panelContent) {
        if (!panelContent) return;

        // Thiết lập sự kiện cho các nút công cụ
        const toolButtons = panelContent.querySelectorAll('.tool-btn');
        toolButtons.forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.id;
                const originalButton = document.getElementById(id);
                if (originalButton) {
                    originalButton.click();
                    closeMobileToolsPanel();
                }
            });
        });

        // Thiết lập sự kiện cho các nút lịch sử
        const historyButtons = panelContent.querySelectorAll('.history-btn');
        historyButtons.forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.id;
                const originalButton = document.getElementById(id);
                if (originalButton) {
                    originalButton.click();
                }
            });
        });

        // Thiết lập font size controls
        const fontSizeInput = panelContent.querySelector('#fontSize');
        if (fontSizeInput) {
            const originalInput = document.getElementById('fontSize');

            fontSizeInput.addEventListener('input', function () {
                if (originalInput) {
                    originalInput.value = this.value;
                }
            });

            const upBtn = fontSizeInput.parentElement?.querySelector('.number-up');
            const downBtn = fontSizeInput.parentElement?.querySelector('.number-down');

            if (upBtn) {
                upBtn.addEventListener('click', function () {
                    fontSizeInput.value = parseInt(fontSizeInput.value) + 1;
                    if (originalInput) {
                        originalInput.value = fontSizeInput.value;
                    }
                });
            }

            if (downBtn) {
                downBtn.addEventListener('click', function () {
                    fontSizeInput.value = Math.max(parseInt(fontSizeInput.value) - 1, 8);
                    if (originalInput) {
                        originalInput.value = fontSizeInput.value;
                    }
                });
            }
        }
    }

    // Hàm lưu ảnh backup nếu handleSave không hoạt động
    function saveImage() {
        if (!window.canvas) {
            alert("Không thể lưu: Canvas không được tìm thấy");
            return;
        }

        try {
            const dataURL = window.canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = "comic_edited.png";
            link.href = dataURL;
            link.click();
            alert("Ảnh đã được lưu thành công!");
        } catch (e) {
            console.error("Lỗi khi lưu ảnh:", e);
            alert("Có lỗi xảy ra khi lưu ảnh. Vui lòng thử lại!");
        }
    }

    // Hiển thị badge để xác nhận script đã chạy
    setTimeout(function () {
        const badge = document.createElement('div');
        badge.style.cssText = `
            position: fixed;
            top: 30px;
            right: 5px;
            background: rgba(25, 135, 84, 0.8);
            color: white;
            padding: 3px 6px;
            border-radius: 3px;
            font-size: 10px;
            z-index: 9999;
        `;
        badge.textContent = 'Buttons Fixed';
        document.body.appendChild(badge);

        setTimeout(() => {
            badge.style.display = 'none';
        }, 5000);
    }, 1000);
})();