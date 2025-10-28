/* =====================================================
   ADVANCED FEATURES MODULE - Next Level Functionality
   ===================================================== */

export class AdvancedFeatures {
    constructor(app) {
        this.app = app;
        this.history = {
            undo: [],
            redo: [],
            maxSize: 20
        };
        this.filters = this.getDefaultFilters();
        this.init();
    }

    init() {
        this.setupUndoRedo();
        this.setupClipboardSupport();
        this.setupModals();
        this.setupFilters();
        this.setupExportOptions();
        this.setupToastSystem();
        this.setupLoadingOverlay();
        this.setupKeyboardShortcuts();
    }

    // ==================== UNDO/REDO ====================
    setupUndoRedo() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');

        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undo());
        }

        if (redoBtn) {
            redoBtn.addEventListener('click', () => this.redo());
        }
    }

    saveState() {
        const state = {
            images: [...this.app.state.images],
            imageFiles: [...this.app.state.imageFiles],
            filters: { ...this.filters },
            timestamp: Date.now()
        };

        this.history.undo.push(state);
        if (this.history.undo.length > this.history.maxSize) {
            this.history.undo.shift();
        }

        // Clear redo history when new action is performed
        this.history.redo = [];

        this.updateUndoRedoButtons();
    }

    undo() {
        if (this.history.undo.length === 0) return;

        const currentState = {
            images: [...this.app.state.images],
            imageFiles: [...this.app.state.imageFiles],
            filters: { ...this.filters },
            timestamp: Date.now()
        };

        this.history.redo.push(currentState);
        const previousState = this.history.undo.pop();

        this.restoreState(previousState);
        this.updateUndoRedoButtons();
        this.showToast('Action undone', 'info');
    }

    redo() {
        if (this.history.redo.length === 0) return;

        const currentState = {
            images: [...this.app.state.images],
            imageFiles: [...this.app.state.imageFiles],
            filters: { ...this.filters },
            timestamp: Date.now()
        };

        this.history.undo.push(currentState);
        const nextState = this.history.redo.pop();

        this.restoreState(nextState);
        this.updateUndoRedoButtons();
        this.showToast('Action redone', 'info');
    }

    restoreState(state) {
        this.app.state.images = [...state.images];
        this.app.state.imageFiles = [...state.imageFiles];
        this.filters = { ...state.filters };
        this.applyFiltersToUI();
        if (window.renderImages) {
            window.renderImages();
        }
    }

    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');

        if (undoBtn) {
            undoBtn.disabled = this.history.undo.length === 0;
        }

        if (redoBtn) {
            redoBtn.disabled = this.history.redo.length === 0;
        }
    }

    // ==================== CLIPBOARD SUPPORT ====================
    setupClipboardSupport() {
        const pasteBtn = document.getElementById('pasteFromClipboard');
        const clearBtn = document.getElementById('clearAllImages');

        // Paste button
        if (pasteBtn) {
            pasteBtn.addEventListener('click', () => this.pasteFromClipboard());
        }

        // Clear all button
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllImages());
        }

        // Global paste event
        document.addEventListener('paste', (e) => {
            // Don't intercept paste in text inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            this.handlePasteEvent(e);
        });
    }

    async pasteFromClipboard() {
        try {
            const clipboardItems = await navigator.clipboard.read();
            let foundImage = false;

            for (const item of clipboardItems) {
                for (const type of item.types) {
                    if (type.startsWith('image/')) {
                        const blob = await item.getType(type);
                        this.addImageFromBlob(blob);
                        foundImage = true;
                    }
                }
            }

            if (foundImage) {
                this.showToast('Image pasted from clipboard', 'success');
            } else {
                this.showToast('No image found in clipboard', 'warning');
            }
        } catch (err) {
            console.error('Failed to read clipboard:', err);
            this.showToast('Failed to access clipboard. Please use Ctrl+V instead.', 'error');
        }
    }

    handlePasteEvent(e) {
        const items = e.clipboardData?.items;
        if (!items) return;

        let foundImage = false;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    this.addImageFromBlob(blob);
                    foundImage = true;
                }
            }
        }

        if (foundImage) {
            e.preventDefault();
            this.showToast('Image pasted successfully', 'success');
        }
    }

    addImageFromBlob(blob) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.app.state.images.push(img);
                this.app.state.imageFiles.push(new File([blob], `pasted-${Date.now()}.png`, { type: blob.type }));
                this.updateClearButton();
                if (window.renderImages) {
                    window.renderImages();
                }
                this.saveState();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(blob);
    }

    clearAllImages() {
        if (this.app.state.images.length === 0) return;

        if (confirm('Are you sure you want to clear all images?')) {
            this.saveState(); // Save before clearing for undo
            this.app.state.images = [];
            this.app.state.imageFiles = [];
            const canvasContainer = document.getElementById('canvasContainer');
            if (canvasContainer) {
                canvasContainer.innerHTML = `
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" class="empty-icon">
                            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2" fill="none" />
                            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                            <path stroke="currentColor" stroke-width="2" fill="none" d="M21 15l-5-5L5 21" />
                        </svg>
                        <p>Your edited images will appear here</p>
                    </div>
                `;
            }
            this.updateClearButton();
            this.showToast('All images cleared', 'info');
        }
    }

    updateClearButton() {
        const clearBtn = document.getElementById('clearAllImages');
        const downloadZipBtn = document.getElementById('downloadAllZip');

        if (clearBtn) {
            clearBtn.style.display = this.app.state.images.length > 0 ? 'inline-flex' : 'none';
        }

        if (downloadZipBtn) {
            downloadZipBtn.disabled = this.app.state.images.length === 0;
        }
    }

    // ==================== MODALS ====================
    setupModals() {
        const keyboardBtn = document.getElementById('keyboardShortcutsBtn');
        const helpBtn = document.getElementById('helpBtn');

        if (keyboardBtn) {
            keyboardBtn.addEventListener('click', () => this.showModal('keyboardShortcutsModal'));
        }

        if (helpBtn) {
            helpBtn.addEventListener('click', () => this.showModal('helpModal'));
        }

        // Close modals on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    // ==================== IMAGE FILTERS ====================
    getDefaultFilters() {
        return {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            blur: 0,
            hue: 0,
            grayscale: 0,
            sepia: 0,
            invert: 0
        };
    }

    setupFilters() {
        const filterInputs = [
            'filterBrightness',
            'filterContrast',
            'filterSaturation',
            'filterBlur',
            'filterHue',
            'filterGrayscale',
            'filterSepia',
            'filterInvert'
        ];

        filterInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', (e) => {
                    const filterName = id.replace('filter', '').toLowerCase();
                    this.filters[filterName] = parseFloat(e.target.value);

                    const valueDisplay = document.getElementById(`${id}Value`);
                    if (valueDisplay) {
                        const suffix = id.includes('Blur') ? 'px' : (id.includes('Hue') ? '°' : '%');
                        valueDisplay.textContent = `${e.target.value}${suffix}`;
                    }

                    this.applyFilters();
                });
            }
        });

        // Reset filters button
        const resetBtn = document.getElementById('resetFilters');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetFilters());
        }

        // Filter presets
        this.setupFilterPresets();
    }

    setupFilterPresets() {
        const presets = {
            filterPresetVintage: {
                brightness: 110,
                contrast: 90,
                saturation: 80,
                sepia: 30,
                blur: 0,
                hue: 0,
                grayscale: 0,
                invert: 0
            },
            filterPresetBW: {
                brightness: 100,
                contrast: 110,
                saturation: 0,
                grayscale: 100,
                blur: 0,
                hue: 0,
                sepia: 0,
                invert: 0
            },
            filterPresetWarm: {
                brightness: 105,
                contrast: 100,
                saturation: 120,
                hue: 10,
                blur: 0,
                grayscale: 0,
                sepia: 0,
                invert: 0
            },
            filterPresetCool: {
                brightness: 100,
                contrast: 105,
                saturation: 110,
                hue: 200,
                blur: 0,
                grayscale: 0,
                sepia: 0,
                invert: 0
            }
        };

        Object.entries(presets).forEach(([btnId, filters]) => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => this.applyFilterPreset(filters));
            }
        });
    }

    applyFilterPreset(preset) {
        this.filters = { ...preset };
        this.applyFiltersToUI();
        this.applyFilters();
        this.showToast('Filter preset applied', 'success');
    }

    applyFiltersToUI() {
        Object.entries(this.filters).forEach(([name, value]) => {
            const inputId = `filter${name.charAt(0).toUpperCase() + name.slice(1)}`;
            const input = document.getElementById(inputId);
            const valueDisplay = document.getElementById(`${inputId}Value`);

            if (input) {
                input.value = value;
                if (valueDisplay) {
                    const suffix = name === 'blur' ? 'px' : (name === 'hue' ? '°' : '%');
                    valueDisplay.textContent = `${value}${suffix}`;
                }
            }
        });
    }

    applyFilters() {
        if (window.renderImages) {
            window.renderImages();
        }
    }

    resetFilters() {
        this.filters = this.getDefaultFilters();
        this.applyFiltersToUI();
        this.applyFilters();
        this.showToast('Filters reset', 'info');
    }

    getFilterString() {
        return `
            brightness(${this.filters.brightness}%)
            contrast(${this.filters.contrast}%)
            saturate(${this.filters.saturation}%)
            blur(${this.filters.blur}px)
            hue-rotate(${this.filters.hue}deg)
            grayscale(${this.filters.grayscale}%)
            sepia(${this.filters.sepia}%)
            invert(${this.filters.invert}%)
        `.trim();
    }

    // ==================== EXPORT OPTIONS ====================
    setupExportOptions() {
        const formatSelect = document.getElementById('exportFormat');
        const qualityInput = document.getElementById('exportQuality');
        const downloadZipBtn = document.getElementById('downloadAllZip');

        if (formatSelect) {
            formatSelect.addEventListener('change', (e) => {
                const qualityControl = document.getElementById('qualityControl');
                if (qualityControl) {
                    qualityControl.style.display = e.target.value === 'png' ? 'none' : 'block';
                }
            });
        }

        if (qualityInput) {
            qualityInput.addEventListener('input', (e) => {
                const valueDisplay = document.getElementById('exportQualityValue');
                if (valueDisplay) {
                    valueDisplay.textContent = `${e.target.value}%`;
                }
            });
        }

        if (downloadZipBtn) {
            downloadZipBtn.addEventListener('click', () => this.downloadAllAsZip());
        }
    }

    async downloadAllAsZip() {
        if (!window.JSZip || this.app.state.images.length === 0) return;

        this.showLoading('Creating ZIP file...', 0);

        try {
            const zip = new JSZip();
            const canvases = document.querySelectorAll('#canvasContainer canvas');
            const format = document.getElementById('exportFormat')?.value || 'png';
            const quality = (document.getElementById('exportQuality')?.value || 92) / 100;

            for (let i = 0; i < canvases.length; i++) {
                const canvas = canvases[i];
                const progress = ((i + 1) / canvases.length) * 100;
                this.updateLoading(`Processing image ${i + 1}/${canvases.length}...`, progress);

                const blob = await this.canvasToBlob(canvas, format, quality);
                const ext = format === 'jpeg' ? 'jpg' : format;
                zip.file(`image-${i + 1}.${ext}`, blob);
            }

            this.updateLoading('Generating ZIP file...', 90);
            const content = await zip.generateAsync({ type: 'blob' });

            this.updateLoading('Downloading...', 100);
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `images-${Date.now()}.zip`;
            a.click();
            URL.revokeObjectURL(url);

            this.hideLoading();
            this.showToast(`Downloaded ${canvases.length} images as ZIP`, 'success');
        } catch (error) {
            console.error('Failed to create ZIP:', error);
            this.hideLoading();
            this.showToast('Failed to create ZIP file', 'error');
        }
    }

    canvasToBlob(canvas, format, quality) {
        return new Promise((resolve) => {
            const mimeType = format === 'jpeg' ? 'image/jpeg' : `image/${format}`;
            canvas.toBlob(resolve, mimeType, quality);
        });
    }

    // ==================== TOAST SYSTEM ====================
    setupToastSystem() {
        // Toast container is already in HTML
    }

    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
            error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
            info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-content">
                <p class="toast-message">${message}</p>
            </div>
            <button class="toast-close">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path stroke="currentColor" stroke-width="2" fill="none" d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
        `;

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.removeToast(toast));

        container.appendChild(toast);

        if (duration > 0) {
            setTimeout(() => this.removeToast(toast), duration);
        }
    }

    removeToast(toast) {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }

    // ==================== LOADING OVERLAY ====================
    setupLoadingOverlay() {
        // Loading overlay is already in HTML
    }

    showLoading(text = 'Processing...', progress = 0) {
        const overlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');
        const progressFill = document.getElementById('progressBarFill');
        const progressText = document.getElementById('progressText');

        if (overlay) {
            overlay.style.display = 'flex';
        }

        if (loadingText) {
            loadingText.textContent = text;
        }

        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }

        if (progressText) {
            progressText.textContent = `${Math.round(progress)}%`;
        }
    }

    updateLoading(text, progress) {
        const loadingText = document.getElementById('loadingText');
        const progressFill = document.getElementById('progressBarFill');
        const progressText = document.getElementById('progressText');

        if (loadingText) {
            loadingText.textContent = text;
        }

        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }

        if (progressText) {
            progressText.textContent = `${Math.round(progress)}%`;
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    // ==================== KEYBOARD SHORTCUTS ====================
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // ? key - Show keyboard shortcuts
            if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
                const activeElement = document.activeElement;
                if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    this.showModal('keyboardShortcutsModal');
                }
            }

            // Ctrl+Z - Undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }

            // Ctrl+Y or Ctrl+Shift+Z - Redo
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                this.redo();
            }
        });
    }
}
