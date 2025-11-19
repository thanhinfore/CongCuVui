/**
 * V13 Menu System - Tab & Sub-group Management
 * Handles tab navigation and collapsible sub-groups
 * V14: Enhanced with proper cleanup to prevent memory leaks
 */

export class V13Menu {
    constructor() {
        this.tabs = document.querySelectorAll('.v13-tab');
        this.tabPanels = document.querySelectorAll('.v13-tab-panel');
        this.subGroups = document.querySelectorAll('.v13-sub-group');
        this.outputGroup = document.querySelector('.v13-section-group.collapsed');

        // V14: Store observer reference for cleanup
        this.observer = null;

        this.init();
    }

    init() {
        this.setupTabs();
        this.setupSubGroups();
        this.setupOutputToggle();
        this.updateBackgroundBadge();
        console.log('V13 Menu System initialized');
    }

    /**
     * Setup tab navigation for Background section
     */
    setupTabs() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    /**
     * Switch active tab
     */
    switchTab(tabName) {
        // Update tab buttons
        this.tabs.forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update tab panels
        this.tabPanels.forEach(panel => {
            if (panel.dataset.panel === tabName) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });

        // Update badge
        this.updateBackgroundBadge(tabName);

        console.log(`Switched to tab: ${tabName}`);
    }

    /**
     * Setup collapsible sub-groups
     */
    setupSubGroups() {
        this.subGroups.forEach(subGroup => {
            const header = subGroup.querySelector('.v13-sub-header');
            if (!header) return;

            header.addEventListener('click', () => {
                this.toggleSubGroup(subGroup);
            });
        });
    }

    /**
     * Toggle sub-group expand/collapse
     */
    toggleSubGroup(subGroup) {
        const isExpanded = subGroup.classList.contains('expanded');

        if (isExpanded) {
            subGroup.classList.remove('expanded');
            subGroup.classList.add('collapsed');
        } else {
            subGroup.classList.remove('collapsed');
            subGroup.classList.add('expanded');
        }

        console.log(`Sub-group toggled: ${isExpanded ? 'collapsed' : 'expanded'}`);
    }

    /**
     * Setup Output section toggle
     */
    setupOutputToggle() {
        if (!this.outputGroup) return;

        const header = this.outputGroup.querySelector('.v13-group-header');
        const content = this.outputGroup.querySelector('.v13-group-content');

        if (!header || !content) return;

        // Use onclick from HTML or add listener here
        // Already has onclick="this.parentElement.classList.toggle('collapsed')" in HTML
        // But we also need to toggle content display
        const toggleOutput = () => {
            const isCollapsed = this.outputGroup.classList.contains('collapsed');
            if (isCollapsed) {
                content.style.display = 'none';
            } else {
                content.style.display = 'block';
            }
        };

        // Initial state
        toggleOutput();

        // V14: Observer for class changes (store reference for cleanup)
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    toggleOutput();
                }
            });
        });

        this.observer.observe(this.outputGroup, { attributes: true });
    }

    /**
     * Update background badge based on active tab or images loaded
     */
    updateBackgroundBadge(tabName) {
        const badge = document.getElementById('backgroundBadge');
        if (!badge) return;

        const activeTab = tabName || document.querySelector('.v13-tab.active')?.dataset.tab || 'upload';

        // Get image count from state if available
        const imageCount = window.appState?.images?.length || 0;

        if (imageCount > 0) {
            badge.textContent = `${imageCount} image${imageCount > 1 ? 's' : ''}`;
            badge.style.background = 'rgba(52, 199, 89, 0.15)';
            badge.style.color = 'rgb(52, 199, 89)';
        } else {
            const tabLabels = {
                'upload': 'Upload files',
                'library': 'From library',
                'colors': 'Solid colors',
                'templates': 'Use template'
            };
            badge.textContent = tabLabels[activeTab] || 'Select source';
            badge.style.background = '';
            badge.style.color = '';
        }
    }

    /**
     * Programmatically expand a sub-group (used by other modules)
     */
    expandSubGroup(subGroupIndex) {
        const subGroup = this.subGroups[subGroupIndex];
        if (subGroup && subGroup.classList.contains('collapsed')) {
            subGroup.classList.remove('collapsed');
            subGroup.classList.add('expanded');
        }
    }

    /**
     * Programmatically collapse a sub-group
     */
    collapseSubGroup(subGroupIndex) {
        const subGroup = this.subGroups[subGroupIndex];
        if (subGroup && subGroup.classList.contains('expanded')) {
            subGroup.classList.remove('expanded');
            subGroup.classList.add('collapsed');
        }
    }

    /**
     * Expand output section (used when user enables numbering/footer)
     */
    expandOutputSection() {
        if (this.outputGroup && this.outputGroup.classList.contains('collapsed')) {
            this.outputGroup.classList.remove('collapsed');
            const content = this.outputGroup.querySelector('.v13-group-content');
            if (content) content.style.display = 'block';
        }
    }

    /**
     * Collapse output section
     */
    collapseOutputSection() {
        if (this.outputGroup && !this.outputGroup.classList.contains('collapsed')) {
            this.outputGroup.classList.add('collapsed');
            const content = this.outputGroup.querySelector('.v13-group-content');
            if (content) content.style.display = 'none';
        }
    }

    /**
     * V14: Cleanup method to prevent memory leaks
     * Call this when disposing the menu system
     */
    destroy() {
        // Disconnect observer
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
            console.log('V13 Menu: Observer disconnected');
        }

        // Remove event listeners (if needed for full cleanup)
        // Note: Event listeners on DOM elements are automatically garbage collected
        // when the elements are removed, but we keep this for explicit cleanup
    }
}

// Export singleton instance
export const v13Menu = new V13Menu();
