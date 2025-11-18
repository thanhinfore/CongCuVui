/* =====================================================
   UTILS.JS - Utility Functions Module
   V14: Added development logger
   ===================================================== */

// V14: Development mode detection
const isDevelopment = window.location.hostname === 'localhost' ||
                      window.location.hostname === '127.0.0.1' ||
                      window.location.search.includes('debug=true');

// V14: Smart logger - only logs in development mode
export const logger = {
    log: (...args) => {
        if (isDevelopment) {
            console.log(...args);
        }
    },
    warn: (...args) => {
        if (isDevelopment) {
            console.warn(...args);
        }
    },
    error: (...args) => {
        // Always log errors
        console.error(...args);
    },
    info: (...args) => {
        if (isDevelopment) {
            console.info(...args);
        }
    },
    debug: (...args) => {
        if (isDevelopment) {
            console.debug('[DEBUG]', ...args);
        }
    }
};

export const utils = {
    // Debounce function for performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Convert hex to RGBA
    hexToRGBA(hex, opacity) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
    },

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Validate image file
    isValidImageFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        return file && validTypes.includes(file.type);
    },

    // Canvas utilities
    canvas: {
        // Create offscreen canvas
        createOffscreenCanvas(width, height) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            return canvas;
        },

        // Clear canvas
        clear(ctx, width, height) {
            ctx.clearRect(0, 0, width, height);
        },

        // Draw rounded rectangle
        drawRoundedRect(ctx, x, y, width, height, radius, fillColor) {
            ctx.fillStyle = fillColor;
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.arcTo(x + width, y, x + width, y + height, radius);
            ctx.arcTo(x + width, y + height, x, y + height, radius);
            ctx.arcTo(x, y + height, x, y, radius);
            ctx.arcTo(x, y, x + width, y, radius);
            ctx.closePath();
            ctx.fill();
        }
    },

    // Text utilities
    text: {
        // Wrap text to fit width
        wrapText(ctx, text, maxWidth) {
            const words = text.split(' ');
            const lines = [];
            let currentLine = '';

            words.forEach(word => {
                const testLine = currentLine + word + ' ';
                const metrics = ctx.measureText(testLine);

                if (metrics.width > maxWidth && currentLine !== '') {
                    lines.push(currentLine.trim());
                    currentLine = word + ' ';
                } else {
                    currentLine = testLine;
                }
            });

            if (currentLine.trim() !== '') {
                lines.push(currentLine.trim());
            }

            return lines;
        },

        // Calculate text metrics
        calculateMetrics(ctx, lines, fontSize) {
            let maxWidth = 0;
            const lineHeight = fontSize * 1.5;

            lines.forEach(line => {
                const width = ctx.measureText(line).width;
                maxWidth = Math.max(maxWidth, width);
            });

            return {
                width: maxWidth,
                height: lines.length * lineHeight,
                lineHeight
            };
        }
    },

    // DOM utilities
    dom: {
        // Create element with attributes
        createElement(tag, attributes = {}, children = []) {
            const element = document.createElement(tag);

            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'className') {
                    element.className = value;
                } else if (key === 'textContent') {
                    element.textContent = value;
                } else if (key === 'innerHTML') {
                    element.innerHTML = value;
                } else if (key === 'value') {
                    element.value = value;
                } else if (key === 'style' && typeof value === 'object') {
                    Object.assign(element.style, value);
                } else if (key.startsWith('on')) {
                    element.addEventListener(key.slice(2).toLowerCase(), value);
                } else {
                    element.setAttribute(key, value);
                }
            });

            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child) {
                    element.appendChild(child);
                }
            });

            return element;
        },

        // Show element with animation
        show(element, duration = 200) {
            element.style.display = 'block';
            element.style.opacity = '0';

            requestAnimationFrame(() => {
                element.style.transition = `opacity ${duration}ms ease`;
                element.style.opacity = '1';
            });
        },

        // Hide element with animation
        hide(element, duration = 200) {
            element.style.transition = `opacity ${duration}ms ease`;
            element.style.opacity = '0';

            setTimeout(() => {
                element.style.display = 'none';
            }, duration);
        }
    },

    // Storage utilities
    storage: {
        // Save to localStorage with error handling
        save(key, data) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (error) {
                console.error('Storage save error:', error);
                return false;
            }
        },

        // Load from localStorage
        load(key) {
            try {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : null;
            } catch (error) {
                console.error('Storage load error:', error);
                return null;
            }
        },

        // Remove from localStorage
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Storage remove error:', error);
                return false;
            }
        }
    },

    // Event utilities
    events: {
        // Prevent default behavior
        preventDefault(e) {
            e.preventDefault();
            e.stopPropagation();
        },

        // Add multiple event listeners
        addListeners(element, events, handler) {
            events.forEach(event => {
                element.addEventListener(event, handler);
            });
        },

        // Remove multiple event listeners
        removeListeners(element, events, handler) {
            events.forEach(event => {
                element.removeEventListener(event, handler);
            });
        }
    },

    // Animation utilities
    animation: {
        // Fade in
        fadeIn(element, duration = 300) {
            element.style.opacity = '0';
            element.style.display = 'block';

            const start = performance.now();

            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);

                element.style.opacity = progress;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            requestAnimationFrame(animate);
        },

        // Fade out
        fadeOut(element, duration = 300) {
            const start = performance.now();
            const initialOpacity = parseFloat(element.style.opacity) || 1;

            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);

                element.style.opacity = initialOpacity * (1 - progress);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.display = 'none';
                }
            };

            requestAnimationFrame(animate);
        }
    },

    // Image utilities
    image: {
        // Load image from file
        loadFromFile(file) {
            return new Promise((resolve, reject) => {
                if (!utils.isValidImageFile(file)) {
                    reject(new Error('Invalid image file'));
                    return;
                }

                const reader = new FileReader();

                reader.onload = (e) => {
                    const img = new Image();

                    img.onload = () => {
                        resolve({ img, file });
                    };

                    img.onerror = () => {
                        reject(new Error(`Failed to load image: ${file.name}`));
                    };

                    img.src = e.target.result;
                };

                reader.onerror = () => {
                    reject(new Error(`Failed to read file: ${file.name}`));
                };

                reader.readAsDataURL(file);
            });
        },

        // Resize image to max width
        resize(img, maxWidth) {
            if (img.width <= maxWidth) {
                return { width: img.width, height: img.height };
            }

            const scale = maxWidth / img.width;
            return {
                width: maxWidth,
                height: Math.round(img.height * scale)
            };
        }
    }
};