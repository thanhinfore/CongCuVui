/* =====================================================
   MOBILEHANDLER.JS - Mobile Functionality Module
   ===================================================== */

export class MobileHandler {
    constructor() {
        this.initialized = false;
        this.activePanel = 'control';
        this.touchStartX = 0;
        this.touchStartY = 0;

        // DOM references
        this.panels = {
            control: null,
            preview: null
        };
        this.tabs = null;
        this.tabButtons = null;
    }

    init() {
        if (this.initialized) return;

        // Get DOM references
        this.panels.control = document.querySelector('.control-panel');
        this.panels.preview = document.querySelector('.preview-panel');

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

        this.initialized = true;
        console.log('Mobile handler initialized');
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
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 24px;
            font-size: 14px;
            z-index: 1000;
            transition: transform 0.3s ease;
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
}