/* =====================================================
   DARK MODE MODULE (v12.0)
   AI-Powered Design Excellence
   ===================================================== */

export class DarkMode {
    constructor() {
        this.isDark = false;
        this.storageKey = 'kv-dark-mode';
        this.transitionDuration = 300; // ms
        this.initialized = false;
    }

    init() {
        // Check saved preference or system preference
        const savedMode = localStorage.getItem(this.storageKey);

        if (savedMode !== null) {
            this.isDark = savedMode === 'dark';
        } else {
            // Check system preference
            this.isDark = window.matchMedia &&
                          window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        // Apply initial theme without transition
        this.applyTheme(false);

        // Create toggle button
        this.createToggleButton();

        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)')
                .addEventListener('change', (e) => {
                    if (localStorage.getItem(this.storageKey) === null) {
                        this.isDark = e.matches;
                        this.applyTheme(true);
                    }
                });
        }

        // Keyboard shortcut: Ctrl+Shift+D
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggle();
            }
        });

        this.initialized = true;
        console.log('🌙 Dark Mode initialized:', this.isDark ? 'Dark' : 'Light');
    }

    createToggleButton() {
        // Find header actions
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions) return;

        const button = document.createElement('button');
        button.id = 'darkModeToggle';
        button.className = 'header-btn v12-dark-mode-toggle';
        button.title = 'Toggle Dark Mode (Ctrl+Shift+D)';
        button.style.cssText = `
            background: rgba(255,255,255,0.15);
            border-color: rgba(255,255,255,0.3);
            color: white;
            position: relative;
            overflow: hidden;
        `;

        button.innerHTML = `
            <svg class="theme-icon sun-icon" viewBox="0 0 24 24" width="20" height="20">
                <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2" fill="none"/>
                <path stroke="currentColor" stroke-width="2" stroke-linecap="round"
                      d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
            </svg>
            <svg class="theme-icon moon-icon" viewBox="0 0 24 24" width="20" height="20" style="display: none;">
                <path stroke="currentColor" stroke-width="2" fill="none"
                      d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
            </svg>
        `;

        button.addEventListener('click', () => this.toggle());

        // Insert before help button
        const helpBtn = document.getElementById('helpBtn');
        if (helpBtn) {
            headerActions.insertBefore(button, helpBtn);
        } else {
            headerActions.appendChild(button);
        }

        this.updateToggleButton();
    }

    updateToggleButton() {
        const button = document.getElementById('darkModeToggle');
        if (!button) return;

        const sunIcon = button.querySelector('.sun-icon');
        const moonIcon = button.querySelector('.moon-icon');

        if (this.isDark) {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
    }

    toggle() {
        this.isDark = !this.isDark;
        localStorage.setItem(this.storageKey, this.isDark ? 'dark' : 'light');
        this.applyTheme(true);
        this.updateToggleButton();

        // Show toast
        if (window.imageTextApp?.components?.v6ui) {
            window.imageTextApp.components.v6ui.showToast(
                `🌙 ${this.isDark ? 'Dark' : 'Light'} mode activated`,
                'success',
                2000
            );
        }
    }

    applyTheme(withTransition = true) {
        const root = document.documentElement;

        // Add transition class if needed
        if (withTransition) {
            root.classList.add('theme-transitioning');
            setTimeout(() => {
                root.classList.remove('theme-transitioning');
            }, this.transitionDuration);
        }

        if (this.isDark) {
            root.classList.add('dark-mode');
            this.applyDarkColors();
        } else {
            root.classList.remove('dark-mode');
            this.applyLightColors();
        }
    }

    applyDarkColors() {
        const root = document.documentElement;

        // Core colors
        root.style.setProperty('--bg-primary', '#0f172a');
        root.style.setProperty('--bg-secondary', '#1e293b');
        root.style.setProperty('--bg-tertiary', '#334155');

        // Text colors
        root.style.setProperty('--text-primary', '#f1f5f9');
        root.style.setProperty('--text-secondary', '#cbd5e1');
        root.style.setProperty('--text-tertiary', '#94a3b8');

        // Border colors
        root.style.setProperty('--border-color', '#334155');
        root.style.setProperty('--border-light', '#475569');

        // Component colors
        root.style.setProperty('--card-bg', 'rgba(30, 41, 59, 0.8)');
        root.style.setProperty('--card-border', 'rgba(100, 116, 139, 0.2)');
        root.style.setProperty('--input-bg', '#1e293b');
        root.style.setProperty('--input-border', '#475569');

        // Glassmorphism
        root.style.setProperty('--glass-bg', 'rgba(30, 41, 59, 0.7)');
        root.style.setProperty('--glass-border', 'rgba(148, 163, 184, 0.1)');

        // Shadows
        root.style.setProperty('--shadow-sm', '0 2px 8px rgba(0, 0, 0, 0.5)');
        root.style.setProperty('--shadow-md', '0 4px 16px rgba(0, 0, 0, 0.6)');
        root.style.setProperty('--shadow-lg', '0 8px 32px rgba(0, 0, 0, 0.7)');

        // Header gradient
        const header = document.querySelector('.app-header');
        if (header) {
            header.style.background = 'linear-gradient(135deg, #1e3a8a 0%, #581c87 100%)';
        }
    }

    applyLightColors() {
        const root = document.documentElement;

        // Reset to light mode (original) colors
        root.style.setProperty('--bg-primary', '#ffffff');
        root.style.setProperty('--bg-secondary', '#f8fafc');
        root.style.setProperty('--bg-tertiary', '#f1f5f9');

        root.style.setProperty('--text-primary', '#0f172a');
        root.style.setProperty('--text-secondary', '#475569');
        root.style.setProperty('--text-tertiary', '#64748b');

        root.style.setProperty('--border-color', '#e2e8f0');
        root.style.setProperty('--border-light', '#f1f5f9');

        root.style.setProperty('--card-bg', '#ffffff');
        root.style.setProperty('--card-border', '#e2e8f0');
        root.style.setProperty('--input-bg', '#ffffff');
        root.style.setProperty('--input-border', '#d1d5db');

        root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.7)');
        root.style.setProperty('--glass-border', 'rgba(0, 0, 0, 0.1)');

        root.style.setProperty('--shadow-sm', '0 1px 3px rgba(0, 0, 0, 0.1)');
        root.style.setProperty('--shadow-md', '0 4px 6px rgba(0, 0, 0, 0.1)');
        root.style.setProperty('--shadow-lg', '0 10px 25px rgba(0, 0, 0, 0.1)');

        const header = document.querySelector('.app-header');
        if (header) {
            header.style.background = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
        }
    }

    getCurrentTheme() {
        return this.isDark ? 'dark' : 'light';
    }

    setTheme(theme) {
        if (theme === 'dark' && !this.isDark) {
            this.toggle();
        } else if (theme === 'light' && this.isDark) {
            this.toggle();
        }
    }
}
