/**
 * Mobile Gestures & Touch Enhancements for LamComic
 * Xử lý swipe, long press, và các gesture khác
 */

(function() {
    'use strict';

    // Gesture state
    const gestureState = {
        startX: 0,
        startY: 0,
        startTime: 0,
        lastTouchEnd: 0,
        isLongPress: false,
        longPressTimer: null,
        longPressDelay: 500,
        swipeThreshold: 50,
        swipeVelocity: 0.5
    };

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', initMobileGestures);

    function initMobileGestures() {
        // Only initialize on mobile
        if (window.innerWidth > 768) return;

        setupPanelSwipeGesture();
        setupQuickActions();
        setupLongPressActions();
        setupDoubleTapToEdit();
        setupSwipeToUndo();
        setupPullToRefresh();
        setupMobileEditPopup();
        setupGestureHints();
        setupSmartToolbar();
    }

    // Swipe down to close panel
    function setupPanelSwipeGesture() {
        const panel = document.getElementById('mobileToolsPanel');
        if (!panel) return;

        let startY = 0;
        let currentY = 0;
        let isDragging = false;

        const panelHeader = panel.querySelector('.panel-header');
        if (!panelHeader) return;

        panelHeader.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            startY = e.touches[0].clientY;
            isDragging = true;
            panel.style.transition = 'none';
        }, { passive: true });

        panelHeader.addEventListener('touchmove', (e) => {
            if (!isDragging || e.touches.length !== 1) return;
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;

            if (deltaY > 0) {
                panel.style.transform = `translateY(${deltaY}px)`;
            }
        }, { passive: true });

        panelHeader.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            isDragging = false;
            panel.style.transition = '';

            const deltaY = currentY - startY;
            if (deltaY > 100) {
                // Close panel
                panel.classList.remove('active');
                document.body.classList.remove('panel-open');
            }
            panel.style.transform = '';
        });
    }

    // Quick action buttons (save, undo)
    function setupQuickActions() {
        const canvasPanel = document.querySelector('.canvas-panel');
        if (!canvasPanel) return;

        // Check if already exists
        if (document.querySelector('.mobile-quick-actions')) return;

        const quickActions = document.createElement('div');
        quickActions.className = 'mobile-quick-actions';
        quickActions.innerHTML = `
            <button class="quick-action-btn undo-btn" title="Hoàn tác">
                <i class="fas fa-undo"></i>
            </button>
            <button class="quick-action-btn save-btn" title="Lưu">
                <i class="fas fa-save"></i>
            </button>
        `;

        canvasPanel.appendChild(quickActions);

        // Setup button events
        const undoBtn = quickActions.querySelector('.undo-btn');
        const saveBtn = quickActions.querySelector('.save-btn');

        undoBtn.addEventListener('click', () => {
            if (typeof undo === 'function') {
                undo();
                showActionFeedback('undo');
            }
        });

        saveBtn.addEventListener('click', () => {
            if (typeof handleSave === 'function') {
                handleSave();
            }
        });

        // Show/hide based on content
        updateQuickActionsVisibility();
    }

    function updateQuickActionsVisibility() {
        const quickActions = document.querySelector('.mobile-quick-actions');
        if (!quickActions) return;

        const hasContent = typeof originalImage !== 'undefined' && originalImage !== null ||
                          typeof textObjects !== 'undefined' && textObjects.length > 0;

        quickActions.style.display = hasContent ? 'flex' : 'none';
    }

    // Long press to select text
    function setupLongPressActions() {
        const canvas = document.getElementById('imageCanvas');
        if (!canvas) return;

        canvas.addEventListener('touchstart', handleLongPressStart, { passive: false });
        canvas.addEventListener('touchend', handleLongPressEnd);
        canvas.addEventListener('touchmove', handleLongPressCancel);
        canvas.addEventListener('touchcancel', handleLongPressCancel);

        function handleLongPressStart(e) {
            if (e.touches.length !== 1) return;
            if (typeof MobileZoom !== 'undefined' && MobileZoom.isZoomMode()) return;

            gestureState.startX = e.touches[0].clientX;
            gestureState.startY = e.touches[0].clientY;
            gestureState.startTime = Date.now();
            gestureState.isLongPress = false;

            gestureState.longPressTimer = setTimeout(() => {
                gestureState.isLongPress = true;
                handleLongPressAction(e.touches[0]);
            }, gestureState.longPressDelay);
        }

        function handleLongPressEnd() {
            clearTimeout(gestureState.longPressTimer);
        }

        function handleLongPressCancel(e) {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                const deltaX = Math.abs(touch.clientX - gestureState.startX);
                const deltaY = Math.abs(touch.clientY - gestureState.startY);

                if (deltaX > 10 || deltaY > 10) {
                    clearTimeout(gestureState.longPressTimer);
                }
            }
        }

        function handleLongPressAction(touch) {
            // Vibrate if supported
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }

            // Get canvas position
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (touch.clientX - rect.left) * scaleX;
            const y = (touch.clientY - rect.top) * scaleY;

            // Check if long press on text object
            if (typeof textObjects !== 'undefined' && typeof isPointInTextObject === 'function') {
                for (let i = textObjects.length - 1; i >= 0; i--) {
                    if (isPointInTextObject(x, y, textObjects[i])) {
                        showMobileEditPopup(textObjects[i]);
                        return;
                    }
                }
            }

            // Long press on empty area - show context menu
            showMobileContextMenu(touch.clientX, touch.clientY);
        }
    }

    // Double tap to edit text
    function setupDoubleTapToEdit() {
        const canvas = document.getElementById('imageCanvas');
        if (!canvas) return;

        let lastTap = 0;
        const doubleTapDelay = 300;

        canvas.addEventListener('touchend', (e) => {
            if (typeof MobileZoom !== 'undefined' && MobileZoom.isZoomMode()) return;

            const now = Date.now();
            if (now - lastTap < doubleTapDelay) {
                handleDoubleTap(e);
                lastTap = 0;
            } else {
                lastTap = now;
            }
        });

        function handleDoubleTap(e) {
            if (!e.changedTouches || e.changedTouches.length === 0) return;

            const touch = e.changedTouches[0];
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (touch.clientX - rect.left) * scaleX;
            const y = (touch.clientY - rect.top) * scaleY;

            // Check if double tap on text object
            if (typeof textObjects !== 'undefined' && typeof isPointInTextObject === 'function') {
                for (let i = textObjects.length - 1; i >= 0; i--) {
                    if (isPointInTextObject(x, y, textObjects[i])) {
                        showMobileEditPopup(textObjects[i]);
                        e.preventDefault();
                        return;
                    }
                }
            }
        }
    }

    // Swipe left/right to undo/redo
    function setupSwipeToUndo() {
        const canvas = document.getElementById('imageCanvas');
        if (!canvas) return;

        let startX = 0;
        let startY = 0;
        let startTime = 0;

        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            if (typeof MobileZoom !== 'undefined' && MobileZoom.isZoomMode()) return;

            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = Date.now();
        }, { passive: true });

        canvas.addEventListener('touchend', (e) => {
            if (!e.changedTouches || e.changedTouches.length === 0) return;
            if (typeof MobileZoom !== 'undefined' && MobileZoom.isZoomMode()) return;

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const endTime = Date.now();

            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const deltaTime = endTime - startTime;

            // Check for horizontal swipe with two fingers
            if (Math.abs(deltaX) > gestureState.swipeThreshold &&
                Math.abs(deltaY) < 50 &&
                deltaTime < 500) {

                // Check if swipe was fast enough
                const velocity = Math.abs(deltaX) / deltaTime;
                if (velocity < gestureState.swipeVelocity) return;

                // Use 3 fingers for undo/redo
                // This is disabled for now as it conflicts with normal drawing
                // Will be triggered through the quick action buttons instead
            }
        });
    }

    // Pull to refresh (optional feature)
    function setupPullToRefresh() {
        // Disabled for now - conflicts with scroll
    }

    // Mobile edit popup
    function setupMobileEditPopup() {
        // Create popup if not exists
        if (document.getElementById('mobileEditPopup')) return;

        const popup = document.createElement('div');
        popup.id = 'mobileEditPopup';
        popup.className = 'mobile-edit-popup';
        popup.innerHTML = `
            <div class="popup-header">
                <h3><i class="fas fa-edit"></i> Chỉnh sửa văn bản</h3>
                <button class="panel-close popup-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="popup-content">
                <div class="option-row">
                    <label>Nội dung:</label>
                    <textarea id="mobileEditText" placeholder="Nhập văn bản..."></textarea>
                </div>
                <div class="option-row style-options">
                    <div class="style-option">
                        <label>Màu chữ:</label>
                        <input type="color" id="mobileEditColor" value="#000000">
                    </div>
                    <div class="style-option">
                        <label>Cỡ chữ:</label>
                        <input type="number" id="mobileEditSize" value="24" min="8" max="150">
                    </div>
                </div>
            </div>
            <div class="popup-actions">
                <button class="btn btn-secondary popup-delete">
                    <i class="fas fa-trash"></i> Xóa
                </button>
                <button class="btn btn-primary popup-save">
                    <i class="fas fa-check"></i> Lưu
                </button>
            </div>
        `;

        document.body.appendChild(popup);

        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'mobile-overlay-backdrop';
        backdrop.id = 'mobileEditBackdrop';
        document.body.appendChild(backdrop);

        // Setup events
        const closeBtn = popup.querySelector('.popup-close');
        const deleteBtn = popup.querySelector('.popup-delete');
        const saveBtn = popup.querySelector('.popup-save');

        closeBtn.addEventListener('click', hideMobileEditPopup);
        backdrop.addEventListener('click', hideMobileEditPopup);

        deleteBtn.addEventListener('click', () => {
            const textObj = popup.dataset.textObjectId;
            if (textObj && typeof textObjects !== 'undefined') {
                const index = textObjects.findIndex(obj => obj.id == textObj);
                if (index !== -1) {
                    textObjects.splice(index, 1);
                    if (typeof selectedTextObject !== 'undefined') {
                        selectedTextObject = null;
                    }
                    if (typeof redrawCanvas === 'function') redrawCanvas();
                    if (typeof saveCanvasState === 'function') saveCanvasState();
                    showToastMessage('Đã xóa văn bản');
                }
            }
            hideMobileEditPopup();
        });

        saveBtn.addEventListener('click', () => {
            const textObjId = popup.dataset.textObjectId;
            if (textObjId && typeof textObjects !== 'undefined') {
                const textObj = textObjects.find(obj => obj.id == textObjId);
                if (textObj) {
                    textObj.text = document.getElementById('mobileEditText').value;
                    textObj.color = document.getElementById('mobileEditColor').value;
                    textObj.size = parseInt(document.getElementById('mobileEditSize').value) || 24;

                    if (typeof prepareTextObject === 'function') prepareTextObject(textObj);
                    if (typeof redrawCanvas === 'function') redrawCanvas();
                    if (typeof saveCanvasState === 'function') saveCanvasState();
                    showToastMessage('Đã lưu thay đổi');
                }
            }
            hideMobileEditPopup();
        });
    }

    function showMobileEditPopup(textObj) {
        const popup = document.getElementById('mobileEditPopup');
        const backdrop = document.getElementById('mobileEditBackdrop');
        if (!popup || !textObj) return;

        // Store reference
        popup.dataset.textObjectId = textObj.id;

        // Fill form
        document.getElementById('mobileEditText').value = textObj.text || '';
        document.getElementById('mobileEditColor').value = textObj.color || '#000000';
        document.getElementById('mobileEditSize').value = textObj.size || 24;

        // Show popup
        popup.classList.add('visible');
        backdrop.classList.add('visible');
        document.body.style.overflow = 'hidden';

        // Focus textarea
        setTimeout(() => {
            document.getElementById('mobileEditText').focus();
        }, 300);
    }

    function hideMobileEditPopup() {
        const popup = document.getElementById('mobileEditPopup');
        const backdrop = document.getElementById('mobileEditBackdrop');
        if (popup) popup.classList.remove('visible');
        if (backdrop) backdrop.classList.remove('visible');
        document.body.style.overflow = '';
    }

    // Mobile context menu
    function showMobileContextMenu(x, y) {
        // Remove existing menu
        const existingMenu = document.getElementById('mobileContextMenu');
        if (existingMenu) existingMenu.remove();

        const menu = document.createElement('div');
        menu.id = 'mobileContextMenu';
        menu.className = 'mobile-context-menu';
        menu.innerHTML = `
            <button class="context-item" data-action="text">
                <i class="fas fa-font"></i>
                <span>Thêm chữ</span>
            </button>
            <button class="context-item" data-action="erase">
                <i class="fas fa-eraser"></i>
                <span>Che chữ</span>
            </button>
            <button class="context-item" data-action="pick-color">
                <i class="fas fa-eye-dropper"></i>
                <span>Lấy màu</span>
            </button>
        `;

        // Position menu
        menu.style.left = `${Math.min(x, window.innerWidth - 160)}px`;
        menu.style.top = `${Math.min(y, window.innerHeight - 150)}px`;

        document.body.appendChild(menu);

        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'context-menu-backdrop';
        backdrop.addEventListener('click', () => {
            menu.remove();
            backdrop.remove();
        });
        document.body.appendChild(backdrop);

        // Handle actions
        menu.querySelectorAll('.context-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                handleContextAction(action);
                menu.remove();
                backdrop.remove();
            });
        });

        // Auto close after 3 seconds
        setTimeout(() => {
            if (document.getElementById('mobileContextMenu')) {
                menu.remove();
                backdrop.remove();
            }
        }, 3000);
    }

    function handleContextAction(action) {
        switch (action) {
            case 'text':
                if (typeof handleTextModeClick === 'function') {
                    handleTextModeClick();
                    openMobilePanel();
                }
                break;
            case 'erase':
                if (typeof handleEraseModeClick === 'function') {
                    handleEraseModeClick();
                    openMobilePanel();
                }
                break;
            case 'pick-color':
                showToastMessage('Nhấn vào ảnh để lấy màu');
                // Activate color picker mode
                break;
        }
    }

    function openMobilePanel() {
        const panel = document.getElementById('mobileToolsPanel');
        if (panel) {
            panel.classList.add('active');
            document.body.classList.add('panel-open');
        }
    }

    // Gesture hints for first-time users
    function setupGestureHints() {
        const hintKey = 'lamcomic_gesture_hints_shown';
        if (localStorage.getItem(hintKey)) return;

        const hints = [
            { icon: 'fa-hand-pointer', text: 'Nhấn giữ văn bản để chỉnh sửa' },
            { icon: 'fa-search-plus', text: 'Dùng nút zoom để phóng to ảnh' },
            { icon: 'fa-arrows-alt', text: 'Kéo văn bản để di chuyển' }
        ];

        let currentHint = 0;

        const hintElement = document.createElement('div');
        hintElement.className = 'gesture-hint';
        document.body.appendChild(hintElement);

        function showHint(index) {
            if (index >= hints.length) {
                localStorage.setItem(hintKey, 'true');
                hintElement.remove();
                return;
            }

            const hint = hints[index];
            hintElement.innerHTML = `
                <i class="fas ${hint.icon}"></i>
                <p>${hint.text}</p>
            `;
            hintElement.classList.add('visible');

            setTimeout(() => {
                hintElement.classList.remove('visible');
                setTimeout(() => showHint(index + 1), 500);
            }, 2500);
        }

        // Show hints after image is loaded
        const imageLoader = document.getElementById('imageLoader');
        if (imageLoader) {
            imageLoader.addEventListener('change', () => {
                setTimeout(() => showHint(0), 1000);
            }, { once: true });
        }
    }

    // Smart toolbar - auto show/hide based on action
    function setupSmartToolbar() {
        const panel = document.getElementById('mobileToolsPanel');
        const toggleBtn = document.getElementById('toolbarToggle');
        if (!panel || !toggleBtn) return;

        // Auto close panel after selecting a tool
        const toolButtons = document.querySelectorAll('.tool-btn');
        toolButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Keep panel open if in text mode for text input
                const isTextMode = btn.id === 'textModeButton';
                if (!isTextMode) {
                    setTimeout(() => {
                        panel.classList.remove('active');
                        document.body.classList.remove('panel-open');
                    }, 200);
                }
            });
        });
    }

    // Show action feedback
    function showActionFeedback(action) {
        const icons = {
            'undo': 'fa-undo',
            'redo': 'fa-redo',
            'save': 'fa-check',
            'delete': 'fa-trash'
        };

        const feedback = document.createElement('div');
        feedback.className = 'action-feedback';
        feedback.innerHTML = `<i class="fas ${icons[action] || 'fa-check'}"></i>`;

        // Position in center of canvas
        const canvas = document.getElementById('imageCanvas');
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            feedback.style.left = `${rect.left + rect.width / 2}px`;
            feedback.style.top = `${rect.top + rect.height / 2}px`;
        }

        document.body.appendChild(feedback);

        setTimeout(() => {
            feedback.classList.add('fade-out');
            setTimeout(() => feedback.remove(), 300);
        }, 300);
    }

    // Show toast message
    function showToastMessage(message) {
        if (typeof showToast === 'function') {
            showToast(message);
        } else {
            const toast = document.getElementById('toastNotification');
            if (toast) {
                const msgEl = toast.querySelector('.toast-message');
                if (msgEl) msgEl.textContent = message;
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 2000);
            }
        }
    }

    // Add context menu styles
    const contextStyles = document.createElement('style');
    contextStyles.textContent = `
        .mobile-context-menu {
            position: fixed;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
            z-index: 3000;
            overflow: hidden;
            min-width: 150px;
        }

        .context-item {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            padding: 14px 18px;
            border: none;
            background: none;
            font-size: 15px;
            color: var(--text-dark, #1f2937);
            cursor: pointer;
            transition: background 0.2s;
        }

        .context-item:active {
            background: var(--bg-light, #f3f4f6);
        }

        .context-item i {
            font-size: 16px;
            color: var(--primary, #4361ee);
            width: 20px;
            text-align: center;
        }

        .context-menu-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 2999;
        }
    `;
    document.head.appendChild(contextStyles);

    // Update quick actions visibility when content changes
    window.addEventListener('load', updateQuickActionsVisibility);
    setInterval(updateQuickActionsVisibility, 1000);

    // Expose API
    window.MobileGestures = {
        showEditPopup: showMobileEditPopup,
        hideEditPopup: hideMobileEditPopup,
        showFeedback: showActionFeedback
    };

})();
