// mobile-ui.js - Add to bottom of script.js

// Mobile UI enhancements
document.addEventListener('DOMContentLoaded', function () {
    // Mobile toolbar toggle
    const toggleToolsBtn = document.querySelector('.toggle-tools-btn');
    const toolbarPanel = document.querySelector('.toolbar-panel');

    if (toggleToolsBtn && toolbarPanel) {
        toggleToolsBtn.addEventListener('click', function () {
            toolbarPanel.classList.toggle('active');

            if (toolbarPanel.classList.contains('active')) {
                // If opening tools panel, scroll to active tool options
                const activeOptions = document.querySelector('.tool-options:not(.hidden)');
                if (activeOptions) {
                    setTimeout(() => {
                        activeOptions.scrollIntoView({ behavior: 'smooth' });
                    }, 300);
                }
            }
        });

        // Close toolbar when clicking on canvas area (on mobile)
        document.querySelector('.canvas-panel').addEventListener('click', function () {
            if (window.innerWidth <= 768 && toolbarPanel.classList.contains('active')) {
                toolbarPanel.classList.remove('active');
            }
        });
    }

    // Enhanced number input controls
    const numberInputs = document.querySelectorAll('.number-input');
    numberInputs.forEach(input => {
        const upBtn = input.parentElement.querySelector('.number-up');
        const downBtn = input.parentElement.querySelector('.number-down');

        if (upBtn && downBtn) {
            upBtn.addEventListener('click', function () {
                let value = parseInt(input.value) || 0;
                const max = parseInt(input.getAttribute('max')) || 100;
                value = Math.min(value + 1, max);
                input.value = value;
                // Trigger change event
                input.dispatchEvent(new Event('change'));
            });

            downBtn.addEventListener('click', function () {
                let value = parseInt(input.value) || 0;
                const min = parseInt(input.getAttribute('min')) || 0;
                value = Math.max(value - 1, min);
                input.value = value;
                // Trigger change event
                input.dispatchEvent(new Event('change'));
            });
        }
    });

    // Enhance color picker display
    const colorInputs = document.querySelectorAll('.color-input');
    colorInputs.forEach(input => {
        const display = input.parentElement.querySelector('.color-display');

        if (display) {
            // Set initial color
            display.style.backgroundColor = input.value;

            // Update color display when input changes
            input.addEventListener('input', function () {
                display.style.backgroundColor = input.value;
            });
        }
    });

    // Enhance toast notifications to work with new structure
    const originalShowToast = window.showToast;
    if (typeof originalShowToast === 'function') {
        window.showToast = function (message) {
            const toastNotification = document.getElementById('toastNotification');
            const toastMessage = toastNotification.querySelector('.toast-message');

            if (toastNotification && toastMessage) {
                toastMessage.textContent = message;
                toastNotification.classList.add('show');

                setTimeout(() => {
                    toastNotification.classList.remove('show');
                }, 3000);
            } else {
                // Fall back to original if new structure not found
                originalShowToast(message);
            }
        };
    }

    // Active state management for tool buttons
    const toolButtons = document.querySelectorAll('.tool-btn');
    if (toolButtons.length > 0) {
        const setActiveToolButton = function (activeButton) {
            toolButtons.forEach(btn => {
                btn.classList.remove('active');
            });

            if (activeButton) {
                activeButton.classList.add('active');
            }
        };

        // Override original setActiveButton function if it exists
        if (typeof window.setActiveButton === 'function') {
            const originalSetActiveButton = window.setActiveButton;
            window.setActiveButton = function (activeButton) {
                // Call original first (which manages original buttons)
                originalSetActiveButton(activeButton);

                // Handle new UI buttons
                if (activeButton === eraseModeButton) {
                    setActiveToolButton(document.getElementById('eraseModeButton'));
                } else if (activeButton === textModeButton) {
                    setActiveToolButton(document.getElementById('textModeButton'));
                } else if (activeButton === selectModeButton) {
                    setActiveToolButton(document.getElementById('selectModeButton'));
                } else {
                    setActiveToolButton(null);
                }
            };
        }

        // Add click handlers to new buttons
        toolButtons.forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.id;

                if (id === 'eraseModeButton' && typeof eraseModeButton !== 'undefined') {
                    eraseModeButton.click();
                } else if (id === 'textModeButton' && typeof textModeButton !== 'undefined') {
                    textModeButton.click();
                } else if (id === 'selectModeButton' && typeof selectModeButton !== 'undefined') {
                    selectModeButton.click();
                }
            });
        });
    }

    // Helper function to update status message with new UI classes
    function updateStatusMessageClasses(element, type) {
        element.className = 'status-message';

        if (type === 'success') {
            element.classList.add('status-success');
        } else if (type === 'error') {
            element.classList.add('status-error');
        } else {
            element.classList.add('status-info');
        }

        element.classList.remove('hidden');
    }

    // Override the original showStatusMessage if it exists
    if (typeof window.showStatusMessage === 'function') {
        const originalShowStatusMessage = window.showStatusMessage;
        window.showStatusMessage = function (message, type = 'info') {
            const statusMessage = document.getElementById('statusMessage');

            if (statusMessage) {
                statusMessage.textContent = message;
                updateStatusMessageClasses(statusMessage, type);
            } else {
                // Fall back to original if element not found
                originalShowStatusMessage(message, type);
            }
        };
    }
});