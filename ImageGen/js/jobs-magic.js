/**
 * STEVE JOBS MAGIC - Delightful Interactions
 * "Design is not just what it looks like and feels like. Design is how it works."
 *
 * This file adds magical, delightful interactions inspired by Apple's philosophy
 */

(function() {
    'use strict';

    // ===== ADVANCED FEATURES TOGGLE =====
    function initAdvancedToggle() {
        // Create the floating toggle button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'advanced-toggle';
        toggleButton.innerHTML = '⚙️';
        toggleButton.title = 'Show Advanced Features';
        toggleButton.setAttribute('aria-label', 'Toggle advanced features');

        document.body.appendChild(toggleButton);

        // Toggle advanced features
        toggleButton.addEventListener('click', function() {
            document.body.classList.toggle('show-advanced');

            if (document.body.classList.contains('show-advanced')) {
                toggleButton.innerHTML = '✕';
                toggleButton.title = 'Hide Advanced Features';
                showToast('✨ Advanced features unlocked!', 'success');
            } else {
                toggleButton.innerHTML = '⚙️';
                toggleButton.title = 'Show Advanced Features';
                showToast('Simplified view activated', 'info');
            }
        });
    }

    // ===== MAGICAL TOAST NOTIFICATIONS =====
    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer') || createToastContainer();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s cubic-bezier(0.4, 0, 1, 1) forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }

    // ===== CELEBRATION EFFECT =====
    function celebrate() {
        const celebration = document.createElement('div');
        celebration.className = 'celebration';
        celebration.innerHTML = `
            <style>
                .celebration-confetti {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    background: var(--apple-blue);
                    animation: confettiFall 3s ease-out forwards;
                }
                @keyframes confettiFall {
                    to {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
            </style>
        `;

        // Create 50 confetti pieces
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'celebration-confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            confetti.style.background = `hsl(${Math.random() * 360}, 70%, 60%)`;
            celebration.appendChild(confetti);
        }

        document.body.appendChild(celebration);
        setTimeout(() => celebration.remove(), 3000);
    }

    // ===== SMOOTH SCROLL WITH EASING =====
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // ===== PARALLAX HEADER ON SCROLL =====
    function initHeaderEffects() {
        let lastScroll = 0;
        const header = document.querySelector('.app-header');

        if (!header) return;

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;

            // Add scrolled class for styling
            if (currentScroll > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            // Auto-hide header when scrolling down (optional)
            // if (currentScroll > lastScroll && currentScroll > 200) {
            //     header.style.transform = 'translateY(-100%)';
            // } else {
            //     header.style.transform = 'translateY(0)';
            // }

            lastScroll = currentScroll;
        });
    }

    // ===== FOCUS MODE - Minimize distractions =====
    function initFocusMode() {
        const textInput = document.getElementById('textInput');
        if (!textInput) return;

        let focusTimeout;

        textInput.addEventListener('focus', () => {
            focusTimeout = setTimeout(() => {
                document.body.classList.add('focus-mode');
            }, 3000); // Enter focus mode after 3 seconds of typing
        });

        textInput.addEventListener('blur', () => {
            clearTimeout(focusTimeout);
            document.body.classList.remove('focus-mode');
        });
    }

    // ===== AUTO-SAVE INDICATION =====
    function showAutoSaveIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'auto-save-indicator';
        indicator.innerHTML = '✓ Saved';
        indicator.style.cssText = `
            position: fixed;
            top: 80px;
            right: 24px;
            background: rgba(52, 199, 89, 0.95);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3);
            z-index: 1000;
            animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        `;

        document.body.appendChild(indicator);

        setTimeout(() => {
            indicator.style.animation = 'slideOutRight 0.3s cubic-bezier(0.4, 0, 1, 1) forwards';
            setTimeout(() => indicator.remove(), 300);
        }, 2000);
    }

    // ===== KEYBOARD SHORTCUTS WITH FEEDBACK =====
    function initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter: Add text to images
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                const addButton = document.getElementById('addTextButton');
                if (addButton && !addButton.disabled) {
                    addButton.click();
                    showToast('⚡ Processing images...', 'info');
                }
            }

            // Ctrl/Cmd + S: Save settings
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                showAutoSaveIndicator();
            }

            // ?: Show keyboard shortcuts
            if (e.key === '?') {
                const shortcutsModal = document.getElementById('keyboardShortcutsModal');
                if (shortcutsModal) {
                    shortcutsModal.style.display = 'flex';
                }
            }

            // Esc: Close modals
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal, .modal-overlay').forEach(modal => {
                    modal.style.display = 'none';
                });
                document.body.classList.remove('focus-mode');
            }
        });
    }

    // ===== ENHANCED BUTTON INTERACTIONS =====
    function enhanceButtonInteractions() {
        // Add haptic-like feedback to all buttons
        document.querySelectorAll('button, .button').forEach(button => {
            button.addEventListener('click', function(e) {
                // Visual ripple effect
                const ripple = document.createElement('span');
                ripple.className = 'ripple';
                ripple.style.cssText = `
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.5);
                    width: 20px;
                    height: 20px;
                    animation: rippleEffect 0.6s ease-out;
                    pointer-events: none;
                `;

                const rect = this.getBoundingClientRect();
                ripple.style.left = (e.clientX - rect.left - 10) + 'px';
                ripple.style.top = (e.clientY - rect.top - 10) + 'px';

                this.style.position = 'relative';
                this.appendChild(ripple);

                setTimeout(() => ripple.remove(), 600);
            });
        });

        // Add ripple animation
        if (!document.getElementById('rippleStyles')) {
            const style = document.createElement('style');
            style.id = 'rippleStyles';
            style.textContent = `
                @keyframes rippleEffect {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ===== SMART HINTS - Show contextual tips =====
    function initSmartHints() {
        const hints = [
            { selector: '#textInput', message: '💡 Tip: Use Markdown for rich formatting!' },
            { selector: '#knowledgeModeCheckbox', message: '🎓 Knowledge Mode creates one image per line!' },
            { selector: '#addTextButton', message: '⚡ Shortcut: Press Ctrl+Enter to generate!' }
        ];

        hints.forEach(hint => {
            const element = document.querySelector(hint.selector);
            if (!element) return;

            let hintTimeout;
            element.addEventListener('mouseenter', () => {
                hintTimeout = setTimeout(() => {
                    showToast(hint.message, 'info');
                }, 2000);
            });

            element.addEventListener('mouseleave', () => {
                clearTimeout(hintTimeout);
            });
        });
    }

    // ===== PROGRESS ENHANCEMENT =====
    function enhanceProgressBar() {
        const progressBar = document.getElementById('progressBarFill');
        if (!progressBar) return;

        // Smooth progress animation
        const originalSetProgress = window.setProgress || function() {};
        window.setProgress = function(percent) {
            progressBar.style.transition = 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            progressBar.style.width = percent + '%';

            // Change color based on progress
            if (percent < 30) {
                progressBar.style.background = 'linear-gradient(90deg, #FF3B30, #FF6B6B)';
            } else if (percent < 70) {
                progressBar.style.background = 'linear-gradient(90deg, #FF9500, #FFCC00)';
            } else {
                progressBar.style.background = 'linear-gradient(90deg, #34C759, #30D158)';
            }

            // Celebrate on completion
            if (percent >= 100) {
                setTimeout(() => {
                    celebrate();
                    showToast('🎉 Images generated successfully!', 'success');
                }, 500);
            }

            originalSetProgress(percent);
        };
    }

    // ===== IMAGE HOVER PREVIEW ENHANCEMENT =====
    function enhanceImagePreviews() {
        document.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('canvas-item') ||
                e.target.closest('.canvas-item')) {
                const item = e.target.classList.contains('canvas-item') ?
                             e.target : e.target.closest('.canvas-item');
                item.style.transform = 'scale(1.02)';
                item.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('canvas-item') ||
                e.target.closest('.canvas-item')) {
                const item = e.target.classList.contains('canvas-item') ?
                             e.target : e.target.closest('.canvas-item');
                item.style.transform = 'scale(1)';
                item.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
            }
        });
    }

    // ===== SECTION COLLAPSE/EXPAND ANIMATIONS =====
    function enhanceSectionAnimations() {
        document.querySelectorAll('.section-header').forEach(header => {
            header.addEventListener('click', function() {
                const section = this.parentElement;
                const content = section.querySelector('.section-content');

                if (section.classList.contains('collapsed')) {
                    // Expanding
                    showToast('Section expanded', 'info');
                } else {
                    // Collapsing
                    showToast('Section minimized', 'info');
                }
            });
        });
    }

    // ===== DRAG & DROP ENHANCEMENT =====
    function enhanceDragDrop() {
        const uploadArea = document.getElementById('uploadArea');
        if (!uploadArea) return;

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                uploadArea.classList.add('drag-over');
                showToast('Drop your images here! 📸', 'info');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
            });
        });
    }

    // ===== INITIALIZE ALL MAGICAL FEATURES =====
    function initJobsMagic() {
        console.log('🍎 Initializing Steve Jobs Magic...');

        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                initAllFeatures();
            });
        } else {
            initAllFeatures();
        }
    }

    function initAllFeatures() {
        try {
            initAdvancedToggle();
            initSmoothScroll();
            initHeaderEffects();
            initFocusMode();
            initKeyboardShortcuts();
            enhanceButtonInteractions();
            initSmartHints();
            enhanceProgressBar();
            enhanceImagePreviews();
            enhanceSectionAnimations();
            enhanceDragDrop();

            console.log('✨ Steve Jobs Magic initialized successfully!');

            // Show welcome message
            setTimeout(() => {
                showToast('🍎 Welcome to Knowledge Visualizer - Designed with love', 'success');
            }, 1000);
        } catch (error) {
            console.error('Error initializing Jobs Magic:', error);
        }
    }

    // ===== EXPORT FUNCTIONS FOR EXTERNAL USE =====
    window.JobsMagic = {
        showToast,
        celebrate,
        showAutoSaveIndicator
    };

    // Auto-initialize
    initJobsMagic();

})();
