/* =====================================================
   MODE-MANAGER.JS - Version 9.1 Mode Management
   Toggle between Upload Images and Solid Background modes
   Fixed: Clear images when switching modes
   ===================================================== */

export class ModeManager {
    constructor() {
        this.currentMode = 'upload'; // 'upload' or 'background'
        this.state = null; // Will be set by app.js
        this.initialize();
    }

    setState(state) {
        this.state = state;
    }

    initialize() {
        this.setupUI();
        this.setupEventListeners();
        this.applyMode('upload'); // Default mode
        console.log('✨ V9.1 Mode Manager initialized');
    }

    setupUI() {
        // Create mode selector UI at the top of control panel
        const controlPanel = document.querySelector('.control-panel');
        if (!controlPanel) return;

        // Insert mode selector before first section
        const firstSection = controlPanel.querySelector('.panel-section');
        if (!firstSection) return;

        const modeSelector = document.createElement('div');
        modeSelector.className = 'v8-mode-selector';
        modeSelector.innerHTML = `
            <div class="v8-mode-toggle">
                <button class="v8-mode-btn active" data-mode="upload">
                    <svg class="v8-mode-icon" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-width="2" fill="none" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8L12 3 7 8M12 3v12" />
                    </svg>
                    <span>Upload Images</span>
                </button>
                <button class="v8-mode-btn" data-mode="background">
                    <svg class="v8-mode-icon" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
                        <path stroke="currentColor" stroke-width="2" d="M3 12h18"/>
                    </svg>
                    <span>Solid Background</span>
                </button>
            </div>
            <div class="v8-mode-description">
                <p id="modeDescription">Upload images and add text overlays</p>
            </div>
        `;

        firstSection.parentNode.insertBefore(modeSelector, firstSection);
    }

    setupEventListeners() {
        const modeButtons = document.querySelectorAll('.v8-mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.switchMode(mode);
            });
        });
    }

    switchMode(mode) {
        if (this.currentMode === mode) return;

        // V9.1: Clear images and preview when switching modes
        this.clearCurrentMode();

        this.currentMode = mode;
        this.applyMode(mode);

        // Update button states
        document.querySelectorAll('.v8-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Update description
        const descriptions = {
            upload: 'Upload images and add text overlays',
            background: 'Create solid color backgrounds without uploading images'
        };
        const descElement = document.getElementById('modeDescription');
        if (descElement) {
            descElement.textContent = descriptions[mode];
        }

        // Show toast
        if (window.imageTextApp?.components?.v6ui) {
            const messages = {
                upload: '📤 Upload Mode: Ready to add your images',
                background: '🎨 Background Mode: Ready to create backgrounds'
            };
            window.imageTextApp.components.v6ui.showToast(messages[mode], 'info', 3000);
        }

        // Save preference
        localStorage.setItem('v8-mode', mode);
    }

    clearCurrentMode() {
        // V9.1: Clear images from state
        if (this.state) {
            this.state.images = [];
            this.state.imageFiles = [];
            this.state.minWidth = Infinity;
        }

        // Clear preview canvas
        const canvasContainer = document.getElementById('canvasContainer');
        if (canvasContainer) {
            // Remove all preview items except empty state
            const previewItems = canvasContainer.querySelectorAll('.preview-item');
            previewItems.forEach(item => item.remove());

            // Show empty state
            const emptyState = canvasContainer.querySelector('.empty-state');
            if (emptyState) {
                emptyState.style.display = 'flex';
            }
        }

        // Clear file input
        const imageLoader = document.getElementById('imageLoader');
        if (imageLoader) {
            imageLoader.value = '';
        }

        // Disable add text button
        const addTextButton = document.getElementById('addTextButton');
        if (addTextButton) {
            addTextButton.disabled = true;
        }

        // Clear download all button
        const downloadAllZip = document.getElementById('downloadAllZip');
        if (downloadAllZip) {
            downloadAllZip.disabled = true;
        }

        console.log('🧹 Cleared previous mode data');
    }

    applyMode(mode) {
        // Get sections
        const uploadSection = document.getElementById('uploadSection');
        const folderSection = document.getElementById('folderImagesSection');
        const solidBgSection = document.getElementById('solidBackgroundSection');

        if (mode === 'upload') {
            // Show upload sections, hide background
            if (uploadSection) this.showSection(uploadSection);
            if (folderSection) this.showSection(folderSection);
            if (solidBgSection) this.hideSection(solidBgSection);
        } else {
            // Show background section, hide upload
            if (uploadSection) this.hideSection(uploadSection);
            if (folderSection) this.hideSection(folderSection);
            if (solidBgSection) this.showSection(solidBgSection);
        }
    }

    showSection(section) {
        section.style.display = 'block';
        section.classList.add('v8-fade-in');
    }

    hideSection(section) {
        section.style.display = 'none';
        section.classList.remove('v8-fade-in');
    }

    getCurrentMode() {
        return this.currentMode;
    }

    // Restore saved mode on init
    restoreSavedMode() {
        const savedMode = localStorage.getItem('v8-mode');
        if (savedMode && (savedMode === 'upload' || savedMode === 'background')) {
            this.switchMode(savedMode);
        }
    }
}
