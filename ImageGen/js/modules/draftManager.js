/* =====================================================
   DRAFT MANAGER v11 - Auto-save & Draft Management
   Features: Auto-save, Draft History, Recovery
   ===================================================== */

export class DraftManager {
    constructor(app) {
        this.app = app;
        this.autoSaveInterval = null;
        this.autoSaveDelay = 30000; // 30 seconds
        this.maxDrafts = 5;
        this.lastSaveTime = null;
        this.isSaving = false;
        this.hasUnsavedChanges = false;
        this.init();
    }

    init() {
        this.createUI();
        this.startAutoSave();
        this.setupChangeDetection();
        this.cleanOldDrafts();
        this.injectStyles();
    }

    createUI() {
        // Create status indicator
        const statusBar = document.createElement('div');
        statusBar.id = 'draftStatusBar';
        statusBar.className = 'draft-status-bar';
        statusBar.innerHTML = `
            <div class="draft-status-content">
                <div class="status-indicator">
                    <svg class="status-icon saving" viewBox="0 0 24 24" width="16" height="16" style="display: none;">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" opacity="0.3"/>
                        <path stroke="currentColor" stroke-width="2" fill="none" d="M12 2a10 10 0 0110 10" class="spinner"/>
                    </svg>
                    <svg class="status-icon saved" viewBox="0 0 24 24" width="16" height="16">
                        <path stroke="currentColor" stroke-width="2" fill="none" d="M20 6L9 17l-5-5"/>
                    </svg>
                    <span class="status-text">Auto-saved</span>
                </div>
                <span class="last-saved-time">Just now</span>
                <button class="btn-drafts" id="openDraftsBtn" title="View Drafts">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path stroke="currentColor" stroke-width="2" fill="none" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    Drafts
                </button>
            </div>
        `;

        // Insert after header
        const header = document.querySelector('.app-header');
        if (header && header.nextSibling) {
            header.parentNode.insertBefore(statusBar, header.nextSibling);
        }

        // Create drafts panel
        const draftsPanel = document.createElement('div');
        draftsPanel.id = 'draftsPanel';
        draftsPanel.className = 'drafts-panel-container';
        draftsPanel.innerHTML = `
            <div class="drafts-panel">
                <div class="drafts-header">
                    <h3>💾 Saved Drafts</h3>
                    <button class="btn-close-drafts" id="closeDraftsBtn">
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path stroke="currentColor" stroke-width="2" fill="none" d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="drafts-content">
                    <div class="drafts-list" id="draftsList"></div>
                </div>
                <div class="drafts-footer">
                    <small>Drafts are auto-saved every 30 seconds. Old drafts (7+ days) are auto-deleted.</small>
                </div>
            </div>
        `;

        document.body.appendChild(draftsPanel);

        this.statusBar = statusBar;
        this.draftsPanel = draftsPanel;
        this.setupUIEventListeners();
    }

    setupUIEventListeners() {
        // Open drafts panel
        const openBtn = document.getElementById('openDraftsBtn');
        if (openBtn) {
            openBtn.addEventListener('click', () => {
                this.showDraftsPanel();
            });
        }

        // Close drafts panel
        const closeBtn = document.getElementById('closeDraftsBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideDraftsPanel();
            });
        }

        // Click outside to close
        this.draftsPanel.addEventListener('click', (e) => {
            if (e.target === this.draftsPanel) {
                this.hideDraftsPanel();
            }
        });

        // Draft actions
        this.draftsPanel.addEventListener('click', (e) => {
            const draftCard = e.target.closest('.draft-card');
            if (!draftCard) return;

            const draftId = draftCard.dataset.draftId;

            if (e.target.closest('.btn-restore-draft')) {
                this.restoreDraft(draftId);
            } else if (e.target.closest('.btn-delete-draft')) {
                this.deleteDraft(draftId);
            }
        });
    }

    setupChangeDetection() {
        // Monitor text input changes
        const textInput = this.app.DOM?.textInput;
        if (textInput) {
            textInput.addEventListener('input', () => {
                this.hasUnsavedChanges = true;
                this.updateStatusUI('unsaved');
            });
        }

        // Monitor style changes
        document.addEventListener('change', (e) => {
            if (e.target.closest('.control-panel')) {
                this.hasUnsavedChanges = true;
                this.updateStatusUI('unsaved');
            }
        });

        // Warn before leaving with unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
    }

    startAutoSave() {
        // Initial save after 30 seconds
        this.autoSaveInterval = setInterval(() => {
            if (this.hasUnsavedChanges && !this.isSaving) {
                this.autoSave();
            }
        }, this.autoSaveDelay);
    }

    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    async autoSave() {
        if (this.isSaving) return;

        this.isSaving = true;
        this.updateStatusUI('saving');

        try {
            const draft = this.createDraft();
            await this.saveDraft(draft);

            this.lastSaveTime = new Date();
            this.hasUnsavedChanges = false;
            this.updateStatusUI('saved');
            this.updateLastSavedTime();
        } catch (error) {
            console.error('Auto-save failed:', error);
            this.updateStatusUI('error');
        } finally {
            this.isSaving = false;
        }
    }

    createDraft() {
        const state = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            text: this.app.DOM?.textInput?.value || '',
            settings: {
                font: this.app.DOM?.fontSelect?.value || 'Inter, sans-serif',
                mainColor: this.app.DOM?.colorPicker?.value || '#FFFFFF',
                subColor: this.app.DOM?.subColorPicker?.value || '#FFFFFF',
                mainFontSize: this.app.DOM?.mainFontSize?.value || '48',
                subFontSize: this.app.DOM?.subFontSize?.value || '32',
                fontWeight: this.app.DOM?.fontWeightSelect?.value || '400',
                position: this.app.DOM?.positionPicker?.value || 'bottom',
                textBorder: this.app.DOM?.textBorderCheckbox?.checked || false,
                textShadow: this.app.DOM?.textShadowCheckbox?.checked || false,
                borderWidth: this.app.DOM?.borderWidth?.value || '2',
                shadowBlur: this.app.DOM?.shadowBlur?.value || '4'
            },
            metadata: {
                lineCount: this.app.DOM?.textInput?.value.split('\n').length || 0,
                imageCount: this.app.state?.images?.length || 0,
                knowledgeMode: document.getElementById('knowledgeModeCheckbox')?.checked || false
            }
        };

        return state;
    }

    async saveDraft(draft) {
        try {
            const drafts = this.loadDrafts();

            // Add new draft at beginning
            drafts.unshift(draft);

            // Keep only max drafts
            if (drafts.length > this.maxDrafts) {
                drafts.splice(this.maxDrafts);
            }

            localStorage.setItem('imagegen_drafts', JSON.stringify(drafts));
            return true;
        } catch (error) {
            console.error('Failed to save draft:', error);
            throw error;
        }
    }

    loadDrafts() {
        try {
            const saved = localStorage.getItem('imagegen_drafts');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    }

    async restoreDraft(draftId) {
        const drafts = this.loadDrafts();
        const draft = drafts.find(d => d.id === draftId);

        if (!draft) {
            this.showToast('Draft not found', 'error');
            return;
        }

        if (!confirm('Restore this draft? Current changes will be lost if not saved.')) {
            return;
        }

        try {
            // Restore text
            if (this.app.DOM?.textInput) {
                this.app.DOM.textInput.value = draft.text || '';
            }

            // Restore settings
            const settings = draft.settings;
            if (this.app.DOM?.fontSelect) this.app.DOM.fontSelect.value = settings.font;
            if (this.app.DOM?.colorPicker) this.app.DOM.colorPicker.value = settings.mainColor;
            if (this.app.DOM?.subColorPicker) this.app.DOM.subColorPicker.value = settings.subColor;
            if (this.app.DOM?.mainFontSize) {
                this.app.DOM.mainFontSize.value = settings.mainFontSize;
                const valueDisplay = this.app.DOM.mainFontSizeValue;
                if (valueDisplay) valueDisplay.textContent = `${settings.mainFontSize}px`;
            }
            if (this.app.DOM?.subFontSize) {
                this.app.DOM.subFontSize.value = settings.subFontSize;
                const valueDisplay = this.app.DOM.subFontSizeValue;
                if (valueDisplay) valueDisplay.textContent = `${settings.subFontSize}px`;
            }
            if (this.app.DOM?.fontWeightSelect) this.app.DOM.fontWeightSelect.value = settings.fontWeight;
            if (this.app.DOM?.positionPicker) this.app.DOM.positionPicker.value = settings.position;
            if (this.app.DOM?.textBorderCheckbox) this.app.DOM.textBorderCheckbox.checked = settings.textBorder;
            if (this.app.DOM?.textShadowCheckbox) this.app.DOM.textShadowCheckbox.checked = settings.textShadow;

            // Trigger style update
            if (this.app.components?.controls) {
                this.app.components.controls.handleStyleChange();
            }

            this.hasUnsavedChanges = false;
            this.hideDraftsPanel();
            this.showToast('Draft restored successfully!', 'success');
        } catch (error) {
            console.error('Failed to restore draft:', error);
            this.showToast('Failed to restore draft', 'error');
        }
    }

    deleteDraft(draftId) {
        if (!confirm('Delete this draft?')) {
            return;
        }

        try {
            let drafts = this.loadDrafts();
            drafts = drafts.filter(d => d.id !== draftId);
            localStorage.setItem('imagegen_drafts', JSON.stringify(drafts));

            this.renderDraftsList();
            this.showToast('Draft deleted', 'info');
        } catch (error) {
            console.error('Failed to delete draft:', error);
            this.showToast('Failed to delete draft', 'error');
        }
    }

    showDraftsPanel() {
        this.renderDraftsList();
        this.draftsPanel.classList.add('active');
    }

    hideDraftsPanel() {
        this.draftsPanel.classList.remove('active');
    }

    renderDraftsList() {
        const drafts = this.loadDrafts();
        const listContainer = document.getElementById('draftsList');

        if (!listContainer) return;

        if (drafts.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-drafts">
                    <svg viewBox="0 0 24 24" width="48" height="48">
                        <path stroke="currentColor" stroke-width="2" fill="none" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    <p>No drafts yet</p>
                    <small>Drafts will be saved automatically every 30 seconds</small>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = drafts.map(draft => this.renderDraftCard(draft)).join('');
    }

    renderDraftCard(draft) {
        const date = new Date(draft.timestamp);
        const timeAgo = this.getTimeAgo(date);
        const preview = this.getTextPreview(draft.text);

        return `
            <div class="draft-card" data-draft-id="${draft.id}">
                <div class="draft-header">
                    <div class="draft-time">
                        <svg viewBox="0 0 24 24" width="14" height="14">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
                            <path stroke="currentColor" stroke-width="2" d="M12 6v6l4 2"/>
                        </svg>
                        ${timeAgo}
                    </div>
                    <div class="draft-meta">
                        ${draft.metadata.lineCount} lines • ${draft.metadata.imageCount} images
                    </div>
                </div>
                <div class="draft-preview">
                    ${preview}
                </div>
                <div class="draft-actions">
                    <button class="btn-restore-draft" title="Restore this draft">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path stroke="currentColor" stroke-width="2" fill="none" d="M3 7v6h6M3 13a9 9 0 1015-6.7"/>
                        </svg>
                        Restore
                    </button>
                    <button class="btn-delete-draft" title="Delete this draft">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path stroke="currentColor" stroke-width="2" fill="none" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    getTextPreview(text, maxLength = 100) {
        if (!text) return '<em>Empty draft</em>';
        const preview = text.slice(0, maxLength);
        return preview + (text.length > maxLength ? '...' : '');
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

        return date.toLocaleDateString();
    }

    cleanOldDrafts() {
        try {
            const drafts = this.loadDrafts();
            const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

            const filteredDrafts = drafts.filter(draft => {
                const draftTime = new Date(draft.timestamp).getTime();
                return draftTime > sevenDaysAgo;
            });

            if (filteredDrafts.length !== drafts.length) {
                localStorage.setItem('imagegen_drafts', JSON.stringify(filteredDrafts));
                console.log(`Cleaned ${drafts.length - filteredDrafts.length} old drafts`);
            }
        } catch (error) {
            console.error('Failed to clean old drafts:', error);
        }
    }

    updateStatusUI(status) {
        const statusText = this.statusBar?.querySelector('.status-text');
        const savingIcon = this.statusBar?.querySelector('.status-icon.saving');
        const savedIcon = this.statusBar?.querySelector('.status-icon.saved');

        if (!statusText || !savingIcon || !savedIcon) return;

        switch (status) {
            case 'saving':
                statusText.textContent = 'Saving...';
                savingIcon.style.display = 'block';
                savedIcon.style.display = 'none';
                this.statusBar.classList.add('saving');
                this.statusBar.classList.remove('saved', 'unsaved');
                break;

            case 'saved':
                statusText.textContent = 'Auto-saved';
                savingIcon.style.display = 'none';
                savedIcon.style.display = 'block';
                this.statusBar.classList.add('saved');
                this.statusBar.classList.remove('saving', 'unsaved');
                break;

            case 'unsaved':
                statusText.textContent = 'Unsaved changes';
                savingIcon.style.display = 'none';
                savedIcon.style.display = 'none';
                this.statusBar.classList.add('unsaved');
                this.statusBar.classList.remove('saving', 'saved');
                break;

            case 'error':
                statusText.textContent = 'Save failed';
                savingIcon.style.display = 'none';
                savedIcon.style.display = 'none';
                this.statusBar.classList.add('error');
                break;
        }
    }

    updateLastSavedTime() {
        const timeDisplay = this.statusBar?.querySelector('.last-saved-time');
        if (!timeDisplay || !this.lastSaveTime) return;

        const updateTime = () => {
            const timeAgo = this.getTimeAgo(this.lastSaveTime);
            timeDisplay.textContent = timeAgo;
        };

        updateTime();

        // Update every minute
        setInterval(updateTime, 60000);
    }

    showToast(message, type) {
        if (this.app.components?.v6ui) {
            this.app.components.v6ui.showToast(message, type, 2000);
        }
    }

    injectStyles() {
        if (document.getElementById('draftManagerStyles')) return;

        const style = document.createElement('style');
        style.id = 'draftManagerStyles';
        style.textContent = `
            .draft-status-bar {
                background: #f9fafb;
                border-bottom: 1px solid #e5e7eb;
                padding: 8px 20px;
                display: flex;
                justify-content: center;
                position: sticky;
                top: 0;
                z-index: 100;
            }

            .draft-status-content {
                display: flex;
                align-items: center;
                gap: 16px;
                font-size: 0.875rem;
            }

            .status-indicator {
                display: flex;
                align-items: center;
                gap: 6px;
                color: #6b7280;
            }

            .draft-status-bar.saving .status-indicator {
                color: #3b82f6;
            }

            .draft-status-bar.saved .status-indicator {
                color: #10b981;
            }

            .draft-status-bar.unsaved .status-indicator {
                color: #f59e0b;
            }

            .draft-status-bar.error .status-indicator {
                color: #ef4444;
            }

            .status-icon.saving .spinner {
                animation: rotate 1s linear infinite;
            }

            @keyframes rotate {
                100% { transform: rotate(360deg); }
            }

            .last-saved-time {
                color: #9ca3af;
                font-size: 0.8125rem;
            }

            .btn-drafts {
                background: white;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                padding: 6px 12px;
                display: flex;
                align-items: center;
                gap: 6px;
                cursor: pointer;
                font-size: 0.875rem;
                color: #374151;
                font-weight: 500;
                transition: all 0.2s;
            }

            .btn-drafts:hover {
                background: #f3f4f6;
                border-color: #9ca3af;
            }

            .btn-drafts svg {
                stroke: currentColor;
            }

            .drafts-panel-container {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
                z-index: 10002;
                display: none;
                align-items: center;
                justify-content: center;
            }

            .drafts-panel-container.active {
                display: flex;
            }

            .drafts-panel {
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                width: 90%;
                max-width: 700px;
                max-height: 80vh;
                display: flex;
                flex-direction: column;
                animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            .drafts-header {
                padding: 20px;
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 16px 16px 0 0;
            }

            .drafts-header h3 {
                margin: 0;
                font-size: 1.25rem;
                color: white;
            }

            .btn-close-drafts {
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 8px;
                padding: 8px;
                cursor: pointer;
                color: white;
                transition: all 0.2s;
            }

            .btn-close-drafts:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            .drafts-content {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }

            .drafts-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .draft-card {
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 16px;
                transition: all 0.2s;
            }

            .draft-card:hover {
                border-color: #667eea;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
            }

            .draft-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }

            .draft-time {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 0.875rem;
                font-weight: 600;
                color: #374151;
            }

            .draft-time svg {
                stroke: currentColor;
            }

            .draft-meta {
                font-size: 0.75rem;
                color: #9ca3af;
            }

            .draft-preview {
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 12px;
                font-size: 0.875rem;
                color: #6b7280;
                line-height: 1.6;
                max-height: 80px;
                overflow: hidden;
            }

            .draft-preview em {
                color: #9ca3af;
            }

            .draft-actions {
                display: flex;
                gap: 8px;
            }

            .btn-restore-draft,
            .btn-delete-draft {
                flex: 1;
                padding: 8px 12px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                cursor: pointer;
                font-size: 0.875rem;
                font-weight: 500;
                transition: all 0.2s;
                border: none;
            }

            .btn-restore-draft {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            .btn-restore-draft:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }

            .btn-delete-draft {
                background: white;
                border: 1px solid #e5e7eb;
                color: #6b7280;
            }

            .btn-delete-draft:hover {
                background: #fee2e2;
                border-color: #fecaca;
                color: #dc2626;
            }

            .btn-restore-draft svg,
            .btn-delete-draft svg {
                stroke: currentColor;
            }

            .empty-drafts {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 60px 20px;
                color: #9ca3af;
            }

            .empty-drafts svg {
                margin-bottom: 16px;
                opacity: 0.5;
                stroke: currentColor;
            }

            .empty-drafts p {
                font-weight: 600;
                margin: 0 0 8px 0;
            }

            .empty-drafts small {
                font-size: 0.875rem;
            }

            .drafts-footer {
                padding: 16px 20px;
                border-top: 1px solid #e5e7eb;
                background: #f9fafb;
                border-radius: 0 0 16px 16px;
            }

            .drafts-footer small {
                color: #6b7280;
                font-size: 0.75rem;
            }

            @media (max-width: 768px) {
                .drafts-panel {
                    width: 95%;
                    max-height: 90vh;
                }

                .draft-status-content {
                    gap: 8px;
                }

                .last-saved-time {
                    display: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    destroy() {
        this.stopAutoSave();
    }
}
