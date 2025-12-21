/**
 * Mobile Touch Optimizer for LamComic
 * Tối ưu hóa các thao tác touch để vẽ và chỉnh sửa mượt mà hơn
 */

(function() {
    'use strict';

    // Touch optimization settings
    const touchConfig = {
        brushSmoothingEnabled: true,
        brushSmoothingFactor: 0.3, // 0-1, higher = smoother
        palmRejectionEnabled: true,
        palmRejectionThreshold: 50, // pixels
        drawingThrottleMs: 16, // ~60fps
        textDragThreshold: 5, // pixels before starting drag
        snapToGridEnabled: false,
        gridSize: 10
    };

    // Touch state
    const touchState = {
        lastX: 0,
        lastY: 0,
        lastDrawTime: 0,
        isDrawing: false,
        isDragging: false,
        velocityX: 0,
        velocityY: 0,
        pressure: 0.5,
        brushPath: []
    };

    // Initialize
    document.addEventListener('DOMContentLoaded', initTouchOptimizer);

    function initTouchOptimizer() {
        // Only initialize on touch devices
        if (!('ontouchstart' in window)) return;

        setupBrushSmoothing();
        setupPressureSensitivity();
        setupPalmRejection();
        setupTextDragOptimization();
        setupDrawingOptimizations();
        setupSelectionHandles();
        setupTouchFeedback();
    }

    // Brush smoothing for smoother lines
    function setupBrushSmoothing() {
        const canvas = document.getElementById('imageCanvas');
        if (!canvas) return;

        // Store original drawing handler
        const originalHandleMove = window.handleInteractionMove;
        if (!originalHandleMove) return;

        // Create smoothed drawing handler
        window.handleInteractionMove = function(event) {
            // Only apply smoothing in erase brush mode
            const eraseModeRadio = document.querySelector('input[name="eraseMode"]:checked');
            const isBrushMode = eraseModeRadio && eraseModeRadio.value === 'brush';

            if (!isBrushMode || !touchConfig.brushSmoothingEnabled) {
                return originalHandleMove(event);
            }

            // Get current position
            const pos = getEventPosition(event);
            if (!pos) return originalHandleMove(event);

            // Apply smoothing
            if (touchState.lastX !== 0 || touchState.lastY !== 0) {
                const smoothedX = touchState.lastX + (pos.x - touchState.lastX) * touchConfig.brushSmoothingFactor;
                const smoothedY = touchState.lastY + (pos.y - touchState.lastY) * touchConfig.brushSmoothingFactor;

                // Store path for smooth rendering
                touchState.brushPath.push({ x: smoothedX, y: smoothedY });

                // Limit path length
                if (touchState.brushPath.length > 100) {
                    touchState.brushPath.shift();
                }
            }

            touchState.lastX = pos.x;
            touchState.lastY = pos.y;

            // Call original handler
            return originalHandleMove(event);
        };
    }

    // Pressure sensitivity support (for devices that support it)
    function setupPressureSensitivity() {
        const canvas = document.getElementById('imageCanvas');
        if (!canvas) return;

        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                // Some devices report force
                const force = e.touches[0].force;
                if (force && force > 0) {
                    touchState.pressure = force;
                }
            }
        }, { passive: true });

        canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                const force = e.touches[0].force;
                if (force && force > 0) {
                    touchState.pressure = force;

                    // Adjust brush size based on pressure
                    adjustBrushByPressure(force);
                }
            }
        }, { passive: true });
    }

    function adjustBrushByPressure(pressure) {
        const brushSizeInput = document.getElementById('brushSize');
        if (!brushSizeInput) return;

        const baseBrushSize = parseInt(brushSizeInput.dataset.baseSize) || parseInt(brushSizeInput.value);
        if (!brushSizeInput.dataset.baseSize) {
            brushSizeInput.dataset.baseSize = baseBrushSize;
        }

        // Adjust size based on pressure (0.5x to 1.5x)
        const adjustedSize = Math.round(baseBrushSize * (0.5 + pressure));
        // Don't actually change the input - just use internally
        touchState.currentBrushSize = adjustedSize;
    }

    // Palm rejection
    function setupPalmRejection() {
        if (!touchConfig.palmRejectionEnabled) return;

        const canvas = document.getElementById('imageCanvas');
        if (!canvas) return;

        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) return;

            const touch = e.touches[0];

            // Check touch size (larger touches are likely palms)
            if (touch.radiusX && touch.radiusY) {
                const touchSize = Math.max(touch.radiusX, touch.radiusY);
                if (touchSize > touchConfig.palmRejectionThreshold) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            }
        }, { passive: false });
    }

    // Optimized text dragging
    function setupTextDragOptimization() {
        const canvas = document.getElementById('imageCanvas');
        if (!canvas) return;

        let dragStartX = 0;
        let dragStartY = 0;
        let hasMoved = false;

        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;

            const pos = getEventPosition(e);
            if (!pos) return;

            dragStartX = pos.x;
            dragStartY = pos.y;
            hasMoved = false;
        }, { passive: true });

        canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length !== 1) return;

            const pos = getEventPosition(e);
            if (!pos) return;

            const deltaX = Math.abs(pos.x - dragStartX);
            const deltaY = Math.abs(pos.y - dragStartY);

            if (deltaX > touchConfig.textDragThreshold || deltaY > touchConfig.textDragThreshold) {
                hasMoved = true;
            }
        }, { passive: true });

        canvas.addEventListener('touchend', (e) => {
            // If didn't move much, treat as tap
            if (!hasMoved && typeof selectedTextObject !== 'undefined' && selectedTextObject) {
                // Show edit popup
                if (typeof MobileGestures !== 'undefined' && MobileGestures.showEditPopup) {
                    // Already handled by gesture module
                }
            }
        }, { passive: true });
    }

    // Drawing optimizations
    function setupDrawingOptimizations() {
        const canvas = document.getElementById('imageCanvas');
        if (!canvas) return;

        // Throttle touch move events for better performance
        let lastDrawTime = 0;

        const originalTouchMove = canvas.ontouchmove;

        canvas.addEventListener('touchmove', function throttledTouchMove(e) {
            const now = performance.now();
            if (now - lastDrawTime < touchConfig.drawingThrottleMs) {
                return;
            }
            lastDrawTime = now;

            // Continue with original handler
        }, { passive: false });

        // Optimize canvas rendering
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Enable image smoothing for better quality
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
        }
    }

    // Selection handles for text objects
    function setupSelectionHandles() {
        // Create selection handles container
        const handlesContainer = document.createElement('div');
        handlesContainer.className = 'mobile-selection-handles';
        handlesContainer.id = 'selectionHandles';
        handlesContainer.style.display = 'none';

        // Add corner handles
        const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        corners.forEach(corner => {
            const handle = document.createElement('div');
            handle.className = `selection-handle ${corner}`;
            handle.dataset.corner = corner;
            handlesContainer.appendChild(handle);
        });

        const canvasContainer = document.querySelector('.canvas-container');
        if (canvasContainer) {
            canvasContainer.appendChild(handlesContainer);
        }

        // Update handle positions when text is selected
        setInterval(updateSelectionHandles, 100);
    }

    function updateSelectionHandles() {
        const handles = document.getElementById('selectionHandles');
        if (!handles) return;

        // Check if text is selected
        if (typeof selectedTextObject === 'undefined' || !selectedTextObject) {
            handles.style.display = 'none';
            return;
        }

        const canvas = document.getElementById('imageCanvas');
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = rect.width / canvas.width;
        const scaleY = rect.height / canvas.height;

        const obj = selectedTextObject;
        const x = rect.left + obj.x * scaleX;
        const y = rect.top + obj.y * scaleY;
        const width = obj.width * scaleX;
        const height = obj.height * scaleY;

        handles.style.display = 'block';
        handles.style.left = `${x}px`;
        handles.style.top = `${y}px`;
        handles.style.width = `${width}px`;
        handles.style.height = `${height}px`;
    }

    // Touch feedback (visual)
    function setupTouchFeedback() {
        const canvas = document.getElementById('imageCanvas');
        if (!canvas) return;

        // Create touch indicator
        const indicator = document.createElement('div');
        indicator.className = 'touch-indicator';
        indicator.style.cssText = `
            position: fixed;
            width: 40px;
            height: 40px;
            background: rgba(67, 97, 238, 0.3);
            border: 2px solid var(--primary, #4361ee);
            border-radius: 50%;
            pointer-events: none;
            transform: translate(-50%, -50%) scale(0);
            transition: transform 0.1s ease;
            z-index: 9999;
        `;
        document.body.appendChild(indicator);

        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            const touch = e.touches[0];
            indicator.style.left = `${touch.clientX}px`;
            indicator.style.top = `${touch.clientY}px`;
            indicator.style.transform = 'translate(-50%, -50%) scale(1)';
        }, { passive: true });

        canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length !== 1) return;
            const touch = e.touches[0];
            indicator.style.left = `${touch.clientX}px`;
            indicator.style.top = `${touch.clientY}px`;
        }, { passive: true });

        canvas.addEventListener('touchend', () => {
            indicator.style.transform = 'translate(-50%, -50%) scale(0)';
        }, { passive: true });

        canvas.addEventListener('touchcancel', () => {
            indicator.style.transform = 'translate(-50%, -50%) scale(0)';
        }, { passive: true });
    }

    // Helper function to get event position
    function getEventPosition(event) {
        const canvas = document.getElementById('imageCanvas');
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        let clientX, clientY;

        if (event.type && event.type.includes('touch')) {
            if (event.touches && event.touches.length > 0) {
                clientX = event.touches[0].clientX;
                clientY = event.touches[0].clientY;
            } else if (event.changedTouches && event.changedTouches.length > 0) {
                clientX = event.changedTouches[0].clientX;
                clientY = event.changedTouches[0].clientY;
            } else {
                return null;
            }
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }

        if (clientX === undefined || clientY === undefined) return null;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    // Expose configuration
    window.TouchOptimizer = {
        config: touchConfig,
        setSmoothing: (enabled) => { touchConfig.brushSmoothingEnabled = enabled; },
        setSmoothingFactor: (factor) => { touchConfig.brushSmoothingFactor = Math.max(0, Math.min(1, factor)); },
        setPalmRejection: (enabled) => { touchConfig.palmRejectionEnabled = enabled; },
        setThrottle: (ms) => { touchConfig.drawingThrottleMs = ms; }
    };

})();
