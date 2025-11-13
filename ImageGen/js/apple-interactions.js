/**
 * Apple-style Interactions & Micro-animations
 * "Design is not just what it looks like and feels like. Design is how it works." - Steve Jobs
 */

(function() {
    'use strict';

    // ===== INITIALIZATION =====
    function init() {
        setupHeaderEffects();
        setupProgressiveDisclosure();
        setupSmoothScrolling();
        setupRippleEffects();
        setupFormEnhancements();
        setupCollapseAnimations();
        setupLoadingEnhancements();
        setupAccessibility();
        setupMicroInteractions();

        console.log('🍎 Apple Design System initialized');
    }

    // ===== HEADER EFFECTS (macOS Style) =====
    function setupHeaderEffects() {
        const header = document.querySelector('.app-header');
        if (!header) return;

        let lastScrollY = window.scrollY;
        let ticking = false;

        function updateHeader() {
            const scrollY = window.scrollY;

            if (scrollY > 10) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            lastScrollY = scrollY;
            ticking = false;
        }

        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(updateHeader);
                ticking = true;
            }
        });
    }

    // ===== PROGRESSIVE DISCLOSURE (Apple Philosophy) =====
    function setupProgressiveDisclosure() {
        // Auto-collapse advanced sections on load
        const advancedSections = [
            'advancedPositioningSection',
            'filtersSection',
            'presetsSection'
        ];

        advancedSections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section && !section.classList.contains('collapsed')) {
                section.classList.add('collapsed');
            }
        });

        // Make essential sections always visible
        const essentialSections = [
            'textSection',
            'uploadSection',
            'solidBackgroundSection',
            'styleSection'
        ];

        essentialSections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.classList.remove('collapsed');
            }
        });

        console.log('✨ Progressive disclosure applied - Simplified UI');
    }

    // ===== SMOOTH SCROLLING (iOS Style) =====
    function setupSmoothScrolling() {
        // Smooth scroll to elements
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#') return;

                e.preventDefault();
                const target = document.querySelector(href);

                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // ===== RIPPLE EFFECTS (Material + Apple Hybrid) =====
    function setupRippleEffects() {
        const buttons = document.querySelectorAll('.primary-button, #addTextButton');

        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                const rect = button.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.classList.add('ripple-effect');

                Object.assign(ripple.style, {
                    position: 'absolute',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.5)',
                    transform: 'scale(0)',
                    animation: 'ripple 0.6s ease-out',
                    pointerEvents: 'none'
                });

                button.appendChild(ripple);

                setTimeout(() => ripple.remove(), 600);
            });
        });

        // Add ripple animation
        if (!document.getElementById('apple-ripple-style')) {
            const style = document.createElement('style');
            style.id = 'apple-ripple-style';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ===== FORM ENHANCEMENTS (iOS Style) =====
    function setupFormEnhancements() {
        // Auto-resize textareas
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            textarea.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = this.scrollHeight + 'px';
            });
        });

        // Add focus animations to inputs
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement?.classList.add('focused');
            });

            input.addEventListener('blur', function() {
                this.parentElement?.classList.remove('focused');
            });
        });

        // Range slider value display
        const rangeInputs = document.querySelectorAll('.range-input');
        rangeInputs.forEach(range => {
            range.addEventListener('input', function() {
                // Add haptic-like visual feedback
                this.style.transform = 'scaleY(1.1)';
                setTimeout(() => {
                    this.style.transform = 'scaleY(1)';
                }, 100);
            });
        });
    }

    // ===== COLLAPSE ANIMATIONS (Accordion Style) =====
    function setupCollapseAnimations() {
        const sections = document.querySelectorAll('.panel-section');

        sections.forEach(section => {
            const header = section.querySelector('.section-header');
            const content = section.querySelector('.section-content');

            if (!header || !content) return;

            // Make header clickable
            header.style.cursor = 'pointer';

            header.addEventListener('click', function(e) {
                // Prevent double-trigger if clicking buttons inside header
                if (e.target.closest('button') || e.target.closest('.info-button')) {
                    return;
                }

                const isCollapsed = section.classList.contains('collapsed');

                // Add transition class
                section.classList.add('transitioning');

                if (isCollapsed) {
                    section.classList.remove('collapsed');
                    // Smooth expand animation
                    content.style.maxHeight = content.scrollHeight + 'px';
                } else {
                    section.classList.add('collapsed');
                    // Smooth collapse animation
                    content.style.maxHeight = '0';
                }

                // Remove transition class after animation
                setTimeout(() => {
                    section.classList.remove('transitioning');
                }, 300);
            });
        });
    }

    // ===== LOADING ENHANCEMENTS (iOS Style) =====
    function setupLoadingEnhancements() {
        const loadingOverlay = document.getElementById('loadingOverlay');

        if (loadingOverlay) {
            // Add subtle animation to loading overlay
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.attributeName === 'style') {
                        const isVisible = loadingOverlay.style.display !== 'none';
                        if (isVisible) {
                            document.body.style.overflow = 'hidden';
                            loadingOverlay.style.animation = 'fadeIn 0.3s ease';
                        } else {
                            document.body.style.overflow = '';
                        }
                    }
                });
            });

            observer.observe(loadingOverlay, { attributes: true });
        }
    }

    // ===== ACCESSIBILITY ENHANCEMENTS =====
    function setupAccessibility() {
        // Add keyboard navigation hints
        document.addEventListener('keydown', function(e) {
            // ESC to close modals
            if (e.key === 'Escape') {
                const modals = document.querySelectorAll('.modal[style*="display: block"], .modal[style*="display:block"]');
                modals.forEach(modal => {
                    modal.style.display = 'none';
                });
            }
        });

        // Add focus visible class for keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', function() {
            document.body.classList.remove('keyboard-navigation');
        });
    }

    // ===== MICRO-INTERACTIONS (Delightful Details) =====
    function setupMicroInteractions() {
        // Checkbox animations
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    this.style.animation = 'checkboxPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                } else {
                    this.style.animation = 'checkboxUnpop 0.2s ease';
                }
            });
        });

        // Button hover sound effect (visual feedback)
        const allButtons = document.querySelectorAll('button, .button');
        allButtons.forEach(button => {
            button.addEventListener('mouseenter', function() {
                this.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
            });
        });

        // Add checkbox animations
        if (!document.getElementById('apple-checkbox-animations')) {
            const style = document.createElement('style');
            style.id = 'apple-checkbox-animations';
            style.textContent = `
                @keyframes checkboxPop {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.15); }
                    100% { transform: scale(1); }
                }

                @keyframes checkboxUnpop {
                    0% { transform: scale(1); }
                    50% { transform: scale(0.9); }
                    100% { transform: scale(1); }
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .keyboard-navigation *:focus {
                    outline: 2px solid #007AFF !important;
                    outline-offset: 2px !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ===== UPLOAD AREA ENHANCEMENTS =====
    function setupUploadAreaEffects() {
        const uploadArea = document.querySelector('.upload-area');
        if (!uploadArea) return;

        // Drag & drop visual feedback
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, function(e) {
                e.preventDefault();
                e.stopPropagation();
                this.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, function(e) {
                e.preventDefault();
                e.stopPropagation();
                this.classList.remove('drag-over');
            });
        });
    }

    // ===== PREVIEW PANEL ENHANCEMENTS =====
    function setupPreviewEnhancements() {
        const canvasContainer = document.getElementById('canvasContainer');
        if (!canvasContainer) return;

        // Add smooth transitions when images appear
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1 && node.tagName === 'CANVAS') {
                        node.style.animation = 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                    }
                });
            });
        });

        observer.observe(canvasContainer, { childList: true, subtree: true });

        // Add fadeInUp animation
        if (!document.getElementById('apple-preview-animations')) {
            const style = document.createElement('style');
            style.id = 'apple-preview-animations';
            style.textContent = `
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ===== SMART SCROLL TO TOP =====
    function setupScrollToTop() {
        let scrollBtn = document.getElementById('scrollToTopBtn');

        if (!scrollBtn) {
            scrollBtn = document.createElement('button');
            scrollBtn.id = 'scrollToTopBtn';
            scrollBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 19V5M5 12l7-7 7 7"/>
                </svg>
            `;
            scrollBtn.style.cssText = `
                position: fixed;
                bottom: 32px;
                right: 32px;
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(10px);
                border: 0.5px solid rgba(0, 0, 0, 0.1);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                cursor: pointer;
                opacity: 0;
                transform: scale(0.8);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: none;
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #007AFF;
            `;
            document.body.appendChild(scrollBtn);
        }

        window.addEventListener('scroll', function() {
            if (window.scrollY > 500) {
                scrollBtn.style.opacity = '1';
                scrollBtn.style.transform = 'scale(1)';
                scrollBtn.style.pointerEvents = 'auto';
            } else {
                scrollBtn.style.opacity = '0';
                scrollBtn.style.transform = 'scale(0.8)';
                scrollBtn.style.pointerEvents = 'none';
            }
        });

        scrollBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        scrollBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
            this.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
        });

        scrollBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        });
    }

    // ===== PERFORMANCE OPTIMIZATION =====
    function optimizePerformance() {
        // Debounce function for performance
        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        // Throttle function for scroll events
        function throttle(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }

        // Make these available globally if needed
        window.appleDesign = {
            debounce,
            throttle
        };
    }

    // ===== INITIALIZE ON DOM READY =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Additional setup
    window.addEventListener('load', function() {
        setupUploadAreaEffects();
        setupPreviewEnhancements();
        setupScrollToTop();
        optimizePerformance();
    });

    // Export for potential module usage
    window.AppleDesignSystem = {
        init,
        setupProgressiveDisclosure,
        setupMicroInteractions
    };

})();
