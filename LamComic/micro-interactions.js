/**
 * Micro-interactions và Visual Feedback
 * Nâng cao trải nghiệm người dùng với các hiệu ứng tinh tế
 */

// ==================== RIPPLE EFFECT ====================

/**
 * Thêm hiệu ứng ripple cho buttons
 */
function initRippleEffect() {
    document.querySelectorAll('.btn, .tool-btn, .history-btn, .preset-btn, .zoom-btn, .quick-btn').forEach(btn => {
        if (btn.dataset.rippleInit) return;
        btn.dataset.rippleInit = 'true';

        btn.addEventListener('click', function(e) {
            createRipple(this, e);
        });
    });
}

/**
 * Tạo ripple effect
 */
function createRipple(element, event) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';

    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.4);
        border-radius: 50%;
        transform: scale(0);
        animation: rippleAnim 0.6s ease-out;
        pointer-events: none;
    `;

    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
}

// ==================== BUTTON HOVER EFFECTS ====================

/**
 * Thêm hover effects nâng cao
 */
function initHoverEffects() {
    // Tool buttons magnetic effect
    document.querySelectorAll('.tool-btn').forEach(btn => {
        if (btn.dataset.hoverInit) return;
        btn.dataset.hoverInit = 'true';

        btn.addEventListener('mouseenter', function(e) {
            this.style.transform = 'translateY(-3px) scale(1.02)';
        });

        btn.addEventListener('mouseleave', function(e) {
            if (!this.classList.contains('active')) {
                this.style.transform = '';
            }
        });
    });
}

// ==================== SUCCESS/ERROR FEEDBACK ====================

/**
 * Hiển thị feedback animation khi hoàn thành action
 */
function showActionFeedback(type = 'success', message = '') {
    const colors = {
        success: '#22c55e',
        error: '#ef4444',
        info: '#6366f1',
        warning: '#f59e0b'
    };

    const icons = {
        success: 'fa-check',
        error: 'fa-times',
        info: 'fa-info',
        warning: 'fa-exclamation'
    };

    const feedback = document.createElement('div');
    feedback.className = 'action-feedback-popup';
    feedback.innerHTML = `
        <div class="feedback-icon" style="background: ${colors[type]}">
            <i class="fas ${icons[type]}"></i>
        </div>
        ${message ? `<span class="feedback-message">${message}</span>` : ''}
    `;

    document.body.appendChild(feedback);

    // Animate in
    requestAnimationFrame(() => {
        feedback.classList.add('visible');
    });

    // Remove after animation
    setTimeout(() => {
        feedback.classList.add('fade-out');
        setTimeout(() => feedback.remove(), 300);
    }, 1500);
}

// ==================== LOADING STATES ====================

/**
 * Thêm loading state cho button
 */
function setButtonLoading(button, loading = true) {
    if (loading) {
        button.dataset.originalContent = button.innerHTML;
        button.innerHTML = '<span class="btn-spinner"></span>';
        button.disabled = true;
    } else {
        button.innerHTML = button.dataset.originalContent || button.innerHTML;
        button.disabled = false;
    }
}

// ==================== SMOOTH SCROLLING ====================

/**
 * Smooth scroll cho panel content
 */
function initSmoothScroll() {
    document.querySelectorAll('.controls-panel, .panel-content').forEach(panel => {
        panel.style.scrollBehavior = 'smooth';
    });
}

// ==================== FOCUS INDICATORS ====================

/**
 * Cải thiện focus indicators
 */
function initFocusIndicators() {
    document.body.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-nav');
        }
    });

    document.body.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-nav');
    });
}

// ==================== TOOLTIP ENHANCEMENTS ====================

/**
 * Enhanced tooltips
 */
function initEnhancedTooltips() {
    document.querySelectorAll('[title]').forEach(el => {
        if (el.dataset.tooltipInit) return;
        el.dataset.tooltipInit = 'true';

        const title = el.getAttribute('title');
        if (!title) return;

        el.removeAttribute('title');
        el.dataset.tooltip = title;

        el.addEventListener('mouseenter', showEnhancedTooltip);
        el.addEventListener('mouseleave', hideEnhancedTooltip);
    });
}

function showEnhancedTooltip(e) {
    const el = e.currentTarget;
    const text = el.dataset.tooltip;
    if (!text) return;

    // Remove existing tooltip
    const existing = document.querySelector('.enhanced-tooltip');
    if (existing) existing.remove();

    const tooltip = document.createElement('div');
    tooltip.className = 'enhanced-tooltip';
    tooltip.textContent = text;
    document.body.appendChild(tooltip);

    // Position
    const rect = el.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    let top = rect.top - tooltipRect.height - 8;

    // Keep on screen
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));

    if (top < 8) {
        top = rect.bottom + 8;
    }

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';

    requestAnimationFrame(() => tooltip.classList.add('visible'));
}

function hideEnhancedTooltip() {
    const tooltip = document.querySelector('.enhanced-tooltip');
    if (tooltip) {
        tooltip.classList.remove('visible');
        setTimeout(() => tooltip.remove(), 150);
    }
}

// ==================== STAGGER ANIMATIONS ====================

/**
 * Stagger animation cho groups
 */
function animateStagger(elements, delay = 50) {
    elements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(10px)';

        setTimeout(() => {
            el.style.transition = 'all 0.3s ease';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, index * delay);
    });
}

// ==================== INJECT STYLES ====================

function injectMicroStyles() {
    if (document.getElementById('microStyles')) return;

    const style = document.createElement('style');
    style.id = 'microStyles';
    style.textContent = `
        /* Ripple Animation */
        @keyframes rippleAnim {
            to {
                transform: scale(2.5);
                opacity: 0;
            }
        }

        /* Action Feedback Popup */
        .action-feedback-popup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.8);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            padding: 20px 30px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
            z-index: 10001;
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .action-feedback-popup.visible {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }

        .action-feedback-popup.fade-out {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
        }

        .feedback-icon {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.5rem;
            animation: iconPop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes iconPop {
            0% { transform: scale(0); }
            70% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }

        .feedback-message {
            font-size: 0.9rem;
            font-weight: 600;
            color: #374151;
        }

        /* Button Spinner */
        .btn-spinner {
            width: 18px;
            height: 18px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Enhanced Tooltip */
        .enhanced-tooltip {
            position: fixed;
            padding: 8px 14px;
            background: #1f2937;
            color: white;
            font-size: 0.85rem;
            font-weight: 500;
            border-radius: 8px;
            z-index: 10002;
            opacity: 0;
            transform: translateY(5px);
            transition: all 0.15s ease;
            pointer-events: none;
            white-space: nowrap;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .enhanced-tooltip.visible {
            opacity: 1;
            transform: translateY(0);
        }

        .enhanced-tooltip::after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 50%;
            transform: translateX(-50%);
            border: 5px solid transparent;
            border-top-color: #1f2937;
        }

        /* Keyboard Navigation Styles */
        body.keyboard-nav *:focus {
            outline: 2px solid #6366f1 !important;
            outline-offset: 3px !important;
        }

        body:not(.keyboard-nav) *:focus {
            outline: none !important;
        }

        /* Skeleton Loading */
        .skeleton {
            background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 6px;
        }

        @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }

        /* Pulse animation for active elements */
        .pulse-ring {
            animation: pulseRing 2s ease-out infinite;
        }

        @keyframes pulseRing {
            0% {
                box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
            }
            70% {
                box-shadow: 0 0 0 10px rgba(99, 102, 241, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
            }
        }

        /* Bounce animation */
        .bounce {
            animation: bounce 1s ease infinite;
        }

        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
                transform: translateY(0);
            }
            40% {
                transform: translateY(-10px);
            }
            60% {
                transform: translateY(-5px);
            }
        }

        /* Shake animation for errors */
        .shake {
            animation: shake 0.5s ease;
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }

        /* Smooth transitions for tool buttons */
        .tool-btn {
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* Upload area enhanced states */
        .upload-label.drag-hover {
            animation: pulseRing 1s ease-out infinite;
        }

        /* Canvas area cursor transitions */
        #imageCanvas {
            transition: box-shadow 0.2s ease;
        }

        /* Better active states */
        .tool-btn:active:not(.active) {
            transform: translateY(1px) scale(0.98) !important;
        }

        .btn:active {
            transform: translateY(1px) !important;
        }

        /* Glow effect for selected items */
        .glow {
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
        }
    `;
    document.head.appendChild(style);
}

// ==================== INITIALIZATION ====================

function initMicroInteractions() {
    console.log('Initializing micro-interactions...');

    injectMicroStyles();
    initRippleEffect();
    initHoverEffects();
    initSmoothScroll();
    initFocusIndicators();

    // Delay tooltip init to ensure all elements are ready
    setTimeout(initEnhancedTooltips, 500);

    // Animate tool buttons on load
    const toolBtns = document.querySelectorAll('.tool-btn');
    if (toolBtns.length > 0) {
        animateStagger(Array.from(toolBtns), 80);
    }

    console.log('Micro-interactions initialized');
}

// ==================== OBSERVER FOR DYNAMIC CONTENT ====================

const microObserver = new MutationObserver((mutations) => {
    let shouldReinit = false;

    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
            shouldReinit = true;
        }
    });

    if (shouldReinit) {
        initRippleEffect();
        initEnhancedTooltips();
    }
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initMicroInteractions, 100);

    // Observe for dynamic content
    microObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
});

// Fallback
window.addEventListener('load', () => {
    if (!document.getElementById('microStyles')) {
        initMicroInteractions();
    }
});

// Export for external use
window.showActionFeedback = showActionFeedback;
window.setButtonLoading = setButtonLoading;
window.animateStagger = animateStagger;
