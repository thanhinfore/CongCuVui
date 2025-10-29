/* =====================================================
   IMAGEBROWSER.JS - Browse and Load Images from Folder
   ===================================================== */

import { utils } from './utils.js';

export class ImageBrowser {
    constructor(state) {
        this.state = state;
        this.imagesFolder = 'images/';
        this.availableImages = [];
        this.selectedImages = [];
        this.initialized = false;
    }

    async init() {
        try {
            // Load list of available images
            await this.loadImagesList();
            this.setupUI();
            this.initialized = true;
            console.log('Image Browser initialized with', this.availableImages.length, 'images');
        } catch (error) {
            console.error('Failed to initialize Image Browser:', error);
        }
    }

    async loadImagesList() {
        try {
            // Load from JSON config file
            const response = await fetch('images/config.json');
            if (!response.ok) {
                throw new Error('Failed to load config.json');
            }
            const config = await response.json();
            this.availableImages = config.images || [];
        } catch (error) {
            console.warn('No images/config.json found, using fallback', error);
            // Fallback: try to load some common image names
            this.availableImages = this.getFallbackImagesList();
        }
    }

    getFallbackImagesList() {
        // Fallback list of common image names to try
        return [
            { name: 'sample1.jpg', path: 'images/sample1.jpg' },
            { name: 'sample2.jpg', path: 'images/sample2.jpg' },
            { name: 'sample3.jpg', path: 'images/sample3.jpg' },
            { name: 'background1.jpg', path: 'images/background1.jpg' },
            { name: 'background2.jpg', path: 'images/background2.jpg' },
            { name: 'background3.jpg', path: 'images/background3.jpg' }
        ];
    }

    setupUI() {
        const container = document.getElementById('folderImagesContainer');
        if (!container) return;

        // Clear container
        container.innerHTML = '';

        if (this.availableImages.length === 0) {
            container.innerHTML = `
                <div class="no-images-message">
                    <svg viewBox="0 0 24 24" width="48" height="48">
                        <path stroke="currentColor" stroke-width="2" fill="none" d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2z"/>
                        <path stroke="currentColor" stroke-width="2" fill="none" d="M3 16l5-5 6 6 5-5"/>
                    </svg>
                    <p>No images configured</p>
                    <small>Add images to <code>ImageGen/images/</code> and update <code>images/config.json</code></small>
                </div>
            `;
            return;
        }

        // Create gallery grid
        const gallery = document.createElement('div');
        gallery.className = 'folder-images-gallery';

        this.availableImages.forEach((image, index) => {
            const item = this.createGalleryItem(image, index);
            gallery.appendChild(item);
        });

        container.appendChild(gallery);
    }

    createGalleryItem(image, index) {
        const item = utils.dom.createElement('div', {
            className: 'gallery-item',
            'data-index': index
        });

        // Create image element
        const img = document.createElement('img');
        img.src = image.path;
        img.alt = image.name;
        img.loading = 'lazy';

        // Handle image load error
        img.onerror = () => {
            img.style.display = 'none';
            const errorMsg = item.querySelector('.error-message') || document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = 'Failed to load';
            item.appendChild(errorMsg);
            item.classList.add('error');
        };

        // Create overlay with info
        const overlay = utils.dom.createElement('div', {
            className: 'gallery-overlay'
        });

        const fileName = utils.dom.createElement('div', {
            className: 'file-name',
            textContent: image.name
        });

        const selectBtn = utils.dom.createElement('button', {
            className: 'gallery-select-btn',
            innerHTML: `
                <svg viewBox="0 0 24 24" width="20" height="20">
                    <path stroke="currentColor" stroke-width="2" fill="none" d="M5 13l4 4L19 7"/>
                </svg>
                Select
            `,
            onclick: (e) => {
                e.stopPropagation();
                this.selectImage(image, item);
            }
        });

        overlay.appendChild(fileName);
        overlay.appendChild(selectBtn);

        item.appendChild(img);
        item.appendChild(overlay);

        // Click to preview
        item.onclick = () => {
            this.previewImage(image);
        };

        return item;
    }

    async selectImage(image, itemElement, showToast = true) {
        try {
            // Load image as File object
            const response = await fetch(image.path);
            const blob = await response.blob();
            const file = new File([blob], image.name, { type: blob.type });

            // Add to state
            await this.addImageToState(file);

            // Visual feedback (only if itemElement is provided)
            if (itemElement) {
                itemElement.classList.add('selected');
                const btn = itemElement.querySelector('.gallery-select-btn');
                if (btn) {
                    btn.innerHTML = `
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path stroke="currentColor" stroke-width="2" fill="none" d="M5 13l4 4L19 7"/>
                        </svg>
                        Selected
                    `;
                    btn.classList.add('selected');
                }

                // Auto-deselect after animation
                setTimeout(() => {
                    itemElement.classList.remove('selected');
                    if (btn) {
                        btn.innerHTML = `
                            <svg viewBox="0 0 24 24" width="20" height="20">
                                <path stroke="currentColor" stroke-width="2" fill="none" d="M5 13l4 4L19 7"/>
                            </svg>
                            Select
                        `;
                        btn.classList.remove('selected');
                    }
                }, 1500);
            }

            // Show toast only if requested (avoid spam when selecting multiple)
            if (showToast && window.imageTextApp?.components?.advanced) {
                window.imageTextApp.components.advanced.showToast(`Added ${image.name}`, 'success', 2000);
            }

        } catch (error) {
            console.error('Error selecting image:', error);
            if (window.imageTextApp?.components?.advanced) {
                window.imageTextApp.components.advanced.showToast(`Failed to load ${image.name}`, 'error', 3000);
            }
        }
    }

    async addImageToState(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();

                img.onload = () => {
                    this.state.imageFiles.push(file);
                    this.state.images.push({ img, file });

                    // Update min width
                    this.state.minWidth = Math.min(this.state.minWidth, img.width);

                    // Update UI
                    const addTextBtn = document.getElementById('addTextButton');
                    if (addTextBtn) {
                        addTextBtn.disabled = false;
                    }

                    const clearBtn = document.getElementById('clearAllImages');
                    if (clearBtn) {
                        clearBtn.style.display = 'block';
                    }

                    resolve();
                };

                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    previewImage(image) {
        // Create modal to preview image
        const modal = utils.dom.createElement('div', {
            className: 'image-preview-modal',
            onclick: (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            }
        });

        const content = utils.dom.createElement('div', {
            className: 'preview-modal-content'
        });

        const img = document.createElement('img');
        img.src = image.path;
        img.alt = image.name;

        const info = utils.dom.createElement('div', {
            className: 'preview-info'
        });

        info.innerHTML = `
            <h3>${image.name}</h3>
            <div class="preview-actions">
                <button class="preview-select-btn" onclick="event.stopPropagation()">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path stroke="currentColor" stroke-width="2" fill="none" d="M5 13l4 4L19 7"/>
                    </svg>
                    Select This Image
                </button>
                <button class="preview-close-btn" onclick="event.stopPropagation()">Close</button>
            </div>
        `;

        const selectBtn = info.querySelector('.preview-select-btn');
        selectBtn.onclick = async () => {
            await this.selectImage(image, null);
            modal.remove();
        };

        const closeBtn = info.querySelector('.preview-close-btn');
        closeBtn.onclick = () => modal.remove();

        content.appendChild(img);
        content.appendChild(info);
        modal.appendChild(content);
        document.body.appendChild(modal);
    }

    async selectRandomImages(count = 1) {
        if (this.availableImages.length === 0) {
            if (window.imageTextApp?.components?.advanced) {
                window.imageTextApp.components.advanced.showToast('No images available in folder', 'error', 3000);
            }
            return;
        }

        // Shuffle and take random images
        const shuffled = [...this.availableImages].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(count, shuffled.length));

        for (const image of selected) {
            try {
                await this.selectImage(image, null, false); // Don't show individual toasts
            } catch (error) {
                console.error('Error selecting random image:', error);
            }
        }

        if (window.imageTextApp?.components?.advanced) {
            window.imageTextApp.components.advanced.showToast(
                `Added ${selected.length} random image${selected.length > 1 ? 's' : ''}`,
                'success',
                2000
            );
        }
    }

    async selectAllImages() {
        if (this.availableImages.length === 0) return;

        for (const image of this.availableImages) {
            try {
                await this.selectImage(image, null, false); // Don't show individual toasts
            } catch (error) {
                console.error('Error selecting image:', error);
            }
        }

        if (window.imageTextApp?.components?.advanced) {
            window.imageTextApp.components.advanced.showToast(
                `Added all ${this.availableImages.length} images`,
                'success',
                2000
            );
        }
    }
}
