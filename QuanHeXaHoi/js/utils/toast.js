/**
 * Contact Map v7.5 - Toast Notifications
 */

const toastIcons = {
    success: 'fa-check-circle',
    error: 'fa-times-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
};

const toastColors = {
    success: '#43A047',
    error: '#E53935',
    warning: '#FB8C00',
    info: '#1E88E5'
};

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - Type of toast: success, error, warning, info
 * @param {number} duration - Duration in milliseconds
 */
export function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${toastIcons[type]}" style="color:${toastColors[type]}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.add('toast-visible');
    });

    // Auto remove
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Show success toast
 */
export function showSuccess(message, duration = 3000) {
    showToast(message, 'success', duration);
}

/**
 * Show error toast
 */
export function showError(message, duration = 4000) {
    showToast(message, 'error', duration);
}

/**
 * Show warning toast
 */
export function showWarning(message, duration = 3500) {
    showToast(message, 'warning', duration);
}

/**
 * Show info toast
 */
export function showInfo(message, duration = 3000) {
    showToast(message, 'info', duration);
}
