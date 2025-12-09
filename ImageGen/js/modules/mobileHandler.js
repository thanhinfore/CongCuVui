/* =====================================================
   MOBILEHANDLER.JS - Mobile Functionality Module
   V16 Enhanced - Perfect PC & Mobile Compatibility
   ===================================================== */

export class MobileHandler {
    constructor() {
        this.initialized = false;
        this.activePanel = 'control';
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.lastScrollY = 0;
        this.scrollDirection = 'up';
        this.headerHidden = false;

        // DOM references
        this.panels = {
            control: null,
            preview: null
        };
        this.tabs = null;
        this.tabButtons = null;
        this.header = null;

        // Breakpoint
        this.mobileBreakpoint = 768;

        // Resize observer
        this.resizeObserver = null;
    }

    init() {
        if (this.initialized) return;

        // Get DOM references
        this.panels.control = document.querySelector('.control-panel');
        this.panels.preview = document.querySelector('.preview-panel');
        this.header = document.querySelector('.app-header');

        // Create mobile tabs if they don't exist
        this.createMobileTabs();

        // Setup initial state
        this.setActivePanel('control');

        // Setup event listeners
        this.setupEventListeners();

        // Add mobile-specific classes
        document.body.classList.add('mobile-view');

        // Handle virtual keyboard
        this.handleVirtualKeyboard();

        // Setup scroll-based header hide/show
        this.setupScrollBehavior();

        // Setup resize observer
        this.setupResizeObserver();

        // Set viewport height CSS variable for mobile browsers
        this.setViewportHeight();

        this.initialized = true;
        console.log('Mobile handler V16 initialized');
    }

    setViewportHeight() {
        // Fix for mobile browsers where 100vh includes the address bar
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);

        window.addEventListener('resize', () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
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

        // Also listen to window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
        const isMobile = window.innerWidth <= this.mobileBreakpoint;

        if (isMobile) {
            document.body.classList.add('mobile-view');
            if (!this.initialized) {
                this.init();
            }
        } else {
            document.body.classList.remove('mobile-view');
            // On desktop, show both panels
            if (this.panels.control) {
                this.panels.control.classList.remove('panel-active', 'panel-inactive');
                this.panels.control.style.display = '';
            }
            if (this.panels.preview) {
                this.panels.preview.classList.remove('panel-active', 'panel-inactive');
                this.panels.preview.style.display = '';
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

    handleVirtualKeyboard() {
        // iOS virtual keyboard handling
        const inputs = document.querySelectorAll('input, textarea, select');

        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                // Add class when keyboard is shown
                document.body.classList.add('keyboard-visible');

                // Scroll input into view
                setTimeout(() => {
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });

            input.addEventListener('blur', () => {
                // Remove class when keyboard is hidden
                document.body.classList.remove('keyboard-visible');

                // Reset scroll on iOS
                window.scrollTo(0, 0);
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

    destroy() {
        if (!this.initialized) return;

        // Remove mobile-specific classes
        document.body.classList.remove('mobile-view');

        // Reset panel states
        Object.values(this.panels).forEach(panel => {
            if (panel) {
                panel.classList.remove('panel-active', 'panel-inactive');
                panel.style.display = '';
            }
        });

        // Remove mobile tabs
        if (this.tabs) {
            this.tabs.remove();
            this.tabs = null;
        }

        // Remove event listeners
        this.removeEventListeners();

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
                    if (window.innerWidth <= 768) {
                        this.setActivePanel('preview');
                    }
                }, 100);
            });
        }
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
        };

        const handleTouchEnd = (e) => {
            if (!this.touchStartX || !this.touchStartY) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const deltaX = touchEndX - this.touchStartX;
            const deltaY = touchEndY - this.touchStartY;

            // Check if horizontal swipe
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (deltaX > 0 && this.activePanel === 'preview') {
                    // Swipe right - go to control panel
                    this.setActivePanel('control');
                } else if (deltaX < 0 && this.activePanel === 'control') {
                    // Swipe left - go to preview panel
                    this.setActivePanel('preview');
                }
            }

            this.touchStartX = 0;
            this.touchStartY = 0;
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
        this.activePanel = panel;

        // Update tab buttons
        if (this.tabButtons) {
            this.tabButtons.forEach(button => {
                button.classList.toggle('active', button.dataset.panel === panel);
            });
        }

        // Update panels
        if (panel === 'control') {
            this.showPanel(this.panels.control);
            this.hidePanel(this.panels.preview);
        } else {
            this.showPanel(this.panels.preview);
            this.hidePanel(this.panels.control);

            // Trigger render when switching to preview
            if (window.renderImages) {
                setTimeout(() => {
                    window.renderImages();
                }, 100);
            }
        }

        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Save active panel preference
        localStorage.setItem('activeMobilePanel', panel);
    }

    showPanel(panel) {
        if (!panel) return;
        panel.classList.add('panel-active');
        panel.classList.remove('panel-inactive');
        panel.style.display = 'block';

        // Reset scroll position
        window.scrollTo(0, 0);

        // Focus management for accessibility
        const firstInput = panel.querySelector('input, textarea, select, button');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    hidePanel(panel) {
        if (!panel) return;
        panel.classList.remove('panel-active');
        panel.classList.add('panel-inactive');

        // Hide after animation
        setTimeout(() => {
            if (panel.classList.contains('panel-inactive')) {
                panel.style.display = 'none';
            }
        }, 200);
    }

    // Utility methods
    isMobile() {
        return window.innerWidth <= 768;
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
    }

    // Get safe area insets for iOS
    getSafeAreaInsets() {
        const computedStyle = getComputedStyle(document.documentElement);
        return {
            top: parseInt(computedStyle.getPropertyValue('--sat') || 0),
            right: parseInt(computedStyle.getPropertyValue('--sar') || 0),
            bottom: parseInt(computedStyle.getPropertyValue('--sab') || 0),
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

    // Show mobile-specific notification
    showToast(message, duration = 3000) {
        const toast = document.createElement('div');
        toast.className = 'mobile-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: calc(80px + env(safe-area-inset-bottom));
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 14px 28px;
            border-radius: 28px;
            font-size: 15px;
            font-weight: 500;
            z-index: 1000;
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        `;

        document.body.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        // Remove after duration
        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) translateY(100px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
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
                selection: 5
            };
            navigator.vibrate(patterns[type] || patterns.light);
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
            highContrast: window.matchMedia('(prefers-contrast: high)').matches
        };
    }

    // Apply device-specific optimizations
    applyDeviceOptimizations() {
        const capabilities = this.getDeviceCapabilities();

        if (capabilities.touch && !capabilities.hover) {
            document.body.classList.add('touch-device');
        }

        if (capabilities.darkMode) {
            document.body.classList.add('dark-mode-preference');
        }

        if (capabilities.reducedMotion) {
            document.body.classList.add('reduced-motion');
        }

        if (capabilities.standalone) {
            document.body.classList.add('pwa-standalone');
        }
    }

    // Cleanup method
    cleanup() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        this.destroy();
    }
}