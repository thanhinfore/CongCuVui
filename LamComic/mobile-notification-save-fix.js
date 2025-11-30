// 1. Sửa vấn đề thông báo "Đã chọn công cụ" không biến mất

// Cải tiến hàm hiển thị toast để đảm bảo đúng hành vi
function showToast(message) {
    // Nếu đang có thông báo trước, xóa bỏ nó
    clearTimeout(window.toastTimer);

    // Tìm toast element
    const toastMsg = toastNotification.querySelector('.toast-message');
    if (toastMsg) {
        toastMsg.textContent = message;
    } else {
        toastNotification.textContent = message;
    }

    // Hiển thị toast
    toastNotification.classList.add('show');

    // Đặt timer để ẩn toast sau 2 giây
    window.toastTimer = setTimeout(() => {
        toastNotification.classList.remove('show');
    }, 2000);

    // Đồng thời xóa thông báo từ các toast khác (nếu có)
    const mobileNotification = document.querySelector('.mobile-notification');
    if (mobileNotification) {
        mobileNotification.remove();
    }
}

// Thêm hàm xóa bỏ thông báo đang hiển thị trên mobile
function clearMobileNotifications() {
    // Xóa tất cả thông báo hiển thị trên mobile
    const mobileNotifications = document.querySelectorAll('.mobile-notification');
    mobileNotifications.forEach(notification => {
        notification.remove();
    });

    // Đảm bảo rằng toast cũng được ẩn đi
    toastNotification.classList.remove('show');
}

// 2. Thêm nút lưu vào canvas cho mobile để dễ tiếp cận
function addMobileSaveButton() {
    // Kiểm tra xem đã có nút lưu cho mobile chưa
    if (document.querySelector('.mobile-save-button')) {
        return;
    }

    // Tạo nút lưu ảnh cho mobile
    const saveButton = document.createElement('button');
    saveButton.className = 'mobile-save-button';
    saveButton.innerHTML = '<i class="fas fa-save"></i>';
    saveButton.title = 'Lưu ảnh';

    // Thêm sự kiện click
    saveButton.addEventListener('click', handleSave);

    // Thêm vào body
    document.body.appendChild(saveButton);
}

// Cập nhật hàm kiểm tra thiết bị
function checkDeviceType() {
    // Check if mobile device
    isMobileDevice = window.innerWidth <= 768;

    // Apply mobile-specific optimizations
    if (isMobileDevice) {
        document.body.classList.add('mobile-device');
        addMobileSaveButton(); // Thêm nút lưu cho mobile
    } else {
        document.body.classList.remove('mobile-device');
        // Xóa nút lưu mobile nếu tồn tại
        const mobileSaveButton = document.querySelector('.mobile-save-button');
        if (mobileSaveButton) {
            mobileSaveButton.remove();
        }
    }
}

// 3. Cập nhật các hàm xử lý sự kiện công cụ để xóa thông báo hiện tại

// Xử lý nút chế độ xóa (erase)
function handleEraseModeClick() {
    // Xóa thông báo hiện tại (nếu có)
    clearMobileNotifications();

    currentMode = 'erase';
    hideAllOptionPanels();
    if (eraseOptions) eraseOptions.classList.remove('hidden');
    canvas.style.cursor = 'crosshair';
    setActiveButton(eraseModeButton);
    selectedTextObject = null;
    redrawCanvas();
    showToast("Đã chọn công cụ Che Chữ");

    // Cập nhật panel mobile nếu đang mở
    if (isMobileDevice && mobileToolsPanel && mobileToolsPanel.classList.contains('active')) {
        updateMobilePanelContent();
    }
}

// Xử lý nút chế độ thêm chữ (text)
function handleTextModeClick() {
    // Xóa thông báo hiện tại (nếu có)
    clearMobileNotifications();

    currentMode = 'text';
    hideAllOptionPanels();
    if (textOptions) textOptions.classList.remove('hidden');
    canvas.style.cursor = 'text';
    setActiveButton(textModeButton);
    selectedTextObject = null;
    redrawCanvas();
    showToast("Đã chọn công cụ Thêm Chữ");

    // Cập nhật panel mobile nếu đang mở
    if (isMobileDevice && mobileToolsPanel && mobileToolsPanel.classList.contains('active')) {
        updateMobilePanelContent();
    }
}

// Xử lý nút chế độ chọn (select)
function handleSelectModeClick() {
    // Xóa thông báo hiện tại (nếu có)
    clearMobileNotifications();

    currentMode = 'select';
    hideAllOptionPanels();
    if (selectOptions) selectOptions.classList.remove('hidden');
    canvas.style.cursor = 'default';
    setActiveButton(selectModeButton);
    showToast("Đã chọn công cụ Chọn & Di Chuyển");

    // Cập nhật panel mobile nếu đang mở
    if (isMobileDevice && mobileToolsPanel && mobileToolsPanel.classList.contains('active')) {
        updateMobilePanelContent();
    }
}

// 4. Đảm bảo sự kiện window resize cũng cập nhật nút lưu mobile
function handleWindowResize() {
    // Sử dụng debounce để tránh gọi quá nhiều lần
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(function () {
        isMobileDevice = window.innerWidth <= 768;
        adjustCanvasDisplay();
        // Kiểm tra và cập nhật nút lưu mobile
        if (isMobileDevice) {
            addMobileSaveButton();
        } else {
            const mobileSaveButton = document.querySelector('.mobile-save-button');
            if (mobileSaveButton) {
                mobileSaveButton.remove();
            }
        }
    }, 250);
}

// 5. Cập nhật hàm handleMobileToolbarToggle để xóa thông báo khi mở panel
function handleMobileToolbarToggle() {
    // Xóa thông báo hiện tại (nếu có)
    clearMobileNotifications();

    // Sử dụng phương thức cập nhật panel 
    updateMobilePanelContent();
    mobileToolsPanel.classList.add('active');
    document.body.classList.add('panel-open');
}

// 6. Cập nhật hàm handleMobilePanelClose để xóa thông báo khi đóng panel
function handleMobilePanelClose() {
    // Xóa thông báo hiện tại (nếu có)
    clearMobileNotifications();

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