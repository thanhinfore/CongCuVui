/* =====================================================
   DESKTOPTABS.JS - Desktop Tab Navigation Module
   V21 Enhancement - 4 Workflow Tabs for Desktop
   ===================================================== */

export class DesktopTabs {
    constructor() {
        this.initialized = false;
        this.activeTab = 'content';
        this.tabsContainer = null;
        this.tabButtons = null;
        this.tabContents = null;
        this.controlPanel = null;
        this.previewPanel = null;

        // Breakpoint for desktop mode
        this.desktopBreakpoint = 769;
    }

    init() {
        if (this.initialized) return;

        // Only initialize on desktop
        if (!this.isDesktop()) {
            console.log('Desktop tabs: Mobile view detected, skipping initialization');
            return;
        }

        // Get DOM references
        this.tabsContainer = document.getElementById('desktopTabs');
        this.controlPanel = document.querySelector('.control-panel');
        this.previewPanel = document.querySelector('.preview-panel');

        if (!this.tabsContainer) {
            console.log('Desktop tabs: Container not found');
            return;
        }

        this.tabButtons = this.tabsContainer.querySelectorAll('.v21-tab-btn');
        this.tabContents = document.querySelectorAll('.v21-tab-content');

        // Enable desktop tabs mode
        document.body.classList.add('v21-tabs-enabled');

        // Setup event listeners
        this.setupEventListeners();

        // Restore last active tab
        const savedTab = localStorage.getItem('activeDesktopTab') || 'content';
        this.setActiveTab(savedTab);

        // Setup resize handler
        this.setupResizeHandler();

        this.initialized = true;
        console.log('Desktop tabs V21 initialized');
    }

    isDesktop() {
        return window.innerWidth >= this.desktopBreakpoint;
    }

    setupEventListeners() {
        // Tab button clicks
        this.tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = button.dataset.tab;
                this.setActiveTab(tab);
            });
        });

        // Keyboard navigation
        this.tabsContainer.addEventListener('keydown', (e) => {
            const tabs = Array.from(this.tabButtons);
            const currentIndex = tabs.findIndex(t => t.classList.contains('active'));

            if (e.key === 'ArrowRight') {
                e.preventDefault();
                const nextIndex = (currentIndex + 1) % tabs.length;
                tabs[nextIndex].focus();
                this.setActiveTab(tabs[nextIndex].dataset.tab);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                tabs[prevIndex].focus();
                this.setActiveTab(tabs[prevIndex].dataset.tab);
            }
        });
    }

    setActiveTab(tab) {
        if (!this.isDesktop()) return;

        this.activeTab = tab;

        // Update tab buttons
        this.tabButtons.forEach(button => {
            const isActive = button.dataset.tab === tab;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-selected', isActive);
        });

        // Update tab contents
        this.tabContents.forEach(content => {
            const isActive = content.dataset.tabContent === tab;
            content.classList.toggle('v21-active', isActive);
        });

        // Update body data attribute for CSS targeting
        document.body.dataset.desktopTab = tab;

        // Handle preview tab special case
        if (tab === 'preview') {
            // Full-width preview
            if (this.controlPanel) {
                this.controlPanel.style.display = 'none';
            }
            // Trigger re-render
            if (window.renderImages) {
                setTimeout(() => window.renderImages(), 100);
            }
        } else {
            // Show control panel
            if (this.controlPanel) {
                this.controlPanel.style.display = '';
            }
        }

        // Save preference
        localStorage.setItem('activeDesktopTab', tab);

        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('v21-tab-changed', {
            detail: { tab }
        }));
    }

    setupResizeHandler() {
        let resizeTimeout;

        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 150);
        });
    }

    handleResize() {
        const wasDesktop = this.initialized;
        const isNowDesktop = this.isDesktop();

        if (isNowDesktop && !wasDesktop) {
            // Switched to desktop
            this.init();
        } else if (!isNowDesktop && wasDesktop) {
            // Switched to mobile
            this.destroy();
        }
    }

    destroy() {
        if (!this.initialized) return;

        // Remove desktop tabs mode
        document.body.classList.remove('v21-tabs-enabled');
        delete document.body.dataset.desktopTab;

        // Show all tab contents (for mobile view)
        this.tabContents?.forEach(content => {
            content.classList.remove('v21-active');
        });

        // Ensure control panel is visible
        if (this.controlPanel) {
            this.controlPanel.style.display = '';
        }

        this.initialized = false;
        console.log('Desktop tabs destroyed');
    }

    // Get current active tab
    getActiveTab() {
        return this.activeTab;
    }

    // Navigate to next tab
    nextTab() {
        const tabs = ['content', 'design', 'export', 'preview'];
        const currentIndex = tabs.indexOf(this.activeTab);
        const nextIndex = (currentIndex + 1) % tabs.length;
        this.setActiveTab(tabs[nextIndex]);
    }

    // Navigate to previous tab
    prevTab() {
        const tabs = ['content', 'design', 'export', 'preview'];
        const currentIndex = tabs.indexOf(this.activeTab);
        const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        this.setActiveTab(tabs[prevIndex]);
    }
}

// Auto-initialize
let desktopTabsInstance = null;

export function initDesktopTabs() {
    if (!desktopTabsInstance) {
        desktopTabsInstance = new DesktopTabs();
    }
    desktopTabsInstance.init();
    return desktopTabsInstance;
}

export function getDesktopTabs() {
    return desktopTabsInstance;
}
