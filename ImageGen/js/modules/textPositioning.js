/* =====================================================
   TEXT POSITIONING MODULE - v9.0
   Advanced Text Positioning System
   ===================================================== */

export class TextPositioning {
    constructor(DOM, state) {
        this.DOM = DOM;
        this.state = state;

        // Position state
        this.positioning = {
            freeMode: false,
            main: {
                xPercent: 50,    // 0-100% (center)
                yPercent: 85,    // 0-100% (near bottom)
                offsetX: 0,      // -200 to +200px
                offsetY: 0       // -200 to +200px
            },
            subtitle: {
                xPercent: 50,
                yPercent: 92,
                offsetX: 0,
                offsetY: 0
            },
            showGrid: false
        };

        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.setupLayerTabs();
        this.loadSavedPositioning();

        // V10.1 Simplified: Force disable freeMode since Advanced Positioning is hidden
        this.positioning.freeMode = false;

        // Clear old v9 positioning from localStorage to prevent conflicts
        try {
            const saved = localStorage.getItem('v9_textPositioning');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.freeMode === true) {
                    // Reset to simple mode
                    parsed.freeMode = false;
                    localStorage.setItem('v9_textPositioning', JSON.stringify(parsed));
                    console.log('V10.1: Cleared freeMode from saved positioning');
                }
            }
        } catch (e) {
            console.warn('Failed to clear old positioning:', e);
        }

        console.log('Text Positioning initialized (v10.1 Simplified: freeMode disabled)');
    }

    setupLayerTabs() {
        const mainTab = document.getElementById('mainLayerTab');
        const subtitleTab = document.getElementById('subtitleLayerTab');
        const mainControls = document.getElementById('mainPosControls');
        const subtitleControls = document.getElementById('subtitlePosControls');

        if (mainTab && subtitleTab) {
            mainTab.addEventListener('click', () => {
                mainTab.classList.add('active');
                subtitleTab.classList.remove('active');
                if (mainControls) mainControls.style.display = 'block';
                if (subtitleControls) subtitleControls.style.display = 'none';
            });

            subtitleTab.addEventListener('click', () => {
                subtitleTab.classList.add('active');
                mainTab.classList.remove('active');
                if (subtitleControls) subtitleControls.style.display = 'block';
                if (mainControls) mainControls.style.display = 'none';
            });
        }
    }

    setupEventListeners() {
        // Free positioning mode toggle
        const freeModeToggle = document.getElementById('freePosMode');
        if (freeModeToggle) {
            freeModeToggle.addEventListener('change', (e) => {
                this.positioning.freeMode = e.target.checked;
                this.togglePositioningControls(e.target.checked);
                this.savePositioning();
                this.triggerUpdate();
            });
        }

        // Main text position controls
        this.setupPositionControl('mainXPos', 'main', 'xPercent');
        this.setupPositionControl('mainYPos', 'main', 'yPercent');
        this.setupPositionControl('mainOffsetX', 'main', 'offsetX');
        this.setupPositionControl('mainOffsetY', 'main', 'offsetY');

        // Subtitle position controls
        this.setupPositionControl('subXPos', 'subtitle', 'xPercent');
        this.setupPositionControl('subYPos', 'subtitle', 'yPercent');
        this.setupPositionControl('subOffsetX', 'subtitle', 'offsetX');
        this.setupPositionControl('subOffsetY', 'subtitle', 'offsetY');

        // Grid toggle
        const gridToggle = document.getElementById('showGrid');
        if (gridToggle) {
            gridToggle.addEventListener('change', (e) => {
                this.positioning.showGrid = e.target.checked;
                this.triggerUpdate();
            });
        }

        // Reset buttons
        const resetMain = document.getElementById('resetMainPos');
        if (resetMain) {
            resetMain.addEventListener('click', () => this.resetPosition('main'));
        }

        const resetSub = document.getElementById('resetSubPos');
        if (resetSub) {
            resetSub.addEventListener('click', () => this.resetPosition('subtitle'));
        }

        // Quick position presets (9 positions)
        this.setupQuickPresets();
    }

    setupPositionControl(elementId, target, property) {
        const control = document.getElementById(elementId);
        const display = document.getElementById(`${elementId}Value`);

        if (control) {
            control.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.positioning[target][property] = value;

                // Update display
                if (display) {
                    if (property.includes('Percent')) {
                        display.textContent = `${value}%`;
                    } else {
                        display.textContent = `${value}px`;
                    }
                }

                this.savePositioning();
                this.triggerUpdate();
            });

            // Initialize display
            if (display) {
                const value = this.positioning[target][property];
                if (property.includes('Percent')) {
                    display.textContent = `${value}%`;
                } else {
                    display.textContent = `${value}px`;
                }
            }
        }
    }

    setupQuickPresets() {
        const presetButtons = document.querySelectorAll('.quick-pos-btn');
        presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const position = btn.dataset.position;
                const target = btn.dataset.target || 'main';
                this.applyQuickPreset(position, target);
            });
        });
    }

    applyQuickPreset(position, target = 'main') {
        const presets = {
            'top-left': { xPercent: 10, yPercent: 10 },
            'top-center': { xPercent: 50, yPercent: 10 },
            'top-right': { xPercent: 90, yPercent: 10 },
            'middle-left': { xPercent: 10, yPercent: 50 },
            'middle-center': { xPercent: 50, yPercent: 50 },
            'middle-right': { xPercent: 90, yPercent: 50 },
            'bottom-left': { xPercent: 10, yPercent: 90 },
            'bottom-center': { xPercent: 50, yPercent: 90 },
            'bottom-right': { xPercent: 90, yPercent: 90 }
        };

        if (presets[position]) {
            this.positioning[target].xPercent = presets[position].xPercent;
            this.positioning[target].yPercent = presets[position].yPercent;
            this.positioning[target].offsetX = 0;
            this.positioning[target].offsetY = 0;

            this.updateControlValues(target);
            this.savePositioning();
            this.triggerUpdate();
        }
    }

    updateControlValues(target) {
        // Update slider positions
        const xControl = document.getElementById(`${target === 'main' ? 'mainXPos' : 'subXPos'}`);
        const yControl = document.getElementById(`${target === 'main' ? 'mainYPos' : 'subYPos'}`);
        const offsetXControl = document.getElementById(`${target === 'main' ? 'mainOffsetX' : 'subOffsetX'}`);
        const offsetYControl = document.getElementById(`${target === 'main' ? 'mainOffsetY' : 'subOffsetY'}`);

        if (xControl) {
            xControl.value = this.positioning[target].xPercent;
            const display = document.getElementById(`${xControl.id}Value`);
            if (display) display.textContent = `${this.positioning[target].xPercent}%`;
        }

        if (yControl) {
            yControl.value = this.positioning[target].yPercent;
            const display = document.getElementById(`${yControl.id}Value`);
            if (display) display.textContent = `${this.positioning[target].yPercent}%`;
        }

        if (offsetXControl) {
            offsetXControl.value = this.positioning[target].offsetX;
            const display = document.getElementById(`${offsetXControl.id}Value`);
            if (display) display.textContent = `${this.positioning[target].offsetX}px`;
        }

        if (offsetYControl) {
            offsetYControl.value = this.positioning[target].offsetY;
            const display = document.getElementById(`${offsetYControl.id}Value`);
            if (display) display.textContent = `${this.positioning[target].offsetY}px`;
        }
    }

    resetPosition(target) {
        if (target === 'main') {
            this.positioning.main = {
                xPercent: 50,
                yPercent: 85,
                offsetX: 0,
                offsetY: 0
            };
        } else {
            this.positioning.subtitle = {
                xPercent: 50,
                yPercent: 92,
                offsetX: 0,
                offsetY: 0
            };
        }

        this.updateControlValues(target);
        this.savePositioning();
        this.triggerUpdate();
    }

    togglePositioningControls(enabled) {
        const container = document.getElementById('advancedPositioningControls');
        if (container) {
            container.style.display = enabled ? 'block' : 'none';
        }

        // If disabling, use traditional position picker
        const positionPicker = document.getElementById('positionPicker');
        if (positionPicker) {
            positionPicker.disabled = enabled;
            positionPicker.style.opacity = enabled ? '0.5' : '1';
        }
    }

    calculatePosition(canvasWidth, canvasHeight, target = 'main') {
        const pos = this.positioning[target];

        if (!this.positioning.freeMode) {
            // Use traditional position picker if not in free mode
            return null;
        }

        // Calculate absolute position from percentage
        const x = (canvasWidth * pos.xPercent / 100) + pos.offsetX;
        const y = (canvasHeight * pos.yPercent / 100) + pos.offsetY;

        return { x, y };
    }

    savePositioning() {
        try {
            localStorage.setItem('v9_textPositioning', JSON.stringify(this.positioning));
        } catch (e) {
            console.warn('Failed to save positioning:', e);
        }
    }

    loadSavedPositioning() {
        try {
            const saved = localStorage.getItem('v9_textPositioning');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.positioning = { ...this.positioning, ...parsed };

                // Update UI to reflect loaded values
                const freeModeToggle = document.getElementById('freePosMode');
                if (freeModeToggle) {
                    freeModeToggle.checked = this.positioning.freeMode;
                    this.togglePositioningControls(this.positioning.freeMode);
                }

                this.updateControlValues('main');
                this.updateControlValues('subtitle');
            }
        } catch (e) {
            console.warn('Failed to load positioning:', e);
        }
    }

    triggerUpdate() {
        // Trigger re-render of preview
        if (window.renderImages) {
            window.renderImages();
        }
    }

    getPositioning() {
        return this.positioning;
    }
}
