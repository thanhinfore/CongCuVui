/**
 * Contact Map v7.5 - Helper Utilities
 */

/**
 * Generate unique ID
 */
export function generateId() {
    return 'n_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Get initials from a name (Vietnamese-aware)
 */
export function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }
    // Vietnamese names: last word is the given name
    const lastName = parts[parts.length - 1];
    const firstName = parts[0];
    return (firstName[0] + lastName[0]).toUpperCase();
}

/**
 * Highlight matched text in search results
 */
export function highlightMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background:var(--warning);padding:0 2px;border-radius:2px;">$1</mark>');
}

/**
 * Calculate distance between two nodes
 */
export function calculateDistance(graph, nodeA, nodeB, visited = new Set()) {
    if (nodeA === nodeB) return 0;
    if (visited.has(nodeA)) return Infinity;

    visited.add(nodeA);

    const neighbors = graph.neighbors(nodeA);
    let minDist = Infinity;

    for (const neighbor of neighbors) {
        const dist = calculateDistance(graph, neighbor, nodeB, visited);
        if (dist < minDist) {
            minDist = dist;
        }
    }

    return minDist === Infinity ? Infinity : minDist + 1;
}

/**
 * Debounce function calls
 */
export function debounce(func, wait) {
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

/**
 * Throttle function calls
 */
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Deep clone an object
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Format date for display
 */
export function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN');
    } catch {
        return dateStr;
    }
}

/**
 * Check if string is valid URL
 */
export function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch {
        return false;
    }
}

/**
 * Mask phone number for privacy
 */
export function maskPhone(phone) {
    if (!phone || phone.length < 7) return phone;
    return phone.slice(0, 3) + '****' + phone.slice(-3);
}

/**
 * Mask email for privacy
 */
export function maskEmail(email) {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    const maskedLocal = local.slice(0, 3) + '***';
    return maskedLocal + '@' + domain;
}
