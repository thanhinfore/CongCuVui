/* =====================================================
   MOBILEHANDLER.JS - Mobile Functionality Module
   V17 Enhanced - Premium UI/UX for PC & Mobile
   ===================================================== */

export class MobileHandler {
    constructor() {
        this.initialized = false;
        this.activePanel = 'control';
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.lastScrollY = 0;
        this.scrollDirection = 'up';
        this.headerHidden = false;
        this.isAnimating = false;

        // DOM references
        this.panels = {
            control: null,
            preview: null
        };
        this.tabs = null;
        this.tabButtons = null;
        this.header = null;
        this.fab = null;

        // Breakpoints (V17)
        this.breakpoints = {
            mobile: 768,
            tablet: 1024,
            desktop: 1440
        };

        // Gesture thresholds (V17)
        this.gestures = {
            swipeThreshold: 50,
            swipeVelocityThreshold: 0.3,
            longPressThreshold: 500,
            doubleTapThreshold: 300
        };

        // Resize observer
        this.resizeObserver = null;

        // Intersection observer for lazy loading (V17)
        this.intersectionObserver = null;

        // Performance metrics (V17)
        this.metrics = {
            fps: 60,
            lastFrameTime: performance.now()
        };

        // Last tap for double tap detection
        this.lastTapTime = 0;
    }

    init() {
        if (this.initialized) return;

        // Get DOM references
        this.panels.control = document.querySelector('.control-panel');
        this.panels.preview = document.querySelector('.preview-panel');
        this.header = document.querySelector('.app-header');
        this.fab = document.querySelector('.v17-fab');

        // Create mobile tabs if they don't exist
        this.createMobileTabs();

        // Handle virtual keyboard
        this.handleVirtualKeyboard();

        // Setup scroll-based header hide/show
        this.setupScrollBehavior();

        // Setup resize observer
        this.setupResizeObserver();

        // Setup intersection observer (V17)
        this.setupIntersectionObserver();

        // Set viewport height CSS variable for mobile browsers
        this.setViewportHeight();

        // V17: Apply device optimizations first
        this.applyDeviceOptimizations();

        // V17: Setup smooth transitions
        this.setupSmoothTransitions();

        // V17: Setup gesture recognizer
        this.setupAdvancedGestures();

        // V17: Check device type and apply initial state
        const deviceType = this.getDeviceType();
        document.body.dataset.device = deviceType;

        if (this.isMobile()) {
            document.body.classList.add('mobile-view');
            this.setupEventListeners();
            this.setActivePanel(localStorage.getItem('activeMobilePanel') || 'control');
        } else if (this.isTablet()) {
            document.body.classList.add('tablet-view');
            this.setupEventListeners();
            this.resetPanelsForDesktop();
        } else {
            // Desktop: ensure both panels are visible
            document.body.classList.remove('mobile-view', 'tablet-view');
            this.resetPanelsForDesktop();
        }

        // V17: Setup performance monitoring
        this.setupPerformanceMonitoring();

        this.initialized = true;
        console.log('Mobile handler V17 initialized');
    }

    // V17: Get device type
    getDeviceType() {
        const width = window.innerWidth;
        if (width <= this.breakpoints.mobile) return 'mobile';
        if (width <= this.breakpoints.tablet) return 'tablet';
        if (width <= this.breakpoints.desktop) return 'desktop';
        return 'wide';
    }

    // V17: Check if tablet
    isTablet() {
        const width = window.innerWidth;
        return width > this.breakpoints.mobile && width <= this.breakpoints.tablet;
    }

    resetPanelsForDesktop() {
        if (this.panels.control) {
            this.panels.control.classList.remove('panel-active', 'panel-inactive');
            this.panels.control.style.display = '';
            this.panels.control.style.transform = '';
            this.panels.control.style.opacity = '';
        }
        if (this.panels.preview) {
            this.panels.preview.classList.remove('panel-active', 'panel-inactive');
            this.panels.preview.style.display = '';
            this.panels.preview.style.transform = '';
            this.panels.preview.style.opacity = '';
        }
    }

    setViewportHeight() {
        // Fix for mobile browsers where 100vh includes the address bar
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
            document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
        };

        setVH();

        // Debounced resize handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(setVH, 100);
        });

        // Also handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(setVH, 100);
        });
    }

    setupResizeObserver() {
        // Monitor size changes and adjust UI accordingly
        if ('ResizeObserver' in window) {
            this.resizeObserver = new ResizeObserver(entries => {
                for (const entry of entries) {
                    if (entry.target === document.body) {
                        this.handleResize();
                    }
                }
            });
            this.resizeObserver.observe(document.body);
        }

        // Debounced window resize handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.handleResize(), 150);
        });
    }

    // V17: Setup intersection observer for lazy loading
    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) return;

        this.intersectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('v17-visible');
                        // Lazy load images
                        if (entry.target.dataset.src) {
                            entry.target.src = entry.target.dataset.src;
                            entry.target.removeAttribute('data-src');
                        }
                    }
                });
            },
            {
                root: null,
                rootMargin: '50px',
                threshold: 0.1
            }
        );

        // Observe lazy elements
        document.querySelectorAll('[data-lazy], .v17-animate-on-scroll').forEach(el => {
            this.intersectionObserver.observe(el);
        });
    }

    handleResize() {
        const deviceType = this.getDeviceType();
        const wasMobile = document.body.classList.contains('mobile-view');
        const wasTablet = document.body.classList.contains('tablet-view');

        document.body.dataset.device = deviceType;

        if (this.isMobile()) {
            if (!wasMobile) {
                document.body.classList.remove('tablet-view');
                document.body.classList.add('mobile-view');
                // Setup mobile panel state
                this.setActivePanel(this.activePanel || 'control');
            }
        } else if (this.isTablet()) {
            if (!wasTablet) {
                document.body.classList.remove('mobile-view');
                document.body.classList.add('tablet-view');
                this.resetPanelsForDesktop();
            }
        } else {
            if (wasMobile || wasTablet) {
                document.body.classList.remove('mobile-view', 'tablet-view');
                // Reset to desktop view
                this.resetPanelsForDesktop();
            }
        }

        this.handleOrientationChange();
    }

    setupScrollBehavior() {
        // Hide header on scroll down, show on scroll up (mobile only)
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.updateHeaderVisibility();
                    this.updateFabVisibility();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    updateHeaderVisibility() {
        if (!this.isMobile() || !this.header) return;

        const currentScrollY = window.scrollY;
        const scrollDelta = currentScrollY - this.lastScrollY;

        // Only hide/show after scrolling at least 10px
        if (Math.abs(scrollDelta) < 10) return;

        if (scrollDelta > 0 && currentScrollY > 100) {
            // Scrolling down - hide header
            if (!this.headerHidden) {
                this.header.classList.add('hidden');
                this.headerHidden = true;
            }
        } else if (scrollDelta < 0) {
            // Scrolling up - show header
            if (this.headerHidden) {
                this.header.classList.remove('hidden');
                this.headerHidden = false;
            }
        }

        // Add scrolled class for shadow
        if (currentScrollY > 10) {
            this.header.classList.add('scrolled');
        } else {
            this.header.classList.remove('scrolled');
        }

        this.lastScrollY = currentScrollY;
    }

    // V17: Update FAB visibility on scroll
    updateFabVisibility() {
        if (!this.fab) return;

        const currentScrollY = window.scrollY;

        if (currentScrollY > 300) {
            this.fab.classList.add('v17-fab-visible');
        } else {
            this.fab.classList.remove('v17-fab-visible');
        }
    }

    handleVirtualKeyboard() {
        // iOS virtual keyboard handling
        const inputs = document.querySelectorAll('input, textarea, select');

        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                // Add class when keyboard is shown
                document.body.classList.add('keyboard-visible');

                // Scroll input into view with offset for header
                setTimeout(() => {
                    const headerHeight = this.header?.offsetHeight || 60;
                    const inputRect = input.getBoundingClientRect();
                    const scrollTarget = window.scrollY + inputRect.top - headerHeight - 20;

                    window.scrollTo({
                        top: Math.max(0, scrollTarget),
                        behavior: 'smooth'
                    });
                }, 300);
            });

            input.addEventListener('blur', () => {
                // Remove class when keyboard is hidden
                setTimeout(() => {
                    document.body.classList.remove('keyboard-visible');
                }, 100);
            });
        });

        // Handle window resize (keyboard show/hide)
        let windowHeight = window.innerHeight;
        window.addEventListener('resize', () => {
            const newHeight = window.innerHeight;

            if (newHeight < windowHeight * 0.75) {
                // Keyboard is probably visible
                document.body.classList.add('keyboard-visible');
            } else {
                // Keyboard is probably hidden
                document.body.classList.remove('keyboard-visible');
            }

            windowHeight = newHeight;
        });
    }

    // V17: Setup smooth page transitions
    setupSmoothTransitions() {
        // Add transition class to body for smooth theme changes
        document.body.classList.add('v17-smooth-transitions');

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                document.body.classList.add('v17-page-hidden');
            } else {
                document.body.classList.remove('v17-page-hidden');
                // Re-render if needed
                if (this.activePanel === 'preview' && window.renderImages) {
                    window.renderImages();
                }
            }
        });
    }

    // V17: Advanced gesture recognition
    setupAdvancedGestures() {
        if (!this.isMobile() && !this.isTablet()) return;

        // Long press detection
        let longPressTimer = null;

        document.addEventListener('touchstart', (e) => {
            longPressTimer = setTimeout(() => {
                this.handleLongPress(e);
            }, this.gestures.longPressThreshold);
        }, { passive: true });

        document.addEventListener('touchend', () => {
            clearTimeout(longPressTimer);
        }, { passive: true });

        document.addEventListener('touchmove', () => {
            clearTimeout(longPressTimer);
        }, { passive: true });
    }

    // V17: Handle long press
    handleLongPress(e) {
        const target = e.target.closest('[data-longpress]');
        if (target) {
            this.hapticFeedback('medium');
            const action = target.dataset.longpress;
            if (action) {
                document.dispatchEvent(new CustomEvent('v17-longpress', {
                    detail: { target, action }
                }));
            }
        }
    }

    // V17: Performance monitoring
    setupPerformanceMonitoring() {
        if (!this.isMobile()) return;

        let frameCount = 0;
        let lastTime = performance.now();

        const measureFPS = () => {
            frameCount++;
            const currentTime = performance.now();

            if (currentTime - lastTime >= 1000) {
                this.metrics.fps = frameCount;
                frameCount = 0;
                lastTime = currentTime;

                // Reduce animations if FPS drops below 30
                if (this.metrics.fps < 30) {
                    document.body.classList.add('v17-low-performance');
                } else {
                    document.body.classList.remove('v17-low-performance');
                }
            }

            requestAnimationFrame(measureFPS);
        };

        // Only run FPS monitoring in development or when needed
        if (localStorage.getItem('v17-debug') === 'true') {
            requestAnimationFrame(measureFPS);
        }
    }

    destroy() {
        if (!this.initialized) return;

        // Remove mobile-specific classes
        document.body.classList.remove('mobile-view', 'tablet-view', 'v17-smooth-transitions');

        // Reset panel states
        Object.values(this.panels).forEach(panel => {
            if (panel) {
                panel.classList.remove('panel-active', 'panel-inactive');
                panel.style.display = '';
                panel.style.transform = '';
                panel.style.opacity = '';
            }
        });

        // Remove mobile tabs
        if (this.tabs) {
            this.tabs.remove();
            this.tabs = null;
        }

        // Remove event listeners
        this.removeEventListeners();

        // Disconnect observers
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }

        this.initialized = false;
        console.log('Mobile handler destroyed');
    }

    createMobileTabs() {
        // Check if tabs already exist
        this.tabs = document.getElementById('mobileTabs');
        if (this.tabs) {
            this.tabButtons = this.tabs.querySelectorAll('.tab-button');
            return;
        }

        // Tabs are created in HTML, just get references
        this.tabs = document.getElementById('mobileTabs');
        if (this.tabs) {
            this.tabButtons = this.tabs.querySelectorAll('.tab-button');
        }
    }

    setupEventListeners() {
        // Tab button clicks
        if (this.tabButtons) {
            this.tabButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    const panel = button.dataset.panel;
                    this.hapticFeedback('selection');
                    this.setActivePanel(panel);
                });
            });
        }

        // Touch events for swipe navigation
        this.setupTouchEvents();

        // Add text button special handling
        const addTextButton = document.getElementById('addTextButton');
        if (addTextButton) {
            addTextButton.addEventListener('click', () => {
                // Auto-switch to preview after adding text
                setTimeout(() => {
                    if (this.isMobile()) {
                        this.setActivePanel('preview');
                    }
                }, 100);
            });
        }

        // V17: Double tap to zoom prevention
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - this.lastTapTime < this.gestures.doubleTapThreshold) {
                // Prevent double tap zoom on non-zoomable elements
                if (!e.target.closest('.v17-zoomable')) {
                    e.preventDefault();
                }
            }
            this.lastTapTime = now;
        }, { passive: false });
    }

    removeEventListeners() {
        // Remove touch events
        if (this.panels.control) {
            this.panels.control.removeEventListener('touchstart', this.handleTouchStart);
            this.panels.control.removeEventListener('touchend', this.handleTouchEnd);
        }
        if (this.panels.preview) {
            this.panels.preview.removeEventListener('touchstart', this.handleTouchStart);
            this.panels.preview.removeEventListener('touchend', this.handleTouchEnd);
        }
    }

    setupTouchEvents() {
        const handleTouchStart = (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            this.touchStartTime = Date.now();
        };

        const handleTouchEnd = (e) => {
            if (!this.touchStartX || !this.touchStartY || this.isAnimating) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const touchEndTime = Date.now();

            const deltaX = touchEndX - this.touchStartX;
            const deltaY = touchEndY - this.touchStartY;
            const deltaTime = touchEndTime - this.touchStartTime;

            // Calculate velocity
            const velocity = Math.abs(deltaX) / deltaTime;

            // Check if horizontal swipe with sufficient distance or velocity
            const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
            const hasDistance = Math.abs(deltaX) > this.gestures.swipeThreshold;
            const hasVelocity = velocity > this.gestures.swipeVelocityThreshold;

            if (isHorizontalSwipe && (hasDistance || hasVelocity)) {
                if (deltaX > 0 && this.activePanel === 'preview') {
                    // Swipe right - go to control panel
                    this.hapticFeedback('light');
                    this.setActivePanel('control');
                } else if (deltaX < 0 && this.activePanel === 'control') {
                    // Swipe left - go to preview panel
                    this.hapticFeedback('light');
                    this.setActivePanel('preview');
                }
            }

            this.touchStartX = 0;
            this.touchStartY = 0;
            this.touchStartTime = 0;
        };

        // Bind to current context
        this.handleTouchStart = handleTouchStart.bind(this);
        this.handleTouchEnd = handleTouchEnd.bind(this);

        // Add listeners
        if (this.panels.control) {
            this.panels.control.addEventListener('touchstart', this.handleTouchStart, { passive: true });
            this.panels.control.addEventListener('touchend', this.handleTouchEnd, { passive: true });
        }
        if (this.panels.preview) {
            this.panels.preview.addEventListener('touchstart', this.handleTouchStart, { passive: true });
            this.panels.preview.addEventListener('touchend', this.handleTouchEnd, { passive: true });
        }
    }

    setActivePanel(panel) {
        if (this.isAnimating) return;

        this.isAnimating = true;
        this.activePanel = panel;

        // Update tab buttons
        if (this.tabButtons) {
            this.tabButtons.forEach(button => {
                const isActive = button.dataset.panel === panel;
                button.classList.toggle('active', isActive);
                button.setAttribute('aria-selected', isActive);
            });
        }

        // Update panels with V17 animations
        if (panel === 'control') {
            this.showPanel(this.panels.control, 'left');
            this.hidePanel(this.panels.preview, 'right');
        } else {
            this.showPanel(this.panels.preview, 'right');
            this.hidePanel(this.panels.control, 'left');

            // Trigger render when switching to preview
            if (window.renderImages) {
                setTimeout(() => {
                    window.renderImages();
                }, 150);
            }
        }

        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Save active panel preference
        localStorage.setItem('activeMobilePanel', panel);

        // Reset animation lock
        setTimeout(() => {
            this.isAnimating = false;
        }, 300);
    }

    showPanel(panel, direction = 'right') {
        if (!panel) return;

        // V17: Smooth slide animation
        panel.style.display = 'block';
        panel.style.transform = direction === 'right' ? 'translateX(30px)' : 'translateX(-30px)';
        panel.style.opacity = '0';

        requestAnimationFrame(() => {
            panel.classList.add('panel-active');
            panel.classList.remove('panel-inactive');
            panel.style.transform = 'translateX(0)';
            panel.style.opacity = '1';
        });

        // Reset scroll position
        window.scrollTo(0, 0);

        // Focus management for accessibility
        const firstFocusable = panel.querySelector('input, textarea, select, button, [tabindex="0"]');
        if (firstFocusable && !this.isTablet()) {
            setTimeout(() => firstFocusable.focus(), 150);
        }
    }

    hidePanel(panel, direction = 'left') {
        if (!panel) return;

        panel.classList.remove('panel-active');
        panel.classList.add('panel-inactive');

        // V17: Smooth slide out animation
        panel.style.transform = direction === 'left' ? 'translateX(-30px)' : 'translateX(30px)';
        panel.style.opacity = '0';

        // Hide after animation
        setTimeout(() => {
            if (panel.classList.contains('panel-inactive')) {
                panel.style.display = 'none';
            }
        }, 250);
    }

    // Utility methods
    isMobile() {
        return window.innerWidth <= this.breakpoints.mobile;
    }

    isLandscape() {
        return window.innerWidth > window.innerHeight;
    }

    // Handle orientation changes
    handleOrientationChange() {
        if (!this.initialized) return;

        // Adjust UI for landscape mode
        if (this.isLandscape()) {
            document.body.classList.add('landscape-mode');
        } else {
            document.body.classList.remove('landscape-mode');
        }

        // V17: Adjust viewport on orientation change
        this.setViewportHeight();
    }

    // Get safe area insets for iOS
    getSafeAreaInsets() {
        const computedStyle = getComputedStyle(document.documentElement);
        return {
            top: parseInt(computedStyle.getPropertyValue('--sat') || computedStyle.getPropertyValue('env(safe-area-inset-top)') || 0),
            right: parseInt(computedStyle.getPropertyValue('--sar') || 0),
            bottom: parseInt(computedStyle.getPropertyValue('--sab') || computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || 0),
            left: parseInt(computedStyle.getPropertyValue('--sal') || 0)
        };
    }

    // Check if device has notch
    hasNotch() {
        const insets = this.getSafeAreaInsets();
        return insets.top > 20 || insets.bottom > 0;
    }

    // Vibrate feedback (if supported)
    vibrate(duration = 10) {
        if ('vibrate' in navigator) {
            navigator.vibrate(duration);
        }
    }

    // V17: Enhanced toast with types
    showToast(message, options = {}) {
        const { duration = 3000, type = 'info', icon = null } = options;

        const toast = document.createElement('div');
        toast.className = `v17-toast v17-toast-${type}`;

        const iconMap = {
            success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
        };

        toast.innerHTML = `
            <span class="v17-toast-icon">${icon || iconMap[type] || iconMap.info}</span>
            <span class="v17-toast-message">${message}</span>
        `;

        toast.style.cssText = `
            position: fixed;
            bottom: calc(80px + env(safe-area-inset-bottom, 0px));
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            display: flex;
            align-items: center;
            gap: 10px;
            background: ${type === 'error' ? 'rgba(239, 68, 68, 0.95)' : type === 'success' ? 'rgba(16, 185, 129, 0.95)' : type === 'warning' ? 'rgba(245, 158, 11, 0.95)' : 'rgba(30, 30, 30, 0.95)'};
            color: white;
            padding: 14px 24px;
            border-radius: 16px;
            font-size: 15px;
            font-weight: 500;
            z-index: 10000;
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            max-width: calc(100vw - 32px);
        `;

        document.body.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        // Remove after duration
        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) translateY(100px)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, duration);

        return toast;
    }

    // Enhanced haptic feedback
    hapticFeedback(type = 'light') {
        if ('vibrate' in navigator) {
            const patterns = {
                light: 10,
                medium: 20,
                heavy: 30,
                success: [10, 50, 10],
                error: [50, 30, 50],
                selection: 5,
                impact: [15, 30, 15]
            };
            navigator.vibrate(patterns[type] || patterns.light);
        }
    }

    // V17: Show loading indicator
    showLoading(message = 'Loading...') {
        let loader = document.getElementById('v17-loader');

        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'v17-loader';
            loader.className = 'v17-loader-overlay';
            loader.innerHTML = `
                <div class="v17-loader-content">
                    <div class="v17-loader-spinner"></div>
                    <span class="v17-loader-text">${message}</span>
                </div>
            `;
            loader.style.cssText = `
                position: fixed;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
                z-index: 10001;
                opacity: 0;
                transition: opacity 0.2s;
            `;
            document.body.appendChild(loader);
        } else {
            loader.querySelector('.v17-loader-text').textContent = message;
        }

        requestAnimationFrame(() => {
            loader.style.opacity = '1';
        });

        return loader;
    }

    // V17: Hide loading indicator
    hideLoading() {
        const loader = document.getElementById('v17-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 200);
        }
    }

    // Pull to refresh handler (optional)
    setupPullToRefresh(callback) {
        if (!this.isMobile()) return;

        let startY = 0;
        let pulling = false;
        const threshold = 80;

        const activePanel = document.querySelector('.panel-active');
        if (!activePanel) return;

        activePanel.addEventListener('touchstart', (e) => {
            if (activePanel.scrollTop === 0) {
                startY = e.touches[0].clientY;
                pulling = true;
            }
        }, { passive: true });

        activePanel.addEventListener('touchmove', (e) => {
            if (!pulling) return;
            const currentY = e.touches[0].clientY;
            const distance = currentY - startY;

            if (distance > 0 && distance < threshold * 1.5) {
                // Visual feedback for pulling
                activePanel.style.transform = `translateY(${distance * 0.3}px)`;
            }
        }, { passive: true });

        activePanel.addEventListener('touchend', () => {
            if (!pulling) return;
            pulling = false;

            // Reset transform
            activePanel.style.transform = '';
            activePanel.style.transition = 'transform 0.3s ease';
            setTimeout(() => {
                activePanel.style.transition = '';
            }, 300);
        }, { passive: true });
    }

    // Check device capabilities
    getDeviceCapabilities() {
        return {
            touch: 'ontouchstart' in window,
            hover: window.matchMedia('(hover: hover)').matches,
            pointer: window.matchMedia('(pointer: fine)').matches ? 'fine' : 'coarse',
            orientation: screen.orientation?.type || 'unknown',
            standalone: window.matchMedia('(display-mode: standalone)').matches,
            darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
            reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            highContrast: window.matchMedia('(prefers-contrast: high)').matches,
            connection: navigator.connection?.effectiveType || 'unknown',
            memory: navigator.deviceMemory || 'unknown',
            cores: navigator.hardwareConcurrency || 'unknown'
        };
    }

    // Apply device-specific optimizations
    applyDeviceOptimizations() {
        const capabilities = this.getDeviceCapabilities();

        // Touch device
        if (capabilities.touch && !capabilities.hover) {
            document.body.classList.add('touch-device');
        }

        // Dark mode preference
        if (capabilities.darkMode) {
            document.body.classList.add('dark-mode-preference');
        }

        // Reduced motion preference
        if (capabilities.reducedMotion) {
            document.body.classList.add('reduced-motion');
        }

        // High contrast preference
        if (capabilities.highContrast) {
            document.body.classList.add('high-contrast');
        }

        // PWA standalone mode
        if (capabilities.standalone) {
            document.body.classList.add('pwa-standalone');
        }

        // V17: Slow connection optimization
        if (capabilities.connection === 'slow-2g' || capabilities.connection === '2g') {
            document.body.classList.add('v17-slow-connection');
        }

        // V17: Low memory optimization
        if (capabilities.memory && capabilities.memory < 4) {
            document.body.classList.add('v17-low-memory');
        }

        // Listen for preference changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            document.body.classList.toggle('dark-mode-preference', e.matches);
        });

        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            document.body.classList.toggle('reduced-motion', e.matches);
        });
    }

    // Cleanup method
    cleanup() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        this.destroy();
    }
}
