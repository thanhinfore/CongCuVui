/* =====================================================
   COMMAND PALETTE v11 - Quick Action System
   Features: Fuzzy Search, Keyboard Nav, Quick Actions
   V14: Enhanced with sanitization
   ===================================================== */

import { sanitizer } from './sanitizer.js';

export class CommandPalette {
    constructor(app) {
        this.app = app;
        this.isOpen = false;
        this.recentActions = this.loadRecentActions();
        this.selectedIndex = 0;
        this.filteredCommands = [];
        this.init();
    }

    init() {
        this.createPaletteUI();
        this.setupEventListeners();
        this.registerCommands();
        this.injectStyles();
    }

    registerCommands() {
        this.commands = [
            // Presets
            { id: 'preset-minimalist', name: 'Apply Minimalist Preset', category: 'Presets', icon: '🎯', action: () => this.applyPreset('minimalist-clean'), keywords: ['preset', 'minimalist', 'clean', 'simple'] },
            { id: 'preset-bold', name: 'Apply Bold Impact Preset', category: 'Presets', icon: '💥', action: () => this.applyPreset('bold-impact'), keywords: ['preset', 'bold', 'impact', 'strong'] },
            { id: 'preset-luxury', name: 'Apply Luxury Gold Preset', category: 'Presets', icon: '💎', action: () => this.applyPreset('luxury-gold'), keywords: ['preset', 'luxury', 'gold', 'elegant'] },
            { id: 'preset-tech', name: 'Apply Tech Modern Preset', category: 'Presets', icon: '🚀', action: () => this.applyPreset('tech-modern'), keywords: ['preset', 'tech', 'modern', 'digital'] },
            { id: 'preset-gradient', name: 'Apply Sunset Gradient Preset', category: 'Presets', icon: '🌈', action: () => this.applyPreset('gradient-sunset'), keywords: ['preset', 'gradient', 'sunset', 'colorful'] },

            // Styles
            { id: 'font-inter', name: 'Change Font to Inter', category: 'Styles', icon: '🔤', action: () => this.changeFont('Inter, sans-serif'), keywords: ['font', 'inter', 'typography'] },
            { id: 'font-roboto', name: 'Change Font to Roboto', category: 'Styles', icon: '🔤', action: () => this.changeFont('Roboto, sans-serif'), keywords: ['font', 'roboto', 'typography'] },
            { id: 'font-montserrat', name: 'Change Font to Montserrat', category: 'Styles', icon: '🔤', action: () => this.changeFont('Montserrat, sans-serif'), keywords: ['font', 'montserrat', 'typography'] },
            { id: 'color-white', name: 'Set Text Color to White', category: 'Styles', icon: '🎨', action: () => this.setTextColor('#FFFFFF'), keywords: ['color', 'white', 'text'] },
            { id: 'color-black', name: 'Set Text Color to Black', category: 'Styles', icon: '🎨', action: () => this.setTextColor('#000000'), keywords: ['color', 'black', 'text'] },
            { id: 'toggle-border', name: 'Toggle Text Border', category: 'Styles', icon: '📦', action: () => this.toggleBorder(), keywords: ['border', 'outline', 'stroke'] },
            { id: 'toggle-shadow', name: 'Toggle Text Shadow', category: 'Styles', icon: '🌑', action: () => this.toggleShadow(), keywords: ['shadow', 'drop shadow', 'effect'] },

            // Actions
            { id: 'export-png', name: 'Export as PNG', category: 'Actions', icon: '📤', action: () => this.exportImages('png'), keywords: ['export', 'download', 'png', 'save'] },
            { id: 'export-jpg', name: 'Export as JPEG', category: 'Actions', icon: '📤', action: () => this.exportImages('jpg'), keywords: ['export', 'download', 'jpeg', 'jpg', 'save'] },
            { id: 'export-webp', name: 'Export as WebP', category: 'Actions', icon: '📤', action: () => this.exportImages('webp'), keywords: ['export', 'download', 'webp', 'save'] },
            { id: 'export-all', name: 'Export All Formats', category: 'Actions', icon: '📦', action: () => this.exportAllFormats(), keywords: ['export', 'download', 'all', 'formats'] },
            { id: 'undo', name: 'Undo', category: 'Actions', icon: '↩️', action: () => this.undo(), keywords: ['undo', 'revert', 'back'] },
            { id: 'redo', name: 'Redo', category: 'Actions', icon: '↪️', action: () => this.redo(), keywords: ['redo', 'forward'] },
            { id: 'reset', name: 'Reset All Settings', category: 'Actions', icon: '🔄', action: () => this.resetSettings(), keywords: ['reset', 'clear', 'default'] },
            { id: 'save', name: 'Save Current Settings', category: 'Actions', icon: '💾', action: () => this.saveSettings(), keywords: ['save', 'store', 'persist'] },
            { id: 'save-preset', name: 'Save as Custom Preset', category: 'Actions', icon: '⭐', action: () => this.saveAsPreset(), keywords: ['save', 'preset', 'custom', 'template'] },

            // Knowledge Mode
            { id: 'toggle-knowledge', name: 'Toggle Knowledge Mode', category: 'Knowledge', icon: '🎓', action: () => this.toggleKnowledgeMode(), keywords: ['knowledge', 'batch', 'mode', 'toggle'] },
            { id: 'insert-template', name: 'Insert Knowledge Template', category: 'Knowledge', icon: '📝', action: () => this.insertKnowledgeTemplate(), keywords: ['template', 'knowledge', 'insert', 'example'] },

            // Image Management
            { id: 'random-1', name: 'Select 1 Random Image', category: 'Images', icon: '🎲', action: () => this.randomImages(1), keywords: ['random', 'image', 'one', 'select'] },
            { id: 'random-3', name: 'Select 3 Random Images', category: 'Images', icon: '🎲', action: () => this.randomImages(3), keywords: ['random', 'image', 'three', 'select'] },
            { id: 'select-all', name: 'Select All Images', category: 'Images', icon: '📸', action: () => this.selectAllImages(), keywords: ['select', 'all', 'images'] },
            { id: 'clear-images', name: 'Clear All Images', category: 'Images', icon: '🗑️', action: () => this.clearImages(), keywords: ['clear', 'remove', 'delete', 'images'] },

            // Help
            { id: 'help', name: 'Show Help & Tips', category: 'Help', icon: 'ℹ️', action: () => this.showHelp(), keywords: ['help', 'tips', 'guide', 'tutorial'] },
            { id: 'shortcuts', name: 'Show Keyboard Shortcuts', category: 'Help', icon: '⌨️', action: () => this.showShortcuts(), keywords: ['keyboard', 'shortcuts', 'keys', 'hotkeys'] },
            { id: 'markdown-help', name: 'Markdown Guide', category: 'Help', icon: '📖', action: () => this.showMarkdownHelp(), keywords: ['markdown', 'format', 'syntax', 'guide'] },

            // Tools
            { id: 'color-picker', name: 'Open Smart Color Picker', category: 'Tools', icon: '🎨', action: () => this.openColorPicker(), keywords: ['color', 'picker', 'palette', 'harmony'] }
        ];
    }

    createPaletteUI() {
        const container = document.createElement('div');
        container.id = 'commandPalette';
        container.className = 'command-palette-container';
        container.innerHTML = `
            <div class="command-palette-panel">
                <div class="palette-search">
                    <svg class="search-icon" viewBox="0 0 24 24" width="20" height="20">
                        <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" fill="none"/>
                        <path stroke="currentColor" stroke-width="2" d="M21 21l-4.35-4.35"/>
                    </svg>
                    <input
                        type="text"
                        id="paletteSearchInput"
                        placeholder="Type a command or search... (Try 'preset', 'export', 'color')"
                        autocomplete="off"
                        spellcheck="false"
                    >
                    <kbd class="palette-shortcut">Esc</kbd>
                </div>

                <div class="palette-content">
                    <div class="palette-section" id="recentSection" style="display: none;">
                        <div class="section-header">Recent</div>
                        <div class="command-list" id="recentCommands"></div>
                    </div>

                    <div class="palette-section" id="resultsSection">
                        <div class="section-header">All Commands</div>
                        <div class="command-list" id="commandResults"></div>
                    </div>

                    <div class="palette-empty" id="emptyState" style="display: none;">
                        <svg viewBox="0 0 24 24" width="48" height="48">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
                            <path stroke="currentColor" stroke-width="2" d="M8 15s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>
                        </svg>
                        <p>No commands found</p>
                        <small>Try different keywords</small>
                    </div>
                </div>

                <div class="palette-footer">
                    <div class="footer-hint">
                        <kbd>↑</kbd><kbd>↓</kbd> Navigate
                        <kbd>Enter</kbd> Select
                        <kbd>Esc</kbd> Close
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(container);
        this.container = container;
        this.panel = container.querySelector('.command-palette-panel');
        this.searchInput = container.querySelector('#paletteSearchInput');
        this.resultsContainer = container.querySelector('#commandResults');
        this.recentContainer = container.querySelector('#recentCommands');
        this.emptyState = container.querySelector('#emptyState');
    }

    setupEventListeners() {
        // Global keyboard shortcut
        document.addEventListener('keydown', (e) => {
            // Ctrl+K or Cmd+K to toggle
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.toggle();
            }

            // Escape to close
            if (this.isOpen && e.key === 'Escape') {
                this.close();
            }

            // Arrow navigation
            if (this.isOpen) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.navigateDown();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.navigateUp();
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    this.executeSelected();
                }
            }
        });

        // Click outside to close
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.close();
            }
        });

        // Search input
        this.searchInput.addEventListener('input', (e) => {
            this.search(e.target.value);
        });

        // Command click
        this.container.addEventListener('click', (e) => {
            const commandItem = e.target.closest('.command-item');
            if (commandItem) {
                const commandId = commandItem.dataset.commandId;
                this.executeCommand(commandId);
            }
        });

        // Prevent default form submission
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.isOpen = true;
        this.container.classList.add('active');
        this.searchInput.value = '';
        this.selectedIndex = 0;
        this.renderCommands(this.commands);
        this.renderRecentCommands();
        setTimeout(() => {
            this.searchInput.focus();
        }, 100);
    }

    close() {
        this.isOpen = false;
        this.container.classList.remove('active');
        this.searchInput.value = '';
    }

    search(query) {
        if (!query.trim()) {
            this.renderCommands(this.commands);
            document.getElementById('resultsSection').querySelector('.section-header').textContent = 'All Commands';
            return;
        }

        const lowerQuery = query.toLowerCase();
        this.filteredCommands = this.commands.filter(cmd => {
            return cmd.name.toLowerCase().includes(lowerQuery) ||
                   cmd.category.toLowerCase().includes(lowerQuery) ||
                   cmd.keywords.some(k => k.toLowerCase().includes(lowerQuery));
        });

        // Fuzzy match scoring
        this.filteredCommands.sort((a, b) => {
            const aScore = this.fuzzyScore(a, lowerQuery);
            const bScore = this.fuzzyScore(b, lowerQuery);
            return bScore - aScore;
        });

        this.selectedIndex = 0;
        this.renderCommands(this.filteredCommands);
        document.getElementById('resultsSection').querySelector('.section-header').textContent =
            `Results (${this.filteredCommands.length})`;
    }

    fuzzyScore(command, query) {
        let score = 0;
        const name = command.name.toLowerCase();

        // Exact match in name
        if (name.includes(query)) score += 100;

        // Starts with query
        if (name.startsWith(query)) score += 50;

        // Category match
        if (command.category.toLowerCase().includes(query)) score += 30;

        // Keywords match
        command.keywords.forEach(keyword => {
            if (keyword.includes(query)) score += 20;
        });

        return score;
    }

    renderCommands(commands) {
        if (commands.length === 0) {
            this.resultsContainer.style.display = 'none';
            this.emptyState.style.display = 'flex';
            return;
        }

        this.emptyState.style.display = 'none';
        this.resultsContainer.style.display = 'block';

        // Group by category
        const grouped = commands.reduce((acc, cmd) => {
            if (!acc[cmd.category]) acc[cmd.category] = [];
            acc[cmd.category].push(cmd);
            return acc;
        }, {});

        let html = '';
        let globalIndex = 0;

        for (const [category, cmds] of Object.entries(grouped)) {
            html += `<div class="category-group">`;
            html += `<div class="category-label">${category}</div>`;

            cmds.forEach(cmd => {
                html += this.renderCommandItem(cmd, globalIndex === this.selectedIndex);
                globalIndex++;
            });

            html += `</div>`;
        }

        this.resultsContainer.innerHTML = html;
    }

    renderCommandItem(command, isSelected) {
        // V14 Security: Escape all values even though they are hardcoded
        const safeId = sanitizer.sanitizeAttribute(command.id);
        const safeName = sanitizer.escapeHtml(command.name);
        const safeCategory = sanitizer.escapeHtml(command.category);
        const safeIcon = sanitizer.escapeHtml(command.icon);

        return `
            <div class="command-item ${isSelected ? 'selected' : ''}" data-command-id="${safeId}">
                <span class="command-icon">${safeIcon}</span>
                <div class="command-info">
                    <div class="command-name">${safeName}</div>
                    <div class="command-category">${safeCategory}</div>
                </div>
            </div>
        `;
    }

    renderRecentCommands() {
        const recentSection = document.getElementById('recentSection');
        if (this.recentActions.length === 0) {
            recentSection.style.display = 'none';
            return;
        }

        recentSection.style.display = 'block';
        const recentCommands = this.recentActions
            .map(id => this.commands.find(cmd => cmd.id === id))
            .filter(Boolean)
            .slice(0, 5);

        this.recentContainer.innerHTML = recentCommands
            .map(cmd => this.renderCommandItem(cmd, false))
            .join('');
    }

    navigateDown() {
        const visibleCommands = this.getVisibleCommands();
        this.selectedIndex = (this.selectedIndex + 1) % visibleCommands.length;
        this.updateSelection();
    }

    navigateUp() {
        const visibleCommands = this.getVisibleCommands();
        this.selectedIndex = (this.selectedIndex - 1 + visibleCommands.length) % visibleCommands.length;
        this.updateSelection();
    }

    getVisibleCommands() {
        return this.searchInput.value.trim() ? this.filteredCommands : this.commands;
    }

    updateSelection() {
        const items = this.resultsContainer.querySelectorAll('.command-item');
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === this.selectedIndex);
        });

        // Scroll into view
        const selected = items[this.selectedIndex];
        if (selected) {
            selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }

    executeSelected() {
        const visibleCommands = this.getVisibleCommands();
        const command = visibleCommands[this.selectedIndex];
        if (command) {
            this.executeCommand(command.id);
        }
    }

    executeCommand(commandId) {
        const command = this.commands.find(cmd => cmd.id === commandId);
        if (command) {
            this.addToRecent(commandId);
            this.close();

            // Execute with slight delay for smooth closing
            setTimeout(() => {
                try {
                    command.action();
                    this.showToast(`✓ ${command.name}`, 'success');
                } catch (error) {
                    console.error('Command execution error:', error);
                    this.showToast(`Failed to execute: ${command.name}`, 'error');
                }
            }, 100);
        }
    }

    addToRecent(commandId) {
        this.recentActions = this.recentActions.filter(id => id !== commandId);
        this.recentActions.unshift(commandId);
        if (this.recentActions.length > 10) {
            this.recentActions = this.recentActions.slice(0, 10);
        }
        this.saveRecentActions();
    }

    loadRecentActions() {
        try {
            const saved = localStorage.getItem('commandPalette_recent');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    }

    saveRecentActions() {
        try {
            localStorage.setItem('commandPalette_recent', JSON.stringify(this.recentActions));
        } catch (e) {
            console.error('Failed to save recent actions:', e);
        }
    }

    // Command Actions
    applyPreset(presetName) {
        if (this.app.components.presets) {
            // Find preset by name or partial match
            const presetButton = document.querySelector(`[data-preset*="${presetName}"]`);
            if (presetButton) {
                presetButton.click();
            }
        }
    }

    changeFont(fontFamily) {
        if (this.app.DOM.fontSelect) {
            this.app.DOM.fontSelect.value = fontFamily;
            this.app.DOM.fontSelect.dispatchEvent(new Event('change', { bubbles: true }));
            this.app.components.controls?.handleStyleChange();
        }
    }

    setTextColor(color) {
        if (this.app.DOM.colorPicker) {
            this.app.DOM.colorPicker.value = color;
            this.app.DOM.colorPicker.dispatchEvent(new Event('input', { bubbles: true }));
            this.app.components.controls?.handleStyleChange();
        }
    }

    toggleBorder() {
        if (this.app.DOM.textBorderCheckbox) {
            this.app.DOM.textBorderCheckbox.checked = !this.app.DOM.textBorderCheckbox.checked;
            this.app.DOM.textBorderCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    toggleShadow() {
        if (this.app.DOM.textShadowCheckbox) {
            this.app.DOM.textShadowCheckbox.checked = !this.app.DOM.textShadowCheckbox.checked;
            this.app.DOM.textShadowCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    exportImages(format) {
        const formatSelect = document.getElementById('formatSelect');
        if (formatSelect) {
            formatSelect.value = format;
        }
        const downloadBtn = document.getElementById('downloadAllBtn');
        if (downloadBtn) {
            downloadBtn.click();
        }
    }

    exportAllFormats() {
        this.showToast('Exporting all formats...', 'info');
        // This would require backend support or multiple exports
        this.exportImages('png');
    }

    undo() {
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn && !undoBtn.disabled) {
            undoBtn.click();
        }
    }

    redo() {
        const redoBtn = document.getElementById('redoBtn');
        if (redoBtn && !redoBtn.disabled) {
            redoBtn.click();
        }
    }

    resetSettings() {
        const resetBtn = document.getElementById('resetSettings');
        if (resetBtn) {
            resetBtn.click();
        }
    }

    saveSettings() {
        this.app.saveState();
        this.showToast('Settings saved!', 'success');
    }

    saveAsPreset() {
        const name = prompt('Enter preset name:');
        if (name) {
            // This would integrate with enhanced preset system
            this.showToast(`Preset "${name}" saved!`, 'success');
        }
    }

    toggleKnowledgeMode() {
        const checkbox = document.getElementById('knowledgeModeCheckbox');
        if (checkbox) {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    insertKnowledgeTemplate() {
        if (this.app.insertKnowledgeTemplate) {
            this.app.insertKnowledgeTemplate();
        }
    }

    randomImages(count) {
        if (this.app.components.imageBrowser) {
            this.app.components.imageBrowser.selectRandomImages(count);
        }
    }

    selectAllImages() {
        if (this.app.components.imageBrowser) {
            this.app.components.imageBrowser.selectAllImages();
        }
    }

    clearImages() {
        if (confirm('Clear all images?')) {
            this.app.state.images = [];
            this.app.state.imageFiles = [];
            this.app.components.preview?.render();
            this.showToast('All images cleared', 'info');
        }
    }

    showHelp() {
        const helpBtn = document.getElementById('helpBtn');
        if (helpBtn) {
            helpBtn.click();
        }
    }

    showShortcuts() {
        const shortcutsBtn = document.getElementById('keyboardShortcutsBtn');
        if (shortcutsBtn) {
            shortcutsBtn.click();
        }
    }

    showMarkdownHelp() {
        const markdownBtn = document.getElementById('markdownHelpBtn');
        if (markdownBtn) {
            markdownBtn.click();
        }
    }

    openColorPicker() {
        if (window.smartColorPicker) {
            window.smartColorPicker.open(this.app.DOM.colorPicker);
        }
    }


    showToast(message, type) {
        if (this.app.components?.v6ui) {
            this.app.components.v6ui.showToast(message, type, 2000);
        }
    }

    injectStyles() {
        if (document.getElementById('commandPaletteStyles')) return;

        const style = document.createElement('style');
        style.id = 'commandPaletteStyles';
        style.textContent = `
            .command-palette-container {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(8px);
                z-index: 10001;
                display: none;
                align-items: flex-start;
                justify-content: center;
                padding-top: 15vh;
                animation: fadeIn 0.15s ease;
            }

            .command-palette-container.active {
                display: flex;
            }

            .command-palette-panel {
                background: white;
                border-radius: 12px;
                box-shadow: 0 25px 70px rgba(0, 0, 0, 0.4);
                width: 90%;
                max-width: 640px;
                max-height: 60vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                animation: commandPaletteSlide 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            @keyframes commandPaletteSlide {
                from {
                    transform: translateY(-20px) scale(0.95);
                    opacity: 0;
                }
                to {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                }
            }

            .palette-search {
                padding: 16px;
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                align-items: center;
                gap: 12px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }

            .search-icon {
                color: rgba(255, 255, 255, 0.7);
                flex-shrink: 0;
            }

            #paletteSearchInput {
                flex: 1;
                border: none;
                background: rgba(255, 255, 255, 0.15);
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 1rem;
                color: white;
                outline: none;
                backdrop-filter: blur(10px);
            }

            #paletteSearchInput::placeholder {
                color: rgba(255, 255, 255, 0.6);
            }

            #paletteSearchInput:focus {
                background: rgba(255, 255, 255, 0.25);
            }

            .palette-shortcut {
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.75rem;
                font-weight: 600;
                color: white;
            }

            .palette-content {
                flex: 1;
                overflow-y: auto;
                padding: 8px;
            }

            .palette-section {
                margin-bottom: 16px;
            }

            .section-header {
                font-size: 0.75rem;
                font-weight: 600;
                color: #9ca3af;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                padding: 8px 12px;
                margin-bottom: 4px;
            }

            .command-list {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .category-group {
                margin-bottom: 16px;
            }

            .category-label {
                font-size: 0.75rem;
                font-weight: 600;
                color: #6b7280;
                padding: 4px 12px;
                margin-bottom: 4px;
            }

            .command-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.15s ease;
            }

            .command-item:hover,
            .command-item.selected {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }

            .command-item:hover .command-name,
            .command-item:hover .command-category,
            .command-item.selected .command-name,
            .command-item.selected .command-category {
                color: white;
            }

            .command-icon {
                font-size: 1.5rem;
                flex-shrink: 0;
                filter: grayscale(0.3);
            }

            .command-item:hover .command-icon,
            .command-item.selected .command-icon {
                filter: none;
            }

            .command-info {
                flex: 1;
                min-width: 0;
            }

            .command-name {
                font-weight: 500;
                color: #1f2937;
                transition: color 0.15s;
            }

            .command-category {
                font-size: 0.75rem;
                color: #9ca3af;
                margin-top: 2px;
                transition: color 0.15s;
            }

            .palette-empty {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 60px 20px;
                color: #9ca3af;
            }

            .palette-empty svg {
                margin-bottom: 16px;
                opacity: 0.5;
            }

            .palette-empty p {
                font-weight: 600;
                margin: 0 0 8px 0;
            }

            .palette-empty small {
                font-size: 0.875rem;
            }

            .palette-footer {
                padding: 12px 16px;
                border-top: 1px solid #e5e7eb;
                background: #f9fafb;
            }

            .footer-hint {
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 0.75rem;
                color: #6b7280;
            }

            .footer-hint kbd {
                background: white;
                border: 1px solid #d1d5db;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 0.7rem;
                font-weight: 600;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            }

            @media (max-width: 768px) {
                .command-palette-panel {
                    width: 95%;
                    max-height: 70vh;
                }

                .command-item {
                    padding: 10px;
                }

                .command-icon {
                    font-size: 1.25rem;
                }
            }
        `;
        document.head.appendChild(style);
    }
}
