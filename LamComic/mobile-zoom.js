/**
 * Mobile Zoom & Pan Module cho LamComic
 * Hỗ trợ pinch-to-zoom, double-tap zoom, và pan gesture
 */

(function() {
    'use strict';

    // Zoom state
    let zoomState = {
        scale: 1,
        minScale: 0.5,
        maxScale: 4,
        translateX: 0,
        translateY: 0,
        lastScale: 1,
        lastTranslateX: 0,
        lastTranslateY: 0,
        isPinching: false,
        isPanning: false,
        startDistance: 0,
        startX: 0,
        startY: 0,
        lastTapTime: 0,
        doubleTapDelay: 300,
        isZoomMode: false
    };

    // DOM elements
    let canvasContainer = null;
    let canvas = null;
    let zoomWrapper = null;
    let zoomIndicator = null;
    let zoomControls = null;

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', initMobileZoom);

    function initMobileZoom() {
        canvasContainer = document.querySelector('.canvas-container');
        canvas = document.getElementById('imageCanvas');

        if (!canvasContainer || !canvas) {
            console.warn('Mobile Zoom: Canvas elements not found');
            return;
        }

        // Only initialize on mobile devices
        if (window.innerWidth > 768) {
            createDesktopZoomControls();
            return;
        }

        setupZoomWrapper();
        createZoomUI();
        setupTouchListeners();
        setupZoomModeToggle();
    }

    // Create wrapper for zoom transformations
    function setupZoomWrapper() {
        // Check if wrapper already exists
        if (document.getElementById('zoomWrapper')) {
            zoomWrapper = document.getElementById('zoomWrapper');
            return;
        }

        zoomWrapper = document.createElement('div');
        zoomWrapper.id = 'zoomWrapper';
        zoomWrapper.className = 'zoom-wrapper';

        // Wrap canvas inside zoom wrapper
        canvas.parentNode.insertBefore(zoomWrapper, canvas);
        zoomWrapper.appendChild(canvas);
    }

    // Create zoom UI elements
    function createZoomUI() {
        // Zoom indicator (shows current zoom level)
        zoomIndicator = document.createElement('div');
        zoomIndicator.className = 'mobile-zoom-indicator';
        zoomIndicator.innerHTML = '<span class="zoom-percent">100%</span>';
        canvasContainer.appendChild(zoomIndicator);

        // Mobile zoom controls
        zoomControls = document.createElement('div');
        zoomControls.className = 'mobile-zoom-controls';
        zoomControls.innerHTML = `
            <button class="mzoom-btn mzoom-out" title="Thu nhỏ">
                <i class="fas fa-minus"></i>
            </button>
            <button class="mzoom-btn mzoom-reset" title="Reset zoom">
                <i class="fas fa-compress-arrows-alt"></i>
            </button>
            <button class="mzoom-btn mzoom-in" title="Phóng to">
                <i class="fas fa-plus"></i>
            </button>
            <button class="mzoom-btn mzoom-fit" title="Vừa màn hình">
                <i class="fas fa-expand"></i>
            </button>
        `;
        canvasContainer.appendChild(zoomControls);

        // Setup zoom control buttons
        const zoomOutBtn = zoomControls.querySelector('.mzoom-out');
        const zoomInBtn = zoomControls.querySelector('.mzoom-in');
        const zoomResetBtn = zoomControls.querySelector('.mzoom-reset');
        const zoomFitBtn = zoomControls.querySelector('.mzoom-fit');

        zoomOutBtn.addEventListener('click', () => zoomBy(-0.25));
        zoomInBtn.addEventListener('click', () => zoomBy(0.25));
        zoomResetBtn.addEventListener('click', resetZoom);
        zoomFitBtn.addEventListener('click', fitToScreen);

        // Zoom mode toggle button (floating)
        const zoomModeBtn = document.createElement('button');
        zoomModeBtn.id = 'zoomModeToggle';
        zoomModeBtn.className = 'zoom-mode-toggle';
        zoomModeBtn.innerHTML = '<i class="fas fa-search-plus"></i>';
        zoomModeBtn.title = 'Bật/tắt chế độ zoom';
        canvasContainer.appendChild(zoomModeBtn);
    }

    // Create desktop zoom controls
    function createDesktopZoomControls() {
        const existingControls = document.querySelector('.zoom-controls');
        if (existingControls) return;

        const controls = document.createElement('div');
        controls.className = 'zoom-controls';
        controls.innerHTML = `
            <button class="zoom-btn zoom-out" title="Thu nhỏ (-)">
                <i class="fas fa-minus"></i>
            </button>
            <span class="zoom-level">100%</span>
            <button class="zoom-btn zoom-in" title="Phóng to (+)">
                <i class="fas fa-plus"></i>
            </button>
            <button class="zoom-btn zoom-reset" title="Reset (0)">
                <i class="fas fa-compress-arrows-alt"></i>
            </button>
        `;

        if (canvasContainer) {
            canvasContainer.appendChild(controls);
        }

        // Setup button events
        const zoomOutBtn = controls.querySelector('.zoom-out');
        const zoomInBtn = controls.querySelector('.zoom-in');
        const zoomResetBtn = controls.querySelector('.zoom-reset');
        const zoomLevel = controls.querySelector('.zoom-level');

        zoomOutBtn.addEventListener('click', () => {
            zoomBy(-0.1);
            zoomLevel.textContent = Math.round(zoomState.scale * 100) + '%';
        });

        zoomInBtn.addEventListener('click', () => {
            zoomBy(0.1);
            zoomLevel.textContent = Math.round(zoomState.scale * 100) + '%';
        });

        zoomResetBtn.addEventListener('click', () => {
            resetZoom();
            zoomLevel.textContent = '100%';
        });

        // Keyboard shortcuts for zoom
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === '+' || e.key === '=') {
                e.preventDefault();
                zoomBy(0.1);
                zoomLevel.textContent = Math.round(zoomState.scale * 100) + '%';
            } else if (e.key === '-') {
                e.preventDefault();
                zoomBy(-0.1);
                zoomLevel.textContent = Math.round(zoomState.scale * 100) + '%';
            } else if (e.key === '0') {
                e.preventDefault();
                resetZoom();
                zoomLevel.textContent = '100%';
            }
        });
    }

    // Setup touch event listeners
    function setupTouchListeners() {
        if (!zoomWrapper) return;

        let touches = [];

        zoomWrapper.addEventListener('touchstart', handleTouchStart, { passive: false });
        zoomWrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
        zoomWrapper.addEventListener('touchend', handleTouchEnd, { passive: false });
        zoomWrapper.addEventListener('touchcancel', handleTouchEnd, { passive: false });

        function handleTouchStart(e) {
            if (!zoomState.isZoomMode) return;

            touches = Array.from(e.touches);

            if (touches.length === 2) {
                // Pinch start
                e.preventDefault();
                zoomState.isPinching = true;
                zoomState.startDistance = getDistance(touches[0], touches[1]);
                zoomState.lastScale = zoomState.scale;
                showZoomIndicator();
            } else if (touches.length === 1) {
                // Check for double tap
                const now = Date.now();
                if (now - zoomState.lastTapTime < zoomState.doubleTapDelay) {
                    e.preventDefault();
                    handleDoubleTap(touches[0]);
                    zoomState.lastTapTime = 0;
                } else {
                    zoomState.lastTapTime = now;
                    // Pan start
                    if (zoomState.scale > 1) {
                        zoomState.isPanning = true;
                        zoomState.startX = touches[0].clientX - zoomState.translateX;
                        zoomState.startY = touches[0].clientY - zoomState.translateY;
                    }
                }
            }
        }

        function handleTouchMove(e) {
            if (!zoomState.isZoomMode) return;

            touches = Array.from(e.touches);

            if (zoomState.isPinching && touches.length === 2) {
                e.preventDefault();

                const currentDistance = getDistance(touches[0], touches[1]);
                const scaleDelta = currentDistance / zoomState.startDistance;
                let newScale = zoomState.lastScale * scaleDelta;

                // Clamp scale
                newScale = Math.max(zoomState.minScale, Math.min(zoomState.maxScale, newScale));
                zoomState.scale = newScale;

                // Get pinch center
                const centerX = (touches[0].clientX + touches[1].clientX) / 2;
                const centerY = (touches[0].clientY + touches[1].clientY) / 2;

                applyZoomTransform(centerX, centerY);
                updateZoomIndicator();
            } else if (zoomState.isPanning && touches.length === 1) {
                e.preventDefault();

                zoomState.translateX = touches[0].clientX - zoomState.startX;
                zoomState.translateY = touches[0].clientY - zoomState.startY;

                // Limit panning to canvas bounds
                constrainPan();
                applyZoomTransform();
            }
        }

        function handleTouchEnd(e) {
            if (e.touches.length === 0) {
                if (zoomState.isPinching) {
                    zoomState.isPinching = false;
                    hideZoomIndicator();
                }
                zoomState.isPanning = false;
            } else if (e.touches.length === 1) {
                zoomState.isPinching = false;
            }
        }
    }

    // Setup zoom mode toggle
    function setupZoomModeToggle() {
        const toggleBtn = document.getElementById('zoomModeToggle');
        if (!toggleBtn) return;

        toggleBtn.addEventListener('click', () => {
            zoomState.isZoomMode = !zoomState.isZoomMode;
            toggleBtn.classList.toggle('active', zoomState.isZoomMode);

            if (zoomState.isZoomMode) {
                canvasContainer.classList.add('zoom-mode-active');
                showToastMessage('Chế độ zoom đã bật. Dùng 2 ngón để phóng to/thu nhỏ');
                zoomControls.classList.add('visible');
            } else {
                canvasContainer.classList.remove('zoom-mode-active');
                showToastMessage('Chế độ zoom đã tắt');
                zoomControls.classList.remove('visible');
                resetZoom();
            }
        });
    }

    // Handle double tap to zoom
    function handleDoubleTap(touch) {
        const rect = canvas.getBoundingClientRect();
        const centerX = touch.clientX;
        const centerY = touch.clientY;

        if (zoomState.scale > 1) {
            // Reset to 1x
            animateZoom(1, 0, 0);
        } else {
            // Zoom to 2x at tap position
            zoomState.translateX = (rect.width / 2 - centerX);
            zoomState.translateY = (rect.height / 2 - centerY);
            animateZoom(2, zoomState.translateX, zoomState.translateY);
        }
    }

    // Calculate distance between two touch points
    function getDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Apply zoom transformation
    function applyZoomTransform(centerX, centerY) {
        if (!zoomWrapper) return;

        zoomWrapper.style.transform = `translate(${zoomState.translateX}px, ${zoomState.translateY}px) scale(${zoomState.scale})`;
        zoomWrapper.style.transformOrigin = 'center center';
    }

    // Animate zoom
    function animateZoom(targetScale, targetX, targetY) {
        const startScale = zoomState.scale;
        const startX = zoomState.translateX;
        const startY = zoomState.translateY;
        const duration = 200;
        const startTime = performance.now();

        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out)
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            zoomState.scale = startScale + (targetScale - startScale) * easeProgress;
            zoomState.translateX = startX + (targetX - startX) * easeProgress;
            zoomState.translateY = startY + (targetY - startY) * easeProgress;

            applyZoomTransform();
            updateZoomIndicator();

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }

        requestAnimationFrame(animate);
    }

    // Zoom by delta
    function zoomBy(delta) {
        const newScale = Math.max(zoomState.minScale, Math.min(zoomState.maxScale, zoomState.scale + delta));
        animateZoom(newScale, zoomState.translateX, zoomState.translateY);
    }

    // Reset zoom to default
    function resetZoom() {
        animateZoom(1, 0, 0);
    }

    // Fit canvas to screen
    function fitToScreen() {
        if (!canvas || !canvasContainer) return;

        const containerRect = canvasContainer.getBoundingClientRect();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        const scaleX = (containerRect.width - 40) / canvasWidth;
        const scaleY = (containerRect.height - 40) / canvasHeight;
        const fitScale = Math.min(scaleX, scaleY, 1);

        animateZoom(fitScale, 0, 0);
    }

    // Constrain pan to keep canvas visible
    function constrainPan() {
        if (!canvas || !canvasContainer) return;

        const containerRect = canvasContainer.getBoundingClientRect();
        const scaledWidth = canvas.offsetWidth * zoomState.scale;
        const scaledHeight = canvas.offsetHeight * zoomState.scale;

        const maxTranslateX = Math.max(0, (scaledWidth - containerRect.width) / 2);
        const maxTranslateY = Math.max(0, (scaledHeight - containerRect.height) / 2);

        zoomState.translateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, zoomState.translateX));
        zoomState.translateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, zoomState.translateY));
    }

    // Show zoom indicator
    function showZoomIndicator() {
        if (zoomIndicator) {
            zoomIndicator.classList.add('visible');
        }
    }

    // Hide zoom indicator
    function hideZoomIndicator() {
        if (zoomIndicator) {
            setTimeout(() => {
                zoomIndicator.classList.remove('visible');
            }, 500);
        }
    }

    // Update zoom indicator
    function updateZoomIndicator() {
        if (zoomIndicator) {
            const percent = Math.round(zoomState.scale * 100);
            zoomIndicator.querySelector('.zoom-percent').textContent = percent + '%';
        }
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

    // Expose API for external use
    window.MobileZoom = {
        zoomIn: () => zoomBy(0.25),
        zoomOut: () => zoomBy(-0.25),
        reset: resetZoom,
        fit: fitToScreen,
        getScale: () => zoomState.scale,
        setZoomMode: (enabled) => {
            zoomState.isZoomMode = enabled;
            const toggleBtn = document.getElementById('zoomModeToggle');
            if (toggleBtn) toggleBtn.classList.toggle('active', enabled);
        },
        isZoomMode: () => zoomState.isZoomMode
    };

})();
