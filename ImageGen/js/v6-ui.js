/* =====================================================
   V6-UI.JS - Version 6.0 UI Enhancement Module
   Modern Tabs, Collapsible Sections, and Interactions
   ===================================================== */

export class V6UI {
    constructor() {
        this.currentTab = 'content';
        this.collapsedSections = new Set();
        this.initialize();
    }

    initialize() {
        this.setupTabs();
        this.setupCollapsibleSections();
        this.setupScrollEffects();
        console.log('✨ V6 UI initialized');
    }

    /**
     * Setup tab navigation system
     */
    setupTabs() {
        const tabs = document.querySelectorAll('.v6-tab');
        const panels = document.querySelectorAll('.v6-tab-panel');

        if (tabs.length === 0) return;

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                this.switchTab(tabId, tabs, panels);
            });
        });

        // Keyboard navigation for tabs
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                const tabKeys = {
                    '1': 'content',
                    '2': 'style',
                    '3': 'effects',
                    '4': 'export'
                };

                if (tabKeys[e.key]) {
                    e.preventDefault();
                    const targetTab = document.querySelector(`[data-tab="${tabKeys[e.key]}"]`);
                    if (targetTab) {
                        this.switchTab(tabKeys[e.key], tabs, panels);
                    }
                }
            }
        });
    }

    /**
     * Switch between tabs
     */
    switchTab(tabId, tabs, panels) {
        // Update active tab
        tabs.forEach(tab => {
            if (tab.dataset.tab === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update active panel
        panels.forEach(panel => {
            if (panel.dataset.panel === tabId) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });

        this.currentTab = tabId;

        // Store in localStorage for persistence
        localStorage.setItem('v6-current-tab', tabId);
    }

    /**
     * Setup collapsible sections
     */
    setupCollapsibleSections() {
        const sections = document.querySelectorAll('.v6-section');

        sections.forEach(section => {
            const header = section.querySelector('.v6-section-header');
            if (!header) return;

            header.addEventListener('click', () => {
                this.toggleSection(section);
            });
        });

        // Load collapsed state from localStorage
        const savedState = localStorage.getItem('v6-collapsed-sections');
        if (savedState) {
            try {
                this.collapsedSections = new Set(JSON.parse(savedState));
                this.collapsedSections.forEach(sectionId => {
                    const section = document.getElementById(sectionId);
                    if (section) {
                        section.classList.add('collapsed');
                    }
                });
            } catch (e) {
                console.warn('Failed to load collapsed sections state');
            }
        }
    }

    /**
     * Toggle section collapse state
     */
    toggleSection(section) {
        const sectionId = section.id;

        if (section.classList.contains('collapsed')) {
            section.classList.remove('collapsed');
            this.collapsedSections.delete(sectionId);
        } else {
            section.classList.add('collapsed');
            this.collapsedSections.add(sectionId);
        }

        // Save state to localStorage
        localStorage.setItem('v6-collapsed-sections', JSON.stringify([...this.collapsedSections]));
    }

    /**
     * Expand a specific section
     */
    expandSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section && section.classList.contains('collapsed')) {
            this.toggleSection(section);
        }
    }

    /**
     * Collapse a specific section
     */
    collapseSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section && !section.classList.contains('collapsed')) {
            this.toggleSection(section);
        }
    }

    /**
     * Setup scroll effects for header
     */
    setupScrollEffects() {
        const header = document.querySelector('.v6-header');
        if (!header) return;

        let lastScroll = 0;

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;

            if (currentScroll > 10) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            lastScroll = currentScroll;
        });
    }

    /**
     * Show a toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `v6-toast ${type}`;
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="flex: 1;">${message}</div>
            </div>
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'v6-slideDown 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    /**
     * Get current tab
     */
    getCurrentTab() {
        return this.currentTab;
    }

    /**
     * Navigate to specific tab
     */
    navigateToTab(tabId) {
        const tabs = document.querySelectorAll('.v6-tab');
        const panels = document.querySelectorAll('.v6-tab-panel');
        this.switchTab(tabId, tabs, panels);
    }

    /**
     * Expand all sections in current tab
     */
    expandAllSections() {
        const currentPanel = document.querySelector(`.v6-tab-panel[data-panel="${this.currentTab}"]`);
        if (!currentPanel) return;

        const sections = currentPanel.querySelectorAll('.v6-section');
        sections.forEach(section => {
            if (section.classList.contains('collapsed')) {
                section.classList.remove('collapsed');
                this.collapsedSections.delete(section.id);
            }
        });

        localStorage.setItem('v6-collapsed-sections', JSON.stringify([...this.collapsedSections]));
    }

    /**
     * Collapse all sections in current tab
     */
    collapseAllSections() {
        const currentPanel = document.querySelector(`.v6-tab-panel[data-panel="${this.currentTab}"]`);
        if (!currentPanel) return;

        const sections = currentPanel.querySelectorAll('.v6-section');
        sections.forEach(section => {
            if (!section.classList.contains('collapsed')) {
                section.classList.add('collapsed');
                this.collapsedSections.add(section.id);
            }
        });

        localStorage.setItem('v6-collapsed-sections', JSON.stringify([...this.collapsedSections]));
    }
}

// Add slide down animation for toast
const style = document.createElement('style');
style.textContent = `
    @keyframes v6-slideDown {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(20px);
        }
    }
`;
document.head.appendChild(style);
