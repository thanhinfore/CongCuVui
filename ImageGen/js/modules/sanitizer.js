/* =====================================================
   SANITIZER.JS - V14 Security Module
   XSS Prevention & Input Sanitization
   ===================================================== */

/**
 * V14 Security Module - Sanitizes user input to prevent XSS attacks
 */
export class Sanitizer {
    constructor() {
        // Allowed URL protocols
        this.allowedProtocols = ['http:', 'https:', 'mailto:'];

        // HTML entity map
        this.htmlEntities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;'
        };
    }

    /**
     * Escape HTML special characters
     * Prevents XSS by converting HTML entities
     */
    escapeHtml(text) {
        if (typeof text !== 'string') {
            return '';
        }

        return text.replace(/[&<>"'\/]/g, (char) => {
            return this.htmlEntities[char] || char;
        });
    }

    /**
     * Sanitize and validate URL
     * Prevents javascript:, data:, and other malicious URLs
     */
    sanitizeUrl(url) {
        if (typeof url !== 'string') {
            return '#';
        }

        // Remove whitespace
        url = url.trim();

        // Empty URL
        if (!url || url === '#') {
            return '#';
        }

        // Check for malicious protocols
        const lowerUrl = url.toLowerCase();

        // Blocked protocols
        const blockedProtocols = [
            'javascript:',
            'data:',
            'vbscript:',
            'file:',
            'about:'
        ];

        for (const protocol of blockedProtocols) {
            if (lowerUrl.startsWith(protocol)) {
                console.warn('[V14 Security] Blocked malicious URL:', url);
                return '#';
            }
        }

        // If no protocol specified, assume https
        if (!url.match(/^[a-z]+:/i)) {
            url = 'https://' + url;
        }

        // Validate allowed protocols
        try {
            const urlObj = new URL(url);
            if (!this.allowedProtocols.includes(urlObj.protocol)) {
                console.warn('[V14 Security] Disallowed protocol:', urlObj.protocol);
                return '#';
            }
            return urlObj.href;
        } catch (e) {
            console.warn('[V14 Security] Invalid URL:', url);
            return '#';
        }
    }

    /**
     * Sanitize HTML content
     * Strips dangerous tags and attributes
     */
    sanitizeHtml(html) {
        if (typeof html !== 'string') {
            return '';
        }

        // Create a temporary div to parse HTML
        const temp = document.createElement('div');
        temp.textContent = html; // This escapes everything

        return temp.innerHTML;
    }

    /**
     * Sanitize filename
     * Prevents directory traversal attacks
     */
    sanitizeFilename(filename) {
        if (typeof filename !== 'string') {
            return 'unnamed';
        }

        // Remove path separators
        filename = filename.replace(/[\/\\]/g, '_');

        // Remove null bytes
        filename = filename.replace(/\0/g, '');

        // Remove dangerous characters
        filename = filename.replace(/[<>:"|?*]/g, '');

        // Limit length
        if (filename.length > 255) {
            filename = filename.substring(0, 255);
        }

        return filename || 'unnamed';
    }

    /**
     * Sanitize attribute value
     * Prevents attribute injection
     */
    sanitizeAttribute(value) {
        if (typeof value !== 'string') {
            return '';
        }

        // Escape quotes and dangerous characters
        return value
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    /**
     * Validate and sanitize number input
     * Prevents NaN and invalid numbers
     */
    sanitizeNumber(value, min = -Infinity, max = Infinity, defaultValue = 0) {
        const num = typeof value === 'number' ? value : parseFloat(value);

        if (isNaN(num)) {
            return defaultValue;
        }

        // Clamp to min/max
        return Math.max(min, Math.min(max, num));
    }

    /**
     * Validate and sanitize integer input
     */
    sanitizeInteger(value, min = -Infinity, max = Infinity, defaultValue = 0) {
        const num = typeof value === 'number' ? value : parseInt(value, 10);

        if (isNaN(num) || !Number.isInteger(num)) {
            return defaultValue;
        }

        // Clamp to min/max
        return Math.max(min, Math.min(max, num));
    }

    /**
     * Validate image file
     * Checks MIME type and file extension
     */
    validateImageFile(file) {
        if (!file || !(file instanceof File)) {
            return false;
        }

        // Check MIME type
        const validMimeTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml'
        ];

        if (!validMimeTypes.includes(file.type)) {
            console.warn('[V14 Security] Invalid image MIME type:', file.type);
            return false;
        }

        // Check file extension
        const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
        const fileName = file.name.toLowerCase();
        const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

        if (!hasValidExtension) {
            console.warn('[V14 Security] Invalid image extension:', file.name);
            return false;
        }

        // Check file size (max 50MB)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            console.warn('[V14 Security] File too large:', file.size);
            return false;
        }

        return true;
    }

    /**
     * Sanitize CSS value
     * Prevents CSS injection
     */
    sanitizeCssValue(value) {
        if (typeof value !== 'string') {
            return '';
        }

        // Remove potentially dangerous CSS
        const dangerous = [
            'javascript:',
            'expression',
            'import',
            '@import',
            'behavior:',
            '-moz-binding',
            'vbscript:'
        ];

        let safe = value;
        dangerous.forEach(pattern => {
            const regex = new RegExp(pattern, 'gi');
            safe = safe.replace(regex, '');
        });

        return safe;
    }

    /**
     * Create safe HTML element with sanitized content
     */
    createSafeElement(tagName, attributes = {}, textContent = '') {
        const element = document.createElement(tagName);

        // Set sanitized attributes
        Object.keys(attributes).forEach(key => {
            if (key === 'href') {
                element.setAttribute(key, this.sanitizeUrl(attributes[key]));
            } else if (key === 'style') {
                element.setAttribute(key, this.sanitizeCssValue(attributes[key]));
            } else {
                element.setAttribute(key, this.sanitizeAttribute(attributes[key]));
            }
        });

        // Set text content (auto-escaped)
        if (textContent) {
            element.textContent = textContent;
        }

        return element;
    }

    /**
     * Sanitize localStorage key
     */
    sanitizeStorageKey(key) {
        if (typeof key !== 'string') {
            return 'unknown';
        }

        // Only allow alphanumeric, dash, underscore
        return key.replace(/[^a-zA-Z0-9_-]/g, '_');
    }

    /**
     * Rate limiting check
     * Prevents abuse by limiting operations per time window
     */
    checkRateLimit(key, maxOperations = 100, windowMs = 60000) {
        const now = Date.now();
        const storageKey = `ratelimit_${this.sanitizeStorageKey(key)}`;

        try {
            const data = JSON.parse(sessionStorage.getItem(storageKey) || '{"count":0,"timestamp":0}');

            // Reset if window expired
            if (now - data.timestamp > windowMs) {
                data.count = 0;
                data.timestamp = now;
            }

            data.count++;
            sessionStorage.setItem(storageKey, JSON.stringify(data));

            if (data.count > maxOperations) {
                console.warn('[V14 Security] Rate limit exceeded for:', key);
                return false;
            }

            return true;
        } catch (e) {
            console.error('[V14 Security] Rate limit check failed:', e);
            return true; // Fail open
        }
    }
}

// Export singleton instance
export const sanitizer = new Sanitizer();

// Export helper functions for common use cases
export function escapeHtml(text) {
    return sanitizer.escapeHtml(text);
}

export function sanitizeUrl(url) {
    return sanitizer.sanitizeUrl(url);
}

export function validateImageFile(file) {
    return sanitizer.validateImageFile(file);
}

export function sanitizeNumber(value, min, max, defaultValue) {
    return sanitizer.sanitizeNumber(value, min, max, defaultValue);
}

export function sanitizeInteger(value, min, max, defaultValue) {
    return sanitizer.sanitizeInteger(value, min, max, defaultValue);
}
